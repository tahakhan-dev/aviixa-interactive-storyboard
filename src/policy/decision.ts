/**
 * One decision union governs every route, navigation item, screen, field,
 * control, action, notification, audit view and artificial-intelligence
 * result. Spec section 3.4.
 */
export type PermissionOutcome =
  /** The actor may proceed. */
  | 'allowed'
  /** Visible, but refused, with the reason shown. */
  | 'blocked'
  /** Not rendered at all, because revealing it would itself disclose something. */
  | 'hidden'
  /** Rendered with the sensitive value masked. */
  | 'redacted'
  /** Genuinely unavailable right now — suspended, offline, or wrong object state. */
  | 'unavailable'
  /** An open client decision governs this and no honest answer exists yet. */
  | 'decisionRequired'

/** The nine ordered stages of effective-access evaluation. Spec section 3.4. */
export type EvaluationStage =
  | 'SESSION'
  | 'TENANT_ISOLATION'
  | 'BASE_ROLE'
  | 'SCOPE'
  | 'FEATURE_AND_SUSPENSION'
  | 'OBJECT_STATE'
  | 'QUALIFICATION'
  | 'DEVICE_AND_CONNECTIVITY'
  | 'SEGREGATION_OF_DUTIES'

export type AuditExpectation =
  /** The source requires this outcome to be written to the audit trail. */
  | 'RECORDED'
  /** A refusal recorded under an explicit derived-clarification policy. */
  | 'RECORDED_AS_REFUSAL'
  /** The source does not require an audit record for this outcome. */
  | 'NOT_AUDITED'

export interface PermissionDecision {
  readonly outcome: PermissionOutcome
  readonly reasonCode: ReasonCode
  /** Plain language a non-specialist can act on. Never an identifier. */
  readonly explanation: string
  readonly stage: EvaluationStage
  /** Source or decision identifiers that govern this result. */
  readonly sourceRefs: readonly string[]
  readonly auditExpectation: AuditExpectation
  /** What would have to become true for this to be allowed. */
  readonly conditionToEnable: string | null
}

export const REASON_CODES = {
  ALLOWED:
    'The current role, scope and object state all permit this action.',
  NO_ACTIVE_SESSION:
    'No one is signed in on this surface, so no action can be attributed to a person.',
  TENANT_MISMATCH:
    'This record belongs to a different tenant, and tenants are kept completely separate.',
  ROLE_NOT_GRANTED:
    'The signed-in role does not carry a grant for this action.',
  EXPLICIT_DENY:
    'An explicit denial applies to this role, and an explicit denial always wins.',
  OUT_OF_SCOPE:
    'This record sits outside the site, area or shift the signed-in person is scoped to.',
  FEATURE_DISABLED:
    'The capability is switched off for this tenant, so the action cannot run.',
  GLOBAL_FEATURE_DISABLED:
    'The platform has switched this capability off everywhere, which no tenant setting can re-enable.',
  ENTITLEMENT_MISSING:
    'The tenant’s current tier does not include this capability.',
  TENANT_SUSPENDED:
    'The tenant is suspended, so actions that create or change work are refused.',
  OBJECT_STATE_INVALID:
    'The record is not in a state where this action makes sense.',
  STALE_VERSION:
    'Someone changed this record after it was loaded, so the action was refused rather than overwrite their work.',
  MISSING_QUALIFICATION:
    'The worker does not hold a current qualification that this work requires.',
  DEVICE_UNTRUSTED:
    'This device is not currently trusted to perform the action.',
  OFFLINE_NOT_AUTHORISED:
    'This action needs a confirmed connection and cannot be completed while offline.',
  PACKAGE_INVALID:
    'The pinned work package for this run is missing, expired or fails its integrity check.',
  SEGREGATION_OF_DUTIES:
    'The same person cannot both make and approve this change.',
  APPROVER_UNAVAILABLE:
    'No authorised approver is available, and the platform never approves on a person’s behalf.',
  HARD_GATE:
    'This is a hard gate. No role, setting or override can pass it.',
  DECISION_OPEN:
    'An open client decision governs this behaviour, so the storyboard will not pretend to know the answer.',
} as const

export type ReasonCode = keyof typeof REASON_CODES

interface DenyOptions {
  readonly stage: EvaluationStage
  readonly sourceRefs: readonly string[]
  readonly auditExpectation?: AuditExpectation
  readonly conditionToEnable?: string
}

export function allow(
  stage: EvaluationStage,
  sourceRefs: readonly string[],
): PermissionDecision {
  return {
    outcome: 'allowed',
    reasonCode: 'ALLOWED',
    explanation: REASON_CODES.ALLOWED,
    stage,
    sourceRefs,
    auditExpectation: 'RECORDED',
    conditionToEnable: null,
  }
}

export function deny(
  outcome: Exclude<PermissionOutcome, 'allowed'>,
  reasonCode: ReasonCode,
  explanation: string | undefined,
  opts: DenyOptions,
): PermissionDecision {
  return {
    outcome,
    reasonCode,
    explanation: explanation ?? REASON_CODES[reasonCode],
    stage: opts.stage,
    sourceRefs: opts.sourceRefs,
    auditExpectation: opts.auditExpectation ?? 'NOT_AUDITED',
    conditionToEnable: opts.conditionToEnable ?? null,
  }
}

export function isPermitted(d: PermissionDecision): boolean {
  return d.outcome === 'allowed'
}
