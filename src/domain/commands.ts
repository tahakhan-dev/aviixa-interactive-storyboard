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
 * FIFTEEN, AGAINST THIRTY-FOUR WRITE ACTS THE MATRICES NAME. The gap is
 * MEASURED rather than estimated, by `tests/unit/doh-objects.test.ts`, which
 * derives the write acts from the six Hub matrices themselves — a row this
 * module's own screen carries, that some role may ACT on, and that the
 * Read-only Auditor does not hold — and pairs each with its command or with
 * none. The old wording here said the matrices name "roughly twenty-five"
 * acts and gave no way to check it; a count nothing can re-derive is a count
 * that drifts, and this one was low by nine.
 *
 * WHY THESE FIFTEEN. Twelve are the acts named by something outside this
 * file: the eight steps of the operational journey the plan's task 13 spells
 * out (Job drafted, approved by a second person, run scheduled, worker
 * assigned with the package pinned, run submitted, Summary computed, anomaly
 * resolved, run finished — of which "submitted", "Summary computed" and
 * "finished" are AUTOMATIC transitions with no actor and therefore belong to
 * the due-transition evaluator, not here), plus the three rows the Job-Owner
 * predicate gates and the state-machine step (`submit for approval`) without
 * which `draft` cannot reach `active`.
 *
 * THE THREE ADDED HERE ARE THE ACTS WHOSE OWN IDENTITY CARD NAMES A HUB
 * WRITE PATTERN AND WHICH HAD NO COMMAND AT ALL. `MOD-DOH-15`'s card
 * (L29471) names `FB-DOH-WRITE-002` primary and its whole module is one
 * write — the clone — which had no command, so the audit line the source
 * requires at L29543 had nothing to hang off. `MOD-DOH-16`'s card (L29607)
 * names `FB-DOH-WRITE-002` "for the pairing act", and its rows 1 and 2
 * (L29613, L29614) create and remove a pairing, writing the `linked_job_ref`
 * the card's Outputs line names on each Job; the only pairing command that
 * existed was `DOH_ACT_ON_PAIRED_REVIEW_FLAG`, which acts on a pairing
 * nothing could make.
 *
 * NOTHING ELSE IS MINTED. The other nineteen write acts are real, and the
 * derivation names every one of them rather than leaving the gap as a round
 * number — configuration writes made on `SCR-DOH-23`, edits and archival on
 * a Job, the two review-queue writes `MOD-DOH-08` renders, the recurrence
 * prompt whose allowed role is not one of the five. A command for an act no
 * card names as this surface's write would be a consumer invented to justify
 * a type.
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
      /**
       * §4.5.1 (L27648) lists "its recurrence pattern" among the fields a
       * Job carries, and L7155 sets it at creation. Required for the same
       * reason `ownerId` is: `AC-DOH-15-3` turns on whether the SOURCE Job
       * recurs, and a Job whose recurrence nothing recorded cannot answer.
       * `ONE_OFF_RECURRENCE` in `@/surfaces/doh/objects` is the source's own
       * token for no recurrence; every other value is the tenant's own
       * pattern text, which the source never enumerates.
       */
      readonly recurrence: string
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

  /* ---- Cloning (MOD-DOH-15, §19.17) ---- */
  | {
      /**
       * MOD-DOH-15 row 1, L29477. ONE TRANSACTION, which is `AC-DOH-15-5`:
       * "No partial clone can exist." L29452 names the six elements copied
       * and the three reset, so the clone carries only what it cannot
       * derive from the source Job — a new identifier, a new name and an
       * owner. Everything else is read off the source record, which is what
       * makes "copies exactly the six named elements and no others"
       * (`AC-DOH-15-1`) checkable rather than restated.
       *
       * THERE IS NO `recurrence` FIELD, AND THAT IS `AC-DOH-15-2`: a clone
       * resets recurrence to one-off, unconditionally. Letting the command
       * carry a recurrence would make the reset optional. The prompt at
       * L29452 — "This was cloned from a recurring Job — set recurrence
       * now?" — is a SECOND act (row 2, L29478) with its own role cells,
       * and it is not minted here.
       */
      readonly type: 'DOH_CLONE_JOB'
      readonly tenant: TenantId
      readonly sourceJobId: string
      readonly jobId: string
      readonly name: string
      readonly ownerId: string
    }

  /* ---- Pairing (MOD-DOH-16, §19.18) ---- */
  | {
      /**
       * MOD-DOH-16 row 1, L29613. The card's Outputs line (L29598) names
       * "the `linked_job_ref` on each Job", so this writes BOTH — a pairing
       * recorded on one side only is a link one of the two Jobs cannot see.
       *
       * NOT GATED BY THE JOB-OWNER PREDICATE. Row 1's cells are `Allowed`
       * for the Tenant Admin and `Allowed with conditions — must hold scope
       * over both Jobs` for the Supervisor; neither mentions the Job Owner.
       * Only rows 4 and 5, the review flag, are owner-conditioned.
       */
      readonly type: 'DOH_PAIR_JOBS'
      readonly tenant: TenantId
      readonly jobId: string
      readonly pairedJobId: string
    }
  | {
      /** MOD-DOH-16 row 2, L29614. Same cells as row 1, and the same two
       *  writes in reverse: L29629's removal clears both sides. */
      readonly type: 'DOH_UNPAIR_JOBS'
      readonly tenant: TenantId
      readonly jobId: string
      readonly pairedJobId: string
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
 * The fifteen, listed once. `isHubCommand` narrows on membership of this set
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
  'DOH_CLONE_JOB',
  'DOH_PAIR_JOBS',
  'DOH_UNPAIR_JOBS',
  'DOH_SCHEDULE_RUN',
  'DOH_CANCEL_RUN',
  'DOH_ASSIGN_WORKER',
  'DOH_SUBSTITUTE_WORKER',
  'DOH_RESOLVE_ANOMALY',
  'DOH_ANNOTATE_SUMMARY',
] as const satisfies readonly HubCommandType[]

// Same exhaustiveness shape as `ROLES` and `PERMISSION_OUTCOMES`: adding a
// sixteenth member to `HubCommand` without listing it here stops
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
