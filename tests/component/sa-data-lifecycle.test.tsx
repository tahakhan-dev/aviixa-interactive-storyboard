import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import type { RoleId } from '@/domain/roles'
import { SCREEN_STATES } from '@/ui/screen-state'
import { saModuleById } from '@/surfaces/sa/modules'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import { DataLifecycleScreen } from '../../app/super-admin/data-lifecycle-and-archival/DataLifecycleScreen'
import {
  ARCHIVE_REACTIVATION_BANDS,
  CLOSURE_SEQUENCE,
  ERASURE_REQUESTS,
  ERASURE_STEPS,
  LEGAL_HOLDS,
  LEGAL_HOLD_STATES,
  LIFECYCLE_ABSENT_CONTROLS,
  LIFECYCLE_AREAS,
  LIFECYCLE_PLATFORM_ROLES,
  LIFECYCLE_SOURCE_CONFLICTS,
  LIFECYCLE_UNSPECIFIED_IN_SOURCE,
  LIFECYCLE_WORKFLOWS,
  RETENTION_POSTURES,
  UPCOMING_ANONYMISATION,
} from '../../app/super-admin/data-lifecycle-and-archival/fixtures'

const MODULE = saModuleById('MOD-SA-17')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/**
 * Every interactive element on the page. The ABSENT gates below read this:
 * a prohibition that renders as ABSENT must draw NO control — a note only.
 * Prose naming a prohibited idea is not a violation; a control is.
 */
function interactiveText(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('button, a, input, select, textarea, [role=switch], [role=button]'),
  ).map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`)
}

describe('MOD-SA-17 Data Lifecycle and Archival — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<DataLifecycleScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-17 · Operations layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<DataLifecycleScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates SCR-SA-24 without ever keying a route on a bare number', () => {
    const { container } = render(<DataLifecycleScreen />)
    expect(screen.getAllByText(/SCR-SA-24/).length).toBeGreaterThan(0)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  it('names none of the four forbidden words anywhere in its copy, in any screen state, for any role', () => {
    // Every forbidden-word route on this screen is role-gated: the refusal
    // copy a denied role reads is the only copy that ever carried one. Looping
    // states while rendering the default ADMIN certified a property it never
    // exercised, so this loops BOTH axes — 4 roles x 12 states.
    for (const role of LIFECYCLE_PLATFORM_ROLES) {
      for (const state of APPLICABLE_STATES) {
        const { container, unmount } = render(
          <DataLifecycleScreen role={role.id} screenState={state.id} />,
        )
        expect(container.textContent ?? '', `${role.id} ${state.id}`).not.toMatch(
          /tamper-evident|chained|signed|verified/i,
        )
        unmount()
      }
    }
  })

  it('resolves every link to the console, and tenant content only to the session-request form', () => {
    const { container } = render(<DataLifecycleScreen />)
    const hrefs = Array.from(container.querySelectorAll('a[href]')).map((el) =>
      el.getAttribute('href'),
    )
    for (const href of hrefs) expect(href).toMatch(/^\/super-admin\//)
    expect(hrefs.some((h) => /^\/super-admin\/support-access\/?$/.test(h ?? ''))).toBe(true)
    expect(screen.getByText(/no ambient browsing/i)).toBeDefined()
  })

  it('offers no link out of any lifecycle row into a tenant record, for any role', () => {
    for (const role of LIFECYCLE_PLATFORM_ROLES) {
      const { unmount } = render(<DataLifecycleScreen role={role.id} />)
      for (const name of [/Retention/i, /Legal hold/i, /Anonymisation/i, /Erasure requests/i]) {
        const panel = screen.getByRole('region', { name })
        for (const el of Array.from(panel.querySelectorAll('a[href]'))) {
          expect(el.getAttribute('href'), role.id).toMatch(/^\/super-admin\/support-access\/?$/)
        }
      }
      unmount()
    }
  })

  it('renders no metric below the tenant, no rate and no per-worker series, for any role', () => {
    for (const role of LIFECYCLE_PLATFORM_ROLES) {
      const { container, unmount } = render(<DataLifecycleScreen role={role.id} />)
      expect(container.textContent ?? '', role.id).not.toMatch(
        /\bper worker\b|\bby worker\b|worker ranking|worker leaderboard|per hour|per day|per week|\bper shift\b|records\/|throughput/i,
      )
      unmount()
    }
  })
})

describe('MOD-SA-17 — nothing is purged', () => {
  it('states the no-purge rule and the fifteen-year hot-retrievability horizon (AC-SA-17-01, AC-SA-17-02)', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Retention/i })
    expect(within(panel).getAllByText(/hot-retrievability horizon/i).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/fifteen years/i).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/AC-SA-17-02/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/AC-SA-17-01/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/nothing ages out of existence/i).length).toBeGreaterThan(0)
  })

  it('says shortening the horizon moves data rather than deleting it', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Retention/i })
    expect(within(panel).getAllByText(/moves data rather than deleting it/i).length).toBeGreaterThan(0)
  })

  it('offers no purge, delete-tenant-data, undo, restore or de-anonymise control to any role', () => {
    for (const role of LIFECYCLE_PLATFORM_ROLES) {
      const { container, unmount } = render(<DataLifecycleScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `interactive element offered to ${role.id}`).not.toMatch(
          /purge|de-anonymise|deanonymise|undo|restore|delete/i,
        )
      }
      unmount()
    }
  })

  it('draws a one-line note where each absent control would be, never a disabled one', () => {
    render(<DataLifecycleScreen />)
    const absences = screen.getByRole('region', { name: /Controls that do not exist/i })
    expect(LIFECYCLE_ABSENT_CONTROLS.length).toBeGreaterThan(0)
    for (const control of LIFECYCLE_ABSENT_CONTROLS) {
      expect(within(absences).getByText(control.label), control.label).toBeDefined()
    }
    expect(absences.querySelector('button')).toBeNull()
    expect(absences.querySelector('input')).toBeNull()
    expect(absences.querySelector('[role=switch]')).toBeNull()
  })

  it('keeps the absences absent for the root itself, not merely for lesser roles', () => {
    const { container } = render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" />)
    for (const text of interactiveText(container)) {
      expect(text).not.toMatch(/purge|de-anonymise|delete/i)
    }
    expect(screen.getAllByText(/for any account including the root/i).length).toBeGreaterThan(0)
  })

  it('states that no deletion path is built while DEC-DELETE-001 is open', () => {
    render(<DataLifecycleScreen />)
    expect(screen.getAllByText(/DEC-DELETE-001/).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-17 — the five areas and the closure sequence', () => {
  it('closes the screen at exactly the five source areas', () => {
    expect(LIFECYCLE_AREAS).toEqual([
      'Retention',
      'Tiering',
      'Legal hold',
      'Anonymisation',
      'Archival',
    ])
    render(<DataLifecycleScreen />)
    for (const area of LIFECYCLE_AREAS) {
      expect(screen.getAllByRole('region', { name: new RegExp(area, 'i') }).length, area).toBeGreaterThan(0)
    }
  })

  it('renders the closure sequence in its source order', () => {
    expect(CLOSURE_SEQUENCE).toEqual([
      'Active',
      'ExportProvided',
      'Archived',
      'Anonymised',
      'Tiered',
    ])
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Archival/i })
    const text = within(panel).getByTestId('closure-sequence').textContent ?? ''
    expect(text.indexOf('Active')).toBeLessThan(text.indexOf('ExportProvided'))
    expect(text.indexOf('ExportProvided')).toBeLessThan(text.indexOf('Archived'))
    expect(text.indexOf('Archived')).toBeLessThan(text.indexOf('Anonymised'))
    expect(text.indexOf('Anonymised')).toBeLessThan(text.indexOf('Tiered'))
  })

  it('renders the three archival reactivation bands', () => {
    expect(ARCHIVE_REACTIVATION_BANDS).toHaveLength(3)
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Archival/i })
    for (const band of ARCHIVE_REACTIVATION_BANDS) {
      expect(within(panel).getByText(band.name), band.name).toBeDefined()
    }
  })

  it('states export-on-archival runs at no charge before archival (AC-SA-17-09)', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Archival/i })
    expect(within(panel).getAllByText(/AC-SA-17-09/).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/at no charge before archival/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-17 — anonymisation, D11 and the identity-resolution layer', () => {
  it('says on screen that anonymisation touches the identity-resolution layer and never audit rows', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Anonymisation/i })
    expect(within(panel).getAllByText(/identity-resolution layer/i).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/never rewrites an audit row/i).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/AC-SA-17-06/).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/AC-SA-18-04/).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/D11/).length).toBeGreaterThan(0)
  })

  it('surfaces upcoming anonymisation events before they execute (AC-SA-17-08)', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Anonymisation/i })
    expect(UPCOMING_ANONYMISATION.length).toBeGreaterThan(0)
    for (const row of UPCOMING_ANONYMISATION) {
      expect(within(panel).getByText(row.tenantLabel), row.tenantLabel).toBeDefined()
    }
    expect(within(panel).getAllByText(/AC-SA-17-08/).length).toBeGreaterThan(0)
  })

  it('states the twenty-four-month horizon and that Regulated-Industry mode never anonymises (AC-SA-17-05)', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Anonymisation/i })
    expect(within(panel).getAllByText(/twenty-four months/i).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/never in Regulated-Industry mode/i).length).toBeGreaterThan(0)
  })

  it('renders irreversibility as an absence, never as a disabled reversal control (AC-SA-17-07)', () => {
    for (const role of LIFECYCLE_PLATFORM_ROLES) {
      const { unmount } = render(<DataLifecycleScreen role={role.id} />)
      const panel = screen.getByRole('region', { name: /Anonymisation/i })
      expect(panel.querySelector('button'), role.id).toBeNull()
      expect(within(panel).getAllByText(/cannot be reversed by any account/i).length).toBeGreaterThan(0)
      unmount()
    }
  })
})

describe('MOD-SA-17 — legal hold, erasure and the critical class', () => {
  it('keeps the legal-hold vocabulary at the three OBJ-SA-LEGALHOLD states', () => {
    expect(LEGAL_HOLD_STATES).toEqual(['placed', 'in force', 'released'])
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Legal hold/i })
    expect(LEGAL_HOLDS.length).toBeGreaterThan(0)
    for (const hold of LEGAL_HOLDS) {
      expect(within(panel).getByText(hold.scopeLabel), hold.scopeLabel).toBeDefined()
    }
  })

  it('states that a legal hold suspends tiering and compliance-driven deletion (AC-SA-17-04)', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Legal hold/i })
    expect(
      within(panel).getAllByText(/suspends tiering and compliance-driven deletion/i).length,
    ).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/AC-SA-17-04/).length).toBeGreaterThan(0)
  })

  it('gives the root the legal-hold action bar and every other role the class badge', () => {
    const root = render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" />)
    const rootPanel = screen.getByRole('region', { name: /Legal hold/i })
    expect(within(rootPanel).getByRole('button', { name: /Place a legal hold/i })).toBeDefined()
    root.unmount()

    for (const role of LIFECYCLE_PLATFORM_ROLES.filter((r) => r.id !== 'ROOT_SUPER_ADMIN')) {
      const { unmount } = render(<DataLifecycleScreen role={role.id} />)
      const panel = screen.getByRole('region', { name: /Legal hold/i })
      expect(within(panel).queryByRole('button', { name: /Place a legal hold/i }), role.id).toBeNull()
      expect(
        within(panel).getByText(/Critical class — root approval required/i),
        role.id,
      ).toBeDefined()
      unmount()
    }
  })

  it('renders the five guided erasure steps in order, with the legal-hold check unskippable', () => {
    expect(ERASURE_STEPS).toHaveLength(5)
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Erasure requests/i })
    for (const step of ERASURE_STEPS) {
      expect(
        within(panel).getByText(`Step ${step.ordinal} — ${step.name}`),
        step.name,
      ).toBeDefined()
    }
    expect(within(panel).getAllByText(/cannot be skipped/i).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/AC-SA-17-11/).length).toBeGreaterThan(0)
  })

  it('lets the Admin draft an erasure request and shows the class badge for its execution', () => {
    render(<DataLifecycleScreen role="ADMIN" />)
    const panel = screen.getByRole('region', { name: /Erasure requests/i })
    const draft = within(panel).getByRole('button', { name: /Draft an erasure request/i })
    expect(draft.getAttribute('aria-disabled')).toBeNull()
    expect(within(panel).getByText(/Critical class — root approval required/i)).toBeDefined()
  })

  it('disables the erasure draft for the Platform Engineer and Support with a named reason', () => {
    for (const role of ['PLATFORM_ENGINEER', 'SUPPORT'] as const) {
      const { unmount } = render(<DataLifecycleScreen role={role} />)
      const panel = screen.getByRole('region', { name: /Erasure requests/i })
      const draft = within(panel).getByRole('button', { name: /Draft an erasure request/i })
      expect(draft.getAttribute('aria-disabled'), role).toBe('true')
      const described = draft.getAttribute('aria-describedby')
      expect(described, role).toBeTruthy()
      const reason = document.getElementById(described ?? '')
      expect((reason?.textContent ?? '').length, role).toBeGreaterThan(20)
      unmount()
    }
  })

  it('lists erasure requests with state, subject reference, basis, scope and outcome', () => {
    render(<DataLifecycleScreen role="ADMIN" />)
    const panel = screen.getByRole('region', { name: /Erasure requests/i })
    for (const request of ERASURE_REQUESTS) {
      const row = within(panel).getByText(request.subjectReference).closest('tr')
      const text = row?.textContent ?? ''
      expect(text, request.subjectReference).toContain(request.basis)
      expect(text, request.subjectReference).toContain(request.scopeSummary)
      expect(text, request.subjectReference).toContain(request.outcome)
    }
  })

  it('governs the erasure execution by its own decision, and reports an approval as an approval', () => {
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-03" />)
    const panel = screen.getByRole('region', { name: /Erasure requests/i })
    fireEvent.click(within(panel).getByRole('button', { name: /Approve the erasure execution/i }))
    // An approval is not a draft. The control used to set the DRAFT state, so a
    // root approval of a critical-class execution read back as an un-approved draft.
    expect(within(panel).queryByText(/draft recorded/i)).toBeNull()
    expect(within(panel).getAllByText(/approval recorded on the fixture/i).length).toBeGreaterThan(0)
    // …and it never claims a removal this prototype does not perform.
    expect(within(panel).getAllByText(/nothing was erased/i).length).toBeGreaterThan(0)
  })

  it('names the erasure execution, not the legal hold, when the execution approval is refused', () => {
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-06" />)
    const panel = screen.getByRole('region', { name: /Erasure requests/i })
    const approve = within(panel).getByRole('button', { name: /Approve the erasure execution/i })
    expect(approve.getAttribute('aria-disabled')).toBe('true')
    const reason =
      document.getElementById(approve.getAttribute('aria-describedby') ?? '')?.textContent ?? ''
    expect(reason).toMatch(/erasure execution/i)
    expect(reason).not.toMatch(/hold can be placed or released/i)
  })

  it('gives every role read access to the module (D16)', () => {
    for (const role of LIFECYCLE_PLATFORM_ROLES) {
      const { unmount } = render(<DataLifecycleScreen role={role.id} />)
      expect(screen.getByRole('region', { name: /Retention/i }), role.id).toBeDefined()
      expect(screen.getAllByText(/fifteen years/i).length, role.id).toBeGreaterThan(0)
      unmount()
    }
  })
})

describe('MOD-SA-17 — the enforced invariants render as chips, never controls', () => {
  it('renders them with no button, input, switch or tab stop', () => {
    render(<DataLifecycleScreen />)
    const region = screen.getByRole('region', { name: /Enforced invariants/i })
    expect(region.querySelector('button')).toBeNull()
    expect(region.querySelector('input')).toBeNull()
    expect(region.querySelector('[role=switch]')).toBeNull()
    expect(region.querySelector('[tabindex]')).toBeNull()
    expect(within(region).getAllByText(/ENFORCED/).length).toBe(3)
  })
})

describe('MOD-SA-17 — the device de-authorisation command never collapses its state', () => {
  it('names the command state and advances it only on explicit action (AC-SA-13-05)', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Device de-authorisation/i })
    expect(within(panel).getByTestId('command-state').textContent).toMatch(/created/i)
    expect(within(panel).queryByText(/wiped/i)).toBeNull()
    const advance = within(panel).getByRole('button', { name: /Advance the fixture/i })
    fireEvent.click(advance)
    expect(within(panel).getByTestId('command-state').textContent).toMatch(/authorized/i)
  })

  it('draws the command vocabulary from the shared fifteen-state registry', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Device de-authorisation/i })
    expect(COMMAND_STATES).toHaveLength(15)
    expect(within(panel).getByText(new RegExp(COMMAND_STATES.join(', ')))).toBeDefined()
  })
})

describe('MOD-SA-17 — the twelve applicable screen states', () => {
  it('offers all twelve, and never the frontline-only STATE-07', () => {
    render(<DataLifecycleScreen />)
    const selector = screen.getByLabelText(/Screen state/i)
    expect(within(selector).queryByText(/STATE-07/)).toBeNull()
    for (const state of APPLICABLE_STATES) {
      expect(within(selector).getByText(new RegExp(state.id)), state.id).toBeDefined()
    }
    expect(within(selector).getAllByRole('option')).toHaveLength(12)
  })

  it.each(APPLICABLE_STATES.map((s) => s.id))('renders %s without losing the module', (stateId) => {
    render(<DataLifecycleScreen screenState={stateId} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('region', { name: /Retention/i })).toBeDefined()
    expect(screen.getByRole('region', { name: /Legal hold/i })).toBeDefined()
  })

  it('STATE-11: with every model unavailable the module remains operable (AC-SA-000-09)', () => {
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-11" />)
    const holds = screen.getByRole('region', { name: /Legal hold/i })
    expect(
      within(holds).getByRole('button', { name: /Place a legal hold/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    const erasure = screen.getByRole('region', { name: /Erasure requests/i })
    expect(
      within(erasure).getByRole('button', { name: /Draft an erasure request/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    const retention = screen.getByRole('region', { name: /Retention/i })
    for (const row of RETENTION_POSTURES) {
      expect(within(retention).getByText(row.tenantLabel), row.tenantLabel).toBeDefined()
    }
    expect(screen.getAllByText(/no model participates in this module/i).length).toBeGreaterThan(0)
  })

  it('STATE-03 renders every aggregate with its as-of time', () => {
    render(<DataLifecycleScreen screenState="STATE-03" />)
    for (const name of [/Retention/i, /Anonymisation/i]) {
      const panel = screen.getByRole('region', { name })
      expect(within(panel).getAllByText(/as of/i).length, String(name)).toBeGreaterThan(0)
    }
  })

  it('STATE-08 degrades the aggregate to stale WITH its age, never to zero', () => {
    render(<DataLifecycleScreen screenState="STATE-08" />)
    const panel = screen.getByRole('region', { name: /Retention/i })
    expect(panel.textContent ?? '').toMatch(/stale/i)
    expect(panel.textContent ?? '').toMatch(/\d+ (minutes|hours) old/i)
  })

  it('STATE-12 degrades the aggregate to unavailable, never to zero or blank', () => {
    render(<DataLifecycleScreen screenState="STATE-12" />)
    const panel = screen.getByRole('region', { name: /Retention/i })
    expect(panel.textContent ?? '').toMatch(/Unavailable/i)
    expect(panel.textContent ?? '').not.toMatch(/\b0\b/)
  })

  it('STATE-02 renders a placeholder, never the number nought', () => {
    render(<DataLifecycleScreen screenState="STATE-02" />)
    const panel = screen.getByRole('region', { name: /Retention/i })
    expect(panel.textContent ?? '').not.toMatch(/\b0\b/)
    expect(within(panel).getAllByRole('status').length).toBeGreaterThan(0)
  })

  it('STATE-01 names what would appear here instead of rendering a zero', () => {
    render(<DataLifecycleScreen screenState="STATE-01" />)
    const panel = screen.getByRole('region', { name: /Retention/i })
    expect(panel.textContent ?? '').not.toMatch(/\b0\b/)
    expect(
      within(panel).getAllByText(/No tenant carries a retention posture yet/i).length,
    ).toBeGreaterThan(0)
  })

  it('STATE-06 renders exactly one read-only banner naming one cause', () => {
    render(<DataLifecycleScreen screenState="STATE-06" />)
    expect(
      screen.getAllByRole('status').filter((n) => /read-only/i.test(n.textContent ?? '')),
    ).toHaveLength(1)
  })

  it('STATE-04 states the rule that was broken and what would be accepted', () => {
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-04" />)
    const alert = screen.getByRole('alert')
    expect(alert.textContent ?? '').toMatch(/platform floor register/i)
  })

  it('STATE-05 states which role carries the action rather than hiding the refusal', () => {
    // Anchored on the STATE-05 rendering itself. The earlier version asserted
    // only /Root Super Admin/ inside the erasure region — copy the role gate
    // emits in EVERY state — so it passed identically under STATE-03 and
    // proved nothing about STATE-05.
    const denied = render(<DataLifecycleScreen role="SUPPORT" screenState="STATE-05" />)
    const banner = screen
      .getAllByRole('status')
      .find((n) => /does not carry the action you attempted/i.test(n.textContent ?? ''))
    expect(banner).toBeDefined()
    expect(banner?.textContent ?? '').toMatch(/Root Super Admin/i)
    expect(banner?.textContent ?? '').toMatch(/rather than hidden behind a missing button/i)
    // The refusal is drawn, not hidden: the control is still there and inert.
    const panel = screen.getByRole('region', { name: /Erasure requests/i })
    expect(
      within(panel)
        .getByRole('button', { name: /Draft an erasure request/i })
        .getAttribute('aria-disabled'),
    ).toBe('true')
    denied.unmount()

    // State specificity: the same banner must NOT be on a success screen.
    render(<DataLifecycleScreen role="SUPPORT" screenState="STATE-03" />)
    expect(
      screen
        .queryAllByRole('status')
        .filter((n) => /does not carry the action you attempted/i.test(n.textContent ?? '')),
    ).toHaveLength(0)
  })

  it('STATE-05 states no refusal to a role that carries every action this screen draws', () => {
    // The banner is a claim about THIS role. The root is refused nothing here,
    // and every control it holds is live in this state, so a blocked banner
    // would state a refusal no control on the screen contains.
    const { container } = render(
      <DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-05" />,
    )
    const buttons = Array.from(container.querySelectorAll('button'))
    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button.getAttribute('aria-disabled'), button.textContent ?? '').toBeNull()
    }
    expect(
      screen
        .queryAllByRole('status')
        .filter((n) => /does not carry the action you attempted/i.test(n.textContent ?? '')),
    ).toHaveLength(0)
    expect(screen.getAllByText(/carries every action this screen draws/i).length).toBeGreaterThan(0)
  })

  it('STATE-05 names in its one banner exactly the actions the role is refused, and no others', () => {
    // What the banner lists and what the controls below do must be the same
    // fact. The Admin carries the erasure draft, so the banner must not list
    // it while the button beside it is live.
    const CRITICAL = [
      /change the retention horizon/i,
      /place or release a legal hold/i,
      /approve an erasure execution/i,
    ] as const
    const LACKS: readonly { readonly roleId: RoleId; readonly expected: readonly RegExp[] }[] = [
      { roleId: 'ADMIN', expected: CRITICAL },
      { roleId: 'PLATFORM_ENGINEER', expected: [...CRITICAL, /draft an erasure request/i] },
      { roleId: 'SUPPORT', expected: [...CRITICAL, /draft an erasure request/i] },
    ]
    for (const { roleId, expected } of LACKS) {
      const { unmount } = render(<DataLifecycleScreen role={roleId} screenState="STATE-05" />)
      const banners = screen
        .getAllByRole('status')
        .filter((n) => /does not carry the action you attempted/i.test(n.textContent ?? ''))
      expect(banners, roleId).toHaveLength(1)
      const text = banners[0]?.textContent ?? ''
      for (const claim of expected) expect(text, `${roleId} ${String(claim)}`).toMatch(claim)
      const draft = screen.getByRole('button', { name: /Draft an erasure request/i })
      // The one action the Admin holds: named nowhere in the refusal, live below it.
      if (roleId === 'ADMIN') {
        expect(text, roleId).not.toMatch(/draft an erasure request/i)
        expect(draft.getAttribute('aria-disabled'), roleId).toBeNull()
      } else {
        expect(draft.getAttribute('aria-disabled'), roleId).toBe('true')
      }
      unmount()
    }
  })

  it('STATE-09 renders an accepted legal hold in its own state, never as in force, for every role', () => {
    // Anchored on the queued rendering itself. /placed/i alone was satisfied by
    // the unrelated HOLD-2026-007 fixture row, which renders in every state, so
    // the old assertion passed under STATE-03 and would have survived deleting
    // the whole STATE-09 branch.
    for (const role of LIFECYCLE_PLATFORM_ROLES) {
      const { unmount } = render(<DataLifecycleScreen role={role.id} screenState="STATE-09" />)
      const queued = screen.getByTestId('accepted-hold')
      // Anchored: the accepted hold's own state pill, never a substring match
      // that a neighbouring sentence could satisfy.
      expect(
        within(queued).getByText(/^placed — scope resolution still running$/i),
        role.id,
      ).toBeDefined()
      // "Never as in force", asserted where an in-force rendering could
      // actually appear: the whole legal-hold panel. Inside the queued <p>
      // the assertion had nothing but two hard-coded strings to look at.
      // The panel carries exactly the fixture's in-force holds and not one
      // more, so a queued hold rendered as in force — as its own pill, or as
      // an extra row in the table — fails here.
      const panel = screen.getByRole('region', { name: /Legal hold/i })
      expect(within(panel).queryAllByText(/^in force$/i), role.id).toHaveLength(
        LEGAL_HOLDS.filter((h) => h.state === 'in force').length,
      )
      expect(queued.textContent ?? '', role.id).toMatch(/not in force until its scope resolves/i)
      unmount()
    }

    // State specificity: nothing is queued on a success screen.
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-03" />)
    expect(screen.queryByTestId('accepted-hold')).toBeNull()
  })

  it('STATE-10 keeps the deterministic schedulers running while an agent is degraded', () => {
    render(<DataLifecycleScreen screenState="STATE-10" />)
    expect(screen.getAllByText(/deterministic/i).length).toBeGreaterThan(0)
  })

  it('STATE-13 shows what is being replayed rather than presenting recovery as complete', () => {
    render(<DataLifecycleScreen screenState="STATE-13" />)
    expect(screen.getAllByText(/re-evaluated on the next scheduler run/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-17 — every panel of records degrades together', () => {
  /** The four panels that read seeded records, aggregates and lists alike. */
  const RECORD_PANELS = [/Retention/i, /Legal hold/i, /Anonymisation/i, /Erasure requests/i]

  it('STATE-01 empties the lists too, so no panel contradicts the empty aggregate beside it', () => {
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-01" />)
    const holds = screen.getByRole('region', { name: /Legal hold/i })
    expect(within(holds).getAllByText(/No legal hold is on record/i).length).toBeGreaterThan(0)
    for (const hold of LEGAL_HOLDS) {
      expect(within(holds).queryByText(hold.scopeLabel), hold.id).toBeNull()
    }
    const erasure = screen.getByRole('region', { name: /Erasure requests/i })
    expect(within(erasure).getAllByText(/No erasure request is on record/i).length).toBeGreaterThan(0)
    for (const request of ERASURE_REQUESTS) {
      expect(within(erasure).queryByText(request.subjectReference), request.id).toBeNull()
    }
  })

  it('STATE-02 renders no list as settled data while the fetch is in flight', () => {
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-02" />)
    for (const name of RECORD_PANELS) {
      const panel = screen.getByRole('region', { name })
      expect(within(panel).getAllByRole('status').length, String(name)).toBeGreaterThan(0)
    }
    const holds = screen.getByRole('region', { name: /Legal hold/i })
    for (const hold of LEGAL_HOLDS) {
      expect(within(holds).queryByText(hold.scopeLabel), hold.id).toBeNull()
    }
  })

  it('STATE-08 marks every panel with its as-of time and age, never old content as current', () => {
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-08" />)
    for (const name of RECORD_PANELS) {
      const panel = screen.getByRole('region', { name })
      expect(panel.textContent ?? '', String(name)).toMatch(/stale/i)
      expect(panel.textContent ?? '', String(name)).toMatch(/\d+ (minutes|hours) old/i)
    }
  })

  it('drops every recorded outcome when a switcher moves, so no pill outlives the rendering it belongs to', () => {
    const OUTCOME_PILLS = [
      /approval recorded on the fixture/i,
      /draft recorded/i,
      /horizon change recorded/i,
    ] as const
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-03" />)
    const click = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))
    click(/Approve the erasure execution/i)
    click(/Draft an erasure request/i)
    click(/Place a legal hold/i)
    click(/Change the retention horizon/i)
    for (const pill of OUTCOME_PILLS) expect(screen.getAllByText(pill).length).toBeGreaterThan(0)
    expect(screen.getByTestId('accepted-hold')).toBeDefined()

    // The role switcher moves to a role that never held any of these controls.
    // It must be told it lacks the capability, never that the act is done.
    fireEvent.change(screen.getByLabelText(/Console role/i), { target: { value: 'SUPPORT' } })
    for (const pill of OUTCOME_PILLS) expect(screen.queryByText(pill), String(pill)).toBeNull()
    expect(screen.queryByTestId('accepted-hold')).toBeNull()
    expect(
      screen.getByRole('button', { name: /Draft an erasure request/i }).getAttribute('aria-disabled'),
    ).toBe('true')

    // Returning to the role that clicked does not resurrect the outcome either.
    fireEvent.change(screen.getByLabelText(/Console role/i), {
      target: { value: 'ROOT_SUPER_ADMIN' },
    })
    for (const pill of OUTCOME_PILLS) expect(screen.queryByText(pill), String(pill)).toBeNull()

    // The state switcher moves to a rendering whose own panels say these
    // records cannot be read at all.
    click(/Approve the erasure execution/i)
    click(/Place a legal hold/i)
    fireEvent.change(screen.getByLabelText(/Screen state/i), { target: { value: 'STATE-12' } })
    for (const pill of OUTCOME_PILLS) expect(screen.queryByText(pill), String(pill)).toBeNull()
    expect(screen.queryByTestId('accepted-hold')).toBeNull()
    for (const name of RECORD_PANELS) {
      expect(screen.getByRole('region', { name }).textContent ?? '', String(name)).toMatch(
        /Unavailable/i,
      )
    }
  })

  it('STATE-12 renders every panel as unavailable, never as a settled list and never as zero', () => {
    render(<DataLifecycleScreen role="ROOT_SUPER_ADMIN" screenState="STATE-12" />)
    for (const name of RECORD_PANELS) {
      const panel = screen.getByRole('region', { name })
      expect(panel.textContent ?? '', String(name)).toMatch(/Unavailable/i)
      expect(panel.textContent ?? '', String(name)).not.toMatch(/\b0\b/)
    }
    const erasure = screen.getByRole('region', { name: /Erasure requests/i })
    for (const request of ERASURE_REQUESTS) {
      expect(within(erasure).queryByText(request.subjectReference), request.id).toBeNull()
    }
  })
})

describe('MOD-SA-17 — read-only and failure reach every control, fixture controls included', () => {
  it.each(['STATE-06', 'STATE-12'] as const)(
    '%s draws every control on the screen inert with a named reason, for every role',
    (stateId) => {
      for (const role of LIFECYCLE_PLATFORM_ROLES) {
        const { container, unmount } = render(
          <DataLifecycleScreen role={role.id} screenState={stateId} />,
        )
        const buttons = Array.from(container.querySelectorAll('button'))
        expect(buttons.length, `${role.id} ${stateId}`).toBeGreaterThan(0)
        for (const button of buttons) {
          const label = `${role.id} ${stateId} ${button.textContent ?? ''}`
          expect(button.getAttribute('aria-disabled'), label).toBe('true')
          const reason =
            document.getElementById(button.getAttribute('aria-describedby') ?? '')?.textContent ?? ''
          expect(reason.length, label).toBeGreaterThan(20)
        }
        unmount()
      }
    },
  )

  it.each(['STATE-06', 'STATE-12'] as const)('%s does not let the fixture stepper act', (stateId) => {
    render(<DataLifecycleScreen role="SUPPORT" screenState={stateId} />)
    const panel = screen.getByRole('region', { name: /Device de-authorisation/i })
    const advance = within(panel).getByRole('button', { name: /Advance the fixture/i })
    fireEvent.click(advance)
    expect(within(panel).getByTestId('command-state').textContent).toMatch(/created/i)
    expect(within(panel).getByTestId('command-state').textContent).not.toMatch(/authorized/i)
  })
})

describe('MOD-SA-17 — what the source does not define', () => {
  it('names every missing affordance instead of inventing a control', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Unspecified in source/i })
    expect(LIFECYCLE_UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const item of LIFECYCLE_UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(item.affordance), item.affordance).toBeDefined()
    }
    expect(panel.querySelector('button')).toBeNull()
    expect(panel.querySelector('input')).toBeNull()
  })

  it('states the conflicts the source leaves open rather than resolving them silently', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Conflicts in the source/i })
    expect(LIFECYCLE_SOURCE_CONFLICTS.length).toBeGreaterThan(0)
    for (const conflict of LIFECYCLE_SOURCE_CONFLICTS) {
      expect(within(panel).getByText(conflict.topic), conflict.topic).toBeDefined()
    }
  })

  it('says how each workflow was matched to this module', () => {
    render(<DataLifecycleScreen />)
    const panel = screen.getByRole('region', { name: /Workflows/i })
    expect(LIFECYCLE_WORKFLOWS.length).toBeGreaterThan(0)
    for (const workflow of LIFECYCLE_WORKFLOWS) {
      expect(within(panel).getByText(workflow.name), workflow.id).toBeDefined()
      expect(
        within(panel).getAllByText(workflow.matchedBy, { exact: false }).length,
        workflow.id,
      ).toBeGreaterThan(0)
    }
  })
})
