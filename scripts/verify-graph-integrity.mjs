/**
 * Assert every property the graph is supposed to have, after anything rebuilds it.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * The graph is rebuilt automatically at the end of a turn now, which means
 * nobody is watching when it happens. Every silent failure this build met
 * during extraction passed a structural check and returned success:
 *
 *   - a chunk that read 2,196 lines and recorded 15% of the identifiers
 *   - 94 paths naming a chapter directory the file is not in
 *   - a chunk reporting 100% coverage having never opened four of its files
 *   - twelve acceptance criteria invented by continuing a sequence
 *
 * None of them errored. "The rebuild succeeded" is therefore not evidence that
 * the graph is correct, and an automated updater that reports success on the
 * strength of an exit code is reporting the wrong thing.
 *
 * This is the list of properties that were true when the graph was built by
 * hand and verified line by line. If a rebuild breaks one, the updater must say
 * so rather than print a cheerful delta.
 *
 * Every check here is cheap. The whole file runs in well under a second, which
 * is what lets it run on every update rather than being saved for CI.
 *
 * Usage:  node scripts/verify-graph-integrity.mjs [--json]
 * Exit:   0 all invariants hold · 1 one or more violated
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const SLICES = resolve(ROOT, '..', 'blueprint-slices')
const GRAPH = join(ROOT, 'graphify-out', 'graph.json')
const INDEX = join(ROOT, 'registries', 'blueprint-locators.json')
const PREFIX_FILE = join(ROOT, 'registries', 'blueprint-prefixes.json')
const LABELS = join(ROOT, 'graphify-out', '.graphify_labels.json')

/**
 * The frozen source. Asserted, never derived from anything that could drift.
 * This build's entire evidence chain rests on the blueprint being unchanged, so
 * a mismatch here invalidates every citation in the tree, not just the graph.
 */
const EXPECTED_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'

/**
 * A floor, not an equality. The graph legitimately grows and shrinks as code is
 * added and deleted, so pinning an exact count would fail on ordinary work. What
 * must never happen is a collapse -- a rebuild that quietly produces a fraction
 * of the graph and reports success. Set well below the measured 29,498 so
 * normal churn never trips it, and far above anything a broken rebuild yields.
 */
const NODE_FLOOR = 25_000
const BLUEPRINT_NODE_FLOOR = 20_000

const results = []
const check = (name, ok, detail) => results.push({ name, ok, detail })

// ── the frozen source ──────────────────────────────────────────────────────
const sourceBytes = readFileSync(SOURCE)
const sourceText = sourceBytes.toString('utf8')
const sha = createHash('sha256').update(sourceBytes).digest('hex')
check(
  'blueprint unchanged',
  sha === EXPECTED_SHA,
  sha === EXPECTED_SHA ? `sha256 ${sha.slice(0, 12)}…` : `sha256 is ${sha}, expected ${EXPECTED_SHA}`,
)

// ── the graph ──────────────────────────────────────────────────────────────
if (!existsSync(GRAPH)) {
  check('graph exists', false, `no graph at ${GRAPH}`)
} else {
  const graph = JSON.parse(readFileSync(GRAPH, 'utf8'))
  const nodes = graph.nodes ?? []
  const edges = graph.links ?? graph.edges ?? []

  check(
    'graph has not collapsed',
    nodes.length >= NODE_FLOOR,
    `${nodes.length} nodes, ${edges.length} edges (floor ${NODE_FLOOR})`,
  )

  /*
   * Blueprint nodes must name the FROZEN SOURCE, not the staging slice they
   * were read from. This is the one a stock `graphify update` breaks: its
   * rebuild knows nothing about scripts/map-graph-to-blueprint.mjs, so blueprint
   * nodes revert to `blueprint-slices/ch-2/…md loc=128` and every citation a
   * query prints becomes unopenable. The staging directory is not even inside
   * the repository.
   */
  const fromBlueprint = nodes.filter(
    (n) => String(n.source_file ?? '').endsWith('AVIIXA_Production_Product_Blueprint.md'),
  )
  const unmapped = fromBlueprint.filter((n) => !/^L\d+$/.test(String(n.source_location ?? '')))
  check(
    'blueprint nodes cite the frozen source',
    fromBlueprint.length >= BLUEPRINT_NODE_FLOOR && unmapped.length === 0,
    `${fromBlueprint.length} blueprint nodes, ${unmapped.length} without an L-prefixed line`,
  )

  /*
   * A node may legitimately still name its slice: the mapper DROPS a location it
   * cannot resolve rather than clamping it into range, and one node does claim
   * line 525 of a 524-line slice. That node keeps its slice path and carries no
   * `blueprint_line`, which is the honest outcome -- it simply is not citable.
   *
   * So the property is not "zero nodes name a slice". It is "any node that names
   * a slice was deliberately left unmapped". A node with BOTH a slice path and a
   * blueprint_line would mean the repointing half-ran, which is the real defect.
   */
  const stillOnSlices = nodes.filter((n) => String(n.source_file ?? '').includes('blueprint-slices'))
  const halfMapped = stillOnSlices.filter((n) => n.blueprint_line !== undefined)
  check(
    'slice-pathed nodes are the deliberately unmapped ones',
    halfMapped.length === 0 && stillOnSlices.length <= 5,
    `${stillOnSlices.length} unmapped by design, ${halfMapped.length} half-mapped`,
  )

  /*
   * A prefixed duplicate is one identifier split into two half-connected halves
   * -- `ch22_dec_sync_003` beside `dec_sync_003`. The graph then answers half of
   * every question about it while looking perfectly healthy. Digits are required
   * in the prefix: without them `check_tenant_isolation` reads as a prefixed
   * copy of `tenant_isolation`, which are two genuinely different things.
   */
  const labelOf = new Map(nodes.map((n) => [String(n.id), String(n.label ?? '').trim().toLowerCase()]))
  const ids = new Set(labelOf.keys())
  const PREFIX = /^(?:ch|chunk|sec|file)_?\d+[a-z]?_(?:\d+_)*(?=[a-z])/
  /*
   * Same stem AND same label is one entity split in two -- the defect. Same
   * stem, DIFFERENT label is two entities that merely resemble each other, and
   * the merge deliberately leaves those alone: `object_specific_conflict_
   * resolution` is a step in the 37-step protocol, `sec_36_3_object_specific_
   * conflict_resolution` is the section that specifies it. Folding them would
   * merge a step into a section.
   *
   * The first version of this check omitted the label test and reported the
   * merge's deliberate decision as a defect -- an expectation taken from the
   * wrong field, which is the mistake this build keeps meeting.
   */
  const fragmented = [...ids].filter((id) => {
    const stripped = id.replace(PREFIX, '')
    return stripped !== id && ids.has(stripped) && labelOf.get(id) === labelOf.get(stripped)
  })
  check(
    'no prefixed-duplicate node ids',
    fragmented.length === 0,
    fragmented.length === 0 ? 'none' : `${fragmented.length}, e.g. ${fragmented[0]}`,
  )
}

// ── no invented identifiers anywhere ───────────────────────────────────────
/*
 * Checked on the GRAPH, not only on the index.
 *
 * The first version of this file checked the index alone and a planted
 * `AC-GHOST-999` walked straight past it: the index lists only identifiers found
 * in the source, so a fabricated one is absent from the index by construction
 * and the check had nothing to notice. The node was in the graph the whole time,
 * ready to answer a query with total confidence about a criterion that does not
 * exist.
 *
 * The index being clean says nothing about the graph. This asks the graph.
 */
const prefixesForGraph = JSON.parse(readFileSync(PREFIX_FILE, 'utf8'))
const ALT_G = [...prefixesForGraph.registered, ...prefixesForGraph.unregisteredButPresent.prefixes]
  .sort((a, b) => b.length - a.length)
  .join('|')
const SCAN_G = new RegExp(
  `${prefixesForGraph.matching.leadingGuard}(?:${ALT_G})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9]${prefixesForGraph.matching.trailing}`,
  'g',
)
const inSource = new Set()
for (let m = SCAN_G.exec(sourceText); m !== null; m = SCAN_G.exec(sourceText)) inSource.add(m[0])

if (existsSync(GRAPH)) {
  const LEAD = new RegExp(
    `^(?:${ALT_G})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9]${prefixesForGraph.matching.trailing}`,
  )
  const ghosts = []
  for (const n of JSON.parse(readFileSync(GRAPH, 'utf8')).nodes ?? []) {
    const m = LEAD.exec(String(n.label ?? '').trim())
    if (m !== null && !inSource.has(m[0])) ghosts.push(m[0])
  }
  check(
    'graph invents no identifier',
    ghosts.length === 0,
    ghosts.length === 0 ? 'none' : `${ghosts.length} absent from the source, e.g. ${ghosts[0]}`,
  )
}

// ── the committed locator index ────────────────────────────────────────────
if (!existsSync(INDEX)) {
  check('locator index exists', false, `no index at ${INDEX}`)
} else {
  const index = JSON.parse(readFileSync(INDEX, 'utf8'))

  check(
    'index describes this blueprint',
    index.source?.sha256 === EXPECTED_SHA,
    `index sha ${String(index.source?.sha256).slice(0, 12)}…`,
  )

  /*
   * NO FABRICATED IDENTIFIERS. An extraction agent emitted AC-AUTH-007 through
   * AC-AUTH-015 and AC-SEC-002 through AC-SEC-004 -- twelve strings that occur
   * nowhere in the document. It had seen a few real acceptance criteria and
   * continued the sequence. A fabricated identifier looks exactly like a real
   * one and answers queries with total confidence.
   *
   * One pass collecting what the source contains, then set membership. The
   * naive `sourceText.includes(id)` per identifier scans 18MB twenty thousand
   * times -- roughly 350GB -- and turns a sub-second check into a minute.
   */
  const prefixes = JSON.parse(readFileSync(PREFIX_FILE, 'utf8'))
  const ALT = [...prefixes.registered, ...prefixes.unregisteredButPresent.prefixes]
    .sort((a, b) => b.length - a.length)
    .join('|')
  const IDENT = new RegExp(
    `${prefixes.matching.leadingGuard}(?:${ALT})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9]${prefixes.matching.trailing}`,
    'g',
  )
  const present = new Set()
  for (let m = IDENT.exec(sourceText); m !== null; m = IDENT.exec(sourceText)) present.add(m[0])

  const fabricated = Object.keys(index.index ?? {}).filter((id) => !present.has(id))
  check(
    'index invents no identifier',
    fabricated.length === 0,
    fabricated.length === 0
      ? `${Object.keys(index.index ?? {}).length} identifiers, all real`
      : `${fabricated.length} absent from the source, e.g. ${fabricated[0]}`,
  )
}

// ── community labels ───────────────────────────────────────────────────────
if (existsSync(LABELS)) {
  const labels = JSON.parse(readFileSync(LABELS, 'utf8'))
  const placeholders = Object.values(labels).filter((v) => /^Community \d+$/.test(String(v)))
  check(
    'no placeholder community labels',
    placeholders.length === 0,
    `${Object.keys(labels).length} labels, ${placeholders.length} placeholders`,
  )
} else {
  check('community labels exist', false, 'no .graphify_labels.json')
}

// ── every slice was read ───────────────────────────────────────────────────
/*
 * An agent reported "238/238 = 100%" for a nine-file batch having never opened
 * four of them. Its ratio was true and useless: a self-measurement cannot see
 * the file it never looked at. Only the full corpus knows which slices were
 * supposed to be read, so the check has to be made here, against the manifest.
 *
 * Read from the merged semantic layer rather than the built graph, because the
 * graph's blueprint nodes have been repointed at the frozen source and no longer
 * name their slice.
 */
const SEMANTIC = join(ROOT, 'graphify-out', '.graphify_semantic.json')
const MANIFEST = join(SLICES, 'slices.json')
if (existsSync(SEMANTIC) && existsSync(MANIFEST)) {
  /*
   * READ FROM THE CHUNKS, NOT FROM THE MERGED OUTPUT.
   *
   * The merged file is post-dedup. A slice whose every node duplicated an id
   * already seen in another chunk contributes nothing to it -- yet it was read,
   * carefully, and its content is in the graph under the surviving ids. Eleven
   * slices are in exactly that position, and measuring against the merged output
   * reported all eleven as never opened.
   *
   * The chunk files are the evidence of reading. That is the question being
   * asked, so that is what gets measured.
   */
  const read = new Set()
  const outDir = join(ROOT, 'graphify-out')
  for (const f of readdirSync(outDir)) {
    if (!/^\.graphify_chunk_\d+\.json$/.test(f)) continue
    for (const n of JSON.parse(readFileSync(join(outDir, f), 'utf8')).nodes ?? []) {
      const b = basename(String(n.source_file ?? ''))
      if (b) read.add(b)
    }
  }
  void SEMANTIC
  const prefixes = JSON.parse(readFileSync(PREFIX_FILE, 'utf8'))
  const ALT = [...prefixes.registered, ...prefixes.unregisteredButPresent.prefixes]
    .sort((a, b) => b.length - a.length)
    .join('|')
  const ANY = new RegExp(
    `${prefixes.matching.leadingGuard}(?:${ALT})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9]${prefixes.matching.trailing}`,
  )
  const unread = []
  for (const slice of JSON.parse(readFileSync(MANIFEST, 'utf8')).slices) {
    const name = slice.file.split('/').pop()
    if (read.has(name)) continue
    const abs = join(SLICES, basename(dirname(slice.file)), name)
    // A slice with no identifiers has nothing to contribute; demanding a node
    // from it would be demanding an invention.
    if (existsSync(abs) && ANY.test(readFileSync(abs, 'utf8'))) unread.push(name)
  }
  check(
    'every identifier-bearing slice was read',
    unread.length === 0,
    unread.length === 0 ? 'none unread' : `${unread.length} unread, e.g. ${unread[0]}`,
  )
}

// ── report ─────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok)
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 1))
} else {
  for (const r of results) console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${r.name} — ${r.detail}`)
  console.log(
    failed.length === 0
      ? `\n${results.length}/${results.length} invariants hold.`
      : `\n${failed.length} of ${results.length} invariants VIOLATED.`,
  )
}
process.exit(failed.length === 0 ? 0 : 1)
