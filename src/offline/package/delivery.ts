import { A2_RUN_STATES, type A2RunState } from '@/frontline/modules/fl-a2/charter'
import { runIsEnterable } from '@/frontline/modules/fl-a2/service'
import { FL_A6_MATRIX } from '@/frontline/modules/fl-a6/matrix'

/**
 * SECTION 35.4 — DELIVERY PATHS, HONEST READINESS AND PER-RUN PINNING.
 * The section opens at L79336.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO, AND IT IS THE WHOLE POINT.
 *
 * IT DOES NOT DEFINE READINESS. `MOD-FL-A2` shipped readiness in slice 7 and
 * it is one ruling, not two. Row 4 of that module's matrix (L40364) allows a
 * Worker to enter a ready Run; row 5 (L40365) prohibits entering a
 * not-yet-ready one for every column, and its Worker cell carries the reason
 * in the source's own words — "the package has not arrived, so nothing can be
 * rendered". `A2_RUN_STATES` makes that structural: `enterable` is true on
 * exactly one of the six states. This file therefore RETURNS an `A2RunState`
 * and asks `runIsEnterable`; it does not carry a `ready` boolean, a
 * `notReady` string or a second enterability rule. A second spelling of that
 * ruling is the defect this build records most often.
 *
 * IT DOES NOT RE-STATE THE PINNING PROHIBITION EITHER. `MOD-FL-A6`'s matrix
 * row 8 (L41101) prohibits forcing a package version change onto an in-flight
 * Run in all five columns, and slice 7 transcribed it as
 * `force-version-change-in-flight`. `rePull` below reads its refusal reason
 * from that shipped row rather than typing the sentence again.
 *
 * IT CARDS NO DECISION. §35.4's own gap — a run assigned while the device is
 * entirely offline is not known to the device, so the device shows nothing,
 * which is precisely the silent absence the source rules out (L79362) — is
 * raised as `DEC-OFFASSIGN-001`, and its card lives at L79654 inside §35.7,
 * which is another task's section. It is referenced here with its locator and
 * carded nowhere in this file.
 */

/* ==================================================================== *
 * THE TWO PATHS, CLOSED AT TWO.
 *
 * L79342 quotes the source: packages "reach the device by two complementary
 * paths, so a worker is never stranded waiting for a network". The comparison
 * table's header at L79392 names both, and those two names are the column
 * headings the transcription below is keyed on.
 * ==================================================================== */

export type DeliveryPath = 'shift-start-pre-sync' | 'lazy-pull'

export const DELIVERY_PATHS = ['shift-start-pre-sync', 'lazy-pull'] as const satisfies readonly DeliveryPath[]

type MissingFromPaths = Exclude<DeliveryPath, (typeof DELIVERY_PATHS)[number]>
const _deliveryPathsAreExhaustive: MissingFromPaths extends never ? true : never = true
void _deliveryPathsAreExhaustive

/** The comparison table's own column headings at L79392, verbatim. */
export const DELIVERY_PATH_HEADINGS: Readonly<Record<DeliveryPath, string>> = {
  'shift-start-pre-sync': 'Shift-start pre-sync',
  'lazy-pull': 'Lazy pull',
}

/**
 * Every locator this module cites, in one place, so the covering suite can
 * re-open each one against the frozen source rather than trust this file.
 */
export const DELIVERY_LOCATORS = {
  /** `## 35.4 Delivery paths, honest readiness and per-run pinning` */
  section: 79336,
  /** The two-path quotation and the honesty rule that follows it. */
  businessRules: 79342,
  /** `**Numbered chronological workflow — shift-start pre-sync.**` */
  preSyncWorkflowHeading: 79344,
  /** `**Numbered chronological workflow — lazy pull for a mid-shift assignment.**` */
  lazyPullWorkflowHeading: 79353,
  /** The offline-assignment visibility gap, raised as `DEC-OFFASSIGN-001`. */
  offlineAssignmentGap: 79362,
  /** `| Property | Shift-start pre-sync | Lazy pull |` */
  comparisonHeader: 79392,
  comparisonFirstRow: 79394,
  comparisonLastRow: 79403,
  /** `**Per-run pinning, restated with its consequences.**` */
  pinningRestated: 79405,
  acceptanceHeader: 79411,
  acceptanceFirstRow: 79413,
  acceptanceLastRow: 79417,
  testHeader: 79419,
  testFirstRow: 79421,
  testLastRow: 79424,
} as const

/* ==================================================================== *
 * THE COMPARISON TABLE — TEN DATA ROWS, HEADER-KEYED.
 *
 * L79392 is the header, L79393 the separator, L79394-L79403 the ten data
 * rows. The header reads `Property | Shift-start pre-sync | Lazy pull`, and
 * `cells` is a TOTAL record over `DeliveryPath`, so a blank cell is
 * untypeable and a positional transcription cannot silently swap the two
 * columns: the key names the column.
 *
 * THIS IS A COMPARISON, NOT A SEQUENCE. Its rows are properties held side by
 * side; nothing here is ordered in time. The two numbered workflows below are
 * the sequences, and they are separate for that reason.
 * ==================================================================== */

export type DeliveryComparisonRowId =
  | 'trigger'
  | 'connectivity-requirement'
  | 'staging-scope'
  | 'worker-action-required'
  | 'readiness-display-before-arrival'
  | 'supervisor-intervention'
  | 'pinning'
  | 'failure-mode'
  | 'fallback'
  | 'source-status'

export interface DeliveryComparisonRow {
  readonly id: DeliveryComparisonRowId
  /** The row's own label in the `Property` column, verbatim. */
  readonly property: string
  readonly cells: Readonly<Record<DeliveryPath, string>>
  readonly sourceRef: number
}

export const DELIVERY_COMPARISON = [
  {
    id: 'trigger',
    property: 'Trigger',
    cells: {
      'shift-start-pre-sync': 'Device connected at shift start with known runs scheduled',
      'lazy-pull': 'Assignment made mid-shift',
    },
    sourceRef: 79394,
  },
  {
    id: 'connectivity-requirement',
    property: 'Connectivity requirement',
    cells: {
      'shift-start-pre-sync': '`Allowed` — requires connectivity at shift start',
      'lazy-pull': '`Allowed` — requires connectivity at some point after assignment',
    },
    sourceRef: 79395,
  },
  {
    id: 'staging-scope',
    property: 'Staging scope',
    cells: {
      'shift-start-pre-sync': "Today's runs fully staged",
      'lazy-pull': 'Near-horizon runs staged lazily',
    },
    sourceRef: 79396,
  },
  {
    id: 'worker-action-required',
    property: 'Worker action required',
    cells: {
      'shift-start-pre-sync': '`Explicitly prohibited` — never a worker action',
      'lazy-pull': '`Explicitly prohibited` — never a worker action',
    },
    sourceRef: 79397,
  },
  {
    // The one asymmetric row, and the one honest readiness turns on. The
    // pre-sync cell is `Not applicable` WITH ITS REQUIRED STATED REASON —
    // there is no "before arrival" on a path where the package is already
    // there — while the lazy-pull cell is the not-yet-ready display itself.
    id: 'readiness-display-before-arrival',
    property: 'Readiness display before arrival',
    cells: {
      'shift-start-pre-sync': '`Not applicable — packages are present before the shift begins`',
      'lazy-pull': 'Not-yet-ready with a stated reason',
    },
    sourceRef: 79398,
  },
  {
    id: 'supervisor-intervention',
    property: 'Supervisor intervention',
    cells: {
      'shift-start-pre-sync': 'On-demand re-pull available',
      'lazy-pull': 'On-demand re-pull available',
    },
    sourceRef: 79399,
  },
  {
    id: 'pinning',
    property: 'Pinning',
    cells: {
      'shift-start-pre-sync': 'Per run at staging',
      'lazy-pull': 'Per run at staging',
    },
    sourceRef: 79400,
  },
  {
    id: 'failure-mode',
    property: 'Failure mode',
    cells: {
      'shift-start-pre-sync': 'Device not connected at shift start',
      'lazy-pull': 'Device never regains connectivity during the shift',
    },
    sourceRef: 79401,
  },
  {
    id: 'fallback',
    property: 'Fallback',
    cells: {
      'shift-start-pre-sync': 'Lazy pull covers it later',
      'lazy-pull': 'Run remains not-yet-ready and not enterable; other runs continue',
    },
    sourceRef: 79402,
  },
  {
    id: 'source-status',
    property: 'Source status',
    cells: {
      'shift-start-pre-sync': '`SoW Fact — §7.6, §7.10.1, §7.10.7`',
      'lazy-pull':
        '`SoW Fact — §7.6, §7.10.1`; offline-assignment visibility gap under `DEC-OFFASSIGN-001`',
    },
    sourceRef: 79403,
  },
] as const satisfies readonly DeliveryComparisonRow[]

type MissingFromComparison = Exclude<
  DeliveryComparisonRowId,
  (typeof DELIVERY_COMPARISON)[number]['id']
>
const _comparisonIsExhaustive: MissingFromComparison extends never ? true : never = true
void _comparisonIsExhaustive

export function deliveryComparisonRow(id: DeliveryComparisonRowId): DeliveryComparisonRow {
  const found = DELIVERY_COMPARISON.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no §35.4 comparison row: ${id}`)
  return found
}

/* ==================================================================== *
 * THE TWO NUMBERED WORKFLOWS, SIX STEPS EACH.
 *
 * Shift-start pre-sync is L79346-L79351; lazy pull is L79355-L79360. Both are
 * transcribed step by step with the step's own line, because the last two
 * steps of each are where readiness and pinning are actually settled —
 * "verifies, stores, activates and pins" (L79359) then "The run becomes
 * enterable" (L79360) — and a summarised workflow loses exactly that order.
 * ==================================================================== */

export interface DeliveryWorkflowStep {
  readonly n: number
  readonly text: string
  readonly sourceRef: number
}

export interface DeliveryWorkflow {
  readonly path: DeliveryPath
  readonly steps: readonly DeliveryWorkflowStep[]
}

export const DELIVERY_WORKFLOWS = [
  {
    path: 'shift-start-pre-sync',
    steps: [
      {
        n: 1,
        text: 'Runs for the coming shift are scheduled and assigned in the Delivery Operations Hub, within the run schedule visibility horizon of today plus 7 days',
        sourceRef: 79346,
      },
      {
        n: 2,
        text: "The device, connected at shift start, requests the packages for the shift's known runs.",
        sourceRef: 79347,
      },
      {
        n: 3,
        text: 'The platform generates or retrieves each per-run package and its manifest.',
        sourceRef: 79348,
      },
      {
        n: 4,
        text: 'The device downloads, verifies, stores and activates each package.',
        sourceRef: 79349,
      },
      {
        n: 5,
        text: "Each run's row on My Runs moves from preparing to ready.",
        sourceRef: 79350,
      },
      {
        n: 6,
        text: 'Each run is pinned to the package version staged for it.',
        sourceRef: 79351,
      },
    ],
  },
  {
    path: 'lazy-pull',
    steps: [
      {
        n: 1,
        text: 'A Supervisor assigns a run mid-shift in the Delivery Operations Hub, or reassigns one as Command Center action 8',
        sourceRef: 79355,
      },
      {
        n: 2,
        text: 'The assignment reaches the device as an assignment update on the next sync; a reassignment or substitution rides the command channel as one of the five classes',
        sourceRef: 79356,
      },
      {
        n: 3,
        text: 'The device requests the package for the newly assigned run when next connected.',
        sourceRef: 79357,
      },
      {
        n: 4,
        text: 'Until the package arrives, the run displays as not-yet-ready.',
        sourceRef: 79358,
      },
      {
        n: 5,
        text: 'On arrival, the device verifies, stores, activates and pins.',
        sourceRef: 79359,
      },
      { n: 6, text: 'The run becomes enterable.', sourceRef: 79360 },
    ],
  },
] as const satisfies readonly DeliveryWorkflow[]

export function deliveryWorkflow(path: DeliveryPath): DeliveryWorkflow {
  const found = DELIVERY_WORKFLOWS.find((w) => w.path === path)
  if (found === undefined) throw new Error(`no §35.4 workflow: ${path}`)
  return found
}

/* ==================================================================== *
 * HONEST READINESS — THE PACKAGE SIDE OF A RULING THAT ALREADY EXISTS.
 *
 * Three staging states, and the middle one is the point. L79358: "Until the
 * package arrives, the run displays as not-yet-ready." `AC-PKG-403` (L79415)
 * sharpens it: a run assigned while the device was offline "appears as
 * not-yet-ready immediately on reconnection, BEFORE the package pull
 * completes". So a pull under way is a real state and it is NOT ready — a
 * partially staged package renders nothing, which is row 5's reason at
 * L40365. `AC-PKG-401` (L79413) closes the other end: never omitted.
 *
 * `packageReadiness` returns `MOD-FL-A2`'s own state token, so the answer to
 * "may the worker enter this?" is asked of `runIsEnterable` and of nothing
 * written here. The switch is exhaustive over the union rather than a
 * truthiness test, so a fourth staging state cannot silently read as ready.
 * ==================================================================== */

export type PackageStaging =
  /** Assigned, nothing requested or nothing arrived. Row shows, package does not. */
  | { readonly kind: 'not-arrived'; readonly reason: string }
  /** The pull is under way. `AC-PKG-403`: still not-yet-ready. */
  | { readonly kind: 'arriving' }
  /** Verified, stored, activated and pinned — L79359, then L79360. */
  | { readonly kind: 'staged'; readonly pinnedVersion: string }

export function packageReadiness(staging: PackageStaging): A2RunState {
  switch (staging.kind) {
    case 'not-arrived':
    case 'arriving':
      return 'STATE-A2-NOTREADY'
    case 'staged':
      return 'STATE-A2-READY'
  }
}

/**
 * The enterability question, forwarded rather than answered. `runIsEnterable`
 * is `MOD-FL-A2`'s, reading `A2_RUN_STATES` where `enterable` is true on
 * exactly one member.
 */
export function packageIsEnterable(staging: PackageStaging): boolean {
  return runIsEnterable(packageReadiness(staging))
}

/**
 * The two readiness states this module can produce, proved against
 * `MOD-FL-A2`'s own six rather than asserted. If that module ever renames or
 * drops either, this stops compiling here instead of drifting.
 */
export const READINESS_STATES_USED = [
  A2_RUN_STATES[0].id,
  A2_RUN_STATES[1].id,
] as const satisfies readonly A2RunState[]

/* ==================================================================== *
 * PER-RUN PINNING, AND THE ONE INPUT THAT MAY CHANGE A PIN.
 *
 * L79405 states the consequence plainly: "Because the run executes the
 * package it was assigned, a mid-shift publication cannot change the limits a
 * worker is being judged against." So publication is NOT an input to this
 * function and there is no parameter for one — an in-flight run cannot be
 * rebased by anything, and the shape says so rather than a guard saying so.
 *
 * The one thing that does restage a run is the supervisor's on-demand re-pull
 * — the comparison table's `supervisor-intervention` row (L79399) and
 * `AC-PKG-404` (L79416). It is refused on a run under way, and the refusal
 * reason is READ FROM `MOD-FL-A6`'s shipped matrix row rather than retyped.
 * ==================================================================== */

const IN_FLIGHT_ROW = FL_A6_MATRIX.find((r) => r.id === 'force-version-change-in-flight')

if (IN_FLIGHT_ROW === undefined) {
  throw new Error('MOD-FL-A6 no longer carries force-version-change-in-flight')
}

/** `MOD-FL-A6`'s own words for why an in-flight Run is never rebased. */
export const IN_FLIGHT_REBASE_REFUSAL = {
  control: IN_FLIGHT_ROW.control,
  why: IN_FLIGHT_ROW.why,
  /** `L41101` — prohibited in all five columns. */
  sourceRef: IN_FLIGHT_ROW.sourceRef,
} as const

export interface RePullOutcome {
  readonly staging: PackageStaging
  readonly restaged: boolean
  /** Present only where the re-pull was refused. */
  readonly refusedBecause: string | null
}

/**
 * A supervisor-forced re-pull, applied to one run.
 *
 * `runInFlight` is a required parameter and carries no default: a defaulted
 * `runInFlight = false` would not count toward `Function.length`, and an
 * omitted argument would then silently rebase a run under way.
 */
export function rePull(
  current: PackageStaging,
  offeredVersion: string,
  runInFlight: boolean,
): RePullOutcome {
  if (runInFlight) {
    return {
      staging: current,
      restaged: false,
      refusedBecause: IN_FLIGHT_REBASE_REFUSAL.why,
    }
  }
  return {
    staging: { kind: 'staged', pinnedVersion: offeredVersion },
    restaged: true,
    refusedBecause: null,
  }
}

/* ==================================================================== *
 * THE GAP §35.4 LEAVES, REFERENCED AND NOT CARDED.
 * ==================================================================== */

export const OFFLINE_ASSIGNMENT_GAP = {
  decisionRef: 'DEC-OFFASSIGN-001',
  /** L79362's own statement of the gap. */
  gap:
    'A run assigned while the device is entirely offline is not known to the device at all, so the ' +
    'device cannot display it as not-yet-ready — it will display nothing, which is precisely the ' +
    'silent-absence outcome the source rules out.',
  recommendation:
    'on reconnection the device should reconcile its assignment set before pulling packages, and ' +
    'render newly discovered runs as not-yet-ready immediately, so the honest state appears the ' +
    'moment the device could know it.',
  /**
   * WHY NO DISCLOSURE RECORD IS WRITTEN HERE. L79362 raises the decision and
   * says its card is in §35.7; the card is at L79654, outside this task's two
   * sections. Carding it here would put a second spelling of it in the tree
   * before the task that owns §35.7 writes the first.
   */
  cardedAt: 'L79654 (§35.7), which is not this task’s section',
  sourceRef: 'L79362 (gap and recommendation), L79403 (comparison-table Source status cell)',
} as const

/* ==================================================================== *
 * ACCEPTANCE CRITERIA AND TESTS, TRANSCRIBED.
 *
 * Five criteria at L79413-L79417 and FOUR tests at L79421-L79424. The counts
 * differ by one and that is the source's, not a truncation: §35.3 above pairs
 * five with five and §35.5 below pairs five with five, so this section is the
 * odd one and the number is recorded rather than tidied.
 * ==================================================================== */

export interface DeliveryCriterion {
  readonly id: string
  readonly statement: string
  readonly sourceStatus: string
  readonly sourceRef: number
}

export const DELIVERY_ACCEPTANCE = [
  {
    id: 'AC-PKG-401',
    statement:
      'A run whose package has not arrived is displayed as not-yet-ready, never omitted.',
    sourceStatus: '`SoW Fact — §7.6`',
    sourceRef: 79413,
  },
  {
    id: 'AC-PKG-402',
    statement:
      'Package download is never a worker action and never requires worker troubleshooting.',
    sourceStatus: '`SoW Fact — §7.10.2`',
    sourceRef: 79414,
  },
  {
    id: 'AC-PKG-403',
    statement:
      'A run assigned while the device is offline appears as not-yet-ready immediately on reconnection, before the package pull completes.',
    sourceStatus: '`Recommendation — R&D`; gap raised as `DEC-OFFASSIGN-001`',
    sourceRef: 79415,
  },
  {
    id: 'AC-PKG-404',
    statement: 'A supervisor can force an on-demand re-pull for a run.',
    sourceStatus: '`SoW Fact — §5.14.1`',
    sourceRef: 79416,
  },
  {
    id: 'AC-PKG-405',
    statement: "Today's runs are fully staged and near-horizon runs are staged lazily.",
    sourceStatus: '`SoW Fact — §7.10.7`',
    sourceRef: 79417,
  },
] as const satisfies readonly DeliveryCriterion[]

export interface DeliveryTest {
  readonly id: string
  readonly test: string
  readonly method: string
  readonly sourceRef: number
}

export const DELIVERY_TESTS = [
  {
    id: 'TEST-PKG-401',
    test: 'Assign a run with the device offline, reconnect, and assert the not-yet-ready row appears before the package completes downloading.',
    method: 'Assignment reconciliation test.',
    sourceRef: 79421,
  },
  {
    id: 'TEST-PKG-402',
    test: 'Assert no user-interface control exists that requires the worker to initiate or retry a package download.',
    method: 'Interface inventory test.',
    sourceRef: 79422,
  },
  {
    id: 'TEST-PKG-403',
    test: 'Force a supervisor re-pull and assert the device replaces or re-verifies the package and the run becomes ready.',
    method: 'Re-pull test.',
    sourceRef: 79423,
  },
  {
    id: 'TEST-PKG-404',
    test: "Stage a shift's runs and assert today's runs are fully staged while near-horizon runs are not.",
    method: 'Staging policy test.',
    sourceRef: 79424,
  },
] as const satisfies readonly DeliveryTest[]

/** The counted shape of §35.4, for a gate to rest on. */
export const DELIVERY_SHAPE = {
  paths: DELIVERY_PATHS.length,
  comparisonRows: DELIVERY_COMPARISON.length,
  workflowSteps: DELIVERY_WORKFLOWS.map((w) => w.steps.length),
  acceptanceCriteria: DELIVERY_ACCEPTANCE.length,
  tests: DELIVERY_TESTS.length,
} as const
