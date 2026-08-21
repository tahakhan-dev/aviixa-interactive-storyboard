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
const OUT = join(ROOT, 'registries', 'blueprint-locators.json')

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

const byIdentifier = new Map()
let considered = 0
let rejected = 0
for (const node of graph.nodes ?? []) {
  const line = node.blueprint_line
  if (typeof line !== 'number') continue
  const m = IDENT.exec(String(node.label ?? ''))
  if (m === null) continue
  const ident = m[1]
  considered += 1

  // THE CHECK. A permission-matrix row is labelled with its module id while the
  // id itself sits in the table heading above, so a window is used rather than
  // the single line -- but the window is small and its size is stated, not
  // quietly widened until everything passes.
  const from = Math.max(0, line - 12)
  const window = lines.slice(from, line + 2).join('\n')
  if (!window.includes(ident)) {
    rejected += 1
    continue
  }
  if (!byIdentifier.has(ident)) byIdentifier.set(ident, new Set())
  byIdentifier.get(ident).add(line)
}

const index = {}
for (const [ident, set] of [...byIdentifier].sort(([a], [b]) => (a < b ? -1 : 1))) {
  index[ident] = [...set].sort((a, b) => a - b)
}

writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: { sha256: EXPECTED_SHA, lines: lines.length },
      note:
        'Identifier -> blueprint lines, distilled from the knowledge graph and RE-VERIFIED ' +
        'against the frozen source. A line that does not carry its identifier is not listed.',
      windowLines: 14,
      identifiers: Object.keys(index).length,
      locators: Object.values(index).reduce((n, a) => n + a.length, 0),
      index,
    },
    null,
    1,
  ) + '\n',
)

console.log(`Wrote ${Object.keys(index).length} identifiers, ${Object.values(index).reduce((n, a) => n + a.length, 0)} verified locators`)
console.log(`  considered: ${considered}   rejected (line does not carry the identifier): ${rejected}`)
