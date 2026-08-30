import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-09`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND CELL
 * BY CELL. Section 21.12, the alert and escalation feed.
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L37860, separator L37861, data L37862-L37871. **TEN rows, five
 * persona columns, fifty cells.** The count is ten because ten lines were
 * read: the line after the last data row is blank and the one after that
 * opens `**Preconditions.**` at L37873, so the body stops at L37871. The
 * covering suite re-walks the source from the separator to the first
 * non-table line rather than trusting this sentence or `CC09_MATRIX.length`.
 *
 * The dispatch that commissioned this file gave the card's span as opening at
 * L37826 and ending three lines above the `**Roles that see and use it, and
 * their permissions.**` heading. The opening line is right and the identity
 * line L37832 is right. **The end is not**: that line is BLANK, and §21.12
 * runs from L37826 to its `**Source status.**` paragraph at L38044, with the
 * section's closing rule below it and §21.13 opening at L38048. The span
 * given stops before the matrix this file transcribes, before the storyboard,
 * before every functionality and before every acceptance criterion. That is
 * now the fourth module card span in this build to end on a blank line, and
 * the shape is always the same: the spans were taken from a table of starts
 * rather than by reading to each section's close. The end line is not spelled
 * here — `tests/coverage/locator-fidelity.test.ts` refuses a citation of a
 * blank line even inside a sentence saying the line is blank. Every other
 * locator in that dispatch was opened before anything here was written.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L37860 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first, Worker
 * last** — the exact inversion of every Frontline matrix. A positional
 * transcription against the Frontline habit swaps those two columns and
 * inverts every cell on both roles SILENTLY, because both readings are
 * internally coherent: on seven of the ten rows the Tenant Admin and the
 * Worker carry the identical `Explicitly prohibited`, and the swap shows only
 * on rows 4, 9 and 10, where the Tenant Admin's cell carries a note and the
 * Worker's does not. `CC09_COLUMNS` is therefore the header line's own five
 * words in the header line's own order, and the gate re-parses L37860 at run
 * time rather than trusting this comment.
 *
 * ── THE TOKENS ARE NOT BACKTICKED HERE ──────────────────────────────────
 *
 * Chapter 21 writes its outcome tokens bare — L37862 reads `| See the feed
 * within scope | Explicitly prohibited | Allowed | ... |`. A transcription
 * keyed on a leading backtick finds nothing in this table at all. §26.7's
 * cross-surface matrix, which touches this module's subject at L49589, writes
 * the same tokens INSIDE backticks. Neither dialect is normalised away; the
 * gate strips backticks before comparing so it can read both and cannot be
 * satisfied by the wrong one.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions` ───────────────────
 *
 * Two cells make that live here, and one of them is the single most
 * consequential cell in the module: row 5's Supervisor cell is `Allowed with
 * conditions — where the underlying act is within the Supervisor's authority`
 * (L37866), and row 7's is `Allowed with conditions — expired qualification
 * only, with the Quality Manager notified` (L37868). A `startsWith`
 * classifier reads both as unconditional grants. So a cell is split on its
 * own ` — ` first and the HEAD is compared for EXACT EQUALITY against the
 * three tokens this table uses. The note is carried verbatim beside it rather
 * than discarded: on both rows the note IS the rule.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * The resolve-versus-acknowledge split, the filter-suppression rule and the
 * three places another table answers one of these rows differently are in
 * `./readings.ts`, with both readings and both locators and no winner. They
 * are deliberately not folded into the cells here: a transcription that
 * carried its own adjudication would make the two impossible to gate apart.
 */

/** The header's own five persona columns, verbatim from L37860, in its order. */
export const CC09_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc09Column = (typeof CC09_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId`, so the map is total and single-valued and the
 * compiler proves it rather than a comment claiming it.
 */
export const CC09_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc09Column, RoleId>

/**
 * The outcome tokens these fifty cells actually use — THREE. There is no
 * `Read-only` anywhere in this matrix and no `Unavailable`, which is exactly
 * the divergence `./readings.ts` records against §25.4, whose whole Tenant
 * Admin column reads `Unavailable` for the two rows that join.
 */
export const CC09_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc09Token = (typeof CC09_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it.
 * `@/policy/decision` already holds the nine tokens; nothing is redeclared,
 * only mapped.
 */
export const CC09_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc09Token, PermissionOutcome>

export interface Cc09Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC09_TOKENS`. */
  readonly token: Cc09Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc09Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc09Column, Cc09Cell>
}

const cell = (text: string): Cc09Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC09_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-09 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L37862-L37871 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions" and a prefix test reads rows 5 and 7 as unconditional.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const P = 'Explicitly prohibited'
const A = 'Allowed'

/**
 * The three columns that read `Explicitly prohibited` on all ten rows are
 * spelled out per row anyway. A helper filling them from one constant is a
 * check that cannot see a transcription error in any of them, and rows 4, 9
 * and 10 are the rows where the Tenant Admin's cell DIFFERS from the other
 * two by carrying a note.
 */
export const CC09_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L37862',
    capability: 'See the feed within scope',
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
    sourceRef: 'L37863',
    capability: 'Filter by Area, severity, type and state',
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
    sourceRef: 'L37864',
    capability: 'See full structured routing state of an escalation',
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
    sourceRef: 'L37865',
    capability: 'Acknowledge an alert or escalation',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — not an in-shift actor'),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 5,
    sourceRef: 'L37866',
    capability: 'Resolve an escalation',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(
        "Allowed with conditions — where the underlying act is within the Supervisor's authority",
      ),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 6,
    sourceRef: 'L37867',
    capability: 'See fallback markings',
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
    sourceRef: 'L37868',
    capability: 'Grant a qualification clearance from a surfaced event',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(
        'Allowed with conditions — expired qualification only, with the Quality Manager notified',
      ),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L37869',
    capability: 'Authorise a never-held qualification',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 9,
    sourceRef: 'L37870',
    capability: 'Change routing, timers or channels',
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
    ordinal: 10,
    sourceRef: 'L37871',
    capability: 'Mute in-app notifications',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — in-app notifications cannot be muted'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc09Row[]

export function cc09Row(ordinal: number): Cc09Row {
  const found = CC09_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-09 has no matrix row ${ordinal}`)
  return found
}

export function cc09Cell(ordinal: number, column: Cc09Column): Cc09Cell {
  return cc09Row(ordinal).cells[column]
}

/**
 * THE ONE ROW OF THE TEN WHOSE ACT IS PERFORMED ON ANOTHER SURFACE, and it is
 * already registered rather than re-spelled: `src/surfaces/cc/decisions/
 * link-outs.ts` carries it as `cc-09-routing-timers-channels`, keyed on
 * L37870 with the whole row verbatim, the owner named as the Standards and
 * Operations Studio and `sourceRequires: 'link'`.
 *
 * ROW 10 IS NOT THE SAME SHAPE AND IS DELIBERATELY NOT REGISTERED. Its Tenant
 * Admin cell also carries a note — `Explicitly prohibited — in-app
 * notifications cannot be muted` — but the note is a REASON, not a
 * DESTINATION. L37848 states it as a platform rule inside the `**Channels.**`
 * paragraph — "In-app notifications cannot be muted" — and `AC-CC-325`
 * (L38023) restates it as a criterion. There is nowhere to link to, so an
 * absence is the honest rendering. A registry that took every noted
 * prohibition would have invented a link out of a sentence that names no
 * owner.
 */
export const CC09_ROW_HELD_ELSEWHERE = 9
export const CC09_LINK_OUT_CELL_ID = 'cc-09-routing-timers-channels'

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, DERIVED FROM THE SPINE AND NEVER TYPED TWICE.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the directory
 * name, which is what "declared, not built" means when it goes wrong.
 * ==================================================================== */

export const CC09_MODULE = ccModule('MOD-CC-09')
export const CC09_SCREEN = ccScreen('SCR-CC-09')

/** The route directory basename under `app/command-center/`. */
export const CC09_SLUG: string = (() => {
  if (CC09_MODULE.slug === null) {
    throw new Error('MOD-CC-09 owns SCR-CC-09 and must declare a slug.')
  }
  return CC09_MODULE.slug
})()
