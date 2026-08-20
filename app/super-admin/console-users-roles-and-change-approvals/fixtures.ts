import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import type { SaCriticalActionId } from '@/surfaces/sa/critical-actions'
import type { SaModuleId } from '@/surfaces/sa/modules'

/**
 * MOD-SA-08 Console Users, Roles and Change Approvals — the seeded fixtures
 * this module's screen steps through. No backend and no clock: every "as of"
 * value below is a fixture string, never a computed time (spec §8).
 *
 * Every entry carries the frozen-source line it came from. Nothing here was
 * invented to fill a panel: where the source defines no value, the value is
 * named in `SA08_UNSPECIFIED_IN_SOURCE` instead of being guessed.
 *
 * A note on wording throughout this module: the four forbidden words are
 * *tamper-evident*, *chained*, *signed* and *verified* (D10). "assigned" and
 * "signed in" both literally contain "signed", so this module says "role
 * assignment", "holds the role" and "the identity in view" instead. That is
 * not fussiness — the slice gate matches the substring.
 */

/* ------------------------------------------------------------------ *
 * Closed vocabularies. `as const satisfies` keeps each member literal-
 * narrowed, so the exhaustiveness checks below are real, not vacuous.
 * ------------------------------------------------------------------ */

/** OBJ-SA-CONSOLEUSER (L44793, L44794). */
export type ConsoleAccountState = 'provisioned' | 'active' | 'disabled'
export const CONSOLE_ACCOUNT_STATES = [
  'provisioned',
  'active',
  'disabled',
] as const satisfies readonly ConsoleAccountState[]
type MissingAccountState = Exclude<ConsoleAccountState, (typeof CONSOLE_ACCOUNT_STATES)[number]>
const _accountStatesExhaustive: MissingAccountState extends never ? true : never = true
void _accountStatesExhaustive

/**
 * OBJ-SA-APPROVAL (L44793) names four — pending, approved, returned,
 * applied — with `aging` a DERIVED FLAG on pending critical requests, not a
 * state. OBJ-unnumbered-APPROVALREQ (L55529) names the same four plus the
 * two failure states approved-not-applied (L55897, WF-ROLE-015) and
 * approved-not-executed (L55985, WF-ROLE-019). Both readings are the same
 * object; the six below is their union, and `aging` is deliberately NOT a
 * member — a derived flag rendered as a state would make an aging request
 * look like it had left `pending`.
 */
export type ApprovalState =
  | 'pending'
  | 'approved'
  | 'returned'
  | 'applied'
  | 'approved-not-applied'
  | 'approved-not-executed'
export const APPROVAL_STATES = [
  'pending',
  'approved',
  'returned',
  'applied',
  'approved-not-applied',
  'approved-not-executed',
] as const satisfies readonly ApprovalState[]
type MissingApprovalState = Exclude<ApprovalState, (typeof APPROVAL_STATES)[number]>
const _approvalStatesExhaustive: MissingApprovalState extends never ? true : never = true
void _approvalStatesExhaustive

/** The four console change classes (L21026). */
export type ChangeClassId =
  | 'band-b-routine'
  | 'engineering'
  | 'critical'
  | 'root-only-administrative'

export interface ChangeClassDefinition {
  readonly id: ChangeClassId
  readonly name: string
  readonly approver: string
  /** Whether a request of this class ever appears in the queue at all. */
  readonly entersQueue: boolean
  readonly note: string
  readonly sourceRef: string
}

export const CHANGE_CLASSES = [
  {
    id: 'band-b-routine',
    name: 'Band B routine action',
    approver: 'None — it auto-applies',
    entersQueue: false,
    note: 'Auto-applies and is audited. It never enters the queue, because there is nothing to decide.',
    sourceRef: 'L21026',
  },
  {
    id: 'engineering',
    name: 'Engineering class',
    approver: 'Admin (the root may also approve)',
    entersQueue: true,
    note: 'A Platform Engineer proposes; an Admin decides. The maker never decides.',
    sourceRef: 'L21026, L44718, L55892',
  },
  {
    id: 'critical',
    name: 'Critical class',
    approver: 'Root Super Admin only',
    entersQueue: true,
    note: 'Blocked until the root approves. An Admin cannot approve any of them (AC-SA-08-06).',
    sourceRef: 'L21026, L44880, L55961',
  },
  {
    id: 'root-only-administrative',
    name: 'Root-only administrative action',
    approver: 'Root Super Admin, acting directly',
    entersQueue: false,
    note: 'No proposal path exists. Account creation, role assignment and disablement sit here, so no other role has anything to submit.',
    sourceRef: 'L21026, L44774, L55552',
  },
] as const satisfies readonly ChangeClassDefinition[]
type MissingChangeClass = Exclude<ChangeClassId, (typeof CHANGE_CLASSES)[number]['id']>
const _changeClassesExhaustive: MissingChangeClass extends never ? true : never = true
void _changeClassesExhaustive

/* ------------------------------------------------------------------ *
 * The four platform roles. The `ROLE-PLAT-*` identifiers are the plan's
 * annotation for the four accounts `@/domain/roles` already carries. The
 * selector is a VIEW SWITCHER, not a login (spec §8).
 * ------------------------------------------------------------------ */

export interface Sa08PlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
  /**
   * The stable actor identifier this fixture role acts under, so
   * segregation of duties is evaluated against a real identity rather than
   * a role name — `evaluateAccess` refuses an unattributed actor outright.
   */
  readonly actorOfRecord: string
}

export const SA08_PLATFORM_ROLES = [
  {
    id: 'ROOT_SUPER_ADMIN',
    name: 'Root Super Admin',
    roleAnnotation: 'ROLE-PLAT-ROOT',
    actorOfRecord: 'ACT-ROOT-01',
  },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN', actorOfRecord: 'ACT-ADMIN-01' },
  {
    id: 'PLATFORM_ENGINEER',
    name: 'Platform Engineer',
    roleAnnotation: 'ROLE-PLAT-ENG',
    actorOfRecord: 'ACT-ENG-01',
  },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP', actorOfRecord: 'ACT-SUP-01' },
] as const satisfies readonly Sa08PlatformRole[]

/* ------------------------------------------------------------------ *
 * The Users pane (SCR-SA-12, L42804 / L44774 / L55552).
 * ------------------------------------------------------------------ */

export interface ConsoleAccountFixture {
  readonly id: string
  readonly roleHeld: string
  readonly state: ConsoleAccountState
  readonly lastActivity: string
}

export const CONSOLE_ACCOUNTS = [
  {
    id: 'CA-01',
    roleHeld: 'Root Super Admin',
    state: 'active',
    lastActivity: 'as of 2026-08-17 08:55 (fixture)',
  },
  { id: 'CA-02', roleHeld: 'Admin', state: 'active', lastActivity: 'as of 2026-08-17 09:04 (fixture)' },
  {
    id: 'CA-03',
    roleHeld: 'Platform Engineer',
    state: 'active',
    lastActivity: 'as of 2026-08-16 17:20 (fixture)',
  },
  {
    id: 'CA-04',
    roleHeld: 'No role held — the account carries no capability',
    state: 'provisioned',
    lastActivity: 'Never — the account has not been activated',
  },
  {
    id: 'CA-05',
    roleHeld: 'Platform Engineer',
    state: 'disabled',
    lastActivity: 'as of 2026-07-29 11:02 (fixture)',
  },
] as const satisfies readonly ConsoleAccountFixture[]

/** Exactly one root account exists, and no interface path creates a second. */
export const ROOT_ACCOUNT_RULE =
  'Exactly one root account exists, and no user interface path creates a second one (AC-SA-08-01, L44875). The sole root is created through the back end at platform commissioning (WF-ROLE-001), so this pane draws no control that could mint another.'

/* ------------------------------------------------------------------ *
 * The Roles pane (SB-RBAC-01, L20728; AC-SA-08-12, L44886).
 * ------------------------------------------------------------------ */

/**
 * D24 — the nine-token cut (L10238), already the closed `PermissionOutcome`
 * set. Every matrix cell carries one of these nine, because "a blank cell is
 * an unanswered question that an implementer will answer privately and
 * inconsistently".
 */
export const MATRIX_TOKEN_LABEL: Record<PermissionOutcome, string> = {
  allowed: 'allowed',
  allowedWithConditions: 'allowed with conditions',
  readOnly: 'read only',
  cachedReadOnlyOffline: 'cached read-only offline',
  queuedOffline: 'queued offline',
  unavailable: 'unavailable',
  explicitlyProhibited: 'explicitly prohibited',
  clientDecisionRequired: 'client decision required',
  notApplicable: 'not applicable',
}

export interface MatrixCell {
  readonly outcome: PermissionOutcome
  /** Always stated. `notApplicable` carries a REQUIRED reason by rule. */
  readonly cause: string
}

/**
 * The derivation rule, stated on screen rather than buried here:
 *
 * 1. Default — every console role reads every module (D16, L42742). The
 *    pane confers no act authority of its own, so the default cell is
 *    `read only`.
 * 2. Exceptions are taken ONLY where the frozen source or a numbered
 *    decision names one. Three do: this module's own root-only
 *    administration, the Trace Viewer's absence (D9), and the Platform
 *    Engineer's pause control pending DEC-PAUSE-001 (D8).
 *
 * No other cell is coloured in from imagination. A matrix that guessed act
 * authority for eighteen other modules would read back as a requirement.
 */
const DEFAULT_CELL: MatrixCell = {
  outcome: 'readOnly',
  cause: 'reads the module; this pane confers no act authority',
}

const CELL_EXCEPTIONS: ReadonlyArray<{
  readonly module: SaModuleId
  readonly role: RoleId
  readonly cell: MatrixCell
}> = [
  {
    module: 'MOD-SA-08',
    role: 'ROOT_SUPER_ADMIN',
    cell: { outcome: 'allowed', cause: 'root-only administration and critical approval (L55552)' },
  },
  {
    module: 'MOD-SA-08',
    role: 'ADMIN',
    cell: {
      outcome: 'allowedWithConditions',
      cause: 'engineering class only, and never a change this identity proposed (L44880, L44879)',
    },
  },
  {
    module: 'MOD-SA-06',
    role: 'ROOT_SUPER_ADMIN',
    cell: { outcome: 'notApplicable', cause: 'no viewer screen exists at V1 (D9, DEC-SEC-020)' },
  },
  {
    module: 'MOD-SA-06',
    role: 'ADMIN',
    cell: { outcome: 'notApplicable', cause: 'no viewer screen exists at V1 (D9, DEC-SEC-020)' },
  },
  {
    module: 'MOD-SA-06',
    role: 'PLATFORM_ENGINEER',
    cell: { outcome: 'notApplicable', cause: 'no viewer screen exists at V1 (D9, DEC-SEC-020)' },
  },
  {
    module: 'MOD-SA-06',
    role: 'SUPPORT',
    cell: { outcome: 'notApplicable', cause: 'no viewer screen exists at V1 (D9, DEC-SEC-020)' },
  },
  {
    module: 'MOD-SA-07',
    role: 'PLATFORM_ENGINEER',
    cell: {
      outcome: 'clientDecisionRequired',
      cause: 'emergency pause is proposal only — pending DEC-PAUSE-001 (D8)',
    },
  },
  {
    module: 'MOD-SA-15',
    role: 'PLATFORM_ENGINEER',
    cell: {
      outcome: 'explicitlyProhibited',
      cause: 'support sessions are refused to this role; the conflict at L20740 against L65401 resolves to the prohibition (D17)',
    },
  },
]

export function matrixCell(module: SaModuleId, role: RoleId): MatrixCell {
  return CELL_EXCEPTIONS.find((e) => e.module === module && e.role === role)?.cell ?? DEFAULT_CELL
}

/** L20728 — the export carries the configuration version it was true for. */
export const MATRIX_CONFIGURATION_VERSION = 'configuration version CFG-2026-08-17-04 (fixture)'

/* ------------------------------------------------------------------ *
 * The approval queue (SCR-SA-13, L42805 / SB-RBAC-05, L21050).
 * ------------------------------------------------------------------ */

/** AC-SA-08-07 (L44881) — the nine fields every approval request carries. */
export const APPROVAL_REQUEST_FIELDS = [
  'Proposer',
  'Change class',
  'Object reference',
  'Diff',
  'Rationale',
  'State',
  'Approver',
  'Timestamps',
  'Audit reference',
] as const

export interface ApprovalRequestFixture {
  readonly id: string
  readonly changeClass: ChangeClassId
  /** Set only on critical-class rows: which of the eleven this routes as. */
  readonly criticalAction?: SaCriticalActionId
  readonly proposerLabel: string
  readonly proposerActor: string
  readonly objectReference: string
  readonly diff: string
  readonly rationale: string
  readonly state: ApprovalState
  readonly approver: string
  readonly timestamps: string
  readonly auditReference: string
  /** Derived flag, never a state (L44794). */
  readonly aging: boolean
  /** Which band the `Filter by age` control puts this row in. */
  readonly ageBand: AgeBand
}

export const APPROVAL_REQUESTS = [
  {
    id: 'AR-4471',
    changeClass: 'engineering',
    proposerLabel: 'Platform Engineer (CA-03)',
    proposerActor: 'ACT-ENG-01',
    objectReference: 'Composed-agent review — composition CMP-118',
    diff: 'Two atoms added to the composition; one retirement date moved',
    rationale: 'The deviation-triage composition needs the new severity atom before enablement',
    state: 'pending',
    approver: 'Not yet decided',
    timestamps: 'Submitted 2026-08-17 08:40 (fixture)',
    auditReference: 'AUD-SA-88104',
    aging: false,
    ageBand: 'today',
  },
  {
    id: 'AR-4472',
    changeClass: 'engineering',
    proposerLabel: 'Admin (CA-02)',
    proposerActor: 'ACT-ADMIN-01',
    objectReference: 'Atom registry — enablement proposal for atom ATM-402',
    diff: 'Registry entry moves from proposed to enabled once its scenarios pass',
    rationale: 'The scenarios cleared on the last suite run',
    state: 'pending',
    approver: 'Not yet decided',
    timestamps: 'Submitted 2026-08-17 08:12 (fixture)',
    auditReference: 'AUD-SA-88101',
    aging: false,
    ageBand: 'today',
  },
  {
    id: 'AR-4473',
    changeClass: 'critical',
    criticalAction: 'tier-publication',
    proposerLabel: 'Admin (CA-02)',
    proposerActor: 'ACT-ADMIN-01',
    objectReference: 'Tier publication — tier record TR-19',
    diff: 'Tier record moves from pending root approval to published',
    rationale: 'The commercial terms for the new band are settled',
    state: 'pending',
    approver: 'Root Super Admin — not yet decided',
    timestamps: 'Submitted 2026-08-14 16:05 (fixture)',
    auditReference: 'AUD-SA-88044',
    aging: true,
    ageBand: 'older than three days',
  },
  {
    id: 'AR-4474',
    changeClass: 'critical',
    criticalAction: 'compliance-suspension',
    proposerLabel: 'Root Super Admin (CA-01)',
    proposerActor: 'ACT-ROOT-01',
    objectReference: 'Compliance suspension — one tenant, named in the request only',
    diff: 'Tenant lifecycle moves to compliance-suspended',
    rationale: 'A compliance instruction was received and recorded against this request',
    state: 'pending',
    approver: 'Root Super Admin — the sole critical approver',
    timestamps: 'Submitted 2026-08-17 07:55 (fixture)',
    auditReference: 'AUD-SA-88099',
    aging: false,
    ageBand: 'today',
  },
  {
    id: 'AR-4468',
    changeClass: 'engineering',
    proposerLabel: 'Platform Engineer (CA-03)',
    proposerActor: 'ACT-ENG-01',
    objectReference: 'Atom registry — retirement of atom ATM-311',
    diff: 'Registry entry moves from enabled to retired',
    rationale: 'Superseded by ATM-402',
    state: 'returned',
    approver: 'Admin (CA-02)',
    timestamps: 'Submitted 2026-08-15 10:31, returned 2026-08-15 14:02 (fixture)',
    auditReference: 'AUD-SA-87990',
    aging: false,
    ageBand: 'older than one day',
  },
  {
    id: 'AR-4465',
    changeClass: 'engineering',
    proposerLabel: 'Platform Engineer (CA-03)',
    proposerActor: 'ACT-ENG-01',
    objectReference: 'Platform settings — one governed setting, category Model and Inference',
    diff: 'Setting value moves within its stated bound',
    rationale: 'Bound review completed',
    state: 'applied',
    approver: 'Admin (CA-02)',
    timestamps: 'Submitted 2026-08-13 09:00, applied 2026-08-13 09:41 (fixture)',
    auditReference: 'AUD-SA-87802',
    aging: false,
    ageBand: 'older than three days',
  },
  {
    id: 'AR-4466',
    changeClass: 'engineering',
    proposerLabel: 'Platform Engineer (CA-03)',
    proposerActor: 'ACT-ENG-01',
    objectReference: 'Platform settings — one governed setting, category Integrations',
    diff: 'Setting value moves within its stated bound',
    rationale: 'Requested by the integration owner',
    state: 'approved-not-applied',
    approver: 'Admin (CA-02)',
    timestamps: 'Approved 2026-08-16 11:15 (fixture); application not done',
    auditReference: 'AUD-SA-88010',
    aging: false,
    ageBand: 'older than one day',
  },
  {
    id: 'AR-4467',
    changeClass: 'critical',
    criticalAction: 'device-wipe',
    proposerLabel: 'Admin (CA-02)',
    proposerActor: 'ACT-ADMIN-01',
    objectReference: 'Device wipe and de-authorisation — one enrolled device',
    diff: 'Device record moves to wiped and de-authorised once the device acknowledges',
    rationale: 'Loss reported and recorded against a ticket',
    state: 'approved-not-executed',
    approver: 'Root Super Admin (CA-01)',
    timestamps: 'Approved 2026-08-16 13:44 (fixture); execution not done',
    auditReference: 'AUD-SA-88015',
    aging: false,
    ageBand: 'older than one day',
  },
] as const satisfies readonly ApprovalRequestFixture[]

/**
 * Filter option sets. Age is a BAND, never a countdown: nothing in this
 * queue expires (WF-ROLE-021), so age answers "how long has this waited",
 * not "how long is left".
 */
export type AgeBand = 'today' | 'older than one day' | 'older than three days'
export const AGE_BANDS = [
  'today',
  'older than one day',
  'older than three days',
] as const satisfies readonly AgeBand[]
type MissingAgeBand = Exclude<AgeBand, (typeof AGE_BANDS)[number]>
const _ageBandsExhaustive: MissingAgeBand extends never ? true : never = true
void _ageBandsExhaustive

/* ------------------------------------------------------------------ *
 * DEC-ROOTSUCC-001 (L56417, L60617) — the freeze.
 * ------------------------------------------------------------------ */

export interface FrozenCapability {
  readonly id: SaCriticalActionId
  readonly name: string
}

/**
 * The seven capabilities root loss freezes SIMULTANEOUSLY. The words are the
 * decision's own: the `TBD — Client Decision Required` (`DEC-ROOTSUCC-001`)
 * clause in the root-unavailability workflow's fallbacks bullet gives the
 * reason it matters — that workflow's own identifier is deliberately not
 * written here, because the coverage registry reads a route naming one as
 * evidence the route demonstrates it, and this panel demonstrates the freeze
 * rather than the workflow
 * (L56417): "its loss freezes compliance suspension, device wipe, emergency
 * pause, retention changes, legal hold, severity-catalog changes, and floor
 * changes simultaneously".
 *
 * Quoted verbatim rather than tidied. An earlier revision printed this as
 * "Root loss freezes ... severity-catalog changes and floor changes
 * simultaneously" — a paraphrase that recapitalised the subject and dropped
 * a comma while wearing quotation marks, which is a claim the source does
 * not make about its own wording.
 *
 * Seven, not eleven: the decision names these, and this panel does not
 * widen it. The remaining critical actions are frozen too — every critical
 * action needs the root — but only these seven are what the decision
 * itself calls out, and the queue below shows the rest freezing anyway.
 */
export const ROOT_FROZEN_CAPABILITIES = [
  { id: 'compliance-suspension', name: 'Compliance suspension' },
  { id: 'device-wipe', name: 'Device wipe' },
  { id: 'emergency-pause', name: 'Emergency pause' },
  { id: 'retention-value-changes', name: 'Retention-value changes' },
  { id: 'legal-hold-place-and-release', name: 'Legal-hold place and release' },
  { id: 'severity-catalog-changes', name: 'Severity-catalog changes' },
  { id: 'floor-register-changes', name: 'Floor-register changes' },
] as const satisfies readonly FrozenCapability[]

export const ROOT_FREEZE_HEADLINE = 'Critical class frozen — no second approver exists'

export const ROOT_SELF_APPROVAL_NOTE =
  'The root decides its own critical request here. That is not an oversight in this screen: the frozen source assigns no second critical approver, so the platform-wide refusal of self-approval has nothing to fall back to (DEC-ROOTSUCC-001; the contradiction is recorded in the source at L55989). It is rendered, not hidden, because a reviewer needs to see the concentration this design carries.'

/* ------------------------------------------------------------------ *
 * Aggregate freshness (AC-SA-01-03). Fixture strings, never a clock.
 * ------------------------------------------------------------------ */

export const QUEUE_AS_OF = 'as of 2026-08-17 09:12 (fixture)'
export const QUEUE_STALE_AS_OF = 'as of 2026-08-17 06:12 (fixture) — 3 hours old, stale'
export const QUEUE_ORIGIN = 'read from the seeded console fixture'

/* ------------------------------------------------------------------ *
 * Workflows. The extraction carries no `module_id` on workflow entries,
 * so these were MATCHED BY LINE PROXIMITY to this module's own controls
 * and screens (L20728-21050, L23707-23739, L44739-44774, L55552-56031,
 * L76102-76133) and by name. The method is stated on screen too.
 * ------------------------------------------------------------------ */

export interface Sa08Workflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly terminalStates: readonly string[]
  /** Which panel on this screen carries it, or why none does. */
  readonly rendersAs: string
  readonly matchedBy: string
}

export const SA08_WORKFLOWS = [
  {
    id: 'WF-ROLE-001',
    name: 'Creating the sole Root Super Admin through the back end at platform commissioning',
    actor: 'the commissioning process',
    terminalStates: ['no console access exists at all'],
    rendersAs:
      'No console affordance, by design — the Users pane draws no control that could create a root account.',
    matchedBy: 'line proximity to this module’s controls at L55552',
  },
  {
    id: 'WF-ROLE-002',
    name: 'Handing custody of the root account to the client',
    actor: 'the client’s named custodian',
    terminalStates: ['ambiguous custody is resolved by invalidating both copies'],
    rendersAs: 'No console affordance — custody is a commissioning act, not a console control.',
    matchedBy: 'line proximity, L55599',
  },
  {
    id: 'WF-ROLE-003',
    name: 'Hardening the root account',
    actor: 'Root Super Admin',
    terminalStates: [
      'no root access is possible and no mutating platform change can be approved; tenant operations continue unaffected',
    ],
    rendersAs: 'Root availability — this is exactly the freeze this screen renders as a first-class state.',
    matchedBy: 'line proximity, L55621',
  },
  {
    id: 'WF-ROLE-004',
    name: 'First root access and the enforced-invariant acknowledgement',
    actor: 'Root Super Admin',
    terminalStates: ['settings read-only, invariants intact'],
    rendersAs: 'Enforced invariants — acknowledged, never approved, because no approval path exists.',
    matchedBy: 'line proximity, L55644',
  },
  {
    id: 'WF-ROLE-005',
    name: 'Creating a platform Admin account',
    actor: 'Root Super Admin',
    terminalStates: ['an account with no role and therefore no capability'],
    rendersAs: 'Users pane — Create user, root only. CA-04 is the roleless account this ends at.',
    matchedBy: 'line proximity, L55666',
  },
  {
    id: 'WF-ROLE-006',
    name: 'The role assignment that makes an Admin account an Admin',
    actor: 'Root Super Admin',
    terminalStates: ['re-evaluated on next access'],
    rendersAs: 'Users pane — Role assignment, root only.',
    matchedBy: 'line proximity, L55689',
  },
  {
    id: 'WF-ROLE-007',
    name: 'Creating a Platform Engineer account',
    actor: 'Root Super Admin',
    terminalStates: ['roleless, capability-free account'],
    rendersAs: 'Users pane — Create user, root only.',
    matchedBy: 'line proximity, L55711',
  },
  {
    id: 'WF-ROLE-008',
    name: 'The role assignment that makes an account a Platform Engineer',
    actor: 'Root Super Admin',
    terminalStates: ['no engineering mutation applies; read and evaluation paths continue'],
    rendersAs: 'Users pane — Role assignment, root only.',
    matchedBy: 'line proximity, L55733',
  },
  {
    id: 'WF-ROLE-009',
    name: 'Creating a Support account',
    actor: 'Root Super Admin',
    terminalStates: ['capability-free account'],
    rendersAs: 'Users pane — Create user, root only.',
    matchedBy: 'line proximity, L55756',
  },
  {
    id: 'WF-ROLE-010',
    name: 'The role assignment that makes an account Support',
    actor: 'Root Super Admin',
    terminalStates: ['no support sessions open anywhere; support work waits'],
    rendersAs: 'Users pane — Role assignment. Opening a session itself belongs to MOD-SA-15.',
    matchedBy: 'line proximity, L55778',
  },
  {
    id: 'WF-ROLE-011',
    name: 'Activating a platform Admin account and first access',
    actor: 'platform Admin',
    terminalStates: [
      'the account remains inactive; approvals queue and age, re-notifying the root for critical items',
    ],
    rendersAs: 'Users pane account states, and the queue’s aging flag when this terminal state holds.',
    matchedBy: 'line proximity, L55801',
  },
  {
    id: 'WF-ROLE-012',
    name: 'Activating a Platform Engineer account and first access',
    actor: 'Platform Engineer',
    terminalStates: ['no engineering change is made and the platform runs on its current configuration'],
    rendersAs: 'Users pane account states.',
    matchedBy: 'line proximity, L55823',
  },
  {
    id: 'WF-ROLE-013',
    name: 'Activating a Support account and first access',
    actor: 'Support',
    terminalStates: ['no session; the tenant’s question waits, and the tenant’s data is untouched'],
    rendersAs: 'Users pane account states.',
    matchedBy: 'line proximity, L55845',
  },
  {
    id: 'WF-ROLE-014',
    name: 'A Platform Engineer submitting a Band A change',
    actor: 'Platform Engineer',
    terminalStates: ['no change, current configuration in force'],
    rendersAs: 'Approval queue — AR-4471 and AR-4468 are what a submission looks like once it lands.',
    matchedBy: 'line proximity, L55868',
  },
  {
    id: 'WF-ROLE-015',
    name: 'An Admin approving a Platform Engineer change',
    actor: 'platform Admin',
    terminalStates: [
      'the prior configuration in force with the approval recorded and the application explicitly not done',
    ],
    rendersAs: 'Approval queue — Approve, and AR-4466 renders that terminal state as approved-not-applied.',
    matchedBy: 'line proximity, L55892',
  },
  {
    id: 'WF-ROLE-016',
    name: 'An Admin returning a Platform Engineer change',
    actor: 'platform Admin',
    terminalStates: ['the change is not applied and the current configuration stands'],
    rendersAs: 'Approval queue — Return with a categorised reason; AR-4468 is a returned request.',
    matchedBy: 'line proximity, L55915',
  },
  {
    id: 'WF-ROLE-017',
    name: 'An Admin performing a routine Band B action',
    actor: 'platform Admin',
    terminalStates: ['no unmirrored platform-side act against a tenant persists'],
    rendersAs: 'Change classes — Band B routine auto-applies and is audited, so it never queues.',
    matchedBy: 'line proximity, L55938',
  },
  {
    id: 'WF-ROLE-018',
    name: 'An Admin initiating a critical-class action',
    actor: 'platform Admin',
    terminalStates: ['not done, visibly pending — a critical action is never performed for convenience'],
    rendersAs: 'Critical-class routing — Submit for root approval, and the blocked attempt it records.',
    matchedBy: 'line proximity, L55961',
  },
  {
    id: 'WF-ROLE-019',
    name: 'The root approving a critical-class request',
    actor: 'Root Super Admin',
    terminalStates: ['approved-not-executed, displayed as such'],
    rendersAs: 'Approval queue — Approve on a critical row; AR-4467 renders that terminal state.',
    matchedBy: 'line proximity, L55985',
  },
  {
    id: 'WF-ROLE-020',
    name: 'The root declining a critical-class request',
    actor: 'Root Super Admin',
    terminalStates: ['nothing executed, the current state stands'],
    rendersAs: 'Approval queue — Decline, root only, with a mandatory reason.',
    matchedBy: 'line proximity, L56008',
  },
  {
    id: 'WF-ROLE-021',
    name: 'Re-notifying the root about an aging critical request',
    actor: 'the platform notification machinery',
    terminalStates: ['the request stays pending and visible forever rather than expiring'],
    rendersAs: 'Approval queue — the aging flag on AR-4473. Nothing in this queue expires.',
    matchedBy: 'line proximity, L56031',
  },
  {
    id: 'UC-HO-01',
    name: 'Root Super Admin to Admin, delegation of Band B authority',
    actor: 'Root Super Admin',
    terminalStates: ['Account created, role held, enabled'],
    rendersAs: 'Users pane — create then role assignment, both root only.',
    matchedBy: 'line proximity to the L23707 control block',
  },
  {
    id: 'UC-HO-02',
    name: 'Admin to Platform Engineer, the maker-checker cycle in reverse',
    actor: 'Admin',
    terminalStates: ['returned'],
    rendersAs: 'Approval queue — Return with a categorised reason.',
    matchedBy: 'line proximity, L23739',
  },
  {
    id: 'WF-PLT-CHANGE',
    name: 'A platform change from proposal to effect',
    actor: 'Platform Engineer',
    terminalStates: [
      'Effective, recorded in platform audit and mirrored to the tenant where tenant scoped',
      'Rejected regardless of approver, including the root, where an enforced invariant would be breached',
    ],
    rendersAs:
      'Approval queue plus the enforced-invariant panel — the second terminal state is why no approval path exists around an invariant.',
    matchedBy: 'name and line proximity, L21021 (the extraction gives this workflow no identifier)',
  },
  {
    id: 'WF-SA-ACCOUNT-LIFECYCLE',
    name: 'A change from proposal to effect, and an account from creation to disablement',
    actor: 'Platform Engineer (maker), Admin or Root Super Admin (checker)',
    terminalStates: [
      'applied with its audit event in the same transaction',
      'returned with reasons',
      'pending after a failed application',
    ],
    rendersAs: 'The whole screen — the queue for the change, the Users pane for the account.',
    matchedBy: 'name and line proximity, L44739 (numbered only as §23.8 in the extraction)',
  },
  {
    id: 'WF-SA-ONBOARD-4',
    name: 'Platform-side onboarding of the four console roles',
    actor: 'Engineer at commissioning, then Root Super Admin',
    terminalStates: [
      'Each console account authenticates and its last-activity record begins',
      'JBS access granted under the JBS access class',
    ],
    rendersAs: 'Users pane — last-activity review. The JBS access class itself belongs to MOD-SA-16.',
    matchedBy: 'line proximity to the L76133 control, L76102',
  },
] as const satisfies readonly Sa08Workflow[]

/* ------------------------------------------------------------------ *
 * Absences, gaps and conflicts.
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
}

export const SA08_ABSENT_CONTROLS = [
  {
    label: 'Approve anything touching the six enforced invariants',
    note: 'Not a disabled approval — an absent one. No account, the root included, holds an approval path around an enforced invariant (AC-SA-INV-003, L47849).',
  },
  {
    label: 'Approve every pending request at once',
    note: 'No approve-all exists (L21050). Each request is decided on its own diff and its own rationale, or it is not decided.',
  },
  {
    label: 'Create a second root account',
    note: 'Exactly one root account exists and no interface path creates a second (AC-SA-08-01, L44875). A standby root is refused outright (L60617).',
  },
  {
    label: 'Register yourself for console access',
    note: 'Self-registration exists for no account on this console (L60698). Accounts are created by the root alone.',
  },
  {
    label: 'A second, parallel decision queue',
    note: 'One queue answers "what is waiting for a platform-level decision"; composed-agent reviews and tier publications sit in it under their own classes (AC-SA-08-09, L44883).',
  },
  {
    label: 'Expire or archive an aging critical request',
    note: 'An aging request stays pending and visible rather than expiring (WF-ROLE-021). Nothing here drains by the passage of time.',
  },
] as const satisfies readonly AbsentControl[]

export interface UnspecifiedAffordance {
  readonly affordance: string
  readonly note: string
}

export const SA08_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'The reason vocabulary for Return and for Decline',
    note: 'Return demands a categorised reason (L23707, L55918) and Decline a mandatory one (L56011); the source enumerates neither vocabulary. No reason field is drawn on any row, for any role, in any state — stocking one with plausible categories would read back as a requirement, and a field with no options is a dead control. The demand is named here instead, and a returned or declined row says what it did without claiming a reason was collected.',
  },
  {
    affordance: 'The aging threshold that triggers re-notification',
    note: 'WF-ROLE-021 fires when a critical request "ages past its threshold". The threshold value is nowhere in the source, so the queue flags aging on the fixture and states no number.',
  },
  {
    affordance: 'The dormancy threshold for last-activity review',
    note: 'Last-activity review identifies dormant accounts (L55552). What makes an account dormant is not defined, so no cut-off is applied and no account is marked dormant here.',
  },
  {
    affordance: 'A control that re-enables a disabled console account',
    note: 'One account-state vocabulary includes "re-enabled" (L55669) while the object definition closes at provisioned, active and disabled (L44794). No re-enable control is named anywhere, so none is drawn.',
  },
  {
    affordance: 'Whether an Admin may return a request it proposed itself',
    note: 'AC-SA-08-05 (L44879) refuses self-APPROVAL, and the source only ever shows Return used on someone else’s proposal (WF-ROLE-016). This screen applies the same maker-checker refusal to Return — the maker does not decide, in either direction — and names it here because that is an inference the source does not make, not a rule it states. No withdraw path is defined either.',
  },
  {
    affordance: 'The state a declined critical request lands in',
    note: 'Decline is a defined control with a mandatory reason (L56011) and WF-ROLE-020 ends at "nothing executed, the current state stands". No member of the closed approval-state set means declined, so a declined row keeps its state and carries the act as a note. Minting a seventh state name would put a word in the product the source never wrote.',
  },
  {
    affordance: 'A decline path for the engineering class',
    note: 'Decline is defined for the root on a critical request only (L56011). The engineering class has Return and nothing else, so no Decline is drawn on an engineering row.',
  },
  {
    affordance: 'Acceptance criteria AC-SA-08-02, -03, -04 and -11',
    note: 'The extraction carries AC-SA-08-01, -05, -06, -07, -08, -09, -10 and -12 for this module and no others. Four identifiers in the run are absent from the frozen extract, so nothing was built to satisfy them.',
  },
  {
    affordance: 'The console access screen',
    note: 'The 22-screen inventory places SCR-SA-01 "Console access" against this module (L48730); the 26-screen inventory this build follows does not. No access screen is built, because this prototype authenticates nobody and the role control is a view switcher.',
  },
  {
    affordance: 'Where the implementation authoring role is provisioned from',
    note: 'OBJ-SA-IMPLROLE is owned by this surface and its provisioning and revocation appear in both audit streams (AC-SA-08-10, L44884). No console control for it is named in the source, so this screen states the rule and draws no control.',
  },
] as const satisfies readonly UnspecifiedAffordance[]

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const SA08_SOURCE_CONFLICTS = [
  {
    topic: 'How "Create user" renders for an Admin',
    conflict:
      'L44774 makes the create control absent for everyone but the root. L76133 draws it for an Admin, disabled, with the reason "User creation is root-only".',
    resolution:
      'Both, split by role. The Admin sees the disabled control with its named reason, exactly as L76133 describes; the Platform Engineer and Support see nothing at all, as L44774 requires. Neither passage is overruled, and no role is shown a control the source does not put in front of it.',
  },
  {
    topic: 'How a critical item refuses a non-root approver',
    conflict:
      'L48793 renders "Approve the critical-class severity-catalog change" as disabled for an Admin. L23707 replaces the whole action bar with the class badge for any non-root viewer.',
    resolution:
      'The class badge (spec §3). A disabled Approve on a critical row is still an Approve control on a critical row, and the rule exists so that nothing on the screen can be mistaken for an approval path.',
  },
  {
    topic: 'Whether an invariant approval is disabled or absent',
    conflict:
      'L48793 lists "Approve anything touching the six enforced invariants" as a disabled control. AC-SA-INV-003 (L47849) forbids an off control, an approval path AND a configuration key on any screen.',
    resolution:
      'Absent. A disabled approval implies an approval exists somewhere for somebody, and for these six it never does — the rule in spec §3 is what decides this, not preference.',
  },
  {
    topic: 'Self-approval, and the root',
    conflict:
      'AC-SA-08-05 (L44879) is a hard gate: no account approves its own submission. WF-ROLE-019 has the root approving its own critical action, because the source assigns no second critical approver. The extraction records the clash itself at L55989.',
    resolution:
      'The refusal holds for every account and every class except one case: the root on a critical request, where it is rendered with the reason stated on the row. DEC-ROOTSUCC-001 is open, and this screen shows the concentration rather than hiding it.',
  },
  {
    topic: 'How many critical-class actions there are',
    conflict:
      'The passage is titled "the ten critical-class actions" and a numeric fact states ten (L55963), while the enumeration at L55942 names eleven — emergency pause and emergency resume are separate entries.',
    resolution:
      'Build the eleven (D12). A routing table short by one silently drops a root approval, and the discrepancy is printed beside the table rather than quietly reconciled.',
  },
  {
    topic: 'Who may Return a request',
    conflict:
      'L21050 grants Return to the root and the Admin. L23707 and L55918 grant it to the Admin alone.',
    resolution:
      'The Admin alone — the narrower grant, and the one the two later passages agree on. The root is not left without a route: it approves, or it declines a critical request.',
  },
  {
    topic: 'Which screen numbers name this module',
    conflict:
      'The 26-screen inventory numbers this module SCR-SA-12 and SCR-SA-13 (L42804, L42805); the 22-row screen register numbers the same panes SCR-SA-09 and SCR-SA-10 (L48738, L48739) and adds a console access screen the other inventory has no row for, SCR-SA-01 Console sign-in (L48730).',
    resolution:
      'Names are canonical and every number is an annotation (D1). This route is keyed on the module slug, so a ticket citing either scheme still resolves.',
  },
] as const satisfies readonly SourceConflict[]
