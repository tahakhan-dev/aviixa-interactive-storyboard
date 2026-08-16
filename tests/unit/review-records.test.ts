import { describe, it, expect, vi } from 'vitest'
import { createReviewRecord, createReviewEvent, REVIEW_STATUSES } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase } from '@/persistence/schema'
import { putReviewRecord, listReviewRecords } from '@/review/store'

const clock = () => fixedClock(CANONICAL_EPOCH_MS)
const input = {
  anchorType: 'screen' as const, anchorId: 'SCR-1', surface: 'SURF-DOH' as const,
  reviewerLabel: 'Client reviewer', status: 'needs-change' as const,
  comment: 'The freshness label should name the source surface.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc123',
}

describe('review records', () => {
  it('offers exactly four statuses and none of them is an approval', () => {
    expect(REVIEW_STATUSES).toHaveLength(4)
    const joined = REVIEW_STATUSES.join(' ')
    expect(joined).not.toMatch(/\bapproved\b/i)
    expect(joined).toContain('accepted-for-review')
  })

  it('binds a record to the source fingerprint and build hash it was made against', () => {
    const r = createReviewRecord(input, clock())
    expect(r.sourceFingerprint).toBe('47bd18db')
    expect(r.buildHash).toBe('abc123')
  })

  it('timestamps from the injected clock, never ambient time', () => {
    const r = createReviewRecord(input, clock())
    expect(r.createdAtLogical).toBe(CANONICAL_EPOCH_MS)
  })

  it('requires a non-empty comment for needs-change', () => {
    expect(() => createReviewRecord({ ...input, comment: '   ' }, clock()))
      .toThrow(/comment/i)
  })

  it('creates a review event that carries no product fields', () => {
    const e = createReviewEvent('REV-1', 'created', clock())
    const keys = Object.keys(e)
    for (const forbidden of ['auditExpectation', 'correlationId', 'affectedSurfaces', 'commandState', 'tenant']) {
      expect(keys, forbidden).not.toContain(forbidden)
    }
  })

  it('gives every record a stable unique id', () => {
    const a = createReviewRecord(input, clock())
    const b = createReviewRecord(input, clock())
    expect(a.id).not.toBe(b.id)
  })

  // CRITICAL fix-round-1 regression test: `idSequence` used to be module-scope
  // state that reset to 0 on every module re-evaluation -- i.e. every browser
  // page reload. Two reviewers, in two separate sessions, both commenting
  // before the clock ever advances, used to produce the identical id
  // `rr-<epoch>-1-1`; `put()` then silently replaced the first reviewer's
  // record with the second's. `vi.resetModules()` simulates that reload: it
  // forces a fresh evaluation of `@/review/records` (and everything it
  // imports), the same way a real page load would re-run the module from
  // scratch. `@/review/store`, `@/persistence/schema` and `fake-indexeddb`'s
  // `IDBFactory` are imported statically above -- their bindings were
  // resolved before `resetModules()` runs and are untouched by it, so the
  // *database* persists across the simulated reload exactly like real
  // IndexedDB does, while `records.ts`'s in-module id state does not.
  it('ids stay unique across a simulated page reload, and no record is silently overwritten', async () => {
    const factory = new IDBFactory()
    const db = await openDatabase(factory)

    // Both "sessions" are forced to a fresh module load -- mirroring two
    // separate page loads, each making its FIRST-EVER call into
    // `@/review/records` -- because that first-call-of-a-fresh-module case
    // is exactly where the counter used to restart at 0 both times. Only
    // resetting once (before the second session) would leave the first
    // session's id built from whatever counter value earlier tests in this
    // file had already advanced it to, which would mask the bug instead of
    // reproducing it.
    vi.resetModules()
    const session1 = await import('@/review/records')
    const beforeReload = session1.createReviewRecord(input, clock())
    await putReviewRecord(db, beforeReload)

    vi.resetModules()
    const session2 = await import('@/review/records')
    const afterReload = session2.createReviewRecord(input, clock())
    await putReviewRecord(db, afterReload)

    expect(afterReload.id).not.toBe(beforeReload.id)
    const stored = await listReviewRecords(db)
    expect(stored).toHaveLength(2)
    expect(stored.map((r) => r.id).sort()).toEqual([beforeReload.id, afterReload.id].sort())
  })
})
