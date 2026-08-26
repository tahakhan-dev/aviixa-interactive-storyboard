#!/usr/bin/env node
// Prohibited-pattern scan for the two src/ui boundary rules (master prompt
// §8.6.2, §12.6), enforced by `local/no-cross-tree-import`
// (eslint-rules/no-cross-tree-import.mjs), configured in eslint.config.mjs.
//
// Master prompt §2.3 policy-excludes test cases from this project -- no
// `*.test.ts`, no spec file. This is a compile-level check, not a test: it
// lints known-bad and known-good source strings through ESLint's Node API
// IN MEMORY (`ESLint#lintText`) and asserts the rule fires (or does not
// fire) for each. It does NOT write scratch files and shell out to
// `pnpm lint` -- a full `pnpm lint` run costs roughly 20 seconds, and a scan
// of N cases at that cost would take minutes, which is slow enough that it
// gets skipped, and a boundary check nobody runs is worse than no check.
// `lintText` runs every case in-process against the real production config
// in well under a second combined.
//
// This rule has needed two review rounds already (task-8-report.md, "Fix
// round 1" and "Fix round 2") and every later task depends on it holding.
// This script is what keeps it holding going forward: it's wired into
// `pnpm verify` (see package.json, "check:boundary-rules").
import { ESLint } from 'eslint'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RULE = 'local/no-cross-tree-import'

const eslint = new ESLint({
  cwd: ROOT,
  overrideConfigFile: path.join(ROOT, 'eslint.config.mjs'),
})

// Each case is a virtual file (it need not exist on disk -- lintText only
// uses filePath to decide which config blocks match and to resolve relative
// specifiers) plus source text. `mustFail: true` means RULE must report at
// least one error; `mustFail: false` is a regression check -- RULE must NOT
// report, so the boundary can't quietly grow over-broad either.
const cases = [
  // --- demo restriction: relative depth, alias, dynamic import, require,
  // export *, type-only forms, case-variant path, the one-hop barrel ---
  {
    name: 'product, depth-1 relative import',
    file: 'src/ui/product/x.ts',
    code: `export { DemoChrome } from '../demo/DemoChrome'\n`,
    mustFail: true,
  },
  {
    name: 'product, depth-2 relative import (the round-1 finding)',
    file: 'src/ui/product/nested/x.ts',
    code: `export { DemoChrome } from '../../demo/DemoChrome'\n`,
    mustFail: true,
  },
  {
    name: 'product, depth-3 relative import (depth-independence)',
    file: 'src/ui/product/a/b/c.ts',
    code: `export { DemoChrome } from '../../../demo/DemoChrome'\n`,
    mustFail: true,
  },
  {
    name: 'product, @/ alias form',
    file: 'src/ui/product/x.ts',
    code: `export { DemoChrome } from '@/ui/demo/DemoChrome'\n`,
    mustFail: true,
  },
  {
    name: 'product, dynamic import()',
    file: 'src/ui/product/x.ts',
    code: `export async function load() {\n  return import('@/ui/demo/DemoChrome')\n}\n`,
    mustFail: true,
  },
  {
    name: 'product, CommonJS require()',
    file: 'src/ui/product/x.ts',
    code: `// eslint-disable-next-line @typescript-eslint/no-require-imports\nconst mod = require('../demo/DemoChrome')\nexport { mod }\n`,
    mustFail: true,
  },
  {
    name: 'product, export * from',
    file: 'src/ui/product/x.ts',
    code: `export * from '../demo/DemoChrome'\n`,
    mustFail: true,
  },
  {
    name: 'product, type-only import',
    file: 'src/ui/product/x.ts',
    code: `import type { DemoChromeProps } from '../demo/DemoChrome'\nexport type { DemoChromeProps }\n`,
    mustFail: true,
  },
  {
    name: 'product, type-only export ... from',
    file: 'src/ui/product/x.ts',
    code: `export type { DemoChromeProps } from '../demo/DemoChrome'\n`,
    mustFail: true,
  },
  {
    name: 'product, case-variant path (@/ui/Demo/... on a case-insensitive fs)',
    file: 'src/ui/product/x.ts',
    code: `export { DemoChrome } from '@/ui/Demo/DemoChrome'\n`,
    mustFail: true,
  },
  {
    name: 'one-hop barrel outside both trees (fix round 2)',
    file: 'src/ui/shared/_barrel.ts',
    code: `export { DemoChrome } from '../demo/DemoChrome'\n`,
    mustFail: true,
  },

  // --- collections restriction, nested path outside src/data ---
  {
    name: 'collections, nested path outside src/data',
    file: 'src/ui/product/nested/y.ts',
    code: `import tenants from '../../../data/collections/tenants.json'\nexport { tenants }\n`,
    mustFail: true,
  },

  // --- negatives: rule must NOT fire (a scan that only checks positives
  // can't catch the boundary becoming over-broad) ---
  {
    name: 'demo importing product is allowed',
    file: 'src/ui/demo/DemoChrome.tsx',
    code: `export { Button } from '../product/Button'\n`,
    mustFail: false,
  },
  {
    name: 'src/data importing its own collections is allowed',
    file: 'src/data/boot.ts',
    code: `import tenants from './collections/tenants.json'\nexport { tenants }\n`,
    mustFail: false,
  },

  // --- must not crash on specifiers the rule deliberately doesn't resolve ---
  {
    name: 'bare package specifier does not crash the rule',
    file: 'src/ui/product/x.ts',
    code: `import { z } from 'zod'\nexport { z }\n`,
    mustFail: false,
  },
  {
    name: 'node: builtin specifier does not crash the rule',
    file: 'src/ui/product/x.ts',
    code: `import fs from 'node:fs'\nexport { fs }\n`,
    mustFail: false,
  },
  {
    name: 'URL-shaped specifier does not crash the rule',
    file: 'src/ui/product/x.ts',
    code: `import worker from 'https://example.com/worker.js'\nexport { worker }\n`,
    mustFail: false,
  },
]

let failures = 0
for (const c of cases) {
  const filePath = path.join(ROOT, c.file)
  // Sequential (not Promise.all) for readable failure output in case order;
  // total cost is well under a second either way.
  const results = await eslint.lintText(c.code, { filePath })
  const messages = results[0]?.messages ?? []
  const fired = messages.some((m) => m.ruleId === RULE)
  const ok = fired === c.mustFail
  const label = c.mustFail ? 'must fail' : 'must pass'
  if (!ok) {
    failures++
    console.error(
      `FAIL  [${label}] ${c.name} (${c.file}) -- rule ${fired ? 'fired' : 'did not fire'}, expected ${
        c.mustFail ? 'to fire' : 'not to fire'
      }`,
    )
    for (const m of messages) console.error(`        ${m.ruleId ?? '(no ruleId)'}: ${m.message}`)
  } else {
    console.log(`ok    [${label}] ${c.name}`)
  }
}

if (failures > 0) {
  console.error(`\n${failures} of ${cases.length} boundary-rule cases failed.`)
  process.exit(1)
}
console.log(`\nall ${cases.length} boundary-rule cases passed.`)
