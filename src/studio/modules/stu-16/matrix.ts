import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-16`'s own permission matrix — the source's table at **L34192
 * (header), L34193 (rule), L34194-L34202 (NINE data rows)**, transcribed
 * cell by cell.
 *
 * ### THREE ROWS DESCRIBE ANOTHER SURFACE, AND NONE OF THEM IS A CONTROL
 *
 * `surface: 'another-surface'` on rows 2, 5 and 6, and the classification is
 * load-bearing rather than decorative. Each of the three carries a
 * PERMISSIVE token in some column — row 2's Quality Manager cell reads
 * `Allowed`, rows 5 and 6 read `Allowed with conditions` for the Tenant
 * Admin — and every one of those tokens names WHERE:
 *
 * - row 2 (L34195): *"Allowed — in the Client Command Center"*;
 * - row 5 (L34198): *"Allowed with conditions — in the tenant administration
 *   area, within platform bounds"*;
 * - row 6 (L34199): *"Allowed with conditions — in the tenant administration
 *   area"*.
 *
 * **An `another-surface` row is never an enabled Studio control, whatever
 * its token reads.** A Studio screen can DESCRIBE the capability and can
 * never OFFER it. The owning-surface line settles row 2 in the source's own
 * words (L34185): *"the Client Command Center owns the Lane-B decision"*,
 * and `SB-STU-19` says it again (L34293): *"the Studio displays, it does not
 * decide."* `MOD-STU-18`'s consolidated matrix reached the same
 * classification for the same row independently.
 *
 * The consequence for reach is deliberate: `reachByStudioMatrix` reads
 * `screen` rows only, so the Tenant Admin's two `Allowed with conditions`
 * cells do not open this route to a Tenant Admin. That agrees with the
 * consolidated matrix (L34556), which prohibits the Tenant Admin from the
 * learning view outright.
 *
 * ### ROW 4 STATES AN ARCHITECTURAL ABSENCE, NOT A PERMISSION
 *
 * L34196's Quality Manager cell reads *"Explicitly prohibited — there is no
 * separate on/off switch"*, and L34177 is the fact behind it: *"Learning is
 * on by default, and the approval queue is the control ... so there is no
 * separate on/off switch"*. `FUNC-STU-16-04-A-2` (L34243) states it as a
 * function: *"Provide no separate on/off switch for learning"*.
 *
 * **Rendering it as a disabled toggle invents the control the source says
 * does not exist.** The row is classified `screen` because it is this
 * screen's own statement about itself, and `Explicitly prohibited` carries
 * no rendering anywhere — so the cell's own words sit where a control would
 * be, and `./rendering.ts` builds no control from it. `AC-STU-141` (L34335)
 * is the acceptance criterion: *"There is no on/off switch for learning
 * anywhere on the platform."*
 *
 * ### ROWS 1 AND 2 ANSWER THE READ-ONLY AUDITOR TWO DIFFERENT WAYS
 *
 * Four columns apart, and getting them the same way round is a defect in
 * either direction:
 *
 * - Row 1 (L34194) — `Client Decision Required — DEC-AUDSTU-001`. The
 *   Auditor's STUDIO access is unsettled, and `AC-STU-157` (L34674) forbids
 *   assuming it either way.
 * - Row 2 (L34195) — `Explicitly prohibited — no Client Command Center
 *   access at all`. This is the ONLY `Explicitly prohibited` on the card
 *   that carries a POSITIVE STATEMENT OF A DIFFERENT SURFACE'S RULE, and
 *   that is what makes it a SETTLED FACT rather than an open decision. The
 *   source states the same thing again in `FUNC-STU-16-03-B-1` (L34234):
 *   *"Roles prohibited: the Read-only Auditor, who has no Client Command
 *   Center access at all"*, and `TEST-STU-138` (L34343) tests it: *"confirm
 *   the Client Command Center is unreachable to that role at all"*.
 *
 * A settled fact about another surface is not `DEC-AUDSTU-001`'s question.
 * `DEC-AUDSTU-001` asks what the Auditor may see IN THE STUDIO; row 2 is
 * answered outside the Studio and is answered.
 *
 * ### THE TWO COLUMNS THE CARD DOES NOT HEAD
 *
 * L34192's header is six columns — `Quality Manager | Supervisor with grant
 * | Supervisor without grant | Tenant Admin | Read-only Auditor | Worker`.
 * The persona vocabulary has eight. Every fill is written on the row's own
 * `derivation`, because a blank cell reads as "withheld" without anybody
 * writing it down (L10238).
 *
 * - **Plant Manager** mirrors the without-grant cell: `DEC-ROLE-001`
 *   (L34522) delivers that persona's Studio access "by a Supervisor role
 *   without the authoring grant".
 * - **Implementation team** — rows 1 and 2 are NOT derived at all. The
 *   CONSOLIDATED matrix states the same two capabilities one level up with
 *   all eight columns headed (L34556, L34557) and gives `GRANT-STU-IMPL`
 *   `Explicitly prohibited` on both. Those two cells are transcribed. The
 *   remaining seven are derived, and every one of them is a universal
 *   refusal: the card refuses the Quality Manager or refuses everyone but a
 *   Tenant Admin acting on another surface, and a temporary "author and
 *   submit only" capacity (L34520) holds nothing the surface's most capable
 *   authoring role does not.
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
 * A route names another ROW OF THIS CARD, and no cell of this card names
 * one: rows 4, 7 and 8 are categorical refusals with no route for anybody;
 * rows 1, 3 and 9 refuse personas the capability exists on this very screen
 * for and name them no other way to reach it; and rows 2, 5 and 6 point at
 * ANOTHER SURFACE, which is not a row of this card and is rendered as a
 * statement and a cross-slice seam rather than as a disabled control.
 *
 * The consuming path is `routedProhibitionApplies` in
 * `@/studio/modules/stu-18/rendering`, and the ten cards that reach it are
 * enumerated by slice 5 gate 17, which fails if this card ever declares the
 * field again without a fold that reads it.
 *
 * ### `requiredTiers` and `requiredGrant` are `null` on every cell
 *
 * No cell of this card names a commercial tier or a grant beyond the one
 * that opens its own column. WRITTEN on every cell, so "none" and
 * "unanswered" cannot read alike.
 */

export type Stu16RowId =
  | 'read-the-learning-view'
  | 'decide-a-lane-b-proposal'
  | 'reverse-a-lane-a-refinement'
  | 'turn-learning-off'
  | 'set-retention-within-allowed-bounds-on-memory'
  | 'set-the-personal-information-policy-on-profile-memory'
  | 'change-the-memory-architecture'
  | 'export-learned-content-outside-the-tenant'
  | 'flag-or-retire-a-low-performing-coaching-asset'

export const STU_16_ROW_IDS = [
  'read-the-learning-view',
  'decide-a-lane-b-proposal',
  'reverse-a-lane-a-refinement',
  'turn-learning-off',
  'set-retention-within-allowed-bounds-on-memory',
  'set-the-personal-information-policy-on-profile-memory',
  'change-the-memory-architecture',
  'export-learned-content-outside-the-tenant',
  'flag-or-retire-a-low-performing-coaching-asset',
] as const satisfies readonly Stu16RowId[]

type MissingFromRowIds = Exclude<Stu16RowId, (typeof STU_16_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

/** The card's own data-row count, L34194-L34202. Nine, and the count is a claim. */
export const STU_16_SOURCE_ROW_COUNT = 9

export interface Stu16MatrixRow extends StudioMatrixRow {
  readonly id: Stu16RowId
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

const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const READ_ONLY = cell('readOnly', 'Read-only')

const PLANT_MANAGER_MIRRORS =
  'MOD-STU-16’s table (L34192) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers ' +
  'this persona’s Studio access "by a Supervisor role without the authoring grant", so this ' +
  'cell is that column’s cell. Derived Clarification.'

const IMPL_TEAM_CONSOLIDATED =
  'NOT derived. MOD-STU-16’s table heads no `GRANT-STU-IMPL` column, but the CONSOLIDATED ' +
  'matrix states this same capability one level up with all eight columns headed, and gives ' +
  'the implementation team `Explicitly prohibited` there. Transcribed, not inferred.'

const IMPL_TEAM_UNIVERSAL_REFUSAL =
  'A universal refusal: this row refuses the Quality Manager on this surface, and no column ' +
  'the card omits can hold what the surface’s most capable authoring role does not. The ' +
  'onboarding capacity is "author and submit only, fully audited, revoked at onboarding’s ' +
  'end" (L34520). No derivation is needed and none is invented.'

interface CardColumns {
  readonly qualityManager: StudioMatrixCell
  readonly grantHolder: StudioMatrixCell
  readonly withoutGrant: StudioMatrixCell
  readonly tenantAdmin: StudioMatrixCell
  readonly auditor: StudioMatrixCell
  readonly worker: StudioMatrixCell
}

function rowOf(
  id: Stu16RowId,
  capability: string,
  sourceRef: string,
  surface: StudioMatrixRowSurface,
  columns: CardColumns,
  derived: {
    readonly implementationTeam: StudioMatrixCell
    readonly implementationNote: string
  },
): Stu16MatrixRow {
  return {
    id,
    capability,
    surface,
    // The fail-closed floor's `Read published Workflow content` row lives on
    // MOD-STU-18's consolidated matrix, not here.
    isPublishedRead: false,
    // No row of this card occupies an approval stage. A Lane-B patch is
    // published by the machinery that follows the ONE human decision
    // (L34171), and the three-stage chain it does or does not pass through
    // is DEC-LANEB-001 — writing a stage here would settle that from the
    // wrong module.
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
      'plant-manager-persona': PLANT_MANAGER_MIRRORS,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': derived.implementationNote,
    },
  }
}

/**
 * A row refused in all six columns the card heads. `qualityManagerNote`
 * carries the source's own reason where the source states one — row 4's does,
 * and it is the whole substance of the row.
 */
function universalRefusal(
  id: Stu16RowId,
  capability: string,
  sourceRef: string,
  qualityManagerNote: string,
): Stu16MatrixRow {
  return rowOf(
    id,
    capability,
    sourceRef,
    'screen',
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

/** Rows 5 and 6 — refused from the Studio, held by the Tenant Admin elsewhere. */
function tenantAdministrationRow(
  id: Stu16RowId,
  capability: string,
  sourceRef: string,
  tenantAdminNote: string,
): Stu16MatrixRow {
  return rowOf(
    id,
    capability,
    sourceRef,
    // The cell says where: "in the tenant administration area". Not this
    // screen, and therefore not a control on it at any token.
    'another-surface',
    {
      qualityManager: cell('explicitlyProhibited', 'Explicitly prohibited from the Studio'),
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: cell('allowedWithConditions', tenantAdminNote),
      auditor: READ_ONLY,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL },
  )
}

export const STU_16_MATRIX = [
  rowOf(
    'read-the-learning-view',
    'Read the learning view',
    'L34194',
    'screen',
    {
      qualityManager: cell('allowed', 'Allowed — learning read view'),
      grantHolder: cell('allowed', 'Allowed — the Quality Engineer read view'),
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: cell(
        'clientDecisionRequired',
        'Client Decision Required — DEC-AUDSTU-001',
        'DEC-AUDSTU-001',
      ),
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: `${IMPL_TEAM_CONSOLIDATED} L34556.` },
  ),
  /**
   * ROW 2. The Studio displays, it does not decide (L34293). Classified
   * `another-surface` on the strength of its own Quality Manager cell,
   * which names the Client Command Center inside the token.
   */
  rowOf(
    'decide-a-lane-b-proposal',
    'Decide a Lane-B proposal',
    'L34195',
    'another-surface',
    {
      qualityManager: cell('allowed', 'Allowed — in the Client Command Center'),
      grantHolder: cell(
        'clientDecisionRequired',
        'Client Decision Required — DEC-LANEBAUTH-001',
        'DEC-LANEBAUTH-001',
      ),
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      // A SETTLED FACT about another surface, not an open decision. See the
      // file note: this is the only `Explicitly prohibited` on the card that
      // states a different surface's rule positively.
      auditor: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — no Client Command Center access at all',
      ),
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: `${IMPL_TEAM_CONSOLIDATED} L34557.` },
  ),
  rowOf(
    'reverse-a-lane-a-refinement',
    'Reverse a Lane-A refinement',
    'L34196',
    'screen',
    {
      qualityManager: cell('allowed', 'Allowed — Lane A is reversible'),
      grantHolder: cell(
        'allowedWithConditions',
        'Allowed with conditions — where they hold the learning read view',
      ),
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL },
  ),
  /**
   * ROW 4. An ARCHITECTURAL ABSENCE stated as a permission, and the one row
   * on this card whose cell text is the point of the row. Nothing is drawn
   * for it but the cell's own words — see the file note.
   */
  universalRefusal(
    'turn-learning-off',
    'Turn learning off',
    'L34197',
    'Explicitly prohibited — there is no separate on/off switch',
  ),
  tenantAdministrationRow(
    'set-retention-within-allowed-bounds-on-memory',
    'Set retention within allowed bounds on memory',
    'L34198',
    'Allowed with conditions — in the tenant administration area, within platform bounds',
  ),
  tenantAdministrationRow(
    'set-the-personal-information-policy-on-profile-memory',
    'Set the personal-information policy on profile memory',
    'L34199',
    'Allowed with conditions — in the tenant administration area',
  ),
  universalRefusal(
    'change-the-memory-architecture',
    'Change the memory architecture',
    'L34200',
    'Explicitly prohibited',
  ),
  universalRefusal(
    'export-learned-content-outside-the-tenant',
    'Export learned content outside the tenant',
    'L34201',
    'Explicitly prohibited',
  ),
  rowOf(
    'flag-or-retire-a-low-performing-coaching-asset',
    'Flag or retire a low-performing coaching asset',
    'L34202',
    'screen',
    {
      qualityManager: cell('allowed', 'Allowed'),
      grantHolder: cell('explicitlyProhibited', 'Explicitly prohibited — may propose'),
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL },
  ),
] as const satisfies readonly Stu16MatrixRow[]

type MissingFromMatrix = Exclude<Stu16RowId, (typeof STU_16_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const BY_ID = new Map<Stu16RowId, Stu16MatrixRow>(STU_16_MATRIX.map((row) => [row.id, row]))

export function stu16Row(id: Stu16RowId): Stu16MatrixRow {
  const found = BY_ID.get(id)
  if (found === undefined) throw new Error(`MOD-STU-16: no matrix row named "${id}".`)
  return found
}

/**
 * The three rows this card places on a surface the Studio does not own.
 * Derived from `surface`, never re-listed beside it: a second hand-written
 * list of the same three is how the table and its consumers drift apart.
 */
export const STU_16_OTHER_SURFACE_ROW_IDS: readonly Stu16RowId[] = STU_16_MATRIX.filter(
  (row) => row.surface === 'another-surface',
).map((row) => row.id)
