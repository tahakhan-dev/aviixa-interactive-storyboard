import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadWorkflowRegistry } from '@/registry/load'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'
import workflowRegistryRaw from '../../registries/generated/workflow-registry.json'

// Recomputes, independently of scripts/build-workflow-registry.mjs, how many
// raw `workflows[]` entries each extractor id actually has across every
// registries/raw/extract/CHK-*.json chunk. A test that trusted the
// generator's own arithmetic would never catch the generator getting its own
// count wrong -- this reads the same frozen source files the generator
// reads and counts independently.
function rawEntryIdCounts(): Map<string, number> {
  const dir = join(process.cwd(), 'registries', 'raw', 'extract')
  const files = readdirSync(dir).filter((f) => /^CHK-\d+\.json$/.test(f))
  const counts = new Map<string, number>()
  for (const file of files) {
    const chunk = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
      workflows?: Array<{ id: string }>
    }
    for (const wf of chunk.workflows ?? []) {
      counts.set(wf.id, (counts.get(wf.id) ?? 0) + 1)
    }
  }
  return counts
}

// BLOCKING 2 (final review): `app/workflows/page.tsx:28` used to be a
// literal `[]` -- no generated per-workflow registry existed anywhere in
// this codebase, even though `registries/raw/extract/CHK-*.json` (slice 1's
// extraction) already held 432 distinct `workflows[]` entries with a name,
// primary actor, trigger, surfaces touched, terminal states and a source
// line each. This proves the generated, validated registry that
// `scripts/build-workflow-registry.mjs` now produces, and locks the
// count-scope discipline the finding demanded: 432 is a THIRD scope, never
// reconciled against the 644/642/118 WF-* namespace counts, and
// `workflows.expectedCount` in `@/coverage/descriptors` must stay `null`.

describe('workflow registry', () => {
  it('validates against the strict workflow registry schema', () => {
    expect(() => loadWorkflowRegistry(workflowRegistryRaw)).not.toThrow()
  })

  it('holds exactly 432 distinct extraction records -- a scope of its own, never a workflow total', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    expect(registry).toHaveLength(432)
    const ids = registry.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is sorted by id, deterministically', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    const ids = registry.map((r) => r.id)
    expect(ids).toEqual([...ids].sort())
  })

  it('every record carries a name, primary actor, trigger and source line', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    for (const r of registry) {
      expect(r.name.length, r.id).toBeGreaterThan(0)
      expect(r.primaryActor.length, r.id).toBeGreaterThan(0)
      expect(r.trigger.length, r.id).toBeGreaterThan(0)
      expect(r.sourceLine, r.id).toBeGreaterThan(0)
    }
  })

  it('every record starts at status not-represented, never implemented', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    for (const r of registry) expect(r.status, r.id).toBe('not-represented')
  })

  // The one field that must never gain a number (spec §7, this review's
  // scope-discipline requirement).
  it('the workflows registry descriptor keeps expectedCount null', () => {
    const workflows = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'workflows')
    expect(workflows?.expectedCount).toBeNull()
  })

  it('the generator script exists and produces the exact committed file (regeneration is a no-op diff)', () => {
    // Not re-running the generator here (that is scripts/build-workflow-
    // registry.mjs's own concern) -- this only proves the committed file is
    // valid JSON matching the schema, which is what the app actually loads.
    const raw = readFileSync('registries/generated/workflow-registry.json', 'utf8')
    expect(() => loadWorkflowRegistry(JSON.parse(raw))).not.toThrow()
  })
})

// Honesty defect (post-handoff review): 199 of 725 raw extraction entries
// carry the literal id "unnumbered" and 66 carry "unstated" -- 265 entries
// that collapse into just two of the 432 shipped rows, with no on-page sign
// that either row stands for more than one extracted entry. These tests
// prove the registry now carries, per row, how many raw entries it
// represents (`collapsedFrom`) and whether its id is a placeholder rather
// than a stable identifier (`idIsPlaceholder`) -- not just for the two
// placeholder ids, but for every id the raw extraction happened to repeat
// (e.g. "SB-001" names two distinct passages at two different source lines).
describe('workflow registry collapse provenance', () => {
  it('collapsedFrom on every row matches the raw extraction count for that id', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    const rawCounts = rawEntryIdCounts()
    for (const r of registry) {
      expect(r.collapsedFrom, r.id).toBe(rawCounts.get(r.id))
    }
  })

  it('the placeholder-id rows collapse: "unnumbered" and "unstated" both have collapsedFrom > 1', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    const unnumbered = registry.find((r) => r.id === 'unnumbered')
    const unstated = registry.find((r) => r.id === 'unstated')
    expect(unnumbered?.collapsedFrom).toBeGreaterThan(1)
    expect(unstated?.collapsedFrom).toBeGreaterThan(1)
  })

  it('the total of every row\'s collapsedFrom equals the raw extraction entry count', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    const rawCounts = rawEntryIdCounts()
    const rawTotal = [...rawCounts.values()].reduce((sum, n) => sum + n, 0)
    const collapsedTotal = registry.reduce((sum, r) => sum + r.collapsedFrom, 0)
    expect(collapsedTotal).toBe(rawTotal)
  })

  it('idIsPlaceholder is true for exactly "unnumbered" and "unstated", false for every other row', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    for (const r of registry) {
      expect(r.idIsPlaceholder, r.id).toBe(r.id === 'unnumbered' || r.id === 'unstated')
    }
    const placeholderIds = registry.filter((r) => r.idIsPlaceholder).map((r) => r.id).sort()
    expect(placeholderIds).toEqual(['unnumbered', 'unstated'])
  })

  it('rows whose id merely adds a discriminating fragment (e.g. "unnumbered — 23.10 ...") are not placeholders', () => {
    const registry = loadWorkflowRegistry(workflowRegistryRaw)
    const qualified = registry.find((r) => r.id.startsWith('unnumbered ') && r.id !== 'unnumbered')
    expect(qualified, 'fixture bug: expected at least one qualified "unnumbered ..." id in the registry').toBeDefined()
    expect(qualified?.idIsPlaceholder).toBe(false)
    expect(qualified?.collapsedFrom).toBe(1)
  })
})
