/**
 * Distil the knowledge graph into a small, committed index of where each
 * blueprint identifier actually lives.
 *
 * ── WHY AN INDEX AND NOT THE GRAPH ─────────────────────────────────────────
 * `graphify-out/graph.json` is ~10MB, is git-ignored, and is rebuilt from an
 * extraction that costs real time. A gate that reads it would be red on any
 * clean checkout, which turns a check into an obstacle and gets it deleted.
 *
 * This writes the part a gate needs -- identifier to verified line numbers --
 * as a file small enough to commit and stable enough to review. The graph stays
 * a local tool; the evidence it produces becomes a build artefact.
 *
 * ── WHY EVERY LINE IS RE-CHECKED HERE ──────────────────────────────────────
 * The graph's line numbers arrive through two hands: an extracting agent that
 * reported a line within a slice, and a mapper that converted it. Both are
 * checked already, but neither checked THE CLAIM -- that the line actually
 * carries the identifier. So this opens the frozen source and looks.
 *
 * An identifier whose line does not mention it is not written. This build has
 * been bitten repeatedly by a citation that pointed at a real line saying
 * something else, and an index of those would be worse than no index: it would
 * lend a wrong locator the authority of a generated artefact.
 *
 * Usage:  node scripts/build-locator-index.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const GRAPH = join(ROOT, 'graphify-out', 'graph.json')
/*
 * `--out` exists so the automatic updater can rebuild this index to a scratch
 * path and COMPARE it, rather than overwrite the committed one. The committed
 * file is the subject of a release gate; a hook that rewrites it silently would
 * mean the gate's subject changes without anyone deciding it should.
 */
const outFlag = process.argv.indexOf('--out')
const OUT =
  outFlag === -1
    ? join(ROOT, 'registries', 'blueprint-locators.json')
    : resolve(process.argv[outFlag + 1] ?? '')

const EXPECTED_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'

if (!existsSync(GRAPH)) {
  throw new Error(
    `No graph at ${GRAPH}. Build it first — this script distils the graph, it does not replace it.`,
  )
}

const raw = readFileSync(SOURCE)
const sha = createHash('sha256').update(raw).digest('hex')
if (sha !== EXPECTED_SHA) {
  throw new Error(`Frozen source changed (${sha}). Refusing to index against a different document.`)
}
const lines = raw.toString('utf8').split('\n')

/*
 * `split('\n')` on a file that ends in a newline yields a trailing empty
 * element, so `lines.length` was 122,242 against a document of 122,241 lines
 * (`wc -l` agrees at 122,241). This file's whole job is to be the artefact a
 * verifier trusts about the frozen source, and it was off by one about the
 * simplest fact it publishes — audit C-32. Counted here rather than corrected
 * at the call site, so nothing downstream can pick up the raw length again.
 */
const SOURCE_LINE_COUNT = lines.length - (lines[lines.length - 1] === '' ? 1 : 0)

/*
 * Prefixes from `registries/blueprint-prefixes.json`, derived from Appendix A,
 * the blueprint's own allocation authority. Four tools each carried a
 * hand-written copy of this list and all four were missing the same nine
 * registered families -- 1,282 distinct identifiers that nothing was looking
 * for. Nothing failed; the numbers were just quietly too kind.
 *
 * Longest-first so `SCHED` cannot claim `SCHEDRUN-001`.
 */
const PREFIXES = JSON.parse(readFileSync(join(ROOT, 'registries', 'blueprint-prefixes.json'), 'utf8'))
const ALT = [...PREFIXES.registered, ...PREFIXES.unregisteredButPresent.prefixes]
  .sort((a, b) => b.length - a.length)
  .join('|')
const IDENT = new RegExp(
  `${PREFIXES.matching.leadingGuard}((?:${ALT})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9])${PREFIXES.matching.trailing}`,
)

const graph = JSON.parse(readFileSync(GRAPH, 'utf8'))

/*
 * ── THE DIVISION OF LABOUR, AND WHY IT CHANGED ─────────────────────────────
 *
 * The first version of this index took both halves from the graph: which
 * identifiers exist, AND where they are. That gave each identifier exactly one
 * line -- whichever line the extracting agent happened to be looking at -- and
 * a citation naming any OTHER real occurrence of the same identifier could not
 * be corroborated. `DEC-LANEB-001` is raised in one chapter and registered in
 * another; the index knew one of those and shrugged at the other.
 *
 * The two halves come from different places now, each from the source that
 * actually knows:
 *
 *   WHICH identifiers matter  <- the graph. It read the document and decided
 *                                what is an entity rather than a passing
 *                                mention. A regex cannot make that judgement.
 *   WHERE each one appears    <- the frozen blueprint, scanned directly. Every
 *                                occurrence, not a sample. Deterministic, free,
 *                                and correct by construction: a line is listed
 *                                because the identifier was found ON it.
 *
 * The self-verification that used to be the point of this script is now
 * structural. There is no step that could produce a locator whose line does not
 * carry its identifier, because the line number IS the result of finding the
 * identifier there. The gate still re-checks independently -- a property you
 * believe you have proved by construction is exactly the sort worth testing.
 */
const wanted = new Set()
let considered = 0
for (const node of graph.nodes ?? []) {
  const m = IDENT.exec(String(node.label ?? ''))
  if (m === null) continue
  considered += 1
  wanted.add(m[1])
}

const SCAN = new RegExp(IDENT.source, 'g')
const index = {}
let locators = 0
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i]
  if (line === undefined || line.indexOf('-') === -1) continue
  SCAN.lastIndex = 0
  let m
  const onThisLine = new Set()
  while ((m = SCAN.exec(line)) !== null) onThisLine.add(m[1])
  for (const ident of onThisLine) {
    if (!wanted.has(ident)) continue
    ;(index[ident] ??= []).push(i + 1)
    locators += 1
  }
}

const found = Object.keys(index).length
const sorted = {}
for (const k of Object.keys(index).sort()) sorted[k] = index[k]

writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: { sha256: EXPECTED_SHA, lines: SOURCE_LINE_COUNT },
      note:
        'Identifier -> EVERY blueprint line carrying it. The set of identifiers comes from the ' +
        'knowledge graph, which read the document and judged what is an entity rather than a ' +
        'passing mention; the line numbers come from scanning the frozen source directly, so a ' +
        'line is listed only because the identifier was found on it. ' +
        'NOT EXHAUSTIVE OVER IDENTIFIERS, AND THAT IS THE HALF A VERIFIER GETS WRONG. The LINES ' +
        'for an identifier that IS here are every one of them. The SET OF IDENTIFIERS is the ' +
        'graph\'s judgement, and the graph missed some. Measured this session: of the distinct ' +
        'identifier-shaped tokens under src/ and app/ that also occur in the frozen source, 210 ' +
        'have no key here at all; narrowing to src/ai/ alone, 11 do. The whole PROV-* family is ' +
        'among them — all six provenance classes — although PROV-4 occurs at L89439, in the ' +
        'sentence carrying this build\'s absolute rule. So "not in this index" means "the graph ' +
        'did not name it as an entity", NEVER "not in the source". A verifier who reads absence ' +
        'here as disproof of a citation will be wrong; open the frozen source and grep it.',
      // Zero, and that is the point: a locator is the line the identifier was
      // found on. No window is needed to make it true.
      windowLines: 0,
      identifiers: found,
      locators,
      index: sorted,
    },
    null,
    1,
  ) + '\n',
)

console.log(`Wrote ${found} identifiers, ${locators} locators (every occurrence, not a sample)`)
console.log(`  identifier-bearing graph nodes considered: ${considered}`)
console.log(`  identifiers the graph named but the source does not carry: ${wanted.size - found}`)
