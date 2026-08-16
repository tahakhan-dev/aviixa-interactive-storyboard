import { describe, it, expect } from 'vitest'
import { exportReviewPackage, PACKAGE_FORMAT_VERSION } from '@/review/package'
import { createReviewRecord } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const rec = () => createReviewRecord({
  anchorType: 'screen', anchorId: 'SCR-1', surface: 'SURF-DOH',
  reviewerLabel: 'R', status: 'comment', comment: 'Fine.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}, fixedClock(CANONICAL_EPOCH_MS))

const input = () => ({
  sourceHash: '47bd18db', buildHash: 'abc', scenarioVersion: '1', records: [rec()],
})

describe('review package export', () => {
  it('stamps the format version', async () => {
    expect((await exportReviewPackage(input())).formatVersion).toBe(PACKAGE_FORMAT_VERSION)
  })

  it('sorts the manifest by normalised path so the checksum is stable', async () => {
    const p = await exportReviewPackage(input())
    const paths = p.manifest.map((m) => m.path)
    expect([...paths]).toEqual([...paths].sort())
  })

  // The hash scope must not include the field that holds the hash.
  it('excludes its own checksum field from the checksum', async () => {
    // Deviation from the brief: `input()` calls `rec()` fresh, and
    // `createReviewRecord` mints a `crypto.randomUUID()` id per call, so two
    // independent `input()` calls carry genuinely different record ids —
    // exporting them and expecting an EQUAL checksum was asserting hash
    // stability across two different payloads. Reusing one `input()` result
    // for both exports tests the actual claim: identical content hashes
    // identically. See tests/unit/review-package.test.ts.
    const same = input()
    const p = await exportReviewPackage(same)
    const recomputed = await exportReviewPackage(same)
    expect(p.manifestChecksum).toBe(recomputed.manifestChecksum)
    expect(JSON.stringify(p.manifest)).not.toContain(p.manifestChecksum)
  })

  it('changes the checksum when a payload changes', async () => {
    const a = await exportReviewPackage(input())
    const b = await exportReviewPackage({ ...input(), records: [rec(), rec()] })
    expect(a.manifestChecksum).not.toBe(b.manifestChecksum)
  })

  it('records byte length and sha256 for every entry', async () => {
    const p = await exportReviewPackage(input())
    for (const e of p.manifest) {
      expect(e.bytes).toBeGreaterThan(0)
      expect(e.sha256).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  // Memory has no export path at V1.
  it('refuses an input carrying memory data', async () => {
    await expect(exportReviewPackage({ ...input(), memory: [{ any: 'thing' }] } as never))
      .rejects.toThrow(/memory/i)
  })
})
