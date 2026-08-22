import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { CC_FALLBACK_PATTERN_IDS, ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import { cc13ActionsOnModule } from '@/surfaces/cc/modules/cc-13/rail'
import {
  CC05_COLUMNS,
  CC05_MATRIX,
  CC05_MODULE,
  CC05_POLICY_AUTHORED_ELSEWHERE,
  CC05_ROWS_NOBODY_HOLDS,
  CC05_SCREEN,
  CC05_SLUG,
  CC05_TOKENS,
  CC05_TOKEN_OUTCOME,
  cc05Cell,
  cc05ClassifyCell,
  cc05Row,
} from '@/surfaces/cc/modules/cc-05/matrix'
import {
  CC05_AC_CC_090,
  CC05_DECISION_CONTROLS,
  CC05_FALLBACKS_NO_FUNCTIONALITY_NAMES,
  CC05_FUNCTIONALITIES,
  CC05_FUNCTIONALITIES_NAMING_NO_PATTERN,
  CC05_MODULE_FALLBACK_IDS,
  CC05_NOT_DECIDABLE_ITEM,
  CC05_SCOPE_TRIPLE,
  CC05_STORYBOARD_ITEM,
  CC05_TIMEOUT_MINUTES,
  cc05Decidability,
  cc05MissingElementFor,
  cc05TimeoutMinutes,
  cc05WaitingText,
} from '@/surfaces/cc/modules/cc-05/queue'
import {
  CC05_DIVERGENCES,
  CC05_FOREIGN_FALLBACK_NAMES,
  CC05_INVENTORY_ROW,
  CC05_TENANT_ADMIN_DECISION,
} from '@/surfaces/cc/modules/cc-05/readings'

/**
 * `MOD-CC-05` — §21.8, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * Nothing below compares a string this task wrote against another string this
 * task wrote, and **no count is taken from the array under test**: "eight
 * rows" and "twelve functionalities" are obtained by walking the source,
 * never from `CC05_MATRIX.length`, never from `CC05_FUNCTIONALITIES.length`
 * and never by subtracting the ends of a span written in a dispatch.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — the
 * defect planted into the real shipping file, the red observed, then reversed
 * and verified byte-identical against a baseline captured BEFORE the first
 * plant. Each `PLANTED` note names the defect that was actually planted. Where
 * two guards cover the same defect, the removal of EACH and of BOTH was
 * planted, because redundant protections cannot be verified one at a time.
 *
 * FIVE BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE ARE LIVE HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and this matrix
 *    contains NO conditional cell — which is exactly what makes a prefix
 *    classifier look safe. The live case is `MTX-TEN-02c`'s L22062, which
 *    gives this module's Quality Manager `Allowed with conditions`; a
 *    `startsWith` head test reads it as `Allowed` and the third divergence
 *    disappears. Every comparison below is an anchored equality.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR. Every walk
 *    starts AFTER the separator and excludes it by position, not by content.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Three columns of this matrix
 *    read a bare `Explicitly prohibited` on all eight rows, so a count of
 *    "thirty prohibitions" is true however those three columns are permuted.
 *    Every cell gate names its ROW and its COLUMN, read off the source header.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Every column index is
 *    resolved from its header line BY NAME at test time, in this table and in
 *    the four foreign ones.
 *  - A DEPENDENCY OR REACHABILITY CHECK THAT UNDER-REPORTS. The reachability
 *    walk below matches every `from '…'` specifier in the file after comments
 *    are stripped, rather than the `^import … from` shape that cannot see a
 *    multi-line import — three of this module's four import statements are
 *    multi-line, so the narrow regex would have missed them and gone green on
 *    a broken chain.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking; chapter 17 uses them and §21.8 does not. */
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
const OWN_HEADER = 37076
const OWN_SEPARATOR = 37077
const OWN_FIRST_ROW = 37078

/** The four foreign tables that answer the same question, each header-keyed. */
const SURFACE_HEADER = 35002
const SURFACE_SEPARATOR = 35003
const CC13_HEADER = 38680
const CC13_SEPARATOR = 38681
const S254_HEADER = 48442
const S254_SEPARATOR = 48443
/** Chapter 17's `MTX-TEN-02c` — MODULE-keyed, with a leading `#` column. */
const MTX_HEADER = 22056
const MTX_SEPARATOR = 22057
/** §21.1's module inventory — four columns, one of them `Not a user`. */
const INVENTORY_HEADER = 35241
const INVENTORY_SEPARATOR = 35242

const OWN_FILES = readdirSync(join(process.cwd(), 'src/surfaces/cc/modules/cc-05'))
  .filter((f) => !isForeignProbe(f))
  .map((f) => join('src/surfaces/cc/modules/cc-05', f))

const ROUTE_FILE = join('app/command-center', CC05_SLUG, 'page.tsx')

describe('the matrix is eight rows, counted off the source', () => {
  // FAILS IF: the transcription gains or loses a row. The count comes from
  // walking the SOURCE from its separator, so it cannot be satisfied by the
  // model's own length, and the separator is excluded by position.
  // PLANTED: deleted row 6 (`Add the optional note`) from `CC05_MATRIX`.
  // RED: expected 7 to be 8 // Object.is equality
  it('walks eight data rows from L37077 and the model carries the same eight', () => {
    const rows = dataRows(OWN_SEPARATOR)
    expect(rows.length).toBe(8)
    expect(CC05_MATRIX.length).toBe(rows.length)
    expect(rows[0]?.line).toBe(OWN_FIRST_ROW)
    expect(rows[rows.length - 1]?.line).toBe(37085)
  })

  // FAILS IF: the body is read as running past its end, which is how a span
  // becomes a count. The line after the last data row is blank and the one
  // after that carries the DEC-PLUS-001 sentence at L37087, so the walk above
  // stops for a reason the source states rather than one a dispatch asserted.
  it('stops where the source stops, one line short of the DEC-PLUS-001 sentence', () => {
    expect(srcLine(OWN_SEPARATOR + 9)).toBe('')
    expect(isTableRow(srcLine(OWN_SEPARATOR + 9))).toBe(false)
    expect(srcLine(37087)).toContain('DEC-PLUS-001')
    expect(srcLine(37087)).toContain('Quality Manager entries are enumerated grants')
  })

  // FAILS IF: the dispatch's card span is copied into this build as though it
  // were read. The line that dispatch gave as the card's end is BLANK and sits
  // ABOVE the matrix, so it cannot end a card whose matrix begins at L37076
  // and whose closing rule is at L37249. The wrong line number is not spelled
  // here: `tests/coverage/locator-fidelity.test.ts` refuses a citation of a
  // blank line even inside a sentence that correctly calls it blank, so the
  // gate reaches it by arithmetic on the header instead.
  // PLANTED: changed the header comment in matrix.ts to claim §21.8 runs to
  // the line the dispatch gave. Caught by the blank-line gate at the foot of
  // this file rather than here, which is why both exist.
  it('the card runs past the blank line the dispatch gave as its end', () => {
    expect(srcLine(37027)).toContain('21.8 Module')
    expect(srcLine(37027)).toContain('MOD-CC-05')
    // Three lines above the matrix header is the blank line the dispatch gave.
    expect(srcLine(OWN_HEADER - 3)).toBe('')
    expect(srcLine(37074)).toBe('**Roles that see and use it, and their permissions.**')
    expect(srcLine(37249)).toBe('---')
    expect(srcLine(37251).startsWith('## 21.9')).toBe(true)
  })
})

describe('the columns are the header line’s own, in the header line’s own order', () => {
  // FAILS IF: the transcription is read positionally against the Frontline
  // habit, which opens on Worker. The expected list is READ FROM L37076 at
  // test time, so it cannot be satisfied by a constant this task also wrote.
  // PLANTED: swapped `'Tenant Admin'` and `'Worker'` in `CC05_COLUMNS`.
  // RED: expected [ 'Worker', 'Supervisor', …(3) ] to deeply equal
  //      [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('reads Tenant Admin first and Worker last, off L37076', () => {
    const header = cells(srcLine(OWN_HEADER))
    expect(header[0]).toBe('Capability on this module')
    expect([...CC05_COLUMNS]).toEqual(header.slice(1))
    expect(header[1]).toBe('Tenant Admin')
    expect(header[header.length - 1]).toBe('Worker')
  })

  // FAILS IF: a column is dropped from the outcome map, which would let a
  // persona's cells go untranscribed.
  it('every source column has a model column and no model column is invented', () => {
    const header = cells(srcLine(OWN_HEADER)).slice(1)
    for (const name of header) expect(CC05_COLUMNS).toContain(name)
    for (const name of CC05_COLUMNS) expect(header).toContain(name)
  })

  // FAILS IF: the column swap this matrix is dangerous for stops being
  // detectable. Seven of the eight rows carry an identical bare `Explicitly
  // prohibited` in both the Tenant Admin and the Worker column, so the swap is
  // silent on seven rows; rows 1, 7 and 8 are where it shows. That asymmetry
  // is asserted off the source so the danger cannot quietly disappear.
  it('the Tenant Admin and Worker cells differ on exactly three of the eight rows', () => {
    const ta = columnIndex(OWN_HEADER, 'Tenant Admin')
    const wk = columnIndex(OWN_HEADER, 'Worker')
    const differing = dataRows(OWN_SEPARATOR)
      .filter((r) => r.cells[ta] !== r.cells[wk])
      .map((r) => r.line)
    expect(differing).toEqual([37078, 37084, 37085])
  })
})

describe('every one of the forty cells is verbatim, header-keyed', () => {
  // FAILS IF: any cell text drifts from the source, in any row, in any column.
  // Row and column are both resolved by NAME, so a permutation of the three
  // all-prohibited columns cannot pass by arithmetic.
  // PLANTED: changed row 1's Supervisor cell in `CC05_MATRIX` from
  // `Read-only — visibility without decision authority` to `Explicitly
  // prohibited` — the cell whose reading is the whole see-versus-decide
  // divergence.
  // RED: L37078 · Supervisor: expected 'Explicitly prohibited' to be
  //      'Read-only — visibility without decision authority'
  it('matches L37078-L37085 cell for cell', () => {
    const rows = dataRows(OWN_SEPARATOR)
    for (const row of CC05_MATRIX) {
      const src = rows.find((r) => r.line === Number(row.sourceRef.slice(1)))
      expect(src, `no source row at ${row.sourceRef}`).toBeDefined()
      expect(src?.cells[0]).toBe(row.capability)
      for (const column of CC05_COLUMNS) {
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
    for (const row of CC05_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      expect(isTableRow(srcLine(line))).toBe(true)
      expect(cells(srcLine(line))[0]).toBe(row.capability)
    }
  })

  // FAILS IF: the two rows nobody holds stop being prohibited in all five
  // columns, or a third row joins them. Counted off the source rather than off
  // `CC05_ROWS_NOBODY_HOLDS`, so the constant cannot satisfy itself.
  // PLANTED: added row 3 to `CC05_ROWS_NOBODY_HOLDS`.
  // RED: expected [ 7, 8, 3 ] to deeply equal [ 7, 8 ]
  it('rows 7 and 8 are the only rows prohibited in all five columns', () => {
    const indices = CC05_COLUMNS.map((c) => columnIndex(OWN_HEADER, c))
    const allProhibited = dataRows(OWN_SEPARATOR)
      .filter((r) => indices.every((i) => (r.cells[i] ?? '').split(' — ')[0] === 'Explicitly prohibited'))
      .map((r) => r.line - OWN_FIRST_ROW + 1)
    expect(allProhibited).toEqual([...CC05_ROWS_NOBODY_HOLDS])
  })
})

describe('`Allowed` is a prefix of `Allowed with conditions`, and the live case is foreign', () => {
  // FAILS IF: a cell's token is classified by prefix rather than by exact
  // equality on the head. NO cell in this matrix is `Allowed with conditions`,
  // which is what makes a prefix classifier look safe here; the live case is
  // `MTX-TEN-02c`'s Quality Manager cell, read off the source at test time.
  // PLANTED: changed `cell()` in matrix.ts from
  // `CC05_TOKENS.find((t) => t === head)` to
  // `CC05_TOKENS.find((t) => head.startsWith(t))`.
  // RED: expected 'Allowed with conditions' to be 'Allowed' — the foreign cell
  //      classified as a bare grant, which erases the third divergence.
  it('the foreign conditional cell is not a bare Allowed, and this matrix has none', () => {
    const qm = cells(srcLine(22062))[columnIndex(MTX_HEADER, 'Quality Manager')] ?? ''
    // The `[K9]` key is stripped with the backticks; the token keeps its words.
    expect(qm.startsWith('Allowed')).toBe(true)
    expect(qm.split(' [')[0]).toBe('Allowed with conditions')
    expect(qm.split(' [')[0]).not.toBe('Allowed')
    expect(CC05_TOKENS).not.toContain('Allowed with conditions')
    for (const row of CC05_MATRIX) {
      for (const column of CC05_COLUMNS) {
        expect(row.cells[column].token, `${row.sourceRef} · ${column}`).not.toBe(
          'Allowed with conditions',
        )
      }
    }
  })

  // FAILS IF: the classifier accepts a head it should refuse. THE PLANT THAT
  // FOUND THIS GATE MISSING: changing `t === head` to `head.startsWith(t)`
  // STAYED GREEN across the whole suite, because no cell in this matrix is
  // `Allowed with conditions` — the defect is latent here and live for the
  // next row anyone adds. The classifier is now handed the foreign cell
  // MTX-TEN-02c carries and must REFUSE it.
  // PLANTED: `CC05_TOKENS.find((t) => (head ?? '').startsWith(t))` in matrix.ts.
  // RED: expected [Function] to throw an error
  it('the classifier refuses a head this matrix does not use', () => {
    const foreign = 'Allowed with conditions — at review time, with a recorded reason'
    expect(() => cc05ClassifyCell(foreign)).toThrow(/not one of the tokens/)
    // And it still classifies this matrix's own shapes exactly.
    expect(cc05ClassifyCell('Read-only — visibility without decision authority').token).toBe(
      'Read-only',
    )
    expect(cc05ClassifyCell('Allowed').token).toBe('Allowed')
    expect(cc05ClassifyCell('Allowed').note).toBeNull()
  })

  // FAILS IF: a token is not the exact head of its own cell. Asserted over
  // every cell rather than the interesting ones, because a classifier that is
  // right about row 1 by luck is wrong about the next matrix.
  it('every token is exactly the cell’s own head, split on its own em dash', () => {
    for (const row of CC05_MATRIX) {
      for (const column of CC05_COLUMNS) {
        const c = row.cells[column]
        expect(c.text.split(' — ')[0], `${row.sourceRef} · ${column}`).toBe(c.token)
        expect(CC05_TOKENS).toContain(c.token)
        expect(CC05_TOKEN_OUTCOME[c.token]).toBeDefined()
      }
    }
  })

  // FAILS IF: `Explicitly prohibited` stops being distinguishable from
  // `Explicitly prohibited — …`, and `Read-only` from `Read-only — …`. Both
  // prefix collisions are live on row 1 alone.
  it('row 1 carries both prefix shapes on two different columns', () => {
    expect(cc05Cell(1, 'Tenant Admin').token).toBe('Explicitly prohibited')
    expect(cc05Cell(1, 'Tenant Admin').note).toBe('not an in-shift actor')
    expect(cc05Cell(1, 'Supervisor').token).toBe('Read-only')
    expect(cc05Cell(1, 'Supervisor').note).toBe('visibility without decision authority')
    expect(cc05Cell(1, 'Worker').token).toBe('Explicitly prohibited')
    expect(cc05Cell(1, 'Worker').note).toBeNull()
  })
})

describe('five tables answer the same question, and each is read out of its own header', () => {
  // FAILS IF: any of the five statements is not what the record says it is.
  // Each is read out of ITS OWN table, header-keyed on ITS OWN header —
  // §21.16's and MTX-TEN-02c's both have a leading `#` column and §25.4's and
  // §21.1.2's do not, so a positional read of any of them lands a column out.
  // PLANTED: changed the MTX-TEN-02c statement's text in `readings.ts` from
  // `Read-only` to `Explicitly prohibited` — the reading that would erase the
  // Tenant Admin divergence entirely.
  // RED: expected 'Read-only' to be 'Explicitly prohibited' // Object.is equality
  it('reads the Tenant Admin’s answer out of all five tables at test time', () => {
    const own = cells(srcLine(37078))
    expect(own[0]).toBe('See the gate queue')
    expect(own[columnIndex(OWN_HEADER, 'Tenant Admin')]).toBe(
      'Explicitly prohibited — not an in-shift actor',
    )

    const surface = cells(srcLine(35008))
    expect(surface[0]).toBe('Gate-item decision')
    expect(surface[columnIndex(SURFACE_HEADER, 'Tenant Admin')]).toBe('Explicitly prohibited')

    const cc13 = cells(srcLine(38683))
    expect(cc13[columnIndex(CC13_HEADER, 'Action')]).toBe('Gate-item decision')
    expect(cc13[columnIndex(CC13_HEADER, 'Tenant Admin')]).toBe('Explicitly prohibited')

    const s254 = cells(srcLine(48445))
    expect(s254[columnIndex(S254_HEADER, 'Action')]).toBe('2 Decide a gate item')
    expect(s254[columnIndex(S254_HEADER, 'Tenant Admin')]).toBe('Unavailable')

    const mtx = cells(srcLine(22062))
    // MTX-TEN-02c's HEADER LIES ABOUT ITS FIRST TWO COLUMNS. L22056 reads
    // `# | Module | …`, and the body puts the module IDENTIFIER under `#` and
    // the module NAME under `Module` — the same inversion the command-class
    // table carries, in a different chapter. Both are asserted so the row is
    // pinned to this module by identifier and by name rather than by position.
    expect(mtx[columnIndex(MTX_HEADER, '#')]).toBe('MOD-CC-05')
    expect(mtx[columnIndex(MTX_HEADER, 'Module')]).toBe('Governance gate queue')
    expect((mtx[columnIndex(MTX_HEADER, 'Tenant Admin')] ?? '').split(' [')[0]).toBe('Read-only')

    const d = CC05_DIVERGENCES.find((x) => x.id === 'tenant-admin-on-this-module')
    expect(d?.statements.map((s) => s.line)).toEqual([37078, 35008, 38683, 22062, 48445])
  })

  // FAILS IF: either foreign table is read as a different shape than it is.
  // The surface matrix is capability-keyed with twenty data rows and no `#`
  // column; MTX-TEN-02c is module-keyed with thirteen and a leading `#`. Both
  // counts are walked from their own separators, so neither can be inferred
  // from a span.
  it('the surface matrix is twenty rows and MTX-TEN-02c is thirteen', () => {
    const surface = dataRows(SURFACE_SEPARATOR)
    expect(surface.length).toBe(20)
    expect(surface[0]?.line).toBe(35004)
    expect(cells(srcLine(SURFACE_HEADER))[0]).toBe('Capability')

    const mtx = dataRows(MTX_SEPARATOR)
    expect(mtx.length).toBe(13)
    expect(mtx[0]?.line).toBe(22058)
    expect(cells(srcLine(MTX_HEADER))[0]).toBe('#')
    expect(srcLine(22054)).toContain('MTX-TEN-02c')
    expect(srcLine(22054)).toContain('the thirteen Client Command Center modules')
  })

  // FAILS IF: five STATEMENTS are recorded as five READINGS, or the readings
  // collapse to one. The distinct-token count is derived from the source, not
  // written down twice: three tables say `Explicitly prohibited`, one says
  // `Read-only`, one says `Unavailable` — five statements, three tokens, and
  // TWO renderings, which is what the pair of readings carries.
  // PLANTED: added a third reading to the record.
  // RED: type error — `readings` is a fixed-length pair, so a third does not
  //      compile. Planted again as a change of the §25.4 statement's token to
  //      `Explicitly prohibited`, which does compile.
  // RED: expected 2 to be 3 // Object.is equality
  it('five statements, three distinct tokens, two renderings', () => {
    const observed = [
      (cells(srcLine(37078))[columnIndex(OWN_HEADER, 'Tenant Admin')] ?? '').split(' — ')[0],
      cells(srcLine(35008))[columnIndex(SURFACE_HEADER, 'Tenant Admin')],
      cells(srcLine(38683))[columnIndex(CC13_HEADER, 'Tenant Admin')],
      (cells(srcLine(22062))[columnIndex(MTX_HEADER, 'Tenant Admin')] ?? '').split(' [')[0],
      cells(srcLine(48445))[columnIndex(S254_HEADER, 'Tenant Admin')],
    ]
    expect(observed.length).toBe(5)
    expect(new Set(observed).size).toBe(3)
    const d = CC05_DIVERGENCES.find((x) => x.id === 'tenant-admin-on-this-module')
    expect(d?.statements.length).toBe(observed.length)
    // Compared on the HEAD of each statement, exactly as `observed` is, so a
    // statement that carries its cell's note is not counted as a fourth token.
    expect(new Set(d?.statements.map((s) => s.text.split(' — ')[0])).size).toBe(3)
    expect(d?.readings.length).toBe(2)
  })

  // FAILS IF: the two tokens stop rendering oppositely, which is the whole
  // reason the divergence matters. Read off `WriteControl` itself rather than
  // asserted in prose.
  it('the two readings render oppositely under the build’s one rendering rule', () => {
    const wc = readFileSync(join(process.cwd(), 'src/ui/WriteControl.tsx'), 'utf8')
    expect(wc).toContain("decision.outcome === 'explicitlyProhibited'")
    expect(wc).toContain("kind: 'absent'")
    expect(CC05_TOKEN_OUTCOME['Explicitly prohibited']).toBe('explicitlyProhibited')
    expect(CC05_TOKEN_OUTCOME['Read-only']).toBe('readOnly')
  })

  // FAILS IF: the see-versus-decide split stops being a decomposition shape.
  // §21.8 answers in six rows what the other four answer in one, and the two
  // halves of its own answer are read off the source rather than described.
  // PLANTED: changed row 3's Supervisor cell in `CC05_MATRIX` from
  // `Explicitly prohibited` to `Read-only` — which would make §21.8 agree with
  // §25.4 on the decided half and dissolve the question.
  // RED: L37080 · Supervisor: expected 'Read-only' to be 'Explicitly prohibited'
  it('§21.8 splits the Supervisor’s answer across six rows; four tables give one', () => {
    const sup = columnIndex(OWN_HEADER, 'Supervisor')
    expect((cells(srcLine(37078))[sup] ?? '').split(' — ')[0]).toBe('Read-only')
    expect(cells(srcLine(37079))[sup]).toBe('Read-only')
    for (const line of [37080, 37081, 37082, 37083]) {
      expect(cells(srcLine(line))[sup], `L${line}`).toBe('Explicitly prohibited')
    }
    // The four single-row answers, two each way.
    expect(cells(srcLine(35008))[columnIndex(SURFACE_HEADER, 'Supervisor')]).toBe(
      'Explicitly prohibited',
    )
    expect(cells(srcLine(38683))[columnIndex(CC13_HEADER, 'Supervisor')]).toBe(
      'Explicitly prohibited',
    )
    expect(cells(srcLine(48445))[columnIndex(S254_HEADER, 'Supervisor')]).toBe('Read-only')
    expect((cells(srcLine(22062))[columnIndex(MTX_HEADER, 'Supervisor')] ?? '').split(' [')[0]).toBe(
      'Read-only',
    )
    const d = CC05_DIVERGENCES.find((x) => x.id === 'supervisor-see-versus-decide')
    expect(d?.decisionRef).toBeNull()
  })

  // FAILS IF: a divergence acquires an adopted reading. There is no adopted
  // arm on this type at all, so the check is on the rendered words: no record
  // may carry a word that marks one side as the answer.
  it('no divergence marks a winner', () => {
    for (const d of CC05_DIVERGENCES) {
      const text = [
        d.question,
        ...d.readings.map((r) => r.text),
        d.renderedConsequence,
      ]
        .join(' ')
        .toLowerCase()
      for (const word of ['adopted here', 'preferred', 'we choose', 'the correct reading']) {
        expect(text, `${d.id} marks a winner with "${word}"`).not.toContain(word)
      }
      expect(d.readings.length).toBe(2)
    }
  })
})

describe('DEC-TACC-001 is pointed at, not respelled, and it is not adopted', () => {
  // FAILS IF: the decision's own card stops carrying what this record says it
  // carries, or the record starts claiming an adoption. L23069 recommends and
  // names the client's product owner as the decision owner; a recommendation
  // is not an adoption and `adopted` is `null`.
  // PLANTED: set `adopted` to the recommendation's text in `readings.ts`.
  // RED: expected 'Report builder plus read-only monitoring, because a Tenant…'
  //      to be null
  it('L23069 raises it, recommends, and adopts nothing', () => {
    const card = srcLine(Number(CC05_TENANT_ADMIN_DECISION.cardRef.slice(1)))
    expect(card).toContain('DEC-TACC-001')
    expect(card).toContain("the Tenant Admin's Client Command Center presence")
    expect(card).toContain('Recommendation: report builder plus read-only monitoring')
    expect(card).toContain('MTX-TEN-02c')
    expect(card.toLowerCase()).not.toContain('adopted position')
    expect(CC05_TENANT_ADMIN_DECISION.adopted).toBeNull()
    expect(CC05_TENANT_ADMIN_DECISION.classification).toBe('Client Decision Required')
  })

  // FAILS IF: the condition key that puts it on this module's cell stops
  // saying so. `[K1]` is the Tenant Admin's key on every Command Center row of
  // MTX-TEN-02c, and its text names the decision.
  it('condition [K1] at L22072 names the decision and states the interim position', () => {
    const conditions = srcLine(Number(CC05_TENANT_ADMIN_DECISION.conditionRef.slice(1)))
    expect(conditions).toContain('`[K1]` `DEC-TACC-001`')
    expect(conditions).toContain(
      'Until decided, read-only monitoring access is served and no operational action is granted.',
    )
    expect(cells(srcLine(22062))[columnIndex(MTX_HEADER, 'Tenant Admin')]).toContain('[K1]')
  })

  // FAILS IF: the identifier is lifted into the canon and this module keeps a
  // second spelling of it. The `Stu14LocalDisclosure` idiom: assert ABSENCE
  // from the canon so a later lift turns this suite red and forces the switch.
  // PLANTED: changed `decisionRef` on `CC05_TENANT_ADMIN_DECISION` to an
  // identifier the canon DOES hold — the Lane B one. `src/disclosure/
  // decisions.ts` is not this task's file and nine siblings are running
  // against it, so the plant is made on the record that points at the canon
  // rather than on the canon; the assertion is identical and the blast radius
  // is this module. The identifier is not spelled here either: a release scan
  // that cannot tell code from prose reads a quoted declaration exactly as a
  // declaration, and one explanatory comment has already turned a sibling
  // suite red that way.
  // RED: expected [ <that identifier> ] to deeply equal []
  it('the canon carries no DEC-TACC-001 record', () => {
    expect(
      (OPEN_DECISION_IDS as readonly string[]).filter(
        (id) => id === CC05_TENANT_ADMIN_DECISION.decisionRef,
      ),
    ).toEqual([])
  })
})

describe('the module inventory row, counted rather than claimed', () => {
  // FAILS IF: the "only row that names the Tenant Admin" claim stops being
  // true, in either direction. Walked off the source; the constant supplies
  // only the line to look at.
  // PLANTED: changed `notAUser` in `readings.ts` to the Worker wording every
  // other row uses.
  // RED: expected 'Read-only Auditor — no access; Worker — no access' to be
  //      'Read-only Auditor — no access; Tenant Admin — not an in-shift actor'
  it('L35247 is the one row of thirteen whose “Not a user” names the Tenant Admin', () => {
    const rows = dataRows(INVENTORY_SEPARATOR)
    expect(rows.length).toBe(13)
    const col = columnIndex(INVENTORY_HEADER, 'Not a user')
    const namingTenantAdmin = rows
      .filter((r) => (r.cells[col] ?? '').includes('Tenant Admin'))
      .map((r) => r.line)
    expect(namingTenantAdmin).toEqual([35247])
    const namingWorker = rows.filter((r) => (r.cells[col] ?? '').includes('Worker')).map((r) => r.line)
    expect(namingWorker).toHaveLength(12)
    expect(namingWorker).not.toContain(35247)

    const row = cells(srcLine(Number(CC05_INVENTORY_ROW.sourceRef.slice(1))))
    expect(row[0]).toBe('MOD-CC-05 Governance gate queue')
    expect(row[col]).toBe(CC05_INVENTORY_ROW.notAUser)
    expect(row[columnIndex(INVENTORY_HEADER, 'Principal user')]).toBe(
      CC05_INVENTORY_ROW.principalUser,
    )
    expect(row[columnIndex(INVENTORY_HEADER, 'Secondary user')]).toBe(
      CC05_INVENTORY_ROW.secondaryUser,
    )
  })
})

describe('FB-CC-QUEUE, and the clock that must not stop', () => {
  // FAILS IF: the pattern row drifts, or this module stops reading it from
  // task 3's registry. The row is read out of the source and compared against
  // the registry entry, so a local copy could not pass and neither could a
  // registry row that drifted.
  it('L35702 is the row and task 3’s registry carries it verbatim', () => {
    const row = cells(srcLine(35702))
    expect(row[0]).toBe('FB-CC-QUEUE')
    const p = ccFallbackPatternById('FB-CC-QUEUE')
    expect(p.triggeringCondition).toBe(row[1])
    expect(p.decisionControls).toBe(row[2])
    expect(p.clientSideQueueing).toBe(row[3])
    expect(p.terminalSafeState).toBe(row[4])
    expect(p.decisionControls).toBe('Disabled for that item only')
    expect(p.terminalSafeState).toBe('Item not decidable, ages visibly, never expires')
  })

  // FAILS IF: the threefold obligation is read as twofold. The whole sentence
  // is asserted, not the status token alone — the clause about the clock is
  // the third of the three and the one an implementation drops.
  it('L37115 states all three obligations in one sentence', () => {
    const alt = srcLine(37115)
    expect(alt).toContain('FB-CC-QUEUE')
    expect(alt).toContain('the item renders not decidable')
    expect(alt).toContain('names the missing element')
    expect(alt).toContain('disables its decision controls')
    expect(alt).toContain('keeps its waiting clock running')
  })

  // FAILS IF: the waiting clock can see decidability. It is given a number of
  // seconds and nothing else, so there is no item, no flag and no defaulted
  // parameter for one to arrive through — and a defaulted parameter would not
  // even count toward `Function.length`, which is why the arity is asserted
  // rather than the signature being trusted.
  // PLANTED: changed `cc05WaitingText(waitingSeconds: number)` to
  // `cc05WaitingText(waitingSeconds: number, decidable = true)` and returned
  // `'—'` when `decidable` was false.
  // RED: expected 1 to be 1 stayed GREEN on arity, because a defaulted
  //      parameter does not count. Planted again without the default:
  // RED: expected 2 to be 1 // Object.is equality
  it('the clock takes seconds and nothing else', () => {
    expect(cc05WaitingText.length).toBe(1)
    expect(cc05WaitingText(192)).toBe('3 minutes 12 seconds')
    expect(cc05WaitingText(61)).toBe('1 minute 1 second')
    expect(cc05WaitingText(0)).toBe('0 minutes 0 seconds')
    expect(srcLine(37147)).toContain('waiting 3 minutes 12 seconds')
  })

  // FAILS IF: the two illustrative items stop being the same item minus its
  // scope, which is what makes the rendered comparison mean anything. A pair
  // that differed in arrival time would let a stopped clock pass as a
  // different arrival.
  // PLANTED: changed `CC05_NOT_DECIDABLE_ITEM.waitingSeconds` to 0 in queue.ts.
  // RED: expected 0 to be 192 // Object.is equality
  it('the two illustrative items differ only in the scope of impact', () => {
    expect(CC05_NOT_DECIDABLE_ITEM.waitingSeconds).toBe(CC05_STORYBOARD_ITEM.waitingSeconds)
    expect(CC05_NOT_DECIDABLE_ITEM.createdAt).toBe(CC05_STORYBOARD_ITEM.createdAt)
    expect(CC05_NOT_DECIDABLE_ITEM.severityOne).toBe(CC05_STORYBOARD_ITEM.severityOne)
    expect(CC05_NOT_DECIDABLE_ITEM.evidence).toEqual(CC05_STORYBOARD_ITEM.evidence)
    expect(CC05_STORYBOARD_ITEM.scopeOfImpact).not.toBeNull()
    expect(CC05_NOT_DECIDABLE_ITEM.scopeOfImpact).toBeNull()
    expect(cc05WaitingText(CC05_NOT_DECIDABLE_ITEM.waitingSeconds)).toBe(
      cc05WaitingText(CC05_STORYBOARD_ITEM.waitingSeconds),
    )
  })

  // FAILS IF: an unresolvable element is defaulted into decidability. L35670's
  // distinctive invariant is that such an item "is never made decidable by
  // defaulting the missing element", and the sentence is read whole.
  // PLANTED: changed `cc05Decidability` to return `{ decidable: true }` when
  // `scopeOfImpact` was null but `evidence` was present.
  // RED: expected undefined to be 'the scope of impact' // Object.is equality
  it('an unresolved element names itself and is never defaulted', () => {
    expect(cc05Decidability(CC05_STORYBOARD_ITEM).decidable).toBe(true)
    expect(cc05MissingElementFor(CC05_STORYBOARD_ITEM)).toBeUndefined()
    expect(cc05Decidability(CC05_NOT_DECIDABLE_ITEM).decidable).toBe(false)
    expect(cc05MissingElementFor(CC05_NOT_DECIDABLE_ITEM)).toBe('the scope of impact')
    expect(cc05MissingElementFor({ ...CC05_STORYBOARD_ITEM, evidence: null })).toBe('the evidence')
    expect(srcLine(35670)).toContain(
      'an item with incomplete context is never made decidable by defaulting the missing element',
    )
    expect(srcLine(37056)).toContain('rather than decidable with the scope omitted')
  })

  // FAILS IF: the marker obligation is copied instead of read. §21.3's
  // assignment table gives this module a PUSHED row whose obligation is the
  // waiting time from arrival; a refreshed reading would put an interval on a
  // clock the source says runs continuously.
  it('L35886 assigns Gate item arrival to MOD-CC-05, Pushed, waiting time from arrival', () => {
    const row = cells(srcLine(35886))
    expect(row[0]).toBe('Gate item arrival')
    expect(row[1]).toBe('MOD-CC-05')
    const a = ccElementAssignment('Gate item arrival')
    expect(a.classCell).toBe(row[2])
    expect(a.markerObligation).toBe(row[3])
    expect(a.classCell).toBe('Pushed')
    expect(a.freshnessClass).toBe('pushed')
    expect(a.markerObligation).toBe('Waiting time from arrival')
    expect(a.modules).toContain(CC05_MODULE.id)
  })

  // FAILS IF: the two prohibitions that are the module's safety core stop
  // being asserted against their own criteria.
  it('AC-CC-246 and AC-CC-247 are the two prohibitions, at their own lines', () => {
    expect(srcLine(37227)).toContain('AC-CC-246')
    expect(srcLine(37227)).toContain('No gate item executes on timeout under any condition.')
    expect(srcLine(37228)).toContain('AC-CC-247')
    expect(srcLine(37228)).toContain('undecided items age visibly and remain in the queue')
  })

  // FAILS IF: the timeout defaults drift. Two independent statements carry
  // them — §21.8's own L37068 and chapter 17's `[K9]` at L22072 — and both are
  // read, because a single-source number is a number nobody checked.
  it('10 minutes at Severity 1 and 30 otherwise, stated twice in the source', () => {
    expect(srcLine(37068)).toContain(
      'a 10-minute window at Severity 1, 30 minutes otherwise, configurable per severity level',
    )
    expect(srcLine(22072)).toContain(
      'gate-item timeout defaults are 10 minutes for Severity 1 and 30 minutes for others',
    )
    expect(CC05_TIMEOUT_MINUTES.severityOne).toBe(10)
    expect(CC05_TIMEOUT_MINUTES.otherwise).toBe(30)
    expect(cc05TimeoutMinutes(true)).toBe(10)
    expect(cc05TimeoutMinutes(false)).toBe(30)
  })
})

describe('AC-CC-090 against this module’s own twelve functionalities', () => {
  // FAILS IF: the functionality list gains, loses or renames a row. Counted by
  // scanning the source's own feature block for `FUNC-CC-05` identifiers,
  // never from `CC05_FUNCTIONALITIES.length`.
  // PLANTED: deleted `FUNC-CC-0503-1-2` from `CC05_FUNCTIONALITIES` — one of
  // the five that name no pattern, so the deletion also moves the finding.
  // RED: expected 11 to be 12 // Object.is equality
  it('the source declares twelve, walked from the feature block', () => {
    const declared: string[] = []
    for (let n = 37194; n <= 37215; n += 1) {
      const m = /\*\*`(FUNC-CC-05\d\d-\d-\d)`/.exec(srcLine(n))
      if (m?.[1] !== undefined) declared.push(m[1])
    }
    expect(declared.length).toBe(12)
    expect(CC05_FUNCTIONALITIES.map((f) => f.id)).toEqual(declared)
    for (const f of CC05_FUNCTIONALITIES) {
      expect(srcLine(Number(f.sourceRef.slice(1))), f.id).toContain(f.id)
    }
  })

  // FAILS IF: a pattern is invented for a functionality whose `Fallback:`
  // clause names none. Each functionality's patterns are re-derived from its
  // own source line at test time, so a record that filled one in could not
  // pass — the allowance does not take its allowed value from the value under
  // test.
  // PLANTED: gave `FUNC-CC-0503-1-2` `patterns: ['FB-CC-QUEUE']` in queue.ts,
  // which is the repair that would manufacture AC-CC-090 compliance.
  // RED: expected [ 'FB-CC-QUEUE' ] to deeply equal []
  it('each row’s patterns are exactly what its own Fallback clause names', () => {
    for (const f of CC05_FUNCTIONALITIES) {
      const line = srcLine(Number(f.sourceRef.slice(1)))
      const clause = /Fallback: ([^.]*)\./.exec(line)?.[1] ?? ''
      const named = CC_FALLBACK_PATTERN_IDS.filter((id) => clause.includes(id))
      expect([...f.patterns], `${f.id} — "${clause}"`).toEqual(named)
    }
  })

  // FAILS IF: the shortfall is repaired rather than disclosed, or the count is
  // written down. Five is derived by task 3's shared helper from the list
  // above, and the five identifiers are named so a count of five that moved to
  // the wrong five could not pass.
  // PLANTED: flipped `CC05_AC_CC_090.met` to `true`.
  // RED: expected true to be false // Object.is equality
  it('five of the twelve name no FB-CC pattern, and the criterion is not met', () => {
    expect(srcLine(35710)).toContain('AC-CC-090')
    expect(srcLine(35710)).toContain(
      'Every functionality in this chapter references at least one `FB-CC-*` pattern.',
    )
    expect([...CC05_FUNCTIONALITIES_NAMING_NO_PATTERN]).toEqual([
      'FUNC-CC-0502-2-2',
      'FUNC-CC-0503-1-1',
      'FUNC-CC-0503-1-2',
      'FUNC-CC-0503-1-3',
      'FUNC-CC-0504-1-1',
    ])
    expect(CC05_AC_CC_090.met).toBe(false)
  })

  // FAILS IF: the module's five declared fallback identifiers drift from
  // L37188, or the two nobody's functionality names stop being computed.
  it('L37188 declares five and two of them reach no functionality', () => {
    const declared = srcLine(37188)
    expect(declared).toContain('**Fallback identifiers.**')
    for (const id of CC05_MODULE_FALLBACK_IDS) expect(declared, id).toContain(id)
    const inSource = CC_FALLBACK_PATTERN_IDS.filter((id) => declared.includes(id))
    expect([...CC05_MODULE_FALLBACK_IDS].sort()).toEqual([...inSource].sort())
    expect([...CC05_FALLBACKS_NO_FUNCTIONALITY_NAMES].sort()).toEqual([
      'FB-CC-AGENT',
      'FB-CC-CMD',
    ])
  })

  // FAILS IF: the foreign fallback names are folded into the nine-pattern
  // registry, or stop being outside it.
  it('FB-APPROVE-01 and FB-NOTIF-01 are named for this module and are not FB-CC patterns', () => {
    for (const ref of CC05_FOREIGN_FALLBACK_NAMES.sourceRefs) {
      const line = srcLine(Number(ref.slice(1)))
      expect(line, ref).toContain('MOD-CC-05')
      expect(line, ref).toContain(CC05_FOREIGN_FALLBACK_NAMES.offlineClaim)
    }
    for (const name of CC05_FOREIGN_FALLBACK_NAMES.names) {
      expect(CC_FALLBACK_PATTERN_IDS as readonly string[]).not.toContain(name)
    }
    expect(srcLine(47534)).toContain('FB-APPROVE-01')
    expect(srcLine(47536)).toContain('FB-NOTIF-01')
  })
})

describe('the scope of impact, and the quantity the storyboard adds', () => {
  // FAILS IF: the prose triple or the storyboard's four-part header drifts.
  // Both are read whole; the divergence is the point and neither is repaired.
  it('three statements name three quantities and the card leads with a fourth', () => {
    for (const line of [37054, 37091, 37103]) {
      expect(srcLine(line), `L${line}`).toContain('pieces, runs and jobs')
    }
    expect(srcLine(37145)).toContain('Scope of impact: 2 stations · 23 pieces · 1 run · 1 job')
    expect([...CC05_SCOPE_TRIPLE]).toEqual(['pieces', 'runs', 'jobs'])
    expect(CC05_SCOPE_TRIPLE as readonly string[]).not.toContain('stations')
  })

  // FAILS IF: the card stops leading with the scope. `AC-CC-240` is the
  // criterion and L37054 is the reasoning it comes from; both are read.
  it('AC-CC-240 requires the scope to be the leading element', () => {
    expect(srcLine(37221)).toContain('AC-CC-240')
    expect(srcLine(37221)).toContain('renders the scope of impact as its leading element')
    expect(srcLine(37054)).toContain('The card leads with the scope of impact')
  })

  // FAILS IF: the three decision controls drift from the storyboard's own row.
  it('the three controls are SB-CC-16’s own, verbatim from L37153', () => {
    const row = srcLine(37153)
    for (const label of CC05_DECISION_CONTROLS) expect(row, label).toContain(`"${label}"`)
    expect(CC05_DECISION_CONTROLS.length).toBe(3)
    expect(row).toContain('three controls of equal visual weight')
    expect(srcLine(37224)).toContain('AC-CC-243')
  })
})

describe('the closed set of ten, and the rail this screen mounts', () => {
  // FAILS IF: this screen stops mounting `MOD-CC-13`'s rail. `MOD-CC-13` owns
  // no route and no path under `app/`, so a rail waiting for its own module to
  // mount it is mounted nowhere. L38793 assigns it to the seven screens that
  // exercise the ten, and this module is one of them.
  // PLANTED: removed the `actionRail={…}` prop from the route file.
  // RED: expected false to be true // Object.is equality
  it('the route mounts Cc13ActionRail and L38793 names this module for action 2', () => {
    const page = readFileSync(join(process.cwd(), ROUTE_FILE), 'utf8')
    expect(page.includes('Cc13ActionRail')).toBe(true)
    expect(page.includes('actionRail=')).toBe(true)
    // The CARD treatment is a different component and is not what mounts here.
    expect(page.includes("from '@/surfaces/cc/actions/ActionRail'")).toBe(false)

    const l38793 = srcLine(38793)
    expect(l38793).toContain('`MOD-CC-05` for 2')
    // ANCHORED AT BOTH ENDS: an unanchored pattern invents members of the
    // family it is counting.
    const named = [...l38793.matchAll(/`(MOD-CC-\d+)` for /g)].map((m) => m[1])
    expect(named.length).toBe(7)
    expect(named).toContain('MOD-CC-05')
    expect([...cc13ActionsOnModule('MOD-CC-05')]).toEqual([2])
    // L37171 states the same interconnection independently of L38793.
    expect(srcLine(37171)).toContain('exercises action 2 of `MOD-CC-13`')
  })

  // FAILS IF: §21.16's row 2 stops being the gate-item decision, which is what
  // makes action 2 this module's.
  it('§21.16 row 2 is the gate-item decision and the set is ten rows', () => {
    const rows = dataRows(CC13_SEPARATOR)
    expect(rows.length).toBe(10)
    expect(rows[1]?.line).toBe(38683)
    expect(cells(srcLine(38683))[columnIndex(CC13_HEADER, '#')]).toBe('2')
    expect(cells(srcLine(38683))[columnIndex(CC13_HEADER, 'Action')]).toBe('Gate-item decision')
  })

  // FAILS IF: §25.4's table stops carrying thirteen rows, which is the count
  // that makes its heading's "ten operational actions" false of its own body.
  it('§25.4 is headed for ten and carries thirteen data rows', () => {
    expect(srcLine(48440)).toContain('across the ten operational actions')
    expect(dataRows(S254_SEPARATOR).length).toBe(13)
  })
})

describe('the screen, the slug, and the landing nobody may claim alone', () => {
  // FAILS IF: the slug is typed rather than derived, or the directory is named
  // something else. `CC_NAV` publishes this pathname from the spine and the
  // generator reads a declared slug with no directory as "declared, not built".
  // PLANTED: replaced `CC05_SLUG`'s derivation in matrix.ts with the literal
  // `'governance-gate-queue-x'` — a second spelling of the slug that has
  // drifted from the directory, which is exactly what "declared, not built"
  // means when it goes wrong.
  // RED: expected 'governance-gate-queue-x' to be 'governance-gate-queue'
  it('the spine declares `governance-gate-queue` and a directory of that name is on disk', () => {
    expect(CC05_MODULE.id).toBe('MOD-CC-05')
    expect(CC05_SLUG).toBe(CC05_MODULE.slug)
    const dir = join(process.cwd(), 'app', 'command-center', CC05_SLUG)
    expect(statSync(dir).isDirectory()).toBe(true)
    expect(statSync(join(dir, 'page.tsx')).isFile()).toBe(true)
  })

  // FAILS IF: the route ships without saying what it is. A module demonstrated
  // by its slug claim alone never names itself, and `SCR-CC-10`'s page shipped
  // that way.
  //
  // A BARE `includes` HERE IS A GATE THAT CANNOT FAIL, and this file is the
  // proof: its header quotes L38793, which names SEVEN module ids including
  // this one, so deleting every sentence in which the page names its OWN
  // module would leave the quotation behind and a bare check green. The gate
  // therefore requires an occurrence on a line naming no OTHER Command Center
  // module.
  // PLANTED: replaced the page's own three mentions of `MOD-CC-05` with "this
  // module", leaving only the L38793 quotation.
  // RED: expected 0 to be greater than 0
  it('the route file names MOD-CC-05 on a line about no other module', () => {
    const page = readFileSync(join(process.cwd(), ROUTE_FILE), 'utf8')
    expect(page.includes(CC05_SCREEN.id)).toBe(true)
    const own = page
      .split('\n')
      .filter((l) => l.includes(CC05_MODULE.id))
      .filter((l) => {
        const others = [...l.matchAll(/MOD-CC-\d+/g)].map((m) => m[0])
        return others.every((o) => o === CC05_MODULE.id)
      })
    expect(own.length).toBeGreaterThan(0)
  })

  // FAILS IF: the spine's identity and register locators stop carrying what
  // they say they carry.
  it('the spine’s sourceRef is this module’s identity line and the register row is L48391', () => {
    const identity = srcLine(Number(CC05_MODULE.sourceRef.slice(1)))
    expect(identity).toContain('**Identity.**')
    expect(identity).toContain('`MOD-CC-05`')
    const register = srcLine(Number(CC05_SCREEN.registerRef.slice(1)))
    expect(register).toContain('SCR-CC-06')
    expect(register).toContain('MOD-CC-05 all features')
    expect(register).toContain('Landing for the Quality Manager')
    expect(srcLine(Number(CC05_MODULE.inventoryRef.slice(1)))).toContain('Section 21.8')
  })

  // FAILS IF: this screen is recorded as THE Quality Manager's landing. The
  // register grants the claim twice — L48391 "Landing for the Quality Manager"
  // and L48392 "Quality Manager landing" — and the precedence table resolves
  // the Quality Manager to "Decision queues", PLURAL, which L35059 names as
  // three. The dispatch cited L35075 for the singular claim; L35075 does not
  // carry it, and this gate reads the line rather than the citation.
  // PLANTED: added "the only landing view for the Quality Manager" to the
  // route file's header.
  // RED: expected 'the only landing' to be absent from the route file
  it('two register rows claim the Quality Manager landing and L35075 names it in the plural', () => {
    expect(srcLine(48391)).toContain('Landing for the Quality Manager')
    expect(srcLine(48392)).toContain('SCR-CC-07')
    expect(srcLine(48392)).toContain('Quality Manager landing')
    const precedence = cells(srcLine(35075))
    expect(precedence[0]).toBe('Quality Manager, with or without Supervisor')
    expect(precedence[1]).toBe('Decision queues')
    expect(precedence[1]).not.toContain('SCR-CC-06')
    expect(srcLine(35059)).toContain(
      'the Quality Manager on the decision queues — gate items, learned-change proposals, deviations awaiting disposition',
    )
    // The landing is a routing default, never a permission.
    expect(srcLine(35061)).toContain('the landing view is a **routing default, not a permission**')
    const page = readFileSync(join(process.cwd(), ROUTE_FILE), 'utf8')
    expect(page.toLowerCase()).not.toContain('the only landing')
  })

  // FAILS IF: row 7's destination is turned into a cross-surface link this
  // build cannot resolve, or the four-surface division stops naming the
  // Studio as the policy author.
  it('row 7’s act is authored in the Studio and is registered as no link-out cell', () => {
    expect(cc05Row(CC05_POLICY_AUTHORED_ELSEWHERE.row).capability).toBe(
      'Change gate policy, approvers or timeouts',
    )
    const division = cells(srcLine(Number(CC05_POLICY_AUTHORED_ELSEWHERE.divisionRef.slice(1))))
    expect(division[0]).toBe('Standards and Operations Studio')
    expect(division[1]).toBe(CC05_POLICY_AUTHORED_ELSEWHERE.divisionText)
    expect(srcLine(37052)).toContain(
      'the Command Center holds no gate configuration and no gate history of its own',
    )
  })
})

describe('this module’s files are reachable from app/', () => {
  /**
   * A REACHABILITY WALK THAT DOES NOT UNDER-REPORT.
   *
   * `tests/unit/cc-live-model.test.ts` uses `^\s*(?:import|export)[^'"\n]*from
   * \s+['"]…` for its dependency gate, and that shape CANNOT see a multi-line
   * import — three of this module's four import statements are multi-line, and
   * the narrow regex would have found none of them and gone green on a broken
   * chain. Comments are stripped first and then every `from '…'` specifier is
   * matched, which over-reports rather than under-reports; that is the right
   * failure direction for a reachability check.
   */
  const stripComments = (s: string): string =>
    s.replaceAll(/\/\*[\s\S]*?\*\//g, ' ').replaceAll(/(^|[^:])\/\/[^\n]*/g, '$1 ')

  function resolve(spec: string, fromFile: string): string | null {
    const base = spec.startsWith('@/')
      ? join('src', spec.slice(2))
      : spec.startsWith('.')
        ? join(fromFile, '..', spec)
        : null
    if (base === null) return null
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      join(base, 'index.ts'),
      join(base, 'index.tsx'),
    ]) {
      try {
        if (statSync(join(process.cwd(), candidate)).isFile()) return candidate
      } catch {
        /* not this candidate */
      }
    }
    return null
  }

  // FAILS IF: any file under `src/surfaces/cc/modules/cc-05/` is imported by
  // nothing that a page reaches. A component that compiles, passes its suite
  // and is imported by nothing is not shipped — `cc-10-s366` is the standing
  // example, and it was slice 8's most valuable disclosure.
  // PLANTED: removed the `<GovernanceGateQueue />` element and its import from
  // the route file.
  // RED: expected [ 'src/surfaces/cc/modules/cc-05/GovernanceGateQueue.tsx',
  //      …(3) ] to deeply equal []
  it('every file this module owns is reached from the route', () => {
    const seen = new Set<string>()
    const queue = [ROUTE_FILE]
    while (queue.length > 0) {
      const file = queue.pop() as string
      if (seen.has(file)) continue
      seen.add(file)
      const text = stripComments(readFileSync(join(process.cwd(), file), 'utf8'))
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const next = resolve(m[1] as string, file)
        if (next !== null) queue.push(next)
      }
    }
    const unreached = OWN_FILES.filter((f) => !seen.has(f))
    expect(unreached).toEqual([])
    expect(OWN_FILES.length).toBeGreaterThan(0)
    // The rail is reached too — it is the thing that had no mount at all.
    expect(seen.has(join('src/surfaces/cc/modules/cc-13', 'Cc13ActionRail.tsx'))).toBe(true)
  })

  // FAILS IF: the walk above is satisfied by a regex that cannot see this
  // module's own imports. The gate that could not fail, made non-vacuous: the
  // narrow shape is run over the same file and must find FEWER specifiers, so
  // "the wide regex was necessary" is proved rather than asserted.
  it('the narrow single-line regex under-reports on this module’s own files', () => {
    const text = readFileSync(
      join(process.cwd(), 'src/surfaces/cc/modules/cc-05/GovernanceGateQueue.tsx'),
      'utf8',
    )
    const narrow = [...text.matchAll(/^\s*(?:import|export)[^'"\n]*from\s+['"]([^'"]+)['"]/gm)]
    const wide = [...stripComments(text).matchAll(/from\s+['"]([^'"]+)['"]/g)]
    expect(narrow.length).toBeLessThan(wide.length)
  })
})

describe('the disciplines this slice pays for', () => {
  // FAILS IF: a closed vocabulary is annotated `readonly T[]` instead of
  // `as const satisfies readonly T[]`. The release gate has caught that
  // eighteen times across two slices.
  // PLANTED: changed `CC05_TOKENS` to
  // `export const CC05_TOKENS: readonly string[] = [...]`.
  // RED: expected [ 'src/surfaces/cc/modules/cc-05/matrix.ts' ] to deeply
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
  // PLANTED: added `'use client'` to the head of `queue.ts`.
  // RED: expected [ 'src/surfaces/cc/modules/cc-05/queue.ts' ] to deeply
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
    for (const f of [...OWN_FILES, ROUTE_FILE]) {
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
  // thing that suite cannot check, which is whether the line is BLANK.
  // PLANTED: added a comment to `matrix.ts` citing, as the matrix header, the
  // blank line the commissioning dispatch gave as the card's end. The number
  // is not written here: a knowingly-false citation describing a PLANTED
  // defect is still a knowingly-false citation.
  // RED: expected [ 'src/surfaces/cc/modules/cc-05/matrix.ts cites L…, which
  //      is blank' ] to deeply equal []
  it('no L-number cited in this module’s own files is a blank line', () => {
    const offenders: string[] = []
    for (const f of [...OWN_FILES, ROUTE_FILE]) {
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

  // FAILS IF: this module grows its own anchor. `MOD-CC-02` shipped a local
  // `ManualCloseLink` over a raw `<a href>` for exactly this shape, and row 7's
  // destination is the cell most likely to tempt one.
  // PLANTED: added `<a href="/studio">Open the Studio</a>` to
  // `GovernanceGateQueue.tsx`.
  // RED: expected [ 'GovernanceGateQueue.tsx' ] to deeply equal []
  it('no file under cc-05 draws its own anchor or imports next/link', () => {
    const dir = join(process.cwd(), 'src/surfaces/cc/modules/cc-05')
    const offenders = readdirSync(dir)
      .filter((f) => !isForeignProbe(f))
      .filter((f) => {
        const text = readFileSync(join(dir, f), 'utf8')
        return /<a\s/.test(text) || text.includes("from 'next/link'")
      })
    expect(offenders).toEqual([])
  })
})
