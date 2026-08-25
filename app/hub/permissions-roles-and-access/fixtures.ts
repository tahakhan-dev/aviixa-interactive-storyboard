import { scenarioRunId, tenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import type { AccessContext, AccessRequest } from '@/policy/evaluate'
import type { PermissionOutcome } from '@/policy/decision'
import type { AccessCondition } from '@/surfaces/doh/access-conditions'
import type { DohScope } from '@/surfaces/doh/scope'
import type { WriteAction } from '@/surfaces/doh/tenant-state'
import type { SignInTrack } from '@/surfaces/doh/sso-connection'
import type { ScreenStateId } from '@/ui/screen-state'
import type { TenantRoleId } from '../HubShell'
import type { MatrixRowSurface } from '@/surfaces/doh/modules'
import {
  DOH_AREAS,
  DOH_SITES,
  NODE_FLAG_CONSEQUENCES,
  areaById,
  siteById,
  visibleAreaIds,
  visibleSiteIds,
  type LocationNodeFlag,
} from '../location-configuration/fixtures'

/**
 * MOD-DOH-09 Permissions, Roles and Access — the seeded fixtures this
 * module's screen steps through, pass two (Tenant, Site and Area scope).
 *
 * No backend and no clock: every "as of" value below is a fixture string,
 * never a computed time. Every entry carries the frozen-source line it came
 * from; where the source defines no value, the gap is named in
 * `UNSPECIFIED_IN_SOURCE` rather than guessed.
 *
 * Two wording rules bind this file harder than any other in the slice,
 * because MOD-DOH-09's own matrix is what makes them rules:
 *
 * - `AC-16-12` (L20225) forbids any surface rendering a session-level role
 *   context. Nothing here uses the source's own phrasing for it — the matrix
 *   row is worded "attribute an action to another role", and the reviewer's
 *   view control is the shell's, labelled as a view.
 * - D1 forbids a three-digit screen literal anywhere. Catalogue A's row for
 *   the users screen is referred to by description, never by its number.
 */

/* ------------------------------------------------------------------ *
 * The five fixed tenant roles, in registry order.
 * ------------------------------------------------------------------ */

/**
 * `tests/unit/doh-permissions.test.ts` asserts this equals
 * `rolesInDomain('TENANT')`, so it cannot drift from the registry unnoticed.
 * Declared as a tuple rather than imported as one because the matrix below
 * keys a `Record` on it, and a widened `RoleId[]` would let a console role
 * into a tenant matrix.
 */
export const TENANT_ROLE_ORDER = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly TenantRoleId[]

/**
 * Which role types can approve. **Derived Clarification, not SoW Fact.** The
 * source states the mandatory-role rule twice (L28495, L16859) and makes it
 * testable a third time (`AC-16-41`, L20660) without ever enumerating which
 * role types are approver-capable. A counter cannot be rendered without a
 * set, so this build counts the two operational tenant roles and prints the
 * assumption next to the number. See `UNSPECIFIED_IN_SOURCE`.
 */
export const APPROVER_CAPABLE_ROLES = [
  'QUALITY_MANAGER',
  'SUPERVISOR',
] as const satisfies readonly TenantRoleId[]

/**
 * The check that matters for a SUBSET: `satisfies` already refuses a role
 * that is not a tenant role, and this refuses the other direction — the set
 * widening until it holds every tenant role, at which point "approver-capable"
 * stops distinguishing anybody and the standing counter stops meaning
 * anything. A strict subset has at least one tenant role outside it.
 */
type NonApproverTenantRole = Exclude<TenantRoleId, (typeof APPROVER_CAPABLE_ROLES)[number]>
const _approverRolesAreAStrictSubset: [NonApproverTenantRole] extends [never] ? never : true = true
void _approverRolesAreAStrictSubset

/** The exact sentences the standing panel turns red with. Never paraphrased. */
export const MANDATORY_ROLE_STATEMENTS = {
  tenantAdmin: 'At least one Tenant Admin always exists.',
  approver: 'A tenant must hold an approver role whenever a Job exists.',
} as const

/* ------------------------------------------------------------------ *
 * SCOPE — pass two. Three live dimensions, and three rules about them.
 *
 * THE SITES AND AREAS BELOW ARE NOT SEEDED HERE. They are read from the
 * location configuration module's own fixture, which is the one place the
 * tenant's physical structure is seeded for the whole Hub. A second copy of
 * the hierarchy in this file would be two sources of Site truth, and every
 * node named anywhere in this module resolves through `siteById` / `areaById`
 * so a hand-typed identifier fails a test rather than rendering a fiction.
 * ------------------------------------------------------------------ */

/**
 * One scope, on one grant. The dimension is the spine's, and `nodeId` is the
 * Site or Area it narrows to — `null` at the tenant dimension, because the
 * tenant is not a node in the location tree.
 */
export interface ScopeRef {
  readonly dimension: DohScope
  readonly nodeId: string | null
}

export const TENANT_SCOPE: ScopeRef = { dimension: 'tenant', nodeId: null }

/**
 * A role, and the scope that narrows it. SCOPE LIVES ON THE GRANT and never
 * on the account: `AC-16-02` (L20046) says scopes do not merge across grants,
 * and an account-level scope field is exactly the shape that would merge them
 * — two grants would have one scope between them and the rule would be a
 * sentence rather than a structure. There is nothing here to union.
 */
export interface RoleGrant {
  readonly role: TenantRoleId
  readonly scope: ScopeRef
}

export type ScopeRuleId = 'additive' | 'narrow-only' | 'no-merge'

export interface ScopeRule {
  readonly id: ScopeRuleId
  readonly title: string
  readonly detail: string
  readonly sourceRef: string
}

/** The three facts about scope this pass has to render, not merely obey. */
export const SCOPE_RULES = [
  {
    id: 'additive',
    title: 'Scopes are additive',
    detail:
      'A person may hold several roles at once and the permissions add up: what they may DO is the union of their grants. It is only where they may do it that never adds up — each grant carries its own scope and acts inside it.',
    sourceRef: 'L28495, L17470',
  },
  {
    id: 'narrow-only',
    title: 'A scope narrows a role and never widens it',
    detail:
      'The rule governs the SCOPE control: assigning a scope can only make a grant finer — tenant to Site, Site to an Area under that same Site. The reverse is refused at the write with the rule named, and so is a sideways move to an Area under a different Site, because neither is a narrowing of what the grant already holds. It does not govern the ROLE control beside it: removing a role removes its grant and its scope together, and assigning that role again creates a NEW grant at the widest scope. That sequence is two audited acts, not a scope assignment, and the source settles neither its scope nor whether the old one should return — see the panel naming what the source leaves undefined.',
    sourceRef: 'L17470',
  },
  {
    id: 'no-merge',
    title: 'Scopes do not merge across grants',
    detail:
      'Two grants each carrying a scope do not union into a wider one. A person scoped to one Area under one role and to a different Site under another reaches each only through the grant that carries it; neither grant borrows the other’s reach.',
    sourceRef: 'AC-16-02 L20046',
  },
] as const satisfies readonly ScopeRule[]

type MissingFromScopeRules = Exclude<ScopeRuleId, (typeof SCOPE_RULES)[number]['id']>
const _scopeRulesExhaustive: MissingFromScopeRules extends never ? true : never = true
void _scopeRulesExhaustive

/** The picker value for a scope. One string, so a `Select` can carry it. */
export function scopeKey(scope: ScopeRef): string {
  return scope.nodeId === null ? scope.dimension : `${scope.dimension}:${scope.nodeId}`
}

/**
 * The inverse, as a TYPED FAILURE rather than a throw: an unknown key is a
 * `null` the caller must handle, and the only caller is a `Select`'s
 * `onChange`, which ignores a value it cannot resolve.
 */
export function scopeFromKey(key: string): ScopeRef | null {
  return ASSIGNABLE_SCOPE_TARGETS.find((t) => t.key === key)?.scope ?? null
}

/** Never a bare token in the interface. Resolves the node through its owner. */
export function scopeLabel(scope: ScopeRef): string {
  if (scope.dimension === 'tenant') return 'Tenant — the whole workspace'
  if (scope.nodeId === null) return `${scope.dimension} — no node named, which is a defect`
  if (scope.dimension === 'site') {
    const site = siteById(scope.nodeId)
    return `Site — ${site?.name ?? `${scope.nodeId}, which no longer resolves`}`
  }
  const area = areaById(scope.nodeId)
  const parent = area === undefined ? undefined : siteById(area.siteId)
  return `Area — ${area?.name ?? `${scope.nodeId}, which no longer resolves`}${
    parent === undefined ? '' : `, under ${parent.name}`
  }`
}

/**
 * Whether a scope reaches a location node. DOWNWARDS ONLY: the tenant
 * dimension reaches everything, a Site reaches itself and its own Areas, and
 * an Area reaches itself and nothing above it. An Area that reached its Site
 * would be a widening dressed as a lookup.
 */
export function reaches(scope: ScopeRef, nodeId: string): boolean {
  if (scope.dimension === 'tenant') return true
  if (scope.nodeId === null) return false
  if (scope.nodeId === nodeId) return true
  if (scope.dimension === 'site') return areaById(nodeId)?.siteId === scope.nodeId
  return false
}

export type ScopeChange = 'narrows' | 'unchanged' | 'not-a-narrowing'

/**
 * The narrow-only rule (L17470), as one total function. A change narrows
 * exactly when the scope being assigned names a node the current scope
 * already reaches — which makes widening (Site to tenant), sideways moves
 * (Site to an Area under another Site) and role-swapping all the same answer,
 * and none of them a narrowing.
 */
export function scopeChange(from: ScopeRef, to: ScopeRef): ScopeChange {
  if (scopeKey(from) === scopeKey(to)) return 'unchanged'
  if (to.nodeId !== null && reaches(from, to.nodeId)) return 'narrows'
  return 'not-a-narrowing'
}

/**
 * Every location node this module can name, flattened once. Read from the
 * location configuration module's records — the ONE place Sites and Areas are
 * seeded — so nothing below is a second copy of the hierarchy.
 */
export interface LocationNodeRef {
  readonly id: string
  readonly dimension: 'site' | 'area'
  readonly name: string
  readonly parentName: string | null
}

function buildLocationNodes(): LocationNodeRef[] {
  return [
    ...DOH_SITES.map((s): LocationNodeRef => ({
      id: s.id,
      dimension: 'site',
      name: s.name,
      parentName: null,
    })),
    ...DOH_AREAS.map((a): LocationNodeRef => ({
      id: a.id,
      dimension: 'area',
      name: a.name,
      parentName: siteById(a.siteId)?.name ?? null,
    })),
  ]
}

export const LOCATION_NODES = buildLocationNodes()

export interface ScopeTarget {
  readonly key: string
  readonly label: string
  readonly scope: ScopeRef
}

export interface ScopeTargetExclusion {
  readonly nodeId: string
  readonly label: string
  readonly reason: string
}

/**
 * What a location-node flag DOES, read from the module that owns the flag
 * rather than restated here. The consequence sentence for `scope-pending` is
 * the rule this module obeys when it withholds a Site from the picker, and
 * two copies of it would drift the moment the owner reworded theirs.
 *
 * Total over `LocationNodeFlag` by construction — the owner proves its own
 * list exhaustive — so the throw is an invariant guard, never an expected
 * path, exactly like `matrixRow()` below.
 */
function nodeFlagConsequence(flag: LocationNodeFlag): string {
  const found = NODE_FLAG_CONSEQUENCES.find((c) => c.id === flag)
  if (!found) throw new Error(`No recorded consequence for location node flag: ${flag}`)
  return found.consequence
}

function siteIsAssignable(id: string): boolean {
  const site = siteById(id)
  return site !== undefined && site.state === 'active' && !site.flags.includes('scope-pending')
}

/**
 * ONE walk of the location records, producing both halves at once: what the
 * assignment picker offers, and what it withholds with the reason beside it.
 * Two lists built by one pass cannot disagree about a node, and neither is
 * typed out — a Site added or archived over there changes both over here.
 *
 * A `scope-pending` Site is excluded from the role-assignment pickers until
 * its scope is set (D21). An archived node stays readable and stops being
 * assignable: nobody is newly scoped to a node the tenant has closed.
 */
function buildScopeTargets(): {
  targets: ScopeTarget[]
  excluded: ScopeTargetExclusion[]
} {
  const targets: ScopeTarget[] = [
    { key: 'tenant', label: scopeLabel(TENANT_SCOPE), scope: TENANT_SCOPE },
  ]
  const excluded: ScopeTargetExclusion[] = []
  for (const site of DOH_SITES) {
    if (siteIsAssignable(site.id)) {
      const scope: ScopeRef = { dimension: 'site', nodeId: site.id }
      targets.push({ key: scopeKey(scope), label: scopeLabel(scope), scope })
      continue
    }
    excluded.push({
      nodeId: site.id,
      label: site.name,
      reason:
        site.state === 'archived'
          ? 'Archived. Its history stays readable and every record that referred to it still resolves, but nobody is newly scoped to a node the tenant has closed.'
          : `Scope-pending, and the consequence is the owning module's own: ${nodeFlagConsequence('scope-pending')} (D21).`,
    })
  }
  for (const area of DOH_AREAS) {
    if (area.state === 'active' && siteIsAssignable(area.siteId)) {
      const scope: ScopeRef = { dimension: 'area', nodeId: area.id }
      targets.push({ key: scopeKey(scope), label: scopeLabel(scope), scope })
      continue
    }
    excluded.push({
      nodeId: area.id,
      label: area.name,
      reason:
        area.state === 'archived'
          ? 'Archived with its Site. Still readable, and not assignable — the same rule as the Site above it.'
          : 'Its Site is not assignable, so neither is it: an Area cannot be scoped to while the Site it hangs from is withheld.',
    })
  }
  return { targets, excluded }
}

const SCOPE_TARGET_WALK = buildScopeTargets()

export const ASSIGNABLE_SCOPE_TARGETS = SCOPE_TARGET_WALK.targets

export const SCOPE_TARGET_EXCLUSIONS = SCOPE_TARGET_WALK.excluded

/* ------------------------------------------------------------------ *
 * OBJ-DOH-USER and its three rivals.
 * ------------------------------------------------------------------ */

/** The module card's own state set (L28512). */
export type UserAccountState = 'active' | 'suspended_by_tenant_state' | 'archived'

export const USER_ACCOUNT_STATES = [
  'active',
  'suspended_by_tenant_state',
  'archived',
] as const satisfies readonly UserAccountState[]

type MissingFromUserStates = Exclude<UserAccountState, (typeof USER_ACCOUNT_STATES)[number]>
const _userStatesExhaustive: MissingFromUserStates extends never ? true : never = true
void _userStatesExhaustive

/** The sub-object the card names in the same States field (L28512). */
export type RoleAssignmentState = 'assigned' | 'removed'

export const ROLE_ASSIGNMENT_STATES = [
  'assigned',
  'removed',
] as const satisfies readonly RoleAssignmentState[]

type MissingFromAssignmentStates = Exclude<
  RoleAssignmentState,
  (typeof ROLE_ASSIGNMENT_STATES)[number]
>
const _assignmentStatesExhaustive: MissingFromAssignmentStates extends never ? true : never = true
void _assignmentStatesExhaustive

export interface AccountLifecycleRival {
  readonly label: string
  readonly states: readonly string[]
  readonly sourceRef: string
  readonly adopted: boolean
  readonly note: string
}

/**
 * D21: module identity cards govern object state vocabularies, so the card's
 * three-state set is adopted and the three rivals are recorded rather than
 * discarded. A reader who finds one of them in the source can see here which
 * reading this build took and why.
 */
export const ACCOUNT_LIFECYCLE_RIVALS = [
  {
    label: 'The module card for MOD-DOH-09',
    states: [...USER_ACCOUNT_STATES],
    sourceRef: 'L28512',
    adopted: true,
    note: 'Adopted under D21: the module identity card governs the object state vocabulary. State names are Derived Clarification and renameable; the behaviours behind them are not.',
  },
  {
    label: 'The Chapter 7 object card for the user account',
    states: ['provisioned', 'active', 'disabled'],
    sourceRef: 'L8342, states at L8350',
    adopted: false,
    note: 'A three-state set that shares only "active" with the card. "provisioned" is an onboarding step this module does not model; "disabled" is not "archived".',
  },
  {
    label: 'The section 15.1 account lifecycle',
    states: [
      'Requested',
      'Invited',
      'IdentityVerified',
      'Activated',
      'Active',
      'Suspended',
      'Reactivated',
      'Revoked',
      'Offboarded',
      'EvidenceRetained',
    ],
    sourceRef: 'L18939',
    adopted: false,
    note: 'The fullest lifecycle in the source, and the one that does not match the card at all. It is the invitation and offboarding path; nothing in slice 4 renders those steps.',
  },
  {
    label: 'The Chapter 30 tenant user account',
    states: ['Requested', 'Validating', 'Created', 'Active', 'Dormant', 'Refused'],
    sourceRef: 'L67543',
    adopted: false,
    note: 'A fourth, non-matching vocabulary for the same concept. It is the only one carrying "Dormant", and the source defines no dormancy threshold anywhere.',
  },
] as const satisfies readonly AccountLifecycleRival[]

/** D21 has to ADOPT one of the four. Four rivals and no ruling would be the defect. */
type AdoptedRival = Extract<(typeof ACCOUNT_LIFECYCLE_RIVALS)[number], { adopted: true }>
const _oneLifecycleIsAdopted: [AdoptedRival] extends [never] ? never : true = true
void _oneLifecycleIsAdopted

/* ------------------------------------------------------------------ *
 * The user register. Identity and authority only.
 * ------------------------------------------------------------------ */

/**
 * Slice gate 3 (S10) applies directly to this shape: **no persisted table or
 * fixture may use a worker identifier as a grouping key for a behavioural
 * measure.** This record therefore carries who a person is and what they may
 * do, and carries no count, rate, duration, comparison or last-activity
 * figure of any kind. There is nothing here to rank anybody by, which is the
 * point.
 */
export interface TenantUserFixture {
  readonly id: string
  readonly displayName: string
  readonly workEmail: string
  /**
   * Multi-role is allowed and permissions are additive (L28495) — and each
   * role arrives WITH its own scope, because scopes do not merge across
   * grants (AC-16-02, L20046). There is deliberately no account-level scope
   * field: two grants have no shared scope to widen into.
   */
  readonly grants: readonly RoleGrant[]
  readonly accountState: UserAccountState
  readonly loginTrack: SignInTrack
  /** The managed personal identification number is issued, not shown. */
  readonly managedPinIssued: boolean
  /** Stable identifier the evaluator attributes an action to. */
  readonly actorOfRecord: string
}

/** Two short constructors, so a grant cannot be written without its scope. */
function atTenant(role: TenantRoleId): RoleGrant {
  return { role, scope: TENANT_SCOPE }
}

function atSite(role: TenantRoleId, siteId: string): RoleGrant {
  return { role, scope: { dimension: 'site', nodeId: siteId } }
}

function atArea(role: TenantRoleId, areaId: string): RoleGrant {
  return { role, scope: { dimension: 'area', nodeId: areaId } }
}

const PRIYA: TenantUserFixture = {
  id: 'USR-DOH-0001',
  displayName: 'Priya Raman',
  workEmail: 'priya.raman@northfieldfoods.example',
  grants: [atTenant('TENANT_ADMIN')],
  accountState: 'active',
  loginTrack: 'sso',
  managedPinIssued: false,
  actorOfRecord: 'ACT-DOH-PRIYA',
}

const HELENA: TenantUserFixture = {
  id: 'USR-DOH-0002',
  displayName: 'Helena Vosloo',
  workEmail: 'helena.vosloo@northfieldfoods.example',
  grants: [atTenant('TENANT_ADMIN')],
  accountState: 'active',
  loginTrack: 'sso',
  managedPinIssued: false,
  actorOfRecord: 'ACT-DOH-HELENA',
}

const MARCUS: TenantUserFixture = {
  id: 'USR-DOH-0003',
  displayName: 'Marcus Bell',
  workEmail: 'marcus.bell@northfieldfoods.example',
  // Deliberately still tenant-wide: the narrowing control needs a grant that
  // has somewhere to go, or its live path could never be demonstrated.
  grants: [atTenant('SUPERVISOR')],
  accountState: 'active',
  loginTrack: 'sso',
  managedPinIssued: false,
  actorOfRecord: 'ACT-DOH-MARCUS',
}

const WEN: TenantUserFixture = {
  id: 'USR-DOH-0004',
  displayName: 'Wen Li',
  workEmail: 'wen.li@northfieldfoods.example',
  grants: [atSite('QUALITY_MANAGER', 'SITE-ARD-01')],
  accountState: 'active',
  loginTrack: 'sso',
  managedPinIssued: false,
  actorOfRecord: 'ACT-DOH-WEN',
}

const ROSA: TenantUserFixture = {
  id: 'USR-DOH-0005',
  displayName: 'Rosa Mendez',
  // THE NON-MERGING CASE, and the reason this account is seeded at all.
  // Permissions are additive and the audit trail still names one identity for
  // both (L28495, L17546) — but the two grants' scopes do not add up: the
  // Supervisor grant reaches one Area under one Site, the Quality Manager
  // grant reaches a different Site entirely, and neither borrows the other's
  // reach (AC-16-02, L20046).
  grants: [atArea('SUPERVISOR', 'AREA-ARD-PAINT'), atSite('QUALITY_MANAGER', 'SITE-ARD-02')],
  workEmail: 'rosa.mendez@northfieldfoods.example',
  accountState: 'active',
  loginTrack: 'sso',
  managedPinIssued: false,
  actorOfRecord: 'ACT-DOH-ROSA',
}

const DANA: TenantUserFixture = {
  id: 'USR-DOH-0006',
  displayName: 'Dana Ortiz',
  workEmail: 'dana.ortiz@auditpartners.example',
  grants: [atTenant('READONLY_AUDITOR')],
  accountState: 'active',
  loginTrack: 'managed',
  managedPinIssued: false,
  actorOfRecord: 'ACT-DOH-DANA',
}

const SAM: TenantUserFixture = {
  id: 'USR-DOH-0007',
  displayName: 'Sam Oyelaran',
  workEmail: 'sam.oyelaran@northfieldfoods.example',
  grants: [atArea('WORKER', 'AREA-ARD-ASSY')],
  accountState: 'active',
  loginTrack: 'managed',
  managedPinIssued: true,
  actorOfRecord: 'ACT-DOH-SAM',
}

const TOMAS: TenantUserFixture = {
  id: 'USR-DOH-0008',
  displayName: 'Tomás Iglesias',
  workEmail: 'tomas.iglesias@northfieldfoods.example',
  grants: [atArea('WORKER', 'AREA-ARD-ASSY')],
  accountState: 'suspended_by_tenant_state',
  loginTrack: 'managed',
  managedPinIssued: true,
  actorOfRecord: 'ACT-DOH-TOMAS',
}

/* ------------------------------------------------------------------ *
 * Reading a grant set. Every caller asks these rather than indexing,
 * so "holds the role" and "holds it HERE" stay different questions.
 * ------------------------------------------------------------------ */

export function rolesHeld(user: TenantUserFixture): readonly TenantRoleId[] {
  return user.grants.map((g) => g.role)
}

export function grantFor(user: TenantUserFixture, role: TenantRoleId): RoleGrant | undefined {
  return user.grants.find((g) => g.role === role)
}

export interface MergeProbe {
  readonly reachedBy: RoleGrant
  readonly notReachedBy: RoleGrant
  readonly nodeId: string
  readonly nodeLabel: string
}

/**
 * The non-merging rule, demonstrated on the data rather than asserted in
 * prose: the first location node one grant reaches and another does not. A
 * union across grants would reach it through both, which is precisely what
 * `AC-16-02` refuses. `null` when the account holds one grant, or when its
 * grants happen to reach the same nodes — both stated on screen rather than
 * rendered as a blank.
 */
export function mergeProbe(user: TenantUserFixture): MergeProbe | null {
  for (const reachedBy of user.grants) {
    for (const notReachedBy of user.grants) {
      if (reachedBy.role === notReachedBy.role) continue
      for (const node of LOCATION_NODES) {
        if (reaches(reachedBy.scope, node.id) && !reaches(notReachedBy.scope, node.id)) {
          return { reachedBy, notReachedBy, nodeId: node.id, nodeLabel: node.name }
        }
      }
    }
  }
  return null
}

export type RosterScenarioId = 'seeded' | 'last-tenant-admin' | 'no-approver-holder'

export interface RosterScenario {
  readonly id: RosterScenarioId
  readonly label: string
  readonly users: readonly TenantUserFixture[]
  /**
   * Whether a Job exists in this tenant. A Job is owned by a slice-6 module
   * and no Job record exists in this build, so this is a DECLARED INPUT with
   * its dependency stated, never a Job this module invented.
   */
  readonly jobExists: boolean
  readonly note: string
}

export const ROSTER_SCENARIOS = [
  {
    id: 'seeded',
    label: 'Seeded roster — two Tenant Admins, three approver-capable holders',
    users: [PRIYA, HELENA, MARCUS, WEN, ROSA, DANA, SAM, TOMAS],
    jobExists: true,
    note: 'The ordinary case. Both counters are above zero, so neither warns, and a role removal is available because it would not breach either mandatory-role rule.',
  },
  {
    id: 'last-tenant-admin',
    label: 'One Tenant Admin left — the removal control has nothing to remove',
    users: [PRIYA, MARCUS, WEN, DANA, SAM],
    jobExists: true,
    note: 'Removing this account’s Tenant Admin role would leave none. The control is not drawn at all and the rule is stated permanently in its place (AC-16-39, L20658).',
  },
  {
    id: 'no-approver-holder',
    label: 'No approver-capable holder, while a Job exists',
    users: [PRIYA, HELENA, DANA, SAM],
    jobExists: true,
    note: 'A state the platform refuses to create — the first Job in a tenant with no approver-capable holder is refused (AC-16-41, L20660). It is seeded here anyway, because the counter must never render a nought quietly if the data ever says one.',
  },
] as const satisfies readonly RosterScenario[]

type MissingFromRosters = Exclude<RosterScenarioId, (typeof ROSTER_SCENARIOS)[number]['id']>
const _rostersExhaustive: MissingFromRosters extends never ? true : never = true
void _rostersExhaustive

export interface StandingCounters {
  readonly tenantAdmins: number
  readonly approverCapable: number
  readonly jobExists: boolean
  /** Empty means both counters are above zero. A nought is never silent. */
  readonly warnings: readonly string[]
}

/**
 * The standing panel's two counters (L23918). Neither ever renders a nought
 * without a warning — the warning is produced HERE, next to the count, so no
 * caller can render one without the other.
 */
export function standingCounters(
  users: readonly TenantUserFixture[],
  jobExists: boolean,
): StandingCounters {
  const tenantAdmins = users.filter((u) => rolesHeld(u).includes('TENANT_ADMIN')).length
  const approverCapable = users.filter((u) =>
    // Asked this way round because the declared set is now a narrowed tuple:
    // `APPROVER_CAPABLE_ROLES.includes(anyTenantRole)` no longer type-checks,
    // which is the widening this conversion was for.
    //
    // Counted on the ROLE and not on its scope: the mandatory-role rule asks
    // whether the tenant holds an approver at all, and an approver scoped to
    // one Area is still one. Counting scoped grants out would make the rule
    // stricter than the source states it.
    APPROVER_CAPABLE_ROLES.some((approver) => rolesHeld(u).includes(approver)),
  ).length
  const warnings: string[] = []
  if (tenantAdmins === 0) warnings.push(MANDATORY_ROLE_STATEMENTS.tenantAdmin)
  // Deliberately not conditioned on `jobExists`: a nought here is warned
  // about whichever way the Job question falls, and the sentence carries its
  // own condition. A silent nought is the defect this counter exists to stop.
  if (approverCapable === 0) warnings.push(MANDATORY_ROLE_STATEMENTS.approver)
  return { tenantAdmins, approverCapable, jobExists, warnings }
}

/* ------------------------------------------------------------------ *
 * The twelve-row control matrix (L28520-L28533).
 * ------------------------------------------------------------------ */

export type MatrixRowId =
  | 'create-or-edit-user-account'
  | 'assign-or-remove-role'
  | 'assign-or-remove-scope'
  | 'remove-last-tenant-admin'
  | 'remove-last-approver-capable-role'
  | 'create-custom-role'
  | 'delegate-role-temporarily'
  | 'scope-permission-below-area'
  | 'configure-single-sign-on'
  | 'issue-or-reset-managed-pin'
  | 'view-user-and-role-register'
  | 'attribute-action-to-another-role'

export interface MatrixCell {
  readonly outcome: PermissionOutcome
  /** Never blank: a blank cell is a build-blocking defect (AC-DOC-006, L856). */
  readonly cause: string
}

export interface MatrixRow {
  readonly id: MatrixRowId
  readonly label: string
  /** Where this row's capability is met — read by the shared derivation in
   *  `@/surfaces/doh/modules`. All twelve are this screen's own: the module
   *  owns no banner and hands nothing to a device. Configuring single
   *  sign-on is edited on a SIBLING Hub screen, which is still a screen. */
  readonly surface: MatrixRowSurface
  readonly sourceRef: string
  readonly cells: Readonly<Record<TenantRoleId, MatrixCell>>
  /**
   * Which of the two `Explicitly prohibited` readings this row carries.
   * `categorical` — a rule forbids it for everyone, so it renders ABSENT.
   * `routing` — the control exists on this screen for another role, so the
   * refused role sees it DISABLED with its reason, which is what
   * `FB-QUAL-005` (L64415) asks a disabled control to teach.
   */
  readonly prohibition: 'categorical' | 'routing'
  readonly note: string
}

/** Every non-admin role, refused with the same routing cause. */
function prohibitedForOthers(cause: string): Record<TenantRoleId, MatrixCell> {
  return {
    TENANT_ADMIN: { outcome: 'allowed', cause: 'Allowed.' },
    SUPERVISOR: { outcome: 'explicitlyProhibited', cause },
    QUALITY_MANAGER: { outcome: 'explicitlyProhibited', cause },
    READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause },
    WORKER: { outcome: 'explicitlyProhibited', cause },
  }
}

/** All five refused by the same categorical rule. */
function prohibitedForAll(cause: string): Record<TenantRoleId, MatrixCell> {
  return {
    TENANT_ADMIN: { outcome: 'explicitlyProhibited', cause },
    SUPERVISOR: { outcome: 'explicitlyProhibited', cause },
    QUALITY_MANAGER: { outcome: 'explicitlyProhibited', cause },
    READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause },
    WORKER: { outcome: 'explicitlyProhibited', cause },
  }
}

const AUDITOR_NO_WRITE =
  'Explicitly prohibited — no mutating operation succeeds for the Read-only Auditor on any surface, through any interface, and the attempt is recorded as a security-relevant event (L16997).'

const WORKER_NO_SELF_SERVICE =
  'Explicitly prohibited — self-service role change is a privilege-escalation path, and the source refuses it rather than merely leaving it out (H18, L22027).'

export const PERMISSION_MATRIX = [
  {
    id: 'create-or-edit-user-account',
    surface: 'screen',
    label: 'Create a user account',
    sourceRef: 'L28522',
    prohibition: 'routing',
    cells: {
      TENANT_ADMIN: {
        outcome: 'allowedWithConditions',
        cause:
          'Allowed with conditions — blocked in every suspension state, because creating or editing an account is a configuration edit (L28522, L26919).',
      },
      SUPERVISOR: {
        outcome: 'explicitlyProhibited',
        cause:
          'Explicitly prohibited — creating a tenant user account belongs to the Tenant Admin alone (L28522).',
      },
      QUALITY_MANAGER: {
        outcome: 'explicitlyProhibited',
        cause:
          'Explicitly prohibited — creating a tenant user account belongs to the Tenant Admin alone (L28522).',
      },
      READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause: AUDITOR_NO_WRITE },
      WORKER: { outcome: 'explicitlyProhibited', cause: WORKER_NO_SELF_SERVICE },
    },
    note: 'The only control anywhere in the Hub that creates a tenant user account. Every other module that shows a person shows one this control made.',
  },
  {
    id: 'assign-or-remove-role',
    surface: 'screen',
    label: 'Assign or remove a role',
    sourceRef: 'L28523',
    prohibition: 'routing',
    cells: {
      TENANT_ADMIN: {
        outcome: 'allowedWithConditions',
        cause:
          'Allowed with conditions — the two mandatory-role rules are enforced at the moment of removal, which is the only moment they can be violated (L28495, L28523).',
      },
      SUPERVISOR: {
        outcome: 'explicitlyProhibited',
        cause: 'Explicitly prohibited — role assignment belongs to the Tenant Admin alone (L28523).',
      },
      QUALITY_MANAGER: {
        outcome: 'explicitlyProhibited',
        cause: 'Explicitly prohibited — role assignment belongs to the Tenant Admin alone (L28523).',
      },
      READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause: AUDITOR_NO_WRITE },
      WORKER: { outcome: 'explicitlyProhibited', cause: WORKER_NO_SELF_SERVICE },
    },
    note: 'Permissions become additive immediately on the web surfaces and reach devices at the next sync (WF-WKR-004, L52892).',
  },
  {
    id: 'assign-or-remove-scope',
    surface: 'screen',
    label: 'Assign or remove a scope',
    sourceRef: 'L28524',
    prohibition: 'routing',
    cells: prohibitedForOthers(
      'Explicitly prohibited — scope assignment belongs to the Tenant Admin alone (L28524).',
    ),
    note: 'Three live dimensions: tenant, Site and Area. The Sites and Areas offered are read from the location configuration module’s own records, so this module seeds no second copy of the hierarchy, and an assignment may only ever narrow the grant it acts on.',
  },
  {
    id: 'remove-last-tenant-admin',
    surface: 'screen',
    label: 'Remove the last Tenant Admin',
    sourceRef: 'L28525, AC-16-39 L20658',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — refused with the rule named, and no override exists on any surface, including within support sessions (AC-16-39, L20658).',
    ),
    note: 'The most privileged tenant role cannot do this either. No control is drawn where it would sit; the rule is stated there instead.',
  },
  {
    id: 'remove-last-approver-capable-role',
    surface: 'screen',
    label: 'Remove the last approver-capable role while a Job exists',
    sourceRef: 'L28526, L16859',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — removal of the last approver-capable role while Jobs exist is refused (L16859, L28526).',
    ),
    note: 'The paired rule to the last-Tenant-Admin one, and the reason the standing panel carries two counters rather than one.',
  },
  {
    id: 'create-custom-role',
    surface: 'screen',
    label: 'Create a custom role',
    sourceRef: 'L28527, L17662',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — the platform exposes no create-role, edit-role or clone-role control on any surface at V1 (L17662).',
    ),
    note: 'Absent, not disabled: a disabled control would imply a roadmap promise the source has not made (L23918). The role picker carries a static footnote instead.',
  },
  {
    id: 'delegate-role-temporarily',
    surface: 'screen',
    label: 'Delegate a role temporarily',
    sourceRef: 'L28528',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — delegation is deferred beyond V1, and the cover the source names is manual add and remove (L28495, L28528).',
    ),
    note: 'DEC-DELEG-001 (L17920) is open and pulls the other way: one part of the source defers delegation while another describes an authoring delegation. Nothing is built while it is open.',
  },
  {
    id: 'scope-permission-below-area',
    surface: 'screen',
    label: 'Scope a permission to a Location, a Job or a worker',
    sourceRef: 'L28529, L14515',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — Cell, Job and worker scoping are deferred beyond V1 and no rule may depend on them (L14515, L28529).',
    ),
    note: 'Absent by construction: the three deferred dimensions are held OUTSIDE the live scope type in the spine, so no picker can offer one by accident.',
  },
  {
    id: 'configure-single-sign-on',
    surface: 'screen',
    label: 'Configure single sign-on',
    sourceRef: 'L28530',
    prohibition: 'routing',
    cells: prohibitedForOthers(
      'Explicitly prohibited — the connection record is Tenant Admin configuration (L28530).',
    ),
    note: 'Two module cards claim this same action. This module renders the sign-in tracks it produces; the integration surface owns the settings screen that edits it. See the conflicts panel.',
  },
  {
    id: 'issue-or-reset-managed-pin',
    surface: 'screen',
    label: 'Issue or reset a managed personal identification number',
    sourceRef: 'L28531',
    prohibition: 'routing',
    cells: {
      TENANT_ADMIN: { outcome: 'allowed', cause: 'Allowed.' },
      SUPERVISOR: {
        outcome: 'allowedWithConditions',
        cause:
          'Allowed with conditions — own scope, and for workers only (L28531). The one row in this module where a role other than the Tenant Admin writes.',
      },
      QUALITY_MANAGER: {
        outcome: 'explicitlyProhibited',
        cause:
          'Explicitly prohibited — the credential path is administration, not quality (L28531).',
      },
      READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause: AUDITOR_NO_WRITE },
      WORKER: { outcome: 'explicitlyProhibited', cause: WORKER_NO_SELF_SERVICE },
    },
    note: 'The login is the credential, not the device: identity and attribution travel with the person onto any conformant device, and a shared tablet confers nothing by itself (L16321).',
  },
  {
    id: 'view-user-and-role-register',
    surface: 'screen',
    label: 'View the user and role register',
    sourceRef: 'L28532',
    prohibition: 'routing',
    cells: {
      TENANT_ADMIN: { outcome: 'allowed', cause: 'Allowed.' },
      SUPERVISOR: {
        outcome: 'readOnly',
        cause:
          'Read-only, own scope — the cause is the role itself: the Supervisor reads the register and holds no write on it (L28532).',
      },
      QUALITY_MANAGER: {
        outcome: 'readOnly',
        cause:
          'Read-only, own scope — the cause is the role itself: the Quality Manager reads the register and holds no write on it (L28532).',
      },
      READONLY_AUDITOR: {
        outcome: 'readOnly',
        cause:
          'Read-only, tenant-wide — the cause is the role itself: the Auditor checks what happened and changes nothing, anywhere (L28532, L16997).',
      },
      WORKER: {
        outcome: 'unavailable',
        cause:
          'Unavailable — the Worker cannot hold this in any scope. Unavailable is not the same status as Explicitly prohibited and the two are never merged (L28532, L10238).',
      },
    },
    note: 'Read-only is never shown as the bare words: the cause is named in every one of the three cells that carry it (L48013).',
  },
  {
    id: 'attribute-action-to-another-role',
    surface: 'screen',
    // Deliberately NOT the source's own phrasing. AC-16-12 is what this row
    // enforces, and shipping its literal wording would put the very phrase
    // the gate greps for into the rendered document.
    label: 'Attribute an action to another role in the audit trail',
    sourceRef: 'L28533, AC-16-12 L20225',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — every audit entry names the identity that performed the action, and no audit entry carries a role-substitution field (L17546, L28533).',
    ),
    note: 'No surface renders a session-level role context of any kind. The view control on this storyboard is the reviewer’s, it changes only which seeded fixtures render, and it alters no audit actor.',
  },
] as const satisfies readonly MatrixRow[]

/** Every declared row id is on the matrix. A missing row would otherwise only
 *  surface as a thrown `matrixRow()` at render time. */
type MissingFromMatrix = Exclude<MatrixRowId, (typeof PERMISSION_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/* ------------------------------------------------------------------ *
 * The rendering rule. Applied by rule, never by taste.
 * ------------------------------------------------------------------ */

export type ControlRendering = 'control' | 'disabled-with-reason' | 'read-only' | 'absent'

export function renderingFor(row: MatrixRow, role: TenantRoleId): ControlRendering {
  const outcome = row.cells[role].outcome
  switch (outcome) {
    case 'allowed':
    case 'allowedWithConditions':
      return 'control'
    case 'readOnly':
    case 'cachedReadOnlyOffline':
      return 'read-only'
    case 'explicitlyProhibited':
      return row.prohibition === 'categorical' ? 'absent' : 'disabled-with-reason'
    case 'unavailable':
    case 'notApplicable':
      return 'absent'
    case 'clientDecisionRequired':
    case 'queuedOffline':
      // Neither appears in this module's matrix. A cell that ever carried one
      // would render disabled with its decision identifier named, never
      // silently absent (AC-RBAC-602, L23110).
      return 'disabled-with-reason'
    default: {
      const exhaustive: never = outcome
      throw new Error(`Unhandled permission outcome: ${String(exhaustive)}`)
    }
  }
}

export function matrixRow(id: MatrixRowId): MatrixRow {
  const found = PERMISSION_MATRIX.find((r) => r.id === id)
  if (!found) throw new Error(`Unknown MOD-DOH-09 matrix row: ${id}`)
  return found
}

/* ------------------------------------------------------------------ *
 * Controls that do not exist here.
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
}

const EXTRA_ABSENT_CONTROLS: readonly AbsentControl[] = [
  {
    label: 'A control that reaches another tenant, or the platform console',
    note: 'No tenant role reaches another tenant or the Super Admin platform console under any configuration, including multi-role assignment (L17287, AC-RBAC-004 L20784). Nothing is drawn where such a control would sit.',
  },
  {
    label: 'A control that makes a tenant setting looser than the platform floor',
    note: 'A tenant configures itself stricter than a default and never looser; the registry refuses a looser value at the write, with the bound stated (L17285, L20841).',
  },
  {
    label: 'A control that edits or deletes audit history',
    note: 'No tenant role alters or deletes evidence or audit history (L17286). This module writes audit entries and reads none of them back for editing.',
  },
]

/**
 * Built from the matrix rather than typed twice, so a row that becomes
 * categorical automatically appears here and a row that stops being
 * categorical automatically leaves.
 */
export const ABSENT_CONTROLS = [
  ...PERMISSION_MATRIX.filter((r) => r.prohibition === 'categorical').map((r) => ({
    label: r.label,
    note: `${r.cells.TENANT_ADMIN.cause} ${r.note}`,
  })),
  ...EXTRA_ABSENT_CONTROLS,
] as const satisfies readonly AbsentControl[]

/* ------------------------------------------------------------------ *
 * The access-resolution boot order (spec S8, L25667).
 * ------------------------------------------------------------------ */

export type SignInStageId =
  | 'unauthenticated'
  | 'track'
  | 'scope-resolved'
  | 'tenant-state-applied'
  | 'hub-rendered'

export interface SignInStage {
  readonly id: SignInStageId
  readonly name: string
  readonly detail: string
}

export const SIGN_IN_STAGES = [
  {
    id: 'unauthenticated',
    name: 'Unauthenticated',
    detail:
      'Nobody is resolved yet. The address screen asks for a work email and resolves its domain against the connection record; it verifies nothing and reaches nowhere.',
  },
  {
    id: 'track',
    // Named for the STEP, not for the two outcomes. The screen renders which
    // of the two tracks an address resolved onto as a RESULT below this list;
    // spelling both outcomes in the stage name would put the same sentence on
    // screen twice and let a reader mistake the standing sequence for an
    // answer about the address they just typed.
    name: 'Track resolved',
    detail:
      'Exactly two tracks. A domain that matches a configured connection takes the federated track; every other address takes the platform-held credential path, which exists for staff with no identity provider (L95827-L95832).',
  },
  {
    id: 'scope-resolved',
    name: 'Scope resolved',
    detail:
      'The identity’s scope set is read, one scope per grant: tenant, a Site, or an Area under a Site. It is read here, before anything renders, and it narrows what the resolved permissions can act on rather than adding to them.',
  },
  {
    id: 'tenant-state-applied',
    name: 'Tenant state applied',
    detail:
      'The tenant state gate is read BEFORE any write control renders (L27002). It is one data table, and every write control on this screen asks it the same question.',
  },
  {
    id: 'hub-rendered',
    name: 'Hub rendered',
    detail:
      'Only now does a screen appear, with the resolved permission set governing every control on it. Nothing renders first and asks permission afterwards.',
  },
] as const satisfies readonly SignInStage[]

type MissingFromStages = Exclude<SignInStageId, (typeof SIGN_IN_STAGES)[number]['id']>
const _stagesExhaustive: MissingFromStages extends never ? true : never = true
void _stagesExhaustive

/* ------------------------------------------------------------------ *
 * The screen states this module actually has.
 * ------------------------------------------------------------------ */

/**
 * `as const satisfies` rather than a leading `readonly ScreenStateId[]`
 * annotation, because the screen derives its own `screenState` prop type from
 * this array: a widened annotation would let a caller ask for one of the four
 * states this module has already ruled inapplicable, and `STATE-07` would
 * then reach the screen-state boundary and throw at render.
 */
export const DOH09_APPLICABLE_STATES = [
  'STATE-01',
  'STATE-02',
  'STATE-03',
  'STATE-04',
  'STATE-05',
  'STATE-06',
  'STATE-08',
  'STATE-12',
  'STATE-13',
] as const satisfies readonly ScreenStateId[]

/** The nine states this module actually reaches, as a type. */
export type Doh09StateId = (typeof DOH09_APPLICABLE_STATES)[number]

export interface InapplicableState {
  readonly id: ScreenStateId
  readonly reason: string
}

export const DOH09_INAPPLICABLE_STATES = [
  {
    id: 'STATE-07',
    reason:
      'Offline is frontline-only. The Hub is a web surface with no offline mode; loss of connection resolves into the stale, failure and recovery states instead (D7).',
  },
  {
    id: 'STATE-09',
    reason:
      'Queued has nothing to render here. Nothing on this surface ever queues a write — every write control disables rather than queues, because a queued clearance would be a safety control with no audit entry (L27568) — and this module carries no device command.',
  },
  {
    id: 'STATE-10',
    reason:
      'No agent contributes to any decision in this module. There is nothing to degrade.',
  },
  {
    id: 'STATE-11',
    reason:
      'For the same reason: with every agent unavailable this module is unchanged and fully operable, because permission resolution is deterministic.',
  },
] as const satisfies readonly InapplicableState[]

/**
 * The two lists are complements, proved rather than trusted: every state this
 * module does NOT reach carries a stated reason here. Drop a state from
 * `DOH09_APPLICABLE_STATES` without writing its reason and this fails to
 * compile, which is the only moment anybody would notice.
 */
type UnreasonedInapplicableState = Exclude<
  Exclude<ScreenStateId, Doh09StateId>,
  (typeof DOH09_INAPPLICABLE_STATES)[number]['id']
>
const _inapplicableStatesExhaustive: UnreasonedInapplicableState extends never ? true : never = true
void _inapplicableStatesExhaustive

/* ------------------------------------------------------------------ *
 * The seeded domain state and the identity the evaluator is handed.
 * ------------------------------------------------------------------ */

const FIXTURE_TENANT = tenantId('TEN-DOH-NORTHFIELD')

/**
 * The tenant partition stays ACTIVE on purpose. The Hub's tenant-state gate
 * is the write-class table, which is a per-write-class answer; the
 * evaluator's own suspension stage is a blunt whole-tenant refusal that would
 * also refuse the reads a soft suspension explicitly keeps open. Routing
 * suspension through the partition would therefore make this screen lie about
 * what a soft-suspended tenant can still do. The gate is applied where the
 * source puts it: `writeAllowed`, once, before any write control renders.
 */
const SEEDED_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('DOH-09-PERMISSIONS-ROLES-AND-ACCESS')),
  FIXTURE_TENANT,
  (partition) => ({
    ...partition,
    displayName: 'Northfield Foods',
    lifecycleState: 'ACTIVE',
    tier: 'standard',
  }),
)

const FIXTURE_STATE: ScenarioDomainState = {
  ...SEEDED_STATE,
  platform: {
    ...SEEDED_STATE.platform,
    tiers: {
      // The seeded tier carries user administration and nothing beyond it, so
      // the entitlement refusal below is a real lookup miss rather than a
      // hand-written denial.
      standard: { entitlements: ['tenant-user-administration'] },
    },
  },
}

export function fixtureState(): ScenarioDomainState {
  return FIXTURE_STATE
}

export interface FixtureContextOptions {
  readonly online: boolean
  readonly deviceTrusted: boolean
  readonly actorOfRecord: string | null
}

export const DEFAULT_CONTEXT: FixtureContextOptions = {
  online: true,
  deviceTrusted: true,
  actorOfRecord: 'ACT-DOH-VIEWER',
}

/**
 * The evaluator context for one seeded persona. PASS TWO: the scope arrays
 * are no longer empty. They are read from the location configuration module's
 * own seeded role scopes, so the evaluator's scope stage has something real to
 * intersect against and a narrowed persona is refused by the evaluator rather
 * than by a conditional written here.
 */
export function fixtureContext(
  role: TenantRoleId,
  options: FixtureContextOptions = DEFAULT_CONTEXT,
): AccessContext {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role,
      tenant: FIXTURE_TENANT,
      siteScope: visibleSiteIds(role),
      areaScope: visibleAreaIds(role),
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: options.online,
    deviceTrusted: options.deviceTrusted,
    actorOfRecord: options.actorOfRecord,
  }
}

/* ------------------------------------------------------------------ *
 * SCR-DOH-ROLE-04 — the seeded refusals, one per access condition.
 * ------------------------------------------------------------------ */

/**
 * The ten seeded refusals, as a closed set. Narrow rather than `string`
 * because `refusalScenario()` below THROWS on an unknown id: with a `string`
 * parameter a perfectly well-typed caller reaches that throw, which the
 * global constraint forbids (typed failures, never a thrown exception on an
 * expected path). `RosterScenarioId` above is the same pattern.
 */
export type RefusalScenarioId =
  | 'role-permission'
  | 'assigned-scope'
  | 'tenant-entitlement'
  | 'object-state'
  | 'qualification'
  | 'active-grant'
  | 'device-and-connectivity'
  | 'segregation-of-duties'
  | 'safety-controls'
  | 'unevaluable-rule'

export interface RefusalScenario extends FixtureContextOptions {
  readonly id: RefusalScenarioId
  /** Which of the nine intersecting conditions this scenario exercises. */
  readonly condition: AccessCondition
  readonly label: string
  /**
   * What the refusal says, in this module's own words. Deliberately not the
   * shared reason-code explanation: the scope refusal in particular must not
   * confirm or deny that anything sits on the other side of the boundary
   * (L14267).
   */
  readonly narrative: string
  /** Who can change the condition that refused. Required by L14267. */
  readonly whoCanChangeIt: string
  readonly request: AccessRequest
}

const ALL_TENANT_ROLES = [...TENANT_ROLE_ORDER]

export const REFUSAL_SCENARIOS = [
  {
    id: 'role-permission',
    condition: 'role-permission',
    label: 'Creating a user account',
    narrative:
      'The action is carried by one role type and this identity does not hold it. The refusal names the role that does, so the reader knows who to ask rather than guessing.',
    whoCanChangeIt:
      'A Tenant Admin, by assigning the role. Nobody can grant it to themselves, and no self-service path exists.',
    request: {
      action: 'MOD-DOH-09:create-user-account',
      allowedRoles: ['TENANT_ADMIN'],
      sourceRefs: ['L28522', 'AC-RBAC-005 L20785'],
    },
    ...DEFAULT_CONTEXT,
  },
  {
    id: 'assigned-scope',
    condition: 'assigned-scope',
    label: 'Reading a user record outside the assigned scope',
    narrative:
      'The request named a Site outside the scope this identity was assigned. That is the whole of what the refusal says: it does not report what sits on the other side of the boundary, because a refusal never reveals anything outside the caller’s scope (L14267).',
    whoCanChangeIt:
      'A Tenant Admin, by assigning scope. A scope narrows a role and never widens it, and scopes do not merge across grants (L17470, AC-16-02 L20046).',
    request: {
      action: 'MOD-DOH-09:read-user-record',
      allowedRoles: ALL_TENANT_ROLES,
      requiredSites: ['SITE-OUTSIDE-THIS-IDENTITY'],
      sourceRefs: ['L14267', 'L17470', 'AC-16-02 L20046'],
    },
    ...DEFAULT_CONTEXT,
  },
  {
    id: 'tenant-entitlement',
    condition: 'tenant-entitlement',
    label: 'Using a capability the tier does not carry',
    narrative:
      'The tenant’s current tier does not include this capability, so no role reaches it. This is not a permission the tenant can grant itself.',
    whoCanChangeIt:
      'Nobody inside the tenant. The tier is a platform decision, and a tier change is requested through platform support rather than switched on here.',
    request: {
      action: 'MOD-DOH-09:delegated-role-administration',
      allowedRoles: ALL_TENANT_ROLES,
      requiredEntitlement: 'delegated-role-administration',
      sourceRefs: ['L28511', 'L26547'],
    },
    ...DEFAULT_CONTEXT,
  },
  {
    id: 'object-state',
    condition: 'object-state',
    label: 'Editing an archived account',
    narrative:
      'The account is archived, and an archived record is not in a state where an edit means anything. Nothing on this platform is purged, so the record is still readable — it is simply closed.',
    whoCanChangeIt:
      'Nobody, while the record stays archived. The account state is the gate, not the role.',
    request: {
      action: 'MOD-DOH-09:edit-user-account',
      allowedRoles: ALL_TENANT_ROLES,
      allowedObjectStates: ['active'],
      objectState: 'archived',
      sourceRefs: ['L28512'],
    },
    ...DEFAULT_CONTEXT,
  },
  {
    id: 'qualification',
    condition: 'qualification',
    label: 'An action gated on a current qualification',
    narrative:
      'The identity does not hold a current qualification this action requires. The qualification record itself belongs to another module of this slice; this module reads the gate and never edits the record.',
    whoCanChangeIt:
      'Whoever records a recertification against the person’s qualification record. It is not changed from this screen.',
    request: {
      action: 'MOD-DOH-09:qualification-gated-action',
      allowedRoles: ALL_TENANT_ROLES,
      requiredQualifications: ['QUAL-FOOD-SAFETY-L2'],
      sourceRefs: ['L14512'],
    },
    ...DEFAULT_CONTEXT,
  },
  {
    id: 'active-grant',
    condition: 'active-grant',
    label: 'An action that needs a named temporary grant',
    narrative:
      'The action requires a named grant this identity does not currently hold. A grant is additive and time-bounded and may never create authority the role does not already contain (L17470).',
    whoCanChangeIt:
      'Nobody, while temporary delegation is deferred beyond V1 — the cover the source names is manual add and remove of the role itself.',
    request: {
      action: 'MOD-DOH-09:grant-scoped-action',
      allowedRoles: ALL_TENANT_ROLES,
      requiredTemporaryGrant: 'GRANT-DOH-AUTHORING',
      sourceRefs: ['L17470', 'L112633'],
    },
    ...DEFAULT_CONTEXT,
  },
  {
    id: 'device-and-connectivity',
    condition: 'device-and-connectivity',
    label: 'An action from a device the tenant does not currently trust',
    narrative:
      'The device state refuses this one, not the role. Cached device permissions are honoured only within the offline credential-trust window and are graded down after it (AC-16-42, L20661).',
    whoCanChangeIt:
      'Whoever administers the device record. Nothing on this screen changes a device’s trust state.',
    request: {
      action: 'MOD-DOH-09:action-from-device',
      allowedRoles: ALL_TENANT_ROLES,
      requiresTrustedDevice: true,
      sourceRefs: ['AC-16-42 L20661'],
    },
    online: true,
    deviceTrusted: false,
    actorOfRecord: DEFAULT_CONTEXT.actorOfRecord,
  },
  {
    id: 'segregation-of-duties',
    condition: 'segregation-of-duties',
    label: 'Approving a change this same identity made',
    narrative:
      'The same person cannot both make and approve this change. The refusal is recorded against the identity, not swallowed.',
    whoCanChangeIt:
      'A different, identified authorised person. The platform never approves on anybody’s behalf.',
    request: {
      action: 'MOD-DOH-09:approve-own-change',
      allowedRoles: ALL_TENANT_ROLES,
      makerCheckerOf: 'ACT-DOH-VIEWER',
      sourceRefs: ['L14512', 'L20785'],
    },
    ...DEFAULT_CONTEXT,
  },
  {
    id: 'safety-controls',
    condition: 'safety-controls',
    label: 'Removing the last Tenant Admin',
    narrative:
      'A platform-fixed prohibition refuses this regardless of held roles, grants, scopes, tier or account (AC-16-03, L20047). This is what safety-controls-win means in practice: it beats every allow above it, including the most privileged role in the tenant, and there is no override on any surface — including within a support session.',
    whoCanChangeIt:
      'Nobody, on any surface. Assign the role to a second person first; then this stops being the last one.',
    request: {
      action: 'MOD-DOH-09:remove-last-tenant-admin',
      // Every role is on the allow-list, so nothing but the safety control
      // refuses this. Delete `safetyControl` and the request is ALLOWED —
      // which is what makes the safety stage the thing under test here
      // rather than a role rule quietly doing the work.
      allowedRoles: ALL_TENANT_ROLES,
      // Previously `deniedRoles: ALL_TENANT_ROLES`, which refused correctly
      // and reported EXPLICIT_DENY at BASE_ROLE — the role-permission
      // condition, and the wrong one of the source's two precedence rules.
      // L14532 requires such a request be "refused immediately and recorded
      // as a safety refusal".
      safetyControl:
        'Removing the last Tenant Admin is refused by a platform-fixed safety control. It is not a role rule, and no surface, role or support session reaches past it.',
      sourceRefs: ['AC-16-03 L20047', 'AC-16-39 L20658'],
    },
    ...DEFAULT_CONTEXT,
  },
  {
    id: 'unevaluable-rule',
    condition: 'object-state',
    label: 'A rule that could not be evaluated at all',
    narrative:
      'The account’s state could not be read, so the rule that depends on it could not be evaluated. An absolute rule that cannot be evaluated is treated as violated, and an undefined permission is a refusal and never a grant (L14476, AC-DOH-09-9 L28623). Failing open here would be the worst defect this module could ship.',
    whoCanChangeIt:
      'Nobody, until the record can be read again. The answer is a refusal until then, not a guess.',
    request: {
      action: 'MOD-DOH-09:edit-user-account-unreadable',
      allowedRoles: ALL_TENANT_ROLES,
      // A declared constraint with nothing to check it against. The evaluator
      // fails closed rather than treating the missing value as no constraint.
      allowedObjectStates: ['active'],
      sourceRefs: ['L14476', 'AC-DOH-09-9 L28623'],
    },
    ...DEFAULT_CONTEXT,
  },
] as const satisfies readonly RefusalScenario[]

type MissingFromRefusals = Exclude<RefusalScenarioId, (typeof REFUSAL_SCENARIOS)[number]['id']>
const _refusalsExhaustive: MissingFromRefusals extends never ? true : never = true
void _refusalsExhaustive

/**
 * Total over `RefusalScenarioId` by construction — the exhaustiveness check
 * above is what makes the throw unreachable rather than merely unlikely, and
 * it is kept as an invariant guard, not as an expected path.
 */
export function refusalScenario(id: RefusalScenarioId): RefusalScenario {
  const found = REFUSAL_SCENARIOS.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown MOD-DOH-09 refusal scenario: ${id}`)
  return found
}

/**
 * How the source's nine conditions land on the evaluator's ordered stages.
 * The two do not correspond one-to-one, and pretending they do would be the
 * quiet kind of wrong: the reader is shown both columns and the two places
 * they diverge.
 */
export interface ConditionMapping {
  readonly condition: AccessCondition
  readonly name: string
  readonly carriedBy: string
  readonly whoCanChangeIt: string
}

export const CONDITION_MAPPINGS = [
  {
    condition: 'role-permission',
    name: 'Role permission',
    carriedBy: 'Base-role stage, where an explicit deny beats an allow.',
    whoCanChangeIt: 'A Tenant Admin, by assigning a role.',
  },
  {
    condition: 'assigned-scope',
    name: 'Assigned scope',
    carriedBy: 'Scope-intersection stage, over Site, Area, shift and object scope together.',
    whoCanChangeIt: 'A Tenant Admin, by assigning scope. Scope narrows; it never widens.',
  },
  {
    condition: 'tenant-entitlement',
    name: 'Tenant entitlement',
    carriedBy: 'Feature, entitlement and suspension stage.',
    whoCanChangeIt: 'Nobody inside the tenant — the tier is a platform decision.',
  },
  {
    condition: 'object-state',
    name: 'Object state',
    carriedBy: 'Object lifecycle and version stage.',
    whoCanChangeIt: 'Whoever can move the record to a state where the action makes sense.',
  },
  {
    condition: 'qualification',
    name: 'Qualification',
    carriedBy: 'Worker qualification stage.',
    whoCanChangeIt: 'Whoever records a recertification against the qualification record.',
  },
  {
    condition: 'active-grant',
    name: 'Active grant',
    carriedBy:
      'The scope stage, as a named temporary grant — the evaluator has no separate grant stage, and this is the first of the two places the two lists diverge.',
    whoCanChangeIt: 'Nobody while temporary delegation is deferred beyond V1.',
  },
  {
    condition: 'device-and-connectivity',
    name: 'Device and connectivity state',
    carriedBy: 'Device trust, connectivity and package stage.',
    whoCanChangeIt: 'Whoever administers the device record, or the connection itself.',
  },
  {
    condition: 'segregation-of-duties',
    name: 'Segregation of duties',
    carriedBy: 'Maker-checker and approver-availability stage.',
    whoCanChangeIt: 'A different, identified authorised person.',
  },
  {
    condition: 'safety-controls',
    name: 'Safety controls',
    carriedBy:
      'The safety stage, which the evaluator runs before every other condition. It is ninth in the source’s definition list and first in the source’s numbered workflow, and both are true — the second place the two lists diverge.',
    whoCanChangeIt: 'Nobody, on any surface.',
  },
] as const satisfies readonly ConditionMapping[]

/**
 * The check this one actually needed. Nine written mappings prove nothing on
 * their own: `conditionMapping()` in the screen throws when a condition has
 * no row, so a condition added to the spine used to surface as a render-time
 * exception on `SCR-DOH-ROLE-04`. It is now a compile error here instead.
 */
type UnmappedAccessCondition = Exclude<
  AccessCondition,
  (typeof CONDITION_MAPPINGS)[number]['condition']
>
const _conditionMappingsExhaustive: UnmappedAccessCondition extends never ? true : never = true
void _conditionMappingsExhaustive

/* ------------------------------------------------------------------ *
 * SCR-DOH-ROLE-05 — the seven fixed role-definition-card blocks (L15214).
 * ------------------------------------------------------------------ */

export const ROLE_CARD_BLOCK_NAMES = [
  'Identity',
  'Reach',
  'Visibility',
  'Rights',
  'Prohibition',
  'Governance',
  'Traceability',
] as const

export type RoleCardBlockName = (typeof ROLE_CARD_BLOCK_NAMES)[number]

/** The three blocks that genuinely differ role by role. */
interface RoleCardCopy {
  readonly visibility: string
  readonly rights: string
  readonly prohibition: string
}

export const ROLE_CARD_COPY: Readonly<Record<TenantRoleId, RoleCardCopy>> = {
  TENANT_ADMIN: {
    visibility:
      'The whole tenant: every user, every role assignment and every scope assignment in the workspace.',
    rights:
      'Creates user accounts, assigns and removes roles, assigns and removes scope, configures single sign-on, and issues or resets a managed personal identification number.',
    prohibition:
      'Cannot remove the last Tenant Admin, cannot remove the last approver-capable role while a Job exists, cannot create a custom role, cannot delegate a role temporarily, and cannot scope a permission below Area. The most privileged tenant role is inside these rules, not above them.',
  },
  SUPERVISOR: {
    visibility: 'The register within the Supervisor’s own scope, read-only.',
    rights:
      'Issues or resets a managed personal identification number, within own scope and for workers only — the one write in this module a role other than the Tenant Admin holds.',
    prohibition:
      'Holds no create, no role assignment and no scope assignment. Those controls exist on this screen for the Tenant Admin, so they render disabled with their reason rather than vanishing.',
  },
  QUALITY_MANAGER: {
    visibility: 'The register within the Quality Manager’s own scope, read-only.',
    rights: 'None in this module. Quality authority lives in the quality modules, not in access administration.',
    prohibition:
      'Holds no write row here at all, including the credential path: the personal identification number is administration, not quality.',
  },
  READONLY_AUDITOR: {
    visibility: 'The register tenant-wide, read-only.',
    rights:
      'Reads. That is the entire right set, and it is the point of the role rather than a limitation of it.',
    prohibition:
      'No mutating operation succeeds on any surface, through any interface; a mutating request is refused and recorded as a security-relevant event (L16997).',
  },
  WORKER: {
    visibility:
      'None on this surface. The Worker holds no Hub screen at all, and the register is Unavailable rather than prohibited — the two statuses are never merged.',
    rights: 'None here. The Worker’s rights live on the device application.',
    prohibition:
      'Self-service role change is refused rather than merely absent, because it is a privilege-escalation path (H18, L22027).',
  },
}

/* ------------------------------------------------------------------ *
 * The panels the per-module contract requires.
 * ------------------------------------------------------------------ */

export interface UnspecifiedEntry {
  readonly affordance: string
  readonly note: string
}

export const UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'Who may use the sign-in address screen',
    note: 'The source names the work-email field, the Continue control, the platform-credential path and its submit (L95829, L95832) and states no allowed-roles list for any of them. The screen renders the shape and says the roles are unstated rather than assigning some.',
  },
  {
    affordance: 'What a role definition card export contains',
    note: 'DEC-AUDEXPORT-001 (L14355) leaves the contents open, and a separate restatement (L16893) renders the Auditor’s export as Client Decision Required in every matrix cell. The export is therefore refused for the Auditor with the decision named, and shown in place rather than written to a file for the Tenant Admin.',
  },
  {
    affordance: 'The format, length and delivery of a managed personal identification number',
    note: 'The source names the control and never the value. No number is drawn, no length is implied, and no delivery channel is claimed — the control records the act and says what it did not do.',
  },
  {
    affordance: 'Which role types are approver-capable',
    note: 'The mandatory-role rule is stated twice and made testable a third time without the set ever being enumerated. The standing counter names the set it counts, so a reader can see the assumption instead of inheriting it.',
  },
  {
    affordance: 'The fields of the create-account form',
    note: 'The workflow exists with acceptance criteria (WF-WKR-004, L52892) and no field list anywhere. No form is drawn: inventing one would read back as a requirement.',
  },
  {
    affordance: 'What "own scope" means when the record is a person, not a place',
    note: 'The register row for the Supervisor and the Quality Manager reads "Read-only — own scope" (L28532). A scope names a Site or an Area; a user account sits in neither, and the source never says whether a person falls inside a scope by the Sites their grants name, by their account, or not at all. The scope this pass enforces is therefore applied where the source does define it — the location nodes a view reaches, resolved through the evaluator — and the register itself is not filtered on a reading nobody wrote.',
  },
  {
    affordance: 'Whether a scope survives its role being removed and assigned again',
    note: 'A role assignment carries two states and no third: `assigned` and `removed` (L28512). A removed assignment is gone, so assigning the role again creates a new grant, and this build gives that new grant the widest scope and says so in the confirmation — the honest reading of a vocabulary with no lapsed or suspended state to hold a scope in. The source names manual add and remove as the cover for delegation (L28495, L28528) without ever saying what becomes of a scope across it. The consequence is real and is stated rather than hidden: removing an Area-scoped role and assigning it again widens that person’s reach, in two audited acts, and no rule in the source refuses it. The narrow-only rule binds the scope control, which refuses a widening every time.',
  },
  {
    affordance: 'What happens to a grant when the node it is scoped to is archived',
    note: 'An archived Site or Area stays readable and is withheld from the assignment picker here, but no line says whether a grant already scoped to it survives the archival, lapses, or falls back to the parent. Nothing is invented: the seeded grants name active nodes, and the question is recorded rather than answered by a rule this module would have made up.',
  },
  {
    affordance: 'What a refused mandatory-role removal offers next',
    note: 'The refusal is stated absolutely and no alternative path is named. The screen states the rule and stops there rather than inventing a request-an-exception route, which is precisely what "no override exists on any surface" forbids.',
  },
] as const satisfies readonly UnspecifiedEntry[]

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const SOURCE_CONFLICTS = [
  {
    topic: 'The order the nine conditions are rendered in',
    conflict:
      'One reading cites L14531 for an evaluation order with safety controls first, against the definition order at L14514. The citation is off by one — L14531 is the request-arrival step — but the ordering it describes is real, and sits on the very next line.',
    resolution:
      'Both structures are the source’s, and both are shown. The definition list at L14514 to L14522 enumerates the nine with role permission FIRST and safety controls NINTH, and that is the Order column. The numbered workflow at L14529 evaluates safety FIRST, at L14532, and that is the Evaluated column. An earlier ruling here recorded that no safety-first ordering existed anywhere in the source. That was wrong, and while it stood this module — the only one of slice 4’s eight that ships a safety-control refusal — reported that refusal as an explicit role denial.',
  },
  {
    topic: 'How many rows are prohibited for all five roles',
    conflict:
      'The build map says five rows and then enumerates six. Five of them are contiguous (L28525-L28529); the sixth sits three rows later at L28533.',
    resolution:
      'Six is what the matrix holds, and six render absent. The count was a miscount of a list, not a disagreement about any row.',
  },
  {
    topic: 'Four rival account lifecycles for one object',
    conflict:
      'The module card names three states; three other passages name three, ten and six, and no two sets agree.',
    resolution:
      'D21: the module identity card governs the object state vocabulary. The card’s three are adopted and the other three are recorded in full rather than dropped, so a reader who meets one in the source can find it here.',
  },
  {
    topic: 'Two modules claim configuring single sign-on',
    conflict:
      'This module’s matrix carries the row at L28530; the integration surface’s own matrix carries the same action at L29042.',
    resolution:
      'Both hold, because they are different halves. This module renders the two sign-in tracks the connection produces; the integration settings screen owns the editing of it. The connection record itself is one shared type, so there is one definition and not two.',
  },
  {
    topic: 'How many screen states apply here',
    conflict:
      'The build map says all twelve apply. The per-module contract removes the two artificial-intelligence states across the whole slice, the offline state is frontline-only, and nothing on this surface ever queues a write.',
    resolution:
      'Nine apply and four do not. Each of the four is named with its reason rather than quietly dropped, because an unlisted state reads as an unconsidered one.',
  },
  {
    topic: 'One screen identifier naming two different screens',
    conflict:
      'SCR-DOH-PERM-ROLES is the role reference pane at L17609 and the mandatory-role guard at L20641.',
    resolution:
      'Neither is used as an identifier here. This module is annotated with the canonical catalogue-B rows and with the role-explanation family by name, and every route is keyed on the module slug.',
  },
] as const satisfies readonly SourceConflict[]

/* ------------------------------------------------------------------ *
 * Freshness, and the one write class this module asks the gate about.
 * ------------------------------------------------------------------ */

/**
 * Every write on this screen is a configuration edit, which is why the whole
 * module closes under every suspension state: the source names "all
 * configuration edits" in the blocked list (L26919) and the account row says
 * so directly (L28522).
 */
export const CONFIGURATION_EDIT_ACTION: WriteAction = 'edit-configuration'

export const REGISTER_AS_OF = 'As of day 14 of the seeded scenario, 09:12 site time'
export const REGISTER_STALE_AS_OF =
  'As of day 14 of the seeded scenario, 07:40 site time — the last read before the connection was lost'
export const REGISTER_ORIGIN = 'read from the seeded tenant user register, not from a server'
