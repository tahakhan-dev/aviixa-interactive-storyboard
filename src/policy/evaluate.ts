import { roleById, type RoleId } from '@/domain/roles'
import type { TenantId } from '@/domain/ids'
import {
  tenantPartition,
  type IdentitySimulationState,
  type ScenarioDomainState,
} from '@/domain/state'
import { allow, deny, type PermissionDecision } from './decision'

export interface AccessRequest {
  readonly action: string
  readonly allowedRoles: readonly RoleId[]
  readonly deniedRoles?: readonly RoleId[]
  readonly requiredSites?: readonly string[]
  readonly requiredAreas?: readonly string[]
  /** IMPORTANT 3 (stage 4): the shift(s) this action is scoped to. */
  readonly requiredShifts?: readonly string[]
  /** IMPORTANT 3 (stage 4): the specific object id(s) this action is scoped to. */
  readonly requiredObjectScope?: readonly string[]
  /** IMPORTANT 3 (stage 4): a named temporary grant the actor must hold. */
  readonly requiredTemporaryGrant?: string
  readonly requiredFeature?: string
  /** IMPORTANT 3 (stage 5): the tenant's tier must carry this entitlement. */
  readonly requiredEntitlement?: string
  readonly requiredQualifications?: readonly string[]
  readonly objectState?: string
  readonly allowedObjectStates?: readonly string[]
  /**
   * IMPORTANT 3 (stage 6): the object version the actor last read. Declaring
   * `requiredObjectVersion` without a matching `objectVersion` fails closed
   * (STALE_VERSION), the same as `allowedObjectStates` without `objectState`.
   */
  readonly requiredObjectVersion?: number
  readonly objectVersion?: number
  readonly requiresOnline?: boolean
  readonly requiresTrustedDevice?: boolean
  /** IMPORTANT 3 (stage 8): the pinned work package for this run must be valid. */
  readonly requiresValidPackage?: boolean
  readonly packageValid?: boolean
  /** When set, the actor who made the change being approved. */
  readonly makerCheckerOf?: string | null
  /** IMPORTANT 3 (stage 9): an authorised approver must currently be available. */
  readonly requiresApproverAvailable?: boolean
  readonly approverAvailable?: boolean
  /** Set when an open client decision governs this behaviour. */
  readonly openDecision?: string
  /**
   * CRITICAL 1: the tenant that OWNS the record this action targets. Stage 2
   * compares this against the actor's own tenant — without it, stage 2 can
   * only check that the actor's tenant is live, never that the record being
   * written actually belongs to that tenant.
   *
   * CRITICAL 2: deliberately `TenantId`, never `TenantId | null`. The old
   * `| null` type let a caller write `resourceTenant: lookup(id)?.tenantId ??
   * null` and have stage 2 treat that as "no constraint declared" instead of
   * "declared, and the answer is no tenant" — the exact fail-open pattern
   * already closed for `allowedObjectStates`. Dropping `| null` makes that
   * mistake a COMPILE error (`?? null` no longer type-checks against
   * `TenantId | undefined`); the runtime check below also treats anything
   * other than `undefined` (including a stray `null` that reached this value
   * through an `any` boundary) as "declared", so it fails closed even if the
   * type system is bypassed.
   */
  readonly resourceTenant?: TenantId
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

/** Tenant lifecycle states that refuse actions outright: work is paused. */
const SUSPENDED_STATES = new Set([
  'SOFT_SUSPENDED',
  'HARD_SUSPENDED',
  'COMPLIANCE_SUSPENDED',
])

/**
 * Tenant lifecycle states that are not yet, or no longer, operational.
 * IMPORTANT 2: PROVISIONING (half set up) and ARCHIVED (done) must refuse
 * state-changing actions exactly as a suspension does — a tenant that has
 * never been switched on, or that is closed, is not "active" either.
 */
const NOT_YET_OR_NO_LONGER_ACTIVE_STATES = new Set(['PROVISIONING', 'ARCHIVED'])

/**
 * The nine stages below run in a fixed order and the earliest FAILING
 * condition wins, so a denial never leaks information from a later stage.
 * Explicit deny beats allow. A stage may check more than one condition (for
 * example, stage 4 intersects site, area, shift, object and temporary-grant
 * scope together; stage 9 checks segregation of duties, approver
 * availability and the human-decision gate together) -- within a stage,
 * checks run in the order written and the first failing one reports. Spec
 * section 3.4.
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

  // 2. Tenant isolation.
  //
  // CRITICAL 2: a null tenant is not a permissive default — it means
  // something different for each security domain, and it is never a
  // bypass. A TENANT-domain role (Supervisor, Quality Manager, ...) must
  // ambiently hold its own live tenant. A PLATFORM-domain role (Admin,
  // Support, ...) must NEVER ambiently hold a tenant at all; it acts
  // through named access sessions, so a non-null tenant on a platform role
  // is itself a violation, not a convenience.
  //
  // CRITICAL 1: when the request names the tenant that owns the record
  // being acted on (`resourceTenant`), that must match the actor's own
  // tenant too — otherwise stage 2 only ever checks that the ACTOR's
  // tenant is live, never that the object being written belongs to it,
  // which is how a signed-in Quality Manager in one tenant could act on
  // another tenant's record just by naming it in the command.
  const domain = roleById(role).domain
  if (domain === 'TENANT') {
    // CRITICAL 1(a): tenantPartition() is Object.hasOwn-based, so a tenant
    // id that spells 'constructor', '__proto__', etc. reports as genuinely
    // absent instead of resolving to an inherited Object.prototype member.
    if (identity.tenant === null || tenantPartition(state, identity.tenant) === undefined) {
      return deny('blocked', 'TENANT_MISMATCH', undefined, {
        stage: 'TENANT_ISOLATION',
        sourceRefs: refs,
        auditExpectation: 'RECORDED_AS_REFUSAL',
      })
    }
    // CRITICAL 2: `!== undefined`, not `!= null`. The type no longer allows
    // a real `null` here (see AccessRequest.resourceTenant), but the runtime
    // check must still treat anything other than "not supplied at all" as a
    // declared constraint -- including a `null` that reached this value
    // through an `any`/unvalidated boundary -- so it fails closed rather
    // than silently matching the old `!= null` skip-on-null behaviour.
    if (req.resourceTenant !== undefined && req.resourceTenant !== identity.tenant) {
      return deny('blocked', 'TENANT_MISMATCH', undefined, {
        stage: 'TENANT_ISOLATION',
        sourceRefs: refs,
        auditExpectation: 'RECORDED_AS_REFUSAL',
      })
    }
  } else {
    // domain === 'PLATFORM'
    if (identity.tenant !== null) {
      return deny('blocked', 'TENANT_MISMATCH', undefined, {
        stage: 'TENANT_ISOLATION',
        sourceRefs: refs,
        auditExpectation: 'RECORDED_AS_REFUSAL',
      })
    }
    // M4: a platform-domain role acts through a named access session, not
    // an ambient tenant -- but when the request DOES declare which tenant's
    // resource is being touched, that tenant must be known, exactly as the
    // TENANT branch above already requires for an ambient tenant. Without
    // this, stage 5's suspension check (which keys off identity.tenant for
    // a TENANT-domain role) had nothing to key off at all for a
    // PLATFORM-domain role, since identity.tenant is always null there --
    // an Admin acting on a HARD_SUSPENDED tenant's resource was allowed.
    if (req.resourceTenant !== undefined && tenantPartition(state, req.resourceTenant) === undefined) {
      return deny('blocked', 'TENANT_MISMATCH', undefined, {
        stage: 'TENANT_ISOLATION',
        sourceRefs: refs,
        auditExpectation: 'RECORDED_AS_REFUSAL',
      })
    }
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
  // IMPORTANT 3: shift, object and temporary-grant scope, completing spec
  // section 3.4's stage 4 list (Tenant/Site/Area/Shift/object/temporary
  // grant). An identity that carries no shiftScope/objectScope/
  // temporaryGrants at all fails closed against a declared requirement,
  // exactly like an empty siteScope/areaScope already does above.
  if (
    req.requiredShifts?.length &&
    !req.requiredShifts.some((sh) => identity.shiftScope?.includes(sh))
  ) {
    return deny('blocked', 'OUT_OF_SCOPE', undefined, {
      stage: 'SCOPE',
      sourceRefs: refs,
    })
  }
  if (
    req.requiredObjectScope?.length &&
    !req.requiredObjectScope.some((o) => identity.objectScope?.includes(o))
  ) {
    return deny('blocked', 'OUT_OF_SCOPE', undefined, {
      stage: 'SCOPE',
      sourceRefs: refs,
    })
  }
  if (
    req.requiredTemporaryGrant &&
    !identity.temporaryGrants?.includes(req.requiredTemporaryGrant)
  ) {
    return deny('blocked', 'OUT_OF_SCOPE', undefined, {
      stage: 'SCOPE',
      sourceRefs: refs,
    })
  }

  // 5. Feature enablement, entitlement, platform floor, tenant effective
  // value, suspension.
  //
  // M4: for a TENANT-domain role this is the actor's own tenant (already
  // proven live, and matching any declared resourceTenant, by stage 2 above).
  // For a PLATFORM-domain role identity.tenant is always null -- the tenant
  // whose suspension/entitlement state matters is the RESOURCE's declared
  // tenant, if the request names one. Keying this off identity.tenant alone
  // made a platform role blind to a HARD_SUSPENDED resourceTenant.
  const suspensionTenant: TenantId | null =
    domain === 'TENANT' ? identity.tenant : (req.resourceTenant ?? null)
  const partition = suspensionTenant !== null ? tenantPartition(state, suspensionTenant) : undefined
  if (partition && SUSPENDED_STATES.has(partition.lifecycleState)) {
    return deny('unavailable', 'TENANT_SUSPENDED', undefined, {
      stage: 'FEATURE_AND_SUSPENSION',
      sourceRefs: refs,
      conditionToEnable: 'The tenant suspension must be released.',
    })
  }
  // IMPORTANT 2: a tenant that is still provisioning or has been archived
  // is not suspended, but it is not operational either.
  if (partition && NOT_YET_OR_NO_LONGER_ACTIVE_STATES.has(partition.lifecycleState)) {
    return deny('unavailable', 'TENANT_NOT_ACTIVE', undefined, {
      stage: 'FEATURE_AND_SUSPENSION',
      sourceRefs: refs,
      conditionToEnable: 'The tenant must be active.',
    })
  }
  if (req.requiredFeature) {
    const globalValue = state.platform.featureControls[req.requiredFeature]
    const desired = partition?.desiredFeatureValues[req.requiredFeature]
    if (globalValue === false) {
      // A global disable is an effective ceiling. A tenant desired value
      // can never re-enable it.
      return deny('unavailable', 'GLOBAL_FEATURE_DISABLED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
    if (globalValue === undefined) {
      // IMPORTANT 1: absent global registration is a floor of OFF, not a
      // blank canvas tenant config can paint on. A typo'd or unreleased
      // feature name must never become tenant-enableable, and the refusal
      // must say the platform never registered it — not that the tenant
      // switched something off.
      return deny('unavailable', 'FEATURE_NOT_REGISTERED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
    // globalValue === true from here: available platform-wide unless the
    // tenant has explicitly opted out.
    if (desired === false) {
      return deny('unavailable', 'FEATURE_DISABLED', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
  }
  // IMPORTANT 3: entitlement, reading PlatformPartition.tiers (previously
  // never read at all). Fails closed: no tenant, no assigned tier, or a
  // tier the platform never defined all resolve to "no entitlements".
  if (req.requiredEntitlement) {
    const tierDef = partition ? state.platform.tiers[partition.tier] : undefined
    const entitlements = tierDef?.entitlements ?? []
    if (!entitlements.includes(req.requiredEntitlement)) {
      return deny('unavailable', 'ENTITLEMENT_MISSING', undefined, {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: refs,
      })
    }
  }

  // 6. Object lifecycle and version state.
  // IMPORTANT 3: a declared constraint must never be weaker than declaring
  // none. If allowedObjectStates is declared, an undefined objectState is a
  // denial, not a silent pass — the original `&& req.objectState !== undefined`
  // guard let a caller void its own constraint just by omitting the state.
  if (req.allowedObjectStates?.length) {
    if (
      req.objectState === undefined ||
      !req.allowedObjectStates.includes(req.objectState)
    ) {
      return deny('blocked', 'OBJECT_STATE_INVALID', undefined, {
        stage: 'OBJECT_STATE',
        sourceRefs: refs,
        conditionToEnable: `The record must be in one of: ${req.allowedObjectStates.join(', ')}.`,
      })
    }
  }
  // IMPORTANT 3: object version, completing stage 6's "object lifecycle AND
  // version state". Fails closed: declaring a required version without
  // supplying the object's current version is exactly the STALE_VERSION
  // case, not a silent pass.
  if (req.requiredObjectVersion !== undefined) {
    if (req.objectVersion === undefined || req.objectVersion !== req.requiredObjectVersion) {
      return deny('blocked', 'STALE_VERSION', undefined, {
        stage: 'OBJECT_STATE',
        sourceRefs: refs,
      })
    }
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
  // IMPORTANT 3: package, completing stage 8's "device trust, connectivity,
  // package, offline authorisation". Fails closed: requiring a valid package
  // without an explicit `packageValid: true` is a denial, not a pass.
  if (req.requiresValidPackage && req.packageValid !== true) {
    return deny('unavailable', 'PACKAGE_INVALID', undefined, {
      stage: 'DEVICE_AND_CONNECTIVITY',
      sourceRefs: refs,
    })
  }

  // 9. Segregation of duties, maker-checker, approver availability,
  // human-decision gate.
  // IMPORTANT 5: this must fail CLOSED. If the request declares a
  // maker-checker constraint at all, an unattributed actor (actorOfRecord
  // null) can never pass it — an unknown actor is exactly the case
  // segregation of duties exists to stop, not a free pass around it.
  if (req.makerCheckerOf != null) {
    if (ctx.actorOfRecord == null || req.makerCheckerOf === ctx.actorOfRecord) {
      return deny('blocked', 'SEGREGATION_OF_DUTIES', undefined, {
        stage: 'SEGREGATION_OF_DUTIES',
        sourceRefs: refs,
        auditExpectation: 'RECORDED_AS_REFUSAL',
        conditionToEnable: 'A different, identified authorised person must approve this.',
      })
    }
  }
  // IMPORTANT 3: approver availability. "The platform never approves on a
  // person's behalf" -- fails closed without an explicit
  // `approverAvailable: true`.
  if (req.requiresApproverAvailable && req.approverAvailable !== true) {
    return deny('blocked', 'APPROVER_UNAVAILABLE', undefined, {
      stage: 'SEGREGATION_OF_DUTIES',
      sourceRefs: refs,
      auditExpectation: 'RECORDED_AS_REFUSAL',
    })
  }

  if (req.openDecision) {
    return deny('decisionRequired', 'DECISION_OPEN', undefined, {
      stage: 'SEGREGATION_OF_DUTIES',
      sourceRefs: [...refs, req.openDecision],
    })
  }

  // MINOR 11: report the stage that actually granted the allow — never a
  // borrowed stage label like SEGREGATION_OF_DUTIES, which would make every
  // accepted audit entry falsely claim that stage produced the result.
  return allow('ALL_STAGES_PASSED', refs)
}
