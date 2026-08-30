import { deny, type PermissionDecision } from '@/policy/decision'
import { evaluateAccess, type AccessContext, type AccessRequest } from '@/policy/evaluate'
import type { RoleId } from '@/domain/roles'
import { ccScreen, type CcScreenId } from './screens'

/**
 * `evaluateCCAccess` — the Command Center's ONLY access entry point.
 * LAYERED on slice 3's `evaluateAccess` (`@/policy/evaluate`), never a fork
 * of it, exactly as `evaluateStudioAccess` and `evaluateFrontlineAccess` are.
 *
 * THE ONE THING THIS LAYER ADDS. Two of the five tenant roles are excluded
 * from this surface at the door rather than cell by cell, and the source is
 * emphatic that the difference matters (L34963) — "This is not a permissions
 * matrix nuance to be softened into read-only access. It is an access
 * exclusion at the surface boundary: an Auditor session must not be able to
 * render a Command Center route at all." The criterion is `AC-SCR-CC-001`
 * (L48492) — "All thirteen screens exist, and the Read-only Auditor cannot
 * authenticate into any of them." The Worker is excluded on the same footing
 * (L34965) — "never uses the Command Center; the worker's surface is the
 * Frontline Worker Application". The landing table gives both the same
 * verdict where every other role has a named landing view, on rows L35080
 * and L35081.
 *
 * SO THE EXCLUSION IS CHECKED FIRST AND UNCONDITIONALLY, AND THAT PLACEMENT
 * IS THE WHOLE POINT OF THE FUNCTION. `src/frontline/access.ts` records what
 * happens otherwise: `forcesSyncFirst` was tested INSIDE that evaluator's
 * `ctx.online` branch, so a forced-sync write taken offline fell straight
 * through to the queue, and wave 0's own test asked the question only with
 * `online: true`. Two modules found it independently after wave 0 was
 * committed. Here the equivalent mistake is to consult `req.allowedRoles`
 * first and treat the exclusion as one more denied role — which is exactly
 * the "permissions matrix nuance" the source names and rejects, and which
 * would let any later task readmit an Auditor by listing the role on one
 * request. Nothing about the request, the connection or the session is read
 * before this check, and `tests/unit/cc-spine.test.ts` asks it with the
 * excluded role EXPLICITLY GRANTED on the request.
 *
 * WHAT THIS LAYER DELIBERATELY DOES NOT ADD, and the contrast is with the
 * Frontline rather than with nothing. The Frontline converts a permitted act
 * performed offline into `queuedOffline` or `cachedReadOnlyOffline`, because
 * it is an offline-first device surface. The Command Center is the opposite:
 * its feature register reads "Online-only — web surface, no offline mode"
 * (L47522), so a Command Center act with no connection is genuinely
 * unavailable and `evaluateAccess`'s own answer is already the right one.
 * REUSE THE SHAPE, NEVER THE RULING.
 */

/**
 * The two roles excluded from the surface itself. Not a permission list — a
 * door. Every other role's access is decided by `evaluateAccess` on the
 * request, as on every other surface.
 */
export const CC_EXCLUDED_ROLES = ['READONLY_AUDITOR', 'WORKER'] as const satisfies readonly RoleId[]

export type CcExcludedRole = (typeof CC_EXCLUDED_ROLES)[number]

export const isCcExcludedRole = (role: RoleId): role is CcExcludedRole =>
  (CC_EXCLUDED_ROLES as readonly RoleId[]).includes(role)

export function evaluateCCAccess(req: AccessRequest, ctx: AccessContext): PermissionDecision {
  // THE SURFACE EXCLUSION. Before the session check, before the request is
  // read at all, and outside every branch. `role !== null` narrows a type; it
  // does not qualify the rule.
  const role = ctx.identity.role
  if (role !== null && isCcExcludedRole(role)) {
    return deny('explicitlyProhibited', 'EXPLICIT_DENY', ccExclusionReason(role), {
      stage: 'BASE_ROLE',
      sourceRefs: [...req.sourceRefs, 'L34963', 'L34965', 'AC-SCR-CC-001'],
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
  }
  return evaluateAccess(req, ctx)
}

function ccExclusionReason(role: CcExcludedRole): string {
  return role === 'READONLY_AUDITOR'
    ? 'The Read-only Auditor holds no Command Center access at all. This is an exclusion at the ' +
        'surface boundary, not a read-only cell: a live control room shows in-flight, ' +
        'as-of-stamped state that the record will later correct, and the record is the auditable ' +
        'artefact. The same decisions are readable on the Delivery Operations Hub.'
    : 'The Worker never uses the Command Center. The worker’s surface is the Frontline Worker ' +
        'Application, and this exclusion is why no Command Center screen has a worker view to ' +
        'degrade to.'
}

/**
 * May this role OPEN this screen? Answered from the register's own `Roles
 * that can open it` column, with the surface exclusion applied FIRST and
 * separately.
 *
 * The order is load-bearing for the same reason as above: a slice-9 task
 * reading `rolesThatCanOpen` alone would get the right answer today and the
 * wrong one the moment anybody adds an excluded role to a screen record. The
 * exclusion is not a member of that list and cannot be edited out of it.
 */
export function ccScreenOpensFor(screen: CcScreenId, role: RoleId): boolean {
  if (isCcExcludedRole(role)) return false
  return ccScreen(screen).rolesThatCanOpen.includes(role)
}
