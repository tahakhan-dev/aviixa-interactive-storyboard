import type { DecisionReading } from '@/disclosure/decisions'
import { CAPTURE_STATE_LABEL, captureStateLine, type CaptureState } from '@/frontline/capture'
import {
  functionalitiesNamingNoPattern,
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'
import { flDestinationBySlug } from '@/frontline/screens'
import {
  A2_CARD,
  A2_RUN_STATES,
  COMPLETION_CLAIM_NEVER_MADE,
  NO_PACE_NO_TIMER_NO_RANKING,
  RUN_COMPLETION_WORDS,
  SB_FL_011,
  type A2RunState,
} from './charter'
import { A2_COLUMNS, A2_MATRIX } from './matrix'

/**
 * `MOD-FL-A2`'s OWN LOGIC AND VOCABULARY. Everything shared with the other
 * eleven modules is consumed from `@/frontline/*` and re-derived nowhere.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO.
 *
 * It does not call `evaluateFrontlineAccess`. The matrix is the authority
 * for what draws on this destination and `frontlineAffordance` is the fold
 * that reads it; a second evaluator answering the same question would be a
 * second spelling of one ruling.
 *
 * It does not write a sync vocabulary. Rows 6 and 7 of the matrix are the
 * sync surface on this screen and the engine behind them is `MOD-FL-A6`'s.
 * What this module renders comes from wave 0's capture ladder —
 * `CAPTURE_STATE_LABEL` and `captureStateLine` in `@/frontline/capture` —
 * and from nothing this file invents. `MOD-FL-A6`'s own module directory is
 * a concurrent task's path and is not imported: the shared vocabulary is
 * wave 0's file, which is the whole reason wave 0 wrote one.
 *
 * IT NAMES NO PACE, NO TIMER, NO COUNTDOWN AND NO RANKING. `EXCL-FL-08`
 * (L39491) is an Invariant exclusion and `AC-FL-000-5` (L39100) is
 * categorical across every state of every screen. The one place any of
 * those words appears below is inside a quoted candidate reading of
 * `DEC-PARK-001`, carried verbatim from L41682 with its own locator,
 * because a decision disclosure that paraphrases its alternatives has
 * stopped being a disclosure. `SOURCE_QUOTED_HAZARD_WORDS` records that
 * exactly once and the covering suite proves the quotation really is at the
 * line it names.
 */

/* ==================================================================== *
 * THE ELEVEN FUNCTIONALITIES, AND `AC-FL-011-1`.
 *
 * `AC-FL-011-1` (L40151): "Every functionality in this chapter names at
 * least one `FB-FL-*` pattern." Eleven `FUNC-A2-*` identifiers are
 * enumerated at L40427-L40447 under four features and eight sub-features,
 * and each one's own Fallback clause is transcribed below verbatim with the
 * backticks stripped — so the criterion is asked of the source's words
 * rather than of a summary of them.
 * ==================================================================== */

export interface A2Functionality {
  readonly id: string
  /** The feature this functionality sits under, with its own line. */
  readonly feature: string
  /** The functionality's own opening sentence, verbatim. */
  readonly statement: string
  /** The functionality's own Fallback clause, verbatim, backticks stripped. */
  readonly fallbackClause: string
  /** The `FB-FL-*` identifiers that clause names. Empty where it names none. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

export const A2_FUNCTIONALITIES = [
  {
    id: 'FUNC-A2-01-1-1',
    feature: 'FEAT-A2-01 Assignment-sourced list with no allocation · L40425',
    statement:
      'Group assigned work as Jobs with their Runs beneath them where runs exist, and as the job ' +
      'alone where the job is one continuous operation.',
    fallbackClause: 'Fallback: FB-FL-CORE-01.',
    patterns: ['FB-FL-CORE-01'],
    sourceRef: 'L40427',
  },
  {
    id: 'FUNC-A2-01-1-2',
    feature: 'FEAT-A2-01 Assignment-sourced list with no allocation · L40425',
    statement: 'Refuse any interface for claiming unassigned work.',
    fallbackClause: 'Fallback: Not applicable — an absent capability has no failure mode.',
    patterns: [],
    sourceRef: 'L40428',
  },
  {
    id: 'FUNC-A2-02-1-1',
    feature: 'FEAT-A2-02 Honest package readiness with two delivery paths · L40429',
    statement:
      "Pre-sync packages for the shift's known Runs while the device has connectivity.",
    fallbackClause: 'Fallback: FB-FL-PKG-01.',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'L40431',
  },
  {
    id: 'FUNC-A2-02-2-1',
    feature: 'FEAT-A2-02 Honest package readiness with two delivery paths · L40429',
    statement:
      "Download a mid-shift assignment's package when the device is next connected.",
    fallbackClause: 'Fallback: FB-FL-PKG-01.',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'L40433',
  },
  {
    id: 'FUNC-A2-02-3-1',
    feature: 'FEAT-A2-02 Honest package readiness with two delivery paths · L40429',
    statement:
      'Show a Run as not-yet-ready rather than silently missing until its package has arrived; show ' +
      'it as ready and enterable once staged.',
    fallbackClause: 'Fallback: FB-FL-PKG-01.',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'L40435',
  },
  {
    id: 'FUNC-A2-03-1-1',
    feature: 'FEAT-A2-03 Determining the active Run · L40436',
    statement: 'Let the worker select a ready Run from their own assignments.',
    fallbackClause: 'Fallback: FB-FL-CORE-01.',
    patterns: ['FB-FL-CORE-01'],
    sourceRef: 'L40438',
  },
  {
    id: 'FUNC-A2-03-2-1',
    feature: 'FEAT-A2-03 Determining the active Run · L40436',
    statement:
      'Where the tenant runs scheduled operations, surface the current operation the Job\'s schedule ' +
      'designates.',
    fallbackClause: 'Fallback: FB-FL-PKG-01.',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'L40440',
  },
  {
    id: 'FUNC-A2-04-1-1',
    feature: 'FEAT-A2-04 The persistent honest sync indicator · L40441',
    statement:
      'Render online or offline state, last-synced time, and a pending-captures count, persistently, ' +
      'here and throughout the application.',
    fallbackClause:
      'Fallback: Not applicable — the indicator is the honest rendering of failure, so it has no ' +
      'fallback of its own.',
    patterns: [],
    sourceRef: 'L40443',
  },
  {
    id: 'FUNC-A2-04-1-2',
    feature: 'FEAT-A2-04 The persistent honest sync indicator · L40441',
    statement: 'Never hide state and never imply a sync that has not happened.',
    fallbackClause: 'Fallback: Not applicable — same reason.',
    patterns: [],
    sourceRef: 'L40444',
  },
  {
    id: 'FUNC-A2-04-2-1',
    feature: 'FEAT-A2-04 The persistent honest sync indicator · L40441',
    statement:
      'List pending items by their distinct capture states rather than as one undifferentiated ' +
      '"synced" figure.',
    fallbackClause: 'Fallback: FB-FL-UP-01.',
    patterns: ['FB-FL-UP-01'],
    sourceRef: 'L40446',
  },
  {
    id: 'FUNC-A2-04-2-2',
    feature: 'FEAT-A2-04 The persistent honest sync indicator · L40441',
    statement: 'Offer a manual sync control as a convenience only, never as a dependency.',
    fallbackClause: 'Fallback: FB-FL-CORE-01.',
    patterns: ['FB-FL-CORE-01'],
    sourceRef: 'L40447',
  },
] as const satisfies readonly A2Functionality[]

/**
 * `AC-FL-011-1` ASKED, AND THE ANSWER IS NOT EMPTY. Wave 0's
 * `functionalitiesNamingNoPattern` is the one place that rule lives, and run
 * over this module's eleven it returns THREE identifiers, each on a ground
 * the source itself gives:
 *
 *  - `FUNC-A2-01-1-2` (L40428) — "an absent capability has no failure mode";
 *  - `FUNC-A2-04-1-1` (L40443) — "the indicator is the honest rendering of
 *    failure, so it has no fallback of its own";
 *  - `FUNC-A2-04-1-2` (L40444) — "same reason", inheriting the one above.
 *
 * NOTHING IS ASSIGNED TO CLOSE THEM. An assigned pattern is
 * indistinguishable from a real one forever afterwards, and the criterion
 * then reads clean because nobody looked. Wave 1's four modules reported
 * twelve such gaps between them; these are this module's three.
 */
export const A2_FUNCTIONALITIES_NAMING_NO_PATTERN =
  functionalitiesNamingNoPattern(A2_FUNCTIONALITIES)

/* ==================================================================== *
 * THREE READINGS OF THIS MODULE'S FALLBACK SET, AND NONE OF THEM
 * RECONCILED.
 *
 * Measured on wave 1's modules and identical in shape here: §22.9's module
 * map, the module card's own Fallback identifier field, and the
 * functionality clauses give three different sets. No `DEC-*` identifier is
 * attached to the divergence anywhere in the frozen source.
 * ==================================================================== */

/** §22.9's module map, read through wave 0. Two patterns list `MOD-FL-A2`. */
export const A2_PATTERNS_FROM_MAP: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-A2')

/** Every pattern this module's own eleven functionalities reach. */
export const A2_PATTERNS_FROM_FUNCTIONALITIES = [
  ...new Set(A2_FUNCTIONALITIES.flatMap((f) => f.patterns)),
] as const satisfies readonly FrontlineFallbackId[]

export const A2_PATTERN_DIVERGENCE = {
  fromTheModuleMap: ['FB-FL-CORE-01', 'FB-FL-PKG-01'],
  fromTheCardsFallbackLine: [
    'FB-FL-PKG-01',
    'FB-FL-CORE-01',
    'FB-FL-CMD-01',
    'FB-FL-GATE-01',
  ],
  fromTheFunctionalities: ['FB-FL-CORE-01', 'FB-FL-PKG-01', 'FB-FL-UP-01'],
  note:
    "§22.9's module map names two patterns for this module; the module card's own Fallback " +
    'identifier line names four; the eleven functionalities between them name three. The map does ' +
    'not list this module against FB-FL-CMD-01, FB-FL-GATE-01 or FB-FL-UP-01, and the card names ' +
    'the first two while the functionalities name the third. All three readings are the source\'s ' +
    'own, none is corrected here, and no DEC-* identifier is attached to the divergence anywhere ' +
    'in the frozen source.',
  sourceRef:
    'map L40128-L40143 (rows L40130 and L40132); card L40419; functionalities L40427-L40447',
} as const

/* ==================================================================== *
 * THE SEVEN ACCEPTANCE CRITERIA, TRANSCRIBED.
 * ==================================================================== */

export interface A2AcceptanceCriterion {
  readonly id: string
  readonly text: string
  readonly sourceRef: string
}

export const A2_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-A2-1',
    text:
      'The list contains only work assigned to the logged-in identity, verified by inspection of the ' +
      'on-device store.',
    sourceRef: 'AC-A2-1 · L40481',
  },
  {
    id: 'AC-A2-2',
    text: 'No interface exists for claiming, searching, or reordering unassigned work.',
    sourceRef: 'AC-A2-2 · L40482',
  },
  {
    id: 'AC-A2-3',
    text:
      'A Run whose package has not arrived is shown as not-yet-ready with a reason, is not enterable, ' +
      'and is never omitted from the list.',
    sourceRef: 'AC-A2-3 · L40483',
  },
  {
    id: 'AC-A2-4',
    text:
      'The sync indicator is present on every screen and renders online or offline state, last-synced ' +
      'time, and pending count.',
    sourceRef: 'AC-A2-4 · L40484',
  },
  {
    id: 'AC-A2-5',
    text:
      'The sync detail sheet renders distinct capture states and offers no resolution action to the ' +
      'worker.',
    sourceRef: 'AC-A2-5 · L40485',
  },
  {
    id: 'AC-A2-6',
    text: 'Worker-finished and complete-and-synced render as distinct states.',
    sourceRef: 'AC-A2-6 · L40486',
  },
  {
    id: 'AC-A2-7',
    text:
      'A manual sync control exists and no application behaviour depends on the worker using it.',
    sourceRef: 'AC-A2-7 · L40487',
  },
] as const satisfies readonly A2AcceptanceCriterion[]

/* ==================================================================== *
 * THE LIST ITSELF.
 *
 * A Job with its Runs beneath it where runs exist (`FUNC-A2-01-1-1`,
 * L40427). The fixture is `SB-FL-011`'s own (L40471) rather than invented:
 * two Jobs, three Runs, exactly the shape `TEST-A2-1` (L40493) asks for.
 *
 * THE ORDER IS THE ARRAY AND THERE IS NO COMPARATOR. Row 8 (L40368)
 * prohibits reordering, hiding and dismissing for every column — "the list
 * orders and presents what the Delivery Operations Hub assigned" — so there
 * is no sort key, no comparator to invert and no dismiss handler to call.
 * A sort control cannot be added without deleting this sentence.
 * ==================================================================== */

/**
 * THE PARKED-RUN REASON, which this module owns and which is not a row of
 * its matrix.
 *
 * `SB-FL-011` (L40471) states it in the words the worker reads, and
 * `FB-FL-GATE-01` (L40112) states the two things that make it safe: the
 * terminal safe state is "the parked Run, with all prior captures preserved
 * and queued", and "There is no on-device worker override, ever."
 * `EXCL-FL-05` (L39488) makes the worker-initiated gate override an
 * Invariant exclusion, so the reason names no action the worker could take.
 */
export const PARKED_RUN_REASON = {
  line: 'Parked — waiting for a clearance from your supervisor. You can continue your other runs.',
  /** Why the line names nothing for the worker to press. */
  why:
    'The Run is blocked at a qualification gate awaiting a clearance. A clearance is granted ' +
    'remotely by a Supervisor or above and arrives on the command channel at the next ' +
    'synchronisation; there is no on-device worker override, ever. All prior captures are ' +
    'preserved and queued, and the worker continues with their other assigned Runs.',
  sourceRef: 'SB-FL-011 L40471; FB-FL-GATE-01 L40112; STATE-A2-PARKED L40379; EXCL-FL-05 L39488',
} as const

/**
 * THE TWO SHAPES A CARD TAKES, WHICH IS `FUNC-A2-01-1-1` (L40427) MADE
 * STRUCTURAL: "Group assigned work as Jobs with their Runs beneath them
 * where runs exist, and as the job alone where the job is one continuous
 * operation." `SB-FL-011` (L40471) renders one of each — "Red Bicycle
 * Assembly" with two rows beneath it, and "Frame Alignment Check" showing a
 * single row. A `jobAlone` card's one row carries the JOB's name because
 * the source gives it no run identifier of its own, and the covering suite
 * holds that equal rather than letting a run identifier be invented for it.
 */
export type A2ListShape = 'jobWithRunsBeneath' | 'jobAlone'

export interface A2Run {
  /** The Run's own name where it has one; the Job's name on a `jobAlone` card. */
  readonly id: string
  readonly state: A2RunState
  /** What the row says, in plain words. Never a spinner and never an absence. */
  readonly line: string
  readonly sourceRef: string
}

export interface A2Job {
  readonly id: string
  readonly name: string
  readonly shape: A2ListShape
  readonly runs: readonly A2Run[]
}

export const A2_LIST = [
  {
    id: 'JOB-REDBIKE',
    name: 'Red Bicycle Assembly',
    shape: 'jobWithRunsBeneath',
    runs: [
      {
        id: 'Run 2026-08-14-A',
        state: 'STATE-A2-INPROGRESS',
        line: 'In progress',
        sourceRef: 'SB-FL-011 · L40471',
      },
      {
        id: 'Run 2026-08-14-B',
        state: 'STATE-A2-NOTREADY',
        line:
          'Not yet ready. Waiting for the work package. It will download when the tablet is back ' +
          'online.',
        sourceRef: 'SB-FL-011 · L40471',
      },
    ],
  },
  {
    id: 'JOB-FRAMEALIGN',
    name: 'Frame Alignment Check',
    shape: 'jobAlone',
    runs: [
      {
        id: 'Frame Alignment Check',
        state: 'STATE-A2-PARKED',
        line: PARKED_RUN_REASON.line,
        sourceRef: 'SB-FL-011 · L40471',
      },
    ],
  },
] as const satisfies readonly A2Job[]

/**
 * THE SAME JOB EARLIER THE SAME DAY, from the Illustrative Example (L40473):
 * "At 06:05 Maya's My Runs shows `JOB-REDBIKE` with `RUN-2026-08-14-A`
 * ready, pre-synced at shift start while the plant network was healthy."
 *
 * WHY A SECOND MOMENT EXISTS AT ALL. `SB-FL-011`'s list holds an
 * in-progress Run, a not-yet-ready one and a parked one — and no READY one,
 * which is the single state row 4 (L40364) lets a worker act on. A screen
 * that never renders its own one control has demonstrated the refusals and
 * not the act. The source supplies the earlier moment itself, so nothing is
 * invented to reach it: the two moments are the storyboard's and the
 * illustrative example's, both at their own lines.
 *
 * THE SOURCE SPELLS THE RUN TWO WAYS and neither is corrected: the
 * storyboard writes "Run 2026-08-14-A" (L40471) and the illustrative example
 * writes `RUN-2026-08-14-A` (L40473). Each list carries the spelling of the
 * line it comes from.
 */
export const A2_LIST_AT_SHIFT_START = [
  {
    id: 'JOB-REDBIKE',
    name: 'Red Bicycle Assembly',
    shape: 'jobWithRunsBeneath',
    runs: [
      {
        id: 'RUN-2026-08-14-A',
        state: 'STATE-A2-READY',
        line: 'Ready, pre-synced at shift start while the plant network was healthy.',
        sourceRef: 'Illustrative Example · L40473',
      },
    ],
  },
] as const satisfies readonly A2Job[]

/** The two moments of this list the source itself describes. */
export const A2_MOMENTS = {
  'shift-start': {
    label: 'At 06:05, shift start',
    list: A2_LIST_AT_SHIFT_START as readonly A2Job[],
    sourceRef: 'Illustrative Example · L40473',
  },
  'mid-shift': {
    label: 'Later the same shift',
    list: A2_LIST as readonly A2Job[],
    sourceRef: 'SB-FL-011 · L40471',
  },
} as const

export type A2Moment = keyof typeof A2_MOMENTS

export function a2RunsInOrder(list: readonly A2Job[] = A2_LIST): readonly A2Run[] {
  return list.flatMap((j) => j.runs)
}

/** Row 4 and row 5 of the matrix, asked of one Run. */
export function runIsEnterable(state: A2RunState): boolean {
  return A2_RUN_STATES.find((s) => s.id === state)?.enterable === true
}

/* ==================================================================== *
 * THE SYNC DETAIL SHEET.
 *
 * `FUNC-A2-04-2-1` (L40446): "List pending items by their distinct capture
 * states rather than as one undifferentiated 'synced' figure." `AC-A2-5`
 * (L40485): the sheet "renders distinct capture states and offers no
 * resolution action to the worker."
 *
 * BOTH ARE HELD BY THE TYPE RATHER THAN BY A GUARD. The label comes from
 * wave 0's `CAPTURE_STATE_LABEL`, a TOTAL record over a thirteen-member
 * union with no `synced` member and no success member, so there is no
 * branch through which a fourteenth string could arrive. And the row shape
 * below carries no handler, no identifier to act on and no field a control
 * could bind to — the sheet is informational, which is `FUNC-A2-04-2-1`'s
 * own word for it.
 * ==================================================================== */

export interface SyncSheetRow {
  readonly state: CaptureState
  readonly count: number
  /** Wave 0's own sentence for the state. Never composed here. */
  readonly line: string
}

/**
 * The pending items grouped by their own ladder state. `counts` is the
 * caller's; nothing here invents a figure. The total is DERIVED from the
 * rows, so the headline number and the breakdown cannot disagree — which is
 * the failure mode `FUNC-A2-04-1-2` (L40444) names as "imply a sync that
 * has not happened".
 */
export function syncSheetRows(
  counts: Partial<Readonly<Record<CaptureState, number>>>,
): readonly SyncSheetRow[] {
  return (Object.keys(counts) as CaptureState[])
    .filter((s) => (counts[s] ?? 0) > 0)
    .map((state) => ({
      state,
      count: counts[state] ?? 0,
      line: captureStateLine(state),
    }))
}

export function pendingTotal(rows: readonly SyncSheetRow[]): number {
  return rows.reduce((a, r) => a + r.count, 0)
}

/**
 * The fixture the view renders, and it is deliberately spread across four
 * ladder states: a sheet demonstrating one state would never exercise the
 * sentence `FUNC-A2-04-2-1` exists to force. Fourteen pending, which is
 * `SB-FL-011`'s own figure (L40471).
 */
export const A2_PENDING_FIXTURE: Partial<Readonly<Record<CaptureState, number>>> = {
  'committed-locally': 3,
  queued: 8,
  uploading: 1,
  'upload-interrupted': 2,
}

/**
 * The manual sync control's own two states, from `FUNC-A2-04-2-2` (L40447):
 * "Online: triggers an immediate attempt. Offline: the control is present
 * but plainly reports that there is no connection." `TEST-A2-7` (L40499)
 * asks for exactly the second half — the control "reports no connection
 * rather than appearing to succeed".
 *
 * THE CONTROL IS PRESENT IN BOTH. It is never disabled: `FrontlineAffordance`
 * has no `disabled` member, and a disabled sync control would imply the
 * worker's inaction was the reason nothing had synchronised, when the whole
 * point of the row is that sync is "a convenience only, never a dependency"
 * (L40366).
 */
export function manualSyncOutcome(online: boolean): { readonly line: string; readonly sourceRef: string } {
  return online
    ? {
        line: 'Trying now. Nothing on this tablet is waiting on you; this only asks sooner.',
        sourceRef: 'FUNC-A2-04-2-2 · L40447',
      }
    : {
        line:
          'There is no connection, so nothing was sent. Everything already recorded is safe on this ' +
          'tablet and will go when the connection returns. Nothing you are doing depends on this.',
        sourceRef: 'FUNC-A2-04-2-2 L40447; TEST-A2-7 L40499',
      }
}

/* ==================================================================== *
 * THE ARRIVING-COMMAND BANNER, `SB-FL-007`.
 *
 * This module owns it and it is not a row of the matrix. L39709 states it
 * whole, and three of its four sentences are constraints rather than
 * decoration: the banner is non-blocking, it names what changed AND what
 * the worker can now do, it does not appear mid-capture, and commands apply
 * at safe boundaries and never inside a committed screen. The module card's
 * Reconnect behaviour line (L40396) says the same from the other side.
 *
 * THE DEVICE'S COPY, NOT THE FLEET'S. `@/frontline/commands` settles that a
 * command is effective on a device when THAT device has applied it (L39670)
 * — so the banner speaks about this tablet and never about a fleet-wide
 * state this device cannot see.
 * ==================================================================== */

export const ARRIVING_COMMAND_BANNER = {
  id: 'SB-FL-007',
  /** The storyboard's own example banner, verbatim. */
  example:
    'Lot WB-2291 has been released. You can continue Run 2026-08-14-A.',
  /** The storyboard's own constraints on it, verbatim. */
  constraints: [
    {
      text: 'A non-blocking banner appears at the top of My Runs',
      sourceRef: 'SB-FL-007 · L39709',
    },
    {
      text: 'The banner names what changed and what she can now do.',
      sourceRef: 'SB-FL-007 · L39709',
    },
    {
      text:
        'It does not appear mid-capture; commands apply at safe boundaries, never inside a ' +
        'committed screen.',
      sourceRef: 'SB-FL-007 · L39709',
    },
  ],
  sourceRef: 'L39709',
} as const

/* ==================================================================== *
 * THE PACKAGE-READINESS DETAIL, AND THE NAMESPACE RULING IT SITS UNDER.
 *
 * Row 5's Worker cell gives the reason a not-yet-ready Run cannot be
 * entered — "the package has not arrived, so nothing can be rendered" — and
 * §22.7 gives that detail its own row: `SCR-FL-05`, "Package readiness
 * detail", Destination "My Runs", Module `MOD-FL-A2` (L39867). §25.5 gives
 * the SAME token to the Training Library (L48533).
 *
 * THE RULING IS WAVE 0'S AND IS CONSUMED, NOT REOPENED. `RULING-FL-1` in
 * `@/frontline/screens` settles that no `SCR-FL-*` identifier is ever a
 * route key and that §25.5 fixes the destination set, so the package
 * readiness detail is a VIEW of this destination and never a route. The
 * contested token is read from `FL_DESTINATIONS` — whose shape requires
 * both readings beside each other — rather than spelled again here.
 * ==================================================================== */

export const PACKAGE_READINESS_DETAIL = {
  name: 'Package readiness detail',
  isAViewOf: 'my-runs',
  /** BOTH readings, read from wave 0 rather than restated. */
  contested: flDestinationBySlug('training-library-viewer').contested,
  note:
    'Section 22.7 gives SCR-FL-05 the name "Package readiness detail" and places it on the My Runs ' +
    'destination against MOD-FL-A2 (L39867); section 25.5 gives the same identifier to the Training ' +
    'Library (L48533). This build keys no route on a screen identifier, so the package readiness ' +
    'detail is a view of this destination and the Training Library is a destination of its own. ' +
    'Both readings stand; neither register is corrected.',
  sourceRef: 'L39867 (§22.7), L48533 (§25.5), RULING-FL-1 in @/frontline/screens',
} as const

/* ==================================================================== *
 * THE THREE DECISIONS THIS MODULE DISCLOSES, PLUS THE FOURTH IT READS.
 *
 * WHY THEY ARE NOT RENDERED BY `@/disclosure/DecisionDisclosure`, AND WHY
 * THAT IS A FINDING RATHER THAN A PREFERENCE. That component takes a
 * `DecisionId`, and the union the canon in `src/disclosure/decisions.ts`
 * exports contains none of `DEC-PARK-001`, `DEC-NOSHIFT-001` or
 * `DEC-STORE-001`. That file is another task's path. `Stu14LocalDisclosure` in
 * `@/studio/modules/stu-14/rendering` met exactly this and set the idiom
 * followed here: disclose locally IN THE CANON'S OWN SHAPE, declare the gap
 * on `canonNote`, and never file the decision under a neighbouring
 * identifier, because a client searching the canon for one of these would
 * then find someone else's decision instead.
 *
 * `readings` is the canon's own `DecisionReading`, IMPORTED rather than
 * redeclared, so it carries exactly two fields and there is no field in
 * which a reading could be marked the answer.
 *
 * THE STAND-IN IS BUILT TO EXPIRE. The covering suite asserts every
 * identifier here is ABSENT from the canon's exported `DecisionId` union;
 * the moment one is lifted, that suite goes red and forces the switch.
 *
 * THE FOURTH IS NOT HERE. The Tenant Admin device session is a
 * `RouteOpenDecision` recorded once in `src/routes/definitions.ts` and read
 * through `routeOpenDecisionFor`. Copying its wording here would be the
 * second spelling that mechanism exists to prevent.
 * ==================================================================== */

export interface A2LocalDisclosure {
  readonly decisionRef: 'DEC-PARK-001' | 'DEC-NOSHIFT-001' | 'DEC-STORE-001'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why this module is a place the decision has to be disclosed. */
  readonly whyHere: string
  /** Why it is disclosed locally rather than through the shared canon. */
  readonly canonNote: string
}

const CANON_NOTE =
  'The shared decision canon at @/disclosure/decisions carries no record keyed to this identifier — ' +
  'it is not a member of that file’s DecisionId union — and that file is ' +
  "another task's path. Disclosed here in the canon's own shape so it can be absorbed without a " +
  'rewrite, and declared as a gap rather than filed under a neighbouring identifier.'

export const A2_DISCLOSURES = [
  {
    decisionRef: 'DEC-PARK-001',
    question:
      "What happens when the parked Run is the worker's only assigned Run? An empty My Runs list and " +
      'a list holding one parked Run are different screens, and the source does not say which the ' +
      'worker sees.',
    readings: [
      {
        text:
          "Open item: what happens when the parked Run is the worker's only assigned Run is Not " +
          'specified in the Statement of Work and is proposed as DEC-PARK-001.',
        locator: 'FB-FL-GATE-01 · L40112',
      },
      {
        text: 'Candidate behaviour one: the worker idles with an honest explanation.',
        locator: 'DEC-PARK-001 · L41682',
      },
      {
        text:
          'Candidate behaviour two: the Supervisor is escalated to immediately rather than through ' +
          'the ordinary path.',
        locator: 'DEC-PARK-001 · L41682',
      },
      {
        text:
          'Candidate behaviour three: the run no-show timers at plus 15 and plus 30 minutes take ' +
          'over.',
        locator: 'DEC-PARK-001 · L41682',
      },
      {
        text:
          'Every other place the source touches it says only that the case is open: FB-FL-GATE-01 ' +
          'is the fallback "with DEC-PARK-001 open for the single-run case" in MOD-FL-A6 and in ' +
          'MOD-FL-B9 alike, and MOD-FL-B9\'s Source status calls the single-assigned-Run parking ' +
          'case Client Decision Required.',
        locator: 'DEC-PARK-001 · L41190, L41700, L41771',
      },
    ],
    adopted:
      'Nothing is resolved. This screen renders the parked Run in the list with its own honest ' +
      'reason and states, beside it, that what happens when it is the only assigned Run is an open ' +
      'question with three candidate behaviours the source names and does not choose between. The ' +
      'list is never emptied to hide the case and no idle screen, escalation or timing behaviour is ' +
      'invented to fill it. The decision owner is the client.',
    whyHere:
      'This is the screen the question is about. STATE-A2-PARKED is one of this module\'s six Run ' +
      'states (L40379), the parked Run appears in this list by name in SB-FL-011 (L40471), and the ' +
      "module's own alternate-paths line (L40390) says the worker \"continues with their other " +
      'assigned Runs" — which is precisely the sentence that has no meaning when there are no other ' +
      'assigned Runs.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-NOSHIFT-001',
    question:
      'Where escalation routing resolves to nobody on shift, who receives the escalation?',
    readings: [
      {
        text:
          'Terminal safe state: the platform default escalates to the tenant\'s Quality Manager role ' +
          'irrespective of shift, marked as a fallback delivery — carried as DEC-NOSHIFT-001 and not ' +
          'treated as settled.',
        locator: 'DEC-NOSHIFT-001 · L2681',
      },
      {
        text: 'DEC-NOSHIFT-001 is preserved unresolved.',
        locator: 'DEC-NOSHIFT-001 · L2687',
      },
      {
        text:
          'The notification row states the same default in the table itself: nobody holding the ' +
          "target role is on shift; the tenant's Quality Manager role irrespective of shift, marked " +
          'visibly as a fallback delivery.',
        locator: 'DEC-NOSHIFT-001 · L40967',
      },
    ],
    adopted:
      'This screen states the platform default and marks the fallback delivery visibly as one. It ' +
      'settles nothing about whether that default is what a tenant wants, and the source keeps the ' +
      'decision unresolved.',
    whyHere:
      "This module's fallback failure routes to the Supervisor: when no assigned Run is ready, the " +
      'Supervisor is signalled through the run no-show path at plus 15 minutes, with auto-cancel at ' +
      'plus 30 for unstarted runs (L40475), and the notifications table names the Supervisor as the ' +
      'recipient of both (L40412, L40413). DEC-NOSHIFT-001 is what governs those two notifications ' +
      'when no Supervisor is on shift, and DEC-PARK-001\'s third candidate behaviour hands the ' +
      'single-parked-Run case to exactly that path — so the two open questions meet on this screen.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-STORE-001',
    question: 'What does a device do when on-device storage runs out?',
    readings: [
      {
        text:
          'First fallback: Not specified in the Statement of Work. Storage-full behaviour is ' +
          'explicitly deferred to the Frontline Functional Specification, per platform for iOS and ' +
          'Android, and no behaviour may be invented here.',
        locator: 'FB-FL-STORE-01 · L40116',
      },
      {
        text:
          'The options are (a) block new capture with a clear message and force a sync, (b) block ' +
          'new media capture only while permitting non-media captures, (c) refuse to start ' +
          'additional Runs while permitting completion of Runs in progress. The recommendation is a ' +
          'combination of (b) and (c) with (a) as the terminal state.',
        locator: 'FB-FL-STORE-01 · L40116',
      },
      {
        text:
          'Storage-full behaviour: Client Decision Required — DEC-STORE-001, §7.10.7 item E6, ' +
          'explicitly deferred.',
        locator: 'DEC-STORE-001 · L11598',
      },
    ],
    adopted:
      'Nothing is adopted and nothing may be. This screen renders the queued-capture count the ' +
      "indicator is required to show and states that the count has no ceiling this build knows: " +
      'what the device does when the store fills is deferred to the Frontline Functional ' +
      'Specification. No storage threshold, no eviction and no refusal to start a Run is ' +
      'implemented here, because option (c) is one of three the client has not chosen between.',
    whyHere:
      'FUNC-A2-04-1-1 (L40443) requires this screen to render a pending-captures count persistently, ' +
      'and that count is the figure that grows while the store fills. One of the three candidate ' +
      'behaviours — option (c), refuse to start additional Runs while permitting completion of Runs ' +
      'in progress — would change what this list may enter, which is row 4 of this matrix (L40364). ' +
      "The §22.9 module map does not list MOD-FL-A2 against FB-FL-STORE-01 (L40139); the decision " +
      'reaches this screen through the count and through option (c), not through the pattern map, ' +
      'and saying so is part of the disclosure.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly A2LocalDisclosure[]

/* ==================================================================== *
 * WHAT THIS MODULE FOUND AND DID NOT CLOSE.
 * ==================================================================== */

export interface A2Finding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  /** Every line this finding stands on. Never blank. */
  readonly sourceRef: string
}

export const A2_SOURCE_FINDINGS = [
  {
    what:
      'The source names the last per-Run state complete-and-synced, and the platform-wide honesty ' +
      'rule says there is no single state called "synced".',
    evidence:
      'STATE-A2-COMPLETESYNCED at L40379 and AC-A2-6 at L40486 both use the word; L39622 says "there ' +
      'is no single state called \'synced\'" and FUNC-A2-04-2-1 (L40446) forbids "one ' +
      'undifferentiated \'synced\' figure" for captures. The two are about different things and the ' +
      'source keeps them apart: the Run-level state is defined as every capture and evidence object ' +
      'received and acknowledged by the server, which is the condition L40560 calls complete, while ' +
      'the capture ladder has thirteen states and no member of that name.',
    notClosedBecause:
      'Both are transcribed and neither is corrected. The Run state keeps the source\'s own name ' +
      'with its own line; no CAPTURE on this screen is ever labelled with it, because every capture ' +
      "label comes from wave 0's total record over the thirteen-state ladder and that record has no " +
      'such member.',
    sourceRef: 'L40379, L40486, L40446, L39622, L40560, L39598-L39619',
  },
  {
    what:
      'Whether an in-progress Run can be re-entered from My Runs is not stated. UNRECORDED — not ' +
      'inferred and not filled.',
    evidence:
      'The happy path (L40386-L40387) has the worker select a READY Run and the Run Player open. ' +
      'L40388 has the player return the worker to My Runs on worker-finished. Row 4 of the matrix ' +
      '(L40364) allows entering a ready Run and row 5 (L40365) prohibits entering a not-yet-ready ' +
      'one; no row and no functionality addresses an in-progress one. SB-FL-011 (L40471) shows an ' +
      'in-progress Run in the list and says nothing about pressing it.',
    notClosedBecause:
      'Only STATE-A2-READY is marked enterable here, which is what the two rows that exist say. The ' +
      'in-progress case is stated as unrecorded on screen rather than answered in either direction.',
    sourceRef: 'L40386, L40387, L40388, L40364, L40365, L40471',
  },
  {
    what:
      'The build-plan grade C1 is not a source value, and the brief that carried it pointed at the ' +
      "source's own grade column at L39848. That column is the module inventory's Band column, and " +
      "L39848 is MOD-FL-A3's row rather than this module's.",
    evidence:
      'The module inventory table runs header L39844, separator L39845, data L39846-L39857, with ' +
      "columns Identifier, Module, Band, One-line scope. MOD-FL-A2's row is L39847 and its Band " +
      'reads A. L39848 is MOD-FL-A3 and its Band also reads A.',
    notClosedBecause:
      'No build-plan grade appears anywhere in this module. The source value that does exist is the ' +
      'Band, and it is recorded here at its own line rather than at the neighbouring one.',
    sourceRef: 'L39844, L39845, L39847, L39848',
  },
] as const satisfies readonly A2Finding[]

/**
 * THE ONE PLACE A PROHIBITED WORD REACHES A RENDERED STRING, RECORDED SO IT
 * IS DELIBERATE RATHER THAN MISSED.
 *
 * `EXCL-FL-08` (L39491) and `AC-FL-000-5` (L39100) forbid a pace, timer,
 * countdown or ranking AFFORDANCE. `DEC-PARK-001`'s third candidate
 * behaviour is the source's own sentence and contains the word "timers"; it
 * describes a Supervisor-side notification path, not anything drawn on this
 * screen, and paraphrasing an alternative is how a disclosure stops being
 * one.
 *
 * The covering suite proves the quotation is really at the line it names,
 * and proves that no OTHER rendered string in this module carries any of
 * the four words.
 */
export const SOURCE_QUOTED_HAZARD_WORDS = [
  {
    word: 'timers',
    where: "DEC-PARK-001's third candidate behaviour",
    quotation:
      'the run no-show timers at plus 15 and plus 30 minutes take over',
    whyItIsNotAnAffordance:
      'It names the Supervisor-side no-show and auto-cancel notifications of L40412 and L40413, ' +
      'which are sent to the Supervisor and never rendered to the worker. Nothing on this screen ' +
      'counts, elapses, or compares.',
    sourceRef: 'L41682',
  },
] as const

/** Wave 0's total label record, as rows, so the sheet and the gates read one list. */
export const CAPTURE_STATE_LABEL_ROWS = (
  Object.keys(CAPTURE_STATE_LABEL) as CaptureState[]
).map((state) => ({ state, label: CAPTURE_STATE_LABEL[state] }))

export interface A2RenderedString {
  readonly where: string
  readonly text: string
  /**
   * The lines this string stands on. `''` where the string is this build's
   * own composition rather than a transcription — the covering suite treats
   * that as a fact about the string, and a string with no locator may not
   * carry a controlled word.
   */
  readonly sourceRef: string
}

/**
 * EVERY STRING THIS MODULE CAN PUT ON A SCREEN, IN ONE PLACE, because two
 * gates in the covering suite walk it — and a gate that walks a narrower
 * list than the module renders is a gate that passes the defect it was
 * written for. Wave 1 recorded that shape twice.
 *
 * ITS CEILING, MEASURED RATHER THAN ASSUMED. This is the module's DATA. The
 * view's own connecting prose is not here, so a hazard word typed straight
 * into the JSX would not be seen by a gate walking this list. The component
 * suite sweeps the rendered document for exactly that, which is the only
 * place it can be caught.
 */
export function a2RenderedStrings(): readonly A2RenderedString[] {
  const out: A2RenderedString[] = []
  const push = (where: string, text: string, sourceRef: string) =>
    out.push({ where, text, sourceRef })

  for (const s of A2_CARD) push(`card ${s.field}`, s.text, s.sourceRef)
  for (const s of A2_RUN_STATES) push(s.id, `${s.gloss} ${s.diagramNode}`, s.sourceRef)
  for (const w of RUN_COMPLETION_WORDS) push(`completion ${w.word}`, w.meaning, w.sourceRef)
  push(
    'completion claim',
    `${COMPLETION_CLAIM_NEVER_MADE.claim} ${COMPLETION_CLAIM_NEVER_MADE.instead}`,
    COMPLETION_CLAIM_NEVER_MADE.sourceRef,
  )
  for (const a of NO_PACE_NO_TIMER_NO_RANKING) {
    push('absence', a.text, a.sourceRef)
    push('absence gloss', a.gloss, '')
  }
  push('storyboard', SB_FL_011.text, SB_FL_011.sourceRef)

  for (const row of A2_MATRIX) {
    push(`row ${row.id}`, row.control, row.sourceRef)
    push(`why ${row.id}`, row.why, row.whyRef)
    for (const column of A2_COLUMNS) {
      push(`${row.id}.${column}`, row.cells[column].note, row.sourceRef)
    }
    if (row.metElsewhere !== null) {
      push(`${row.id} met elsewhere`, row.metElsewhere.note, row.sourceRef)
    }
  }

  for (const f of A2_FUNCTIONALITIES) {
    push(f.id, `${f.statement} ${f.fallbackClause}`, f.sourceRef)
  }
  for (const ac of A2_ACCEPTANCE_CRITERIA) push(ac.id, ac.text, ac.sourceRef)
  push('pattern divergence', A2_PATTERN_DIVERGENCE.note, A2_PATTERN_DIVERGENCE.sourceRef)

  for (const moment of Object.values(A2_MOMENTS)) {
    for (const job of moment.list) {
      push(`job ${job.id} ${moment.label}`, job.name, moment.sourceRef)
      for (const run of job.runs) push(`run ${run.id}`, `${run.id} — ${run.line}`, run.sourceRef)
    }
  }
  push(
    'parked reason',
    `${PARKED_RUN_REASON.line} ${PARKED_RUN_REASON.why}`,
    PARKED_RUN_REASON.sourceRef,
  )

  for (const row of syncSheetRows(A2_PENDING_FIXTURE)) {
    push(`sync ${row.state}`, row.line, 'L39598-L39619 (the capture ladder)')
  }
  for (const s of CAPTURE_STATE_LABEL_ROWS) {
    push(`label ${s.state}`, s.label, 'L39598-L39619 (the capture ladder)')
  }
  for (const online of [true, false]) {
    const m = manualSyncOutcome(online)
    push(`manual sync ${String(online)}`, m.line, m.sourceRef)
  }

  push('banner', ARRIVING_COMMAND_BANNER.example, ARRIVING_COMMAND_BANNER.sourceRef)
  for (const c of ARRIVING_COMMAND_BANNER.constraints) push('banner constraint', c.text, c.sourceRef)
  push('package readiness', PACKAGE_READINESS_DETAIL.note, PACKAGE_READINESS_DETAIL.sourceRef)

  for (const d of A2_DISCLOSURES) {
    push(`${d.decisionRef} question`, d.question, '')
    push(`${d.decisionRef} adopted`, d.adopted, '')
    push(`${d.decisionRef} whyHere`, d.whyHere, '')
    push(`${d.decisionRef} canonNote`, d.canonNote, '')
    for (const r of d.readings) push(`${d.decisionRef} reading`, r.text, r.locator)
  }
  for (const f of A2_SOURCE_FINDINGS) {
    push('finding what', f.what, f.sourceRef)
    push('finding evidence', f.evidence, f.sourceRef)
    push('finding because', f.notClosedBecause, f.sourceRef)
  }
  return out
}
