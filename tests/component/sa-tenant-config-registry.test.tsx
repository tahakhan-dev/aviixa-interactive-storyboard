import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import type { RoleId } from '@/domain/roles'
import { type ScreenStateId } from '@/ui/screen-state'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { TenantConfigRegistryScreen } from '../../app/super-admin/tenant-configuration-registry/TenantConfigRegistryScreen'
import { GOVERNED_SETTINGS, GOVERNED_SETTING_COUNT_NOTE, PLATFORM_FIXED_ITEMS, REGISTRY_ABSENT_CONTROLS, REGISTRY_ENTRY_STATES, REGISTRY_PLATFORM_ROLES, REGISTRY_SOURCE_CONFLICTS, REGISTRY_UNSPECIFIED_IN_SOURCE, REGISTRY_WORKFLOWS, WRITABLE_SETTINGS, WRITE_CLASSES, validateWrite } from '../../app/super-admin/tenant-configuration-registry/fixtures'

const MODULE = saModuleById('MOD-SA-19')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */

/**
 * Queried by role rather than by label text: a `<section aria-labelledby>`
 * is itself a labelled element, so `getByLabelText(/write class/i)` also
 * matches the "Three write classes" section. Naming the role keeps the
 * query on the control it means.
 */
function control(name: RegExp, role: 'combobox' | 'textbox' = 'combobox'): HTMLElement {
  return screen.getByRole(role, { name })
}

function setRole(role: RoleId): void {
  fireEvent.change(control(/view as platform role/i), { target: { value: role } })
}

function setScreenState(state: ScreenStateId): void {
  fireEvent.change(control(/screen state/i), { target: { value: state } })
}

function setWriteClass(writeClassId: string): void {
  fireEvent.change(control(/^write class$/i), { target: { value: writeClassId } })
}

function submitWrite(settingId: string, writeClassId: string, value: string): void {
  fireEvent.change(control(/^setting$/i), { target: { value: settingId } })
  setWriteClass(writeClassId)
  fireEvent.change(control(/proposed value/i, 'textbox'), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: /submit the write/i }))
}

/** Every interactive element inside a region — the ABSENT gate's instrument. */
function interactives(container: HTMLElement): Element[] {
  return Array.from(
    container.querySelectorAll(
      'button, a, input, select, textarea, [role=switch], [role=button], [tabindex]',
    ),
  )
}

describe('MOD-SA-19 Tenant-Configuration Registry — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, one h1', () => {
    render(<TenantConfigRegistryScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-19 · Operations layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<TenantConfigRegistryScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates SCR-SA-26 without keying any route on a bare number', () => {
    const { container } = render(<TenantConfigRegistryScreen />)
    expect(screen.getAllByText(/SCR-SA-26/).length).toBeGreaterThan(0)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  it('uses none of the four forbidden words in any role, state or write class, outcomes included', () => {
    const forbidden = /tamper-evident|chained|signed|verified/i
    const { container } = render(<TenantConfigRegistryScreen />)

    // The three switchers are resolved once. Querying them by accessible name
    // inside the loop walked the whole screen's accessibility tree 432 times,
    // which is what pushed this test past vitest's 5000ms default under a
    // loaded full-suite run (12997ms) — a gate that goes red under load gets
    // deleted by the next person who sees it.
    const roleSelect = control(/view as platform role/i)
    const stateSelect = control(/screen state/i)
    const classSelect = control(/^write class$/i)

    // Every permutation the screen's own switchers reach: 4 roles x 12 states
    // x 3 write classes. Rendering only the default role and state proves the
    // property for one of 144 screens.
    for (const role of REGISTRY_PLATFORM_ROLES) {
      fireEvent.change(roleSelect, { target: { value: role.id } })
      for (const state of SA_APPLICABLE_STATES) {
        fireEvent.change(stateSelect, { target: { value: state.id } })
        for (const c of WRITE_CLASSES) {
          fireEvent.change(classSelect, { target: { value: c.id } })
          const where = `${role.id} / ${state.id} / ${c.id}`
          const text = container.textContent ?? ''
          // A cached node React had detached would swallow every later change
          // and let this loop assert one screen 144 times over, so the walk is
          // read back off the screen: the switchers are still the live ones,
          // and the state contract on show is this state's, not the last one's.
          // (The state's `id — name` would not do: the switcher renders that
          // string as an <option> for all twelve regardless of selection.)
          for (const node of [roleSelect, stateSelect, classSelect]) {
            expect(node.isConnected, where).toBe(true)
          }
          // `isConnected` catches a detached node; it does NOT catch a
          // controlled <select> whose onChange is ignored, which is how these
          // actually break. Without the two assertions below, freezing the
          // write-class setter leaves all 144 permutations green and the test
          // proves its named property on the state axis alone. `.value`
          // reflects the current selection rather than the option list, so it
          // avoids the <option>-always-present trap.
          expect((roleSelect as HTMLSelectElement).value, `role axis frozen at ${where}`).toBe(role.id)
          expect((classSelect as HTMLSelectElement).value, `write-class axis frozen at ${where}`).toBe(c.id)
          expect(text, where).toContain(state.contract)
          expect(text, where).not.toMatch(forbidden)
        }
      }
    }

    // Plus the three write-outcome renderings, which no switcher leaves on
    // screen: rejection, acceptance, and the critical-class routing.
    setRole('ROOT_SUPER_ADMIN')
    setScreenState('STATE-03')
    submitWrite('record-finish-window', 'current-value', '12')
    expect(container.textContent ?? '', 'rejected outcome').not.toMatch(forbidden)
    submitWrite('record-finish-window', 'current-value', '36')
    expect(container.textContent ?? '', 'accepted outcome').not.toMatch(forbidden)
    submitWrite('clock-skew-threshold', 'default', '4')
    expect(container.textContent ?? '', 'engineering-class outcome').not.toMatch(forbidden)
    setWriteClass('bound')
    fireEvent.click(screen.getByRole('button', { name: /submit the write/i }))
    expect(container.textContent ?? '', 'critical-class outcome').not.toMatch(forbidden)
  })

  it('resolves tenant content only to the session-request form, never to a record', () => {
    const { container } = render(<TenantConfigRegistryScreen />)
    const hrefs = Array.from(container.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'))
    for (const href of hrefs) expect(href).toMatch(/^\/super-admin\//)
    expect(hrefs.some((h) => /^\/super-admin\/support-access\/?$/.test(h ?? ''))).toBe(true)
  })
})

describe('MOD-SA-19 — the three values and the seventeen governed settings', () => {
  it('renders platform default, bound and current value for every setting it carries', () => {
    render(<TenantConfigRegistryScreen />)
    const table = screen.getByRole('table', { name: /registry entries/i })
    for (const header of ['Platform default', 'Bound', 'Current tenant value']) {
      expect(within(table).getByText(header)).toBeDefined()
    }
    for (const s of GOVERNED_SETTINGS) {
      expect(within(table).getAllByText(s.name).length).toBeGreaterThan(0)
    }
  })

  it('states the seventeen-count and that the source enumerates fewer, instead of minting names', () => {
    render(<TenantConfigRegistryScreen />)
    expect(screen.getByText(GOVERNED_SETTING_COUNT_NOTE)).toBeDefined()
    expect(GOVERNED_SETTINGS.length).toBeLessThan(17)
  })

  it('carries the five OBJ-SA-REGENTRY states and gives every entry one of them', () => {
    render(<TenantConfigRegistryScreen />)
    expect(REGISTRY_ENTRY_STATES).toHaveLength(5)
    for (const s of GOVERNED_SETTINGS) {
      expect(REGISTRY_ENTRY_STATES).toContain(s.entryState)
    }
  })
})

describe('MOD-SA-19 — the rejection path is a first-class outcome', () => {
  it('rejects a looser-than-floor value at entry, states the bound, and never stores it', () => {
    render(<TenantConfigRegistryScreen />)
    submitWrite('record-finish-window', 'current-value', '12')
    const outcome = screen.getByRole('alert')
    expect(outcome.textContent).toMatch(/rejected at the point of entry/i)
    expect(outcome.textContent).toMatch(/24 hours/)
    expect(outcome.textContent).toMatch(/not stored/i)
    expect(outcome.textContent).not.toMatch(/\baccepted\b(?! and logged)/i)
  })

  it('rejects a value above a ceiling with the ceiling stated', () => {
    render(<TenantConfigRegistryScreen />)
    submitWrite('offline-credential-trust-window', 'current-value', '96')
    expect(screen.getByRole('alert').textContent).toMatch(/72 hours/)
  })

  it('separates "never accepted and logged" from "the refusal is recorded"', () => {
    render(<TenantConfigRegistryScreen />)
    submitWrite('record-finish-window', 'current-value', '12')
    expect(screen.getByRole('alert').textContent).toMatch(/refusal is recorded/i)
  })

  it('accepts a within-bound value and commits it with its audit event in one transaction', () => {
    render(<TenantConfigRegistryScreen />)
    submitWrite('record-finish-window', 'current-value', '36')
    const outcome = screen.getByRole('status', { name: /write outcome/i })
    expect(outcome.textContent).toMatch(/accepted/i)
    expect(outcome.textContent).toMatch(/same transaction/i)
  })

  it('refuses a write it cannot validate rather than accepting it (FB-SA-10)', () => {
    render(<TenantConfigRegistryScreen />)
    setScreenState('STATE-12')
    submitWrite('record-finish-window', 'current-value', '36')
    expect(screen.getByRole('alert').textContent).toMatch(/bound cannot be read/i)
  })

  it('validateWrite is a typed outcome, never a thrown exception, on every expected path', () => {
    const setting = WRITABLE_SETTINGS.find((s) => s.id === 'record-finish-window')
    expect(setting).toBeDefined()
    if (setting === undefined) return
    expect(validateWrite(setting, '12', true).kind).toBe('rejected')
    expect(validateWrite(setting, '36', true).kind).toBe('accepted')
    expect(validateWrite(setting, 'abc', true).kind).toBe('rejected')
    expect(validateWrite(setting, '36', false).kind).toBe('rejected')
    const rejected = validateWrite(setting, '12', true)
    expect(rejected.kind === 'rejected' && rejected.reason).toBe('out-of-bound')
    const unreadable = validateWrite(setting, '36', false)
    expect(unreadable.kind === 'rejected' && unreadable.reason).toBe('bound-unreadable')
  })
})

describe('MOD-SA-19 — three write classes, three approval routes', () => {
  it('carries exactly the three write classes AC-SA-19-07 names', () => {
    expect(WRITE_CLASSES.map((c) => c.id)).toEqual(['current-value', 'default', 'bound'])
  })

  it('lets the Admin write a current value and refuses the Platform Engineer with a named reason', () => {
    render(<TenantConfigRegistryScreen />)
    setRole('ADMIN')
    setWriteClass('current-value')
    expect(screen.getByRole('button', { name: /submit the write/i }).getAttribute('aria-disabled')).toBeNull()

    setRole('PLATFORM_ENGINEER')
    const button = screen.getByRole('button', { name: /submit the write/i })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    // The reason is named, not a bare "denied" — and it names the role that does hold it.
    expect(screen.getAllByText(/A current-value change platform-side is an Admin action/i).length)
      .toBeGreaterThan(0)
    expect(screen.getAllByText(/maker only/i).length).toBeGreaterThan(0)
  })

  it('routes a default change to the engineering class, with the Admin as checker', () => {
    render(<TenantConfigRegistryScreen />)
    setRole('PLATFORM_ENGINEER')
    submitWrite('clock-skew-threshold', 'default', '4')
    const outcome = screen.getByRole('status', { name: /write outcome/i })
    expect(outcome.textContent).toMatch(/engineering class/i)
    expect(outcome.textContent).toMatch(/approval/i)
  })

  it('renders a maker-checker default change as queued, never as applied (STATE-09)', () => {
    render(<TenantConfigRegistryScreen />)
    setRole('PLATFORM_ENGINEER')
    submitWrite('clock-skew-threshold', 'default', '4')
    const outcome = screen.getByRole('status', { name: /write outcome/i })
    // The bound check passing is stated, and is not the change taking effect.
    expect(outcome.textContent).toMatch(/inside the bound/i)
    expect(outcome.textContent).toMatch(/not applied/i)
    expect(outcome.textContent).toMatch(/nothing has been applied/i)
    expect(outcome.textContent).toMatch(/unchanged and stays in force/i)
    // Never the one-word verdict the applied path uses.
    expect(outcome.textContent).not.toMatch(/\baccepted\b/i)
    expect(outcome.textContent).not.toMatch(/took effect|applied on acceptance|complete/i)
  })

  it('says what the prototype actually did on an applied current-value write', () => {
    render(<TenantConfigRegistryScreen />)
    submitWrite('record-finish-window', 'current-value', '36')
    const outcome = screen.getByRole('status', { name: /write outcome/i })
    expect(outcome.textContent).toMatch(/nothing was stored/i)
    expect(outcome.textContent).toMatch(/no audit event was written/i)
  })

  it('replaces the whole action bar with the class badge for a non-root role on a bound change', () => {
    render(<TenantConfigRegistryScreen />)
    for (const role of ['ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'] as const) {
      setRole(role)
      setWriteClass('bound')
      const bar = screen.getByRole('group', { name: /write action bar/i })
      expect(within(bar).getByText(/Critical class — root approval required/i)).toBeDefined()
      expect(interactives(bar as HTMLElement)).toHaveLength(0)
    }
  })

  it('lets the root submit a bound change into the root-approval queue, and says no second approver exists', () => {
    render(<TenantConfigRegistryScreen />)
    setRole('ROOT_SUPER_ADMIN')
    setWriteClass('bound')
    fireEvent.click(screen.getByRole('button', { name: /submit the write/i }))
    const outcome = screen.getByRole('status', { name: /write outcome/i })
    expect(outcome.textContent).toMatch(/critical class/i)
    expect(outcome.textContent).toMatch(/no second approver/i)
  })

  it('shows every one of the four platform roles what it sees, including when it may not act', () => {
    render(<TenantConfigRegistryScreen />)
    for (const role of REGISTRY_PLATFORM_ROLES) {
      setRole(role.id)
      // Read never disappears: the registry table is there for all four.
      expect(screen.getByRole('table', { name: /registry entries/i })).toBeDefined()
      expect(screen.getByRole('table', { name: /conformance/i })).toBeDefined()
    }
  })
})

describe('MOD-SA-19 — conformance, aggregates and prohibitions', () => {
  it('surfaces non-conforming values after a bound tightening rather than rewriting them', () => {
    render(<TenantConfigRegistryScreen />)
    const panel = screen.getByRole('table', { name: /conformance/i })
    expect(within(panel).getAllByRole('row').length).toBeGreaterThan(1)
    expect(screen.getAllByText(/rather than rewriting/i).length).toBeGreaterThan(0)
    // ABSENT: no control rewrites a non-conforming value.
    const section = screen.getByRole('region', { name: /conformance panel/i })
    for (const el of interactives(section as HTMLElement)) {
      expect(el.textContent ?? '').not.toMatch(/rewrite|correct|force/i)
    }
  })

  it('renders every aggregate with an as-of time, degrading to stale-with-age or unavailable', () => {
    render(<TenantConfigRegistryScreen />)
    const region = screen.getByRole('region', { name: /registry conformance summary/i })
    expect(within(region).getByText(/as of/i)).toBeDefined()

    setScreenState('STATE-08')
    expect(within(screen.getByRole('region', { name: /registry conformance summary/i })).getByText(/hours old|days old/i)).toBeDefined()

    setScreenState('STATE-12')
    const unavailable = screen.getByRole('region', { name: /registry conformance summary/i })
    expect(unavailable.textContent).toMatch(/unavailable/i)
    expect(unavailable.textContent).not.toMatch(/\b0\b/)
  })

  it('STATE-13: presents no conformance count, no as-of and no report while the re-read runs', () => {
    render(<TenantConfigRegistryScreen />)
    setScreenState('STATE-13')
    const summary = screen.getByRole('region', { name: /registry conformance summary/i })
    expect(summary.textContent).toMatch(/recovering/i)
    // Neither a complete count nor a current as-of: a recovering system is
    // never shown as fully recovered.
    expect(summary.textContent).not.toMatch(/entries rendered/i)
    expect(summary.textContent).not.toMatch(/as of 2026/i)
    for (const entryState of REGISTRY_ENTRY_STATES) {
      expect(summary.textContent).not.toMatch(new RegExp(`${entryState}: \\d`, 'i'))
    }
    // And the derived report itself is withheld rather than re-listed.
    expect(screen.queryByRole('table', { name: /conformance report/i })).toBeNull()
    const panel = screen.getByRole('region', { name: /conformance panel/i })
    expect(panel.textContent).toMatch(/being re-derived and is not presented/i)
  })

  it('renders the invariants it carries as status chips, never as controls', () => {
    render(<TenantConfigRegistryScreen />)
    const section = screen.getByRole('region', { name: /enforced invariants/i })
    expect(interactives(section as HTMLElement)).toHaveLength(0)
    expect(within(section).getAllByText(/ENFORCED/).length).toBeGreaterThan(0)
  })

  it('draws no control at all — not even a disabled one — for the seven platform-fixed items', () => {
    render(<TenantConfigRegistryScreen />)
    expect(PLATFORM_FIXED_ITEMS).toHaveLength(7)
    const section = screen.getByRole('region', { name: /platform-fixed/i })
    expect(interactives(section as HTMLElement)).toHaveLength(0)
    for (const item of PLATFORM_FIXED_ITEMS) {
      expect(within(section).getByText(new RegExp(item.name, 'i'))).toBeDefined()
    }
  })

  it('renders each absent control as a note where the control would sit', () => {
    render(<TenantConfigRegistryScreen />)
    const section = screen.getByRole('region', { name: /controls that do not exist/i })
    expect(interactives(section as HTMLElement)).toHaveLength(0)
    expect(REGISTRY_ABSENT_CONTROLS.length).toBeGreaterThan(0)
    for (const c of REGISTRY_ABSENT_CONTROLS) {
      expect(within(section).getByText(c.label)).toBeDefined()
    }
  })

  it('names every unspecified affordance rather than inventing one', () => {
    render(<TenantConfigRegistryScreen />)
    const section = screen.getByRole('region', { name: /unspecified in source/i })
    expect(REGISTRY_UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const u of REGISTRY_UNSPECIFIED_IN_SOURCE) {
      expect(within(section).getByText(u.affordance)).toBeDefined()
    }
  })

  it('records the source conflicts it resolved instead of resolving them silently', () => {
    render(<TenantConfigRegistryScreen />)
    for (const c of REGISTRY_SOURCE_CONFLICTS) {
      expect(screen.getByText(c.topic)).toBeDefined()
    }
  })

  it('states how each workflow was matched to this module', () => {
    render(<TenantConfigRegistryScreen />)
    for (const w of REGISTRY_WORKFLOWS) {
      expect(screen.getByText(w.name)).toBeDefined()
    }
    // Every workflow states its matching method — none is asserted silently.
    expect(screen.getAllByText(/^Matched by /)).toHaveLength(REGISTRY_WORKFLOWS.length)
  })
})

describe('MOD-SA-19 — the twelve applicable screen states', () => {
  it('offers exactly the twelve, never the frontline-only STATE-07', () => {
    render(<TenantConfigRegistryScreen />)
    const options = Array.from(
      control(/screen state/i).querySelectorAll('option'),
    ).map((o) => o.getAttribute('value'))
    expect(options).toHaveLength(12)
    expect(options).not.toContain('STATE-07')
  })

  it('renders every one of the twelve with its contract, and never a blank frame', () => {
    render(<TenantConfigRegistryScreen />)
    for (const state of SA_APPLICABLE_STATES) {
      setScreenState(state.id)
      // The option in the switcher matches too, so the assertion is on presence.
      expect(screen.getAllByText(new RegExp(`${state.id} — ${state.name}`)).length).toBeGreaterThan(1)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    }
  })

  it('AC-SA-000-09: stays operable with every artificial-intelligence model unavailable', () => {
    render(<TenantConfigRegistryScreen />)
    setScreenState('STATE-11')
    // The registry still reads.
    expect(screen.getByRole('table', { name: /registry entries/i })).toBeDefined()
    // The rejection path still rejects.
    submitWrite('record-finish-window', 'current-value', '12')
    expect(screen.getByRole('alert').textContent).toMatch(/rejected at the point of entry/i)
    // And an in-bound write is still accepted.
    submitWrite('record-finish-window', 'current-value', '36')
    expect(screen.getByRole('status', { name: /write outcome/i }).textContent).toMatch(/accepted/i)
    // Because nothing on this module depends on a model at all.
    expect(screen.getByText(/no artificial-intelligence model/i)).toBeDefined()
  })
})
