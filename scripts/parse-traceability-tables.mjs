/**
 * Parse the blueprint's own traceability matrices into graph edges, deterministically.
 *
 * ── WHY THIS IS BETTER DATA THAN AN LLM PASS, NOT MERELY CHEAPER ───────────
 * Chapter 54 (Bidirectional Traceability) and chapter 5 (Source Coverage Map)
 * are not prose that happens to mention identifiers. They are fourteen
 * identifier-to-identifier matrices: the AUTHOR'S OWN hand-curated edge list,
 * already in the exact shape a graph wants.
 *
 * Handing those to a language model would be asking it to re-derive, with some
 * error rate, a relation the document states outright. The error rate is not
 * hypothetical here -- this build has three separate defect classes traceable
 * to a derived layer being mistaken for the source. A table cell is not a
 * judgement call, so nothing here makes one.
 *
 * ── WHAT AN EDGE MEANS, AND WHY THE COLUMN HEADER IS KEPT ──────────────────
 * A row relates its key identifier to every identifier in its other cells, and
 * the RELATION is the column header -- "Test that proves it", "Decision that
 * governs it", "Fallback". Dropping the header would flatten fourteen distinct
 * relations into one `related_to`, which is the kind of averaging that makes a
 * graph look connected while answering every question with a shrug.
 *
 * Every edge is tagged EXTRACTED and carries the blueprint line of its row, so
 * a query result resolves to a line a reader can open.
 *
 * Usage:  node scripts/parse-traceability-tables.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SLICES = resolve(ROOT, '..', 'blueprint-slices')
const OUT = join(ROOT, 'graphify-out', '.graphify_chunk_90.json')

const manifest = JSON.parse(readFileSync(join(SLICES, 'slices.json'), 'utf8'))
const targets = manifest.slices.filter((s) => s.tableParse === true)
if (targets.length === 0) throw new Error('No slices marked tableParse in the manifest.')

/*
 * Prefixes from `registries/blueprint-prefixes.json`, derived from Appendix A,
 * the blueprint's own allocation authority. This list used to be written out
 * by hand here and in three other tools, and all four were missing the same
 * nine registered families -- 1,282 distinct identifiers nothing was looking
 * for. Longest-first so `SCHED` cannot claim `SCHEDRUN-001`.
 */
const PREFIXES = JSON.parse(readFileSync(join(ROOT, 'registries', 'blueprint-prefixes.json'), 'utf8'))
const ALT = [...PREFIXES.registered, ...PREFIXES.unregisteredButPresent.prefixes]
  .sort((a, b) => b.length - a.length)
  .join('|')
const IDENT = new RegExp(
  `${PREFIXES.matching.leadingGuard}(?:${ALT})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9]${PREFIXES.matching.trailing}`,
  'g',
)

/**
 * The worked example (a fictional bicycle manufacturer). The blueprint marks it
 * `Illustrative Example` and states it creates no requirement; none of these
 * prefixes has an Appendix A row. `ROLE-` was on this list once and should
 * never have been -- Appendix A registers `ROLE-PLAT-` and `ROLE-TEN-`, and
 * filtering them deleted the actors from a graph built to answer
 * who-can-do-what.
 */
const ILLUSTRATIVE = new RegExp(`^(?:${PREFIXES.illustrative.prefixes.join('|')})-`)

const idOf = (ident) => ident.toLowerCase().replace(/[^a-z0-9]+/g, '_')
const cellsOf = (line) => line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim())
const identsIn = (text) => [...new Set(String(text).match(IDENT) ?? [])].filter((i) => !ILLUSTRATIVE.test(i))

const nodes = new Map()
const edges = []
let rows = 0
let tables = 0

for (const slice of targets) {
  const file = join(SLICES, basename(dirname(slice.file)), basename(slice.file))
  const lines = readFileSync(file, 'utf8').split('\n')

  let headers = null
  let fenced = false
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? ''
    if (/^\s*```/.test(line)) { fenced = !fenced; continue }
    // A table inside a fence is a WORKED EXAMPLE of a table, not a table. The
    // slicer proved fence parity is zero for every chapter, so this toggle is
    // reliable rather than hopeful.
    if (fenced) continue

    if (!line.startsWith('|')) { headers = null; continue }
    // The delimiter row (|---|---|) is what promotes the line above it from a
    // stray pipe to a header. Without this a prose line containing a pipe
    // starts a phantom table.
    if (/^\|[\s:|-]+\|$/.test(line)) {
      const prev = lines[i - 1] ?? ''
      if (prev.startsWith('|')) { headers = cellsOf(prev); tables += 1 }
      continue
    }
    if (headers === null) continue

    const cells = cellsOf(line)
    const keyIndex = cells.findIndex((c) => identsIn(c).length > 0)
    if (keyIndex === -1) continue
    const keys = identsIn(cells[keyIndex] ?? '')
    const blueprintLine = slice.startLine + i

    rows += 1
    for (const key of keys) {
      if (!nodes.has(key)) {
        nodes.set(key, {
          id: idOf(key),
          label: key,
          type: 'identifier',
          file_type: 'document',
          source_file: slice.file,
          source_location: `${i + 1}`,
          blueprint_line: blueprintLine,
          confidence: 'EXTRACTED',
          confidence_score: 1.0,
        })
      }
      for (let c = 0; c < cells.length; c += 1) {
        if (c === keyIndex) continue
        for (const other of identsIn(cells[c] ?? '')) {
          if (other === key) continue
          if (!nodes.has(other)) {
            nodes.set(other, {
              id: idOf(other), label: other, type: 'identifier',
              source_file: slice.file, source_location: `${i + 1}`,
              blueprint_line: blueprintLine, confidence: 'EXTRACTED', confidence_score: 1.0,
              file_type: 'document',
            })
          }
          edges.push({
            source: idOf(key),
            target: idOf(other),
            // The column header IS the relation. A header that is empty or
            // decorative falls back to a named-but-honest default rather than
            // inventing a verb the table does not use.
            relation: (headers[c] ?? '').replace(/`/g, '').trim() || 'traced_to',
            confidence: 'EXTRACTED',
            confidence_score: 1.0,
            source_file: slice.file,
            source_location: `${i + 1}`,
            blueprint_line: blueprintLine,
          })
        }
      }
    }
  }
}

// Deduplicate: the same pair under the same relation appears in both the
// forward and the backward matrix by design -- that is the chapter's whole
// point -- and counting it twice would inflate every degree in the graph.
const seen = new Set()
const unique = edges.filter((e) => {
  const k = `${e.source}|${e.relation}|${e.target}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})

writeFileSync(
  OUT,
  JSON.stringify({ nodes: [...nodes.values()], edges: unique, hyperedges: [], input_tokens: 0, output_tokens: 0 }, null, 1) + '\n',
)
console.log(`Parsed ${targets.length} matrix slice(s): ${tables} tables, ${rows} identifier-bearing rows`)
console.log(`  ${nodes.size} identifier nodes, ${unique.length} edges (${edges.length - unique.length} duplicate pairs folded)`)
console.log(`  0 tokens spent, 0 inference performed — these are the author's own stated relations.`)
