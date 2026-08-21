import type { GatePosture } from '../worker-lifecycle-and-qualifications/fixtures'

/**
 * `MOD-DOH-07` Worker Assignment — the seeded scenario `SCR-DOH-15` renders.
 *
 * THE MATRIX IS NOT HERE. It lives in
 * `src/surfaces/doh/modules/doh-07/matrix.ts` and is re-exported below under
 * the name `scripts/build-doh-module-reach.mjs` looks for
 * (`CONTROL_MATRIX`, at `app/hub/<slug>/fixtures.ts`). So the day a task
 * adds this module's row to `DOH_MODULES` the generator finds its matrix
 * with no edit here and no second copy of it anywhere.
 *
 * The seed is `SB-DOH-019` (L28216) and the Illustrative Example at L28218,
 * used verbatim in their particulars: Sam assigns Maya to
 * `RUN-2026-08-14-A`, Maya's wheel bolt torque verification certification
 * is Expired, and at 12:30 Ahmed takes over.
 */

export type { GatePosture }

export { CONTROL_MATRIX } from '@/surfaces/doh/modules/doh-07/matrix'

/**
 * The four qualification chips, and only those four.
 *
 * `SB-DOH-019` (L28216) names them: "a per-worker qualification chip reading
 * Qualified, Expires in 3 days, Expired or Not held". A fifth — "expires
 * during this run", say — would be a state the source never names, so the
 * closed set is the vocabulary and there is no `other` member to fall into.
 */
export type QualificationChip = 'Qualified' | 'Expires in 3 days' | 'Expired' | 'Not held'

export const QUALIFICATION_CHIPS = [
  'Qualified',
  'Expires in 3 days',
  'Expired',
  'Not held',
] as const satisfies readonly QualificationChip[]

type MissingFromChips = Exclude<QualificationChip, (typeof QUALIFICATION_CHIPS)[number]>
const _chipsExhaustive: MissingFromChips extends never ? true : never = true
void _chipsExhaustive

/**
 * Which chips fail the gate. `Qualified` and `Expires in 3 days` pass — the
 * second is a warning ladder entry, not a block; the certification is still
 * held. `Expired` and `Not held` are the two the strict posture refuses,
 * and they are also the two the source names in its own refusal message,
 * "naming the missing or expired certification" (L28147).
 */
const FAILING_CHIPS: readonly QualificationChip[] = ['Expired', 'Not held']

export function chipFailsTheGate(chip: QualificationChip): boolean {
  return FAILING_CHIPS.includes(chip)
}

export interface CandidateWorker {
  readonly workerId: string
  readonly name: string
  /** The Area the worker belongs to, for the Supervisor's own-scope filter. */
  readonly areaId: string
  readonly chip: QualificationChip
  /** The certification the chip is about. Named in the refusal, never elided. */
  readonly certification: string
  /**
   * Whether this worker already holds an assignment on another run at the
   * same time. SEEDED AND SHOWN NOWHERE, deliberately — it is what the
   * deferred double-booking check would read, and it is here so the screen's
   * own suite can prove the screen never reads it. Not a hidden feature:
   * the absence is stated on screen (AC-DOH-07-5, L28230).
   */
  readonly alreadyOnAnotherRunAt: string | null
}

export const CANDIDATE_WORKERS = [
  {
    workerId: 'WKR-0142',
    name: 'Maya Okonkwo',
    areaId: 'AREA-RIVERSIDE-ASSY',
    chip: 'Expired',
    certification: 'Wheel bolt torque verification',
    alreadyOnAnotherRunAt: null,
  },
  {
    workerId: 'WKR-0188',
    name: 'Ahmed Barzani',
    areaId: 'AREA-RIVERSIDE-ASSY',
    chip: 'Qualified',
    certification: 'Wheel bolt torque verification',
    alreadyOnAnotherRunAt: 'RUN-2026-08-14-C, 08:00-16:00',
  },
  {
    workerId: 'WKR-0203',
    name: 'Priya Raman',
    areaId: 'AREA-RIVERSIDE-ASSY',
    chip: 'Expires in 3 days',
    certification: 'Wheel bolt torque verification',
    alreadyOnAnotherRunAt: null,
  },
  {
    workerId: 'WKR-0311',
    name: 'Tomas Lindqvist',
    areaId: 'AREA-RIVERSIDE-ASSY',
    chip: 'Not held',
    certification: 'Cell 4 hot-work authorisation',
    alreadyOnAnotherRunAt: null,
  },
  {
    /* Out of the seeded Supervisor's Areas. Present so the own-scope filter
     * has something to exclude — a filter with nothing to remove proves
     * nothing, which is slice-4 defect 7 in miniature. */
    workerId: 'WKR-0407',
    name: 'Grace Mbeki',
    areaId: 'AREA-NORTHGATE-FINISH',
    chip: 'Qualified',
    certification: 'Wheel bolt torque verification',
    alreadyOnAnotherRunAt: null,
  },
] as const satisfies readonly CandidateWorker[]

/** The seeded Supervisor's own Areas. Row 1's condition, L28119. */
export const SUPERVISOR_AREA_IDS = ['AREA-RIVERSIDE-ASSY'] as const satisfies readonly string[]

/**
 * THE SELECTOR FILTERS, NOT THE RENDER — slice-4 defect 7, and the reason
 * this is a function over the register rather than a `hidden` flag on a row.
 * A Supervisor's candidate list is BUILT from their own Areas; nothing
 * outside them is assembled and then hidden.
 */
export function candidatesInScope(
  areaIds: readonly string[],
): readonly CandidateWorker[] {
  return CANDIDATE_WORKERS.filter((w) => areaIds.includes(w.areaId))
}

export interface SeededRun {
  readonly runId: string
  readonly jobName: string
  readonly areaId: string
  readonly productionDate: string
  /** L28133: pinned at the first successful assignment, immutable thereafter. */
  readonly packageRef: string
  readonly packagePinnedAt: string | null
}

export const SEEDED_RUN: SeededRun = {
  runId: 'RUN-2026-08-14-A',
  jobName: 'Wheel assembly — line 2',
  areaId: 'AREA-RIVERSIDE-ASSY',
  productionDate: '2026-08-14',
  packageRef: 'workflow v2.1.0',
  packagePinnedAt: null,
}

/**
 * The structured handover payload — last completed step, open flags, current
 * state. L28143 states the three; L28218 supplies the particulars. Nothing
 * else is added to it, because FUNC-DOH-07-2.2.1 (L28188) prohibits every
 * role from editing the payload and a fourth field invented here would be
 * an uneditable invention.
 */
export interface HandoverPayload {
  readonly lastCompletedStep: string
  readonly openFlags: readonly string[]
  readonly currentState: string
}

export const HANDOVER_PAYLOAD: HandoverPayload = {
  lastCompletedStep: 'Step 7 — torque verification, RB-0007',
  openFlags: ['Severity 2 — 41.0 Newton metre capture on RB-0007'],
  currentState: 'Unit 12 of 40 in progress',
}

/**
 * The fixed copy for each posture. NOT one string with the posture
 * interpolated: under strict there is a block to clear and under notify-only
 * there is not, so a single reworded sentence would be false under one of
 * them. `MOD-DOH-04` made the same split for the same reason (L27423 region).
 */
export const POSTURE_COPY: Readonly<Record<GatePosture, string>> = {
  strict:
    'A clearance is required. Clearances are granted in the Client Command Center.',
  'notify-only':
    'Assignment will proceed and will be flagged in the audit trail and the Execution Summary.',
}

/**
 * The concurrency footer, quoted from `SB-DOH-019` (L28216): 'A footer
 * states the concurrency rule: "Any number of workers may be assigned. Every
 * step records the individual who performed it."'
 */
export const CONCURRENCY_FOOTER =
  'Any number of workers may be assigned. Every step records the individual who performed it.'

/**
 * WORKER-SHIFTS, counted the way AC-DOH-01-1 (L27039) states: one per worker
 * per calendar shift regardless of run count, and one per substituting
 * worker who actually performed work.
 *
 * The `workedAtAll` flag is load-bearing and is the whole reason this is a
 * function rather than a length. L28145: "Each worker who actually worked
 * counts one Worker-Shift" — a substitute whose reassignment command never
 * landed did not work, and counting them would bill the tenant for a shift
 * that did not happen.
 */
export interface WorkerShiftInput {
  readonly workerId: string
  readonly workedAtAll: boolean
}

export function workerShiftCount(inputs: readonly WorkerShiftInput[]): number {
  const worked = new Set(inputs.filter((i) => i.workedAtAll).map((i) => i.workerId))
  return worked.size
}
