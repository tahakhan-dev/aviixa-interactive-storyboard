/**
 * MOD-DOH-06's seeded runs. Six of them, each one there to make a named
 * behaviour visible rather than to fill a board.
 *
 * DETERMINISM. Every instant below is `BOARD_NOW_MS` plus or minus a literal
 * offset, and `BOARD_NOW_MS` is derived from `CANONICAL_EPOCH_MS`. Nothing
 * here reads `Date.now()`, and the screen drives the evaluator through a
 * `fixedClock`, so the board renders the same rows on every run.
 *
 * SCOPE, AND WHY IT IS RESTATED HERE RATHER THAN READ.
 *
 * The seeded Areas and the per-role Area scope belong to MOD-DOH-02 and live
 * in `app/hub/location-configuration/fixtures`. This file READ them there
 * first, and that import was a defect: `src/` may not value-import from
 * `app/`, and doing so broke both reach generators and `pnpm build:registries`
 * for every agent in the wave. A fixture is not a reason to invert the
 * dependency, and the right fix is to lift the seeded location register into
 * `src/` so `app/` reads it from there — which is another module's file and
 * another task's edit. RECORDED AS DEBT in `LOCATION_SCOPE_DEBT` below.
 *
 * What is restated is the minimum this module needs — three Area names and
 * five Area-scope lists — and every id and name below is the location
 * module's own, so the two cannot disagree about which Area is which without
 * the unit suite noticing.
 *
 * `RUN-2026-03-04-C` sits in `AREA-ARD-PACK`, which the seeded Supervisor
 * scope does NOT contain — so the Supervisor's board is genuinely shorter
 * than the Quality Manager's, and the difference is in what the screen READS
 * rather than in what it draws. That is slice-4 defect 7, and the Area bound
 * on cancellation (L27870) is the row that would leak if it were not.
 */
import { CANONICAL_EPOCH_MS, fixedClock, type Clock } from '@/domain/clock'
import { tenantId } from '@/domain/ids'
import { FINISH_WINDOW_DEFAULT_MS, type RunTimingFacts } from '@/surfaces/doh/transitions'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import type { RunBoardRow } from './matrix'

/* ── the location scope this module reads, restated rather than imported ── */

/** Every seeded Area of the canonical tenant, in the location module's order. */
const ALL_AREA_IDS = [
  'AREA-ARD-ASSY',
  'AREA-ARD-PAINT',
  'AREA-ARD-PACK',
  'AREA-ARD-POLISH',
  'AREA-ARD-QC',
  'AREA-ARD-STORE',
] as const

/** The three this module's runs sit in. Names are the location module's own. */
const AREA_NAMES: Readonly<Record<string, string>> = {
  'AREA-ARD-ASSY': 'Assembly Hall',
  'AREA-ARD-PAINT': 'Paint Line',
  'AREA-ARD-PACK': 'Packing and Despatch',
}

/**
 * The seeded per-role Area scope. The Worker's is empty, and that is the
 * location module's own answer rather than this one's: no Hub scope at all,
 * because the Worker holds no Hub screen (D11).
 */
const AREA_SCOPE: Readonly<Record<TenantRoleId, readonly string[]>> = {
  TENANT_ADMIN: ALL_AREA_IDS,
  SUPERVISOR: ['AREA-ARD-PAINT', 'AREA-ARD-ASSY'],
  QUALITY_MANAGER: [
    'AREA-ARD-ASSY',
    'AREA-ARD-PAINT',
    'AREA-ARD-PACK',
    'AREA-ARD-POLISH',
    'AREA-ARD-QC',
  ],
  READONLY_AUDITOR: ALL_AREA_IDS,
  WORKER: [],
}

/**
 * The debt this restatement is, stated rather than left for a reviewer to
 * find. It is reported to the controller with the module-registry gap.
 */
export const LOCATION_SCOPE_DEBT = {
  what: 'The seeded Areas and per-role Area scope are restated here instead of read from MOD-DOH-02.',
  why: '`src/` may not value-import from `app/`, and MOD-DOH-02’s seed lives in `app/hub/location-configuration/fixtures`.',
  fix: 'Lift the seeded location register into `src/` and have `app/hub/location-configuration` read it from there. Another module’s file; reported, not edited here.',
} as const

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const HUB_TENANT_ID = tenantId('TEN-BRIGHTBIKES')

/**
 * Wednesday 4 March 2026, 06:00 UTC — two days into the canonical story, so
 * that runs exist both behind and ahead of the board's own instant.
 */
export const BOARD_NOW_MS = CANONICAL_EPOCH_MS + 2 * DAY

/** §4.6.2, L27862: "a visibility horizon of today plus 7 days". */
export const HORIZON_DAYS = 7
export const HORIZON_END_MS = BOARD_NOW_MS + HORIZON_DAYS * DAY

/** The board's clock. A fixture value, never ambient time. */
export function boardClock(): Clock {
  return fixedClock(BOARD_NOW_MS)
}

/** The board's own instant, as a literal. Nothing formats it from the number. */
export const BOARD_NOW_LABEL = '2026-03-04 06:00 UTC'

/**
 * AN INSTANT, RELATIVE TO THE BOARD'S OWN. Integer arithmetic and nothing
 * else: `app/hub/**` may hold no `Date.now()`, no `new Date()` and no
 * `Math.random()` — one regex over every file under it, and a screen that
 * built an ISO string from an epoch would trip it. So the formatting lives
 * here, beside the instants it formats, and the screen renders the phrase.
 *
 * A relative phrase is also the right thing for an oversight board to show.
 * "Fell due 45 minutes ago" is what a Supervisor needs off a schedule; the
 * absolute stamp belongs on the record, and the seeded runs carry theirs as
 * a literal.
 */
export function relativeToBoard(ms: number): string {
  const delta = ms - BOARD_NOW_MS
  const abs = Math.abs(delta)
  const [value, unit] =
    abs < HOUR
      ? [Math.round(abs / MINUTE), 'minute']
      : abs < DAY
        ? [Math.round(abs / HOUR), 'hour']
        : [Math.round(abs / DAY), 'day']
  const plural = value === 1 ? unit : `${unit}s`
  if (value === 0) return 'now'
  return delta < 0 ? `${value} ${plural} ago` : `in ${value} ${plural}`
}

function areaName(id: string): string {
  return AREA_NAMES[id] ?? id
}

function facts(
  runId: string,
  over: Partial<Omit<RunTimingFacts, 'runId' | 'tenant'>>,
): RunTimingFacts {
  return {
    runId,
    tenant: HUB_TENANT_ID,
    scheduledStartMs: BOARD_NOW_MS,
    startedAtMs: null,
    cancelledAtMs: null,
    completeAtMs: null,
    finishedAtMs: null,
    finishWindowMs: FINISH_WINDOW_DEFAULT_MS,
    ...over,
  }
}

export const SEEDED_RUNS = [
  /* 1. Scheduled, inside the horizon, and NOT READY — the pin is written and
   *    the package never downloaded. WF-AUT-010's failure path, L53675:
   *    "a run with a pin but no package must never begin". */
  {
    facts: facts('RUN-2026-03-06-A', { scheduledStartMs: BOARD_NOW_MS + 2 * DAY }),
    jobName: 'Frame weld inspection',
    areaId: 'AREA-ARD-ASSY',
    areaName: areaName('AREA-ARD-ASSY'),
    shiftName: 'Morning',
    plannedQuantity: 120,
    packagePin: 'WF-FRAME-WELD v2.1.0',
    packageOnDevice: false,
    workerHandoffs: [
      { workerId: 'WKR-014', name: 'Maya Ferrer', handedOffAtMs: null },
      { workerId: 'WKR-021', name: 'Tomas Lund', handedOffAtMs: null },
    ],
    devicesSynced: 0,
    summaryComputedAtMs: null,
    manuallyClosedAtMs: null,
  },

  /* 2. NO-SHOW. Scheduled an hour ago and never started, so both L27868
   *    timers have fallen due: the supervisor alert at +15 and the
   *    auto-cancellation at +30. This is the run that contradicts the
   *    "one automatic transition" claim. */
  {
    facts: facts('RUN-2026-03-04-B', { scheduledStartMs: BOARD_NOW_MS - HOUR }),
    jobName: 'Paint booth changeover',
    areaId: 'AREA-ARD-PAINT',
    areaName: areaName('AREA-ARD-PAINT'),
    shiftName: 'Morning',
    plannedQuantity: 40,
    packagePin: 'WF-PAINT-CHANGE v1.4.0',
    packageOnDevice: true,
    workerHandoffs: [{ workerId: 'WKR-033', name: 'Ines Roca', handedOffAtMs: null }],
    devicesSynced: 0,
    summaryComputedAtMs: null,
    manuallyClosedAtMs: null,
  },

  /* 3. THE THREE-WORKER RUN, and the whole reason DEC-RUNSTATE-001 matters.
   *    Two of three workers have handed in their part. Reading A has this run
   *    passing through `submitted` THREE times and it has reached it twice;
   *    Readings B and C have it reaching a run-level `submitted` once, and
   *    have not reached it. Three answers, at one instant, for one run.
   *
   *    It sits in AREA-ARD-PACK, outside the seeded Supervisor scope. */
  {
    facts: facts('RUN-2026-03-04-C', {
      scheduledStartMs: BOARD_NOW_MS - 6 * HOUR,
      startedAtMs: BOARD_NOW_MS - 6 * HOUR,
    }),
    jobName: 'Packing line audit',
    areaId: 'AREA-ARD-PACK',
    areaName: areaName('AREA-ARD-PACK'),
    shiftName: 'Morning',
    plannedQuantity: 300,
    packagePin: 'WF-PACK-AUDIT v3.0.2',
    packageOnDevice: true,
    workerHandoffs: [
      { workerId: 'WKR-007', name: 'Dara Okafor', handedOffAtMs: BOARD_NOW_MS - 90 * MINUTE },
      { workerId: 'WKR-012', name: 'Ravi Menon', handedOffAtMs: BOARD_NOW_MS - 40 * MINUTE },
      { workerId: 'WKR-019', name: 'Sofia Bianchi', handedOffAtMs: null },
    ],
    devicesSynced: 2,
    summaryComputedAtMs: null,
    manuallyClosedAtMs: null,
  },

  /* 4. INSIDE THE FINISH WINDOW. Every worker in, every device synced, the
   *    Summary computed. All three readings now say the same WORD — and they
   *    still disagree about how many times `submitted` was reached, which is
   *    the half of the decision a board that only rendered the current word
   *    would hide. Late captures fold in here, flagged. */
  {
    facts: facts('RUN-2026-03-03-D', {
      scheduledStartMs: BOARD_NOW_MS - DAY,
      startedAtMs: BOARD_NOW_MS - DAY,
      completeAtMs: BOARD_NOW_MS - 6 * HOUR,
    }),
    jobName: 'Wheel true and torque check',
    areaId: 'AREA-ARD-ASSY',
    areaName: areaName('AREA-ARD-ASSY'),
    shiftName: 'Night',
    plannedQuantity: 90,
    packagePin: 'WF-WHEEL-TRUE v5.2.1',
    packageOnDevice: true,
    workerHandoffs: [
      { workerId: 'WKR-014', name: 'Maya Ferrer', handedOffAtMs: BOARD_NOW_MS - 7 * HOUR },
      { workerId: 'WKR-021', name: 'Tomas Lund', handedOffAtMs: BOARD_NOW_MS - 7 * HOUR },
    ],
    devicesSynced: 2,
    summaryComputedAtMs: BOARD_NOW_MS - 6 * HOUR,
    manuallyClosedAtMs: null,
  },

  /* 5. FINISHED. The window opened three days ago on a 48-hour setting, so it
   *    elapsed a day back and `run-auto-close` has fallen due. `finished` is
   *    reached the ONLY way AC-RUN-002 (L7126) permits, and a capture arriving
   *    now is rejected rather than flagged. */
  {
    facts: facts('RUN-2026-03-01-E', {
      scheduledStartMs: BOARD_NOW_MS - 4 * DAY,
      startedAtMs: BOARD_NOW_MS - 4 * DAY,
      completeAtMs: BOARD_NOW_MS - 3 * DAY,
    }),
    jobName: 'Brake cable routing',
    areaId: 'AREA-ARD-ASSY',
    areaName: areaName('AREA-ARD-ASSY'),
    shiftName: 'Morning',
    plannedQuantity: 60,
    packagePin: 'WF-BRAKE-ROUTE v1.9.0',
    packageOnDevice: true,
    workerHandoffs: [
      { workerId: 'WKR-033', name: 'Ines Roca', handedOffAtMs: BOARD_NOW_MS - 3 * DAY - HOUR },
    ],
    devicesSynced: 1,
    summaryComputedAtMs: BOARD_NOW_MS - 3 * DAY,
    manuallyClosedAtMs: null,
  },

  /* 6. THE STUCK RUN, CLOSED BY HAND — DEC-STUCK-001 on the screen.
   *
   *    Sofia's tablet went off the network on Friday afternoon and never came
   *    back. A Supervisor closed the run four hours ago.
   *
   *    WHY `completeAtMs` IS SET HERE AND WHY THAT IS NOT READING A. In wave
   *    0's shape `completeAtMs` has exactly one consumer:
   *    `finishWindowEndsAtMs`, which adds the window to it. Setting it to the
   *    close instant therefore records the FINISH CLOCK ANCHOR — "finishes on
   *    the same clock" — which is the half BOTH readings share and the only
   *    half AC-RUN-004 (L7128) permits this build to assert. It is not a
   *    claim that the run stands `complete`: `stateIsGovernedByDecStuck`
   *    stops this row being handed to `runStateReadings` at all, and the
   *    screen renders the decision instead of a state.
   *
   *    `summaryComputedAtMs` is null because no Summary has been computed in
   *    this fixture. Whether one SHOULD have been is the decision itself:
   *    Reading A puts it in the Quality Manager's queue this morning, Reading
   *    B does not, and the screen says so rather than seeding an answer. */
  {
    facts: facts('RUN-2026-03-02-F', {
      scheduledStartMs: BOARD_NOW_MS - 10 * HOUR,
      startedAtMs: BOARD_NOW_MS - 10 * HOUR,
      completeAtMs: BOARD_NOW_MS - 4 * HOUR,
    }),
    jobName: 'Decal application',
    areaId: 'AREA-ARD-PAINT',
    areaName: areaName('AREA-ARD-PAINT'),
    shiftName: 'Afternoon',
    plannedQuantity: 75,
    packagePin: 'WF-DECAL v2.0.0',
    packageOnDevice: true,
    workerHandoffs: [
      { workerId: 'WKR-007', name: 'Dara Okafor', handedOffAtMs: BOARD_NOW_MS - 5 * HOUR },
      { workerId: 'WKR-019', name: 'Sofia Bianchi', handedOffAtMs: null },
    ],
    devicesSynced: 1,
    summaryComputedAtMs: null,
    manuallyClosedAtMs: BOARD_NOW_MS - 4 * HOUR,
  },
] as const satisfies readonly RunBoardRow[]

/**
 * THE READ, BOUNDED BY SCOPE — computed once and read by the board, the
 * filters and the run detail alike.
 *
 * The Supervisor is Area-scoped (L27870 bounds their cancellation authority to
 * their own Area, and L27910 makes their whole schedule view "role-scoped"),
 * so a run in an Area outside their scope is not in the list at all. It is not
 * listed with its controls removed: taking a button off a screen does not stop
 * anyone, and a run the Supervisor may not act on is a run they were never
 * shown.
 */
export function runsInScope(role: TenantRoleId): readonly RunBoardRow[] {
  const areas = AREA_SCOPE[role]
  return SEEDED_RUNS.filter((r) => areas.includes(r.areaId))
}

/** §4.6.2's horizon: today through today plus 7 days, on the scheduled start. */
export function withinHorizon(row: RunBoardRow): boolean {
  return row.facts.scheduledStartMs >= BOARD_NOW_MS - DAY && row.facts.scheduledStartMs <= HORIZON_END_MS
}

export { DAY, HOUR, MINUTE }
