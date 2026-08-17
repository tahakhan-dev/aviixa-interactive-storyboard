import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import type { ScreenStateId } from '@/ui/screen-state'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import {
  TiersScreen,
  TIER_BANDS,
  TIER_RECORDS,
  TIER_FIELD_GROUPS,
  TENANT_TIER_ASSIGNMENTS,
  FEATURE_OVERRIDES,
  CONSOLE_ROLE_VIEWS,
  APPLICABLE_SCREEN_STATES,
  UNSPECIFIED_IN_SOURCE,
  type SaConsoleRoleToken,
} from '../../app/super-admin/tiers-entitlements-and-caps/TiersScreen'

/** D10 / spec §10 gate 4: these four words appear nowhere in SURF-SA copy. */
const FORBIDDEN_WORDS = /\b(tamper-evident|chained|signed|verified)\b/i

/**
 * All rendered copy with a separator at every element edge. `textContent`
 * concatenates adjacent text nodes with nothing between them, which blinds
 * a `\b`-anchored gate at element boundaries; replacing every tag with a
 * space restores them. (Same defect and same fix as the MOD-SA-02 suite.)
 */
function renderedCopy(): string {
  return document.body.innerHTML.replace(/<[^>]*>/g, ' ')
}

function renderAs(role: SaConsoleRoleToken, state?: ScreenStateId) {
  return render(
    <TiersScreen
      initialRole={role}
      {...(state !== undefined ? { initialScreenState: state } : {})}
    />,
  )
}

function reasonTextOf(control: HTMLElement): string {
  const id = control.getAttribute('aria-describedby')
  if (id === null) return ''
  return document.getElementById(id)?.textContent ?? ''
}

const ROOT: SaConsoleRoleToken = 'ROLE-PLAT-ROOT'
const ADMIN: SaConsoleRoleToken = 'ROLE-PLAT-ADMIN'
const ENG: SaConsoleRoleToken = 'ROLE-PLAT-ENG'
const SUP: SaConsoleRoleToken = 'ROLE-PLAT-SUP'
const NON_ROOT: readonly SaConsoleRoleToken[] = [ADMIN, ENG, SUP]

describe('MOD-SA-11 Tiers, Entitlements and Caps — the shell contract', () => {
  it('renders under the console shell with the module id and band as annotations, one h1', () => {
    renderAs(ROOT)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent ?? "").toContain('Tiers, Entitlements and Caps',)
    expect(renderedCopy()).toMatch(/MOD-SA-11/)
    expect(renderedCopy()).toMatch(/Operations layer/)
  })

  it('keeps every SCR-SA number an annotation, never a route key (D1)', () => {
    renderAs(ROOT)
    // SCR-SA-17 and SCR-SA-14 both name this module's screen. Both are shown.
    expect(renderedCopy()).toMatch(/SCR-SA-17/)
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })

  it('carries the prototype disclosure', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/prototype/i)
  })

  it('uses none of the four forbidden words, for any role in any state', () => {
    for (const role of CONSOLE_ROLE_VIEWS) {
      for (const state of APPLICABLE_SCREEN_STATES) {
        const view = renderAs(role.token, state.id)
        expect(renderedCopy()).not.toMatch(FORBIDDEN_WORDS)
        view.unmount()
      }
    }
  })
})

describe('MOD-SA-11 — the twelve applicable screen states', () => {
  it('offers exactly the twelve applicable states and never the frontline-only STATE-07', () => {
    expect(APPLICABLE_SCREEN_STATES).toHaveLength(12)
    expect(APPLICABLE_SCREEN_STATES.map((s) => s.id)).not.toContain('STATE-07')
  })

  it('renders every applicable state for every role without throwing', () => {
    for (const role of CONSOLE_ROLE_VIEWS) {
      for (const state of APPLICABLE_SCREEN_STATES) {
        const view = renderAs(role.token, state.id)
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
        view.unmount()
      }
    }
  })

  it('STATE-11: with every AI model unavailable the module REMAINS OPERABLE (AC-SA-000-09)', () => {
    renderAs(ADMIN, 'STATE-11')
    expect(renderedCopy()).toMatch(/AI assistance unavailable/i)
    // The whole deterministic module is still there and still usable.
    expect(screen.getByRole('table', { name: /tier record/i })).not.toBeNull()
    expect(screen.getByLabelText(/grandfathering treatment/i)).not.toBeNull()
    expect(
      screen.getByRole('checkbox', { name: /grandfathering declaration/i }),
    ).not.toBeNull()
    expect(screen.getByRole('region', { name: /tier bands/i })).not.toBeNull()
  })
})

describe('MOD-SA-11 — the aggregate never renders as zero or blank (AC-SA-01-03)', () => {
  it('renders an as-of timestamp in the success state', () => {
    renderAs(ROOT, 'STATE-03')
    const agg = screen.getByRole('region', { name: /tier assignment aggregate/i })
    expect(agg.textContent ?? '').toMatch(/as of \d{4}-\d{2}-\d{2}/i)
  })

  it('degrades to stale WITH ITS AGE, never to zero', () => {
    renderAs(ROOT, 'STATE-08')
    const agg = screen.getByRole('region', { name: /tier assignment aggregate/i })
    const text = agg.textContent ?? ''
    expect(text).toMatch(/stale/i)
    expect(text).toMatch(/hours old|days old/i)
    expect(text).not.toMatch(/\b0\b/)
  })

  it('degrades to unavailable, never to zero and never to blank', () => {
    renderAs(ROOT, 'STATE-12')
    const agg = screen.getByRole('region', { name: /tier assignment aggregate/i })
    const text = agg.textContent ?? ''
    expect(text).toMatch(/unavailable/i)
    expect(text.trim().length).toBeGreaterThan(20)
    expect(text).not.toMatch(/\b0\b/)
  })

  it('renders a not-yet-read placeholder while loading, never the number nought', () => {
    renderAs(ROOT, 'STATE-02')
    const text = screen.getByRole('region', { name: /tier assignment aggregate/i }).textContent ?? ''
    expect(text).toMatch(/not yet read/i)
    expect(text).not.toMatch(/\b0\b/)
  })
})

describe('MOD-SA-11 — the tier record and its six field groups (AC-SA-11-01)', () => {
  it('exercises all four OBJ-SA-TIER states — draft, pending root approval, published, superseded', () => {
    renderAs(ROOT)
    const table = screen.getByRole('table', { name: /tier record/i })
    for (const state of ['draft', 'pending root approval', 'published', 'superseded']) {
      expect(within(table).getAllByText(state).length).toBeGreaterThan(0)
    }
    expect(new Set(TIER_RECORDS.map((r) => r.state)).size).toBe(4)
  })

  it('carries all six field groups on the record view', () => {
    renderAs(ROOT)
    expect(TIER_FIELD_GROUPS).toHaveLength(6)
    const record = screen.getByRole('region', { name: /tier record view/i })
    for (const group of TIER_FIELD_GROUPS) {
      expect(within(record).getByText(group.name)).not.toBeNull()
    }
  })

  it('renders NO price field anywhere, for any role including the root — ABSENT', () => {
    for (const role of CONSOLE_ROLE_VIEWS) {
      const view = renderAs(role.token)
      const record = screen.getByRole('region', { name: /tier record view/i })
      expect(within(record).queryByLabelText(/price|billing amount|invoice/i)).toBeNull()
      for (const button of screen.queryAllByRole('button')) {
        expect(button.textContent ?? '').not.toMatch(/price|invoice/i)
      }
      // The absence is stated where the field would be, not silently omitted.
      expect(within(record).getAllByRole('note').map((n) => n.textContent ?? '').join(' ')).toMatch(
        /no price metadata/i,
      )
      view.unmount()
    }
  })

  it('states the three tier bands by Worker-Shifts per tenant-month', () => {
    renderAs(ROOT)
    expect(TIER_BANDS).toHaveLength(3)
    const bands = screen.getByRole('region', { name: /tier bands/i })
    for (const band of TIER_BANDS) {
      expect(within(bands).getAllByText(band.name).length).toBeGreaterThan(0)
    }
    const text = bands.textContent ?? ''
    expect(text).toMatch(/below 100/i)
    expect(text).toMatch(/100 to 199/i)
    expect(text).toMatch(/200 and above/i)
  })

  it('gates Agent Author to Growth and Enterprise, leaving Job Type and Service Type ungated (AC-SA-11-06)', () => {
    renderAs(ROOT)
    const bands = screen.getByRole('region', { name: /tier bands/i })
    const text = bands.textContent ?? ''
    expect(text).toMatch(/Agent Author/)
    expect(text).toMatch(/Job Type/)
    expect(text).toMatch(/Service Type/)
    const starter = TIER_BANDS.find((b) => b.name === 'Starter')
    expect(starter?.agentAuthor).toBe(false)
    expect(TIER_BANDS.filter((b) => b.agentAuthor).map((b) => b.name)).toEqual([
      'Growth',
      'Enterprise',
    ])
  })
})

describe('MOD-SA-11 — the mandatory grandfathering declaration (AC-SA-11-03, the one source control)', () => {
  it('blocks submission until the declaration is completed, for the roles that hold it', () => {
    for (const role of [ROOT, ADMIN]) {
      const view = renderAs(role)
      const submit = screen.getByRole('button', { name: /submit tier version for root approval/i })
      expect(submit.getAttribute("aria-disabled")).toBe("true")
      expect(reasonTextOf(submit)).toMatch(/grandfathering declaration/i)
      view.unmount()
    }
  })

  it('enables submission once the declaration is completed and a treatment is declared', () => {
    renderAs(ADMIN)
    fireEvent.click(screen.getByRole('checkbox', { name: /grandfathering declaration/i }))
    const submit = screen.getByRole('button', { name: /submit tier version for root approval/i })
    expect(submit.getAttribute("aria-disabled")).toBeNull()
    fireEvent.click(submit)
    expect(screen.getByRole('status').textContent ?? '').toMatch(/pending root approval/i)
  })

  it('offers both declared treatments and only those two — grandfathered and migrated', () => {
    renderAs(ADMIN)
    const select = screen.getByLabelText(/grandfathering treatment/i)
    const options = within(select).getAllByRole('option').map((o) => o.textContent ?? '')
    expect(options).toHaveLength(2)
    expect(options.join(' ')).toMatch(/grandfathered/i)
    expect(options.join(' ')).toMatch(/migrated/i)
  })

  it('refuses the declaration to the two roles the source does not name on it, with a reason', () => {
    for (const role of [ENG, SUP]) {
      const view = renderAs(role)
      expect(screen.queryByRole('checkbox', { name: /grandfathering declaration/i })).toBeNull()
      const submit = screen.getByRole('button', { name: /submit tier version for root approval/i })
      expect(submit.getAttribute("aria-disabled")).toBe("true")
      expect(reasonTextOf(submit).length).toBeGreaterThan(20)
      view.unmount()
    }
  })
})

describe('MOD-SA-11 — tier publication is critical class (AC-SA-11-02, D12)', () => {
  it('replaces the whole publication action bar with the class badge for every non-root role', () => {
    for (const role of NON_ROOT) {
      const view = renderAs(role)
      const bar = screen.getByTestId('tier-publication-action-bar')
      expect(bar.textContent ?? '').toMatch(/critical class — root approval required/i)
      expect(within(bar).queryByRole('button')).toBeNull()
      view.unmount()
    }
  })

  it('gives the root the publication control itself, and records the one-transaction audit event', () => {
    renderAs(ROOT)
    const bar = screen.getByTestId('tier-publication-action-bar')
    const publish = within(bar).getByRole('button', { name: /publish tier version/i })
    expect(publish.getAttribute("aria-disabled")).toBeNull()
    fireEvent.click(publish)
    expect(screen.getByRole('status').textContent ?? '').toMatch(/one transaction/i)
  })

  it('names tier publication as one of the eleven critical-class actions', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/eleven/i)
  })
})

describe('MOD-SA-11 — the downgrade queue (AC-GOAL-066)', () => {
  it('states that a downgrade cannot take effect mid-cycle and queues', () => {
    renderAs(ROOT)
    const region = screen.getByRole('region', { name: /downgrade queue/i })
    const text = region.textContent ?? ''
    expect(text).toMatch(/cannot take effect mid-cycle/i)
    expect(text).toMatch(/first cycle in which consumption fits/i)
    expect(text).toMatch(/pending downgrade/i)
  })

  it('draws no mid-cycle apply control for anyone, including the root — ABSENT', () => {
    for (const role of CONSOLE_ROLE_VIEWS) {
      const view = renderAs(role.token)
      const region = screen.getByRole('region', { name: /downgrade queue/i })
      expect(within(region).queryAllByRole('button')).toHaveLength(0)
      expect(within(region).getAllByRole('note').map((n) => n.textContent ?? '').join(' ')).toMatch(
        /no account.*including the root/i,
      )
      view.unmount()
    }
  })
})

describe('MOD-SA-11 — the per-tenant feature override (D7, AC-SA-11-04, WF-FEAT-002)', () => {
  it('lets the Admin and the root set the override flag on the tenant record', () => {
    for (const role of [ROOT, ADMIN]) {
      const view = renderAs(role)
      const bar = screen.getByTestId('feature-override-action-bar')
      const control = within(bar).getByRole('button', { name: /set the per-tenant feature override/i })
      expect(control.getAttribute("aria-disabled")).toBeNull()
      view.unmount()
    }
  })

  it('refuses the override to the Platform Engineer and Support with a named reason', () => {
    for (const role of [ENG, SUP]) {
      const view = renderAs(role)
      const bar = screen.getByTestId('feature-override-action-bar')
      const control = within(bar).getByRole('button', { name: /set the per-tenant feature override/i })
      expect(control.getAttribute("aria-disabled")).toBe("true")
      expect(reasonTextOf(control).length).toBeGreaterThan(20)
      view.unmount()
    }
  })

  it('states the override is a flag on the tenant record and never an edit to the tier', () => {
    renderAs(ADMIN)
    const region = screen.getByRole('region', { name: /per-tenant feature override/i })
    expect(region.textContent ?? '').toMatch(/flag on the tenant record.*never.*tier/i)
  })

  it('draws no per-tenant tier edit for anyone — ABSENT', () => {
    for (const role of CONSOLE_ROLE_VIEWS) {
      const view = renderAs(role.token)
      const region = screen.getByRole('region', { name: /per-tenant feature override/i })
      const notes = within(region).getAllByRole('note').map((n) => n.textContent ?? '').join(' ')
      expect(notes).toMatch(/edit the tier for one tenant/i)
      for (const button of within(region).queryAllByRole('button')) {
        expect(button.textContent ?? '').not.toMatch(/edit the tier/i)
      }
      view.unmount()
    }
  })

  it('resolves a tier/override disagreement to the MORE RESTRICTIVE state and names the open decision', () => {
    renderAs(ADMIN)
    const region = screen.getByRole('region', { name: /per-tenant feature override/i })
    const text = region.textContent ?? ''
    expect(text).toMatch(/more restrictive/i)
    expect(text).toMatch(/DEC-FEAT-004/)
    const disagreeing = FEATURE_OVERRIDES.filter((o) => o.tierState !== o.overrideState)
    expect(disagreeing.length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-11 — the no-link rule (AC-SA-000-07, AC-SEC-801)', () => {
  it('resolves every tenant link to the session-request form, never to record-level content', () => {
    for (const role of CONSOLE_ROLE_VIEWS) {
      const view = renderAs(role.token)
      for (const link of screen.getAllByRole('link')) {
        const href = link.getAttribute('href') ?? ''
        expect(href).not.toMatch(/tenant.*\/(records?|runs?|jobs?|workers?|devices?)\//i)
        expect(href.startsWith('/super-admin/')).toBe(true)
      }
      expect(screen.getAllByTestId('tenant-session-request').length).toBeGreaterThan(0)
      view.unmount()
    }
  })

  it('names every tenant by token only, and states there is no ambient browsing', () => {
    renderAs(SUP)
    expect(renderedCopy()).toMatch(/no ambient browsing/i)
    for (const assignment of TENANT_TIER_ASSIGNMENTS) {
      expect(assignment.tenantToken).toMatch(/^TENANT-FIXTURE-/)
    }
  })
})

describe('MOD-SA-11 — support, not surveillance (R5)', () => {
  it('renders no rate, no per-worker series and no comparison between people', () => {
    for (const role of CONSOLE_ROLE_VIEWS) {
      const view = renderAs(role.token)
      const text = renderedCopy()
      expect(text).not.toMatch(/per worker|per-worker|per shift|per-shift|per site|per-site/i)
      expect(text).not.toMatch(/\bper hour|\bper minute|\/hr\b|\bthroughput\b|\brate\b/i)
      expect(text).not.toMatch(/\btrend(ing|s)?\b(?![^.]*not drawn)/i)
      expect(text).not.toMatch(/\branking\b|\bleaderboard\b|\btop performers?\b/i)
      view.unmount()
    }
  })

  it('renders the Worker-Shift only as a tenant-month count on a commercial ledger', () => {
    renderAs(ROOT)
    const region = screen.getByRole('region', { name: /tier assignment aggregate/i })
    const text = region.textContent ?? ''
    expect(text).toMatch(/Worker-Shifts/)
    expect(text).toMatch(/tenant-month/i)
    expect(text).toMatch(/billing unit|commercial ledger/i)
    for (const assignment of TENANT_TIER_ASSIGNMENTS) {
      expect(assignment.tenantMonth).toMatch(/^\d{4}-\d{2}$/)
    }
  })

  it('draws no per-tenant Worker-Shift trend, for anyone — ABSENT', () => {
    renderAs(ROOT)
    const region = screen.getByRole('region', { name: /tier assignment aggregate/i })
    expect(within(region).getAllByRole('note').map((n) => n.textContent ?? '').join(' ')).toMatch(
      /not drawn/i,
    )
  })
})

describe('MOD-SA-11 — the invariants are status chips, never controls (R2)', () => {
  /**
   * The FIRST version of this gate asserted only that the section's text
   * mentioned the invariant — and the heading alone satisfied that. The chip
   * itself was never rendered (a wrong id fed a `.find()` that returned
   * undefined into a `? :` guard), so a planted `<button>Turn off</button>`
   * inside the section passed. The gate now asserts the chip IS present, by
   * its registry name, before asserting nothing in the section is a control:
   * a gate that cannot see its subject cannot guard it.
   */
  it('renders the invariant chip itself, from the registry, not just its heading', () => {
    renderAs(ROOT)
    const region = screen.getByRole('region', { name: /enforced invariant/i })
    const invariant = SA_INVARIANTS.find((i) => i.id === 'one-transaction-audit-guarantee')
    expect(invariant).toBeDefined()
    // The chip's OWN text, not the invariant's bare name: the section's <h2>
    // carries that name verbatim, so a name-only assertion matched the
    // HEADING and a planted WRONG invariant id still passed. Only
    // `InvariantChip` renders `${name} — ENFORCED`, so only the chip can
    // satisfy this.
    expect(
      within(region).getAllByText(`${invariant?.name ?? ''} — ENFORCED`).length,
    ).toBeGreaterThan(0)
  })

  it('draws no button, input, switch or focusable element in the invariant section', () => {
    renderAs(ROOT)
    const region = screen.getByRole('region', { name: /enforced invariant/i })
    expect(region.querySelector('button')).toBeNull()
    expect(region.querySelector('input')).toBeNull()
    expect(region.querySelector('[role=switch]')).toBeNull()
    expect(region.querySelector('[tabindex]')).toBeNull()
  })
})

describe('MOD-SA-11 — read-only and permission-denied', () => {
  it('STATE-06 disables every action under ONE banner naming ONE cause', () => {
    renderAs(ROOT, 'STATE-06')
    expect(renderedCopy()).toMatch(/read-only/i)
    for (const button of screen.getAllByRole('button')) {
      if ((button.textContent ?? '').match(/publish|submit|set the per-tenant/i)) {
        expect(button.getAttribute("aria-disabled")).toBe("true")
      }
    }
  })

  it('shows every role what it sees when it may not act, never a silently missing control', () => {
    for (const role of NON_ROOT) {
      const view = renderAs(role)
      const bar = screen.getByTestId('tier-publication-action-bar')
      // Not blank: the refusal is visible, not hidden behind a missing button.
      expect((bar.textContent ?? '').trim().length).toBeGreaterThan(20)
      view.unmount()
    }
  })
})

describe('MOD-SA-11 — unspecified in source (D15)', () => {
  it('names each missing affordance rather than inventing one', () => {
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThanOrEqual(6)
    renderAs(ROOT)
    const region = screen.getByRole('region', { name: /unspecified in source/i })
    for (const entry of UNSPECIFIED_IN_SOURCE) {
      expect(within(region).getByText(entry.what)).not.toBeNull()
      expect(entry.detail.length).toBeGreaterThan(40)
    }
  })

  it('records that the tier ASSIGNMENT control has no stated allowed roles, and draws none', () => {
    renderAs(ROOT)
    const region = screen.getByRole('region', { name: /unspecified in source/i })
    expect(region.textContent ?? '').toMatch(/assign/i)
    for (const button of screen.getAllByRole('button')) {
      expect(button.textContent ?? '').not.toMatch(/assign (a )?tier/i)
    }
  })
})
