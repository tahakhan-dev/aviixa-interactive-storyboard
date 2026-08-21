import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { dohModuleById } from '@/surfaces/doh/modules'
import { ACCESS_CONDITIONS } from '@/surfaces/doh/access-conditions'
import { DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import { TENANT_STATES } from '@/surfaces/doh/tenant-state'
import { SEEDED_SSO_CONNECTION } from '@/surfaces/doh/sso-connection'
import { PermissionsScreen } from '../../app/hub/permissions-roles-and-access/PermissionsScreen'
import {
  ASSIGNABLE_SCOPE_TARGETS,
  MANDATORY_ROLE_STATEMENTS,
  PERMISSION_MATRIX,
  ROLE_CARD_BLOCK_NAMES,
  SCOPE_RULES,
  SIGN_IN_STAGES,
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
    // Read from the fixture rather than typed out, because the typed-out list
    // held four of the five and silently skipped 'Track resolved' — the one
    // stage that was RENAMED, so the rename was asserted nowhere in this suite.
    expect(SIGN_IN_STAGES).toHaveLength(5)
    for (const stage of SIGN_IN_STAGES) {
      expect(within(signIn).getByText(stage.name), stage.id).toBeDefined()
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

  // Finding 1: the by-person list says this row is drawn as a live control
  // for the Tenant Admin and as a disabled control carrying its reason for
  // everyone else. Both halves are now checked against the DOM.
  it('draws the scope row as a live control for the Tenant Admin', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    const assign = buttonNamed(users, /^Assign the scope$/)
    expect(assign.getAttribute('aria-disabled')).toBeNull()
    expect((within(users).getByLabelText(/scope to assign/i) as HTMLSelectElement).disabled).toBe(
      false,
    )
  })

  it.each(['SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'] as const)(
    'draws the scope row disabled, with its named reason, for the %s',
    (role) => {
      render(<PermissionsScreen role={role} />)
      const users = region(/users, roles and scopes/i)
      const assign = buttonNamed(users, /^Assign the scope$/)
      expect(assign.getAttribute('aria-disabled')).toBe('true')
      expect(describedText(assign)).toMatch(/scope assignment belongs to the Tenant Admin alone/i)
      // The picker beside it is gated by the same answer, never left live.
      expect((within(users).getByLabelText(/scope to assign/i) as HTMLSelectElement).disabled).toBe(
        true,
      )
    },
  )

  it('names no person under STATE-12, because that read is the one that failed', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" screenState="STATE-12" />)
    const users = region(/users, roles and scopes/i)
    expect(within(users).queryByLabelText(/user to change/i)).toBeNull()
    expect(within(users).getByText(/no person can be offered to change/i)).toBeDefined()
    expect(users.textContent ?? '').not.toMatch(/Priya Raman/)
  })

})

/**
 * PASS TWO. The test this block replaces asserted the scope picker offered
 * `['tenant']` and nothing else — true of pass one, and the exact thing this
 * task removes. What replaces it is the same question asked of the new
 * dimensions: are they real, do they come from the location records rather
 * than from a second copy typed here, and does assigning one change anything.
 */
describe('MOD-DOH-09 — pass two, Site and Area scope', () => {
  function scopeRow(users: HTMLElement, person: string): string {
    const row = within(users)
      .getAllByRole('row')
      .find((r) => (r.textContent ?? '').includes(person))
    if (row === undefined) throw new Error(`no register row for ${person}`)
    return row.textContent ?? ''
  }

  function assignScope(users: HTMLElement, opts: { user: string; role: string; scope: string }) {
    fireEvent.change(within(users).getByLabelText(/user to change/i), {
      target: { value: opts.user },
    })
    fireEvent.change(within(users).getByLabelText(/role to assign/i), {
      target: { value: opts.role },
    })
    fireEvent.change(within(users).getByLabelText(/scope to assign/i), {
      target: { value: opts.scope },
    })
    fireEvent.click(buttonNamed(users, /^Assign the scope$/))
  }

  // Fails if the option list is hand-typed here instead of walked from the
  // location records: the picker and the fixture would stop matching.
  it('offers every assignable node from the location records and invents none', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    const scope = within(users).getByLabelText(/scope to assign/i) as HTMLSelectElement
    const values = Array.from(scope.querySelectorAll('option')).map((o) => o.getAttribute('value'))
    expect(values).toEqual(ASSIGNABLE_SCOPE_TARGETS.map((t) => t.key))
    expect(values).toContain('tenant')
    expect(values.filter((v) => v?.startsWith('site:')).length).toBeGreaterThan(0)
    expect(values.filter((v) => v?.startsWith('area:')).length).toBeGreaterThan(0)
    // D21 and the archive rule, in the DOM: withheld, and each says why.
    expect(values).not.toContain('site:SITE-ARD-03')
    expect(values).not.toContain('area:AREA-ARD-STORE')
  })

  // THE POINT OF THIS TASK: `assignScope` had no observable effect in pass
  // one. Fails the moment the handler stops writing the narrowed grant.
  it('narrows the grant it names, and the register moves', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    expect(scopeRow(users, 'Marcus Bell')).toMatch(/Supervisor: Tenant/)

    assignScope(users, { user: 'USR-DOH-0003', role: 'SUPERVISOR', scope: 'area:AREA-ARD-PAINT' })

    expect(within(users).getByRole('status').textContent ?? '').toMatch(/Narrowed the Supervisor/i)
    expect(scopeRow(users, 'Marcus Bell')).toMatch(/Supervisor: Area — Paint Line/)
    expect(scopeRow(users, 'Marcus Bell')).not.toMatch(/Supervisor: Tenant/)
  })

  // Fails if scope is ever stored on the ACCOUNT rather than on the grant:
  // the untouched Supervisor grant would move with the Quality Manager one.
  it('moves one grant and leaves the account’s other grant where it was', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    expect(scopeRow(users, 'Rosa Mendez')).toMatch(/Supervisor: Area — Paint Line/)

    assignScope(users, {
      user: 'USR-DOH-0005',
      role: 'QUALITY_MANAGER',
      scope: 'area:AREA-ARD-QC',
    })

    const after = scopeRow(users, 'Rosa Mendez')
    expect(after).toMatch(/Quality Manager: Area — Quality Laboratory/)
    expect(after).toMatch(/Supervisor: Area — Paint Line/)
  })

  // Fails if the narrow-only rule stops being enforced at the write.
  it('refuses a widening by naming the rule, and writes nothing', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    const before = scopeRow(users, 'Rosa Mendez')

    assignScope(users, { user: 'USR-DOH-0005', role: 'SUPERVISOR', scope: 'tenant' })

    const status = within(users).getByRole('status').textContent ?? ''
    expect(status).toMatch(/never widens it/i)
    expect(status).toMatch(/L17470/)
    expect(status).toMatch(/nothing was written/i)
    expect(scopeRow(users, 'Rosa Mendez')).toBe(before)
  })

  // Fails if a scope assignment is allowed to create the grant it scopes,
  // which would be a scope granting a role rather than narrowing one.
  it('refuses to scope a role the account does not hold', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    const before = scopeRow(users, 'Priya Raman')

    assignScope(users, { user: 'USR-DOH-0001', role: 'SUPERVISOR', scope: 'site:SITE-ARD-01' })

    const status = within(users).getByRole('status').textContent ?? ''
    expect(status).toMatch(/holds no Supervisor grant/i)
    expect(status).toMatch(/never grants one/i)
    expect(scopeRow(users, 'Priya Raman')).toBe(before)
  })

  // Fails if the two grants are ever unioned: the probe would find no node
  // that one reaches and the other does not.
  it('names a node one grant reaches and the other does not', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    fireEvent.change(within(users).getByLabelText(/user to change/i), {
      target: { value: 'USR-DOH-0005' },
    })
    const grants = region(/scope grants on the selected account/i)
    expect(within(grants).getByText(/is NOT reached by the/i)).toBeDefined()
    expect(grants.textContent ?? '').toMatch(/AC-16-02/)
    expect(grants.textContent ?? '').toMatch(/do not merge/i)
  })

  // Fails if the evaluator is handed empty scope arrays again: every view
  // would resolve to the same set of nodes.
  it('resolves fewer locations for a scoped view than for the tenant-wide one', () => {
    const admin = render(<PermissionsScreen role="TENANT_ADMIN" />)
    const adminRows = within(region(/locations this view reaches/i)).getAllByRole('row').length
    expect(within(region(/locations this view reaches/i)).getByText('Quality Laboratory')).toBeDefined()
    admin.unmount()

    render(<PermissionsScreen role="SUPERVISOR" />)
    const scoped = region(/locations this view reaches/i)
    const scopedRows = within(scoped).getAllByRole('row').length
    expect(scopedRows).toBeLessThan(adminRows)
    expect(within(scoped).getByText('Paint Line')).toBeDefined()
    // Out of scope, and therefore not listed at all — not listed and greyed.
    expect(within(scoped).queryByText('Quality Laboratory')).toBeNull()
  })

  // Fails if the grants panel renders from the read that just failed.
  it('names no account and no grant under STATE-12', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" screenState="STATE-12" />)
    const grants = region(/scope grants on the selected account/i)
    expect(grants.textContent ?? '').not.toMatch(/Priya Raman/)
    expect(within(grants).getByText(/nobody is named here/i)).toBeDefined()
  })

  // FIX ROUND 1, FINDING 1. The `unchanged` arm had no test in either suite.
  // Delete it and a same-scope assignment falls through to the audit gate and
  // the mutation, claiming "Narrowed the … grant" for a write that changed
  // nothing — and, on the failing-audit path, claiming the action did not
  // happen when there was no action to fail.
  it('writes nothing when the scope assigned is the scope already held', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" auditPath="commits" />)
    const users = region(/users, roles and scopes/i)
    const before = scopeRow(users, 'Priya Raman')

    assignScope(users, { user: 'USR-DOH-0001', role: 'TENANT_ADMIN', scope: 'tenant' })

    const status = within(users).getByRole('status').textContent ?? ''
    expect(status).toMatch(/already sits at Tenant/i)
    // The claim the missing arm would have made about a write that did nothing.
    expect(status).not.toMatch(/Narrowed the/i)
    expect(scopeRow(users, 'Priya Raman')).toBe(before)
  })

  it('appends no audit entry for an assignment that would change nothing', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" auditPath="write-fails" />)
    const users = region(/users, roles and scopes/i)

    assignScope(users, { user: 'USR-DOH-0001', role: 'TENANT_ADMIN', scope: 'tenant' })

    const status = within(users).getByRole('status').textContent ?? ''
    // A non-action has no audit write to fail: reaching the audit gate here
    // would report a failure for something that was never attempted.
    expect(status).not.toMatch(/the action did not happen/i)
    expect(status).toMatch(/no audit entry was appended/i)
  })

  // FIX ROUND 1, FINDING 2. Removing a role and assigning it again produces a
  // NEW grant at the widest scope — two audited acts, not a scope assignment.
  // The behaviour is deliberate and both halves say so on screen; this pins
  // the sequence so it cannot change silently in either direction.
  it('recreates a removed role as a new grant at the widest scope, and says so', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const users = region(/users, roles and scopes/i)
    expect(scopeRow(users, 'Rosa Mendez')).toMatch(/Supervisor: Area — Paint Line/)

    fireEvent.change(within(users).getByLabelText(/user to change/i), {
      target: { value: 'USR-DOH-0005' },
    })
    fireEvent.change(within(users).getByLabelText(/role to assign/i), {
      target: { value: 'SUPERVISOR' },
    })
    fireEvent.click(buttonNamed(users, /^Remove the role$/))
    expect(within(users).getByRole('status').textContent ?? '').toMatch(
      /grant's scope went with it/i,
    )
    expect(scopeRow(users, 'Rosa Mendez')).not.toMatch(/Supervisor/)

    fireEvent.click(buttonNamed(users, /^Assign the role$/))
    expect(within(users).getByRole('status').textContent ?? '').toMatch(
      /new grant starts at the widest scope/i,
    )
    expect(scopeRow(users, 'Rosa Mendez')).toMatch(/Supervisor: Tenant/)
  })

  it('names the sequence the source does not settle rather than leaving it implicit', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const unspecified = region(/unspecified in source/i)
    expect(
      within(unspecified).getByText(/Whether a scope survives its role being removed/i),
    ).toBeDefined()
    const scope = region(/scope in this pass/i)
    expect(within(scope).getByText(/does not govern the ROLE control beside it/i)).toBeDefined()
  })

  it('states all three scope rules where a reviewer reads them', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const scope = region(/scope in this pass/i)
    for (const rule of SCOPE_RULES) {
      expect(within(scope).getByText(new RegExp(rule.title, 'i')), rule.id).toBeDefined()
    }
    expect(within(scope).getByText(/Tresco Lane Store/)).toBeDefined()
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

  // Was: `/by precedence, not by position/`. That sentence was half of the
  // source. L14522 does put safety ninth in the DEFINITION list, but the
  // numbered workflow at L14529 evaluates it first (L14532), so the screen
  // now shows both and claims neither is the whole answer.
  it('renders the two precedence rules above the intersection, and BOTH source orders', () => {
    render(<PermissionsScreen />)
    const refused = region(/why was i refused/i)
    expect(within(refused).getByText(/explicit deny wins/i)).toBeDefined()
    expect(within(refused).getByText(/safety controls win/i)).toBeDefined()
    expect(within(refused).getByText(/evaluates safety FIRST/)).toBeDefined()
    expect(within(refused).getByText(/safety controls ninth/i)).toBeDefined()
    // The claim that went out to readers and was false. It must not come back.
    expect(within(refused).queryByText(/by precedence, not by position/i)).toBeNull()
  })

  it('gives the nine an Evaluated column, with safety first in it', () => {
    render(<PermissionsScreen />)
    const refused = region(/why was i refused/i)
    const rows = within(refused).getAllByRole('row')
    expect(rows[0]?.textContent ?? '').toMatch(/Evaluated/)
    // Safety is the ninth ROW (definition order) and the first EVALUATED.
    expect(rows[9]?.textContent ?? '').toMatch(/safety controls/i)
    expect(rows[9]?.textContent ?? '').toMatch(/First/)
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

  // The Tenant Admin's Refused list is empty BY CONSTRUCTION. A heading over
  // an empty list is the one shape the Table primitive's emptyState contract
  // exists to prevent, and these lists had none.
  it('states why the Refused list is empty rather than leaving a bare heading', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" />)
    const byPerson = region(/by person/i)
    expect(within(byPerson).queryAllByRole('listitem').length).toBeGreaterThan(0)
    expect(within(byPerson).getByText(/Nothing is refused-but-drawn/i)).toBeDefined()
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

  // The control case. Without it the refusal below proves only that the
  // button does nothing, which a broken button also achieves.
  it('assigns the role and moves the standing counter when the audit write commits', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" auditPath="commits" />)
    const users = region(/users, roles and scopes/i)
    const panel = region(/mandatory-role guard/i)
    const before = within(panel).getByText(/Approver-capable holders: \d+/).textContent
    fireEvent.click(buttonNamed(users, /^Assign the role$/))
    expect(within(users).getByRole('status').textContent ?? '').toMatch(/Assigned the/i)
    expect(within(panel).getByText(/Approver-capable holders: \d+/).textContent).not.toBe(before)
  })

  // THE INVARIANT, on a control whose success path mutates observably: the
  // roster, the register row and the standing counter all move when this
  // action commits, so a failed audit that left any of them moved would be an
  // unaudited success. Create-a-user-account cannot prove this — it changes
  // nothing either way.
  it('rolls the whole action back when the audit write fails, leaving the register unchanged', () => {
    render(<PermissionsScreen role="TENANT_ADMIN" auditPath="write-fails" />)
    const users = region(/users, roles and scopes/i)
    const panel = region(/mandatory-role guard/i)
    const before = within(panel).getByText(/Approver-capable holders: \d+/).textContent
    const registerBefore = within(users).getByRole('table').textContent

    fireEvent.click(buttonNamed(users, /^Assign the role$/))

    expect(within(users).getByRole('status').textContent ?? '').toMatch(/the action did not happen/i)
    expect(within(panel).getByText(/Approver-capable holders: \d+/).textContent).toBe(before)
    expect(within(users).getByRole('table').textContent).toBe(registerBefore)
  })

  // Each row picks a target the action would genuinely change, so the audit
  // guard is reached rather than short-circuited by a domain refusal — a
  // handler's own refusal is not an action and appends no audit entry.
  // The scope row's target moved with pass two: scoping Priya's non-existent
  // Supervisor grant is refused by the handler's own domain rule and never
  // reaches the audit, so the row now narrows a grant that genuinely exists —
  // Marcus, Supervisor, tenant-wide, narrowed to an Area under his Site.
  it.each([
    ['creating an account', /create a user account/i, 'USR-DOH-0001', null],
    ['assigning a role the person does not hold', /^Assign the role$/, 'USR-DOH-0001', null],
    ['removing a role the person does hold', /^Remove the role$/, 'USR-DOH-0003', null],
    ['narrowing a scope', /^Assign the scope$/, 'USR-DOH-0003', 'area:AREA-ARD-PAINT'],
    [
      'issuing a managed credential',
      /issue or reset a managed personal identification number/i,
      'USR-DOH-0001',
      null,
    ],
  ] as const)('refuses %s on the same terms, not just the control that changes nothing', (
    _what,
    label,
    userId,
    scopeKey,
  ) => {
    render(<PermissionsScreen role="TENANT_ADMIN" auditPath="write-fails" />)
    const users = region(/users, roles and scopes/i)
    const registerBefore = within(users).getByRole('table').textContent
    fireEvent.change(within(users).getByLabelText(/user to change/i), {
      target: { value: userId },
    })
    if (scopeKey !== null) {
      fireEvent.change(within(users).getByLabelText(/scope to assign/i), {
        target: { value: scopeKey },
      })
    }
    fireEvent.click(buttonNamed(users, label))
    expect(within(users).getByRole('status').textContent ?? '').toMatch(
      /the action did not happen/i,
    )
    // And the mutation it would have made is not half-applied.
    expect(within(users).getByRole('table').textContent).toBe(registerBefore)
  })
})

describe('MOD-DOH-09 — the standing panels the contract requires', () => {
  it('states that it registers no cross-slice seam rather than stubbing one inline', () => {
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
    // Both structures, both cited: the definition list and the workflow.
    expect(within(conflicts).getAllByText(/L14514/).length).toBeGreaterThan(0)
    expect(within(conflicts).getAllByText(/L14532/).length).toBeGreaterThan(0)
  })

  it('states the cost of the Worker holding no Hub screen', () => {
    render(<PermissionsScreen role="WORKER" />)
    expect(screen.getByText(/cannot check their own certification expiry/i)).toBeDefined()
    expect(screen.queryByRole('region', { name: /users, roles and scopes/i })).toBeNull()
  })
})

describe('MOD-DOH-09 — STATE-05 is a position a reader can actually see', () => {
  /**
   * THE E2E CHECK THIS DUPLICATES CANNOT REACH THE DEFECT IT WAS WRITTEN FOR.
   *
   * `tests/accessibility/axe-states.spec.ts` drives every position of the
   * "Screen state" control and requires the nine renderings to be distinct.
   * It found this screen rendering STATE-05 byte-identically to its STATE-03
   * default, because `PermissionNotice` — the whole of the STATE-05 treatment
   * — renders nothing for a fully `allowed` decision, and
   * `create-or-edit-user-account` is plain `allowed` for the Tenant Admin the
   * route loads in as.
   *
   * But that suite returns the VIEWER control to its default before driving
   * the state control, so it only ever measures STATE-05 for ONE persona. A
   * second persona falling silent the same way would be invisible to it.
   *
   * STATE-05 is in none of `CONNECTION_LOSS_STATES`, is not STATE-06 and is
   * not STATE-12, so on this screen it drives NOTHING except the treatment. A
   * text difference between the two renderings is therefore the treatment and
   * nothing else — which is why this compares text rather than asserting on
   * the paragraph's own words, whose wording is the field under test.
   */

  /**
   * THE WORKER IS EXCLUDED, AND THE EXCLUSION IS PROVED HERE RATHER THAN
   * ASSUMED IN THE LOOP BELOW. The first version of that loop ran all five
   * and went red on the Worker; the cause was not the treatment. The Hub
   * route registry admits no Worker, so the surface refuses the route before
   * this module is consulted and the screen renders the surface's refusal
   * with no module body and no state control at all. There is no position to
   * drive, so there is nothing for a distinctness rule to be about. If that
   * ever changes — a Worker Hub view is DEC-WKRVIEW-001, an OPEN client
   * decision — this goes red and the loop below has to grow a fifth persona.
   */
  it('offers the state control to four of the five personas, and refuses the Worker at the surface', () => {
    const reaching = TENANT_ROLE_ORDER.filter((role) => {
      const { unmount } = render(<PermissionsScreen role={role} />)
      const offered = screen.queryByLabelText(/^Screen state$/i) !== null
      unmount()
      return offered
    })
    expect(reaching).toEqual(['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'])

    render(<PermissionsScreen role="WORKER" screenState="STATE-05" />)
    expect(screen.getByText(/route registry admits/i)).toBeDefined()
  })

  const PERSONAS_REACHING_THE_CONTROL = TENANT_ROLE_ORDER.filter((r) => r !== 'WORKER')

  it('renders a STATE-05 treatment that differs from the STATE-03 default, for every persona', () => {
    for (const role of PERSONAS_REACHING_THE_CONTROL) {
      const success = render(<PermissionsScreen role={role} screenState="STATE-03" />)
      const successText = success.container.textContent ?? ''
      success.unmount()

      const denied = render(<PermissionsScreen role={role} screenState="STATE-05" />)
      const deniedText = denied.container.textContent ?? ''
      denied.unmount()

      expect(successText.length, role).toBeGreaterThan(200)
      expect(
        deniedText,
        `${role}: STATE-05 renders byte-identically to the STATE-03 default — a state offered ` +
          'as its own position and rendered as another one is a state nobody can see ' +
          '(state contract, L48006 onwards; STATE-05 at L48012).',
      ).not.toBe(successText)
    }
  })

  /**
   * The complement, and the reason the screen's guard reads
   * `outcome === 'allowed'` rather than `permitsAction`: a persona the source
   * refuses must meet the evaluator's own refusal, not a paragraph explaining
   * that nobody is refused. Creating a tenant user account belongs to the
   * Tenant Admin alone (L28522), so all three of the others are refused.
   */
  it('names the refusal itself for the personas the source refuses', () => {
    for (const role of PERSONAS_REACHING_THE_CONTROL.filter((r) => r !== 'TENANT_ADMIN')) {
      const { container, unmount } = render(
        <PermissionsScreen role={role} screenState="STATE-05" />,
      )
      const notes = Array.from(container.querySelectorAll('[role="note"]'))
        .map((n) => n.textContent ?? '')
        .join(' ')
      expect(notes, `${role}: no refusal rendered under STATE-05`).toMatch(
        /prohibit|not carry|refus|no .* grant/i,
      )
      expect(notes, `${role}: told that no refusal renders, when this persona IS refused`).not.toMatch(
        /no refusal renders for this persona/i,
      )
      unmount()
    }
  })
})
