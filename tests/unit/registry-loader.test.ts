import { describe, it, expect } from 'vitest'
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema, loadGeneratedRegistry } from '@/coverage/registry-loader'

const SLUGS = [
  'modules', 'features', 'sub-features', 'functions', 'workflows',
  'business-use-cases', 'business-objects', 'events', 'commands',
  'notifications', 'offline-scenarios', 'ai-storyboards',
  'scheduled-work', 'actionable-controls',
] as const

describe('generated registry loading', () => {
  it('loads every one of the fourteen', () => {
    for (const slug of SLUGS) expect(loadGeneratedRegistry(slug).rows.length).toBeGreaterThan(0)
  })

  it('REJECTS an unknown field rather than ignoring it', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'modules', countedThing: 'canonical modules', reconciledCount: 81,
        rawCount: 92, dedupRule: 'x', sourceFixesNoTotal: false, rows: [],
        unexpected: 'from a newer schema',
      }, 'generated registry'),
    ).toThrow(/unexpected|unrecognized/i)
  })

  it('rejects a row with no source line', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'modules', countedThing: 'canonical modules', reconciledCount: 81,
        rawCount: 92, dedupRule: 'x', sourceFixesNoTotal: false,
        rows: [{ id: 'MOD-SA-01', label: 'Overview' }],
      }, 'generated registry'),
    ).toThrow()
  })

  it('rejects a reconciled count on a registry declaring the source fixes no total', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'workflows', countedThing: 'extracted records', reconciledCount: 432,
        rawCount: 725, dedupRule: 'x', sourceFixesNoTotal: true, rows: [],
      }, 'generated registry'),
    ).toThrow(/no total|reconciledCount/i)
  })
})
