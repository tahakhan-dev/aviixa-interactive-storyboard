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

  // IMPORTANT (fix round 1): the old `!command`/`!state` guards caught only
  // the FALSY subset (null, undefined, 0, false, ''). A truthy-but-malformed
  // shape ({}, [], 5, 'x', true) used to sail past them: a malformed COMMAND
  // fell through to `actionClassFor`'s switch (no `default`), which silently
  // returned `undefined`, which `permittedUnder` then failed closed on --
  // reporting `blockedBy: 'capability'` with a reason blaming "the current
  // storage mode", which was FALSE (storage was fully durable). A malformed
  // STATE reached `reduce()`, which caught the resulting internal throw and
  // reported `blockedBy: 'policy'` -- the wrong category for an internal
  // error, not a policy decision. This matrix covers all 10 shapes below in
  // BOTH positions (20 cases): every one must refuse WITHOUT throwing, as
  // `blockedBy: 'input'`, with a reason that does not misname the cause.
  const MALFORMED_SHAPES: readonly unknown[] = [undefined, null, 0, false, '', {}, [], 5, 'x', true]

  describe('refuses every malformed command/state shape as blockedBy: input, not capability or policy', () => {
    MALFORMED_SHAPES.forEach((shape, i) => {
      it(`command shape #${i} (${JSON.stringify(shape) ?? 'undefined'}) refuses without throwing`, async () => {
        let threw = false
        let result: Awaited<ReturnType<typeof dispatch>> | null = null
        try {
          result = await dispatch(state(), shape as never, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
        } catch { threw = true }
        expect(threw).toBe(false)
        expect(result?.ok).toBe(false)
        if (result && !result.ok) {
          expect(result.blockedBy).toBe('input')
          expect(result.reason.length).toBeGreaterThan(20)
          expect(result.reason).not.toMatch(/storage mode/i)
        }
      })

      it(`state shape #${i} (${JSON.stringify(shape) ?? 'undefined'}) refuses without throwing`, async () => {
        let threw = false
        let result: Awaited<ReturnType<typeof dispatch>> | null = null
        try {
          result = await dispatch(shape as never, RELEASE, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
        } catch { threw = true }
        expect(threw).toBe(false)
        expect(result?.ok).toBe(false)
        if (result && !result.ok) {
          expect(result.blockedBy).toBe('input')
          expect(result.reason.length).toBeGreaterThan(20)
        }
      })
    })
  })

  // The residual gap `actionClassFor`'s missing `default` left: an object
  // that DOES have a `type` property (so the widened shape guard above lets
  // it through) but whose value is not a recognised command type at all.
  it('refuses an unrecognised command type as blockedBy: input, not a false storage-mode reason', async () => {
    const bogus = { type: 'BOGUS_COMMAND_TYPE' }
    let threw = false
    let result: Awaited<ReturnType<typeof dispatch>> | null = null
    try {
      result = await dispatch(state(), bogus as never, ctx('QUALITY_MANAGER'), { db, storageState: 'ready-durable' })
    } catch { threw = true }
    expect(threw).toBe(false)
    expect(result?.ok).toBe(false)
    if (result && !result.ok) {
      expect(result.blockedBy).toBe('input')
      expect(result.reason).not.toMatch(/storage mode/i)
    }
  })

  // BLOCKING 1 (final review): `ctx` and `deps` were never guarded the way
  // `state`/`command` were. A malformed `ctx` (missing/broken `clock`) threw
  // a raw TypeError out of `reduce`'s `ctx.clock.now()`; a null/undefined
  // `deps` threw reading `deps.storageState`; a `deps` of `{}` was
  // misclassified as `blockedBy: 'capability'` with a reason blaming "the
  // current storage mode" -- false, storage was never consulted because
  // there was no storage state to consult. This is the same 7-shape probe
  // the finding used: null, undefined, {}, 5, 'x', [], true.
  const CTX_DEPS_SHAPES: readonly unknown[] = [null, undefined, {}, 5, 'x', [], true]

  describe('refuses every malformed ctx/deps shape as blockedBy: input, not a throw', () => {
    CTX_DEPS_SHAPES.forEach((shape, i) => {
      it(`ctx shape #${i} (${JSON.stringify(shape) ?? 'undefined'}) refuses without throwing and writes nothing`, async () => {
        let threw = false
        let result: Awaited<ReturnType<typeof dispatch>> | null = null
        try {
          result = await dispatch(state(), RELEASE, shape as never, { db, storageState: 'ready-durable' })
        } catch { threw = true }
        expect(threw).toBe(false)
        expect(result?.ok).toBe(false)
        if (result && !result.ok) {
          expect(result.blockedBy).toBe('input')
          expect(result.reason.length).toBeGreaterThan(20)
        }
        for (const store of PRODUCT_STORES) {
          const rows = await new Promise<unknown[]>((res) => {
            const r = db.transaction(store, 'readonly').objectStore(store).getAll()
            r.onsuccess = () => res(r.result)
          })
          expect(rows).toEqual([])
        }
      })

      it(`deps shape #${i} (${JSON.stringify(shape) ?? 'undefined'}) refuses without throwing, never blaming storage mode`, async () => {
        let threw = false
        let result: Awaited<ReturnType<typeof dispatch>> | null = null
        try {
          result = await dispatch(state(), RELEASE, ctx('QUALITY_MANAGER'), shape as never)
        } catch { threw = true }
        expect(threw).toBe(false)
        expect(result?.ok).toBe(false)
        if (result && !result.ok) {
          expect(result.blockedBy).toBe('input')
          expect(result.reason.length).toBeGreaterThan(20)
          expect(result.reason).not.toMatch(/storage mode/i)
        }
        for (const store of PRODUCT_STORES) {
          const rows = await new Promise<unknown[]>((res) => {
            const r = db.transaction(store, 'readonly').objectStore(store).getAll()
            r.onsuccess = () => res(r.result)
          })
          expect(rows).toEqual([])
        }
      })
    })
  })
})
