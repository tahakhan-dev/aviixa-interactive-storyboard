import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const SLUGS = [
  'modules', 'features', 'sub-features', 'functions', 'workflows',
  'business-use-cases', 'business-objects', 'events', 'commands',
  'notifications', 'offline-scenarios', 'ai-storyboards',
  'scheduled-work', 'actionable-controls',
] as const

const load = (s: string) => JSON.parse(readFileSync(`registries/generated/${s}.json`, 'utf8'))

describe('generated registries', () => {
  it.each(SLUGS)('%s exists and has rows', (slug) => {
    expect(existsSync(`registries/generated/${slug}.json`), slug).toBe(true)
    expect(load(slug).rows.length, slug).toBeGreaterThan(0)
  })

  it.each(SLUGS)('%s says what its number counts', (slug) => {
    const r = load(slug)
    expect(typeof r.countedThing, slug).toBe('string')
    expect(r.countedThing.length, slug).toBeGreaterThan(8)
  })

  it.each(SLUGS)('%s gives every row a source line locator', (slug) => {
    for (const row of load(slug).rows) expect(typeof row.sourceLine, `${slug}/${row.id}`).toBe('number')
  })

  // The reconciliation this project spent a full extraction wave establishing.
  it('ships the RECONCILED module count, not the raw key count', () => {
    const r = load('modules')
    expect(r.reconciledCount).toBe(81)
    expect(r.rows).toHaveLength(81)
    expect(r.dedupRule.length).toBeGreaterThan(10)
  })

  it('records where the source fixes no total at all', () => {
    for (const slug of ['workflows', 'events', 'notifications']) {
      expect(load(slug).sourceFixesNoTotal, slug).toBe(true)
    }
    expect(load('modules').sourceFixesNoTotal).toBe(false)
  })

  it('carries the reconciled counts the source does fix', () => {
    expect(load('business-objects').reconciledCount).toBe(99)
    expect(load('offline-scenarios').reconciledCount).toBe(70)
  })

  it('shows both figures whenever raw and reconciled differ', () => {
    for (const slug of SLUGS) {
      const r = load(slug)
      if (r.reconciledCount != null && r.reconciledCount !== r.rawCount) {
        expect(r.dedupRule, slug).toBeTruthy()
      }
    }
  })

  it('is deterministic — rows sorted by id, byte-identical across runs', () => {
    for (const slug of SLUGS) {
      const ids = load(slug).rows.map((x: { id: string }) => x.id)
      expect([...ids], slug).toEqual([...ids].sort())
    }
  })

  // Invariant 5: no ambient Date.now()/Math.random() anywhere in the
  // generator, proven directly rather than assumed -- rebuilding from the
  // same committed inputs must reproduce the exact same bytes on disk.
  it('rebuilding from the same raw inputs reproduces byte-identical files', () => {
    const before = Object.fromEntries(SLUGS.map((slug) => [slug, readFileSync(`registries/generated/${slug}.json`, 'utf8')]))
    execFileSync('node', ['scripts/build-registries.mjs'], { cwd: process.cwd() })
    for (const slug of SLUGS) {
      const after = readFileSync(`registries/generated/${slug}.json`, 'utf8')
      expect(after, slug).toBe(before[slug])
    }
  })
})

describe('composite keys stop distinct workflows collapsing', () => {
  const wf = () => load('workflows')

  it('no row now stands for more than five raw entries', () => {
    const worst = Math.max(...wf().rows.map((r: { collapsedFrom?: number }) => r.collapsedFrom ?? 1))
    expect(worst).toBeLessThanOrEqual(5)
  })

  it('the 199-entry unnumbered row is gone', () => {
    const un = wf().rows.filter((r: { id: string }) => r.id.startsWith('unnumbered'))
    for (const r of un) expect(r.collapsedFrom ?? 1).toBeLessThanOrEqual(5)
  })

  it('still represents every raw entry — none dropped', () => {
    const total = wf().rows.reduce((n: number, r: { collapsedFrom?: number }) => n + (r.collapsedFrom ?? 1), 0)
    expect(total).toBe(725)
  })

  it('composite keys stay unique', () => {
    const ids = wf().rows.map((r: { id: string }) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('still records the source fixes no workflow total', () => {
    expect(wf().sourceFixesNoTotal).toBe(true)
    expect(wf().reconciledCount).toBeNull()
  })
})

// Fix round 1: actionable-controls was keyed on DNC-* (the do-not-use-cron
// register — scheduling policy). The real actionable controls are the
// semantic `controls[]` extraction (759 raw entries: label/surface/
// module_id/allowed_roles/effect/line), deduped by label to 608 per spec
// §2.10. DNC-* is a real, separate, reconciled inventory (22) that gets its
// own clearly labelled section on the same index, not the whole slug.
describe('actionable controls is the UI-action catalogue, not the do-not-cron register', () => {
  it('counts the semantic controls extraction (608 of 759), not DNC-*', () => {
    const r = load('actionable-controls')
    expect(r.reconciledCount).toBe(608)
    expect(r.rawCount).toBe(759)
  })

  it('discloses the DNC-01..DNC-22 register separately, labelled, never merged into the 608', () => {
    const r = load('actionable-controls')
    const dnc = r.rows.filter((row: { id: string }) => row.id.startsWith('DNC-'))
    const controls = r.rows.filter((row: { id: string }) => !row.id.startsWith('DNC-'))
    expect(dnc).toHaveLength(22)
    expect(controls).toHaveLength(608)
    for (const row of dnc) expect(row.register, row.id).toMatch(/do-not-use-cron/i)
    for (const row of controls) expect(row.register, row.id).not.toMatch(/do-not-use-cron/i)
  })

  // Minor (final review): every one of the 608 control rows set `id:
  // c.label` but never `label: c.label` -- so the ID column rendered the
  // label text and the Name column rendered "—" for all 608 rows.
  it('each of the 608 control rows carries the same text as both id and label', () => {
    const r = load('actionable-controls')
    const controls = r.rows.filter((row: { id: string }) => !row.id.startsWith('DNC-'))
    for (const row of controls) expect(row.label, row.id).toBe(row.id)
  })
})

// Fix round 1: ai-storyboards scoped to SB-AI-* only (48 of 613 SB-*
// identifiers), silently dropping the other 565 — the same defect the
// addendum named for the 20 unjoinable FUNC- ids, just unaddressed here.
// Every SB-* identifier must render, tagged with which register it belongs
// to, never dropped.
describe('ai-storyboards discloses every SB-* register, not only SB-AI-*', () => {
  it('renders all 613 SB-* identifiers, not just the 48 SB-AI-* ones', () => {
    const r = load('ai-storyboards')
    expect(r.rows).toHaveLength(613)
    expect(r.rawCount).toBe(613)
  })

  it('labels every row with which register it belongs to', () => {
    const r = load('ai-storyboards')
    for (const row of r.rows) expect(typeof row.register, row.id).toBe('string')
    const registers = new Set(r.rows.map((row: { register: string }) => row.register))
    expect(registers.size).toBeGreaterThanOrEqual(4)
  })

  it('still keeps the SB-AI-* AI/fallback storyboards separately labelled (48)', () => {
    const r = load('ai-storyboards')
    const ai = r.rows.filter((row: { id: string }) => row.id.startsWith('SB-AI-'))
    expect(ai).toHaveLength(48)
  })
})
