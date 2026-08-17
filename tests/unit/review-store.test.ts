import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase, PRODUCT_STORES } from '@/persistence/schema'
import { putReviewRecord, putReviewEvent, listReviewRecords, resetReview } from '@/review/store'
import { createReviewRecord, createReviewEvent } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

let db: IDBDatabase
beforeEach(async () => { db = await openDatabase(new IDBFactory()) })

const rec = () => createReviewRecord({
  anchorType: 'screen', anchorId: 'SCR-1', surface: 'SURF-DOH',
  reviewerLabel: 'R', status: 'comment', severity: 'minor', comment: 'Looks right to me.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}, fixedClock(CANONICAL_EPOCH_MS))

const countAll = async (store: string) => new Promise<number>((res) => {
  const r = db.transaction(store, 'readonly').objectStore(store).count()
  r.onsuccess = () => res(r.result)
})

describe('review store', () => {
  it('stores and lists review records', async () => {
    await putReviewRecord(db, rec())
    const result = await listReviewRecords(db)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.records).toHaveLength(1)
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
    const result = await listReviewRecords(db)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.records).toHaveLength(0)
    for (const s of PRODUCT_STORES) expect(await countAll(s), s).toBe(0)
  })

  it('never throws — a closed database returns rather than rejecting', async () => {
    db.close()
    let threw = false
    try { await putReviewRecord(db, rec()) } catch { threw = true }
    expect(threw).toBe(false)
  })

  // I8 (final review): `putReviewRecord`/`resetReview` used to return
  // `Promise<void>` and settle identically whether the transaction's
  // `oncomplete`, `onerror`, or `onabort` fired -- an unstorable record
  // resolved with NOTHING written and NO signal a caller could act on. This
  // is the one IO-boundary function in the codebase (see the module-header
  // convention comment) that used to violate "no silent catch."
  it('reports ok:true when a record is actually written', async () => {
    const result = await putReviewRecord(db, rec())
    expect(result.ok).toBe(true)
  })

  it('reports ok:false with a reason when the write cannot happen — never a silent no-op', async () => {
    db.close()
    const result = await putReviewRecord(db, rec())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0)
  })

  it('reset reports ok:true on success and ok:false on a closed database', async () => {
    const ok = await resetReview(db)
    expect(ok.ok).toBe(true)
    db.close()
    const closed = await resetReview(db)
    expect(closed.ok).toBe(false)
  })

  it('listReviewRecords reports ok:false on a closed database rather than a silent empty list', async () => {
    await putReviewRecord(db, rec())
    db.close()
    const result = await listReviewRecords(db)
    expect(result.ok).toBe(false)
  })

  it('listReviewRecords reports ok:true with the records on success', async () => {
    await putReviewRecord(db, rec())
    const result = await listReviewRecords(db)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.records).toHaveLength(1)
  })

  // Major (final review): createReviewEvent (@/review/records) had no
  // caller outside a unit test -- the reviewEvents store existed, but
  // nothing ever wrote to it. putReviewEvent mirrors putReviewRecord
  // exactly (same transaction discipline, same typed-result convention,
  // same REVIEW_STORES-only scope).
  it('stores a review event', async () => {
    const event = createReviewEvent('rr-1', 'comment', fixedClock(CANONICAL_EPOCH_MS))
    const result = await putReviewEvent(db, event)
    expect(result.ok).toBe(true)
    const rows: unknown[] = await new Promise((res) => {
      const r = db.transaction('reviewEvents', 'readonly').objectStore('reviewEvents').getAll()
      r.onsuccess = () => res(r.result)
    })
    expect(rows).toHaveLength(1)
  })

  it('a stored review event writes to NO product store', async () => {
    const event = createReviewEvent('rr-1', 'comment', fixedClock(CANONICAL_EPOCH_MS))
    await putReviewEvent(db, event)
    for (const s of PRODUCT_STORES) {
      expect(await countAll(s), s).toBe(0)
    }
  })

  it('putReviewEvent reports ok:false with a reason on a closed database, never a silent no-op', async () => {
    db.close()
    const result = await putReviewEvent(db, createReviewEvent('rr-1', 'comment', fixedClock(CANONICAL_EPOCH_MS)))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0)
  })
})
