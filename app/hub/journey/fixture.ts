import { fixedClock, type Clock } from '@/domain/clock'
import type { TenantId } from '@/domain/ids'
import type { JobRecord } from '@/surfaces/doh/objects'
import { FINISH_WINDOW_DEFAULT_MS, type RunTimingFacts } from '@/surfaces/doh/transitions'
import type { RunBoardRow, WorkerHandoff } from '@/surfaces/doh/modules/doh-06/matrix'
import {
  DOH_05_IDENTITIES,
  HUB_TENANT_ID as DOH_05_TENANT_ID,
  SEEDED_JOBS,
} from '@/surfaces/doh/modules/doh-05/jobs'

/**
 * The operational journey's fixture — the ONE spine the nine steps walk.
 *
 * ── THE RULE THAT SHAPES THIS FILE, AND THE ONLY ONE THAT MATTERS ──────────
 * THERE IS NO RUN-STATE FIELD ANYWHERE IN `HubJourneyState`, AND THERE IS
 * NOWHERE TO PUT ONE. `DEC-RUNSTATE-001` leaves `submitted` and `complete`
 * defined three different ways; `@/surfaces/doh/transitions` therefore keys
 * on INSTANTS, and `closingPosition` returns `disputed` rather than a word in
 * the span where the three Parts disagree. A journey that carried
 * `runState: 'submitted'` on its state, or branched a step on that word,
 * would settle by fixture what three modules kept open — which is the single
 * most likely way this task could do damage. So the run is carried as
 * `RunBoardRow`, whose every timing field is an instant, and the position is
 * COMPUTED at render time from the journey's own clock. `finishedAtMs` is
 * never written by any step: step 9's finish is read out of `dueTransitions`,
 * which is the only path `AC-RUN-002` (L7126) permits into `finished`.
 *
 * ── ONE STORY, AND IT IS THE SOURCE'S OWN ─────────────────────────────────
 * Three Illustrative Examples in the frozen source are one story and name the
 * same objects, so nothing here is invented:
 *
 *   L52672 — "Sam creates `JOB-REDBIKE` referencing *Assembly — Wheel Bolt
 *            Torque Verification* `v2.1.0` … The platform routes approval to
 *            Elena, who … approves, and the Job becomes active. Sam is never
 *            offered an approve control on his own Job."
 *   L53803 — "Sam assigns Maya and Ahmed to `RUN-2026-08-14-A`. Both hold the
 *            Torque Wrench Operator Certification scoped to `AREA-ASSY-A`."
 *   L53684 — "`RUN-2026-08-14-A` pins `v2.1.0` at 06:05 … Maya's run finishes
 *            on `v2.1.0`."
 *
 * `JOB-REDBIKE` is `MOD-DOH-05`'s own seeded Job (`@/surfaces/doh/modules/
 * doh-05/jobs`) and this journey READS that record rather than minting a second
 * one — see `SEEDED_REDBIKE` below for both reasons.
 *
 * ── DETERMINISM ───────────────────────────────────────────────────────────
 * No ambient clock and no randomness: `app/hub/**` may hold no `Date.now()`,
 * no `new Date(` and no `Math.random`, and `tests/coverage/slice-04-gates.test.ts`
 * runs one regex over every file here. `Date.UTC` is a pure function of its
 * arguments and is how `app/hub/execution-summary-review/fixtures.ts` already
 * pins its own as-of instant.
 */

/** `MOD-DOH-05`'s own tenant, re-exported rather than spelled a second time. */
export const HUB_TENANT_ID: TenantId = DOH_05_TENANT_ID

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

/**
 * The nine instants, as UTC literals rather than offsets from a base, so a
 * reader can check each one against the shift it claims to sit in.
 *
 * The source's example pins at 06:05 on the day of the run, which is the
 * lazy-pull path for a mid-shift assignment (L53795). This journey assigns
 * the evening before instead — the pre-sync path, "at shift start the device
 * pre-syncs today's runs fully" (L53826) — because that is the path on which
 * a pin written before the download is visibly `assigned-not-ready`, which is
 * WF-AUT-010's whole failure mode (L53675). The run, the workers, the package
 * and the version are the example's.
 */
export const JOURNEY_INSTANTS = {
  draftedAtMs: Date.UTC(2026, 7, 13, 9, 0, 0),
  approvedAtMs: Date.UTC(2026, 7, 13, 11, 0, 0),
  scheduledAtMs: Date.UTC(2026, 7, 13, 12, 0, 0),
  assignedAtMs: Date.UTC(2026, 7, 13, 18, 0, 0),
  /** The pin is not a later act: L53696 draws it taken BEFORE the download. */
  pinnedAtMs: Date.UTC(2026, 7, 13, 18, 0, 0),
  runScheduledStartMs: Date.UTC(2026, 7, 14, 6, 0, 0),
  executionEndedAtMs: Date.UTC(2026, 7, 14, 14, 0, 0),
  summaryComputedAtMs: Date.UTC(2026, 7, 14, 14, 30, 0),
  anomalyResolvedAtMs: Date.UTC(2026, 7, 15, 9, 0, 0),
} as const

/** `completeAtMs` plus the tenant's window. Derived, never written twice. */
export const WINDOW_ELAPSES_AT_MS =
  JOURNEY_INSTANTS.summaryComputedAtMs + FINISH_WINDOW_DEFAULT_MS

/** A UTC label for one instant. A literal per step, never formatted from a number. */
export const INSTANT_LABEL: Readonly<Record<number, string>> = {
  1: '2026-08-13 09:00 UTC',
  2: '2026-08-13 11:00 UTC',
  3: '2026-08-13 12:00 UTC',
  4: '2026-08-13 18:00 UTC',
  5: '2026-08-13 18:00 UTC',
  6: '2026-08-14 14:00 UTC',
  7: '2026-08-14 14:30 UTC',
  8: '2026-08-15 09:00 UTC',
  9: '2026-08-16 14:30 UTC',
}

/* ==================================================================== *
 * THE OBJECTS
 * ==================================================================== */

/** `MOD-DOH-05`'s seeded identities. Read, never re-typed. */
export const SAM = DOH_05_IDENTITIES.SUPERVISOR
export const ELENA = DOH_05_IDENTITIES.QUALITY_MANAGER

export const JOURNEY_JOB_ID = 'JOB-REDBIKE'

/**
 * THE JOB IS `MOD-DOH-05`'S OWN SEEDED RECORD, READ RATHER THAN REBUILT.
 *
 * Two reasons, and the second is the one that matters. First, the approval
 * refusal at step 2 is decided by the real evaluator against `MOD-DOH-05`'s
 * real fixture partition, so a Job this file invented would not be in that
 * partition and could not be approved or refused at all. Second, `JobRecord`
 * grows: a concurrent task added `recurrence` and `linkedJobRef` while this
 * journey was being written, and a hand-copied record would have gone stale
 * silently in every field it did not carry. Reading the seed means the journey
 * walks whatever that module says the Job is.
 *
 * `state` is the ONE field overridden, because the seed stands where the source
 * leaves it — `pending_approval` — and this journey starts one step earlier.
 */
const SEEDED_REDBIKE = SEEDED_JOBS.find((j) => j.record.jobId === JOURNEY_JOB_ID)?.record
if (SEEDED_REDBIKE === undefined) {
  throw new Error(
    `MOD-DOH-05 no longer seeds ${JOURNEY_JOB_ID}, so the operational journey has no Job to walk.`,
  )
}
export const JOURNEY_RUN_ID = 'RUN-2026-08-14-A'
/** L53684, and slice 5's Studio journey published exactly this number. */
export const JOURNEY_PACKAGE_PIN = 'Assembly — Wheel Bolt Torque Verification v2.1.0'

/** L53803's two workers, with no handoff instant until the device reports one. */
const WORKERS: readonly WorkerHandoff[] = [
  { workerId: 'WKR-MAYA', name: 'Maya Ferrer', handedOffAtMs: null },
  { workerId: 'WKR-AHMED', name: 'Ahmed Saleh', handedOffAtMs: null },
]

export type AnomalySeverity = 'Info' | 'Concern' | 'Critical'

export interface JourneyAnomaly {
  readonly anomalyId: string
  readonly severity: AnomalySeverity
  /** L28271's two-position lifecycle, and there is no third position. */
  readonly state: 'Open' | 'Resolved'
  /** L28271: resolution requires one; `null` while the anomaly is open. */
  readonly closureNote: string | null
}

export interface JourneySummary {
  readonly summaryId: string
  readonly computedAtMs: number
  readonly anomalies: readonly JourneyAnomaly[]
}

/**
 * The journey's state after n steps.
 *
 * `atMs` IS THE JOURNEY'S CLOCK and the reason every derived answer is honest:
 * `closingPosition`, `dueTransitions` and `lateCaptureOutcome` all take a
 * `Clock`, so asking them at step 5's instant and at step 9's instant gives
 * two different answers about ONE unchanged set of facts. A journey that
 * carried a single ambient clock would have had to write the answers down.
 */
export interface HubJourneyState {
  readonly atMs: number
  readonly job: JobRecord
  /** `null` until step 3 creates it. Instants only — see the header. */
  readonly run: RunBoardRow | null
  readonly summary: JourneySummary | null
}

const INITIAL_RUN_FACTS: RunTimingFacts = {
  runId: JOURNEY_RUN_ID,
  tenant: HUB_TENANT_ID,
  scheduledStartMs: JOURNEY_INSTANTS.runScheduledStartMs,
  startedAtMs: null,
  cancelledAtMs: null,
  completeAtMs: null,
  /** Never written by a step. Step 9 READS the finish out of the evaluator. */
  finishedAtMs: null,
  finishWindowMs: FINISH_WINDOW_DEFAULT_MS,
}

export const INITIAL_RUN: RunBoardRow = {
  facts: INITIAL_RUN_FACTS,
  jobName: SEEDED_REDBIKE.name,
  areaId: SEEDED_REDBIKE.parentNodeId,
  areaName: 'Assembly Line A',
  shiftName: 'Day',
  plannedQuantity: 120,
  packagePin: JOURNEY_PACKAGE_PIN,
  /** L53675: a pin with no package on the device is assigned-not-ready. */
  packageOnDevice: false,
  workerHandoffs: WORKERS,
  devicesSynced: 0,
  summaryComputedAtMs: null,
  manuallyClosedAtMs: null,
}

/**
 * The Job before anything happens: it does not exist. Step 1 creates it in
 * `draft`, which is where L27690's state machine starts and the only state it
 * has no edge into.
 */
export const INITIAL_JOURNEY_STATE: HubJourneyState = {
  atMs: JOURNEY_INSTANTS.draftedAtMs,
  // L27652: the Job Owner is a FIELD on the record and defaults to the creator.
  // It is read off the seed and never compared to a role here — "is X a Job
  // Owner?" is untypeable, and `@/surfaces/doh/job-owner` is the only thing
  // that reads the field for a decision.
  job: { ...SEEDED_REDBIKE, state: 'draft' },
  run: null,
  summary: null,
}

/** The journey's clock at one folded state. Never ambient. */
export function clockAt(state: HubJourneyState): Clock {
  return fixedClock(state.atMs)
}

/* ==================================================================== *
 * THE FOLD
 * ==================================================================== */

export type JourneyPrecondition =
  | { readonly met: true }
  | { readonly met: false; readonly reason: string }

export const MET: JourneyPrecondition = { met: true }
export const notMet = (reason: string): JourneyPrecondition => ({ met: false, reason })

/**
 * The transition half of a step. `./effects` adds the five-surface effects on
 * top of this — the same split `@/studio/journey/effects` makes over
 * `@/studio/journey/fixture`, so the two surfaces' journeys share one panel
 * and one vocabulary and disagree about nothing.
 */
export interface HubJourneyStepTransition {
  readonly number: number
  /** Checked against the state the PREVIOUS step produced. Never assumed. */
  readonly requires: (state: HubJourneyState) => JourneyPrecondition
  readonly produces: (state: HubJourneyState) => HubJourneyState
}

export type JourneyFold =
  | { readonly ok: true; readonly states: readonly HubJourneyState[] }
  | { readonly ok: false; readonly atStep: number; readonly reason: string }

/**
 * Folds the steps and returns every intermediate state — index 0 is the state
 * before step 1, index n the state after step n. A step whose precondition is
 * unmet STOPS the fold with a typed failure rather than jumping to a
 * convenient state, and `JourneyScreen` renders that failure in an alert:
 * drawing nine plausible screens over a journey that never happened is the
 * defect this shape exists to make impossible.
 */
export function journeyStates(
  steps: readonly HubJourneyStepTransition[],
  initial: HubJourneyState = INITIAL_JOURNEY_STATE,
): JourneyFold {
  const states: HubJourneyState[] = [initial]
  for (const step of steps) {
    const current = states[states.length - 1]!
    const precondition = step.requires(current)
    if (!precondition.met) return { ok: false, atStep: step.number, reason: precondition.reason }
    states.push(step.produces(current))
  }
  return { ok: true, states }
}

/** A step's run, or a typed failure. Never a silently-substituted empty run. */
export function runAt(state: HubJourneyState | undefined): RunBoardRow | null {
  return state?.run ?? null
}

export { HOUR_MS, MINUTE_MS }
