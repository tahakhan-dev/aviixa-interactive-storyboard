import { describe, it, expect, vi } from 'vitest'
import {
  createReviewRecord, createReviewEvent, REVIEW_STATUSES,
  REVIEW_SEVERITIES, REVIEW_DISPOSITIONS, superseded, supersedeWithinSet,
} from '@/review/records'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'
import { IDBFactory } from 'fake-indexeddb'
import { openDatabase } from '@/persistence/schema'
import { putReviewRecord, listReviewRecords } from '@/review/store'

const clock = () => fixedClock(CANONICAL_EPOCH_MS)
const input = {
  anchorType: 'screen' as const, anchorId: 'SCR-1', surface: 'SURF-DOH' as const,
  reviewerLabel: 'Client reviewer', status: 'needs-change' as const,
  severity: 'minor' as const,
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
    const result = await listReviewRecords(db)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.records).toHaveLength(2)
      expect(result.records.map((r) => r.id).sort()).toEqual([beforeReload.id, afterReload.id].sort())
    }
  })
})

const full = {
  anchorType: 'screen' as const, anchorId: 'SCR-1', surface: 'SURF-DOH' as const,
  module: 'MOD-DOH-07', functionId: 'FUNC-A1-01-1-1', route: '/hub/',
  screen: 'SCR-DOH-RUNS', storyState: 'STEP-03',
  reviewerLabel: 'Client reviewer', status: 'needs-change' as const,
  severity: 'major' as const,
  comment: 'The freshness label should name the source surface.',
  requestedChange: 'Add the owning surface beside the as-at time.',
  sourceFingerprint: '47bd18db', scenarioVersion: '1', buildHash: 'abc',
}

// Fix round 1 (review): `CreateReviewRecordInput` has 16 fields (10 always
// required + 6 optional) and `ReviewRecord` adds 6 more (id,
// createdAtLogical, updatedAtLogical, disposition, response, supersededBy),
// all always-present -- 22 fields total, not 21 (the spec's own count was
// off by one). Split so the two claims are separately testable: which
// fields are ALWAYS there regardless of which optionals a caller supplied,
// versus which are there only when supplied.
const ALWAYS_PRESENT_FIELDS = [
  'id', 'anchorType', 'anchorId', 'surface', 'reviewerLabel', 'status', 'severity',
  'comment', 'createdAtLogical', 'updatedAtLogical', 'disposition', 'response',
  'sourceFingerprint', 'scenarioVersion', 'buildHash', 'supersededBy',
]
const OPTIONAL_WHEN_SUPPLIED_FIELDS = ['module', 'functionId', 'route', 'screen', 'storyState', 'requestedChange']

describe('the full twenty-two field review record', () => {
  // Fix round 1 (review, Minor): the old version of this test only proved
  // pass-through -- it used the `full` fixture, which happens to supply all
  // six optional fields, so it could not fail even if the six always-
  // required additions (`updatedAtLogical`/`disposition`/`response`/
  // `supersededBy`/etc.) were silently dropped for a record like the one
  // `app/review/page.tsx` actually produces (no `module`/`functionId`/etc.
  // at all). Asserted against the minimal top-of-file `input` fixture
  // instead, so it fails if an always-present field goes missing.
  it('carries every always-present field, regardless of which optionals were supplied', () => {
    const r = createReviewRecord(input, fixedClock(CANONICAL_EPOCH_MS))
    for (const k of ALWAYS_PRESENT_FIELDS) {
      expect(Object.hasOwn(r, k), `missing always-present field: ${k}`).toBe(true)
    }
  })

  it('carries every optional field spec section 4 names, when the caller supplies it', () => {
    const r = createReviewRecord(full, fixedClock(CANONICAL_EPOCH_MS))
    for (const k of [...ALWAYS_PRESENT_FIELDS, ...OPTIONAL_WHEN_SUPPLIED_FIELDS]) {
      expect(Object.hasOwn(r, k), `missing field: ${k}`).toBe(true)
    }
  })

  it('closes the severity and disposition vocabularies', () => {
    expect(REVIEW_SEVERITIES).toHaveLength(4)
    expect(REVIEW_DISPOSITIONS).toHaveLength(4)
    expect(REVIEW_DISPOSITIONS.join(' ')).not.toMatch(/\bapprove/i)
  })

  it('starts open, unanswered and unsuperseded', () => {
    const r = createReviewRecord(full, fixedClock(CANONICAL_EPOCH_MS))
    expect(r.disposition).toBe('open')
    expect(r.response).toBeNull()
    expect(r.supersededBy).toBeNull()
  })

  it('never lets updatedAtLogical precede createdAtLogical', () => {
    const r = createReviewRecord(full, fixedClock(CANONICAL_EPOCH_MS))
    expect(r.updatedAtLogical).toBeGreaterThanOrEqual(r.createdAtLogical)
  })

  it('supersession links forward and marks the disposition', () => {
    const clock = fixedClock(CANONICAL_EPOCH_MS)
    const first = createReviewRecord(full, clock)
    const second = createReviewRecord(full, clock)
    const closed = superseded(first, second.id, clock)
    expect(closed.supersededBy).toBe(second.id)
    expect(closed.disposition).toBe('superseded')
    expect(closed.updatedAtLogical).toBeGreaterThanOrEqual(closed.createdAtLogical)
  })

  it('refuses to supersede a record by itself', () => {
    const clock = fixedClock(CANONICAL_EPOCH_MS)
    const r = createReviewRecord(full, clock)
    expect(() => superseded(r, r.id, clock)).toThrow(/itself/i)
  })

  // Fix round 1 (review, R1 -- controller ruling): this test used to be
  // titled "requires a requestedChange when the status asks for a change",
  // which names a rule the code does NOT enforce -- `requestedChange` is
  // deliberately optional (see the guard's own comment in records.ts). What
  // the assertion actually covers is narrower: a PRESENT-but-blank value is
  // rejected. Renamed to match, and paired with the test below proving the
  // omitted case is accepted -- so the optionality is asserted on purpose
  // rather than holding by accident.
  it('rejects a blank requestedChange when the status asks for a change', () => {
    expect(() =>
      createReviewRecord({ ...full, status: 'needs-change', requestedChange: '   ' }, fixedClock(CANONICAL_EPOCH_MS)),
    ).toThrow(/requested change/i)
  })

  it('accepts an omitted requestedChange on a needs-change record', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- deliberately dropped to build a fixture without it
    const { requestedChange: _requestedChange, ...withoutRequestedChange } = full
    const r = createReviewRecord(
      { ...withoutRequestedChange, status: 'needs-change' },
      fixedClock(CANONICAL_EPOCH_MS),
    )
    expect(Object.hasOwn(r, 'requestedChange')).toBe(false)
  })

  // Fix round 1 (review, Minor 3): the two assertions above build their
  // record from a SINGLE `fixedClock`, so `updatedAtLogical` and
  // `createdAtLogical` come from one `now()` call and the comparison is
  // `x >= x` -- true by construction, unable to fail even if `superseded()`
  // had no ordering guard at all. This test uses a SECOND clock seeded
  // BEFORE the record's creation time, so the guard added to `superseded()`
  // below is what actually makes it pass.
  it('refuses a supersession whose clock would move updatedAtLogical before createdAtLogical', () => {
    const r = createReviewRecord(full, fixedClock(CANONICAL_EPOCH_MS))
    const earlierClock = fixedClock(CANONICAL_EPOCH_MS - 1_000)
    expect(() => superseded(r, 'rr-later-record', earlierClock)).toThrow(/precede/i)
  })

  // Fix round 1 (review, Minor 4 / R2 controller ruling): `superseded()`
  // alone can only ever refuse the length-1 self-reference cycle -- it has
  // no record set, so it cannot know whether `bySupersedingId` names a real
  // record or whether accepting it would close a longer cycle
  // (A -> B -> C -> A). `supersedeWithinSet` is the layer that knows the
  // set: it is given it explicitly.
  describe('supersedeWithinSet: the layer that knows the record set', () => {
    it('refuses a supersededBy that names no record in the known set', () => {
      const clock = fixedClock(CANONICAL_EPOCH_MS)
      const a = createReviewRecord(full, clock)
      const result = supersedeWithinSet([a], a, 'rr-does-not-exist', clock)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toMatch(/does not exist|known record/i)
    })

    it('refuses a supersession cycle longer than the immediate self-reference', () => {
      const clock = fixedClock(CANONICAL_EPOCH_MS)
      const a = createReviewRecord(full, clock)
      const b = createReviewRecord(full, clock)
      const c = createReviewRecord(full, clock)
      const aClosed = superseded(a, b.id, clock) // A -> B
      const bClosed = superseded(b, c.id, clock) // B -> C
      // Attempting C -> A would close the cycle A -> B -> C -> A.
      const result = supersedeWithinSet([aClosed, bClosed, c], c, a.id, clock)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toMatch(/cycle/i)
    })

    it('still refuses the immediate self-reference, via the same cycle check', () => {
      const clock = fixedClock(CANONICAL_EPOCH_MS)
      const a = createReviewRecord(full, clock)
      const result = supersedeWithinSet([a], a, a.id, clock)
      expect(result.ok).toBe(false)
    })

    it('accepts a well-formed supersession against a known set', () => {
      const clock = fixedClock(CANONICAL_EPOCH_MS)
      const a = createReviewRecord(full, clock)
      const b = createReviewRecord(full, clock)
      const result = supersedeWithinSet([a, b], a, b.id, clock)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.record.supersededBy).toBe(b.id)
        expect(result.record.disposition).toBe('superseded')
      }
    })
  })
})
