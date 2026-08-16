import { describe, it, expect } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase, STORES, PRODUCT_STORES, REVIEW_STORES, DB_VERSION } from '@/persistence/schema'

describe('review stores and migration', () => {
  it('is at version 2', () => {
    expect(DB_VERSION).toBe(2)
  })

  it('separates product stores from review stores with no overlap', () => {
    const overlap = PRODUCT_STORES.filter((s) => (REVIEW_STORES as readonly string[]).includes(s))
    expect(overlap).toEqual([])
    expect([...PRODUCT_STORES, ...REVIEW_STORES].sort()).toEqual([...STORES].sort())
  })

  it('creates both review stores on a fresh database', async () => {
    const db = await openDatabase(new IDBFactory())
    for (const s of REVIEW_STORES) expect(Array.from(db.objectStoreNames)).toContain(s)
    db.close()
  })

  it('upgrades a version-1 database without losing its product data', async () => {
    const factory = new IDBFactory()
    // Build a v1 database by hand, with one audit row in it.
    await new Promise<void>((res, rej) => {
      const req = factory.open('aviixa-storyboard', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        for (const s of ['snapshots', 'audit', 'events', 'commands', 'notifications', 'schedules', 'idempotency', 'meta']) {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { autoIncrement: true })
        }
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('audit', 'readwrite')
        tx.objectStore('audit').put({ id: 'A-PRE', kind: 'PRE_MIGRATION' })
        tx.oncomplete = () => { db.close(); res() }
        tx.onerror = () => rej(tx.error)
      }
      req.onerror = () => rej(req.error)
    })

    const db = await openDatabase(factory)
    expect(db.version).toBe(2)
    for (const s of REVIEW_STORES) expect(Array.from(db.objectStoreNames)).toContain(s)
    const rows = await new Promise<unknown[]>((res) => {
      const r = db.transaction('audit', 'readonly').objectStore('audit').getAll()
      r.onsuccess = () => res(r.result)
    })
    expect(rows).toHaveLength(1)
    db.close()
  })
})
