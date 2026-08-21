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

const IDENT =
  /\b(?:MOD|SCR|FEAT|SUB|FUNC|AC|TEST|DEC|WF|SB|OBJ|FB|SEQ|STATE|EVT|CMD|NOTIF|SCHED|UC|REQ|OFF|RISK|ASSUM)-[A-Z0-9][A-Z0-9.-]*[A-Z0-9]\b/g
const ILLUSTRATIVE = /^(?:TAB|LOT|RB|ROLE)-/

const chunks = readdirSync(OUT).filter((f) => /^\.graphify_chunk_\d+\.json$/.test(f)).sort()
if (chunks.length === 0) throw new Error('No chunks to check.')

const failures = []
const rows = []
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
    const abs = resolve(ROOT, '..', 'blueprint-slices', basename(dirname(p)), basename(p))
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
  if (missingFiles > 0) failures.push(`${f}: ${missingFiles} named slice file(s) do not exist`)
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
