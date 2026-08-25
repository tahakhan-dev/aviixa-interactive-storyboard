import type { DecisionReading } from '@/disclosure/decisions'

/**
 * WHERE ANOTHER TABLE ANSWERS ONE OF `MOD-CC-03`'S EIGHT ROWS DIFFERENTLY,
 * WHAT THIS MODULE'S MATRIX IS SILENT ABOUT, AND THE ONE ACCEPTANCE
 * CRITERION ITS OWN CARD FAILS.
 *
 * ── THERE ARE FIVE TABLES, NOT FOUR ──────────────────────────────────────
 *
 * The slice's standing account names four tables that answer the same
 * permission question for this surface — §21.1.2's surface matrix
 * (L35002-L35023), `MOD-CC-13`'s action matrix (L38680-L38691), §25.4's
 * action matrix (L48442-L48456) and §26.7's cross-surface matrix
 * (L49574-L49601). A FIFTH answers it, and it is the only one of the five
 * keyed on the MODULE rather than on a capability, an action or a record
 * type: `MTX-TEN-02c` in chapter 17 — header L22056, separator L22057,
 * thirteen data rows L22058-L22070, this module's at L22060.
 *
 * It matters here more than the other four because it is the only table that
 * answers the question for this module AS A WHOLE, and it answers it
 * differently from all eight of the rows §21.6 carries.
 *
 * ── THE SHAPE IS WHAT KEEPS IT HONEST ────────────────────────────────────
 *
 * `DecisionReading` is the canon's own type, imported rather than
 * re-declared. It has exactly two fields, `text` and `locator`, so there is
 * nowhere on a reading to mark it the winner. `readings` is a fixed-length
 * pair, so a third reading is a type error rather than a review comment.
 */

/** Exactly two readings. A third is a type error. */
export type TwoReadings = readonly [DecisionReading, DecisionReading]

export interface Cc03Divergence {
  readonly id: string
  /** The act, in this module's own matrix wording, or the module itself. */
  readonly capability: string
  /** This module's own matrix rows the disagreement covers. */
  readonly ownRows: readonly number[]
  readonly column: string
  /** The question the tables answer differently. Never rhetorical. */
  readonly question: string
  readonly readings: TwoReadings
  /**
   * Every statement of the question found in the source, with its line.
   * Separate from `readings` on purpose: eight rows can make one reading,
   * and collapsing statements into readings is how a count of statements
   * gets written down as a count of readings.
   */
  /**
   * Each statement as the cited line WRITES it, plus `of` — this build's own
   * word for which row or matrix the cell came from.
   *
   * `of` EXISTS BECAUSE IT USED TO LIVE INSIDE `text` (audit R4-01..R4-07,
   * finding R4-07). The renderer prints `L<line> "<text>"`, so a parenthetical
   * appended to `text` was rendered inside the quotation marks and read as the
   * source's own words: `"Explicitly prohibited (row 1, drill from board to
   * cell view)"` where the cell reads only the token. Fifteen statements
   * across cc-03, cc-04 and cc-05 carried the convention. `text` is now
   * verifiable against its line character for character, and `of` renders
   * outside the quotes.
   */
  readonly statements: readonly {
    readonly text: string
    readonly line: number
    readonly of?: string
  }[]
  /** What a client actually sees under each reading. Never a paraphrase. */
  readonly renderedConsequence: string
  /** The decision identifier that governs it, or `null` where none does. */
  readonly decisionRef: string | null
}

export const CC03_DIVERGENCES = [
  {
    id: 'tenant-admin-absent-or-read-only',
    capability: 'The module as a whole',
    ownRows: [1, 2, 3, 4, 5, 6, 7, 8],
    column: 'Tenant Admin',
    question:
      'Does the Tenant Admin see this module at all — absent on every one of its eight rows, ' +
      'or present and read-only across the module?',
    readings: [
      {
        text:
          'Absent. §21.6 gives the Tenant Admin `Explicitly prohibited` on all eight rows, ' +
          'including the two that are pure navigation, and §21.1.2 grants the Tenant Admin ' +
          '`Allowed with conditions — report and banner routes only` for opening a Command ' +
          'Center route, which a drill route is not.',
        locator: 'MOD-CC-03 §21.6 · L36654-L36661; §21.1.2 · L35004',
      },
      {
        text:
          'Present and read-only. `MTX-TEN-02c` gives the Tenant Admin `Read-only` on this ' +
          "module's row, under condition [K1], whose own words are that report-format " +
          'authoring places the Tenant Admin on this surface, the source does not state ' +
          'whether the Tenant Admin sees the monitoring modules, and "until decided, ' +
          'read-only monitoring access is served and no operational action is granted".',
        locator: 'MTX-TEN-02c · L22060; condition [K1] · L22072',
      },
    ],
    statements: [
      { text: 'Explicitly prohibited', of: 'row 1, drill from board to cell view', line: 36654 },
      { text: 'Explicitly prohibited', of: 'row 7, view history older than the current shift', line: 36660 },
      { text: 'Read-only [K1]', line: 22060 },
    ],
    renderedConsequence:
      '`src/ui/WriteControl.tsx` draws a BASE_ROLE `explicitlyProhibited` as nothing at all ' +
      'and `@/policy/decision` defines `readOnly` as "visible and unchangeable, with the cause ' +
      'named". The two readings therefore decide whether a Tenant Admin opening this route ' +
      'meets the whole drill or meets nothing — not a difference of tone but of whether the ' +
      'screen exists for that person. The matrix below renders WHOLE, for every role, so both ' +
      'readings are legible on it; no cell is drawn twice and neither reading is adopted.',
    decisionRef: 'DEC-TACC-001',
  },
  {
    id: 'supervisor-allowed-or-read-only',
    capability: 'Drill from board to cell view / cell to run / run to step or record detail',
    ownRows: [1, 2, 3, 4],
    column: 'Supervisor',
    question:
      'Is the Supervisor `Allowed` to drill, or `Read-only` on this module — and is that a ' +
      'disagreement at all, on a module whose Objects affected cell is "None. This module ' +
      'reads"?',
    readings: [
      {
        text:
          '`Allowed`, per capability. §21.6 grants the Supervisor `Allowed` on each of the ' +
          'four navigation rows. The act granted is a read; the token granted is not the ' +
          'read-only one.',
        locator: 'MOD-CC-03 §21.6 · L36654-L36657',
      },
      {
        text:
          '`Read-only`, per module. `MTX-TEN-02c` gives the Supervisor `Read-only` under ' +
          'condition [K2], "within held Site and Area scopes". A module-level posture, not a ' +
          'per-capability grant.',
        locator: 'MTX-TEN-02c · L22060; condition [K2] · L22072',
      },
    ],
    statements: [
      { text: 'Allowed', of: 'row 1', line: 36654 },
      { text: 'Allowed', of: 'row 4', line: 36657 },
      { text: 'Read-only [K2]', line: 22060 },
    ],
    renderedConsequence:
      'The two tokens map onto two different members of the nine-token vocabulary — `allowed` ' +
      'and `readOnly` — so a control derived from one is not the control derived from the ' +
      'other. Whether they conflict in SUBSTANCE is a separate question this module does not ' +
      'settle: L36669 says "Objects affected. None. This module reads", under which every ' +
      'grant here is a read and the two tokens describe the same product. Both are recorded ' +
      'because the tokens differ and the substance may not, and that pair is exactly the ' +
      'shape a reconciliation would flatten.',
    decisionRef: null,
  },
] as const satisfies readonly Cc03Divergence[]

/* ==================================================================== *
 * `DEC-TACC-001`, DISCLOSED LOCALLY BECAUSE NOTHING IN THIS BUILD HOLDS IT.
 *
 * It is a real, registered `Client Decision Required` — the chapter-17
 * register row at L115232 files it under "Chapter 17 — RBAC and Permission
 * Matrices" — and its card at L23069 names `MTX-TEN-02c`'s Tenant Admin
 * column among its affected cells, which is this module's row.
 *
 * IT IS IN NEITHER REGISTER THIS BUILD HAS. `src/disclosure/decisions.ts`
 * carries no canon record for it — it is not a member of that file's exported
 * `DecisionId` union. And
 * `src/surfaces/cc/decisions/register.ts` types `CcDecisionId` as an
 * eighteen-member union that does not carry it either. Neither file is
 * edited here. This follows the `Stu14LocalDisclosure` idiom: a local record
 * in the canon's own shape, plus a gate asserting the identifier is ABSENT
 * from both, so the day someone lifts it into either register this suite
 * goes red and forces the switch rather than leaving two spellings alive.
 *
 * THE RECOMMENDATION IS NOT AN ADOPTION. The card recommends "report builder
 * plus read-only monitoring". There is no adopted arm on this record and no
 * field on which one could be written.
 * ==================================================================== */

export interface Cc03LocalDisclosure {
  readonly decisionRef: string
  readonly question: string
  readonly readings: TwoReadings
  /** The card's own options, verbatim, in its own order. Never reordered. */
  readonly options: readonly string[]
  /** The card's own recommendation. Recorded as a recommendation, never adopted. */
  readonly recommendation: string
  readonly adopted: false
  readonly cardLine: number
  readonly registerRowLine: number
  /** Why this is disclosed here rather than through either register. */
  readonly canonNote: string
}

export const CC03_TACC_DISCLOSURE = {
  decisionRef: 'DEC-TACC-001',
  question:
    "Does the Tenant Admin see the Command Center's monitoring modules, of which this is " +
    'one, or reach only the report builder?',
  readings: [
    {
      text:
        'Report builder only. Command Center users are supervisors, quality managers and ' +
        'plant-manager-scoped supervisors, and the Tenant Admin holds none of the ten ' +
        'operational actions — so the report builder is the whole of the presence that ' +
        'report-format authoring buys.',
      locator: 'DEC-TACC-001 card · L23069',
    },
    {
      text:
        'Report builder plus read-only monitoring, or full read-only. Report-format ' +
        'authoring places the Tenant Admin on this surface, and the source does not state ' +
        'whether that person sees the monitoring modules; eleven module cells depend on the ' +
        'answer.',
      locator: 'DEC-TACC-001 card · L23069; MTX-TEN-02c condition [K1] · L22072',
    },
  ],
  options: [
    'report builder only',
    'report builder plus read-only monitoring',
    'full read-only Command Center',
  ],
  recommendation:
    'report builder plus read-only monitoring, because a Tenant Admin configuring escalation ' +
    'and digest settings benefits from seeing their effect, and read-only carries no ' +
    'authority risk',
  adopted: false,
  cardLine: 23069,
  registerRowLine: 115232,
  canonNote:
    'Absent from src/disclosure/decisions.ts and absent from CcDecisionId in ' +
    'src/surfaces/cc/decisions/register.ts. Neither file is this task\'s to edit, and minting ' +
    'a second spelling of a decision the source raises once is the failure this idiom exists ' +
    'to prevent. The gate asserts the absence rather than the presence, so a later lift turns ' +
    'this suite red.',
} as const satisfies Cc03LocalDisclosure

/* ==================================================================== *
 * THE REASSIGNMENT GAP — THE ONE THING THIS MODULE'S OWN MATRIX DOES NOT
 * SAY, AND THREE PLACES THAT SAY IT.
 *
 * Building from the card alone leaves action 8 reachable from nowhere and
 * `AC-CC-400` (L38857) — "Exactly ten operational actions are reachable from
 * this surface; no eleventh endpoint exists" — asserted against nine.
 *
 * NO NINTH ROW IS ADDED. A matrix that grows a row to make an acceptance
 * criterion pass is worse than the gap it hides: the row would be this
 * build's coinage rendered as if §21.6 carried it, and the gap — which is
 * real, and which nothing in the source repairs — would become invisible.
 * The rail is mounted instead, on both routes, and the placement is recorded
 * here with the lines that make it.
 *
 * THE DISPATCH NAMED TWO PASSAGES. THERE ARE THREE, AND THE THIRD IS ON
 * THIS MODULE'S OWN CARD. L36706, its `**Interconnections.**` paragraph:
 * "Supplies the run context that action 8, reassign a run mid-shift,
 * operates on in `MOD-CC-13`." So the card whose matrix omits the row states
 * the placement in that same card's own prose.
 * ==================================================================== */

export const CC03_ACTION_8 = {
  ordinal: 8,
  /** Verbatim from §21.16's own action column, L38689. */
  action: 'Reassign a run mid-shift',
  matrixRef: 'L38689',
  /** True, and it is the finding. Counted off the eight capabilities. */
  absentFromOwnMatrix: true,
  placedHereBy: [
    {
      ref: 'L36706',
      what:
        "This module's own Interconnections paragraph: it supplies the run context that " +
        'action 8, reassign a run mid-shift, operates on in MOD-CC-13.',
    },
    {
      ref: 'L38793',
      what:
        "MOD-CC-13's Interconnections paragraph, which enumerates the seven modules whose " +
        'screens exercise one or more of the ten and ends with MOD-CC-03 for 8.',
    },
    {
      ref: 'L38765',
      what:
        'Storyboard SB-CC-24, action 8, reassigning a run mid-shift. Its first sentence opens ' +
        'the RUN VIEW and selects Reassign, which is this module\'s SCR-CC-04.',
    },
  ],
  criterion: 'AC-CC-400',
  criterionRef: 'L38857',
  whyNoNinthRow:
    'A ninth row would be this build writing a capability into a transcription of §21.6 that ' +
    '§21.6 does not carry, to make AC-CC-400 pass. The capability is real and is placed here ' +
    'by three lines; the silence in the matrix is also real. Both are recorded, and the ' +
    'control itself is drawn by MOD-CC-13\'s own rail, which owns the authority for all ten.',
} as const

/* ==================================================================== *
 * TWO ACCEPTANCE CRITERIA THIS MODULE CANNOT SATISFY, NAMED RATHER THAN
 * CLAIMED. `AC-OFF-702`'s shape, recurring twice on one card.
 * ==================================================================== */

/**
 * `AC-CC-090` (L35710) — "Every functionality in this chapter references at
 * least one `FB-CC-*` pattern." THREE of this module's nine functionalities
 * reference none, and each says so in its own words: L36734 "Fallback: not
 * applicable — a prohibition has no degraded mode", L36735 and L36737
 * "Fallback: not applicable."
 *
 * The criterion fails on this card, in the frozen source, and the source
 * states the reason it fails on the same lines. Nothing is invented to close
 * it: assigning `FB-CC-STALE` to a prohibition would be this build claiming
 * a degraded mode for a rule that has none.
 *
 * A SECOND, SMALLER GAP ON THE SAME SUBJECT. The card's own
 * `**Fallback identifiers.**` line (L36718) declares THREE — `FB-CC-STALE`,
 * `FB-CC-SESS` and `FB-CC-AGENT` — and no functionality on the card names
 * `FB-CC-AGENT` at all. It is declared at module level and referenced at
 * functionality level nowhere, which is the mirror image of the first gap.
 */
export const CC03_AC_090_GAP = {
  criterion: 'AC-CC-090',
  criterionRef: 'L35710',
  criterionText:
    'Every functionality in this chapter references at least one `FB-CC-*` pattern.',
  satisfied: false,
  functionalitiesNamingNoPattern: [
    'FUNC-CC-0302-1-1',
    'FUNC-CC-0302-1-2',
    'FUNC-CC-0302-2-1',
  ],
  declaredAtModuleLevel: ['FB-CC-STALE', 'FB-CC-SESS', 'FB-CC-AGENT'],
  declaredAtModuleLevelRef: 'L36718',
  namedByNoFunctionality: ['FB-CC-AGENT'],
  whyNotRepaired:
    'All three say "Fallback: not applicable" and the first says why — a prohibition has no ' +
    'degraded mode. Assigning a pattern to close the criterion would claim a degraded mode ' +
    'the source denies. The criterion is named and shown failing, which is the deliverable.',
} as const

/**
 * `AC-CC-203` (L36774) — "No worker-keyed route, filter, search or saved
 * view exists anywhere on the surface." THIS MODULE OWNS TWO OF THIRTEEN
 * ROUTES. The criterion is surface-wide and no module can satisfy it alone;
 * this one can only satisfy its own half and say so. L36644 states the rule
 * in the same scope — "there is no route, filter, search or saved view on
 * this surface whose entry point is a worker" — and files it as a
 * `[Derived Clarification]` rather than a `SoW Fact`.
 *
 * The same shape as `AC-OFF-702`: recorded and not enforceable from here.
 * Naming the criterion and what it governs is the deliverable; claiming
 * surface-wide enforcement from a two-route module would be false.
 */
export const CC03_SURFACE_WIDE_CRITERION = {
  criterion: 'AC-CC-203',
  criterionRef: 'L36774',
  scope: 'the whole surface, thirteen screens',
  thisModuleOwns: 2,
  enforcedHere: false,
  whatThisModuleCanSay:
    'Neither of this module\'s two routes is keyed by a worker, neither offers a worker ' +
    'filter, search or saved view, and row 6 of its matrix (L36659) prohibits navigating by ' +
    'worker as an entry point for every one of the five personas — the only row of the eight ' +
    'that is uniform across all five columns other than the flat edit prohibition. What the ' +
    'other eleven routes do is not this module\'s to assert.',
  alsoStatedAt: 36644,
  classifiedAs: 'Derived Clarification',
} as const

/* ==================================================================== *
 * ROW 7 OWES A LINK AND THE SHARED REGISTER CANNOT HOLD IT.
 * ==================================================================== */

/**
 * A THIRD LINK-OUT SHAPE, AND THE MEASURED THIRTEEN DOES NOT COUNT IT.
 *
 * `src/surfaces/cc/decisions/link-outs.ts` registers thirteen cells across
 * twelve rows in two shapes: a prohibitive token whose note names the owning
 * surface (which renders as nothing), and a permissive `Allowed with
 * conditions` whose note places the act elsewhere (which renders as a live
 * control). Row 7's two link-bearing cells are neither. They read `Read-only
 * — by link into the Delivery Operations Hub`: the token is neither
 * prohibitive nor an authority to act, and the note does not merely name the
 * destination, it names the LINK as the mechanism.
 *
 * IT IS UNCONSTRUCTIBLE THERE, NOT MERELY UNREGISTERED. `CcLinkOutToken` is
 * a closed two-member vocabulary and `Read-only` is not one of them, so a
 * `CcLinkOutCell` for this row cannot be written without widening a closed
 * vocabulary in a file this task does not own. `CrossSurfaceLink` takes a
 * `CcLinkOutModel` built from such a cell and has no other entry point, so
 * consuming task 5's component for this row is not available either.
 *
 * WHAT IS RENDERED INSTEAD, and why it is not a second link component: this
 * module draws ONE anchor, to the route registry's own Delivery Operations
 * Hub pathname, guarded by `routesForRole` exactly as `ccLinkOutModel`
 * guards its own — so the pointer is checked rather than asserted and cannot
 * point at a route the viewer's role does not open.
 *
 * The obligation is stated four times and none of them is the matrix cell:
 * `FUNC-CC-0303-1-1` (L36740) — "Show completed work older than the current
 * shift only by link into the Delivery Operations Hub … Online: link
 * rendered"; the alternate path at L36688; the terminal safe state at
 * L36767; and `AC-CC-204` (L36775).
 */
export const CC03_HISTORY_LINK = {
  ownRow: 7,
  rowRef: 'L36660',
  token: 'Read-only',
  registeredInSharedRegister: false,
  whyNot:
    'CcLinkOutToken in src/surfaces/cc/decisions/link-outs.ts is a closed two-member ' +
    'vocabulary — Explicitly prohibited and Allowed with conditions — so a cell carrying ' +
    'Read-only is unconstructible there. Widening it would edit another task\'s file; the ' +
    'shape is reported instead.',
  measuredPopulationMisses:
    'The slice\'s measured figure of 13 link-out cells across 12 distinct rows counts two ' +
    'shapes. This is a third: a permissive-but-non-acting token whose note names the link ' +
    'itself as the mechanism. Two more cells, one more row, and neither is in the register.',
  obligationRefs: ['L36688', 'L36740', 'L36767', 'L36775'],
  criterion: 'AC-CC-204',
  criterionRef: 'L36775',
} as const
