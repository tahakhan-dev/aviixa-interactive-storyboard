import { describe, it, expect } from 'vitest'
import { scenarioRunId, tenantId, correlationId } from '@/domain/ids'
import { emptyDomainState, withTenant } from '@/domain/state'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'
import { reduce } from '@/kernel/reduce'
import type { ScenarioCommand } from '@/domain/commands'
import type { TransitionContext } from '@/domain/transition'

const RUN = scenarioRunId('RUN-001')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')
const GHOST = tenantId('TEN-GHOST')

function baseState() {
  return withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
    ...p,
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
  }))
}

function context(role: 'QUALITY_MANAGER' | 'SUPERVISOR'): TransitionContext {
  return {
    clock: fixedClock(CANONICAL_EPOCH_MS),
    identity: {
      signedIn: true,
      role,
      tenant: BRIGHT,
      siteScope: ['SITE-RIVERSIDE'],
      areaScope: ['AREA-ASSEMBLY'],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'PERSON-QM',
    correlationId: correlationId('COR-1'),
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
    identity: {
      signedIn: true,
      role: 'QUALITY_MANAGER',
      tenant: GHOST,
      siteScope: ['SITE-RIVERSIDE'],
      areaScope: ['AREA-ASSEMBLY'],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
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
    const t = await reduce(before, releaseHold, context('SUPERVISOR'))
    expect(t.status).toBe('denied')
    expect(t.decision.reasonCode).toBe('ROLE_NOT_GRANTED')
    expect(t.nextState).toBe(null)
  })

  it('never throws on an illegal transition', async () => {
    const t = await reduce(
      baseState(),
      { type: 'CC_RELEASE_LOT_HOLD', tenant: BRIGHT, lotId: '', note: '' },
      context('QUALITY_MANAGER'),
    )
    expect(['denied', 'validationFailed']).toContain(t.status)
  })

  // MOD-DOH-17: the audit record is part of the same transition as the action.
  it('emits an audit record with every accepted command', async () => {
    const t = await reduce(baseState(), releaseHold, context('QUALITY_MANAGER'))
    expect(t.audit).toHaveLength(1)
    expect(t.audit[0]?.kind).toBe('CC_RELEASE_LOT_HOLD')
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
  })

  // CRITICAL 1 red-proof: a Quality Manager signed into BRIGHT must not be
  // able to release a hold on a RIVALCO lot just by naming RIVALCO's tenant
  // id in the command.
  it('CRITICAL 1 RED-PROOF: denies a cross-tenant write instead of executing it', async () => {
    const RIVALCO = tenantId('TEN-RIVALCO')
    const state = withTenant(baseState(), RIVALCO, (p) => ({
      ...p,
      displayName: 'Rival Co',
      lifecycleState: 'ACTIVE' as const,
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
  })

  // CRITICAL 3 red-proof: an unhashable state must degrade to a typed
  // denial, never an unhandled promise rejection.
  it('CRITICAL 3 RED-PROOF: returns a typed denial instead of throwing when state cannot be hashed', async () => {
    const corrupt = withTenant(baseState(), BRIGHT, (p) => ({
      ...p,
      objects: { ...p.objects, 'bad-record': new Date() },
    }))
    const t = await reduce(corrupt, releaseHold, context('QUALITY_MANAGER'))
    expect(t.status).not.toBe('accepted')
  })
})
