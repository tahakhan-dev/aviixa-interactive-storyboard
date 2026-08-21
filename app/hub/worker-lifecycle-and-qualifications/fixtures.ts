import type { TenantRoleId } from '../HubShell'
import { BARE_PROHIBITION } from '@/surfaces/doh/modules'
import type { ControlStatus, DohControlMatrixRow } from '@/surfaces/doh/modules'
import type { CommandState, ScreenStateDetail } from '@/ui/ScreenStateBoundary'
import type { ScreenStateId } from '@/ui/screen-state'
import type { TenantState } from '@/surfaces/doh/tenant-state'
import {
  SEEDED_CERTIFICATION_TYPES,
  SEEDED_ROLE_SCOPES,
  areaById,
  certificationName,
  type LocationArea,
} from '../location-configuration/fixtures'
import { DOH_SHIFTS, shiftById, shiftsForArea, type Shift } from '../shift-management/fixtures'

/**
 * MOD-DOH-04 seeded fixture data — Workers, their qualifications, and the
 * audited exception path when the line would otherwise stop.
 *
 * THIS IS THE SURVEILLANCE-CRITICAL MODULE, and the line it holds is not
 * "never name a worker" — this file names workers on nearly every row. The
 * line is that a worker may be named for QUALIFICATION, ASSIGNMENT and
 * LIFECYCLE purposes and may never be MEASURED. A qualification expiry date
 * is a fact about a certificate. A count of how many runs somebody completed
 * is a measure of a person, and no record here carries one:
 *
 *   - No record below holds a count, a total, a rate, a pace, a duration of
 *     work, a ranking, a score, a productivity or suitability figure, or any
 *     figure that would compare one person with another. Proved, key by key,
 *     against the SHARED matcher in `tests/coverage/person-measure-keys.ts` —
 *     never a fifth hand-rolled regular expression.
 *   - The clearance escalation keys on `(Area, Shift)` and never on
 *     `(Worker)`: `ESCALATION_KEY` below is that pair as data, and
 *     `secondClearanceRoutesToQualityManager` takes an Area and a Shift and
 *     has no worker parameter at all — so "regardless of worker" (L27437) is
 *     a fact about the SIGNATURE rather than a sentence in a comment.
 *   - Escalation resolution resolves a ROLE against the roles on shift.
 *     `ON_SHIFT_ROLE_COVERAGE` holds role identifiers, never people, so there
 *     is no roster of named individuals in this workspace to read by accident.
 *
 * WHAT IS READ AND NEVER RE-SEEDED. Sites, Areas, the role scopes and the
 * seeded certification types come from the location module; the Shifts come
 * from the shift module, and importing `DOH_SHIFTS` gets that module's SEED,
 * never another screen's session state:
 *
 *     import { DOH_AREAS, SEEDED_CERTIFICATION_TYPES, SEEDED_ROLE_SCOPES }
 *       from '../location-configuration/fixtures'
 *     import { DOH_SHIFTS, shiftsForArea } from '../shift-management/fixtures'
 *
 * Determinism (spec §8): every value below is a literal, the as-of stamp
 * included. Nothing here reads a clock — which is why a qualification carries
 * `daysToExpiry` as a recorded integer beside its literal dates rather than
 * computing one, and why the whole expiry ladder is exercised without a
 * single date arithmetic.
 */

/* ------------------------------------------------------------------ *
 * The three object vocabularies, from the module identity card
 * (L27460). Rival vocabularies exist elsewhere in the source; the card
 * governs, per D21.
 * ------------------------------------------------------------------ */

/** `OBJ-DOH-WORKER`. A Worker is not a User: `MOD-DOH-09` owns the account. */
export type WorkerState = 'active' | 'archived' | 'reactivated'

export const WORKER_STATES = [
  'active',
  'archived',
  'reactivated',
] as const satisfies readonly WorkerState[]

type MissingFromWorkerStates = Exclude<WorkerState, (typeof WORKER_STATES)[number]>
const _workerStatesExhaustive: MissingFromWorkerStates extends never ? true : never = true
void _workerStatesExhaustive

/** `OBJ-DOH-QUAL`. The four warning stages are STATES, not notifications hung
 *  off one state, "because each stage has a different audience and because a
 *  tenant may add earlier stages but never remove one" (L27533). */
export type QualificationState =
  | 'valid'
  | 'warning_14'
  | 'warning_7'
  | 'warning_1'
  | 'expired'
  | 'renewed'

export const QUALIFICATION_STATES = [
  'valid',
  'warning_14',
  'warning_7',
  'warning_1',
  'expired',
  'renewed',
] as const satisfies readonly QualificationState[]

type MissingFromQualStates = Exclude<QualificationState, (typeof QUALIFICATION_STATES)[number]>
const _qualStatesExhaustive: MissingFromQualStates extends never ? true : never = true
void _qualStatesExhaustive

/** `OBJ-DOH-CLEAR`. A lapse returns the qualification to Expired and never to
 *  Valid, "so a clearance can never quietly become a permanent qualification"
 *  (L27533, AC-DOH-04-8). */
export type ClearanceState = 'granted' | 'active' | 'lapsed' | 'superseded_by_renewal'

export const CLEARANCE_STATES = [
  'granted',
  'active',
  'lapsed',
  'superseded_by_renewal',
] as const satisfies readonly ClearanceState[]

type MissingFromClearanceStates = Exclude<ClearanceState, (typeof CLEARANCE_STATES)[number]>
const _clearanceStatesExhaustive: MissingFromClearanceStates extends never ? true : never = true
void _clearanceStatesExhaustive

/**
 * The instruction-difficulty profile. A CLOSED three-member vocabulary
 * (`AC-WF-WKR-001-03` L52800) and the reason the record can be incomplete:
 * an invalid value is refused, and the record is "held incomplete and cannot
 * receive assignments" (`FB-WKR-001` L52796) — "no assignment is safer than
 * an assignment whose instructions may render at the wrong level".
 */
export type InstructionDifficulty = 'simple' | 'standard' | 'expanded'

export const INSTRUCTION_DIFFICULTIES = [
  'simple',
  'standard',
  'expanded',
] as const satisfies readonly InstructionDifficulty[]

type MissingFromDifficulties = Exclude<
  InstructionDifficulty,
  (typeof INSTRUCTION_DIFFICULTIES)[number]
>
const _difficultiesExhaustive: MissingFromDifficulties extends never ? true : never = true
void _difficultiesExhaustive

/** `worker_type` — "no operational difference between them at V1" (L27421;
 *  `AC-WF-WKR-001-02` L52800), carried because the record carries it. */
export type WorkerType = 'employee' | 'contractor'

export const WORKER_TYPES = ['employee', 'contractor'] as const satisfies readonly WorkerType[]

type MissingFromWorkerTypes = Exclude<WorkerType, (typeof WORKER_TYPES)[number]>
const _workerTypesExhaustive: MissingFromWorkerTypes extends never ? true : never = true
void _workerTypesExhaustive

/** The mandatory categorised reason on an expired-certification clearance
 *  (L27435): "Emergency cover, Training-in-progress, or Other — plus optional
 *  free text". A closed set — free text is beside it, never instead of it. */
export type ClearanceReasonCode = 'emergency-cover' | 'training-in-progress' | 'other'

export const CLEARANCE_REASON_CODES = [
  'emergency-cover',
  'training-in-progress',
  'other',
] as const satisfies readonly ClearanceReasonCode[]

type MissingFromReasonCodes = Exclude<ClearanceReasonCode, (typeof CLEARANCE_REASON_CODES)[number]>
const _reasonCodesExhaustive: MissingFromReasonCodes extends never ? true : never = true
void _reasonCodesExhaustive

export const CLEARANCE_REASON_LABEL: Readonly<Record<ClearanceReasonCode, string>> = {
  'emergency-cover': 'Emergency cover',
  'training-in-progress': 'Training-in-progress',
  other: 'Other',
}

/* ------------------------------------------------------------------ *
 * THE GATE POSTURE AND ITS FLOOR. The qualification gate is "the only
 * configurable gate on the platform" (L27423), and notify-only is the
 * platform floor: "no silent posture exists, and no tenant setting can
 * weaken the gate below it."
 * ------------------------------------------------------------------ */

export type GatePosture = 'strict' | 'notify-only'

export const GATE_POSTURES = ['strict', 'notify-only'] as const satisfies readonly GatePosture[]

type MissingFromPostures = Exclude<GatePosture, (typeof GATE_POSTURES)[number]>
const _posturesExhaustive: MissingFromPostures extends never ? true : never = true
void _posturesExhaustive

/**
 * The floor, held STRUCTURALLY rather than checked. `GatePosture` is a closed
 * two-member union and there is no third member for a weaker posture to be,
 * so `TEST-DOH-04-D4` ("attempt to set a gate posture weaker than notify-only;
 * assert rejection naming the floor and assert nothing is written") is
 * answered by the type: no such value exists to write, and no control on the
 * screen offers one. The floor is named on screen all the same, because the
 * absence of a control is only honest when the reader is told what is absent.
 */
export const GATE_POSTURE_FLOOR: GatePosture = 'notify-only'
export const GATE_POSTURE_DEFAULT: GatePosture = 'strict'

/* ------------------------------------------------------------------ *
 * THE 14/7/1/0 EXPIRY LADDER — L27427, AC-28.4-02 (L52774),
 * AC-NFR-1105 (L106864): "may be configured earlier than 14 / 7 / 1 / 0
 * days and never later."
 *
 * The direction is encoded as a real constraint rather than described.
 * TWO halves, and both are structural:
 *
 *   1. The only mutator in this file is `addEarlierWarningStage`, which
 *      returns a STRICT SUPERSET of the mandatory four or a typed
 *      refusal. It cannot express removing or delaying a stage.
 *   2. There is NO remove, disable, delay or reorder function at all —
 *      the same move the sibling module makes with the Shift that
 *      carries no timezone field. A rule held in the shape of the API
 *      cannot be contradicted by a later edit that forgets a comment.
 * ------------------------------------------------------------------ */

export const MANDATORY_EXPIRY_LADDER = [14, 7, 1, 0] as const satisfies readonly number[]

/** The earliest mandatory stage. A tenant stage must be strictly earlier than
 *  this to be an addition rather than a delay of the ladder's own first rung. */
export const EARLIEST_MANDATORY_STAGE: number = MANDATORY_EXPIRY_LADDER[0]

export interface LadderRefusal {
  readonly refused: string
}

export function isLadderRefusal(
  result: readonly number[] | LadderRefusal,
): result is LadderRefusal {
  return 'refused' in result
}

/**
 * Add one earlier warning stage, or refuse with the rule stated. A typed
 * failure, never a thrown exception on an expected path.
 *
 * "Earlier" means MORE days before expiry, so the test is `>`, not `<`. The
 * inverted comparison is the whole defect this function exists to make
 * impossible: a ladder that accepted a 3-day stage would have silently
 * inserted a fifth rung INSIDE the mandatory four, which reads like an
 * addition and behaves like a delay of nothing at all — while accepting a
 * 14-day stage would be a duplicate, and accepting a 0-day one would be the
 * platform's own last rung offered back as though a tenant had set it.
 */
export function addEarlierWarningStage(
  days: number,
  ladder: readonly number[],
): readonly number[] | LadderRefusal {
  if (!Number.isInteger(days) || days < 0) {
    return {
      refused:
        'A warning stage is a whole number of days before expiry. Give a whole number of days, not a fraction and not a negative.',
    }
  }
  if (days <= EARLIEST_MANDATORY_STAGE) {
    return {
      refused: `A tenant may add a warning stage EARLIER than ${EARLIEST_MANDATORY_STAGE} days and may never remove or delay one (AC-NFR-1105). ${days} days is not earlier than the platform's own first stage, so it would move a mandatory rung rather than add to it. The four stages ${MANDATORY_EXPIRY_LADDER.join(', ')} always fire.`,
    }
  }
  if (ladder.includes(days)) {
    return { refused: `This ladder already warns at ${days} days.` }
  }
  return [...ladder, days].sort((a, b) => b - a)
}

/** Every ladder this module can produce still fires all four mandatory
 *  stages. Asserted rather than assumed, in both directions, in the unit suite. */
export function ladderHonoursTheMandatoryStages(ladder: readonly number[]): boolean {
  return MANDATORY_EXPIRY_LADDER.every((stage) => ladder.includes(stage))
}

/* ------------------------------------------------------------------ *
 * `OBJ-DOH-WORKER`.
 * ------------------------------------------------------------------ */

export interface Worker {
  readonly id: string
  readonly name: string
  /**
   * WORKER IS NOT USER. Every worker holds their own platform identity and
   * login — "the credential is the person's, never the device's" (L27419) —
   * but the ACCOUNT is `OBJ-DOH-USER` and belongs to the permissions module.
   * This field is the LINK to it, and `null` is a real and reachable value:
   * a worker on the floor may have no Hub account at all.
   */
  readonly platformLogin: string | null
  readonly workerType: WorkerType
  /**
   * `null` means the profile has not been accepted. The record is then
   * INCOMPLETE and cannot receive assignments (`FB-WKR-001` L52796). The
   * union stays closed: an invalid value is refused at entry rather than
   * stored, so no record can ever hold a fourth difficulty level.
   */
  readonly instructionDifficulty: InstructionDifficulty | null
  /** The Area this worker is based in. Scope resolution reads it. */
  readonly homeAreaId: string
  readonly state: WorkerState
  /**
   * Re-employment "reactivates the prior record — history intact — with a
   * re-validation prompt asking which prior qualifications still apply;
   * nothing is silently re-trusted" (L27443). True while that prompt stands.
   */
  readonly revalidationPending: boolean
  /**
   * Runs currently assigned, BY REFERENCE ONLY. This is the departure flow's
   * first step (SB-DOH-016, L27592: "Activity, with active and upcoming runs,
   * which is also the departure flow's first step") and an object-state
   * condition on archival — exactly as a scheduled run is on a Shift.
   *
   * IT IS NOT A MEASURE AND MUST NEVER BECOME ONE. There is no completed-run
   * list, no historical count, no total and no rate here; these are the runs
   * that must be reassigned before this record can be archived, and the
   * screen renders them as named references rather than as a number.
   */
  readonly activeRunIds: readonly string[]
  readonly upcomingRunIds: readonly string[]
  readonly note: string
}

/**
 * THE STRUCTURAL HALF OF THE SURVEILLANCE PROHIBITION, checked by the
 * compiler rather than by a test that has to be run.
 *
 * A `Worker` must never gain a behavioural measure. These four names are the
 * ones the source itself warns about — "using expiry frequency as a
 * performance measure" is the named prohibited use of `M-A4` (L101533), and
 * `M-A5`'s per-worker cut is `Explicitly prohibited` outright (L101536) — and
 * a field that exists is a field something will eventually read. The runtime
 * gate in `tests/unit/doh-workers.test.ts` sweeps EVERY key with the shared
 * matcher; this makes the four most likely ones fail to compile.
 */
type ForbiddenMeasureField =
  'runCount' | 'productivityScore' | 'clearanceCount' | 'expiryFrequency' // never on a record.
type MeasureFieldOnWorker = Extract<keyof Worker, ForbiddenMeasureField>
const _workerHasNoMeasureField: MeasureFieldOnWorker extends never ? true : never = true
void _workerHasNoMeasureField

export const DOH_WORKERS = [
  {
    id: 'WKR-ARD-0114',
    name: 'Maya Okonjo',
    platformLogin: 'maya.okonjo@ardenfield.example',
    workerType: 'employee',
    instructionDifficulty: 'standard',
    homeAreaId: 'AREA-ARD-ASSY',
    state: 'active',
    revalidationPending: false,
    activeRunIds: ['RUN-2026-08-14-A'],
    upcomingRunIds: [],
    note: 'Holds the one expired certification in this workspace, which is what raises the record banner SB-DOH-016 fixes. She may complete the run she is already on; a new assignment requiring that certification is what is blocked.',
  },
  {
    id: 'WKR-ARD-0207',
    name: 'Priya Raman',
    platformLogin: 'priya.raman@ardenfield.example',
    workerType: 'contractor',
    instructionDifficulty: 'expanded',
    homeAreaId: 'AREA-ARD-PAINT',
    state: 'active',
    revalidationPending: false,
    activeRunIds: [],
    upcomingRunIds: [],
    note: 'A contractor rather than an employee, and the label produces no operational difference at this version — it is carried because the record carries it, not because anything branches on it.',
  },
  {
    id: 'WKR-ARD-0311',
    name: 'Tomas Brandt',
    platformLogin: null,
    workerType: 'employee',
    instructionDifficulty: null,
    homeAreaId: 'AREA-ARD-QC',
    state: 'active',
    revalidationPending: false,
    activeRunIds: [],
    upcomingRunIds: [],
    note: 'Two things at once, and both are reachable states rather than defects in the fixture. The instruction-difficulty profile was never accepted, so the record is incomplete and can receive no assignment. And he holds no platform login, which is the honest half of Worker-is-not-User: a person can be on the register with no account anywhere.',
  },
  {
    id: 'WKR-ARD-0402',
    name: 'Idris Vance',
    platformLogin: 'idris.vance@ardenfield.example',
    workerType: 'employee',
    instructionDifficulty: 'standard',
    homeAreaId: 'AREA-ARD-ASSY',
    state: 'archived',
    revalidationPending: false,
    activeRunIds: [],
    upcomingRunIds: [],
    note: 'Departed, and the two-step flow completed: the runs were reassigned first, then the record was archived. It stays in the register because the history under it is still readable and a re-employment reactivates this record rather than creating a second one.',
  },
  {
    id: 'WKR-ARD-0509',
    name: 'Noor Haddad',
    platformLogin: 'noor.haddad@ardenfield.example',
    workerType: 'employee',
    instructionDifficulty: 'simple',
    homeAreaId: 'AREA-ARD-POLISH',
    state: 'reactivated',
    revalidationPending: true,
    activeRunIds: [],
    upcomingRunIds: [],
    note: 'Re-employed, with history intact and the re-validation prompt still standing. Nothing is silently re-trusted: every prior qualification is held pending until somebody says which ones still apply.',
  },
  {
    id: 'WKR-ARD-0615',
    name: 'Kai Lindqvist',
    platformLogin: 'kai.lindqvist@ardenfield.example',
    workerType: 'employee',
    instructionDifficulty: 'simple',
    homeAreaId: 'AREA-ARD-POLISH',
    state: 'active',
    revalidationPending: false,
    activeRunIds: ['RUN-2026-08-19-C'],
    upcomingRunIds: ['RUN-2026-08-20-A'],
    note: 'The worker whose departure cannot proceed: runs are still assigned, so step one of the two-step flow has work to do before step two is even offered. He also carries the one clearance this workspace has actually applied on a device.',
  },
] as const satisfies readonly Worker[]

/**
 * Takes the REGISTER rather than closing over the seed, for the same reason
 * `qualificationById` and `shiftsForArea` do: a worker created or archived in
 * a session must be visible to every answer this module gives. A module-level
 * `Map` built at import time is the snapshot defect this build has already
 * shipped twice — once as controls that wrote state a filter never read, once
 * as a fix that reached one call site of three — and it is invisible at the
 * call site, which is what makes it expensive. The Qualification Calendar
 * consumes this, and a stale answer there would be a certificate resolved
 * against a person who no longer exists.
 */
export function workerById(id: string, register: readonly Worker[]): Worker | undefined {
  return register.find((w) => w.id === id)
}

/* ------------------------------------------------------------------ *
 * `OBJ-DOH-QUAL`. Per-Area scope that may span Areas across MULTIPLE
 * SITES of the tenant (L27421).
 * ------------------------------------------------------------------ */

export interface Qualification {
  readonly id: string
  readonly workerId: string
  /** Always one of `SEEDED_CERTIFICATION_TYPES` — a gate input, chosen from
   *  the seeded list and never typed (D22). */
  readonly certificationId: string
  /** Per-Area scope. May name Areas under different Sites (L27421). */
  readonly areaIds: readonly string[]
  /** When the certificate was actually issued. Back-dating is allowed. */
  readonly certificationDate: string
  /** When it was entered on the platform. Both are recorded, so "a renewal
   *  entered late does not create an apparent compliance gap" (L27441). */
  readonly entryDate: string
  readonly expiryDate: string
  /**
   * Days from `REGISTER_AS_OF` to `expiryDate`, RECORDED rather than
   * computed: no clock is read anywhere in this module, and a fixture whose
   * warning stage depended on the day it was rendered would be a different
   * fixture every morning. Negative means the expiry has passed.
   */
  readonly daysToExpiry: number
  /** The expiry a recorded recertification replaced, or `null`. The new
   *  expiry must postdate it (L27437, `AC-DOH-04-9`). */
  readonly renewedFromExpiry: string | null
  readonly note: string
}

export const DOH_QUALIFICATIONS = [
  {
    id: 'QUAL-0114-LOTO',
    workerId: 'WKR-ARD-0114',
    certificationId: 'CERT-LOTO',
    areaIds: ['AREA-ARD-ASSY'],
    certificationDate: '2025-08-14',
    entryDate: '2025-08-14',
    expiryDate: '2026-08-14',
    daysToExpiry: -5,
    renewedFromExpiry: null,
    note: 'Expired five days ago. This is the record the red banner names, the record the queued clearance covers, and the record a recertification would return to force.',
  },
  {
    id: 'QUAL-0114-FLT',
    workerId: 'WKR-ARD-0114',
    certificationId: 'CERT-FLT',
    areaIds: ['AREA-ARD-ASSY'],
    certificationDate: '2026-04-01',
    entryDate: '2026-04-01',
    expiryDate: '2026-12-17',
    daysToExpiry: 120,
    renewedFromExpiry: null,
    note: 'In force, and deliberately on the same worker as the expired one: a worker is never simply qualified or unqualified, and the banner speaks about one certification rather than about the person.',
  },
  {
    id: 'QUAL-0207-SOLVENT',
    workerId: 'WKR-ARD-0207',
    certificationId: 'CERT-SOLVENT',
    areaIds: ['AREA-ARD-PAINT'],
    certificationDate: '2025-08-25',
    entryDate: '2025-08-25',
    expiryDate: '2026-08-25',
    daysToExpiry: 6,
    renewedFromExpiry: null,
    note: 'Inside the 7-day stage. The supervisor and the Tenant Admin have had the 14-day and 7-day alerts; the Quality Manager meets this one inside the per-shift digest instead.',
  },
  {
    id: 'QUAL-0207-FLT',
    workerId: 'WKR-ARD-0207',
    certificationId: 'CERT-FLT',
    areaIds: ['AREA-ARD-PAINT'],
    certificationDate: '2025-08-20',
    entryDate: '2025-08-20',
    expiryDate: '2026-08-20',
    daysToExpiry: 1,
    renewedFromExpiry: null,
    note: 'One day left, which is the third rung of the ladder and the last one before expiry itself.',
  },
  {
    id: 'QUAL-0311-METROLOGY',
    workerId: 'WKR-ARD-0311',
    certificationId: 'CERT-METROLOGY',
    areaIds: ['AREA-ARD-QC', 'AREA-ARD-ASSY'],
    certificationDate: '2025-09-01',
    entryDate: '2025-09-03',
    expiryDate: '2026-09-01',
    daysToExpiry: 13,
    renewedFromExpiry: null,
    note: 'The multi-Site case: Quality Laboratory sits under Kelvin Road and Assembly Hall under Ardenfield Works, and one qualification scopes across both. Its certification date and entry date already differ by two days, so the record shows what a late entry looks like without a gap.',
  },
  {
    id: 'QUAL-0509-SOLVENT',
    workerId: 'WKR-ARD-0509',
    certificationId: 'CERT-SOLVENT',
    areaIds: ['AREA-ARD-POLISH'],
    certificationDate: '2026-02-28',
    entryDate: '2026-03-02',
    expiryDate: '2027-03-07',
    daysToExpiry: 200,
    renewedFromExpiry: '2026-03-01',
    note: 'Recertified: the new expiry postdates the one it replaced, and both dates are on the record. It sits against a reactivated worker, so it is in force AND pending re-validation at the same time — which is the point of the prompt.',
  },
  {
    id: 'QUAL-0615-LOTO',
    workerId: 'WKR-ARD-0615',
    certificationId: 'CERT-LOTO',
    areaIds: ['AREA-ARD-POLISH'],
    certificationDate: '2025-08-17',
    entryDate: '2025-08-17',
    expiryDate: '2026-08-17',
    daysToExpiry: -2,
    renewedFromExpiry: null,
    note: 'Expired, and covered by a clearance that has actually reached applied on the device — the only record here whose chip may honestly read Cleared.',
  },
  {
    id: 'QUAL-0402-FLT',
    workerId: 'WKR-ARD-0402',
    certificationId: 'CERT-FLT',
    areaIds: ['AREA-ARD-ASSY'],
    certificationDate: '2026-01-06',
    entryDate: '2026-01-06',
    expiryDate: '2026-09-28',
    daysToExpiry: 40,
    renewedFromExpiry: null,
    note: 'Held by the archived worker. Archival does not delete the history under a record, which is what makes a re-employment a reactivation rather than a fresh start.',
  },
] as const satisfies readonly Qualification[]

export function qualificationsFor(
  workerId: string,
  register: readonly Qualification[],
): readonly Qualification[] {
  return register.filter((q) => q.workerId === workerId)
}

export function qualificationById(
  id: string,
  register: readonly Qualification[],
): Qualification | undefined {
  return register.find((q) => q.id === id)
}

/**
 * The state of one qualification, derived from the ladder rather than stored
 * twice. `renewed` is deliberately NOT sticky: a renewal that is itself
 * inside a warning stage renders that stage instead, because the safe
 * direction is the one where a badge can never hide a warning.
 */
export function qualificationStateFor(qual: Qualification): QualificationState {
  if (qual.daysToExpiry <= 0) return 'expired'
  if (qual.renewedFromExpiry !== null && qual.daysToExpiry > EARLIEST_MANDATORY_STAGE) {
    return 'renewed'
  }
  if (qual.daysToExpiry <= 1) return 'warning_1'
  if (qual.daysToExpiry <= 7) return 'warning_7'
  if (qual.daysToExpiry <= EARLIEST_MANDATORY_STAGE) return 'warning_14'
  return 'valid'
}

/** The chip wording SB-DOH-016 fixes (L27592): "Valid, 14 days, 7 days,
 *  1 day, Expired or Cleared". Cleared is the CLEARANCE's state showing
 *  through and is not a sixth qualification state — see `chipFor`. */
/**
 * THE SIX CHIP LABELS, as a closed union rather than as `string`.
 *
 * Two things on this screen turn on a chip reading exactly `Expired` — the
 * record banner and the register's certification-standing column — and while
 * this was `string` both of them compared a magic literal that no compiler
 * could check. It is also the vocabulary the Qualification Calendar consumes,
 * and a neighbouring module should not have to re-derive it or compare
 * literals across a module boundary. Closing the union makes `CHIP_TONE`
 * exhaustive on the consuming side and deletes the `?? 'neutral'` fallback
 * that was standing in for a case nothing could reach.
 */
export type QualificationChip = 'Valid' | '14 days' | '7 days' | '1 day' | 'Expired' | 'Cleared'

export const QUALIFICATION_CHIPS = [
  'Valid',
  '14 days',
  '7 days',
  '1 day',
  'Expired',
  'Cleared',
] as const satisfies readonly QualificationChip[]

type MissingFromChips = Exclude<QualificationChip, (typeof QUALIFICATION_CHIPS)[number]>
const _chipsExhaustive: MissingFromChips extends never ? true : never = true
void _chipsExhaustive

export const QUALIFICATION_CHIP_LABEL: Readonly<Record<QualificationState, QualificationChip>> = {
  valid: 'Valid',
  warning_14: '14 days',
  warning_7: '7 days',
  warning_1: '1 day',
  expired: 'Expired',
  renewed: 'Valid',
}

export const CLEARED_CHIP_LABEL: QualificationChip = 'Cleared'

/**
 * THE RECERTIFICATION RULE (L27437, `AC-DOH-04-9`, `FB-CONFIG-003` at
 * L61522): the new expiry must postdate the previous one; the entry is
 * "refused with the rule stated, no partial record is created, and the
 * worker's existing qualification state stands unchanged."
 *
 * Dates are compared as `YYYY-MM-DD` strings, which sort chronologically as
 * text — no clock is read and no date object is constructed. A string that
 * is not in that shape is refused rather than compared, because a comparison
 * against a malformed value is exactly the silent pass this refusal exists
 * to prevent.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function recertificationRefusal(
  previousExpiry: string,
  newExpiry: string,
): string | null {
  if (!ISO_DATE.test(newExpiry)) {
    return `A new expiry is a date in the form YYYY-MM-DD. Give one that postdates ${previousExpiry}; nothing is written until it does, and no partial record is created.`
  }
  if (newExpiry <= previousExpiry) {
    return `A recertification's new expiry must POSTDATE the previous expiry of ${previousExpiry}, and ${newExpiry} does not. The entry is refused with the rule stated and no partial record is created: the existing qualification state stands exactly as it was, because a worker left unqualified is safer than one left half-qualified (AC-DOH-04-9, FB-CONFIG-003).`
  }
  return null
}

/**
 * Back-dating the issue date is allowed and BOTH dates are recorded
 * (L27437), so "a renewal entered late does not create an apparent
 * compliance gap in the record". This is the queryable form of that: the
 * record is late, and the record says so, rather than looking like a gap.
 */
export function entryIsLate(qual: Qualification): boolean {
  return qual.entryDate > qual.certificationDate
}

/* ------------------------------------------------------------------ *
 * `OBJ-DOH-CLEAR`. The Hub owns the clearance RECORD and its
 * enforcement; the granting act is Client Command Center action number
 * 10 (L27531). D23: the register here is read-only and mints no grant
 * control for anybody.
 * ------------------------------------------------------------------ */

export interface Clearance {
  readonly id: string
  readonly workerId: string
  /** The qualification this clears, or `null` for a never-held one. */
  readonly qualificationId: string | null
  /** The certification concerned. Always present, qualification or not. */
  readonly certificationId: string
  /** Where. Half of the escalation key, and the half that carries the signal. */
  readonly areaId: string
  /** On which working-time block. The other half of the escalation key. */
  readonly shiftId: string
  readonly reasonCode: ClearanceReasonCode
  /** Optional free text BESIDE the code, never instead of it (L27533). */
  readonly reasonText: string
  /** The ROLE that granted it. Full audit metadata is "who granted, for whom,
   *  where, why, when granted and when lapsed" (L27439); the role is what the
   *  authority split turns on and is what this register renders. */
  readonly grantedByRole: TenantRoleId
  readonly grantedAt: string
  readonly state: ClearanceState
  /**
   * The TRUE command state, one of the fifteen. `AC-STU-118` (L33769): "No
   * surface shows a clearance as effective before its command reaches applied
   * on the device." This field is what makes that enforceable rather than
   * promised — see `clearanceIsEffective`.
   */
  readonly commandState: CommandState
  /** How long this grant runs. A TENANT SETTING, "not a fixed per-shift
   *  expiry" (L27535). */
  readonly validForDays: number
  readonly lapsedAt: string | null
  readonly note: string
}

export const DOH_CLEARANCES = [
  {
    id: 'CLR-2026-0031',
    workerId: 'WKR-ARD-0114',
    qualificationId: 'QUAL-0114-LOTO',
    certificationId: 'CERT-LOTO',
    areaId: 'AREA-ARD-ASSY',
    shiftId: 'SHIFT-ARD-EARLY',
    reasonCode: 'emergency-cover',
    reasonText: 'Renewal booked 15 August',
    grantedByRole: 'SUPERVISOR',
    grantedAt: '2026-08-19 08:50 Europe/London',
    state: 'granted',
    commandState: 'queued',
    validForDays: 7,
    lapsedAt: null,
    note: 'Granted and QUEUED. The device has not acknowledged it, so nothing on this surface may render the qualification as cleared: the record reads Expired and the clearance reads queued, which is the whole of AC-STU-118 in one row.',
  },
  {
    id: 'CLR-2026-0033',
    workerId: 'WKR-ARD-0615',
    qualificationId: 'QUAL-0615-LOTO',
    certificationId: 'CERT-LOTO',
    areaId: 'AREA-ARD-POLISH',
    shiftId: 'SHIFT-KEL-DAY',
    reasonCode: 'training-in-progress',
    reasonText: 'Paired with a certified operator for the whole block',
    grantedByRole: 'QUALITY_MANAGER',
    grantedAt: '2026-08-19 07:12 Europe/Warsaw',
    state: 'active',
    commandState: 'applied',
    validForDays: 7,
    lapsedAt: null,
    note: 'The one clearance that has actually reached the device. Its qualification may honestly render Cleared, and it is the only row on this screen for which that is true.',
  },
  {
    id: 'CLR-2026-0019',
    workerId: 'WKR-ARD-0402',
    qualificationId: 'QUAL-0402-FLT',
    certificationId: 'CERT-FLT',
    areaId: 'AREA-ARD-ASSY',
    shiftId: 'SHIFT-ARD-EARLY',
    reasonCode: 'other',
    reasonText: 'Audit observation cover, single block',
    grantedByRole: 'QUALITY_MANAGER',
    grantedAt: '2026-07-30 06:05 Europe/London',
    state: 'lapsed',
    commandState: 'applied',
    validForDays: 7,
    lapsedAt: '2026-08-06 06:05 Europe/London',
    note: 'Lapsed at the end of its duration. The qualification it covered returned to Expired and never to Valid — a clearance can never quietly become a permanent qualification. It is also the SECOND clearance recorded against Assembly Hall on the early Shift, which is what routes any further one there to the Quality Manager.',
  },
  {
    id: 'CLR-2026-0022',
    workerId: 'WKR-ARD-0509',
    qualificationId: 'QUAL-0509-SOLVENT',
    certificationId: 'CERT-SOLVENT',
    areaId: 'AREA-ARD-POLISH',
    shiftId: 'SHIFT-KEL-BACK',
    reasonCode: 'training-in-progress',
    reasonText: 'Refresher completed mid-clearance',
    grantedByRole: 'QUALITY_MANAGER',
    grantedAt: '2026-02-26 15:40 Europe/Warsaw',
    state: 'superseded_by_renewal',
    commandState: 'applied',
    validForDays: 7,
    lapsedAt: '2026-03-02 09:00 Europe/Warsaw',
    note: 'Superseded rather than lapsed: the recertification landed while the clearance was still running, so the exception stopped being needed instead of running out.',
  },
] as const satisfies readonly Clearance[]

/**
 * `AC-STU-118` (L33769), held as a function so no render site can decide it
 * for itself: a clearance is EFFECTIVE only when it is in force AND its
 * command has reached `applied` on the device. Anything else — granted but
 * queued, delivered but not applied, failed — is not effective, and the
 * surface renders the command's true state instead.
 */
export function clearanceIsEffective(clearance: Clearance): boolean {
  return (
    (clearance.state === 'granted' || clearance.state === 'active') &&
    clearance.commandState === 'applied'
  )
}

/** The clearance covering one qualification right now, or `null`. */
export function effectiveClearanceFor(
  qualificationId: string,
  register: readonly Clearance[],
): Clearance | null {
  return register.find((c) => c.qualificationId === qualificationId && clearanceIsEffective(c)) ?? null
}

/**
 * The chip SB-DOH-016 fixes, resolved against the live clearance register.
 * Cleared is reachable ONLY through `clearanceIsEffective`, so a queued
 * clearance can never paint one.
 */
export function chipFor(
  qual: Qualification,
  clearances: readonly Clearance[],
): QualificationChip {
  if (effectiveClearanceFor(qual.id, clearances) !== null) return CLEARED_CHIP_LABEL
  return QUALIFICATION_CHIP_LABEL[qualificationStateFor(qual)]
}

/* ------------------------------------------------------------------ *
 * THE ESCALATION KEY. Slice gate 3, and the sentence the source uses
 * for it (L27437): the scope is "deliberately Area-level, not
 * per-worker: repeated exceptions in one Area are a signal about the
 * Area."
 * ------------------------------------------------------------------ */

/** The key, as data rather than as a sentence. Never `(Worker)`. */
export const ESCALATION_KEY = ['Area', 'Shift'] as const

/**
 * Does a further clearance on this Area and this Shift route to the Quality
 * Manager rather than being grantable by the Supervisor?
 *
 * NOTE THE SIGNATURE. There is no worker parameter, and there is nowhere for
 * one to go: "regardless of which worker is involved" is a property of what
 * this function can be asked, not a claim made about it. A caller that wanted
 * to key this on a person would have to change the signature, which is a
 * review-visible act rather than a quiet one.
 *
 * A LAPSED clearance still counts. The source states the rule without saying
 * which clearances it ranges over; a lapse does not un-signal an Area, and
 * the stricter interpretation applies in that silence (L26547). The competing
 * reading is recorded in `UNSPECIFIED_IN_SOURCE` rather than settled quietly.
 */
export function secondClearanceRoutesToQualityManager(
  areaId: string,
  shiftId: string,
  register: readonly Clearance[],
): boolean {
  return register.some((c) => c.areaId === areaId && c.shiftId === shiftId)
}

export function clearancesOn(
  areaId: string,
  shiftId: string,
  register: readonly Clearance[],
): readonly Clearance[] {
  return register.filter((c) => c.areaId === areaId && c.shiftId === shiftId)
}

/**
 * WHICH ROLES ARE ON SHIFT. Keyed on the Shift and holding ROLE identifiers,
 * never people — there is no roster of named individuals in this workspace
 * for anything to read, which is the structural reason no escalation here can
 * resolve to a person.
 *
 * The Shift identifiers are the shift module's own seed, read and never
 * re-declared. `ON_SHIFT_ROLE_COVERAGE` is asserted total over `DOH_SHIFTS`
 * in the unit suite, so a Shift added there cannot silently arrive here with
 * no coverage at all.
 */
export const ON_SHIFT_ROLE_COVERAGE: Readonly<Record<string, readonly TenantRoleId[]>> = {
  'SHIFT-ARD-EARLY': ['SUPERVISOR', 'QUALITY_MANAGER'],
  'SHIFT-ARD-LATE': ['SUPERVISOR'],
  'SHIFT-ARD-NIGHT': [],
  'SHIFT-ARD-TWILIGHT': [],
  'SHIFT-KEL-DAY': ['SUPERVISOR', 'QUALITY_MANAGER'],
  'SHIFT-KEL-BACK': ['SUPERVISOR'],
}

/** The role an unacknowledged expiry escalates to (L27429). */
export const ESCALATION_TARGET_ROLE: TenantRoleId = 'QUALITY_MANAGER'

/** "a configurable window, default 2 minutes" (L27429). A label, not a
 *  timer: this storyboard runs no clock and starts nothing. */
export const ESCALATION_WINDOW_DEFAULT = '2 minutes'

export interface EscalationResolution {
  /** `(Area, Shift)` — the key, carried on the resolution itself. */
  readonly area: string
  readonly shift: string
  readonly targetRole: TenantRoleId
  readonly resolvedOnShift: boolean
  /** "marks the delivery as a fallback so the gap is visible rather than
   *  silent" (L27429). */
  readonly markedAsFallback: boolean
  readonly note: string
}

/**
 * Resolve an escalation against the roles on shift for one `(Area, Shift)`
 * pair. Where nobody holding the target role is on shift, the delivery falls
 * back to the tenant's Quality Manager role irrespective of shift and is
 * MARKED as a fallback.
 *
 * `RISK-019` and D26 are visible in the return shape: the fallback target is
 * itself a ROLE, which may have no holder, and this function reports that it
 * fell back rather than pretending it arrived.
 */
export function resolveEscalation(
  areaId: string,
  shiftId: string,
  coverage: Readonly<Record<string, readonly TenantRoleId[]>> = ON_SHIFT_ROLE_COVERAGE,
): EscalationResolution {
  const onShift = coverage[shiftId] ?? []
  const resolvedOnShift = onShift.includes(ESCALATION_TARGET_ROLE)
  return {
    area: areaId,
    shift: shiftId,
    targetRole: ESCALATION_TARGET_ROLE,
    resolvedOnShift,
    markedAsFallback: !resolvedOnShift,
    note: resolvedOnShift
      ? 'A holder of the target role is on this Shift, so the escalation resolves on shift and is delivered as itself.'
      : 'Nobody holding the target role is on this Shift, so the delivery falls back to the tenant’s Quality Manager role irrespective of shift and is MARKED as a fallback. The fallback target is itself a role that may have no holder, which is the hole DEC-NOSHIFT-001 leaves open and the one place in the risk register where residual risk equals inherent (RISK-019, D26).',
  }
}

/** The Shifts an Area is bound to, read from the shift module's seed. The
 *  escalation key needs both halves, and the Area alone does not fix one. */
export function shiftsBoundTo(areaId: string): readonly Shift[] {
  return shiftsForArea(areaId, DOH_SHIFTS)
}

export function shiftNameFor(shiftId: string): string {
  return shiftById(shiftId)?.name ?? shiftId
}

export function areaNameFor(areaId: string): string {
  return areaById(areaId)?.name ?? areaId
}

export function certificationLabelFor(certificationId: string): string {
  return certificationName(certificationId)
}

/* ------------------------------------------------------------------ *
 * Scope. Read from the ONE definition the location module owns — a
 * worker out of scope on the location tree is out of scope here too.
 * ------------------------------------------------------------------ */

/** Every Area this record touches: the home Area plus every Area its
 *  qualifications scope to, which is how a worker qualified across two Sites
 *  is visible to a reader scoped to either. */
export function workerAreaIds(
  worker: Worker,
  qualifications: readonly Qualification[],
): readonly string[] {
  const ids = new Set<string>([worker.homeAreaId])
  for (const qual of qualificationsFor(worker.id, qualifications)) {
    for (const areaId of qual.areaIds) ids.add(areaId)
  }
  return [...ids]
}

export function workersVisibleTo(
  roleId: TenantRoleId,
  workers: readonly Worker[],
  qualifications: readonly Qualification[],
): readonly Worker[] {
  const scope = SEEDED_ROLE_SCOPES[roleId]
  switch (scope.scope) {
    case 'tenant':
      return workers
    case 'site':
    case 'area':
      return workers.filter((w) =>
        workerAreaIds(w, qualifications).some((a) => scope.areaIds.includes(a)),
      )
    default: {
      const exhaustive: never = scope.scope
      throw new Error(`Unhandled scope on MOD-DOH-04: ${String(exhaustive)}`)
    }
  }
}

/**
 * THE CLEARANCE CORPUS, SCOPE-FILTERED. `Read-only — own scope` for the
 * Supervisor (L27484), and the reason this exists as its own function rather
 * than as a filter at the render site: the corpus carries the free-text reason
 * somebody wrote about a named person, so an out-of-scope row here leaks more
 * than an out-of-scope row on the register does.
 *
 * A clearance is placed by its AREA, which is the half of the escalation key
 * that carries the signal — not by the worker it concerns. So the filter asks
 * the same question the escalation asks, and a reader who cannot see an Area on
 * the location tree meets none of its exceptions here either.
 */
export function clearancesVisibleTo(
  roleId: TenantRoleId,
  clearances: readonly Clearance[],
): readonly Clearance[] {
  const scope = SEEDED_ROLE_SCOPES[roleId]
  switch (scope.scope) {
    case 'tenant':
      return clearances
    case 'site':
    case 'area':
      return clearances.filter((c) => scope.areaIds.includes(c.areaId))
    default: {
      const exhaustive: never = scope.scope
      throw new Error(`Unhandled scope on MOD-DOH-04: ${String(exhaustive)}`)
    }
  }
}

export function scopeLabelFor(roleId: TenantRoleId): string {
  return SEEDED_ROLE_SCOPES[roleId].label
}

export function selectableAreas(roleId: TenantRoleId): readonly LocationArea[] {
  const scope = SEEDED_ROLE_SCOPES[roleId]
  return scope.areaIds
    .map((id) => areaById(id))
    .filter((a): a is LocationArea => a !== undefined && a.state === 'active')
}

/* ------------------------------------------------------------------ *
 * BULK IMPORT — "a single canonical comma-separated-values template"
 * (L27445), all-or-nothing per file (L26707). No per-tenant column
 * mapping exists in the platform: it is the client's onboarding
 * operation, outside the product.
 * ------------------------------------------------------------------ */

export const CANONICAL_IMPORT_COLUMNS = [
  'name',
  'platform_login',
  'worker_type',
  'instruction_difficulty',
  'home_area_id',
] as const satisfies readonly string[]

export interface ImportFile {
  readonly id: string
  readonly fileName: string
  /** The rows the file would create, already in the canonical shape. */
  readonly rows: readonly {
    readonly name: string
    readonly workerType: WorkerType
    readonly instructionDifficulty: InstructionDifficulty
    readonly homeAreaId: string
  }[]
  /** The one-based row a validation failure sits on, or `null` for a clean
   *  file. `TEST-DOH-04-F3` names row 200 of 212; this fixture is smaller and
   *  keeps the shape. */
  readonly failsAtRow: number | null
  readonly failureRule: string | null
  readonly note: string
}

export const SEEDED_IMPORT_FILES = [
  {
    id: 'IMP-CLEAN',
    fileName: 'ardenfield-intake-2026-08.csv',
    rows: [
      {
        name: 'Rosa Delgado',
        workerType: 'employee',
        instructionDifficulty: 'standard',
        homeAreaId: 'AREA-ARD-ASSY',
      },
      {
        name: 'Wen Li',
        workerType: 'contractor',
        instructionDifficulty: 'simple',
        homeAreaId: 'AREA-ARD-PAINT',
      },
    ],
    failsAtRow: null,
    failureRule: null,
    note: 'A clean file in the canonical template. Both rows land, or neither does — there is no partial import at any size.',
  },
  {
    id: 'IMP-BAD-ROW',
    fileName: 'ardenfield-intake-2026-08-draft.csv',
    rows: [
      {
        name: 'Ana Kovac',
        workerType: 'employee',
        instructionDifficulty: 'standard',
        homeAreaId: 'AREA-ARD-ASSY',
      },
      {
        name: 'Sem Vos',
        workerType: 'employee',
        instructionDifficulty: 'expanded',
        homeAreaId: 'AREA-ARD-PAINT',
      },
    ],
    failsAtRow: 2,
    failureRule:
      'Row 2 names an instruction-difficulty level outside simple, standard and expanded. The import is all-or-nothing per file, so nothing is written: the first row is not created either, and every existing record is untouched.',
    note: 'The all-or-nothing case. The point of the fixture is what happens to row 1 — nothing — and what happens to the register — nothing.',
  },
] as const satisfies readonly ImportFile[]

/* ------------------------------------------------------------------ *
 * The fifteen-row control matrix, verified verbatim at the frozen
 * source L27470-L27484. Every cell carries an explicit status: L10238
 * prohibits a blank, "because a blank cell is an unanswered question
 * that an implementer will answer privately".
 * ------------------------------------------------------------------ */

/**
 * The cell-status union and the row's surface come from their ONE owner,
 * `@/surfaces/doh/modules`. Six Hub matrices shipped six identical copies of
 * this union, each with its own exhaustiveness proof; six proofs of six
 * unions prove nothing about the seventh spelling.
 *
 * THE ARRAY STAYS LOCAL, AND DELIBERATELY. The spine imports these matrices
 * to derive `rolesReaching`, so a VALUE imported back from the spine closes
 * a runtime cycle — and it closes it in the worst way: with a fixture module
 * as the entry point, the spine re-enters a sibling fixture that is still
 * mid-evaluation and reads `undefined` off it (reproduced as
 * `TypeError: Cannot read properties of undefined (reading 'map')` in
 * `permissions-roles-and-access`). A `import type` is erased and opens no
 * edge at all. The `Exclude` proof below is over the ONE union, so this
 * array is provably the whole of it and the six copies cannot drift apart.
 */
export type { ControlStatus, MatrixRowSurface } from '@/surfaces/doh/modules'

export const CONTROL_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
  'explicitly-prohibited',
  'not-applicable',
  'unavailable',
] as const satisfies readonly ControlStatus[]

type MissingFromControlStatuses = Exclude<ControlStatus, (typeof CONTROL_STATUSES)[number]>
const _controlStatusesExhaustive: MissingFromControlStatuses extends never ? true : never = true
void _controlStatusesExhaustive

export type WorkerControlId =
  | 'create-or-edit-worker'
  | 'view-worker'
  | 'enter-qualification'
  | 'record-recertification'
  | 'back-date-issue-date'
  | 'set-instruction-difficulty'
  | 'clear-expired-certification'
  | 'clear-never-held'
  | 'clear-second-in-area-on-shift'
  | 'set-gate-posture-or-duration'
  | 'archive-worker'
  | 'reactivate-worker'
  | 'bulk-import-workers'
  | 'view-own-certification-alerts'
  | 'read-clearance-corpus'

/** The shared Hub row shape, declared once in the spine and read by six
 *  matrices that used to declare three shapes between them. */
export type ControlMatrixRow = DohControlMatrixRow<WorkerControlId>

/**
 * WHERE THE SOURCE STATES A TOKEN AND NOTHING ELSE. The frozen table at
 * L27470-L27484 qualifies most of the Tenant Admin and Supervisor cells and
 * both Worker grants, and gives the bare word `Explicitly prohibited` for
 * the Quality Manager, the Read-only Auditor and the Worker on most write
 * rows. A blank cell is forbidden (L10238) and a cause this build wrote
 * would read as the source’s, so those cells carry the token and point at
 * the panel that records the silence.
 */

export const CONTROL_MATRIX = [
  {
    id: 'create-or-edit-worker',
    control: 'Create or edit a worker record',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27470), tenant-wide.',
      SUPERVISOR:
        'Allowed with conditions — own scope; blocked for new workers in soft suspension (L27470).',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Tenant Admin, and for the Supervisor within their own Area scope. Blocked for NEW workers in soft suspension, which is the write-class table’s answer and not a second rule stated here. ABSENT for the other three: no other role holds it in any scope and no other surface grants it, so nothing is drawn where it would sit.',
    effect:
      'Creates the record with its own platform identity, or edits one. Supervisor permission alone authorises the change and the audit trail is the control rather than a second approval — a deliberate design decision the source states outright.',
    sourceRef: 'L27470, FUNC-DOH-04-1.1.1 L27539, AC-WF-WKR-001-04 L52800',
  },
  {
    id: 'view-worker',
    control: 'View a worker record',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'allowed-with-conditions',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27471), tenant-wide.',
      SUPERVISOR:
        'Allowed with conditions — own scope (L27471).',
      QUALITY_MANAGER:
        'Allowed with conditions — own scope (L27471).',
      READONLY_AUDITOR:
        'Read-only (L27471).',
      WORKER:
        'Allowed with conditions — own record only (L27471). Met on the device: the Worker holds no Hub route (D11), and the clearance-corpus row withholds this module besides.',
    },
    rendering:
      'The register renders for four roles and is scope-filtered for two of them. The Auditor reads it under STATE-06 with the cause named. The Worker’s own-record-only grant renders on no screen at all, because the Worker holds no Hub route — the collision is stated rather than resolved in silence.',
    effect:
      'A read. Reads degrade to the last loaded register when the connection drops, with a freshness marker and an as-of time.',
    sourceRef: 'L27471, D11 / DEC-WKRVIEW-001 L23067',
  },
  {
    id: 'enter-qualification',
    control: 'Enter a qualification',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27472), tenant-wide.',
      SUPERVISOR:
        'Allowed — with full audit (L27472).',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER:
        'Explicitly prohibited — self-attestation is not permitted (L27472).',
    },
    rendering:
      'Live for the Tenant Admin and the Supervisor with full audit. ABSENT for the other three, and for the Worker absent ABSOLUTELY and by construction rather than by a permission check: no worker-role path reaches qualification entry, on any surface, through any interface. The Quality Manager’s absence here is the deliberate half of the authority split — the role that may clear a block may not enter the certificate that creates one.',
    effect:
      'Records the certificate with its type, its per-Area scope which may span Sites, its certification date and its expiry date. Committed with its audit entry in one transaction.',
    sourceRef: 'L27472, FUNC-DOH-04-2.1.1 L27551, AC-DOH-04-1 L27602, AC-28.4-01 L52774',
  },
  {
    id: 'record-recertification',
    control: 'Record a recertification',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27473), tenant-wide.',
      SUPERVISOR:
        'Allowed with conditions — new expiry must postdate the old; stays open in soft suspension (L27473).',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Tenant Admin and the Supervisor, refused with the rule stated when the new expiry does not postdate the old, and STAYS OPEN in soft suspension while creation does not. Under HARD suspension it is closed with its consequence named (D16). ABSENT for the other three.',
    effect:
      'Replaces the expiry and lifts any active block at the device’s next sync. Both the certification date and the entry date are recorded, so a late entry creates no apparent gap.',
    sourceRef: 'L27473, FUNC-DOH-04-2.1.2 L27552, AC-DOH-04-9 L27610, FB-CONFIG-003 L61522',
  },
  {
    id: 'back-date-issue-date',
    control: 'Back-date an issue date',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — both certification date and entry date recorded (L27474).',
      SUPERVISOR:
        'Allowed with conditions — same condition (L27474).',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Not a control of its own: it is the certification-date field of the entry and recertification forms, whose condition is that BOTH dates are recorded whenever they differ. Where those forms are absent, so is this.',
    effect:
      'Records the certification date and the entry date separately. The record then shows a late entry as a late entry rather than as a compliance gap.',
    sourceRef: 'L27474, L27435',
  },
  {
    id: 'set-instruction-difficulty',
    control: 'Set the instruction-difficulty profile',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27475), stated with no qualifying words.',
      SUPERVISOR:
        'Allowed (L27475), stated with no qualifying words.',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Tenant Admin and the Supervisor, offering exactly three levels. A value outside them is refused and the record is held INCOMPLETE and can receive no assignment. ABSENT for the other three.',
    effect:
      'Selects which work-instruction difficulty variant the worker receives at execution. It reaches the device in the next work package; an in-flight run keeps the level pinned in its own package.',
    sourceRef: 'L27475, FUNC-DOH-04-1.1.2 L27540, AC-WF-WKR-001-03 L52800 / FB-WKR-001 L52796',
  },
  {
    id: 'clear-expired-certification',
    control: 'Grant a clearance for an expired certification',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR:
        'Allowed with conditions — mandatory categorised reason; the Quality Manager is notified (L27476).',
      QUALITY_MANAGER:
        'Allowed (L27476), stated with no qualifying words.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'No grant control exists in the Hub for anybody (D23): what renders is the cross-surface handoff to the Client Command Center, where action number 10 actually grants. It is live for the Supervisor with a mandatory categorised reason and for the Quality Manager, and DISABLED WITH ITS REASON for the Tenant Admin (D10) — the most privileged tenant role sits deliberately outside the safety-exception path, and the disabled control is where that rule teaches itself. ABSENT for the Auditor, whose read-only cause is named once for the whole screen.',
    effect:
      'Routes to the surface that grants. The Hub owns the clearance RECORD and its enforcement and grants nothing itself; the Quality Manager is notified on grant.',
    sourceRef: 'L27476, FUNC-DOH-04-3.1.1 L27556, the clearance-register row of catalogue A, L26059, FB-QUAL-005 L64415',
  },
  {
    id: 'clear-never-held',
    control: 'Grant a clearance for a never-held qualification',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR:
        'Explicitly prohibited — requires Quality Manager authorisation (L27477).',
      QUALITY_MANAGER:
        'Allowed with conditions — reason code plus authorisation (L27477).',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'The canonical DISABLED-WITH-A-NAMED-REASON case. For the Supervisor the handoff renders greyed carrying "requires Quality Manager authorisation", because FB-QUAL-005 names the primary failure as a supervisor believing they can authorise and the first fallback as the disabled control with its reason, "which teaches the rule at the moment it binds". Disabled with its reason for the Tenant Admin too, for the same reason and a different rule. ABSENT for the Auditor.',
    effect:
      'Routes to the Quality Manager, who grants with a reason code plus authorisation. A refused attempt through a service path is itself recorded, because an attempted authority escalation is worth recording.',
    sourceRef: 'L27477, FUNC-DOH-04-3.1.2 L27557, AC-DOH-04-6 L27607, FB-QUAL-005 L64415',
  },
  {
    id: 'clear-second-in-area-on-shift',
    control: 'Grant a second clearance in the same Area on the same shift',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR:
        'Explicitly prohibited — routes to the Quality Manager (L27478).',
      QUALITY_MANAGER:
        'Allowed with conditions (L27478), stated with no further qualifying words.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Quality Manager only where the chosen Area and Shift already hold a clearance, and disabled with the reason otherwise — a first clearance is not a second one. Disabled with "routes to the Quality Manager" for the Supervisor, and with the authority rule for the Tenant Admin.',
    effect:
      'The escalation keys on the pairing of Area and Shift and never on a person: repeated exceptions in one Area are a signal about the Area, and the rule fires regardless of which worker is involved.',
    sourceRef: 'L27478, FUNC-DOH-04-3.1.3 L27558, AC-DOH-04-7 L27608, L27437',
  },
  {
    id: 'set-gate-posture-or-duration',
    control: 'Set the gate posture or the clearance duration',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — in the tenant administration area, never below the notify-only floor (L27479).',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Tenant Admin in this module’s own section of the tenant administration area, which is a screen GROUP rather than a surface and is owned by no single module (D2). Never below the notify-only floor: no third posture exists to select, so the floor is held by the closed vocabulary rather than by a check. ABSENT for the other four.',
    effect:
      'Selects strict blocking, the platform default, or notify-only, under which execution proceeds and the same events raise notifications and audit flags. Sets how long a granted clearance runs before it lapses — a tenant setting, not a fixed per-shift expiry.',
    sourceRef: 'L27479, FUNC-DOH-04-2.3.1 L27554, TEST-DOH-04-D4 L27626, AC-PROD-040 / D2',
  },
  {
    id: 'archive-worker',
    control: 'Archive a worker',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — two-step flow (L27480).',
      SUPERVISOR:
        'Allowed with conditions — two-step flow, own scope (L27480).',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'A TWO-STEP flow, and the two steps are two controls rather than one control with a confirmation: reassign the active and upcoming runs, then archive. The second stays disabled with the runs named while any remain, so the order is enforced by what is offered rather than by a warning. ABSENT for the other three.',
    effect:
      'Archives the record once no run is assigned. Open step executions close as abandoned with the reason "Worker departed." The record stays readable and reactivable.',
    sourceRef: 'L27480, FUNC-DOH-04-1.1.3 L27541, AC-DOH-04-10 L27611, L27443',
  },
  {
    id: 'reactivate-worker',
    control: 'Reactivate a departed worker',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — re-validation prompt mandatory (L27481).',
      SUPERVISOR:
        'Allowed with conditions — same condition (L27481).',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live on an archived record only, and the re-validation prompt is MANDATORY rather than offered: reactivation always leaves the prompt standing, and there is no control anywhere that reactivates without it. ABSENT for the other three.',
    effect:
      'Reactivates the prior record with history intact and raises the prompt asking which prior qualifications still apply. Nothing is silently re-trusted.',
    sourceRef: 'L27481, FUNC-DOH-04-1.1.4 L27542, AC-DOH-04-11 L27612',
  },
  {
    id: 'bulk-import-workers',
    control: 'Bulk import workers',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27482), tenant-wide.',
      SUPERVISOR:
        'Allowed with conditions — canonical template only (L27482).',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Tenant Admin and, from the canonical template only, for the Supervisor. One template exists and no mapping control is drawn for anybody: per-tenant column mapping is the client’s onboarding operation, outside the platform. ABSENT for the other three.',
    effect:
      'All-or-nothing per file. A file that fails validation on any row writes nothing at all, reports the row and the rule, and leaves every existing record untouched.',
    sourceRef: 'L27482, FUNC-DOH-04-1.2.1 L27550, TEST-DOH-04-F3 L27632, L26707',
  },
  {
    id: 'view-own-certification-alerts',
    control: 'View own certification alerts',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'allowed-with-conditions',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed (L27483), stated with no qualifying words.',
      SUPERVISOR:
        'Allowed (L27483), stated with no qualifying words.',
      QUALITY_MANAGER:
        'Allowed (L27483), stated with no qualifying words.',
      READONLY_AUDITOR:
        'Read-only (L27483).',
      WORKER:
        'Allowed with conditions — own certifications only (L27483). Met on the device, for the same two reasons as the own-record read.',
    },
    rendering:
      'The expiry ladder and its audiences render for four roles. The Worker’s own-certifications-only grant is the second cell in this matrix granting a Worker something and it renders on no screen, because the Worker holds no Hub route — the cost is stated rather than hidden.',
    effect:
      'A read of the four-stage ladder and who each stage reaches. No control here can remove or delay a stage, for any role, and none is drawn.',
    sourceRef: 'L27483, L27427, AC-28.4-02 L52774, AC-NFR-1105 L106864',
  },
  {
    id: 'read-clearance-corpus',
    control: 'Read the clearance corpus across time',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'read-only',
      SUPERVISOR: 'read-only',
      QUALITY_MANAGER: 'read-only',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN:
        'Read-only (L27484), tenant-wide.',
      SUPERVISOR:
        'Read-only — own scope (L27484).',
      QUALITY_MANAGER:
        'Read-only (L27484).',
      READONLY_AUDITOR:
        'Read-only (L27484).',
      WORKER:
        'Unavailable (L27484), stated bare. Unavailable is the source’s withholding token — no standing on the module in any scope, never merged with Explicitly prohibited (L10238) — and it is what withholds this whole module from the Worker.',
    },
    rendering:
      'READ-ONLY for four roles with the cause named, scope-filtered for the Supervisor, and UNAVAILABLE for the Worker — the only `Unavailable` cell in this whole matrix, and therefore the one cell that decides which roles the module rail offers this route to at all.',
    effect:
      'A read of every clearance with its full metadata. No control edits a recorded clearance, for any role: the corpus is evidence, and evidence that can be edited is not evidence.',
    sourceRef: 'L27484, FUNC-DOH-04-3.2.2 L27561, the clearance-register row of catalogue A, L26059',
  },
] as const satisfies readonly ControlMatrixRow[]

type MissingFromMatrix = Exclude<WorkerControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const TENANT_ROLE_ORDER = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly TenantRoleId[]

/**
 * The roles a control's own matrix row gives one of the named statuses to, in
 * registry order. Every `allowedRoles` list this module hands the policy
 * evaluator is derived here, so an affordance can never be driven by a
 * hand-written role list that has quietly diverged from the matrix beside it.
 */
export function rolesWithStatus(
  controlId: WorkerControlId,
  statuses: readonly ControlStatus[],
): readonly TenantRoleId[] {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) return []
  return TENANT_ROLE_ORDER.filter((roleId) => statuses.includes(row.status[roleId]))
}

export function statusFor(controlId: WorkerControlId, roleId: TenantRoleId): ControlStatus {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) throw new Error(`Unknown MOD-DOH-04 control: ${controlId}`)
  return row.status[roleId]
}

/** The two statuses that let a role ACT. `satisfies` rather than a type
 *  annotation: an annotation would widen these to the whole six-token union
 *  and let a prohibition token typecheck as an acting status. */
export const ACTING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
] as const satisfies readonly ControlStatus[]

/** The three statuses that let a role READ. Same shape, same reason. */
export const READING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
] as const satisfies readonly ControlStatus[]

/* ------------------------------------------------------------------ *
 * SB-DOH-016 (L27592) — the worker record renders four regions, and
 * one banner whose copy is fixed.
 * ------------------------------------------------------------------ */

/** Verbatim, and never reworded: AC-CMD-007 forbids rewording fixed copy. */
export const EXPIRED_BANNER_COPY =
  'One certification has expired. New assignment to runs requiring it is blocked. The current run may be completed.'

/**
 * The notify-only counterpart. Deliberately NOT a rewording of the banner
 * above: under notify-only there is no block, so the fixed copy would be
 * false, and paraphrasing fixed copy is forbidden. A separate, separately
 * labelled notice is the only honest way to carry both.
 */
export const NOTIFY_ONLY_EXPIRY_NOTICE =
  'Under the notify-only posture there is no block to clear. Assignment and execution proceed, the same events raise immediate notifications to the supervisor and the Quality Manager, and every one is flagged in the audit trail and in the Execution Summary. An expired qualification nonetheless remains a standing signal until it is resolved.'

export interface RecordRegion {
  readonly id: string
  readonly name: string
  readonly holds: string
}

export const RECORD_REGIONS = [
  {
    id: 'identity',
    name: 'Identity',
    holds:
      'Name, platform login, the worker_type label and the instruction-difficulty profile. The login is the LINK to an account another module owns; a worker with none is a worker on the register with no account anywhere, and the record says so rather than inventing one.',
  },
  {
    id: 'qualifications',
    name: 'Qualifications',
    holds:
      'Type, Area scope, certification date, entry date, expiry date and a state chip reading Valid, 14 days, 7 days, 1 day, Expired or Cleared. Cleared is the clearance showing through and is reachable only once its command has been applied on the device.',
  },
  {
    id: 'clearances',
    name: 'Clearances',
    holds:
      'A history with the granting role, the reason code, the free text, the grant time and the lapse time. Read-only, and no grant control is drawn on it for anybody — granting is a Client Command Center action.',
  },
  {
    id: 'activity',
    name: 'Activity',
    holds:
      'The active and upcoming runs, which is also the departure flow’s first step. Named references and nothing else: no completed-run history, no figure, no comparison — this is the object-state condition on archival, never a measure of the person.',
  },
] as const satisfies readonly RecordRegion[]

/* ------------------------------------------------------------------ *
 * The measurement register's own two rows for this module (L101533,
 * L101536), carried on screen because the prohibition they name is
 * this module's alone to break.
 * ------------------------------------------------------------------ */

export interface MeasureRule {
  readonly id: string
  readonly what: string
  readonly individualLevel: string
  readonly prohibitedUse: string
  readonly sourceRef: string
}

export const MEASURE_RULES = [
  {
    id: 'M-A4',
    what: 'Qualification state',
    individualLevel:
      'Allowed, and legitimately so: qualification is a property of a person and a safety control, so the record is inherently per-worker. This is the one place in the whole build where an individual-level measure is the correct answer.',
    prohibitedUse:
      'Using expiry frequency as a performance measure. Nothing on this screen counts how often a person’s certificates lapse, compares one person’s record with another’s, or ranks anybody — and no fixture behind it carries a field that could.',
    sourceRef: 'L101533, AC-SCHED-253 L101590',
  },
  {
    id: 'M-A5',
    what: 'Clearance frequency',
    individualLevel:
      'Explicitly prohibited. The data is cut by ROLE and by AREA and never by worker, because frequent clearances usually indicate a certification-planning failure rather than a worker failure, and the bias risk of re-cutting it per person is high.',
    prohibitedUse:
      'A per-worker cut and a per-worker ranking. The escalation that acts on this signal keys on the pairing of Area and Shift, and the function that answers it takes no worker at all.',
    sourceRef: 'L101536, AC-SCHED-254 L101591',
  },
] as const satisfies readonly MeasureRule[]

/* ------------------------------------------------------------------ *
 * Panels the per-module contract requires by name.
 * ------------------------------------------------------------------ */

export interface AbsentByRule {
  readonly label: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'A clearance-granting control anywhere in the Hub',
    note: 'Nothing is drawn on the clearance register for any role, the Quality Manager included. The Hub owns the clearance RECORD and its enforcement; granting is Client Command Center action number ten, and the catalogue that describes this screen says so in its own words — read-only in the Hub. What renders instead is the cross-surface handoff to the surface that grants, which is a different control with a different rule, and it never writes a clearance here.',
  },
  {
    label: 'A qualification-entry path reachable by a worker',
    note: 'Absent absolutely and by construction rather than by a permission check that could be reconfigured: no worker-role path reaches qualification entry, and the refusal is required to hold through every path including the mobile application and any programming interface. Self-attestation is not a control this build disables; it is a path this build does not have.',
  },
  {
    label: 'A create, edit or retire control for a certification type',
    note: 'Certification types are a seeded list and no line in the frozen source states who creates one, on which screen, under which module, or whether the platform seeds any. Inventing an administration screen for them would be the largest invented feature in this slice, so nothing is drawn and the silence is raised as a client blocker instead (D22).',
  },
  {
    label: 'A gate posture weaker than notify-only',
    note: 'Notify-only is the platform floor and no silent posture exists. The floor is held in the shape of the vocabulary rather than by a check this screen applies: the posture type has exactly two members, so there is no weaker value for a control to write and no control that could offer one. A disabled third option would imply a weaker posture exists somewhere, and it does not.',
  },
  {
    label: 'A control that removes, delays or disables an expiry warning stage',
    note: 'The four stages at 14, 7, 1 and 0 days always fire. A tenant may add EARLIER stages and may never remove or delay one, and this module holds that direction as an interface rather than as a warning: the only function that touches the ladder returns a strict superset of the mandatory four or a stated refusal, and no remove, delay or reorder function exists for anything to call.',
  },
  {
    label: 'A control that edits a recorded clearance',
    note: 'Prohibited for every role. The clearance corpus is the evidence that an exception was made, by whom, where and why; evidence that can be edited after the fact is not evidence. A clearance ends by lapsing at the end of its duration or by being superseded by a recertification, and both of those are recorded outcomes rather than edits.',
  },
  {
    label: 'Cell, Job and worker scoping of a qualification',
    note: 'Deferred beyond this version and no rule may depend on it, so nothing is drawn where it would sit — not even disabled, because a disabled control implies a roadmap promise the source has not made. A qualification scopes to Areas, which may sit under different Sites, and those are the only dimensions this module knows.',
  },
  {
    label: 'Any pace, ranking, productivity figure or comparison between workers',
    note: 'Absent in every state, and absent from the fixtures rather than merely from the screen. No record here holds a count of runs, a total, a rate, a duration of work, a score or a suitability figure; the run references on a record are the object-state condition on archival and are rendered as names rather than as a number. The escalation that acts on repeated exceptions keys on the pairing of Area and Shift, and the function answering it has no worker parameter at all.',
  },
  {
    label: 'A control that changes a signed-in person’s role or session role context',
    note: 'Absent on every surface by a categorical rule, and the view switcher above is not one: it re-renders seeded fixtures from a persona’s point of view, performs no product action, changes no business state and alters no audit actor.',
  },
] as const satisfies readonly AbsentByRule[]

export const UNSPECIFIED_IN_SOURCE = [
  'No CAUSE is stated for most refusing cells of this matrix. The frozen table at L27470-L27484 qualifies the Tenant Admin and Supervisor cells on most rows and both Worker grants, and gives the Quality Manager, the Read-only Auditor and the Worker the bare word `Explicitly prohibited` on every write row but one. Those cells carry the token and this note; the authority-split reading the screen states beside them — the role that may clear a block may not enter the certificate that creates one — is this build’s, and is labelled as one.',
  'Who creates a certification type, on which screen, under which module, and whether the platform seeds any at all. The source is entirely silent: certification types are referenced as configuration by every gate that reads one and are created by nobody. This build ships the seeded list the location module already holds and draws no administration screen, because an invented one would read back as a requirement (D22).',
  'Whether entering a FIRST qualification for an existing worker stays open in soft suspension. The source states that recertification stays open and that creation of new records is blocked, and says nothing about a first entry. This build reads it as a configuration write and therefore closed, because the one statement that mentions suspension at all attaches "remains open in soft suspension" to recertification alone and to nothing else — the stricter reading, recorded here rather than adopted silently.',
  'Whether a LAPSED clearance still occupies its Area and Shift for the second-clearance rule. This build counts it, because a lapse does not un-signal an Area and the rule exists to notice repetition rather than concurrency; the source states the rule without saying which clearances it ranges over.',
  'A permitted format for a worker name, and whether a platform login must be unique or present at all. The source fixes no length, no character set and no uniqueness rule, so this screen refuses only a blank name and permits a record with no login, rather than inventing a constraint.',
  'What the tenant-set clearance duration may range between. It is stated to be a tenant setting rather than a fixed per-shift expiry, and no minimum, maximum or default value is stated anywhere, so this screen refuses only a value that is not a positive whole number of days.',
  'Whether the fixed record banner belongs to the strict posture alone. Its copy states that new assignment is blocked, which is untrue under notify-only, and rewording fixed copy is forbidden. This build renders the fixed copy under strict and a separate, separately labelled notice under notify-only rather than paraphrasing either.',
  'How many earlier warning stages a tenant may add, and whether the platform caps them. The direction is fixed and the count is not.',
  'What answers the re-validation prompt. Re-employment is required to raise a prompt asking which prior qualifications still apply and to re-trust nothing silently, and the source names no control, no role and no screen that answers it. The prompt therefore stands on a reactivated record here and no answering control is drawn, because inventing one would be inventing the very act the requirement is careful not to describe.',
  'What happens to a worker record whose every qualification has lapsed and whose runs are all reassigned, short of departure. No intermediate state is named, so none is invented: the record simply holds no qualification in force.',
] as const satisfies readonly string[]

export const UNRESOLVED_IN_SOURCE = [
  'Whether a refused control renders ABSENT or DISABLED WITH A NAMED REASON. A source adjudication returned this INCONSISTENT AT NAMED-TEST STRENGTH: the general chapter and the role chapters state opposite rules, both backed by acceptance criteria, and two named tests assert opposite renderings of the same control for the same role. This build follows one rule and states it — DISABLED WITH ITS REASON exactly where the source’s own refusal names a different holder to route to (the three clearance handoffs for the Tenant Admin, and the never-held and second-in-Area handoffs for the Supervisor), and ABSENT everywhere else a role is prohibited. The reading is UNSETTLED, a slice-wide gate lands later and may change every module at once, and nothing here should be read as the question being closed.',
  '`Explicitly prohibited` carries NO rendering anywhere in the frozen source. It is a statement about authority, not about pixels. Every rendering choice on this screen is therefore a decision made here against the D8 mapping and is reported as one; no cell in the matrix below told this build how to draw it.',
  '`Unavailable` is overloaded in the source and the two senses are kept apart here. Role-level withholding of a whole module — the sense the one `Unavailable` cell in this matrix carries — renders nothing at all and is not reachable, and it is what decides which roles the module rail offers this route to. Transient state-based unavailability of an action a role DOES hold renders disabled with a reason. Merging them would either offer a route nobody may open or hide a control somebody holds.',
  'D9 against a dissenting reading. One census reader recorded that this module’s matrix contains no Tenant Admin row at all, which would have withheld qualification entry and recertification from the tenant’s own administrator. The matrix at the frozen source carries all five columns and gives the Tenant Admin `Allowed` on both. The dissent is recorded as an erratum and the Tenant Admin’s row is built.',
  'D16 — recertification is BLOCKED under hard suspension, and the consequence is the single most operationally dangerous silence in this slice. The hard-suspension pipeline is stated "exactly" and does not name recertification, so a certification expiring during a sixty-day hard suspension has NO renewal path at all — only substitution, which can strand a line. This build does not soften it and does not invent a renewal path. It is flagged for the client to settle.',
  'The clearance corpus is stated to be queryable from the Super Admin platform console to detect patterns across time, and the measurement register prohibits the individual-level cut of exactly that data. Both are in the frozen source. This build renders the corpus by Area and by role and never by worker, which honours the prohibition, and records that the console-side query is where a per-worker cut would first become possible.',
  'Whether the second-clearance rule counts a clearance that was superseded by a renewal. A superseded clearance ended because the exception stopped being needed rather than because it ran out, which is a different signal about the Area; the source distinguishes the two states without saying whether the escalation does.',
  'The Worker holds two grants in this matrix — their own record and their own certification alerts — while the surface decision withholds every Hub route from the Worker. The two cannot both be honoured. This build honours the surface decision and states the cost: a worker without a device in hand cannot check their own certification expiry, and meets their alerts on the device instead.',
] as const satisfies readonly string[]

export interface DecisionOnScreen {
  readonly ref: string
  readonly statement: string
}

export const DECISIONS_ON_SCREEN = [
  {
    ref: 'D7',
    statement:
      'A lost connection splits three ways: content already loaded degrades with a freshness marker and an as-of time, a read that fails outright names what failed and whether anything was written, and every write control disables with a named reason. Nothing here ever queues a write, because a queued clearance would be a safety control with no audit entry.',
  },
  {
    ref: 'D9',
    statement:
      'The Tenant Admin MAY enter a qualification and record a recertification. The matrix carries all five columns and gives the Tenant Admin `Allowed` on both rows; the reading that this module has no Tenant Admin row at all is recorded as an erratum, and the row is built.',
  },
  {
    ref: 'D10',
    statement:
      'The Tenant Admin may NOT grant a clearance of any kind, and the three handoffs render DISABLED WITH THE NAMED REASON rather than absent, because the controls exist on this same screen for the Supervisor and the Quality Manager. The tenant’s most privileged role sits deliberately outside the safety-exception path, and the disabled control is where the screen says why.',
  },
  {
    ref: 'D11',
    statement:
      'The Worker holds no Hub screen, so the two grants this matrix gives a Worker render nowhere. The cost is stated rather than hidden: a worker without a device in hand cannot check their own certification expiry.',
  },
  {
    ref: 'D16',
    statement:
      'Recertification is BLOCKED under hard suspension, and the consequence is stated on screen: a certification expiring during a sixty-day hard suspension then has no renewal path at all, only substitution, which can strand a line. It is flagged as a client decision rather than softened.',
  },
  {
    ref: 'D21',
    statement:
      'The module identity card governs the object vocabularies over the rivals elsewhere in the source: a Worker is active, archived or reactivated; a qualification runs the four warning stages as real states; a clearance is granted, active, lapsed or superseded by renewal. Cleared is the clearance showing through on the qualification chip and is not a seventh qualification state.',
  },
  {
    ref: 'D22',
    statement:
      'Certification types are a seeded fixture list with no create, edit or retire screen anywhere, raised as a client blocker. No line in the source states who creates one, so nothing is drawn rather than an administration screen invented.',
  },
  {
    ref: 'D23',
    statement:
      'The Hub builds the clearance REGISTER, read-only, with no grant control on it for anybody. Granting is Client Command Center action number ten. D23 and D10 govern different controls and both hold: D23 is the register, D10 is the cross-surface handoff that routes to where granting actually happens.',
  },
  {
    ref: 'D26',
    statement:
      'On-shift roster resolution and the marked-fallback flag are built here and no delivery is. Where nobody holding the target role is on shift the escalation falls back to the Quality Manager role and is marked as a fallback; that fallback target is itself a role which may be empty, which is a client decision rather than an engineering one.',
  },
] as const satisfies readonly DecisionOnScreen[]

/**
 * The moment the seeded register was last true. A literal: no clock is read
 * anywhere in this module, and a fixture's honesty comes from saying when it
 * was true rather than from looking current.
 */
export const REGISTER_AS_OF = '2026-08-19 06:20 Europe/London'

/** The default the gate settings open on. A tenant setting with no stated
 *  range anywhere in the source — see `UNSPECIFIED_IN_SOURCE`. */
export const DEFAULT_CLEARANCE_VALID_FOR_DAYS = 7

/** Read from the location module and never re-seeded here. Re-exported so the
 *  screen has one import for the certification vocabulary it renders. */
export { SEEDED_CERTIFICATION_TYPES }

/* ------------------------------------------------------------------ *
 * THE SCREEN'S PROSE AND SCREEN-STATE DATA. The sentences the screen
 * renders verbatim and the ten states it reaches, held where every
 * other sentence on this module is held: this file is where the prose
 * and the data live, and the screen is where they are drawn.
 * ------------------------------------------------------------------ */

/** The ten screen states this module reaches. See NEVER_APPLIES for the rest. */
export const APPLICABLE_STATES = [
  'STATE-01',
  'STATE-02',
  'STATE-03',
  'STATE-04',
  'STATE-05',
  'STATE-06',
  'STATE-08',
  'STATE-09',
  'STATE-12',
  'STATE-13',
] as const satisfies readonly ScreenStateId[]

export type ModuleStateId = (typeof APPLICABLE_STATES)[number]

export const NEVER_APPLIES: readonly { readonly id: ScreenStateId; readonly why: string }[] = [
  {
    id: 'STATE-07',
    why: 'Offline is frontline-only. This is a web surface with no offline mode; a lost connection splits three ways instead, and no write here is ever queued (D7).',
  },
  {
    id: 'STATE-10',
    why: 'No agent enters, edits, clears or expires a qualification. An agent may surface a pattern in the clearance corpus as a proposal, and the decision is a human one taken on another surface.',
  },
  {
    id: 'STATE-11',
    why: 'The same reason: the whole module functions unchanged with every agent paused, because the qualification gate is deterministic and lives on the device.',
  },
]

export const MODULE_STATE_NOTE: Readonly<Record<ModuleStateId, string>> = {
  'STATE-01':
    'an Area that holds no worker. Reachable from the Area filter above the register — Packing and Despatch is on the location tree, is bound to no Shift, and nobody is based there or qualified for it.',
  'STATE-02':
    'the register while it is being fetched: a skeleton of the eventual table, and never a zero-row grid, because an empty grid reads as "this workspace has nobody on the register" rather than "the rows have not arrived".',
  'STATE-03': 'the register, the worker record beneath it, and every panel below that.',
  'STATE-04':
    'the heaviest state on this screen, and it has three shapes. A recertification whose new expiry does not postdate the previous one is refused with the rule stated and NO partial record created. An instruction-difficulty value outside the three permitted levels is refused and the record is held incomplete and can receive no assignment. A warning stage that is not EARLIER than the platform ladder is refused naming the direction.',
  'STATE-05':
    'a persona meeting a control its role does not carry. Every refusal here is per control rather than at the door, because four of the five roles hold something on this module.',
  'STATE-06':
    'the whole module for the Read-only Auditor, and for every persona while the tenant state closes the writes. It is also the standing state of the clearance register for EVERY persona, which is D23 rather than a suspension. One banner, one cause.',
  'STATE-08':
    'the register served from the last load with a freshness marker and an as-of time, while the connection is down (D7).',
  'STATE-09':
    'a clearance that has been granted and whose command has not been applied on the device. It renders in its TRUE command state and never as applied, never as effective, and the qualification it covers keeps reading Expired until the device acknowledges it.',
  'STATE-12':
    'a read that failed outright, naming what failed and whether anything was written. Every write control disables rather than queues — a queued clearance would be a safety control with no audit entry.',
  'STATE-13':
    'reconnection. The tenant state is refetched BEFORE any write control is re-enabled, so a recertification is never re-offered against a suspension state that may have changed while the connection was down.',
}

/**
 * Why the whole module is read-only, per tenant state. A `Record` rather than
 * a conditional ladder: the compiler refuses a missing key, so a sixth tenant
 * state cannot arrive and silently name no cause at all. `null` means this
 * state is not read-only as a whole — `soft-suspended` is deliberately `null`,
 * because it is the one state that closes some of this module's writes and
 * leaves others open, and a module-wide banner would be a coarser and falser
 * statement than the per-control refusals already on the screen.
 */
/**
 * What the state boundary is TOLD, per state. Seven of the ten arms of the
 * screen's `stateTreatment` were one `<ScreenStateBoundary>` apiece differing
 * only in this payload — a data table wearing a `switch` — so the table is
 * held here as one, beside the note each state carries above. The three that
 * are missing are the three that are not a boundary: STATE-03 and STATE-06 are
 * prose, and STATE-05 carries a `PermissionDecision` the evaluator returns at
 * render time, which no constant can hold. A `Record` rather than a lookup
 * with a fallback: the compiler refuses a missing key, so an eleventh
 * applicable state cannot arrive and silently draw the default treatment.
 */
export const MODULE_STATE_DETAIL: Readonly<
  Record<Exclude<ModuleStateId, 'STATE-03' | 'STATE-05' | 'STATE-06'>, ScreenStateDetail>
> = {
  'STATE-01': {
    objectLabel: 'workers based in or qualified for this Area',
    whatCreatesIt:
      'A Tenant Admin or a Supervisor records one, or imports a file. Select Packing and Despatch in the Area filter above to see it — nobody is based there and no qualification scopes to it.',
  },
  'STATE-02': { objectLabel: 'this workspace’s worker register' },
  'STATE-04': {
    fieldLabel: 'A recertification expiry, an instruction-difficulty level, a warning stage',
    rule: 'A new expiry must postdate the one it replaces; a difficulty level must be one of three; a tenant warning stage must be EARLIER than the platform ladder.',
    permittedFormat:
      'Set a new expiry earlier than the current one in the record below to see the refusal state the rule and write nothing at all — no partial record is created, and the existing qualification state stands exactly as it was.',
  },
  'STATE-08': {
    asOfLabel: `as of ${REGISTER_AS_OF}`,
    originLabel:
      'the last register loaded before the connection dropped, with every write control disabled rather than queued',
  },
  'STATE-09': { commandState: 'queued' },
  'STATE-12': {
    failureWhat: 'The read of this workspace’s worker register failed.',
    wasWritten: false,
    nextStep:
      'The rows above are the last that loaded. Every write control is disabled rather than queued while the connection is down, so nothing is waiting to be sent.',
  },
  'STATE-13': {
    recoveryProgress:
      'Reconnected. The tenant state is being refetched BEFORE any write control is re-enabled — a recertification offered against a stale suspension state is a write the gate never actually saw. The register stays marked as the last loaded until the refetch lands.',
  },
}

export const READ_ONLY_CAUSE: Readonly<Record<TenantState, string | null>> = {
  active: null,
  'soft-suspended': null,
  'hard-suspended':
    'Hard suspension holds this workspace read-only: only the enumerated completion pipeline stays open, and neither recertification nor a clearance is in it. In-flight work may be completed and closed; nothing on this record may be changed.',
  'compliance-suspended':
    'Compliance suspension blocks every login in this workspace, so no signed-in person remains to enter a qualification or clear a block.',
  archived:
    'The workspace is closed. The source states no open write class for a closed tenant, and the stricter interpretation applies in that silence.',
}

/** D7's own sentence for a Hub write meeting a lost connection. */
export const CONNECTION_LOST_REASON =
  'The connection to this workspace’s own records is lost. The register above degrades to the last loaded rows with a freshness marker, and every write control here disables rather than queues — never queued, in any state, because a queued clearance would be a safety control with no audit entry (D7).'

/** D16, stated where it binds rather than only in the panel below. */
export const HARD_SUSPENSION_RECERTIFICATION_CONSEQUENCE =
  ' D16, and the consequence is stated rather than softened: a certification that expires during a sixty-day hard suspension then has NO renewal path at all — only substitution, which can strand a line. This build invents no renewal path and flags the silence as a client decision.'

/**
 * The house rule for a refusal, stated once and applied by rule rather than by
 * taste. DISABLED WITH ITS REASON exactly where the source's own refusal names
 * a different holder to route to; ABSENT everywhere else. The reading is
 * unsettled at the source and is recorded in `UNRESOLVED_IN_SOURCE`.
 */
export const ABSENT_NOTE_SUFFIX =
  ' Whether a refused control of this shape should render as nothing at all or as a control disabled with its reason is UNSETTLED in the frozen source — two named tests assert opposite renderings of one control for one role. This build renders it absent and records the question below rather than closing it here.'

/**
 * THE SENTENCE EACH WRITE RECORDS. Audit is written in the same transaction as
 * the action it describes, so every write control on this screen commits one
 * of these — and each sat inside its handler, three to eight lines of copy
 * between the guard and the mutation it belongs to. Held here, a handler reads
 * as its mutation and looks its sentence up.
 *
 * Each takes the record or the value the handler already has, so nothing below
 * re-derives a fact the screen computed, and the names and labels resolve
 * through the same helpers the register renders with. There are TEN, one per
 * handler that commits: the twelve write controls are ten handlers because the
 * three clearance handoffs share one.
 */
export const AUDIT_SENTENCE = {
  createWorker: (created: Worker) =>
    `${created.name} was added to the register with their own platform identity and recorded with the audit entry in the same transaction as the change. Supervisor permission alone authorises a worker-record change and the audit trail is the control rather than a second approval — a design decision the source states outright, not an omission.`,
  enterQualification: (created: Qualification, workerName: string) =>
    `${certificationLabelFor(created.certificationId)} was entered against ${workerName}, scoped to ${created.areaIds.map(areaNameFor).join(', ')}, with a certification date of ${created.certificationDate} and an entry date of ${created.entryDate}, and recorded with its audit entry in the same transaction. Both dates are on the record, so a late entry shows as a late entry rather than as a compliance gap. Self-attestation was impossible: no worker-role path reaches this control on any surface.`,
  recordRecertification: (
    target: Qualification,
    newExpiry: string,
    certificationDate: string,
    entryDate: string,
  ) =>
    `The ${certificationLabelFor(target.certificationId)} qualification was recertified: its expiry moved from ${target.expiryDate} to ${newExpiry}, which postdates it, with a certification date of ${certificationDate} and an entry date of ${entryDate} both recorded. Recording the renewal lifts any active block immediately, delivered at the device's next sync, and the record and its audit entry were written in one transaction.`,
  setInstructionDifficulty: (target: Worker, value: InstructionDifficulty | null) =>
    `The instruction-difficulty profile on ${target.name} is now ${value ?? 'unset'}, recorded with its audit entry in the same transaction as the change. It selects which work-instruction variant they receive at execution and reaches the device in the next work package; an in-flight run keeps the level pinned in its own package.`,
  reassignRuns: (target: Worker) =>
    `The runs assigned to ${target.name} — ${[...target.activeRunIds, ...target.upcomingRunIds].join(', ')} — were reassigned, and the open step executions closed as abandoned with the recorded reason "Worker departed." This is step one of the two-step flow; archival is what step two does, and it is offered only now that no run is in the way.`,
  archiveWorker: (target: Worker) =>
    `${target.name} was archived and recorded with the audit entry in the same transaction as the change. The record stays in the register and its history stays intact: a re-employment reactivates this record rather than creating a second one.`,
  reactivateWorker: (target: Worker) =>
    `${target.name} was reactivated with their prior record and history intact, and the mandatory re-validation prompt now stands against every prior qualification. Nothing is silently re-trusted: the prompt is not an option this control offered, it is a condition of reactivation.`,
  importWorkers: (file: ImportFile, created: readonly Worker[]) =>
    `${file.fileName} was imported from the single canonical template and every row landed together: ${created.map((w) => w.name).join(', ')}. The import is all-or-nothing per file, so a file with one bad row writes nothing at all rather than most of itself.`,
  saveGateSettings: (
    nextPosture: GatePosture,
    durationValue: number,
    nextLadder: readonly number[],
  ) =>
    `The qualification gate now applies the ${nextPosture} posture, a granted clearance runs for ${durationValue} days before it lapses, and the warning ladder is ${nextLadder.join(', ')} days before expiry. The four mandatory stages always fire: a tenant may add earlier ones and may never remove or delay one, and no control anywhere here can take the posture below the ${GATE_POSTURE_FLOOR} floor.`,
  takeHandoff: (what: string, effectiveHandoffAreaId: string, effectiveHandoffShiftId: string) =>
    `The ${what} handoff was taken for ${areaNameFor(effectiveHandoffAreaId)} on ${shiftNameFor(effectiveHandoffShiftId)}, and the routing was recorded with its audit entry in the same transaction. NOTHING WAS GRANTED: the Hub owns the clearance record and its enforcement and mints no grant control anywhere, and this storyboard reaches no Client Command Center, so no clearance exists and none will ever render as applied.`,
} as const
