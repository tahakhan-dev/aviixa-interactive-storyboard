#!/usr/bin/env node
// Prohibited-pattern scan for a real, already-observed defect class: a
// silently-swallowed error (e.g. an unhandled `notFound()`) shipping as
// Next's own generic `__next_error__` fallback shell instead of the page
// that was supposed to build. task-17-report.md names the exact incident
// this guards: `params.workflowId` produced 724 pages that silently 404'd
// as this fallback shell, discovered by a live-Chrome pass, not by any gate
// -- "no gate at all today, not even a test" at the time that report was
// written. `grep -rl 'id="__next_error__"' out/ --include=*.html` is the
// one-off command that report already used by hand to confirm the fix; this
// wires that exact check into something that runs every time.
//
// Master prompt §2.3 policy-excludes test cases; this is a compile-level
// scan over the real static export in out/, not a test, and lives outside
// tests/. No exemption list: the standing measurement this scan enforces is
// "zero anywhere in out/, custom error pages included" (task-17-report.md),
// so a bare grep with no allowlist is the whole check.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'out')

function walkHtml(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walkHtml(full, acc)
    else if (entry.endsWith('.html')) acc.push(full)
  }
  return acc
}

if (!existsSync(OUT)) {
  console.log('scan-no-fallback-shells: out/ not found (run `pnpm build` first) -- nothing to scan.')
  process.exit(0)
}

const offenders = []
const files = walkHtml(OUT)
for (const f of files) {
  if (readFileSync(f, 'utf8').includes('id="__next_error__"')) {
    offenders.push(path.relative(ROOT, f))
  }
}

if (offenders.length > 0) {
  console.error(`scan-no-fallback-shells: ${offenders.length} page(s) shipped as the generic Next.js error fallback shell instead of real content:\n`)
  for (const f of offenders) console.error(`  ${f}`)
  process.exit(1)
}

console.log(`scan-no-fallback-shells: 0 fallback shells across ${files.length} built HTML file(s) under out/.`)
