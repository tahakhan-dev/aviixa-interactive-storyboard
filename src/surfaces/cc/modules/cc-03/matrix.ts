import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen, ccScreenSlug, type CcScreen, type CcScreenId } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-03`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND
 * CELL BY CELL. Section 21.6, run and exception drill-down.
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L36652, separator L36653, data L36654-L36661. **EIGHT rows, five
 * persona columns, forty cells.** The count is eight because eight lines
 * were read: the line after the last data row is blank and the one after
 * that opens `**Preconditions.**` at L36663, so the body stops at L36661.
 * `tests/unit/cc-03.test.ts` re-walks the source from the separator to the
 * first non-table line rather than trusting this sentence or
 * `CC03_MATRIX.length`.
 *
 * THE DISPATCH'S CARD SPAN ENDS ON A BLANK LINE, which is the fourth time
 * that has happened in this slice. Its opening line L36618 is right and its
 * identity line L36624 is right; §21.6 itself runs to the closing rule at
 * L36794, with §21.7 opening at L36796. The blank end line is not spelled
 * anywhere in this build — `tests/coverage/locator-fidelity.test.ts` refuses
 * a citation of a blank line even inside a sentence that calls it blank.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L36652 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first,
 * Worker last** — the exact inversion of every Frontline matrix. A
 * positional transcription against the Frontline habit swaps those two
 * columns and inverts every cell on both roles SILENTLY, because both
 * readings are internally coherent: on seven of the eight rows the Tenant
 * Admin and the Worker carry the identical `Explicitly prohibited`, and the
 * swap shows only on row 7, where the Auditor's cell carries a reason and
 * neither of those two does. `CC03_COLUMNS` is therefore the header line's
 * own five words in the header line's own order, and the gate re-parses
 * L36652 at run time rather than trusting this comment.
 *
 * ── FIVE TOKENS, NOT THREE, AND THE FIFTH APPEARS ONCE ───────────────────
 *
 * `MOD-CC-04`'s forty-eight-cell matrix uses three tokens. This one uses
 * five, and two of them appear on ONE row: row 7 is the only row carrying
 * `Read-only` and the only row carrying `Not applicable`, and it is the row
 * whose act leaves this surface. A vocabulary derived from the first six
 * rows is complete over thirty of the forty cells and wrong about the row
 * that matters.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions` ───────────────────
 *
 * Row 5's Supervisor cell is `Allowed with conditions — only reached from an
 * exception, alert or approval item` (L36658) and its Quality Manager cell
 * is `Allowed with conditions — same conditions`. A `startsWith` classifier
 * reads the exception-led rule — the single position this module exists to
 * hold — as an unconditional grant to browse worker identity. So a cell is
 * split on its own ` — ` first and the HEAD is compared for EXACT EQUALITY
 * against the five tokens this table uses. The note is carried verbatim
 * beside it rather than discarded: on rows 5 and 7 the note IS the rule.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * Where another table answers one of these rows differently is in
 * `./readings.ts`, with both readings, both locators and no winner. So is
 * the reassignment gap: this matrix has no row for action 8 and two other
 * passages place that action on this module's run view.
 */

/** The header's own five persona columns, verbatim from L36652, in its order. */
export const CC03_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc03Column = (typeof CC03_COLUMNS)[number]

/**
 * Each column read onto the platform's own role identifier. All five headers
 * name exactly one `RoleId`, so the map is total and single-valued and the
 * compiler proves it rather than a comment claiming it.
 */
export const CC03_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc03Column, RoleId>

/**
 * The outcome tokens these forty cells actually use — FIVE, counted off the
 * cells rather than assumed from a sibling module. `Read-only` and
 * `Not applicable` each occur on exactly one row, row 7, which is the row
 * whose act is performed on the Delivery Operations Hub.
 */
export const CC03_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Explicitly prohibited',
  'Not applicable',
  'Read-only',
] as const satisfies readonly string[]

export type Cc03Token = (typeof CC03_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it.
 * `@/policy/decision` already holds the nine tokens; nothing is redeclared,
 * only mapped.
 */
export const CC03_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Explicitly prohibited': 'explicitlyProhibited',
  'Not applicable': 'notApplicable',
  'Read-only': 'readOnly',
} as const satisfies Record<Cc03Token, PermissionOutcome>

export interface Cc03Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC03_TOKENS`. */
  readonly token: Cc03Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc03Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc03Column, Cc03Cell>
}

const cell = (text: string): Cc03Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC03_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-03 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L36654-L36661 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions" and a prefix test reads row 5 as an unconditional grant ` +
        `to browse worker identity, which is the one thing this module exists to refuse.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const P = 'Explicitly prohibited'
const A = 'Allowed'

/**
 * The three columns that read `Explicitly prohibited` on seven of the eight
 * rows are spelled out per row anyway. A helper filling them from one
 * constant is a check that cannot see a transcription error in any of them,
 * and row 7 is the row where one of those three DIFFERS from the other two.
 */
export const CC03_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L36654',
    capability: 'Drill from board to cell view',
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
    sourceRef: 'L36655',
    capability: 'Drill from cell to run view',
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
    sourceRef: 'L36656',
    capability: 'Drill from run to step or record detail',
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
    sourceRef: 'L36657',
    capability: 'See the pinned workflow version on a run',
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
    sourceRef: 'L36658',
    capability: 'See worker identity within an exception context',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(
        'Allowed with conditions — only reached from an exception, alert or approval item',
      ),
      'Quality Manager': cell('Allowed with conditions — same conditions'),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 6,
    sourceRef: 'L36659',
    capability: 'Navigate by worker as an entry point',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L36660',
    capability: 'View history older than the current shift',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell('Read-only — by link into the Delivery Operations Hub'),
      'Quality Manager': cell('Read-only — by link into the Delivery Operations Hub'),
      'Read-only Auditor': cell(
        'Not applicable — the Auditor works from the Delivery Operations Hub directly and needs no Command Center route',
      ),
      Worker: cell(P),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L36661',
    capability: 'Edit any capture, step or run record',
    cells: {
      'Tenant Admin': cell(P),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc03Row[]

export function cc03Row(ordinal: number): Cc03Row {
  const found = CC03_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-03 has no matrix row ${ordinal}`)
  return found
}

export function cc03Cell(ordinal: number, column: Cc03Column): Cc03Cell {
  return cc03Row(ordinal).cells[column]
}

/**
 * The ONE row of the eight whose act is performed on another surface, named
 * rather than left for a reader to find.
 *
 * IT IS NOT IN `src/surfaces/cc/decisions/link-outs.ts`, AND IT CANNOT BE.
 * That register's `CcLinkOutToken` is a closed two-member vocabulary —
 * `Explicitly prohibited` and `Allowed with conditions` — because the twelve
 * rows it was built from carry only those two. Row 7's link-bearing cells
 * carry `Read-only`, so the cell is unconstructible there without widening a
 * closed vocabulary in a file this task does not own. The measured "13 cells
 * across 12 distinct rows" therefore counts two shapes and misses a third:
 * a PERMISSIVE-BUT-NON-ACTING token whose note names the destination. The
 * finding is recorded in `./readings.ts`; the register is not edited.
 */
export const CC03_ROW_HELD_ELSEWHERE = 7

/**
 * The two columns of row 7 whose cell text names the Delivery Operations Hub
 * as the destination and therefore owes a link. The Auditor's cell on the
 * same row names the Hub too and owes NOTHING — its own words say the
 * Auditor "works from the Delivery Operations Hub directly and needs no
 * Command Center route", which is the opposite claim. Naming the Hub is not
 * the test; owing a route to it is.
 */
export const CC03_LINK_BEARING_COLUMNS = [
  'Supervisor',
  'Quality Manager',
] as const satisfies readonly Cc03Column[]

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, AND THE TWO SCREENS IT SERVES.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the
 * directory name, which is what "declared, not built" means when it goes
 * wrong.
 *
 * ONE MODULE, TWO REGISTER ROWS, TWO ROUTES, AND ONLY ONE SLUG CLAIM. The
 * register puts `MOD-CC-03` on TWO rows: `SCR-CC-03` Cell view shows
 * `MOD-CC-03 FEAT-CC-0301` (L48388) and `SCR-CC-04` Run drill-down shows
 * `MOD-CC-03 all features` (L48389). One module owns at most one route —
 * `scripts/build-registries.mjs` throws on a slug matching more than one
 * directory — so the spine gives this module `slug: 'run-drill-down'`, the
 * `all features` row, and leaves the cell view unclaimed.
 *
 * THE CELL VIEW'S ROUTE KEY IS NOT THIS TASK'S TO CHOOSE, AND THE DISPATCH
 * SAID IT WOULD BE. It expected `ccScreenSlug('SCR-CC-03')` to return
 * `null`. It does not: `src/surfaces/cc/screens.ts` carries
 * `unownedSlug: 'cell-view'` on that row precisely so the key is settled on
 * the spine rather than invented by whichever task builds the directory, and
 * `CC_NAV` has been publishing `/command-center/cell-view` since slice 8.
 * Both slugs below are therefore READ from the spine through `ccScreenSlug`,
 * neither is typed, and a directory under any other name would leave a
 * published navigation entry pointing at a route that does not exist.
 * ==================================================================== */

export const CC03_MODULE = ccModule('MOD-CC-03')

/** `SCR-CC-04` — the screen this module OWNS. `all features`. */
export const CC03_RUN_SCREEN = ccScreen('SCR-CC-04')

/** `SCR-CC-03` — the screen this module APPEARS ON. One feature of it. */
export const CC03_CELL_SCREEN = ccScreen('SCR-CC-03')

/** Both route directory basenames under `app/command-center/`, from the spine. */
export function cc03Slug(screen: CcScreen): string {
  const slug = ccScreenSlug(screen)
  if (slug === null) {
    throw new Error(
      `${screen.id} resolves to no route key on the spine. MOD-CC-03 serves two screens and ` +
        'both need a directory; the key is settled in src/surfaces/cc/screens.ts, never here.',
    )
  }
  return slug
}

export const CC03_RUN_SLUG: string = cc03Slug(CC03_RUN_SCREEN)
export const CC03_CELL_SLUG: string = cc03Slug(CC03_CELL_SCREEN)

/* ==================================================================== *
 * WHICH FEATURES EACH SCREEN SHOWS, IN THE REGISTER'S OWN WORDS.
 *
 * The two rows differ in exactly one column and that column is what makes
 * them two screens rather than one rendered twice. The feature list below is
 * DERIVED from each row's `Modules and features shown` cell rather than
 * chosen: `MOD-CC-03 FEAT-CC-0301` names one feature and `MOD-CC-03 all
 * features` names every feature the card declares.
 * ==================================================================== */

/** The card's three features, in its own order: L36724, L36732, L36738. */
export const CC03_FEATURES = [
  { id: 'FEAT-CC-0301', name: 'The three-level drill path', sourceRef: 'L36724' },
  { id: 'FEAT-CC-0302', name: 'Exception-led navigation', sourceRef: 'L36732' },
  { id: 'FEAT-CC-0303', name: 'The history boundary', sourceRef: 'L36738' },
] as const satisfies readonly {
  readonly id: string
  readonly name: string
  readonly sourceRef: string
}[]

export type Cc03FeatureId = (typeof CC03_FEATURES)[number]['id']

/**
 * The nine functionalities the card declares, each with the fallback
 * patterns its own line names. THREE NAME NONE, and that is transcribed
 * rather than repaired — see `CC03_AC_090_GAP` in `./readings.ts`.
 */
export const CC03_FUNCTIONALITIES = [
  { id: 'FUNC-CC-0301-1-1', sourceRef: 'L36726', patterns: ['FB-CC-STALE'] },
  { id: 'FUNC-CC-0301-2-1', sourceRef: 'L36728', patterns: ['FB-CC-STALE'] },
  { id: 'FUNC-CC-0301-2-2', sourceRef: 'L36729', patterns: ['FB-CC-STALE'] },
  { id: 'FUNC-CC-0301-3-1', sourceRef: 'L36731', patterns: ['FB-CC-STALE'] },
  { id: 'FUNC-CC-0302-1-1', sourceRef: 'L36734', patterns: [] },
  { id: 'FUNC-CC-0302-1-2', sourceRef: 'L36735', patterns: [] },
  { id: 'FUNC-CC-0302-2-1', sourceRef: 'L36737', patterns: [] },
  { id: 'FUNC-CC-0303-1-1', sourceRef: 'L36740', patterns: ['FB-CC-SESS'] },
  { id: 'FUNC-CC-0303-1-2', sourceRef: 'L36741', patterns: ['FB-CC-STALE'] },
] as const satisfies readonly {
  readonly id: string
  readonly sourceRef: string
  readonly patterns: readonly string[]
}[]

/**
 * The feature a functionality belongs to, read off its own identifier rather
 * than stored a second time: `FUNC-CC-0301-2-2` belongs to `FEAT-CC-0301`.
 */
export function cc03FeatureOf(functionalityId: string): Cc03FeatureId {
  const stem = /^FUNC-(CC-\d{4})-/.exec(functionalityId)?.[1]
  const found = CC03_FEATURES.find((f) => f.id === `FEAT-${stem}`)
  if (found === undefined) {
    throw new Error(`${functionalityId} names no feature of MOD-CC-03.`)
  }
  return found.id
}

export interface Cc03ScreenFeatures {
  readonly screen: CcScreenId
  /** Verbatim from that register row's `Modules and features shown` column. */
  readonly modulesShownCell: string
  /** Verbatim from that register row's `Navigation entry point` column. */
  readonly navigationEntry: string
  readonly registerRef: string
  readonly features: readonly Cc03FeatureId[]
}

export const CC03_SCREEN_FEATURES = [
  {
    screen: 'SCR-CC-03',
    modulesShownCell: 'MOD-CC-03 FEAT-CC-0301',
    navigationEntry: 'Live shift board',
    registerRef: 'L48388',
    features: ['FEAT-CC-0301'],
  },
  {
    screen: 'SCR-CC-04',
    modulesShownCell: 'MOD-CC-03 all features',
    navigationEntry: 'Cell view',
    registerRef: 'L48389',
    features: ['FEAT-CC-0301', 'FEAT-CC-0302', 'FEAT-CC-0303'],
  },
] as const satisfies readonly Cc03ScreenFeatures[]

export function cc03ScreenFeatures(id: CcScreenId): Cc03ScreenFeatures {
  const found = CC03_SCREEN_FEATURES.find((s) => s.screen === id)
  if (found === undefined) {
    throw new Error(`MOD-CC-03 does not appear on ${id}; the register puts it on two rows only.`)
  }
  return found
}

/**
 * THE NAVIGATION COLUMN IS AN ENTRY PATH, NOT A URL, AND IT IS A CHAIN.
 * `SCR-CC-03` is reached from "Live shift board" and `SCR-CC-04` from "Cell
 * view" — board → cell → run, which is the drill this module is named for
 * and which `AC-CC-200` (L36771) counts as exactly three levels, one gesture
 * per level. Both screens carry the link that makes the chain walkable; the
 * board's own route already exists.
 */
export const CC03_CHAIN = [
  { step: 1, label: 'Live shift board', screen: 'SCR-CC-02', slug: cc03Slug(ccScreen('SCR-CC-02')) },
  { step: 2, label: 'Cell view', screen: 'SCR-CC-03', slug: CC03_CELL_SLUG },
  { step: 3, label: 'Run drill-down', screen: 'SCR-CC-04', slug: CC03_RUN_SLUG },
] as const satisfies readonly {
  readonly step: number
  readonly label: string
  readonly screen: CcScreenId
  readonly slug: string
}[]
