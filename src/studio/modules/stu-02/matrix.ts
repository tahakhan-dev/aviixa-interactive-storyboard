import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-02`'s own permission matrix — the source's table at **L31729
 * (header), L31730 (separator) and L31731-L31739 (NINE data rows)**,
 * transcribed cell by cell.
 *
 * The brief cites the table as "L31729-L31739, nine data rows". The header
 * and the separator are inside that span; the nine DATA rows are
 * L31731-L31739. Both locators are recorded so a reader checking either one
 * lands on the right thing.
 *
 * ### ROW 7 IS THE INVERSION, AND IT IS `another-surface`
 *
 * "Change the Shift Handoff Agent's run time before shift end" (L31737) is
 * the ONE row on this surface where the Tenant Admin holds something the
 * Quality Manager does not, and the Quality Manager's own cell explains why:
 * `Allowed with conditions — a tenant-level setting administered in the
 * tenant administration area, read here`.
 *
 * **THE TOKEN READS `Allowed with conditions` AND IT IS STILL NOT A STUDIO
 * CONTROL.** The cell's own words put the act in the tenant administration
 * area — the Delivery Operations Hub — and give this surface the READ. So
 * the row is classified `another-surface`, `./rendering.ts` never puts it in
 * the control list, and `AgentConfigurationView` draws it as a read-only
 * field carrying the cell's own sentence. A build that drew a working
 * posture control off that `Allowed with conditions` would invert the
 * ownership the cell spends its whole note stating.
 *
 * ### `routedTo` IS `null` ON EVERY CELL, WRITTEN DOWN RATHER THAN ASSUMED
 *
 * A cell renders **disabled** only where its `routedTo` names a capability
 * the persona actually holds **on this surface**; a capability nobody holds
 * here renders **absent**. Rows 7 and 9 both have an alternative holder and
 * BOTH alternatives are on another surface — the tenant administration area
 * for row 7, the Client Command Center for row 9. Pointing `routedTo` at
 * either is exactly how a disabled Studio control gets justified by a
 * permission that lives somewhere else, so the map is present, total, and
 * null throughout, and `STU_02_CROSS_SURFACE` carries the two statements.
 *
 * ### ROW 8 IS CATEGORICAL, WITH NO HOLDER ANYWHERE
 *
 * "Change an agent's own reasoning logic" (L31738) is `Explicitly
 * prohibited` in all six columns the card heads and in both this file
 * derives, and no operator on any surface holds it: L31688 — "An agent does
 * not contain its own rules… The agent is the engine; the Studio is where
 * the engine is tuned." That is an ABSENCE, not a disabled control, and it
 * stays classified `screen` because a row whose every cell refuses is still
 * this screen's own disclosure that it offers nothing.
 *
 * ### THE CARD HEADS SIX COLUMNS; THE VOCABULARY HAS EIGHT
 *
 * L31729's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker`. Neither the
 * Plant Manager persona nor `GRANT-STU-IMPL` appears on it, and a blank cell
 * reads as "withheld" without anybody writing it down.
 *
 * - `plant-manager-persona` mirrors `supervisor-without-grant`, because
 *   `DEC-ROLE-001` (L34522) delivers that persona's Studio access "by a
 *   Supervisor role without the authoring grant".
 * - `implementation-team` is filled from the CONSOLIDATED matrix rows that
 *   state the same capability — "Author all nine configuration sections | …
 *   | `GRANT-STU-IMPL` | Allowed with conditions" (L34546) — with the row
 *   named on every cell, never guessed.
 */

export type Stu02RowId =
  | 'set-a-screens-timing-expectation-and-coaching-trigger'
  | 'designate-a-screens-curated-coaching-defaults'
  | 'map-a-band-to-a-severity-level'
  | 'select-the-containment-checklist-for-a-band'
  | 'select-or-override-the-escalation-routing-template'
  | 'set-the-repeated-coaching-alert-threshold-per-workflow'
  | 'change-the-shift-handoff-agents-run-time'
  | 'change-an-agents-own-reasoning-logic'
  | 'release-a-severity-1-hold-from-the-studio'

export const STU_02_ROW_IDS = [
  'set-a-screens-timing-expectation-and-coaching-trigger',
  'designate-a-screens-curated-coaching-defaults',
  'map-a-band-to-a-severity-level',
  'select-the-containment-checklist-for-a-band',
  'select-or-override-the-escalation-routing-template',
  'set-the-repeated-coaching-alert-threshold-per-workflow',
  'change-the-shift-handoff-agents-run-time',
  'change-an-agents-own-reasoning-logic',
  'release-a-severity-1-hold-from-the-studio',
] as const satisfies readonly Stu02RowId[]

type MissingFromRowIds = Exclude<Stu02RowId, (typeof STU_02_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

/** The card's own data-row count, L31731-L31739. Nine, and the count is a claim. */
export const STU_02_SOURCE_ROW_COUNT = 9

export interface Stu02MatrixRow extends StudioMatrixRow {
  readonly id: Stu02RowId
  /** Read by `reachByStudioMatrix`'s clause one. */
  readonly surface: StudioMatrixRowSurface
  /**
   * PER COLUMN, and `null` on every cell of every row — see the file header.
   * Written out rather than omitted, so "routes nowhere" is a statement this
   * matrix makes and the covering test can read.
   */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu02RowId | null>>
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
const READ_ONLY = cell('readOnly', 'Read-only')
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
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
  'MOD-STU-02’s table (L31729) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers this ' +
  'persona’s Studio access "by a Supervisor role without the authoring grant", so this cell is that ' +
  'column’s cell. Derived Clarification.'

const IMPL_TEAM_AUTHORING =
  'MOD-STU-02’s table heads no `GRANT-STU-IMPL` column. The consolidated matrix states the same ' +
  'capability class: "Author all nine configuration sections | … | `GRANT-STU-IMPL` | Allowed with ' +
  'conditions" (L34546), and every value this module configures is authored inside those nine ' +
  'sections. Derived Clarification.'

const IMPL_TEAM_UNIVERSAL_REFUSAL =
  'A universal refusal: this row’s own cell prohibits the Quality Manager, and no column the card ' +
  'omits can hold what the surface’s most capable authoring role does not. No derivation is needed ' +
  'and none is invented.'

const IMPL_TEAM_OUTSIDE_STUDIO =
  'The act is performed outside the Studio. L34520 provisions the implementation team "author and ' +
  'submit only", which is Workflow authoring; nothing in the source gives it the tenant ' +
  'administration area or the Client Command Center. Refused, because L34605 is explicit that the ' +
  'Studio permits nothing it has not been told to permit. Derived Clarification, fail-closed.'

/** Every column answers `null` — no row of this card routes anybody anywhere. */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, Stu02RowId | null>> = {
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
  id: Stu02RowId,
  capability: string,
  sourceRef: string,
  columns: CardColumns,
  derived: {
    readonly implementationTeam: StudioMatrixCell
    readonly implementationNote: string
    readonly surface?: StudioMatrixRowSurface
  },
): Stu02MatrixRow {
  return {
    id,
    capability,
    surface: derived.surface ?? 'screen',
    // No row of this card is `Read published Workflow content`; the
    // fail-closed floor's row lives on MOD-STU-18's consolidated matrix.
    isPublishedRead: false,
    // No row of this card occupies an approval stage. The chain that reviews
    // authored agent parameters is MOD-STU-11's, and writing a stage here
    // would settle separation of duties from the wrong module.
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

/**
 * Rows 1 to 6 read identically across all six columns the card heads
 * (L31731-L31736): `Allowed | Allowed | Read-only | Read-only | Client
 * Decision Required — DEC-AUDSTU-001 | Explicitly prohibited`.
 */
function authoringRow(id: Stu02RowId, capability: string, sourceRef: string): Stu02MatrixRow {
  return rowOf(
    id,
    capability,
    sourceRef,
    {
      qualityManager: ALLOWED,
      grantHolder: ALLOWED,
      withoutGrant: READ_ONLY,
      tenantAdmin: READ_ONLY,
      auditor: AUDITOR_OPEN,
      worker: PROHIBITED,
    },
    { implementationTeam: IMPL_TEAM_AUTHORS, implementationNote: IMPL_TEAM_AUTHORING },
  )
}

export const STU_02_MATRIX = [
  authoringRow(
    'set-a-screens-timing-expectation-and-coaching-trigger',
    'Set a screen’s timing expectation and coaching trigger',
    'L31731',
  ),
  authoringRow(
    'designate-a-screens-curated-coaching-defaults',
    'Designate a screen’s curated coaching defaults',
    'L31732',
  ),
  authoringRow(
    'map-a-band-to-a-severity-level',
    'Map a band to a severity level, arming its consequence',
    'L31733',
  ),
  authoringRow(
    'select-the-containment-checklist-for-a-band',
    'Select the containment checklist for a band',
    'L31734',
  ),
  authoringRow(
    'select-or-override-the-escalation-routing-template',
    'Select or override the escalation routing template',
    'L31735',
  ),
  authoringRow(
    'set-the-repeated-coaching-alert-threshold-per-workflow',
    'Set the repeated-coaching alert threshold per Workflow',
    'L31736',
  ),
  /**
   * ROW 7 — THE INVERSION. `another-surface`, for the reason
   * `StudioMatrixRowSurface` gives: the capability IS met, but not on a
   * Studio screen. Classified `screen`, the Tenant Admin's `Allowed` would
   * derive standing on THIS module's route from an act performed in the
   * tenant administration area, and the Quality Manager's `Allowed with
   * conditions` would draw an enabled Studio control for a tenant-level
   * setting this surface only reads.
   */
  rowOf(
    'change-the-shift-handoff-agents-run-time',
    'Change the Shift Handoff Agent’s run time before shift end',
    'L31737',
    {
      qualityManager: cell(
        'allowedWithConditions',
        'Allowed with conditions — a tenant-level setting administered in the tenant administration area, read here',
      ),
      grantHolder: READ_ONLY,
      withoutGrant: READ_ONLY,
      tenantAdmin: cell(
        'allowed',
        'Allowed — the tenant administration area is the Tenant Admin’s screen group',
      ),
      auditor: AUDITOR_OPEN,
      worker: PROHIBITED,
    },
    {
      implementationTeam: PROHIBITED,
      implementationNote: IMPL_TEAM_OUTSIDE_STUDIO,
      surface: 'another-surface',
    },
  ),
  /**
   * ROW 8 — CATEGORICAL, WITH NO HOLDER ANYWHERE. Stays `screen`: a row
   * whose every cell refuses is still this screen's own disclosure that it
   * offers nothing, and there is no other surface to point at.
   */
  rowOf(
    'change-an-agents-own-reasoning-logic',
    'Change an agent’s own reasoning logic',
    'L31738',
    {
      qualityManager: PROHIBITED,
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    { implementationTeam: PROHIBITED, implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL },
  ),
  /**
   * ROW 9 — PROHIBITED HERE, HELD ELSEWHERE. Every column reads `Explicitly
   * prohibited`, and the Quality Manager's cell names the holder rather than
   * leaving a bare refusal. `another-surface`, and `routedTo` stays null: the
   * alternative is the Client Command Center, and a `routedTo` pointing at it
   * would justify a disabled Studio control with a Command Center permission.
   */
  rowOf(
    'release-a-severity-1-hold-from-the-studio',
    'Release a Severity 1 hold from the Studio',
    'L31739',
    {
      qualityManager: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — release is a Client Command Center action, Quality Manager only',
      ),
      grantHolder: PROHIBITED,
      withoutGrant: PROHIBITED,
      tenantAdmin: PROHIBITED,
      auditor: PROHIBITED,
      worker: PROHIBITED,
    },
    {
      implementationTeam: PROHIBITED,
      implementationNote: IMPL_TEAM_OUTSIDE_STUDIO,
      surface: 'another-surface',
    },
  ),
] as const satisfies readonly Stu02MatrixRow[]

type MissingFromMatrix = Exclude<Stu02RowId, (typeof STU_02_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const BY_ID = new Map<Stu02RowId, Stu02MatrixRow>(STU_02_MATRIX.map((row) => [row.id, row]))

export function stu02Row(id: Stu02RowId): Stu02MatrixRow {
  const found = BY_ID.get(id)
  if (found === undefined) throw new Error(`MOD-STU-02: no matrix row named "${id}".`)
  return found
}

/**
 * The two rows whose capability is met on ANOTHER SURFACE, with the owning
 * surface named. A separate export rather than a `routedTo` target, for the
 * reason the file header gives: `routedTo` names a capability on THIS
 * surface, and these two are not on it.
 */
export interface Stu02CrossSurfaceStatement {
  readonly rowId: Stu02RowId
  /** Where the act is actually performed, in the cell's own words. */
  readonly owner: string
  /** What this Studio screen does instead. Never "nothing". */
  readonly whatThisScreenDoes: string
  readonly sourceRef: string
}

export const STU_02_CROSS_SURFACE = [
  {
    rowId: 'change-the-shift-handoff-agents-run-time',
    owner:
      'The tenant administration area, in the Delivery Operations Hub — "the tenant administration area is the Tenant Admin’s screen group" (L31737). Seam `shift-timing-for-handoff-schedule`, MOD-DOH-03.',
    whatThisScreenDoes:
      'Reads the lead time and displays it read-only beside the Shift Handoff Agent, exactly as the Quality Manager’s own cell says: "a tenant-level setting administered in the tenant administration area, read here". No Studio route offers a control for it.',
    sourceRef: 'L31737 · L67942',
  },
  {
    rowId: 'release-a-severity-1-hold-from-the-studio',
    owner:
      'The Client Command Center, Quality Manager only — "release is a Client Command Center action, Quality Manager only" (L31739). The agent cannot release it and neither can a supervisor (L31719).',
    whatThisScreenDoes:
      'States the consequence at configuration time and nothing more. The Severity 1 arming confirmation itself is MOD-STU-05’s Section 7; this screen renders a read-only cross-reference to it and does not implement it.',
    sourceRef: 'L31739 · L31719 · L31745',
  },
] as const satisfies readonly Stu02CrossSurfaceStatement[]
