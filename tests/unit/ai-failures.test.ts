import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  FAILURE_CATALOGUE,
  FAILURE_FAMILIES,
  SPINE_BINDINGS,
  aiModesNamed,
  aiModesNamedByCatalogue,
  catalogueRow,
  spineResolution,
  spineResolutions,
  type CatalogueCellKey,
} from '@/ai/failures/catalogue'
import {
  RESPONSE_SPINE,
  SPINE_ITEM_NUMBERS,
  spineItem,
  type SpineItemNumber,
} from '@/ai/failures/spine'
import {
  OPERATIONAL_SEVERITY,
  OPERATIONAL_SEVERITY_BANDS,
  severityAssignment,
} from '@/ai/failures/severity'

/**
 * Slice 11, wave 0, task 4 — the failure catalogue, the response spine, the
 * operational severity bands, held apart from the manufacturing catalogue.
 *
 * WHAT THIS FILE IS FOR, and it is not "the rows exist".
 *
 *   - EVERY CELL IS RE-DERIVED FROM THE FROZEN SOURCE AT RUN TIME. The module
 *     is a transcription of eighteen tables. A transcription is checked by
 *     re-reading the original, never by a hand-written expectation that could
 *     have been copied from the same mistake. So the expectations below are
 *     parsed out of the blueprint inside the test, and the module is compared
 *     against them.
 *   - NO COUNT IS ASSERTED, ANYWHERE. Family membership is asserted as the
 *     LIST of identifiers the source's own first column carries, so adding a
 *     row the source does not have goes red with a name on it. A length
 *     assertion passes for the wrong reason as soon as one row is swapped for
 *     another.
 *   - `AC-43-101` IS THE HARD ONE. Every catalogued row must resolve every
 *     attribute of the spine as inherited, deviated or owed. An attribute that
 *     resolves to none of the three is unmodelled, and the assertion below
 *     fails on it rather than defaulting it.
 *   - `AC-43-103` / `TEST-43-103` IS THE TRAP. Operational severity and
 *     manufacturing severity must not share a vocabulary, a field, or a
 *     rendering component, and no code path may map one onto the other. The
 *     last section of this file is a real scan of the shipped module
 *     directory, not a statement of intent.
 */

const SOURCE_PATH =
  '/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md'
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const LINES: readonly string[] = ['', ...SOURCE_BYTES.toString('utf8').replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''
const rowCells = (n: number): readonly string[] =>
  L(n)
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((s) => s.trim())

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── the response spine ─────────────────────────────────────────────────── */

/**
 * The spine's own span, measured rather than carried. The re-plan's
 * L89935-L89960 begins at item 10 and runs past the last item into a mermaid
 * fence; this test finds the run of numbered items itself and asserts where it
 * starts and stops, so a span error cannot survive here.
 */
const SPINE_FIRST = 89_926
const SPINE_LAST = 89_946

describe('the shared response spine, section 43.1.1', () => {
  it('spans exactly the run of numbered items, with a non-item on each side', () => {
    for (let n = SPINE_FIRST; n <= SPINE_LAST; n += 1) {
      expect(L(n), `L${String(n)} is not a numbered spine item`).toMatch(/^\d+\. \*\*[^*]+\*\* /)
    }
    expect(L(SPINE_FIRST - 1), 'the line above the spine is an item').not.toMatch(/^\d+\. \*\*/)
    expect(L(SPINE_LAST + 1), 'the line below the spine is an item').not.toMatch(/^\d+\. \*\*/)
  })

  /**
   * FAILS IF: an item's number, name or default text drifts from its source
   * line by a single character. The source line is REBUILT from the record and
   * compared whole, which is a stronger claim than "the name appears".
   */
  it('reconstructs every item’s own source line from the record', () => {
    const fromSource = new Map<number, string>()
    for (let n = SPINE_FIRST; n <= SPINE_LAST; n += 1) {
      fromSource.set(Number(/^(\d+)\./.exec(L(n))![1]), L(n))
    }
    expect(RESPONSE_SPINE.map((i) => i.item)).toEqual([...fromSource.keys()])
    for (const item of RESPONSE_SPINE) {
      expect(`${String(item.item)}. **${item.name}.** ${item.spineDefault}`).toBe(
        fromSource.get(item.item),
      )
      expect(item.locator).toBe(`L${String(SPINE_FIRST + item.item - 1)}`)
    }
  })

  /**
   * The source classifies its own items at L89983 — "Spine items 4, 8, 9 …
   * rest on `SoW Fact` as cited. Items 1, 3, 11 … are `Derived Clarification`.
   * Items 2, 5, 6, 7, 10 are `Derived Clarification` or `TBD — Client Decision
   * Required` as marked." The three groups are parsed back out of that line
   * rather than retyped, so a mis-filed item goes red.
   */
  it('files every item under the classification the source gives it', () => {
    const claim = L(89_983)
    const groups = [...claim.matchAll(/(?:Spine items|Items) ((?:\d+, )+\d+)/g)].map((m) =>
      m[1]!.split(', ').map(Number),
    )
    const [sowFact, derived, derivedOrTbd] = groups
    for (const n of sowFact!) expect(spineItem(n as SpineItemNumber).classification).toBe('SoW Fact')
    for (const n of derived!)
      expect(spineItem(n as SpineItemNumber).classification).toBe('Derived Clarification')
    for (const n of derivedOrTbd!)
      expect(spineItem(n as SpineItemNumber).classification).toBe(
        'Derived Clarification or TBD — Client Decision Required',
      )
    expect([...sowFact!, ...derived!, ...derivedOrTbd!].sort((a, b) => a - b)).toEqual([
      ...SPINE_ITEM_NUMBERS,
    ])
  })
})

/* ── operational severity, and the vocabulary it must not touch ─────────── */

describe('operational severity, spine item 2', () => {
  /**
   * FAILS IF: a band is added, removed or renamed away from the four the
   * source names in the item-2 line. The bands are pulled out of that line's
   * own bolded run, so this cannot pass by agreeing with a list this file
   * wrote.
   */
  it('carries the bands the source’s own item-2 line names, and their meanings', () => {
    const line = L(89_927)
    const fromSource = [...line.matchAll(/\*\*([A-Z][a-z]+)\*\* \(([^)]+)\)/g)].map((m) => ({
      band: m[1]!,
      meaning: m[2]!,
    }))
    expect(OPERATIONAL_SEVERITY.map((b) => b.band)).toEqual(fromSource.map((b) => b.band))
    expect(OPERATIONAL_SEVERITY.map((b) => b.meaning)).toEqual(fromSource.map((b) => b.meaning))
    expect([...OPERATIONAL_SEVERITY_BANDS]).toEqual(fromSource.map((b) => b.band))
    for (const band of OPERATIONAL_SEVERITY) expect(band.locator).toBe('L89927')
  })

  /**
   * MEASURED, AND IT IS A FINDING RATHER THAN A DEFECT. `Informational` is one
   * of the bands the spine declares and no catalogued row uses it. That is a
   * stated absence, so it is asserted as one — against the frozen source, so
   * that a row acquiring it later turns this red instead of passing silently.
   */
  it('declares Informational and — measured — no catalogued row selects it', () => {
    expect(OPERATIONAL_SEVERITY_BANDS).toContain('Informational')
    const used = new Set(FAILURE_CATALOGUE.map((r) => r.cells.operationalSeverity))
    expect([...used]).not.toContain('Informational')
    const severityColumn = FAILURE_CATALOGUE.map((r) => r.cells.operationalSeverity).join(' | ')
    expect(severityColumn).not.toMatch(/Informational/)
  })

  /**
   * MEASURED. One row's severity cell is not a band but a condition naming
   * two — `FAIL-AI-43` at L90515, "Critical for compliance suspension, Major
   * otherwise". Picking one of the two would be exactly the invention
   * `AC-43-101` calls unmodelled, so the assignment keeps both and says what
   * separates them.
   */
  it('keeps the one conditional severity cell as a condition over two bands', () => {
    const conditional = FAILURE_CATALOGUE.filter((r) => r.severity.kind === 'conditional')
    expect(conditional.map((r) => r.id)).toEqual(['FAIL-AI-43'])
    const row = catalogueRow('FAIL-AI-43')
    expect(row.severity).toEqual({
      kind: 'conditional',
      bands: ['Critical', 'Major'],
      cell: 'Critical for compliance suspension, Major otherwise',
    })
    expect(rowCells(90_515)[0]).toBe('`FAIL-AI-43`')
    expect(rowCells(90_515)[3]).toBe(row.severity.cell)
  })

  it('refuses a severity cell drawn from no band at all', () => {
    expect(severityAssignment('Severity 1')).toBeNull()
    expect(severityAssignment('')).toBeNull()
    expect(severityAssignment('Major')).toEqual({ kind: 'band', band: 'Major', cell: 'Major' })
  })
})

/* ── the catalogue itself ───────────────────────────────────────────────── */

/**
 * The eighteen attribute-table headers, found rather than trusted: every
 * `| ID |` line inside section 43.2. The measured list is asserted against
 * what the scan finds, so a table added or moved goes red here first.
 */
const CATALOGUE_FIRST = 90_051
const CATALOGUE_LAST = 90_800

const scanHeaders = (): readonly number[] => {
  const found: number[] = []
  for (let n = CATALOGUE_FIRST; n <= CATALOGUE_LAST; n += 1) if (L(n).startsWith('| ID |')) found.push(n)
  return found
}

const CELL_FOR_HEADER: Readonly<Record<string, CatalogueCellKey>> = {
  'Failure mode': 'failureMode',
  Detection: 'detection',
  'Operational severity': 'operationalSeverity',
  'Exact user-visible message, Frontline Worker Application': 'frontlineMessage',
  'Exact user-visible message, tenant web surfaces': 'tenantWebMessage',
  'Validation or confidence gate': 'validationGate',
  'Retry limit': 'retryLimit',
  'Circuit breaker': 'circuitBreaker',
  'Alternate provider or model': 'alternateModel',
  'Partial-output treatment': 'partialOutput',
  'First fallback': 'firstFallback',
  'Fallback of fallback': 'fallbackOfFallback',
  'Terminal safe state': 'terminalSafeState',
  Recovery: 'recovery',
  Reconciliation: 'reconciliation',
}

describe('the failure catalogue, section 43.2', () => {
  it('finds its attribute tables where the module says they are', () => {
    expect(scanHeaders()).toEqual(FAILURE_FAMILIES.flatMap((f) => [...f.attributeTableHeaders]))
    for (const family of FAILURE_FAMILIES) {
      expect(L(family.headingLocator)).toBe(`### ${family.title}`)
    }
  })

  /**
   * MEMBERSHIP, NOT LENGTH. Each family's identifier list is read out of the
   * first column of its own three tables and compared whole, in order. Adding
   * a row the source does not carry goes red naming it; so does dropping one.
   */
  it('registers each family’s rows as its own tables list them, in order', () => {
    for (const family of FAILURE_FAMILIES) {
      const perTable = family.attributeTableHeaders.map((h) => {
        const ids: string[] = []
        for (let n = h + 2; /^\| `FAIL-AI-\d+` \|/.test(L(n)); n += 1) ids.push(rowCells(n)[0]!.replace(/`/g, ''))
        return ids
      })
      expect(perTable[1], `${family.key}: table two does not carry table one's rows`).toEqual(perTable[0])
      expect(perTable[2], `${family.key}: table three does not carry table one's rows`).toEqual(perTable[0])
      expect(FAILURE_CATALOGUE.filter((r) => r.family === family.key).map((r) => r.id)).toEqual(perTable[0])
    }
  })

  /**
   * THE TRANSCRIPTION GATE. Every cell of every row, against the source cell
   * at the line the record itself names. A wrong locator and a wrong cell both
   * go red here, because the cell is fetched THROUGH the locator.
   */
  it('transcribes every cell verbatim from the line the record cites', () => {
    for (const row of FAILURE_CATALOGUE) {
      const seen = new Set<CatalogueCellKey>()
      for (const locator of row.attributeLocators) {
        const table = scanHeaders().filter((h) => h < locator).pop()!
        const headers = rowCells(table)
        const values = rowCells(locator)
        expect(values[0], `L${String(locator)} is not ${row.id}`).toBe(`\`${row.id}\``)
        for (let i = 1; i < headers.length; i += 1) {
          const key = CELL_FOR_HEADER[headers[i]!]
          expect(key, `column "${headers[i]!}" is not registered`).toBeDefined()
          expect(row.cells[key!], `${row.id}.${key!} at L${String(locator)}`).toBe(values[i])
          seen.add(key!)
        }
      }
      expect([...seen].sort()).toEqual(Object.keys(row.cells).sort())
    }
  })

  it('cites, per row, only decision identifiers its own cells name', () => {
    for (const row of FAILURE_CATALOGUE) {
      const inCells = [
        ...new Set([...JSON.stringify(row.cells).matchAll(/DEC-[A-Z]+-\d+/g)].map((m) => m[0])),
      ].sort()
      expect(row.citedDecisions, row.id).toEqual(inCells)
    }
  })
})

/* ── AC-43-101 — every attribute resolves, none is unstated ─────────────── */

describe('AC-43-101, the completeness lint TEST-43-101 asserts', () => {
  it('binds every spine item to the catalogue columns that answer it, or to none', () => {
    expect(SPINE_BINDINGS.map((b) => b.item)).toEqual([...SPINE_ITEM_NUMBERS])
    for (const binding of SPINE_BINDINGS) {
      if (binding.columns.length === 0) expect(binding.kind).toBeNull()
      else expect(binding.kind).not.toBeNull()
      for (const column of binding.columns) {
        expect(Object.values(CELL_FOR_HEADER)).toContain(column)
      }
    }
  })

  /**
   * THE GATE `AC-43-101` NAMES. Every row, every spine item, one of the three
   * fates. `spineResolutions` builds its map from the declared item list, so a
   * row missing an item is a missing key rather than a silent default, and
   * that is what this asserts.
   *
   * Planted: spine item 21 removed from `SPINE_BINDINGS`. RED on every row.
   */
  it('resolves every spine attribute of every catalogued row', () => {
    for (const row of FAILURE_CATALOGUE) {
      const resolved = spineResolutions(row)
      expect(Object.keys(resolved).map(Number).sort((a, b) => a - b), row.id).toEqual([
        ...SPINE_ITEM_NUMBERS,
      ])
      for (const item of SPINE_ITEM_NUMBERS) {
        expect(['inherited', 'deviated', 'owed'], `${row.id} item ${String(item)}`).toContain(
          resolved[item],
        )
      }
    }
  })

  /**
   * FAILS IF: the resolution stops distinguishing the three fates. A rule that
   * answered `inherited` for everything would satisfy the assertion above and
   * discharge nothing, which is the vacuous shape this build has shipped
   * before. So each fate is asserted where the source puts it:
   *
   *   - OWED where the row's cell points at the open register — the tables'
   *     own bare `Register` token, or one of the register's ten identifiers.
   *   - DEVIATED where the row states its own answer for an attribute the
   *     spine fixes or leaves open.
   *   - INHERITED where nothing in the row displaces the default.
   */
  it('reaches all three fates, at the rows the source puts them on', () => {
    expect(spineResolution(catalogueRow('FAIL-AI-01'), 5)).toBe('owed')
    expect(catalogueRow('FAIL-AI-01').cells.retryLimit).toBe('Register `DEC-AIRETRY-001`')
    expect(spineResolution(catalogueRow('FAIL-AI-04'), 5)).toBe('deviated')
    expect(catalogueRow('FAIL-AI-04').cells.retryLimit).toBe(
      'No retry — retrying an authentication failure is never productive',
    )
    expect(spineResolution(catalogueRow('FAIL-AI-04'), 19)).toBe('inherited')
    expect(spineResolution(catalogueRow('FAIL-AI-27'), 1)).toBe('owed')
    expect(catalogueRow('FAIL-AI-27').cells.detection).toBe('Score below `DEC-AICONF-001`')

    const fates = new Set(
      FAILURE_CATALOGUE.flatMap((r) => SPINE_ITEM_NUMBERS.map((i) => spineResolution(r, i))),
    )
    expect([...fates].sort()).toEqual(['deviated', 'inherited', 'owed'])
  })
})

/* ── AC-43-301 — the seam, from this side only ──────────────────────────── */

describe('AC-43-301, the operating-mode identifiers this catalogue names', () => {
  /**
   * `AC-43-301` (L90840) requires all five surfaces to render a state drawn
   * from the operating-mode vocabulary during any catalogued failure, and
   * `TEST-43-301` (L90845) is the capture harness that asserts they do not
   * contradict. THAT VOCABULARY IS NOT THIS TASK'S, and this file neither
   * imports it nor restates it.
   *
   * What is asserted here is only what this side of the seam owes: the mode
   * identifiers the catalogue's own cells name, measured against the frozen
   * source rather than against a list. Whoever owns the vocabulary must cover
   * these, and spine item 10 fixes one more for every row that states no
   * other — its default names the deterministic no-artificial-intelligence
   * mode outright.
   */
  it('names, in its cells, exactly the mode identifiers its source rows carry', () => {
    const fromSource = new Set<string>()
    for (const row of FAILURE_CATALOGUE) {
      for (const locator of row.attributeLocators) {
        for (const m of L(locator).matchAll(/AIMODE-\d+/g)) fromSource.add(m[0])
      }
    }
    expect(aiModesNamedByCatalogue()).toEqual([...fromSource].sort())
    expect(aiModesNamedByCatalogue().length).toBeGreaterThan(0)
    expect(aiModesNamed(catalogueRow('FAIL-AI-01'))).toEqual(['AIMODE-06', 'AIMODE-07'])
    expect(L(90_840)).toContain('AC-43-301')
    expect(L(90_840)).toContain('sixteen-mode vocabulary')
  })

  it('carries the mode spine item 10 fixes for every row that states no other', () => {
    expect(spineItem(10).spineDefault).toContain('AIMODE-07')
  })
})

/* ── AC-43-103 / TEST-43-103 — the separation gate ──────────────────────── */

/**
 * THE GATE THIS TASK IS MOST LIKELY TO FAIL, AND THE ONE THE RE-PLAN NAMES.
 * Slices 6 and 9 shipped manufacturing severity components. `AC-43-103`
 * requires separate fields, separate vocabularies and NO SHARED RENDERING
 * COMPONENT; `TEST-43-103` requires that no code path maps one onto the other.
 *
 * Two halves, because either alone is escapable:
 *
 *   - AN IMPORT ALLOWLIST, a literal list rather than a pattern. Anything this
 *     directory pulls in that is not on it is red, which catches a
 *     manufacturing severity import and also catches the import nobody
 *     predicted. Proved by ADDING an entry to the directory, never by removing
 *     one from the list.
 *   - A SYMBOL SCAN, because a copy-paste needs no import. The forbidden names
 *     are the manufacturing severity symbols measured in this tree.
 *
 * WHAT IT DELIBERATELY DOES NOT DO, and the reason is in the source. It does
 * not forbid the STRING `Severity 1` inside a transcribed cell: the source's
 * own operational catalogue quotes the manufacturing vocabulary in two cells —
 * `FAIL-AI-39`'s detector and `FAIL-AI-58`'s failure mode. Reddening on those
 * would force the transcription to be paraphrased, and a paraphrased
 * transcription is the defect this whole file exists to prevent. The
 * separation `AC-43-103` asks for is of FIELDS and VOCABULARIES, and the field
 * check is the one above: every `severity` assignment resolves to the
 * operational bands and nothing else.
 */
describe('AC-43-103 — operational severity shares nothing with the manufacturing catalogue', () => {
  const MODULE_DIR = new URL('../../src/ai/failures/', import.meta.url).pathname
  const ALLOWED_IMPORTS: readonly string[] = [
    '@/disclosure/decisions',
    './severity',
    './spine',
    './open-values',
    './catalogue',
  ]
  const moduleFiles = (): readonly string[] => readdirSync(MODULE_DIR).filter((f) => f.endsWith('.ts'))

  /**
   * The manufacturing severity symbols measured in this tree, by name. Held
   * HERE and not in the module directory: declaring them beside the code they
   * police put the forbidden names inside the text the scan reads, and the
   * gate reddened on its own expectation on the first run.
   *
   * A LIST OF NAMES RATHER THAN A PATTERN. `/severity/i` would match this
   * task's own identifiers and would be weakened until it matched nothing. The
   * import allowlist above is what covers a symbol nobody thought to list.
   */
  const MANUFACTURING_SEVERITY_SYMBOLS: readonly string[] = [
    'SEEDED_SEVERITY_BANDS',
    'severityBand',
    'severityBands',
    'severityCatalogLevels',
    'AnomalySeverity',
    'ANOMALY_SEVERITIES',
    'CcSeverityCounts',
  ]

  it('imports nothing outside its allowlist', () => {
    expect(moduleFiles().length).toBeGreaterThan(0)
    for (const file of moduleFiles()) {
      const text = readFileSync(join(MODULE_DIR, file), 'utf8')
      for (const m of text.matchAll(/(?:^|\n)\s*(?:import|export)\b[^\n]*?from '([^']+)'/g)) {
        expect(ALLOWED_IMPORTS, `${file} imports ${m[1]!}`).toContain(m[1])
      }
    }
  })

  /**
   * FAILS IF: the list above names a symbol this tree does not have. A gate
   * that forbids ghosts forbids nothing, and a typo in a forbidden name is
   * invisible from inside the scan that uses it.
   */
  it('forbids only symbols that exist, somewhere other than here', () => {
    const SRC = new URL('../../src/', import.meta.url).pathname
    // Probe-aware, per `tests/coverage/prohibited-patterns.test.ts`: a
    // recursive walk that does not skip another process's scratch directory
    // will ENOENT on it the moment that process cleans up.
    const walk = (dir: string): readonly string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        isForeignProbe(e.name) ? [] : e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
      )
    const elsewhere = walk(SRC)
      .filter((f) => /\.tsx?$/.test(f) && !f.startsWith(MODULE_DIR))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
    for (const symbol of MANUFACTURING_SEVERITY_SYMBOLS) {
      expect(elsewhere, `${symbol} is forbidden but exists nowhere`).toMatch(
        new RegExp(`\\b${symbol}\\b`),
      )
    }
  })

  it('names no manufacturing severity symbol anywhere in the module directory', () => {
    expect(MANUFACTURING_SEVERITY_SYMBOLS.length).toBeGreaterThan(0)
    for (const file of moduleFiles()) {
      const text = readFileSync(join(MODULE_DIR, file), 'utf8')
      for (const symbol of MANUFACTURING_SEVERITY_SYMBOLS) {
        expect(text, `${file} reaches the manufacturing symbol ${symbol}`).not.toMatch(
          new RegExp(`\\b${symbol}\\b`),
        )
      }
    }
  })

  it('assigns every row a severity drawn from the operational bands only', () => {
    for (const row of FAILURE_CATALOGUE) {
      const bands =
        row.severity.kind === 'band' ? [row.severity.band] : row.severity.bands
      expect(bands.length, row.id).toBeGreaterThan(0)
      for (const band of bands) expect(OPERATIONAL_SEVERITY_BANDS, row.id).toContain(band)
    }
  })
})
