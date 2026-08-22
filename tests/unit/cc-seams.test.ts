import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  CC_SA_TELEMETRY_READINGS,
  CC_SEAMS_AS_CONSUMER,
  CC_SEAMS_AS_PRODUCER,
  CC_SEAM_NUMBERS,
  CHAPTER_26_CC_SEAMS,
  SEAMS_THE_DISPATCH_LIST_ADDS,
  SEAMS_THE_DISPATCH_LIST_OMITS,
  SEAM_LIST_AS_DISPATCHED,
  chapter26CcSeam,
} from '@/surfaces/cc/seams/chapter-26'
import {
  CC_SOT_TOKENS,
  CC_SOT_TOKEN_OUTCOME,
  CC_SOURCE_OF_TRUTH,
  ESCALATION_STATE_ROWS,
  LANE_B_AND_TENANT_SETTINGS,
  SOT_READ_ONLY_CELLS_CARRYING_A_GRANT,
  SOT_ROWS_NAMING_THE_COMMAND_CENTER,
  SOT_ROWS_WHERE_THE_COMMAND_CENTER_IS_SOLE_SOURCE,
  SOT_ROW_COUNT,
  SOT_TOKENS_USED,
  ccSourceOfTruth,
  ccSourceOfTruthOutcome,
} from '@/surfaces/cc/seams/source-of-truth'
import {
  ASSIGNMENT_WORD,
  CC_ACTION_8_OWNING_PLACE,
  HUB_MODULE_BEHIND_ACTION_8,
  QUALITY_MANAGER_ON_THE_TWO_CALLERS,
  REASSIGN_CALLERS,
  SEAM_21_EQUIVALENCE,
  builtEntryPointRoles,
  reassignCaller,
  reassignEntryPoint,
  reassignEntryPointSpec,
  reassignEntryPoints,
  reassignEntryPointsAcrossCallers,
} from '@/surfaces/cc/seams/reassign-equivalence'
import {
  CC_SPINE_SEAM_VERDICTS,
  SPINE_SEAMS_REPORTING_OPEN,
  SPINE_SEAMS_STALE,
  SPINE_SEAM_RULING,
} from '@/surfaces/cc/seams/spine-status'
import { CC_SEAMS, ccSeamStatus } from '@/surfaces/cc/seams'
import { HUB_COMMAND_SPECS } from '@/surfaces/doh/objects'
import { HUB_COMMAND_TYPES } from '@/domain/commands'
import { DOH_MODULES } from '@/surfaces/doh/modules'

/**
 * SLICE 9, TASK 19 — THE CROSS-SURFACE SEAMS.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS RE-READ FROM THE FROZEN SOURCE AT
 * TEST TIME. Nothing below takes an expected value from the module under
 * test: the seam set is re-derived by walking every `**Seam N —` heading and
 * its own Producer and Consumer rows, and §26.7's cells are re-read
 * header-keyed off L49574's own pipes. That is why a planted record goes red
 * — the expectation comes from the file, not from the constant.
 *
 * THE ONE GATE THAT IS NOT A TRANSCRIPTION CHECK is seam 21's. It asserts
 * that the union of every Hub command naming either caller's row has exactly
 * one member, which is a claim about the command registry rather than about
 * two labels being equal. A second entry point on either side puts a second
 * member in that union and this suite goes red; two matching strings would
 * survive it, which is the whole reason it is not written that way.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES: readonly string[] = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, the way the source is cited. */
const L = (n: number): string => LINES[n - 1] ?? ''

/** A markdown table row split on its own pipes, edges dropped. */
const cells = (n: number): readonly string[] =>
  L(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

const REPO = process.cwd()
const OWN_DIR = join('src', 'surfaces', 'cc', 'seams') + sep

const read = (...parts: string[]): string => readFileSync(join(REPO, ...parts), 'utf8')

/* ==================================================================== *
 * CHAPTER 26 — WHICH SEAMS NAME THIS SURFACE, RE-DERIVED.
 * ==================================================================== */

const CC_NAME = 'Client Command Center'

interface DerivedSeam {
  readonly seam: number
  readonly title: string
  readonly headingLine: number
  readonly producer: string
  readonly producerLine: number
  readonly consumer: string
  readonly consumerLine: number
}

/**
 * Walk the chapter, not a list. Every seam contract opens with a bolded
 * heading and carries a Producer row and a Consumer row inside the table
 * beneath it; those two rows are the only place the chapter says which
 * surfaces a seam joins.
 */
function derivedSeams(): readonly DerivedSeam[] {
  const out: DerivedSeam[] = []
  for (let n = 1; n <= LINES.length; n++) {
    const m = /^\*\*Seam (\d+) — (.*?)\*\*/.exec(L(n))
    if (m === null) continue
    let producer = '',
      consumer = '',
      producerLine = 0,
      consumerLine = 0
    for (let i = n; i < n + 30 && i <= LINES.length; i++) {
      const line = L(i)
      if (/^\| Producer \|/.test(line)) {
        producer = line.split('|')[2]?.trim() ?? ''
        producerLine = i
      }
      if (/^\| Consumer \|/.test(line)) {
        consumer = line.split('|')[2]?.trim() ?? ''
        consumerLine = i
        break
      }
    }
    out.push({
      seam: Number(m[1]),
      title: m[2] ?? '',
      headingLine: n,
      producer,
      producerLine,
      consumer,
      consumerLine,
    })
  }
  return out
}

const DERIVED = derivedSeams()
const DERIVED_CC = DERIVED.filter(
  (s) => s.producer.includes(CC_NAME) || s.consumer.includes(CC_NAME),
)

describe('chapter 26 — the seams that name SURF-CC', () => {
  /**
   * FAILS IF: a seam is added, dropped, or filed under a number the chapter
   * does not give it. The expected set is the walk's, never the record's.
   */
  it('records exactly the seams whose own Producer or Consumer row names this surface', () => {
    expect(DERIVED).toHaveLength(26)
    expect(CC_SEAM_NUMBERS).toEqual(DERIVED_CC.map((s) => s.seam))
    expect(CC_SEAM_NUMBERS).toHaveLength(15)
  })

  /**
   * THE BRIEF SAID ALL SEVEN OF 3 THROUGH 9 TERMINATE HERE. Two of them
   * originate here instead, and the direction is read off the source's own
   * rows rather than off the record being checked.
   */
  it('two of the fifteen name this surface as PRODUCER, and they are seams 3 and 9', () => {
    const producerSide = DERIVED_CC.filter((s) => s.producer.includes(CC_NAME)).map((s) => s.seam)
    expect(producerSide).toEqual([3, 9])
    expect(CC_SEAMS_AS_PRODUCER).toEqual(producerSide)
    expect(CC_SEAMS_AS_CONSUMER).toHaveLength(13)
    expect(L(49737)).toContain('Frontline devices')
    expect(L(49870)).toContain('Client Command Center action 10')
  })

  /** FAILS IF: a Producer or Consumer string is paraphrased or mis-located. */
  it('carries every Producer and Consumer row verbatim, at the line it names', () => {
    for (const record of CHAPTER_26_CC_SEAMS) {
      const derived = DERIVED_CC.find((s) => s.seam === record.seam)
      expect(derived, `seam ${record.seam} is not in the walk`).toBeDefined()
      expect(record.producerLine).toBe(derived?.producerLine)
      expect(record.consumerLine).toBe(derived?.consumerLine)
      expect(record.producer).toBe(derived?.producer)
      expect(record.consumer).toBe(derived?.consumer)
      expect(record.title).toBe(derived?.title)
      expect(L(record.headingLine)).toContain(`**Seam ${record.seam} — ${record.title}**`)
      const namedInProducer = record.producer.includes(CC_NAME)
      expect(record.ccRole).toBe(namedInProducer ? 'producer' : 'consumer')
    }
  })

  /** Sections are read off the chapter's own headers, never assumed. */
  it('files each seam under the section header that actually contains it', () => {
    const start = (needle: string): number => {
      const idx = LINES.findIndex((l) => l.startsWith(needle))
      expect(idx, `no header ${needle}`).toBeGreaterThan(-1)
      return idx + 1
    }
    const s2681 = start('### 26.8.1 ')
    const s2682 = start('### 26.8.2 ')
    const s269 = start('## 26.9 ')
    const s2610 = start('## 26.10 ')
    for (const record of CHAPTER_26_CC_SEAMS) {
      const line = record.headingLine
      const expected =
        line > s2681 && line < s2682 ? '26.8.1' : line > s2682 && line < s269 ? '26.8.2' : '26.9'
      expect(record.section, `seam ${record.seam}`).toBe(expected)
      if (record.section === '26.9') expect(line).toBeLessThan(s2610)
    }
  })

  /** The dispatch's list, measured against the chapter rather than argued with. */
  it('names the five seams the dispatch list omitted, and adds none of its own', () => {
    expect(SEAM_LIST_AS_DISPATCHED).toHaveLength(10)
    expect(SEAMS_THE_DISPATCH_LIST_OMITS).toEqual([1, 10, 15, 17, 20])
    expect(SEAMS_THE_DISPATCH_LIST_ADDS).toEqual([])
    for (const n of SEAMS_THE_DISPATCH_LIST_OMITS) {
      const derived = DERIVED.find((s) => s.seam === n)
      expect(
        `${derived?.producer ?? ''} ${derived?.consumer ?? ''}`.includes(CC_NAME),
        `seam ${n}`,
      ).toBe(true)
    }
  })

  it('throws rather than answering for a seam that names no Command Center row', () => {
    expect(() => chapter26CcSeam(2)).toThrow(/names the Client Command Center/)
    expect(chapter26CcSeam(21).ccRole).toBe('consumer')
  })
})

describe('the Command Center to Super Admin telemetry contradiction', () => {
  /**
   * FAILS IF: a third field appears on a reading. Two fields is the whole
   * device — there is nowhere to mark a winner even by accident.
   */
  it('carries exactly two readings and exactly two fields on each', () => {
    expect(CC_SA_TELEMETRY_READINGS).toHaveLength(2)
    for (const reading of CC_SA_TELEMETRY_READINGS) {
      expect(Object.keys(reading).sort()).toEqual(['reading', 'sourceRefs'])
    }
  })

  /** Every locator on both sides opened, and each carries what is claimed. */
  it('proves both readings at their own lines', () => {
    expect(L(35437)).toContain('`INT-CC-SA-TEL`')
    expect(L(35437)).toContain('Outbound telemetry')
    expect(L(35458)).toContain('CC -->')
    expect(L(35458).trim().endsWith('SA')).toBe(true)
    expect(L(35472)).toContain('`AC-CC-062`')

    const header = cells(49250)
    const sa = header.indexOf('Super Admin platform console')
    expect(header[0]).toBe('From \\ To')
    const ccRow = cells(49254)
    expect(ccRow[0]).toBe('Client Command Center')
    expect(ccRow[sa]).toContain('`Unavailable`')
    expect(L(49239)).toContain('DOH -->')
    expect(L(49239)).toContain('telemetry, counts, rates, statuses')
  })
})

/* ==================================================================== *
 * §26.7 — THE SOURCE-OF-TRUTH MATRIX.
 * ==================================================================== */

const SOT_HEADER_LINE = 49574
const SOT_FIRST_ROW = 49576

describe('§26.7 — the source-of-truth matrix, transcribed header-keyed', () => {
  /** FAILS IF: the count is inferred from a span rather than walked. */
  it('has twenty-six data rows, counted by walking to where the table stops', () => {
    expect(L(SOT_HEADER_LINE).startsWith('| Record type |')).toBe(true)
    expect(L(SOT_HEADER_LINE + 1)).toBe('|---|---|---|---|---|---|---|')
    let n = SOT_FIRST_ROW
    let walked = 0
    while (L(n).startsWith('|')) {
      walked++
      n++
    }
    expect(walked).toBe(26)
    expect(n - 1).toBe(49601)
    expect(L(n).trim()).toBe('')
    expect(SOT_ROW_COUNT).toBe(walked)
  })

  /**
   * The column order is asserted whole, not just the index looked up.
   * Header-keying protects the transcription; it does not notice a table
   * whose columns have been reordered under the same headings.
   */
  it('reads the Client Command Center column by name, and pins the whole header order', () => {
    expect(cells(SOT_HEADER_LINE)).toEqual([
      'Record type',
      'Single source of truth',
      'Frontline Worker Application',
      'Delivery Operations Hub',
      'Standards and Operations Studio',
      'Client Command Center',
      'Super Admin platform console',
    ])
  })

  /**
   * FAILS IF: any of the four columns transcribed drifts by a character.
   * The token is compared for EXACT EQUALITY against the source's own first
   * backticked span — never a prefix, because `Read-only` is a prefix of
   * nothing here but `Allowed with conditions` would be caught by nothing
   * else.
   */
  it('matches the source cell for cell, token by exact equality', () => {
    const header = cells(SOT_HEADER_LINE)
    const rt = header.indexOf('Record type')
    const sot = header.indexOf('Single source of truth')
    const cc = header.indexOf(CC_NAME)
    expect(cc).toBeGreaterThan(-1)
    CC_SOURCE_OF_TRUTH.forEach((row, i) => {
      const n = SOT_FIRST_ROW + i
      expect(row.line).toBe(n)
      const c = cells(n)
      expect(c).toHaveLength(header.length)
      expect(row.recordType).toBe(c[rt])
      expect(row.singleSourceOfTruth).toBe(c[sot])
      const cell = c[cc] ?? ''
      const m = /^`([^`]+)`(.*)$/.exec(cell)
      expect(m, `L${n} has no backticked token`).not.toBeNull()
      expect(row.ccToken).toBe(m?.[1])
      const rest = (m?.[2] ?? '').replace(/^[—,\s]+/, '').trim()
      expect(row.ccNote ?? '').toBe(rest)
    })
  })

  /** The vocabulary is closed in both directions, so an unlisted token fails. */
  it('uses four tokens and maps each onto the build’s own outcome vocabulary', () => {
    expect(SOT_TOKENS_USED).toEqual([...CC_SOT_TOKENS])
    for (const token of CC_SOT_TOKENS) {
      expect(CC_SOT_TOKEN_OUTCOME[token]).toBeTruthy()
    }
    expect(ccSourceOfTruthOutcome('Tenant settings')).toBe('explicitlyProhibited')
    expect(ccSourceOfTruthOutcome('Lane B configured values')).toBe('allowedWithConditions')
    expect(() => ccSourceOfTruth('Nothing of the kind')).toThrow(/26 rows|has 26/)
  })

  /**
   * TWO `Read-only` CELLS GRANT AN ACTION IN THEIR NOTE. Re-derived from the
   * source rather than read off the constant, so moving a grant into a third
   * cell fails here rather than passing quietly.
   */
  it('finds the two Read-only cells whose note grants one of the ten actions', () => {
    const header = cells(SOT_HEADER_LINE)
    const cc = header.indexOf(CC_NAME)
    const found: number[] = []
    for (let n = SOT_FIRST_ROW; n <= 49601; n++) {
      const cell = cells(n)[cc] ?? ''
      if (cell.startsWith('`Read-only`') && /\baction/.test(cell)) found.push(n)
    }
    expect(found).toEqual([49577, 49590])
    expect(SOT_READ_ONLY_CELLS_CARRYING_A_GRANT).toEqual(found)
    expect(cells(49577)[cc]).toContain('mark-reviewed as action 7')
    expect(cells(49590)[cc]).toContain('anomaly review actions')
  })

  /**
   * L49537 says this surface authors nothing and owns no records. Measured
   * against its own table: three rows name it in the source-of-truth column
   * and not one names it alone.
   */
  it('names this surface in three source-of-truth cells and gives it sole ownership of none', () => {
    expect(L(49537)).toContain('authors nothing and owns no records')
    const header = cells(SOT_HEADER_LINE)
    const sot = header.indexOf('Single source of truth')
    const naming: number[] = []
    for (let n = SOT_FIRST_ROW; n <= 49601; n++) {
      if ((cells(n)[sot] ?? '').includes('Command Center')) naming.push(n)
    }
    expect(naming).toEqual([49579, 49585, 49594])
    expect(SOT_ROWS_NAMING_THE_COMMAND_CENTER).toEqual(naming)
    expect(SOT_ROWS_WHERE_THE_COMMAND_CENTER_IS_SOLE_SOURCE).toEqual([])
  })
})

describe('the Lane B grant and the tenant-settings prohibition', () => {
  /** FAILS IF: the two rows are described as adjacent. There is a row between them. */
  it('sits two data rows apart, with the sync-conflicts row between', () => {
    expect(ccSourceOfTruth('Lane B configured values').line).toBe(
      LANE_B_AND_TENANT_SETTINGS.laneBRow,
    )
    expect(ccSourceOfTruth('Sync conflicts').line).toBe(LANE_B_AND_TENANT_SETTINGS.rowBetween)
    expect(ccSourceOfTruth('Tenant settings').line).toBe(
      LANE_B_AND_TENANT_SETTINGS.tenantSettingsRow,
    )
    expect(LANE_B_AND_TENANT_SETTINGS.tenantSettingsRow - LANE_B_AND_TENANT_SETTINGS.laneBRow).toBe(
      LANE_B_AND_TENANT_SETTINGS.dataRowsApart,
    )
    expect(LANE_B_AND_TENANT_SETTINGS.dataRowsApart).toBe(2)
  })

  /** The criterion is opened, not cited. */
  it('is reconciled by AC-CC-060, at the line the record names', () => {
    expect(LANE_B_AND_TENANT_SETTINGS.reconciledByRef).toBe('L35470')
    expect(L(35470)).toContain('`AC-CC-060`')
    expect(L(35470)).toContain(
      'exactly one outbound configuration path, the Lane B application path',
    )
    const header = cells(SOT_HEADER_LINE)
    const cc = header.indexOf(CC_NAME)
    expect(cells(49593)[cc]).toContain('the decision, Quality Manager and above')
    expect(cells(49595)[cc]).toContain('editing configuration is deliberately impossible here')
  })
})

describe('the escalation rows — a decomposition, and a record type with no row', () => {
  it('has a row for the acknowledgement state and none for the resolution state', () => {
    expect(ccSourceOfTruth('Escalation routing rules').line).toBe(
      ESCALATION_STATE_ROWS.routingRulesRow,
    )
    expect(ccSourceOfTruth('Escalation acknowledgement state').line).toBe(
      ESCALATION_STATE_ROWS.acknowledgementStateRow,
    )
    expect(ESCALATION_STATE_ROWS.resolutionStateRow).toBeNull()
    const resolutionRows = CC_SOURCE_OF_TRUTH.filter(
      (r) => /escalation/i.test(r.recordType) && /resol/i.test(r.recordType),
    )
    expect(resolutionRows).toEqual([])
  })

  /** All four statements of the distinction, opened at their own lines. */
  it('proves acknowledge and resolve are held distinct in four other places', () => {
    expect(ESCALATION_STATE_ROWS.distinctionStatedAt).toEqual([
      'L37844',
      'L37866',
      'L38001',
      'L49772',
    ])
    expect(L(37844)).toContain('Acknowledge is not resolve')
    expect(L(37866).split('|')[1]?.trim()).toBe('Resolve an escalation')
    expect(L(38001)).toContain('`FUNC-CC-0903-1-2`')
    expect(L(49772)).toContain('Acknowledge and resolve are distinct, timestamped states')
    const header = cells(SOT_HEADER_LINE)
    const cc = header.indexOf(CC_NAME)
    expect(cells(49589)[cc]).toContain('acknowledge from feed or notification')
    expect(cells(49589)[cc]).not.toContain('resolve')
  })
})

/* ==================================================================== *
 * SEAM 21 — THE CONTRACT-EQUIVALENCE ASSERTION.
 * ==================================================================== */

describe('seam 21 — one service, two callers', () => {
  /**
   * THE ASSERTION THIS TASK EXISTS FOR, AND THE ONE NO MODULE TASK CAN MAKE.
   *
   * FAILS IF: a second Hub command names either caller's row — which is what
   * a second implementation of the reassign act looks like in this tree.
   * Proved by planting `'MOD-DOH-07 row 4'` onto a second spec's sourceRefs
   * and watching the union become two.
   *
   * A gate comparing two labels would not fail on that, which is why the
   * question asked is "how many entry points serve either caller", never
   * "do the two records agree".
   */
  it('resolves both callers to exactly one service entry point', () => {
    expect(reassignEntryPoints('SURF-DOH')).toEqual(['DOH_SUBSTITUTE_WORKER'])
    expect(reassignEntryPoints('SURF-CC')).toEqual([])
    expect(reassignEntryPointsAcrossCallers()).toHaveLength(1)
    expect(reassignEntryPoint()).toBe('DOH_SUBSTITUTE_WORKER')
  })

  /**
   * The emptiness on the Command Center side is the guarantee, not a gap:
   * no Hub-side reassign command exists because the act is the Hub's own
   * substitution, called from the other surface.
   */
  it('gives the Command Center caller no command of its own, on either side of the union', () => {
    expect(reassignCaller('SURF-CC').hubMatrixRow).toBe('MOD-DOH-07 row 4')
    const claiming = HUB_COMMAND_TYPES.filter((t) =>
      HUB_COMMAND_SPECS[t].access.sourceRefs.includes('MOD-DOH-07 row 4'),
    )
    expect(claiming).toEqual([])
    const declared = read('src', 'domain', 'commands.ts')
    const types = [...declared.matchAll(/readonly type: '([A-Z_]+)'/g)].map((m) => m[1] as string)
    const nonHub = types.filter((t) => !HUB_COMMAND_TYPES.includes(t as never))
    expect(nonHub.length).toBeGreaterThan(0)
    expect(nonHub.filter((t) => /ASSIGN|SUBSTITUTE/.test(t))).toEqual([])
  })

  /** One spec object, not two equal ones. Reference identity, not deep equality. */
  it('hands both callers the same spec object', () => {
    const fromRegistry = HUB_COMMAND_SPECS[reassignEntryPoint()]
    expect(Object.is(reassignEntryPointSpec(), fromRegistry)).toBe(true)
    expect(Object.is(reassignEntryPointSpec(), reassignEntryPointSpec())).toBe(true)
    expect(reassignEntryPointSpec().affectedSurfaces).toContain('SURF-FL')
  })

  /** Both caller rows opened, header-keyed off the matrix's own header line. */
  it('names the two rows the Hub assignment matrix states, at their own lines', () => {
    const header = cells(28117)
    expect(header).toEqual([
      'Action',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    for (const caller of REASSIGN_CALLERS) {
      expect(cells(caller.rowLine)[0]).toBe(caller.action)
    }
    expect(reassignCaller('SURF-DOH').rowLine).toBe(28121)
    expect(reassignCaller('SURF-CC').rowLine).toBe(28122)
  })

  /**
   * ONE SERVICE, TWO CALLERS, AND TWO DIFFERENT ANSWERS ABOUT THE QUALITY
   * MANAGER. Read header-keyed; carried as two readings with no field to
   * choose in.
   */
  it('records the Quality Manager divergence between the two callers, and adopts neither', () => {
    const header = cells(28117)
    const qm = header.indexOf('Quality Manager')
    expect(cells(28121)[qm]).toBe('`Explicitly prohibited`')
    expect(cells(28122)[qm]?.startsWith('`Allowed with conditions`')).toBe(true)
    expect(L(50216)).toContain('Supervisor and above, on both callers')
    expect(QUALITY_MANAGER_ON_THE_TWO_CALLERS).toHaveLength(2)
    for (const reading of QUALITY_MANAGER_ON_THE_TWO_CALLERS) {
      expect(Object.keys(reading).sort()).toEqual(['reading', 'sourceRefs'])
    }
    const roles = builtEntryPointRoles()
    expect(roles.allowed).not.toContain('QUALITY_MANAGER')
    expect(roles.denied).toContain('QUALITY_MANAGER')
    expect(L(13456)).toContain('`DEC-PLUS-001`')
  })

  /**
   * The Command Center's own half of the evidence: the only one of the ten
   * `Executes via` cells that names a service rather than a record, and the
   * sentence it names it in is the equivalence.
   */
  it('resolves the Command Center caller through its own Executes via cell', () => {
    const header = cells(38663)
    const via = header.indexOf('Executes via')
    expect(header[0]).toBe('#')
    const cell = cells(38672)
    expect(cell[0]).toBe('8')
    expect(cell[via]?.startsWith(CC_ACTION_8_OWNING_PLACE)).toBe(true)
    expect(cell[via]).toContain(
      "the same service the Delivery Operations Hub's own screens use, with identical rules",
    )
    expect(CC_ACTION_8_OWNING_PLACE).toContain('Delivery Operations Hub')
    expect(CC_ACTION_8_OWNING_PLACE).toContain(ASSIGNMENT_WORD)
    expect(DOH_MODULES.filter((m) => m.name.includes(ASSIGNMENT_WORD))).toHaveLength(1)
    expect(HUB_MODULE_BEHIND_ACTION_8).toBe('MOD-DOH-07')
  })

  /** The criterion, its named test, and every place the source states it. */
  it('proves the criterion and the five statements of the equivalence', () => {
    expect(L(50227)).toContain('`AC-SEAM-21-01`')
    expect(L(50227)).toContain(
      'the Command Center reassign action and the Hub assignment screen invoke the same service entry point',
    )
    expect(L(50228)).toContain('`TEST-SEAM-21-01`')
    expect(L(50228)).toContain('trace both callers and assert one service entry point')
    expect(SEAM_21_EQUIVALENCE.statedAt).toEqual(['L13421', 'L28122', 'L28193', 'L38672', 'L53791'])
    expect(L(13421)).toContain('identical rules including qualification checks')
    expect(L(28193)).toContain('identical validation and identical errors')
    expect(L(53791)).toContain('action 8 executes through the same service with identical rules')
  })

  /**
   * NO SCREEN CALLS THE GATEWAY IN THIS BUILD, and the record says so rather
   * than claiming a traced call graph. FAILS IF a page ever imports it —
   * at which point the claim becomes false and has to be rewritten.
   */
  it('does not claim a call graph this storyboard has not got', () => {
    expect(SEAM_21_EQUIVALENCE.whatIsNotAsserted).toContain('No page imports dispatch')
    const importers = sourceFiles()
      .filter((f) => f.startsWith('app') || f.startsWith(join('src', 'ui')))
      .filter((f) => /from\s+['"]@\/scenario\/(gateway|store)['"]/.test(read(f)))
    expect(importers).toEqual([])
    expect(read('src', 'scenario', 'gateway.ts')).toContain(
      'THIS FILE IS THE ONLY MUTATION ENTRY POINT IN THE APPLICATION',
    )
  })
})

/* ==================================================================== *
 * THE SPINE'S SEAM REGISTRY — the derivation, not the number.
 *
 * ITS PREDECESSOR ASSERTED `toContain('const THIS_SLICE = 8')` AND THAT IS
 * WHY THE DEFECT SHIPPED. The comment above it said it "FAILS THE DAY
 * `THIS_SLICE` IS ADVANCED, which is the point" — the intent was right and a
 * test that can only ever fail on the fix is not a gate, it is a lock. Four
 * more assertions in four other files held the same shape, and between them
 * they kept "Until that board exists there is no host" on twelve of thirteen
 * Command Center pages for a whole slice, on the surface that ships the
 * board.
 *
 * SO NOTHING BELOW NAMES THE CONSTANT'S VALUE. The threshold is LOCATED by
 * probing the exported derivation, and what is asserted is the invariant the
 * registry exists for: a seam whose owning half is built and reached may not
 * report `open`. That statement is false the day the number falls behind
 * again and true whatever the number is.
 * ==================================================================== */

/** The exported derivation, probed rather than read, so no literal is pinned. */
function derivedThreshold(): number {
  const row = CC_SEAMS[0]
  const closedAt: number[] = []
  for (let n = 1; n <= 30; n += 1) {
    if (ccSeamStatus({ ...row, ownerSlice: n }) === 'closed') closedAt.push(n)
  }
  // A THRESHOLD, NOT A SET OF SPECIAL CASES: closed must be a prefix of 1..30,
  // or `ccSeamStatus` is not the comparison it claims to be.
  expect(closedAt, 'ccSeamStatus is not monotone in ownerSlice').toEqual(
    closedAt.map((_, i) => i + 1),
  )
  expect(closedAt.length, 'ccSeamStatus closed nothing in 1..30').toBeGreaterThan(0)
  return closedAt.length
}

describe('the seam registry reports a seam closed once its owning half is built', () => {
  /**
   * THE INVARIANT, AND IT IS THE ONE THAT WAS BROKEN. Every verdict in the
   * spine record names a seam whose owning half this build has and reaches;
   * the test below opens each piece of that evidence. So every one of them
   * must report `closed`, and `SPINE_SEAMS_STALE` — reported open while the
   * half is built — must be empty.
   *
   * FAILS IF: the slice number falls behind any row's `ownerSlice` again, in
   * either direction — a row closed before its owner slice arrives fails the
   * threshold comparison, and a row still open after it fails this one.
   */
  it('closes every seam whose owning half is built, and stales nothing', () => {
    const threshold = derivedThreshold()
    // NON-VACUITY: the verdicts cover every registered row, so "all of them
    // are closed" cannot be satisfied by there being none to check.
    expect(CC_SPINE_SEAM_VERDICTS.length).toBe(CC_SEAMS.length)
    expect([...CC_SPINE_SEAM_VERDICTS].map((v) => v.id).sort()).toEqual(
      [...CC_SEAMS].map((s) => s.id).sort(),
    )
    for (const verdict of CC_SPINE_SEAM_VERDICTS) {
      const seam = CC_SEAMS.find((s) => s.id === verdict.id)!
      expect(verdict.owningHalfBuilt, verdict.id).toBe(true)
      expect(seam.ownerSlice, `${verdict.id} owner slice`).toBeLessThanOrEqual(threshold)
      expect(ccSeamStatus(seam), `${verdict.id} reports`).toBe('closed')
    }
    expect(SPINE_SEAMS_REPORTING_OPEN).toEqual([])
    expect(SPINE_SEAMS_STALE).toEqual([])
    // AND THE DERIVATION IS STILL A DERIVATION. A stored status field is the
    // hazard this registry removed once and this file exists because of.
    const spine = read('src', 'surfaces', 'cc', 'seams.ts')
    expect(spine).toContain('return seam.ownerSlice <= THIS_SLICE')
    expect(spine, 'status is stored beside ownerSlice again').not.toMatch(
      /^\s*status: '(open|closed)'/m,
    )
  })

  /**
   * THE PROSE, WHICH IS THE HALF A ONE-CHARACTER BUMP LEAVES BEHIND. Both
   * `whatIsMissing` strings were written in the present tense of an absent
   * half, and `MOD-CC-10`'s panel prints its row's string unconditionally, so
   * closing the seams without rewriting them swaps a false status for false
   * prose under a true one. The phrases below are the exact clauses the rows
   * carried while they were open.
   *
   * FAILS IF: a closed row still speaks of its half as absent — which is what
   * shipped, and what a bump of the constant alone would have left shipping.
   */
  it('writes a closed row in the tense of its status rather than of its absence', () => {
    const ABSENT_TENSE = [
      'Until that board exists there is no host',
      'has neither a module nor a screen in this slice',
      'the chrome has nowhere to be',
    ] as const
    const registry = read('src', 'surfaces', 'cc', 'seams.ts')
    // NON-VACUITY FOR A LIST OF ABSENCES: a `not.toContain` over a mistyped
    // clause passes for the wrong reason, so the same matcher is first shown
    // finding a clause this registry does carry.
    expect(registry, 'the positive control is missing, so the absences prove nothing').toContain(
      'landed in this slice',
    )
    for (const clause of ABSENT_TENSE) expect(registry).not.toContain(clause)
    for (const seam of CC_SEAMS) {
      const closed = ccSeamStatus(seam) === 'closed'
      for (const clause of ABSENT_TENSE) {
        expect(seam.whatIsMissing.includes(clause) && closed, `${seam.id}: "${clause}"`).toBe(false)
      }
      // The positive half: a closed row names what closed it.
      if (closed) expect(seam.whatIsMissing, seam.id).toMatch(/landed in this slice/)
    }
  })

  /** The record of the interval is kept, and marked historical rather than current. */
  it('keeps the account of the slice both seams spent misreported', () => {
    expect(SPINE_SEAM_RULING.declaredWhenReported).toBe(8)
    expect(SPINE_SEAM_RULING.advancedTo).toBe(derivedThreshold())
    expect(SPINE_SEAM_RULING.advancedTo).toBeGreaterThan(SPINE_SEAM_RULING.declaredWhenReported)
    // The fix list was short by exactly three and the successor is the eight
    // the fix touched. Each is a real path.
    expect(SPINE_SEAM_RULING.fixTouches).toHaveLength(8)
    for (const p of SPINE_SEAM_RULING.fixTouches) {
      expect(statSync(join(REPO, p)).isFile(), p).toBe(true)
    }
    for (const late of [
      'tests/unit/cc-spine.test.ts',
      'tests/component/cc-shell.test.tsx',
      'tests/component/cc-10.test.tsx',
    ]) {
      expect(SPINE_SEAM_RULING.fixTouches, `${late} was the omission`).toContain(late)
    }
  })

  /** Each verdict's evidence opened, so neither is an assertion. */
  it('proves each owning half on its own screen', () => {
    const board = read('app', 'command-center', 'live-shift-board', 'page.tsx')
    expect(board).toContain('chrome={<BoardSyncChrome />}')
    expect(read('src', 'surfaces', 'cc', 'modules', 'cc-01', 'BoardSyncChrome.tsx')).toContain(
      'cc-02',
    )
    const panel = read('app', 'command-center', 'sync-conflict-review-panel', 'page.tsx')
    expect(panel).toContain('Cc13ActionRail')
  })
})

/* ==================================================================== *
 * THIS TASK'S OWN REACHABILITY, DECLARED RATHER THAN ASSUMED.
 * ==================================================================== */

function sourceFiles(): readonly string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(REPO, dir))) {
      if (isForeignProbe(entry)) continue
      if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
      const rel = join(dir, entry)
      let stats
      try {
        stats = statSync(join(REPO, rel))
      } catch {
        continue
      }
      if (stats.isDirectory()) walk(rel)
      else if (/\.(ts|tsx|mjs)$/.test(entry)) out.push(rel)
    }
  }
  walk('src')
  walk('app')
  walk('scripts')
  return out
}

describe('the seam records reach no route, and that is declared', () => {
  /**
   * `cc-10-s366` shipped unreferenced and nobody noticed for a whole slice.
   * The difference between a stated abstention and an oversight is this
   * gate: it goes red the day a file outside this directory imports one of
   * these records, at which point the header's abstention is false and has
   * to be rewritten with the wiring it now has.
   *
   * The pattern deliberately does NOT require `import` on the same line as
   * `from` — two tasks wrote that shape into reachability probes and both
   * under-reported on a multi-line import, and a reachability check that
   * under-reports goes green on a broken chain.
   */
  it('has zero importers outside its own directory', () => {
    const importers = sourceFiles()
      .filter((f) => !f.startsWith(OWN_DIR))
      .filter((f) => /['"]@\/surfaces\/cc\/seams\/[a-z0-9-]+['"]/.test(read(f)))
    expect(importers).toEqual([])
  })

  /**
   * A CLIENT MODULE IS NOT FORBIDDEN HERE; EXPORTING PLAIN DATA FROM ONE IS.
   * Every file in this directory exports plain data objects a server
   * component may read, so none of them may carry the directive — a client
   * module's exported data comes back undefined at prerender, which is
   * invisible to every component test.
   */
  it('exports plain data and therefore carries no client directive', () => {
    const own = sourceFiles().filter((f) => f.startsWith(OWN_DIR))
    expect(own.length).toBe(4)
    for (const file of own) {
      const text = read(file)
      expect(/^'use client'$/m.test(text), file).toBe(false)
      expect(/^export const [A-Z_]+ = /m.test(text) || /^export function /m.test(text)).toBe(true)
    }
  })

  /** The header states the wiring rather than leaving the absence unexplained. */
  it('names where the records would be wired', () => {
    const header = read(OWN_DIR, 'chapter-26.ts')
    expect(header).toContain('CommandCenterShell')
    expect(header).toContain('REACHES NO ROUTE')
    expect(relative(REPO, join(REPO, OWN_DIR)) + sep).toBe(OWN_DIR)
  })
})
