import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase } from '@/persistence/schema'
import { commitTransition } from '@/persistence/coordinator'

let db: IDBDatabase
beforeEach(async () => {
  db = await openDatabase(new IDBFactory())
})

function proposed(overrides: Record<string, unknown> = {}) {
  return {
    status: 'accepted', nextState: { runId: 'RUN-1', tenants: {}, sequence: 1 },
    audit: [{ id: 'A-1', sequence: 1, logicalTime: 0, tenant: null, kind: 'X', payload: {} }],
    events: [], commands: [], notifications: [], schedules: [],
    correlationId: 'CORR-1',
    ...overrides,
  } as never
}

async function allRows(db: IDBDatabase, store: string): Promise<unknown[]> {
  return new Promise((res) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => res(req.result)
  })
}

describe('atomic commit', () => {
  it('commits the snapshot and its audit record together', async () => {
    const r = await commitTransition(db, proposed())
    expect(r.ok).toBe(true)
    expect((await allRows(db, 'audit')).length).toBe(1)
  })

  // MOD-DOH-17 / enforced invariant: an action that cannot be audited does not happen.
  // A function value fails the plain-data pre-check before any transaction opens.
  it('writes NOTHING when the audit record cannot be written', async () => {
    const bad = proposed({ audit: [{ id: 'A-1', bad: () => {} }] })
    const r = await commitTransition(db, bad)
    expect(r.ok).toBe(false)
    expect((await allRows(db, 'snapshots')).length).toBe(0)
  })

  it('refuses a transition that was not accepted', async () => {
    const r = await commitTransition(db, proposed({ status: 'denied', nextState: null }))
    expect(r.ok).toBe(false)
  })

  it('does not throw when the proposed transition itself is null or undefined', async () => {
    // "The coordinator never throws" is an unconditional platform rule --
    // proposed is typed non-nullable, but a caller passing null/undefined
    // anyway (e.g. from an upstream bug) must still get a typed failure,
    // not a synchronous TypeError that bypasses the returned Promise
    // entirely.
    const r1 = await commitTransition(db, null as never)
    expect(r1.ok).toBe(false)
    const r2 = await commitTransition(db, undefined as never)
    expect(r2.ok).toBe(false)
  })

  it('returns a typed failure rather than throwing', async () => {
    const r = await commitTransition(db, proposed({ audit: [{ id: 'A', bad: () => {} }] }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.failure.reason.length).toBeGreaterThan(10)
  })

  it('refuses non-plain-data (e.g. a Date) in nextState without throwing, and writes nothing', async () => {
    // hash.ts's canonicalSerialize/hashState THROW on Date/Map/Set/RegExp
    // and non-finite numbers -- IndexedDB's structured clone would happily
    // store them anyway, which would write durable state the audit chain
    // can never hash back. This must be refused before the transaction
    // opens, not merely detected later when someone tries to hash it.
    const bad = proposed({
      nextState: { runId: 'RUN-1', tenants: {}, sequence: 1, when: new Date(0) },
    })
    const r = await commitTransition(db, bad)
    expect(r.ok).toBe(false)
    expect((await allRows(db, 'snapshots')).length).toBe(0)
  })

  it('publishes only after the transaction completes', async () => {
    const r = await commitTransition(db, proposed())
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.committed.committed).toBe(true)
  })

  it('refuses to silently overwrite an existing snapshot at an already-committed sequence', async () => {
    const first = await commitTransition(db, proposed())
    expect(first.ok).toBe(true)

    const second = await commitTransition(
      db,
      proposed({ audit: [{ id: 'A-2', sequence: 1, logicalTime: 0, tenant: null, kind: 'X', payload: {} }] }),
    )
    expect(second.ok).toBe(false)

    // The original snapshot from the first commit is untouched -- not
    // overwritten, and the second commit's audit record never landed.
    const snapshots = await allRows(db, 'snapshots')
    expect(snapshots.length).toBe(1)
    const audit = await allRows(db, 'audit')
    expect(audit).toEqual([{ id: 'A-1', sequence: 1, logicalTime: 0, tenant: null, kind: 'X', payload: {} }])
  })

  it('refuses a replayed idempotency key rather than silently overwriting its record', async () => {
    const first = await commitTransition(db, proposed({ idempotencyKey: 'IDEMP-1' }))
    expect(first.ok).toBe(true)

    const replay = await commitTransition(
      db,
      proposed({
        nextState: { runId: 'RUN-1', tenants: {}, sequence: 2 },
        idempotencyKey: 'IDEMP-1',
        audit: [{ id: 'A-2', sequence: 2, logicalTime: 0, tenant: null, kind: 'X', payload: {} }],
      }),
    )
    expect(replay.ok).toBe(false)
    expect((await allRows(db, 'idempotency')).length).toBe(1)
    expect((await allRows(db, 'snapshots')).length).toBe(1)
  })

  // CRITICAL regression test: a prior version of commitTransition called
  // `event.preventDefault()` inside tx.onerror. Per the IndexedDB spec, a
  // request-error event's default action -- aborting the transaction -- runs
  // only `if (!event.canceled)`; preventDefault() sets exactly that flag.
  // That cancelled the abort this whole guarantee depends on, so an
  // ASYNCHRONOUS request error (unlike the synchronous-throw cases above,
  // which never reach IndexedDB's structured-clone step at all thanks to
  // the plain-data pre-check) resolved `ok: true` with the audit record
  // silently missing. A duplicate idempotency key -- a genuine replay --
  // is exactly this kind of async error (ConstraintError on `add()`), and
  // it is placed LAST in the write order below, after snapshot, audit,
  // events, commands, notifications and schedules have all already been
  // queued successfully in this transaction, so this proves the abort
  // rolls back everything already queued, not merely the failing store.
  // Deferred coverage finding (persistence review): the plain-data pre-check
  // (firstNonPlainDataReason -> canonicalSerialize) intercepts every value
  // the earlier tests in this file threw at the in-transaction synchronous
  // put()-throw catch, so that catch block (coordinator.ts's `catch (err) {
  // abortReason = ...; tx.abort() }` around the store.put()/add() calls) was
  // never actually exercised by any test.
  //
  // canonicalSerialize DOES have a gap: for an array it walks `.map(...)`
  // over indices 0..length-1 only, so a non-index own property attached
  // directly to an array is invisible to it and does not fail the
  // pre-check. Node's real `structuredClone` -- what fake-indexeddb's
  // synchronous put()/add() actually calls via cloneValueForInsertion --
  // clones ALL own enumerable array properties, index or not, and throws a
  // DataCloneError synchronously on a function value found there. A
  // function "hidden" on a non-index array property is therefore a value
  // canonicalSerialize accepts but the in-transaction clone still
  // synchronously rejects: the one case the pre-check does not close, and
  // the only way to reach the previously-dead catch.
  it('aborts via the in-transaction synchronous put() throw when a value escapes the pre-check (a function on a non-index array property)', async () => {
    const smuggled: unknown = Object.assign([1, 2, 3], { hiddenFn: () => {} })
    const bad = proposed({
      audit: [
        { id: 'A-1', sequence: 1, logicalTime: 0, tenant: null, kind: 'X', payload: { items: smuggled } },
      ],
    })
    const r = await commitTransition(db, bad)
    expect(r.ok).toBe(false)
    for (const store of ['snapshots', 'audit']) {
      expect((await allRows(db, store)).length, store).toBe(0)
    }
  })

  it('aborts the whole transaction on an ASYNCHRONOUS request error (idempotency replay), not just a synchronous throw', async () => {
    await new Promise<void>((res, rej) => {
      const tx = db.transaction('idempotency', 'readwrite')
      tx.objectStore('idempotency').add({ correlationId: 'PRIOR', sequence: 0 }, 'IDEMP-REPLAY')
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })

    const replay = proposed({
      nextState: { runId: 'RUN-1', tenants: {}, sequence: 2 },
      idempotencyKey: 'IDEMP-REPLAY',
      audit: [{ id: 'A-1', sequence: 2, logicalTime: 0, tenant: null, kind: 'X', payload: {} }],
      events: [{ id: 'E-1', sequence: 2, logicalTime: 0, tenant: null, kind: 'evt', payload: {} }],
      commands: [{ id: 'C-1', sequence: 2, logicalTime: 0, tenant: null, kind: 'cmd', payload: {} }],
      notifications: [{ id: 'N-1', sequence: 2, logicalTime: 0, tenant: null, kind: 'note', payload: {} }],
      schedules: [{ id: 'S-1', sequence: 2, logicalTime: 0, tenant: null, kind: 'sch', payload: {} }],
    })

    const r = await commitTransition(db, replay)
    expect(r.ok).toBe(false)

    for (const store of ['snapshots', 'audit', 'events', 'commands', 'notifications', 'schedules']) {
      const rows = await allRows(db, store)
      expect(rows.length, `${store} should be empty after the aborted replay`).toBe(0)
    }

    // The idempotency store still holds only the ORIGINAL pre-existing
    // record -- the failed replay attempt did not corrupt or duplicate it.
    expect(await allRows(db, 'idempotency')).toEqual([{ correlationId: 'PRIOR', sequence: 0 }])
  })
})
