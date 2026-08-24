import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { CC_LINK_OUT_CELLS, cellTextOf } from '@/surfaces/cc/decisions/link-outs'
import { ccFunctionalitiesNamingNoPattern } from '@/surfaces/cc/fallback/patterns'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC08_ABSENCE_IS_CORRECT_ROW,
  CC08_COLUMNS,
  CC08_LINK_OUT_ROWS,
  CC08_MATRIX,
  CC08_MODULE,
  CC08_SCREEN,
  CC08_SLUG,
  CC08_TOKENS,
  CC08_TOKEN_OUTCOME,
  cc08Cell,
  cc08Row,
} from '@/surfaces/cc/modules/cc-08/matrix'
import {
  CC08_ACTION_NINE_DISAGREEMENT,
  CC08_COMPOSED_AGENT_GAP,
  CC08_DECLARED_FALLBACKS,
  CC08_DIVERGENCES,
  CC08_FUNCTIONALITIES,
} from '@/surfaces/cc/modules/cc-08/readings'

/**
 * `MOD-CC-08` — §21.11, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * Nothing below compares a string this task wrote against another string this
 * task wrote, and **no count is taken from the array under test**: "nine rows"
 * is obtained by walking the source's own table from its separator to the
 * first line that is not a table row, never from `CC08_MATRIX.length` and
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
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and five cells of
 *    this matrix carry the longer token. Every comparison below is an anchored
 *    equality on the cell head, never `startsWith` and never `includes`, and
 *    one gate asserts the prefix relation directly so the trap is visible.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR, which splits
 *    into non-empty cells like any other row. Every walk starts AFTER the
 *    separator and excludes it by position, not by content.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Two columns of this matrix
 *    read `Explicitly prohibited` on all nine rows, so a count of "eighteen
 *    prohibitions" is true however those two columns are permuted. Every cell
 *    gate below names its ROW and its COLUMN, read off the source's own
 *    header.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Every column index
 *    is resolved from its header line BY NAME at test time, in this table and
 *    in the three foreign tables, so reordering anything cannot move a
 *    comparison with it.
 *  - A `page.includes('MOD-CC-08')` CHECK SATISFIED BY A QUOTATION. A file
 *    that quotes a list of identifiers contains every identifier in that list,
 *    so the route gate requires an occurrence on a line naming no OTHER
 *    Command Center module.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking on identifiers; §26.7 uses them and §21.11 does not. */
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

/** The cell at `line` under the column `name` carries on `headerLine`. */
function cellUnder(headerLine: number, line: number, name: string): string {
  return cells(srcLine(line))[columnIndex(headerLine, name)] ?? ''
}

/** This module's own matrix. Header, separator, first and last data line. */
const OWN_HEADER = 37664
const OWN_SEPARATOR = 37665
const OWN_FIRST_ROW = 37666
const OWN_LAST_ROW = 37674

/** The three foreign tables that answer this module's row 9, all header-keyed. */
const SURFACE_HEADER = 35002
const CC13_HEADER = 38680
const CC13_SEPARATOR = 38681
const S254_HEADER = 48442
const S254_SEPARATOR = 48443
/** The screen register, whose row for this screen names the roles that open it. */
const REGISTER_HEADER = 48384
/** The storyboard's status block. */
const SB_HEADER = 37725
const SB_SEPARATOR = 37726

describe('the matrix is nine rows, counted off the source', () => {
  // FAILS IF: the transcription gains or loses a row. The count comes from
  // walking the SOURCE from its separator, so it cannot be satisfied by the
  // model's own length, and the separator is excluded by position.
  // PLANTED: deleted row 8 (`View raw reasoning traces`) from `CC08_MATRIX` —
  // the row a reader is most likely to drop, because it looks like the two
  // above it and is the one where an absence is the correct rendering.
  // RED: expected 8 to be 9 // Object.is equality
  it('walks nine data rows from L37665 and the model carries the same nine', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(9)
    expect(CC08_MATRIX.length).toBe(rows.length)
    expect(rows[0]?.line).toBe(OWN_FIRST_ROW)
    expect(rows[rows.length - 1]?.line).toBe(OWN_LAST_ROW)
  })

  // FAILS IF: the body is read as running past its end, which is how a span
  // becomes a count. The line after the last data row is blank and the one
  // after that opens `**Preconditions.**` at L37676, so the walk above stops
  // for a reason the source states rather than one a dispatch asserted.
  it('stops where the source stops, one line short of the preconditions paragraph', () => {
    expect(srcLine(OWN_LAST_ROW + 1)).toBe('')
    expect(srcLine(37676).startsWith('**Preconditions.**')).toBe(true)
    expect(isTableRow(srcLine(OWN_LAST_ROW + 1))).toBe(false)
  })

  // FAILS IF: the commissioning dispatch's card span is copied into this build
  // as though it were read. The line that dispatch gave as the card's end is
  // BLANK and sits above the matrix, so it cannot end a card whose matrix
  // begins at L37664 and whose closing rule is at L37824. The blank line's own
  // number is deliberately not spelled in any comment in this module.
  it('the card runs past the blank line the dispatch gave as its end', () => {
    expect(srcLine(37634)).toContain('21.11 Module')
    expect(srcLine(37634)).toContain('MOD-CC-08')
    expect(srcLine(OWN_HEADER - 2)).toBe(
      '**Roles that see and use it, and their permissions.**',
    )
    expect(srcLine(37824)).toBe('---')
    expect(srcLine(37826).startsWith('## 21.12')).toBe(true)
    // The dispatch's end line is blank, asserted without naming it.
    expect(srcLine(OWN_HEADER - 3)).toBe('')
  })

  // FAILS IF: the header is read positionally. Tenant Admin first and Worker
  // last is the inversion of every Frontline matrix, and a positional read
  // against that habit swaps them silently on five of the nine rows.
  // PLANTED: reversed `CC08_COLUMNS`.
  // RED: expected [ 'Worker', 'Read-only Auditor', …(3) ] to deeply equal
  //      [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('the five persona columns are the header line’s own words in its own order', () => {
    expect(cells(srcLine(OWN_HEADER))).toEqual([
      'Capability on this module',
      ...CC08_COLUMNS,
    ])
    expect(CC08_COLUMNS[0]).toBe('Tenant Admin')
    expect(CC08_COLUMNS[CC08_COLUMNS.length - 1]).toBe('Worker')
  })
})

describe('all forty-five cells, row by row and column by column', () => {
  // FAILS IF: any cell drifts from the source. Every lookup is keyed on the
  // row's own line and the column's own NAME resolved from the header at test
  // time, so no permutation of columns and no reordering of rows can satisfy
  // it, and a count of prohibitions cannot either.
  // PLANTED: changed row 5's Worker cell from `Explicitly prohibited` to
  // `Allowed with conditions — requires Tenant or Site read scope`, which is
  // the swap a positional read against the Frontline habit produces.
  // RED: expected 'Allowed with conditions — requires Tenant or Site read
  //      scope' to be 'Explicitly prohibited' // Object.is equality
  it('each cell equals the source cell under its own heading', () => {
    for (const row of CC08_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      expect(cells(srcLine(line))[0], `row ${row.ordinal} capability`).toBe(row.capability)
      for (const column of CC08_COLUMNS) {
        expect(
          cellUnder(OWN_HEADER, line, column),
          `row ${row.ordinal} · ${column} · ${row.sourceRef}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the sourceRef of a row stops being that row's own line. The
  // ordinals must also run 1..9 in the source's own order.
  it('every row’s sourceRef is its own line, in the source’s order', () => {
    const lines = CC08_MATRIX.map((r) => Number(r.sourceRef.slice(1)))
    expect(lines).toEqual(dataRows(OWN_SEPARATOR).map((r) => r.line))
    expect(CC08_MATRIX.map((r) => r.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  // FAILS IF: a cell is classified by prefix. `Allowed` IS a prefix of
  // `Allowed with conditions`, and that relation is asserted directly here so
  // the trap is visible rather than implied. The head is compared for exact
  // equality; a `startsWith` classifier would read all five conditional cells
  // as unconditional grants, including the one cell that gives the Tenant
  // Admin anything at all.
  // PLANTED: changed `CC08_TOKENS.find((t) => t === head)` to
  // `CC08_TOKENS.find((t) => head.startsWith(t))` in `matrix.ts`.
  // RED: expected 'Allowed' to be 'Allowed with conditions' // Object.is
  it('every token is an exact head match, and the prefix trap is real', () => {
    expect('Allowed with conditions'.startsWith('Allowed')).toBe(true)
    for (const row of CC08_MATRIX) {
      for (const column of CC08_COLUMNS) {
        const c = row.cells[column]
        const head = c.text.split(' — ')[0]
        expect(c.token, `row ${row.ordinal} · ${column}`).toBe(head)
        expect(CC08_TOKENS).toContain(c.token)
        if (c.token === 'Allowed') expect(c.text.startsWith('Allowed with')).toBe(false)
      }
    }
  })

  // FAILS IF: the note is lost or welded to the token. On rows 6 and 7 the
  // note IS the destination and on row 8 it is the boundary, so a cell that
  // dropped it would be classified identically and rendered wrongly.
  it('the five conditional cells and the three qualified prohibitions keep their notes', () => {
    const withNote = CC08_MATRIX.flatMap((r) =>
      CC08_COLUMNS.map((c) => ({ r, c, cell: r.cells[c] })).filter((x) => x.cell.note !== null),
    )
    expect(withNote.length).toBe(8)
    expect(cc08Cell(5, 'Tenant Admin').note).toBe('requires Tenant or Site read scope')
    expect(cc08Cell(6, 'Tenant Admin').note).toBe(
      'a Standards and Operations Studio action, linked from here',
    )
    expect(cc08Cell(7, 'Tenant Admin').note).toBe('Studio or platform action')
    expect(cc08Cell(8, 'Tenant Admin').note).toBe('platform-internal')
    expect(cc08Cell(1, 'Tenant Admin').note).toBeNull()
  })

  // FAILS IF: the token→outcome map stops covering the tokens in use.
  it('every token in use maps onto the build’s own permission vocabulary', () => {
    for (const t of CC08_TOKENS) expect(CC08_TOKEN_OUTCOME[t]).toBeTruthy()
    expect(CC08_TOKEN_OUTCOME.Allowed).toBe('allowed')
    expect(CC08_TOKEN_OUTCOME['Allowed with conditions']).toBe('allowedWithConditions')
    expect(CC08_TOKEN_OUTCOME['Explicitly prohibited']).toBe('explicitlyProhibited')
  })
})

describe('the two prohibitions that name a destination, and the one that does not', () => {
  // FAILS IF: either link-bearing row loses its registration, or a link-out
  // record stops matching the source line it claims. The whole ROW is compared
  // for equality against the source line, so a record naming the right cell of
  // the wrong row cannot pass.
  // PLANTED: changed `line: 37671` to `line: 37672` on `cc-08-switch-agent` in
  // `src/surfaces/cc/decisions/link-outs.ts` — a task-5 file, reversed
  // byte-identically.
  // RED: expected '| Reconfigure or fix an agent | Explicitly prohibited …' to
  //      be '| Switch an agent on or off | Explicitly prohibited …'
  it('both are registered against their own source line, whole-row', () => {
    expect(CC08_LINK_OUT_ROWS.length).toBe(2)
    for (const { ordinal, linkOutId } of CC08_LINK_OUT_ROWS) {
      const record = CC_LINK_OUT_CELLS.find((c) => c.id === linkOutId)
      expect(record, linkOutId).toBeDefined()
      if (record === undefined) continue
      const row = cc08Row(ordinal)
      expect(record.moduleId).toBe(CC08_MODULE.id)
      expect(record.line).toBe(Number(row.sourceRef.slice(1)))
      expect(record.rowText).toBe(srcLine(record.line).trim())
      expect(record.capability).toBe(row.capability)
      expect(record.column).toBe('Tenant Admin')
      expect(record.token).toBe('Explicitly prohibited')
      // What a faithful transcription would draw, and what the source asks for.
      expect(record.writeControlWouldDraw).toBe('absent')
      expect(record.sourceRequires).toBe('link')
      // The cell the registry derives header-keyed is this row's own cell.
      expect(cellTextOf(record)).toBe(row.cells['Tenant Admin'].text)
    }
  })

  // FAILS IF: the third qualified prohibition is registered as a link-out. Row
  // 8 carries the same token and the same trailing-note shape and names no
  // destination; `AC-CC-303` requires the absence, so a link there is the
  // opposite defect from an absence on rows 6 and 7.
  // PLANTED: added a `cc-08-raw-traces` entry for L37673 to
  // `link-outs.ts`, then reversed it byte-identically.
  // RED: expected [ 'cc-08-raw-traces' ] to deeply equal []
  it('row 8 is registered nowhere as a link-out, and the source says why', () => {
    expect(CC08_ABSENCE_IS_CORRECT_ROW).toBe(8)
    const line = Number(cc08Row(CC08_ABSENCE_IS_CORRECT_ROW).sourceRef.slice(1))
    expect(CC_LINK_OUT_CELLS.filter((c) => c.line === line).map((c) => c.id)).toEqual([])
    expect(srcLine(37804)).toContain('AC-CC-303')
    expect(srcLine(37804)).toContain(
      'No Command Center endpoint returns orchestrator reasoning internals',
    )
    // The note that separates it from rows 6 and 7 names no place to go.
    const note = cc08Cell(CC08_ABSENCE_IS_CORRECT_ROW, 'Tenant Admin').note ?? ''
    expect(note).toBe('platform-internal')
    expect(note).not.toContain('linked from here')
  })

  // FAILS IF: the two source statements this module's link-outs rest on stop
  // carrying what they are cited for. `AC-CC-301` is the general rule and
  // `FUNC-CC-0801-1-2` the specific one; the brief quoted both and both were
  // opened.
  it('FUNC-CC-0801-1-2 and AC-CC-301 carry the affordance in the positive', () => {
    expect(srcLine(37781)).toContain('`FUNC-CC-0801-1-2`')
    expect(srcLine(37781)).toContain(
      'Link to the Standards and Operations Studio for switching, never switch here',
    )
    expect(srcLine(37781)).toContain('Online: link rendered')
    expect(srcLine(37802)).toContain('`AC-CC-301`')
    expect(srcLine(37802)).toContain(
      'each such control is a link to the Standards and Operations Studio or the platform side',
    )
  })

  // FAILS IF: the panel's claim that a faithful transcription draws no link is
  // asserted rather than checked. `WriteControl` has no link in any branch, so
  // the cost of transcribing faithfully is read off the shared component.
  it('WriteControl draws no anchor on any branch, which is why the link-out exists', () => {
    const wc = readFileSync(join(process.cwd(), 'src/ui/WriteControl.tsx'), 'utf8')
    expect(wc).toContain("decision.outcome === 'explicitlyProhibited'")
    expect(wc).toContain("kind: 'absent'")
    expect(/<a\s|<Link\s/.test(wc)).toBe(false)
  })
})

describe('row 9 — four statements, two readings, and no name join', () => {
  // FAILS IF: the divergence is recorded from this build's own strings rather
  // than from the tables. Every foreign cell is read at test time under its
  // own header by NAME, so a record that renamed its own token consistently
  // could not satisfy this.
  // PLANTED: changed the §25.4 statement in `readings.ts` from `Unavailable`
  // to `Explicitly prohibited`, which would erase the divergence.
  // RED: expected 'Explicitly prohibited' to be 'Unavailable' // Object.is
  it('the Tenant Admin cell reads three ways prohibited and once unavailable', () => {
    const own = cellUnder(OWN_HEADER, 37674, 'Tenant Admin')
    const surface = cellUnder(SURFACE_HEADER, 35014, 'Tenant Admin')
    const cc13 = cellUnder(CC13_HEADER, 38690, 'Tenant Admin')
    const s254 = cellUnder(S254_HEADER, 48452, 'Tenant Admin')
    expect(own).toBe('Explicitly prohibited')
    expect(surface).toBe('Explicitly prohibited')
    expect(cc13).toBe('Explicitly prohibited')
    expect(s254).toBe('Unavailable')

    const d = CC08_DIVERGENCES.find((x) => x.id === 'agent-recheck-tenant-admin')
    expect(d).toBeDefined()
    if (d === undefined) return
    // Four statements, two distinct values — recorded separately, because
    // counting statements reports four statuses for a cell that carries two.
    expect(d.statements.length).toBe(4)
    expect(new Set(d.statements.map((s) => s.text)).size).toBe(2)
    for (const s of d.statements) {
      const header =
        s.line === 37674
          ? OWN_HEADER
          : s.line === 35014
            ? SURFACE_HEADER
            : s.line === 38690
              ? CC13_HEADER
              : S254_HEADER
      expect(cellUnder(header, s.line, 'Tenant Admin'), `L${s.line}`).toBe(s.text)
    }
    expect(d.readings.length).toBe(2)
  })

  // FAILS IF: the capability wordings are assumed to join. This module's row
  // names an object the three action rows do not, so an equality join finds
  // nothing and the difference is three words rather than a typo.
  it('this module’s row 9 is three words longer than the action rows’', () => {
    const own = cells(srcLine(37674))[0]
    expect(own).toBe('Request an agent re-check on a record')
    expect(cells(srcLine(35014))[0]).toBe('Request an agent re-check')
    expect(cellUnder(CC13_HEADER, 38690, 'Action')).toBe('Request an agent re-check')
    expect(cells(srcLine(48452))[0]).toBe('9 Request an agent re-check')
    expect(own).not.toBe(cells(srcLine(35014))[0])
    expect((own ?? '').startsWith(cells(srcLine(35014))[0] ?? '')).toBe(true)
  })

  // FAILS IF: §21.16's table is read as anything but ten rows, or §25.4's as
  // anything but thirteen. Both denominators are walked off their own
  // separators; §25.4's last three rows are not actions.
  it('§21.16 carries ten data rows and §25.4 thirteen, both walked', () => {
    expect(dataRows(CC13_SEPARATOR).length).toBe(10)
    expect(dataRows(S254_SEPARATOR).length).toBe(13)
    expect(cells(srcLine(CC13_HEADER))[0]).toBe('#')
    expect(cells(srcLine(S254_HEADER))[0]).toBe('Action')
  })
})

describe('row 5 — the one Tenant Admin grant, and the door it may not open', () => {
  // FAILS IF: the roll-up divergence is recorded from a paraphrase. All four
  // statements are read off their own lines under their own headers.
  // PLANTED: changed the L35004 statement in `readings.ts` to
  // `Allowed with conditions — requires Tenant or Site read scope`, which
  // would make the two cells agree and erase the conflict.
  // RED: expected 'Allowed with conditions — requires Tenant or Site read
  //      scope' to be 'Allowed with conditions — report and banner routes only'
  it('the module grants what the surface matrix’s route row does not', () => {
    expect(cellUnder(OWN_HEADER, 37670, 'Tenant Admin')).toBe(
      'Allowed with conditions — requires Tenant or Site read scope',
    )
    expect(cells(srcLine(35004))[0]).toBe('Open any Command Center route')
    expect(cellUnder(SURFACE_HEADER, 35004, 'Tenant Admin')).toBe(
      'Allowed with conditions — report and banner routes only',
    )
    // The register admits the Tenant Admin to this screen by name.
    expect(cells(srcLine(48393))[0]).toBe('SCR-CC-08')
    expect(cellUnder(REGISTER_HEADER, 48393, 'Roles that can open it')).toContain('Tenant Admin')
    // And the functionality states the exception in the positive.
    expect(srcLine(37780)).toContain('Roles prohibited: Tenant Admin except the cross-Area roll-up')

    const d = CC08_DIVERGENCES.find((x) => x.id === 'cross-area-roll-up-tenant-admin')
    expect(d).toBeDefined()
    if (d === undefined) return
    for (const s of d.statements) {
      expect(srcLine(s.line), `L${s.line}`).toContain(s.text)
    }
  })

  // FAILS IF: L35006's near-identical cell is treated as the same string. It
  // is one word longer, and a gate keyed on equality between the two would be
  // asserting a sentence the source does not carry.
  it('L35006’s aggregate-board grant is near-identical and not identical', () => {
    const board = cellUnder(SURFACE_HEADER, 35006, 'Tenant Admin')
    const rollUp = cellUnder(OWN_HEADER, 37670, 'Tenant Admin')
    expect(board).toBe('Allowed with conditions — requires a Tenant or Site read scope grant')
    expect(board).not.toBe(rollUp)
  })

  // FAILS IF: the one Tenant Admin grant stops being the only one. Counted
  // over the model's own forty-five cells by column NAME.
  it('exactly one of forty-five cells gives the Tenant Admin more than a prohibition', () => {
    const granted = CC08_MATRIX.filter(
      (r) => r.cells['Tenant Admin'].token !== 'Explicitly prohibited',
    )
    expect(granted.map((r) => r.ordinal)).toEqual([5])
    expect(CC08_MATRIX.length * CC08_COLUMNS.length).toBe(45)
  })
})

describe('AC-CC-090 fails on this module, on two named functionalities', () => {
  // FAILS IF: a functionality's recorded fallback clause drifts from its own
  // line, or the classification stops being derived from the clause. The
  // clause is re-read off the source and the shared helper is asked the
  // criterion's question rather than a boolean written next to the row.
  // PLANTED: gave `FUNC-CC-0804-1-1` `patterns: ['FB-CC-AGENT']` in
  // `readings.ts` — the repair the source declines to make.
  // RED: expected [ 'FUNC-CC-0803-1-2' ] to deeply equal
  //      [ 'FUNC-CC-0803-1-2', 'FUNC-CC-0804-1-1' ]
  it('nine functionalities, seven naming a pattern and two naming none', () => {
    expect(srcLine(35710)).toContain('`AC-CC-090`')
    expect(srcLine(35710)).toContain(
      'Every functionality in this chapter references at least one `FB-CC-*` pattern',
    )
    expect(CC08_FUNCTIONALITIES.length).toBe(9)
    for (const f of CC08_FUNCTIONALITIES) {
      const line = srcLine(f.line)
      expect(line, f.id).toContain(`**\`${f.id}\``)
      expect(line, f.id).toContain(f.fallbackClause)
      // The classification is read off the clause, never off the field.
      const named = [...f.fallbackClause.matchAll(/`(FB-CC-[A-Z]+)`/g)].map((m) => m[1])
      expect([...f.patterns], f.id).toEqual(named)
    }
    expect(ccFunctionalitiesNamingNoPattern(CC08_FUNCTIONALITIES)).toEqual([
      'FUNC-CC-0803-1-2',
      'FUNC-CC-0804-1-1',
    ])
  })

  // FAILS IF: the declared set and the referenced set are collapsed. They
  // differ in both directions, and collapsing them hides FB-CC-WRITE — which
  // no functionality names and which L37772 attaches to a failed re-check.
  it('L37772 declares four identifiers and one of them no functionality names', () => {
    const declared = [...srcLine(37772).matchAll(/`(FB-CC-[A-Z]+)`/g)].map((m) => m[1])
    expect(declared).toEqual([...CC08_DECLARED_FALLBACKS])
    expect(declared.length).toBe(4)
    const referenced: ReadonlySet<string> = new Set(
      CC08_FUNCTIONALITIES.flatMap((f) => [...f.patterns]),
    )
    expect(referenced.has('FB-CC-WRITE')).toBe(false)
    expect(srcLine(37772)).toContain('`FB-CC-WRITE` for a failed re-check request')
  })
})

describe('the two §21.3 elements this module renders', () => {
  // FAILS IF: an element assignment is restated here instead of read. Both
  // rows are shared with another module, and the module list is part of the
  // assignment rather than decoration.
  // PLANTED: changed `Coaching indicators`' `freshnessClass` from
  // `refreshed` to `pushed` in `src/surfaces/cc/live/model.ts` — a task-2
  // file, reversed byte-identically.
  // RED: expected 'pushed' to be 'refreshed' // Object.is equality
  it('agent output is pushed and coaching indicators are refreshed, per the class table', () => {
    for (const [line, element, klass, obligation, other] of [
      [35890, 'Agent output produced', 'Pushed', 'Production time', 'MOD-CC-12'],
      [35895, 'Coaching indicators', 'Refreshed', 'As-of time', 'MOD-CC-01'],
    ] as const) {
      const row = cells(srcLine(line))
      expect(row[0]).toBe(element)
      expect(row[2]).toBe(klass)
      expect(row[3]).toBe(obligation)
      const a = ccElementAssignment(element)
      expect(a.classCell).toBe(row[2])
      expect(a.markerObligation).toBe(row[3])
      expect(a.freshnessClass).toBe(klass.toLowerCase())
      expect(a.perDevice).toBe(false)
      expect([...a.modules].sort()).toEqual([CC08_MODULE.id, other].sort())
      expect(a.sourceRef).toBe(`L${line}`)
    }
  })
})

describe('the storyboard’s status block, and the half of AC-CC-300 it cannot show', () => {
  // FAILS IF: the status block is read as anything but three rows, or the
  // composed-agent gap is quietly filled. `AC-CC-300` wants the three standard
  // agents PLUS every deployed composed agent, and SB-CC-19 carries none.
  // PLANTED: set `storyboardComposedAgents: 1` in `readings.ts`.
  // RED: expected 1 to be 0 // Object.is equality
  it('three agent rows, five status fields, and no composed agent anywhere in it', () => {
    const rows = dataRows(SB_SEPARATOR)
    expect(rows.length).toBe(3)
    expect(rows[0]?.line).toBe(37727)
    expect(cells(srcLine(SB_HEADER))).toEqual([
      'Agent',
      'State',
      'Activations this shift',
      'Last activation',
      'Outputs produced',
      'Waiting at the gate',
    ])
    expect(CC08_COMPOSED_AGENT_GAP.storyboardAgentRows).toBe(rows.length)
    expect(CC08_COMPOSED_AGENT_GAP.storyboardComposedAgents).toBe(0)
    expect(CC08_COMPOSED_AGENT_GAP.simulated).toBe(false)
    expect(srcLine(37801)).toContain('`AC-CC-300`')
    expect(srcLine(37801)).toContain('every deployed composed reasoning agent')
    expect(srcLine(37812)).toContain('`TEST-CC-300`')
    expect(srcLine(37812)).toContain('one composed agent')
    // None of the three rows names a composed agent; all three are standard.
    expect(rows.map((r) => r.cells[0])).toEqual([
      'Prevention Agent',
      'Deviation and Containment Agent',
      'Shift Handoff Agent',
    ])
  })
})

describe('the action rail this screen does not mount', () => {
  // FAILS IF: the rail is mounted here. L38793 enumerates the modules whose
  // screens exercise one or more of the ten and names seven; this one is not
  // among them. The check reads the ROUTE FILE, because that is where a rail
  // would be mounted, and reads the enumeration off the source.
  // PLANTED: added `actionRail={<Cc13ActionRail personName="Sam"
  // scopeFilter="Area" heldColumns={['Supervisor']} mountedOn={CC08_MODULE.id}
  // />}` to the route file, with its import.
  // RED: expected true to be false // Object.is equality
  it('the route mounts no rail, and L38793 does not name this module', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC08_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes('actionRail=')).toBe(false)
    expect(page.includes('Cc13ActionRail')).toBe(false)
    expect(page.includes("from '@/surfaces/cc/actions/ActionRail'")).toBe(false)

    const l38793 = srcLine(38793)
    const named = [...l38793.matchAll(/`(MOD-CC-\d+)` for /g)].map((m) => m[1])
    expect(named.length).toBe(7)
    expect(named).not.toContain(CC08_MODULE.id)
    expect(CC08_ACTION_NINE_DISAGREEMENT.railMounted).toBe(false)
    expect(CC08_ACTION_NINE_DISAGREEMENT.adopted).toBeNull()
  })

  // FAILS IF: the source's own disagreement is dropped. This module's
  // interconnections paragraph claims action 9 and L38793's enumeration gives
  // action 9 to another module and omits this one. Both are read off the
  // source, so neither can be paraphrased into agreement.
  it('the source claims action 9 here and gives it elsewhere, and both are read', () => {
    expect(srcLine(CC08_ACTION_NINE_DISAGREEMENT.ownClaimLine)).toContain(
      CC08_ACTION_NINE_DISAGREEMENT.ownClaimText,
    )
    expect(srcLine(CC08_ACTION_NINE_DISAGREEMENT.ownClaimLine)).toContain(
      '**Interconnections.**',
    )
    const l38793 = srcLine(CC08_ACTION_NINE_DISAGREEMENT.enumerationLine)
    expect(l38793).toContain(
      `\`${CC08_ACTION_NINE_DISAGREEMENT.enumerationGivesActionNineTo}\` for 1, 2, 4, 7 and 9`,
    )
    // The enumeration's own sentence says "every other module" — twelve — and
    // then names seven. Recorded, not repaired.
    expect(l38793).toContain('Every other module on this surface')
  })
})

describe('the module’s own identity, the slug, and the route that carries it', () => {
  // FAILS IF: the slug is typed rather than derived, or the directory is named
  // something else. `CC_NAV` publishes this pathname from the spine and the
  // generator reads a declared slug with no directory as "declared, not built".
  // PLANTED: renamed `app/command-center/agent-activity-panel` to
  // `app/command-center/agent-activity-panel-x`.
  // RED: ENOENT ... statSync 'app/command-center/agent-activity-panel'
  it('the spine declares `agent-activity-panel` and a directory of that name is on disk', () => {
    expect(CC08_MODULE.id).toBe('MOD-CC-08')
    expect(CC08_SLUG).toBe(CC08_MODULE.slug)
    const dir = join(process.cwd(), 'app', 'command-center', CC08_SLUG)
    expect(statSync(dir).isDirectory()).toBe(true)
    expect(statSync(join(dir, 'page.tsx')).isFile()).toBe(true)
  })

  // FAILS IF: the route ships without saying what it is. A module demonstrated
  // by its slug claim alone never names itself, and `SCR-CC-10`'s page shipped
  // that way. The identifier is asserted in the file's TEXT, because that is
  // what `scripts/build-registries.mjs` reads.
  //
  // A BARE `includes` HERE IS A GATE THAT CANNOT FAIL on any file that quotes
  // a list of identifiers, so the gate requires an occurrence on a line that
  // names no OTHER Command Center module.
  // PLANTED: replaced every mention of `MOD-CC-08` in the route file with
  // "this module", leaving the two lines that name MOD-CC-01, MOD-CC-02 and
  // MOD-CC-13.
  // RED: expected 0 to be greater than 0
  it('the route file names MOD-CC-08 on a line about no other module', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC08_SLUG, 'page.tsx'),
      'utf8',
    )
    expect(page.includes(CC08_SCREEN.id)).toBe(true)
    const own = page
      .split('\n')
      .filter((l) => l.includes(CC08_MODULE.id))
      .filter((l) => {
        const others = [...l.matchAll(/MOD-CC-\d+/g)].map((m) => m[0])
        return others.every((o) => o === CC08_MODULE.id)
      })
    expect(own.length).toBeGreaterThan(0)
  })

  // FAILS IF: the spine's identity locator stops carrying the identity line,
  // or the register row stops carrying this screen.
  it('the spine’s sourceRef for this module is its own identity line', () => {
    const identity = Number(CC08_MODULE.sourceRef.slice(1))
    expect(srcLine(identity)).toContain('**Identity.**')
    expect(srcLine(identity)).toContain('`MOD-CC-08`')
    expect(srcLine(identity)).toContain('Name: Agent activity panel')
    const register = Number(CC08_SCREEN.registerRef.slice(1))
    expect(srcLine(register)).toContain('SCR-CC-08')
    expect(srcLine(register)).toContain('MOD-CC-08 all features')
    expect(srcLine(Number(CC08_MODULE.inventoryRef.slice(1)))).toBe(
      '| `MOD-CC-08` | Agent activity panel | §6.9 | Section 21.11 |',
    )
  })
})

describe('reachability, measured from `app/` rather than assumed', () => {
  /** Every file under `app/`, probes excluded. */
  function appFiles(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(dir)) {
      if (isForeignProbe(entry)) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...appFiles(full))
      else out.push(full)
    }
    return out
  }

  /**
   * A module is reachable when some file under `app/` imports it, directly or
   * through a chain this walk follows. BOTH specifier shapes are followed:
   * a `@/`-only walk reads every module that reaches its neighbour through
   * `./matrix` as unreachable, and a reachability gate that under-reports goes
   * green on a broken chain.
   */
  function reachableFromApp(): Set<string> {
    const seen = new Set<string>()
    const queue = appFiles(join(process.cwd(), 'app'))
    while (queue.length > 0) {
      const file = queue.pop()
      if (file === undefined || seen.has(file)) continue
      seen.add(file)
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/from\s+'((?:@\/|\.\.?\/)[^']+)'/g)) {
        const spec = m[1]
        if (spec === undefined) continue
        const base = spec.startsWith('@/')
          ? join(process.cwd(), 'src', spec.slice(2))
          : resolve(dirname(file), spec)
        for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
          if (existsSync(base + ext)) {
            queue.push(base + ext)
            break
          }
        }
      }
    }
    return seen
  }

  const REACHED = reachableFromApp()
  const reached = (rel: string): boolean => REACHED.has(join(process.cwd(), rel))

  // FAILS IF: any of this module's three files is imported by no page. A
  // component that compiles, passes its unit suite and is imported by nothing
  // is not shipped — `cc-10-s366` is the case that taught this build so.
  // PLANTED: removed the `AgentActivityPanel` import and its element from the
  // route file.
  // RED: expected false to be true // Object.is equality
  it('all three of this module’s files are reached from a page', () => {
    expect(reached('src/surfaces/cc/modules/cc-08/AgentActivityPanel.tsx')).toBe(true)
    expect(reached('src/surfaces/cc/modules/cc-08/matrix.ts')).toBe(true)
    // Reached through `./readings` from the panel, which is the case a
    // `@/`-only walk misses entirely.
    expect(reached('src/surfaces/cc/modules/cc-08/readings.ts')).toBe(true)
  })

  // FAILS IF: this screen stops reaching the wave-0 and wave-1 files it
  // consumes rather than restates. Each of these is another task's file and
  // this assertion is what makes the consumption real rather than claimed.
  it('and the five files it consumes rather than restates', () => {
    expect(reached('src/ui/CrossSurfaceLink.tsx')).toBe(true)
    expect(reached('src/surfaces/cc/decisions/link-outs.ts')).toBe(true)
    expect(reached('src/surfaces/cc/fallback/patterns.ts')).toBe(true)
    expect(reached('src/surfaces/cc/fallback/session.ts')).toBe(true)
    expect(reached('src/surfaces/cc/live/model.ts')).toBe(true)
  })

  // FAILS IF: `DeterministicBoundary` stops being reachable from `app/`. The
  // seam `deterministic-boundary-had-no-route` in `./degradation.ts` reports
  // CLOSED — that component's own header no longer says nothing renders it —
  // and a closure written in the past tense is prose. This is the assertion
  // that makes the closure red-able: unmount the boundary and the seam row is
  // wrong and this line says so, which is the direction the original defect
  // (a present-tense absence claim on a mounted component) could not fail in.
  // PLANTED: deleted the `<DeterministicBoundary mode="AIMODE-14" />` element
  // and its import from `AgentActivityPanel.tsx`.
  // RED: expected false to be true // Object.is equality
  it('the boundary this panel mounts is reached, so the closed seam can red', () => {
    expect(reached('src/ui/shared/DeterministicBoundary.tsx')).toBe(true)
  })

  // FAILS IF: `MOD-CC-13`'s control rail becomes reachable FROM THIS ROUTE.
  // It is reachable from the surface, through the six screens L38793 names
  // that are built; this asserts only that this route does not reach it, which
  // is the abstention this task made.
  it('this route reaches no action rail of its own', () => {
    const page = readFileSync(
      join(process.cwd(), 'app', 'command-center', CC08_SLUG, 'page.tsx'),
      'utf8',
    )
    for (const m of page.matchAll(/from\s+'([^']+)'/g)) {
      expect(m[1]).not.toContain('cc-13')
      expect(m[1]).not.toContain('actions/ActionRail')
    }
  })
})

describe('the disciplines this slice pays for', () => {
  const OWN_FILES = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-08'))
    .filter((f) => !isForeignProbe(f))
    .map((f) => join('src/surfaces/cc/modules/cc-08', f))

  // FAILS IF: a closed vocabulary is annotated `readonly T[]` instead of
  // `as const satisfies readonly T[]`. The release gate has caught that
  // eighteen times across two slices.
  // PLANTED: changed `CC08_TOKENS` to
  // `export const CC08_TOKENS: readonly string[] = [...]`.
  // RED: expected [ 'src/surfaces/cc/modules/cc-08/matrix.ts' ] to deeply
  //      equal []
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
  // PLANTED: added `'use client'` to the head of `matrix.ts`.
  // RED: expected [ 'src/surfaces/cc/modules/cc-08/matrix.ts' ] to deeply
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
    for (const f of [...OWN_FILES, join('app/command-center', CC08_SLUG, 'page.tsx')]) {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      if (!/^'use client'/m.test(text)) continue
      for (const m of text.matchAll(/^export const (\w+)/gm)) {
        offenders.push(`${f}: ${m[1] ?? ''}`)
      }
    }
    expect(offenders, 'a client module exports plain data — server reads of it are undefined at prerender').toEqual([])
  })

  // FAILS IF: a comment here spells a line number that does not carry what the
  // comment says it carries. `tests/coverage/locator-fidelity.test.ts` lexes
  // any `L`-number as a citation; this is the same rule applied to the one
  // thing that suite cannot check, which is whether the line is BLANK. The
  // dispatch's card-end line is blank, and its number is spelled nowhere in
  // this module — a knowingly-false citation describing a PLANTED defect is
  // still a knowingly-false citation.
  // PLANTED: added a comment to `matrix.ts` citing the dispatch's card-end
  // line as the matrix header.
  // RED: expected [ 'src/surfaces/cc/modules/cc-08/matrix.ts cites L…, which
  //      is blank' ] to deeply equal []
  it('no L-number cited in this module’s own files is a blank line', () => {
    const offenders: string[] = []
    for (const f of [...OWN_FILES, join('app/command-center', CC08_SLUG, 'page.tsx')]) {
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
