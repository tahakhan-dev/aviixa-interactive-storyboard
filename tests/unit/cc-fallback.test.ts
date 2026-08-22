import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { CONNECTIVITY_MODES } from '@/scenario/controls'
import {
  CC_FALLBACK_PATTERNS,
  CC_FALLBACK_PATTERN_IDS,
  ccFallbackPatternById,
  ccFunctionalitiesNamingNoPattern,
  queuesClientSide,
  type CcFallbackPatternId,
} from '@/surfaces/cc/fallback/patterns'
import {
  CC_FROZEN_CONTROL_REASON,
  CC_FROZEN_SESSION_FACTS,
  CC_FROZEN_SESSION_QUEUES_NOTHING,
  CC_FROZEN_SESSION_RULES,
  CC_SESSION_STATES,
  frozenBannerText,
} from '@/surfaces/cc/fallback/session'

/**
 * §21.2.5's nine `FB-CC-*` patterns and §21.2.3's frozen viewer session,
 * against the FROZEN SOURCE rather than against the dispatch brief.
 *
 * EVERY COUNT BELOW IS PARSED OUT OF THE SOURCE AT RUN TIME. Nothing here
 * compares the registry against a literal copied from a brief, and nothing
 * iterates the constant it is meant to verify: the nine identifiers are
 * re-derived by scanning every line of the blueprint for the pattern-
 * introduction shape, and the nine table rows are counted by walking from
 * the separator until the table stops. A registry that gained a tenth entry,
 * or lost one, fails the set comparison in both directions.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED INTO A REAL SHIPPING FILE AND WATCHED
 * GO RED before it was left green, then the file was restored and the
 * restoration verified by checksum. The `FAILS IF` note on each names the
 * defect that was actually planted.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const srcLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''
const cellsOf = (n: number): readonly string[] =>
  srcLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

/** A data line read HEADER-KEYED: column name to cell text, never by index. */
const byHeader = (headerLine: number, dataLine: number): Readonly<Record<string, string>> => {
  const keys = cellsOf(headerLine)
  const values = cellsOf(dataLine)
  expect(values, `L${dataLine} against header L${headerLine}`).toHaveLength(keys.length)
  return Object.fromEntries(keys.map((k, i) => [k, values[i] ?? '']))
}

const TABLE_HEADER = 35692
const TABLE_SEPARATOR = 35693
const TABLE_FIRST = 35694

/**
 * The library, re-derived. A pattern is introduced on its own line as
 * ``**`FB-CC-XXX` — ...**``; nothing else in 122,241 lines carries that
 * shape. This is the discovery the registry is compared against, so a
 * source that gained a tenth pattern turns the registry red rather than the
 * registry quietly staying at nine.
 */
const DERIVED_PATTERNS: readonly { readonly id: string; readonly line: number }[] =
  SOURCE_LINES.flatMap((text, i) => {
    const m = /^\*\*`(FB-CC-[A-Za-z0-9]+)` — /.exec(text)
    return m === null ? [] : [{ id: m[1] ?? '', line: i + 1 }]
  })

/** Every `FB-CC-` token anywhere in the source, however spelled. */
const ALL_TOKENS = new Set(
  (readFileSync(SOURCE_PATH, 'utf8').match(/FB-CC-[A-Za-z0-9]+/g) ?? []) as string[],
)

describe('§21.2.5 — the nine FB-CC-* patterns, re-derived from the frozen source', () => {
  // FAILS IF: an id is added to or removed from `CcFallbackPatternId` and
  // `CC_FALLBACK_PATTERNS`. Planted: a tenth entry `FB-CC-TENTH`.
  it('is exactly the nine the source introduces, in the source’s own order', () => {
    expect(DERIVED_PATTERNS).toHaveLength(9)
    expect(CC_FALLBACK_PATTERN_IDS).toEqual(DERIVED_PATTERNS.map((p) => p.id))
  })

  it('introduces each one at the line the registry cites', () => {
    for (const derived of DERIVED_PATTERNS) {
      const registered = CC_FALLBACK_PATTERNS.find((p) => p.id === derived.id)
      expect(registered, derived.id).toBeDefined()
      expect(registered?.sourceRef, derived.id).toContain(`L${derived.line} (pattern)`)
      expect(srcLine(derived.line)).toContain(`\`${derived.id}\` — ${registered?.title ?? ''}**`)
    }
  })

  /**
   * `FB-CC-001` (L11414) and `FB-CC-002` (L13846) are the `FB-SCHED-009`
   * shape: a token that parses as the first member of a library it does not
   * belong to. They are numbered where this library is mnemonic, they sit in
   * other chapters, and a regex keyed on `FB-CC-` followed by anything
   * collects them along with the nine.
   *
   * FAILS IF: either look-alike is admitted to the registry. Planted:
   * `FB-CC-001` added to `CcFallbackPatternId` and to `CC_FALLBACK_PATTERNS`.
   */
  it('excludes the two numbered look-alikes that carry the same family prefix', () => {
    expect(srcLine(11414)).toContain('`FB-CC-001`')
    expect(srcLine(13846)).toContain('`FB-CC-002`')
    for (const line of [11414, 13846]) {
      expect(line, 'a look-alike sits inside §21.2.5').toBeLessThan(TABLE_HEADER)
    }
    expect([...ALL_TOKENS].sort()).toEqual(
      [...CC_FALLBACK_PATTERN_IDS, 'FB-CC-001', 'FB-CC-002'].sort(),
    )
    for (const lookAlike of ['FB-CC-001', 'FB-CC-002']) {
      expect(CC_FALLBACK_PATTERN_IDS as readonly string[]).not.toContain(lookAlike)
    }
  })

  /**
   * The rows are COUNTED, never inferred from the span the brief gives.
   * The walk starts after the separator and stops at the first line that is
   * not a table row, so the separator cannot be mistaken for data and a
   * tenth row appearing in the source would be found.
   */
  it('carries nine data rows, counted from the separator to the end of the table', () => {
    expect(srcLine(TABLE_HEADER).startsWith('| Pattern |')).toBe(true)
    expect(srcLine(TABLE_SEPARATOR)).toBe('|---|---|---|---|---|')
    let line = TABLE_FIRST
    while (srcLine(line).startsWith('|')) line++
    expect(line - TABLE_FIRST).toBe(9)
    expect(CC_FALLBACK_PATTERNS).toHaveLength(line - TABLE_FIRST)
  })

  // FAILS IF: any transcribed cell drifts from the source by one character.
  // Planted: `FB-CC-QUEUE`'s `decisionControls` changed from "Disabled for
  // that item only" to "Disabled".
  it('transcribes every cell verbatim, header-keyed off L35692', () => {
    CC_FALLBACK_PATTERNS.forEach((pattern, index) => {
      const dataLine = TABLE_FIRST + index
      const row = byHeader(TABLE_HEADER, dataLine)
      expect(pattern.sourceRef, pattern.id).toContain(`L${dataLine} (table row)`)
      expect(row['Pattern'], pattern.id).toBe(`\`${pattern.id}\``)
      expect(row['Triggering condition'], pattern.id).toBe(pattern.triggeringCondition)
      expect(row['Decision controls'], pattern.id).toBe(pattern.decisionControls)
      expect(row['Client-side queueing'], pattern.id).toBe(pattern.clientSideQueueing)
      expect(row['Terminal safe state'], pattern.id).toBe(pattern.terminalSafeState)
    })
  })
})

describe('the Client-side queueing column — the honesty rule in one column', () => {
  /**
   * `AC-CC-091` (L35711). The classification is read off the SOURCE's own
   * cells, not off the registry, so a registry cell rewritten to permit a
   * queue fails the verbatim gate above AND this one.
   *
   * FAILS IF: any pattern's queueing cell stops refusing a client-side
   * queue. Planted: `FB-CC-SESS`'s cell changed to "Queued until reconnect".
   */
  it('refuses a client-side queue on all nine paths', () => {
    for (const pattern of CC_FALLBACK_PATTERNS) {
      expect(queuesClientSide(pattern), pattern.id).toBe(false)
    }
    expect(srcLine(35711)).toBe(
      '- `AC-CC-091` — No fallback path on this surface queues an authority action client-side.',
    )
  })

  /**
   * The nine cells are NOT one sentence, and reducing them to a boolean
   * would lose the distinction the source draws. Seven read "Not applicable"
   * — the surface has nothing to queue on that path — and two read "None,
   * deliberately", which is the stronger statement: a write exists there and
   * is still not queued. The split is derived from the source, then compared
   * against the registry; neither number is written down twice.
   */
  it('draws the source’s own two shapes, seven and two, derived not quoted', () => {
    const cells = CC_FALLBACK_PATTERNS.map((_, i) =>
      byHeader(TABLE_HEADER, TABLE_FIRST + i)['Client-side queueing'],
    )
    const notApplicable = cells.filter((c) => c?.startsWith('Not applicable') === true)
    const deliberate = cells.filter((c) => c === 'None, deliberately')
    expect(notApplicable.length + deliberate.length).toBe(cells.length)
    expect(deliberate).toHaveLength(2)
    expect(notApplicable).toHaveLength(7)

    const deliberateIds = CC_FALLBACK_PATTERNS.filter(
      (p) => p.clientSideQueueing === 'None, deliberately',
    ).map((p) => p.id)
    expect(deliberateIds).toEqual(['FB-CC-SESS', 'FB-CC-WRITE'])

    // Of the seven, only FIVE use the exact words "nothing is written".
    // `FB-CC-CMD` and `FB-CC-AUTH` give different reasons, and a gate that
    // asserted "nothing is written" of all seven would be asserting a
    // sentence the source does not carry.
    expect(cells.filter((c) => c === 'Not applicable — nothing is written')).toHaveLength(5)
    expect(ccFallbackPatternById('FB-CC-CMD').clientSideQueueing).toBe(
      'Not applicable — the device queues, not the board',
    )
    expect(ccFallbackPatternById('FB-CC-AUTH').clientSideQueueing).toBe(
      'Not applicable — session denied',
    )
  })
})

describe('AC-CC-090 — every functionality references at least one pattern', () => {
  it('is the criterion the source states, at the line the registry cites', () => {
    expect(srcLine(35710)).toBe(
      '- `AC-CC-090` — Every functionality in this chapter references at least one `FB-CC-*` pattern.',
    )
  })

  // FAILS IF: the helper stops finding a functionality that names no
  // pattern. Planted: the filter inverted to `f.patterns.length > 0`.
  it('names the functionalities that reference none, and only those', () => {
    const patterns: readonly CcFallbackPatternId[] = ['FB-CC-STALE']
    expect(
      ccFunctionalitiesNamingNoPattern([
        { id: 'FUNC-A', patterns },
        { id: 'FUNC-B', patterns: [] },
        { id: 'FUNC-C', patterns: ['FB-CC-QUEUE', 'FB-CC-SESS'] },
      ]),
    ).toEqual(['FUNC-B'])
    expect(ccFunctionalitiesNamingNoPattern([{ id: 'FUNC-A', patterns }])).toEqual([])
  })

  it('throws rather than returning undefined for an unregistered id', () => {
    expect(() => ccFallbackPatternById('FB-CC-001' as CcFallbackPatternId)).toThrow('FB-CC-001')
  })
})

describe('§21.2.3 — the frozen viewer session, and what it is not', () => {
  // FAILS IF: a rule heading drifts from the source. Planted: rule 4's text
  // changed from "Queue nothing." to "Queue nothing".
  it('carries DEC-CCOFF-001’s six rules verbatim, at L35507-L35512', () => {
    expect(srcLine(35503)).toContain('`DEC-CCOFF-001`')
    expect(CC_FROZEN_SESSION_RULES).toHaveLength(6)
    CC_FROZEN_SESSION_RULES.forEach((rule, index) => {
      const line = 35507 + index
      expect(rule.sourceRef).toBe(`L${line}`)
      expect(srcLine(line)).toContain(`${index + 1}. **${rule.rule}**`)
    })
  })

  /**
   * The three-case table is transcribed HEADER-KEYED off its `Aspect`
   * column and its `Command Center session offline` column name. A
   * positional read of this table puts a device's answer onto a browser
   * session, which is the one mistake §21.2.3 exists to prevent.
   *
   * FAILS IF: a fact is taken from the wrong column. Planted: the
   * `Actions queued client-side` fact changed to the device column's cell,
   * "Not applicable — the device queues captures, not the board".
   */
  it('transcribes the Command Center session column, seven rows, counted', () => {
    const header = 35541
    expect(srcLine(header).startsWith('| Aspect |')).toBe(true)
    expect(srcLine(header + 1)).toBe('|---|---|---|---|')
    let line = header + 2
    while (srcLine(line).startsWith('|')) line++
    expect(line - (header + 2)).toBe(7)
    expect(CC_FROZEN_SESSION_FACTS).toHaveLength(line - (header + 2))

    CC_FROZEN_SESSION_FACTS.forEach((fact, index) => {
      const dataLine = header + 2 + index
      const row = byHeader(header, dataLine)
      expect(fact.sourceRef, fact.aspect).toBe(`L${dataLine}`)
      expect(row['Aspect'], fact.aspect).toBe(fact.aspect)
      expect(row['Command Center session offline'], fact.aspect).toBe(
        fact.commandCenterSessionOffline,
      )
    })
  })

  // FAILS IF: the banner stops being SB-CC-05's. Planted: the trailing
  // sentence naming the alternate route deleted from `frozenBannerText`.
  it('renders SB-CC-05’s banner and tooltip verbatim, with only the time varying', () => {
    const quoted = [...srcLine(35535).matchAll(/"([^"]+)"/g)].map((m) => m[1] ?? '')
    expect(quoted[0]).toBe(frozenBannerText('11:13:52'))
    expect(quoted).toContain(CC_FROZEN_CONTROL_REASON)
    expect(frozenBannerText('10:26:41')).not.toBe(frozenBannerText('11:13:52'))
    // Rule 2's own shorter banner, so the parameterised prefix is the
    // source's and not a paraphrase of it.
    expect(srcLine(35508)).toContain('"Not live · last update 10:26:41 · this screen is frozen.')
  })

  /**
   * THE RULING, PINNED. A frozen viewer session is deliberately NOT a
   * seventh `ConnectivityMode`: `src/scenario/controls.ts` is read by every
   * surface, and `offline` there means a device holding captures it will
   * sync later, where this surface holds nothing at all.
   *
   * FAILS IF: a later slice adds the mode without reconciling this file.
   * That red is the intended consequence — it forces the two models to be
   * settled together instead of drifting into two spellings of one state.
   * Planted: `'frozen'` added to `ConnectivityMode` and `CONNECTIVITY_MODES`.
   */
  it('is not a connectivity mode, and the six modes still do not carry one', () => {
    expect(CONNECTIVITY_MODES).toEqual([
      'online',
      'slow',
      'flapping',
      'offline',
      'dependency-down',
      'recovering',
    ])
    for (const mode of CONNECTIVITY_MODES) {
      expect(CC_SESSION_STATES as readonly string[], mode).not.toContain(mode)
    }
    expect(CC_SESSION_STATES).toEqual(['live', 'frozen'])
  })

  // FAILS IF: the invariant is restated instead of derived. Planted:
  // `FB-CC-SESS`'s queueing cell changed to "Queued until reconnect", which
  // must flip this constant as well as the column gate above.
  it('derives “queues nothing” from the pattern row rather than restating it', () => {
    expect(CC_FROZEN_SESSION_QUEUES_NOTHING).toBe(true)
    expect(ccFallbackPatternById('FB-CC-SESS').clientSideQueueing).toBe('None, deliberately')
    expect(srcLine(35658)).toContain('nothing is queued client-side, ever.')
  })
})
