import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

const SOURCE_FILES = [...walk('src'), ...walk('app')].filter((f) =>
  /\.(ts|tsx|css)$/.test(f),
)

describe('no runtime backend', () => {
  it('declares no Server Action', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /['"]use server['"]/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('ships no API route or middleware', () => {
    expect(existsSync(join('app', 'api'))).toBe(false)
    expect(existsSync('middleware.ts')).toBe(false)
  })

  it('calls no network API from application source', () => {
    const banned = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/
    const offenders = SOURCE_FILES.filter((f) => banned.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('references no external origin', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /https?:\/\/(?!localhost)/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('uses no dangerouslySetInnerHTML', () => {
    const offenders = SOURCE_FILES.filter((f) =>
      /dangerouslySetInnerHTML/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})

describe('source confidentiality', () => {
  const shipped = walk('out')

  // IMPORTANT 2: a missing or empty out/ must be a HARD FAILURE, never a
  // vacuous pass. walk() silently returns [] when out/ does not exist, which
  // let the two scans below "pass" while scanning zero files -- exactly the
  // scenario where a stale or absent build ships a leak undetected.
  it('scans a non-empty release artifact', () => {
    expect(shipped.length).toBeGreaterThan(0)
  })

  it('leaks no blueprint filename into the release artifact', () => {
    const offenders = shipped.filter((f) =>
      readFileSync(f, 'utf8').includes('AVIIXA_Production_Product_Blueprint'),
    )
    expect(offenders).toEqual([])
  })

  it('leaks no absolute author path into the release artifact', () => {
    const offenders = shipped.filter((f) => /\/Users\/[a-z]+\//i.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})
