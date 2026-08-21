import { scenarioRunId, tenantId, type TenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { objectKey, type JobRecord, type JobState } from '@/surfaces/doh/objects'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'

/**
 * `MOD-DOH-05`'s seeded Jobs, and the one partition of them the approval
 * queue turns on.
 *
 * WHY THERE ARE IDENTITIES HERE AT ALL. Every other Hub module screen passes
 * `actorOfRecord: 'storyboard-viewer'` — one identity for every persona —
 * because none of them has a rule that depends on WHO the viewer is. This
 * one does: the segregation-of-duties gate compares the approver against the
 * Job's creator, and with a single shared actor the maker and the checker
 * are always the same person, so every Job would refuse and the queue would
 * be empty for the wrong reason. Two identities named by the source's own
 * happy path (L27711 "Sam creates a Job in `draft`", L27715 "Elena reviews
 * and approves") and one Tenant Admin identity, which the source does not
 * name and which is therefore given an id rather than a person's name.
 *
 * ONE IDENTITY PER ROLE, WHICH IS ALSO A LIMIT. `IdentitySimulationState`
 * carries a single `role`, so the reviewer's persona switcher IS the choice
 * of identity here. That is exactly why row 4's Tenant Admin escape — "also
 * holds an approver role" — cannot be driven: there is no identity in this
 * build holding two roles at once, and inventing a sixth persona to hold
 * both would settle, by fixture, a question the source leaves to a tenant's
 * own role assignments.
 */

export const HUB_TENANT_ID: TenantId = tenantId('TEN-BRIGHTBIKES')

export const DOH_05_IDENTITIES = {
  TENANT_ADMIN: 'ACT-DOH-TENANT-ADMIN',
  SUPERVISOR: 'ACT-DOH-SAM',
  QUALITY_MANAGER: 'ACT-DOH-ELENA',
  READONLY_AUDITOR: 'ACT-DOH-AUDITOR',
  WORKER: 'ACT-DOH-WORKER',
} as const satisfies Readonly<Record<TenantRoleId, string>>

export function identityFor(role: TenantRoleId): string {
  return DOH_05_IDENTITIES[role]
}

export function displayNameFor(identityId: string): string {
  switch (identityId) {
    case DOH_05_IDENTITIES.SUPERVISOR:
      return 'Sam (Supervisor)'
    case DOH_05_IDENTITIES.QUALITY_MANAGER:
      return 'Elena (Quality Manager)'
    case DOH_05_IDENTITIES.TENANT_ADMIN:
      return 'the Tenant Admin'
    case DOH_05_IDENTITIES.READONLY_AUDITOR:
      return 'the Read-only Auditor'
    case DOH_05_IDENTITIES.WORKER:
      return 'the Worker'
    default:
      return identityId
  }
}

/**
 * A seeded Job, plus the two things the SCREEN needs that are not fields of
 * `JobRecord`.
 *
 * `boundNodeArchiving` IS NOT A FIFTH STATE, and the distinction is worth
 * stating because the identity card invites the opposite reading. L27684
 * lists the states as "`draft`, `pending_approval`, `active`, `archived`;
 * plus `paused_by_archival_cascade` where a bound location is being
 * archived" — read as an enumeration that is five members. L27751 reads the
 * same machine and says the opposite: "The state machine has four stated
 * states plus one derived pause state". `JobRecord.state` is the four, and
 * the pause is DERIVED from the bound node's archival — which is also the
 * only reading that lets the Job return to `active` when the node archival
 * is abandoned without a state write nobody performed.
 *
 * `pendingRecurrenceProposal` is what row 11's propose act leaves behind:
 * L27665 — "While the change awaits approval, the Job keeps running on its
 * current schedule". So it sits BESIDE the state rather than in it; a Job
 * with a proposal pending is still `active` and still running.
 */
export interface SeededJob {
  readonly record: JobRecord
  readonly boundNodeArchiving: boolean
  readonly pendingRecurrenceProposal: string | null
  /** What the Job editor's version panel shows, or `null`. */
  readonly notifiedClassVersionAwaitingAdoption: string | null
}

const A = DOH_05_IDENTITIES

/**
 * Five Jobs, chosen so every branch this module can render has data behind
 * it and none is reachable only by a test.
 *
 * `JOB-REDBIKE` and its shape are the source's own Illustrative Example
 * (L27807): Job Type "Assembly", bound to an Area, referencing a workflow.
 * The Job Type NAME is a tenant-created entry, not a platform-seeded one —
 * `DEC-TAX-002` forbids inventing the sixteen seeded names, and the glossary
 * row at L5739 makes the same point about this very example, calling it "a
 * Bright Bikes tenant-created entry and not a starter name".
 */
export const SEEDED_JOBS = [
  {
    record: {
      jobId: 'JOB-REDBIKE',
      name: 'Red bike frame assembly',
      jobTypeId: 'JOBTYPE-BRIGHTBIKES-ASSEMBLY',
      parentNodeId: 'AREA-ASSY-A',
      ownerId: A.SUPERVISOR,
      state: 'pending_approval',
      createdBy: A.SUPERVISOR,
    },
    boundNodeArchiving: false,
    pendingRecurrenceProposal: null,
    notifiedClassVersionAwaitingAdoption: null,
  },
  {
    // Created by the approver herself. This is the Job that must NOT appear
    // in her decidable queue, and must appear in the panel that carries no
    // decision control (`SB-DOH-017`, L27805).
    record: {
      jobId: 'JOB-WHEELTRUE',
      name: 'Wheel truing, night shift',
      jobTypeId: 'JOBTYPE-BRIGHTBIKES-INSPECTION',
      parentNodeId: 'CELL-WHEEL-2',
      ownerId: A.QUALITY_MANAGER,
      state: 'pending_approval',
      createdBy: A.QUALITY_MANAGER,
    },
    boundNodeArchiving: false,
    pendingRecurrenceProposal: null,
    notifiedClassVersionAwaitingAdoption: null,
  },
  {
    record: {
      jobId: 'JOB-BRAKECHECK',
      name: 'Brake cable check',
      jobTypeId: 'JOBTYPE-BRIGHTBIKES-INSPECTION',
      parentNodeId: 'AREA-ASSY-A',
      ownerId: A.SUPERVISOR,
      state: 'active',
      createdBy: A.SUPERVISOR,
    },
    boundNodeArchiving: false,
    pendingRecurrenceProposal: 'Weekly on Monday, proposed in place of daily. Awaiting approval.',
    notifiedClassVersionAwaitingAdoption: 'Assembly workflow 2.1.0 — minor, notified class.',
  },
  {
    record: {
      jobId: 'JOB-PAINTLINE',
      name: 'Paint line preparation',
      jobTypeId: 'JOBTYPE-BRIGHTBIKES-FINISHING',
      parentNodeId: 'AREA-PAINT',
      ownerId: A.TENANT_ADMIN,
      state: 'draft',
      createdBy: A.TENANT_ADMIN,
    },
    boundNodeArchiving: false,
    pendingRecurrenceProposal: null,
    notifiedClassVersionAwaitingAdoption: null,
  },
  {
    // The archival cascade this module OWNS. `archival-cascade` in
    // `@/surfaces/doh/seams` records MOD-DOH-02 as the consumer and
    // MOD-DOH-05 as the owner at slice 6, so this renders here rather than
    // rendering a seam notice about itself.
    record: {
      jobId: 'JOB-OLDJIG',
      name: 'Jig calibration, old bay',
      jobTypeId: 'JOBTYPE-BRIGHTBIKES-MAINTENANCE',
      parentNodeId: 'AREA-BAY-OLD',
      ownerId: A.SUPERVISOR,
      state: 'active',
      createdBy: A.TENANT_ADMIN,
    },
    boundNodeArchiving: true,
    pendingRecurrenceProposal: null,
    notifiedClassVersionAwaitingAdoption: null,
  },
] as const satisfies readonly SeededJob[]

/**
 * The derived pause. Four stored states, and this is the fifth thing a
 * reader sees — computed, never written.
 */
export function isPausedByArchivalCascade(job: SeededJob): boolean {
  return job.boundNodeArchiving && job.record.state === 'active'
}

export function jobStateLabel(job: SeededJob): string {
  return isPausedByArchivalCascade(job) ? 'paused by archival cascade' : job.record.state
}

/** The states, for the list's own filter. Four, from the shared union. */
export type Doh05JobState = JobState

/**
 * The domain state the evaluator reads. Every seeded Job is written into the
 * tenant partition under the SHARED `objectKey.job` prefix, so
 * `hubAccessRequest` can read each Job's own state and owner field instead
 * of being handed a summary this file computed.
 */
export const DOH_05_FIXTURE_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('DOH-MOD-05-STORYBOARD')),
  HUB_TENANT_ID,
  () => ({
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
    desiredFeatureValues: {},
    tier: 'growth',
    objects: Object.fromEntries(
      SEEDED_JOBS.map((job) => [objectKey.job(job.record.jobId), job.record]),
    ),
  }),
)

/* ==================================================================== *
 * THE APPROVAL QUEUE'S TWO LISTS
 * ==================================================================== */

/**
 * `SB-DOH-017` (L27805): "A Job she created herself does not appear in her
 * queue at all" — it appears instead in a separate panel headed "Awaiting
 * another approver — you created these", with no decision control.
 *
 * THE PANEL IS THE POINT, NOT AN OVERSIGHT. A list of items the viewer may
 * not act on looks like a defect until you ask what the alternative costs.
 * Hiding those Jobs entirely leaves the creator unable to see that their own
 * submission is queued at all, and showing them with a disabled Approve
 * button implies a condition that could become true — it never can, for this
 * viewer, on this Job. So they are listed, named, and carry nothing to press.
 *
 * THE PARTITION IS ON THE CREATOR FIELD, WHICH IS NOT THE PERMISSION CHECK.
 * This function decides which LIST a Job appears in. Whether the Approve
 * control renders is decided separately, by `evaluateAccess` through
 * `hubAccessRequest`'s existing `makerCheckerOf` — and the two must agree,
 * which the unit suite asserts rather than assumes. Deciding the control
 * here as well would be a second spelling of maker-checker, and a second
 * spelling is a defect on this build even when both spellings work.
 */
export interface ApprovalQueuePartition {
  /** In `pending_approval` and created by somebody else. */
  readonly decidable: readonly SeededJob[]
  /** In `pending_approval` and created by this viewer. No decision control. */
  readonly awaitingAnotherApprover: readonly SeededJob[]
}

export function approvalQueueFor(
  identityId: string,
  jobs: readonly SeededJob[] = SEEDED_JOBS,
): ApprovalQueuePartition {
  const pending = jobs.filter((job) => job.record.state === 'pending_approval')
  return {
    decidable: pending.filter((job) => job.record.createdBy !== identityId),
    awaitingAnotherApprover: pending.filter((job) => job.record.createdBy === identityId),
  }
}
