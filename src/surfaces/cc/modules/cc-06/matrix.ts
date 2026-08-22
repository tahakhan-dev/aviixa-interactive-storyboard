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
