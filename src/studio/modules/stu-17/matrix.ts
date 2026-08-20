import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-17`'s own permission matrix — the source's table at **L34374
 * (header) and L34376-L34383 (eight data rows)**, transcribed cell by cell.
 *
 * SEVEN ROWS ARE HERE. THE EIGHTH IS `STU_17_PLATFORM_SIDE`, BELOW.
 * `STU_17_SOURCE_ROW_COUNT` is what keeps the two halves adding up to the
 * source's eight, so the split cannot quietly lose a row.
 *
 * ### ROW 7 IS THE EXTREME CASE ON THIS SURFACE
 *
 * "Manage locale-pack versioning and governance" (L34382) reads
 * `Not applicable` in ALL SIX columns the card heads — the only row on the
 * whole surface where every cell is identical AND every cell is
 * `Not applicable`. Two consequences, and both are the reason it is not a
 * `StudioMatrixRow`:
 *
 * - `StudioCellOutcome` deliberately cannot express `Not applicable`. The
 *   ruling is `MOD-STU-12`'s Job Owner column and `MOD-STU-09`'s row 7: a
 *   PERSONA column with no answer is a blank cell, and a blank cell is a
 *   defect (L10238). The six cells are carried verbatim below as TEXT.
 * - Classified `screen`, it would have to answer the reach question, and the
 *   honest answer is that the question does not arise: the capability is not
 *   met on a Studio screen, and it is not met on a Frontline or Hub screen
 *   either. It sits platform-side, outside every surface this build draws.
 *
 * **NOTHING RENDERS FOR IT.** `MOD-STU-09`'s and `MOD-STU-12`'s cross-surface
 * rows each render a STATEMENT, because their cells name a surface that holds
 * the capability and personas that hold it there. This row names neither: all
 * six cells say the question does not apply. A locale-pack management
 * section, a versioning panel, or even a "managed elsewhere" affordance would
 * invent a surface the source does not describe, so this module draws none of
 * them and `tests/unit/stu-localisation.test.ts` scans `app/` to prove it.
 *
 * ### THE TWO COLUMNS THE CARD DOES NOT HEAD
 *
 * L34374's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker` — six columns.
 * Neither the **Plant Manager persona** nor **`GRANT-STU-IMPL`** appears, and
 * a blank cell reads as "withheld" without anybody writing it down. Each is
 * filled from a named source line, and every fill is written on the row's own
 * `derivation`.
 *
 * - **Plant Manager** mirrors the without-grant cell: `DEC-ROLE-001` (L34522)
 *   delivers that persona's Studio access "by a Supervisor role without the
 *   authoring grant".
 * - **Implementation team** is filled from the CONSOLIDATED matrix, which
 *   states the same capabilities one level up: "Author all nine configuration
 *   sections | … | `GRANT-STU-IMPL` | Allowed with conditions" (L34546) and
 *   "Read drafts and in-review versions | … | Allowed with conditions"
 *   (L34544). Locale variants ARE authored screen content and the coverage
 *   report IS a draft-stage read, so the capacity reaches both — "author and
 *   submit only, fully audited, revoked at onboarding's end" (L34520). Where
 *   the row refuses the Quality Manager it refuses this capacity too, and no
 *   derivation is invented for a universal refusal.
 *
 * ### FINDING F1 — CATALOGUE B NAMES FEWER ROLES THAN THIS CARD DOES
 *
 * `SCR-STU-14`'s "Roles that can open it" column (L48272) names only the
 * "Quality Manager, Supervisor with the authoring grant". Row 8 of THIS card
 * (L34383) gives the Supervisor without the grant and the Tenant Admin
 * `Read-only` on the coverage report, which under the one reach rule offers
 * both the route. **D2 governs**: the chapter-20 module matrices decide every
 * cell, and catalogue B's role column is a coarser restatement. Recorded here
 * rather than smoothed away, because the two answers differ on who may OPEN
 * the screen and only one of them is the cell-level source.
 *
 * ### THE ROUTED PROHIBITION — `routedTo`, per COLUMN, and null everywhere
 *
 * A cell renders DISABLED only where it carries a `routedTo` whose target
 * actually permits this persona; otherwise `Explicitly prohibited` renders as
 * an ABSENCE. No cell on this card names an alternative — rows 4, 5 and 6 are
 * categorical refusals with no route for anybody, and rows 1, 2 and 3 refuse
 * personas for whom the capability exists on this very screen but names them
 * no other way to reach it. So every column of every row routes nowhere, and
 * every refusal on this screen is an absence with the rule stated beside it.
 *
 * ### `requiredTiers` and `requiredGrant` are `null` on every cell
 *
 * No cell in these rows names a commercial tier or a grant beyond the one
 * that opens its own column. WRITTEN on every cell, so "none" and
 * "unanswered" cannot read alike.
 */

export type Stu17RowId =
  | 'declare-a-workflows-locale-coverage'
  | 'author-a-locale-variant'
  | 'request-artificial-intelligence-drafting-of-a-locale-variant'
  | 'publish-into-an-incomplete-locale'
  | 'enable-run-time-machine-translation'
  | 'add-a-locale-beyond-english-and-spanish'
  | 'view-the-coverage-report'

export const STU_17_ROW_IDS = [
  'declare-a-workflows-locale-coverage',
  'author-a-locale-variant',
  'request-artificial-intelligence-drafting-of-a-locale-variant',
  'publish-into-an-incomplete-locale',
  'enable-run-time-machine-translation',
  'add-a-locale-beyond-english-and-spanish',
  'view-the-coverage-report',
] as const satisfies readonly Stu17RowId[]

type MissingFromRowIds = Exclude<Stu17RowId, (typeof STU_17_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

/** The card's own data-row count, L34376-L34383. Eight, and the count is a claim. */
export const STU_17_SOURCE_ROW_COUNT = 8

export interface Stu17MatrixRow extends StudioMatrixRow {
  readonly id: Stu17RowId
  /** Read by `reachByStudioMatrix`'s clause one. */
  readonly surface: StudioMatrixRowSurface
  /** PER COLUMN, never per row. `null` on every one — see the note above. */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu17RowId | null>>
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
const IMPL_TEAM_READS_DRAFTS = cell(
  'allowedWithConditions',
  'Allowed with conditions — the onboarding capacity reads drafts and in-review versions',
)

const PLANT_MANAGER_MIRRORS =
  'MOD-STU-17’s table (L34374) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers ' +
  'this persona’s Studio access "by a Supervisor role without the authoring grant", so this cell ' +
  'is that column’s cell. Derived Clarification.'

const IMPL_TEAM_AUTHORING =
  'MOD-STU-17’s table heads no `GRANT-STU-IMPL` column. The consolidated matrix states the same ' +
  'capability one level up — "Author all nine configuration sections | … | `GRANT-STU-IMPL` | ' +
  'Allowed with conditions" (L34546) — and a locale variant is authored screen content ' +
  '(L34357). L34520 provisions the capacity "author and submit only". Derived Clarification.'

const IMPL_TEAM_READS =
  'MOD-STU-17’s table heads no `GRANT-STU-IMPL` column. The coverage report is a draft-stage ' +
  'read, and the consolidated matrix reads "Read drafts and in-review versions | … | ' +
  '`GRANT-STU-IMPL` | Allowed with conditions" (L34544). Derived Clarification.'

const IMPL_TEAM_UNIVERSAL_REFUSAL =
  'A universal refusal: this row’s own cell prohibits the Quality Manager, and no column the ' +
  'card omits can hold what the surface’s most capable authoring role does not. No derivation ' +
  'is needed and none is invented.'

/** Every column answers `null` — no row of this card routes anybody anywhere. */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, Stu17RowId | null>> = {
  'quality-manager': null,
  'supervisor-with-authoring-grant': null,
  'supervisor-without-grant': null,
  'plant-manager-persona': null,
  'tenant-admin': null,
  'read-only-auditor': null,
  worker: null,
  'implementation-team': null,
}

interface CardColumns {
  readonly qualityManager: StudioMatrixCell
  readonly grantHolder: StudioMatrixCell
  readonly withoutGrant: StudioMatrixCell
  readonly tenantAdmin: StudioMatrixCell
  readonly auditor: StudioMatrixCell
  readonly worker: StudioMatrixCell
}

function rowOf(
  id: Stu17RowId,
  capability: string,
  sourceRef: string,
  columns: CardColumns,
  derived: {
    readonly implementationTeam: StudioMatrixCell
    readonly implementationNote: string
  },
): Stu17MatrixRow {
  return {
    id,
    capability,
    // Every row of this card is about THIS module's own screen, including the
    // three that refuse everyone: a row whose every cell prohibits is still
    // this screen's own disclosure that it offers nothing.
    surface: 'screen',
    // The fail-closed floor's `Read published Workflow content` row lives on
    // MOD-STU-18's consolidated matrix, not here.
    isPublishedRead: false,
    // No row of this card occupies an approval stage. The chain that reviews
    // a drafted locale variant is MOD-STU-11's (FUNC-STU-17-02-A-2, L34406);
    // writing a stage here would settle separation of duties from the wrong
    // module.
    stage: null,
    sourceRefs: [sourceRef],
    routedTo: ROUTES_NOWHERE,
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
      'plant-manager-persona': PLANT_MANAGER_MIRRORS,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': derived.implementationNote,
    },
  }
}

/** Rows 1, 2 and 3, which read identically across all six card columns. */
function authoringRow(id: Stu17RowId, capability: string, sourceRef: string): Stu17MatrixRow {
  return rowOf(
    id,
    capability,
    sourceRef,
    {
      qualityManager: ALLOWED,
      grantHolder: ALLOWED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: IMPL_TEAM_AUTHORS, implementationNote: IMPL_TEAM_AUTHORING },
  )
}

/**
 * Rows 4, 5 and 6 — refused in all six columns the card heads and in both
 * this file derives. Each is a PLATFORM FLOOR rather than a role boundary,
 * and each carries the source's own reason where the source states one.
 */
function universalRefusal(
  id: Stu17RowId,
  capability: string,
  sourceRef: string,
  qualityManagerNote: string,
): Stu17MatrixRow {
  return rowOf(
    id,
    capability,
    sourceRef,
    {
      qualityManager: cell('explicitlyProhibited', qualityManagerNote),
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL },
  )
}

export const STU_17_MATRIX = [
  authoringRow(
    'declare-a-workflows-locale-coverage',
    'Declare a Workflow’s locale coverage',
    'L34376',
  ),
  authoringRow('author-a-locale-variant', 'Author a locale variant', 'L34377'),
  authoringRow(
    'request-artificial-intelligence-drafting-of-a-locale-variant',
    'Request artificial-intelligence drafting of a locale variant',
    'L34378',
  ),
  /**
   * ROW 4. The one row where the refusal is not about capacity at all: it is
   * the completeness check itself, stated as a permission. Nobody publishes
   * into an incomplete locale, and `FUNC-STU-17-03-A-1` (L34409) prohibits
   * "every role from bypassing it".
   */
  universalRefusal(
    'publish-into-an-incomplete-locale',
    'Publish into an incomplete locale',
    'L34379',
    'Explicitly prohibited',
  ),
  universalRefusal(
    'enable-run-time-machine-translation',
    'Enable run-time machine translation',
    'L34380',
    'Explicitly prohibited — nothing is translated at run time, anywhere',
  ),
  universalRefusal(
    'add-a-locale-beyond-english-and-spanish',
    'Add a locale beyond English and Spanish',
    'L34381',
    'Explicitly prohibited — two languages at V1',
  ),
  /**
   * ROW 8 of the source table, the seventh row here. The only row on this
   * card that anybody but an authoring-grant holder reaches — see F1 above
   * for its disagreement with catalogue B.
   */
  rowOf(
    'view-the-coverage-report',
    'View the coverage report',
    'L34383',
    {
      qualityManager: ALLOWED,
      grantHolder: ALLOWED,
      withoutGrant: READ_ONLY,
      tenantAdmin: READ_ONLY,
      auditor: AUDITOR_OPEN,
      worker: PROHIBITED,
    },
    { implementationTeam: IMPL_TEAM_READS_DRAFTS, implementationNote: IMPL_TEAM_READS },
  ),
] as const satisfies readonly Stu17MatrixRow[]

type MissingFromMatrix = Exclude<Stu17RowId, (typeof STU_17_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const BY_ID = new Map<Stu17RowId, Stu17MatrixRow>(STU_17_MATRIX.map((row) => [row.id, row]))

export function stu17Row(id: Stu17RowId): Stu17MatrixRow {
  const found = BY_ID.get(id)
  if (found === undefined) throw new Error(`MOD-STU-17: no matrix row named "${id}".`)
  return found
}

/* ==================================================================== *
 * ROW 7 — PLATFORM-SIDE, AND NOTHING RENDERS FOR IT.
 * ==================================================================== */

export interface Stu17PlatformSideRow {
  readonly id: 'manage-locale-pack-versioning-and-governance'
  readonly capability: string
  /**
   * Deliberately NOT named `surface`: `scripts/build-stu-module-reach.mjs`
   * finds a module's matrix by looking for the one exported array whose every
   * row carries `surface`, and a second such array in this file would make it
   * read neither.
   */
  readonly heldOn: 'platform-side'
  readonly owner: string
  /** The six source cells, verbatim, in the card's own header order. */
  readonly cells: readonly { readonly column: string; readonly text: string }[]
  /**
   * What a Studio screen draws for this row. `'nothing'` is the whole point
   * and is written down rather than left to be inferred from an absent
   * component: every one of the six cells says the question does not apply
   * here, so there is no control, no disabled control, no statement and no
   * seam notice. A build that drew any of them would be describing a
   * management surface the source never places on this platform's tenant
   * surfaces at all.
   */
  readonly renders: 'nothing'
  readonly sourceRefs: readonly string[]
}

export const STU_17_PLATFORM_SIDE = [
  {
    id: 'manage-locale-pack-versioning-and-governance',
    capability: 'Manage locale-pack versioning and governance',
    heldOn: 'platform-side',
    owner:
      'The platform, outside every tenant surface. L34359: "Locale-pack versioning and governance sit platform-side." L34461 repeats it as a dependency of this module rather than as a capability of it.',
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — locale-pack versioning sits platform-side',
      },
      { column: 'Supervisor with grant', text: 'Not applicable — same reason' },
      { column: 'Supervisor without grant', text: 'Not applicable — same reason' },
      { column: 'Tenant Admin', text: 'Not applicable — same reason' },
      { column: 'Read-only Auditor', text: 'Not applicable — same reason' },
      { column: 'Worker', text: 'Not applicable — same reason' },
    ],
    renders: 'nothing',
    sourceRefs: ['L34382', 'L34359', 'L34461'],
  },
] as const satisfies readonly Stu17PlatformSideRow[]
