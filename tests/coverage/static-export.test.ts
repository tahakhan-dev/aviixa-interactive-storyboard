import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

const OUT = join(process.cwd(), 'out')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
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
