import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * LOCATOR FIDELITY — are this build's frozen-source citations real?
 *
 * This build cites frozen-source line numbers everywhere: doc comments, test
 * names, `sourceRef` fields, disclosure records, commit messages. Those
 * citations are its primary evidence, and for five slices not one of them was
 * ever checked. A citation that points at the wrong line is worse than no
 * citation: it looks like evidence, it survives review, and it makes the next
 * reader's verification HARDER than having no reference at all.
 *
 * ── WHAT A CITATION LOOKS LIKE IN THIS TREE ────────────────────────────────
 * Surveyed rather than assumed. Across `src/`, `app/`, `tests/`, `scripts/`
 * the forms present are:
 *
 *     bare single line          6,032   e.g. a parenthesised line number
 *     hyphen range                239   two numbers, both prefixed
 *     EN DASH range                37   the same claim, different dash
 *     hyphen, second L elided       5   the second number bare
 *     ellipsis range                1   a horizontal-ellipsis separator
 *     slash pair                    4   two citations, NOT a range
 *
 * 6,313 citations across 428 files, of which 283 are ranges and 388 carry a
 * verbatim quotation and so reach the strong check.
 *
 * So the lexer scans for the STRUCTURE, not one spelling: a separator class of
 * hyphen / en dash / em dash / ellipsis, an optional second `L`, optional
 * surrounding space. Line numbers run three to six digits — the source is
 * 122,241 lines, and the shortest real citation in the tree is three digits.
 *
 * TWO FALSE-POSITIVE SHAPES, both found in the tree and both rejected:
 *   - identifier suffixes — `CELL-ARD-ASSY-L1`, `QUAL-FOOD-SAFETY-L2`. Killed
 *     by the lookbehind (no citation is preceded by an alphanumeric or `-`)
 *     and by the three-digit floor.
 *   - regex literals — a character class or an escape directly after the
 *     digits, as in the charter and tenant-metrics suites. Killed by rejecting
 *     a token whose next character is `[` or a backslash.
 *
 * ── STRONG CHECKS vs WEAK CHECKS, AND WHY THE DIFFERENCE MATTERS ───────────
 * These are NOT the same claim and this file never lets one pass for the
 * other. Both counts are asserted separately below.
 *
 * WEAK (every citation, ~6,100 of them). A bare line number with no quotation
 * carries no checkable content — nothing says WHAT that line is supposed to
 * say. All that can be established is plausibility:
 *   - the line exists (1 <= start <= end <= 122,241);
 *   - a range runs forwards, not backwards;
 *   - the cited span is not entirely BLANK. A blank line states nothing, so a
 *     citation of one is always wrong. This is the off-by-one class: a panel
 *     in `MOD-STU-07` cited a blank line and no review caught it.
 * Passing the weak check is NOT evidence a citation is right. It is only
 * evidence it is not obviously impossible.
 *
 * STRONG (citations carrying an adjacent verbatim quotation). When the code
 * writes a line number, a dash, and a quoted sentence, it is making a
 * checkable claim about that line, and it is checked hard: the quotation must
 * appear in the frozen source within +/-3 lines of the cited span.
 *
 * A quotation qualifies as strong only when ALL of these hold, because each
 * exclusion was a real false alarm observed while building this gate:
 *   - it is delimited by `"` or curly quotes. Single quotes are TypeScript
 *     string literals here, and apostrophes inside prose make them
 *     unparseable anyway.
 *   - it is ADJACENT to the citation — at most six characters of connective
 *     punctuation between them. Proximity is not adjacency: in
 *     `stu-03/matrix.ts` a citation covering "the Tenant Admin may not
 *     self-assign one" sits four words from a quoted phrase it does not cover.
 *   - each quotation binds to at most ONE citation, preferring the citation
 *     that PRECEDES it. In `stu-04/workflow.ts` a quoted sentence has one
 *     citation before it and another immediately after; binding both fails the
 *     second on a claim it never made.
 *   - it contains no `${` — an interpolated template is constructed text, not
 *     a quotation.
 *   - it contains no `...` or horizontal ellipsis. An elided quote is not a
 *     claim about a contiguous span: `stu-01/matrix.ts` reconstructs a
 *     nine-column matrix row with the middle columns elided, which is an
 *     accurate summary of its line and matches nothing verbatim.
 *   - it is at least 30 characters. Below that the "quotation" is a label the
 *     build coined, not source prose.
 *
 * Both sides are normalised identically before comparison — quote marks folded
 * to one character, markdown backtick/asterisk/underscore stripped, dashes
 * folded, whitespace collapsed, lowercased. Every one of those was a false
 * alarm first: `MOD-STU-01` quotes a fallback row that writes its own nested
 * quotation with double quotes where the citing comment used single ones.
 *
 * ── WHY +/-3 AND NOT EXACT ─────────────────────────────────────────────────
 * Measured, not guessed: of the strong claims that resolve at all, the great
 * majority land on the cited line EXACTLY, and the rest cluster one or two
 * lines off — a citation aimed at the bolded heading immediately above its
 * sentence. Three lines of slack in a 122,241-line file still takes a reader
 * to the claim. Beyond that it does not, and the gate says so.
 *
 * ── TWO FAILURE CLASSES, REPORTED APART ────────────────────────────────────
 * MISLOCATED — the quoted words are in the source, at a different line. The
 *   locator is wrong and can be corrected.
 * ABSENT — the quoted words are nowhere in the frozen source. That is not an
 *   off-by-N; it is a quotation the source does not contain, and the fix is a
 *   content decision, never a new locator invented to fit.
 *
 * ── THIS GATE CAN FAIL ─────────────────────────────────────────────────────
 * Nine assertions on this branch were incapable of failing, two of them
 * regexes that could not match the strings they were written to catch. So the
 * checker here is a pure function over text, and the last three `describe`
 * blocks feed it planted defects — a mislocated quote, an absent quote, a
 * reversed range, a blank-line citation, an out-of-range citation, and each
 * rejected false-positive shape — and assert each is reported. It was
 * additionally proven against the real tree by planting a wrong line number in
 * `src/studio/modules/stu-05/sections.ts`, watching this file go red naming
 * that file, and restoring the line.
 *
 * Those planted fixtures are BUILT, never written out as literals: this file
 * is inside its own scan, and a synthetic citation typed here would be lexed
 * and graded like any other. `cite()` is why the fixtures are invisible to the
 * walk. Every line number that does appear literally in this file's prose is a
 * real one, and is graded with the rest.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

/**
 * Resolved relative to the repository rather than hardcoded, so no absolute
 * author path enters the tree — `prohibited-patterns.test.ts` bans those from
 * the release artifact, and there is no reason to write one here either.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

/* ── the scan ──────────────────────────────────────────────────────────── */

const SCAN_ROOTS = ['src', 'app', 'tests', 'scripts']
const SCANNED_EXT = /\.(ts|tsx|mjs|js|jsx)$/

/**
 * Another test file's scratch probe, planted on the real filesystem and
 * deleted the moment its assertion finishes. Listing one and then reading it
 * fails a correct build on a race rather than on a finding. Exact match, never
 * a prefix, for the reason `slice-2c-gates.test.ts` records in full: a prefix
 * form would also hide a real source file named `zz-probe.ts` from this scan.
 */
const isForeignProbe = (entry: string): boolean =>
  /^\.zz-probe-(?:[a-z0-9-]+-)?\d+$/.test(entry)

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (SCANNED_EXT.test(entry)) acc.push(full)
  }
  return acc
}

/* ── the lexer ─────────────────────────────────────────────────────────── */

/**
 * `L` + 3-6 digits, optionally a separator and a second line number whose `L`
 * is optional. The lookbehind rejects identifier suffixes; the digit floor
 * rejects one- and two-digit cell ids; the caller rejects regex literals by
 * the character that follows the digits.
 */
const CITATION = /(?<![A-Za-z0-9_-])L(\d{3,6})(?:\s*[-–—…]\s*L?(\d{3,6}))?/g

/** The barrier between two lines that are not both comment. See `flatten`. */
const BARRIER = '\u0000'

/** Double or curly quotes only, and never across a barrier. */
const QUOTED = /["“]([^"”\u0000]{3,400})["”]/g

/**
 * Text permitted BETWEEN two citations for them to count as one run offering
 * the same quotation. `stu-09/levels.ts` writes `<a> and <b>: "<quote>"` and
 * the quote sits at the first of the two: the code cited both, so satisfying
 * either satisfies the claim. Reading only the nearest reports a defect the
 * code did not commit.
 *
 * An identifier is allowed to sit between two citations of a run, because the
 * commonest form of the run labels its second member -- `stu-07/libraries.ts`
 * writes `(<line>, \`AC-STU-071\` <line>)`, one locator for the property and
 * one for the acceptance criterion that pins it.
 */
const RUN_JOIN = /^[\s,;·()[\]`'"]*(?:and|or|[A-Z]{2,4}(?:-[A-Z0-9.]+)+)?[\s,;·()[\]`'"]*$/

/**
 * Connective punctuation permitted between a citation and the quote it binds.
 *
 * NO FULL STOP AND NO SEMICOLON. A sentence or clause boundary between a
 * citation and a quotation means
 * the citation belongs to the sentence that ended, not the quotation that
 * follows: `integration-surface/fixtures.ts` reads
 * `verified at <range>. "Every cell carries an explicit status" (<line>)`,
 * where the range covers the matrix and the parenthesised line covers the
 * quotation. Allowing `.` bound the quotation to the range and failed it.
 *
 * The backtick IS allowed: a citation is often introduced by a code-spanned
 * acceptance-criterion id, as in `(\`AC-SA-005\`, <line>)`.
 */
const CONNECTIVE = /^[\s—–\-:,*()[\]·`]*$/
const MAX_GAP = 6

/** Shortest quotation treated as a verbatim claim rather than a coined label. */
const MIN_QUOTE = 30

/** Lines of slack allowed between the cited span and the quoted words. */
const WINDOW = 3

const normalise = (s: string): string =>
  s
    .replace(/['‘’“”]/g, '"')
    .replace(/[`*_]/g, '')
    .replace(/[–—‒]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/** Strip the punctuation a sentence is wrapped in without touching its words. */
const quoteCore = (s: string): string =>
  normalise(s)
    .replace(/^[^a-z0-9|§]+/, '')
    .replace(/[^a-z0-9)\]|]+$/, '')

export interface Citation {
  readonly file: string
  readonly line: number
  readonly token: string
  readonly start: number
  readonly end: number
  /** Present only when a verbatim quotation is bound to this citation. */
  readonly quote?: string
  /**
   * Every span in the run this citation belongs to, itself included. A bound
   * quotation is satisfied by any of them -- see `RUN_JOIN`.
   */
  readonly group?: readonly (readonly [number, number])[]
}

/**
 * One file becomes one string, so a quotation split across two lines of the
 * same block comment still reads as one quotation.
 *
 * Lines inside a run of comment are joined with a space and their leaders
 * removed. EVERY OTHER JOIN IS A BARRIER, which appears in no character class
 * above and so can be crossed by neither a quotation nor an adjacency gap.
 * Without it `surfaces/doh/modules.ts` binds an authored `purpose` string on
 * one line to the citation comment on the next, and reports a defect that is
 * not one.
 */
function flatten(text: string): { buffer: string; lineAt: (offset: number) => number } {
  let buffer = ''
  const marks: { offset: number; line: number }[] = []
  let previousWasComment = false
  for (const [index, raw] of text.split('\n').entries()) {
    const isComment = /^\s*(\*|\/\/|\/\*)/.test(raw)
    const body = isComment ? raw.replace(/^\s*(\/\*\*?|\*\/|\*|\/\/)\s?/, '') : raw
    if (index > 0) buffer += isComment && previousWasComment ? ' ' : BARRIER
    marks.push({ offset: buffer.length, line: index + 1 })
    buffer += body
    previousWasComment = isComment
  }
  const lineAt = (offset: number): number => {
    let line = 1
    for (const mark of marks) {
      if (mark.offset > offset) break
      line = mark.line
    }
    return line
  }
  return { buffer, lineAt }
}

/** Every citation in one file, each carrying its bound quotation where it has one. */
export function citationsIn(file: string, text: string): Citation[] {
  const { buffer, lineAt } = flatten(text)
  const found = [...buffer.matchAll(CITATION)].filter((m) => {
    // NOT `'[\\'.includes(next)`: `String.includes('')` is true, so an
    // end-of-file citation would be silently dropped -- and the last citation
    // in a file is a citation like any other.
    const previous = buffer[m.index - 1]
    const next = buffer[m.index + m[0].length]
    if (next === '[' || next === '\\') return false
    // Wrapped in regex-literal delimiters. `doh-locations.test.ts` asserts a
    // module no longer matches a corrected-away locator, and that assertion is
    // ABOUT a citation rather than being one. A slash on ONE side is not
    // enough: the slash pair form is two real citations.
    return !(previous === '/' && next === '/')
  })
  const bound = new Map<number, string>()
  for (const quote of buffer.matchAll(QUOTED)) {
    const opens = quote.index
    const closes = quote.index + quote[0].length
    // Prefer the citation that precedes the quotation; a quotation binds once.
    let cite = found.find((m) => {
      const ends = m.index + m[0].length
      return ends <= opens && opens - ends <= MAX_GAP && CONNECTIVE.test(buffer.slice(ends, opens))
    })
    cite ??= found.find(
      (m) =>
        m.index >= closes &&
        m.index - closes <= MAX_GAP &&
        CONNECTIVE.test(buffer.slice(closes, m.index)),
    )
    const inner = quote[1]
    if (cite === undefined || inner === undefined || bound.has(cite.index)) continue
    // Tested BEFORE coring: coring strips the delimiters these look for.
    if (inner.includes('${') || /\.\.\.|…/.test(inner)) continue
    const claim = quoteCore(inner)
    if (claim.length < MIN_QUOTE) continue
    bound.set(cite.index, claim)
  }
  const spanOf = (m: RegExpExecArray | RegExpMatchArray): readonly [number, number] => {
    const start = Number(m[1])
    return [start, m[2] === undefined ? start : Number(m[2])]
  }
  /** The maximal run of citations this one belongs to. See `RUN_JOIN`. */
  const joined = (left: RegExpExecArray, right: RegExpExecArray): boolean =>
    RUN_JOIN.test(buffer.slice(left.index + left[0].length, right.index))
  const runOf = (index: number): readonly (readonly [number, number])[] => {
    const run: RegExpExecArray[] = []
    for (let i = index; i > 0; i--) {
      const left = found[i - 1]
      const right = found[i]
      if (left === undefined || right === undefined || !joined(left, right)) break
      run.unshift(left)
    }
    const self = found[index]
    if (self !== undefined) run.push(self)
    for (let i = index + 1; i < found.length; i++) {
      const left = found[i - 1]
      const right = found[i]
      if (left === undefined || right === undefined || !joined(left, right)) break
      run.push(right)
    }
    return run.map(spanOf)
  }
  return found.map((m, index) => {
    const [start, end] = spanOf(m)
    const quote = bound.get(m.index)
    return {
      file,
      line: lineAt(m.index),
      token: m[0],
      start,
      end,
      ...(quote === undefined ? {} : { quote, group: runOf(index) }),
    }
  })
}

/* ── the checks ────────────────────────────────────────────────────────── */

export type Verdict =
  | { kind: 'out-of-range' }
  | { kind: 'reversed-range' }
  | { kind: 'blank-line' }
  | { kind: 'mislocated'; foundAt: number[] }
  | { kind: 'absent' }

/**
 * `source` is the normalised frozen source, one entry per line. Indexing it
 * once and reusing it is the whole reason this gate reads an 18MB file once
 * rather than once per citation.
 */
export function checkCitation(
  citation: Citation,
  source: readonly string[],
  raw: readonly string[] = source,
): Verdict | null {
  const { start, end, quote } = citation
  if (start < 1 || end > source.length) return { kind: 'out-of-range' }
  if (end < start) return { kind: 'reversed-range' }
  // Blankness is judged on the RAW line, never the normalised one. Normalising
  // strips markdown, so a fenced-code delimiter normalises to the empty string
  // and a citation of one would be reported as citing nothing -- which it is
  // not: closing a diagram block is a real position in the document.
  if (raw.slice(start - 1, end).every((line) => line.trim() === '')) return { kind: 'blank-line' }
  if (quote === undefined) return null
  for (const [lo, hi] of citation.group ?? [[start, end]]) {
    const from = Math.max(0, lo - 1 - WINDOW)
    const to = Math.min(source.length, hi + WINDOW)
    if (source.slice(from, to).some((line) => line.includes(quote))) return null
  }
  const foundAt: number[] = []
  for (let i = 0; i < source.length && foundAt.length < 4; i++) {
    if (source[i]?.includes(quote) === true) foundAt.push(i + 1)
  }
  return foundAt.length > 0 ? { kind: 'mislocated', foundAt } : { kind: 'absent' }
}

const describeOffender = (c: Citation, v: Verdict): string =>
  `${c.file}:${c.line} cites ${c.token}` +
  (v.kind === 'mislocated' ? ` but the quoted words are at ${v.foundAt.join(', ')}` : '') +
  (c.quote === undefined ? '' : ` — "${c.quote.slice(0, 90)}"`)

/* ── the run ───────────────────────────────────────────────────────────── */

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)
/**
 * The trailing newline yields one extra empty element that is not a line.
 * Leaving it in makes `source.length` 122,242 and lets a citation one past the
 * end pass the range check.
 */
const sourceRaw = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)
const source = sourceRaw.map(normalise)
const files = SCAN_ROOTS.flatMap((root) => walk(root))
const citations = files.flatMap((file) => citationsIn(file, readFileSync(file, 'utf8')))
const graded = citations.map((c) => ({ citation: c, verdict: checkCitation(c, source, sourceRaw) }))
/**
 * Printed in full as well as asserted. Vitest elides a long array in its diff,
 * and a gate whose findings cannot be read is a gate people re-run instead of
 * act on -- these lists routinely run to dozens of entries.
 */
const offenders = (kind: Verdict['kind']): string[] => {
  const list = graded
    .filter((g) => g.verdict?.kind === kind)
    .map((g) => describeOffender(g.citation, g.verdict as Verdict))
    .sort()
  if (list.length > 0) console.error(`\n[locator-fidelity] ${kind} (${list.length}):\n  ${list.join('\n  ')}`)
  return list
}

describe('locator fidelity: the frozen source', () => {
  it('is present where every citation in this tree points', () => {
    expect(existsSync(SOURCE_PATH), `frozen source not found at ${SOURCE_PATH}`).toBe(true)
  })

  it('is the frozen bytes and not a drifted copy', () => {
    const hash = createHash('sha256').update(sourceBytes).digest('hex')
    expect(hash, 'source drift — stop and run master prompt §2.1 before trusting this gate').toBe(
      SOURCE_SHA256,
    )
  })

  it('has the line count the citations are numbered against', () => {
    expect(source.length).toBe(SOURCE_LINE_COUNT)
  })
})

describe('locator fidelity: the scan is not vacuous', () => {
  it('walks the four roots and finds files in each', () => {
    for (const root of SCAN_ROOTS) {
      expect(walk(root).length, `${root}/ contributed no scanned file`).toBeGreaterThan(0)
    }
  })

  it('lexes the thousands of citations this tree is known to carry', () => {
    expect(citations.length).toBeGreaterThan(5_000)
  })

  it('binds a verbatim quotation to a meaningful number of them', () => {
    // The strong bucket is the only one that proves anything. If a future edit
    // narrows the binding rules until it empties, this gate becomes the weak
    // check wearing the strong check's name, and that must be a failure.
    expect(citations.filter((c) => c.quote !== undefined).length).toBeGreaterThan(250)
  })
})

describe('locator fidelity: weak checks — plausibility only', () => {
  it('cites no line outside the frozen source', () => {
    expect(offenders('out-of-range')).toEqual([])
  })

  it('cites no range that runs backwards', () => {
    expect(offenders('reversed-range')).toEqual([])
  })

  it('cites no span that is entirely blank', () => {
    expect(offenders('blank-line')).toEqual([])
  })
})

describe('locator fidelity: strong checks — the quotation must be at the line', () => {
  it('quotes no words that sit at a different line from the one cited', () => {
    expect(offenders('mislocated')).toEqual([])
  })

  it('quotes no words the frozen source does not contain', () => {
    // Distinct from mislocated ON PURPOSE. There is no locator to correct
    // here; inventing one to make this green would manufacture the exact
    // false evidence this file exists to find.
    expect(offenders('absent')).toEqual([])
  })
})

/* ── proof that the gate can fail ──────────────────────────────────────── */

/**
 * Builds a citation token so no synthetic line number is ever written as a
 * literal in this file. This file is inside its own scan; a literal would be
 * lexed and graded against the real frozen source along with everything else.
 */
const cite = (n: number, to?: number, sep = '-', second = 'L'): string =>
  `L${String(n).padStart(3, '0')}` +
  (to === undefined ? '' : `${sep}${second}${String(to).padStart(3, '0')}`)

describe('locator fidelity: the checker reports planted defects', () => {
  // Twenty lines so a wrong locator can sit further from the claim than
  // WINDOW, which is the only way a mislocated citation is distinguishable
  // from a correct one.
  const fakeSource = [
    'alpha line one',
    '',
    'the quality manager may not approve their own submission',
    'gamma line four',
    ...Array.from({ length: 16 }, (_, i) => `filler line ${i + 5}`),
  ].map(normalise)

  const CLAIM = 'the quality manager may not approve their own submission'

  const only = (text: string): Citation => {
    const found = citationsIn('probe.ts', text)
    expect(found.length, `expected exactly one citation in ${JSON.stringify(text)}`).toBe(1)
    return found[0] as Citation
  }

  it('accepts a citation whose quotation is at the cited line', () => {
    const c = only(`/** ${cite(3)} — "${CLAIM}" */`)
    expect(c.quote).toBe(CLAIM)
    expect(checkCitation(c, fakeSource)).toBeNull()
  })

  it('reports a quotation that sits at a different line', () => {
    expect(checkCitation(only(`/** ${cite(15)} — "${CLAIM}" */`), fakeSource)).toEqual({
      kind: 'mislocated',
      foundAt: [3],
    })
  })

  it('reports a quotation the frozen source does not contain', () => {
    const c = only(`/** ${cite(3)} — "the quality manager may delete a published version" */`)
    expect(checkCitation(c, fakeSource)).toEqual({ kind: 'absent' })
  })

  it('does not report a citation of a fenced-code delimiter as blank', () => {
    // Real shape: several modules cite the closing fence of a state diagram.
    // Normalising strips the backticks, so judging blankness on the normalised
    // line would report a defect that is not one.
    const raw = ['alpha', '```', 'gamma']
    const c = only(`// see ${cite(2)} for the diagram`)
    expect(checkCitation(c, raw.map(normalise), raw)).toBeNull()
  })

  it('reports a citation of a blank line', () => {
    expect(checkCitation(only(`// see ${cite(2)} for the rule`), fakeSource)).toEqual({
      kind: 'blank-line',
    })
  })

  it('reports a citation past the end of the source', () => {
    expect(checkCitation(only(`// see ${cite(999)} for the rule`), fakeSource)).toEqual({
      kind: 'out-of-range',
    })
  })

  it('reports a range that runs backwards', () => {
    expect(checkCitation(only(`// see ${cite(4, 3)} for the rule`), fakeSource)).toEqual({
      kind: 'reversed-range',
    })
  })

  it('reads a range as one claim covering both endpoints, not two', () => {
    for (const token of [
      cite(1, 4),
      cite(1, 4, '–'),
      cite(1, 4, '-', ''),
      cite(1, 4, '…'),
      cite(1, 4, ' - '),
    ]) {
      const c = only(`// see ${token} for the rule`)
      expect([c.start, c.end], token).toEqual([1, 4])
    }
    // A range is satisfied by the quotation appearing anywhere inside it.
    expect(checkCitation(only(`/** ${cite(1, 4)} — "${CLAIM}" */`), fakeSource)).toBeNull()
  })

  it('lexes a slash pair as two citations rather than one range', () => {
    const both = citationsIn('probe.ts', `// ${cite(1)}/${cite(4)}`)
    expect(both.map((c) => [c.start, c.end])).toEqual([
      [1, 1],
      [4, 4],
    ])
  })
})

describe('locator fidelity: the lexer rejects what is not a citation', () => {
  const tokensOf = (text: string): string[] => citationsIn('probe.ts', text).map((c) => c.token)

  it('rejects an identifier suffix', () => {
    // Both shapes are real: the Hub location-configuration and
    // permissions-roles-and-access fixtures.
    expect(tokensOf("id: 'CELL-ARD-ASSY-L1', qual: 'QUAL-FOOD-SAFETY-L2'")).toEqual([])
  })

  it('rejects a regex literal whose digits are a character class', () => {
    // Real shapes: the charter and tenant-metrics suites assert a sourceRef
    // matches a pattern, and the pattern reads as a citation to a naive lexer.
    expect(tokensOf('expect(row.sourceRef).toMatch(/^L307[56]\\d$/)')).toEqual([])
    expect(tokensOf('const navLine = /L427[3-5][0-9]/')).toEqual([])
  })

  it('rejects a citation wrapped in regex-literal delimiters', () => {
    // Real shape, tests/unit/doh-locations.test.ts: an assertion that a module
    // no longer matches a locator it was corrected away from.
    expect(tokensOf('expect(text, file).not.toMatch(/L27204/)')).toEqual([])
  })

  it('rejects a citation escaped inside a regex literal', () => {
    // Real shape: sa-platform-settings asserts on rendered text containing a
    // parenthesised locator, so the closing paren arrives escaped.
    expect(tokensOf('/cannot propose a pause \\(L42715\\)/i')).toEqual([])
  })

  it('accepts every citation form the tree actually contains', () => {
    const forms = [cite(101), cite(102, 103), cite(104, 105, '–'), cite(106, 107, '-', ''), cite(108, 109, '…')]
    expect(tokensOf(`(${forms[0]}) ${forms.slice(1).join(' ')}`)).toEqual(forms)
  })
})

describe('locator fidelity: a quotation is bound only when it is really adjacent', () => {
  const quotesOf = (text: string): (string | undefined)[] =>
    citationsIn('probe.ts', text).map((c) => c.quote)

  const CLAIM = 'the quality manager may not approve a submission'

  it('binds a quotation that follows its citation', () => {
    expect(quotesOf(`/** ${cite(123)} — "${CLAIM}" */`)).toEqual([CLAIM])
  })

  it('binds a quotation that precedes its citation', () => {
    expect(quotesOf(`/** "${CLAIM}" (${cite(123)}) */`)).toEqual([CLAIM])
  })

  it('does not bind a quotation separated from the citation by words', () => {
    // Real shape, src/studio/modules/stu-03/matrix.ts: the citation covers the
    // clause before it, not the phrase four words later.
    expect(
      quotesOf(`/** may not self-assign one (${cite(123)}), so "${CLAIM}" is advice */`),
    ).toEqual([undefined])
  })

  it('binds one quotation to one citation, never to two', () => {
    // Real shape, src/studio/modules/stu-04/workflow.ts.
    expect(quotesOf(`/** ${cite(123)}: "${CLAIM}" ${cite(456)} makes it explicit */`)).toEqual([
      CLAIM,
      undefined,
    ])
  })

  it('does not bind forward across a clause boundary', () => {
    // Real shape, src/studio/state/connectivity.ts: three readings listed one
    // per line, each `<line> "<quotation>";`. The semicolon ends a reading, so
    // the quotation before it belongs to the line that introduced it.
    const second = 'a lost connection renders a different state entirely'
    // The citation takes the quotation AFTER it, never the one the semicolon
    // closed off before it.
    expect(quotesOf(`/** the surfaces "${CLAIM}"; ${cite(123)} "${second}" */`)).toEqual([second])
  })

  it('does not bind across the boundary between code and comment', () => {
    // Real shape, src/surfaces/doh/modules.ts: an authored `purpose` string on
    // one line, a citation comment on the next. Not a quotation of the source.
    expect(
      quotesOf(`  purpose:\n    "${CLAIM}",\n    // ${cite(123)}. Two of the twelve rows are\n`),
    ).toEqual([undefined])
  })

  it('joins a quotation split across two lines of one block comment', () => {
    expect(quotesOf(`/**\n * ${cite(123)} — "the quality manager may not\n * approve a submission"\n */`)).toEqual([
      CLAIM,
    ])
  })

  it('does not bind an interpolated template, which is constructed text', () => {
    expect(quotesOf(`/** ${cite(123)} — "\${cell.note} is what this row says about it" */`)).toEqual(
      [undefined],
    )
  })

  it('does not bind an elided quotation, which claims no contiguous span', () => {
    // Real shape, src/studio/modules/stu-01/matrix.ts: an accurate summary of a
    // nine-column matrix row, and verbatim nowhere.
    expect(
      quotesOf(`/** ${cite(123)} — "Enable or disable a capability | … | Explicitly prohibited" */`),
    ).toEqual([undefined])
  })

  it('does not bind a coined label too short to be source prose', () => {
    expect(quotesOf(`/** ${cite(123)} — "Tier record field groups: 6" */`)).toEqual([undefined])
  })

  it('offers every citation in a run to the quotation they jointly introduce', () => {
    // Real shape, src/studio/modules/stu-09/levels.ts: two locators, one
    // quotation, the words at the FIRST of the two. The code cited both.
    const c = citationsIn('probe.ts', `/** ${cite(1)} and ${cite(4)}: "${CLAIM}" */`)[1] as Citation
    expect(c.group).toEqual([
      [1, 1],
      [4, 4],
    ])
    const src = ['alpha', 'beta', 'gamma', `delta ${CLAIM} epsilon`].map(normalise)
    // Satisfied at line 4, which the second locator names.
    expect(checkCitation(c, src)).toBeNull()
    // And still reported when NEITHER locator in the run reaches the words.
    const far = ['x', 'y', 'z', 'w', 'v', 'u', 'ت', 'q', 'p', 'o', 'n', `m ${CLAIM}`].map(normalise)
    expect(checkCitation(c, far)).toEqual({ kind: 'mislocated', foundAt: [12] })
  })

  it('matches through markdown and quote-mark differences on either side', () => {
    // Real shape, src/studio/modules/stu-01/capabilities.ts against its cited
    // fallback row: the same words, the nested quotation written single where
    // the source writes it double, and the source line marked up in markdown.
    const c = citationsIn(
      'probe.ts',
      `/** ${cite(1)} — "labelled with its timestamp and marked 'last retrieved' rather than 'current'" */`,
    )[0] as Citation
    const src = [
      "| First fallback | The area opens read-only, **labelled with its timestamp** and marked “last retrieved” rather than “current”. |",
    ].map(normalise)
    expect(checkCitation(c, src)).toBeNull()
  })
})
