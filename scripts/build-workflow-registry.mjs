#!/usr/bin/env node
/**
 * Deterministic build-time generator for
 * `registries/generated/workflow-registry.json`.
 *
 * Reads every `registries/raw/extract/CHK-*.json` chunk (slice 1's
 * extraction of the frozen source), collects each chunk's `workflows[]`
 * array in chunk order -- CHK-001, CHK-002, ... -- which is also frozen-
 * source line order, since each chunk covers a contiguous, increasing line
 * range (see each file's own `line_start`/`line_end`). Entries are deduped
 * by the extractor's own `id` field: first occurrence (in chunk order)
 * wins, later duplicates of the same id are dropped. Output is sorted by id
 * so the generated file is stable regardless of any future change to chunk
 * enumeration order.
 *
 * COUNT-SCOPE DISCIPLINE (final review, Blocking 2): this produces 432
 * records today. That is a THIRD scope, distinct from the two the
 * reconciliation report already fixes for the WF-* identifier namespace --
 * 644 raw WF-* strings by grep, 642 published in Appendix L, ~118
 * de-suffixed parents (see registries/generated/source-reconciliation.json,
 * inventory "Workflows"). Do not reconcile 432 against those; they describe
 * different things:
 *
 *   - 432 is how many DISTINCT `workflows[]` ENTRIES slice 1's extraction
 *     produced (out of 725 raw entries across 36 chunks), by the
 *     extractor's own free-text `id` field -- which is not always a
 *     `WF-...` mnemonic; it also holds `UC-HO-*` handoffs, "unstated", and
 *     "unnumbered" placeholders the extractor used when the source did not
 *     give the passage a clean id. Many `workflows[]` entries share those
 *     placeholder ids and collapse into one row here, on purpose: this
 *     script does not invent an id the frozen source did not give it.
 *   - The frozen source fixes NO workflow total anywhere in its 122,241
 *     lines. 81 is the MODULE count and nothing else -- conflating the two
 *     is a named implementation risk in source-reconciliation.json.
 *
 * COLLAPSE PROVENANCE (post-handoff honesty fix): dedup-by-id silently
 * folds every raw entry that shares an id into one row, with nothing on the
 * page distinguishing "this id only ever appeared once" from "199 raw
 * entries shared this id." Each output row now also carries `collapsedFrom`
 * (how many raw entries its id actually had, default 1) and
 * `idIsPlaceholder` (true only for the bare literal ids "unnumbered" and
 * "unstated" -- the extractor's own placeholders, not a real stable
 * identifier). This does NOT change the dedup key or invent an id the
 * source never gave; it only makes the existing collapse visible to
 * whatever reads this file. Synthesising better ids is out of scope here.
 *
 * Run with: node scripts/build-workflow-registry.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXTRACT_DIR = join(ROOT, 'registries', 'raw', 'extract')
const OUT_FILE = join(ROOT, 'registries', 'generated', 'workflow-registry.json')

const chunkFiles = readdirSync(EXTRACT_DIR)
  .filter((f) => /^CHK-\d+\.json$/.test(f))
  .sort()

if (chunkFiles.length === 0) {
  throw new Error(`No CHK-*.json extraction chunks found under ${EXTRACT_DIR}`)
}

const byId = new Map()
const idCounts = new Map() // id -> how many raw entries actually had this id

for (const file of chunkFiles) {
  const chunk = JSON.parse(readFileSync(join(EXTRACT_DIR, file), 'utf8'))
  for (const wf of chunk.workflows ?? []) {
    idCounts.set(wf.id, (idCounts.get(wf.id) ?? 0) + 1)
    if (byId.has(wf.id)) continue // first occurrence (chunk/line order) wins
    byId.set(wf.id, {
      id: wf.id,
      name: wf.name,
      primaryActor: wf.primary_actor,
      trigger: wf.trigger,
      surfacesTouched: wf.surfaces_touched ?? [],
      terminalStates: wf.terminal_states ?? [],
      sourceLine: wf.line,
      // Slices 3-13 have not run: nothing here has been demonstrated,
      // decision-blocked, or ruled not-applicable yet. Honest default, per
      // spec §7 -- never `implemented`, which this build has no backend to
      // back up.
      status: 'not-represented',
    })
  }
}

// Derived, not assumed: scanning every raw id (see the block comment above)
// shows exactly two literal, unqualified placeholder values recur --
// "unnumbered" (199 raw entries) and "unstated" (66). Ids that add a
// discriminating fragment after that text (e.g. "unnumbered — 23.10 metrics
// derivation") are real, if ugly, distinct ids and are deliberately excluded.
const PLACEHOLDER_IDS = new Set(['unnumbered', 'unstated'])

const records = [...byId.values()]
  .map((r) => ({
    ...r,
    collapsedFrom: idCounts.get(r.id) ?? 1,
    idIsPlaceholder: PLACEHOLDER_IDS.has(r.id),
  }))
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

writeFileSync(OUT_FILE, JSON.stringify(records, null, 2) + '\n')
console.log(`Wrote ${records.length} workflow records to ${OUT_FILE}`)
