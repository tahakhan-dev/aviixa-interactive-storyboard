import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-07`'s own permission matrix — the source's table at **L32626
 * (header) and L32628-L32637 (ten data rows)**, transcribed cell by cell.
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
 * L32626's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker`. Both the
 * **Plant Manager persona** and the **`GRANT-STU-IMPL` implementation team**
 * columns, which the consolidated matrix at L34539 heads and which
 * `StudioPersonaColumn` carries, are absent from this module card entirely.
 * Each is filled below, from a named source line, and each fill is written
 * down on the row's `derivation` map rather than left to inference. A blank
 * cell reads as "withheld" without anybody writing it down, which is the
 * defect L10238 names one level up.
 *
 * ### THE ROUTED PROHIBITION — `routedTo`, and why it is per COLUMN
 *
 * This matrix carries the surface's sharpest disabled-with-reason case. Rows
 * 1, 2, 3, 6 and 7 give the Quality Manager standing and the
 * Supervisor-with-grant `Explicitly prohibited`, while **row 4 gives that
 * same Supervisor `Allowed`**. The prohibition is a **routing** rule, not a
 * categorical one: the control exists on this same screen for the Quality
 * Manager, and the Supervisor's own alternative — Propose — is one row
 * below.
 *
 * That distinction lives in DATA, never in a special case in a renderer.
 * `routedTo[column]` names the capability in THIS matrix that this persona
 * holds instead, or `null`. It is a `Record` over the eight columns, so the
 * condition sits on the cell rather than on the row — a row-level flag would
 * have routed the Worker and the Read-only Auditor to a Propose control they
 * are prohibited from too.
 *
 * And the pointer is CHECKED, not asserted: `libraryAffordance` renders the
 * disabled control only where the routed capability's own decision actually
 * permits that persona. Prohibit row 4 and rows 1/2/3/6/7 collapse back to
 * ABSENT, which is the correct rendering for a prohibition with nowhere to
 * send anyone.
 *
 * ### Rows 8 and 9 are NOT routed, and that is the other half of the rule
 *
 * `Explicitly prohibited — templates name roles, never individuals` and
 * `Explicitly prohibited — two channels only at V1` are refused in all eight
 * columns, the Quality Manager included. Their `routedTo` is `null`
 * everywhere, so they render as an ABSENCE — the token's rendering
 * everywhere it is categorical.
 *
 * ### The two conditions this matrix does NOT carry
 *
 * No cell in these ten rows names a commercial tier or a grant beyond the one
 * that opens its own column, so `requiredTiers` and `requiredGrant` are
 * `null` throughout. They are per-CELL fields, and writing `null` on each
 * cell is the answer rather than the absence of one.
 */

export type Stu07CapabilityId =
  | 'create-a-library-item'
  | 'edit-a-library-item'
  | 'archive-a-library-item'
  | 'propose-a-change'
  | 'reference-a-library-item-from-a-screen-picker'
  | 'approve-a-coaching-asset'
  | 'retire-a-flagged-coaching-asset'
  | 'name-an-individual-as-an-escalation-recipient'
  | 'add-a-notification-channel'
  | 'read-published-library-content'

export const STU_07_CAPABILITY_IDS = [
  'create-a-library-item',
  'edit-a-library-item',
  'archive-a-library-item',
  'propose-a-change',
  'reference-a-library-item-from-a-screen-picker',
  'approve-a-coaching-asset',
  'retire-a-flagged-coaching-asset',
  'name-an-individual-as-an-escalation-recipient',
  'add-a-notification-channel',
  'read-published-library-content',
] as const satisfies readonly Stu07CapabilityId[]

type MissingFromCapabilities = Exclude<
  Stu07CapabilityId,
  (typeof STU_07_CAPABILITY_IDS)[number]
>
const _capabilitiesExhaustive: MissingFromCapabilities extends never ? true : never = true
void _capabilitiesExhaustive

export interface Stu07MatrixRow extends StudioMatrixRow {
  readonly id: Stu07CapabilityId
  /** Read by `reachByStudioMatrix`'s clause one. */
  readonly surface: StudioMatrixRowSurface
  /**
   * PER COLUMN, never per row. Where a prohibited cell's own words name an
   * alternative this persona holds on this same screen, this is that
   * capability's id. `null` is the answer for a categorical prohibition, and
   * it is written on every column rather than omitted.
   */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu07CapabilityId | null>>
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
const PROPOSE_ONLY = cell('explicitlyProhibited', 'Explicitly prohibited — may propose only')

const PLANT_MANAGER_VIA_SUPERVISOR =
  'MOD-STU-07’s table (L32626) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers this ' +
  'persona’s Studio access through a Supervisor role without the authoring grant, so this cell is ' +
  'that column’s cell, and the consolidated matrix reads the two columns identically on all ' +
  'twenty-three of its rows. Derived Clarification.'

const IMPL_TEAM_FAILS_CLOSED =
  'MOD-STU-07’s table (L32626) heads no `GRANT-STU-IMPL` column, and the consolidated matrix ' +
  '(L34541-L34563) carries no Content Library row to transcribe one from. L34520 provisions the ' +
  'team “a provisioned, temporary authoring capacity during onboarding — author and submit only”, ' +
  'which is Workflow authoring; the Content Libraries are stated to be the Quality Manager’s own ' +
  '(L32628), and every non-Quality-Manager column the card DOES head is prohibited on this row. ' +
  'Refused, because L34605 is explicit that the Studio permits nothing it has not been told to ' +
  'permit. Derived Clarification, fail-closed.'

const IMPL_TEAM_READS =
  'MOD-STU-07’s table heads no `GRANT-STU-IMPL` column; the consolidated matrix states this one ' +
  'directly — “Read published Workflow content | … | `GRANT-STU-IMPL` | Allowed with conditions” ' +
  '(L34542). Transcribed from there. Derived Clarification.'

const UNIVERSAL_REFUSAL =
  'A universal refusal: the card’s own cell prohibits the Quality Manager, who owns these ' +
  'libraries, so no column this card omits can hold what its owner does not. No derivation is ' +
  'needed and none is invented.'

/** Every column answers `null` — the row routes nobody anywhere. */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, Stu07CapabilityId | null>> = {
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
 * The grant-holder, and nobody else, is routed to Propose. Written as an
 * override of `ROUTES_NOWHERE` so the seven columns that route nowhere keep
 * saying so explicitly.
 */
const ROUTES_GRANT_HOLDER_TO_PROPOSE: Readonly<
  Record<StudioPersonaColumn, Stu07CapabilityId | null>
> = { ...ROUTES_NOWHERE, 'supervisor-with-authoring-grant': 'propose-a-change' }

/**
 * The Plant Manager cell mirrors the without-grant cell and says so in its own
 * derivation rather than being silently aliased.
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
  const mirrored = cells['supervisor-without-grant']
  return {
    cells: {
      ...cells,
      'plant-manager-persona': mirrored,
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

/** The five rows that are the Quality Manager's alone, in the card's order. */
function ownershipRow(
  id: Stu07CapabilityId,
  capability: string,
  qualityManager: StudioMatrixCell,
  sourceRef: string,
  grantHolder: StudioMatrixCell = PROHIBITED,
): Stu07MatrixRow {
  return {
    id,
    capability,
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: [sourceRef],
    routedTo: ROUTES_GRANT_HOLDER_TO_PROPOSE,
    ...withDerivedColumns(
      {
        'quality-manager': qualityManager,
        'supervisor-with-authoring-grant': grantHolder,
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      IMPL_TEAM_FAILS_CLOSED,
    ),
  }
}

/**
 * `stage` is `null` on all ten rows. MOD-STU-07's card names no approval
 * stage: the chain that reviews a library edit is MOD-STU-11's, and
 * `DEC-LIBREV-001` is precisely the open question of which of its stages
 * apply. Writing a stage here would settle that decision silently.
 */
export const STU_07_MATRIX = [
  ownershipRow(
    'create-a-library-item',
    'Create a Content Library item',
    cell('allowed', 'Allowed — the Quality Manager owns the Content Libraries'),
    'L32628',
    PROPOSE_ONLY,
  ),
  ownershipRow(
    'edit-a-library-item',
    'Edit a Content Library item',
    cell(
      'allowedWithConditions',
      'Allowed with conditions — edits to published items pass review; scope under `DEC-LIBREV-001`',
      'DEC-LIBREV-001',
    ),
    'L32629',
    PROPOSE_ONLY,
  ),
  ownershipRow(
    'archive-a-library-item',
    'Archive a Content Library item',
    cell('allowed', 'Allowed'),
    'L32630',
  ),
  {
    id: 'propose-a-change',
    capability: 'Propose a Content Library change through the approval chain',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32631'],
    routedTo: ROUTES_NOWHERE,
    ...withDerivedColumns(
      {
        'quality-manager': cell('allowed', 'Allowed'),
        'supervisor-with-authoring-grant': cell(
          'allowed',
          'Allowed — propose Content Library changes',
        ),
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      IMPL_TEAM_FAILS_CLOSED,
    ),
  },
  {
    id: 'reference-a-library-item-from-a-screen-picker',
    capability: 'Reference a library item from a screen picker',
    // NOT a `screen` row. The picker is Section 6 and Section 7 of
    // `SCR-STU-04`, MOD-STU-05's screen configuration panel (L32580). Reach
    // to THIS module's route is derived from this module's own screens, and
    // classifying an act performed elsewhere as `screen` would let "may pick
    // an item over there" grant standing on the Content Libraries here.
    surface: 'another-surface',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32632', 'L32580'],
    routedTo: ROUTES_NOWHERE,
    ...withDerivedColumns(
      {
        'quality-manager': cell('allowed', 'Allowed'),
        'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      IMPL_TEAM_FAILS_CLOSED,
    ),
  },
  ownershipRow(
    'approve-a-coaching-asset',
    'Approve a coaching asset into the corpus',
    cell('allowed', 'Allowed'),
    'L32633',
  ),
  ownershipRow(
    'retire-a-flagged-coaching-asset',
    'Retire a flagged coaching asset',
    cell('allowed', 'Allowed'),
    'L32634',
  ),
  {
    id: 'name-an-individual-as-an-escalation-recipient',
    capability: 'Name an individual as an escalation recipient',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32635', 'AC-STU-075 L32767'],
    routedTo: ROUTES_NOWHERE,
    ...withDerivedColumns(
      {
        'quality-manager': cell(
          'explicitlyProhibited',
          'Explicitly prohibited — templates name roles, never individuals',
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
    id: 'add-a-notification-channel',
    capability: 'Add a notification channel beyond in-app and email',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32636', 'AC-STU-076 L32768'],
    routedTo: ROUTES_NOWHERE,
    ...withDerivedColumns(
      {
        'quality-manager': cell(
          'explicitlyProhibited',
          'Explicitly prohibited — two channels only at V1',
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
    id: 'read-published-library-content',
    capability: 'Read published library content',
    surface: 'screen',
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L32637', 'AC-STU-157 L34674'],
    routedTo: ROUTES_NOWHERE,
    ...withDerivedColumns(
      {
        'quality-manager': cell('allowed', 'Allowed'),
        'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
        'supervisor-without-grant': cell('readOnly', 'Read-only'),
        'tenant-admin': cell('readOnly', 'Read-only'),
        // AC-STU-157 (L34674) keeps this unassumed. §25.3 row 5 reads
        // `Read-only` for this persona and is the reading this build refuses
        // to adopt silently; the card's own cell is the authority.
        'read-only-auditor': cell(
          'clientDecisionRequired',
          'Client Decision Required — `DEC-AUDSTU-001`',
          'DEC-AUDSTU-001',
        ),
        worker: PROHIBITED,
      },
      cell('allowedWithConditions', 'Allowed with conditions — onboarding only'),
      IMPL_TEAM_READS,
    ),
  },
] as const satisfies readonly Stu07MatrixRow[]

type MissingFromMatrix = Exclude<Stu07CapabilityId, (typeof STU_07_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * One row, by id. Total over the ten — a defect in the registry surfaces as a
 * refusing row rather than as a crashed render, because a screen that throws
 * on one bad row shows nothing about the other nine.
 */
export function stu07Row(id: Stu07CapabilityId): Stu07MatrixRow {
  const found = STU_07_MATRIX.find((row) => row.id === id)
  return found ?? MISSING_ROW(id)
}

function MISSING_ROW(id: Stu07CapabilityId): Stu07MatrixRow {
  const note = `No row for “${id}” is registered in MOD-STU-07’s matrix, so nothing is permitted.`
  const refused = cell('explicitlyProhibited', note)
  return {
    id,
    capability: id,
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: [],
    routedTo: ROUTES_NOWHERE,
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
