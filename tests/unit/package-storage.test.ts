import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'
import { isForeignProbe } from '../probe-paths'

import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { A2_DISCLOSURES } from '@/frontline/modules/fl-a2/service'
import {
  DEC_STORE_001,
  DEC_STORE_001_SHIPPED_RECORDS,
  STORAGE_ACCEPTANCE,
  STORAGE_FULL_OPTION_SET_DIVERGENCE,
  STORAGE_LOCATORS,
  STORAGE_POSITIONS,
  STORAGE_RULES,
  STORAGE_SHAPE,
  STORAGE_TABLE_CENSUS,
  STORAGE_TESTS,
  mayEvict,
  storageRule,
  type EvictionCandidate,
} from '@/offline/package/storage'

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const srcLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

const cellsOf = (n: number): readonly string[] =>
  srcLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

describe('§35.5 opens where this module says it does', () => {
  it('the section heading is at the cited line', () => {
    expect(srcLine(STORAGE_LOCATORS.section)).toBe(
      '## 35.5 Storage discipline and the deferred storage-full behaviour',
    )
  })

  it('the source says four storage positions and this module carries four', () => {
    expect(srcLine(STORAGE_LOCATORS.positionsIntro)).toContain('The source states four storage positions')
    expect(STORAGE_POSITIONS).toHaveLength(4)
    expect(STORAGE_SHAPE.positions).toBe(4)
  })

  it.each(STORAGE_POSITIONS.map((p) => [p.n, p] as const))(
    'position %d is transcribed from its own numbered source line',
    (n, p) => {
      const line = srcLine(p.sourceRef)
      expect(line.startsWith(`${n}. `)).toBe(true)
      expect(line).toContain(p.statement)
    },
  )

  it('the fourth position IS the deferral, and names DEC-STORE-001 on its own line', () => {
    expect(STORAGE_POSITIONS[3]?.id).toBe('storage-full-deferred')
    expect(srcLine(STORAGE_POSITIONS[3]?.sourceRef ?? 0)).toContain('DEC-STORE-001')
  })
})

/* ==================================================================== *
 * THE STORAGE-RULES MATRIX.
 * ==================================================================== */

describe('the storage-rules matrix, against the frozen source', () => {
  it('the header carries its four columns, in order', () => {
    expect(cellsOf(STORAGE_LOCATORS.rulesHeader)).toEqual([
      'Rule',
      'Enforcement point',
      'Behaviour under an outage',
      'Status',
    ])
    expect(srcLine(STORAGE_LOCATORS.rulesHeader + 1)).toMatch(/^\|(?:---\|){4}$/)
  })

  it('seven data rows, consecutive, and the line after the last is not one', () => {
    expect(STORAGE_LOCATORS.rulesLastRow - STORAGE_LOCATORS.rulesFirstRow + 1).toBe(7)
    expect(STORAGE_RULES).toHaveLength(7)
    expect(STORAGE_RULES.map((r) => r.sourceRef)).toEqual(
      Array.from({ length: 7 }, (_, i) => STORAGE_LOCATORS.rulesFirstRow + i),
    )
    expect(srcLine(STORAGE_LOCATORS.rulesLastRow + 1).startsWith('|')).toBe(false)
  })

  it.each(STORAGE_RULES.map((r) => [r.id, r] as const))(
    'row %s matches its source line cell for cell',
    (_id, row) => {
      const cells = cellsOf(row.sourceRef)
      expect(cells).toHaveLength(4)
      expect(cells[0]).toBe(row.rule)
      expect(cells[1]).toBe(row.enforcementPoint)
      expect(cells[2]).toBe(row.underOutage)
      expect(cells[3]).toBe(row.statusText)
    },
  )

  it('`Allowed` is a PREFIX of `Allowed with conditions` and the two are not conflated', () => {
    // Four rows open `Allowed` and exactly one opens `Allowed with
    // conditions`. Matched on the closing backtick so the prefix cannot pass
    // for the longer token.
    const plainAllowed = STORAGE_RULES.filter((r) => r.statusText.startsWith('`Allowed` '))
    const withConditions = STORAGE_RULES.filter((r) =>
      r.statusText.startsWith('`Allowed with conditions` '),
    )
    expect(plainAllowed.map((r) => r.id)).toEqual([
      'eviction-after-receipt-and-integrity',
      'today-fully-staged',
      'near-horizon-lazy',
      'minimal-scope',
    ])
    expect(withConditions.map((r) => r.id)).toEqual(['coaching-assets-storage-conditional'])
    for (const r of plainAllowed) expect(r.outcome).toBe('allowed')
    for (const r of withConditions) expect(r.outcome).toBe('allowedWithConditions')
  })

  it('the gallery row prohibits the INVERSE, and the module says which', () => {
    const row = storageRule('never-device-gallery')
    expect(row.statusText).toContain('`Explicitly prohibited` to do otherwise')
    expect(row.outcome).toBe('explicitlyProhibited')
    // Read alone, that token against the rule "Media never touches the device
    // gallery" would prohibit the protection. The subject is named.
    expect(row.outcomeAppliesTo).not.toBe('the rule as stated')
    expect(row.outcomeAppliesTo).toContain('doing otherwise')
  })

  it('the exhausted row is the only Client Decision Required row', () => {
    const cdr = STORAGE_RULES.filter((r) => r.outcome === 'clientDecisionRequired')
    expect(cdr.map((r) => r.id)).toEqual(['storage-exhausted'])
    expect(cdr[0]?.enforcementPoint).toBe('Deferred')
  })
})

/* ==================================================================== *
 * THE EVICTION GATE.
 * ==================================================================== */

describe('mayEvict — one route to eviction, through three confirmations', () => {
  const candidate = (
    receiptConfirmed: boolean,
    integrityCheckPassed: boolean,
    runCompleteAndSynced: boolean,
  ): EvictionCandidate => ({
    objectId: 'MEDIA-1',
    receiptConfirmed,
    integrityCheckPassed,
    runCompleteAndSynced,
  })

  const ALL = [false, true].flatMap((a) =>
    [false, true].flatMap((b) => [false, true].map((c) => [a, b, c] as const)),
  )

  it('exactly one of the eight combinations evicts', () => {
    const evicting = ALL.filter(([a, b, c]) => mayEvict(candidate(a, b, c)).evict)
    expect(evicting).toEqual([[true, true, true]])
  })

  it('an attempted upload is not receipt — AC-PKG-501, and the source says it', () => {
    expect(srcLine(79436)).toContain('An attempted upload is not receipt')
    const v = mayEvict(candidate(false, true, true))
    expect(v.evict).toBe(false)
    expect(v.evict === false && v.retainedBecause).toBe('receipt-not-confirmed')
  })

  it('receipt without an integrity check is not proof of a usable file', () => {
    expect(srcLine(79436)).toContain('receipt without an integrity check is not proof of a usable file')
    const v = mayEvict(candidate(true, false, true))
    expect(v.evict === false && v.retainedBecause).toBe('integrity-check-not-passed')
  })

  it('the third confirmation is complete-and-synced, and it is the diagram’s own node', () => {
    expect(srcLine(79449)).toContain('Eligible for eviction once the run is complete and synced')
    const v = mayEvict(candidate(true, true, false))
    expect(v.evict === false && v.retainedBecause).toBe('run-not-complete-and-synced')
  })

  it('AC-PKG-502 needs no mode list: every unconfirmable mode is receipt-not-confirmed', () => {
    expect(srcLine(STORAGE_LOCATORS.evictionCoupling)).toContain(
      'is also a mode in which eviction must stop',
    )
    // The three outage modes the source names on that line, each presenting
    // to the eviction routine the same way: receipt cannot be confirmed.
    for (const mode of ['the upload service unavailable', 'the object store unavailable', 'the database unavailable']) {
      expect(srcLine(STORAGE_LOCATORS.evictionCoupling)).toContain(mode)
    }
    expect(mayEvict(candidate(false, true, true)).evict).toBe(false)
  })

  it('every refusal names its own source line', () => {
    for (const [a, b, c] of ALL) {
      const v = mayEvict(candidate(a, b, c))
      if (v.evict) continue
      expect(srcLine(v.sourceRef)).toContain(v.line)
    }
  })
})

/* ==================================================================== *
 * `DEC-STORE-001` — CONSUMED, NOT RESPELLED, AND STILL ABSENT FROM THE CANON.
 * ==================================================================== */

describe('DEC-STORE-001 is read from the shipped record', () => {
  it('this module re-exports MOD-FL-A2 own object, identically', () => {
    const a2 = A2_DISCLOSURES.find((d) => d.decisionRef === 'DEC-STORE-001')
    expect(DEC_STORE_001).toBe(a2)
  })

  it('the stand-in is built to expire: the identifier is ABSENT from the canon', () => {
    expect((OPEN_DECISION_IDS as readonly string[]).includes('DEC-STORE-001')).toBe(false)
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    expect(canon).not.toContain('DEC-STORE-001')
  })

  it('exactly four files hold a record keyed to it, and this is not one', () => {
    // Recounted from the tree, not asserted. The brief said three modules
    // disclose it; MOD-FL-A6 is the fourth and was missed by that count.
    // `isForeignProbe` is required, not optional politeness: every gate in
    // this build proves it can fail by planting a scratch file on the real
    // shared filesystem, so two suites running at once walk each other's
    // probes and one ENOENTs the moment the other's `finally` removes it.
    // `tests/coverage/prohibited-patterns.test.ts` is the gate whose whole
    // subject is directory walks that do not ask, and it caught this one.
    const walk = (dir: string): readonly string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        if (isForeignProbe(e.name)) return []
        const p = join(dir, e.name)
        if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p)
        return /\.tsx?$/.test(e.name) ? [p] : []
      })
    const root = join(process.cwd(), 'src')
    const holders = walk(root)
      .filter((p) => /^\s*(?:id|decisionRef):\s*'DEC-STORE-001',?\s*$/m.test(readFileSync(p, 'utf8')))
      .map((p) => relative(process.cwd(), p))
      .sort()
    expect(holders).toEqual([...DEC_STORE_001_SHIPPED_RECORDS])
    expect(holders).not.toContain('src/offline/package/storage.ts')
  })

  it('no fifth spelling: this module declares no disclosure record of its own', () => {
    const mine = readFileSync(join(process.cwd(), 'src/offline/package/storage.ts'), 'utf8')
    // The three shipped records each carry an `adopted` field. A fourth would
    // too; this module has none, and its divergence record has none either.
    expect(mine).not.toMatch(/^\s*adopted:/m)
    expect(STORAGE_FULL_OPTION_SET_DIVERGENCE).not.toHaveProperty('adopted')
  })
})

describe('the two treatments of DEC-STORE-001 name different option sets', () => {
  it('L40116 names three options and no fourth', () => {
    const line = srcLine(STORAGE_LOCATORS.optionsThree)
    expect(line).toContain('The options are (a) block new capture with a clear message and force a sync')
    expect(line).toContain('(c) refuse to start additional Runs while permitting completion of Runs in progress')
    expect(line).toContain('The recommendation is a combination of (b) and (c) with (a) as the terminal state')
    expect(line).not.toContain('(d)')
  })

  it('L79469 names four, and its (a) is not L40116 (a)', () => {
    const line = srcLine(STORAGE_LOCATORS.optionsFour)
    expect(line).toContain('(a) Hard stop at a reserved-capacity threshold')
    expect(line).toContain('(d) Block new run entry while allowing the current unit to complete')
    expect(line).not.toContain('block new capture with a clear message and force a sync')
  })

  it('the recommended orders differ, and both are on the lines this module cites', () => {
    expect(srcLine(STORAGE_LOCATORS.recommendationLayered)).toContain(
      'a layered combination of (c) then (d) then (a), in that order',
    )
    expect(srcLine(STORAGE_LOCATORS.decisionOwner)).toContain(
      "The client's product owner with the Quality Manager function",
    )
    expect(srcLine(STORAGE_LOCATORS.optionsThree)).toContain(
      'Decision owner: the client, through the Frontline Functional Specification',
    )
  })

  it('both readings are recorded, with their locators, and neither is chosen', () => {
    expect(STORAGE_FULL_OPTION_SET_DIVERGENCE.readings).toHaveLength(2)
    const locators = STORAGE_FULL_OPTION_SET_DIVERGENCE.readings.map((r) => r.locator)
    expect(locators[0]).toContain('L40116')
    expect(locators[1]).toContain('L79469')
    // The canon's `DecisionReading` has exactly two fields, so no reading can
    // be marked the answer.
    for (const r of STORAGE_FULL_OPTION_SET_DIVERGENCE.readings) {
      expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
    }
  })

  it('the shipped disclosure carries the three-option reading and not the four', () => {
    const texts = DEC_STORE_001.readings.map((r) => r.text).join(' ')
    expect(texts).toContain('(c) refuse to start additional Runs')
    expect(texts).not.toContain('Block new run entry')
  })
})

/* ==================================================================== *
 * `AC-PKG-505` / `TEST-PKG-505` — THE STATIC ANALYSIS, RUN.
 * ==================================================================== */

describe('no storage-full behaviour and no reserved-capacity threshold is implemented', () => {
  const OWNED = ['src/offline/package/storage.ts', 'src/offline/package/delivery.ts'] as const

  it.each(OWNED)('%s binds no threshold, capacity, quota or budget to a number', (path) => {
    const text = readFileSync(join(process.cwd(), path), 'utf8')
    const code = text
      .split('\n')
      .filter((l) => !/^\s*(?:\*|\/\*|\/\/)/.test(l))
      .join('\n')
    expect(code).not.toMatch(
      /\b\w*(?:threshold|capacity|quota|budget|reserved|maxBytes|freeSpace)\w*\s*[:=]\s*-?\d/i,
    )
  })

  it.each(OWNED)('%s implements none of the four candidate behaviours', (path) => {
    const text = readFileSync(join(process.cwd(), path), 'utf8')
    const code = text
      .split('\n')
      .filter((l) => !/^\s*(?:\*|\/\*|\/\/)/.test(l))
      .join('\n')
    // Not a word sweep over prose — comments are stripped first, so the
    // quotations in the divergence record and the header block cannot satisfy
    // or defeat this. What is banned is a function that DOES one of them.
    expect(code).not.toMatch(/function\s+\w*(?:evict|degrade|refuse|hardStop|blockEntry)\w*Under/i)
    expect(code).not.toMatch(/\bdegradeCaptureFidelity\b|\bhardStop\b|\bblockNewRunEntry\b/)
  })
})

/* ==================================================================== *
 * ACCEPTANCE CRITERIA, TESTS, AND THE TABLE CENSUS.
 * ==================================================================== */

describe('§35.5 acceptance criteria and tests', () => {
  it.each(STORAGE_ACCEPTANCE.map((a) => [a.id, a] as const))(
    '%s matches its source row cell for cell',
    (_id, a) => {
      const cells = cellsOf(a.sourceRef)
      expect(cells[0]).toBe(`\`${a.id}\``)
      expect(cells[1]).toBe(a.statement)
      expect(cells[2]).toBe(a.sourceStatus)
    },
  )

  it.each(STORAGE_TESTS.map((t) => [t.id, t] as const))(
    '%s matches its source row cell for cell',
    (_id, t) => {
      const cells = cellsOf(t.sourceRef)
      expect(cells[0]).toBe(`\`${t.id}\``)
      expect(cells[1]).toBe(t.test)
      expect(cells[2]).toBe(t.method)
    },
  )

  it('five and five, unlike §35.4', () => {
    expect(STORAGE_SHAPE.acceptanceCriteria).toBe(5)
    expect(STORAGE_SHAPE.tests).toBe(5)
  })
})

describe('§35.5’s tables, counted from the source rather than claimed', () => {
  const SECTION_LAST = 79511
  const tableLines = Array.from(
    { length: SECTION_LAST - STORAGE_LOCATORS.section + 1 },
    (_, i) => STORAGE_LOCATORS.section + i,
  ).filter((n) => srcLine(n).startsWith('|'))

  it('there are exactly three tables in the section', () => {
    expect(STORAGE_TABLE_CENSUS.tables).toHaveLength(3)
    const separators = tableLines.filter((n) => /^\|(?:---\|)+$/.test(srcLine(n)))
    expect(separators).toHaveLength(3)
    expect(separators).toEqual(STORAGE_TABLE_CENSUS.tables.map((t) => t.separator))
  })

  it('seventeen data rows — and twenty-three only if headers and separators count', () => {
    // The brief said twenty-three rows. Twenty-three is every pipe-leading
    // line in the section; seventeen is the data. A shape check that rests on
    // the larger number passes on a table whose only body is its separator,
    // because `|---|---|` splits into non-empty cells.
    expect(tableLines).toHaveLength(23)
    expect(STORAGE_TABLE_CENSUS.linesIncludingHeadersAndSeparators).toBe(23)
    const data = tableLines.filter(
      (n) => !/^\|(?:---\|)+$/.test(srcLine(n)) && !STORAGE_TABLE_CENSUS.tables.some((t) => t.header === n),
    )
    expect(data).toHaveLength(17)
    expect(STORAGE_TABLE_CENSUS.dataRows).toBe(17)
    expect(
      STORAGE_TABLE_CENSUS.tables.reduce((n, t) => n + t.dataRows, 0),
    ).toBe(17)
  })

  it('DEC-STORE-001 appears SIX times in §35.5, not three', () => {
    const hits = Array.from(
      { length: SECTION_LAST - STORAGE_LOCATORS.section + 1 },
      (_, i) => STORAGE_LOCATORS.section + i,
    ).filter((n) => srcLine(n).includes('DEC-STORE-001'))
    expect(hits).toEqual([...STORAGE_SHAPE.decStore001MentionLines])
    expect(hits).toHaveLength(6)
    expect(STORAGE_SHAPE.decStore001MentionsInSection).toBe(6)
  })

  it('§35.6 opens on the line after the section this module counted to', () => {
    expect(srcLine(SECTION_LAST + 1)).toBe(
      '## 35.6 Integrity, revocation, replacement, rollback and incompatible versions',
    )
  })
})
