import { z } from 'zod'
import { Stamp } from './platform'

/**
 * `workflow-definitions` folds OBJ-036 · Workflow (L8589-L8604) with
 * OBJ-037 · Workflow version (L8608-L8623): design §3.1 gives Studio one
 * collection for authored workflows, not a separate versions table, so a
 * row here is one version of one workflow.
 * Workflow fields L8595; workflow lifecycle L8597: "Draft, In Review,
 * Published" (three authoring statuses of the CURRENT version).
 * Version fields L8614; version lifecycle L8616: "Draft, In Review,
 * Published, Outdated, Archived" — the fuller five-state statement, used
 * below rather than the three-state collapse, since a row is a version.
 */
export const WorkflowDefinition = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  jobTypeId: z.string().min(1),
  serviceTypeTagId: z.string().nullable(),
  localeCoverage: z.array(z.enum(['en', 'es'])),
  defaultEscalationRoutingTemplateId: z.string().nullable(),
  defaultCoachingTriggerPercentage: z.number().min(0).max(100),
  /** The screen canvas, in order (L8595). */
  workInstructionIds: z.array(z.string()),
  qualificationBaselineIds: z.array(z.string()),
  version: z.string().min(1),
  /**
   * Derived clarification: L8613 names "bump classification" as a field but
   * the source does not enumerate its values. `major`/`minor`/`patch` is a
   * standard semantic-versioning convention, not a source-backed fact.
   */
  bumpClassification: z.enum(['major', 'minor', 'patch']),
  republishDescription: z.string().nullable(),
  /** Lane B route marker where applicable (L8613). */
  laneBRoute: z.boolean(),
  status: z.enum(['draft', 'in-review', 'published', 'outdated', 'archived']),
}).strict()
export type WorkflowDefinition = z.infer<typeof WorkflowDefinition>

/**
 * OBJ-038 · Screen (L8627-L8642), the `work-instructions` collection —
 * design §3.1's name for what the object catalogue calls a Screen. Fields
 * L8633: the nine configuration sections. Lifecycle L8635: "drafted, in
 * review, published as part of its version" — three states, the version's
 * own three-stage chain, since a Screen has no lifecycle independent of its
 * Workflow version.
 */
export const WorkInstruction = z.object({
  id: z.string().min(1),
  workflowDefinitionId: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: z.string().min(1),
  referenceImageUrl: z.string().nullable(),
  /**
   * Derived clarification: L8633 says "input type from the capture-type
   * contract or none" without enumerating the contract's members here; the
   * five capture kinds below are the ones OBJ-018 · Data Capture (L8093)
   * and the frontline capture envelope actually exercise.
   */
  inputType: z.enum(['ok-not-ok', 'measurement', 'photo', 'barcode', 'text', 'none']),
  minDurationSeconds: z.number().int().nonnegative().nullable(),
  maxDurationSeconds: z.number().int().nonnegative().nullable(),
  coachingTriggerPercentage: z.number().min(0).max(100),
  gateKind: z.enum(['hard', 'soft']),
  specificationId: z.string().nullable(),
  containmentChecklistId: z.string().nullable(),
  escalationRoutingTemplateId: z.string().nullable(),
  requiresToolId: z.string().nullable(),
  requiresCalibrationConfirmation: z.boolean(),
  qualificationOverrideIds: z.array(z.string()),
  status: z.enum(['draft', 'in-review', 'published']),
}).strict()
export type WorkInstruction = z.infer<typeof WorkInstruction>

// OBJ-039 · Shared Instruction Block (L8646-L8661). Fields L8652; lifecycle
// L8654: "drafted, published with the version" — exactly two states, not
// three; the source names no archived state for a content block.
export const ContentBlock = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  imageUrls: z.array(z.string()),
  appliedToWorkInstructionIds: z.array(z.string()),
  status: z.enum(['draft', 'published']),
}).strict()
export type ContentBlock = z.infer<typeof ContentBlock>

// OBJ-044 · Training Library item (L8741-L8756). Fields L8747; lifecycle
// L8749: "draft, in review, published, archived".
export const Training = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  title: z.string().min(1),
  bodyText: z.string().min(1),
  videoUrl: z.string().nullable(),
  locale: z.enum(['en', 'es']),
  version: z.string().min(1),
  status: z.enum(['draft', 'in-review', 'published', 'archived']),
}).strict()
export type Training = z.infer<typeof Training>

// OBJ-047 · Specification limit set (L8799-L8814). Fields L8805; lifecycle
// L8807: "authored, published, superseded".
export const Specification = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  lowerLimit: z.number(),
  upperLimit: z.number(),
  unit: z.string().min(1),
  drawingReference: z.string().nullable(),
  status: z.enum(['authored', 'published', 'superseded']),
}).strict()
export type Specification = z.infer<typeof Specification>

/**
 * `packages` folds OBJ-045 · Work package (L8760-L8775) with OBJ-046 ·
 * Package manifest (L8779-L8794) for the same reason as `workflow-definitions`
 * above: design §3.1 gives one collection, not two. Work-package fields
 * L8766; work-package lifecycle L8768: "assembled, delivered, pinned, in
 * use, superseded". Manifest fields L8786; manifest lifecycle L8788:
 * "assembled, delivered, validated, superseded". The first six `status`
 * values below are the union of both statements' distinct labels
 * ("validated" is not in the work-package list; "pinned"/"in use" are not
 * in the manifest list) rather than a collapse of either onto the other.
 * All six are `SoW Fact`.
 *
 * Task 4 fix round 1 (review Important finding): the Statement of Work is
 * silent on corruption, revocation, expiry and incompatible-version
 * handling for a *deployed* package (L79518, and the twenty-one-stage
 * enumeration at L79048, both mark all four `Not specified in the
 * Statement of Work`) — but blueprint §35.6 "Integrity, revocation,
 * replacement, rollback and incompatible versions" (L79517-L79530) does
 * not leave that silence unshaped: it proposes a concrete verification
 * state machine (`Received -> ChecksumCheck -> ... -> Trusted`, with
 * `RejectCorrupt`, `RejectExpired`, `RejectVersion` terminal branches) and
 * six numbered business rules, classified `Recommendation — R&D` /
 * `Derived Clarification` throughout, the same tier this file already uses
 * for `Outdated` (below) and `bumpClassification`. `expired`, `revoked`,
 * `corrupt` and `incompatible-version` are added on that basis — four of
 * the twenty-one-stage list's members, not an invented fifth model:
 *   - `corrupt` — Rule 1 / the `RejectCorrupt` branch (checksum mismatch,
 *     bounded re-pull); the bound itself is `TBD` under `DEC-PKGMAN-001`.
 *   - `expired` — the `RejectExpired` branch (validity horizon passed);
 *     the horizon value is `TBD` under `DEC-PKGEXP-001` (§35.7).
 *   - `revoked` — Rules 3-4 (a revocation rides the command channel; a
 *     mid-run revocation stops the run at its current step and preserves
 *     the captured work for Quality Manager disposition); the mid-run
 *     resolution is folded into `DEC-PKGMAN-001`.
 *   - `incompatible-version` — Rule 6 / the `RejectVersion` branch,
 *     grounded in the `SoW Fact` application-version floor (§8.13.1).
 * "Replace" and "roll back" (also named alongside these four in master
 * prompt §17.2/§10.4) do NOT get new values: the chapter-35 matrix states
 * replacement is handled by the existing `superseded` value ("Terminal
 * safe state: Not applicable — replacement is the normal path", `SoW
 * Fact — §7.10.6`) and rollback "is treated as a normal new version"
 * (Rule 5: republication, not reversal) — i.e. a fresh row through the
 * normal `assembled -> ... -> pinned` path, not a distinct status.
 *
 * `sourceStatus` carries that classification, and any decision id, ON THE
 * ROW ITSELF rather than only in this comment — reusing the existing
 * `sourceStatus` convention already shipped in
 * `src/ai/storyboards/contract.ts` (`StoryboardFieldId`, rendered by
 * `src/ui/doh/CrossSurfaceStatement.tsx`) instead of inventing a second
 * one, per controller instruction. This is how a reader tells a
 * source-confirmed row from a proposed one without cross-referencing this
 * file: every row states its own classification, e.g.
 * `"SoW Fact — OBJ-045 L8768, OBJ-046 L8788"` for the original six values,
 * or `"Recommendation — R&D (blueprint §35.6, L79517-L79530); retry bound
 * TBD — DEC-PKGMAN-001"` for a `corrupt` row — never presented as V1 fact
 * (master prompt §21.2).
 */
export const Package = z.object({
  id: z.string().min(1),
  runId: z.string().nullable(),
  workflowDefinitionId: z.string().min(1),
  workflowVersion: z.string().min(1),
  contentItemIds: z.array(z.string()),
  localeSet: z.array(z.enum(['en', 'es'])),
  difficultyLevelsIncluded: z.array(z.enum(['simple', 'standard', 'expanded'])),
  assembledAt: Stamp,
  deliveredAt: Stamp.nullable(),
  acknowledgedAt: Stamp.nullable(),
  status: z.enum([
    'assembled', 'delivered', 'validated', 'pinned', 'in-use', 'superseded',
    'expired', 'revoked', 'corrupt', 'incompatible-version',
  ]),
  /** See the doc comment above `Package` — required on every row, `SoW Fact` or `Recommendation — R&D`/`Client Decision Required` alike. */
  sourceStatus: z.string().min(1),
}).strict()
export type Package = z.infer<typeof Package>
