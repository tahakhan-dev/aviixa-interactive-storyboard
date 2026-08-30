import type { HubCommand } from '@/domain/commands'
import type { RoleId } from '@/domain/roles'
import { evaluateAccess, type AccessContext } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import { hubAccessRequest } from '@/surfaces/doh/objects'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import {
  DOH_05_FIXTURE_STATE,
  HUB_TENANT_ID,
  identityFor,
  type SeededJob,
} from './jobs'
import { doh05Act, rolesGranted, type Doh05Act, type Doh05ActId } from './matrix'

/**
 * Every affordance on both `MOD-DOH-05` routes, decided in one place.
 *
 * THE RULE THIS FILE EXISTS TO KEEP: no screen in this module holds a role
 * list. Each control asks for its act, the act's own five cells produce the
 * allowed roles, and `evaluateAccess` answers. A screen that hand-wrote
 * "the Quality Manager may approve" would be a second copy of row 4 that no
 * gate reads.
 *
 * THE APPROVAL GATE NEEDS NO NEW MECHANISM, AND ADDING ONE WOULD BE THE
 * DEFECT. `evaluateAccess` already carries `makerCheckerOf`, and
 * `hubAccessRequest` already supplies it for `DOH_APPROVE_JOB` from the
 * Job's own `createdBy` field. So `approveDecision` below builds the command
 * and hands it over; there is no comparison of a creator against a viewer
 * anywhere in this module's own code. Two spellings of maker-checker that
 * both work are still two places a rule can be changed in one and not the
 * other, and the source states the rule once: `AC-DOH-05-2` (L27816), "The
 * creator of a Job can never approve that Job, including where the creator
 * holds the approver role."
 *
 * THE JOB-OWNER GATE IS THE SAME ARGUMENT. Row 10's condition is met by
 * `hubAccessRequest`, which calls the shared predicate in
 * `@/surfaces/doh/job-owner` and narrows `allowedRoles` to the EMPTY list
 * when the Job's owner field does not name the viewer. No `JOB_OWNER` token
 * appears in any role list here, because Job Owner is a field on the Job
 * record and not a role.
 */

export function contextFor(role: TenantRoleId): AccessContext {
  return {
    state: DOH_05_FIXTURE_STATE,
    identity: {
      signedIn: true,
      role: role as RoleId,
      tenant: HUB_TENANT_ID,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    // The identity, not a shared storyboard actor. Segregation of duties is
    // a comparison between two people and collapses to nothing without it.
    actorOfRecord: identityFor(role),
  }
}

/**
 * The plain per-act decision: the act's own cells, nothing else.
 *
 * A `null` cell contributes NO role — it is the row saying nothing, and a
 * silent cell handed over as an allow or a deny would settle an open
 * question inside a role list nobody reads. `rolesGranted` drops them and
 * the screen prints the silence beside the control instead.
 */
export function actDecision(role: TenantRoleId, actId: Doh05ActId): PermissionDecision {
  const act: Doh05Act = doh05Act(actId)
  return evaluateAccess(
    {
      action: act.control,
      allowedRoles: rolesGranted(act) as readonly RoleId[],
      sourceRefs: [`MOD-DOH-05 ${act.sourceRef}`],
    },
    contextFor(role),
  )
}

/**
 * Row 4, through the command spec that already carries the gate.
 *
 * `hubAccessRequest` supplies `makerCheckerOf: command.createdBy` and the
 * `pending_approval` object-state constraint, both read from the Job record
 * in the fixture partition. The refusal a creator meets is therefore
 * `SEGREGATION_OF_DUTIES` at the evaluator's own stage 10, not a message
 * this module wrote.
 */
export function approveDecision(role: TenantRoleId, job: SeededJob): PermissionDecision {
  const command: HubCommand = {
    type: 'DOH_APPROVE_JOB',
    tenant: HUB_TENANT_ID,
    jobId: job.record.jobId,
    createdBy: job.record.createdBy,
  }
  return evaluateAccess(
    {
      action: `Approve ${job.record.jobId}`,
      ...hubAccessRequest(command, DOH_05_FIXTURE_STATE, identityFor(role)),
    },
    contextFor(role),
  )
}

/**
 * Row 10, through the same door. The predicate is reached by
 * `hubAccessRequest`; this function names no owner and compares no ids.
 */
export function adoptVersionDecision(
  role: TenantRoleId,
  job: SeededJob,
  versionNumber: string,
): PermissionDecision {
  const command: HubCommand = {
    type: 'DOH_DECIDE_VERSION_ADOPTION',
    tenant: HUB_TENANT_ID,
    jobId: job.record.jobId,
    versionNumber,
    choice: 'adopt',
  }
  return evaluateAccess(
    {
      action: `Adopt ${versionNumber} on ${job.record.jobId}`,
      ...hubAccessRequest(command, DOH_05_FIXTURE_STATE, identityFor(role)),
    },
    contextFor(role),
  )
}
