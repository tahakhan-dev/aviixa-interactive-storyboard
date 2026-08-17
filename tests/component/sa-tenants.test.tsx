import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { TenantsScreen } from '../../app/super-admin/tenants-lifecycle-and-pilots/TenantsScreen'
import {
  DETAIL_TABS,
  LIFECYCLE_TRANSITIONS,
  TENANTS,
  TENANT_LIFECYCLE_STATES,
  TENANT_PLATFORM_ROLES,
  UNSPECIFIED_IN_SOURCE,
} from '../../app/super-admin/tenants-lifecycle-and-pilots/fixtures'
import { SCREEN_STATES } from '@/ui/screen-state'

/**
 * D10's four forbidden words. The `signed` arm carries a word boundary AND a
 * "signed in"/"signed-in" exclusion, for the reason already recorded against
 * MOD-SA-03: the SHARED spine copy in `@/policy/decision.ts` REASON_CODES
 * says "The signed-in role does not carry a grant for this action." Every
 * module that renders a real `evaluateAccess` denial — which the per-module
 * contract requires — puts that string on screen, and it makes no claim about
 * an audit log. The exclusion is exactly one word sense wide: "the log is
 * signed" still fails this gate, which was proven by planting it.
 */
const FORBIDDEN_WORDS = /tamper-evident|\bchained\b|\bsigned\b(?![- ]in)|\bverified\b/i

function selectRole(sourceRoleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as platform role/i), {
    target: { value: sourceRoleId },
  })
}

function selectState(stateId: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Screen state' }), {
    target: { value: stateId },
  })
}

function region(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

function openDetail(tenantId: string): void {
  fireEvent.change(screen.getByLabelText(/open a tenant detail page/i), {
    target: { value: tenantId },
  })
}

describe('MOD-SA-09 — the console shell contract', () => {
  it('renders under the shell with one h1 and the module id and band as annotations', () => {
    render(<TenantsScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Tenants, Lifecycle and Pilots',
    )
    expect(screen.getByText(/MOD-SA-09 · Operations layer/)).toBeDefined()
  })

  it('carries the prototype disclosure and shows SCR-SA numbers only as annotations', () => {
    const { container } = render(<TenantsScreen />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
    expect(screen.getAllByText(/SCR-SA-14/).length).toBeGreaterThan(0)
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })
})

describe('MOD-SA-09 — the tenant list and its aggregates', () => {
  it('renders one row per seeded tenant, covering all eight lifecycle states', () => {
    render(<TenantsScreen />)
    const rows = within(region('Tenant list')).getAllByRole('row')
    // One header row plus one row per tenant.
    expect(rows).toHaveLength(TENANTS.length + 1)
    expect(TENANT_LIFECYCLE_STATES).toHaveLength(8)
    for (const state of TENANT_LIFECYCLE_STATES) {
      expect(region('Tenant list').textContent, state).toContain(state)
    }
  })

  it('AC-SA-01-03: every usage aggregate carries an as-of stamp and degrades, never a zero or a blank', () => {
    render(<TenantsScreen />)
    const text = region('Tenant list').textContent ?? ''
    expect(text).toMatch(/as of /i)
    expect(text).toMatch(/measure unavailable/i)
    expect(text).toMatch(/stale/i)
    expect(text).toMatch(/\d+ minutes old|\d+ hours old/i)
    for (const cell of within(region('Tenant list')).getAllByRole('cell')) {
      expect((cell.textContent ?? '').trim().length).toBeGreaterThan(0)
    }
    expect(text).not.toMatch(/\b0\b/)
  })

  it('holds the line at the tenant: no rate, no per-worker series, no comparison of people', () => {
    const { container } = render(<TenantsScreen />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\brates?\b/i)
    expect(text).not.toMatch(/per[- ](worker|person|operator|shift|hour|minute|run)\b/i)
    expect(text).toMatch(/tenant-month/i)
  })

  it('filters the list by status, tier and pilot for every console role', () => {
    render(<TenantsScreen />)
    for (const role of TENANT_PLATFORM_ROLES) {
      selectRole(role.sourceId)
      expect(
        within(region('Tenant list')).getAllByRole('row').length,
        role.sourceId,
      ).toBe(TENANTS.length + 1)
    }
    fireEvent.change(screen.getByLabelText(/status filter/i), { target: { value: 'archived' } })
    expect(within(region('Tenant list')).getAllByRole('row')).toHaveLength(2)
    fireEvent.change(screen.getByLabelText(/status filter/i), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText(/pilot filter/i), { target: { value: 'pilot-only' } })
    expect(within(region('Tenant list')).getAllByRole('row')).toHaveLength(2)
  })
})

describe('MOD-SA-09 — the lifecycle, its causers and what is irreversible', () => {
  it('names every legal transition with who may cause it and whether it can be undone', () => {
    render(<TenantsScreen />)
    const rows = within(region('Lifecycle transitions')).getAllByRole('row')
    expect(rows).toHaveLength(LIFECYCLE_TRANSITIONS.length + 1)
    const text = region('Lifecycle transitions').textContent ?? ''
    expect(text).toMatch(/irreversible/i)
    expect(text).toMatch(/beyond twelve months/i)
    expect(text).toMatch(/preserves the tenant identifier/i)
  })
})

describe('MOD-SA-09 — per-control allowed-roles through the policy evaluator', () => {
  it('offers tenant creation to the root and the Admin, and refuses it by name to the other two', () => {
    render(<TenantsScreen />)
    for (const sourceId of ['ROLE-PLAT-ROOT', 'ROLE-PLAT-ADMIN']) {
      selectRole(sourceId)
      expect(
        screen.getByRole('button', { name: /new tenant/i }).getAttribute('aria-disabled'),
        sourceId,
      ).toBeNull()
    }
    for (const sourceId of ['ROLE-PLAT-ENG', 'ROLE-PLAT-SUP']) {
      selectRole(sourceId)
      expect(
        screen.getByRole('button', { name: /new tenant/i }).getAttribute('aria-disabled'),
        sourceId,
      ).toBe('true')
    }
    expect(region('Lifecycle actions').textContent).toMatch(/may not create a tenant/i)
  })

  it('disables Activate tenant with the outstanding step named', () => {
    render(<TenantsScreen />)
    selectRole('ROLE-PLAT-ADMIN')
    const button = screen.getByRole('button', { name: /activate tenant/i })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(region('Lifecycle actions').textContent).toMatch(
      /first Tenant Admin has not accepted the invitation/i,
    )
  })

  it('holds the invitation controls to the Admin the source names, and says so to the root', () => {
    render(<TenantsScreen />)
    selectRole('ROLE-PLAT-ADMIN')
    for (const name of [/resend/i, /reissue/i, /revoke/i]) {
      expect(screen.getByRole('button', { name }).getAttribute('aria-disabled')).toBeNull()
    }
    selectRole('ROLE-PLAT-ROOT')
    expect(screen.getByRole('button', { name: /resend/i }).getAttribute('aria-disabled')).toBe(
      'true',
    )
  })

  it('takes a typed confirmation and a reason class before a hard suspension acts', () => {
    render(<TenantsScreen />)
    selectRole('ROLE-PLAT-ADMIN')
    const apply = () => screen.getByRole('button', { name: /apply hard suspension/i })
    expect(apply().getAttribute('aria-disabled')).toBe('true')
    fireEvent.change(screen.getByLabelText(/type the tenant identifier/i), {
      target: { value: 'WRONG-ID' },
    })
    expect(region('Lifecycle actions').textContent).toMatch(/does not match/i)
    fireEvent.change(screen.getByLabelText(/type the tenant identifier/i), {
      target: { value: 'TEN-CLEARWATER' },
    })
    fireEvent.change(screen.getByLabelText(/reason class/i), {
      target: { value: 'commercial-action' },
    })
    expect(apply().getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(apply())
    expect(region('Tenant list').textContent).toMatch(/hard/)
  })

  it('refuses the soft-suspension release as an open client decision rather than guessing', () => {
    render(<TenantsScreen />)
    selectRole('ROLE-PLAT-ROOT')
    const button = screen.getByRole('button', { name: /release soft suspension/i })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(region('Lifecycle actions').textContent).toMatch(/DEC-SUSP-001/)
  })
})

describe('MOD-SA-09 — the three prohibition renderings, by rule', () => {
  it('replaces the compliance-suspension action bar with the class badge for every non-root role', () => {
    render(<TenantsScreen />)
    for (const sourceId of ['ROLE-PLAT-ADMIN', 'ROLE-PLAT-ENG', 'ROLE-PLAT-SUP']) {
      selectRole(sourceId)
      const bar = region('Compliance suspension')
      expect(bar.textContent, sourceId).toMatch(/Critical class — root approval required/)
      expect(within(bar).queryByRole('button'), sourceId).toBeNull()
    }
    selectRole('ROLE-PLAT-ROOT')
    const button = within(region('Compliance suspension')).getByRole('button', {
      name: /critical-class request/i,
    })
    fireEvent.click(button)
    expect(region('Compliance suspension').textContent).toMatch(/does not approve/i)
  })

  it('renders self-signup, a blocked flag, delete and de-anonymisation ABSENT for every role including the root', () => {
    render(<TenantsScreen />)
    for (const role of TENANT_PLATFORM_ROLES) {
      selectRole(role.sourceId)
      const notes = region('Absent by rule')
      expect(notes.querySelector('button'), role.sourceId).toBeNull()
      expect(notes.textContent, role.sourceId).toMatch(/no public self-signup path/i)
      expect(notes.textContent, role.sourceId).toMatch(/no Boolean blocked field/i)
      expect(notes.textContent, role.sourceId).toMatch(/nothing is purged/i)
      expect(notes.textContent, role.sourceId).toMatch(/cannot be reversed by any account/i)
    }
  })
})

describe('MOD-SA-09 — the tenant detail page (R3, AC-SA-09-14)', () => {
  it('renders the seven named tabs and flags the eighth as unresolved without guessing it', () => {
    render(<TenantsScreen />)
    const tabs = within(region('Tenant detail')).getAllByRole('tab')
    expect(tabs).toHaveLength(7)
    expect(DETAIL_TABS).toHaveLength(7)
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Overview',
      'Operations (read-only)',
      'Agents',
      'Memory',
      'Devices',
      'Metrics',
      'Logs and Audit',
    ])
    expect(region('Tenant detail').textContent).toMatch(/eighth tab is unresolved/i)
  })

  it('takes no operational action on any tab, for any console role including the root', () => {
    render(<TenantsScreen />)
    for (const role of TENANT_PLATFORM_ROLES) {
      selectRole(role.sourceId)
      for (const tab of DETAIL_TABS) {
        fireEvent.click(within(region('Tenant detail')).getByRole('tab', { name: tab.label }))
        const detail = region('Tenant detail')
        const actionable = [...detail.querySelectorAll('button')].filter(
          (b) => b.getAttribute('role') !== 'tab',
        )
        expect(actionable.map((b) => b.textContent), `${role.sourceId} ${tab.id}`).toEqual([])
        expect(detail.textContent, `${role.sourceId} ${tab.id}`).toMatch(
          /visibility, not intervention/i,
        )
      }
    }
  })

  it('reads tenant memory as counts and volume only, for every role including the root', () => {
    render(<TenantsScreen />)
    selectRole('ROLE-PLAT-ROOT')
    fireEvent.click(within(region('Tenant detail')).getByRole('tab', { name: 'Memory' }))
    expect(region('Tenant detail').textContent).toMatch(/Unavailable — counts and volume only/i)
  })

  it('switches every tab to the tenant the reader opened', () => {
    render(<TenantsScreen />)
    openDetail('TEN-MERIDIAN')
    expect(region('Tenant detail').textContent).toMatch(/TEN-MERIDIAN/)
    expect(region('Tenant detail').textContent).toMatch(/compliance/)
  })
})

describe('MOD-SA-09 — the no-link rule and the command channel', () => {
  it('resolves every link to a console route, and tenant content to a session-request form', () => {
    const { container } = render(<TenantsScreen />)
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '')
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      // A console route, and only a console route: the shell's own breadcrumb
      // back to the module index is the one bare `/super-admin/` link.
      expect(href).toMatch(/^\/super-admin\/([a-z0-9-]+\/?)?$/)
      expect(href).not.toMatch(/TEN-/)
    }
    expect(container.textContent).toMatch(/session-request form/i)
  })

  it('AC-SA-09-10: a device lock is never rendered as applied before the device acknowledges it', () => {
    render(<TenantsScreen />)
    const channel = () => region('Suspension command channel')
    expect(channel().textContent).toMatch(/created/)
    expect(channel().textContent).not.toMatch(/applied/)
    const step = () => within(channel()).getByRole('button', { name: /advance the fixture/i })
    for (let i = 0; i < 7; i += 1) fireEvent.click(step())
    expect(channel().textContent).toMatch(/applied/)
    expect(channel().textContent).toMatch(/unreached/i)
  })

  it('never uses the four forbidden words', () => {
    const { container } = render(<TenantsScreen />)
    expect(container.textContent ?? '').not.toMatch(FORBIDDEN_WORDS)
    // The gate is proven able to fail on the axis it is for: the same copy
    // with a genuine audit claim planted in it is caught.
    expect(`${container.textContent ?? ''} the audit log is signed`).toMatch(FORBIDDEN_WORDS)
  })
})

describe('MOD-SA-09 — the twelve applicable screen states', () => {
  it('offers every state but the frontline-only STATE-07, each with a named treatment', () => {
    render(<TenantsScreen />)
    const options = within(screen.getByRole('combobox', { name: 'Screen state' })).getAllByRole(
      'option',
    )
    expect(options).toHaveLength(SCREEN_STATES.length - 1)
    expect(options.map((o) => o.getAttribute('value'))).not.toContain('STATE-07')
    for (const state of SCREEN_STATES.filter((s) => !s.frontlineOnly)) {
      selectState(state.id)
      const text = region('Screen state').textContent ?? ''
      expect(text, state.id).toContain(state.id)
      expect(text.length, state.id).toBeGreaterThan(state.id.length + 20)
    }
  })

  it('AC-SA-000-09: stays operable with every artificial-intelligence model unavailable', () => {
    render(<TenantsScreen />)
    selectRole('ROLE-PLAT-ADMIN')
    selectState('STATE-11')
    expect(within(region('Tenant list')).getAllByRole('row')).toHaveLength(TENANTS.length + 1)
    fireEvent.change(screen.getByLabelText(/type the tenant identifier/i), {
      target: { value: 'TEN-CLEARWATER' },
    })
    fireEvent.change(screen.getByLabelText(/reason class/i), {
      target: { value: 'commercial-action' },
    })
    const apply = screen.getByRole('button', { name: /apply hard suspension/i })
    expect(apply.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(apply)
    expect(region('Tenant list').textContent).toMatch(/hard/)
    expect(within(region('Tenant detail')).getAllByRole('tab')).toHaveLength(7)
  })
})

describe('MOD-SA-09 — what the source does not define', () => {
  it('names each unspecified affordance instead of inventing one', () => {
    render(<TenantsScreen />)
    const panel = region('Unspecified in source')
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(4)
    for (const item of UNSPECIFIED_IN_SOURCE) {
      expect(panel.textContent).toContain(item)
    }
    const { container } = render(<TenantsScreen />)
    const buttonNames = [...container.querySelectorAll('button')].map((b) => b.textContent ?? '')
    for (const invented of [/archive tenant/i, /delete/i, /message this tenant/i, /open a session/i]) {
      expect(buttonNames.join(' '), String(invented)).not.toMatch(invented)
    }
  })

  it('carries the unresolved source questions rather than resolving them silently', () => {
    render(<TenantsScreen />)
    const panel = region('Unresolved in source')
    for (const ref of [/eighth tab/i, /DEC-SUSP-001/, /DEC-MSG-001/, /AC-SA-09-07/]) {
      expect(panel.textContent, String(ref)).toMatch(ref)
    }
  })
})
