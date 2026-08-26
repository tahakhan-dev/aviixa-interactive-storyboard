/**
 * Branded IDs for the JSON-file database (`src/data/collections/*.json`),
 * so a `RunId` cannot be passed where a `JobId` belongs. Task 1 of the
 * runway plan — see `.superpowers/sdd/2026-08-26-runway/task-1-brief.md`.
 *
 * One brand per collection in `src/data/schemas/index.ts#COLLECTIONS`,
 * except `roles`: that collection's rows are the platform's fixed nine
 * `RoleId` values already declared in `@/domain/roles`, so `RoleId` is
 * reused rather than re-branded here (controller ruling R2 — no second
 * declaration of a vocabulary that already exists in the repository).
 *
 * This module is deliberately separate from `@/domain/ids`: that module
 * brands identifiers for the storyboard's own scenario-simulation engine
 * (`ScenarioRunId`, `ObjectId`, `ModuleId`, ...), a different subsystem with
 * a different lifecycle. `TenantId` exists in both because both subsystems
 * independently need to brand a tenant identifier; the two are not the same
 * type and are never interchanged.
 */
declare const brand: unique symbol
export type Branded<T, B extends string> = T & { readonly [brand]: B }

export type TenantId = Branded<string, 'TenantId'>
export type UserId = Branded<string, 'UserId'>
export type RoleGrantId = Branded<string, 'RoleGrantId'>
export type SiteId = Branded<string, 'SiteId'>
export type AreaId = Branded<string, 'AreaId'>
export type LocationId = Branded<string, 'LocationId'>
export type ShiftId = Branded<string, 'ShiftId'>
export type WorkerId = Branded<string, 'WorkerId'>
export type QualificationId = Branded<string, 'QualificationId'>
export type QualificationGrantId = Branded<string, 'QualificationGrantId'>
export type DeviceId = Branded<string, 'DeviceId'>
export type WorkflowDefinitionId = Branded<string, 'WorkflowDefinitionId'>
export type WorkInstructionId = Branded<string, 'WorkInstructionId'>
export type ContentBlockId = Branded<string, 'ContentBlockId'>
export type TrainingId = Branded<string, 'TrainingId'>
export type SpecificationId = Branded<string, 'SpecificationId'>
export type EvaluationId = Branded<string, 'EvaluationId'>
export type PackageId = Branded<string, 'PackageId'>
export type JobId = Branded<string, 'JobId'>
export type RunId = Branded<string, 'RunId'>
export type UnitExecutionId = Branded<string, 'UnitExecutionId'>
export type StepExecutionId = Branded<string, 'StepExecutionId'>
export type CaptureId = Branded<string, 'CaptureId'>
export type EvidenceId = Branded<string, 'EvidenceId'>
export type DeviationId = Branded<string, 'DeviationId'>
export type HoldId = Branded<string, 'HoldId'>
export type SummaryId = Branded<string, 'SummaryId'>
export type ReportId = Branded<string, 'ReportId'>
export type PartId = Branded<string, 'PartId'>
export type NotificationId = Branded<string, 'NotificationId'>
export type CommandId = Branded<string, 'CommandId'>
export type EventId = Branded<string, 'EventId'>
export type AuditId = Branded<string, 'AuditId'>
export type ScheduleId = Branded<string, 'ScheduleId'>
export type FeatureControlId = Branded<string, 'FeatureControlId'>
export type EntitlementId = Branded<string, 'EntitlementId'>
export type AiRequestId = Branded<string, 'AiRequestId'>
export type AccessSessionId = Branded<string, 'AccessSessionId'>
export type TourId = Branded<string, 'TourId'>

const make =
  <B extends string>() =>
  (s: string) =>
    s as Branded<string, B>

export const tenantId = make<'TenantId'>()
export const userId = make<'UserId'>()
export const roleGrantId = make<'RoleGrantId'>()
export const siteId = make<'SiteId'>()
export const areaId = make<'AreaId'>()
export const locationId = make<'LocationId'>()
export const shiftId = make<'ShiftId'>()
export const workerId = make<'WorkerId'>()
export const qualificationId = make<'QualificationId'>()
export const qualificationGrantId = make<'QualificationGrantId'>()
export const deviceId = make<'DeviceId'>()
export const workflowDefinitionId = make<'WorkflowDefinitionId'>()
export const workInstructionId = make<'WorkInstructionId'>()
export const contentBlockId = make<'ContentBlockId'>()
export const trainingId = make<'TrainingId'>()
export const specificationId = make<'SpecificationId'>()
export const evaluationId = make<'EvaluationId'>()
export const packageId = make<'PackageId'>()
export const jobId = make<'JobId'>()
export const runId = make<'RunId'>()
export const unitExecutionId = make<'UnitExecutionId'>()
export const stepExecutionId = make<'StepExecutionId'>()
export const captureId = make<'CaptureId'>()
export const evidenceId = make<'EvidenceId'>()
export const deviationId = make<'DeviationId'>()
export const holdId = make<'HoldId'>()
export const summaryId = make<'SummaryId'>()
export const reportId = make<'ReportId'>()
export const partId = make<'PartId'>()
export const notificationId = make<'NotificationId'>()
export const commandId = make<'CommandId'>()
export const eventId = make<'EventId'>()
export const auditId = make<'AuditId'>()
export const scheduleId = make<'ScheduleId'>()
export const featureControlId = make<'FeatureControlId'>()
export const entitlementId = make<'EntitlementId'>()
export const aiRequestId = make<'AiRequestId'>()
export const accessSessionId = make<'AccessSessionId'>()
export const tourId = make<'TourId'>()
