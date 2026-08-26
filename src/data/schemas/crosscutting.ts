import { z } from 'zod'
import { NOTIFICATION_STATES, SCHEDULE_DEFINITION_STATES, SCHEDULE_OCCURRENCE_STATES } from '@/domain/vocabularies'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import { Stamp, Role } from './platform'

/**
 * OBJ-060 · Notification (L9203-L9218). Fields L9209. Lifecycle L9211 is
 * the same nineteen-state ladder already declared as `NotificationState` /
 * `NOTIFICATION_STATES` in `@/domain/vocabularies` (measured off source
 * L51605) — reused per controller ruling R2 rather than re-declared.
 * `severity` restates the four labels of `NotificationSeverity` in the same
 * module as plain string literals: zod's `z.enum` needs a value-level array
 * and `NOTIFICATION_LEVEL_ROWS` there mixes severity and priority rows in
 * one table, so there is no single exported array of just the four to
 * import instead.
 */
export const Notification = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  eventId: z.string().nullable(),
  severity: z.enum(['Critical', 'High', 'Medium', 'Informational']),
  recipientRoleIds: z.array(z.string()),
  recipientUserIds: z.array(z.string()),
  channels: z.array(z.enum(['in-app', 'email'])),
  createdAt: Stamp,
  sentAt: Stamp.nullable(),
  deliveredAt: Stamp.nullable(),
  openedAt: Stamp.nullable(),
  acknowledgedBy: z.string().nullable(),
  acknowledgedAt: Stamp.nullable(),
  /**
   * Fix round 1 (review Important 4): OBJ-060's own narrative text states
   * "the human drives acknowledgement, WHICH IS DISTINCT FROM RESOLUTION"
   * and its source classification line requires "acknowledge and resolve
   * be distinct, timestamped states" (L9175, [SoW Fact — §3.9]) -- a
   * `resolved` row with nothing beyond `acknowledgedBy`/`acknowledgedAt`
   * is data-model-indistinguishable from an `acknowledged` row, exactly
   * the "enum value present, case not demonstrated" trap. These two
   * fields are the same shape as the acknowledgement pair, filled only
   * when `status === 'resolved'`, never inferred from `acted`/`reconciled`
   * alone (those are not the same claim as "the matter is closed").
   */
  resolvedBy: z.string().nullable(),
  resolvedAt: Stamp.nullable(),
  fallbackDelivered: z.boolean(),
  deduplicationGroup: z.string().nullable(),
  status: z.enum(NOTIFICATION_STATES),
}).strict()
export type Notification = z.infer<typeof Notification>

/**
 * OBJ-082 · Command (L9772-L9787). Fields L9778: "class, being one of
 * exactly five". Lifecycle L9780 is the same fifteen-state ladder already
 * declared as `CommandState` / `COMMAND_STATES` in `@/ui/ScreenStateBoundary`
 * and `@/surfaces/sa/command-state` — reused per controller ruling R2.
 */
/**
 * OBJ-082's own "parent and child objects" line (L9779): "children are the
 * per-device delivery records" — no separate business object or §3.1
 * collection is given for them, so, matching this file's own
 * `ScheduleDefinitionRow`/`ScheduleOccurrenceRow` and `Event` folding
 * pattern, a Command's per-device delivery records are a nested array on
 * the Command row rather than a second collection. `status` is the same
 * fifteen-state `COMMAND_STATES` ladder with the five states that describe
 * only the CENTRAL, not-yet-targeted lifecycle of the command as a whole
 * (created, authorized, cancelled, superseded, reconciled) excluded via
 * zod's own `.exclude()` rather than a second hand-typed literal array, so
 * this can never drift from `COMMAND_STATES` itself (fix round 1 lesson,
 * applied here from the start): a single device is never itself "created"
 * or "authorized", and "cancelled"/"superseded"/"reconciled" describe the
 * command record's own disposition, not one device's copy of it. This is
 * what lets one command be `applied` on one device and still `queued` (or
 * `delivered`, not yet `applied`) on another — brief pass criterion 2.
 */
const CommandStateEnum = z.enum(COMMAND_STATES)
export const DeviceDeliveryState = CommandStateEnum.exclude([
  'created', 'authorized', 'cancelled', 'superseded', 'reconciled',
])
export type DeviceDeliveryState = z.infer<typeof DeviceDeliveryState>

export const CommandDelivery = z.object({
  deviceId: z.string().min(1),
  status: DeviceDeliveryState,
  /**
   * Every timestamp below is DERIVED from `status`, never drawn
   * independently beside it (the task prompt's own lesson from Task 5's
   * two fix rounds): present exactly when the status it evidences implies
   * it, in strictly increasing order, never on a status that has not
   * reached that point yet.
   */
  deliveredAt: Stamp.nullable(),
  downloadedAt: Stamp.nullable(),
  appliedAt: Stamp.nullable(),
  acknowledgedAt: Stamp.nullable(),
  rejectedReason: z.string().nullable(),
}).strict()
export type CommandDelivery = z.infer<typeof CommandDelivery>

export const Command = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  class: z.enum([
    'lot-release',
    'reassignment-or-substitution',
    'qualification-clearance',
    'suspension',
    'version-change',
  ]),
  targetDeviceId: z.string().nullable(),
  targetFleetTag: z.string().nullable(),
  payloadRef: z.string().min(1),
  issuedBy: z.string().min(1),
  createdAt: Stamp,
  acknowledgedAt: Stamp.nullable(),
  deliveries: z.array(CommandDelivery),
  status: z.enum(COMMAND_STATES),
}).strict()
export type Command = z.infer<typeof Command>

/**
 * `events` folds OBJ-024 · Operational event record (L8207-L8222) with
 * OBJ-083 · Sync event (L9791-L9806): design §3.1 gives one `events`
 * collection, not two, so a row is one or the other, discriminated by
 * `kind`. Operational fields L8214; operational lifecycle L8216: "recorded,
 * uploaded, accepted". Sync fields L9797; sync lifecycle L9799: "attempted,
 * partial, complete, failed".
 */
export const OperationalEvent = z.object({
  id: z.string().min(1),
  kind: z.literal('operational'),
  tenantId: z.string().min(1),
  actorId: z.string().min(1),
  siteId: z.string().nullable(),
  areaId: z.string().nullable(),
  occurredAt: Stamp,
  signalType: z.string().min(1),
  runId: z.string().nullable(),
  stepExecutionId: z.string().nullable(),
  status: z.enum(['recorded', 'uploaded', 'accepted']),
}).strict()
export type OperationalEvent = z.infer<typeof OperationalEvent>

export const SyncEvent = z.object({
  id: z.string().min(1),
  kind: z.literal('sync'),
  deviceId: z.string().min(1),
  attemptedAt: Stamp,
  capturesUploaded: z.number().int().nonnegative(),
  commandsDownloaded: z.number().int().nonnegative(),
  commandsApplied: z.number().int().nonnegative(),
  queueDepthRemaining: z.number().int().nonnegative(),
  clockSkewSeconds: z.number().nullable(),
  status: z.enum(['attempted', 'partial', 'complete', 'failed']),
}).strict()
export type SyncEvent = z.infer<typeof SyncEvent>

export const Event = z.discriminatedUnion('kind', [OperationalEvent, SyncEvent])
export type Event = z.infer<typeof Event>

/**
 * OBJ-084 · Audit event (L9810-L9825). Fields L9816: "actor identity;
 * action; subject record; timestamp; before and after values where
 * applicable; audit class." Lifecycle L9818: "written; there is no further
 * lifecycle" — append-only, no status field.
 *
 * `effectiveRole`, `scope`, `correlationId` and `causationId` are NOT on
 * OBJ-084's own field line above; they are master prompt §19.3's fuller
 * statement of the same object ("Every audit event contains ... actor
 * identity, effective role/grant/scope/qualification, ... correlation/
 * causation/idempotency/sequence ..."), which this task's brief quotes
 * near-verbatim as its own pass criterion 3. Per the runway plan's own
 * rule that the frozen source wins where the two disagree, OBJ-084's field
 * *line* is the shorter of two true statements about the same object, not
 * a competing one — master prompt §19.3 is read here as the fuller
 * specification of the fields the frozen source's audit event already
 * carries in its worked examples (every Bright Bikes audit illustration
 * names an actor acting AS a role, e.g. L9825 "Elena's release"), not as a
 * second, conflicting source. `result` and `denialReason` are the same
 * §19.3 sentence's "action, result, denial/failure reason", giving the
 * "at least one row for ... a denial" pass criterion a structured field to
 * carry rather than requiring it be inferred from `action`'s free text.
 * `scope` reuses the `siteIds`/`areaIds` shape `RoleGrant` already uses for
 * the same idea (a grant's or an action's site/area reach) rather than
 * inventing a second shape for it.
 */
export const Audit = z.object({
  id: z.string().min(1),
  tenantId: z.string().nullable(),
  actorId: z.string().min(1),
  effectiveRole: Role,
  scope: z.object({
    siteIds: z.array(z.string()),
    areaIds: z.array(z.string()),
  }).strict(),
  action: z.string().min(1),
  result: z.enum(['success', 'denied', 'failed']),
  denialReason: z.string().nullable(),
  subjectRef: z.string().min(1),
  occurredAt: Stamp,
  before: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable(),
  after: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable(),
  auditClass: z.string().min(1),
  /** Opaque trace token grouping every row this one causal chain produced across every collection — not a single collection's row id, see index.ts UNCHECKABLE_ID_FIELDS. */
  correlationId: z.string().min(1),
  /** The correlationId (or top-level triggering identifier) of the upstream action that caused this one, where one exists — polymorphic across every collection kind, see index.ts UNCHECKABLE_ID_FIELDS. */
  causationId: z.string().min(1).nullable(),
}).strict()
export type Audit = z.infer<typeof Audit>

/**
 * `schedules` folds the nine scheduler business objects OBJ-091 through
 * OBJ-099 (L10022-L10190) into one collection with two row kinds, matching
 * the split `@/domain/state`'s `ScheduleLedgerRecord` already draws between
 * a rule (`definitionState`) and one moment it produced (`occurrenceState`)
 * — a paused rule has not deleted the moments it already planned. The
 * sub-records OBJ-092 Schedule Revision, OBJ-094 Scheduled Execution
 * Attempt, OBJ-095 Effect Receipt, OBJ-096 Replay/Backfill Request, OBJ-097
 * Scheduler Lease, OBJ-098 Dead-letter Record and OBJ-099 Reconciliation
 * Record are execution-detail objects the frozen source itself gives no
 * screen or index of their own beyond the scheduler's two lifecycles; design
 * §3.1 names one `schedules` collection, not nine, so they are not promoted
 * to their own rows here. This folding is a derived clarification.
 *
 * States are NOT re-declared here: `ScheduleDefinitionState` /
 * `SCHEDULE_DEFINITION_STATES` (ten) and `ScheduleOccurrenceState` /
 * `SCHEDULE_OCCURRENCE_STATES` (fifteen) already exist in
 * `@/domain/vocabularies`, measured there off source L99022-L99157 — a
 * fuller statement than OBJ-091's four-state line (L10031: "defined,
 * enabled, disabled, superseded") and OBJ-093's eight-state line (L10069:
 * "materialised, due, claimed, executing, succeeded, failed, skipped,
 * dead-lettered"). Reused per controller ruling R2.
 */
export const ScheduleDefinitionRow = z.object({
  id: z.string().min(1),
  kind: z.literal('definition'),
  workIdentity: z.string().min(1),
  cadenceExpression: z.string().min(1),
  timezone: z.string().min(1),
  misfirePolicy: z.string().min(1),
  overlapPolicy: z.string().min(1),
  retryPolicy: z.string().min(1),
  idempotencyKeyTemplate: z.string().min(1),
  blastRadiusBounds: z.string().min(1),
  enabled: z.boolean(),
  status: z.enum(SCHEDULE_DEFINITION_STATES),
}).strict()
export type ScheduleDefinitionRow = z.infer<typeof ScheduleDefinitionRow>

export const ScheduleOccurrenceRow = z.object({
  id: z.string().min(1),
  kind: z.literal('occurrence'),
  definitionId: z.string().min(1),
  dueAt: Stamp,
  timezone: z.string().min(1),
  idempotencyKey: z.string().min(1),
  claimedBy: z.string().nullable(),
  outcomeRef: z.string().nullable(),
  status: z.enum(SCHEDULE_OCCURRENCE_STATES),
}).strict()
export type ScheduleOccurrenceRow = z.infer<typeof ScheduleOccurrenceRow>

export const Schedule = z.discriminatedUnion('kind', [ScheduleDefinitionRow, ScheduleOccurrenceRow])
export type Schedule = z.infer<typeof Schedule>

// OBJ-077 · Artificial-intelligence request (L9600-L9615), the
// `ai-requests` collection. Fields L9606. Lifecycle L9608: "issued, routed,
// failed over, completed, cached".
export const AiRequest = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  routerRole: z.enum(['primary', 'fallback', 'lightweight', 'embedding']),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  deterministic: z.boolean(),
  semanticCacheHit: z.boolean(),
  createdAt: Stamp,
  status: z.enum(['issued', 'routed', 'failed-over', 'completed', 'cached']),
}).strict()
export type AiRequest = z.infer<typeof AiRequest>

/**
 * `evaluations` folds OBJ-068 · Eval scenario (L9429-L9444) with OBJ-069 ·
 * Eval run result (L9448-L9463) the same way `events` folds its two
 * objects: one collection, discriminated by `kind`, since design §3.1
 * names one `evaluations` collection. This is the platform's AI-capability
 * test harness (Super Admin, Eval Harness), a distinct concept from
 * `ai-requests` (one model call) — a capability may not pass evaluation
 * and still be the subject of live requests it has not yet been gated for.
 * Scenario fields L9435; scenario lifecycle L9437: "authored, active,
 * superseded". Result fields L9454; result lifecycle L9456: "recorded" — no
 * further lifecycle, so no `status` field on the result row.
 */
export const EvalScenario = z.object({
  id: z.string().min(1),
  kind: z.literal('scenario'),
  subjectAtomOrAgentId: z.string().min(1),
  inputs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  expectedBehaviour: z.string().min(1),
  passCriteria: z.string().min(1),
  suiteId: z.string().nullable(),
  status: z.enum(['authored', 'active', 'superseded']),
}).strict()
export type EvalScenario = z.infer<typeof EvalScenario>

export const EvalRunResult = z.object({
  id: z.string().min(1),
  kind: z.literal('result'),
  scenarioId: z.string().min(1),
  subjectAtomOrAgentId: z.string().min(1),
  runAt: Stamp,
  outcome: z.enum(['pass', 'fail']),
  failureDetail: z.string().nullable(),
  suiteId: z.string().nullable(),
  canaryOrOnDemand: z.enum(['canary', 'on-demand']),
}).strict()
export type EvalRunResult = z.infer<typeof EvalRunResult>

export const Evaluation = z.discriminatedUnion('kind', [EvalScenario, EvalRunResult])
export type Evaluation = z.infer<typeof Evaluation>

/**
 * `tours` — derived clarification, not a business object in
 * `registries/generated/business-objects.json`. Shaped from design §6
 * ("Tour engine (§10.6)") and §7's Workflow Index / registry indexes: a
 * tour definition binds to stable control, screen, workflow and
 * state-machine IDs and is replayable from a named seed to an identical
 * end state; §6 names the nominal-plus-variant set (denied, failure,
 * first-fallback, fallback-failure, recovery) that this schema's `variant`
 * enumerates.
 */
export const Tour = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** `SurfaceId` from `@/domain/surfaces`, carried as a plain string — see index.ts RELATIONS note. */
  surface: z.string().min(1),
  moduleId: z.string().min(1),
  workflowId: z.string().nullable(),
  variant: z.enum(['nominal', 'denied', 'failure', 'first-fallback', 'fallback-failure', 'recovery']),
  steps: z.array(z.object({
    order: z.number().int().nonnegative(),
    controlId: z.string().nullable(),
    screenPath: z.string().min(1),
    narration: z.string().min(1),
  }).strict()),
  status: z.enum(['draft', 'ready', 'published']),
}).strict()
export type Tour = z.infer<typeof Tour>
