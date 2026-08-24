import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  FALLBACK_CONTRACT_OWNERS,
  FALLBACK_IDENTIFIER_RANGES,
  expandRange,
  fallbackKey,
  ownerAt,
  ownersOf,
} from '@/ai/fallbacks/registry'

/**
 * Slice 11, wave 0, task 6 — the collision-aware fallback registry.
 *
 * WHAT THIS FILE IS FOR. The source uses the literal `FB-AI-01` for four
 * different contracts in four different places, and `FB-AI-12` for two. A
 * registry keyed on the bare literal answers one of them and looks correct
 * doing it. So the key is a compound of chapter and identifier, a lookup of a
 * bare literal returns EVERY owner, and this file's job is to prove both —
 * and to prove that the collision is real rather than asserted, by measuring
 * it off the frozen bytes.
 *
 * THE ONE THAT WOULD HAVE BEEN MISSED. Section 44A.31's register has thirteen
 * data rows, and the thirteenth is not an identifier: it is a RANGE standing
 * for thirty contracts. A gate keyed on thirteen asserts the wrong
 * cardinality, and a registry that flattens the range into a row loses the
 * twenty-nine it stands for. The range is registered as a range and expanded
 * against the storyboard cards that actually claim its members.
 *
 * Every figure below is re-derived from the frozen source at run time.
 */

const SOURCE_PATH =
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''
const lineOf = (locator: string): string => L(Number(locator.slice(1)))

const linesCarrying = (token: string): readonly number[] =>
  LINES.reduce<number[]>((acc, text, index) => {
    if (index > 0 && text.includes(token)) acc.push(index)
    return acc
  }, [])

/** The contiguous run of data rows under a header line, separator excluded. */
const dataRowsUnder = (header: number): readonly number[] => {
  const rows: number[] = []
  for (let n = header + 1; L(n).startsWith('|'); n += 1) {
    if (/^\|[\s|:-]+\|$/.test(L(n))) continue
    rows.push(n)
  }
  return rows
}

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── the two registers, located and counted ────────────────────────────── */

/**
 * Both headers are located by search and asserted UNIQUE before `[0]` is
 * taken. Every row index in this file is derived from these two numbers, and
 * a `[0]` on a multi-hit search silently anchors the whole file to whichever
 * table came first — which, for a file whose entire subject is two registers
 * that share sixteen literals, is the failure it exists to catch.
 */
const uniqueHeader = (header: string): number => {
  const found = linesCarrying(header)
  expect(found, `the header "${header}" occurs exactly once`).toHaveLength(1)
  return found[0]!
}

const CH_40_41_HEADER = uniqueHeader('| Identifier | Contract | Section |')
const CH_44A_HEADER = uniqueHeader(
  '| Identifier | Contract | Owning section | Terminal safe state |',
)

describe('both registers are counted, never inferred from a span', () => {
  /**
   * FAILS IF: the chapter 40/41 register gains or loses a row, or the registry
   * stops holding one of them. The expectation is the SOURCE's own first
   * column, so the registry cannot pass by agreeing with a copy of itself.
   *
   * Planted: the `FB-AI-12` chapter-40 owner deleted. RED, naming it.
   */
  it('holds every row of the chapter 40 and 41 register', () => {
    const rows = dataRowsUnder(CH_40_41_HEADER)
    const fromSource = rows.map((n) => `L${n}`)
    const registered = FALLBACK_CONTRACT_OWNERS.filter((o) => rows.includes(Number(o.locator.slice(1))))
    expect(registered.map((o) => o.locator)).toEqual(fromSource)
  })

  /**
   * FAILS IF: the thirteenth row of 44A.31 is ever registered as an
   * identifier. It is a range, and treating it as one row is how a build
   * asserts thirteen contracts where the source names thirty.
   *
   * Planted: the range row registered as an owner with identifier
   * `FB-AI-01 to FB-AI-30`. RED — the register's named rows no longer match
   * the twelve the source names.
   */
  it('registers 44A.31’s named rows as owners and its last row as a range', () => {
    const rows = dataRowsUnder(CH_44A_HEADER)
    const last = rows[rows.length - 1]!
    const named = rows.slice(0, -1)

    // The last row is a range, in the source's own words.
    expect(L(last)).toContain('to `FB-AI-30`')
    expect(L(last)).toContain('One per storyboard')
    // Every earlier row names one identifier and it is not an `FB-AI-*` one.
    for (const n of named) expect(L(n), `L${n}`).toMatch(/^\| `FB-AGT-[A-Z]+-\d+` \|/)

    const registered = FALLBACK_CONTRACT_OWNERS.filter((o) => named.includes(Number(o.locator.slice(1))))
    expect(registered.map((o) => o.locator)).toEqual(named.map((n) => `L${n}`))
    // And the range row is registered exactly once, as a range.
    expect(FALLBACK_IDENTIFIER_RANGES.map((r) => r.locator)).toEqual([`L${last}`])
    expect(FALLBACK_CONTRACT_OWNERS.map((o) => o.locator)).not.toContain(`L${last}`)
  })

  /**
   * FAILS IF: the range stops standing for the identifiers that are actually
   * claimed. The expansion is checked against the thirty storyboard cards
   * swept out of the frozen source, not against a literal list — so a range
   * that quietly narrows, or a storyboard whose card claims a contract the
   * range does not cover, is red.
   *
   * Planted: the range's `last` shortened to `FB-AI-16`. RED, listing the
   * fourteen claimed identifiers the range then fails to cover.
   */
  it('expands the range to exactly the identifiers the storyboard cards claim', () => {
    const claimed: string[] = []
    for (let n = 1; n < LINES.length; n += 1) {
      const m = L(n).match(/^\| Identifier \| `SB-AI-\d{2}`; fallback contract `(FB-AI-\d{2})`/)
      if (m) claimed.push(m[1]!)
    }
    expect(claimed.length, 'the sweep found storyboard cards').toBeGreaterThan(0)
    expect(new Set(claimed).size, 'no card claims a contract twice').toBe(claimed.length)

    const range = FALLBACK_IDENTIFIER_RANGES[0]!
    expect(expandRange(range)).toEqual(claimed)
  })
})

/* ── the collision, measured rather than asserted ──────────────────────── */

/** Every literal owned under more than one chapter, from the registry itself. */
const collidingLiterals = (): readonly string[] => {
  const byId = new Map<string, Set<string>>()
  for (const o of FALLBACK_CONTRACT_OWNERS) {
    const set = byId.get(o.identifier) ?? new Set<string>()
    set.add(o.chapter)
    byId.set(o.identifier, set)
  }
  return [...byId.entries()].filter(([, chapters]) => chapters.size > 1).map(([id]) => id)
}

describe('the compound key exists because the bare literal is not unique', () => {
  /**
   * FAILS IF: the registry ever becomes safely keyable on the bare
   * identifier — in which case the compound key is unjustified — or if two
   * records ever share a compound key, in which case it does not work. Both
   * directions, because either one alone is satisfiable by an empty registry.
   */
  it('keys uniquely on chapter and identifier, and not uniquely on identifier', () => {
    const keys = FALLBACK_CONTRACT_OWNERS.map((o) => fallbackKey(o.chapter, o.identifier))
    expect(new Set(keys).size, 'two owners share one compound key').toBe(keys.length)

    const bare = FALLBACK_CONTRACT_OWNERS.map((o) => o.identifier)
    expect(
      new Set(bare).size,
      'the bare identifier is unique here, so the compound key buys nothing',
    ).toBeLessThan(bare.length)
    expect(collidingLiterals().length).toBeGreaterThan(0)
  })

  /**
   * FAILS IF: a lookup of a colliding literal ever answers with one owner.
   * This is THE defect the registry exists to prevent: a resolver that
   * silently picks the first is indistinguishable from a correct one until
   * the day it answers with the wrong chapter's contract.
   *
   * AND THE LOOP CARRIES A POSITIVE CONTROL. `colliding` being empty makes
   * the loop body run zero times and the test pass while proving nothing —
   * which is exactly the state a registry that stopped registering colliding
   * owners would be in. The sibling test above measures the same thing as a
   * property of the registry; this one has to measure it for itself, because
   * a control that lives in another `it` is a control this `it` does not have.
   *
   * Planted: `ownersOf` changed to return the first match only. RED on every
   * colliding literal at once.
   * Planted: `collidingLiterals` narrowed to return `[]`. RED on the control
   * — GREEN before it existed.
   */
  it('returns every owner of a colliding literal, never the first', () => {
    const colliding = collidingLiterals()
    expect(colliding.length, 'no literal collides, so this loop proves nothing').toBeGreaterThan(0)
    for (const id of colliding) {
      const owners = ownersOf(id)
      expect(owners.length, `${id} resolved to a single owner`).toBeGreaterThan(1)
      expect(new Set(owners.map((o) => o.chapter)).size, `${id} chapters`).toBe(owners.length)
    }
    // And a lookup of a literal nobody owns answers with nothing rather than
    // with a neighbour.
    expect(ownersOf('FB-AI-99')).toEqual([])
  })

  /**
   * FAILS IF: one of `FB-AI-01`'s four owners is dropped. Named individually
   * rather than counted, because a count is satisfied by any four owners and
   * the point is WHICH four: two registers, a chapter-24 family table, and a
   * chapter-30D failure paragraph. Each is checked against its own line.
   *
   * Planted: the L74495 owner deleted. RED, naming the missing chapter.
   */
  it('gives FB-AI-01 all four of its owners, each verified at its own line', () => {
    const owners = ownersOf('FB-AI-01')
    expect(owners.map((o) => o.chapter).sort()).toEqual(['24', '30D.8', '40.1', '44A.1'])
    for (const o of owners) {
      expect(lineOf(o.locator), `${o.locator} identifier`).toContain('FB-AI-01')
      expect(lineOf(o.contractLocator), `${o.contractLocator} contract`).toContain(o.contract)
    }
    // The chapter-24 owner is a FAMILY name, not a numbered contract — which
    // is why a registry keyed on the literal cannot even tell what kind of
    // thing it is holding.
    expect(ownerAt('24', 'FB-AI-01')!.contract).toContain('including the platform emergency pause')
  })

  /**
   * FAILS IF: the model narrows to the FB-AI-01…16 range. `FB-AI-12` collides
   * too, and one of `FB-AI-01`'s four meanings IS `FB-AI-12`'s chapter-40
   * subject — so a build that treats the collision as a property of the low
   * numbers is wrong at 44A.12, which is where a worker flags an unsafe
   * response.
   */
  it('holds the collision that escapes the numbering, at FB-AI-12', () => {
    const twelve = ownersOf('FB-AI-12')
    expect(twelve.map((o) => o.chapter).sort()).toEqual(['40.12', '44A.12'])
    // The trace-store owner of FB-AI-01 and the chapter-40 definition of
    // FB-AI-12 are about the same object under two different literals.
    const traceStore = ownerAt('30D.8', 'FB-AI-01')!
    expect(traceStore.contract).toContain('trace store')
    expect(ownerAt('40.12', 'FB-AI-12')!.contract).toContain('Trace and decision-record')
  })

  /**
   * FAILS IF: any registered owner's locator stops carrying the identifier and
   * the contract text it claims. This is the check that keeps the registry a
   * transcription rather than a paraphrase.
   */
  it('verifies every owner against the line it cites', () => {
    expect(FALLBACK_CONTRACT_OWNERS.length).toBeGreaterThan(0)
    for (const o of FALLBACK_CONTRACT_OWNERS) {
      expect(lineOf(o.locator), `${o.locator} is not blank`).not.toBe('')
      expect(lineOf(o.locator), `${o.locator} names ${o.identifier}`).toContain(o.identifier)
      expect(lineOf(o.contractLocator), `${o.contractLocator} carries its contract`).toContain(
        o.contract,
      )
      expect(o.chapter.length, `${o.locator} chapter`).toBeGreaterThan(0)
    }
    for (const r of FALLBACK_IDENTIFIER_RANGES) {
      expect(lineOf(r.locator), `${r.locator} names ${r.first}`).toContain(r.first)
      expect(lineOf(r.locator), `${r.locator} names ${r.last}`).toContain(r.last)
    }
  })
})
