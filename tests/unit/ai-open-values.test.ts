import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  AI_OPEN_REGISTER_IDS,
  UNSET_GOVERNING_VALUES,
  enablementRefusal,
  governingValue,
} from '@/ai/failures/open-values'
import { FAILURE_CATALOGUE } from '@/ai/failures/catalogue'
import { RESPONSE_SPINE } from '@/ai/failures/spine'
import { decisionRecord } from '@/disclosure/decisions'

/**
 * Slice 11, wave 0, task 4 — the values section 43.1.2 names as controls and
 * fixes for none of them.
 *
 * `AC-43-111` (L90038): no artificial-intelligence capability can be enabled
 * while any governing value in the open register is unset. `AC-43-112`
 * (L90039): no value in the open register has a code-level default that would
 * apply silently. `TEST-43-112` (L90045) is the default-scan.
 *
 * THE DEFECT THIS FILE EXISTS TO CATCH is not a missing value. It is a
 * PRESENT one — a retry count seeded "as a sensible starting position", which
 * looks contractual, gets quoted back, and is indistinguishable from a client
 * decision a year later. The source says so itself at L90008: every one of
 * these "would, if written as a number in this blueprint, be quoted in a
 * functional specification, then in a test plan, then in a service-level
 * conversation."
 *
 * AND IT IS SCANNED IN TWO SPELLINGS. An hour before this file was written,
 * the equivalent gate on the decision canon was proved to catch `3 retries`
 * and MISS `three retries with a five-second backoff`. Spelled-out is this
 * source's own idiom for exactly these values — "about thirty minutes", "a
 * seven-day window" — so a seeded default is likelier to arrive spelled than
 * in digits. Both forms are scanned, and both were planted before this file
 * was trusted.
 */

const SOURCE_PATH =
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const LINES: readonly string[] = ['', ...SOURCE_BYTES.toString('utf8').replace(/\n$/, '').split('\n')]
const L = (n: number): string => LINES[n] ?? ''

const REGISTER_HEADER = 89_995
const REGISTER_FIRST = 89_997
const REGISTER_LAST = 90_006

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122_241)
})

describe('the open register, section 43.1.2', () => {
  it('spans exactly the register’s rows, with its header and separator above', () => {
    expect(L(REGISTER_HEADER)).toMatch(/^\| ID \| Value owed \|/)
    expect(L(REGISTER_HEADER + 1), 'the separator is not a row').toMatch(/^\|[\s|:-]+\|$/)
    for (let n = REGISTER_FIRST; n <= REGISTER_LAST; n += 1) {
      expect(L(n), `L${String(n)} is not a register row`).toMatch(/^\| `DEC-AI[A-Z]+-\d+` \|/)
    }
    expect(L(REGISTER_LAST + 1), 'the line below the register is a row').not.toMatch(/^\| `DEC-/)
  })

  /**
   * MEMBERSHIP AND ORDER, read out of the register's own first column at run
   * time. The expectation is not written in this file, so the module cannot
   * pass by agreeing with a list its own test also wrote.
   */
  it('registers the register’s rows, in the register’s order, at their own lines', () => {
    const fromSource: { id: string; valueOwed: string; locator: string }[] = []
    for (let n = REGISTER_FIRST; n <= REGISTER_LAST; n += 1) {
      const cells = L(n).replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim())
      fromSource.push({
        id: cells[0]!.replace(/`/g, ''),
        valueOwed: cells[1]!,
        locator: `L${String(n)}`,
      })
    }
    expect([...AI_OPEN_REGISTER_IDS]).toEqual(fromSource.map((r) => r.id))
    expect(UNSET_GOVERNING_VALUES.map((v) => ({ id: v.id, valueOwed: v.valueOwed, locator: v.locator }))).toEqual(
      fromSource,
    )
  })

  /**
   * FAILS IF: a governing value stops consuming the canon and starts
   * restating it. Task 6 registered these ten records; this module holds no
   * second copy of the question, the readings or the adopted position, and the
   * assertion is identity against `decisionRecord`, not similarity.
   */
  it('consumes the decision canon’s records rather than restating them', () => {
    for (const id of AI_OPEN_REGISTER_IDS) {
      expect(governingValue(id).decision).toBe(decisionRecord(id))
      expect(governingValue(id).decision.decisionRef, id).toBe(id)
    }
  })

  /**
   * `SB-43-102` (L90030) is the storyboard that fixes the state's words:
   * "render each unset value with an explicit "Not yet set — client decision
   * `DEC-*`" state rather than a silent default". The `DEC-*` is a wildcard in
   * the source and is resolved to the value's own identifier here, which is
   * also what `AC-43-113` asks for — the decision identifier on screen.
   */
  it('renders the state the storyboard fixes, with the identifier in it', () => {
    expect(L(90_030)).toContain('Not yet set — client decision')
    expect(L(90_030)).toContain('SB-43-102')
    for (const value of UNSET_GOVERNING_VALUES) {
      expect(value.state).toBe(`Not yet set — client decision ${value.id}`)
      expect(value.decision.adopted, value.id).toContain(value.state)
    }
  })
})

/* ── AC-43-111 — the refusal ────────────────────────────────────────────── */

describe('AC-43-111, no capability enables over an unset value', () => {
  /**
   * FAILS IF: the refusal stops naming what is unset, or stops being a
   * refusal. Every one of the register's values is unset in this build, so
   * anything governed by any of them is refused — and the refusal names each
   * identifier, because a refusal a client cannot trace to a decision is a
   * dead end rather than a disclosure.
   *
   * Planted: `enablementRefusal` returning `null` for a governed capability.
   * RED on the first identifier.
   */
  it('refuses every capability any register value governs, naming each one', () => {
    for (const id of AI_OPEN_REGISTER_IDS) {
      const refusal = enablementRefusal('the Prevention Agent', [id])
      expect(refusal, id).not.toBeNull()
      expect(refusal!.unset, id).toEqual([id])
      expect(refusal!.refusal, id).toContain(id)
      expect(refusal!.refusal, id).toContain('the Prevention Agent')
    }
    const all = enablementRefusal('every agent capability', AI_OPEN_REGISTER_IDS)
    expect(all!.unset).toEqual([...AI_OPEN_REGISTER_IDS])
    for (const id of AI_OPEN_REGISTER_IDS) expect(all!.refusal).toContain(id)
  })

  /**
   * FAILS IF: the refusal becomes unconditional. A function that refused
   * everything would satisfy the assertion above and would say nothing about
   * governance — the vacuous shape this build has shipped before. Nothing
   * governs a capability with an empty governing set, and that is not a
   * refusal.
   */
  it('does not refuse what the register does not govern', () => {
    expect(enablementRefusal('a deterministic check', [])).toBeNull()
  })
})

/* ── AC-43-112 / TEST-43-112 — the default-scan ─────────────────────────── */

/**
 * THE DEFAULT-SCAN, IN TWO PASSES OVER THIS TASK'S OWN CODE.
 *
 * PASS ONE is strict and reads `open-values.ts` whole. That is the module a
 * governing value would live in, so a digit surviving there — after the
 * identifiers, the frozen-source locators and the section references are
 * removed — is a seeded value or something indistinguishable from one.
 *
 * PASS TWO is the spelled form, over the WHOLE module directory. It removes
 * every string the transcription gate has already proved verbatim against the
 * frozen source, then scans what is left: this task's own prose. The removal
 * is what makes the pass possible at all — the source's own catalogue cells
 * say "ten minutes" and "thirty days", and a scan that reddened on a
 * transcription would force the transcription to be paraphrased.
 *
 * THE CEILING, STATED RATHER THAN HIDDEN. Pass one does not reach
 * `catalogue.ts` or `spine.ts`, whose digits are locators and transcribed
 * section references. What covers those is stronger than a scan: every cell
 * and every spine default is asserted EQUAL to its source line in
 * `tests/unit/ai-failures.test.ts`, so a value seeded into one of them fails
 * that equality. And a value with no unit beside it — "Starting position:
 * three." — escapes the spelled form in both passes, exactly as it does on the
 * decision canon.
 */
describe('AC-43-112 — nothing here holds a code-level default', () => {
  const MODULE_DIR = new URL('../../src/ai/failures/', import.meta.url).pathname
  const read = (file: string): string => readFileSync(join(MODULE_DIR, file), 'utf8')

  const NUMBER_WORD =
    'zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|' +
    'fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|' +
    'eighty|ninety|hundred|thousand'
  const UNIT_WORD =
    'millisecond|milliseconds|second|seconds|minute|minutes|hour|hours|day|days|week|weeks|' +
    'month|months|retry|retries|attempt|attempts|step|steps|probe|probes|call|calls|' +
    'request|requests|failure|failures|token|tokens|percent|times|item|items|entry|entries'
  const SPELLED = new RegExp(`\\b(${NUMBER_WORD})[-\\s](${UNIT_WORD})\\b`, 'i')

  /** Identifiers, frozen-source locators and section references are not values. */
  const stripCitations = (text: string): string =>
    text
      .replace(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g, ' ')
      .replace(/\bL\d{3,6}\b/g, ' ')
      .replace(/§[\d.]+/g, ' ')

  it('proves the matchers on the shapes they are written for', () => {
    expect('three retries with a five-second backoff').toMatch(SPELLED)
    expect('about thirty minutes').toMatch(SPELLED)
    expect('a seven-day window').toMatch(SPELLED)
    expect('the recommendation is labelled one').not.toMatch(SPELLED)
    expect(stripCitations('DEC-AIRETRY-001 at L89997, §8.7.1')).not.toMatch(/\d/)
    expect(stripCitations('a retry limit of 3')).toMatch(/\d/)
  })

  /**
   * Planted: `retryLimit: 3` added to `open-values.ts`. RED on the digit.
   * Planted: the comment "three retries with a five-second backoff" added to
   * the same file. RED on the spelled form. Both restored.
   */
  it('holds no value, in digits or in words, in the module that would carry one', () => {
    const text = read('open-values.ts')
    expect(text.length).toBeGreaterThan(0)
    expect(stripCitations(text), 'open-values.ts carries a digit').not.toMatch(/\d/)
    expect(text, 'open-values.ts spells out a value').not.toMatch(SPELLED)
  })

  /**
   * Planted: the same spelled phrase added to `catalogue.ts`, outside any
   * transcribed cell. RED. Restored.
   */
  it('spells out no value anywhere in the module directory, outside a transcription', () => {
    const verbatim = [
      ...RESPONSE_SPINE.map((i) => i.spineDefault),
      ...FAILURE_CATALOGUE.flatMap((r) => Object.values(r.cells)),
    ]
    const files = readdirSync(MODULE_DIR).filter((f) => f.endsWith('.ts'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      let text = read(file)
      for (const quoted of verbatim) {
        // Both spellings: the cell as the source writes it, and the cell as
        // the module stores it, where quotation marks arrive escaped. Removing
        // only the first left every message cell in the scan and the pass
        // reddened on the source's own words.
        for (const form of [quoted, JSON.stringify(quoted).slice(1, -1)]) {
          text = text.split(form).join(' ')
        }
      }
      expect(text, `${file} spells out a value outside a transcribed cell`).not.toMatch(SPELLED)
    }
  })
})
