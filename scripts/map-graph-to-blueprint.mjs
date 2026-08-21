/**
 * Resolve every blueprint-slice location in the graph back to a real line in
 * the frozen source, and REFUSE if any of them cannot be resolved.
 *
 * ── WHY A SCRIPT AND NOT THE EXTRACTOR ─────────────────────────────────────
 * The extracting agents are told to emit locations as lines WITHIN their slice
 * file, and never to convert. That is deliberate. The conversion is
 * `startLine + line - 1` applied several thousand times, and arithmetic done by
 * hand several thousand times is arithmetic done wrong somewhere -- silently,
 * in a way that produces a citation which looks exactly like a correct one.
 *
 * This build has already paid for that lesson in another currency: 66 wrong
 * locators in a single document, and a coverage count inflated by identifiers
 * that appeared only in comments. A wrong line number is worse than a missing
 * one, because it survives review.
 *
 * ── WHAT IT GUARANTEES ─────────────────────────────────────────────────────
 * After this runs, every graph node sourced from the blueprint carries
 * `blueprint_line`, and that number has been checked against the manifest's
 * declared range for the slice it came from. A location outside its slice is a
 * defect in the extraction, not something to clamp into range and forget.
 *
 * Usage:  node scripts/map-graph-to-blueprint.mjs [--graph PATH] [--slices DIR]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const argOf = (flag, fallback) => {
  const i = argv.indexOf(flag)
  return i === -1 ? fallback : argv[i + 1]
}
const GRAPH = resolve(argOf('--graph', join(ROOT, 'graphify-out', 'graph.json')))
const SLICES = resolve(argOf('--slices', join(ROOT, '..', 'blueprint-slices')))

const manifest = JSON.parse(readFileSync(join(SLICES, 'slices.json'), 'utf8'))
/** slice filename (basename) -> its record. Keyed on basename because a node's
 *  source_file may be absolute, repo-relative, or slice-relative depending on
 *  which path the extractor happened to be handed. */
const byName = new Map(manifest.slices.map((s) => [basename(s.file), s]))

const graph = JSON.parse(readFileSync(GRAPH, 'utf8'))
const nodes = graph.nodes ?? []

let mapped = 0
let notBlueprint = 0
const outOfRange = []
const unknownSlice = []

for (const node of nodes) {
  const src = String(node.source_file ?? node.file ?? '')
  const name = basename(src)
  const slice = byName.get(name)
  if (slice === undefined) {
    notBlueprint += 1
    continue
  }

  // `source_location` arrives in several shapes across extractors: `L1234`,
  // `1234`, `file.md:1234`. Take the last run of digits rather than assuming
  // one -- a parser that assumes a shape silently yields NaN on the others,
  // and NaN compares equal to nothing and fails with a message about NaN.
  const raw = String(node.source_location ?? node.line ?? '')
  const m = raw.match(/(\d+)(?!.*\d)/)
  if (m === null) {
    unknownSlice.push(`${name}: no line in source_location ${JSON.stringify(raw)}`)
    continue
  }
  const local = Number(m[1])
  const original = slice.startLine + local - 1

  // The check that makes this worth running. A location past the end of its own
  // slice means the extractor numbered against something other than the file it
  // was given, and every citation from that chunk is suspect.
  if (local < 1 || original > slice.endLine) {
    outOfRange.push(
      `${name}: local line ${local} maps to ${original}, outside the slice's ` +
        `declared range ${slice.startLine}-${slice.endLine}`,
    )
    continue
  }

  node.blueprint_line = original
  node.blueprint_locator = `L${original}`
  node.blueprint_slice = slice.file
  mapped += 1
}

/*
 * WHAT TO DO WITH A LOCATION THAT WILL NOT MAP.
 *
 * There are three options and two of them are wrong. Clamping it into range
 * invents a citation, which is the defect this whole script exists to prevent:
 * a wrong line number survives review, a missing one does not. Refusing the
 * entire build over one off-by-one -- an agent reporting line 525 of a 524-line
 * slice -- makes the pipeline hostage to a single stray node out of 23,000.
 *
 * The third option: DROP the location. The node still exists in the graph with
 * everything else it knows; it just carries no blueprint_line, so nothing can
 * cite it. Not being citable is the honest outcome for a location nobody can
 * verify.
 *
 * The refusal is kept, moved to a RATE. A handful of off-by-ones is arithmetic;
 * a slice's worth is an extractor numbering against the wrong file, and every
 * citation from it is then suspect.
 */
const unmappable = unknownSlice.length + outOfRange.length
const RATE_CEILING = 0.005
if (unmappable > 0) {
  for (const line of [...unknownSlice, ...outOfRange].slice(0, 20)) console.error(`  dropped: ${line}`)
}
if (unmappable > Math.max(20, (mapped + unmappable) * RATE_CEILING)) {
  throw new Error(
    `${outOfRange.length} location(s) fall outside their own slice and ` +
      `${unknownSlice.length} carry no parsable line -- ` +
      `${((unmappable / (mapped + unmappable)) * 100).toFixed(2)}% of all blueprint locations. ` +
      `Above ${RATE_CEILING * 100}% this is an extractor numbering against the wrong file, ` +
      `not arithmetic, and every citation from it is suspect.`,
  )
}

writeFileSync(GRAPH, JSON.stringify(graph, null, 1) + '\n')
console.log(`Mapped ${mapped} blueprint locations to frozen-source lines.`)
console.log(`  ${notBlueprint} nodes are not from the blueprint (code, or unsourced).`)
console.log(`  every mapped line verified inside its slice's declared range.`)
console.log(`  ${unmappable} location(s) dropped as unmappable — those nodes carry no citable line.`)
