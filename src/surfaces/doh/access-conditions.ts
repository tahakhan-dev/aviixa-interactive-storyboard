/**
 * The SURF-DOH spine, part 4 of 6: the nine intersecting access conditions.
 * Spec §2 S1.
 *
 * THE SOURCE CARRIES TWO STRUCTURES HERE, AND THIS FILE NOW HOLDS BOTH.
 *
 * CORRECTED BEFORE IMPLEMENTATION (commit ba32256): an earlier reading cited
 * L14531 [cited-in-error: L14531] for a "safety-first evaluation order". Half
 * of that correction stands and half of it does not, and both halves matter:
 *
 * - RIGHT. The citation was off by one. L14531 is the request-arrival step,
 *   not an ordered list, and `ACCESS_CONDITIONS` below is the DEFINITION
 *   enumeration at L14514-L14522, where role permission is first and safety
 *   controls are ninth. That list is not re-sorted, then or now.
 * - WRONG. A safety-first evaluation order does exist, one line further on.
 *   The numbered workflow at L14529 runs safety at L14532, role permission at
 *   L14533, assigned scope at L14534, tenant entitlement at L14535, object
 *   state at L14536, qualification at L14537, active grants at L14538, device
 *   and connectivity at L14539 and segregation of duties at L14540. That is
 *   `EVALUATION_ORDER` below.
 *
 * A list of WHAT CONDITIONS EXIST and a statement of WHAT ORDER THEY ARE
 * EVALUATED IN are different claims, and the source makes both. Neither array
 * here is derived from the other: one is a definition, one is an order, and
 * collapsing them is what shipped a safety breach to a reader as a
 * role-permission refusal.
 */
export type AccessCondition =
  | 'role-permission'
  | 'assigned-scope'
  | 'tenant-entitlement'
  | 'object-state'
  | 'qualification'
  | 'active-grant'
  | 'device-and-connectivity'
  | 'segregation-of-duties'
  | 'safety-controls'

/** The definition enumeration, L14514-L14522. Safety is ninth here. */
export const ACCESS_CONDITIONS = [
  'role-permission',
  'assigned-scope',
  'tenant-entitlement',
  'object-state',
  'qualification',
  'active-grant',
  'device-and-connectivity',
  'segregation-of-duties',
  'safety-controls',
] as const satisfies readonly AccessCondition[]

type MissingFromAccessConditions = Exclude<AccessCondition, (typeof ACCESS_CONDITIONS)[number]>
const _accessConditionsExhaustive: MissingFromAccessConditions extends never ? true : never = true
void _accessConditionsExhaustive

/**
 * The evaluation order, steps 2 to 10 of the numbered workflow at L14529.
 * Safety is FIRST here, per L14532: "Safety controls are evaluated first. A
 * request that would override a specification gate or the evaluation gate, or
 * that would breach a platform invariant, is refused immediately and recorded
 * as a safety refusal."
 *
 * The same nine members as `ACCESS_CONDITIONS`, in the workflow's order — the
 * exhaustiveness check below proves the membership, and the slice-4 gate
 * proves the ORDER against the frozen source's own step lines rather than
 * against this array.
 */
export const EVALUATION_ORDER = [
  'safety-controls',
  'role-permission',
  'assigned-scope',
  'tenant-entitlement',
  'object-state',
  'qualification',
  'active-grant',
  'device-and-connectivity',
  'segregation-of-duties',
] as const satisfies readonly AccessCondition[]

type MissingFromEvaluationOrder = Exclude<AccessCondition, (typeof EVALUATION_ORDER)[number]>
const _evaluationOrderExhaustive: MissingFromEvaluationOrder extends never ? true : never = true
void _evaluationOrderExhaustive

/**
 * The two rules that sit ABOVE the nine-condition intersection (L14524),
 * in the order the source states them. Neither is negotiable:
 *
 * - `explicit-deny-wins`: where any condition produces an explicit deny,
 *   the request is refused regardless of how many conditions allowed —
 *   matters most for multi-role identities.
 * - `safety-controls-win`: where a safety control conflicts with any other
 *   condition — including a root-level allow — the safety control decides.
 *
 * These are two SEPARATE rules, and a safety breach reported as an explicit
 * deny names the wrong one. Precedence is not the whole story either: the
 * numbered workflow also gives safety a POSITION, and `EVALUATION_ORDER`
 * carries it.
 */
export type PrecedenceRule = 'explicit-deny-wins' | 'safety-controls-win'

export const PRECEDENCE_RULES = [
  'explicit-deny-wins',
  'safety-controls-win',
] as const satisfies readonly PrecedenceRule[]

type MissingFromPrecedenceRules = Exclude<PrecedenceRule, (typeof PRECEDENCE_RULES)[number]>
const _precedenceRulesExhaustive: MissingFromPrecedenceRules extends never ? true : never = true
void _precedenceRulesExhaustive
