import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-08`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND
 * CELL BY CELL. Section 21.11, the agent activity panel.
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L37664, separator L37665, data L37666-L37674. **NINE rows, five
 * persona columns, forty-five cells.** Nine because nine lines were read, not
 * because a span was subtracted: the line after the last data row is blank
 * and the one after that opens `**Preconditions.**` at L37676, so the body
 * stops at L37674. The covering suite re-walks the source from the separator
 * to the first non-table line rather than trusting this sentence or
 * `CC08_MATRIX.length`.
 *
 * DO NOT CONFLATE THIS NINE WITH THE OTHER NINE. This module also declares
 * NINE functionalities (`./readings.ts`), and the two nines are unrelated
 * counts over unrelated lists. Each was counted separately, off its own part
 * of the source.
 *
 * The dispatch that commissioned this file gave the card's span as ending
 * two lines above `**Roles that see and use it, and their permissions.**` —
 * **on a blank line**, and above the matrix this file transcribes. Its
 * opening line L37634 is right and its identity line L37640 is right; the
 * card itself runs to the closing rule at L37824, with §21.12 opening at
 * L37826, and only the prose preamble ends where the dispatch put the whole
 * card. The matrix, the states, the storyboard, the nine functionalities and
 * all eight acceptance criteria are below it. That is the fourth module card
 * span in this slice to end on a blank line, and the wrong end line is
 * deliberately not spelled here: `locator-fidelity` refuses a citation of a
 * blank line even inside a sentence saying the line is blank.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L37664 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first, Worker
 * last** — the exact inversion of every Frontline matrix, which opens on
 * Worker. A positional transcription against the Frontline habit swaps those
 * two columns and inverts every cell on both roles SILENTLY, because both
 * readings are internally coherent. Counted off the cells: on FIVE of the
 * nine rows (1, 2, 3, 4, 9) the Tenant Admin and the Worker carry the
 * identical `Explicitly prohibited` and the swap leaves no trace at all; on
 * the other four it shows, and on three of those four (6, 7, 8) the only
 * difference is a trailing note a careless reader drops. So exactly ONE row
 * of nine — row 5, the cross-Area roll-up — makes the swap visible by its
 * token. `CC08_COLUMNS` is therefore the header line's own five words in the
 * header line's own order, and the gate re-parses L37664 at run time rather
 * than trusting this comment.
 *
 * ── THE TOKENS ARE NOT BACKTICKED HERE ───────────────────────────────────
 *
 * Chapter 21 writes its outcome tokens bare — L37666 reads `| See per-agent
 * live status | Explicitly prohibited | Allowed | ... |`. A transcription
 * keyed on a leading backtick finds nothing in this table at all. §25.4 and
 * §21.16, which answer this module's row 9 differently, write theirs bare
 * too; §26.7 backticks them. The gate strips backticks before comparing so it
 * can read both dialects and cannot be satisfied by the wrong one.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions` ───────────────────
 *
 * Rows 3 and 5 carry `Allowed with conditions` on five cells between them. A
 * `startsWith` classifier reads all five as unconditional grants — including
 * the one cell in this matrix that gives the Tenant Admin anything at all. So
 * a cell is split on its own ` — ` first and the HEAD is compared for EXACT
 * EQUALITY against the three tokens this table uses. The note is carried
 * verbatim beside it rather than discarded: on rows 6 and 7 the note IS the
 * destination, and it is what `src/surfaces/cc/decisions/link-outs.ts`
 * resolves the link from.
 *
 * ── READ THE WHOLE CLAUSE, NEVER THE TOKEN ALONE ─────────────────────────
 *
 * Three of the nine rows carry a qualified `Explicitly prohibited` in the
 * Tenant Admin column and they do NOT mean the same thing:
 *
 *  - L37671 `— a Standards and Operations Studio action, linked from here`
 *  - L37672 `— Studio or platform action`
 *  - L37673 `— platform-internal`
 *
 * The first two name a DESTINATION and their required affordance is a link
 * (`FUNC-CC-0801-1-2` L37781, `AC-CC-301` L37802). The third names a
 * BOUNDARY and its required affordance is the absence `AC-CC-303` (L37804)
 * demands — "No Command Center endpoint returns orchestrator reasoning
 * internals." Classified by token alone all three render identically and two
 * of them render wrongly. Which is which is recorded in
 * `CC08_LINK_OUT_ROWS` and `CC08_ABSENCE_IS_CORRECT_ROW` below.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * Where another table answers one of these rows differently, the readings are
 * in `./readings.ts` with both locators and no winner. They are deliberately
 * not folded into the cells here: a transcription that carried its own
 * adjudication would make the two impossible to gate apart.
 */

/** The header's own five persona columns, verbatim from L37664, in its order. */
export const CC08_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc08Column = (typeof CC08_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId`, so the map is total and single-valued and the
 * compiler proves it rather than a comment claiming it.
 */
export const CC08_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc08Column, RoleId>

/**
 * The outcome tokens these forty-five cells actually use — THREE. There is no
 * `Read-only` anywhere in this matrix and no `Unavailable`, which is exactly
 * the divergence `./readings.ts` records against §25.4's row 9.
 */
export const CC08_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc08Token = (typeof CC08_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it.
 * `@/policy/decision` already holds the nine tokens; nothing is redeclared,
 * only mapped.
 */
export const CC08_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc08Token, PermissionOutcome>

export interface Cc08Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC08_TOKENS`. */
  readonly token: Cc08Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc08Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc08Column, Cc08Cell>
}

const cell = (text: string): Cc08Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC08_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-08 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L37666-L37674 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions" and a prefix test reads five conditional cells as grants.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const P = 'Explicitly prohibited'
const A = 'Allowed'
const AREA_SCOPE = "Allowed with conditions — within the actor's Area scope"
const READ_SCOPE = 'Allowed with conditions — requires Tenant or Site read scope'

/**
 * The two columns that read `Explicitly prohibited` on all nine rows — the
 * Read-only Auditor's and the Worker's — are spelled out per row anyway. A
 * helper filling them from one constant is a check that cannot see a
 * transcription error in either of them, and this matrix's whole danger is
 * that the Worker's column and the Tenant Admin's sit at opposite ends.
 */
export const CC08_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L37666',
    capability: 'See per-agent live status',
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
    sourceRef: 'L37667',
    capability: 'Read the plain-language activity log',
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
    sourceRef: 'L37668',
    capability: 'Follow an evidence link from a log entry',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(AREA_SCOPE),
      'Quality Manager': cell(AREA_SCOPE),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 4,
    sourceRef: 'L37669',
    capability: 'See agent health flags',
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
    sourceRef: 'L37670',
    capability: 'See the cross-Area agent health roll-up',
    cells: {
      'Tenant Admin': cell(READ_SCOPE),
      Supervisor: cell(READ_SCOPE),
      'Quality Manager': cell(READ_SCOPE),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 6,
    sourceRef: 'L37671',
    capability: 'Switch an agent on or off',
    cells: {
      'Tenant Admin': cell(
        'Explicitly prohibited — a Standards and Operations Studio action, linked from here',
      ),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L37672',
    capability: 'Reconfigure or fix an agent',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — Studio or platform action'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L37673',
    capability: 'View raw reasoning traces',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — platform-internal'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 9,
    sourceRef: 'L37674',
    capability: 'Request an agent re-check on a record',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(A),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc08Row[]

export function cc08Row(ordinal: number): Cc08Row {
  const found = CC08_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-08 has no matrix row ${ordinal}`)
  return found
}

export function cc08Cell(ordinal: number, column: Cc08Column): Cc08Cell {
  return cc08Row(ordinal).cells[column]
}

/**
 * THE TWO ROWS WHOSE PROHIBITION NAMES A DESTINATION, and the id each one is
 * already registered under in `src/surfaces/cc/decisions/link-outs.ts`.
 *
 * Nothing here re-spells a link. The registry is task 5's and holds the whole
 * row text, the line, the owner and what the source requires; this pair is
 * only the join from an ordinal in THIS table to a row in THAT one, so the
 * panel can render a link where the source spells a destination without
 * either file restating the other.
 */
export const CC08_LINK_OUT_ROWS = [
  { ordinal: 6, linkOutId: 'cc-08-switch-agent' },
  { ordinal: 7, linkOutId: 'cc-08-reconfigure-agent' },
] as const satisfies readonly { readonly ordinal: number; readonly linkOutId: string }[]

/**
 * THE THIRD QUALIFIED PROHIBITION, WHICH IS NOT A LINK-OUT AND MUST NOT
 * BECOME ONE.
 *
 * Row 8's Tenant Admin cell reads `Explicitly prohibited — platform-internal`
 * (L37673). It carries a note in the same shape as rows 6 and 7 and it names
 * no place this surface could send anybody: `AC-CC-303` (L37804) reads "No
 * Command Center endpoint returns orchestrator reasoning internals", and
 * `FUNC-CC-0804-1-1` (L37795) gives its roles prohibited as "every role".
 * `WriteControl`'s absent branch is the CORRECT rendering for this one cell,
 * which is why it is named here rather than left to look like an oversight
 * beside its two neighbours.
 */
export const CC08_ABSENCE_IS_CORRECT_ROW = 8

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, DERIVED FROM THE SPINE AND NEVER TYPED TWICE.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the directory
 * name, which is what "declared, not built" means when it goes wrong.
 * ==================================================================== */

export const CC08_MODULE = ccModule('MOD-CC-08')
export const CC08_SCREEN = ccScreen('SCR-CC-08')

/** The route directory basename under `app/command-center/`. */
export const CC08_SLUG: string = (() => {
  if (CC08_MODULE.slug === null) {
    throw new Error('MOD-CC-08 owns SCR-CC-08 and must declare a slug.')
  }
  return CC08_MODULE.slug
})()
