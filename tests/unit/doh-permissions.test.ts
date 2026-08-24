import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { namesPersonBehaviouralMeasure } from '../coverage/person-measure-keys'
import { stripComments } from '../coverage/strip-comments'
import { rolesInDomain, type RoleId } from '@/domain/roles'
import { PERMISSION_OUTCOMES, isRefusal, type PermissionOutcome } from '@/policy/decision'
import { evaluateAccess } from '@/policy/evaluate'
import {
  ACCESS_CONDITIONS,
  EVALUATION_ORDER,
  PRECEDENCE_RULES,
} from '@/surfaces/doh/access-conditions'
import { DEFERRED_DOH_SCOPES, DOH_SCOPES } from '@/surfaces/doh/scope'
import { TENANT_STATES, writeAllowed } from '@/surfaces/doh/tenant-state'
import {
  cellStatus,
  dohModuleById,
  outcomeCellStatus,
  rolesReachingByMatrix,
  type ControlStatus,
} from '@/surfaces/doh/modules'
import { CONTROL_MATRIX as DOH_08_MATRIX, DOH_08_MODULE_ROW_TENSION } from '@/surfaces/doh/modules/doh-08/matrix'
import { DOH_09_MODULE_ROW_TENSION } from '@/surfaces/doh/modules/doh-09/readings'
import { DOH_13_MODULE_ROW_TENSION } from '@/surfaces/doh/modules/doh-13/readings'
import { MOD_DOH_15_MATRIX as DOH_15_MATRIX, DOH_15_MODULE_ROW_TENSION } from '@/surfaces/doh/modules/doh-15/matrix'
import { CONTROL_MATRIX as DOH_13_MATRIX } from '../../app/hub/tenant-view-of-platform-administration/fixtures'
import { DOH_SEAMS } from '@/surfaces/doh/seams'
import {
  SEEDED_SSO_CONNECTION,
  SSO_CONNECTION_STATES,
  SSO_PROTOCOLS,
  emailDomainOf,
  resolveSignInTrack,
} from '@/surfaces/doh/sso-connection'
import {
  NODE_FLAG_CONSEQUENCES,
  areaById,
  siteById,
  visibleAreaIds,
  visibleSiteIds,
} from '../../app/hub/location-configuration/fixtures'
import {
  ACCOUNT_LIFECYCLE_RIVALS,
  ABSENT_CONTROLS,
  APPROVER_CAPABLE_ROLES,
  ASSIGNABLE_SCOPE_TARGETS,
  CONFIGURATION_EDIT_ACTION,
  DOH09_APPLICABLE_STATES,
  DOH09_INAPPLICABLE_STATES,
  MANDATORY_ROLE_STATEMENTS,
  PERMISSION_MATRIX,
  REFUSAL_SCENARIOS,
  ROLE_CARD_BLOCK_NAMES,
  ROSTER_SCENARIOS,
  SCOPE_RULES,
  SCOPE_TARGET_EXCLUSIONS,
  SIGN_IN_STAGES,
  SOURCE_CONFLICTS,
  TENANT_ROLE_ORDER,
  TENANT_SCOPE,
  UNSPECIFIED_IN_SOURCE,
  USER_ACCOUNT_STATES,
  ROLE_ASSIGNMENT_STATES,
  fixtureContext,
  fixtureState,
  mergeProbe,
  reaches,
  renderingFor,
  scopeChange,
  standingCounters,
  type MatrixRow,
  type ScopeRef,
} from '../../app/hub/permissions-roles-and-access/fixtures'

const MODULE = dohModuleById('MOD-DOH-09')

/**
 * THE MODULE'S OWN SOURCE FILES, ENUMERATED FROM THE DIRECTORY. Slice 4 gate
 * 3 measured this suite at zero `readFileSync` calls: the D1 and AC-16-12
 * gates below existed, but both scanned `JSON.stringify` of the FIXTURE
 * DATA, never the source text of `fixtures.ts`, `PermissionsScreen.tsx` or
 * `page.tsx` — so a forbidden literal sitting in a comment, in JSX prose or
 * in any code this module carries that is not one of the nine named
 * constants would pass unseen. A directory walk closes that, and a fourth
 * file this module grows is covered without anyone remembering to add it.
 */
const MODULE_DIR = 'app/hub/permissions-roles-and-access'

function moduleSources(): { file: string; src: string }[] {
  return readdirSync(MODULE_DIR)
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => `${MODULE_DIR}/${f}`)
    // Stripped, not raw — the same hazard `doh-tenant-lifecycle.test.ts`
    // hit: this module's own source discusses the forbidden three-digit
    // form and session-role language IN ORDER TO DENY them, in prose that
    // would otherwise trip the gates it explains.
    .map((file) => ({ file, src: stripComments(readFileSync(file, 'utf8')) }))
}

function cellsOf(row: MatrixRow): PermissionOutcome[] {
  return TENANT_ROLE_ORDER.map((r) => row.cells[r].outcome)
}

describe('MOD-DOH-09 — the five tenant roles and the spine it consumes', () => {
  it('orders the five tenant roles exactly as the role registry does, and adds none', () => {
    expect(TENANT_ROLE_ORDER).toEqual(rolesInDomain('TENANT').map((r) => r.id))
    expect(TENANT_ROLE_ORDER).toHaveLength(5)
  })

  it('renders the module slug from the registry rather than a hand-typed route key', () => {
    expect(MODULE.slug).toBe('permissions-roles-and-access')
  })

  // The DEFINITION enumeration (L14514-L14522): role permission first, safety
  // controls ninth. Nothing in this module may re-sort it. The workflow order
  // is a SEPARATE array; slice-4 gate 7 pins that one against the source.
  it('keeps the nine access conditions in the definition order, safety ninth', () => {
    expect(ACCESS_CONDITIONS[0]).toBe('role-permission')
    expect(ACCESS_CONDITIONS[8]).toBe('safety-controls')
    expect(ACCESS_CONDITIONS).toHaveLength(9)
    expect(PRECEDENCE_RULES).toEqual(['explicit-deny-wins', 'safety-controls-win'])
  })

  it('keeps the evaluation order separate, with safety first in it (L14532)', () => {
    expect(EVALUATION_ORDER[0]).toBe('safety-controls')
    expect([...EVALUATION_ORDER].sort()).toEqual([...ACCESS_CONDITIONS].sort())
  })

  it('exercises every one of the nine conditions with a seeded refusal scenario', () => {
    const covered = new Set(REFUSAL_SCENARIOS.map((s) => s.condition))
    for (const condition of ACCESS_CONDITIONS) expect(covered.has(condition)).toBe(true)
  })
})

describe('MOD-DOH-09 — the twelve-row control matrix', () => {
  it('carries twelve rows with unique identifiers', () => {
    expect(PERMISSION_MATRIX).toHaveLength(12)
    expect(new Set(PERMISSION_MATRIX.map((r) => r.id)).size).toBe(12)
  })

  // AC-DOC-006 / AC-RBAC-001: a blank cell is a build-blocking defect.
  it('carries exactly one status token from the closed set in every cell, for all five roles', () => {
    for (const row of PERMISSION_MATRIX) {
      for (const role of TENANT_ROLE_ORDER) {
        const cell = row.cells[role]
        expect(PERMISSION_OUTCOMES).toContain(cell.outcome)
        expect(cell.cause.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('marks every row that is Explicitly prohibited for all five roles as categorical', () => {
    const allProhibited = PERMISSION_MATRIX.filter((row) =>
      cellsOf(row).every((o) => o === 'explicitlyProhibited'),
    )
    // The census says five; it then enumerates six. Six is what the matrix holds.
    expect(allProhibited).toHaveLength(6)
    for (const row of allProhibited) {
      expect(row.prohibition).toBe('categorical')
      for (const role of TENANT_ROLE_ORDER) expect(renderingFor(row, role)).toBe('absent')
    }
  })

  it('maps every source status token to its rendering by rule, never by taste', () => {
    const byId = new Map(PERMISSION_MATRIX.map((r) => [r.id, r]))
    const register = byId.get('view-user-and-role-register')
    const pin = byId.get('issue-or-reset-managed-pin')
    const createUser = byId.get('create-or-edit-user-account')
    if (!register || !pin || !createUser) throw new Error('matrix rows missing')

    // Read-only renders as a read-only treatment with its cause named, never absent.
    expect(renderingFor(register, 'SUPERVISOR')).toBe('read-only')
    expect(renderingFor(register, 'QUALITY_MANAGER')).toBe('read-only')
    expect(renderingFor(register, 'READONLY_AUDITOR')).toBe('read-only')
    // Unavailable is NOT prohibited — the two statuses are never merged.
    expect(register.cells.WORKER.outcome).toBe('unavailable')
    expect(renderingFor(register, 'WORKER')).toBe('absent')

    // The only row where a role other than the Tenant Admin writes.
    expect(pin.cells.SUPERVISOR.outcome).toBe('allowedWithConditions')
    expect(renderingFor(pin, 'SUPERVISOR')).toBe('control')

    // A routing prohibition: the control exists on this screen for the Tenant
    // Admin, so the refused role sees it disabled with its reason.
    expect(createUser.prohibition).toBe('routing')
    expect(renderingFor(createUser, 'SUPERVISOR')).toBe('disabled-with-reason')
    expect(renderingFor(createUser, 'TENANT_ADMIN')).toBe('control')
  })

  // Was vacuous: it asserted a non-empty cause on the cells the test above
  // already asserts a non-empty cause on, unconditionally, for every cell. No
  // edit to fixtures.ts could fail it without failing that one first. It now
  // checks the thing the token PROMISES — that the cell states WHICH
  // condition, anchored to the source line that imposes it — and asserts the
  // cells exist, so the loop cannot go quiet by there being none.
  it('states which condition, with its source line, on every Allowed-with-conditions cell', () => {
    const conditional = PERMISSION_MATRIX.flatMap((row) =>
      TENANT_ROLE_ORDER.filter((role) => row.cells[role].outcome === 'allowedWithConditions').map(
        (role) => ({ where: `${row.id}/${role}`, cause: row.cells[role].cause }),
      ),
    )
    expect(conditional).toHaveLength(3)
    for (const { where, cause } of conditional) {
      const [token, ...rest] = cause.split('—')
      expect(token?.trim(), where).toBe('Allowed with conditions')
      const stated = rest.join('—').trim()
      // The condition itself, not the token restated, and traceable.
      expect(stated.length, where).toBeGreaterThan(20)
      expect(stated, where).toMatch(/L\d{4,6}/)
    }
  })
})

describe('MOD-DOH-09 — the tenant state gate is one data table', () => {
  it('blocks the configuration-edit write class in every non-active state, from the spine table', () => {
    expect(writeAllowed('active', CONFIGURATION_EDIT_ACTION)).toBe(true)
    for (const state of TENANT_STATES) {
      if (state === 'active') continue
      expect(writeAllowed(state, CONFIGURATION_EDIT_ACTION)).toBe(false)
    }
    // The stricter reading where state cannot be determined.
    expect(writeAllowed('indeterminate', CONFIGURATION_EDIT_ACTION)).toBe(false)
  })
})

describe('MOD-DOH-09 — the single sign-on connection record (controller ruling C2)', () => {
  it('seeds a complete record a settings screen can render without adding a field', () => {
    const r = SEEDED_SSO_CONNECTION
    expect(SSO_CONNECTION_STATES).toContain(r.state)
    expect(r.state).toBe('configured')
    expect(r.protocol).not.toBeNull()
    if (r.protocol !== null) expect(SSO_PROTOCOLS).toContain(r.protocol)
    expect(r.emailDomains.length).toBeGreaterThan(0)
    expect(r.tenantContactEmail).toMatch(/@/)
    expect(r.configuredAsOfLabel.trim().length).toBeGreaterThan(0)
    expect(r.originLabel.trim().length).toBeGreaterThan(0)
    // Authentication is not authorization: a role claim is untrusted input.
    expect(r.assertedRoleClaimHandling).toBe('logged-and-ignored')
    // No just-in-time provisioning at the first version; the decision is open.
    expect(r.justInTimeProvisioning).toBe('refused-no-record-no-sign-in')
    expect(r.openDecision).toBe('DEC-SSO-001')
    expect(r.managedCredentialPath).toBe('available')
    expect(r.sourceRefs.length).toBeGreaterThan(0)
  })

  it('resolves the two tracks from the email domain and refuses an unusable address', () => {
    const domain = SEEDED_SSO_CONNECTION.emailDomains[0]
    if (domain === undefined) throw new Error('the seeded connection carries no domain')
    expect(emailDomainOf(`priya@${domain}`)).toBe(domain)
    expect(resolveSignInTrack(`priya@${domain}`, SEEDED_SSO_CONNECTION)).toBe('sso')
    expect(resolveSignInTrack('someone@elsewhere.example', SEEDED_SSO_CONNECTION)).toBe('managed')
    expect(emailDomainOf('not-an-address')).toBeNull()
    expect(resolveSignInTrack('not-an-address', SEEDED_SSO_CONNECTION)).toBeNull()
  })

  it('routes every address to the managed track while no connection is configured', () => {
    const domain = SEEDED_SSO_CONNECTION.emailDomains[0]
    if (domain === undefined) throw new Error('the seeded connection carries no domain')
    const notConfigured = { ...SEEDED_SSO_CONNECTION, state: 'not_configured' as const }
    expect(resolveSignInTrack(`priya@${domain}`, notConfigured)).toBe('managed')
  })

  it('renders the boot order as the five named stages of the access resolution sequence', () => {
    expect(SIGN_IN_STAGES.map((s) => s.id)).toEqual([
      'unauthenticated',
      'track',
      'scope-resolved',
      'tenant-state-applied',
      'hub-rendered',
    ])
  })
})

describe('MOD-DOH-09 — the standing mandatory-role counters', () => {
  it('reports the seeded roster with both counters above zero and no warning', () => {
    const seeded = ROSTER_SCENARIOS.find((s) => s.id === 'seeded')
    if (!seeded) throw new Error('no seeded roster scenario')
    const counters = standingCounters(seeded.users, seeded.jobExists)
    expect(counters.tenantAdmins).toBeGreaterThan(0)
    expect(counters.approverCapable).toBeGreaterThan(0)
    expect(counters.warnings).toEqual([])
  })

  it('never reports a zero without a warning, on either counter', () => {
    const noApprover = ROSTER_SCENARIOS.find((s) => s.id === 'no-approver-holder')
    if (!noApprover) throw new Error('no zero-approver roster scenario')
    const counters = standingCounters(noApprover.users, noApprover.jobExists)
    expect(counters.approverCapable).toBe(0)
    expect(counters.warnings).toContain(MANDATORY_ROLE_STATEMENTS.approver)

    const empty = standingCounters([], true)
    expect(empty.tenantAdmins).toBe(0)
    expect(empty.warnings).toContain(MANDATORY_ROLE_STATEMENTS.tenantAdmin)
    expect(empty.warnings).toContain(MANDATORY_ROLE_STATEMENTS.approver)
  })

  it('counts approver-capable holders against a named, declared role set', () => {
    expect(APPROVER_CAPABLE_ROLES.length).toBeGreaterThan(0)
    for (const role of APPROVER_CAPABLE_ROLES) expect(TENANT_ROLE_ORDER).toContain(role)
  })
})

describe('MOD-DOH-09 — deny by default, driven through the one evaluator', () => {
  it('refuses every seeded refusal scenario that is not the role-permission case, for every role', () => {
    for (const scenario of REFUSAL_SCENARIOS) {
      if (scenario.condition === 'role-permission') continue
      for (const role of TENANT_ROLE_ORDER) {
        const decision = evaluateAccess(scenario.request, fixtureContext(role, scenario))
        expect(isRefusal(decision)).toBe(true)
      }
    }
  })

  it('treats a rule that cannot be evaluated as violated, never as a grant', () => {
    const unevaluable = REFUSAL_SCENARIOS.find((s) => s.id === 'unevaluable-rule')
    if (!unevaluable) throw new Error('no unevaluable-rule scenario')
    const decision = evaluateAccess(unevaluable.request, fixtureContext('TENANT_ADMIN', unevaluable))
    expect(isRefusal(decision)).toBe(true)
    expect(decision.stage).toBe('OBJECT_STATE')
  })

  it('lets the role-permission scenario through for the one role that holds it', () => {
    const scenario = REFUSAL_SCENARIOS.find((s) => s.condition === 'role-permission')
    if (!scenario) throw new Error('no role-permission scenario')
    const admin = evaluateAccess(scenario.request, fixtureContext('TENANT_ADMIN', scenario))
    expect(admin.outcome).toBe('allowed')
    const supervisor = evaluateAccess(scenario.request, fixtureContext('SUPERVISOR', scenario))
    expect(supervisor.stage).toBe('BASE_ROLE')
    expect(isRefusal(supervisor)).toBe(true)
  })

  it('seeds a domain state the evaluator can resolve the tenant against', () => {
    const state = fixtureState()
    expect(Object.keys(state.tenants)).toHaveLength(1)
  })
})

/**
 * PASS TWO. Pass one asserted here that every seeded account sat at the
 * tenant dimension and that Site and Area were not stubbed. That assertion
 * was true of pass one and is the thing this task removes: the dimensions are
 * now live, so the check moves from "nothing but tenant" to "every Site and
 * Area named here is one the location fixture owns, and a scope only ever
 * narrows".
 */
describe('MOD-DOH-09 — pass two: Site and Area scope', () => {
  const allGrants = ROSTER_SCENARIOS.flatMap((s) => s.users).flatMap((u) => u.grants)

  it('seeds Site and Area grants whose every node resolves in the location fixture', () => {
    // Two sources of Site truth is the defect this asserts against: a hand-typed
    // Site id in this module resolves nowhere and fails here.
    for (const grant of allGrants) {
      if (grant.scope.dimension === 'tenant') {
        expect(grant.scope.nodeId, grant.role).toBeNull()
        continue
      }
      const { dimension, nodeId } = grant.scope
      expect(nodeId, `${grant.role}/${dimension}`).not.toBeNull()
      if (nodeId === null) continue
      const found = dimension === 'site' ? siteById(nodeId) : areaById(nodeId)
      expect(found, `${grant.role} names ${nodeId}`).toBeDefined()
    }
    // Not vacuous: both new dimensions are actually seeded.
    expect(allGrants.some((g) => g.scope.dimension === 'site')).toBe(true)
    expect(allGrants.some((g) => g.scope.dimension === 'area')).toBe(true)
  })

  it('narrows only: a scope goes finer, never wider and never sideways', () => {
    const tenant = TENANT_SCOPE
    const site1: ScopeRef = { dimension: 'site', nodeId: 'SITE-ARD-01' }
    const site2: ScopeRef = { dimension: 'site', nodeId: 'SITE-ARD-02' }
    const areaUnder1: ScopeRef = { dimension: 'area', nodeId: 'AREA-ARD-ASSY' }
    const areaUnder2: ScopeRef = { dimension: 'area', nodeId: 'AREA-ARD-QC' }

    expect(scopeChange(tenant, site1)).toBe('narrows')
    expect(scopeChange(tenant, areaUnder1)).toBe('narrows')
    expect(scopeChange(site1, areaUnder1)).toBe('narrows')
    expect(scopeChange(site1, site1)).toBe('unchanged')
    // The three the rule exists to refuse (L17470).
    expect(scopeChange(site1, tenant)).toBe('not-a-narrowing')
    expect(scopeChange(areaUnder1, tenant)).toBe('not-a-narrowing')
    expect(scopeChange(site1, areaUnder2)).toBe('not-a-narrowing')
    expect(scopeChange(site1, site2)).toBe('not-a-narrowing')
  })

  it('does not merge across grants: one grant never reaches through another', () => {
    const rosa = ROSTER_SCENARIOS.flatMap((s) => s.users).find((u) => u.grants.length > 1)
    if (!rosa) throw new Error('no multi-grant account is seeded')
    const probe = mergeProbe(rosa)
    if (probe === null) throw new Error('the multi-grant account demonstrates nothing')

    // The node one grant reaches is NOT reached by the other. A union would.
    expect(reaches(probe.reachedBy.scope, probe.nodeId)).toBe(true)
    expect(reaches(probe.notReachedBy.scope, probe.nodeId)).toBe(false)
    expect(probe.reachedBy.role).not.toBe(probe.notReachedBy.role)
  })

  it('resolves reach down the hierarchy and never up it', () => {
    const site: ScopeRef = { dimension: 'site', nodeId: 'SITE-ARD-01' }
    const area: ScopeRef = { dimension: 'area', nodeId: 'AREA-ARD-ASSY' }
    expect(reaches(TENANT_SCOPE, 'SITE-ARD-02')).toBe(true)
    expect(reaches(site, 'SITE-ARD-01')).toBe(true)
    expect(reaches(site, 'AREA-ARD-ASSY')).toBe(true)
    expect(reaches(site, 'AREA-ARD-QC')).toBe(false)
    expect(reaches(area, 'AREA-ARD-ASSY')).toBe(true)
    // Upwards is the widening the rule refuses: an Area does not reach its Site.
    expect(reaches(area, 'SITE-ARD-01')).toBe(false)
  })

  it('offers every assignable node from the location fixture and invents none', () => {
    const keys = ASSIGNABLE_SCOPE_TARGETS.map((t) => t.key)
    expect(keys[0]).toBe('tenant')
    expect(new Set(keys).size).toBe(keys.length)
    for (const target of ASSIGNABLE_SCOPE_TARGETS) {
      if (target.scope.dimension === 'tenant') continue
      const nodeId = target.scope.nodeId
      expect(nodeId).not.toBeNull()
      if (nodeId === null) continue
      const node = target.scope.dimension === 'site' ? siteById(nodeId) : areaById(nodeId)
      expect(node, nodeId).toBeDefined()
      expect(node?.state, nodeId).toBe('active')
    }
    expect(ASSIGNABLE_SCOPE_TARGETS.some((t) => t.scope.dimension === 'site')).toBe(true)
    expect(ASSIGNABLE_SCOPE_TARGETS.some((t) => t.scope.dimension === 'area')).toBe(true)
  })

  it('withholds the scope-pending and archived nodes, and says which and why', () => {
    const offered = ASSIGNABLE_SCOPE_TARGETS.map((t) => t.scope.nodeId)
    // D21: a scope-pending Site is excluded from the role-assignment pickers.
    expect(offered).not.toContain('SITE-ARD-03')
    // Archived nodes are still readable and are not assignable.
    expect(offered).not.toContain('SITE-ARD-04')
    expect(offered).not.toContain('AREA-ARD-STORE')
    const withheld = SCOPE_TARGET_EXCLUSIONS.map((e) => e.nodeId)
    expect(withheld).toContain('SITE-ARD-03')
    expect(withheld).toContain('SITE-ARD-04')
    expect(withheld).toContain('AREA-ARD-STORE')
    for (const entry of SCOPE_TARGET_EXCLUSIONS) {
      expect(entry.reason.trim().length, entry.nodeId).toBeGreaterThan(20)
    }
  })

  // FIX ROUND 1, FINDING 3. The reason the picker withholds a scope-pending
  // Site is the OWNING module's own consequence sentence, read rather than
  // hand-copied. Reword it over there and this fails here, which is what a
  // second copy could never do.
  it('reads the scope-pending reason from the module that owns the flag', () => {
    const owned = NODE_FLAG_CONSEQUENCES.find((c) => c.id === 'scope-pending')?.consequence
    expect(owned).toBeDefined()
    const withheld = SCOPE_TARGET_EXCLUSIONS.find((e) => e.nodeId === 'SITE-ARD-03')
    expect(withheld).toBeDefined()
    if (owned === undefined || withheld === undefined) return
    expect(withheld.reason).toContain(owned)
  })

  it('states the three scope rules, each anchored to the source', () => {
    expect(SCOPE_RULES.map((r) => r.id)).toEqual(['additive', 'narrow-only', 'no-merge'])
    for (const rule of SCOPE_RULES) {
      expect(rule.detail.trim().length, rule.id).toBeGreaterThan(40)
      expect(rule.sourceRef, rule.id).toMatch(/L\d{4,6}/)
    }
  })

  it('hands the evaluator the identity’s real Site and Area scope, not an empty pair', () => {
    const supervisor = fixtureContext('SUPERVISOR').identity
    expect(supervisor.areaScope).toEqual(visibleAreaIds('SUPERVISOR'))
    expect(supervisor.areaScope.length).toBeGreaterThan(0)
    expect(fixtureContext('TENANT_ADMIN').identity.siteScope).toEqual(visibleSiteIds('TENANT_ADMIN'))

    // The narrowing, resolved through the ONE evaluator rather than asserted.
    const request = {
      action: 'MOD-DOH-09:read-location-node',
      allowedRoles: [...TENANT_ROLE_ORDER],
      requiredAreas: ['AREA-ARD-QC'],
      sourceRefs: ['L17470'],
    }
    expect(evaluateAccess(request, fixtureContext('TENANT_ADMIN')).outcome).toBe('allowed')
    const scoped = evaluateAccess(request, fixtureContext('SUPERVISOR'))
    expect(isRefusal(scoped)).toBe(true)
    expect(scoped.stage).toBe('SCOPE')
  })

  it('keeps Cell, Job and worker scoping out of the live dimension entirely', () => {
    expect(DOH_SCOPES).toEqual(['tenant', 'site', 'area'])
    expect(DEFERRED_DOH_SCOPES).toEqual(['cell', 'job', 'worker'])
    for (const deferred of DEFERRED_DOH_SCOPES) {
      expect(DOH_SCOPES).not.toContain(deferred)
      // No picker option can offer one, because no target carries the dimension.
      expect(ASSIGNABLE_SCOPE_TARGETS.some((t) => t.key.startsWith(deferred))).toBe(false)
    }
  })
})

describe('MOD-DOH-09 — object vocabularies and the panels the contract requires', () => {
  it('carries the module card state set for the user account and the role assignment', () => {
    expect(USER_ACCOUNT_STATES).toEqual(['active', 'suspended_by_tenant_state', 'archived'])
    expect(ROLE_ASSIGNMENT_STATES).toEqual(['assigned', 'removed'])
  })

  it('records all four rival account lifecycles rather than silently picking one', () => {
    expect(ACCOUNT_LIFECYCLE_RIVALS.length).toBeGreaterThanOrEqual(4)
    for (const rival of ACCOUNT_LIFECYCLE_RIVALS) {
      expect(rival.states.length).toBeGreaterThan(0)
      expect(rival.sourceRef.trim().length).toBeGreaterThan(0)
    }
  })

  it('names every undefined affordance instead of inventing a control for it', () => {
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const entry of UNSPECIFIED_IN_SOURCE) {
      expect(entry.affordance.trim().length).toBeGreaterThan(0)
      expect(entry.note.trim().length).toBeGreaterThan(0)
    }
  })

  it('records the source conflicts this module had to resolve, with the resolution', () => {
    const topics = SOURCE_CONFLICTS.map((c) => c.topic).join(' | ')
    expect(topics).toMatch(/order/i)
    for (const conflict of SOURCE_CONFLICTS) {
      expect(conflict.resolution.trim().length).toBeGreaterThan(0)
    }
  })

  it('gives every absent control a stated note where the control would sit', () => {
    expect(ABSENT_CONTROLS.length).toBeGreaterThan(0)
    for (const control of ABSENT_CONTROLS) expect(control.note.trim().length).toBeGreaterThan(0)
  })

  it('carries the seven fixed role-definition-card blocks in source order', () => {
    expect(ROLE_CARD_BLOCK_NAMES).toEqual([
      'Identity',
      'Reach',
      'Visibility',
      'Rights',
      'Prohibition',
      'Governance',
      'Traceability',
    ])
  })
})

describe('MOD-DOH-09 — the screen states this module actually has', () => {
  it('excludes the four states that cannot occur here, each with a stated reason', () => {
    expect(DOH09_APPLICABLE_STATES).not.toContain('STATE-07')
    expect(DOH09_APPLICABLE_STATES).not.toContain('STATE-09')
    expect(DOH09_APPLICABLE_STATES).not.toContain('STATE-10')
    expect(DOH09_APPLICABLE_STATES).not.toContain('STATE-11')
    expect(DOH09_INAPPLICABLE_STATES.map((s) => s.id)).toEqual([
      'STATE-07',
      'STATE-09',
      'STATE-10',
      'STATE-11',
    ])
    for (const state of DOH09_INAPPLICABLE_STATES) {
      expect(state.reason.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('MOD-DOH-09 — the gates this module is measured against', () => {
  // RESCOPED. Both gates below used to scan only `JSON.stringify` of nine
  // named fixture constants — data, never source. That is the same defect
  // shape slice 4 gate 3 found in `tests/unit/doh-workers.test.ts`'s
  // hardcoded `MY_FILES`, one level worse: a hand-picked SET OF CONSTANTS
  // rather than a hand-picked SET OF FILES, so anything this module's source
  // carries outside those nine — a comment, a JSX literal, a tenth constant
  // — was invisible to both. `allText` now carries the module's actual
  // source files, walked from the directory, alongside the original fixture
  // dump, so both surfaces are covered and a fourth file is covered the
  // moment it exists.
  const allText =
    JSON.stringify({
      PERMISSION_MATRIX,
      ROSTER_SCENARIOS,
      REFUSAL_SCENARIOS: REFUSAL_SCENARIOS.map((s) => ({ ...s, request: s.request.action })),
      ABSENT_CONTROLS,
      UNSPECIFIED_IN_SOURCE,
      SOURCE_CONFLICTS,
      SIGN_IN_STAGES,
      ACCOUNT_LIFECYCLE_RIVALS,
      SEEDED_SSO_CONNECTION,
    }) +
    '\n' +
    moduleSources()
      .map(({ src }) => src)
      .join('\n')

  it('contains no three-digit screen literal anywhere in its fixtures or source (D1)', () => {
    expect(allText).not.toMatch(/SCR-DOH-\d{3}/)
  })

  it('contains no session-role-context language anywhere in its fixtures or source (AC-16-12)', () => {
    expect(allText).not.toMatch(/act(ing)? as/i)
    expect(allText).not.toMatch(/impersonat/i)
    expect(allText).not.toMatch(/switch role|role selector/i)
  })

  // Slice gate 3: no persisted table or fixture may key a behavioural measure
  // on a person. The user register carries identity and authority, never a
  // count, a rate, a duration or a comparison.
  //
  // The gate used to be a raw regular expression over the key, and it refused
  // `accountState` — because `account` contains `count`. The gate was wrong,
  // not the fixture: an account state is a lifecycle token on a record, not a
  // measure of anybody's behaviour. It now calls the shared matcher, which
  // splits the key into words first and compares whole words only. See
  // `tests/coverage/person-measure-keys.ts`, and the both-directions proof
  // in the describe block below.
  //
  // Widened to the control matrix's own rows alongside the user register —
  // the second record shape this module owns — matching the shape
  // `doh-workers.test.ts` and `doh-platform-admin.test.ts` use for the same
  // gate.
  it('keys no behavioural measure on a person anywhere in the user register or the control matrix', () => {
    for (const scenario of ROSTER_SCENARIOS) {
      for (const user of scenario.users) {
        for (const key of Object.keys(user)) {
          expect(namesPersonBehaviouralMeasure(key), key).toBe(false)
        }
      }
    }
    for (const row of PERMISSION_MATRIX) {
      for (const key of Object.keys(row)) {
        expect(namesPersonBehaviouralMeasure(key), key).toBe(false)
      }
    }
  })

  // ADDED. Missing entirely: this suite carried no determinism gate at all.
  it('reads no clock and no randomness anywhere in this module', () => {
    for (const { file, src } of moduleSources()) {
      expect(src, file).not.toMatch(/Date\.now|new Date\(|Math\.random/)
    }
  })

  it('never says "read-only" without naming its cause', () => {
    for (const row of PERMISSION_MATRIX) {
      for (const role of TENANT_ROLE_ORDER) {
        if (row.cells[role].outcome === 'readOnly') {
          expect(row.cells[role].cause.trim().length).toBeGreaterThan(10)
        }
      }
    }
  })

  it('never hands the evaluator a platform role from this module', () => {
    const platformRoles: readonly RoleId[] = ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT']
    for (const role of platformRoles) expect(TENANT_ROLE_ORDER).not.toContain(role)
  })
})

// A gate whose test only proves it stays quiet is a gate that proves nothing.
// Both directions, on the same matcher, in the project that actually runs.
describe('the person-measure key gate, proved in both directions', () => {
  // TRUE POSITIVES — every one of these names a measure of a person, and the
  // matcher must refuse it. The camelCase, snake_case, kebab-case and
  // SCREAMING forms of the same concept are all here, because a defect that
  // arrives in the spelling the gate does not read is a defect that ships.
  it.each([
    ['a productivity measure', 'productivityScore'],
    ['a count sliced per shift', 'perShiftCount'],
    ['a comparison between people', 'workerRanking'],
    ['a rate', 'runsPerHour'],
    ['a pace, averaged', 'paceAverage'],
    ['an efficiency rating', 'efficiencyRating'],
    ['a throughput figure', 'throughputLastWeek'],
    ['a duration', 'handlingDuration'],
    ['time spent idle', 'idleMinutes'],
    ['a slice by person', 'perWorkerTotal'],
    ['a grouping by person', 'byOperatorTally'],
    ['snake_case', 'per_shift_count'],
    ['kebab-case', 'worker-ranking'],
    ['SCREAMING_SNAKE', 'RUNS_PER_HOUR'],
    ['PascalCase', 'ProductivityIndexScore'],
    ['an acronym prefix', 'PINResetCount'],
    // THE FOUR THE WORD MATCHER LOST, and the reason stems exist. Every one
    // of these was caught by the raw-substring expression this replaced, so
    // dropping them would have traded a false positive for four false
    // negatives. Each is a measure root wearing a suffix.
    ['a root wearing "er"', 'defectCounter'],
    ['a root wearing "card"', 'workerScorecard'],
    ['a root wearing "ed"', 'runsRanked'],
    ['a root wearing "s"', 'throughputs'],
  ])('refuses %s (%s)', (_what, key) => {
    expect(namesPersonBehaviouralMeasure(key)).toBe(true)
  })

  // FALSE POSITIVES — every one of these is a key the previous raw-substring
  // regular expression would have refused, or could plausibly refuse, and none
  // of them measures anybody. `accountState` is the one that failed this suite
  // for real: `account` contains `count`.
  it.each([
    ['a lifecycle token whose word contains "count"', 'accountState'],
    ['an identity field', 'roleName'],
    ['an authority field', 'scopeLabel'],
    ['"rate" inside "corporate"', 'corporateEmail'],
    ['"score" inside "underscore"', 'underscoreStyle'],
    ['"per" inside "permissions"', 'permissionsGranted'],
    ['"per" inside "person"', 'personId'],
    ['"by" inside "bypass"', 'bypassNotice'],
    ['"rank" inside "frank"', 'frankReview'],
    ['"mean" inside "meaning"', 'meaningLabel'],
    ['a bare shift reference, which is a schedule', 'shiftId'],
    ...[
      ...new Set(ROSTER_SCENARIOS.flatMap((s) => s.users.flatMap((u) => Object.keys(u)))),
    ].map((key): [string, string] => ['a live user-register key', key]),
  ])('allows %s (%s)', (_what, key) => {
    expect(namesPersonBehaviouralMeasure(key)).toBe(false)
  })
})

/**
 * THE CROSS-CHECK. Same case as `tests/unit/doh-tenant-lifecycle.test.ts` and
 * `tests/unit/doh-locations.test.ts` carry, adapted to this matrix's own
 * spelling of a cell: the module rail reads one field, `rolesReaching` on this
 * module's definition in `@/surfaces/doh/modules`, while this screen renders
 * its own matrix, and the two must not drift.
 *
 * The rule: the roles the spine withholds the route from are exactly the roles
 * this matrix marks `unavailable`. This module's own matrix states the reason
 * the two tokens are never merged, in the cell itself — `unavailable` is
 * "cannot hold this in any scope", so the route renders ABSENT, while
 * `explicitlyProhibited` leaves the control on this screen for another role
 * and the refused role opens it and reads why.
 */
describe('MOD-DOH-09 — the rail and this matrix agree about who reaches the module', () => {
  it('withholds the route from exactly the roles the matrix marks unavailable', () => {
    const withheldByTheMatrix = TENANT_ROLE_ORDER.filter((role) =>
      PERMISSION_MATRIX.some((row) => row.cells[role].outcome === 'unavailable'),
    )
    const withheldByTheSpine = TENANT_ROLE_ORDER.filter(
      (role) => !MODULE.rolesReaching.includes(role),
    )

    expect([...withheldByTheSpine].sort()).toEqual([...withheldByTheMatrix].sort())
    // Not vacuous: the Worker is withheld, and is the only one.
    expect(withheldByTheMatrix).toEqual(['WORKER'])
  })
})

/**
 * THE POINTER THIS SCREEN MAKES AT THE SHARED SEAM REGISTRY.
 *
 * The "Cross-slice position" panel tells the reader this module registers no
 * cross-slice seam of its own. That is a claim about the build, not prose —
 * the component suite already checks the screen renders the sentence, but a
 * rendered sentence is not proof it is still true. This checks it against
 * the registry itself, the same shape MOD-DOH-12 carries for its own
 * (opposite) claim.
 */
describe('the cross-slice claim this screen makes', () => {
  it('really carries no row in the shared seam registry, as the screen says', () => {
    const consumers: readonly string[] = DOH_SEAMS.map((s) => s.consumingModule)
    expect(consumers.filter((c) => c === 'MOD-DOH-09')).toEqual([])
    // Not vacuous: the registry is populated and other slice-4 modules do
    // carry a row — a registry that had lost every row would pass the line
    // above while meaning something entirely different.
    expect(DOH_SEAMS.length).toBeGreaterThan(0)
    expect(consumers).toContain('MOD-DOH-01')
  })
})

/* ==================================================================== *
 * FIX STREAM H, ROUND 3 — THE FOUR HUB MODULE-ROW TENSIONS, GATED.
 *
 * `MTX-TEN-02a` is the tenant-role-to-module matrix in chapter 17's RBAC
 * neighbourhood, and it is THIS module's subject: it is the table that says
 * what each of the five fixed roles holds on each of the nineteen Hub
 * modules. Four of its rows disagree with the module card underneath them
 * about who reaches the module, and every one of those four disclosures is
 * gated here rather than in four places — `MOD-DOH-13` has no unit suite of
 * its own at all, and a gate copied four times is a gate that rots in three
 * of them.
 *
 * WHAT IS ASSERTED, AND WHY IT IS NOT A COMPARISON OF THIS BUILD WITH
 * ITSELF. Every `statements` entry is held to EXACT EQUALITY against the
 * frozen source's own header-keyed cell, read at test time: the column is
 * resolved by NAME off the table's own header line, so reordering a column
 * cannot move a claim, and the text is compared whole, so `Allowed` cannot
 * satisfy an assertion about `Allowed with conditions`. A statement rewritten
 * to the value that would ERASE the disagreement fails here — which is the
 * defect the `MOD-CC-12` readings file records as brief error 33 and the
 * reason its statements carry a column and a header line rather than a line
 * alone.
 *
 * The measured counts are re-derived from the LIVE matrices with the LIVE
 * rule, never read off the record, so a cell edited in either direction reds
 * the disclosure instead of leaving a stale sentence beside it.
 * ==================================================================== */

const TENSION_SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const TENSION_LINES: readonly string[] = readFileSync(TENSION_SOURCE_PATH, 'utf8').split('\n')

const tensionLine = (n: number): string => {
  const line = TENSION_LINES[n - 1]
  if (line === undefined) throw new Error(`frozen source has no line ${n}`)
  return line
}

/**
 * A markdown row split into its cells. BACKTICKS ARE NOT STRIPPED: chapter
 * 22 writes its tokens inside backticks and the module cards do not, so the
 * two dialects are different verbatim texts and folding them would let a
 * statement quote the wrong one.
 */
const tensionCells = (n: number): readonly string[] =>
  tensionLine(n)
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

function tensionColumn(headerLine: number, name: string): number {
  const index = tensionCells(headerLine).indexOf(name)
  if (index < 0) {
    throw new Error(
      `L${headerLine} has no column "${name}"; its header is ` +
        `${JSON.stringify(tensionCells(headerLine))}.`,
    )
  }
  return index
}

interface TensionStatement {
  readonly text: string
  readonly line: number
  readonly column: string | null
  readonly headerLine: number | null
}

/**
 * The one check every statement gets. A statement naming a COLUMN is a claim
 * about one cell and is held to exact equality; a statement with
 * `column: null` is prose and is held to being a substring of its own line.
 * The pair is required to be both-or-neither, because a column with no header
 * line cannot be resolved and a header line with no column names nothing.
 */
function expectStatementVerbatim(where: string, s: TensionStatement): void {
  if (s.column === null) {
    expect(s.headerLine, `${where}: prose statement carries a header line`).toBeNull()
    expect(tensionLine(s.line), `${where}: prose statement is not on L${s.line}`).toContain(s.text)
    return
  }
  expect(s.headerLine, `${where}: cell statement carries no header line`).not.toBeNull()
  const index = tensionColumn(s.headerLine as number, s.column)
  expect(
    tensionCells(s.line)[index],
    `${where}: L${s.line} column "${s.column}" is not what the record quotes`,
  ).toBe(s.text)
}

const HUB_TENSIONS = [
  { where: 'MOD-DOH-08', record: DOH_08_MODULE_ROW_TENSION },
  { where: 'MOD-DOH-09', record: DOH_09_MODULE_ROW_TENSION },
  { where: 'MOD-DOH-13', record: DOH_13_MODULE_ROW_TENSION },
  { where: 'MOD-DOH-15', record: DOH_15_MODULE_ROW_TENSION },
] as const

describe('fix stream H round 3: MTX-TEN-02a against four module cards', () => {
  // FAILS IF: any quoted cell stops being what the frozen source carries at
  // that line and column — the mislocated-locator class, and the
  // rewritten-statement class the CC-12 readings file records.
  // PLANTED: changed MOD-DOH-08's L28301 Tenant Admin statement from
  // '`Unavailable`' to '`Read-only`', the value that would erase the finding.
  // RED: the failure named MOD-DOH-08 and then L28301 column "Tenant Admin"
  // is not what the record quotes — expected '`Unavailable`' to be
  // '`Read-only`'. (Written with words between the identifier and the number
  // on purpose: `locator-fidelity` treats `<ID>: L<n>` as an anchored
  // citation and holds the line to being one the identifier occurs at, which
  // L28301 is not — it is a row of that module's card, not its heading.)
  it.each(HUB_TENSIONS)('$where quotes every statement verbatim', ({ where, record }) => {
    expect(record.statements.length).toBeGreaterThan(0)
    for (const statement of record.statements) expectStatementVerbatim(where, statement)
  })

  // FAILS IF: a record's module row moves, or the header it resolves its
  // columns against stops being MTX-TEN-02a's. The row is identified by the
  // module id in its own first cell, so a row inserted above cannot shift a
  // citation silently.
  // PLANTED: changed MOD-DOH-15's moduleRow.line from 22021 to 22022.
  // RED: expected '`MOD-DOH-16`' to be '`MOD-DOH-15`'
  it.each(HUB_TENSIONS)('$where cites its own MTX-TEN-02a row', ({ where, record }) => {
    expect(record.moduleRow.matrix).toBe('MTX-TEN-02a')
    expect(record.moduleRow.headerLine).toBe(22_005)
    expect(tensionCells(22_005)[0]).toBe('#')
    expect(tensionCells(record.moduleRow.line)[0]).toBe(`\`${where}\``)
    // Not the separator, and not past the end of the body.
    expect(tensionLine(22_006)).toMatch(/^\|-/)
    expect(record.moduleRow.line).toBeGreaterThan(22_006)
  })

  // FAILS IF: a record's `readings` stops being exactly two, or grows a field
  // on which one could be marked the answer. Two is the floor and the ceiling
  // for a disclosure that resolves nothing, and a `decisionRef` on a row the
  // source raises no decision for is a verdict wearing an identifier.
  // PLANTED: changed MOD-DOH-15's `decisionRef` from null to 'DEC-FAKE-001'.
  // RED: expected 'DEC-FAKE-001' to be null
  it.each(HUB_TENSIONS)('$where carries two readings and no verdict', ({ record }) => {
    expect(record.readings.length).toBe(2)
    for (const reading of record.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
      expect(reading.text.length).toBeGreaterThan(80)
      expect(reading.locator).toMatch(/L\d{5}/)
    }
    expect(record.decisionRef).toBeNull()
    expect(record.notResolved.length).toBeGreaterThan(40)
    expect(record.wouldChange.length).toBeGreaterThan(40)
  })

  // FAILS IF: the derived reach the disclosure states stops being the reach
  // the LIVE rule produces from the LIVE matrix. Re-derived here, never read
  // off the generated map — the map is a build artefact and comparing a
  // record against it would compare this build with its own output.
  // PLANTED: changed MOD-DOH-13's derivedReach to add 'SUPERVISOR'.
  // RED: expected [ 'TENANT_ADMIN', 'READONLY_AUDITOR' ] to deeply equal
  // [ 'TENANT_ADMIN', 'READONLY_AUDITOR', 'SUPERVISOR' ]
  it('states the reach the live rule derives, for all four', () => {
    expect([...rolesReachingByMatrix(DOH_08_MATRIX, cellStatus)]).toEqual([
      ...DOH_08_MODULE_ROW_TENSION.derivedReach,
    ])
    expect([...rolesReachingByMatrix(PERMISSION_MATRIX, outcomeCellStatus)]).toEqual([
      ...DOH_09_MODULE_ROW_TENSION.derivedReach,
    ])
    expect([...rolesReachingByMatrix(DOH_13_MATRIX, cellStatus)]).toEqual([
      ...DOH_13_MODULE_ROW_TENSION.derivedReach,
    ])
    expect([...rolesReachingByMatrix(DOH_15_MATRIX, cellStatus)]).toEqual([
      ...DOH_15_MODULE_ROW_TENSION.derivedReach,
    ])
  })

  /**
   * The counts the prose turns on, re-derived. `MOD-DOH-08`'s disclosure says
   * in words that its two granted roles do NOT reach nothing — that they hold
   * four screen rows and one respectively and are withheld by clause two —
   * and that sentence is only worth writing if a cell edit can falsify it.
   */
  // PLANTED, twice: MOD-DOH-08's measured.TENANT_ADMIN.holdsScreenRows from 4
  // to 3, and MOD-DOH-13's reachIsIndependentOfChromeClassification from true
  // to false. The second is planted separately because the chrome-independence
  // claim is measured by re-running the rule rather than by counting, and a
  // count gate cannot cover it.
  // RED: expected 4 to be 3; and expected false to be true
  it('measures the holdings and the withholding cells off the live matrices', () => {
    const HOLDING: readonly ControlStatus[] = ['allowed', 'allowed-with-conditions', 'read-only']
    const tenantRole = (name: string): (typeof TENANT_ROLE_ORDER)[number] => {
      const role = TENANT_ROLE_ORDER.find((r) => r === name)
      if (role === undefined) throw new Error(`"${name}" is not one of the five tenant roles`)
      return role
    }

    for (const [name, claim] of Object.entries(DOH_08_MODULE_ROW_TENSION.measured)) {
      const role = tenantRole(name)
      const column = DOH_08_MATRIX.filter((r) => r.surface === 'screen').map((r) =>
        cellStatus(r, role),
      )
      expect(column.filter((s) => HOLDING.includes(s)).length).toBe(claim.holdsScreenRows)
      expect(column.filter((s) => s === 'unavailable').length).toBe(claim.unavailableScreenRows)
    }

    for (const [name, claim] of Object.entries(DOH_09_MODULE_ROW_TENSION.measured)) {
      const role = tenantRole(name)
      const column = PERMISSION_MATRIX.filter((r) => r.surface === 'screen').map((r) =>
        outcomeCellStatus(r, role),
      )
      expect(column.filter((s) => HOLDING.includes(s)).length).toBe(claim.holdsScreenRows)
      expect(column.filter((s) => s === 'unavailable').length).toBe(claim.unavailableScreenRows)
    }

    const doh13 = DOH_13_MODULE_ROW_TENSION.measured
    expect(DOH_13_MATRIX.filter((r) => r.surface === 'screen').length).toBe(doh13.screenRows)
    for (const name of ['SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      const role = tenantRole(name)
      const claim = doh13[name]
      const screen = DOH_13_MATRIX.filter((r) => r.surface === 'screen').map((r) =>
        cellStatus(r, role),
      )
      const chrome = DOH_13_MATRIX.filter((r) => r.surface === 'chrome').map((r) =>
        cellStatus(r, role),
      )
      expect(screen.filter((s) => HOLDING.includes(s)).length).toBe(claim.holdsScreenRows)
      expect(chrome.filter((s) => HOLDING.includes(s)).length).toBe(claim.holdsChromeRows)
      expect(screen.filter((s) => s === 'unavailable').length).toBe(claim.unavailableScreenRows)
    }

    // MEASURED, NOT ASSERTED: the claim that reclassifying every `chrome` row
    // as `screen` would not move MOD-DOH-13's answer. Run it and compare.
    expect(doh13.reachIsIndependentOfChromeClassification).toBe(true)
    const reclassified = DOH_13_MATRIX.map((row) =>
      row.surface === 'chrome' ? { ...row, surface: 'screen' as const } : row,
    )
    expect([...rolesReachingByMatrix(reclassified, cellStatus)]).toEqual([
      ...DOH_13_MODULE_ROW_TENSION.derivedReach,
    ])
  })
})
