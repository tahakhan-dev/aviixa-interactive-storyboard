import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  OPEN_DECISIONS,
  OPEN_DECISION_IDS,
  decisionRecord,
  type DecisionId,
} from '@/disclosure/decisions'

/**
 * Slice 11, wave 0, task 6 — the artificial-intelligence decision canon.
 *
 * WHAT THIS FILE IS FOR. Not "the records exist". Four shapes, each of which
 * has a specific way of going wrong quietly:
 *
 *   - TEN GOVERNING VALUES WITH NO VALUE. The source names retry limits,
 *     timeouts, circuit-breaker thresholds, queue ceilings, confidence floors
 *     and token ceilings, and sets not one of them. The failure mode is not
 *     omission; it is a seeded number, which looks contractual and gets quoted
 *     back. So the gate below reads the `adopted` text of all ten and fails on
 *     ANY digit that is not part of the decision identifier.
 *   - TWO QUESTIONS ASKED UNDER TWO IDENTIFIERS EACH, with — measured — zero
 *     lines carrying both. Dropping either spelling makes the card unfindable
 *     by a client searching on the one that was dropped.
 *   - THREE REPLAY IDENTIFIERS THAT ARE NOT ALIASES. Overlapping questions,
 *     no cross-reference between any pair in the whole source. Merging them
 *     would answer three questions with one answer, and each of the three has
 *     a different owner and a different recommendation.
 *   - ONE DECISION WHERE THE SOURCE CONTRADICTS ITSELF AND THE PROVENANCE IS
 *     NOT EVEN. `DEC-AIDISCLOSE-001`. Two `Derived Clarification` rulings
 *     contradict each other, and one of the two is corroborated by two
 *     `SoW Fact` matrix rows the other has no answer to. Both sides render;
 *     neither is adopted; the asymmetry is stated rather than smoothed. This
 *     entry used to read "at equal provenance", and the gate below used to
 *     read only the two lines that made that true.
 *
 * Every measurement is taken from the frozen source at run time.
 */

const SOURCE_PATH =
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const SOURCE_TEXT = SOURCE_BYTES.toString('utf8')
const LINES: readonly string[] = ['', ...SOURCE_TEXT.replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''

const linesCarrying = (token: string): readonly number[] =>
  LINES.reduce<number[]>((acc, text, index) => {
    if (index > 0 && text.includes(token)) acc.push(index)
    return acc
  }, [])

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

/* ── this task's own registrations, declared and not derived ───────────── */

/**
 * Declared as a literal, never filtered off `OPEN_DECISIONS`: a population
 * derived from the array it polices shrinks with it and the gate keeps
 * passing. The canon's WHOLE membership is asserted in
 * `tests/unit/surface-neutral.test.ts`; this list is only what this task
 * added, so that a later slice removing one goes red HERE with a name on it.
 */
const AI_DECISION_IDS: readonly DecisionId[] = [
  'DEC-AIHELP-001',
  'DEC-ONDEVICE-001',
  'DEC-REPLAY-001',
  'DEC-COACHREPLAY-001',
  'DEC-AIDISCLOSE-001',
  'DEC-AIRETRY-001',
  'DEC-AITIMEOUT-001',
  'DEC-AICB-001',
  'DEC-AIFAILOVER-001',
  'DEC-AIQUEUE-001',
  'DEC-AISTALE-001',
  'DEC-AICONF-001',
  'DEC-AIQUAR-001',
  'DEC-AIREPLAY-001',
  'DEC-AITOKEN-001',
]

/** The ten of those that come from the open register, in the register's order. */
const OPEN_REGISTER_IDS: readonly DecisionId[] = [
  'DEC-AIRETRY-001',
  'DEC-AITIMEOUT-001',
  'DEC-AICB-001',
  'DEC-AIFAILOVER-001',
  'DEC-AIQUEUE-001',
  'DEC-AISTALE-001',
  'DEC-AICONF-001',
  'DEC-AIQUAR-001',
  'DEC-AIREPLAY-001',
  'DEC-AITOKEN-001',
]

describe('the canon carries this task’s records, under the source’s own identifiers', () => {
  /**
   * FAILS IF: one of these records is lost, or is keyed on anything but the
   * source's own identifier. Both spellings of the canon are checked, so a
   * record present in one and absent from the other is red.
   *
   * Planted: `DEC-AICB-001` deleted from `OPEN_DECISIONS`, `OPEN_DECISION_IDS`
   * and the union together — the only deletion that typechecks. RED here.
   */
  it('holds every record this task registered', () => {
    const ids = new Set<string>(OPEN_DECISIONS.map((d) => d.id))
    const declared = new Set<string>(OPEN_DECISION_IDS)
    for (const id of AI_DECISION_IDS) {
      expect(ids.has(id), `the record list lost ${id}`).toBe(true)
      expect(declared.has(id), `the declared id list lost ${id}`).toBe(true)
      expect(decisionRecord(id).decisionRef, `${id} ref`).toBe(id)
    }
  })

  /**
   * FAILS IF: a reading cites a line that does not carry the thing it names.
   * Every locator in these records is written `ANCHOR · Lnnn`, and the anchor
   * is checked against the line — which is the difference between a citation
   * a reader can open and a number that merely exists.
   *
   * WHAT IT DOES NOT CATCH, stated because a plant proved it. Moving
   * `DEC-ASK-001 · L92732` to `L92730` is GREEN here, because that line also
   * names the decision — it is the narrative paragraph rather than the card.
   * This gate checks that a citation can be opened and will show the thing it
   * names; it does not check that it is the BEST line for it, and a comment
   * claiming otherwise would be the false evidence the whole locator
   * discipline exists to prevent.
   *
   * Planted: `DEC-ASK-001 · L92732` changed to `L92731` [cited-in-error:
   * L92731], one line off and a line the identifier is absent from. RED,
   * naming the anchor and the line — which is the off-by-one class this
   * catches. The marker is there because the plant's whole point is that the
   * line carries nothing, and `locator-fidelity` is right to say so.
   */
  it('anchors every locator to a line that carries what the locator names', () => {
    for (const id of AI_DECISION_IDS) {
      const record = decisionRecord(id)
      expect(record.readings.length, `${id} readings`).toBeGreaterThan(1)
      for (const reading of record.readings) {
        const parts = reading.locator.split(' · ').map((p) => p.trim())
        const numbered = parts.filter((p) => /^L\d{3,6}$/.test(p))
        expect(numbered.length, `${id} locator ${reading.locator} names no line`).toBeGreaterThan(0)
        let anchor: string | null = null
        for (const part of parts) {
          if (/^L\d{3,6}$/.test(part)) {
            expect(anchor, `${id} locator ${reading.locator} has an unanchored line`).not.toBeNull()
            expect(L(Number(part.slice(1))), `${id} ${anchor} at ${part}`).toContain(anchor!)
          } else {
            anchor = part
          }
        }
      }
    }
  })
})

/* ── the ten-value open register ───────────────────────────────────────── */

/**
 * Located by search, and asserted UNIQUE before `[0]` is taken. A `[0]` on a
 * multi-hit search silently picks the first table that happens to share a
 * header shape, and every row index below is derived from this one number.
 * `ai-roster.test.ts` asserts uniqueness on its own header; these did not.
 */
const REGISTER_HEADER = (() => {
  const found = linesCarrying(
    '| ID | Value owed | Why it matters | Options | Recommendation | Trade-off | Decision owner |',
  )
  expect(found, 'the open register’s header occurs exactly once').toHaveLength(1)
  return found[0]!
})()

const REGISTER_ROWS = (() => {
  const rows: number[] = []
  for (let n = REGISTER_HEADER + 1; L(n).startsWith('|'); n += 1) {
    if (/^\|[\s|:-]+\|$/.test(L(n))) continue
    rows.push(n)
  }
  return rows
})()

describe('the ten-value open register, counted and never given a default', () => {
  /**
   * FAILS IF: the register gains or loses a row, or the canon registers them
   * in an order the source does not use. The expectation comes out of the
   * source's own first column at run time, so the canon cannot pass by
   * agreeing with a list this file also wrote.
   */
  it('registers the register’s rows, in the register’s order', () => {
    const fromSource = REGISTER_ROWS.map((n) => L(n).split('|')[1]!.trim().replace(/`/g, ''))
    expect(OPEN_REGISTER_IDS).toEqual(fromSource)
    expect(L(REGISTER_HEADER + 1), 'the separator is not a row').toMatch(/^\|[\s|:-]+\|$/)
  })

  /**
   * THE GATE THIS SECTION EXISTS FOR. No governing value from the open
   * register may get a code-level default, and the refusal is the feature.
   *
   * FAILS IF: any digit appears in an adopted position other than inside the
   * decision identifier itself. A seeded retry count, a timeout in seconds, a
   * queue ceiling or a confidence floor is caught by the same rule, and so is
   * a number nobody thought of — which is the point of checking the shape
   * rather than a list of forbidden values.
   *
   * Planted: `adopted` on `DEC-AIRETRY-001` given a starting position of three
   * retries. RED, naming the record and the digit.
   */
  it('seeds no value anywhere in the ten adopted positions', () => {
    for (const id of OPEN_REGISTER_IDS) {
      const record = decisionRecord(id)
      const withoutIdentifiers = record.adopted.split(id).join(' ')
      expect(withoutIdentifiers, `${id} adopted seeds a value`).not.toMatch(/\d/)
      expect(record.adopted, `${id} adopted names its identifier`).toContain(id)
    }
  })

  /**
   * THE SAME GATE, FOR THE SHAPE THE SOURCE ACTUALLY WRITES NUMBERS IN.
   *
   * The digit rule above catches `3 retries`. It does not catch `three
   * retries`, and a seeded default is likelier to arrive spelled out, because
   * spelled-out is this source's own idiom for exactly these values — "a
   * seven-day window", "about thirty minutes". Measured escape, before this
   * test existed: `adopted` on `DEC-AIRETRY-001` set to "Starting position
   * adopted by this build: three retries with a five-second backoff. Not yet
   * set — client decision DEC-AIRETRY-001 …" passed GREEN.
   *
   * AND IT READS `question` TOO. The digit rule reads only `adopted`, so a
   * value seeded into the question a card renders above the refusal was
   * unguarded on both spellings.
   *
   * WHAT IT MATCHES, and why it is narrower than "any number word": a spelled
   * number ATTACHED TO A UNIT, hyphenated or spaced. A bare number word is not
   * enough — these records legitimately say "labelled one" and "the two
   * readings", and a rule that reddened on those would be turned off within a
   * slice. THE CEILING, stated rather than hidden: a value seeded with no unit
   * beside it ("Starting position: three.") escapes both rules. The unit list
   * is the one this register's own ten questions use, and it grows when the
   * register does.
   *
   * NOT WIDENED TO `readings[].text` ON PURPOSE. Those transcribe the source's
   * own options and trade-offs, which legitimately carry the source's numbers;
   * reddening on them would force the readings to be paraphrased, and a
   * paraphrased reading is the thing this whole canon exists to avoid.
   *
   * Planted: the word-form default above, on `adopted`. RED, naming the record
   * and the phrase. Planted again on `question`. RED. Restored.
   */
  it('seeds no spelled-out value either, in the adopted position or the question', () => {
    const NUMBER_WORD =
      'zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|' +
      'fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|' +
      'eighty|ninety|hundred|thousand'
    const UNIT_WORD =
      'millisecond|milliseconds|second|seconds|minute|minutes|hour|hours|day|days|week|weeks|' +
      'month|months|retry|retries|attempt|attempts|step|steps|probe|probes|call|calls|' +
      'request|requests|failure|failures|token|tokens|percent|times|item|items|entry|entries'
    const SEEDED = new RegExp(`\\b(${NUMBER_WORD})[-\\s](${UNIT_WORD})\\b`, 'i')

    // The rule is proved on the shape it is written for before it is trusted
    // on the records — a matcher nobody checked is a matcher that matches
    // nothing.
    expect('three retries with a five-second backoff').toMatch(SEEDED)
    expect('a seven-day window').toMatch(SEEDED)
    expect('about thirty minutes').toMatch(SEEDED)
    expect('the recommendation above is labelled one').not.toMatch(SEEDED)

    for (const id of OPEN_REGISTER_IDS) {
      const record = decisionRecord(id)
      expect(record.adopted, `${id} adopted seeds a spelled-out value`).not.toMatch(SEEDED)
      expect(record.question, `${id} question seeds a spelled-out value`).not.toMatch(SEEDED)
      expect(record.question, `${id} question carries a digit`).not.toMatch(/\d/)
    }
  })

  /**
   * FAILS IF: a recommendation is presented as the answer. The source labels
   * every one of these a recommendation, and this build must too — so the
   * reading carrying it says so in its own text rather than relying on the
   * renderer's framing.
   */
  it('carries the source’s recommendation as a recommendation, on the record', () => {
    for (const id of OPEN_REGISTER_IDS) {
      const record = decisionRecord(id)
      const texts = record.readings.map((r) => r.text).join(' ')
      expect(texts, `${id} recommendation`).toContain('recommendation')
      expect(texts, `${id} options`).toContain('Options')
    }
  })
})

/* ── the two dual-identity pairs ───────────────────────────────────────── */

const PAIRS: readonly (readonly [DecisionId, string])[] = [
  ['DEC-AIHELP-001', 'DEC-ASK-001'],
  ['DEC-ONDEVICE-001', 'DEC-LOCALAI-001'],
]

describe('one question, two identifiers, and no line in the source carries both', () => {
  /**
   * FAILS IF: the two identifiers turn out to be cross-referenced after all,
   * in which case they are restatements and the alias treatment is wrong; or
   * if either identifier occurs nowhere, in which case one of them is
   * invented. Both directions, measured.
   */
  it('measures the absence of any cross-reference, in both directions', () => {
    for (const [canonical, alias] of PAIRS) {
      const canonicalLines = linesCarrying(canonical)
      const aliasLines = linesCarrying(alias)
      expect(canonicalLines.length, `${canonical} occurs`).toBeGreaterThan(0)
      expect(aliasLines.length, `${alias} occurs`).toBeGreaterThan(0)
      const both = canonicalLines.filter((n) => L(n).includes(alias))
      expect(both, `${canonical} and ${alias} share a line`).toEqual([])
    }
  })

  /**
   * FAILS IF: the alias is dropped, or the pair is folded into one identifier.
   * The record renders both spellings, and the `adopted` position says the two
   * recommended options DIFFER — which is the fact that makes them two
   * questions rather than one asked twice.
   *
   * Planted: `alias` nulled on `DEC-ONDEVICE-001`. RED here and in
   * `surface-neutral.test.ts`, which asserts the alias-bearing set exactly.
   */
  it('registers each pair as one record with the other spelling kept', () => {
    for (const [canonical, alias] of PAIRS) {
      const record = decisionRecord(canonical)
      expect(record.alias, `${canonical} alias`).toBe(alias)
      const cited = record.readings.map((r) => r.locator).join(' ')
      expect(cited, `${canonical} cites its own card`).toContain(canonical)
      expect(cited, `${canonical} cites the alias card`).toContain(alias)
      expect(OPEN_DECISIONS.map((d) => d.id), `${alias} has no second record`).not.toContain(alias)
    }
  })

  /**
   * FAILS IF: the third reading of the help question is dropped. `SB-42-501`
   * storyboards four picked reasons AND a free-text field, which is neither
   * identifier's recommended option — so a build that renders only the two
   * cards renders a settled question where the source has three answers.
   */
  it('keeps the storyboard reading that matches neither recommended option', () => {
    const record = decisionRecord('DEC-AIHELP-001')
    const storyboard = record.readings.find((r) => r.locator.includes('SB-42-501'))
    expect(storyboard, 'the SB-42-501 reading').toBeDefined()
    const line = Number(storyboard!.locator.split(' · ').pop()!.slice(1))
    expect(L(line)).toContain('four picked reasons and a free-text field')
  })
})

/* ── the three replay identifiers, which are not aliases ───────────────── */

const REPLAY: readonly DecisionId[] = [
  'DEC-REPLAY-001',
  'DEC-COACHREPLAY-001',
  'DEC-AIREPLAY-001',
]

describe('three replay identifiers, none merged into another', () => {
  /**
   * FAILS IF: any pair of the three is cross-referenced in the source — which
   * would make them restatements — or if the build merges any two by making
   * one the other's alias. The build may not merge what the source keeps
   * apart, and the measurement is what says the source keeps them apart.
   *
   * AND THE ABSENCE CARRIES A POSITIVE CONTROL. `shared` being empty is only
   * evidence that the three are kept apart if each identifier occurs at all —
   * an identifier present on zero lines makes every intersection empty and the
   * loop pass while proving nothing. The sibling PAIRS block already asserted
   * this; the REPLAY block did not.
   *
   * Planted: `DEC-COACHREPLAY-001` registered as `DEC-REPLAY-001`'s alias and
   * its own record removed. RED on the alias check and on the record check.
   * Planted: `DEC-AIREPLAY-001` mis-spelled to a literal the source does not
   * carry. RED on the occurrence control — GREEN before it existed.
   */
  it('finds no line carrying any two of the three, and merges none of them', () => {
    for (const a of REPLAY) {
      expect(linesCarrying(a).length, `${a} occurs nowhere in the source`).toBeGreaterThan(0)
    }
    for (const a of REPLAY) {
      for (const b of REPLAY) {
        if (a === b) continue
        const shared = linesCarrying(a).filter((n) => L(n).includes(b))
        expect(shared, `${a} and ${b} share a line`).toEqual([])
      }
    }
    for (const id of REPLAY) {
      const record = decisionRecord(id)
      expect(record.decisionRef, `${id} is its own record`).toBe(id)
      for (const other of REPLAY) {
        if (other === id) continue
        expect(record.alias, `${id} swallowed ${other}`).not.toBe(other)
      }
    }
  })
})

/* ── the contradiction neither side wins ───────────────────────────────── */

describe('DEC-AIDISCLOSE-001 renders both sides and adopts neither', () => {
  /**
   * FAILS IF: the record stops carrying one of the two rulings. They are two
   * different sentences about what the worker's surface shows during a
   * platform pause, and the build has no authority to pick one — so the
   * assertion is that BOTH locators are on the record and that each line
   * carries the ruling attributed to it.
   *
   * Planted: the L87854 reading deleted. RED, naming the missing side.
   */
  it('carries both rulings, each checked against its own line', () => {
    const record = decisionRecord('DEC-AIDISCLOSE-001')
    const locators = record.readings.map((r) => r.locator).join(' ')
    expect(locators, 'the shows-nothing ruling').toContain('L87854')
    expect(locators, 'the mode-chip ruling').toContain('L89289')
    expect(L(87_854)).toContain('shows nothing at all about the pause')
    expect(L(89_289)).toContain('Live coaching paused by the platform')
  })

  /**
   * FAILS IF: the build adopts a side. `adopted` must say that neither is
   * adopted; a position that quietly picks one is the defect on the surface
   * where a person acts on it.
   */
  it('states that neither reading is adopted', () => {
    const record = decisionRecord('DEC-AIDISCLOSE-001')
    expect(record.adopted).toContain('Neither reading is adopted')
  })

  /**
   * FAILS IF: the provenance claim on the record stops matching the source.
   *
   * AND IT USED TO SAMPLE ONLY THE LINES THAT AGREED WITH IT. This test read
   * L87854 and L89348 — the two `Derived Clarification` storyboard rulings —
   * and stopped, while the record's `adopted` said the two sides "carry the
   * same provenance marking, so neither outranks the other". Two of the four
   * pinned lines were never read: L89368 and L89369, the matrix rows, both
   * marked `SoW Fact — §8.7.5`, and both corroborating the mode-chip side
   * alone. A helper scoped to exclude the lines that contradict the claim it
   * covers is the tenth defect shape this build has named, and it was in the
   * gate for the record whose whole subject is provenance.
   *
   * So all four are read, each against the marking the source actually gives
   * it, and the record's `adopted` is required to state the asymmetry rather
   * than deny it — while still adopting neither side, which stays correct.
   *
   * Planted: `adopted` restored to the "same provenance marking" wording. RED
   * on the asymmetry assertion. Planted: the L89369 expectation changed to
   * `Derived Clarification`. RED, naming the line.
   */
  it('measures all four pinned lines, including the two that break the symmetry', () => {
    // The two storyboard rulings: equal rank, and they contradict each other.
    expect(L(87_854), 'the shows-nothing ruling').toContain('`Derived Clarification`')
    expect(L(89_348), 'the five-surface storyboard').toContain('`Derived Clarification`')
    // The two matrix rows: a HEAVIER marking, and both on the mode-chip side.
    for (const n of [89_368, 89_369]) {
      expect(L(n), `L${n} marking`).toContain('`SoW Fact — §8.7.5`')
      expect(L(n), `L${n} is not a Derived Clarification`).not.toContain('`Derived Clarification`')
      expect(L(n), `L${n} carries the mode-chip wording`).toContain(
        'Live coaching paused by the platform',
      )
    }

    // And the record says so. A record claiming symmetry while its own
    // readings record the asymmetry is the contradiction this catches.
    const record = decisionRecord('DEC-AIDISCLOSE-001')
    expect(record.adopted, 'the record still claims symmetric provenance').not.toMatch(
      /same provenance marking/,
    )
    expect(record.adopted, 'the record names the asymmetry').toMatch(/NOT symmetric/)
    for (const n of [87_854, 89_348, 89_368, 89_369]) {
      expect(record.adopted, `L${n} is pinned in the adopted position`).toContain(`L${n}`)
    }
  })
})
