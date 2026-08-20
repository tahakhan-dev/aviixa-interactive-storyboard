import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'
import type { StudioSeamId } from '@/studio/seams'

/**
 * `MOD-STU-13`'s own permission matrix — the source's table at **L33633
 * (header), L33634 (separator) and L33635–L33645, ELEVEN data rows**,
 * transcribed cell by cell.
 *
 * ### THE SPLIT: nine rows here, two beside
 *
 * Rows 4 and 7 are not in the persona matrix. Both carry `Not applicable`
 * cells, and `StudioCellOutcome` deliberately cannot express `Not applicable`
 * — a persona column with no answer is a blank cell, and a blank cell is a
 * defect (L10238). They are carried verbatim in `STU_13_CROSS_SURFACE`, the
 * same treatment `MOD-STU-10` gives its row 4 and `MOD-STU-12` its row 6, and
 * `STU_13_MATRIX_AND_CROSS_SURFACE_ROWS` keeps the two halves adding to
 * eleven.
 *
 * Rows 5 and 6 ARE here, classified **`another-surface`** — the treatment
 * `MOD-STU-05` gives its own row 8, and for the identical reason. Their cells
 * are all expressible, but the capability is met in the tenant administration
 * area, not on a Studio screen. Classified `screen`, the Tenant Admin's
 * `Allowed` would derive standing on THIS module's route from an act
 * performed somewhere else entirely.
 *
 * ### ROW 9 AND ITS QUALIFIER — the one thing this card does that no other
 * ### Studio card does
 *
 * L33643 prefixes the token with a SURFACE on four separate cells:
 * `Explicitly prohibited from the Studio`. The qualifier is load-bearing and
 * is transcribed on all four, because the same act **is permitted for a
 * Supervisor in the Delivery Operations Hub** — slice 4 built it, and
 * rendering row 9 as a flat prohibition would contradict a surface that is
 * already testable. The Read-only Auditor's cell and the Worker's cell do NOT
 * carry the qualifier: they read a bare `Explicitly prohibited`, which is a
 * prohibition everywhere and not only here. Inventing the qualifier on those
 * two would be the same defect in the opposite direction.
 *
 * ### THE THREE INVERSIONS — rows 4, 5 and 6
 *
 * The Tenant Admin holds three things the Quality Manager does not. Row 4's
 * and row 5's Quality Manager cells NAME THE OWNER; **row 6's does not** —
 * L33640 reads a bare `Explicitly prohibited` in that column, and the design
 * fact (`uniform at tenant level, deliberately not per user`) sits inside the
 * TENANT ADMIN cell instead. That asymmetry is the source's, and it is why
 * only row 5 carries a `routedTo`.
 *
 * ### THE ROUTED PROHIBITION — `routedTo`, per COLUMN
 *
 * Task 11's mechanism, surface-wide: a prohibited cell renders DISABLED only
 * where it carries a `routedTo` whose target ACTUALLY PERMITS this persona,
 * and ABSENT otherwise, because `Explicitly prohibited` carries no rendering
 * anywhere. Exactly one cell on this card routes: row 5's Quality Manager
 * cell, whose own words name the owner and whose Tenant Admin column one
 * across is `Allowed`.
 *
 * Nothing else routes, and that is an answer rather than an omission:
 *
 * - Rows 1, 2 and 3 refuse the same act to the same five columns and this
 *   card offers no lower-authority version of it — there is no "propose"
 *   sibling here as there is in `MOD-STU-07`.
 * - Row 10's `Read-only` cells are the only other thing those columns hold,
 *   and `Read-only` is not an ACTION: a pointer at it resolves to nothing to
 *   click and collapses back to ABSENT. Writing the pointer anyway would be
 *   ceremony that reads like a finding.
 * - Row 6 is the near miss and is deliberately left unrouted: see above.
 *
 * ### THE TWO COLUMNS THIS CARD DOES NOT HEAD
 *
 * L33633's header is six columns wide — `Quality Manager | Supervisor with
 * grant | Supervisor without grant | Tenant Admin | Read-only Auditor |
 * Worker`. The vocabulary has eight.
 *
 * - `plant-manager-persona` is `DEC-ROLE-001` (L34522): the persona's Studio
 *   access "is delivered by a Supervisor role without the authoring grant",
 *   so its cell is the `supervisor-without-grant` cell with the substitution
 *   named in its own note rather than silently aliased.
 * - `implementation-team` is filled from the CONSOLIDATED matrix row that
 *   states the same capability, and the row it came from is named in every
 *   note (`IMPL_SOURCE`). Where the consolidated matrix states no such row —
 *   row 8 — the narrower reading is taken and the absence is stated, never a
 *   permission invented.
 *
 * ### `requiredTiers`, `requiredGrant` and `stage` are `null` throughout
 *
 * No cell names a commercial tier or a grant beyond the one that opens its
 * column, and no capability here occupies an approval stage: stating a
 * qualification requirement is authoring work that happens before a
 * submission exists. Written on every cell rather than left off, because a
 * cell that omits them and a cell that states "none" read identically.
 */

/** The source table's own data-row count, L33635–L33645. */
export const STU_13_SOURCE_ROW_COUNT = 11

export type Stu13RowId =
  | 'state-the-workflow-qualification-baseline'
  | 'add-a-screen-level-override'
  | 'edit-over-a-tag-driven-pre-population'
  | 'set-hard-block-versus-notify-posture'
  | 'set-clearance-duration'
  | 'confirm-continuation-of-a-grandfathered-assignment'
  | 'enter-or-amend-a-worker-certification-record'
  | 'view-the-cross-workflow-requirement-view'
  | 'make-the-qualification-gate-looser-than-the-platform-floor'

export const STU_13_ROW_IDS = [
  'state-the-workflow-qualification-baseline',
  'add-a-screen-level-override',
  'edit-over-a-tag-driven-pre-population',
  'set-hard-block-versus-notify-posture',
  'set-clearance-duration',
  'confirm-continuation-of-a-grandfathered-assignment',
  'enter-or-amend-a-worker-certification-record',
  'view-the-cross-workflow-requirement-view',
  'make-the-qualification-gate-looser-than-the-platform-floor',
] as const satisfies readonly Stu13RowId[]

type MissingFromRowIds = Exclude<Stu13RowId, (typeof STU_13_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

export interface Stu13MatrixRow extends StudioMatrixRow {
  readonly id: Stu13RowId
  /** Read by `reachByStudioMatrix`'s clause one. */
  readonly surface: StudioMatrixRowSurface
  /**
   * PER COLUMN, never per row. Where a prohibited cell's own words name an
   * alternative, this is the row that holds it. `null` is the answer for a
   * categorical prohibition and it is written on every column.
   */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu13RowId | null>>
  /** Why a column this card does not head reads the way it does. */
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
  'Client Decision Required — `DEC-AUDSTU-001`',
  'DEC-AUDSTU-001',
)

/**
 * The consolidated-matrix row each `implementation-team` cell was read from.
 * Written down rather than inferred, because "the implementation team's cell
 * came from somewhere" and "somebody guessed it" read identically otherwise.
 */
const IMPL_SOURCE = {
  manageQualifications:
    'L34549, “Manage Qualification Requirements” — Allowed with conditions',
  readPublished: 'L34542, “Read published Workflow content” — Allowed with conditions',
  widenTheFloor:
    'L34562, “Widen any of the above beyond the separation-of-duties floor” — Explicitly prohibited',
  grantAdministration:
    'L34558, “Assign or revoke `GRANT-STU-AUTHOR` and `GRANT-STU-AGENT`” — Explicitly prohibited: the nearest consolidated statement of a tenant administration act',
} as const

const IMPL_MANAGE = cell(
  'allowedWithConditions',
  `Allowed with conditions — onboarding only. This card (L33633) heads no implementation-team column; filled from the consolidated matrix (${IMPL_SOURCE.manageQualifications})`,
)
const IMPL_READ = cell(
  'allowedWithConditions',
  `Allowed with conditions — onboarding only. This card (L33633) heads no implementation-team column; filled from the consolidated matrix (${IMPL_SOURCE.readPublished})`,
)

const IMPL_NOTE_MANAGE = `Filled from the consolidated matrix — ${IMPL_SOURCE.manageQualifications}.`
const IMPL_NOTE_READ = `Filled from the consolidated matrix — ${IMPL_SOURCE.readPublished}.`
const IMPL_NOTE_FLOOR = `Filled from the consolidated matrix — ${IMPL_SOURCE.widenTheFloor}.`
const IMPL_NOTE_TENANT_ADMIN =
  'The act is performed in the tenant administration area, not in the Studio. L34520 provisions ' +
  'the implementation team “author and submit only”, which is Workflow authoring; nothing in the ' +
  `source gives it tenant administration (${IMPL_SOURCE.grantAdministration}). Refused, because ` +
  'L34605 is explicit that the Studio permits nothing it has not been told to permit. Derived ' +
  'Clarification, fail-closed.'
const IMPL_NOTE_NO_ROW =
  'The consolidated matrix (L34541-L34563) states NO row for this capability, so the narrower ' +
  'reading is taken and the absence is stated rather than a permission invented. This card’s own ' +
  'function line (FUNC-STU-13-04-A-1, L33679) names only the supervisor.'
const IMPL_NOTE_ROW_RULE =
  'This row refuses every column the card heads, so the eighth follows from the row’s own rule ' +
  'rather than from a cell nobody wrote.'

const PLANT_MANAGER_NOTE =
  'this module’s own table (L33633) heads no Plant Manager column; DEC-ROLE-001 (L34522) delivers ' +
  'this persona’s Studio access through a Supervisor role without the authoring grant, and the ' +
  'consolidated matrix reads the two columns identically on every row.'

/** Every column answers `null` — the row routes nobody anywhere. */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, Stu13RowId | null>> = {
  'quality-manager': null,
  'supervisor-with-authoring-grant': null,
  'supervisor-without-grant': null,
  'plant-manager-persona': null,
  'tenant-admin': null,
  'read-only-auditor': null,
  worker: null,
  'implementation-team': null,
}

/**
 * Row 5's one routed cell. The Quality Manager's prohibition names the owner
 * — "the posture is a tenant setting" — and the owner is the Tenant Admin
 * cell of this same row, so the route points at the row itself and the
 * rendering rule checks that the target column actually permits it before
 * drawing anything.
 */
const ROUTES_QUALITY_MANAGER_TO_THE_TENANT_ADMIN: Readonly<
  Record<StudioPersonaColumn, Stu13RowId | null>
> = { ...ROUTES_NOWHERE, 'quality-manager': 'set-hard-block-versus-notify-posture' }

/** The six columns this card heads, in its own header order (L33635). */
interface CardColumns {
  readonly qualityManager: StudioMatrixCell
  readonly grantHolder: StudioMatrixCell
  readonly withoutGrant: StudioMatrixCell
  readonly tenantAdmin: StudioMatrixCell
  readonly auditor: StudioMatrixCell
  readonly worker: StudioMatrixCell
}

interface DerivedColumns {
  readonly implementationTeam: StudioMatrixCell
  readonly implementationNote: string
}

function rowOf(
  id: Stu13RowId,
  capability: string,
  sourceRefs: readonly string[],
  card: CardColumns,
  derived: DerivedColumns,
  surface: StudioMatrixRowSurface = 'screen',
  routedTo: Readonly<
    Record<StudioPersonaColumn, Stu13RowId | null>
  > = ROUTES_NOWHERE,
): Stu13MatrixRow {
  const plantManager: StudioMatrixCell = {
    ...card.withoutGrant,
    note: `${card.withoutGrant.note} — ${PLANT_MANAGER_NOTE}`,
  }
  return {
    id,
    capability,
    surface,
    isPublishedRead: false,
    stage: null,
    sourceRefs,
    routedTo,
    cells: {
      'quality-manager': card.qualityManager,
      'supervisor-with-authoring-grant': card.grantHolder,
      'supervisor-without-grant': card.withoutGrant,
      'plant-manager-persona': plantManager,
      'tenant-admin': card.tenantAdmin,
      'read-only-auditor': card.auditor,
      worker: card.worker,
      'implementation-team': derived.implementationTeam,
    },
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': PLANT_MANAGER_NOTE,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': derived.implementationNote,
    },
  }
}

/**
 * Rows 1, 2, 3, 5, 6, 8, 9, 10 and 11 of L33635–L33645, in source order.
 * Rows 4 and 7 are below, beside the matrix.
 */
export const STU_13_MATRIX = [
  rowOf(
    'state-the-workflow-qualification-baseline',
    'State the Workflow qualification baseline',
    ['L33635', 'FUNC-STU-13-01-A-1 L33661', 'AC-STU-113 L33764'],
    {
      qualityManager: cell('allowed', 'Allowed — manages Qualification Requirements'),
      grantHolder: ALLOWED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: IMPL_MANAGE, implementationNote: IMPL_NOTE_MANAGE },
  ),
  rowOf(
    'add-a-screen-level-override',
    'Add a screen-level override',
    ['L33636', 'FUNC-STU-13-01-B-1 L33664'],
    {
      qualityManager: ALLOWED,
      grantHolder: ALLOWED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: IMPL_MANAGE, implementationNote: IMPL_NOTE_MANAGE },
  ),
  rowOf(
    'edit-over-a-tag-driven-pre-population',
    'Edit over a tag-driven pre-population',
    ['L33637', 'L33612', 'FUNC-STU-13-01-A-2 L33662', 'AC-STU-113 L33764'],
    {
      qualityManager: ALLOWED,
      grantHolder: ALLOWED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: IMPL_MANAGE, implementationNote: IMPL_NOTE_MANAGE },
  ),
  /**
   * ROW 5 — the fourth inversion, and this card's ONE routed cell. The
   * Quality Manager's prohibition names the owner; the Tenant Admin's cell
   * one column across is `Allowed`. `another-surface`, because the capability
   * IS met — in the tenant administration area, never on a Studio screen.
   *
   * The Auditor cell is `Read-only`, not `DEC-AUDSTU-001`: that decision is
   * about STUDIO access and this act is outside the Studio entirely. The
   * card's own cell (L33639), not a reading.
   */
  rowOf(
    'set-hard-block-versus-notify-posture',
    'Set hard-block versus notify posture',
    ['L33639', 'L33616', 'FUNC-STU-13-03-A-1 L33674', 'AC-STU-115 L33766'],
    {
      qualityManager: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the posture is a tenant setting',
      ),
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: cell('allowed', 'Allowed — in the tenant administration area'),
      auditor: READ_ONLY,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_NOTE_TENANT_ADMIN },
    'another-surface',
    ROUTES_QUALITY_MANAGER_TO_THE_TENANT_ADMIN,
  ),
  /**
   * ROW 6 — the fifth inversion, and the near miss. Its Quality Manager cell
   * is a BARE `Explicitly prohibited` (L33640): it names nobody, so it routes
   * nowhere and renders ABSENT. The design fact the brief attaches to this
   * row — `uniform at tenant level, deliberately not per user` — lives inside
   * the TENANT ADMIN cell, and is carried there verbatim.
   */
  rowOf(
    'set-clearance-duration',
    'Set clearance duration',
    ['L33640', 'L33616', 'FUNC-STU-13-03-A-1 L33674'],
    {
      qualityManager: PROHIBITED,
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: cell(
        'allowed',
        'Allowed — uniform at tenant level, deliberately not per user',
      ),
      auditor: READ_ONLY,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_NOTE_TENANT_ADMIN },
    'another-surface',
  ),
  /**
   * ROW 8 — the one row on this card where the Supervisor WITHOUT the
   * authoring grant acts. Confirming continuation is not authoring: it is the
   * supervisory decision `FUNC-STU-13-04-A-1` (L33679) requires, and no cell
   * of this row names another surface, where four of its neighbours do. That
   * absence is the card's own signal, and it is why this row is `screen`.
   */
  rowOf(
    'confirm-continuation-of-a-grandfathered-assignment',
    'Confirm continuation of a grandfathered assignment',
    ['L33642', 'L33618', 'FUNC-STU-13-04-A-1 L33679', 'AC-STU-116 L33767'],
    {
      qualityManager: ALLOWED,
      grantHolder: cell('allowed', 'Allowed — the supervisor confirms with a recorded reason'),
      withoutGrant: cell('allowed', 'Allowed — same'),
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_NOTE_NO_ROW },
  ),
  /**
   * ROW 9 — the only row on this card whose token is prefixed with a SURFACE
   * qualifier, and it is prefixed on FOUR separate cells. The qualifier is
   * load-bearing: the same act is permitted for a Supervisor in the Delivery
   * Operations Hub, which slice 4 has already built. Rendering this as a flat
   * prohibition would contradict a live surface.
   *
   * The Auditor's and the Worker's cells are bare `Explicitly prohibited` in
   * the source and stay bare here.
   */
  rowOf(
    'enter-or-amend-a-worker-certification-record',
    'Enter or amend a worker’s certification record',
    ['L33643', 'AC-STU-119 L33770', 'L33756', 'TEST-STU-119 L33776'],
    {
      qualityManager: cell(
        'explicitlyProhibited',
        'Explicitly prohibited from the Studio — certifications are Delivery Operations Hub master data, supervisor-entered, no self-attestation',
      ),
      grantHolder: cell('explicitlyProhibited', 'Explicitly prohibited from the Studio'),
      withoutGrant: cell('explicitlyProhibited', 'Explicitly prohibited from the Studio'),
      tenantAdmin: cell('explicitlyProhibited', 'Explicitly prohibited from the Studio'),
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_NOTE_ROW_RULE },
  ),
  rowOf(
    'view-the-cross-workflow-requirement-view',
    'View the cross-Workflow requirement view',
    ['L33644', 'FUNC-STU-13-05-A-1 L33682', 'DEC-AUDSTU-001 L34524'],
    {
      qualityManager: ALLOWED,
      grantHolder: ALLOWED,
      withoutGrant: READ_ONLY,
      tenantAdmin: READ_ONLY,
      auditor: AUDITOR_OPEN,
      worker: PROHIBITED,
    },
    { implementationTeam: IMPL_READ, implementationNote: IMPL_NOTE_READ },
  ),
  /**
   * ROW 11 — refused in every column the card heads. L33756: "The gate cannot
   * be configured looser than the platform floor; a looser value is rejected
   * rather than logged." There is no control for it anywhere and no
   * application programming interface route behind one.
   */
  rowOf(
    'make-the-qualification-gate-looser-than-the-platform-floor',
    'Make the qualification gate looser than the platform floor',
    ['L33645', 'L33756', 'AC-STU-115 L33766'],
    {
      qualityManager: PROHIBITED,
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_NOTE_FLOOR },
  ),
] as const satisfies readonly Stu13MatrixRow[]

type MissingFromMatrix = Exclude<Stu13RowId, (typeof STU_13_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function stu13Row(id: Stu13RowId): Stu13MatrixRow {
  const found = STU_13_MATRIX.find((row) => row.id === id)
  if (found === undefined) {
    throw new Error(`MOD-STU-13: no matrix row is transcribed for "${id}".`)
  }
  return found
}

/* ==================================================================== *
 * ROWS 4 AND 7 — cross-surface statements, never Studio controls (R22).
 * ==================================================================== */

export interface Stu13CrossSurfaceRow {
  readonly id:
    | 'maintain-the-tag-to-qualification-set-mapping'
    | 'grant-a-qualification-clearance'
  readonly capability: string
  /**
   * The surface that actually holds the control. Deliberately NOT named
   * `surface`: `scripts/build-stu-module-reach.mjs` finds a module's matrix
   * by looking for the one exported array whose every row carries `surface`,
   * and a second such array in this file would make it read neither.
   */
  readonly heldOn: 'SURF-DOH' | 'SURF-CC'
  readonly owner: string
  /** The declared seam the Studio reads the far side through. */
  readonly seamId: StudioSeamId
  /** The six source cells, verbatim, in the card's own header order. */
  readonly cells: readonly { readonly column: string; readonly text: string }[]
  /** The one sentence a Studio screen renders in place of a control. */
  readonly statement: string
  readonly sourceRefs: readonly string[]
}

export const STU_13_CROSS_SURFACE = [
  {
    id: 'maintain-the-tag-to-qualification-set-mapping',
    capability: 'Maintain the tag-to-qualification-set mapping',
    heldOn: 'SURF-DOH',
    owner:
      'Stated only as “tenant administration area master data”. No module owns it in any card read — an UNREGISTERED dependency, registered as such rather than assigned to the nearest slice',
    seamId: 'tag-to-qualification-set-mapping',
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — the mapping is tenant administration area master data',
      },
      { column: 'Supervisor with grant', text: 'Not applicable — same reason' },
      { column: 'Supervisor without grant', text: 'Not applicable — same reason' },
      { column: 'Tenant Admin', text: 'Allowed — in the tenant administration area' },
      { column: 'Read-only Auditor', text: 'Read-only' },
      { column: 'Worker', text: 'Explicitly prohibited' },
    ],
    statement:
      'The mapping is maintained in the tenant administration area, never here. The Studio READS ' +
      'it, and only to pre-populate: the tag never decides the requirement (L33612). Where the ' +
      'mapping cannot be read the author states the baseline manually and publication is NOT ' +
      'blocked, because the mapping is a convenience rather than a requirement (L33662) — the one ' +
      'unreadable seam on this surface that does not block.',
    sourceRefs: ['L33638', 'L33612', 'FUNC-STU-13-01-A-2 L33662'],
  },
  {
    id: 'grant-a-qualification-clearance',
    capability: 'Grant a qualification clearance',
    heldOn: 'SURF-CC',
    owner: 'MOD-CC-13, the Client Command Center — action number ten',
    seamId: 'qualification-clearance-action-ten',
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — clearance is Client Command Center action ten',
      },
      {
        column: 'Supervisor with grant',
        text: 'Allowed — Supervisor and above, in the Client Command Center',
      },
      { column: 'Supervisor without grant', text: 'Allowed — same' },
      { column: 'Tenant Admin', text: 'Explicitly prohibited' },
      { column: 'Read-only Auditor', text: 'Explicitly prohibited' },
      { column: 'Worker', text: 'Explicitly prohibited' },
    ],
    statement:
      'A clearance is granted in the Client Command Center as action number ten, under the ' +
      '“Supervisor and above” reading of DEC-PLUS-001, and the Studio grants none — nor may any ' +
      'agent (FUNC-STU-13-03-B-1, L33676). This is the same division slice 4 built: the Delivery ' +
      'Operations Hub renders the clearance register read-only and grants nothing, and the Studio ' +
      'renders the requirement and grants nothing. No view shows a clearance as effective before ' +
      'its command reaches applied on the device (AC-STU-118, L33769).',
    sourceRefs: ['L33641', 'FUNC-STU-13-03-B-1 L33676', 'AC-STU-118 L33769'],
  },
] as const satisfies readonly Stu13CrossSurfaceRow[]

/**
 * The two halves add up to the source's eleven rows. Asserted rather than
 * assumed, because moving a row into the cross-surface register is exactly
 * how a matrix quietly loses one.
 */
export const STU_13_MATRIX_AND_CROSS_SURFACE_ROWS =
  STU_13_MATRIX.length + STU_13_CROSS_SURFACE.length
