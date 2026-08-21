import type { TenantId } from './ids'

/**
 * Every product action is a typed command. Slices 2 to 13 extend this union;
 * the shape of a member never changes once a later slice depends on it.
 */
export type ScenarioCommand =
  | {
      readonly type: 'CC_RELEASE_LOT_HOLD'
      readonly tenant: TenantId
      readonly lotId: string
      readonly note: string
    }
  | {
      readonly type: 'PLATFORM_SET_FEATURE_CONTROL'
      readonly feature: string
      readonly enabled: boolean
    }
  | {
      readonly type: 'TENANT_SET_DESIRED_FEATURE'
      readonly tenant: TenantId
      readonly feature: string
      readonly enabled: boolean
    }
  | HubCommand

export type CommandType = ScenarioCommand['type']

/* ==================================================================== *
 * SLICE 6 — the Delivery Operations Hub Job / Run / Assignment / Summary
 * command classes.
 * ==================================================================== */

/**
 * Before this slice, `ScenarioCommand` had three members and not one of them
 * was a Hub Job or Run act, so every module in chapter 19 wrote through
 * nothing at all.
 *
 * WHY THESE TWELVE AND NOT TWENTY-FIVE. The four module matrices between
 * them name roughly twenty-five acts, and enumerating all of them here would
 * be inventing consumers. These twelve are exactly the acts named by
 * something outside this file: the eight steps of the operational journey
 * the plan's task 13 spells out (Job drafted, approved by a second person,
 * run scheduled, worker assigned with the package pinned, run submitted,
 * Summary computed, anomaly resolved, run finished — of which "submitted",
 * "Summary computed" and "finished" are AUTOMATIC transitions with no actor
 * and therefore belong to the due-transition evaluator, not here), plus the
 * three rows the Job-Owner predicate gates and the state-machine step
 * (`submit for approval`) without which `draft` cannot reach `active`.
 *
 * EVERY MEMBER IS TENANT-SCOPED. The Hub is a tenant surface; there is no
 * platform-scoped Hub act. `commandTenant` in the kernel relies on that
 * being true of the whole family rather than case by case.
 *
 * NO ACTOR FIELD. The acting identity travels on `TransitionContext`
 * (`actorOfRecord`), never on a command, so a command cannot name a
 * different actor than the one that dispatched it. The Job-Owner-gated
 * commands need the actor, and they read it from the context.
 */
export type HubCommand =
  /* ---- Job (MOD-DOH-05, §19.7). State machine: draft → pending_approval
   * → active → archived, L27652 / L7151. ---- */
  | {
      readonly type: 'DOH_CREATE_JOB'
      readonly tenant: TenantId
      readonly jobId: string
      readonly name: string
      readonly jobTypeId: string
      /**
       * DEC-AREA-001, adopted working position (b): one PARENT NODE per Job
       * at the tenant's configured depth, not "one Area per Job". Named
       * `parentNodeId` rather than `areaId` so the superseded reading is not
       * re-spelled in a field name; every Area-keyed rule resolves by
       * walking up from here.
       */
      readonly parentNodeId: string
      /**
       * L27652: the Job Owner field "defaults to the creator and is
       * reassignable". Required, never inferred — a Job with no owner has
       * nowhere to route a version-adoption decision or a paired-Job flag.
       */
      readonly ownerId: string
    }
  | {
      readonly type: 'DOH_SUBMIT_JOB_FOR_APPROVAL'
      readonly tenant: TenantId
      readonly jobId: string
    }
  | {
      readonly type: 'DOH_APPROVE_JOB'
      readonly tenant: TenantId
      readonly jobId: string
      /**
       * L27656: "Segregation of duties is absolute: the user who creates a
       * Job cannot approve that same Job." (L27652, cited elsewhere in this
       * file, is the Job Owner sentence and says nothing about approval.)
       * This feeds `evaluateAccess`'s EXISTING `makerCheckerOf` field — the
       * segregation-of-duties gate is already built and is NOT re-spelled
       * here. MOD-DOH-05 row 5 ("Approve a Job the same identity created")
       * is the negative restatement of row 4's condition, not a second act,
       * so it gets no command of its own.
       */
      readonly createdBy: string
    }
  | {
      readonly type: 'DOH_REASSIGN_JOB_OWNER'
      readonly tenant: TenantId
      readonly jobId: string
      readonly newOwnerId: string
    }
  | {
      /** MOD-DOH-05 row 10, L27703. Gated by the Job-Owner predicate. */
      readonly type: 'DOH_DECIDE_VERSION_ADOPTION'
      readonly tenant: TenantId
      readonly jobId: string
      readonly versionNumber: string
      readonly choice: 'adopt' | 'defer'
    }
  | {
      /** MOD-DOH-16 row 5, L29617. Gated by the Job-Owner predicate. */
      readonly type: 'DOH_ACT_ON_PAIRED_REVIEW_FLAG'
      readonly tenant: TenantId
      /** The Job whose owner field routes the flag. */
      readonly jobId: string
      readonly pairedJobId: string
      readonly note: string
    }

  /* ---- Run (MOD-DOH-06, §19.8) ---- */
  | {
      readonly type: 'DOH_SCHEDULE_RUN'
      readonly tenant: TenantId
      readonly runId: string
      readonly jobId: string
      /** §4.6.2: the Shift's NOMINAL date, never the actual start timestamp. */
      readonly productionDate: string
      /**
       * §4.6.1 enumerates `manual`, `auto_scheduled`, `erp_inbound` and
       * `api_inbound`. §4.6.2: "Run creation at V1 is manual, by
       * supervisors; auto-scheduling is deferred beyond V1, and the
       * `auto_scheduled` source value is reserved for it." The other three
       * values are therefore not expressible on a V1 command — a literal
       * type rather than a runtime check, so a deferred capability cannot be
       * dispatched at all.
       */
      readonly runSource: 'manual'
    }
  | {
      readonly type: 'DOH_CANCEL_RUN'
      readonly tenant: TenantId
      readonly runId: string
      /** §4.6.5: "a categorised reason from a fixed list plus optional free text". */
      readonly reasonCode: string
      readonly note: string
    }

  /* ---- Assignment (MOD-DOH-07, §19.9) ---- */
  | {
      readonly type: 'DOH_ASSIGN_WORKER'
      readonly tenant: TenantId
      readonly assignmentId: string
      readonly runId: string
      readonly workerId: string
      /**
       * §4.6.1: "Each run pins its work package — workflow plus
       * work-instruction versions — at assignment; the pin is immutable for
       * the life of the run." The validity of that package is checked
       * through `evaluateAccess`'s EXISTING `requiresValidPackage` /
       * `packageValid` pair. The run pin needs no new mechanism and does not
       * get one here.
       */
      readonly packageRef: string
    }
  | {
      readonly type: 'DOH_SUBSTITUTE_WORKER'
      readonly tenant: TenantId
      readonly assignmentId: string
      readonly runId: string
      readonly outgoingWorkerId: string
      readonly incomingWorkerId: string
      /** §4.6.7: "A supervisor initiates substitution with reason capture." */
      readonly reason: string
    }

  /* ---- Execution Summary (MOD-DOH-08, §19.10) ---- */
  | {
      readonly type: 'DOH_RESOLVE_ANOMALY'
      readonly tenant: TenantId
      readonly summaryId: string
      readonly anomalyId: string
      /** §4.7.3: "Resolution requires a brief closure note — what was done, and who did it." */
      readonly closureNote: string
    }
  | {
      readonly type: 'DOH_ANNOTATE_SUMMARY'
      readonly tenant: TenantId
      readonly summaryId: string
      readonly annotationId: string
      /**
       * §4.7.4: corrections after `finished` are "append-only annotation
       * records: the original stays immutable". There is deliberately no
       * DOH_EDIT_SUMMARY command — the absence is the guarantee.
       */
      readonly text: string
    }

export type HubCommandType = HubCommand['type']

/**
 * The twelve, listed once. `isHubCommand` narrows on membership of this set
 * rather than on a `startsWith('DOH_')` string test, which would be a lie to
 * the type system: a prefix check narrows nothing soundly, and the kernel's
 * exhaustive switches depend on the narrowing being real.
 */
export const HUB_COMMAND_TYPES = [
  'DOH_CREATE_JOB',
  'DOH_SUBMIT_JOB_FOR_APPROVAL',
  'DOH_APPROVE_JOB',
  'DOH_REASSIGN_JOB_OWNER',
  'DOH_DECIDE_VERSION_ADOPTION',
  'DOH_ACT_ON_PAIRED_REVIEW_FLAG',
  'DOH_SCHEDULE_RUN',
  'DOH_CANCEL_RUN',
  'DOH_ASSIGN_WORKER',
  'DOH_SUBSTITUTE_WORKER',
  'DOH_RESOLVE_ANOMALY',
  'DOH_ANNOTATE_SUMMARY',
] as const satisfies readonly HubCommandType[]

// Same exhaustiveness shape as `ROLES` and `PERMISSION_OUTCOMES`: adding a
// thirteenth member to `HubCommand` without listing it here stops
// `MissingFromHubTypes` being `never` and fails the build. Without this, a
// new Hub command would silently fall out of `isHubCommand` and be reported
// by the gateway as "not a recognised action" — a fail-closed refusal, but
// one nobody would trace back to a missing array entry.
type MissingFromHubTypes = Exclude<HubCommandType, (typeof HUB_COMMAND_TYPES)[number]>
const _hubTypesExhaustive: MissingFromHubTypes extends never ? true : never = true
void _hubTypesExhaustive

const HUB_TYPE_SET: ReadonlySet<string> = new Set(HUB_COMMAND_TYPES)

/**
 * The one narrowing the kernel and the gateway use, so each of their five
 * exhaustive switches gains ONE branch for the whole family instead of
 * twelve. Every Hub-specific fact — access rule, action class, validation,
 * state change — lives in `@/surfaces/doh/objects`, not in the kernel.
 */
export function isHubCommand(command: ScenarioCommand): command is HubCommand {
  return HUB_TYPE_SET.has(command.type)
}
