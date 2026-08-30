import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-04`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND
 * CELL BY CELL. Section 21.7, the deviation workspace and evidence review.
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L36832, separator L36833, data L36834-L36845. **TWELVE rows, five
 * persona columns, sixty cells** — the widest matrix on this surface. The
 * count is twelve because twelve lines were read, not because a span was
 * subtracted: the line after the last data row is blank and the one after
 * that opens the `**Preconditions.**` paragraph at L36847, so the body stops
 * at L36845. The covering suite re-walks the source from the separator to the
 * first non-table line rather than trusting this sentence or
 * `CC04_MATRIX.length`.
 *
 * The dispatch that commissioned this file also gave the card's span as
 * ending three lines above `**Roles that see and use it, and their
 * permissions.**` (L36830) — **on a blank line**, and short of the matrix
 * this file transcribes. Its opening line L36796 is right and its identity
 * line L36802 is right; the card itself runs to the closing `---` at L37025,
 * with §21.8 opening at L37027, and only the prose preamble ends where the
 * dispatch put the whole card. Every other locator in that dispatch was
 * opened against the frozen source before anything here was written.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L36832 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first, Worker
 * last** — the exact inversion of every Frontline matrix, which opens on
 * Worker. A positional transcription against the Frontline habit swaps those
 * two columns and inverts every cell on both roles SILENTLY, because both
 * readings are internally coherent: on eleven of the twelve rows the Tenant
 * Admin and the Worker carry the identical `Explicitly prohibited`, and the
 * swap shows only on row 12, where the Tenant Admin's cell carries a note and
 * the Worker's does not. `CC04_COLUMNS` is therefore the header line's own
 * five words in the header line's own order, and the gate re-parses L36832 at
 * run time rather than trusting this comment.
 *
 * ── THE TOKENS ARE NOT BACKTICKED HERE, AND THEY ARE IN §36.6 ────────────
 *
 * Chapter 21 writes its outcome tokens bare — L36834 reads `| Open the
 * deviation workspace | Explicitly prohibited | Allowed | Allowed | ... |`.
 * A transcription keyed on a leading backtick finds nothing in this table at
 * all. §26.7's cross-surface matrix, which touches this module's subject at
 * L49578, writes the same tokens INSIDE backticks. Neither dialect is
 * normalised away here; the gate strips backticks before comparing so it can
 * read both and cannot be satisfied by the wrong one.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions` ───────────────────
 *
 * Row 12's Quality Manager cell is `Allowed with conditions — at review time
 * on the anomaly record, with a recorded reason` (L36845). A `startsWith`
 * classifier reads the single most consequential cell in this module — the
 * one act on this row anybody may perform, and only elsewhere — as an
 * unconditional grant. So a cell is split on its own ` — ` first and the HEAD
 * is compared for EXACT EQUALITY against the two tokens this table uses. The
 * note is carried verbatim beside it rather than discarded: on row 12 the
 * note IS the rule, and it is what `src/surfaces/cc/decisions/link-outs.ts`
 * resolves the destination from.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * The three places where another table answers one of these rows differently
 * are in `./readings.ts`, with both readings and both locators and no winner.
 * They are deliberately not folded into the cells here: a transcription that
 * carried its own adjudication would make the two impossible to gate apart.
 */

/** The header's own five persona columns, verbatim from L36832, in its order. */
export const CC04_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc04Column = (typeof CC04_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId`, so the map is total and single-valued and the
 * compiler proves it rather than a comment claiming it.
 */
export const CC04_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc04Column, RoleId>

/**
 * The outcome tokens these sixty cells actually use — TWO, and that is worth
 * saying rather than leaving as an accident of the data. Fifty-nine cells are
 * `Explicitly prohibited` or `Allowed`; the sixtieth is row 12's Quality
 * Manager cell. There is no `Read-only` anywhere in this matrix, unlike
 * `MOD-CC-10`'s, and no `Unavailable` — which is exactly the divergence
 * `./readings.ts` records against §25.4.
 */
export const CC04_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc04Token = (typeof CC04_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it.
 * `@/policy/decision` already holds the nine tokens; nothing is redeclared,
 * only mapped.
 */
export const CC04_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc04Token, PermissionOutcome>

export interface Cc04Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC04_TOKENS`. */
  readonly token: Cc04Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc04Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc04Column, Cc04Cell>
}

const cell = (text: string): Cc04Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC04_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-04 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L36834-L36845 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions" and a prefix test reads row 12 as an unconditional grant.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const P = 'Explicitly prohibited'
const A = 'Allowed'

/**
 * The three columns that read `Explicitly prohibited` on all twelve rows are
 * spelled out per row anyway. A helper filling them from one constant is a
 * check that cannot see a transcription error in any of them, and row 12 is
 * the row where two of those three DIFFER from the third.
 */
export const CC04_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L36834',
    capability: 'Open the deviation workspace',
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
    sourceRef: 'L36835',
    capability: 'Read the assembled record and agent interpretation',
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
    sourceRef: 'L36836',
    capability: 'See containment checklist progress and who completed each item',
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
    sourceRef: 'L36837',
    capability: 'See hold lifecycle per device',
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
    sourceRef: 'L36838',
    capability: 'Release a lot hold, including an automatic Severity 1 hold',
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
    sourceRef: 'L36839',
    capability: 'Request a lot hold release with a note',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L36840',
    capability: 'View evidence against specification and proof requirements',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L36841',
    capability: 'Add an append-only annotation to a capture',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 9,
    sourceRef: 'L36842',
    capability: 'Mark evidence reviewed',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 10,
    sourceRef: 'L36843',
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
    ordinal: 11,
    sourceRef: 'L36844',
    capability: 'Edit or delete any capture or evidence item',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 12,
    sourceRef: 'L36845',
    capability: 'Reclassify severity',
    cells: {
      'Tenant Admin': cell(
        'Explicitly prohibited — reclassification is a review-time act on the Delivery Operations Hub anomaly record',
      ),
      Supervisor: cell(P),
      'Quality Manager': cell(
        'Allowed with conditions — at review time on the anomaly record, with a recorded reason',
      ),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc04Row[]

export function cc04Row(ordinal: number): Cc04Row {
  const found = CC04_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-04 has no matrix row ${ordinal}`)
  return found
}

export function cc04Cell(ordinal: number, column: Cc04Column): Cc04Cell {
  return cc04Row(ordinal).cells[column]
}

/**
 * The ONE row of the twelve whose act is performed on another surface, named
 * rather than left for a reader to find. Both of its link-bearing cells are
 * already registered in `src/surfaces/cc/decisions/link-outs.ts` as
 * `cc-04-reclassify-severity-tenant-admin` and
 * `cc-04-reclassify-severity-quality-manager`; nothing here re-spells them.
 */
export const CC04_ROW_HELD_ELSEWHERE = 12

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, DERIVED FROM THE SPINE AND NEVER TYPED TWICE.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the directory
 * name, which is what "declared, not built" means when it goes wrong.
 * ==================================================================== */

export const CC04_MODULE = ccModule('MOD-CC-04')
export const CC04_SCREEN = ccScreen('SCR-CC-05')

/** The route directory basename under `app/command-center/`. */
export const CC04_SLUG: string = (() => {
  if (CC04_MODULE.slug === null) {
    throw new Error('MOD-CC-04 owns SCR-CC-05 and must declare a slug.')
  }
  return CC04_MODULE.slug
})()
