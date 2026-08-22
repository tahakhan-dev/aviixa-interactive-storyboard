import {
  ccFallbackPatternById,
  ccFunctionalitiesNamingNoPattern,
  type CcFallbackPatternId,
} from '@/surfaces/cc/fallback/patterns'

/**
 * `MOD-CC-05`'S QUEUE BEHAVIOUR — `FB-CC-QUEUE`, THE WAITING CLOCK, AND THE
 * TWO PROHIBITIONS THAT ARE THE MODULE'S SAFETY CORE.
 *
 * ── THE OBLIGATION IS THREEFOLD AND THE THIRD PART IS THE EASY ONE TO LOSE ─
 *
 * L37115 states the alternate path in one sentence: *"`FB-CC-QUEUE`: the item
 * renders not decidable, names the missing element, disables its decision
 * controls, and keeps its waiting clock running."* Three obligations, and the
 * third is the one a reasonable implementation drops, because stopping a clock
 * on an item nobody can act on FEELS like the considerate thing to do. It is a
 * different and wrong thing: L37228's `AC-CC-247` requires undecided items to
 * age VISIBLY, and L35670's terminal safe state is "the item never executes on
 * its own and never silently expires" — with "it ages visibly" following on
 * the same line, after that clause's own `SoW Fact` marker. The two are quoted
 * apart because they are apart: joining them across the marker produces a
 * sentence the source does not carry, which is the extraction-coinage shape
 * `tests/coverage/locator-fidelity.test.ts` exists to catch, and it caught
 * this file's first draft doing exactly that. A stopped clock is a silent
 * expiry with the record still on screen.
 *
 * THE CLOCK IS THEREFORE STRUCTURALLY UNABLE TO SEE DECIDABILITY.
 * `cc05WaitingText` takes ONE argument, a number of seconds, and there is no
 * item, no decidability and no default parameter for one to arrive through —
 * so the rendering cannot branch on a fact it is never given. That is the same
 * move as a two-field reading type with nowhere to mark a winner. A gate then
 * renders one decidable and one not-decidable item from the SAME arrival and
 * asserts the two clocks read identically, because a check that only asserts
 * "the clock is present" passes on a clock frozen at zero.
 *
 * ── THE WAITING CLOCK STARTS AT SERVER RECEIPT, NOT AT THE FLOOR EVENT ────
 *
 * L37159: a deviation that occurred offline produces its gate item only after
 * the capture reaches the server, so the clock starts at server receipt and
 * "the card must show the trigger's origin time alongside the item's creation
 * time so that a decider is not misled about how old the underlying situation
 * is". Both times are therefore fields on the item and both are rendered. A
 * card showing one of them is honest about the queue and misleading about the
 * floor.
 *
 * ── WHAT `AC-CC-090` ACTUALLY FINDS HERE, COUNTED ────────────────────────
 *
 * `AC-CC-090` (L35710) requires every functionality in chapter 21 to reference
 * at least one `FB-CC-*` pattern. This module declares TWELVE functionalities
 * (L37196-L37215) and **five of them name no pattern at all** — four write
 * "Fallback: not applicable." and one defers to "the platform escalation
 * fallback". The dispatch that commissioned this module said "Yours reference
 * `FB-CC-QUEUE`; say so explicitly", which is true of exactly TWO of the
 * twelve. The list below is the source's own, the answer is computed by task
 * 3's `ccFunctionalitiesNamingNoPattern` rather than restated, and the
 * shortfall is disclosed rather than repaired: filling a pattern into a
 * functionality the source leaves empty would invent the compliance the
 * criterion is asking about.
 */

/* ==================================================================== *
 * THE THREE DECISIONS, AND THE TWO INTERACTIONS.
 * ==================================================================== */

/**
 * L37153's decision row, verbatim and in its order: *"three controls of equal
 * visual weight — 'Approve', 'Adjust and approve', 'Decline with reason' —
 * plus an optional note field."* Closed at three: a fourth control would be a
 * decision the gate does not offer, and `AC-CC-243` (L37224) binds the three
 * to the same prominence.
 */
export const CC05_DECISION_CONTROLS = [
  'Approve',
  'Adjust and approve',
  'Decline with reason',
] as const satisfies readonly string[]

export type Cc05DecisionControl = (typeof CC05_DECISION_CONTROLS)[number]

/**
 * THE STORYBOARD AND THE PROSE NAME THE SAME THREE CONTROLS DIFFERENTLY, AND
 * NEITHER SPELLING IS NORMALISED AWAY. L37058-L37062 head the three bullets
 * **Approve**, **Adjust within bounds and approve** and **Decline with
 * reason**; the matrix row at L37081 uses the long form and L37082 uses
 * `Decline with a categorised reason`. `SB-CC-16`'s own control row (L37153)
 * shortens the second to "Adjust and approve". The rail draws what the
 * storyboard draws; the matrix rows keep their own wording.
 */
export const CC05_CONTROL_SPELLINGS = [
  { control: 'Approve', matrixWording: 'Approve an item', matrixRef: 'L37080' },
  {
    control: 'Adjust and approve',
    matrixWording: 'Adjust within bounds and approve',
    matrixRef: 'L37081',
  },
  {
    control: 'Decline with reason',
    matrixWording: 'Decline with a categorised reason',
    matrixRef: 'L37082',
  },
] as const satisfies readonly {
  readonly control: Cc05DecisionControl
  readonly matrixWording: string
  readonly matrixRef: string
}[]

/* ==================================================================== *
 * THE SCOPE OF IMPACT, WHICH LEADS THE CARD.
 * ==================================================================== */

/**
 * THE PROSE COUNTS THREE THINGS AND THE STORYBOARD RENDERS FOUR. Recorded, not
 * reconciled.
 *
 * L37054, L37091 and L37103 all name the same triple — "how many pieces, runs
 * and jobs the intervention touches". `SB-CC-16`'s card header at L37145 reads
 * `"Scope of impact: 2 stations · 23 pieces · 1 run · 1 job"`, which LEADS
 * with a fourth quantity the triple does not contain. A model built from the
 * prose renders a card the storyboard does not show; a model built from the
 * storyboard invents a quantity three statements do not ask for. Both are
 * carried: the triple is required and `stations` is optional, so an item
 * without one is complete and an item with one is the storyboard's.
 */
export interface Cc05ScopeOfImpact {
  /** L37145's leading quantity. Absent from the prose triple. */
  readonly stations?: number | undefined
  readonly pieces: number
  readonly runs: number
  readonly jobs: number
}

export const CC05_SCOPE_TRIPLE = ['pieces', 'runs', 'jobs'] as const satisfies readonly string[]

export const CC05_SCOPE_DIVERGENCE = {
  proseRefs: ['L37054', 'L37091', 'L37103'],
  proseWording: 'how many pieces, runs and jobs the intervention touches',
  storyboardRef: 'L37145',
  storyboardWording: 'Scope of impact: 2 stations · 23 pieces · 1 run · 1 job',
  extraQuantity: 'stations',
  note: 'Three statements of the required content name three quantities; the storyboard card leads with a fourth. Neither is adopted here — the triple is required by the type and stations is optional, so a card can be built to either statement without the model choosing.',
} as const

export function cc05ScopeText(scope: Cc05ScopeOfImpact): string {
  const parts = [
    ...(scope.stations === undefined ? [] : [`${scope.stations} stations`]),
    `${scope.pieces} pieces`,
    `${scope.runs} run${scope.runs === 1 ? '' : 's'}`,
    `${scope.jobs} job${scope.jobs === 1 ? '' : 's'}`,
  ]
  return `Scope of impact: ${parts.join(' · ')}`
}

/* ==================================================================== *
 * NOT DECIDABLE — `FB-CC-QUEUE`.
 * ==================================================================== */

/**
 * The TWO elements the source says can fail to resolve, in its own words.
 * L37115 names the first; L35670's failure clause names both — "the scope of
 * impact or the evidence cannot be resolved" — and `AC-CC-241` (L37222)
 * repeats the pair. Closed at two: a third would be this build inventing a
 * failure mode, and the whole point of naming the missing element is that the
 * name comes from somewhere.
 */
export const CC05_RESOLVABLE_ELEMENTS = [
  'the scope of impact',
  'the evidence',
] as const satisfies readonly string[]

export type Cc05ResolvableElement = (typeof CC05_RESOLVABLE_ELEMENTS)[number]

export interface Cc05GateItem {
  readonly id: string
  /** L37054 — the proposing agent. */
  readonly proposingAgent: string
  /** L37054 — the trigger context: deviation, run, worker. */
  readonly triggerContext: string
  /** L37054 — the proposed intervention in plain language. */
  readonly intervention: string
  /**
   * L37159 — the trigger's origin time, rendered ALONGSIDE `createdAt` so a
   * decider is not misled about how old the underlying situation is.
   *
   * NULLABLE, AND THE NULL IS RENDERED RATHER THAN FILLED. `SB-CC-16` and the
   * worked example at L37155 give the item's creation time and no origin time
   * at all, so the storyboard items below carry `null` and the card says the
   * source states none. Substituting the creation time would assert the two
   * are equal, which is the one thing L37159 exists to prevent — the same rule
   * as L35945's refusal to render zero for an unknown pending-capture count.
   */
  readonly triggerOriginTime: string | null
  /** L37159 — the item's creation time. The waiting clock starts here. */
  readonly createdAt: string
  /**
   * Seconds since `createdAt`. In a connected build this updates continuously
   * (L37157, `FUNC-CC-0501-1-3` at L37198); here it is a fixed illustration
   * taken from the storyboard and labelled as one.
   */
  readonly waitingSeconds: number
  /** `null` where the platform could not compute it. */
  readonly scopeOfImpact: Cc05ScopeOfImpact | null
  /** L37151 — the linked evidence items. `null` where they cannot be resolved. */
  readonly evidence: readonly string[] | null
  /** Which timeout applies. L37068 gives 10 minutes at Severity 1, 30 otherwise. */
  readonly severityOne: boolean
}

export type Cc05Decidability =
  | { readonly decidable: true }
  | { readonly decidable: false; readonly missingElement: Cc05ResolvableElement }

/**
 * A DECOMPOSITION, NOT A DEFAULT. An item whose scope of impact cannot be
 * computed is rendered not decidable "rather than decidable with the scope
 * omitted" (L37056), and L35670's distinctive invariant is that such an item
 * "is never made decidable by defaulting the missing element". So there is no
 * fallback value here and no `?? 0`: the absence propagates into the rendering
 * as a NAME.
 *
 * Scope is tested before evidence because L37054 and L37056 make the scope the
 * card's leading element and the reason the rule exists; where both are
 * missing the scope is the one named, which is the one the decider needs
 * first.
 */
export function cc05Decidability(item: Cc05GateItem): Cc05Decidability {
  if (item.scopeOfImpact === null) return { decidable: false, missingElement: 'the scope of impact' }
  if (item.evidence === null) return { decidable: false, missingElement: 'the evidence' }
  return { decidable: true }
}

/**
 * THE WAITING CLOCK. ONE ARGUMENT, AND IT IS NOT AN ITEM.
 *
 * Passing the item would give this function the decidability it must not be
 * able to see; a defaulted second parameter would do the same and would not
 * even count toward `Function.length`, which is a beaten gate in this build's
 * own catalogue. Seconds in, text out — so "the clock stops when the item
 * cannot be decided" is not a bug this rendering can have.
 */
export function cc05WaitingText(waitingSeconds: number): string {
  if (!Number.isFinite(waitingSeconds) || waitingSeconds < 0) {
    throw new Error(
      `MOD-CC-05 waiting time must be a non-negative number of seconds; received ${waitingSeconds}. ` +
        'An item never expires (AC-CC-247, L37228), so there is no sentinel for "no longer waiting".',
    )
  }
  const whole = Math.floor(waitingSeconds)
  const minutes = Math.floor(whole / 60)
  const seconds = whole % 60
  return `${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'}`
}

/**
 * The reason a disabled decision control carries under `FB-CC-QUEUE`, built
 * from the element the item could not resolve. It is handed to
 * `src/ui/WriteControl.tsx`'s `missingElement` prop — task 3's fifth branch,
 * consumed rather than forked — which appends the clause about the clock and
 * the never-expiry itself.
 */
export function cc05MissingElementFor(item: Cc05GateItem): Cc05ResolvableElement | undefined {
  const d = cc05Decidability(item)
  return d.decidable ? undefined : d.missingElement
}

/* ==================================================================== *
 * UNACTIONED ITEMS — THE TWO PROHIBITIONS THAT ARE THE SAFETY CORE.
 * ==================================================================== */

/**
 * L37068's defaults, verbatim: *"a 10-minute window at Severity 1, 30 minutes
 * otherwise, configurable per severity level"*. `MTX-TEN-02c`'s `[K9]`
 * condition (L22072) states the same two numbers independently.
 */
export const CC05_TIMEOUT_MINUTES = { severityOne: 10, otherwise: 30 } as const

export const cc05TimeoutMinutes = (severityOne: boolean): number =>
  severityOne ? CC05_TIMEOUT_MINUTES.severityOne : CC05_TIMEOUT_MINUTES.otherwise

/**
 * L37070: *"An item that executed on timeout would make the gate decorative.
 * An item that expired silently would erase the evidence that a decision was
 * not taken."* Both are rendered as statements rather than left implicit,
 * because the diagram at L37141 is the source's own argument that no path
 * leads from a timeout to execution and none leads to expiry.
 */
export const CC05_UNACTIONED_RULES = [
  {
    rule: 'No gate item executes on timeout under any condition.',
    criterion: 'AC-CC-246',
    criterionRef: 'L37227',
    whyRef: 'L37070',
    why: 'An item that executed on timeout would make the gate decorative.',
  },
  {
    rule: 'No gate item expires; undecided items age visibly and remain in the queue.',
    criterion: 'AC-CC-247',
    criterionRef: 'L37228',
    whyRef: 'L37070',
    why: 'An item that expired silently would erase the evidence that a decision was not taken.',
  },
] as const satisfies readonly {
  readonly rule: string
  readonly criterion: string
  readonly criterionRef: string
  readonly whyRef: string
  readonly why: string
}[]

/* ==================================================================== *
 * THE TWELVE FUNCTIONALITIES AND `AC-CC-090`.
 * ==================================================================== */

export interface Cc05Functionality {
  readonly id: string
  readonly sourceRef: string
  /** Every `FB-CC-*` the source's own `Fallback:` clause names. Often empty. */
  readonly patterns: readonly CcFallbackPatternId[]
  /** The `Fallback:` clause verbatim, INCLUDING the ones that name no pattern. */
  readonly fallbackClause: string
}

/**
 * L37196-L37215, in the source's own order. The `patterns` array is what the
 * `Fallback:` clause names and nothing else — five of these are empty, and
 * filling them would be inventing the compliance `AC-CC-090` asks about.
 */
export const CC05_FUNCTIONALITIES = [
  {
    id: 'FUNC-CC-0501-1-1',
    sourceRef: 'L37196',
    patterns: ['FB-CC-QUEUE'],
    fallbackClause: 'FB-CC-QUEUE',
  },
  {
    id: 'FUNC-CC-0501-1-2',
    sourceRef: 'L37197',
    patterns: ['FB-CC-QUEUE'],
    fallbackClause: 'FB-CC-QUEUE',
  },
  {
    id: 'FUNC-CC-0501-1-3',
    sourceRef: 'L37198',
    patterns: ['FB-CC-SESS'],
    fallbackClause: 'FB-CC-SESS',
  },
  {
    id: 'FUNC-CC-0502-1-1',
    sourceRef: 'L37201',
    patterns: ['FB-CC-WRITE'],
    fallbackClause: 'FB-CC-WRITE',
  },
  {
    id: 'FUNC-CC-0502-2-1',
    sourceRef: 'L37203',
    patterns: ['FB-CC-WRITE'],
    fallbackClause: 'FB-CC-WRITE',
  },
  {
    id: 'FUNC-CC-0502-2-2',
    sourceRef: 'L37204',
    patterns: [],
    fallbackClause: 'not applicable',
  },
  {
    id: 'FUNC-CC-0502-2-3',
    sourceRef: 'L37205',
    patterns: ['FB-CC-WRITE'],
    fallbackClause: 'FB-CC-WRITE',
  },
  {
    id: 'FUNC-CC-0502-3-1',
    sourceRef: 'L37207',
    patterns: ['FB-CC-WRITE'],
    fallbackClause: 'FB-CC-WRITE',
  },
  {
    id: 'FUNC-CC-0503-1-1',
    sourceRef: 'L37210',
    patterns: [],
    fallbackClause: 'platform escalation fallback governs',
  },
  {
    id: 'FUNC-CC-0503-1-2',
    sourceRef: 'L37211',
    patterns: [],
    fallbackClause: 'not applicable',
  },
  {
    id: 'FUNC-CC-0503-1-3',
    sourceRef: 'L37212',
    patterns: [],
    fallbackClause: 'not applicable',
  },
  {
    id: 'FUNC-CC-0504-1-1',
    sourceRef: 'L37215',
    patterns: [],
    fallbackClause: 'not applicable',
  },
] as const satisfies readonly Cc05Functionality[]

/**
 * `AC-CC-090`'s answer for this module, COMPUTED by task 3's shared helper
 * rather than written down. A hand-written "five" would be a number this build
 * asserted; this one changes if the list changes.
 */
export const CC05_FUNCTIONALITIES_NAMING_NO_PATTERN: readonly string[] =
  ccFunctionalitiesNamingNoPattern(CC05_FUNCTIONALITIES)

export const CC05_AC_CC_090 = {
  criterion: 'AC-CC-090',
  criterionRef: 'L35710',
  criterionText: 'Every functionality in this chapter references at least one `FB-CC-*` pattern.',
  met: CC05_FUNCTIONALITIES_NAMING_NO_PATTERN.length === 0,
  finding:
    "This module's own functionality list does not meet it. Four functionalities write `Fallback: not applicable.` and one defers to the platform escalation fallback, which is not an `FB-CC-*` pattern. The shortfall is disclosed rather than repaired: assigning a pattern the source does not name would manufacture the compliance the criterion is testing for.",
} as const

/**
 * The module's own declared fallback identifiers, L37188, in its order. FIVE —
 * and the twelve functionalities above between them name only THREE of the
 * five. `FB-CC-AGENT` and `FB-CC-CMD` are declared at module level and reached
 * by no functionality's `Fallback:` clause, which is the mirror image of the
 * `AC-CC-090` shortfall and is recorded for the same reason.
 */
export const CC05_MODULE_FALLBACK_IDS = [
  'FB-CC-QUEUE',
  'FB-CC-WRITE',
  'FB-CC-SESS',
  'FB-CC-AGENT',
  'FB-CC-CMD',
] as const satisfies readonly CcFallbackPatternId[]

export const CC05_MODULE_FALLBACK_REF = 'L37188'

/** Declared on the module and named by none of its twelve functionalities. */
export const CC05_FALLBACKS_NO_FUNCTIONALITY_NAMES: readonly CcFallbackPatternId[] =
  CC05_MODULE_FALLBACK_IDS.filter(
    (id) => !CC05_FUNCTIONALITIES.some((f) => (f.patterns as readonly string[]).includes(id)),
  )

/** `FB-CC-QUEUE` itself, read from task 3's registry rather than respelled. */
export const CC05_QUEUE_PATTERN = ccFallbackPatternById('FB-CC-QUEUE')

/* ==================================================================== *
 * THE STORYBOARD'S OWN ITEMS, LABELLED AS ILLUSTRATIONS.
 *
 * `SB-CC-16` (L37143-L37153) is the source's own gate card and every value
 * below is read off it: the scope header at L37145, the second line's
 * "waiting 3 minutes 12 seconds" and "timeout 30 minutes" at L37147, the body
 * at L37149 and the three linked evidence items at L37151. 3 minutes 12
 * seconds is 192 seconds, which is where that number comes from, and the
 * 10:26 creation time is the worked example's own at L37155.
 *
 * THE SECOND ITEM IS THE FIRST WITH ITS SCOPE REMOVED, AND THAT IS THE POINT.
 * Every other field is identical, INCLUDING `waitingSeconds`, so the two cards
 * render the same clock and differ only in their controls. A pair that also
 * differed in arrival time would let a stopped clock pass as a different
 * arrival.
 * ==================================================================== */

const STORYBOARD_BASE = {
  proposingAgent: 'the Deviation and Containment Agent',
  triggerContext:
    'the same tooling lot LOT-WB-2291 is in use at Wheel Station 1 and Wheel Station 3, and the deviation at Wheel Station 2 was a torque departure below the lower limit',
  intervention: 'Extend containment to the two adjacent stations sharing the suspect tooling lot.',
  triggerOriginTime: null,
  createdAt: '10:26',
  waitingSeconds: 192,
  severityOne: false,
} as const

/**
 * What the card renders where L37159's origin time belongs when the source
 * supplies none. Stated once here so the component cannot spell a second
 * version of it, and so a gate can assert the exact string is on screen rather
 * than asserting the absence of a number, which is satisfied by an empty div.
 */
export const CC05_ORIGIN_TIME_UNSTATED =
  'Trigger origin time: not stated in the source for this card. L37159 requires it beside the creation time; substituting the creation time would assert the two are equal, which is what that rule exists to prevent.'

export const CC05_STORYBOARD_ITEM: Cc05GateItem = {
  ...STORYBOARD_BASE,
  id: 'GATE-BB-0001',
  scopeOfImpact: { stations: 2, pieces: 23, runs: 1, jobs: 1 },
  evidence: ['the triggering capture', 'the tooling lot record', 'two prior cases'],
}

export const CC05_NOT_DECIDABLE_ITEM: Cc05GateItem = {
  ...STORYBOARD_BASE,
  id: 'GATE-BB-0002',
  scopeOfImpact: null,
  evidence: ['the triggering capture', 'the tooling lot record', 'two prior cases'],
}

export const CC05_STORYBOARD_REF = 'SB-CC-16'
export const CC05_STORYBOARD_LINES = {
  card: 'L37145',
  secondLine: 'L37147',
  body: 'L37149',
  evidence: 'L37151',
  decisionRow: 'L37153',
} as const
