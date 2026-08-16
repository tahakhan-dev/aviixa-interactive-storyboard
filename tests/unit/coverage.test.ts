import { describe, it, expect } from 'vitest'
import { REGISTRY_DESCRIPTORS, COVERAGE_STATUSES, countByStatus } from '@/coverage/descriptors'

describe('coverage descriptors', () => {
  it('describes exactly the fourteen inventories the master prompt names', () => {
    expect(REGISTRY_DESCRIPTORS).toHaveLength(14)
    const slugs = REGISTRY_DESCRIPTORS.map((d) => d.slug)
    for (const required of [
      'modules', 'features', 'sub-features', 'functions', 'workflows',
      'business-use-cases', 'business-objects', 'events', 'commands',
      'notifications', 'offline-scenarios', 'ai-storyboards',
      'scheduled-work', 'actionable-controls',
    ]) expect(slugs, required).toContain(required)
  })

  it('uses url-safe slugs so each becomes a static route', () => {
    for (const d of REGISTRY_DESCRIPTORS) expect(d.slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('gives every descriptor a full human-readable title, never a bare identifier', () => {
    for (const d of REGISTRY_DESCRIPTORS) {
      expect(d.title.length, d.slug).toBeGreaterThan(4)
      expect(d.title, d.slug).not.toMatch(/^[A-Z]+-/)
    }
  })

  // Honest status vocabulary: nothing here reads as a production guarantee.
  it('offers four statuses and none of them claims production capability', () => {
    expect(COVERAGE_STATUSES).toHaveLength(4)
    const joined = COVERAGE_STATUSES.join(' ')
    expect(joined).not.toMatch(/\bimplemented\b/)
    expect(joined).not.toMatch(/\bcomplete\b/)
    expect(joined).toContain('not-represented')
  })

  it('counts by status with every status present even at zero', () => {
    const counts = countByStatus([{ status: 'not-represented' }, { status: 'not-represented' }])
    expect(counts['not-represented']).toBe(2)
    expect(counts['demonstrated-in-storyboard']).toBe(0)
    expect(Object.keys(counts).sort()).toEqual([...COVERAGE_STATUSES].sort())
  })

  it('carries the reconciled expected count where the source fixes one', () => {
    const modules = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'modules')
    expect(modules?.expectedCount).toBe(81)
    const workflows = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'workflows')
    // The source fixes no workflow total; 81 is the MODULE count and nothing else.
    expect(workflows?.expectedCount).toBeNull()
  })
})
