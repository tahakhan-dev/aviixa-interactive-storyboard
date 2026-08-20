import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-04`'s own permission matrix — the source's table at **L32059
 * (header) and L32060-L32070 (ten data rows)**, transcribed cell by cell.
 *
 * TWO THINGS READ THIS FILE, exactly as they read `MOD-STU-07`'s:
 * `scripts/build-stu-module-reach.mjs` derives which personas are offered
 * this module's route from the rows classified `screen`, and
 * `evaluateStudioAccess` answers the per-control affordance question one row
 * at a time. There is no module-level role list anywhere in this module.
 *
 * ### ROWS 1 AND 2 ARE THE LOAD-BEARING PAIR
 *
 * Row 1 — *Open the canvas for a Draft Workflow* — reads
 * `Explicitly prohibited` for the Supervisor without the grant and for the
 * Tenant Admin. Row 2 — *Open the canvas read-only for a Published version*
 * — reads `Read-only` for both. **These are two reads, not one read with a
 * flag.** A build that renders one canvas component with a `readOnly` prop
 * satisfies row 2 and breaks row 1, because the draft is then loaded before
 * anything decides whether it may be. `AC-STU-048` (L32013) and
 * `AC-STU-151` (L34668) both say *invisible*, which is a statement about the
 * READ. `rendering.ts` holds the two reads and the register access is what
 * the covering test counts.
 *
 * ### ROW 6 IS THE PROHIBITION THE MODULE IS SHAPED AROUND
 *
 * *Set a workflow-level default severity* is `Explicitly prohibited` in all
 * EIGHT columns — the Quality Manager's cell carries the reason in the
 * source's own words, "severity is never a workflow default". Its
 * `routedTo` is `null` everywhere, so it renders as an ABSENCE with a note
 * where a control would be. There is no severity write in `writes.ts` and no
 * control in `rendering.ts`: `AC-STU-055` closes the application programming
 * interface route as well as the control, and a disabled control would imply
 * a condition that could one day become true.
 *
 * ### THE ROUTED PROHIBITION — `routedTo`, per COLUMN
 *
 * Task 11's mechanism, adopted surface-wide. `routedTo[column]` names the
 * capability in THIS matrix that this persona holds instead, or `null`.
 *
 * Row 1 is the only row that routes anywhere: the Supervisor without the
 * grant, the Plant Manager persona and the Tenant Admin are prohibited on
 * the DRAFT canvas and `Read-only` on the PUBLISHED one, so row 2 is
 * genuinely what they hold instead. **And the pointer is CHECKED, not
 * asserted:** `builderAffordance` renders a disabled control only where the
 * routed capability's own decision actually PERMITS ACTING, and `readOnly`
 * does not. So row 1 collapses back to ABSENT for all three — which is the
 * correct rendering, because opening a draft canvas is a capability those
 * personas never hold, and the published canvas they DO hold is the screen's
 * content rather than a button. The pointer still earns its place: it is
 * what makes that collapse a derivation from data rather than an author's
 * judgement, and the covering test drives both sides of the branch.
 *
 * Every other row routes nowhere. Rows 3, 4, 5, 7, 8 and 9 refuse those same
 * personas with no alternative anywhere on this screen; row 6 refuses
 * everybody. The per-screen severity mapping that replaces row 6 belongs to
 * `MOD-STU-05`'s matrix, and a pointer into another module's matrix is not
 * what this field expresses.
 *
 * ### THE COLUMN THE CARD DOES NOT HEAD
 *
 * L32059's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker | Implementation
 * team grant` — SEVEN columns. The **Plant Manager persona** is absent from
 * this card entirely and is filled from a named source line on every row,
 * written down on `derivation` rather than left to inference.
 *
 * ### THE TWO CONDITIONS THIS MATRIX DOES NOT CARRY
 *
 * No cell in these ten rows names a commercial tier or a grant beyond the
 * one that opens its own column, so `requiredTiers` and `requiredGrant` are
 * `null` throughout — written on each cell, because writing `null` is an
 * answer and omitting the field is not.
 */

export type Stu04CapabilityId =
  | 'open-the-canvas-for-a-draft-workflow'
  | 'open-the-canvas-read-only-for-a-published-version'
  | 'set-the-four-workflow-settings'
  | 'set-the-default-escalation-routing-template'
  | 'set-the-default-coaching-trigger-percentage'
  | 'set-a-workflow-level-default-severity'
  | 'add-remove-and-reorder-screen-nodes'
  | 'draw-a-conditional-branch'
  | 'override-the-platform-standard-gate-failure-target'
  | 'preview-the-sequence'

export const STU_04_CAPABILITY_IDS = [
  'open-the-canvas-for-a-draft-workflow',
  'open-the-canvas-read-only-for-a-published-version',
  'set-the-four-workflow-settings',
  'set-the-default-escalation-routing-template',
  'set-the-default-coaching-trigger-percentage',
  'set-a-workflow-level-default-severity',
  'add-remove-and-reorder-screen-nodes',
  'draw-a-conditional-branch',
  'override-the-platform-standard-gate-failure-target',
  'preview-the-sequence',
] as const satisfies readonly Stu04CapabilityId[]

type MissingFromCapabilities = Exclude<Stu04CapabilityId, (typeof STU_04_CAPABILITY_IDS)[number]>
const _capabilitiesExhaustive: MissingFromCapabilities extends never ? true : never = true
void _capabilitiesExhaustive

export interface Stu04MatrixRow extends StudioMatrixRow {
  readonly id: Stu04CapabilityId
  /** Read by `reachByStudioMatrix`'s clause one. */
  readonly surface: StudioMatrixRowSurface
  /** PER COLUMN, never per row. `null` for a categorical prohibition. */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu04CapabilityId | null>>
  /** Why a column the module card does not head reads the way it does. */
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
const IMPL_CONDITIONS = cell('allowedWithConditions', 'Allowed with conditions')
const IMPL_ONBOARDING = cell(
  'allowedWithConditions',
  'Allowed with conditions — onboarding only',
)

const PLANT_MANAGER_VIA_SUPERVISOR =
  'MOD-STU-04’s table (L32059) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers this ' +
  'persona’s Studio access through a Supervisor role without the authoring grant, so this cell is ' +
  'that column’s cell. Derived Clarification.'

/** Every column answers `null` — the row routes nobody anywhere. */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, Stu04CapabilityId | null>> = {
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
 * The three columns prohibited on the DRAFT canvas and `Read-only` on the
 * PUBLISHED one. Written as an override of `ROUTES_NOWHERE` so the five
 * columns that route nowhere keep saying so explicitly.
 *
 * The Worker is deliberately NOT here: `Explicitly prohibited` on both rows
 * means there is nowhere to send them, and a row-level pointer would have
 * sent them anyway.
 */
const ROUTES_READERS_TO_PUBLISHED: Readonly<
  Record<StudioPersonaColumn, Stu04CapabilityId | null>
> = {
  ...ROUTES_NOWHERE,
  'supervisor-without-grant': 'open-the-canvas-read-only-for-a-published-version',
  'plant-manager-persona': 'open-the-canvas-read-only-for-a-published-version',
  'tenant-admin': 'open-the-canvas-read-only-for-a-published-version',
}

/**
 * The Plant Manager cell mirrors the without-grant cell and says so in its
 * own derivation rather than being silently aliased. Every other column is
 * headed by the card, so its derivation is `null` — the cell is a
 * transcription, not an inference.
 */
function withPlantManager(
  cells: Omit<Record<StudioPersonaColumn, StudioMatrixCell>, 'plant-manager-persona'>,
): {
  cells: Record<StudioPersonaColumn, StudioMatrixCell>
  derivation: Record<StudioPersonaColumn, string | null>
} {
  return {
    cells: { ...cells, 'plant-manager-persona': cells['supervisor-without-grant'] },
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': PLANT_MANAGER_VIA_SUPERVISOR,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': null,
    },
  }
}

/**
 * The six rows the two authoring roles hold and everyone else is refused:
 * rows 3, 4, 5, 7, 8 and 9 read identically across all seven headed
 * columns.
 */
function authoringRow(
  id: Stu04CapabilityId,
  capability: string,
  sourceRef: string,
): Stu04MatrixRow {
  return {
    id,
    capability,
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: [sourceRef],
    routedTo: ROUTES_NOWHERE,
    ...withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': IMPL_CONDITIONS,
    }),
  }
}

/**
 * `stage` is `null` on all ten rows. `MOD-STU-04`'s card names no approval
 * stage — the chain that reviews a canvas is `MOD-STU-11`'s, and writing a
 * stage here would occupy one this module does not hold.
 */
export const STU_04_MATRIX = [
  {
    id: 'open-the-canvas-for-a-draft-workflow',
    capability: 'Open the canvas for a Draft Workflow',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32060', 'AC-STU-048 L32013', 'AC-STU-151 L34668'],
    routedTo: ROUTES_READERS_TO_PUBLISHED,
    ...withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': IMPL_ONBOARDING,
    }),
  },
  {
    id: 'open-the-canvas-read-only-for-a-published-version',
    capability: 'Open the canvas read-only for a Published version',
    surface: 'screen',
    // The one row on this card that IS the published read, and the row
    // L34605's fail-closed floor lands on: with the identity layer
    // unreachable the Studio "permits nothing beyond published read".
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L32061', 'L34605'],
    routedTo: ROUTES_NOWHERE,
    ...withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': READ_ONLY,
      'tenant-admin': READ_ONLY,
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': IMPL_CONDITIONS,
    }),
  },
  authoringRow('set-the-four-workflow-settings', 'Set the four Workflow settings', 'L32062'),
  authoringRow(
    'set-the-default-escalation-routing-template',
    'Set the default escalation routing template',
    'L32063',
  ),
  authoringRow(
    'set-the-default-coaching-trigger-percentage',
    'Set the default coaching trigger percentage',
    'L32064',
  ),
  {
    id: 'set-a-workflow-level-default-severity',
    capability: 'Set a workflow-level default severity',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32065', 'FUNC-STU-04-01-C-1 L32094', 'AC-STU-055 L32180'],
    routedTo: ROUTES_NOWHERE,
    ...withPlantManager({
      'quality-manager': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — severity is never a workflow default',
      ),
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  authoringRow(
    'add-remove-and-reorder-screen-nodes',
    'Add, remove, and reorder screen nodes',
    'L32066',
  ),
  authoringRow('draw-a-conditional-branch', 'Draw a conditional branch', 'L32067'),
  authoringRow(
    'override-the-platform-standard-gate-failure-target',
    'Override the platform-standard gate-failure target on a screen',
    'L32068',
  ),
  {
    id: 'preview-the-sequence',
    capability: 'Preview the sequence',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32069'],
    routedTo: ROUTES_NOWHERE,
    ...withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': READ_ONLY,
      'tenant-admin': READ_ONLY,
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': IMPL_CONDITIONS,
    }),
  },
] as const satisfies readonly Stu04MatrixRow[]

type MissingFromMatrix = Exclude<Stu04CapabilityId, (typeof STU_04_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * One row, by id. Total over the ten — a missing row surfaces as a refusing
 * row rather than as a crashed render, because a screen that throws on one
 * bad row shows nothing about the other nine.
 */
export function stu04Row(id: Stu04CapabilityId): Stu04MatrixRow {
  const found = STU_04_MATRIX.find((row) => row.id === id)
  return found ?? MISSING_ROW(id)
}

function MISSING_ROW(id: Stu04CapabilityId): Stu04MatrixRow {
  const note = `No row for “${id}” is registered in MOD-STU-04’s matrix, so nothing is permitted.`
  const refused = cell('explicitlyProhibited', note)
  return {
    id,
    capability: id,
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: [],
    routedTo: ROUTES_NOWHERE,
    ...withPlantManager({
      'quality-manager': refused,
      'supervisor-with-authoring-grant': refused,
      'supervisor-without-grant': refused,
      'tenant-admin': refused,
      'read-only-auditor': refused,
      worker: refused,
      'implementation-team': refused,
    }),
  }
}
