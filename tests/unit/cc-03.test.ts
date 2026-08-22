import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { PERMISSION_OUTCOMES } from '@/policy/decision'
import { CC_LINK_OUT_CELLS, CC_LINK_OUT_TOKENS } from '@/surfaces/cc/decisions/link-outs'
import { ccFunctionalitiesNamingNoPattern } from '@/surfaces/cc/fallback/patterns'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import { CC_NAV, ccPathname } from '@/surfaces/cc/screens'
import { cc13Action } from '@/surfaces/cc/actions/action-set'
import {
  CC03_CELL_SCREEN,
  CC03_CELL_SLUG,
  CC03_CHAIN,
  CC03_COLUMNS,
  CC03_FEATURES,
  CC03_FUNCTIONALITIES,
  CC03_MATRIX,
  CC03_MODULE,
  CC03_ROW_HELD_ELSEWHERE,
  CC03_RUN_SCREEN,
  CC03_RUN_SLUG,
  CC03_SCREEN_FEATURES,
  CC03_TOKENS,
  CC03_TOKEN_OUTCOME,
  cc03Cell,
  cc03FeatureOf,
  cc03Row,
  cc03ScreenFeatures,
} from '@/surfaces/cc/modules/cc-03/matrix'
import {
  CC03_AC_090_GAP,
  CC03_ACTION_8,
  CC03_DIVERGENCES,
  CC03_HISTORY_LINK,
  CC03_SURFACE_WIDE_CRITERION,
  CC03_TACC_DISCLOSURE,
} from '@/surfaces/cc/modules/cc-03/readings'

/**
 * `MOD-CC-03` — §21.6, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * Nothing below compares a string this task wrote against another string this
 * task wrote, and **no count is taken from the array under test**: "eight
 * rows" is obtained by walking the source's own table from its separator to
 * the first line that is not a table row, never from `CC03_MATRIX.length` and
 * never by subtracting the ends of a span written in a dispatch.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — the
 * defect planted into the real shipping file, the red observed, then reversed
 * by splicing the recorded offset back and verified byte-identical against a
 * baseline captured BEFORE the first plant. Each `PLANTED` note names the
 * defect that was actually planted, never a convenient one.
 *
 * BEATEN-GATE SHAPES THAT WERE LIVE RISKS HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and row 5's two
 *    conditional grants are where it bites: a prefix classifier reads the
 *    exception-led rule — the position this module exists to hold — as an
 *    unconditional grant to browse worker identity. Every comparison is an
 *    anchored equality on the cell head.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR. Every walk
 *    starts AFTER the separator and excludes it by position, not by content.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Three columns of this
 *    matrix read `Explicitly prohibited` on seven of eight rows, so a count
 *    of prohibitions is nearly invariant under permuting them. Every cell
 *    gate names its ROW and its COLUMN, resolved off the source's own header.
 *  - A `page.includes('MOD-CC-03')` CHECK SATISFIED BY A QUOTATION. Both
 *    route files name other Command Center modules; the gate requires an
 *    occurrence on a line naming no OTHER `MOD-CC-*`.
 *  - AN UNANCHORED IDENTIFIER PATTERN INVENTING MEMBERS OF ITS OWN FAMILY.
 *    Every `MOD-CC-`, `FEAT-CC-` and `FUNC-CC-` pattern below is anchored at
 *    both ends.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking on identifiers; chapter 17 uses them and §21.6 does not. */
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
 * is not a table row, so the separator can never be counted as data and a
 * span written in a dispatch is never trusted for a count.
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

const read = (p: string): string => readFileSync(join(process.cwd(), p), 'utf8')

/** This module's own matrix. Card head, matrix header, separator, first data line. */
const CARD_HEAD = 36618
const OWN_HEADER = 36652
const OWN_SEPARATOR = 36653
const OWN_FIRST_ROW = 36654

/** `MOD-CC-13`'s action matrix (§21.16). */
const CC13_HEADER = 38680
const CC13_SEPARATOR = 38681

/** `MTX-TEN-02c` — chapter 17's MODULE-keyed matrix, the fifth table. */
const MTX02C_HEADER = 22056
const MTX02C_SEPARATOR = 22057
const MTX02C_OWN_ROW = 22060

const RUN_PAGE = join('app', 'command-center', CC03_RUN_SLUG, 'page.tsx')
const CELL_PAGE = join('app', 'command-center', CC03_CELL_SLUG, 'page.tsx')

describe('the matrix is eight rows, counted off the source', () => {
  // FAILS IF: the transcription gains or loses a row. The count comes from
  // walking the SOURCE from its separator, so it cannot be satisfied by the
  // model's own length, and the separator is excluded by position.
  // PLANTED: deleted row 4 (`See the pinned workflow version on a run`) from
  // `CC03_MATRIX`.
  // RED: expected 7 to be 8 // Object.is equality
  it('walks eight data rows from L36653 and the model carries the same eight', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(8)
    expect(CC03_MATRIX.length).toBe(rows.length)
    expect(rows[0]?.line).toBe(OWN_FIRST_ROW)
    expect(rows[rows.length - 1]?.line).toBe(36661)
  })

  // FAILS IF: the body is read as running past its end, which is how a span
  // becomes a count. The line after the last data row is blank and the one
  // after that opens `**Preconditions.**` at L36663, so the walk above stops
  // for a reason the source states rather than one a dispatch asserted.
  it('stops where the source stops, one line short of the preconditions paragraph', () => {
    expect(srcLine(OWN_SEPARATOR + 9)).toBe('')
    expect(srcLine(36663).startsWith('**Preconditions.**')).toBe(true)
    expect(isTableRow(srcLine(OWN_SEPARATOR + 9))).toBe(false)
  })

  // FAILS IF: the dispatch's card span is copied into this build as though it
  // were read. The line that dispatch gave as the card's end is BLANK and
  // sits above the matrix, so it cannot end a card whose matrix begins at
  // L36652 and whose closing rule is at L36794. The blank line's number is
  // NOT spelled here: a knowingly-false citation of a blank line is still a
  // knowingly-false citation, and `locator-fidelity` has gone red on exactly
  // that shape in a sibling module.
  it('the card runs past the blank line the dispatch gave as its end', () => {
    expect(srcLine(CARD_HEAD)).toContain('21.6 Module')
    expect(srcLine(CARD_HEAD)).toContain('MOD-CC-03')
    expect(srcLine(CARD_HEAD + 31)).toBe('')
    expect(srcLine(36650)).toBe('**Roles that see and use it, and their permissions.**')
    expect(srcLine(36794)).toBe('---')
    expect(srcLine(36796).startsWith('## 21.7')).toBe(true)
    // The identity line the spine cites is the card's own, and it is not blank.
    expect(srcLine(Number(CC03_MODULE.sourceRef.slice(1)))).toContain('**Identity.**')
  })
})

describe('the columns are the header line’s own, in the header line’s own order', () => {
  // FAILS IF: the transcription is read positionally against the Frontline
  // habit, which opens on Worker. The expected list is READ FROM L36652 at
  // test time, so it cannot be satisfied by a constant this task also wrote.
  // PLANTED: swapped `'Tenant Admin'` and `'Worker'` in `CC03_COLUMNS`.
  // RED: expected [ 'Worker', 'Supervisor', …(3) ] to deeply equal [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('reads Tenant Admin first and Worker last, off L36652', () => {
    const header = cells(srcLine(OWN_HEADER))
    expect(header[0]).toBe('Capability on this module')
    expect([...CC03_COLUMNS]).toEqual(header.slice(1))
    expect(header[1]).toBe('Tenant Admin')
    expect(header[header.length - 1]).toBe('Worker')
  })

  it('every source column has a model column and no model column is invented', () => {
    const header = cells(srcLine(OWN_HEADER)).slice(1)
    for (const name of header) expect(CC03_COLUMNS).toContain(name)
    for (const name of CC03_COLUMNS) expect(header).toContain(name)
  })
})

describe('every one of the forty cells is verbatim, header-keyed', () => {
  // FAILS IF: any cell text drifts from the source, in any row, in any
  // column. Row and column are both resolved by NAME, so a permutation of the
  // three near-uniform columns cannot pass by arithmetic.
  // PLANTED: changed row 5's Supervisor cell from `Allowed with conditions —
  // only reached from an exception, alert or approval item` to a bare
  // `Allowed` — the exception-led rule erased, which is the one thing this
  // module exists to hold.
  // RED: L36658 · Supervisor: expected 'Allowed with conditions — only
  //      reache…' to be 'Allowed' // Object.is equality
  it('matches L36654-L36661 cell for cell', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(CC03_MATRIX.length)
    for (const row of CC03_MATRIX) {
      const src = rows.find((r) => r.line === Number(row.sourceRef.slice(1)))
      expect(src, `no source row at ${row.sourceRef}`).toBeDefined()
      expect(src?.cells[0]).toBe(row.capability)
      for (const column of CC03_COLUMNS) {
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
    for (const row of CC03_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      expect(isTableRow(srcLine(line))).toBe(true)
      expect(cells(srcLine(line))[0]).toBe(row.capability)
    }
  })
})

describe('`Allowed` is a prefix of `Allowed with conditions`, and nothing here tests by prefix', () => {
  // FAILS IF: a cell's token is classified by prefix rather than by exact
  // equality on the head. Row 5's two cells are the live case: both start
  // with `Allowed` and neither token is `Allowed`.
  // PLANTED: changed `cell()` in matrix.ts from
  // `CC03_TOKENS.find((t) => t === head)` to
  // `CC03_TOKENS.find((t) => head.startsWith(t))`.
  // RED: expected 'Allowed' to be 'Allowed with conditions' // Object.is equality
  it('row 5’s two grants are `Allowed with conditions`, not `Allowed`', () => {
    for (const column of ['Supervisor', 'Quality Manager'] as const) {
      const c = cc03Cell(5, column)
      expect(c.text.startsWith('Allowed')).toBe(true)
      expect(c.token).toBe('Allowed with conditions')
      expect(c.token).not.toBe('Allowed')
      expect(c.note).not.toBeNull()
    }
    expect(cc03Cell(5, 'Supervisor').note).toBe(
      'only reached from an exception, alert or approval item',
    )
    expect(cc03Cell(5, 'Quality Manager').note).toBe('same conditions')
  })

  // FAILS IF: a token is not the exact head of its own cell. Asserted over
  // every cell rather than the interesting ones, because a classifier that is
  // right about row 5 by luck is wrong about the next matrix.
  it('every token is exactly the cell’s own head, split on its own em dash', () => {
    for (const row of CC03_MATRIX) {
      for (const column of CC03_COLUMNS) {
        const c = row.cells[column]
        expect(c.text.split(' — ')[0], `${row.sourceRef} · ${column}`).toBe(c.token)
        expect(CC03_TOKENS).toContain(c.token)
        expect(PERMISSION_OUTCOMES).toContain(CC03_TOKEN_OUTCOME[c.token])
      }
    }
  })

  // FAILS IF: the vocabulary is inferred from the first rows rather than
  // counted over all forty cells. `MOD-CC-04`'s sibling matrix uses three
  // tokens and this one uses five; two of the five occur on row 7 alone, and
  // a vocabulary derived from rows 1-6 is complete over thirty of forty cells
  // and wrong about the row whose act leaves this surface.
  // PLANTED: deleted `'Read-only'` from `CC03_TOKENS`.
  // RED: MOD-CC-03 matrix cell "Read-only — by link into the Delivery
  //      Operations Hub" has head "Read-only", which is not one of the tokens
  //      L36654-L36661 use.
  it('five tokens, and two of them occur on row 7 alone', () => {
    const observed = new Set<string>()
    for (const row of dataRows(OWN_SEPARATOR)) {
      for (const column of CC03_COLUMNS) {
        const text = row.cells[columnIndex(OWN_HEADER, column)] ?? ''
        observed.add(text.split(' — ')[0] ?? '')
      }
    }
    expect(observed.size).toBe(5)
    expect([...observed].sort()).toEqual([...CC03_TOKENS].sort())

    const rowsCarrying = (token: string): number[] =>
      CC03_MATRIX.filter((r) => CC03_COLUMNS.some((c) => r.cells[c].token === token)).map(
        (r) => r.ordinal,
      )
    expect(rowsCarrying('Read-only')).toEqual([CC03_ROW_HELD_ELSEWHERE])
    expect(rowsCarrying('Not applicable')).toEqual([CC03_ROW_HELD_ELSEWHERE])
  })
})

describe('a FIFTH table answers this module’s permission question, keyed on the module', () => {
  const tenantAdmin = CC03_DIVERGENCES.find((d) => d.id === 'tenant-admin-absent-or-read-only')

  // FAILS IF: `MTX-TEN-02c` is read as anything but thirteen module rows, or
  // this module's row is read off the wrong line. The header is chapter 17's
  // own and carries a leading `#` column that §21.6's does not, so a
  // positional read of either against the other lands one column out.
  // PLANTED: changed `statements[2].line` in readings.ts from 22060 to 22061,
  // which is MOD-CC-04's row in the same table.
  // RED: expected 'MOD-CC-04' to be 'MOD-CC-03' // Object.is equality
  it('walks thirteen rows and finds this module at L22060', () => {
    const rows = dataRows(MTX02C_SEPARATOR)
    expect(rows.length).toBe(13)
    expect(rows[0]?.line).toBe(22058)
    expect(cells(srcLine(MTX02C_HEADER))[0]).toBe('#')
    const declared = tenantAdmin?.statements.find((s) => s.line >= 22058 && s.line <= 22070)
    expect(declared).toBeDefined()
    expect(cells(srcLine(declared?.line ?? 0))[0]).toBe(CC03_MODULE.id)
    expect(cells(srcLine(MTX02C_OWN_ROW))[0]).toBe(CC03_MODULE.id)
  })

  // FAILS IF: the two tables stop disagreeing, or the disagreement is
  // recorded as something other than what the two lines say. Both sides are
  // read at test time, header-keyed on their own headers.
  // PLANTED: changed the first reading's locator in readings.ts to cite
  // L36654-L36660 instead of L36654-L36661 — a citation that no longer
  // covers the eight rows the reading claims.
  // RED: expected 'MOD-CC-03 §21.6 · L36654-L36660; §21.1.2 · L35004' to contain 'L36661'
  it('§21.6 says Explicitly prohibited on all eight; MTX-TEN-02c says Read-only', () => {
    const ta = columnIndex(OWN_HEADER, 'Tenant Admin')
    const own = dataRows(OWN_SEPARATOR).map((r) => r.cells[ta])
    expect(own.length).toBe(8)
    expect(new Set(own).size).toBe(1)
    expect(own[0]).toBe('Explicitly prohibited')

    const foreign = cells(srcLine(MTX02C_OWN_ROW))[columnIndex(MTX02C_HEADER, 'Tenant Admin')]
    expect(foreign).toBe('Read-only [K1]')
    expect(foreign).not.toBe(own[0])

    // The two tokens are two different members of the nine-token vocabulary.
    expect(CC03_TOKEN_OUTCOME['Explicitly prohibited']).toBe('explicitlyProhibited')
    expect(CC03_TOKEN_OUTCOME['Read-only']).toBe('readOnly')
    expect(tenantAdmin?.readings[0].locator).toContain('L36661')
    expect(tenantAdmin?.decisionRef).toBe('DEC-TACC-001')
  })

  // FAILS IF: the Supervisor divergence is recorded as reaching rows it does
  // not reach. It is the four navigation rows, and only those: rows 5, 6, 7
  // and 8 do not read `Allowed` in that column.
  it('the Supervisor divergence covers exactly the four rows that read `Allowed`', () => {
    const sup = columnIndex(OWN_HEADER, 'Supervisor')
    const allowedRows = dataRows(OWN_SEPARATOR)
      .filter((r) => r.cells[sup] === 'Allowed')
      .map((r) => r.line)
    const divergence = CC03_DIVERGENCES.find((d) => d.id === 'supervisor-allowed-or-read-only')
    expect(divergence?.ownRows.map((o) => Number(cc03Row(o).sourceRef.slice(1)))).toEqual(
      allowedRows,
    )
    expect(cells(srcLine(MTX02C_OWN_ROW))[columnIndex(MTX02C_HEADER, 'Supervisor')]).toBe(
      'Read-only [K2]',
    )
  })
})

describe('`DEC-TACC-001` is real, is open, and is in neither register this build has', () => {
  // FAILS IF: the decision is minted here rather than read, or the card line
  // stops carrying it. The register row and the card are separate lines and
  // both are asserted, because a decision that exists only in a conditions
  // footnote is a different claim from one the chapter registers.
  // PLANTED: changed `cardLine` in readings.ts from 23069 to 23070.
  // RED: expected '' to contain 'DEC-TACC-001'
  it('the card at L23069 raises it and the chapter-17 register row files it', () => {
    const card = srcLine(CC03_TACC_DISCLOSURE.cardLine)
    expect(card).toContain('DEC-TACC-001')
    expect(card).toContain('MTX-TEN-02c')
    expect(card).toContain('Tenant Admin column')
    const registerRow = cells(srcLine(CC03_TACC_DISCLOSURE.registerRowLine))
    expect(registerRow[0]).toBe('DEC-TACC-001')
    // The condition footnote is a third statement, not a repeat of the card.
    expect(srcLine(22072)).toContain('`[K1]` `DEC-TACC-001`')
  })

  // FAILS IF: the identifier is lifted into either register and this local
  // record is left behind as a second spelling. The gate asserts ABSENCE, so
  // the day someone lifts it this suite goes red and forces the switch.
  // PLANTED: added `| 'DEC-TACC-001'` to `CcDecisionId` in
  // src/surfaces/cc/decisions/register.ts.
  // RED: expected true to be false // Object.is equality
  it('absent from the canon and absent from CcDecisionId', () => {
    expect(read('src/disclosure/decisions.ts').includes(CC03_TACC_DISCLOSURE.decisionRef)).toBe(
      false,
    )
    expect(
      read('src/surfaces/cc/decisions/register.ts').includes(CC03_TACC_DISCLOSURE.decisionRef),
    ).toBe(false)
    expect(
      read('src/surfaces/cc/decisions/disclosure.ts').includes(CC03_TACC_DISCLOSURE.decisionRef),
    ).toBe(false)
  })

  // FAILS IF: the card's recommendation is promoted to an adoption. It is a
  // recommendation and the card says so; `adopted` is typed `false` and
  // cannot be written any other way.
  it('the recommendation is recorded as a recommendation and not adopted', () => {
    expect(CC03_TACC_DISCLOSURE.adopted).toBe(false)
    expect(srcLine(CC03_TACC_DISCLOSURE.cardLine)).toContain('Recommendation:')
    for (const option of CC03_TACC_DISCLOSURE.options) {
      expect(srcLine(CC03_TACC_DISCLOSURE.cardLine)).toContain(option)
    }
  })
})

describe('action 8 is placed on this module and absent from this module’s matrix', () => {
  // FAILS IF: a ninth row is invented to make `AC-CC-400` pass. Both halves
  // are asserted: the count off the source, and the absence of the
  // capability. The two are NOT redundant — a renamed existing row keeps the
  // count at eight and trips only the second — and the plant campaign ran
  // each defect against each gate to show it.
  // PLANTED (a): added a ninth row `Reassign a run mid-shift` to
  // `CC03_MATRIX`. FOUR reds across the file, this gate among them:
  //   expected 9 to be 8 · expected 8 to be 9 ·
  //   expected 'Edit any capture, step or run record' to be 'Reassign a run mid-shift' ·
  //   expected [ 'Reassign a run mid-shift' ] to deeply equal []
  // PLANTED (b): renamed row 1's capability to `Reassign a run mid-shift`,
  // which keeps the count at eight. THREE reds, and the row-count gate stayed
  // green — which is why the two halves are separate assertions:
  //   expected 'Drill from board to cell view' to be 'Reassign a run mid-shift' (twice) ·
  //   expected [ 'Reassign a run mid-shift' ] to deeply equal []
  it('no capability row of the eight is about reassignment', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(8)
    const inSource = rows.map((r) => r.cells[0] ?? '').filter((c) => /reassign/i.test(c))
    expect(inSource).toEqual([])
    const inModel = CC03_MATRIX.map((r) => r.capability).filter((c) => /reassign/i.test(c))
    expect(inModel).toEqual([])
    expect(CC03_ACTION_8.absentFromOwnMatrix).toBe(true)
  })

  // FAILS IF: the action's authority is respelled here rather than read from
  // `MOD-CC-13`'s own matrix, or the ordinal drifts. §21.16's header carries
  // a leading `#` column that §21.6's does not.
  // PLANTED: changed `CC03_ACTION_8.matrixRef` from 'L38689' to 'L38688'.
  // RED: expected 'Mark evidence reviewed' to be 'Reassign a run mid-shift'
  it('its authority is §21.16 row 8, read at test time', () => {
    const rows = dataRows(CC13_SEPARATOR)
    expect(rows.length).toBe(10)
    const line = Number(CC03_ACTION_8.matrixRef.slice(1))
    const row = cells(srcLine(line))
    expect(row[columnIndex(CC13_HEADER, 'Action')]).toBe(CC03_ACTION_8.action)
    expect(row[columnIndex(CC13_HEADER, '#')]).toBe(String(CC03_ACTION_8.ordinal))
    // Wave 0's own record of the same row, so the two cannot drift apart.
    expect(cc13Action(8).matrixAction).toBe(CC03_ACTION_8.action)
  })

  // FAILS IF: the placement is asserted from fewer lines than the source
  // supplies. The dispatch named two; there are three, and the third is on
  // this module's own card.
  // PLANTED: deleted the L36706 entry from `CC03_ACTION_8.placedHereBy`.
  // RED: expected [ 'L38793', 'L38765' ] to deeply equal [ 'L36706', 'L38793', 'L38765' ]
  it('three lines place it here, and each of the three carries what is claimed', () => {
    expect(CC03_ACTION_8.placedHereBy.map((p) => p.ref)).toEqual(['L36706', 'L38793', 'L38765'])

    // This module's own interconnection paragraph.
    expect(srcLine(36706)).toContain('**Interconnections.**')
    expect(srcLine(36706)).toContain(
      'Supplies the run context that action 8, reassign a run mid-shift, operates on in `MOD-CC-13`',
    )

    // MOD-CC-13's, which enumerates seven modules. Anchored at both ends so
    // an unanchored pattern cannot invent a member of the family.
    const l38793 = srcLine(38793)
    const named = [...l38793.matchAll(/`(MOD-CC-\d{2})` for /g)].map((m) => m[1])
    expect(named.length).toBe(7)
    expect(named).toContain(CC03_MODULE.id)
    expect(l38793).toContain('`MOD-CC-03` for 8.')

    // SB-CC-24, which opens on THIS module's run view.
    expect(srcLine(38765)).toContain('`SB-CC-24`')
    expect(srcLine(38765)).toContain('action 8, reassigning a run mid-shift')
    expect(srcLine(38767)).toContain('opens the run view')

    expect(srcLine(Number(CC03_ACTION_8.criterionRef.slice(1)))).toContain(
      CC03_ACTION_8.criterion,
    )
    expect(srcLine(Number(CC03_ACTION_8.criterionRef.slice(1)))).toContain(
      'Exactly ten operational actions are reachable from this surface; no eleventh endpoint exists.',
    )
  })

  // FAILS IF: either route stops mounting `MOD-CC-13`'s CONTROL rail, or
  // mounts wave 0's card rail instead. Both routes are checked: mounting it
  // on one of a module's two screens would make action 8 reachable from one
  // and not the other, which is a rule the source states nowhere.
  // PLANTED: removed the `actionRail={…}` prop from the run drill-down.
  // RED: app/command-center/run-drill-down/page.tsx: expected false to be true
  it('both routes mount Cc13ActionRail and neither mounts the card rail', () => {
    for (const page of [RUN_PAGE, CELL_PAGE]) {
      const text = read(page)
      expect(text.includes('Cc13ActionRail'), page).toBe(true)
      expect(text.includes('actionRail='), page).toBe(true)
      expect(text.includes("from '@/surfaces/cc/actions/ActionRail'"), page).toBe(false)
      expect(text.includes(`mountedOn={CC03_MODULE.id}`), page).toBe(true)
    }
  })
})

describe('two screens, one module, one slug', () => {
  // FAILS IF: a slug is typed rather than derived, or a directory is named
  // something else. `CC_NAV` publishes both pathnames from the spine and the
  // generator reads a declared slug with no directory as "declared, not
  // built"; the cell view's key is the screen catalogue's `unownedSlug`,
  // which this task did not choose.
  // PLANTED: renamed `app/command-center/cell-view` to
  // `app/command-center/cell-view-x`.
  // RED: ENOENT: no such file or directory, statSync '…/app/command-center/cell-view'
  it('the spine names both route keys and both directories are on disk', () => {
    expect(CC03_MODULE.id).toBe('MOD-CC-03')
    expect(CC03_RUN_SLUG).toBe(CC03_MODULE.slug)
    expect(CC03_RUN_SCREEN.owningModule).toBe(CC03_MODULE.id)
    // The cell view is owned by no module and still carries a settled key.
    expect(CC03_CELL_SCREEN.owningModule).toBeNull()
    expect(CC03_CELL_SLUG).toBe(CC03_CELL_SCREEN.unownedSlug)
    expect(CC03_CELL_SLUG).not.toBe(CC03_RUN_SLUG)
    for (const slug of [CC03_RUN_SLUG, CC03_CELL_SLUG]) {
      const dir = join(process.cwd(), 'app', 'command-center', slug)
      expect(statSync(dir).isDirectory(), slug).toBe(true)
      expect(statSync(join(dir, 'page.tsx')).isFile(), slug).toBe(true)
      expect(CC_NAV.some((e) => e.pathname === ccPathname(slug)), slug).toBe(true)
    }
  })

  // FAILS IF: this module claims two slugs. The generator throws on a slug
  // matching more than one directory, so the second screen's route must not
  // be a claim. Asserted against the spine rather than against a directory
  // listing, which would go red on a sibling's correct work.
  it('the module declares exactly one slug for its two register rows', () => {
    const registerRows = [CC03_RUN_SCREEN, CC03_CELL_SCREEN]
    for (const s of registerRows) {
      expect(srcLine(Number(s.registerRef.slice(1)))).toContain(CC03_MODULE.id)
    }
    expect(registerRows.filter((s) => s.owningModule === CC03_MODULE.id).length).toBe(1)
    expect(srcLine(Number(CC03_RUN_SCREEN.registerRef.slice(1)))).toContain(
      'MOD-CC-03 all features',
    )
    expect(srcLine(Number(CC03_CELL_SCREEN.registerRef.slice(1)))).toContain(
      'MOD-CC-03 FEAT-CC-0301',
    )
  })

  // FAILS IF: either route ships without saying what it is. A module
  // demonstrated by its slug claim alone never names itself, and the cell
  // view has no slug claim at all — the generator awards it by argmax over
  // the module ids its files name, so a page that never says is the whole
  // defect rather than a lapse.
  //
  // A BARE `includes` HERE WOULD BE A GATE THAT COULD NOT FAIL: both files
  // name other Command Center modules in their headers, so the gate requires
  // an occurrence on a line naming no OTHER `MOD-CC-*`.
  //
  // REDUNDANT PROTECTIONS, AND THEY CANNOT BE VERIFIED ONE AT A TIME. The two
  // route files are two independent applications of one rule, so the removal
  // of EACH and of BOTH was planted. The offenders are COLLECTED rather than
  // asserted inside the loop: a per-iteration `expect` throws on the first
  // file and reports one name for a two-file defect, which is a gate that
  // under-reports — the shape a dependency check goes green on.
  // PLANTED (a): replaced the run drill-down's one self-naming line with
  // "this module". RED: expected [ 'app/command-center/run-drill-down/page.tsx' ] to deeply equal []
  // PLANTED (b): the same on all three of the cell view's self-naming lines.
  // RED: expected [ 'app/command-center/cell-view/page.tsx' ] to deeply equal []
  // PLANTED (a+b): both. RED naming BOTH files, which is what the collection
  // buys — the per-iteration form named only the run drill-down.
  it('each route file names MOD-CC-03 on a line about no other module', () => {
    const offenders = [RUN_PAGE, CELL_PAGE].filter((page) => {
      const own = read(page)
        .split('\n')
        .filter((l) => l.includes(CC03_MODULE.id))
        .filter((l) => {
          const others = [...l.matchAll(/\bMOD-CC-\d{2}\b/g)].map((m) => m[0])
          return others.every((o) => o === CC03_MODULE.id)
        })
      return own.length === 0
    })
    expect(offenders).toEqual([])
    expect(read(RUN_PAGE).includes(CC03_RUN_SCREEN.id)).toBe(true)
    expect(read(CELL_PAGE).includes(CC03_CELL_SCREEN.id)).toBe(true)
  })

  // FAILS IF: the two screens stop differing, which is the only thing that
  // makes them two screens. The feature list is DERIVED from each register
  // row's own cell, so it cannot be satisfied by a preference.
  // PLANTED: changed SCR-CC-03's `features` in matrix.ts to all three.
  // RED: expected 3 to be 1 // Object.is equality
  it('the cell view shows one feature and the run view shows all three', () => {
    expect(cc03ScreenFeatures('SCR-CC-03').features.length).toBe(1)
    expect(cc03ScreenFeatures('SCR-CC-04').features.length).toBe(CC03_FEATURES.length)
    for (const s of CC03_SCREEN_FEATURES) {
      const row = srcLine(Number(s.registerRef.slice(1)))
      expect(row).toContain(s.modulesShownCell)
      expect(row).toContain(s.navigationEntry)
      // Every feature named in the cell exists on the card, anchored.
      for (const named of [...s.modulesShownCell.matchAll(/\bFEAT-CC-\d{4}\b/g)].map((m) => m[0])) {
        expect(s.features).toContain(named)
      }
    }
    // The chain is the navigation column read forwards: board, cell, run.
    expect(CC03_CHAIN.map((c) => c.screen)).toEqual(['SCR-CC-02', 'SCR-CC-03', 'SCR-CC-04'])
    expect(CC03_CHAIN[1]?.label).toBe(cc03ScreenFeatures('SCR-CC-04').navigationEntry)
  })
})

describe('the card’s features and functionalities, counted', () => {
  // FAILS IF: a feature or functionality is missed, or one is invented. Both
  // sets are counted off the card's own lines with anchored patterns, and the
  // card's span is walked rather than a dispatch's number trusted.
  // PLANTED: deleted `FUNC-CC-0302-2-1` from `CC03_FUNCTIONALITIES`.
  // RED: expected 8 to be 9 // Object.is equality
  it('three features and nine functionalities, walked over §21.6', () => {
    const cardLines = LINES.slice(CARD_HEAD - 1, 36794)
    const featureIds = new Set<string>()
    const funcIds = new Set<string>()
    for (const line of cardLines) {
      for (const m of line.matchAll(/\*\*`(FEAT-CC-\d{4})`/g)) featureIds.add(m[1] as string)
      for (const m of line.matchAll(/\*\*`(FUNC-CC-\d{4}-\d-\d)`/g)) funcIds.add(m[1] as string)
    }
    expect(featureIds.size).toBe(3)
    expect(funcIds.size).toBe(9)
    expect(CC03_FEATURES.length).toBe(featureIds.size)
    expect(CC03_FUNCTIONALITIES.length).toBe(funcIds.size)
    for (const f of CC03_FEATURES) {
      expect(featureIds.has(f.id)).toBe(true)
      expect(srcLine(Number(f.sourceRef.slice(1)))).toContain(f.id)
      expect(srcLine(Number(f.sourceRef.slice(1)))).toContain(f.name)
    }
    for (const f of CC03_FUNCTIONALITIES) {
      expect(funcIds.has(f.id)).toBe(true)
      expect(srcLine(Number(f.sourceRef.slice(1)))).toContain(f.id)
      expect(CC03_FEATURES.map((x) => x.id)).toContain(cc03FeatureOf(f.id))
    }
  })

  // FAILS IF: a functionality's fallback list is written rather than read.
  // Each is checked against its own line: a line naming an FB-CC pattern must
  // carry it, and a line saying "Fallback: not applicable" must carry none.
  // PLANTED: added `'FB-CC-STALE'` to `FUNC-CC-0302-1-1`'s patterns — the
  // repair that would make AC-CC-090 pass by inventing a degraded mode for a
  // prohibition.
  // RED: expected [ 'FUNC-CC-0302-1-2', 'FUNC-CC-0302-2-1' ] to deeply equal
  //      [ 'FUNC-CC-0302-1-1', 'FUNC-CC-0302-1-2', 'FUNC-CC-0302-2-1' ]
  it('AC-CC-090 fails on this card: three of nine functionalities name no pattern', () => {
    const ac = srcLine(Number(CC03_AC_090_GAP.criterionRef.slice(1)))
    expect(ac).toContain(CC03_AC_090_GAP.criterion)
    expect(ac).toContain(CC03_AC_090_GAP.criterionText)

    // Read off the source, never off the constant.
    const fromSource = CC03_FUNCTIONALITIES.filter((f) => {
      const line = srcLine(Number(f.sourceRef.slice(1)))
      return [...line.matchAll(/`(FB-CC-[A-Z]+)`/g)].length === 0
    }).map((f) => f.id)
    expect(fromSource).toEqual([...CC03_AC_090_GAP.functionalitiesNamingNoPattern])
    expect(fromSource.length).toBe(3)
    expect(CC03_AC_090_GAP.satisfied).toBe(false)

    // And the model agrees with the source, through task 3's own helper.
    expect([...ccFunctionalitiesNamingNoPattern([...CC03_FUNCTIONALITIES])]).toEqual(fromSource)

    // Each of the three says why, in its own words.
    expect(srcLine(36734)).toContain('Fallback: not applicable — a prohibition has no degraded mode.')
    for (const f of CC03_AC_090_GAP.functionalitiesNamingNoPattern) {
      const entry = CC03_FUNCTIONALITIES.find((x) => x.id === f)
      expect(srcLine(Number(entry?.sourceRef.slice(1) ?? 0))).toContain('Fallback: not applicable')
    }
  })

  // FAILS IF: the mirror gap is lost. The card declares three fallback
  // identifiers at module level and one of them is named by no functionality
  // on the card at all — the inverse of the criterion above.
  // PLANTED: changed `namedByNoFunctionality` to `[]`.
  // RED: expected [] to deeply equal [ 'FB-CC-AGENT' ]
  it('FB-CC-AGENT is declared at module level and named by no functionality', () => {
    const declared = [
      ...srcLine(Number(CC03_AC_090_GAP.declaredAtModuleLevelRef.slice(1))).matchAll(
        /`(FB-CC-[A-Z]+)`/g,
      ),
    ].map((m) => m[1] as string)
    expect(declared).toEqual([...CC03_AC_090_GAP.declaredAtModuleLevel])
    const namedByFunctionalities = new Set(
      CC03_FUNCTIONALITIES.flatMap((f) =>
        [...srcLine(Number(f.sourceRef.slice(1))).matchAll(/`(FB-CC-[A-Z]+)`/g)].map(
          (m) => m[1] as string,
        ),
      ),
    )
    const orphans = declared.filter((d) => !namedByFunctionalities.has(d))
    expect(orphans).toEqual([...CC03_AC_090_GAP.namedByNoFunctionality])
  })
})

describe('row 7 owes a link the shared register cannot hold', () => {
  // FAILS IF: this module is recorded as being in the shared link-out
  // register when it is not, or the register grows an entry for it without
  // this record being updated. Both directions matter: the absence is the
  // finding and a silent later addition would make the finding stale.
  // PLANTED: flipped `registeredInSharedRegister` to `true`.
  // RED: expected true to be false // Object.is equality
  it('no MOD-CC-03 cell is in CC_LINK_OUT_CELLS, and Read-only is not a token there', () => {
    expect(CC_LINK_OUT_CELLS.filter((c) => c.moduleId === CC03_MODULE.id)).toEqual([])
    expect(CC03_HISTORY_LINK.registeredInSharedRegister).toBe(false)
    // The reason it is unconstructible there, read off that file's own vocabulary.
    expect(CC_LINK_OUT_TOKENS).not.toContain(CC03_HISTORY_LINK.token)
    expect(cc03Cell(CC03_ROW_HELD_ELSEWHERE, 'Supervisor').token).toBe(CC03_HISTORY_LINK.token)
  })

  // FAILS IF: the obligation is asserted from fewer places than the source
  // states it, or one of the four lines stops carrying it. Every one is
  // opened at test time.
  // PLANTED: changed `obligationRefs` to drop 'L36767'.
  // RED: expected [ 'L36688', 'L36740', 'L36775' ] to have a length of 4 but got 3
  it('four lines require the link and the matrix cell is none of them', () => {
    expect(CC03_HISTORY_LINK.obligationRefs).toHaveLength(4)
    expect(srcLine(36688)).toContain(
      'The drill offers a link into the Delivery Operations Hub run history and Execution Summaries',
    )
    expect(srcLine(36740)).toContain('FUNC-CC-0303-1-1')
    expect(srcLine(36740)).toContain('only by link into the Delivery Operations Hub')
    expect(srcLine(36767)).toContain('offers the link into the Delivery Operations Hub run record')
    expect(srcLine(36775)).toContain('AC-CC-204')
    expect(srcLine(36775)).toContain('a link into the Delivery Operations Hub is offered instead')
    // The row itself, whose two link-bearing cells carry the same text.
    expect(cc03Cell(CC03_ROW_HELD_ELSEWHERE, 'Supervisor').text).toBe(
      cc03Cell(CC03_ROW_HELD_ELSEWHERE, 'Quality Manager').text,
    )
    // And the Auditor's cell on the same row names the Hub and owes nothing.
    const auditor = cc03Cell(CC03_ROW_HELD_ELSEWHERE, 'Read-only Auditor')
    expect(auditor.token).toBe('Not applicable')
    expect(auditor.text).toContain('needs no Command Center route')
  })
})

describe('the surface-wide criterion this module cannot enforce', () => {
  // FAILS IF: this module claims to enforce `AC-CC-203`, which is scoped to
  // the whole surface while this module owns two of its thirteen routes. The
  // AC-OFF-702 shape: naming the criterion is the deliverable and claiming
  // enforcement would be false.
  // PLANTED: flipped `enforcedHere` to `true`.
  // RED: expected true to be false // Object.is equality
  it('AC-CC-203 is surface-wide, and row 6 is what this module can actually say', () => {
    const ac = srcLine(Number(CC03_SURFACE_WIDE_CRITERION.criterionRef.slice(1)))
    expect(ac).toContain(CC03_SURFACE_WIDE_CRITERION.criterion)
    expect(ac).toContain('anywhere on the surface')
    expect(CC03_SURFACE_WIDE_CRITERION.enforcedHere).toBe(false)
    expect(CC03_SURFACE_WIDE_CRITERION.thisModuleOwns).toBeLessThan(CC_NAV.length)
    expect(srcLine(CC03_SURFACE_WIDE_CRITERION.alsoStatedAt)).toContain('[Derived Clarification]')

    // Row 6 is uniform across all five columns, which is what makes it a
    // prohibition of the AXIS rather than of a person.
    const row6 = cc03Row(6)
    expect(row6.capability).toBe('Navigate by worker as an entry point')
    expect(new Set(CC03_COLUMNS.map((c) => row6.cells[c].text)).size).toBe(1)
    expect(row6.cells['Supervisor'].token).toBe('Explicitly prohibited')
  })
})

describe('the freshness classes are read from §21.3’s table, not restated', () => {
  // FAILS IF: an element assignment is copied instead of read, or one of the
  // two rows loses its class or its obligation.
  // PLANTED: changed the `Step-level capture detail` row's `markerObligation`
  // in live/model.ts from `As-of time and late-arrival flag` to `As-of time`.
  // RED: expected 'As-of time' to be 'As-of time and late-arrival flag'
  it('two elements are assigned here, in two different classes', () => {
    const expected = [
      { element: 'Run progress and pace', line: 35893, cls: 'refreshed' },
      { element: 'Step-level capture detail', line: 35898, cls: 'on-sync' },
    ]
    for (const e of expected) {
      const row = cells(srcLine(e.line))
      expect(row[0]).toBe(e.element)
      expect(row[1]).toContain(CC03_MODULE.id)
      const a = ccElementAssignment(e.element)
      expect(a.classCell).toBe(row[2])
      expect(a.markerObligation).toBe(row[3])
      expect(a.freshnessClass).toBe(e.cls)
      expect(a.modules).toContain(CC03_MODULE.id)
    }
    expect(ccElementAssignment('Step-level capture detail').markerObligation).toBe(
      'As-of time and late-arrival flag',
    )
  })
})

describe('the disciplines this slice pays for', () => {
  const OWN_DIR = 'src/surfaces/cc/modules/cc-03'
  const OWN_FILES = readdirSync(join(process.cwd(), OWN_DIR))
    .filter((f) => !isForeignProbe(f))
    .map((f) => join(OWN_DIR, f))
  const ALL_FILES = [...OWN_FILES, RUN_PAGE, CELL_PAGE]

  // FAILS IF: a closed vocabulary is annotated `readonly T[]` instead of
  // `as const satisfies readonly T[]`. The release gate has caught that
  // eighteen times across two slices.
  // PLANTED: changed `CC03_TOKENS` to
  // `export const CC03_TOKENS: readonly string[] = [...]`.
  // RED: expected [ Array(1) ] to deeply equal []
  it('every exported array literal is `as const satisfies`', () => {
    const offenders = OWN_FILES.filter((f) =>
      /^export const \w+:\s*readonly [^=]*=\s*\[/m.test(read(f)),
    )
    expect(offenders).toEqual([])
  })

  // FAILS IF: a file here acquires `'use client'` while exporting plain data
  // a server component reads. Four Run Player panels shipped an undefined
  // module id in slice 7 exactly that way, invisible to every component test.
  // PLANTED: added `'use client'` to the head of `matrix.ts`.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no file here is a client module', () => {
    const offenders = ALL_FILES.filter((f) => /^'use client'/m.test(read(f)))
    expect(offenders).toEqual([])
  })

  // FAILS IF: a comment here spells a line number that does not carry what
  // the comment says it carries. `tests/coverage/locator-fidelity.test.ts`
  // lexes any `L`-number as a citation; this is the same rule applied to the
  // one thing that suite cannot check, which is whether the line is BLANK.
  // The dispatch's card-end line is blank and is deliberately not spelled in
  // any file of this module.
  // PLANTED: added a comment to `matrix.ts` citing, as the card's end, the
  // blank line the dispatch gave. The line number is not written here: a
  // knowingly-false citation describing a PLANTED defect is still a
  // knowingly-false citation.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no L-number cited in this module’s own files is a blank line', () => {
    const offenders: string[] = []
    for (const f of ALL_FILES) {
      for (const m of read(f).matchAll(/\bL(\d{3,6})\b/g)) {
        const n = Number(m[1])
        if (n >= 1 && n <= LINES.length && srcLine(n).trim() === '') {
          offenders.push(`${f} cites L${n}, which is blank`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
