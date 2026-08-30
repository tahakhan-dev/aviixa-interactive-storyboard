import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'

/**
 * `MOD-CC-11`'s CHAPTER-21 PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND
 * CELL BY CELL. Section 21.14, standard reports and the Custom Report Builder.
 *
 * ── THE COUNT WAS TAKEN BY READING THE ROWS ──────────────────────────────
 *
 * Header L38287, separator L38288, data L38289-L38297. **NINE rows, five
 * persona columns, forty-five cells.** Nine because nine lines were read: the
 * line after the last data row is blank and the one after that opens the
 * `Report-format authoring` paragraph at L38299, so the body stops at L38297.
 * The covering suite re-walks the source from the separator to the first
 * non-table line rather than trusting this sentence or `CC11_MATRIX.length`.
 *
 * ── THE COMMISSIONING DISPATCH'S CARD SPAN ENDS ON A BLANK LINE ──────────
 *
 * Its opening line L38247 is right and its identity line L38253 is right. Its
 * stated END is the BLANK line immediately above `**Roles that see and use
 * it, and their permissions.**` (L38285) — so it stops before the matrix this
 * file transcribes and 165 lines before the section's own close. §21.14 runs
 * from L38247 to its `Source status.` paragraph at L38449, with §21.15
 * opening at L38453. That is the FOURTH module card span in this slice to end
 * on a blank line, and the cause is the one the common brief names: the spans
 * were taken from a table of section starts rather than by reading to each
 * section's close. The wrong end line is NOT SPELLED as a citation here or in
 * the covering suite — `tests/coverage/locator-fidelity.test.ts` refuses a
 * citation of a blank line even inside a sentence saying the line is blank,
 * and it has gone red on exactly that once already this slice.
 *
 * ── THE COLUMN ORDER IS THIS SURFACE'S OWN AND INVERTS THE FRONTLINE'S ───
 *
 * L38287 reads `Capability on this module | Tenant Admin | Supervisor |
 * Quality Manager | Read-only Auditor | Worker`. **Tenant Admin first, Worker
 * last** — the exact inversion of every Frontline matrix. On this module the
 * swap is NOT silent in the way it is on `MOD-CC-04`: seven of the nine rows
 * give the Tenant Admin `Allowed` and the Worker `Explicitly prohibited`, so
 * a positional read against the Frontline habit inverts the module's whole
 * meaning rather than one cell. `CC11_COLUMNS` is the header line's own five
 * words in the header line's own order and the gate re-parses L38287 at run
 * time rather than trusting this comment.
 *
 * ── THE TOKENS ARE NOT BACKTICKED HERE ───────────────────────────────────
 *
 * Chapter 21 writes its outcome tokens bare — L38292 reads `| Author a saved
 * format | Allowed | Explicitly prohibited | Allowed | ... |`. A
 * transcription keyed on a leading backtick finds nothing in this table at
 * all. The gate strips backticks before comparing so it can read both
 * dialects and cannot be satisfied by the wrong one.
 *
 * ── `Allowed` IS A PREFIX OF `Allowed with conditions` ───────────────────
 *
 * Three of the nine rows carry `Allowed with conditions` in the Supervisor
 * column and `Allowed` in the Tenant Admin and Quality Manager columns of the
 * same row, so a `startsWith` classifier reads the Supervisor's scoped grant
 * as the unconditional one on the three rows where the scope IS the rule.
 * A cell is therefore split on its own ` — ` first and the HEAD compared for
 * EXACT EQUALITY against the tokens this table uses; the note is carried
 * verbatim beside it rather than discarded.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ─────────────────────────────────────────
 *
 * The five data sets, their open identity, `DEC-REPORT-001` and
 * `DEC-RPTBLD-001` are in `./report-sets.ts`. Report-format authoring's
 * standing outside the ten is wave 0's
 * `src/surfaces/cc/actions/outside-writes.ts` and is consumed, never
 * re-spelled here.
 */

/** The header's own five persona columns, verbatim from L38287, in its order. */
export const CC11_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc11Column = (typeof CC11_COLUMNS)[number]

/** Each column read onto the platform's own role identifier. Total, and proved by the compiler. */
export const CC11_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc11Column, RoleId>

/**
 * The outcome tokens these forty-five cells use — THREE. Counted off the
 * source rather than off the array below: twenty-eight cells are `Explicitly
 * prohibited`, fourteen are `Allowed`, three are `Allowed with conditions`.
 * There is no `Read-only` and no `Unavailable` anywhere in this matrix,
 * unlike `MOD-CC-01`'s and §25.4's.
 */
export const CC11_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc11Token = (typeof CC11_TOKENS)[number]

/** The token as this build's own permission vocabulary names it. Nothing is redeclared. */
export const CC11_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc11Token, PermissionOutcome>

export interface Cc11Cell {
  /** The cell exactly as the source writes it. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC11_TOKENS`. */
  readonly token: Cc11Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

export interface Cc11Row {
  /** 1-based, the source's own row order. */
  readonly ordinal: number
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc11Column, Cc11Cell>
}

const cell = (text: string): Cc11Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC11_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-11 matrix cell "${text}" has head "${head}", which is not one of the tokens ` +
        `L38289-L38297 use. Exact equality on the head, never a prefix: "Allowed" is a prefix ` +
        `of "Allowed with conditions", and three rows here put the two in the same row.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const P = 'Explicitly prohibited'
const A = 'Allowed'

/**
 * The two columns that read `Explicitly prohibited` on all nine rows — the
 * Read-only Auditor's and the Worker's — are spelled out per row anyway. A
 * helper filling them from one constant is a check that cannot see a
 * transcription error in either of them.
 */
export const CC11_MATRIX = [
  {
    ordinal: 1,
    sourceRef: 'L38289',
    capability: 'View a standard report within scope',
    cells: {
      'Tenant Admin': cell(A),
      Supervisor: cell("Allowed with conditions — within the Supervisor's Area scope"),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 2,
    sourceRef: 'L38290',
    capability: 'Filter by date and scope',
    cells: {
      'Tenant Admin': cell(A),
      Supervisor: cell('Allowed with conditions — within scope'),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 3,
    sourceRef: 'L38291',
    capability: 'Export on demand',
    cells: {
      'Tenant Admin': cell(A),
      Supervisor: cell('Allowed with conditions — within scope'),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 4,
    sourceRef: 'L38292',
    capability: 'Author a saved format',
    cells: {
      'Tenant Admin': cell(A),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 5,
    sourceRef: 'L38293',
    capability: 'Edit or delete a saved format',
    cells: {
      'Tenant Admin': cell(A),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 6,
    sourceRef: 'L38294',
    capability: 'Configure a schedule and recipient set',
    cells: {
      'Tenant Admin': cell(A),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 7,
    sourceRef: 'L38295',
    capability: 'Enable the re-send-on-material-correction option per format',
    cells: {
      'Tenant Admin': cell(A),
      Supervisor: cell(P),
      'Quality Manager': cell(A),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 8,
    sourceRef: 'L38296',
    capability: 'Create a sixth data set',
    cells: {
      'Tenant Admin': cell(
        'Explicitly prohibited — the list is five; items may be swapped, never added',
      ),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
  {
    ordinal: 9,
    sourceRef: 'L38297',
    capability: 'Export to an external system automatically',
    cells: {
      'Tenant Admin': cell('Explicitly prohibited — platform roadmap, not this surface'),
      Supervisor: cell(P),
      'Quality Manager': cell(P),
      'Read-only Auditor': cell(P),
      Worker: cell(P),
    },
  },
] as const satisfies readonly Cc11Row[]

export function cc11Row(ordinal: number): Cc11Row {
  const found = CC11_MATRIX.find((r) => r.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-11 has no matrix row ${ordinal}`)
  return found
}

export function cc11Cell(ordinal: number, column: Cc11Column): Cc11Cell {
  return cc11Row(ordinal).cells[column]
}

/**
 * NO ROW OF THIS MATRIX IS A POPULATION-B LINK-OUT CELL, and that is recorded
 * rather than left to inference. Population B is a cell the source marks
 * prohibited and then names a DESTINATION for, which `AC-CC-301` requires to
 * BE a link; `src/surfaces/cc/decisions/link-outs.ts` registers thirteen of
 * them and none is this module's. Rows 8 and 9 are prohibited-with-a-note and
 * their notes name no destination that can be linked: row 8's note is a
 * product rule about the list's size, and row 9's names the platform roadmap,
 * which is a sequencing statement rather than a surface. So this module draws
 * no `CrossSurfaceLink`, and the absence is a reading of the rows rather than
 * an omission.
 */
export const CC11_LINK_OUT_CELLS = 0

/* ==================================================================== *
 * THE TENANT ADMIN IS THE ROLE THIS MODULE IS THE BASELINE FOR.
 *
 * The surface matrix (§21.1.2, header L35002, separator L35003, data
 * L35004-L35023) opens with `Open any Command Center route`, and its Tenant
 * Admin cell at L35004 reads `Allowed with conditions — report and banner
 * routes only`. This module is a REPORT route, and its Tenant Admin column is
 * `Allowed` on all seven capability rows and `Explicitly prohibited` on the
 * two rows that are prohibited to everyone. That is the restriction being
 * KEPT — the only module in chapter 21 where the route grant and the module
 * grants agree without qualification.
 *
 * THREE MODULES GRANT THE TENANT ADMIN SOMETHING THAT IS NEITHER A REPORT
 * ROUTE NOR A BANNER ROUTE, ON FIVE ROWS — three and five, and the two
 * numbers are not interchangeable. The first draft of this record carried
 * four rows: it had counted the modules and then written down the rows it
 * remembered. The completeness gate walked all twelve chapter-21 module
 * matrices and returned a fifth line the record did not carry — L36268, the
 * freshness marker. Every row is named below with its own line, read
 * header-keyed off each matrix's own header, and the gate compares the LINES
 * rather than the count, because a count of five is also true of five wrong
 * rows.
 *
 * `MOD-CC-02` is NOT among
 * them: it is the banner module itself (§21.5, "Sync State and Connectivity"),
 * so its five Tenant Admin grants sit inside the allowance rather than outside
 * it — counting it would inflate the finding by treating the allowance's own
 * subject as a breach of it.
 *
 * THE SURFACE MATRIX ALSO CONTRADICTS ITSELF ONE ROW BELOW THE RESTRICTION,
 * and that is recorded because it is the sharpest instance: L35005, `Live
 * shift board within scope`, gives the Tenant Admin `Read-only` — a board, in
 * the same twenty-row table whose first row says report and banner routes
 * only.
 *
 * NOTHING HERE IS ADJUDICATED. Each divergence carries the restriction's line
 * and its own line, and no reading is marked correct.
 * ==================================================================== */

export interface Cc11TenantAdminDivergence {
  /** The module whose matrix grants it. */
  readonly module: string
  /** The capability row, verbatim from its `Capability on this module` column. */
  readonly capability: string
  /** That row's Tenant Admin cell, verbatim. */
  readonly cell: string
  /** The row's own line. */
  readonly line: number
  /** Why the grant is neither a report route nor a banner route. */
  readonly whyOutside: string
}

export const CC11_TENANT_ADMIN_RESTRICTION = {
  line: 35004,
  capability: 'Open any Command Center route',
  cell: 'Allowed with conditions — report and banner routes only',
  consistentHere: true,
  whyConsistentHere:
    'Every Tenant Admin grant in this matrix is on a report capability of a report route: view, ' +
    'filter, export, author, edit, schedule and the per-format re-send option. The two rows the ' +
    'Tenant Admin is prohibited on are prohibited to every role. Nothing here reaches a board, a ' +
    'queue, a feed or a panel.',
} as const

export const CC11_TENANT_ADMIN_DIVERGENCES = [
  {
    module: 'MOD-CC-01',
    capability: 'View the scoped board',
    cell: 'Read-only — reached only via the connectivity banner context',
    line: 36264,
    whyOutside:
      'A board is not a report route. The cell reaches for the banner allowance in its own note ' +
      'rather than for a report one, which is the closest any of the three comes to staying ' +
      'inside L35004 — and a board reached through a banner is still a board.',
  },
  {
    module: 'MOD-CC-01',
    capability: 'View the cross-Area rolled-up board',
    cell: 'Allowed with conditions — requires Tenant or Site read scope',
    line: 36265,
    whyOutside:
      'The condition is a scope grant, not a route class. Nothing in the cell ties it to a report ' +
      'or a banner.',
  },
  {
    module: 'MOD-CC-01',
    capability: 'See the freshness marker and expand it',
    cell: 'Allowed',
    line: 36268,
    whyOutside:
      'The freshness marker is MOD-CC-02’s element, and MOD-CC-02 is the banner module — but the ' +
      'grant is written into the BOARD’s matrix, on the board’s route, and a marker is not a ' +
      'banner. Recorded rather than argued either way: read as MOD-CC-02’s element it sits ' +
      'inside the allowance, and read as a row of MOD-CC-01’s matrix it does not. This is the ' +
      'row the first draft of this record missed.',
  },
  {
    module: 'MOD-CC-08',
    capability: 'See the cross-Area agent health roll-up',
    cell: 'Allowed with conditions — requires Tenant or Site read scope',
    line: 37670,
    whyOutside:
      'The agent activity panel is its own route. The screen register gives SCR-CC-08 to the ' +
      'Tenant Admin explicitly (L48393), which is the same grant stated twice and outside the ' +
      'restriction both times.',
  },
  {
    module: 'MOD-CC-12',
    capability: 'See the unacknowledged-brief flag',
    cell: 'Allowed with conditions — where holding Tenant or Site read scope',
    line: 38488,
    whyOutside:
      'The shift handoff panel is neither a report nor a banner, and MOD-CC-12 prohibits the ' +
      'Tenant Admin on its other seven rows — so this is a single grant on a route the ' +
      'restriction does not admit at all.',
  },
] as const satisfies readonly Cc11TenantAdminDivergence[]

/**
 * The surface matrix disagreeing with its own first row, recorded apart from
 * the module divergences because it is not one: it is one table, two rows.
 */
export const CC11_SURFACE_MATRIX_SELF_DIVERGENCE = {
  restrictionLine: 35004,
  otherLine: 35005,
  otherCapability: 'Live shift board within scope',
  otherCell: 'Read-only',
  note:
    'The restriction and this grant are the first and second data rows of the same twenty-row ' +
    'table. Recorded, not resolved: a Read-only board grant is not a report route and not a ' +
    'banner route, and no decision identifier covers the disagreement.',
} as const

/* ==================================================================== *
 * THE MODULE'S OWN IDENTITY, DERIVED FROM THE SPINE AND NEVER TYPED TWICE.
 *
 * `slug` is spelled in exactly one place in this build — `src/surfaces/cc/
 * modules.ts` — and `scripts/build-registries.mjs` reads that same file. A
 * literal here would be a second spelling that could drift from the directory
 * name, which is what "declared, not built" means when it goes wrong.
 * ==================================================================== */

export const CC11_MODULE = ccModule('MOD-CC-11')
export const CC11_SCREEN = ccScreen('SCR-CC-11')

/** The route directory basename under `app/command-center/`. */
export const CC11_SLUG: string = (() => {
  if (CC11_MODULE.slug === null) {
    throw new Error('MOD-CC-11 owns SCR-CC-11 and must declare a slug.')
  }
  return CC11_MODULE.slug
})()
