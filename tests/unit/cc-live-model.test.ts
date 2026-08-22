import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  CC_BOARD_NEVER_BLANKS,
  CC_CONNECTIVITY_THRESHOLDS,
  CC_ELEMENT_CLASS_ASSIGNMENTS,
  CC_FRESHNESS_CLASSES,
  CC_FRESHNESS_CLASS_TABLE,
  CC_LATE_ARRIVAL_FLAG,
  CC_LIVE_DECISIONS_HELD_ELSEWHERE,
  CC_LIVE_DISCLOSURES,
  CC_MANUAL_CLOSE_BOUNDARY,
  CC_MARKER_DEVICE_COLUMNS,
  CC_RECORD_FINISH_DEFAULT_HOURS,
  CC_REFRESH_DEFAULT_SECONDS,
  CC_REFRESH_FLOOR_SECONDS,
  CC_RUN_LIFECYCLE,
  CC_RUN_STATES,
  CC_RUN_STATE_PERMISSIONS,
  CC_RUN_TRANSITIONS,
  ccApplyRecompute,
  ccDeviceIsSynced,
  ccElementAssignment,
  ccFiredThresholds,
  ccInventoryNote,
  ccIsMaterialRecompute,
  ccIsStale,
  ccMarkerForm,
  ccMarkerText,
  ccOfflineCount,
  ccPendingCapturesText,
  ccPushedShowsBothTimes,
  ccRefreshOutcome,
  type CcMarkerDevice,
  type CcMarkerState,
} from '@/surfaces/cc/live/model'

/**
 * §21.3 — THE LIVE MODEL OF `SURF-CC`, GATED AGAINST THE FROZEN SOURCE.
 *
 * WHAT THESE GATES ASK. Every expectation about the source is READ OFF THE
 * FROZEN SOURCE at test time. Nothing below compares a string this task wrote
 * against another string this task wrote, and **no count is taken from the
 * array under test**: "eighteen rows" is obtained by walking the source's own
 * table from its separator to the first line that is not a table row, never
 * from `CC_ELEMENT_CLASS_ASSIGNMENTS.length` and never by subtracting the ends
 * of a span written in a brief.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — the
 * defect planted into the real shipping file, the red observed, then restored
 * byte-identically and verified by checksum. The `PLANTED` note names the
 * defect that was ACTUALLY planted, never a convenient one. Where two guards
 * cover the same defect, the removal of EACH and of BOTH was planted, because
 * redundant protections cannot be verified one at a time.
 *
 * FOUR BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE WERE LIVE RISKS HERE:
 *
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR, which splits
 *    into non-empty cells like any other row. Every count below starts AFTER
 *    the separator line and excludes it by position, not by content.
 *  - A COUNT CHECK TRUE OF BOTH THE DEFECT AND ITS FIX, because two categories
 *    have the same number of rows. Two rows of the assignment table are
 *    per-device and two are on-sync; a gate asserting "two" of either passes
 *    if the flags are swapped between them. Both gates therefore name the
 *    ROWS, read off the source's own cells, and not the count.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Every column index
 *    below is resolved from the header line at test time by NAME, so reordering
 *    the model's fields cannot move the comparison with it.
 *  - `Allowed` READ AS A STATUS TOKEN WHERE IT IS NOT ONE. The run-state
 *    table's `Figures final` column uses `Allowed` as an assertion that the
 *    figures ARE final, on the one row whose other three cells are two
 *    `Read-only`s and an `Explicitly prohibited`. The gate asserts that
 *    contradiction directly.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function srcLine(n: number): string {
  const l = LINES[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

/** A markdown row split into its cells; the two pipe edges are not cells. */
function cells(row: string): string[] {
  const parts = row.split('|')
  return parts.slice(1, parts.length - 1).map((c) => c.trim())
}

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/**
 * The data rows of the table whose separator is at `separatorLine`, counted
 * off the source. Starts AFTER the separator and stops at the first line that
 * is not a table row, so the separator can never be counted as data and a span
 * written in a brief is never trusted for a count.
 */
function dataRows(separatorLine: number): { line: number; cells: string[] }[] {
  const out: { line: number; cells: string[] }[] = []
  for (let n = separatorLine + 1; isTableRow(srcLine(n)); n += 1) {
    out.push({ line: n, cells: cells(srcLine(n)) })
  }
  return out
}

/** The index of a column, resolved from the header BY NAME at test time. */
function columnIndex(headerLine: number, name: string): number {
  const i = cells(srcLine(headerLine)).indexOf(name)
  if (i < 0) {
    throw new Error(
      `L${headerLine} has no column named "${name}". Its columns are ` +
        `${JSON.stringify(cells(srcLine(headerLine)))}.`,
    )
  }
  return i
}

/** Backticks are the source's own marking on identifiers; cells carry them. */
const unticked = (s: string): string => s.replaceAll('`', '')

describe('§21.3.1 — the three freshness classes (L35819)', () => {
  // FAILS IF: the class table gains, loses or re-words a row. The count comes
  // from walking the SOURCE from its separator, so it cannot be satisfied by
  // the model's own length, and the separator is excluded by position.
  // PLANTED: deleted the `on-sync` record from `CC_FRESHNESS_CLASS_TABLE`.
  // RED: expected [ { id: 'pushed', …(5) }, …(1) ] to have a length of 3 but got 2
  // PLANTED (2): changed `honestLatency` on the refreshed row from
  //   'Up to one refresh interval' to 'Up to one interval'.
  // RED: expected 'Up to one interval' to be 'Up to one refresh interval'
  it('transcribes all three class rows verbatim, header-keyed', () => {
    const rows = dataRows(35828)
    expect(srcLine(35827)).toContain('| Class |')
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.line)).toEqual([35829, 35830, 35831])

    const iClass = columnIndex(35827, 'Class')
    const iIn = columnIndex(35827, 'What is in it')
    const iMoves = columnIndex(35827, 'How it moves')
    const iLatency = columnIndex(35827, 'Honest latency')

    expect(CC_FRESHNESS_CLASS_TABLE).toHaveLength(rows.length)
    rows.forEach((row, n) => {
      const mine = CC_FRESHNESS_CLASS_TABLE[n]!
      expect(mine.sourceRef).toBe(`L${row.line}`)
      expect(mine.label).toBe(row.cells[iClass])
      expect(mine.contents).toBe(row.cells[iIn])
      expect(mine.movement).toBe(row.cells[iMoves])
      expect(mine.honestLatency).toBe(row.cells[iLatency])
    })
  })

  // FAILS IF: the closed vocabulary drifts from the table it names. Both
  // directions, so neither a missing nor an extra member passes.
  // PLANTED: appended `'stale'` to `CC_FRESHNESS_CLASSES`.
  // RED: expected [ 'pushed', 'refreshed', …(2) ] to deeply equal
  //      [ 'pushed', 'refreshed', 'on-sync' ]
  it('closes the vocabulary at exactly the three the table lists', () => {
    expect([...CC_FRESHNESS_CLASSES]).toEqual(CC_FRESHNESS_CLASS_TABLE.map((c) => c.id))
    expect(new Set(CC_FRESHNESS_CLASSES).size).toBe(dataRows(35828).length)
  })

  // FAILS IF: the numbers drift from the numbers canon. Read out of L35837's
  // own sentence rather than compared to a literal this task wrote.
  // BOTH DIRECTIONS ARE LOAD-BEARING: asserting only that the line CONTAINS
  // '60 seconds' passes for a model holding 30, so each number is also
  // asserted absent from the other's role.
  // PLANTED: set `CC_REFRESH_FLOOR_SECONDS` to 15.
  // RED: expected '**Second, the refresh interval number…' to contain
  //      'platform floor of 15 seconds'
  it('quotes 60 default and 30 floor exactly, off L35837', () => {
    const l = srcLine(35837)
    expect(l).toContain(`The default is ${CC_REFRESH_DEFAULT_SECONDS} seconds`)
    expect(l).toContain(`platform floor of ${CC_REFRESH_FLOOR_SECONDS} seconds`)
    expect(l).not.toContain(`platform floor of ${CC_REFRESH_DEFAULT_SECONDS} seconds`)
    expect(l).not.toContain(`The default is ${CC_REFRESH_FLOOR_SECONDS} seconds`)
    expect(CC_REFRESH_FLOOR_SECONDS).toBeLessThan(CC_REFRESH_DEFAULT_SECONDS)
  })

  // FAILS IF: a clamp is introduced. `AC-CC-113` (L35910) forbids clamping
  // silently, and the outcome union has no clamp member — but a union with no
  // clamp still permits `ccRefreshOutcome(15)` returning 'accepted', which is
  // a clamp by another name. Both the token and the behaviour are asserted.
  // PLANTED: made `ccRefreshOutcome` return 'accepted' for `seconds < FLOOR`.
  // RED: expected 'accepted' to be 'rejected-below-floor'
  it('rejects below the floor and never clamps (AC-CC-113, L35910)', () => {
    expect(srcLine(35910)).toContain('rejects values below 30 seconds rather than clamping silently')
    expect(ccRefreshOutcome(15)).toBe('rejected-below-floor')
    expect(ccRefreshOutcome(29)).toBe('rejected-below-floor')
    expect(ccRefreshOutcome(30)).toBe('requires-scale-validation')
    expect(ccRefreshOutcome(59)).toBe('requires-scale-validation')
    expect(ccRefreshOutcome(60)).toBe('accepted')
    expect(ccRefreshOutcome(300)).toBe('accepted')
  })

  // FAILS IF: the two-interval boundary is read as at-or-after. L35848 says
  // "older than two intervals", so exactly two intervals is NOT stale, and a
  // gate that only checked 3 intervals passes for both readings.
  // PLANTED: changed `ccIsStale` from `>` to `>=`.
  // RED: expected true to be false
  it('enters FB-CC-STALE strictly after two intervals (L35848)', () => {
    expect(srcLine(35848)).toContain('older than two intervals')
    expect(srcLine(35848)).toContain('FB-CC-STALE')
    expect(ccIsStale(119, 60)).toBe(false)
    expect(ccIsStale(120, 60)).toBe(false)
    expect(ccIsStale(121, 60)).toBe(true)
  })

  // FAILS IF: a pushed element stops distinguishing origin from receipt.
  // L35835 is the rule; `AC-CC-112` (L35909) is the criterion.
  // PLANTED: nothing to plant on the source assertions — proved instead by
  //   asserting BOTH directions of the predicate, so it cannot pass vacuously.
  it('measures pushed latency from server receipt (L35835)', () => {
    expect(srcLine(35835)).toContain('The platform never implies it knew at 09:41')
    expect(srcLine(35909)).toContain('origin and receipt times differ shows both')
    expect(ccPushedShowsBothTimes({ originTime: '09:41', receiptTime: '10:22' })).toBe(true)
    expect(ccPushedShowsBothTimes({ originTime: '10:22', receiptTime: '10:22' })).toBe(false)
  })
})

describe('the eighteen-row element → class assignment (L35882-L35901)', () => {
  const HEADER = 35882
  const SEP = 35883

  // FAILS IF: any of the eighteen rows drifts in any of its four cells, or the
  // table's own body grows or shrinks. Columns resolved BY NAME from L35882 at
  // test time, so reordering the model's fields moves nothing.
  // PLANTED: changed row L35896's obligation in the model from
  //   'As-of time; floor completions arrive on-sync' to 'As-of time'.
  // RED: expected 'As-of time' to be 'As-of time; floor completions arrive on-sync'
  // PLANTED (2): deleted the `Evidence media` record.
  // RED: expected [ { …(7) }, { …(7) }, { …(7) }, …(14) ] to have a length of 18 but got 17
  it('transcribes all eighteen rows verbatim, header-keyed', () => {
    const rows = dataRows(SEP)
    expect(rows).toHaveLength(18)
    expect(rows[0]!.line).toBe(35884)
    expect(rows.at(-1)!.line).toBe(35901)
    // The body stops where it stops. Asserted directly, because a span in a
    // brief states where a table IS and never how many rows it has.
    expect(isTableRow(srcLine(35902))).toBe(false)

    const iElement = columnIndex(HEADER, 'Element')
    const iModule = columnIndex(HEADER, 'Module')
    const iClass = columnIndex(HEADER, 'Class')
    const iMarker = columnIndex(HEADER, 'Marker obligation')

    expect(CC_ELEMENT_CLASS_ASSIGNMENTS).toHaveLength(rows.length)
    rows.forEach((row, n) => {
      const mine = CC_ELEMENT_CLASS_ASSIGNMENTS[n]!
      expect(mine.sourceRef).toBe(`L${row.line}`)
      expect(mine.element).toBe(row.cells[iElement])
      expect(mine.classCell).toBe(row.cells[iClass])
      expect(mine.markerObligation).toBe(row.cells[iMarker])
      expect(mine.modules.join(', ')).toBe(unticked(row.cells[iModule]!))
    })
  })

  // FAILS IF: `Report figures`' Class cell is normalised on transcription. The
  // cell carries a class AND a qualifier and the qualifier is the finding, so
  // the gate asserts the cell is NOT one of the three bare class labels while
  // still mapping to one of them.
  // PLANTED: set `classCell` on the Report figures row to 'Refreshed'.
  // RED: expected 'Refreshed' to be 'Refreshed with an explicit data-as-of stamp'
  it('keeps the class-plus-qualifier cell whole (L35900)', () => {
    const iClass = columnIndex(HEADER, 'Class')
    const source = cells(srcLine(35900))[iClass]!
    const mine = ccElementAssignment('Report figures')
    expect(mine.classCell).toBe(source)
    expect(mine.classCell).not.toBe('Refreshed')
    expect(source).toContain('Refreshed')
    expect(source.length).toBeGreaterThan('Refreshed'.length)
    // It is still one of the three, and the model says which.
    expect(mine.freshnessClass).toBe('refreshed')
  })

  // FAILS IF: `perDevice` drifts from the source's own cells. THE COUNT IS NOT
  // THE CHECK: two rows are per-device and two rows are on-sync, so a gate
  // asserting "two per-device rows" is true of the model with the flags moved
  // onto the wrong pair. The rows are named, read off the source's obligation
  // cells, and the model's set is compared to that set.
  // PLANTED: moved `perDevice: true` from `Hold per-device confirmation state`
  //   to `Step-level capture detail`, leaving the count at two.
  // RED: expected [ …(2) ] to deeply equal [ …(2) ]  (the two element names, swapped)
  it('marks BOTH per-device rows and only those two (L35897, L35901)', () => {
    const iElement = columnIndex(HEADER, 'Element')
    const iMarker = columnIndex(HEADER, 'Marker obligation')
    const fromSource = dataRows(SEP)
      .filter((r) => r.cells[iMarker]!.toLowerCase().startsWith('per-device'))
      .map((r) => r.cells[iElement]!)
      .sort()

    // The source has two, and they are not the same row twice.
    expect(fromSource).toHaveLength(2)
    expect(new Set(fromSource).size).toBe(2)

    const fromModel = CC_ELEMENT_CLASS_ASSIGNMENTS.filter((a) => a.perDevice)
      .map((a) => a.element)
      .sort()
    expect(fromModel).toEqual(fromSource)
  })

  // FAILS IF: the derived class stops agreeing with the cell it was read from.
  // Reads the class out of the SOURCE cell rather than off the model's own
  // `classCell`, so a model that mis-transcribed the cell AND mis-derived the
  // class in the same direction still goes red.
  // PLANTED: set `freshnessClass` to 'pushed' on the `Evidence media` row,
  //   whose Class cell reads 'On-sync'.
  // RED: expected 'pushed' to be 'on-sync'
  it('derives every class from its own source cell', () => {
    const iClass = columnIndex(HEADER, 'Class')
    dataRows(SEP).forEach((row, n) => {
      const cell = row.cells[iClass]!.toLowerCase()
      const expected = cell.startsWith('pushed')
        ? 'pushed'
        : cell.startsWith('on-sync')
          ? 'on-sync'
          : 'refreshed'
      expect(CC_ELEMENT_CLASS_ASSIGNMENTS[n]!.freshnessClass).toBe(expected)
    })
    // And every derived class is a member of the closed vocabulary.
    for (const a of CC_ELEMENT_CLASS_ASSIGNMENTS) {
      expect(CC_FRESHNESS_CLASSES).toContain(a.freshnessClass)
    }
  })

  // FAILS IF: an unassigned element renders rather than throwing. `AC-CC-110`
  // (L35907) requires the assignment to be discoverable, and a default class
  // would render an element with somebody else's obligation.
  // PLANTED: made `ccElementAssignment` return the first row on a miss.
  // RED: expected [Function] to throw an error
  it('throws on an element §21.3.1 does not assign (AC-CC-110, L35907)', () => {
    expect(srcLine(35907)).toContain('discoverable in the element')
    expect(() => ccElementAssignment('Some element nobody classified')).toThrow(/L35907/)
    expect(ccElementAssignment('Deviation opened').freshnessClass).toBe('pushed')
  })
})

describe('§21.3.2 — the marker (L35925)', () => {
  const device = (over: Partial<CcMarkerDevice> = {}): CcMarkerDevice => ({
    deviceId: 'TAB-015',
    cell: 'Wheel Station 2',
    lastSeen: '10:21:58',
    lastSync: '10:21:58',
    pendingCaptures: 0,
    ...over,
  })
  const state = (over: Partial<CcMarkerState> = {}): CcMarkerState => ({
    scope: 'cell',
    devices: [device()],
    lastSyncInScope: '10:21:58',
    inventoryAvailable: true,
    ...over,
  })

  // FAILS IF: the expansion's columns drift from the storyboard's table.
  // PLANTED: dropped 'Last successful sync' from `CC_MARKER_DEVICE_COLUMNS`.
  // RED: expected [ 'Device', 'Location (Cell)', …(2) ] to deeply equal
  //      [ 'Device', 'Location (Cell)', …(3) ]
  it('lists the five device-expansion columns, off L35965', () => {
    expect([...CC_MARKER_DEVICE_COLUMNS]).toEqual(cells(srcLine(35965)))
    const rows = dataRows(35966)
    expect(rows).toHaveLength(3)
    expect(isTableRow(srcLine(35970))).toBe(false)
  })

  // FAILS IF: an unknown pending count renders as a zero. THIS IS THE
  // SECTION'S NAMED LIE and it has two guards — the union has no zero
  // stand-in, and the text function branches on 'unknown' — so BOTH were
  // planted, and both together.
  // PLANTED (a): made `ccPendingCapturesText` return `${pending} captures
  //   pending` unconditionally.
  // RED: expected 'unknown captures pending' to be 'pending captures unknown'
  // PLANTED (b): changed the model's `CcPendingCaptures` to `number` and gave
  //   the unknown device `0`.
  // RED: expected '0 captures pending' not to match /\b0\b/
  // PLANTED (a+b): both at once — same red as (b), reached one assertion
  //   earlier, which is why the source row is asserted independently below.
  it('never renders zero for an unknown count (AC-CC-122, L35981)', () => {
    expect(srcLine(35981)).toContain('never reports a pending-capture count of zero')
    expect(srcLine(35945)).toContain('must say so rather than showing zero')
    // The source's own device list proves the case is real rather than
    // hypothetical: its first row is a word where the other two are digits.
    const iPending = columnIndex(35965, 'Pending captures')
    const list = dataRows(35966).map((r) => r.cells[iPending]!)
    expect(list[0]).toBe('Unknown while offline')
    expect(list.slice(1)).toEqual(['0', '0'])

    expect(ccPendingCapturesText('unknown')).toBe('pending captures unknown')
    expect(ccPendingCapturesText('unknown')).not.toMatch(/\b0\b/)
    expect(ccPendingCapturesText(0)).toBe('0 captures pending')
    expect(ccPendingCapturesText(14)).toBe('14 captures pending')
  })

  // FAILS IF: offline is read as "unknown". L35931's own example is two
  // offline devices carrying a KNOWN fourteen pending, so a model that
  // counted only unknowns renders '0 of 9 devices offline' for that line.
  // PLANTED: changed `ccDeviceIsSynced` to `d.pendingCaptures !== 'unknown'`.
  // RED: expected +0 to be 2 // Object.is equality
  it('counts an offline device with a known pending count (L35931)', () => {
    expect(srcLine(35931)).toContain('2 of 9 devices offline · 14 captures pending')
    const s = state({
      devices: [device({ deviceId: 'A', pendingCaptures: 9 }), device({ deviceId: 'B', pendingCaptures: 5 })],
    })
    expect(ccOfflineCount(s)).toBe(2)
    expect(ccDeviceIsSynced(device({ pendingCaptures: 9 }))).toBe(false)
    expect(ccDeviceIsSynced(device({ pendingCaptures: 0 }))).toBe(true)
  })

  // FAILS IF: the marker disappears in the healthy case, or the degraded form
  // invents a device count. `AC-CC-120` (L35979) and `AC-CC-123` (L35982).
  // PLANTED: made `ccMarkerText` return '' for 'live-all-synced'.
  // RED: expected '' to be 'Live · all devices synced'
  it('renders in every state including healthy (AC-CC-120, L35979)', () => {
    expect(srcLine(35979)).toContain('including the fully healthy state')
    expect(ccMarkerForm(state())).toBe('live-all-synced')
    expect(ccMarkerText(state())).toBe('Live · all devices synced')

    const partial = state({
      devices: [device({ deviceId: 'TAB-014', pendingCaptures: 'unknown' }), device()],
      lastSyncInScope: '09:11',
    })
    expect(ccMarkerForm(partial)).toBe('partially-synced')
    expect(ccMarkerText(partial)).toBe(
      'Synced 09:11 · 1 of 2 devices offline · pending captures unknown',
    )

    // `AC-CC-123`: stated-unavailable, and NO device count in it.
    const degraded = state({ inventoryAvailable: false, lastSyncInScope: '09:11:47' })
    expect(ccMarkerForm(degraded)).toBe('inventory-unavailable')
    const text = ccMarkerText(degraded)
    expect(text).toBe(
      'Device sync state unavailable · last successful sync in this scope 09:11:47',
    )
    expect(text).not.toMatch(/\d+ of \d+/)
    // The sync time survives the inventory failure — L35975 says why.
    expect(srcLine(35975)).toContain('the sync time is still known from the sync log')
    expect(text).toContain('09:11:47')
  })

  // FAILS IF: the inventory note drops the inventory's own age.
  //
  // THE FIRST FORM OF THIS GATE WAS BEATEN, AND BY THE OBVIOUS DEFECT.
  // `expect(srcLine(35971)).toContain(note)` is satisfied by ANY prefix of the
  // source sentence, so truncating the note to 'Device inventory is held on
  // the platform side.' — dropping the read time, which is the only part of it
  // that ages — went green. Planted, observed green, gate rewritten. The
  // comparison is now to the whole quoted sentence, extracted from L35971 at
  // test time, so a prefix is a mismatch rather than a match.
  // PLANTED: replaced `ccInventoryNote`'s template with the bare sentence
  //   'Device inventory is held on the platform side.'
  // RED: expected 'Device inventory is held on the platform side.' to be
  //      'Device inventory is held on the platform side. Last inventory read 10:20:03.'
  it('renders the whole inventory note, age included (L35971)', () => {
    const quoted = srcLine(35971).match(/"([^"]+)"/)
    expect(quoted).not.toBeNull()
    expect(ccInventoryNote('10:20:03')).toBe(quoted![1])
    // The time is interpolated rather than frozen into the sentence.
    expect(ccInventoryNote('11:00:00')).toContain('11:00:00')
  })
})

describe('§21.3.3 — connectivity loss (L35994)', () => {
  const HEADER = 36042

  // FAILS IF: any of the three threshold rows drifts. Columns by name.
  // PLANTED: changed the tenant banner's `renderedHere` from
  //   'Yes — on this board' to 'Yes'.
  // RED: expected 'Yes' to be 'Yes — on this board'
  it('transcribes all three threshold rows verbatim, header-keyed', () => {
    const rows = dataRows(36043)
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.line)).toEqual([36044, 36045, 36046])
    expect(isTableRow(srcLine(36047))).toBe(false)

    const iT = columnIndex(HEADER, 'Threshold')
    const iD = columnIndex(HEADER, 'Default')
    const iC = columnIndex(HEADER, 'Configurable')
    const iA = columnIndex(HEADER, 'Audience')
    const iR = columnIndex(HEADER, 'Rendered on this surface')

    expect(CC_CONNECTIVITY_THRESHOLDS).toHaveLength(rows.length)
    rows.forEach((row, n) => {
      const mine = CC_CONNECTIVITY_THRESHOLDS[n]!
      expect(mine.sourceRef).toBe(`L${row.line}`)
      expect(mine.threshold).toBe(row.cells[iT])
      expect(mine.defaultLabel).toBe(row.cells[iD])
      expect(mine.configurable).toBe(row.cells[iC])
      expect(mine.audience).toBe(row.cells[iA])
      expect(mine.renderedHere).toBe(row.cells[iR])
      expect(mine.defaultLabel).toBe(`${mine.defaultMinutes} minutes`)
    })
  })

  // FAILS IF: a second row claims to draw a banner, or the one that does
  // stops. THE COUNT IS NOT THE CHECK — a gate asserting "exactly one true"
  // passes with the flag on the wrong row — so the flag is compared against
  // the source's own `Rendered on this surface` cell, row by row.
  // PLANTED: set `rendersOwnBanner: true` on the 120-minute row AND false on
  //   the 60-minute row, keeping the count at one.
  // RED: expected true to be false
  it('draws its own banner on exactly the row whose cell says so', () => {
    const iR = columnIndex(HEADER, 'Rendered on this surface')
    dataRows(36043).forEach((row, n) => {
      const cell = row.cells[iR]!
      expect(CC_CONNECTIVITY_THRESHOLDS[n]!.rendersOwnBanner).toBe(cell.startsWith('Yes'))
    })
    // The 120-minute row's cell is neither a yes nor a no: it says the SAME
    // banner gains a sentence. Asserted so a two-token read cannot stand.
    expect(cells(srcLine(36046))[iR]).toBe('Banner states the elapsed duration')
    // And the platform-side row is the only outright No.
    expect(cells(srcLine(36044))[iR]).toBe('No — platform-side signal')
  })

  // FAILS IF: the clock stops firing thresholds in order, or fires one early.
  // PLANTED: changed `ccFiredThresholds` from `>=` to `>`.
  // RED: expected [] to deeply equal [ 30 ]
  it('fires each threshold at its own configured minute', () => {
    expect(ccFiredThresholds(29)).toHaveLength(0)
    expect(ccFiredThresholds(30).map((t) => t.defaultMinutes)).toEqual([30])
    expect(ccFiredThresholds(60).map((t) => t.defaultMinutes)).toEqual([30, 60])
    expect(ccFiredThresholds(120).map((t) => t.defaultMinutes)).toEqual([30, 60, 120])
  })

  // FAILS IF: the never-blank rule is dropped. `AC-CC-133` (L36055).
  // PLANTED: set `CC_BOARD_NEVER_BLANKS` to false.
  // RED: expected false to be true
  it('holds the never-blank rule (AC-CC-133, L36055)', () => {
    expect(srcLine(36055)).toContain('blank, disappear, or render a value without its age')
    expect(srcLine(36000)).toContain('The board never goes blank because the floor went dark')
    expect(CC_BOARD_NEVER_BLANKS).toBe(true)
  })
})

describe('§21.3.4 — as-of times, late data, materiality (L36068)', () => {
  // FAILS IF: materiality stops being per-level. L36076 spells it out: any
  // level's count. A total-based check passes for a swap of one Severity 1
  // into one Severity 2, which is the case that gate exists for.
  // PLANTED: rewrote `ccIsMaterialRecompute` to compare the SUM of counts.
  // RED: expected false to be true
  it('is material on any severity level, not on the total (L36076)', () => {
    expect(srcLine(36076)).toContain("or any other severity level's count")
    expect(ccIsMaterialRecompute({ '1': 1, '2': 1 }, { '1': 1, '2': 1 })).toBe(false)
    expect(ccIsMaterialRecompute({ '1': 1, '2': 1 }, { '1': 1, '2': 2 })).toBe(true)
    // The total is unchanged and it IS material.
    expect(ccIsMaterialRecompute({ '1': 2, '2': 1 }, { '1': 1, '2': 2 })).toBe(true)
    // A level appearing or disappearing has changed too.
    expect(ccIsMaterialRecompute({ '1': 1 }, { '1': 1, '3': 1 })).toBe(true)
    expect(ccIsMaterialRecompute({ '1': 1, '3': 1 }, { '1': 1 })).toBe(true)
  })

  // FAILS IF: a value is replaced without a new stamp, or a failed recompute
  // renders. `AC-CC-141` (L36120) and `AC-CC-144` (L36123) — two criteria,
  // one function, so BOTH branches were planted and both together.
  // PLANTED (a): disabled the same-stamp guard, so a recompute carrying the
  //   previous stamp is returned rather than throwing.
  // RED: expected [Function] to throw an error
  // PLANTED (b): made the null branch return `{ value: previous.value, asOf: '' }`.
  // RED: expected { value: 2, asOf: '' } to deeply equal { value: 2, asOf: '13:40:12' }
  // PLANTED (a+b): both at once. Red on (b)'s assertion, which fires first.
  it('never replaces a value without a new stamp, never renders a partial', () => {
    expect(srcLine(36120)).toContain('No aggregate value is replaced without a new as-of timestamp')
    expect(srcLine(36123)).toContain('the previous value and stamp persist instead')

    const previous = { value: 2, asOf: '13:40:12' }
    expect(ccApplyRecompute(previous, null)).toEqual(previous)
    expect(ccApplyRecompute(previous, { value: 3, asOf: '13:53:04' })).toEqual({
      value: 3,
      asOf: '13:53:04',
    })
    expect(() => ccApplyRecompute(previous, { value: 3, asOf: '13:40:12' })).toThrow(/AC-CC-141/)
  })

  // FAILS IF: the flag is respelled. The source uses one spelling and the
  // model must use the source's, not a camelCased convenience.
  // PLANTED: changed `CC_LATE_ARRIVAL_FLAG` to 'lateArrival'.
  // RED: expected '3. A device reconnects and delivers c…' to contain '`lateArrival`'
  it('spells the late-arrival flag as the source spells it (L36082)', () => {
    expect(srcLine(36082)).toContain(`\`${CC_LATE_ARRIVAL_FLAG}\``)
    expect(srcLine(36162)).toContain(`\`${CC_LATE_ARRIVAL_FLAG}\``)
  })
})

describe('§21.3.5 — the run lifecycle (L36136)', () => {
  const HEADER = 36190

  // FAILS IF: the permission table drifts in any cell. Six columns, by name.
  // PLANTED: changed the finished row's `lateCapturesFoldIn` from
  //   'Explicitly prohibited — audited recompute applies instead' to
  //   'Explicitly prohibited'.
  // RED: expected 'Explicitly prohibited' to be
  //      'Explicitly prohibited — audited recompute applies instead'
  it('transcribes all three permission rows verbatim, header-keyed', () => {
    const rows = dataRows(36191)
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.line)).toEqual([36192, 36193, 36194])
    expect(isTableRow(srcLine(36195))).toBe(false)
    expect(cells(srcLine(HEADER))).toHaveLength(6)

    const iState = columnIndex(HEADER, 'State')
    const iBoard = columnIndex(HEADER, 'Board shows it')
    const iSup = columnIndex(HEADER, 'Supervisors act on it')
    const iLate = columnIndex(HEADER, 'Late captures fold in')
    const iFinal = columnIndex(HEADER, 'Figures final')
    const iCause = columnIndex(HEADER, 'Who or what causes the transition')

    expect(CC_RUN_STATE_PERMISSIONS).toHaveLength(rows.length)
    rows.forEach((row, n) => {
      const mine = CC_RUN_STATE_PERMISSIONS[n]!
      expect(mine.sourceRef).toBe(`L${row.line}`)
      expect(mine.state).toBe(row.cells[iState]!.toLowerCase())
      expect(mine.boardShowsIt).toBe(row.cells[iBoard])
      expect(mine.supervisorsActOnIt).toBe(row.cells[iSup])
      expect(mine.lateCapturesFoldIn).toBe(row.cells[iLate])
      expect(mine.figuresFinalCell).toBe(row.cells[iFinal])
      expect(mine.transitionCause).toBe(row.cells[iCause])
    })
  })

  // FAILS IF: `Allowed` in the `Figures final` column is read as a permission.
  // It is an ASSERTION: the one row carrying it is the one whose other three
  // cells are two `Read-only`s and an `Explicitly prohibited`. A gate merely
  // asserting `figuresFinal === true` on the finished row would also pass for
  // a model that read the token as a grant, so the contradiction itself is
  // asserted — the same row is simultaneously the most and the least
  // permissive, which is only coherent if the column is not about permission.
  // PLANTED: set `figuresFinal: true` on the submitted row, whose cell reads
  //   'Not applicable — not final'.
  // RED: expected true to be false
  it('reads the Figures final column as an assertion, not a grant', () => {
    const iFinal = columnIndex(HEADER, 'Figures final')
    const iBoard = columnIndex(HEADER, 'Board shows it')
    const iLate = columnIndex(HEADER, 'Late captures fold in')
    const finished = cells(srcLine(36194))

    // The token appears in a column that is not about status.
    expect(finished[iFinal]).toBe('Allowed — figures are final')
    // And on that very row the other columns deny.
    expect(finished[iBoard]!.startsWith('Read-only')).toBe(true)
    expect(finished[iLate]!.startsWith('Explicitly prohibited')).toBe(true)
    // The two non-final rows carry no `Allowed` in that column at all.
    expect(cells(srcLine(36192))[iFinal]).toBe('Not applicable — not final')
    expect(cells(srcLine(36193))[iFinal]).toBe('Not applicable — not final')

    dataRows(36191).forEach((row, n) => {
      expect(CC_RUN_STATE_PERMISSIONS[n]!.figuresFinal).toBe(
        row.cells[iFinal]!.startsWith('Allowed'),
      )
    })
  })

  // FAILS IF: the lifecycle collapses the three meanings, or drops the
  // diagram's pre-state, or promotes it to a fourth meaning of "done".
  // L36142 says three; L36170 carries `InProgress` and it is not one of them.
  // PLANTED: set `isCompletionState: true` on the `in-progress` position.
  // RED: expected [ { id: 'in-progress', …(3) }, …(3) ] to have a length of 3 but got 4
  it('holds three completion states and one pre-state (L36142, L36170)', () => {
    expect(srcLine(36142)).toContain('three distinct meanings')
    expect(srcLine(36170)).toContain('Run executing, assignments open')
    expect(CC_RUN_LIFECYCLE.filter((p) => p.isCompletionState)).toHaveLength(3)
    expect(CC_RUN_LIFECYCLE.filter((p) => p.isCompletionState).map((p) => p.id)).toEqual([
      ...CC_RUN_STATES,
    ])
    expect(CC_RUN_LIFECYCLE.find((p) => p.id === 'in-progress')!.isCompletionState).toBe(false)
  })

  // FAILS IF: a second transition claims to be automatic. L36148 — "The
  // finish is the one automatic transition on the platform" — and `AC-CC-152`
  // (L36202) says the same. TWO edges enter `finished` and both are the
  // scheduler's, so a count of one would be WRONG; the check is that every
  // automatic edge ends at `finished` and no edge ending elsewhere is one.
  // PLANTED: set `automatic: true` on the manual-close edge.
  // RED: expected true to be false // Object.is equality
  it('makes finish the only automatic transition (AC-CC-152, L36202)', () => {
    expect(srcLine(36148)).toContain('The finish is the one automatic transition on the platform')
    expect(srcLine(36202)).toContain('the only automatic state transition')
    for (const t of CC_RUN_TRANSITIONS) {
      expect(t.automatic).toBe(t.to === 'finished')
    }
    expect(CC_RUN_TRANSITIONS.filter((t) => t.automatic)).toHaveLength(2)
    expect(CC_RECORD_FINISH_DEFAULT_HOURS).toBe(48)
    expect(srcLine(36148)).toContain(`platform default of ${CC_RECORD_FINISH_DEFAULT_HOURS} hours`)
  })

  // FAILS IF: this file settles manual close. The boundary must name the edge
  // and NOTHING about which state a manually closed run stands in — that is
  // `DEC-STUCK-001`, and L36182 stating one reading as flat fact is exactly
  // the trap. Asserted structurally: there is no transition whose cause names
  // a manual close and whose target is `complete`, and no field anywhere in
  // the boundary record asserts a resting state.
  // PLANTED: added a `{ from: 'submitted', to: 'complete', cause: 'manual
  //   close by a Supervisor with a mandatory note' }` transition, by rewriting
  //   the cause of the existing submitted→complete edge.
  // RED: expected [ { from: 'in-progress', …(4) }, …(1) ] to have a length of 1 but got 2
  it('names the manual-close boundary and settles nothing behind it', () => {
    expect(srcLine(36152)).toContain('deliberately not one of the ten operational actions')
    expect(srcLine(36203)).toContain('not offered as one of the ten operational actions')
    const manual = CC_RUN_TRANSITIONS.filter((t) => t.cause.includes('manual close'))
    expect(manual).toHaveLength(1)
    // The one edge the DIAGRAM draws, and only that one. L36178.
    expect(manual[0]!.from).toBe('in-progress')
    expect(manual[0]!.to).toBe('submitted')
    expect(manual[0]!.cause).toBe(unticked(srcLine(36178).split(' : ')[1]!.trim()))
    expect(CC_MANUAL_CLOSE_BOUNDARY.ownedBy).toContain('DEC-STUCK-001')
    expect(CC_MANUAL_CLOSE_BOUNDARY.definedHere).toContain('No affordance')
  })
})

describe('the decisions this section raises', () => {
  // FAILS IF: `DEC-REFRESH-001` is lifted into the shared canon and this
  // stand-in stays. Reads the union out of the FILE rather than importing a
  // list, so the moment a later task adds it this suite goes red and forces
  // the switch.
  // PLANTED: added `| 'DEC-REFRESH-001'` to the `DecisionId` union in
  //   `src/disclosure/decisions.ts`, a file this task does not own, restored
  //   byte-identically immediately after and verified by sha256.
  // RED: expected true to be false
  it('asserts DEC-REFRESH-001 is still ABSENT from the shared canon', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const union = canon.slice(canon.indexOf('export type DecisionId'))
    const members = union.slice(0, union.indexOf('\n\n'))
    for (const d of CC_LIVE_DISCLOSURES) {
      expect(members.includes(`'${d.decisionRef}'`)).toBe(false)
      expect(d.canonNote).toContain('twenty-nine members')
    }
    // And the note's own count is true of the canon rather than remembered.
    expect(members.match(/\|\s*'/g)).toHaveLength(29)
  })

  // FAILS IF: a reading gains a field in which a winner could be marked. The
  // canon's `DecisionReading` has exactly two, deliberately, and the type is
  // IMPORTED — but an object literal may carry extra properties through a
  // `satisfies` on the containing array, so the shape is asserted at runtime.
  // PLANTED: added `preferred: true` to reading A.
  // RED: expected [ 'locator', 'preferred', 'text' ] to deeply equal [ 'locator', 'text' ]
  it('gives each reading exactly two fields and no place to pick one', () => {
    for (const d of CC_LIVE_DISCLOSURES) {
      expect(d.readings.length).toBeGreaterThanOrEqual(2)
      for (const r of d.readings) {
        expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
        expect(r.locator).toMatch(/L\d+/)
      }
    }
  })

  // FAILS IF: the disclosure drifts from the line that raises it, or the line
  // is read truncated. L35839 carries the WHOLE decision on one line — the
  // contradiction, both readings, three options, the recommendation, the
  // trade-offs and the owner — and it runs past two thousand characters. The
  // length is asserted so a future reader knows a `cut` read of it is a
  // partial read.
  // PLANTED: replaced reading B's text with reading A's.
  // RED: expected 1 to be 2 // Object.is equality
  it('carries both readings of DEC-REFRESH-001 off L35839, choosing neither', () => {
    const l = srcLine(35839)
    expect(l.length).toBeGreaterThan(2000)
    expect(l).toContain('DEC-REFRESH-001')
    expect(l).toContain('Client Decision Required')
    expect(l).toContain('Both readings preserved')
    expect(l).toContain('limit on how strict a tenant may be')
    // The source's own reading markers, both of them.
    expect(l).toContain('reading A')
    expect(l).toContain('reading B')

    const [d] = CC_LIVE_DISCLOSURES
    expect(d!.decisionRef).toBe('DEC-REFRESH-001')
    expect(d!.readings).toHaveLength(2)
    expect(new Set(d!.readings.map((r) => r.text)).size).toBe(2)
    // Neither is adopted, and the adopted text says so in the first word.
    expect(d!.adopted.startsWith('Neither')).toBe(true)
    // The three options are carried, in the source's own order.
    expect(d!.options).toHaveLength(3)
    for (const o of d!.options) expect(l).toContain(o.slice(0, 20).replace(/^\(.\) /, ''))
    // The unstated validation is carried as unstated, not filled in.
    expect(l).toContain('without saying who performs the validation')
    expect(d!.unstated.length).toBeGreaterThanOrEqual(3)
  })

  // FAILS IF: the platform-floor / per-tenant-floor difference is dropped, or
  // the counts drift. Both wordings are counted off the WHOLE source, so the
  // claim on the record is measured rather than remembered.
  // PLANTED: deleted the fourth `unstated` entry.
  // RED: expected 'Who performs the scale validation. By…' to contain 'per-tenant floor'
  it('carries the floor qualifier difference against the numbers canon', () => {
    const whole = LINES.join('\n')
    const platform = whole.split('platform floor of 30 seconds').length - 1
    const perTenant = whole.split('per-tenant floor of 30 seconds').length - 1
    expect(platform).toBe(3)
    expect(perTenant).toBe(13)
    // §21.3 is where the first wording lives; L12899 is the register row.
    expect(srcLine(35830)).toContain('platform floor of 30 seconds')
    expect(srcLine(35837)).toContain('platform floor of 30 seconds')
    expect(srcLine(12899)).toContain('Per-tenant floor 30 seconds')

    const note = CC_LIVE_DISCLOSURES[0]!.unstated.join(' ')
    expect(note).toContain('per-tenant floor')
    expect(note).toContain('L12899')
    expect(note).toContain(`${platform} occurrences`)
  })

  // FAILS IF: `DEC-FINISH-001` is respelled here, or its named holder stops
  // holding it. Both halves matter: the second is what makes the first safe.
  // Pointing `heldBy` at THIS file would pass the first half alone, because
  // this file names the identifier — the same plant that beat MOD-CC-02's
  // gate, so the holder is required to be a different file AND to contain it.
  // PLANTED: set `heldBy` to ['src/surfaces/cc/live/model.ts'].
  // RED: expected 'src/surfaces/cc/live/model.ts' not to contain 'cc/live'
  it('points DEC-FINISH-001 at its holder rather than respelling it (L36150)', () => {
    expect(srcLine(36150)).toContain('DEC-FINISH-001')
    expect(srcLine(36150)).toContain('Both readings are preserved')
    const refs = CC_LIVE_DISCLOSURES.map((d) => d.decisionRef as string)
    for (const held of CC_LIVE_DECISIONS_HELD_ELSEWHERE) {
      expect(refs).not.toContain(held.decisionRef)
      expect(held.heldBy.length).toBeGreaterThan(0)
      for (const file of held.heldBy) {
        expect(file).not.toContain('cc/live')
        expect(readFileSync(join(process.cwd(), file), 'utf8')).toContain(held.decisionRef)
      }
    }
    expect(CC_LIVE_DECISIONS_HELD_ELSEWHERE.map((h) => h.decisionRef)).toContain('DEC-FINISH-001')
  })
})

describe('the client boundary', () => {
  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (isForeignProbe(entry)) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full, out)
      else out.push(full)
    }
    return out
  }

  // FAILS IF: a `'use client'` file in this directory exports a plain data
  // object. Four Run Player panels shipped an undefined module id in slice 7
  // that way, invisible to every component test, because a component suite
  // mounts the component and the client boundary only exists in a build.
  //
  // TWO GUARDS, AND BOTH WERE PLANTED. The model carries no `'use client'`,
  // and the component exports only a function and a type.
  // PLANTED (a): added `'use client'` to the top of `model.ts`.
  // RED: expected [ …(2) ] to deeply equal [ Array(1) ]
  // PLANTED (b): added `export const CC_LIVE_MARKER_DEFAULTS = { … }` to
  //   `FreshnessMarker.tsx`.
  // RED: expected [ Array(1) ] to be null
  // PLANTED (a+b): both at once — red on (a) first, so (b) was re-run alone.
  it('keeps every table on the server side of the boundary', () => {
    const files = walk(join(process.cwd(), 'src/surfaces/cc/live')).map((f) =>
      f.slice(process.cwd().length + 1),
    )
    expect(files.length).toBeGreaterThan(0)

    const clientFiles = files.filter((f) =>
      /^'use client'/m.test(readFileSync(join(process.cwd(), f), 'utf8')),
    )
    expect(clientFiles).toEqual(['src/surfaces/cc/live/LiveFreshnessMarker.tsx'])

    for (const f of clientFiles) {
      const src = readFileSync(join(process.cwd(), f), 'utf8')
      // `export const X = {`, `= [` — a plain data object or array. A client
      // module's exports become client references in a build, so a server
      // component reading one gets `undefined` and every unit test still
      // passes.
      expect(src.match(/^export const \w+[^=]*= *[[{]/m)).toBeNull()
      expect(src.match(/^export (default )?function \w+/m)).not.toBeNull()
    }
  })

  // FAILS IF: this model quietly starts depending on a module's file. The
  // surface's live model is what thirteen modules state their behaviour
  // AGAINST; a dependency the other way makes the spine unbuildable without
  // whichever module happens to exist.
  // PLANTED: added `import { cc02PendingText } from
  //   '@/surfaces/cc/modules/cc-02/chrome'` to `model.ts` and used it.
  // RED: expected [ '@/surfaces/cc/modules/cc-02/chrome', …(2) ] not to contain
  //      '@/surfaces/cc/modules/cc-02/chrome'
  //
  // THE FIRST FORM OF THIS GATE READ THE WHOLE FILE and went red on its own
  // COMMENTS, which name `src/surfaces/cc/modules/cc-02/chrome.ts` three times
  // to explain what is deliberately NOT imported. A gate that cannot tell a
  // dependency from a citation would have forced those explanations out of the
  // file. Specifiers only.
  it('depends on no Command Center module', () => {
    const specifiers: string[] = []
    for (const f of walk(join(process.cwd(), 'src/surfaces/cc/live'))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/^\s*(?:import|export)[^'"\n]*from\s+['"]([^'"]+)['"]/gm)) {
        specifiers.push(m[1]!)
      }
    }
    // The spine itself IS imported, and that is the direction that is fine.
    expect(specifiers).toContain('@/surfaces/cc/modules')
    for (const s of specifiers) expect(s).not.toMatch(/cc\/modules\//)
  })

  // FAILS IF: this directory exports a component name `MOD-CC-02`'s chrome
  // already exports. It exports `FreshnessMarker` and `FreshnessMarkerProps`
  // for §21.5's card states; this directory renders §21.3.2's marker, which is
  // a different component with a genuine claim to the same name. Two of them
  // in one build is how a sibling task imports the wrong one and every test
  // still passes.
  // PLANTED: renamed `LiveFreshnessMarker` back to `FreshnessMarker` in
  //   `src/surfaces/cc/live/LiveFreshnessMarker.tsx`.
  // RED: expected [ 'FreshnessMarkerProps', …(5) ] to not include 'FreshnessMarker'
  it('collides with no component name MOD-CC-02 already exports', () => {
    const theirs = [
      ...readFileSync(
        join(process.cwd(), 'src/surfaces/cc/modules/cc-02/SyncStateChrome.tsx'),
        'utf8',
      ).matchAll(/^export (?:function|interface|const) (\w+)/gm),
    ].map((m) => m[1]!)
    expect(theirs).toContain('FreshnessMarker')

    const mine = walk(join(process.cwd(), 'src/surfaces/cc/live')).flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/^export (?:function|interface|const) (\w+)/gm)].map(
        (m) => m[1]!,
      ),
    )
    expect(mine.length).toBeGreaterThan(0)
    for (const name of mine) expect(theirs).not.toContain(name)
  })
})
