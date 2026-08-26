import * as platform from './platform'
import * as org from './org'
import * as studio from './studio'
import * as operations from './operations'
import * as crosscutting from './crosscutting'
import type { ZodType } from 'zod'

export interface CollectionDef { schema: ZodType; file: string }

/**
 * One entry per collection named in design §3.1
 * (`docs/superpowers/specs/2026-08-26-product-fidelity-rebuild-design.md`),
 * which is the complete forty-collection list controller ruling R1 requires
 * — not the six-entry sample the task brief shows. Order follows §3.1's own
 * listing order.
 */
export const COLLECTIONS = {
  tenants: { schema: platform.Tenant, file: 'tenants.json' },
  users: { schema: platform.User, file: 'users.json' },
  roles: { schema: org.RoleDefinition, file: 'roles.json' },
  'role-grants': { schema: platform.RoleGrant, file: 'role-grants.json' },
  sites: { schema: org.Site, file: 'sites.json' },
  areas: { schema: org.Area, file: 'areas.json' },
  locations: { schema: org.Location, file: 'locations.json' },
  shifts: { schema: org.Shift, file: 'shifts.json' },
  workers: { schema: org.Worker, file: 'workers.json' },
  qualifications: { schema: org.Qualification, file: 'qualifications.json' },
  'qualification-grants': { schema: org.QualificationGrant, file: 'qualification-grants.json' },
  devices: { schema: org.Device, file: 'devices.json' },
  'workflow-definitions': { schema: studio.WorkflowDefinition, file: 'workflow-definitions.json' },
  'work-instructions': { schema: studio.WorkInstruction, file: 'work-instructions.json' },
  'content-blocks': { schema: studio.ContentBlock, file: 'content-blocks.json' },
  training: { schema: studio.Training, file: 'training.json' },
  specifications: { schema: studio.Specification, file: 'specifications.json' },
  evaluations: { schema: crosscutting.Evaluation, file: 'evaluations.json' },
  packages: { schema: studio.Package, file: 'packages.json' },
  jobs: { schema: operations.Job, file: 'jobs.json' },
  runs: { schema: operations.Run, file: 'runs.json' },
  'unit-executions': { schema: operations.UnitExecution, file: 'unit-executions.json' },
  'step-executions': { schema: operations.StepExecution, file: 'step-executions.json' },
  captures: { schema: operations.Capture, file: 'captures.json' },
  evidence: { schema: operations.Evidence, file: 'evidence.json' },
  deviations: { schema: operations.Deviation, file: 'deviations.json' },
  holds: { schema: operations.Hold, file: 'holds.json' },
  summaries: { schema: operations.Summary, file: 'summaries.json' },
  reports: { schema: operations.Report, file: 'reports.json' },
  parts: { schema: org.Part, file: 'parts.json' },
  notifications: { schema: crosscutting.Notification, file: 'notifications.json' },
  commands: { schema: crosscutting.Command, file: 'commands.json' },
  events: { schema: crosscutting.Event, file: 'events.json' },
  audit: { schema: crosscutting.Audit, file: 'audit.json' },
  schedules: { schema: crosscutting.Schedule, file: 'schedules.json' },
  'feature-controls': { schema: platform.FeatureControl, file: 'feature-controls.json' },
  entitlements: { schema: platform.Entitlement, file: 'entitlements.json' },
  'ai-requests': { schema: crosscutting.AiRequest, file: 'ai-requests.json' },
  'access-sessions': { schema: platform.AccessSession, file: 'access-sessions.json' },
  tours: { schema: crosscutting.Tour, file: 'tours.json' },
} as const satisfies Record<string, CollectionDef>

export type CollectionName = keyof typeof COLLECTIONS

/**
 * Target collection for every ID-bearing field, checked by the validator.
 *
 * Fields that carry an identifier with nothing to validate against — no
 * collection in `COLLECTIONS` is that identifier's system of record at V1
 * (a Job Type code, a tool reference, a containment-checklist reference) —
 * are deliberately absent from this table rather than pointed at the wrong
 * target. `homeSurface` / `reachableSurfaces` (roles, tours' `surface`)
 * carry `SurfaceId` values from `@/domain/surfaces`, which is a fixed
 * five-member closed set, not a `src/data` collection, so those fields are
 * validated by their zod schema (`z.string()`) rather than by a RELATIONS
 * row here.
 *
 * `field` may be a NESTED path, `'<arrayField>[].<leafField>'` — the only
 * shape any schema in this task actually needs (`tours.steps[].controlId`
 * is the one instance). The validator's `valuesAtPath()` walks `row[
 * arrayField]` and checks `leafField` on every element; `fieldPaths()`
 * (the coverage sweep behind `UNCHECKABLE_ID_FIELDS` below) discovers such
 * paths the same way, by recursing into a `z.array(z.object(...))` field's
 * element shape. Fix round 2 (re-review finding: `tours.steps[].controlId`
 * existed, was named in a code comment as exactly this shape of gap, and
 * was still neither registered nor allowlisted — this is what closes that).
 */
export const RELATIONS: ReadonlyArray<
  { from: CollectionName; field: string; to: CollectionName; array?: boolean; nullable?: boolean }
> = [
  // platform.ts
  { from: 'users', field: 'tenantId', to: 'tenants', nullable: true },
  { from: 'users', field: 'role', to: 'roles' },
  { from: 'role-grants', field: 'userId', to: 'users' },
  { from: 'role-grants', field: 'role', to: 'roles' },
  { from: 'role-grants', field: 'siteIds', to: 'sites', array: true },
  { from: 'role-grants', field: 'areaIds', to: 'areas', array: true },
  { from: 'role-grants', field: 'shiftIds', to: 'shifts', array: true },
  { from: 'access-sessions', field: 'tenantId', to: 'tenants' },
  { from: 'access-sessions', field: 'platformUserId', to: 'users' },

  // org.ts
  { from: 'sites', field: 'tenantId', to: 'tenants' },
  { from: 'areas', field: 'siteId', to: 'sites' },
  { from: 'areas', field: 'shiftIds', to: 'shifts', array: true },
  { from: 'locations', field: 'areaId', to: 'areas' },
  { from: 'shifts', field: 'siteId', to: 'sites' },
  { from: 'shifts', field: 'areaIds', to: 'areas', array: true },
  { from: 'parts', field: 'tenantId', to: 'tenants' },
  { from: 'workers', field: 'userId', to: 'users' },
  { from: 'workers', field: 'tenantId', to: 'tenants' },
  { from: 'workers', field: 'qualificationIds', to: 'qualifications', array: true },
  { from: 'qualifications', field: 'workerId', to: 'workers' },
  { from: 'qualifications', field: 'areaIds', to: 'areas', array: true },
  { from: 'qualification-grants', field: 'workerId', to: 'workers' },
  { from: 'qualification-grants', field: 'qualificationId', to: 'qualifications' },
  { from: 'qualification-grants', field: 'areaId', to: 'areas', nullable: true },
  { from: 'qualification-grants', field: 'commandId', to: 'commands', nullable: true },
  { from: 'devices', field: 'tenantId', to: 'tenants' },
  { from: 'devices', field: 'locationId', to: 'locations', nullable: true },
  { from: 'devices', field: 'pinnedPackageIds', to: 'packages', array: true },

  // studio.ts
  { from: 'workflow-definitions', field: 'tenantId', to: 'tenants' },
  { from: 'workflow-definitions', field: 'workInstructionIds', to: 'work-instructions', array: true },
  { from: 'work-instructions', field: 'workflowDefinitionId', to: 'workflow-definitions' },
  { from: 'work-instructions', field: 'specificationId', to: 'specifications', nullable: true },
  { from: 'work-instructions', field: 'qualificationOverrideIds', to: 'qualifications', array: true },
  { from: 'content-blocks', field: 'tenantId', to: 'tenants' },
  { from: 'content-blocks', field: 'appliedToWorkInstructionIds', to: 'work-instructions', array: true },
  { from: 'training', field: 'tenantId', to: 'tenants' },
  { from: 'specifications', field: 'tenantId', to: 'tenants' },
  { from: 'packages', field: 'workflowDefinitionId', to: 'workflow-definitions' },
  { from: 'packages', field: 'runId', to: 'runs', nullable: true },

  // operations.ts
  { from: 'jobs', field: 'tenantId', to: 'tenants' },
  { from: 'jobs', field: 'siteId', to: 'sites' },
  { from: 'jobs', field: 'areaId', to: 'areas' },
  { from: 'jobs', field: 'shiftId', to: 'shifts' },
  { from: 'jobs', field: 'workflowDefinitionId', to: 'workflow-definitions' },
  { from: 'jobs', field: 'ownerUserId', to: 'users' },
  { from: 'jobs', field: 'linkedJobId', to: 'jobs', nullable: true },
  { from: 'runs', field: 'tenantId', to: 'tenants' },
  { from: 'runs', field: 'siteId', to: 'sites' },
  { from: 'runs', field: 'areaId', to: 'areas' },
  { from: 'runs', field: 'shiftId', to: 'shifts' },
  { from: 'runs', field: 'jobId', to: 'jobs' },
  { from: 'runs', field: 'packageId', to: 'packages', nullable: true },
  { from: 'runs', field: 'linkedRunId', to: 'runs', nullable: true },
  { from: 'unit-executions', field: 'runId', to: 'runs' },
  { from: 'unit-executions', field: 'workerId', to: 'workers' },
  { from: 'unit-executions', field: 'deviceId', to: 'devices' },
  { from: 'step-executions', field: 'runId', to: 'runs' },
  { from: 'step-executions', field: 'unitExecutionId', to: 'unit-executions', nullable: true },
  { from: 'step-executions', field: 'workflowDefinitionId', to: 'workflow-definitions' },
  { from: 'step-executions', field: 'workInstructionId', to: 'work-instructions' },
  { from: 'step-executions', field: 'workerId', to: 'workers' },
  { from: 'step-executions', field: 'deviceId', to: 'devices' },
  { from: 'step-executions', field: 'siteId', to: 'sites' },
  { from: 'step-executions', field: 'areaId', to: 'areas' },
  { from: 'step-executions', field: 'locationId', to: 'locations', nullable: true },
  { from: 'captures', field: 'stepExecutionId', to: 'step-executions' },
  { from: 'captures', field: 'runId', to: 'runs' },
  { from: 'captures', field: 'jobId', to: 'jobs' },
  { from: 'captures', field: 'workerId', to: 'workers' },
  { from: 'captures', field: 'deviceId', to: 'devices' },
  { from: 'captures', field: 'evidenceIds', to: 'evidence', array: true },
  { from: 'evidence', field: 'stepExecutionId', to: 'step-executions' },
  { from: 'evidence', field: 'unitExecutionId', to: 'unit-executions', nullable: true },
  { from: 'evidence', field: 'workerId', to: 'workers' },
  { from: 'evidence', field: 'deviceId', to: 'devices' },
  { from: 'deviations', field: 'tenantId', to: 'tenants' },
  { from: 'deviations', field: 'stepExecutionId', to: 'step-executions' },
  { from: 'deviations', field: 'workerId', to: 'workers' },
  { from: 'deviations', field: 'runId', to: 'runs' },
  { from: 'holds', field: 'originatingDeviationId', to: 'deviations' },
  { from: 'holds', field: 'placedByDeviceId', to: 'devices' },
  { from: 'summaries', field: 'runId', to: 'runs' },
  { from: 'reports', field: 'tenantId', to: 'tenants' },

  // crosscutting.ts
  { from: 'notifications', field: 'tenantId', to: 'tenants' },
  { from: 'notifications', field: 'eventId', to: 'events', nullable: true },
  { from: 'notifications', field: 'recipientRoleIds', to: 'roles', array: true },
  { from: 'notifications', field: 'recipientUserIds', to: 'users', array: true },
  { from: 'commands', field: 'tenantId', to: 'tenants' },
  { from: 'commands', field: 'targetDeviceId', to: 'devices', nullable: true },
  { from: 'events', field: 'tenantId', to: 'tenants', nullable: true },
  { from: 'events', field: 'deviceId', to: 'devices', nullable: true },
  { from: 'events', field: 'runId', to: 'runs', nullable: true },
  { from: 'events', field: 'stepExecutionId', to: 'step-executions', nullable: true },
  { from: 'audit', field: 'tenantId', to: 'tenants', nullable: true },
  { from: 'schedules', field: 'definitionId', to: 'schedules', nullable: true },
  { from: 'ai-requests', field: 'tenantId', to: 'tenants' },
  { from: 'tours', field: 'workflowId', to: 'workflow-definitions', nullable: true },

  // Fix round 1 (review finding 1) — 13 fields whose target collection
  // exists but had no RELATIONS row, found by an exhaustive introspection
  // sweep (`fieldNames()` in the validator) rather than by re-reading the
  // schema files a third time by eye.
  { from: 'qualifications', field: 'recertifiedFromId', to: 'qualifications', nullable: true },
  { from: 'workflow-definitions', field: 'qualificationBaselineIds', to: 'qualifications', array: true },
  { from: 'jobs', field: 'qualificationRequirementIds', to: 'qualifications', array: true },
  { from: 'captures', field: 'authorisingWorkerId', to: 'workers', nullable: true },
  { from: 'captures', field: 'siteId', to: 'sites', nullable: true },
  { from: 'captures', field: 'areaId', to: 'areas', nullable: true },
  { from: 'captures', field: 'locationId', to: 'locations', nullable: true },
  { from: 'captures', field: 'correctedFromCaptureId', to: 'captures', nullable: true },
  { from: 'events', field: 'actorId', to: 'users' },
  { from: 'events', field: 'siteId', to: 'sites', nullable: true },
  { from: 'events', field: 'areaId', to: 'areas', nullable: true },
  { from: 'audit', field: 'actorId', to: 'users' },
  { from: 'evaluations', field: 'scenarioId', to: 'evaluations' },
] as const

/**
 * Every schema field whose name ends in `Id`/`Ids` is presumed to be a
 * relation and must appear in `RELATIONS` above — the validator's relation
 * coverage check (fix round 1, review finding 1) enforces this and exits 1
 * on any field it finds neither there nor here. A field lands here, with
 * its reason, only when it genuinely cannot be a single-collection
 * `RELATIONS` row:
 *
 *  - no collection in the §3.1 forty-name list is that identifier's system
 *    of record (a Job Type, Service Type tag, containment checklist,
 *    escalation routing template, tool/equipment reference, module, AI
 *    atom/agent, or eval suite — none of these were promoted to their own
 *    `src/data` collection by this task);
 *  - the field is genuinely polymorphic — it can hold an id from more than
 *    one collection, which the `{ from, field, to }` shape (one fixed `to`)
 *    cannot express.
 */
export const UNCHECKABLE_ID_FIELDS: ReadonlyArray<
  { from: CollectionName; field: string; reason: string }
> = [
  { from: 'workflow-definitions', field: 'jobTypeId', reason: 'No job-types collection exists in the §3.1 forty-name list; Job Type (OBJ-011) is a tenant taxonomy value, not promoted to its own collection.' },
  { from: 'workflow-definitions', field: 'serviceTypeTagId', reason: 'No service-type-tags collection exists; Service Type tag (OBJ-012) is a taxonomy value, not a collection.' },
  { from: 'workflow-definitions', field: 'defaultEscalationRoutingTemplateId', reason: 'No escalation-routing-templates collection exists; Escalation Routing Template (OBJ-043) was not promoted to a §3.1 collection.' },
  { from: 'work-instructions', field: 'containmentChecklistId', reason: 'No containment-checklists collection exists; Containment Checklist (OBJ-040) was not promoted to a §3.1 collection.' },
  { from: 'work-instructions', field: 'escalationRoutingTemplateId', reason: 'No escalation-routing-templates collection exists (see workflow-definitions.defaultEscalationRoutingTemplateId above).' },
  { from: 'work-instructions', field: 'requiresToolId', reason: 'No tools collection exists in §3.1; tool/equipment references are out of scope for this schema layer.' },
  { from: 'jobs', field: 'jobTypeId', reason: 'No job-types collection exists (see workflow-definitions.jobTypeId above).' },
  { from: 'jobs', field: 'serviceTypeTagId', reason: 'No service-type-tags collection exists (see workflow-definitions.serviceTypeTagId above).' },
  { from: 'deviations', field: 'containmentChecklistId', reason: 'No containment-checklists collection exists (see work-instructions.containmentChecklistId above).' },
  { from: 'packages', field: 'contentItemIds', reason: "Polymorphic: a package's content items are a mix of work-instructions and content-blocks rows (this collection's own seed row holds one id from each); a RELATIONS row can only name one fixed target collection." },
  { from: 'holds', field: 'targetId', reason: "Polymorphic, discriminated by targetKind: 'lot' | 'unit' | 'run'. Only 'run' has a §3.1 collection — Lot and Unit (OBJ-020/021) were not promoted to their own collections — so even a per-targetKind relation could not always resolve." },
  { from: 'evaluations', field: 'subjectAtomOrAgentId', reason: 'No atoms/agents collection exists in §3.1; Agent definition and Atom registration record (OBJ-066/067) were not promoted to collections by this task.' },
  { from: 'evaluations', field: 'suiteId', reason: 'No suites collection exists; a suite is a grouping label within evaluations, not its own §3.1 collection.' },
  { from: 'tours', field: 'moduleId', reason: "References the product's static module registry (e.g. MOD-FL-A2), not a src/data collection; modules are not one of §3.1's forty collections." },
  {
    from: 'tours',
    field: 'steps[].controlId',
    reason:
      "No collection or registry yet holds real control identity: product primitives only start " +
      "emitting data-control-id from Task 9 onward (runway plan ruling R4), and " +
      "registries/generated/actionable-controls.json holds descriptive labels off the frozen source " +
      "(e.g. 'A replay control'), not the stable ids a real control carries, so it is not a usable " +
      "target either. TODO(task-15): Task 15 (the guided-tour engine, master prompt \u00a710.6) is " +
      "what resolves a tour step's controlId against a real control and is where the control-identity " +
      "source of truth will exist \u2014 register this as a real RELATIONS row once it does, rather " +
      "than leaving it here indefinitely.",
  },
] as const
