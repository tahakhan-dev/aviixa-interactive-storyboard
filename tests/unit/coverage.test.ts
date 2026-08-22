import { describe, it, expect } from 'vitest'
import {
  REGISTRY_DESCRIPTORS,
  COVERAGE_STATUSES,
  countByStatus,
  SOURCE_CLASSES,
  BUILD_CLASSES,
  countByClass,
} from '@/coverage/descriptors'
import { loadGeneratedRegistry } from '@/coverage/registry-loader'

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
  //
  // Five since `mounted-in-another-screen` joined it. That status names the
  // EVIDENCE like the other four — a route file imports the module directory —
  // rather than a claim about completeness, which is what this case exists to
  // keep out. It was added because the four could not tell a module that is
  // built and on screen apart from one with no code at all, and both read
  // `not-represented`; measured, that understated the build by seven modules.
  it('offers five statuses and none of them claims production capability', () => {
    expect(COVERAGE_STATUSES).toHaveLength(5)
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

// Task 10: eight count classes, orthogonal to the four-value implementation
// status. The five source classes say what the frozen source claims about
// an item; the three build classes say what this build did with it.
describe('the eight count classes', () => {
  it('splits five source classes from three build classes', () => {
    expect(SOURCE_CLASSES).toHaveLength(5)
    expect(BUILD_CLASSES).toHaveLength(3)
  })

  it('keeps them orthogonal — an item can be source-defined AND not built', () => {
    const c = countByClass([{ sourceClass: 'source-defined', buildClass: 'not-applicable' }])
    expect(c.source['source-defined']).toBe(1)
    expect(c.build['not-applicable']).toBe(1)
  })

  it('returns every key even at zero', () => {
    const c = countByClass([])
    expect(Object.keys(c.source).sort()).toEqual([...SOURCE_CLASSES].sort())
    expect(Object.keys(c.build).sort()).toEqual([...BUILD_CLASSES].sort())
    for (const v of Object.values(c.source)) expect(v).toBe(0)
  })

  it('does not collapse the build class into the status vocabulary', () => {
    expect([...BUILD_CLASSES]).not.toEqual([...COVERAGE_STATUSES])
  })

  // Addendum §5: Tasks 9 and 10 are coupled. 18 of the 81 modules are
  // Derived Clarification under DEC-STUDIO-001 and may never be presented
  // as source-backed — the modules index renders 63 source-defined + 18
  // derived = 81, from a STRUCTURED field on each row, never parsed out of
  // RegistryDescriptor.sourceNote prose.
  it('the generated modules registry classifies 63 source-defined and 18 derived, from a structured field', () => {
    const modules = loadGeneratedRegistry('modules')
    const counted = countByClass(modules.rows)
    expect(counted.source['source-defined']).toBe(63)
    expect(counted.source.derived).toBe(18)
    expect(counted.source['source-defined'] + counted.source.derived).toBe(81)
  })
})
