import {
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'
import { FL_PLAYER_VIEWS, type FrontlinePlayerView } from '@/frontline/screens'

/**
 * `MOD-FL-A3`'S OWN LOGIC AND VOCABULARY. The forward drive, the eighteen
 * functionalities and what each one names as its fallback, the difficulty
 * substitution notice, and the two state inventories §25.5 holds for this
 * destination.
 */

/* ==================================================================== *
 * THE FORWARD DRIVE — THE HAPPY PATH, L40549-L40561.
 *
 * Thirteen numbered steps, and the last two are NOT DEVICE EVENTS. That is
 * the whole reason this carries a `heldBy` field instead of being a list of
 * strings: steps 12 and 13 describe the platform run record and the Delivery
 * Operations Hub, and a player rendering thirteen steps as thirteen things it
 * does claims two it does not. L40561 says so in its own words — "is a
 * Delivery Operations Hub concern, not a device event".
 * ==================================================================== */

export type SequenceActor = 'device' | 'server' | 'delivery-operations-hub'

export interface A3SequenceStep {
  readonly n: number
  /** The step, in the source's own words. */
  readonly text: string
  readonly actor: SequenceActor
  readonly sourceRef: string
}

export const A3_SEQUENCE = [
  { n: 1, text: 'The worker enters a ready Run from My Runs.', actor: 'device', sourceRef: 'L40549' },
  {
    n: 2,
    text: 'Shared mode presents identity re-confirmation at Run start.',
    actor: 'device',
    sourceRef: 'L40550',
  },
  {
    n: 3,
    text: "Where the Job's unit mode is serialized, the player opens a Unit Execution and the worker scans or identifies the piece.",
    actor: 'device',
    sourceRef: 'L40551',
  },
  {
    n: 4,
    text: "The player renders the first authored screen exactly as configured, with the work-instruction difficulty level the worker's profile selects.",
    actor: 'device',
    sourceRef: 'L40552',
  },
  {
    n: 5,
    text: "The worker captures the screen's data points and commits.",
    actor: 'device',
    sourceRef: 'L40553',
  },
  {
    n: 6,
    text: 'The on-device deterministic layer evaluates and, where configured, the authored branch routes the worker.',
    actor: 'device',
    sourceRef: 'L40554',
  },
  { n: 7, text: 'The player advances to the next screen.', actor: 'device', sourceRef: 'L40555' },
  {
    n: 8,
    text: 'Steps 4 to 7 repeat until the sequence completes for this unit.',
    actor: 'device',
    sourceRef: 'L40556',
  },
  {
    n: 9,
    text: 'For serialized work the player closes the Unit Execution and opens the next piece.',
    actor: 'device',
    sourceRef: 'L40557',
  },
  {
    n: 10,
    text: 'Where the Workflow requires it, an authored supervisor sign-off screen is presented and executed through the second-identity step-up, with a forced sync first.',
    actor: 'device',
    sourceRef: 'L40558',
  },
  {
    n: 11,
    text: 'The worker declares worker-finished, which stands the Run as `submitted`.',
    actor: 'device',
    sourceRef: 'L40559',
  },
  {
    n: 12,
    text: 'When every capture and evidence object for the Run has been received and acknowledged by the server, the Run moves to `complete`.',
    actor: 'server',
    sourceRef: 'L40560',
  },
  {
    n: 13,
    text: "`finished` follows automatically after the tenant's record-finish window, default 48 hours, and is a Delivery Operations Hub concern, not a device event.",
    actor: 'delivery-operations-hub',
    sourceRef: 'L40561',
  },
] as const satisfies readonly A3SequenceStep[]

/** The steps this device actually performs. Eleven of the thirteen. */
export function stepsThisDevicePerforms(
  steps: readonly A3SequenceStep[] = A3_SEQUENCE,
): readonly A3SequenceStep[] {
  return steps.filter((s) => s.actor === 'device')
}

/* ==================================================================== *
 * THE EIGHTEEN FUNCTIONALITIES, AND WHAT EACH NAMES AS ITS FALLBACK.
 *
 * `AC-FL-011-1` (L40151): "Every functionality in this chapter names at least
 * one `FB-FL-*` pattern." `patterns` below is not a judgement — it is every
 * `FB-FL-*` identifier that APPEARS in the functionality's own line, and the
 * suite re-extracts all eighteen sets from the frozen source with a regular
 * expression and compares. So the criterion is answered by counting rather
 * than by asserting it was met.
 *
 * TWO OF THE EIGHTEEN NAME NO PATTERN AT ALL, and that is a finding rather
 * than a transcription error. `FUNC-A3-03-3-1` (L40616) reads "Fallback: `Not
 * applicable — pre-commit editing touches no persisted record.`" and
 * `FUNC-A3-06-1-1` (L40633) reads "Fallback: `Not applicable — a prohibition
 * has no failure mode; its violation is a defect, caught by TEST-FL-002-2.`"
 * Both give a stated reason and neither names an `FB-FL-*` identifier, so
 * `functionalitiesNamingNoPattern` returns exactly those two. A third,
 * `FUNC-A3-03-2-1` (L40614), also opens "Not applicable" but names
 * `FB-FL-CAP-01` inside its clause — "which is FB-FL-CAP-01 territory" — so it
 * satisfies the criterion and is counted as naming that pattern.
 *
 * ONE FUNCTIONALITY IS NOT TRANSCRIBED, for the reason `charter.ts` gives at
 * length: `FUNC-A3-06-1-1`'s own sentence enumerates the excluded displays.
 * It is listed, located and explained instead.
 * ==================================================================== */

export interface A3Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim, or `null`. */
  readonly statement: string | null
  /** Required and non-null exactly when `statement` is null. */
  readonly whyNotTranscribed: string | null
  /** The functionality's own Fallback clause, verbatim, backticks stripped. */
  readonly fallbackClause: string
  /** Every `FB-FL-*` identifier that appears in the functionality's line. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

export const A3_FUNCTIONALITIES = [
  {
    id: 'FUNC-A3-01-1-1',
    statement:
      'Present Studio-authored screens exactly as configured, with a screen being one Step Execution that may carry several data points or actions.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-RENDER-01.',
    patterns: ['FB-FL-RENDER-01'],
    sourceRef: 'L40600',
  },
  {
    id: 'FUNC-A3-01-1-2',
    statement:
      'Render faithfully across device sizes — a 6-inch phone, a roughly 12-inch tablet, and a wall-mounted kiosk all render the same screens, laid out for the device.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-RENDER-01.',
    patterns: ['FB-FL-RENDER-01'],
    sourceRef: 'L40601',
  },
  {
    id: 'FUNC-A3-01-1-3',
    statement: "Refuse to lay out screens of the application's own invention.",
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-RENDER-01.',
    patterns: ['FB-FL-RENDER-01'],
    sourceRef: 'L40602',
  },
  {
    id: 'FUNC-A3-02-1-1',
    statement:
      'Open one Unit Execution per part; the worker scans or identifies the unit, and the steps that follow are bound to that serial.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-SCAN-01 for identification; FB-FL-CAP-01 for the record.',
    patterns: ['FB-FL-SCAN-01', 'FB-FL-CAP-01'],
    sourceRef: 'L40605',
  },
  {
    id: 'FUNC-A3-02-2-1',
    statement:
      'Bind captures at the lot level, with what constitutes a lot defined per tenant, per their practice — by batch, by shift, by material heat — as tenant configuration and never a platform-imposed definition.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-CAP-01.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L40607',
  },
  {
    id: 'FUNC-A3-02-3-1',
    statement:
      'Behave exactly as a simple Run with no unit, with the structure invisible where it does not apply.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-CAP-01.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L40609',
  },
  {
    id: 'FUNC-A3-03-1-1',
    statement: 'Advance the worker through the authored sequence.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-RENDER-01.',
    patterns: ['FB-FL-RENDER-01'],
    sourceRef: 'L40612',
  },
  {
    id: 'FUNC-A3-03-2-1',
    statement:
      'Let the worker look back at prior completed screens read-only, without any risk of silently altering a committed value.',
    whyNotTranscribed: null,
    fallbackClause:
      'Not applicable — review reads the local store and fails only if the store fails, which is FB-FL-CAP-01 territory.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L40614',
  },
  {
    id: 'FUNC-A3-03-3-1',
    statement: 'Permit free editing before commit.',
    whyNotTranscribed: null,
    fallbackClause: 'Not applicable — pre-commit editing touches no persisted record.',
    patterns: [],
    sourceRef: 'L40616',
  },
  {
    id: 'FUNC-A3-03-3-2',
    statement:
      'After commit, record a correction as an appended entry carrying who, when, and what changed, leaving the original immutable.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-CAP-01.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L40617',
  },
  {
    id: 'FUNC-A3-03-4-1',
    statement:
      'Honour authored branching as part of the package, including routing an out-of-tolerance measurement to a deviation-capture screen and presenting an authored Run-A or Run-B fork of a multi-run job.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-RENDER-01.',
    patterns: ['FB-FL-RENDER-01'],
    sourceRef: 'L40619',
  },
  {
    id: 'FUNC-A3-04-1-1',
    statement:
      'Select the level for the logged-in worker from the worker-profile parameter and render it like any other instruction content, offline, from the package.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-PKG-01.',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'L40622',
  },
  {
    id: 'FUNC-A3-04-1-2',
    statement: 'Render only released, approved instruction content.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-PKG-01.',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'L40623',
  },
  {
    id: 'FUNC-A3-05-1-1',
    statement:
      'Let the worker declare their part of the Run done, which on the platform run lifecycle stands the Run as `submitted`.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-CAP-01.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L40626',
  },
  {
    id: 'FUNC-A3-05-2-1',
    statement:
      'Reach complete-and-synced only when every capture and evidence object for the Run has been received and acknowledged by the server, which moves the Run to `complete`.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-UP-01.',
    patterns: ['FB-FL-UP-01'],
    sourceRef: 'L40628',
  },
  {
    id: 'FUNC-A3-05-3-1',
    statement:
      "Present a required supervisor sign-off as a screen type in its own right, executed through the second-identity step-up, capturing the supervisor's identity at the moment of sign-off without ending the worker's session, with a forced sync first.",
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40630',
  },
  {
    id: 'FUNC-A3-06-1-1',
    statement: null,
    whyNotTranscribed:
      'This functionality IS the categorical prohibition, and its own sentence enumerates each excluded display by name. Transcribing it would put those words on a worker-facing screen, which is what AC-FL-000-5 (L39100), AC-SCR-FL-002 (L48690) and AC-SCOPE-045 (L2683) forbid and what TEST-FL-000-3 (L39108) scans every rendered screen for. The rule it states is carried whole by the card statement at L40510 — "And at no point, ever, does it tell you how fast you are going." Open L40633 to read the enumeration.',
    fallbackClause:
      'Not applicable — a prohibition has no failure mode; its violation is a defect, caught by TEST-FL-002-2.',
    patterns: [],
    sourceRef: 'L40633',
  },
  {
    id: 'FUNC-A3-06-1-2',
    statement:
      'Let Studio-authored timing thresholds drive coaching while never surfacing the stopwatch.',
    whyNotTranscribed: null,
    fallbackClause: 'FB-FL-AI-01.',
    patterns: ['FB-FL-AI-01'],
    sourceRef: 'L40634',
  },
] as const satisfies readonly A3Functionality[]

/* ==================================================================== *
 * THREE READINGS OF "WHICH FALLBACK PATTERNS ARE THIS MODULE'S", AND NONE
 * OF THEM EQUALS ANOTHER. A FINDING, DISCLOSED RATHER THAN AVERAGED.
 *
 *   1. §22.9's MODULE MAP, which is what `patternsForModule('MOD-FL-A3')`
 *      reads: FB-FL-CORE-01 (L40130), FB-FL-PKG-01 (L40132),
 *      FB-FL-RENDER-01 (L40142), FB-FL-SCAN-01 (L40143). Four.
 *   2. THE MODULE'S OWN "Fallback identifier" LINE, L40592: RENDER-01
 *      primary, PKG-01, CORE-01, GATE-01, AI-01, SCAN-01. Six.
 *   3. THE EIGHTEEN FUNCTIONALITY CLAUSES, L40600-L40634: RENDER-01,
 *      SCAN-01, CAP-01, PKG-01, UP-01, AUTH-01, AI-01. Seven.
 *
 * Only three patterns appear in all three readings. `FB-FL-GATE-01` is on the
 * card and in neither of the others; `FB-FL-CAP-01`, `FB-FL-UP-01` and
 * `FB-FL-AUTH-01` are named by functionalities of this module and by neither
 * of the others; `FB-FL-CORE-01` is in the map and on the card and in no
 * functionality clause. The §22.9 map's own column is headed "primary"
 * modules, which explains part of the gap and does not close it: a pattern
 * four of this module's functionalities name is not a pattern this module has
 * no relationship with.
 *
 * The brief says `patternsForModule` is what a module reads, so that is what
 * the panel calls. All three readings render beside it with their own
 * locators. None is corrected into another.
 * ==================================================================== */

export const A3_MODULE_ID = 'MOD-FL-A3' as const

export interface FallbackReading {
  readonly label: string
  readonly patterns: readonly FrontlineFallbackId[]
  readonly locator: string
}

/** Reading 1, READ from wave 0 rather than transcribed a second time. */
export function a3MappedPatterns(): readonly FrontlineFallbackPattern[] {
  return patternsForModule(A3_MODULE_ID)
}

/** Reading 2, the module's own card line. */
export const A3_CARD_PATTERNS = [
  'FB-FL-RENDER-01',
  'FB-FL-PKG-01',
  'FB-FL-CORE-01',
  'FB-FL-GATE-01',
  'FB-FL-AI-01',
  'FB-FL-SCAN-01',
] as const satisfies readonly FrontlineFallbackId[]

/** Reading 3, DERIVED from the eighteen clauses so it cannot drift from them. */
export function a3FunctionalityPatterns(
  functionalities: readonly A3Functionality[] = A3_FUNCTIONALITIES,
): readonly FrontlineFallbackId[] {
  const seen = new Set<FrontlineFallbackId>()
  for (const f of functionalities) for (const p of f.patterns) seen.add(p)
  return [...seen]
}

export function a3FallbackReadings(): readonly FallbackReading[] {
  return [
    {
      label: 'The section 22.9 module map — what patternsForModule reads',
      patterns: a3MappedPatterns().map((p) => p.id),
      locator: 'map header L40128 · rows L40130, L40132, L40142, L40143',
    },
    {
      label: 'The module card’s own Fallback identifier line',
      patterns: A3_CARD_PATTERNS,
      locator: 'L40592',
    },
    {
      label: 'Every pattern the eighteen functionality clauses name',
      patterns: a3FunctionalityPatterns(),
      locator: 'L40600-L40634',
    },
  ]
}

/** The patterns every reading agrees on. Three of the eight. */
export function a3PatternsAllThreeReadingsAgreeOn(): readonly FrontlineFallbackId[] {
  const [first, ...rest] = a3FallbackReadings()
  if (first === undefined) return []
  return first.patterns.filter((p) => rest.every((r) => r.patterns.includes(p)))
}

/* ==================================================================== *
 * `DEC-WIDIFF-001` — THE SUBSTITUTION NOTICE, NEVER A SILENT DOWNGRADE.
 *
 * The package carries all three levels until the decision resolves (L39889:
 * "until it resolves, the package definition carries all levels"; restated at
 * L40700 and L41162). `FUNC-A3-04-1-1` (L40622) states the consequence when it
 * does not: "where the package does not carry the worker's level, rendering
 * falls back to the standard level and RECORDS THE SUBSTITUTION, which is
 * `Derived Clarification` made necessary by `DEC-WIDIFF-001`."
 *
 * "Records the substitution" is why this returns a SENTENCE rather than a
 * level. A function returning the level to render would let a caller render it
 * and say nothing, which is the silent downgrade — the worker reads the
 * standard text believing it is theirs. The caller cannot get the level
 * without also getting the notice, and `null` means and only means that no
 * substitution happened.
 * ==================================================================== */

export type A3DifficultyLevel = 'simple' | 'standard' | 'expanded'

export const A3_DIFFICULTY_LEVELS = [
  'simple',
  'standard',
  'expanded',
] as const satisfies readonly A3DifficultyLevel[]

type MissingFromLevels = Exclude<A3DifficultyLevel, (typeof A3_DIFFICULTY_LEVELS)[number]>
const _levelsExhaustive: MissingFromLevels extends never ? true : never = true
void _levelsExhaustive

/** L40622's own fallback level. Not a choice this module makes. */
export const A3_SUBSTITUTION_LEVEL: A3DifficultyLevel = 'standard'

export interface DifficultyRendering {
  readonly rendered: A3DifficultyLevel
  /** `null` only when the worker's own level was rendered. Never blank. */
  readonly substitutionNotice: string | null
}

export function renderDifficultyLevel(
  workerLevel: A3DifficultyLevel,
  packageCarries: readonly A3DifficultyLevel[],
): DifficultyRendering {
  if (packageCarries.includes(workerLevel)) {
    return { rendered: workerLevel, substitutionNotice: null }
  }
  return {
    rendered: A3_SUBSTITUTION_LEVEL,
    substitutionNotice:
      `Your instructions are set to the ${workerLevel} level and this work package does not ` +
      `carry it, so the ${A3_SUBSTITUTION_LEVEL} level is shown instead and the substitution is ` +
      'recorded on this step. The captures, gates, limits and severity mappings are identical at ' +
      'every level — only the depth of explanation changes. [FUNC-A3-04-1-1 L40622 · DEC-WIDIFF-001]',
  }
}

/* ==================================================================== *
 * TWO STATE INVENTORIES, BOTH §25.5, BOTH INTERNALLY CORRECT, DIFFERENT.
 *
 * The stateDiagram at L48555-L48596 names FIFTEEN execution states and L48553
 * introduces it as "the authoritative model". The table at L48661-L48673 is
 * THIRTEEN rows, `STATE-01`..`STATE-13`, introduced at L48657 as "every one of
 * the thirteen states". Neither count is wrong: they inventory different
 * things. The fifteen are places a worker STANDS during execution — step
 * rendering, unit binding, capturing, gate blocked, hold placed. The thirteen
 * are CONDITIONS A SCREEN IS IN — empty, loading, success, validation,
 * permission-denied, read-only, offline, stale-data, queued, two degraded
 * reasoning states, failure, recovery — the same thirteen this build renders
 * per screen on every other surface.
 *
 * WHICH THIS MODULE KEYS ON, AND WHY: the FIFTEEN. `MOD-FL-A3` is the
 * execution spine, its own card states eight `STATE-A3-*` player states
 * (L40545), and every one of those eight maps onto a node of the fifteen. The
 * thirteen are keyed on `SCR-FL-03` — the ROUTE — which six modules share;
 * keying a module panel on them would have this module answer for the screen
 * conditions of the other five. Both are named here with their locators and
 * neither is corrected into the other.
 * ==================================================================== */

export interface StateInventoryReading {
  readonly label: string
  readonly count: number
  readonly inventoryOf: string
  readonly locator: string
}

export const A3_STATE_INVENTORY_READINGS = [
  {
    label: 'The execution stateDiagram',
    count: 15,
    inventoryOf: 'places a worker stands in while executing a Run',
    locator: 'introduced L48553 · diagram L48555-L48596 · state names L48558-L48572',
  },
  {
    label: 'The full state inventory for SCR-FL-03',
    count: 13,
    inventoryOf: 'conditions the Run Player route can be in, STATE-01 to STATE-13',
    locator: 'introduced L48657 · table header L48659 · rows L48661-L48673',
  },
] as const satisfies readonly StateInventoryReading[]

export const A3_STATE_INVENTORY_KEYED_ON = 'The execution stateDiagram' as const

/* ==================================================================== *
 * THE §22.7 ROWS THIS PANEL IS THE STATE OF.
 *
 * `RUN_PLAYER_VIEWS` in `app/frontline/run-player/RunPlayerRoute.tsx` already
 * filters §22.7 down to the thirteen rows whose own Destination column reads
 * "Run Player", and that filter is NOT re-derived here. This selects FIVE of
 * those thirteen BY IDENTIFIER, and the suite asserts every one carries
 * `placement: 'run-player'` — the same predicate the route applies. Selecting
 * a subset by name is not re-deriving the rule that made the set.
 *
 * WHICH FIVE IS NOT A JUDGEMENT: §22.7 HAS A MODULE COLUMN AND IT SETTLES IT.
 * The rows whose Module column names `MOD-FL-A3` are L39869 (`SCR-FL-07`),
 * L39870 (`SCR-FL-08`), L39871 (`SCR-FL-09`), L39872 (`SCR-FL-10`) and
 * L39878 (`SCR-FL-16`). Five. The suite reads that column out of the frozen
 * source and compares, so this list cannot drift from it. L39869 is the one
 * row of the five whose Module column names a second module besides this one.
 *
 * THE SECOND MODULE IS NOT NAMED IN THE SENTENCE ABOVE, AND THAT IS
 * DELIBERATE. It used to be, parenthetically, and the parenthesis wrapped so
 * the identifier ended one line and `L39870` opened the next.
 * `tests/coverage/locator-fidelity.test.ts` pairs an identifier with the
 * nearest following line citation, read that pair as a claim about L39870, and
 * went red — correctly, on its own rule, against a comment that was accurate.
 * The prose moved rather than the gate: a proximity gate that stops pairing
 * across a line break stops catching the citation drift it exists to catch,
 * and 1,019 of this tree's 1,203 identifier-anchored citations rest on it.
 *
 * A CORRECTION, RECORDED BECAUSE IT WAS ALMOST SHIPPED. The first version of
 * this list also claimed `SCR-FL-17`, the version-change notice, reasoning
 * from `AC-A3-9` (L40681, "An in-flight Run is never re-based onto a new
 * workflow version") and this module's reconnect behaviour (L40569, which
 * names the version-change command). Both of those ARE this module's. The
 * SCREEN is not: L39879's Module column reads `MOD-FL-B10`, whose own
 * inventory line (L39855) reads "two-tier work-instruction change notices".
 * The rule is A3's and the notice is B10's, and the Module column is what
 * separated them — an inference from two true sentences had it wrong.
 *
 * THE EIGHT THIS MODULE DOES NOT CLAIM, because a silent omission reads the
 * same as an oversight: deviation capture (`SCR-FL-11`) and the containment
 * checklist (`SCR-FL-12`) are `MOD-FL-A5`'s; the coaching card (`SCR-FL-13`)
 * is `MOD-FL-B8`'s; the gate block (`SCR-FL-14`) and the supervisor sign-off
 * screen (`SCR-FL-15`) are `MOD-FL-B9`'s — L40575 lists `MOD-FL-B9` as this
 * module's dependency "for gates and sign-off", so the screen TYPE is authored
 * here and the AUTHORITY is theirs; the version-change notice (`SCR-FL-17`) is
 * `MOD-FL-B10`'s; and step-away (`SCR-FL-22`) and substitution handover
 * (`SCR-FL-23`) are `MOD-FL-B11`'s. This module renders the spine those states
 * interrupt and return to, and none of their material.
 * ==================================================================== */

export const A3_VIEW_IDS = [
  'SCR-FL-07',
  'SCR-FL-08',
  'SCR-FL-09',
  'SCR-FL-10',
  'SCR-FL-16',
] as const

export function a3RenderedViews(
  views: readonly FrontlinePlayerView[] = FL_PLAYER_VIEWS,
): readonly FrontlinePlayerView[] {
  return A3_VIEW_IDS.map((id) => {
    const found = views.find((v) => v.id === id)
    if (found === undefined) {
      throw new Error(`section 22.7 holds no row ${id}; MOD-FL-A3 and wave 0 disagree.`)
    }
    return found
  })
}

/* ==================================================================== *
 * THE NINE ACCEPTANCE CRITERIA, L40673-L40681.
 * `AC-A3-8` is listed, located, and deliberately not transcribed, for the
 * reason `charter.ts` gives.
 * ==================================================================== */

export interface A3AcceptanceCriterion {
  readonly id: string
  readonly criterion: string | null
  readonly whyNotTranscribed: string | null
  readonly sourceRef: string
}

export const A3_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-A3-1',
    criterion:
      'Every authored screen renders exactly as configured on a 6-inch phone, a roughly 12-inch tablet, and a kiosk, with no application-invented layout.',
    whyNotTranscribed: null,
    sourceRef: 'L40673',
  },
  {
    id: 'AC-A3-2',
    criterion: 'One rendered screen produces exactly one Step Execution record.',
    whyNotTranscribed: null,
    sourceRef: 'L40674',
  },
  {
    id: 'AC-A3-3',
    criterion:
      'Serialized work opens one Unit Execution per piece and binds subsequent captures to that serial; lot work binds at the lot; unit mode none renders no unit structure at all.',
    whyNotTranscribed: null,
    sourceRef: 'L40675',
  },
  {
    id: 'AC-A3-4',
    criterion:
      'Prior completed screens are reachable read-only with no edit affordance, and committed values cannot be altered in place at the storage layer.',
    whyNotTranscribed: null,
    sourceRef: 'L40676',
  },
  {
    id: 'AC-A3-5',
    criterion:
      'A correction creates an appended record carrying who, when, and what changed, and the original remains retrievable and unchanged.',
    whyNotTranscribed: null,
    sourceRef: 'L40677',
  },
  {
    id: 'AC-A3-6',
    criterion:
      'The rendered work-instruction difficulty level matches the worker-profile parameter, and only released, approved content renders.',
    whyNotTranscribed: null,
    sourceRef: 'L40678',
  },
  {
    id: 'AC-A3-7',
    criterion:
      'Worker-finished and complete-and-synced are distinct, and `finished` is never set by the device.',
    whyNotTranscribed: null,
    sourceRef: 'L40679',
  },
  {
    id: 'AC-A3-8',
    criterion: null,
    whyNotTranscribed:
      'The criterion’s own wording enumerates each excluded display by name. It is the criterion this module is held to and the enumeration is exactly what may not reach a worker-facing screen, so it is named and located rather than quoted. Open L40680 to read it.',
    sourceRef: 'L40680',
  },
  {
    id: 'AC-A3-9',
    criterion: 'An in-flight Run is never re-based onto a new workflow version.',
    whyNotTranscribed: null,
    sourceRef: 'L40681',
  },
] as const satisfies readonly A3AcceptanceCriterion[]

/**
 * `AC-FL-011-2` (L40152): every retry path has a bounded exit into a named
 * terminal safe state. This module's is stated twice and the two statements
 * are NOT identical, which is why both are carried instead of one being
 * quoted for the other.
 *
 * L40667, the module's own paragraph: "a blocked Run with complete, immutable
 * prior captures AND never a skipped gated step".
 * L40122, `FB-FL-RENDER-01` in the pattern library, which wave 0 transcribed
 * into `FL_FALLBACK_PATTERNS`: "a blocked Run with complete, immutable prior
 * captures; NEVER a skipped gated step".
 *
 * One connective apart, same safe state, and the suite asserts each string
 * against its OWN line rather than against the other. Nothing turns on the
 * difference; recording it costs a sentence, and assuming they matched is how
 * a citation ends up naming the line it was not read from.
 */
export const A3_TERMINAL_SAFE_STATE =
  'a blocked Run with complete, immutable prior captures and never a skipped gated step'
export const A3_TERMINAL_SAFE_STATE_REF = 'L40667'
/** Wave 0's transcription of the same safe state, from the pattern library. */
export const A3_TERMINAL_SAFE_STATE_PATTERN_WORDING =
  'a blocked Run with complete, immutable prior captures; never a skipped gated step'
export const A3_TERMINAL_SAFE_STATE_PATTERN_REF = 'L40122 (FB-FL-RENDER-01)'
