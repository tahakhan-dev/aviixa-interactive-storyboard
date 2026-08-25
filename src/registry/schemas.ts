import { z } from 'zod'

/**
 * Every schema here is `.strict()`. An unknown field in source-derived data
 * is the signature of a version mismatch between the extraction that
 * produced a registry file and the code reading it — never a field to
 * silently drop.
 */

/**
 * The frozen source's own classification legend, plus one qualified form the
 * source also writes. No other string is a valid classification.
 *
 * The legend is a seven-row table: intro L14-L15, header L17, separator L18,
 * body L19-L25. Its seven labels are the first, second, fourth, fifth, sixth
 * and seventh entries below plus `Recommendation — R&D`. The third entry,
 * `Derived Clarification — adopted working position`, is NOT a legend row —
 * it is a qualified form the source writes on 254 lines and the raw module
 * extraction carries, so it is admitted and labelled as what it is.
 *
 * SLICE 10 TASK 13 — THIS ARRAY USED TO CALL ITSELF "the exact seven source
 * classification labels (frozen source vocabulary)" AND WAS WRONG ABOUT TWO
 * OF THEM, IN OPPOSITE DIRECTIONS. Measured whole-string in the frozen
 * source: `Recommendation — Research and Development`, which this array
 * listed, occurs on ZERO lines; `Recommendation — R&D`, which the legend
 * writes, occurs on 957 and was absent here; `User-Mandated Product
 * Extension`, a legend row, occurs on 391 and was absent here. The count of
 * seven was the only part that survived, and it survived by accident — one
 * legend row was missing and one non-legend string was present.
 *
 * `scripts/build-registries.mjs`'s `SOURCE_CLASSIFICATION_TO_SOURCE_CLASS`
 * carried the identical pair of errors and is repaired to match; the two
 * are asserted equal in `tests/unit/registry-build.test.ts` so they cannot
 * drift apart again.
 */
export const SOURCE_CLASSIFICATIONS = [
  'SoW Fact',
  'Derived Clarification',
  'Derived Clarification — adopted working position',
  'Recommendation — R&D',
  'Assumption',
  'Client Decision Required',
  'Illustrative Example',
  'User-Mandated Product Extension',
] as const

export type SourceClassification = (typeof SOURCE_CLASSIFICATIONS)[number]

/** A single pointer from an assembled artefact back to the frozen source. */
export const SourceReferenceSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    classification: z.enum(SOURCE_CLASSIFICATIONS),
    locator: z.string(),
  })
  .strict()

export type SourceReference = z.infer<typeof SourceReferenceSchema>

const SURFACE_IDS = ['SURF-SA', 'SURF-DOH', 'SURF-STU', 'SURF-CC', 'SURF-FL'] as const

/** Mirrors `SurfaceDefinition` (`@/domain/surfaces`) for a generated registry file. */
export const SurfaceRecordSchema = z
  .object({
    id: z.enum(SURFACE_IDS),
    name: z.string(),
    purpose: z.string(),
    basePath: z.string(),
    modulePrefix: z.string(),
    canonicalModuleCount: z.number().int().nonnegative(),
    ownership: z.string(),
  })
  .strict()

export type SurfaceRecord = z.infer<typeof SurfaceRecordSchema>

const ROLE_IDS = [
  'ROOT_SUPER_ADMIN',
  'ADMIN',
  'PLATFORM_ENGINEER',
  'SUPPORT',
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const

/** Mirrors `RoleDefinition` (`@/domain/roles`) for a generated registry file. */
export const RoleRecordSchema = z
  .object({
    id: z.enum(ROLE_IDS),
    name: z.string(),
    domain: z.enum(['PLATFORM', 'TENANT']),
    purpose: z.string(),
    homeSurface: z.enum(SURFACE_IDS),
    reachableSurfaces: z.array(z.enum(SURFACE_IDS)),
    backendCreatedOnly: z.boolean(),
    maxInstances: z.number().int().positive().nullable(),
    sourceRef: z.string(),
  })
  .strict()

export type RoleRecord = z.infer<typeof RoleRecordSchema>

/**
 * One row of `registries/generated/source-reconciliation.json`'s
 * `reconciliation.reconciliation_rows` — a candidate count reconciled
 * against what the frozen source actually says.
 */
export const ReconciliationRowSchema = z
  .object({
    inventory: z.string(),
    /**
     * R4-B02: which of the fourteen registry indexes this row reconciles, or
     * `null` for a row that reconciles something the fourteen do not index.
     * Required rather than optional, and nullable rather than absent, so the
     * gate in `tests/coverage/reconciliation-table.test.ts` can compare the
     * set of non-null slugs against `REGISTRY_DESCRIPTORS` BY EQUALITY. A
     * table headed "reconciliation" reads as complete, and five of the
     * fourteen inventories — functions, actionable controls, business use
     * cases, features and sub-features, 3,010 of the build's 5,018 census
     * rows — had no row at all while it did.
     */
    registry_slug: z.string().min(1).nullable(),
    /** Required exactly when `registry_slug` is null; see the refine below. */
    whyNoRegistrySlug: z.string().min(60).optional(),
    prompt_candidate: z.string(),
    extracted_count: z.string(),
    count_scope: z.string(),
    dedup_rule: z.string(),
    delta: z.string(),
    resolution: z.string(),
  })
  .strict()
  .refine((r) => (r.registry_slug === null) === (r.whyNoRegistrySlug !== undefined), {
    message:
      'A reconciliation row that indexes none of the fourteen registries must say why, and a ' +
      'row that indexes one must not carry a reason for not indexing one.',
    path: ['whyNoRegistrySlug'],
  })

export type ReconciliationRow = z.infer<typeof ReconciliationRowSchema>

/** The full shape of `registries/generated/source-reconciliation.json`. */
export const ReconciliationReportSchema = z
  .object({
    extracted: z.number().int().nonnegative(),
    totals: z
      .object({
        modules: z.number().int().nonnegative(),
        roles_rules: z.number().int().nonnegative(),
        business_rules: z.number().int().nonnegative(),
        decisions: z.number().int().nonnegative(),
        objects: z.number().int().nonnegative(),
        workflows: z.number().int().nonnegative(),
        screens: z.number().int().nonnegative(),
        state_vocabularies: z.number().int().nonnegative(),
        numeric_facts: z.number().int().nonnegative(),
        contradictions: z.number().int().nonnegative(),
      })
      .strict(),
    reconciliation: z
      .object({
        reconciliation_rows: z.array(ReconciliationRowSchema),
        invariants: z.array(z.string()),
        closed_action_sets: z.array(z.string()),
        state_vocabularies: z.array(z.string()),
        residual_contradictions: z.array(z.string()),
        implementation_risks: z.array(z.string()),
      })
      .strict(),
  })
  .strict()

export type ReconciliationReport = z.infer<typeof ReconciliationReportSchema>

// Fix round 1 (defect 3): the legacy `WorkflowRecordSchema`/
// `WorkflowRegistrySchema` pair (and `registries/generated/workflow-
// registry.json`, and `scripts/build-workflow-registry.mjs`) are RETIRED.
// Two registries existed for one inventory -- this 432-row, id-only-deduped
// file nothing but `app/workflows/page.tsx` and `app/coverage/page.tsx`
// read, sitting next to `registries/generated/workflows.json`'s 724-row
// composite-keyed registry (Task 7) that fixed the exact collapse defect
// this schema's own doc comment used to describe. `GeneratedRegistrySchema`
// in `@/coverage/registry-loader` is the one schema for `workflows` now, the
// same as the other thirteen registries.
