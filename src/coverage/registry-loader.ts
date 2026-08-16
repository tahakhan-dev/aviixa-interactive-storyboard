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
 *    (composite-key collapse provenance, Task 7), PLUS the workflow-only
 *    extension fields `primaryActor`, `trigger`, `surfacesTouched` and
 *    `terminalStates` (fix round 2, §0): consolidating every registry onto
 *    one shared row shape flattened workflows to the lowest common
 *    denominator and silently dropped these, which slice 2b spec §7
 *    requires on the Workflow Index and Task 11's surface/actor filters
 *    need on the row to filter by at all. A common core plus typed,
 *    optional, per-inventory extension fields -- never a widened
 *    `Record<string, unknown>` to make one inventory's richer shape fit;
 *  - the remaining identifier-index families (business use cases, events,
 *    commands, notifications, offline scenarios, scheduled work) carry only
 *    the three required fields -- the frozen source extraction never named
 *    these identifiers;
 *  - a file that honestly holds more than one distinct sub-inventory
 *    (`ai-storyboards`: four separate SB-* registers; `actionable-controls`:
 *    the 608-row UI-control catalogue plus the separate 22-row DNC-*
 *    do-not-use-cron register) tags every row with `register`, naming which
 *    sub-inventory it belongs to, so nothing is silently merged or dropped.
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
    register: z.string().min(1).optional(),
    // Workflow-only extension fields (fix round 2, §0).
    primaryActor: z.string().min(1).optional(),
    trigger: z.string().min(1).optional(),
    surfacesTouched: z.array(z.string()).optional(),
    terminalStates: z.array(z.string()).optional(),
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
