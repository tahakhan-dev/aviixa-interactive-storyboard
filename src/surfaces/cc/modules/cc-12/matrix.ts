import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-12`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND
 * CELL BY CELL. Section 21.15, the shift handoff panel.
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L38481, separator L38482, data L38483-L38490. **EIGHT rows, five
 * persona columns, forty cells.** The count is eight because eight lines were
 * read: the line after the last data row is blank and the one after that
 * opens the preconditions paragraph at L38492, so the body stops at L38490.
 * `tests/unit/cc-12.test.ts` re-walks the source from the separator to the
 * first non-table line rather than trusting this sentence or
 * `CC12_MATRIX.length`, and the walk excludes the separator by POSITION —
 * `|---|---|` splits into non-empty cells like any other row.
 *
 * THE CARD SPAN IN THE COMMISSIONING DISPATCH ENDS ON A BLANK LINE, and its
 * end line is deliberately not spelled anywhere in this build:
 * `tests/coverage/locator-fidelity.test.ts` refuses a citation of a blank
 * line even inside a sentence that correctly calls it blank. The card's
 * opening line L38453 is right and its identity line L38459 is right; the
 * card itself runs to the closing rule at L38643, with §21.16 opening at
 * L38645. The span given stops above the matrix this file transcribes and
 * above the states, the workflow, the storyboard and every acceptance
 * criterion. That is the fourth module card span in this slice's briefs to
 * end on a blank line.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L38481 reads: Capability on this module, Tenant Admin, Supervisor, Quality
 * Manager, Read-only Auditor, Worker. **Tenant Admin first, Worker last** —
 * the exact inversion of every Frontline matrix, which opens on Worker. A
 * positional transcription against the Frontline habit swaps those two
 * columns and inverts every cell on both roles SILENTLY, because both
 * readings are internally coherent: on seven of the eight rows the Tenant
 * Admin and the Worker carry an `Explicitly prohibited` head, and the swap
 * shows only on row 6, where the Tenant Admin's cell is a GRANT and the
 * Worker's is a prohibition. `CC12_COLUMNS` is therefore the header line's
 * own five words in the header line's own order, and the gate re-parses
 * L38481 at run time rather than trusting this comment.
 *
 * ── THE TOKENS ARE NOT BACKTICKED HERE ──────────────────────────────────
 *
 * Chapter 21 writes its outcome tokens bare. §26.7's cross-surface matrix,
 * which touches this module's subject at L49591, and `MTX-TEN-02c` at
 * L22069, both write the same tokens INSIDE backticks. Neither dialect is
 * normalised away here; the gate strips backticks before comparing so it can
 * read both and cannot be satisfied by the wrong one.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions` ───────────────────
 *
 * Five of these forty cells carry `Allowed with conditions` and three carry
 * a bare `Allowed`. A `startsWith` classifier reads all eight as
 * unconditional grants, including row 6's Tenant Admin cell — the single
 * most consequential cell in this module, and the one three other tables
 * contradict. So a cell is split on its own em-dash separator first and the
 * HEAD is compared for EXACT EQUALITY against the three tokens this table
 * uses. The note is carried verbatim beside it rather than discarded.
 *
 * ── TWO CELLS WHOSE NOTE IS NOT ABOUT THE PERSON IN THAT COLUMN ──────────
 *
 * Rows 7 and 8 both put their whole rule in the TENANT ADMIN cell and leave
 * the other four bare, which is the same shape `MOD-CC-04`'s reclassification
 * row carries and the reason `RESOLVED_BY_ROW_NOT_CELL` exists in
 * `src/surfaces/cc/decisions/link-outs.ts`. Row 7's note names a
 * DESTINATION, so the act is held elsewhere and task 5 has already
 * registered that cell. Row 8's note speaks for EVERY role — its own words
 * say no such capability exists for any role — so it is a universal
 * prohibition stated once, in one column, and `AC-CC-383` (L38623) and
 * `FUNC-CC-1203-1-2` (L38611) restate it independently. Reading either note
 * as scoped to the Tenant Admin loses the rule.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * Where another table answers one of these rows differently is `./readings.ts`,
 * with every statement, its locator, and no winner. Deliberately not folded
 * into the cells here: a transcription carrying its own adjudication makes
 * the two impossible to gate apart.
 */

/** The header's own five persona columns, verbatim from L38481, in its order. */
export const CC12_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc12Column = (typeof CC12_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId`, so the map is total and single-valued and the
 * compiler proves it rather than a comment claiming it.
 */
export const CC12_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc12Column, RoleId>

/**
 * The outcome tokens these forty cells actually use — THREE. There is no
 * `Read-only` anywhere in this matrix and no `Unavailable`, which is exactly
 * the divergence `./readings.ts` records against §25.4 and `MTX-TEN-02c`.
 */
export const CC12_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc12Token = (typeof CC12_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it.
 * `@/policy/decision` already holds the nine tokens; nothing is redeclared,
 * only mapped.
 */
export const CC12_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc12Token, PermissionOutcome>

export interface Cc12Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any em-dash separator. Always one of `CC12_TOKENS`. */
  readonly token: Cc12Token
  /** Everything after the first em-dash separator, or `null` where there is none. */
  readonly note: string | null
}

export interface Cc12Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc12Column, Cc12Cell>
}

const cell = (text: string): Cc12Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC12_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-12 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L38483-L38490 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions" and a prefix test reads row 6 as an unconditional grant.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const P = 'Explicitly prohibited'
const A = 'Allowed'
const WITHIN_AREA = 'Allowed with conditions — within Area scope'

/**
 * The two columns that read `Explicitly prohibited` on all eight rows are
 * spelled out per row anyway. A helper filling them from one constant is a
 * check that cannot see a transcription error in either of them.
 */
export const CC12_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L38483',
    capability: 'Read the current brief',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 2,
    sourceRef: 'L38484',
    capability: 'Read the brief history per shift',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(WITHIN_AREA),
      'Quality Manager': cell(WITHIN_AREA),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 3,
    sourceRef: 'L38485',
    capability: 'See emerging-pattern watch items',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 4,
    sourceRef: 'L38486',
    capability: 'Acknowledge the brief',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 5,
    sourceRef: 'L38487',
    capability: 'Annotate a brief item',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 6,
    sourceRef: 'L38488',
    capability: 'See the unacknowledged-brief flag',
    cells: {
      'Tenant Admin': cell('Allowed with conditions — where holding Tenant or Site read scope'),
      Supervisor: cell('Allowed with conditions — within scope'),
      'Quality Manager': cell('Allowed with conditions — within scope'),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L38489',
    capability: "Configure the agent's run time or the grace period",
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — tenant configuration and Studio settings'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L38490',
    capability: 'Block a shift from starting on an unacknowledged brief',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — no such capability exists for any role'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc12Row[]

export function cc12Row(ordinal: number): Cc12Row {
  const found = CC12_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-12 has no matrix row ${ordinal}`)
  return found
}

export function cc12Cell(ordinal: number, column: Cc12Column): Cc12Cell {
  return cc12Row(ordinal).cells[column]
}

/**
 * The ONE row of the eight whose act is performed on another surface, named
 * rather than left for a reader to find. Its Tenant Admin cell is already
 * registered in `src/surfaces/cc/decisions/link-outs.ts` as
 * `cc-12-agent-run-time`, with the two owners its note names and neither
 * chosen; nothing here re-spells it.
 */
export const CC12_ROW_HELD_ELSEWHERE = 7

/**
 * The row whose Tenant Admin note is a rule for EVERY role. Row 8 is not a
 * link-out and must never be registered as one: its note names no
 * destination, because there is no destination — the capability exists
 * nowhere on any surface for anybody.
 */
export const CC12_ROW_UNIVERSAL_PROHIBITION = 8

/**
 * Action 6 of `MOD-CC-13`'s closed ten is exercised on this module (L38793),
 * and this matrix SPLITS it across two rows where every other table folds it
 * into one. Both ordinals are named here so `./readings.ts` can state the
 * decomposition without either file inferring the pair from a word.
 */
export const CC12_ACTION_6_ROWS = [4, 5] as const satisfies readonly number[]

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, DERIVED FROM THE SPINE AND NEVER TYPED TWICE.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the directory
 * name, which is what "declared, not built" means when it goes wrong.
 * ==================================================================== */

export const CC12_MODULE = ccModule('MOD-CC-12')
export const CC12_SCREEN = ccScreen('SCR-CC-12')

/** The route directory basename under `app/command-center/`. */
export const CC12_SLUG: string = (() => {
  if (CC12_MODULE.slug === null) {
    throw new Error('MOD-CC-12 owns SCR-CC-12 and must declare a slug.')
  }
  return CC12_MODULE.slug
})()
