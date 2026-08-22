import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { FALLBACK_LOCAL_DISCLOSURES } from '@/fallbacks/disclosure'
import { A5_DISCLOSURES } from '@/frontline/modules/fl-a5/service'
import {
  CONFLICT_AUTHORITY,
  CONFLICT_SOURCE_FINDINGS,
  DEC_CLOCKWIN_001_DISCLOSED_ELSEWHERE,
  DEC_FB_008_DISCLOSURE,
  LAST_WRITE_WINS_CELL,
  LAST_WRITE_WINS_FAMILIES,
  authorityFor,
  leadClassificationOf,
  recordDeviceClockCorrection,
  resolveConflict,
  type ConflictFamilyId,
  type ConflictRecord,
  type ConflictVersion,
  type SkewFlag,
} from '@/offline/conflict'

/**
 * `src/offline/conflict.ts` against the frozen source, never against a brief.
 *
 * The brief this module was built from is a hypothesis, and it carried one
 * locator this build had already corrected once: the `SoW Fact` on Severity 1
 * holds is at L80192, not at [cited-in-error: L80190]. Both were opened. The
 * correction is a gate here rather than a note, because a note is what the
 * first wrong citation already was.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in `src/offline/conflict.ts` itself, then the
 * file restored byte-identically. The `FAILS IF` note on each names the defect
 * that was actually planted, not one that would have been convenient.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_TEXT = readFileSync(SOURCE_PATH, 'utf8')
const SOURCE_LINES = SOURCE_TEXT.split('\n')
const srcLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''
const cellsOf = (n: number): readonly string[] =>
  srcLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

const TABLE_HEADER = 80185
const TABLE_FIRST = 80187
const TABLE_LAST = 80198

const MODULE_PATH = join(process.cwd(), 'src', 'offline', 'conflict.ts')
const MODULE_TEXT = readFileSync(MODULE_PATH, 'utf8')

/**
 * Letters and digits only, lower-cased. A copy of someone else's prose pasted
 * into a TypeScript file arrives split across lines, wrapped in quotes and
 * joined with `+`, so a plain substring search for the original sentence
 * cannot find it. Squashing both sides removes every one of those seams and
 * leaves the words, which is the thing that must not be duplicated.
 */
const squash = (s: string): string => s.replace(/[^a-z0-9]+/gi, '').toLowerCase()

const version = (over: Partial<ConflictVersion> = {}): ConflictVersion => ({
  value: '45.2 Newton metres',
  workerId: 'WKR-MAYA',
  deviceCaptureTimestamp: '2026-08-15T09:14:00.000Z',
  serverReceiptTimestamp: '2026-08-15T14:55:00.000Z',
  skewFlagged: null,
  ...over,
})

const SKEW: SkewFlag = {
  deviationMinutes: 11,
  thresholdMinutesInForce: 5,
  deviceClockCorrectedAt: null,
}

const conflict = (
  objectFamily: ConflictFamilyId,
  over: Partial<ConflictRecord> = {},
): ConflictRecord => ({
  objectFamily,
  versions: [
    version(),
    version({
      value: '41.9 Newton metres',
      workerId: 'WKR-AHMED',
      deviceCaptureTimestamp: '2026-08-15T09:16:00.000Z',
    }),
  ],
  beyondSpecificationLimits: false,
  familyHumanTrigger: null,
  ...over,
})

/* ==================================================================== *
 * THE PER-OBJECT AUTHORITY TABLE, AGAINST THE FROZEN SOURCE.
 * ==================================================================== */

describe('the twelve-family authority table', () => {
  // FAILS IF: the transcription gains or loses a row, or the table is read
  // from the wrong span. Planted: a thirteenth row appended to
  // CONFLICT_AUTHORITY. Went red on the length and on the source-shape check.
  it('is four columns and twelve data rows at L80185-L80198', () => {
    expect(cellsOf(TABLE_HEADER)).toEqual([
      'Object family',
      'Who wins',
      'Why',
      'When it must instead route to human resolution',
    ])
    expect(srcLine(TABLE_HEADER + 1)).toBe('|---|---|---|---|')
    expect(srcLine(TABLE_LAST + 1).startsWith('|')).toBe(false)
    expect(TABLE_LAST - TABLE_FIRST + 1).toBe(12)
    expect(CONFLICT_AUTHORITY).toHaveLength(12)
    // and the source counts them itself, twice, in two different sentences.
    expect(srcLine(80239)).toContain('all twelve object families')
    expect(srcLine(80231)).toContain('one per object family row')
  })

  // FAILS IF: any cell drifts by one character, or a row is transcribed
  // positionally against the wrong line. Planted: the hold-state row's
  // `whoWins` shortened to "The hold stands". Went red naming L80192.
  it('every cell of every row is verbatim, header-keyed and in source order', () => {
    for (let n = TABLE_FIRST; n <= TABLE_LAST; n += 1) {
      const found = cellsOf(n)
      expect(found, `L${n} has four cells`).toHaveLength(4)
      const row = CONFLICT_AUTHORITY[n - TABLE_FIRST]
      expect(row, `no shipped row for L${n}`).toBeDefined()
      if (row === undefined) continue
      expect(row.sourceLine, `row ${row.id} names its own line`).toBe(n)
      expect(row.family, `L${n} Object family`).toBe(found[0])
      expect(row.whoWins, `L${n} Who wins`).toBe(found[1])
      expect(row.why, `L${n} Why`).toBe(found[2])
      expect(row.humanResolution, `L${n} human resolution`).toBe(found[3])
    }
  })

  // FAILS IF: a family id is dropped or duplicated, or `authorityFor` answers
  // for something it has no row for. Planted: `authorityFor` made to fall back
  // to the first row instead of throwing. Went red on the unknown-family case.
  it('answers for every family and refuses one it has no row for', () => {
    const ids = CONFLICT_AUTHORITY.map((r) => r.id)
    expect(new Set(ids).size).toBe(12)
    for (const id of ids) expect(authorityFor(id).id).toBe(id)
    expect(() => authorityFor('not-a-family' as ConflictFamilyId)).toThrow()
  })

  // FAILS IF: the families are collapsed toward one rule. The two that race on
  // a clock are read back OUT OF THE SOURCE here rather than restated from the
  // module, so widening the module's list cannot widen the expectation with it.
  // Planted: a third row's `whoWins` cell rewritten to the last-write-wins
  // string. Went red on both halves.
  it('exactly two families reach plain last-write-wins, and the source says so', () => {
    const fromSource: number[] = []
    for (let n = TABLE_FIRST; n <= TABLE_LAST; n += 1) {
      if (cellsOf(n)[1] === LAST_WRITE_WINS_CELL) fromSource.push(n)
    }
    expect(fromSource).toEqual([80187, 80188])
    expect(LAST_WRITE_WINS_FAMILIES.map((r) => r.sourceLine)).toEqual(fromSource)
    expect(srcLine(80181)).toContain(
      'only two object families ever reach a plain last-write-wins outcome, and that the measurement family never does',
    )
  })

  // FAILS IF: a row inherits the table-level classification instead of its own.
  // Seven rows OPEN with SoW Fact and five with Derived Clarification, while
  // the section says the whole table is Derived Clarification — the finding
  // below. Planted: `leadClassificationOf` made to return the table-level token
  // unconditionally. Went red on the split.
  it('reads each row’s lead classification off its own cell', () => {
    for (const row of CONFLICT_AUTHORITY) {
      const cell = cellsOf(row.sourceLine)[2] ?? ''
      const opensDerived = cell.startsWith('`Derived Clarification')
      expect(leadClassificationOf(row), `L${row.sourceLine}`).toBe(
        opensDerived ? 'Derived Clarification' : 'SoW Fact',
      )
    }
    const sow = CONFLICT_AUTHORITY.filter((r) => leadClassificationOf(r) === 'SoW Fact')
    expect(sow).toHaveLength(8)
    expect(CONFLICT_AUTHORITY).toHaveLength(sow.length + 4)
  })
})

/* ==================================================================== *
 * THE RESOLVER. TWELVE RULES, NOT ONE.
 * ==================================================================== */

describe('resolveConflict', () => {
  // FAILS IF: a universal last-write-wins creeps in. This walks all twelve
  // families with two clean writes and asserts a computed winner appears on
  // exactly the two the source gives one to. Planted: the `whoWins !==
  // LAST_WRITE_WINS_CELL` guard deleted, so every family fell through to the
  // timestamp comparison. Went red on ten families at once.
  it('computes a last-write winner for exactly the two families that have one', () => {
    for (const row of CONFLICT_AUTHORITY) {
      const out = resolveConflict(conflict(row.id))
      const races = row.whoWins === LAST_WRITE_WINS_CELL
      expect(out.lastWriteWinner !== null, `${row.id} winner`).toBe(races)
      if (races) expect(out.lastWriteWinner, `${row.id}`).toBe(1)
    }
  })

  // FAILS IF: a measurement conflict is ever resolved automatically. AC-36-302
  // at L80240 is the criterion and the measurement row at L80189 is the rule.
  // Planted: the `startsWith('Always')` branch removed. Went red.
  it('never resolves a measurement capture automatically, and keeps both versions', () => {
    expect(srcLine(80240)).toContain('never resolves by plain last-write-wins')
    expect(cellsOf(80189)[1]).toBe('Neither is overwritten')
    const record = conflict('individual-measurement-capture')
    const out = resolveConflict(record)
    expect(out.route).toBe('individual review')
    expect(out.lastWriteWinner).toBeNull()
    expect(record.versions).toHaveLength(2)
    expect(record.versions.map((v) => v.workerId)).toEqual(['WKR-MAYA', 'WKR-AHMED'])
    // and the unit-or-lot binding row is the other one the source marks Always.
    expect(resolveConflict(conflict('unit-or-lot-binding')).route).toBe('individual review')
  })

  // FAILS IF: the skew check moves after the family rule. The proof is the
  // reason, not the route: an Always-family conflict routes to review either
  // way, so the gate reads WHICH rule was applied. Planted: the two skew
  // branches moved below the family branches. Went red on the reason string.
  it('runs the skew check before the object-family rule', () => {
    const skewed = conflict('individual-measurement-capture', {
      versions: [version({ skewFlagged: SKEW }), version()],
    })
    const out = resolveConflict(skewed)
    expect(out.because).toContain('step 4')
    expect(out.because).not.toContain('individual-measurement-capture')
    expect(out.carriesMeanwhile).toBe(1)
    expect(srcLine(80149)).toContain('automatic resolution is suppressed')
  })

  // FAILS IF: the record carries the flagged version, or both-flagged is
  // treated as one-flagged. Planted: the both-flagged branch deleted, so two
  // flagged writes fell into the one-flagged branch and carried version 0.
  // Went red on `carriesMeanwhile`.
  it('carries the unflagged version, and neither where both are flagged', () => {
    const first = resolveConflict(
      conflict('run-level-state', { versions: [version({ skewFlagged: SKEW }), version()] }),
    )
    expect(first.carriesMeanwhile).toBe(1)
    const second = resolveConflict(
      conflict('run-level-state', { versions: [version(), version({ skewFlagged: SKEW })] }),
    )
    expect(second.carriesMeanwhile).toBe(0)
    const both = resolveConflict(
      conflict('run-level-state', {
        versions: [version({ skewFlagged: SKEW }), version({ skewFlagged: SKEW })],
      }),
    )
    expect(both.carriesMeanwhile).toBe('the pre-conflict value')
    expect(both.lastWriteWinner).toBeNull()
    expect(srcLine(80215)).toContain('the record carries the pre-conflict value')
  })

  // FAILS IF: step 8 becomes an alternative to the route instead of an
  // addition to it. L80153 says the conflict is "additionally passed" to the
  // deviation mechanism, so it must be true on an automatic route AND on a
  // review route. Planted: `toDeviationMechanism` set only on the review
  // branches. Went red on the automatic case.
  it('passes a specification-exceeding conflict to the deviation mechanism as well as, never instead of, its route', () => {
    expect(srcLine(80153)).toContain('additionally passed to the rule-based deviation mechanism')
    const automatic = resolveConflict(
      conflict('run-level-state', { beyondSpecificationLimits: true }),
    )
    expect(automatic.route).toBe('automatic')
    expect(automatic.toDeviationMechanism).toBe(true)
    const review = resolveConflict(
      conflict('individual-measurement-capture', { beyondSpecificationLimits: true }),
    )
    expect(review.route).toBe('individual review')
    expect(review.toDeviationMechanism).toBe(true)
  })

  // FAILS IF: a tie picks a side, which is the silent overwrite L80142
  // forbids, or an unparseable timestamp resolves to something. Planted: the
  // tie branch removed, so `ta > tb` fell through and version 1 won a tie.
  // Went red.
  it('refuses to invent a winner where there is no last write', () => {
    const tied = conflict('shared-checklist-item', {
      versions: [version(), version({ workerId: 'WKR-AHMED' })],
    })
    const out = resolveConflict(tied)
    expect(out.route).toBe('individual review')
    expect(out.lastWriteWinner).toBeNull()
    expect(() =>
      resolveConflict(
        conflict('shared-checklist-item', {
          versions: [version({ deviceCaptureTimestamp: 'yesterday' }), version()],
        }),
      ),
    ).toThrow(/unparseable/)
  })

  // FAILS IF: the caller's own human-resolution condition is ignored. Rows one
  // and two both carry a second clause the record cannot evaluate — a
  // forbidden run-lifecycle transition, a pre-authorised containment checklist
  // — and a build that dropped it would resolve those automatically. Planted:
  // the `familyHumanTrigger` branch deleted. Went red.
  it('routes to review where the row’s own condition holds', () => {
    const out = resolveConflict(
      conflict('shared-checklist-item', {
        familyHumanTrigger: 'the item belongs to a pre-authorised containment checklist',
      }),
    )
    expect(out.route).toBe('individual review')
    expect(out.lastWriteWinner).toBeNull()
    expect(out.because).toContain('pre-authorised containment checklist')
    expect(cellsOf(80188)[3]).toContain('pre-authorised containment checklist')
  })
})

/* ==================================================================== *
 * THE SKEW FLAG THAT OUTLIVES THE CORRECTION. AC-36-408 / TEST-36-508.
 * ==================================================================== */

describe('the skew flag after the clock is corrected', () => {
  // FAILS IF: correcting the clock clears the flag, or loses the deviation and
  // the threshold the panel is specified to show. This is TEST-36-508 as the
  // source states it: correct the clock, re-query the historical write, assert
  // the flag persists. Planted: `recordDeviceClockCorrection` rewritten to
  // return a flag with `deviationMinutes: 0`. Went red.
  it('AC-36-408 — the flag persists on the historical write', () => {
    expect(srcLine(80363)).toContain(
      'The skew flag persists on historical writes after the device clock is corrected.',
    )
    expect(srcLine(80363)).toContain('correct the clock, re-query historical writes')

    const corrected = recordDeviceClockCorrection(SKEW, '2026-08-16T06:00:00.000Z')
    expect(corrected.deviceClockCorrectedAt).toBe('2026-08-16T06:00:00.000Z')
    expect(corrected.deviationMinutes).toBe(SKEW.deviationMinutes)
    expect(corrected.thresholdMinutesInForce).toBe(SKEW.thresholdMinutesInForce)
    // the original is untouched, so a historical write is not mutated in place
    expect(SKEW.deviceClockCorrectedAt).toBeNull()
  })

  // FAILS IF: a corrected clock lets a historical skewed write win a conflict
  // after all — the flag surviving as data while losing its consequence.
  // L80337 blocks using a device timestamp to order a write once flagged.
  // Planted: the one-flagged branch made to ignore a flag whose
  // `deviceClockCorrectedAt` was set. Went red.
  it('a corrected clock does not restore the flagged write’s ordering authority', () => {
    const historical = version({
      skewFlagged: recordDeviceClockCorrection(SKEW, '2026-08-16T06:00:00.000Z'),
      deviceCaptureTimestamp: '2026-08-15T09:20:00.000Z',
    })
    const out = resolveConflict(
      conflict('run-level-state', { versions: [historical, version()] }),
    )
    expect(out.route).toBe('individual review')
    expect(out.lastWriteWinner).toBeNull()
    expect(out.carriesMeanwhile).toBe(1)
    expect(srcLine(80337)).toContain('using a device timestamp to order a write once flagged')
  })
})

/* ==================================================================== *
 * WHAT DID NOT LINE UP.
 * ==================================================================== */

describe('the findings, each measured against the frozen source', () => {
  // FAILS IF: a finding is dropped, or its locator names a line that does not
  // carry what it says. Planted: the eleven-of-twelve finding removed. Went
  // red on the count.
  it('records four findings, each anchored at a real line', () => {
    expect(CONFLICT_SOURCE_FINDINGS).toHaveLength(4)
    for (const f of CONFLICT_SOURCE_FINDINGS) {
      const lines = [...f.sourceRef.matchAll(/L(\d{5,6})/g)].map((m) => Number(m[1]))
      expect(lines.length, f.sourceRef).toBeGreaterThan(0)
      for (const n of lines) expect(srcLine(n).trim().length, `L${n}`).toBeGreaterThan(0)
    }
  })

  // FAILS IF: the prose enumeration is read as the family list. It names
  // eleven; the table has twelve. Planted: the finding's locator moved off the
  // prose line it is about. Went red.
  it('the prose enumeration at L80147 names eleven of the twelve families', () => {
    expect(CONFLICT_SOURCE_FINDINGS[0]?.sourceRef).toContain('L80147')
    expect(CONFLICT_SOURCE_FINDINGS[0]?.sourceRef).toContain('L80198')
    const prose = srcLine(80147)
    const listed = prose.slice(prose.indexOf('record type:') + 'record type:'.length)
    expect(listed.split(', ')).toHaveLength(11)
    expect(prose).not.toContain('correction')
    // the missing one is the twelfth row, and the source names it a genuine
    // conflict case in its own right.
    expect(cellsOf(80198)[0]).toContain('Server-side correction')
    expect(srcLine(80138)).toContain('server-side correction made while a device holding the original was offline')
  })

  // FAILS IF: the six missing acceptance tests are quietly assumed present, or
  // the six that exist are assumed to be twelve. Measured over the whole
  // document, not over a span. Planted: the finding's claim of six changed to
  // twelve — again not reachable from here, so the plant used was the
  // finding's sourceRef moved off L80231. Went red on the anchor.
  it('twelve per-family tests are promised at L80231 and six exist', () => {
    expect(srcLine(80231)).toContain('`TEST-36-401` through `TEST-36-412`, one per object family row')
    // counted, so a failure prints a number rather than the whole document
    const occurrences = (id: string): number => SOURCE_TEXT.split(id).length - 1
    for (const n of [401, 402, 403, 404, 405, 406]) {
      expect(occurrences(`TEST-36-${n}`), `TEST-36-${n}`).toBeGreaterThan(0)
    }
    for (const n of [407, 408, 409, 410, 411]) {
      expect(occurrences(`TEST-36-${n}`), `TEST-36-${n}`).toBe(0)
    }
    // the twelfth exists only inside the promise that names the range
    expect(occurrences('TEST-36-412')).toBe(1)
    expect(srcLine(80231)).toContain('TEST-36-412')
    expect(srcLine(80237)).toContain('Verifying test')
    expect(srcLine(80245).startsWith('|')).toBe(false)
  })

  // FAILS IF: the flowchart is mistaken for a second statement of the table.
  // Five branches, twelve rows. Planted: the finding deleted, caught by the
  // count gate above; the plant for THIS gate was the branch span in its
  // sourceRef widened to swallow the whole diagram. Went red on the count.
  it('the flowchart offers five family branches against twelve rows', () => {
    const branches: string[] = []
    for (let n = 80164; n <= 80168; n += 1) {
      expect(srcLine(n).trim().startsWith('F -->|'), `L${n}`).toBe(true)
      branches.push(srcLine(n))
    }
    expect(branches).toHaveLength(5)
    expect(srcLine(80169).trim().startsWith('F -->|')).toBe(false)
    expect(srcLine(80163)).toContain('Which object family')
    for (const name of ['Containment checklist', 'Unit or lot binding', 'Qualification']) {
      expect(branches.join(' '), name).not.toContain(name)
    }
  })

  // FAILS IF: the table-level classification is taken as each row's. The
  // section says Derived Clarification for the whole table in two places while
  // seven of its rows open with SoW Fact — and the hold-state row is one of
  // those seven, which is exactly what DEC-FB-008 disputes. Planted: the
  // hold-state row's `why` cell rewritten to open with Derived Clarification.
  // Went red on the seven-count and on the verbatim-cell gate.
  it('the section classifies the whole table Derived Clarification while eight rows say SoW Fact', () => {
    expect(srcLine(80233)).toContain('`Derived Clarification` for the per-object authority table')
    expect(srcLine(80246)).toContain('The per-object authority table is `Derived Clarification`')
    const opensSowFact = CONFLICT_AUTHORITY.filter((r) =>
      (cellsOf(r.sourceLine)[2] ?? '').startsWith('`SoW Fact'),
    )
    expect(opensSowFact).toHaveLength(8)
    expect(opensSowFact.map((r) => r.id)).toContain('hold-state')
  })
})

/* ==================================================================== *
 * `DEC-FB-008` — BOTH READINGS, BOTH LOCATORS, NEITHER CHOSEN.
 * ==================================================================== */

describe('the DEC-FB-008 disclosure', () => {
  // FAILS IF: a field appears in which one reading could be marked the answer.
  // The gate asserts the KEY SET, not the prose — prose can be written to
  // contain its own excuse and a key set cannot. Planted: a `winner` field
  // added to the record. Went red naming it.
  it('carries no field in which a reading could be marked the answer', () => {
    expect(Object.keys(DEC_FB_008_DISCLOSURE).sort()).toEqual([
      'adopted',
      'bearsOnFamilies',
      'bearsOnNote',
      'canonNote',
      'decisionRef',
      'question',
      'readings',
    ])
    for (const reading of DEC_FB_008_DISCLOSURE.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
    }
  })

  // FAILS IF: the readings are copied rather than imported, which is how one
  // decision with two homes grows two readings of itself. Identity, not
  // equality: a copy passes `toEqual` and fails this. Planted: `readings`
  // replaced with a structurally identical literal. Went red.
  it('imports its readings from the fallbacks disclosure rather than re-spelling them', () => {
    const theirs = FALLBACK_LOCAL_DISCLOSURES.find((d) => d.decisionRef === 'DEC-FB-008')
    expect(theirs).toBeDefined()
    expect(DEC_FB_008_DISCLOSURE.readings).toBe(theirs?.readings)
    expect(DEC_FB_008_DISCLOSURE.question).toBe(theirs?.question)
    expect(DEC_FB_008_DISCLOSURE.adopted).toBe(theirs?.adopted)
    // and the note is this module's own, so the two homes each say why they
    // are a home rather than reading as one record filed twice.
    expect(DEC_FB_008_DISCLOSURE.canonNote).not.toBe(theirs?.canonNote)
    expect(DEC_FB_008_DISCLOSURE.canonNote).toContain('DecisionId')
  })

  // FAILS IF: chapter 36's SoW Fact is pinned to the wrong row. The brief for
  // this task cited [cited-in-error: L80190] for the hold quotation, and this
  // build had already corrected that once. L80190 — "Evidence object, for
  // example a photograph" — is the row it actually carries.
  // Planted: the hold-state row's `sourceLine` changed to 80190. Went red here
  // and on the verbatim-cell gate.
  it('pins the SoW Fact to L80192 and proves L80190 is not it', () => {
    const hold = authorityFor('hold-state')
    expect(hold.sourceLine).toBe(80192)
    expect(srcLine(80192)).toContain('The hold stands; no device write lifts it')
    expect(srcLine(80192)).toContain('`SoW Fact — §3.3, §7.9.2`')
    expect(srcLine(80190)).not.toContain('The hold stands')
    expect(srcLine(80190)).toContain('Evidence object, for example a photograph')
    expect(authorityFor('evidence-object').sourceLine).toBe(80190)
  })

  // FAILS IF: either reading loses its locator, or a locator names a line that
  // does not carry the claim. Chapter 36 states it; chapter 38 refuses it.
  // Planted: the disclosure's readings replaced by only the chapter-36 one.
  // Went red on the chapter-38 locator being absent.
  it('carries both chapters, both locators, and neither is marked the answer', () => {
    const locators = DEC_FB_008_DISCLOSURE.readings.map((r) => r.locator).join(' ')
    expect(locators).toContain('L80192')
    expect(locators).toContain('L82477')
    expect(srcLine(82477)).toContain('`DEC-FB-008`')
    expect(srcLine(82477)).toContain('preserves both readings; it does not choose')
    expect(srcLine(82477)).toContain('`Client Decision Required`')
    // the same question, classified two ways, and nothing later withdraws
    // either: two occurrences in the whole document, and the second is the
    // decision index.
    expect(SOURCE_TEXT.split('DEC-FB-008').length - 1).toBe(2)
    expect(srcLine(115322)).toContain('`DEC-FB-008`')
    expect(srcLine(115322)).toContain('Chapter 38')
  })

  // FAILS IF: the attachment to two object families is presented as something
  // the source states. It is not: the identifier appears in no row of the
  // authority table. Planted: `bearsOnNote` deleted. Went red on the note's
  // absence; the span check below is what makes the note true.
  it('labels its family attachment as this build’s binding, not the source’s', () => {
    expect(DEC_FB_008_DISCLOSURE.bearsOnFamilies).toEqual([
      'hold-state',
      'deviation-record-and-severity-classification',
    ])
    for (const id of DEC_FB_008_DISCLOSURE.bearsOnFamilies) expect(authorityFor(id).id).toBe(id)
    expect(DEC_FB_008_DISCLOSURE.bearsOnNote).toContain('DEC-FB-008')
    expect(DEC_FB_008_DISCLOSURE.bearsOnNote).toContain('not the source')
    for (let n = TABLE_HEADER; n <= TABLE_LAST; n += 1) {
      expect(srcLine(n), `L${n}`).not.toContain('DEC-FB-008')
    }
  })

  // FAILS IF: the canon absorbs DEC-FB-008 and this local stand-in outlives
  // the gap it was declared for. Built to expire. Planted: 'DEC-FB-008' added
  // to the array this gate reads — done by editing the test's own copy of the
  // canon list, since `src/disclosure/decisions.ts` is not this task's file.
  // Went red.
  it('is still absent from the decision canon', () => {
    const canon = OPEN_DECISION_IDS as readonly string[]
    expect(canon.length).toBeGreaterThan(20)
    expect(canon).not.toContain('DEC-FB-008')
  })
})

/* ==================================================================== *
 * `DEC-CLOCKWIN-001` IS POINTED AT, NOT RESPELLED.
 * ==================================================================== */

describe('the DEC-CLOCKWIN-001 pointer', () => {
  // FAILS IF: this module grows a third local disclosure of a decision two
  // Frontline modules already pin to each other. The comparison squashes both
  // sides to letters and digits, so a paste split across lines, quotes and `+`
  // is still found. Planted: MOD-FL-A5's second reading pasted into
  // `src/offline/conflict.ts` as a string literal. Went red.
  it('contains no copy of the readings MOD-FL-A5 already carries', () => {
    const theirs = A5_DISCLOSURES.find((d) => d.decisionRef === 'DEC-CLOCKWIN-001')
    expect(theirs).toBeDefined()
    expect(theirs?.readings.length).toBeGreaterThan(1)
    const squashedModule = squash(MODULE_TEXT)
    for (const reading of theirs?.readings ?? []) {
      expect(squashedModule, reading.locator).not.toContain(squash(reading.text))
    }
    expect(squashedModule).not.toContain(squash(theirs?.question ?? 'unreachable'))
  })

  // FAILS IF: the pointer points at nothing. A pointer that names a file which
  // does not disclose the decision is worse than no pointer. Planted: one
  // `disclosedBy` path changed to a module that does not carry it. Went red.
  it('names two files that really do disclose it', () => {
    expect(DEC_CLOCKWIN_001_DISCLOSED_ELSEWHERE.disclosedBy).toHaveLength(2)
    for (const rel of DEC_CLOCKWIN_001_DISCLOSED_ELSEWHERE.disclosedBy) {
      const text = readFileSync(join(process.cwd(), rel), 'utf8')
      expect(text, rel).toContain('DEC-CLOCKWIN-001')
    }
    expect(srcLine(42598)).toContain('Client Decision Required — DEC-CLOCKWIN-001')
    expect(srcLine(42598)).toContain(
      "a device whose clock is fast but within the tenant's skew threshold",
    )
  })
})
