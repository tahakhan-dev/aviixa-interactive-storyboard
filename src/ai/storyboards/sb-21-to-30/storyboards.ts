import type { FallbackContractKey } from '@/ai/fallbacks/registry'
import type { Storyboard, StoryboardNumber } from '@/ai/storyboards/contract'
import type { StoryboardInvariantId } from '@/ai/storyboards/invariants'
import { affected, noEffect } from '@/ui/shared/journey'

/**
 * §44A STORYBOARDS 21 TO 30 — DATA, TRANSCRIBED FROM THE FROZEN SOURCE.
 *
 * Slice 11 · wave 4 · task 18. Ten of the thirty. The card shape, the surface
 * order, the compound fallback key and the nine render-time invariants are
 * task 15A's and are IMPORTED. Nothing here redeclares them, reorders them or
 * adds to them: §44A's own head says at L92648 that "a rule stated once is a
 * rule interpreted differently by every reader", and three authors writing ten
 * cards each is exactly the case that rule was written for.
 *
 * Every field is prose read off a card's second column. Every locator was
 * opened. Row counts were counted from each table's header down rather than
 * inferred from a span: all ten cards are nineteen rows and all ten surface
 * tables are five rows, confirmed one card at a time.
 *
 * ── WHAT THIS FILE ADDS TO THE IMPORTED SHAPE, AND WHY IT IS NOT A SECOND
 *    CONTRACT ──────────────────────────────────────────────────────────────
 * One field: `reconstruction`, a sentence saying how the final official state
 * follows from the audit events the card names. `AC-44A-004` (L92749) requires
 * the state to be "derivable from the audit log alone", and `TEST-44A-003`
 * (L92756) reconstructs it. 15A's invariant checks the mechanics — the events
 * exist, the state is named, the referenced ids resolve, no id repeats — which
 * is everything a machine can check. It cannot check that the derivation is
 * the RIGHT one. So the reasoning is written down next to the data, per card,
 * where a reviewer can disagree with it. It is an intersection on this task's
 * own type, not a nineteenth-and-a-half field on the shared card.
 *
 * ── THE DECISION IDENTIFIERS TRAVEL INSIDE THE FIELD TEXT ───────────────────
 * Where the source writes `DEC-STORE-001` in a card cell, the transcription
 * carries it, because that is where the source puts it. There is deliberately
 * no `decisionRefs` field: `src/disclosure/decisions.ts` is wave 5's and
 * read-only here, and its exported union does not hold `DEC-ASK-001`,
 * `DEC-AIRTO-001`, `DEC-STORE-001`, `DEC-WIPE-001`, `DEC-SUSP-001`,
 * `DEC-SYNC-001`, `DEC-NOSHIFT-001`, `DEC-DEVICE-001`, `DEC-HANDOFF-001`,
 * `DEC-HANDOFF-002`, `DEC-VISION-001`, `DEC-VISION-004`, `DEC-VISION-006`,
 * `DEC-PLUS-001` or `DEC-DIVERGE-001`. So they are disclosed locally, below,
 * in the slice-8 pattern — every reading, every locator, nothing adopted.
 */

/* ====================================================================
 * THE ONE FIELD THIS TASK ADDS TO 15A'S CARD.
 * ==================================================================== */

export interface TranscribedStoryboard extends Storyboard {
  /**
   * How the final official state follows from `audit` ALONE. `AC-44A-004`
   * (L92749) is an assertion about what the card emits, so the derivation is
   * stated rather than asserted by the existence of a `derivedFrom` array.
   */
  readonly reconstruction: string
}

/* ====================================================================
 * THE VIOLATIONS THIS RANGE LEAVES STANDING, AND WHY.
 * ==================================================================== */

export interface DisclosedViolation {
  readonly storyboard: StoryboardNumber
  readonly invariant: StoryboardInvariantId
  /** The line 15A's check cites when it fires. */
  readonly sourceRef: string
  /** The line proving the gap is the SOURCE's, not this build's. */
  readonly sourceStatesTheGapAt: string
  readonly whyItStands: string
}

/**
 * ONE, AND IT IS TRUE.
 *
 * Storyboard 25 is the only card in the whole chapter that carries
 * `SCR-FL-LOCK-01`. L94876 fixes its wording and says it "is authored in both
 * supported languages as approved content"; `AC-44A-25-2` (L94880) and
 * `TEST-44A-25-3` (L94882) require it verbatim in both. The frozen source
 * writes the English at L94829 and writes no Spanish string for it anywhere,
 * so 15A's `fixedMessageIsNotParaphrased` reports the absent Spanish rendering
 * against `TEST-44A-004` (L92757).
 *
 * The report stands rather than being suppressed. The only way to silence it
 * is to leave the fixed message off the card, and that would remove the one
 * message in this range whose wording the source actually pins — silencing the
 * prohibition instead of satisfying it. The approved Spanish translation is a
 * client-supplied input; inventing one and asserting it would be this build
 * testing its own invention.
 */
export const SB_21_TO_30_DISCLOSED_VIOLATIONS = [
  {
    storyboard: 25,
    invariant: 'fixedMessageIsNotParaphrased',
    sourceRef: 'L92757',
    sourceStatesTheGapAt: 'L94876',
    whyItStands:
      "SCR-FL-LOCK-01's English wording is pinned at L94829 and renders verbatim. The source "
      + 'declares the message authored in both supported languages (L94876) but writes no Spanish '
      + 'string for it, and TEST-44A-004 (L92757) requires the set complete in both. The absence '
      + 'is the client-supplied translation, not a defect this range can close, so it is reported '
      + 'rather than papered over by omitting the message from the card.',
  },
] as const satisfies readonly DisclosedViolation[]

/* ====================================================================
 * SEAMS THIS TASK LEAVES IN THE IMPORTED CONTRACT.
 * ==================================================================== */

export interface ContractSeam {
  /** The imported thing that does not quite fit these ten. */
  readonly subject: string
  readonly finding: string
  /** What this task did instead, and why it is least-wrong rather than right. */
  readonly whatThisTaskDid: string
  readonly storyboards: readonly StoryboardNumber[]
}

/**
 * THREE. All reported rather than worked around, because a workaround in one of
 * three sibling tasks becomes three different workarounds.
 *
 * None of these is a defect in task 15A's contract as such — each is a place
 * where the frozen source says something the contract has no member for, which
 * is only discoverable by transcribing cards against it. They are recorded here
 * so wave 5 inherits the finding rather than the symptom.
 */
export const SB_21_TO_30_CONTRACT_SEAMS = [
  {
    subject: 'StoryboardRenderFacts.contentOrigin',
    finding:
      'The union has no member meaning "this storyboard renders no guidance, rule or threshold at '
      + 'all". Its five members all describe the PROVENANCE of a rendered guidance element, and '
      + 'several of these ten render none: storyboard 24 renders dashboard panels, 28 renders a '
      + 'handoff pack assembled from records, 29 renders attribution, and 30 renders an '
      + 'authoritative record beside a marked agent reading.',
    whatThisTaskDid:
      '`authored` in all four, as least-wrong, with the reasoning in a comment beside each. It is '
      + 'defensible — the panels, packs and records are authored artefacts and nothing in any of '
      + 'the four is model-generated — but it is not the same claim as "no guidance element '
      + 'exists here", and the invariant cannot tell the two apart. Storyboard 30 is the sharpest '
      + 'case: its agent output IS model-produced, and `modelGenerated` would still be the wrong '
      + 'value, because what the card renders AS the rule is the record while the agent’s '
      + 'differing value renders as a subordinate marked reading (L95242, L95277). A sixth member '
      + 'along the lines of `noGuidanceElement` would let the four say what they mean.',
    storyboards: [24, 28, 29, 30],
  },
  {
    subject: 'PINNED_WORKER_MESSAGES',
    finding:
      'It pins `SCR-FL-LOCK-01` only, while three cards in this range quote a fixed worker-facing '
      + 'string the source writes in full: storyboard 22 at L94572 ("This image could not be '
      + 'assessed automatically. Inspect using the criteria above."), storyboard 23 at L94667 '
      + '("This tablet is running low on storage. Your work is safe. Connect to a network as soon '
      + 'as you can."), and storyboard 26 at L94911 ("Ask your supervisor for help with this '
      + 'step."). Declaring any of them in `facts.fixedMessages` reports "no pinned wording covers '
      + 'it" — a true finding about the pinned set, not a defect in the card.',
    whatThisTaskDid:
      'Left `fixedMessages` empty on 22, 23 and 26 and transcribed each string verbatim into its '
      + 'Worker-visible experience field, where the source puts it. The strings are therefore '
      + 'rendered and reviewable but not policed against paraphrase. Only L94876 states the '
      + 'no-paraphrase prohibition explicitly, and it states it about `SCR-FL-LOCK-01`, so '
      + 'extending the pinned set is a judgement for whoever owns that module rather than a '
      + 'transcription this task may make.',
    storyboards: [22, 23, 26],
  },
  {
    subject: 'TEST-44A-004 and the Spanish message set',
    finding:
      'L94876 declares `SCR-FL-LOCK-01`\'s message "authored in both supported languages as '
      + 'approved content" and `TEST-44A-004` (L92757) requires every worker-facing message set '
      + 'complete in both English and Spanish before release. The frozen source writes no Spanish '
      + 'string for it. `TEST-44A-25-3` (L94882) — assert the compliance message renders '
      + 'verbatim in English and Spanish — therefore cannot pass as written.',
    whatThisTaskDid:
      'Declared the message with `spanish: null` and let 15A’s check report the absence, then '
      + 'disclosed that one report in `SB_21_TO_30_DISCLOSED_VIOLATIONS` with both locators. The '
      + 'approved translation is a client-supplied input; inventing one would make the test assert '
      + 'this build’s own invention, which is the failure mode the whole disclosure pattern '
      + 'exists to avoid.',
    storyboards: [25],
  },
] as const satisfies readonly ContractSeam[]

/* ====================================================================
 * THE ACCEPTANCE CRITERIA AND TESTS, COUNTED OFF EACH SECTION'S OWN LINE.
 * ==================================================================== */

export interface SectionCriteria {
  readonly storyboard: StoryboardNumber
  /** The `**Acceptance criteria.**` line. */
  readonly acceptanceRef: string
  readonly acceptance: readonly string[]
  /** The `**Tests.**` line. */
  readonly testsRef: string
  readonly tests: readonly string[]
}

/**
 * HELD AS IDENTIFIERS, NEVER AS COUNTS.
 *
 * Each section states its criteria and its tests as ONE prose line, so the
 * identifiers were read off that line rather than counted from a span. Nine of
 * these ten name five criteria and five tests. **Storyboard 30 names six**
 * criteria, `AC-44A-30-1` through `AC-44A-30-6` at L95304, and five tests —
 * counted from the line itself, not carried over from the brief. This range
 * therefore totals 51 criteria and 50 tests.
 *
 * A count would agree with any substitution. A literal list of identifiers
 * goes red naming the member that changed, which is why storyboard 30's sixth
 * criterion is a named member here and not a number.
 *
 * The two identifier SHAPES are distinct and one regex conflates them:
 * `AC-44A-004` is chapter-level (L92749) and `AC-44A-30-6` is
 * storyboard-level. Only the storyboard-level shape appears below.
 */
export const SB_21_TO_30_CRITERIA = [
  {
    storyboard: 21,
    acceptanceRef: 'L94541',
    acceptance: ['AC-44A-21-1', 'AC-44A-21-2', 'AC-44A-21-3', 'AC-44A-21-4', 'AC-44A-21-5'],
    testsRef: 'L94543',
    tests: ['TEST-44A-21-1', 'TEST-44A-21-2', 'TEST-44A-21-3', 'TEST-44A-21-4', 'TEST-44A-21-5'],
  },
  {
    storyboard: 22,
    acceptanceRef: 'L94624',
    acceptance: ['AC-44A-22-1', 'AC-44A-22-2', 'AC-44A-22-3', 'AC-44A-22-4', 'AC-44A-22-5'],
    testsRef: 'L94626',
    tests: ['TEST-44A-22-1', 'TEST-44A-22-2', 'TEST-44A-22-3', 'TEST-44A-22-4', 'TEST-44A-22-5'],
  },
  {
    storyboard: 23,
    acceptanceRef: 'L94714',
    acceptance: ['AC-44A-23-1', 'AC-44A-23-2', 'AC-44A-23-3', 'AC-44A-23-4', 'AC-44A-23-5'],
    testsRef: 'L94716',
    tests: ['TEST-44A-23-1', 'TEST-44A-23-2', 'TEST-44A-23-3', 'TEST-44A-23-4', 'TEST-44A-23-5'],
  },
  {
    storyboard: 24,
    acceptanceRef: 'L94796',
    acceptance: ['AC-44A-24-1', 'AC-44A-24-2', 'AC-44A-24-3', 'AC-44A-24-4', 'AC-44A-24-5'],
    testsRef: 'L94798',
    tests: ['TEST-44A-24-1', 'TEST-44A-24-2', 'TEST-44A-24-3', 'TEST-44A-24-4', 'TEST-44A-24-5'],
  },
  {
    storyboard: 25,
    acceptanceRef: 'L94880',
    acceptance: ['AC-44A-25-1', 'AC-44A-25-2', 'AC-44A-25-3', 'AC-44A-25-4', 'AC-44A-25-5'],
    testsRef: 'L94882',
    tests: ['TEST-44A-25-1', 'TEST-44A-25-2', 'TEST-44A-25-3', 'TEST-44A-25-4', 'TEST-44A-25-5'],
  },
  {
    storyboard: 26,
    acceptanceRef: 'L94962',
    acceptance: ['AC-44A-26-1', 'AC-44A-26-2', 'AC-44A-26-3', 'AC-44A-26-4', 'AC-44A-26-5'],
    testsRef: 'L94964',
    tests: ['TEST-44A-26-1', 'TEST-44A-26-2', 'TEST-44A-26-3', 'TEST-44A-26-4', 'TEST-44A-26-5'],
  },
  {
    storyboard: 27,
    acceptanceRef: 'L95046',
    acceptance: ['AC-44A-27-1', 'AC-44A-27-2', 'AC-44A-27-3', 'AC-44A-27-4', 'AC-44A-27-5'],
    testsRef: 'L95048',
    tests: ['TEST-44A-27-1', 'TEST-44A-27-2', 'TEST-44A-27-3', 'TEST-44A-27-4', 'TEST-44A-27-5'],
  },
  {
    storyboard: 28,
    acceptanceRef: 'L95132',
    acceptance: ['AC-44A-28-1', 'AC-44A-28-2', 'AC-44A-28-3', 'AC-44A-28-4', 'AC-44A-28-5'],
    testsRef: 'L95134',
    tests: ['TEST-44A-28-1', 'TEST-44A-28-2', 'TEST-44A-28-3', 'TEST-44A-28-4', 'TEST-44A-28-5'],
  },
  {
    storyboard: 29,
    acceptanceRef: 'L95215',
    acceptance: ['AC-44A-29-1', 'AC-44A-29-2', 'AC-44A-29-3', 'AC-44A-29-4', 'AC-44A-29-5'],
    testsRef: 'L95217',
    tests: ['TEST-44A-29-1', 'TEST-44A-29-2', 'TEST-44A-29-3', 'TEST-44A-29-4', 'TEST-44A-29-5'],
  },
  {
    storyboard: 30,
    acceptanceRef: 'L95304',
    // SIX. The only section in this range that names a sixth, and the count is
    // read off L95304 rather than assumed uniform with its nine neighbours.
    acceptance: [
      'AC-44A-30-1',
      'AC-44A-30-2',
      'AC-44A-30-3',
      'AC-44A-30-4',
      'AC-44A-30-5',
      'AC-44A-30-6',
    ],
    testsRef: 'L95306',
    tests: ['TEST-44A-30-1', 'TEST-44A-30-2', 'TEST-44A-30-3', 'TEST-44A-30-4', 'TEST-44A-30-5'],
  },
] as const satisfies readonly SectionCriteria[]

/* ====================================================================
 * STORYBOARD 26'S CROSS-REFERENCED FALLBACK LITERALS.
 * ==================================================================== */

export interface CrossReferencedFallback {
  readonly storyboard: StoryboardNumber
  readonly key: FallbackContractKey
  /** The contract, as the registry's owner names it. */
  readonly contract: string
  /** The card row that names the literal. */
  readonly namedAt: string
  readonly whyThisChapter: string
}

/**
 * THE ONE ROW IN THE CHAPTER NAMING TWO SENSES' WORTH OF LITERALS.
 *
 * Storyboard 26's `Identifier` row, L94907, verbatim:
 *
 *   | Identifier | `SB-AI-26`; fallback contract `FB-AI-26`; terminal case of
 *   `FB-AGT-PREV-01` and `FB-AI-04` |
 *
 * `FB-AI-26` is this card's own contract and keys as `44A.26`. The other two
 * are cross-references, and the second is the trap: **`FB-AI-04` there is the
 * §44A sense** — storyboard 4, "No artificial intelligence and no cached
 * guidance", registered at `44A.4` and claimed by its card at L93041. It is
 * NOT chapter 40.4's `FB-AI-04`, "Deviation brief assembly and gate delivery
 * failure" at L88919.
 *
 * The §44A reading is the consistent one: storyboard 26 IS the terminal case
 * of having no artificial intelligence and no cached guidance — the ladder in
 * its own body (L94896-L94903) walks exactly that exhaustion. A deviation-brief
 * assembly failure has nothing to do with this card. Both records exist under
 * the bare literal and both look plausible, which is precisely why getting it
 * wrong would be invisible, and why the sense is pinned here as a compound key
 * with the reason attached rather than left implied by prose.
 *
 * The registry keys chapters at SECTION granularity — `44A.4`, not `44A` — so
 * the key is `{ chapter: '44A.4', identifier: 'FB-AI-04' }'`.
 */
export const SB_21_TO_30_CROSS_REFERENCED_FALLBACKS = [
  {
    storyboard: 26,
    key: { chapter: '44.1', identifier: 'FB-AGT-PREV-01' },
    contract: 'Coaching selection unavailable',
    namedAt: 'L94907',
    whyThisChapter:
      "FB-AGT-PREV-01 has one owner: section 44.1's fallback register row at L95359. There is no "
      + 'second sense to disambiguate, and storyboard 26 is its terminal case because the ladder '
      + "starts at the agent-selected coaching card and that card's selection is unavailable.",
  },
  {
    storyboard: 26,
    key: { chapter: '44A.4', identifier: 'FB-AI-04' },
    contract: 'No artificial intelligence and no cached guidance',
    namedAt: 'L94907',
    whyThisChapter:
      'FOREIGN-SENSE LITERAL. Two records answer to FB-AI-04: chapter 40.4 at L88919 ("Deviation '
      + 'brief assembly and gate delivery failure") and section 44A.4 at L93041 ("No artificial '
      + 'intelligence and no cached guidance"). Storyboard 26 means the 44A sense — its own body '
      + 'walks the exhaustion of every guidance source (L94896-L94903), which is that contract '
      + 'exactly, while a deviation-brief assembly failure bears no relation to this card. Keyed '
      + 'as 44A.4 so the chapter travels with the literal; under a flat keyspace this reference '
      + 'would resolve silently to the wrong contract and look right.',
  },
] as const satisfies readonly CrossReferencedFallback[]

/* ====================================================================
 * THE DECISIONS, DISCLOSED LOCALLY.
 * ==================================================================== */

/**
 * Whether the identifier is already a member of the exported `DecisionId`
 * union in `src/disclosure/decisions.ts`. Membership, never a size: the canon's
 * count is not a claim a reader could act on, and stating it as a literal is
 * forbidden anywhere under `src/`.
 */
export type CanonMembership = 'member' | 'notAMemberOfTheExportedUnion'

/**
 * Where a section body and the chapter's glance table disagree about which
 * decisions govern a storyboard. `null` where they agree, or where the body
 * simply names more than the index does — a superset is not a conflict.
 */
export type GlanceTableConflict =
  | 'glanceTableAttributesWhatTheBodyDoesNotName'
  | 'glanceTableNamesNoDecisionWhereTheBodyDoes'

/**
 * ONE PLACE THE SOURCE MENTIONS A DECISION, AND WHAT IT SAYS THERE.
 *
 * Two fields, deliberately, and NOT `@/disclosure/decisions`' `DecisionReading`
 * even though its shape is identical. Reuse would be the wrong call here: that
 * type is the vocabulary of an `OpenDecision` disclosure record, and borrowing
 * it is what would make this structure read as one.
 */
export interface DecisionCitation {
  /** What the source says at this line, in its own terms. */
  readonly text: string
  /** A single line, or a section span whose BOTH ends carry content. */
  readonly locator: string
}

/**
 * A CITATION INDEX, NOT A DISCLOSURE RECORD, AND THE DIFFERENCE IS LOAD-BEARING.
 *
 * This structure answers one question: where do these ten sections mention a
 * `DEC-*` identifier, and what do they say about it there. It carries no
 * `adopted` field, no option set, no recommendation, no decision owner and no
 * position — every one of which a real `OpenDecision` in
 * `src/disclosure/decisions.ts` carries.
 *
 * That distinction is not cosmetic, and this task learned it the hard way.
 * `tests/unit/package-storage.test.ts` asserts that exactly four files hold a
 * record keyed to `DEC-STORE-001`, recognising them by a line reading
 * `id: 'DEC-STORE-001',` — because a locally-disclosed decision acquiring a
 * second home is precisely what `DecisionDisclosure` exists to prevent. This
 * file's first draft spelled its key `id` and became a fifth holder, turning
 * that gate red. Renaming the key alone would have made the gate pass while
 * leaving the resemblance — and the concern — untouched, so the structure
 * itself is stated as what it is: an index over transcribed prose.
 *
 * THE DECISIONS THEMSELVES ARE DISCLOSED WHERE THE SOURCE PUTS THEM — inside
 * the nineteen transcribed field cells. Storyboard 23's `Fallback-of-fallback`
 * cell already reads "`Client Decision Required` — `DEC-STORE-001`. This
 * blueprint states only the prohibition: evidence is never discarded", and its
 * `Source status` cell names both `DEC-STORE-001` and `DEC-AIQUEUE-001`. Those
 * cells ARE the disclosure. Canon-backed disclosure is wave 5's, and this index
 * exists only because two things do not fit in a field cell: readings that sit
 * in a section's NARRATIVE rather than its card (`DEC-VISION-004` at L94558,
 * `DEC-ROLE-001` at L95060), and the three places the chapter's index and its
 * section bodies disagree.
 */
export interface StoryboardDecisionCitations {
  readonly storyboard: StoryboardNumber
  readonly decision: string
  readonly canonMembership: CanonMembership
  /** Every place this identifier is mentioned. None is adopted here. */
  readonly citations: readonly DecisionCitation[]
  readonly conflict: GlanceTableConflict | null
}

/**
 * EVERY `DEC-*` THESE TEN SECTIONS NAME, WITH EVERY MENTION AND EVERY LOCATOR.
 *
 * Four of them are ALREADY members of the exported union —
 * `DEC-COACHREPLAY-001`,
 * `DEC-AIQUEUE-001`, `DEC-WIDIFF-001` and `DEC-ROLE-001` — and are marked as
 * such rather than duplicated as new; the rest are the seam this task leaves.
 *
 * ── THREE PLACES THE INDEX AND THE SPECIFICATION DISAGREE ──────────────────
 * The chapter's glance table (rows L92693-L92722) attributes decisions per
 * storyboard. For seven of these ten the section body names the same
 * decisions and more, and a superset is not a conflict. Three are conflicts,
 * and all three are recorded with both locators and neither reading adopted,
 * because the section body is the specification and the glance table is an
 * index — and "correcting" a frozen source is not this task's to do.
 */
export const SB_21_TO_30_DECISION_CITATIONS = [
  // ── 21 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 21,
    decision: 'DEC-ASK-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text: 'The storyboard presumes the question channel of DEC-ASK-001.',
        locator: 'L94469',
      },
      {
        text:
          'The freshness window after which a queued request is obsolete is not specified in the '
          + 'Statement of Work and is carried under DEC-ASK-001.',
        locator: 'L94471',
      },
      {
        text:
          'Question channel: User-Mandated Product Extension. Freshness window value: Client '
          + 'Decision Required, folded into DEC-ASK-001.',
        locator: 'L94545',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 21,
    decision: 'DEC-COACHREPLAY-001',
    canonMembership: 'member',
    citations: [
      {
        text:
          'The same principle as DEC-COACHREPLAY-001 in section 44.1, applied to an explicit '
          + 'worker question rather than to a detected difficulty.',
        locator: 'L94469',
      },
      {
        text: 'Conversion to a learning signal: Recommendation — R&D, shared with DEC-COACHREPLAY-001.',
        locator: 'L94545',
      },
    ],
    conflict: null,
  },
  // ── 22 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 22,
    decision: 'DEC-VISION-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text: 'The confidence threshold below which a result is treated as a failure.',
        locator: 'L94559',
      },
      {
        text: 'Confidence threshold and inference placement: Client Decision Required.',
        locator: 'L94628',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 22,
    decision: 'DEC-VISION-004',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      { text: 'Where inference runs. Inference is attempted subject to it.', locator: 'L94558' },
      {
        text: 'Confidence threshold and inference placement: Client Decision Required.',
        locator: 'L94628',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 22,
    decision: 'DEC-VISION-006',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          "The agent's existence is SoW Fact (§8.3.3); the behaviour is Recommendation — R&D with "
          + 'DEC-VISION-001 through DEC-VISION-006. The card names the range endpoint rather than '
          + 'each member, so -006 is disclosed and -002, -003 and -005 are not named by this card.',
        locator: 'L94586',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 22,
    decision: 'DEC-AIRTO-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'Recovery Time Objective and Recovery Point Objective: TBD — Client Decision Required.',
        locator: 'L94584',
      },
    ],
    conflict: null,
  },
  // ── 23 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 23,
    decision: 'DEC-STORE-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'Storage-full behaviour on the device is explicitly deferred to the Frontline Functional '
          + 'Specification and this blueprint may not invent it.',
        locator: 'L94636',
      },
      {
        text:
          'Anything not listed in the priority table is not determined by the Statement of Work; '
          + 'the storage-full behaviour is deferred. Client Decision Required.',
        locator: 'L94647',
      },
      {
        text:
          'Behaviour beyond the warning level is not specified in the Statement of Work and must '
          + 'not be invented; the position taken is that the answer must never be to discard '
          + 'evidence, and that a controlled stop is preferable to silent loss.',
        locator: 'L94656',
      },
      {
        text:
          'Fallback-of-fallback: Client Decision Required. This blueprint states only the '
          + 'prohibition — evidence is never discarded.',
        locator: 'L94670',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 23,
    decision: 'DEC-AIQUEUE-001',
    canonMembership: 'member',
    citations: [
      {
        text:
          'The unasked server-side question: the Statement of Work says nothing about server-side '
          + 'queue depth, back-pressure, or dead-letter retention.',
        locator: 'L94659',
      },
      {
        text:
          'Options: (a) bounded queues with oldest-first shedding of non-safety agent work and a '
          + 'recorded shed event; (b) unbounded queues with per-item freshness checks at execution '
          + 'time; (c) a hybrid. Recommendation: (c). Decision owner: the client platform team.',
        locator: 'L94720',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 23,
    decision: 'DEC-DEVICE-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'The device profile that would say how likely routine storage pressure is remains owed.',
        locator: 'L94680',
      },
    ],
    conflict: null,
  },
  // ── 24 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 24,
    decision: 'DEC-AIRTO-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'TBD — Client Decision Required, specifically for the time to full dashboard consistency '
          + 'after recovery. This is the section body naming a decision.',
        locator: 'L94759',
      },
      {
        text:
          "The chapter glance table records this storyboard's primary decision references as "
          + '"None — governed by §6.2.2 freshness classes", naming no decision at all. This is '
          + 'the index, and it disagrees with the body.',
        locator: 'L92716',
      },
    ],
    // The inverse of the 29/30 defect: here the body names a decision the index
    // says does not exist. Neither reading is adopted.
    conflict: 'glanceTableNamesNoDecisionWhereTheBodyDoes',
  },
  // ── 25 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 25,
    decision: 'DEC-WIPE-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'The contradiction, preserved: a final sync attempt before erasure is something an '
          + 'offline device cannot perform. The Statement of Work does not state how long a wipe '
          + 'command may remain pending, nor what happens if the device never returns. Not '
          + 'resolved here.',
        locator: 'L94810',
      },
      {
        text:
          'Where the device never returns, the data is protected by device encryption and the '
          + "application's encrypted store and the command is reported as undeliverable. What more "
          + 'should happen is undecided.',
        locator: 'L94832',
      },
      {
        text: 'The offline-wipe contradiction is still open.',
        locator: 'L94843',
      },
      {
        text:
          'Final sync before erasure: SoW Fact — §7.11, §8.13.3, and in direct tension with '
          + 'offline reality. Client Decision Required.',
        locator: 'L94884',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 25,
    decision: 'DEC-SUSP-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'Whether soft suspension lifts on an operator signal or automatically on payment. '
          + 'Adopted at Option C: release is by an explicit operator signal in the Super Admin '
          + 'platform console, and no payment event is observed because no payment integration '
          + 'exists, with the integration path left open and unbuilt. Derived Clarification — '
          + 'adopted working position, adopted 2026-08-14. The source saying both stays recorded '
          + 'and the adoption remains open for client ratification.',
        locator: 'L94810',
      },
      {
        text:
          'Soft-suspension release is the adopted position — an explicit operator signal in the '
          + 'Super Admin platform console. Derived Clarification — adopted working position.',
        locator: 'L94843',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 25,
    decision: 'DEC-SYNC-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'Adopted position: stop-class commands — suspension in all three states, device '
          + 'de-authorisation, remote wipe and compliance stop — are pulled and applied in phase 1, '
          + 'ahead of the capture upload, and the sync-then-wipe discipline still requires a final '
          + 'sync attempt before erasure, so no unsynced evidence is discarded.',
        locator: 'L94837',
      },
      {
        text:
          'The opposing source reading, that captures must upload first, stays recorded in the '
          + 'decision card.',
        locator: 'L94837',
      },
    ],
    conflict: null,
  },
  // ── 26 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 26,
    decision: 'DEC-NOSHIFT-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'The nobody-on-shift default to the Quality Manager role, marked as a fallback delivery.',
        locator: 'L94914',
      },
    ],
    conflict: null,
  },
  {
    storyboard: 26,
    decision: 'DEC-WIDIFF-001',
    canonMembership: 'member',
    citations: [
      {
        text:
          'The locale-completeness check exists to prevent this state, and its coverage across all '
          + 'three difficulty levels is exactly what this decision leaves open.',
        locator: 'L94924',
      },
      { text: 'Difficulty-level packaging: Client Decision Required.', locator: 'L94966' },
    ],
    conflict: null,
  },
  // ── 27 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 27,
    decision: 'DEC-NOSHIFT-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          "The nobody-on-shift default routes to the tenant's Quality Manager role irrespective of "
          + 'shift, marked as a fallback delivery.',
        locator: 'L94982',
      },
      { text: 'The nobody-on-shift default is carried under this decision.', locator: 'L95009' },
      {
        text: 'Escalation tiers and the nobody-on-shift default: SoW Fact — §3.9, unconfirmed.',
        locator: 'L95050',
      },
    ],
    conflict: null,
  },
  // ── 28 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 28,
    decision: 'DEC-HANDOFF-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'Where this is decided in favour, the deterministic handoff pack renders: held lots, open '
          + 'deviations, gate items with ages, qualification expiries inside the incoming shift, '
          + 'runs still in submitted state, and unresolved sync conflicts. It is conditional, not '
          + 'assumed.',
        locator: 'L95067',
      },
      { text: 'The pack and the note are Recommendation — R&D.', locator: 'L95094' },
    ],
    conflict: null,
  },
  {
    storyboard: 28,
    decision: 'DEC-HANDOFF-002',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          "Where this is decided in favour, the outgoing Supervisor's manual note carries the "
          + 'judgement no query can produce.',
        locator: 'L95069',
      },
      { text: 'The pack and the note are Recommendation — R&D.', locator: 'L95094' },
    ],
    conflict: null,
  },
  {
    storyboard: 28,
    decision: 'DEC-ROLE-001',
    canonMembership: 'member',
    citations: [
      {
        text:
          '"Plant Manager view" is the source\'s own phrase in §6.9.3, and whether it is backed by '
          + 'a role is unresolved.',
        locator: 'L95060',
      },
      { text: 'Plant-manager recipient status: Client Decision Required.', locator: 'L95136' },
    ],
    conflict: null,
  },
  {
    storyboard: 28,
    decision: 'DEC-AIRTO-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          'TBD — Client Decision Required; a shift boundary is the natural unit for the Shift '
          + "Handoff Agent's objective.",
        locator: 'L95092',
      },
    ],
    conflict: null,
  },
  // ── 29 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 29,
    decision: 'DEC-PLUS-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          "READING ONE — THE SPECIFICATION. Section 44A.29's body names no DEC-* identifier "
          + 'anywhere. Measured across the whole section span: zero occurrences. Its Source status '
          + 'row (L95179) reads "SoW Fact — §1.3, §2.2, §2.8, §3.5" and its Source classification '
          + 'paragraph (L95219) classifies the one derived element as Derived Clarification with no '
          + 'decision attached. On this reading the storyboard is governed by no open decision.',
        locator: 'L95138-L95219',
      },
      {
        text:
          "READING TWO — THE INDEX. The chapter's glance table attributes DEC-PLUS-001 to "
          + 'storyboard 29 as its primary decision reference.',
        locator: 'L92721',
      },
      {
        text:
          "CONTEXT FOR READING TWO. Elsewhere in the source DEC-PLUS-001's subject is the ordering "
          + 'implied by "Supervisor-plus" and "QM-plus" across five additive, non-hierarchical '
          + "roles — an authority-ordering question, not an attribution question. Storyboard 29's "
          + 'subject is which identity late-arriving data attaches to. The two are not obviously '
          + 'the same question, which is recorded here so a reviewer can weigh the index against '
          + 'the body rather than assume the index knows something the body omitted.',
        locator: 'L6597',
      },
    ],
    conflict: 'glanceTableAttributesWhatTheBodyDoesNotName',
  },
  // ── 30 ────────────────────────────────────────────────────────────────────
  {
    storyboard: 30,
    decision: 'DEC-DIVERGE-001',
    canonMembership: 'notAMemberOfTheExportedUnion',
    citations: [
      {
        text:
          "READING ONE — THE SPECIFICATION. Section 44A.30's body names no DEC-* identifier "
          + 'anywhere. Measured across the whole section span: zero occurrences. Its Source status '
          + 'row (L95269) reads "SoW Fact — §1.2, §1.4, §3.3, §6.5.4". On this reading the '
          + 'storyboard is governed by no open decision.',
        locator: 'L95221-L95308',
      },
      {
        text:
          "READING TWO — THE INDEX. The chapter's glance table attributes DEC-DIVERGE-001 to "
          + 'storyboard 30 as its primary decision reference.',
        locator: 'L92722',
      },
      {
        text:
          "CONTEXT FOR READING TWO. Elsewhere in the source DEC-DIVERGE-001's subject is the "
          + 'divergence monitoring THRESHOLD, Client Decision Required, not specified in the '
          + "Statement of Work. Storyboard 30's subject is the resolution rule — the record wins in "
          + 'every class, without exception (L95264) — which the source states as SoW Fact and not '
          + 'as an open question. A threshold for monitoring divergence is a plausible neighbour of '
          + 'this storyboard without being a decision it turns on.',
        locator: 'L92082',
      },
    ],
    conflict: 'glanceTableAttributesWhatTheBodyDoesNotName',
  },
] as const satisfies readonly StoryboardDecisionCitations[]

/* ====================================================================
 * THE TEN CARDS.
 * ==================================================================== */

/**
 * All ten in source order. Every one of the nineteen fields is prose read off
 * the card's second column; `facts` are the structured cross-checks 15A's nine
 * invariants read, and they are NOT restatements of the prose — a fact and the
 * sentence beside it are supplied independently so a contradiction between
 * them is catchable.
 *
 * A note on `contentOrigin` and `aiActs`, the two fact fields where a
 * transcriber has to judge rather than copy:
 *
 *   - `contentOrigin` asks where the guidance, rule or threshold a storyboard
 *     RENDERS came from. `modelGenerated` is the prohibited value (L93026,
 *     "the platform never invents content, rules, or thresholds"). None of
 *     these ten renders generated content; storyboard 26 renders a stated
 *     absence, and its gate is `unpassed` rather than `passed`, which is the
 *     honest pair — the second branch of that invariant exists because an
 *     absence with a passed gate is the same defect wearing a better label.
 *   - `aiActs` lists acts the storyboard has artificial intelligence PERFORM
 *     from L92653's reserved five. All ten are empty, and that is the finding
 *     rather than an oversight: in every one of these ten the source has
 *     artificial intelligence refuse or lose. Storyboard 21 refuses to execute
 *     the stale queued action, 22's failed inference never becomes a pass, 27's
 *     agent cannot release the hold, and 30's agent output loses to the record
 *     in every conflict class. Declaring an act with a null authority would
 *     assert the opposite of what these cards say.
 */
export const SB_21_TO_30 = [
  /* ── 44A.21 · A queued question is obsolete ─────────────────────────────── */
  {
    number: 21,
    identifier: 'SB-AI-21',
    fallback: { chapter: '44A.21', identifier: 'FB-AI-21' },
    cardHeaderRef: 'L94484',
    surfaceTableRef: 'L94508',
    content: {
      identifier: '`SB-AI-21`; fallback contract `FB-AI-21`; conditional on `DEC-ASK-001`',
      preconditions: 'A help request queued offline; the step since completed',
      trigger: 'Reconnection with a queued request whose context has moved on',
      actorsAndRoles:
        'Maya, Worker; Elena, Quality Manager in the learning read view; the screen’s author '
        + 'as the eventual beneficiary',
      workerVisibleExperience:
        'Nothing. No late card appears, no notification, no acknowledgement that a question was '
        + 'dropped, because a card arriving on a finished step is a distraction and a source of '
        + 'doubt',
      automaticFallback: 'Conversion to a learning signal; the request is never answered late',
      manualFallback:
        'Where a worker still wants help, they ask again on the current step, which is a fresh '
        + 'request in a fresh context',
      fallbackOfFallback:
        'Not applicable — there is nothing further to fall back to; the request has no '
        + 'operational consequence',
      safeStop:
        'Not applicable — no unsafe condition arises from a dropped question; the step was '
        + 'completed under authored guidance',
      localData: 'The queued request, its obsolescence evaluation, and its conversion to a signal',
      centralData: 'The signal against the step execution; aggregate request counts per screen',
      notifications: 'None. A single obsolete request is not a pattern and does not alert anyone',
      reconnection:
        'The obsolescence tests run before any agent invocation, on the device where the local '
        + 'state is authoritative about what the worker actually did',
      conflictResolution:
        'Where the device’s local state and the server’s state disagree about whether '
        + 'the step is complete, the more advanced state wins for obsolescence purposes, because '
        + 'the risk of answering a finished step exceeds the cost of not answering an open one',
      finalOfficialState:
        'One recorded learning signal; no agent output; the step’s own record unchanged',
      audit:
        'Request creation, obsolescence evaluation with the test that matched, conversion to a '
        + 'signal',
      recoveryObjectives: 'Not applicable — no service failure occurs',
      residualRisk:
        'A worker who asks and never receives an answer learns not to ask; the signal is '
        + 'preserved, but the relationship is not, and only the aggregate request rate will show it',
      sourceStatus:
        'Stale-action prohibition is a blueprint honesty rule; the question channel is '
        + '`DEC-ASK-001`; the freshness window is unspecified',
    },
    surfaces: {
      DOH: affected(
        'Files the learning signal against the step execution with both timestamps',
        'L94510',
      ),
      STU: affected(
        'Aggregate request counts per screen become instruction-review candidates',
        'L94511',
      ),
      CC: affected(
        'Learning read view shows the requests and their obsolescence; no alert',
        'L94512',
      ),
      FL: affected(
        'Evaluates obsolescence locally; delivers no late card; shows nothing',
        'L94513',
      ),
      SA: noEffect('the request never became an agent invocation', 'L94514'),
    },
    audit: [
      {
        id: 'SB-AI-21-AUD-1',
        statement: 'Request creation.',
        sourceRef: 'L94501',
      },
      {
        id: 'SB-AI-21-AUD-2',
        statement: 'Obsolescence evaluation, with the test that matched.',
        sourceRef: 'L94501',
      },
      {
        id: 'SB-AI-21-AUD-3',
        statement: 'Conversion to a signal.',
        sourceRef: 'L94501',
      },
    ],
    finalOfficialState: {
      name: 'One recorded learning signal; no agent output; the step’s own record unchanged',
      derivedFrom: ['SB-AI-21-AUD-1', 'SB-AI-21-AUD-2', 'SB-AI-21-AUD-3'],
    },
    reconstruction:
      'The creation event proves a request existed; the evaluation event names which obsolescence '
      + 'test matched, which is what made it a signal rather than an answerable item; the '
      + 'conversion event is the signal itself. No agent-invocation event appears in the log, and '
      + 'the source requires evaluation to precede any invocation (L94498), so "no agent output" '
      + 'is read off the log’s contents rather than assumed from its silence.',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      contentOrigin: 'authored',
      inference: 'noInference',
      gateOutcome: 'noGate',
      stateNamesShown: [
        'Queued offline',
        'Obsolete',
        'Uploaded as a learning signal',
        'Answerable request',
      ],
      outcomeIsPartial: false,
      partialLabelledPartial: false,
      // The device queued the request offline and the worker-visible experience
      // is "Nothing" (L94490). No spinner and no retry control against that.
      connectivity: 'knownOffline',
      showsSpinner: false,
      showsRetryControl: false,
      fixedMessages: [],
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      // L94545 restates L92653's fifth reserved act: the whole storyboard is
      // artificial intelligence NOT executing the stale queued action.
      aiActs: [],
    },
    absentCapability: {
      statement:
        'This storyboard presumes the question channel of `DEC-ASK-001`, and the freshness window '
        + 'that decides when a queued request is obsolete is not specified in the Statement of '
        + 'Work — it is carried under that decision. Stated before the behaviour is '
        + 'described, as `AC-44A-005` requires.',
      sourceRef: 'L94471',
    },
  },

  /* ── 44A.22 · Vision inference fails ────────────────────────────────────── */
  {
    number: 22,
    identifier: 'SB-AI-22',
    fallback: { chapter: '44A.22', identifier: 'FB-AI-22' },
    cardHeaderRef: 'L94566',
    surfaceTableRef: 'L94590',
    content: {
      identifier: '`SB-AI-22`; fallback contract `FB-AI-22`; instance of `FB-AGT-VIS-01`',
      preconditions:
        'A vision-assisted, proof-gated step in the later release; a photograph captured',
      trigger: 'Any inference failure or a below-threshold result',
      actorsAndRoles:
        'Maya, Worker — performs the inspection; Elena, Quality Manager — reviews '
        + 'evidence and inference records; the client’s platform team — owns model health',
      workerVisibleExperience:
        '"This image could not be assessed automatically. Inspect using the criteria above." No '
        + 'confidence figure, no partial interpretation, no retry loop',
      automaticFallback: 'Revert to human inspection against the authored criteria',
      manualFallback: 'The step’s alternative authored proof where the author configured one',
      fallbackOfFallback:
        'The step parks and a Supervisor is notified; the worker continues other assigned runs',
      safeStop:
        'The gate is unpassed until a human completes the authored proof. The part does not move on',
      localData:
        'The immutable photograph; the failed-inference record; the human’s captured result',
      centralData:
        'The evidence record; every inference record with model identity and version; any '
        + 'deviation the human result triggered',
      notifications:
        'None to the worker; repeated inconclusive results on one screen escalate to the Quality '
        + 'Manager as a quality signal; integrity failures escalate to platform operations',
      reconnection:
        'Where inference is server-side and the device is offline, the human path is used and the '
        + 'photograph queues; no inference is applied retroactively to a closed step',
      conflictResolution:
        'A later reprocessed result that contradicts the human outcome raises a divergence flag; '
        + 'it never overrides the human',
      finalOfficialState:
        'The step’s outcome is the human’s captured result, gated deterministically. '
        + 'Inference records are additive context',
      audit:
        'Capture, inference attempt and outcome, human result, gate evaluation, any deviation, any '
        + 'reprocessing',
      recoveryObjectives: '`TBD — Client Decision Required` — `DEC-AIRTO-001`',
      residualRisk:
        'If the inconclusive rate is high, workers do the same work with an extra wait; measuring '
        + 'the rate is what prevents the feature from becoming a net cost',
      sourceStatus:
        'The agent’s existence is `SoW Fact` — §8.3.3; the behaviour is '
        + '`Recommendation — R&D` with `DEC-VISION-001` through `DEC-VISION-006`',
    },
    surfaces: {
      DOH: affected(
        'Files the photograph, the human result, and every inference record; the run record '
        + 'reflects the human outcome',
        'L94592',
      ),
      STU: affected(
        'Authors the inspection criteria and the proof requirement; sees screens with high '
        + 'inconclusive rates as review candidates',
        'L94593',
      ),
      CC: affected(
        'Evidence review shows the photograph, the human result, and every inference record with '
        + 'version and confidence',
        'L94594',
      ),
      FL: affected(
        'Shows the inconclusive or unavailable message; renders the authored criteria; enforces '
        + 'the gate unchanged',
        'L94595',
      ),
      SA: affected(
        'Model health: inconclusive rate, integrity failures, version mismatches, latency, and '
        + 'divergence against human outcomes',
        'L94596',
      ),
    },
    audit: [
      { id: 'SB-AI-22-AUD-1', statement: 'Capture.', sourceRef: 'L94583' },
      {
        id: 'SB-AI-22-AUD-2',
        statement: 'Inference attempt and outcome, with model identity, version and confidence.',
        sourceRef: 'L94583',
      },
      { id: 'SB-AI-22-AUD-3', statement: 'Human result.', sourceRef: 'L94583' },
      { id: 'SB-AI-22-AUD-4', statement: 'Gate evaluation.', sourceRef: 'L94583' },
      {
        id: 'SB-AI-22-AUD-5',
        statement: 'Any deviation the human result triggered.',
        sourceRef: 'L94583',
      },
      { id: 'SB-AI-22-AUD-6', statement: 'Any reprocessing.', sourceRef: 'L94583' },
    ],
    finalOfficialState: {
      name:
        'The step’s outcome is the human’s captured result, gated deterministically; '
        + 'inference records are additive context',
      derivedFrom: [
        'SB-AI-22-AUD-1',
        'SB-AI-22-AUD-2',
        'SB-AI-22-AUD-3',
        'SB-AI-22-AUD-4',
      ],
    },
    reconstruction:
      'The capture event fixes the photograph before any inference (AC-44A-22-2); the inference '
      + 'event records the failure or below-threshold result; the human-result event carries the '
      + 'outcome; the gate-evaluation event records what the gate decided AND that it decided on '
      + 'the human result rather than the inference. The outcome is therefore read off the human '
      + 'result and the gate evaluation, and the inference event’s presence beside them is '
      + 'what shows it was additive rather than determinative. The reprocessing event, where one '
      + 'exists, is additive by the same reading and never rewrites the closed outcome (L94564).',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      contentOrigin: 'authored',
      inference: 'failed',
      // L94576: "The gate is unpassed until a human completes the authored
      // proof." A failed inference reaching a passed gate is the defect
      // L94553 calls the single most important sentence in the chapter.
      gateOutcome: 'unpassed',
      stateNamesShown: [
        'Inconclusive',
        'Unavailable',
        'Gate unpassed until proof',
        'Human inspection result captured',
      ],
      outcomeIsPartial: false,
      partialLabelledPartial: false,
      // The card covers both the online and the server-side-offline branch
      // (L94580) and fixes neither as the scenario, so connectivity is not
      // known-offline. L94572 forbids the retry loop regardless.
      connectivity: 'unknown',
      showsSpinner: false,
      showsRetryControl: false,
      // The worker message at L94572 is quoted by the source but is NOT one of
      // 15A's pinned wordings, which cover `SCR-FL-LOCK-01` only. Declaring it
      // here would report "no pinned wording covers it" — a true finding about
      // the pinned set, reported to wave 5, not a defect in this card.
      fixedMessages: [],
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      // L94562: the deviation rules, on-device classification and containment
      // fire on the human result — "none of which involves the model".
      aiActs: [],
    },
    absentCapability: {
      statement:
        'The Vision Reasoning Agent ships in a later release [`SoW Fact` — §8.3.3], and '
        + 'everything about its behaviour is `Recommendation — R&D` or `Client Decision '
        + 'Required`. This storyboard describes the runtime instance of a capability the Statement '
        + 'of Work does not yet carry, and says so before describing it.',
      sourceRef: 'L94553',
    },
  },

  /* ── 44A.23 · Storage fills with queued artificial-intelligence work ────── */
  {
    number: 23,
    identifier: 'SB-AI-23',
    fallback: { chapter: '44A.23', identifier: 'FB-AI-23' },
    cardHeaderRef: 'L94661',
    surfaceTableRef: 'L94685',
    content: {
      identifier: '`SB-AI-23`; fallback contract `FB-AI-23`',
      preconditions:
        '`TAB-014` offline for an extended period; queue growing; storage approaching its warning '
        + 'level',
      trigger: 'Storage crosses the warning level',
      actorsAndRoles:
        'Maya, Worker; Sam, Supervisor; Priya, Tenant Admin via the device banner; the '
        + 'client’s platform team via the fleet view',
      workerVisibleExperience:
        '"This tablet is running low on storage. Your work is safe. Connect to a network as soon '
        + 'as you can." No technical figures, one clear action',
      automaticFallback:
        'Evict reconstructible cached media; stop collecting optional agent requests; apply '
        + 'back-pressure',
      manualFallback:
        'The worker moves to coverage and syncs; the Supervisor swaps the device and reassigns '
        + 'runs through action 8',
      fallbackOfFallback:
        '`Client Decision Required` — `DEC-STORE-001`. This blueprint states only the '
        + 'prohibition: evidence is never discarded',
      safeStop: 'A controlled stop on new work rather than any loss of recorded work',
      localData:
        'Everything in priority classes 1 to 3 retained; class 4 collection halted; class 5 evicted',
      centralData:
        'The device’s storage state at last sync; fleet-level storage telemetry',
      notifications:
        'Worker banner; Supervisor visibility in the sync-state module; platform fleet alert',
      reconnection:
        'The queue drains in order with idempotency keys; storage recovers; optional collection '
        + 'resumes',
      conflictResolution: 'None arises from storage pressure itself',
      finalOfficialState:
        'Every class 1 and 2 item reaches the platform intact; optional items may legitimately be '
        + 'absent, and their absence is recorded rather than invisible',
      audit: 'Warning level crossings, evictions, collection halts, and recovery',
      recoveryObjectives:
        'Recovery Point Objective for evidence must be zero; the platform cannot promise a '
        + 'Recovery Point Objective for optional agent work, and should not pretend to',
      residualRisk:
        'An extended-offline site can reach storage pressure routinely; the device profile that '
        + 'would tell us how likely that is remains owed [`DEC-DEVICE-001`]',
      sourceStatus:
        '`Client Decision Required` — `DEC-STORE-001` for device behaviour and '
        + '`DEC-AIQUEUE-001` for server behaviour; the priority order is `Derived Clarification` '
        + 'from the fallback safety priority list',
    },
    surfaces: {
      DOH: affected(
        'Receives everything in priority classes 1 to 3 on eventual sync; records the '
        + 'storage-pressure episode',
        'L94687',
      ),
      STU: noEffect('the Studio has no device storage role', 'L94688'),
      CC: affected(
        'Sync-state module shows the device’s storage state alongside its queue depth and '
        + 'last successful sync',
        'L94689',
      ),
      FL: affected(
        'Applies the priority order, warns the worker, and never discards evidence',
        'L94690',
      ),
      SA: affected(
        'Fleet storage telemetry; owns the eventual `DEC-STORE-001` behaviour and any server-side '
        + 'queue policy',
        'L94691',
      ),
    },
    audit: [
      { id: 'SB-AI-23-AUD-1', statement: 'Warning level crossings.', sourceRef: 'L94678' },
      {
        id: 'SB-AI-23-AUD-2',
        statement: 'Evictions of reconstructible cached media.',
        sourceRef: 'L94678',
      },
      {
        id: 'SB-AI-23-AUD-3',
        statement: 'Collection halts on optional agent requests.',
        sourceRef: 'L94678',
      },
      { id: 'SB-AI-23-AUD-4', statement: 'Recovery.', sourceRef: 'L94678' },
    ],
    finalOfficialState: {
      name:
        'Every class 1 and 2 item reached the platform intact; optional items may legitimately be '
        + 'absent, and their absence is recorded rather than invisible',
      derivedFrom: [
        'SB-AI-23-AUD-1',
        'SB-AI-23-AUD-2',
        'SB-AI-23-AUD-3',
        'SB-AI-23-AUD-4',
      ],
    },
    reconstruction:
      'The crossing event marks when shedding began; the eviction and halt events name exactly '
      + 'what was shed and what stopped being collected, which is what makes an absent optional '
      + 'item an accounted-for absence rather than an invisible one; the recovery event marks the '
      + 'queue draining. Class 1 and 2 intactness follows because no event in the log can record '
      + 'their discard — discarding them is Explicitly prohibited (L94642, L94643) and '
      + '`AC-44A-23-1` asserts no path does it — so the log holding evictions of classes 4 '
      + 'and 5 only IS the reconstruction.',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      contentOrigin: 'authored',
      inference: 'noInference',
      gateOutcome: 'noGate',
      stateNamesShown: [
        'Storage warning level crossed',
        'Optional collection halted',
        'Queue draining in order',
        'Storage recovered',
      ],
      // L94677: optional items may legitimately be absent AND their absence is
      // recorded rather than invisible. A partial outcome, labelled partial.
      outcomeIsPartial: true,
      partialLabelledPartial: true,
      connectivity: 'knownOffline',
      showsSpinner: false,
      // L94708 panel 3: the help control renders an honest DISABLED state
      // rather than a control that silently fails. No retry against a
      // known-offline state, which L92843 calls theatre.
      showsRetryControl: false,
      fixedMessages: [],
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      aiActs: [],
    },
    absentCapability: {
      statement:
        'Storage-full behaviour on the device is explicitly deferred to the Frontline Functional '
        + 'Specification and this blueprint may not invent it — `DEC-STORE-001`. Behaviour '
        + 'beyond the warning level is not specified in the Statement of Work. What this '
        + 'storyboard states is the priority order any eventual answer must respect, and the '
        + 'separate server-side question `DEC-AIQUEUE-001` that nobody has asked yet.',
      sourceRef: 'L94636',
    },
  },

  /* ── 44A.24 · Artificial intelligence recovers but dashboards remain stale ─ */
  {
    number: 24,
    identifier: 'SB-AI-24',
    fallback: { chapter: '44A.24', identifier: 'FB-AI-24' },
    cardHeaderRef: 'L94741',
    surfaceTableRef: 'L94765',
    content: {
      identifier: '`SB-AI-24`; fallback contract `FB-AI-24`',
      preconditions:
        'An agent outage has just ended; boards and derived views hold pre-recovery data',
      trigger: 'Recovery of the reasoning layer',
      actorsAndRoles:
        'Sam, Supervisor — reads the board; Elena, Quality Manager — reads the learning '
        + 'and gate views; the client’s platform team — watches the recovery',
      workerVisibleExperience: 'None. Workers do not read the Command Center board',
      automaticFallback: 'Per-panel freshness markers and freshness classes on every view',
      manualFallback:
        'The reader drills into the underlying record, which is authoritative and carries its own '
        + 'timestamps',
      fallbackOfFallback:
        'Where a panel cannot establish its own freshness, it displays an explicit '
        + 'unknown-freshness state rather than a number',
      safeStop:
        'Not applicable — no unsafe condition arises, provided freshness is displayed. The '
        + 'unsafe version of this scenario is precisely the one where freshness is not displayed',
      localData: 'Unaffected; devices are not involved in dashboard staleness',
      centralData: 'Panel-level freshness timestamps; recomputation schedules; the recovery time',
      notifications: 'None; a stale panel is a display condition, not an operational event',
      reconnection: 'Not applicable at the device level',
      conflictResolution:
        'Where two panels disagree, the one with the later freshness marker is the more current, '
        + 'and the underlying record settles the question',
      finalOfficialState: 'Every panel current, every freshness marker postdating recovery',
      audit:
        'The recovery time and any panel-level recomputation failures; ordinary refresh cycles are '
        + 'telemetry rather than audit',
      recoveryObjectives:
        '`TBD — Client Decision Required` — `DEC-AIRTO-001`, specifically for the time '
        + 'to full dashboard consistency after recovery',
      residualRisk:
        'A decision made from a stale panel during the catch-up window is the real risk; freshness '
        + 'markers reduce it but only if they are prominent rather than decorative',
      sourceStatus: '`SoW Fact` — §1.3, §1.7, §6.2.2, §6.5.2',
    },
    surfaces: {
      DOH: affected(
        'Authoritative and unaffected; its records carry their own timestamps and are the '
        + 'resolution path',
        'L94767',
      ),
      STU: affected(
        'The learning read view shared with the Studio’s authors carries its own freshness '
        + 'marker',
        'L94768',
      ),
      CC: affected(
        'Every panel carries its own freshness marker and class; no panel implies currency it does '
        + 'not have',
        'L94769',
      ),
      FL: noEffect('the floor does not read these views', 'L94770'),
      SA: affected('Recovery telemetry and per-panel recomputation health', 'L94771'),
    },
    audit: [
      { id: 'SB-AI-24-AUD-1', statement: 'The recovery time.', sourceRef: 'L94758' },
      {
        id: 'SB-AI-24-AUD-2',
        statement: 'Any panel-level recomputation failures.',
        sourceRef: 'L94758',
      },
    ],
    finalOfficialState: {
      name: 'Every panel current, every freshness marker postdating recovery',
      derivedFrom: ['SB-AI-24-AUD-1', 'SB-AI-24-AUD-2'],
    },
    reconstruction:
      'The recovery-time event is the reference instant the final state is defined against — '
      + '"every freshness marker postdating recovery" is meaningless without it. The '
      + 'recomputation-failure events are the only way a panel can fail to reach currency, so the '
      + 'state is reached exactly when the log holds the recovery time and no unresolved '
      + 'recomputation failure after it. Ordinary refresh cycles are deliberately NOT in the log '
      + '(L94758 calls them telemetry rather than audit), which is why the reconstruction turns on '
      + 'failures rather than on counting successes.',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      // `authored`, and it is least-wrong rather than right. What this card
      // renders is dashboard panels: figures recomputed from records, each
      // carrying its own freshness marker (L94737, L94750). No guidance
      // element is rendered at all, and the union has no member saying so —
      // the seam `SB_21_TO_30_CONTRACT_SEAMS` reports. The panels and the
      // records behind them are authored artefacts and nothing here is
      // model-generated, so `authored` is defensible; it is not the same
      // claim as "no guidance element exists here".
      contentOrigin: 'authored',
      inference: 'noInference',
      gateOutcome: 'noGate',
      // L94750's explicit unknown-freshness state, and L94737's panel that says
      // its data predates recovery. Honest names, none collapsed.
      stateNamesShown: [
        'Current as of its own freshness marker',
        'Predates recovery',
        'Unknown freshness',
      ],
      // L94737: a panel whose data predates recovery says so. The catch-up
      // window is genuinely partial and is labelled panel by panel.
      outcomeIsPartial: true,
      partialLabelledPartial: true,
      connectivity: 'online',
      showsSpinner: false,
      showsRetryControl: false,
      fixedMessages: [],
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      aiActs: [],
    },
    // The one card in this range whose Source status row is pure `SoW Fact`
    // (L94761). It presumes no capability the Statement of Work lacks, so
    // `AC-44A-005` has nothing to require of it, and a manufactured statement
    // here would be this build inventing an admission the source does not make.
    absentCapability: null,
  },

  /* ── 44A.25 · An offline tablet is suspended or wiped ───────────────────── */
  {
    number: 25,
    identifier: 'SB-AI-25',
    fallback: { chapter: '44A.25', identifier: 'FB-AI-25' },
    cardHeaderRef: 'L94823',
    surfaceTableRef: 'L94847',
    content: {
      identifier: '`SB-AI-25`; fallback contract `FB-AI-25`',
      preconditions:
        '`TAB-014` offline with queued captures; a suspension or wipe approved centrally',
      trigger: 'A suspension-class or device-wipe command issued to an offline device',
      actorsAndRoles:
        'Aisha, Root Super Admin — critical-class approval; Noah, Admin; Priya, Tenant Admin '
        + '— sees the tenant-side banner for soft suspension; Maya, Worker — sees the '
        + 'fixed message on lock',
      workerVisibleExperience:
        'Nothing until the device contacts the platform. Then, for a compliance suspension, '
        + 'exactly the fixed message: "Operation suspended. Contact your supervisor. Your work has '
        + 'been saved."',
      automaticFallback:
        'The command waits in an honest pending state; the device continues to operate under its '
        + 'existing authorisation until it receives the command',
      manualFallback:
        'Physical retrieval of the device; account-level controls at the platform, which do not '
        + 'depend on the device',
      fallbackOfFallback:
        'Where the device never returns, the data on it is protected by device encryption and by '
        + 'the application’s encrypted store; the command is reported as undeliverable. What '
        + 'more should happen is `DEC-WIPE-001`',
      safeStop:
        'The device is either locked or wiped after contact, or the command remains honestly '
        + 'pending. There is no third, ambiguous state',
      localData:
        'Until contact, the device holds its queue and its pinned package. After a wipe, '
        + 'application data is erased; after a lock, it is retained and inaccessible',
      centralData:
        'The command with its full state history; the device’s last-contact time; the '
        + 'approval record',
      notifications:
        'Tenant Admin banner for soft suspension; mandatory notifications continue under hard '
        + 'suspension [`SoW Fact` — §4.2.3]; the worker sees only the fixed message',
      reconnection:
        'Ordering between a pending safety command and pending captures follows the adopted '
        + '`DEC-SYNC-001` position: stop-class commands — suspension in all three states, '
        + 'device de-authorisation, remote wipe and compliance stop — are pulled and applied '
        + 'in phase 1, ahead of the capture upload, and the platform’s sync-then-wipe '
        + 'discipline still requires a final sync attempt before erasure, so no unsynced evidence '
        + 'is discarded. The opposing source reading, that captures must upload first, stays '
        + 'recorded in the decision card',
      conflictResolution:
        'Where a wipe and a suspension are both pending, the more restrictive applies first; both '
        + 'are retained in the record',
      finalOfficialState:
        'Locked, wiped and acknowledged, or pending and reported as undeliverable. Never assumed',
      audit:
        'Approval, command creation, each state, delivery, final sync attempt, erasure, '
        + 'acknowledgement, or continued pendency',
      recoveryObjectives:
        'Not applicable — this is a security action, not a service. Delivery is '
        + 'device-contact-bound by design',
      residualRisk:
        'An offline device holding unsynced evidence and a pending wipe is a genuine conflict '
        + 'between security and data integrity, and the source does not resolve it',
      sourceStatus:
        'Suspension states and the fixed message are `SoW Fact` — §4.2.3; wipe as '
        + 'critical class is `SoW Fact` — §8.8.3; the offline-wipe contradiction is '
        + '`DEC-WIPE-001`, still open; soft-suspension release is the adopted `DEC-SUSP-001` '
        + 'position — an explicit operator signal in the Super Admin platform console, '
        + '`Derived Clarification — adopted working position`',
    },
    surfaces: {
      DOH: affected(
        'Records the suspension state and its effects; under hard suspension the enumerated '
        + 'completion pipeline continues and no new runs start',
        'L94849',
      ),
      STU: affected(
        'Under soft suspension, master-data writes are blocked but operations continue; authoring '
        + 'restrictions follow the suspension state',
        'L94850',
      ),
      CC: affected(
        'Shows the device’s pending command and last-contact time; shows the tenant’s '
        + 'suspension state where applicable',
        'L94851',
      ),
      FL: affected(
        'Nothing until contact; then the lock with the fixed message, or the wipe sequence',
        'L94852',
      ),
      SA: affected(
        'Owns the approval, the command, the fleet view, and the undeliverable reporting',
        'L94853',
      ),
    },
    audit: [
      { id: 'SB-AI-25-AUD-1', statement: 'Approval.', sourceRef: 'L94840' },
      { id: 'SB-AI-25-AUD-2', statement: 'Command creation.', sourceRef: 'L94840' },
      { id: 'SB-AI-25-AUD-3', statement: 'Each state of the command.', sourceRef: 'L94840' },
      { id: 'SB-AI-25-AUD-4', statement: 'Delivery.', sourceRef: 'L94840' },
      { id: 'SB-AI-25-AUD-5', statement: 'Final sync attempt.', sourceRef: 'L94840' },
      { id: 'SB-AI-25-AUD-6', statement: 'Erasure.', sourceRef: 'L94840' },
      { id: 'SB-AI-25-AUD-7', statement: 'Acknowledgement.', sourceRef: 'L94840' },
      { id: 'SB-AI-25-AUD-8', statement: 'Or continued pendency.', sourceRef: 'L94840' },
    ],
    finalOfficialState: {
      name:
        'Locked, wiped and acknowledged, or pending and reported as undeliverable — never '
        + 'assumed',
      derivedFrom: [
        'SB-AI-25-AUD-1',
        'SB-AI-25-AUD-2',
        'SB-AI-25-AUD-3',
        'SB-AI-25-AUD-4',
        'SB-AI-25-AUD-7',
        'SB-AI-25-AUD-8',
      ],
    },
    reconstruction:
      'WHICH of the three terminal states holds is decided by which events the log contains, which '
      + 'is exactly what "never assumed" (L94839) demands. Approval and creation establish the '
      + 'command exists and was authorised; the state history records every transition; a '
      + 'delivery event followed by an acknowledgement event yields locked-or-wiped; a pendency '
      + 'event with no delivery yields pending-and-undeliverable. There is no third reading, '
      + 'because the log cannot hold an acknowledgement the device did not send — which is '
      + 'the same fact `AC-44A-25-1` and `AC-44A-25-4` assert from the rendering side.',
    facts: {
      // THE STRICTEST RULE IN THE BLUEPRINT (L93459) BITES HERE. The command is
      // created, authorised and queued while the device is offline, so the
      // acknowledgement has not happened and no surface may say it has.
      deviceAcknowledgement: 'notAcknowledged',
      // Empty, and it is the point: L94874's device row reads "wipe pending,
      // device last contacted 09:58", NEVER "wiped".
      surfacesShowingApplied: [],
      contentOrigin: 'authored',
      inference: 'noInference',
      gateOutcome: 'noGate',
      stateNamesShown: [
        'Wipe pending',
        'Pending and reported as undeliverable',
        'Locked',
        'Wiped and acknowledged',
      ],
      outcomeIsPartial: false,
      partialLabelledPartial: false,
      connectivity: 'knownOffline',
      showsSpinner: false,
      showsRetryControl: false,
      // The one pinned wording in the chapter. English verbatim from L94829;
      // `spanish` is null because the frozen source writes none, and 15A's
      // check reports that against `TEST-44A-004`. See
      // `SB_21_TO_30_DISCLOSED_VIOLATIONS` — the report is true and stands.
      fixedMessages: [
        {
          screen: 'SCR-FL-LOCK-01',
          english: 'Operation suspended. Contact your supervisor. Your work has been saved.',
          spanish: null,
          sourceRef: 'L94829',
        },
      ],
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      aiActs: [],
    },
    absentCapability: {
      statement:
        'The Statement of Work requires a final sync attempt before erasure, which an offline '
        + 'device cannot perform, and it does not state how long a wipe command may remain pending '
        + 'nor what happens if the device never returns. That is `DEC-WIPE-001` and it is not '
        + 'resolved here — stated before the behaviour is described, as `AC-44A-005` requires.',
      sourceRef: 'L94810',
    },
  },

  /* ── 44A.26 · The primary artificial-intelligence fallback also fails ───── */
  {
    number: 26,
    identifier: 'SB-AI-26',
    fallback: { chapter: '44A.26', identifier: 'FB-AI-26' },
    cardHeaderRef: 'L94905',
    surfaceTableRef: 'L94929',
    content: {
      // VERBATIM from L94907. The two trailing literals are cross-references
      // and `FB-AI-04` is the §44A sense — see
      // `SB_21_TO_30_CROSS_REFERENCED_FALLBACKS`, which keys it as `44A.4` and
      // says why. Chapter 40.4's `FB-AI-04` at L88919 is a different contract
      // and would look just as plausible here, which is the trap.
      identifier:
        '`SB-AI-26`; fallback contract `FB-AI-26`; terminal case of `FB-AGT-PREV-01` and '
        + '`FB-AI-04`',
      preconditions:
        'Agent unreachable; no curated default for this screen and locale; no Work Instructions at '
        + 'the profile or standard level',
      trigger: 'The second fallback also returns nothing',
      actorsAndRoles:
        'Maya, Worker; Sam, Supervisor; the screen’s Studio author as the defect owner; '
        + 'Elena, Quality Manager, if the parked run affects a gated step',
      workerVisibleExperience:
        'The step’s specification limits, proof requirements, and inspection criteria — '
        + 'which are always present — plus "Ask your supervisor for help with this step."',
      automaticFallback: 'Exhausted. The device stops attempting and states its position',
      manualFallback: 'Supervisor assistance, physically or through the escalation record',
      fallbackOfFallback:
        'The nobody-on-shift default to the Quality Manager role, marked as a fallback delivery '
        + '[`DEC-NOSHIFT-001`]',
      safeStop:
        'The step parks. The run is not advanced. Other assigned runs remain available. Nothing is '
        + 'generated to fill the gap',
      localData:
        'The content-gap event naming the screen, the locale, the profile level, and the package '
        + 'version; the parked step',
      centralData: 'The content-gap event; the authoring defect; the escalation record',
      notifications:
        'Step-away escalation to the Supervisor; the content gap to the author as an authoring '
        + 'signal, not an operational alert',
      reconnection: 'Events upload; the defect enters the Studio’s review candidates',
      conflictResolution: 'None arises; absence conflicts with nothing',
      finalOfficialState:
        'The step is completed with valid proof after human assistance, or it remains parked. It '
        + 'is never completed without proof',
      audit:
        'Each fallback attempt and its failure, the content gap, the parking, the escalation, and '
        + 'the eventual resolution',
      recoveryObjectives:
        'Not applicable — the remedy is an authoring republish, not a service restoration',
      residualRisk:
        'This state is a publication defect that reached production; the locale-completeness check '
        + 'exists to prevent it, and its coverage across all three difficulty levels is exactly '
        + 'what `DEC-WIDIFF-001` leaves open',
      sourceStatus:
        'Prohibition on invention is `SoW Fact` — §3.7; the terminal ladder is `Derived '
        + 'Clarification`',
    },
    surfaces: {
      DOH: affected(
        'Records the parked step, the content gap, and the escalation; the run record stays '
        + 'accurate about what was not completed',
        'L94931',
      ),
      STU: affected(
        'Receives the defect; the fix is a republished version through Author, Reviewer, Release '
        + 'Authority',
        'L94932',
      ),
      CC: affected(
        'The parked run appears on the live shift board with its honest state; the escalation '
        + 'appears on the alert feed',
        'L94933',
      ),
      FL: affected(
        'Renders criteria and the supervisor direction; parks the step; keeps other runs available',
        'L94934',
      ),
      SA: noEffect('a tenant authoring gap is not a platform fault', 'L94935'),
    },
    audit: [
      {
        id: 'SB-AI-26-AUD-1',
        statement: 'Each fallback attempt and its failure.',
        sourceRef: 'L94922',
      },
      { id: 'SB-AI-26-AUD-2', statement: 'The content gap.', sourceRef: 'L94922' },
      { id: 'SB-AI-26-AUD-3', statement: 'The parking.', sourceRef: 'L94922' },
      { id: 'SB-AI-26-AUD-4', statement: 'The escalation.', sourceRef: 'L94922' },
      { id: 'SB-AI-26-AUD-5', statement: 'The eventual resolution.', sourceRef: 'L94922' },
    ],
    finalOfficialState: {
      name:
        'The step is completed with valid proof after human assistance, or it remains parked — '
        + 'never completed without proof',
      derivedFrom: [
        'SB-AI-26-AUD-1',
        'SB-AI-26-AUD-2',
        'SB-AI-26-AUD-3',
        'SB-AI-26-AUD-4',
        'SB-AI-26-AUD-5',
      ],
    },
    reconstruction:
      'The per-attempt failure events walk the ladder rung by rung and show it terminated rather '
      + 'than short-circuited; the content-gap event names the screen, locale, difficulty level '
      + 'and package version, so WHY it terminated is in the log and not merely THAT it did; the '
      + 'parking event is the terminal safe state; the escalation event shows a human was reached '
      + 'for. Which of the two final readings holds is decided by the resolution event: present, '
      + 'with valid proof, means completed after human assistance; absent means still parked. '
      + '"Never completed without proof" is derivable because no completion event can exist '
      + 'without the proof capture the gate requires — the gate did not relax (`AC-44A-26-5`).',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      // THE HONEST FOURTH CASE. Nothing was rendered as guidance because
      // nothing was authored — rungs 3, 4 and 5 of the ladder (L94898-L94900)
      // all return nothing. `modelGenerated` is what L93026 prohibits
      // absolutely, and L94960 puts it plainly: a computer writing safety
      // instructions for a factory would be the worst idea in the document.
      contentOrigin: 'statedAbsence',
      inference: 'noInference',
      // The pair that makes the absence honest. L93024's second half — the
      // tablet may neither invent to fill the gap NOR quietly let the worker
      // skip the step — is why `statedAbsence` beside a PASSED gate is the same
      // defect wearing a better label. The step parks; the gate is unpassed.
      gateOutcome: 'unpassed',
      stateNamesShown: [
        'Parked',
        'Content gap recorded',
        'Completed with valid proof after human assistance',
      ],
      // The partiality at L94899 is a rung of the ladder — the package is
      // present, its guidance for this screen and locale is not — and not the
      // OUTCOME. The outcome is parked or completed-with-proof, neither partial.
      outcomeIsPartial: false,
      partialLabelledPartial: false,
      // The agent is unreachable; the card fixes no device connectivity state.
      connectivity: 'unknown',
      showsSpinner: false,
      // L94897 bounds the retry and opens the circuit breaker; L94912 has the
      // device stop attempting and state its position.
      showsRetryControl: false,
      fixedMessages: [],
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      aiActs: [],
    },
    absentCapability: {
      statement:
        'The locale-completeness check exists to prevent this state, and its coverage across all '
        + 'three difficulty levels is exactly what `DEC-WIDIFF-001` leaves open — so this '
        + 'storyboard presumes difficulty-level packaging the Statement of Work does not fix. '
        + 'Stated in the card’s own text, as `AC-44A-005` requires.',
      sourceRef: 'L94924',
    },
  },

  /* ── 44A.27 · No authorized human is available ──────────────────────────── */
  {
    number: 27,
    identifier: 'SB-AI-27',
    fallback: { chapter: '44A.27', identifier: 'FB-AI-27' },
    cardHeaderRef: 'L94989',
    surfaceTableRef: 'L95013',
    content: {
      identifier: '`SB-AI-27`; fallback contract `FB-AI-27`',
      preconditions:
        'An active Severity 1 hold; no Quality Manager on shift; escalation routing authored',
      trigger: 'Role resolution finds no holder of the required authority',
      actorsAndRoles:
        'Sam, Supervisor — may request, may not release; Elena, Quality Manager — '
        + 'unavailable; Priya, Tenant Admin — owns the role-coverage problem',
      workerVisibleExperience:
        'The hold band persists on the device, unchanged: "Lot `LOT-WB-2291` is held. Release '
        + 'requires a Quality Manager." The worker continues other assigned runs',
      automaticFallback:
        'Authored fallback tiers, then the nobody-on-shift default, then Critical re-notification',
      manualFallback:
        'The Tenant Admin arranges Quality Manager coverage; the Supervisor’s request queues '
        + 'for whoever eventually holds the role',
      fallbackOfFallback:
        'None exists, by design. There is no mechanism by which a hold releases without a Quality '
        + 'Manager, and the absence of one is the safety property',
      safeStop:
        'The hold persists indefinitely. This is the correct outcome, not a failure of the design',
      localData:
        'The local hold, unchanged, enforced by the device regardless of any central condition',
      centralData:
        'The escalation record with every tier and every re-notification; the request-with-note '
        + 'items; the aging review-queue entry',
      notifications:
        'In-app and email, marked as fallback deliveries where they are; in-app notifications '
        + 'cannot be muted; re-notification at the Critical schedule',
      reconnection:
        'Not applicable — the hold is local and does not depend on connectivity',
      conflictResolution:
        'Where a Quality Manager eventually acts, the first recorded release stands; any duplicate '
        + 'request is presented as a duplicate and retained',
      finalOfficialState:
        'The hold remains in force until a Quality Manager releases it, with a full record of '
        + 'every attempt to reach one',
      audit:
        'Every routing attempt, every fallback delivery, every re-notification, every '
        + 'request-with-note, and the eventual release with its identity',
      recoveryObjectives:
        'Not applicable — no service has failed. The relevant published values are the 4-hour '
        + 'and 1-hour re-notification intervals and the 24, 48 and 72 hour review-queue aging '
        + 'highlights',
      residualRisk:
        'Production can be blocked for a full shift or longer. The platform’s position is '
        + 'that a blocked line is preferable to an unauthorised release, and the client should '
        + 'understand that this is a deliberate commercial trade-off',
      sourceStatus:
        '`SoW Fact` — §3.4, §3.5, §3.9, §6.5.6, §1.7; the '
        + 'nobody-on-shift default is `DEC-NOSHIFT-001`',
    },
    surfaces: {
      DOH: affected(
        'Enforces the release rule; records every escalation attempt; surfaces the role-coverage '
        + 'gap',
        'L95015',
      ),
      STU: affected(
        'Authored the routing and the severity mapping that produced the hold; no runtime role',
        'L95016',
      ),
      CC: affected(
        'Shows the hold, its age, the escalation state, and the request-with-note items; the '
        + 'release control is absent for every non-Quality-Manager identity',
        'L95017',
      ),
      FL: affected(
        'Hold band persists; other runs remain available; nothing about the device’s '
        + 'behaviour depends on anyone being reachable',
        'L95018',
      ),
      SA: noEffect(
        'there is no platform path to release a tenant’s Severity 1 hold, and creating one '
        + 'would break the uniform rule',
        'L95019',
      ),
    },
    audit: [
      {
        id: 'SB-AI-27-AUD-1',
        statement:
          'The Severity 1 hold in force on the lot, release requiring a Quality Manager.',
        sourceRef: 'L94980',
      },
      { id: 'SB-AI-27-AUD-2', statement: 'Every routing attempt.', sourceRef: 'L95006' },
      { id: 'SB-AI-27-AUD-3', statement: 'Every fallback delivery.', sourceRef: 'L95006' },
      { id: 'SB-AI-27-AUD-4', statement: 'Every re-notification.', sourceRef: 'L95006' },
      { id: 'SB-AI-27-AUD-5', statement: 'Every request-with-note.', sourceRef: 'L95006' },
      {
        id: 'SB-AI-27-AUD-6',
        statement: 'The eventual release, with its identity.',
        sourceRef: 'L95006',
      },
    ],
    finalOfficialState: {
      name:
        'The hold remains in force until a Quality Manager releases it, with a full record of '
        + 'every attempt to reach one',
      derivedFrom: [
        'SB-AI-27-AUD-1',
        'SB-AI-27-AUD-2',
        'SB-AI-27-AUD-3',
        'SB-AI-27-AUD-4',
        'SB-AI-27-AUD-5',
        'SB-AI-27-AUD-6',
      ],
    },
    // ONE OF THE TWO HARDEST CASES FOR `AC-44A-004` IN THIS RANGE: the state's
    // whole point is what the record does NOT say.
    reconstruction:
      'The hold event anchors the state and names the authority release requires. The release '
      + 'event is the ONLY event in the log that can end the hold, and it carries the releasing '
      + 'Quality Manager’s identity, so the state is read as: held while no release event '
      + 'exists, released when one does. That the log also holds every routing attempt, every '
      + 'fallback delivery, every re-notification and every request-with-note is what makes the '
      + '"full record of every attempt" half of the state derivable — and, decisively, none '
      + 'of those event types can be mistaken for a release, because a request-with-note changes '
      + 'no hold state (`AC-44A-27-3`) and no timeout, escalation exhaustion or re-notification '
      + 'count releases anything (`AC-44A-27-1`). The reconstruction therefore needs no clock and '
      + 'no counter, only the presence or absence of one identified event.',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      contentOrigin: 'authored',
      inference: 'noInference',
      // The Severity 1 hold does not relax. That is the storyboard.
      gateOutcome: 'held',
      // The source's own state names, from its state diagram at L95023-L95034.
      stateNamesShown: [
        'Held',
        'Escalating',
        'Renotifying',
        'Requested',
        'Released by a named Quality Manager',
      ],
      outcomeIsPartial: false,
      partialLabelledPartial: false,
      // L95003: the hold is local and does not depend on connectivity, and
      // `TEST-44A-27-5` takes the device offline to prove it. The card fixes no
      // connectivity state as the scenario.
      connectivity: 'unknown',
      showsSpinner: false,
      // L95042: deliberately no control, no countdown, and no "request release"
      // affordance on the worker surface.
      showsRetryControl: false,
      fixedMessages: [],
      // `AC-44A-27-1` (L95046) in its strongest form: no timeout, escalation
      // exhaustion, re-notification count or request releases the hold.
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      // L94974: "The agent cannot release the hold and neither can a
      // supervisor." Declaring `releasesAHold` here would assert the opposite
      // of the card.
      aiActs: [],
    },
    // The Source status row (L95009) is `SoW Fact` throughout; the
    // nobody-on-shift default is an unconfirmed decision rather than a
    // capability absent from the Statement of Work, and it is disclosed as one
    // in `SB_21_TO_30_DECISION_CITATIONS`.
    absentCapability: null,
  },

  /* ── 44A.28 · An outage crosses a shift ─────────────────────────────────── */
  {
    number: 28,
    identifier: 'SB-AI-28',
    fallback: { chapter: '44A.28', identifier: 'FB-AI-28' },
    cardHeaderRef: 'L95074',
    surfaceTableRef: 'L95098',
    content: {
      identifier: '`SB-AI-28`; fallback contract `FB-AI-28`; extends `FB-AGT-SHA-01`',
      preconditions:
        'Reasoning layer down since before the scheduled handoff; night shift ending; Day Shift '
        + 'arriving at 06:00',
      trigger: 'An agent outage spanning a shift boundary',
      actorsAndRoles:
        'The outgoing Supervisor; Sam, incoming Supervisor; Elena, Quality Manager; the '
        + 'plant-manager view as escalation target',
      workerVisibleExperience:
        'Authored Work Instructions instead of coaching; no other change. Arriving workers see '
        + 'their own assigned-task readiness only where a brief exists, and nothing where it does '
        + 'not',
      automaticFallback:
        'The honest no-brief state plus the deterministic handoff pack where implemented; '
        + 'escalation to the plant-manager view',
      manualFallback:
        'The outgoing Supervisor’s note; a verbal handover recorded through the panel’s '
        + 'annotate action',
      fallbackOfFallback:
        'The incoming Supervisor works directly from the Delivery Operations Hub’s live '
        + 'queues — held lots, open deviations, gate queue, expiring qualifications — '
        + 'which are the pack’s own sources',
      safeStop:
        'The shift starts on time with degraded awareness, honestly stated. No run is blocked and '
        + 'no hold is released',
      localData:
        'Devices are unaffected; every pinned package and every deterministic guarantee is intact '
        + 'across the boundary',
      centralData:
        'The misfire record; the pack or note where produced; the escalation record; the outage '
        + 'incident',
      notifications:
        'The no-brief state; the outlasting-a-shift escalation; in-app and email only',
      reconnection: 'Not applicable at the device level; recovery is server-side',
      conflictResolution:
        'Where a pack and a note disagree, the operational record settles it; neither artifact is '
        + 'edited to match the other',
      finalOfficialState:
        'The shift proceeds; the handoff gap is recorded as a misfire and an incident; awareness '
        + 'was degraded for a stated window',
      audit:
        'Misfire, no-brief state, pack or note production, acknowledgement with provenance, '
        + 'escalation, and recovery',
      recoveryObjectives:
        '`TBD — Client Decision Required` — `DEC-AIRTO-001`; a shift boundary is the '
        + 'natural unit for the Shift Handoff Agent’s objective',
      residualRisk:
        'The incoming shift inherits open Severity 1 holds and open deviations with less context '
        + 'than usual; the deterministic pack narrows the gap but does not close it, because '
        + 'pattern analysis is exactly what is missing',
      sourceStatus:
        'Escalation on outlasting a shift is `SoW Fact` — §6.9.3; the pack and the note '
        + 'are `Recommendation — R&D` under `DEC-HANDOFF-001` and `DEC-HANDOFF-002`',
    },
    surfaces: {
      DOH: affected(
        'Records the misfire, the pack or note, every acknowledgement, and the escalation; its '
        + 'live queues are the ultimate fallback source',
        'L95100',
      ),
      STU: affected(
        'Receives no watch items for the outage window, which is itself a loss worth recording',
        'L95101',
      ),
      CC: affected(
        'Shift handoff panel shows the honest state and any pack or note; the plant-manager view '
        + 'carries the escalation',
        'L95102',
      ),
      FL: affected(
        'Unaffected in every safety respect; coaching falls back per section 44.1',
        'L95103',
      ),
      SA: affected(
        'Owns the outage incident and its recovery; records the cross-shift duration as an '
        + 'escalation trigger',
        'L95104',
      ),
    },
    audit: [
      { id: 'SB-AI-28-AUD-1', statement: 'Misfire.', sourceRef: 'L95091' },
      { id: 'SB-AI-28-AUD-2', statement: 'No-brief state.', sourceRef: 'L95091' },
      { id: 'SB-AI-28-AUD-3', statement: 'Pack or note production.', sourceRef: 'L95091' },
      {
        id: 'SB-AI-28-AUD-4',
        statement: 'Acknowledgement, with the provenance of the artifact acknowledged.',
        sourceRef: 'L95091',
      },
      { id: 'SB-AI-28-AUD-5', statement: 'Escalation.', sourceRef: 'L95091' },
      { id: 'SB-AI-28-AUD-6', statement: 'Recovery.', sourceRef: 'L95091' },
    ],
    finalOfficialState: {
      name:
        'The shift proceeds; the handoff gap is recorded as a misfire and an incident; awareness '
        + 'was degraded for a stated window',
      derivedFrom: [
        'SB-AI-28-AUD-1',
        'SB-AI-28-AUD-2',
        'SB-AI-28-AUD-3',
        'SB-AI-28-AUD-4',
        'SB-AI-28-AUD-5',
        'SB-AI-28-AUD-6',
      ],
    },
    reconstruction:
      'The misfire event and the recovery event bound the window, so "degraded for a stated '
      + 'window" is computed from two timestamps in the log rather than asserted. The no-brief '
      + 'event records that the gap was published honestly and names the shift; the pack-or-note '
      + 'event records what substituted for the brief; the acknowledgement event binds the '
      + 'incoming Supervisor to the artifact actually read, with its provenance, which is what '
      + 'makes "the shift proceeds" a recorded fact rather than an inference from silence; the '
      + 'escalation event records the failure outlasting a shift. Missed occurrences are recorded '
      + 'as misfires and are never backfilled (L95072, `AC-44A-28-2`), so a later brief cannot '
      + 'retroactively close the window in the log.',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      // L95080: authored Work Instructions instead of coaching. The pack is
      // assembled from records (L95117), never generated.
      contentOrigin: 'authored',
      inference: 'noInference',
      gateOutcome: 'noGate',
      stateNamesShown: [
        'No brief was written for the shift',
        'Misfire',
        'Acknowledged against the artifact read',
      ],
      // L95090 and L95093: the pack narrows the awareness gap but does not
      // close it, and the no-brief state says so by name.
      outcomeIsPartial: true,
      partialLabelledPartial: true,
      // The outage is of the reasoning layer, not of connectivity: L95085 has
      // devices unaffected and L95088 puts recovery server-side.
      connectivity: 'online',
      showsSpinner: false,
      showsRetryControl: false,
      fixedMessages: [],
      // L95084: no run is blocked and no hold is released.
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      // The Shift Handoff Agent produced nothing at all (L95065), so it
      // performed none of the five reserved acts.
      aiActs: [],
    },
    // TWO QUOTATIONS, BOTH NOW THE SOURCE'S OWN, EACH WITH THE LINE IT IS ON.
    // This element used to quote "where the decision is decided in favour",
    // which the frozen source does not contain anywhere — `grep -c` returns 0.
    // The source writes the condition twice and names a different decision each
    // time: L95067 "Where `DEC-HANDOFF-001` is decided in favour" and L95069
    // "where `DEC-HANDOFF-002` is decided in favour". One quoted clause with its
    // own locator replaces the manufactured composite.
    // It also used to attribute "plant-manager view" to §6.9.3. L95060 writes
    // "Plant Manager view" — capitalised, unhyphenated — and L95058 quotes
    // §6.9.3 the same way; the hyphenated lowercase form is the source's own
    // NARRATIVE at L95068, not the phrase it attributes to §6.9.3. Quoting the
    // narrative form as the §6.9.3 phrase is paraphrase-as-quotation.
    absentCapability: {
      statement:
        'The deterministic handoff pack and the outgoing Supervisor’s manual note are '
        + '`Recommendation — R&D` under `DEC-HANDOFF-001` and `DEC-HANDOFF-002`, so this '
        + 'storyboard describes them conditionally — "Where `DEC-HANDOFF-001` is decided in '
        + 'favour" (L95067), and the same for `DEC-HANDOFF-002` (L95069) — rather than as '
        + 'capabilities the Statement of Work carries. The phrase §6.9.3 supplies for what '
        + 'this storyboard escalates to is "Plant Manager view" (L95060), and whether it is '
        + 'backed by a role is `DEC-ROLE-001`, unresolved.',
      sourceRef: 'L95094',
    },
  },

  /* ── 44A.29 · Recovery occurs after a personnel change ──────────────────── */
  {
    number: 29,
    identifier: 'SB-AI-29',
    fallback: { chapter: '44A.29', identifier: 'FB-AI-29' },
    cardHeaderRef: 'L95159',
    surfaceTableRef: 'L95183',
    content: {
      // NO `DEC-*` APPEARS ANYWHERE IN THIS CARD, and none appears anywhere in
      // section 44A.29's body — measured across L95138-L95219, zero
      // occurrences. The chapter's glance table attributes `DEC-PLUS-001` to
      // this storyboard at L92721. The body is the specification and the glance
      // table is an index, so the body's position is what renders here and the
      // glance-table attribution is disclosed as the conflicting reading in
      // `SB_21_TO_30_DECISION_CITATIONS`, with both locators and neither adopted.
      identifier: '`SB-AI-29`; fallback contract `FB-AI-29`',
      preconditions:
        'Late-arriving captures and late-arriving agent output; the originating worker off shift; '
        + 'a different worker and supervisor now present',
      trigger: 'Recovery or reconnection after a shift change or a substitution',
      actorsAndRoles:
        'Maya, Worker — actor of record for her own captures; Ahmed, substitute Worker; Sam '
        + 'and the incoming Supervisor; Elena, Quality Manager',
      workerVisibleExperience:
        'Ahmed sees the current state of his bench, including the hold Maya’s capture caused. '
        + 'He does not see the coaching or the prompts that were addressed to Maya',
      automaticFallback:
        'Attribution by the identity recorded in the envelope at capture time; role resolution to '
        + 'current holders for outstanding decisions',
      manualFallback:
        'The structured handover already provided at substitution: last completed step, open '
        + 'flags, current state',
      fallbackOfFallback:
        'Where an outstanding decision has no current holder, storyboards 6 and 27 apply',
      safeStop:
        'Outstanding decisions remain open and visibly aging; nothing auto-resolves because the '
        + 'original person left',
      localData:
        'Each capture carries its own worker identity; a substitution boundary is recorded on the '
        + 'run',
      centralData:
        'Captures attributed to their original actors; decisions attributed to their current '
        + 'deciders; the substitution record with its reason',
      notifications:
        'Late material notifies current role holders, marked with the original event time and the '
        + 'delivery time',
      reconnection:
        'Ordinary queue drain with idempotency keys; attribution is not affected by arrival order',
      conflictResolution:
        'Where a late capture conflicts with a central change made after the shift change, the '
        + 'sync-conflict review panel applies; resolution is Quality Manager and above',
      finalOfficialState:
        'Every capture attributed to the person who made it; every decision attributed to the '
        + 'person who made it; the substitution boundary visible on the run record',
      audit:
        'Identity and action per event; substitution with reason; abandonment closures with reasons',
      recoveryObjectives: 'Not applicable — attribution correctness is not time-bound',
      residualRisk:
        'A late-arriving deviation about a departed worker can feel accusatory to the person now '
        + 'at the bench; the interface must be careful to attribute clearly rather than merely '
        + 'display',
      sourceStatus: '`SoW Fact` — §1.3, §2.2, §2.8, §3.5',
    },
    surfaces: {
      DOH: affected(
        'Files every capture under its original actor; records the substitution and any '
        + 'abandonment closures',
        'L95185',
      ),
      STU: noEffect('authoring is unaffected by personnel changes on the floor', 'L95186'),
      CC: affected(
        'Shows late material with both timestamps and the original actor; routes outstanding '
        + 'decisions to current role holders',
        'L95187',
      ),
      FL: affected(
        'Shows the current worker their own runs and the current state of their bench; never '
        + 're-addresses another worker’s coaching to them',
        'L95188',
      ),
      // L95189 writes "No involvement IN TENANT PERSONNEL; identity handling is
      // a tenant record matter". The scope qualifier was dropped here, and
      // `effectStatement` then rendered a blanket "No direct effect —" the
      // source does not state. It is now carried in the reason, in the same
      // subject-restored form the other two informative markers use
      // (L93499, L93928).
      SA: noEffect(
        'it has no involvement in tenant personnel; identity handling is a tenant record matter',
        'L95189',
      ),
    },
    audit: [
      {
        id: 'SB-AI-29-AUD-1',
        statement: 'Identity and action per event, never an acting-as-role construct.',
        sourceRef: 'L95176',
      },
      { id: 'SB-AI-29-AUD-2', statement: 'Substitution, with reason.', sourceRef: 'L95176' },
      {
        id: 'SB-AI-29-AUD-3',
        statement: 'Abandonment closures, with reasons.',
        sourceRef: 'L95176',
      },
    ],
    finalOfficialState: {
      name:
        'Every capture attributed to the person who made it; every decision attributed to the '
        + 'person who made it; the substitution boundary visible on the run record',
      derivedFrom: ['SB-AI-29-AUD-1', 'SB-AI-29-AUD-2', 'SB-AI-29-AUD-3'],
    },
    reconstruction:
      'This is the most directly derivable of the ten, because the state IS the audit log’s '
      + 'own content: an audit of identity-and-action per event, read back, gives exactly "every '
      + 'capture attributed to the person who made it; every decision attributed to the person who '
      + 'made it". The substitution event with its reason places the boundary on the run record. '
      + 'The abandonment closures account for the departed worker’s open step executions. And '
      + 'because the log records identity and action rather than "acting as role" (`AC-44A-29-5`), '
      + 'the reconstruction cannot silently reassign responsibility — which L95146 names as '
      + 'the common and serious defect this storyboard exists to prevent.',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      // `authored`, and it is least-wrong rather than right. What this card
      // renders is attribution — identity and action per event, the
      // substitution boundary, the abandonment closures (L95176) — which is a
      // record read back, not a guidance element with a provenance. The union
      // has no member for "this storyboard renders no guidance, rule or
      // threshold at all"; the seam `SB_21_TO_30_CONTRACT_SEAMS` reports that.
      // Nothing here is model-generated: the one agent artefact in the
      // storyboard attaches to the deviation as a marked reading with its own
      // production timestamp (L95154) and is not what the card renders as
      // the rule.
      contentOrigin: 'authored',
      inference: 'noInference',
      // L95165: the hold Maya's capture caused; L95169: outstanding decisions
      // remain open and visibly aging, and nothing auto-resolves.
      gateOutcome: 'held',
      stateNamesShown: [
        'Uploaded and attributed to the capturing worker',
        'Outstanding and visibly aging',
        'Abandoned, with the reason recorded',
      ],
      outcomeIsPartial: false,
      partialLabelledPartial: false,
      connectivity: 'online',
      showsSpinner: false,
      showsRetryControl: false,
      fixedMessages: [],
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      // L95154: the agent's output attaches to the deviation with its own
      // production timestamp. Attaching a brief is none of the five reserved
      // acts, and the deviation's classification was deterministic and already
      // recorded.
      aiActs: [],
    },
    // Source status is `SoW Fact` throughout (L95179) and the one derived
    // element is a `Derived Clarification` (L95219). No capability absent from
    // the Statement of Work is presumed.
    absentCapability: null,
  },

  /* ── 44A.30 · Artificial intelligence conflicts with the official record ── */
  {
    number: 30,
    identifier: 'SB-AI-30',
    fallback: { chapter: '44A.30', identifier: 'FB-AI-30' },
    cardHeaderRef: 'L95249',
    surfaceTableRef: 'L95273',
    content: {
      // NO `DEC-*` APPEARS ANYWHERE IN THIS CARD, and none appears anywhere in
      // section 44A.30's body — measured across L95221-L95308, zero
      // occurrences. The chapter's glance table attributes `DEC-DIVERGE-001` to
      // this storyboard at L92722. Same treatment as storyboard 29: the body's
      // position renders, the index's attribution is disclosed as the
      // conflicting reading with both locators, and neither is adopted.
      identifier: '`SB-AI-30`; fallback contract `FB-AI-30`',
      preconditions: 'An agent output and an authoritative record that disagree',
      trigger: 'Automatic field comparison or a human observation',
      actorsAndRoles:
        'Elena, Quality Manager — reads, annotates, and decides; Sam, Supervisor — may '
        + 'observe and annotate; Omar, Read-only Auditor — reads the resulting record in the '
        + 'Delivery Operations Hub; Daniel, Platform Engineer — owns the regression',
      workerVisibleExperience:
        'None. Conflicts between an agent and a record are resolved above the floor and would only '
        + 'introduce doubt if surfaced there',
      automaticFallback: 'The authoritative source stands; the agent output is marked',
      manualFallback: 'A human annotation recording the observed conflict',
      fallbackOfFallback:
        'Where the authoritative source is itself suspect, the record’s own correction '
        + 'discipline applies — append-only, never overwrite',
      safeStop:
        'Not applicable — no unsafe operational condition arises from a marked, subordinated '
        + 'agent output',
      localData:
        'Not applicable — conflict resolution occurs server-side against server-held records',
      centralData:
        'The unchanged record; the marked agent output; the annotation; the regression candidate',
      notifications:
        'None automatic; a Quality Manager may escalate a serious conflict through ordinary '
        + 'channels',
      reconnection: 'Not applicable',
      conflictResolution: 'Record wins, in every class, without exception',
      finalOfficialState:
        'The record unchanged and authoritative; the agent output retained and marked; the '
        + 'disagreement permanently visible',
      audit:
        'The conflict, its marking, any annotation with identity and time, and the regression '
        + 'candidate',
      recoveryObjectives: 'Not applicable — no service failure occurs',
      residualRisk:
        'A high conflict rate erodes trust in agent output generally, including where it is '
        + 'correct; measuring and acting on the rate is the only remedy',
      sourceStatus: '`SoW Fact` — §1.2, §1.4, §3.3, §6.5.4',
    },
    surfaces: {
      DOH: affected(
        'Holds the authoritative record; accepts append-only annotations; records the conflict',
        'L95275',
      ),
      STU: affected(
        'Where the conflict points at authored content, it becomes an authoring candidate and '
        + 'travels through the approval chain',
        'L95276',
      ),
      CC: affected(
        'Displays the record first and the agent output as subordinate and marked; provides the '
        + 'annotation control',
        'L95277',
      ),
      FL: noEffect(
        'the floor sees the deterministic verdict and the authored content only',
        'L95278',
      ),
      SA: affected(
        'Conflict rates as agent-health and evaluation signals; the agents’ internal '
        + 'reasoning stays platform-internal',
        'L95279',
      ),
    },
    audit: [
      {
        id: 'SB-AI-30-AUD-1',
        statement:
          'The conflict, naming the field, the agent’s value, the record’s value, and '
          + 'the comparison time.',
        sourceRef: 'L95266',
      },
      { id: 'SB-AI-30-AUD-2', statement: 'Its marking.', sourceRef: 'L95266' },
      {
        id: 'SB-AI-30-AUD-3',
        statement: 'Any annotation, with identity and time.',
        sourceRef: 'L95266',
      },
      { id: 'SB-AI-30-AUD-4', statement: 'The regression candidate.', sourceRef: 'L95266' },
    ],
    finalOfficialState: {
      name:
        'The record unchanged and authoritative; the agent output retained and marked; the '
        + 'disagreement permanently visible',
      derivedFrom: [
        'SB-AI-30-AUD-1',
        'SB-AI-30-AUD-2',
        'SB-AI-30-AUD-3',
        'SB-AI-30-AUD-4',
      ],
    },
    // THE OTHER HARDEST CASE FOR `AC-44A-004`: the state is a claim about what
    // the record says, reconstructed from a log of what happened to it.
    reconstruction:
      'The conflict event carries BOTH values and the comparison time (L95243), so the '
      + 'record’s value at the moment of disagreement is itself in the log. "The record '
      + 'unchanged" then follows from that recorded value together with the absence of any '
      + 'mutation event — and no mutation event can exist, because no agent output can '
      + 'create, alter or delete any field of an authoritative record (`AC-44A-30-1`) and any '
      + 'legitimate correction appends rather than overwrites (L95246). The marking event gives '
      + '"retained and marked"; the annotation events give the human half with identity and time; '
      + 'the regression-candidate event closes the loop to the evaluation harness '
      + '(`AC-44A-30-6`). "Permanently visible" is derivable because nothing is deleted at any '
      + 'point (L95247, `AC-44A-30-4`), so no event can remove an earlier one from the log.',
    facts: {
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: [],
      // AUTHORED, NOT `modelGenerated`, AND THIS IS THE JUDGEMENT CALL OF THE
      // TEN. L93026's prohibition is on the platform INVENTING content, rules
      // or thresholds — a generative substitute standing in for something
      // authored. Storyboard 30 does the opposite: the authoritative record
      // stands unchanged (L95242) and the agent's differing value renders as a
      // visually subordinate, marked reading (L95277). What is rendered AS the
      // rule is the record. The agent's opinion is rendered as an opinion, and
      // retaining a marked wrong answer is the honesty requirement rather than
      // a breach of it.
      contentOrigin: 'authored',
      // The agent's output diverged from the authoritative source. L95236's
      // fourth class is exactly a reprocessed inference contradicting a closed
      // human outcome.
      inference: 'failed',
      // No gate is evaluated in this storyboard. The deterministic verdict
      // already stands and the floor sees it (L95278); conflict resolution
      // happens above the floor.
      gateOutcome: 'noGate',
      stateNamesShown: [
        'Record unchanged and authoritative',
        'Agent output retained and marked',
        'Classification-divergence flag',
        'Regression candidate',
      ],
      outcomeIsPartial: false,
      partialLabelledPartial: false,
      connectivity: 'online',
      showsSpinner: false,
      showsRetryControl: false,
      fixedMessages: [],
      // L95233: deterministic wins. The Severity 1 hold and every gate stand
      // exactly as authored in all four conflict classes.
      deterministicStandings: {
        specificationGate: 'unchanged',
        evaluationGate: 'unchanged',
        qualificationGate: 'unchanged',
        severityOneHold: 'unchanged',
      },
      // The agent STATES a classification in conflict class 1 and LOSES: the
      // deterministic band stands and the agent's reading becomes a divergence
      // flag (L95233). It therefore never classifies in the authoritative sense
      // L92653 reserves — "Record wins, in every class, without exception"
      // (L95264) — so no reserved act is performed and none is declared.
      aiActs: [],
    },
    // Source status is `SoW Fact` throughout (L95269). No capability absent
    // from the Statement of Work is presumed.
    absentCapability: null,
  },
] as const satisfies readonly TranscribedStoryboard[]
