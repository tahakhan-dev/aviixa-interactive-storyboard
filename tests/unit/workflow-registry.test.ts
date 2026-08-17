import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadGeneratedRegistry } from '@/coverage/registry-loader'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'

// Recomputes, independently of scripts/build-registries.mjs, how many raw
// `workflows[]` entries each extractor id/line pair actually has across
// every registries/raw/extract/CHK-*.json chunk. A test that trusted the
// generator's own arithmetic would never catch the generator getting its own
// count wrong -- this reads the same frozen source files the generator
// reads and counts independently.
function rawEntryCount(): number {
  const dir = join(process.cwd(), 'registries', 'raw', 'extract')
  const files = readdirSync(dir).filter((f) => /^CHK-\d+\.json$/.test(f))
  let total = 0
  for (const file of files) {
    const chunk = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
      workflows?: Array<{ id: string }>
    }
    total += (chunk.workflows ?? []).length
  }
  return total
}

// Fix round 1 (defect 3): the legacy registries/generated/workflow-
// registry.json (432 rows, id-only-deduped) and scripts/build-workflow-
// registry.mjs are retired -- two registries existed for one inventory, and
// app/workflows/page.tsx + app/coverage/page.tsx read the legacy one, so
// Task 7's composite-key fix (registries/generated/workflows.json, 724
// rows) reached no screen. This file now tests the ONE workflows registry,
// through the same GeneratedRegistrySchema loader every other registry
// uses, replacing the assertions this file used to make against the
// retired 432-row file.
describe('workflow registry', () => {
  it('validates against the strict generated-registry schema', () => {
    expect(() => loadGeneratedRegistry('workflows')).not.toThrow()
  })

  it('holds exactly 724 composite-keyed rows -- a scope of its own, never a workflow total', () => {
    const registry = loadGeneratedRegistry('workflows')
    expect(registry.rows).toHaveLength(724)
    expect(registry.rawCount).toBe(725)
    const ids = registry.rows.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is sorted by id, deterministically', () => {
    const registry = loadGeneratedRegistry('workflows')
    const ids = registry.rows.map((r) => r.id)
    expect(ids).toEqual([...ids].sort())
  })

  it('every record carries a name and a source line', () => {
    const registry = loadGeneratedRegistry('workflows')
    for (const r of registry.rows) {
      expect((r.label ?? '').length, r.id).toBeGreaterThan(0)
      expect(r.sourceLine, r.id).toBeGreaterThan(0)
    }
  })

  it('every record starts at status not-represented, never implemented', () => {
    const registry = loadGeneratedRegistry('workflows')
    for (const r of registry.rows) expect(r.status, r.id).toBe('not-represented')
  })

  // The one field that must never gain a number (spec §7, this review's
  // scope-discipline requirement).
  it('the workflows registry descriptor keeps expectedCount null', () => {
    const workflows = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'workflows')
    expect(workflows?.expectedCount).toBeNull()
  })

  it('the generator script exists and produces the exact committed file (regeneration is a no-op diff)', () => {
    const raw = readFileSync('registries/generated/workflows.json', 'utf8')
    expect(() => JSON.parse(raw)).not.toThrow()
  })

  // Fix round 2, §0: consolidating onto GeneratedRegistrySchema (fix round
  // 1) flattened every row to the lowest common denominator across all
  // fourteen registries, silently dropping the spec §7 columns
  // (primaryActor, trigger, surfacesTouched, terminalStates) the legacy
  // WorkflowRecordSchema used to carry -- a regression the coordinator, not
  // the implementer, is on record owning. Restored as workflow-only
  // extension fields on the shared RegistryRow shape, not a widened
  // Record<string, unknown>.
  it('carries back the spec §7 columns the consolidation dropped: primaryActor, trigger, surfacesTouched, terminalStates', () => {
    const registry = loadGeneratedRegistry('workflows')
    for (const r of registry.rows) {
      expect((r.primaryActor ?? '').length, r.id).toBeGreaterThan(0)
      expect((r.trigger ?? '').length, r.id).toBeGreaterThan(0)
      expect(Array.isArray(r.surfacesTouched), r.id).toBe(true)
      expect(Array.isArray(r.terminalStates), r.id).toBe(true)
    }
    const valuestream = registry.rows.find((r) => r.id === 'WF-VALUESTREAM')
    expect(valuestream?.primaryActor).toMatch(/Quality Manager/)
    expect(valuestream?.surfacesTouched).toContain('SURF-STU')
  })
})

// Honesty defect (post-handoff review), fixed a second time by Task 7's
// composite key: 199 of 725 raw extraction entries used to carry the
// literal id "unnumbered" and 66 "unstated", collapsing into just two of
// the legacy 432 rows with no on-page sign either row stood for more than
// one extracted entry. Composite keying (`${id}@L${sourceLine}` whenever the
// id is a placeholder or repeats at more than one line) leaves at most one
// genuine duplicate pair standing; these tests prove that directly against
// the raw extraction, not against the generator's own claim.
describe('workflow registry collapse provenance', () => {
  it('collapsedFrom sums to the total raw extraction entry count', () => {
    const registry = loadGeneratedRegistry('workflows')
    const collapsedTotal = registry.rows.reduce((sum, r) => sum + (r.collapsedFrom ?? 1), 0)
    expect(collapsedTotal).toBe(rawEntryCount())
    expect(collapsedTotal).toBe(725)
  })

  it('worst residual collapse is 2, exactly once', () => {
    const registry = loadGeneratedRegistry('workflows')
    const collapsed = registry.rows.filter((r) => (r.collapsedFrom ?? 1) > 1)
    expect(collapsed).toHaveLength(1)
    expect(collapsed[0]?.collapsedFrom).toBe(2)
    expect(collapsed[0]?.id).toBe('unnumbered@L74182')
  })

  it('idIsPlaceholder is true only for rows whose original id was "unnumbered" or "unstated"', () => {
    const registry = loadGeneratedRegistry('workflows')
    for (const r of registry.rows) {
      const placeholderId = r.id === 'unnumbered' || r.id === 'unstated'
        || r.id.startsWith('unnumbered@L') || r.id.startsWith('unstated@L')
      expect(r.idIsPlaceholder ?? false, r.id).toBe(placeholderId)
    }
  })

  it('a real, unique id (e.g. "WF-VALUESTREAM") keeps its bare form and is not a placeholder', () => {
    const registry = loadGeneratedRegistry('workflows')
    const row = registry.rows.find((r) => r.id === 'WF-VALUESTREAM')
    expect(row, 'fixture bug: expected WF-VALUESTREAM in the registry').toBeDefined()
    expect(row?.idIsPlaceholder ?? false).toBe(false)
    expect(row?.collapsedFrom ?? 1).toBe(1)
  })
})
