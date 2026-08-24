import type { DecisionReading } from '@/disclosure/decisions'
import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'

/**
 * `MOD-CC-10`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND
 * CELL BY CELL.
 *
 * Header L38082, separator L38083, data L38084-L38091. **EIGHT rows, FIVE
 * persona columns, FORTY cells.** The counts were taken by reading the eight
 * lines, not by subtracting the ends of a span: the line after the body is
 * blank and the one after that opens the `**Preconditions.**` paragraph, so
 * the body stops at L38091 and eight is what is there. `cells` is a total `Record` over `Cc10Column`, so a blank
 * cell is untypeable.
 *
 * ── THE COLUMN ORDER IS THIS MATRIX'S OWN, AND IT IS NOT THE FRONTLINE'S ──
 *
 * L38082 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first, Worker
 * last** — the exact inversion of every Frontline matrix, which opens on
 * Worker and closes on Read-only Auditor. A positional transcription against
 * the Frontline habit swaps Tenant Admin and Worker and inverts every cell on
 * those two roles SILENTLY, because both readings are internally coherent:
 * both roles are `Explicitly prohibited` on seven of the eight rows and the
 * swap only shows on row 8, where the Tenant Admin's cell carries a note.
 * `CC10_COLUMNS` is therefore the header line's own five words in the header
 * line's own order, and the covering gate re-parses L38082 at run time rather
 * than trusting this comment.
 *
 * ── AND THE TOKENS ARE NOT BACKTICKED ────────────────────────────────────
 *
 * Every Frontline matrix writes its outcome tokens inside backticks. **This
 * one writes them bare** — L38084 reads `| View the conflict panel |
 * Explicitly prohibited | Read-only | Allowed | Explicitly prohibited |
 * Explicitly prohibited |`. A transcription keyed on a leading backtick finds
 * nothing here at all, and a parser that strips backticks before comparing
 * finds everything; the gate does the latter, so it reads both dialects and
 * cannot be satisfied by the wrong one.
 *
 * ── THE TWO PREFIX TRAPS, WHICH ARE WHY `outcome` IS NOT COMPUTED FROM
 *    `startsWith` ─────────────────────────────────────────────────────────
 *
 * This matrix contains BOTH of the prefix collisions this build has been bitten
 * by, in one table:
 *
 *  - `Allowed` is a prefix of `Allowed with conditions — individually only;
 *    never through Resolve All` (L38088, Quality Manager). A `startsWith`
 *    classifier reads the single most safety-bearing cell in the module as an
 *    unconditional grant — the cell that says a skew-flagged conflict is
 *    resolvable individually and NEVER in bulk.
 *  - `Explicitly prohibited` is a prefix of `Explicitly prohibited — a tenant
 *    setting in the Delivery Operations Hub tenant administration area`
 *    (L38091, Tenant Admin). That one is harmless to classify by prefix and is
 *    the reason the first one looks safe.
 *
 * So a cell is split on its own ` — ` first and the HEAD is compared for
 * EXACT EQUALITY against the four tokens. An exact equality on the head is not
 * a prefix test, and the note is carried verbatim beside it rather than
 * discarded — the note on L38088 is the rule, not decoration.
 *
 * ── THE SECOND, CONFLICTING TREATMENT OF THIS MODULE ─────────────────────
 *
 * §36.6 carries a second treatment of `MOD-CC-10` at **L80485-L80602**, with
 * a NINE-row matrix whose columns run in the opposite order. It is built
 * separately, by a different implementer, and **no cell of it is transcribed
 * here.** The two are deliberately not held by one author: they disagree, the
 * source does not settle the disagreement, and a single reader holding both
 * would reconcile what the source leaves open. This file is the chapter-21
 * reading and says so; it is not the whole of what the source says about this
 * module, and it does not claim to be.
 */

/** The header's own five persona columns, verbatim from L38082, in its order. */
export const CC10_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc10Column = (typeof CC10_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId` — unlike `MOD-FL-A7`, whose sixth column
 * ("Platform roles") is plural and names none — so the map is total and
 * single-valued, and `Extract` proves that at compile time rather than in a
 * comment.
 */
export const CC10_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc10Column, RoleId>

/** The four outcome tokens this matrix's forty cells actually use. */
export const CC10_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Read-only',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc10Token = (typeof CC10_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it. `@/policy/decision`
 * already holds the nine tokens; nothing is redeclared here, only mapped.
 */
export const CC10_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Read-only': 'readOnly',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc10Token, PermissionOutcome>

export interface Cc10Cell {
  /** The cell exactly as the source writes it, backticks and all (there are none). */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC10_TOKENS`. */
  readonly token: Cc10Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc10Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc10Column, Cc10Cell>
}

const cell = (text: string): Cc10Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC10_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-10 matrix cell "${text}" has head "${head}", which is not one of the four tokens ` +
        `L38084-L38091 use. Exact equality on the head, never a prefix: "Allowed" is a prefix of ` +
        `"Allowed with conditions" and a prefix test reads the skew-flagged row as unconditional.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const PROHIBITED = 'Explicitly prohibited'

export const CC10_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L38084',
    capability: 'View the conflict panel',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Read-only'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 2,
    sourceRef: 'L38085',
    capability: 'See both versions, both timestamps and both workers',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Read-only'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 3,
    sourceRef: 'L38086',
    capability: 'Resolve an individual ordinary conflict',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell(PROHIBITED),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 4,
    sourceRef: 'L38087',
    capability: 'Resolve All ordinary conflicts',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell(PROHIBITED),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 5,
    sourceRef: 'L38088',
    capability: 'Resolve a skew-flagged conflict',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell(PROHIBITED),
      'Quality Manager': cell(
        'Allowed with conditions — individually only; never through Resolve All',
      ),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 6,
    sourceRef: 'L38089',
    capability: 'Flag an automatic resolution as wrong',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Allowed'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L38090',
    capability: 'Alter a sync result directly',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell(PROHIBITED),
      'Quality Manager': cell(PROHIBITED),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L38091',
    capability: 'Change the clock-skew threshold',
    cells: {
      'Tenant Admin': cell(
        'Explicitly prohibited — a tenant setting in the Delivery Operations Hub tenant ' +
          'administration area',
      ),
      Supervisor: cell(PROHIBITED),
      'Quality Manager': cell(PROHIBITED),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
] as const satisfies readonly Cc10Row[]

/**
 * The three rows whose capability IS resolution, named by their own ordinals
 * rather than by matching the word "Resolve" — row 6 flags a resolution and is
 * not one of them, and a substring rule would have to except it by hand. This
 * is what `AC-CC-348` (L38227) turns on: "Supervisors can view the panel and
 * cannot reach any resolution endpoint."
 */
export const CC10_RESOLUTION_ROW_ORDINALS = [3, 4, 5] as const satisfies readonly number[]

export function cc10Row(ordinal: number): Cc10Row {
  const found = CC10_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-10 matrix has no row ${ordinal}`)
  return found
}

/** The cell for one capability and one role, through the column the role names. */
export function cc10CellFor(ordinal: number, column: Cc10Column): Cc10Cell {
  return cc10Row(ordinal).cells[column]
}

/**
 * The matrix's own verdict for a role on a row, as a `PermissionOutcome`. It
 * is the MATRIX's answer and deliberately not an access decision: the surface
 * exclusion in `@/surfaces/cc/access` is checked before any of this, and the
 * two agreeing on the Worker and the Read-only Auditor is a fact the gate
 * asserts across the two files rather than a rule stated twice.
 */
export function cc10Outcome(ordinal: number, column: Cc10Column): PermissionOutcome {
  return CC10_TOKEN_OUTCOME[cc10CellFor(ordinal, column).token]
}

/** 8 rows × 5 columns. Computed, so it cannot disagree with the array above. */
export const CC10_CELL_COUNT: number = CC10_MATRIX.length * CC10_COLUMNS.length

/* ==================================================================== *
 * FIX STREAM H, ROUND 3 — `DEC-TACC-001` ON THIS MODULE.
 * ==================================================================== */

/**
 * `DEC-TACC-001` — THE TENANT ADMIN'S PRESENCE ON `MOD-CC-10`, DISCLOSED
 * LOCALLY BECAUSE NOTHING IN THIS BUILD HOLDS THE DECISION.
 *
 * ── WHY THIS RECORD SITS IN THE MATRIX FILE ─────────────────────────────
 * `MOD-CC-03`, `MOD-CC-05`, `MOD-CC-07` and `MOD-CC-12` each carry a local
 * record of this decision in their own `readings.ts`. This module has no such
 * file, and it may not grow one: `tests/coverage/slice-09-gates.test.ts` gate
 * 12 walks every module file for reachability from a route and expects
 * EXACTLY ONE unreached file — `cc-13/readings.ts`, a recorded finding it
 * carries rather than repairs. A new `cc-10/readings.ts` nothing imports
 * would be a second, which is the same defect that gate exists to name. So
 * the record goes where the reader already meets this module's cells.
 *
 * ── WHY IT WAS MISSING ─────────────────────────────────────────────────
 * The reason it read as covered is that all eight of this card's cells refuse
 * the Tenant Admin — a column that says the same thing eight times reads as an
 * answer rather than as one side of a disagreement.
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
 * ── THE REGISTER ROW HERE IS THE ONLY ONE OF THIRTEEN THAT SPLITS BY ACT ─
 * `SCR-CC-10`'s "Roles that can open it" cell does not name a list of roles.
 * It names two roles and the act each holds — the Supervisor for viewing, the
 * Quality Manager for resolution — and it is the only row of the thirteen
 * shaped that way. That matters to this disclosure in one specific way: the
 * cell is not a terse list that might have omitted a third role by brevity.
 * It is a sentence that DISTINGUISHES two kinds of access on this screen, and
 * it still names no Tenant Admin — which is the strongest form the register
 * side of this disagreement takes anywhere in the four modules.
 *
 * ── AND THIS CARD DOES USE THE ROW'S TOKEN — FOR SOMEBODY ELSE ──────────
 * Two of this card's cells read `Read-only`, and both are the Supervisor's:
 * viewing the conflict panel (line 38084) and seeing both versions, both
 * timestamps and both workers (line 38085). Those are exactly the "viewing"
 * the register row separates out. So the status the row gives the Tenant
 * Admin exists here, is spelled out, and is attached to a different persona
 * by two tables at once.
 *
 * ── WHY THE BUILD WITHHOLDS IT ──────────────────────────────────────────
 * The transcription in `src/surfaces/cc/screens.ts` is the register cell, read
 * verbatim. So the matrix row and the screen register disagree, the register
 * decides who opens a route on this surface, and the disagreement was resolved
 * silently in its favour until this record.
 *
 * ── THE INTERIM POSITION IS NOT AN ADOPTION ─────────────────────────────
 * L22072 states it as what the build serves until decided. There is no
 * `adopted` arm on the record below and no field on which one could be
 * written.
 *
 * ── ABSENT FROM BOTH REGISTERS, AND NOT LIFTED INTO EITHER ──────────────
 * `src/disclosure/decisions.ts` carries no canon record for `DEC-TACC-001`
 * and `CcDecisionId` in `src/surfaces/cc/decisions/register.ts` cannot express
 * it. Neither file is edited here; `tests/unit/cc-10.test.ts` asserts the
 * ABSENCE, so a later lift turns this suite red rather than leaving two
 * spellings of one decision alive.
 *
 * The record below is data. It computes nothing and decides nothing.
 */

export const CC10_TACC_DISCLOSURE = {
  decisionRef: 'DEC-TACC-001',
  module: 'MOD-CC-10',
  question:
    'Does the Tenant Admin reach the sync-conflict review panel read-only, as this module’s ' +
    '`MTX-TEN-02c` row grants under `[K1]`, or not at all, as this module’s own eight-row ' +
    'matrix and the thirteen-screen register both say?',
  readings: [
    {
      text:
        'Read-only across the module. The tenant-role-to-module matrix grants it under `[K1]`, ' +
        'whose own words are that report-format authoring places the Tenant Admin on this ' +
        'surface, that the source does not state whether that person sees the monitoring ' +
        'modules, and that until decided read-only monitoring access is served. The token is ' +
        'not foreign to this card: it gives the Supervisor `Read-only` on both of its viewing ' +
        'rows.',
      locator: 'MTX-TEN-02c row for this module · L22067; condition [K1] · L22072',
    },
    {
      text:
        'Not present at all. Every one of this card’s eight capability cells reads `Explicitly ' +
        'prohibited` for the Tenant Admin — the threshold row saying in its own words that it ' +
        'is a tenant setting in the Delivery Operations Hub tenant administration area — and ' +
        'the thirteen-screen register’s row for this module’s screen distinguishes viewing from ' +
        'resolution, assigns each to a named role, and names no Tenant Admin in either.',
      locator: 'MOD-CC-10 §21.13 matrix · L38084-L38091; SCR-CC-10 register row · L48395',
    },
  ],
  /**
   * Every statement of the question found in the source, verbatim, with the
   * line and the column it is a cell of. Held to EXACT equality against that
   * table's own header-keyed cell by `tests/unit/cc-10.test.ts`, so a text
   * rewritten to the value that would erase the divergence reds rather than
   * passing.
   */
  statements: [
    { text: '`Read-only` `[K1]`', line: 22067, column: 'Tenant Admin', headerLine: 22056 },
    { text: 'Explicitly prohibited', line: 38084, column: 'Tenant Admin', headerLine: 38082 },
    {
      text:
        'Explicitly prohibited — a tenant setting in the Delivery Operations Hub tenant ' +
        'administration area',
      line: 38091,
      column: 'Tenant Admin',
      headerLine: 38082,
    },
    { text: 'Read-only', line: 38084, column: 'Supervisor', headerLine: 38082 },
    { text: 'Read-only', line: 38085, column: 'Supervisor', headerLine: 38082 },
    {
      text: 'Supervisor for viewing, Quality Manager for resolution',
      line: 48395,
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
    'A client ruling for the matrix row would open this route to the Tenant Admin with the ' +
    'Supervisor’s two viewing rows as its rendering, and would put a third role on the one ' +
    'register row that assigns an act to each role it names — so it would have to say which ' +
    'act, viewing or resolution, the Tenant Admin holds. The row itself does not: `[K1]` grants ' +
    'read-only monitoring and no operational action, which answers viewing and leaves the ' +
    'register’s own distinction unaddressed.',
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
const _cc10TaccReadingsAreCanonShape: readonly [DecisionReading, DecisionReading] =
  CC10_TACC_DISCLOSURE.readings
void _cc10TaccReadingsAreCanonShape
