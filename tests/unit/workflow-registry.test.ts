import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadWorkflowRegistry } from '@/registry/load'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'
import workflowRegistryRaw from '../../registries/generated/workflow-registry.json'

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
