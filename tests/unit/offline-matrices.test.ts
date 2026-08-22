import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import type { SurfaceId } from '@/domain/surfaces'
import { PERMISSION_OUTCOMES, type PermissionOutcome } from '@/policy/decision'
import { COMMAND_CLASS_PHASE, STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS } from '@/frontline/commands'
import {
  HUB_REACHABILITY_TENSION,
  OFF_STATE_CONTRACT,
  STATE_CONTRACT_COLUMNS,
} from '@/offline/state-contract'
import {
  EVENT_MATRIX_COLUMNS,
  OFF_EVENT_MATRIX,
  offEventDrainPhase,
  type OffEventRow,
} from '@/offline/event-matrix'

/** As in `offline-capability.test.ts`: the frozen source, never a registry. */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''
const cellsOf = (n: number): readonly string[] =>
  sourceLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

/**
 * A markdown separator row splits into non-empty cells, so a shape check that
 * only counts cells is satisfied by `|---|---|`. Slice 7 shipped one of those.
 * This matches the separator EXACTLY, and the data checks below assert the
 * data rows are not separators by comparing their contents.
 */
const separator = (columns: number): RegExp => new RegExp(`^\\|(?:---\\|){${columns}}$`)

/* ── the per-surface state contract ─────────────────────────────────────── */

const SC_HEADER = 78198
const SC_FIRST = 78200
const SC_LAST = 78215

/**
 * THE TEST'S OWN SECOND OPINION on which column is which surface, written
 * here as a literal rather than read from the module under test. Comparing
 * the module's map to itself would be the `toEqual([...MY_CONSTANT])`
 * tautology this build has already shipped once.
 */
const SC_COLUMN_TO_SURFACE: readonly (readonly [string, SurfaceId])[] = [
  ['Delivery Operations Hub', 'SURF-DOH'],
  ['Standards and Operations Studio', 'SURF-STU'],
  ['Client Command Center', 'SURF-CC'],
  ['Frontline Worker Application', 'SURF-FL'],
  ['Super Admin platform console', 'SURF-SA'],
]

describe('the per-surface state contract, against the frozen source', () => {
  // FAILS IF: the table is not where this build says it is, or is not the
  // shape it says. The header, the separator, the sixteen data rows and the
  // first line PAST the table are all asserted, so a row added or dropped at
  // either end is caught rather than absorbed.
  //
  // Planted: the `Recovery` row's attribute rewritten to `Reconciliation` in
  // `state-contract.ts`, so sixteen rows carry fifteen distinct attributes.
  // Red here on "expected 15 to be 16", and red in the verbatim sweep.
  // Restored byte-identically.
  it('is a six-column table with sixteen data rows and a real separator', () => {
    expect(cellsOf(SC_HEADER)).toEqual([
      'Attribute',
      ...SC_COLUMN_TO_SURFACE.map(([heading]) => heading),
    ])
    expect(sourceLine(SC_HEADER + 1)).toMatch(separator(6))
    expect(sourceLine(SC_LAST + 1).startsWith('|')).toBe(false)
    expect(SC_LAST - SC_FIRST + 1).toBe(16)
    expect(OFF_STATE_CONTRACT).toHaveLength(16)
    expect(new Set(OFF_STATE_CONTRACT.map((r) => r.attribute)).size).toBe(16)
  })

  // FAILS IF: the heading-to-surface mapping drifts, in either direction. The
  // expected pairs are this file's own literal, so the module cannot satisfy
  // this by agreeing with itself.
  //
  // Planted: `STATE_CONTRACT_COLUMNS['SURF-CC']` shortened to `Command
  // Center`. Red on "SURF-CC: expected 'Command Center' to be 'Client Command
  // Center'". Restored byte-identically.
  it('keys the five columns onto the five surfaces, the source order', () => {
    expect(Object.entries(STATE_CONTRACT_COLUMNS)).toHaveLength(5)
    for (const [heading, surface] of SC_COLUMN_TO_SURFACE) {
      expect(STATE_CONTRACT_COLUMNS[surface], surface).toBe(heading)
    }
    // and the source really lists them in that order at the header line
    expect(cellsOf(SC_HEADER).slice(1)).toEqual(SC_COLUMN_TO_SURFACE.map(([h]) => h))
  })

  // FAILS IF: any of the eighty surface cells is not the source's, or is
  // filed under the wrong surface. The cell is fetched by the HEADING's index
  // in the source's own header row, never by the position it happens to sit
  // at in the shipped array — which is what makes a swapped pair of columns
  // red rather than silently inverted.
  //
  // Planted: the `Knows` row's `SURF-CC` and `SURF-FL` cells swapped in
  // `state-contract.ts` — the exact shape a positional transcription
  // produces. Red naming "L78200 Client Command Center: expected 'Own device
  // state in full' to be 'Server knowledge with age'". Restored
  // byte-identically.
  it('carries every cell verbatim, fetched by column heading', () => {
    const headings = cellsOf(SC_HEADER)
    for (let n = SC_FIRST; n <= SC_LAST; n += 1) {
      const found = cellsOf(n)
      expect(found, `L${n} cell count`).toHaveLength(6)
      const row = OFF_STATE_CONTRACT[n - SC_FIRST]
      expect(row, `no shipped row for L${n}`).toBeDefined()
      if (row === undefined) continue
      expect(row.sourceRef, `L${n} sourceRef`).toBe(`L${n}`)
      expect(row.attribute, `L${n} Attribute`).toBe(found[0])
      for (const [heading, surface] of SC_COLUMN_TO_SURFACE) {
        const at = headings.indexOf(heading)
        expect(at, `heading ${heading} missing from L${SC_HEADER}`).toBeGreaterThan(0)
        const cell = found[at]
        expect(cell, `L${n} ${heading} is blank`).toBeTruthy()
        expect(cell, `L${n} ${heading} is a separator`).not.toMatch(/^-+$/)
        expect(row.cells[surface], `L${n} ${heading}`).toBe(cell)
      }
    }
  })

  // FAILS IF: the two disagreeing cells stop being carried verbatim, or one
  // of them is chosen over the other, or the criterion that decides which is
  // load-bearing is dropped. Both `AC-OFF-205` and `TEST-OFF-204` are
  // asserted to occur at the lines cited, with no window: an identifier's
  // line is a fact stated exactly.
  //
  // Planted: the criterion's `sourceRef` moved to the row four lines above it
  // in the same acceptance table — a real, non-blank line carrying a
  // different criterion, which is what the off-by-N class actually looks
  // like. Red on "expected 'L78223' to be 'L78227'". Restored
  // byte-identically.
  it('holds both Hub readings, with the criterion, and chooses neither', () => {
    expect(HUB_REACHABILITY_TENSION.surface).toBe('SURF-DOH')
    expect(HUB_REACHABILITY_TENSION.chosen).toBeNull()

    const blocked = cellsOf(78208)
    const never = cellsOf(78215)
    const hub = cellsOf(SC_HEADER).indexOf('Delivery Operations Hub')
    expect(blocked[0]).toBe('Actions blocked')
    expect(never[0]).toBe('Must never claim prematurely')
    expect(HUB_REACHABILITY_TENSION.readingA.attribute).toBe(blocked[0])
    expect(HUB_REACHABILITY_TENSION.readingA.cell).toBe(blocked[hub])
    expect(HUB_REACHABILITY_TENSION.readingA.sourceRef).toBe('L78208')
    expect(HUB_REACHABILITY_TENSION.readingB.attribute).toBe(never[0])
    expect(HUB_REACHABILITY_TENSION.readingB.cell).toBe(never[hub])
    expect(HUB_REACHABILITY_TENSION.readingB.sourceRef).toBe('L78215')

    // The two really are different claims about the same surface: one denies
    // device reachability reaches the Hub, the other constrains what the Hub
    // may display while a device owes data.
    expect(HUB_REACHABILITY_TENSION.readingA.cell).toContain('unaffected by device reachability')
    expect(HUB_REACHABILITY_TENSION.readingB.cell).toContain('while data is owed')

    // and the acceptance block, at the exact lines, identifier and statement
    const ac = cellsOf(78227)
    expect(ac[0]).toBe('`AC-OFF-205`')
    expect(HUB_REACHABILITY_TENSION.criterion.identifier).toBe('AC-OFF-205')
    expect(HUB_REACHABILITY_TENSION.criterion.statement).toBe(ac[1])
    expect(HUB_REACHABILITY_TENSION.criterion.sourceRef).toBe('L78227')
    const test204 = cellsOf(78234)
    expect(test204[0]).toBe('`TEST-OFF-204`')
    expect(HUB_REACHABILITY_TENSION.test.identifier).toBe('TEST-OFF-204')
    expect(HUB_REACHABILITY_TENSION.test.statement).toBe(test204[1])
    expect(HUB_REACHABILITY_TENSION.test.sourceRef).toBe('L78234')
  })
})

/* ── the five-surface event matrix ──────────────────────────────────────── */

const EM_ONE_HEADER = 78280
const EM_ONE_FIRST = 78282
const EM_ONE_LAST = 78291
const EM_TWO_HEADER = 78317
const EM_TWO_FIRST = 78319
const EM_TWO_LAST = 78328

/** This file's own second opinion, as above. The heading differs from the
 *  state contract's on the last column and that is not a typo. */
const EM_COLUMN_TO_SURFACE: readonly (readonly [string, SurfaceId])[] = [
  ['Delivery Operations Hub', 'SURF-DOH'],
  ['Standards and Operations Studio', 'SURF-STU'],
  ['Client Command Center', 'SURF-CC'],
  ['Frontline Worker Application', 'SURF-FL'],
  ['Super Admin', 'SURF-SA'],
]

/**
 * The token as the source spells it, mapped to the outcome. Written here
 * independently of the module, and matched on EXACT EQUALITY: `Allowed` is a
 * prefix of `Allowed with conditions`, and a `startsWith` here would read all
 * seven conditional cells as plain `Allowed` and stay green.
 */
const TOKEN_TO_OUTCOME = new Map<string, PermissionOutcome>([
  ['Allowed', 'allowed'],
  ['Allowed with conditions', 'allowedWithConditions'],
  ['Read-only', 'readOnly'],
  ['Cached read-only while offline', 'cachedReadOnlyOffline'],
  ['Queued while offline', 'queuedOffline'],
  ['Client Decision Required', 'clientDecisionRequired'],
])

/** The leading backticked token of a cell, or null where there is none. */
const leadingToken = (cell: string): string | null => {
  const m = /^`([^`]+)`/.exec(cell)
  return m === null ? null : (m[1] ?? null)
}

const eventRows = (): readonly { readonly line: number; readonly row: OffEventRow }[] => {
  const out: { line: number; row: OffEventRow }[] = []
  const push = (first: number, last: number, offset: number): void => {
    for (let n = first; n <= last; n += 1) {
      const row = OFF_EVENT_MATRIX[offset + (n - first)]
      if (row !== undefined) out.push({ line: n, row })
    }
  }
  push(EM_ONE_FIRST, EM_ONE_LAST, 0)
  push(EM_TWO_FIRST, EM_TWO_LAST, 10)
  return out
}

describe('the five-surface event matrix, against the frozen source', () => {
  // FAILS IF: either block moves, changes width, gains or loses a row, or the
  // two blocks stop having identical columns — which is the only thing that
  // makes one column map legitimate for both.
  //
  // Planted: the whole `OFF-EVT-20` row deleted from `event-matrix.ts`. Red
  // here on "to have a length of 20 but got 19", and red in four other cases.
  // Restored byte-identically.
  it('is two ten-column blocks of ten rows, with identical headings', () => {
    const one = cellsOf(EM_ONE_HEADER)
    const two = cellsOf(EM_TWO_HEADER)
    expect(one).toHaveLength(10)
    expect(one).toEqual(two)
    expect(one).toEqual([
      'Event',
      ...EM_COLUMN_TO_SURFACE.map(([h]) => h),
      'Roles affected',
      'Worker impact',
      'Fallback',
      'Recovery',
    ])
    expect(sourceLine(EM_ONE_HEADER + 1)).toMatch(separator(10))
    expect(sourceLine(EM_TWO_HEADER + 1)).toMatch(separator(10))
    expect(sourceLine(EM_ONE_LAST + 1).startsWith('|')).toBe(false)
    expect(sourceLine(EM_TWO_LAST + 1).startsWith('|')).toBe(false)
    expect(EM_ONE_LAST - EM_ONE_FIRST + 1).toBe(10)
    expect(EM_TWO_LAST - EM_TWO_FIRST + 1).toBe(10)
    expect(OFF_EVENT_MATRIX).toHaveLength(20)
  })

  // FAILS IF: the two blocks are merged, or a row is filed under the wrong
  // one. Part one is what the device did while dark; part two is what the
  // server did while it was. They are different claims.
  //
  // Planted: `OFF-EVT-11`'s `block` flipped to `device-or-floor`, which is
  // exactly what merging the two tables would produce. Red on "to have a
  // length of 10 but got 11". Restored byte-identically.
  it('keeps the two blocks apart, ten rows each, numbered without a gap', () => {
    expect(OFF_EVENT_MATRIX.map((r) => r.identifier)).toEqual(
      Array.from({ length: 20 }, (_, i) => `OFF-EVT-${String(i + 1).padStart(2, '0')}`),
    )
    expect(OFF_EVENT_MATRIX.filter((r) => r.block === 'device-or-floor')).toHaveLength(10)
    expect(OFF_EVENT_MATRIX.filter((r) => r.block === 'server-while-offline')).toHaveLength(10)
    for (const { line, row } of eventRows()) {
      expect(row.block, `L${line}`).toBe(
        line <= EM_ONE_LAST ? 'device-or-floor' : 'server-while-offline',
      )
    }
  })

  // FAILS IF: the map is not total over the five, or a heading drifts. The
  // expected pairs are this file's literal, so the module cannot pass by
  // agreeing with itself.
  //
  // Planted: `EVENT_MATRIX_COLUMNS['SURF-SA']` "corrected" to the state
  // contract's heading, `Super Admin platform console` — the tidy-up that
  // looks right and is not this table's heading. Red on "SURF-SA: expected
  // 'Super Admin platform console' to be 'Super Admin'". Restored
  // byte-identically.
  it('keys the five columns onto the five surfaces, the source order', () => {
    expect(Object.entries(EVENT_MATRIX_COLUMNS)).toHaveLength(5)
    for (const [heading, surface] of EM_COLUMN_TO_SURFACE) {
      expect(EVENT_MATRIX_COLUMNS[surface], surface).toBe(heading)
    }
    expect(cellsOf(EM_ONE_HEADER).slice(1, 6)).toEqual(EM_COLUMN_TO_SURFACE.map(([h]) => h))
  })

  // FAILS IF: any of the hundred surface cells, or any of the four remaining
  // columns, is not the source's, or is filed under the wrong surface. Cells
  // are fetched by the HEADING's index in the source's own header row.
  //
  // Planted: `OFF-EVT-11`'s `SURF-DOH` text replaced with its own `SURF-CC`
  // text — both open `Allowed`, so the outcome check alone cannot see it.
  // Red naming "L78319 Delivery Operations Hub". Restored byte-identically.
  it('carries every cell verbatim, fetched by column heading', () => {
    const headings = cellsOf(EM_ONE_HEADER)
    for (const { line, row } of eventRows()) {
      const found = cellsOf(line)
      expect(found, `L${line} cell count`).toHaveLength(10)
      expect(row.sourceRef, `L${line} sourceRef`).toBe(`L${line}`)
      expect(found[0], `L${line} Event`).toBe(`\`${row.identifier}\` ${row.event}`)
      for (const [heading, surface] of EM_COLUMN_TO_SURFACE) {
        const at = headings.indexOf(heading)
        expect(at, `heading ${heading} missing`).toBeGreaterThan(0)
        const cell = found[at]
        expect(cell, `L${line} ${heading} is blank`).toBeTruthy()
        expect(row.cells[surface].text, `L${line} ${heading}`).toBe(cell)
      }
      expect(row.rolesAffected, `L${line} Roles affected`).toBe(found[headings.indexOf('Roles affected')])
      expect(row.workerImpact, `L${line} Worker impact`).toBe(found[headings.indexOf('Worker impact')])
      expect(row.fallback, `L${line} Fallback`).toBe(found[headings.indexOf('Fallback')])
      expect(row.recovery, `L${line} Recovery`).toBe(found[headings.indexOf('Recovery')])
    }
  })

  // FAILS IF: a cell is typed as an outcome the source does not spell, or a
  // conditional cell is flattened onto plain `Allowed`. The token is read off
  // the source and matched on exact equality in both directions.
  //
  // Planted: `OFF-EVT-05`'s `SURF-CC` outcome changed from
  // `allowedWithConditions` to `allowed`, leaving its text untouched — the
  // exact shape a prefix match cannot see. Red naming "L78286 Client Command
  // Center outcome: expected 'allowed' to be 'allowedWithConditions'", and
  // red in the census below. Restored byte-identically.
  it('types every cell from its own token, never from a prefix', () => {
    const headings = cellsOf(EM_ONE_HEADER)
    let conditionals = 0
    for (const { line, row } of eventRows()) {
      const found = cellsOf(line)
      for (const [heading, surface] of EM_COLUMN_TO_SURFACE) {
        const cell = found[headings.indexOf(heading)] ?? ''
        const token = leadingToken(cell)
        expect(token, `L${line} ${heading} has no backticked token`).not.toBeNull()
        if (token === null) continue
        const na = /^Not applicable — (.+)$/.exec(token)
        const expected = na === null ? TOKEN_TO_OUTCOME.get(token) : 'notApplicable'
        expect(expected, `L${line} ${heading} token ${token} is not one of the nine`).toBeDefined()
        expect(row.cells[surface].outcome, `L${line} ${heading} outcome`).toBe(expected)
        if (token === 'Allowed with conditions') conditionals += 1
        if (na !== null) {
          const cellValue = row.cells[surface]
          expect(cellValue.outcome).toBe('notApplicable')
          if (cellValue.outcome !== 'notApplicable') continue
          expect(cellValue.notApplicableReason, `L${line} ${heading} reason`).toBe(na[1])
          expect(cellValue.notApplicableReason.length, `L${line} ${heading} reason`).toBeGreaterThan(0)
        } else {
          expect(row.cells[surface].notApplicableReason, `L${line} ${heading}`).toBeUndefined()
        }
      }
    }
    // The prefix trap, stated as a number: seven cells say `Allowed with
    // conditions` and none of them is allowed to read back as `allowed`.
    expect(conditionals).toBe(7)
  })

  // FAILS IF: a tenth token is minted, or the two outcomes the matrix never
  // uses quietly acquire a cell. These are measured counts over the hundred
  // surface cells, not a target.
  //
  // Planted: `OFF-EVT-01`'s `SURF-SA` outcome changed to `unavailable`, an
  // outcome the matrix uses nowhere. Red on "L78282 Super Admin outcome" in
  // the check above and on the counts here. Restored byte-identically.
  it('uses seven of the nine outcomes, in the counts the source gives', () => {
    const tally = new Map<PermissionOutcome, number>()
    for (const row of OFF_EVENT_MATRIX) {
      for (const [, surface] of EM_COLUMN_TO_SURFACE) {
        const o = row.cells[surface].outcome
        expect(PERMISSION_OUTCOMES, `${row.identifier} ${surface}`).toContain(o)
        tally.set(o, (tally.get(o) ?? 0) + 1)
      }
    }
    expect([...tally.values()].reduce((a, b) => a + b, 0)).toBe(100)
    expect(tally.get('readOnly')).toBe(32)
    expect(tally.get('allowed')).toBe(25)
    expect(tally.get('notApplicable')).toBe(19)
    expect(tally.get('queuedOffline')).toBe(9)
    expect(tally.get('allowedWithConditions')).toBe(7)
    expect(tally.get('cachedReadOnlyOffline')).toBe(6)
    expect(tally.get('clientDecisionRequired')).toBe(2)
    expect(tally.get('unavailable')).toBeUndefined()
    expect(tally.get('explicitlyProhibited')).toBeUndefined()
    expect(tally.size).toBe(7)
    // and the nineteen `Not applicable` cells carry ten distinct reasons
    const reasons = new Set<string>()
    for (const row of OFF_EVENT_MATRIX) {
      for (const [, surface] of EM_COLUMN_TO_SURFACE) {
        const cell = row.cells[surface]
        if (cell.outcome === 'notApplicable') reasons.add(cell.notApplicableReason)
      }
    }
    expect(reasons.size).toBe(10)
  })

  // FAILS IF: a worker finishing offline is recorded as standing the run
  // `submitted` on the server. Offline the two come apart, and this row is
  // where the matrix says so; the run-record states are asserted against
  // their own line rather than against this build's paraphrase of them.
  //
  // Planted: `OFF-EVT-04`'s `SURF-DOH` text edited to drop "cannot yet", so
  // it reads as the run standing `submitted` on the server. Red twice — here
  // and in the verbatim sweep. Restored byte-identically.
  it('keeps worker-finished apart from submitted on OFF-EVT-04', () => {
    const row = OFF_EVENT_MATRIX.find((r) => r.identifier === 'OFF-EVT-04')
    expect(row).toBeDefined()
    if (row === undefined) return
    expect(row.event).toBe('Worker finishes their part of the run offline')
    expect(row.cells['SURF-FL'].text).toContain('worker-finished recorded locally')
    expect(row.cells['SURF-DOH'].text).toContain('cannot yet stand `submitted` on the server')
    expect(row.cells['SURF-DOH'].outcome).toBe('readOnly')
    expect(row.recovery).toContain('`complete` only when every assigned device has synced')
    // The three run-record states are the run record's, not the player's, and
    // the source says so on its own line.
    expect(sourceLine(40545)).toContain(
      'The platform states `submitted`, `complete`, and `finished` are run-record states, not player states',
    )
  })
})

/* ── the joint half: the command channel ────────────────────────────────── */

describe('what the twenty events do to the command channel', () => {
  // FAILS IF: an event is bound to a class the source does not put on it, or
  // the counts drift. Twelve events carry no command at all and each says
  // why, so "no command" is a rendering rather than an empty field.
  //
  // Planted: `OFF-EVT-11` rebound from `CMD-FL-LOTREL` to `CMD-FL-VERSION`.
  // Red on "expected 'CMD-FL-VERSION' to be 'CMD-FL-LOTREL'". Restored
  // byte-identically.
  it('binds eight events to the channel and gives twelve a stated reason', () => {
    const byKind = (k: string): readonly OffEventRow[] =>
      OFF_EVENT_MATRIX.filter((r) => r.commandBinding.kind === k)
    expect(byKind('class')).toHaveLength(7)
    expect(byKind('stop-class-without-a-command-class')).toHaveLength(1)
    expect(byKind('none')).toHaveLength(12)
    for (const row of OFF_EVENT_MATRIX) {
      expect(row.commandBinding.why.length, row.identifier).toBeGreaterThan(30)
    }
    const bound = new Map(
      OFF_EVENT_MATRIX.flatMap((r) =>
        r.commandBinding.kind === 'class' ? [[r.identifier, r.commandBinding.commandClass]] : [],
      ),
    )
    expect(bound.get('OFF-EVT-11')).toBe('CMD-FL-LOTREL')
    expect(bound.get('OFF-EVT-12')).toBe('CMD-FL-CLEAR')
    expect(bound.get('OFF-EVT-13')).toBe('CMD-FL-REASSIGN')
    expect(bound.get('OFF-EVT-14')).toBe('CMD-FL-VERSION')
    expect(bound.get('OFF-EVT-15')).toBe('CMD-FL-VERSION')
    expect(bound.get('OFF-EVT-17')).toBe('CMD-FL-SUSPEND')
    expect(bound.get('OFF-EVT-18')).toBe('CMD-FL-SUSPEND')
    // all five classes appear, so no class is left without an event
    expect(new Set(bound.values()).size).toBe(5)
  })

  // FAILS IF: this file starts spelling the drain order itself instead of
  // reading slice 7's. The phase of every class-bound event is asserted to be
  // the one `COMMAND_CLASS_PHASE` gives, so a second spelling here would have
  // to disagree with that map to be visible at all.
  //
  // Planted: `offEventDrainPhase` changed to return `'enabling-class'` for
  // the classless arm — the remote wipe drained last instead of first. Red on
  // "expected [ 'OFF-EVT-17', 'OFF-EVT-18' ] to deeply equal [ 'OFF-EVT-17',
  // 'OFF-EVT-18', …(1) ]". Restored byte-identically.
  it('takes every drain phase from DEC-SYNC-001 rather than restating it', () => {
    const stop: string[] = []
    const enabling: string[] = []
    for (const row of OFF_EVENT_MATRIX) {
      const phase = offEventDrainPhase(row)
      if (row.commandBinding.kind === 'none') {
        expect(phase, row.identifier).toBeNull()
        continue
      }
      if (row.commandBinding.kind === 'class') {
        expect(phase, row.identifier).toBe(COMMAND_CLASS_PHASE[row.commandBinding.commandClass])
      }
      if (phase === 'stop-class') stop.push(row.identifier)
      if (phase === 'enabling-class') enabling.push(row.identifier)
    }
    expect(stop).toEqual(['OFF-EVT-17', 'OFF-EVT-18', 'OFF-EVT-19'])
    expect(enabling).toEqual([
      'OFF-EVT-11',
      'OFF-EVT-12',
      'OFF-EVT-13',
      'OFF-EVT-14',
      'OFF-EVT-15',
    ])
    // capture-upload is a phase of the drain, never a phase a command class
    // sits in, so no event may claim it.
    expect(OFF_EVENT_MATRIX.map(offEventDrainPhase)).not.toContain('capture-upload')
  })

  // FAILS IF: `OFF-EVT-19` is closed by minting a sixth class, or its items
  // stop matching the two slice 7 recorded. The remote wipe and the
  // de-authorisation are named in the stop class and carried by none of the
  // five, which is `DEC-CMDCLASS-001` and is recorded, not resolved.
  //
  // Planted: the row's `items` reduced to the wipe alone, dropping
  // de-authorisation. Red on "expected [ 'Remote data wipe' ] to deeply equal
  // [ 'Device de-authorisation', …(1) ]". Restored byte-identically.
  it('leaves OFF-EVT-19 with no command class, naming both stop-class items', () => {
    const row = OFF_EVENT_MATRIX.find((r) => r.identifier === 'OFF-EVT-19')
    expect(row).toBeDefined()
    if (row === undefined) return
    expect(row.event).toBe('Remote wipe or de-authorisation issued')
    expect(row.commandBinding.kind).toBe('stop-class-without-a-command-class')
    if (row.commandBinding.kind !== 'stop-class-without-a-command-class') return
    const recorded = STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS.map((i) => i.item)
    expect([...row.commandBinding.items].sort()).toEqual([...recorded].sort())
    expect(row.commandBinding.items).toHaveLength(2)
    for (const item of STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS) {
      expect(item.openDecision).toBe('DEC-CMDCLASS-001')
    }
    // The device cell is `Queued while offline` and the source states plainly
    // that nothing is erased while the device is dark.
    expect(row.cells['SURF-FL'].outcome).toBe('queuedOffline')
    expect(row.cells['SURF-FL'].text).toContain('no erasure can occur')
  })
})
