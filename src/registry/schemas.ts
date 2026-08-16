import { z } from 'zod'
import { COVERAGE_STATUSES } from '@/coverage/descriptors'

/**
 * Every schema here is `.strict()`. An unknown field in source-derived data
 * is the signature of a version mismatch between the extraction that
 * produced a registry file and the code reading it — never a field to
 * silently drop.
 */

/**
 * The exact seven source classification labels (frozen source vocabulary).
 * No other string is a valid classification.
 */
export const SOURCE_CLASSIFICATIONS = [
  'SoW Fact',
  'Derived Clarification',
  'Derived Clarification — adopted working position',
  'Recommendation — Research and Development',
  'Assumption',
  'Client Decision Required',
  'Illustrative Example',
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
    prompt_candidate: z.string(),
    extracted_count: z.string(),
    count_scope: z.string(),
    dedup_rule: z.string(),
    delta: z.string(),
    resolution: z.string(),
  })
  .strict()

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

/**
 * One row of `registries/generated/workflow-registry.json`, built by
 * `scripts/build-workflow-registry.mjs` from the 432 distinct `id`-keyed
 * `workflows[]` entries across `registries/raw/extract/CHK-*.json` (slice
 * 1's extraction of the frozen source). This is a source-EXTRACTION count,
 * not a workflow TOTAL: the frozen source fixes no single workflow count
 * anywhere, and this registry never asserts one (see
 * `RegistryDescriptor.expectedCount` for `workflows`, which stays `null`).
 *
 * `surfacesTouched` is deliberately `string[]`, not `SurfaceId[]`: the
 * extraction's `surfaces_touched` field is free text off the frozen source
 * ("Delivery Operations Hub modules 2, 3, 5, 6, 7, 8, 14, 18", "tenant audit
 * stream", "Not applicable — document control", ...), not always one of the
 * five closed `SurfaceId` values -- coercing it into that enum would either
 * throw away real source text or fabricate a surface the source never named.
 *
 * `collapsedFrom` and `idIsPlaceholder` (post-handoff honesty fix): 725 raw
 * `workflows[]` entries dedupe to these 432 rows by the extractor's own
 * `id`, and 32 ids repeat -- 199 raw entries share the literal id
 * "unnumbered", 66 share "unstated" (the extractor's placeholders for a
 * passage the source gave no clean id), and 30 real-looking ids (e.g.
 * "SB-001") each name two distinct passages at two different source lines.
 * `collapsedFrom` is how many raw entries this row's id actually had (>= 1);
 * `idIsPlaceholder` is true only for the bare literal ids "unnumbered" and
 * "unstated" themselves, not for ids that merely start with that text plus a
 * discriminating fragment (e.g. "unnumbered — 23.10 metrics derivation",
 * which IS a distinct, non-collapsing id). Neither field re-keys the
 * registry or invents an id the source never gave -- that stays out of
 * scope for this fix.
 */
export const WorkflowRecordSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    primaryActor: z.string().min(1),
    trigger: z.string().min(1),
    surfacesTouched: z.array(z.string()),
    terminalStates: z.array(z.string()),
    sourceLine: z.number().int().nonnegative(),
    status: z.enum(COVERAGE_STATUSES),
    collapsedFrom: z.number().int().positive(),
    idIsPlaceholder: z.boolean(),
  })
  .strict()

export type WorkflowRecord = z.infer<typeof WorkflowRecordSchema>

export const WorkflowRegistrySchema = z.array(WorkflowRecordSchema)

export type WorkflowRegistry = z.infer<typeof WorkflowRegistrySchema>
