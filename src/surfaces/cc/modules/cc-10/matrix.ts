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
