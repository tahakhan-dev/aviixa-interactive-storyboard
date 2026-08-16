import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase, PRODUCT_STORES } from '@/persistence/schema'
import { putReviewRecord, listReviewRecords, resetReview } from '@/review/store'
import { createReviewRecord } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

let db: IDBDatabase
beforeEach(async () => { db = await openDatabase(new IDBFactory()) })

const rec = () => createReviewRecord({
  anchorType: 'screen', anchorId: 'SCR-1', surface: 'SURF-DOH',
  reviewerLabel: 'R', status: 'comment', comment: 'Looks right to me.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}, fixedClock(CANONICAL_EPOCH_MS))

const countAll = async (store: string) => new Promise<number>((res) => {
  const r = db.transaction(store, 'readonly').objectStore(store).count()
  r.onsuccess = () => res(r.result)
})

describe('review store', () => {
  it('stores and lists review records', async () => {
    await putReviewRecord(db, rec())
    expect(await listReviewRecords(db)).toHaveLength(1)
  })

  // The separation invariant, at the storage layer.
  it('writes to NO product store', async () => {
    await putReviewRecord(db, rec())
    for (const s of PRODUCT_STORES) {
      expect(await countAll(s), s).toBe(0)
    }
  })

  it('reset clears review records and touches no product store', async () => {
    await putReviewRecord(db, rec())
    await resetReview(db)
    expect(await listReviewRecords(db)).toHaveLength(0)
    for (const s of PRODUCT_STORES) expect(await countAll(s), s).toBe(0)
  })

  it('never throws — a closed database returns rather than rejecting', async () => {
    db.close()
    let threw = false
    try { await putReviewRecord(db, rec()) } catch { threw = true }
    expect(threw).toBe(false)
  })
})
