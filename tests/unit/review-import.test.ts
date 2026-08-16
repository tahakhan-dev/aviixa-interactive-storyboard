import { describe, it, expect } from 'vitest'
import { exportReviewPackage, importReviewPackage, MAX_PACKAGE_BYTES } from '@/review/package'
import { createReviewRecord } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const rec = () => createReviewRecord({
  anchorType: 'screen', anchorId: 'SCR-1', surface: 'SURF-DOH',
  reviewerLabel: 'R', status: 'comment', comment: 'Fine.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}, fixedClock(CANONICAL_EPOCH_MS))

const good = () => exportReviewPackage({ sourceHash: '47bd18db', buildHash: 'abc', scenarioVersion: '1', records: [rec()] })
const expected = { sourceHash: '47bd18db', buildHash: 'abc' }

describe('review package import', () => {
  it('accepts a valid package and returns a preview rather than applying it', async () => {
    const r = await importReviewPackage(await good(), expected)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.preview.recordCount).toBe(1)
  })

  it('quarantines a tampered payload and names the failing entry', async () => {
    const p = await good()
    const tampered = { ...p, records: [{ ...p.records[0], comment: 'ALTERED' }] }
    const r = await importReviewPackage(tampered, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.quarantined).toBe(true)
      expect(r.expected).not.toBe(r.actual)
    }
  })

  it('quarantines a wrong manifest checksum', async () => {
    const p = await good()
    const r = await importReviewPackage({ ...p, manifestChecksum: 'f'.repeat(64) }, expected)
    expect(r.ok).toBe(false)
  })

  it('quarantines an incompatible source hash rather than merging across sources', async () => {
    const r = await importReviewPackage(await good(), { sourceHash: 'DIFFERENT', buildHash: 'abc' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/source/i)
  })

  it('quarantines an oversized package', async () => {
    const p = await good()
    const huge = { ...p, records: [{ ...p.records[0], comment: 'x'.repeat(MAX_PACKAGE_BYTES + 1) }] }
    const r = await importReviewPackage(huge, expected)
    expect(r.ok).toBe(false)
  })

  it('quarantines a non-object payload without throwing', async () => {
    for (const bad of [null, 42, 'string', []]) {
      const r = await importReviewPackage(bad, expected)
      expect(r.ok, String(bad)).toBe(false)
    }
  })

  it('never applies anything on the failing path — preview only, always', async () => {
    const r = await importReviewPackage({ nonsense: true }, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason.length).toBeGreaterThan(10)
  })
})
