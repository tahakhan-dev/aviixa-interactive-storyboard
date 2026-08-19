import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { UsageMeteringScreen } from '../../app/super-admin/usage-and-metering/UsageMeteringScreen'
import { LADDER_RUNGS, LADDER_STATES, METERING_DIMENSIONS, STORAGE_DIMENSIONS, TENANT_MONTH_USAGE, USAGE_PLATFORM_ROLES, USAGE_SOURCE_CONFLICTS, USAGE_UNSPECIFIED_IN_SOURCE, USAGE_WORKFLOWS } from '../../app/super-admin/usage-and-metering/fixtures'

const MODULE = saModuleById('MOD-SA-12')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */

/**
 * Every interactive element on the page. Used by the ABSENT gates: a
 * prohibition that renders as ABSENT must draw NO control — a note only.
 * Prose that merely mentions a prohibited idea is not a violation; a control is.
 */
function interactiveText(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('button, a, input, select, textarea, [role=switch], [role=button]'),
  ).map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`)
}

describe('MOD-SA-12 Usage and Metering — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<UsageMeteringScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-12 · Operations layer/)).toBeDefined()
  })

  it('is reachable at the route the console index links to — /super-admin/<slug>/', async () => {
    // SaConsoleShell builds every index link as `/super-admin/${m.slug}/`, so
    // the route directory must BE the slug or the link is a 404 in the static
    // export. Importing the page through the slug is the only gate that fails
    // when the directory drifts from the registry.
    const page = await import(`../../app/super-admin/${MODULE.slug}/page.tsx`)
    expect(typeof page.default).toBe('function')
  })

  it('carries the prototype disclosure', () => {
    render(<UsageMeteringScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates the screen numbers without ever keying a route on one', () => {
    const { container } = render(<UsageMeteringScreen />)
    expect(screen.getAllByText(/SCR-SA-18/).length).toBeGreaterThan(0)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  it('names none of the four forbidden words anywhere in its copy, for every role in every state', () => {
    // "anywhere" means every role view in every applicable state: the denial
    // explanations only reach the DOM for the two roles that are refused, and
    // some copy only exists in one state.
    for (const role of USAGE_PLATFORM_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const { container, unmount } = render(
          <UsageMeteringScreen role={role.id} screenState={state.id} />,
        )
        // `signed` also catches assigned/designed/unsigned, which is deliberate:
        // the gate is a substring gate and the copy must survive it as written.
        expect(container.textContent ?? '', `${role.id} / ${state.id}`).not.toMatch(
          /tamper-evident|chained|signed|verified/i,
        )
        unmount()
      }
    }
  })

  it('resolves every link to the console, and tenant content only to the session-request form', () => {
    const { container } = render(<UsageMeteringScreen />)
    const hrefs = Array.from(container.querySelectorAll('a[href]')).map((el) =>
      el.getAttribute('href'),
    )
    for (const href of hrefs) expect(href).toMatch(/^\/super-admin\//)
    // Next's Link normalises the trailing slash away in jsdom; the source
    // href carries it, so the gate accepts either spelling of the same route.
    expect(hrefs.some((h) => /^\/super-admin\/support-access\/?$/.test(h ?? ''))).toBe(true)
    expect(screen.getByText(/no ambient browsing/i)).toBeDefined()
  })

  it('offers no link out of a usage row into a tenant record, for any role', () => {
    for (const role of USAGE_PLATFORM_ROLES) {
      const { container, unmount } = render(<UsageMeteringScreen role={role.id} />)
      const table = screen.getByRole('region', { name: /Cross-tenant usage/i })
      for (const el of Array.from(table.querySelectorAll('a[href]'))) {
        expect(el.getAttribute('href'), role.id).toMatch(/^\/super-admin\/support-access\/?$/)
      }
      expect(container.textContent ?? '').toMatch(/session-request form/i)
      unmount()
    }
  })
})

describe('MOD-SA-12 — Worker-Shift is a billing unit, and the line holds at the tenant', () => {
  it('states the counting rule as one Worker-Shift per worker per calendar shift regardless of run count', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Worker-Shift/i })
    expect(within(panel).getByText(/regardless of run count/i)).toBeDefined()
    expect(within(panel).getByText(/AC-GOAL-060/)).toBeDefined()
    expect(within(panel).getByText(/AC-GOAL-061/)).toBeDefined()
  })

  it('renders no rate, no per-shift figure and no per-worker series anywhere, for any role', () => {
    for (const role of USAGE_PLATFORM_ROLES) {
      const { container, unmount } = render(<UsageMeteringScreen role={role.id} />)
      const text = container.textContent ?? ''
      // `per-worker series` is deliberately NOT in this list. The module
      // registry's own purpose string — spine copy this module may not edit —
      // reads "never a rate, never a per-worker series", so a gate carrying
      // that phrase matches its own denial and fails on prose that is doing
      // the right thing. The gate is for a rendered series, not for the
      // sentence forbidding one.
      expect(text, role.id).not.toMatch(
        /\bper worker\b|\bby worker\b|worker ranking|worker leaderboard|per hour|per day|per week|\bper shift\b|Worker-Shifts\/|utilisation rate|throughput/i,
      )
      unmount()
    }
  })

  it('names the missing per-worker breakdown as an absence rather than drawing one', () => {
    render(<UsageMeteringScreen />)
    const absences = screen.getByRole('region', { name: /Controls that do not exist/i })
    expect(within(absences).getByText(/no breakdown of Worker-Shifts below the tenant/i)).toBeDefined()
    expect(absences.querySelector('button')).toBeNull()
    expect(absences.querySelector('input')).toBeNull()
  })

  it('keeps every usage figure at tenant-month, naming the month on every row', () => {
    render(<UsageMeteringScreen />)
    const table = screen.getByRole('region', { name: /Cross-tenant usage/i })
    for (const row of TENANT_MONTH_USAGE) {
      const cell = within(table).getByText(row.tenantLabel).closest('tr')
      expect(cell?.textContent ?? '', row.tenantLabel).toContain(row.monthLabel)
    }
  })

  it('offers no control that opens a breakdown below the tenant, for any role', () => {
    for (const role of USAGE_PLATFORM_ROLES) {
      const { container, unmount } = render(<UsageMeteringScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `interactive element offered to ${role.id}`).not.toMatch(
          /worker|site|area|line|cell|shift breakdown|drill/i,
        )
      }
      unmount()
    }
  })
})

describe('MOD-SA-12 — the usage ladder is four rungs of status, never enforcement', () => {
  it('renders the four rungs at 80, 100, 100 to 125 and above 125 per cent', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Usage ladder/i })
    expect(LADDER_RUNGS).toHaveLength(4)
    for (const rung of LADDER_RUNGS) {
      expect(within(panel).getByText(rung.threshold), rung.threshold).toBeDefined()
    }
  })

  it('keeps the ladder-state vocabulary closed at the five OBJ-SA-LADDERSTATE values', () => {
    expect(LADDER_STATES).toEqual([
      'under 80 percent',
      'at 80 percent',
      'at 100 percent',
      'in burst',
      'above 125 percent flagged',
    ])
  })

  it('states that no rung blocks work and that the strongest outcome is a flag (AC-SA-12-03)', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Usage ladder/i })
    expect(within(panel).getByText(/strongest outcome is a flag/i)).toBeDefined()
    expect(within(panel).getByText(/AC-SA-12-03/)).toBeDefined()
  })

  it('renders every rung as a status readout, never as a switch or a control', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Usage ladder/i })
    expect(panel.querySelector('[role=switch]')).toBeNull()
    for (const text of interactiveText(panel)) {
      expect(text).not.toMatch(/block|stop|suspend|enforce|cap work|halt/i)
    }
  })

  it('records burst entry as its own event, fired once per crossing (AC-SA-12-04)', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Ladder events/i })
    expect(within(panel).getByText(/once per crossing, not once per evaluation/i)).toBeDefined()
    expect(within(panel).getAllByText(/burst entry/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-12 — the five metering dimensions and the four storage dimensions', () => {
  it('keeps both sets closed at their source counts', () => {
    expect(METERING_DIMENSIONS).toHaveLength(5)
    expect(STORAGE_DIMENSIONS).toEqual([
      'evidence media',
      'workflow packages',
      'the parts registry',
      'training content',
    ])
  })

  it('renders each metering dimension as a tenant-month count with its as-of time', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Per-tenant ledger/i })
    for (const dimension of METERING_DIMENSIONS) {
      expect(
        within(panel).getAllByText(new RegExp(dimension.name, 'i')).length,
        dimension.id,
      ).toBeGreaterThan(0)
    }
    expect(within(panel).getByText(/as of/i)).toBeDefined()
  })

  it('renders the four storage dimensions as their own series with an as-of time', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Storage dimensions/i })
    for (const dimension of STORAGE_DIMENSIONS) {
      expect(within(panel).getAllByText(new RegExp(dimension, 'i')).length, dimension).toBeGreaterThan(0)
    }
    expect(within(panel).getByText(/as of/i)).toBeDefined()
  })

  it('attributes a late-arriving event to its event time, not its arrival time (AC-SA-12-07)', () => {
    render(<UsageMeteringScreen />)
    expect(screen.getByText(/event time, not their arrival time/i)).toBeDefined()
  })
})

describe('MOD-SA-12 — per-control allowed roles, through evaluateAccess', () => {
  it.each([
    ['ROOT_SUPER_ADMIN', true],
    ['ADMIN', true],
    ['PLATFORM_ENGINEER', false],
    ['SUPPORT', false],
  ] as const)('renders the ledger export control for %s as actionable=%s', (roleId, actionable) => {
    render(<UsageMeteringScreen role={roleId} />)
    const panel = screen.getByRole('region', { name: /Ledger export/i })
    const control = within(panel).getByRole('button', { name: /Export the usage ledger/i })
    if (actionable) {
      expect(control.getAttribute('aria-disabled')).toBeNull()
    } else {
      // DISABLED WITH A NAMED REASON: drawn, inert, reason in visible text.
      expect(control.getAttribute('aria-disabled')).toBe('true')
      const describedBy = control.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      const reason = document.getElementById(describedBy ?? '')
      expect(reason?.textContent ?? '').toMatch(/Band B|Support/i)
    }
  })

  it.each([
    ['ROOT_SUPER_ADMIN', true],
    ['ADMIN', true],
    ['PLATFORM_ENGINEER', false],
    ['SUPPORT', false],
  ] as const)('renders the threshold control for %s as actionable=%s', (roleId, actionable) => {
    render(<UsageMeteringScreen role={roleId} />)
    const panel = screen.getByRole('region', { name: /Ladder thresholds/i })
    const control = within(panel).getByRole('button', { name: /Set the ladder thresholds/i })
    expect(control.getAttribute('aria-disabled')).toBe(actionable ? null : 'true')
  })

  it('gives all four roles read on every panel, and says so where a role may not act', () => {
    for (const role of USAGE_PLATFORM_ROLES) {
      const { unmount } = render(<UsageMeteringScreen role={role.id} />)
      for (const name of [
        /Cross-tenant usage/i,
        /Per-tenant ledger/i,
        /Usage ladder/i,
        /Storage dimensions/i,
        /Ledger export/i,
      ]) {
        expect(screen.getByRole('region', { name }), role.id).toBeDefined()
      }
      unmount()
    }
  })

  it('names every one of the four platform roles as a view switcher, never a login', () => {
    render(<UsageMeteringScreen />)
    expect(USAGE_PLATFORM_ROLES).toHaveLength(4)
    const selector = screen.getByLabelText(/Console role/i)
    for (const role of USAGE_PLATFORM_ROLES) {
      expect(within(selector).getByText(new RegExp(role.roleAnnotation))).toBeDefined()
    }
    expect(screen.getByText(/view switcher, not a login/i)).toBeDefined()
  })

  it('replaces the allocation-ceiling action bar with the class badge for every non-root role', () => {
    for (const role of USAGE_PLATFORM_ROLES) {
      const { unmount } = render(<UsageMeteringScreen role={role.id} />)
      const panel = screen.getByRole('region', { name: /Allocation ceiling/i })
      if (role.id === 'ROOT_SUPER_ADMIN') {
        expect(within(panel).queryByText(/Critical class — root approval required/)).toBeNull()
      } else {
        expect(
          within(panel).getByText(/Critical class — root approval required/),
          role.id,
        ).toBeDefined()
      }
      // No control either way: the submission is not offered on this module.
      expect(panel.querySelector('button'), role.id).toBeNull()
      unmount()
    }
  })
})

describe('MOD-SA-12 — what is absent, for everyone including the root', () => {
  it('offers no invoicing, payment or pricing control to any role (AC-SA-12-02)', () => {
    for (const role of USAGE_PLATFORM_ROLES) {
      const { container, unmount } = render(<UsageMeteringScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `interactive element offered to ${role.id}`).not.toMatch(
          /invoice|invoicing|payment|pric|bill\b|charge|currency|amount due/i,
        )
      }
      expect(screen.getAllByText(/AC-SA-12-02/).length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('offers no delete or purge control on any storage surface (L97037)', () => {
    for (const role of USAGE_PLATFORM_ROLES) {
      const { container, unmount } = render(<UsageMeteringScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `interactive element offered to ${role.id}`).not.toMatch(
          /delete|purge|erase|remove/i,
        )
      }
      unmount()
    }
  })

  it('draws a one-line note where each absent control would be, never a disabled one', () => {
    render(<UsageMeteringScreen />)
    const absences = screen.getByRole('region', { name: /Controls that do not exist/i })
    for (const phrase of [/invoicing/i, /purge/i, /below the tenant/i, /blocks work/i]) {
      expect(within(absences).getAllByText(phrase).length).toBeGreaterThan(0)
    }
    expect(absences.querySelector('button')).toBeNull()
  })

  it('renders the two applicable invariants as status chips, never as controls', () => {
    render(<UsageMeteringScreen />)
    const region = screen.getByRole('region', { name: /Enforced invariants/i })
    expect(region.querySelector('button')).toBeNull()
    expect(region.querySelector('input')).toBeNull()
    expect(region.querySelector('[role=switch]')).toBeNull()
    expect(region.querySelector('[tabindex]')).toBeNull()
    expect(within(region).getAllByText(/ENFORCED/)).toHaveLength(2)
  })
})

describe('MOD-SA-12 — the twelve applicable screen states', () => {
  it('offers all twelve, and never the frontline-only STATE-07', () => {
    render(<UsageMeteringScreen />)
    const selector = screen.getByLabelText(/Screen state/i)
    expect(within(selector).queryByText(/STATE-07/)).toBeNull()
    for (const state of SA_APPLICABLE_STATES) {
      expect(within(selector).getByText(new RegExp(state.id)), state.id).toBeDefined()
    }
    expect(within(selector).getAllByRole('option')).toHaveLength(12)
  })

  it.each(SA_APPLICABLE_STATES.map((s) => s.id))('renders %s without losing the module', (stateId) => {
    render(<UsageMeteringScreen screenState={stateId} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('region', { name: /Usage ladder/i })).toBeDefined()
  })

  it('STATE-11: with every model unavailable the module remains fully operable (AC-SA-000-09)', () => {
    render(<UsageMeteringScreen role="ADMIN" screenState="STATE-11" />)
    const panel = screen.getByRole('region', { name: /Ledger export/i })
    expect(
      within(panel).getByRole('button', { name: /Export the usage ledger/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    // Metering counts operational events; it does not depend on a model.
    const table = screen.getByRole('region', { name: /Cross-tenant usage/i })
    for (const row of TENANT_MONTH_USAGE) {
      expect(within(table).getByText(row.tenantLabel), row.tenantLabel).toBeDefined()
    }
    expect(screen.getByText(/never rewrites what was already metered/i)).toBeDefined()
  })

  it('STATE-11 keeps the agent-run dimension at its metered figure rather than zeroing it', () => {
    render(<UsageMeteringScreen screenState="STATE-11" />)
    const ledger = screen.getByRole('region', { name: /Per-tenant ledger/i })
    const row = within(ledger).getByText(/agent-run/i).closest('tr')
    expect(row?.textContent ?? '').not.toMatch(/\b0\b/)
  })

  it('STATE-03 renders every aggregate with its as-of time', () => {
    render(<UsageMeteringScreen screenState="STATE-03" />)
    for (const name of [
      /Cross-tenant usage/i,
      /Per-tenant ledger/i,
      /Storage dimensions/i,
      /Ladder events/i,
    ]) {
      const panel = screen.getByRole('region', { name })
      expect(within(panel).getByText(/as of/i), String(name)).toBeDefined()
    }
  })

  it('STATE-08 degrades every ledger-derived panel to stale WITH its age, never to zero', () => {
    render(<UsageMeteringScreen screenState="STATE-08" />)
    for (const name of [
      /Cross-tenant usage/i,
      /Per-tenant ledger/i,
      /Storage dimensions/i,
      /Ladder events/i,
    ]) {
      const panel = screen.getByRole('region', { name })
      const text = panel.textContent ?? ''
      expect(text, String(name)).toMatch(/stale/i)
      expect(text, String(name)).toMatch(/\d+ (minutes|hours) old/i)
    }
  })

  it('STATE-02 replaces every ledger-derived panel with a placeholder, never fetched-looking rows', () => {
    render(<UsageMeteringScreen screenState="STATE-02" />)
    for (const name of [
      /Cross-tenant usage/i,
      /Per-tenant ledger/i,
      /Storage dimensions/i,
      /Ladder events/i,
    ]) {
      const panel = screen.getByRole('region', { name })
      expect(within(panel).getByRole('status'), String(name)).toBeDefined()
      expect(panel.querySelector('table'), String(name)).toBeNull()
    }
  })

  it('STATE-01 empties every ledger-derived panel, so the screen never contradicts itself', () => {
    render(<UsageMeteringScreen screenState="STATE-01" />)
    for (const [name, empty] of [
      [/Cross-tenant usage/i, /no Worker-Shift has metered/i],
      [/Per-tenant ledger/i, /Nothing has metered for this tenant/i],
      [/Storage dimensions/i, /No storage volume has metered/i],
      [/Ladder events/i, /No ladder threshold has been crossed/i],
    ] as const) {
      const panel = screen.getByRole('region', { name })
      expect(within(panel).getByText(empty), String(name)).toBeDefined()
      expect(panel.textContent ?? '', String(name)).not.toMatch(/\b0\b/)
    }
  })

  it('STATE-12 degrades every ledger-derived panel to unavailable, never to zero or blank', () => {
    render(<UsageMeteringScreen screenState="STATE-12" />)
    for (const name of [
      /Cross-tenant usage/i,
      /Per-tenant ledger/i,
      /Storage dimensions/i,
      /Ladder events/i,
    ]) {
      const panel = screen.getByRole('region', { name })
      expect(panel.textContent ?? '', String(name)).toMatch(/Unavailable/i)
      expect(panel.querySelector('table'), String(name)).toBeNull()
    }
  })

  it('STATE-12 degrades the aggregate to unavailable, never to zero or blank', () => {
    render(<UsageMeteringScreen screenState="STATE-12" />)
    const table = screen.getByRole('region', { name: /Cross-tenant usage/i })
    expect(table.textContent ?? '').toMatch(/Unavailable/i)
    expect(table.textContent ?? '').not.toMatch(/\b0\b/)
  })

  it('STATE-02 renders a placeholder, never the number nought', () => {
    render(<UsageMeteringScreen screenState="STATE-02" />)
    const table = screen.getByRole('region', { name: /Cross-tenant usage/i })
    expect(table.textContent ?? '').not.toMatch(/\b0\b/)
    expect(within(table).getByRole('status')).toBeDefined()
  })

  it('STATE-01 names what would appear here instead of rendering a zero', () => {
    render(<UsageMeteringScreen screenState="STATE-01" />)
    const table = screen.getByRole('region', { name: /Cross-tenant usage/i })
    expect(table.textContent ?? '').not.toMatch(/\b0\b/)
    expect(within(table).getByText(/no Worker-Shift has metered/i)).toBeDefined()
  })

  it('STATE-10 declares a drifted storage dimension unreliable rather than showing a wrong number', () => {
    render(<UsageMeteringScreen screenState="STATE-10" />)
    const panel = screen.getByRole('region', { name: /Storage dimensions/i })
    expect(within(panel).getByText(/unreliable/i)).toBeDefined()
  })

  it('STATE-09 renders an accepted export in its own state, never as exported', () => {
    render(<UsageMeteringScreen role="ADMIN" screenState="STATE-09" />)
    const panel = screen.getByRole('region', { name: /Ledger export/i })
    expect(within(panel).getByText(/requested/i)).toBeDefined()
    expect(within(panel).queryByText(/^exported$/i)).toBeNull()
  })

  it('STATE-06: one banner, one cause', () => {
    render(<UsageMeteringScreen screenState="STATE-06" />)
    expect(
      screen.getAllByRole('status').filter((n) => /read-only/i.test(n.textContent ?? '')),
    ).toHaveLength(1)
  })

  it('STATE-04 states the rule that was broken and what would be accepted', () => {
    render(<UsageMeteringScreen role="ADMIN" screenState="STATE-04" />)
    const alert = screen.getByRole('alert')
    expect(alert.textContent ?? '').toMatch(/per cent of the monthly allocation/i)
  })

  it('STATE-13 re-derives from the event-sourced ledger rather than presenting a partial as recovered', () => {
    render(<UsageMeteringScreen screenState="STATE-13" />)
    expect(screen.getByText(/re-derived/i)).toBeDefined()
  })
})

describe('MOD-SA-12 — what the source does not define', () => {
  it('names every missing affordance instead of inventing a control', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Unspecified in source/i })
    expect(USAGE_UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const item of USAGE_UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(item.affordance), item.affordance).toBeDefined()
    }
    expect(panel.querySelector('button')).toBeNull()
    expect(panel.querySelector('input')).toBeNull()
  })

  it('states the conflicts the source leaves open rather than resolving them silently', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Conflicts in the source/i })
    expect(USAGE_SOURCE_CONFLICTS.length).toBeGreaterThan(0)
    for (const phrase of [/SCR-SA-15/, /L45404/, /D16/]) {
      expect(within(panel).getAllByText(phrase).length).toBeGreaterThan(0)
    }
  })

  it('says how each workflow was matched to this module', () => {
    render(<UsageMeteringScreen />)
    const panel = screen.getByRole('region', { name: /Workflows/i })
    for (const workflow of USAGE_WORKFLOWS) {
      expect(within(panel).getByText(workflow.name), workflow.id).toBeDefined()
      expect(
        within(panel).getAllByText(workflow.matchedBy, { exact: false }).length,
        workflow.id,
      ).toBeGreaterThan(0)
    }
  })
})
