import { z } from 'zod'
import { CAPTURE_STATES } from '@/frontline/capture'
import { Stamp } from './platform'

// OBJ-013 · Job (L7998-L8013). Fields L8004; lifecycle L8006: "draft,
// pending_approval, active, archived, plus the derived paused state
// produced by the archival cascade" — the five-state union kept whole
// rather than folding the derived `paused` state into `archived`.
export const Job = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  jobTypeId: z.string().min(1),
  serviceTypeTagId: z.string().nullable(),
  siteId: z.string().min(1),
  areaId: z.string().min(1),
  shiftId: z.string().min(1),
  workflowDefinitionId: z.string().min(1),
  plannedQuantity: z.number().int().nonnegative(),
  qualificationRequirementIds: z.array(z.string()),
  recurrencePattern: z.string().nullable(),
  unitMode: z.enum(['serialized', 'lot', 'none']),
  ownerUserId: z.string().min(1),
  linkedJobId: z.string().nullable(),
  status: z.enum(['draft', 'pending-approval', 'active', 'paused', 'archived']),
}).strict()
export type Job = z.infer<typeof Job>

// OBJ-014 · Run (L8017-L8032). Fields L8023; lifecycle L8025: "scheduled, in
// progress, cancelled, submitted, complete, finished".
export const Run = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  siteId: z.string().min(1),
  areaId: z.string().min(1),
  shiftId: z.string().min(1),
  jobId: z.string().min(1),
  source: z.enum(['manual', 'auto-scheduled', 'erp-inbound', 'api-inbound']),
  packageId: z.string().nullable(),
  plannedStartAt: Stamp,
  plannedEndAt: Stamp,
  actualStartAt: Stamp.nullable(),
  actualEndAt: Stamp.nullable(),
  /** Calendar date taken from the shift's nominal production date (L8023) — a date, not a Stamp. */
  productionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a calendar date YYYY-MM-DD'),
  cancellationReason: z.string().nullable(),
  linkedRunId: z.string().nullable(),
  status: z.enum(['scheduled', 'in-progress', 'cancelled', 'submitted', 'complete', 'finished']),
}).strict()
export type Run = z.infer<typeof Run>

// OBJ-016 · Unit Execution (L8055-L8070). Fields L8061; lifecycle L8063:
// "open, complete, abandoned".
export const UnitExecution = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  unitOrSerialRef: z.string().min(1),
  workerId: z.string().min(1),
  deviceId: z.string().min(1),
  openedAt: Stamp,
  closedAt: Stamp.nullable(),
  status: z.enum(['open', 'complete', 'abandoned']),
}).strict()
export type UnitExecution = z.infer<typeof UnitExecution>

/**
 * OBJ-017 · Step Execution (L8074-L8089). Fields L8080; lifecycle L8082:
 * "started, completed, abandoned, corrected by appended record".
 * `gateOutcome`'s values are a derived clarification: L8080 names "gate
 * outcome" as a field without enumerating it; `passed`/`failed`/
 * `not-applicable` mirrors the hard/soft gate concept from OBJ-038 (L8633).
 */
export const StepExecution = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  unitExecutionId: z.string().nullable(),
  workflowDefinitionId: z.string().min(1),
  pinnedVersion: z.string().min(1),
  workInstructionId: z.string().min(1),
  workerId: z.string().min(1),
  deviceId: z.string().min(1),
  siteId: z.string().min(1),
  areaId: z.string().min(1),
  locationId: z.string().nullable(),
  deviceTime: Stamp,
  serverReceiptTime: Stamp.nullable(),
  gateOutcome: z.enum(['passed', 'failed', 'not-applicable']),
  inSpecification: z.boolean().nullable(),
  severityBand: z.number().int().nullable(),
  status: z.enum(['started', 'completed', 'abandoned', 'corrected-by-appended-record']),
}).strict()
export type StepExecution = z.infer<typeof StepExecution>

/**
 * OBJ-018 · Data Capture (L8093-L8109), the `captures` collection. Fields
 * L8099. Lifecycle L8101 is the same thirteen-state ladder already declared
 * as `CaptureState` / `CAPTURE_STATES` in `@/frontline/capture` (transcribed
 * there from source §22.6.1) — reused directly per controller ruling R2
 * rather than re-declared, so this schema can never drift from the
 * platform's own capture-state vocabulary.
 */
export const Capture = z.object({
  id: z.string().min(1),
  stepExecutionId: z.string().min(1),
  runId: z.string().min(1),
  jobId: z.string().min(1),
  captureType: z.enum(['ok-not-ok', 'measurement', 'photo', 'barcode', 'text']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unitOrLot: z.union([
    z.object({ kind: z.literal('unit'), id: z.string().min(1) }).strict(),
    z.object({ kind: z.literal('lot'), id: z.string().min(1) }).strict(),
    z.object({ kind: z.literal('absent-by-design'), reason: z.string().min(1) }).strict(),
  ]),
  workerId: z.string().min(1),
  authorisingWorkerId: z.string().nullable(),
  deviceId: z.string().min(1),
  locationResolved: z.boolean(),
  siteId: z.string().nullable(),
  areaId: z.string().nullable(),
  locationId: z.string().nullable(),
  unresolvedLocationNote: z.string().nullable(),
  deviceTime: Stamp,
  serverReceiptTime: Stamp.nullable(),
  inSpecification: z.boolean().nullable(),
  severityBand: z.number().int().nullable(),
  evidenceIds: z.array(z.string()),
  lateArrival: z.boolean(),
  correctedFromCaptureId: z.string().nullable(),
  status: z.enum(CAPTURE_STATES),
}).strict()
export type Capture = z.infer<typeof Capture>

// OBJ-019 · Evidence media (L8112-L8129). Fields L8118; lifecycle L8120:
// "captured, queued, uploaded, accepted, reviewed".
export const Evidence = z.object({
  id: z.string().min(1),
  stepExecutionId: z.string().min(1),
  unitExecutionId: z.string().nullable(),
  workerId: z.string().min(1),
  deviceId: z.string().min(1),
  mediaType: z.enum(['photo', 'video', 'document']),
  deviceTime: Stamp,
  serverReceiptTime: Stamp.nullable(),
  storageRef: z.string().min(1),
  reviewedBy: z.string().nullable(),
  status: z.enum(['captured', 'queued', 'uploaded', 'accepted', 'reviewed']),
}).strict()
export type Evidence = z.infer<typeof Evidence>

// OBJ-052 · Deviation (L8978-L8993). Fields L8984; lifecycle L8986:
// "Detected, Classified, Contained, Escalated, Dispositioned, Bridged,
// Resolved" — all seven kept, none folded into a generic "open"/"closed".
export const Deviation = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  triggerMechanism: z.enum(['time', 'sequence', 'specification-and-evidence']),
  stepExecutionId: z.string().min(1),
  workerId: z.string().min(1),
  runId: z.string().min(1),
  lotOrUnitRef: z.string().nullable(),
  workflowVersion: z.string().min(1),
  severityBand: z.number().int(),
  agentInterpretation: z.string().nullable(),
  containmentChecklistId: z.string().nullable(),
  escalationRoutingState: z.string().nullable(),
  hasEvidenceGaps: z.boolean(),
  status: z.enum([
    'detected', 'classified', 'contained', 'escalated', 'dispositioned', 'bridged', 'resolved',
  ]),
}).strict()
export type Deviation = z.infer<typeof Deviation>

// OBJ-053 · Hold (L8997-L9013). Fields L9003; lifecycle L9005: "Issued,
// Propagating, In force, Release requested, Released, Release propagating".
export const Hold = z.object({
  id: z.string().min(1),
  targetKind: z.enum(['lot', 'unit', 'run']),
  targetId: z.string().min(1),
  originatingDeviationId: z.string().min(1),
  placedAt: Stamp,
  placedByDeviceId: z.string().min(1),
  releaseRequestedAt: Stamp.nullable(),
  releaseRequestNote: z.string().nullable(),
  releasedBy: z.string().nullable(),
  releasedAt: Stamp.nullable(),
  status: z.enum([
    'issued', 'propagating', 'in-force', 'release-requested', 'released', 'release-propagating',
  ]),
}).strict()
export type Hold = z.infer<typeof Hold>

// OBJ-022 · Execution Summary (L8169-L8185), the `summaries` collection.
// Fields L8175; lifecycle L8177: "computed, recomputing, under review,
// closed, recomputed after finish under the audited-recompute rule".
export const Summary = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  asOf: Stamp,
  deviationCountBySeverity: z.record(z.string(), z.number().int().nonnegative()),
  evidenceCompletenessPercent: z.number().min(0).max(100),
  anomalyCount: z.number().int().nonnegative(),
  lateData: z.boolean(),
  reviewedBy: z.string().nullable(),
  status: z.enum(['computed', 'recomputing', 'under-review', 'closed', 'recomputed-after-finish']),
}).strict()
export type Summary = z.infer<typeof Summary>

// OBJ-063 · Report data set (L9260-L9277), the `reports` collection.
// Fields L9266: "the five sets" — enumerated below as the closed set of
// data-set kinds. Lifecycle L9268: "computed on request or on schedule" —
// not a multi-state machine, carried here as `generatedVia` rather than a
// `status` enum with one member.
export const Report = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  dataSet: z.enum([
    'worker-utilisation-by-area',
    'run-completion-rate-by-job',
    'workflow-version-usage',
    'qualification-override-frequency-by-role',
    'tier-allocation-consumption-trend',
  ]),
  generatedVia: z.enum(['on-request', 'scheduled']),
  generatedAt: Stamp,
  asOf: Stamp,
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))),
}).strict()
export type Report = z.infer<typeof Report>
