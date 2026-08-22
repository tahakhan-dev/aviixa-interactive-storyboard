import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

import { OPEN_DECISION_IDS, type DecisionReading } from '@/disclosure/decisions'
import {
  DEC_37B_COLUMNS,
  DEC_37B_HELD_ELSEWHERE,
  DEC_37B_HOLD_STATE_IS_NOT_OURS,
  DEC_37B_IDS,
  DEC_37B_INDEX_ROWS,
  DEC_37B_LOCAL_DISCLOSURES,
  DEC_37B_OPEN_COUNT_READINGS,
  DEC_37B_SOURCE_FINDINGS,
  DEC_37B_ALSO_DISCLOSED_IN,
  DEC_37B_TABLE,
  type Dec37bLocalDisclosure,
} from '@/offline/decisions-37b'

import { isForeignProbe, ownProbeDir, presentOrNull, withPlanted } from '../probe-paths'

/**
 * `src/offline/decisions-37b.ts` against the frozen source, never against the
 * brief.
 *
 * EVERY GATE HERE WAS PLANTED AND WATCHED GO RED before it was left green —
 * one defect per gate, in the shipping module itself, then the file restored
 * and its sha256 compared. The `FAILS IF` note on each names the defect that
 * was actually planted, not one that would have been convenient.
 *
 * THE BRIEF CARRIED NOTHING WRONG ABOUT THE TABLE ITSELF: header, span, row
 * count, exemption line and both count lines all held when opened. What it
 * did carry wrongly was scope — see the `DEC-FB` gate below.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_TEXT = readFileSync(SOURCE_PATH, 'utf8')
const SOURCE_LINES = SOURCE_TEXT.split('\n')
const srcLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

/** A markdown row split into its cells, trimmed. Never truncated. */
const cellsOf = (n: number): readonly string[] =>
  srcLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

const MODULE_REL = join('src', 'offline', 'decisions-37b.ts')

/** Widened once: `find` over the `as const` tuple otherwise yields a union of
 * seven literal record types, on which `readings` is a union of tuples. */
const LOCAL: readonly Dec37bLocalDisclosure[] = DEC_37B_LOCAL_DISCLOSURES

const HEADER_LINE = 81730
const SEPARATOR_LINE = 81731
const FIRST_ROW = 81732
const LAST_ROW = 81739

describe('§37B — the table is the source’s table, header-keyed and cell by cell', () => {
  /**
   * FAILS IF: one character of one cell drifts. Planted by changing
   * `DEC-SYNC-004`'s `Why it matters` cell from "the three existing windows"
   * to "the two existing windows". Red on that cell alone.
   *
   * The column index is looked up in the SOURCE header by name, not taken
   * from `DEC_37B_COLUMNS`'s position, so this is genuinely header-keyed: a
   * reordered vocabulary is caught by the gate below rather than silently
   * agreeing with itself here.
   */
  it('transcribes all eight rows verbatim, five cells each', () => {
    const header = cellsOf(HEADER_LINE)
    expect(header).toHaveLength(5)

    for (const row of DEC_37B_TABLE) {
      const sourceCells = cellsOf(row.line)
      expect(sourceCells).toHaveLength(5)
      for (const column of DEC_37B_COLUMNS) {
        const at = header.indexOf(column)
        expect(at).toBeGreaterThanOrEqual(0)
        expect(row.cells[column]).toBe(sourceCells[at])
      }
    }
  })

  /**
   * FAILS IF: the column vocabulary stops being the source's header, in name
   * or in order. Planted by swapping `'Question'` and `'Why it matters'` in
   * `DEC_37B_COLUMNS`. Red here; the gate above stayed green, which is why
   * both exist.
   */
  it('the five column names are the header row’s, in the header row’s order', () => {
    expect([...DEC_37B_COLUMNS]).toEqual(cellsOf(HEADER_LINE))
    expect(srcLine(HEADER_LINE)).toContain('| Identifier | Question | Why it matters |')
  })

  /**
   * FAILS IF: a row is dropped or one is invented. Planted by DELETING the
   * `DEC-SYNC-005` entry — a deletion rather than a rename, because a rename
   * leaves the length at eight and this build has already shipped one count
   * gate that a rename walked past.
   *
   * The body's end is asserted from the source rather than from the span: the
   * line after the last row must not be a table row at all.
   */
  it('is eight data rows, counted, and the body stops where it is said to stop', () => {
    expect(DEC_37B_TABLE).toHaveLength(8)
    expect(DEC_37B_TABLE.map((r) => r.line)).toEqual([
      81732, 81733, 81734, 81735, 81736, 81737, 81738, 81739,
    ])

    let counted = 0
    for (let n = FIRST_ROW; n <= LAST_ROW; n += 1) {
      expect(srcLine(n).startsWith('| `DEC-')).toBe(true)
      counted += 1
    }
    expect(counted).toBe(DEC_37B_TABLE.length)

    expect(srcLine(SEPARATOR_LINE)).toBe('|---|---|---|---|---|')
    expect(srcLine(LAST_ROW + 1).startsWith('|')).toBe(false)
    expect(srcLine(FIRST_ROW - 1)).toBe(srcLine(SEPARATOR_LINE))

    const identifiers = DEC_37B_TABLE.map((r) => r.identifier)
    expect(identifiers).toEqual([...DEC_37B_IDS])
    for (const row of DEC_37B_TABLE) {
      expect(row.cells.Identifier).toBe(`\`${row.identifier}\``)
    }
  })
})

describe('seven open, eight listed — both numbers, four locators, neither chosen', () => {
  /**
   * FAILS IF: the source stops saying either number. Pinned to the sentence,
   * not to a status word — a token check would survive the locator moving a
   * row, which is how a sibling gate stayed green this slice.
   *
   * NOT PLANTABLE, and said so rather than left to look plantable: every
   * assertion here reads the frozen source, which is read-only input. Its
   * plantable half is the reading array, gated below.
   */
  it('all four locators carry what is claimed of them', () => {
    expect(srcLine(81728)).toContain('a decision taken is not the same as a decision owed')
    expect(srcLine(81728)).toContain('with one exception: `DEC-SYNC-001` now carries an adopted')
    expect(srcLine(81761)).toContain(
      'eight open decisions and thirteen preserved contradictions remain',
    )
    expect(srcLine(81763)).toContain('Every item in the table is `Client Decision Required`')
    expect(srcLine(81757)).toContain(
      '`DEC-SYNC-001` is already answered by an adopted working position',
    )
  })

  /**
   * FAILS IF: a reading grows a field in which one could be marked the
   * answer. Planted by adding `preferred: true` to the SEVEN reading. Red on
   * the key check, which is the point — a `toEqual` on the texts would have
   * passed a record that had quietly acquired a winner.
   */
  it('two readings, exactly two fields each, and no field could hold a winner', () => {
    expect(DEC_37B_OPEN_COUNT_READINGS).toHaveLength(2)
    for (const reading of DEC_37B_OPEN_COUNT_READINGS) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
      expect(reading.text.trim().length).toBeGreaterThan(0)
      expect(reading.locator).toMatch(/L\d{3,6}/)
    }

    const texts = DEC_37B_OPEN_COUNT_READINGS.map((r) => r.text)
    expect(texts.filter((t) => t.startsWith('EIGHT,'))).toHaveLength(1)
    expect(texts.filter((t) => t.startsWith('SEVEN,'))).toHaveLength(1)

    const locators = DEC_37B_OPEN_COUNT_READINGS.map((r) => r.locator).join(' ')
    for (const line of ['L81728', 'L81732', 'L81739', 'L81757', 'L81761', 'L81763']) {
      expect(locators).toContain(line)
    }
  })
})

describe('the canon gate: every identifier here is ABSENT from src/disclosure/decisions.ts', () => {
  /**
   * FAILS IF: one of the eight is lifted into the canon and this module keeps
   * its local copy. Planted by replacing `'DEC-SYNC-003'` in `DEC_37B_IDS`
   * with `'DEC-WIDIFF-001'`, which the canon does hold. Red.
   */
  it('holds for all eight, and turns red the moment one is lifted', () => {
    const canon = OPEN_DECISION_IDS as readonly string[]
    expect(canon.length).toBeGreaterThan(0)
    expect(DEC_37B_IDS).toHaveLength(8)
    for (const id of DEC_37B_IDS) expect(canon).not.toContain(id)
    expect(canon).not.toContain('DEC-FB-008')
  })

  /**
   * FAILS IF: a local record stops declaring its own gap, or declares
   * somebody else's. Planted by pointing `DEC-SYNC-006`'s `canonNote` at
   * `DEC-SYNC-005`. Red — the note must name its OWN identifier.
   */
  it('every local record declares why it is local and adopts nothing', () => {
    expect(DEC_37B_LOCAL_DISCLOSURES).toHaveLength(7)
    expect(DEC_37B_LOCAL_DISCLOSURES.map((d) => d.decisionRef)).not.toContain('DEC-SYNC-001')

    for (const record of DEC_37B_LOCAL_DISCLOSURES) {
      expect(record.canonNote).toContain(record.decisionRef)
      expect(record.canonNote).toMatch(/carries no record/)
      expect(record.adopted.startsWith('Nothing')).toBe(true)
      expect(Object.keys(record).sort()).toEqual([
        'adopted',
        'canonNote',
        'decisionRef',
        'question',
        'readings',
      ])
      expect(record.readings.length).toBeGreaterThan(1)
      for (const reading of record.readings) {
        expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
        expect(reading.locator).toMatch(/L\d{3,6}/)
      }
    }
  })
})

describe('a pointer that can point at itself is not a pointer', () => {
  /**
   * FAILS IF: a `heldBy` path is repointed at this module, or at any
   * neighbour in `src/offline/`. Planted by setting `DEC-SYNC-001`'s path to
   * `'src/offline/decisions-37b.ts'` — which DOES contain both the identifier
   * and the locator `L39672`, so the contents check below passes it. Only the
   * outside-the-directory rule catches it, and it did: red.
   */
  it('every holder is outside src/offline/ and carries the decision’s own locator', () => {
    expect(DEC_37B_HELD_ELSEWHERE.length).toBeGreaterThan(0)

    for (const held of DEC_37B_HELD_ELSEWHERE) {
      expect(held.path.startsWith('src/offline/')).toBe(false)
      expect(held.path).not.toBe(MODULE_REL)

      const text = readFileSync(join(process.cwd(), held.path), 'utf8')
      expect(text).toContain(held.decisionRef)
      expect(text).toContain(held.locator)
    }

    const refs = DEC_37B_HELD_ELSEWHERE.map((h) => h.decisionRef)
    expect(refs).toContain('DEC-SYNC-001')
    expect(refs).toContain('DEC-FB-008')
  })

  /**
   * FAILS IF: the hold-state disclosure loses one of its three levels, or
   * grows a field that picks one. Planted by dropping the L80233 level. Red.
   */
  it('the hold-state claim keeps all three levels and chooses none', () => {
    expect(DEC_37B_HOLD_STATE_IS_NOT_OURS.levels).toHaveLength(3)
    expect(DEC_37B_HOLD_STATE_IS_NOT_OURS.chosenHere.startsWith('NOTHING')).toBe(true)

    expect(srcLine(80192)).toContain('The hold stands; no device write lifts it')
    expect(srcLine(80192)).toContain('`SoW Fact — §3.3, §7.9.2`')
    expect(srcLine(80233)).toContain('`Derived Clarification` for the per-object authority table')
    expect(srcLine(82477)).toContain(
      'This blueprint records the contradiction as `DEC-FB-008` and preserves both readings',
    )

    const joined = DEC_37B_HOLD_STATE_IS_NOT_OURS.levels.join(' ')
    for (const line of ['L80192', 'L80233', 'L82477']) expect(joined).toContain(line)
  })

  /**
   * §37B raises NO `DEC-FB-*` item. The brief's heading called this task's
   * subject "the fourteen `DEC-FB-*` cards"; measured over the section, the
   * string does not occur in it once. A record filed here would be the
   * coverage-map error in its other direction — a decision attributed to a
   * section that never names it.
   *
   * FAILS IF: a `DEC-FB-*` record appears in this module's disclosure array.
   * Planted by renaming `DEC-SYNC-005`'s `decisionRef` to `DEC-FB-008`. Red
   * here, and red on three neighbours — which is the plant behaving, not the
   * gate: a decision filed under the wrong chapter loses its canon note, its
   * locators and its pairing at the same time.
   */
  it('§37B names no DEC-FB decision, and neither does the disclosure array', () => {
    const section = SOURCE_LINES.slice(81722 - 1, 81765).join('\n')
    expect(section).toContain('37B. New Decisions and Open Items Raised by Chapters 36 and 37')
    expect(section).not.toContain('DEC-FB-')
    for (const record of DEC_37B_LOCAL_DISCLOSURES) {
      expect(record.decisionRef.startsWith('DEC-FB-')).toBe(false)
    }
  })
})

/**
 * Every locator a record rests on, with the sentence that line carries.
 * Checked BOTH ways below: the source line must carry the sentence, and the
 * record must still cite that line. Pinning only one direction is how a
 * locator check stays green while the locator it checks moves.
 */
const PINNED = [
  {
    ref: 'DEC-SYNC-002',
    line: 80095,
    says: '**`DEC-SYNC-002` — Command expiry horizons per command class.**',
  },
  { ref: 'DEC-SYNC-003', line: 80039, says: 'recorded as `DEC-SYNC-003` in §36.2' },
  { ref: 'DEC-SYNC-003', line: 80097, says: 'Detailed in the `FB-SYNC-01` contract above.' },
  {
    ref: 'DEC-SYNC-004',
    line: 80099,
    says: 'none of these is a statement that a device is lost',
  },
  { ref: 'DEC-SYNC-005', line: 80382, says: 'An infinite retry loop is prohibited' },
  { ref: 'DEC-SYNC-005', line: 80441, says: 'Related to but distinct from `DEC-SYNC-002`' },
  {
    ref: 'DEC-SYNC-006',
    line: 80504,
    says: "The cap's numeric value is Not specified in the Statement of Work",
  },
  {
    ref: 'DEC-SYNC-006',
    line: 80541,
    says: 'with the numeral standing for whatever `DEC-SYNC-006` settles',
  },
  {
    ref: 'DEC-SYNC-006',
    line: 80587,
    says: 'except the cap value (`Client Decision Required`',
  },
  { ref: 'DEC-OFF-001', line: 80785, says: 'it is recorded as `DEC-OFF-001` below' },
  {
    ref: 'DEC-OFF-001',
    line: 80844,
    says: 'which would make the qualification gate decorative',
  },
  {
    ref: 'DEC-OFF-002',
    line: 81460,
    says: 'it is proposed as `DEC-OFF-002` in the closing register of this chapter',
  },
] as const

describe('the locators every record rests on, opened', () => {
  /**
   * FAILS IF: a pinned locator moves, or the line stops saying what is
   * claimed. Planted by repointing `DEC-SYNC-006`'s card reading from L80504
   * to L80587 — a real line, in the same section, that also names the cap and
   * the identifier, so a token check would have passed it. Nothing then cited
   * L80504 and the gate went red.
   */
  it('each cited card line carries the sentence claimed of it, and is still cited', () => {
    for (const pin of PINNED) {
      expect(srcLine(pin.line)).toContain(pin.says)
      const record = LOCAL.find((d) => d.decisionRef === pin.ref)
      expect(record).toBeDefined()
      expect(
        record?.readings.some((r) => r.locator.includes(`L${pin.line}`)),
      ).toBe(true)
    }
  })

  /**
   * FAILS IF: a reading cites a line that does not exist or is blank. A blank
   * line states nothing, so a citation of one is always wrong. Planted by
   * repointing `DEC-OFF-002`'s row citation at the blank line that closes
   * §37B — the line is not spelled in this comment, because naming it would
   * file the false citation the gate exists to catch. Red.
   */
  it('every locator on every record names a real, non-blank line', () => {
    const arrays: readonly DecisionReading[] = [
      ...LOCAL.flatMap((d) => d.readings),
      ...DEC_37B_OPEN_COUNT_READINGS,
      ...DEC_37B_SOURCE_FINDINGS,
    ]
    let checked = 0
    for (const reading of arrays) {
      for (const match of reading.locator.matchAll(/L(\d{3,6})/g)) {
        const n = Number(match[1])
        expect(n).toBeGreaterThan(0)
        expect(n).toBeLessThanOrEqual(SOURCE_LINES.length)
        expect(srcLine(n).trim().length).toBeGreaterThan(0)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(20)
  })
})

describe('what the section says about itself that is not true of itself', () => {
  /**
   * FAILS IF: the source stops saying four, or the range stops being five.
   * The count is computed from the range rather than asserted as a literal,
   * so the gate cannot agree with a wrong number by restating it.
   */
  it('L81763 says four sync items and names a range of five', () => {
    const line = srcLine(81763)
    expect(line).toContain(
      'the four sync items `DEC-SYNC-002` through `DEC-SYNC-006` proposed in §36.2, §36.5 and §36.6',
    )
    const named = DEC_37B_IDS.filter(
      (id) => id.startsWith('DEC-SYNC-') && id >= 'DEC-SYNC-002' && id <= 'DEC-SYNC-006',
    )
    expect(named).toHaveLength(5)
    for (const id of named) expect(DEC_37B_TABLE.some((r) => r.identifier === id)).toBe(true)
  })

  /**
   * FAILS IF: the contradiction list stops being thirteen, or starts holding
   * one of the seven the classification sentence says it is drawn from.
   * Planted by asserting fourteen. Red.
   */
  it('the contradiction list holds thirteen and none of the seven claimed of it', () => {
    const line = srcLine(81759)
    const identifiers = [...line.matchAll(/`(DEC-[A-Z]+-\d{3})`/g)].map((m) => m[1])
    expect(new Set(identifiers).size).toBe(13)
    for (const id of DEC_37B_IDS) {
      if (id === 'DEC-SYNC-001') continue
      expect(line).not.toContain(id)
    }
    expect(line).toContain('`DEC-SYNC-001`')
  })

  /**
   * FAILS IF: an index count stops matching a measured count. Planted by
   * changing `DEC-SYNC-004`'s `references` from 9 to 8. Red on the measured
   * comparison, which is the half that cannot be satisfied by restating the
   * transcription: the count is derived from the whole source at run time.
   *
   * The measurement is over the whole 122,241 lines, not over a span.
   */
  it('the decision index reconciles with a measured count for all eight', () => {
    expect(DEC_37B_INDEX_ROWS).toHaveLength(8)
    expect(DEC_37B_INDEX_ROWS.map((r) => r.id)).toEqual([...DEC_37B_IDS])

    for (const row of DEC_37B_INDEX_ROWS) {
      const measured = SOURCE_TEXT.split(row.id).length - 1
      expect(measured).toBe(row.references)

      const cells = cellsOf(row.line)
      expect(cells[0]).toBe(`\`${row.id}\``)
      expect(Number(cells[2])).toBe(row.references)
    }
  })

  /**
   * FAILS IF: the diagram's source-node set stops being the eight plus
   * `DEC-STORE-001`. Parsed from the fence rather than counted by hand.
   * Planted by putting a canon identifier into `DEC_37B_IDS`. Red.
   */
  it('the dependency diagram draws nine source nodes for an eight-row table', () => {
    expect(srcLine(81741)).toBe('```mermaid')
    expect(srcLine(81755)).toBe('```')

    const sources = new Set<string>()
    for (let n = 81743; n <= 81754; n += 1) {
      const label = /^\s*[A-Z]\["([^"]+)"\]\s*-->/.exec(srcLine(n))?.[1]
      const id = label === undefined ? undefined : /DEC-[A-Z]+-\d{3}/.exec(label)?.[0]
      if (id !== undefined) sources.add(id)
    }
    expect([...sources].sort()).toEqual(
      [...DEC_37B_IDS, 'DEC-STORE-001'].sort((a, b) => a.localeCompare(b)),
    )
    expect(sources.size).toBe(9)
    expect(srcLine(81744)).toContain('DEC-WIPE-001')
  })
})

describe('no second spelling of these seven anywhere in src/', () => {
  const own = ownProbeDir()

  const walk = (dir: string, out: string[] = []): string[] => {
    const entries = presentOrNull(() => readdirSync(dir)) ?? []
    for (const entry of entries) {
      // `own` is passed deliberately: without it the walk skips the very probe
      // this gate plants, which is a gate that cannot fail.
      if (isForeignProbe(entry, own)) continue
      const full = join(dir, entry)
      const stat = presentOrNull(() => statSync(full))
      if (stat === null) continue
      if (stat.isDirectory()) walk(full, out)
      else if (full.endsWith('.ts') || full.endsWith('.tsx')) out.push(full)
    }
    return out
  }

  /** Every `ref@path` pair in `src/` declaring one of the seven, this file aside. */
  const declarations = (root: string): string[] => {
    const found: string[] = []
    for (const file of walk(root)) {
      const rel = relative(process.cwd(), file)
      if (rel === MODULE_REL) continue
      const text = presentOrNull(() => readFileSync(file, 'utf8'))
      if (text === null) continue
      for (const record of LOCAL) {
        if (text.includes(`decisionRef: '${record.decisionRef}'`)) {
          found.push(`${record.decisionRef}@${rel}`)
        }
      }
    }
    return found.sort()
  }

  const declared = (): string[] =>
    DEC_37B_ALSO_DISCLOSED_IN.map((a) => `${a.decisionRef}@${a.path}`).sort()

  /**
   * A second character-for-character record is this build's most-recorded
   * defect, so an undeclared one is red. A DELIBERATE pair is not — two
   * sections stating one question produce two records citing different lines,
   * which is what `DEC-FB-008` already does across chapters 36 and 38. The
   * rule is therefore that every other declaring file is NAMED, not that none
   * exists.
   *
   * `DEC-SYNC-001` is not in this set at all: its record is
   * `src/offline/protocol.ts`'s on purpose and is pointed at, not copied.
   *
   * FAILS IF: an undeclared module grows a record for one of the seven, or a
   * declared one stops carrying it. Planted with `withPlanted`, a scratch
   * module under `src/` declaring `decisionRef: 'DEC-SYNC-006'`; the gate
   * named the probe path. Red, then removed. Planted a second time by
   * repointing `DEC_37B_ALSO_DISCLOSED_IN`'s `DEC-OFF-002` entry at
   * `DEC-SYNC-002`, which left a real shipping record undeclared AND named a
   * pairing that does not exist. Red on both halves at once.
   */
  it('every other file declaring one of the seven is named, and each named one still holds it', () => {
    expect(declarations(join(process.cwd(), 'src'))).toEqual(declared())

    for (const also of DEC_37B_ALSO_DISCLOSED_IN) {
      const text = readFileSync(join(process.cwd(), also.path), 'utf8')
      expect(text).toContain(`decisionRef: '${also.decisionRef}'`)
      expect(also.path).not.toBe(MODULE_REL)
    }

    withPlanted(
      join(process.cwd(), 'src'),
      'probe.ts',
      "export const x = { decisionRef: 'DEC-SYNC-006' }\n",
      (probe) => {
        expect(declarations(join(process.cwd(), 'src'))).toContain(
          `DEC-SYNC-006@${relative(process.cwd(), probe)}`,
        )
      },
      own,
    )

    expect(declarations(join(process.cwd(), 'src'))).toEqual(declared())
  })
})
