import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { dohModuleById } from '@/surfaces/doh/modules'
import { ACCESS_CONDITIONS } from '@/surfaces/doh/access-conditions'
import { DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import { TENANT_STATES } from '@/surfaces/doh/tenant-state'
import { SEEDED_SSO_CONNECTION } from '@/surfaces/doh/sso-connection'
import { PermissionsScreen } from '../../app/hub/permissions-roles-and-access/PermissionsScreen'
import {
  MANDATORY_ROLE_STATEMENTS,
  PERMISSION_MATRIX,
  ROLE_CARD_BLOCK_NAMES,
  TENANT_ROLE_ORDER,
} from '../../app/hub/permissions-roles-and-access/fixtures'

const MODULE = dohModuleById('MOD-DOH-09')

function region(name: RegExp | string): HTMLElement {
  return screen.getByRole('region', { name })
}

/** Every control that can carry a disabled reason, with the reason text it shows. */
function buttonNamed(scope: HTMLElement, name: RegExp): HTMLElement {
  return within(scope).getByRole('button', { name })
}

function describedText(el: HTMLElement): string {
  const id = el.getAttribute('aria-describedby')
  if (id === null) return ''
  return document.getElementById(id)?.textContent ?? ''
}

describe('MOD-DOH-09 — the shell contract', () => {
  it('renders under the Hub shell with exactly one h1 and the module id as an annotation', () => {
    render(<PermissionsScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-DOH-09 · SCR-DOH-01 · SCR-DOH-18/)).toBeDefined()
  })

  it('carries the prototype disclosure the shell renders for every module', () => {
    render(<PermissionsScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates screen numbers and keys no route on one', () => {
    const { container } = render(<PermissionsScreen />)
    expect(screen.getAllByText(/SCR-DOH-ROLE-04/).length).toBeGreaterThan(0)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-DOH/i)
    }
  })

  it('renders no three-digit screen literal for any role or tenant state (D1)', () => {
    for (const role of TENANT_ROLE_ORDER) {
      for (const tenantState of TENANT_STATES) {
        const { container, unmount } = render(
          <PermissionsScreen role={role} tenantState={tenantState} />,
        )
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
        expect(container.textContent ?? '').not.toMatch(/SCR-DOH-\d{3}/)
        unmount()
      }
    }
  })

  // AC-16-12 is categorical and this is the module whose own matrix makes it
  // Explicitly prohibited for all five roles. The gate greps the DOM.
  it('renders no session-role-context language, in any role or screen state', () => {
    for (const role of TENANT_ROLE_ORDER) {
      for (const screenState of ['STATE-03', 'STATE-05', 'STATE-06', 'STATE-12'] as const) {
        const { container, unmount } = render(
          <PermissionsScreen role={role} screenState={screenState} />,
        )
        const text = container.textContent ?? ''
        expect(text.length).toBeGreaterThan(200)
        expect(text).not.toMatch(/act(ing)? as/i)
        expect(text).not.toMatch(/impersonat/i)
        expect(text).not.toMatch(/switch role|role selector/i)
        unmount()
      }
    }
  })
})

describe('MOD-DOH-09 — SCR-DOH-01, the two-track sign-in', () => {
  it('renders the boot order as a visible resolution sequence, not an invisible branch', () => {
    render(<PermissionsScreen />)
    const signIn = region(/two-track sign-in/i)
    for (const stage of ['Unauthenticated', 'Scope resolved', 'Tenant state applied', 'Hub rendered']) {
      expect(within(signIn).getByText(new RegExp(stage, 'i'))).toBeDefined()
    }
  })

  it('resolves a seeded domain onto the single sign-on track', () => {
    render(<PermissionsScreen />)
    const signIn = region(/two-track sign-in/i)
    const domain = SEEDED_SSO_CONNECTION.emailDomains[0]
    if (domain === undefined) throw new Error('the seeded connection carries no domain')
    const field = within(signIn).getByLabelText(/work email address/i)
    fireEvent.change(field, { target: { value: `priya@${domain}` } })
    fireEvent.click(buttonNamed(signIn, /^Continue$/))
    expect(within(signIn).getByText(/single sign-on track/i)).toBeDefined()
    expect(within(signIn).getByText(/no identity provider was contacted/i)).toBeDefined()
  })

  it('routes an unknown domain onto the platform-managed credential track', () => {
    render(<PermissionsScreen />)
    const signIn = region(/two-track sign-in/i)
    const field = within(signIn).getByLabelText(/work email address/i)
    fireEvent.change(field, { target: { value: 'someone@elsewhere.example' } })
    fireEvent.click(buttonNamed(signIn, /^Continue$/))
    expect(within(signIn).getByText(/platform-managed credential track/i)).toBeDefined()
  })

  it('states the rule and the accepted form when the address cannot be resolved (STATE-04)', () => {
    render(<PermissionsScreen />)
    const signIn = region(/two-track sign-in/i)
    const field = within(signIn).getByLabelText(/work email address/i)
    fireEvent.change(field, { target: { value: 'not-an-address' } })
    fireEvent.click(buttonNamed(signIn, /^Continue$/))
    expect(within(signIn).getByText(/name@domain/i)).toBeDefined()
  })

  it('says plainly that a role claim in an assertion grants nothing', () => {
    render(<PermissionsScreen />)
    const signIn = region(/two-track sign-in/i)
    expect(within(signIn).getByText(/untrusted input/i)).toBeDefined()
    expect(within(signIn).getByText(/no just-in-time provisioning/i)).toBeDefined()
    expect(within(signIn).getByText(/DEC-SSO-001/)).toBeDefined()
  })
})

describe('MOD-DOH-09 — SCR-DOH-18, users, roles and scopes', () => {
  it('renders the user and role register for the Tenant Admin', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    expect(within(users).getByRole('table')).toBeDefined()
    expect(within(users).getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('gives the Tenant Admin a live create-user control that changes what renders', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    const create = buttonNamed(users, /create a user account/i)
    expect(create.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(create)
    expect(within(users).getByRole('status').textContent ?? '').toMatch(/no account was created/i)
  })

  it('disables the same control with a named reason for a role the source refuses', () => {
    render(<PermissionsScreen role="SUPERVISOR" />)
    const users = region(/users, roles and scopes/i)
    const create = buttonNamed(users, /create a user account/i)
    expect(create.getAttribute('aria-disabled')).toBe('true')
    expect(describedText(create)).toMatch(/Tenant Admin/)
  })

  it('gives the Supervisor the one write row a non-admin holds', () => {
    render(<PermissionsScreen role="SUPERVISOR" />)
    const users = region(/users, roles and scopes/i)
    const pin = buttonNamed(users, /issue or reset a managed personal identification number/i)
    expect(pin.getAttribute('aria-disabled')).toBeNull()
  })

  it('applies the tenant state gate before any write control renders', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" tenantState="soft-suspended" />)
    const users = region(/users, roles and scopes/i)
    const create = buttonNamed(users, /create a user account/i)
    expect(create.getAttribute('aria-disabled')).toBe('true')
    expect(describedText(create)).toMatch(/configuration edit/i)
  })

  it('offers exactly the five fixed role types and no creation affordance', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    const picker = within(users).getByLabelText(/role to assign/i) as HTMLSelectElement
    expect(picker.querySelectorAll('option')).toHaveLength(TENANT_ROLE_ORDER.length)
    expect(within(users).queryByRole('button', { name: /create a custom role/i })).toBeNull()
    expect(within(users).getByText(/deferred beyond/i)).toBeDefined()
  })

  it('offers the tenant scope only in this pass, with no dead Site or Area option', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    const scope = within(users).getByLabelText(/scope to assign/i) as HTMLSelectElement
    const values = Array.from(scope.querySelectorAll('option')).map((o) => o.getAttribute('value'))
    expect(values).toEqual(['tenant'])
  })
})

describe('MOD-DOH-09 — the standing mandatory-role panel', () => {
  it('renders both counters with their values on the seeded roster', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const panel = region(/mandatory-role guard/i)
    expect(within(panel).getByText(/Tenant Admins: \d+/)).toBeDefined()
    expect(within(panel).getByText(/Approver-capable holders: \d+/)).toBeDefined()
  })

  it('never renders a zero without the warning sentence', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" roster="no-approver-holder" />)
    const panel = region(/mandatory-role guard/i)
    expect(within(panel).getByText(/Approver-capable holders: 0/)).toBeDefined()
    expect(within(panel).getByText(MANDATORY_ROLE_STATEMENTS.approver)).toBeDefined()
    expect(within(panel).getByRole('alert')).toBeDefined()
  })

  it('draws no removal control for the last Tenant Admin, and states the rule in its place', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" roster="last-tenant-admin" />)
    const panel = region(/mandatory-role guard/i)
    expect(within(panel).queryByRole('button', { name: /remove the last tenant admin/i })).toBeNull()
    expect(within(panel).getByText(/no override exists on any surface/i)).toBeDefined()
    expect(within(panel).getByText(/including within support sessions/i)).toBeDefined()
  })
})

describe('MOD-DOH-09 — SCR-DOH-ROLE-04, why was I refused', () => {
  it('renders all nine conditions in the source order, role permission first and safety ninth', () => {
    render(<PermissionsScreen role="SUPERVISOR" />)
    const refused = region(/why was i refused/i)
    const rows = within(refused).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(ACCESS_CONDITIONS.length)
    expect(rows[0]?.textContent ?? '').toMatch(/role permission/i)
    expect(rows[8]?.textContent ?? '').toMatch(/safety controls/i)
  })

  it('renders the two precedence rules above the intersection, not a reordered list', () => {
    render(<PermissionsScreen />)
    const refused = region(/why was i refused/i)
    expect(within(refused).getByText(/explicit deny wins/i)).toBeDefined()
    expect(within(refused).getByText(/safety controls win/i)).toBeDefined()
    expect(within(refused).getByText(/by precedence, not by position/i)).toBeDefined()
  })

  it('marks which condition refused, and names who can change it', () => {
    render(<PermissionsScreen role="SUPERVISOR" refusalScenarioId="role-permission" />)
    const refused = region(/why was i refused/i)
    expect(within(refused).getByText(/refused at/i)).toBeDefined()
    expect(within(refused).getByText(/who can change/i)).toBeDefined()
  })

  it('shows every condition passing when the role in view holds the action', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" refusalScenarioId="role-permission" />)
    const refused = region(/why was i refused/i)
    expect(within(refused).getByText(/no condition refused/i)).toBeDefined()
  })

  it('never reveals whether an out-of-scope record exists', () => {
    render(<PermissionsScreen role="SUPERVISOR" refusalScenarioId="assigned-scope" />)
    const refused = region(/why was i refused/i)
    const text = refused.textContent ?? ''
    expect(text).toMatch(/outside/i)
    expect(text).not.toMatch(/the record exists|this record exists/i)
  })

  it('treats a rule it cannot evaluate as a refusal, with that as the reason', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" refusalScenarioId="unevaluable-rule" />)
    const refused = region(/why was i refused/i)
    expect(within(refused).getByText(/treated as violated/i)).toBeDefined()
  })
})

describe('MOD-DOH-09 — SCR-DOH-ROLE-05, the role definition card', () => {
  it('renders the seven fixed blocks for the role in view', () => {
    render(<PermissionsScreen role="QUALITY_MANAGER" />)
    const card = region(/role definition card/i)
    for (const block of ROLE_CARD_BLOCK_NAMES) {
      expect(within(card).getByText(new RegExp(`^${block}$`))).toBeDefined()
    }
  })

  it('refuses the auditor export by naming the open decision that governs it', () => {
    render(<PermissionsScreen role="READONLY_AUDITOR" />)
    const card = region(/role definition card/i)
    const save = buttonNamed(card, /save as document/i)
    expect(save.getAttribute('aria-disabled')).toBe('true')
    expect(describedText(save)).toMatch(/DEC-AUDEXPORT-001/)
  })
})

describe('MOD-DOH-09 — prohibitions rendered by rule', () => {
  it('draws every all-role prohibition as an absent note and never as a disabled control', () => {
    const { container } = render(<PermissionsScreen role="TENANT_ADMIN" />)
    const absent = region(/controls that do not exist here/i)
    const allProhibited = PERMISSION_MATRIX.filter((row) =>
      TENANT_ROLE_ORDER.every((r) => row.cells[r].outcome === 'explicitlyProhibited'),
    )
    expect(allProhibited.length).toBe(6)
    for (const row of allProhibited) {
      expect(within(absent).getByText(row.label)).toBeDefined()
    }
    const buttonText = Array.from(container.querySelectorAll('button')).map((b) => b.textContent ?? '')
    for (const row of allProhibited) {
      expect(buttonText).not.toContain(row.label)
    }
  })

  it('renders Cell, Job and worker scoping absent, never disabled', () => {
    const { container } = render(<PermissionsScreen role="TENANT_ADMIN" />)
    const scope = region(/scope in this pass/i)
    for (const deferred of DEFERRED_DOH_SCOPES) {
      expect(within(scope).getAllByText(new RegExp(deferred, 'i')).length).toBeGreaterThan(0)
    }
    const optionValues = Array.from(container.querySelectorAll('option')).map((o) =>
      o.getAttribute('value'),
    )
    for (const deferred of DEFERRED_DOH_SCOPES) {
      expect(optionValues).not.toContain(deferred)
    }
  })

  it('keeps Unavailable and Explicitly prohibited apart rather than merging them', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const matrix = region(/by capability/i)
    expect(within(matrix).getAllByText(/Unavailable/).length).toBeGreaterThan(0)
    expect(within(matrix).getAllByText(/Explicitly prohibited/).length).toBeGreaterThan(0)
  })
})

describe('MOD-DOH-09 — connection loss, failure and recovery (D7)', () => {
  it('degrades loaded content to STATE-08 with a freshness marker and an as-of time', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" screenState="STATE-08" />)
    const users = region(/users, roles and scopes/i)
    expect(within(users).getByText(/as of day/i)).toBeDefined()
    const create = buttonNamed(users, /create a user account/i)
    expect(create.getAttribute('aria-disabled')).toBe('true')
    expect(describedText(create)).toMatch(/never queued/i)
  })

  it('names what failed and whether anything was written under STATE-12', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" screenState="STATE-12" />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/nothing was written/i)
    expect(text).toMatch(/user and role register/i)
  })

  it('refetches tenant state before re-enabling any write under STATE-13', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" screenState="STATE-13" />)
    expect(screen.getByText(/tenant state is being re-read before any write control is re-enabled/i)).toBeDefined()
    const users = region(/users, roles and scopes/i)
    expect(buttonNamed(users, /create a user account/i).getAttribute('aria-disabled')).toBe('true')
  })

  it('queues nothing, in any of the three connection-loss states', () => {
    for (const screenState of ['STATE-08', 'STATE-12', 'STATE-13'] as const) {
      const { container, unmount } = render(
        <PermissionsScreen role="TENANT_ADMIN" screenState={screenState} />,
      )
      expect(container.textContent ?? '').toMatch(/never queued/i)
      for (const button of Array.from(container.querySelectorAll('button'))) {
        if ((button.textContent ?? '').match(/create a user account/i)) {
          expect(button.getAttribute('aria-disabled')).toBe('true')
        }
      }
      unmount()
    }
  })
})

describe('MOD-DOH-09 — audit in the same transaction', () => {
  it('states that the audit event commits in the same transaction as the action', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const audit = region(/audit/i)
    expect(within(audit).getByText(/same transaction/i)).toBeDefined()
  })

  it('says the action did not happen when the audit write fails', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" auditPath="write-fails" />)
    const users = region(/users, roles and scopes/i)
    fireEvent.click(buttonNamed(users, /create a user account/i))
    expect(within(users).getByRole('status').textContent ?? '').toMatch(/the action did not happen/i)
  })
})

describe('MOD-DOH-09 — the standing panels the contract requires', () => {
  it('names its cross-slice position against the seam registry rather than stubbing one inline', () => {
    render(<PermissionsScreen />)
    const seams = region(/cross-slice/i)
    expect(within(seams).getByText(/registers no cross-slice seam/i)).toBeDefined()
  })

  it('names each undefined affordance instead of inventing a control for it', () => {
    render(<PermissionsScreen />)
    const unspecified = region(/unspecified in source/i)
    expect(within(unspecified).getAllByRole('listitem').length).toBeGreaterThan(2)
  })

  it('records the corrected condition ordering where a reviewer can read it', () => {
    render(<PermissionsScreen />)
    const conflicts = region(/conflicts in the source/i)
    expect(within(conflicts).getByText(/L14512/)).toBeDefined()
  })

  it('states the cost of the Worker holding no Hub screen', () => {
    render(<PermissionsScreen role="WORKER" />)
    expect(screen.getByText(/cannot check their own certification expiry/i)).toBeDefined()
    expect(screen.queryByRole('region', { name: /users, roles and scopes/i })).toBeNull()
  })
})
