import type { RoleId } from '@/domain/roles'
import type {
  IdentitySimulationState,
  ScenarioDomainState,
} from '@/domain/state'
import { allow, deny, type PermissionDecision } from './decision'

export interface AccessRequest {
  readonly action: string
  readonly allowedRoles: readonly RoleId[]
  readonly deniedRoles?: readonly RoleId[]
  readonly requiredSites?: readonly string[]
  readonly requiredAreas?: readonly string[]
  readonly requiredFeature?: string
  readonly requiredQualifications?: readonly string[]
  readonly requiresOnline?: boolean
  readonly requiresTrustedDevice?: boolean
  /** When set, the actor who made the change being approved. */
  readonly makerCheckerOf?: string | null
  readonly objectState?: string
  readonly allowedObjectStates?: readonly string[]
  /** Set when an open client decision governs this behaviour. */
  readonly openDecision?: string
  readonly sourceRefs: readonly string[]
}

export interface AccessContext {
  readonly state: ScenarioDomainState
  readonly identity: IdentitySimulationState
  readonly online: boolean
  readonly deviceTrusted: boolean
  /**
   * The signed-in person's stable id, for segregation of duties.
   * RULING 1: required (not `actorOfRecord?:`) because exactOptionalPropertyTypes
   * is on and every caller already supplies this field explicitly.
   */
  readonly actorOfRecord: string | null
}

const SUSPENDED_STATES = new Set([
  'SOFT_SUSPENDED',
  'HARD_SUSPENDED',
  'COMPLIANCE_SUSPENDED',
])

/**
 * The nine stages run in a fixed order and the earliest failure wins, so a
 * denial never leaks information from a later stage. Explicit deny beats
 * allow. Scopes intersect. Spec section 3.4.
 */
export function evaluateAccess(
  req: AccessRequest,
  ctx: AccessContext,
): PermissionDecision {
  const { identity, state } = ctx
  const refs = req.sourceRefs

  // 1. Authenticated simulated identity and active session.
  if (!identity.signedIn || identity.role === null) {
    return deny('blocked', 'NO_ACTIVE_SESSION', undefined, {
      stage: 'SESSION',
      sourceRefs: refs,
      conditionToEnable: 'Sign in on this surface.',
    })
  }
  const role = identity.role

  // 2. Tenant isolation. A tenant role must be inside a known tenant.
  if (identity.tenant !== null && state.tenants[identity.tenant] === undefined) {
    return deny('blocked', 'TENANT_MISMATCH', undefined, {
      stage: 'TENANT_ISOLATION',
      sourceRefs: refs,
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
  }

  // 3. Base-role union, with explicit deny winning.
  if (req.deniedRoles?.includes(role)) {
    return deny('blocked', 'EXPLICIT_DENY', undefined, {
      stage: 'BASE_ROLE',
      sourceRefs: refs,
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
  }
  if (!req.allowedRoles.includes(role)) {
    return deny('blocked', 'ROLE_NOT_GRANTED', undefined, {
      stage: 'BASE_ROLE',
      sourceRefs: refs,
    })
  }

  // 4. Scope intersection.
  if (
    req.requiredSites?.length &&
    !req.requiredSites.some((s) => identity.siteScope.includes(s))
  ) {
    return deny('blocked', 'OUT_OF_SCOPE', undefined, {
      stage: 'SCOPE',
      sourceRefs: refs,
    })
  }
  if (
    req.requiredAreas?.length &&
    !req.requiredAreas.some((a) => identity.areaScope.includes(a))
  ) {
    return deny('blocked', 'OUT_OF_SCOPE', undefined, {
      stage: 'SCOPE',
      sourceRefs: refs,
    })
  }

  // 5. Feature enablement, platform floor, tenant effective value, suspension.
  const partition = identity.tenant ? state.tenants[identity.tenant] : undefined
  if (partition && SUSPENDED_STATES.has(partition.lifecycleState)) {
    return deny('unavailable', 'TENANT_SUSPENDED', undefined, {
      stage: 'FEATURE_AND_SUSPENSION',
      sourceRefs: refs,
      conditionToEnable: 'The tenant suspension must be released.',
    })
  }
  if (req.requiredFeature) {
    const globalValue = state.platform.featureControls[req.requiredFeature]
    if (globalValue === false) {
      // A global disable is an effective ceiling. A tenant desired value
      // can never re-enable it.
      return deny('unavailable', 'GLOBAL_FEATURE_DISABLED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
    const desired = partition?.desiredFeatureValues[req.requiredFeature]
    if (globalValue === undefined && desired !== true) {
      return deny('unavailable', 'FEATURE_DISABLED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
    if (desired === false) {
      return deny('unavailable', 'FEATURE_DISABLED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
  }

  // 6. Object lifecycle and version state.
  if (
    req.allowedObjectStates?.length &&
    req.objectState !== undefined &&
    !req.allowedObjectStates.includes(req.objectState)
  ) {
    return deny('blocked', 'OBJECT_STATE_INVALID', undefined, {
      stage: 'OBJECT_STATE',
      sourceRefs: refs,
      conditionToEnable: `The record must be in one of: ${req.allowedObjectStates.join(', ')}.`,
    })
  }

  // 7. Worker qualification and assignment.
  if (req.requiredQualifications?.length) {
    const missing = req.requiredQualifications.filter(
      (q) => !identity.qualifications.includes(q),
    )
    if (missing.length > 0) {
      return deny('blocked', 'MISSING_QUALIFICATION', undefined, {
        stage: 'QUALIFICATION',
        sourceRefs: refs,
        conditionToEnable: `A current qualification is needed: ${missing.join(', ')}.`,
      })
    }
  }

  // 8. Device trust, connectivity, package, offline authorisation.
  if (req.requiresTrustedDevice && !ctx.deviceTrusted) {
    return deny('unavailable', 'DEVICE_UNTRUSTED', undefined, {
      stage: 'DEVICE_AND_CONNECTIVITY',
      sourceRefs: refs,
    })
  }
  if (req.requiresOnline && !ctx.online) {
    return deny('unavailable', 'OFFLINE_NOT_AUTHORISED', undefined, {
      stage: 'DEVICE_AND_CONNECTIVITY',
      sourceRefs: refs,
      conditionToEnable: 'Reconnect to complete this action.',
    })
  }

  // 9. Segregation of duties, maker-checker, human-decision gate.
  if (
    req.makerCheckerOf != null &&
    ctx.actorOfRecord != null &&
    req.makerCheckerOf === ctx.actorOfRecord
  ) {
    return deny('blocked', 'SEGREGATION_OF_DUTIES', undefined, {
      stage: 'SEGREGATION_OF_DUTIES',
      sourceRefs: refs,
      auditExpectation: 'RECORDED_AS_REFUSAL',
      conditionToEnable: 'A different authorised person must approve this.',
    })
  }

  if (req.openDecision) {
    return deny('decisionRequired', 'DECISION_OPEN', undefined, {
      stage: 'SEGREGATION_OF_DUTIES',
      sourceRefs: [...refs, req.openDecision],
    })
  }

  return allow('SEGREGATION_OF_DUTIES', refs)
}
