import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { TenantMetricsScreen } from '../../app/super-admin/tenant-metrics-and-aggregates/TenantMetricsScreen'
import { METRIC_STATES, SA10_ABSENT_CONTROLS, SA10_MEASURE_COUNT, SA10_PLATFORM_ROLES, SA10_READ_MEASURES_SOURCE_REFS, SA10_TENANT_MONTHS, SA10_UNSPECIFIED_IN_SOURCE } from '../../app/super-admin/tenant-metrics-and-aggregates/fixtures'

const MODULE = saModuleById('MOD-SA-10')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */

function interactiveText(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('button, a, input, select, [role=switch], [role=button]'),
  ).map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`)
}

/** SCR-SA-16 is two tabs; the comparative one is not the landing tab. */
function showComparative(): void {
  fireEvent.click(screen.getByRole('tab', { name: /Anonymised comparative/i }))
}

describe('MOD-SA-10 Tenant Metrics and Aggregates — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<TenantMetricsScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-10 · Operations layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<TenantMetricsScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates SCR-SA-16 without ever keying a route on a bare number', () => {
    const { container } = render(<TenantMetricsScreen />)
    expect(screen.getAllByText(/SCR-SA-16/).length).toBeGreaterThan(0)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  /**
   * Swept across every role AND every applicable state, and across both
   * tabs. A single default render is not a gate: it was blind to copy that
   * only appears in STATE-10/STATE-11, which is exactly where a planted
   * "verified" survived it.
   */
  it('names none of the four forbidden words in any state, for any role, on either tab', () => {
    for (const role of SA10_PLATFORM_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const { container, unmount } = render(
          <TenantMetricsScreen role={role.id} screenState={state.id} />,
        )
        expect(container.textContent ?? '').not.toMatch(/tamper-evident|chained|signed|verified/i)
        showComparative()
        expect(container.textContent ?? '').not.toMatch(/tamper-evident|chained|signed|verified/i)
        unmount()
      }
    }
    // 48 full renders plus 48 tab clicks: past the 5s default on a cold
    // transform cache, which aborted the sweep partway and still reported as
    // a run. The gate must finish, not merely start.
  }, 30_000)

  it('resolves every link inside the console in every state, never to record-level tenant content', () => {
    for (const role of SA10_PLATFORM_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const { container, unmount } = render(
          <TenantMetricsScreen role={role.id} screenState={state.id} />,
        )
        showComparative()
        for (const el of Array.from(container.querySelectorAll('a[href]'))) {
          expect(el.getAttribute('href')).toMatch(/^\/super-admin\//)
        }
        unmount()
      }
    }
  }, 30_000)
})

describe('MOD-SA-10 — the two tabs SCR-SA-16 names', () => {
  it('renders a per-tenant tab and a comparative tab, and nothing else', () => {
    render(<TenantMetricsScreen />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs.map((t) => t.textContent)).toEqual(['Per tenant', 'Anonymised comparative'])
  })

  it('keeps the metric-state vocabulary closed at the four source values', () => {
    expect([...METRIC_STATES]).toEqual(['current', 'stale', 'unavailable', 'reconciled'])
  })
})

describe('MOD-SA-10 — R5: the line holds at the tenant', () => {
  it('offers only tenant-month periods, never a finer grain, on the period filter', () => {
    render(<TenantMetricsScreen />)
    const period = screen.getByLabelText(/Period \(tenant-month\)/i)
    const options = Array.from(period.querySelectorAll('option')).map((o) => o.textContent ?? '')
    expect(options).toHaveLength(SA10_TENANT_MONTHS.length)
    for (const label of options) {
      expect(label).toMatch(/^\d{4}-\d{2}\b/)
      expect(label).not.toMatch(/day|hour|shift|week/i)
    }
  })

  it('renders no per-worker, per-shift or sub-tenant series as a selectable dimension', () => {
    const { container } = render(<TenantMetricsScreen />)
    for (const text of interactiveText(container)) {
      expect(text).not.toMatch(/per worker|per-worker|by worker|per shift|per-shift|by site|per site/i)
    }
  })

  it('renders every measure value as a count on a tenant-month, never as a division or a per-unit value', () => {
    const { container } = render(<TenantMetricsScreen />)
    const values = Array.from(container.querySelectorAll('[data-measure-value]')).map(
      (el) => el.textContent ?? '',
    )
    expect(values.length).toBeGreaterThan(0)
    for (const v of values) {
      expect(v).not.toMatch(/%|per hour|per day|per run|per worker|\bper\s|\/\s*(hour|day|run|worker)/i)
    }
  })

  it('names worker identity among the dimensions the platform refuses to carry', () => {
    render(<TenantMetricsScreen />)
    expect(screen.getAllByText(/worker identity/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-10 — anonymisation precedes aggregation, and cannot be switched off', () => {
  it('renders the anonymisation invariant as a status chip with no control of any kind', () => {
    const { container } = render(<TenantMetricsScreen />)
    const region = screen.getByRole('region', { name: /Enforced invariant/i })
    expect(within(region).getByText(/Cross-tenant analytics anonymisation — ENFORCED/)).toBeDefined()
    expect(region.querySelector('button')).toBeNull()
    expect(region.querySelector('input')).toBeNull()
    expect(region.querySelector('[role=switch]')).toBeNull()
    expect(region.querySelector('[tabindex]')).toBeNull()
    expect(container.textContent ?? '').toMatch(/precedes aggregation/i)
  })

  it('draws no de-anonymisation control for any role including the root — absence is the control', () => {
    for (const role of SA10_PLATFORM_ROLES) {
      const { container, unmount } = render(<TenantMetricsScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text).not.toMatch(/de-anonymis|deanonymis|re-identif|reveal tenant/i)
      }
      expect(screen.getAllByText(/absence is the control/i).length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('draws a one-line note where each absent control would be, and no control there', () => {
    const { container } = render(<TenantMetricsScreen />)
    const region = screen.getByRole('region', { name: /Controls that do not exist here/i })
    expect(region.querySelectorAll('button, input, select, a[href]')).toHaveLength(0)
    for (const absent of SA10_ABSENT_CONTROLS) {
      expect(within(region).getByText(absent.label)).toBeDefined()
    }
    expect(container).toBeDefined()
  })
})

describe('MOD-SA-10 — tenant memory reads Unavailable for every console role', () => {
  it('reads "Unavailable — counts and volume only" for root, Admin and Platform Engineer', () => {
    for (const role of ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER'] as const) {
      const { unmount } = render(<TenantMetricsScreen role={role} />)
      const region = screen.getByRole('region', { name: /Tenant memory content/i })
      expect(within(region).getByText(/Unavailable — counts and volume only/)).toBeDefined()
      unmount()
    }
  })

  it('reads flatly Unavailable for Support, which the source does not soften', () => {
    render(<TenantMetricsScreen role="SUPPORT" />)
    const region = screen.getByRole('region', { name: /Tenant memory content/i })
    expect(within(region).getByText(/^Unavailable$/)).toBeDefined()
  })

  it('exposes no memory content control for any role', () => {
    for (const role of SA10_PLATFORM_ROLES) {
      const { unmount } = render(<TenantMetricsScreen role={role.id} />)
      const region = screen.getByRole('region', { name: /Tenant memory content/i })
      expect(region.querySelectorAll('button, input, select, a[href]')).toHaveLength(0)
      unmount()
    }
  })
})

describe('MOD-SA-10 — per-control allowed roles, through evaluateAccess', () => {
  /**
   * L107350 gives "request a support session" allowed_roles
   * ["Platform Engineer", "Support"], and D17 holds the prohibition for the
   * Platform Engineer. That leaves Support, and Support alone. Sweeping all
   * four roles is the point: a single default render would pass while the
   * root and the Admin held a grant no source line states.
   */
  // Spec S3, the third case. D17 is CATEGORICAL for the Platform Engineer --
  // "may not enter tenant context under any access class" -- so nothing is
  // drawn for that role, the same way MOD-SA-15 renders it. The root and the
  // platform Admin are merely not attributed this narrower act, which is a
  // conditional non-grant, so they get the control drawn inert with its reason.
  // This test asserted a disabled button for all three until a cross-module
  // review found the two screens rendering one prohibition two ways.
  it('draws nothing for the Platform Engineer, inert for root and Admin, live for Support', () => {
    for (const role of SA10_PLATFORM_ROLES) {
      const { unmount } = render(<TenantMetricsScreen role={role.id} />)
      if (role.id === 'PLATFORM_ENGINEER') {
        expect(
          screen.queryByRole('button', { name: /Request a support session/i }),
          'a categorical prohibition must draw no control at all',
        ).toBeNull()
        expect(document.body.textContent ?? '').toMatch(/D17/)
        unmount()
        continue
      }
      const button = screen.getByRole('button', { name: /Request a support session/i })
      if (role.id === 'SUPPORT') {
        expect(button.getAttribute('aria-disabled'), role.id).toBeNull()
        fireEvent.click(button)
        expect(screen.getByRole('region', { name: /Session request/i })).toBeDefined()
        expect(screen.getByLabelText(/Reason/i)).toBeDefined()
      } else {
        expect(button.getAttribute('aria-disabled'), role.id).toBe('true')
        const describedBy = button.getAttribute('aria-describedby')
        expect(describedBy, role.id).not.toBeNull()
        const reasonText = document.getElementById(describedBy ?? '')?.textContent ?? ''
        expect(reasonText, role.id).toMatch(/L107350/)
        expect(reasonText, role.id).toMatch(/Support/)
        expect(reasonText, role.id).not.toMatch(/^denied$/i)
        fireEvent.click(button)
        expect(screen.queryByRole('region', { name: /Session request/i }), role.id).toBeNull()
      }
      unmount()
    }
  })

  /**
   * L107350 gives "open the tenant's own audit log view" allowed_roles
   * ["Platform Engineer"] and nothing else; L97154 and D17 refuse that role
   * here. The action therefore exists for NOBODY, which is the one case §3
   * reserves ABSENT for — not a disabled control, which would assert an
   * enabled state exists for someone.
   */
  it('draws no audit-log-view control for any role including the root, only the note in its place', () => {
    for (const role of SA10_PLATFORM_ROLES) {
      const { unmount } = render(<TenantMetricsScreen role={role.id} />)
      expect(screen.queryByRole('button', { name: /audit log view/i }), role.id).toBeNull()
      const region = screen.getByRole('region', { name: /Onward actions from a measure/i })
      expect(within(region).getByText(/No console role carries this action here/i)).toBeDefined()
      // The session request is the region's only control -- and for the
      // Platform Engineer there is none at all, because D17 is categorical
      // (spec S3, third case) and a categorical prohibition draws nothing.
      expect(region.querySelectorAll('button'), role.id).toHaveLength(
        role.id === 'PLATFORM_ENGINEER' ? 0 : 1,
      )
      unmount()
    }
  })

  it('shows every one of the four roles the measures, including when it may not act', () => {
    for (const role of SA10_PLATFORM_ROLES) {
      const { unmount } = render(<TenantMetricsScreen role={role.id} />)
      expect(screen.getByRole('region', { name: /Per-tenant measures/i })).toBeDefined()
      unmount()
    }
  })

  it('names all four platform roles as a view switcher, never a login', () => {
    render(<TenantMetricsScreen />)
    const selector = screen.getByLabelText(/Console role/i)
    const options = Array.from(selector.querySelectorAll('option')).map((o) => o.textContent ?? '')
    expect(options).toHaveLength(4)
    for (const annotation of ['ROLE-PLAT-ROOT', 'ROLE-PLAT-ADMIN', 'ROLE-PLAT-ENG', 'ROLE-PLAT-SUP']) {
      expect(options.some((o) => o.includes(annotation))).toBe(true)
    }
    expect(screen.getByText(/view switcher, not a login/i)).toBeDefined()
  })
})

describe('MOD-SA-10 — the comparative is a cross-tenant aggregate (L97152–L97155)', () => {
  it('refuses it to Support in every applicable state, and to no other role', () => {
    for (const role of SA10_PLATFORM_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const label = `${role.id} ${state.id}`
        const { unmount } = render(<TenantMetricsScreen role={role.id} screenState={state.id} />)
        showComparative()
        const region = screen.getByRole('region', { name: /Anonymised comparative/i })
        const refusal = within(region).queryByText(/Cross-tenant aggregates: Unavailable to this role/i)
        if (role.id === 'SUPPORT') {
          expect(refusal, label).not.toBeNull()
          expect(region.textContent ?? '', label).toMatch(/L97155/)
          expect(region.querySelectorAll('[data-distribution-band]'), label).toHaveLength(0)
          // A refused aggregate is a refusal, never a zero and never a blank.
          expect((region.textContent ?? '').trim().length, label).toBeGreaterThan(0)
        } else {
          expect(refusal, label).toBeNull()
        }
        unmount()
      }
    }
  }, 30_000)

  it('still renders the distribution for the three roles L97152–L97154 allow it to', () => {
    for (const role of ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER'] as const) {
      const { unmount } = render(<TenantMetricsScreen role={role} screenState="STATE-03" />)
      showComparative()
      const region = screen.getByRole('region', { name: /Anonymised comparative/i })
      expect(region.querySelectorAll('[data-distribution-band]').length, role).toBeGreaterThan(0)
      unmount()
    }
  })

  it('names the roles that do read it, rather than hiding the refusal behind a missing tab', () => {
    render(<TenantMetricsScreen role="SUPPORT" />)
    // Both tabs stay reachable; the refusal is stated in the panel.
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    showComparative()
    const region = screen.getByRole('region', { name: /Anonymised comparative/i })
    expect(region.textContent ?? '').toMatch(/L97152/)
    expect(region.textContent ?? '').toMatch(/Platform Engineer/)
  })
})

describe('MOD-SA-10 — the twelve applicable screen states', () => {
  it('offers all twelve, and never the frontline-only STATE-07', () => {
    render(<TenantMetricsScreen />)
    const selector = screen.getByLabelText(/Screen state/i)
    const options = Array.from(selector.querySelectorAll('option')).map((o) => o.value)
    expect(options).toHaveLength(12)
    expect(options).not.toContain('STATE-07')
    for (const state of SA_APPLICABLE_STATES) expect(options).toContain(state.id)
  })

  it('STATE-11: with every model unavailable the module remains fully operable', () => {
    render(<TenantMetricsScreen screenState="STATE-11" />)
    const measures = screen.getByRole('region', { name: /Per-tenant measures/i })
    expect(measures.querySelectorAll('[data-measure-value]').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/derived from telemetry, not from a model/i).length).toBeGreaterThan(0)
    // The measure still renders its value with its as-of time: nothing about
    // this module depends on a model, so nothing about it goes away.
    expect(screen.getAllByText(/As of /).length).toBeGreaterThan(0)
    // Both tabs stay reachable and the comparative still aggregates.
    showComparative()
    const comparative = screen.getByRole('region', { name: /Anonymised comparative/i })
    expect(comparative.querySelectorAll('[data-distribution-band]').length).toBeGreaterThan(0)
  })

  it('STATE-10: a degraded model changes nothing here either', () => {
    render(<TenantMetricsScreen screenState="STATE-10" />)
    expect(screen.getByRole('region', { name: /Per-tenant measures/i })).toBeDefined()
    expect(screen.getAllByText(/As of /).length).toBeGreaterThan(0)
  })

  it('STATE-06: one banner, one cause', () => {
    render(<TenantMetricsScreen screenState="STATE-06" />)
    expect(screen.getAllByRole('status').filter((n) => /Read-only/i.test(n.textContent ?? ''))).toHaveLength(1)
  })

  /**
   * STATE-06's contract is "every input is disabled"; STATE-12's is that the
   * reader is never left unsure whether anything was written. Both are
   * screen state, which no role check can see — so the form must read the
   * state, not the role.
   */
  it('STATE-06 and STATE-12: every form input is disabled and nothing can be submitted', () => {
    for (const state of ['STATE-06', 'STATE-12'] as const) {
      const { unmount } = render(<TenantMetricsScreen role="SUPPORT" screenState={state} />)
      fireEvent.click(screen.getByRole('button', { name: /Request a support session/i }))
      const region = screen.getByRole('region', { name: /Session request/i })
      const inputs = Array.from(region.querySelectorAll('textarea, input'))
      expect(inputs.length, state).toBeGreaterThan(0)
      for (const el of inputs) {
        expect((el as HTMLTextAreaElement | HTMLInputElement).disabled, `${state} ${el.tagName}`).toBe(true)
      }
      const submit = screen.getByRole('button', { name: /Submit session request/i })
      expect(submit.getAttribute('aria-disabled'), state).toBe('true')
      fireEvent.click(submit)
      expect(screen.queryByText(/Request pending/i), state).toBeNull()
      unmount()
    }
  })

  it('leaves that same form live in a state that is neither read-only nor failure', () => {
    render(<TenantMetricsScreen role="SUPPORT" screenState="STATE-03" />)
    fireEvent.click(screen.getByRole('button', { name: /Request a support session/i }))
    const region = screen.getByRole('region', { name: /Session request/i })
    const inputs = Array.from(region.querySelectorAll('textarea, input'))
    expect(inputs.length).toBeGreaterThan(0)
    for (const el of inputs) {
      expect((el as HTMLTextAreaElement | HTMLInputElement).disabled).toBe(false)
    }
    fireEvent.click(screen.getByRole('button', { name: /Submit session request/i }))
    expect(screen.getAllByText(/Request pending/i).length).toBeGreaterThan(0)
  })

  it('STATE-09: a submitted session request renders as pending, never as an open session', () => {
    render(<TenantMetricsScreen role="SUPPORT" screenState="STATE-09" />)
    fireEvent.click(screen.getByRole('button', { name: /Request a support session/i }))
    fireEvent.click(screen.getByRole('button', { name: /Submit session request/i }))
    expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/session is open/i)).toBeNull()
  })

  it('STATE-04: a session request with no reason names the rule and what would be accepted', () => {
    render(<TenantMetricsScreen role="SUPPORT" screenState="STATE-04" />)
    fireEvent.click(screen.getByRole('button', { name: /Request a support session/i }))
    fireEvent.click(screen.getByRole('button', { name: /Submit session request/i }))
    const alert = screen.getByRole('alert')
    expect(alert.textContent ?? '').toMatch(/reason/i)
  })
})

describe('MOD-SA-10 — an aggregate is never a zero and never a blank (AC-SA-01-03, FB-SA-01)', () => {
  it('STATE-03 renders each measure with its as-of time and its comparison window', () => {
    render(<TenantMetricsScreen screenState="STATE-03" />)
    const region = screen.getByRole('region', { name: /Per-tenant measures/i })
    expect(within(region).getAllByText(/As of /).length).toBeGreaterThan(0)
    expect(within(region).getAllByText(/Comparison window/i).length).toBeGreaterThan(0)
    expect(within(region).getAllByText(/Completeness/i).length).toBeGreaterThan(0)
  })

  it('STATE-08 degrades to stale WITH its age, never to zero', () => {
    render(<TenantMetricsScreen screenState="STATE-08" />)
    const region = screen.getByRole('region', { name: /Per-tenant measures/i })
    expect(within(region).getAllByText(/stale/i).length).toBeGreaterThan(0)
    expect(within(region).getByText(/older than/i)).toBeDefined()
    expect(region.textContent ?? '').not.toMatch(/(^|\D)0($|\D)/)
  })

  it('STATE-12 degrades to unavailable, never to zero or blank', () => {
    render(<TenantMetricsScreen screenState="STATE-12" />)
    const region = screen.getByRole('region', { name: /Per-tenant measures/i })
    expect(within(region).getAllByText(/unavailable/i).length).toBeGreaterThan(0)
    expect((region.textContent ?? '').trim().length).toBeGreaterThan(0)
    expect(region.querySelectorAll('[data-measure-value]')).toHaveLength(0)
  })

  it('STATE-12: the comparative renders unavailable rather than degrading to named tenant data (FB-SA-01)', () => {
    render(<TenantMetricsScreen screenState="STATE-12" />)
    showComparative()
    const region = screen.getByRole('region', { name: /Anonymised comparative/i })
    expect(within(region).getByText(/anonymisation cannot be guaranteed/i)).toBeDefined()
    expect(region.querySelectorAll('[data-distribution-band]')).toHaveLength(0)
  })

  it('STATE-02 renders a placeholder, never the number nought', () => {
    render(<TenantMetricsScreen screenState="STATE-02" />)
    const region = screen.getByRole('region', { name: /Per-tenant measures/i })
    expect(within(region).getByRole('status')).toBeDefined()
    expect(region.querySelectorAll('[data-measure-value]')).toHaveLength(0)
  })

  it('STATE-13 shows the gap window being re-aggregated, never a recovered system', () => {
    render(<TenantMetricsScreen screenState="STATE-13" />)
    const region = screen.getByRole('region', { name: /Per-tenant measures/i })
    expect(within(region).getAllByText(/reconciled/i).length).toBeGreaterThan(0)
  })

  it('names no tenant inside the comparative distribution', () => {
    render(<TenantMetricsScreen screenState="STATE-03" />)
    showComparative()
    const region = screen.getByRole('region', { name: /Anonymised comparative/i })
    const bands = Array.from(region.querySelectorAll('[data-distribution-band]'))
    expect(bands.length).toBeGreaterThan(0)
    for (const band of bands) {
      expect(band.textContent ?? '').not.toMatch(/Bright Bikes|Northwind|Tenant [A-Z]\b/)
    }
  })
})

describe('MOD-SA-10 — what the source does not define', () => {
  it('names the fifteen-measure count as a stated fact without inventing fourteen names', () => {
    render(<TenantMetricsScreen />)
    expect(SA10_MEASURE_COUNT).toBe(15)
    expect(screen.getByText(/fifteen named per-tenant measures/i)).toBeDefined()
  })

  it('names every missing affordance instead of inventing a control', () => {
    render(<TenantMetricsScreen />)
    const region = screen.getByRole('region', { name: /Unspecified in source/i })
    expect(SA10_UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const u of SA10_UNSPECIFIED_IN_SOURCE) {
      expect(within(region).getByText(u.affordance)).toBeDefined()
    }
    expect(region.querySelectorAll('button, input, select')).toHaveLength(0)
  })

  it('states the role conflict the source leaves open rather than resolving it silently', () => {
    render(<TenantMetricsScreen />)
    const region = screen.getByRole('region', { name: /Conflicts in the source/i })
    expect(within(region).getAllByText(/L107350/).length).toBeGreaterThan(0)
    expect(within(region).getAllByText(/D17/).length).toBeGreaterThan(0)
  })

  it('states that no critical-class action originates on this module', () => {
    render(<TenantMetricsScreen />)
    expect(screen.getByText(/No critical-class action originates on this module/i)).toBeDefined()
  })
})

/**
 * D16: a module-level `roles_allowed` entry is authoritative NOWHERE. The
 * STATE-05 banner once cited L42742 for this module's four-role read; L42742
 * is MOD-SA-08's Part VIII navigation entry, and MOD-SA-10's own is L42744 —
 * but neither belongs in the banner, because both are the module-level entry
 * D16 rules out, and printing one beside D16 contradicts D16.
 *
 * These tests pin the fix structurally rather than by string: the banner must
 * print exactly the refs the read decision carries, and no Part VIII
 * navigation line may appear anywhere on the screen in any state.
 */
describe('MOD-SA-10 — the four-role read cites its per-control source, never roles_allowed (D16)', () => {
  function state05BannerText(): string {
    const { container } = render(<TenantMetricsScreen screenState="STATE-05" />)
    const banner = Array.from(container.querySelectorAll('[role=status]')).find((el) =>
      (el.textContent ?? '').includes('This role does not carry the action'),
    )
    expect(banner, 'the STATE-05 refusal banner did not render').toBeDefined()
    return banner?.textContent ?? ''
  }

  it('prints every source ref the read decision carries', () => {
    const text = state05BannerText()
    expect(SA10_READ_MEASURES_SOURCE_REFS.length).toBeGreaterThan(0)
    for (const ref of SA10_READ_MEASURES_SOURCE_REFS) {
      expect(text, `${ref} missing from the STATE-05 banner`).toContain(ref)
    }
  })

  it('states that the module-level entry is authoritative nowhere, naming D16 as the rule', () => {
    const text = state05BannerText()
    expect(text).toMatch(/D16/)
    expect(text).toMatch(/roles_allowed entry authoritative nowhere/i)
  })

  it('cites no Part VIII module-navigation line anywhere on the screen, in any state, for any role', () => {
    // L42730-L42759 is the Part VIII navigation block: one module-level
    // `roles_allowed` entry per SURF-SA module (MOD-SA-08 at L42742,
    // MOD-SA-10 at L42744). D16 forbids reading a control's allowed roles off
    // any of them, so none may be cited on this screen - not the wrong one,
    // and not this module's own either.
    const navLine = /L427[3-5][0-9]/
    for (const state of SA_APPLICABLE_STATES) {
      for (const role of SA10_PLATFORM_ROLES) {
        const { container, unmount } = render(
          <TenantMetricsScreen role={role.id} screenState={state.id} />,
        )
        const hit = navLine.exec(container.textContent ?? '')
        unmount()
        expect(hit?.[0], `${state.id}/${role.id} cites a module-level roles_allowed line`).toBe(
          undefined,
        )
      }
    }
  }, 30_000)
})
