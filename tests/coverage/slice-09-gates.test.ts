import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join, resolve, relative, dirname } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { stripComments } from './strip-comments'

import { CC_MODULE_SPINE, CC_CLAIMED_SLUGS, type CcModuleId } from '@/surfaces/cc/modules'
import { CC_SCREENS } from '@/surfaces/cc/screens'
import { CC13_ACTIONS, CC13_COLUMNS } from '@/surfaces/cc/actions/action-set'
import {
  CC13_ROW_READINGS,
  CC13_TABLES,
  CC13_DIVERGENCE_MEASURE,
} from '@/surfaces/cc/modules/cc-13/readings'
import { CC13_EXERCISED_ON, CC13_EXERCISING_MODULES } from '@/surfaces/cc/modules/cc-13/rail'
import {
  CC_FALLBACK_PATTERNS,
  CC_FALLBACK_PATTERN_IDS,
  queuesClientSide,
} from '@/surfaces/cc/fallback/patterns'
import { CC_SOURCE_OF_TRUTH } from '@/surfaces/cc/seams/source-of-truth'
import { CC_RUN_STATE_PERMISSIONS } from '@/surfaces/cc/live/model'
import {
  CC11_DATA_SETS,
  CC11_DATA_SET_COUNT,
  CC11_CONFIRMED_IDENTITIES,
} from '@/surfaces/cc/modules/cc-11/report-sets'
import { HUB_COMMAND_TYPES } from '@/domain/commands'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'

import { CC01_COLUMN_ORDER, CC01_ROLE_COLUMNS, CC01_MATRIX } from '@/surfaces/cc/modules/cc-01/matrix'
import { CC02_COLUMN_ORDER, CC02_ROLE_COLUMNS, CC02_MATRIX } from '@/surfaces/cc/modules/cc-02/matrix'
import { CC03_COLUMNS, CC03_MATRIX } from '@/surfaces/cc/modules/cc-03/matrix'
import { CC04_COLUMNS, CC04_MATRIX } from '@/surfaces/cc/modules/cc-04/matrix'
import { CC05_COLUMNS, CC05_MATRIX } from '@/surfaces/cc/modules/cc-05/matrix'
import { CC06_COLUMNS, CC06_MATRIX } from '@/surfaces/cc/modules/cc-06/matrix'
import { CC07_COLUMNS, CC07_MATRIX } from '@/surfaces/cc/modules/cc-07/matrix'
import { CC08_COLUMNS, CC08_MATRIX } from '@/surfaces/cc/modules/cc-08/matrix'
import { CC09_COLUMNS, CC09_MATRIX } from '@/surfaces/cc/modules/cc-09/matrix'
import { CC10_COLUMNS, CC10_MATRIX } from '@/surfaces/cc/modules/cc-10/matrix'
import { CC11_COLUMNS, CC11_MATRIX } from '@/surfaces/cc/modules/cc-11/matrix'
import { CC12_COLUMNS, CC12_MATRIX } from '@/surfaces/cc/modules/cc-12/matrix'

/* ==================================================================== *
 * SLICE 9 GATES — the Client Command Center, `SURF-CC`.
 *
 * Twenty build tasks land before this file. What it holds is what no single
 * module owns: the permission rows the whole surface transcribes, the
 * readings the source refuses to reconcile, and the four defect classes this
 * slice found that no module suite can see from inside one module.
 *
 * EVERY NUMBER HERE IS PARSED OUT OF THE FROZEN SOURCE AT RUN TIME, or
 * computed from a shipped constant. Not one is restated from a comment and
 * not one is inferred from a span. `tableBody` walks until the rows stop and
 * asserts the line after the body is not a table row, because a span
 * notation says where a table is and not how many rows it has.
 *
 * THE FOUR DEFECT CLASSES GATED HERE THAT A MODULE SUITE CANNOT SEE:
 *
 *   1. A SERVER COMPONENT HANDING A FUNCTION ACROSS THE CLIENT BOUNDARY.
 *      Six of seven Command Center panels shipped it. Every one was green on
 *      its own unit and component suites, because a component suite mounts
 *      the component and the boundary only exists in a build. Gate 10 is the
 *      shape without a build: no `'use client'`, renders a `WriteControl`,
 *      constructs an `allow(...)`.
 *   2. A `'use client'` FILE EXPORTING A PLAIN DATA OBJECT. Gate 11. Note
 *      what it does NOT do: five tasks independently forbade `'use client'`
 *      outright and all five went red on a correct build fix. A gate that
 *      forbids a mechanism rather than a misuse of it will eventually forbid
 *      the fix.
 *   3. A FILE IMPORTED BY NOTHING. Gate 12. The best disclosure slice 8
 *      produced rendered on no page for a whole slice.
 *   4. A COUNT STATED IN PROSE THAT THE CONSTANT BESIDE IT OUTGREW. Gate 13,
 *      and nothing in this build checked this shape before it. Five shipping
 *      files said twelve Hub commands where the vocabulary has fifteen; the
 *      prose was right when it was written at slice 6.
 *
 * THE VACUITY CATALOGUE THIS FILE WAS WRITTEN AGAINST, all found by planting
 * rather than by review:
 *
 *   - `Allowed` being a PREFIX of `Allowed with conditions`;
 *   - a `toEqual([...MY_CONSTANT])` tautology, and its cousin, a gate whose
 *     EXPECTED VALUE IS PRODUCED BY THE CODE UNDER TEST;
 *   - a table-shape check satisfied by the SEPARATOR row;
 *   - a substring check on a table ROW passing for a check on a CELL,
 *     because the same token sits in two other columns of that line;
 *   - a locator check satisfied by a line being merely NON-BLANK;
 *   - header-keying protecting the transcription and NOT the column order,
 *     so a positional gate runs beside every header-keyed one here;
 *   - a wrapped quotation: a file quoting a list of identifiers contains
 *     every identifier in that list, and line boundaries are not semantic
 *     boundaries;
 *   - a classifier whose data contains none of the shapes it discriminates;
 *   - a reachability check that under-reports, going green on a broken chain;
 *   - a gate whose failure message asserts more than its predicate tests;
 *   - REDUNDANT PROTECTIONS THAT EACH HIDE THE OTHER. Gate 5 has two and the
 *     campaign plants each and both.
 *
 * THREE RECORDED FINDINGS, CARRIED RATHER THAN REPAIRED. Gates 5, 12 and 13
 * each pin one file this slice found defective and does not own. Each pin is
 * asserted in BOTH directions — the population of exceptions is exactly the
 * named one — so the gate goes red when a second appears AND when the named
 * one is fixed. See each gate's own note.
 * ==================================================================== */

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const SOURCE_BYTES = readFileSync(SOURCE)
const SOURCE_LINES = SOURCE_BYTES.toString('utf8').split('\n')

/** One WHOLE line of the frozen source, 1-indexed, or a throw. Never a slice. */
function line(n: number): string {
  const text = SOURCE_LINES[n - 1]
  if (text === undefined) throw new Error(`the frozen source has no line ${n}`)
  return text
}

/**
 * Split a markdown table row into its fields, preserving empties. A row that
 * is only dashes is refused: a separator splits into the right number of
 * non-empty fields and has satisfied a table-shape gate before.
 */
function cellsOf(n: number): readonly string[] {
  const raw = line(n)
  if (!raw.startsWith('|') || !raw.trimEnd().endsWith('|')) {
    throw new Error(`L${n} is not a markdown table row: ${JSON.stringify(raw.slice(0, 60))}`)
  }
  const fields = raw
    .trimEnd()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((f) => f.trim())
  if (fields.every((f) => /^:?-{2,}:?$/.test(f))) {
    throw new Error(`L${n} is a separator row, not a data row`)
  }
  return fields
}

/** The data lines of the table headed at `headerLine`, COUNTED, never inferred. */
function tableBody(headerLine: number): readonly number[] {
  const separator = line(headerLine + 1)
  expect(
    /^\|(\s*:?-{3,}:?\s*\|)+$/.test(separator.trimEnd()),
    `L${headerLine + 1} is not the separator under the header at L${headerLine}`,
  ).toBe(true)
  const rows: number[] = []
  let n = headerLine + 2
  while (n <= SOURCE_LINE_COUNT && line(n).startsWith('|')) {
    rows.push(n)
    n += 1
  }
  expect(rows.length, `no data rows under the header at L${headerLine}`).toBeGreaterThan(0)
  expect(
    line(rows[rows.length - 1]! + 1).startsWith('|'),
    `the body under L${headerLine} does not stop where this walk says it does`,
  ).toBe(false)
  return rows
}

/** The index of a named column in a header line. Throws rather than returning -1. */
function columnIndex(headerLine: number, word: string): number {
  const i = cellsOf(headerLine).indexOf(word)
  if (i < 0) throw new Error(`L${headerLine} has no column named ${JSON.stringify(word)}`)
  return i
}

/** Curly quotation marks folded to ASCII. A typographic difference, not a claim. */
const flat = (s: string): string => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

/** `L36264` as written in a `sourceRef` field, as a number. */
const refLine = (ref: string): number => {
  const m = /^L(\d{3,6})$/.exec(ref)
  if (m === null) throw new Error(`not a bare line reference: ${JSON.stringify(ref)}`)
  return Number(m[1])
}

/**
 * DERIVE A LOCATOR RATHER THAN CHECKING IT IS NON-BLANK. A locator gate that
 * only asked whether the cited line was blank stayed green when a citation
 * was moved to a different non-blank line. This searches the whole source for
 * a phrase, requires the phrase to occur EXACTLY ONCE, and returns the line
 * it found — so the claim is "this line is the one carrying these words".
 */
function uniqueLineCarrying(phrase: string): number {
  const found: number[] = []
  for (let n = 1; n <= SOURCE_LINE_COUNT; n += 1) if (line(n).includes(phrase)) found.push(n)
  expect(found.length, `phrase is not unique in the frozen source: ${JSON.stringify(phrase)}`).toBe(1)
  return found[0]!
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const CODE = /\.(?:ts|tsx)$/
const sourcesUnder = (rel: string): readonly string[] =>
  walk(join(ROOT, rel))
    .filter((f) => CODE.test(f))
    .map((f) => relative(ROOT, f))
    .sort()

const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8')

/* ==================================================================== *
 * THE FROZEN SOURCE THESE GATES READ, AND THE WALKER THAT READS IT.
 * ==================================================================== */

describe('slice 9 gates: the frozen source these gates read', () => {
  it('is the sha256 and the line count this slice was built against', () => {
    expect(existsSync(SOURCE), `the frozen source is not at ${SOURCE}`).toBe(true)
    expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
    // The file ends in a newline, so the split's last member is the empty
    // tail rather than a line.
    expect(SOURCE_LINES[SOURCE_LINES.length - 1]).toBe('')
    expect(SOURCE_LINES.length - 1).toBe(SOURCE_LINE_COUNT)
  })

  it('the row walker stops where the body stops, and refuses a separator as data', () => {
    // Both halves exercised on this run rather than trusted: the surface
    // matrix's body, and the separator refusal a slice-7 gate was beaten by.
    expect(tableBody(35_002).length).toBe(20)
    expect(() => cellsOf(35_003)).toThrow(/separator row/)
    expect(() => tableBody(35_003)).toThrow()
  })

  it('a locator is derived by searching for a unique phrase, not by being non-blank', () => {
    // The instrument itself, exercised: a phrase that occurs once resolves,
    // and one that occurs many times is refused rather than silently taking
    // the first hit.
    expect(uniqueLineCarrying('The surface exposes exactly thirteen modules')).toBe(35_261)
    expect(() => uniqueLineCarrying('Explicitly prohibited')).toThrow(/not unique/)
  })
})

/* ==================================================================== *
 * GATE 1 — THE 179 PERMISSION ROWS ACROSS 18 MATRICES.
 *
 * Eighteen tables in the frozen source state who may do what on this
 * surface. Every count below is COUNTED off the source at run time; the
 * dispatch's own arithmetic (102 + 10 + 20 + 3 + 13 + 5 + 26) is re-derived
 * rather than asserted, and the total is computed from the parts.
 *
 * HEADER-KEYED, NEVER POSITIONALLY — AND A POSITIONAL GATE BESIDE IT.
 * Slice 8's two `MOD-CC-10` matrices run their columns in opposite orders
 * and a positional read inverts every Worker and Tenant Admin cell while
 * staying internally coherent. So every cell here is fetched by its column
 * WORD. But header-keying protects the transcription and does NOT protect
 * the order: reversing a body's columns leaves every value under its own key
 * and a name-keyed gate green. The order is therefore asserted separately,
 * positionally, against the header line.
 * ==================================================================== */

const MODULE_MATRIX_HEADERS = {
  'MOD-CC-01': 36_262,
  'MOD-CC-02': 36_450,
  'MOD-CC-03': 36_652,
  'MOD-CC-04': 36_832,
  'MOD-CC-05': 37_076,
  'MOD-CC-06': 37_292,
  'MOD-CC-07': 37_503,
  'MOD-CC-08': 37_664,
  'MOD-CC-09': 37_860,
  'MOD-CC-10': 38_082,
  'MOD-CC-11': 38_287,
  'MOD-CC-12': 38_481,
} as const satisfies Readonly<Record<string, number>>

/** The other six of the eighteen, and what each is keyed on. */
const OTHER_MATRIX_HEADERS = {
  'the surface matrix, §21.1.2': 35_002,
  'MOD-CC-13 action matrix, §21.16': 38_680,
  'the run-state table, §21.3': 36_190,
  '§25.4 action matrix': 48_442,
  '§26.3 surface interaction map': 49_250,
  '§26.7 cross-surface matrix': 49_574,
} as const satisfies Readonly<Record<string, number>>

interface TranscribedMatrix {
  readonly id: string
  readonly headerLine: number
  /** The persona columns as the TREE declares them, in the tree's order. */
  readonly declaredColumns: readonly string[]
  readonly rows: readonly {
    readonly sourceRef: string
    readonly rowLabel: string
    readonly cell: (column: string) => string
  }[]
}

/** cc-01 and cc-02: cells keyed by `RoleId`, columns declared as an ordered pair of lists. */
const roleKeyed = (
  id: string,
  headerLine: number,
  columnOrder: readonly string[],
  roleColumns: readonly string[],
  matrix: readonly {
    readonly capability: string
    readonly sourceRef: string
    readonly cells: Readonly<Record<string, { readonly verbatim: string }>>
  }[],
): TranscribedMatrix => ({
  id,
  headerLine,
  declaredColumns: columnOrder.slice(1),
  rows: matrix.map((r) => ({
    sourceRef: r.sourceRef,
    rowLabel: r.capability,
    cell: (column) => {
      const role = roleColumns[columnOrder.indexOf(column) - 1]
      if (role === undefined) throw new Error(`${id} declares no column ${JSON.stringify(column)}`)
      return r.cells[role]!.verbatim
    },
  })),
})

/** cc-03 … cc-12: cells keyed by the header WORD, `text` verbatim. */
const wordKeyed = (
  id: string,
  headerLine: number,
  columns: readonly string[],
  matrix: readonly {
    readonly capability: string
    readonly sourceRef: string
    readonly cells: Readonly<Record<string, { readonly text: string }>>
  }[],
): TranscribedMatrix => ({
  id,
  headerLine,
  declaredColumns: columns,
  rows: matrix.map((r) => ({
    sourceRef: r.sourceRef,
    rowLabel: r.capability,
    cell: (column) => r.cells[column]!.text,
  })),
})

const TRANSCRIBED: readonly TranscribedMatrix[] = [
  roleKeyed('MOD-CC-01', 36_262, CC01_COLUMN_ORDER, CC01_ROLE_COLUMNS, CC01_MATRIX),
  roleKeyed('MOD-CC-02', 36_450, CC02_COLUMN_ORDER, CC02_ROLE_COLUMNS, CC02_MATRIX),
  wordKeyed('MOD-CC-03', 36_652, CC03_COLUMNS, CC03_MATRIX),
  wordKeyed('MOD-CC-04', 36_832, CC04_COLUMNS, CC04_MATRIX),
  wordKeyed('MOD-CC-05', 37_076, CC05_COLUMNS, CC05_MATRIX),
  wordKeyed('MOD-CC-06', 37_292, CC06_COLUMNS, CC06_MATRIX),
  wordKeyed('MOD-CC-07', 37_503, CC07_COLUMNS, CC07_MATRIX),
  wordKeyed('MOD-CC-08', 37_664, CC08_COLUMNS, CC08_MATRIX),
  wordKeyed('MOD-CC-09', 37_860, CC09_COLUMNS, CC09_MATRIX),
  wordKeyed('MOD-CC-10', 38_082, CC10_COLUMNS, CC10_MATRIX),
  wordKeyed('MOD-CC-11', 38_287, CC11_COLUMNS, CC11_MATRIX),
  wordKeyed('MOD-CC-12', 38_481, CC12_COLUMNS, CC12_MATRIX),
  {
    id: 'MOD-CC-13',
    headerLine: 38_680,
    declaredColumns: CC13_COLUMNS,
    rows: CC13_ACTIONS.map((a) => ({
      sourceRef: a.matrixRef,
      rowLabel: a.matrixAction,
      cell: (column: string) => a.cells[column as (typeof CC13_COLUMNS)[number]].text,
    })),
  },
]

describe('slice 9 gate 1: the 179 permission rows across 18 matrices', () => {
  it('counts eighteen matrices and one hundred and seventy-nine rows, off the source', () => {
    const parts = { ...MODULE_MATRIX_HEADERS, ...OTHER_MATRIX_HEADERS }
    expect(Object.keys(parts)).toHaveLength(18)

    const counted = Object.fromEntries(
      Object.entries(parts).map(([k, h]) => [k, tableBody(h).length]),
    )
    // The twelve module matrices are 102 rows, counted, never inferred from
    // the span notation that says only where each table is.
    const moduleRows = Object.keys(MODULE_MATRIX_HEADERS).reduce((n, k) => n + counted[k]!, 0)
    expect(moduleRows).toBe(102)
    expect(counted['the surface matrix, §21.1.2']).toBe(20)
    expect(counted['MOD-CC-13 action matrix, §21.16']).toBe(10)
    expect(counted['the run-state table, §21.3']).toBe(3)
    expect(counted['§25.4 action matrix']).toBe(13)
    expect(counted['§26.3 surface interaction map']).toBe(5)
    expect(counted['§26.7 cross-surface matrix']).toBe(26)

    const total = Object.values(counted).reduce((a, b) => a + b, 0)
    expect(total).toBe(179)
  })

  it('every one of the thirteen transcribed matrices matches its line, header-keyed', () => {
    expect(TRANSCRIBED).toHaveLength(13)
    for (const m of TRANSCRIBED) {
      const body = tableBody(m.headerLine)
      expect(m.rows.length, `${m.id} row count against L${m.headerLine}`).toBe(body.length)
      for (const [i, row] of m.rows.entries()) {
        const n = body[i]!
        expect(refLine(row.sourceRef), `${m.id} row ${i + 1} sourceRef`).toBe(n)
        const source = cellsOf(n)
        // The row LABEL is fetched by its own header word too, because the
        // label column is not in the same position in all eighteen: §21.16
        // carries a `#` column and the twelve module matrices do not.
        const labelWord = cellsOf(m.headerLine)[m.id === 'MOD-CC-13' ? 1 : 0]!
        expect(flat(row.rowLabel), `${m.id} L${n} label`).toBe(
          flat(source[columnIndex(m.headerLine, labelWord)]!),
        )
        for (const column of m.declaredColumns) {
          expect(flat(row.cell(column)), `${m.id} L${n} column ${column}`).toBe(
            flat(source[columnIndex(m.headerLine, column)]!),
          )
        }
      }
    }
  })

  it('and the column ORDER is asserted positionally beside the header-keyed read', () => {
    // Reversing a body's column order leaves every value under its own key
    // and the header-keyed gate above entirely green. This is the half that
    // sees it, and it compares the tree's declared order against the source
    // header's order by POSITION.
    for (const m of TRANSCRIBED) {
      const header = cellsOf(m.headerLine)
      const personaColumnsInSourceOrder = header.slice(header.length - 5)
      expect([...m.declaredColumns], `${m.id} declared column order`).toEqual(
        personaColumnsInSourceOrder,
      )
    }
    // All eighteen run Tenant Admin first and Worker last, which is what
    // makes a positional read LOOK safe. It is asserted rather than assumed
    // so a table that stops doing it is visible.
    for (const h of Object.values({ ...MODULE_MATRIX_HEADERS, ...OTHER_MATRIX_HEADERS })) {
      const header = cellsOf(h)
      if (!header.includes('Tenant Admin')) continue
      expect(header.indexOf('Tenant Admin')).toBeLessThan(header.indexOf('Worker'))
    }
  })

  it('the three-row run-state table and the twenty-six-row §26.7 matrix match their lines', () => {
    const runStates = tableBody(36_190)
    expect(CC_RUN_STATE_PERMISSIONS).toHaveLength(runStates.length)
    for (const [i, n] of runStates.entries()) {
      const row = CC_RUN_STATE_PERMISSIONS[i]!
      expect(refLine(row.sourceRef)).toBe(n)
      const source = cellsOf(n)
      expect(flat(row.boardShowsIt)).toBe(flat(source[columnIndex(36_190, 'Board shows it')]!))
      expect(flat(row.supervisorsActOnIt)).toBe(
        flat(source[columnIndex(36_190, 'Supervisors act on it')]!),
      )
      expect(flat(row.lateCapturesFoldIn)).toBe(
        flat(source[columnIndex(36_190, 'Late captures fold in')]!),
      )
      expect(flat(row.figuresFinalCell)).toBe(flat(source[columnIndex(36_190, 'Figures final')]!))
    }

    const sot = tableBody(49_574)
    expect(CC_SOURCE_OF_TRUTH).toHaveLength(sot.length)
    const ccColumn = columnIndex(49_574, 'Client Command Center')
    for (const [i, n] of sot.entries()) {
      const row = CC_SOURCE_OF_TRUTH[i]!
      expect(row.line).toBe(n)
      const source = cellsOf(n)
      expect(flat(row.recordType)).toBe(flat(source[columnIndex(49_574, 'Record type')]!))
      expect(flat(row.singleSourceOfTruth)).toBe(
        flat(source[columnIndex(49_574, 'Single source of truth')]!),
      )
      // The token is the FIRST BACKTICKED SPAN, never a split on ` — `:
      // twelve of the twenty-six use that dash, one uses a comma and three a
      // bare space, so a dash split ships four wrong tokens.
      const backticked = /^`([^`]*)`/.exec(source[ccColumn]!)
      expect(backticked, `L${n} Command Center cell opens with no backticked token`).not.toBeNull()
      expect(row.ccToken).toBe(backticked![1])
    }
  })

  it('the surface matrix and §25.4 rows MOD-CC-13 carries match their lines, header-keyed', () => {
    // These two tables are transcribed only for the ten actions; the surface
    // matrix's other ten rows and §25.4's other three are counted above and
    // are not this file's to re-transcribe.
    expect(CC13_ROW_READINGS).toHaveLength(10)
    for (const row of CC13_ROW_READINGS) {
      const n12 = refLine(row.surfaceMatrixRef)
      expect(flat(cellsOf(n12)[columnIndex(35_002, 'Capability')]!)).toBe(
        flat(row.surfaceMatrixLabel),
      )
      const n254 = refLine(row.section254Ref)
      expect(flat(cellsOf(n254)[columnIndex(48_442, 'Action')]!)).toBe(flat(row.section254Label))
      for (const column of CC13_COLUMNS) {
        expect(flat(row.surfaceMatrix[column]), `§21.1.2 L${n12} ${column}`).toBe(
          flat(cellsOf(n12)[columnIndex(35_002, column)]!),
        )
        expect(flat(row.section254[column]), `§25.4 L${n254} ${column}`).toBe(
          flat(cellsOf(n254)[columnIndex(48_442, column)]!),
        )
      }
    }
    // The surface matrix runs the ten OUT OF ORDINAL ORDER — action 6 is its
    // last action row, below 7 through 10 — so a walk downward assigning
    // 1, 2, 3 … labels six rows wrong and stays internally coherent. The
    // join is by exact capability wording and this asserts it is not
    // positional.
    const surfaceLines = CC13_ROW_READINGS.map((r) => refLine(r.surfaceMatrixRef))
    expect(surfaceLines).not.toEqual([...surfaceLines].sort((a, b) => a - b))
  })
})

/* ==================================================================== *
 * GATE 2 — THE DIVERGENCE IS CARRIED AND NOT RESOLVED.
 *
 * The dispatch called this the slice's defining problem: several tables in
 * the frozen source answer one question differently and no acceptance
 * criterion compares them. A gate that asserted a CHOSEN value would invert
 * the whole discipline, so this gate asserts the opposite — that the shape of
 * the disagreement is what the source states, and that nothing in the tree
 * records a winner.
 * ==================================================================== */

describe('slice 9 gate 2: the divergence is carried, with no adopted position', () => {
  it('re-derives the divergence from the source and finds the measure the tree carries', () => {
    // Re-derived here rather than compared against the tree's own numbers,
    // which would be a gate whose expected value is produced by the code
    // under test. §21.1.2 joins by exact label; §25.4 cannot — three of its
    // ten name the act differently, including a hyphen — so it joins on the
    // ordinal inside its own label.
    const byLabel = new Map(tableBody(35_002).map((n) => [cellsOf(n)[0]!, n]))
    const byOrdinal = new Map<number, number>()
    for (const n of tableBody(48_442)) {
      const m = /^(\d+)\s/.exec(cellsOf(n)[0]!)
      if (m !== null) byOrdinal.set(Number(m[1]), n)
    }
    const head = (field: string): string => {
      const quoted = /^`([^`]*)`/.exec(field)
      return (quoted === null ? field : quoted[1]!).split(' — ')[0]!.trim()
    }

    let cells = 0
    let differOnToken = 0
    let differOnText = 0
    let maxReadings = 0
    for (const action of CC13_ACTIONS) {
      const n12 = byLabel.get(action.matrixAction)
      const n254 = byOrdinal.get(action.ordinal)
      expect(n12, `§21.1.2 carries no row labelled ${action.matrixAction}`).toBeDefined()
      expect(n254, `§25.4 carries no row numbered ${action.ordinal}`).toBeDefined()
      for (const column of CC13_COLUMNS) {
        const three = [
          cellsOf(n12!)[columnIndex(35_002, column)]!,
          cellsOf(refLine(action.matrixRef))[columnIndex(38_680, column)]!,
          cellsOf(n254!)[columnIndex(48_442, column)]!,
        ]
        const tokens = new Set(three.map(head))
        cells += 1
        if (tokens.size > 1) differOnToken += 1
        if (new Set(three).size > 1) differOnText += 1
        maxReadings = Math.max(maxReadings, tokens.size)
      }
    }
    expect({ cells, differOnToken, differOnText, maxReadings }).toEqual({
      cells: 50,
      differOnToken: 32,
      differOnText: 33,
      maxReadings: 2,
    })
    expect(CC13_DIVERGENCE_MEASURE.cellsCompared).toBe(cells)
    expect(CC13_DIVERGENCE_MEASURE.cellsDifferingOnToken).toBe(differOnToken)
    expect(CC13_DIVERGENCE_MEASURE.cellsDifferingOnFullText).toBe(differOnText)
    expect(CC13_DIVERGENCE_MEASURE.maxReadingsForOneCell).toBe(maxReadings)
    expect([...CC13_TABLES]).toHaveLength(3)
  })

  it('records no adopted position anywhere the surface states a divergence', () => {
    // ADOPTION IS ONLY EVER A SEPARATE ARM CARRYING THE LINE THAT ADOPTS IT.
    // What is forbidden is a FIELD THAT COULD HOLD A CHOICE and does not
    // name the source line making it. Comments are stripped first — several
    // of these files explain in prose that they adopt nothing, and a gate
    // that could not tell a declaration from a denial would force those
    // explanations out of the tree.
    //
    // A FIELD TYPED EXACTLY `null` IS THE STRONGEST REFUSAL AVAILABLE, NOT A
    // VIOLATION, and the first draft of this predicate convicted one:
    // `S366_DIVERGENCES` declares `readonly chosen: null`, so the type system
    // itself refuses to record a winner. A gate whose failure message asserts
    // more than its predicate tests convicts something innocent, so the
    // predicate tests the TYPE, and the message says so.
    const files = sourcesUnder('src/surfaces/cc')
    expect(files.length).toBeGreaterThan(60)
    const ADOPTION_FIELD =
      /^[ \t]*(?:readonly[ \t]+)?(?:preferred|canonical|chosen|winner|correctReading|authoritative|resolvedTo|adoptedByThisBuild)[ \t]*\??:[ \t]*(.+)$/gm
    const couldHoldAChoice = (text: string): readonly string[] =>
      [...text.matchAll(ADOPTION_FIELD)]
        .map((m) => m[1]!.trim().replace(/[,;]$/, '').trim())
        .filter((type) => type !== 'null')

    const offenders = files.filter((f) => couldHoldAChoice(stripComments(read(f))).length > 0)
    expect(
      offenders,
      'these files declare a field that could rank two readings without naming the frozen-source ' +
        'line that adopts one; a field typed exactly `null` is exempt because it cannot hold a choice',
    ).toEqual([])

    // NON-VACUITY, RUN ON THIS RUN: the predicate fires on a field that could
    // hold a choice, is silent on the `null` refusal, and is silent on the
    // adopted arm's own locator field.
    expect(couldHoldAChoice('  readonly preferred: string')).toEqual(['string'])
    expect(couldHoldAChoice('  readonly chosen: null')).toEqual([])
    expect(couldHoldAChoice('  readonly adoptedLine: number')).toEqual([])
    // And the population it swept actually contains divergence records, so
    // an empty offender list is a finding rather than an accident.
    expect(
      files.filter((f) => /DIVERGENCE|_READINGS|TwoReadings/.test(read(f))).length,
    ).toBeGreaterThan(5)
    // Including the one whose `null` field the predicate is exempting, so
    // the exemption is exercised against a real file and not only a literal.
    expect(couldHoldAChoice(read('src/surfaces/cc/modules/cc-10-s366/matrix.ts'))).toEqual([])
    expect(read('src/surfaces/cc/modules/cc-10-s366/matrix.ts')).toMatch(
      /^ {2}readonly chosen: null$/m,
    )
  })
})

/* ==================================================================== *
 * GATE 3 — THIRTEEN MODULES, THIRTEEN SCREENS, TWELVE ROUTE DIRECTORIES.
 *
 * `AC-CC-040` (L35261) forbids a fourteenth module route and `TEST-CC-040`
 * (L35268) is the source's own named test for it. THE THREE SETS ARE NOT ONE
 * SET, which is why all three counts are asserted and so is the mapping.
 * ==================================================================== */

describe('slice 9 gate 3: thirteen modules, thirteen screens, and the mapping', () => {
  it('reads AC-CC-040 and TEST-CC-040 off their own lines', () => {
    expect(uniqueLineCarrying('The surface exposes exactly thirteen modules')).toBe(35_261)
    expect(line(35_261)).toContain('`AC-CC-040`')
    expect(line(35_261)).toContain('no fourteenth module route exists')
    expect(uniqueLineCarrying('Enumerate rendered module routes for a Quality Manager session')).toBe(
      35_268,
    )
    expect(line(35_268)).toContain('`TEST-CC-040`')
  })

  it('counts thirteen modules, thirteen register rows and twelve route directories', () => {
    expect(CC_MODULE_SPINE).toHaveLength(13)
    expect(tableBody(48_384)).toHaveLength(13)
    expect(CC_SCREENS).toHaveLength(13)
    const dirs = readdirSync(join(ROOT, 'app/command-center'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
      .sort()
    expect(dirs).toHaveLength(12)
    // Twelve directories under thirteen screens is not an error and the
    // difference is named: one screen authors no directory at all, and one
    // directory is claimed by no module.
    expect(dirs.filter((d) => !CC_CLAIMED_SLUGS.includes(d))).toEqual(['cell-view'])
  })

  it('the register maps thirteen screens onto modules, and no module owns two', () => {
    const body = tableBody(48_384)
    for (const [i, screen] of CC_SCREENS.entries()) {
      const n = body[i]!
      expect(refLine(screen.registerRef)).toBe(n)
      const source = cellsOf(n)
      expect(flat(screen.name)).toBe(flat(source[columnIndex(48_384, 'Screen name')]!))
      expect(flat(screen.purpose)).toBe(flat(source[columnIndex(48_384, 'Purpose')]!))
      expect(flat(screen.modulesShown)).toBe(
        flat(source[columnIndex(48_384, 'Modules and features shown')]!),
      )
    }
    const owners = CC_SCREENS.map((s) => s.owningModule).filter((m) => m !== null)
    expect(new Set(owners).size, 'one module owns at most one route').toBe(owners.length)
    // Two screens are owned by nobody and each says why rather than leaving
    // the gap to be read as an omission.
    for (const s of CC_SCREENS) {
      if (s.owningModule === null) expect(s.noOwnerReason).not.toBeNull()
      else expect(s.noOwnerReason).toBeNull()
    }
  })

  it('SCR-CC-\\d+ is exactly the thirteen when anchored, and the family has no three-digit member', () => {
    // ANCHOR BOTH ENDS. An unanchored pattern invented a five-member family
    // that does not exist: every apparent `SCR-CC-00N` is the tail of an
    // `AC-SCR-CC-00N` or `TEST-SCR-CC-00N` identifier. The fix is the anchor,
    // never an allowlist of five exceptions, which would enshrine the phantom.
    const text = SOURCE_LINES.join('\n')
    expect((text.match(/SCR-CC-/g) ?? []).length).toBe(176)
    const anchored = new Set(
      [...text.matchAll(/(?:^|[^A-Za-z0-9-])(SCR-CC-\d+)/gm)].map((m) => m[1]!),
    )
    expect([...anchored].sort()).toEqual(CC_SCREENS.map((s) => s.id).sort())
    expect(anchored.size).toBe(13)
    // The phantom, measured: zero standalone occurrences, and the unanchored
    // pattern that manufactured five.
    expect((text.match(/(?:^|[^A-Za-z0-9-])SCR-CC-00\d/gm) ?? []).length).toBe(0)
    expect(new Set([...text.matchAll(/SCR-CC-\d+/g)].map((m) => m[0])).size).toBe(18)
    // 96 full-shape tokens and 176 occurrences are the same population read
    // by two regexes. Both are stated so neither can be quoted as the other.
    expect(new Set([...text.matchAll(/SCR-CC-[A-Za-z0-9-]+/g)].map((m) => m[0])).size).toBe(96)
  })
})

/* ==================================================================== *
 * GATE 4 — `MOD-CC-13` IS THE ONLY ROUTELESS MODULE.
 *
 * The dispatch said two modules have no route directory. Measured against
 * `CC_CLAIMED_SLUGS` rather than against a listing of `app/command-center/`:
 * `MOD-CC-07` DOES claim a slug, and the register names it on `SCR-CC-13`.
 * `MOD-CC-02` claims none either — it is chrome — so the routeless set is
 * two modules and only ONE of them is the action set.
 * ==================================================================== */

describe('slice 9 gate 4: which modules claim no route, asserted against CC_CLAIMED_SLUGS', () => {
  it('eleven modules claim a slug and the two that do not each state a reason', () => {
    expect(CC_CLAIMED_SLUGS).toHaveLength(11)
    const routeless = CC_MODULE_SPINE.filter((m) => m.slug === null).map((m) => m.id)
    expect(routeless).toEqual(['MOD-CC-02', 'MOD-CC-13'])
    for (const m of CC_MODULE_SPINE) {
      if (m.slug === null) {
        expect(m.noRouteReason, `${m.id} claims no slug and gives no reason`).not.toBeNull()
        expect((m.noRouteReason ?? '').length).toBeGreaterThan(80)
      } else {
        expect(m.noRouteReason).toBeNull()
      }
    }
  })

  it('MOD-CC-07 claims learning-read-view, and every claimed slug has a directory', () => {
    // The dispatch named `MOD-CC-07` routeless. It is not: the register puts
    // it on the learning read view beside a MOD-CC-06 feature, and the spine
    // gives it that slug. A task building it mount-only would have left a
    // claimed slug with no directory, which the generator reads as declared
    // and not built.
    expect(CC_MODULE_SPINE.find((m) => m.id === 'MOD-CC-07')!.slug).toBe('learning-read-view')
    for (const slug of CC_CLAIMED_SLUGS) {
      expect(
        existsSync(join(ROOT, 'app/command-center', slug, 'page.tsx')),
        `${slug} is claimed by a module and has no page`,
      ).toBe(true)
    }
    // And `MOD-CC-13`'s routelessness is asserted from the CLAIM SIDE, not
    // by listing the directory tree: no slug it could claim exists here.
    expect(CC_MODULE_SPINE.find((m) => m.id === 'MOD-CC-13')!.slug).toBeNull()
  })
})

/* ==================================================================== *
 * GATE 5 — EVERY MODULE NAMES ITS OWN MODULE ID IN ITS OWN ROUTE FILE.
 *
 * A module can be demonstrated by its slug claim alone and never say what it
 * is. This gate has two INDEPENDENT halves, and they are independent on
 * purpose: redundant protections cannot be verified one at a time, so the
 * campaign plants the removal of each and of both.
 *
 * HALF A — the wrapped-quotation defence. Three earlier versions of this
 * gate were each defeated by a quotation: one naming seven module ids, one
 * naming exactly the right one, and one WRAPPED between two identifiers so
 * the right id sat alone on its line. Line boundaries are not semantic
 * boundaries, so the window is the naming line AND both its neighbours.
 *
 * HALF B — the id must reach the file as CODE, not as prose. Comments are
 * stripped and the id must survive, either literally or through the spine
 * constant that resolves to it. A quotation cannot pass this.
 * ==================================================================== */

/** `MOD-CC-05` from `CC05_MODULE`, or from a literal. Never from a comment. */
function moduleIdsInCode(text: string): ReadonlySet<string> {
  const code = stripComments(text)
  const found = new Set<string>()
  for (const m of code.matchAll(/\bCC(\d\d)_MODULE\b/g)) found.add(`MOD-CC-${m[1]}`)
  for (const m of code.matchAll(/ccModule\(\s*['"](MOD-CC-\d\d)['"]\s*\)/g)) found.add(m[1]!)
  for (const m of code.matchAll(/['"](MOD-CC-\d\d)['"]/g)) found.add(m[1]!)
  return found
}

/** The route directories a module owns, from the spine's claims. */
const OWNED_ROUTES: readonly { readonly module: CcModuleId; readonly slug: string }[] =
  CC_MODULE_SPINE.filter((m) => m.slug !== null).map((m) => ({
    module: m.id,
    slug: m.slug as string,
  }))

describe('slice 9 gate 5: every module names its own module id in its own route file', () => {
  it('HALF A: on a line whose two neighbours name no OTHER module', () => {
    expect(OWNED_ROUTES).toHaveLength(11)
    for (const { module, slug } of OWNED_ROUTES) {
      const lines = read(join('app/command-center', slug, 'page.tsx')).split('\n')
      const clean = lines.filter((_, i) => {
        if (!lines[i]!.includes(module)) return false
        const window = [lines[i - 1] ?? '', lines[i]!, lines[i + 1] ?? ''].join('\n')
        const others = new Set(window.match(/MOD-CC-\d\d/g) ?? [])
        others.delete(module)
        return others.size === 0
      })
      expect(
        clean.length,
        `app/command-center/${slug}/page.tsx never names ${module} on a line whose ` +
          `neighbours name no other MOD-CC-*`,
      ).toBeGreaterThan(0)
    }
  })

  it('HALF B: and the id reaches the file as code, not only as prose', () => {
    // A RECORDED FINDING, CARRIED RATHER THAN REPAIRED. Eleven of the twelve
    // route files carry their own module id in code. `live-shift-board` does
    // not: it names MOD-CC-01 only inside comments, and the only module id it
    // renders comes from the register cell its screen record transcribes,
    // which is the quotation shape half B exists to refuse. Reported here
    // with the file that owns it; this file edits no source.
    //
    // Asserted in BOTH directions, so it goes red when a SECOND file drops
    // to prose-only AND when this one is fixed.
    const proseOnly = OWNED_ROUTES.filter(
      ({ module, slug }) =>
        !moduleIdsInCode(read(join('app/command-center', slug, 'page.tsx'))).has(module),
    ).map(({ slug }) => slug)
    expect(proseOnly).toEqual(['live-shift-board'])

    // NON-VACUITY: the extractor sees an id through the spine constant, sees
    // a literal, and does NOT see one that occurs only in a comment.
    expect(moduleIdsInCode('const x = CC05_MODULE.id')).toContain('MOD-CC-05')
    expect(moduleIdsInCode("const y = 'MOD-CC-10'")).toContain('MOD-CC-10')
    expect(moduleIdsInCode('/* names MOD-CC-04 */ const z = 1')).not.toContain('MOD-CC-04')
  })
})

/* ==================================================================== *
 * GATE 6 — THE NINE `FB-CC-*` PATTERNS, RE-DERIVED, AND `AC-CC-090`.
 *
 * `AC-CC-090` (L35710) requires every functionality in chapter 21 to
 * reference at least one `FB-CC-*` pattern. The dispatch reported it failing
 * on three modules. Measured over the whole chapter it fails on all
 * thirteen, in both directions, and the two directions are counted
 * separately because they are two different defects.
 * ==================================================================== */

/** The chapter-21 module card spans, from each section heading to the next. */
const CARD_SPANS: readonly { readonly module: CcModuleId; readonly from: number; readonly to: number }[] =
  [
    { module: 'MOD-CC-01', from: 36_219, to: 36_426 },
    { module: 'MOD-CC-02', from: 36_427, to: 36_617 },
    { module: 'MOD-CC-03', from: 36_618, to: 36_795 },
    { module: 'MOD-CC-04', from: 36_796, to: 37_026 },
    { module: 'MOD-CC-05', from: 37_027, to: 37_250 },
    { module: 'MOD-CC-06', from: 37_251, to: 37_470 },
    { module: 'MOD-CC-07', from: 37_471, to: 37_633 },
    { module: 'MOD-CC-08', from: 37_634, to: 37_825 },
    { module: 'MOD-CC-09', from: 37_826, to: 38_047 },
    { module: 'MOD-CC-10', from: 38_048, to: 38_246 },
    { module: 'MOD-CC-11', from: 38_247, to: 38_452 },
    { module: 'MOD-CC-12', from: 38_453, to: 38_644 },
    { module: 'MOD-CC-13', from: 38_645, to: 38_887 },
  ]

describe('slice 9 gate 6: the nine FB-CC patterns, and AC-CC-090 measured', () => {
  it('re-derives the nine off the selection table so a tenth cannot be minted', () => {
    const body = tableBody(35_692)
    expect(body).toHaveLength(9)
    const derived = body.map((n) => {
      const m = /^`(FB-CC-[A-Z]+)`$/.exec(cellsOf(n)[0]!)
      expect(m, `L${n} does not open with a backticked FB-CC identifier`).not.toBeNull()
      return m![1]!
    })
    expect([...CC_FALLBACK_PATTERN_IDS]).toEqual(derived)
    expect(CC_FALLBACK_PATTERNS).toHaveLength(9)
    for (const [i, n] of body.entries()) {
      const source = cellsOf(n)
      const p = CC_FALLBACK_PATTERNS[i]!
      expect(p.triggeringCondition).toBe(source[columnIndex(35_692, 'Triggering condition')])
      expect(p.decisionControls).toBe(source[columnIndex(35_692, 'Decision controls')])
      expect(p.clientSideQueueing).toBe(source[columnIndex(35_692, 'Client-side queueing')])
      expect(p.terminalSafeState).toBe(source[columnIndex(35_692, 'Terminal safe state')])
    }
    // `FB-CC-001` and `FB-CC-002` parse as members of a library they do not
    // belong to. Both are in the source and neither is in the registry, so
    // a `FB-CC-\w+` sweep cannot mint a tenth pattern from them.
    const all = new Set(
      [...SOURCE_LINES.join('\n').matchAll(/FB-CC-[A-Za-z0-9]+/g)].map((m) => m[0]),
    )
    expect(all.has('FB-CC-001') && all.has('FB-CC-002')).toBe(true)
    expect([...all].filter((t) => !(CC_FALLBACK_PATTERN_IDS as string[]).includes(t)).sort()).toEqual(
      ['FB-CC-001', 'FB-CC-002'],
    )
  })

  it('AC-CC-090 fails on all thirteen modules, and the two directions are counted apart', () => {
    expect(uniqueLineCarrying('Every functionality in this chapter references at least one')).toBe(
      35_710,
    )
    expect(line(35_710)).toContain('`AC-CC-090`')

    const nine = CC_FALLBACK_PATTERN_IDS as readonly string[]
    // BOTH ENDS ANCHORED, and the whole line is read: a functionality
    // declaration on this source runs past a thousand characters and its
    // fallback clause is the last sentence of it.
    const patternsOn = (text: string): ReadonlySet<string> =>
      new Set(nine.filter((p) => new RegExp(`\`${p}\``).test(text)))

    let functionalities = 0
    let namingNone = 0
    const declaresUnreferenced: string[] = []
    const referencesUndeclared: string[] = []
    for (const span of CARD_SPANS) {
      const declared = new Set<string>()
      const referenced = new Set<string>()
      for (let n = span.from; n <= span.to; n += 1) {
        const text = line(n)
        if (/^\*\*Fallback identifiers\.\*\*/.test(text)) {
          for (const p of patternsOn(text)) declared.add(p)
        }
        if (!/^\s*-\s+\*\*`FUNC-CC-[0-9-]+`/.test(text)) continue
        functionalities += 1
        const named = patternsOn(text)
        if (named.size === 0) namingNone += 1
        for (const p of named) referenced.add(p)
      }
      expect(declared.size, `${span.module} declares no fallback identifiers`).toBeGreaterThan(0)
      if ([...declared].some((p) => !referenced.has(p))) declaresUnreferenced.push(span.module)
      if ([...referenced].some((p) => !declared.has(p))) referencesUndeclared.push(span.module)
    }

    expect(functionalities).toBe(158)
    expect(namingNone).toBe(48)
    // Direction one: a card declares a pattern no functionality of its own
    // names. Twelve of thirteen. Direction two: a functionality names a
    // pattern its card never declared. Two. They are separate counts because
    // they are separate defects, and a single "AC-CC-090 fails" assertion
    // passes on either and hides the other.
    expect(declaresUnreferenced).toHaveLength(12)
    expect(referencesUndeclared).toEqual(['MOD-CC-02', 'MOD-CC-06'])
    expect(declaresUnreferenced).not.toContain('MOD-CC-02')
  })
})

/* ==================================================================== *
 * GATE 7 — THE SURFACE QUEUES NOTHING, AND THE SPLIT IS BETWEEN TWO
 * SHAPES OF REFUSAL RATHER THAN BETWEEN REFUSING AND NOT.
 *
 * The dispatch said seven of the nine rows say the surface queues nothing.
 * All nine refuse a client-side queue. The 7/2 split is between `Not
 * applicable` and `None, deliberately`, and the second is the STRONGER of
 * the two: a write exists on that path and is still not queued. Only FIVE
 * rows carry the exact words the dispatch quoted, so a gate asserting that
 * sentence across seven rows would assert a sentence the source does not
 * carry and find five. Both numbers are pinned, each derived.
 * ==================================================================== */

describe('slice 9 gate 7: the surface queues nothing, in two shapes of refusal', () => {
  it('all nine refuse a client-side queue, 7 by not-applicable and 2 deliberately', () => {
    const body = tableBody(35_692)
    const column = columnIndex(35_692, 'Client-side queueing')
    const cells = body.map((n) => cellsOf(n)[column]!)
    expect(cells).toHaveLength(9)
    expect(cells.filter((c) => c.startsWith('Not applicable'))).toHaveLength(7)
    expect(cells.filter((c) => c === 'None, deliberately')).toHaveLength(2)
    // EXACTLY FIVE carry the words the dispatch quoted, and the other two
    // `Not applicable` cells give different reasons.
    expect(cells.filter((c) => c === 'Not applicable — nothing is written')).toHaveLength(5)
    expect(
      cells.filter((c) => c.startsWith('Not applicable') && c !== 'Not applicable — nothing is written'),
    ).toHaveLength(2)
    // The tree's classifier is asked of every one of the nine, and it is
    // asked of the transcribed CELL rather than of a boolean beside it.
    for (const p of CC_FALLBACK_PATTERNS) expect(queuesClientSide(p), p.id).toBe(false)
    // NON-VACUITY: the classifier has a firing branch, exercised on this run.
    expect(
      queuesClientSide({ ...CC_FALLBACK_PATTERNS[0]!, clientSideQueueing: 'Queued on the client' }),
    ).toBe(true)
  })
})

/* ==================================================================== *
 * GATE 8 — SIX TABLES ANSWER THE TENANT ADMIN QUESTION, AND A DECISION
 * IDENTIFIER FOR IT DOES EXIST.
 *
 * The dispatch said four tables and said no decision identifier exists. Both
 * halves were wrong, and the second was wrong in the one place the dispatch
 * called the slice's defining problem: `DEC-TACC-001` is raised in chapter
 * 17, which nobody had opened.
 * ==================================================================== */

describe('slice 9 gate 8: six tables on the Tenant Admin question, and DEC-TACC-001', () => {
  it('counts six statements, each keyed on something different', () => {
    const six = {
      'the surface matrix, capability-keyed': 35_002,
      'MOD-CC-13 action matrix, action-keyed': 38_680,
      '§25.4, action-keyed': 48_442,
      '§26.7, record-type-keyed': 49_574,
      'MTX-TEN-02c, module-keyed': 22_056,
      'the module-to-actor concentration table': 35_241,
    }
    expect(Object.keys(six)).toHaveLength(6)
    for (const [name, h] of Object.entries(six)) {
      expect(tableBody(h).length, name).toBeGreaterThan(0)
    }
    expect(tableBody(22_056)).toHaveLength(13)
    expect(cellsOf(22_056)[1]).toBe('Module')
    expect(tableBody(35_241)).toHaveLength(13)
    // THE SIXTH ANSWERS BY SILENCE, and silence is not a token. Its
    // MOD-CC-12 row names five roles and the Tenant Admin is not among them,
    // while three other rows of the same table DO name the Tenant Admin — so
    // the omission is a statement rather than a table-wide convention.
    const cc12Row = tableBody(35_241).find((n) => line(n).includes('`MOD-CC-12`'))
    expect(cc12Row).toBe(35_254)
    expect(line(35_254)).not.toContain('Tenant Admin')
    expect(tableBody(35_241).filter((n) => line(n).includes('Tenant Admin'))).toHaveLength(3)
  })

  it('DEC-TACC-001 is real, and its card carries the sentence, not its register row', () => {
    // The footnote key under MTX-TEN-02c names it; the card raises it; the
    // register row files it against chapter 17.
    expect(line(22_072)).toContain('`DEC-TACC-001`')
    expect(line(23_069)).toContain('**New decision `DEC-TACC-001`')
    expect(cellsOf(115_232)[0]).toBe('`DEC-TACC-001`')
    expect(cellsOf(115_232)[1]).toBe('Chapter 17 — RBAC and Permission Matrices')
    // THE REGISTER ROW'S THIRD COLUMN IS A REFERENCE COUNT, NOT AN IMPACT
    // STATEMENT. The dispatch attributed the eleven-module-cells sentence to
    // this row; the sentence is on the card and this row's own header names
    // its third column something else entirely.
    expect(cellsOf(115_156)[2]).toBe('References across the blueprint')
    expect(cellsOf(115_232)[2]).toBe('8')
    expect(line(115_232)).not.toContain('eleven')
    expect(line(23_069)).toContain('eleven module cells depend on it')
    expect(line(23_069)).toContain('Affected cells:')
  })

  it('every DEC-TACC-001 locator in the tree points at the line carrying the card', () => {
    // THE LOCATOR IS DERIVED, NOT TRUSTED: the line is found by searching for
    // a phrase that occurs once, and every citation in the tree is required
    // to name the line the search found. A check that only asked whether the
    // cited line was non-blank stayed green when a citation was moved.
    const cardLine = uniqueLineCarrying('**New decision `DEC-TACC-001`')
    const citations: { readonly file: string; readonly cited: number }[] = []
    for (const f of [...sourcesUnder('src/surfaces/cc'), ...sourcesUnder('app/command-center')]) {
      const text = read(f)
      if (!text.includes('DEC-TACC-001')) continue
      for (const m of text.matchAll(/DEC-TACC-001 card · L(\d{3,6})/g)) {
        citations.push({ file: f, cited: Number(m[1]) })
      }
      for (const m of text.matchAll(/^\s*cardRef: 'L(\d{3,6})',$/gm)) {
        citations.push({ file: f, cited: Number(m[1]) })
      }
    }
    expect(
      new Set(citations.map((c) => c.file)).size,
      'fewer than two files in the tree cite the DEC-TACC-001 card',
    ).toBeGreaterThan(1)
    for (const c of citations) {
      expect(c.cited, `${c.file} cites the DEC-TACC-001 card at the wrong line`).toBe(cardLine)
    }
  })

  it('seventeen module rows grant the Tenant Admin more, five after L35004, three narrowly', () => {
    const nonProhibition: number[] = []
    for (const h of Object.values(MODULE_MATRIX_HEADERS)) {
      const ta = columnIndex(h, 'Tenant Admin')
      for (const n of tableBody(h)) {
        const cell = cellsOf(n)[ta]!
        if (cell.split(' — ')[0]!.trim() !== 'Explicitly prohibited') nonProhibition.push(n)
      }
    }
    // Four was the dispatch's figure and is none of the three defensible
    // numbers. Each is derived here rather than restated.
    expect(nonProhibition).toHaveLength(17)
    const reportOrBannerRows = nonProhibition.filter(
      (n) => n >= 36_452 && n <= 36_459 ? true : n >= 38_289 && n <= 38_297,
    )
    expect(nonProhibition.length - reportOrBannerRows.length).toBe(5)
    const scopeConditioned = nonProhibition.filter((n) =>
      /Tenant or Site read scope/.test(cellsOf(n)[columnIndex(headerOf(n), 'Tenant Admin')]!),
    )
    expect(scopeConditioned).toHaveLength(3)
    // L35004 is the surface matrix row those five are measured against, and
    // it is a grant rather than a prohibition, which is why it is the datum.
    expect(cellsOf(35_004)[columnIndex(35_002, 'Tenant Admin')]).toBe(
      'Allowed with conditions — report and banner routes only',
    )
  })
})

/** The module matrix header a data line belongs to. Derived, never assumed. */
function headerOf(dataLine: number): number {
  for (const h of Object.values(MODULE_MATRIX_HEADERS)) {
    const body = tableBody(h)
    if (body.includes(dataLine)) return h
  }
  throw new Error(`L${dataLine} is in none of the twelve module matrices`)
}

/* ==================================================================== *
 * GATE 9 — THE ACTION RAIL'S MOUNT SITES.
 *
 * L38793 enumerates the modules whose screens exercise one or more of the
 * ten. It names SEVEN. It is NOT seven screens: `MOD-CC-03` owns one route
 * and renders on a second, so the seven modules occupy EIGHT route
 * directories. The distinction is the whole point of counting both sets.
 *
 * The source contradicts itself here and it is not repaired: L38793's own
 * sentence opens with a phrase covering every other module on the surface,
 * which is twelve, and then enumerates seven. Both readings are recorded and
 * neither is adopted; a gate that asserted one would be this build deciding
 * on the source's behalf.
 * ==================================================================== */

describe('slice 9 gate 9: the action rail mounts where L38793 names, and nowhere else', () => {
  it('L38793 enumerates seven modules and the tree carries exactly those seven', () => {
    const named = [...new Set(line(38_793).match(/MOD-CC-\d\d/g) ?? [])].sort()
    expect(named).toEqual(
      ['MOD-CC-03', 'MOD-CC-04', 'MOD-CC-05', 'MOD-CC-06', 'MOD-CC-09', 'MOD-CC-10', 'MOD-CC-12'],
    )
    expect([...CC13_EXERCISING_MODULES].sort()).toEqual(named)
    // A `[^;]*` pattern that runs past its delimiter drops the clause after
    // it, and a controller grep reported six. The ordinals are read per
    // clause so the count cannot come out short.
    const clauses = line(38_793).split(';')
    expect(clauses.length).toBeGreaterThanOrEqual(7)
    for (const site of CC13_EXERCISED_ON) {
      const clause = clauses.find((c) => c.includes(site.module))
      expect(clause, `L38793 names no clause for ${site.module}`).toBeDefined()
      for (const ordinal of site.ordinals) {
        expect(new RegExp(`\\b${ordinal}\\b`).test(clause!), `${site.module} action ${ordinal}`).toBe(
          true,
        )
      }
    }
    // And the self-contradiction is recorded rather than resolved: the
    // sentence opens over every OTHER module, which is twelve.
    expect(line(38_793)).toContain('Every other module on this surface')
    expect(CC_MODULE_SPINE.length - 1).toBe(12)
  })

  it('eight route directories mount the rail — the seven modules, one of them twice', () => {
    const dirs = readdirSync(join(ROOT, 'app/command-center'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
    // COMMENTS STRIPPED FIRST. Several of these pages EXPLAIN in prose why
    // the rail does or does not belong on them, and a check that could not
    // tell a mount from an explanation would force those out of the tree —
    // the same defect that made a `use client` gate red on a clean tree.
    const mounts = dirs.filter((d) =>
      /<Cc13ActionRail\b/.test(stripComments(read(join('app/command-center', d, 'page.tsx')))),
    )
    expect(mounts.sort()).toEqual(
      [
        'alert-and-escalation-feed',
        'cell-view',
        'deviation-workspace',
        'governance-gate-queue',
        'learned-change-approvals',
        'run-drill-down',
        'shift-handoff-panel',
        'sync-conflict-review-panel',
      ],
    )
    // Eight directories, seven modules: `MOD-CC-03` renders on the run
    // drill-down it owns and on the cell view it does not, which is why a
    // count of screens and a count of modules are different claims.
    const mountedModules = new Set(
      mounts.flatMap((d) => {
        const m = /mountedOn=\{?["]?(?:CC(\d\d)_MODULE\.id|(MOD-CC-\d\d))["]?\}?/.exec(
          read(join('app/command-center', d, 'page.tsx')),
        )
        expect(m, `${d} mounts the rail without saying which module's context it is`).not.toBeNull()
        return [m![2] ?? `MOD-CC-${m![1]}`]
      }),
    )
    expect([...mountedModules].sort()).toEqual([...CC13_EXERCISING_MODULES].sort())
    expect(mounts).toHaveLength(8)
    expect(mountedModules.size).toBe(7)
  })

  it('and the four directories whose module L38793 does not name do not mount it', () => {
    const dirs = readdirSync(join(ROOT, 'app/command-center'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
    const notNamed = OWNED_ROUTES.filter(
      ({ module }) => !(CC13_EXERCISING_MODULES as readonly string[]).includes(module),
    )
    expect(notNamed.map((r) => r.slug).sort()).toEqual([
      'agent-activity-panel',
      'learning-read-view',
      'live-shift-board',
      'reports-and-report-builder',
    ])
    for (const { slug } of notNamed) {
      expect(dirs).toContain(slug)
      expect(
        /<Cc13ActionRail\b/.test(stripComments(read(join('app/command-center', slug, 'page.tsx')))),
        `${slug} mounts the action rail and L38793 does not name its module`,
      ).toBe(false)
    }
    // `MOD-CC-08`'s own interconnection line claims action 9, which L38793
    // gives to another module. Recorded, not adopted, and the rail is not
    // mounted there — which is what the assertion above holds.
    expect(line(37_757)).toContain('action 9')
    expect(line(38_793)).not.toContain('MOD-CC-08')
  })
})

/* ==================================================================== *
 * GATE 10 — THE DEFECT ONLY A BUILD COULD SEE, CAUGHT WITHOUT ONE.
 *
 * `WriteControl`'s enabled branch renders a client `Button` with an
 * `onClick`. A SERVER component that reaches that branch hands a function
 * across the client boundary and the export fails. Six of seven Command
 * Center panels shipped it, every one green on its own unit and component
 * suites, because a component suite mounts the component and the boundary
 * exists only in a build. The discriminator is the one the build itself
 * gave: only a panel rendering an `allow(...)` decision reaches that branch.
 *
 * WHAT THIS GATE DOES NOT DO. It does not forbid `'use client'`, and it does
 * not forbid a server component from rendering a `WriteControl`. Five tasks
 * wrote the first of those and all five went red on the correct fix. A gate
 * that forbids a mechanism rather than a misuse of it will eventually forbid
 * the fix. This one names the pair.
 * ==================================================================== */

const HAS_USE_CLIENT = /^\s*['"]use client['"]\s*;?\s*$/m

describe('slice 9 gate 10: no server component renders a WriteControl with an allow', () => {
  it('every file that renders one and constructs an allow is a client component', () => {
    const files = [...sourcesUnder('src/surfaces/cc'), ...sourcesUnder('app/command-center')]
    const renders = files.filter((f) => /<WriteControl\b/.test(read(f)))
    // NON-VACUITY: the population is asserted before the property is. A
    // sweep over zero files proves nothing at all.
    expect(renders.length).toBeGreaterThan(0)
    const withAnAllow = renders.filter((f) => /\ballow\s*\(/.test(stripComments(read(f))))
    expect(withAnAllow.length, 'no Command Center file renders an enabled WriteControl').toBe(6)

    const serverSide = withAnAllow.filter((f) => !HAS_USE_CLIENT.test(read(f)))
    expect(
      serverSide,
      'these files render a WriteControl and construct an allow(...) decision without a ' +
        "'use client' directive; WriteControl's enabled branch renders <Button onClick=...>, " +
        'and a server component passing a function to a client component fails the export',
    ).toEqual([])
  })

  it('the directive is anchored at both ends of its own line', () => {
    // A `use client` gate went red on a clean tree because two files EXPLAIN
    // the directive in a comment. A directive is a whole line, so the
    // pattern is anchored at both ends.
    expect(HAS_USE_CLIENT.test("'use client'\nimport x from 'y'")).toBe(true)
    expect(HAS_USE_CLIENT.test("// a 'use client' file must not export data\nconst a = 1")).toBe(
      false,
    )
    expect(HAS_USE_CLIENT.test('const s = "use client"')).toBe(false)
  })
})

/* ==================================================================== *
 * GATE 11 — A `'use client'` FILE MUST NOT EXPORT A PLAIN DATA OBJECT.
 *
 * This is the rule; "no client modules" is not. A client module's exports
 * become client references in a build, so a server component reading one
 * gets `undefined` at prerender — invisible to every component test, because
 * a component suite mounts the component and never crosses the boundary.
 * Four panels shipped an undefined module id that way in slice 7.
 * ==================================================================== */

describe('slice 9 gate 11: a client file exports components, never plain data', () => {
  it('no client file on this surface exports an object or array', () => {
    const files = [...sourcesUnder('src/surfaces/cc'), ...sourcesUnder('app/command-center')]
    const clients = files.filter((f) => HAS_USE_CLIENT.test(read(f)))
    expect(clients.length, 'this surface has no client components at all').toBeGreaterThan(0)
    const plainData = /^export const \w+[^=\n]*= *[[{]/m
    const offenders = clients.filter((f) => plainData.test(stripComments(read(f))))
    expect(offenders).toEqual([])
    // Every one of them exports at least one function, so the sweep is over
    // components rather than over an empty set that trivially satisfies it.
    for (const f of clients) expect(read(f)).toMatch(/^export (?:default )?function \w+/m)
    // NON-VACUITY, on this run: the predicate fires on both shapes it names.
    expect(plainData.test('export const OWN_ACTS = [\n')).toBe(true)
    expect(plainData.test('export const CFG: Shape = {\n')).toBe(true)
    expect(plainData.test('export function Panel() {\n')).toBe(false)
  })
})

/* ==================================================================== *
 * GATE 12 — REACHABILITY FROM `app/`.
 *
 * A component that compiles, passes its unit suite and is imported by
 * nothing is not shipped. The best disclosure slice 8 produced rendered on
 * no page for a whole slice, and nothing said so.
 *
 * THE WALK FOLLOWS BOTH `@/…` AND RELATIVE SPECIFIERS AND MATCHES `from`
 * ACROSS NEWLINES. A dependency check that under-reports goes green on a
 * broken chain, and two tasks independently shipped a single-line regex that
 * could not see a wrapped import.
 * ==================================================================== */

const EXTENSIONS = ['.ts', '.tsx']

function resolveSpecifier(fromFile: string, spec: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = join(ROOT, 'src', spec.slice(2))
  else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec)
  else return null
  for (const e of EXTENSIONS) if (existsSync(base + e)) return base + e
  for (const e of EXTENSIONS) if (existsSync(join(base, `index${e}`))) return join(base, `index${e}`)
  return null
}

/** `from` may sit lines below its `import`. Side-effect imports carry no `from`. */
const FROM_SPEC = /(?:^|\n)[ \t]*(?:import|export)\b[^;]{0,600}?\bfrom\s*['"]([^'"]+)['"]/g
const BARE_IMPORT = /(?:^|\n)[ \t]*import\s*['"]([^'"]+)['"]/g
const DYNAMIC_IMPORT = /import\(\s*['"]([^'"]+)['"]\s*\)/g

function reachableFromApp(): ReadonlySet<string> {
  const seen = new Set<string>()
  const queue = walk(join(ROOT, 'app')).filter((f) => CODE.test(f))
  for (const f of queue) seen.add(f)
  while (queue.length > 0) {
    const f = queue.pop()!
    const text = readFileSync(f, 'utf8')
    for (const m of [
      ...text.matchAll(FROM_SPEC),
      ...text.matchAll(BARE_IMPORT),
      ...text.matchAll(DYNAMIC_IMPORT),
    ]) {
      const target = resolveSpecifier(f, m[1]!)
      if (target !== null && !seen.has(target)) {
        seen.add(target)
        queue.push(target)
      }
    }
  }
  return seen
}

describe('slice 9 gate 12: every module file reaches a route, or declares that it does not', () => {
  const reached = reachableFromApp()

  it('the walk sees a wrapped import, which is the shape that under-reports', () => {
    expect(FROM_SPEC.test("import {\n  A,\n  B,\n} from '@/surfaces/cc/modules'")).toBe(true)
    FROM_SPEC.lastIndex = 0
    // And it reaches something deep: a file three hops from any page.
    expect(reached.has(join(ROOT, 'src/surfaces/cc/modules.ts'))).toBe(true)
    expect(reached.size).toBeGreaterThan(100)
  })

  it('SecondTreatmentDisclosure reaches a route, measured rather than assumed', () => {
    // It reached nothing at all from slice 8 until wave 2 wired it. The
    // measurement is only worth having if it can answer false, and the case
    // below is a file that does answer false.
    expect(
      reached.has(join(ROOT, 'src/surfaces/cc/modules/cc-10-s366/SecondTreatmentDisclosure.tsx')),
    ).toBe(true)
    expect(reached.has(join(ROOT, 'src/surfaces/cc/sign-in/SignInScreen.tsx'))).toBe(false)
  })

  it('one module file reaches no route, and it is the recorded one', () => {
    // A RECORDED FINDING, CARRIED RATHER THAN REPAIRED, in both directions.
    // `cc-13/readings.ts` carries the fifty cells of the three-table
    // divergence — the thing this slice exists to disclose — and no page
    // imports it. It is the cc-10-s366 shape recurring: a disclosure that
    // compiles, passes its unit suite, and is on no screen. Reported with
    // the file that owns it; this file edits no source.
    const moduleFiles = sourcesUnder('src/surfaces/cc/modules')
    expect(moduleFiles.length).toBeGreaterThan(40)
    const unreached = moduleFiles.filter((f) => !reached.has(join(ROOT, f)))
    expect(unreached).toEqual(['src/surfaces/cc/modules/cc-13/readings.ts'])
  })

  it('the four declared abstentions still declare themselves, and there are four', () => {
    // FOUR, and they are two different kinds. Two modules claim no route and
    // each gives its reason on its own spine record; two screens are owned by
    // no module and each gives its reason on its own register record. The
    // count is DERIVED from the two populations rather than typed, and each
    // side is asserted in both directions above — a reason without an
    // abstention is as wrong as an abstention without a reason.
    const moduleAbstentions = CC_MODULE_SPINE.filter((m) => m.slug === null)
    const screenAbstentions = CC_SCREENS.filter((s) => s.owningModule === null)
    expect(moduleAbstentions.map((m) => m.id)).toEqual(['MOD-CC-02', 'MOD-CC-13'])
    expect(screenAbstentions.map((s) => s.id)).toEqual(['SCR-CC-01', 'SCR-CC-03'])
    expect(moduleAbstentions.length + screenAbstentions.length).toBe(4)
    for (const m of moduleAbstentions) {
      expect((m.noRouteReason ?? '').length, `${m.id} abstains without a reason`).toBeGreaterThan(80)
    }
    for (const s of screenAbstentions) {
      expect((s.noOwnerReason ?? '').length, `${s.id} abstains without a reason`).toBeGreaterThan(80)
    }
    // And a reason is never left standing on a record that no longer abstains.
    for (const m of CC_MODULE_SPINE) if (m.slug !== null) expect(m.noRouteReason).toBeNull()
    for (const s of CC_SCREENS) if (s.owningModule !== null) expect(s.noOwnerReason).toBeNull()
  })

  it('every surface file outside the modules that reaches no route declares its abstention', () => {
    const outside = sourcesUnder('src/surfaces/cc').filter(
      (f) => !f.startsWith('src/surfaces/cc/modules/'),
    )
    const unreached = outside.filter((f) => !reached.has(join(ROOT, f)))
    // NON-VACUITY: the set is asserted non-empty, so "all of them declare
    // it" cannot be satisfied by there being none.
    expect(unreached.length).toBeGreaterThan(0)
    // A DECLARATION IS A SENTENCE IN THE FILE, not a path in a registry, and
    // it must say the thing rather than merely mention a route.
    const declares = (f: string): boolean =>
      /reaches no route|no route mounts this file|authors no route|imported by no|by no page/i.test(
        read(f),
      )
    const silent = unreached.filter((f) => !declares(f))
    expect(
      silent.sort(),
      'these files are imported by nothing reachable from app/ and carry no sentence saying so; ' +
        'the difference between an abstention and an oversight is that the abstention says so',
    ).toEqual([
      'src/surfaces/cc/access.ts',
      // AND THIS ONE DECLARES THE OPPOSITE. Its header says the rail mounts
      // inside the module screens; the wave-1 ruling is that the control rail
      // under cc-13 is the one that mounts and this module card is not. So
      // the file states a mounting it does not have. Recorded here, not
      // repaired — this file edits no source.
      'src/surfaces/cc/actions/ActionRail.tsx',
      'src/surfaces/cc/seams/source-of-truth.ts',
      'src/surfaces/cc/seams/spine-status.ts',
    ])
  })
})

/* ==================================================================== *
 * GATE 13 — A COUNT STATED IN PROSE, CHECKED AGAINST THE CONSTANT.
 *
 * NOTHING IN THIS BUILD CHECKED THIS SHAPE BEFORE THIS GATE.
 * `locator-fidelity` checks a line number; the closed-vocabulary gate checks
 * an annotation; a number spelled in a comment beside the constant it counts
 * was checked by nobody. Five shipping files said twelve Hub commands where
 * `HUB_COMMAND_TYPES` has fifteen — prose that was correct when it was
 * written at slice 6 and that the vocabulary grew past.
 *
 * THE REGISTRY IS DELIBERATELY SMALL AND EACH ENTRY NAMES A CLOSED
 * VOCABULARY BY ITS OWN NAME. A phrase like "modules" or "rows" is
 * polymorphic — "two Command Center modules" is a true subset claim — and a
 * gate over it would convict something innocent. Each phrase below was
 * measured over the whole tree first: every plural occurrence of it is a
 * claim about the WHOLE set.
 *
 * THE EXPECTED VALUE IS THE LIVE `.length`, never a number typed here, so
 * the gate goes red when the vocabulary grows AND when the prose is stale.
 * ==================================================================== */

const PROSE_COUNTS: readonly { readonly phrase: RegExp; readonly label: string; readonly actual: number }[] =
  [
    { phrase: /operational actions\b/, label: 'operational actions', actual: CC13_ACTIONS.length },
    {
      phrase: /`FB-CC-\*` patterns\b/,
      label: '`FB-CC-*` patterns',
      actual: CC_FALLBACK_PATTERNS.length,
    },
    { phrase: /Hub commands\b/, label: 'Hub commands', actual: HUB_COMMAND_TYPES.length },
    { phrase: /command states\b/, label: 'command states', actual: COMMAND_STATES.length },
  ]

const NUMBER_WORD: Readonly<Record<string, number>> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
}

describe('slice 9 gate 13: a count spelled in prose agrees with the constant it counts', () => {
  it('every whole-set count in the tree names the live length of its vocabulary', () => {
    // A RECORDED FINDING, CARRIED RATHER THAN REPAIRED, in both directions.
    // One file still spells the Hub command set twelve. The wave that fixed
    // five files missed it, which is the argument for the gate rather than
    // the fix.
    const files = [...sourcesUnder('src'), ...sourcesUnder('app')]
    expect(files.length).toBeGreaterThan(300)
    const words = Object.keys(NUMBER_WORD).join('|')

    const stale: string[] = []
    let checked = 0
    for (const entry of PROSE_COUNTS) {
      const pattern = new RegExp(`\\b(${words})\\s+${entry.phrase.source}`, 'gi')
      let occurrences = 0
      for (const f of files) {
        for (const m of read(f).matchAll(pattern)) {
          occurrences += 1
          checked += 1
          if (NUMBER_WORD[m[1]!.toLowerCase()] !== entry.actual) {
            stale.push(`${f}: "${m[1]} ${entry.label}" against ${entry.actual}`)
          }
        }
      }
      // Each entry must actually occur, or the registry is checking nothing.
      expect(occurrences, `no prose in this tree states a count of ${entry.label}`).toBeGreaterThan(0)
    }
    expect(checked).toBeGreaterThan(50)

    expect(stale.sort()).toEqual([
      'app/hub/journey/composition.ts: "twelve Hub commands" against 15',
      'app/hub/journey/composition.ts: "twelve Hub commands" against 15',
    ])
  })

  it('and the vocabularies it counts are the sizes this gate was measured against', () => {
    // Pinned so a vocabulary that grows makes the assertion above move
    // deliberately, rather than the gate quietly re-baselining itself.
    expect(CC13_ACTIONS).toHaveLength(10)
    expect(CC_FALLBACK_PATTERNS).toHaveLength(9)
    expect(HUB_COMMAND_TYPES).toHaveLength(15)
    expect(COMMAND_STATES).toHaveLength(15)
  })
})

/* ==================================================================== *
 * GATE 14 — ALL FIVE REPORT IDENTITIES ARE OPEN.
 *
 * The dispatch said one identity is open. The source heads the whole list
 * with the phrase that makes every one of the five a proposal, and the open
 * item beneath it settles the number and the home and leaves the list to the
 * client. Note the section label the dispatch gave was wrong too: L38259 is
 * in §21.14, not in the §37B register.
 * ==================================================================== */

describe('slice 9 gate 14: all five report identities are open, not one', () => {
  it('the source proposes five and confirms none, and the tree carries that', () => {
    expect(uniqueLineCarrying('**The proposed identities**')).toBe(38_259)
    const proposed: string[] = []
    for (let n = 38_261; n <= 38_265; n += 1) {
      const m = /^(\d)\.\s+(.+)$/.exec(line(n))
      expect(m, `L${n} is not a numbered proposed identity`).not.toBeNull()
      expect(Number(m![1])).toBe(n - 38_260)
      proposed.push(m![2]!)
    }
    expect(proposed).toHaveLength(5)
    expect(line(38_266)).toBe('')
    expect(CC11_DATA_SET_COUNT).toBe(5)
    expect(CC11_DATA_SETS).toHaveLength(5)
    // NONE is confirmed, and the count is computed from the per-set flag so
    // a set silently confirmed changes it.
    expect(CC11_CONFIRMED_IDENTITIES).toBe(0)
    for (const s of CC11_DATA_SETS) expect(s.identityConfirmed).toBe(false)
    // The open item settles the number and the home and leaves the list.
    expect(line(38_267)).toContain('the number, five, and the home, this surface, are settled')
    expect(line(38_267)).toContain("the exact list is the client's to confirm or adjust")
  })
})

/* ==================================================================== *
 * GATE 15 — THE GENERATOR AGREES THAT EVERY MODULE IS ON SCREEN.
 *
 * Mounting is transitive: chrome mounted inside a module mounted inside a
 * route is the shape the status exists for, and a single-hop rule reported
 * `MOD-CC-02` as not-represented for a whole slice. This asserts the
 * transitive answer for all thirteen and the whole-build split beside it.
 * ==================================================================== */

describe('slice 9 gate 15: the generator places all thirteen modules on a screen', () => {
  it('eleven demonstrated, two mounted, none not-represented', () => {
    const registry: readonly {
      readonly id: string
      readonly status: string
      readonly surface: string
    }[] = (
      JSON.parse(readFileSync(join(ROOT, 'registries', 'generated', 'modules.json'), 'utf8')) as {
        readonly rows: readonly {
          readonly id: string
          readonly status: string
          readonly surface: string
        }[]
      }
    ).rows
    expect(registry).toHaveLength(81)
    const cc = registry.filter((m) => m.id.startsWith('MOD-CC-'))
    expect(cc).toHaveLength(13)
    const byStatus = (s: string): string[] => cc.filter((m) => m.status === s).map((m) => m.id)
    expect(byStatus('not-represented')).toEqual([])
    expect(byStatus('mounted-in-another-screen').sort()).toEqual(['MOD-CC-02', 'MOD-CC-13'])
    expect(byStatus('demonstrated-in-storyboard')).toHaveLength(11)
    // The two mounted are exactly the two that claim no slug, so the status
    // is reached from the spine's own abstentions rather than from a list.
    expect(byStatus('mounted-in-another-screen').sort()).toEqual(
      CC_MODULE_SPINE.filter((m) => m.slug === null)
        .map((m) => m.id)
        .sort(),
    )
    // THE BUILD-WIDE SPLIT, WHICH IS WHAT MAKES 'ALL THIRTEEN' A MEASUREMENT
    // RATHER THAN A DEFINITION — AND NOT AS A COUNT.
    //
    // This was `toHaveLength(4)`, and 4 was a stored copy of a derived answer:
    // it went stale the moment slice 10 wave 2 represented MOD-DOH-10 and
    // MOD-DOH-11, exactly as the canon count and `THIS_SLICE` did earlier this
    // session. Renumbering it to 2 reships the same defect with a fresher
    // number, and the intent it was serving never needed a number at all. The
    // build-wide figure is a bystander here; what this gate is about is the
    // thirteen Command Center modules. Two properties instead.
    // THE POSITIVE CONTROL, WHICH IS THE HALF THE COUNT WAS REALLY DOING.
    // `byStatus('not-represented')` above asserts an ABSENCE, and an absence
    // measured over a status nothing in the file carries is vacuous: a
    // generator that stopped emitting this status, or renamed it, leaves that
    // line green while measuring nothing at all. So something, somewhere,
    // still has to carry it. The surfaces are what is asserted rather than the
    // ids, so a failure here names which surface still has absent modules
    // instead of demanding a list somebody has to re-edit.
    //
    // AND NOTHING MORE THAN THAT, DELIBERATELY. A second line asserting that
    // no absent module is a Command Center one would read well and could never
    // fail: `byStatus('not-represented')` and `expect(cc).toHaveLength(13)`
    // both fire before it on every input that would make it red.
    //
    // When the build genuinely represents every module this goes red. That is
    // the moment to delete it, not to edit a number.
    expect(
      registry.filter((m) => m.status === 'not-represented').map((m) => m.surface),
      'no module anywhere is not-represented, so the empty Command Center list above is the ' +
        'generator being silent rather than a measurement. If every module really is represented ' +
        'now, delete this assertion — do not weaken it.',
    ).not.toEqual([])
  })

  it('the reach script agrees with the spine about which screens are authored here', () => {
    const report = JSON.parse(
      execFileSync('node', [join(ROOT, 'scripts', 'cc-reach.mjs'), '--json'], {
        encoding: 'utf8',
      }),
    ) as {
      readonly mapping: readonly {
        readonly screen: string
        readonly owningModule: string | null
        readonly slug: string | null
        readonly authoredHere: boolean
      }[]
      readonly routeDirectories: { readonly onDisk: number; readonly namedByNoRegisterRow: readonly string[] }
    }
    expect(report.mapping).toHaveLength(13)
    expect(report.routeDirectories.onDisk).toBe(12)
    expect(report.routeDirectories.namedByNoRegisterRow).toEqual([])
    const unauthored = report.mapping.filter((m) => !m.authoredHere)
    expect(unauthored.map((m) => m.screen)).toEqual(['SCR-CC-01'])
    expect(unauthored[0]!.slug).toBe('sign-in')
  })
})

/* ==================================================================== *
 * THE PLANT CAMPAIGN, AS RUN.
 *
 * Every assertion above whose subject this build can change was watched go
 * red on a real defect planted into a real shipping file, and every file was
 * restored byte-identically against a sha256 captured ONCE before the first
 * plant. The harness required each anchor to occur exactly once before
 * planting, refused an empty replacement, spliced by index and reversed at
 * the recorded offset rather than by searching, re-checked every baseline
 * before each step, invoked vitest through an args array, and treated a
 * zero-test run as a failure state rather than a green.
 *
 *   G1a   cc-04 row 5's Supervisor cell moved off its line
 *         RED  MOD-CC-04 L36838 column Supervisor: expected 'Allowed' …
 *   G1b   CC03_COLUMNS reversed
 *         RED  MOD-CC-03 declared column order
 *   G1b'  THE SAME REVERSAL RUN AGAINST THE HEADER-KEYED TEST: GREEN, on
 *         purpose. That is the whole argument for running a positional gate
 *         beside a header-keyed one — every value stays under its own key.
 *   G1c   a run-state cell shortened
 *         RED  expected 'Explicitly prohibited' to be 'Explicitly prohibited — audited …'
 *   G1d   a §26.7 token changed from its backticked span
 *         RED  expected 'Allowed' to be 'Read-only'
 *   G1e   a §25.4 cell in cc-13 readings changed
 *         RED  §25.4 L48444 Tenant Admin
 *   G2a   the same cell, against the divergence measure
 *         RED  expected { differOnToken: 32 … } to equal the tree's measure
 *   G2b   `readonly preferred: string` added to a divergence record
 *         RED  expected [ 'src/surfaces/cc/modules/cc-11/matrix.ts' ] to equal []
 *   G3    a screen register locator moved to a different NON-BLANK line
 *         RED  expected 48392 to be 48391
 *   G4    MOD-CC-07's slug changed to one with no directory
 *         RED  learning-read-views is claimed by a module and has no page
 *   G5-A  the one self-naming line wrapped beside another module id
 *         RED  never names MOD-CC-06 on a line whose neighbours name no other
 *   G5-B  the prose-only route file given the id in code
 *         RED  expected [] to equal [ 'live-shift-board' ]
 *   G5-AB BOTH GUARDS AT ONCE — 2 failures, not 1. Redundant protections
 *         cannot be verified one at a time, so each was planted alone first
 *         and each went red while the other stayed green.
 *   G6a   a tenth pattern id minted
 *         RED  expected [ …9 ] to equal the nine derived off the table
 *   G6b   the same mint against the AC-CC-090 measurement
 *         RED  expected 47 to be 48
 *   G7    one pattern made to queue client-side
 *         RED  FB-CC-SESS: expected true to be false
 *   G8    a DEC-TACC-001 card locator moved to another non-blank line
 *         RED  cc-05/readings.ts cites the card at the wrong line
 *   G9a   the rail unmounted from one of the eight
 *         RED  expected 7 members to equal 8
 *   G9b   the rail mounted on a screen L38793 does not name
 *         RED  live-shift-board mounts the action rail and L38793 does not
 *              name its module
 *   G10   a panel rendering an allow lost its client directive
 *         RED  these files render a WriteControl and construct an allow(...)
 *              decision without a 'use client' directive
 *   G11   a client panel given a plain data export
 *         RED  expected [ 'src/surfaces/cc/modules/cc-05/GovernanceGateQueue.tsx' ] to equal []
 *   G12a  the second treatment's only importer broken
 *         RED  expected false to be true
 *   G12b  a second module file dropped off the import graph
 *         RED  expected 2 unreached to equal 1
 *   G12c  an unreached file's abstention sentence removed
 *         RED  expected 4 silent files to equal 3
 *   G13   a prose count of a closed vocabulary made stale
 *         RED  expected 3 stale statements to equal 2
 *   G14   one report identity silently confirmed
 *         RED  expected 1 to be 0
 *   G15   a chrome module given a slug, splitting spine from registry
 *         RED  expected [ 'MOD-CC-02', 'MOD-CC-13' ] to equal [ 'MOD-CC-13' ]
 *
 * THREE ASSERTIONS HERE READ ONLY THE FROZEN SOURCE AND ARE NAMED AS FREEZE
 * ASSERTIONS RATHER THAN LEFT FOR A READER TO DISCOVER: the eighteen table
 * counts and their total; the anchored `SCR-CC-\d+` family and the phantom
 * three-digit members an unanchored pattern manufactures; and the seventeen,
 * five and three Tenant Admin readings. Their subject is read-only input, so
 * the only thing that can turn them red is the source drifting, which is what
 * they are for, and the sha256 asserted at the top is what makes them mean
 * anything.
 * ==================================================================== */
