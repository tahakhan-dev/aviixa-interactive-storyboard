import { readFileSync } from 'node:fs'
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema, type GeneratedRegistry } from '@/coverage/registry-schema'

export * from '@/coverage/registry-schema'

/**
 * Loads and validates `registries/generated/<slug>.json`. Node-only
 * (`readFileSync`) -- deliberately kept in this separate file from the pure
 * schema/types in `@/coverage/registry-schema`, so a client component can
 * import the schema without pulling `node:fs` into the browser bundle. Used
 * by Server Components (`app/coverage/[registry]/page.tsx`, `app/coverage/
 * page.tsx`) and Node-side tests/build scripts; a client component should
 * import a statically-bundled `registries/generated/<slug>.json` and
 * validate it with `loadRegistry(GeneratedRegistrySchema, raw, label)`
 * instead (see `app/workflows/WorkflowIndex.tsx`).
 */
export function loadGeneratedRegistry(slug: string): GeneratedRegistry {
  const raw: unknown = JSON.parse(readFileSync(`registries/generated/${slug}.json`, 'utf8'))
  return loadRegistry(GeneratedRegistrySchema, raw, `generated registry "${slug}"`)
}
