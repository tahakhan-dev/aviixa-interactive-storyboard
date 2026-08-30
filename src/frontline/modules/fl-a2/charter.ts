/**
 * `MOD-FL-A2` — My Runs. THE IDENTITY CARD, TRANSCRIBED, AND THE PER-RUN
 * STATE VOCABULARY THE CARD ITSELF CARRIES.
 *
 * Frozen source §22.11. Identity card L40347-L40355, on the alternating
 * text/blank-line rhythm the chapter uses throughout; the remaining card
 * fields carry their own lines and are cited individually.
 *
 * WHAT A READER OF THIS FILE HAS TO CARRY AWAY, AND IT IS THE ONE THING
 * THIS SCREEN IS MOST LIKELY TO GET WRONG. A work list is the single most
 * likely screen in this build to grow a pace figure, an elapsed time, a
 * "runs completed today" count or a ranking. `EXCL-FL-08` (L39491) makes
 * "Worker-facing pace, timer, or performance display" an INVARIANT
 * exclusion; `AC-FL-000-5` (L39100) forbids a pace figure, a countdown
 * against expectation and a comparison to another worker in any state of
 * any screen; `AC-SCOPE-045` (L2683) says the same at scope level; and this
 * module's OWN artificial-intelligence line (L40398) says that "introducing
 * a ranking model here would be work allocation by another name". The
 * module states all four rather than leaving the absence to be noticed.
 *
 * THE OTHER THING. Four different words describe the end of a Run and this
 * screen renders two of them, so `RUN_COMPLETION_WORDS` below carries all
 * four with their own lines. A list that says "Run complete" when the
 * worker has declared finished tells the worker the platform holds a record
 * it does not hold.
 *
 * WHAT "TRANSCRIBED" MEANS HERE, EXACTLY. Each statement's `text` is the
 * card field's own prose with the inline `[SoW Fact — §x.y]` classification
 * marker lifted out into `sourceClass` and the markdown emphasis dropped.
 * Nothing is trimmed to fit a card, nothing is paraphrased, nothing is
 * re-ordered. Every statement here renders on the view and the component
 * suite walks this list against the markup, because a claim held in data and
 * never drawn is a code comment rather than a disclosure.
 */

/** How the source classifies the claim, in the source's own vocabulary. */
export type A2SourceClass = 'SoW Fact' | 'Derived Clarification'

export interface A2CardStatement {
  /** The card field's own label, verbatim. */
  readonly field: string
  readonly text: string
  readonly sourceRef: string
  /**
   * The field's own inline `[SoW Fact — §x.y]` marker, lifted out.
   *
   * `null` WHERE THE CARD CARRIES NO MARKER, and that is a recorded absence
   * rather than a default. SEVEN of the fifteen fields below carry no
   * classification marker of their own — User benefit, Objects affected,
   * Artificial-intelligence behaviour, No-artificial-intelligence
   * behaviour, Security, Fallback identifier, and the Failure and terminal
   * safe state paragraph — and §22.11's Source status paragraph (L40505)
   * does not name them either. Filling those seven with `SoW Fact` because
   * their neighbours carry it would be this build inventing a
   * classification the source withheld. The covering suite counts the
   * markers off the lines rather than trusting this sentence; the first
   * version of it said five.
   */
  readonly sourceClass: A2SourceClass | null
  /** `true` for the five statements of the L40347-L40355 identity card. */
  readonly onTheCard: boolean
}

export const A2_CARD = [
  {
    field: 'Identifier and name',
    text: 'MOD-FL-A2. My Runs.',
    sourceRef: 'MOD-FL-A2 · L40347',
    sourceClass: 'SoW Fact',
    onTheCard: true,
  },
  {
    field: 'Purpose',
    text:
      'To present, honestly and without allocation, the work assigned to the logged-in identity, ' +
      'and to be the single list the worker manages.',
    sourceRef: 'L40349',
    sourceClass: 'SoW Fact',
    onTheCard: true,
  },
  {
    field: 'User benefit',
    text:
      'One screen, one list, no searching, no ambiguity about whether a job can be started, and no ' +
      "need ever to ask whether the tablet has sent the morning's work.",
    sourceRef: 'L40351',
    sourceClass: null,
    onTheCard: true,
  },
  {
    field: 'Owning surface',
    text:
      'Frontline Worker Application (SURF-FL). Assignment is owned by the Delivery Operations Hub; ' +
      'package production is owned by the Standards and Operations Studio.',
    sourceRef: 'L40353',
    sourceClass: 'SoW Fact',
    onTheCard: true,
  },
  {
    field: 'Roles that see and use it',
    text: 'Worker only.',
    sourceRef: 'L40355',
    sourceClass: 'SoW Fact',
    onTheCard: true,
  },
  {
    field: 'Preconditions',
    text:
      'An authenticated session exists. Assignments for the identity have reached the device, or the ' +
      'device holds a cached assignment set from a prior sync.',
    sourceRef: 'L40371',
    sourceClass: 'SoW Fact',
    onTheCard: false,
  },
  {
    field: 'Objects affected',
    text:
      'OBJ-FL-ASSIGNMENT the local assignment set; OBJ-FL-PKGSTATE per-Run package readiness; ' +
      "OBJ-FL-SYNCSTATE the sync indicator's backing state. No business object is mutated by this " +
      'module; it presents and selects.',
    sourceRef: 'L40377',
    sourceClass: null,
    onTheCard: false,
  },
  {
    field: 'Online behaviour',
    text:
      'Assignments and package readiness refresh continuously; lazily pulled packages download; the ' +
      'sync indicator shows online with a current last-synced time and a live pending count.',
    sourceRef: 'L40392',
    sourceClass: 'SoW Fact',
    onTheCard: false,
  },
  {
    field: 'Offline behaviour',
    text:
      'The list renders fully from the local store. Runs whose packages staged before the outage ' +
      'remain ready and enterable; Runs whose packages did not arrive remain honestly not-yet-ready ' +
      'and cannot be entered. The sync indicator shows offline, the last-synced time, and the ' +
      'pending count.',
    sourceRef: 'L40394',
    sourceClass: 'SoW Fact',
    onTheCard: false,
  },
  {
    field: 'Reconnect behaviour',
    text:
      'Pending packages download and Runs transition from not-yet-ready to ready; new assignments ' +
      'appear; pending captures upload and the pending count falls; command-channel actions ' +
      "affecting the list apply at safe boundaries with a plain explanation where the worker's work " +
      'changes.',
    sourceRef: 'L40396',
    sourceClass: 'SoW Fact',
    onTheCard: false,
  },
  {
    field: 'Artificial-intelligence behaviour',
    text:
      'Not applicable — no artificial-intelligence capability participates in assignment, ordering, ' +
      'readiness, or selection on this surface. Ordering presents what the Delivery Operations Hub ' +
      'assigned; introducing a ranking model here would be work allocation by another name, which ' +
      '§7.1.5 excludes. Lane A learning tunes selection and ranking preferences elsewhere in the ' +
      "platform, never the worker's assigned-work list.",
    sourceRef: 'L40398',
    sourceClass: null,
    onTheCard: false,
  },
  {
    field: 'No-artificial-intelligence behaviour',
    text: 'Identical to normal behaviour.',
    sourceRef: 'L40400',
    sourceClass: null,
    onTheCard: false,
  },
  {
    field: 'Security',
    text:
      'The list is strictly scoped to the logged-in identity, which enforces both least privilege ' +
      "and the support-not-surveillance principle. No search, filter, or deep link can reach another " +
      'identity\'s work. The absence of allocation removes an entire class of privilege-escalation ' +
      'surface: there is nothing to claim, so there is nothing to claim improperly.',
    sourceRef: 'L40417',
    sourceClass: null,
    onTheCard: false,
  },
  {
    field: 'Fallback identifier',
    text:
      'FB-FL-PKG-01 primary for readiness; FB-FL-CORE-01 for connectivity; FB-FL-CMD-01 for ' +
      'list-changing commands; FB-FL-GATE-01 where a Run parks.',
    sourceRef: 'L40419',
    sourceClass: null,
    onTheCard: false,
  },
  {
    field: 'Failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation',
    text:
      'The failure is a package that never arrives. The first fallback is retry on connectivity with ' +
      'the Run honestly not-yet-ready. The fallback failure is that no assigned Run is ready, at ' +
      "which point the worker's honest state is that no work is ready on this device and the " +
      'Supervisor is signalled through the run no-show path at plus 15 minutes, with auto-cancel at ' +
      'plus 30 for unstarted runs. The terminal safe state is an empty but explained list rather ' +
      'than a fabricated one. Recovery is package delivery. Reconciliation is the Delivery ' +
      "Operations Hub's authoritative assignment set overriding the device's cached set at the next " +
      'sync, with removals explained rather than silent.',
    sourceRef: 'L40475',
    sourceClass: null,
    onTheCard: false,
  },
] as const satisfies readonly A2CardStatement[]

/** The five statements of the L40347-L40355 card, in the source's order. */
export const A2_IDENTITY_CARD = A2_CARD.filter((s) => s.onTheCard)

/* ==================================================================== *
 * THE SIX PER-RUN STATES.
 *
 * L40379 states them in one sentence and the mermaid diagram at
 * L40451-L40467 draws them. Both give six. `A2_RUN_STATES` is transcribed
 * from the prose; the covering suite reads the diagram's own node lines and
 * holds the two equal, so neither is a copy of the other.
 * ==================================================================== */

export type A2RunState =
  | 'STATE-A2-NOTREADY'
  | 'STATE-A2-READY'
  | 'STATE-A2-INPROGRESS'
  | 'STATE-A2-PARKED'
  | 'STATE-A2-WORKERFINISHED'
  | 'STATE-A2-COMPLETESYNCED'

export interface A2RunStateRow {
  readonly id: A2RunState
  /** The state's own gloss in L40379, verbatim. */
  readonly gloss: string
  /** The diagram's own node description for the same state, verbatim. */
  readonly diagramNode: string
  /** Whether a worker may open this Run from the list. */
  readonly enterable: boolean
  readonly sourceRef: string
}

/**
 * `enterable` IS TRUE ON EXACTLY ONE STATE, and that is row 4 and row 5 of
 * the permission matrix made structural. L40364 allows the Worker to enter a
 * READY Run; L40365 prohibits entering a not-yet-ready one for every column,
 * and its Worker cell gives the reason in the source's own words — "the
 * package has not arrived, so nothing can be rendered". A Run under way,
 * parked, worker-finished or complete-and-synced is not entered from this
 * list either: `AC-A2-3` (L40483) speaks only of the not-yet-ready case, and
 * `TEST-A2-3` (L40495) asks for a refusal with a stated reason.
 *
 * WHY IN-PROGRESS IS NOT ENTERABLE FROM HERE, STATED RATHER THAN ASSUMED.
 * The happy path (L40386-L40387) has the worker select a READY Run and the
 * Run Player open. The source does not describe re-entering an in-progress
 * Run from My Runs, and this module does not invent that path — it is
 * recorded as unrecorded in the module's findings rather than filled in.
 */
export const A2_RUN_STATES = [
  {
    id: 'STATE-A2-NOTREADY',
    gloss: 'package not yet arrived',
    diagramNode: 'Package not yet arrived shown honestly',
    enterable: false,
    sourceRef: 'L40379 (states), L40454 (diagram node)',
  },
  {
    id: 'STATE-A2-READY',
    gloss: 'staged and enterable',
    diagramNode: 'Staged and enterable',
    enterable: true,
    sourceRef: 'L40379 (states), L40456 (diagram node)',
  },
  {
    id: 'STATE-A2-INPROGRESS',
    gloss: 'entered and under way',
    diagramNode: 'Under way in the Run Player',
    enterable: false,
    sourceRef: 'L40379 (states), L40458 (diagram node)',
  },
  {
    id: 'STATE-A2-PARKED',
    gloss: 'blocked at a qualification gate awaiting a clearance',
    diagramNode: 'Parked awaiting a clearance while other runs continue',
    enterable: false,
    sourceRef: 'L40379 (states), L40460 (diagram node)',
  },
  {
    id: 'STATE-A2-WORKERFINISHED',
    gloss: 'the worker has declared their part done',
    diagramNode: 'Stands the run as submitted on the platform lifecycle',
    enterable: false,
    sourceRef: 'L40379 (states), L40463 (diagram node)',
  },
  {
    id: 'STATE-A2-COMPLETESYNCED',
    gloss: 'every capture and evidence object received and acknowledged by the server',
    diagramNode: 'Server received and acknowledged every capture and evidence object',
    enterable: false,
    sourceRef: 'L40379 (states), L40464 (diagram edge)',
  },
] as const satisfies readonly A2RunStateRow[]

type MissingFromRunStates = Exclude<A2RunState, (typeof A2_RUN_STATES)[number]['id']>
const _runStatesExhaustive: MissingFromRunStates extends never ? true : never = true
void _runStatesExhaustive

export function a2RunState(id: A2RunState): A2RunStateRow {
  const found = A2_RUN_STATES.find((s) => s.id === id)
  if (found === undefined) throw new Error(`no MOD-FL-A2 run state: ${id}`)
  return found
}

/* ==================================================================== *
 * FOUR WORDS FOR THE END OF A RUN, AND THIS SCREEN RENDERS TWO OF THEM.
 *
 * `AC-A2-6` (L40486): "Worker-finished and complete-and-synced render as
 * distinct states." That is the criterion this module is held to. The four
 * words below are why it exists — the platform run lifecycle uses two more,
 * and neither of them means what the device's own two mean.
 * ==================================================================== */

export interface RunCompletionWord {
  readonly word: string
  /** What it means, in the source's own words. */
  readonly meaning: string
  /** Whether My Runs is a place this word may appear. */
  readonly rendersOnMyRuns: boolean
  readonly sourceRef: string
}

export const RUN_COMPLETION_WORDS = [
  {
    word: 'worker-finished',
    meaning:
      'The worker declares their part finished (worker-finished), which stands the Run as submitted ' +
      'on the platform run lifecycle.',
    rendersOnMyRuns: true,
    sourceRef: 'L39045',
  },
  {
    word: 'submitted',
    meaning:
      'The worker declares worker-finished, which stands the Run as submitted. It is the platform ' +
      "lifecycle's word for what the device calls worker-finished, not a further step the device " +
      'takes.',
    rendersOnMyRuns: false,
    sourceRef: 'L40559',
  },
  {
    word: 'complete',
    meaning:
      'When every capture and evidence object for the Run has been received and acknowledged by the ' +
      'server, the Run moves to complete.',
    rendersOnMyRuns: false,
    sourceRef: 'L40560',
  },
  {
    word: 'finished',
    meaning:
      'Close the run through submitted, then complete, then finished. The finish is the one ' +
      'automatic transition on the platform: the Delivery Operations Hub finishes the record ' +
      "automatically after the tenant's record-finish window, default 48 hours. It happens on " +
      'another surface, after this screen has stopped having anything to say about the Run.',
    rendersOnMyRuns: false,
    sourceRef: 'L1384, L39047',
  },
] as const satisfies readonly RunCompletionWord[]

/**
 * The claim this module refuses to make, held as data so it renders rather
 * than living in a comment. `STATE-A2-COMPLETESYNCED` is the device's own
 * name for the condition L40560 calls `complete`, and it is NOT the Hub's
 * record-finish at L39047.
 */
export const COMPLETION_CLAIM_NEVER_MADE = {
  claim:
    'That a Run the worker has declared finished is complete, or that the platform holds a finished ' +
    'record of it.',
  instead:
    'The list shows worker-finished, and shows complete-and-synced only once every capture and ' +
    'evidence object has been received and acknowledged by the server. Those are two states with ' +
    'two meanings, and the source requires them to render distinctly. The record itself is finished ' +
    'later still, automatically, by the Delivery Operations Hub after the tenant’s record-finish ' +
    'window — on another surface, and never on this list.',
  sourceRef: 'AC-A2-6 L40486; L40388; L40559-L40560; L39045-L39047',
} as const

/* ==================================================================== *
 * THE CATEGORICAL ABSENCE, STATED ON THE ONE SCREEN MOST LIKELY TO BREACH
 * IT.
 * ==================================================================== */

export interface CategoricalAbsence {
  /**
   * ONE VERBATIM QUOTATION FROM THE LINE `sourceRef` NAMES, and nothing
   * else. The covering suite holds every sentence of it against that line,
   * so a label this build added to make it read better would fail — which
   * is why anything this build says about the quotation lives in `gloss`
   * instead. That separation is the gate's, not a preference: the first
   * version of this record joined the exclusion register's four cells with
   * labels of its own and the gate refused it.
   */
  readonly text: string
  /** This build's own sentence about the quotation. Never the source's. */
  readonly gloss: string
  readonly sourceRef: string
}

export const NO_PACE_NO_TIMER_NO_RANKING = [
  {
    text: 'Worker-facing pace, timer, or performance display',
    gloss:
      'The exclusion register gives the reason as support-not-surveillance, categorical; names the ' +
      'Client Command Center as where it lives instead; and classes the exclusion Invariant — so a ' +
      'display of any of these here would be a broken guarantee rather than a misplacement.',
    sourceRef: 'EXCL-FL-08 · L39491',
  },
  {
    text:
      'No screen in any module, in any state, in any release of this scope displays a pace figure, a ' +
      'countdown against expectation, or a comparison to another worker.',
    gloss:
      'TEST-FL-000-3 (L39108) is the check the platform runs against this criterion: a static and ' +
      'runtime scan of every rendered screen, asserting zero occurrences.',
    sourceRef: 'AC-FL-000-5 · L39100',
  },
  {
    text:
      'AC-SCOPE-045 — no pace, timer, or performance display exists in any module or state.',
    gloss:
      'Stated at scope level, beside AC-SCOPE-043 (no allocation or self-assignment control) and ' +
      'AC-SCOPE-044 (no other worker’s data is reachable) — the other two this screen turns on.',
    sourceRef: 'AC-SCOPE-045 · L2683',
  },
  {
    text:
      'Ordering presents what the Delivery Operations Hub assigned; introducing a ranking model here ' +
      'would be work allocation by another name, which §7.1.5 excludes.',
    gloss:
      'This module’s own artificial-intelligence line, which is the closest the source comes to ' +
      'naming the temptation this particular screen carries.',
    sourceRef: 'L40398',
  },
] as const satisfies readonly CategoricalAbsence[]

/**
 * `SB-FL-011` (L40471), the storyboard for this destination, transcribed as
 * the source writes it. Its last sentence is the absence stated as a
 * storyboard fact — "There is no search field, no 'available work' tab, and
 * no other worker's name anywhere on the screen" — and the view renders it.
 */
export const SB_FL_011 = {
  id: 'SB-FL-011',
  title: 'the home surface',
  text:
    'Top strip: an offline glyph, "Last synced 08:29", "14 pending". Below it, a card headed "Red ' +
    'Bicycle Assembly" with two rows beneath it: "Run 2026-08-14-A — In progress" and "Run ' +
    '2026-08-14-B — Not yet ready. Waiting for the work package. It will download when the tablet ' +
    'is back online." A third card headed "Frame Alignment Check" shows a single row reading ' +
    '"Parked — waiting for a clearance from your supervisor. You can continue your other runs." ' +
    'There is no search field, no "available work" tab, and no other worker\'s name anywhere on ' +
    'the screen.',
  sourceRef: 'L40471',
} as const
