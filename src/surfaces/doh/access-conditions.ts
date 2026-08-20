/**
 * The SURF-DOH spine, part 4 of 6: the nine intersecting access conditions.
 * Spec §2 S1.
 *
 * CORRECTED BEFORE IMPLEMENTATION (commit ba32256): an earlier reading cited
 * L14531 for a "safety-first evaluation order" and none exists — that line
 * is the request-arrival step, not an ordered list. L14512 enumerates the
 * nine conditions with ROLE PERMISSION FIRST and SAFETY CONTROLS NINTH, and
 * puts two precedence rules ABOVE the intersection instead of reordering it.
 * Safety wins by PRECEDENCE, not by position — `SCR-DOH-ROLE-04` renders
 * this exact list to a reviewer, so a made-up ordering would have shipped
 * into every one of the eight modules that render a denial.
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
 * The two rules that sit ABOVE the nine-condition intersection (L14512),
 * in the order the source states them. Neither is negotiable:
 *
 * - `explicit-deny-wins`: where any condition produces an explicit deny,
 *   the request is refused regardless of how many conditions allowed —
 *   matters most for multi-role identities.
 * - `safety-controls-win`: where a safety control conflicts with any other
 *   condition — including a root-level allow — the safety control decides.
 *   This is HOW safety wins on this surface: by precedence, never by being
 *   evaluated first.
 */
export type PrecedenceRule = 'explicit-deny-wins' | 'safety-controls-win'

export const PRECEDENCE_RULES = [
  'explicit-deny-wins',
  'safety-controls-win',
] as const satisfies readonly PrecedenceRule[]

type MissingFromPrecedenceRules = Exclude<PrecedenceRule, (typeof PRECEDENCE_RULES)[number]>
const _precedenceRulesExhaustive: MissingFromPrecedenceRules extends never ? true : never = true
void _precedenceRulesExhaustive
