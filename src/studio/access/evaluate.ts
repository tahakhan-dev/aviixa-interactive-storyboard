import type { RoleId } from '@/domain/roles'
import type { TenantId } from '@/domain/ids'
import type { ScenarioDomainState } from '@/domain/state'
import {
  decide,
  deny,
  isRefusal,
  type PermissionDecision,
  type PermissionOutcome,
} from '@/policy/decision'
import { evaluateAccess, type AccessContext, type AccessRequest } from '@/policy/evaluate'
import {
  grantConfersCapability,
  grantHoldingNote,
  studioGrantById,
  type StudioCommercialTier,
  type StudioGrantId,
  type StudioGrantState,
} from './grants'

/**
 * S1 — `evaluateStudioAccess`, the Studio's ONLY access entry point. Layered
 * on slice 3's `evaluateAccess` (`@/policy/evaluate`), never a fork of it.
 *
 * The Studio does NOT have slice 4's nine intersecting access conditions. Its
 * inputs are the five `MOD-STU-18` states as its own Inputs line (L34567) puts
 * them: "Role assignments; grant assignments; the tenant's commercial tier; the
 * submission's Author and Reviewer identities for separation-of-duties
 * evaluation" — plus object state.
 *
 * THREE RULES THIS FILE EXISTS TO HOLD:
 *
 * 1. SEPARATION OF DUTIES IS EVALUATED BY IDENTITY, NEVER BY ROLE. L33389:
 *    "Person distinctness is checked against identity, not against role,
 *    because multi-role is additive and the audit log records identity and
 *    action rather than 'acting as role'. A user holding both the Supervisor
 *    and Quality Manager roles is still one person and still cannot occupy two
 *    stages." A role-based check passes every test written with a single-role
 *    persona, which is why the covering fixture holds BOTH roles.
 *
 * 2. THE GRANT IS A FIRST-CLASS INPUT, NOT A SIXTH ROLE. L34584: "authoring is
 *    a capability, not a sixth role."
 *
 * 3. FAIL CLOSED. L34605: "Where the identity layer is unreachable, the Studio
 *    denies authoring capabilities and permits nothing beyond published read,
 *    failing closed. Where a grant is revoked mid-session, the next authorised
 *    action is refused with the revocation named; the session is not silently
 *    degraded."
 *
 * C19 — THE EVALUATOR TAKES A MATRIX ROW, NEVER A ROLE LIST. There is not one
 * `RoleId` array in this file. If it carried role lists it would be a second
 * copy of `MOD-STU-18`'s matrix and the two would drift. The matrix DATA (23
 * capability rows × 8 persona columns, L34539-L34563) belongs to the
 * `MOD-STU-18` module task; the EVALUATION belongs here. The one role mapping
 * this file does hold — `PERSONA_COLUMN_ROLES` — maps a matrix COLUMN HEADER
 * to the role that reaches it, which is the matrix's own header row, not a
 * permission list.
 *
 * DETERMINISM: nothing here reads a clock, a random source, or module-level
 * mutable state. Every register this function consults — domain state, grants,
 * identity, connectivity — arrives as a parameter.
 */

// ---------------------------------------------------------------------------
// The matrix row (data owned by the MOD-STU-18 module task)
// ---------------------------------------------------------------------------

/**
 * The eight column headers of the consolidated Studio permission matrix,
 * L34539, in header order.
 *
 * `plant-manager-persona` is a real column of the source matrix and no built
 * role reaches it: `DEC-ROLE-001` leaves Plant Manager as a fixed role open,
 * and `tests/unit/roles.test.ts` already asserts this build mints no such
 * role. The column is therefore present and unreachable, which is the honest
 * rendering — see `PERSONA_COLUMN_ROLES`.
 */
export type StudioPersonaColumn =
  | 'quality-manager'
  | 'supervisor-with-authoring-grant'
  | 'supervisor-without-grant'
  | 'plant-manager-persona'
  | 'tenant-admin'
  | 'read-only-auditor'
  | 'worker'
  | 'implementation-team'

export const STUDIO_PERSONA_COLUMNS = [
  'quality-manager',
  'supervisor-with-authoring-grant',
  'supervisor-without-grant',
  'plant-manager-persona',
  'tenant-admin',
  'read-only-auditor',
  'worker',
  'implementation-team',
] as const satisfies readonly StudioPersonaColumn[]

type MissingFromPersonaColumns = Exclude<
  StudioPersonaColumn,
  (typeof STUDIO_PERSONA_COLUMNS)[number]
>
const _personaColumnsExhaustive: MissingFromPersonaColumns extends never ? true : never = true
void _personaColumnsExhaustive

/**
 * Which role reaches each column — the matrix's own header row, read as a
 * mapping. `null` means no role in this build reaches the column.
 *
 * `implementation-team` is `null` on purpose and for a different reason from
 * `plant-manager-persona`: the implementation team's capacity is a GRANT, not
 * a role (L34588), so that column is reached by holding `GRANT-STU-IMPL`
 * alongside whatever tenant role the person actually has. See
 * `PERSONA_COLUMN_GRANTS`.
 */
export const PERSONA_COLUMN_ROLES = {
  'quality-manager': 'QUALITY_MANAGER',
  'supervisor-with-authoring-grant': 'SUPERVISOR',
  'supervisor-without-grant': 'SUPERVISOR',
  'plant-manager-persona': null,
  'tenant-admin': 'TENANT_ADMIN',
  'read-only-auditor': 'READONLY_AUDITOR',
  worker: 'WORKER',
  'implementation-team': null,
} as const satisfies Readonly<Record<StudioPersonaColumn, RoleId | null>>

/**
 * The grant that OPENS a column, as distinct from a grant a capability itself
 * requires (`StudioMatrixRow.requiredGrant`). Two different mechanisms because
 * the source has two: `GRANT-STU-AUTHOR` and `GRANT-STU-IMPL` change which
 * COLUMN a person reads, while `GRANT-STU-AGENT` is named inside a CELL
 * ("only with `GRANT-STU-AGENT`", L34554) and gates the capability itself.
 */
const PERSONA_COLUMN_GRANTS = {
  'quality-manager': null,
  'supervisor-with-authoring-grant': 'GRANT-STU-AUTHOR',
  'supervisor-without-grant': null,
  'plant-manager-persona': null,
  'tenant-admin': null,
  'read-only-auditor': null,
  worker: null,
  'implementation-team': 'GRANT-STU-IMPL',
} as const satisfies Readonly<Record<StudioPersonaColumn, StudioGrantId | null>>

/**
 * The six status tokens `MOD-STU-18`'s matrix actually uses (L34541-L34563).
 * Derived with `Extract` from slice 3's nine so a rename over there fails to
 * compile here rather than silently splitting the vocabulary in two.
 *
 * `queuedOffline` and `cachedReadOnlyOffline` are absent BY CONSTRUCTION, not
 * by convention: S5/D4 — "Every write control → DISABLED with a named reason,
 * never queued. Nothing on this surface ever queues a write." A cell literally
 * cannot express a queued Studio write.
 */
export type StudioCellOutcome = Extract<
  PermissionOutcome,
  | 'allowed'
  | 'allowedWithConditions'
  | 'readOnly'
  | 'unavailable'
  | 'clientDecisionRequired'
  | 'explicitlyProhibited'
>

/**
 * Also the permissiveness order, most permissive first. Multi-role is additive
 * (L33389), so where a person holds two roles the more permissive of the two
 * cells governs.
 *
 * The order between the three refusing members decides only WHICH STATED
 * REASON renders when two held columns disagree; it never turns a refusal into
 * a permission. `unavailable` sits above `clientDecisionRequired` because a
 * stated condition is more useful to a reader than an unanswered question, and
 * `explicitlyProhibited` sits last because it is the one token that carries no
 * rendering of its own.
 */
export const STUDIO_CELL_OUTCOMES = [
  'allowed',
  'allowedWithConditions',
  'readOnly',
  'unavailable',
  'clientDecisionRequired',
  'explicitlyProhibited',
] as const satisfies readonly StudioCellOutcome[]

type MissingFromCellOutcomes = Exclude<StudioCellOutcome, (typeof STUDIO_CELL_OUTCOMES)[number]>
const _cellOutcomesExhaustive: MissingFromCellOutcomes extends never ? true : never = true
void _cellOutcomesExhaustive

const PERMISSIVENESS = new Map<StudioCellOutcome, number>(
  STUDIO_CELL_OUTCOMES.map((o, i) => [o, i]),
)

/** Outcomes under which the actor may take the ACTION (as opposed to read). */
const PERMITS_ACTION: ReadonlySet<StudioCellOutcome> = new Set<StudioCellOutcome>([
  'allowed',
  'allowedWithConditions',
])

/** L33289 — Author, then Reviewer, then Release Authority. Three stages. */
export type StudioApprovalStage = 'author' | 'reviewer' | 'release-authority'

export const STUDIO_APPROVAL_STAGES = [
  'author',
  'reviewer',
  'release-authority',
] as const satisfies readonly StudioApprovalStage[]

type MissingFromStages = Exclude<StudioApprovalStage, (typeof STUDIO_APPROVAL_STAGES)[number]>
const _stagesExhaustive: MissingFromStages extends never ? true : never = true
void _stagesExhaustive

const STAGE_LABELS: Readonly<Record<StudioApprovalStage, string>> = {
  author: 'Author',
  reviewer: 'Reviewer',
  'release-authority': 'Release Authority',
}

export interface StudioMatrixCell {
  readonly outcome: StudioCellOutcome
  /** The cell's own words from the matrix, verbatim. Never invented. */
  readonly note: string
  /** The open decision this cell defers to, where the outcome is one. */
  readonly openDecision: string | null
  /**
   * The commercial tiers that carry this capability FOR THIS PERSONA, or
   * `null` where the cell states no tier gate.
   *
   * PER-CELL, NOT PER-ROW, AND THE SOURCE IS EXPLICIT ABOUT IT. L34554,
   * "Compose a reasoning agent", states three different conditions across
   * three columns: the Quality Manager's cell names only the tier ("Allowed
   * with conditions — Growth or Enterprise tier"), the Supervisor's names a
   * grant AND the tier ("only with `GRANT-STU-AGENT` and Growth or
   * Enterprise"), and the Tenant Admin's names only the grant ("only if
   * delegated `GRANT-STU-AGENT`"). Hanging either condition off the ROW would
   * have made a Quality Manager need a grant they hold by role (L34553,
   * "Hold or delegate the Agent Author capability | Allowed"), and would have
   * let a Tenant Admin compose on any tier.
   */
  readonly requiredTiers: readonly StudioCommercialTier[] | null
  /**
   * A grant THIS CELL requires beyond whatever grant opened the column — in
   * practice `GRANT-STU-AGENT`, which no column header encodes. Per-cell for
   * the same reason as `requiredTiers` above.
   */
  readonly requiredGrant: StudioGrantId | null
}

/**
 * ONE ROW of the consolidated matrix. The evaluator takes this and never a
 * role list (C19).
 */
export interface StudioMatrixRow {
  /** The capability, in the matrix's own words (L34541-L34563). */
  readonly capability: string
  readonly cells: Readonly<Record<StudioPersonaColumn, StudioMatrixCell>>
  /**
   * True on the ONE row L34605's fail-closed floor names: "permits nothing
   * beyond published read". A boolean rather than a string match on the
   * capability text, so the floor is a declaration the row makes rather than
   * an inference drawn from wording the matrix owner may reword.
   */
  readonly isPublishedRead: boolean
  /**
   * Which approval stage this capability occupies, or `null` where it occupies
   * none. Separation of duties applies to a stage-occupying row only.
   */
  readonly stage: StudioApprovalStage | null
  readonly sourceRefs: readonly string[]
}

// ---------------------------------------------------------------------------
// The input
// ---------------------------------------------------------------------------

/** L34605 / `AC-STU-156`. Two states, and the second one fails closed. */
export type IdentityLayerState = 'reachable' | 'unreachable'

/**
 * The signed-in person.
 *
 * `identityId` is the ONE thing separation of duties is checked against.
 * There is deliberately no second "who is acting" field on the input: two
 * fields naming the actor is precisely how a role-based distinctness check
 * creeps back in, because the two can be made to disagree.
 *
 * `roles` is plural because multi-role is additive (L33389). Slice 3's
 * `IdentitySimulationState` carries a single `role`, which cannot express the
 * dual-role person `AC-STU-100` is about; that is why this surface needs its
 * own identity shape rather than reusing that one.
 */
export interface StudioIdentity {
  readonly identityId: string
  readonly roles: readonly RoleId[]
  readonly signedIn: boolean
  readonly tenant: TenantId | null
}

export interface StudioAccessInput {
  /** C19: a matrix row, never a role list. */
  readonly row: StudioMatrixRow
  readonly identity: StudioIdentity
  /** Grant assignments as the identity layer reports them. Absent = not held. */
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
  readonly commercialTier: StudioCommercialTier
  readonly identityLayer: IdentityLayerState
  /** The register, passed in. Never a module-load snapshot. */
  readonly state: ScenarioDomainState
  readonly online: boolean
  /** The tenant that owns the record being acted on, where the request names one. */
  readonly resourceTenant?: TenantId
  readonly objectState?: string
  readonly allowedObjectStates?: readonly string[]
  /**
   * Stage occupancy on THIS submission, by identity. Required rather than
   * optional so a module cannot forget one and silently void the floor;
   * `null` means the stage is unoccupied.
   */
  readonly authorOfRecord: string | null
  readonly reviewerOfRecord: string | null
  readonly releaseAuthorityOfRecord: string | null
}

export interface StudioAccessDecision {
  /**
   * INVARIANT, asserted by the covering test: this is always identical to
   * `decision.outcome`. A consumer may read either.
   */
  readonly outcome: PermissionOutcome
  /**
   * Plain language naming the SPECIFIC missing condition (`AC-STU-155`), never
   * a bare status token. Always identical to `decision.explanation`.
   */
  readonly reason: string
  /** The composed slice-3 decision: stage, reason code, audit expectation. */
  readonly decision: PermissionDecision
  /** Which matrix columns the identity resolved to. Empty means none did. */
  readonly personaColumns: readonly StudioPersonaColumn[]
}

// ---------------------------------------------------------------------------
// Persona resolution
// ---------------------------------------------------------------------------

interface ResolvedColumn {
  readonly column: StudioPersonaColumn
  /** The role this identity actually holds that reaches the column. */
  readonly role: RoleId
}

/**
 * Which columns this identity reads, given its roles and its grants.
 *
 * `conferring` decides whether a grant counts as held. Called twice by the
 * evaluator: once with the real rule (Active only) and once treating any
 * recorded grant as held, so a grant that WOULD have opened a column can be
 * named when it is revoked or expired instead of the session silently
 * degrading to the without-grant column (L34605).
 */
function resolveColumns(
  identity: StudioIdentity,
  grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>,
  conferring: (state: StudioGrantState | undefined) => boolean,
): readonly ResolvedColumn[] {
  const out: ResolvedColumn[] = []
  for (const column of STUDIO_PERSONA_COLUMNS) {
    const requiredGrant = PERSONA_COLUMN_GRANTS[column]
    if (requiredGrant !== null && !conferring(grants[requiredGrant])) continue

    const columnRole = PERSONA_COLUMN_ROLES[column]
    if (columnRole === null) {
      // A grant-opened column (implementation team) attaches to whatever tenant
      // role the person holds; a column no role and no grant reaches
      // (Plant Manager, DEC-ROLE-001) attaches to nothing and never resolves.
      if (requiredGrant === null) continue
      for (const role of identity.roles) out.push({ column, role })
      continue
    }
    if (!identity.roles.includes(columnRole)) continue

    // The Supervisor's two columns are mutually exclusive: holding the
    // authoring grant means reading the with-grant column, not both.
    if (column === 'supervisor-without-grant' && conferring(grants['GRANT-STU-AUTHOR'])) continue

    out.push({ column, role: columnRole })
  }
  return out
}

/** The most permissive cell across the columns this identity reads. */
function bestCell(
  row: StudioMatrixRow,
  columns: readonly ResolvedColumn[],
): { readonly cell: StudioMatrixCell; readonly at: ResolvedColumn } | null {
  let best: { cell: StudioMatrixCell; at: ResolvedColumn } | null = null
  for (const at of columns) {
    const cell = row.cells[at.column]
    if (best === null || rank(cell.outcome) < rank(best.cell.outcome)) best = { cell, at }
  }
  return best
}

function rank(outcome: StudioCellOutcome): number {
  // Unreachable default: PERMISSIVENESS is built from STUDIO_CELL_OUTCOMES,
  // which the exhaustiveness check above proves covers the union.
  return PERMISSIVENESS.get(outcome) ?? STUDIO_CELL_OUTCOMES.length
}

// ---------------------------------------------------------------------------
// The evaluator
// ---------------------------------------------------------------------------

/**
 * Build the returned decision so that `outcome`, `decision.outcome` and
 * `decision.explanation` can never disagree with `reason`. Eighteen consumer
 * tasks read this shape; a branch that returned an underlying `allowed`
 * decision beside a `clientDecisionRequired` outcome would mislead every one
 * of them.
 *
 * Every refusal is marked `RECORDED_AS_REFUSAL`, because L34657 audits
 * "Grant assignment and revocation, every authorisation refusal, and every
 * approval-stage occupancy". Whether an outcome IS a refusal is slice 3's
 * `isRefusal`, not a second list of outcomes maintained here.
 */
function finalise(
  outcome: Exclude<PermissionOutcome, 'notApplicable'>,
  reason: string,
  base: PermissionDecision,
  personaColumns: readonly StudioPersonaColumn[],
): StudioAccessDecision {
  const opts = {
    stage: base.stage,
    sourceRefs: base.sourceRefs,
    auditExpectation: base.auditExpectation,
    ...(base.conditionToEnable !== null ? { conditionToEnable: base.conditionToEnable } : {}),
  }
  const first = decide(outcome, base.reasonCode, reason, opts)
  const decision = isRefusal(first)
    ? decide(outcome, base.reasonCode, reason, { ...opts, auditExpectation: 'RECORDED_AS_REFUSAL' })
    : first
  return { outcome: decision.outcome, reason, decision, personaColumns }
}

/**
 * The Studio's only access entry point.
 *
 * ORDER, and why each step sits where it does. Each names the most specific
 * missing condition available at that point, so a reader is never told about a
 * later obstacle while an earlier one is the real answer.
 *
 *  1. The identity layer, because nothing below can be trusted without it.
 *  2. The grant, because it decides WHICH COLUMN of the matrix this person
 *     reads — and a lapsed grant is named here rather than degrading silently.
 *  3. The tier, because it gates the capability the column just granted.
 *  4. Slice 3's ordered stages, which gate this particular REQUEST: session,
 *     safety controls, tenant isolation, the cell as a base-role verdict,
 *     suspension, object state, connectivity, and separation of duties.
 *  5. The cell's own outcome, where nothing above refused. `evaluateAccess`
 *     can only ever downgrade the cell, never upgrade it.
 *
 * Step 4 running the cell's verdict through the BASE_ROLE stage is what makes
 * row 23 of the matrix come out right without a special case: a prohibited
 * column offline reads "Explicitly prohibited — no access at all" (the deny
 * lands at the base-role stage) while a permitted column offline reads "Unavailable — the
 * Studio requires an active connection" (the deny lands at the device stage).
 */
export function evaluateStudioAccess(input: StudioAccessInput): StudioAccessDecision {
  const { row, identity, grants } = input
  const refs = row.sourceRefs

  // 1. FAIL CLOSED ON THE IDENTITY LAYER (L34605, AC-STU-156).
  if (input.identityLayer === 'unreachable') {
    if (row.isPublishedRead) {
      return finalise(
        'readOnly',
        'The identity layer is unreachable, so the Studio has fallen back to published read only. ' +
          'Published Workflow content can be read; nothing can be authored, reviewed or released.',
        decide('readOnly', 'READ_ONLY_RECORD', undefined, {
          stage: 'SESSION',
          sourceRefs: [...refs, 'L34605', 'AC-STU-156'],
          conditionToEnable: 'The identity layer must become reachable again.',
        }),
        [],
      )
    }
    return finalise(
      'unavailable',
      `The identity layer is unreachable, so the Studio permits nothing beyond published read. ` +
        `“${row.capability}” is refused rather than assumed, because failing closed is the safe direction.`,
      deny('unavailable', 'NO_ACTIVE_SESSION', undefined, {
        stage: 'SESSION',
        sourceRefs: [...refs, 'L34605', 'AC-STU-156'],
        conditionToEnable: 'The identity layer must become reachable again.',
      }),
      [],
    )
  }

  // 2. THE GRANT, WHICH DECIDES WHICH COLUMN IS READ (L34584, L34605).
  const held = resolveColumns(identity, grants, grantConfersCapability)
  const assumed = resolveColumns(identity, grants, (s) => s !== undefined)
  const heldColumns = held.map((h) => h.column)

  const heldBest = bestCell(row, held)
  const assumedBest = bestCell(row, assumed)

  // A grant is LOAD-BEARING for this capability when treating it as held would
  // give a more permissive cell than actually holding it does. Where that grant
  // is recorded but not Active, the refusal names it — "the session is not
  // silently degraded" (L34605).
  const columnGrant = assumedBest === null ? null : PERSONA_COLUMN_GRANTS[assumedBest.at.column]
  const loadBearing =
    assumedBest !== null &&
    columnGrant !== null &&
    (heldBest === null || rank(assumedBest.cell.outcome) < rank(heldBest.cell.outcome))
      ? columnGrant
      : null

  // A grant that opened a column and has since lapsed is NAMED. A grant that
  // was never recorded at all is NOT: there the without-grant column's own
  // cell already states the refusal, and reporting "revoked" for something
  // never held would be a false claim.
  //
  // No `!== undefined` guard is written here, and that is not an omission. The
  // `assumed` pass above admits a grant-opened column only when the grant is
  // recorded in SOME state, so `loadBearing` is non-null only for a grant that
  // exists. A guard here would be code no test could ever turn red — proven by
  // planting exactly that defect and watching all 58 tests stay green — and an
  // untestable guard implies a check that does not run.
  if (loadBearing !== null) {
    return grantRefusal(loadBearing, grants[loadBearing], refs, heldColumns)
  }

  // A grant THIS CELL requires, beyond the one that opened the column
  // (L34554). Refused whether the grant lapsed or was never held, because
  // here the cell itself names the grant as its condition.
  const cellGrant = heldBest?.cell.requiredGrant ?? null
  if (
    cellGrant !== null &&
    heldBest !== null &&
    PERMITS_ACTION.has(heldBest.cell.outcome) &&
    !grantConfersCapability(grants[cellGrant])
  ) {
    return grantRefusal(cellGrant, grants[cellGrant], refs, heldColumns)
  }

  // 3. THE COMMERCIAL TIER (L34554, L34586). Applied only where the cell would
  //    otherwise permit the action, so a prohibited persona is never told
  //    about a tier that was never their obstacle.
  const requiredTiers = heldBest?.cell.requiredTiers ?? null
  if (
    requiredTiers !== null &&
    heldBest !== null &&
    PERMITS_ACTION.has(heldBest.cell.outcome) &&
    !requiredTiers.includes(input.commercialTier)
  ) {
    const named = requiredTiers.join(' or ')
    const has =
      input.commercialTier === 'indeterminate'
        ? 'this tenant’s commercial tier cannot be read'
        : `this tenant is on ${input.commercialTier}`
    return finalise(
      'unavailable',
      `“${row.capability}” requires the ${named} commercial tier, and ${has}. The commercial tier is a ` +
        'separate thing from the Tier-2 authority boundary, and neither one substitutes for the other.',
      deny('unavailable', 'ENTITLEMENT_MISSING', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: [...refs, 'L34554', 'L11872'],
        conditionToEnable: `The tenant must be on the ${named} commercial tier.`,
      }),
      heldColumns,
    )
  }

  // 4. THE NINE SLICE-3 STAGES. Composed, not forked.
  const effectiveRole: RoleId | null = heldBest?.at.role ?? identity.roles[0] ?? null
  const prohibited = heldBest !== null && heldBest.cell.outcome === 'explicitlyProhibited'
  const sodCounterparty = occupiedOtherStage(input)

  const req: AccessRequest = {
    action: row.capability,
    // The MATRIX supplies the base-role verdict. This is a per-call derivation
    // from the row that was handed in, never a stored role list (C19).
    allowedRoles: heldBest !== null && effectiveRole !== null && !prohibited ? [effectiveRole] : [],
    ...(prohibited && effectiveRole !== null ? { deniedRoles: [effectiveRole] } : {}),
    ...(input.allowedObjectStates !== undefined
      ? { allowedObjectStates: input.allowedObjectStates }
      : {}),
    ...(input.objectState !== undefined ? { objectState: input.objectState } : {}),
    // L34637: "the Studio requires an active connection, so no Studio
    // permission has an offline expression." Row 23 of the matrix, universally.
    requiresOnline: true,
    makerCheckerOf: sodCounterparty === null ? null : identity.identityId,
    ...(input.resourceTenant !== undefined ? { resourceTenant: input.resourceTenant } : {}),
    sourceRefs: refs,
  }

  const ctx: AccessContext = {
    state: input.state,
    identity: {
      signedIn: identity.signedIn,
      role: effectiveRole,
      tenant: identity.tenant,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: input.online,
    // The Studio is a web surface with no device-trust dimension; no Studio
    // request declares `requiresTrustedDevice`, so this is never consulted.
    deviceTrusted: true,
    // THE ONE PLACE THE ACTOR IS NAMED, and it is the identity.
    actorOfRecord: identity.identityId,
  }

  const composed = evaluateAccess(req, ctx)

  if (composed.outcome === 'notApplicable') {
    // `evaluateAccess` has no path that produces this today, but its return
    // type permits it. Passed through intact rather than flattened into a
    // refusal whose required `notApplicableReason` would have to be invented.
    return {
      outcome: composed.outcome,
      reason: composed.explanation,
      decision: composed,
      personaColumns: heldColumns,
    }
  }
  if (isRefusal(composed) || composed.outcome === 'readOnly') {
    return finalise(composed.outcome, refusalReason(input, composed, heldBest, sodCounterparty), composed, heldColumns)
  }

  // 5. NOTHING REFUSED. The cell's own verdict governs, with its own words.
  if (heldBest === null) {
    // Unreachable: with no column, `allowedRoles` is empty and stage 3 refuses.
    return finalise(
      'explicitlyProhibited',
      'No Studio persona resolves from the roles this identity holds, so no capability is granted.',
      deny('explicitlyProhibited', 'ROLE_NOT_GRANTED', undefined, {
        stage: 'BASE_ROLE',
        sourceRefs: refs,
      }),
      heldColumns,
    )
  }
  return finalise(
    heldBest.cell.outcome,
    cellReason(row, heldBest.cell),
    decide(heldBest.cell.outcome, cellReasonCode(heldBest.cell.outcome), cellReason(row, heldBest.cell), {
      stage: composed.stage,
      sourceRefs:
        heldBest.cell.openDecision === null ? refs : [...refs, heldBest.cell.openDecision],
      auditExpectation: composed.auditExpectation,
    }),
    heldColumns,
  )
}

/**
 * A grant that does not currently confer, named. `grantHoldingNote`
 * distinguishes "not held" from "revoked" from "expired" from "assigned but
 * not yet active", so the reason is never a false claim about which of those
 * happened. The CALLER decides whether an absent grant should route here at
 * all — see the two call sites.
 */
function grantRefusal(
  grant: StudioGrantId,
  state: StudioGrantState | undefined,
  refs: readonly string[],
  personaColumns: readonly StudioPersonaColumn[],
): StudioAccessDecision {
  const definition = studioGrantById(grant)
  return finalise(
    'unavailable',
    `${definition.name} (${grant}) does not currently apply, because ${grantHoldingNote(state)}. ` +
      'The next authorised action is refused with the reason named rather than the session being ' +
      'quietly reduced to a narrower set of capabilities.',
    deny('unavailable', 'ROLE_NOT_GRANTED', undefined, {
      stage: 'BASE_ROLE',
      sourceRefs: [...refs, 'L34605', 'TEST-STU-150'],
      conditionToEnable: `Ask your Tenant Admin to assign ${grant} again. ${definition.assignedBy}`,
    }),
    personaColumns,
  )
}

/**
 * The specific missing condition for a refusal that came out of the composed
 * evaluator (`AC-STU-155`). The DECISION is slice 3's; only the wording is
 * the Studio's, and it is the wording that has to name the condition.
 */
function refusalReason(
  input: StudioAccessInput,
  composed: PermissionDecision,
  heldBest: { readonly cell: StudioMatrixCell; readonly at: ResolvedColumn } | null,
  sodCounterparty: StudioApprovalStage | null,
): string {
  if (composed.stage === 'SEGREGATION_OF_DUTIES' && sodCounterparty !== null) {
    const requested = input.row.stage === null ? 'another stage' : STAGE_LABELS[input.row.stage]
    return (
      `${input.identity.identityId} already occupies the ${STAGE_LABELS[sodCounterparty]} stage on this ` +
      `submission and so cannot also take the ${requested} stage. Distinctness is checked against ` +
      'identity, not against role: a user holding two roles is still one person, and one person cannot ' +
      'occupy two stages.'
    )
  }
  if (composed.reasonCode === 'ROLE_NOT_GRANTED' && heldBest === null) {
    const roles = input.identity.roles.length === 0 ? 'none' : input.identity.roles.join(', ')
    return (
      `No Studio persona resolves from the roles this identity holds (${roles}), so “${input.row.capability}” ` +
      'is not granted. The Studio is gated by role and grant together.'
    )
  }
  if (composed.reasonCode === 'EXPLICIT_DENY' && heldBest !== null) {
    return `“${input.row.capability}” — ${heldBest.cell.note}. ${composed.explanation}`
  }
  if (composed.reasonCode === 'OFFLINE_NOT_AUTHORISED') {
    return (
      `“${input.row.capability}” is unavailable because the Studio requires an active connection. ` +
      'Nothing on this surface is queued for later; the control is disabled with this reason until the ' +
      'connection returns.'
    )
  }
  return `“${input.row.capability}” — ${composed.explanation}`
}

/** The cell's own words, prefixed by the capability they answer for. */
function cellReason(row: StudioMatrixRow, cell: StudioMatrixCell): string {
  const decisionSuffix =
    cell.openDecision === null
      ? ''
      : ` This cell is not guessed: ${cell.openDecision} is open and governs it.`
  return `“${row.capability}” — ${cell.note}.${decisionSuffix}`
}

function cellReasonCode(
  outcome: StudioCellOutcome,
): 'ALLOWED' | 'CONDITIONS_APPLY' | 'READ_ONLY_RECORD' | 'DECISION_OPEN' | 'ROLE_NOT_GRANTED' {
  switch (outcome) {
    case 'allowed':
      return 'ALLOWED'
    case 'allowedWithConditions':
      return 'CONDITIONS_APPLY'
    case 'readOnly':
      return 'READ_ONLY_RECORD'
    case 'clientDecisionRequired':
      return 'DECISION_OPEN'
    case 'unavailable':
    case 'explicitlyProhibited':
      return 'ROLE_NOT_GRANTED'
  }
}

/**
 * SEPARATION OF DUTIES, BY IDENTITY (L33389, `AC-STU-100`).
 *
 * Returns the OTHER stage this same person already occupies on this
 * submission, or `null`. Two things this must get right, and both are the
 * defect the covering tests pin:
 *
 * - The comparison is `identityId === identityId`. There is no role anywhere
 *   in this function, and there must never be one: a role-based check sees a
 *   Supervisor authoring and a Quality Manager reviewing, counts two roles,
 *   and allows what is in fact one person taking two stages.
 * - The stage being REQUESTED is excluded from the scan, so an Author
 *   re-opening their own draft is not refused for occupying the very stage
 *   they are asking for.
 */
function occupiedOtherStage(input: StudioAccessInput): StudioApprovalStage | null {
  const requested = input.row.stage
  if (requested === null) return null
  const occupancy: Readonly<Record<StudioApprovalStage, string | null>> = {
    author: input.authorOfRecord,
    reviewer: input.reviewerOfRecord,
    'release-authority': input.releaseAuthorityOfRecord,
  }
  for (const stage of STUDIO_APPROVAL_STAGES) {
    if (stage === requested) continue
    if (occupancy[stage] !== null && occupancy[stage] === input.identity.identityId) return stage
  }
  return null
}
