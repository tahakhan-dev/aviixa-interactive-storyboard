import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-10`'s own permission matrix — the source's table at **L33111
 * (header), L33112 (separator) and L33113–L33119, seven data rows**,
 * transcribed cell by cell.
 *
 * ### FINDING 1 — the module card heads SIX persona columns; the vocabulary
 * ### has EIGHT
 *
 * L33111's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker`. Neither the
 * **Plant Manager persona** column nor the **`GRANT-STU-IMPL`** column that
 * the consolidated matrix heads (L34539) is on this card — the same absence
 * `MOD-STU-09`'s card has.
 *
 * - `plant-manager-persona` is `DEC-ROLE-001` (L34522): the persona's Studio
 *   access "is delivered by a Supervisor role without the authoring grant",
 *   so its cell is the `supervisor-without-grant` cell with the substitution
 *   named in the note.
 * - `implementation-team` is filled from the card's OWN function lines where
 *   they name it — `FUNC-STU-10-01-A-1` (L33135) and `FUNC-STU-10-02-A-1`
 *   (L33140) both list "implementation team grant" under Roles allowed — and
 *   otherwise from the universal prohibition the row itself states. Nothing
 *   is guessed: rows 3, 5, 6 and 7 refuse EVERY role in the source's own
 *   words ("Roles prohibited: every role", L33141), so the eighth column
 *   follows from the rule rather than from a cell nobody wrote.
 *
 * ### FINDING 2 — ROW 4 IS NOT HERE
 *
 * Row 4, "Complete a skeletal part record" (L33116), is a cross-surface
 * statement (R22) and is carried in `STU_10_CROSS_SURFACE`. Two reasons, and
 * either alone would be enough:
 *
 * - Three of its cells read `Not applicable — completion happens in the
 *   Delivery Operations Hub parts registry`, and `StudioCellOutcome`
 *   deliberately cannot express `Not applicable` (see `MOD-STU-12`'s Job
 *   Owner column for the same ruling): a PERSONA column with no answer is a
 *   blank cell, and a blank cell is a defect.
 * - Its Tenant Admin cell reads `Allowed — in the Delivery Operations Hub`.
 *   Classified `screen`, that would derive Tenant Admin REACH for a module
 *   that has no route at all (`slug: null`, `src/studio/modules.ts`) and
 *   whose whole purpose is not leaving the authoring context.
 *
 * It is also the second row on this surface where the Read-only Auditor gets
 * `Read-only` rather than `Client Decision Required` — again because the act
 * is a Delivery Operations Hub act, where the Auditor's read authority is
 * settled. The consequence for this card is that NO cell anywhere in the
 * persona matrix below defers to `DEC-AUDSTU-001`, so the Auditor's derived
 * reach is `withheld` rather than `client-decision-open`. That is the card's
 * own answer and not an omission.
 *
 * `STU_10_SOURCE_ROW_COUNT` keeps the two halves adding up to seven.
 *
 * ### `requiredTiers`, `requiredGrant` and `stage` are `null` throughout
 *
 * No cell names a commercial tier or a grant beyond the one that opens its
 * column, and no capability here occupies an approval stage: referencing a
 * part is authoring work that happens before a submission exists. Written on
 * every cell rather than left off, because a cell that omits them and a cell
 * that states "none" read identically at a glance.
 */

/** The source table's own data-row count, L33113–L33119. */
export const STU_10_SOURCE_ROW_COUNT = 7

export type Stu10RowId =
  | 'reference-an-existing-part'
  | 'inline-add-a-part-through-the-mini-form'
  | 'mint-the-part-identifier'
  | 'edit-registry-fields-beyond-the-name'
  | 'delete-a-part-from-the-studio'
  | 'force-a-step-to-carry-a-part-reference'

export const STU_10_ROW_IDS = [
  'reference-an-existing-part',
  'inline-add-a-part-through-the-mini-form',
  'mint-the-part-identifier',
  'edit-registry-fields-beyond-the-name',
  'delete-a-part-from-the-studio',
  'force-a-step-to-carry-a-part-reference',
] as const satisfies readonly Stu10RowId[]

type MissingFromRowIds = Exclude<Stu10RowId, (typeof STU_10_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

export interface StudioPartsMatrixRow extends StudioMatrixRow {
  readonly id: Stu10RowId
  /** Read by `reachByStudioMatrix`'s clause one. All six are screen rows. */
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
  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu10RowId | null>>
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
): StudioMatrixCell {
  return { outcome, note, openDecision, requiredTiers: null, requiredGrant: null }
}

const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const ALLOWED = cell('allowed', 'Allowed')
const IMPL_AUTHORING = cell(
  'allowedWithConditions',
  'Allowed with conditions — the onboarding author-and-submit capacity only, named in this card’s own Roles allowed line',
)

function withPlantManager(
  cells: Omit<Record<StudioPersonaColumn, StudioMatrixCell>, 'plant-manager-persona'>,
): Record<StudioPersonaColumn, StudioMatrixCell> {
  const mirrored = cells['supervisor-without-grant']
  return {
    ...cells,
    'plant-manager-persona': {
      ...mirrored,
      note:
        `${mirrored.note} — this module’s own table (L33111) heads no Plant Manager column; ` +
        'DEC-ROLE-001 (L34522) delivers this persona’s Studio access through a Supervisor role ' +
        'without the authoring grant.',
    },
  }
}

/** Rows 1–3 and 5–7 of L33113–L33119, in source order. Row 4 is below. */
/**
 * Every column answers `null` — this row routes nobody anywhere. Written
 * down rather than left off: a cell that omits the field and a cell that
 * says "no route" read identically at a glance, and only one is an answer.
 */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, Stu10RowId | null>> = {
  'quality-manager': null,
  'supervisor-with-authoring-grant': null,
  'supervisor-without-grant': null,
  'plant-manager-persona': null,
  'tenant-admin': null,
  'read-only-auditor': null,
  worker: null,
  'implementation-team': null,
}

export const STU_10_MATRIX = [
  {
    id: 'reference-an-existing-part',
    capability: 'Reference an existing part from a work-instruction step',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33113', 'FUNC-STU-10-01-A-1 L33135'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': IMPL_AUTHORING,
    }),
  },
  {
    id: 'inline-add-a-part-through-the-mini-form',
    capability: 'Inline-add a part through the name-only mini-form',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33114', 'FUNC-STU-10-02-A-1 L33140', 'AC-STU-091 L33215'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': IMPL_AUTHORING,
    }),
  },
  {
    id: 'mint-the-part-identifier',
    capability: 'Mint the part identifier',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    // FUNC-STU-10-02-A-2 (L33141): "Roles allowed: none may set it. Roles
    // prohibited: every role." The rule, not a list — so the seventh and
    // eighth columns follow from it rather than being invented.
    sourceRefs: ['L33115', 'FUNC-STU-10-02-A-2 L33141', 'AC-STU-092 L33216', 'TEST-STU-098 L33225'],
    cells: withPlantManager({
      'quality-manager': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the platform mints it',
      ),
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'edit-registry-fields-beyond-the-name',
    capability: 'Edit registry fields from the Studio beyond the name',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33117', 'L33207', 'AC-STU-091 L33215'],
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
  {
    id: 'delete-a-part-from-the-studio',
    capability: 'Delete a part from the Studio',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33118', 'L33207'],
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
  {
    id: 'force-a-step-to-carry-a-part-reference',
    capability: 'Force a step to carry a part reference',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    // FUNC-STU-10-01-B-1 (L33137): "Roles prohibited: no role may configure
    // a requirement that every step carry a part."
    sourceRefs: ['L33119', 'FUNC-STU-10-01-B-1 L33137', 'AC-STU-094 L33218'],
    cells: withPlantManager({
      'quality-manager': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — a part reference is optional per part',
      ),
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
] as const satisfies readonly StudioPartsMatrixRow[]

type MissingFromMatrix = Exclude<Stu10RowId, (typeof STU_10_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function stu10Row(id: Stu10RowId): StudioPartsMatrixRow {
  const found = STU_10_MATRIX.find((row) => row.id === id)
  if (found === undefined) {
    throw new Error(`MOD-STU-10: no matrix row is transcribed for "${id}".`)
  }
  return found
}

/* ==================================================================== *
 * ROW 4 — a cross-surface statement, never a Studio control (R22).
 * ==================================================================== */

export interface StudioPartsCrossSurfaceRow {
  readonly id: 'complete-a-skeletal-part-record'
  readonly capability: string
  /**
   * The surface that actually holds the control. Deliberately NOT named
   * `surface`: `scripts/build-stu-module-reach.mjs` finds a module's matrix
   * by looking for the one exported array whose every row carries `surface`,
   * and a second such array in this file would make it read neither.
   */
  readonly heldOn: 'SURF-DOH'
  readonly owner: string
  /** The six source cells, verbatim, in the card's own header order. */
  readonly cells: readonly { readonly column: string; readonly text: string }[]
  /** The one sentence a Studio screen renders in place of a control. */
  readonly statement: string
  readonly sourceRefs: readonly string[]
}

export const STU_10_CROSS_SURFACE = [
  {
    id: 'complete-a-skeletal-part-record',
    capability: 'Complete a skeletal part record',
    heldOn: 'SURF-DOH',
    owner:
      'MOD-DOH-19, the Delivery Operations Hub parts registry — registered as not-represented, excluded from slice 4, and named in no later slice’s stated scope',
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — completion happens in the Delivery Operations Hub parts registry',
      },
      { column: 'Supervisor with grant', text: 'Not applicable — same reason' },
      { column: 'Supervisor without grant', text: 'Not applicable — same reason' },
      {
        column: 'Tenant Admin',
        text: 'Allowed — in the Delivery Operations Hub, subject to its own permissions',
      },
      { column: 'Read-only Auditor', text: 'Read-only' },
      { column: 'Worker', text: 'Explicitly prohibited' },
    ],
    statement:
      'A skeletal part record is completed in the Delivery Operations Hub parts registry, never ' +
      'here. No Studio control completes it, for any persona, in any state — FUNC-STU-10-02-B-1 ' +
      '(L33143) prohibits “no Studio role may complete the record from the Studio”, and the seam ' +
      'is a convenience rather than a bypass of master-data ownership.',
    sourceRefs: ['L33116', 'FUNC-STU-10-02-B-1 L33143', 'L33161'],
  },
] as const satisfies readonly StudioPartsCrossSurfaceRow[]

/**
 * The two halves add up to the source's seven rows. Asserted rather than
 * assumed, because moving a row into the cross-surface register is exactly
 * how a matrix quietly loses one.
 */
export const STU_10_MATRIX_AND_CROSS_SURFACE_ROWS =
  STU_10_MATRIX.length + STU_10_CROSS_SURFACE.length
