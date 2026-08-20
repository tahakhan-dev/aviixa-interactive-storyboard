import {
  decide,
  deny,
  type AuditExpectation,
  type PermissionDecision,
  type PermissionOutcome,
} from '@/policy/decision'

/**
 * S7 — the Tier-2 refusal classification. `MOD-STU-01` owns the boundary;
 * every other Studio module inherits this classification.
 *
 * Frozen source:
 * - L11987 — "Four verbs define the Tier-2 boundary precisely. **Enable** —
 *   turn on a registered capability within the tenant's entitlement.
 *   **Configure** — set that capability's parameters per screen and per
 *   workflow. **Compose** — assemble registered capabilities into a new
 *   reasoning agent in the Agent Builder. **Never define** — never create the
 *   capability itself, never alter a core agent's definition, never change the
 *   memory architecture, and never modify the evaluation harness."
 * - L12033-L12042 — the eight-row verb table transcribed below, cell by cell.
 * - L31599 (`FUNC-STU-01-01-C-1`) — "Refuse every request that would create,
 *   alter, or delete an atomic capability ... refused at the application
 *   programming interface layer, not merely hidden in the user interface.
 *   Fallback: `FB-STU-10` — the refusal itself is audited, and if the audit
 *   write fails, the refusal is still enforced because refusing is the safe
 *   direction."
 * - L31674 (`AC-STU-041`) — "a define-class request is refused at the service
 *   layer and audited, whether it originates from the user interface or from
 *   an application programming interface call."
 *
 * THE ASYMMETRY, STATED ONCE SO NOBODY RE-DERIVES IT. `FB-STU-10` is the
 * strictest contract in the chapter and it kills a WRITE that cannot be
 * audited: "an action that cannot be audited does not happen." It does NOT
 * revive a REFUSAL that cannot be audited. Refusing is the safe direction, so
 * an unaudited refusal still refuses. `enforceTierTwoBoundary` below is the
 * only place that asymmetry is expressed.
 */
export type Tier2RequestClass =
  // Permitted at Tier 2 (L12034-L12036).
  | 'enable'
  | 'configure'
  | 'compose-reasoning-agent'
  // Never define (L12037-L12040). These four are the define class.
  | 'define-atom'
  | 'alter-core-agent-definition'
  | 'alter-memory-architecture'
  | 'alter-evaluation-harness'
  // Deferred beyond V1 (L12041).
  | 'compose-action-agent'

export const TIER_TWO_REQUEST_CLASSES = [
  'enable',
  'configure',
  'compose-reasoning-agent',
  'define-atom',
  'alter-core-agent-definition',
  'alter-memory-architecture',
  'alter-evaluation-harness',
  'compose-action-agent',
] as const satisfies readonly Tier2RequestClass[]

type MissingFromRequestClasses = Exclude<
  Tier2RequestClass,
  (typeof TIER_TWO_REQUEST_CLASSES)[number]
>
const _requestClassesExhaustive: MissingFromRequestClasses extends never ? true : never = true
void _requestClassesExhaustive

export interface Tier2ClassificationRow {
  readonly requestClass: Tier2RequestClass
  readonly outcome: PermissionOutcome
  /**
   * Plain language a non-specialist can act on. For the four prohibited rows
   * this must carry L31599's "not merely hidden in the user interface", because
   * a Tier-2 refusal that reads as a missing button is the exact defect S7
   * exists to prevent.
   */
  readonly reason: string
  /** The source table's own example for this verb (L12034-L12042). */
  readonly example: string
  readonly sourceRefs: readonly string[]
}

/**
 * THE VERB TABLE, transcribed from L12033-L12042. One data structure, not
 * scattered conditionals — `classifyTierTwoRefusal` below does nothing but
 * look a row up in it.
 */
export const TIER_TWO_CLASSIFICATION = [
  {
    requestClass: 'enable',
    outcome: 'allowedWithConditions',
    reason:
      'Enabling a registered capability is permitted at Tier 2, within the tenant’s entitlement.',
    example: 'Switching on a registered measurement-validation capability',
    sourceRefs: ['L12034', 'L11987'],
  },
  {
    requestClass: 'configure',
    outcome: 'allowed',
    reason:
      'Configuring a capability per screen and per Workflow is what the Studio is for.',
    example: 'Setting the 44 to 47 Newton metre limits and the severity bands',
    sourceRefs: ['L12035', 'L11987'],
  },
  {
    requestClass: 'compose-reasoning-agent',
    outcome: 'allowedWithConditions',
    reason:
      'Composing a reasoning agent is permitted at Tier 2 with the Agent Author capability, on Growth ' +
      'or Enterprise, and it passes three gates: the tenant’s approval chain, the evaluation gate, and platform review.',
    example: 'Building a prior-case brief agent',
    sourceRefs: ['L12036', 'L11989'],
  },
  {
    requestClass: 'define-atom',
    outcome: 'explicitlyProhibited',
    reason:
      'Creating, altering or deleting an atomic capability is refused at the service layer, not merely hidden ' +
      'in the user interface. Adding a capability is an engineering change in the platform foundation, not a ' +
      'configuration action, and no role at Tier 2 can pass this gate.',
    example: 'Creating a new capability',
    sourceRefs: ['L12037', 'L31599', 'L31674'],
  },
  {
    requestClass: 'alter-core-agent-definition',
    outcome: 'explicitlyProhibited',
    reason:
      'Altering a core agent’s definition is refused at the service layer, not merely hidden in the user ' +
      'interface. Core agents are defined once, platform-wide, so that every tenant runs the same verified set.',
    example: 'Changing what the Prevention Agent fundamentally is',
    sourceRefs: ['L12038', 'L11987'],
  },
  {
    requestClass: 'alter-memory-architecture',
    outcome: 'explicitlyProhibited',
    reason:
      'Altering the memory architecture is refused at the service layer, not merely hidden in the user ' +
      'interface. The memory architecture is platform-owned and is what keeps tenants isolated from one another.',
    example: 'Adding a sixth typed memory store',
    sourceRefs: ['L12039', 'L11987'],
  },
  {
    requestClass: 'alter-evaluation-harness',
    outcome: 'explicitlyProhibited',
    reason:
      'Altering the evaluation harness is refused at the service layer, not merely hidden in the user ' +
      'interface. The evaluation gate has no off position for any account, including the root.',
    example: 'Weakening an evaluation scenario',
    sourceRefs: ['L12040', 'L11987'],
  },
  {
    requestClass: 'compose-action-agent',
    outcome: 'clientDecisionRequired',
    reason:
      'Tenant-composed action agents are deferred beyond V1, so no composition path produces one. The ' +
      'storyboard states the deferral rather than guessing what the eventual rule will be.',
    example: 'An agent that changes state',
    sourceRefs: ['L12041', 'L11989'],
  },
] as const satisfies readonly Tier2ClassificationRow[]

type MissingFromClassification = Exclude<
  Tier2RequestClass,
  (typeof TIER_TWO_CLASSIFICATION)[number]['requestClass']
>
const _classificationExhaustive: MissingFromClassification extends never ? true : never = true
void _classificationExhaustive

const ROW_BY_CLASS = new Map<Tier2RequestClass, Tier2ClassificationRow>(
  TIER_TWO_CLASSIFICATION.map((r) => [r.requestClass, r]),
)

/**
 * The four `Explicitly prohibited` rows, derived from the table rather than
 * re-listed beside it. A second hand-written list of the same four is how the
 * table and its consumers drift apart.
 */
const DEFINE_CLASS: ReadonlySet<Tier2RequestClass> = new Set(
  TIER_TWO_CLASSIFICATION.filter((r) => r.outcome === 'explicitlyProhibited').map(
    (r) => r.requestClass,
  ),
)

/**
 * A define-class request is one the Tier-2 boundary refuses universally
 * (L31599). `compose-action-agent` is NOT one: it is deferred, which is an
 * unanswered question rather than a prohibition.
 */
export function isDefineClassRequest(requestClass: Tier2RequestClass): boolean {
  return DEFINE_CLASS.has(requestClass)
}

export interface Tier2Classification {
  readonly requestClass: Tier2RequestClass
  readonly outcome: PermissionOutcome
  readonly reason: string
  readonly example: string
  /** True for the four the boundary refuses universally. */
  readonly defineClass: boolean
  readonly decision: PermissionDecision
}

/**
 * S7. Classifies a request against the Tier-2 boundary and nothing else — it
 * answers "may anyone at Tier 2 do this at all", never "may THIS person do
 * it", which is `evaluateStudioAccess`'s question. A request can be permitted
 * here and still refused there.
 *
 * `stage: 'BASE_ROLE'` deliberately. The Tier-2 boundary is not one of the
 * ordered access stages, and `EvaluationStage` lives in `@/policy/decision`,
 * which is outside this task's path list. `BASE_ROLE` is the least-wrong of
 * the nine because the refusal IS a statement about base authority — "Roles
 * allowed: none — this is a universal refusal" (L31599). A dedicated
 * `TIER_TWO_BOUNDARY` stage would be a better label and is flagged in this
 * task's report as a one-line change to `@/policy/decision` for whoever owns
 * that file next.
 */
export function classifyTierTwoRefusal(requestClass: Tier2RequestClass): Tier2Classification {
  const row = ROW_BY_CLASS.get(requestClass)
  // Unreachable for a well-typed caller: `_classificationExhaustive` above
  // proves every Tier2RequestClass has a row.
  if (!row) throw new Error(`No Tier-2 classification row for ${requestClass}`)

  const defineClass = DEFINE_CLASS.has(requestClass)
  const opts = {
    stage: 'BASE_ROLE',
    sourceRefs: row.sourceRefs,
    auditExpectation: (defineClass ? 'RECORDED_AS_REFUSAL' : 'RECORDED') satisfies AuditExpectation,
  } as const

  const decision: PermissionDecision = defineClass
    ? deny('explicitlyProhibited', 'HARD_GATE', row.reason, {
        ...opts,
        conditionToEnable:
          'Nothing. This is a platform engineering change in the foundation, submitted by a Platform ' +
          'Engineer and approved by an Admin, not a Studio action.',
      })
    : row.outcome === 'clientDecisionRequired'
      ? deny('clientDecisionRequired', 'DECISION_OPEN', row.reason, opts)
      : decide(
          row.outcome === 'allowed' ? 'allowed' : 'allowedWithConditions',
          row.outcome === 'allowed' ? 'ALLOWED' : 'CONDITIONS_APPLY',
          row.reason,
          opts,
        )

  return {
    requestClass,
    outcome: decision.outcome,
    reason: row.reason,
    example: row.example,
    defineClass,
    decision,
  }
}

// ---------------------------------------------------------------------------
// Enforcement, and the audit asymmetry
// ---------------------------------------------------------------------------

/** What the audit trail records for a refused define-class request. */
export interface TierTwoRefusalAudit {
  /** L34657: audited "with identity and action, never with 'acting as role'". */
  readonly identityId: string
  readonly action: Tier2RequestClass
  readonly outcome: PermissionOutcome
  readonly reason: string
  /** Free text from the caller: what was actually asked for. */
  readonly detail: string
}

/**
 * A typed result, never a thrown exception on the expected path. A sink that
 * throws anyway is caught by `enforceTierTwoBoundary` — see below.
 */
export type TierTwoAuditResult = { readonly ok: true } | { readonly ok: false; readonly failure: string }

export type TierTwoAuditWrite = (entry: TierTwoRefusalAudit) => TierTwoAuditResult

export interface TierTwoRequest {
  readonly requestClass: Tier2RequestClass
  /** The acting person. Never a role — L34657. */
  readonly actorIdentityId: string
  /** What was actually asked for, for the audit entry. */
  readonly detail: string
}

export interface TierTwoEnforcement {
  /** True only for a define-class request. Deferral is not a refusal. */
  readonly refused: boolean
  readonly outcome: PermissionOutcome
  readonly reason: string
  readonly decision: PermissionDecision
  /**
   * Whether the refusal reached the audit trail. `'not-required'` where there
   * was no refusal to audit. THIS FIELD NEVER LIES: a refusal whose audit
   * write failed reports `'failed'`, and still refuses.
   */
  readonly audit: 'written' | 'failed' | 'not-required'
  readonly auditFailure: string | null
}

/**
 * Enforce the Tier-2 boundary at the service layer (`AC-STU-041`).
 *
 * The audit write is attempted for a refusal and its result is REPORTED, never
 * allowed to change the decision. L31599: "the refusal itself is audited, and
 * if the audit write fails, the refusal is still enforced because refusing is
 * the safe direction."
 *
 * The try/catch is not defensive noise. It is the contract: a sink that throws
 * must not propagate out of the refusal path, because a caller that catches an
 * exception around this call has to decide what to do next — and "an exception
 * escaped, so the request went through" is the fail-OPEN direction this whole
 * boundary exists to close.
 */
export function enforceTierTwoBoundary(
  request: TierTwoRequest,
  writeAudit: TierTwoAuditWrite,
): TierTwoEnforcement {
  const classified = classifyTierTwoRefusal(request.requestClass)

  if (!classified.defineClass) {
    return {
      refused: false,
      outcome: classified.outcome,
      reason: classified.reason,
      decision: classified.decision,
      audit: 'not-required',
      auditFailure: null,
    }
  }

  const entry: TierTwoRefusalAudit = {
    identityId: request.actorIdentityId,
    action: request.requestClass,
    outcome: classified.outcome,
    reason: classified.reason,
    detail: request.detail,
  }

  let auditFailure: string | null = null
  try {
    const result = writeAudit(entry)
    if (!result.ok) auditFailure = result.failure
  } catch (e) {
    auditFailure = e instanceof Error ? e.message : String(e)
  }

  return {
    refused: true,
    outcome: classified.outcome,
    reason: classified.reason,
    decision: classified.decision,
    audit: auditFailure === null ? 'written' : 'failed',
    auditFailure,
  }
}
