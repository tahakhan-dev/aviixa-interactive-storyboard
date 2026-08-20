import type { PermissionOutcome } from '@/policy/decision'
import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-15`'s own permission matrix — the source's table at **L34007
 * (header), L34008 (separator) and L34009-L34020 (TWELVE data rows)**.
 *
 * The brief cites "L34007-L34020, twelve data rows"; header and separator sit
 * inside that span and the twelve DATA rows are L34009-L34020. Both locators
 * are recorded.
 *
 * ### THIS IS THE ONLY STUDIO MATRIX WHOSE COLUMNS ARE NOT THE VOCABULARY'S
 *
 * L34007 heads seven columns: `Quality Manager | Delegated administrator with
 * Agent Author | Supervisor with authoring grant | Tenant Admin | Read-only
 * Auditor | Worker | Platform Engineer`. **Two of them are not Studio persona
 * columns**, and inventing a persona for either would mint a role this build
 * refuses to mint:
 *
 * - **Delegated administrator with Agent Author** is a GRANT HOLDER, not a
 *   role, and `DEC-DELEG-001` is open on whether the grant may be delegated
 *   at all (D13).
 * - **Platform Engineer** is a real `RoleId` in the platform registry, and it
 *   reaches no Studio route: its two `Allowed with conditions` cells are both
 *   acts of the Super Admin platform console.
 *
 * Both are carried on `cardOnlyColumns`, verbatim, cell for cell. They render
 * on the matrix table and **no evaluation ever resolves to them**, which is
 * the honest answer: a column no persona reads is data, not a permission.
 *
 * ### ROW 1 — NOBODY HOLDS CAPABILITY ENABLEMENT
 *
 * All four tenant columns read `Client Decision Required — DEC-CAPAUTH-001`
 * (L34009), and the consolidated matrix repeats it (L34555, adding
 * `Explicitly prohibited` for the three columns this card does not head).
 * Enablement decides which of the nine configuration sections exist across
 * every Workflow, and it has **no authorised operator until the client
 * rules**. This module therefore holds NO enablement control: `MOD-STU-01`
 * owns the Atomic Capability view and its register, and this module reads
 * the seeded state through it (D12).
 *
 * ### ROW 3 — THE ONE PLACE THIS CARD AND THE CONSOLIDATED MATRIX CONTRADICT
 *
 * `Compose a reasoning agent`: this card's Supervisor-with-authoring-grant
 * cell reads **`Explicitly prohibited`** (L34011), while the consolidated
 * matrix's same-named row reads **`Allowed with conditions — only with
 * GRANT-STU-AGENT and Growth or Enterprise`** (L34554). Those are opposite
 * tokens for one persona on one capability.
 *
 * **The card wins, and `DEC-DELEG-001` is why**, not module precedence alone.
 * `MTX-TEN-02b` condition `[Y21]` (L22052) states the interim position in so
 * many words: *"Until decided, the build denies Supervisor access to the
 * Agent Builder and names the decision."* So the cell stays `Explicitly
 * prohibited` and its NOTE names `DEC-DELEG-001`, because a bare refusal
 * would hide the open decision and a `Client Decision Required` token would
 * render a control where §4.8.4 says there is none.
 *
 * ### ROW 7 — THE GATE BINDS THE ROOT ACCOUNT
 *
 * `Bypass the evaluation gate` is the only row whose Platform Engineer cell
 * is `Explicitly prohibited` rather than `Not applicable` or `Allowed with
 * conditions`, and the cell states why: "the gate binds every operator
 * including the root account". **The protection is by OMISSION** — the
 * service in `./builder.ts` has no bypass function at all — because a guard
 * can be deleted by a later refactor along with its tests, and an absent
 * reference cannot.
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
 * Rows 9 and 11 have alternative holders and both alternatives are on other
 * surfaces — the Super Admin platform console and the tenant administration
 * area — so `STU_15_CROSS_SURFACE` carries the statements. Row 1's
 * alternative is on this surface but on ANOTHER MODULE's screen, and nobody
 * holds it there either.
 *
 * The consuming path is `routedProhibitionApplies` in
 * `@/studio/modules/stu-18/rendering`, and the ten cards that reach it are
 * enumerated by slice 5 gate 17, which fails if this card ever declares the
 * field again without a fold that reads it.
 */

export type Stu15RowId =
  | 'enable-or-disable-a-capability-within-entitlement'
  | 'author-an-atomic-capability'
  | 'compose-a-reasoning-agent'
  | 'compose-an-action-agent'
  | 'configure-a-standard-action-agent-through-the-nine-section-panel'
  | 'submit-a-composed-agent-to-the-evaluation-gate'
  | 'bypass-the-evaluation-gate'
  | 'route-a-composed-agent-through-the-approval-chain'
  | 'perform-the-platform-level-review'
  | 'map-a-composed-agent-to-workflows-screens-and-triggers'
  | 'assign-or-revoke-the-agent-author-delegation'
  | 'view-composed-agent-status-and-mappings'

export const STU_15_ROW_IDS = [
  'enable-or-disable-a-capability-within-entitlement',
  'author-an-atomic-capability',
  'compose-a-reasoning-agent',
  'compose-an-action-agent',
  'configure-a-standard-action-agent-through-the-nine-section-panel',
  'submit-a-composed-agent-to-the-evaluation-gate',
  'bypass-the-evaluation-gate',
  'route-a-composed-agent-through-the-approval-chain',
  'perform-the-platform-level-review',
  'map-a-composed-agent-to-workflows-screens-and-triggers',
  'assign-or-revoke-the-agent-author-delegation',
  'view-composed-agent-status-and-mappings',
] as const satisfies readonly Stu15RowId[]

type MissingFromRowIds = Exclude<Stu15RowId, (typeof STU_15_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

/** The card's own data-row count, L34009-L34020. Twelve, and the count is a claim. */
export const STU_15_SOURCE_ROW_COUNT = 12

/**
 * The two columns the card heads that the Studio persona vocabulary does not.
 * Kept as their own key space so that nothing can accidentally evaluate one:
 * `StudioAccessInput` takes `cells`, and `cells` is keyed on
 * `StudioPersonaColumn`, which neither of these is.
 */
export type Stu15CardOnlyColumn = 'delegated-administrator-with-agent-author' | 'platform-engineer'

export const STU_15_CARD_ONLY_COLUMNS = [
  'delegated-administrator-with-agent-author',
  'platform-engineer',
] as const satisfies readonly Stu15CardOnlyColumn[]

type MissingFromCardOnly = Exclude<Stu15CardOnlyColumn, (typeof STU_15_CARD_ONLY_COLUMNS)[number]>
const _cardOnlyExhaustive: MissingFromCardOnly extends never ? true : never = true
void _cardOnlyExhaustive

export const STU_15_CARD_ONLY_COLUMN_NAMES = {
  'delegated-administrator-with-agent-author': 'Delegated administrator with Agent Author',
  'platform-engineer': 'Platform Engineer',
} as const satisfies Readonly<Record<Stu15CardOnlyColumn, string>>

/**
 * A card-only cell. Typed on the full nine-token `PermissionOutcome` rather
 * than on the Studio's six, because the Platform Engineer column uses `Not
 * applicable` — a token no Studio persona cell may carry and the evaluator's
 * `StudioCellOutcome` deliberately excludes.
 */
export interface Stu15CardCell {
  readonly outcome: PermissionOutcome
  /** The cell's own words from the card, verbatim. */
  readonly note: string
  readonly openDecision: string | null
}

export interface Stu15MatrixRow extends StudioMatrixRow {
  readonly id: Stu15RowId
  readonly surface: StudioMatrixRowSurface
  readonly derivation: Readonly<Record<StudioPersonaColumn, string | null>>
  /** The card's own two extra columns. Rendered; never evaluated. */
  readonly cardOnlyColumns: Readonly<Record<Stu15CardOnlyColumn, Stu15CardCell>>
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
  extra: {
    readonly requiredTiers?: StudioMatrixCell['requiredTiers']
    readonly requiredGrant?: StudioMatrixCell['requiredGrant']
  } = {},
): StudioMatrixCell {
  return {
    outcome,
    note,
    openDecision,
    requiredTiers: extra.requiredTiers ?? null,
    requiredGrant: extra.requiredGrant ?? null,
  }
}

function cardCell(
  outcome: PermissionOutcome,
  note: string,
  openDecision: string | null = null,
): Stu15CardCell {
  return { outcome, note, openDecision }
}

const ALLOWED = cell('allowed', 'Allowed')
const READ_ONLY = cell('readOnly', 'Read-only')
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const AUDITOR_OPEN = cell(
  'clientDecisionRequired',
  'Client Decision Required — DEC-AUDSTU-001',
  'DEC-AUDSTU-001',
)
const CAPAUTH_OPEN = cell(
  'clientDecisionRequired',
  'Client Decision Required — DEC-CAPAUTH-001',
  'DEC-CAPAUTH-001',
)

/**
 * `DEC-DELEG-001`'s rendering, and the reason it is a `clientDecisionRequired`
 * cell rather than the card's own `Explicitly prohibited unless holding the
 * delegated Agent Author capability`.
 *
 * The card's Tenant Admin cell on row 3 grants nothing EXCEPT through
 * delegation, and §4.8.4 states plainly that "Delegation is deferred beyond
 * V1". So the whole of that cell's grant hangs on an open decision, and
 * `Client Decision Required` is the only token that renders both readings.
 * D13 is this build's disclosure of it.
 */
const DELEG_OPEN = cell(
  'clientDecisionRequired',
  'Client Decision Required — DEC-DELEG-001. The card reads “Explicitly prohibited unless holding the delegated Agent Author capability” (L34011); §4.8.4 states delegation is deferred beyond V1, so the whole of this cell’s grant hangs on the open decision and neither reading is settled here',
  'DEC-DELEG-001',
)

/** Row 3's Supervisor cell — refused, with the open decision NAMED in its words. */
const SUPERVISOR_COMPOSE_DENIED = cell(
  'explicitlyProhibited',
  'Explicitly prohibited (L34011). MTX-TEN-02b condition [Y21] (L22052): “Until decided, the build denies Supervisor access to the Agent Builder and names the decision” — DEC-DELEG-001. The consolidated matrix reads “Allowed with conditions — only with GRANT-STU-AGENT and Growth or Enterprise” (L34554) for this same persona; the card and [Y21] govern, and the divergence is recorded rather than smoothed',
)

const NOT_APPLICABLE_CONSOLE = cardCell(
  'notApplicable',
  'Not applicable — the console sets entitlement, not enablement',
)

const PLANT_MANAGER_MIRRORS =
  'MOD-STU-15’s table (L34007) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers this ' +
  'persona’s Studio access "by a Supervisor role without the authoring grant", so this cell is that ' +
  'column’s cell. Derived Clarification.'

const WITHOUT_GRANT_FAIL_CLOSED =
  'MOD-STU-15’s table heads no Supervisor-without-grant column. The consolidated matrix does, and ' +
  'reads `Explicitly prohibited` for it on every Agent Builder row it states (L34554, L34555). ' +
  'Where the consolidated matrix states nothing, the cell is refused because L34605 permits the ' +
  'Studio nothing it has not been told to permit, and because a persona without the grant cannot ' +
  'hold what the grant holder one column over is already refused. Derived Clarification, fail-closed.'

const WITHOUT_GRANT_READS_PUBLISHED =
  'MOD-STU-15’s table heads no Supervisor-without-grant column. This row names MOD-STU-05’s ' +
  'capability, and MOD-STU-05’s own card reads `Read-only on published content only` for that ' +
  'persona (L32260). FINDING: the consolidated matrix reads `Explicitly prohibited` on the same ' +
  'capability (L34546). Both refuse authoring; they differ on what else the persona may do, and the ' +
  'owning module’s card is taken so that two Studio modules do not render one capability oppositely ' +
  'for one persona. Derived Clarification.'

const IMPL_TEAM_AUTHORS = cell(
  'allowedWithConditions',
  'Allowed with conditions — a provisioned, temporary authoring capacity during onboarding; author and submit only, fully audited, revoked at onboarding’s end',
)

const IMPL_TEAM_NINE_SECTIONS =
  'MOD-STU-15’s table heads no `GRANT-STU-IMPL` column. The consolidated matrix states this exact ' +
  'capability: "Author all nine configuration sections | … | `GRANT-STU-IMPL` | Allowed with ' +
  'conditions" (L34546). Derived Clarification.'

const IMPL_TEAM_NO_AGENT_BUILDER =
  'The implementation team’s capacity is "author and submit only" over Workflow content (L34520), ' +
  'and nothing in the source gives it the Agent Builder, the Agent Author capability, or a stage of ' +
  'the approval chain ("Explicitly prohibited — author and submit only", L34561). Refused, ' +
  'fail-closed under L34605. Derived Clarification.'

const IMPL_TEAM_UNIVERSAL_REFUSAL =
  'A universal refusal: this row’s own cell prohibits the Quality Manager, and no column the card ' +
  'omits can hold what the surface’s most capable authoring role does not. No derivation is needed ' +
  'and none is invented.'

interface RowInput {
  readonly id: Stu15RowId
  readonly capability: string
  readonly sourceRef: string
  readonly qualityManager: StudioMatrixCell
  readonly grantHolder: StudioMatrixCell
  readonly withoutGrant: StudioMatrixCell
  readonly tenantAdmin: StudioMatrixCell
  readonly auditor: StudioMatrixCell
  readonly worker: StudioMatrixCell
  readonly implementationTeam: StudioMatrixCell
  readonly implementationNote: string
  readonly withoutGrantNote: string
  readonly delegated: Stu15CardCell
  readonly platformEngineer: Stu15CardCell
  readonly surface?: StudioMatrixRowSurface
}

function rowOf(input: RowInput): Stu15MatrixRow {
  return {
    id: input.id,
    capability: input.capability,
    surface: input.surface ?? 'screen',
    isPublishedRead: false,
    // MOD-STU-11 owns the chain and its three stages. Row 8 ENTERS the chain
    // rather than occupying a stage of it, and the stage a person may take
    // differs by column ("may act as Reviewer on a composition they did not
    // author"), which a per-ROW field cannot express. Writing a stage here
    // would settle separation of duties from the wrong module.
    stage: null,
    sourceRefs: [input.sourceRef],
    cells: {
      'quality-manager': input.qualityManager,
      'supervisor-with-authoring-grant': input.grantHolder,
      'supervisor-without-grant': input.withoutGrant,
      'plant-manager-persona': input.withoutGrant,
      'tenant-admin': input.tenantAdmin,
      'read-only-auditor': input.auditor,
      worker: input.worker,
      'implementation-team': input.implementationTeam,
    },
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': input.withoutGrantNote,
      'plant-manager-persona': PLANT_MANAGER_MIRRORS,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': input.implementationNote,
    },
    cardOnlyColumns: {
      'delegated-administrator-with-agent-author': input.delegated,
      'platform-engineer': input.platformEngineer,
    },
  }
}

export const STU_15_MATRIX = [
  rowOf({
    id: 'enable-or-disable-a-capability-within-entitlement',
    capability: 'Enable or disable a capability within entitlement',
    sourceRef: 'L34009',
    qualityManager: CAPAUTH_OPEN,
    grantHolder: CAPAUTH_OPEN,
    withoutGrant: PROHIBITED,
    tenantAdmin: CAPAUTH_OPEN,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_NO_AGENT_BUILDER,
    withoutGrantNote:
      'The consolidated matrix states this exact capability and reads `Explicitly prohibited` for ' +
      'the Supervisor-without-grant column: "Enable or disable an atomic capability" (L34555).',
    delegated: cardCell(
      'clientDecisionRequired',
      'Client Decision Required — DEC-CAPAUTH-001',
      'DEC-CAPAUTH-001',
    ),
    platformEngineer: NOT_APPLICABLE_CONSOLE,
  }),
  rowOf({
    id: 'author-an-atomic-capability',
    capability: 'Author an atomic capability',
    sourceRef: 'L34010',
    qualityManager: PROHIBITED,
    grantHolder: PROHIBITED,
    withoutGrant: PROHIBITED,
    tenantAdmin: PROHIBITED,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
    withoutGrantNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
    delegated: cardCell('explicitlyProhibited', 'Explicitly prohibited'),
    platformEngineer: cardCell(
      'allowedWithConditions',
      'Allowed with conditions — engineering change, evaluations written, evaluation gate, Admin approval',
    ),
  }),
  rowOf({
    id: 'compose-a-reasoning-agent',
    capability: 'Compose a reasoning agent',
    sourceRef: 'L34011',
    qualityManager: cell(
      'allowedWithConditions',
      'Allowed with conditions — holds or delegates the Agent Author capability; Growth or Enterprise tier',
      null,
      { requiredTiers: ['Growth', 'Enterprise'] },
    ),
    grantHolder: SUPERVISOR_COMPOSE_DENIED,
    withoutGrant: PROHIBITED,
    tenantAdmin: DELEG_OPEN,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_NO_AGENT_BUILDER,
    withoutGrantNote: WITHOUT_GRANT_FAIL_CLOSED,
    delegated: cardCell(
      'clientDecisionRequired',
      'The card reads “Allowed with conditions — delegated Agent Author; Growth or Enterprise tier” (L34011). Rendered Client Decision Required under DEC-DELEG-001: §4.8.4 states delegation is deferred beyond V1, and building this cell as a grant would contradict a stated fact',
      'DEC-DELEG-001',
    ),
    platformEngineer: cardCell(
      'notApplicable',
      'Not applicable — composition is a tenant act',
    ),
  }),
  rowOf({
    id: 'compose-an-action-agent',
    capability: 'Compose an action agent',
    sourceRef: 'L34012',
    qualityManager: cell(
      'explicitlyProhibited',
      'Explicitly prohibited — action agents are configured, not composed',
    ),
    grantHolder: PROHIBITED,
    withoutGrant: PROHIBITED,
    tenantAdmin: PROHIBITED,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
    withoutGrantNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
    delegated: cardCell('explicitlyProhibited', 'Explicitly prohibited'),
    platformEngineer: cardCell(
      'notApplicable',
      'Not applicable — action agents ship as platform templates',
    ),
  }),
  rowOf({
    id: 'configure-a-standard-action-agent-through-the-nine-section-panel',
    capability: 'Configure a standard action agent through the nine-section panel',
    sourceRef: 'L34013',
    qualityManager: ALLOWED,
    grantHolder: ALLOWED,
    withoutGrant: cell('readOnly', 'Read-only on published content only'),
    tenantAdmin: PROHIBITED,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: IMPL_TEAM_AUTHORS,
    implementationNote: IMPL_TEAM_NINE_SECTIONS,
    withoutGrantNote: WITHOUT_GRANT_READS_PUBLISHED,
    delegated: cardCell(
      'allowedWithConditions',
      'Allowed with conditions — where they also hold the authoring grant',
    ),
    platformEngineer: cardCell(
      'notApplicable',
      'Not applicable — configuration is tenant authoring',
    ),
  }),
  rowOf({
    id: 'submit-a-composed-agent-to-the-evaluation-gate',
    capability: 'Submit a composed agent to the evaluation gate',
    sourceRef: 'L34014',
    qualityManager: ALLOWED,
    grantHolder: PROHIBITED,
    withoutGrant: PROHIBITED,
    tenantAdmin: PROHIBITED,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_NO_AGENT_BUILDER,
    withoutGrantNote: WITHOUT_GRANT_FAIL_CLOSED,
    delegated: cardCell('allowed', 'Allowed'),
    platformEngineer: cardCell('notApplicable', 'Not applicable — submission is a tenant act'),
  }),
  rowOf({
    id: 'bypass-the-evaluation-gate',
    capability: 'Bypass the evaluation gate',
    sourceRef: 'L34015',
    qualityManager: PROHIBITED,
    grantHolder: PROHIBITED,
    withoutGrant: PROHIBITED,
    tenantAdmin: PROHIBITED,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
    withoutGrantNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
    delegated: cardCell('explicitlyProhibited', 'Explicitly prohibited'),
    platformEngineer: cardCell(
      'explicitlyProhibited',
      'Explicitly prohibited — the gate binds every operator including the root account',
    ),
  }),
  rowOf({
    id: 'route-a-composed-agent-through-the-approval-chain',
    capability: 'Route a composed agent through the approval chain',
    sourceRef: 'L34016',
    qualityManager: cell(
      'allowedWithConditions',
      'Allowed with conditions — subject to separation of duties',
    ),
    grantHolder: cell(
      'allowedWithConditions',
      'Allowed with conditions — may act as Reviewer on a composition they did not author',
    ),
    withoutGrant: PROHIBITED,
    tenantAdmin: PROHIBITED,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_NO_AGENT_BUILDER,
    withoutGrantNote:
      'The consolidated matrix reads `Explicitly prohibited` for the Supervisor-without-grant ' +
      'column on "Act as Reviewer" (L34549) and on "Hold any stage of the approval chain" ' +
      '(L34561). Without the authoring grant this persona holds no stage. Derived Clarification.',
    delegated: cardCell('allowedWithConditions', 'Allowed with conditions — same'),
    platformEngineer: cardCell('notApplicable', 'Not applicable'),
  }),
  rowOf({
    id: 'perform-the-platform-level-review',
    capability: 'Perform the platform-level review',
    sourceRef: 'L34017',
    qualityManager: PROHIBITED,
    grantHolder: PROHIBITED,
    withoutGrant: PROHIBITED,
    tenantAdmin: PROHIBITED,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
    withoutGrantNote: IMPL_TEAM_UNIVERSAL_REFUSAL,
    delegated: cardCell('explicitlyProhibited', 'Explicitly prohibited'),
    platformEngineer: cardCell(
      'allowedWithConditions',
      'Allowed with conditions — in the Super Admin platform console',
    ),
    surface: 'another-surface',
  }),
  rowOf({
    id: 'map-a-composed-agent-to-workflows-screens-and-triggers',
    capability: 'Map a composed agent to Workflows, screens, and triggers',
    sourceRef: 'L34018',
    qualityManager: ALLOWED,
    grantHolder: PROHIBITED,
    withoutGrant: PROHIBITED,
    tenantAdmin: PROHIBITED,
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_NO_AGENT_BUILDER,
    withoutGrantNote: WITHOUT_GRANT_FAIL_CLOSED,
    delegated: cardCell('allowed', 'Allowed'),
    platformEngineer: cardCell('notApplicable', 'Not applicable'),
  }),
  rowOf({
    id: 'assign-or-revoke-the-agent-author-delegation',
    capability: 'Assign or revoke the Agent Author delegation',
    sourceRef: 'L34019',
    qualityManager: cell(
      'explicitlyProhibited',
      'Explicitly prohibited — administration of Studio capacities sits with the Tenant Admin',
    ),
    grantHolder: PROHIBITED,
    withoutGrant: PROHIBITED,
    tenantAdmin: cell('allowed', 'Allowed — per the tenant administration area'),
    auditor: PROHIBITED,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_NO_AGENT_BUILDER,
    withoutGrantNote: WITHOUT_GRANT_FAIL_CLOSED,
    delegated: cardCell('explicitlyProhibited', 'Explicitly prohibited'),
    platformEngineer: cardCell('notApplicable', 'Not applicable'),
    surface: 'another-surface',
  }),
  rowOf({
    id: 'view-composed-agent-status-and-mappings',
    capability: 'View composed-agent status and mappings',
    sourceRef: 'L34020',
    qualityManager: ALLOWED,
    grantHolder: READ_ONLY,
    withoutGrant: PROHIBITED,
    tenantAdmin: READ_ONLY,
    auditor: AUDITOR_OPEN,
    worker: PROHIBITED,
    implementationTeam: PROHIBITED,
    implementationNote: IMPL_TEAM_NO_AGENT_BUILDER,
    withoutGrantNote:
      'A composed agent in governance is an in-review object, and the consolidated matrix reads ' +
      '`Explicitly prohibited` for the Supervisor-without-grant column on "Read drafts and ' +
      'in-review versions" (L34544). Its published-content read (L34543) does not reach a ' +
      'composition that has not been deployed. Derived Clarification, fail-closed.',
    delegated: cardCell('allowed', 'Allowed'),
    platformEngineer: cardCell(
      'allowedWithConditions',
      'Allowed with conditions — through a named access class only',
    ),
  }),
] as const satisfies readonly Stu15MatrixRow[]

type MissingFromMatrix = Exclude<Stu15RowId, (typeof STU_15_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const BY_ID = new Map<Stu15RowId, Stu15MatrixRow>(STU_15_MATRIX.map((row) => [row.id, row]))

export function stu15Row(id: Stu15RowId): Stu15MatrixRow {
  const found = BY_ID.get(id)
  if (found === undefined) throw new Error(`MOD-STU-15: no matrix row named "${id}".`)
  return found
}

/**
 * The rows whose capability is met on ANOTHER SURFACE, with the owner named.
 * Separate from `routedTo` for the reason the file header gives.
 */
export interface Stu15CrossSurfaceStatement {
  readonly rowId: Stu15RowId
  readonly owner: string
  readonly whatThisScreenDoes: string
  readonly sourceRef: string
}

export const STU_15_CROSS_SURFACE = [
  {
    rowId: 'perform-the-platform-level-review',
    owner:
      'Platform operators in the Super Admin platform console — "Allowed with conditions — in the Super Admin platform console" (L34017). Every tenant role is explicitly prohibited.',
    whatThisScreenDoes:
      'Shows the platform-review gate on the governance track with its outcome, timestamp and decider where one is recorded, and holds the composition at Platform review where none is. It offers no review control and never advances the state itself.',
    sourceRef: 'L34017 · L34047',
  },
  {
    rowId: 'assign-or-revoke-the-agent-author-delegation',
    owner:
      'The Tenant Admin, in the tenant administration area — "Allowed — per the tenant administration area" (L34019). Seam `grant-assignment-and-revocation`, MOD-DOH-09.',
    whatThisScreenDoes:
      'States who holds the Agent Author capability and where it is administered. No Studio route assigns or revokes it, and DEC-DELEG-001 is open on whether it may be delegated at all.',
    sourceRef: 'L34019 · L34532',
  },
] as const satisfies readonly Stu15CrossSurfaceStatement[]
