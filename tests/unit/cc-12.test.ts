import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC13_OWNING_PLACES, cc13Action } from '@/surfaces/cc/actions/action-set'
import { CC_LINK_OUT_CELLS, cellTextOf } from '@/surfaces/cc/decisions/link-outs'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC12_ACTION_6_ROWS,
  CC12_COLUMNS,
  CC12_MATRIX,
  CC12_MODULE,
  CC12_ROW_HELD_ELSEWHERE,
  CC12_ROW_UNIVERSAL_PROHIBITION,
  CC12_SCREEN,
  CC12_SLUG,
  CC12_TOKENS,
  CC12_TOKEN_OUTCOME,
  cc12Cell,
  cc12Row,
} from '@/surfaces/cc/modules/cc-12/matrix'
import {
  CC12_BRIEF_ABSTENTION,
  CC12_BRIEF_CATEGORIES,
  CC12_DIVERGENCES,
  CC12_TENANT_ADMIN_DECISION,
} from '@/surfaces/cc/modules/cc-12/readings'

/**
 * `MOD-CC-12` — §21.15, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * Nothing below compares a string this task wrote against another string this
 * task wrote, and **no count is taken from the array under test**: "eight
 * rows" is obtained by walking the source's own table from its separator to
 * the first line that is not a table row, never from `CC12_MATRIX.length` and
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
 * BEATEN-GATE SHAPES THAT ARE LIVE RISKS ON THIS MODULE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and five of these
 *    forty cells are the conditioned form. Every comparison below is an
 *    anchored equality on the cell head, never `startsWith`.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR. Every walk
 *    starts AFTER the separator and excludes it by position, not by content.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Two columns of this matrix
 *    read `Explicitly prohibited` on all eight rows, so a count of
 *    "sixteen prohibitions" is true however those two columns are permuted.
 *    Every cell gate names its ROW and its COLUMN, read off the header.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Every column index
 *    is resolved from its header line BY NAME at test time, in this table and
 *    in the five foreign tables.
 *  - AN ALLOWANCE TAKING ITS ALLOWED STRING FROM THE VALUE UNDER TEST. The
 *    divergence gates read the foreign tables directly rather than trusting
 *    the `statements` array's own text.
 *  - A `page.includes('MOD-CC-12')` CHECK SATISFIED BY A QUOTATION. The route
 *    file quotes nothing, but the same gate shape is used anyway: an
 *    occurrence is required on a line naming no OTHER Command Center module.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking; §26.7 and MTX-TEN-02c use them and §21.15 does not. */
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

/** This module's own matrix. Header, separator, first and last data line. */
const OWN_HEADER = 38481
const OWN_SEPARATOR = 38482
const OWN_FIRST_ROW = 38483
const OWN_LAST_ROW = 38490

/** The five foreign tables that answer a permission question about this module. */
const SURFACE_HEADER = 35002
const SURFACE_SEPARATOR = 35003
const CC13_HEADER = 38680
const CC13_SEPARATOR = 38681
const S254_HEADER = 48442
const S254_SEPARATOR = 48443
const S267_HEADER = 49574
const S267_SEPARATOR = 49575
const MTX02C_HEADER = 22056
const MTX02C_SEPARATOR = 22057

describe('the matrix is eight rows, counted off the source', () => {
  // FAILS IF: the transcription gains or loses a row. The count comes from
  // walking the SOURCE from its separator, so it cannot be satisfied by the
  // model's own length, and the separator is excluded by position.
  // PLANTED: deleted row 3 (`See emerging-pattern watch items`) from
  // `CC12_MATRIX`.
  // RED: expected 7 to be 8 // Object.is equality
  it('walks eight data rows from L38482 and the model carries the same eight', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(8)
    expect(CC12_MATRIX.length).toBe(rows.length)
    expect(rows[0]?.line).toBe(OWN_FIRST_ROW)
    expect(rows[rows.length - 1]?.line).toBe(OWN_LAST_ROW)
  })

  // FAILS IF: the body is read as running past its end, which is how a span
  // becomes a count. The line after the last data row is blank and the one
  // after that opens the preconditions paragraph at L38492, so the walk above
  // stops for a reason the source states rather than one a dispatch asserted.
  it('stops where the source stops, one line short of the preconditions paragraph', () => {
    expect(srcLine(OWN_LAST_ROW + 1)).toBe('')
    expect(isTableRow(srcLine(OWN_LAST_ROW + 1))).toBe(false)
    expect(srcLine(38492).startsWith('**Preconditions.**')).toBe(true)
  })

  // FAILS IF: the dispatch's card span is copied into this build as though it
  // were read. The line that dispatch gave as the card's end is BLANK and sits
  // ABOVE the matrix, so it cannot end a card whose matrix begins at L38481
  // and whose closing rule is at L38643. The blank line's number is computed
  // rather than spelled: `locator-fidelity` refuses a citation of a blank line
  // even inside a sentence that correctly calls it blank.
  // PLANTED: added a comment to `matrix.ts` citing that blank line as the
  // card's end.
  // RED: expected [ Array(1) ] to deeply equal []  (the blank-citation gate
  //      at the foot of this file)
  it('the card runs past the blank line the dispatch gave as its end', () => {
    expect(srcLine(38453)).toContain('21.15 Module')
    expect(srcLine(38453)).toContain('MOD-CC-12')
    expect(srcLine(OWN_HEADER - 3)).toBe('')
    expect(srcLine(38479)).toBe('**Roles that see and use it, and their permissions.**')
    expect(srcLine(38643)).toBe('---')
    expect(srcLine(38645).startsWith('## 21.16')).toBe(true)
  })
})

describe('the columns are the header line’s own, in the header line’s own order', () => {
  // FAILS IF: the transcription is read positionally against the Frontline
  // habit, which opens on Worker. The expected list is READ FROM L38481 at
  // test time, so it cannot be satisfied by a constant this task also wrote.
  // PLANTED: swapped `'Tenant Admin'` and `'Worker'` in `CC12_COLUMNS`.
  // RED: expected [ 'Worker', 'Supervisor', …(3) ] to deeply equal [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('reads Tenant Admin first and Worker last, off L38481', () => {
    const header = cells(srcLine(OWN_HEADER))
    expect(header[0]).toBe('Capability on this module')
    expect([...CC12_COLUMNS]).toEqual(header.slice(1))
    expect(header[1]).toBe('Tenant Admin')
    expect(header[header.length - 1]).toBe('Worker')
  })

  // FAILS IF: a column is dropped from the outcome map, which would let a
  // persona's cells go untranscribed.
  it('every source column has a model column and no model column is invented', () => {
    const header = cells(srcLine(OWN_HEADER)).slice(1)
    for (const name of header) expect(CC12_COLUMNS).toContain(name)
    for (const name of CC12_COLUMNS) expect(header).toContain(name)
  })
})

describe('every one of the forty cells is verbatim, header-keyed', () => {
  // FAILS IF: any cell text drifts from the source, in any row, in any
  // column. Row and column are both resolved by NAME, so a permutation of the
  // two all-prohibited columns cannot pass by arithmetic.
  // PLANTED: changed row 2's Quality Manager cell from
  // `Allowed with conditions — within Area scope` to `Allowed`.
  // RED: L38484 · Quality Manager: expected 'Allowed with conditions — within
  //      Area scope' to be 'Allowed' // Object.is equality
  it('matches L38483-L38490 cell for cell', () => {
    const rows = dataRows(OWN_SEPARATOR)
    for (const row of CC12_MATRIX) {
      const src = rows.find((r) => r.line === Number(row.sourceRef.slice(1)))
      expect(src, `no source row at ${row.sourceRef}`).toBeDefined()
      expect(src?.cells[0]).toBe(row.capability)
      for (const column of CC12_COLUMNS) {
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
    for (const row of CC12_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      expect(isTableRow(srcLine(line))).toBe(true)
      expect(cells(srcLine(line))[0]).toBe(row.capability)
    }
  })

  // FAILS IF: the matrix quietly acquires a fourth token, or loses one of its
  // three. Derived from the SOURCE's own cells, never from `CC12_TOKENS`.
  it('the source’s forty cells use exactly the three tokens the model declares', () => {
    const heads = new Set<string>()
    for (const row of dataRows(OWN_SEPARATOR)) {
      for (const column of CC12_COLUMNS) {
        heads.add((row.cells[columnIndex(OWN_HEADER, column)] ?? '').split(' — ')[0] ?? '')
      }
    }
    expect([...heads].sort()).toEqual([...CC12_TOKENS].sort())
    expect(heads.has('Read-only')).toBe(false)
    expect(heads.has('Unavailable')).toBe(false)
  })
})

describe('`Allowed` is a prefix of `Allowed with conditions`, and nothing here tests by prefix', () => {
  // FAILS IF: a cell's token is classified by prefix rather than by exact
  // equality on the head. Row 6's Tenant Admin cell is the live case: it
  // starts with `Allowed` and its token is not `Allowed`, and it is the one
  // cell on this matrix that three other tables contradict.
  // PLANTED: changed `cell()` in matrix.ts from
  // `CC12_TOKENS.find((t) => t === head)` to
  // `CC12_TOKENS.find((t) => head.startsWith(t))`.
  // RED: expected 'Allowed' to be 'Allowed with conditions' // Object.is equality
  it('row 6’s Tenant Admin cell is `Allowed with conditions`, not `Allowed`', () => {
    const ta = cc12Cell(6, 'Tenant Admin')
    expect(ta.text.startsWith('Allowed')).toBe(true)
    expect(ta.token).toBe('Allowed with conditions')
    expect(ta.token).not.toBe('Allowed')
    expect(ta.note).toBe('where holding Tenant or Site read scope')
  })

  // FAILS IF: a token is not the exact head of its own cell. Asserted over
  // every cell rather than the interesting one, because a classifier that is
  // right about row 6 by luck is wrong about the next matrix.
  it('every token is exactly the cell’s own head, split on its own em dash', () => {
    for (const row of CC12_MATRIX) {
      for (const column of CC12_COLUMNS) {
        const c = row.cells[column]
        expect(c.text.split(' — ')[0], `${row.sourceRef} · ${column}`).toBe(c.token)
        expect(CC12_TOKENS).toContain(c.token)
        expect(CC12_TOKEN_OUTCOME[c.token]).toBeDefined()
      }
    }
  })
})

describe('two notes that are not about the person in the column they sit in', () => {
  // FAILS IF: row 7's or row 8's note is dropped, or is attached to the wrong
  // column. Both rules live in the TENANT ADMIN cell and the other four cells
  // of each row are bare, which is the shape that makes a per-column read lose
  // the rule.
  // PLANTED: moved row 8's note from the Tenant Admin cell to the Supervisor
  // cell in `CC12_MATRIX`.
  // RED: L38490 · Tenant Admin: expected 'Explicitly prohibited' to be
  //      'Explicitly prohibited — no such capability exists for any role'
  it('rows 7 and 8 carry their whole rule in column two and leave the rest bare', () => {
    for (const ordinal of [CC12_ROW_HELD_ELSEWHERE, CC12_ROW_UNIVERSAL_PROHIBITION]) {
      const row = cc12Row(ordinal)
      expect(row.cells['Tenant Admin'].note, `row ${ordinal}`).not.toBeNull()
      for (const column of CC12_COLUMNS) {
        if (column === 'Tenant Admin') continue
        expect(row.cells[column].note, `row ${ordinal} · ${column}`).toBeNull()
        expect(row.cells[column].token).toBe('Explicitly prohibited')
      }
    }
  })

  // FAILS IF: row 8's universal prohibition is read as the Tenant Admin's
  // alone. The note's own words bind every role, and two other lines of the
  // source say so independently of the matrix.
  // PLANTED: changed `CC12_ROW_UNIVERSAL_PROHIBITION` from 8 to 7 — the other
  // row whose rule sits in one cell, and the one that is a link-out instead.
  // RED: expected 'Explicitly prohibited — tenant configuration and Studio
  //      settings' to contain 'any role'
  it('row 8’s note binds every role, and AC-CC-383 and FUNC-CC-1203-1-2 restate it', () => {
    const universal = cc12Row(CC12_ROW_UNIVERSAL_PROHIBITION)
    expect(universal.capability).toBe(
      cells(srcLine(Number(universal.sourceRef.slice(1))))[0],
    )
    expect(universal.cells['Tenant Admin'].text).toContain('any role')
    expect(srcLine(38623)).toContain('AC-CC-383')
    expect(srcLine(38623)).toContain('under any configuration')
    expect(srcLine(38611)).toContain('FUNC-CC-1203-1-2')
    expect(srcLine(38611)).toContain('every role and every module from introducing such a block')
  })
})

describe('every recorded statement is a verbatim fragment of the line it cites', () => {
  // FAILS IF: a statement's TEXT drifts from the line it names, which is the
  // half a line-number check cannot see. THIS GATE WAS ADDED BY A PLANT: the
  // first draft asserted only the statement LINES, so rewriting the L35004
  // statement to `Explicitly prohibited` — the value that erases the whole
  // divergence — left the suite GREEN. A text that must occur on its own line
  // cannot be rewritten to anything the source does not carry there.
  // A SUBSTRING CHECK WAS NOT ENOUGH AND THE SAME PLANT PROVED IT TWICE.
  // `Explicitly prohibited` occurs on L35004 in the Auditor and Worker
  // columns, so a text-occurs-on-its-line gate was satisfied by two OTHER
  // cells of the same row. A statement that names a cell is therefore held to
  // EXACT EQUALITY against that table's own header-keyed cell, and only prose
  // is checked as a substring.
  // PLANTED: changed the L35004 statement's text in `readings.ts` from
  // `Allowed with conditions — report and banner routes only` to
  // `Explicitly prohibited`.
  // RED: unacknowledged-flag-tenant-admin · L35004 · Tenant Admin: expected
  //      'Allowed with conditions — report and banner routes only' to be
  //      'Explicitly prohibited' // Object.is equality
  it('reads every statement of every divergence back off its own cell', () => {
    let checked = 0
    for (const d of CC12_DIVERGENCES) {
      for (const s of d.statements) {
        expect(s.column === null, `${d.id} · L${s.line}`).toBe(s.headerLine === null)
        if (s.column === null || s.headerLine === null) {
          expect(unticked(srcLine(s.line)), `${d.id} · L${s.line} (prose)`).toContain(s.text)
        } else {
          expect(
            cells(srcLine(s.line))[columnIndex(s.headerLine, s.column)],
            `${d.id} · L${s.line} · ${s.column}`,
          ).toBe(s.text)
        }
        checked += 1
      }
    }
    // Derived from the records rather than written down, so the loop cannot
    // silently shrink to nothing along with its subject.
    expect(checked).toBe(CC12_DIVERGENCES.reduce((n, d) => n + d.statements.length, 0))
    expect(checked).toBeGreaterThan(CC12_DIVERGENCES.length * 2)
  })
})

describe('every § label in a locator names the section the cited line is actually in', () => {
  /** Every numbered heading in the source, as `{ line, section }`, in order. */
  const HEADINGS = LINES.flatMap((text, i) => {
    const m = /^#{2,6}\s+(\d+(?:\.\d+)*)\s/.exec(text)
    return m === null ? [] : [{ line: i + 1, section: m[1] as string }]
  })

  /** The nearest numbered heading at or above a line. */
  const sectionOf = (line: number): string | null => {
    let found: string | null = null
    for (const h of HEADINGS) {
      if (h.line > line) break
      found = h.section
    }
    return found
  }

  // FAILS IF: a locator's § label names a section the cited line does not sit
  // in. THIS GATE WAS ADDED AFTER FINDING TWO SUCH LABELS BY READING: the
  // landing-precedence table was labelled §21.1.4 and is in §21.1.3, and the
  // module-to-actor concentration table was labelled §21.1.6, which does not
  // exist — the chapter's subsections stop at §21.1.5. An L-number is checked
  // by four gates in this file and a § label was checked by none, which is
  // precisely where a wrong one survives.
  // PLANTED: relabelled the L35078 locator back to §21.1.4.
  // RED: unacknowledged-flag-tenant-admin claims §21.1.4 for L35078: expected
  //      '21.1.3' to be '21.1.4' // Object.is equality
  it('resolves every §-and-line pair in every divergence locator off the headings', () => {
    let checked = 0
    for (const d of CC12_DIVERGENCES) {
      for (const r of d.readings) {
        for (const m of r.locator.matchAll(/§(\d+(?:\.\d+)*)\s+·\s+L(\d{3,6})/g)) {
          expect(sectionOf(Number(m[2])), `${d.id} claims §${m[1]} for L${m[2]}`).toBe(m[1])
          checked += 1
        }
      }
    }
    // Derived, so the loop cannot shrink to nothing along with its subject.
    expect(checked).toBeGreaterThanOrEqual(CC12_DIVERGENCES.length * 2)
  })
})

describe('the Tenant Admin on row 6: SIX statements, TWO readings, and a decision that names it', () => {
  const divergence = CC12_DIVERGENCES.find((d) => d.id === 'unacknowledged-flag-tenant-admin')

  // FAILS IF: any of the six statements is not what the record says it is.
  // Each is read out of ITS OWN table, header-keyed on ITS OWN header —
  // §21.1.2's has no leading `#`, MTX-TEN-02c's has two leading columns, and a
  // positional read of either lands one column out.
  // PLANTED: changed the L35004 statement's text in `readings.ts` from
  // `Allowed with conditions — report and banner routes only` to
  // `Explicitly prohibited` — the reading that would erase the divergence.
  // RED: expected 'Allowed with conditions — report and banner routes only'
  //      to be 'Explicitly prohibited' // Object.is equality
  it('reads all six statements out of their own tables at test time', () => {
    const own = cells(srcLine(38488))
    expect(own[0]).toBe('See the unacknowledged-brief flag')
    expect(own[columnIndex(OWN_HEADER, 'Tenant Admin')]).toBe(
      'Allowed with conditions — where holding Tenant or Site read scope',
    )

    const surface = cells(srcLine(35004))
    expect(surface[0]).toBe('Open any Command Center route')
    expect(surface[columnIndex(SURFACE_HEADER, 'Tenant Admin')]).toBe(
      'Allowed with conditions — report and banner routes only',
    )

    expect(srcLine(35078)).toContain('The Tenant Admin is not an in-shift actor')
    expect(srcLine(38678)).toContain('the Tenant Admin is explicitly not an in-shift actor')

    const mtx = cells(srcLine(22069))
    expect(mtx[0]).toBe('MOD-CC-12')
    expect(mtx[columnIndex(MTX02C_HEADER, 'Tenant Admin')]).toBe('Read-only [K1]')

    expect(cells(srcLine(35254))[0]).toBe('MOD-CC-12 Shift handoff panel')
    expect(srcLine(35254)).not.toContain('Tenant Admin')

    expect(divergence?.statements.map((s) => s.line)).toEqual([
      38488, 35004, 35078, 38678, 22069, 35254,
    ])
  })

  // FAILS IF: the module's grant and the surface's restriction are recorded as
  // agreeing. They are two different capabilities in two different tables and
  // that is exactly why neither is chosen: one is about opening a route and
  // one is about seeing a flag on a module.
  it('the two readings are on different capabilities and the record says so', () => {
    expect(divergence?.readings).toHaveLength(2)
    expect(divergence?.readings[0]?.locator).toContain('L38488')
    expect(divergence?.readings[1]?.locator).toContain('L35004')
    expect(divergence?.renderedConsequence).toContain('L48397')
    expect(cells(srcLine(48397))[0]).toBe('SCR-CC-12')
    expect(cells(srcLine(48397))[columnIndex(48384, 'Roles that can open it')]).toBe(
      'Supervisor, Quality Manager',
    )
  })

  // FAILS IF: `DEC-TACC-001` stops being the source's own identifier for this
  // question, or is quietly lifted into a register without this record being
  // switched. The `Stu14LocalDisclosure` idiom: assert the identifier is
  // ABSENT from the canon and from this surface's own register, so the day
  // someone lifts it the suite goes red and forces the switch.
  // PLANTED: changed `raisedAt` from 23069 to 23070.
  // RED: expected '**New decision `DEC-CAP-001`…' to contain 'DEC-TACC-001'
  it('DEC-TACC-001 is raised at L23069, and is in neither register', () => {
    const raised = srcLine(CC12_TENANT_ADMIN_DECISION.raisedAt)
    expect(raised).toContain(CC12_TENANT_ADMIN_DECISION.decisionRef)
    expect(raised).toContain("the Tenant Admin's Client Command Center presence")
    for (const option of CC12_TENANT_ADMIN_DECISION.options) {
      expect(raised, `option "${option}" is not on that line`).toContain(option)
    }
    expect(raised).toContain(CC12_TENANT_ADMIN_DECISION.affectedCellsAsStated)
    expect(CC12_TENANT_ADMIN_DECISION.adopted).toBe(false)

    // The decision's own count of affected module cells, COUNTED off
    // MTX-TEN-02c rather than believed. Eleven of thirteen Tenant Admin cells
    // read `Read-only`; the other two are MOD-CC-11 and MOD-CC-13.
    const taColumn = columnIndex(MTX02C_HEADER, 'Tenant Admin')
    const mtxRows = dataRows(MTX02C_SEPARATOR)
    expect(mtxRows.length).toBe(13)
    const readOnly = mtxRows.filter((r) => (r.cells[taColumn] ?? '').startsWith('Read-only'))
    expect(readOnly.length).toBe(CC12_TENANT_ADMIN_DECISION.moduleCellsItClaims)
    // The source spells the count in WORDS. Asserting the digit would go red
    // on a line that carries the claim, which is a gate failing on the truth.
    expect(raised).toContain('eleven module cells depend on it')
    expect(readOnly.map((r) => r.line)).toContain(22069)

    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const ccRegister = readFileSync(
      join(process.cwd(), 'src/surfaces/cc/decisions/register.ts'),
      'utf8',
    )
    expect(canon.includes(CC12_TENANT_ADMIN_DECISION.decisionRef)).toBe(false)
    expect(ccRegister.includes(CC12_TENANT_ADMIN_DECISION.decisionRef)).toBe(false)
  })

  // FAILS IF: the working position is promoted to an adoption. L22072 states
  // it as what the build serves until decided; the line that RAISES the
  // decision states the recommendation, and a recommendation is not an
  // adoption either.
  it('the working position is read off L22072 and is not an adoption', () => {
    expect(srcLine(CC12_TENANT_ADMIN_DECISION.workingPositionRef)).toContain(
      CC12_TENANT_ADMIN_DECISION.workingPosition,
    )
    expect(srcLine(23069)).toContain(CC12_TENANT_ADMIN_DECISION.recommendation)
    expect(srcLine(CC12_TENANT_ADMIN_DECISION.workingPositionRef)).toContain('DEC-TACC-001')
  })
})

describe('acknowledge and annotate: FIVE statements, TWO tokens, and TWO rows against ONE', () => {
  const tokens = CC12_DIVERGENCES.find((d) => d.id === 'acknowledge-annotate-tenant-admin')
  const shape = CC12_DIVERGENCES.find((d) => d.id === 'acknowledge-annotate-decomposition')

  // FAILS IF: five STATEMENTS are recorded as five READINGS, or the two
  // distinct tokens collapse into one. Both numbers are derived from the
  // source rather than written down twice.
  // PLANTED: changed the §25.4 statement's token in `readings.ts` from
  // `Unavailable` to `Explicitly prohibited`.
  // RED: expected 1 to be 2 // Object.is equality
  it('the Tenant Admin cell is stated five times and carries two distinct tokens', () => {
    const observed = [
      cells(srcLine(38486))[columnIndex(OWN_HEADER, 'Tenant Admin')],
      cells(srcLine(38487))[columnIndex(OWN_HEADER, 'Tenant Admin')],
      cells(srcLine(35016))[columnIndex(SURFACE_HEADER, 'Tenant Admin')],
      cells(srcLine(38687))[columnIndex(CC13_HEADER, 'Tenant Admin')],
      cells(srcLine(48449))[columnIndex(S254_HEADER, 'Tenant Admin')],
    ]
    expect(observed.length).toBe(5)
    expect(new Set(observed).size).toBe(2)
    expect(observed[4]).toBe('Unavailable')
    expect(tokens?.statements.length).toBe(observed.length)
    expect(new Set(tokens?.statements.map((s) => s.text)).size).toBe(2)
  })

  // FAILS IF: the two tokens stop rendering oppositely, which is the whole
  // reason the divergence matters. Read off `WriteControl` itself rather than
  // asserted in prose: the ABSENT branch tests `explicitlyProhibited` and
  // nothing else does.
  it('the two tokens render oppositely under the build’s one rendering rule', () => {
    const wc = readFileSync(join(process.cwd(), 'src/ui/WriteControl.tsx'), 'utf8')
    expect(wc).toContain("decision.outcome === 'explicitlyProhibited'")
    expect(wc).toContain("kind: 'absent'")
    expect(CC12_TOKEN_OUTCOME['Explicitly prohibited']).toBe('explicitlyProhibited')
    expect(CC12_TOKENS).not.toContain('Unavailable')
  })

  // FAILS IF: §25.4's divergence on the Auditor and Worker columns is dropped.
  // It is the same divergence reached from two more columns, and a record that
  // names only the Tenant Admin under-reports it.
  it('§25.4 also reads the Auditor and the Worker as Not applicable, not prohibited', () => {
    const s254 = cells(srcLine(48449))
    expect(s254[columnIndex(S254_HEADER, 'Read-only Auditor')]).toBe(
      'Not applicable — no Command Center access',
    )
    expect(s254[columnIndex(S254_HEADER, 'Worker')]).toBe('Not applicable — different surface')
    for (const ordinal of CC12_ACTION_6_ROWS) {
      expect(cc12Cell(ordinal, 'Read-only Auditor').token).toBe('Explicitly prohibited')
      expect(cc12Cell(ordinal, 'Worker').token).toBe('Explicitly prohibited')
    }
    expect(tokens?.renderedConsequence).toContain('Not applicable')
  })

  // FAILS IF: the decomposition is recorded as a contradiction, or the row
  // counts are asserted rather than counted. This module carries TWO rows for
  // an act three other tables carry as ONE, and the count is taken by
  // filtering each table's own data rows at test time.
  // PLANTED: changed `CC12_ACTION_6_ROWS` from `[4, 5]` to `[4]`.
  // RED: expected [ 4 ] to deeply equal [ 4, 5 ]
  it('this matrix has two rows for the act and §21.16, §21.1.2 and §25.4 have one each', () => {
    const mine = dataRows(OWN_SEPARATOR).filter((r) =>
      /^(Acknowledge the brief|Annotate a brief item)$/.test(r.cells[0] ?? ''),
    )
    expect(mine.map((r) => r.line)).toEqual([38486, 38487])
    expect([...CC12_ACTION_6_ROWS]).toEqual([4, 5])
    expect(CC12_ACTION_6_ROWS.map((o) => cc12Row(o).sourceRef)).toEqual(['L38486', 'L38487'])

    const foldedIn = (header: number, separator: number, actionColumn: string): number[] =>
      dataRows(separator)
        .filter((r) => (r.cells[columnIndex(header, actionColumn)] ?? '').includes('handoff brief'))
        .map((r) => r.line)
    expect(foldedIn(CC13_HEADER, CC13_SEPARATOR, 'Action')).toEqual([38687])
    expect(foldedIn(SURFACE_HEADER, SURFACE_SEPARATOR, 'Capability')).toEqual([35016])
    expect(foldedIn(S254_HEADER, S254_SEPARATOR, 'Action')).toEqual([48449])
    expect(shape?.statements.length).toBe(6)
  })

  // FAILS IF: this build joins §21.16's two tables by the act's NAME. They do
  // not agree on it — the authority table writes the word `shift` and the
  // matrix does not — which is why wave 0 keeps `authorityAction` and
  // `matrixAction` as separate fields.
  it('§21.16’s own two tables name action 6 differently, and nothing joins on the name', () => {
    const authority = cells(srcLine(38670))
    const matrix = cells(srcLine(38687))
    expect(authority[columnIndex(38663, 'Action')]).toBe(
      'Acknowledge and annotate the shift handoff brief',
    )
    expect(matrix[columnIndex(CC13_HEADER, 'Action')]).toBe(
      'Acknowledge and annotate the handoff brief',
    )
    expect(authority[columnIndex(38663, 'Action')]).not.toBe(matrix[columnIndex(CC13_HEADER, 'Action')])
    expect(cc13Action(6).authorityAction).toBe(authority[columnIndex(38663, 'Action')])
    expect(cc13Action(6).matrixAction).toBe(matrix[columnIndex(CC13_HEADER, 'Action')])
  })
})

describe('§26.7’s row is a record-type row, not a sixth persona statement', () => {
  // FAILS IF: L49591's Client Command Center cell is imported into a persona
  // column. §26.7's columns are SURFACES and §21.15's are PERSONAS, so
  // `Tenant Admin` does not resolve in §26.7's header at all — the same trap
  // `MOD-CC-04` found on L49578 and the reason that dispatch's "repeated at"
  // was wrong.
  // PLANTED: added L49591 to the `acknowledge-annotate-tenant-admin` record's
  // statements as a sixth persona statement.
  // RED: expected 6 to be 5 // Object.is equality (the five-statement gate)
  it('L49591 runs across six surfaces and names no persona column', () => {
    const header = cells(srcLine(S267_HEADER))
    expect(header[0]).toBe('Record type')
    expect(header).toContain('Client Command Center')
    expect(header).not.toContain('Tenant Admin')
    expect(header).not.toContain('Supervisor')

    const row = cells(srcLine(49591))
    expect(row[0]).toBe('Shift handoff brief')
    expect(row[columnIndex(S267_HEADER, 'Client Command Center')]).toBe(
      'Allowed with conditions — acknowledge and annotate, Supervisor and above',
    )
    expect(dataRows(S267_SEPARATOR).length).toBe(26)

    // No divergence record on this module claims that line as a persona cell.
    for (const d of CC12_DIVERGENCES) {
      expect(d.statements.map((s) => s.line), d.id).not.toContain(49591)
    }
  })
})

describe('row 7 is the one act held elsewhere, and this module spells no link of its own', () => {
  // FAILS IF: this module invents a link rather than consuming task 5's. The
  // cell is already registered there, requires a `link`, and names two owners
  // and chooses neither.
  // PLANTED: changed `sourceRequires` on `cc-12-agent-run-time` from `'link'`
  // to `'control'` in link-outs.ts — the misclassification the shared guard
  // exists for.
  // RED: expected 'control' to be 'link' // Object.is equality
  it('row 7’s Tenant Admin cell is registered by task 5 and requires a link', () => {
    const mine = CC_LINK_OUT_CELLS.filter((c) => c.moduleId === CC12_MODULE.id)
    expect(mine.map((c) => c.id)).toEqual(['cc-12-agent-run-time'])
    const held = cc12Row(CC12_ROW_HELD_ELSEWHERE)
    for (const c of mine) {
      expect(c.line).toBe(Number(held.sourceRef.slice(1)))
      expect(c.capability).toBe(held.capability)
      expect(c.column).toBe('Tenant Admin')
      expect(c.sourceRequires).toBe('link')
      expect(c.rowText).toBe(srcLine(c.line))
      expect(cellTextOf(c)).toBe(held.cells['Tenant Admin'].text)
      expect(c.owner.kind).toBe('ambiguous')
    }
  })

  // FAILS IF: this module grows its own anchor. `MOD-CC-02` shipped a local
  // `ManualCloseLink` over a raw `<a href>` for exactly this shape, and the
  // shared component exists so there is not a second one.
  // PLANTED: added `<a href="/studio">Open the Studio</a>` to
  // `ShiftHandoffPanel.tsx`.
  // RED: expected [ 'ShiftHandoffPanel.tsx' ] to deeply equal []
  it('no file under cc-12 draws its own anchor or imports next/link', () => {
    const dir = join(process.cwd(), 'src/surfaces/cc/modules/cc-12')
    const offenders = readdirSync(dir)
      .filter((f) => !isForeignProbe(f))
      .filter((f) => {
        const text = readFileSync(join(dir, f), 'utf8')
        return /<a\s/.test(text) || text.includes("from 'next/link'")
      })
    expect(offenders).toEqual([])
  })
})

describe('action 6 is one of the ten, and its record is held on the Hub', () => {
  // FAILS IF: the owning place is spelled locally rather than read from wave
  // 0's reading of the `Executes via` column, or that column stops naming a
  // Hub record. The whole write path for this module hangs on it: the Command
  // Center owns no operational record.
  // PLANTED: changed row 6's `owningPlace` in `action-set.ts` from
  // `Brief record on the Delivery Operations Hub` to `null`.
  // RED: expected null to be 'Brief record on the Delivery Operations Hub'
  it('L38670 gives action 6 a Hub brief record, and CC13_OWNING_PLACES reads it', () => {
    const authority = cells(srcLine(38670))
    expect(authority[columnIndex(38663, '#')]).toBe('6')
    expect(authority[columnIndex(38663, 'Authority')]).toBe('Supervisor and above')
    expect(authority[columnIndex(38663, 'Executes via')]).toContain(
      'Brief record on the Delivery Operations Hub',
    )
    const place = CC13_OWNING_PLACES.find((p) => p.ordinal === 6)
    expect(place?.owningPlace).toBe('Brief record on the Delivery Operations Hub')
    expect(place?.sourceRef).toBe('L38670')
    expect(cc13Action(6).authorityRef).toBe('L38670')
    expect(cc13Action(6).matrixRef).toBe('L38687')
  })

  // FAILS IF: the module's own prose stops placing the write on the Hub. This
  // is the second, independent statement of the same rule and it is the one
  // that names all three children — the brief, the acknowledgement and the
  // annotations.
  it('L38471 puts the brief, its acknowledgement and its annotations on the Hub record', () => {
    expect(srcLine(38471)).toContain(
      'The brief, its acknowledgement, and its annotations are all written to the Delivery Operations Hub record',
    )
    expect(srcLine(38657)).toContain('the Command Center is the cockpit, never the engine')
    expect(srcLine(38625)).toContain('AC-CC-385')
    expect(srcLine(38625)).toContain('written to the Delivery Operations Hub record')
  })

  // FAILS IF: this screen stops mounting `MOD-CC-13`'s rail. `MOD-CC-13` owns
  // no route and no path under `app/`, so a rail waiting for its own module to
  // mount it is mounted nowhere — the `cc-10-s366` shape reached by two files
  // each correctly declining. L38793 assigns it to the seven screens that
  // exercise the ten, and this module is one of them.
  // PLANTED: removed the `actionRail={…}` prop from the route file.
  // RED: expected false to be true // Object.is equality
  it('the route mounts Cc13ActionRail and L38793 names this module for action 6 alone', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC12_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes('Cc13ActionRail')).toBe(true)
    expect(page.includes('actionRail=')).toBe(true)
    // The CARD treatment is a different component and is not what mounts here.
    expect(page.includes("from '@/surfaces/cc/actions/ActionRail'")).toBe(false)

    const l38793 = srcLine(38793)
    const named = [...l38793.matchAll(/`(MOD-CC-\d+)` for ([0-9, and]+?);|`(MOD-CC-\d+)` for ([0-9, and]+?)\./g)]
    expect(named.length).toBe(7)
    expect(l38793).toContain('`MOD-CC-12` for 6')
    // Exactly one ordinal, and it is 6 — asserted off the source, not the model.
    const mine = /`MOD-CC-12` for ([^;.]+)/.exec(l38793)
    expect(mine?.[1]?.trim()).toBe('6')
  })
})

describe('the freshness class and the six categories are consumed, never restated', () => {
  // FAILS IF: the class assignment is copied instead of read. The row is
  // looked up through task 2's own accessor and its cells are then checked
  // against L35890, so a local copy that drifted could not pass — and the row
  // is SHARED with `MOD-CC-08`, so a second answer written here would be a
  // second answer for both.
  // PLANTED: changed `classCell` on `Agent output produced` from `Pushed` to
  // `Refreshed` in live/model.ts.
  // RED: expected 'Refreshed' to be 'Pushed' // Object.is equality
  it('L35890 assigns Agent output produced to MOD-CC-08 and MOD-CC-12, Pushed, at production time', () => {
    const row = cells(srcLine(35890))
    expect(row[0]).toBe('Agent output produced')
    expect(row[1]).toBe('MOD-CC-08, MOD-CC-12')
    const a = ccElementAssignment('Agent output produced')
    expect(a.classCell).toBe(row[2])
    expect(a.markerObligation).toBe(row[3])
    expect(a.classCell).toBe('Pushed')
    expect(a.markerObligation).toBe('Production time')
    expect(a.modules).toContain(CC12_MODULE.id)
    expect(a.modules).toContain('MOD-CC-08')
  })

  // FAILS IF: the six categories are taken from the storyboard's section
  // headings rather than from the functionality that states them. The two are
  // worded differently and only one is normative.
  // PLANTED: changed `worker-readiness flags` to `worker readiness` in
  // `CC12_BRIEF_CATEGORIES`.
  // RED: expected '…worker-readiness flags…' to contain 'worker readiness'
  it('the six categories are FUNC-CC-1201-1-2’s own words, and no figure is rendered', () => {
    const func = srcLine(CC12_BRIEF_ABSTENTION.whatIsOwedRef)
    expect(func).toContain('FUNC-CC-1201-1-2')
    expect(CC12_BRIEF_CATEGORIES.length).toBe(6)
    for (const category of CC12_BRIEF_CATEGORIES) {
      expect(func, `"${category}" is not on that line`).toContain(category)
    }
    expect(srcLine(CC12_BRIEF_ABSTENTION.storyboardRef)).toContain('SB-CC-23')
    expect(CC12_BRIEF_ABSTENTION.rendered).toBe(false)
  })
})

describe('the module’s own identity, the slug, and the route that carries it', () => {
  // FAILS IF: the slug is typed rather than derived, or the directory is
  // named something else. `CC_NAV` publishes this pathname from the spine and
  // the generator reads a declared slug with no directory as "declared, not
  // built".
  // PLANTED: renamed `app/command-center/shift-handoff-panel` to
  // `app/command-center/shift-handoff-panel-x`.
  // RED: ENOENT: no such file or directory, stat '…/shift-handoff-panel'
  it('the spine declares `shift-handoff-panel` and a directory of that name is on disk', () => {
    expect(CC12_MODULE.id).toBe('MOD-CC-12')
    expect(CC12_SLUG).toBe(CC12_MODULE.slug)
    const dir = join(process.cwd(), 'app', 'command-center', CC12_SLUG)
    expect(statSync(dir).isDirectory()).toBe(true)
    expect(statSync(join(dir, 'page.tsx')).isFile()).toBe(true)
  })

  // FAILS IF: the route ships without saying what it is. A module demonstrated
  // by its slug claim alone never names itself, and `SCR-CC-10`'s page shipped
  // that way. The identifier is asserted in the file's TEXT, because that is
  // what `scripts/build-registries.mjs` reads — and it is required on a line
  // that names no OTHER Command Center module, because a file quoting a list
  // of identifiers contains every identifier in that list.
  // PLANTED: replaced every mention of `MOD-CC-12` in the page with "this
  // module" except the one inside the L38793 sentence.
  // RED: expected 0 to be greater than 0
  it('the route file names MOD-CC-12 on a line about no other module', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC12_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes(CC12_SCREEN.id)).toBe(true)
    const own = page
      .split('\n')
      .filter((l) => l.includes(CC12_MODULE.id))
      .filter((l) => {
        const others = [...l.matchAll(/MOD-CC-\d+/g)].map((m) => m[0])
        return others.every((o) => o === CC12_MODULE.id)
      })
    expect(own.length).toBeGreaterThan(0)
  })

  // FAILS IF: the spine's identity locator stops carrying the identity line,
  // or the register row stops carrying this screen.
  it('the spine’s sourceRef for this module is its own identity line', () => {
    const identity = Number(CC12_MODULE.sourceRef.slice(1))
    expect(srcLine(identity)).toContain('**Identity.**')
    expect(srcLine(identity)).toContain('`MOD-CC-12`')
    const register = Number(CC12_SCREEN.registerRef.slice(1))
    expect(srcLine(register)).toContain('SCR-CC-12')
    expect(srcLine(register)).toContain('MOD-CC-12 all features')
  })
})

describe('the disciplines this slice pays for', () => {
  const OWN_FILES = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-12'))
    .filter((f) => !isForeignProbe(f))
    .map((f) => join('src/surfaces/cc/modules/cc-12', f))

  // FAILS IF: a closed vocabulary is annotated `readonly T[]` instead of
  // `as const satisfies readonly T[]`. The release gate has caught that
  // eighteen times across two slices.
  // PLANTED: changed `CC12_TOKENS` to
  // `export const CC12_TOKENS: readonly string[] = [...]`.
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
  // PLANTED defect is still a knowingly-false citation.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no L-number cited in this module’s own files is a blank line', () => {
    const offenders: string[] = []
    for (const f of [...OWN_FILES, join('app/command-center', CC12_SLUG, 'page.tsx')]) {
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

  // FAILS IF: this module ships unreachable from `app/`, which is the
  // `cc-10-s366` finding applied before it becomes one. Every component under
  // this directory must be imported by a page, directly or through one hop,
  // and the probe widens its import pattern across lines because a regex that
  // requires `from` on the `import` line cannot see a multi-line import and
  // would under-report a broken chain.
  // PLANTED: removed the `<ShiftHandoffPanel …/>` element and its import from
  // the route file.
  // RED: expected [ 'ShiftHandoffPanel.tsx' ] to deeply equal []
  it('every component in this module is reachable from a page under app/', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC12_SLUG, 'page.tsx'),
      'utf8',
    )
    const imported = new Set(
      [...page.matchAll(/import[\s\S]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1] ?? ''),
    )
    const components = OWN_FILES.filter((f) => f.endsWith('.tsx')).map((f) =>
      f.slice(f.lastIndexOf('/') + 1),
    )
    const unreachable = components.filter((c) => {
      const spec = `@/surfaces/cc/modules/cc-12/${c.replace(/\.tsx$/, '')}`
      return !imported.has(spec)
    })
    expect(components.length).toBeGreaterThan(0)
    expect(unreachable).toEqual([])
  })
})
