import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

const OUT = join(process.cwd(), 'out')

/**
 * A scratch probe belonging to a CONCURRENT process. `slice-04-gates` plants
 * one under `out/hub/` and `slice-2c-gates` under `out/`, both deleted as soon
 * as their own assertion finishes; this walk listing one and then statting it
 * fails a correct build on a race, not on a finding.
 * `tests/coverage/slice-2c-gates.test.ts` carries the full account.
 *
 * EXACT match, never a prefix: a prefix form would also hide a real emitted
 * file named `zz-probe.html` from this scan -- a gate walkable past by
 * choosing a filename. A leading dot and a trailing pid are both required.
 */
const isForeignProbe = (entry: string): boolean => /^\.zz-probe-(?:[a-z0-9-]+-)?\d+$/.test(entry)

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

describe('static export', () => {
  it('emits an out/ directory', () => {
    expect(existsSync(OUT)).toBe(true)
  })

  it('emits index.html and 404.html', () => {
    expect(existsSync(join(OUT, 'index.html'))).toBe(true)
    expect(existsSync(join(OUT, '404.html'))).toBe(true)
  })

  it('contains no server-only artifacts', () => {
    // Next 16 emits `_clientMiddlewareManifest.js` unconditionally under
    // `output: 'export'`, even though real middleware cannot exist there
    // (a middleware.ts source file throws at build time under static
    // export). Allowlisted by exact basename only, so any other
    // middleware-named file - any casing - still fails this check.
    const KNOWN_BENIGN = new Set(['_clientMiddlewareManifest.js'])
    const FORBIDDEN = /\/api\/|middleware|\.node$|server\.js$/i

    const files = walk(OUT)
    const forbidden = files.filter(
      (f) => !KNOWN_BENIGN.has(basename(f)) && FORBIDDEN.test(f),
    )
    expect(forbidden).toEqual([])
  })
})
