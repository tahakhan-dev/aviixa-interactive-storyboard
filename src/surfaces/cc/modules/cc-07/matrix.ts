import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-07`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND CELL
 * BY CELL. Section 21.10, feedback signal capture.
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L37503, separator L37504, data L37505-L37511. **SEVEN rows, five
 * persona columns, thirty-five cells.** The count is seven because seven
 * lines were walked from the separator: the line after the last data row is
 * blank and the one after that opens `**Preconditions.**` at L37513, so the
 * body stops at L37511. The covering suite re-walks the source from the
 * separator to the first non-table line rather than trusting this sentence or
 * `CC07_MATRIX.length`.
 *
 * THE COMMISSIONING BRIEF'S CARD SPAN ENDS ON A BLANK LINE, and it is the
 * fourth in this slice to do so. It gave the card as ending one line above
 * `**Roles that see and use it, and their permissions.**` (L37501) — which
 * puts the whole of this matrix, the storyboard, the functionalities and every
 * acceptance criterion OUTSIDE the card it claims to bound. The section opens
 * at L37471, its identity line L37477 is right, and it runs to the closing
 * rule at L37632 with §21.11 opening at L37634. The wrong end line is not
 * spelled anywhere in this build: it is blank, and `locator-fidelity` refuses
 * a citation of a blank line even inside a sentence saying the line is blank.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L37503 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first, Worker
 * last** — the exact inversion of every Frontline matrix. A positional
 * transcription against the Frontline habit swaps those two columns and
 * inverts every cell on both roles SILENTLY, because both readings are
 * internally coherent: on six of the seven rows the Tenant Admin and the
 * Worker carry the identical `Explicitly prohibited`, and the swap shows only
 * on row 7, where the Tenant Admin's cell carries a note and the Worker's does
 * not. `CC07_COLUMNS` is therefore the header line's own five words in the
 * header line's own order, and the gate re-parses L37503 at run time rather
 * than trusting this comment.
 *
 * ── THE TOKENS ARE NOT BACKTICKED HERE ───────────────────────────────────
 *
 * Chapter 21 writes its outcome tokens bare — L37505 reads `| Produce a
 * gate-decision signal | Explicitly prohibited | ... |`. A transcription keyed
 * on a leading backtick finds nothing in this table at all. `MTX-TEN-02c`
 * (L22054), which answers the module-level version of the same question at
 * L22064, writes the same tokens INSIDE backticks. Neither dialect is
 * normalised away; the gate strips backticks before comparing so it can read
 * both and cannot be satisfied by the wrong one.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions`, AND THIS TABLE HAS
 *    A SECOND SHAPE OF THE SAME TRAP ────────────────────────────────────────
 *
 * This matrix uses no `Allowed with conditions` at all. What it uses instead
 * is row 6's Quality Manager cell (L37510): `Allowed — through the learning
 * read view` — a BARE `Allowed` head carrying a condition in its note, where
 * §21.7 row 12 spells the same shape as `Allowed with conditions — …`. So the
 * two tables state a qualified grant in two different token vocabularies, and
 * a classifier that normalises either into the other loses the distinction.
 * Each cell is split on its own ` — ` first and the HEAD compared for EXACT
 * EQUALITY against the three tokens this table uses; the note is carried
 * verbatim beside it, because on rows 6 and 7 the note IS the rule.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * Five places where another table answers one of these rows differently are
 * in `./readings.ts`, each with its readings, its locators and no winner.
 * They are deliberately not folded into the cells here: a transcription that
 * carried its own adjudication would make the two impossible to gate apart.
 */

/** The header's own five persona columns, verbatim from L37503, in its order. */
export const CC07_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc07Column = (typeof CC07_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId`, so the map is total and single-valued and the
 * compiler proves it rather than a comment claiming it.
 */
export const CC07_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc07Column, RoleId>

/**
 * The outcome tokens these thirty-five cells actually use — THREE, and the
 * third appears exactly once. Row 6's Supervisor cell (L37510) is the only
 * `Read-only` in the table, and it is the cell that governs this module's own
 * screen: it grants the Supervisor a read of the learning read view, which is
 * `SCR-CC-13`, whose register row (L48398) admits the Quality Manager alone.
 * That divergence is recorded in `./readings.ts` and is not resolved here.
 */
export const CC07_TOKENS = [
  'Allowed',
  'Explicitly prohibited',
  'Read-only',
] as const satisfies readonly string[]

export type Cc07Token = (typeof CC07_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it.
 * `@/policy/decision` already holds the nine tokens; nothing is redeclared,
 * only mapped.
 */
export const CC07_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Explicitly prohibited': 'explicitlyProhibited',
  'Read-only': 'readOnly',
} as const satisfies Record<Cc07Token, PermissionOutcome>

export interface Cc07Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC07_TOKENS`. */
  readonly token: Cc07Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc07Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc07Column, Cc07Cell>
}

const cell = (text: string): Cc07Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC07_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-07 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L37505-L37511 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions", and row 6's Quality Manager cell is a bare "Allowed" ` +
        `carrying its condition in the note instead.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const P = 'Explicitly prohibited'
const A = 'Allowed'

/**
 * The two columns that read `Explicitly prohibited` on all seven rows are
 * spelled out per row anyway. A helper filling them from one constant is a
 * check that cannot see a transcription error in any of them, and row 7 is
 * the row where the Tenant Admin's cell DIFFERS from the Worker's while both
 * still carry the same token.
 */
export const CC07_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L37505',
    capability: 'Produce a gate-decision signal',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell('Explicitly prohibited — no gate decision authority'),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 2,
    sourceRef: 'L37506',
    capability: 'Mark a prior case relevant or not relevant',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 3,
    sourceRef: 'L37507',
    capability: 'Annotate a handoff-brief item',
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
    sourceRef: 'L37508',
    capability: 'Give optional one-tap feedback on an agent output',
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
    sourceRef: 'L37509',
    capability: 'Produce a learned-change decision signal',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 6,
    sourceRef: 'L37510',
    capability: 'See the aggregated effect of feedback',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell('Read-only — through the learning read view'),
      'Quality Manager': cell('Allowed — through the learning read view'),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L37511',
    capability: 'Have feedback required before proceeding',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — no such gating exists for any role'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc07Row[]

export function cc07Row(ordinal: number): Cc07Row {
  const found = CC07_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-07 has no matrix row ${ordinal}`)
  return found
}

export function cc07Cell(ordinal: number, column: Cc07Column): Cc07Cell {
  return cc07Row(ordinal).cells[column]
}

/**
 * THE ROW THAT IS A PROHIBITION ON EVERY OTHER MODULE, not on this one.
 *
 * Row 7 is the only row of the seven where all five cells prohibit, and the
 * act it prohibits is not an act a person performs: L37499 states it as an
 * implementation rule — "no interaction on this surface may be blocked pending
 * feedback, and no feedback control may be modal" — and `FUNC-CC-0703-1-1`
 * (L37604) records its prohibited roles as "every role and every module from
 * gating on feedback". So the row binds the twelve other modules, and a screen
 * that drew it as a control offered to a person would have misread it.
 */
export const CC07_ROW_BINDS_EVERY_MODULE = 7

/**
 * THE ROW WHOSE GRANT IS THIS MODULE'S OWN SCREEN. Row 6 is the only row that
 * names a screen in its cells, and the screen it names is `SCR-CC-13`.
 */
export const CC07_ROW_LEARNING_READ_VIEW = 6

/**
 * The two rows whose act `DEC-CCWRITE-001` (L35350) places outside the closed
 * set of ten. Ordinals, so nothing re-spells the capability text: row 2 is
 * `FUNC-CC-0702-1-1` (L37597) and row 4 is `FUNC-CC-0702-3-1` (L37601). The
 * register itself is wave 0's `src/surfaces/cc/actions/outside-writes.ts` and
 * is read, never re-minted.
 */
export const CC07_OUTSIDE_WRITE_ROWS = [2, 4] as const satisfies readonly number[]

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, DERIVED FROM THE SPINE AND NEVER TYPED TWICE.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the directory
 * name, which is what "declared, not built" means when it goes wrong.
 * ==================================================================== */

export const CC07_MODULE = ccModule('MOD-CC-07')
export const CC07_SCREEN = ccScreen('SCR-CC-13')

/** The route directory basename under `app/command-center/`. */
export const CC07_SLUG: string = (() => {
  if (CC07_MODULE.slug === null) {
    throw new Error('MOD-CC-07 owns SCR-CC-13 and must declare a slug.')
  }
  return CC07_MODULE.slug
})()
