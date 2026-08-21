/**
 * Catch a chunk that returned successfully and extracted almost nothing.
 *
 * ── THE FAILURE THIS EXISTS TO CATCH ───────────────────────────────────────
 * An extraction agent reports "104 nodes, 66 edges" and exits clean. Nothing
 * errored, the JSON is valid, every id is well-formed, every line number is in
 * range -- and it read 2,196 lines carrying 714 distinct identifiers and
 * recorded nine of them. Every structural check passes because the defect is
 * not structural: what came back is SHAPED like an extraction and is not one.
 *
 * Without this, that chunk merges silently. The graph gains a chapter-shaped
 * hole, and the only symptom is that queries about that chapter return less
 * than they should -- which looks exactly like the chapter being small.
 *
 * ── WHY THE DENOMINATOR IS COMPUTED HERE, NOT REPORTED BY THE AGENT ────────
 * The agent that under-extracted is not a reliable witness to how much it
 * missed. So the expected set is derived independently: scan the slice files
 * this chunk was given, count the distinct identifiers actually present, and
 * compare against what came back. The check never asks the subject.
 *
 * Usage:  node scripts/check-extraction-coverage.mjs [--floor 0.5]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'graphify-out')
const argv = process.argv.slice(2)
const i = argv.indexOf('--floor')
const FLOOR = i === -1 ? 0.5 : Number(argv[i + 1])

/**
 * The identifier prefixes, from `registries/blueprint-prefixes.json`, which is
 * derived from Appendix A -- the blueprint's own allocation authority.
 *
 * This used to be a literal list written out here. Four tools each carried
 * their own copy and every one was missing the same nine registered prefixes
 * (AI-, AUD-, GRANT-, IDENT-, INT-, PER-, ROLE-PLAT-, ROLE-TEN-, SCHEDRUN-,
 * SURF-), together 1,282 distinct identifiers. Nothing failed: the coverage
 * checker simply used too small a denominator and reported ratios that were
 * quietly optimistic, which is the worst way for a measurement to be wrong.
 *
 * Longest-first alternation so `SCHED` cannot claim `SCHEDRUN-001` and leave a
 * dangling `RUN-`.
 */
const PREFIXES = JSON.parse(readFileSync(join(ROOT, 'registries', 'blueprint-prefixes.json'), 'utf8'))
const ALT = [...PREFIXES.registered, ...PREFIXES.unregisteredButPresent.prefixes]
  .sort((a, b) => b.length - a.length)
  .join('|')
// `\\b` and not `\b`: inside a template literal `\b` is the BACKSPACE character,
// so the first version of this line compiled to a regex that matched nothing and
// the whole check reported success over an empty set. The guard below exists
// because that failure printed 'All 0 chunk(s) at or above the floor'.
const IDENT = new RegExp(`\\b(?:${ALT})-[A-Z0-9][A-Z0-9.-]*[A-Z0-9]\\b`, 'g')
const ILLUSTRATIVE = new RegExp(`^(?:${PREFIXES.illustrative.prefixes.join('|')})-`)

const chunks = readdirSync(OUT).filter((f) => /^\.graphify_chunk_\d+\.json$/.test(f)).sort()
if (chunks.length === 0) throw new Error('No chunks to check.')

const canonicalPath = new Map(
  JSON.parse(readFileSync(resolve(ROOT, '..', 'blueprint-slices', 'slices.json'), 'utf8')).slices.map(
    (sl) => [sl.file.split('/').pop(), sl.file],
  ),
)

const failures = []
const rows = []
let nonCanonical = 0
for (const f of chunks) {
  const d = JSON.parse(readFileSync(join(OUT, f), 'utf8'))
  const nodes = d.nodes ?? []

  // The files this chunk claims to have read, taken from the chunk itself --
  // an agent that never opened a file also never names it, and a chunk naming
  // no files at all is the most complete failure of the lot.
  const files = [...new Set(nodes.map((n) => String(n.source_file ?? '')).filter(Boolean))]
  if (files.length === 0) {
    failures.push(`${f}: names no source file at all`)
    continue
  }

  const present = new Set()
  let missingFiles = 0
  for (const p of files) {
    /*
     * Resolve by BASENAME through the manifest, not by the directory the chunk
     * names. Ninety-four paths across the chunks name the wrong chapter
     * directory -- `ch-8/...7-6-the-domain-matrices.md` for a file in `ch-7/`.
     * The merge canonicalises those, but it writes the merged graph, not the
     * chunk files this reads, so resolving the chunk's own string would fail a
     * chunk whose only fault is already repaired downstream.
     *
     * The mismatch is still counted and printed. A wrong path is worth knowing
     * about even when something else fixes it -- silence here is how the next
     * one goes unnoticed.
     */
    const canonical = canonicalPath.get(basename(p))
    if (canonical === undefined) { missingFiles += 1; continue }
    if (!p.endsWith(canonical)) nonCanonical += 1
    const abs = resolve(ROOT, '..', 'blueprint-slices', basename(dirname(canonical)), basename(canonical))
    if (!existsSync(abs)) { missingFiles += 1; continue }
    for (const m of readFileSync(abs, 'utf8').matchAll(IDENT)) {
      if (!ILLUSTRATIVE.test(m[0])) present.add(m[0])
    }
  }
  if (present.size === 0) continue // a slice with no identifiers has nothing to miss

  /*
   * MATCH ON THE NODE ID, NOT THE LABEL.
   *
   * The first version compared identifiers against node LABELS and reported
   * 0% on seven chunks that are fine. Their labels legitimately carry a
   * description -- "MOD-FL-A1 - Establish a session" -- so exact equality
   * against the bare identifier misses every one of them.
   *
   * That is this build's most familiar defect, an expectation taken from the
   * wrong field, and it appeared here inside the checker written to catch a
   * different instance of it. The id is the identity: `MOD-FL-A1` is
   * `mod_fl_a1` in every chunk by spec, whatever the label says around it.
   */
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const captured = new Set(nodes.map((n) => norm(String(n.id ?? ''))))
  let hit = 0
  for (const id of present) if (captured.has(norm(id))) hit += 1
  const ratio = hit / present.size

  rows.push(`  ${f}: ${hit}/${present.size} identifiers (${Math.round(ratio * 100)}%), ${nodes.length} nodes`)
  if (ratio < FLOOR) {
    failures.push(
      `${f}: captured ${hit} of ${present.size} identifiers (${Math.round(ratio * 100)}%) ` +
        `across ${files.length} slice(s) -- returned clean but did not extract`,
    )
  }
  if (missingFiles > 0) {
    failures.push(`${f}: ${missingFiles} named slice file(s) the manifest does not recognise`)
  }
}

/*
 * NON-VACUITY. A checker that examined nothing must not report success.
 * The first build of the shared prefix loader produced a regex matching zero
 * identifiers, and this script cheerfully printed "All 0 chunk(s) at or above
 * the 70% floor" -- a green result from a check that had not run.
 */
if (rows.length === 0) {
  throw new Error(
    `Examined ${chunks.length} chunk(s) and found no identifiers to check in any of them. ` +
      `That is a broken checker, not a clean result -- refusing to report success over an ` +
      `empty set.`,
  )
}

for (const r of rows) console.log(r)
if (failures.length > 0) {
  console.error('')
  for (const line of failures) console.error(`  FAIL ${line}`)
  throw new Error(
    `${failures.length} chunk(s) below the ${Math.round(FLOOR * 100)}% coverage floor. ` +
      `These merge silently and leave a chapter-shaped hole whose only symptom is a ` +
      `chapter that looks small. Re-run them before merging.`,
  )
}
console.log(`\nAll ${rows.length} chunk(s) at or above the ${Math.round(FLOOR * 100)}% floor.`)
if (nonCanonical > 0) {
  console.log(
    `  note: ${nonCanonical} source_file path(s) name the wrong chapter directory; ` +
      `the merge canonicalises these against the manifest.`,
  )
}
