/**
 * Slice the frozen blueprint into extractable files WITHOUT modifying it.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * The blueprint is 18,565,031 bytes over 122,241 lines. A knowledge-graph
 * extractor chunks by FILE, so a single file that size cannot be extracted at
 * all -- one file is one chunk is one agent, and the largest chapter alone is
 * ~220K tokens. Slicing is not an optimisation here; it is the difference
 * between the document being ingestible and not.
 *
 * ── THE PROPERTY EVERYTHING ELSE DEPENDS ON ────────────────────────────────
 * This build's entire evidence model is `L<number>` citations into the frozen
 * source. A graph whose nodes cannot be resolved back to a real blueprint line
 * is worth nothing here -- worse than nothing, because it would look like
 * evidence. So the slicer's first duty is not splitting, it is preserving the
 * line mapping, and it REFUSES rather than emit a mapping it cannot prove.
 *
 * For a slice beginning at original line S, slice line k maps to S + k - 1.
 * That holds only because three things were measured, and are re-measured here
 * on every run rather than trusted:
 *
 *   1. the file is pure LF (zero CR), so no line-ending translation shifts it
 *   2. code-fence parity is even within every chapter, so no split lands
 *      inside a fenced block
 *   3. no heading line occurs INSIDE a fence, so the split points are real
 *      headings and not code samples that look like them
 *
 * ── WHY LINES ARE BLANKED AND NEVER DELETED ────────────────────────────────
 * Two things are excluded from extraction: a 1,068-occurrence authoring
 * boilerplate (742.9KB, 4.1% of the file, each copy enumerating ~40 domain
 * nouns -- roughly 40,000 spurious entity mentions if extracted), and the
 * table of contents, which is 752 bullets restating headings that already
 * exist elsewhere.
 *
 * Both are removed by replacing the line with an EMPTY line, never by deleting
 * it. Deleting would shift every subsequent line and silently break the
 * mapping for the rest of the document -- the failure would be invisible,
 * plausible, and wrong, which is the worst combination this build knows.
 *
 * ── WHAT IS NOT SLICED ─────────────────────────────────────────────────────
 * Chapter 54 (Bidirectional Traceability) and chapter 5 (Source Coverage Map)
 * are identifier-to-identifier matrices -- the author's own hand-curated edge
 * list. They are marked `tableParse: true` in the manifest so a deterministic
 * parser can read them instead of an LLM: exact edges, zero tokens, and no
 * hallucination risk. That is better data, not merely cheaper data.
 *
 * Usage:  node scripts/slice-blueprint.mjs [--out DIR] [--max-bytes N]
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')

/** The frozen source's identity. Re-verified every run; a mismatch refuses. */
const EXPECTED = {
  sha256: '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27',
  bytes: 18_565_031,
  lines: 122_241,
}

const argv = process.argv.slice(2)
const argOf = (flag, fallback) => {
  const i = argv.indexOf(flag)
  return i === -1 ? fallback : argv[i + 1]
}
const OUT_DIR = resolve(argOf('--out', join(ROOT, '..', 'blueprint-slices')))
/** Split any unit larger than this. Chosen so no slice exceeds one agent's
 *  comfortable reading budget; ~4 bytes per token puts 120KB near 30K tokens. */
const MAX_BYTES = Number(argOf('--max-bytes', '120000'))

/** The authoring boilerplate. One line, 1,068 times, never content. */
const BOILERPLATE = /Section Completeness Instruction/
/** The table of contents: heading at 33, last bullet at 788, rule at 790. */
const TOC_FIRST = 33
const TOC_LAST = 790
/** Chapters whose bodies are identifier matrices, better parsed than read. */
const TABLE_PARSE_CHAPTERS = new Set(['5', '54'])

// ── 1. Verify the source before reading a single line of it ────────────────
const raw = readFileSync(SOURCE)
const sha = createHash('sha256').update(raw).digest('hex')
if (sha !== EXPECTED.sha256 || raw.length !== EXPECTED.bytes) {
  throw new Error(
    `The frozen source has changed.\n` +
      `  expected ${EXPECTED.sha256} / ${EXPECTED.bytes} bytes\n` +
      `  found    ${sha} / ${raw.length} bytes\n` +
      `Refusing to slice: every citation in this build is a line number into ` +
      `the document that hash names, and slicing a different one would produce ` +
      `a mapping that is confidently wrong.`,
  )
}
if (raw.includes('\r')) {
  throw new Error('Source contains CR. The line mapping assumes pure LF; refusing.')
}

const text = raw.toString('utf8')
const lines = text.split('\n')
// A trailing newline yields a final empty element; drop it so indices are lines.
if (lines[lines.length - 1] === '') lines.pop()
if (lines.length !== EXPECTED.lines) {
  throw new Error(`Expected ${EXPECTED.lines} lines, read ${lines.length}. Refusing.`)
}

// ── 2. Re-measure the three properties the mapping depends on ──────────────
// Not trusted from a prior measurement: a slicer that assumes them and is wrong
// produces citations that point confidently at the wrong line.
let fenceOpen = false
const headingLines = []
const fenceStateAt = new Array(lines.length)
for (let i = 0; i < lines.length; i += 1) {
  fenceStateAt[i] = fenceOpen
  if (/^\s*```/.test(lines[i])) fenceOpen = !fenceOpen
  else if (/^#{1,3} /.test(lines[i]) && !fenceOpen) headingLines.push(i)
}
if (fenceOpen) throw new Error('Unbalanced code fence across the document. Refusing.')
const headingsInFence = lines.reduce(
  (n, l, i) => n + (/^#{1,3} /.test(l) && fenceStateAt[i] ? 1 : 0),
  0,
)
if (headingsInFence > 0) {
  throw new Error(
    `${headingsInFence} heading-shaped lines sit inside code fences. A regex split ` +
      `would cut inside a code sample; refusing.`,
  )
}

// ── 3. Blank the excluded lines. Blank, never delete. ──────────────────────
const working = lines.slice()
let blankedBoilerplate = 0
let blankedToc = 0
for (let i = 0; i < working.length; i += 1) {
  const lineNo = i + 1
  if (BOILERPLATE.test(working[i])) {
    working[i] = ''
    blankedBoilerplate += 1
  } else if (lineNo >= TOC_FIRST && lineNo <= TOC_LAST) {
    working[i] = ''
    blankedToc += 1
  }
}
if (working.length !== lines.length) {
  throw new Error('Blanking changed the line count. That is impossible; refusing.')
}

// ── 4. Split into units: chapter, then section, then subsection ────────────
const bytesOf = (from, to) => Buffer.byteLength(working.slice(from - 1, to).join('\n') + '\n')

/** Heading line numbers (1-based) at a given depth, within [from, to]. */
const headingsAt = (depth, from, to) => {
  const re = new RegExp(`^#{${depth}} `)
  const out = []
  for (const idx of headingLines) {
    const lineNo = idx + 1
    if (lineNo >= from && lineNo <= to && re.test(lines[idx])) out.push(lineNo)
  }
  return out
}

/** Split [from,to] at the given depth. Ends are CLAMPED to `to` -- the last
 *  section's "next heading minus one" would otherwise run into the next
 *  chapter, which is exactly the off-by-one this build keeps meeting. */
const splitAt = (depth, from, to) => {
  const heads = headingsAt(depth, from, to)
  if (heads.length === 0) return null
  const units = []
  // Anything before the first sub-heading stays with the parent as a preamble.
  if (heads[0] > from) units.push({ from, to: heads[0] - 1 })
  for (let i = 0; i < heads.length; i += 1) {
    const start = heads[i]
    const end = i + 1 < heads.length ? heads[i + 1] - 1 : to
    units.push({ from: start, to: Math.min(end, to) })
  }
  return units
}

const chapterHeads = headingsAt(1, 1, lines.length)
const chapters = []
if (chapterHeads[0] > 1) chapters.push({ from: 1, to: chapterHeads[0] - 1, title: 'Front matter' })
for (let i = 0; i < chapterHeads.length; i += 1) {
  const from = chapterHeads[i]
  const to = i + 1 < chapterHeads.length ? chapterHeads[i + 1] - 1 : lines.length
  chapters.push({ from, to, title: lines[from - 1].replace(/^#\s*/, '').trim() })
}

const slices = []
for (const ch of chapters) {
  const num = (ch.title.match(/^(\d+[A-Z]?)\./) ?? [])[1] ?? null
  const tableParse = num !== null && TABLE_PARSE_CHAPTERS.has(num)
  const push = (u, title) =>
    slices.push({ ...u, chapter: num, chapterTitle: ch.title, title, tableParse })

  if (bytesOf(ch.from, ch.to) <= MAX_BYTES || tableParse) {
    push({ from: ch.from, to: ch.to }, ch.title)
    continue
  }
  for (const sec of splitAt(2, ch.from, ch.to) ?? [{ from: ch.from, to: ch.to }]) {
    const secTitle = lines[sec.from - 1].replace(/^#+\s*/, '').trim() || ch.title
    if (bytesOf(sec.from, sec.to) <= MAX_BYTES) {
      push(sec, secTitle)
      continue
    }
    for (const sub of splitAt(3, sec.from, sec.to) ?? [sec]) {
      push(sub, lines[sub.from - 1].replace(/^#+\s*/, '').trim() || secTitle)
    }
  }
}

// ── 5. Prove no line was lost or duplicated before writing anything ────────
const covered = new Array(lines.length).fill(0)
for (const s of slices) for (let i = s.from; i <= s.to; i += 1) covered[i - 1] += 1
const missing = covered.filter((n) => n === 0).length
const duplicated = covered.filter((n) => n > 1).length
if (missing > 0 || duplicated > 0) {
  throw new Error(
    `Slice coverage is not a partition: ${missing} lines in no slice, ` +
      `${duplicated} lines in more than one. Refusing to write a manifest that lies.`,
  )
}

// ── 6. Write ───────────────────────────────────────────────────────────────
if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true })
mkdirSync(OUT_DIR, { recursive: true })

const slug = (t) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'section'

const manifest = []
for (const s of slices) {
  // ONE DIRECTORY PER CHAPTER, because the extractor's corpus check refuses a
  // corpus this size and asks which subfolder to run on. Chapters are the unit
  // the build already thinks in -- a slice needs chapter 22, not "files 300 to
  // 400" -- so this makes phased extraction the natural path rather than a
  // workaround, and lets a later `--update` re-extract one chapter alone.
  const dir = `ch-${s.chapter ?? '00-front-matter'}`
  mkdirSync(join(OUT_DIR, dir), { recursive: true })
  // Keyed on LINE NUMBERS, never on the heading text: headings repeat across
  // chapters ("Why this chapter exists" recurs), so titles would collide and
  // one slice would silently overwrite another.
  const name = `${dir}/${String(s.from).padStart(6, '0')}-${String(s.to).padStart(6, '0')}--${slug(s.title)}.md`
  const body = working.slice(s.from - 1, s.to).join('\n') + '\n'
  writeFileSync(join(OUT_DIR, name), body)
  manifest.push({
    file: name,
    startLine: s.from,
    endLine: s.to,
    lines: s.to - s.from + 1,
    bytes: Buffer.byteLength(body),
    chapter: s.chapter,
    chapterTitle: s.chapterTitle,
    title: s.title,
    tableParse: s.tableParse,
  })
}

writeFileSync(
  join(OUT_DIR, 'slices.json'),
  JSON.stringify(
    {
      source: { path: SOURCE, ...EXPECTED },
      rule: 'original line = startLine + (slice line - 1)',
      excluded: {
        boilerplateLinesBlanked: blankedBoilerplate,
        tocLinesBlanked: blankedToc,
        note: 'Blanked, never deleted, so the line mapping is unchanged.',
      },
      maxBytes: MAX_BYTES,
      slices: manifest,
    },
    null,
    2,
  ) + '\n',
)

const big = manifest.filter((m) => m.bytes > MAX_BYTES && !m.tableParse)
console.log(`Sliced into ${manifest.length} files under ${OUT_DIR}`)
console.log(`  blanked: ${blankedBoilerplate} boilerplate lines, ${blankedToc} contents lines`)
console.log(`  table-parse (not for extraction): ${manifest.filter((m) => m.tableParse).length}`)
console.log(`  over ${MAX_BYTES} bytes after splitting: ${big.length}`)
for (const m of big.slice(0, 8)) console.log(`    ${m.file} ${(m.bytes / 1024).toFixed(1)}KB`)
console.log(`  line coverage: exact partition of all ${lines.length} lines`)
