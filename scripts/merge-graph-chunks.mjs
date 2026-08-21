/**
 * Merge extraction chunks into one semantic graph, and refuse if one identifier
 * has been split across chunks.
 *
 * ── THE FAILURE THIS EXISTS TO CATCH ───────────────────────────────────────
 * The blueprint's value is that one identifier is referenced from many places:
 * `DEC-SYNC-003` appears across several chapters, and the point of the graph is
 * that those references converge on ONE node. Extraction runs chunk by chunk,
 * so seventy-nine separate agents have to agree on what to call it.
 *
 * They do converge -- every chunk inspected produced the canonical `dec_sync_001`
 * form, and several said so explicitly in their reports -- but "they converge"
 * is an observation about a sample, not a property of the system. If one agent
 * prefixes with its chapter (`ch22_dec_sync_003` beside `dec_sync_003`) the graph
 * quietly holds two half-connected halves of one decision, and every query about
 * it returns half the answer while looking perfectly healthy.
 *
 * ── HOW THE FIRST VERSION OF THIS CHECK WAS WRONG ──────────────────────────
 * It keyed on the node's LABEL, and so treated MENTIONING an identifier as BEING
 * one: every permission row labelled "MOD-FL-A1 — Establish a session" folded
 * into `MOD-FL-A1`, and it reported four fragmentations that did not exist. That
 * is this build's most familiar defect -- an expectation taken from the wrong
 * field -- reproduced inside the tool written to prevent it.
 *
 * The identity of an identifier node is its ID. The failure that can actually
 * happen is an id that is another id wearing a prefix, and that is what is
 * checked here.
 *
 * Usage:  node scripts/merge-graph-chunks.mjs [--normalise]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'graphify-out')
const NORMALISE = process.argv.includes('--normalise')

const chunkFiles = readdirSync(OUT)
  .filter((f) => /^\.graphify_chunk_\d+\.json$/.test(f))
  .sort()
if (chunkFiles.length === 0) throw new Error('No chunk files to merge.')

const nodes = []
const edges = []
const hyperedges = []
const perChunk = []
for (const f of chunkFiles) {
  const d = JSON.parse(readFileSync(join(OUT, f), 'utf8'))
  nodes.push(...(d.nodes ?? []))
  edges.push(...(d.edges ?? []))
  hyperedges.push(...(d.hyperedges ?? []))
  perChunk.push(`${f}: ${(d.nodes ?? []).length} nodes, ${(d.edges ?? []).length} edges`)
}

/**
 * A chapter/chunk/section prefix an agent might have prepended to an id.
 *
 * DIGITS ARE REQUIRED, and that is not cosmetic. The first form was
 * `[0-9a-z]*_`, which matches `check_` -- so `check_tenant_isolation` read as a
 * prefixed copy of `tenant_isolation` and the merge refused on two nodes that are
 * genuinely different: a server-side check, and the concept it checks. A real
 * chapter prefix always carries a number (`ch22_`, `sec_25_6_`).
 *
 * Proved against both cases before being trusted: it strips `ch22_dec_sync_003`,
 * `sec_25_6_permission` and `chunk_03_mod_fl_a1`, and leaves `check_tenant_isolation`
 * and `channel_state` alone.
 */
const PREFIX = /^(?:ch|chunk|sec|file)_?\d+[a-z]?_(?:\d+_)*(?=[a-z])/

const labelOf = new Map(nodes.map((n) => [n.id, String(n.label ?? '').trim().toLowerCase()]))
const allIds = new Set(labelOf.keys())

/**
 * id -> the canonical id it duplicates, and separately the ones that merely LOOK
 * related. The difference is the label, and it decides whether folding is a
 * repair or a distortion.
 *
 * Same id-stem AND same label  -> one entity named twice. Fold it.
 * Same id-stem, DIFFERENT label -> two entities. Report, never fold.
 *
 * The live example: `object_specific_conflict_resolution` is labelled "Step 24 —
 * ... By Object Family" and is a step in the 37-step protocol;
 * `sec_36_3_object_specific_conflict_resolution` is labelled "Object-Specific
 * Conflict Resolution" and is the section that specifies it. Related, not the
 * same, and folding them would merge a protocol step into a section -- the kind
 * of averaging that produces a third reading neither extractor stood behind.
 */
const fragments = new Map()
const lookalikes = []
for (const id of allIds) {
  const stripped = id.replace(PREFIX, '')
  if (stripped === id || !allIds.has(stripped)) continue
  if (labelOf.get(id) === labelOf.get(stripped)) fragments.set(id, stripped)
  else lookalikes.push([id, stripped])
}

if (fragments.size > 0 && !NORMALISE) {
  for (const [from, to] of [...fragments].slice(0, 15)) console.error(`  ${from} -> ${to}`)
  throw new Error(
    `${fragments.size} node id(s) are a prefixed duplicate of another id. Merging as-is ` +
      `would split one entity into two half-connected halves that answer half of every ` +
      `query while looking healthy. Re-run with --normalise to fold them.`,
  )
}

let folded = 0
if (NORMALISE && fragments.size > 0) {
  folded = fragments.size
  for (const n of nodes) if (fragments.has(n.id)) n.id = fragments.get(n.id)
  for (const e of edges) {
    if (fragments.has(e.source)) e.source = fragments.get(e.source)
    if (fragments.has(e.target)) e.target = fragments.get(e.target)
  }
}

/**
 * CANONICALISE `source_file` AGAINST THE MANIFEST.
 *
 * An agent was told to copy its file paths verbatim, reported that it had, and
 * wrote `ch-8/010230-...-7-6-the-domain-matrices.md` for a file that lives in
 * `ch-7/`. The section is numbered 7.6 and sits beside chapter 8's slices, so
 * the mistake is an easy one to make and an easy one to miss: the path still
 * looks entirely plausible, and every downstream tool that keys on the basename
 * keeps working. Only a check that opens the file notices.
 *
 * Repaired rather than re-run. The manifest already knows where every slice
 * lives, and a lookup is exact where a re-read is a fresh chance to mistype it.
 * A basename that the manifest does not recognise is left alone -- that is a
 * code file or something genuinely outside the blueprint, and rewriting it
 * would be inventing provenance rather than correcting it.
 */
const canonicalPath = new Map(
  JSON.parse(readFileSync(join(ROOT, '..', 'blueprint-slices', 'slices.json'), 'utf8')).slices.map(
    (sl) => [sl.file.split('/').pop(), sl.file],
  ),
)
let repairedPaths = 0
for (const item of [...nodes, ...edges]) {
  const raw = String(item.source_file ?? '')
  if (raw === '') continue
  const canonical = canonicalPath.get(raw.split('/').pop())
  if (canonical !== undefined && !raw.endsWith(canonical)) {
    item.source_file = canonical
    repairedPaths += 1
  }
}

/**
 * DROP THE WORKED EXAMPLE, AT THE CHOKE POINT.
 *
 * The blueprint carries a fictional bicycle manufacturer as an `Illustrative
 * Example`, and states outright that it creates no requirement. Its instance
 * data is not requirement data: `JOB-REDBIKE`, `AREA-ASSY-A`,
 * `RUN-2026-08-14-A`, one lot number mentioned 375 times. Left in, the graph's
 * busiest neighbourhood is a worked example, and a reader asking what the
 * product must do gets answers about a bike shop that does not exist.
 *
 * ── WHY THE FILTER LIVES HERE AND NOT ONLY IN THE PROMPT ───────────────────
 * It was in the prompt. An agent read "filter TAB-, LOT-, RB-", noticed that
 * JOB- and AREA- were not on the list, reasoned correctly from what it was
 * given, and kept them. It was not wrong; the list was incomplete. Seventy-odd
 * agents each making a defensible judgement from an incomplete instruction is
 * not a policy, and re-running them is expensive and still leaves the next one
 * free to decide differently.
 *
 * A deterministic filter at the single point every chunk passes through is the
 * policy. The prompt now carries the full list too, but the prompt is advice
 * and this is enforcement.
 *
 * ── HOW THE SET WAS ESTABLISHED, RATHER THAN GUESSED ───────────────────────
 * Appendix A is the document's own allocation authority and states that an
 * identifier outside it is a defect. None of these eight prefixes appears in
 * it, and each was checked for an `Illustrative Example` heading at its first
 * use. `ROLE-` was on this list once and is not any more -- Appendix A lists
 * `ROLE-PLAT-` and `ROLE-TEN-` outright, and filtering them deleted the actors
 * from a graph built to answer who-can-do-what.
 */
const ILLUSTRATIVE = /^(?:tab|lot|rb|run|job|area|cell|site)_/
const isIllustrative = (n) =>
  ILLUSTRATIVE.test(String(n.id ?? '')) &&
  // A node whose LABEL is a real identifier is kept even if its id looks
  // illustrative -- the label is the claim about what the node is, and this
  // build has already shipped two defects from trusting the wrong field.
  !/^(?:MOD|SCR|FEAT|SUB|FUNC|AC|TEST|DEC|WF|SB|OBJ|FB|SEQ|STATE|EVT|CMD|NOTIF|SCHED|UC|REQ|OFF|RISK|ASSUM)-/.test(
    String(n.label ?? '').trim(),
  )

const illustrativeIds = new Set(nodes.filter(isIllustrative).map((n) => n.id))
const droppedNodes = illustrativeIds.size
for (let i = nodes.length - 1; i >= 0; i -= 1) {
  if (illustrativeIds.has(nodes[i].id)) nodes.splice(i, 1)
}
const beforeEdges = edges.length
for (let i = edges.length - 1; i >= 0; i -= 1) {
  const e = edges[i]
  if (illustrativeIds.has(e.source) || illustrativeIds.has(e.target)) edges.splice(i, 1)
}
const droppedEdges = beforeEdges - edges.length

/**
 * SCHEMA REPAIR: an edge whose `source_file` is not a path.
 *
 * One chunk emitted `source_file: 1` on 48 edges -- a LINE NUMBER in the field
 * that holds a path. The graph builder calls `.replace()` on it and dies with
 * `'int' object has no attribute 'replace'`, which names the symptom and not the
 * cause, three layers below the mistake.
 *
 * Repaired rather than dropped, and repaired from evidence rather than guessed:
 * an edge is written by whichever file its SOURCE node came from, so that node's
 * `source_file` is the answer. Where the source node has none either, the field
 * is removed -- an absent provenance is honest, a fabricated one is not.
 */
let repairedEdgeFiles = 0
const fileOfNode = new Map(nodes.map((n) => [n.id, n.source_file]))
for (const e of edges) {
  if (typeof e.source_file === 'string' || e.source_file === undefined) continue
  const inherited = fileOfNode.get(e.source)
  if (typeof inherited === 'string') e.source_file = inherited
  else delete e.source_file
  repairedEdgeFiles += 1
}

// Deduplicate by id, keeping the first. A later duplicate that DISAGREES is not
// averaged and not merged field by field -- averaging two extractions produces a
// third reading that neither agent stood behind.
const seen = new Set()
const deduped = []
for (const n of nodes) {
  if (seen.has(n.id)) continue
  seen.add(n.id)
  deduped.push(n)
}

// Edges whose endpoints are not in this merge are kept: a chunk legitimately
// references a module defined in another chunk, and dropping those edges would
// silently sever exactly the cross-chapter links the graph exists to hold. They
// resolve once every chunk has landed; the build's health check counts any that
// never do.
const ids = new Set(deduped.map((n) => n.id))
const unresolved = edges.filter((e) => !ids.has(e.source) || !ids.has(e.target)).length

writeFileSync(
  join(OUT, '.graphify_semantic.json'),
  JSON.stringify({ nodes: deduped, edges, hyperedges, input_tokens: 0, output_tokens: 0 }, null, 1) +
    '\n',
)

for (const [a, b] of lookalikes) {
  console.log(`  note: ${a} and ${b} share an id-stem but not a label -- left as two nodes`)
}
for (const line of perChunk) console.log(`  ${line}`)
console.log(`Merged ${chunkFiles.length} chunks: ${deduped.length} nodes, ${edges.length} edges`)
console.log(`  prefixed duplicates: ${fragments.size}${folded ? ` (folded ${folded})` : ''}`)
console.log(`  edge source_file repaired: ${repairedEdgeFiles}`)
console.log(`  source_file paths canonicalised against the manifest: ${repairedPaths}`)
console.log(`  illustrative-example nodes dropped: ${droppedNodes} (and ${droppedEdges} edges touching them)`)
console.log(`  same-id duplicates dropped: ${nodes.length - deduped.length}`)
console.log(`  edges awaiting a chunk not yet merged: ${unresolved}`)
