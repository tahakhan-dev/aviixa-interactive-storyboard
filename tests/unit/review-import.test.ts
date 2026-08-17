import { describe, it, expect } from 'vitest'
import {
  exportReviewPackage, importReviewPackage, MAX_PACKAGE_BYTES, planImport, applyImport,
} from '@/review/package'
import { createReviewRecord } from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'

const rec = () => createReviewRecord({
  anchorType: 'screen', anchorId: 'SCR-1', surface: 'SURF-DOH',
  reviewerLabel: 'R', status: 'comment', severity: 'minor', comment: 'Fine.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}, fixedClock(CANONICAL_EPOCH_MS))

const good = () => exportReviewPackage({
  sourceHash: '47bd18db', promptHash: 'p-1', buildHash: 'abc', scenarioVersion: '1',
  scenarioSeed: 'seed-1', fixtureRefs: [], records: [rec()],
  decisions: [], bookmarks: [],
  coverageSnapshot: { takenAtLogical: CANONICAL_EPOCH_MS, byStatus: {} },
  screenshotRefs: [],
})
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

  // Fix round 1 (review, Minor 1): the V1 package shape changed breakingly
  // in e690e30 (seven new required elements on a `.strict()` schema)
  // without bumping PACKAGE_FORMAT_VERSION -- so a package from the
  // PRE-e690e30 build, correctly labelled formatVersion: 1, used to reach
  // the SHAPE check (step 2) before the version check (step 3) and
  // quarantine as "does not match the expected shape", misdiagnosing an
  // old-format package as a malformed one. The version check now runs
  // first.
  it('reports a version mismatch, not a shape mismatch, for an old-format package', async () => {
    const p = await good()
    const oldFormatPackage = {
      formatVersion: 1,
      sourceHash: p.sourceHash,
      buildHash: p.buildHash,
      scenarioVersion: p.scenarioVersion,
      records: p.records,
      manifest: p.manifest,
      manifestChecksum: p.manifestChecksum,
    }
    const r = await importReviewPackage(oldFormatPackage, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/format version/i)
  })

  // Controller, after fix round 1: moving the version check ahead of the
  // shape check made a SECOND input misdiagnose. A blob carrying no
  // `formatVersion` at all is not an old package -- it is not a package.
  // The probe fails, `declaredVersion` falls to `null`, `null !== 2`, and it
  // quarantines as "Unsupported package format version" with `actual: null`.
  // The signal is in the metadata but the message names the wrong cause.
  // This project already went back and fixed exactly this class once, when
  // `canonicalSerialize` reported "Sparse array in state" for a non-index
  // array property -- both live classes were correctly REJECTED, but the
  // message misnamed why.
  it('reports a non-package as unrecognised, not as a version mismatch', async () => {
    const notAPackage = { nothing: 'here' }
    const r = await importReviewPackage(notAPackage, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).not.toMatch(/format version/i)
      expect(r.reason).toMatch(/not a review package/i)
    }
  })

  it('still reports a version mismatch when a version IS declared but wrong', async () => {
    const r = await importReviewPackage({ formatVersion: 99 }, expected)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/format version/i)
  })

  // Fix round 1 (review, Minor 6 -- CORRECTED, see fix report): the review
  // claimed `CoverageSnapshotSchema`'s bare `z.number()` accepts `Infinity`
  // and that this reaches `canonicalSerialize` (which throws on a
  // non-finite number), producing an uncaught throw out of a function whose
  // contract promises it never throws. Verified directly against this
  // project's installed zod (4.4.3): `z.number().safeParse(Infinity)`
  // already FAILS -- zod's base number check rejects non-finite values on
  // its own, so that specific throw is not reachable here; the shape check
  // (step 2) already quarantines it before `canonicalSerialize` is ever
  // called. What bare `z.number()` DOES still accept, unlike its neighbour
  // `PackageManifestEntrySchema.bytes`'s `.int().nonnegative()` eight lines
  // above, is a negative or fractional value -- e.g. `takenAtLogical: -1`,
  // a logical timestamp that makes no sense. Built via `exportReviewPackage`
  // itself (rather than mutating an already-checksummed `good()` package)
  // so the checksum is self-consistent and the test actually isolates the
  // schema's numeric discipline, not a checksum mismatch.
  it('quarantines a coverageSnapshot with a negative takenAtLogical', async () => {
    const negativeTimestampPackage = await exportReviewPackage({
      sourceHash: '47bd18db', promptHash: 'p-1', buildHash: 'abc', scenarioVersion: '1',
      scenarioSeed: 'seed-1', fixtureRefs: [], records: [rec()],
      decisions: [], bookmarks: [],
      coverageSnapshot: { takenAtLogical: -1, byStatus: {} },
      screenshotRefs: [],
    })
    const r = await importReviewPackage(negativeTimestampPackage, expected)
    expect(r.ok).toBe(false)
  })

  // Major (final review): spec §2.1 requires updatedAtLogical never
  // precede createdAtLogical. `superseded()` enforces this on the one
  // in-app mutator, but both fields were bare `z.number()` on
  // ReviewRecordSchema -- unlike CoverageSnapshotSchema four lines up,
  // which the test above already gates -- so IMPORT accepted a record
  // with createdAtLogical 1000 / updatedAtLogical 0. Built fresh via
  // exportReviewPackage (not by mutating an already-checksummed `good()`
  // package) so the checksum is self-consistent and this isolates the
  // schema's numeric discipline, matching the pattern above.
  it('quarantines a record whose updatedAtLogical precedes its createdAtLogical', async () => {
    const badRecord = { ...rec(), createdAtLogical: 1000, updatedAtLogical: 0 }
    const p = await exportReviewPackage({
      sourceHash: '47bd18db', promptHash: 'p-1', buildHash: 'abc', scenarioVersion: '1',
      scenarioSeed: 'seed-1', fixtureRefs: [], records: [badRecord],
      decisions: [], bookmarks: [],
      coverageSnapshot: { takenAtLogical: CANONICAL_EPOCH_MS, byStatus: {} },
      screenshotRefs: [],
    })
    const r = await importReviewPackage(p, expected)
    expect(r.ok).toBe(false)
  })
})

describe('import dedupe, conflict and merge', () => {
  const mk = (id: string, comment: string) => ({ ...rec(), id, comment })

  it('reports a record already present as a duplicate, not a new record', () => {
    const existing = [mk('R-1', 'same')]
    const p = planImport([mk('R-1', 'same')], existing)
    expect(p.duplicates).toEqual(['R-1'])
    expect(p.newRecords).toEqual([])
    expect(p.conflicts).toEqual([])
  })

  it('reports a same-id different-content record as a conflict, showing both', () => {
    const existing = [mk('R-1', 'original text')]
    const p = planImport([mk('R-1', 'ALTERED text')], existing)
    expect(p.conflicts).toHaveLength(1)
    expect(p.conflicts[0]?.existing.comment).toBe('original text')
    expect(p.conflicts[0]?.incoming.comment).toBe('ALTERED text')
    expect(p.duplicates).toEqual([])
  })

  it('reports an unseen record as new', () => {
    const p = planImport([mk('R-2', 'fresh')], [mk('R-1', 'a')])
    expect(p.newRecords.map((r) => r.id)).toEqual(['R-2'])
  })

  it('merge keeps the existing side of every conflict', () => {
    const existing = [mk('R-1', 'original')]
    const out = applyImport(planImport([mk('R-1', 'incoming')], existing), 'merge')
    expect(out.find((r) => r.id === 'R-1')?.comment).toBe('original')
  })

  it('replace takes the incoming side of every conflict', () => {
    const existing = [mk('R-1', 'original')]
    const out = applyImport(planImport([mk('R-1', 'incoming')], existing), 'replace')
    expect(out.find((r) => r.id === 'R-1')?.comment).toBe('incoming')
  })

  // Fix round 1 (review, test-quality): this test used to exercise NO
  // conflict at all (`incoming = [mk('R-2', 'b')]` only touched a new id),
  // so it could pass even if a conflict resolution dropped a record -- the
  // exact branch its own name claims to cover. `existing` now also carries
  // a conflicting counterpart for R-1.
  it('both strategies add new records and never drop an existing one, including through a conflict', () => {
    const existing = [mk('R-1', 'a'), mk('R-9', 'keep me')]
    for (const s of ['merge', 'replace'] as const) {
      const out = applyImport(planImport([mk('R-1', 'b'), mk('R-2', 'b')], existing), s)
      expect(out.map((r) => r.id).sort(), s).toEqual(['R-1', 'R-2', 'R-9'])
    }
  })

  // Fix round 1 (review, Major 3, data loss): `planImport` used to build
  // `existingById` from `existing` only and classify each raw `incoming`
  // entry independently -- nothing deduped `incoming` BY ID first. Nothing
  // validates record-id uniqueness upstream either (not
  // ReviewRecordSchema, not the manifest checksum), so a package carrying
  // the same id twice put BOTH copies in `newRecords`; `applyImport` then
  // returned two records sharing an id, and `putReviewRecord` (keyPath
  // `id`) would silently drop one on write -- the exact collision
  // `records.ts`'s `nextId` comment already documents, this time reachable
  // through import instead of a page reload.
  it('dedupes within incoming so applyImport never emits two records sharing an id', () => {
    const p = planImport([mk('R-5', 'first'), mk('R-5', 'second')], [])
    expect(p.newRecords).toHaveLength(1)
    const out = applyImport(p, 'merge')
    expect(out.filter((r) => r.id === 'R-5')).toHaveLength(1)
  })

  it('never classifies the same id as both a duplicate and a conflict within incoming', () => {
    const existing = [mk('R-1', 'original')]
    // First copy is identical to existing (would classify as a duplicate);
    // second copy differs (would classify as a conflict). Deduping within
    // incoming means exactly one classification wins, not both.
    const p = planImport([mk('R-1', 'original'), mk('R-1', 'altered')], existing)
    expect(p.duplicates).toEqual([])
    expect(p.conflicts).toHaveLength(1)
  })

  it('planning mutates neither input', () => {
    const incoming = [mk('R-1', 'x')]
    const existing = [mk('R-1', 'y')]
    const before = JSON.stringify({ incoming, existing })
    planImport(incoming, existing)
    expect(JSON.stringify({ incoming, existing })).toBe(before)
  })
})
