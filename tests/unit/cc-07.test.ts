import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC_WRITES_OUTSIDE_THE_TEN } from '@/surfaces/cc/actions/outside-writes'
import {
  CC07_COLUMNS,
  CC07_MATRIX,
  CC07_MODULE,
  CC07_OUTSIDE_WRITE_ROWS,
  CC07_ROW_BINDS_EVERY_MODULE,
  CC07_ROW_LEARNING_READ_VIEW,
  CC07_SCREEN,
  CC07_SLUG,
  CC07_TOKENS,
  CC07_TOKEN_OUTCOME,
  cc07Cell,
  cc07Row,
} from '@/surfaces/cc/modules/cc-07/matrix'
import { OWN_OUTSIDE_WRITE_ACTS } from '@/surfaces/cc/modules/cc-07/FeedbackSignalCapture'
import { CC07_DIVERGENCES, CC07_GAPS, cc07Divergence } from '@/surfaces/cc/modules/cc-07/readings'

/**
 * `MOD-CC-07` — §21.10, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * Nothing below compares a string this task wrote against another string this
 * task wrote, and **no count is taken from the array under test**: "seven
 * rows" is obtained by walking the source's own table from its separator to
 * the first line that is not a table row, never from `CC07_MATRIX.length` and
 * never by subtracting the ends of a span written in a dispatch.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — the
 * defect planted into the real shipping file, the red observed, then reversed
 * and verified byte-identical against a baseline captured BEFORE the first
 * plant. Each `PLANTED` note names the defect that was actually planted, never
 * a convenient one. Where two guards cover the same defect, the removal of
 * EACH and of BOTH was planted, because redundant protections cannot be
 * verified one at a time.
 *
 * BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE THAT ARE LIVE RISKS HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and this table has a
 *    SECOND shape of the same trap: row 6's Quality Manager cell is a BARE
 *    `Allowed` carrying its condition in the note, where §21.7 spells the same
 *    shape as `Allowed with conditions — …`. Every comparison below is an
 *    anchored equality on the cell head, never `startsWith` and never
 *    `includes`.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR, which splits
 *    into non-empty cells like any other row. Every walk starts AFTER the
 *    separator and excludes it by position, not by content.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Two columns of this matrix
 *    read `Explicitly prohibited` on all seven rows, so a count of "fourteen
 *    prohibitions" is true however those two columns are permuted. Every cell
 *    gate below names its ROW and its COLUMN, read off the source's own header.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Every column index is
 *    resolved from its header line BY NAME at test time, in this table and in
 *    the five foreign tables.
 *  - A `page.includes('MOD-CC-07')` CHECK SATISFIED BY A QUOTATION. This
 *    route's file quotes L38793, which names seven module ids, and mounts
 *    `MOD-CC-06`'s half by name. The gate therefore requires an occurrence on
 *    a line naming no OTHER `MOD-CC-*`.
 *  - A DEPENDENCY OR REACHABILITY CHECK THAT UNDER-REPORTS. The reachability
 *    walk below matches `from` across newlines, because the regex two tasks
 *    independently wrote — `from` on the `import` line — cannot see a
 *    multi-line import and goes green on a broken chain.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking; §21.10 omits them and MTX-TEN-02c uses them. */
const unticked = (s: string): string => s.replaceAll('`', '')

/** MTX-TEN-02c hangs a `[K*]` condition key off its tokens. Stripped only where it is read. */
const withoutKey = (s: string): string => s.replace(/\s*\[K\d+\]\s*$/, '')

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
const OWN_HEADER = 37503
const OWN_SEPARATOR = 37504
const OWN_FIRST_ROW = 37505
const OWN_LAST_ROW = 37511

/** The five foreign tables that answer one of this module's questions. */
const MTX_TEN_02C_HEADER = 22056
const MTX_TEN_02C_SEPARATOR = 22057
const MTX_TEN_02C_OWN_ROW = 22064
const REGISTER_HEADER = 48384
const SURFACE_MATRIX_HEADER = 35002
const SURFACE_MATRIX_SEPARATOR = 35003
const CLASS_ASSIGN_SEPARATOR = 35883
const INVENTORY_HEADER = 47520
const INVENTORY_SEPARATOR = 47521
const DECISION_TABLE_HEADER = 60819

describe('the matrix is seven rows, counted off the source', () => {
  // FAILS IF: the transcription gains or loses a row. The count comes from
  // walking the SOURCE from its separator, so it cannot be satisfied by the
  // model's own length, and the separator is excluded by position.
  // PLANTED: deleted row 3 (`Annotate a handoff-brief item`) from CC07_MATRIX.
  // RED: expected 6 to be 7 // Object.is equality
  it('walks seven data rows from L37504 and the model carries the same seven', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(7)
    expect(CC07_MATRIX.length).toBe(rows.length)
    expect(rows[0]?.line).toBe(OWN_FIRST_ROW)
    expect(rows[rows.length - 1]?.line).toBe(OWN_LAST_ROW)
  })

  // FAILS IF: the body is read as running past its end, which is how a span
  // becomes a count. The line after the last data row is blank and the one
  // after that opens `**Preconditions.**` at L37513, so the walk above stops
  // for a reason the source states rather than one a dispatch asserted.
  it('stops where the source stops, one line short of the preconditions paragraph', () => {
    expect(isTableRow(srcLine(OWN_LAST_ROW + 1))).toBe(false)
    expect(srcLine(OWN_LAST_ROW + 1)).toBe('')
    expect(srcLine(37513).startsWith('**Preconditions.**')).toBe(true)
  })

  // FAILS IF: a dispatch's card span is copied into this build as though it
  // were read. The line that dispatch gave as the card's end is BLANK and sits
  // ABOVE the matrix this file transcribes, so it cannot end a card whose
  // matrix begins at L37503 and whose closing rule is at L37632. The wrong end
  // line is not spelled anywhere in this build: `locator-fidelity` refuses a
  // citation of a blank line even inside a sentence saying the line is blank.
  it('the card runs past the blank line the dispatch gave as its end', () => {
    expect(srcLine(37471)).toContain('21.10 Module')
    expect(srcLine(37471)).toContain('MOD-CC-07')
    expect(srcLine(OWN_HEADER - 3)).toBe('')
    expect(srcLine(37501)).toBe('**Roles that see and use it, and their permissions.**')
    expect(srcLine(37632)).toBe('---')
    expect(srcLine(37634).startsWith('## 21.11')).toBe(true)
  })
})

describe('the columns are the header line’s own, in the header line’s own order', () => {
  // FAILS IF: the transcription is read positionally against the Frontline
  // habit, which opens on Worker. The expected list is READ FROM L37503 at
  // test time, so it cannot be satisfied by a constant this task also wrote.
  // PLANTED: swapped 'Tenant Admin' and 'Worker' in CC07_COLUMNS.
  // RED: expected [ 'Worker', 'Supervisor', …(3) ] to deeply equal [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('reads Tenant Admin first and Worker last, off L37503', () => {
    const header = cells(srcLine(OWN_HEADER))
    expect(header[0]).toBe('Capability on this module')
    expect([...CC07_COLUMNS]).toEqual(header.slice(1))
    expect(header[1]).toBe('Tenant Admin')
    expect(header[header.length - 1]).toBe('Worker')
  })

  // FAILS IF: a column is dropped from the model, which would let a persona's
  // cells go untranscribed. `satisfies Record<Cc07Column, RoleId>` proves
  // totality at compile time; this proves the compile-time claim is about the
  // SOURCE's columns and not about a list that drifted from them.
  it('every source column has a model column and no model column is invented', () => {
    const header = cells(srcLine(OWN_HEADER)).slice(1)
    for (const name of header) expect(CC07_COLUMNS).toContain(name)
    for (const name of CC07_COLUMNS) expect(header).toContain(name)
  })
})

describe('every one of the thirty-five cells is verbatim, header-keyed', () => {
  // FAILS IF: any cell text drifts from the source, in any row, in any column.
  // Row and column are both resolved by NAME, so a permutation of the two
  // all-prohibited columns cannot pass by arithmetic.
  // PLANTED: changed row 6's Supervisor cell from
  // 'Read-only — through the learning read view' to 'Allowed' — the cell whose
  // token is the only `Read-only` in the table and whose grant is the whole of
  // the SCR-CC-13 roles divergence.
  // RED: L37510 · Supervisor: expected 'Read-only — through the learning read
  //      view' to be 'Allowed' // Object.is equality
  it('matches L37505-L37511 cell for cell', () => {
    const rows = dataRows(OWN_SEPARATOR)
    for (const row of CC07_MATRIX) {
      const src = rows.find((r) => r.line === Number(row.sourceRef.slice(1)))
      expect(src, `no source row at ${row.sourceRef}`).toBeDefined()
      expect(src?.cells[0]).toBe(row.capability)
      for (const column of CC07_COLUMNS) {
        const i = columnIndex(OWN_HEADER, column)
        expect(src?.cells[i], `${row.sourceRef} · ${column}`).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: a row's declared line does not carry that row. A `sourceRef` that
  // points anywhere is the citation defect this build has been bitten by eleven
  // times, and it is separable from the cell check above because a uniformly
  // shifted set of refs would still match cell for cell.
  // PLANTED: row 1's sourceRef 'L37505' -> 'L37506' — a REAL row of this same
  // table, not a nonsense line, so the ref still resolves and still parses.
  // RED: expected 'Mark a prior case relevant or not rel…' to be 'Produce a
  //      gate-decision signal' // Object.is equality
  //
  // REDUNDANT PROTECTIONS, PLANTED SEPARATELY AND TOGETHER. This gate and the
  // cell-for-cell gate above both cover a broken transcription, so each was
  // removed alone and then both at once. Alone: the cell gate reds on the row-6
  // cell plant and this one stays green; this gate reds on the sourceRef plant
  // and the cell gate reds too. TOGETHER (row 6 -> `Allowed` AND L37510 ->
  // L37509): BOTH red — expected 'Produce a learned-change decision sig…' to
  // be 'See the aggregated effect of feedback'.
  it('each row’s sourceRef line carries that row’s own capability in column one', () => {
    for (const row of CC07_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      expect(isTableRow(srcLine(line))).toBe(true)
      expect(cells(srcLine(line))[0]).toBe(row.capability)
    }
  })

  // FAILS IF: the ordinals stop being the source's own row order. Separable
  // from both gates above: a model whose rows were reordered but whose
  // sourceRefs travelled with them satisfies each of those and not this one.
  it('the ordinals run 1..7 in source-line order', () => {
    expect(CC07_MATRIX.map((r) => r.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7])
    const linesOf = CC07_MATRIX.map((r) => Number(r.sourceRef.slice(1)))
    expect(linesOf).toEqual([...linesOf].sort((a, b) => a - b))
    expect(linesOf[0]).toBe(OWN_FIRST_ROW)
  })
})

describe('`Allowed` is a prefix of `Allowed with conditions`, and this table has a second shape', () => {
  // FAILS IF: row 6's Quality Manager cell stops being a bare `Allowed` with
  // its condition in the note — the OPPOSITE shape to §21.7's, where the same
  // qualified grant is spelled `Allowed with conditions — …`. A normaliser that
  // wrote one into the other would lose the distinction between the two tables'
  // vocabularies, which is what the divergence record is about.
  it('row 6’s Quality Manager cell is a bare `Allowed` with its condition in the note', () => {
    const qm = cc07Cell(CC07_ROW_LEARNING_READ_VIEW, 'Quality Manager')
    expect(qm.token).toBe('Allowed')
    expect(qm.note).toBe('through the learning read view')
    expect(qm.text).toBe('Allowed — through the learning read view')
    // The token vocabulary of §21.7 is NOT this table's, and that is the point.
    expect(CC07_TOKENS).not.toContain('Allowed with conditions')
    expect(dataRows(OWN_SEPARATOR).some((r) => r.cells.includes('Allowed with conditions'))).toBe(
      false,
    )
  })

  // FAILS IF: a token is not the exact head of its own cell. Asserted over
  // every cell rather than the one interesting cell, because a classifier that
  // is right about row 6 by luck is wrong about the next matrix.
  it('every token is exactly the cell’s own head, split on its own em dash', () => {
    for (const row of CC07_MATRIX) {
      for (const column of CC07_COLUMNS) {
        const c = row.cells[column]
        expect(c.text.split(' — ')[0], `${row.sourceRef} · ${column}`).toBe(c.token)
        expect(CC07_TOKENS).toContain(c.token)
        expect(CC07_TOKEN_OUTCOME[c.token]).toBeDefined()
      }
    }
  })

  // FAILS IF: the classifier stops testing the head for EXACT equality.
  //
  // THE OBVIOUS GATE HERE COULD NOT FAIL AND THE PLANT PROVED IT. Rewriting
  // `cell()` from `t === head` to `head.startsWith(t)` left all thirty-nine
  // tests green, because this table's three tokens contain no proper prefix of
  // one another: `Allowed with conditions` is not in its vocabulary at all, so
  // a prefix classifier and an exact one agree on every one of these
  // thirty-five cells. The guard is still right — the shape is what protects
  // the NEXT matrix — so it is gated on the two things that CAN fail: the
  // classifier's own text, and the vocabulary property that makes a prefix
  // test safe here. If a later hand adds `Allowed with conditions` to
  // CC07_TOKENS, the second assertion goes red before the first can matter.
  // PLANTED: `CC07_TOKENS.find((t) => t === head)` ->
  // `CC07_TOKENS.find((t) => (head ?? '').startsWith(t))`.
  it('the classifier compares the head for exact equality, and no token prefixes another', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/surfaces/cc/modules/cc-07/matrix.ts'),
      'utf8',
    )
    expect(src).toContain('CC07_TOKENS.find((t) => t === head)')
    expect(/CC07_TOKENS\.find\(\([^)]*\) => [^)]*startsWith/.test(src)).toBe(false)
    for (const a of CC07_TOKENS) {
      for (const b of CC07_TOKENS) {
        if (a === b) continue
        expect(b.startsWith(a), `"${a}" is a proper prefix of "${b}"`).toBe(false)
      }
    }
  })

  // FAILS IF: `Explicitly prohibited` stops being distinguishable from
  // `Explicitly prohibited — …`. Row 7 is where the Tenant Admin's cell carries
  // a note and the Worker's does not, which is the ONE place a Frontline-order
  // positional read would show — on six of the seven rows the two are
  // character-identical and the swap is silent.
  it('row 7 carries both prefix shapes, and it is the only row where they differ', () => {
    const ta = cc07Cell(CC07_ROW_BINDS_EVERY_MODULE, 'Tenant Admin')
    const worker = cc07Cell(CC07_ROW_BINDS_EVERY_MODULE, 'Worker')
    expect(ta.token).toBe('Explicitly prohibited')
    expect(ta.note).toBe('no such gating exists for any role')
    expect(worker.token).toBe('Explicitly prohibited')
    expect(worker.note).toBeNull()
    const identical = CC07_MATRIX.filter(
      (r) => r.cells['Tenant Admin'].text === r.cells.Worker.text,
    )
    expect(identical.length).toBe(6)
    expect(identical.map((r) => r.ordinal)).not.toContain(CC07_ROW_BINDS_EVERY_MODULE)
  })

  // FAILS IF: the token vocabulary drifts. Three tokens, and `Read-only`
  // appears exactly once — read off the SOURCE rows, not off the model.
  // PLANTED: added 'Unavailable' to CC07_TOKENS.
  // RED: expected [ 'Allowed', 'Explicitly prohibited', …(2) ] to deeply equal
  //      [ 'Allowed', 'Explicitly prohibited', 'Read-only' ]
  it('three tokens, and `Read-only` is exactly one cell of the thirty-five', () => {
    const heads = dataRows(OWN_SEPARATOR).flatMap((r) =>
      r.cells.slice(1).map((c) => c.split(' — ')[0] as string),
    )
    expect(heads.length).toBe(35)
    expect([...new Set(heads)].sort()).toEqual([...CC07_TOKENS].sort())
    expect(heads.filter((h) => h === 'Read-only').length).toBe(1)
  })
})

describe('MTX-TEN-02c is a FIFTH table, and it is the one that disagrees', () => {
  const d = cc07Divergence('tenant-admin-read-only-or-prohibited')

  // FAILS IF: the module-level row is not what the record says it is. Read
  // header-keyed off L22056 with backticks stripped and the `[K*]` key
  // removed, because that table backticks its tokens and §21.10 does not.
  // PLANTED: the Tenant Admin statement's line, L22064 -> L22063 — MOD-CC-06's
  // row, which carries the same three tokens, so the record would read
  // plausibly and cite the wrong module.
  // RED: expected [ 22063, 37505, 37506, 37507, …(4) ] to deeply equal
  //      [ 22064, 37505, 37506, 37507, …(4) ]
  it('reads L22064 header-keyed and confirms it is this module’s row', () => {
    expect(srcLine(22054)).toContain('MTX-TEN-02c')
    const row = cells(srcLine(MTX_TEN_02C_OWN_ROW))
    expect(row[0]).toBe('MOD-CC-07')
    expect(row[1]).toBe('Feedback signal capture')
    expect(withoutKey(row[columnIndex(MTX_TEN_02C_HEADER, 'Tenant Admin')] ?? '')).toBe('Read-only')
    expect(withoutKey(row[columnIndex(MTX_TEN_02C_HEADER, 'Supervisor')] ?? '')).toBe(
      'Allowed with conditions',
    )
    expect(withoutKey(row[columnIndex(MTX_TEN_02C_HEADER, 'Quality Manager')] ?? '')).toBe(
      'Allowed with conditions',
    )
    // Thirteen rows, walked — the same thirteen modules, at module granularity.
    expect(dataRows(MTX_TEN_02C_SEPARATOR).length).toBe(13)
    // The record's own statement lines are read off the source, never trusted.
    expect(d.statements.map((s) => s.line)).toEqual([
      MTX_TEN_02C_OWN_ROW,
      37505,
      37506,
      37507,
      37508,
      37509,
      37510,
      37511,
    ])
  })

  // FAILS IF: eight statements are recorded as more than two readings, or the
  // capability table's Tenant Admin column stops being uniform. Both numbers
  // are derived from the SOURCE, so a record that renamed its own tokens
  // consistently could not satisfy this by renaming them.
  it('eight statements, two distinct tokens, both read off the source', () => {
    const ta = columnIndex(OWN_HEADER, 'Tenant Admin')
    const own = dataRows(OWN_SEPARATOR).map((r) => (r.cells[ta] ?? '').split(' — ')[0])
    expect(own.length).toBe(7)
    expect(new Set(own).size).toBe(1)
    expect(own[0]).toBe('Explicitly prohibited')
    const moduleLevel = withoutKey(
      cells(srcLine(MTX_TEN_02C_OWN_ROW))[columnIndex(MTX_TEN_02C_HEADER, 'Tenant Admin')] ?? '',
    )
    expect(new Set([...own, moduleLevel]).size).toBe(2)
    expect(d.statements.length).toBe(8)
    expect(new Set(d.statements.map((s) => s.text)).size).toBe(2)
    expect(d.readings.length).toBe(2)
  })

  // FAILS IF: the concentration table is read as a third reading. It is silent
  // on the Tenant Admin for this module, and silence is not a reading — the
  // proof that it CAN name a Tenant Admin non-user is MOD-CC-05's own row.
  it('the concentration table is silent here and explicit two rows above', () => {
    const mine = cells(srcLine(35249))
    expect(mine[0]).toBe('MOD-CC-07 Feedback signal capture')
    expect(mine[1]).toBe('Supervisor')
    expect(mine[2]).toBe('Quality Manager')
    expect(mine[3]).toBe('Read-only Auditor — no access; Worker — no access')
    expect(mine[3]?.includes('Tenant Admin')).toBe(false)
    expect(cells(srcLine(35247))[3]).toContain('Tenant Admin — not an in-shift actor')
  })

  // FAILS IF: the granted-roles divergence stops being about a token this
  // table does not use. [K11]'s whole text is one clause and is read from the
  // conditions line rather than quoted from the record.
  it('[K11] conditions both granted roles identically, where §21.10 separates them', () => {
    expect(srcLine(22072)).toContain('`[K11]` Annotations feed the feedback signal')
    const sup = columnIndex(OWN_HEADER, 'Supervisor')
    const qm = columnIndex(OWN_HEADER, 'Quality Manager')
    const differing = dataRows(OWN_SEPARATOR).filter((r) => r.cells[sup] !== r.cells[qm])
    expect(differing.map((r) => r.line)).toEqual([37505, 37509, 37510])
    expect(cc07Divergence('granted-roles-conditioned-or-plain').statements.map((s) => s.line)).toEqual(
      [MTX_TEN_02C_OWN_ROW, 37505, 37509, 37510],
    )
  })
})

describe('every divergence statement is the text its own line carries', () => {
  // FAILS IF: a statement's TEXT drifts from the line it cites, in any of the
  // five records. THE PER-DIVERGENCE GATES CHECKED ONLY THE LINES AND A PLANT
  // PROVED IT: rewriting the register statement from `Quality Manager` to
  // `Supervisor, Quality Manager` — the reading that erases the SCR-CC-13
  // divergence entirely — left all thirty-nine tests green, because every gate
  // compared line numbers and none compared words. One gate over every
  // statement of every record closes it, and it reads the source rather than
  // the record's own neighbouring field, so a consistently renamed record
  // cannot satisfy it.
  // PLANTED: statement text 'Quality Manager' (L48398) ->
  // 'Supervisor, Quality Manager'.
  it('reads all twenty-one statements back off their own lines', () => {
    let checked = 0
    for (const d of CC07_DIVERGENCES) {
      for (const st of d.statements) {
        expect(unticked(srcLine(st.line)), `${d.id} · L${st.line}`).toContain(st.text)
        checked += 1
      }
    }
    expect(checked).toBe(CC07_DIVERGENCES.reduce((n, d) => n + d.statements.length, 0))
    // TWENTY-ONE, counted: 8 + 4 + 3 + 3 + 3. The first writing of this line
    // said twenty-two, inferred rather than counted, and the first run said so.
    expect(checked).toBe(21)
  })
})

describe('who may open SCR-CC-13: the register says one role and two statements say two', () => {
  const d = cc07Divergence('learning-read-view-supervisor')

  // FAILS IF: any of the three statements drifts. Each is read out of its own
  // place: the register row header-keyed off L48384, this module's row 6
  // header-keyed off L37503, and MOD-CC-06's functionality line by content.
  // PLANTED: the register statement's text, 'Quality Manager' ->
  // 'Supervisor, Quality Manager' — the reading that erases the divergence
  // entirely and reads perfectly plausibly.
  // THIS GATE STAYED GREEN on that plant, because it pins the LINES and not
  // the words; the statement-text gate above is what caught it. Both are kept.
  // RED (statement-text gate): learning-read-view-supervisor · L48398: expected
  //      '| SCR-CC-13 | Learning read view | Re…' to contain 'Supervisor,
  //      Quality Manager'
  it('reads all three statements at test time', () => {
    const reg = cells(srcLine(48398))
    expect(reg[0]).toBe('SCR-CC-13')
    expect(reg[columnIndex(REGISTER_HEADER, 'Roles that can open it')]).toBe('Quality Manager')
    expect(reg[columnIndex(REGISTER_HEADER, 'Modules and features shown')]).toBe(
      'MOD-CC-06 FEAT-CC-0603, MOD-CC-07',
    )

    const row6 = cells(srcLine(37510))
    expect(row6[0]).toBe('See the aggregated effect of feedback')
    expect(row6[columnIndex(OWN_HEADER, 'Supervisor')]).toBe(
      'Read-only — through the learning read view',
    )

    expect(srcLine(37434)).toContain('FUNC-CC-0605-1-1')
    expect(srcLine(37434)).toContain('Roles allowed: Quality Manager, Supervisor read-only')

    expect(d.statements.map((s) => s.line)).toEqual([48398, 37510, 37434])
  })

  // FAILS IF: the shape of the register's roles column is misread. THIS GATE
  // WAS WRITTEN WRONG AND ITS FIRST RUN SAID SO: the claim was "SCR-CC-13 is
  // the only register row naming one role" and THREE rows do — L48391,
  // L48392 and L48398, all three reading `Quality Manager`. The corrected
  // claim is the one the source supports, and it is sharper: every
  // single-role row on this register names the same role, and the other two
  // are the Quality Manager's own landing screens.
  it('three register rows name exactly one role, and all three name the Quality Manager', () => {
    const roles = columnIndex(REGISTER_HEADER, 'Roles that can open it')
    const single = dataRows(48385).filter((r) => !(r.cells[roles] ?? '').includes(','))
    expect(single.map((r) => r.line)).toEqual([48391, 48392, 48398])
    expect(new Set(single.map((r) => r.cells[roles]))).toEqual(new Set(['Quality Manager']))
    expect(single.map((r) => r.cells[0])).toEqual(['SCR-CC-06', 'SCR-CC-07', 'SCR-CC-13'])
  })

  // FAILS IF: the spine's screen record stops carrying the register's own
  // words. That file is another task's and is READ here, never written; the
  // divergence is between the source's statements and is not repaired by
  // editing the transcription of one of them.
  it('the spine carries the register row verbatim and names this module as owner', () => {
    expect(CC07_SCREEN.id).toBe('SCR-CC-13')
    expect(CC07_SCREEN.rolesColumn).toBe(
      cells(srcLine(48398))[columnIndex(REGISTER_HEADER, 'Roles that can open it')],
    )
    expect(CC07_SCREEN.modulesShown).toBe(
      cells(srcLine(48398))[columnIndex(REGISTER_HEADER, 'Modules and features shown')],
    )
    expect(CC07_SCREEN.owningModule).toBe(CC07_MODULE.id)
  })
})

describe('FEAT-CC-0603 names three different things, and one of them is on this screen', () => {
  const d = cc07Divergence('feat-cc-0603-names-three-things')

  // FAILS IF: any of the three names drifts. §21.9's own feature list, §25's
  // inventory row header-keyed off L47520, and §21.9's FEAT-CC-0605.
  // PLANTED: the §25 statement's text, 'The package test' -> 'Aging, never
  // expiry' — L47538's name, one row above, itself a real name of a real row,
  // so it reads as a plausible transcription.
  // RED: expected [ Array(3) ] to deeply equal [ 'Aging', 'The package test',
  //      …(1) ] — and the statement-text gate red beside it:
  //      feat-cc-0603-names-three-things · L47539: expected '| MOD-CC-06 |
  //      Learned-change approval…' to contain 'Aging, never expiry'
  it('reads all three names at test time', () => {
    expect(srcLine(37420)).toBe('- **`FEAT-CC-0603` — Aging.**')
    expect(srcLine(37432)).toBe('- **`FEAT-CC-0605` — The learning read view.**')
    const name = columnIndex(INVENTORY_HEADER, 'Feature name')
    const id = columnIndex(INVENTORY_HEADER, 'Feature identifier')
    const inv = cells(srcLine(47539))
    expect(inv[id]).toBe('FEAT-CC-0603')
    expect(inv[name]).toBe('The package test')
    expect(d.statements.map((s) => s.text)).toEqual(['Aging', 'The package test', 'The learning read view'])
  })

  // FAILS IF: the register's Purpose stops matching FUNC-CC-0605-1-1's own
  // purpose in all but its verb, which is the whole evidence for reading B.
  //
  // THIS GATE WAS WRITTEN AS AN EQUALITY AND ITS FIRST RUN SAID SO. Both this
  // task and the task that owns MOD-CC-06 wrote that the two are the same
  // sentence "verbatim"/"word for word" before either compared the words: the
  // register reads `Read what the platform has learned, changing nothing` and
  // L37434 reads `show what the platform has learned, changing nothing`. It is
  // a near-quotation, and the difference is exactly the wave-0 lesson — a
  // paraphrase that is true of a set can be false of the words. The gate now
  // asserts the shared tail AND the differing verb, so neither half can drift
  // without a red, and it can no longer be satisfied by a real quotation of
  // something else.
  it('the register’s Purpose and FUNC-CC-0605-1-1’s differ in one word, the verb', () => {
    const purpose = cells(srcLine(48398))[columnIndex(REGISTER_HEADER, 'Purpose')] ?? ''
    expect(purpose).toBe('Read what the platform has learned, changing nothing')
    const tail = 'what the platform has learned, changing nothing'
    expect(purpose).toBe(`Read ${tail}`)
    expect(srcLine(37434)).toContain(`Purpose: show ${tail}.`)
    expect(srcLine(37434)).not.toContain(`Purpose: ${purpose}.`)
    // No other functionality in the chapter carries that tail.
    const carriers = LINES.map((l, i) => ({ line: i + 1, l }))
      .filter((x) => x.line >= 34834 && x.line <= 38888 && x.l.includes(`Purpose: `) && x.l.includes(tail))
      .map((x) => x.line)
    expect(carriers).toEqual([37434])
  })

  // FAILS IF: the mechanism of the shift stops being what the record says.
  // §25's inventory is capped at three features per module by its own
  // introductory sentence, and §21.9 specifies five, so two identifiers have
  // no row at all. Both facts are counted off the source.
  // PLANTED: removed the sentence naming the cap from readings.ts reading B.
  // RED (this gate): unaffected — it reads the source. Planted again as a
  // change of the cap to four in the reading's text; the gate below reads the
  // count off the table, so the reading's own prose is checked by the record
  // gate above and the count by this one. Both were watched red separately.
  it('§25’s inventory is three features per module and carries no FEAT-CC-0604 or 0605', () => {
    expect(srcLine(47518)).toContain('Thirteen source-stated modules, thirty-nine features')
    const rows = dataRows(INVENTORY_SEPARATOR)
    expect(rows.length).toBe(39)
    const id = columnIndex(INVENTORY_HEADER, 'Feature identifier')
    const cc06 = rows.filter((r) => r.cells[0] === 'MOD-CC-06')
    expect(cc06.length).toBe(3)
    expect(cc06.map((r) => r.cells[id])).toEqual([
      'FEAT-CC-0601',
      'FEAT-CC-0602',
      'FEAT-CC-0603',
    ])
    expect(rows.some((r) => r.cells[id] === 'FEAT-CC-0604')).toBe(false)
    expect(rows.some((r) => r.cells[id] === 'FEAT-CC-0605')).toBe(false)
    // This module's own three rows are NOT shifted, which is why the shift is
    // MOD-CC-06's and not a property of the table.
    const mine = rows.filter((r) => r.cells[0] === CC07_MODULE.id)
    expect(mine.map((r) => r.cells[id])).toEqual(['FEAT-CC-0701', 'FEAT-CC-0702', 'FEAT-CC-0703'])
  })

  // FAILS IF: the one-step shift stops being demonstrable. Anchored at BOTH
  // ends: L47538's name begins with §21.9's FEAT-CC-0603 name and L47539's is
  // a prefix of §21.9's FEAT-CC-0604 name. Neither is an equality, because the
  // two tables extend and truncate respectively, and asserting equality would
  // go red on a true statement.
  it('the §25 names sit one identifier ahead of §21.9’s, at both ends', () => {
    const name = columnIndex(INVENTORY_HEADER, 'Feature name')
    expect(cells(srcLine(47538))[name]).toBe('Aging, never expiry')
    expect(cells(srcLine(47538))[name]?.startsWith('Aging')).toBe(true)
    expect(srcLine(37420)).toContain('`FEAT-CC-0603` — Aging.')
    expect(srcLine(37424)).toContain('`FEAT-CC-0604` — The package test and application.')
    expect('The package test and application'.startsWith(cells(srcLine(47539))[name] ?? 'x')).toBe(
      true,
    )
  })
})

describe('whether this module carries an open client decision', () => {
  const d = cc07Divergence('open-decision-on-this-module')

  // FAILS IF: either statement drifts. The module-to-decision cell is read
  // header-keyed off L60819 and the Source status paragraph by content.
  // PLANTED: the module-to-decision statement's line, L60827 -> L60822 —
  // MOD-CC-02's row, which carries a REAL decision identifier and would invert
  // the finding while still citing a real row of the same table.
  // RED: expected [ 60822, 37630, 35350 ] to deeply equal [ 60827, 37630,
  //      35350 ] — and the statement-text gate red beside it
  it('reads both statements at test time', () => {
    const row = cells(srcLine(60827))
    expect(row[0]).toBe('MOD-CC-07')
    expect(row[columnIndex(DECISION_TABLE_HEADER, 'Open decisions')]).toBe(
      'Not applicable — no open decision on this module',
    )
    expect(srcLine(37630)).toContain('**Source status.**')
    expect(srcLine(37630)).toContain('`DEC-CCWRITE-001` (`Client Decision Required`)')
    expect(d.statements.map((s) => s.line)).toEqual([60827, 37630, 35350])
  })
})

describe('the two writes outside the counted ten, consumed rather than re-minted', () => {
  // FAILS IF: this module mints a second register. The two are SELECTED from
  // wave 0's six by act, and both must carry the source's own flag.
  // PLANTED: renamed the panel's OWN_OUTSIDE_WRITE_ACTS entry
  // 'Optional one-tap feedback on agent outputs' ->
  // 'Optional one-tap feedback on an agent output' — the MATRIX's own wording
  // for the same act, which reads as a correction and is not the register's key.
  // RED: expected [ …(2) ] to deeply equal [ …(2) ]
  it('both acts are in the wave-0 register and both are DEC-CCWRITE-001’s own', () => {
    // READ FROM THE PANEL'S OWN CONSTANT, not from a copy written here. The
    // first writing of this gate hard-coded the two strings and a plant proved
    // it could not fail: renaming the panel's entry to the matrix's own wording
    // — 'Optional one-tap feedback on an agent output', which reads like a
    // correction — left the unit suite green, because the panel throws only
    // when it renders and this suite does not render it.
    // PLANTED: that rename, in FeedbackSignalCapture.tsx.
    expect([...OWN_OUTSIDE_WRITE_ACTS].sort()).toEqual([
      'Marking a prior case relevant or not relevant',
      'Optional one-tap feedback on agent outputs',
    ])
    const mine = CC_WRITES_OUTSIDE_THE_TEN.filter((w) =>
      (OWN_OUTSIDE_WRITE_ACTS as readonly string[]).includes(w.act),
    )
    expect(mine.length).toBe(OWN_OUTSIDE_WRITE_ACTS.length)
    expect(mine.length).toBe(2)
    for (const w of mine) {
      expect(w.namedByDecCcWrite001).toBe(true)
      expect(w.exclusionKind).toBe('not-enumerated')
    }
    expect(mine.map((w) => w.section)).toEqual(['§6.5.5', '§6.8.2'])
  })

  // FAILS IF: the decision card stops naming both acts as unenumerated. The
  // clause is read whole rather than by its status token, because the sentence
  // that matters is the one that says where they are NOT.
  it('L35350 names both acts and says they are enumerated nowhere', () => {
    const l = srcLine(35350)
    expect(l).toContain('Two further writes originate here and are not enumerated anywhere')
    expect(l).toContain('marking a prior case relevant or not relevant')
    expect(l).toContain('optional one-tap feedback on agent outputs')
    expect(l).toContain('`DEC-CCWRITE-001`')
  })

  // FAILS IF: the two functionalities stop filing themselves under the
  // decision. Both lines are read whole; the second's clause is shorter than
  // the first's and a check keyed on the first's wording finds nothing.
  it('FUNC-CC-0702-1-1 and FUNC-CC-0702-3-1 both record DEC-CCWRITE-001', () => {
    expect(srcLine(37597)).toContain('`FUNC-CC-0702-1-1`')
    expect(srcLine(37597)).toContain(
      'Recorded under `DEC-CCWRITE-001` as a surface-originating write outside the counted ten.',
    )
    expect(srcLine(37601)).toContain('`FUNC-CC-0702-3-1`')
    expect(srcLine(37601)).toContain('Recorded under `DEC-CCWRITE-001`.')
  })

  // FAILS IF: the rows the two writes are granted on drift. Read header-keyed;
  // the ordinals are the model's and the cells are the source's.
  it('rows 2 and 4 are the granting rows and both grant Supervisor and Quality Manager', () => {
    expect([...CC07_OUTSIDE_WRITE_ROWS]).toEqual([2, 4])
    for (const ordinal of CC07_OUTSIDE_WRITE_ROWS) {
      const row = cc07Row(ordinal)
      const src = cells(srcLine(Number(row.sourceRef.slice(1))))
      expect(src[columnIndex(OWN_HEADER, 'Supervisor')]).toBe('Allowed')
      expect(src[columnIndex(OWN_HEADER, 'Quality Manager')]).toBe('Allowed')
      expect(src[columnIndex(OWN_HEADER, 'Tenant Admin')]).toBe('Explicitly prohibited')
    }
    expect(cc07Row(2).capability).toBe('Mark a prior case relevant or not relevant')
    expect(cc07Row(4).capability).toBe('Give optional one-tap feedback on an agent output')
  })
})

describe('two criteria asserted against nothing on this module', () => {
  // FAILS IF: this module acquires a freshness-class assignment it does not
  // have, or the table it is absent from stops being eighteen rows. Both read
  // off the source; the absence is measured rather than asserted.
  // PLANTED: renamed the gap's id, 'no-freshness-class-assignment' ->
  // 'no-freshness-class-assigned'. The record's prose is deliberately not what
  // was planted: this gate reads its numbers off the SOURCE, so no edit to the
  // record's own sentence can move them, and its presence is what it can check.
  // RED: expected false to be true // Object.is equality
  it('MOD-CC-07 appears in no row of §21.3’s eighteen-row class assignment table', () => {
    const rows = dataRows(CLASS_ASSIGN_SEPARATOR)
    expect(rows.length).toBe(18)
    expect(rows[0]?.line).toBe(35884)
    expect(rows[rows.length - 1]?.line).toBe(35901)
    expect(rows.some((r) => (r.cells[1] ?? '').includes(CC07_MODULE.id))).toBe(false)
    const named = new Set(
      rows.flatMap((r) => (r.cells[1] ?? '').split(',').map((s) => s.trim())),
    )
    // ELEVEN, counted. The first writing of this gate said nine and the first
    // run said eleven; the count is now derived from the table and the two
    // absent modules are named rather than inferred from the size.
    expect(named.size).toBe(11)
    expect(named.has(CC07_MODULE.id)).toBe(false)
    expect(named.has('MOD-CC-13')).toBe(false)
    expect(srcLine(35907)).toContain('`AC-CC-110`')
    expect(srcLine(35907)).toContain('exactly one assigned freshness class')
    expect(CC07_GAPS.some((g) => g.id === 'no-freshness-class-assignment')).toBe(true)
  })

  // FAILS IF: any of this module's seven capabilities turns out to be
  // enumerated in the surface matrix after all, which would make
  // DEC-CCWRITE-001's "not enumerated anywhere" false of the two writes.
  // Anchored on the whole capability string AND on two stems, because a row
  // worded differently would satisfy the first check and not the second.
  it('none of the seven capabilities appears among §21.1.2’s twenty rows', () => {
    const rows = dataRows(SURFACE_MATRIX_SEPARATOR)
    expect(rows.length).toBe(20)
    expect(cells(srcLine(SURFACE_MATRIX_HEADER))[0]).toBe('Capability')
    const capabilities = rows.map((r) => r.cells[0] ?? '')
    for (const row of CC07_MATRIX) {
      expect(capabilities, `row ${row.ordinal}`).not.toContain(row.capability)
    }
    expect(capabilities.filter((c) => /feedback|relevan/i.test(c))).toEqual([])
    expect(CC07_GAPS.some((g) => g.id === 'absent-from-the-surface-matrix')).toBe(true)
  })
})

describe('this screen does not exercise the ten, and does not mount their rail', () => {
  // FAILS IF: L38793's enumeration is read as naming this module. The seven
  // are extracted with a pattern anchored at BOTH ends, because an unanchored
  // one invents members of the family it is counting.
  // REDUNDANT PROTECTIONS, PLANTED SEPARATELY AND TOGETHER. Three assertions
  // cover the same defect from three sides — the prop, the control rail's name
  // and the card rail's import path — so the prop was added alone
  // (`actionRail={null}`), the import was added alone, and then both together.
  // ALL THREE RED, each with: expected true to be false // Object.is equality
  it('L38793 names seven modules and this is not one of them', () => {
    const l = srcLine(38793)
    const named = [...l.matchAll(/`(MOD-CC-\d+)` for /g)].map((m) => m[1])
    expect(named.length).toBe(7)
    expect(named).not.toContain(CC07_MODULE.id)
    expect(new Set(named).size).toBe(7)

    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC07_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes('actionRail=')).toBe(false)
    expect(page.includes('Cc13ActionRail')).toBe(false)
    expect(page.includes("from '@/surfaces/cc/actions/ActionRail'")).toBe(false)
  })

  // FAILS IF: the shell stops offering the seam this route relies on. The
  // abstention is only honest if something renders in its place.
  it('the shell renders its own declared seam when actionRail is unfilled', () => {
    const shell = readFileSync(
      join(process.cwd(), 'src/surfaces/cc/shell/CommandCenterShell.tsx'),
      'utf8',
    )
    expect(shell).toContain('actionRail ?? <SeamNotice id="operational-action-set" />')
  })
})

describe('the module’s own identity, the slug, and the route that carries it', () => {
  // FAILS IF: the slug is typed rather than derived, or the directory is named
  // something else. An earlier draft of this task's dispatch said this module
  // has no route at all; the spine is the authority and it declares one.
  // PLANTED: renamed app/command-center/learning-read-view to
  // app/command-center/learning-read-view-x.
  // RED: ENOENT: no such file or directory, stat '.../learning-read-view'
  it('the spine declares `learning-read-view` and a directory of that name is on disk', () => {
    expect(CC07_MODULE.id).toBe('MOD-CC-07')
    expect(CC07_MODULE.slug).toBe('learning-read-view')
    expect(CC07_SLUG).toBe(CC07_MODULE.slug)
    const dir = join(process.cwd(), 'app', 'command-center', CC07_SLUG)
    expect(statSync(dir).isDirectory()).toBe(true)
    expect(statSync(join(dir, 'page.tsx')).isFile()).toBe(true)
  })

  // FAILS IF: the route ships without saying what it is. A module demonstrated
  // by its slug claim alone never names itself, and `SCR-CC-10`'s page shipped
  // that way.
  //
  // A BARE `includes` CANNOT FAIL HERE — this file quotes L38793's seven ids
  // and mounts MOD-CC-06's half by name — so slice 8's fix requires the
  // occurrence on a line naming no OTHER Command Center module. THAT WAS STILL
  // NOT ENOUGH, AND THE PLANT FOUND IT: this file quotes the register cell
  // `MOD-CC-06 FEAT-CC-0603, MOD-CC-07` and the comment WRAPS between the two
  // ids, leaving `MOD-CC-07` alone on the following line. Replacing every real
  // self-naming sentence left that half-quotation behind and the gate green.
  // A WRAPPED QUOTATION IS STILL A QUOTATION, and this is a new member of the
  // running catalogue: line-oriented identifier checks are defeated by the line
  // wrapping of the very list they exclude.
  //
  // The gate therefore requires a line naming no other module WHOSE NEIGHBOURS
  // also name no other module — a wrapped list always leaves one on an
  // adjacent line, and a sentence about this module alone never does.
  // PLANTED: replaced both real self-naming sentences with "this module",
  // leaving the L38793 quotation, the MOD-CC-06 mount and the wrapped register
  // cell.
  // RED: expected 0 to be greater than 0
  it('the route file names MOD-CC-07 on a line, and a neighbourhood, about no other module', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC07_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes(CC07_SCREEN.id)).toBe(true)
    const lines = page.split('\n')
    const namesOnlyOwn = (i: number): boolean => {
      const l = lines[i] ?? ''
      return [...l.matchAll(/MOD-CC-\d+/g)].map((m) => m[0]).every((o) => o === CC07_MODULE.id)
    }
    const own = lines
      .map((l, i) => ({ l, i }))
      .filter((x) => x.l.includes(CC07_MODULE.id))
      .filter((x) => namesOnlyOwn(x.i) && namesOnlyOwn(x.i - 1) && namesOnlyOwn(x.i + 1))
    expect(own.length).toBeGreaterThan(0)
  })

  // FAILS IF: the spine's identity locator stops carrying the identity line,
  // or the register row stops carrying this screen and both its modules.
  it('the spine’s sourceRef for this module is its own identity line', () => {
    const identity = Number(CC07_MODULE.sourceRef.slice(1))
    expect(srcLine(identity)).toContain('**Identity.**')
    expect(srcLine(identity)).toContain('`MOD-CC-07`')
    expect(srcLine(identity)).toContain('Name: Feedback signal capture.')
    const register = Number(CC07_SCREEN.registerRef.slice(1))
    expect(srcLine(register)).toContain('SCR-CC-13')
    expect(srcLine(register)).toContain('MOD-CC-06 FEAT-CC-0603, MOD-CC-07')
  })

  // FAILS IF: this module's files reach no page. A component that compiles,
  // passes its suite and is imported by nothing is not shipped — that is
  // exactly `cc-10-s366`, which went a whole slice unrendered while its own
  // header named the wiring. The walk starts at the pages under `app/` and
  // follows `@/` imports, and its regex matches `from` ACROSS NEWLINES because
  // the shape two tasks independently wrote cannot see a multi-line import and
  // goes green on a broken chain.
  // PLANTED: removed the `<FeedbackSignalCapture />` element and its import
  // from the route file, leaving MOD-CC-06's half mounted so the page still
  // renders something.
  // RED: expected [ …(2) ] to deeply equal [] — both this module's component
  //      and its readings, since the readings are reached only through it
  it('every file of this module is reachable from a page under app/', () => {
    const root = process.cwd()
    const specifiers = (text: string): string[] =>
      [...text.matchAll(/\b(?:import|export)\b[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/g)].map(
        (m) => m[1] as string,
      )
    const resolve = (spec: string, from: string): string | null => {
      // BOTH SPECIFIER SHAPES. An alias-only resolver under-reports, and an
      // under-reporting reachability check goes green on a broken chain: this
      // module's own `./readings` is reached only through a RELATIVE import
      // inside its component, and the first writing of this gate missed it and
      // reported the file unreached. That red is what added this branch.
      const base = spec.startsWith('@/')
        ? join(root, 'src', spec.slice(2))
        : spec.startsWith('.')
          ? join(from, '..', spec)
          : null
      if (base === null) return null
      for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, 'index.ts')]) {
        try {
          if (statSync(candidate).isFile()) return candidate
        } catch {
          /* not this extension */
        }
      }
      return null
    }
    const seen = new Set<string>()
    const queue: string[] = []
    const walkApp = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(entry.name)) continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walkApp(full)
        else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) queue.push(full)
      }
    }
    walkApp(join(root, 'app'))
    while (queue.length > 0) {
      const file = queue.pop() as string
      if (seen.has(file)) continue
      seen.add(file)
      for (const spec of specifiers(readFileSync(file, 'utf8'))) {
        const target = resolve(spec, file)
        if (target !== null && !seen.has(target)) queue.push(target)
      }
    }
    const own = readdirSync(join(root, 'src/surfaces/cc/modules/cc-07'))
      .filter((f) => !isForeignProbe(f))
      .map((f) => join(root, 'src/surfaces/cc/modules/cc-07', f))
    const unreached = own.filter((f) => !seen.has(f)).map((f) => f.slice(root.length + 1))
    expect(unreached).toEqual([])
    // The walk is only meaningful if it actually reached this module's page.
    expect(seen.has(join(root, 'app', 'command-center', CC07_SLUG, 'page.tsx'))).toBe(true)
  })
})

describe('the disciplines this slice pays for', () => {
  const OWN_FILES = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-07'))
    .filter((f) => !isForeignProbe(f))
    .map((f) => join('src/surfaces/cc/modules/cc-07', f))

  // FAILS IF: a closed vocabulary is annotated `readonly T[]` instead of
  // `as const satisfies readonly T[]`. The release gate has caught that
  // eighteen times across two slices.
  // PLANTED: `export const CC07_TOKENS = [` ->
  // `export const CC07_TOKENS: readonly string[] = [`.
  // RED: expected [ Array(1) ] to deeply equal []
  it('every exported array literal is `as const satisfies`', () => {
    const offenders = OWN_FILES.filter((f) => {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      return /^export const \w+:\s*readonly [^=]*=\s*\[/m.test(text)
    })
    expect(offenders).toEqual([])
  })

  // FAILS IF: a file here acquires `'use client'` while exporting plain data a
  // server component reads. Four Run Player panels shipped an undefined module
  // id in slice 7 exactly that way, invisible to every component test.
  // PLANTED: added `'use client'` to the head of matrix.ts.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no file here is a client module', () => {
    const offenders = OWN_FILES.filter((f) =>
      /^'use client'/m.test(readFileSync(join(process.cwd(), f), 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  // FAILS IF: a comment here spells a line number that does not carry what the
  // comment says it carries. `tests/coverage/locator-fidelity.test.ts` lexes
  // any `L`-number as a citation; this is the same rule applied to the one
  // thing that suite cannot check, which is whether the line is BLANK. The
  // dispatch's card-end line is exactly that, which is why it is nowhere in
  // this build — including in this comment.
  // PLANTED: a one-line comment in matrix.ts citing that blank line as the
  // matrix header. The line number is not written here: a knowingly-false
  // citation describing a PLANTED defect is still a knowingly-false citation,
  // and slice 8 went red on exactly that.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no L-number cited in this module’s own files is a blank line', () => {
    const offenders: string[] = []
    for (const f of [...OWN_FILES, join('app/command-center', CC07_SLUG, 'page.tsx')]) {
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
