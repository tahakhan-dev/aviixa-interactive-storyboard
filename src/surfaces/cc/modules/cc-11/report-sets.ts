import type { CcLocalDisclosure } from '@/surfaces/cc/decisions/disclosure'
import { CC_DECISION_REGISTER } from '@/surfaces/cc/decisions/register'

/**
 * THE FIVE STANDARD DATA SETS, AND THE IDENTITY THE SOURCE DOES NOT RECORD.
 *
 * ── WHAT IS OPEN IS THE WHOLE LIST, NOT ONE ENTRY ────────────────────────
 *
 * The commissioning dispatch put it as "the source names the five sets and
 * leaves ONE identity open". Read against the frozen source that is two
 * different open items collapsed into one, and the smaller of the two is the
 * one it names.
 *
 * L38259 introduces the list as **"The proposed identities"** — proposed, for
 * all five. L38267 then states what is settled and what is not: *"the number,
 * five, and the home, this surface, are settled; the exact list is the
 * client's to confirm or adjust"*, and *"the move is to swap items within the
 * single list of five, not to grow the list"*. So NONE of the five identities
 * is confirmed, and `identityConfirmed` below is `false` on all five with the
 * count computed rather than typed.
 *
 * SEPARATELY, and this is the item the dispatch was reaching for, ONE set —
 * set 4 — is named differently by the two Parts, and the source flags that as
 * a contradiction in its own words at L38267 and again at L29892.
 *
 * THE FAILURE MODE HERE IS INVENTION, and it would read as source-backed
 * forever. Nothing below supplies a name the source does not write. The three
 * outcome-flavoured examples L38267 offers — deviation trends by severity,
 * coaching effectiveness, time-to-contain — are carried as the source's own
 * ILLUSTRATIONS of a permitted swap, never as a sixth set and never as a
 * replacement for one of the five.
 *
 * ── A THIRD SPELLING OF SET 4 EXISTS AND IS NOT ONE OF THE TWO READINGS ──
 *
 * L54388 writes set 4 as `clearance or override frequency by role` — neither
 * reading A nor reading B, and it takes the Hub Part's spelling for set 5 in
 * the same sentence. Recorded as an observation with its line; it is not
 * offered as a third reading, because the source preserves two.
 *
 * ── SET 5 DIVERGES TOO, AND THIS MODULE'S OWN SECTION DOES NOT SAY SO ────
 *
 * §6.12.1 (L38265) names it `Allocation consumption trend`; §4.10.5 (L29888)
 * names it `Tier-allocation consumption trend`. L38267 — the open-item
 * paragraph in this module's own card — names ONLY set 4's divergence, and so
 * does §4.10.5's contradiction paragraph at L29892. A reader of either
 * section alone would take set 5's name as settled.
 *
 * THE SOURCE DOES RECORD IT, IN A THIRD PLACE. `DEC-REPORT-001`'s full
 * decision card at L113009-L113026 states it plainly at L113013: *"The two
 * sections name the same five sets with two different wordings for sets 4 and
 * 5, and both sections declare the identity open."* This was found by a gate
 * asserting the source nowhere pairs set 5's two names — it went red, and the
 * red was right. `namesDifferAt` therefore carries the LINES on which the
 * source itself pairs the two names, so the difference between "flagged in
 * this module's own card" and "flagged only three chapters away" is readable
 * rather than collapsed into one boolean.
 *
 * ── ONE IDENTIFIER, THREE CARDS, THREE OPTION LISTS, THREE RECOMMENDATIONS
 *
 * §21.14 (L38269) recommends its option (a); §4.10.5 (L29892) recommends its
 * option (a) at V1 and its option (c) thereafter; the decision card (L113015)
 * recommends its Option C with Option A's wording as an interim build target.
 *
 * The three option lists are not the same list, and the quotations below sit
 * beside their own locators rather than in one sentence naming two — the
 * fidelity gate pairs a quotation with the nearest citation, and an earlier
 * wording put "replace the set entirely with an outcome-flavoured set" next to
 * the card's line when the words are §21.14's.
 *
 * L38269 — "replace the set entirely with an outcome-flavoured set".
 * L113014 — "the client supplies the final five".
 *
 * So the three recommendations cannot be compared cell for cell, let alone
 * merged. All three are carried in
 * `CC11_DEC_REPORT_CARDS` with their own lines and none is adopted.
 */

export interface Cc11DataSet {
  /** 1-based, the source's own numbering in both Parts. */
  readonly ordinal: number
  /** Verbatim from §6.12.1's numbered list. */
  readonly commandCenterName: string
  /** That item's own line. */
  readonly commandCenterLine: number
  /** Verbatim from §4.10.5's table, `Standard report data set` column. */
  readonly hubName: string
  /** That row's own line. */
  readonly hubLine: number
  /** Verbatim from §4.10.5's `Hub source` column — where the numbers come from. */
  readonly hubSource: string
  /**
   * `false` on all five. L38267 puts the exact list in the client's hands;
   * no line in the source confirms any one of them.
   */
  readonly identityConfirmed: boolean
  /**
   * The lines on which the SOURCE ITSELF puts this set's two names side by
   * side. Empty where both Parts write the same name. Non-empty is the
   * source's own record of the divergence, and WHICH lines carry it is the
   * finding: set 4's includes this module's own card, set 5's does not.
   */
  readonly namesDifferAt: readonly number[]
}

export const CC11_DATA_SETS = [
  {
    ordinal: 1,
    commandCenterName: 'Worker utilisation by Area',
    commandCenterLine: 38261,
    hubName: 'Worker utilisation by Area',
    hubLine: 29884,
    hubSource: 'MOD-DOH-07 assignment records and MOD-DOH-02 Areas',
    identityConfirmed: false,
    namesDifferAt: [],
  },
  {
    ordinal: 2,
    commandCenterName: 'Run completion rate by Job',
    commandCenterLine: 38262,
    hubName: 'Run completion rate by Job',
    hubLine: 29885,
    hubSource: 'MOD-DOH-06 run closing states and MOD-DOH-05 Jobs',
    identityConfirmed: false,
    namesDifferAt: [],
  },
  {
    ordinal: 3,
    commandCenterName: 'Workflow-version usage',
    commandCenterLine: 38263,
    hubName: 'Workflow-version usage',
    hubLine: 29886,
    hubSource: 'MOD-DOH-06 package pins and MOD-DOH-05 version bindings',
    identityConfirmed: false,
    namesDifferAt: [],
  },
  {
    ordinal: 4,
    commandCenterName: 'Override frequency by role',
    commandCenterLine: 38264,
    hubName: 'Clearance (qualification-override) frequency by role',
    hubLine: 29887,
    hubSource: 'MOD-DOH-04 clearance records and MOD-DOH-09 roles',
    identityConfirmed: false,
    namesDifferAt: [38267, 29892, 113012],
  },
  {
    ordinal: 5,
    commandCenterName:
      "Allocation consumption trend — the tenant's metered usage, in Worker-Shift units, against its tier allocation",
    commandCenterLine: 38265,
    hubName: 'Tier-allocation consumption trend',
    hubLine: 29888,
    hubSource: 'MOD-DOH-01 Worker-Shift meter and ladder history',
    identityConfirmed: false,
    namesDifferAt: [113012],
  },
] as const satisfies readonly Cc11DataSet[]

/** Five. Computed, never typed — the count is the one thing L38267 settles. */
export const CC11_DATA_SET_COUNT: number = CC11_DATA_SETS.length

/** Zero. Computed from the flag, so a set silently confirmed here changes the sentence. */
export const CC11_CONFIRMED_IDENTITIES: number = CC11_DATA_SETS.filter(
  (s) => s.identityConfirmed,
).length

/**
 * WHAT L38267 SETTLES AND WHAT IT LEAVES OPEN, kept as two fields so a
 * reader cannot take one for the other. The settled half is why no sixth set
 * exists on this screen; the open half is why no set is presented as final.
 */
export const CC11_OPEN_IDENTITY = {
  proposedHeadingLine: 38259,
  openItemLine: 38267,
  settled: 'the number, five, and the home, this surface',
  open: "the exact list is the client's to confirm or adjust",
  swapNotGrow:
    'the move is to swap items within the single list of five, not to grow the list',
  /** The source's own examples of a permitted swap. Illustrations, not sets. */
  swapExamples: [
    'deviation trends by severity',
    'coaching effectiveness',
    'time-to-contain',
  ],
  thirdSpellingOfSetFour: 'clearance or override frequency by role',
  thirdSpellingLine: 54388,
} as const

/**
 * THE ONE LINE THAT SAYS BOTH SETS DIVERGE, IN PROSE RATHER THAN BY NAMING
 * THEM. `namesDifferAt` carries only lines that write both of a set's names,
 * and L113013 writes neither — it states the shape of the gap: *"The two
 * sections name the same five sets with two different wordings for sets 4 and
 * 5, and both sections declare the identity open."* A gate asserting both
 * names on every recorded line went red on it, correctly, which is why it is
 * carried here instead of in the list.
 */
export const CC11_BOTH_SETS_DIVERGE = {
  line: 113013,
  statement:
    'The two sections name the same five sets with two different wordings for sets 4 and 5, and both sections declare the identity open.',
} as const

/**
 * The sentence the screen renders above the list, built from the two computed
 * counts so it cannot claim four are settled while five are open.
 */
export const CC11_IDENTITY_GAP_STATEMENT: string =
  `The source names ${CC11_DATA_SET_COUNT} standard data sets and confirms ` +
  `${CC11_CONFIRMED_IDENTITIES} of them. L38259 calls the list "The proposed identities"; L38267 ` +
  `settles ${CC11_OPEN_IDENTITY.settled} and leaves that ${CC11_OPEN_IDENTITY.open}. The names ` +
  `below are the source's proposals, rendered as proposals. None is presented as final, none is ` +
  `replaced, and no sixth is drawn: ${CC11_OPEN_IDENTITY.swapNotGrow}.`

/* ==================================================================== *
 * `DEC-REPORT-001`, DISCLOSED LOCALLY IN THE CANON'S OWN SHAPE.
 *
 * `src/disclosure/decisions.ts` carries no record for this identifier — it is
 * not a member of that file's `DecisionId` union. That file is another task's
 * path and is read here, never
 * written. The `Stu14LocalDisclosure` idiom applies and the covering suite
 * asserts the identifier is ABSENT from the canon, so a later lift turns the
 * suite red and forces the switch rather than leaving two spellings alive.
 *
 * THE REGISTER ROW IS POINTED AT, NOT RE-RECORDED. Chapter 21's own register
 * carries `DEC-REPORT-001` at L38946 as `Pre-existing`, in 21.14, owned by
 * the client product owner, and wave 1's
 * `src/surfaces/cc/decisions/register.ts` already transcribes that row.
 * `CC11_REGISTER_ROW` resolves it from there so this file cannot disagree
 * with it.
 *
 * ONE IDENTIFIER, TWO OPEN QUESTIONS. The readings below are set 4's two
 * names, because those are the two the source preserves. The open identity of
 * the whole list is NOT a second pair of readings — it is an unanswered
 * question with no competing answers — and it is carried in
 * `CC11_OPEN_IDENTITY` above rather than forced into a reading slot.
 * ==================================================================== */

export const CC11_REGISTER_ROW = (() => {
  const row = CC_DECISION_REGISTER.find((r) => r.id === 'DEC-REPORT-001')
  if (row === undefined) {
    throw new Error(
      'DEC-REPORT-001 is a row of chapter 21’s own register and MOD-CC-11 is the section it ' +
        'appears in. src/surfaces/cc/decisions/register.ts no longer carries it.',
    )
  }
  return row
})()

export const DEC_REPORT_001: CcLocalDisclosure = {
  decisionRef: 'DEC-REPORT-001',
  question:
    'Which five data sets are the five, and is set 4 "Clearance (qualification-override) frequency by role" or "Override frequency by role"?',
  position: {
    kind: 'open',
    readings: [
      {
        text:
          'Reading A — "Clearance (qualification-override) frequency by role". It scopes the set ' +
          'to qualification clearances specifically, which matches the platform’s ' +
          'qualification-governance vocabulary and is directly countable from qualification ' +
          'records. It is the name the Delivery Operations Hub Part writes in its own table of ' +
          'the five, against MOD-DOH-04 clearance records and MOD-DOH-09 roles.',
        locator: 'DEC-REPORT-001 · L38269 · §4.10.5 table row L29887 · contradiction L29892',
      },
      {
        text:
          'Reading B — "Override frequency by role". It is broader and could be read to include ' +
          'any governed override, which on this platform would be an ambiguous population ' +
          'because the only overrides that exist are qualification clearances and gate-item ' +
          'adjustments, and the latter are not overrides in the same sense. It is the name this ' +
          'Part writes in its own numbered list.',
        locator: 'DEC-REPORT-001 · L38269 · §6.12.1 list item L38264 · contradiction L38267',
      },
    ],
  },
  canonNote:
    'The canon carries no record for DEC-REPORT-001. Chapter 21’s register does, at L38946, and ' +
    'that row is pointed at rather than re-recorded. ONE IDENTIFIER CARRIES TWO OPEN ITEMS and ' +
    'they are not the same shape: the identity of all five sets is owed by the client and has no ' +
    'competing answers, while set 4’s name has exactly two. What is at stake on the second is ' +
    'the set’s population and therefore every number in it. THREE CARDS STATE THIS DECISION — ' +
    'L38269, L29892 and the register card at L113009-L113026 — and no two of them offer the same ' +
    'options, so their three recommendations cannot be compared, merged, or read as one. All ' +
    'three are carried in CC11_DEC_REPORT_CARDS and none is adopted; a recommendation is not an ' +
    'adoption and the open arm of this position has no slot for one. §21.14’s own closing ' +
    'sentence is the standard this file is built to: "this blueprint implements neither name as ' +
    'final and marks the set’s identity as pending".',
  heldBy: {
    path: 'app/super-admin/tenant-metrics-and-aggregates/fixtures.ts',
    locatorLine: 45138,
  },
}

/**
 * THREE CARDS STATE THIS ONE DECISION AND NO TWO OF THEM OFFER THE SAME
 * OPTIONS, so no two of their recommendations can be compared. They are
 * carried side by side, each with its own line, and none is adopted — the
 * options are held BESIDE the readings rather than inside them, because a
 * reading with an option list attached is a reading with a recommendation
 * attached one edit later.
 */
export interface Cc11DecisionCard {
  /** Which section states it. */
  readonly section: string
  /** The line carrying the options and the recommendation. */
  readonly line: number
  readonly options: readonly string[]
  /** Verbatim in substance, and labelled a recommendation because that is what it is. */
  readonly recommendation: string
}

export const CC11_DEC_REPORT_CARDS = [
  {
    section: '§21.14 — this module’s own card',
    line: 38269,
    options: [
      '(a) adopt reading A and rename consistently across both Parts',
      '(b) adopt reading B and define its population explicitly, enumerating what counts as an override',
      '(c) replace the set entirely with an outcome-flavoured set, which the source explicitly permits provided the list stays at five',
    ],
    recommendation:
      'option (a), because it is the narrower, countable definition and the naming divergence is most likely an editing artefact [Recommendation — R&D].',
  },
  {
    section: '§4.10.5 — the Delivery Operations Hub Part',
    line: 29892,
    options: [
      '(a) adopt the §4.10.5 name, "Clearance (qualification-override) frequency by role", which names the platform concept and glosses the colloquial term',
      '(b) adopt the §6.12.1 name, "Override frequency by role", which is shorter but reintroduces retired terminology',
      '(c) adopt "Clearance frequency by role" with the parenthetical dropped once tenants are familiar with the term',
    ],
    recommendation: 'option (a) at V1 and option (c) thereafter.',
  },
  {
    section: 'the decision card in the blueprint’s own register',
    line: 113015,
    options: [
      'Option A — adopt the §4.10.5 wording. It is the owning Part’s wording.',
      'Option B — adopt the §6.12.1 wording. It is the rendering surface’s wording.',
      'Option C — the client supplies the final five. The source’s own stated intent, including the possibility of swapping in outcome-flavoured sets.',
    ],
    recommendation:
      "Option C, with Option A's wording as the interim build target because the Delivery Operations Hub owns the data.",
  },
] as const satisfies readonly Cc11DecisionCard[]

/* ==================================================================== *
 * A SECOND DECISION GOVERNS THIS MODULE AND CHAPTER 21 NEVER NAMES IT.
 *
 * `DEC-RPTBLD-001` — the scope of the Custom Report Builder at V1 — is raised
 * at L2502, in chapter 4's boundary register, and it is the same shape as
 * `DEC-CLEAR-001`: raised in another chapter, absent from chapter 21
 * entirely, and binding on an act this module performs. Eight occurrences
 * source-wide (L2502, L2532, L2536, L2557, L2737, L2955, L3075, L115442), and
 * the blueprint-wide index at L115442 attributes it to "Chapter 4 — Scope,
 * Boundaries, Assumptions, and Non-Goals".
 *
 * IT IS NOT A SECOND SPELLING OF `DEC-REPORT-001`, and L2502 says so in its
 * own words: "This decision compounds with DEC-REPORT-001, since the identity
 * of the five data sets is itself open." One asks WHICH five; the other asks
 * whether the Builder may compose beyond them at all.
 *
 * It is recorded here rather than added to `src/surfaces/cc/decisions/
 * register.ts`, which is another task's file, and the covering suite asserts
 * the identifier is absent from that register — so a later lift is forced
 * rather than duplicated. `CcDecisionId` does not admit it, which is why this
 * record does not use `CcLocalDisclosure`'s shape: a type that cannot name
 * the identifier is the register's own statement that it does not carry it.
 * ==================================================================== */

export interface Cc11DecisionOutsideTheRegister {
  readonly decisionRef: string
  readonly question: string
  /** Where the source raises it. */
  readonly raisedAt: number
  /** Every line in the frozen source that names it. */
  readonly occurrences: readonly number[]
  /** Why it binds here even though chapter 21 never names it. */
  readonly whyItBindsHere: string
  /** The source's own sentence tying it to this module's other decision. */
  readonly compoundsWith: string
}

export const DEC_RPTBLD_001 = {
  decisionRef: 'DEC-RPTBLD-001',
  question:
    'Is the Custom Report Builder a formatting tool over the five standard data sets, or a query surface that composes beyond them?',
  raisedAt: 2502,
  occurrences: [2502, 2532, 2536, 2557, 2737, 2955, 3075, 115442],
  whyItBindsHere:
    'The Builder is this module. L38277 states the boundary from this side — saved formats always ' +
    'draw on the five standard sets, and reporting beyond them is the province of composed ' +
    'reasoning agents built through the Agent Builder — and L2502 records that Part XI carries ' +
    'report building beyond the five sets as out of V1 while §4.1.2 and §6.1.6 place a Custom ' +
    'Report Builder in the Command Center at V1. Row 8 of this module’s matrix (L38296) is the ' +
    'prohibition that keeps the two statements compatible.',
  compoundsWith:
    'L2502: "This decision compounds with DEC-REPORT-001, since the identity of the five data ' +
    'sets is itself open."',
} as const satisfies Cc11DecisionOutsideTheRegister
