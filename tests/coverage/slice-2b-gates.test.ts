import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments'

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}
const SRC = walk('src').filter((f) => /\.tsx?$/.test(f))
const UI = SRC.filter((f) => f.includes(`${'src'}/ui/`) || f.includes(`${'src'}/coverage/`))
const APP = walk('app').filter((f) => /\.tsx?$/.test(f))

describe('slice 2b gates', () => {
  // Only the gateway may mutate.
  //
  // Scoped to `src/ui/`, `src/coverage/` and `app/` -- NOT all of `src/` --
  // because `src/scenario/gateway.ts` is required to import both `reduce`
  // and `commitTransition`: that file's own header comment states it is
  // deliberately the ONE exception, never the first of many. Widening this
  // gate to walk all of `src/` (including `src/scenario/`) would fail on
  // gateway.ts's correct, necessary imports. If a future change needs to
  // widen this gate's scope, widen it to exempt `src/scenario/gateway.ts`
  // by name, never to permit these imports generally.
  it('no component imports reduce or commitTransition', () => {
    const offenders = [...UI, ...APP].filter((f) => {
      const s = stripComments(readFileSync(f, 'utf8'))
      return /from\s+['"]@\/kernel\/reduce['"]|from\s+['"]@\/persistence\/coordinator['"]/.test(s)
    })
    expect(offenders).toEqual([])
  })

  // A review action creates a ReviewEvent and nothing else.
  it('review modules import no product ledger writer', () => {
    const review = SRC.filter((f) => f.includes(`${'src'}/review/`))
    const offenders = review.filter((f) => {
      const s = stripComments(readFileSync(f, 'utf8'))
      return /commitTransition|from\s+['"]@\/kernel\//.test(s)
    })
    expect(offenders).toEqual([])
  })

  // Memory has no export path at V1.
  it('the exporter references no memory data class', () => {
    const s = stripComments(readFileSync('src/review/package.ts', 'utf8'))
    expect(s).not.toMatch(/\bmemoryRecords\b|\bMemoryRecord\b/)
  })

  it('review status vocabulary contains no approval word', () => {
    const s = readFileSync('src/review/records.ts', 'utf8')
    const block = s.slice(s.indexOf('REVIEW_STATUSES'))
    expect(block.slice(0, 300)).not.toMatch(/'approved'/)
  })
})
