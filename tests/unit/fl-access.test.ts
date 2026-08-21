import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PERMISSION_OUTCOMES, isRefusal } from '@/policy/decision'
import {
  FL_CONNECTIVITY_TREATMENTS,
  FRONTLINE_MATRIX_OUTCOMES,
  evaluateFrontlineAccess,
  frontlineConnectivityTreatment,
  type FrontlineAccessContext,
  type FrontlineAccessRequest,
} from '@/frontline/access'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type IdentitySimulationState } from '@/domain/state'

/* ------------------------------------------------------------------ *
 * A live tenant and a signed-in Worker, so the platform evaluator's
 * earlier stages pass and this layer is what is under test.
 * ------------------------------------------------------------------ */

const RUN = scenarioRunId('RUN-FL-001')
const RIVERSIDE = tenantId('TEN-RIVERSIDE')

function activeTenantState() {
  return withTenant(emptyDomainState(RUN), RIVERSIDE, (p) => ({
    ...p,
    displayName: 'Riverside Cycles',
    lifecycleState: 'ACTIVE' as const,
  }))
}

function identity(over: Partial<IdentitySimulationState> = {}): IdentitySimulationState {
  return {
    signedIn: true,
    role: 'WORKER',
    tenant: RIVERSIDE,
    siteScope: ['SITE-RIVERSIDE'],
    areaScope: ['AREA-ASSY-A'],
    qualifications: ['QUAL-TORQUE'],
    deviceId: 'TAB-014',
    stepUpActive: false,
    accessSessionId: null,
    ...over,
  }
}

function ctx(over: Partial<FrontlineAccessContext> = {}): FrontlineAccessContext {
  return {
    state: activeTenantState(),
    identity: identity(),
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'WKR-MAYA',
    intent: 'write',
    servedFromLocalStore: false,
    ...over,
  }
}

const CAPTURE: FrontlineAccessRequest = {
  action: 'Create a capture of any authored type',
  allowedRoles: ['WORKER'],
  sourceRefs: ['L40722'],
}

describe('evaluateFrontlineAccess — the two offline outcomes', () => {
  // FAILS IF: a permitted write taken offline is refused. This is the whole
  // reason the layer exists: the Frontline is offline-first (L39020,
  // L39905), AC-FL-000-4 (L39099) requires identical outcomes with the
  // network disabled, and the durable queue (L39585) exists so the write is
  // accepted rather than denied.
  it('accepts a permitted write offline and reports it as queued', () => {
    const d = evaluateFrontlineAccess(CAPTURE, ctx({ online: false, intent: 'write' }))
    expect(d.outcome).toBe('queuedOffline')
    expect(isRefusal(d)).toBe(false)
    expect(d.sourceRefs).toContain('L39585')
    expect(d.conditionToEnable).toMatch(/next synchronisation/i)
  })

  // FAILS IF: a cached read is presented as current, or refused. L40035 puts
  // the inbox at "Cached read-only while offline" and L48668's STATE-08 says
  // what a screen must add.
  it('serves a permitted read from the local store as a cached read-only copy', () => {
    const d = evaluateFrontlineAccess(
      { ...CAPTURE, action: 'View sync state', sourceRefs: ['L41094'] },
      ctx({ online: false, intent: 'read', servedFromLocalStore: true }),
    )
    expect(d.outcome).toBe('cachedReadOnlyOffline')
    expect(d.sourceRefs).toContain('L40035')
  })

  // FAILS IF: an online-only read with no local copy pretends to have one.
  // The Training Library is the source's own case, L40036.
  it('reports an online-only read with no local copy as unavailable', () => {
    const d = evaluateFrontlineAccess(
      { ...CAPTURE, action: 'View training material when connected', sourceRefs: ['L42113'] },
      ctx({ online: false, intent: 'read', servedFromLocalStore: false }),
    )
    expect(d.outcome).toBe('unavailable')
    expect(d.sourceRefs).toContain('L40036')
  })

  // FAILS IF: going offline widens what anyone may do. A role the matrix
  // refuses is refused whether the device is connected or not, and the
  // outcome must be the SAME refusal, not a queued one.
  it('never turns a refusal into a queued write by going offline', () => {
    const refused: FrontlineAccessRequest = {
      action: 'Cancel a Run',
      allowedRoles: ['SUPERVISOR'],
      sourceRefs: ['L40369'],
    }
    const on = evaluateFrontlineAccess(refused, ctx({ online: true }))
    const off = evaluateFrontlineAccess(refused, ctx({ online: false }))
    expect(on.outcome).toBe('explicitlyProhibited')
    expect(off.outcome).toBe('explicitlyProhibited')
    expect(off.reasonCode).toBe(on.reasonCode)
    expect(isRefusal(off)).toBe(true)
  })

  // FAILS IF: the same act answers differently online and offline for the
  // permission question itself. AC-FL-000-4's requirement is about the
  // OUTCOME of the act, not about the delivery, so the permission half must
  // be identical and only the delivery half may differ.
  it('answers the permission question identically online and offline', () => {
    const on = evaluateFrontlineAccess(CAPTURE, ctx({ online: true }))
    const off = evaluateFrontlineAccess(CAPTURE, ctx({ online: false }))
    expect(isRefusal(on)).toBe(isRefusal(off))
    expect(on.outcome).toBe('allowed')
    expect(off.outcome).toBe('queuedOffline')
  })

  // FAILS IF: a forced sync is reported as a denial. L48668 forces a
  // synchronisation before designated high-risk actions; that names a step
  // the worker can take, so it is a condition and never `unavailable`.
  it('reports a forced synchronisation as a condition, not as a refusal', () => {
    const d = evaluateFrontlineAccess(
      { ...CAPTURE, action: 'Authorise a required supervisor sign-off', forcesSyncFirst: true, sourceRefs: ['L41623'] },
      ctx({ online: true }),
    )
    expect(d.outcome).toBe('allowedWithConditions')
    expect(isRefusal(d)).toBe(false)
    expect(d.sourceRefs).toContain('L48668')
  })
})

describe('the vocabulary this surface uses', () => {
  // FAILS IF: a matrix token union grows or shrinks. The twelve Frontline
  // matrices use seven of the platform's nine tokens; the other two are
  // outcomes the evaluator produces and no cell carries.
  it('separates the seven tokens a cell can carry from the nine an evaluation can produce', () => {
    expect(FRONTLINE_MATRIX_OUTCOMES).toHaveLength(7)
    expect(PERMISSION_OUTCOMES).toHaveLength(9)
    const matrix: readonly string[] = FRONTLINE_MATRIX_OUTCOMES
    expect(matrix).not.toContain('queuedOffline')
    expect(matrix).not.toContain('cachedReadOnlyOffline')
    for (const t of FRONTLINE_MATRIX_OUTCOMES) {
      expect([...PERMISSION_OUTCOMES] as string[], t).toContain(t)
    }
  })

  // FAILS IF: this surface adopts the Studio's connectivity ruling. The
  // Studio's own file says "Nothing on this surface ever queues a write" and
  // types `queued: false` so a queued Studio write will not compile. The
  // shape is reused; the ruling is inverted, and neither surface can drift
  // into the other's by accident.
  it('inverts the Studio ruling rather than borrowing it', () => {
    const studio = readFileSync(join('src', 'studio', 'state', 'connectivity.ts'), 'utf8')
    expect(studio).toContain('Nothing on this surface ever queues a write')
    expect(studio).toContain('readonly queued: false')

    const write = frontlineConnectivityTreatment({ kind: 'write' })
    expect(write.queued).toBe(true)
    expect(write.outcome).toBe('queuedOffline')
    expect(write.rendersState).toBe('STATE-09')
  })

  // FAILS IF: this surface draws a disabled write control offline. The
  // Studio's treatment renders `disabled` and is right to; here the run
  // continues in full (L48667), so a disabled control would be a false claim
  // about a device that is working.
  it('renders no disabled control anywhere in the connectivity model', () => {
    const src = readFileSync(join('src', 'frontline', 'access.ts'), 'utf8')
    expect(src).not.toMatch(/render:\s*'disabled'/)
    for (const t of FL_CONNECTIVITY_TREATMENTS) {
      expect(JSON.stringify(t), t.kind).not.toMatch(/"disabled"/)
    }
  })

  // FAILS IF: the safety layer is gated behind connectivity. This is the
  // single most consequential position in the Frontline scope — L40948, "A
  // Severity 1 hold fires immediately, even offline" — and the treatment
  // types it as a literal `false` so a task cannot gate it while waiting for
  // slice 8.
  it('never degrades the deterministic safety layer offline', () => {
    const safety = frontlineConnectivityTreatment({ kind: 'safety-layer' })
    expect(safety.degradedOffline).toBe(false)
    expect(safety.sourceRef).toContain('L40948')
    expect(safety.reason).toMatch(/from the moment of the breach/)
  })

  // FAILS IF: a treatment loses its row, or a sixth kind is added without
  // one. Five kinds, five rows, and the lookup reads a row rather than
  // re-deciding.
  it('answers every connectivity kind from one row of one table', () => {
    expect(FL_CONNECTIVITY_TREATMENTS).toHaveLength(5)
    const kinds = FL_CONNECTIVITY_TREATMENTS.map((t) => t.kind)
    expect(new Set(kinds).size).toBe(5)
    for (const t of FL_CONNECTIVITY_TREATMENTS) {
      expect(t.reason.length, t.kind).toBeGreaterThan(60)
      expect(t.sourceRef, t.kind).toMatch(/L\d{5}/)
    }
  })
})

describe('the shape of a Frontline request', () => {
  // FAILS IF: `requiresOnline` becomes declarable on this surface. Declaring
  // it is how the deterministic layer gets gated behind a connectivity check,
  // which L40948 exists to forbid. The type refuses it; this is the textual
  // backstop that catches the field being smuggled back through a cast.
  it('has no way to declare that an act requires a connection', () => {
    const src = readFileSync(join('src', 'frontline', 'access.ts'), 'utf8')
    expect(src).toContain("readonly requiresOnline?: never")
    expect(src).not.toMatch(/requiresOnline:\s*true/)
  })
})
