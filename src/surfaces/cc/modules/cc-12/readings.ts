import type { DecisionReading } from '@/disclosure/decisions'

/**
 * WHERE ANOTHER TABLE ANSWERS ONE OF `MOD-CC-12`'S EIGHT ROWS DIFFERENTLY.
 *
 * SIX tables in this source answer a permission question about this module,
 * and the slice's common brief names four of them. The two it does not name
 * were found by opening every line the source keys to `MOD-CC-12`:
 *
 *   §21.15's own matrix, this module's         L38481-L38490
 *   the surface matrix, §21.1.2                L35002-L35023
 *   `MOD-CC-13`'s action matrix, §21.16        L38680-L38691
 *   §25.4's action matrix                      L48442-L48456
 *   §26.7's record-type matrix                 L49574-L49601
 *   `MTX-TEN-02c`, chapter 22                  L22056-L22070
 *
 * `AC-CC-502` requires every cell to carry an explicit status and every cell
 * does; that six tables give different statuses to the same act is tested by
 * no acceptance criterion at all. So this file carries readings, never a
 * verdict.
 *
 * ── THE SHAPE IS WHAT KEEPS IT HONEST ────────────────────────────────────
 *
 * `DecisionReading` is the canon's own type, imported rather than
 * re-declared. It has exactly two fields, `text` and `locator`, so there is
 * nowhere on a reading to mark it the winner. `readings` is a fixed-length
 * pair, so a third reading is a type error rather than a review comment, and
 * `statements` is separate on purpose: SIX tables can make TWO readings, and
 * collapsing statements into readings is how "three different statuses" gets
 * written down for a cell that carries two. That error is on this build's
 * record already — brief error 33 of this slice.
 *
 * `src/surfaces/cc/decisions/disclosure.ts` is the surface's own local
 * disclosure register and is NOT edited or extended here.
 *
 * ── EVERY `statements` TEXT IS A VERBATIM FRAGMENT OF ITS OWN LINE ───────
 *
 * Not a description of one, and not a paraphrase. A plant found the reason:
 * the first draft's statement gate checked only the LINE NUMBERS, so
 * rewriting a statement's text to the value that would erase the divergence
 * left it green. A text that must occur on the line it cites cannot be
 * rewritten to anything the source does not carry there. Anything that is a
 * description rather than a quotation — which row it is, how many rows the
 * table has — is asserted off the source in the gate instead of written into
 * this field.
 */

/** Exactly two readings. A third is a type error. */
export type TwoReadings = readonly [DecisionReading, DecisionReading]

/**
 * ONE STATEMENT OF THE QUESTION, AND WHERE IT IS.
 *
 * `column` and `headerLine` are both present or both absent, and the pair is
 * what makes the statement checkable. A PLANT PROVED THE LOOSER SHAPE COULD
 * NOT FAIL TWICE OVER: a gate that checked only the line let a statement's
 * text be rewritten to anything, and a gate that then checked the text as a
 * SUBSTRING of the line let it be rewritten to `Explicitly prohibited` — which
 * occurs on L35004 in two OTHER columns. So a statement that names a cell is
 * held to EXACT EQUALITY against that table's own header-keyed cell, and only
 * a statement that is prose rather than a cell is checked as a substring.
 */
export interface Cc12Statement {
  /** Verbatim from the source: the cell's whole text, or a fragment of prose. */
  readonly text: string
  readonly line: number
  /** The column of the table this statement is a cell of, or `null` for prose. */
  readonly column: string | null
  /** That table's own header line. `null` exactly when `column` is `null`. */
  readonly headerLine: number | null
}

export interface Cc12Divergence {
  readonly id: string
  /** The act, in this module's own matrix wording. */
  readonly capability: string
  /** This module's own matrix rows, and the column the disagreement is on. */
  readonly ownRows: readonly number[]
  readonly column: string
  /** The question the tables answer differently. Never rhetorical. */
  readonly question: string
  readonly readings: TwoReadings
  /** Every statement of the question found in the source, with its line. */
  readonly statements: readonly Cc12Statement[]
  /** What a client actually sees under each reading. Never a paraphrase. */
  readonly renderedConsequence: string
}

export const CC12_DIVERGENCES = [
  {
    id: 'unacknowledged-flag-tenant-admin',
    capability: 'See the unacknowledged-brief flag',
    ownRows: [6],
    column: 'Tenant Admin',
    question:
      'Does the Tenant Admin hold a scoped grant on this module, or does this surface admit ' +
      'that role to report and banner routes only?',
    readings: [
      {
        text:
          'A scoped grant. This module’s own matrix gives the Tenant Admin `Allowed with ' +
          'conditions` on the unacknowledged-brief flag, conditioned on holding Tenant or Site ' +
          'read scope — the same condition the surface matrix attaches to its own ' +
          'cross-Area aggregate board row. `MTX-TEN-02c` reads the whole module as `Read-only` ' +
          'for that role on the same reasoning, under a named decision.',
        locator: 'MOD-CC-12 §21.15 row 6 · L38488; §21.1.2 · L35006; MTX-TEN-02c · L22069',
      },
      {
        text:
          'No presence on this module at all. The surface matrix admits the Tenant Admin to ' +
          'report and banner routes only, the landing table gives that role the report-formats ' +
          'landing because it is not an in-shift actor, §21.16 restates the exclusion in prose, ' +
          'and the module-to-actor concentration table names the Tenant Admin nowhere in this ' +
          'module’s row.',
        locator: '§21.1.2 · L35004; §21.1.3 · L35078; §21.16 · L38678; §21.1.5 · L35254',
      },
    ],
    statements: [
      {
        text: 'Allowed with conditions — where holding Tenant or Site read scope',
        line: 38488,
        column: 'Tenant Admin',
        headerLine: 38481,
      },
      {
        text: 'Allowed with conditions — report and banner routes only',
        line: 35004,
        column: 'Tenant Admin',
        headerLine: 35002,
      },
      {
        text: 'The Tenant Admin is not an in-shift actor',
        line: 35078,
        column: 'Reason',
        headerLine: 35073,
      },
      {
        text: 'the Tenant Admin is explicitly not an in-shift actor',
        line: 38678,
        column: null,
        headerLine: null,
      },
      { text: 'Read-only [K1]', line: 22069, column: 'Tenant Admin', headerLine: 22056 },
      {
        text: 'Quality Manager, Plant Manager persona for the unacknowledged flag',
        line: 35254,
        column: 'Secondary user',
        headerLine: 35241,
      },
    ],
    renderedConsequence:
      'Under the first reading a Tenant Admin holding Site read scope opens this panel and sees ' +
      'the flag. Under the second the route does not open for that role at all, and the ' +
      'question of what a cell on this matrix means for a person who cannot reach the screen is ' +
      'left standing. The screen register agrees with the second on reachability — L48397 ' +
      'gives the roles that can open SCR-CC-12 as the Supervisor and the Quality Manager, and ' +
      'names no Tenant Admin — while the matrix row still grants. Neither is chosen here.',
  },
  {
    id: 'acknowledge-annotate-tenant-admin',
    capability: 'Acknowledge the brief / Annotate a brief item',
    ownRows: [4, 5],
    column: 'Tenant Admin',
    question:
      'Is the Tenant Admin categorically excluded from acknowledging and annotating the brief, ' +
      'or does the capability simply not confer on that role here?',
    readings: [
      {
        text:
          'Explicitly prohibited. The role never holds this capability in any circumstance, so ' +
          'nothing is drawn where the control would be — a disabled control would invite ' +
          'the belief the right exists somewhere. Four statements agree, across three tables.',
        locator:
          'MOD-CC-12 §21.15 rows 4 and 5 · L38486 and L38487; §21.1.2 · L35016; §21.16 row 6 · L38687',
      },
      {
        text:
          'Unavailable. The capability exists on this screen and does not confer on the Tenant ' +
          'Admin, so the control is present and disabled and carries its own reason. §25.4 uses ' +
          'that token for the whole Tenant Admin column.',
        locator: '§25.4 row 6 · L48449',
      },
    ],
    statements: [
      { text: 'Explicitly prohibited', line: 38486, column: 'Tenant Admin', headerLine: 38481 },
      { text: 'Explicitly prohibited', line: 38487, column: 'Tenant Admin', headerLine: 38481 },
      { text: 'Explicitly prohibited', line: 35016, column: 'Tenant Admin', headerLine: 35002 },
      { text: 'Explicitly prohibited', line: 38687, column: 'Tenant Admin', headerLine: 38680 },
      { text: 'Unavailable', line: 48449, column: 'Tenant Admin', headerLine: 48442 },
    ],
    renderedConsequence:
      'The build’s one rendering rule draws `explicitlyProhibited` at `BASE_ROLE` as ' +
      'nothing at all and `unavailable` as a disabled control carrying its reason, so the two ' +
      'readings render OPPOSITELY — an absent cell against a present one that explains ' +
      'itself. This is the ABSENT-versus-DISABLED conflict this build has carried since slice ' +
      '4. The same §25.4 row diverges on two further columns in the same direction: it reads ' +
      'the Read-only Auditor and the Worker as `Not applicable`, naming the surface each ' +
      'belongs to, where all four other statements read `Explicitly prohibited`.',
  },
  {
    id: 'acknowledge-annotate-decomposition',
    capability: 'Acknowledge and annotate the handoff brief',
    ownRows: [4, 5],
    column: 'the row itself',
    question:
      'Is acknowledging the brief one capability or two? This module splits it across two ' +
      'rows; the three tables that carry it as an operational action fold it into one.',
    readings: [
      {
        text:
          'Two capabilities. §21.15 gives them separate rows with separate capability wordings, ' +
          'and the module’s own functionality tree separates them further still: ' +
          '`FUNC-CC-1203-1-1` is the acknowledgement and `FUNC-CC-1203-2-1` is the annotation, ' +
          'under two different sub-features. The prose at L38473 draws the same distinction ' +
          'between opening and acknowledging that the alert feed draws between delivery and ' +
          'acknowledgement.',
        locator: 'MOD-CC-12 §21.15 · L38486 and L38487; FUNC-CC-1203-1-1 · L38610; FUNC-CC-1203-2-1 · L38614',
      },
      {
        text:
          'One capability. Action 6 of the closed set of ten is a single row in the authority ' +
          'table, a single row in §21.16’s enumeration, a single row in the surface matrix ' +
          'and a single row in §25.4 — four tables, one act, and the same authority on ' +
          'each.',
        locator: '§21.16 · L38670 and L38687; §21.1.2 · L35016; §25.4 · L48449',
      },
    ],
    statements: [
      {
        text: 'Acknowledge the brief',
        line: 38486,
        column: 'Capability on this module',
        headerLine: 38481,
      },
      {
        text: 'Annotate a brief item',
        line: 38487,
        column: 'Capability on this module',
        headerLine: 38481,
      },
      {
        text: 'Acknowledge and annotate the shift handoff brief',
        line: 38670,
        column: 'Action',
        headerLine: 38663,
      },
      {
        text: 'Acknowledge and annotate the handoff brief',
        line: 38687,
        column: 'Action',
        headerLine: 38680,
      },
      {
        text: 'Acknowledge and annotate the handoff brief',
        line: 35016,
        column: 'Capability',
        headerLine: 35002,
      },
      {
        text: '6 Acknowledge and annotate the handoff brief',
        line: 48449,
        column: 'Action',
        headerLine: 48442,
      },
    ],
    renderedConsequence:
      'Every cell agrees on every persona, so no client sees a different permission either ' +
      'way. What changes is the number of controls: two rows are two affordances and one row ' +
      'is one. The slice’s common brief describes exactly this shape on §36.6’s ' +
      'Supervisor split and records that whether a decomposition is a contradiction or a ' +
      'finer-grained statement of the same rule is a choice no task has made. It is not made ' +
      'here either. Note also that the two tables of §21.16 do not agree with each other on ' +
      'the act’s NAME: L38670 writes it with the word shift and L38687 without, which is ' +
      'why wave 0’s action set carries `authorityAction` and `matrixAction` as separate ' +
      'fields and why nothing joins these tables by name.',
  },
] as const satisfies readonly Cc12Divergence[]

/* ==================================================================== *
 * A DECISION IDENTIFIER THE SOURCE ALREADY HAS FOR ROW 6, WHICH NEITHER
 * THIS SLICE'S BRIEFS NOR THIS SURFACE'S DECISION MODEL CARRIES.
 * ==================================================================== */

/**
 * `DEC-TACC-001` — THE TENANT ADMIN'S CLIENT COMMAND CENTER PRESENCE.
 *
 * The commissioning dispatch put row 6 among four module rows that contradict
 * the surface matrix and said to carry both readings and choose neither. Both
 * readings are above. What the dispatch did not say is that **the source
 * raises this exact question under its own identifier**, at L23069, in
 * chapter 17's RBAC section: three options, a recommendation, a decision
 * owner, and a working position. Reading row 6 as an unidentified
 * contradiction loses the thing that already governs it.
 *
 * THIS IS A NINETEENTH IDENTIFIER FOR THIS SURFACE, AND IT IS `foreign` IN
 * `src/surfaces/cc/decisions/register.ts`'s OWN VOCABULARY — chapter 21 never
 * names it, another chapter raises it, and it governs cells on this surface.
 * That register carries eighteen and this is not among them. `CcDecisionId`
 * cannot express it, so nothing here is keyed on that type and that file is
 * not edited: it is another task's path, and the gap is the finding.
 *
 * THE WORKING POSITION IS NOT AN ADOPTION AND IS NOT PROMOTED TO ONE. L22072
 * states it as what the build serves until decided, not as what the source
 * decided. Following the `Stu14LocalDisclosure` idiom, `tests/unit/cc-12.test.ts`
 * asserts this identifier is ABSENT from the canon and from `CcDecisionId`, so
 * the day someone lifts it into either the suite goes red and forces the
 * switch instead of leaving two spellings of one decision alive.
 *
 * AND `DEC-TACC-001` DOES NOT KNOW ABOUT L38488. Its own affected-cells
 * clause names the `MTX-TEN-01` Command Center row and the `MTX-TEN-02c`
 * Tenant Admin column. This module's matrix row is neither, and it is the one
 * place the source grants that role a named, scoped, in-module capability
 * rather than a whole-module read. The decision's impact statement is
 * therefore narrower than its subject.
 */
export const CC12_TENANT_ADMIN_DECISION = {
  decisionRef: 'DEC-TACC-001',
  raisedAt: 23069,
  raisedIn: 'Chapter 17 — RBAC and Permission Matrices, §17.6',
  standingInChapter21: 'foreign',
  question:
    "What is the Tenant Admin's Client Command Center presence beyond report-format authoring?",
  /** The three the source offers, in its own order and its own words. */
  options: [
    'report builder only',
    'report builder plus read-only monitoring',
    'full read-only Command Center',
  ],
  /** Stated in the source, and a recommendation is not an adoption. */
  recommendation: 'report builder plus read-only monitoring',
  /** `MTX-TEN-02c`'s condition [K1], which is what the build serves until decided. */
  workingPosition: 'read-only monitoring access is served and no operational action is granted',
  workingPositionRef: 22072,
  adopted: false,
  /** Verbatim, backticks and all, from the line that raises the decision. */
  affectedCellsAsStated:
    '`MTX-TEN-01` Client Command Center row, `MTX-TEN-02c` Tenant Admin column',
  /**
   * The decision's own count of the cells it affects, and it agrees with
   * `MTX-TEN-02c`: eleven of that matrix's thirteen Tenant Admin cells read
   * `Read-only` under [K1]. The other two are `MOD-CC-11`, which the source
   * grants outright, and `MOD-CC-13`, which it prohibits outright.
   */
  moduleCellsItClaims: 11,
  affectedCellsGap:
    'L38488 is neither of those. It is this module’s own matrix row and it grants the ' +
    'Tenant Admin a scoped in-module capability, which is a different shape from a whole-module ' +
    'read-only. The decision names it nowhere.',
  canonNote:
    'src/disclosure/decisions.ts does not carry this record and is not edited here. ' +
    'src/surfaces/cc/decisions/register.ts carries eighteen identifiers for this surface and ' +
    'this is not among them; its CcDecisionId union cannot express it. Both files are other ' +
    "tasks' paths and the absence is reported rather than repaired.",
} as const

/* ==================================================================== *
 * WHAT THIS PANEL DOES NOT RENDER, AND WHY.
 * ==================================================================== */

/**
 * THE BRIEF'S OWN BODY IS OWED AND IS NOT INVENTED HERE.
 *
 * `SB-CC-23` (L38545) draws the panel at 06:00 with six sections and a
 * figure in every one of them — two open deviations, one lot on hold, four
 * of four devices, one incomplete evidence package. Those are the
 * storyboard's illustration of a shape, not values this build holds, and the
 * shape needs six live content sources none of which exists in this
 * storyboard. Rendering them would be the defect this slice has named three
 * times: an illustrative number rendered as a value.
 *
 * The same abstention as slice 8's on the sync-conflict cap, and it is
 * DECLARED rather than left to look like an oversight, which is the whole
 * difference between `MOD-CC-02`'s absence and `cc-10-s366`'s.
 */
export const CC12_BRIEF_ABSTENTION = {
  whatIsOwed:
    'The six content categories the brief carries, each with its own count, as FUNC-CC-1201-1-2 ' +
    'lists them: open deviations with containment state, lots on hold or suspect, evidence ' +
    'packages, worker-readiness flags, missed-escalation and fallback events, and ' +
    'emerging-pattern watch items.',
  whatIsOwedRef: 38603,
  storyboardRef: 38545,
  rendered: false,
  why:
    'Every figure in SB-CC-23 is an illustration of a shape. The interconnection line at L38579 ' +
    'names where the real ones come from — open deviations and containment state from ' +
    'MOD-CC-04, missed-escalation and fallback events from MOD-CC-09, agent health from ' +
    'MOD-CC-08 — and this storyboard holds none of them for a shift. A count rendered from ' +
    'nothing is the defect this slice guards against, and it is worse here than elsewhere ' +
    'because the whole purpose of this module is that an incoming supervisor believes what it ' +
    'says.',
  whatIsRenderedInstead:
    'The six category names, from the functionality that lists them, with no figure beside any ' +
    'of them and this statement above them.',
} as const

/**
 * The six categories, read off `FUNC-CC-1201-1-2` (L38603) rather than off
 * the storyboard's section headings. The functionality is the normative
 * statement; the storyboard is one drawing of it, and the two are worded
 * differently.
 */
export const CC12_BRIEF_CATEGORIES = [
  'open deviations with containment state',
  'lots on hold or suspect',
  'evidence packages',
  'worker-readiness flags',
  'missed-escalation and fallback events',
  'emerging-pattern watch items',
] as const satisfies readonly string[]
