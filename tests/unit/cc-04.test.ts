import { describe, expect, it } from 'vitest'
import { CC_SCREENS, ccScreen } from '@/surfaces/cc/screens'
import { CC04_TACC_DISCLOSURE } from '@/surfaces/cc/modules/cc-04/readings'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC13_OWNING_PLACES } from '@/surfaces/cc/actions/action-set'
import { CC_LINK_OUT_CELLS, cellTextOf } from '@/surfaces/cc/decisions/link-outs'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC04_COLUMNS,
  CC04_MATRIX,
  CC04_MODULE,
  CC04_ROW_HELD_ELSEWHERE,
  CC04_SCREEN,
  CC04_SLUG,
  CC04_TOKENS,
  CC04_TOKEN_OUTCOME,
  cc04Cell,
  cc04Row,
} from '@/surfaces/cc/modules/cc-04/matrix'
import {
  CC04_DIVERGENCES,
  CC04_SEVERITY_BOUNDARY,
  CC04_UNCOMPUTED_COUNT,
} from '@/surfaces/cc/modules/cc-04/readings'

/**
 * `MOD-CC-04` — §21.7, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * Nothing below compares a string this task wrote against another string this
 * task wrote, and **no count is taken from the array under test**: "twelve
 * rows" is obtained by walking the source's own table from its separator to
 * the first line that is not a table row, never from `CC04_MATRIX.length` and
 * never by subtracting the ends of a span written in a dispatch.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — the
 * defect planted into the real shipping file, the red observed, then reversed
 * and verified byte-identical against a baseline captured BEFORE the first
 * plant. Each `PLANTED` note names the defect that was actually planted,
 * never a convenient one. Where two guards cover the same defect, the removal
 * of EACH and of BOTH was planted, because redundant protections cannot be
 * verified one at a time.
 *
 * FIVE BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE WERE LIVE RISKS HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and row 12's Quality
 *    Manager cell is the one cell in this matrix where that matters. Every
 *    comparison below is an anchored equality on the cell head, never
 *    `startsWith` and never `includes`.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR, which splits
 *    into non-empty cells like any other row. Every walk starts AFTER the
 *    separator and excludes it by position, not by content.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Three columns of this
 *    matrix read `Explicitly prohibited` on all twelve rows, so a count of
 *    "thirty-six prohibitions" is true however those three columns are
 *    permuted. Every cell gate below names its ROW and its COLUMN, read off
 *    the source's own header.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Every column index
 *    is resolved from its header line BY NAME at test time, in this table and
 *    in the three foreign tables, so reordering anything cannot move a
 *    comparison with it.
 *  - AN ALLOWANCE TAKING ITS ALLOWED STRING FROM THE VALUE UNDER TEST. The
 *    divergence gates read the foreign tables directly rather than trusting
 *    the `statements` array's own text, so a record that renamed its own
 *    token could not satisfy the check by renaming it consistently.
 *
 * TWO OF THESE GATES COULD NOT FAIL WHEN FIRST WRITTEN, and the plants found
 * both rather than the review. They are added to the running catalogue:
 *
 *  - A `page.includes('MOD-CC-04')` CHECK SATISFIED BY A QUOTATION. The route
 *    file quotes L38793, which names seven module ids including this one, so
 *    every sentence in which the page named its OWN module could be deleted
 *    and the check still passed. The fix is to require an occurrence on a line
 *    that names no other Command Center module.
 *  - A NAME-KEYED CELL LOOKUP BLIND TO COLUMN ORDER, in the component suite
 *    next door. Reversing the body's column order left every `data-testid` on
 *    its own value and the gate green, with every cell on screen under the
 *    wrong heading — the exact inversion this matrix's column order is
 *    dangerous for. That suite now asserts the order positionally as well.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking on identifiers; §26.7 uses them and §21.7 does not. */
const unticked = (s: string): string => s.replaceAll('`', '')

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
      `L${headerLine} has no column named "${name}". Its columns are ` +
        `${JSON.stringify(cells(srcLine(headerLine)))}.`,
    )
  }
  return i
}

/** This module's own matrix. Header, separator, first data line. */
const OWN_HEADER = 36832
const OWN_SEPARATOR = 36833
const OWN_FIRST_ROW = 36834

/** `MOD-CC-13`'s action matrix (§21.16) and §25.4's, both header-keyed. */
const CC13_HEADER = 38680
const CC13_SEPARATOR = 38681
const S254_HEADER = 48442
const S254_SEPARATOR = 48443
/** §26.7's record-type matrix — six SURFACE columns, not five persona columns. */
const S267_HEADER = 49574
const S267_SEPARATOR = 49575

describe('the matrix is twelve rows, counted off the source', () => {
  // FAILS IF: the transcription gains or loses a row. The count comes from
  // walking the SOURCE from its separator, so it cannot be satisfied by the
  // model's own length, and the separator is excluded by position.
  // PLANTED: deleted row 7 (`View evidence against specification and proof
  // requirements`) from `CC04_MATRIX`.
  // RED: expected 11 to be 12 // Object.is equality
  it('walks twelve data rows from L36833 and the model carries the same twelve', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(12)
    expect(CC04_MATRIX.length).toBe(rows.length)
    expect(rows[0]?.line).toBe(OWN_FIRST_ROW)
    expect(rows[rows.length - 1]?.line).toBe(36845)
  })

  // FAILS IF: the body is read as running past its end, which is how a span
  // becomes a count. The line after the last data row is blank and the one
  // after that opens `**Preconditions.**` at L36847, so the walk above stops
  // for a reason the source states rather than one a dispatch asserted.
  it('stops where the source stops, one line short of the preconditions paragraph', () => {
    expect(srcLine(OWN_SEPARATOR + 13)).toBe('')
    expect(srcLine(36847).startsWith('**Preconditions.**')).toBe(true)
    expect(isTableRow(srcLine(OWN_SEPARATOR + 13))).toBe(false)
  })

  // FAILS IF: a dispatch's card span is copied into this build as though it
  // were read. The line that dispatch gave as the card's end is BLANK and
  // sits above the matrix, so it cannot end a card whose matrix begins at
  // L36832 and whose closing rule is at L37025.
  it('the card runs past the blank line the dispatch gave as its end', () => {
    expect(srcLine(36796)).toContain('21.7 Module')
    expect(srcLine(36796)).toContain('MOD-CC-04')
    expect(srcLine(OWN_HEADER - 3)).toBe('')
    expect(srcLine(36830)).toBe('**Roles that see and use it, and their permissions.**')
    expect(srcLine(37025)).toBe('---')
    expect(srcLine(37027).startsWith('## 21.8')).toBe(true)
  })
})

describe('the columns are the header line’s own, in the header line’s own order', () => {
  // FAILS IF: the transcription is read positionally against the Frontline
  // habit, which opens on Worker. The expected list is READ FROM L36832 at
  // test time, so it cannot be satisfied by a constant this task also wrote.
  // PLANTED: swapped `'Tenant Admin'` and `'Worker'` in `CC04_COLUMNS`.
  // RED: expected [ 'Worker', 'Supervisor', …(3) ] to deeply equal [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('reads Tenant Admin first and Worker last, off L36832', () => {
    const header = cells(srcLine(OWN_HEADER))
    expect(header[0]).toBe('Capability on this module')
    expect([...CC04_COLUMNS]).toEqual(header.slice(1))
    expect(header[1]).toBe('Tenant Admin')
    expect(header[header.length - 1]).toBe('Worker')
  })

  // FAILS IF: a column is dropped from the outcome map, which would let a
  // persona's cells go untranscribed. `satisfies Record<Cc04Column, RoleId>`
  // proves totality at compile time; this proves the compile-time claim is
  // about the SOURCE's columns and not about a list that drifted from them.
  it('every source column has a model column and no model column is invented', () => {
    const header = cells(srcLine(OWN_HEADER)).slice(1)
    for (const name of header) expect(CC04_COLUMNS).toContain(name)
    for (const name of CC04_COLUMNS) expect(header).toContain(name)
  })
})

describe('every one of the sixty cells is verbatim, header-keyed', () => {
  // FAILS IF: any cell text drifts from the source, in any row, in any
  // column. Row and column are both resolved by NAME, so a permutation of the
  // three all-prohibited columns cannot pass by arithmetic.
  // PLANTED: changed row 6's Quality Manager cell from `Allowed` to
  // `Explicitly prohibited` in `CC04_MATRIX` — the cell whose grant makes the
  // "awaiting Quality Manager" count underivable.
  // RED: L36839 · Quality Manager: expected 'Allowed' to be 'Explicitly
  //      prohibited' // Object.is equality
  it('matches L36834-L36845 cell for cell', () => {
    const rows = dataRows(OWN_SEPARATOR)
    for (const row of CC04_MATRIX) {
      const src = rows.find((r) => r.line === Number(row.sourceRef.slice(1)))
      expect(src, `no source row at ${row.sourceRef}`).toBeDefined()
      expect(src?.cells[0]).toBe(row.capability)
      for (const column of CC04_COLUMNS) {
        const i = columnIndex(OWN_HEADER, column)
        expect(src?.cells[i], `${row.sourceRef} · ${column}`).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: a row's declared line does not carry that row. A `sourceRef`
  // that points anywhere is the citation defect this build has been bitten by
  // eleven times, and it is separable from the cell check above because a
  // uniformly shifted set of refs would still match cell for cell.
  it('each row’s sourceRef line carries that row’s own capability in column one', () => {
    for (const row of CC04_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      expect(isTableRow(srcLine(line))).toBe(true)
      expect(cells(srcLine(line))[0]).toBe(row.capability)
    }
  })
})

describe('`Allowed` is a prefix of `Allowed with conditions`, and nothing here tests by prefix', () => {
  // FAILS IF: a cell's token is classified by prefix rather than by exact
  // equality on the head. Row 12's Quality Manager cell is the live case: it
  // starts with `Allowed` and its token is not `Allowed`.
  // PLANTED: changed `cell()` in matrix.ts from
  // `CC04_TOKENS.find((t) => t === head)` to
  // `CC04_TOKENS.find((t) => head.startsWith(t))`.
  // RED: expected 'Allowed' to be 'Allowed with conditions' // Object.is equality
  it('row 12’s Quality Manager cell is `Allowed with conditions`, not `Allowed`', () => {
    const qm = cc04Cell(12, 'Quality Manager')
    expect(qm.text.startsWith('Allowed')).toBe(true)
    expect(qm.token).toBe('Allowed with conditions')
    expect(qm.token).not.toBe('Allowed')
    expect(qm.note).toBe('at review time on the anomaly record, with a recorded reason')
  })

  // FAILS IF: a token is not the exact head of its own cell. Asserted over
  // every cell rather than the one interesting cell, because a classifier
  // that is right about row 12 by luck is wrong about the next matrix.
  it('every token is exactly the cell’s own head, split on its own em dash', () => {
    for (const row of CC04_MATRIX) {
      for (const column of CC04_COLUMNS) {
        const c = row.cells[column]
        expect(c.text.split(' — ')[0], `${row.sourceRef} · ${column}`).toBe(c.token)
        expect(CC04_TOKENS).toContain(c.token)
        expect(CC04_TOKEN_OUTCOME[c.token]).toBeDefined()
      }
    }
  })

  // FAILS IF: `Explicitly prohibited` stops being distinguishable from
  // `Explicitly prohibited — …`. That prefix collision is harmless to
  // classify and is the reason the first one looks safe, so it is pinned
  // rather than left to be discovered.
  it('row 12 carries both prefix shapes: a bare prohibition and a noted one', () => {
    expect(cc04Cell(12, 'Tenant Admin').token).toBe('Explicitly prohibited')
    expect(cc04Cell(12, 'Tenant Admin').note).toBe(
      'reclassification is a review-time act on the Delivery Operations Hub anomaly record',
    )
    expect(cc04Cell(12, 'Supervisor').token).toBe('Explicitly prohibited')
    expect(cc04Cell(12, 'Supervisor').note).toBeNull()
  })
})

describe('“Mark evidence reviewed” for the Supervisor: TWO readings, THREE statements', () => {
  const divergence = CC04_DIVERGENCES.find((d) => d.id === 'mark-evidence-reviewed-supervisor')

  // FAILS IF: the three foreign statements are not what the record says they
  // are. Each is read out of ITS OWN table, header-keyed on ITS OWN header —
  // §21.16's has a leading `#` column and §25.4's does not, so a positional
  // read of either lands one column out.
  // PLANTED: changed the §25.4 statement's text in `readings.ts` from
  // `Unavailable` to `Explicitly prohibited` — the reading that would erase
  // the divergence entirely.
  // RED: expected 'Unavailable' to be 'Explicitly prohibited' // Object.is equality
  it('reads the same cell out of all three tables at test time', () => {
    expect(cells(srcLine(36842))[0]).toBe('Mark evidence reviewed')
    expect(cells(srcLine(36842))[columnIndex(OWN_HEADER, 'Supervisor')]).toBe(
      'Explicitly prohibited',
    )

    const cc13 = cells(srcLine(38688))
    expect(cc13[columnIndex(CC13_HEADER, 'Action')]).toBe('Mark evidence reviewed')
    expect(cc13[columnIndex(CC13_HEADER, 'Supervisor')]).toBe('Explicitly prohibited')

    const s254 = cells(srcLine(48450))
    expect(s254[columnIndex(S254_HEADER, 'Action')]).toBe('7 Mark evidence reviewed')
    expect(s254[columnIndex(S254_HEADER, 'Supervisor')]).toBe('Unavailable')

    expect(divergence?.statements.map((s) => s.line)).toEqual([36842, 38688, 48450])
  })

  // FAILS IF: three STATEMENTS are recorded as three READINGS. The dispatch
  // that commissioned this module said "three different statuses across three
  // matrices" and then listed `Explicitly prohibited`, `Explicitly
  // prohibited`, `Unavailable`. Two of the three agree. This gate holds the
  // record to two distinct tokens over three statements, and both numbers are
  // derived from the source rather than written down twice.
  // PLANTED: added a fourth reading to the record.
  // RED: type error — `readings` is a fixed-length pair, so a third reading
  // does not compile. Planted again as a change of the §21.16 statement's
  // token to `Read-only`, which does compile.
  // RED: expected 1 to be 2 // Object.is equality
  it('three statements, two distinct tokens, and both are read off the source', () => {
    const supervisorAt = (line: number, header: number): string =>
      cells(srcLine(line))[columnIndex(header, 'Supervisor')] ?? ''
    const observed = [
      supervisorAt(36842, OWN_HEADER),
      supervisorAt(38688, CC13_HEADER),
      supervisorAt(48450, S254_HEADER),
    ]
    expect(observed.length).toBe(3)
    expect(new Set(observed).size).toBe(2)
    expect(divergence?.statements.length).toBe(observed.length)
    expect(new Set(divergence?.statements.map((s) => s.text)).size).toBe(2)
  })

  // FAILS IF: the two tokens stop rendering oppositely, which is the whole
  // reason the divergence matters. Read off `WriteControl` itself rather than
  // asserted in prose: the ABSENT branch tests `explicitlyProhibited` and
  // nothing else does.
  it('the two tokens render oppositely under the build’s one rendering rule', () => {
    const wc = readFileSync(join(process.cwd(), 'src/ui/WriteControl.tsx'), 'utf8')
    expect(wc).toContain("decision.outcome === 'explicitlyProhibited'")
    expect(wc).toContain("kind: 'absent'")
    expect(CC04_TOKEN_OUTCOME['Explicitly prohibited']).toBe('explicitlyProhibited')
    // `Unavailable` is NOT a token of this matrix, which is the divergence.
    expect(CC04_TOKENS).not.toContain('Unavailable')
  })
})

describe('release and request: one act or two, and three tables give three tokens', () => {
  // FAILS IF: the Supervisor's release/request cells drift, in any of the
  // four places the source states them. Every cell is read header-keyed out
  // of its own table.
  // PLANTED: changed row 5's Supervisor cell in `CC04_MATRIX` from
  // `Explicitly prohibited` to `Allowed with conditions`.
  // RED: L36838 · Supervisor: expected 'Explicitly prohibited' to be 'Allowed
  //      with conditions — request only, with a mandatory note'
  it('reads all four statements at test time', () => {
    const sup = columnIndex(OWN_HEADER, 'Supervisor')
    expect(cells(srcLine(36838))[0]).toBe(
      'Release a lot hold, including an automatic Severity 1 hold',
    )
    expect(cells(srcLine(36838))[sup]).toBe('Explicitly prohibited')
    expect(cells(srcLine(36839))[0]).toBe('Request a lot hold release with a note')
    expect(cells(srcLine(36839))[sup]).toBe('Allowed')

    expect(cells(srcLine(38685))[columnIndex(CC13_HEADER, 'Supervisor')]).toBe(
      'Explicitly prohibited — may request with a note',
    )
    expect(cells(srcLine(48447))[columnIndex(S254_HEADER, 'Supervisor')]).toBe(
      'Allowed with conditions — request only, with a mandatory note',
    )
  })

  // FAILS IF: §25.4 is read as carrying a lot-hold REQUEST row. It does not:
  // its single release row folds the request into the Supervisor's condition,
  // which is why the dispatch's "grants the request half to the Supervisor
  // only" is imprecise — §25.4's Quality Manager cell is silent on the
  // request, not denying it. §25.4 does carry a row whose action contains the
  // word "Request" — row 9, an agent re-check — so the filter names the LOT
  // HOLD rather than the verb, and this suite went red on that first.
  it('§25.4 has one lot-hold row and no request row, and its QM release cell is bare', () => {
    const rows = dataRows(S254_SEPARATOR)
    const action = columnIndex(S254_HEADER, 'Action')
    expect(rows.length).toBe(13)
    const lotHoldRows = rows.filter((r) => (r.cells[action] ?? '').includes('lot hold'))
    expect(lotHoldRows.map((r) => r.line)).toEqual([48447])
    expect(lotHoldRows[0]?.cells[action]).toBe('4 Release a lot hold')
    expect(cells(srcLine(48447))[columnIndex(S254_HEADER, 'Quality Manager')]).toBe('Allowed')
    // This module's own matrix splits the same act across two rows.
    expect(
      dataRows(OWN_SEPARATOR).filter((r) => (r.cells[0] ?? '').includes('lot hold')).length,
    ).toBe(2)
  })

  // FAILS IF: anything in this module derives an "awaiting Quality Manager"
  // count. The reason is read off the source — the Quality Manager is
  // `Allowed` on BOTH rows — so the gate cannot be satisfied by the constant
  // alone, and `FUNC-CC-0404-1-2` is checked as the third agreeing statement.
  // PLANTED: flipped `CC04_UNCOMPUTED_COUNT.computed` to `true`.
  // RED: expected true to be false // Object.is equality
  it('the Quality Manager holds both halves, so the count is not computed', () => {
    const qm = columnIndex(OWN_HEADER, 'Quality Manager')
    expect(cells(srcLine(36838))[qm]).toBe('Allowed')
    expect(cells(srcLine(36839))[qm]).toBe('Allowed')
    expect(srcLine(36990)).toContain('FUNC-CC-0404-1-2')
    expect(srcLine(36990)).toContain('Roles allowed: Supervisor, Quality Manager.')
    expect(CC04_UNCOMPUTED_COUNT.computed).toBe(false)
  })
})

describe('AC-CC-221 and row 12 are a boundary, not a contradiction', () => {
  // FAILS IF: the criterion is quoted as something it does not say. Read
  // whole off L37000 — the word `displayed` is what makes it a rendering
  // rule, and the sentence names a server value and an agent value as the
  // things that may not override it. A Quality Manager at review time is
  // neither.
  // PLANTED: changed `criterionLine` from 37000 to 37001 (`AC-CC-222`).
  // RED: expected '- `AC-CC-222` — The containment checklist is rendered from configuration…' to contain 'AC-CC-221'
  it('L37000 governs the DISPLAY and names no actor who may reclassify', () => {
    const ac = srcLine(CC04_SEVERITY_BOUNDARY.criterionLine)
    expect(ac).toContain('AC-CC-221')
    expect(ac).toContain(
      'Severity displayed always equals the on-device classification; no server-side or agent value overrides it.',
    )
    expect(ac).toContain('displayed')
    expect(ac.toLowerCase()).not.toContain('reclassif')
    expect(CC04_SEVERITY_BOUNDARY.isContradiction).toBe(false)
  })

  // FAILS IF: the row it is paired with stops granting the act elsewhere.
  // The grant and its destination are on the same line, in two different
  // columns, and the destination is only in the Tenant Admin cell.
  it('L36845 grants the act at review time on the Hub anomaly record', () => {
    const row = cells(srcLine(CC04_SEVERITY_BOUNDARY.rowLine))
    expect(row[0]).toBe('Reclassify severity')
    expect(row[columnIndex(OWN_HEADER, 'Quality Manager')]).toBe(
      'Allowed with conditions — at review time on the anomaly record, with a recorded reason',
    )
    expect(row[columnIndex(OWN_HEADER, 'Tenant Admin')]).toContain(
      'Delivery Operations Hub anomaly record',
    )
    expect(srcLine(CC04_SEVERITY_BOUNDARY.alsoStatedAt)).toContain('**Reclassification.**')
  })

  // FAILS IF: L49578 is recorded as a REPEAT of L36845, which the dispatch
  // called it. The two tables have different subjects and different column
  // sets: §26.7's columns are SURFACES and §21.7's are PERSONAS, so
  // `Tenant Admin` does not resolve in §26.7's header at all.
  it('§26.7’s L49578 is a record-type row, not a repeat of the persona row', () => {
    const header267 = cells(srcLine(S267_HEADER))
    expect(header267[0]).toBe('Record type')
    expect(header267).toContain('Client Command Center')
    expect(header267).not.toContain('Tenant Admin')
    expect(header267).not.toContain('Quality Manager')

    const row = cells(srcLine(49578))
    expect(row[0]).toBe('Deviation classification')
    expect(row[columnIndex(S267_HEADER, 'Client Command Center')]).toBe(
      'Allowed with conditions — Quality Manager reclassification with a recorded reason at review time',
    )
    // The destination is stated only on L36845; §26.7's row does not carry it.
    expect(row[columnIndex(S267_HEADER, 'Client Command Center')]).not.toContain('anomaly record')
    expect(dataRows(S267_SEPARATOR).length).toBe(26)
  })
})

describe('row 12 is the one act held elsewhere, and this module spells no link of its own', () => {
  // FAILS IF: this module invents a link rather than consuming task 5's. Both
  // cells are already registered there, both require a `link`, and both point
  // at L36845.
  // PLANTED: changed `sourceRequires` on
  // `cc-04-reclassify-severity-quality-manager` from `'link'` to `'control'`
  // in link-outs.ts — the misclassification the shared guard exists for.
  // RED: expected 'control' to be 'link' // Object.is equality
  it('both of row 12’s link-bearing cells are registered by task 5 and require a link', () => {
    const mine = CC_LINK_OUT_CELLS.filter((c) => c.moduleId === CC04_MODULE.id)
    expect(mine.map((c) => c.id).sort()).toEqual([
      'cc-04-reclassify-severity-quality-manager',
      'cc-04-reclassify-severity-tenant-admin',
    ])
    for (const c of mine) {
      expect(c.line).toBe(36845)
      expect(c.capability).toBe(cc04Row(CC04_ROW_HELD_ELSEWHERE).capability)
      expect(c.sourceRequires).toBe('link')
      expect(c.rowText).toBe(srcLine(36845))
      expect(cellTextOf(c)).toBe(cc04Cell(CC04_ROW_HELD_ELSEWHERE, c.column).text)
    }
  })

  // FAILS IF: this module grows its own anchor. `MOD-CC-02` shipped a local
  // `ManualCloseLink` over a raw `<a href>` for exactly this shape, and the
  // shared component exists so there is not a second one.
  // PLANTED: added `<a href="/hub">Open the Hub</a>` to
  // `DeviationWorkspace.tsx`.
  // RED: expected [ 'DeviationWorkspace.tsx' ] to deeply equal []
  it('no file under cc-04 draws its own anchor or imports next/link', () => {
    const dir = join(process.cwd(), 'src/surfaces/cc/modules/cc-04')
    const offenders = readdirSync(dir)
      .filter((f) => !isForeignProbe(f))
      .filter((f) => {
        const text = readFileSync(join(dir, f), 'utf8')
        return /<a\s/.test(text) || text.includes("from 'next/link'")
      })
    expect(offenders).toEqual([])
  })
})

describe('the hold is the live model’s per-device row, consumed and not restated', () => {
  // FAILS IF: the per-device obligation is copied instead of read. The
  // assignment is looked up through task 2's own accessor, and its cells are
  // then checked against L35897 — so a local copy that drifted from the table
  // could not pass, and neither could a table row that lost `perDevice`.
  // PLANTED: changed `perDevice` on `Hold per-device confirmation state` from
  // `true` to `false` in live/model.ts.
  // RED: expected false to be true // Object.is equality
  it('L35897 assigns it to MOD-CC-04, Refreshed, with a per-device obligation', () => {
    const row = cells(srcLine(35897))
    expect(row[0]).toBe('Hold per-device confirmation state')
    expect(row[1]).toBe('MOD-CC-04')
    const a = ccElementAssignment('Hold per-device confirmation state')
    expect(a.classCell).toBe(row[2])
    expect(a.markerObligation).toBe(row[3])
    expect(a.markerObligation).toBe('Per-device timestamps')
    expect(a.perDevice).toBe(true)
    expect(a.modules).toContain(CC04_MODULE.id)
  })

  // FAILS IF: `in force` can be reached without every device confirming, or
  // an empty device set is promoted. Both are task 4's rules and are asserted
  // here because this module is where they bind on screen — AC-CC-223.
  it('AC-CC-223 (L37002) is the rule the roll-up already implements', () => {
    expect(srcLine(37002)).toContain('AC-CC-223')
    expect(srcLine(37002)).toContain('in force only when every relevant device has confirmed')
  })
})

describe('the closed set of ten, and the rail this screen mounts', () => {
  // FAILS IF: §21.16's matrix is read as anything but ten rows. The closed set
  // is ten and this screen exercises five of them, so the denominator is
  // asserted off the source rather than off the constant.
  // PLANTED: deleted row 9 from `CC13_OWNING_PLACES` in `action-set.ts` — the
  // row whose `Executes via` column names no owning place, and so the one a
  // reader is most likely to drop as noise.
  // RED: expected 9 to be 10 // Object.is equality
  it('§21.16 carries ten data rows, walked from its own separator', () => {
    const rows = dataRows(CC13_SEPARATOR)
    expect(rows.length).toBe(10)
    expect(rows[0]?.line).toBe(38682)
    expect(cells(srcLine(CC13_HEADER))[0]).toBe('#')
    // The shipping constant this screen's rail reads is bound to that count,
    // so the gate has a real file to go red on rather than only a source fact.
    expect(CC13_OWNING_PLACES.length).toBe(rows.length)
  })

  // FAILS IF: this screen stops mounting `MOD-CC-13`'s rail. `MOD-CC-13` owns
  // no route and no path under `app/`, so a rail waiting for its own module to
  // mount it is mounted nowhere — the `cc-10-s366` shape reached by two files
  // each correctly declining. L38793 assigns it to the seven screens that
  // exercise the ten, and this module is the widest of the seven.
  // PLANTED: removed the `actionRail={…}` prop from the route file.
  // RED: expected false to be true // Object.is equality
  it('the route mounts Cc13ActionRail and L38793 names this module for five of the ten', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC04_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes('Cc13ActionRail')).toBe(true)
    expect(page.includes('actionRail=')).toBe(true)
    // The CARD treatment is a different component and is not what mounts here.
    expect(page.includes("from '@/surfaces/cc/actions/ActionRail'")).toBe(false)

    const l38793 = srcLine(38793)
    expect(l38793).toContain('`MOD-CC-04` for 1, 2, 4, 7 and 9')
    // Seven modules named, and this one is among them.
    const named = [...l38793.matchAll(/`(MOD-CC-\d+)` for /g)].map((m) => m[1])
    expect(named.length).toBe(7)
    expect(named).toContain('MOD-CC-04')
    // L36943 states this module's five independently of L38793.
    expect(srcLine(36943)).toContain('exercises actions 1, 2, 4, 7 and 9 of `MOD-CC-13`')
  })
})

describe('the module’s own identity, the slug, and the route that carries it', () => {
  // FAILS IF: the slug is typed rather than derived, or the directory is
  // named something else. `CC_NAV` publishes this pathname from the spine and
  // the generator reads a declared slug with no directory as "declared, not
  // built".
  // PLANTED: renamed `app/command-center/deviation-workspace` to
  // `app/command-center/deviation-workspace-x`.
  // RED: expected false to be true // Object.is equality (statSync guard)
  it('the spine declares `deviation-workspace` and a directory of that name is on disk', () => {
    expect(CC04_MODULE.id).toBe('MOD-CC-04')
    expect(CC04_SLUG).toBe(CC04_MODULE.slug)
    const dir = join(process.cwd(), 'app', 'command-center', CC04_SLUG)
    expect(statSync(dir).isDirectory()).toBe(true)
    expect(statSync(join(dir, 'page.tsx')).isFile()).toBe(true)
  })

  // FAILS IF: the route ships without saying what it is. A module demonstrated
  // by its slug claim alone never names itself, and `SCR-CC-10`'s page shipped
  // that way. The identifier is asserted in the file's TEXT, because that is
  // what `scripts/build-registries.mjs` reads.
  //
  // A BARE `includes` HERE WAS A GATE THAT COULD NOT FAIL, and the plant found
  // it rather than the review. This file quotes L38793, which names SEVEN
  // module ids including this one, so deleting every sentence in which the
  // page names its OWN module left the quotation behind and the check passed.
  // The gate therefore requires an occurrence on a line that names no OTHER
  // Command Center module — a page naming itself only inside a list of seven
  // has not said what it is.
  // PLANTED: replaced all three of the page's own mentions of `MOD-CC-04`
  // with "this module", leaving only the L38793 quotation.
  // RED: expected 0 to be greater than 0
  it('the route file names MOD-CC-04 on a line about no other module', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC04_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes(CC04_SCREEN.id)).toBe(true)
    const own = page
      .split('\n')
      .filter((l) => l.includes(CC04_MODULE.id))
      .filter((l) => {
        const others = [...l.matchAll(/MOD-CC-\d+/g)].map((m) => m[0])
        return others.every((o) => o === CC04_MODULE.id)
      })
    expect(own.length).toBeGreaterThan(0)
  })

  // FAILS IF: the spine's identity locator stops carrying the identity line.
  it('the spine’s sourceRef for this module is its own identity line', () => {
    expect(srcLine(Number(CC04_MODULE.sourceRef.slice(1)))).toContain('**Identity.**')
    expect(srcLine(Number(CC04_MODULE.sourceRef.slice(1)))).toContain('`MOD-CC-04`')
    expect(srcLine(Number(CC04_SCREEN.registerRef.slice(1)))).toContain('SCR-CC-05')
    expect(srcLine(Number(CC04_SCREEN.registerRef.slice(1)))).toContain('MOD-CC-04 all features')
  })
})

describe('the disciplines this slice pays for', () => {
  const OWN_FILES = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-04'))
    .filter((f) => !isForeignProbe(f))
    .map((f) => join('src/surfaces/cc/modules/cc-04', f))

  // FAILS IF: a closed vocabulary is annotated `readonly T[]` instead of
  // `as const satisfies readonly T[]`. The release gate has caught that
  // eighteen times across two slices.
  // PLANTED: changed `CC04_TOKENS` to
  // `export const CC04_TOKENS: readonly string[] = [...]`.
  // RED: expected [ Array(1) ] to deeply equal []
  it('every exported array literal is `as const satisfies`', () => {
    const offenders = OWN_FILES.filter((f) => {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      return /^export const \w+:\s*readonly [^=]*=\s*\[/m.test(text)
    })
    expect(offenders).toEqual([])
  })

  // FAILS IF: a file here acquires `'use client'` while exporting plain data
  // a server component reads. Four Run Player panels shipped an undefined
  // module id in slice 7 exactly that way, invisible to every component test.
  // PLANTED: added `'use client'` to the head of `matrix.ts`.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no file here is a client module', () => {
    const offenders = OWN_FILES.filter((f) =>
      /^'use client'/m.test(readFileSync(join(process.cwd(), f), 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  // FAILS IF: a comment here spells a line number that does not carry what
  // the comment says it carries. `tests/coverage/locator-fidelity.test.ts`
  // lexes any `L`-number as a citation; this is the same rule applied to the
  // one thing that suite cannot check, which is whether the line is BLANK.
  // PLANTED: added a comment to `matrix.ts` citing, as the matrix header, the
  // blank line the commissioning dispatch gave as the card's end. The line
  // number is not written here: a knowingly-false citation describing a
  // PLANTED defect is still a knowingly-false citation, and this suite has
  // already gone red once on this module's own first draft, which spelled two
  // blank lines in prose that correctly called them blank.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no L-number cited in this module’s own files is a blank line', () => {
    const offenders: string[] = []
    for (const f of [...OWN_FILES, join('app/command-center', CC04_SLUG, 'page.tsx')]) {
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
 * FIX STREAM H, ROUND 3 — `DEC-TACC-001` ON MOD-CC-04, GATED.
 *
 * The decision is the source's own, raised under its own identifier, and it
 * governs this module's `MTX-TEN-02c` cell through condition `[K1]`. Until
 * `CC04_TACC_DISCLOSURE` landed, this module carried no record of it — the Tenant Admin
 * column of its own card reads `Explicitly prohibited` on every row, and a
 * column that repeats itself 12 times reads as an answer rather than as
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

describe('fix stream H round 3: DEC-TACC-001 on MOD-CC-04', () => {
  // FAILS IF: any quoted cell stops being what the frozen source carries at
  // that line and column.
  // PLANTED: changed the `MTX-TEN-02c` statement's text from
  // '`Read-only` `[K1]`' to '`Explicitly prohibited`', the value that would erase the divergence.
  // RED: L22061 column "Tenant Admin" is not what the record quotes —
  // expected '`Read-only` `[K1]`' to be '`Explicitly prohibited`'
  it('quotes every statement verbatim, cell by cell and column by name', () => {
    const statements: readonly {
      readonly text: string
      readonly line: number
      readonly column: string | null
      readonly headerLine: number | null
    }[] = CC04_TACC_DISCLOSURE.statements
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
  // PLANTED: changed the record's `module` from 'MOD-CC-04' to 'MOD-CC-01'.
  // RED: expected '`MOD-CC-01`' to be '`MOD-CC-04`'
  it('cites its own MTX-TEN-02c row, and the whole card column that answers it', () => {
    expect(taccCells(22_056)[0]).toBe('#')
    expect(taccCells(22061)[0]).toBe('`MOD-CC-04`')
    expect(CC04_TACC_DISCLOSURE.module).toBe('MOD-CC-04')
    const ta = taccColumn(36832, 'Tenant Admin')
    const first = 36832 + 2
    const column: string[] = []
    for (let n = first; (TACC_LINES[n - 1] ?? '').trimStart().startsWith('|'); n += 1) {
      column.push(taccCells(n)[ta] ?? '')
    }
    expect(column.length).toBe(12)
    expect(column.every((c) => c.startsWith('Explicitly prohibited'))).toBe(true)
  })

  // FAILS IF: the register row this build transcribes stops being the one the
  // record cites, or starts naming the Tenant Admin. The register is the
  // reading the build derives from, so this is the assertion that the
  // derivation still has a source.
  // PLANTED: changed the record's second reading locator line from L48390
  // to L48391.
  // RED: expected 'SCR-CC-06' to be 'SCR-CC-05'
  it('the screen register row names no Tenant Admin, and this build agrees', () => {
    expect(taccCells(48390)[0]).toBe('SCR-CC-05')
    const roles = taccCells(48390)[taccColumn(48_384, 'Roles that can open it')] ?? ''
    expect(roles).not.toContain('Tenant Admin')
    expect(CC04_TACC_DISCLOSURE.readings[1]?.locator).toContain('L48390')
    expect(ccScreen('SCR-CC-05').rolesThatCanOpen as readonly string[]).not.toContain(
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
    const raised = TACC_LINES[CC04_TACC_DISCLOSURE.cardLine - 1] ?? ''
    expect(raised).toContain('DEC-TACC-001')
    expect(raised).toContain("the Tenant Admin's Client Command Center presence")
    for (const option of CC04_TACC_DISCLOSURE.options) {
      expect(raised, `option "${option}" is not on the card line`).toContain(option)
    }
    expect(raised).toContain(CC04_TACC_DISCLOSURE.recommendation)
    expect(CC04_TACC_DISCLOSURE.adopted).toBe(false)
    expect(taccCells(CC04_TACC_DISCLOSURE.registerRowLine)[0]).toBe('`DEC-TACC-001`')

    const working = TACC_LINES[CC04_TACC_DISCLOSURE.workingPositionRef - 1] ?? ''
    expect(working).toContain('DEC-TACC-001')
    expect(working).toContain(CC04_TACC_DISCLOSURE.workingPosition)

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
    expect(underK1.map((r) => r.line)).toContain(22061)

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
    expect(CC04_TACC_DISCLOSURE.readings.length).toBe(2)
    for (const reading of CC04_TACC_DISCLOSURE.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
      expect(reading.text.length).toBeGreaterThan(80)
    }
    expect(CC04_TACC_DISCLOSURE.notResolved.length).toBeGreaterThan(40)
    expect(CC04_TACC_DISCLOSURE.wouldChange.length).toBeGreaterThan(40)
  })
})
