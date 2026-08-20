import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-06`'s own permission matrix — the source's table at **L32456
 * (header) and L32458-L32463 (SIX data rows)**, transcribed cell by cell.
 * It is the narrowest matrix on the surface, and its narrowness is the
 * point: five of its six rows are refused in five of the card's six columns.
 *
 * TWO THINGS READ THIS FILE.
 *
 * 1. `scripts/build-stu-module-reach.mjs` derives which personas are offered
 *    this module's route, using `reachByStudioMatrix` over the rows
 *    classified `screen`. That is why every row carries `surface` and why
 *    every row answers all EIGHT persona columns.
 * 2. `evaluateStudioAccess` answers the per-control affordance question, one
 *    row at a time. There is no module-level role list anywhere in this
 *    module; a control asks for its own row and gets its own answer.
 *
 * ### FINDING — the module card heads SIX columns; the vocabulary has EIGHT
 *
 * L32456's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker`. The **Plant
 * Manager persona** and the **`GRANT-STU-IMPL` implementation team** columns
 * that the consolidated matrix at L34539 heads are absent from this card
 * entirely. Each is filled below from a named source line, and each fill is
 * written on the row's `derivation` map rather than left to inference — a
 * blank cell reads as "withheld" without anybody writing it down, which is
 * the defect L10238 names one level up.
 *
 * This module's implementation-team fills are TRANSCRIBED rather than
 * derived, and that is a real difference from `MOD-STU-07`. The consolidated
 * matrix carries a row that is this module by name: *"Create and apply
 * Shared Instruction Blocks | Allowed | Allowed | Explicitly prohibited |
 * Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
 * Explicitly prohibited | Allowed with conditions"* (L34546). So rows 1 and
 * 2 are read straight off it, and rows 3 and 4 — editing and removing, the
 * two acts that maintain an application — follow the same cell, with the
 * derivation saying so.
 *
 * ### WHY THERE IS NO `routedTo` FIELD HERE
 *
 * `MOD-STU-07` carries one because it has a routed prohibition: its
 * Supervisor is prohibited from editing a library item *and allowed to
 * propose one*, on the same screen, so a vanished control would teach
 * nothing about where to go instead. **`MOD-STU-06` has no such row.**
 *
 * Row 5 — *Reuse a block in another Workflow* — is `Explicitly prohibited`
 * in all six of the card's columns, the Quality Manager's included, and
 * there is no alternative capability anywhere on this surface that any
 * persona holds instead. A capability that exists for NOBODY renders ABSENT.
 * Adding a `routedTo` map of forty-eight nulls to say so would be ceremony
 * that reads as an unanswered question; the absence of the field, documented
 * here, is the answer.
 *
 * Row 6's Worker cell is the one cell that names an alternative — *"workers
 * meet the rendered result on the device, not the block"* — and it is
 * deliberately NOT a `routedTo`. The alternative is on **another surface**
 * (`SURF-FLT`, the device), not a capability of this matrix, and pointing
 * `routedTo` at a capability this matrix does not hold is how a disabled
 * control appears for a persona who can never reach the thing it names.
 * The cell's own words carry it, and they render inside the absence note.
 *
 * ### THE CONDITIONS THIS MATRIX DOES NOT CARRY
 *
 * No cell in these six rows names a commercial tier or a grant beyond the
 * one that opens its own column, so `requiredTiers` and `requiredGrant` are
 * `null` throughout. They are per-CELL fields, and writing `null` on each
 * cell is the answer rather than the absence of one.
 *
 * ### A SOURCE-VS-SOURCE READING RECORDED RATHER THAN SMOOTHED
 *
 * Row 6 gives the **Quality Manager** `Read-only` on *Read a block on
 * published content*, while the consolidated matrix's *Read published
 * Workflow content* row (L34542) gives that same persona `Allowed`. The two
 * are not in conflict once the objects are separated: L34542 is about
 * reaching published content at all, which the Quality Manager does fully;
 * this card's row is about the BLOCK RECORD inside published content, which
 * nobody edits in place because published bytes never move. The card is this
 * module's authority and its token is what is transcribed.
 */

export type Stu06CapabilityId =
  | 'create-a-block-within-a-workflow'
  | 'apply-a-block-to-a-screen'
  | 'edit-a-block-propagating-to-every-applying-screen'
  | 'remove-a-block-from-a-screen'
  | 'reuse-a-block-in-another-workflow'
  | 'read-a-block-on-published-content'

export const STU_06_CAPABILITY_IDS = [
  'create-a-block-within-a-workflow',
  'apply-a-block-to-a-screen',
  'edit-a-block-propagating-to-every-applying-screen',
  'remove-a-block-from-a-screen',
  'reuse-a-block-in-another-workflow',
  'read-a-block-on-published-content',
] as const satisfies readonly Stu06CapabilityId[]

type MissingFromCapabilities = Exclude<
  Stu06CapabilityId,
  (typeof STU_06_CAPABILITY_IDS)[number]
>
const _capabilitiesExhaustive: MissingFromCapabilities extends never ? true : never = true
void _capabilitiesExhaustive

export interface Stu06MatrixRow extends StudioMatrixRow {
  readonly id: Stu06CapabilityId
  /** Read by `reachByStudioMatrix`'s clause one. */
  readonly surface: StudioMatrixRowSurface
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

const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const ALLOWED = cell('allowed', 'Allowed')
const READ_ONLY = cell('readOnly', 'Read-only')
const IMPL_ONBOARDING = cell('allowedWithConditions', 'Allowed with conditions — onboarding only')

const PLANT_MANAGER_VIA_SUPERVISOR =
  'MOD-STU-06’s table (L32456) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers this ' +
  'persona’s Studio access through a Supervisor role without the authoring grant, so this cell is ' +
  'that column’s cell. The consolidated matrix agrees on both of the rows it states for this ' +
  'module — L34546 prohibits the Plant Manager persona from creating and applying blocks, and ' +
  'L34542 gives it Read-only on published Workflow content. Derived Clarification.'

const IMPL_TEAM_AUTHORS_BLOCKS =
  'MOD-STU-06’s table (L32456) heads no `GRANT-STU-IMPL` column; the consolidated matrix states ' +
  'this one by name — “Create and apply Shared Instruction Blocks | … | `GRANT-STU-IMPL` | ' +
  'Allowed with conditions” (L34546). Transcribed from there, not derived. L34520 scopes the ' +
  'condition: “a provisioned, temporary authoring capacity during onboarding — author and submit ' +
  'only, fully audited, revoked at onboarding’s end”.'

const IMPL_TEAM_MAINTAINS_APPLICATIONS =
  'MOD-STU-06’s table heads no `GRANT-STU-IMPL` column and the consolidated matrix states no row ' +
  'for editing or removing a block on its own. L34546’s row covers creating AND applying blocks, ' +
  'and L34545 gives the same column “Author all nine configuration sections | Allowed with ' +
  'conditions” — editing and removing an application are how an applied block is maintained, and ' +
  'a capacity that could apply a block but never correct or reverse one would strand the ' +
  'onboarding team’s own work. Read forward from L34546 and L34545. Derived Clarification.'

const IMPL_TEAM_READS =
  'MOD-STU-06’s table heads no `GRANT-STU-IMPL` column; the consolidated matrix states this one ' +
  'directly — “Read published Workflow content | … | `GRANT-STU-IMPL` | Allowed with conditions” ' +
  '(L34542). Transcribed from there. Derived Clarification.'

const UNIVERSAL_REFUSAL =
  'A universal refusal: the card’s own cell prohibits the Quality Manager, and no column this ' +
  'card omits can hold what the persona who owns the Workflow does not. The consolidated matrix ' +
  'agrees — it states no cross-Workflow reuse row for any column. No derivation is needed and ' +
  'none is invented.'

/**
 * The Plant Manager cell mirrors the without-grant cell and says so in its
 * own derivation rather than being silently aliased.
 */
function withDerivedColumns(
  cells: Omit<
    Record<StudioPersonaColumn, StudioMatrixCell>,
    'plant-manager-persona' | 'implementation-team'
  >,
  implementationTeam: StudioMatrixCell,
  implementationNote: string,
): {
  cells: Record<StudioPersonaColumn, StudioMatrixCell>
  derivation: Record<StudioPersonaColumn, string | null>
} {
  return {
    cells: {
      ...cells,
      'plant-manager-persona': cells['supervisor-without-grant'],
      'implementation-team': implementationTeam,
    },
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': PLANT_MANAGER_VIA_SUPERVISOR,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': implementationNote,
    },
  }
}

/**
 * The four authoring rows. They differ only in the grant-holder's note on
 * row 1 and in which line of the card each is transcribed from, so the
 * shared shape is written once — a per-row copy is how one of four rows
 * quietly acquires a different cell.
 */
function authoringRow(
  id: Stu06CapabilityId,
  capability: string,
  sourceRef: string,
  grantHolder: StudioMatrixCell,
  implementationNote: string,
): Stu06MatrixRow {
  return {
    id,
    capability,
    surface: 'screen',
    isPublishedRead: false,
    // `stage` is null on all six rows. MOD-STU-06's card names no approval
    // stage: a block is reviewed and released with its Workflow, through
    // MOD-STU-11's chain, and naming a stage here would give this module an
    // authority over that chain the source does not give it.
    stage: null,
    sourceRefs: [sourceRef],
    ...withDerivedColumns(
      {
        'quality-manager': ALLOWED,
        'supervisor-with-authoring-grant': grantHolder,
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      IMPL_ONBOARDING,
      implementationNote,
    ),
  }
}

export const STU_06_MATRIX = [
  authoringRow(
    'create-a-block-within-a-workflow',
    'Create a block within a Workflow',
    'L32458',
    cell('allowed', 'Allowed — create and apply Shared Instruction Blocks'),
    IMPL_TEAM_AUTHORS_BLOCKS,
  ),
  authoringRow(
    'apply-a-block-to-a-screen',
    'Apply a block to a screen',
    'L32459',
    ALLOWED,
    IMPL_TEAM_AUTHORS_BLOCKS,
  ),
  authoringRow(
    'edit-a-block-propagating-to-every-applying-screen',
    'Edit a block, propagating to every applying screen',
    'L32460',
    ALLOWED,
    IMPL_TEAM_MAINTAINS_APPLICATIONS,
  ),
  authoringRow(
    'remove-a-block-from-a-screen',
    'Remove a block from a screen',
    'L32461',
    ALLOWED,
    IMPL_TEAM_MAINTAINS_APPLICATIONS,
  ),
  {
    id: 'reuse-a-block-in-another-workflow',
    capability: 'Reuse a block in another Workflow',
    // A `screen` row even though nobody may perform it. The refusal is
    // STATED on SCR-STU-05 — SB-STU-09 puts it in a prominent line — and a
    // row that contributes `refuses` to every column changes no reach
    // answer, while classifying it `another-surface` would imply the act
    // belongs somewhere else. It belongs nowhere.
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32462', 'L32441', 'L32443', 'AC-STU-066 L32558'],
    ...withDerivedColumns(
      {
        'quality-manager': cell(
          'explicitlyProhibited',
          'Explicitly prohibited — blocks are scoped to a single Workflow',
        ),
        'supervisor-with-authoring-grant': PROHIBITED,
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      UNIVERSAL_REFUSAL,
    ),
  },
  {
    id: 'read-a-block-on-published-content',
    capability: 'Read a block on published content',
    surface: 'screen',
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L32463', 'AC-STU-157 L34674'],
    ...withDerivedColumns(
      {
        'quality-manager': READ_ONLY,
        'supervisor-with-authoring-grant': READ_ONLY,
        'supervisor-without-grant': READ_ONLY,
        'tenant-admin': READ_ONLY,
        // AC-STU-157 (L34674) keeps this unassumed, and L34540's own note is
        // explicit: "until decided, every Read-only Auditor cell in this
        // chapter reads Client Decision Required rather than being guessed."
        'read-only-auditor': cell(
          'clientDecisionRequired',
          'Client Decision Required — `DEC-AUDSTU-001`',
          'DEC-AUDSTU-001',
        ),
        // THE ONE WORKER CELL ON THIS SURFACE THAT EXPLAINS ITSELF, and the
        // explanation is a cross-surface statement: what a worker meets is
        // the resolved composition inside the pinned package, never the
        // block as an object. It is not a routing — the alternative is on
        // SURF-FLT, not on this matrix — so it renders inside the absence.
        worker: cell(
          'explicitlyProhibited',
          'Explicitly prohibited — workers meet the rendered result on the device, not the block',
        ),
      },
      IMPL_ONBOARDING,
      IMPL_TEAM_READS,
    ),
  },
] as const satisfies readonly Stu06MatrixRow[]

type MissingFromMatrix = Exclude<Stu06CapabilityId, (typeof STU_06_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * One row, by id. Total over the six — a defect in the registry surfaces as
 * a refusing row rather than as a crashed render, because a screen that
 * throws on one bad row shows nothing about the other five.
 */
export function stu06Row(id: Stu06CapabilityId): Stu06MatrixRow {
  return STU_06_MATRIX.find((row) => row.id === id) ?? MISSING_ROW(id)
}

function MISSING_ROW(id: Stu06CapabilityId): Stu06MatrixRow {
  const note = `No row for “${id}” is registered in MOD-STU-06’s matrix, so nothing is permitted.`
  const refused = cell('explicitlyProhibited', note)
  return {
    id,
    capability: id,
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: [],
    ...withDerivedColumns(
      {
        'quality-manager': refused,
        'supervisor-with-authoring-grant': refused,
        'supervisor-without-grant': refused,
        'tenant-admin': refused,
        'read-only-auditor': refused,
        worker: refused,
      },
      refused,
      note,
    ),
  }
}
