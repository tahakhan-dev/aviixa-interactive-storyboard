import { describe, expect, it } from 'vitest'
import { CC_SCREENS, ccScreen } from '@/surfaces/cc/screens'
import { CC09_TACC_DISCLOSURE } from '@/surfaces/cc/modules/cc-09/readings'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC13_ACTIONS } from '@/surfaces/cc/actions/action-set'
import {
  CC_WRITES_OUTSIDE_THE_TEN,
  OUTSIDE_WRITES_NAMED_BY_THE_SOURCE,
} from '@/surfaces/cc/actions/outside-writes'
import { CC_LINK_OUT_CELLS, cellTextOf } from '@/surfaces/cc/decisions/link-outs'
import { CC_DECISION_REGISTER } from '@/surfaces/cc/decisions/register'
import { CC13_EXERCISED_ON } from '@/surfaces/cc/modules/cc-13/rail'
import {
  CC09_DEMONSTRATION_FILTER,
  CC09_FILTER_DIMENSIONS,
  CC09_STORYBOARD_FEED,
  cc09IsUnacknowledged,
  cc09VisibleEntries,
} from '@/surfaces/cc/modules/cc-09/feed'
import {
  CC09_COLUMNS,
  CC09_LINK_OUT_CELL_ID,
  CC09_MATRIX,
  CC09_MODULE,
  CC09_ROW_HELD_ELSEWHERE,
  CC09_SCREEN,
  CC09_SLUG,
  CC09_TOKENS,
  CC09_TOKEN_OUTCOME,
  cc09Cell,
  cc09Row,
} from '@/surfaces/cc/modules/cc-09/matrix'
import {
  CC09_ACKNOWLEDGEMENT_ONLY_REFS,
  CC09_ACKNOWLEDGE_RESOLVE_SPLIT,
  CC09_DECOMPOSITION,
  CC09_DIVERGENCES,
  CC09_FILTER_RULE,
  CC09_FILTER_STATEMENTS,
  CC09_PUSHED_ELEMENTS,
  CC09_RESOLVE_ACT,
  CC09_RESOLVE_IS_ONE_OF_THE_TEN,
  CC09_RESOLVE_OUTSIDE_WRITE,
} from '@/surfaces/cc/modules/cc-09/readings'

/**
 * `MOD-CC-09` — §21.12, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * Nothing below compares a string this task wrote against another string this
 * task wrote, and **no count is taken from the array under test**: "ten rows"
 * is obtained by walking the source's own table from its separator to the
 * first line that is not a table row, never from `CC09_MATRIX.length` and
 * never by subtracting the ends of a span written in a dispatch — which on
 * this module would have been wrong, because that span ends on a blank line.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — the
 * defect planted into the real shipping file, the red observed, then reversed
 * and verified byte-identical against a baseline captured BEFORE the first
 * plant. Each `PLANTED` note names the defect that was actually planted,
 * never a convenient one. Where two guards cover the same defect, the removal
 * of EACH and of BOTH was planted, because redundant protections cannot be
 * verified one at a time.
 *
 * BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE THAT ARE LIVE RISKS HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and TWO cells of
 *    this matrix make it live — row 5's Supervisor cell, which is the whole
 *    trap this module carries, and row 7's. Every comparison below is an
 *    anchored equality on the cell head, never `startsWith`, never
 *    `includes`.
 *  - A `Resolve`-CONTAINING CHECK PROVES NOTHING, because action 5 of the ten
 *    is "Resolve or Resolve All sync conflicts". The gate that this act is
 *    not one of the ten compares WHOLE strings against both wordings the ten
 *    carry.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR, which splits
 *    into non-empty cells like any other row. Every walk starts AFTER the
 *    separator and excludes it by position, not by content.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Three columns of this
 *    matrix read `Explicitly prohibited` on all ten rows, so a count of
 *    "thirty prohibitions" is true however those three are permuted. Every
 *    cell gate below names its ROW and its COLUMN, read off the source's own
 *    header.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Every column index
 *    is resolved from its header line BY NAME at test time, in this table and
 *    in the four foreign tables.
 *  - A `page.includes('MOD-CC-09')` CHECK SATISFIED BY A QUOTATION. The route
 *    file quotes L38793, which names seven module ids including this one. The
 *    gate requires an occurrence on a line naming no OTHER `MOD-CC-*`.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking; §26.7 uses them and §21.12 does not. */
const unticked = (s: string): string => s.replaceAll('`', '')

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
 * is not a table row, so the separator can never be counted as data.
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
      `L${headerLine} has no column named "${name}". Its columns are ` +
        `${JSON.stringify(cells(srcLine(headerLine)))}.`,
    )
  }
  return i
}

/** This module's own matrix. Header, separator, first data line. */
const OWN_HEADER = 37860
const OWN_SEPARATOR = 37861
const OWN_FIRST_ROW = 37862

/** The four foreign tables that answer any of these rows. */
const SURFACE_HEADER = 35002
const SURFACE_SEPARATOR = 35003
const CC13_HEADER = 38680
const CC13_SEPARATOR = 38681
const S254_HEADER = 48442
const S254_SEPARATOR = 48443
const S267_HEADER = 49574
const S267_SEPARATOR = 49575

describe('the matrix is ten rows, counted off the source', () => {
  // FAILS IF: the transcription gains or loses a row. The count comes from
  // walking the SOURCE from its separator, so it cannot be satisfied by the
  // model's own length, and the separator is excluded by position.
  // PLANTED: deleted row 6 (`See fallback markings`) from `CC09_MATRIX`.
  // RED: expected 9 to be 10 // Object.is equality
  it('walks ten data rows from L37861 and the model carries the same ten', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(10)
    expect(rows[0]?.line).toBe(OWN_FIRST_ROW)
    expect(CC09_MATRIX.length).toBe(rows.length)
    // The line after the last data row is blank, and the one after that opens
    // the `**Preconditions.**` paragraph. Neither is a table row.
    expect(isTableRow(srcLine(OWN_FIRST_ROW + rows.length))).toBe(false)
    for (const [i, r] of rows.entries()) {
      const own = CC09_MATRIX[i]
      expect(own?.ordinal).toBe(i + 1)
      expect(own?.sourceRef).toBe(`L${r.line}`)
      expect(own?.capability).toBe(r.cells[0])
    }
  })

  // FAILS IF: the separator is counted as data, which would make the table
  // eleven rows and put `---` in the capability column of row 1.
  it('the separator is a separator and is not walked as data', () => {
    expect(srcLine(OWN_SEPARATOR).trim()).toBe('|---|---|---|---|---|---|')
    expect(dataRows(OWN_SEPARATOR)[0]?.cells[0]).not.toContain('---')
  })

  // FAILS IF: the dispatch's card span is taken as the section's extent. It
  // ends on a blank line and 187 lines short of the section's close. The line
  // number is not spelled here — `tests/coverage/locator-fidelity.test.ts`
  // refuses a citation of a blank line even inside a sentence saying it is
  // blank, and it went red on exactly that in slice 9.
  it('the commissioning dispatch’s card end is a blank line and the matrix is below it', () => {
    const cardOpen = 37826
    expect(srcLine(cardOpen)).toContain('21.12 Module `MOD-CC-09`')
    const dispatchEnd = OWN_HEADER - 3
    expect(srcLine(dispatchEnd).trim()).toBe('')
    expect(dispatchEnd).toBeLessThan(OWN_HEADER)
    // The section runs well past it: its own Source status paragraph is 187
    // lines further on, and §21.13 opens after that.
    expect(srcLine(38044)).toContain('**Source status.**')
    expect(srcLine(38048)).toContain('21.13 Module `MOD-CC-10`')
  })
})

describe('the columns are the header’s own five, in the header’s own order', () => {
  // FAILS IF: the column order is taken from the Frontline habit. This
  // surface runs Tenant Admin first and Worker last; a positional read
  // against the Frontline order inverts both silently.
  // PLANTED: reversed `CC09_COLUMNS`.
  // RED: expected [ 'Worker', 'Read-only Auditor', …(3) ] to deeply equal
  //      [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('L37860 names these five personas in this order', () => {
    const header = cells(srcLine(OWN_HEADER))
    expect(header[0]).toBe('Capability on this module')
    expect(header.slice(1)).toEqual([...CC09_COLUMNS])
    expect(header[1]).toBe('Tenant Admin')
    expect(header[header.length - 1]).toBe('Worker')
  })
})

describe('all fifty cells, each read against its own line and its own column', () => {
  // FAILS IF: any one of the fifty drifts from the source. Row by ORDINAL and
  // column by NAME, with the column index resolved from L37860 at test time,
  // so neither a reordering nor a permutation of the three all-prohibited
  // columns can satisfy it.
  // PLANTED: changed row 5's Quality Manager cell from `Allowed` to
  // `Explicitly prohibited` in `CC09_MATRIX`.
  // RED: expected 'Explicitly prohibited' to be 'Allowed' // Object.is equality
  it('every cell equals the source’s cell', () => {
    const rows = dataRows(OWN_SEPARATOR)
    for (const row of CC09_MATRIX) {
      const src = rows[row.ordinal - 1]
      expect(src, `no source row ${row.ordinal}`).toBeDefined()
      for (const column of CC09_COLUMNS) {
        expect(
          row.cells[column].text,
          `row ${row.ordinal} · ${column} · L${src?.line}`,
        ).toBe(src?.cells[columnIndex(OWN_HEADER, column)])
      }
    }
  })

  // FAILS IF: a cell head is classified by prefix. `Allowed` is a prefix of
  // `Allowed with conditions` and rows 5 and 7 are where it bites — row 5
  // being this module's defining trap.
  // PLANTED: changed `cell`'s classifier in `matrix.ts` from
  // `CC09_TOKENS.find((t) => t === head)` to
  // `CC09_TOKENS.find((t) => head.startsWith(t))`.
  // RED: expected 'Allowed' to be 'Allowed with conditions' (row 5,
  //      Supervisor)
  it('the two conditional cells classify as `Allowed with conditions`, never `Allowed`', () => {
    const conditional: readonly [number, 'Supervisor'][] = [
      [5, 'Supervisor'],
      [7, 'Supervisor'],
    ]
    for (const [ordinal, column] of conditional) {
      const c = cc09Cell(ordinal, column)
      expect(c.token, `row ${ordinal} · ${column}`).toBe('Allowed with conditions')
      expect(c.token).not.toBe('Allowed')
      expect(c.note).not.toBeNull()
      // The note is carried, not discarded: on both rows the note IS the rule.
      expect(c.text).toBe(`${c.token} — ${c.note ?? ''}`)
    }
    // And the plain grants are plain, so the check above is not true of
    // everything: row 5's Quality Manager cell is bare `Allowed`.
    expect(cc09Cell(5, 'Quality Manager').token).toBe('Allowed')
    expect(cc09Cell(5, 'Quality Manager').note).toBeNull()
  })

  // FAILS IF: a token this table does not use is admitted, or a token it does
  // use is dropped. The vocabulary is read off the source's own cells.
  it('the three tokens are exactly the heads the fifty cells use', () => {
    const heads = new Set(
      dataRows(OWN_SEPARATOR).flatMap((r) =>
        CC09_COLUMNS.map((c) => (r.cells[columnIndex(OWN_HEADER, c)] ?? '').split(' — ')[0]),
      ),
    )
    expect([...heads].sort()).toEqual([...CC09_TOKENS].sort())
    // No `Read-only` and no `Unavailable` anywhere in this matrix — which is
    // exactly the divergence §25.4 creates.
    expect(heads.has('Read-only')).toBe(false)
    expect(heads.has('Unavailable')).toBe(false)
    for (const t of CC09_TOKENS) expect(CC09_TOKEN_OUTCOME[t]).toBeTruthy()
  })
})

describe('“Resolve an escalation” is granted here and is not one of the ten', () => {
  // FAILS IF: the grant stops being read off L37866, or its Supervisor cell
  // is read as an unconditional `Allowed`.
  // PLANTED: changed row 5's Supervisor cell to bare `Allowed`.
  // RED: expected 'Allowed' to be 'Allowed with conditions — where the
  //      underlying act is within the Supervisor's authority'
  it('L37866 grants it to the Supervisor with a condition and to the Quality Manager plainly', () => {
    const row = cc09Row(5)
    expect(row.capability).toBe(CC09_RESOLVE_ACT)
    const src = cells(srcLine(37866))
    expect(row.cells.Supervisor.text).toBe(src[columnIndex(OWN_HEADER, 'Supervisor')])
    expect(row.cells['Quality Manager'].text).toBe(
      src[columnIndex(OWN_HEADER, 'Quality Manager')],
    )
    expect(row.cells['Quality Manager'].text).toBe('Allowed')
    for (const c of ['Tenant Admin', 'Read-only Auditor', 'Worker'] as const) {
      expect(row.cells[c].text).toBe('Explicitly prohibited')
    }
  })

  // FAILS IF: the act is counted among the ten. A `Resolve`-containing check
  // would pass on action 5, "Resolve or Resolve All sync conflicts", so the
  // comparison is whole-string equality against BOTH wordings the ten carry —
  // the authority table's and the matrix's, which differ on six rows.
  // PLANTED: renamed `CC13_ACTIONS` row 1's `matrixAction` to
  // `Resolve an escalation` in wave 0's `action-set.ts`.
  // RED: expected true to be false // Object.is equality
  it('no action of the ten is this act, under either of the two wordings', () => {
    expect(CC09_RESOLVE_IS_ONE_OF_THE_TEN).toBe(false)
    const wordings = CC13_ACTIONS.flatMap((a) => [a.authorityAction, a.matrixAction])
    expect(wordings).not.toContain(CC09_RESOLVE_ACT)
    // The trap the naive check would fall into is real and is asserted, so
    // the gate above is known to be doing work a substring check would not.
    expect(wordings.some((w) => w.includes('Resolve'))).toBe(true)
  })

  // FAILS IF: this module mints a second register, or the entry stops being
  // one of the two beyond `DEC-CCWRITE-001`'s four, or six is presented as
  // the source's number. All three counts are computed from wave 0's own
  // flag rather than typed anywhere.
  // PLANTED: flipped `namedByDecCcWrite001` to `true` on the resolve entry in
  // wave 0's `outside-writes.ts`.
  // RED: expected true to be false // Object.is equality
  it('wave 0’s register carries it, and it is NOT one of DEC-CCWRITE-001’s four', () => {
    expect(CC09_RESOLVE_OUTSIDE_WRITE.act).toBe(CC09_RESOLVE_ACT)
    expect(CC09_RESOLVE_OUTSIDE_WRITE.namedByDecCcWrite001).toBe(false)
    expect(OUTSIDE_WRITES_NAMED_BY_THE_SOURCE.length).toBe(4)
    expect(OUTSIDE_WRITES_NAMED_BY_THE_SOURCE.map((w) => w.act)).not.toContain(CC09_RESOLVE_ACT)
    // There is exactly ONE register on this surface and it is wave 0's.
    const own = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-09')).filter(
      (f) => !isForeignProbe(f),
    )
    for (const f of own) {
      const text = readFileSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-09', f), 'utf8')
      expect(
        /export const \w*OUTSIDE_WRITES?\w* = \[/.test(text),
        `${f} declares a second writes-outside-the-ten register`,
      ).toBe(false)
    }
    // And the four the source names are named by the source: each entry's
    // section is quoted by L35350, the decision card itself.
    const card = srcLine(35350)
    expect(card).toContain('DEC-CCWRITE-001')
    expect(card).toContain('report-format authoring')
    expect(card).toContain('manual close of a stuck run')
    expect(CC_WRITES_OUTSIDE_THE_TEN.filter((w) => !w.namedByDecCcWrite001).length).toBe(2)
  })

  // FAILS IF: a line recorded as naming acknowledgement alone in fact names
  // the resolution too, or the reverse. Each statement is checked against its
  // OWN source line rather than against the record's own text.
  // PLANTED: changed L49589's record in the split array from
  // `names: 'acknowledgement'` to `names: 'both'`.
  // RED: expected [ 'L38682' ] to deeply equal [ 'L38682', 'L49589' ]
  it('L38682 and L49589 name the acknowledgement and never the resolution', () => {
    expect([...CC09_ACKNOWLEDGEMENT_ONLY_REFS].sort()).toEqual(['L38682', 'L49589'])
    for (const ref of CC09_ACKNOWLEDGEMENT_ONLY_REFS) {
      const line = srcLine(Number(ref.slice(1)))
      expect(line, ref).toContain('cknowledge')
      // Anchored on the act, not on the word: §26.7's row is about the
      // acknowledgement STATE and says nothing about resolving an escalation.
      expect(line.includes('Resolve an escalation'), ref).toBe(false)
    }
    // L49589's Command Center cell, read against its own header.
    const s267 = dataRows(S267_SEPARATOR).find((r) => r.line === 49589)
    expect(s267?.cells[0]).toBe('Escalation acknowledgement state')
    expect(s267?.cells[columnIndex(S267_HEADER, 'Client Command Center')]).toBe(
      'Allowed with conditions — acknowledge from feed or notification, Supervisor and above',
    )
    // And the two lines that hold the pair apart carry the words they are
    // recorded as carrying.
    expect(srcLine(37844)).toContain('Acknowledge is not resolve.')
    expect(srcLine(38001)).toContain('FUNC-CC-0903-1-2')
    expect(srcLine(38001)).toContain('Keep resolve distinct from acknowledge')
    expect(CC09_ACKNOWLEDGE_RESOLVE_SPLIT.filter((s) => s.names === 'both').length).toBe(3)
  })
})

describe('a filter here can never hide an unacknowledged escalation', () => {
  // FAILS IF: the statement moves to the line the re-plan gave. L34881 is the
  // recommendation on one line of eight sentences; L34887 is step one of the
  // numbered workflow, six lines on.
  // PLANTED: changed the `sourceRef` of the first filter statement from
  // L34881 to L34887 in `readings.ts`.
  // RED: expected 'workflow — how the three boundaries…' to contain
  //      'a saved filter that hides a Severity 1 tile is a safety defect'
  it('L34881 carries the whole recommendation and L34887 is a workflow step', () => {
    const l34881 = srcLine(34881)
    expect(l34881).toContain('Not specified in the Statement of Work')
    expect(l34881).toContain('a saved filter that hides a Severity 1 tile is a safety defect')
    expect(l34881).toContain('persist only non-suppressive preferences')
    expect(l34881).toContain('re-apply a full-visibility state at every session start')
    expect(l34881).toContain('[Recommendation — R&D]')
    // It says of itself that it is NOT a Client Decision Required.
    expect(l34881).toContain('Client decision needed: no')
    // Eight sentences, and the whole line is read rather than truncated.
    expect(l34881.length).toBeGreaterThan(1000)
    // The re-plan's line is a numbered workflow step and carries none of it.
    expect(srcLine(34887).trim().startsWith('1.')).toBe(true)
    expect(srcLine(34887)).not.toContain('safety defect')
  })

  // FAILS IF: a statement is recorded with a standing its own line does not
  // carry, or the strictest of the three stops being the acceptance
  // criterion. Every `sourceRef` is opened.
  // PLANTED: changed `AC-CC-329`'s recorded standing from
  // `Acceptance criterion` to `Recommendation — R&D`.
  // RED: expected 2 to be 1
  //
  // AND THE FIRST DRAFT OF THIS GATE COULD NOT FAIL. It asserted only that
  // each `sourceRef` names a non-blank line — and L34887 is not blank, so
  // moving the recommendation's citation six lines onto the workflow step
  // left it GREEN. Found by the plant, not by the review. Each locator is
  // now DERIVED: the source is searched for a phrase, the phrase is required
  // to be unique, and the record must point at the line the search found.
  it('the rule has four statements with three different standings, each read off its line', () => {
    // phrase -> the record that must cite the line carrying it. The phrases
    // are the SOURCE's words; nothing here reads the record's own text.
    const derived: readonly [string, string][] = [
      ['a saved filter that hides a Severity 1 tile is a safety defect', 'L34881'],
      [
        'every role from persisting a filter that could hide an unacknowledged escalation',
        'L37993',
      ],
      ['No filter can hide an item carrying an unacknowledged escalation', 'L38027'],
      ['non-suppressive-filter rule', 'L38044'],
    ]
    for (const [phrase, expected] of derived) {
      const hits = LINES.map((l, i) => (l.includes(phrase) ? i + 1 : 0)).filter((n) => n > 0)
      expect(hits, `"${phrase}" is not unique in the source`).toHaveLength(1)
      expect(`L${hits[0]}`, phrase).toBe(expected)
      expect(
        CC09_FILTER_STATEMENTS.some((s) => s.sourceRef === expected),
        `no statement cites ${expected}`,
      ).toBe(true)
    }
    expect(CC09_FILTER_STATEMENTS.length).toBe(derived.length)
    expect(srcLine(38027)).toContain('AC-CC-329')
    expect(srcLine(38027)).toContain(
      'No filter can hide an item carrying an unacknowledged escalation',
    )
    expect(srcLine(37993)).toContain('FUNC-CC-0901-1-2')
    expect(srcLine(37993)).toContain(
      'every role from persisting a filter that could hide an unacknowledged escalation',
    )
    // §21.12's own Source status line classifies the rule a third way, and
    // that is recorded rather than normalised away.
    expect(srcLine(38044)).toContain('non-suppressive-filter rule')
    expect(srcLine(38044)).toContain('Derived Clarification')
    // Exactly one of the four is the acceptance criterion, and it is the one
    // this module implements because it is the widest in scope.
    const criteria = CC09_FILTER_STATEMENTS.filter((s) => s.standing === 'Acceptance criterion')
    expect(criteria.length).toBe(1)
    expect(criteria[0]?.scope).toBe('any-filter')
    expect(CC09_FILTER_RULE.strictestStatement).toBe('AC-CC-329')
    expect(CC09_FILTER_RULE.standing).toBe('Recommendation — R&D')
    expect(CC09_FILTER_RULE.isClientDecisionRequired).toBe(false)
    expect(CC09_FILTER_RULE.persistsAnyFilter).toBe(false)
  })

  // FAILS IF: a filter can drop an item carrying an unacknowledged
  // escalation. This is the module's one piece of behaviour and the only
  // place a wrong answer is a safety defect rather than a wrong string.
  // PLANTED: removed `|| forcedVisible` from `cc09VisibleEntries`'s final
  // `.filter(...)` in `feed.ts`.
  // RED: expected [ 'sb-cc-20-notified' ] to deeply equal
  //      [ 'sb-cc-20-notified', 'nobody-on-shift-fallback' ]
  it('every unacknowledged entry survives a filter that excludes it', () => {
    // A filter that admits NOTHING at all is the strongest case: everything
    // still visible under it is visible only because of the rule.
    const excludeAll = cc09VisibleEntries(CC09_STORYBOARD_FEED, {
      state: 'no state any entry carries',
    })
    const unacknowledged = CC09_STORYBOARD_FEED.filter(cc09IsUnacknowledged)
    expect(unacknowledged.length).toBeGreaterThan(0)
    expect(excludeAll.map((v) => v.entry.id)).toEqual(unacknowledged.map((e) => e.id))
    for (const v of excludeAll) {
      expect(v.forcedVisible).toBe(true)
      expect(v.matchedFilter).toBe(false)
      // A rescued item that does not say it was rescued reads as a match.
      expect(v.forcedReason).toContain('AC-CC-329')
    }
  })

  // FAILS IF: the rescue rule is keyed on the escalation's ladder state
  // rather than on the acknowledgement. A `fallback delivered` entry has
  // moved on and is still unacknowledged, which is exactly the item the
  // criterion protects.
  // PLANTED: changed `cc09IsUnacknowledged` to `e.state === 'notified'`.
  // RED: expected false to be true // Object.is equality
  it('the fallback-delivered entry counts as unacknowledged, because nobody claimed it', () => {
    const fallback = CC09_STORYBOARD_FEED.find((e) => e.id === 'nobody-on-shift-fallback')
    expect(fallback).toBeDefined()
    expect(fallback?.state).toBe('fallback delivered')
    expect(fallback?.acknowledged).toBeNull()
    expect(cc09IsUnacknowledged(fallback!)).toBe(true)
    // And an entry somebody DID claim is not rescued, so the rule is not
    // "show everything", which would pass the gate above just as well.
    const claimed = CC09_STORYBOARD_FEED.find((e) => e.acknowledged !== null)
    expect(claimed).toBeDefined()
    expect(cc09IsUnacknowledged(claimed!)).toBe(false)
    expect(
      cc09VisibleEntries(CC09_STORYBOARD_FEED, CC09_DEMONSTRATION_FILTER).map((v) => v.entry.id),
    ).not.toContain(claimed?.id)
  })

  // FAILS IF: a fifth filter dimension appears, or one of the source's four
  // is dropped. L37838 closes the set at four.
  it('the four filter dimensions are L37838’s own four', () => {
    const spine = srcLine(37838)
    expect(spine).toContain('filterable by Area, severity, type and state')
    expect([...CC09_FILTER_DIMENSIONS]).toEqual(['Area', 'severity', 'type', 'state'])
    expect(srcLine(37863)).toContain('Filter by Area, severity, type and state')
    expect(srcLine(38018)).toContain('AC-CC-320')
  })
})

describe('where another table answers one of these rows differently', () => {
  // FAILS IF: a divergence records a cell the foreign table does not carry.
  // Every statement is read off its own line with the column resolved from
  // that table's OWN header by name, so a table whose columns were reordered
  // could not satisfy it positionally.
  // PLANTED: changed the `acknowledge-tenant-admin` divergence's §25.4
  // statement from `Unavailable` to `Explicitly prohibited`.
  // RED: expected 'Unavailable' to be 'Explicitly prohibited'
  it('every statement equals its own source cell, header-keyed in its own table', () => {
    // Line -> which table it belongs to. The COLUMN comes from the
    // divergence itself, never from this map: two of the three divergences
    // quote the SAME line in different columns, and a line-keyed column
    // would compare one divergence's cell against the other's heading.
    const tables: Record<number, { header: number; separator: number }> = {
      37865: { header: OWN_HEADER, separator: OWN_SEPARATOR },
      37868: { header: OWN_HEADER, separator: OWN_SEPARATOR },
      37869: { header: OWN_HEADER, separator: OWN_SEPARATOR },
      35007: { header: SURFACE_HEADER, separator: SURFACE_SEPARATOR },
      35015: { header: SURFACE_HEADER, separator: SURFACE_SEPARATOR },
      38682: { header: CC13_HEADER, separator: CC13_SEPARATOR },
      38691: { header: CC13_HEADER, separator: CC13_SEPARATOR },
      48444: { header: S254_HEADER, separator: S254_SEPARATOR },
      48453: { header: S254_HEADER, separator: S254_SEPARATOR },
    }
    let compared = 0
    for (const d of CC09_DIVERGENCES) {
      for (const s of d.statements) {
        const t = tables[s.line]
        expect(t, `L${s.line} belongs to no table this gate knows`).toBeDefined()
        if (t === undefined) continue
        const row = dataRows(t.separator).find((r) => r.line === s.line)
        expect(row, `L${s.line} is not a data row of the table at L${t.separator}`).toBeDefined()
        expect(row?.cells[columnIndex(t.header, d.column)], `L${s.line} · ${d.column}`).toBe(
          s.text,
        )
        compared += 1
      }
      // Exactly two readings, and the type has nowhere to mark a winner.
      expect(d.readings.length).toBe(2)
      expect(Object.keys(d.readings[0]).sort()).toEqual(['locator', 'text'])
    }
    // A loop that compared nothing would pass. Eleven cells are compared.
    expect(compared).toBe(CC09_DIVERGENCES.reduce((n, d) => n + d.statements.length, 0))
    expect(compared).toBeGreaterThan(0)
  })

  // FAILS IF: the Read-only Auditor and Worker cells are recorded as
  // agreeing across the tables when §25.4 answers a different question.
  it('§25.4 answers the surface-access question in the Auditor and Worker columns', () => {
    const row = dataRows(S254_SEPARATOR).find((r) => r.line === 48444)
    expect(row?.cells[columnIndex(S254_HEADER, 'Read-only Auditor')]).toBe(
      'Not applicable — the Auditor has no Command Center access',
    )
    expect(cc09Cell(4, 'Read-only Auditor').text).toBe('Explicitly prohibited')
  })

  // FAILS IF: the never-held decomposition is presented as a contradiction,
  // or the outcomes are recorded as disagreeing when all three refuse the
  // Supervisor. It is left OPEN, on the reasoning slice 8 applied to §36.6.
  // PLANTED: changed `outcomesAgree` to `false`.
  // RED: expected false to be true // Object.is equality
  it('rows 7 and 8 are a decomposition, the outcomes agree, and nothing is reconciled', () => {
    expect(CC09_DECOMPOSITION.outcomesAgree).toBe(true)
    expect([...CC09_DECOMPOSITION.ownRows]).toEqual([7, 8])
    // Every table refuses the Supervisor the never-held authorisation.
    expect(cc09Cell(8, 'Supervisor').text).toBe('Explicitly prohibited')
    expect(srcLine(35015)).toContain('never-held requires the Quality Manager')
    expect(srcLine(48453)).toContain('a never-held qualification requires the Quality Manager')
    // §21.16 is silent on it, which is the third reading and is recorded.
    expect(srcLine(38691)).not.toContain('never-held')
    expect([...CC09_DECOMPOSITION.silentOn]).toEqual(['L38691'])
  })
})

describe('the two pushed elements and the latency rule', () => {
  // FAILS IF: either element's class or marker obligation is restated here
  // rather than read from §21.3's assignment table.
  // PLANTED: changed L35885's `markerObligation` in the live model to
  // `Origin and receipt times` (dropping `; fallback marked`).
  // RED: expected 'Origin and receipt times' to be
  //      'Origin and receipt times; fallback marked'
  it('both elements are Pushed and carry the obligations L35884 and L35885 state', () => {
    expect(CC09_PUSHED_ELEMENTS.length).toBe(2)
    for (const e of CC09_PUSHED_ELEMENTS) {
      expect(e.freshnessClass).toBe('pushed')
      const src = cells(srcLine(Number(e.sourceRef.slice(1))))
      expect(src[0]).toBe(e.element)
      expect(src[2]).toBe(e.classCell)
      expect(src[3]).toBe(e.markerObligation)
      expect([...e.modules]).toContain('MOD-CC-09')
    }
    expect(CC09_PUSHED_ELEMENTS[1]?.markerObligation).toContain('fallback marked')
  })

  // FAILS IF: the latency rule is stated from the floor rather than from
  // server receipt.
  it('L35835 measures from server receipt and displays both times', () => {
    const rule = srcLine(35835)
    expect(rule).toContain('measured from server receipt, not from the event happening on the floor')
    expect(rule).toContain('09:41')
    expect(rule).toContain('10:22')
    expect(rule).toContain('never implies it knew at 09:41')
    expect(srcLine(35909)).toContain('AC-CC-112')
    // And this module states it again from its own offline paragraph.
    expect(srcLine(37951)).toContain(
      'the feed shows origin against receipt so nobody misreads the delay as platform latency',
    )
  })
})

describe('row 9 is a link, and row 10 is deliberately not', () => {
  // FAILS IF: this module spells its own link, or the registered cell's row
  // stops matching the source line.
  // PLANTED: changed `CC09_LINK_OUT_CELL_ID` to a cell id that does not
  // exist.
  // RED: expected undefined not to be undefined
  it('the registry carries `cc-09-routing-timers-channels` against L37870 verbatim', () => {
    const cell = CC_LINK_OUT_CELLS.find((c) => c.id === CC09_LINK_OUT_CELL_ID)
    expect(cell).toBeDefined()
    expect(cell?.moduleId).toBe('MOD-CC-09')
    expect(cell?.line).toBe(37870)
    expect(cell?.rowText).toBe(srcLine(37870))
    expect(cell?.sourceRequires).toBe('link')
    // The cell the registry derives from that row is this module's own cell.
    expect(cellTextOf(cell!)).toBe(cc09Cell(CC09_ROW_HELD_ELSEWHERE, 'Tenant Admin').text)
    // And this module holds no href of its own.
    const own = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-09')).filter(
      (f) => !isForeignProbe(f),
    )
    for (const f of own) {
      const text = readFileSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-09', f), 'utf8')
      expect(/href=/.test(text), `${f} spells its own link`).toBe(false)
    }
  })

  // FAILS IF: row 10 gains a link-out registration. Its note is a REASON and
  // names no destination, so a link would be invented out of a sentence.
  it('row 10 carries a noted prohibition and no destination, and is registered nowhere', () => {
    expect(cc09Cell(10, 'Tenant Admin').note).toBe('in-app notifications cannot be muted')
    // `c.line` narrows to a union of the registered literals, so an equality
    // against a line no cell carries is a compile error rather than a check.
    // The comparison is widened deliberately: a guard whose offence is a type
    // error is not a guard, and this one must be able to go red when row 10
    // is registered.
    expect(CC_LINK_OUT_CELLS.some((c) => (c.line as number) === 37871)).toBe(false)
    expect(srcLine(37848)).toContain('In-app notifications cannot be muted')
    expect(srcLine(38023)).toContain('AC-CC-325')
  })
})

describe('the decisions this module carries', () => {
  // FAILS IF: `DEC-NOSHIFT-001`'s register row stops naming this section, or
  // `DEC-CLEAR-001` stops being the foreign one governing action 10.
  it('DEC-NOSHIFT-001 is registered for 21.12 and DEC-CLEAR-001 is foreign', () => {
    const noShift = CC_DECISION_REGISTER.find((d) => d.id === 'DEC-NOSHIFT-001')
    expect(noShift?.standing).toBe('registered')
    expect(noShift?.whereItAppears).toContain('21.12')
    expect(srcLine(noShift?.line ?? 0)).toContain('DEC-NOSHIFT-001')
    // Named inside this section, not only in the register.
    expect(srcLine(37850)).toContain('DEC-NOSHIFT-001')
    expect(srcLine(38044)).toContain('DEC-NOSHIFT-001')
    const clear = CC_DECISION_REGISTER.find((d) => d.id === 'DEC-CLEAR-001')
    expect(clear?.standing).toBe('foreign')
    expect(clear?.status).toContain('tenth')
  })
})

describe('the module’s own identity, the slug, and the route that carries it', () => {
  // FAILS IF: the slug is typed rather than derived, or the directory is
  // named something else. `CC_NAV` publishes this pathname from the spine and
  // the generator reads a declared slug with no directory as "declared, not
  // built".
  // PLANTED: renamed `app/command-center/alert-and-escalation-feed` to
  // `app/command-center/alert-and-escalation-feed-x`.
  // RED: ENOENT: no such file or directory, statSync
  //      '.../app/command-center/alert-and-escalation-feed'
  it('the spine declares `alert-and-escalation-feed` and a directory of that name is on disk', () => {
    expect(CC09_MODULE.id).toBe('MOD-CC-09')
    expect(CC09_SLUG).toBe(CC09_MODULE.slug)
    const dir = join(process.cwd(), 'app', 'command-center', CC09_SLUG)
    expect(statSync(dir).isDirectory()).toBe(true)
    expect(statSync(join(dir, 'page.tsx')).isFile()).toBe(true)
  })

  // FAILS IF: the route ships without saying what it is. A bare `includes`
  // here is a gate that cannot fail, because the file quotes L38793, which
  // names seven module ids including this one.
  // PLANTED: replaced every mention of `MOD-CC-09` in the page with "this
  // module", leaving only the sentences quoting L38793's seven.
  // RED: expected 0 to be greater than 0
  it('the route file names MOD-CC-09 on a line about no other module', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC09_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes(CC09_SCREEN.id)).toBe(true)
    const own = page
      .split('\n')
      .filter((l) => l.includes(CC09_MODULE.id))
      .filter((l) => [...l.matchAll(/MOD-CC-\d+/g)].every((m) => m[0] === CC09_MODULE.id))
    expect(own.length).toBeGreaterThan(0)
  })

  // FAILS IF: the page names itself only in prose that quotes something else.
  // THE GATE ABOVE COULD NOT FAIL ON ITS OWN, and the plant found it rather
  // than the review: with every sentence in which this page named its own
  // module removed, one line survived — the sentence QUOTING THE SCREEN
  // REGISTER ROW, `MOD-CC-09 all features`. That row names exactly one module
  // and so satisfies the no-other-module rule while the page has said nothing
  // about itself. It is the L38793-quotation defect one step subtler: a
  // quotation of a row about this module reads as this module speaking.
  //
  // The second check is therefore that the identifier is RENDERED, taken from
  // the spine and not from a literal, inside this route's own paragraph.
  // PLANTED: removed `{CC09_MODULE.id} · ` from the `cc-09-route` paragraph.
  // RED: expected false to be true // Object.is equality
  it('the route paragraph renders the identifier from the spine', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC09_SLUG, 'page.tsx'),
      'utf8',
    )
    const start = page.indexOf('data-testid="cc-09-route"')
    expect(start, 'the route paragraph is not on the page').toBeGreaterThan(-1)
    const end = page.indexOf('</p>', start)
    expect(end).toBeGreaterThan(start)
    const paragraph = page.slice(start, end)
    expect(paragraph.includes('{CC09_MODULE.id}')).toBe(true)
    // From the spine, never a literal: a hard-coded id could drift from it.
    expect(paragraph.includes(`'${CC09_MODULE.id}'`)).toBe(false)
  })

  // FAILS IF: the rail is not mounted, or the CARD treatment is mounted in
  // its place. L38793 names this module for actions 1 and 10, and until the
  // instruction to mount existed the rail was mounted nowhere.
  // PLANTED: removed the `actionRail={…}` prop from the route file.
  // RED: expected false to be true // Object.is equality
  it('the route mounts Cc13ActionRail and L38793 names this module for 1 and 10', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC09_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes('Cc13ActionRail')).toBe(true)
    expect(page.includes('actionRail=')).toBe(true)
    expect(page.includes("from '@/surfaces/cc/actions/ActionRail'")).toBe(false)

    const l38793 = srcLine(38793)
    expect(l38793).toContain('`MOD-CC-09` for 1 and 10')
    const named = [...l38793.matchAll(/`(MOD-CC-\d+)` for /g)].map((m) => m[1])
    expect(named.length).toBe(7)
    expect(named).toContain('MOD-CC-09')
    // Wave 1's own enumeration agrees, and is read rather than re-listed.
    expect(
      CC13_EXERCISED_ON.find((s) => s.module === 'MOD-CC-09')?.ordinals,
    ).toEqual([1, 10])
    // L37963, this module's own Interconnections line, states the same two.
    expect(srcLine(37963)).toContain('exercises actions 1 and 10 of `MOD-CC-13`')
  })

  // FAILS IF: the spine's identity locator stops carrying the identity line,
  // or the screen register row stops carrying this module.
  it('the spine’s sourceRef for this module is its own identity line', () => {
    const identity = srcLine(Number(CC09_MODULE.sourceRef.slice(1)))
    expect(identity).toContain('**Identity.**')
    expect(identity).toContain('`MOD-CC-09`')
    const register = srcLine(Number(CC09_SCREEN.registerRef.slice(1)))
    expect(register).toContain('SCR-CC-09')
    expect(register).toContain('MOD-CC-09 all features')
  })
})

describe('the disciplines this slice pays for', () => {
  const OWN_FILES = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-09'))
    .filter((f) => !isForeignProbe(f))
    .map((f) => join('src/surfaces/cc/modules/cc-09', f))

  // FAILS IF: a closed vocabulary is annotated `readonly T[]` instead of
  // `as const satisfies readonly T[]`. The release gate has caught that
  // eighteen times across two slices.
  // PLANTED: changed `CC09_TOKENS` to
  // `export const CC09_TOKENS: readonly string[] = [...]`.
  // RED: expected [ 'src/surfaces/cc/modules/cc-09/matrix.ts' ] to deeply
  //      equal []
  it('every exported array literal is `as const satisfies`', () => {
    const offenders = OWN_FILES.filter((f) => {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      return /^export const \w+:\s*readonly [^=]*=\s*\[/m.test(text)
    })
    expect(offenders).toEqual([])
  })

  // FAILS IF: a file here acquires `'use client'` while exporting plain data
  // a server component reads. Four Run Player panels shipped an undefined
  // module id in slice 7 exactly that way.
  // PLANTED: added `'use client'` to the head of `feed.ts`.
  // RED: expected [ 'src/surfaces/cc/modules/cc-09/feed.ts' ] to deeply
  //      equal []
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
    for (const f of [...OWN_FILES, join('app/command-center', CC09_SLUG, 'page.tsx')]) {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      if (!/^'use client'/m.test(text)) continue
      for (const m of text.matchAll(/^export const (\w+)/gm)) {
        offenders.push(`${f}: ${m[1] ?? ''}`)
      }
    }
    expect(offenders, 'a client module exports plain data — server reads of it are undefined at prerender').toEqual([])
  })

  // FAILS IF: a comment here spells a line number that does not carry what
  // the comment says it carries. This is the same rule
  // `tests/coverage/locator-fidelity.test.ts` applies, on the one thing that
  // suite cannot check: whether the line is BLANK. It went red once on this
  // module's own first draft, which cited L37854 for the mute rule — that
  // line opens the qualification-events paragraph and the rule is at L37848.
  // PLANTED: added a comment to `feed.ts` citing, as this matrix's header,
  // the blank line the commissioning dispatch gave as the card's end. The
  // number is not written here: a knowingly-false citation describing a
  // PLANTED defect is still a knowingly-false citation.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no L-number cited in this module’s own files is a blank line', () => {
    const offenders: string[] = []
    for (const f of [...OWN_FILES, join('app/command-center', CC09_SLUG, 'page.tsx')]) {
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
})

/* The frozen source, under one name for the round-3 gate below, so the 
 * helper does not depend on which spelling this file already uses. */
const TACC_LINES: readonly string[] = LINES

/* ==================================================================== *
 * FIX STREAM H, ROUND 3 — `DEC-TACC-001` ON MOD-CC-09, GATED.
 *
 * The decision is the source's own, raised under its own identifier, and it
 * governs this module's `MTX-TEN-02c` cell through condition `[K1]`. Until
 * `CC09_TACC_DISCLOSURE` landed, this module carried no record of it — the Tenant Admin
 * column of its own card reads `Explicitly prohibited` on every row, and a
 * column that repeats itself 10 times reads as an answer rather than as
 * one side of a disagreement.
 *
 * WHAT IS ASSERTED. Every statement is held to EXACT EQUALITY against the
 * frozen source's own header-keyed cell, read at test time, with the column
 * resolved BY NAME off that table's own header line. So a statement rewritten
 * to the value that would erase the divergence fails here — the defect the
 * `MOD-CC-12` readings file records as brief error 33 — and `Read-only`
 * cannot satisfy an assertion about `Read-only — observe`.
 *
 * AND THE IDENTIFIER IS ASSERTED ABSENT FROM BOTH REGISTERS, never present.
 * That is the `Stu14LocalDisclosure` idiom `MOD-CC-03`, `MOD-CC-05`,
 * `MOD-CC-07` and `MOD-CC-12` already follow: the day someone lifts
 * `DEC-TACC-001` into `src/disclosure/decisions.ts` or into `CcDecisionId`,
 * this suite goes red and forces the switch instead of leaving two spellings
 * of one decision alive.
 * ==================================================================== */

/** Cells with backticks INTACT: chapter 22 tickets its tokens and the module
 *  cards do not, so folding the two would let a statement quote the wrong
 *  dialect and pass. */
const taccCells = (n: number): readonly string[] =>
  (TACC_LINES[n - 1] ?? '')
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

function taccColumn(headerLine: number, name: string): number {
  const index = taccCells(headerLine).indexOf(name)
  if (index < 0) {
    throw new Error(
      `L${headerLine} has no column "${name}"; its header is ` +
        `${JSON.stringify(taccCells(headerLine))}.`,
    )
  }
  return index
}

describe('fix stream H round 3: DEC-TACC-001 on MOD-CC-09', () => {
  // FAILS IF: any quoted cell stops being what the frozen source carries at
  // that line and column.
  // PLANTED: changed the `MTX-TEN-02c` statement's text from
  // '`Read-only` `[K1]`' to '`Explicitly prohibited`', the value that would erase the divergence.
  // RED: L22066 column "Tenant Admin" is not what the record quotes —
  // expected '`Read-only` `[K1]`' to be '`Explicitly prohibited`'
  it('quotes every statement verbatim, cell by cell and column by name', () => {
    const statements: readonly {
      readonly text: string
      readonly line: number
      readonly column: string | null
      readonly headerLine: number | null
    }[] = CC09_TACC_DISCLOSURE.statements
    expect(statements.length).toBeGreaterThan(0)
    for (const s of statements) {
      if (s.column === null) {
        expect(s.headerLine).toBeNull()
        expect(TACC_LINES[s.line - 1] ?? '').toContain(s.text)
        continue
      }
      expect(s.headerLine).not.toBeNull()
      const index = taccColumn(s.headerLine as number, s.column)
      expect(
        taccCells(s.line)[index],
        `L${s.line} column "${s.column}" is not what the record quotes`,
      ).toBe(s.text)
    }
  })

  // FAILS IF: the module row moves under the record, or the card's Tenant
  // Admin column stops being uniformly prohibitive — the premise of the
  // second reading.
  // PLANTED: changed the record's `module` from 'MOD-CC-09' to 'MOD-CC-01'.
  // RED: expected '`MOD-CC-01`' to be '`MOD-CC-09`'
  it('cites its own MTX-TEN-02c row, and the whole card column that answers it', () => {
    expect(taccCells(22_056)[0]).toBe('#')
    expect(taccCells(22066)[0]).toBe('`MOD-CC-09`')
    expect(CC09_TACC_DISCLOSURE.module).toBe('MOD-CC-09')
    const ta = taccColumn(37860, 'Tenant Admin')
    const first = 37860 + 2
    const column: string[] = []
    for (let n = first; (TACC_LINES[n - 1] ?? '').trimStart().startsWith('|'); n += 1) {
      column.push(taccCells(n)[ta] ?? '')
    }
    expect(column.length).toBe(10)
    expect(column.every((c) => c.startsWith('Explicitly prohibited'))).toBe(true)
  })

  // FAILS IF: the register row this build transcribes stops being the one the
  // record cites, or starts naming the Tenant Admin. The register is the
  // reading the build derives from, so this is the assertion that the
  // derivation still has a source.
  // PLANTED: changed the record's second reading locator line from L48394
  // to L48391.
  // RED: expected 'SCR-CC-06' to be 'SCR-CC-09'
  it('the screen register row names no Tenant Admin, and this build agrees', () => {
    expect(taccCells(48394)[0]).toBe('SCR-CC-09')
    const roles = taccCells(48394)[taccColumn(48_384, 'Roles that can open it')] ?? ''
    expect(roles).not.toContain('Tenant Admin')
    expect(CC09_TACC_DISCLOSURE.readings[1]?.locator).toContain('L48394')
    expect(ccScreen('SCR-CC-09').rolesThatCanOpen as readonly string[]).not.toContain(
      'TENANT_ADMIN',
    )

    // The population the disclosure's prose states: of the twelve screens
    // that are not the sign-in, three are served to the Tenant Admin and nine
    // are withheld. Counted here, never carried.
    const notSignIn = CC_SCREENS.filter((s) => s.id !== 'SCR-CC-01')
    expect(notSignIn.length).toBe(12)
    expect(notSignIn.filter((s) => (s.rolesThatCanOpen as readonly string[]).includes('TENANT_ADMIN')).length).toBe(3)
    expect(notSignIn.filter((s) => !(s.rolesThatCanOpen as readonly string[]).includes('TENANT_ADMIN')).length).toBe(9)
  })

  // FAILS IF: `DEC-TACC-001` stops being the source's own identifier for this
  // question, is quietly lifted into either register, or has its working
  // position promoted to an adoption. A recommendation is not an adoption
  // either, and both are read off the source rather than off the record.
  // PLANTED: changed `cardLine` from 23069 to 23070.
  // RED: expected '' to contain 'DEC-TACC-001'
  it('DEC-TACC-001 is real, is open, and is in neither register', () => {
    const raised = TACC_LINES[CC09_TACC_DISCLOSURE.cardLine - 1] ?? ''
    expect(raised).toContain('DEC-TACC-001')
    expect(raised).toContain("the Tenant Admin's Client Command Center presence")
    for (const option of CC09_TACC_DISCLOSURE.options) {
      expect(raised, `option "${option}" is not on the card line`).toContain(option)
    }
    expect(raised).toContain(CC09_TACC_DISCLOSURE.recommendation)
    expect(CC09_TACC_DISCLOSURE.adopted).toBe(false)
    expect(taccCells(CC09_TACC_DISCLOSURE.registerRowLine)[0]).toBe('`DEC-TACC-001`')

    const working = TACC_LINES[CC09_TACC_DISCLOSURE.workingPositionRef - 1] ?? ''
    expect(working).toContain('DEC-TACC-001')
    expect(working).toContain(CC09_TACC_DISCLOSURE.workingPosition)

    // Eleven of the thirteen Tenant Admin cells carry [K1], COUNTED off the
    // matrix rather than believed, and this module's row is one of them.
    const ta = taccColumn(22_056, 'Tenant Admin')
    const rows: { line: number; cell: string }[] = []
    for (let n = 22_058; (TACC_LINES[n - 1] ?? '').trimStart().startsWith('|'); n += 1) {
      rows.push({ line: n, cell: taccCells(n)[ta] ?? '' })
    }
    expect(rows.length).toBe(13)
    const underK1 = rows.filter((r) => r.cell.includes('[K1]'))
    expect(underK1.length).toBe(11)
    expect(underK1.map((r) => r.line)).toContain(22066)

    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const ccRegister = readFileSync(
      join(process.cwd(), 'src/surfaces/cc/decisions/register.ts'),
      'utf8',
    )
    expect(canon.includes('DEC-TACC-001')).toBe(false)
    expect(ccRegister.includes('DEC-TACC-001')).toBe(false)
  })

  // FAILS IF: a reading grows a field on which it could be marked the winner,
  // or the pair becomes a single.
  it('carries two readings and no verdict', () => {
    expect(CC09_TACC_DISCLOSURE.readings.length).toBe(2)
    for (const reading of CC09_TACC_DISCLOSURE.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
      expect(reading.text.length).toBeGreaterThan(80)
    }
    expect(CC09_TACC_DISCLOSURE.notResolved.length).toBeGreaterThan(40)
    expect(CC09_TACC_DISCLOSURE.wouldChange.length).toBeGreaterThan(40)
  })
})
