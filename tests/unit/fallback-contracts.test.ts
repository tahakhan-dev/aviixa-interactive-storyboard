import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import {
  DECLARED_LADDER_ATTRIBUTE_COUNT,
  FALLBACK_LADDER,
  LEVEL_2_EXTRA_ATTRIBUTE,
  ladderRung,
  ladderSpecification,
} from '@/fallbacks/ladder'
import {
  CLASS_DIAGRAM_FIELDS,
  COLLAPSED_FIELD_PAIRS,
  DECLARED_CRITICALITY_VALUES,
  DECLARED_TEMPLATE_FIELD_COUNT,
  FALLBACK_TEMPLATE_FIELDS,
  RENDERED_ROWS,
  RENDERED_ROW_COUNT,
  TEMPLATE_FIELD_ROW,
  type RenderedRow,
} from '@/fallbacks/template'
import {
  FALLBACK_CONTRACTS,
  FALLBACK_CONTRACT_IDS,
  FALLBACK_FAMILIES,
  FB_IDS_OUTSIDE_THE_LIBRARY,
  contractsInFamily,
  fallbackContract,
} from '@/fallbacks/contracts'
import {
  FALLBACK_DECISION_REFS,
  FALLBACK_LOCAL_DISCLOSURES,
  UNCARDED_DECISION_REF,
} from '@/fallbacks/disclosure'

/* ======================================================================
 * THE FALLBACK CONTRACT OBJECT, CHECKED AGAINST THE FROZEN SOURCE.
 *
 * WHAT THIS SUITE IS FOR, AND WHAT IT REFUSES TO BE. Every shipped value in
 * `src/fallbacks/` was extracted from the blueprint mechanically. A suite that
 * re-ran that extraction and compared it to itself would be a tautology with a
 * green tick, so this file parses the source AGAIN, with its own parser,
 * anchored on header TEXT rather than on the line numbers the modules carry —
 * and then checks those line numbers as an OUTPUT.
 *
 * Two consequences worth stating, because both were design choices:
 *
 *   - no assertion here compares a shipped array to a spread of itself, and no
 *     count is asserted only against a literal. The seventy is asserted from
 *     the library index and from the seventy headings independently, and the
 *     two derivations are asserted against each other before either is
 *     compared to a number;
 *
 *   - a parse that finds nothing must FAIL, never pass vacuously. Every parser
 *     below asserts it found something before its result is used, and `at`
 *     throws rather than yielding `undefined` into a comparison with
 *     `undefined`.
 *
 * A MISSING OR ALTERED SOURCE IS A HARD FAILURE, NEVER A VACUOUS PASS. The
 * hash and the line count are asserted before anything reads a line.
 * ====================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** 1-based, the way a citation is written. */
const L = (n: number): string => {
  const line = sourceLines[n - 1]
  if (line === undefined) throw new Error(`frozen source has no line ${n}`)
  return line
}

/**
 * Indexing that FAILS rather than yielding `undefined`. A parse that silently
 * produced `undefined` and compared it to `undefined` is the shape of a gate
 * that cannot fail.
 */
function at<T>(xs: readonly T[], i: number, what: string): T {
  const v = xs[i]
  if (v === undefined) throw new Error(`${what}: nothing at index ${i}`)
  return v
}

/** One table row split into its cells, trimmed. Leading and trailing pipe dropped. */
const cellsOf = (line: string): string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

const isSeparator = (line: string): boolean => /^\|[\s-|:]+\|$/.test(line)

/**
 * The one line in the whole source equal to `text`. Anchoring on text rather
 * than on a number is what stops this suite inheriting the modules' own
 * locators as its input — and `unique` is load-bearing: two identical headers
 * would otherwise let the parser silently pick the wrong table.
 */
function uniqueLineNumber(text: string): number {
  const hits: number[] = []
  for (let n = 1; n <= sourceLines.length; n += 1) if (L(n) === text) hits.push(n)
  if (hits.length !== 1) throw new Error(`expected exactly one line equal to ${text}, got ${hits.length}`)
  return at(hits, 0, 'unique line')
}

/**
 * The rows of the table whose header row is at `headerLine`: everything after
 * the separator until the first line that is not a table row.
 *
 * The separator is skipped rather than parsed. `|---|---|` splits into
 * non-empty cells and so satisfies a naive shape check — that exact defect
 * shipped in this build once already.
 */
function tableRows(headerLine: number): { text: string; cells: string[] }[] {
  const sep = L(headerLine + 1)
  if (!isSeparator(sep)) throw new Error(`no separator under header line ${headerLine}`)
  const rows: { text: string; cells: string[] }[] = []
  for (let n = headerLine + 2; n <= sourceLines.length; n += 1) {
    const line = L(n)
    if (!line.startsWith('| ')) break
    if (isSeparator(line)) break
    rows.push({ text: line, cells: cellsOf(line) })
  }
  if (rows.length === 0) throw new Error(`table under header line ${headerLine} has no rows`)
  return rows
}

/* ── the source's own view of the library, parsed once ─────────────────── */

const CONTRACT_HEADING = /^\*\*Contract `(FB-[A-Z]+-\d+)` — (.*)\.\*\*$/

/** Every `**Contract `FB-*`**` heading in the whole document, in source order. */
const sourceHeadings = ((): { id: string; title: string; line: number }[] => {
  const found: { id: string; title: string; line: number }[] = []
  for (let n = 1; n <= sourceLines.length; n += 1) {
    const m = CONTRACT_HEADING.exec(L(n))
    if (m !== null) found.push({ id: at(m, 1, 'id'), title: at(m, 2, 'title'), line: n })
  }
  if (found.length === 0) throw new Error('no contract headings found in the frozen source')
  return found
})()

/** The twenty-four rows under one contract heading, header-keyed. */
function sourceContractRows(headingLine: number): { field: string; spec: string }[] {
  let header = -1
  for (let n = headingLine + 1; n < headingLine + 8; n += 1) {
    if (L(n) === '| Field | Specification |') {
      header = n
      break
    }
  }
  if (header === -1) throw new Error(`no field table under contract heading at line ${headingLine}`)
  return tableRows(header).map((r) => ({
    field: at(r.cells, 0, 'field'),
    spec: at(r.cells, 1, 'spec'),
  }))
}

/** The contract whose heading most recently preceded `line`. */
function owningContract(line: number): string {
  const before = sourceHeadings.filter((h) => h.line < line)
  return at(before, before.length - 1, `contract owning line ${line}`).id
}

const familyIndexHeader = uniqueLineNumber('| Family | Prefix | Contracts | Highest criticality in the family |')
const templateHeader = uniqueLineNumber('| # | Field | What it must contain | Why it is mandatory |')

const tally = (xs: readonly string[]): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const x of xs) out[x] = (out[x] ?? 0) + 1
  return out
}

describe('the frozen source this suite reads', () => {
  it('is the hash-verified blueprint, at its stated length', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

describe('sixteen families summing to seventy, proved from both sides', () => {
  /**
   * Side A. The library index's own `Contracts` column: sixteen rows, each
   * claiming a count for its own prefix.
   */
  const sideA = ((): Record<string, number> => {
    const out: Record<string, number> = {}
    for (const row of tableRows(familyIndexHeader)) {
      const prefix = at(row.cells, 1, 'prefix').replace(/`/g, '').replace(/-\*$/, '')
      out[prefix] = Number(at(row.cells, 2, 'contracts'))
    }
    return out
  })()

  /**
   * Side B. The contracts that are actually there, grouped by the stem of
   * their own identifier. Nothing about side A is used to build it.
   */
  const sideB = tally(sourceHeadings.map((h) => h.id.replace(/-\d+$/, '')))

  it('the source agrees with itself: the index column and the headings give the same sixteen counts', () => {
    expect(Object.keys(sideA)).toHaveLength(16)
    expect(sideB).toEqual(sideA)
  })

  it('the two independent sums are the same number, and it is seventy', () => {
    const sumA = Object.values(sideA).reduce((a, b) => a + b, 0)
    const sumB = sourceHeadings.length
    // The load-bearing assertion is that two readings agree. The literal below
    // is corroboration of an already-established equality, not the evidence.
    expect(sumB).toBe(sumA)
    expect(sumA).toBe(70)
  })

  it('the shipped index reproduces side A, row for row and cell for cell', () => {
    const rows = tableRows(familyIndexHeader)
    expect(FALLBACK_FAMILIES).toHaveLength(rows.length)
    rows.forEach((row, i) => {
      const shipped = at(FALLBACK_FAMILIES, i, 'shipped family')
      expect(shipped.family).toBe(at(row.cells, 0, 'family'))
      expect(shipped.prefix).toBe(at(row.cells, 1, 'prefix').replace(/`/g, '').replace(/-\*$/, ''))
      expect(shipped.declaredContracts).toBe(Number(at(row.cells, 2, 'contracts')))
      expect(shipped.highestCriticality).toBe(at(row.cells, 3, 'criticality'))
      expect(L(shipped.line)).toBe(row.text)
    })
  })

  it('the shipped contracts reproduce side B, and every family is populated to its claim', () => {
    expect(tally(FALLBACK_CONTRACTS.map((c) => c.prefix))).toEqual(sideB)
    for (const family of FALLBACK_FAMILIES) {
      expect(contractsInFamily(family.prefix)).toHaveLength(family.declaredContracts)
    }
  })

  it('the declared identifier union and the shipped records are the same set', () => {
    expect(FALLBACK_CONTRACTS.map((c) => c.id)).toEqual([...FALLBACK_CONTRACT_IDS])
    expect(new Set(FALLBACK_CONTRACT_IDS).size).toBe(FALLBACK_CONTRACT_IDS.length)
    for (const id of FALLBACK_CONTRACT_IDS) expect(fallbackContract(id)?.id).toBe(id)
  })
})

describe('every contract renders the same twenty-four rows, header-keyed', () => {
  it('the source renders twenty-four on all seventy, and the same twenty-four each time', () => {
    // Compared as JSON rather than a joined string: a join needs a
    // delimiter no row label can contain, and asserting that is more work
    // than not needing it.
    const shapes = new Set(
      sourceHeadings.map((h) => JSON.stringify(sourceContractRows(h.line).map((r) => r.field))),
    )
    expect(shapes.size).toBe(1)
    expect(JSON.parse(at([...shapes], 0, 'the one row shape'))).toEqual([...RENDERED_ROWS])
  })

  it('the source states the row order in its own prose, and it is the same order', () => {
    /**
     * A second, independent reading of the same fact: §38.4 introduces the
     * fixed row order in a sentence and lists the rows in it. Compared
     * case-insensitively because the sentence lower-cases all but the two
     * recovery objectives.
     */
    const sentence = sourceLines.filter((l) => l.includes('is rendered as a twenty-four-row table'))
    expect(sentence).toHaveLength(1)
    const listed = at(sentence, 0, 'row-order sentence')
      .split(':')
      .slice(1)
      .join(':')
      .trim()
      .replace(/\.$/, '')
      .split('; ')
    expect(listed.map((s) => s.toLowerCase())).toEqual(RENDERED_ROWS.map((s) => s.toLowerCase()))
  })

  it('the rendered count and the declared count are both the source’s, and they differ', () => {
    expect(RENDERED_ROW_COUNT).toBe(RENDERED_ROWS.length)
    expect(DECLARED_TEMPLATE_FIELD_COUNT).toBe(tableRows(templateHeader).length)
    // The contradiction is carried, not tidied. If these ever became equal,
    // one of the two source readings would have been dropped.
    expect(DECLARED_TEMPLATE_FIELD_COUNT).not.toBe(RENDERED_ROW_COUNT)
  })

  it('every shipped contract carries all twenty-four keys in the source’s order', () => {
    for (const contract of FALLBACK_CONTRACTS) {
      expect(Object.keys(contract.cells)).toEqual([...RENDERED_ROWS])
    }
  })

  it('every one of the 1,680 cells is the source’s own text, verbatim', () => {
    expect(sourceHeadings).toHaveLength(FALLBACK_CONTRACTS.length)
    sourceHeadings.forEach((heading, i) => {
      const shipped = at(FALLBACK_CONTRACTS, i, 'shipped contract')
      expect(shipped.id).toBe(heading.id)
      expect(shipped.title).toBe(heading.title)
      expect(shipped.heading).toBe(L(heading.line))
      expect(shipped.headingLine).toBe(heading.line)
      expect(L(shipped.tableLine)).toBe('| Field | Specification |')
      const rows = sourceContractRows(heading.line)
      expect(rows).toHaveLength(RENDERED_ROW_COUNT)
      for (const row of rows) {
        expect(shipped.cells[row.field as RenderedRow]).toBe(row.spec)
      }
    })
  })

  it('no cell is empty, because the template forbids an empty field', () => {
    for (const contract of FALLBACK_CONTRACTS) {
      for (const row of RENDERED_ROWS) expect(contract.cells[row].length).toBeGreaterThan(0)
    }
  })
})

describe('the twenty-six field template, and the two collapses', () => {
  const rows = tableRows(templateHeader)

  it('is twenty-six numbered fields, transcribed verbatim', () => {
    expect(rows).toHaveLength(26)
    expect(FALLBACK_TEMPLATE_FIELDS).toHaveLength(rows.length)
    rows.forEach((row, i) => {
      const shipped = at(FALLBACK_TEMPLATE_FIELDS, i, 'template field')
      expect(shipped.number).toBe(Number(at(row.cells, 0, 'number')))
      expect(shipped.field).toBe(at(row.cells, 1, 'field'))
      expect(shipped.mustContain).toBe(at(row.cells, 2, 'must contain'))
      expect(shipped.whyMandatory).toBe(at(row.cells, 3, 'why'))
      expect(L(shipped.line)).toBe(row.text)
    })
    expect(FALLBACK_TEMPLATE_FIELDS.map((f) => f.number)).toEqual(
      Array.from({ length: 26 }, (_, i) => i + 1),
    )
  })

  it('maps all twenty-six onto the twenty-four, collapsing in exactly two places', () => {
    const keys = Object.keys(TEMPLATE_FIELD_ROW).map(Number).sort((a, b) => a - b)
    expect(keys).toEqual(FALLBACK_TEMPLATE_FIELDS.map((f) => f.number))
    const landings = Object.values(TEMPLATE_FIELD_ROW)
    // Onto: no rendered row is left with nothing that maps to it.
    expect(new Set(landings)).toEqual(new Set(RENDERED_ROWS))
    // Two-to-one exactly twice, and never three-to-one.
    const doubled = Object.entries(tally(landings)).filter(([, n]) => n > 1)
    expect(doubled.map(([row]) => row).sort()).toEqual(
      COLLAPSED_FIELD_PAIRS.map((p) => p.row).slice().sort(),
    )
    for (const [, n] of doubled) expect(n).toBe(2)
    for (const pair of COLLAPSED_FIELD_PAIRS) {
      for (const field of pair.fields) expect(TEMPLATE_FIELD_ROW[field]).toBe(pair.row)
    }
  })

  it('names the pairs the source itself collapsed, not an arbitrary two', () => {
    const nameOf = (n: number): string =>
      at(
        FALLBACK_TEMPLATE_FIELDS.filter((f) => f.number === n),
        0,
        `template field ${n}`,
      ).field
    expect(COLLAPSED_FIELD_PAIRS.map((p) => p.fields.map(nameOf))).toEqual([
      ['Entry trigger', 'Exit trigger'],
      ['Audit', 'Monitoring'],
    ])
  })

  it('records the class diagram as a third, twenty-seven-field reading', () => {
    /**
     * Anchored on the class body rather than on a line number: the diagram
     * declares `class FallbackContract {` and lists its members until the
     * brace closes.
     */
    const open = uniqueLineNumber('    class FallbackContract {')
    const members: string[] = []
    for (let n = open + 1; L(n).trim() !== '}'; n += 1) members.push(L(n).trim().replace(/^\+/, ''))
    expect(members).toHaveLength(28)
    expect(at(members, 0, 'first member')).toBe('identifier')
    expect(members.slice(1)).toEqual([...CLASS_DIAGRAM_FIELDS])
    // The diagram splits what the prose table joins, and splits one the prose
    // table does not: 27 against 26 against 24, all three the source's own.
    expect(CLASS_DIAGRAM_FIELDS).toHaveLength(27)
    expect(CLASS_DIAGRAM_FIELDS).toContain('residualRisk')
    expect(CLASS_DIAGRAM_FIELDS).toContain('sourceStatus')
    expect(FALLBACK_TEMPLATE_FIELDS.map((f) => f.field)).toContain(
      'Residual risk and source status',
    )
  })

  it('records the criticality vocabulary gap rather than enforcing a token set', () => {
    const authRow = tableRows(familyIndexHeader).filter((r) =>
      at(r.cells, 1, 'prefix').includes('FB-AUTH-'),
    )
    expect(authRow).toHaveLength(1)
    const sourceValue = at(at(authRow, 0, 'auth row').cells, 3, 'criticality')
    // The source uses a fifth value in its own index that field 3 never lists.
    expect(DECLARED_CRITICALITY_VALUES as readonly string[]).not.toContain(sourceValue)
    expect(
      at(
        FALLBACK_TEMPLATE_FIELDS.filter((f) => f.field === 'Criticality'),
        0,
        'criticality field',
      ).mustContain,
    ).not.toContain(sourceValue)
    // And the contracts' own cells are prose, so nothing here parses them.
    expect(FALLBACK_CONTRACTS.some((c) => c.cells.Criticality.includes(sourceValue))).toBe(true)
  })
})

describe('the eight-rung ladder, and the fourteenth attribute at Level 2', () => {
  /** Every `**Level N — ...**` heading, found by shape rather than by number. */
  const levelHeadings = ((): { level: number; name: string; line: number }[] => {
    const found: { level: number; name: string; line: number }[] = []
    for (let n = 1; n <= sourceLines.length; n += 1) {
      const m = /^\*\*Level (\d+) — (.*)\.\*\*$/.exec(L(n))
      if (m !== null) found.push({ level: Number(at(m, 1, 'level')), name: at(m, 2, 'name'), line: n })
    }
    return found
  })()

  const rowsForLevel = (headingLine: number): { text: string; cells: string[] }[] => {
    let header = -1
    for (let n = headingLine + 1; n < headingLine + 8; n += 1) {
      if (L(n) === '| Attribute | Specification |') {
        header = n
        break
      }
    }
    if (header === -1) throw new Error(`no attribute table under level heading at line ${headingLine}`)
    return tableRows(header)
  }

  it('is eight rungs, numbered zero to seven, transcribed verbatim', () => {
    expect(levelHeadings.map((h) => h.level)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(FALLBACK_LADDER).toHaveLength(levelHeadings.length)
    levelHeadings.forEach((heading, i) => {
      const rung = at(FALLBACK_LADDER, i, 'rung')
      expect(rung.level).toBe(heading.level)
      expect(rung.name).toBe(heading.name)
      expect(rung.heading).toBe(L(heading.line))
      expect(rung.headingLine).toBe(heading.line)
      expect(L(rung.headerLine)).toBe('| Attribute | Specification |')
      const rows = rowsForLevel(heading.line)
      expect(rung.attributes).toHaveLength(rows.length)
      rows.forEach((row, k) => {
        // Spread because `FALLBACK_LADDER` is `as const satisfies` — the idiom
        // `tests/coverage/slice-2c-gates.test.ts` gate 2 requires, and the one a
        // leading `readonly LadderRung[]` annotation would defeat. That keeps
        // `attributes` a tuple of distinct literal object types, which does not
        // assign to a `readonly (A | B | …)[]` parameter. Widening the const back
        // to silence it would put the rejected annotation straight back.
        const attr = at([...rung.attributes], k, 'attribute')
        expect(attr.attribute).toBe(at(row.cells, 0, 'attribute'))
        expect(attr.specification).toBe(at(row.cells, 1, 'specification'))
        expect(L(attr.line)).toBe(row.text)
      })
    })
  })

  it('carries thirteen attributes everywhere except Level 2, which carries fourteen', () => {
    const counts = levelHeadings.map((h) => rowsForLevel(h.line).length)
    expect(counts).toEqual([13, 13, 14, 13, 13, 13, 13, 13])
    expect(FALLBACK_LADDER.map((r) => r.attributes.length)).toEqual(counts)
    // The claim and the count are both carried, and they disagree at one rung.
    const claimed = sourceLines.filter((l) =>
      l.includes('Each level below carries the thirteen attributes'),
    )
    expect(claimed).toHaveLength(1)
    expect(DECLARED_LADDER_ATTRIBUTE_COUNT).toBe(13)
    expect(at(FALLBACK_LADDER, 2, 'level 2').attributes).not.toHaveLength(
      DECLARED_LADDER_ATTRIBUTE_COUNT,
    )
  })

  it('keeps the honest scope note, which is the whole of the disagreement', () => {
    const carriers = FALLBACK_LADDER.filter((r) =>
      r.attributes.some((a) => a.attribute === LEVEL_2_EXTRA_ATTRIBUTE),
    )
    expect(carriers.map((r) => r.level)).toEqual([2])
    const note = ladderSpecification(2, LEVEL_2_EXTRA_ATTRIBUTE)
    expect(note).toBeDefined()
    // It is the row that admits Level 2 is mostly theoretical here, so the
    // named dependencies must survive transcription, not just the first clause.
    expect(note).toContain('Very few AVIIXA dependencies have an approved alternate')
    for (const named of [
      'single platform-contracted email vendor',
      'single audit log per tenant',
      'single stated deployment region at V1',
      'sole system of record',
    ]) {
      expect(note).toContain(named)
    }
    // And it is genuinely the source's line, not a paraphrase assembled here.
    const line = at(
      at(FALLBACK_LADDER, 2, 'level 2').attributes.filter(
        (a) => a.attribute === LEVEL_2_EXTRA_ATTRIBUTE,
      ),
      0,
      'honest scope note',
    ).line
    expect(L(line)).toContain(note as string)
  })

  it('resolves a rung and an attribute by key, never by position', () => {
    expect(ladderRung(6)?.name).toBe(at(levelHeadings, 6, 'level 6').name)
    expect(ladderSpecification(0, LEVEL_2_EXTRA_ATTRIBUTE)).toBeUndefined()
    expect(ladderSpecification(7, 'Exit condition')).toBeDefined()
  })
})

describe('DEC-FB-002 is two lettered sub-decisions, and is never merged', () => {
  const occurrences = (needle: string): number[] => {
    const hits: number[] = []
    for (let n = 1; n <= sourceLines.length; n += 1) if (L(n).includes(needle)) hits.push(n)
    return hits
  }

  it('the source raises DEC-FB-002 but writes no card for it', () => {
    // Bare, meaning not followed by a letter. Two mentions in the whole
    // document: the sentence raising it, and the decision index row.
    const bare: number[] = []
    for (let n = 1; n <= sourceLines.length; n += 1) if (/DEC-FB-002(?![a-z])/.test(L(n))) bare.push(n)
    expect(bare).toHaveLength(2)
    expect(at(bare, 0, 'raised')).toBeLessThan(at(bare, 1, 'index'))
    expect(L(at(bare, 0, 'raised'))).toContain('are raised here')
    expect(L(at(bare, 1, 'index'))).toContain('Universal Fallback Architecture')
  })

  it('the two cards exist, once each, in two different contracts', () => {
    const a = occurrences('DEC-FB-002a')
    const b = occurrences('DEC-FB-002b')
    expect(a).toHaveLength(1)
    expect(b).toHaveLength(1)
    expect(L(at(a, 0, 'a'))).toContain('the maximum size and count of evidence media')
    expect(L(at(b, 0, 'b'))).toContain('the device-storage occupancy')
    // Each sits inside exactly one contract, and not the same one.
    expect(owningContract(at(a, 0, 'a'))).toBe('FB-UPLOAD-002')
    expect(owningContract(at(b, 0, 'b'))).toBe('FB-CAP-002')
  })

  it('this build carries both letters and invents no merged card', () => {
    expect([...FALLBACK_DECISION_REFS]).toContain('DEC-FB-002a')
    expect([...FALLBACK_DECISION_REFS]).toContain('DEC-FB-002b')
    expect([...FALLBACK_DECISION_REFS]).not.toContain(UNCARDED_DECISION_REF)
    expect(FALLBACK_LOCAL_DISCLOSURES.map((d) => d.decisionRef)).toEqual([...FALLBACK_DECISION_REFS])
    const a = FALLBACK_LOCAL_DISCLOSURES.filter((d) => d.decisionRef === 'DEC-FB-002a')
    const b = FALLBACK_LOCAL_DISCLOSURES.filter((d) => d.decisionRef === 'DEC-FB-002b')
    // Different questions, not one question under two letters.
    expect(at(a, 0, 'a').question).not.toBe(at(b, 0, 'b').question)
    expect(at(a, 0, 'a').bearsOn).toEqual(['FB-UPLOAD-002'])
    expect(at(b, 0, 'b').bearsOn).toEqual(['FB-CAP-002'])
  })
})

describe('DEC-FB-008: both readings, both locators, neither chosen', () => {
  const record = at(
    FALLBACK_LOCAL_DISCLOSURES.filter((d) => d.decisionRef === 'DEC-FB-008'),
    0,
    'DEC-FB-008 record',
  )

  it('chapter 36 states the answer as SoW Fact, on the line the record cites', () => {
    const rows = sourceLines
      .map((line, i) => ({ line, n: i + 1 }))
      .filter((r) => r.line.startsWith('| Hold state, including the automatic Severity 1 hold |'))
    expect(rows).toHaveLength(1)
    const row = at(rows, 0, 'hold state row')
    expect(row.line).toContain('The hold stands; no device write lifts it')
    expect(row.line).toContain('SoW Fact')
    expect(row.line).toContain('Never resolvable as a sync conflict')
    // The record's own locator names that line, and it is that line.
    expect(at(record.readings, 0, 'chapter 36 reading').locator).toContain(`L${row.n}`)
  })

  it('chapter 38 records the same question open, on the line the record cites', () => {
    const rows = sourceLines
      .map((line, i) => ({ line, n: i + 1 }))
      .filter((r) => r.line.includes('records the contradiction as `DEC-FB-008`'))
    expect(rows).toHaveLength(1)
    const row = at(rows, 0, 'DEC-FB-008 paragraph')
    expect(row.line).toContain('preserves both readings; it does not choose')
    expect(row.line).toContain('Client Decision Required')
    expect(at(record.readings, 1, 'chapter 38 reading').locator).toContain(`L${row.n}`)
  })

  it('carries both readings and gives neither a field it could be marked in', () => {
    expect(record.readings.length).toBeGreaterThanOrEqual(2)
    // Structural, not textual: `DecisionReading` has exactly two fields, so
    // there is nowhere to write `preferred` even by accident. A word-presence
    // check on the prose would be beatable by the prose; this is not.
    for (const reading of record.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
    }
    // Both chapters are present as separate readings with separate locators.
    const locators = record.readings.map((r) => r.locator)
    expect(new Set(locators).size).toBe(locators.length)
    expect(locators.some((l) => l.includes('L80192'))).toBe(true)
    expect(locators.some((l) => l.includes('L82477'))).toBe(true)
  })

  it('adopts nothing, and says which contracts the question bites', () => {
    expect(record.adopted.startsWith('NOTHING.')).toBe(true)
    expect(record.bearsOn.length).toBeGreaterThan(0)
    for (const id of record.bearsOn) {
      const contract = fallbackContract(id)
      expect(contract).toBeDefined()
      // Named because their own transcribed text carries the floor and the
      // hold, not because a brief nominated them.
      const text = Object.values(contract?.cells ?? {}).join(' ')
      expect(text).toContain('Severity 1')
    }
    // The source never attaches DEC-FB-008 to a contract, and this build does
    // not pretend it did: no transcribed cell names it.
    expect(FALLBACK_CONTRACTS.some((c) => Object.values(c.cells).join(' ').includes('DEC-FB-008'))).toBe(
      false,
    )
  })
})

describe('the canon gate: every identifier here is ABSENT from src/disclosure/decisions.ts', () => {
  it('holds for all three, and turns red the moment one is lifted', () => {
    const canon = OPEN_DECISION_IDS as readonly string[]
    expect(canon.length).toBeGreaterThan(0)
    for (const ref of FALLBACK_DECISION_REFS) expect(canon).not.toContain(ref)
    expect(canon).not.toContain(UNCARDED_DECISION_REF)
  })

  it('every local record declares why it is local, and carries a locator per reading', () => {
    for (const record of FALLBACK_LOCAL_DISCLOSURES) {
      /**
       * PLANTED AND FOUND WANTING. This first read `toContain('canon')`, and a
       * plant that gutted the note left the trailing sentence intact — the
       * word survived, the gate stayed green, and the note said nothing. The
       * checkable content is that the note names its OWN identifier and states
       * the canon holds no record of it; a note that names a neighbour's
       * identifier, or that does not say the record is missing, now fails.
       */
      expect(record.canonNote).toContain(record.decisionRef)
      expect(record.canonNote).toMatch(/carries no record/)
      expect(record.readings.length).toBeGreaterThan(0)
      for (const reading of record.readings) {
        expect(reading.text.trim().length).toBeGreaterThan(0)
        expect(reading.locator).toMatch(/L\d{3,6}/)
      }
    }
  })
})

describe('every line number this build ships is a line that carries what is claimed', () => {
  it('holds for the contract headings, the field tables, and the ladder', () => {
    for (const contract of FALLBACK_CONTRACTS) {
      expect(L(contract.headingLine)).toBe(contract.heading)
      expect(L(contract.tableLine)).toBe('| Field | Specification |')
      expect(contract.tableLine).toBeGreaterThan(contract.headingLine)
    }
    for (const field of FALLBACK_TEMPLATE_FIELDS) {
      expect(L(field.line).startsWith(`| ${field.number} | ${field.field} |`)).toBe(true)
    }
    for (const rung of FALLBACK_LADDER) {
      expect(L(rung.headingLine)).toBe(rung.heading)
      for (const attr of rung.attributes) {
        expect(L(attr.line).startsWith(`| ${attr.attribute} |`)).toBe(true)
      }
    }
    for (const family of FALLBACK_FAMILIES) {
      expect(L(family.line).startsWith(`| ${family.family} |`)).toBe(true)
    }
  })
})

describe('FB-* is a wider namespace than this library, and the look-alikes are named', () => {
  const declaredPrefixes = new Set(FALLBACK_FAMILIES.map((f) => f.prefix as string))

  it('every look-alike is real, is shaped like a library identifier, and is not one', () => {
    expect(FB_IDS_OUTSIDE_THE_LIBRARY.length).toBeGreaterThan(0)
    const shipped = new Set<string>(FALLBACK_CONTRACT_IDS)
    for (const id of FB_IDS_OUTSIDE_THE_LIBRARY) {
      // Real: it is in the frozen source.
      expect(sourceLines.some((line) => line.includes(id))).toBe(true)
      // Shaped like one: a declared family prefix and a three-digit ordinal.
      expect(id).toMatch(/^FB-[A-Z]+-\d{3}$/)
      expect(declaredPrefixes.has(id.replace(/-\d{3}$/, ''))).toBe(true)
      // And not one: absent from the seventy, and never a contract heading.
      expect(shipped.has(id)).toBe(false)
      expect(sourceHeadings.some((h) => h.id === id)).toBe(false)
    }
  })

  it('is complete: no other identifier of that exact shape sits outside the seventy', () => {
    const shipped = new Set<string>(FALLBACK_CONTRACT_IDS)
    const found = new Set<string>()
    for (const line of sourceLines) {
      for (const m of line.matchAll(/(?<![A-Za-z0-9-])FB-[A-Z]+-\d{3}(?![A-Za-z0-9-])/g)) {
        const id = m[0]
        if (!shipped.has(id) && declaredPrefixes.has(id.replace(/-\d{3}$/, ''))) found.add(id)
      }
    }
    // Derived from the source, then compared. A look-alike that appears later
    // and is not listed turns this red rather than going unnoticed.
    expect([...found].sort()).toEqual([...FB_IDS_OUTSIDE_THE_LIBRARY].sort())
  })
})
