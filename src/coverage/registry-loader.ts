import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { loadRegistry } from '@/registry/load'
import { COVERAGE_STATUSES } from '@/coverage/descriptors'

/**
 * One row of a generated registry file (`registries/generated/<slug>.json`,
 * written by `scripts/build-registries.mjs`). Every row carries `id`,
 * `sourceLine` and `status`; everything else is optional because what a row
 * carries depends on which raw source built it:
 *
 *  - semantic-extraction rows (modules, business objects) carry
 *    `label`/`surface`/`purpose`, taken straight from the extraction;
 *  - identifier-index rows joined to a module band or surface (functions,
 *    features, sub-features) carry `moduleId` and/or `surface`;
 *  - workflow rows carry `label`, `collapsedFrom` and `idIsPlaceholder`
 *    (composite-key collapse provenance, Task 7);
 *  - the remaining identifier-index families (business use cases, events,
 *    commands, notifications, offline scenarios, AI storyboards, scheduled
 *    work, actionable controls) carry only the three required fields --
 *    the frozen source extraction never named these identifiers.
 */
export const RegistryRowSchema = z
  .object({
    id: z.string().min(1),
    sourceLine: z.number().int().nonnegative(),
    status: z.enum(COVERAGE_STATUSES),
    label: z.string().min(1).optional(),
    surface: z.string().min(1).optional(),
    purpose: z.string().min(1).optional(),
    moduleId: z.string().min(1).optional(),
    collapsedFrom: z.number().int().positive().optional(),
    idIsPlaceholder: z.boolean().optional(),
  })
  .strict()

export type RegistryRow = z.infer<typeof RegistryRowSchema>

/**
 * One of the fourteen `registries/generated/<slug>.json` files. The
 * refinement below is the type system enforcing the count-scope rule this
 * slice turns on: a registry cannot claim BOTH that the frozen source fixes
 * no total for what it counts (`sourceFixesNoTotal: true`) AND carry a
 * `reconciledCount` for that same total -- those two claims contradict each
 * other, and without this check nothing stops a future build from shipping
 * a canonical-looking number the source never actually fixed. This is the
 * single failure this slice's spec warns about most.
 */
export const GeneratedRegistrySchema = z
  .object({
    slug: z.string().min(1),
    countedThing: z.string().min(9),
    reconciledCount: z.number().int().nonnegative().nullable(),
    rawCount: z.number().int().nonnegative(),
    dedupRule: z.string().min(1).nullable(),
    sourceFixesNoTotal: z.boolean(),
    rows: z.array(RegistryRowSchema),
  })
  .strict()
  .refine((r) => !(r.sourceFixesNoTotal && r.reconciledCount !== null), {
    message:
      'sourceFixesNoTotal is true but reconciledCount is not null -- a registry cannot claim ' +
      'the source fixes no total for what it counts while also carrying a reconciledCount for it',
    path: ['reconciledCount'],
  })

export type GeneratedRegistry = z.infer<typeof GeneratedRegistrySchema>

/** Loads and validates `registries/generated/<slug>.json`. */
export function loadGeneratedRegistry(slug: string): GeneratedRegistry {
  const raw: unknown = JSON.parse(readFileSync(`registries/generated/${slug}.json`, 'utf8'))
  return loadRegistry(GeneratedRegistrySchema, raw, `generated registry "${slug}"`)
}
