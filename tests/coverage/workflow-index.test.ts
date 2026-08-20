import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'out')

/**
 * A scratch probe belonging to a CONCURRENT process. `slice-04-gates` plants
 * an `index.html` under `out/hub/.zz-probe-<pid>/`, which this walk would pick
 * up as a page and then read after the sibling's `finally` deleted it -- a
 * correct build failing on a race, not on a finding.
 * `tests/coverage/slice-2c-gates.test.ts` carries the full account.
 *
 * EXACT match, never a prefix: a prefix form would also hide a real emitted
 * page under a directory named `zz-probe` -- a gate walkable past by choosing
 * a filename. A leading dot and a trailing pid are both required.
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

const PAGES = walk(OUT).filter((f) => f.endsWith('index.html') || f.endsWith('404.html'))

/**
 * BLOCKING 2 (final review): before this fix, no page in the 25-page static
 * export linked to `/workflows/` at all, and the coverage dashboard linked
 * to `/coverage/workflows/` instead -- a second, permanently-empty page for
 * the same concept. Proven against the real build output (`out/`), which is
 * what a reviewer actually navigates.
 */
describe('workflow index is reachable from the built site', () => {
  it('at least one emitted page links to /workflows/', () => {
    const linking = PAGES.filter((f) => readFileSync(f, 'utf8').includes('href="/workflows/"'))
    expect(linking.length).toBeGreaterThan(0)
  })

  it('the coverage dashboard links to /workflows/, not just /coverage/workflows/', () => {
    const dashboard = readFileSync(join(OUT, 'coverage', 'index.html'), 'utf8')
    expect(dashboard).toMatch(/href="\/workflows\/"/)
  })

  it('/coverage/workflows/ points at /workflows/ rather than duplicating an empty page', () => {
    const legacy = readFileSync(join(OUT, 'coverage', 'workflows', 'index.html'), 'utf8')
    expect(legacy).toMatch(/href="\/workflows\/"/)
  })

  it('/workflows/ renders real rows, not an empty table', () => {
    const html = readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8')
    // A stable-id-shaped row from the generated registry, not fabricated.
    expect(html).toMatch(/SB-001/)
    // Fix round 1 (defect 3): 724 composite-keyed rows now, not the retired
    // 432-row registry.
    expect((html.match(/<tr/g) ?? []).length).toBeGreaterThan(700)
  })

  it('the entry page links somewhere -- coverage, workflows and review', () => {
    const entry = readFileSync(join(OUT, 'index.html'), 'utf8')
    expect(entry).toMatch(/href="\/coverage\/"/)
    expect(entry).toMatch(/href="\/workflows\/"/)
    expect(entry).toMatch(/href="\/review\/"/)
  })

  // Count-scope discipline: the 725/724-adjacent sentence must sit right
  // next to the number, not paragraphs above it, and 724 must never be
  // labelled a workflow total. (Fix round 1, defect 3: was 432, before the
  // legacy id-only-deduped registry was retired in favour of Task 7's
  // composite-keyed one.)
  it('the 724 count sits directly next to the "no workflow total" disclaimer', () => {
    const html = readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8')
    const idx = html.indexOf('725')
    expect(idx).toBeGreaterThan(-1)
    const nearby = html.slice(idx, idx + 400)
    expect(nearby).toMatch(/MODULE count/)
    expect(nearby).toMatch(/724/)
    expect(html).not.toMatch(/724\s+workflows\b/i)
    expect(html).not.toMatch(/725\s+workflows\b/i)
  })
})
