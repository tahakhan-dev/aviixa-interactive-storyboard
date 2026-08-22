import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import {
  ARTEFACT_COUNT_CONTRADICTION,
  ENUMERATED_ARTEFACTS,
  ENUMERATION_LINE,
} from '@/honesty/artefacts'
import {
  fold,
  isBareClaim,
  LEXICON,
  PHRASING_RULES,
  phrasingMatches,
  type PhrasingRule,
} from '@/honesty/lexicon'
import {
  COMPLETION_LICENSED_STATES,
  HonestElement,
  honestyDefects,
  ORIGIN_LABEL,
  type ElementUnderTest,
} from '@/honesty/HonestElement'
import { COMMAND_STATES, type CommandState } from '@/surfaces/sa/command-state'

/**
 * # THE HONESTY KERNEL, CHECKED AGAINST THE FROZEN SOURCE
 *
 * Three pieces, and this file checks each against the line it was transcribed
 * from rather than against itself.
 *
 *   `src/honesty/artefacts.ts`     the enumeration at L78386 and the count
 *                                  contradiction over it.
 *   `src/honesty/lexicon.ts`       the eight-row table at L78400-L78407 and the
 *                                  nine lexical rules built on it.
 *   `src/honesty/HonestElement.tsx` the three-clause element test at
 *                                  L78392-L78394, and the effect clause bound
 *                                  to a `CommandState`.
 *
 * The rendered half of the lexicon is a different instrument and lives in
 * `tests/coverage/offline-phrasing.test.ts`, which reads the built tree. This
 * one reads nothing the build writes.
 *
 * ## THE ONE ASSERTION THAT MAKES THE DICTIONARY NON-VACUOUS
 *
 * `every rule fires on the phrasing its own row prohibits` runs each rule
 * against the source's own column-one cell. A pattern that stopped matching the
 * thing it was written for is the exact shape of a gate that reports safety
 * over nothing, and this build has shipped fifteen of those.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)
const sourceLines = ((lines: readonly string[]) =>
  lines.at(-1) === '' ? lines.slice(0, -1) : lines)(sourceBytes.toString('utf8').split('\n'))

const lineAt = (line: number): string => fold(sourceLines[line - 1] ?? '')

describe('honesty kernel: the frozen source it is transcribed from', () => {
  it('is present where every locator points', () => {
    expect(existsSync(SOURCE_PATH), `frozen source not found at ${SOURCE_PATH}`).toBe(true)
  })

  it('is the frozen bytes and not a drifted copy', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
  })

  it('has the line count these locators are numbered against', () => {
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

describe('honesty kernel: the enumerated artefacts', () => {
  it('is transcribed from the line that carries the rule', () => {
    const rule = lineAt(ENUMERATION_LINE)
    expect(rule).toContain(
      fold('may display, phrase, colour, badge, animate, count, aggregate, export or notify'),
    )
    expect(rule).toContain(fold('implies an offline tablet has received or applied any of'))
  })

  // Cell by cell and IN ORDER, never as a set: a transcription that carries the
  // right twenty-one words in the wrong sequence is a different enumeration.
  it('carries every artefact verbatim, in the order the line enumerates them', () => {
    const rule = lineAt(ENUMERATION_LINE)
    let at = rule.indexOf(fold('any of the following:'))
    expect(at, 'the enumeration no longer opens where it did').toBeGreaterThan(-1)
    const outOfOrder: string[] = []
    for (const artefact of ENUMERATED_ARTEFACTS) {
      const found = rule.indexOf(fold(artefact), at)
      if (found === -1) outOfOrder.push(artefact)
      else at = found + fold(artefact).length
    }
    expect(outOfOrder).toEqual([])
  })

  // The count is COUNTED here rather than asserted against a literal: the
  // enumeration's own semicolons decide, so this cannot agree with the
  // transcription by copying it.
  it('holds as many artefacts as the line has semicolon-separated items', () => {
    const rule = sourceLines[ENUMERATION_LINE - 1] ?? ''
    const opens = rule.indexOf('any of the following: ')
    const closes = rule.indexOf('.', rule.indexOf('scheduled-work failure or replay'))
    const items = rule.slice(opens + 'any of the following: '.length, closes).split('; ')
    expect(items).toHaveLength(21)
    expect(ENUMERATED_ARTEFACTS).toHaveLength(items.length)
  })

  it('records the counted reading against the enumeration itself', () => {
    const counted = ARTEFACT_COUNT_CONTRADICTION.counted
    expect(counted.count).toBe(ENUMERATED_ARTEFACTS.length)
    expect(counted.blueprintLine).toBe(ENUMERATION_LINE)
    expect(lineAt(counted.blueprintLine)).toContain(fold(counted.words))
  })

  // Four places, four locators, and every one opened. The brief this task was
  // dispatched with named L78950 for the fourth; that line carries the
  // twenty-event matrix row and the claim is the row after it.
  it('records four claimed readings, each verbatim at its own line', () => {
    const claimed = ARTEFACT_COUNT_CONTRADICTION.claimed
    expect(claimed).toHaveLength(4)
    const wrong = claimed
      .filter((r) => !lineAt(r.blueprintLine).includes(fold(r.words)))
      .map((r) => `L${String(r.blueprintLine)} does not carry: ${r.words}`)
    expect(wrong).toEqual([])
    expect(claimed.every((r) => r.count === 22)).toBe(true)
    expect(claimed.every((r) => lineAt(r.blueprintLine).includes('twenty-two'))).toBe(true)
  })

  it('does not carry the twenty-two claim at the line the brief named', () => {
    expect(lineAt(78950)).not.toContain('twenty-two')
    expect(lineAt(78951)).toContain('twenty-two')
  })

  it('chooses neither reading', () => {
    const counts = new Set([
      ARTEFACT_COUNT_CONTRADICTION.counted.count,
      ...ARTEFACT_COUNT_CONTRADICTION.claimed.map((r) => r.count),
    ])
    expect([...counts].sort()).toEqual([21, 22])
    expect(ARTEFACT_COUNT_CONTRADICTION.statement.length).toBeGreaterThan(200)
  })
})

describe('honesty kernel: the prohibited-phrasing lexicon', () => {
  it('transcribes eight rows, in source order, one line apart', () => {
    expect(LEXICON).toHaveLength(8)
    expect(LEXICON.map((r) => r.blueprintLine)).toEqual([
      78400, 78401, 78402, 78403, 78404, 78405, 78406, 78407,
    ])
  })

  it('carries all three cells of every row verbatim at that row', () => {
    const wrong: string[] = []
    for (const row of LEXICON) {
      const line = lineAt(row.blueprintLine)
      for (const cell of [row.prohibited, row.why, row.replacement]) {
        if (!line.includes(fold(cell))) {
          wrong.push(`L${String(row.blueprintLine)} does not carry: ${cell}`)
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it('reads the table the header at L78398 introduces and nothing past its end', () => {
    expect(lineAt(78398)).toContain(fold('| Prohibited phrasing | Why it breaks the rule |'))
    // The line after the last row is blank, so the table ends where the
    // transcription says it does and there is no ninth row to have missed.
    expect(sourceLines[78407] ?? 'x').toBe('')
  })

  it('gives every row a rule, and every rule its own words at its own line', () => {
    expect(PHRASING_RULES).toHaveLength(LEXICON.length + 1)
    const ruleIds = new Set<string>(PHRASING_RULES.map((r) => r.id))
    expect(LEXICON.filter((row) => !ruleIds.has(row.id)).map((row) => row.id)).toEqual([])
    const wrong = PHRASING_RULES.filter((r) => !lineAt(r.blueprintLine).includes(fold(r.quote))).map(
      (r) => `${r.id}: L${String(r.blueprintLine)} does not carry its quote`,
    )
    expect(wrong).toEqual([])
  })

  it('carries exactly one rule with no table row of its own, and says which', () => {
    const rowIds = new Set<string>(LEXICON.map((row) => row.id))
    const extra = PHRASING_RULES.filter((r) => !rowIds.has(r.id))
    expect(extra.map((r) => r.id)).toEqual(['tick-next-to-done'])
    expect(lineAt(78384)).toContain(fold('must never draw a tick next to'))
  })

  // THE NON-VACUITY CHECK. Every rule is run against the phrasing its own row
  // prohibits. A pattern that no longer matches the thing it exists for reports
  // safety over nothing, silently, in a green run.
  it('every rule fires on the phrasing its own row prohibits', () => {
    const idle: string[] = []
    for (const row of LEXICON) {
      const hits = phrasingMatches(fold(row.prohibited)).filter((m) => m.ruleId === row.id)
      if (hits.length === 0) idle.push(`${row.id} does not match ${row.prohibited}`)
    }
    expect(idle).toEqual([])
  })

  it('reads a plural, a copula and a middle-dot neighbour', () => {
    const ids = (text: string): string[] => phrasingMatches(fold(text)).map((m) => m.ruleId)
    expect(ids('Holds released')).toContain('hold-released')
    expect(ids('The hold has been released')).toContain('hold-released')
    expect(ids('Hold released · 11:04')).toContain('hold-released')
    expect(ids('Tablets wiped')).toContain('device-wiped')
    expect(ids('Clearances granted to Maya')).toContain('clearance-granted')
    expect(ids('All tablets are up to date')).toContain('all-devices-up-to-date')
  })

  // The letter lookarounds, which are what a `\b` pattern loses on a joined
  // string. `resynced` and `abandoned` must not read as the lone states.
  it('refuses a longer word that merely contains a rule', () => {
    expect(phrasingMatches(fold('resynced'))).toEqual([])
    expect(phrasingMatches(fold('abandoned'))).toEqual([])
    expect(phrasingMatches(fold('The lot was withheld and unreleased'))).toEqual([])
  })

  it('separates the lone state from the honest sentence that contains the word', () => {
    const lone = fold('Synced')
    const [match] = phrasingMatches(lone)
    expect(match?.ruleId).toBe('synced-alone')
    expect(isBareClaim(lone, match as NonNullable<typeof match>)).toBe(true)

    const sentence = fold('Last synced 08:29 · 14 pending')
    const [inSentence] = phrasingMatches(sentence)
    expect(inSentence?.ruleId).toBe('synced-alone')
    expect(isBareClaim(sentence, inSentence as NonNullable<typeof inSentence>)).toBe(false)
  })

  it('discounts a tick or a bullet at the ends and nothing in the middle', () => {
    const decorated = fold('✓ Synced ·')
    const [match] = phrasingMatches(decorated)
    expect(isBareClaim(decorated, match as NonNullable<typeof match>)).toBe(true)
    const interrupted = fold('Synced · 14 pending')
    const [second] = phrasingMatches(interrupted)
    expect(isBareClaim(interrupted, second as NonNullable<typeof second>)).toBe(false)
  })

  it('gives every rule a distinct name', () => {
    const ids = PHRASING_RULES.map((r: PhrasingRule) => r.id)
    expect(ids.length).toBe(new Set(ids).size)
  })
})

describe('honesty kernel: the three-clause element test', () => {
  const serverFact = { from: 'server-record' } as const
  const deviceFact = { from: 'device', asOfLabel: 'as at 09:38' } as const
  const noIntent = { aimedAtDevice: false } as const

  it('is transcribed from the three clauses the source states', () => {
    expect(lineAt(78390)).toContain(fold('An element passes only if all three clauses hold'))
    expect(lineAt(78392)).toContain(fold('The element names where the fact came from'))
    expect(lineAt(78393)).toContain(fold('it carries the age of that knowledge'))
    expect(lineAt(78394)).toContain(fold('it names the command'))
    expect(lineAt(78394)).toContain(fold('does not use any word implying completion'))
  })

  it('names the two defect exits the diagram ends in, and only those two', () => {
    expect(lineAt(78417)).toContain(fold('Defect - add origin and age'))
    expect(lineAt(78418)).toContain(
      fold('Defect - replace completion wording with the command state'),
    )
    expect(lineAt(78430)).toContain(fold('they are the only two failure modes'))
  })

  it('names both origins in the words the origin clause gives them', () => {
    expect(lineAt(78392)).toContain(fold(ORIGIN_LABEL.device))
    expect(lineAt(78392)).toContain(fold(ORIGIN_LABEL['server-record']))
  })

  // The effect clause consumes the shipped union. A second spelling of the
  // fifteen states is the defect this build records most often, so the licence
  // is asserted to be a subset of the one that already exists.
  it('licenses completion wording only at states drawn from the shipped fifteen', () => {
    expect(COMMAND_STATES).toHaveLength(15)
    const licensed = [...COMPLETION_LICENSED_STATES]
    expect(licensed.filter((s) => !COMMAND_STATES.includes(s))).toEqual([])
    expect(licensed.sort()).toEqual(['acknowledged', 'reconciled'])
    // AC-OFF-401 at L78442 is what settles the line: completion wording is
    // refused against a device that has not acknowledged.
    expect(lineAt(78442)).toContain(fold('against a device that has not acknowledged'))
  })

  it('passes an honest element', () => {
    expect(
      honestyDefects({
        statement: 'Release issued 11:04, in force on 3 of 4 devices.',
        fact: deviceFact,
        intent: { aimedAtDevice: true, commandState: 'delivered' },
      }),
    ).toEqual([])
  })

  it('reports a device-derived element whose age is blank', () => {
    expect(
      honestyDefects({
        statement: 'Fourteen captures are held on this tablet.',
        fact: { from: 'device', asOfLabel: '   ' },
        intent: noIntent,
      }),
    ).toEqual(['Defect - add origin and age'])
  })

  it('reports completion wording against a state short of acknowledgement', () => {
    const unlicensed: readonly CommandState[] = COMMAND_STATES.filter(
      (s) => !COMPLETION_LICENSED_STATES.has(s),
    )
    expect(unlicensed).toHaveLength(13)
    const still = unlicensed.filter(
      (commandState) =>
        honestyDefects({
          statement: 'Hold released.',
          fact: serverFact,
          intent: { aimedAtDevice: true, commandState },
        }).length === 0,
    )
    expect(still, 'a state short of acknowledgement licensed a completion claim').toEqual([])
  })

  it('permits the same wording once the device has acknowledged', () => {
    for (const commandState of COMPLETION_LICENSED_STATES) {
      expect(
        honestyDefects({
          statement: 'Hold released.',
          fact: serverFact,
          intent: { aimedAtDevice: true, commandState },
        }),
      ).toEqual([])
    }
  })

  // Declaring the element is not about a device does not make the sentence stop
  // saying it, and this is the evasion the clause would otherwise have.
  it('reports completion wording from an element that declares no device intent', () => {
    expect(
      honestyDefects({
        statement: 'Hold released.',
        fact: serverFact,
        intent: noIntent,
      }),
    ).toEqual(['Defect - replace completion wording with the command state'])
  })

  it('reports both exits at once when both are taken', () => {
    const element: ElementUnderTest = {
      statement: 'Device wiped.',
      fact: { from: 'device', asOfLabel: '' },
      intent: noIntent,
    }
    expect([...honestyDefects(element)].sort()).toEqual([
      'Defect - add origin and age',
      'Defect - replace completion wording with the command state',
    ])
  })
})

describe('honesty kernel: the element the three clauses describe, rendered', () => {
  /** Text nodes kept apart, so an assertion cannot be satisfied by a join. */
  const textNodesOf = (markup: string): string[] => {
    const doc = new JSDOM(`<!DOCTYPE html><html lang="en"><body>${markup}</body></html>`).window
      .document
    const walker = doc.createTreeWalker(doc.body, 4)
    const nodes: string[] = []
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = (node.nodeValue ?? '').replace(/\s+/g, ' ').trim()
      if (text !== '') nodes.push(text)
    }
    return nodes
  }

  it('renders the statement, the origin carrying its age, and the command state', () => {
    const nodes = textNodesOf(
      renderToStaticMarkup(
        createElement(HonestElement, {
          statement: 'Release issued 11:04, in force on 3 of 4 devices.',
          fact: { from: 'device', asOfLabel: 'as at 09:38' },
          intent: { aimedAtDevice: true, commandState: 'delivered' },
        }),
      ),
    )
    expect(nodes).toContain('Release issued 11:04, in force on 3 of 4 devices.')
    // The shipped FreshnessLabel renders both halves of the origin reading in
    // one text node, so the age and the origin are asserted together, as the
    // page actually carries them.
    expect(nodes).toContain(`as at 09:38, ${ORIGIN_LABEL.device}`)
    expect(nodes).toContain('delivered')
  })

  it('names the server record as the origin when the fact is not the device’s', () => {
    const nodes = textNodesOf(
      renderToStaticMarkup(
        createElement(HonestElement, {
          statement: 'Clearance recorded 10:12.',
          fact: { from: 'server-record' },
          intent: { aimedAtDevice: false },
        }),
      ),
    )
    expect(nodes).toContain(ORIGIN_LABEL['server-record'])
    expect(nodes.some((n) => n.includes('as at'))).toBe(false)
  })

  it('refuses to render a defective element at all', () => {
    expect(() =>
      renderToStaticMarkup(
        createElement(HonestElement, {
          statement: 'Hold released.',
          fact: { from: 'server-record' },
          intent: { aimedAtDevice: true, commandState: 'queued' },
        }),
      ),
    ).toThrow(/replace completion wording/)
  })

  it('renders every one of the fifteen states without collapsing any of them', () => {
    const rendered = COMMAND_STATES.map((commandState) =>
      textNodesOf(
        renderToStaticMarkup(
          createElement(HonestElement, {
            statement: 'The command is recorded centrally and applies at the next sync.',
            fact: { from: 'server-record' },
            intent: { aimedAtDevice: true, commandState },
          }),
        ),
      ),
    )
    const missing = COMMAND_STATES.filter((s, i) => !(rendered[i] ?? []).includes(s))
    expect(missing).toEqual([])
  })
})
