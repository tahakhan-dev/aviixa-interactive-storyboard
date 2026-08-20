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
 * 6,511 citations, in 244 of the 434 files scanned, of which 294 are ranges.
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
 * other. Every count is asserted separately below, and the split is printed:
 *
 *     strong, verbatim quotation      408
 *     strong, identifier anchor     1,153
 *     anchored but unproven (weak)     41
 *     weak, plausibility only       4,950
 *
 * WEAK. A bare line number with no quotation and no identifier beside it
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
 * STRONG BY IDENTIFIER ANCHOR (1,153 citations). Most of this tree's bare line
 * numbers are not bare at all: they are written NEXT TO an identifier the
 * frozen source defines — `FB-STU-10`, `AC-STU-097`, `MOD-STU-13`,
 * `DEC-LANEB-001`, `SCR-STU-04`, `FUNC-STU-07-02-C-1`. That is a checkable
 * claim, and it was going unchecked. Where a citation is anchored to an
 * identifier, the cited line must be a line that identifier really occurs at.
 * `anchorOf` defines "next to" and says why it is leftwards only; `IDENTIFIER`
 * and `buildIdentifierIndex` say where the occurrences come from and why the
 * shipped index is not allowed to be the answer.
 *
 * NO WINDOW IS ALLOWED ON THAT ONE. An identifier's line is a fact stated
 * exactly, not a heading a sentence sits under — and every off-by-one in this
 * tree was inside a window of three. See `anchorVerdict`.
 *
 * ── WHY +/-3 AND NOT EXACT, FOR A QUOTATION ────────────────────────────────
 * Measured, not guessed: of the strong claims that resolve at all, the great
 * majority land on the cited line EXACTLY, and the rest cluster one or two
 * lines off — a citation aimed at the bolded heading immediately above its
 * sentence. Three lines of slack in a 122,241-line file still takes a reader
 * to the claim. Beyond that it does not, and the gate says so.
 *
 * ── THREE FAILURE CLASSES, REPORTED APART ──────────────────────────────────
 * MISLOCATED — the quoted words are in the source, at a different line. The
 *   locator is wrong and can be corrected.
 * ABSENT — the quoted words are nowhere in the frozen source. That is not an
 *   off-by-N; it is a quotation the source does not contain, and the fix is a
 *   content decision, never a new locator invented to fit.
 * ANCHOR-MISS — the cited line is not one of the identifier's, and it carries
 *   the identifier's NEIGHBOUR instead. The correct line is not guessed here
 *   either; it is read off the index and printed in the failure.
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

/* ── the identifiers ───────────────────────────────────────────────────── */

/**
 * THE VOCABULARY AND THE POSITIONS COME FROM DIFFERENT FILES, ON PURPOSE.
 *
 * `registries/raw/identifier-index.json` says WHICH tokens in this document
 * are identifiers — 17,931 of them, `FB-STU-10`, `AC-STU-097`, `MOD-STU-13`,
 * `DEC-LANEB-001`, `SCR-STU-04`, `FUNC-STU-07-02-C-1`. The frozen source says
 * WHERE each one occurs. Those are deliberately not the same input.
 *
 * The index cannot supply positions, because it is CAPPED AT THREE LINES PER
 * IDENTIFIER. Measured over all 17,931 keys against the frozen source: every
 * entry of one or two lines is complete — zero of the 15,908 of them omits an
 * occurrence — and 1,261 of the 1,895 three-line entries are truncated.
 * `FB-STU-10` is one of the truncated ones; the index lists three of its
 * thirty-six occurrences. A check that trusted the index for positions would
 * be blind to most of the identifiers it exists to judge.
 *
 * Splitting the two inputs is also what keeps the expectation independent of
 * the field under test. Editing the index cannot move an identifier's line —
 * only editing the frozen source can, and its sha256 is pinned above. Editing
 * the index CAN drop a key and so silence a check, which is why the count of
 * citations this reaches is asserted against a floor rather than left to
 * whatever the index happens to contain.
 *
 * The index is cross-checked against the source below: every one of its
 * 23,364 (identifier, line) pairs must be a real occurrence at that line.
 */
const IDENTIFIER_INDEX_PATH = join(process.cwd(), 'registries', 'raw', 'identifier-index.json')
const rawIdentifierIndex: Record<string, readonly number[]> = existsSync(IDENTIFIER_INDEX_PATH)
  ? (JSON.parse(readFileSync(IDENTIFIER_INDEX_PATH, 'utf8')) as Record<string, readonly number[]>)
  : {}
const VOCABULARY: ReadonlySet<string> = new Set(Object.keys(rawIdentifierIndex))

/**
 * An identifier as this document writes one: an uppercase stem, then at least
 * one hyphenated segment, each segment ending in an alphanumeric. The
 * lookaround pair is why `SoW`, `TBD` and a bare `V1` are not identifiers, and
 * why `MOD-DOH-13`'s appearance inside `MOD-DOH-13.1` does not read as
 * `MOD-DOH-13`, nor `CFR-2023` inside a `CFR-2023-title21-vol1` URL.
 * Membership of the vocabulary then decides the rest — this regex proposes,
 * the index disposes.
 *
 * A SEGMENT MAY NOT END IN A DOT, which is not decoration: `[A-Z0-9.]+` reads
 * `ANO-BB-000041.` at the end of a sentence as one token and then finds it in
 * no vocabulary, so an identifier written last in its sentence would silently
 * stop anchoring anything. Found by cross-checking the index against this
 * regex rather than by reasoning about it.
 */
const IDENTIFIER = /(?<![A-Za-z0-9-])[A-Z][A-Z0-9]{1,9}(?:-[A-Z0-9]+(?:\.[A-Z0-9]+)*)+(?![A-Za-z0-9-])/g

/** The family an identifier belongs to: itself with its trailing number cut. */
const stemOf = (id: string): string => id.replace(/[0-9]+$/, '')

export interface IdentifierIndex {
  /** Every line each identifier occurs at, ascending. */
  readonly lines: ReadonlyMap<string, readonly number[]>
  /** Every identifier occurring at a line. Sparse — most lines carry none. */
  readonly atLine: ReadonlyMap<number, ReadonlySet<string>>
  /** Every identifier sharing a stem, so a neighbouring row can be named. */
  readonly family: ReadonlyMap<string, ReadonlySet<string>>
}

export function buildIdentifierIndex(
  lines: readonly string[],
  vocabulary: ReadonlySet<string>,
): IdentifierIndex {
  const at = new Map<string, number[]>()
  const atLine = new Map<number, Set<string>>()
  for (const [index, text] of lines.entries()) {
    for (const match of text.matchAll(IDENTIFIER)) {
      if (!vocabulary.has(match[0])) continue
      const line = index + 1
      const seen = at.get(match[0])
      // An identifier written twice on one line is one occurrence.
      if (seen === undefined) at.set(match[0], [line])
      else if (seen.at(-1) !== line) seen.push(line)
      const here = atLine.get(line)
      if (here === undefined) atLine.set(line, new Set([match[0]]))
      else here.add(match[0])
    }
  }
  const family = new Map<string, Set<string>>()
  for (const id of at.keys()) {
    const stem = stemOf(id)
    const kin = family.get(stem)
    if (kin === undefined) family.set(stem, new Set([id]))
    else kin.add(id)
  }
  return { lines: at, atLine, family }
}

const IDENTIFIERS = buildIdentifierIndex(sourceRaw, VOCABULARY)

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

/**
 * Text permitted between two identifiers for the nearer one to be AMBIGUOUS as
 * an anchor. `TenantsScreen.tsx` writes
 * `SB-31-01, SB-31-02 and SB-31-05 (<line>, <line>, <line>)` — three names and
 * three locators, paired POSITIONALLY, so the identifier nearest the first
 * locator is not the one that locator is about. Reading the nearest anchored
 * this build's only correct three-way citation to the wrong line and reported
 * it as a defect. Where a run of identifiers is offered like this, no anchor
 * is taken at all; an ambiguous anchor is worth less than none.
 *
 * `and` and `or` are inside the class for the same reason `RUN_JOIN` carries
 * them: the tree writes the last member of such a list with a conjunction.
 */
const CHAIN = /^[\s,;·()[\]`'"]*(?:and|or)?[\s,;·()[\]`'"]*$/

export interface Citation {
  readonly file: string
  readonly line: number
  readonly token: string
  /** Offset into the flattened buffer. Used to place a quotation beside it. */
  readonly offset: number
  readonly start: number
  readonly end: number
  /** Present only when a verbatim quotation is bound to this citation. */
  readonly quote?: string
  /**
   * Every span in the run this citation belongs to, itself included. A bound
   * quotation is satisfied by any of them -- see `RUN_JOIN`.
   */
  readonly group?: readonly (readonly [number, number])[]
  /**
   * The frozen-source identifier this citation is written NEXT TO, where it is
   * written next to one unambiguously. See `anchorOf` for what "next to" means
   * and why it is the direction it is.
   */
  readonly anchor?: string
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

/**
 * Every citation in one file, each carrying its bound quotation and its bound
 * identifier where it has them.
 *
 * `vocabulary` is injectable so the planted-defect fixtures below can anchor
 * against identifiers of their own without depending on what the real index
 * happens to contain.
 */
export function citationsIn(
  file: string,
  text: string,
  vocabulary: ReadonlySet<string> = VOCABULARY,
): Citation[] {
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
  /**
   * WHAT "NEXT TO AN IDENTIFIER" MEANS, AND WHY IT IS THIS AND NOT SOMETHING
   * WIDER. Surveyed over the 6,486 citations in this tree rather than chosen.
   *
   * The identifier must PRECEDE the citation, with at most `MAX_GAP`
   * characters of `CONNECTIVE` punctuation between — the same adjacency
   * contract a quotation already binds under, in the one direction this tree
   * writes "identifier X lives at line N". Every form that satisfies it is a
   * real spelling of that claim, counted:
   *
   *     `X <line>`         318   297 exact, 21 within three, 0 beyond
   *     `X, <line>`        226   221 exact,  0 within three, 5 beyond
   *     `X` (<line>)       353   343 exact,  1 within three, 9 beyond
   *     `X`, <line>         40    35 exact,  3 within three, 2 beyond
   *     `X · <line>`        14    12 exact,  0 within three, 2 beyond
   *
   * THE OTHER DIRECTION IS NOT THIS CLAIM AND IS NOT TAKEN. A citation
   * FOLLOWED by an identifier is the tree's co-citation form, and it means
   * something else entirely: `stu-07/libraries.ts` writes
   * `(<line>, \`AC-STU-071\` <line>)` — the first locator for the property,
   * the second for the acceptance criterion, and the identifier belongs to the
   * SECOND. `evaluate.ts` writes `(<line>, AC-STU-156)` — one locator for the
   * claim, one identifier naming the criterion that pins it, at its own line
   * 68 lines away. Anchoring rightwards reported 40-odd of those as defects
   * and not one of them was one.
   *
   * `MAX_GAP` of six is measured too, not inherited for tidiness: widening the
   * gap to twelve found three more anchors in the whole tree, which is what a
   * cutoff past the real forms looks like.
   */
  const identifiers = [...buffer.matchAll(IDENTIFIER)].filter((m) => vocabulary.has(m[0]))
  const anchorOf = (m: RegExpExecArray | RegExpMatchArray): string | undefined => {
    let index = identifiers.length - 1
    while (index >= 0 && (identifiers[index]?.index ?? 0) >= (m.index ?? 0)) index--
    const anchor = identifiers[index]
    if (anchor === undefined) return undefined
    const between = buffer.slice(anchor.index + anchor[0].length, m.index)
    if (between.length > MAX_GAP || !CONNECTIVE.test(between)) return undefined
    const previous = identifiers[index - 1]
    if (
      previous !== undefined &&
      CHAIN.test(buffer.slice(previous.index + previous[0].length, anchor.index))
    ) {
      return undefined
    }
    return anchor[0]
  }
  return found.map((m, index) => {
    const [start, end] = spanOf(m)
    const quote = bound.get(m.index)
    const anchor = anchorOf(m)
    return {
      file,
      line: lineAt(m.index),
      token: m[0],
      offset: m.index,
      start,
      end,
      // The run is computed for EVERY citation now, not only quoted ones: an
      // anchored citation is satisfied by any span of its run for the same
      // reason a quotation is -- `SB-SA-10 (<line>, <line>)` cited both.
      group: runOf(index),
      ...(quote === undefined ? {} : { quote }),
      ...(anchor === undefined ? {} : { anchor }),
    }
  })
}

/* ── the checks ────────────────────────────────────────────────────────── */

export type Verdict =
  | { kind: 'out-of-range' }
  | { kind: 'reversed-range' }
  | { kind: 'blank-line' }
  | { kind: 'anchor-miss'; anchor: string; sibling: string; at: readonly number[] }
  | { kind: 'mislocated'; foundAt: number[] }
  | { kind: 'absent' }

/**
 * Where a citation is anchored to an identifier, does it land on that
 * identifier?
 *
 * SATISFIED when any span of the citation's run covers any line the identifier
 * occurs at. An identifier legitimately appears at many lines — `FB-STU-10` at
 * thirty-six, `DEC-ROLE-001` at a hundred and sixty — and a citation of any of
 * them is a citation of that identifier. Accepting all of them does not make
 * the check vacuous: thirty-six accepted lines out of 122,241 still pins the
 * citation to three ten-thousandths of the document, and the check fires on
 * this tree.
 *
 * REPORTED WRONG when it lands on none of them AND the cited line carries a
 * SIBLING — an identifier of the same family, at the neighbouring row. That is
 * the exact signature of the defect class this check was written for, and it
 * is the whole of what a locator index can prove:
 *
 *     cites L31453 for FB-STU-10, and L31453 is FB-STU-09
 *     cites L32418 for AC-STU-061, and L32418 is AC-STU-062
 *     cites L27625 for TEST-DOH-04-D4, and L27625 is TEST-DOH-04-D3
 *
 * NOT REPORTED, deliberately, when it lands on none of them and the cited line
 * carries no sibling. `OBJ-039` heads a twelve-line record at L8646 and the
 * tree cites L8651 for a field inside it; `FB-STU-01` introduces a table at
 * L30858 and the tree cites its First-fallback row at L30863. Those are
 * citations INTO the record the identifier heads, and the index cannot tell
 * them from a wrong line. Calling them defects would be a false alarm; calling
 * them proven would be a lie. They are counted apart and reported as still
 * weak — see `ANCHORED_UNPROVEN` below.
 *
 * WINDOW IS NOT APPLIED HERE, and that is the point. Three lines of slack is
 * right for a quotation aimed at the heading above its sentence; it is wrong
 * for an identifier, whose line is a fact the index states exactly. Every
 * single off-by-one and off-by-two in this tree — nine of them — sits inside a
 * window of three, and a window would have passed every one.
 */
function anchorVerdict(citation: Citation, identifiers: IdentifierIndex): Verdict | null {
  const { anchor } = citation
  if (anchor === undefined) return null
  const at = identifiers.lines.get(anchor)
  if (at === undefined) return null
  const spans = citation.group ?? [[citation.start, citation.end]]
  if (at.some((line) => spans.some(([lo, hi]) => line >= lo && line <= hi))) return null
  const kin = identifiers.family.get(stemOf(anchor))
  if (kin === undefined) return null
  for (const [lo, hi] of spans) {
    for (let line = lo; line <= hi; line++) {
      for (const id of identifiers.atLine.get(line) ?? []) {
        if (id !== anchor && kin.has(id)) return { kind: 'anchor-miss', anchor, sibling: id, at }
      }
    }
  }
  return null
}

/**
 * `source` is the normalised frozen source, one entry per line. Indexing it
 * once and reusing it is the whole reason this gate reads an 18MB file once
 * rather than once per citation.
 */
export function checkCitation(
  citation: Citation,
  source: readonly string[],
  raw: readonly string[] = source,
  identifiers: IdentifierIndex = IDENTIFIERS,
): Verdict | null {
  const { start, end, quote } = citation
  if (start < 1 || end > source.length) return { kind: 'out-of-range' }
  if (end < start) return { kind: 'reversed-range' }
  // Blankness is judged on the RAW line, never the normalised one. Normalising
  // strips markdown, so a fenced-code delimiter normalises to the empty string
  // and a citation of one would be reported as citing nothing -- which it is
  // not: closing a diagram block is a real position in the document.
  if (raw.slice(start - 1, end).every((line) => line.trim() === '')) return { kind: 'blank-line' }
  // BEFORE the quotation check, where a citation makes both claims. The
  // quotation is a claim about the WORDS and the anchor a claim about the
  // LINE; this file grades lines, and "L31453 is FB-STU-09, not FB-STU-10" is
  // the sentence that tells the reader what to change.
  const anchored = anchorVerdict(citation, identifiers)
  if (anchored !== null) return anchored
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
  (v.kind === 'anchor-miss'
    ? ` for ${v.anchor}, but that line is ${v.sibling} — ${v.anchor} is at ${v.at
        .slice(0, 6)
        .join(', ')}${v.at.length > 6 ? ' …' : ''}`
    : '') +
  (c.quote === undefined ? '' : ` — "${c.quote.slice(0, 90)}"`)

/* ── extraction coinage ────────────────────────────────────────────────── */

/**
 * A DIFFERENT DEFECT FROM ANY ABOVE, AND INVISIBLE TO ALL OF THEM.
 *
 * `registries/raw/extract/CHK-*.json` is slice 1's semantic extraction: an
 * entry per module, workflow, decision, control and fallback, each with the
 * frozen-source `line` it was read from, and each with fields — `name`,
 * `purpose`, `trigger`, `primary_actor`, `effect`, `question` — that the
 * EXTRACTOR wrote. Those are summaries. They are not the document's prose.
 *
 * The defect is a build that prints one of those strings in quotation marks
 * beside a citation, so the extractor's summary reads as the source's own
 * words. It defeats every check above at once: the line is right, the citation
 * is honest, and nothing in the sentence is false — only the quotation marks
 * are, and quotation marks are the whole of what a reader trusts.
 *
 * WHY THE QUOTATION CHECK CANNOT SEE IT. `MIN_QUOTE`, `CONNECTIVE` and
 * `MAX_GAP` bind a quotation to a citation only when they are ADJACENT, and
 * every instance of this in the tree puts a VERB between them —
 * `(<line>) asks "…"`, `(<line>) agrees — "…"`, `<line> describes … as "…"`,
 * `effect "…"`. Unbound, they were never graded. The extraction supplies the
 * missing link: it already knows which line those words belong to, so no
 * adjacency rule is needed to attach them.
 *
 * WHAT IS ASSERTED, AND WHAT IS ONLY SWEPT. Gated here: a quotation whose
 * words appear NOWHERE in the frozen source and DO appear in the extraction.
 * That is absolute — an 18MB document either contains a sentence or it does
 * not — so it needs no line arithmetic and can raise no false alarm about
 * which line is meant. NOT gated: a quotation that reproduces an extraction
 * string whose words DO appear in the source at some other line. That is an
 * ordinary mislocated quotation, it is the business of the check above, and it
 * escapes only through the same adjacency gap; widening the binding rules is
 * the fix, not a second checker with a different opinion. One such is recorded
 * in this task's report rather than silently gated.
 *
 * THE ONE EXEMPTION, AND IT IS STRUCTURAL RATHER THAN A KEYWORD. Three places
 * in this tree quote extraction prose ON PURPOSE and say so: the coined
 * eleven-item vocabulary name in `sa/critical-actions.ts`, the leak markers in
 * `slice-2c-gates.test.ts` (whose entire job is to assert extraction prose
 * never reaches `out/`), and the cross-chunk duplicate quoted in
 * `build-registries.mjs`. None of the three writes a frozen-source citation
 * beside the quotation, and all six real defects do. So the finding requires a
 * citation WITHIN THE SAME STATEMENT — `COINAGE_NEAR` characters, never across
 * a `BARRIER`. Proximity is deliberately weaker than the adjacency used to
 * bind a quotation to a line, and it is doing a weaker job: the extraction has
 * already supplied the line, and all this establishes is that the passage is
 * offering the words as the source's.
 */
const EXTRACT_DIR = join(process.cwd(), 'registries', 'raw', 'extract')

/** How far a citation may sit from a quotation for it to be offered as source. */
const COINAGE_NEAR = 120

/**
 * The sentence a quotation sits in, bounded by a full stop or a `BARRIER`.
 * Not the comment: a long doc comment that mentions the extraction once would
 * otherwise excuse every quotation in it.
 */
const sentenceBreak = (): RegExp => /[.;](?=\s)|\u0000/g
const sentenceStart = (buffer: string, at: number): number => {
  let start = 0
  for (const m of buffer.slice(0, at).matchAll(sentenceBreak())) start = m.index + m[0].length
  return start
}
const sentenceEnd = (buffer: string, from: number): number => {
  const scan = sentenceBreak()
  scan.lastIndex = from
  const m = scan.exec(buffer)
  return m === null ? buffer.length : m.index
}

/**
 * A sentence that names the extraction as the author of the words it quotes.
 * Every inflected form the tree uses is here, and each is asserted below —
 * a checker whose regex misses the inflection of the word it targets is a
 * defect this branch shipped twice already.
 */
const ATTRIBUTED = /\b(?:extract(?:s|ed|ing|ion|or|ions|ors)?|coin(?:s|ed|ing|age)?|CHK-\d)/i

export interface Coinage {
  readonly file: string
  readonly quote: string
  /** Which chunk, entry and field the words came from, for the failure text. */
  readonly from: string
}

/** Every string an extraction entry printed beside its own `line`. */
export function buildCoinage(chunks: readonly { name: string; body: unknown }[]): Map<string, string> {
  const coined = new Map<string, string>()
  const visit = (node: unknown, chunk: string): void => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, chunk)
      return
    }
    if (node === null || typeof node !== 'object') return
    const entry = node as Record<string, unknown>
    if (typeof entry.line === 'number') {
      for (const [field, value] of Object.entries(entry)) {
        // `id` is a label, never prose, and every identifier in the vocabulary
        // would otherwise read as an extraction string.
        if (field === 'id' || typeof value !== 'string') continue
        const words = normalise(value)
        if (words.length < MIN_QUOTE || coined.has(words)) continue
        coined.set(words, `${chunk} ${String(entry.id ?? 'unnumbered')}.${field} L${entry.line}`)
      }
    }
    for (const value of Object.values(entry)) visit(value, chunk)
  }
  for (const chunk of chunks) visit(chunk.body, chunk.name)
  return coined
}

export function coinageIn(
  file: string,
  text: string,
  coined: ReadonlyMap<string, string>,
  source: readonly string[],
): Coinage[] {
  const cites = citationsIn(file, text)
  const { buffer } = flatten(text)
  const found: Coinage[] = []
  for (const match of buffer.matchAll(QUOTED)) {
    const inner = match[1]
    if (inner === undefined) continue
    const words = normalise(inner)
    const from = coined.get(words)
    if (from === undefined) continue
    if (source.some((line) => line.includes(words))) continue
    const opens = match.index
    const closes = opens + match[0].length
    // Offered as the source's words: a citation in the same statement. A
    // BARRIER between them means they are not one statement -- the leak-marker
    // array in `slice-2c-gates.test.ts` is one quotation per line.
    const offered = cites.some((c) => {
      const ends = c.offset + c.token.length
      const gap = c.offset < opens ? buffer.slice(ends, opens) : buffer.slice(closes, c.offset)
      return gap.length <= COINAGE_NEAR && !gap.includes(BARRIER)
    })
    if (!offered) continue
    // Attributed to the extraction in the same breath, which is the honest
    // form and must not be reported. `TiersScreen.tsx` writes "The build's
    // extraction labels that same screen <quote> ... that is the extraction's
    // own name, not a second name the source gives the screen" -- and a
    // citation of the storyboard line sits fifty-five characters earlier in
    // the same sentence, so proximity alone convicts it wrongly.
    //
    // The window is the SENTENCE, not the comment: a twenty-line doc comment
    // that mentions the extraction once would otherwise excuse every quotation
    // in it. `ATTRIBUTED` is exercised against each inflected form below,
    // because a checker's regex that silently fails to match the word it names
    // is a defect this branch has already shipped twice.
    const sentence = buffer.slice(sentenceStart(buffer, opens), sentenceEnd(buffer, closes))
    if (ATTRIBUTED.test(sentence)) continue
    found.push({ file, quote: words, from })
  }
  return found
}

/* ── the run ───────────────────────────────────────────────────────────── */

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

/* ── how much of this tree is actually checked, and how ────────────────── */

/**
 * THE THREE BUCKETS, KEPT APART AND NAMED HONESTLY. The value of this file has
 * always been that it does not claim more than it proves, and adding a second
 * strong check is exactly the moment that would slip.
 *
 * STRONG BY QUOTATION — a verbatim claim, checked against the words.
 * STRONG BY ANCHOR    — the citation is next to an identifier, and it lands on
 *                       a line that identifier really occurs at, or on a line
 *                       proven to be the wrong one.
 * ANCHORED, UNPROVEN  — next to an identifier, off its lines, and the cited
 *                       line carries no sibling to convict it. A citation into
 *                       the record an identifier heads looks exactly like this
 *                       and so does a wrong line. Still weak. Counted anyway,
 *                       because a check that quietly reclassified these as
 *                       strong would be the lie this file exists to prevent.
 * WEAK                — a bare line number with nothing to check it against.
 */
const chunkFiles = existsSync(EXTRACT_DIR)
  ? readdirSync(EXTRACT_DIR)
      .filter((f) => /^CHK-\d+\.json$/.test(f))
      .sort()
  : []
const COINED = buildCoinage(
  chunkFiles.map((name) => ({
    name,
    body: JSON.parse(readFileSync(join(EXTRACT_DIR, name), 'utf8')) as unknown,
  })),
)
const coinage = files.flatMap((file) =>
  coinageIn(file, readFileSync(file, 'utf8'), COINED, source),
)

const strongByQuote = citations.filter((c) => c.quote !== undefined)
const anchoredAll = citations.filter((c) => c.anchor !== undefined)
const anchoredUnproven = anchoredAll.filter((c) => {
  if (c.quote !== undefined) return false
  const at = IDENTIFIERS.lines.get(c.anchor as string) ?? []
  const spans = c.group ?? [[c.start, c.end]]
  if (at.some((line) => spans.some(([lo, hi]) => line >= lo && line <= hi))) return false
  return anchorVerdict(c, IDENTIFIERS) === null
})
/** Anchored, not already strong by quotation, and decided either way. */
const strongByAnchor = anchoredAll.filter(
  (c) => c.quote === undefined && !anchoredUnproven.includes(c),
)
const stronglyChecked = strongByQuote.length + strongByAnchor.length

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
    expect(strongByQuote.length).toBeGreaterThan(250)
  })

  it('reads the identifier vocabulary and finds it in the frozen source', () => {
    expect(VOCABULARY.size, `no identifier vocabulary at ${IDENTIFIER_INDEX_PATH}`).toBeGreaterThan(
      17_000,
    )
    expect(IDENTIFIERS.lines.size).toBeGreaterThan(17_000)
  })

  it('agrees with the identifier index everywhere the index speaks', () => {
    // The independent pin. The vocabulary comes from the index and the
    // positions from the frozen source; this asserts they do not contradict
    // each other, so neither file can be edited alone to move an identifier.
    //
    // It does NOT assert the reverse — the index is capped at three lines and
    // omits 14,592 real occurrences, which is why it supplies no positions.
    //
    // Tested by SUBSTRING and not by `IDENTIFIER`, on purpose: this asserts a
    // property of the index, and running it through this file's own tokeniser
    // would instead assert that the two tokenisers agree. They do not, in 133
    // places, and every one is the index recording a PREFIX of a longer token
    // — `AC-26` inside `AC-26.1-02`, `TEST-26` inside `TEST-26.1-01`,
    // `CFR-2023` inside a URL path. A prefix can anchor nothing, so it is not
    // this check's business; a line the identifier is not on at all would be.
    const contradictions: string[] = []
    let checked = 0
    for (const [id, lines] of Object.entries(rawIdentifierIndex)) {
      for (const line of lines) {
        checked++
        if (sourceRaw[line - 1]?.includes(id) !== true) {
          contradictions.push(`${id} indexed at ${line}, not there`)
        }
      }
    }
    expect(contradictions.slice(0, 20)).toEqual([])
    // Not vacuous, in both directions: every index entry is read, and this
    // file's own reading locates all but a handful of the vocabulary.
    expect(checked).toBeGreaterThan(23_000)
    expect(VOCABULARY.size - IDENTIFIERS.lines.size).toBeLessThan(200)
  })

  it('anchors an identifier to a meaningful number of citations', () => {
    // Same guard as the quotation floor, for the same reason: narrowing the
    // anchor rules until the bucket empties would turn this into the weak
    // check wearing the strong check's name.
    expect(anchoredAll.length).toBeGreaterThan(1_000)
  })

  it('reports the strong, weak and unproven split rather than averaging it', () => {
    console.error(
      `\n[locator-fidelity] ${citations.length} citations in ${new Set(citations.map((c) => c.file)).size} files` +
        `\n  strong, verbatim quotation   ${strongByQuote.length}` +
        `\n  strong, identifier anchor    ${strongByAnchor.length}` +
        `\n  anchored but unproven (weak) ${anchoredUnproven.length}` +
        `\n  weak, plausibility only      ${citations.length - stronglyChecked}`,
    )
    // The three buckets and the remainder must account for every citation.
    // Without this an edit could drop a bucket and leave the totals looking
    // healthy.
    expect(strongByQuote.length + strongByAnchor.length + anchoredUnproven.length).toBeLessThanOrEqual(
      citations.length,
    )
    expect(anchoredAll.length).toBe(strongByAnchor.length + anchoredUnproven.length + strongByQuote.filter((c) => c.anchor !== undefined).length)
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

describe('locator fidelity: strong checks — the identifier must be at the line', () => {
  it('cites no line for an identifier that is its neighbour instead', () => {
    // The class this check exists for. `FB-STU-10` is at L31454; L31453 is
    // `FB-STU-09`. Nine citations across six files carried the neighbouring
    // line, one author's off-by-one propagated by copy, and every one of them
    // passed the weak check because L31453 exists, runs forwards and is not
    // blank. There is no locator to guess here: the index states the line.
    expect(offenders('anchor-miss')).toEqual([])
  })
})

describe('locator fidelity: strong checks — the words must be the source’s own', () => {
  it('reads the extraction chunks and finds prose in them', () => {
    expect(chunkFiles.length, `no extraction chunks under ${EXTRACT_DIR}`).toBe(36)
    expect(COINED.size).toBeGreaterThan(20_000)
  })

  it('offers no extraction wording as a frozen-source quotation', () => {
    const list = coinage
      .map((c) => `${c.file} — "${c.quote.slice(0, 80)}" is ${c.from}, and is in no source line`)
      .sort()
    if (list.length > 0) {
      console.error(`\n[locator-fidelity] extraction-coinage (${list.length}):\n  ${list.join('\n  ')}`)
    }
    // The fix is never a locator. Either the source says it somewhere and the
    // sentence should quote THAT, or the sentence should stop claiming the
    // words are the source's — which is what `sa/critical-actions.ts` already
    // does, in the one place this build got it right first time.
    expect(list).toEqual([])
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

describe('locator fidelity: the identifier anchor reports planted defects', () => {
  /**
   * The real defect's shape, rebuilt: a table of ten contracts, the ninth and
   * the tenth on adjacent lines, and a record whose identifier heads a block
   * of fields several lines deep.
   */
  const fakeSource = [
    'alpha line one',
    '| `FB-ZZ-08` | eighth contract |',
    '| `FB-ZZ-09` | ninth contract |',
    '| `FB-ZZ-10` | audit write failure |',
    '',
    '**`OBJ-ZZ-01` · a record with a body**',
    '- **Fields:** title; content; the screens applying it.',
    '- **Sensitive fields:** none.',
    'a later mention of `FB-ZZ-10` in prose',
  ]
  const VOCAB = new Set(['FB-ZZ-08', 'FB-ZZ-09', 'FB-ZZ-10', 'OBJ-ZZ-01'])
  const index = buildIdentifierIndex(fakeSource, VOCAB)
  const normalised = fakeSource.map(normalise)

  const only = (text: string): Citation => {
    const found = citationsIn('probe.ts', text, VOCAB)
    expect(found.length, `expected exactly one citation in ${JSON.stringify(text)}`).toBe(1)
    return found[0] as Citation
  }
  const verdict = (text: string): Verdict | null =>
    checkCitation(only(text), normalised, fakeSource, index)
  /** The anchored citation of a RUN, which is its first — see `anchorOf`. */
  const runVerdict = (text: string): Verdict | null => {
    const found = citationsIn('probe.ts', text, VOCAB)
    expect(found.length, `expected a run in ${JSON.stringify(text)}`).toBeGreaterThan(1)
    const head = found[0] as Citation
    expect(head.anchor, 'the run must be anchored or this proves nothing').toBe('FB-ZZ-10')
    return checkCitation(head, normalised, fakeSource, index)
  }

  it('locates every occurrence of an identifier, not the first few', () => {
    // The whole reason positions come from the source rather than the shipped
    // index. If this ever returns one line, the check has been narrowed to the
    // index's cap and is blind to `FB-STU-10`.
    expect(index.lines.get('FB-ZZ-10')).toEqual([4, 9])
    expect(index.family.get('FB-ZZ-')).toEqual(new Set(['FB-ZZ-08', 'FB-ZZ-09', 'FB-ZZ-10']))
  })

  it('accepts a citation that lands on the identifier', () => {
    expect(only(`/** \`FB-ZZ-10\` (${cite(4)}) */`).anchor).toBe('FB-ZZ-10')
    expect(verdict(`/** \`FB-ZZ-10\` (${cite(4)}) */`)).toBeNull()
  })

  it('accepts a citation that lands on a LATER occurrence of the identifier', () => {
    // The multi-line case. Any occurrence satisfies it; that is what makes an
    // identifier with thirty-six lines still a checkable claim.
    expect(verdict(`/** \`FB-ZZ-10\` (${cite(9)}) */`)).toBeNull()
  })

  it('reports the off-by-one that lands on the identifier next door', () => {
    // Exactly `FB-STU-10` at L31454 cited as L31453, which is `FB-STU-09`.
    expect(verdict(`/** \`FB-ZZ-10\` (${cite(3)}) */`)).toEqual({
      kind: 'anchor-miss',
      anchor: 'FB-ZZ-10',
      sibling: 'FB-ZZ-09',
      at: [4, 9],
    })
  })

  it('reports it through a run when NO span of the run reaches the identifier', () => {
    expect(runVerdict(`/** \`FB-ZZ-10\` (${cite(2)}, ${cite(3)}) */`)).toEqual({
      kind: 'anchor-miss',
      anchor: 'FB-ZZ-10',
      sibling: 'FB-ZZ-08',
      at: [4, 9],
    })
  })

  it('accepts a run in which one span reaches the identifier', () => {
    // `SB-SA-10 (<line>, <line>)`: the code cited both, so either satisfies.
    expect(runVerdict(`/** \`FB-ZZ-10\` (${cite(3)}, ${cite(4)}) */`)).toBeNull()
  })

  it('does not report a citation into the record an identifier heads', () => {
    // `OBJ-039` at L8646 and its Executor field at L8651. The index cannot
    // tell that from a wrong line, so it must not claim to — and this is the
    // assertion that keeps the check from being a false-alarm generator.
    expect(verdict(`/** \`OBJ-ZZ-01\` (${cite(8)}) */`)).toBeNull()
  })

  it('anchors leftwards and never rightwards', () => {
    // `(<line>, AC-STU-156)` is a co-citation: one locator for the claim, one
    // identifier naming the criterion that pins it at its own, distant line.
    // Anchoring rightwards reported forty such citations as defects.
    expect(only(`/** (${cite(3)}, \`FB-ZZ-10\`) */`).anchor).toBeUndefined()
    expect(verdict(`/** (${cite(3)}, \`FB-ZZ-10\`) */`)).toBeNull()
  })

  it('takes no anchor from a positional list of identifiers', () => {
    // `SB-31-01, SB-31-02 and SB-31-05 (<line>, <line>, <line>)`.
    const found = citationsIn('probe.ts', `/** \`FB-ZZ-08\` and \`FB-ZZ-10\` (${cite(2)}) */`, VOCAB)
    expect(found.map((c) => c.anchor)).toEqual([undefined])
  })

  it('takes no anchor across a word', () => {
    expect(only(`/** \`FB-ZZ-10\` is drawn at ${cite(3)} */`).anchor).toBeUndefined()
  })

  it('takes no anchor from a token outside the vocabulary', () => {
    // `IDENTIFIER` proposes and the index disposes: a hyphenated shout in a
    // comment is not an identifier just because it is uppercase.
    expect(only(`/** \`FB-ZZ-99\` (${cite(3)}) */`).anchor).toBeUndefined()
  })

  it('reads an identifier written last in its sentence', () => {
    // The trailing-dot bug: `[A-Z0-9.]+` swallowed the full stop and the token
    // then matched no vocabulary entry, so an identifier at the end of a
    // sentence silently anchored nothing.
    const withStop = buildIdentifierIndex(['a mention of FB-ZZ-10.'], VOCAB)
    expect(withStop.lines.get('FB-ZZ-10')).toEqual([1])
  })
})

describe('locator fidelity: the coinage checker reports planted defects', () => {
  const COINED_WORDS = 'admin drafts the grant and the root approves and issues it'
  const SOURCE_WORDS = 'a grant is drafted specifying scope by named modules'
  const chunks = [
    {
      name: 'CHK-000.json',
      body: {
        workflows: [
          { id: 'WF-ZZ-01', primary_actor: COINED_WORDS, name: SOURCE_WORDS, line: 3 },
        ],
        // No `line`, so nothing here is an extraction claim about a line.
        notes: [{ id: 'N1', text: 'a note the extractor wrote with no line at all' }],
      },
    },
  ]
  const coined = buildCoinage(chunks)
  const fakeSource = ['alpha', 'beta', `1. ${SOURCE_WORDS}. 2. It is approved.`].map(normalise)
  const found = (text: string): string[] =>
    coinageIn('probe.ts', text, coined, fakeSource).map((c) => c.quote)

  it('collects extraction prose but never an extraction id', () => {
    expect(coined.has(normalise(COINED_WORDS))).toBe(true)
    expect(coined.get(normalise(COINED_WORDS))).toBe('CHK-000.json WF-ZZ-01.primary_actor L3')
    expect(coined.has('wf-zz-01')).toBe(false)
    // An entry with no `line` printed nothing beside a line, so it is not this
    // checker's business however extraction-flavoured its prose is.
    expect(coined.has(normalise('a note the extractor wrote with no line at all'))).toBe(false)
  })

  it('reports extraction wording offered as a frozen-source quotation', () => {
    expect(found(`/** Workflow 23.16 (${cite(3)}) agrees — "${COINED_WORDS}". */`)).toEqual([
      normalise(COINED_WORDS),
    ])
  })

  it('reports it across the verb the quotation check cannot bind through', () => {
    // The whole reason this checker exists: `asks "…"` is not adjacency, so
    // the quotation never reached the strong check at all.
    expect(found(`/** DEC-ZZ-001 (${cite(3)}) asks "${COINED_WORDS}" and stays open. */`)).toEqual([
      normalise(COINED_WORDS),
    ])
  })

  it('accepts a quotation the frozen source really carries', () => {
    expect(found(`/** (${cite(3)}) — "${SOURCE_WORDS}" */`)).toEqual([])
  })

  it('accepts extraction wording with no citation offering it as source', () => {
    // `slice-2c-gates.test.ts` holds a list of extraction prose whose job is to
    // assert that prose never reaches `out/`. Quoting it is the point.
    expect(found(`const markers = [\n  "${COINED_WORDS}",\n]\n`)).toEqual([])
  })

  it('accepts extraction wording attributed in the same sentence', () => {
    expect(
      found(`/** (${cite(3)}) — the extraction coins "${COINED_WORDS}" and the source does not. */`),
    ).toEqual([])
  })

  it('reports it when the attribution is a DIFFERENT sentence of the same comment', () => {
    // The scope that makes the exemption safe. A twenty-line doc comment that
    // says "extraction" once must not excuse every quotation below it.
    expect(
      found(
        `/**\n * This module reads the extraction.\n * Workflow 23.16 (${cite(3)}) agrees — "${COINED_WORDS}".\n */`,
      ),
    ).toEqual([normalise(COINED_WORDS)])
  })

  it('recognises every inflection of the words the exemption names', () => {
    // Two assertions on this branch were regexes that did not match the
    // inflected form of the word they targeted. This is that check, written
    // out rather than assumed.
    for (const word of [
      'extract',
      'extracts',
      'extracted',
      'extracting',
      'extraction',
      'extractions',
      'extractor',
      'extractors',
      'coin',
      'coins',
      'coined',
      'coining',
      'coinage',
      'CHK-014',
      'Extraction',
    ]) {
      expect(ATTRIBUTED.test(`the ${word} says so`), word).toBe(true)
    }
    for (const word of ['extra', 'coil', 'chunk', 'CHK', 'source', 'blueprint']) {
      expect(ATTRIBUTED.test(`the ${word} says so`), word).toBe(false)
    }
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
