/**
 * Bring the knowledge graph back in step with the code, and say exactly what changed.
 *
 * Runs from a Claude Code `Stop` hook at the end of every turn, and by hand:
 *
 *   node scripts/graph-update.mjs            # update if anything changed
 *   node scripts/graph-update.mjs --check    # report staleness, change nothing
 *
 * ── WHY NOT `graphify update .` / `_rebuild_code` ──────────────────────────
 * This was the first design, on the strength of a docstring promising that
 * passing `changed_paths` re-extracts only those files and "nodes for unchanged
 * files are preserved from the existing graph".
 *
 * It ran, reported success, and left a graph of 6,849 nodes where there had been
 * 29,498. Every blueprint node -- the entire document half, 22,698 of them --
 * was gone. It rebuilds from the CODE corpus and writes that as the whole graph.
 *
 * So the rebuild here is the pipeline that actually produced the graph: AST over
 * the code, recombined with the extracted semantic layer, then build and
 * cluster. Roughly twenty seconds, and it is correct.
 *
 * ── WHY THE GRAPH IS BACKED UP FIRST ───────────────────────────────────────
 * Because of the above. A rebuild that fails loudly is easy to survive; one that
 * succeeds and produces a fifth of a graph is not. The previous graph.json is
 * copied aside and restored if the rebuild fails OR if the result violates any
 * integrity invariant. A stale graph you know about beats a broken one you do
 * not.
 *
 * ── WHY THE FAST PATH STILL VERIFIES ───────────────────────────────────────
 * The first version exited early when no file had changed and reported "graph
 * current". It said that about the 6,849-node wreck. Nothing had changed, which
 * was true and useless. Integrity now runs on both paths; it costs ~0.4s.
 *
 * ── WHAT IT WILL NOT DO ────────────────────────────────────────────────────
 * It never writes `registries/blueprint-locators.json`. That file is committed
 * and a release gate reads it. A hook that quietly rewrites the subject of a
 * test is how a green suite stops meaning anything, so this rebuilds it to a
 * temp path, compares, and reports drift for a person to decide about.
 *
 * It never touches the frozen blueprint; the integrity check asserts its sha256.
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, unlinkSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'graphify-out')
const GRAPH = join(OUT, 'graph.json')
const BACKUP = join(OUT, '.graphify_graph_backup.json')
const INDEX = join(ROOT, 'registries', 'blueprint-locators.json')
const RECEIPT = join(OUT, '.graphify_update_receipt.json')
const TMP_INDEX = join(OUT, '.graphify_index_check.json')

const CHECK_ONLY = process.argv.includes('--check')

/** Directories whose contents the graph claims to describe. */
const SOURCE_ROOTS = ['src', 'app', 'tests', 'scripts']
const SOURCE_EXT = /\.(ts|tsx|mjs|js)$/
/** The probe convention: a leading dot AND a trailing process id, matched whole. */
const isProbe = (e) => /^\.zz-probe-(?:[a-z0-9-]+-)?\d+(?:\.json)?$/.test(e)

const say = (line) => process.stderr.write(`${line}\n`)

const nodeCount = (g) => (g.nodes ?? []).length
const edgeCount = (g) => (g.links ?? g.edges ?? []).length

function integrity() {
  try {
    return JSON.parse(
      execFileSync('node', [join(ROOT, 'scripts', 'verify-graph-integrity.mjs'), '--json'], {
        cwd: ROOT,
        encoding: 'utf8',
      }),
    )
  } catch (err) {
    try {
      return JSON.parse(String(err.stdout ?? '{}'))
    } catch {
      return { ok: false, results: [{ name: 'integrity check', ok: false, detail: 'did not run' }] }
    }
  }
}

function finish(receipt) {
  try {
    writeFileSync(RECEIPT, JSON.stringify(receipt, null, 1) + '\n')
  } catch {
    /* a receipt that cannot be written must not fail the turn */
  }
  process.exit(receipt.ok === false ? 1 : 0)
}

function reportIntegrity(res) {
  const held = res.results.filter((r) => r.ok).length
  say(`           integrity: ${held}/${res.results.length} invariants hold`)
  for (const r of res.results.filter((x) => !x.ok)) say(`           VIOLATED — ${r.name}: ${r.detail}`)
  return held
}

/*
 * RE-ENTRY GUARD. A Stop hook fires when the turn ends; if the work it does
 * causes another turn to end, it fires again. Claude Code sets
 * `stop_hook_active` on the payload precisely so a hook can refuse to recurse.
 *
 * stdin is read only when it is not a TTY: run by hand there is no payload, and
 * waiting for one would hang the terminal.
 */
let payload = {}
try {
  if (!process.stdin.isTTY) {
    const raw = readFileSync(0, 'utf8')
    if (raw.trim()) payload = JSON.parse(raw)
  }
} catch {
  /* no payload, or not JSON -- treat as a manual invocation */
}
if (payload.stop_hook_active === true) {
  finish({ ok: true, status: 'skipped', reason: 'stop_hook_active — refusing to re-enter' })
}

if (!existsSync(GRAPH)) {
  say('[graphify] no graph yet — build one before the updater can maintain it')
  finish({ ok: true, status: 'skipped', reason: 'no graph.json' })
}

// ── 1. what changed ────────────────────────────────────────────────────────
const graphMtime = statSync(GRAPH).mtimeMs
const changed = []
function walk(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (isProbe(entry.name) || entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (SOURCE_EXT.test(entry.name) && statSync(full).mtimeMs > graphMtime) changed.push(full)
  }
}
for (const r of SOURCE_ROOTS) walk(join(ROOT, r))

const before = JSON.parse(readFileSync(GRAPH, 'utf8'))
const beforeNodes = nodeCount(before)
const beforeEdges = edgeCount(before)
const rel = changed.map((f) => relative(ROOT, f))

if (changed.length === 0) {
  // Verify even here. "Nothing changed" is a statement about the FILES, not
  // about the graph, and the two came apart once already.
  const res = integrity()
  say(`[graphify] graph current — ${beforeNodes} nodes, ${beforeEdges} edges, nothing re-extracted`)
  const held = reportIntegrity(res)
  finish({
    ok: res.ok,
    status: 'current',
    nodes: beforeNodes,
    edges: beforeEdges,
    changedFiles: [],
    integrity: { ok: res.ok, held, total: res.results.length, violations: res.results.filter((r) => !r.ok) },
  })
}

if (CHECK_ONLY) {
  say(`[graphify] STALE — ${rel.length} file(s) changed since the graph was built:`)
  for (const f of rel.slice(0, 10)) say(`             ${f}`)
  finish({ ok: true, status: 'stale', changedFiles: rel, nodes: beforeNodes, edges: beforeEdges })
}

// ── 2. rebuild, over a backup ──────────────────────────────────────────────
const PY = existsSync(join(OUT, '.graphify_python'))
  ? readFileSync(join(OUT, '.graphify_python'), 'utf8').trim()
  : 'python3'

copyFileSync(GRAPH, BACKUP)
const restore = () => {
  try {
    copyFileSync(BACKUP, GRAPH)
    unlinkSync(BACKUP)
  } catch {
    /* nothing further can be done; the backup path is reported below */
  }
}

say(`[graphify] ${rel.length} file(s) changed — rebuilding`)

/*
 * The real pipeline, in one Python process:
 *   AST over the code (cached per file, so only changed files cost anything)
 *   + the extracted semantic layer, untouched
 *   -> build -> cluster -> write.
 *
 * Community labels are carried across by id from the previous run and fall back
 * to graphify's deterministic hub labeller for any community that is new, so a
 * rebuild never reintroduces `Community 417` placeholders.
 */
const REBUILD = `
import json
from pathlib import Path
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all, label_communities_by_hub
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

out = Path('graphify-out')
detect = json.loads((out / '.graphify_detect.json').read_text())

code_files = []
for f in detect.get('files', {}).get('code', []):
    p = Path(f)
    code_files.extend(collect_files(p) if p.is_dir() else [p])
ast = extract(code_files, cache_root=Path('.'))
(out / '.graphify_ast.json').write_text(json.dumps(ast))

sem = json.loads((out / '.graphify_semantic.json').read_text())
if not sem.get('nodes'):
    raise SystemExit('semantic layer is empty - refusing to write a code-only graph')

combined = {
    'nodes': ast.get('nodes', []) + sem.get('nodes', []),
    'edges': ast.get('edges', []) + sem.get('edges', []),
    'hyperedges': ast.get('hyperedges', []) + sem.get('hyperedges', []),
    'input_tokens': 0, 'output_tokens': 0,
}
(out / '.graphify_extract.json').write_text(json.dumps(combined))

G = build_from_json(combined, root='.', directed=False)
comms = cluster(G)
coh = score_all(G, comms)
hub = label_communities_by_hub(G, comms)
prev = {}
lf = out / '.graphify_labels.json'
if lf.exists():
    prev = json.loads(lf.read_text())
labels = {cid: (prev.get(str(cid)) or hub.get(cid) or f'Community {cid}') for cid in comms}

gods = god_nodes(G)
sur = surprising_connections(G, comms)
qs = suggest_questions(G, comms, labels)
to_json(G, comms, str(out / 'graph.json'), community_labels=labels, force=True)
(out / 'GRAPH_REPORT.md').write_text(
    generate(G, comms, coh, labels, gods, sur, detect, {'input': 0, 'output': 0}, '.', suggested_questions=qs)
)
lf.write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False))
(out / '.graphify_analysis.json').write_text(json.dumps({
    'communities': {str(k): v for k, v in comms.items()},
    'cohesion': {str(k): v for k, v in coh.items()},
    'gods': gods, 'surprises': sur, 'questions': qs}, indent=2))
print(f'{G.number_of_nodes()} {G.number_of_edges()}')
`

try {
  execFileSync(PY, ['-c', REBUILD], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
} catch (err) {
  restore()
  say('[graphify] REBUILD FAILED — previous graph restored, nothing lost')
  say(`             ${String(err.stderr ?? err.message).trim().split('\n').slice(-2).join(' | ')}`)
  finish({ ok: false, status: 'rebuild-failed', changedFiles: rel })
}

// ── 3. re-point blueprint nodes at the frozen source ───────────────────────
let mapped = 0
try {
  const out = execFileSync('node', [join(ROOT, 'scripts', 'map-graph-to-blueprint.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  mapped = Number(/Mapped (\d+)/.exec(out)?.[1] ?? 0)
} catch (err) {
  restore()
  say('[graphify] BLUEPRINT RE-MAPPING FAILED — previous graph restored')
  say(`             ${String(err.stdout ?? err.message).trim().split('\n').slice(-2).join(' | ')}`)
  finish({ ok: false, status: 'mapping-failed', changedFiles: rel })
}

// ── 4. the committed index: compare, never overwrite ───────────────────────
let indexStatus = 'unchanged'
try {
  execFileSync('node', [join(ROOT, 'scripts', 'build-locator-index.mjs'), '--out', TMP_INDEX], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  if (existsSync(TMP_INDEX)) {
    indexStatus =
      readFileSync(TMP_INDEX, 'utf8') === readFileSync(INDEX, 'utf8') ? 'unchanged' : 'DRIFTED'
    unlinkSync(TMP_INDEX)
  }
} catch {
  indexStatus = 'not-checked'
}

// ── 5. is what came back any good? ─────────────────────────────────────────
const res = integrity()
const after = JSON.parse(readFileSync(GRAPH, 'utf8'))
const afterNodes = nodeCount(after)
const afterEdges = edgeCount(after)

if (!res.ok) {
  restore()
  say(`[graphify] REBUILD PRODUCED A BAD GRAPH — previous graph restored (${beforeNodes} nodes)`)
  reportIntegrity(res)
  finish({
    ok: false,
    status: 'integrity-violated',
    changedFiles: rel,
    rejected: { nodes: afterNodes, edges: afterEdges },
    integrity: { ok: false, violations: res.results.filter((r) => !r.ok) },
  })
}

try {
  unlinkSync(BACKUP)
} catch {
  /* the rebuild is good; a lingering backup is harmless */
}

// ── 6. say exactly what happened ───────────────────────────────────────────
const delta = (a, b) => `${a} -> ${b} (${b - a >= 0 ? '+' : ''}${b - a})`
say(
  `[graphify] ${rel.length} file(s) re-extracted: ${rel.slice(0, 3).join(', ')}` +
    `${rel.length > 3 ? `, +${rel.length - 3} more` : ''}`,
)
say(`           nodes ${delta(beforeNodes, afterNodes)}   edges ${delta(beforeEdges, afterEdges)}`)
say(`           blueprint locations re-mapped: ${mapped}`)
say(`           locator index: ${indexStatus}`)
const held = reportIntegrity(res)
if (indexStatus === 'DRIFTED') {
  say('           the committed index would change; it was NOT written. Rebuild it deliberately:')
  say('             node scripts/build-locator-index.mjs')
}

finish({
  ok: indexStatus !== 'DRIFTED',
  status: 'updated',
  changedFiles: rel,
  nodes: { before: beforeNodes, after: afterNodes },
  edges: { before: beforeEdges, after: afterEdges },
  blueprintLocationsMapped: mapped,
  locatorIndex: indexStatus,
  integrity: { ok: res.ok, held, total: res.results.length },
})
