import type { z } from 'zod'
import {
  ReconciliationReportSchema,
  type ReconciliationReport,
  WorkflowRegistrySchema,
  type WorkflowRegistry,
} from './schemas'

export * from './schemas'

/**
 * Compile-time typing is not enough for source-derived data. An unknown field is
 * the signature of a version mismatch, so schemas are strict and a failure is a
 * labelled throw rather than a silent pass.
 */
export function loadRegistry<S extends z.ZodTypeAny>(
  schema: S,
  raw: unknown,
  label: string,
): z.infer<S> {
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new Error(
      `Registry validation failed for ${label}: ${JSON.stringify(result.error.issues)}`,
    )
  }
  return result.data
}

/** Loads and validates `registries/generated/source-reconciliation.json`. */
export function loadReconciliation(raw: unknown): ReconciliationReport {
  return loadRegistry(ReconciliationReportSchema, raw, 'source reconciliation report')
}

/** Loads and validates `registries/generated/workflow-registry.json`. */
export function loadWorkflowRegistry(raw: unknown): WorkflowRegistry {
  return loadRegistry(WorkflowRegistrySchema, raw, 'workflow registry')
}
