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
    ...overrides,
  } as never
}

describe('atomic commit', () => {
  it('commits the snapshot and its audit record together', async () => {
    const r = await commitTransition(db, proposed())
    expect(r.ok).toBe(true)
    const audit = await new Promise((res) => {
      const tx = db.transaction('audit', 'readonly')
      const req = tx.objectStore('audit').getAll()
      req.onsuccess = () => res(req.result)
    })
    expect((audit as unknown[]).length).toBe(1)
  })

  // MOD-DOH-17 / enforced invariant: an action that cannot be audited does not happen.
  it('writes NOTHING when the audit record cannot be written', async () => {
    const bad = proposed({ audit: [{ id: 'A-1', bad: () => {} }] })
    const r = await commitTransition(db, bad)
    expect(r.ok).toBe(false)
    const snapshots = await new Promise((res) => {
      const tx = db.transaction('snapshots', 'readonly')
      const req = tx.objectStore('snapshots').getAll()
      req.onsuccess = () => res(req.result)
    })
    expect((snapshots as unknown[]).length).toBe(0)
  })

  it('refuses a transition that was not accepted', async () => {
    const r = await commitTransition(db, proposed({ status: 'denied', nextState: null }))
    expect(r.ok).toBe(false)
  })

  it('returns a typed failure rather than throwing', async () => {
    const r = await commitTransition(db, proposed({ audit: [{ id: 'A', bad: () => {} }] }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.failure.reason.length).toBeGreaterThan(10)
  })

  it('publishes only after the transaction completes', async () => {
    const r = await commitTransition(db, proposed())
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.committed.committed).toBe(true)
  })

  // Proof requirement: a mid-transaction abort must leave NOTHING written --
  // not the snapshot, not any of the OTHER (valid) ledger records queued in
  // the same commit, only the one bad record's own store.
  it('leaves every store empty, not just the offending one, after a forced abort', async () => {
    const bad = proposed({
      events: [{ id: 'E-1', sequence: 1, logicalTime: 0, tenant: null, kind: 'evt', payload: {} }],
      commands: [{ id: 'C-1', sequence: 1, logicalTime: 0, tenant: null, kind: 'cmd', payload: {} }],
      audit: [{ id: 'A-1', bad: () => {} }],
    })
    const r = await commitTransition(db, bad)
    expect(r.ok).toBe(false)

    const contents = await Promise.all(
      (['snapshots', 'audit', 'events', 'commands', 'notifications', 'schedules'] as const).map(
        (store) =>
          new Promise((res) => {
            const tx = db.transaction(store, 'readonly')
            const req = tx.objectStore(store).getAll()
            req.onsuccess = () => res([store, req.result] as const)
          }),
      ),
    )
    for (const [store, rows] of contents as [string, unknown[]][]) {
      expect(rows.length, `${store} should be empty after abort`).toBe(0)
    }
  })
})
