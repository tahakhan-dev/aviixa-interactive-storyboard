import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId, correlationId, causationId, idempotencyKey } from '@/domain/ids'
import { emptyDomainState, withTenant } from '@/domain/state'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'
import { reduce } from '@/kernel/reduce'
import type { ScenarioCommand } from '@/domain/commands'
import type { TransitionContext } from '@/domain/transition'
import type { IdentitySimulationState } from '@/domain/state'
import type { RoleId } from '@/domain/roles'

const RUN = scenarioRunId('RUN-001')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')
const GHOST = tenantId('TEN-GHOST')
const RIVALCO = tenantId('TEN-RIVALCO')

// IMPORTANT 4: CC_RELEASE_LOT_HOLD now enforces MOD-CC-13 action 4's
// precondition (the lot must currently be HELD), so the standard fixture
// seeds one held lot matching `releaseHold`'s lotId.
function baseState() {
  return withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
    objects: { 'lot:LOT-2201': { state: 'HELD' } },
  }))
}

function identityFor(role: RoleId, tenant: typeof BRIGHT | null): IdentitySimulationState {
  return {
    signedIn: true,
    role,
    tenant,
    siteScope: ['SITE-RIVERSIDE'],
    areaScope: ['AREA-ASSEMBLY'],
    qualifications: [],
    deviceId: null,
    stepUpActive: false,
    accessSessionId: null,
  }
}

function context(role: 'QUALITY_MANAGER' | 'SUPERVISOR' | 'TENANT_ADMIN'): TransitionContext {
  return {
    clock: fixedClock(CANONICAL_EPOCH_MS),
    identity: identityFor(role, BRIGHT),
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'PERSON-QM',
    correlationId: correlationId('COR-1'),
    failureInjection: null,
  }
}

/** A platform-domain context: no ambient tenant (CRITICAL 2). */
function platformContext(role: 'ROOT_SUPER_ADMIN' | 'ADMIN'): TransitionContext {
  return {
    clock: fixedClock(CANONICAL_EPOCH_MS),
    identity: identityFor(role, null),
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'PERSON-PLATFORM',
    correlationId: correlationId('COR-PLATFORM'),
    failureInjection: null,
  }
}

/**
 * Ruling 2 fixture: an identity whose tenant is not present in the state's
 * tenant map at all. This exercises TENANT_ISOLATION (stage 2), which fires
 * before BASE_ROLE, so the role carried here is irrelevant to the outcome.
 */
function contextForUnknownTenant(): TransitionContext {
  return {
    clock: fixedClock(CANONICAL_EPOCH_MS),
    identity: identityFor('QUALITY_MANAGER', GHOST),
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'PERSON-QM',
    correlationId: correlationId('COR-1'),
    failureInjection: null,
  }
}

const releaseHold: ScenarioCommand = {
  type: 'CC_RELEASE_LOT_HOLD',
  tenant: BRIGHT,
  lotId: 'LOT-2201',
  note: 'Containment complete, deviation dispositioned.',
}

describe('transition kernel', () => {
  it('accepts an authorised command and returns a next state', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.status).toBe('accepted')
    expect(t.nextState).not.toBe(null)
  })

  // MOD-CC-13 action 4: Quality Manager only.
  it('denies a Supervisor releasing a lot hold and leaves state untouched', async () => {
    const before = baseState()
    const snapshot = JSON.stringify(before)
    const t = await reduce(before, releaseHold, context('SUPERVISOR'))
    expect(t.status).toBe('denied')
    expect(t.decision.reasonCode).toBe('ROLE_NOT_GRANTED')
    expect(t.nextState).toBe(null)
    // The test's own name promises this second clause too: leaves state
    // untouched, not just "returns no next state."
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  // DEC-PLUS-001 / IMPORTANT 6: Tenant Admin is EXPLICITLY PROHIBITED on all
  // ten Command Center operational actions — a denial, not an absence —
  // so it must audit as EXPLICIT_DENY / RECORDED_AS_REFUSAL, leaving a
  // trace, rather than a silent, untraceable ROLE_NOT_GRANTED.
  it('denies a Tenant Admin releasing a lot hold as an explicit, audited denial', async () => {
    const t = await reduce(baseState(), releaseHold, context('TENANT_ADMIN'))
    expect(t.status).toBe('denied')
    expect(t.decision.reasonCode).toBe('EXPLICIT_DENY')
    expect(t.decision.auditExpectation).toBe('RECORDED_AS_REFUSAL')
    expect(t.audit).toHaveLength(1)
  })

  it('never throws on an illegal transition', async () => {
    const t = await reduce(
      baseState(),
      { type: 'CC_RELEASE_LOT_HOLD', tenant: BRIGHT, lotId: '', note: '' },
      context('QUALITY_MANAGER'),
    )
    expect(['denied', 'validationFailed']).toContain(t.status)
  })

  // IMPORTANT 4: MOD-CC-13 action 4's precondition is enforced by the
  // kernel, not merely declared. A lot that was never held, or a lot that
  // does not exist, cannot be "released."
  it('denies releasing a hold on a lot that was never held', async () => {
    const t = await reduce(
      baseState(),
      { type: 'CC_RELEASE_LOT_HOLD', tenant: BRIGHT, lotId: 'LOT-NEVER-HELD', note: 'x' },
      context('QUALITY_MANAGER'),
    )
    expect(t.status).toBe('denied')
    expect(t.decision.reasonCode).toBe('OBJECT_STATE_INVALID')
    expect(t.nextState).toBe(null)
  })

  it('denies releasing a hold on a lot that is already released', async () => {
    const alreadyReleased = withTenant(baseState(), BRIGHT, (p) => ({
      ...p,
      objects: { ...p.objects, 'lot:LOT-2201': { state: 'RELEASED' } },
    }))
    const t = await reduce(alreadyReleased, releaseHold, context('QUALITY_MANAGER'))
    expect(t.status).toBe('denied')
    expect(t.decision.reasonCode).toBe('OBJECT_STATE_INVALID')
  })

  // MOD-DOH-17: the audit record is part of the same transition as the action.
  it('emits an audit record with every accepted command', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.audit).toHaveLength(1)
    expect(t.audit[0]?.kind).toBe('CC_RELEASE_LOT_HOLD_RECORDED')
  })

  // M5: a consumer merging the event and audit ledgers must be able to tell
  // them apart by kind alone -- they must not both be the bare command type.
  it('gives the event and audit record of an accepted transition distinguishable kinds', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.events[0]?.kind).toBe('CC_RELEASE_LOT_HOLD')
    expect(t.audit[0]?.kind).not.toBe(t.events[0]?.kind)
  })

  // RULING 2 replaces the brief's trivially-true assertion
  // (`t.audit.length + Number(...) > 0`, which passes on either branch) with
  // a genuine two-part test of the auditExpectation contract.
  it('emits exactly one _REFUSED audit record for a RECORDED_AS_REFUSAL denial', async () => {
    // TENANT_ISOLATION denial (identity.tenant absent from state.tenants):
    // evaluateAccess sets auditExpectation: 'RECORDED_AS_REFUSAL' unconditionally
    // for this stage, regardless of role or command.
    const t = await reduce(baseState(), releaseHold, contextForUnknownTenant())
    expect(t.status).toBe('denied')
    expect(t.decision.auditExpectation).toBe('RECORDED_AS_REFUSAL')
    expect(t.audit).toHaveLength(1)
    expect(t.audit[0]?.kind).toMatch(/_REFUSED$/)
  })

  it('emits zero audit records for a NOT_AUDITED denial', async () => {
    // A Supervisor denied CC_RELEASE_LOT_HOLD fails BASE_ROLE with
    // ROLE_NOT_GRANTED, whose auditExpectation defaults to 'NOT_AUDITED'
    // (deny() only sets RECORDED_AS_REFUSAL where the caller passes it).
    const t = await reduce(baseState(), releaseHold, context('SUPERVISOR'))
    expect(t.status).toBe('denied')
    expect(t.decision.auditExpectation).toBe('NOT_AUDITED')
    expect(t.audit).toHaveLength(0)
  })

  it('carries prior and next state hashes on an accepted transition', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.priorStateHash).toMatch(/^[0-9a-f]{64}$/)
    expect(t.nextStateHash).toMatch(/^[0-9a-f]{64}$/)
    expect(t.priorStateHash).not.toBe(t.nextStateHash)
  })

  it('names every affected surface', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.affectedSurfaces).toContain('SURF-DOH')
    expect(t.affectedSurfaces).toContain('SURF-CC')
    expect(t.affectedSurfaces).toContain('SURF-FL')
  })

  it('replays deterministically to the same hash', async () => {
    const a = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    const b = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(a.nextStateHash).toBe(b.nextStateHash)
  })

  it('never mutates the state it was given', async () => {
    const before = baseState()
    const snapshot = JSON.stringify(before)
    await reduce(before, releaseHold, context('QUALITY_MANAGER'))
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it('gives every result a plain-language explanation', async () => {
    const t = await reduce(baseState(), releaseHold, context('SUPERVISOR'))
    expect(t.decision.explanation.length).toBeGreaterThan(20)
    // A bare all-caps identifier (e.g. "ROLE_NOT_GRANTED_SOMETHING_LONG")
    // would pass a length-only check. It must not pass this one.
    expect(t.decision.explanation).not.toMatch(/^[A-Z_]+$/)
  })

  // CRITICAL 1 red-proof: a Quality Manager signed into BRIGHT must not be
  // able to release a hold on a RIVALCO lot just by naming RIVALCO's tenant
  // id in the command.
  it('CRITICAL 1: denies a cross-tenant write instead of executing it', async () => {
    const state = withTenant(baseState(), RIVALCO, (p) => ({
      ...p,
      displayName: 'Rival Co',
      lifecycleState: 'ACTIVE' as const,
      objects: { 'lot:LOT-RIVAL-1': { state: 'HELD' } },
    }))
    const crossTenantCommand: ScenarioCommand = {
      type: 'CC_RELEASE_LOT_HOLD',
      tenant: RIVALCO,
      lotId: 'LOT-RIVAL-1',
      note: 'Attacker-supplied note.',
    }
    const t = await reduce(state, crossTenantCommand, context('QUALITY_MANAGER'))
    expect(t.status).not.toBe('accepted')
    expect(t.nextState).toBe(null)
    expect(t.decision.reasonCode).toBe('TENANT_MISMATCH')
    // The victim tenant's audit trail must show the refusal, not nothing.
    expect(t.decision.auditExpectation).toBe('RECORDED_AS_REFUSAL')
    expect(t.audit).toHaveLength(1)
    // IMPORTANT 1: the record must be filed under the VICTIM (RIVALCO)'s
    // tenant, not the attacker's (BRIGHT) -- otherwise RIVALCO's own audit
    // trail stays empty while BRIGHT's wrongly shows an entry that isn't
    // about BRIGHT at all.
    expect(t.audit[0]?.tenant).toBe(RIVALCO)
  })

  // CRITICAL 3 red-proof: an unhashable state must degrade to a typed
  // denial, never an unhandled promise rejection.
  it('CRITICAL 3: returns a typed denial instead of throwing when state cannot be hashed', async () => {
    const corrupt = withTenant(baseState(), BRIGHT, (p) => ({
      ...p,
      objects: { ...p.objects, 'bad-record': new Date() },
    }))
    const t = await reduce(corrupt, releaseHold, context('QUALITY_MANAGER'))
    expect(t.status).not.toBe('accepted')
    expect(t.decision.explanation).toMatch(/Date/)
    expect(t.nextState).toBe(null)
  })

  // IMPORTANT 7: within one accepted transition, the event and audit
  // records must not collide on id even though they currently share a kind
  // and sequence number.
  it('gives the event and audit records of one accepted transition distinct ids', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.events[0]?.id).toBeTruthy()
    expect(t.audit[0]?.id).toBeTruthy()
    expect(t.events[0]?.id).not.toBe(t.audit[0]?.id)
  })

  // IMPORTANT 7: two denials against the same unchanged state (so `seq` is
  // identical both times) sharing one Clock must still get distinct ids —
  // this is the literal "two consecutive refusals" case from the review.
  it('gives two consecutive refusals sharing one clock distinct audit-record ids', async () => {
    const sharedCtx = contextForUnknownTenant()
    const t1 = await reduce(baseState(), releaseHold, sharedCtx)
    const t2 = await reduce(baseState(), releaseHold, sharedCtx)
    expect(t1.audit[0]?.id).toBeTruthy()
    expect(t2.audit[0]?.id).toBeTruthy()
    expect(t1.audit[0]?.id).not.toBe(t2.audit[0]?.id)
  })

  // MINOR 9: refuse()'s reported sequence must agree with the sequence its
  // own audit record was built with, instead of a hardcoded 0.
  it('agrees on sequence number between a denial and its own audit record', async () => {
    const t = await reduce(baseState(), releaseHold, contextForUnknownTenant())
    expect(t.sequence).toBe(t.audit[0]?.sequence)
  })

  // Uncovered command families: PLATFORM_SET_FEATURE_CONTROL is
  // platform-scoped (no tenant at all — CRITICAL 2's PLATFORM-domain path).
  it('accepts a platform-domain PLATFORM_SET_FEATURE_CONTROL command', async () => {
    const t = await reduce(
      baseState(),
      { type: 'PLATFORM_SET_FEATURE_CONTROL', feature: 'AI_COACHING', enabled: true },
      platformContext('ADMIN'),
    )
    expect(t.status).toBe('accepted')
    expect(t.nextState?.platform.featureControls['AI_COACHING']).toBe(true)
  })

  it('denies a Quality Manager attempting a platform-scoped command', async () => {
    const t = await reduce(
      baseState(),
      { type: 'PLATFORM_SET_FEATURE_CONTROL', feature: 'AI_COACHING', enabled: true },
      context('QUALITY_MANAGER'),
    )
    expect(t.status).toBe('denied')
  })

  // Uncovered command family: TENANT_SET_DESIRED_FEATURE, a tenant-scoped
  // command whose resourceTenant must also be enforced (CRITICAL 1).
  it('accepts a Tenant Admin setting a desired feature value for their own tenant', async () => {
    const t = await reduce(
      baseState(),
      { type: 'TENANT_SET_DESIRED_FEATURE', tenant: BRIGHT, feature: 'AI_COACHING', enabled: true },
      context('TENANT_ADMIN'),
    )
    expect(t.status).toBe('accepted')
    expect(t.nextState?.tenants[BRIGHT]?.desiredFeatureValues['AI_COACHING']).toBe(true)
  })

  it('denies a Tenant Admin setting a desired feature value for another tenant', async () => {
    const state = withTenant(baseState(), RIVALCO, (p) => ({
      ...p,
      displayName: 'Rival Co',
      lifecycleState: 'ACTIVE' as const,
    }))
    const t = await reduce(
      state,
      { type: 'TENANT_SET_DESIRED_FEATURE', tenant: RIVALCO, feature: 'AI_COACHING', enabled: true },
      context('TENANT_ADMIN'), // signed into BRIGHT, targets RIVALCO
    )
    expect(t.status).not.toBe('accepted')
    expect(t.decision.reasonCode).toBe('TENANT_MISMATCH')
  })

  // CRITICAL 1(a)/(b): poisoned tenant ids on the COMMAND side (not just the
  // identity side) must not silently succeed or crash either.
  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'])(
    'CRITICAL 1: refuses a command targeting the never-registered tenant id %s without throwing',
    async (raw) => {
      const poisoned = tenantId(raw)
      const t = await reduce(
        baseState(),
        { type: 'CC_RELEASE_LOT_HOLD', tenant: poisoned, lotId: 'LOT-2201', note: 'x' },
        { ...context('QUALITY_MANAGER'), identity: identityFor('QUALITY_MANAGER', poisoned) },
      )
      expect(t.status).not.toBe('accepted')
      expect(t.nextState).toBe(null)
    },
  )

  // CRITICAL 1(c): reduce() must degrade ANY internal failure -- not just an
  // unhashable state -- to a typed denial, the same way tryHash already
  // guards hashState. A structurally malformed command (an unregistered
  // command.type) currently throws out of accessRequestFor's
  // `SPECS[command.type].access` before evaluateAccess is ever reached.
  it('CRITICAL 1(c): never throws for a structurally malformed command type', async () => {
    const malformed = { type: 'NOT_A_REAL_COMMAND' } as unknown as ScenarioCommand
    let threw = false
    let result: Awaited<ReturnType<typeof reduce>> | undefined
    try {
      result = await reduce(baseState(), malformed, context('QUALITY_MANAGER'))
    } catch {
      threw = true
    }
    expect(threw).toBe(false)
    expect(result?.status).not.toBe('accepted')
  })

  // IMPORTANT 4: ProposedTransition must carry the full spec section 3.5
  // contract, and TransitionContext.failureInjection must not be dropped.
  describe('IMPORTANT 4: ProposedTransition carries the full transition-result contract', () => {
    it('populates actor, tenant, scope, device, failure injection, causation and idempotency on an accepted transition', async () => {
      const baseCtx = context('QUALITY_MANAGER')
      const withExtras: TransitionContext = {
        ...baseCtx,
        identity: { ...baseCtx.identity, deviceId: 'DEVICE-TABLET-7' },
        failureInjection: 'SIM-NETWORK-DROP',
        causationId: causationId('CAU-1'),
        idempotencyKey: idempotencyKey('IDEM-1'),
      }
      const t = await reduce(baseState(), releaseHold, withExtras)
      expect(t.actor).toBe('PERSON-QM')
      expect(t.tenant).toBe(BRIGHT)
      expect(t.scope).toEqual({ siteScope: ['SITE-RIVERSIDE'], areaScope: ['AREA-ASSEMBLY'] })
      expect(t.device).toBe('DEVICE-TABLET-7')
      expect(t.activeFailureInjection).toBe('SIM-NETWORK-DROP')
      expect(t.causationId).toBe('CAU-1')
      expect(t.idempotencyKey).toBe('IDEM-1')
    })

    it('names the object version transition for an accepted CC_RELEASE_LOT_HOLD', async () => {
      const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
      expect(t.objectTransitions).toHaveLength(1)
      expect(t.objectTransitions[0]).toMatchObject({
        objectId: 'lot:LOT-2201',
        fromState: 'HELD',
        toState: 'RELEASED',
      })
    })

    it('carries actor and tenant on a denial too, not just an acceptance', async () => {
      const t = await reduce(baseState(), releaseHold, context('SUPERVISOR'))
      expect(t.status).toBe('denied')
      expect(t.actor).toBe('PERSON-QM')
      expect(t.tenant).toBe(BRIGHT)
    })

    it('reports the slice-2+ fields as an explicit empty/null default rather than being silently absent', async () => {
      const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
      expect(t.deviceTime).toBeNull()
      expect(t.projectionRefreshStates).toEqual([])
      expect(t.fallbackFailure).toBeNull()
      expect(t.recoveryRequirements).toEqual([])
      expect(t.reconciliationRequirements).toEqual([])
    })
  })
})
