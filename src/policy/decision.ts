/**
 * One decision union governs every route, navigation item, screen, field,
 * control, action, notification, audit view and artificial-intelligence
 * result. Spec section 3.4.
 *
 * Frozen source, L10238: "Every cell in every permission matrix carries an
 * explicit status from the closed set ... Blank cells are prohibited, because a
 * blank cell is an unanswered question that an implementer will answer privately
 * and inconsistently."
 *
 * CLOSED AT NINE. Adding a tenth is a scope decision, never a drift.
 */
export type PermissionOutcome =
  /** The actor may proceed. */
  | 'allowed'
  /** Permitted, but a stated condition applies and must be surfaced. */
  | 'allowedWithConditions'
  /** Visible and unchangeable, with the cause named. */
  | 'readOnly'
  /** A cached copy is readable; its age and origin must be shown. */
  | 'cachedReadOnlyOffline'
  /** Accepted locally, takes effect later. Renders in its TRUE command state. */
  | 'queuedOffline'
  /** Genuinely unavailable now — suspension, connectivity, or object state. */
  | 'unavailable'
  /** The source explicitly prohibits this actor. Audited as a refusal. */
  | 'explicitlyProhibited'
  /** An open client decision governs this; the storyboard will not guess. */
  | 'clientDecisionRequired'
  /** Does not apply here. Carries a REQUIRED stated reason. */
  | 'notApplicable'

/**
 * RULING 2: frozen, in source order. A reviewer can see at a glance that this
 * is the complete nine — the exhaustiveness check just below fails to
 * compile if a tenth outcome is ever added to the union without adding it
 * here too. The permission-matrix rendering in a later slice consumes this
 * array directly.
 */
export const PERMISSION_OUTCOMES = [
  'allowed',
  'allowedWithConditions',
  'readOnly',
  'cachedReadOnlyOffline',
  'queuedOffline',
  'unavailable',
  'explicitlyProhibited',
  'clientDecisionRequired',
  'notApplicable',
] as const satisfies readonly PermissionOutcome[]

/**
 * Compile-time proof that PERMISSION_OUTCOMES lists every member of
 * PermissionOutcome, not just nine strings that happen to match today. If a
 * tenth outcome is added to the union above without adding it to the array,
 * `MissingFromOutcomes` stops being `never` and this line fails to compile.
 */
type MissingFromOutcomes = Exclude<PermissionOutcome, (typeof PERMISSION_OUTCOMES)[number]>
const _permissionOutcomesAreExhaustive: MissingFromOutcomes extends never ? true : never = true
void _permissionOutcomesAreExhaustive

/**
 * How a FIELD renders. Deliberately separate from PermissionOutcome: a field
 * can be redacted on a screen the actor is fully allowed to use. Conflating
 * the two is what made the earlier six-member union ambiguous.
 */
export type FieldTreatment = 'visible' | 'redacted' | 'hidden'

/**
 * The nine ordered stages of effective-access evaluation, plus two markers
 * used outside that ordered evaluation: 'ALL_STAGES_PASSED' reports which
 * decision granted an allow (never a false claim of a specific denial
 * stage), and 'COMMAND_VALIDATION' marks a kernel-level command field-shape
 * check that runs after authorisation succeeds — it is not one of the nine
 * access stages and must never be reported as stage 6 (OBJECT_STATE).
 * Spec section 3.4.
 */
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
  | 'ALL_STAGES_PASSED'
  | 'COMMAND_VALIDATION'

export type AuditExpectation =
  /** The source requires this outcome to be written to the audit trail. */
  | 'RECORDED'
  /** A refusal recorded under an explicit derived-clarification policy. */
  | 'RECORDED_AS_REFUSAL'
  /** The source does not require an audit record for this outcome. */
  | 'NOT_AUDITED'

interface PermissionDecisionBase {
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

/**
 * A discriminated union, so a reasonless `notApplicable` cannot be
 * constructed. `notApplicableReason?: never` on the other arm makes the
 * compiler reject supplying one where it is meaningless.
 */
export type PermissionDecision =
  | (PermissionDecisionBase & {
      readonly outcome: Exclude<PermissionOutcome, 'notApplicable'>
      readonly notApplicableReason?: never
    })
  | (PermissionDecisionBase & {
      readonly outcome: 'notApplicable'
      readonly notApplicableReason: string
    })

const ACTION_OUTCOMES = new Set<PermissionOutcome>([
  'allowed',
  'allowedWithConditions',
  // Accepted locally; effect is deferred, but the action was not refused.
  'queuedOffline',
])

const READ_OUTCOMES = new Set<PermissionOutcome>([
  'allowed',
  'allowedWithConditions',
  'queuedOffline',
  'readOnly',
  'cachedReadOnlyOffline',
])

export function permitsAction(d: PermissionDecision): boolean {
  return ACTION_OUTCOMES.has(d.outcome)
}

export function permitsRead(d: PermissionDecision): boolean {
  return READ_OUTCOMES.has(d.outcome)
}

export function isRefusal(d: PermissionDecision): boolean {
  return !READ_OUTCOMES.has(d.outcome)
}

export const REASON_CODES = {
  ALLOWED:
    'The current role, scope and object state all permit this action.',
  NO_ACTIVE_SESSION:
    'No identity is selected on this surface, so no action can be attributed to a person.',
  TENANT_MISMATCH:
    'This record belongs to a different tenant, and tenants are kept completely separate.',
  ROLE_NOT_GRANTED:
    'The current role does not carry a grant for this action.',
  EXPLICIT_DENY:
    'An explicit denial applies to this role, and an explicit denial always wins.',
  OUT_OF_SCOPE:
    'This record sits outside the site, area or shift the current person is scoped to.',
  FEATURE_DISABLED:
    'The capability is switched off for this tenant, so the action cannot run.',
  GLOBAL_FEATURE_DISABLED:
    'The platform has switched this capability off everywhere, which no tenant setting can re-enable.',
  FEATURE_NOT_REGISTERED:
    'The platform has never registered this capability, so no tenant setting can switch it on.',
  ENTITLEMENT_MISSING:
    'The tenant’s current tier does not include this capability.',
  TENANT_SUSPENDED:
    'The tenant is suspended, so actions that create or change work are refused.',
  TENANT_NOT_ACTIVE:
    'The tenant is still being set up or has been archived, so day-to-day actions are refused until it is active.',
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
  NOT_APPLICABLE:
    'This capability does not apply in this situation, for the reason stated.',
  CONDITIONS_APPLY:
    'You may proceed, but a condition applies and is stated alongside the action.',
  READ_ONLY_RECORD:
    'This record can be read but not changed right now, and the cause is named.',
  CACHED_WHILE_OFFLINE:
    'This is a stored copy read while offline, and its age and origin are shown.',
  QUEUED_WHILE_OFFLINE:
    'The action was accepted on this device and will take effect when it reaches the server.',
} as const

export type ReasonCode = keyof typeof REASON_CODES

interface DecideOptions {
  readonly stage: EvaluationStage
  readonly sourceRefs: readonly string[]
  readonly auditExpectation?: AuditExpectation
  readonly conditionToEnable?: string
}

/**
 * RULING 1: the one general constructor carrying the shared decision-shape
 * logic. `allow`, `deny` and `notApplicable` are thin, honestly-named
 * wrappers over this (`notApplicable` builds its own literal instead, since
 * its shape carries a required extra field this signature has no room for).
 * Excludes 'notApplicable' from `outcome` for the same reason.
 */
export function decide(
  outcome: Exclude<PermissionOutcome, 'notApplicable'>,
  reasonCode: ReasonCode,
  explanation: string | undefined,
  opts: DecideOptions,
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

export function allow(
  stage: EvaluationStage,
  sourceRefs: readonly string[],
): PermissionDecision {
  return decide('allowed', 'ALLOWED', REASON_CODES.ALLOWED, {
    stage,
    sourceRefs,
    auditExpectation: 'RECORDED',
  })
}

/**
 * RULING 1: narrowed to the genuine refusals only. `allowedWithConditions`,
 * `readOnly`, `cachedReadOnlyOffline` and `queuedOffline` are permitted
 * outcomes, not denials — a constructor named `deny` producing "allowed with
 * conditions" would mislead every future implementer. Those four go through
 * `decide` instead.
 */
export function deny(
  outcome: 'unavailable' | 'explicitlyProhibited' | 'clientDecisionRequired',
  reasonCode: ReasonCode,
  explanation: string | undefined,
  opts: DecideOptions,
): PermissionDecision {
  return decide(outcome, reasonCode, explanation, opts)
}

export function notApplicable(
  reason: string,
  opts: { stage: EvaluationStage; sourceRefs: readonly string[] },
): PermissionDecision {
  if (reason.trim() === '') {
    throw new Error('notApplicable requires a stated reason')
  }
  return {
    outcome: 'notApplicable',
    notApplicableReason: reason,
    reasonCode: 'NOT_APPLICABLE',
    explanation: `This does not apply here: ${reason}.`,
    stage: opts.stage,
    sourceRefs: opts.sourceRefs,
    auditExpectation: 'NOT_AUDITED',
    conditionToEnable: null,
  }
}
