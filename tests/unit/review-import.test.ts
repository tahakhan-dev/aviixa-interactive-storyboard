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

  // I5 (final review): step 6 only checks manifestCHECKSUM against a
  // checksum recomputed from the RECOMPUTED manifest (meta.json +
  // records.json, always exactly those two entries -- see packageFiles).
  // manifestChecksum is unaffected by anything ELSE declared in
  // pkg.manifest, and step 5's loop iterates only the recomputed entries,
  // never the declared ones -- so appending an extra declared entry (e.g. a
  // `memory.json` this exporter can never produce) never touches either
  // check and the import proceeds ok:true. This smuggles a manifest claim
  // for a payload the package doesn't (and, per spec §5, structurally
  // cannot) contain straight past validation.
  it('quarantines a package declaring an extra manifest entry it never produced', async () => {
    const p = await good()
    const withExtra = {
      ...p,
      manifest: [...p.manifest, { path: 'memory.json', bytes: 10, sha256: 'a'.repeat(64) }],
    }
    const r = await importReviewPackage(withExtra, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.quarantined).toBe(true)
      expect(r.failingEntry).toBe('memory.json')
    }
  })

  it('quarantines a package missing a manifest entry for a real payload file', async () => {
    const p = await good()
    const missing = { ...p, manifest: p.manifest.filter((e) => e.path !== 'records.json') }
    const r = await importReviewPackage(missing, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.quarantined).toBe(true)
      expect(r.failingEntry).toBe('records.json')
    }
  })

  it('quarantines a manifest entry with a mismatched declared byte length', async () => {
    const p = await good()
    const wrongBytes = {
      ...p,
      manifest: p.manifest.map((e) => (e.path === 'records.json' ? { ...e, bytes: e.bytes + 1 } : e)),
    }
    const r = await importReviewPackage(wrongBytes, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.quarantined).toBe(true)
      expect(r.failingEntry).toBe('records.json')
    }
  })
})
