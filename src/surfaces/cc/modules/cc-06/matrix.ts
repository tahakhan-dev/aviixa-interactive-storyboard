import type { DecisionReading } from '@/disclosure/decisions'
import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-06`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND
 * CELL BY CELL. Section 21.9, learned-change approvals (Lane B).
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L37292, separator L37293, data L37294-L37301. **EIGHT rows, five
 * persona columns, forty cells.** Eight lines were read, one at a time; the
 * count is not a subtraction. The line after the last data row is blank and
 * the one after that opens `**Preconditions.**` at L37303, so the body stops
 * at L37301. `tests/unit/cc-06.test.ts` re-walks the source from the
 * separator to the first non-table line rather than trusting this sentence or
 * `CC06_MATRIX.length`.
 *
 * THE DISPATCH'S CARD SPAN ENDS ON A BLANK LINE, and it is the FOURTH module
 * card in this slice to do so. Its stated end line is empty and the span
 * stops before the matrix this file transcribes, before the preconditions,
 * the states, the workflow, the storyboard, every functionality and all
 * eleven acceptance criteria. That wrong end line is not spelled anywhere in
 * this build: `tests/coverage/locator-fidelity.test.ts` lexes any L-number in
 * a comment as a citation and refuses one that names a blank line even inside
 * a sentence saying the line is blank. §21.9 opens at L37251 — which is right
 * — and runs to its closing `---` at L37469, with §21.10 opening at L37471.
 * The identity line L37257 is right. Every other locator in that dispatch was
 * opened before anything here was written, and the two that were wrong are
 * recorded in `./lane-b.ts`.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L37292 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first, Worker
 * last** — the exact inversion of every Frontline matrix. A positional
 * transcription against the Frontline habit swaps those two columns and
 * inverts every cell on both roles SILENTLY, and this matrix is unusually
 * good at hiding it: on five of the eight rows the Tenant Admin and the
 * Worker carry the identical bare `Explicitly prohibited`, and the swap shows
 * only on rows 6, 7 and 8, where the Tenant Admin's cell carries a note and
 * the Worker's does not. `CC06_COLUMNS` is the header line's own five words
 * in the header line's own order, and the gate re-parses L37292 at run time
 * rather than trusting this comment.
 *
 * ── THE TOKENS ARE NOT BACKTICKED HERE, AND THEY ARE IN §26.7 ────────────
 *
 * Chapter 21 writes its outcome tokens bare — L37296 reads `| Approve a
 * proposal | Explicitly prohibited | Explicitly prohibited | Allowed | ... |`.
 * §26.7's cross-surface matrix, which touches this module's subject twice at
 * L49593 and L49595, writes the same tokens INSIDE backticks. Neither dialect
 * is normalised away; the gate strips backticks before comparing so it can
 * read both and cannot be satisfied by the wrong one.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions` ───────────────────
 *
 * Row 2's Supervisor cell is `Allowed with conditions — annotation only, no
 * decision` (L37295). A `startsWith` classifier reads it as an unconditional
 * grant and hands the Supervisor the decision this whole module exists to
 * withhold — "Supervisors observe and annotate; record-affecting authority
 * sits with the Quality Manager" (L37271). So a cell is split on its own
 * ` — ` first and the HEAD is compared for EXACT EQUALITY against the four
 * tokens this table uses. The note is carried verbatim beside it rather than
 * discarded: on rows 2, 6, 7 and 8 the note IS the rule, and on row 7 it is
 * what `src/surfaces/cc/decisions/link-outs.ts` resolves the destination from.
 *
 * ── FOUR TOKENS, WHICH IS MORE THAN ANY OTHER MODULE MATRIX ON THIS SURFACE
 *
 * `MOD-CC-04`'s forty cells use three. These forty use four: `Read-only`
 * appears here and does not appear there. That matters for one reason and it
 * is a rendering reason — `readOnly` is neither an absence nor a refusal, and
 * a transcription that folded it into `Explicitly prohibited` would delete
 * the Supervisor's standing on rows 1 and 5 entirely.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * The Lane B application path, the two §26.7 rows and every place another
 * table answers one of these rows differently are in `./lane-b.ts`, with both
 * readings and both locators and no winner.
 */

/** The header's own five persona columns, verbatim from L37292, in its order. */
export const CC06_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc06Column = (typeof CC06_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId`, so the map is total and single-valued and the
 * compiler proves it rather than a comment claiming it.
 */
export const CC06_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc06Column, RoleId>

/**
 * The outcome tokens these forty cells actually use — FOUR, counted off the
 * cells rather than assumed from the surface's vocabulary. There is no
 * `Unavailable` and no `Not applicable` anywhere in this table; §25.4 uses
 * both for the same act, which is the divergence `./lane-b.ts` records.
 */
export const CC06_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Read-only',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc06Token = (typeof CC06_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it.
 * `@/policy/decision` already holds the nine tokens; nothing is redeclared,
 * only mapped.
 */
export const CC06_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Read-only': 'readOnly',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc06Token, PermissionOutcome>

export interface Cc06Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC06_TOKENS`. */
  readonly token: Cc06Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc06Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc06Column, Cc06Cell>
}

const cell = (text: string): Cc06Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC06_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-06 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L37294-L37301 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions" and a prefix test reads row 2 as an unconditional grant ` +
        'and hands the Supervisor the decision this module exists to withhold.',
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const P = 'Explicitly prohibited'
const A = 'Allowed'

/**
 * The three columns that read `Explicitly prohibited` on all eight rows are
 * spelled out per row anyway. A helper filling them from one constant is a
 * check that cannot see a transcription error in any of them, and rows 6, 7
 * and 8 are the rows where one of those three DIFFERS from the other two.
 */
export const CC06_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L37294',
    capability: 'See the Lane B proposal queue',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell('Read-only — observe'),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 2,
    sourceRef: 'L37295',
    capability: 'Annotate a proposal',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell('Allowed with conditions — annotation only, no decision'),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 3,
    sourceRef: 'L37296',
    capability: 'Approve a proposal',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 4,
    sourceRef: 'L37297',
    capability: 'Decline a proposal with a categorised reason',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 5,
    sourceRef: 'L37298',
    capability: 'See the read-only learning view',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell('Read-only'),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 6,
    sourceRef: 'L37299',
    capability: 'Turn learning off',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — no such switch exists'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L37300',
    capability: 'Edit a configured value directly',
    cells: {
      'Tenant Admin': cell(
        'Explicitly prohibited — authoring lives in the Standards and Operations Studio',
      ),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L37301',
    capability: 'Approve structural change such as instruction wording or checklist composition',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — travels to authors as a watch item'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc06Row[]

export function cc06Row(ordinal: number): Cc06Row {
  const found = CC06_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-06 has no matrix row ${ordinal}`)
  return found
}

export function cc06Cell(ordinal: number, column: Cc06Column): Cc06Cell {
  return cc06Row(ordinal).cells[column]
}

/**
 * THE ONE ROW OF THE EIGHT WHOSE PROHIBITION NAMES A DESTINATION.
 *
 * Row 7's Tenant Admin cell reads `Explicitly prohibited — authoring lives in
 * the Standards and Operations Studio`. `src/ui/WriteControl.tsx` draws
 * `explicitlyProhibited` as NOTHING AT ALL, so a faithful transcription
 * through the build's one rendering rule produces an empty cell exactly where
 * the source spells out where the act lives. The cell is already registered
 * as `cc-06-edit-configured-value` in `src/surfaces/cc/decisions/link-outs.ts`
 * — task 5's file, not edited here, and its `line: 37300` was opened against
 * the frozen source and matches character for character.
 *
 * Rows 6 and 8 carry notes too and are NOT link-out cells, which is the
 * distinction worth stating: "no such switch exists" names an absence and
 * "travels to authors as a watch item" names a pipeline, and neither names a
 * place a person may go. Only row 7 does.
 */
export const CC06_ROW_HELD_ELSEWHERE = 7

/** The link-out cell id row 7 is registered under. Never re-spelled locally. */
export const CC06_LINK_OUT_CELL_ID = 'cc-06-edit-configured-value'

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, DERIVED FROM THE SPINE AND NEVER TYPED TWICE.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the directory
 * name, which is what "declared, not built" means when it goes wrong.
 * ==================================================================== */

export const CC06_MODULE = ccModule('MOD-CC-06')

/** The screen this module OWNS. The register row is L48392. */
export const CC06_SCREEN = ccScreen('SCR-CC-07')

/**
 * The screen this module APPEARS ON and does not own. `MOD-CC-07` claims
 * `learning-read-view` on the spine, so the route is task 13's and the
 * boundary is stated in `./lane-b.ts` rather than assumed.
 */
export const CC06_SHARED_SCREEN = ccScreen('SCR-CC-13')

/** The route directory basename under `app/command-center/`. */
export const CC06_SLUG: string = (() => {
  if (CC06_MODULE.slug === null) {
    throw new Error('MOD-CC-06 owns SCR-CC-07 and must declare a slug.')
  }
  return CC06_MODULE.slug
})()

/* ==================================================================== *
 * FIX STREAM H, ROUND 3 — `DEC-TACC-001` ON THIS MODULE.
 * ==================================================================== */

/**
 * `DEC-TACC-001` — THE TENANT ADMIN'S PRESENCE ON `MOD-CC-06`, DISCLOSED
 * LOCALLY BECAUSE NOTHING IN THIS BUILD HOLDS THE DECISION.
 *
 * ── WHY THIS RECORD SITS IN THE MATRIX FILE ─────────────────────────────
 * `MOD-CC-03`, `MOD-CC-05`, `MOD-CC-07` and `MOD-CC-12` each carry a local
 * record of this decision in their own `readings.ts`. This module has no such
 * file, and it may not grow one: `tests/coverage/slice-09-gates.test.ts` gate
 * 12 walks every module file for reachability from a route and expects
 * EXACTLY ONE unreached file — `cc-13/readings.ts`, a recorded finding it
 * carries rather than repairs. A new `cc-06/readings.ts` nothing imports
 * would be a second, which is the same defect that gate exists to name. So
 * the record goes where the reader already meets this module's cells, in the
 * file the route really imports.
 *
 * ── WHY IT WAS MISSING ─────────────────────────────────────────────────
 * The reason it read as covered is the same on all four modules that lacked it:
 * the reason it read as covered is the same on all four modules that did not:
 * every one of this card's eight cells refuses the Tenant Admin, and a column
 * that says the same thing eight times reads as an answer rather than as one
 * side of a disagreement.
 *
 * ── IT IS ONE SIDE OF A DISAGREEMENT ────────────────────────────────────
 * Under the header at line 22056, `MTX-TEN-02c`'s row for this module gives
 * the Tenant Admin `Read-only` under condition `[K1]`, and `[K1]` IS
 * `DEC-TACC-001` — a registered open decision with three options, a
 * recommendation, a decision owner and a stated interim position. Eleven of
 * that matrix's thirteen Tenant Admin cells carry it, this module's among
 * them. Of the twelve Command Center screens that are not the sign-in, this
 * build serves the Tenant Admin three and withholds nine; this module's is
 * one of the nine.
 *
 * ── AND THIS CARD DOES USE THE TOKEN — FOR SOMEBODY ELSE ────────────────
 * Two of this card's cells read `Read-only`, and both are the Supervisor's:
 * observing the Lane B proposal queue (line 37294) and the read-only learning
 * view (line 37298). So the status the row gives the Tenant Admin exists on
 * this module and is spelled out for a different persona — which makes the
 * row's grant a specific claim rather than a vague one, and makes the card's
 * silence about it specific too.
 *
 * ── WHY THE BUILD WITHHOLDS IT, AND WHY THAT IS SOURCE-VERSUS-SOURCE ────
 * The thirteen-screen register's row for `SCR-CC-07` names the roles that can
 * open it, and it names ONE — the Quality Manager. The transcription in
 * `src/surfaces/cc/screens.ts` is that cell, read verbatim. So the matrix row
 * and the screen register disagree, the register decides who opens a route on
 * this surface, and the disagreement was resolved silently in its favour until
 * this record.
 *
 * A NOTE ON THE SECOND EXCLUSION THAT REGISTER ROW MAKES, WHICH IS NOT THIS
 * DECISION AND IS NOT MINTED AS ONE HERE. `SCR-CC-07`'s cell names no
 * Supervisor either, while `MTX-TEN-02c` gives the Supervisor `Read-only`
 * under `[K7]` on the same row (line 22063) and this card gives that persona
 * two `Read-only` cells. That is the same SHAPE as the Tenant Admin's and it
 * is a different SUBJECT — `DEC-TACC-001` is about the Tenant Admin and
 * covers it nowhere. Recorded as an observation with its lines rather than
 * written into the record below, because a decision identifier stretched to a
 * persona it does not name is how one decision becomes two spellings.
 *
 * ── THE INTERIM POSITION IS NOT AN ADOPTION ─────────────────────────────
 * L22072 states it as what the build serves until decided. There is no
 * `adopted` arm on the record below and no field on which one could be
 * written.
 *
 * ── ABSENT FROM BOTH REGISTERS, AND NOT LIFTED INTO EITHER ──────────────
 * `src/disclosure/decisions.ts` carries no canon record for `DEC-TACC-001`
 * and `CcDecisionId` in `src/surfaces/cc/decisions/register.ts` cannot express
 * it. Neither file is edited here; `tests/unit/cc-06.test.ts` asserts the
 * ABSENCE, so a later lift turns this suite red rather than leaving two
 * spellings of one decision alive.
 *
 * The record below is data. It computes nothing and decides nothing.
 */

export const CC06_TACC_DISCLOSURE = {
  decisionRef: 'DEC-TACC-001',
  module: 'MOD-CC-06',
  question:
    'Does the Tenant Admin reach learned-change approvals read-only, as this module’s ' +
    '`MTX-TEN-02c` row grants under `[K1]`, or not at all, as this module’s own eight-row ' +
    'matrix and the thirteen-screen register both say?',
  readings: [
    {
      text:
        'Read-only across the module. The tenant-role-to-module matrix grants it under `[K1]`, ' +
        'whose own words are that report-format authoring places the Tenant Admin on this ' +
        'surface, that the source does not state whether that person sees the monitoring ' +
        'modules, and that until decided read-only monitoring access is served. The token is ' +
        'not foreign to this card: it gives the Supervisor `Read-only` twice.',
      locator: 'MTX-TEN-02c row for this module · L22063; condition [K1] · L22072',
    },
    {
      text:
        'Not present at all. Every one of this card’s eight capability cells reads `Explicitly ' +
        'prohibited` for the Tenant Admin, one of them saying in its own words that authoring ' +
        'lives in the Standards and Operations Studio, and the thirteen-screen register’s row ' +
        'for this module’s screen names the Quality Manager alone.',
      locator: 'MOD-CC-06 §21.9 matrix · L37294-L37301; SCR-CC-07 register row · L48392',
    },
  ],
  /**
   * Every statement of the question found in the source, verbatim, with the
   * line and the column it is a cell of. Held to EXACT equality against that
   * table's own header-keyed cell by `tests/unit/cc-06.test.ts`, so a text
   * rewritten to the value that would erase the divergence reds rather than
   * passing.
   */
  statements: [
    { text: '`Read-only` `[K1]`', line: 22063, column: 'Tenant Admin', headerLine: 22056 },
    { text: 'Explicitly prohibited', line: 37294, column: 'Tenant Admin', headerLine: 37292 },
    {
      text: 'Explicitly prohibited — authoring lives in the Standards and Operations Studio',
      line: 37300,
      column: 'Tenant Admin',
      headerLine: 37292,
    },
    { text: 'Read-only — observe', line: 37294, column: 'Supervisor', headerLine: 37292 },
    {
      text: 'Quality Manager',
      line: 48392,
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
    'A client ruling for the matrix row would open this route to the Tenant Admin. Because the ' +
    'card already spells `Read-only` out for the Supervisor on the proposal queue and the ' +
    'learning view, the ruling would have a rendering to copy — which makes this the one of ' +
    'the four where honouring the row would NOT require inventing what the screen shows. What ' +
    'it would still require is changing eight `Explicitly prohibited` cells, because on this ' +
    'surface a prohibition at base role draws nothing at all.',
  canonNote:
    'Absent from src/disclosure/decisions.ts and absent from CcDecisionId in ' +
    'src/surfaces/cc/decisions/register.ts. Neither file is edited here, and minting a second ' +
    'spelling of a decision the source raises once is the failure this idiom exists to prevent. ' +
    'The gate asserts the absence rather than the presence, so a later lift turns this suite red.',
  /**
   * The same shape on a different persona, recorded as an observation and NOT
   * folded into the decision above. `DEC-TACC-001` names the Tenant Admin and
   * nobody else.
   */
  adjacentUndecidedExclusion: {
    persona: 'Supervisor',
    matrixRowLine: 22063,
    condition: '[K7]',
    conditionLine: 22072,
    cardCellLines: [37294, 37298],
    registerRowLine: 48392,
    note:
      'The screen register names no Supervisor on SCR-CC-07 either, while the matrix row gives ' +
      'that persona `Read-only` under [K7] and this card gives it two `Read-only` cells. No ' +
      'decision identifier in the source covers it, and none is minted here.',
  },
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
const _cc06TaccReadingsAreCanonShape: readonly [DecisionReading, DecisionReading] =
  CC06_TACC_DISCLOSURE.readings
void _cc06TaccReadingsAreCanonShape
