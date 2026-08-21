/**
 * The Delivery Operations Hub object model — Job, Run, Assignment, Execution
 * Summary — and everything the kernel needs to know about a `HubCommand`.
 *
 * WHY THE KERNEL-FACING HALF LIVES HERE AND NOT IN `src/kernel/reduce.ts`.
 * `reduce.ts` holds one `Record<ScenarioCommand['type'], CommandSpec>` and
 * four exhaustive switches. Adding twelve members to `ScenarioCommand` the
 * obvious way means forty-eight new branches in a file that is nobody's
 * module. Instead, `isHubCommand` (`@/domain/commands`) narrows the whole
 * family in ONE branch at each of those five sites, and every Hub-specific
 * fact — access rule, action class, validation, state change — is here,
 * beside the records it is about.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT CONTAIN.
 * - No approval gate. `evaluateAccess` already carries `makerCheckerOf`, and
 *   `DOH_APPROVE_JOB` feeds it. A second segregation-of-duties check would
 *   be a second spelling of a working mechanism.
 * - No package-validity gate. `evaluateAccess` already carries
 *   `requiresValidPackage`/`packageValid`, and `DOH_ASSIGN_WORKER` feeds it.
 * - No permission matrices. The five-column matrices at L27692-L27707,
 *   L27907-L27920, L28117-L28126 and L28298-L28314 belong to the module
 *   tasks. The `access` blocks below carry only the role columns the kernel
 *   must enforce to dispatch, each citing the row it came from so the two
 *   are cross-checkable rather than divergent.
 * - No Job-Owner logic. That is `./job-owner`, shared with the modules.
 * - No fallback prose. That is `./fallbacks`, keyed by identifier, so a
 *   command cannot loosen a §19.2 pattern by paraphrasing it.
 */

import type { HubCommand } from '@/domain/commands'
import type { TenantId } from '@/domain/ids'
import type { SurfaceId } from '@/domain/surfaces'
import { tenantPartition, withTenant, type ScenarioDomainState } from '@/domain/state'
import type { AccessRequest } from '@/policy/evaluate'
import type { ActionClass } from '@/persistence/capability'
import { fallbackPattern, type FallbackPatternId } from './fallbacks'
import { jobOwnerVerdict } from './job-owner'

/* ==================================================================== *
 * THE FOUR RECORDS
 * ==================================================================== */

/**
 * §4.5.2 / L7151: `draft → pending_approval → active → archived`. Four
 * states, no fifth. "Archival is soft: historical runs are retained under
 * the tenant's retention horizon and un-archive is supported" (L7151), so
 * `archived` is reversible and is not a terminal state.
 */
export type JobState = 'draft' | 'pending_approval' | 'active' | 'archived'

export const JOB_STATES = [
  'draft',
  'pending_approval',
  'active',
  'archived',
] as const satisfies readonly JobState[]

type MissingFromJobStates = Exclude<JobState, (typeof JOB_STATES)[number]>
const _jobStatesExhaustive: MissingFromJobStates extends never ? true : never = true
void _jobStatesExhaustive

export interface JobRecord {
  readonly jobId: string
  readonly name: string
  readonly jobTypeId: string
  /** DEC-AREA-001 option (b): one parent node at the tenant's configured depth. */
  readonly parentNodeId: string
  /**
   * THE JOB OWNER FIELD. L27652: "Job Owner is a field on the Job, not a
   * role ... It confers no permissions ... It defaults to the creator and is
   * reassignable." It is a plain identity id sitting beside `name` and
   * `jobTypeId`, not a member of any role type, and `./job-owner` is the only
   * thing that reads it for a decision.
   */
  readonly ownerId: string
  readonly state: JobState
  /**
   * L27656: "Segregation of duties is absolute: the user who creates a Job
   * cannot approve that same Job." Kept
   * on the record so the approval gate has a maker to compare against long
   * after the creating session has ended.
   *
   * There is deliberately NO `approvedBy` beside it. The approver's identity
   * is already on the audit record the kernel writes for
   * `DOH_APPROVE_JOB` — a copy here would be a mutable duplicate of an
   * append-only fact, and the two would eventually disagree.
   */
  readonly createdBy: string
}

/**
 * §4.6.8, L27862 and the closing-state table at L27876-L27880. Execution
 * states are `scheduled` and `in_progress`, "with cancelled as the terminal
 * alternative at any point before submission"; then the settled three-state
 * closing sequence `submitted → complete → finished`. "The word for the
 * final state is `finished` — records close; nothing on the platform is
 * 'sealed'."
 *
 * DEC-RUNSTATE-001 IS NOT SETTLED HERE. Three Parts define `submitted` and
 * `complete` differently (card L5242-L5251): Reading A (§2.4) makes
 * `submitted` a per-worker device event, so a three-worker run passes
 * through it three times; Readings B (§4.6.8) and C (§6.2.6) make it a
 * run-level state reached once, and B and C then disagree about whether
 * `complete` means "the Summary is computed" or "every device has synced".
 * All three readings agree these SIX NAMES exist, and that is the only part
 * this list asserts. The recommendation on the card — a third name,
 * `worker-submitted` — is a client decision and is deliberately absent: an
 * extra state added here would settle DEC-RUNSTATE-001 by shipping it. The
 * disclosure belongs to the MOD-DOH-06 task.
 */
export type RunState =
  | 'scheduled'
  | 'in_progress'
  | 'cancelled'
  | 'submitted'
  | 'complete'
  | 'finished'

export const RUN_STATES = [
  'scheduled',
  'in_progress',
  'cancelled',
  'submitted',
  'complete',
  'finished',
] as const satisfies readonly RunState[]

type MissingFromRunStates = Exclude<RunState, (typeof RUN_STATES)[number]>
const _runStatesExhaustive: MissingFromRunStates extends never ? true : never = true
void _runStatesExhaustive

export interface RunRecord {
  readonly runId: string
  /**
   * §4.6.1: the Run record "denormalises `tenant_id`, `site_id`, `area_id`,
   * `shift_id` and `job_id` by deliberate design", so a later change
   * upstream cannot silently alter a historical record.
   */
  readonly jobId: string
  /** §4.6.2: the Shift's NOMINAL date, so a run crossing midnight still reports coherently. */
  readonly productionDate: string
  /** §4.6.1 reserves four values; §4.6.2 permits only `manual` at V1. */
  readonly runSource: 'manual'
  readonly state: RunState
  /** §4.6.5: a categorised reason is mandatory on cancellation. */
  readonly cancellationReasonCode: string | null
  readonly cancellationNote: string | null
}

/**
 * §4.6.3 and §4.6.7. There is no assignment state machine in the source and
 * none is invented here: an assignment either stands or has been superseded
 * by a substitution, and "pre-substitution steps remain attributed to the
 * original worker", so the superseded record is kept rather than rewritten.
 *
 * There is deliberately no `available` or `doubleBooked` field: §4.6.3 says
 * "There is no availability or double-booking check beyond the qualification
 * check at V1", and MOD-DOH-07 row 8 (L28126) answers `Not applicable` in
 * all five columns. A nullable field for a deferred capability invents the
 * entity the source says does not exist.
 */
export interface AssignmentRecord {
  readonly assignmentId: string
  readonly runId: string
  readonly workerId: string
  /** §4.6.1: pinned at assignment, immutable for the life of the run. */
  readonly packageRef: string
  /** The assignment id that replaced this one, or null while it stands. */
  readonly supersededBy: string | null
  readonly substitutionReason: string | null
}

/** §4.7.3 and §3.3: three severities, fixed. */
export type AnomalySeverity = 'Info' | 'Concern' | 'Critical'

export const ANOMALY_SEVERITIES = [
  'Info',
  'Concern',
  'Critical',
] as const satisfies readonly AnomalySeverity[]

type MissingFromSeverities = Exclude<AnomalySeverity, (typeof ANOMALY_SEVERITIES)[number]>
const _severitiesExhaustive: MissingFromSeverities extends never ? true : never = true
void _severitiesExhaustive

/** §4.7.3: "an Open to Resolved lifecycle". Two states. */
export type AnomalyState = 'Open' | 'Resolved'

export interface AnomalyRecord {
  readonly anomalyId: string
  readonly severity: AnomalySeverity
  readonly state: AnomalyState
  /** §4.7.3: "Resolution requires a brief closure note". Null while Open. */
  readonly closureNote: string | null
}

export interface SummaryAnnotation {
  readonly annotationId: string
  readonly text: string
}

/**
 * §4.7.1: the Execution Summary is "**a computed view, not a stored
 * document**", generated when the run reaches `complete` and recomputed as
 * late data lands inside the finish window.
 *
 * So this record holds ONLY what is genuinely stored: the anomaly register
 * and the append-only correction annotations. There are no computed figures
 * here, because a figure stored here would be the stored document §4.7.1
 * says the Summary is not — and a stale copy of a recomputing view is
 * exactly the "stale data presented as current" that every §19.2 pattern
 * forbids.
 *
 * §4.7.4: corrections after `finished` are append-only; "the original stays
 * immutable". `annotations` is therefore only ever appended to, and there is
 * no command that edits or removes one.
 */
export interface ExecutionSummaryRecord {
  readonly summaryId: string
  readonly runId: string
  readonly anomalies: readonly AnomalyRecord[]
  readonly annotations: readonly SummaryAnnotation[]
}

/* ==================================================================== *
 * PARTITION KEYS
 * ==================================================================== */

/**
 * One prefix per record family, matching the existing `lot:` convention in
 * `src/kernel/reduce.ts`. Centralised so two modules cannot key the same
 * record differently — which would give one tenant two Jobs with one id.
 */
export const objectKey = {
  job: (jobId: string) => `job:${jobId}`,
  run: (runId: string) => `run:${runId}`,
  assignment: (assignmentId: string) => `assignment:${assignmentId}`,
  summary: (summaryId: string) => `summary:${summaryId}`,
} as const

/**
 * CRITICAL 1(a): goes through `tenantPartition` (Object.hasOwn-based), never
 * `state.tenants[...]`, so a tenant id spelling `constructor` or
 * `__proto__` reports as absent instead of resolving to an inherited
 * Object.prototype member. Same reasoning as `currentLotState` in the
 * kernel; the reason it is repeated is that a new reader of a new record
 * family is exactly who would index directly.
 */
function readObject<T>(
  state: ScenarioDomainState,
  tenant: TenantId,
  key: string,
  guard: (value: object) => boolean,
): T | undefined {
  const found = tenantPartition(state, tenant)?.objects[key]
  if (found && typeof found === 'object' && guard(found)) return found as T
  return undefined
}

export function readJob(
  state: ScenarioDomainState,
  tenant: TenantId,
  jobId: string,
): JobRecord | undefined {
  return readObject<JobRecord>(state, tenant, objectKey.job(jobId), (v) => 'ownerId' in v)
}

export function readRun(
  state: ScenarioDomainState,
  tenant: TenantId,
  runId: string,
): RunRecord | undefined {
  return readObject<RunRecord>(state, tenant, objectKey.run(runId), (v) => 'runSource' in v)
}

export function readSummary(
  state: ScenarioDomainState,
  tenant: TenantId,
  summaryId: string,
): ExecutionSummaryRecord | undefined {
  return readObject<ExecutionSummaryRecord>(
    state,
    tenant,
    objectKey.summary(summaryId),
    (v) => 'anomalies' in v,
  )
}

/* ==================================================================== *
 * WHAT THE KERNEL ASKS
 * ==================================================================== */

/** The `CommandSpec` shape `src/kernel/reduce.ts` keys by command type. */
export interface HubCommandSpec {
  readonly access: Omit<
    AccessRequest,
    'action' | 'resourceTenant' | 'objectState' | 'allowedObjectStates'
  >
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly firstFallback: string | null
  readonly fallbackFailure: string | null
  readonly terminalSafeState: string | null
  /** Which §19.2 pattern the three strings above were read from. */
  readonly fallbackPatternId: FallbackPatternId
  readonly actionClass: ActionClass
}

/**
 * The three role sets the Hub matrices actually use, named once. Not a
 * hierarchy: `DEC-PLUS-001` (L13456) records that "and above" across five
 * additive, non-hierarchical roles is undefined, so these are enumerations.
 */
const SUPERVISOR_ONLY = ['SUPERVISOR'] as const
const TENANT_ADMIN_AND_SUPERVISOR = ['TENANT_ADMIN', 'SUPERVISOR'] as const
const QUALITY_MANAGER_ONLY = ['QUALITY_MANAGER'] as const

/**
 * The three roles MOD-DOH-05 row 10 (L27703) and MOD-DOH-16 row 5 (L29617)
 * name, each cell reading `Allowed with conditions` — only where that role
 * IS the Job Owner. This list is the set of roles the condition can apply
 * TO; it is not a grant. `hubAccessRequest` hands it over only when
 * `jobOwnerVerdict` says the Job's owner field names the actor, and hands
 * over the empty list otherwise.
 */
const OWNER_CONDITIONED_ROLES = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const

/** Both owner-gated rows prohibit these two outright, owner or not. */
const OWNER_ROW_PROHIBITED = ['READONLY_AUDITOR', 'WORKER'] as const

function spec(
  patternId: FallbackPatternId,
  actionClass: ActionClass,
  access: HubCommandSpec['access'],
  affectedSurfaces: HubCommandSpec['affectedSurfaces'] = ['SURF-DOH'],
): HubCommandSpec {
  // The three narrative strings are READ from §19.2, never written here.
  // A command that wants a different terminal safe state has to name a
  // different pattern, which is visible; paraphrasing one is not.
  const pattern = fallbackPattern(patternId)
  return {
    access,
    affectedSurfaces,
    firstFallback: pattern.firstFallback,
    fallbackFailure: pattern.fallbackFailure,
    terminalSafeState: pattern.terminalSafeState,
    fallbackPatternId: patternId,
    actionClass,
  }
}

/**
 * MOD-DOH-08's identity card (L28294) names `FB-DOH-COMPUTE-006` primary,
 * `FB-DOH-EXPORT-009` for the export and `FB-DOH-NOTIF-004` for
 * notifications — and NO write pattern. The three sibling cards all name one
 * (L27688, L27903, L28113 each say `FB-DOH-WRITE-002`), so this card is the
 * only Hub card in the four that omits it.
 *
 * THE COUNT, RE-DERIVED. This comment used to say "rows 6 and 10 are both
 * writes", which is not the card's write surface — it is the subset of it
 * that this FILE gives a Hub command. Counted off the matrix at L28298
 * (header), L28299 (separator), L28300-L28314 (fifteen data rows), **FIVE**
 * rows are writes this surface carries: the five in `MOD_DOH_08_WRITE_ROWS`.
 * The other ten are not, each for its own reason, and the reasons are what
 * make the count checkable rather than asserted:
 *
 * - rows 1, 2 and 7 are reads — "View an Execution Summary", "Work the
 *   review queue", "View the Anomaly Register";
 * - row 12 is the export the card ALREADY names `FB-DOH-EXPORT-009` for;
 * - rows 9 and 11 read `Explicitly prohibited` in all five columns, so no
 *   role holds a write to fall back from;
 * - rows 13 and 15 read `Not applicable — deferred beyond V1` in all five;
 * - rows 5 and 8 are writes on ANOTHER SURFACE — anomaly-severity
 *   reclassification and the Severity 1 lot-hold release, which is Client
 *   Command Center action 4 and reads `Allowed` at L28307. `MOD-DOH-08`'s own
 *   matrix classifies both `another-surface`, and a Hub write pattern over an
 *   act the Hub does not perform would be a second false claim.
 *
 * Getting the count wrong understated the gap rather than overstating it, so
 * the conclusion is unchanged and now rests on the whole card: the gap is in
 * the source, not closed by guessing a fourth identifier for it.
 * `FB-DOH-WRITE-002` is the register's own pattern for "a master-data or
 * configuration write fails", it is what every other write-bearing Hub card
 * names, and naming it is recorded here rather than made to look like a card
 * citation.
 */
const MOD_DOH_08_WRITE_PATTERN: FallbackPatternId = 'FB-DOH-WRITE-002'

/**
 * The five, with the row that carries each and one column that holds it.
 * Exported because a count stated in a comment cannot go red:
 * `tests/unit/doh-objects.test.ts` reads every line below out of the frozen
 * source and re-counts the span, so this list cannot drift from §19.10
 * without failing.
 *
 * `command` names the Hub command this file dispatches for the row, or
 * `null`. Two of the five have one — which is exactly the pair the old
 * comment mistook for the whole write surface. The other three are writes
 * `MOD-DOH-08` renders and this slice gives no kernel command: rows 3 and 4
 * belong to the module task, and row 14 is a tenant setting made on
 * `SCR-DOH-23` in the tenant administration area, which is slice 12's.
 */
export const MOD_DOH_08_WRITE_ROWS = [
  {
    ordinal: 3,
    sourceRef: 'L28302',
    control: 'Mark a Summary reviewed',
    heldBy: 'QUALITY_MANAGER',
    command: null,
  },
  {
    ordinal: 4,
    sourceRef: 'L28303',
    control: 'Flag an anomaly',
    heldBy: 'QUALITY_MANAGER',
    command: null,
  },
  {
    ordinal: 6,
    sourceRef: 'L28305',
    control: 'Resolve an anomaly',
    heldBy: 'QUALITY_MANAGER',
    command: 'DOH_RESOLVE_ANOMALY',
  },
  {
    ordinal: 10,
    sourceRef: 'L28309',
    control: 'Add a correction annotation',
    heldBy: 'QUALITY_MANAGER',
    command: 'DOH_ANNOTATE_SUMMARY',
  },
  {
    ordinal: 14,
    sourceRef: 'L28313',
    control: 'Set the review toggle',
    heldBy: 'TENANT_ADMIN',
    command: null,
  },
] as const

export const HUB_COMMAND_SPECS: Readonly<Record<HubCommand['type'], HubCommandSpec>> = {
  // ---- Job, MOD-DOH-05. Card L27688: WRITE-002 primary. ----

  // Row 1, L27694: Tenant Admin `Allowed with conditions`, Supervisor
  // `Allowed with conditions` — own Area scope. The suspension condition on
  // both cells is already the feature-and-suspension stage of evaluateAccess.
  DOH_CREATE_JOB: spec('FB-DOH-WRITE-002', 'lifecycleChange', {
    allowedRoles: TENANT_ADMIN_AND_SUPERVISOR,
    deniedRoles: ['QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'],
    sourceRefs: ['MOD-DOH-05 row 1', 'L27694', '§4.5.1', 'L27652'],
  }),

  // Row 3, L27696.
  DOH_SUBMIT_JOB_FOR_APPROVAL: spec('FB-DOH-WRITE-002', 'lifecycleChange', {
    allowedRoles: TENANT_ADMIN_AND_SUPERVISOR,
    deniedRoles: ['QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'],
    sourceRefs: ['MOD-DOH-05 row 3', 'L27696', '§4.5.2'],
  }),

  // Row 4, L27697. The Quality Manager cell is `Allowed with conditions` —
  // never a Job the same identity created, which is `makerCheckerOf` and is
  // supplied per instance by `hubAccessRequest` below.
  //
  // TENANT_ADMIN APPEARS IN NEITHER LIST, ON PURPOSE. Its cell reads
  // "`Explicitly prohibited` unless the Tenant Admin also holds an approver
  // role and did not create it" — a prohibition carrying a permissive
  // escape. Putting TENANT_ADMIN in `deniedRoles` would assert the
  // prohibition and delete the escape; putting it in `allowedRoles` would
  // assert the escape and delete the prohibition. The escape also depends on
  // an identity holding two roles at once, and `IdentitySimulationState.role`
  // is singular, so this build cannot represent its precondition at all.
  // Absent from both lists, a Tenant Admin is refused ROLE_NOT_GRANTED —
  // "no role on this row grants you this" — which asserts neither half. The
  // C1 disclosure of the row belongs to the MOD-DOH-05 task.
  DOH_APPROVE_JOB: spec('FB-DOH-WRITE-002', 'approval', {
    allowedRoles: QUALITY_MANAGER_ONLY,
    deniedRoles: ['SUPERVISOR', 'READONLY_AUDITOR', 'WORKER'],
    sourceRefs: ['MOD-DOH-05 rows 4 and 5', 'L27697', 'L27698', '§4.5.2', '§4.8.4'],
  }),

  // Row 9, L27702: Tenant Admin `Allowed`, Supervisor `Allowed with
  // conditions` — own scope. L27652: the field "is reassignable".
  DOH_REASSIGN_JOB_OWNER: spec('FB-DOH-WRITE-002', 'lifecycleChange', {
    allowedRoles: TENANT_ADMIN_AND_SUPERVISOR,
    deniedRoles: ['QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'],
    sourceRefs: ['MOD-DOH-05 row 9', 'L27702', 'L27652'],
  }),

  // Row 10, L27703. `allowedRoles` here is the UNCONDITIONED shape and is
  // overwritten per instance by `hubAccessRequest`, which narrows it to the
  // empty list unless the Job's owner field names the actor.
  DOH_DECIDE_VERSION_ADOPTION: spec('FB-DOH-WRITE-002', 'lifecycleChange', {
    allowedRoles: OWNER_CONDITIONED_ROLES,
    deniedRoles: OWNER_ROW_PROHIBITED,
    sourceRefs: ['MOD-DOH-05 row 10', 'L27703', 'L27652 (Job Owner is a field, not a role)'],
  }),

  // MOD-DOH-16 row 5, L29617. Card L29607: NOTIF-004 for the review flag.
  DOH_ACT_ON_PAIRED_REVIEW_FLAG: spec('FB-DOH-NOTIF-004', 'lifecycleChange', {
    allowedRoles: OWNER_CONDITIONED_ROLES,
    deniedRoles: OWNER_ROW_PROHIBITED,
    sourceRefs: [
      'MOD-DOH-16 rows 4 and 5',
      'L29616',
      'L29617',
      'CONTRADICTION-MOD-DOH-16-TENANT-ADMIN-REVIEW-FLAG',
    ],
  }),

  // ---- Run, MOD-DOH-06. Card L27903. ----

  // Row 1, L27909: Tenant Admin `Explicitly prohibited` — run creation is
  // supervisor-driven. Every other column prohibits too.
  DOH_SCHEDULE_RUN: spec('FB-DOH-WRITE-002', 'lifecycleChange', {
    allowedRoles: SUPERVISOR_ONLY,
    deniedRoles: ['TENANT_ADMIN', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'],
    sourceRefs: ['MOD-DOH-06 row 1', 'L27909', '§4.6.2'],
  }),

  // Row 3, L27911. Card L27903: "CMD-003 for cancellation and substitution
  // delivery" — cancellation has to reach the devices holding the run.
  DOH_CANCEL_RUN: spec(
    'FB-DOH-CMD-003',
    'lifecycleChange',
    {
      allowedRoles: ['SUPERVISOR', 'QUALITY_MANAGER'],
      deniedRoles: ['TENANT_ADMIN', 'READONLY_AUDITOR', 'WORKER'],
      sourceRefs: ['MOD-DOH-06 row 3', 'L27911', '§4.6.5'],
    },
    ['SURF-DOH', 'SURF-FL'],
  ),

  // ---- Assignment, MOD-DOH-07. Card L28113: WRITE-002 for assignment
  // writes; CMD-003 for reassignment and substitution delivery. ----

  // Row 1, L28119. `requiresValidPackage` is the EXISTING run-pin mechanism
  // in evaluateAccess; §4.6.1 fixes the version contract at this moment.
  DOH_ASSIGN_WORKER: spec(
    'FB-DOH-WRITE-002',
    'lifecycleChange',
    {
      allowedRoles: SUPERVISOR_ONLY,
      deniedRoles: ['TENANT_ADMIN', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'],
      requiresValidPackage: true,
      sourceRefs: ['MOD-DOH-07 row 1', 'L28119', '§4.6.1', '§4.6.3'],
    },
    ['SURF-DOH', 'SURF-FL'],
  ),

  // MOD-DOH-06 row 5 (L27913) and MOD-DOH-07 row 3 (L28121) are the same
  // act, stated in both modules with identical cells.
  DOH_SUBSTITUTE_WORKER: spec(
    'FB-DOH-CMD-003',
    'lifecycleChange',
    {
      allowedRoles: SUPERVISOR_ONLY,
      deniedRoles: ['TENANT_ADMIN', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'],
      sourceRefs: ['MOD-DOH-06 row 5', 'L27913', 'MOD-DOH-07 row 3', 'L28121', '§4.6.7'],
    },
    ['SURF-DOH', 'SURF-FL'],
  ),

  // ---- Execution Summary, MOD-DOH-08. Card L28294. ----

  // Row 6, L28305: Quality Manager `Allowed with conditions` — closure note
  // mandatory. Every other column `Explicitly prohibited`.
  DOH_RESOLVE_ANOMALY: spec(MOD_DOH_08_WRITE_PATTERN, 'durableEvidence', {
    allowedRoles: QUALITY_MANAGER_ONLY,
    deniedRoles: ['TENANT_ADMIN', 'SUPERVISOR', 'READONLY_AUDITOR', 'WORKER'],
    sourceRefs: ['MOD-DOH-08 row 6', 'L28305', '§4.7.3'],
  }),

  // Row 10, L28309: Quality Manager `Allowed with conditions` — append-only.
  //
  // WORKER APPEARS IN NEITHER LIST. The row's Worker cell reads `Allowed
  // with conditions` — a worker correction after submission is an append-only
  // annotation. That act happens on SURF-FL, on a device; under D11 the
  // Worker reaches no Hub screen at all (`app/hub/HubShell.tsx`), so a Hub
  // command is not the path for it. Denying the Worker here would assert
  // that the source prohibits a correction it explicitly allows; allowing it
  // would put a Worker on a Hub surface. Absent from both, the Hub refuses
  // ROLE_NOT_GRANTED and the SURF-FL half stays untouched. The C1 disclosure
  // belongs to the MOD-DOH-08 task.
  DOH_ANNOTATE_SUMMARY: spec(MOD_DOH_08_WRITE_PATTERN, 'durableEvidence', {
    allowedRoles: QUALITY_MANAGER_ONLY,
    deniedRoles: ['TENANT_ADMIN', 'SUPERVISOR', 'READONLY_AUDITOR'],
    sourceRefs: ['MOD-DOH-08 row 10', 'L28309', '§4.7.4'],
  }),
}

/** Every Hub command is tenant-scoped; there is no platform-scoped Hub act. */
export function hubCommandTenant(command: HubCommand): TenantId {
  return command.tenant
}

export function hubActionClass(command: HubCommand): ActionClass {
  return HUB_COMMAND_SPECS[command.type].actionClass
}

/**
 * The per-instance access request: the static role rule from the spec, plus
 * the fields that can only be known for THIS command against THIS state.
 *
 * THE JOB-OWNER GATE IS HERE, AND IT IS NOT A NEW STAGE OF `evaluateAccess`.
 * L27703 and L29617 state every role cell on those rows as conditional —
 * `Allowed with conditions` — only where that role IS the Job Owner. So when
 * the Job's owner field does not name the actor, the row grants the act to
 * NO role, and `allowedRoles` is the empty list. That refuses at
 * ROLE_NOT_GRANTED with `sourceRefs` naming the owner field, using the
 * evaluator exactly as it already is.
 *
 * The alternative — a `JOB_OWNER` entry in an allow-list — is the escalation
 * the source closes: it would grant across every Job at once. `./job-owner`
 * makes that unrepresentable; this function is where the representable
 * version is used.
 */
export function hubAccessRequest(
  command: HubCommand,
  state: ScenarioDomainState,
  actorOfRecord: string | null,
): Omit<AccessRequest, 'action'> {
  const base = HUB_COMMAND_SPECS[command.type].access
  const scoped = { ...base, resourceTenant: command.tenant }

  switch (command.type) {
    case 'DOH_APPROVE_JOB':
      // The EXISTING segregation-of-duties mechanism. Nothing new.
      return {
        ...scoped,
        makerCheckerOf: command.createdBy,
        allowedObjectStates: ['pending_approval'],
        ...objectStateOf(readJob(state, command.tenant, command.jobId)?.state),
      }

    case 'DOH_SUBMIT_JOB_FOR_APPROVAL':
      return {
        ...scoped,
        allowedObjectStates: ['draft'],
        ...objectStateOf(readJob(state, command.tenant, command.jobId)?.state),
      }

    case 'DOH_DECIDE_VERSION_ADOPTION':
    case 'DOH_ACT_ON_PAIRED_REVIEW_FLAG':
      return ownerConditioned(scoped, state, command.tenant, command.jobId, actorOfRecord)

    case 'DOH_CANCEL_RUN':
      // §4.6.5 read against the closing lifecycle at L27874: cancellation is
      // "the terminal alternative at any point before submission", so a run
      // that has already submitted cannot be cancelled.
      return {
        ...scoped,
        allowedObjectStates: ['scheduled', 'in_progress'],
        ...objectStateOf(readRun(state, command.tenant, command.runId)?.state),
      }

    default:
      return scoped
  }
}

/**
 * `exactOptionalPropertyTypes` is on: an absent record must contribute NO
 * `objectState` key rather than `objectState: undefined`, so the object-state
 * stage fails closed on a declared `allowedObjectStates` exactly as it does
 * for a lot that was never recorded.
 */
function objectStateOf(state: string | undefined): { objectState?: string } {
  return state === undefined ? {} : { objectState: state }
}

function ownerConditioned(
  scoped: Omit<AccessRequest, 'action'>,
  state: ScenarioDomainState,
  tenant: TenantId,
  jobId: string,
  actorOfRecord: string | null,
): Omit<AccessRequest, 'action'> {
  const job = readJob(state, tenant, jobId)
  // A Job that is not in this tenant's partition has no owner field to read.
  // Fail closed: no role is granted, and say so rather than reporting a
  // missing record as a role problem.
  if (job === undefined || actorOfRecord === null) {
    return {
      ...scoped,
      allowedRoles: [],
      sourceRefs: [
        ...scoped.sourceRefs,
        `The Job Owner field on ${jobId} could not be read, so the condition every cell on this row carries cannot be satisfied.`,
      ],
    }
  }
  const verdict = jobOwnerVerdict(job, actorOfRecord)
  return {
    ...scoped,
    allowedRoles: verdict.held ? scoped.allowedRoles : [],
    sourceRefs: [...scoped.sourceRefs, verdict.reason],
  }
}

/**
 * Field-value validation only. Anything that is a permission question stays
 * in `hubAccessRequest`, because the gateway reports a validation failure and
 * a policy refusal as different categories and a reader is shown which.
 */
export function validateHubCommand(command: HubCommand): string | null {
  const blank = (label: string, value: string) =>
    value.trim() === '' ? `${label} is required.` : null

  switch (command.type) {
    case 'DOH_CREATE_JOB':
      return (
        blank('A Job name', command.name) ??
        blank('A Job Type', command.jobTypeId) ??
        blank('A parent-node binding', command.parentNodeId) ??
        // L27652: the field "defaults to the creator". A Job with no owner
        // has nowhere to route a version-adoption decision or a paired-Job
        // change flag, which is what the field exists for.
        blank('A Job Owner', command.ownerId)
      )
    case 'DOH_REASSIGN_JOB_OWNER':
      return blank('A new Job Owner', command.newOwnerId)
    case 'DOH_CANCEL_RUN':
      // §4.6.5: "Cancellation requires a categorised reason from a fixed
      // list plus OPTIONAL free text." The note is not checked, deliberately.
      return blank('A categorised cancellation reason', command.reasonCode)
    case 'DOH_SUBSTITUTE_WORKER':
      return (
        blank('A substitution reason', command.reason) ??
        (command.outgoingWorkerId === command.incomingWorkerId
          ? 'A worker cannot be substituted for themselves.'
          : null)
      )
    case 'DOH_ASSIGN_WORKER':
      return blank('A pinned work package', command.packageRef)
    case 'DOH_RESOLVE_ANOMALY':
      // §4.7.3: "Resolution requires a brief closure note ... because
      // auditors require evidence of resolution, not just of detection."
      return blank('A closure note', command.closureNote)
    case 'DOH_ANNOTATE_SUMMARY':
      return blank('Annotation text', command.text)
    case 'DOH_ACT_ON_PAIRED_REVIEW_FLAG':
      return blank('A note', command.note)
    case 'DOH_SUBMIT_JOB_FOR_APPROVAL':
    case 'DOH_APPROVE_JOB':
    case 'DOH_DECIDE_VERSION_ADOPTION':
    case 'DOH_SCHEDULE_RUN':
      return null
  }
}

/** Write one object into the tenant's partition, leaving every sibling alone. */
function putObject(
  state: ScenarioDomainState,
  tenant: TenantId,
  key: string,
  value: unknown,
): ScenarioDomainState {
  return withTenant(state, tenant, (p) => ({ ...p, objects: { ...p.objects, [key]: value } }))
}

/**
 * The state change. Reached only after `evaluateAccess` accepted, so nothing
 * here re-checks a permission — a second check here would be a second place
 * a permission could be spelled differently.
 */
export function applyHubCommand(
  state: ScenarioDomainState,
  command: HubCommand,
): ScenarioDomainState {
  const { tenant } = command

  switch (command.type) {
    case 'DOH_CREATE_JOB': {
      const job: JobRecord = {
        jobId: command.jobId,
        name: command.name,
        jobTypeId: command.jobTypeId,
        parentNodeId: command.parentNodeId,
        ownerId: command.ownerId,
        state: 'draft',
        // L27652: the Job Owner field "defaults to the creator". At creation
        // the two are the same value; they diverge the moment
        // `DOH_REASSIGN_JOB_OWNER` runs, and only `ownerId` moves.
        createdBy: command.ownerId,
      }
      return putObject(state, tenant, objectKey.job(command.jobId), job)
    }

    case 'DOH_SUBMIT_JOB_FOR_APPROVAL':
      return withJob(state, tenant, command.jobId, (j) => ({ ...j, state: 'pending_approval' }))

    case 'DOH_APPROVE_JOB':
      return withJob(state, tenant, command.jobId, (j) => ({ ...j, state: 'active' }))

    case 'DOH_REASSIGN_JOB_OWNER':
      // The ONLY write to the owner field. L27652: it is reassignable, and
      // `createdBy` is untouched — the maker-checker comparison must keep
      // pointing at whoever actually created the Job, not at whoever owns it
      // now, or reassigning the owner would launder a segregation-of-duties
      // breach.
      return withJob(state, tenant, command.jobId, (j) => ({ ...j, ownerId: command.newOwnerId }))

    case 'DOH_DECIDE_VERSION_ADOPTION':
    case 'DOH_ACT_ON_PAIRED_REVIEW_FLAG':
      // Both are routing acts on a Job that is otherwise unchanged: the
      // decision and the flag acknowledgement are already carried by the
      // event and audit ledger records the kernel writes from the command
      // itself. Storing a second copy on the Job would be a stored duplicate
      // of an append-only record.
      return state

    case 'DOH_SCHEDULE_RUN': {
      const run: RunRecord = {
        runId: command.runId,
        jobId: command.jobId,
        productionDate: command.productionDate,
        runSource: command.runSource,
        state: 'scheduled',
        cancellationReasonCode: null,
        cancellationNote: null,
      }
      return putObject(state, tenant, objectKey.run(command.runId), run)
    }

    case 'DOH_CANCEL_RUN': {
      const run = readRun(state, tenant, command.runId)
      if (run === undefined) return state
      const cancelled: RunRecord = {
        ...run,
        state: 'cancelled',
        cancellationReasonCode: command.reasonCode,
        cancellationNote: command.note,
      }
      return putObject(state, tenant, objectKey.run(command.runId), cancelled)
    }

    case 'DOH_ASSIGN_WORKER': {
      const assignment: AssignmentRecord = {
        assignmentId: command.assignmentId,
        runId: command.runId,
        workerId: command.workerId,
        packageRef: command.packageRef,
        supersededBy: null,
        substitutionReason: null,
      }
      return putObject(state, tenant, objectKey.assignment(command.assignmentId), assignment)
    }

    case 'DOH_SUBSTITUTE_WORKER': {
      const outgoing = readObject<AssignmentRecord>(
        state,
        tenant,
        objectKey.assignment(command.assignmentId),
        (v) => 'packageRef' in v,
      )
      if (outgoing === undefined) return state
      // §4.6.7: "Pre-substitution steps remain attributed to the original
      // worker." The outgoing record is marked superseded, never rewritten
      // to name the incoming worker, and the incoming assignment carries the
      // SAME `packageRef` — §4.6.1's pin is immutable for the life of the
      // run, so a substitution cannot re-pin it.
      const incomingId = `${command.assignmentId}:sub:${command.incomingWorkerId}`
      const incoming: AssignmentRecord = {
        assignmentId: incomingId,
        runId: command.runId,
        workerId: command.incomingWorkerId,
        packageRef: outgoing.packageRef,
        supersededBy: null,
        substitutionReason: command.reason,
      }
      return putObject(
        putObject(state, tenant, objectKey.assignment(command.assignmentId), {
          ...outgoing,
          supersededBy: incomingId,
          substitutionReason: command.reason,
        }),
        tenant,
        objectKey.assignment(incomingId),
        incoming,
      )
    }

    case 'DOH_RESOLVE_ANOMALY': {
      const summary = readSummary(state, tenant, command.summaryId)
      if (summary === undefined) return state
      const resolved: ExecutionSummaryRecord = {
        ...summary,
        anomalies: summary.anomalies.map((a) =>
          a.anomalyId === command.anomalyId
            ? { ...a, state: 'Resolved' as const, closureNote: command.closureNote }
            : a,
        ),
      }
      return putObject(state, tenant, objectKey.summary(command.summaryId), resolved)
    }

    case 'DOH_ANNOTATE_SUMMARY': {
      const summary = readSummary(state, tenant, command.summaryId)
      if (summary === undefined) return state
      // §4.7.4: APPEND ONLY. Spread-then-append; no branch here replaces or
      // removes an existing annotation, and no command exists that could.
      const annotated: ExecutionSummaryRecord = {
        ...summary,
        annotations: [
          ...summary.annotations,
          { annotationId: command.annotationId, text: command.text },
        ],
      }
      return putObject(state, tenant, objectKey.summary(command.summaryId), annotated)
    }
  }
}

function withJob(
  state: ScenarioDomainState,
  tenant: TenantId,
  jobId: string,
  fn: (job: JobRecord) => JobRecord,
): ScenarioDomainState {
  const job = readJob(state, tenant, jobId)
  if (job === undefined) return state
  return putObject(state, tenant, objectKey.job(jobId), fn(job))
}
