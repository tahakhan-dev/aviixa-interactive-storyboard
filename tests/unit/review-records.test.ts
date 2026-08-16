import { describe, it, expect } from 'vitest'
import { createReviewRecord, createReviewEvent, REVIEW_STATUSES } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

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
})
