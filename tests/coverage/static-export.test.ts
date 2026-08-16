import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

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
    const files = walk(OUT)
    const forbidden = files.filter((f) =>
      /\/api\/|middleware|\.node$|server\.js$/.test(f),
    )
    expect(forbidden).toEqual([])
  })
})
