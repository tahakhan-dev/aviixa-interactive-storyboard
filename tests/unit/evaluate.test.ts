import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type IdentitySimulationState } from '@/domain/state'
import { evaluateAccess, type AccessRequest, type AccessContext } from '@/policy/evaluate'

const RUN = scenarioRunId('RUN-001')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')
const RIVALCO = tenantId('TEN-RIVALCO')

function activeTenantState() {
  let s = withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
  }))
  // A second, equally live tenant, so a cross-tenant test can prove a
  // record's OWNING tenant is checked, not merely that the actor's tenant
  // happens to be unknown.
  s = withTenant(s, RIVALCO, (p) => ({
    ...p,
    displayName: 'Rival Co',
    lifecycleState: 'ACTIVE' as const,
  }))
  return s
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
    const d = evaluateAccess(releaseHold, ctx())
    expect(d.outcome).toBe('allowed')
    // MINOR 11: an allow reports the stage that actually granted it, never
    // a borrowed stage label from a denial branch.
    expect(d.stage).toBe('ALL_STAGES_PASSED')
  })

  it('refuses when nobody is signed in, before any other stage', () => {
    const d = evaluateAccess(releaseHold, ctx({ identity: identity({ signedIn: false }) }))
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('SESSION')
  })

  it('refuses a signed-in session with no role at all', () => {
    const d = evaluateAccess(releaseHold, ctx({ identity: identity({ role: null }) }))
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('SESSION')
    expect(d.reasonCode).toBe('NO_ACTIVE_SESSION')
  })

  // CRITICAL 1: this is the test that let the original bug through — it
  // named an UNKNOWN actor tenant and never involved a record's tenant at
  // all, so it passed even though stage 2 never compared the record's
  // owning tenant against the actor's. Rewritten to actually target
  // another tenant's LIVE record via resourceTenant.
  it('refuses an action naming a different, equally live tenant\'s record', () => {
    const d = evaluateAccess(
      { ...releaseHold, resourceTenant: RIVALCO },
      ctx(), // identity.tenant is BRIGHT; both BRIGHT and RIVALCO are live.
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('TENANT_ISOLATION')
    expect(d.reasonCode).toBe('TENANT_MISMATCH')
    expect(d.auditExpectation).toBe('RECORDED_AS_REFUSAL')
  })

  it('refuses an actor whose own tenant is not live at all', () => {
    const d = evaluateAccess(
      releaseHold,
      ctx({ identity: identity({ tenant: tenantId('TEN-UNKNOWN') }) }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('TENANT_ISOLATION')
  })

  // CRITICAL 2: a TENANT-domain role with a null tenant must never be MORE
  // privileged than one with a correct tenant — it must be refused, not
  // waved through stage 2 and stage 5's suspension check.
  it('refuses a TENANT-domain role holding no tenant at all', () => {
    const d = evaluateAccess(releaseHold, ctx({ identity: identity({ tenant: null }) }))
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('TENANT_ISOLATION')
  })

  // CRITICAL 2: symmetrically, a PLATFORM-domain role must never ambiently
  // hold a tenant — it acts through named access sessions instead.
  it('refuses a PLATFORM-domain role that ambiently holds a tenant', () => {
    const d = evaluateAccess(
      { ...releaseHold, allowedRoles: ['ADMIN'] },
      ctx({ identity: identity({ role: 'ADMIN', tenant: BRIGHT }) }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('TENANT_ISOLATION')
  })

  it('allows a PLATFORM-domain role with no ambient tenant', () => {
    const d = evaluateAccess(
      { ...releaseHold, allowedRoles: ['ADMIN'] },
      ctx({ identity: identity({ role: 'ADMIN', tenant: null }) }),
    )
    expect(d.outcome).toBe('allowed')
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

  describe('stage 4: scope intersection', () => {
    it('refuses a required site the signed-in person is not scoped to', () => {
      const d = evaluateAccess(
        { ...releaseHold, requiredSites: ['SITE-OTHER'] },
        ctx(),
      )
      expect(d.outcome).toBe('blocked')
      expect(d.stage).toBe('SCOPE')
      expect(d.reasonCode).toBe('OUT_OF_SCOPE')
    })

    it('refuses a required area the signed-in person is not scoped to', () => {
      const d = evaluateAccess(
        { ...releaseHold, requiredAreas: ['AREA-OTHER'] },
        ctx(),
      )
      expect(d.outcome).toBe('blocked')
      expect(d.stage).toBe('SCOPE')
      expect(d.reasonCode).toBe('OUT_OF_SCOPE')
    })

    it('allows when the required site is among the scoped sites', () => {
      const d = evaluateAccess(
        { ...releaseHold, requiredSites: ['SITE-OTHER', 'SITE-RIVERSIDE'] },
        ctx(),
      )
      expect(d.outcome).toBe('allowed')
    })
  })

  it('refuses when the tenant is suspended', () => {
    const suspended = withTenant(activeTenantState(), BRIGHT, (p) => ({
      ...p,
      lifecycleState: 'HARD_SUSPENDED' as const,
    }))
    const d = evaluateAccess(releaseHold, ctx({ state: suspended }))
    expect(d.outcome).toBe('unavailable')
    expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
    expect(d.reasonCode).toBe('TENANT_SUSPENDED')
  })

  // IMPORTANT 2: a tenant that is still being set up, or has been archived,
  // is not "suspended" but is equally not operational.
  describe('stage 5: not-yet or no-longer active tenants', () => {
    it.each(['PROVISIONING', 'ARCHIVED'] as const)(
      'refuses a %s tenant',
      (lifecycleState) => {
        const s = withTenant(activeTenantState(), BRIGHT, (p) => ({
          ...p,
          lifecycleState,
        }))
        const d = evaluateAccess(releaseHold, ctx({ state: s }))
        expect(d.outcome).toBe('unavailable')
        expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
        expect(d.reasonCode).toBe('TENANT_NOT_ACTIVE')
      },
    )
  })

  // IMPORTANT 1: the full (global, tenant-desired) feature truth table.
  // Absent global registration is a floor of OFF — no tenant value can
  // switch on a feature the platform never registered — and the platform
  // ceiling still beats every tenant desire once it is explicitly false.
  describe('stage 5: feature truth table', () => {
    const cases: Array<{
      global: boolean | undefined
      desired: boolean | undefined
      outcome: 'allowed' | 'unavailable'
      reasonCode?: string
    }> = [
      { global: false, desired: true, outcome: 'unavailable', reasonCode: 'GLOBAL_FEATURE_DISABLED' },
      { global: false, desired: false, outcome: 'unavailable', reasonCode: 'GLOBAL_FEATURE_DISABLED' },
      { global: false, desired: undefined, outcome: 'unavailable', reasonCode: 'GLOBAL_FEATURE_DISABLED' },
      { global: undefined, desired: true, outcome: 'unavailable', reasonCode: 'FEATURE_NOT_REGISTERED' },
      { global: undefined, desired: false, outcome: 'unavailable', reasonCode: 'FEATURE_NOT_REGISTERED' },
      { global: undefined, desired: undefined, outcome: 'unavailable', reasonCode: 'FEATURE_NOT_REGISTERED' },
      { global: true, desired: true, outcome: 'allowed' },
      { global: true, desired: false, outcome: 'unavailable', reasonCode: 'FEATURE_DISABLED' },
      { global: true, desired: undefined, outcome: 'allowed' },
    ]

    it.each(cases)(
      'global=$global desired=$desired -> $outcome',
      ({ global, desired, outcome, reasonCode }) => {
        let s = activeTenantState()
        s = {
          ...s,
          platform: {
            ...s.platform,
            featureControls: global === undefined ? {} : { AI_COACHING: global },
          },
        }
        s = withTenant(s, BRIGHT, (p) => ({
          ...p,
          desiredFeatureValues: desired === undefined ? {} : { AI_COACHING: desired },
        }))
        const d = evaluateAccess(
          { ...releaseHold, requiredFeature: 'AI_COACHING' },
          ctx({ state: s }),
        )
        expect(d.outcome).toBe(outcome)
        if (reasonCode) expect(d.reasonCode).toBe(reasonCode)
      },
    )
  })

  it('refuses a worker missing a required qualification', () => {
    const d = evaluateAccess(
      { ...releaseHold, allowedRoles: ['WORKER'], requiredQualifications: ['QUAL-WELD'] },
      ctx({ identity: identity({ role: 'WORKER', qualifications: [] }) }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('QUALIFICATION')
  })

  it('refuses an untrusted device when the action requires a trusted one', () => {
    const d = evaluateAccess(
      { ...releaseHold, requiresTrustedDevice: true },
      ctx({ deviceTrusted: false }),
    )
    expect(d.outcome).toBe('unavailable')
    expect(d.stage).toBe('DEVICE_AND_CONNECTIVITY')
    expect(d.reasonCode).toBe('DEVICE_UNTRUSTED')
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

  // IMPORTANT 5: stage 9 must fail CLOSED. An unattributed actor is exactly
  // the case segregation of duties exists to stop, not a free pass.
  it('refuses a maker-checker action with no attributed actor at all', () => {
    const d = evaluateAccess(
      { ...releaseHold, makerCheckerOf: 'PERSON-A' },
      ctx({ actorOfRecord: null }),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('SEGREGATION_OF_DUTIES')
    expect(d.reasonCode).toBe('SEGREGATION_OF_DUTIES')
  })

  it('allows a different, identified approver', () => {
    const d = evaluateAccess(
      { ...releaseHold, makerCheckerOf: 'PERSON-A' },
      ctx({ actorOfRecord: 'PERSON-B' }),
    )
    expect(d.outcome).toBe('allowed')
  })

  it('reports an open client decision as decisionRequired', () => {
    const d = evaluateAccess({ ...releaseHold, openDecision: 'DEC-PLUS-001' }, ctx())
    expect(d.outcome).toBe('decisionRequired')
    expect(d.reasonCode).toBe('DECISION_OPEN')
    expect(d.sourceRefs).toContain('DEC-PLUS-001')
  })

  it('refuses an action whose object is in the wrong state', () => {
    const d = evaluateAccess(
      { ...releaseHold, objectState: 'RELEASED', allowedObjectStates: ['HELD'] },
      ctx(),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('OBJECT_STATE')
  })

  // IMPORTANT 3: stage 6 must fail CLOSED. Declaring a constraint must never
  // be weaker than declaring none — omitting objectState must not silently
  // void a declared allowedObjectStates constraint.
  it('refuses a declared object-state constraint when no object state is given at all', () => {
    const d = evaluateAccess(
      { ...releaseHold, allowedObjectStates: ['HELD'] },
      ctx(),
    )
    expect(d.outcome).toBe('blocked')
    expect(d.stage).toBe('OBJECT_STATE')
    expect(d.reasonCode).toBe('OBJECT_STATE_INVALID')
  })

  describe('stage ordering: the earliest failure always wins', () => {
    it('SESSION beats TENANT_ISOLATION', () => {
      const d = evaluateAccess(
        releaseHold,
        ctx({
          identity: identity({ signedIn: false, tenant: tenantId('TEN-UNKNOWN') }),
        }),
      )
      expect(d.stage).toBe('SESSION')
    })

    it('TENANT_ISOLATION beats BASE_ROLE', () => {
      const d = evaluateAccess(
        releaseHold, // allowedRoles: ['QUALITY_MANAGER'] only
        ctx({
          identity: identity({ tenant: tenantId('TEN-UNKNOWN'), role: 'SUPERVISOR' }),
        }),
      )
      expect(d.stage).toBe('TENANT_ISOLATION')
    })

    it('BASE_ROLE beats SCOPE', () => {
      const d = evaluateAccess(
        { ...releaseHold, requiredSites: ['SITE-OTHER'] },
        ctx({ identity: identity({ role: 'WORKER' }) }), // not in allowedRoles
      )
      expect(d.stage).toBe('BASE_ROLE')
    })

    it('SCOPE beats FEATURE_AND_SUSPENSION', () => {
      const suspended = withTenant(activeTenantState(), BRIGHT, (p) => ({
        ...p,
        lifecycleState: 'HARD_SUSPENDED' as const,
      }))
      const d = evaluateAccess(
        { ...releaseHold, requiredSites: ['SITE-OTHER'] },
        ctx({ state: suspended }),
      )
      expect(d.stage).toBe('SCOPE')
    })

    it('FEATURE_AND_SUSPENSION beats OBJECT_STATE', () => {
      const suspended = withTenant(activeTenantState(), BRIGHT, (p) => ({
        ...p,
        lifecycleState: 'HARD_SUSPENDED' as const,
      }))
      const d = evaluateAccess(
        { ...releaseHold, objectState: 'RELEASED', allowedObjectStates: ['HELD'] },
        ctx({ state: suspended }),
      )
      expect(d.stage).toBe('FEATURE_AND_SUSPENSION')
    })

    it('OBJECT_STATE beats QUALIFICATION', () => {
      const d = evaluateAccess(
        {
          ...releaseHold,
          allowedRoles: ['WORKER'],
          objectState: 'RELEASED',
          allowedObjectStates: ['HELD'],
          requiredQualifications: ['QUAL-WELD'],
        },
        ctx({ identity: identity({ role: 'WORKER', qualifications: [] }) }),
      )
      expect(d.stage).toBe('OBJECT_STATE')
    })

    it('QUALIFICATION beats DEVICE_AND_CONNECTIVITY', () => {
      const d = evaluateAccess(
        {
          ...releaseHold,
          allowedRoles: ['WORKER'],
          requiredQualifications: ['QUAL-WELD'],
          requiresTrustedDevice: true,
        },
        ctx({ identity: identity({ role: 'WORKER', qualifications: [] }), deviceTrusted: false }),
      )
      expect(d.stage).toBe('QUALIFICATION')
    })

    it('DEVICE_AND_CONNECTIVITY beats SEGREGATION_OF_DUTIES', () => {
      const d = evaluateAccess(
        { ...releaseHold, requiresTrustedDevice: true, makerCheckerOf: 'PERSON-A' },
        ctx({ deviceTrusted: false, actorOfRecord: 'PERSON-A' }),
      )
      expect(d.stage).toBe('DEVICE_AND_CONNECTIVITY')
    })

    it('evaluates stages in order, reporting the earliest failure (SESSION over everything)', () => {
      // Signed out AND wrong role AND offline. SESSION must win.
      const d = evaluateAccess(
        { ...releaseHold, requiresOnline: true },
        ctx({ identity: identity({ signedIn: false, role: 'WORKER' }), online: false }),
      )
      expect(d.stage).toBe('SESSION')
    })
  })
})
