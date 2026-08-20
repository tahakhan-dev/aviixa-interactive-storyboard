import { scenarioRunId, tenantId, type TenantId } from '@/domain/ids'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import type { PermissionOutcome } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type IdentityLayerState,
  type StudioAccessDecision,
  type StudioAccessInput,
  type StudioIdentity,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioCommercialTier, StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import { stu18Row, type Stu18MatrixRow } from './matrix'

/**
 * The rendering rule for `MOD-STU-18`, decided ONCE and read by both of this
 * module's screens.
 *
 * WHY THIS DOES NOT REUSE `src/ui/WriteControl`. Its ABSENT branch now keys
 * on `decision.reasonCode === 'ROLE_NOT_GRANTED' && decision.outcome ===
 * 'explicitlyProhibited'` — the same OUTCOME-keyed rule this file reached
 * independently, so the one-reason-code-two-renderings collision that used
 * to separate the two files is closed. What still keeps this file its own
 * module is the shape of `affordanceFor`'s other branches, which
 * `WriteControl` cannot express with the fields it takes:
 *
 * - `readOnly` renders THE CELL'S OWN WORDS (`decision.reason`) with no
 *   further composition — `WriteControl`'s disabled branch instead appends a
 *   fixed "Nothing here is queued... (D7)" sentence to every non-allowed
 *   decision, which would misstate a read-only cell as a refused write.
 * - `clientDecisionRequired` is not a disabled control at all — it renders
 *   `kind: 'decision-open'`, showing both readings and the open decision id.
 *   `WriteControl` has no third shape; it would fold this into the same
 *   disabled button as `unavailable`.
 * - `queuedOffline` and `cachedReadOnlyOffline` must never reach this
 *   surface (L34637 — the Studio has no offline mode) and this file THROWS
 *   if one does, surfacing a matrix/evaluator defect immediately.
 *   `WriteControl` has no such guard and would silently render one as an
 *   ordinary disabled button.
 *
 * THE RULE, and the two tokens it exists to keep apart:
 *
 * | outcome                | affordance              | why |
 * |------------------------|-------------------------|-----|
 * | allowed                | enabled                 | |
 * | allowedWithConditions  | enabled, conditions named | |
 * | readOnly               | disabled, THE CELL'S OWN WORDS as the reason | row 21's token GRANTS an export inside itself |
 * | unavailable            | disabled, condition named | sense A — exists, withheld by a condition |
 * | clientDecisionRequired | no control; both readings and the decision | |
 * | explicitlyProhibited   | ABSENT — a note where a control would be | the token carries no rendering anywhere |
 *
 * `readOnly` is deliberately NOT mapped to a bare disabled control. The
 * reason rendered is `decision.reason`, which carries the cell's own words,
 * so `Read-only — may generate the read-only export` states the export it
 * grants instead of losing it to a mechanical mapping.
 *
 * NO POLICY LIVES UNDER `src/ui/`. This file is under `src/studio/`, it
 * computes decisions, and the components it feeds only draw.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 * Every register is a parameter or a frozen seed.
 */

/* ==================================================================== *
 * The seeded scenario. Bright Bikes, the source's own illustrative
 * tenant (L34633).
 * ==================================================================== */

export const SEEDED_TENANT: TenantId = tenantId('TEN-BRIGHT-BIKES')

/** L34586 gates the Agent Author capability to Growth and Enterprise. */
export const SEEDED_TIER: StudioCommercialTier = 'Enterprise'

export const SEEDED_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('STU-18-PERMISSIONS-AND-ROLES')),
  SEEDED_TENANT,
  (partition) => ({
    ...partition,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE',
    tier: SEEDED_TIER,
  }),
)

/**
 * One seeded identity per matrix column.
 *
 * The names are the source's own from the `MOD-STU-18` illustrative example
 * at L34633 — Priya administers grants, Sam receives `GRANT-STU-AUTHOR`,
 * Elena receives the Agent Author delegation, Omar is the Read-only Auditor,
 * Maya has no Studio access. Two columns the source names nobody for carry
 * neutral identifiers and say so.
 *
 * `plant-manager-persona` and `implementation-team` map to `SUPERVISOR`
 * because that is what the source says delivers them, not because a role of
 * either name exists:
 *
 * - `DEC-ROLE-001` (L34522): the Plant Manager is "a persona whose Studio
 *   access is delivered by a Supervisor role without the authoring grant".
 *   Task 1's evaluator therefore never resolves that COLUMN — it resolves
 *   `supervisor-without-grant`, which is the decision's own position — and
 *   this module discloses the substitution on screen rather than hiding it.
 * - `GRANT-STU-IMPL` attaches to whatever tenant role the person holds
 *   (L34588); the source states none, so a Supervisor is seeded and the
 *   absence is stated.
 */
const SEEDED_IDENTITIES = {
  'quality-manager': { identityId: 'IDN-BB-ELENA', roles: ['QUALITY_MANAGER'] },
  'supervisor-with-authoring-grant': { identityId: 'IDN-BB-SAM', roles: ['SUPERVISOR'] },
  'supervisor-without-grant': { identityId: 'IDN-BB-TOMAS', roles: ['SUPERVISOR'] },
  'plant-manager-persona': { identityId: 'IDN-BB-PLANT', roles: ['SUPERVISOR'] },
  'tenant-admin': { identityId: 'IDN-BB-PRIYA', roles: ['TENANT_ADMIN'] },
  'read-only-auditor': { identityId: 'IDN-BB-OMAR', roles: ['READONLY_AUDITOR'] },
  worker: { identityId: 'IDN-BB-MAYA', roles: ['WORKER'] },
  'implementation-team': { identityId: 'IDN-BB-IMPL', roles: ['SUPERVISOR'] },
} as const satisfies Readonly<
  Record<StudioPersonaColumn, { readonly identityId: string; readonly roles: readonly RoleId[] }>
>

export function studioIdentityFor(persona: StudioPersonaColumn): StudioIdentity {
  const seed = SEEDED_IDENTITIES[persona]
  return {
    identityId: seed.identityId,
    roles: seed.roles,
    signedIn: true,
    tenant: SEEDED_TENANT,
  }
}

/**
 * Everything a reviewer can vary from the screen's own controls. Each field
 * is a real input of `MOD-STU-18` as its Inputs line puts them (L34567):
 * role assignments, grant assignments, the tenant's commercial tier, and the
 * submission's stage occupancy.
 *
 * `null` on a grant means NOT RECORDED, which is a different thing from
 * `Revoked`: a grant that was never held cannot be reported as revoked, and
 * task 1's evaluator keeps the two apart.
 */
export interface Stu18Scenario {
  readonly persona: StudioPersonaColumn
  readonly online: boolean
  readonly identityLayer: IdentityLayerState
  readonly commercialTier: StudioCommercialTier
  readonly authoringGrant: StudioGrantState | null
  readonly agentGrant: StudioGrantState | null
  readonly implGrant: StudioGrantState | null
}

export const SEEDED_SCENARIO: Stu18Scenario = {
  persona: 'quality-manager',
  online: true,
  identityLayer: 'reachable',
  commercialTier: SEEDED_TIER,
  authoringGrant: 'Active',
  agentGrant: null,
  implGrant: 'Active',
}

/**
 * Which grants the identity layer reports for this persona.
 *
 * `GRANT-STU-AUTHOR` is recorded only where a column is opened by it and
 * `GRANT-STU-IMPL` only for the implementation team, because recording a
 * grant on a persona no column opens with it would make the evaluator report
 * a revocation for something that was never the obstacle.
 */
export function studioGrantsFor(
  s: Stu18Scenario,
): Readonly<Partial<Record<StudioGrantId, StudioGrantState>>> {
  const out: Partial<Record<StudioGrantId, StudioGrantState>> = {}
  if (s.persona === 'supervisor-with-authoring-grant' && s.authoringGrant !== null) {
    out['GRANT-STU-AUTHOR'] = s.authoringGrant
  }
  if (s.persona === 'implementation-team' && s.implGrant !== null) {
    out['GRANT-STU-IMPL'] = s.implGrant
  }
  if (s.agentGrant !== null) out['GRANT-STU-AGENT'] = s.agentGrant
  return out
}

/** Who occupies which approval stage on the submission in view. */
export interface StageOccupancy {
  readonly identity?: StudioIdentity
  readonly authorOfRecord?: string | null
  readonly reviewerOfRecord?: string | null
  readonly releaseAuthorityOfRecord?: string | null
}

/**
 * THE ONE ACCESS CALL THIS MODULE MAKES. Every affordance on both screens
 * routes through here, per control, over the matrix ROW — never over a
 * module-level role list.
 */
export function decisionForRow(
  row: Stu18MatrixRow,
  s: Stu18Scenario,
  occupancy: StageOccupancy = {},
): StudioAccessDecision {
  const input: StudioAccessInput = {
    row,
    identity: occupancy.identity ?? studioIdentityFor(s.persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    authorOfRecord: occupancy.authorOfRecord ?? null,
    reviewerOfRecord: occupancy.reviewerOfRecord ?? null,
    releaseAuthorityOfRecord: occupancy.releaseAuthorityOfRecord ?? null,
  }
  return evaluateStudioAccess(input)
}

/* ==================================================================== *
 * The affordance rule.
 * ==================================================================== */

export type CapabilityAffordance =
  | { readonly kind: 'enabled'; readonly label: string; readonly note: string }
  | { readonly kind: 'disabled'; readonly label: string; readonly reason: string }
  | { readonly kind: 'absent'; readonly note: string }
  | {
      readonly kind: 'decision-open'
      readonly label: string
      readonly openDecision: string
      readonly note: string
    }

function withCondition(decision: StudioAccessDecision): string {
  const condition = decision.decision.conditionToEnable
  return condition === null ? decision.reason : `${decision.reason} ${condition}`
}

/**
 * The rendering for ONE control, given the decision the evaluator produced
 * for it. Handed a decision; computes no permission of its own.
 */
export function affordanceFor(
  label: string,
  decision: StudioAccessDecision,
): CapabilityAffordance {
  const outcome: PermissionOutcome = decision.outcome
  switch (outcome) {
    case 'allowed':
    case 'allowedWithConditions':
      return { kind: 'enabled', label, note: decision.reason }

    // NOT a bare disabled control: the reason carries the cell's own words,
    // so a token that grants something inside itself keeps saying so.
    case 'readOnly':
    case 'unavailable':
      return { kind: 'disabled', label, reason: withCondition(decision) }

    case 'clientDecisionRequired':
      return {
        kind: 'decision-open',
        label,
        openDecision: openDecisionOf(decision),
        note: decision.reason,
      }

    // `Explicitly prohibited` carries no rendering anywhere in the source. A
    // note sits where a control would be — never a disabled control, which
    // would imply a condition that could become true.
    case 'explicitlyProhibited':
      return { kind: 'absent', note: decision.reason }

    // Task 1 passes `notApplicable` through intact rather than inventing a
    // refusal reason for it. No control, and the reason it gave.
    case 'notApplicable':
      return { kind: 'absent', note: decision.reason }

    case 'queuedOffline':
    case 'cachedReadOnlyOffline':
      throw new Error(
        `MOD-STU-18: the outcome "${outcome}" reached the rendering rule. The Studio has no ` +
          'offline mode — STATE-07 renders nowhere on this surface and nothing on it ever queues ' +
          'a write — so an offline outcome here is a defect in the matrix or the evaluator, not ' +
          'a rendering to produce.',
      )

    default: {
      const exhaustive: never = outcome
      throw new Error(`MOD-STU-18: unhandled outcome ${JSON.stringify(exhaustive)}`)
    }
  }
}

/** The decision identifier a `clientDecisionRequired` outcome defers to. */
function openDecisionOf(decision: StudioAccessDecision): string {
  const named = decision.decision.sourceRefs.find((ref) => ref.startsWith('DEC-'))
  return named ?? 'an open client decision the source records without an identifier'
}

/* ==================================================================== *
 * The capability statement — SB-STU-21's own vocabulary.
 * ==================================================================== */

/**
 * `SB-STU-21` (L34631) asks for "a list of Studio capabilities each marked
 * Available or Unavailable with the specific missing condition named, for
 * example 'Requires the authoring grant. Ask your Tenant Admin.'"
 *
 * THAT IS A STATEMENT, NOT AN AFFORDANCE, and the distinction is why
 * `Explicitly prohibited` can be marked Unavailable here while carrying no
 * control anywhere. `FUNC-STU-18-04-A-1` (L34595) is explicit that the point
 * is to present every unavailable capability with a stated reason "rather
 * than hiding it": "a user should learn what they need, not that a feature
 * does not exist." The two tokens stay distinct in their TEXT and in
 * `affordanceFor`, which is where a rendering that could be mistaken for a
 * control is decided.
 */
export type CapabilityAvailability = 'available' | 'unavailable' | 'decision-open'

export interface CapabilityStatement {
  readonly availability: CapabilityAvailability
  readonly label: string
  /** The cell's own words, plus the specific missing condition where one is stated. */
  readonly text: string
  readonly decision: string | null
}

const AVAILABILITY: Readonly<Record<CapabilityAvailability, string>> = {
  available: 'Available',
  unavailable: 'Unavailable',
  'decision-open': 'Client Decision Required',
}

/**
 * `SB-STU-21`'s own worked example, and the one case where the missing
 * condition can be READ OFF THE MATRIX rather than invented: on a row where
 * the Supervisor's with-grant column permits the action and the without-grant
 * column does not, the authoring grant is what separates them, because the
 * two columns are one role (L34584 — "authoring is a capability, not a sixth
 * role").
 *
 * Deliberately NOT applied to `plant-manager-persona`, even though
 * `DEC-ROLE-001` delivers it through the same role: §5.18 states that persona
 * as read-only and unable to edit, so telling a Plant Manager to ask for the
 * authoring grant would offer a capacity the source withholds.
 */
export const AUTHORING_GRANT_CONDITION = 'Requires the authoring grant. Ask your Tenant Admin.'

const PERMITS_ACTION = new Set<PermissionOutcome>(['allowed', 'allowedWithConditions'])

/**
 * ONE mapping from a permission token to SB-STU-21's binary marker, read by
 * both the matrix cell and the evaluated decision. Two mappings is how a
 * screen ends up marking a cell Available and its own evaluated answer
 * Unavailable two paragraphs apart.
 */
export function availabilityOfOutcome(outcome: PermissionOutcome): CapabilityAvailability {
  switch (outcome) {
    case 'allowed':
    case 'allowedWithConditions':
    // `Read-only` is AVAILABLE, never Unavailable. Row 21's token grants an
    // export inside itself; a mechanical map to Unavailable removes it.
    case 'readOnly':
      return 'available'
    case 'clientDecisionRequired':
      return 'decision-open'
    case 'unavailable':
    case 'explicitlyProhibited':
    case 'notApplicable':
      return 'unavailable'
    case 'queuedOffline':
    case 'cachedReadOnlyOffline':
      throw new Error(
        `MOD-STU-18: the outcome "${outcome}" reached the capability panel. The Studio has no ` +
          'offline mode, so an offline outcome here is a defect in the matrix or the evaluator.',
      )
    default: {
      const exhaustive: never = outcome
      throw new Error(`MOD-STU-18: unhandled outcome ${JSON.stringify(exhaustive)}`)
    }
  }
}

export function availabilityOf(decision: StudioAccessDecision): CapabilityAvailability {
  return availabilityOfOutcome(decision.outcome)
}

export function capabilityStatement(
  row: Stu18MatrixRow,
  column: StudioPersonaColumn,
): CapabilityStatement {
  const cell = row.cells[column]
  const availability = availabilityOfOutcome(cell.outcome)

  // GUARDED ON THE AVAILABILITY, NOT ON `PERMITS_ACTION`, and that is a fix
  // rather than a preference. Guarding on the action alone fired on row 2's
  // `Read-only` cell and produced "Read-only. Requires the authoring grant" on
  // a capability marked AVAILABLE — telling a Supervisor they cannot read
  // published content without a grant they do not need for it. A `Read-only`
  // cell is available, so the grant is not what is missing there.
  const grantIsTheDifference =
    column === 'supervisor-without-grant' &&
    availability === 'unavailable' &&
    PERMITS_ACTION.has(row.cells['supervisor-with-authoring-grant'].outcome)

  return {
    availability,
    label: AVAILABILITY[availability],
    text: grantIsTheDifference ? `${cell.note}. ${AUTHORING_GRANT_CONDITION}` : cell.note,
    decision: cell.openDecision,
  }
}

/** The row the fail-closed floor keeps open when the identity layer is down. */
export const PUBLISHED_READ_ROW = stu18Row('read-published-workflow-content')

/* ==================================================================== *
 * SB-STU-21's capability panel, derived once and drawn twice.
 * ==================================================================== */

export interface CapabilityPanelRow {
  readonly row: Stu18MatrixRow
  /** SB-STU-21's marker, from the EVALUATED answer for this identity. */
  readonly availability: CapabilityAvailability
  readonly label: string
  /**
   * `AC-STU-155` (L34672): the SPECIFIC missing condition, never a bare
   * status token. Non-empty on every row — a capability that goes quiet is
   * the thing `FUNC-STU-18-04-A-1` exists to prevent.
   */
  readonly condition: string
  /** What the matrix cell itself says, with its locator. */
  readonly cellText: string
  readonly cellLocator: string
  readonly openDecision: string | null
}

/**
 * The panel `SB-STU-21` (L34631) describes, derived ONCE: "a list of Studio
 * capabilities each marked Available or Unavailable with the specific missing
 * condition named". Both `SCR-STU-01` and `SCR-STU-15` render this same list,
 * so a change to the rule moves both rather than one.
 */
export function capabilityPanelRows(
  s: Stu18Scenario,
  rows: readonly Stu18MatrixRow[],
): readonly CapabilityPanelRow[] {
  return rows.map((row) => {
    const decision = decisionForRow(row, s)
    const statement = capabilityStatement(row, s.persona)
    const availability = availabilityOf(decision)
    return {
      row,
      availability,
      label: AVAILABILITY[availability],
      condition: withCondition(decision),
      cellText: statement.text,
      cellLocator: row.sourceRefs[0] ?? '',
      openDecision: row.cells[s.persona].openDecision,
    }
  })
}
