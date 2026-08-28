#!/usr/bin/env node
// Reconciles docs/process/ledgers/live-verification-ledger.json against the
// project's fourteen §9.6 generated registries (registries/generated/*.json,
// the closed, machine-checkable census app/coverage/page.tsx itself reads
// from `@/coverage/descriptors`'s `RegistrySlug` union). Reports BOTH
// directions, each with a count, per master prompt §2.3/Task 19's own pass
// criteria:
//
//   A. registry rows with NO ledger row     -- the live-verification backlog.
//   B. ledger rows naming a path NO registry contains -- a data-integrity
//      defect: a row citing evidence for something that, by this project's
//      own closed census, does not exist. Exits 1 on this direction only.
//
// Direction A is expected to start large -- this script's own Task 19
// verification run reports it, honestly, as close to the WHOLE census (see
// docs/process/ledgers/live-verification-ledger.json's scope_note and
// task-19-report.md). That is not a failure of this script; the ledger is
// deliberately seeded near-empty rather than backfilled, so this number is a
// real starting position for the §24.2 workflow units that append to it, not
// a claim already made. Direction A therefore never fails the exit code --
// doing so would make every run of this script red until ~5000 rows are
// written, which is not what a "prints the gap" tool is for.
//
// `pathId` format (documented in the ledger's own scope_note and in
// docs/process/live-verification-procedure.md): `${registrySlug}:${id}`,
// e.g. `workflows:SB-001@L61090`. Registry row `id` values are NOT globally
// unique across the fourteen registries (`SB-001` is a real id in both
// `workflows` and `ai-storyboards`), so the slug prefix is load-bearing, not
// decoration -- without it, two different rows collide under one pathId and
// this reconciliation silently under-counts direction A.
//
// Master prompt §2.3 policy-excludes test cases; this is a compile-level
// report, not a test, and lives outside tests/.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_DIR = path.join(ROOT, 'registries', 'generated')
const LEDGER_PATH = path.join(ROOT, 'docs', 'process', 'ledgers', 'live-verification-ledger.json')

// No hardcoded slug list, deliberately -- the same principle
// app/coverage/page.tsx documents for its own registry loop: "no slug is
// special-cased ... a fifteenth registry ... is covered automatically." Any
// top-level *.json file under registries/generated/ that has a `rows` array
// is a registry census; `source-reconciliation.json` (no `rows` key -- it is
// a narrative reconciliation document, not a census) is skipped by that same
// structural test, not by name.
function loadRegistryCensus() {
  const census = new Map() // pathId -> { slug, id }
  const entries = readdirSync(REGISTRY_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue
    const slug = entry.name.slice(0, -'.json'.length)
    const data = JSON.parse(readFileSync(path.join(REGISTRY_DIR, entry.name), 'utf8'))
    if (!Array.isArray(data.rows)) continue // e.g. source-reconciliation.json
    for (const row of data.rows) {
      if (typeof row.id !== 'string') continue
      census.set(`${slug}:${row.id}`, { slug, id: row.id })
    }
  }
  return census
}

function loadLedgerRows() {
  if (!existsSync(LEDGER_PATH)) {
    console.error(`ledger-reconcile: ${path.relative(ROOT, LEDGER_PATH)} not found.`)
    process.exit(1)
  }
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'))
  if (!Array.isArray(ledger.entries)) {
    console.error(`ledger-reconcile: ${path.relative(ROOT, LEDGER_PATH)} has no "entries" array.`)
    process.exit(1)
  }
  return ledger.entries
}

const census = loadRegistryCensus()
const ledgerRows = loadLedgerRows()
const ledgerPathIds = new Map() // pathId -> ledger row id(s), for direction B reporting
for (const row of ledgerRows) {
  if (typeof row.pathId !== 'string') continue
  const list = ledgerPathIds.get(row.pathId) ?? []
  list.push(row.id ?? '(no id)')
  ledgerPathIds.set(row.pathId, list)
}

// Direction A: registry rows with no ledger row.
const uncovered = [...census.keys()].filter((pathId) => !ledgerPathIds.has(pathId)).sort()

// Direction B: ledger rows naming a path no registry contains.
const orphaned = [...ledgerPathIds.entries()]
  .filter(([pathId]) => !census.has(pathId))
  .flatMap(([pathId, rowIds]) => rowIds.map((rowId) => ({ pathId, rowId })))

console.log(`ledger-reconcile: registry census ${census.size} row(s) across ${new Set([...census.values()].map((v) => v.slug)).size} registries; ledger ${ledgerRows.length} row(s).`)
console.log()
console.log(`A. Registry rows with NO ledger row: ${uncovered.length} of ${census.size}`)
for (const pathId of uncovered) console.log(`   ${pathId}`)
console.log()
console.log(`B. Ledger rows naming a path NO registry contains: ${orphaned.length}`)
for (const { pathId, rowId } of orphaned) console.log(`   ${rowId}  ->  ${pathId}`)

if (orphaned.length > 0) {
  console.error(`\nledger-reconcile: ${orphaned.length} orphaned ledger row(s) name a path outside the registry census -- fix the ledger row's pathId or the registry, then re-run.`)
  process.exit(1)
}
