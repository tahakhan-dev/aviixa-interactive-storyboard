import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC_WRITES_OUTSIDE_THE_TEN } from '@/surfaces/cc/actions/outside-writes'
import { CC_LINK_OUT_CELLS } from '@/surfaces/cc/decisions/link-outs'
import { CC_DECISION_REGISTER } from '@/surfaces/cc/decisions/register'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC11_COLUMNS,
  CC11_LINK_OUT_CELLS,
  CC11_MATRIX,
  CC11_MODULE,
  CC11_SCREEN,
  CC11_SLUG,
  CC11_SURFACE_MATRIX_SELF_DIVERGENCE,
  CC11_TENANT_ADMIN_DIVERGENCES,
  CC11_TENANT_ADMIN_RESTRICTION,
  CC11_TOKENS,
  cc11Cell,
  cc11Row,
} from '@/surfaces/cc/modules/cc-11/matrix'
import {
  CC11_CONFIRMED_IDENTITIES,
  CC11_DATA_SETS,
  CC11_BOTH_SETS_DIVERGE,
  CC11_DATA_SET_COUNT,
  CC11_DEC_REPORT_CARDS,
  CC11_IDENTITY_GAP_STATEMENT,
  CC11_OPEN_IDENTITY,
  CC11_REGISTER_ROW,
  DEC_REPORT_001,
  DEC_RPTBLD_001,
} from '@/surfaces/cc/modules/cc-11/report-sets'

/**
 * `MOD-CC-11` — §21.14, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * "Nine rows" is obtained by walking the source's own table from its
 * separator to the first line that is not a table row, never from
 * `CC11_MATRIX.length` and never by subtracting the ends of a span written in
 * a dispatch — the dispatch's span for this card ends on a blank line.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — the
 * defect planted into the real shipping file, the red observed, then reversed
 * and verified byte-identical against a baseline captured BEFORE the first
 * plant. Each `PLANTED` note names the defect that was actually planted.
 * Where two guards cover the same defect, the removal of EACH and of BOTH was
 * planted, because redundant protections cannot be verified one at a time.
 *
 * FOUR BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE WERE LIVE RISKS HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and three of the
 *    nine rows put both in the same row. Every comparison is an anchored
 *    equality on the cell head, never `startsWith` and never `includes`.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR. Every walk
 *    starts AFTER the separator and excludes it by position.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Two columns of this matrix
 *    read `Explicitly prohibited` on all nine rows, so a count of prohibitions
 *    is true however those two are permuted. Every cell gate names its ROW
 *    and its COLUMN, resolved from the source's own header BY NAME.
 *  - A `page.includes('MOD-CC-11')` CHECK SATISFIED BY A QUOTATION. The route
 *    file quotes L38793, which names seven module ids, so the check requires
 *    an occurrence on a line naming no OTHER `MOD-CC-*`.
 *
 * AND ONE SHAPE THIS MODULE ADDS: A CLAIM OF "THREE DIVERGENCES" IS TRUE OF
 * ANY THREE. The completeness gate re-derives every non-prohibited Tenant
 * Admin cell in every chapter-21 module matrix and compares the MODULE SET,
 * so a divergence dropped, invented, or moved to the wrong module fails.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking on identifiers; §21.14 uses none in its matrix. */
const unticked = (s: string): string => s.replaceAll('`', '')

/**
 * The source bolds words inside its own sentences — L38299 writes `explicitly
 * **not** one of the ten` — so a substring assertion spanning the bold marks
 * finds nothing while the sentence says exactly what it is asserted to say.
 */
const unbolded = (s: string): string => s.replaceAll('**', '')

/** The pipe-delimited cells of a table line, trimmed, leading/trailing empties dropped. */
function cells(line: string): string[] {
  return line
    .trim()
    .split('|')
    .slice(1, -1)
    .map((c) => unticked(c).trim())
}

/**
 * The data rows of the table whose separator is at `separatorLine`, counted
 * off the SOURCE. Starts after the separator and stops at the first line that
 * is not a table row, so the separator can never be counted as data and a span
 * written in a dispatch is never trusted for a count.
 */
function dataRows(separatorLine: number): { line: number; cells: string[] }[] {
  const out: { line: number; cells: string[] }[] = []
  for (let n = separatorLine + 1; isTableRow(srcLine(n)); n += 1) {
    out.push({ line: n, cells: cells(srcLine(n)) })
  }
  return out
}

/** The index of a column, resolved from its header BY NAME at test time. */
function columnIndex(headerLine: number, name: string): number {
  const i = cells(srcLine(headerLine)).indexOf(name)
  if (i < 0) {
    throw new Error(
      `L${headerLine} carries no column named "${name}". Its columns are: ` +
        cells(srcLine(headerLine)).join(' | '),
    )
  }
  return i
}

const MATRIX_HEADER = 38287
const MATRIX_SEPARATOR = 38288
const SURFACE_HEADER = 35002
const SURFACE_SEPARATOR = 35003
const REGISTER_SEPARATOR = 38941

describe('the matrix, counted off the source rather than off the array', () => {
  // FAILS IF: the transcription gains or loses a row, or the walk is trusted
  // to a span. The dispatch gave the card's end as a blank line three above
  // the `**Roles that see and use it, and their permissions.**` heading at
  // L38285, which is short of this table entirely.
  // PLANTED: deleted row 8 (`Create a sixth data set`) from `CC11_MATRIX`.
  // RED: expected 8 to be 9 // Object.is equality
  it('L38288 is the separator and nine data rows follow it', () => {
    const rows = dataRows(MATRIX_SEPARATOR)
    expect(rows.length).toBe(9)
    expect(rows[0]?.line).toBe(38289)
    expect(rows[rows.length - 1]?.line).toBe(38297)
    // The line after the body is blank and the one after that opens the
    // paragraph that puts authoring outside the ten.
    expect(unbolded(srcLine(38299))).toContain('is explicitly not one of the ten operational actions')
    expect(CC11_MATRIX.length).toBe(rows.length)
  })

  // FAILS IF: the header is read positionally. The five persona columns are
  // compared against the header line's own words in the header line's own
  // order — Tenant Admin first, Worker last.
  // PLANTED: reversed `CC11_COLUMNS`.
  // RED: expected [ 'Tenant Admin', 'Supervisor', …(3) ] to deeply equal
  //      [ 'Worker', 'Read-only Auditor', …(3) ]
  it('L38287 names six columns and the last five are CC11_COLUMNS in order', () => {
    const header = cells(srcLine(MATRIX_HEADER))
    expect(header.length).toBe(6)
    expect(header[0]).toBe('Capability on this module')
    expect(header.slice(1)).toEqual([...CC11_COLUMNS])
  })

  // FAILS IF: any of the forty-five cells drifts from its source cell. Each
  // is addressed by ROW LINE and by COLUMN NAME resolved from L38287 at test
  // time, so reordering the header cannot move a comparison with it.
  // PLANTED: changed row 1's Supervisor cell from
  // `Allowed with conditions — within the Supervisor's Area scope` to
  // `Allowed with conditions — within scope` (the wording rows 2 and 3 use,
  // so the defect looks exactly like two correct rows).
  // RED: L38289 · Supervisor: expected 'Allowed with conditions — within
  //      the …' to be 'Allowed with conditions — within scope'
  it('every cell equals its source cell, row by row and column by column', () => {
    for (const row of CC11_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      const source = cells(srcLine(line))
      expect(source[0], `${row.sourceRef} capability`).toBe(row.capability)
      for (const column of CC11_COLUMNS) {
        expect(source[columnIndex(MATRIX_HEADER, column)], `${row.sourceRef} · ${column}`).toBe(
          row.cells[column].text,
        )
      }
    }
  })

  // FAILS IF: a cell is classified by prefix. `Allowed` is a prefix of
  // `Allowed with conditions` and three rows carry both, so the head is split
  // on the cell's own ` — ` and compared for EXACT equality.
  // PLANTED: changed `CC11_TOKENS.find((t) => t === head)` to
  // `CC11_TOKENS.find((t) => (head ?? '').startsWith(t))` in matrix.ts.
  // RED: expected 'Allowed' to be 'Allowed with conditions'
  it('the three conditioned cells classify as Allowed with conditions, not as Allowed', () => {
    for (const ordinal of [1, 2, 3]) {
      const cell = cc11Cell(ordinal, 'Supervisor')
      expect(cell.token, `row ${ordinal} Supervisor`).toBe('Allowed with conditions')
      expect(cell.note).not.toBeNull()
      expect(cell.text.startsWith('Allowed')).toBe(true)
      expect(cell.token === 'Allowed').toBe(false)
    }
    // And every cell whose token IS `Allowed` carries no note at all.
    for (const row of CC11_MATRIX) {
      for (const column of CC11_COLUMNS) {
        const cell = row.cells[column]
        if (cell.token === 'Allowed') expect(cell.note, `${row.sourceRef} · ${column}`).toBeNull()
      }
    }
  })

  // FAILS IF: the vocabulary claim drifts. The distinct heads are counted off
  // the SOURCE's own forty-five cells, so a token added to `CC11_TOKENS` that
  // the table never uses fails, and so does a token the table uses that the
  // constant omits.
  // PLANTED: added `'Read-only'` to `CC11_TOKENS`.
  // RED: expected [ 'Allowed', …(2) ] to deeply equal [ 'Allowed', …(3) ]
  it('the source uses exactly three tokens across forty-five cells, in these counts', () => {
    const counts = new Map<string, number>()
    let total = 0
    for (const row of dataRows(MATRIX_SEPARATOR)) {
      for (const cell of row.cells.slice(1)) {
        const head = cell.split(' — ')[0] ?? ''
        counts.set(head, (counts.get(head) ?? 0) + 1)
        total += 1
      }
    }
    expect(total).toBe(45)
    expect([...counts.keys()].sort()).toEqual([...CC11_TOKENS].sort())
    expect(counts.get('Explicitly prohibited')).toBe(28)
    expect(counts.get('Allowed')).toBe(14)
    expect(counts.get('Allowed with conditions')).toBe(3)
  })

  // FAILS IF: the section's own bounds are mis-stated. The dispatch's card
  // span ends on a blank line; this asserts where the section actually opens
  // and closes without spelling that blank line's number anywhere.
  // PLANTED: changed the header comment in matrix.ts to give the section's
  // close as the matrix's last row rather than L38449.
  // RED: expected false to be true // Object.is equality
  it('§21.14 opens at L38247, closes at L38449, and the dispatch’s end line is blank', () => {
    expect(srcLine(38247)).toContain('## 21.14 Module `MOD-CC-11`')
    expect(srcLine(38253)).toContain('**Identity.**')
    expect(srcLine(38449)).toContain('**Source status.**')
    expect(srcLine(38453)).toContain('## 21.15 Module `MOD-CC-12`')
    // The heading the dispatch's end line sits immediately above, and the
    // blankness of that line asserted by arithmetic rather than by citation.
    expect(srcLine(38285)).toBe('**Roles that see and use it, and their permissions.**')
    expect(srcLine(38285 - 1).trim()).toBe('')
    const text = readFileSync(
      join(process.cwd(), 'src/surfaces/cc/modules/cc-11/matrix.ts'),
      'utf8',
    )
    expect(text.includes('L38449')).toBe(true)
  })
})

describe('the five data sets, and the identity the source does not record', () => {
  // FAILS IF: a name is invented, dropped or edited. Both Parts' lists are
  // read off the source and compared item by item.
  // PLANTED: changed set 5's `commandCenterName` to `Tier-allocation
  // consumption trend` — the Hub Part's name, which is the edit that would
  // silently resolve a divergence this build measured.
  // RED: expected 'Allocation consumption trend — the te…' to be
  //      'Tier-allocation consumption trend'
  it('§6.12.1’s numbered list is L38261-L38265 and matches, item for item', () => {
    for (const set of CC11_DATA_SETS) {
      const line = srcLine(set.commandCenterLine)
      expect(line.startsWith(`${set.ordinal}. `), `L${set.commandCenterLine}`).toBe(true)
      expect(line.slice(`${set.ordinal}. `.length)).toBe(set.commandCenterName)
    }
    expect(CC11_DATA_SETS.map((s) => s.commandCenterLine)).toEqual([
      38261, 38262, 38263, 38264, 38265,
    ])
    // The line after the list's last item is blank; the list is five items.
    expect(srcLine(38266).trim()).toBe('')
  })

  // FAILS IF: §4.10.5's table is read as anything but five rows, or a name
  // drifts. Walked from that table's own separator.
  // PLANTED: changed set 4's `hubName` to `Override frequency by role` — the
  // OTHER reading, which is the edit that erases the contradiction.
  // RED: L29887 name: expected 'Clearance (qualification-override) fr…' to
  //      be 'Override frequency by role'
  it('§4.10.5’s table carries five rows and matches, row for row', () => {
    const rows = dataRows(29883)
    expect(rows.length).toBe(5)
    for (const set of CC11_DATA_SETS) {
      const row = rows[set.ordinal - 1]
      expect(row?.line).toBe(set.hubLine)
      expect(row?.cells[0]).toBe(String(set.ordinal))
      expect(row?.cells[1], `L${set.hubLine} name`).toBe(set.hubName)
      expect(row?.cells[2], `L${set.hubLine} source`).toBe(set.hubSource)
    }
  })

  // FAILS IF: an identity is presented as confirmed, or the count of five is
  // taken from anywhere but the array. The gap sentence is built from two
  // computed counts, so it cannot claim four are settled while five are open.
  // PLANTED: set `identityConfirmed: true` on set 1.
  // RED: expected 1 to be +0 // Object.is equality
  it('all five identities are open and the rendered sentence is computed from that', () => {
    expect(CC11_DATA_SET_COUNT).toBe(5)
    expect(CC11_CONFIRMED_IDENTITIES).toBe(0)
    expect(CC11_IDENTITY_GAP_STATEMENT).toContain('names 5 standard data sets and confirms 0')
    expect(srcLine(CC11_OPEN_IDENTITY.proposedHeadingLine)).toContain('**The proposed identities**')
    const open = srcLine(CC11_OPEN_IDENTITY.openItemLine)
    expect(open).toContain(CC11_OPEN_IDENTITY.settled)
    expect(open).toContain(CC11_OPEN_IDENTITY.open)
    expect(open).toContain(CC11_OPEN_IDENTITY.swapNotGrow)
  })

  // FAILS IF: a set name is invented. The trap this module exists to avoid is
  // filling the open identity with a plausible name, and the source hands the
  // three most plausible ones straight to a reader as EXAMPLES of a permitted
  // swap. Every rendered name must occur in the source, and none of the three
  // examples may appear as a set's name in either Part's column.
  // PLANTED: replaced set 4's `commandCenterName` with `Deviation trends by
  // severity` — one of the source's own swap examples, which is exactly the
  // invention that would read as source-backed forever.
  // RED: expected [ …(2) ] to deeply equal [] — the name is both a swap
  //      example and absent from L38264, so the gate names two offences
  it('no set is named from the source’s swap examples, and every name occurs in the source', () => {
    const offenders: string[] = []
    for (const set of CC11_DATA_SETS) {
      for (const example of CC11_OPEN_IDENTITY.swapExamples) {
        const e = example.toLowerCase()
        if (set.commandCenterName.toLowerCase().includes(e)) {
          offenders.push(`set ${set.ordinal} commandCenterName is a swap example: ${example}`)
        }
        if (set.hubName.toLowerCase().includes(e)) {
          offenders.push(`set ${set.ordinal} hubName is a swap example: ${example}`)
        }
      }
      if (!srcLine(set.commandCenterLine).includes(set.commandCenterName)) {
        offenders.push(`set ${set.ordinal} commandCenterName is not on L${set.commandCenterLine}`)
      }
      if (!srcLine(set.hubLine).includes(set.hubName)) {
        offenders.push(`set ${set.ordinal} hubName is not on L${set.hubLine}`)
      }
    }
    expect(offenders).toEqual([])
    // The examples ARE the source's, on the open-item line, as examples.
    for (const example of CC11_OPEN_IDENTITY.swapExamples) {
      expect(srcLine(CC11_OPEN_IDENTITY.openItemLine)).toContain(example)
    }
  })

  // FAILS IF: a divergence is recorded where the source pairs no two names,
  // or dropped where it does. The first draft of this record asserted that the
  // source NOWHERE pairs set 5's two names and that the divergence was
  // measured by this build alone. THE GATE WENT RED AND THE RED WAS RIGHT:
  // L113012 and L113013, inside DEC-REPORT-001's own decision card, pair them
  // explicitly — "the same five sets with two different wordings for sets 4
  // and 5". `namesDifferAt` now carries the lines rather than a label, and the
  // finding is which lines: this module's own card (L38267) names set 4's
  // divergence and is silent about set 5's.
  // PLANTED: emptied set 5's `namesDifferAt`.
  // RED: set 5: expected false to be true // Object.is equality
  it('every recorded divergence is a line where the source itself pairs both names', () => {
    for (const set of CC11_DATA_SETS) {
      const differ = set.commandCenterName !== set.hubName
      expect(set.namesDifferAt.length > 0, `set ${set.ordinal}`).toBe(differ)
      for (const line of set.namesDifferAt) {
        const text = srcLine(line)
        expect(text, `L${line} must name set ${set.ordinal}'s §6.12.1 name`).toContain(
          set.ordinal === 5 ? 'Allocation consumption trend' : set.commandCenterName,
        )
        expect(text, `L${line} must name set ${set.ordinal}'s §4.10.5 name`).toContain(set.hubName)
      }
    }
    // Set 4's divergence is stated in THIS module's own card; set 5's is not,
    // and that asymmetry is the reason the lines are carried rather than a
    // boolean. Both are stated in the decision card three chapters away.
    expect(CC11_DATA_SETS[3]?.namesDifferAt).toContain(CC11_OPEN_IDENTITY.openItemLine)
    expect(CC11_DATA_SETS[4]?.namesDifferAt).not.toContain(CC11_OPEN_IDENTITY.openItemLine)
    expect(srcLine(CC11_OPEN_IDENTITY.openItemLine)).not.toContain('Tier-allocation')
    // L113013 states the shape of the gap without writing either name, so it
    // is carried apart from the lists rather than inside them.
    expect(srcLine(CC11_BOTH_SETS_DIVERGE.line)).toContain(CC11_BOTH_SETS_DIVERGE.statement)
    for (const set of [CC11_DATA_SETS[3], CC11_DATA_SETS[4]]) {
      expect(set?.namesDifferAt).toContain(113012)
      expect(set?.namesDifferAt).not.toContain(CC11_BOTH_SETS_DIVERGE.line)
    }
  })

  // FAILS IF: the three cards are merged, or a recommendation is presented as
  // the decision's. No two of the three offer the same options, so their three
  // recommendations are not comparable and none may stand for the others.
  // PLANTED: deleted the L113015 card object from `CC11_DEC_REPORT_CARDS`.
  // RED: expected 2 to be 3 // Object.is equality
  // AND A WEAKER PLANT STAYED GREEN FIRST, correctly: renaming that card's
  // `section` label left the card, its options and its recommendation in
  // place, so nothing this gate is for had changed. A plant that is not the
  // defect the gate exists for proves nothing either way; the deletion is
  // the plant, and it is the one recorded above.
  it('three cards state this decision, with three option lists and three recommendations', () => {
    expect(CC11_DEC_REPORT_CARDS.length).toBe(3)
    for (const card of CC11_DEC_REPORT_CARDS) {
      expect(srcLine(card.line), `L${card.line}`).toContain('Recommendation')
      expect(card.options.length).toBe(3)
    }
    // The option lists are three distinct lists, not one list restated.
    const serialised = CC11_DEC_REPORT_CARDS.map((c) => c.options.join('|'))
    expect(new Set(serialised).size).toBe(3)
    // Each card's recommendation is verbatim from its own line, case and all
    // — the first draft capitalised two of them and this gate caught it.
    for (const card of CC11_DEC_REPORT_CARDS) {
      expect(unticked(srcLine(card.line)), `L${card.line} recommendation`).toContain(
        card.recommendation,
      )
    }
    // And the register card is a card, not a passing mention.
    expect(unticked(srcLine(113009))).toContain(
      'DEC-REPORT-001 — The identity and ownership of the five standard report data sets',
    )
    expect(srcLine(113013)).toContain('two different wordings for sets 4 and 5')
  })

  // FAILS IF: the third spelling is dropped or promoted to a reading.
  // PLANTED: changed `thirdSpellingOfSetFour` to `Override frequency by role`.
  // RED: expected 'Override frequency by role' to be 'clearance or override
  //      frequency by role'
  it('L54388 carries a third spelling of set 4 that is neither reading', () => {
    expect(srcLine(CC11_OPEN_IDENTITY.thirdSpellingLine)).toContain(
      CC11_OPEN_IDENTITY.thirdSpellingOfSetFour,
    )
    expect(CC11_OPEN_IDENTITY.thirdSpellingOfSetFour).not.toBe(CC11_DATA_SETS[3]?.commandCenterName)
    expect(CC11_OPEN_IDENTITY.thirdSpellingOfSetFour).not.toBe(CC11_DATA_SETS[3]?.hubName)
    // Exactly two readings are carried, and the type gives nowhere for a third.
    expect(DEC_REPORT_001.position.readings.length).toBe(2)
  })
})

describe('the two decisions, one registered and one absent from this chapter', () => {
  // FAILS IF: the local disclosure outlives its reason. The canon is read at
  // test time and the identifier must be ABSENT from it, so a later lift
  // turns this red and forces the switch rather than leaving two spellings.
  // PLANTED: added a `/* DEC-REPORT-001 */` line to the head of
  // `src/disclosure/decisions.ts`, restored by index afterwards.
  // RED: expected true to be false // Object.is equality
  it('DEC-REPORT-001 is absent from the canon and registered in chapter 21', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    expect(canon.includes('DEC-REPORT-001')).toBe(false)
    expect(DEC_REPORT_001.canonNote.trim().length).toBeGreaterThan(0)
    // The register row is chapter 21's own, pointed at rather than restated.
    expect(CC11_REGISTER_ROW.line).toBe(38946)
    const row = cells(srcLine(CC11_REGISTER_ROW.line))
    expect(row[0]).toBe('DEC-REPORT-001')
    expect(row[1]).toBe(CC11_REGISTER_ROW.status)
    expect(row[2]).toBe(CC11_REGISTER_ROW.whereItAppears)
    expect(row[3]).toBe(CC11_REGISTER_ROW.owner)
  })

  // FAILS IF: a reading is marked as the winner, or a reading loses its
  // locator. The type has exactly two fields, so this asserts what the type
  // cannot: that both locators name a real line carrying the reading's name.
  // PLANTED: set 4's `hubName` replaced by its §6.12.1 name, which is the
  // edit that erases the contradiction this record exists for.
  // RED: expected [ 'set 4 hubName is not on L29887' ] to deeply equal []
  it('both readings of set 4 carry a locator whose line carries that reading', () => {
    const [a, b] = DEC_REPORT_001.position.readings
    expect(a?.text).toContain('Clearance (qualification-override) frequency by role')
    expect(a?.locator).toContain('L29887')
    expect(srcLine(29887)).toContain('Clearance (qualification-override) frequency by role')
    expect(b?.text).toContain('Override frequency by role')
    expect(b?.locator).toContain('L38264')
    expect(srcLine(38264)).toContain('Override frequency by role')
    expect(DEC_REPORT_001.position.kind).toBe('open')
    // The source recommends option (a) and a recommendation is not an
    // adoption; the open arm has no slot for one.
    expect(srcLine(38269)).toContain('Recommendation: option (a)')
    expect(Object.keys(DEC_REPORT_001.position)).toEqual(['kind', 'readings'])
  })

  // FAILS IF: DEC-RPTBLD-001 is quietly folded into chapter 21's register, or
  // its occurrence list drifts. It is the DEC-CLEAR-001 shape — raised in
  // another chapter, absent from this one, binding on an act this module
  // performs — and it must stay recorded here until someone lifts it.
  // PLANTED: added a `DEC-RPTBLD-001` row to `CC_DECISION_REGISTER` in
  // `src/surfaces/cc/decisions/register.ts`. A second plant dropped one line
  // from this module's own `occurrences` list and went red on the same test:
  // expected [ 2502, …(5) ] to deeply equal [ 2502, …(4) ].
  // RED: expected [ 'DEC-RPTBLD-001' ] to deeply equal []
  it('DEC-RPTBLD-001 is named nowhere in chapter 21 and by no register row', () => {
    const ids: readonly string[] = CC_DECISION_REGISTER.map((r) => r.id)
    expect(ids.filter((id) => id === DEC_RPTBLD_001.decisionRef)).toEqual([])
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    expect(canon.includes(DEC_RPTBLD_001.decisionRef)).toBe(false)

    // Chapter 21's register is sixteen rows and carries neither this nor a
    // near-spelling of it.
    const register = dataRows(REGISTER_SEPARATOR)
    expect(register.length).toBe(16)
    expect(register.map((r) => r.cells[0])).toContain('DEC-REPORT-001')
    expect(register.map((r) => r.cells[0])).not.toContain(DEC_RPTBLD_001.decisionRef)

    // And its occurrences are where this module says they are — every one
    // outside §21.14, counted off the source.
    const found = LINES.map((l, i) => (l.includes(DEC_RPTBLD_001.decisionRef) ? i + 1 : 0)).filter(
      (n) => n > 0,
    )
    expect(found).toEqual([...DEC_RPTBLD_001.occurrences])
    expect(found.filter((n) => n >= 38247 && n <= 38449)).toEqual([])
    expect(srcLine(DEC_RPTBLD_001.raisedAt)).toContain('the scope of the Custom Report Builder')
    expect(unticked(srcLine(DEC_RPTBLD_001.raisedAt))).toContain(
      'This decision compounds with DEC-REPORT-001',
    )
  })
})

describe('the Tenant Admin restriction, kept here and diverged from three times', () => {
  // FAILS IF: the restriction's own cell drifts, or is read positionally. It
  // is resolved from §21.1.2's header BY NAME.
  // PLANTED: changed `CC11_TENANT_ADMIN_RESTRICTION.cell` to drop `— report
  // and banner routes only`, leaving the bare `Allowed with conditions`.
  // RED: expected 'Allowed with conditions — report and …' to be 'Allowed
  //      with conditions'
  it('L35004 grants the Tenant Admin report and banner routes only', () => {
    const row = cells(srcLine(CC11_TENANT_ADMIN_RESTRICTION.line))
    expect(row[0]).toBe(CC11_TENANT_ADMIN_RESTRICTION.capability)
    expect(row[columnIndex(SURFACE_HEADER, 'Tenant Admin')]).toBe(
      CC11_TENANT_ADMIN_RESTRICTION.cell,
    )
    // Twenty data rows in that matrix, walked from its own separator.
    const rows = dataRows(SURFACE_SEPARATOR)
    expect(rows.length).toBe(20)
    expect(rows[0]?.line).toBe(CC11_TENANT_ADMIN_RESTRICTION.line)
  })

  // FAILS IF: this module stops being the baseline. Seven granted rows and
  // two prohibited ones, read off the source's own Tenant Admin column.
  // PLANTED: changed row 4's Tenant Admin cell to `Explicitly prohibited` in
  // `CC11_MATRIX` — the cell that would make authoring a Quality-Manager-only
  // act and break the agreement with L35004 and L35017 at once.
  // RED: L38292 · Tenant Admin: expected 'Allowed' to be 'Explicitly
  //      prohibited' — and the cell gate above went red on the same plant
  it('every Tenant Admin grant here is on a report capability of a report route', () => {
    const ta = columnIndex(MATRIX_HEADER, 'Tenant Admin')
    for (const row of CC11_MATRIX) {
      const source = cells(srcLine(Number(row.sourceRef.slice(1))))[ta]
      expect(source, row.sourceRef).toBe(row.cells['Tenant Admin'].text)
    }
    const granted = CC11_MATRIX.filter((r) => r.cells['Tenant Admin'].token === 'Allowed')
    expect(granted.map((r) => r.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7])
    const prohibited = CC11_MATRIX.filter(
      (r) => r.cells['Tenant Admin'].token === 'Explicitly prohibited',
    )
    expect(prohibited.map((r) => r.ordinal)).toEqual([8, 9])
    // Both prohibited rows are prohibited to every role, so neither is a
    // Tenant-Admin-specific refusal.
    for (const row of prohibited) {
      for (const column of CC11_COLUMNS) {
        expect(row.cells[column].token, `${row.sourceRef} · ${column}`).toBe(
          'Explicitly prohibited',
        )
      }
    }
    expect(CC11_TENANT_ADMIN_RESTRICTION.consistentHere).toBe(true)
  })

  // FAILS IF: a divergence is dropped, invented, or attributed to the wrong
  // module. Every chapter-21 module matrix is re-walked from its own header
  // and every non-prohibited Tenant Admin cell is collected, so "three
  // modules, five rows" is measured rather than asserted — a claim of three
  // is otherwise true of any three, and this gate has already caught the
  // record short by one row: the first draft carried four and the walk
  // returned five, the missing one being L36268.
  // PLANTED: deleted the MOD-CC-08 entry from
  // `CC11_TENANT_ADMIN_DIVERGENCES`.
  // RED: L37670 capability: expected 'See the cross-Area agent health
  //      roll-…' to be 'PLANTED'
  it('exactly three other modules, on five rows, grant outside the restriction', () => {
    const headers = LINES.map((l, i) => (l === srcLine(MATRIX_HEADER) ? i + 1 : 0))
      .filter((n) => n > 0)
      .filter((n) => n >= 36219 && n <= 38491)
    expect(headers.length).toBe(12)

    const outside: { line: number; capability: string; cell: string }[] = []
    for (const header of headers) {
      const ta = columnIndex(header, 'Tenant Admin')
      for (const row of dataRows(header + 1)) {
        const cell = row.cells[ta] ?? ''
        const head = cell.split(' — ')[0] ?? ''
        if (head !== 'Explicitly prohibited' && head !== 'Not applicable') {
          outside.push({ line: row.line, capability: row.cells[0] ?? '', cell })
        }
      }
    }

    // This module's own seven, MOD-CC-02's five as the banner module, and the
    // three divergences. Nothing else.
    const own = outside.filter((o) => o.line >= 38289 && o.line <= 38297)
    expect(own.length).toBe(7)
    const banner = outside.filter((o) => o.line >= 36452 && o.line <= 36459)
    expect(banner.length).toBe(5)
    const rest = outside.filter((o) => !own.includes(o) && !banner.includes(o))
    expect(rest.map((o) => o.line)).toEqual(
      CC11_TENANT_ADMIN_DIVERGENCES.map((d) => d.line),
    )
    for (const d of CC11_TENANT_ADMIN_DIVERGENCES) {
      const found = rest.find((o) => o.line === d.line)
      expect(found?.capability, `L${d.line} capability`).toBe(d.capability)
      expect(found?.cell, `L${d.line} cell`).toBe(d.cell)
    }
    expect(new Set(CC11_TENANT_ADMIN_DIVERGENCES.map((d) => d.module)).size).toBe(3)
    expect(CC11_TENANT_ADMIN_DIVERGENCES.length).toBe(5)
  })

  // FAILS IF: the surface matrix's own second row stops contradicting its
  // first, or the record drifts from it.
  // PLANTED: changed `otherCell` from `Read-only` to `Explicitly prohibited`.
  // RED: expected 'Read-only' to be 'Explicitly prohibited'
  it('the surface matrix contradicts its own restriction one row below it', () => {
    const row = cells(srcLine(CC11_SURFACE_MATRIX_SELF_DIVERGENCE.otherLine))
    expect(row[0]).toBe(CC11_SURFACE_MATRIX_SELF_DIVERGENCE.otherCapability)
    expect(row[columnIndex(SURFACE_HEADER, 'Tenant Admin')]).toBe(
      CC11_SURFACE_MATRIX_SELF_DIVERGENCE.otherCell,
    )
    expect(CC11_SURFACE_MATRIX_SELF_DIVERGENCE.otherLine).toBe(
      CC11_SURFACE_MATRIX_SELF_DIVERGENCE.restrictionLine + 1,
    )
  })
})

describe('what this module consumes rather than rebuilds', () => {
  // FAILS IF: the class and the qualifier are collapsed into one another.
  // L35900 is the only row of §21.3's table with both in one cell, and wave
  // 0's model keeps the cell verbatim beside the class it names.
  // PLANTED: changed `classCell` on `Report figures` in
  // `src/surfaces/cc/live/model.ts` from `Refreshed with an explicit
  // data-as-of stamp` to `Refreshed`.
  // RED: expected 'Refreshed' to be 'Refreshed with an explicit data-as-of
  //      stamp'
  it('L35900 assigns Report figures to this module with a class AND a qualifier', () => {
    const row = cells(srcLine(35900))
    expect(row[0]).toBe('Report figures')
    expect(row[1]).toBe(CC11_MODULE.id)
    const a = ccElementAssignment('Report figures')
    expect(a.classCell).toBe(row[2])
    expect(a.classCell).toBe('Refreshed with an explicit data-as-of stamp')
    expect(a.markerObligation).toBe(row[3])
    expect(a.markerObligation).toBe('Data-as-of timestamp on the file itself')
    // The qualifier is neither lost nor promoted into a fourth class.
    expect(a.freshnessClass).toBe('refreshed')
    expect(a.classCell).not.toBe(a.freshnessClass)
    expect(a.classCell.length).toBeGreaterThan('Refreshed'.length)
  })

  // FAILS IF: this module mints a second writes-outside-the-ten register.
  // Wave 0's is the one register and report-format authoring is its FIRST
  // entry, in L35350's own order.
  // PLANTED: added a local `CC11_OUTSIDE_WRITES` array to `report-sets.ts`
  // carrying the four acts.
  // RED: expected [ 'report-sets.ts' ] to deeply equal []
  it('report-format authoring is wave 0’s first entry and is not re-spelled here', () => {
    const first = CC_WRITES_OUTSIDE_THE_TEN[0]
    expect(first?.act).toBe('Report-format authoring')
    expect(first?.namedByDecCcWrite001).toBe(true)
    expect(unbolded(srcLine(38299))).toContain(
      'Report-format authoring is explicitly not one of the ten operational actions',
    )
    expect(unticked(srcLine(38299))).toContain('recorded under DEC-CCWRITE-001')
    expect(srcLine(38867)).toContain('AC-CC-410')
    expect(srcLine(38867)).toContain(
      'Report-format authoring and manual close are not exposed as operational actions',
    )
    expect(unticked(srcLine(35350))).toContain('DEC-CCWRITE-001')

    const dir = join(process.cwd(), 'src/surfaces/cc/modules/cc-11')
    const offenders = readdirSync(dir)
      .filter((f) => !isForeignProbe(f))
      .filter((f) => {
        const text = readFileSync(join(dir, f), 'utf8')
        return (
          text.includes('Manual close of a stuck run') ||
          text.includes('namedByDecCcWrite001:') ||
          text.includes('Optional one-tap feedback')
        )
      })
    expect(offenders).toEqual([])
  })
})

describe('no cell of this matrix is a link-out, and that is a reading of the rows', () => {
  // FAILS IF: this module acquires a population-B cell without one being
  // registered, or a registered one stops being counted. Population B is a
  // cell the source marks prohibited and then names a DESTINATION for, which
  // AC-CC-301 requires to BE a link; rows 8 and 9 here are
  // prohibited-with-a-note and their notes name a product rule and a roadmap.
  // The zero is asserted against the shared registry rather than against this
  // module's own claim about itself.
  // PLANTED: added a `cc-11-export-to-an-external-system` cell to
  // `src/surfaces/cc/decisions/link-outs.ts`.
  // RED: expected [ Array(1) ] to deeply equal []
  it('link-outs.ts registers no cell for this module, and the count says zero', () => {
    const mine = CC_LINK_OUT_CELLS.filter((c) => c.id.startsWith('cc-11'))
    expect(mine.map((c) => c.id)).toEqual([])
    expect(CC11_LINK_OUT_CELLS).toBe(mine.length)
    // And the two prohibited-with-a-note cells name no surface to link to.
    for (const ordinal of [8, 9]) {
      const note = cc11Cell(ordinal, 'Tenant Admin').note
      expect(note, `row ${ordinal} carries a note`).not.toBeNull()
      expect(note).not.toContain('Studio')
      expect(note).not.toContain('Delivery Operations Hub')
      expect(note).not.toContain('linked from here')
    }
  })
})

describe('the module’s own identity, the slug, and the route that carries it', () => {
  // FAILS IF: the slug is typed rather than derived, or the directory is
  // named something else. The screen's short name is "Reports and Custom
  // Report Builder" and the slug is neither that nor a shortening of it.
  // PLANTED: renamed `app/command-center/reports-and-report-builder` to
  // `app/command-center/reports-and-report-builder-x`.
  // RED: ENOENT: no such file or directory, stat '…/reports-and-report-builder'
  it('the spine declares `reports-and-report-builder` and that directory is on disk', () => {
    expect(CC11_MODULE.id).toBe('MOD-CC-11')
    expect(CC11_SLUG).toBe(CC11_MODULE.slug)
    expect(CC11_SLUG).toBe('reports-and-report-builder')
    const dir = join(process.cwd(), 'app', 'command-center', CC11_SLUG)
    expect(statSync(dir).isDirectory()).toBe(true)
    expect(statSync(join(dir, 'page.tsx')).isFile()).toBe(true)
  })

  // FAILS IF: the route ships without saying what it is. A bare `includes`
  // here is a gate that cannot fail: this page quotes L38793, which names
  // seven module ids, so deleting every sentence in which the page names its
  // OWN module leaves the quotation behind. The gate requires an occurrence
  // on a line naming no OTHER Command Center module.
  // PLANTED: replaced the page's own mentions of its module id with "this
  // module", leaving only the L38793 quotation.
  // RED: expected 0 to be greater than 0
  it('the route file names MOD-CC-11 on a line about no other module', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC11_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes(CC11_SCREEN.id)).toBe(true)
    const own = page
      .split('\n')
      .filter((l) => l.includes(CC11_MODULE.id))
      .filter((l) => {
        const others = [...l.matchAll(/MOD-CC-\d+/g)].map((m) => m[0])
        return others.every((o) => o === CC11_MODULE.id)
      })
    expect(own.length).toBeGreaterThan(0)
  })

  // FAILS IF: this screen mounts the action rail. L38793 names seven modules
  // and this is not one of them; the rail's mount point stays unfilled and
  // the shell renders its declared seam. The negative is asserted against the
  // FILE as well as against the source, because a rail mounted here would
  // compile and pass every other gate in this suite.
  // PLANTED: added `actionRail={<Cc13ActionRail personName="Priya"
  // scopeFilter="Site" heldColumns={['Tenant Admin']} mountedOn={CC11_MODULE.id} />}`
  // to the shell call in the route file.
  // RED: expected true to be false // Object.is equality
  it('the route mounts no action rail and L38793 does not name this module', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC11_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes('actionRail=')).toBe(false)
    expect(page.includes('Cc13ActionRail')).toBe(false)
    expect(page.includes("from '@/surfaces/cc/actions/ActionRail'")).toBe(false)

    const l38793 = srcLine(38793)
    const named = [...l38793.matchAll(/`(MOD-CC-\d+)` for /g)].map((m) => m[1])
    expect(named.length).toBe(7)
    expect(named).not.toContain(CC11_MODULE.id)
    // The source contradicts itself in the same sentence and it is not
    // repaired: it opens "Every other module on this surface", which is
    // twelve, and then enumerates seven.
    expect(l38793).toContain('Every other module on this surface')
  })

  // FAILS IF: the spine's locators stop carrying what they claim.
  it('the spine’s sourceRef and registerRef carry this module’s own lines', () => {
    expect(srcLine(Number(CC11_MODULE.sourceRef.slice(1)))).toContain('**Identity.**')
    expect(srcLine(Number(CC11_MODULE.sourceRef.slice(1)))).toContain('`MOD-CC-11`')
    expect(srcLine(Number(CC11_SCREEN.registerRef.slice(1)))).toContain('SCR-CC-11')
    expect(srcLine(Number(CC11_SCREEN.registerRef.slice(1)))).toContain('MOD-CC-11 all features')
    // The register's roles column for this screen names two roles and the
    // module matrix grants a third within scope. Recorded, not reconciled.
    expect(CC11_SCREEN.rolesColumn).toBe('Tenant Admin, Quality Manager')
    expect(cc11Row(1).cells.Supervisor.token).toBe('Allowed with conditions')
  })
})

describe('the disciplines this slice pays for', () => {
  const OWN_FILES = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-11'))
    .filter((f) => !isForeignProbe(f))
    .map((f) => join('src/surfaces/cc/modules/cc-11', f))

  // FAILS IF: a closed vocabulary is annotated `readonly T[]` instead of
  // `as const satisfies readonly T[]`. The release gate has caught that
  // eighteen times across two slices.
  // PLANTED: changed `CC11_TOKENS` to
  // `export const CC11_TOKENS: readonly string[] = [...]`.
  // RED: expected [ 'src/surfaces/cc/modules/cc-11/matrix.ts' ] to deeply
  //      equal []
  it('every exported array literal is `as const satisfies`', () => {
    const offenders = OWN_FILES.filter((f) => {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      return /^export const \w+:\s*readonly [^=]*=\s*\[/m.test(text)
    })
    expect(offenders).toEqual([])
  })

  // FAILS IF: a file here acquires `'use client'` while exporting plain data
  // a server component reads.
  // PLANTED: added `'use client'` to the head of `report-sets.ts`.
  // RED: expected [ 'src/surfaces/cc/modules/cc-11/report-sets.ts' ] to
  //      deeply equal []
  it('no client module here exports plain data a server component could read', () => {
    // THE RULE IS NOT "no client modules". This asserted exactly that and went
    // red the day `pnpm build` forced the panel to become one: it renders a
    // `WriteControl` with an `allow(...)` decision, whose enabled branch is
    // `<Button onClick={onAct}>`, and a SERVER component cannot pass a
    // function to a client component. Six of the seven Command Center panels
    // had it, all green on their own suites, because the boundary exists only
    // in a build.
    //
    // What the slice-7 defect actually was: a `'use client'` file exporting a
    // plain DATA object that a server component read, whose strings came back
    // undefined at prerender. A client file exporting only components and
    // types is correct and necessary. So the check is on what a client file
    // EXPORTS, not on whether it is one.
    const offenders: string[] = []
    for (const f of OWN_FILES) {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      if (!/^'use client'/m.test(text)) continue
      for (const m of text.matchAll(/^export const (\w+)/gm)) {
        offenders.push(`${f}: ${m[1] ?? ''}`)
      }
    }
    expect(offenders, 'a client module exports plain data — server reads of it are undefined at prerender').toEqual([])
  })

  // FAILS IF: this module grows its own anchor. No cell here is a
  // population-B link-out, so nothing here should be drawing a link at all.
  // PLANTED: added `<a href="/command-center/live-shift-board">the board</a>`
  // to `ReportsAndBuilder.tsx`.
  // RED: expected [ 'ReportsAndBuilder.tsx' ] to deeply equal []
  it('no file under cc-11 draws its own anchor or imports next/link', () => {
    const dir = join(process.cwd(), 'src/surfaces/cc/modules/cc-11')
    const offenders = readdirSync(dir)
      .filter((f) => !isForeignProbe(f))
      .filter((f) => {
        const text = readFileSync(join(dir, f), 'utf8')
        return /<a\s/.test(text) || text.includes("from 'next/link'")
      })
    expect(offenders).toEqual([])
  })

  // FAILS IF: a comment here spells a line number that does not carry what
  // the comment says it carries. This is the same rule
  // `tests/coverage/locator-fidelity.test.ts` applies, extended to the one
  // thing it cannot check: whether the line is BLANK. The dispatch's card
  // span for this module ends on one, and its number is deliberately written
  // nowhere in these files or in this suite.
  // PLANTED: added a comment to `matrix.ts` citing the dispatch's own end
  // line as the section's close. The number is not written here: a
  // knowingly-false citation describing a PLANTED defect is still a
  // knowingly-false citation.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no L-number cited in this module’s own files is a blank line', () => {
    const offenders: string[] = []
    for (const f of [...OWN_FILES, join('app/command-center', CC11_SLUG, 'page.tsx')]) {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      for (const m of text.matchAll(/\bL(\d{3,6})\b/g)) {
        const n = Number(m[1])
        if (n >= 1 && n <= LINES.length && srcLine(n).trim() === '') {
          offenders.push(`${f} cites L${n}, which is blank`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  // FAILS IF: this module's files stop being reachable from `app/`. Nineteen
  // slice-8 source files reach no route and one of them was this surface's
  // most valuable disclosure. The walk starts at the route file and follows
  // relative and aliased imports, and the import pattern is deliberately NOT
  // the `/^\s*(?:import|export)[^'"\n]*from\s+['"]…/gm` shape that cannot see
  // a multi-line import — a reachability check that under-reports goes green
  // on a broken chain.
  // PLANTED: removed the `<ReportsAndBuilder />` element and its import from
  // the route file.
  // RED: expected [ …(2) ] to deeply equal []
  it('every file in this module is reachable by import from its route', () => {
    const resolve = (spec: string, fromFile: string): string | null => {
      const base = spec.startsWith('@/')
        ? join(process.cwd(), 'src', spec.slice(2))
        : spec.startsWith('.')
          ? join(process.cwd(), fromFile, '..', spec)
          : null
      if (base === null) return null
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        try {
          if (statSync(base + ext).isFile()) return base + ext
        } catch {
          /* not this extension */
        }
      }
      return null
    }

    const start = join('app', 'command-center', CC11_SLUG, 'page.tsx')
    const seen = new Set<string>()
    const queue = [join(process.cwd(), start)]
    while (queue.length > 0) {
      const file = queue.pop() as string
      if (seen.has(file)) continue
      seen.add(file)
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const next = resolve(m[1] as string, file.slice(process.cwd().length + 1))
        if (next !== null) queue.push(next)
      }
    }
    const unreached = OWN_FILES.filter((f) => !seen.has(join(process.cwd(), f)))
    expect(unreached).toEqual([])
  })
})
