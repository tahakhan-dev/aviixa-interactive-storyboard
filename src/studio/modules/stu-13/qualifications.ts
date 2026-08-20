import { permitsAction } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type StudioAccessDecision,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'
import {
  SEEDED_SCENARIO,
  SEEDED_STATE,
  SEEDED_TENANT,
  affordanceFor,
  studioGrantsFor,
  routedProhibitionApplies,
  studioIdentityFor,
  type CapabilityAffordance,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import {
  createPublishCheckRegister,
  registerPublishChecks,
  type PublishCheckImplementation,
  type PublishCheckRegister,
  type PublishCheckVerdict,
} from '@/studio/publish/register'
import { STU_SEAMS, stuSeamById, type StudioSeamDefinition } from '@/studio/seams'
import { renderAdoption, type AdoptionInput, type AdoptionRendering } from '@/studio/state/adoption'
import type { CommandState } from '@/surfaces/sa/command-state'
import { STU_13_CROSS_SURFACE, stu13Row, type Stu13RowId } from './matrix'

/**
 * `MOD-STU-13` — Qualification Requirements. §5.13, card L33604–L33781.
 *
 * Purpose (L33627): "State authoritatively which certifications a Workflow
 * and its individual screens require, at two levels, validated at three
 * points."
 *
 * ### THE FOUR RULES THIS FILE EXISTS TO HOLD
 *
 * 1. **The tag never decides** (L33612). The mapping pre-populates the
 *    baseline as a convenience; what is stated on the Workflow is
 *    authoritative and the author edits freely over it. `reapplyTag` is
 *    therefore fenced on the baseline's own `source` badge, and a tag that
 *    re-asserted itself over an authored set is the defect this build plants
 *    against.
 * 2. **The stricter default** (L33674). Where the posture cannot be read the
 *    stricter posture, hard-block, applies — "because the configurability
 *    principle permits stricter and never looser." A REJECTED posture (row
 *    11, L33645; Security, L33756: "a looser value is rejected rather than
 *    logged") lands in the same place, through the same function, so a fix to
 *    one reaches both.
 * 3. **Grandfathered but flagged** (L33618). Grandfathered-AND-SILENT is the
 *    defect: an active assignment carries the flag until a supervisor
 *    confirms continuation WITH a recorded reason, and a blank reason is
 *    refused rather than accepted as one.
 * 4. **No clearance is effective before applied** (AC-STU-118, L33769). The
 *    boolean and the rendered words come out of ONE call, so they cannot
 *    disagree — a screen that printed "effective" beside a `delivered`
 *    command is the shape this criterion exists to forbid.
 *
 * ### WHAT THIS MODULE DOES NOT DO, AND SAYS SO
 *
 * Validation runs three times (L33614) and this surface performs NONE of
 * them: the first is the Delivery Operations Hub's at assignment, the second
 * and third are the device's at Run start and at an override-carrying screen.
 * Slice 5 STATES the requirement and packages it. `VALIDATION_POINTS` carries
 * that division as data rather than as prose, so a build that grew a Studio
 * check would have to delete a declared fact to do it.
 *
 * The Studio grants no clearance, sets no posture, sets no clearance
 * duration, and writes no certification record. Those are rows 4 to 7 and
 * row 9 of the card, and they render as statements.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 * Every register — the certification list, the tag mapping, the posture, the
 * seams — arrives as a parameter.
 */

/* ==================================================================== *
 * 1. ENFORCEMENT POSTURE — the only tenant-configurable gate (L33616).
 * ==================================================================== */

/** The two the source names, and no third. L33616. */
export type QualificationPosture = 'hard-block' | 'notify'

export const QUALIFICATION_POSTURES = [
  'hard-block',
  'notify',
] as const satisfies readonly QualificationPosture[]

type MissingFromPostures = Exclude<QualificationPosture, (typeof QUALIFICATION_POSTURES)[number]>
const _posturesExhaustive: MissingFromPostures extends never ? true : never = true
void _posturesExhaustive

/**
 * The loosest posture a tenant may configure. `notify` still requires the
 * supervisor to be notified and to confirm the assignment with a recorded
 * reason (L33616) — it is not "off", and there is nothing below it. Row 11
 * (L33645) refuses going lower to every column, and L33756 states the
 * consequence: "a looser value is rejected rather than logged."
 */
export const PLATFORM_FLOOR_POSTURE: QualificationPosture = 'notify'

/**
 * What applies when the tenant's setting cannot be trusted — L33674, and the
 * `qualification-gate-posture-and-clearance-duration` seam's own contract.
 */
export const STRICTER_DEFAULT_POSTURE: QualificationPosture = 'hard-block'

/** What the tenant administration area reports, or why it could not. */
export type TenantPostureRead =
  | {
      readonly ok: true
      readonly posture: QualificationPosture
      readonly clearanceDurationDays: number
    }
  | { readonly ok: false; readonly reason: string }

export interface RawTenantPosture {
  readonly posture: string
  readonly clearanceDurationDays: number
}

function isPosture(value: string): value is QualificationPosture {
  return (QUALIFICATION_POSTURES as readonly string[]).includes(value)
}

/**
 * Read the tenant's posture. `null` is the unreadable case; a value outside
 * the two is the looser-than-floor case. BOTH return `ok: false`, and both
 * therefore reach `effectivePosture`'s one fallback — a second path for the
 * second case is how one of them ends up looser than the other.
 */
export function readTenantPosture(raw: RawTenantPosture | null): TenantPostureRead {
  if (raw === null) {
    return {
      ok: false,
      reason:
        'the tenant administration area could not be reached, so the posture could not be read',
    }
  }
  if (!isPosture(raw.posture)) {
    return {
      ok: false,
      reason:
        `“${raw.posture}” is not one of the two postures the platform permits ` +
        `(${QUALIFICATION_POSTURES.join(', ')}), so it is rejected rather than logged and ` +
        'adopted (L33756). The gate cannot be configured looser than the platform floor.',
    }
  }
  if (raw.clearanceDurationDays <= 0) {
    return {
      ok: false,
      reason:
        `a clearance duration of ${raw.clearanceDurationDays} days is rejected: a duration that ` +
        'never expires is looser than the platform floor, and a looser value is rejected rather ' +
        'than logged (L33756).',
    }
  }
  return { ok: true, posture: raw.posture, clearanceDurationDays: raw.clearanceDurationDays }
}

/**
 * THE ONE PLACE THE POSTURE IS DECIDED. Unreadable or rejected resolves to
 * `hard-block`, never to `notify` and never to a remembered value.
 */
export function effectivePosture(read: TenantPostureRead): QualificationPosture {
  return read.ok ? read.posture : STRICTER_DEFAULT_POSTURE
}

export interface PostureBanner {
  readonly posture: QualificationPosture
  readonly clearanceDuration: string
  /** Why the posture reads the way it does — including when it was defaulted. */
  readonly statedAs: string
  /** SB-STU-16 (L33725): "marked read-only here". Never a control. */
  readonly readOnlyHere: true
  readonly owner: string
  readonly seamId: string
  readonly sourceRef: string
}

/**
 * SB-STU-16's banner (L33725): "A banner states the tenant's current posture
 * and clearance duration, read from the tenant administration area and marked
 * read-only here."
 */
export function postureBanner(
  read: TenantPostureRead,
  seams: readonly StudioSeamDefinition[] = STU_SEAMS,
): PostureBanner {
  const seam = stuSeamById(seams, 'qualification-gate-posture-and-clearance-duration')
  return {
    posture: effectivePosture(read),
    clearanceDuration: read.ok
      ? `${read.clearanceDurationDays} days`
      : 'not stated — the tenant’s clearance duration could not be read',
    statedAs: read.ok
      ? 'Read from the tenant administration area. The Studio reads this setting and never sets it.'
      : `${read.reason}. The stricter posture, hard-block, applies, because the configurability ` +
        'principle permits stricter and never looser (L33674).',
    readOnlyHere: true,
    owner: seam.owner,
    seamId: seam.id,
    sourceRef: 'L33725, L33674',
  }
}

/* ==================================================================== *
 * 2. THE TWO LEVELS, AND THE TAG THAT NEVER DECIDES.
 * ==================================================================== */

/** SB-STU-16's source badge (L33725), in its own two words. */
export type BaselineSource = 'Pre-populated from tag' | 'Authored'

export const BASELINE_SOURCES = [
  'Pre-populated from tag',
  'Authored',
] as const satisfies readonly BaselineSource[]

/** L33655 — "A requirement is Drafted or Published within a version." */
export type RequirementStatus = 'Drafted' | 'Published'

export const REQUIREMENT_STATUSES = [
  'Drafted',
  'Published',
] as const satisfies readonly RequirementStatus[]

export interface ScreenOverride {
  readonly screenId: string
  readonly screenName: string
  /** ONE additional certification above the baseline, named. */
  readonly certification: string
}

export interface QualificationBaseline {
  readonly certifications: readonly string[]
  readonly source: BaselineSource
}

export interface QualificationRequirement {
  readonly workflowId: string
  readonly workflowName: string
  /** `null` where no Service Type tag is applied. */
  readonly serviceTypeTag: string | null
  readonly baseline: QualificationBaseline
  readonly overrides: readonly ScreenOverride[]
  readonly status: RequirementStatus
}

export interface WorkflowUnderAuthoring {
  readonly workflowId: string
  readonly workflowName: string
  readonly serviceTypeTag: string | null
}

/** What the unregistered tag-to-qualification-set mapping answers, or why not. */
export type TagMappingRead =
  | { readonly ok: true; readonly certifications: readonly string[] }
  | { readonly ok: false; readonly reason: string }

/**
 * The baseline as the screen first finds it.
 *
 * Pre-populated ONLY where a tag is applied AND the mapping answers. Where
 * either is missing the baseline starts empty and `Authored`, which is
 * L33662's own instruction: "where the mapping is unreadable, the author
 * states the baseline manually and publication is not blocked, because the
 * mapping is a convenience rather than a requirement."
 */
export function baselineFor(
  workflow: WorkflowUnderAuthoring,
  mapping: TagMappingRead,
): QualificationRequirement {
  const baseline: QualificationBaseline =
    workflow.serviceTypeTag !== null && mapping.ok
      ? { certifications: [...mapping.certifications], source: 'Pre-populated from tag' }
      : { certifications: [], source: 'Authored' }
  return {
    workflowId: workflow.workflowId,
    workflowName: workflow.workflowName,
    serviceTypeTag: workflow.serviceTypeTag,
    baseline,
    overrides: [],
    status: 'Drafted',
  }
}

/**
 * The author's edit. It always wins, and it always flips the badge: what is
 * stated on the Workflow is authoritative from this point on (L33612).
 */
export function editBaseline(
  requirement: QualificationRequirement,
  certifications: readonly string[],
): QualificationRequirement {
  return {
    ...requirement,
    baseline: { certifications: [...certifications], source: 'Authored' },
  }
}

/**
 * Re-applying the tag — the convenience, offered again.
 *
 * IT REFUSES AN AUTHORED BASELINE. "The tag never decides the requirement"
 * (L33612), and L54899's worked case is exactly this: the author removes one
 * of the tag's certifications and "the Job runs on his edited set, not the
 * tag's." A build where the tag re-asserts itself over an author edit has
 * inverted the rule while still rendering the same two badges.
 *
 * It still re-applies over a baseline the author has NOT touched, because the
 * pre-population is a real convenience and fencing it off entirely would
 * remove the feature rather than the defect.
 */
export function reapplyTag(
  requirement: QualificationRequirement,
  mapping: TagMappingRead,
): QualificationRequirement {
  if (requirement.baseline.source === 'Authored') return requirement
  if (requirement.serviceTypeTag === null || !mapping.ok) return requirement
  return {
    ...requirement,
    baseline: {
      certifications: [...mapping.certifications],
      source: 'Pre-populated from tag',
    },
  }
}

/** L33638's second level: an additional certification for one screen. */
export function addOverride(
  requirement: QualificationRequirement,
  override: ScreenOverride,
): QualificationRequirement {
  return { ...requirement, overrides: [...requirement.overrides, override] }
}

export function removeOverride(
  requirement: QualificationRequirement,
  screenId: string,
  certification: string,
): QualificationRequirement {
  return {
    ...requirement,
    overrides: requirement.overrides.filter(
      (o) => !(o.screenId === screenId && o.certification === certification),
    ),
  }
}

/* ==================================================================== *
 * 3. PUBLISH CHECK 8 — every named certification still maintained.
 * ==================================================================== */

/**
 * The overrides naming a certification the tenant does not maintain.
 *
 * The maintained list is a PARAMETER, read across the
 * `worker-certification-list` seam from slice 4's `MOD-DOH-04` fixture. The
 * Studio cannot create, edit or delete a certification record (AC-STU-119,
 * L33770) and there is no function here that would.
 */
export function unmaintainedOverrides(
  requirement: QualificationRequirement,
  maintained: readonly string[],
): readonly ScreenOverride[] {
  const known = new Set(maintained)
  return requirement.overrides.filter((o) => !known.has(o.certification))
}

/**
 * Publish check 8. `FUNC-STU-13-01-B-1` (L33664): "an override naming a
 * certification the tenant does not maintain blocks publication WITH THE
 * CERTIFICATION NAMED." The screen is named too, because "which certification"
 * without "on which screen" does not tell the author where to go.
 */
export function certificationMaintainedCheck(
  maintained: readonly string[],
): PublishCheckImplementation<QualificationRequirement> {
  return {
    checkId: 'certification-maintained',
    implementedBy: 'MOD-STU-13',
    run: (subject): PublishCheckVerdict => {
      if (maintained.length === 0) {
        // FB-STU-09 / AC-STU-149: a check that cannot run blocks, failing
        // closed. An empty maintained list cannot answer "is this
        // certification maintained", and answering "no" for every override
        // would misreport the tenant rather than report the read.
        return {
          outcome: 'cannot-run',
          reason:
            'the tenant’s certification list could not be read from the Delivery Operations Hub, ' +
            'so no override on this Workflow can be checked against it. Publication is blocked ' +
            'rather than assumed.',
        }
      }
      const offending = unmaintainedOverrides(subject, maintained)
      if (offending.length === 0) return { outcome: 'passed' }
      return {
        outcome: 'blocked',
        blockingElement: offending
          .map((o) => `“${o.certification}” on ${o.screenId} (${o.screenName})`)
          .join('; '),
      }
    },
  }
}

/**
 * This module's own publish register — check 8 and nothing else (C4: a module
 * implementing a sibling's check is a defect).
 *
 * `evaluatePublish` fails closed on the other ten, so a caller holding only
 * this register sees ten `cannot-run` blockers beside whatever check 8 says.
 * That is the register's correct behaviour and NOT a verdict about this
 * Workflow — which is why the covering test asserts on the
 * `certification-maintained` blocker rather than on `blocked`.
 */
export function stu13PublishRegister(
  maintained: readonly string[],
): PublishCheckRegister<QualificationRequirement> {
  const result = registerPublishChecks(
    createPublishCheckRegister<QualificationRequirement>(),
    certificationMaintainedCheck(maintained),
  )
  if (!result.ok) {
    throw new Error(
      `MOD-STU-13 could not register publish check 8: ${result.failure} ` +
        `(attempted by ${result.attemptedBy}).`,
    )
  }
  return result.register
}

/* ==================================================================== *
 * 4. THE THREE VALIDATION POINTS — none of them performed here.
 * ==================================================================== */

export interface ValidationPoint {
  readonly id: 'at-assignment' | 'at-run-start' | 'at-an-override-carrying-screen'
  readonly name: string
  /** Where the check actually runs. Never `SURF-STU`. */
  readonly performedOn: 'SURF-DOH' | 'device'
  /**
   * Always `false`. Carried as data rather than as prose so that growing a
   * Studio-side check would have to delete a stated fact to do it.
   */
  readonly performedHere: false
  /** The declared seam, where one exists for the far side. */
  readonly seamId: string | null
  readonly statement: string
  readonly sourceRef: string
}

/** L33614, and `FEAT-STU-13-02`'s three sub-features (L33665–L33671). */
export const VALIDATION_POINTS = [
  {
    id: 'at-assignment',
    name: 'At assignment, in the Delivery Operations Hub',
    performedOn: 'SURF-DOH',
    performedHere: false,
    seamId: 'qualification-validation-at-assignment',
    statement:
      'Assignment is a connected action in the Delivery Operations Hub, and the check runs there — ' +
      '“to catch the problem before the worker walks to the station”. The Studio states the ' +
      'requirement this check reads; it does not perform the check.',
    sourceRef: 'FUNC-STU-13-02-A-1 L33667',
  },
  {
    id: 'at-run-start',
    name: 'At Run start, on the device',
    performedOn: 'device',
    performedHere: false,
    seamId: 'package-delivery-on-device',
    statement:
      'Evaluated on the device against the packaged requirement and the device’s trusted credential ' +
      'state within the offline credential trust window — it catches a lapse between assignment and ' +
      'execution, and needs no connection to do it.',
    sourceRef: 'FUNC-STU-13-02-B-1 L33669',
  },
  {
    id: 'at-an-override-carrying-screen',
    name: 'At an override-carrying screen, on the device',
    performedOn: 'device',
    performedHere: false,
    seamId: 'package-delivery-on-device',
    statement:
      'The higher requirement is checked at the moment it applies. A gate block encountered offline ' +
      'parks the run, the worker continues other assigned runs, and the parked run resumes when the ' +
      'clearance arrives.',
    sourceRef: 'FUNC-STU-13-02-C-1 L33671',
  },
] as const satisfies readonly ValidationPoint[]

/* ==================================================================== *
 * 5. CLEARANCE — never effective before the command applies (AC-STU-118).
 * ==================================================================== */

/**
 * The command states at which a clearance IS in effect on the device.
 *
 * `applied` is the criterion's own word (L33769); `acknowledged` is the state
 * after it, whose phrase is "applied and acknowledged" — excluding it would
 * make a clearance stop being effective the moment the device confirmed it.
 * Nothing earlier is here, and that is the whole criterion.
 */
export const CLEARANCE_EFFECTIVE_STATES = [
  'applied',
  'acknowledged',
] as const satisfies readonly CommandState[]

export interface ClearanceStanding {
  readonly effective: boolean
  /** Task 2's renderer — the only adoption vocabulary this surface may use. */
  readonly rendering: AdoptionRendering
}

/**
 * ONE call produces both the boolean and the words. They cannot disagree,
 * which is the difference between a criterion and a convention: a screen that
 * printed "effective" beside "delivered, not yet applied" is exactly what
 * AC-STU-118 forbids, and it is unreachable from here.
 */
export function clearanceEffective(input: AdoptionInput): ClearanceStanding {
  const rendering = renderAdoption(input)
  const effective =
    rendering.determinate &&
    input.commandState !== null &&
    (CLEARANCE_EFFECTIVE_STATES as readonly CommandState[]).includes(input.commandState)
  return { effective, rendering }
}

/* ==================================================================== *
 * 6. EVALUATION AGAINST AN ASSIGNMENT — L33655's five states.
 * ==================================================================== */

export type RequirementEvaluation =
  | 'Satisfied'
  | 'Unsatisfied-blocked'
  | 'Unsatisfied-notified'
  | 'Cleared'
  | 'Grandfathered-and-flagged'

export const REQUIREMENT_EVALUATIONS = [
  'Satisfied',
  'Unsatisfied-blocked',
  'Unsatisfied-notified',
  'Cleared',
  'Grandfathered-and-flagged',
] as const satisfies readonly RequirementEvaluation[]

type MissingFromEvaluations = Exclude<
  RequirementEvaluation,
  (typeof REQUIREMENT_EVALUATIONS)[number]
>
const _evaluationsExhaustive: MissingFromEvaluations extends never ? true : never = true
void _evaluationsExhaustive

export interface RequirementEvaluationInput {
  readonly required: readonly string[]
  readonly held: readonly string[]
  readonly posture: QualificationPosture
  /** `null` where no clearance has been granted for this assignment. */
  readonly clearance: AdoptionInput | null
  /** L33618 — an active assignment carried through a requirement change. */
  readonly grandfathered: boolean
}

/**
 * The evaluation, in the order the source states its consequences.
 *
 * Grandfathering is read FIRST because it is a statement about the
 * assignment, not about the certificate: L33618 grandfathers an active
 * assignment through a requirement change, and re-deciding it on the new
 * requirement would strand exactly the worker the rule protects.
 */
export function evaluateAgainstAssignment(
  input: RequirementEvaluationInput,
): RequirementEvaluation {
  if (input.grandfathered) return 'Grandfathered-and-flagged'

  const held = new Set(input.held)
  if (input.required.every((c) => held.has(c))) return 'Satisfied'

  if (input.clearance !== null && clearanceEffective(input.clearance).effective) return 'Cleared'

  return input.posture === 'hard-block' ? 'Unsatisfied-blocked' : 'Unsatisfied-notified'
}

/* ==================================================================== *
 * 7. GRANDFATHERING — flagged, confirmed, and the reason recorded.
 * ==================================================================== */

export interface GrandfatheredContinuation {
  readonly confirmedBy: string
  readonly reason: string
  readonly at: string
}

export interface Assignment {
  readonly assignmentId: string
  readonly workerName: string
  /** ISO stamp, supplied. This module derives nothing from time. */
  readonly runScheduledAt: string
  /** Whether the assignment is live at the moment the version publishes. */
  readonly active: boolean
  readonly flagged: boolean
  readonly continuation: GrandfatheredContinuation | null
  readonly evaluation: RequirementEvaluation
}

export interface RequirementChange {
  /** Runs scheduled after publication: the change applies to them outright. */
  readonly appliesTo: readonly string[]
  /** Active assignments: grandfathered, AND flagged. Never silently carried. */
  readonly grandfathered: readonly Assignment[]
}

/**
 * L33618 — "A certification-requirement change applies to Runs scheduled
 * after the version carrying it is published; active assignments are
 * grandfathered but flagged, with the supervisor confirming continuation and
 * a recorded reason."
 *
 * GRANDFATHERED-AND-SILENT IS THE DEFECT. The flag goes up here, the
 * continuation is `null` here, and only `confirmContinuation` can take the
 * flag down.
 */
export function applyRequirementChange(
  assignments: readonly Assignment[],
  publishedAt: string,
): RequirementChange {
  const appliesTo: string[] = []
  const grandfathered: Assignment[] = []
  for (const assignment of assignments) {
    if (assignment.active) {
      grandfathered.push({
        ...assignment,
        flagged: true,
        continuation: null,
        evaluation: 'Grandfathered-and-flagged',
      })
      continue
    }
    if (assignment.runScheduledAt > publishedAt) appliesTo.push(assignment.assignmentId)
  }
  return { appliesTo, grandfathered }
}

export type ContinuationResult =
  | { readonly ok: true; readonly assignment: Assignment }
  | { readonly ok: false; readonly reason: string }

/**
 * `FUNC-STU-13-04-A-1` (L33679): "no role may clear the flag without a
 * recorded reason; no agent may confirm."
 *
 * A blank or whitespace reason is REFUSED, and the assignment comes back
 * unchanged — the flag stays up, which is the whole point of the rule.
 */
export function confirmContinuation(
  assignment: Assignment,
  confirmation: { readonly confirmedBy: string; readonly reason: string; readonly at?: string },
): ContinuationResult {
  if (confirmation.reason.trim() === '') {
    return {
      ok: false,
      reason:
        'the continuation was not confirmed: no role may clear the flag without a recorded reason ' +
        '(FUNC-STU-13-04-A-1, L33679). The assignment stays flagged.',
    }
  }
  if (confirmation.confirmedBy.trim() === '') {
    return {
      ok: false,
      reason:
        'the continuation was not confirmed: the supervisor confirming it must be recorded, ' +
        'because the confirmation is auditable (L33754).',
    }
  }
  return {
    ok: true,
    assignment: {
      ...assignment,
      flagged: false,
      continuation: {
        confirmedBy: confirmation.confirmedBy,
        reason: confirmation.reason,
        at: confirmation.at ?? assignment.runScheduledAt,
      },
    },
  }
}

/* ==================================================================== *
 * 8. THE OFFLINE PARK — AC-STU-117 (L33768).
 * ==================================================================== */

export type RunState = 'Available' | 'Parked'

export interface RunOnDevice {
  readonly runId: string
  readonly name: string
  readonly state: RunState
  readonly parkedReason: string | null
}

/**
 * "A gate block encountered offline parks the run and the worker continues
 * other assigned runs" (AC-STU-117, L33768).
 *
 * ONLY the blocked run parks. The parked state is honest: the run is not
 * failed and the worker is not idle (L33723). A build that took the other
 * runs down with it would turn the honest park into an idle shift.
 *
 * This is the DEVICE's behaviour, packaged by the Studio and previewed here.
 * The Studio performs no gate check — see `VALIDATION_POINTS`.
 */
export function parkOnGateBlock(
  runs: readonly RunOnDevice[],
  blockedRunId: string,
  certification: string,
): readonly RunOnDevice[] {
  return runs.map((run) =>
    run.runId === blockedRunId
      ? {
          ...run,
          state: 'Parked',
          parkedReason:
            `Parked at an override-carrying screen requiring “${certification}”. Under hard-block ` +
            'the run resumes when a granted clearance reaches applied on the device; the worker ' +
            'continues their other assigned runs meanwhile.',
        }
      : run,
  )
}

/* ==================================================================== *
 * 9. THE CROSS-WORKFLOW VIEW — SB-STU-16's third tab (L33725).
 * ==================================================================== */

export interface CrossWorkflowRequirement {
  readonly certification: string
  /** Workflows requiring it, at either level. */
  readonly workflowCount: number
  /** Screens carrying an override that names it. */
  readonly screenCount: number
  readonly workflows: readonly string[]
}

/**
 * "A cross-Workflow tab shows every requirement in the workspace grouped by
 * certification, with the count of Workflows and screens requiring it."
 *
 * The two counts measure DIFFERENT things and are deliberately not the same
 * number: a baseline requirement is stated on the WORKFLOW and contributes no
 * screen, because it applies to every screen and counting it as one would be
 * a number nobody could act on. A screen counts once per distinct screen
 * carrying an override that names the certification.
 */
export function crossWorkflowRequirements(
  requirements: readonly QualificationRequirement[],
): readonly CrossWorkflowRequirement[] {
  const workflows = new Map<string, Set<string>>()
  const screens = new Map<string, Set<string>>()

  const noteWorkflow = (certification: string, workflowName: string): void => {
    const existing = workflows.get(certification) ?? new Set<string>()
    existing.add(workflowName)
    workflows.set(certification, existing)
  }

  for (const requirement of requirements) {
    for (const certification of requirement.baseline.certifications) {
      noteWorkflow(certification, requirement.workflowName)
      if (!screens.has(certification)) screens.set(certification, new Set<string>())
    }
    for (const override of requirement.overrides) {
      noteWorkflow(override.certification, requirement.workflowName)
      const existing = screens.get(override.certification) ?? new Set<string>()
      existing.add(`${requirement.workflowId}/${override.screenId}`)
      screens.set(override.certification, existing)
    }
  }

  return [...workflows.entries()]
    .map(([certification, names]) => ({
      certification,
      workflowCount: names.size,
      screenCount: screens.get(certification)?.size ?? 0,
      workflows: [...names].sort(),
    }))
    .sort((a, b) => a.certification.localeCompare(b.certification))
}

/* ==================================================================== *
 * 10. THE DECISION — PER CONTROL, OVER A MATRIX ROW.
 * ==================================================================== */

/** The reviewer-varied scenario, consumed from `MOD-STU-18`, never re-declared. */
export type Stu13Scenario = Stu18Scenario

export function stu13Scenario(over: Partial<Stu13Scenario> = {}): Stu13Scenario {
  return { ...SEEDED_SCENARIO, ...over }
}

/**
 * THE ONE ACCESS CALL THIS MODULE MAKES. Every control routes through here,
 * per control, over that control's own matrix row — never over a
 * module-level role list.
 *
 * Composed here rather than through `MOD-STU-18`'s `decisionForRow`, whose
 * parameter is typed to that module's own row union; the identity seed, the
 * grant map and the domain state ARE consumed from it, so nothing about "who
 * is being viewed as" is declared twice. `MOD-STU-05` and `MOD-STU-07`
 * recorded the same observation.
 */
export function stu13Decision(
  rowId: Stu13RowId,
  persona: StudioPersonaColumn,
  ctx: Stu13Scenario = SEEDED_SCENARIO,
): StudioAccessDecision {
  const s: Stu13Scenario = { ...ctx, persona }
  return evaluateStudioAccess({
    row: stu13Row(rowId),
    identity: studioIdentityFor(persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    // No row of this card occupies an approval stage: stating a requirement
    // happens before a submission exists. `MOD-STU-11` owns the chain.
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  })
}

/* ==================================================================== *
 * 11. THE CONTROLS THIS SCREEN OFFERS.
 * ==================================================================== */

/**
 * The write functions a control may invoke. A control that renders enabled
 * with no key here does not type-check, and the covering test looks the key
 * up rather than trusting that a handler was passed — a control that renders
 * enabled and does nothing is this build's most-shipped defect.
 */
export const qualificationService = {
  editBaseline,
  reapplyTag,
  addOverride,
  removeOverride,
  confirmContinuation,
  // A READ, and it belongs here for the same reason the writes do: the
  // cross-Workflow tab is a capability the matrix answers for, and a tab that
  // opens onto nothing is the same defect as a button that writes nothing.
  crossWorkflowRequirements,
} as const

export interface QualificationControl {
  readonly id: Stu13RowId
  readonly label: string
  readonly affordance: CapabilityAffordance
  readonly serviceKey: keyof typeof qualificationService | null
  readonly sourceRefs: readonly string[]
}

const CONTROL_LABELS = {
  'state-the-workflow-qualification-baseline': 'State the baseline certifications',
  'add-a-screen-level-override': 'Add a screen-level override',
  'edit-over-a-tag-driven-pre-population': 'Edit over the tag pre-population',
  'set-hard-block-versus-notify-posture': 'Set the enforcement posture',
  'set-clearance-duration': 'Set the clearance duration',
  'confirm-continuation-of-a-grandfathered-assignment': 'Confirm continuation',
  'enter-or-amend-a-worker-certification-record': 'Enter or amend a certification record',
  'view-the-cross-workflow-requirement-view': 'Open the cross-Workflow view',
  'make-the-qualification-gate-looser-than-the-platform-floor':
    'Make the gate looser than the platform floor',
} as const satisfies Readonly<Record<Stu13RowId, string>>

/**
 * Which service function each control invokes. `null` on the four rows no
 * persona may ever act on, and that is the honest answer rather than an
 * omission: there is no function for an act the platform refuses to everyone,
 * and none for an act that happens on another surface.
 */
const CONTROL_SERVICE = {
  'state-the-workflow-qualification-baseline': 'editBaseline',
  'add-a-screen-level-override': 'addOverride',
  'edit-over-a-tag-driven-pre-population': 'reapplyTag',
  'set-hard-block-versus-notify-posture': null,
  'set-clearance-duration': null,
  'confirm-continuation-of-a-grandfathered-assignment': 'confirmContinuation',
  'enter-or-amend-a-worker-certification-record': null,
  'view-the-cross-workflow-requirement-view': 'crossWorkflowRequirements',
  'make-the-qualification-gate-looser-than-the-platform-floor': null,
} as const satisfies Readonly<Record<Stu13RowId, keyof typeof qualificationService | null>>

/**
 * Task 11's routed-prohibition branch: a prohibited cell renders DISABLED
 * only where the capability it is routed to actually PERMITS ACTING for THIS
 * persona. Handed decisions; computes no permission of its own.
 *
 * **THIS MODULE USED TO ASK A DIFFERENT QUESTION, AND THE SOURCE SETTLED IT
 * AGAINST THAT READING.** `routedCapabilityIsHeld` scanned all eight columns
 * and answered "does anybody hold this, anywhere" — so row 5's Quality
 * Manager cell rendered DISABLED on the strength of the TENANT ADMIN's
 * `Allowed`. The frozen source refuses that rendering by name, twice:
 *
 * - `AC-CC-012` (L35037): "A Supervisor session renders only Areas within
 *   its scope grant; an out-of-scope Area is **absent, not greyed**." Another
 *   Supervisor holds that Area. It is still absent for this one.
 * - `SCR-SA-USR-01` (L14977): account creation is root-only, and "for every
 *   other console role it renders as an explanatory line reading 'Account
 *   creation is root-only', **never as a greyed control**." The root identity
 *   holds it. It is still not greyed for anybody else.
 *
 * And the implication the source attaches to a greyed control is the reason:
 * `SB-ARCH-018` (L12889) refuses one "because showing a greyed control would
 * imply the setting **could exist**", and `FUNC-SA-09-06-A2` (L45068) refuses
 * one because "greyed controls imply the action exists **elsewhere**". A
 * disabled control is a promise about what THIS reader could reach. So the
 * question is asked of this persona's own column, through the one predicate
 * the surface shares — `routedProhibitionApplies` — and this module's own
 * matrix header (`./matrix.ts`) already stated the rule that way.
 *
 * WHAT THAT CHANGES HERE: row 5's Quality Manager cell renders ABSENT with
 * its own words ("Explicitly prohibited — the posture is a tenant setting")
 * standing where the control would be. The route is not deleted; it is
 * CHECKED, and the check closes it. The Tenant Admin's cell on the same row
 * still renders disabled, through the `another-surface` arm below, because
 * that persona genuinely does hold the act — over there.
 */
export function qualificationAffordance(
  label: string,
  decision: StudioAccessDecision,
  surface: StudioMatrixRowSurface,
  routedTo: Stu13RowId | null,
  routedDecision: StudioAccessDecision | null,
): CapabilityAffordance {
  if (routedProhibitionApplies(decision, routedTo, routedDecision)) {
    return {
      kind: 'disabled',
      label,
      reason:
        `${decision.reason} ${CONTROL_LABELS[routedTo]} is held in the tenant administration ` +
        'area, which is where it is done — never here.',
    }
  }
  // AN `another-surface` ROW IS NEVER AN ENABLED STUDIO CONTROL, WHOEVER THE
  // PERSONA IS. Row 5's Tenant Admin cell reads `Allowed — in the tenant
  // administration area`: the capability IS met, and NOT here. Drawing that
  // as a live button would put the Studio's name on somebody else's act and
  // would contradict TEST-STU-118 (L33775), which requires no such control to
  // exist. The cell's own words are what renders, so the permission is stated
  // rather than hidden (AC-STU-155).
  if (surface === 'another-surface' && permitsAction(decision.decision)) {
    return {
      kind: 'disabled',
      label,
      reason:
        `${decision.reason} — and it is done there, never in the Studio. This surface reads the ` +
        'setting and states it; it offers no control that changes it.',
    }
  }
  return affordanceFor(label, decision)
}

/**
 * Every row of the persona matrix, in source order, with the affordance this
 * persona actually gets. Rows the platform refuses to everyone are still
 * listed: `AC-STU-155` requires an unavailable capability to be SHOWN with
 * its reason rather than hidden, so the list is the same length for every
 * persona and a note stands where a control would be.
 */
export function qualificationControls(
  s: Stu13Scenario = SEEDED_SCENARIO,
): readonly QualificationControl[] {
  return (Object.keys(CONTROL_LABELS) as Stu13RowId[]).map((id) => {
    const row = stu13Row(id)
    const decision = stu13Decision(id, s.persona, s)
    const routedTo = row.routedTo[s.persona]
    const affordance = qualificationAffordance(
      CONTROL_LABELS[id],
      decision,
      row.surface,
      routedTo,
      routedTo === null ? null : stu13Decision(routedTo, s.persona, s),
    )
    return {
      id,
      label: CONTROL_LABELS[id],
      affordance,
      serviceKey: affordance.kind === 'enabled' ? CONTROL_SERVICE[id] : null,
      sourceRefs: row.sourceRefs,
    }
  })
}

/** Whether this persona may act on one row — the evaluator's answer, reused. */
export function permitsRow(
  id: Stu13RowId,
  persona: StudioPersonaColumn,
  s: Stu13Scenario = SEEDED_SCENARIO,
): boolean {
  return permitsAction(stu13Decision(id, persona, s).decision)
}

/* ==================================================================== *
 * 12. THE CROSS-SURFACE STATEMENTS, READ THROUGH THEIR DECLARED SEAMS.
 * ==================================================================== */

export interface CrossSurfaceStatement {
  readonly id: (typeof STU_13_CROSS_SURFACE)[number]['id']
  readonly capability: string
  readonly heldOn: string
  readonly owner: string
  readonly statement: string
  readonly seam: StudioSeamDefinition
  readonly cells: readonly { readonly column: string; readonly text: string }[]
  readonly sourceRefs: readonly string[]
}

/**
 * Rows 4 and 7, drawn as stated facts and never as controls. Each resolves
 * its own seam record, so a screen cannot render the statement while pointing
 * at a seam that says something else.
 */
export function crossSurfaceStatements(
  seams: readonly StudioSeamDefinition[] = STU_SEAMS,
): readonly CrossSurfaceStatement[] {
  return STU_13_CROSS_SURFACE.map((row) => ({
    id: row.id,
    capability: row.capability,
    heldOn: row.heldOn,
    owner: row.owner,
    statement: row.statement,
    seam: stuSeamById(seams, row.seamId),
    cells: row.cells,
    sourceRefs: row.sourceRefs,
  }))
}
