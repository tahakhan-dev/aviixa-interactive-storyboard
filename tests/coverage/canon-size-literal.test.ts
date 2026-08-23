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
 * The ONE place the two are not alike is exemption 1: quoting is something
 * prose does, so only comment text can hold a quotation.
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
 *   1. A NUMBER INSIDE A QUOTATION **IN A COMMENT**. `"…"` and `“…”` spans
 *      are removed before matching, but only in comment prose. That is how a
 *      deliberate historical record spells the sentence it replaced:
 *      `src/surfaces/cc/live/model.ts` quotes `"its DecisionId union has
 *      twenty-nine members"` in the course of explaining why it is gone.
 *      Convicting that would delete the record of the defect to satisfy the
 *      gate against it. Case 4 proves the exemption is load-bearing rather
 *      than accidental: the same sentence with its quotes removed IS
 *      convicted.
 *
 *      IT WAS ONCE THE WHOLE FILE, AND A JSX ATTRIBUTE PROVED THAT WRONG.
 *      As shipped, the strip ran over source text of every kind, so
 *      `aria-label="The shared decision canon holds forty-three records."`
 *      was spared while the same sentence as a rendered single-quoted string
 *      was convicted — and an accessible name is user-facing text, so a
 *      stale canon size could ship in one. `aria-label`, `title`, `alt` and
 *      `placeholder` all reach the user. QUOTATION IS SOMETHING PROSE DOES:
 *      a double-quoted span in code is content, not a quotation of anything.
 *      So the exemption was narrowed to comment prose rather than deleted —
 *      deleting it would convict the historical record, which is a gate
 *      forbidding the fix — the failure RESUME §8 names, and the same one
 *      cited above this list. Case 3 pins both halves: the attribute is
 *      convicted, the record is not.
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
 * KNOWN CEILING, THREE PARTS.
 *
 *   Exemption 4 is a noun list, so a canon-size claim phrased with a noun
 *   outside it ("the canon has forty-three entries") walks past. The two
 *   nouns are the two the defect actually used, twenty-six times, and
 *   widening the list re-convicts the true counts above. Widen it only with a
 *   measurement, not a guess.
 *
 *   WHAT THE NARROWED EXEMPTION 1 STILL DOES NOT CATCH: a size literal in a
 *   COMMENT, inside double quotes, asserted rather than quoted. `// the canon
 *   "holds forty-three records" today` is green, and it is a live claim, not
 *   a record of a dead one. Nothing distinguishes the two but intent, and
 *   this gate reads text. What the narrowing bought is that the exemption no
 *   longer covers the places text reaches a user — a JSX attribute, an
 *   object field, a rendered string — which is where a stale count does
 *   damage. A comment does not render.
 *
 *   AND ITS OTHER EDGE: comment prose is recognised only by a marker at the
 *   START of a line, so a quotation in a TRAILING comment (`const x = 1 //
 *   … "forty-three records"`) or in a block comment opened mid-line IS
 *   convicted. Measured: no such line exists in `src/` or `app/` today. If
 *   one is ever wanted, put the quotation on its own comment line — which is
 *   how the historical record already writes it.
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

/** Quotation spans, removed before matching. Exemption 1, comments only. */
const stripQuotations = (s: string): string => s.replace(/"[^"]*"|\u201c[^\u201d]*\u201d/g, ' ')

/**
 * The source in runs of like lines, comment markers stripped, each run
 * carrying whether it IS comment prose \u2014 which is what exemption 1 turns on.
 * Runs rather than lines because the historical record's quotation opens on
 * one `//` line and closes on the next, and a per-line strip would leave both
 * halves unbalanced and so convict it.
 */
function proseRuns(source: string): { text: string; isComment: boolean }[] {
  const runs: { text: string; isComment: boolean }[] = []
  for (const line of source.split('\n')) {
    const text = line.replace(/^\s*(?:\/\/+|\*+|\/\*+)\s?/, '')
    const isComment = text !== line
    const last = runs[runs.length - 1]
    if (last !== undefined && last.isComment === isComment) last.text += `\n${text}`
    else runs.push({ text, isComment })
  }
  return runs
}

/**
 * One violation, or `null`. Exported shape is the sentence and the matched
 * span, because "this file has a canon-size literal somewhere" is not a
 * message anyone can act on. The sentence is reported with its quotes intact
 * even where the match ran against a stripped copy.
 */
function canonSizeViolation(source: string): { sentence: string; match: string } | null {
  for (const run of proseRuns(source)) {
    for (const raw of run.text.split(/(?<=[.?!:;])\s|\n\s*\n/)) {
      const sentence = raw.replace(/\s+/g, ' ').trim()
      if (!sentence || !CANON_REFERENCE.test(sentence)) continue
      const match = (run.isComment ? stripQuotations(sentence) : sentence).match(SIZE_CLAIM)?.[0]
      if (match !== undefined) return { sentence, match }
    }
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

  it('acquits a quoted historical record, convicts it unquoted, convicts a double-quoted attribute', () => {
    // Exemption 1, and the proof it is doing work rather than nothing. The
    // quoted form is `src/surfaces/cc/live/model.ts`'s canonNote comment as
    // it stands — its quotation wrapped across two `//` lines, which is why
    // the strip runs over a RUN of comment lines and not one line. No
    // blueprint L-number is spelled here: this subject is a source file, and
    // `locator-fidelity` reads an `L<n>` as a citation of the frozen
    // blueprint, where that line is blank.
    const quoted =
      '// The membership count this sentence used to spell — "its DecisionId\n' +
      '// union has twenty-nine members" — was a stored copy of a derived answer'
    expect(canonSizeViolation(quoted)).toBeNull()
    expect(canonSizeViolation(quoted.replace(/"/g, ''))).not.toBeNull()

    // And the blind spot that narrowed the exemption to comments. All four of
    // these attributes become user-facing text; the single-quoted rendered
    // string is the pair's control and was always convicted.
    const claim = `The shared decision canon holds ${spellOut(CANON_SIZE)} records.`
    expect(canonSizeViolation(`      <p>{'${claim}'}</p>`)).not.toBeNull()
    for (const attr of ['aria-label', 'title', 'alt', 'placeholder']) {
      const jsx = `      <p ${attr}="${claim}" />`
      expect(canonSizeViolation(jsx), jsx).not.toBeNull()
    }
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
