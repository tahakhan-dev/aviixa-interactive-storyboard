import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase } from '@/persistence/schema'
import { DB_VERSION } from '@/persistence/schema'
import {
  bootstrapStorage,
  STORES,
  META_KEY,
  type StorageBootstrapState,
} from '@/persistence/bootstrap'

let factory: IDBFactory
beforeEach(() => {
  factory = new IDBFactory()
})

describe('storage bootstrap', () => {
  it('reaches ready-durable on a clean first open', async () => {
    const r = await bootstrapStorage(factory)
    expect(r.state).toBe<StorageBootstrapState>('ready-durable')
  })

  it('creates every declared object store', async () => {
    await bootstrapStorage(factory)
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const req = factory.open('aviixa-storyboard')
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    for (const s of STORES) expect(Array.from(db.objectStoreNames)).toContain(s)
    db.close()
  })

  it('records every state it passed through, in order', async () => {
    const r = await bootstrapStorage(factory)
    expect(r.trace[0]).toBe('uninitialized')
    expect(r.trace).toContain('opening')
    expect(r.trace).toContain('runtime-validating')
    expect(r.trace.at(-1)).toBe('ready-durable')
  })

  it('exits to persistence-denied when the factory refuses to open', async () => {
    const refusing = {
      open() {
        const req: Record<string, unknown> = { error: new Error('denied') }
        queueMicrotask(() => (req.onerror as () => void)?.())
        return req
      },
    } as unknown as IDBFactory
    const r = await bootstrapStorage(refusing)
    expect(r.state).toBe<StorageBootstrapState>('persistence-denied')
  })

  it('is durable only in ready-durable', async () => {
    const r = await bootstrapStorage(factory)
    expect(r.durable).toBe(true)
  })

  // CORRECTED from the brief: the original test named
  // 'reports ephemeral-preview as not durable' but its body drove the
  // *refusing-factory* path, which exits to 'persistence-denied' -- it never
  // reached ephemeral-preview at all, so it could not have caught a
  // regression in that state's durability. ephemeral-preview is reached when
  // no IndexedDB factory is available at all (e.g. a browser/context where
  // `indexedDB` is undefined), which is a distinct condition from an explicit
  // open() refusal. See task-8-10-report.md for the full note.
  it('reports ephemeral-preview as not durable', async () => {
    const r = await bootstrapStorage(undefined)
    expect(r.state).toBe<StorageBootstrapState>('ephemeral-preview')
    expect(r.durable).toBe(false)
  })

  // --- Reachability proofs for the remaining failure exits (task requires
  // demonstrating every exit is reachable, not merely declared in the union).

  it('exits to upgrade-blocked when another connection blocks the version upgrade', async () => {
    const blocked = {
      open() {
        const req: Record<string, unknown> = {}
        queueMicrotask(() => (req.onblocked as () => void)?.())
        return req
      },
    } as unknown as IDBFactory
    const r = await bootstrapStorage(blocked)
    expect(r.state).toBe<StorageBootstrapState>('upgrade-blocked')
    expect(r.durable).toBe(false)
  })

  it('exits to quota-limited when the factory reports quota exhaustion', async () => {
    const overQuota = {
      open() {
        const req: Record<string, unknown> = {
          error: Object.assign(new Error('quota'), { name: 'QuotaExceededError' }),
        }
        queueMicrotask(() => (req.onerror as () => void)?.())
        return req
      },
    } as unknown as IDBFactory
    const r = await bootstrapStorage(overQuota)
    expect(r.state).toBe<StorageBootstrapState>('quota-limited')
    expect(r.durable).toBe(false)
  })

  it('exits to corrupt-quarantined when the stored schema descriptor is malformed', async () => {
    const db = await openDatabase(factory)
    await new Promise<void>((res, rej) => {
      const tx = db.transaction('meta', 'readwrite')
      tx.objectStore('meta').put({ garbage: true }, META_KEY)
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
    db.close()

    const r = await bootstrapStorage(factory)
    expect(r.state).toBe<StorageBootstrapState>('corrupt-quarantined')
    expect(r.durable).toBe(false)
  })

  // The existing corrupt-quarantined test above hits shape-validation
  // (a garbage object). This drives the OTHER corrupt-quarantined path: a
  // structurally valid descriptor at the CURRENT schema version, but whose
  // checksum doesn't match what this build computes -- proving
  // checksum-verifying itself is reachable, not just runtime-validating.
  it('exits to corrupt-quarantined when the stored schema checksum does not match this build', async () => {
    const db = await openDatabase(factory)
    await new Promise<void>((res, rej) => {
      const tx = db.transaction('meta', 'readwrite')
      tx.objectStore('meta').put({ version: DB_VERSION, checksum: 'tampered-checksum' }, META_KEY)
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
    db.close()

    const r = await bootstrapStorage(factory)
    expect(r.state).toBe<StorageBootstrapState>('corrupt-quarantined')
    expect(r.durable).toBe(false)
  })

  it('exits to migration-failed-read-only when the stored schema version has no known migration path', async () => {
    const db = await openDatabase(factory)
    await new Promise<void>((res, rej) => {
      const tx = db.transaction('meta', 'readwrite')
      tx.objectStore('meta').put({ version: 0, checksum: 'not-a-real-checksum' }, META_KEY)
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
    db.close()

    const r = await bootstrapStorage(factory)
    expect(r.state).toBe<StorageBootstrapState>('migration-failed-read-only')
    expect(r.durable).toBe(false)
  })
})
