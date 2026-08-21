import type { ComponentType } from 'react'
import { fixedClock } from '@/domain/clock'
import { HUB_COMMAND_TYPES } from '@/domain/commands'
import { isRefusal, permitsAction } from '@/policy/decision'
import { crossSurfaceStatement } from '@/surfaces/doh/boundary'
import { validateHubCommand } from '@/surfaces/doh/objects'
import {
  ACTING_STATUSES,
  DEC_FINISH_001_MOUNTED,
  DEC_RUNSTATE_001,
  DEC_STUCK_001,
  TENANT_ROLE_ORDER,
  closingPosition,
  finishWindowEndsAtMs,
  matrixRow,
  readingsDisagree,
  runStateReadings,
  stateIsGovernedByDecStuck,
  type ClosingPosition,
} from '@/surfaces/doh/modules/doh-06/matrix'
import { dueTransitions, finishWindowVerdict } from '@/surfaces/doh/transitions'
import { approveDecision } from '@/surfaces/doh/modules/doh-05/access'
import { SEEDED_JOBS, type SeededJob } from '@/surfaces/doh/modules/doh-05/jobs'
import {
  APPROVAL_QUEUE_ROUTE,
  JOB_LIFECYCLE_ROUTE,
} from '@/surfaces/doh/modules/doh-05/routes'
import { JOURNEY_REFUSALS, JOURNEY_STEPS, journeyStep } from './effects'
import {
  HUB_TENANT_ID,
  JOURNEY_PACKAGE_PIN,
  JOURNEY_RUN_ID,
  WINDOW_ELAPSES_AT_MS,
  clockAt,
  journeyStates,
  type HubJourneyState,
} from './fixture'
import { JobLifecycleScreen } from '../job-lifecycle-and-approval/JobLifecycleScreen'
import { JobApprovalQueueScreen } from '../job-approval-queue/JobApprovalQueueScreen'
import { RunSchedulingScreen } from '../run-scheduling-and-execution-oversight/RunSchedulingScreen'
import { WorkerAssignmentScreen } from '../worker-assignment/WorkerAssignmentScreen'
import { ExecutionSummaryReviewScreen } from '../execution-summary-review/ExecutionSummaryReviewScreen'

/**
 * The operational journey's COMPOSITION — which real Hub module route each of
 * the nine steps is performed on.
 *
 * THIS FILE RE-IMPLEMENTS NOTHING, AND THAT IS THE WHOLE DESIGN. Every row
 * below points at a route screen that already exists under `app/hub/`,
 * imported as a component and rendered whole. The journey draws no Job form,
 * no run board, no assignment picker and no anomaly control, because every one
 * of those already exists one component away and a control drawn twice is a
 * control that can disagree with itself.
 *
 * WHERE THE ACT BELONGS TO ANOTHER SURFACE THERE IS NO ROUTE AT ALL. Step 6 —
 * the shift running on the tablet — is row 8 of the eight-row boundary
 * register (§19.1.2, L25726): step execution, data capture, offline operation
 * and device modes belong to the Frontline Worker Application PERMANENTLY, and
 * the Hub "does not carry its user interface or its decision rights" (L25715).
 * It renders `CrossSurfaceStatement` and offers no control — not a disabled
 * one either, because a disabled control implies a condition that could become
 * true and this boundary does not move.
 *
 * IT IS NOT A `SeamNotice`, AND THE DIFFERENCE IS A CLAIM ABOUT THE PRODUCT.
 * `SeamNotice` says "not built here — owned by module X, slice N", which is a
 * claim about a SCHEDULE and comes true when slice N ships. Saying that over
 * step execution would tell a reader the platform is behind on something it is
 * never building here. `CrossSurfaceStatement` claims a PLACE. The Studio's own
 * journey makes the mirror-image call at its step 19: the PIN is stated there
 * and never offered, because the pin is a Hub act — and it is step 5 here,
 * where it is performed on `MOD-DOH-06`'s real route (`WF-AUT-010`, L53668).
 *
 * CROSSING A MODULE IS NOT CROSSING A SURFACE, AND IS UNCOMPILABLE. Steps 1
 * and 2 are two routes of ONE module and steps 3, 5 and 9 are three visits to
 * one screen; none of those is a boundary. `OffRegisterCrossSurface.owningSurface`
 * is typed `Exclude<SurfaceId, 'SURF-DOH'>`, so a cross-surface statement over
 * another Hub screen does not type-check, and the one statement this journey
 * draws names a registered boundary rather than an off-register one.
 *
 * ── THE MODULE REGISTRY GAP, REPORTED RATHER THAN WORKED AROUND ───────────
 * `href` below is a declared string and not `dohModuleById(id).slug`, because
 * none of `MOD-DOH-05` … `MOD-DOH-08` is in `DOH_MODULES` yet — they are still
 * in `DOH_OUT_OF_SLICE_MODULES`, and `DohModuleId` does not admit them, so the
 * registry read would not compile. `MODULE_REGISTRY_GAP` in
 * `@/surfaces/doh/modules/doh-06/matrix` records the same gap for the module
 * screens. The declared slug is not trusted: `tests/unit/doh-journey.test.ts`
 * asserts every `href` names a directory that exists under `app/hub/` and whose
 * `page.tsx` renders the very component composed here, AND that the moment a
 * composed module appears in `DOH_MODULES` its registry slug equals the string
 * below. So this self-heals into a registry read and cannot drift meanwhile.
 */

export interface ComposedBase {
  readonly step: number
  /** The module whose ACT this step is. Never a guess. */
  readonly moduleId: string
}

export interface ComposedRoute extends ComposedBase {
  readonly kind: 'route'
  readonly href: string
  /** The `app/hub/` directory the route lives in — checked against `href`. */
  readonly slug: string
  readonly Screen: ComponentType
}

export interface ComposedCrossSurface extends ComposedBase {
  readonly kind: 'cross-surface'
  /** A row of the eight-row §19.1.2 register, never an invented ninth. */
  readonly boundaryId: 'step-execution-and-capture'
  /** Whose view the statement is drawn for. The pointer is CHECKED, not asserted. */
  readonly viewerRole: 'SUPERVISOR'
}

export type JourneyComposition = ComposedRoute | ComposedCrossSurface

function route(
  step: number,
  moduleId: string,
  slug: string,
  href: string,
  Screen: ComponentType,
): ComposedRoute {
  return { kind: 'route', step, moduleId, slug, href, Screen }
}

const RUN_SLUG = 'run-scheduling-and-execution-oversight'
const RUN_ROUTE = `/hub/${RUN_SLUG}/`
const SUMMARY_SLUG = 'execution-summary-review'
const SUMMARY_ROUTE = `/hub/${SUMMARY_SLUG}/`
const ASSIGNMENT_SLUG = 'worker-assignment'
const ASSIGNMENT_ROUTE = `/hub/${ASSIGNMENT_SLUG}/`

export const JOURNEY_COMPOSITION = [
  route(1, 'MOD-DOH-05', 'job-lifecycle-and-approval', JOB_LIFECYCLE_ROUTE, JobLifecycleScreen),
  route(2, 'MOD-DOH-05', 'job-approval-queue', APPROVAL_QUEUE_ROUTE, JobApprovalQueueScreen),
  route(3, 'MOD-DOH-06', RUN_SLUG, RUN_ROUTE, RunSchedulingScreen),
  route(4, 'MOD-DOH-07', ASSIGNMENT_SLUG, ASSIGNMENT_ROUTE, WorkerAssignmentScreen),
  route(5, 'MOD-DOH-06', RUN_SLUG, RUN_ROUTE, RunSchedulingScreen),
  {
    kind: 'cross-surface',
    step: 6,
    moduleId: 'MOD-FL-A3',
    boundaryId: 'step-execution-and-capture',
    viewerRole: 'SUPERVISOR',
  },
  route(7, 'MOD-DOH-08', SUMMARY_SLUG, SUMMARY_ROUTE, ExecutionSummaryReviewScreen),
  route(8, 'MOD-DOH-08', SUMMARY_SLUG, SUMMARY_ROUTE, ExecutionSummaryReviewScreen),
  route(9, 'MOD-DOH-06', RUN_SLUG, RUN_ROUTE, RunSchedulingScreen),
] as const satisfies readonly JourneyComposition[]

export function compositionForStep(step: number): JourneyComposition | null {
  return JOURNEY_COMPOSITION.find((c) => c.step === step) ?? null
}

/** The one cross-surface statement, built by the registry fold rather than by hand. */
export const EXECUTION_STATEMENT = crossSurfaceStatement('step-execution-and-capture', 'SUPERVISOR')

/* ==================================================================== *
 * THE FOLD — the states the journey actually reached.
 * ==================================================================== */

/**
 * Folded once, at module load, from the real step transitions. Deterministic:
 * every instant is a `Date.UTC` literal and nothing reads a clock.
 *
 * A BROKEN FOLD IS SAID OUT LOUD RATHER THAN RENDERED AS AN EMPTY JOURNEY.
 * `journeyStates` stops at the first step whose precondition its predecessor
 * did not satisfy, and `JourneyScreen` renders that failure in an alert.
 */
export const JOURNEY_FOLD = journeyStates(JOURNEY_STEPS)

/** Index 0 is the state before step 1; index n the state after step n. */
export const JOURNEY_STATES: readonly HubJourneyState[] = JOURNEY_FOLD.ok
  ? JOURNEY_FOLD.states
  : []

/**
 * The run's position at one step, COMPUTED from that step's instants and that
 * step's clock — never stored, never a word this journey chose. `disputed` is
 * a first-class answer and is the honest one inside the contested span.
 */
export function positionAtStep(step: number): ClosingPosition | null {
  const state = JOURNEY_STATES[step]
  if (state === undefined || state.run === null) return null
  return closingPosition(state.run.facts, clockAt(state))
}

/** The three readings for the journey's run at one step, or null before it exists. */
export function readingsAtStep(step: number) {
  const state = JOURNEY_STATES[step]
  if (state === undefined || state.run === null) return null
  // A manually closed run's state is DEC-STUCK-001's, not this build's to
  // compute, so such a row is never handed to `runStateReadings` at all.
  if (stateIsGovernedByDecStuck(state.run)) return null
  return runStateReadings(state.run)
}

/* ==================================================================== *
 * NO STEP SETTLES AN OPEN DECISION — COMPUTED, NEVER CLAIMED.
 * ==================================================================== */

export interface SettlementCheck {
  readonly id: string
  readonly question: string
  /** What keeps it open here, structurally. */
  readonly howItStaysOpen: string
  /**
   * COMPUTED. Starts `OPEN —` when the decision is still open and `SETTLED —`
   * when this journey has taken a position. A step that started keying on a
   * closing-state name flips this string, which is what makes the gate able to
   * fail rather than merely able to pass.
   */
  readonly verdict: string
}

const NOT_REACHED = 'SETTLED — the journey never reached the state this check reads'

/**
 * DEC-RUNSTATE-001 stays open when, at the instants where the source's three
 * Parts disagree, this journey produces THREE answers and no winner — and when
 * `closingPosition` returns `disputed` rather than a word in that span.
 */
function runStateStaysOpen(): string {
  const contested = [6, 7, 8]
  const positions = contested.map((n) => positionAtStep(n))
  if (positions.some((p) => p === null)) return NOT_REACHED

  const settledInsideTheWindow = [7, 8].filter((n) => positionAtStep(n)?.kind !== 'disputed')
  if (settledInsideTheWindow.length > 0) {
    return (
      `SETTLED — steps ${settledInsideTheWindow.join(', ')} name a closing position inside the ` +
      'span the three Parts dispute, which is a reading adopted by fixture.'
    )
  }
  const disagreeing = contested.filter((n) => {
    const state = JOURNEY_STATES[n]
    return state?.run !== null && state?.run !== undefined && readingsDisagree(state.run)
  })
  if (disagreeing.length !== contested.length) {
    const agreed = contested.filter((n) => !disagreeing.includes(n))
    return `SETTLED — the three readings agree at step(s) ${agreed.join(', ')}, so only one answer is on screen there.`
  }
  const atSeven = readingsAtStep(7) ?? []
  return (
    `OPEN — inside the contested span the journey renders three answers and adopts none. At step 7: ` +
    atSeven.map((r) => `Reading ${r.reading} reaches \`submitted\` ${r.submittedReachedTimes}×`).join(', ') +
    '. `closingPosition` returns `disputed` at steps 7 and 8 rather than a word, and no state in this ' +
    'journey has a field a closing-state name could be written into.'
  )
}

/**
 * DEC-STUCK-001 stays open when nothing in this journey closes a run by hand.
 * A manually closed run would have to stand in SOME state, and that state is
 * exactly what the decision disputes.
 */
function stuckStaysOpen(): string {
  const runs = JOURNEY_STATES.map((s) => s.run).filter((r): r is NonNullable<typeof r> => r !== null)
  if (runs.length === 0) return NOT_REACHED
  const closedByHand = runs.filter((r) => stateIsGovernedByDecStuck(r))
  if (closedByHand.length > 0)
    return `SETTLED — ${closedByHand.length} folded state(s) carry a manually closed run, whose state is DEC-STUCK-001's.`
  return (
    'OPEN — no step closes a run by hand: `manuallyClosedAtMs` is null in every folded state, so ' +
    'nothing here asserts what state a manually closed run stands in. The run reaches `finished` ' +
    'through the auto-close scheduler alone.'
  )
}

/**
 * DEC-FINISH-001 stays open when the window is READ from the shared constants
 * and its end is READ from `finishWindowEndsAtMs`, rather than written down as
 * a bound this journey treats as settled.
 */
function finishWindowStaysOpen(): string {
  const afterSeven = JOURNEY_STATES[7]?.run
  if (afterSeven === undefined || afterSeven === null) return NOT_REACHED
  const derivedEnd = finishWindowEndsAtMs(afterSeven.facts)
  if (derivedEnd === null) return NOT_REACHED
  if (derivedEnd !== WINDOW_ELAPSES_AT_MS)
    return `SETTLED — the journey elapses the window at an instant it wrote down (${WINDOW_ELAPSES_AT_MS}) rather than at the one the evaluator derives (${derivedEnd}).`
  const verdict = finishWindowVerdict(afterSeven.facts.finishWindowMs)
  if (verdict !== 'accepted')
    return `SETTLED — the journey runs on a window the validator calls ${verdict}.`
  return (
    'OPEN — the window is the shared default and its end is derived by `finishWindowEndsAtMs`, not ' +
    `written here. The bound is validated and disclosed as unanswered: "${DEC_FINISH_001_MOUNTED.onScreen}"`
  )
}

export const SETTLEMENT_CHECKS = [
  {
    id: DEC_RUNSTATE_001.id,
    question: DEC_RUNSTATE_001.question,
    howItStaysOpen:
      'Every step reads and writes instants. `HubJourneyState` has no run-state field, so there is nowhere for a closing-state name to be written, and the run board branches on `closingPosition`, which returns `disputed` for the contested span.',
    verdict: runStateStaysOpen(),
  },
  {
    id: DEC_STUCK_001.id,
    question: DEC_STUCK_001.question,
    howItStaysOpen:
      'No step closes a run by hand. `stateIsGovernedByDecStuck` is false for every folded run, so no state in this journey was produced by the act the decision is about.',
    verdict: stuckStaysOpen(),
  },
  {
    id: DEC_FINISH_001_MOUNTED.id,
    question: DEC_FINISH_001_MOUNTED.question,
    howItStaysOpen:
      'The window is the shared default constant and its end is derived by `finishWindowEndsAtMs`; step 9 advances the clock to that derived instant rather than to a number typed here.',
    verdict: finishWindowStaysOpen(),
  },
] as const satisfies readonly SettlementCheck[]

/* ==================================================================== *
 * THE FOUR REFUSALS — demonstrated, not printed.
 * ==================================================================== */

export interface RefusalDemonstration {
  readonly atStep: number
  readonly refusal: string
  readonly reason: string
  readonly sourceRef: string
  /** What was attempted, in one sentence. */
  readonly attempted: string
  /**
   * What happened when it was attempted. COMPUTED from the real evaluator, the
   * real validator, the real matrix or the real fold — never written down.
   * Loosen a guard and this string starts "NOT REFUSED", which is what makes
   * the gate able to fail.
   */
  readonly outcome: string
}

const UNREACHED = 'NOT REFUSED — the journey never reached the state this attempt starts from'

function refusalRecord(atStep: number): (typeof JOURNEY_REFUSALS)[number] {
  const found = JOURNEY_REFUSALS.find((r) => r.atStep === atStep)
  if (found === undefined) throw new Error(`No refusal is registered at step ${atStep}`)
  return found
}

/**
 * `MOD-DOH-05`'s Job created BY the approver — `SB-DOH-017` (L27805), the Job
 * that must not appear in her own decidable queue. It is the only seeded Job on
 * which the segregation-of-duties stage can be reached at all.
 */
const APPROVER_CREATED_JOB_ID = 'JOB-WHEELTRUE'

/**
 * The seeded Job the journey ACTUALLY WALKS — looked up by the id the FOLD
 * carries, never by a constant.
 *
 * FOUND BY PLANTING. This read `SEEDED_JOBS.find(id === JOURNEY_JOB_ID)`, a
 * constant, so pointing the fold at a different Job left the refusal
 * demonstration quietly deciding about a Job the journey no longer walked — a
 * demonstration and a journey free to diverge, which is the reachability
 * failure the whole "demonstrated, not printed" rule exists to prevent. Reading
 * the id off the folded state means a Job `MOD-DOH-05` does not seed makes this
 * return `null`, and the outcome says NOT REFUSED / unreached instead.
 */
export function journeyJob(): SeededJob | null {
  const walked = JOURNEY_STATES[1]?.job.jobId
  if (walked === undefined) return null
  return SEEDED_JOBS.find((j) => j.record.jobId === walked) ?? null
}

/**
 * Step 2. Run the REAL approval decision through `MOD-DOH-05`'s own
 * `approveDecision`, which reaches `evaluateAccess`'s existing `makerCheckerOf`
 * stage. Nothing here compares a creator against a viewer; a second spelling of
 * maker-checker would agree with the first even when both were wrong.
 *
 * THREE PROBES, NOT ONE, AND THE SECOND IS THE ONE THAT MATTERS. Walking only
 * this journey's own Job proves the WRONG RULE and prints "Refused" while doing
 * it: `JOB-REDBIKE` was created by Sam, a Supervisor, and a Supervisor is named
 * in the command spec's own denied list — so he is refused at `BASE_ROLE` as a
 * ROLE, before segregation of duties is ever reached. That refusal would hold
 * on a Job he had never touched.
 *
 * `AC-WF-ORG-004-01` (L52670) is explicit that the rule survives the case where
 * "the creator holds the approver role", and `MOD-DOH-05` seeds exactly that
 * Job: `JOB-WHEELTRUE`, created by the Quality Manager herself. Probe (b) is
 * that Job, and it must refuse at the segregation-of-duties stage rather than
 * at the role stage — otherwise the maker-checker gate is untested and only the
 * role list is doing any work.
 */
function creatorCannotApprove(): string {
  const own = journeyJob()
  const selfCreated = SEEDED_JOBS.find((j) => j.record.jobId === APPROVER_CREATED_JOB_ID) ?? null
  if (own === null || selfCreated === null) return UNREACHED

  const creatorByRole = approveDecision('SUPERVISOR', own)
  const creatorWhoIsAnApprover = approveDecision('QUALITY_MANAGER', selfCreated)
  const secondPerson = approveDecision('QUALITY_MANAGER', own)

  if (!isRefusal(creatorByRole))
    return `NOT REFUSED — Sam's approval of his own ${own.record.jobId} was ${creatorByRole.outcome}`
  if (!isRefusal(creatorWhoIsAnApprover))
    return `NOT REFUSED — the approver's approval of the Job she created was ${creatorWhoIsAnApprover.outcome}`
  if (creatorWhoIsAnApprover.stage === 'BASE_ROLE')
    return (
      'NOT REFUSED BY THE RULE UNDER TEST — the approver was stopped at BASE_ROLE, which is the ' +
      'role list rather than segregation of duties, so the maker-checker gate proved nothing'
    )
  if (!permitsAction(secondPerson))
    return `NOT REFUSED, AND WORSE — the second person was ${secondPerson.outcome} too, so nothing could ever be approved`
  return (
    `Refused, twice and for two different reasons. Sam, who created ${own.record.jobId}, is ` +
    `${creatorByRole.outcome} at stage ${creatorByRole.stage} (${creatorByRole.reasonCode}) — a ` +
    `Supervisor holds no approver role at all. Elena, who created ` +
    `${selfCreated.record.jobId} and DOES hold the approver role, is ` +
    `${creatorWhoIsAnApprover.outcome} at stage ${creatorWhoIsAnApprover.stage} ` +
    `(${creatorWhoIsAnApprover.reasonCode}): ${creatorWhoIsAnApprover.explanation} On ` +
    `${own.record.jobId}, which she did not create, she is ${secondPerson.outcome} at the same instant.`
  )
}

/**
 * Step 5. The pin is immutable for the life of the run, and this is shown two
 * ways at once — because either alone is weak. First, the FOLD: the pin written
 * at step 5 is still the pin after four further steps. Second, the COMMAND SET:
 * of the twelve Hub commands only `DOH_ASSIGN_WORKER` carries a `packageRef` at
 * all, and there is no re-pin or rebase command to dispatch.
 */
function pinHeldForTheLifeOfTheRun(): string {
  const pinned = JOURNEY_STATES[5]?.run
  if (pinned === undefined || pinned === null) return UNREACHED
  const later = [6, 7, 8, 9].map((n) => ({ n, pin: JOURNEY_STATES[n]?.run?.packagePin }))
  const moved = later.find((l) => l.pin !== pinned.packagePin)
  if (moved !== undefined)
    return `NOT REFUSED — the pin moved at step ${moved.n}, from ${pinned.packagePin} to ${moved.pin ?? 'nothing'}`
  const repinCommands = HUB_COMMAND_TYPES.filter(
    (t) => t.includes('PIN') || t.includes('REBASE') || t.includes('PACKAGE'),
  )
  if (repinCommands.length > 0)
    return `NOT REFUSED — the command set names ${repinCommands.join(', ')}, which could move a pin`
  const readiness = pinned.packageOnDevice ? 'ready' : 'assigned-not-ready'
  return (
    `Refused — ${JOURNEY_RUN_ID} still executes ${JOURNEY_PACKAGE_PIN} after four further steps, ` +
    `and was ${readiness} at the instant the pin was written, because the pin is taken before the ` +
    'download. None of the twelve Hub commands can move it: no re-pin and no rebase command exists.'
  )
}

/**
 * Step 6. Nobody can pause or stop a run. Read off the module's OWN matrix row
 * rather than restated, so a cell that ever softened goes red here as well as
 * on the run board.
 *
 * THE TEST IS "MAY ANY ROLE ACT", NOT "IS EVERY CELL PROHIBITED", and the
 * difference is the Worker's cell. Four oversight columns carry `Explicitly
 * prohibited`; the Worker's carries `Not applicable — the worker ends a run by
 * completing or abandoning it on the device` (L27916). Requiring the
 * prohibition token in all five would have reported that cell as a defect and
 * would have been wrong: `not-applicable` grants nothing either, and the two
 * tokens mean different things the source keeps apart.
 */
function cannotPauseOrStop(): string {
  const row = matrixRow('pause-or-stop-a-run')
  const acting = TENANT_ROLE_ORDER.filter((r) =>
    (ACTING_STATUSES as readonly string[]).includes(row.status[r]),
  )
  if (acting.length > 0)
    return `NOT REFUSED — ${acting.join(', ')} may act on this row (${acting.map((r) => row.status[r]).join(', ')})`
  return (
    `Refused — no role may act on "${row.control}". The four oversight columns are ` +
    `Explicitly prohibited, deliberately impossible from any oversight surface, and the Worker's ` +
    `cell is a different category: ${row.detail.WORKER} — ${row.effect} (${row.sourceRef})`
  )
}

/**
 * Step 9. Forcing a run to `finished` early is refused in every column, and the
 * only path into `finished` is the scheduler. Shown by asking the evaluator one
 * millisecond BEFORE the window end and again at it: a build that let anything
 * else finish a run would answer the same on both sides.
 */
function cannotForceFinishEarly(): string {
  const state = JOURNEY_STATES[8]
  const run = state?.run
  if (state === undefined || run === undefined || run === null) return UNREACHED
  const row = matrixRow('force-a-run-to-finished-early')
  const permitted = TENANT_ROLE_ORDER.filter((r) => row.status[r] !== 'explicitly-prohibited')
  if (permitted.length > 0)
    return `NOT REFUSED — ${permitted.join(', ')} may force a run to finished early`

  const end = finishWindowEndsAtMs(run.facts)
  if (end === null) return UNREACHED
  const before = dueTransitions(run.facts, fixedClock(end - 1)).map((t) => t.id)
  const at = dueTransitions(run.facts, fixedClock(end))
  const close = at.find((t) => t.id === 'run-auto-close')
  if (before.includes('run-auto-close'))
    return 'NOT REFUSED — the auto-close transition falls due before the window has elapsed'
  if (close === undefined)
    return 'NOT REFUSED, AND WORSE — the window elapsed and no auto-close fell due, so the run never finishes at all'
  return (
    `Refused — "${row.control}" is Explicitly prohibited in all ${TENANT_ROLE_ORDER.length} role ` +
    `columns (${row.sourceRef}), and one millisecond before the window elapsed the evaluator offered ` +
    `${before.length === 0 ? 'nothing' : before.join(', ')}. At the window's end it offers ` +
    `${close.id} with actor ${String(close.actor)} — the only path into finished, and nobody's.`
  )
}

/**
 * Step 8's validation, folded into step 8's own record on the screen rather
 * than into a fifth refusal: a blank closure note is a VALIDATION failure and
 * not a policy refusal, and the two are different categories.
 */
export const BLANK_CLOSURE_NOTE_VALIDATION = validateHubCommand({
  type: 'DOH_RESOLVE_ANOMALY',
  tenant: HUB_TENANT_ID,
  summaryId: 'SUM-2026-08-14-A',
  anomalyId: 'ANOM-0101',
  closureNote: '   ',
})

export const REFUSAL_DEMONSTRATIONS = [
  {
    ...refusalRecord(2),
    attempted:
      'Approve JOB-REDBIKE as Sam, who created it; approve JOB-WHEELTRUE as Elena, who created it AND holds the approver role; then approve JOB-REDBIKE as Elena, who did not create it.',
    outcome: creatorCannotApprove(),
  },
  {
    ...refusalRecord(5),
    attempted:
      'Carry the run four steps past its pin — through execution, the Summary and the anomaly — and look for a Hub command that could re-pin it.',
    outcome: pinHeldForTheLifeOfTheRun(),
  },
  {
    ...refusalRecord(6),
    attempted:
      'Intervene from the oversight surface while the shift is running: pause or stop the run from the Hub.',
    outcome: cannotPauseOrStop(),
  },
  {
    ...refusalRecord(9),
    attempted:
      'Close the record early: force the run to finished from a role column, and ask the evaluator for an auto-close one millisecond before the window has elapsed.',
    outcome: cannotForceFinishEarly(),
  },
] as const satisfies readonly RefusalDemonstration[]

export function refusalForStep(step: number): RefusalDemonstration | null {
  return REFUSAL_DEMONSTRATIONS.find((r) => r.atStep === step) ?? null
}

/** Re-exported for the screen, which must not reach into a module for one lookup. */
export { journeyStep }
