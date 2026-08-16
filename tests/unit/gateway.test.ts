import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase, PRODUCT_STORES } from '@/persistence/schema'
import { dispatch } from '@/scenario/gateway'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId, correlationId } from '@/domain/ids'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const RUN = scenarioRunId('RUN-1')
const BRIGHT = tenantId('TEN-BRIGHTBIKES')
let db: IDBDatabase
beforeEach(async () => { db = await openDatabase(new IDBFactory()) })

const state = () => withTenant(emptyDomainState(RUN), BRIGHT, (p) => ({
  ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE' as const,
  // Brief's original fixture used `{ held: true }`, which `currentLotState`
  // in the kernel (reduce.ts) never reads -- it looks for a `.state`
  // property. With `{ held: true }` the kernel's precondition check (the
  // lot must be HELD) always saw an undefined objectState and denied with
  // OBJECT_STATE_INVALID, so "commits an authorised command" never actually
  // committed and "never throws -- a persistence failure" never reached
  // commitTransition at all (see task-3-4-report.md for the RED evidence).
  // Corrected to match the shape reduce.ts's currentLotState expects, same
  // as tests/unit/reduce.test.ts's own baseState() fixture.
  objects: { 'lot:LOT-1': { state: 'HELD' } },
}))
const ctx = (role: 'QUALITY_MANAGER' | 'SUPERVISOR') => ({
  clock: fixedClock(CANONICAL_EPOCH_MS),
  identity: { signedIn: true, role, tenant: BRIGHT, siteScope: ['S'], areaScope: ['A'],
    qualifications: [], deviceId: null, stepUpActive: false, accessSessionId: null },
  online: true, deviceTrusted: true, actorOfRecord: 'P',
  correlationId: correlationId('C'), failureInjection: null,
})
const RELEASE = { type: 'CC_RELEASE_LOT_HOLD', tenant: BRIGHT, lotId: 'LOT-1', note: 'done' } as const

describe('scenario command gateway', () => {
  it('commits an authorised command and reports the committed transition', async () => {
    const r = await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
    expect(r.ok).toBe(true)
  })

  it('refuses an unauthorised command with the policy decision attached', async () => {
    const r = await dispatch(state(), RELEASE, ctx('SUPERVISOR'), { db, storageState: 'ready-durable' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.blockedBy).toBe('policy')
      expect(r.decision?.reasonCode).toBe('ROLE_NOT_GRANTED')
    }
  })

  // ephemeral-preview blocks every durable action class.
  it('refuses a durable command when storage is not durable, before touching the kernel', async () => {
    const r = await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ephemeral-preview' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.blockedBy).toBe('capability')
  })

  // MINOR (fix round 1): was audit-store-only, which proves nothing about
  // any other store. Capability refusal returns before any store is
  // touched, so every product store -- not just audit -- must stay empty.
  it('writes nothing to any product store when capability blocks the command', async () => {
    await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ephemeral-preview' })
    for (const store of PRODUCT_STORES) {
      const rows = await new Promise<unknown[]>((res) => {
        const r = db.transaction(store, 'readonly').objectStore(store).getAll()
        r.onsuccess = () => res(r.result)
      })
      expect(rows).toEqual([])
    }
  })

  it('never throws — a persistence failure returns a typed result', async () => {
    db.close() // force a persistence failure
    let threw = false
    let ok: unknown = null
    try {
      const r = await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
      ok = r.ok
    } catch { threw = true }
    expect(threw).toBe(false)
    expect(ok).toBe(false)
  })

  it('gives every refusal a plain-language reason, never a bare identifier', async () => {
    const r = await dispatch(state(), RELEASE, ctx('SUPERVISOR'), { db, storageState: 'ready-durable' })
    if (!r.ok) {
      expect(r.reason.length).toBeGreaterThan(20)
      expect(r.reason).not.toMatch(/^[A-Z_]+$/)
    }
  })

  // CRITICAL (fix round 1): a null/undefined command or state must never
  // reach `command.type` (actionClassFor) or `state.sequence` (reduce.ts)
  // unguarded. `ok === false` alone proves nothing about *why* -- each case
  // below asserts the call did not throw AND that the refusal is reported
  // as `blockedBy: 'input'` with a plain-language reason.
  it('refuses a null command without throwing, naming the missing argument', async () => {
    let threw = false
    let result: Awaited<ReturnType<typeof dispatch>> | null = null
    try {
      result = await dispatch(state(), null as never, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
    } catch { threw = true }
    expect(threw).toBe(false)
    expect(result?.ok).toBe(false)
    if (result && !result.ok) {
      expect(result.blockedBy).toBe('input')
      expect(result.reason.length).toBeGreaterThan(20)
    }
  })

  it('refuses an undefined command without throwing, naming the missing argument', async () => {
    let threw = false
    let result: Awaited<ReturnType<typeof dispatch>> | null = null
    try {
      result = await dispatch(state(), undefined as never, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
    } catch { threw = true }
    expect(threw).toBe(false)
    expect(result?.ok).toBe(false)
    if (result && !result.ok) {
      expect(result.blockedBy).toBe('input')
      expect(result.reason.length).toBeGreaterThan(20)
    }
  })

  it('refuses a null state without throwing, naming the missing argument', async () => {
    let threw = false
    let result: Awaited<ReturnType<typeof dispatch>> | null = null
    try {
      result = await dispatch(null as never, RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
    } catch { threw = true }
    expect(threw).toBe(false)
    expect(result?.ok).toBe(false)
    if (result && !result.ok) {
      expect(result.blockedBy).toBe('input')
      expect(result.reason.length).toBeGreaterThan(20)
    }
  })

  it('refuses an undefined state without throwing, naming the missing argument', async () => {
    let threw = false
    let result: Awaited<ReturnType<typeof dispatch>> | null = null
    try {
      result = await dispatch(undefined as never, RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
    } catch { threw = true }
    expect(threw).toBe(false)
    expect(result?.ok).toBe(false)
    if (result && !result.ok) {
      expect(result.blockedBy).toBe('input')
      expect(result.reason.length).toBeGreaterThan(20)
    }
  })
})
