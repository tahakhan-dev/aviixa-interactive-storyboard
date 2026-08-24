import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-05`'s own permission matrix — the source's table at **L32257
 * (header) and L32259-L32267 (nine data rows)**, transcribed cell by cell.
 *
 * TWO THINGS READ THIS FILE, and neither reads a role list:
 *
 * 1. `scripts/build-stu-module-reach.mjs` derives which personas are offered
 *    this module's route, through `reachByStudioMatrix` over the rows
 *    classified `screen`. Every row therefore carries `surface`, and every
 *    row answers all EIGHT persona columns.
 * 2. `evaluateStudioAccess` answers the per-control affordance question, one
 *    row at a time. There is no module-level role list in this module.
 *
 * ### FINDING F1 — the card heads SIX columns; the vocabulary has EIGHT
 *
 * L32257's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker`. Neither the
 * **Plant Manager persona** nor the **`GRANT-STU-IMPL`** column appears. Each
 * is filled from a named source line and each fill is written on the row's
 * own `derivation` map. A blank cell reads as "withheld" without anybody
 * writing it down, which is the defect L10238 names one level up.
 *
 * - **Plant Manager** mirrors the without-grant cell, because `DEC-ROLE-001`
 *   (L34522) delivers that persona's Studio access "by a Supervisor role
 *   without the authoring grant". Where the consolidated matrix heads its own
 *   Plant Manager column and reads differently, the divergence is stated on
 *   the cell rather than smoothed away — see F2.
 * - **Implementation team** is transcribed from the card's OWN function
 *   lines, which name it in so many words: `FUNC-STU-05-02-A-1` (L32284),
 *   "Roles allowed: Quality Manager, Supervisor with the grant, implementation
 *   team grant", and every later functionality that says "as above". The
 *   consolidated matrix corroborates it — "Author all nine configuration
 *   sections | … | `GRANT-STU-IMPL` | Allowed with conditions" (L34546).
 *
 * ### FINDING F2 — the card and the consolidated matrix use different tokens
 *
 * For the same capability the consolidated matrix (L34546) reads
 * `Explicitly prohibited` in the Supervisor-without-grant, Plant Manager,
 * Tenant Admin and Read-only Auditor columns, while this card (L32260) reads
 * `Read-only on published content only` in the first three and
 * `Client Decision Required — DEC-AUDSTU-001` in the fourth.
 *
 * **They agree on the operative answer** — none of those four may author —
 * and they differ on the RENDERING, which is not cosmetic here: `readOnly`
 * draws a disabled control carrying the cell's own words, and
 * `explicitlyProhibited` draws nothing at all. This module's own card governs
 * its own matrix, so the card's tokens are transcribed; the divergence is
 * recorded on every affected cell's `derivation` and in the task report.
 * `AC-STU-157` (L34674) independently forbids reading the Auditor's cell as a
 * refusal, which is the second reason the card wins that one.
 *
 * ### THERE IS NO `routedTo` FIELD ON THIS CARD, AND THAT IS THE ANSWER
 *
 * The surface's routed prohibition renders a refusal DISABLED only where the
 * cell's own words point the reader at another row OF THIS MATRIX that the
 * evaluator says this same persona may act on. `MOD-STU-06` set the
 * convention for a card where no cell does that: the field is not written at
 * all, because a map of eight nulls per row that no fold reads is prose
 * wearing a mechanism's clothes — declared, never consulted, and free to go
 * wrong the day somebody writes a non-null into it.
 *
 * Row 8 is the one cell that looked like a route, and it was one under the
 * reading this build has now retired: its Quality Manager cell names the
 * owner ("the tenant administration area owns it") and the TENANT ADMIN cell
 * one column across is `Allowed`. That is a different person. `AC-CC-012`
 * (L35037) settles what a screen does with a capability another identity
 * holds — "an out-of-scope Area is absent, not greyed" — and `SCR-SA-USR-01`
 * (L14977) says the same of root-only account creation: an explanatory line,
 * "never as a greyed control". So the Quality Manager's cell is an ABSENCE
 * carrying its own words, and row 8 renders as the cross-surface statement
 * `actionBundlePreview` already draws through the `severity-action-bundle-editor`
 * seam. Rows 5 and 6 are categorical in every column.
 *
 * The consuming path is `routedProhibitionApplies` in
 * `@/studio/modules/stu-18/rendering`, and the ten cards that reach it are
 * enumerated by slice 5 gate 17, which fails if this card ever declares the
 * field again without a fold that reads it.
 *
 * ### The two conditions this matrix does NOT carry
 *
 * No cell in these nine rows names a commercial tier or a grant beyond the one
 * that opens its own column, so `requiredTiers` and `requiredGrant` are `null`
 * throughout — WRITTEN on every cell, so "none" and "unanswered" cannot read
 * alike.
 */

export type Stu05RowId =
  | 'open-the-configuration-panel-on-a-draft-screen'
  | 'author-sections-one-through-nine'
  | 'choose-the-input-type'
  | 'set-a-hard-or-soft-proof-gate'
  | 'soften-the-platform-specification-gate'
  | 'define-a-new-severity-level'
  | 'map-a-band-to-a-catalog-level'
  | 'edit-a-tenant-action-bundle'
  | 'add-a-screen-level-qualification-override'

export const STU_05_ROW_IDS = [
  'open-the-configuration-panel-on-a-draft-screen',
  'author-sections-one-through-nine',
  'choose-the-input-type',
  'set-a-hard-or-soft-proof-gate',
  'soften-the-platform-specification-gate',
  'define-a-new-severity-level',
  'map-a-band-to-a-catalog-level',
  'edit-a-tenant-action-bundle',
  'add-a-screen-level-qualification-override',
] as const satisfies readonly Stu05RowId[]

type MissingFromRowIds = Exclude<Stu05RowId, (typeof STU_05_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

/** The card's own row count, L32259-L32267. Nine, and the count is a claim. */
export const STU_05_SOURCE_ROW_COUNT = 9

export interface Stu05MatrixRow extends StudioMatrixRow {
  readonly id: Stu05RowId
  /** Read by `reachByStudioMatrix`'s clause one. */
  readonly surface: StudioMatrixRowSurface
  /** Why a column the card does not head reads the way it does. */
  readonly derivation: Readonly<Record<StudioPersonaColumn, string | null>>
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
): StudioMatrixCell {
  return { outcome, note, openDecision, requiredTiers: null, requiredGrant: null }
}

const ALLOWED = cell('allowed', 'Allowed')
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const READ_ONLY_PUBLISHED = cell(
  'readOnly',
  'Read-only on published content only',
)
const READ_ONLY = cell('readOnly', 'Read-only')
const AUDITOR_OPEN = cell(
  'clientDecisionRequired',
  'Client Decision Required — DEC-AUDSTU-001',
  'DEC-AUDSTU-001',
)
const IMPL_TEAM_AUTHORS = cell(
  'allowedWithConditions',
  'Allowed with conditions — a provisioned, temporary authoring capacity during onboarding; author and submit only, fully audited, revoked at onboarding’s end',
)

const PLANT_MANAGER_MIRRORS =
  'MOD-STU-05’s table (L32257) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers this ' +
  'persona’s Studio access "by a Supervisor role without the authoring grant", so this cell is that ' +
  'column’s cell. Derived Clarification.'

const PLANT_MANAGER_MIRRORS_WITH_DIVERGENCE =
  `${PLANT_MANAGER_MIRRORS} FINDING: the consolidated matrix heads its own Plant Manager column and ` +
  'reads `Explicitly prohibited` on the authoring row (L34546) where this card’s without-grant cell ' +
  'reads `Read-only on published content only` (L32260). Both refuse authoring; they differ on what ' +
  'else the persona may do, and the module’s own card governs its own matrix.'

const IMPL_TEAM_FROM_FUNCTIONS =
  'MOD-STU-05’s table heads no `GRANT-STU-IMPL` column; the card’s own functionality lines name it — ' +
  'FUNC-STU-05-02-A-1 (L32284): "Roles allowed: Quality Manager, Supervisor with the grant, ' +
  'implementation team grant", with every later functionality reading "as above". The consolidated ' +
  'matrix corroborates: "Author all nine configuration sections | … | `GRANT-STU-IMPL` | Allowed with ' +
  'conditions" (L34546). Derived Clarification.'

const IMPL_TEAM_UNIVERSAL_REFUSAL =
  'A universal refusal: this row’s own cell prohibits the Quality Manager, and no column the card ' +
  'omits can hold what the surface’s most capable authoring role does not. No derivation is needed ' +
  'and none is invented.'

const IMPL_TEAM_OUTSIDE_STUDIO =
  'The act is performed in the tenant administration area, not in the Studio. L34520 provisions the ' +
  'implementation team "author and submit only", which is Workflow authoring; nothing in the source ' +
  'gives it tenant administration. Refused, because L34605 is explicit that the Studio permits ' +
  'nothing it has not been told to permit. Derived Clarification, fail-closed.'

interface CardColumns {
  readonly qualityManager: StudioMatrixCell
  readonly grantHolder: StudioMatrixCell
  readonly withoutGrant: StudioMatrixCell
  readonly tenantAdmin: StudioMatrixCell
  readonly auditor: StudioMatrixCell
  readonly worker: StudioMatrixCell
}

function rowOf(
  id: Stu05RowId,
  capability: string,
  sourceRef: string,
  columns: CardColumns,
  derived: {
    readonly implementationTeam: StudioMatrixCell
    readonly implementationNote: string
    readonly plantManagerNote: string
    readonly surface?: StudioMatrixRowSurface
  },
): Stu05MatrixRow {
  return {
    id,
    capability,
    surface: derived.surface ?? 'screen',
    // No row of this card is `Read published Workflow content`; the
    // fail-closed floor's row lives on MOD-STU-18's consolidated matrix.
    isPublishedRead: false,
    // No row of this card occupies an approval stage: the chain that reviews
    // an authored screen is MOD-STU-11's. Writing a stage here would settle
    // separation of duties from the wrong module.
    stage: null,
    sourceRefs: [sourceRef],
    cells: {
      'quality-manager': columns.qualityManager,
      'supervisor-with-authoring-grant': columns.grantHolder,
      'supervisor-without-grant': columns.withoutGrant,
      'plant-manager-persona': columns.withoutGrant,
      'tenant-admin': columns.tenantAdmin,
      'read-only-auditor': columns.auditor,
      worker: columns.worker,
      'implementation-team': derived.implementationTeam,
    },
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': derived.plantManagerNote,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': derived.implementationNote,
    },
  }
}

/** The five authoring rows: 2, 3, 4, 7 and 9, which read identically. */
function authoringRow(
  id: Stu05RowId,
  capability: string,
  sourceRef: string,
  qualityManager: StudioMatrixCell,
  grantHolder: StudioMatrixCell,
  withoutGrant: StudioMatrixCell,
  tenantAdmin: StudioMatrixCell,
): Stu05MatrixRow {
  return rowOf(
    id,
    capability,
    sourceRef,
    {
      qualityManager,
      grantHolder,
      withoutGrant,
      tenantAdmin,
      auditor: AUDITOR_OPEN,
      worker: PROHIBITED,
    },
    {
      implementationTeam: IMPL_TEAM_AUTHORS,
      implementationNote: IMPL_TEAM_FROM_FUNCTIONS,
      plantManagerNote: PLANT_MANAGER_MIRRORS_WITH_DIVERGENCE,
    },
  )
}

export const STU_05_MATRIX = [
  rowOf(
    'open-the-configuration-panel-on-a-draft-screen',
    'Open the configuration panel on a Draft screen',
    'L32259',
    {
      qualityManager: ALLOWED,
      grantHolder: ALLOWED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: AUDITOR_OPEN,
      worker: PROHIBITED,
    },
    {
      implementationTeam: IMPL_TEAM_AUTHORS,
      implementationNote:
        `${IMPL_TEAM_FROM_FUNCTIONS} Opening the panel is the prerequisite of authoring in it, and ` +
        'the consolidated matrix reads "Read drafts and in-review versions | … | `GRANT-STU-IMPL` | ' +
        'Allowed with conditions" (L34544).',
      plantManagerNote: PLANT_MANAGER_MIRRORS,
    },
  ),
  authoringRow(
    'author-sections-one-through-nine',
    'Author Sections 1 through 9',
    'L32260',
    cell('allowed', 'Allowed — full authoring across all nine sections'),
    cell('allowed', 'Allowed — author all nine sections'),
    READ_ONLY_PUBLISHED,
    READ_ONLY_PUBLISHED,
  ),
  authoringRow(
    'choose-the-input-type',
    'Choose the input type',
    'L32261',
    ALLOWED,
    ALLOWED,
    READ_ONLY,
    READ_ONLY,
  ),
  authoringRow(
    'set-a-hard-or-soft-proof-gate',
    'Set a hard or soft proof gate',
    'L32262',
    ALLOWED,
    ALLOWED,
    READ_ONLY,
    READ_ONLY,
  ),
  /**
   * ROW 5. Refused in all six columns the card heads, and in both this file
   * derives. It is the one row whose refusal is a PLATFORM FLOOR rather than
   * a role boundary: L32236, "no author or tenant setting can configure that
   * away". It stays `screen` — a row whose every cell prohibits is still this
   * screen's own disclosure that it offers nothing.
   */
  rowOf(
    'soften-the-platform-specification-gate',
    'Soften the platform specification gate',
    'L32263',
    {
      qualityManager: PROHIBITED,
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    {
      implementationTeam: PROHIBITED,
      implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
      plantManagerNote: PLANT_MANAGER_MIRRORS,
    },
  ),
  rowOf(
    'define-a-new-severity-level',
    'Define a new severity level',
    'L32264',
    {
      qualityManager: PROHIBITED,
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    {
      implementationTeam: PROHIBITED,
      implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
      plantManagerNote: PLANT_MANAGER_MIRRORS,
    },
  ),
  authoringRow(
    'map-a-band-to-a-catalog-level',
    'Map a band to a catalog level',
    'L32265',
    ALLOWED,
    ALLOWED,
    READ_ONLY,
    READ_ONLY,
  ),
  /**
   * ROW 8 — the second inversion on the surface, and a CROSS-SURFACE
   * STATEMENT (R22). The Tenant Admin holds what the Quality Manager does
   * not, and the Quality Manager's cell NAMES THE OWNER rather than leaving a
   * bare prohibition.
   *
   * `another-surface`, for the reason `StudioMatrixRowSurface` gives: the
   * capability IS met, but not on a Studio screen. Classified `screen`, the
   * Tenant Admin's `Allowed` would derive standing on THIS module's route
   * from an act performed in the tenant administration area.
   *
   * The Auditor cell here is `Explicitly prohibited`, NOT the open decision,
   * because `DEC-AUDSTU-001` is about Studio access and this act is outside
   * the Studio entirely. That is the card's own cell (L32266), not a reading.
   */
  rowOf(
    'edit-a-tenant-action-bundle',
    'Edit a tenant action bundle',
    'L32266',
    {
      qualityManager: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the tenant administration area owns it',
      ),
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: cell(
        'allowed',
        'Allowed — in the tenant administration area, above the floor only',
      ),
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    {
      implementationTeam: PROHIBITED,
      implementationNote: IMPL_TEAM_OUTSIDE_STUDIO,
      plantManagerNote: PLANT_MANAGER_MIRRORS,
      surface: 'another-surface',
    },
  ),
  authoringRow(
    'add-a-screen-level-qualification-override',
    'Add a screen-level qualification override',
    'L32267',
    ALLOWED,
    ALLOWED,
    READ_ONLY,
    READ_ONLY,
  ),
] as const satisfies readonly Stu05MatrixRow[]

type MissingFromMatrix = Exclude<Stu05RowId, (typeof STU_05_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const BY_ID = new Map<Stu05RowId, Stu05MatrixRow>(STU_05_MATRIX.map((row) => [row.id, row]))

export function stu05Row(id: Stu05RowId): Stu05MatrixRow {
  const found = BY_ID.get(id)
  if (found === undefined) throw new Error(`MOD-STU-05: no matrix row named "${id}".`)
  return found
}

/* ==================================================================== *
 * `MTX-TEN-02b`'S ROW FOR THIS MODULE, AND THE CONDITION ON IT THAT
 * AGREES WITH THIS CARD AGAINST ITS OWN TOKEN.
 * ==================================================================== */

/**
 * TWO SOURCE TABLES ANSWER "IS THE TENANT ADMIN OFFERED SCREEN AUTHORING"
 * AND THEY DISAGREE. DISCLOSED, NOT RESOLVED.
 *
 * ── THE ROW, AND THE SAME CONDITION `MOD-STU-04`'S ROW CARRIES ───────────
 * Under the header at line 22031, `MTX-TEN-02b`'s row for this module gives
 * the Tenant Admin `Unavailable` under condition `[Y6]` — the SAME condition,
 * on the same table, as `MOD-STU-04`'s row. Its sentence at L22052 is that
 * that persona administers Studio capacities and reads published content and
 * is assigned no authoring capacity, which is what this card's cells do:
 * `Read-only` on the five authoring rows that have a read at all — choosing
 * the input type (line 32261), the proof gate (line 32262), the band-to-level
 * mapping and the qualification override — and prohibition on the panel-open
 * row and on both platform-gate rows. `reachByStudioMatrix` answers `offered`.
 *
 * ── AND THIS CARD ADDS ONE THING `MOD-STU-04`'S DOES NOT ────────────────
 * Row 8, editing a tenant action bundle (line 32266), gives the Tenant Admin
 * `Allowed` — a WRITE, and the strongest token on this persona's column
 * anywhere in the Studio. It is classified `another-surface` because the
 * cell's own words put the act in the tenant administration area, so it
 * contributes nothing to reach under clause one. Recorded here because a
 * reader comparing the row's `Unavailable` against this card should meet that
 * cell rather than discover it: the row and the card disagree about a read,
 * and the card separately grants that persona a write it performs elsewhere.
 *
 * **NOTHING HERE RESOLVES IT.** No `DEC-*` identifier names this cell.
 */
export const STU_05_MODULE_ROW_TENSION = {
  question:
    'Is the Tenant Admin offered the Screen Authoring route? The chapter-22 row says ' +
    '`Unavailable`; the card gives that persona `Read-only` on five of its nine rows.',
  moduleRow: { matrix: 'MTX-TEN-02b', line: 22037, headerLine: 22031 },
  cardRows: { firstLine: 32259, lastLine: 32267, headerLine: 32257 },
  readings: [
    {
      text:
        'Unavailable. The tenant-role-to-module matrix states this persona’s standing on the ' +
        'module in one token, and that token renders as a disabled control with its reason ' +
        'rather than as a route.',
      locator: 'MTX-TEN-02b row for this module · L22037, under the header at L22031',
    },
    {
      text:
        'Offered, read-only. The card gives the Tenant Admin `Read-only` on every authoring row ' +
        'that carries a read, and refuses it the panel-open row and both platform-gate rows — ' +
        'which is the shape the row’s own condition `[Y6]` describes in words.',
      locator: 'MOD-STU-05 §20.2.5 permission matrix · L32261 and L32262, header L32257',
    },
  ],
  statements: [
    { text: '`Unavailable` `[Y6]`', line: 22037, column: 'Tenant Admin', headerLine: 22031 },
    { text: 'Read-only', line: 32261, column: 'Tenant Admin', headerLine: 32257 },
    { text: 'Read-only', line: 32262, column: 'Tenant Admin', headerLine: 32257 },
    {
      text:
        'The Tenant Admin administers Studio capacities and reads published content; no ' +
        'authoring capacity is assigned',
      line: 22052,
      column: null,
      headerLine: null,
    },
  ],
  derivedFrom:
    'The card, through reachByStudioMatrix over the rows classified `screen`. The ' +
    '`another-surface` write at line 32266 is excluded by clause one and contributes nothing.',
  derivedReach: { 'tenant-admin': 'offered' },
  notResolved:
    'Both readings are recorded and neither is adopted. Nothing here rules that a row’s ' +
    'condition may override its token.',
  wouldChange:
    'A client ruling for the row’s token would remove the route and the rail entry for the ' +
    'Tenant Admin, and with it the read of the nine configuration sections on published ' +
    'content. The tenant-action-bundle write would be untouched either way: it is performed in ' +
    'the tenant administration area, not here.',
  decisionRef: null,
  decisionSearch:
    'No `DEC-*` identifier names this cell. `DEC-STUDIO-001` governs this table’s ' +
    'eighteen-module count, not its cells.',
} as const
