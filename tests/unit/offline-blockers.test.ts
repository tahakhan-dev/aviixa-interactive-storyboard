import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { CAPTURE_UPLOAD_STEP } from '@/offline/protocol'
import {
  AUTHORIZATION_LIMIT_LOCATORS,
  AUTHORIZATION_RULES,
  AUTHORIZATION_RULES_CLAIM_LINE,
  BLOCKER_CLASSIFICATIONS,
  BLOCKER_COUNT,
  BLOCKER_REGISTER_LOCATORS,
  FAMILY_COUNT_READINGS,
  FAMILY_CRITERION_PREFIX,
  FORCED_SYNC_OFFLINE_BLOCKER,
  OFFLINE_AUTHORIZATION_LIMITS,
  OFFLINE_BLOCKERS,
  REGISTER_SELF_CLAIMS,
  REVALIDATION_STEPS,
  REVALIDATION_STEPS_CLAIM_LINE,
  TRUST_WINDOW_EXPIRY_BLOCKER,
  UNRECOVERABLE_DATA_BLOCKER,
  blockerFamilyCounts,
  blockersClassified,
  classificationOf,
  findBlocker,
  type BlockerFamily,
} from '@/offline/blockers'

/** As in `offline-capability.test.ts`: the frozen source, never a registry. */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_TEXT = readFileSync(SOURCE_PATH, 'utf8')
const SOURCE_LINES = SOURCE_TEXT.split('\n')
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''
/** Markdown cells, backticks removed, exactly as the module stores them. */
const cellsOf = (n: number): readonly string[] =>
  sourceLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim().replace(/`/g, ''))

const FAMILIES: readonly BlockerFamily[] = [
  'Content',
  'Authority',
  'Device',
  'Intelligence',
  'Distributed',
]

/** The five §37 subsections that carry blocker detail entries, spans measured. */
const SECTION_SPANS: readonly (readonly [string, number, number])[] = [
  ['37.2', 80889, 80976],
  ['37.3', 80977, 81037],
  ['37.4', 81038, 81087],
  ['37.5', 81088, 81119],
  ['37.6', 81120, 81201],
]

/** Every line in §37.2-§37.6 that opens a blocker detail entry. */
const DETAIL_ENTRY_LINES: readonly number[] = (() => {
  const out: number[] = []
  for (let n = 80889; n <= 81201; n += 1) {
    if (/^\*\*`OFF-BLK-\d\d`/.test(sourceLine(n))) out.push(n)
  }
  return out
})()

describe('the frozen source is the one this build was written against', () => {
  it('is 122,241 lines', () => {
    expect(SOURCE_LINES.length - (SOURCE_TEXT.endsWith('\n') ? 1 : 0)).toBe(122241)
  })
})

describe('the register index table, counted rather than inferred from its span', () => {
  const { headerLine, separatorLine, firstDataLine, lastDataLine } = BLOCKER_REGISTER_LOCATORS

  it('has the five columns the module is keyed on, named', () => {
    expect(cellsOf(headerLine)).toEqual([
      'Identifier',
      'Blocker',
      'Family',
      'Worker outcome',
      'Source status',
    ])
  })

  it('separates with five columns and stops at the line the module names', () => {
    expect(sourceLine(separatorLine)).toBe('|---|---|---|---|---|')
    expect(sourceLine(firstDataLine - 1)).toBe(sourceLine(separatorLine))
    expect(sourceLine(lastDataLine).startsWith('| `OFF-BLK-')).toBe(true)
    expect(sourceLine(lastDataLine + 1).startsWith('|')).toBe(false)
  })

  it('carries thirty-seven data rows, counted one line at a time', () => {
    let rows = 0
    for (let n = firstDataLine; n <= lastDataLine; n += 1) {
      expect(cellsOf(n), `L${n}`).toHaveLength(5)
      expect(cellsOf(n)[0], `L${n}`).toMatch(/^OFF-BLK-\d\d$/)
      rows += 1
    }
    expect(rows).toBe(37)
    expect(BLOCKER_COUNT).toBe(37)
  })

  it('is transcribed cell by cell, every row, against its own line', () => {
    for (const b of OFFLINE_BLOCKERS) {
      expect(cellsOf(b.indexLine), b.identifier).toEqual([
        b.identifier,
        b.blocker,
        b.family,
        b.workerOutcome,
        b.sourceStatus,
      ])
    }
  })

  it('numbers OFF-BLK-01 to OFF-BLK-37 with no gap and no repeat', () => {
    expect(OFFLINE_BLOCKERS.map((b) => b.identifier)).toEqual(
      Array.from({ length: 37 }, (_, i) => `OFF-BLK-${String(i + 1).padStart(2, '0')}`),
    )
    expect(OFFLINE_BLOCKERS.map((b) => b.indexLine)).toEqual(
      Array.from({ length: 37 }, (_, i) => 81162 + i),
    )
  })
})

describe('every detailLine opens its own blocker entry, in its own section', () => {
  it('there are thirty-seven detail entries and the module points at each once', () => {
    expect(DETAIL_ENTRY_LINES).toHaveLength(37)
    expect([...OFFLINE_BLOCKERS.map((b) => b.detailLine)].sort((a, b) => a - b)).toEqual([
      ...DETAIL_ENTRY_LINES,
    ])
  })

  it("each detailLine's own line names that blocker and no other", () => {
    for (const b of OFFLINE_BLOCKERS) {
      expect(sourceLine(b.detailLine).startsWith(`**\`${b.identifier}\` — `), b.identifier).toBe(
        true,
      )
    }
  })

  it('each detailLine falls inside the section the module records', () => {
    for (const b of OFFLINE_BLOCKERS) {
      const span = SECTION_SPANS.find(([id]) => id === b.section)
      expect(span, b.identifier).toBeDefined()
      const [, from, to] = span!
      expect(b.detailLine >= from && b.detailLine <= to, `${b.identifier} L${b.detailLine}`).toBe(
        true,
      )
    }
  })
})

describe('the family counts, taken three ways from three parts of the source', () => {
  /** Reading 1: re-read the Family column, not the module. */
  const fromIndexColumn = (): Record<string, number> => {
    const counts: Record<string, number> = {}
    for (let n = 81162; n <= 81198; n += 1) {
      const family = cellsOf(n)[2]!
      counts[family] = (counts[family] ?? 0) + 1
    }
    return counts
  }

  /** Reading 2: which §37 subsection holds each detail entry. */
  const fromSectionMembership = (): Record<string, number> => {
    const bySection: Record<string, number> = {}
    for (const n of DETAIL_ENTRY_LINES) {
      const [id] = SECTION_SPANS.find(([, from, to]) => n >= from && n <= to)!
      bySection[id] = (bySection[id] ?? 0) + 1
    }
    return bySection
  }

  /**
   * Reading 3: how many distinct acceptance criteria each section numbers
   * itself. Measured over all 122,241 lines, so it is the source's own
   * numbering rather than anything this file arranged.
   */
  const fromCriterionFamily = (prefix: string): number =>
    new Set(SOURCE_TEXT.match(new RegExp(`${prefix}\\d\\d`, 'g')) ?? []).size

  it('reading one — the index column — gives 12 / 10 / 8 / 4 / 3', () => {
    expect(fromIndexColumn()).toEqual({
      Content: 12,
      Authority: 10,
      Device: 8,
      Intelligence: 4,
      Distributed: 3,
    })
  })

  it('reading two — section membership — gives the same five numbers', () => {
    expect(fromSectionMembership()).toEqual({
      '37.2': 12,
      '37.3': 10,
      '37.4': 8,
      '37.5': 3,
      '37.6': 4,
    })
  })

  it('reading three — the acceptance-criterion families — gives the same five numbers', () => {
    for (const family of FAMILIES) {
      expect(fromCriterionFamily(FAMILY_CRITERION_PREFIX[family]), family).toBe(
        fromIndexColumn()[family],
      )
    }
  })

  it('the module agrees with all three, and the three sum to thirty-seven', () => {
    const counts = blockerFamilyCounts()
    expect(counts).toEqual(fromIndexColumn())
    for (const reading of FAMILY_COUNT_READINGS) {
      expect(reading.counts, reading.reading).toEqual(counts)
    }
    expect(FAMILIES.reduce((n, f) => n + counts[f], 0)).toBe(37)
  })

  it("each blocker's family matches the section its detail entry sits in", () => {
    const sectionForFamily: Readonly<Record<BlockerFamily, string>> = {
      Content: '37.2',
      Authority: '37.3',
      Device: '37.4',
      Distributed: '37.5',
      Intelligence: '37.6',
    }
    for (const b of OFFLINE_BLOCKERS) {
      const [id] = SECTION_SPANS.find(([, from, to]) => b.detailLine >= from && b.detailLine <= to)!
      expect(id, b.identifier).toBe(sectionForFamily[b.family])
    }
  })
})

describe('Source status is per row, and the column is not a closed vocabulary', () => {
  it('every row opens with exactly one of the three classifications, read from the source', () => {
    for (const b of OFFLINE_BLOCKERS) {
      const cell = cellsOf(b.indexLine)[4]!
      const hits = BLOCKER_CLASSIFICATIONS.filter((c) => cell.startsWith(c))
      expect(hits, `${b.identifier} — ${cell}`).toHaveLength(1)
      expect(classificationOf(b), b.identifier).toBe(hits[0])
    }
  })

  it('the classifications split 20 / 7 / 10, not one classification for the table', () => {
    expect(blockersClassified('SoW Fact')).toHaveLength(20)
    expect(blockersClassified('Derived Clarification')).toHaveLength(7)
    expect(blockersClassified('User-Mandated Product Extension')).toHaveLength(10)
    expect(new Set(OFFLINE_BLOCKERS.map((b) => classificationOf(b))).size).toBe(3)
  })

  it("the ten agree with the register's own traceability sentence", () => {
    expect(sourceLine(BLOCKER_REGISTER_LOCATORS.traceabilityLine)).toContain(
      'Ten blockers are `User-Mandated Product Extension` additions with inline justification.',
    )
    expect(blockersClassified('User-Mandated Product Extension')).toHaveLength(10)
  })

  it('the cells are not the three strings — five shapes are present, verbatim', () => {
    const bare = new Set<string>(BLOCKER_CLASSIFICATIONS)
    const shapes = new Set(OFFLINE_BLOCKERS.map((b) => b.sourceStatus))
    expect(shapes.size).toBeGreaterThan(bare.size)
    expect(findBlocker('OFF-BLK-05')?.sourceStatus).toBe('SoW Fact — §7.10.7 with an open item')
    expect(findBlocker('OFF-BLK-02')?.sourceStatus).toBe('Derived Clarification from §7.10.6')
    expect(findBlocker('OFF-BLK-03')?.sourceStatus).toBe('Derived Clarification')
  })
})

describe('§37.1 states three rules and tabulates six values, and they are not one list', () => {
  it('the section claims three rules, at the line the module names', () => {
    expect(sourceLine(AUTHORIZATION_RULES_CLAIM_LINE)).toContain(
      'Three rules, each quoted from the source and each load-bearing for the whole register',
    )
    expect(AUTHORIZATION_RULES).toHaveLength(3)
  })

  it('each rule is stated at the line the module cites, in order', () => {
    const words = ['Rule one', 'Rule two', 'Rule three']
    AUTHORIZATION_RULES.forEach((rule, i) => {
      expect(sourceLine(rule.sourceLine).startsWith(`**${words[i]} — `), rule.name).toBe(true)
    })
  })

  it('the section never says "six" — the number is the table\'s row count', () => {
    const from = AUTHORIZATION_LIMIT_LOCATORS.sectionHeading
    const section = SOURCE_LINES.slice(from - 1, 80888).join('\n')
    expect(section).toContain('The Offline Authorization Limits')
    expect(/\bsix\b/i.test(section)).toBe(false)
  })
})

describe('the six offline authorization values, header-keyed and with no blank cell', () => {
  const { headerLine, separatorLine, firstDataLine, lastDataLine } = AUTHORIZATION_LIMIT_LOCATORS

  it('has the seven columns the module is keyed on, named', () => {
    expect(cellsOf(headerLine)).toEqual([
      'Value',
      'Default',
      'Platform ceiling',
      'Floor',
      'Set by',
      'Enforced where',
      'Status',
    ])
    expect(sourceLine(separatorLine)).toBe('|---|---|---|---|---|---|---|')
  })

  it('carries six data rows and stops', () => {
    let rows = 0
    for (let n = firstDataLine; n <= lastDataLine; n += 1) {
      expect(cellsOf(n), `L${n}`).toHaveLength(7)
      rows += 1
    }
    expect(rows).toBe(6)
    expect(OFFLINE_AUTHORIZATION_LIMITS).toHaveLength(6)
    expect(sourceLine(lastDataLine + 1).startsWith('|')).toBe(false)
  })

  it('is transcribed cell by cell against its own line', () => {
    for (const limit of OFFLINE_AUTHORIZATION_LIMITS) {
      expect(cellsOf(limit.sourceLine), limit.value).toEqual([
        limit.value,
        limit.defaultValue,
        limit.platformCeiling,
        limit.floor,
        limit.setBy,
        limit.enforcedWhere,
        limit.status,
      ])
    }
  })

  it('no cell is blank, which is what the table says of itself', () => {
    expect(sourceLine(AUTHORIZATION_LIMIT_LOCATORS.tableIntroLine)).toContain('No cell is blank.')
    for (const limit of OFFLINE_AUTHORIZATION_LIMITS) {
      for (const [key, cell] of Object.entries(limit)) {
        if (key === 'sourceLine') continue
        expect(String(cell).trim().length, `${limit.value}.${key}`).toBeGreaterThan(0)
      }
    }
  })

  it('the clearance duration is the one value whose bounds the source refuses to fix', () => {
    const unbounded = OFFLINE_AUTHORIZATION_LIMITS.filter((l) =>
      l.platformCeiling.startsWith('TBD — Client Decision Required'),
    )
    expect(unbounded.map((l) => l.value)).toEqual(['Qualification clearance duration'])
    expect(unbounded[0]!.floor).toContain('DEC-OFF-001')
  })
})

describe('the three revalidation steps come from the step model, not from a number read once', () => {
  it('the source line names steps 6, 10 and 22 and says what each does', () => {
    const claim = sourceLine(REVALIDATION_STEPS_CLAIM_LINE)
    expect(claim).toContain(
      'steps 6, 10 and 22 of the protocol revalidate credentials, revalidate qualifications and deliver any pending clearance',
    )
    for (const entry of REVALIDATION_STEPS) {
      expect(claim, entry.claim).toContain(entry.claim)
    }
  })

  it("each resolved step's own title in the protocol supports the claim made of it", () => {
    const [credentials, qualifications, clearance] = REVALIDATION_STEPS
    expect(credentials!.step.number).toBe(6)
    expect(credentials!.step.title).toBe('Token and certificate validation.')
    expect(qualifications!.step.number).toBe(10)
    expect(qualifications!.step.title).toBe('Qualification revalidation.')
    expect(clearance!.step.number).toBe(CAPTURE_UPLOAD_STEP)
    expect(clearance!.step.title).toContain('the enabling classes are applied')
  })

  it("each resolved step's sourceLine carries its own number in the frozen source", () => {
    for (const entry of REVALIDATION_STEPS) {
      expect(sourceLine(entry.step.sourceLine).startsWith(`${entry.step.number}. **`)).toBe(true)
    }
  })

  it("§37.1's workflow routes to two blockers, and both are rows of this register", () => {
    expect(sourceLine(80799)).toContain(`\`${TRUST_WINDOW_EXPIRY_BLOCKER}\` applies`)
    expect(sourceLine(80800)).toContain(`\`${FORCED_SYNC_OFFLINE_BLOCKER}\` applies`)
    expect(findBlocker(TRUST_WINDOW_EXPIRY_BLOCKER)?.family).toBe('Authority')
    expect(findBlocker(FORCED_SYNC_OFFLINE_BLOCKER)?.family).toBe('Authority')
  })
})

describe('what the register claims about itself, measured against what it does', () => {
  /** Every `**Message text` label on a blocker entry line, counted per entry. */
  const messageFieldsPerEntry = (): ReadonlyMap<number, number> => {
    const out = new Map<number, number>()
    for (const n of DETAIL_ENTRY_LINES) {
      out.set(n, (sourceLine(n).match(/\*\*Message text[^*]*:\*\*/g) ?? []).length)
    }
    return out
  }

  it('the chapter promises thirty-seven messages and the register carries forty-two', () => {
    const per = messageFieldsPerEntry()
    expect(sourceLine(80769)).toContain('string audit of all thirty-seven messages')
    expect(sourceLine(80725)).toContain('without exception and without blanks')
    const claim = REGISTER_SELF_CLAIMS.find((c) => c.key === 'message-count')!.counts
    expect(claim.entries).toBe(OFFLINE_BLOCKERS.length)
    expect([...per.values()].reduce((a, b) => a + b, 0)).toBe(claim.messageFields)
    expect([...per.values()].filter((n) => n === 1)).toHaveLength(claim.entriesWithExactlyOneField)

    const multi = [...per.entries()]
      .filter(([, n]) => n > 1)
      .map(([line, n]) => [/`(OFF-BLK-\d\d)`/.exec(sourceLine(line))![1], n])
    expect(multi).toEqual([
      ['OFF-BLK-12', 3],
      ['OFF-BLK-32', 2],
      ['OFF-BLK-23', 2],
      ['OFF-BLK-24', 2],
    ])
  })

  it('the register names its own exception to the every-entry message rule', () => {
    const twentyThree = findBlocker('OFF-BLK-23')!
    expect(sourceLine(twentyThree.detailLine)).toContain(
      'This is the one blocker in the register with no worker-facing message',
    )
    expect(sourceLine(80758)).toContain('present in every blocker without exception')

    const declaringNone = OFFLINE_BLOCKERS.filter((b) =>
      sourceLine(b.detailLine).includes('no worker-facing message'),
    )
    const claim = REGISTER_SELF_CLAIMS.find((c) => c.key === 'worker-facing-message-is-universal')!
    expect(declaringNone).toHaveLength(claim.counts.entriesDeclaringNoWorkerMessage!)
    expect(claim.counts.entries).toBe(OFFLINE_BLOCKERS.length)
  })

  it('the reassurance line is verbatim in twenty-seven of the thirty-seven entries', () => {
    const withIt = OFFLINE_BLOCKERS.filter((b) =>
      sourceLine(b.detailLine).includes('Your work is saved.'),
    )
    const claim = REGISTER_SELF_CLAIMS.find((c) => c.key === 'work-is-saved')!.counts
    expect(withIt).toHaveLength(claim.entriesWithTheReassuranceVerbatim!)
    expect(OFFLINE_BLOCKERS).toHaveLength(claim.entries!)
    expect(claim.entriesWithTheReassuranceVerbatim).toBeLessThan(claim.entries!)
  })

  it('OFF-BLK-20 says the opposite of AC-37-002, on its own line and in its own row', () => {
    const row = findBlocker(UNRECOVERABLE_DATA_BLOCKER)!
    expect(sourceLine(80767)).toContain(
      'No blocker deletes, truncates or renders unrecoverable any locally committed capture.',
    )
    expect(sourceLine(80729)).toContain('A blocker never destroys local data.')
    expect(sourceLine(row.detailLine)).toContain(
      'Any work not yet sent cannot be recovered from this tablet.',
    )
    expect(row.workerOutcome).toBe('Unrecoverable unsynced data, named explicitly')
    expect(cellsOf(row.indexLine)[3]).toBe(row.workerOutcome)
  })

  it('all three claims are carried with both readings and none is adopted', () => {
    expect(REGISTER_SELF_CLAIMS).toHaveLength(3)
    for (const claim of REGISTER_SELF_CLAIMS) {
      expect(claim.adopted, claim.key).toBeNull()
      expect(claim.readings.length, claim.key).toBe(2)
      for (const reading of claim.readings) {
        expect(reading.locator, claim.key).toMatch(/L\d{5}/)
        for (const cited of reading.locator.match(/L(\d{5})/g) ?? []) {
          const n = Number(cited.slice(1))
          expect(sourceLine(n).trim().length, `${claim.key} ${cited}`).toBeGreaterThan(0)
        }
      }
    }
  })
})
