#!/usr/bin/env node
// Prohibited-pattern scan for master prompt §4.1 / the runway's "No backend,
// ever" constraint: no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`,
// `sendBeacon`, remote URL literal, `/api` path literal, or telemetry-sink
// call anywhere under `src/`, `app/`, or the static export in `out/`.
//
// Master prompt §2.3 policy-excludes test cases from this project -- this is
// a compile-level check, not a test: it walks real files on disk and matches
// patterns against real text, with no framework, no fixtures, and nothing
// under `tests/`. Runs in low single-digit seconds against this tree.
//
// TWO THINGS THIS PROJECT HAS ALREADY LEARNED THE HARD WAY, both load-bearing
// here:
//
// (1) A gate nobody has watched fail is not a gate. This script's own
//     Task 19 verification plants a real `fetch('https://example.com')` in a
//     scratch file, confirms this script fails on it BY NAME AND LINE, then
//     deletes the plant and confirms a clean pass again.
//
// (2) A raw grep over `out/` is not a measurement of what a reader sees.
//     task-17-report.md records that two "figures" once found in this
//     project's static export by a raw grep turned out to be React row keys
//     inside the RSC Flight payload -- not rendered content. `<script>`
//     blocks in built HTML carry the whole Flight payload, every JS chunk
//     reference, and (measured directly against this build) the framework's
//     OWN internal `fetch(e,t)` wrapper (next/dist's cookie-forwarding shim)
//     plus 24 doc/spec URLs baked into React/Next/core-js by their own
//     authors (w3.org, json-schema.org, nextjs.org error pages, react.dev,
//     core-js's LICENSE) -- none of which this app calls, controls, or can
//     meaningfully be convicted for. `out/_next/static/chunks/*.js` (the
//     bundled framework/vendor code itself) is skipped outright for the same
//     reason: it is compiled OUTPUT of `src/`+`app/`, which this script
//     already scans at the source, plus vendor code this app does not own.
//     Built HTML is scanned with every `<script>` block stripped first, so
//     what remains is what a browser actually renders and requests as page
//     content -- attributes, text, and any inline markup a reader would see.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { stripComments } from './lib/strip-comments.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function walk(dir, test, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, test, acc)
    else if (test(entry)) acc.push(full)
  }
  return acc
}

function lineOf(text, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++
  return line
}

// `fetch` and `telemetry` are anchored to call syntax (`name(`) rather than
// matched as bare words: both are ordinary vocabulary in this codebase's own
// prose -- twelve bare `fetch` occurrences describe async UI STATE
// (`src/ui/screen-state.ts`), and roughly eighty `telemetry` mentions narrate
// what the frozen source calls a device or fleet signal, none of them a real
// sink. A bare-word match would convict that prose exactly the way two
// "figures" once turned out to be React row keys (see the header above) --
// the same false-conviction shape, just lexical instead of numeric.
// `telemetry(...)` additionally allowlists the one real, legitimate call
// that contains the substring immediately followed by `(`:
// `telemetryReading()` in `src/surfaces/sa/scheduler/registry.ts`, a getter
// over simulated seed data, not a network sink.
// `XMLHttpRequest`/`WebSocket`/`EventSource`/`sendBeacon` are matched bare:
// unlike `fetch`/`telemetry`, none of these four identifiers has any
// legitimate non-network meaning in this codebase (verified: zero
// occurrences anywhere in `src`/`app` today, call or no call), so requiring
// call syntax would only narrow the net for no reason.
const PATTERNS = [
  { name: 'fetch(...) call', regex: /\bfetch\s*\(/g },
  { name: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/g },
  { name: 'WebSocket', regex: /\bWebSocket\b/g },
  { name: 'EventSource', regex: /\bEventSource\b/g },
  { name: 'sendBeacon', regex: /\bsendBeacon\b/g },
  { name: 'remote URL literal', regex: /\bhttps?:\/\/[^\s"'`)]+/g },
  { name: "'/api' path literal", regex: /(["'`])\/api(?=[/"'`])/g },
  {
    name: 'telemetry(...) call',
    regex: /[$\w]*[Tt]elemetry[$\w]*\s*\(/g,
    allow: new Set(['telemetryReading(']),
  },
]

function scanText(text, file, violations) {
  for (const { name, regex, allow } of PATTERNS) {
    regex.lastIndex = 0
    let m
    while ((m = regex.exec(text))) {
      if (!allow?.has(m[0])) {
        violations.push({ file, line: lineOf(text, m.index), name, snippet: m[0].slice(0, 60) })
      }
    }
  }
}

// See the header's item (2): every <script>...</script> block is blanked
// (newlines kept, so line numbers of anything AFTER a script block on the
// same page still line up) before the pattern scan ever sees the HTML.
function stripScriptBlocks(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (block) => block.replace(/[^\n]/g, ''))
}

const violations = []

let sourceFileCount = 0
for (const dir of ['src', 'app']) {
  const full = path.join(ROOT, dir)
  if (!existsSync(full)) continue
  for (const f of walk(full, (name) => /\.(tsx?|jsx?|mjs)$/.test(name))) {
    sourceFileCount++
    const stripped = stripComments(readFileSync(f, 'utf8'))
    scanText(stripped, path.relative(ROOT, f), violations)
  }
}

let htmlFileCount = 0
const outDir = path.join(ROOT, 'out')
if (existsSync(outDir)) {
  for (const f of walk(outDir, (name) => name.endsWith('.html'))) {
    htmlFileCount++
    const stripped = stripScriptBlocks(readFileSync(f, 'utf8'))
    scanText(stripped, path.relative(ROOT, f), violations)
  }
} else {
  console.log('scan-no-external-network: out/ not found (run `pnpm build` first) -- src/ and app/ were still scanned.')
}

if (violations.length > 0) {
  console.error(`scan-no-external-network: ${violations.length} violation(s) found\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.name}]  ${v.snippet}`)
  }
  process.exit(1)
}

console.log(
  `scan-no-external-network: 0 violations across ${sourceFileCount} source file(s) under src/+app/ and ${htmlFileCount} built HTML file(s) under out/.`,
)
