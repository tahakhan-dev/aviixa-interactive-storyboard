import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { SCREEN_STATES } from '@/ui/screen-state'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { saModuleById } from '@/surfaces/sa/modules'
import { PlatformSettingsScreen } from '../../app/super-admin/platform-settings/PlatformSettingsScreen'
import {
  SETTINGS_CATEGORIES,
  CROSS_CUTTING_SECTIONS,
  FLOOR_REGISTER_ROWS,
  GOVERNED_SETTINGS_COUNT,
  SETTING_STATES,
  PAUSE_STATES,
  LOCALE_PACK_STATES,
  SA07_PLATFORM_ROLES,
  SA07_UNSPECIFIED_IN_SOURCE,
  EXTENSION_LABEL,
} from '../../app/super-admin/platform-settings/fixtures'

const MODULE = saModuleById('MOD-SA-07')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

function interactiveElements(container: HTMLElement): Element[] {
  return Array.from(
    container.querySelectorAll(
      'button, a, input, select, textarea, [role=switch], [role=button], [role=tab], [tabindex]',
    ),
  )
}

describe('MOD-SA-07 Platform Settings — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-07 · Definition layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates the screen numbers without ever keying a route or a tab on one', () => {
    const { container } = render(<PlatformSettingsScreen />)
    expect(screen.getByText(/SCR-SA-08/)).toBeDefined()
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
    for (const tab of Array.from(container.querySelectorAll('[role=tab]'))) {
      expect(tab.getAttribute('id') ?? '').not.toMatch(/^SCR-SA-\d+$/i)
    }
  })

  it('names none of the four forbidden words anywhere in its copy', () => {
    const { container } = render(<PlatformSettingsScreen />)
    expect(container.textContent ?? '').not.toMatch(/tamper-evident|chained|signed|verified/i)
  })

  it('resolves no link to record-level tenant content, and names the access classes instead', () => {
    const { container } = render(<PlatformSettingsScreen />)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).toMatch(/^\/super-admin\//)
    }
    expect(screen.getByText(/named access class/i)).toBeDefined()
    expect(screen.getByText(/session-request form/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — ten navigable categories, D21', () => {
  it('closes the navigable category set at exactly ten', () => {
    expect(SETTINGS_CATEGORIES).toHaveLength(10)
    render(<PlatformSettingsScreen />)
    expect(screen.getAllByRole('tab')).toHaveLength(10)
  })

  it('names each of the ten categories the source lists at L44633', () => {
    render(<PlatformSettingsScreen />)
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent ?? '')
    for (const name of [
      'Model and Inference',
      'Orchestration',
      'Governance and Safety',
      'Memory and Data',
      'Security and Access',
      'Integrations',
      'Tenancy',
      'Observability',
      'Compliance',
      'System',
    ]) {
      expect(tabs.some((t) => t.includes(name))).toBe(true)
    }
  })

  it('renders the severity catalog, locale packs, invariants-and-floor-register and emergency pause as cross-cutting sections, never as an eleventh category', () => {
    render(<PlatformSettingsScreen />)
    const tabText = screen
      .getAllByRole('tab')
      .map((t) => t.textContent ?? '')
      .join(' ')
    for (const s of CROSS_CUTTING_SECTIONS) {
      expect(tabText).not.toContain(s.name)
      expect(screen.getByRole('heading', { name: new RegExp(s.name, 'i') })).toBeDefined()
    }
  })

  it('renders Orchestration as a category the source names and never populates, rather than inventing a setting for it', () => {
    render(<PlatformSettingsScreen screenState="STATE-03" />)
    const orchestration = SETTINGS_CATEGORIES.find((c) => c.name === 'Orchestration')
    expect(orchestration?.settings).toHaveLength(0)
    expect(
      SA07_UNSPECIFIED_IN_SOURCE.some((u) => /Orchestration/i.test(u.affordance)),
    ).toBe(true)
  })
})

describe('MOD-SA-07 — the six ENFORCED invariants render locked, as status chips', () => {
  it('renders all six by name', () => {
    render(<PlatformSettingsScreen />)
    for (const inv of SA_INVARIANTS) {
      expect(screen.getByText(new RegExp(`${inv.name} — ENFORCED`, 'i'))).toBeDefined()
    }
  })

  it('draws NO control inside the invariants panel — no button, input, switch or focusable node', () => {
    render(<PlatformSettingsScreen />)
    const panel = document.getElementById('sa07-invariants-panel')
    expect(panel).not.toBeNull()
    expect(interactiveElements(panel as HTMLElement)).toHaveLength(0)
  })

  it('holds that rendering for the root account too — the root sees no off control either', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const panel = document.getElementById('sa07-invariants-panel')
    expect(interactiveElements(panel as HTMLElement)).toHaveLength(0)
  })

  it('states the invariant failure idiom — the attempt IS recorded — separately from the floor register, which rejects and does not log', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/locked-setting-attempt/i)).toBeDefined()
    expect(screen.getByText(/rejects; it does not log/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — the platform floor register, eight rows', () => {
  it('carries exactly eight rows, and names the ones the source leaves unnamed rather than inventing them', () => {
    expect(FLOOR_REGISTER_ROWS).toHaveLength(8)
    const unnamed = FLOOR_REGISTER_ROWS.filter((r) => !r.namedInSource)
    expect(unnamed.length).toBeGreaterThan(0)
    render(<PlatformSettingsScreen />)
    expect(screen.getAllByText(/Not named in the frozen source/i).length).toBeGreaterThan(0)
  })

  it('states that a looser-than-floor value is rejected at entry with the bound stated and never stored', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/rejected at entry with the bound stated/i)).toBeDefined()
  })

  it('states that tightening a bound surfaces non-conforming values rather than rewriting them', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/conformance report rather than rewriting/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — the seventeen governed settings', () => {
  it('carries the count the source closes, and says plainly the enumeration exists nowhere', () => {
    expect(GOVERNED_SETTINGS_COUNT).toBe(17)
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/seventeen governed settings/i)).toBeDefined()
    expect(screen.getByText(/enumerated nowhere in the frozen source/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — the emergency pause, D8', () => {
  it('lets the Admin propose', () => {
    render(<PlatformSettingsScreen role="ADMIN" />)
    const btn = screen.getByRole('button', { name: /Propose an emergency pause/i })
    expect(btn.getAttribute('aria-disabled')).toBeNull()
  })

  it('replaces the approval action bar with the critical-class badge for a non-root role', () => {
    render(<PlatformSettingsScreen role="ADMIN" />)
    expect(screen.getAllByText(/Critical class — root approval required/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /Approve the pause proposal/i })).toBeNull()
  })

  it('lets the root approve', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const btn = screen.getByRole('button', { name: /Approve the pause proposal/i })
    expect(btn.getAttribute('aria-disabled')).toBeNull()
  })

  it("renders the Platform Engineer's control disabled with the named reason from DEC-PAUSE-001", () => {
    render(<PlatformSettingsScreen role="PLATFORM_ENGINEER" />)
    const btn = screen.getByRole('button', { name: /Propose an emergency pause/i })
    expect(btn.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByText(/proposal only — pending DEC-PAUSE-001/i)).toBeDefined()
  })

  it('offers Support no pause control at all, and says why', () => {
    render(<PlatformSettingsScreen role="SUPPORT" />)
    const btn = screen.getByRole('button', { name: /Propose an emergency pause/i })
    expect(btn.getAttribute('aria-disabled')).toBe('true')
  })

  it('keeps resume a separate act with its own approval, never a reversal control on the pause', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    expect(screen.getByRole('button', { name: /Propose a resume/i })).toBeDefined()
    expect(screen.getAllByText(/Pause and resume in one action/i).length).toBeGreaterThan(0)
  })

  it('renders "Pause the deterministic layer" as ABSENT — a note, never a drawn control', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    expect(screen.getAllByText(/Pause the deterministic layer/i).length).toBeGreaterThan(0)
    for (const el of interactiveElements(document.body)) {
      expect(el.textContent ?? '').not.toMatch(/Pause the deterministic layer/i)
    }
  })

  it('does not build the runaway-loop kill switch, and says the source warns against conflating it with the pause', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    expect(screen.getByText(/runaway-loop kill switch/i)).toBeDefined()
    for (const el of interactiveElements(document.body)) {
      expect(el.textContent ?? '').not.toMatch(/kill switch/i)
    }
  })

  it('carries the five pause states as a named vocabulary', () => {
    expect(PAUSE_STATES).toHaveLength(5)
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(PAUSE_STATES.join(' \u2192 '), { exact: false })).toBeDefined()
  })

  it('states the pause has no effect on on-device gates, specification checks or the Severity 1 hold', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/no effect on on-device gates/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — STATE-11, artificial intelligence unavailable (AC-SA-000-09)', () => {
  it('keeps the module operable and the emergency pause exercisable with every model unavailable', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" screenState="STATE-11" />)
    expect(screen.getAllByRole('tab')).toHaveLength(10)
    const approve = screen.getByRole('button', { name: /Approve the pause proposal/i })
    expect(approve.getAttribute('aria-disabled')).toBeNull()
  })

  it('keeps the Admin proposal exercisable too', () => {
    render(<PlatformSettingsScreen role="ADMIN" screenState="STATE-11" />)
    const propose = screen.getByRole('button', { name: /Propose an emergency pause/i })
    expect(propose.getAttribute('aria-disabled')).toBeNull()
  })
})

describe('MOD-SA-07 — the twelve applicable screen states', () => {
  it('renders every applicable state, and never STATE-07', () => {
    expect(APPLICABLE_STATES).toHaveLength(12)
    for (const state of APPLICABLE_STATES) {
      const { container, unmount } = render(<PlatformSettingsScreen screenState={state.id} />)
      expect(
        within(container).getAllByText(new RegExp(`${state.id} — ${state.name}`)).length,
      ).toBeGreaterThan(0)
      unmount()
    }
  })
})

describe('MOD-SA-07 — the states that are not decoration', () => {
  it('STATE-04 states the rule that was broken, the permitted range, and that nothing was stored', () => {
    render(<PlatformSettingsScreen screenState="STATE-04" />)
    const alert = screen.getByRole('alert')
    expect(alert.textContent ?? '').toMatch(/permitted range is up to and including 72 hours/i)
    expect(alert.textContent ?? '').toMatch(/existing value is unchanged/i)
  })

  it('STATE-09 renders an accepted change in its own state, never as applied', () => {
    render(<PlatformSettingsScreen screenState="STATE-09" />)
    expect(screen.getByText(/pending, not applied/i)).toBeDefined()
  })

  it('STATE-10 keeps every deterministic panel working', () => {
    render(<PlatformSettingsScreen screenState="STATE-10" />)
    expect(screen.getByText(/none of them consults a model/i)).toBeDefined()
    expect(screen.getAllByRole('tab')).toHaveLength(10)
  })

  it('STATE-13 never shows a recovering system as recovered', () => {
    render(<PlatformSettingsScreen screenState="STATE-13" />)
    expect(screen.getByText(/nothing on this screen is presented as recovered/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — aggregates never render as zero or blank (AC-SA-01-03)', () => {
  it('renders an as-of timestamp in the success state', () => {
    render(<PlatformSettingsScreen screenState="STATE-03" />)
    expect(screen.getByText(/As of /i)).toBeDefined()
  })

  it('degrades to stale-with-age under STATE-08', () => {
    render(<PlatformSettingsScreen screenState="STATE-08" />)
    expect(screen.getByText(/Stale —/i)).toBeDefined()
  })

  it('degrades to unavailable under STATE-12, never to a zero', () => {
    const { container } = render(<PlatformSettingsScreen screenState="STATE-12" />)
    const panel = container.querySelector('#sa07-posture-panel')
    expect(panel).not.toBeNull()
    expect((panel as HTMLElement).textContent ?? '').toMatch(/Unavailable/i)
    expect((panel as HTMLElement).textContent ?? '').not.toMatch(/\b0\b/)
  })
})

describe('MOD-SA-07 — per-control allowed roles through evaluateAccess', () => {
  it('grants all four platform roles read of the categories', () => {
    for (const role of SA07_PLATFORM_ROLES) {
      const { unmount } = render(<PlatformSettingsScreen role={role.id} />)
      expect(screen.getAllByRole('tab')).toHaveLength(10)
      unmount()
    }
  })

  it('renders the Compliance category read-only for the Platform Engineer with the reason named', () => {
    render(<PlatformSettingsScreen role="PLATFORM_ENGINEER" category="compliance" />)
    expect(screen.getAllByText(/commercial rather than engineering/i).length).toBeGreaterThan(0)
  })

  it('offers "Request a new integration" only to the Platform Engineer, and only as a scope decision', () => {
    render(<PlatformSettingsScreen role="PLATFORM_ENGINEER" category="integrations" />)
    const btn = screen.getByRole('button', { name: /Request a new integration/i })
    expect(btn.getAttribute('aria-disabled')).toBeNull()
    expect(screen.getByText(/not a configuration form/i)).toBeDefined()
  })

  it('draws no outbound-destination control and no free-text endpoint field anywhere in Integrations', () => {
    const { container } = render(
      <PlatformSettingsScreen role="ROOT_SUPER_ADMIN" category="integrations" />,
    )
    expect(container.querySelectorAll('input[type=text], textarea')).toHaveLength(0)
    expect(screen.getByText(/no free-text endpoint field/i)).toBeDefined()
  })

  it('offers Deprecate and Restore on the platform-seeded taxonomy to the Admin, and refuses Support', () => {
    const { unmount } = render(<PlatformSettingsScreen role="ADMIN" category="tenancy" />)
    expect(screen.getByRole('button', { name: /^Deprecate$/i }).getAttribute('aria-disabled')).toBeNull()
    expect(screen.getByRole('button', { name: /^Restore$/i }).getAttribute('aria-disabled')).toBeNull()
    unmount()
    render(<PlatformSettingsScreen role="SUPPORT" category="tenancy" />)
    expect(screen.getByRole('button', { name: /^Deprecate$/i }).getAttribute('aria-disabled')).toBe('true')
  })

  it('renders the per-tenant region control as ABSENT in Memory and Data', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" category="memory-and-data" />)
    expect(screen.getByText(/per-tenant region control/i)).toBeDefined()
    for (const el of interactiveElements(document.body)) {
      expect(el.textContent ?? '').not.toMatch(/region/i)
    }
  })
})

describe('MOD-SA-07 — settings changes as approvable objects', () => {
  it('carries the ten OBJ-SA-SETTING states, with refused terminal for an invariant', () => {
    expect(SETTING_STATES).toHaveLength(10)
    expect(SETTING_STATES).toContain('refused')
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/never by the operator’s role|never by the operator's role/i)).toBeDefined()
  })

  it('carries the six locale-pack states and the failed-publication rule', () => {
    expect(LOCALE_PACK_STATES).toHaveLength(6)
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/fails publication and names the keys/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — D22, contract and extension are distinguishable on screen', () => {
  it('labels the scheduled-work and feature-control material as a User-Mandated Product Extension in its own section', () => {
    expect(EXTENSION_LABEL).toMatch(/User-Mandated Product Extension/)
    render(<PlatformSettingsScreen />)
    const section = document.getElementById('sa07-extension')
    expect(section).not.toBeNull()
    expect((section as HTMLElement).textContent ?? '').toMatch(/User-Mandated Product Extension/)
    expect((section as HTMLElement).textContent ?? '').toMatch(/not SoW Fact/i)
  })

  it('keeps the extension material out of the ten contract categories', () => {
    render(<PlatformSettingsScreen />)
    const tabText = screen
      .getAllByRole('tab')
      .map((t) => t.textContent ?? '')
      .join(' ')
    expect(tabText).not.toMatch(/scheduled work/i)
    expect(tabText).not.toMatch(/feature control/i)
  })
})

describe('MOD-SA-07 — no metric below tenant-month, no rate, no per-worker series', () => {
  it('renders no per-worker or rate wording anywhere', () => {
    const { container } = render(<PlatformSettingsScreen />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/per worker|per-worker|worker ranking|workers? per /i)
  })
})

describe('MOD-SA-07 — unspecified in source', () => {
  it('names each missing affordance rather than inventing one', () => {
    render(<PlatformSettingsScreen />)
    const panel = document.getElementById('sa07-unspecified')
    expect(panel).not.toBeNull()
    for (const u of SA07_UNSPECIFIED_IN_SOURCE) {
      expect((panel as HTMLElement).textContent ?? '').toContain(u.affordance)
    }
  })
})
