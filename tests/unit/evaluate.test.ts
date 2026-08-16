import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type IdentitySimulationState } from '@/domain/state'
import { evaluateAccess, type AccessRequest, type AccessContext } from '@/policy/evaluate'

const RUN = scenarioRunId('RUN-001')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')

function activeTenantState() {
  return withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
  }))
}

function identity(
  over: Partial<IdentitySimulationState> = {},
): IdentitySimulationState {
  return {
    signedIn: true,
    role: 'QUALITY_MANAGER',
    tenant: BRIGHT,
    siteScope: ['SITE-RIVERSIDE'],
    areaScope: ['AREA-ASSEMBLY'],
    qualifications: ['QUAL-TORQUE'],
    deviceId: null,
    stepUpActive: false,
    accessSessionId: null,
    ...over,
  }
}

function ctx(over: Partial<AccessContext> = {}): AccessContext {
  return {
    state: activeTenantState(),
    identity: identity(),
    online: true,
    deviceTrusted: true,
    actorOfRecord: null,
    ...over,
  }
}

const releaseHold: AccessRequest = {
  action: 'CC_RELEASE_LOT_HOLD',
  allowedRoles: ['QUALITY_MANAGER'],
  sourceRefs: ['MOD-CC-13 action 4'],
}

describe('effective access evaluation', () => {
  it('allows an authorised role in scope on an active tenant', () => {
    expect(evaluateAccess(releaseHold, ctx()).outcome).toBe('allowed')
  })

  it('refuses when nobody is signed in, before any other stage', () => {
    const d = evaluateAccess(releaseHold, ctx({ identity: identity({ signedIn: false }) }))
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('SESSION')
  })

  it('refuses a record belonging to another tenant', () => {
    const d = evaluateAccess(
      { ...releaseHold, },
      ctx({ identity: identity({ tenant: tenantId('TEN-OTHER') }) }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('TENANT_ISOLATION')
  })

  // MOD-CC-13: Supervisor may request a hold release with a note, never perform it.
  it('refuses a Supervisor releasing a lot hold', () => {
    const d = evaluateAccess(releaseHold, ctx({ identity: identity({ role: 'SUPERVISOR' }) }))
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('BASE_ROLE')
    expect(d.reasonCode).toBe('ROLE_NOT_GRANTED')
  })

  it('lets an explicit deny beat an allow', () => {
    const d = evaluateAccess(
      { ...releaseHold, allowedRoles: ['QUALITY_MANAGER'], deniedRoles: ['QUALITY_MANAGER'] },
      ctx(),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.reasonCode).toBe('EXPLICIT_DENY')
  })

  it('refuses when the tenant is suspended', () => {
    const suspended = withTenant(activeTenantState(), BRIGHT, (p) => ({
      ...p,
      lifecycleState: 'HARD_SUSPENDED' as const,
    }))
    const d = evaluateAccess(releaseHold, ctx({ state: suspended }))
    expect(d.outcome).toBe('unavailable')
    expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
  })

  it('lets a global feature disable beat a tenant desired enable', () => {
    let s = activeTenantState()
    s = { ...s, platform: { ...s.platform, featureControls: { AI_COACHING: false } } }
    s = withTenant(s, BRIGHT, (p) => ({ ...p, desiredFeatureValues: { AI_COACHING: true } }))
    const d = evaluateAccess(
      { ...releaseHold, requiredFeature: 'AI_COACHING' },
      ctx({ state: s }),
    )
    expect(d.outcome).toBe('unavailable')
    expect(d.reasonCode).toBe('GLOBAL_FEATURE_DISABLED')
  })

  it('refuses a worker missing a required qualification', () => {
    const d = evaluateAccess(
      { ...releaseHold, allowedRoles: ['WORKER'], requiredQualifications: ['QUAL-WELD'] },
      ctx({ identity: identity({ role: 'WORKER', qualifications: [] }) }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('QUALIFICATION')
  })

  it('refuses an online-only action while offline', () => {
    const d = evaluateAccess({ ...releaseHold, requiresOnline: true }, ctx({ online: false }))
    expect(d.outcome).toBe('unavailable')
    expect(d.stage).toBe('DEVICE_AND_CONNECTIVITY')
  })

  it('refuses the same person approving their own change', () => {
    const d = evaluateAccess(
      { ...releaseHold, makerCheckerOf: 'PERSON-A' },
      ctx({ actorOfRecord: 'PERSON-A' }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('SEGREGATION_OF_DUTIES')
  })

  it('refuses an action whose object is in the wrong state', () => {
    const d = evaluateAccess(
      { ...releaseHold, objectState: 'RELEASED', allowedObjectStates: ['HELD'] },
      ctx(),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('OBJECT_STATE')
  })

  it('evaluates stages in order, reporting the earliest failure', () => {
    // Signed out AND wrong role AND offline. SESSION must win.
    const d = evaluateAccess(
      { ...releaseHold, requiresOnline: true },
      ctx({ identity: identity({ signedIn: false, role: 'WORKER' }), online: false }),
    )
    expect(d.stage).toBe('SESSION')
  })

  // CRITICAL 2 red-proof: a TENANT-domain role with a null tenant must not
  // be MORE privileged than one with a correct tenant.
  it('CRITICAL 2 RED-PROOF: a null tenant on a TENANT-domain role is not a bypass', () => {
    const d = evaluateAccess(releaseHold, ctx({ identity: identity({ tenant: null }) }))
    expect(d.outcome).not.toBe('allowed')
  })
})
