import { describe, it, expect } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { createScenarioStore, selectVisibleTenants, selectTenantObjects } from '@/scenario/store'
import { emptyDomainState, withTenant, tenantPartition, type IdentitySimulationState } from '@/domain/state'
import { scenarioRunId, tenantId, correlationId } from '@/domain/ids'
import { openDatabase } from '@/persistence/schema'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const RUN = scenarioRunId('RUN-1')
const A = tenantId('TEN-A'); const B = tenantId('TEN-B')
const two = () => {
  // Brief's original snippet used `let s`, which `s` never reassigns --
  // `pnpm lint`'s prefer-const rule fails on that as written. `const` fixes
  // it without changing behaviour.
  const s = withTenant(emptyDomainState(RUN), A, (p) => ({ ...p, displayName: 'A', lifecycleState: 'ACTIVE' as const, objects: { x: 1 } }))
  return withTenant(s, B, (p) => ({ ...p, displayName: 'B', lifecycleState: 'ACTIVE' as const, objects: { secret: 'B-ONLY' } }))
}
const ident = (tenant: typeof A | null, role: IdentitySimulationState['role']): IdentitySimulationState => ({
  signedIn: true, role, tenant, siteScope: [], areaScope: [], qualifications: [],
  deviceId: null, stepUpActive: false, accessSessionId: null,
})

describe('scenario store', () => {
  it('notifies subscribers when state changes', () => {
    const store = createScenarioStore(two())
    let calls = 0
    store.subscribe(() => { calls += 1 })
    store.setPresentation({ ...store.getPresentation(), locale: 'es' })
    expect(calls).toBeGreaterThan(0)
  })

  it('returns an unsubscribe function that actually unsubscribes', () => {
    const store = createScenarioStore(two())
    let calls = 0
    const off = store.subscribe(() => { calls += 1 })
    off()
    store.setPresentation({ ...store.getPresentation(), locale: 'es' })
    expect(calls).toBe(0)
  })

  // Tenant isolation at the selector layer, not only in the evaluator.
  it('shows a tenant role only its own tenant', () => {
    const s = two()
    expect(selectVisibleTenants(s, ident(A, 'QUALITY_MANAGER'))).toEqual([A])
  })

  it('returns null rather than another tenant’s objects', () => {
    const s = two()
    expect(selectTenantObjects(s, ident(A, 'QUALITY_MANAGER'), B)).toBeNull()
  })

  it('returns the actor’s own tenant objects', () => {
    const s = two()
    expect(selectTenantObjects(s, ident(A, 'QUALITY_MANAGER'), A)).toEqual({ x: 1 })
  })

  // A platform role reaches tenant data only through a named access session.
  it('shows a platform role no tenant without an access session', () => {
    const s = two()
    expect(selectVisibleTenants(s, ident(null, 'ADMIN'))).toEqual([])
  })

  it('clears presentation state on identity change but leaves domain truth intact', () => {
    const store = createScenarioStore(two())
    store.setPresentation({ ...store.getPresentation(), filters: { q: 'x' }, selection: [] })
    const before = store.getState()
    store.setIdentity(ident(B, 'SUPERVISOR'))
    expect(store.getPresentation().filters).toEqual({})
    expect(store.getState()).toBe(before)
  })

  // Not in the brief's test list, but `dispatchCommand` consuming
  // `@/scenario/gateway`'s `dispatch` is the one thing this store exists
  // to do -- "every product action ... flows through this code" (task
  // brief). None of the seven tests above exercise that wiring at all, so
  // this closes that gap: a store whose dispatchCommand silently never
  // called the gateway (or never applied a committed result) would still
  // have passed all seven. See task-3-4-report.md.
  it('dispatchCommand routes through the gateway and applies a committed result to state', async () => {
    const db = await openDatabase(new IDBFactory())
    const store = createScenarioStore(two())
    const ctx = {
      clock: fixedClock(CANONICAL_EPOCH_MS),
      identity: { signedIn: true, role: 'TENANT_ADMIN' as const, tenant: A, siteScope: [], areaScope: [],
        qualifications: [], deviceId: null, stepUpActive: false, accessSessionId: null },
      online: true, deviceTrusted: true, actorOfRecord: 'P',
      correlationId: correlationId('C'), failureInjection: null,
    }
    const command = { type: 'TENANT_SET_DESIRED_FEATURE', tenant: A, feature: 'coolFeature', enabled: true } as const

    const before = store.getState()
    const result = await store.dispatchCommand(command, ctx, { db, storageState: 'ready-durable' })

    expect(result.ok).toBe(true)
    expect(store.getState()).not.toBe(before)
    expect(tenantPartition(store.getState(), A)?.desiredFeatureValues.coolFeature).toBe(true)
  })

  it('dispatchCommand leaves state untouched when the gateway refuses', async () => {
    const db = await openDatabase(new IDBFactory())
    const store = createScenarioStore(two())
    const ctx = {
      clock: fixedClock(CANONICAL_EPOCH_MS),
      // WORKER is not TENANT_ADMIN: TENANT_SET_DESIRED_FEATURE is refused.
      identity: { signedIn: true, role: 'WORKER' as const, tenant: A, siteScope: [], areaScope: [],
        qualifications: [], deviceId: null, stepUpActive: false, accessSessionId: null },
      online: true, deviceTrusted: true, actorOfRecord: 'P',
      correlationId: correlationId('C'), failureInjection: null,
    }
    const command = { type: 'TENANT_SET_DESIRED_FEATURE', tenant: A, feature: 'coolFeature', enabled: true } as const

    const before = store.getState()
    const result = await store.dispatchCommand(command, ctx, { db, storageState: 'ready-durable' })

    expect(result.ok).toBe(false)
    expect(store.getState()).toBe(before)
  })
})
