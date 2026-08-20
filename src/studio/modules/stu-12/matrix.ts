import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-12`'s own permission matrix — the source's table at **L33456
 * (header) and L33458-L33469, TWELVE data rows**, transcribed cell by cell.
 *
 * ### The three things this table does that no other Studio matrix does
 *
 * 1. **Its seventh column is not a persona.** The header reads `… | Worker |
 *    Job Owner, a field on the Job`. `StudioPersonaColumn` has eight members
 *    and none of them is a Job Owner, because the Job Owner is a FIELD on the
 *    Job record (L33433: "defaulting to the creator and reassignable — not a
 *    role"). So the Job Owner column is carried in `JOB_OWNER_COLUMN_CELLS`,
 *    beside the matrix and not inside it, and the permission it grants is
 *    evaluated against the field value in `decideAdoption`.
 * 2. **Row 5 grants by a field value.** Four of the five tenant-role cells read
 *    `Explicitly prohibited unless also the Job Owner`, verbatim, and the
 *    rider lives ON THE CELL (`unlessJobOwner`) rather than on the row. It has
 *    to: the Read-only Auditor's cell and the Worker's cell carry NO rider,
 *    and a row-level flag would hand both of them a decision the source
 *    withholds. A build that renders row 5 as a role check gets it wrong for
 *    the Quality Manager who happens to own the Job.
 * 3. **Row 12 refuses in every one of the seven columns**, the Job Owner
 *    column included — where ten of the other eleven rows read
 *    `Not applicable`. That is the pinning guarantee stated as a matrix row,
 *    and it is why `swapPinnedPackage` has no permitted path for any actor.
 *
 * ### FINDING — the card heads SEVEN columns; the vocabulary has EIGHT, and
 * ### the two sets overlap in only six
 *
 * This card's header (L33456) has no **Plant Manager persona** column and no
 * **`GRANT-STU-IMPL`** column, and it has a **Job Owner** column the
 * consolidated matrix (L34539) does not. Six columns are shared.
 *
 * - `plant-manager-persona` is filled from `DEC-ROLE-001` (L34522) — the
 *   persona's Studio access "is delivered by a Supervisor role without the
 *   authoring grant" — so its cell is the `supervisor-without-grant` cell with
 *   the decision named in the note. The same treatment `MOD-STU-11` applies,
 *   for the same reason, and on all twenty-three rows of the consolidated
 *   matrix the two columns are identical.
 * - `implementation-team` is filled from the CONSOLIDATED matrix row that
 *   states the same capability, and the row it was taken from is named in
 *   every note. Where the consolidated matrix states no such row — rows 5 and
 *   10 — the narrower reading is taken and the absence is stated in the note
 *   rather than a permission being invented. See `IMPL_SOURCE` below.
 *
 * ### Row 6 is not here
 *
 * "Rebase a scheduled Run" is a cross-surface statement (R22): its Quality
 * Manager cell reads `Not applicable — rebasing is a Delivery Operations Hub
 * action` and both Supervisor cells read `Allowed with conditions — at the
 * supervisor's discretion in the Delivery Operations Hub`. It is a Delivery
 * Operations Hub control, never a Studio one, so it is carried in
 * `STU_12_CROSS_SURFACE` with its cells verbatim and it is not a row anything
 * on this screen can ask for. `STU_12_SOURCE_ROW_COUNT` is what keeps the two
 * halves adding up to the source's twelve.
 *
 * ### The two conditions this matrix does not carry
 *
 * No cell in these rows names a commercial tier or a grant beyond the one that
 * opens its own column, so `requiredTiers` and `requiredGrant` are `null`
 * throughout — written on every cell, because a cell that omits them and a
 * cell that states "none" read identically at a glance and only one is an
 * answer.
 */

/** The source table's own data-row count, L33458-L33469. */
export const STU_12_SOURCE_ROW_COUNT = 12

export type StudioVersionCapabilityId =
  | 'select-bump-classification'
  | 'validate-classification-against-diff'
  | 'write-republish-description'
  | 'publish-a-version'
  | 'decide-adoption'
  | 'view-version-history'
  | 'view-screen-level-diff'
  | 'view-job-and-run-linkage'
  | 'archive-a-version'
  | 'export-a-version'
  | 'swap-pinned-package-in-flight'

export const STU_12_CAPABILITY_IDS = [
  'select-bump-classification',
  'validate-classification-against-diff',
  'write-republish-description',
  'publish-a-version',
  'decide-adoption',
  'view-version-history',
  'view-screen-level-diff',
  'view-job-and-run-linkage',
  'archive-a-version',
  'export-a-version',
  'swap-pinned-package-in-flight',
] as const satisfies readonly StudioVersionCapabilityId[]

type MissingFromCapabilities = Exclude<
  StudioVersionCapabilityId,
  (typeof STU_12_CAPABILITY_IDS)[number]
>
const _capabilitiesExhaustive: MissingFromCapabilities extends never ? true : never = true
void _capabilitiesExhaustive

/**
 * A cell of this module's matrix. One field beyond the shared shape, and it is
 * per-cell for the reason the shared shape's own `requiredTiers` is per-cell:
 * the condition differs across the columns of ONE row.
 */
export interface StudioVersionMatrixCell extends StudioMatrixCell {
  /**
   * L33462 — `Explicitly prohibited unless also the Job Owner`, verbatim on
   * four of the five tenant-role cells and absent from the other two. `true`
   * means the refusal lifts when the acting identity is the value of the
   * Job's owner FIELD; `false` means it does not lift at all.
   */
  readonly unlessJobOwner: boolean
}

export interface StudioVersionMatrixRow extends StudioMatrixRow {
  readonly id: StudioVersionCapabilityId
  readonly surface: StudioMatrixRowSurface
  /**
   * PER COLUMN, never per row. Task 11's mechanism (`MOD-STU-07`), retrofitted
   * here. Where a prohibited cell's own words name an alternative THIS persona
   * holds, this is that capability's id; `null` is the answer for a categorical
   * prohibition, and it is written on every column rather than omitted.
   *
   * The pointer is CHECKED, never asserted: the fold asks
   * `routedProhibitionApplies` for the routed row's own decision, and a route
   * whose target does not permit this persona collapses back to ABSENT.
   */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, StudioVersionCapabilityId | null>>
  readonly cells: Readonly<Record<StudioPersonaColumn, StudioVersionMatrixCell>>
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
  unlessJobOwner = false,
): StudioVersionMatrixCell {
  return { outcome, note, openDecision, requiredTiers: null, requiredGrant: null, unlessJobOwner }
}

const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
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
  authoring: 'L34545, “Author all nine configuration sections” — Allowed with conditions',
  reviewing: 'L34551, “Act as Reviewer” — Explicitly prohibited',
  releasing: 'L34552, “Approve or release” — Explicitly prohibited',
  reading: 'L34542-L34543, reading published and in-review content — Allowed with conditions',
  archiving: 'L34547, “Create, edit, archive Content Library items” — Explicitly prohibited',
  exporting: 'L34561, “Generate a portable-document-format export of a version” — Allowed with conditions',
} as const

const IMPL_AUTHORING = cell(
  'allowedWithConditions',
  `Allowed with conditions — onboarding only. This card heads no implementation-team column; filled from the consolidated matrix (${IMPL_SOURCE.authoring})`,
)
const IMPL_READING = cell(
  'allowedWithConditions',
  `Allowed with conditions — onboarding only. This card heads no implementation-team column; filled from the consolidated matrix (${IMPL_SOURCE.reading})`,
)

/**
 * The Plant Manager persona reads the `supervisor-without-grant` cell and says
 * so in its own note rather than being silently aliased.
 */
function withPlantManager(
  cells: Omit<Record<StudioPersonaColumn, StudioVersionMatrixCell>, 'plant-manager-persona'>,
): Record<StudioPersonaColumn, StudioVersionMatrixCell> {
  const mirrored = cells['supervisor-without-grant']
  return {
    ...cells,
    'plant-manager-persona': {
      ...mirrored,
      note: `${mirrored.note} — this module’s own table (L33456) heads no Plant Manager column; DEC-ROLE-001 (L34522) delivers this persona’s Studio access through a Supervisor role without the authoring grant, and the consolidated matrix reads the two columns identically on every row.`,
    },
  }
}

/**
 * Every column answers `null` — this row routes nobody anywhere. Written
 * down rather than left off: a cell that omits the field and a cell that
 * says "no route" read identically at a glance, and only one is an answer.
 */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, StudioVersionCapabilityId | null>> = {
  'quality-manager': null,
  'supervisor-with-authoring-grant': null,
  'supervisor-without-grant': null,
  'plant-manager-persona': null,
  'tenant-admin': null,
  'read-only-auditor': null,
  worker: null,
  'implementation-team': null,
}

export const STU_12_MATRIX = [
  {
    id: 'select-bump-classification',
    capability: 'Select the bump classification at republish',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'author',
    sourceRefs: ['L33458', 'FUNC-STU-12-01-A-1 L33485'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed — as Author'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed — as Author'),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': IMPL_AUTHORING,
    }),
  },
  {
    id: 'validate-classification-against-diff',
    capability: 'Validate the classification against the diff',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'reviewer',
    sourceRefs: ['L33459', 'FUNC-STU-12-01-A-2 L33486', 'AC-STU-106 L33584'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed — as Reviewer'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed — as Reviewer'),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': cell(
        'explicitlyProhibited',
        `Explicitly prohibited — filled from the consolidated matrix (${IMPL_SOURCE.reviewing})`,
      ),
    }),
  },
  {
    id: 'write-republish-description',
    capability: 'Write the mandatory republish description',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'author',
    sourceRefs: ['L33460', 'FUNC-STU-12-01-B-1 L33488', 'AC-STU-105 L33583'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed — as Author'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed — as Author'),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': IMPL_AUTHORING,
    }),
  },
  {
    id: 'publish-a-version',
    capability: 'Publish a version',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'release-authority',
    sourceRefs: ['L33461', 'L33511', 'L53602'],
    cells: withPlantManager({
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — as Release Authority only',
      ),
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': cell(
        'explicitlyProhibited',
        `Explicitly prohibited — filled from the consolidated matrix (${IMPL_SOURCE.releasing})`,
      ),
    }),
  },
  {
    id: 'decide-adoption',
    capability: 'Decide adoption of a notified-class version',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    // No approval stage: adoption is a Delivery Operations Hub decision by the
    // Job Owner, not a stage of the three-stage chain, so separation of duties
    // has nothing to check here.
    stage: null,
    sourceRefs: ['L33462', 'L33433', 'FUNC-STU-12-02-B-1 L33493'],
    cells: withPlantManager({
      'quality-manager': cell(
        'explicitlyProhibited',
        'Explicitly prohibited unless also the Job Owner',
        null,
        true,
      ),
      'supervisor-with-authoring-grant': cell(
        'explicitlyProhibited',
        'Explicitly prohibited unless also the Job Owner',
        null,
        true,
      ),
      'supervisor-without-grant': cell(
        'explicitlyProhibited',
        'Explicitly prohibited unless also the Job Owner',
        null,
        true,
      ),
      'tenant-admin': cell(
        'explicitlyProhibited',
        'Explicitly prohibited unless also the Job Owner',
        null,
        true,
      ),
      // FINDING, carried rather than smoothed. The Read-only Auditor's cell
      // and the Worker's cell carry NO rider in the source, so an Auditor or
      // Worker named on the owner field is still refused by this table while
      // the Job Owner column reads `Allowed`. The source is followed as
      // written; widening either cell would grant a decision it withholds.
      'read-only-auditor': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — and this cell carries no “unless also the Job Owner” rider, unlike the four above it',
      ),
      worker: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — and this cell carries no “unless also the Job Owner” rider, unlike the four above it',
      ),
      // FINDING. The consolidated matrix states no adoption row at all, so
      // nothing supports a rider here. The narrower reading is taken: the
      // implementation team's capacity is a temporary authoring grant
      // (L34559, "author and submit only") and owning a Job is not part of it.
      'implementation-team': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — neither this card nor the consolidated matrix states an adoption row for the implementation-team grant, so the narrower reading stands and no rider is invented',
      ),
    }),
  },
  {
    id: 'view-version-history',
    capability: 'View the version history and approval log',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    // L34605's fail-closed floor "permits nothing beyond published read", and
    // this is that read: prior versions are retained in full and remain
    // permanently readable (L33435).
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L33464', 'FUNC-STU-12-03-A-1 L33499'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
      'supervisor-without-grant': cell('readOnly', 'Read-only'),
      'tenant-admin': cell('readOnly', 'Read-only'),
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': IMPL_READING,
    }),
  },
  {
    id: 'view-screen-level-diff',
    capability: 'View the screen-level diff',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L33465', 'FUNC-STU-12-03-B-1 L33501'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
      'supervisor-without-grant': cell('readOnly', 'Read-only'),
      'tenant-admin': cell('readOnly', 'Read-only'),
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': IMPL_READING,
    }),
  },
  {
    id: 'view-job-and-run-linkage',
    capability: 'View the Job and Run linkage',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L33466', 'FUNC-STU-12-03-C-1 L33503'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
      'supervisor-without-grant': cell('readOnly', 'Read-only'),
      'tenant-admin': cell('readOnly', 'Read-only'),
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': IMPL_READING,
    }),
  },
  {
    id: 'archive-a-version',
    capability: 'Archive a version manually',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33467', 'FUNC-STU-12-03-D-1 L33505', 'AC-STU-110 L33588'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': cell(
        'explicitlyProhibited',
        `Explicitly prohibited — this card names the Quality Manager alone (“Roles allowed: Quality Manager. Roles prohibited: all others”, L33505); the nearest consolidated row agrees (${IMPL_SOURCE.archiving})`,
      ),
    }),
  },
  {
    id: 'export-a-version',
    capability: 'Export a version to portable document format',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    // Export GENERATION is an audited act (L33573), not a bare read, so the
    // identity-layer floor must refuse it rather than fall back to it.
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33468', 'FUNC-STU-12-03-E-1 L33507', 'AC-STU-111 L33589'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
      // The token carries its own rendering instruction. Mapping `Read-only`
      // mechanically to a disabled control would remove an export the source
      // grants — see `exportVersion`, which these personas may take.
      'supervisor-without-grant': cell('readOnly', 'Read-only — may generate the read-only export'),
      'tenant-admin': cell('readOnly', 'Read-only — may generate the read-only export'),
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': cell(
        'allowedWithConditions',
        `Allowed with conditions — onboarding only; filled from the consolidated matrix (${IMPL_SOURCE.exporting})`,
      ),
    }),
  },
  {
    id: 'swap-pinned-package-in-flight',
    capability: 'Swap the pinned package of an in-flight Run',
    // A capability that exists NOWHERE is a screen row whose every cell
    // refuses — it grants nobody standing on this module, and it must not be
    // mistaken for a cross-surface act somebody else may take.
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33469', 'FUNC-STU-12-02-C-1 L33496', 'AC-STU-108 L33586', 'L53602'],
    cells: withPlantManager({
      'quality-manager': PROHIBITED,
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
] as const satisfies readonly StudioVersionMatrixRow[]

type MissingFromMatrix = Exclude<StudioVersionCapabilityId, (typeof STU_12_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/* ==================================================================== *
 * THE SEVENTH COLUMN — the Job Owner, a FIELD and not a persona.
 * ==================================================================== */

/**
 * What the Job Owner column says, per row, verbatim.
 *
 * `notApplicable` is expressible here and deliberately is not expressible in
 * `StudioVersionMatrixCell`: `StudioCellOutcome` excludes it, because a
 * persona column with no answer is a blank cell and a blank cell is a defect.
 * The Job Owner column is not a persona column, and `Not applicable` is a real
 * and frequent answer in it — ten of the twelve rows.
 */
export type JobOwnerCellKind = 'allowed' | 'notApplicable' | 'explicitlyProhibited'

export interface JobOwnerCell {
  readonly kind: JobOwnerCellKind
  /** The cell's own words, verbatim from L33458-L33469. */
  readonly text: string
}

export const JOB_OWNER_COLUMN_CELLS = {
  'select-bump-classification': {
    kind: 'notApplicable',
    text: 'Not applicable — the Job Owner decides adoption, not classification',
  },
  'validate-classification-against-diff': {
    kind: 'notApplicable',
    text: 'Not applicable — same reason',
  },
  'write-republish-description': { kind: 'notApplicable', text: 'Not applicable — same reason' },
  'publish-a-version': { kind: 'notApplicable', text: 'Not applicable — same reason' },
  'decide-adoption': {
    kind: 'allowed',
    text: 'Allowed — the decision keys to the Job Owner field',
  },
  // Row 6, carried here as well as in STU_12_CROSS_SURFACE so the column adds
  // up to the source's twelve rows rather than to eleven.
  'rebase-a-scheduled-run': { kind: 'notApplicable', text: 'Not applicable — same reason' },
  'view-version-history': {
    kind: 'notApplicable',
    text: 'Not applicable — the Job Owner sees the change notice, not the Studio',
  },
  'view-screen-level-diff': { kind: 'notApplicable', text: 'Not applicable — same reason' },
  'view-job-and-run-linkage': { kind: 'notApplicable', text: 'Not applicable — same reason' },
  'archive-a-version': { kind: 'notApplicable', text: 'Not applicable — same reason' },
  'export-a-version': { kind: 'notApplicable', text: 'Not applicable — same reason' },
  // The ONE row where this column refuses rather than reading Not applicable.
  'swap-pinned-package-in-flight': { kind: 'explicitlyProhibited', text: 'Explicitly prohibited' },
} as const satisfies Readonly<
  Record<StudioVersionCapabilityId | 'rebase-a-scheduled-run', JobOwnerCell>
>

type MissingFromJobOwner = Exclude<
  StudioVersionCapabilityId | 'rebase-a-scheduled-run',
  keyof typeof JOB_OWNER_COLUMN_CELLS
>
const _jobOwnerExhaustive: MissingFromJobOwner extends never ? true : never = true
void _jobOwnerExhaustive

/* ==================================================================== *
 * ROW 6 — a cross-surface statement, never a Studio control (R22).
 * ==================================================================== */

export interface StudioVersionCrossSurfaceRow {
  readonly id: 'rebase-a-scheduled-run'
  readonly capability: string
  /**
   * The surface that actually holds the control. Deliberately NOT named
   * `surface`: `scripts/build-stu-module-reach.mjs` finds a module's matrix by
   * looking for the one exported array whose every row carries `surface`, and
   * a second such array in this file would make it read neither.
   */
  readonly heldOn: 'SURF-DOH'
  readonly owner: string
  /** The seven source cells, verbatim, in header order. */
  readonly cells: readonly { readonly column: string; readonly text: string }[]
  readonly sourceRefs: readonly string[]
}

export const STU_12_CROSS_SURFACE = [
  {
    id: 'rebase-a-scheduled-run',
    capability: 'Rebase a scheduled Run',
    heldOn: 'SURF-DOH',
    owner: 'MOD-DOH-06, the Delivery Operations Hub — slice 6',
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — rebasing is a Delivery Operations Hub action',
      },
      {
        column: 'Supervisor with grant',
        text: 'Allowed with conditions — at the supervisor’s discretion in the Delivery Operations Hub',
      },
      { column: 'Supervisor without grant', text: 'Allowed with conditions — same' },
      { column: 'Tenant Admin', text: 'Explicitly prohibited' },
      { column: 'Read-only Auditor', text: 'Explicitly prohibited' },
      { column: 'Worker', text: 'Explicitly prohibited' },
      { column: 'Job Owner, a field on the Job', text: 'Not applicable — same reason' },
    ],
    sourceRefs: ['L33463', 'L33431', 'L33519'],
  },
] as const satisfies readonly StudioVersionCrossSurfaceRow[]

const BY_ID = new Map<StudioVersionCapabilityId, StudioVersionMatrixRow>(
  STU_12_MATRIX.map((row) => [row.id, row]),
)

/**
 * One row, by its capability. Total: the exhaustiveness check above proves
 * every member of the union is in the table, so the fallback can only be
 * reached by a caller that has already defeated the type system — and it
 * returns the row that refuses everyone rather than throwing, because a render
 * that crashes shows nothing about the ten controls beside it.
 */
export function versionRow(id: StudioVersionCapabilityId): StudioVersionMatrixRow {
  return BY_ID.get(id) ?? STU_12_MATRIX[10]
}
