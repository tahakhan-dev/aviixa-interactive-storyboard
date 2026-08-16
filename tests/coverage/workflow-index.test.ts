import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
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
    expect((html.match(/<tr/g) ?? []).length).toBeGreaterThan(400)
  })

  it('the entry page links somewhere -- coverage, workflows and review', () => {
    const entry = readFileSync(join(OUT, 'index.html'), 'utf8')
    expect(entry).toMatch(/href="\/coverage\/"/)
    expect(entry).toMatch(/href="\/workflows\/"/)
    expect(entry).toMatch(/href="\/review\/"/)
  })

  // Count-scope discipline: the 432-adjacent sentence must sit right next
  // to the number, not paragraphs above it, and 432 must never be labelled
  // a workflow total.
  it('the 432 count sits directly next to the "no workflow total" disclaimer', () => {
    const html = readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8')
    const idx = html.indexOf('432')
    expect(idx).toBeGreaterThan(-1)
    const nearby = html.slice(idx, idx + 400)
    expect(nearby).toMatch(/MODULE count/)
    expect(html).not.toMatch(/432\s+workflows\b/i)
  })
})
