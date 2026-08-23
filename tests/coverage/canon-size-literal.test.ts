import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { OPEN_DECISIONS } from '@/disclosure/decisions'

/**
 * THE CANON-SIZE LITERAL, FORBIDDEN IN `src/` AND `app/`.
 *
 * WHAT WENT WRONG THREE TIMES. `src/disclosure/decisions.ts` exports
 * `OPEN_DECISIONS` and a `DecisionId` union over it. Twelve rendered strings
 * and eighteen comment lines across twenty-six files had each stored a COPY
 * of that array's length as prose — "the canon holds twenty-nine records",
 * "its DecisionId union has twenty-nine members". Slice 10 raised the canon
 * to forty-three, and every one of those sentences became a false claim in
 * the same instant. Three tasks were spent on it: 2b diagnosed it and fixed
 * one site, 2c fixed the other eleven RENDERED strings, 2d cleared the
 * eighteen comments and planted this.
 *
 * WHY A GATE AND NOT A RENUMBERING. A stored copy of a derived answer goes
 * stale on the next slice, silently, and the four suites stayed green through
 * the whole of it because three tests PINNED the stale phrase. The count was
 * never the claim a reader could act on — the ABSENCE is. So the replacement
 * wording everywhere says the identifier is not a member of the canon's
 * exported union, and this gate makes the count unwritable again.
 *
 * ── THE PREDICATE ─────────────────────────────────────────────────────────
 *
 * A file under `src/` or `app/` may not contain a SENTENCE that both
 *
 *   (a) refers to the canon — `disclosure/decisions`, `decisions.ts`,
 *       `OPEN_DECISIONS`, a bare `DecisionId`, or the word `canon`; and
 *   (b) quantifies `records` or `members` with a written-out number
 *       (`two` … `ninety-nine`) or a numeral (`2`…`999`).
 *
 * Comment text and string text are treated alike, because the defect shipped
 * in both and neither is more true than the other. Comment markers are
 * stripped so a claim wrapped across four ` * ` lines is still one sentence.
 *
 * IT IS NOT A GREP FOR "twenty-nine", AND THAT IS THE WHOLE POINT. A gate
 * that knew only the old number could not fail for the defect it is named
 * after: the next stale count reads "forty-three". `spellOut()` derives the
 * CURRENT size from `OPEN_DECISIONS.length` and the first case below asserts
 * that both the spelled and the numeric form of it are convicted — so this
 * gate is red for a sentence stating the canon's size correctly, today, and
 * stays red for whatever the size becomes.
 *
 * ── WHAT IT DELIBERATELY DOES NOT CATCH ───────────────────────────────────
 *
 * The rule from RESUME §8: a gate that forbids a MECHANISM rather than a
 * MISUSE of it will eventually forbid the fix. Five slice-9 tasks wrote a
 * gate banning `'use client'` and all five were wrong. So the misuse named
 * here is narrow — a STORED LITERAL standing in for a derived count — and
 * these five things are outside it on purpose:
 *
 *   1. A NUMBER INSIDE A QUOTATION. `"…"` and `“…”` spans are removed before
 *      matching. That is how a deliberate historical record spells the
 *      sentence it replaced: `src/surfaces/cc/live/model.ts` quotes
 *      `"its DecisionId union has twenty-nine members"` in the course of
 *      explaining why it is gone. Convicting that would delete the record of
 *      the defect to satisfy the gate against it. Case 4 proves the exemption
 *      is load-bearing rather than accidental: the same sentence with its
 *      quotes removed IS convicted.
 *
 *   2. AN INTERPOLATED COUNT. `${OPEN_DECISIONS.length} records` is not a
 *      stored copy and cannot go stale, so it is not the defect — a numeral
 *      is required, and `.length` is not one. Forbidding the sentence rather
 *      than the literal would forbid the honest way to state a size.
 *
 *   3. `one` AND `1`. "It is NOT one of the records `@/disclosure/decisions`
 *      carries" (`src/studio/seams/parts/registry.ts`) is a pronoun, not a
 *      count. Measured: including `one` produced exactly that false positive
 *      and no true one.
 *
 *   4. NOUNS OTHER THAN `records` AND `members`, and singular forms of those.
 *      Measured over the tree: adding `decisions` convicted six true counts
 *      of a MODULE'S OWN decisions ("The three open decisions, in the shared
 *      canon's own shape"; "Wave 1 recorded thirteen Frontline decisions
 *      absent from `@/disclosure/decisions`"), and the singular convicted
 *      `cc-03`'s true "`CcDecisionId` as an eighteen-member union" — a real
 *      count of the Command Center's own register, one sentence away from a
 *      canon reference. Two counts of something else entirely survive for the
 *      same reason: `fl-b10`'s "thirteen Frontline identifiers have been
 *      confirmed absent" and `group-e-g/catalogue.ts`'s "twenty-nine of the
 *      thirty" use-case entries.
 *
 *   5. `tests/**`. Nine places under `tests/` narrate this defect with its
 *      numbers, which is the record of it. A gate that scanned them would
 *      convict the account of the thing it exists to prevent.
 *
 * KNOWN CEILING. Exemption 4 is a noun list, so a canon-size claim phrased
 * with a noun outside it ("the canon has forty-three entries") walks past.
 * The two nouns are the two the defect actually used, twenty-six times, and
 * widening the list re-convicts the true counts above. Widen it only with a
 * measurement, not a guess.
 *
 * ponytail: sentence-scoped proximity, not a parser. A canon reference and a
 * size claim in ADJACENT sentences is not caught. Reach for a real parse only
 * if that shape ever ships.
 */

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
] as const
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] as const

const word = (table: readonly string[], i: number): string => {
  const w = table[i]
  if (w === undefined) throw new Error(`no number word at index ${i}`)
  return w
}

/** 0-99 in the hyphenated form this build's prose uses ("forty-three"). */
function spellOut(n: number): string {
  if (n < 0 || n > 99 || !Number.isInteger(n)) throw new Error(`spellOut is 0-99 only, got ${n}`)
  if (n < 20) return word(ONES, n)
  const tens = word(TENS, Math.floor(n / 10))
  return n % 10 === 0 ? tens : `${tens}-${word(ONES, n % 10)}`
}

/** `two`…`ninety-nine`, longest first so `twenty-nine` wins over `twenty`. */
const NUMBER_WORDS = Array.from({ length: 98 }, (_, i) => spellOut(i + 2)).sort((a, b) => b.length - a.length)

/** Numerals from 2 up. `0` and `1` are excluded with the word `one`. */
const NUMBER = `(?:${NUMBER_WORDS.join('|')}|[2-9]|[1-9]\\d{1,2})`

/**
 * The number, then up to two intervening words ("twenty-nine CANON records",
 * "twenty-nine OTHER records"), then the plural noun. A hyphen or word
 * character either side of the number disqualifies it, so a blueprint locator
 * token (an `L` followed by digits) and `eighteen-member` are not numbers here.
 */
const SIZE_CLAIM = new RegExp(
  `(?<![\\w-])${NUMBER}(?![\\w-])(?:[ \\t]+[A-Za-z\`'\u2019\u2011\u2012\u2013\u2014-]+){0,2}[ \\t]+(?:records|members)(?![\\w])`,
  'i',
)

/** `CcDecisionId` must not count as a `DecisionId` reference. */
const CANON_REFERENCE = /disclosure\/decisions|decisions\.ts|OPEN_DECISIONS|(?<![A-Za-z])DecisionId\b|\bcanon\b/i

/** Quotation spans, removed before matching. Exemption 1. */
const stripQuotations = (s: string): string => s.replace(/"[^"]*"|\u201c[^\u201d]*\u201d/g, ' ')

/**
 * One violation, or `null`. Exported shape is the sentence and the matched
 * span, because "this file has a canon-size literal somewhere" is not a
 * message anyone can act on.
 */
function canonSizeViolation(source: string): { sentence: string; match: string } | null {
  const prose = source
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\/\/+|\*+|\/\*+)\s?/, ''))
    .join('\n')
  for (const raw of prose.split(/(?<=[.?!:;])\s|\n\s*\n/)) {
    const sentence = raw.replace(/\s+/g, ' ').trim()
    if (!sentence || !CANON_REFERENCE.test(sentence)) continue
    const match = stripQuotations(sentence).match(SIZE_CLAIM)?.[0]
    if (match !== undefined) return { sentence, match }
  }
  return null
}

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.tsx?$/.test(full)) acc.push(full)
  }
  return acc
}

describe('no stored copy of the canon size', () => {
  const CANON_SIZE = OPEN_DECISIONS.length

  it('convicts a sentence stating the size the canon holds RIGHT NOW, spelled and numeric', () => {
    // This is what stops the gate being a grep for last slice's number. Both
    // forms are derived; neither is typed in.
    expect(CANON_SIZE).toBeGreaterThan(1)
    for (const form of [spellOut(CANON_SIZE), String(CANON_SIZE)]) {
      const found = canonSizeViolation(`/** The canon holds ${form} records. */`)
      expect(found, `a claim of the CURRENT size, "${form}", must be convicted`).not.toBeNull()
      expect(found?.match.toLowerCase()).toContain(form.toLowerCase())
    }
    // And a WRONG size, which is the form the defect actually shipped in.
    const stale = spellOut(CANON_SIZE - 14)
    expect(stale).not.toBe(spellOut(CANON_SIZE))
    expect(canonSizeViolation(`/** its DecisionId union has ${stale} members */`)).not.toBeNull()
  })

  it('acquits an interpolated count, a pronoun, a singular compound and a foreign count', () => {
    // Exemptions 2, 3 and 4, each as the exact sentence that motivated it.
    const acquitted = [
      'const note = `the canon holds ${OPEN_DECISIONS.length} records`',
      '/** It is NOT one of the records `@/disclosure/decisions` carries. */',
      "/** `src/surfaces/cc/decisions/register.ts` types `CcDecisionId` as an eighteen-member union. */",
      '/** thirteen Frontline identifiers have been confirmed absent from the shared canon. */',
      '/** no status of its own, so twenty-nine of the thirty state statuses and one defers. */',
    ]
    for (const src of acquitted) expect(canonSizeViolation(src), src).toBeNull()
  })

  it('acquits a quoted historical record and convicts the same words unquoted', () => {
    // Exemption 1, and the proof it is doing work rather than nothing. The
    // quoted form is `src/surfaces/cc/live/model.ts`'s canonNote comment as
    // it stands. No blueprint L-number is spelled here: this subject is a
    // source file, and `locator-fidelity` reads an `L<n>` as a citation of
    // the frozen blueprint, where that line is blank.
    const quoted =
      '// The membership count this sentence used to spell — "its DecisionId\n' +
      '// union has twenty-nine members" — was a stored copy of a derived answer'
    expect(canonSizeViolation(quoted)).toBeNull()
    expect(canonSizeViolation(quoted.replace(/"/g, ''))).not.toBeNull()
  })

  it('finds no canon-size literal in src/ or app/', () => {
    const files = [...walk('src'), ...walk('app')]
    // Non-vacuity: a walk that found nothing would pass this silently.
    expect(files.length).toBeGreaterThan(400)
    const offenders = files.flatMap((file) => {
      const found = canonSizeViolation(readFileSync(file, 'utf8'))
      return found ? [`${file} — «${found.match}» in: ${found.sentence.slice(0, 160)}`] : []
    })
    expect(offenders).toEqual([])
  })
})
