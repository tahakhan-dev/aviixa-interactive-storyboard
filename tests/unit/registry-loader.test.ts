import { describe, it, expect } from 'vitest'
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema, loadGeneratedRegistry } from '@/coverage/registry-loader'

const SLUGS = [
  'modules', 'features', 'sub-features', 'functions', 'workflows',
  'business-use-cases', 'business-objects', 'events', 'commands',
  'notifications', 'offline-scenarios', 'ai-storyboards',
  'scheduled-work', 'actionable-controls',
] as const

/**
 * Every fixture below must carry `sourceLineMeaning`, and the reason is the
 * last case in this file rather than tidiness.
 *
 * The field became required when the generated registries started stating what
 * their own `sourceLine` holds — the first mention of an identifier, not the
 * line that defines it. Without it here, the reconciledCount case stopped
 * failing on its own refinement and started failing on a missing field
 * instead: still red, still for a plausible-looking reason, and **no longer
 * testing the thing it names.** A green-to-red change can hide a gate as
 * thoroughly as a red-to-green one.
 */
const FIXTURE_SOURCE_LINE_MEANING =
  'The first mention of the identifier anywhere in the frozen source, not the line that defines it.'

const FIXTURE_NAMED_MEANING =
  'How many rows are named anywhere under src/ or app/ — weaker than a status and not one.'

/**
 * Added with `routeResolvedCount`/`routeMeaning` when R4-B10 made both
 * required, and for exactly the reason the paragraph above gives about
 * `sourceLineMeaning`: without them the reconciledCount case below stopped
 * failing on its own refinement and started failing on two missing fields —
 * still red, still plausible, and no longer testing the thing it names.
 */
const FIXTURE_ROUTE_MEANING =
  'The shipped screen whose evidence set this row’s status, or absent when nothing resolves one.'

/** The five fields every fixture needs before it can exercise a refinement. */
const REQUIRED_META = {
  sourceLineMeaning: FIXTURE_SOURCE_LINE_MEANING,
  namedInSourceCount: 0,
  namedInSourceMeaning: FIXTURE_NAMED_MEANING,
  routeResolvedCount: 0,
  routeMeaning: FIXTURE_ROUTE_MEANING,
}

describe('generated registry loading', () => {
  it('loads every one of the fourteen', () => {
    for (const slug of SLUGS) expect(loadGeneratedRegistry(slug).rows.length).toBeGreaterThan(0)
  })

  it('REJECTS an unknown field rather than ignoring it', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'modules', countedThing: 'canonical modules', reconciledCount: 81,
        rawCount: 92, dedupRule: 'x', sourceFixesNoTotal: false, rows: [],
        ...REQUIRED_META,
        unexpected: 'from a newer schema',
      }, 'generated registry'),
    ).toThrow(/unexpected|unrecognized/i)
  })

  it('rejects a row with no source line', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'modules', countedThing: 'canonical modules', reconciledCount: 81,
        rawCount: 92, dedupRule: 'x', sourceFixesNoTotal: false,
        ...REQUIRED_META,
        rows: [{ id: 'MOD-SA-01', label: 'Overview' }],
      }, 'generated registry'),
    ).toThrow()
  })

  it('rejects a reconciled count on a registry declaring the source fixes no total', () => {
    expect(() =>
      loadRegistry(GeneratedRegistrySchema, {
        slug: 'workflows', countedThing: 'extracted records', reconciledCount: 432,
        rawCount: 725, dedupRule: 'x', sourceFixesNoTotal: true, rows: [],
        ...REQUIRED_META,
      }, 'generated registry'),
    ).toThrow(/no total|reconciledCount/i)
  })
})
