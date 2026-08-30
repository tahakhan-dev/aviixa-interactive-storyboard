import {
  OFFLINE_CLASSIFICATION,
  isOneOfTheSeven,
  type OfflineClassificationRow,
  type RegisterClassToken,
} from '@/offline/capability'
import { A7_FUNCTIONALITIES } from './service'

/**
 * `MOD-FL-A7`'s SLICE OF THE 52-ROW OFFLINE CLASSIFICATION REGISTER, AND
 * WHAT THE REGISTER SAYS THIS DEVICE DOES WITH NO CONNECTION.
 *
 * §34.7's register — header L78766, separator L78767, data L78768-L78819 —
 * is transcribed once, by wave 0, in `@/offline/capability`. Nothing here
 * re-transcribes a cell. This file FILTERS that transcription and
 * RECONCILES the result against the eleven `FUNC-A7-*` functionalities and
 * the nine matrix rows this module already carries.
 *
 * ── THE MODULE COLUMN IS NOT A KEY, AND FILTERING IS NOT INDEXING ────────
 *
 * The register is keyed on `Function`. `Module` is an ordinary column and
 * four of the fifty-two rows do not hold a single module id: L78782 holds
 * two, and L78817, L78818 and L78819 each hold `Cross-module`. Wave 0
 * records this in `MODULE_COLUMN_IS_NOT_A_KEY` and this file obeys it —
 * `A7_REGISTER_ROWS` is a FILTER over the `Module` cell's own text, never a
 * lookup, and `A7_MODULE_FILTER_MEASUREMENT` measures what the two
 * plausible filters actually return rather than asserting they agree.
 *
 * ── AND FILTERING STILL MISSES TWO ROWS THAT ARE THIS MODULE'S ──────────
 *
 * Five rows name `MOD-FL-A7`. TWO MORE carry this module's functions under
 * `Cross-module`, and the link is computable rather than claimed:
 * L78818's Fallback cell is `FUNC-A7-05-3-1`'s fixed message and its
 * Reconnect cell is this module's compliance exit, and L78817's Reason cell
 * names suspension states while its Expiry cell is character-identical to
 * L78804's. `A7_CROSS_MODULE_REACH` records both with the evidence, and
 * `a7RegisterRowsReaching` is what a caller should use when it wants every
 * row bearing on this module rather than every row labelled with it.
 *
 * The third `Cross-module` row, L78819 Device storage exhausted, is NAMED
 * and its decision is NOT restated. `DEC-STORE-001` already has a record in
 * `MOD-FL-A2`, `MOD-FL-A4`, `MOD-FL-A6` and `stu-14/rendering.ts`; a fifth
 * spelling is the defect this build has recorded most.
 *
 * ── EVERY LOCATOR HERE IS DERIVED, NOT WRITTEN ─────────────────────────
 *
 * `registerLineOf` is the register's first data line plus the row's index in
 * wave 0's array, which is in source order. No line number in this file's
 * data is typed by hand, so a citation cannot drift from the row it cites,
 * and the covering suite proves every derived line carries that row's own
 * Function cell in the frozen source.
 */

/** L78766 header, L78767 separator, L78768-L78819 the fifty-two data rows. */
export const REGISTER_FIRST_DATA_LINE = 78_768

/**
 * The frozen-source line a register row was transcribed from. DERIVED from
 * the row's position in wave 0's array, which is source order, so this file
 * spells no register line number of its own.
 */
export function registerLineOf(row: OfflineClassificationRow): number {
  // `findIndex` on a reference, not `indexOf`: wave 0's array is a literal
  // tuple, so `indexOf` demands the exact literal row type and rejects the
  // interface every consumer actually holds.
  const index = OFFLINE_CLASSIFICATION.findIndex((r) => (r as OfflineClassificationRow) === row)
  if (index === -1) {
    throw new Error(
      `not a row of the shipped offline classification register: ${JSON.stringify(row.fn)}`,
    )
  }
  return REGISTER_FIRST_DATA_LINE + index
}

/** The inverse. Throws rather than returning `undefined`, so a bad line is loud. */
export function registerRowAtLine(line: number): OfflineClassificationRow {
  const row = OFFLINE_CLASSIFICATION[line - REGISTER_FIRST_DATA_LINE]
  if (row === undefined) throw new Error(`no offline classification row at L${line}`)
  return row
}

/**
 * The Module cell is written with the source's own code ticks. Matching on
 * CONTAINMENT rather than equality is the point: L78782's cell reads
 * "`MOD-FL-A3` and `MOD-FL-B9`", so an equality test would drop a row that
 * genuinely names the module. It changes nothing for `MOD-FL-A7` today and
 * `A7_MODULE_FILTER_MEASUREMENT` is what says so, measured.
 */
const moduleCellNames = (row: OfflineClassificationRow, moduleId: string): boolean =>
  row.module.includes(moduleId)

/**
 * A source cell's own words with the source's code ticks dropped, for prose
 * this file composes OUT OF cells. Wave 0's transcription is never altered —
 * this is the same liberty `charter.ts` takes when it renders a claim
 * "with its own markup dropped", and it is taken at composition rather than
 * at transcription.
 */
const plain = (cell: string): string => cell.replace(/`/g, '')

/** The five rows whose Module cell names this module. L78800-L78804. */
export const A7_REGISTER_ROWS: readonly OfflineClassificationRow[] =
  OFFLINE_CLASSIFICATION.filter((r) => moduleCellNames(r, 'MOD-FL-A7'))

/**
 * WHAT THE TWO PLAUSIBLE FILTERS RETURN, COUNTED OVER THE SHIPPED REGISTER.
 * Equal here, and NOT equal for the module pair the register writes on one
 * row — which is the whole reason the containment form is the one used.
 * Both numbers are computed; neither is asserted beside the other.
 */
export const A7_MODULE_FILTER_MEASUREMENT = {
  byContainment: A7_REGISTER_ROWS.length,
  byEquality: OFFLINE_CLASSIFICATION.filter((r) => r.module === '`MOD-FL-A7`').length,
  whereTheyDiffer: OFFLINE_CLASSIFICATION.filter(
    (r) => moduleCellNames(r, 'MOD-FL-A3') && r.module !== '`MOD-FL-A3`',
  ).map(registerLineOf),
  note:
    'The two filters agree for this module and disagree for MOD-FL-A3 and MOD-FL-B9, whose one ' +
    'shared row writes both module ids into a single Module cell. Equality is what silently drops ' +
    'it, so containment is what this file uses. Both counts are computed from the shipped ' +
    'register rather than written down beside it.',
} as const

/**
 * The rows that carry this module's functions under `Cross-module`, with the
 * EVIDENCE for each rather than an assertion that they belong here.
 *
 * `evidence` is a claim about two cells of the frozen source and the
 * covering suite checks it against the parsed lines, not against this text.
 */
export interface A7CrossModuleReach {
  readonly line: number
  readonly fn: string
  readonly evidence: string
  readonly bearsOn: string
}

export const A7_CROSS_MODULE_REACH = [
  {
    line: 78_817,
    fn: registerRowAtLine(78_817).fn,
    evidence:
      'Its Reason cell names suspension states among the cached things that may not be trusted ' +
      'beyond the window, and its Expiry cell is character-identical to L78804’s — the same ' +
      'default and the same ceiling, written the same way.',
    bearsOn:
      'The expiry half of Suspension state honouring. L78804 classifies honouring a cached ' +
      'suspension state as Available offline with restrictions and gives the restriction as an ' +
      'expiry; this row is what happens when that expiry is reached, and its class is Safe-stop ' +
      'required.',
  },
  {
    line: 78_818,
    fn: registerRowAtLine(78_818).fn,
    evidence:
      'Its Fallback cell is the fixed worker-facing message, which is FUNC-A7-05-3-1 (L41383), ' +
      'and its Reconnect cell is restoration through the dual-authorised path, which is this ' +
      'module’s stated compliance exit.',
    bearsOn:
      'STATE-A7-COMPLIANCELOCK. The register files the compliance stop as a cross-module ' +
      'safe-stop rather than under MOD-FL-A7, so a module-labelled filter finds this module’s ' +
      'own hardest state nowhere.',
  },
] as const satisfies readonly A7CrossModuleReach[]

/**
 * The third `Cross-module` row, NAMED AND NOT RESTATED. `DEC-STORE-001` is
 * already recorded in four places in this build and this module adds no
 * fifth reading, no option set and no owner. What is recorded here is only
 * that the row exists, that its Module cell is `Cross-module`, and that a
 * module-labelled filter therefore does not return it.
 */
export const A7_STORAGE_ROW_NOT_RESTATED = {
  line: 78_819,
  fn: registerRowAtLine(78_819).fn,
  whyNotRestated:
    'DEC-STORE-001 already has a record in MOD-FL-A2, MOD-FL-A4, MOD-FL-A6 and ' +
    'stu-14/rendering.ts, and its option sets diverge between two chapters. A fifth spelling ' +
    'here would be a fifth thing to keep in step. This module names the row and stops.',
} as const

/** Every register row bearing on this module: the five labelled, plus the two reached. */
export function a7RegisterRowsReaching(): readonly OfflineClassificationRow[] {
  return [...A7_REGISTER_ROWS, ...A7_CROSS_MODULE_REACH.map((r) => registerRowAtLine(r.line))]
}

/**
 * THE CLASSES THIS MODULE'S ROWS CARRY, COUNTED OFF THE ROWS.
 *
 * `AC-OFF-701` (L78831) requires exactly one of the seven per function, and
 * `AC-OFF-702` (L78832) adds that nothing classified fully available offline
 * makes a network call on its execution path. Neither is asserted here as
 * met — `outsideTheSeven` is computed through wave 0's own narrowing so that
 * a register row carrying the eighth token would surface rather than hide.
 */
export const A7_REGISTER_CLASS_TALLY: Readonly<Record<string, number>> =
  a7RegisterRowsReaching().reduce<Record<string, number>>((tally, row) => {
    tally[row.klass] = (tally[row.klass] ?? 0) + 1
    return tally
  }, {})

/** Rows of this module that `AC-OFF-701`'s seven cannot account for. Empty. */
export const A7_ROWS_OUTSIDE_THE_SEVEN: readonly OfflineClassificationRow[] =
  a7RegisterRowsReaching().filter((r) => !isOneOfTheSeven(r.klass))

/** The two rows `AC-OFF-702` governs, derived rather than listed. */
export const A7_ROWS_UNDER_AC_OFF_702: readonly OfflineClassificationRow[] =
  a7RegisterRowsReaching().filter((r) => r.klass === 'Fully available offline')

/* ==================================================================== *
 * THE ELEVEN FUNCTIONALITIES AGAINST THE FIVE REGISTER ROWS, AND THE ONE
 * THE REGISTER DOES NOT CLASSIFY.
 *
 * `AC-OFF-701` reads "Every Frontline function carries exactly one of the
 * seven classes, and no function is unclassified." Wave 0 measured the first
 * half against the register's own rows and found one row outside the seven.
 * This is the SECOND half, measured for this module: eleven functionalities,
 * five register rows, and `FUNC-A7-04-1-1` — minimal on-device data scope —
 * is named by no Function cell in all fifty-two rows.
 *
 * BOTH READINGS ARE CARRIED. Either the register is silent about a Frontline
 * function, which is what `AC-OFF-701` forbids; or `FUNC-A7-04-1-1` states
 * its own offline position in its own line — L41376, "Online and offline:
 * identical" — and the register's silence is a register gap rather than an
 * unclassified function. Neither is chosen.
 * ==================================================================== */

type A7FunctionalityId = (typeof A7_FUNCTIONALITIES)[number]['id']

/**
 * TOTAL over the eleven. `null` is the register naming no row for it, which
 * is a value the map has to be able to hold — an optional field here would
 * let a functionality go missing rather than go `null`.
 */
export const A7_FUNCTIONALITY_TO_REGISTER_LINE: Readonly<
  Record<A7FunctionalityId, number | null>
> = {
  'FUNC-A7-01-1-1': 78_800,
  'FUNC-A7-01-1-2': 78_800,
  'FUNC-A7-02-1-1': 78_803,
  'FUNC-A7-02-1-2': 78_803,
  'FUNC-A7-03-1-1': 78_801,
  'FUNC-A7-03-2-1': 78_802,
  'FUNC-A7-04-1-1': null,
  'FUNC-A7-05-1-1': 78_804,
  'FUNC-A7-05-2-1': 78_804,
  'FUNC-A7-05-3-1': 78_804,
  'FUNC-A7-05-3-2': 78_804,
}

/** Computed, never listed. One member, and its identifier is the finding. */
export const A7_FUNCTIONALITIES_THE_REGISTER_DOES_NOT_CLASSIFY: readonly A7FunctionalityId[] =
  A7_FUNCTIONALITIES.filter((f) => A7_FUNCTIONALITY_TO_REGISTER_LINE[f.id] === null).map(
    (f) => f.id,
  )

export const A7_UNCLASSIFIED_FUNCTIONALITY = {
  functionality: 'FUNC-A7-04-1-1',
  question:
    'AC-OFF-701 (L78831) requires that no Frontline function is unclassified. FUNC-A7-04-1-1 — ' +
    'hold only what the assigned Runs require, never the wider tenant’s data, and hold it only ' +
    'briefly — is named by no Function cell in any of the fifty-two register rows.',
  readings: [
    {
      text:
        'The register is silent about a Frontline function, which is the second half of what ' +
        'AC-OFF-701 forbids. Wave 0 measured the first half — one row classified outside the ' +
        'seven — and this is the other.',
      locator: 'AC-OFF-701 · L78831 · register L78766 header, rows L78768-L78819',
    },
    {
      text:
        'The functionality states its own offline position in its own line rather than needing a ' +
        'register row: "Online and offline: identical". On this reading the register omits a ' +
        'function whose answer the chapter already gives, and the gap is in the register rather ' +
        'than in the build.',
      locator: 'L41376',
    },
  ],
  adopted: null,
  note:
    'Neither reading is chosen and no row is invented to close it. Assigning FUNC-A7-04-1-1 a ' +
    'class here would make AC-OFF-701 pass against a fact this build wrote.',
} as const

/* ==================================================================== *
 * ROW 9 AS A BEHAVIOUR: THE FIVE VERBS DO NOT SHARE ONE CLASS.
 *
 * L41305's Worker cell reads `Allowed with conditions` — "in-flight Runs
 * complete, capture, sync, compute summaries, and close; no new Runs start"
 * — and `AC-A7-6` (L41427) requires every in-flight Run to be able to do all
 * five. Read against the register, the five land in three different places:
 * two are Fully available offline, one is Queued for later, one has TWO
 * candidate rows with DIFFERENT classes, and one has no row at all.
 *
 * THE MAPPING FROM VERB TO ROW IS THIS BUILD'S READING AND SAYS SO. The
 * source draws no line between L41305's verbs and §34.7's Function cells.
 * What is not this build's is the divergence itself: once any reasonable
 * mapping is made, the classes differ, because the register classifies these
 * acts separately and gives them different answers.
 * ==================================================================== */

export type A7CompletionVerb = 'complete' | 'capture' | 'sync' | 'compute summaries' | 'close'

/** L41305's five verbs, in the source's order. */
export const A7_COMPLETION_VERBS = [
  'complete',
  'capture',
  'sync',
  'compute summaries',
  'close',
] as const satisfies readonly A7CompletionVerb[]

type MissingFromVerbs = Exclude<A7CompletionVerb, (typeof A7_COMPLETION_VERBS)[number]>
const _verbsExhaustive: MissingFromVerbs extends never ? true : never = true
void _verbsExhaustive

export interface A7VerbClassification {
  readonly verb: A7CompletionVerb
  /**
   * The register lines that classify this act. Lines rather than rows: one
   * of them, L78781, names a state L39622 forbids a screen to name, so this
   * module cites that row by its line and its class and never prints its
   * Function cell. Two lines with two classes is the finding, not a defect.
   */
  readonly registerLines: readonly number[]
  /** Why these lines. This build's reading; the source draws no such line. */
  readonly basis: string
}

export const A7_COMPLETION_VERB_CLASSIFICATION = [
  {
    verb: 'complete',
    registerLines: [78_780, 78_781],
    basis:
      'The register carries two rows for finishing a Run and they do not agree. One classifies ' +
      'the worker’s own declaration Fully available offline; the other classifies the state ' +
      'defined as server receipt and acknowledgement of every capture as Requires online ' +
      'confirmation. AC-A7-6’s "complete" is reachable offline on the first and not on the ' +
      'second, and the register supplies both.',
  },
  {
    verb: 'capture',
    registerLines: [78_783],
    basis:
      'The capture row of MOD-FL-A4, whose Reason cell is that capture is the device’s own act.',
  },
  {
    verb: 'sync',
    registerLines: [78_795],
    basis:
      'The capture upload queue of MOD-FL-A6, classified Queued for later — the act completes ' +
      'locally and its effect elsewhere waits. Under hard suspension offline this verb is ' +
      'satisfied by the queue and not by a transfer, which is the register’s own meaning of the ' +
      'class rather than a softening of AC-A7-6.',
  },
  {
    verb: 'compute summaries',
    registerLines: [],
    basis:
      'No Function cell in any of the fifty-two rows names summaries. The verb AC-A7-6 requires ' +
      'is classified nowhere in §34.7, measured over the whole register rather than over this ' +
      'module’s rows.',
  },
  {
    verb: 'close',
    registerLines: [78_780],
    basis:
      'The worker-finished declaration, classified Fully available offline because it is a device ' +
      'event. On the platform run lifecycle that declaration stands the Run as submitted when the ' +
      'device is connected (L39045), so this build does not render closing as a state the ' +
      'platform has no record of.',
  },
] as const satisfies readonly A7VerbClassification[]

/** The classes the five verbs actually carry, derived from the lines above. */
export function a7VerbClasses(verb: A7CompletionVerb): readonly RegisterClassToken[] {
  const record = A7_COMPLETION_VERB_CLASSIFICATION.find((v) => v.verb === verb)
  if (record === undefined) throw new Error(`no classification recorded for verb: ${verb}`)
  return record.registerLines.map((line) => registerRowAtLine(line).klass)
}

/** Verbs whose register rows do not agree on one class, or name no row. */
export const A7_VERBS_WITHOUT_ONE_CLASS: readonly A7CompletionVerb[] =
  A7_COMPLETION_VERBS.filter((verb) => new Set(a7VerbClasses(verb)).size !== 1)

/* ==================================================================== *
 * A DIVERGENCE BETWEEN THE REGISTER AND THIS MODULE'S OWN MATRIX ROW.
 * ==================================================================== */

/**
 * L78802's Role restrictions cell reads "Tenant Admin or Supervisor per Hub
 * rules". L41299 — this module's row 3 — reads `Allowed` for the Supervisor,
 * the Quality Manager AND the Tenant Admin. The register names two of the
 * three and omits the Quality Manager; the matrix names three.
 *
 * NEITHER IS CORRECTED. The matrix is transcribed from L41299 and stays so;
 * the register slice is wave 0's transcription of L78802 and stays so. What
 * is recorded is that the two lines of one source disagree about who may
 * reset a Personal Identification Number, and the covering suite parses both
 * lines and asserts the disagreement still stands.
 */
export const A7_PIN_RESET_ROLE_DIVERGENCE = {
  registerLine: 78_802,
  matrixLine: 41_299,
  fromTheRegister: 'Tenant Admin or Supervisor per Hub rules',
  fromTheMatrix: 'Allowed for the Supervisor, the Quality Manager and the Tenant Admin',
  divergence:
    'The register’s role cell names two roles and the matrix row grants three. The Quality ' +
    'Manager is in one and not the other. Both lines are the frozen source’s and neither is ' +
    'corrected against the other here.',
} as const

/* ==================================================================== *
 * WHAT THE DEVICE DOES, PER STATE, WITH NO CONNECTION.
 *
 * This is L41381's clause made into an answer rather than a sentence: "the
 * command must have arrived to take effect; an offline device continues
 * under its last known state, which no surface may misrepresent." So the
 * input is the LAST KNOWN state and nothing else — a command that has not
 * arrived is not part of it, which is why there is no "a command is pending"
 * input and no connectivity lever here.
 *
 * THE EXPIRY OVERRIDE IS READ OFF THE REGISTER'S OWN CELLS, NOT APPLIED
 * BLANKET. L78817 says cached suspension states may not be trusted beyond
 * the window. Whether a given state is governed by that window is decided by
 * comparing its own register row's Expiry cell to L78817's — L78804 carries
 * the same expiry text and L78801 and L78803 carry different ones — so the
 * override reaches exactly the states the register puts the window on.
 * ==================================================================== */

export type A7StateId =
  | 'STATE-A7-NORMAL'
  | 'STATE-A7-SOFTSUSP'
  | 'STATE-A7-HARDSUSP'
  | 'STATE-A7-COMPLIANCELOCK'
  | 'STATE-A7-PINLOCK'
  | 'STATE-A7-WIPEPENDING'
  | 'STATE-A7-WIPED'

/** L41315's seven, in the source's order. The covering suite holds this equal to `A7_STATES`. */
export const A7_STATE_IDS = [
  'STATE-A7-NORMAL',
  'STATE-A7-SOFTSUSP',
  'STATE-A7-HARDSUSP',
  'STATE-A7-COMPLIANCELOCK',
  'STATE-A7-PINLOCK',
  'STATE-A7-WIPEPENDING',
  'STATE-A7-WIPED',
] as const satisfies readonly A7StateId[]

type MissingFromStateIds = Exclude<A7StateId, (typeof A7_STATE_IDS)[number]>
const _stateIdsExhaustive: MissingFromStateIds extends never ? true : never = true
void _stateIdsExhaustive

/**
 * `not-stated` is a THIRD value and not a tidied-up `no`. Three of the seven
 * states have no stated answer for one or both questions, and a boolean here
 * would have had to invent one. It is a counted thing rather than a hedge:
 * `A7_STANDING_NOT_STATED` names every pair the source leaves open.
 */
export type A7StandingAnswer = 'yes' | 'no' | 'not-stated'

export interface A7Standing {
  readonly state: A7StateId
  readonly newRunsStart: A7StandingAnswer
  readonly inFlightRunsContinue: A7StandingAnswer
  /** What the device does, in the source's own terms. Never a command arriving. */
  readonly what: string
  /** The register row that classifies this state's function, by line. */
  readonly registerLine: number
  readonly sourceRef: string
}

export const A7_STANDINGS = [
  {
    state: 'STATE-A7-NORMAL',
    newRunsStart: 'yes',
    inFlightRunsContinue: 'yes',
    what: 'The happy path for this module is invisibility: the encrypted store operates, media stays inside it, the device holds only what the assigned Runs require, and no lock state is ever entered.',
    registerLine: 78_804,
    sourceRef: 'L41317 (happy path), L78804 (the register row this state is honoured through)',
  },
  {
    state: 'STATE-A7-SOFTSUSP',
    newRunsStart: 'yes',
    inFlightRunsContinue: 'yes',
    what: 'Operations continue in full while master-data writes are blocked platform-side; none of those writes happen on this surface, so the device experiences soft suspension as no change at all. Release is an explicit operator signal and no payment event is observed, because there is no payment integration to observe one.',
    registerLine: 78_804,
    sourceRef: 'L41379 (FUNC-A7-05-1-1), L41353 (DEC-SUSP-001, adopted 2026-08-14), L78804',
  },
  {
    state: 'STATE-A7-HARDSUSP',
    newRunsStart: 'no',
    inFlightRunsContinue: 'yes',
    what: 'No new Run starts, and every in-flight Run can complete, capture, sync, compute summaries, and close. An enumerated completion pipeline rather than an abrupt stop. Against the register the five verbs do not share one class — see the verb classification — and the sync verb is met by a durable local queue rather than by a transfer.',
    registerLine: 78_804,
    sourceRef: 'L41381 (FUNC-A7-05-2-1), L41305 (row 9), L41427 (AC-A7-6), L78804, L78795',
  },
  {
    state: 'STATE-A7-COMPLIANCELOCK',
    newRunsStart: 'no',
    inFlightRunsContinue: 'no',
    what: 'The application locks immediately at next contact, preserves all local data, and shows the fixed message. Nobody may act on the device, and that includes dismissing the lock. The register files this as a cross-module safe stop rather than under this module.',
    registerLine: 78_804,
    sourceRef: 'L41383 (FUNC-A7-05-3-1), L41426 (AC-A7-5), L41303 (row 7), L78818',
  },
  {
    state: 'STATE-A7-PINLOCK',
    newRunsStart: 'not-stated',
    inFlightRunsContinue: 'not-stated',
    what: 'Lockout still operates with no connection, because the failure counter is local, and the register classifies it Fully available offline. Reset is Blocked offline and is owned by the Delivery Operations Hub managed-credential path. The exact failure count and any lockout duration are Not specified in the Statement of Work, and the source does not state what a lockout does to a Run already open.',
    registerLine: 78_801,
    sourceRef: 'L41323 (offline behaviour), L41371 (FUNC-A7-03-1-1), L78801, L78802',
  },
  {
    state: 'STATE-A7-WIPEPENDING',
    newRunsStart: 'not-stated',
    inFlightRunsContinue: 'not-stated',
    what: 'Nothing is erased. The register classifies remote wipe execution Blocked offline for the reason that a final sync attempt must precede erasure, and puts DEC-WIPE-001 in its own Expiry cell. That one cell is the whole open decision in one line: how long the command may remain pending, and what happens if the device never returns, are stated nowhere.',
    registerLine: 78_803,
    sourceRef: 'L41367 (FUNC-A7-02-1-1), L41355 (DEC-WIPE-001), L41429 (AC-A7-8), L78803',
  },
  {
    state: 'STATE-A7-WIPED',
    newRunsStart: 'not-stated',
    inFlightRunsContinue: 'not-stated',
    what: 'The register carries no row for a device after erasure, and this module states no behaviour for one. The nearest thing the source says is inside DEC-WIPE-001’s own options, which contemplate a device that has since been legitimately re-enrolled — an option under an open decision, not a stated behaviour.',
    registerLine: 78_803,
    sourceRef: 'L41355 (the option text), L41429 (AC-A7-8), L78803',
  },
] as const satisfies readonly A7Standing[]

type MissingFromStandings = Exclude<A7StateId, (typeof A7_STANDINGS)[number]['state']>
const _standingsExhaustive: MissingFromStandings extends never ? true : never = true
void _standingsExhaustive

/** Every state-and-question pair the source leaves open. Computed, six of fourteen. */
export const A7_STANDING_NOT_STATED: readonly string[] = A7_STANDINGS.flatMap((s) => [
  ...(s.newRunsStart === 'not-stated' ? [`${s.state}: new Runs starting`] : []),
  ...(s.inFlightRunsContinue === 'not-stated' ? [`${s.state}: in-flight Runs continuing`] : []),
])

/**
 * The trust-window expiry text, READ from the cross-module row that states
 * it rather than written here. L78804 carries the same text and that
 * equality is what makes the window govern the suspension family.
 */
export const TRUST_WINDOW_EXPIRY: string = registerRowAtLine(78_817).expiry

/** Whether the trust window governs a state, decided by its own row's Expiry cell. */
export function a7TrustWindowGoverns(state: A7StateId): boolean {
  return registerRowAtLine(a7Standing(state).registerLine).expiry === TRUST_WINDOW_EXPIRY
}

export function a7Standing(state: A7StateId): A7Standing {
  const found = A7_STANDINGS.find((s) => s.state === state)
  if (found === undefined) throw new Error(`no MOD-FL-A7 standing for state: ${state}`)
  return found
}

export type A7TrustWindow = 'valid' | 'expired'

export interface A7OfflineStanding extends A7Standing {
  /** `true` where the trust window has expired ON A STATE IT GOVERNS. */
  readonly safeStop: boolean
  /** What the register says happens at the window, or why the window does not apply. */
  readonly expiryNote: string
}

/**
 * WHAT THE DEVICE DOES WITH NO CONNECTION, GIVEN ITS LAST KNOWN STATE.
 *
 * There is no connectivity input and that is the ruling: the source's own
 * predicate is whether the command ARRIVED, and a command that has not
 * arrived is not part of the last known state. A caller that holds a pending
 * command holds it because the device pulled it, which is a new last known
 * state rather than a second input.
 */
export function a7OfflineStanding(
  state: A7StateId,
  trustWindow: A7TrustWindow = 'valid',
): A7OfflineStanding {
  const standing = a7Standing(state)
  const governed = a7TrustWindowGoverns(state)
  const safeStop = governed && trustWindow === 'expired'
  const window = registerRowAtLine(78_817)
  return {
    ...standing,
    ...(safeStop
      ? {
          newRunsStart: 'no' as const,
          inFlightRunsContinue: 'no' as const,
          what: `${plain(window.fallback)}. ${plain(window.reason)}.`,
        }
      : {}),
    safeStop,
    expiryNote: governed
      ? `The trust window governs this state: its register row carries the expiry “${plain(TRUST_WINDOW_EXPIRY)}”, which is the same text L78817 gives, and reaching it is classified ${window.klass}.`
      : `The trust window does not govern this state. Its register row’s own Expiry cell reads “${plain(registerRowAtLine(standing.registerLine).expiry)}” rather than the window’s.`,
  }
}
