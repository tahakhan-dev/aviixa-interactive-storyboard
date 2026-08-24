import type { DecisionReading } from '@/disclosure/decisions'
import { CC13_ACTIONS } from '@/surfaces/cc/actions/action-set'
import {
  CC_WRITES_OUTSIDE_THE_TEN,
  OUTSIDE_WRITES_NAMED_BY_THE_SOURCE,
  OUTSIDE_WRITE_COUNT,
  type OutsideWrite,
} from '@/surfaces/cc/actions/outside-writes'
import { ccElementAssignment, type CcElementClassAssignment } from '@/surfaces/cc/live/model'
import type { Cc09Column } from './matrix'

/**
 * WHAT `./matrix.ts` DELIBERATELY DOES NOT CARRY: the places where another
 * table answers one of `MOD-CC-09`'s rows differently, the write this module
 * grants that the closed set of ten does not count, and the one rule on this
 * feed whose standing changes depending on which line states it.
 *
 * Every record here carries BOTH readings and BOTH locators and chooses
 * neither. The reading type is the canon's own `DecisionReading`, imported
 * rather than re-declared: it has exactly two fields, `text` and `locator`,
 * so there is nowhere on a reading to mark it as the winner.
 */

/* ==================================================================== *
 * 1. "RESOLVE AN ESCALATION" IS GRANTED HERE AND IS NOT ONE OF THE TEN.
 *
 * L37866 grants it: the Supervisor `Allowed with conditions — where the
 * underlying act is within the Supervisor's authority`, the Quality Manager
 * `Allowed`. It is not one of the ten operational actions and it is not one
 * of `DEC-CCWRITE-001`'s four named outside-writes.
 *
 * THE REGISTER ALREADY EXISTS AND IS NOT MINTED AGAIN HERE. Wave 0's
 * `src/surfaces/cc/actions/outside-writes.ts` records six writes outside the
 * ten, four of them `DEC-CCWRITE-001`'s own and two found in chapter-21
 * module matrices; this act is one of the two, entered against L37866 read
 * header-keyed off L37860. That file is another task's path and is READ here,
 * never written, and the entry is looked up by its act rather than restated,
 * so a change there changes this.
 *
 * AND SIX IS NOT PRESENTED AS THE SOURCE'S NUMBER. `DEC-CCWRITE-001` names
 * FOUR and its reading A calls them "the four outside acts". Both counts are
 * computed from the register's own `namedByDecCcWrite001` flag, never typed.
 *
 * WHY ACKNOWLEDGEMENT AND RESOLUTION ARE HELD APART.
 *
 * L37844 is the rule, and its own sentence NESTS a second pair of double
 * quotes around each half of the definition. It is therefore paraphrased
 * here and quoted verbatim only in `CC09_ACKNOWLEDGE_RESOLVE_SPLIT` below,
 * where it is a string rather than a comment:
 * `tests/coverage/locator-fidelity.test.ts` reads an escaped inner quote as
 * the end of the span and reported this file quoting words the source does
 * not contain. It went red on exactly that, and `cc-13/rail.ts` records the
 * same trap one module over. The rule is that acknowledging is claiming
 * ownership of having seen the thing and resolving is stating that it is
 * dealt with; both are explicit, timestamped acts on the Delivery Operations
 * Hub-owned record. `FUNC-CC-0903-1-2` (L38001) is the functionality whose
 * title is that rule: keep resolve distinct from acknowledge, each explicit
 * and timestamped. Action 1 of the closed set is the ACKNOWLEDGEMENT half
 * only (L38682, `Acknowledge an alert or escalation`), and §26.7's escalation
 * row is headed `Escalation acknowledgement state` with a Command Center cell
 * reading `Allowed with conditions — acknowledge from feed or notification,
 * Supervisor and above` (L49589) — acknowledgement named, resolution not
 * mentioned at all.
 *
 * A `Resolve`-CONTAINING CHECK IS NOT A CHECK. Action 5 is "Resolve or
 * Resolve All sync conflicts", so any test asking whether the ten mention
 * "Resolve" answers yes and proves nothing. The gate compares the WHOLE
 * capability string for equality against every one of the ten.
 * ==================================================================== */

/**
 * Typed `string`, not left as its own literal, and that is load-bearing.
 * Under the literal type TypeScript proves the comparison below can never be
 * true and reports it as an error — which is a stronger statement than this
 * file wants to make, because a guard whose offence is a type error is not a
 * guard. `link-outs.ts` states the same rule for `sourceRequires`: the wrong
 * answer stays CONSTRUCTIBLE so the check can be seen going red when the ten
 * are planted with an eleventh member.
 */
export const CC09_RESOLVE_ACT: string = 'Resolve an escalation'

/** Wave 0's own entry for this act. Looked up, never restated. */
export const CC09_RESOLVE_OUTSIDE_WRITE: OutsideWrite = (() => {
  const found = CC_WRITES_OUTSIDE_THE_TEN.find((w) => w.act === CC09_RESOLVE_ACT)
  if (found === undefined) {
    throw new Error(
      `"${CC09_RESOLVE_ACT}" is granted at L37866 and is neither one of the ten nor one of ` +
        'DEC-CCWRITE-001’s four. It must be carried in wave 0’s register at ' +
        'src/surfaces/cc/actions/outside-writes.ts. This module does not mint a second one.',
    )
  }
  return found
})()

/**
 * Whether the closed set of ten contains this act, computed by ANCHORED
 * EQUALITY over both wordings the ten carry — the authority table's and the
 * matrix's, which differ on six of the ten rows. `false`, and the constant
 * exists so a gate holds a value rather than re-deriving the comparison.
 */
export const CC09_RESOLVE_IS_ONE_OF_THE_TEN: boolean = CC13_ACTIONS.some((a) =>
  ([a.authorityAction, a.matrixAction] as readonly string[]).includes(CC09_RESOLVE_ACT),
)

export interface Cc09AcknowledgeResolveSplit {
  /** The statement, in the source's own words. */
  readonly statement: string
  readonly sourceRef: string
  /** Which half of the pair that line speaks about. */
  readonly names: 'acknowledgement' | 'resolution' | 'both'
}

/**
 * Every line in the frozen source that holds the two apart, with which half
 * it names. Two of them name acknowledgement ALONE, and that is the finding:
 * the closed set of ten and §26.7 both count the acknowledgement and neither
 * counts the resolution, while §21.12's matrix grants both.
 */
export const CC09_ACKNOWLEDGE_RESOLVE_SPLIT = [
  {
    statement:
      'Acknowledge means "I have seen this and own it"; resolve means "it is dealt with." Both are explicit, timestamped actions on the Delivery Operations Hub-owned record.',
    sourceRef: 'L37844',
    names: 'both',
  },
  {
    statement:
      'FUNC-CC-0903-1-2 Keep resolve distinct from acknowledge, each explicit and timestamped. Purpose: seen is not fixed. Roles allowed: Supervisor within their authority, Quality Manager.',
    sourceRef: 'L38001',
    names: 'both',
  },
  {
    statement:
      'Action 1 of the closed set of ten is Acknowledge an alert or escalation. No action of the ten is the resolution.',
    sourceRef: 'L38682',
    names: 'acknowledgement',
  },
  {
    statement:
      'Escalation acknowledgement state | Delivery Operations Hub record, one state | ... | Allowed with conditions — acknowledge from feed or notification, Supervisor and above |',
    sourceRef: 'L49589',
    names: 'acknowledgement',
  },
  {
    statement:
      'AC-CC-324 — Acknowledge and resolve are separate, explicit, timestamped states.',
    sourceRef: 'L38022',
    names: 'both',
  },
] as const satisfies readonly Cc09AcknowledgeResolveSplit[]

/** The lines that name the acknowledgement and not the resolution. Computed. */
export const CC09_ACKNOWLEDGEMENT_ONLY_REFS: readonly string[] =
  CC09_ACKNOWLEDGE_RESOLVE_SPLIT.filter((s) => s.names === 'acknowledgement').map(
    (s) => s.sourceRef,
  )

/**
 * The sentence rendered above the register extract, built from the register's
 * own two computed counts so it cannot say "four" while the array holds five,
 * and cannot present six as the source's number.
 */
export const CC09_OUTSIDE_WRITE_STATEMENT: string =
  `"${CC09_RESOLVE_ACT}" is granted on this module at L37866 and is not one of the ten. ` +
  `DEC-CCWRITE-001 names ${OUTSIDE_WRITES_NAMED_BY_THE_SOURCE.length} writes outside the closed ` +
  `set and this is not one of them; it is carried in the surface's own register of writes ` +
  `outside the ten, which this module reads rather than restates. That register holds ` +
  `${OUTSIDE_WRITE_COUNT}, which is this build's count and not the source's.`

/* ==================================================================== *
 * 2. A FILTER ON THIS FEED MUST NEVER HIDE AN UNACKNOWLEDGED ESCALATION,
 *    AND THE RULE HAS THREE STANDINGS DEPENDING ON WHICH LINE STATES IT.
 *
 * L34881 is the whole engineering consequence of boundary two, on one line
 * carrying eight sentences. It says session state, filter selections, board
 * layout preferences and the position of a user's scroll are user-interface
 * state and not records; that whether such preferences persist between
 * sessions, and where, is `Not specified in the Statement of Work`; that "a
 * saved filter that hides a Severity 1 tile is a safety defect"; and it
 * recommends persisting only non-suppressive preferences (column order,
 * density, default landing tab), never persisting a filter that can hide an
 * item carrying an unacknowledged escalation or an open gate item, and
 * re-applying a full-visibility state at every session start.
 *
 * ITS OWN CLASSIFICATION IS `Recommendation — R&D`, AND ITS OWN LAST
 * SENTENCE SAYS IT IS NOT A CLIENT DECISION: "Client decision needed: no,
 * unless the client wants filter persistence to survive across sessions,
 * which would make it `Client Decision Required`." So this module builds to
 * the recommendation and discloses that it is a recommendation rather than a
 * source fact.
 *
 * THE SIX-LINE MISS IS RECORDED BECAUSE IT WOULD HAVE SHIPPED. The re-plan
 * gives L34887 for this statement. L34887 is "1. A user performs an
 * interaction on the Command Center that would change something." — step one
 * of the numbered workflow that enforces the three boundaries, six lines
 * below.
 *
 * AND THE SAME RULE IS STATED TWICE MORE IN THIS MODULE, NOT AS A
 * RECOMMENDATION AT ALL. `FUNC-CC-0901-1-2` (L37993) puts it among that
 * functionality's PROHIBITED roles — "and every role from persisting a filter
 * that could hide an unacknowledged escalation" — and `AC-CC-329` (L38027) is
 * an acceptance criterion of this module: "No filter can hide an item
 * carrying an unacknowledged escalation from the actor responsible for it."
 * Then §21.12's own `**Source status.**` line classifies the rule a THIRD
 * way: L38044 reads "Single-use identity-bound email acknowledgement links
 * and the non-suppressive-filter rule: `Recommendation — R&D` and `Derived
 * Clarification` respectively" — so this module's own source-status paragraph
 * calls the filter rule a `Derived Clarification` while L34881 carries it as
 * a `Recommendation — R&D`.
 *
 * THE THREE ARE NOT THE SAME SCOPE, WHICH IS WHY NONE IS DROPPED. L34881 and
 * L37993 are about PERSISTING a filter across sessions. `AC-CC-329` is about
 * ANY filter hiding such an item, persisted or not, and it is the strictest
 * of the three. This module implements the strictest and discloses all three
 * with their standings.
 * ==================================================================== */

export type Cc09FilterStanding =
  | 'Recommendation — R&D'
  | 'Derived Clarification'
  | 'Acceptance criterion'
  | 'Functionality prohibition'

export interface Cc09FilterStatement {
  readonly text: string
  readonly sourceRef: string
  readonly standing: Cc09FilterStanding
  /** Whether the statement is about persistence only, or about any filter. */
  readonly scope: 'persistence' | 'any-filter' | 'classification'
}

export const CC09_FILTER_STATEMENTS = [
  {
    text:
      'Persisting a supervisor’s board filter is a small convenience with a real credibility risk — a saved filter that hides a Severity 1 tile is a safety defect. Recommendation: persist only non-suppressive preferences (column order, density, default landing tab) and never persist a filter that can hide an item carrying an unacknowledged escalation or an open gate item; re-apply a full-visibility state at every session start.',
    sourceRef: 'L34881',
    standing: 'Recommendation — R&D',
    scope: 'persistence',
  },
  {
    text:
      'FUNC-CC-0901-1-2 Filter by Area, severity, type and state. Roles prohibited: as above; and every role from persisting a filter that could hide an unacknowledged escalation.',
    sourceRef: 'L37993',
    standing: 'Functionality prohibition',
    scope: 'persistence',
  },
  {
    text:
      'AC-CC-329 — No filter can hide an item carrying an unacknowledged escalation from the actor responsible for it.',
    sourceRef: 'L38027',
    standing: 'Acceptance criterion',
    scope: 'any-filter',
  },
  {
    text:
      'Single-use identity-bound email acknowledgement links and the non-suppressive-filter rule: Recommendation — R&D and Derived Clarification respectively.',
    sourceRef: 'L38044',
    standing: 'Derived Clarification',
    scope: 'classification',
  },
] as const satisfies readonly Cc09FilterStatement[]

/**
 * The preference classes L34881's recommendation names as SAFE to persist,
 * in its own words and its own order. Closed: a fifth would be this build
 * deciding that something else is non-suppressive, which is precisely the
 * judgement the recommendation says a rule must make.
 */
export const CC09_NON_SUPPRESSIVE_PREFERENCES = [
  'column order',
  'density',
  'default landing tab',
] as const satisfies readonly string[]

/**
 * What this module builds, and the fact that it is a recommendation rather
 * than a source fact is part of the record rather than a footnote to it.
 *
 * `persistsAnyFilter` is `false` and is a VALUE rather than a sentence,
 * because the one thing a client needs to be able to check is that this feed
 * cannot carry a saved filter into a new session at all.
 */
export const CC09_FILTER_RULE = {
  built:
    'Filter selections are session-scoped and are not persisted. Every session starts at full visibility, and the filter controls state that they do. The three non-suppressive preferences the recommendation permits are named and none is implemented, because this storyboard has no preference store and inventing one would be a persistence claim.',
  persistsAnyFilter: false,
  reAppliesFullVisibilityAtSessionStart: true,
  standing: 'Recommendation — R&D',
  standingRef: 'L34881',
  isClientDecisionRequired: false,
  isClientDecisionRequiredNote:
    'L34881 says so of itself: "Client decision needed: no, unless the client wants filter persistence to survive across sessions, which would make it Client Decision Required." Persistence is not built, so the condition that would raise it does not arise.',
  strictestStatement: 'AC-CC-329',
  strictestStatementRef: 'L38027',
  whyTheStrictest:
    'AC-CC-329 governs ANY filter hiding an item carrying an unacknowledged escalation, not only a persisted one. L34881 and FUNC-CC-0901-1-2 govern persistence. Building to the criterion satisfies all three; building only to the recommendation would leave a live, unsaved filter free to hide the item.',
} as const

/* ==================================================================== *
 * 3. THE TWO ROWS OF THIS MATRIX THAT ANOTHER TABLE ALSO ANSWERS.
 *
 * Rows 4 and 7 join the three action-keyed tables by their capability
 * wording. The other eight rows are this module's own and no other table
 * carries them, which is stated rather than left as an absence.
 *
 * NEITHER JOIN IS POSITIONAL. §21.16's matrix has a `#` column and SEVEN
 * columns in total; §25.4's has six and folds the ordinal into the action
 * name; §21.1.2's has six and no ordinal at all. Every cell below was read
 * against its own header line, and the covering suite re-resolves each column
 * index from its header BY NAME at test time.
 * ==================================================================== */

export interface Cc09Statement {
  readonly line: number
  /** The cell, verbatim. */
  readonly text: string
}

export interface Cc09Divergence {
  readonly id: string
  /** This module's own matrix row. */
  readonly ownRow: number
  readonly capability: string
  readonly column: Cc09Column
  readonly question: string
  /** Exactly two readings, so there is nowhere to mark a winner. */
  readonly readings: readonly [DecisionReading, DecisionReading]
  /** Every statement of this cell across the tables, with its own line. */
  readonly statements: readonly Cc09Statement[]
  /** What the difference does on screen, which is the reason it matters. */
  readonly renderedConsequence: string
}

export const CC09_DIVERGENCES = [
  {
    id: 'acknowledge-tenant-admin',
    ownRow: 4,
    capability: 'Acknowledge an alert or escalation',
    column: 'Tenant Admin',
    question:
      'Is the Tenant Admin explicitly prohibited from acknowledging, or is acknowledgement merely unavailable to that role?',
    readings: [
      {
        text:
          'Explicitly prohibited. This module states it with its reason — "not an in-shift actor" — and §21.1.2 states the identical cell with the identical reason. MOD-CC-13 states the same token bare.',
        locator: 'MOD-CC-09 L37865 · §21.1.2 L35007 · §21.16 L38682',
      },
      {
        text:
          'Unavailable. §25.4’s table of the ten reads Unavailable in the whole Tenant Admin column, this row included.',
        locator: '§25.4 L48444',
      },
    ],
    statements: [
      { line: 37865, text: 'Explicitly prohibited — not an in-shift actor' },
      { line: 35007, text: 'Explicitly prohibited — not an in-shift actor' },
      { line: 38682, text: 'Explicitly prohibited' },
      { line: 48444, text: 'Unavailable' },
    ],
    renderedConsequence:
      'The two tokens render OPPOSITELY. src/ui/WriteControl.tsx draws a BASE_ROLE explicitlyProhibited as nothing at all and unavailable as a disabled control carrying its reason. Four statements, two distinct tokens, and a reader meets either an empty space or a disabled button depending on which table the implementer opened.',
  },
  {
    id: 'acknowledge-auditor-and-worker',
    ownRow: 4,
    capability: 'Acknowledge an alert or escalation',
    column: 'Read-only Auditor',
    question:
      'Is the Read-only Auditor prohibited from acknowledging, or does the question not apply because the Auditor has no Command Center access at all?',
    readings: [
      {
        text:
          'Explicitly prohibited. Both chapter-21 tables and this module’s own matrix carry the bare prohibition in the Auditor and Worker columns.',
        locator: 'MOD-CC-09 L37865 · §21.1.2 L35007 · §21.16 L38682',
      },
      {
        text:
          'Not applicable. §25.4 answers the surface-access question instead of the capability question: "Not applicable — the Auditor has no Command Center access", and for the Worker "Not applicable — the Worker’s surface is the Frontline Worker Application".',
        locator: '§25.4 L48444',
      },
    ],
    statements: [
      { line: 37865, text: 'Explicitly prohibited' },
      { line: 48444, text: 'Not applicable — the Auditor has no Command Center access' },
    ],
    renderedConsequence:
      'evaluateCCAccess already answers §25.4’s version at the door: routeBySurface(SURF-CC) admits Tenant Admin, Supervisor and Quality Manager only, so the Auditor and the Worker never reach a cell of this matrix. The two readings are not in conflict about the outcome; they disagree about which layer states it, and only one of them is a matrix cell.',
  },
  {
    id: 'clearance-supervisor-condition',
    ownRow: 7,
    capability: 'Grant a qualification clearance from a surfaced event',
    column: 'Supervisor',
    question:
      'What condition attaches to the Supervisor’s clearance grant, and does the never-held case belong inside it?',
    readings: [
      {
        text:
          'The condition is the expired qualification and the Quality Manager notification, and the never-held case is a SEPARATE ROW of this module’s matrix, prohibited to the Supervisor outright. §21.16 states the same condition and is silent on never-held.',
        locator: 'MOD-CC-09 L37868 and L37869 · §21.16 L38691',
      },
      {
        text:
          'The condition is one cell carrying both halves: expired qualification only, AND a never-held qualification requires the Quality Manager. §21.1.2 and §25.4 both fold the never-held case into the Supervisor’s condition rather than giving it a row.',
        locator: '§21.1.2 L35015 · §25.4 L48453',
      },
    ],
    statements: [
      {
        line: 37868,
        text: 'Allowed with conditions — expired qualification only, with the Quality Manager notified',
      },
      {
        line: 37869,
        text: 'Explicitly prohibited',
      },
      {
        line: 38691,
        text: 'Allowed with conditions — expired qualification only, Quality Manager notified',
      },
      {
        line: 35015,
        text: 'Allowed with conditions — expired qualification only; never-held requires the Quality Manager',
      },
      {
        line: 48453,
        text: 'Allowed with conditions — against an expired qualification, with the Quality Manager notified; a never-held qualification requires the Quality Manager',
      },
    ],
    renderedConsequence:
      'Five statements of one authority and no two of them are the same string. On this module’s reading a Supervisor meets two controls, one granted with a condition and one refused; on the other reading a Supervisor meets one control whose condition names the refusal. Both refuse the never-held authorisation to the Supervisor, so the OUTCOME agrees and only the decomposition differs — which is the same shape §36.6 and chapter 21 present for MOD-CC-10, and which no task on this build has settled.',
  },
] as const satisfies readonly Cc09Divergence[]

/**
 * A DECOMPOSITION, NOT A CONTRADICTION, AND IT IS LEFT OPEN.
 *
 * Rows 7 and 8 of this matrix split what §21.1.2 and §25.4 fold into one
 * cell's condition. §36.6's `MOD-CC-10` treatment presents the identical
 * shape — "see the panel exists" split from "read an entry" — and slice 8
 * deliberately left it open rather than reconciling it. The same answer is
 * given here, in the same words, so the two cannot drift apart: whether a
 * finer-grained statement of one rule is a contradiction or a decomposition
 * is THE choice, and no task has made it.
 */
export const CC09_DECOMPOSITION = {
  ownRows: [7, 8],
  ownRowRefs: ['L37868', 'L37869'],
  foldedInto: ['L35015', 'L48453'],
  silentOn: ['L38691'],
  outcomesAgree: true,
  finding:
    'MOD-CC-09 gives the never-held qualification its own row and prohibits the Supervisor on it. §21.1.2 and §25.4 give one clearance row and put the never-held refusal inside the Supervisor’s condition. §21.16 gives one row and does not mention never-held at all. All three refuse the Supervisor the never-held authorisation, so no outcome is at stake; the decomposition is. It is recorded and not reconciled, on the same reasoning slice 8 applied to §36.6.',
} as const

/* ==================================================================== *
 * 4. THE TWO PUSHED ELEMENTS, READ OFF §21.3'S ASSIGNMENT TABLE.
 *
 * Both are the live model's rows and are LOOKED UP rather than restated, so a
 * change to that table changes this module. `Deviation opened` (L35884) is
 * shared with MOD-CC-04; `Escalation fired and its routing state` (L35885) is
 * this module's alone and carries the extra obligation `fallback marked`.
 *
 * THE RULE BEHIND THE OBLIGATION IS ABSOLUTE AND THE MODULE RESTATES IT.
 * L35835 — an event that occurred on an offline device at 09:41 and reached
 * the server at 10:22 is pushed within seconds of 10:22 and is displayed with
 * BOTH times, and the platform never implies it knew at 09:41. L37951 states
 * it again from this module's own offline paragraph: "the feed shows origin
 * against receipt so nobody misreads the delay as platform latency."
 * ==================================================================== */

export const CC09_PUSHED_ELEMENTS = [
  ccElementAssignment('Deviation opened'),
  ccElementAssignment('Escalation fired and its routing state'),
] as const satisfies readonly CcElementClassAssignment[]

export const CC09_PUSHED_LATENCY_RULE = {
  rule:
    'Pushed latency is measured from server receipt, never from the event on the floor. Where the two differ both are displayed, and the platform never implies it knew at the origin time.',
  ruleRefs: ['L35835', 'L37951'],
  criterionRef: 'L35909',
} as const

/* ==================================================================== *
 * `DEC-TACC-001` — THE TENANT ADMIN'S PRESENCE ON THIS MODULE, DISCLOSED
 * LOCALLY BECAUSE NOTHING IN THIS BUILD HOLDS THE DECISION.
 *
 * This file's divergence records are about the Supervisor and the Quality
 * Manager. The Tenant Admin column was read as settled because all ten of
 * this card's cells refuse it, and a column that says the same thing ten
 * times reads as an answer rather than as one side of a disagreement.
 *
 * IT IS ONE SIDE OF A DISAGREEMENT. `MTX-TEN-02c`'s row for this module
 * gives the Tenant Admin `Read-only` under condition `[K1]`, and `[K1]` IS
 * `DEC-TACC-001` — a registered open decision with three options, a
 * recommendation, a decision owner and a stated interim position. Eleven of
 * that matrix's thirteen Tenant Admin cells carry it, this module's among
 * them. Of the twelve Command Center screens that are not the sign-in, this
 * build serves the Tenant Admin three and withholds nine; this module's is
 * one of the nine.
 *
 * AND ON THIS MODULE THE ROW ALSO NAMES A TOKEN THE CARD NEVER USES. Not
 * one of the fifty cells of this card reads `Read-only` for any role: this
 * is the alert feed, where reads are `Allowed` and refusals are
 * `Explicitly prohibited`. So the row is not granting a weaker form of what
 * the card grants — it is granting a status this module does not have.
 *
 * WHY THE BUILD WITHHOLDS IT, AND WHY THAT IS SOURCE-VERSUS-SOURCE. The
 * thirteen-screen register's row for `SCR-CC-09` names the roles that can
 * open it, and it names two — the Supervisor and the Quality Manager. The
 * transcription in `src/surfaces/cc/screens.ts` is that cell, read
 * verbatim. So the matrix row and the screen register disagree, the
 * register decides who opens a route on this surface, and the disagreement
 * was resolved silently in its favour until this record.
 *
 * THE INTERIM POSITION IS NOT AN ADOPTION. L22072 states it as what the
 * build serves until decided; there is no `adopted` arm on the record below.
 *
 * ABSENT FROM BOTH REGISTERS AND NOT LIFTED INTO EITHER.
 * `src/disclosure/decisions.ts` carries no canon record for it and
 * `CcDecisionId` in `src/surfaces/cc/decisions/register.ts` cannot express
 * it. Neither file is edited here; `tests/unit/cc-09.test.ts` asserts the
 * ABSENCE, so a later lift turns this suite red rather than leaving two
 * spellings of one decision alive.
 * ==================================================================== */

export const CC09_TACC_DISCLOSURE = {
  decisionRef: 'DEC-TACC-001',
  module: 'MOD-CC-09',
  question:
    'Does the Tenant Admin reach the alert and escalation feed read-only, as this module’s ' +
    '`MTX-TEN-02c` row grants under `[K1]`, or not at all, as this module’s own ten-row matrix ' +
    'and the thirteen-screen register both say?',
  readings: [
    {
      text:
        'Read-only across the module. The tenant-role-to-module matrix grants it under `[K1]`, ' +
        'whose own words are that report-format authoring places the Tenant Admin on this ' +
        'surface, that the source does not state whether that person sees the monitoring ' +
        'modules, and that until decided read-only monitoring access is served.',
      locator: 'MTX-TEN-02c row for this module · L22066; condition [K1] · L22072',
    },
    {
      text:
        'Not present at all. Every one of this card’s ten capability cells reads `Explicitly ' +
        'prohibited` for the Tenant Admin — the acknowledgement row saying in its own words ' +
        'that the persona is not an in-shift actor — and the thirteen-screen register’s row for ' +
        'this module’s screen names the Supervisor and the Quality Manager and names no Tenant ' +
        'Admin.',
      locator: 'MOD-CC-09 §21.12 matrix · L37862-L37871; SCR-CC-09 register row · L48394',
    },
  ],
  statements: [
    { text: '`Read-only` `[K1]`', line: 22066, column: 'Tenant Admin', headerLine: 22056 },
    { text: 'Explicitly prohibited', line: 37862, column: 'Tenant Admin', headerLine: 37860 },
    {
      text: 'Explicitly prohibited — not an in-shift actor',
      line: 37865,
      column: 'Tenant Admin',
      headerLine: 37860,
    },
    {
      text: 'Supervisor, Quality Manager',
      line: 48394,
      column: 'Roles that can open it',
      headerLine: 48384,
    },
  ],
  options: [
    'report builder only',
    'report builder plus read-only monitoring',
    'full read-only Command Center',
  ],
  recommendation: 'report builder plus read-only monitoring',
  workingPosition: 'read-only monitoring access is served and no operational action is granted',
  workingPositionRef: 22072,
  adopted: false,
  cardLine: 23069,
  registerRowLine: 115232,
  derivedFrom:
    'The thirteen-screen register, transcribed into src/surfaces/cc/screens.ts. The route does ' +
    'not open for the Tenant Admin, and every cell of this module’s own matrix agrees.',
  notResolved:
    'Both readings are recorded and neither is adopted. This is source against source — a ' +
    'matrix row against a screen register and a capability matrix — and nothing here rules ' +
    'which of the two states a role’s presence on a surface.',
  wouldChange:
    'A client ruling for the matrix row would open this route to the Tenant Admin, and the feed ' +
    'it opened would be one whose every cell refuses that persona, including the row that says ' +
    'in its own words why. The ruling would therefore have to change the card too. It would ' +
    'also have to say what `Read-only` means here, because no cell of this card uses that ' +
    'token for any role.',
  canonNote:
    'Absent from src/disclosure/decisions.ts and absent from CcDecisionId in ' +
    'src/surfaces/cc/decisions/register.ts. Neither file is edited here, and minting a second ' +
    'spelling of a decision the source raises once is the failure this idiom exists to prevent. ' +
    'The gate asserts the absence rather than the presence, so a later lift turns this suite red.',
} as const

/**
 * THE READINGS ABOVE ARE THE CANON'S OWN READING SHAPE, CHECKED AT COMPILE
 * TIME RATHER THAN CLAIMED IN PROSE. `DecisionReading` has exactly `text` and
 * `locator`, so there is nowhere on a reading to mark it the winner, and the
 * fixed-length pair makes a third reading a type error rather than a review
 * comment. `tests/coverage/slice-08-absence-sweep.test.ts` requires every
 * module that carries readings to IMPORT this type rather than redeclare it,
 * so a lift into the canon is a move and not a rewrite.
 */
const _cc09TaccReadingsAreCanonShape: readonly [DecisionReading, DecisionReading] =
  CC09_TACC_DISCLOSURE.readings
void _cc09TaccReadingsAreCanonShape
