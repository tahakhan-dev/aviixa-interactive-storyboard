import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { stripComments } from './strip-comments'
import { isForeignProbe as isForeign, ownProbeDir, withPlanted } from '../probe-paths'

import {
  FL_MATRIX_SHAPE,
  FL_TOKEN_TALLY,
  TENANT_ADMIN_OPEN_CELLS,
  INVARIANT_EXCLUDED_ACTS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
  type FrontlineMatrixCell,
  type FrontlineMatrixRow,
  type FrontlineMetElsewhere,
  type FrontlineRowSurface,
  type FrontlineCapabilityExistence,
} from '@/frontline/matrix'
import {
  FL_DESTINATIONS,
  CONTESTED_TOKENS,
  AGREED_TOKENS,
  FL_PLAYER_VIEWS,
  FL_OVERLAY_ON_ANY_DESTINATION,
  S227_ROW_COUNT,
} from '@/frontline/screens'
import { FRONTLINE_MODULE_SPINE, FRONTLINE_CLAIMED_SLUGS } from '@/frontline/modules'
import { frontlineConnectivityTreatment } from '@/frontline/access'
import { CAPTURE_STATE_LABEL, CAPTURE_STATES } from '@/frontline/capture'
import {
  functionalitiesNamingNoPattern,
  type FrontlineFallbackId,
} from '@/frontline/fallbacks'

import { A1_COLUMNS, A1_COLUMN_ROLE, a1RowsFor } from '@/frontline/modules/fl-a1/matrix'
import { A2_COLUMNS, A2_COLUMN_HEADINGS, A2_MATRIX } from '@/frontline/modules/fl-a2/matrix'
import { A3_COLUMNS, A3_COLUMN_HEADINGS, A3_MATRIX } from '@/frontline/modules/fl-a3/matrix'
import { FLA4_COLUMNS, FLA4_MATRIX, fla4Affordance } from '@/frontline/modules/fl-a4/matrix'
import {
  FL_A5_COLUMNS,
  FL_A5_COLUMN_HEADINGS,
  FL_A5_MATRIX,
} from '@/frontline/modules/fl-a5/matrix'
import {
  FL_A6_COLUMNS,
  FL_A6_COLUMN_HEADINGS,
  FL_A6_MATRIX,
} from '@/frontline/modules/fl-a6/matrix'
import { A7_COLUMNS, a7RowsFor } from '@/frontline/modules/fl-a7/matrix'
import {
  FL_B8_COLUMNS,
  FL_B8_COLUMN_HEADINGS,
  FL_B8_MATRIX,
} from '@/frontline/modules/fl-b8/matrix'
import { B9_COLUMNS, B9_COLUMN_HEADINGS, B9_MATRIX } from '@/frontline/modules/fl-b9/matrix'
import {
  FL_B10_COLUMNS,
  FL_B10_COLUMN_HEADINGS,
  FL_B10_MATRIX,
} from '@/frontline/modules/fl-b10/matrix'
import {
  FL_B11_COLUMNS,
  FL_B11_COLUMN_HEADINGS,
  FL_B11_MATRIX,
} from '@/frontline/modules/fl-b11/matrix'
import {
  FL_B12_COLUMNS,
  FL_B12_COLUMN_HEADINGS,
  FL_B12_MATRIX,
} from '@/frontline/modules/fl-b12/matrix'

import { A1_FUNCTIONALITIES } from '@/frontline/modules/fl-a1/service'
import { A2_FUNCTIONALITIES } from '@/frontline/modules/fl-a2/service'
import { A3_FUNCTIONALITIES } from '@/frontline/modules/fl-a3/service'
import { FLA4_FUNCTIONALITIES } from '@/frontline/modules/fl-a4/service'
import { A5_FUNCTIONALITIES, SAFETY_LAYER_OFFLINE } from '@/frontline/modules/fl-a5/service'
import {
  PROPAGATION_IS_NOT_A_DEVICE_TIMELINE,
  STATES_THIS_DEVICE_CANNOT_HOLD,
} from '@/frontline/modules/fl-a5/charter'
import {
  RUN_COMPLETION_STATES,
  theStateThisScreenMayName,
} from '@/frontline/modules/fl-a3/charter'
import { A6_FUNCTIONALITIES, A6_SYNCED_WORD_RECORD } from '@/frontline/modules/fl-a6/service'
import { A7_FUNCTIONALITIES } from '@/frontline/modules/fl-a7/service'
import { B8_FUNCTIONALITIES } from '@/frontline/modules/fl-b8/service'
import { B9_FUNCTIONALITIES } from '@/frontline/modules/fl-b9/service'
import { B10_FUNCTIONALITIES } from '@/frontline/modules/fl-b10/service'
import { B11_FUNCTIONALITIES } from '@/frontline/modules/fl-b11/service'
import { B12_FUNCTIONALITIES } from '@/frontline/modules/fl-b12/service'

/* ==================================================================== *
 * SLICE 7 GATES — SURF-FL, the Frontline Worker Application.
 *
 * Twelve module tasks, six routes, one file that holds the slice's rulings
 * so they cannot quietly stop being true. Every gate below is a finding
 * this slice produced, and most were produced only because something
 * planted a defect and watched what happened.
 *
 * THE STANDARD, and this slice has the worst record in the build against
 * it: FIFTEEN gates written in slice 7 could not fail when first written.
 * The shapes, because each one is a way of writing an assertion that reads
 * correctly and tests nothing:
 *
 *   - a `textContent` sweep beaten by element concatenation ("a timer" and
 *     an adjacent element read back as one word);
 *   - the same sweep beaten by a `hidden` attribute — a statement moved
 *     behind a click still reads out of `textContent`;
 *   - an arity check beaten by a DEFAULTED parameter, which does not count
 *     toward `Function.length`;
 *   - `Allowed` being a PREFIX of `Allowed with conditions`, so a
 *     `startsWith` tally counts one as the other;
 *   - `toEqual([...MY_CONSTANT])`, which is the constant compared to
 *     itself;
 *   - a shared helper used as its own test, whose only firing branch could
 *     not fire;
 *   - a table-shape check satisfied by the separator row, which splits into
 *     the right number of non-empty cells;
 *   - a position check true of BOTH a defect and its own fix.
 *
 * So every gate here reads the FROZEN SOURCE and compares it against what
 * the tree transcribed. Nothing restates a number that appears in a comment
 * somewhere; every count is parsed. And every gate was proved able to fail
 * by planting its defect into a real shipping file, watching it go red, and
 * restoring the file byte-identically.
 *
 * ONE CLASS OF ASSERTION HERE CANNOT BE FAILED BY A CODE CHANGE, and it is
 * named rather than left for a reader to discover. A handful of assertions
 * read ONLY the frozen source — that `AC-FL-010-1` counts six destinations,
 * that `EXCL-FL-06` is classed `Invariant`, that §22.7 has twenty-three rows
 * and §25.5 six, that chapter 22 holds 181 functionalities of which
 * twenty-eight name no pattern. Those are FREEZE assertions: their subject
 * is read-only input, so the only thing that can turn them red is the source
 * drifting, which is exactly what they are for. The sha256 at the top of
 * this file is what makes them meaningful, and each one's line was opened
 * and read before it was written down. Every assertion whose subject is
 * something this build can change has been watched go red on a real plant.
 * ==================================================================== */

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const SOURCE_BYTES = readFileSync(SOURCE)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
const SOURCE_LINES = SOURCE_TEXT.split('\n')

/** One line of the frozen source, 1-indexed, or a throw. Never a blank read. */
function line(n: number): string {
  const text = SOURCE_LINES[n - 1]
  if (text === undefined) throw new Error(`the frozen source has no line ${n}`)
  return text
}

const OWN_PROBE_DIR = ownProbeDir()
const isForeignProbe = (entry: string): boolean => isForeign(entry, OWN_PROBE_DIR)

/* -------------------------------------------------------------------- *
 * PARSING A MATRIX ROW OUT OF THE FROZEN SOURCE.
 *
 * The two traps this parser exists to avoid are both recorded failures of
 * this slice's own gates:
 *
 * 1. THE SEPARATOR ROW SATISFIES A SHAPE CHECK. `|---|---|---|---|---|---|`
 *    splits into six non-empty fields. `MOD-FL-B12`'s table-shape gate
 *    passed with `firstDataLine` moved onto the separator. So `cellsOf`
 *    below refuses a field that is only dashes, and the separator line is
 *    asserted for what it IS rather than merely walked past.
 *
 * 2. `Allowed` IS A PREFIX OF `Allowed with conditions`. `MOD-FL-A5`'s
 *    outcome check counted one as the other. `tokenOf` takes the LONGEST
 *    matching token rather than the first, and gate 1 proves the
 *    distinction is live on this run rather than trusting the ordering of a
 *    literal array.
 * -------------------------------------------------------------------- */

/** Split a markdown table row into its fields, preserving empties. */
function cellsOf(n: number): readonly string[] {
  const raw = line(n)
  if (!raw.startsWith('|') || !raw.trimEnd().endsWith('|')) {
    throw new Error(`L${n} is not a markdown table row: ${JSON.stringify(raw.slice(0, 60))}`)
  }
  return raw
    .trimEnd()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((f) => f.trim())
}

const STATUS_TOKENS: readonly string[] = [
  'Allowed',
  'Allowed with conditions',
  'Read-only',
  'Unavailable',
  'Explicitly prohibited',
  'Not applicable',
  'Client Decision Required',
]

/**
 * The status token a source cell carries. The token is the FIRST backticked
 * span of the field, and it may be the whole span or its opening words —
 * `Not applicable — no execution session` puts the qualifier inside the
 * backticks and `Explicitly prohibited` followed by an em dash puts it
 * outside. Both spellings occur, so the match is on the backticked span's
 * leading words, longest first.
 */
function tokenOf(field: string): string {
  const quoted = /^`([^`]*)`/.exec(field)
  if (quoted === null) throw new Error(`cell does not open with a token: ${JSON.stringify(field)}`)
  const inner = quoted[1]!
  const matches = STATUS_TOKENS.filter(
    (t) => inner === t || inner.startsWith(`${t} `) || inner.startsWith(`${t}—`),
  ).sort((a, b) => b.length - a.length)
  const best = matches[0]
  if (best === undefined) throw new Error(`no status token in ${JSON.stringify(inner)}`)
  return best
}

/** The camelCase outcome each source token maps onto. */
const OUTCOME_OF_TOKEN: Readonly<Record<string, string>> = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Read-only': 'readOnly',
  Unavailable: 'unavailable',
  'Explicitly prohibited': 'explicitlyProhibited',
  'Not applicable': 'notApplicable',
  'Client Decision Required': 'clientDecisionRequired',
}

/** A source cell's own words, backticks removed. What a `note` transcribes. */
const noteOf = (field: string): string => field.replace(/`/g, '')

/**
 * Curly quotation marks folded to their ASCII forms.
 *
 * The frozen source writes `Run's` with a straight apostrophe and one
 * transcription writes it curly. That is a typographic normalisation, not a
 * changed claim, and a gate that reported it as a divergence would bury the
 * twenty-one real ones underneath it. It is counted separately below rather
 * than waved through.
 */
const flattenTypography = (s: string): string =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

/* -------------------------------------------------------------------- *
 * THE TWELVE TRANSCRIPTIONS, WIDENED ONTO ONE SHAPE.
 *
 * Each module names its own row-id and column unions, which is what makes
 * `routedTo` unable to leave its matrix — so twelve matrices are twelve
 * types. `widen` maps each onto one gate-local shape keyed on `string`, and
 * every gate below asks the same question of all twelve rather than twelve
 * questions of one each.
 *
 * `MOD-FL-A1` and `MOD-FL-A7` classify their rows PER VIEWING DESTINATION,
 * so they are read through their own `rowsFor` at the destination each one
 * owns. Everything else exports a classified matrix directly.
 * -------------------------------------------------------------------- */

interface GateRow {
  readonly id: string
  readonly control: string
  readonly surface: FrontlineRowSurface
  readonly existence: FrontlineCapabilityExistence
  readonly metElsewhere: FrontlineMetElsewhere | null
  readonly routedTo: Readonly<Record<string, string>>
  readonly cells: Readonly<Record<string, FrontlineMatrixCell>>
  readonly sourceRef: string
}

function widen<Id extends string, Column extends string>(
  rows: readonly FrontlineMatrixRow<Id, Column>[],
  columns: readonly Column[],
): readonly GateRow[] {
  return rows.map((row) => ({
    id: row.id,
    control: row.control,
    surface: row.surface,
    existence: row.existence,
    metElsewhere: row.metElsewhere,
    routedTo: Object.fromEntries(
      columns.flatMap((c) => {
        const to = row.routedTo[c]
        return to === undefined ? [] : [[c as string, to as string] as const]
      }),
    ),
    cells: Object.fromEntries(columns.map((c) => [c as string, row.cells[c]])),
    sourceRef: row.sourceRef,
  }))
}

interface GateFunctionality {
  readonly id: string
  readonly patterns: readonly string[]
  readonly sourceRef: string
}

interface ModuleUnderGate {
  /** The module identifier, as `FL_MATRIX_SHAPE` spells it. */
  readonly module: string
  /** The file the plant goes into when this module's transcription is under test. */
  readonly matrixFile: string
  readonly columns: readonly string[]
  /**
   * A column's own heading, as the source's header line spells it.
   *
   * THE TWELVE DO NOT AGREE ON WHAT A COLUMN KEY IS, and that is not a
   * defect: `MOD-FL-A1` and `MOD-FL-A7` key on the header words, nine key on
   * a platform `RoleId`, and `MOD-FL-A3` keys on its own camelCase. Each
   * module's OWN heading map is read here rather than one being written for
   * all twelve, so gate 1's column check is a check on each module's map as
   * well as on its cells.
   *
   * `MOD-FL-A4` ships no heading map, so its `RoleId` keys are resolved
   * through `A1_COLUMN_ROLE` READ BACKWARDS — the shipped heading-to-role
   * mapping, not a second one written here.
   */
  readonly heading: Readonly<Record<string, string>>
  readonly rows: readonly GateRow[]
  readonly functionalities: readonly GateFunctionality[]
}

const IDENTITY_HEADINGS = (columns: readonly string[]): Readonly<Record<string, string>> =>
  Object.fromEntries(columns.map((c) => [c, c]))

/** `A1_COLUMN_ROLE` read backwards: the heading each platform role stands in. */
const HEADING_OF_ROLE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(A1_COLUMN_ROLE).map(([heading, role]) => [role, heading]),
)

const MODULES: readonly ModuleUnderGate[] = [
  {
    module: 'MOD-FL-A1',
    matrixFile: join('src', 'frontline', 'modules', 'fl-a1', 'matrix.ts'),
    columns: A1_COLUMNS,
    heading: IDENTITY_HEADINGS(A1_COLUMNS),
    rows: widen(a1RowsFor('sign-in'), A1_COLUMNS),
    functionalities: A1_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-A2',
    matrixFile: join('src', 'frontline', 'modules', 'fl-a2', 'matrix.ts'),
    columns: A2_COLUMNS,
    heading: A2_COLUMN_HEADINGS,
    rows: widen(A2_MATRIX, A2_COLUMNS),
    functionalities: A2_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-A3',
    matrixFile: join('src', 'frontline', 'modules', 'fl-a3', 'matrix.ts'),
    columns: A3_COLUMNS,
    heading: A3_COLUMN_HEADINGS,
    rows: widen(A3_MATRIX, A3_COLUMNS),
    functionalities: A3_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-A4',
    matrixFile: join('src', 'frontline', 'modules', 'fl-a4', 'matrix.ts'),
    columns: FLA4_COLUMNS,
    heading: HEADING_OF_ROLE,
    rows: widen(FLA4_MATRIX, FLA4_COLUMNS),
    functionalities: FLA4_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-A5',
    matrixFile: join('src', 'frontline', 'modules', 'fl-a5', 'matrix.ts'),
    columns: FL_A5_COLUMNS,
    heading: FL_A5_COLUMN_HEADINGS,
    rows: widen(FL_A5_MATRIX, FL_A5_COLUMNS),
    functionalities: A5_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-A6',
    matrixFile: join('src', 'frontline', 'modules', 'fl-a6', 'matrix.ts'),
    columns: FL_A6_COLUMNS,
    heading: FL_A6_COLUMN_HEADINGS,
    rows: widen(FL_A6_MATRIX, FL_A6_COLUMNS),
    functionalities: A6_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-A7',
    matrixFile: join('src', 'frontline', 'modules', 'fl-a7', 'matrix.ts'),
    columns: A7_COLUMNS,
    heading: IDENTITY_HEADINGS(A7_COLUMNS),
    rows: widen(a7RowsFor('profile-lite'), A7_COLUMNS),
    functionalities: A7_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-B8',
    matrixFile: join('src', 'frontline', 'modules', 'fl-b8', 'matrix.ts'),
    columns: FL_B8_COLUMNS,
    heading: FL_B8_COLUMN_HEADINGS,
    rows: widen(FL_B8_MATRIX, FL_B8_COLUMNS),
    functionalities: B8_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-B9',
    matrixFile: join('src', 'frontline', 'modules', 'fl-b9', 'matrix.ts'),
    columns: B9_COLUMNS,
    heading: B9_COLUMN_HEADINGS,
    rows: widen(B9_MATRIX, B9_COLUMNS),
    functionalities: B9_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-B10',
    matrixFile: join('src', 'frontline', 'modules', 'fl-b10', 'matrix.ts'),
    columns: FL_B10_COLUMNS,
    heading: FL_B10_COLUMN_HEADINGS,
    rows: widen(FL_B10_MATRIX, FL_B10_COLUMNS),
    functionalities: B10_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-B11',
    matrixFile: join('src', 'frontline', 'modules', 'fl-b11', 'matrix.ts'),
    columns: FL_B11_COLUMNS,
    heading: FL_B11_COLUMN_HEADINGS,
    rows: widen(FL_B11_MATRIX, FL_B11_COLUMNS),
    functionalities: B11_FUNCTIONALITIES,
  },
  {
    module: 'MOD-FL-B12',
    matrixFile: join('src', 'frontline', 'modules', 'fl-b12', 'matrix.ts'),
    columns: FL_B12_COLUMNS,
    heading: FL_B12_COLUMN_HEADINGS,
    rows: widen(FL_B12_MATRIX, FL_B12_COLUMNS),
    functionalities: B12_FUNCTIONALITIES,
  },
]

/** The shape record for one module, by identifier. Never by position. */
function shapeOf(module: string): (typeof FL_MATRIX_SHAPE)[number] {
  const found = FL_MATRIX_SHAPE.find((s) => s.module === module)
  if (found === undefined) throw new Error(`FL_MATRIX_SHAPE declares no ${module}`)
  return found
}

/** The leading `L<n>` of a `sourceRef`. A7 row 4's ref names three lines. */
function firstLineOf(sourceRef: string): number {
  const m = /^L(\d+)/.exec(sourceRef)
  if (m === null) throw new Error(`sourceRef does not open with a line: ${sourceRef}`)
  return Number(m[1])
}

/* ==================================================================== *
 * THE FREEZE. Every gate below reads the frozen source, so a drifted copy
 * would soften all nine at once rather than fail one.
 * ==================================================================== */

describe('slice 7 gates: the frozen source these gates read', () => {
  it('is the sha256 and the line count this slice was built against', () => {
    expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
    // The file ends in a newline, so the split's last member is the empty
    // tail rather than a line.
    expect(SOURCE_LINES[SOURCE_LINES.length - 1]).toBe('')
    expect(SOURCE_LINES.length - 1).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * GATE 1 — THE CELL ARITHMETIC.
 *
 * 539 status tokens over 539 cells across twelve matrices. Eleven matrices
 * carry five persona columns and `MOD-FL-A7` carries a sixth. Nothing in
 * this gate is restated from a comment: the rows, the columns, the tokens
 * and every cell's own words are parsed out of the frozen source and
 * compared against what the twelve modules transcribed.
 *
 * THE DEFECT IT CATCHES. `MOD-FL-A6` found that a token tally cannot see a
 * cell whose CLAUSE was trimmed — the outcome stays correct and the words
 * change. `MOD-FL-A3`'s first pass wrote a `Not applicable` split of 11 + 3
 * where the source holds 10 + 4. Both are caught here because the
 * comparison is per cell against the source's own field, not per module
 * against a total.
 * ==================================================================== */

interface ParsedCell {
  readonly module: string
  readonly rowLine: number
  readonly column: string
  readonly token: string
  readonly note: string
}

interface ParsedMatrix {
  readonly module: string
  readonly columns: readonly string[]
  readonly rowLines: readonly number[]
  readonly actions: Readonly<Record<number, string>>
  readonly cells: readonly ParsedCell[]
}

function parseMatrix(module: string): ParsedMatrix {
  const shape = shapeOf(module)
  const header = cellsOf(shape.headerLine)
  const separator = cellsOf(shape.separatorLine)
  // The separator is asserted for what it IS. `MOD-FL-B12`'s shape gate
  // passed with a data line moved onto it, because a separator splits into
  // the right number of non-empty fields.
  if (!separator.every((f) => /^-+$/.test(f))) {
    throw new Error(`L${shape.separatorLine} is not a separator row of ${module}`)
  }
  if (separator.length !== header.length) {
    throw new Error(`${module}: separator has ${separator.length} fields, header has ${header.length}`)
  }
  const columns = header.slice(1)
  const rowLines: number[] = []
  const actions: Record<number, string> = {}
  const cells: ParsedCell[] = []
  for (let n = shape.firstDataLine; n <= shape.lastDataLine; n += 1) {
    const fields = cellsOf(n)
    if (fields.length !== header.length) {
      throw new Error(`${module} L${n}: ${fields.length} fields against a ${header.length}-field header`)
    }
    if (fields.some((f) => f === '' || /^-+$/.test(f))) {
      throw new Error(`${module} L${n} carries a blank or separator-shaped field`)
    }
    rowLines.push(n)
    actions[n] = fields[0]!
    columns.forEach((column, i) => {
      const field = fields[i + 1]!
      cells.push({ module, rowLine: n, column, token: tokenOf(field), note: noteOf(field) })
    })
  }
  return { module, columns, rowLines, actions, cells }
}

const PARSED: readonly ParsedMatrix[] = FL_MATRIX_SHAPE.map((s) => parseMatrix(s.module))
const ALL_PARSED_CELLS: readonly ParsedCell[] = PARSED.flatMap((m) => m.cells)

describe('slice 7 gate 1: the cell arithmetic is parsed from the source, never restated', () => {
  it('the parser distinguishes Allowed from Allowed with conditions, both ways round', () => {
    // A5's outcome check could not fail because `Allowed` is a prefix. This
    // is the same question asked of the live parser rather than of a
    // literal array's ordering.
    expect(tokenOf('`Allowed with conditions` — for step-up only')).toBe('Allowed with conditions')
    expect(tokenOf('`Allowed`')).toBe('Allowed')
    expect(tokenOf('`Allowed with conditions`')).toBe('Allowed with conditions')
    expect(tokenOf('`Not applicable — no execution session`')).toBe('Not applicable')
  })

  it('reads twelve matrices, 106 rows and 539 cells out of the frozen source', () => {
    expect(PARSED).toHaveLength(12)
    const rows = PARSED.reduce((n, m) => n + m.rowLines.length, 0)
    const cells = ALL_PARSED_CELLS.length
    // The arithmetic, derived from the parse: eleven five-column matrices
    // and one six-column one.
    const five = PARSED.filter((m) => m.columns.length === 5)
    const six = PARSED.filter((m) => m.columns.length === 6)
    expect(five).toHaveLength(11)
    expect(six).toHaveLength(1)
    expect(six[0]!.module).toBe('MOD-FL-A7')
    expect(six[0]!.columns[5]).toBe('Platform roles')
    const fiveRows = five.reduce((n, m) => n + m.rowLines.length, 0)
    const sixRows = six.reduce((n, m) => n + m.rowLines.length, 0)
    expect(fiveRows * 5 + sixRows * 6).toBe(cells)
    expect(rows).toBe(106)
    expect(cells).toBe(539)
  })

  it('every declared span is exactly as long as the rows it claims', () => {
    for (const shape of FL_MATRIX_SHAPE) {
      const parsed = PARSED.find((m) => m.module === shape.module)!
      expect(parsed.rowLines.length, `${shape.module} row count`).toBe(shape.rows)
      expect(parsed.columns.length, `${shape.module} column count`).toBe(shape.columns)
      expect(shape.lastDataLine - shape.firstDataLine + 1, `${shape.module} span`).toBe(shape.rows)
      expect(shape.separatorLine, `${shape.module} separator`).toBe(shape.headerLine + 1)
      expect(shape.firstDataLine, `${shape.module} first data line`).toBe(shape.separatorLine + 1)
    }
  })

  it('the seven-token tally read off the source is what wave 0 transcribed', () => {
    const tally: Record<string, number> = {}
    for (const cell of ALL_PARSED_CELLS) tally[cell.token] = (tally[cell.token] ?? 0) + 1
    expect(tally).toEqual({ ...FL_TOKEN_TALLY })
    // And the tally really covers the whole population, so an unseen eighth
    // token cannot hide inside a correct sum.
    expect(Object.values(tally).reduce((a, b) => a + b, 0)).toBe(ALL_PARSED_CELLS.length)
    expect(Object.keys(tally).sort()).toEqual([...STATUS_TOKENS].sort())
  })

  it('every one of the 539 cells is matched to its own source field, token and words', () => {
    const seen: string[] = []
    /** Cells whose `note` adds words to the source's own, keyed on the row. */
    const added = new Map<string, { column: string; addition: string }[]>()
    /** Cells that differ only in the shape of a quotation mark. */
    const typography: string[] = []
    for (const module of MODULES) {
      const parsed = PARSED.find((m) => m.module === module.module)!
      expect(module.rows.length, `${module.module} transcribed row count`).toBe(
        parsed.rowLines.length,
      )
      expect(
        module.columns.map((c) => module.heading[c]),
        `${module.module} transcribed columns, through its own heading map`,
      ).toEqual([...parsed.columns])
      module.rows.forEach((row, i) => {
        const rowLine = parsed.rowLines[i]!
        expect(firstLineOf(row.sourceRef), `${module.module} row ${i + 1} sourceRef`).toBe(rowLine)
        expect(row.control, `${module.module} L${rowLine} Action`).toBe(
          noteOf(parsed.actions[rowLine]!),
        )
        for (const column of module.columns) {
          const parsedCell = parsed.cells.find(
            (c) => c.rowLine === rowLine && c.column === module.heading[column],
          )!
          const cell = row.cells[column]!
          expect(cell.outcome, `${module.module} L${rowLine} ${column} outcome`).toBe(
            OUTCOME_OF_TOKEN[parsedCell.token],
          )
          const source = flattenTypography(parsedCell.note)
          const transcribed = flattenTypography(cell.note)
          // EVERY CELL STILL OPENS WITH THE SOURCE'S OWN WORDS. This is the
          // assertion that would fail on a trimmed clause, a reworded cause
          // or a token quietly softened — the failure `MOD-FL-A6` found that
          // a tally cannot see, because trimming a clause leaves the outcome
          // correct.
          expect(
            transcribed.startsWith(source),
            `${module.module} L${rowLine} ${column} does not open with its source cell's own words`,
          ).toBe(true)
          if (transcribed !== source) {
            const key = `${module.module} L${rowLine}`
            added.set(key, [
              ...(added.get(key) ?? []),
              { column, addition: transcribed.slice(source.length) },
            ])
          } else if (cell.note !== parsedCell.note) {
            typography.push(`${module.module} L${rowLine} ${column}`)
          }
          seen.push(`${module.module}|${rowLine}|${column}`)
        }
      })
    }
    expect(new Set(seen).size).toBe(539)
    // THE DIVERGENCE THIS GATE FOUND, AND IT IS A FINDING RATHER THAN A
    // TOLERANCE. `FrontlineMatrixCell.note` is documented as "The cell's own
    // words from the source, verbatim. Never invented, never blank." Two
    // modules add to them: `MOD-FL-A4` states the row's reason inside each of
    // the five cells of four rows that carry a bare token in the source, and
    // `MOD-FL-B8` adds three words to one cell. Twenty-one cells, five rows,
    // two modules. Enumerated with the exact addition so a twenty-second
    // cannot join them unnoticed, and left uncorrected because correcting one
    // module of twelve makes one module right and the set no more consistent.
    const additions = [...added.entries()].map(
      ([row, cells]) => `${row}: ${cells.length} cells add ${JSON.stringify(cells[0]!.addition)}`,
    )
    for (const cells of added.values()) {
      // Every cell of a diverging row adds the SAME words — the addition is
      // the row's reason, not a per-cell invention.
      expect(new Set(cells.map((c) => c.addition)).size).toBe(1)
    }
    expect(additions.sort()).toEqual([
      'MOD-FL-A4 L40724: 5 cells add ". Evidence is immutable from creation, and the prohibition holds for every role on every surface, not only for this one."',
      'MOD-FL-A4 L40726: 5 cells add ". Captured media stays in the application\'s encrypted store and never touches the device gallery, so there is no export path for any role to hold."',
      'MOD-FL-A4 L40729: 5 cells add ". The device\'s classification is the act of record and no role overrides it here; specification gates are hard, always, for every tenant."',
      'MOD-FL-A4 L40730: 5 cells add ". The stamp is disclosed plainly to the worker as part of the record they are creating and it cannot be hidden by configuration."',
      'MOD-FL-B8 L41473: 1 cells add " on this surface"',
    ])
    expect([...added.values()].reduce((n, c) => n + c.length, 0)).toBe(21)
    // And exactly one cell differs only in the shape of an apostrophe, so
    // the typographic case is counted rather than folded into the rest.
    expect(typography).toEqual(['MOD-FL-A4 L40727 WORKER'])
  })
})

/* ==================================================================== *
 * GATE 2 — `Unavailable` IN EXACTLY TWO MATRICES, AND ITS TWO SENSES.
 *
 * `MOD-FL-B12` swept all twelve spans for the token and found it in two:
 * 5 cells in `MOD-FL-B10`, 10 in `MOD-FL-B12`, totalling the surface's 15.
 * Ten of the fifteen sit in one module, split five and five across the
 * token's two OPPOSITE senses — exists and is absent under a stated
 * condition, against exists nowhere for anyone. The senses are separated by
 * `existence` and never by the token, because a token cannot tell them
 * apart: one has a route back at the next sync and the other never will.
 * ==================================================================== */

describe('slice 7 gate 2: Unavailable sits in two matrices and carries two senses', () => {
  const unavailable = ALL_PARSED_CELLS.filter((c) => c.token === 'Unavailable')

  it('appears in exactly two of the twelve matrices, five and ten', () => {
    const byModule = new Map<string, number>()
    for (const c of unavailable) byModule.set(c.module, (byModule.get(c.module) ?? 0) + 1)
    expect([...byModule.entries()].sort()).toEqual([
      ['MOD-FL-B10', 5],
      ['MOD-FL-B12', 10],
    ])
    expect(unavailable).toHaveLength(FL_TOKEN_TALLY['Unavailable']!)
    expect(unavailable).toHaveLength(15)
    // The other ten matrices hold none, said as a positive so an empty
    // parse cannot satisfy it.
    expect(
      PARSED.filter((m) => !m.cells.some((c) => c.token === 'Unavailable')).map((m) => m.module),
    ).toHaveLength(10)
  })

  it('MOD-FL-B12 splits its ten five and five, on existence and never on the token', () => {
    const b12 = MODULES.find((m) => m.module === 'MOD-FL-B12')!
    const cells = b12.rows.flatMap((row) =>
      b12.columns
        .filter((c) => row.cells[c]!.outcome === 'unavailable')
        .map((c) => ({ row, column: c })),
    )
    expect(cells).toHaveLength(10)
    const bySense = new Map<string, number>()
    for (const { row } of cells) bySense.set(row.existence, (bySense.get(row.existence) ?? 0) + 1)
    expect([...bySense.entries()].sort()).toEqual([
      ['absent-under-condition', 5],
      ['not-in-scope', 5],
    ])
    // Both senses carry the SAME token, which is why the token cannot be
    // what separates them.
    for (const { row, column } of cells) {
      expect(tokenOf(`\`${row.cells[column]!.note}\``), `${row.id}/${column}`).toBe('Unavailable')
    }
  })

  it('the two senses draw two different lines, and neither is a control', () => {
    const b12 = MODULES.find((m) => m.module === 'MOD-FL-B12')!
    const drawn = b12.rows.flatMap((row) =>
      b12.columns
        .filter((c) => row.cells[c]!.outcome === 'unavailable')
        .map((c) => frontlineAffordance(row, c)),
    )
    expect(drawn).toHaveLength(10)
    for (const d of drawn) expect(d.kind).toBe('stated-line')
    const lines = drawn.map((d) => (d.kind === 'stated-line' ? d.line : ''))
    const returning = lines.filter((l) => l.includes('It returns when that condition lifts.'))
    const never = lines.filter((l) =>
      l.includes('It exists nowhere for anyone in this scope, so there is nothing to come back to.'),
    )
    expect(returning).toHaveLength(5)
    expect(never).toHaveLength(5)
  })

  it('MOD-FL-B10 holds the other five, and its five are all one sense', () => {
    const b10 = MODULES.find((m) => m.module === 'MOD-FL-B10')!
    const rows = b10.rows.filter((row) =>
      b10.columns.some((c) => row.cells[c]!.outcome === 'unavailable'),
    )
    const cells = rows.flatMap((row) =>
      b10.columns.filter((c) => row.cells[c]!.outcome === 'unavailable'),
    )
    expect(cells).toHaveLength(5)
    expect([...new Set(rows.map((r) => r.existence))]).toEqual(['not-in-scope'])
  })
})

/* ==================================================================== *
 * GATE 3 — THE SIX DESTINATIONS, AND THAT THERE ARE SIX.
 *
 * `AC-FL-010-1` (L40045) counts destinations a worker can stand in.
 * `AC-FL-010-2` (L40046) and `TEST-FL-010-2` (L40056) say capture,
 * coaching, deviation, handover and sign-off are states of the Run Player
 * and not reachable independently. `src/frontline/modules.ts` declares
 * which module claims which route, and six of the twelve claim nothing —
 * five because a panel is a state of a route rather than a route, and
 * `MOD-FL-A1` because its route's directory basename exists twice across
 * the surfaces and the registry generator refuses a claim it cannot
 * resolve.
 * ==================================================================== */

describe('slice 7 gate 3: six destinations, and the five states that are not a seventh', () => {
  it('the criteria say what this gate says they say', () => {
    const ac1 = line(40045)
    expect(ac1).toContain('`AC-FL-010-1`')
    expect(ac1).toContain('exactly six destinations and no seventh')
    const ac2 = line(40046)
    expect(ac2).toContain('`AC-FL-010-2`')
    expect(ac2).toContain('are not reachable as independent destinations')
    const test2 = line(40056)
    expect(test2).toContain('`TEST-FL-010-2`')
    expect(test2).toContain('unreachable except through the player')
    for (const state of ['coaching', 'handover', 'sign-off']) {
      expect(ac2, `AC-FL-010-2 names ${state}`).toContain(state)
      expect(test2, `TEST-FL-010-2 names ${state}`).toContain(state)
    }
  })

  it('six destinations are declared, six routes exist, and the two sets are the same', () => {
    expect(FL_DESTINATIONS).toHaveLength(6)
    const declared = [...FL_DESTINATIONS.map((d) => d.slug)].sort()
    const built = readdirSync(join(ROOT, 'app', 'frontline'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
      .sort()
    expect(built).toEqual(declared)
  })

  it('the spine claims five slugs, each a declared destination, and no two the same', () => {
    expect(FRONTLINE_MODULE_SPINE).toHaveLength(12)
    const claimed = FRONTLINE_MODULE_SPINE.filter((m) => m.slug !== null)
    expect([...FRONTLINE_CLAIMED_SLUGS].sort()).toEqual([...claimed.map((m) => m.slug!)].sort())
    // FIVE CLAIMS FOR SIX DESTINATIONS, and the sixth is not an omission.
    // A slug is declared only to break a genuine tie between two modules on
    // one route; `sign-in` names `MOD-FL-A1` and no other module, so the
    // registry generator's argmax awards it without a claim — and a claim
    // would be ambiguous anyway, because the directory basename `sign-in`
    // exists on two surfaces.
    expect(claimed).toHaveLength(5)
    expect(new Set(claimed.map((m) => m.slug)).size).toBe(claimed.length)
    for (const slug of claimed.map((m) => m.slug!)) {
      expect(declaredSlugs(), `${slug} is not a declared destination`).toContain(slug)
    }
    const unclaimed = FL_DESTINATIONS.filter(
      (d) => !claimed.some((m) => m.slug === d.slug),
    ).map((d) => d.slug)
    expect(unclaimed).toEqual(['sign-in'])
  })

  it('every module claiming no route states a reason, and never a placeholder', () => {
    const silent = FRONTLINE_MODULE_SPINE.filter((m) => m.slug === null)
    expect(silent).toHaveLength(7)
    for (const m of silent) {
      expect(m.noRouteReason, `${m.id} claims no route and gives no reason`).not.toBeNull()
      expect(m.noRouteReason!.length, `${m.id} reason is a placeholder`).toBeGreaterThan(60)
    }
    for (const m of FRONTLINE_MODULE_SPINE.filter((x) => x.slug !== null)) {
      expect(m.noRouteReason, `${m.id} claims a route AND gives a no-route reason`).toBeNull()
    }
  })

  it('the five Run Player states are panels of one route, not five more routes', () => {
    // §22.7's own register: twenty-three rows, six of which are the
    // destinations and seventeen of which are views of one.
    expect(S227_ROW_COUNT).toBe(23)
    expect(FL_PLAYER_VIEWS).toHaveLength(17)
    expect(FL_OVERLAY_ON_ANY_DESTINATION.placement).toBe('overlay')
    const runPlayerViews = FL_PLAYER_VIEWS.filter((v) => v.placement === 'run-player')
    expect(runPlayerViews.length).toBeGreaterThanOrEqual(5)
    // None of the seventeen is a route directory.
    const built = readdirSync(join(ROOT, 'app', 'frontline'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .map((e) => e.name)
    expect(built).toHaveLength(6)
  })
})

const declaredSlugs = (): readonly string[] => FL_DESTINATIONS.map((d) => d.slug)

/* ==================================================================== *
 * GATE 4 — THE `SCR-FL-*` NAMESPACE IS ASSIGNED TWICE.
 *
 * Two tables in the frozen source both call themselves the screen register
 * for this surface. §22.7 lists twenty-three rows at L39863-L39885; §25.5
 * lists six at L48529-L48534. They share the tokens `SCR-FL-01` to
 * `SCR-FL-06` and FIVE OF THE SIX name a different screen in each table.
 * Neither mentions the other and no `DEC-*` identifier is attached.
 *
 * So routes are keyed on NAMES, never on identifiers. That is not a
 * convention: `app/frontline/run-player/page.tsx` spelled `SCR-FL-03` as a
 * literal and a unit gate refused it.
 * ==================================================================== */

describe('slice 7 gate 4: the SCR-FL namespace is contested, and routes are keyed on names', () => {
  /** §22.7's own rows, parsed. Identifier, screen-or-view, destination, module. */
  const registerB = Array.from({ length: 39885 - 39863 + 1 }, (_, i) => {
    const n = 39863 + i
    const fields = cellsOf(n)
    return { line: n, token: fields[0]!.replace(/`/g, ''), name: fields[1]!, destination: fields[2]! }
  })

  /** §25.5's own rows, parsed. */
  const registerA = Array.from({ length: 48534 - 48529 + 1 }, (_, i) => {
    const n = 48529 + i
    const fields = cellsOf(n)
    return { line: n, token: fields[0]!.replace(/`/g, ''), name: fields[1]! }
  })

  it('both registers are read, and they are twenty-three rows against six', () => {
    expect(registerB).toHaveLength(23)
    expect(registerA).toHaveLength(6)
    expect(new Set(registerB.map((r) => r.token)).size).toBe(23)
    expect(new Set(registerA.map((r) => r.token)).size).toBe(6)
    expect(registerA.map((r) => r.token)).toEqual([
      'SCR-FL-01',
      'SCR-FL-02',
      'SCR-FL-03',
      'SCR-FL-04',
      'SCR-FL-05',
      'SCR-FL-06',
    ])
  })

  it('the six shared tokens name a different screen five times out of six', () => {
    const shared = registerA.map((a) => {
      const b = registerB.find((x) => x.token === a.token)!
      return { token: a.token, a: a.name, b: b.name, aLine: a.line, bLine: b.line }
    })
    expect(shared).toHaveLength(6)
    // The disagreement is a judgement, not a string comparison: `SCR-FL-01`
    // reads "Login" in one and "Login, adapting to device mode" in the
    // other, which is two wordings of one screen. So the count is taken
    // from the build's own reading and each reading is checked back against
    // the line it cites.
    expect(CONTESTED_TOKENS).toHaveLength(5)
    expect(AGREED_TOKENS).toHaveLength(1)
    expect(AGREED_TOKENS[0]!.token).toBe('SCR-FL-01')
    for (const destination of FL_DESTINATIONS) {
      const c = destination.contested
      const a = shared.find((s) => s.token === c.token)!
      expect(c.registerA, `${c.token} §25.5 reading`).toBe(a.a)
      expect(c.registerB, `${c.token} §22.7 reading`).toBe(a.b)
      expect(c.registerARef, `${c.token} §25.5 locator`).toBe(`L${a.aLine}`)
      expect(c.registerBRef, `${c.token} §22.7 locator`).toBe(`L${a.bLine}`)
      // And the disagreement is real on the tokens that claim one: the two
      // names are different strings on all five.
      if (!c.agreement.agree) expect(c.registerA).not.toBe(c.registerB)
    }
    // AND THE STRING COMPARISON GIVES A DIFFERENT ANSWER, which is the
    // whole reason `ScreenTokenAgreement` carries a reason instead of a
    // boolean. All SIX tokens read a different string in the two registers;
    // only FIVE name a different screen. `SCR-FL-01` is "Login" against
    // "Login, adapting to device mode" — two wordings of one screen. A gate
    // that counted strings would report six contested tokens and be wrong
    // about the one that matters.
    expect(shared.filter((s) => s.a !== s.b)).toHaveLength(6)
    const agreed = shared.find((s) => s.token === AGREED_TOKENS[0]!.token)!
    expect(agreed.a).not.toBe(agreed.b)
    expect(agreed.b.startsWith(agreed.a)).toBe(true)
    expect(AGREED_TOKENS[0]!.agreement.agree).toBe(true)
    expect(
      AGREED_TOKENS[0]!.agreement.agree ? AGREED_TOKENS[0]!.agreement.why.length : 0,
    ).toBeGreaterThan(60)
  })

  it('no shipped Frontline route file spells a SCR-FL identifier', () => {
    const offenders = frontlineAppSources()
      .filter(({ src }) => /SCR-FL-\d/.test(stripComments(src)))
      .map(({ file }) => file)
    expect(
      offenders,
      'routes on this surface are keyed on names, never on identifiers: the SCR-FL-* ' +
        'namespace is assigned twice in the source to different screens',
    ).toEqual([])
    // Non-vacuity: the scan reaches real files with real content.
    expect(frontlineAppSources().length).toBeGreaterThan(6)
  })
})

/** Every authored file under `app/frontline`, one level of nesting deep. */
function frontlineAppSources(): readonly { file: string; src: string }[] {
  const root = join(ROOT, 'app', 'frontline')
  const out: { file: string; src: string }[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (isForeignProbe(entry.name)) continue
    if (entry.isDirectory()) {
      for (const child of readdirSync(join(root, entry.name), { withFileTypes: true })) {
        if (isForeignProbe(child.name) || child.isDirectory()) continue
        if (!/\.tsx?$/.test(child.name)) continue
        const file = join('app', 'frontline', entry.name, child.name)
        out.push({ file, src: readFileSync(join(ROOT, file), 'utf8') })
      }
    } else if (/\.tsx?$/.test(entry.name)) {
      const file = join('app', 'frontline', entry.name)
      out.push({ file, src: readFileSync(join(ROOT, file), 'utf8') })
    }
  }
  return out
}

/* ==================================================================== *
 * GATE 5 — ELEVEN `Client Decision Required` CELLS, TEN AND ONE.
 *
 * All eleven sit in the Tenant Admin column. TEN defer to the Tenant Admin
 * device-session question, which `AC-FL-009-5` (L39948) forbids resolving
 * in either direction. ONE does not: L41300's cell argues in its own words
 * that the Statement of Work places device wipe and de-authorisation in the
 * platform critical class. `src/frontline/matrix.ts` types that distinction
 * as `defersTo`, because a comment saying "all eleven" was inherited as the
 * reason for the eleventh for two waves.
 * ==================================================================== */

describe('slice 7 gate 5: eleven open cells, ten questions and one other question', () => {
  const cdr = ALL_PARSED_CELLS.filter((c) => c.token === 'Client Decision Required')

  it('there are eleven, and every one is in the Tenant Admin column', () => {
    expect(cdr).toHaveLength(11)
    expect(cdr).toHaveLength(FL_TOKEN_TALLY['Client Decision Required']!)
    expect([...new Set(cdr.map((c) => c.column))]).toEqual(['Tenant Admin'])
  })

  it('the eleven lines are exactly the eleven wave 0 records', () => {
    expect([...new Set(cdr.map((c) => `L${c.rowLine}`))].sort()).toEqual(
      [...TENANT_ADMIN_OPEN_CELLS.map((c) => c.sourceRef)].sort(),
    )
    for (const record of TENANT_ADMIN_OPEN_CELLS) {
      const cell = cdr.find((c) => `L${c.rowLine}` === record.sourceRef)!
      expect(cell.module, `${record.sourceRef} module`).toBe(record.module)
    }
  })

  it('exactly one defers to the platform critical class, and it argues for itself', () => {
    const platform = TENANT_ADMIN_OPEN_CELLS.filter(
      (c) => c.defersTo === 'platform-critical-class',
    )
    expect(platform).toHaveLength(1)
    expect(platform[0]!.sourceRef).toBe('L41300')
    // Its own words, at its own line — this is the whole reason it is not
    // the device-session question.
    const cell = cdr.find((c) => c.rowLine === 41300)!
    expect(cell.note).toContain('platform critical class')
    expect(cell.note).not.toContain('device session')
  })

  it('the other ten give the absence, never the argument', () => {
    const session = TENANT_ADMIN_OPEN_CELLS.filter(
      (c) => c.defersTo === 'tenant-admin-device-session',
    )
    expect(session).toHaveLength(10)
    for (const record of session) {
      const cell = cdr.find((c) => `L${c.rowLine}` === record.sourceRef)!
      expect(cell.note, `${record.sourceRef} inherits the eleventh's reason`).not.toContain(
        'platform critical class',
      )
    }
  })

  it('AC-FL-009-5 forbids resolving it, and no cell resolves it', () => {
    const ac = line(39948)
    expect(ac).toContain('`AC-FL-009-5`')
    expect(ac).toContain('open item')
    expect(ac).toContain('not silently resolved in either direction')
    // A resolution would show up as the token changing: every one of the
    // eleven still reads `Client Decision Required` in the transcription.
    for (const record of TENANT_ADMIN_OPEN_CELLS) {
      const module = MODULES.find((m) => m.module === record.module)!
      const row = module.rows.find(
        (r) => firstLineOf(r.sourceRef) === firstLineOf(record.sourceRef),
      )!
      const column = module.columns.find((c) => module.heading[c] === 'Tenant Admin')!
      expect(row.cells[column]!.outcome, `${record.module} ${record.sourceRef}`).toBe(
        'clientDecisionRequired',
      )
      // Disclosed, not answered: the cell names the decision it defers to.
      expect(row.cells[column]!.openDecision, `${record.sourceRef} discloses nothing`).not.toBeNull()
    }
  })
})

/* ==================================================================== *
 * GATE 6 — THE INVARIANT-EXCLUDED ACTS AND THE SHARED GUARD.
 *
 * `EXCL-FL-06` (L39489) makes worker-initiated Run cancellation and
 * terminal completion INVARIANT exclusions, so a control for one is a
 * broken guarantee rather than a misplaced button. Three modules meet those
 * acts independently and one catching it does not protect the other two,
 * which is why the guard is shared.
 *
 * READ `controlsOnActsHeldElsewhere`'s COMMENT. Its second loop was
 * UNREACHABLE BY CONSTRUCTION until `MOD-FL-B11` planted a misclassified
 * row and watched it stay green: it started from the classification it was
 * meant to doubt, and `frontlineAffordance` answers `another-surface` and
 * `another-destination` before the token, so the body could never run. The
 * repaired guard starts from the cell's own words. This gate holds BOTH
 * branches live — the invariant-act branch and the cell-words branch — with
 * a positive control for each, because a guard that returns an empty list
 * is indistinguishable from a guard that cannot speak.
 * ==================================================================== */

describe('slice 7 gate 6: the invariant-excluded acts, and a guard that can still fire', () => {
  it('EXCL-FL-06 is an Invariant exclusion and says where the acts live instead', () => {
    const fields = cellsOf(39489)
    expect(fields[0]).toContain('`EXCL-FL-06`')
    expect(fields[1]).toBe('Worker-initiated Run cancellation or terminal completion')
    expect(fields[3]).toBe('Delivery Operations Hub')
    expect(fields[4]).toBe('Invariant')
  })

  it('the three excluded acts are met by three different modules, each off-surface', () => {
    const acts = new Set<string>(INVARIANT_EXCLUDED_ACTS.map((a) => a.act))
    expect(acts.size).toBe(3)
    const bearing = MODULES.flatMap((m) =>
      m.rows.filter((r) => acts.has(r.control)).map((r) => ({ module: m.module, row: r })),
    )
    // Four rows across three modules — `Cancel a Run` is met twice.
    expect(bearing.map((b) => b.module).sort()).toEqual([
      'MOD-FL-A2',
      'MOD-FL-A3',
      'MOD-FL-B11',
      'MOD-FL-B11',
    ])
    expect(new Set(bearing.map((b) => b.module)).size).toBe(3)
    for (const { module, row } of bearing) {
      expect(row.surface, `${module} ${row.id} classification`).toBe('another-surface')
      const met = row.metElsewhere
      expect(met, `${module} ${row.id} names nowhere`).not.toBeNull()
      expect(met!.where).toBe('another-surface')
    }
  })

  it('no matrix in the slice draws a control for an act the source holds elsewhere', () => {
    for (const module of MODULES) {
      const resolver = module.module === 'MOD-FL-A4' ? a4Placement : undefined
      expect(
        controlsOnActsHeldElsewhere(module.rows, module.columns, resolver),
        `${module.module} draws a control for an act held elsewhere`,
      ).toEqual([])
    }
  })

  it('the invariant-act branch fires: an excluded act classified `screen` is reported', () => {
    const a3 = MODULES.find((m) => m.module === 'MOD-FL-A3')!
    const excluded = a3.rows.find((r) => r.control === 'Terminally complete or cancel the Run')!
    const misclassified: GateRow = { ...excluded, surface: 'screen', metElsewhere: null }
    const offenders = controlsOnActsHeldElsewhere([misclassified], a3.columns)
    expect(offenders.join(' ')).toContain('EXCL-FL-06 invariant exclusion')
    expect(offenders.join(' ')).toContain('`screen`')
  })

  it('the cell-words branch fires: B11 row 7 as `screen` is what the old loop could not see', () => {
    // The exact plant `MOD-FL-B11` used. `Initiate a mid-Run substitution`
    // is NOT one of the three invariant acts, so the first branch is silent
    // on it — which is why the old guard stayed green while the panel drew
    // two Delivery Operations Hub controls.
    const b11 = MODULES.find((m) => m.module === 'MOD-FL-B11')!
    const row = b11.rows.find((r) => r.control === 'Initiate a mid-Run substitution')!
    expect(new Set<string>(INVARIANT_EXCLUDED_ACTS.map((a) => a.act)).has(row.control)).toBe(
      false,
    )
    const misclassified: GateRow = { ...row, surface: 'screen', metElsewhere: null }
    const offenders = controlsOnActsHeldElsewhere([misclassified], b11.columns)
    expect(offenders.length).toBeGreaterThan(0)
    expect(offenders.join(' ')).toContain('Delivery Operations Hub')
    expect(offenders.join(' ')).toContain(row.id)
    // And the same row, correctly classified, is silent — so the branch is
    // reporting the defect and not the row.
    expect(controlsOnActsHeldElsewhere([row], b11.columns)).toEqual([])
  })

  it('MOD-FL-A4 passes its own per-column resolver, and the resolver is not doing all the work', () => {
    const a4 = MODULES.find((m) => m.module === 'MOD-FL-A4')!
    expect(controlsOnActsHeldElsewhere(a4.rows, a4.columns, a4Placement)).toEqual([])
    const withoutResolver = controlsOnActsHeldElsewhere(a4.rows, a4.columns)
    expect(withoutResolver).toHaveLength(1)
    expect(withoutResolver[0]).toContain('Client Command Center')
  })
})

/**
 * `MOD-FL-A4`'s own per-column placement, expressed through its own
 * projection rather than re-derived here. Row 6's cells go to two different
 * surfaces and the Worker's stays on this screen; the shared row type holds
 * one `metElsewhere` for the whole row, so the module folds through
 * `fla4Affordance` and the guard is handed the same answer.
 */
const a4Placement = (
  row: FrontlineMatrixRow<string, string>,
  column: string,
): 'this-screen' | 'elsewhere' => {
  const own = FLA4_MATRIX.find((r) => r.id === row.id)
  if (own === undefined) return 'this-screen'
  const drawn = fla4Affordance(own, column as (typeof FLA4_COLUMNS)[number])
  return drawn.kind === 'control' ? 'this-screen' : 'elsewhere'
}

/* ==================================================================== *
 * GATE 7 — TWENTY-EIGHT `AC-FL-011-1` SOURCE-SIDE GAPS, NONE FILLED.
 *
 * `AC-FL-011-1` (L40151) asks every functionality in the chapter to name at
 * least one `FB-FL-*` pattern. Twenty-eight of the 181 name none, each on a
 * ground the source itself states — "an excluded capability has no failure
 * mode", "a non-configurable invariant has no fallback; its violation is a
 * defect".
 *
 * NONE IS FILLED AND NONE MAY BE. An assigned pattern is indistinguishable
 * from a real one forever afterwards, and the criterion then reads clean
 * because nobody looked. So this gate asserts the gaps are still REPORTED
 * rather than closed: the source's twenty-eight are computed here, and each
 * one's transcription still names no pattern.
 * ==================================================================== */

interface SourceFunctionality {
  readonly module: string
  readonly id: string
  readonly line: number
  readonly fallbackClause: string
  readonly patterns: readonly string[]
}

const FL_PATTERN = /FB-FL-[A-Z0-9]+-\d+/g

/**
 * The labels that can follow the Fallback field on one of these lines,
 * surveyed off the source rather than guessed. The clause ends at the first
 * of them.
 *
 * THE FIELD BOUNDARY IS LOAD-BEARING. Reading `Fallback:` to the end of the
 * line pulls in whatever field comes next, and the next field is often an
 * `Open item:` naming a decision — so a scan for decisions "attached to the
 * fallback" returns thirteen identifiers where the fallback clauses hold
 * six. That is the same defect `contract-gates` was narrowed for: a scan
 * that reads past its own field.
 */
const FALLBACK_FIELD_END =
  /(?:^|\s)(?:Classification|Decision owner|Difference|Open dependency|Open items?|Open value):\s/

/**
 * Every `FUNC-*` line of chapter 22 with its Fallback clause.
 *
 * THE PATTERN MATCH DOES NOT REQUIRE BACKTICKS, and that is measured rather
 * than stylistic. Three clauses name a pattern inside a backticked
 * `Not applicable — …` span, so a backtick-anchored regex reads them as
 * gaps and returns thirty-one where the source holds twenty-eight.
 */
function sourceFunctionalities(): readonly SourceFunctionality[] {
  const modules = new Set(FL_MATRIX_SHAPE.map((s) => s.module.replace('MOD-FL-', '')))
  const out: SourceFunctionality[] = []
  for (let n = 39_800; n <= 42_300; n += 1) {
    const text = line(n)
    const m = /`FUNC-([A-Z0-9]+)-[\d-]+`/.exec(text)
    if (m === null || !modules.has(m[1]!)) continue
    const id = /`(FUNC-[A-Z0-9-]+)`/.exec(text)![1]!
    const clause = /Fallback:\s*(.*)$/.exec(text)
    if (clause === null) {
      out.push({ module: `MOD-FL-${m[1]!}`, id, line: n, fallbackClause: '', patterns: [] })
      continue
    }
    const end = FALLBACK_FIELD_END.exec(clause[1]!)
    const field = end === null ? clause[1]! : clause[1]!.slice(0, end.index)
    out.push({
      module: `MOD-FL-${m[1]!}`,
      id,
      line: n,
      fallbackClause: field,
      patterns: [...new Set(field.match(FL_PATTERN) ?? [])],
    })
  }
  return out
}

const SOURCE_FUNCTIONALITIES = sourceFunctionalities()
const SOURCE_GAPS = SOURCE_FUNCTIONALITIES.filter((f) => f.patterns.length === 0)

describe('slice 7 gate 7: the source-side fallback gaps are reported, never filled', () => {
  it('AC-FL-011-1 asks what this gate measures against', () => {
    const ac = line(40151)
    expect(ac).toContain('`AC-FL-011-1`')
    expect(ac).toContain('names at least one `FB-FL-*` pattern')
  })

  it('chapter 22 holds 181 functionalities across the twelve modules', () => {
    expect(SOURCE_FUNCTIONALITIES).toHaveLength(181)
    expect(new Set(SOURCE_FUNCTIONALITIES.map((f) => f.module)).size).toBe(12)
  })

  it('twenty-eight of them name no pattern, each on a ground the source states', () => {
    expect(SOURCE_GAPS).toHaveLength(28)
    for (const gap of SOURCE_GAPS) {
      expect(gap.fallbackClause, `${gap.id} L${gap.line} has no Fallback field at all`).not.toBe('')
      expect(
        gap.fallbackClause.replace(/`/g, '').trimStart(),
        `${gap.id} L${gap.line} declines without a ground`,
      ).toMatch(/^Not applicable\s+—/)
    }
    // Not concentrated in one module, which is what a transcription slip
    // would look like.
    expect(new Set(SOURCE_GAPS.map((g) => g.module)).size).toBeGreaterThan(8)
  })

  it('the shared reporter is what names them, and it can see a gap', () => {
    // Wave 0's own reporter, run over the source's own reading, returns the
    // twenty-eight. Handed a filled list it returns none — so an empty
    // result is a measurement and not a silence.
    const reported = functionalitiesNamingNoPattern(
      SOURCE_FUNCTIONALITIES.map((f) => ({
        id: f.id,
        patterns: f.patterns as readonly FrontlineFallbackId[],
      })),
    )
    expect([...reported].sort()).toEqual(SOURCE_GAPS.map((g) => g.id).sort())
    expect(
      functionalitiesNamingNoPattern(
        SOURCE_FUNCTIONALITIES.map((f) => ({ id: f.id, patterns: ['FB-FL-CORE-01'] as const })),
      ),
    ).toEqual([])
  })

  it('every gap is still a gap in the module that transcribed it', () => {
    const byModule = new Map(MODULES.map((m) => [m.module, m]))
    for (const gap of SOURCE_GAPS) {
      const module = byModule.get(gap.module)!
      const transcribed = module.functionalities.find((f) => f.id === gap.id)
      expect(transcribed, `${gap.module} does not transcribe ${gap.id} (L${gap.line})`).toBeDefined()
      expect(
        transcribed!.patterns,
        `${gap.id} (L${gap.line}) is a source-side AC-FL-011-1 gap and has been FILLED. ` +
          'An assigned pattern is indistinguishable from a real one forever afterwards.',
      ).toEqual([])
    }
  })

  it('and every functionality the source DOES answer is answered in the transcription', () => {
    const byModule = new Map(MODULES.map((m) => [m.module, m]))
    const answered = SOURCE_FUNCTIONALITIES.filter((f) => f.patterns.length > 0)
    expect(answered).toHaveLength(181 - 28)
    let checked = 0
    for (const f of answered) {
      const module = byModule.get(f.module)!
      const transcribed = module.functionalities.find((t) => t.id === f.id)
      if (transcribed === undefined) continue
      expect(
        transcribed.patterns.length,
        `${f.id} (L${f.line}) names ${f.patterns.join(', ')} in the source and none here`,
      ).toBeGreaterThan(0)
      checked += 1
    }
    // Non-vacuity: the join really reaches the transcriptions.
    expect(checked).toBeGreaterThan(120)
  })
})

/* ==================================================================== *
 * GATE 8 — THE THREE-WAY FALLBACK-SET SPLIT, ON ALL TWELVE.
 *
 * §22.9's pattern-to-module map, the module card's own Fallback-identifier
 * line, and the module's functionality clauses give three different
 * readings of which patterns a module has. Measured on four modules in wave
 * 1 and on every module since, it is a property of the source rather than
 * of any one transcription — and NO `DEC-*` identifier is attached to the
 * disagreement anywhere: not on the map's fourteen rows, not on any of the
 * twelve card lines.
 *
 * So all three readings are carried and none is reconciled. This gate
 * computes all three out of the frozen source and asserts the split still
 * stands on all twelve.
 * ==================================================================== */

const MAP_HEADER_LINE = 40_128
const MAP_FIRST_ROW = 40_130
const MAP_LAST_ROW = 40_143

/** Each module's own `**Fallback identifier.**` card line, in module order. */
const CARD_LINES: Readonly<Record<string, number>> = {
  'MOD-FL-A1': 40_250,
  'MOD-FL-A2': 40_419,
  'MOD-FL-A3': 40_592,
  'MOD-FL-A4': 40_785,
  'MOD-FL-A5': 40_975,
  'MOD-FL-A6': 41_154,
  'MOD-FL-A7': 41_351,
  'MOD-FL-B8': 41_523,
  'MOD-FL-B9': 41_680,
  'MOD-FL-B10': 41_846,
  'MOD-FL-B11': 42_007,
  'MOD-FL-B12': 42_167,
}

function mapReading(): Readonly<Record<string, readonly string[]>> {
  const byModule: Record<string, string[]> = {}
  for (const shape of FL_MATRIX_SHAPE) byModule[shape.module] = []
  for (let n = MAP_FIRST_ROW; n <= MAP_LAST_ROW; n += 1) {
    const fields = cellsOf(n)
    const pattern = /`(FB-FL-[A-Z0-9]+-\d+)`/.exec(fields[0]!)![1]!
    for (const m of fields[1]!.matchAll(/`(MOD-FL-[A-Z0-9]+)`/g)) byModule[m[1]!]!.push(pattern)
  }
  return byModule
}

describe('slice 7 gate 8: three readings of every module’s fallback set, none reconciled', () => {
  const map = mapReading()

  it('the map is the fourteen-pattern table it claims to be', () => {
    const header = cellsOf(MAP_HEADER_LINE)
    expect(header).toEqual(['Pattern', 'Primary modules referencing it'])
    expect(cellsOf(MAP_HEADER_LINE + 1).every((f) => /^-+$/.test(f))).toBe(true)
    expect(MAP_LAST_ROW - MAP_FIRST_ROW + 1).toBe(14)
    const patterns = Array.from({ length: 14 }, (_, i) =>
      /`(FB-FL-[A-Z0-9]+-\d+)`/.exec(cellsOf(MAP_FIRST_ROW + i)[0]!)![1]!,
    )
    expect(new Set(patterns).size).toBe(14)
  })

  it('every module card carries a Fallback identifier line, at the line named here', () => {
    for (const [module, n] of Object.entries(CARD_LINES)) {
      expect(line(n), `${module} card line`).toContain('**Fallback identifier.**')
      expect((line(n).match(FL_PATTERN) ?? []).length, `${module} card names no pattern`)
        .toBeGreaterThan(0)
    }
    expect(Object.keys(CARD_LINES)).toHaveLength(12)
    expect(new Set(Object.values(CARD_LINES)).size).toBe(12)
  })

  it('the three readings disagree on every one of the twelve modules', () => {
    const rows: string[] = []
    for (const shape of FL_MATRIX_SHAPE) {
      const fromMap = new Set(map[shape.module]!)
      const fromCard = new Set(line(CARD_LINES[shape.module]!).match(FL_PATTERN) ?? [])
      const fromFunctionalities = new Set(
        SOURCE_FUNCTIONALITIES.filter((f) => f.module === shape.module).flatMap((f) => f.patterns),
      )
      const key = (s: ReadonlySet<string>) => [...s].sort().join(',')
      rows.push(`${shape.module} ${fromMap.size}/${fromCard.size}/${fromFunctionalities.size}`)
      expect(fromMap.size, `${shape.module} map reading is empty`).toBeGreaterThan(0)
      expect(fromCard.size, `${shape.module} card reading is empty`).toBeGreaterThan(0)
      expect(
        fromFunctionalities.size,
        `${shape.module} functionality reading is empty`,
      ).toBeGreaterThan(0)
      expect(
        key(fromMap) === key(fromCard) && key(fromCard) === key(fromFunctionalities),
        `${shape.module}: the three readings agree — the split this gate holds has been ` +
          'reconciled somewhere, which the source does not do',
      ).toBe(false)
    }
    expect(rows).toHaveLength(12)
    // The functionality reading is never a subset of the map's on every
    // module at once — stated as a measured property so a change in the
    // shape of the disagreement is visible rather than silent.
    const strictlyWider = FL_MATRIX_SHAPE.filter((shape) => {
      const fromMap = new Set(map[shape.module]!)
      const fromFunctionalities = new Set(
        SOURCE_FUNCTIONALITIES.filter((f) => f.module === shape.module).flatMap((f) => f.patterns),
      )
      return [...fromFunctionalities].some((p) => !fromMap.has(p))
    })
    expect(strictlyWider.length).toBeGreaterThanOrEqual(11)
  })

  it('and each module carries the source’s own functionality reading, unreconciled', () => {
    // THE READING THAT BINDS TO THE TREE. The map and the card are the
    // source's alone; the third reading is transcribed by twelve modules,
    // so this is where a reconciliation would actually be made. A module
    // that quietly trimmed its functionality set down to the map's, or
    // widened it up to the card's, moves this comparison off the source.
    for (const module of MODULES) {
      const fromSource = new Set(
        SOURCE_FUNCTIONALITIES.filter((f) => f.module === module.module).flatMap((f) => f.patterns),
      )
      const transcribed = new Set(module.functionalities.flatMap((f) => f.patterns))
      expect([...transcribed].sort(), `${module.module} functionality reading`).toEqual(
        [...fromSource].sort(),
      )
      expect(fromSource.size, `${module.module} reads no patterns at all`).toBeGreaterThan(0)
    }
  })

  it('no DEC identifier is attached to the disagreement, in either place it could be', () => {
    for (let n = MAP_FIRST_ROW; n <= MAP_LAST_ROW; n += 1) {
      expect(line(n), `map row L${n} attaches a decision`).not.toMatch(/DEC-[A-Z]/)
    }
    for (const [module, n] of Object.entries(CARD_LINES)) {
      expect(line(n), `${module} card attaches a decision`).not.toMatch(/DEC-[A-Z]/)
    }
    // THE DECISIONS THAT DO APPEAR are in the third reading, the
    // functionality clauses, and every one of them is about something else
    // — storage-full behaviour, wipe pendency, the scanner list,
    // difficulty-level travel, package-field assignment, the single-run
    // park. The set is enumerated so a decision about WHICH READING GOVERNS
    // could not join it unnoticed; if one ever is filed, this list changes
    // and the gate says so rather than the split quietly acquiring an
    // owner.
    const decided = [
      ...new Set(
        SOURCE_FUNCTIONALITIES.flatMap((f) => f.fallbackClause.match(/DEC-[A-Z]+-\d+/g) ?? []),
      ),
    ].sort()
    expect(decided.length).toBeGreaterThan(0)
    expect(decided).toEqual([
      'DEC-CAP-001',
      'DEC-LANEB-001',
      'DEC-LIB-001',
      'DEC-PARK-001',
      'DEC-STORE-001',
      'DEC-SUSP-001',
    ])
  })
})

/* ==================================================================== *
 * GATE 9 — THE FOUR CLAIMS THIS SURFACE MUST NEVER MAKE.
 *
 * 1. `worker-finished`, `submitted`, `complete` and `finished` are FOUR
 *    DIFFERENT STATES. A completion screen labelled "Run complete" when the
 *    worker has declared finished tells the worker the platform holds a
 *    record it does not hold.
 *
 * 2. THERE IS NO "SYNCED" STATE — L39622 says so in those words. And the
 *    obvious defence is the wrong one: the source itself writes the word
 *    twice inside §22.15, at L41235 and L41199, so a blanket word ban would
 *    force this build to PARAPHRASE THE SOURCE in order to pass its own
 *    gate. The rule is enforced where it applies — on capture LABELS — and
 *    every place the word appears at all is enumerated.
 *
 * 3. THE HOLD LIFECYCLE IS A CLIENT COMMAND CENTER RENDERING ACROSS A
 *    FLEET; the device holds only its own copy.
 *
 * 4. THE SAFETY LAYER IS IDENTICAL OFFLINE (L40948).
 * ==================================================================== */

describe('slice 7 gate 9: the four claims this surface never makes', () => {
  it('claim 1: the source names four different states, and they are four', () => {
    const states = line(40545)
    expect(states).toContain('`STATE-A3-WORKERFINISHED`')
    expect(states).toContain('are run-record states, not player states')
    for (const platform of ['`submitted`', '`complete`', '`finished`']) {
      expect(states, `L40545 names ${platform}`).toContain(platform)
    }
    // The chapter's own workflow, which is where the order comes from.
    expect(line(40559)).toContain('worker-finished')
    expect(line(40559)).toContain('`submitted`')
    expect(line(40560)).toContain('`complete`')
    // AND THE TREE HOLDS THEM APART. The register carries four states with
    // a `heldBy` field, and exactly ONE of them is the device's — which is
    // why a completion screen cannot pick a name. A second device-held
    // member makes `theStateThisScreenMayName` throw rather than let a
    // screen choose between two.
    expect(RUN_COMPLETION_STATES.map((s) => s.name)).toEqual([
      'worker-finished',
      'submitted',
      'complete',
      'finished',
    ])
    const deviceHeld = RUN_COMPLETION_STATES.filter((s) => s.heldBy === 'device')
    expect(deviceHeld.map((s) => s.name)).toEqual(['worker-finished'])
    expect(theStateThisScreenMayName().name).toBe('worker-finished')
    // The three the device does not hold are held somewhere, and never
    // by the device.
    for (const state of RUN_COMPLETION_STATES.filter((s) => s.heldBy !== 'device')) {
      expect(['platform-run-record', 'delivery-operations-hub'], state.name).toContain(state.heldBy)
    }
  })

  it('claim 2: no capture label is or contains the word, on the whole ladder', () => {
    expect(CAPTURE_STATES.length).toBe(13)
    for (const state of CAPTURE_STATES) {
      const label = CAPTURE_STATE_LABEL[state]
      expect(label, `capture label for ${state}`).toBeDefined()
      expect(label.toLowerCase(), `the capture label for ${state} claims a sync state`).not.toContain(
        'synced',
      )
    }
    expect(line(39622)).toContain('there is no single state called "synced"')
  })

  it('claim 2: the source writes the word twice in this chapter, so a word ban is not the gate', () => {
    // Both verbatim, at the lines the record cites. If these two lines did
    // not carry the word, a blanket ban would be defensible — this is the
    // assertion that says it is not.
    expect(line(41235)).toContain('Last synced 08:29.')
    expect(line(41199)).toContain('complete-and-synced')
    const verbatim = A6_SYNCED_WORD_RECORD.filter((r) => r.verbatimAtSource)
    expect(verbatim).toHaveLength(2)
    for (const record of verbatim) {
      const cited = firstCitedLine(record.sourceRef)
      expect(line(cited), `${record.sourceRef} does not carry its own quotation`).toContain(
        record.text,
      )
    }
    // The third is this build's own denial and is NOT claimed verbatim.
    expect(A6_SYNCED_WORD_RECORD.filter((r) => !r.verbatimAtSource)).toHaveLength(1)
  })

  it('claim 3: the hold lifecycle is stated as a Command Center rendering across a fleet', () => {
    const reconnect = line(40950)
    expect(reconnect).toContain('The Client Command Center presents propagation honestly as')
    expect(reconnect).toContain('issued, propagating, in force')
    // The device's own states are per-device, and the source says which:
    // `STATE-A5-INFORCE` is applied on A GIVEN DEVICE.
    expect(line(40930)).toContain('applied on a given device')
    // AND THE TREE HOLDS IT. `propagating` is the one hold state this
    // device cannot observe from what it holds, because the gloss is
    // "known to the server, not yet applied on every sibling device" and
    // a pull-based device has no sibling roster. If the device held it,
    // the panel could draw a fleet timeline honestly — and it cannot.
    expect(STATES_THIS_DEVICE_CANNOT_HOLD.map((s) => s.id)).toEqual(['STATE-A5-PROPAGATING'])
    expect(PROPAGATION_IS_NOT_A_DEVICE_TIMELINE.claim).toContain(
      'the Client Command Center rendering across a fleet',
    )
    expect(PROPAGATION_IS_NOT_A_DEVICE_TIMELINE.claim).toContain(
      'holds only its own copy',
    )
  })

  it('claim 4: the safety layer is not degraded offline, and cannot be typed as degraded', () => {
    const safety = frontlineConnectivityTreatment({ kind: 'safety-layer' })
    expect(safety.degradedOffline).toBe(false)
    expect(safety.sourceRef).toContain('L40948')
    expect(SAFETY_LAYER_OFFLINE.degradedOffline).toBe(false)
    // The source's own sentence, at the line the treatment cites.
    const l40948 = line(40948)
    expect(l40948).toContain('Identical in every safety respect.')
    expect(l40948).toContain(
      'the lot is protected from the moment of the breach, not from the moment of sync',
    )
    // And what the treatment tells a reader repeats the position rather
    // than softening it.
    expect(safety.reason).toContain('exactly as they do connected')
  })
})

/** The first line a `sourceRef` cites, in any of this tree's spellings. */
function firstCitedLine(sourceRef: string): number {
  const m = /L(\d{3,6})/.exec(sourceRef)
  if (m === null) throw new Error(`sourceRef cites no line: ${sourceRef}`)
  return Number(m[1])
}

/* ==================================================================== *
 * THE FILE ITSELF.
 * ==================================================================== */

describe('slice 7 gates: the file itself', () => {
  // Carried from slices 3, 4 and 5, where THREE separate patch scripts
  // rewrote a gate with `write(src.slice(0, start) + replacement)` and
  // silently truncated every gate defined after it. Both times the count
  // still looked right, because the check was how many gates existed rather
  // than WHICH.
  const SELF = join('tests', 'coverage', 'slice-07-gates.test.ts')

  it('defines gates 1..N with no gap, so a truncating edit cannot hide one', () => {
    const src = readFileSync(join(ROOT, SELF), 'utf8')
    const numbers = [...src.matchAll(/^describe\('slice 7 gate (\d+):/gm)].map((m) => Number(m[1]))
    expect(numbers.length, 'no gates found').toBeGreaterThan(0)
    expect(numbers, 'gate numbers are not a gapless 1..N sequence').toEqual(
      Array.from({ length: numbers.length }, (_, i) => i + 1),
    )
    expect(numbers.length, `slice 7 declares nine gates; this file defines ${numbers.length}`).toBe(
      9,
    )
  })

  it('leaves no probe behind', () => {
    for (const root of [join(ROOT, 'app', 'frontline'), join(ROOT, 'src', 'frontline')]) {
      expect(existsSync(join(root, OWN_PROBE_DIR)), `${root} still holds this run's probe`).toBe(
        false,
      )
    }
  })

  it('the plant helper this file proved its gates with is the shared one', () => {
    // `withPlanted` is imported rather than re-declared, which is what
    // `prohibited-patterns` requires of every suite that plants. It is
    // exercised here so the import is not decoration: a probe under
    // `app/frontline` must be visible to the route scan while it exists.
    withPlanted(join(ROOT, 'app', 'frontline'), 'probe.tsx', 'export const SCR = 1\n', () => {
      expect(existsSync(join(ROOT, 'app', 'frontline', OWN_PROBE_DIR, 'probe.tsx'))).toBe(true)
    })
    expect(existsSync(join(ROOT, 'app', 'frontline', OWN_PROBE_DIR))).toBe(false)
  })
})
