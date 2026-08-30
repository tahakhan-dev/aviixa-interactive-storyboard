import { z } from 'zod'
import { COVERAGE_STATUSES, type CoverageStatus } from '@/coverage/descriptors'
import type { GeneratedRegistry } from '@/coverage/registry-schema'

/**
 * THE §13.1 CENSUS, IN A SHAPE A REVIEW PACKAGE CAN CARRY (audit round 4,
 * R4-B06).
 *
 * Master prompt §13.1 requires the per-surface, per-module actionable-item
 * census to be published "in the coverage dashboard, the Section 9.6 registry
 * indexes, and the review package", and §9.6 requires the reconciliation
 * table in the coverage dashboard "and the review package". The package
 * carried neither: its `coverageSnapshot` was a bare `byStatus` map with no
 * registry breakdown, no item total and no dimension at all.
 *
 * PURE, AND IT TAKES THE REGISTRIES AS AN ARGUMENT. `@/coverage/registry-
 * loader` is Node-only (`readFileSync`) and the review shell is a client
 * component, so this module must never reach for the filesystem itself — the
 * caller hands it registries it loaded whichever way it can. That is the same
 * split `@/coverage/registry-schema` already exists for.
 */
export const CensusRegistrySchema = z
  .object({
    slug: z.string().min(1),
    rows: z.number().int().nonnegative(),
    byStatus: z.record(z.string(), z.number().int().nonnegative()),
    /** R4-B04's dimensions, counted where the registry's rows carry them. */
    bySurface: z.record(z.string(), z.number().int().nonnegative()),
    byModule: z.record(z.string(), z.number().int().nonnegative()),
  })
  .strict()

export const CensusSnapshotSchema = z
  .object({
    totalRows: z.number().int().nonnegative(),
    byStatus: z.record(z.string(), z.number().int().nonnegative()),
    registries: z.array(CensusRegistrySchema),
    /**
     * Said in the artefact, because a bare set of counts invites the wrong
     * reading and this build has shipped that reading once already.
     */
    denominatorMeaning: z.string().min(60),
  })
  .strict()

export type CensusRegistry = z.infer<typeof CensusRegistrySchema>
export type CensusSnapshot = z.infer<typeof CensusSnapshotSchema>

export const CENSUS_DENOMINATOR_MEANING =
  'Item-level, never registry-level. A registry counts as demonstrated the moment any one of ' +
  'its own rows does, so a registry-level figure answers only whether this build has touched ' +
  'an inventory at all; totalRows and byStatus below answer how much of it. The two differ by a ' +
  'lot and the smaller is the honest one. demonstrated-in-storyboard means a shipped route ' +
  'screen names the row; mounted-in-another-screen means a route imports its module directory ' +
  'and it owns no route of its own; not-applicable and decision-blocked are authored terminal ' +
  'records carrying a reason, an owner and a frozen-source locator; not-represented means none ' +
  'of the four and is not a claim that the work is impossible.'

function tally(
  values: readonly (string | undefined)[],
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const v of values) {
    if (v === undefined) continue
    out[v] = (out[v] ?? 0) + 1
  }
  return out
}

/**
 * Every status key present even at zero, so a zero in the package is a
 * measured zero rather than an absent key a reader has to interpret.
 */
function statusTally(rows: readonly { readonly status: CoverageStatus }[]): Record<string, number> {
  const out = Object.fromEntries(COVERAGE_STATUSES.map((s) => [s, 0])) as Record<string, number>
  for (const row of rows) out[row.status] = (out[row.status] ?? 0) + 1
  return out
}

export function buildCensusSnapshot(
  registries: readonly GeneratedRegistry[],
): CensusSnapshot {
  const allRows = registries.flatMap((r) => r.rows)
  return {
    totalRows: allRows.length,
    byStatus: statusTally(allRows),
    registries: registries.map((r) => ({
      slug: r.slug,
      rows: r.rows.length,
      byStatus: statusTally(r.rows),
      bySurface: tally(r.rows.map((row) => row.surface)),
      byModule: tally(r.rows.map((row) => row.moduleId ?? row.moduleDescriptor)),
    })),
    denominatorMeaning: CENSUS_DENOMINATOR_MEANING,
  }
}
