import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-05`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND CELL
 * BY CELL. Section 21.8, the governance gate queue.
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L37076, separator L37077, data L37078-L37085. **EIGHT rows, five
 * persona columns, forty cells.** The count is eight because eight lines were
 * read: the line after the last data row is blank and the one after that
 * carries the `DEC-PLUS-001` sentence at L37087, so the body stops at L37085.
 * The covering suite re-walks the source from the separator to the first
 * non-table line rather than trusting this sentence or `CC05_MATRIX.length`.
 *
 * THE COMMISSIONING DISPATCH GAVE THIS CARD A SPAN THAT ENDS THREE LINES
 * ABOVE THE MATRIX HEADER — ON A BLANK LINE. Its opening line L37027 is right
 * and its identity line L37033 is right, but the end it gave is short of the
 * matrix, the states, the storyboard, the twelve functionalities, the eleven
 * acceptance criteria and the eleven tests. §21.8 runs from L37027 to its
 * closing rule at L37249, with §21.9 opening at L37251. That is the FOURTH
 * module card span in this slice to end on a blank line, and the wrong end
 * line is deliberately not spelled anywhere in this build:
 * `tests/coverage/locator-fidelity.test.ts` refuses a citation of a blank line
 * even inside a sentence that correctly calls it blank, and this module's own
 * suite went red on exactly that in this file's first draft.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L37076 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first, Worker
 * last** — the exact inversion of every Frontline matrix, which opens on
 * Worker. A positional transcription against the Frontline habit swaps those
 * two columns and inverts every cell on both roles SILENTLY, because both
 * readings are internally coherent here: on seven of the eight rows the Tenant
 * Admin and the Worker carry the identical bare `Explicitly prohibited`, and
 * the swap shows only on rows 1, 7 and 8, where the Tenant Admin's cell
 * carries a note and the Worker's does not. `CC05_COLUMNS` is therefore the
 * header line's own five words in the header line's own order, and the gate
 * re-parses L37076 at run time rather than trusting this comment.
 *
 * ── THE TOKENS ARE NOT BACKTICKED HERE, AND THEY ARE IN `MTX-TEN-02c` ────
 *
 * Chapter 21 writes its outcome tokens bare — L37078 reads `| See the gate
 * queue | Explicitly prohibited — not an in-shift actor | ... |`. Chapter 17's
 * `MTX-TEN-02c`, which answers the same question about this module at L22062,
 * writes every token INSIDE backticks and appends a bracketed condition key.
 * Neither dialect is normalised away; `./readings.ts` carries that divergence
 * and the gate strips backticks before comparing so it can read both and
 * cannot be satisfied by the wrong one.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions` ───────────────────
 *
 * No cell in THIS table is `Allowed with conditions`, which is exactly what
 * makes a prefix classifier look safe here. `MTX-TEN-02c` gives this module's
 * Quality Manager cell `Allowed with conditions` `[K9]` (L22062), so a
 * `startsWith` head test reads that foreign cell as a bare `Allowed` and
 * ERASES the divergence `./readings.ts` exists to carry. A cell is therefore
 * split on its own ` — ` first and the HEAD is compared for EXACT EQUALITY,
 * and the note is carried verbatim beside it rather than discarded: on rows 1,
 * 7 and 8 the note is where the source says WHY.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * Every place another table answers one of these rows differently is in
 * `./readings.ts`, with both readings and both locators and no winner. The
 * queue's own behaviour — `FB-CC-QUEUE`, the waiting clock, the timeout
 * defaults — is in `./queue.ts`. A transcription that carried its own
 * adjudication would make the two impossible to gate apart.
 */

/** The header's own five persona columns, verbatim from L37076, in its order. */
export const CC05_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc05Column = (typeof CC05_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId`, so the map is total and single-valued and the
 * compiler proves it rather than a comment claiming it.
 */
export const CC05_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc05Column, RoleId>

/**
 * The outcome tokens these forty cells actually use — THREE, and that is
 * worth stating rather than leaving as an accident of the data. There is no
 * `Allowed with conditions` anywhere in this matrix and no `Unavailable`,
 * which is precisely the pair of divergences `./readings.ts` records against
 * `MTX-TEN-02c` and §25.4.
 */
export const CC05_TOKENS = [
  'Allowed',
  'Read-only',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc05Token = (typeof CC05_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it.
 * `@/policy/decision` already holds the nine tokens; nothing is redeclared,
 * only mapped.
 */
export const CC05_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Read-only': 'readOnly',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc05Token, PermissionOutcome>

export interface Cc05Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC05_TOKENS`. */
  readonly token: Cc05Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc05Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc05Column, Cc05Cell>
}

/**
 * EXPORTED SO THE EXACTNESS CAN BE GATED DIRECTLY, and that is not a
 * convenience. A plant that changed this from `t === head` to
 * `head.startsWith(t)` STAYED GREEN across the whole suite, because no cell in
 * this matrix is `Allowed with conditions` — the defect is latent here and
 * live for the next row anyone adds. A classifier nothing can call from a test
 * is a classifier nothing can prove, so the suite hands it the foreign cell
 * `MTX-TEN-02c` carries and requires it to REFUSE.
 */
export const cc05ClassifyCell = (text: string): Cc05Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC05_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-05 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L37078-L37085 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions", which MTX-TEN-02c gives this module's Quality Manager.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const cell = cc05ClassifyCell

const P = 'Explicitly prohibited'
const A = 'Allowed'

/**
 * The three columns that read a bare `Explicitly prohibited` on all eight rows
 * are spelled out per row anyway. A helper filling them from one constant is a
 * check that cannot see a transcription error in any of them, and rows 1, 7
 * and 8 are the rows where the Tenant Admin DIFFERS from the other two.
 */
export const CC05_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L37078',
    capability: 'See the gate queue',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — not an in-shift actor'),
      Supervisor: cell('Read-only — visibility without decision authority'),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 2,
    sourceRef: 'L37079',
    capability: 'Open a gate item with full context',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell('Read-only'),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 3,
    sourceRef: 'L37080',
    capability: 'Approve an item',
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
    sourceRef: 'L37081',
    capability: 'Adjust within bounds and approve',
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
    sourceRef: 'L37082',
    capability: 'Decline with a categorised reason',
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
    sourceRef: 'L37083',
    capability: 'Add the optional note',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L37084',
    capability: 'Change gate policy, approvers or timeouts',
    cells: {
      'Tenant Admin': cell(
        'Explicitly prohibited — authored in the Standards and Operations Studio',
      ),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L37085',
    capability: 'Approve a composed agent for live use',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — never appears in this queue'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc05Row[]

export function cc05Row(ordinal: number): Cc05Row {
  const found = CC05_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-05 has no matrix row ${ordinal}`)
  return found
}

export function cc05Cell(ordinal: number, column: Cc05Column): Cc05Cell {
  return cc05Row(ordinal).cells[column]
}

/**
 * THE TWO ROWS NOBODY HOLDS, AND THEY ARE NOT THE SAME KIND OF NOTHING.
 *
 * Rows 7 and 8 are the only rows on which all five columns read `Explicitly
 * prohibited`, and each Tenant Admin cell says where the act lives instead:
 * row 7's in the Standards and Operations Studio, row 8's nowhere in this
 * queue at all. Under this build's one rendering rule both draw NOTHING, so
 * the destination in row 7's note would vanish — which is why the rendering
 * names them rather than relying on the matrix cells alone. `AC-CC-248`
 * (L37229) is the criterion on row 8 and L37072 is the prose that states it.
 */
export const CC05_ROWS_NOBODY_HOLDS = [7, 8] as const satisfies readonly number[]

/**
 * The ONE act on this module the source assigns to another surface: gate
 * policy, approvers and timeouts, authored in the Standards and Operations
 * Studio. It is deliberately NOT registered as a cross-surface link-out cell
 * in `src/surfaces/cc/decisions/link-outs.ts`: that register is task 5's and
 * is not edited here, and the destination is a Studio AUTHORING surface rather
 * than a record this surface points at for one cell. The row is disclosed by
 * name and by line instead of being given a link this build cannot resolve.
 */
export const CC05_POLICY_AUTHORED_ELSEWHERE = {
  row: 7,
  sourceRef: 'L37084',
  destination: 'Standards and Operations Studio',
  /** The four-surface division of labour, which is why the row reads as it does. */
  divisionRef: 'L37047',
  divisionText:
    'Authors the policy: which intervention types require a gate, who approves, and the acknowledge, timeout and fallback routing, per severity level',
  whyNoLinkHere:
    'The Command Center holds no gate configuration and no gate history of its own (L37052). It runs the queue; it does not own it. A link-out cell in the shared register points at a RECORD; this points at an authoring surface, and inventing a destination for it would be this build answering a question the source answers only as a division of labour.',
} as const

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, DERIVED FROM THE SPINE AND NEVER TYPED TWICE.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the directory
 * name, which is what "declared, not built" means when it goes wrong.
 * ==================================================================== */

export const CC05_MODULE = ccModule('MOD-CC-05')
export const CC05_SCREEN = ccScreen('SCR-CC-06')

/** The route directory basename under `app/command-center/`. */
export const CC05_SLUG: string = (() => {
  if (CC05_MODULE.slug === null) {
    throw new Error('MOD-CC-05 owns SCR-CC-06 and must declare a slug.')
  }
  return CC05_MODULE.slug
})()
