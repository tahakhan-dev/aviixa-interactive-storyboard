import type { RoleId } from '@/domain/roles'
import type { TenantId } from '@/domain/ids'
import type { ScenarioDomainState } from '@/domain/state'
import { isRefusal, type PermissionOutcome } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type IdentityLayerState,
  type StudioAccessDecision,
  type StudioIdentity,
} from '@/studio/access/evaluate'
import type { StudioCommercialTier, StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import {
  JOB_ADOPTION_STATES,
  type JobAdoptionState,
  type SubmissionState,
  type VersionBumpClass,
} from '@/studio/vocab'
import type { ApprovalPublishSubject, ChainStaffing } from '@/studio/modules/stu-11/chain'
import { routedProhibitionApplies } from '@/studio/modules/stu-18/rendering'
import {
  evaluatePublish,
  type PublishBlocker,
  type PublishCheckRegister,
} from '@/studio/publish/register'
import { minimumBumpFor, versionDiffUnavailable, type VersionDiffEngine } from './diff'
import {
  versionRow,
  type StudioVersionCapabilityId,
  type StudioVersionMatrixRow,
} from './matrix'

/**
 * `MOD-STU-12` — versioning and publication **as a service**, in the shape
 * `MOD-STU-11` established: a value plus pure acts, with the screen as one
 * consumer rather than the owner of the rules.
 *
 * ### The five rules this file exists to hold
 *
 * 1. **A GATE THAT CAN BE BYPASSED IS NOT A GATE.** Task 5's eleven publish
 *    checks are evaluated by `evaluatePublish` and a blocked evaluation
 *    returns BEFORE the audit write and before any mutation. There is no
 *    waiver argument on `publish`, no severity below "blocks", and no second
 *    publication entry point. The refusal names **which** check and why, for
 *    every blocker, and all three of task 5's fail-closed routes — a check
 *    that refused, a check that could not run, and a check no module has
 *    registered at all — reach the same refusal.
 * 2. **ACTIVE WORK STAYS PINNED TO ITS APPROVED VERSION.** `publish` never
 *    touches `register.runs`, and `swapPinnedPackage` has no permitted path
 *    for any actor or agent. L33517 / `AC-STU-108`: "an in-flight Run's pinned
 *    package is never swapped by any publication."
 * 3. **THE TWO VOCABULARIES STAY APART (D5).** `Superseded` is a VERSION
 *    state; `Outdated` is a per-JOB adoption state, and it is DERIVED from the
 *    update window rather than stored, so it cannot drift from the decision.
 * 4. **EVERY WRITE GOES THROUGH ONE MUTATOR.** `applyVersionAct` is the only
 *    place a register changes, the audit sink is a required field on the
 *    context with no default, and the write happens after every domain refusal
 *    and before the mutation. Five named wrappers route through it; there are
 *    exactly two `context.audit(` call sites in this file, one committing and
 *    one recording a refusal.
 * 5. **THE ROLLBACK QUESTION IS DISCLOSED, NOT ANSWERED.** Two source
 *    identifiers ask it with no cross-reference between them; both render.
 *    The rollback BEHAVIOUR, by contrast, is not open at all, and the four
 *    refusals it states are enforced here.
 *
 * ### Determinism
 *
 * No clock and no randomness. Every timestamp is the caller's `at`, every
 * window lapse is computed against a caller-supplied `asOf`, and the diff
 * engine arrives as a parameter defaulting to the one that holds.
 */

/* ==================================================================== *
 * THE VOCABULARIES.
 * ==================================================================== */

/**
 * L33479, first sentence: "A version is Published, Superseded when a later
 * version exists, or Archived."
 *
 * **D5.** `Outdated` is deliberately absent. `OBJ-037` (L8616) collapses the
 * two onto the version — "Draft, In Review, Published, Outdated, Archived" —
 * and that collapse is recorded as an erratum in the shared decision canon,
 * because it loses the distinction between *a newer version exists* and *this
 * Job's update window lapsed*, which L33569 notifies separately.
 */
export type VersionState = 'Published' | 'Superseded' | 'Archived'

export const VERSION_STATES = [
  'Published',
  'Superseded',
  'Archived',
] as const satisfies readonly VersionState[]

type MissingFromVersionStates = Exclude<VersionState, (typeof VERSION_STATES)[number]>
const _versionStatesExhaustive: MissingFromVersionStates extends never ? true : never = true
void _versionStatesExhaustive

/**
 * L33479, second sentence — the per-JOB half of D5. **Re-exported, never
 * re-declared**: task 3 owns `JOB_ADOPTION_STATES` in `@/studio/vocab`, and a
 * second array with the same four members is exactly how two lists drift
 * apart. The alias exists so this module reads in the source's own terms
 * without minting a competing set.
 */
export const ADOPTION_STATES = JOB_ADOPTION_STATES

/**
 * The Workflow's own authoring status is not declared here, and never was.
 * It is now in the shared canon — `WORKFLOW_STATUSES` in
 * `@/studio/vocab/lifecycle`, hoisted out of `MOD-STU-03` — so this module
 * reads it from there on the day it needs it and still mints no second copy.
 * `tests/unit/stu-versions.test.ts` holds both halves: that the canon carries
 * the set, and that this module exports nothing matching `WORKFLOW`, so a
 * local copy added later goes red on arrival.
 *
 * What this module needed the status FOR is answered without it:
 * `register.pendingSubmission` carries the submission awaiting publication in
 * `SubmissionState`, which task 3 already owns, and publication is what clears
 * it. That is the observable, and it is a narrower and more honest one.
 */

/* ==================================================================== *
 * THE TRANSITIONS — the version state machine, as data.
 * ==================================================================== */

/** The state a transition departs from. `no-version` is "nothing minted yet". */
export type VersionOrigin = VersionState | 'no-version'

export type VersionTransitionId = 'mint' | 'supersede' | 'archive' | 'unarchive'

export const VERSION_TRANSITION_IDS = [
  'mint',
  'supersede',
  'archive',
  'unarchive',
] as const satisfies readonly VersionTransitionId[]

type MissingFromTransitionIds = Exclude<
  VersionTransitionId,
  (typeof VERSION_TRANSITION_IDS)[number]
>
const _transitionIdsExhaustive: MissingFromTransitionIds extends never ? true : never = true
void _transitionIdsExhaustive

export interface VersionTransitionDefinition {
  readonly id: VersionTransitionId
  readonly from: readonly VersionOrigin[]
  /**
   * `null` where the destination is DERIVED rather than stated. Un-archival
   * returns a version to `Superseded` or `Published` depending on whether a
   * later version exists — deriving it is what stops an un-archived version
   * claiming to be in force while a newer one is.
   */
  readonly to: VersionState | null
  readonly capability: StudioVersionCapabilityId | null
  readonly sourceRef: string
}

export const VERSION_TRANSITIONS = [
  {
    id: 'mint',
    from: ['no-version'],
    to: 'Published',
    capability: 'publish-a-version',
    sourceRef: 'L33513, L33461',
  },
  {
    id: 'supersede',
    from: ['Published'],
    to: 'Superseded',
    capability: null,
    sourceRef: 'L33479 — "Superseded when a later version exists"',
  },
  {
    // Both origins, because SB-STU-15 (L33546) puts an Archive control beside
    // EACH version and the only gate the source names is the no-active-Jobs
    // indicator. A Published version with no active Jobs is retirable; the
    // indicator, not the state, is what stands between it and archival.
    id: 'archive',
    from: ['Published', 'Superseded'],
    to: 'Archived',
    capability: 'archive-a-version',
    sourceRef: 'L33440, FUNC-STU-12-03-D-1 L33505, SB-STU-15 L33546',
  },
  {
    id: 'unarchive',
    from: ['Archived'],
    to: null,
    capability: 'archive-a-version',
    sourceRef: 'DEC-ARCH-001 L33443, option (a)',
  },
] as const satisfies readonly VersionTransitionDefinition[]

type MissingFromTransitions = Exclude<
  VersionTransitionId,
  (typeof VERSION_TRANSITIONS)[number]['id']
>
const _transitionsExhaustive: MissingFromTransitions extends never ? true : never = true
void _transitionsExhaustive

const TRANSITION_BY_ID = new Map<VersionTransitionId, VersionTransitionDefinition>(
  VERSION_TRANSITIONS.map((t) => [t.id, t]),
)

function transition(id: VersionTransitionId): VersionTransitionDefinition {
  return TRANSITION_BY_ID.get(id) ?? VERSION_TRANSITIONS[1]
}

/** Whether the table draws this edge. The ONE reader of the table. */
export function transitionIsDrawn(id: VersionTransitionId, origin: VersionOrigin): boolean {
  return transition(id).from.includes(origin)
}

/* ==================================================================== *
 * THE REGISTER.
 * ==================================================================== */

export interface PublishedVersion {
  readonly number: string
  readonly tenant: TenantId
  readonly bump: VersionBumpClass
  /** L33429 — mandatory, stored permanently, for every class. */
  readonly description: string
  readonly state: VersionState
  readonly publishedAt: string
  readonly releaseAuthority: string
  /**
   * D21 / `SEQ-013` L68465: "`Versioned` and `Distributable` are different
   * states, so a version can exist in history without ever having been safe to
   * run." A version is minted NOT distributable; the package build in
   * `MOD-STU-14` is what makes it distributable, and that is a different act.
   */
  readonly distributable: boolean
  /** L33491 — a patch distributes without a Job Owner decision. */
  readonly autoAdopts: boolean
  readonly approvalLog: readonly string[]
  /** The version this one was minted from, or `null` for the first. */
  readonly basedOn: string | null
}

/**
 * Adoption **per Job**. `ownerId` is the FIELD the permission keys on — not a
 * role, not a persona, and not derived from anything else on this record.
 */
export interface JobAdoption {
  readonly jobId: string
  /** L33433 — a field on the Job record, defaulting to the creator. */
  readonly ownerId: string
  /** The version this Job is running, which the new one would replace. */
  readonly onVersion: string
  /** `null` while the Job Owner has not decided. `Outdated` is NOT stored. */
  readonly decision: 'adopt' | 'defer' | null
  readonly notifiedAt: string | null
  readonly decidedAt: string | null
  /** L33431 — a default one-shift window, configurable. */
  readonly windowHours: number
}

/** The Hub's own linkage, read across the seam. Never written here. */
export interface LinkedJob {
  readonly jobId: string
  readonly ownerId: string
  readonly onVersion: string
  readonly windowHours: number
}

export interface PinnedRun {
  readonly runId: string
  readonly jobId: string
  /** The per-run pinned package's version. Never swapped mid-run. */
  readonly pinnedVersion: string
  readonly inFlight: boolean
}

export interface ExportDocument {
  readonly versionNumber: string
  readonly publishedAt: string
  readonly approvalLog: readonly string[]
  readonly readOnly: true
  readonly sections: readonly { readonly section: ExportSection; readonly text: string }[]
  readonly generatedAt: string
}

export interface VersionRegister {
  readonly workflowId: string
  readonly tenant: TenantId
  /** Newest first, as `SB-STU-15`'s left column lists them. */
  readonly versions: readonly PublishedVersion[]
  readonly adoption: readonly JobAdoption[]
  readonly jobs: readonly LinkedJob[]
  readonly runs: readonly PinnedRun[]
  readonly exports: readonly ExportDocument[]
  /**
   * The submission awaiting publication, or `null`. This is what makes the
   * Workflow's own authoring status observable: a released-but-unpublished
   * submission means the Workflow is `In Review`, and publication is what
   * moves it to `Published`.
   */
  readonly pendingSubmission: { readonly submissionId: string; readonly state: SubmissionState } | null
}

/**
 * Every number this register has ever held, Archived ones included. The mint
 * ledger, and the reason `version-number-reused` can refuse: L33579 — "a
 * version number is never re-used."
 */
export function mintedNumbers(register: VersionRegister): readonly string[] {
  return register.versions.map((v) => v.number)
}

/**
 * The submission awaiting publication, or `null`. The observable publication
 * moves: it is set while a released submission has not been published and
 * cleared by a successful `publish`, so a failed audit write leaves it exactly
 * where it was. Typed in `SubmissionState`, task 3's own vocabulary.
 */
export function pendingSubmission(
  register: VersionRegister,
): { readonly submissionId: string; readonly state: SubmissionState } | null {
  return register.pendingSubmission
}

/* ==================================================================== *
 * ADOPTION — and `Outdated`, derived.
 * ==================================================================== */

const MS_PER_HOUR = 3_600_000

/**
 * The ONE reader of a Job's adoption state, and the only place the four-member
 * vocabulary is produced.
 *
 * `Outdated` is derived from the window and the caller's `asOf`, never stored:
 * L33519 — "Where a Job Owner does not decide within the update window, the
 * prior version is flagged outdated and the Job's state is visible rather than
 * silently changed." A decided Job never lapses, because the window runs only
 * while nobody has decided.
 */
export function adoptionState(row: JobAdoption, asOf: string): JobAdoptionState {
  if (row.decision === 'adopt') return 'Decided-adopt'
  if (row.decision === 'defer') return 'Decided-defer'
  if (row.notifiedAt === null) return 'Notified'
  const lapsesAt = Date.parse(row.notifiedAt) + row.windowHours * MS_PER_HOUR
  const now = Date.parse(asOf)
  // An unparseable stamp is not evidence that the window lapsed, so it reads
  // as Notified rather than being treated as overdue.
  if (Number.isNaN(lapsesAt) || Number.isNaN(now)) return 'Notified'
  return now >= lapsesAt ? 'Outdated' : 'Notified'
}

/* ==================================================================== *
 * THE CONTEXT, THE AUDIT ENTRY AND THE REFUSAL.
 * ==================================================================== */

export type VersionActId = 'publish' | 'decide-adoption' | 'archive' | 'unarchive' | 'export'

export const VERSION_ACT_IDS = [
  'publish',
  'decide-adoption',
  'archive',
  'unarchive',
  'export',
] as const satisfies readonly VersionActId[]

type MissingFromActs = Exclude<VersionActId, (typeof VERSION_ACT_IDS)[number]>
const _actsExhaustive: MissingFromActs extends never ? true : never = true
void _actsExhaustive

export interface VersionAuditEntry {
  /** A refusal is recorded AS A REFUSAL and never as an act that happened. */
  readonly kind: 'act' | 'refusal'
  readonly act: VersionActId
  readonly workflowId: string
  readonly tenant: TenantId
  readonly actor: string
  readonly role: RoleId | null
  readonly at: string
  /** L33573 — "the version number is itself the audit receipt." */
  readonly versionNumber: string | null
  readonly detail: string
  readonly refusalCode: VersionRefusalCode | null
}

export type AuditWriteResult = { readonly ok: true } | { readonly ok: false; readonly reason: string }
export type VersionAuditWrite = (entry: VersionAuditEntry) => AuditWriteResult

export interface VersionContext {
  readonly actor: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
  readonly commercialTier: StudioCommercialTier
  readonly identityLayer: IdentityLayerState
  readonly domain: ScenarioDomainState
  readonly online: boolean
  /** The caller's timestamp. This module reads no clock. */
  readonly at: string
  /** REQUIRED, and deliberately without a default: an act with nowhere to
   *  record it is not an act this module performs. */
  readonly audit: VersionAuditWrite
}

export type VersionRefusalCode =
  | 'not-authorised'
  | 'wrong-state'
  | 'not-released'
  | 'classification-missing'
  | 'description-missing'
  | 'publish-checks-blocked'
  | 'diff-unavailable'
  | 'misclassified-patch'
  | 'version-number-reused'
  | 'indicator-uncomputable'
  | 'active-jobs-exist'
  | 'reason-required'
  | 'export-incomplete'
  | 'not-recorded'

export const VERSION_REFUSAL_CODES = [
  'not-authorised',
  'wrong-state',
  'not-released',
  'classification-missing',
  'description-missing',
  'publish-checks-blocked',
  'diff-unavailable',
  'misclassified-patch',
  'version-number-reused',
  'indicator-uncomputable',
  'active-jobs-exist',
  'reason-required',
  'export-incomplete',
  'not-recorded',
] as const satisfies readonly VersionRefusalCode[]

type MissingFromRefusalCodes = Exclude<VersionRefusalCode, (typeof VERSION_REFUSAL_CODES)[number]>
const _refusalCodesExhaustive: MissingFromRefusalCodes extends never ? true : never = true
void _refusalCodesExhaustive

export interface VersionRefusal {
  readonly code: VersionRefusalCode
  readonly act: VersionActId
  /** Plain words naming the specific missing condition (`AC-STU-155`). */
  readonly reason: string
  /**
   * The permission outcome, where the refusal came OUT OF the evaluator.
   * `null` on a domain refusal — reporting one under a borrowed access outcome
   * would be a lie about why, on a screen whose job is explaining refusals.
   */
  readonly outcome: PermissionOutcome | null
  /** Every blocking publish check, in ordinal order. Empty on other refusals. */
  readonly blockers: readonly PublishBlocker[]
  readonly sourceRefs: readonly string[]
}

export interface VersionFailure {
  readonly ok: false
  /** The register, byte-for-byte as it was handed in. */
  readonly register: VersionRegister
  readonly refusal: VersionRefusal
  /** Set where the REFUSAL's own audit write failed. It never revives the
   *  refusal — a refusal that could not be recorded is still a refusal. */
  readonly auditFailure: string | null
}

export type VersionOutcome =
  | {
      readonly ok: true
      readonly register: VersionRegister
      readonly audit: VersionAuditEntry
    }
  | VersionFailure

/* ==================================================================== *
 * THE AFFORDANCE QUESTION — per control, through task 1's evaluator.
 * ==================================================================== */

/**
 * May this actor take this capability here? One row, one answer, one
 * evaluator. Every control on the screen asks this, and nothing in this module
 * re-derives a role, a grant or a persona column.
 *
 * `row` is a parameter rather than a lookup so that `decideAdoption` can hand
 * in the row it built from the Job's own owner FIELD — which is the whole of
 * why row 5 is not a role check.
 */
export function versionAffordance(
  row: StudioVersionMatrixRow,
  context: VersionContext,
  resourceTenant: TenantId,
  stages: {
    readonly author: string | null
    readonly reviewer: string | null
    readonly releaseAuthority: string | null
  } = { author: null, reviewer: null, releaseAuthority: null },
): StudioAccessDecision {
  return evaluateStudioAccess({
    row,
    identity: context.actor,
    grants: context.grants,
    commercialTier: context.commercialTier,
    identityLayer: context.identityLayer,
    state: context.domain,
    online: context.online,
    resourceTenant,
    authorOfRecord: stages.author,
    reviewerOfRecord: stages.reviewer,
    releaseAuthorityOfRecord: stages.releaseAuthority,
  })
}

/**
 * THE ROUTED PROHIBITION, ANSWERED IN THE DOMAIN RATHER THAN ON THE SCREEN.
 *
 * Returns the capability this actor is routed to on this row, or `null` where
 * the cell is not a routed prohibition. `SCR-STU-12` calls this and draws
 * what it returns.
 *
 * **`routedTo` IS `null` ON ALL EIGHTY-EIGHT CELLS OF THIS CARD**, so this
 * returns `null` today — and it is wired in rather than skipped because a
 * field nothing reads is decoration, and the two near misses are answers
 * rather than omissions:
 *
 * - Row 5 (`Decide adoption of a notified-class version`, L33462) refuses
 *   four columns "unless also the Job Owner". That is a CONDITION on the same
 *   act, keyed to a FIELD on the Job rather than to a role (L33433: "Job
 *   Owner is a field on the Job record ... not a role"), and `decideAdoption`
 *   already answers it by building the row from that field. A `routedTo`
 *   would restate an object condition as a place.
 * - Row 4 (`Publish a version`, L33461) refuses the grant-holder with no
 *   alternative named. Validating the classification as Reviewer is a
 *   DIFFERENT stage, not this act relocated, so pointing at it would tell
 *   somebody they may release by reviewing.
 *
 * Row 6 of the source's table, `Rebase a scheduled Run` (L33463), is the one
 * cell here whose token reads `Allowed` for a Delivery Operations Hub act. It
 * is carried in `STU_12_CROSS_SURFACE` as a statement and is not a row of
 * this matrix at all, so no control is ever drawn from it.
 */
export function versionRoute(
  row: StudioVersionMatrixRow,
  context: VersionContext,
  resourceTenant: TenantId,
  stages: {
    readonly author: string | null
    readonly reviewer: string | null
    readonly releaseAuthority: string | null
  } = { author: null, reviewer: null, releaseAuthority: null },
): StudioVersionCapabilityId | null {
  const decision = versionAffordance(row, context, resourceTenant, stages)
  const routedTo =
    decision.personaColumns.map((column) => row.routedTo[column]).find((t) => t != null) ?? null
  const routedDecision =
    routedTo === null
      ? null
      : versionAffordance(versionRow(routedTo), context, resourceTenant, stages)
  return routedProhibitionApplies(decision, routedTo, routedDecision) ? routedTo : null
}

/**
 * Outcomes that let the actor TAKE the act.
 *
 * `readOnly` is in this set, and that is the point of row 11. The token
 * `Read-only — may generate the read-only export` carries its own rendering
 * instruction INSIDE it, so mapping `Read-only` mechanically to a disabled
 * control would remove an export the source grants. Which acts admit it is
 * decided per act, in `PERMITS`, and never globally.
 */
const ACTING: ReadonlySet<PermissionOutcome> = new Set<PermissionOutcome>([
  'allowed',
  'allowedWithConditions',
])
const ACTING_OR_READ_ONLY: ReadonlySet<PermissionOutcome> = new Set<PermissionOutcome>([
  'allowed',
  'allowedWithConditions',
  'readOnly',
])

/** Per act, because the source states it per row rather than per surface. */
const PERMITS: Readonly<Record<VersionActId, ReadonlySet<PermissionOutcome>>> = {
  publish: ACTING,
  'decide-adoption': ACTING,
  archive: ACTING,
  unarchive: ACTING,
  export: ACTING_OR_READ_ONLY,
}

/* ==================================================================== *
 * THE ONE MUTATOR.
 * ==================================================================== */

export interface VersionActPlan {
  readonly act: VersionActId
  /** What the audit entry says happened, in plain words. */
  readonly detail: string
  /** The version number this act is the receipt for, where there is one. */
  readonly versionNumber: string | null
  /** Pure. Returns a NEW register; never edits the one it is handed. */
  readonly mutate: (register: VersionRegister) => VersionRegister
}

interface RefusalDetail {
  readonly outcome?: PermissionOutcome | null
  readonly blockers?: readonly PublishBlocker[]
  readonly versionNumber?: string | null
}

function refuse(
  register: VersionRegister,
  context: VersionContext,
  act: VersionActId,
  code: VersionRefusalCode,
  reason: string,
  sourceRefs: readonly string[],
  detail: RefusalDetail = {},
): VersionFailure {
  // The refusal is recorded AS A REFUSAL. Slice 3 marks every Studio refusal
  // `RECORDED_AS_REFUSAL` (L34657), and L33573 audits this module's acts.
  const written = context.audit({
    kind: 'refusal',
    act,
    workflowId: register.workflowId,
    tenant: register.tenant,
    actor: context.actor.identityId,
    role: context.actor.roles[0] ?? null,
    at: context.at,
    versionNumber: detail.versionNumber ?? null,
    detail: reason,
    refusalCode: code,
  })
  return {
    ok: false,
    register,
    refusal: {
      code,
      act,
      reason,
      outcome: detail.outcome ?? null,
      blockers: detail.blockers ?? [],
      sourceRefs,
    },
    auditFailure: written.ok ? null : written.reason,
  }
}

/**
 * THE ONE ENTRY POINT FOR EVERY WRITE. Two steps and their order is the whole
 * of L33573 plus L33387's rule read forward: the audit write happens **after
 * every domain refusal and before any mutation**, so if the record cannot be
 * written the act did not happen and the register is returned unchanged.
 *
 * The domain refusals are the caller's, and they all run before this is
 * reached — which is why this function has no domain arguments and cannot be
 * handed a plan it should have rejected. Five wrappers build a plan and call
 * this; nothing else mutates a register anywhere in this module.
 */
export function applyVersionAct(
  register: VersionRegister,
  plan: VersionActPlan,
  context: VersionContext,
): VersionOutcome {
  const entry: VersionAuditEntry = {
    kind: 'act',
    act: plan.act,
    workflowId: register.workflowId,
    tenant: register.tenant,
    actor: context.actor.identityId,
    role: context.actor.roles[0] ?? null,
    at: context.at,
    versionNumber: plan.versionNumber,
    detail: plan.detail,
    refusalCode: null,
  }
  const written = context.audit(entry)
  if (!written.ok) {
    return {
      ok: false,
      register,
      refusal: {
        code: 'not-recorded',
        act: plan.act,
        reason: `${written.reason}. The act is not recorded, so nothing changed: no version number is minted, no adoption row is written and the prior version remains in force. Repeat it once the record can be written.`,
        outcome: null,
        blockers: [],
        sourceRefs: ['L33519', 'L33573', 'FB-STU-10 L31454'],
      },
      auditFailure: written.reason,
    }
  }
  return { ok: true, register: plan.mutate(register), audit: entry }
}

/* ==================================================================== *
 * SEMANTIC VERSIONING.
 * ==================================================================== */

/**
 * `vMAJOR.MINOR.PATCH` (L33424). An unparseable current number returns the
 * first version of its class rather than throwing: a render that crashes shows
 * nothing about the twelve rows beside it.
 */
export function nextVersionNumber(current: string, bump: VersionBumpClass): string {
  const parts = /^v(\d+)\.(\d+)\.(\d+)$/.exec(current)
  if (parts === null) return bump === 'MAJOR' ? 'v1.0.0' : bump === 'MINOR' ? 'v0.1.0' : 'v0.0.1'
  const [major, minor, patch] = [Number(parts[1]), Number(parts[2]), Number(parts[3])]
  if (bump === 'MAJOR') return `v${major + 1}.0.0`
  if (bump === 'MINOR') return `v${major}.${minor + 1}.0`
  return `v${major}.${minor}.${patch + 1}`
}

/**
 * L33579 — "minted version numbers are reconciled against audit entries and
 * any gap is reported; a version number is never re-used."
 *
 * A gap is a number the register minted that no audit entry records; re-use is
 * the same number minted twice. Both are reported; neither is repaired here,
 * because repairing a gap silently is how a missing audit entry stops being
 * visible.
 */
export function reconcileVersionNumbers(
  minted: readonly string[],
  audited: readonly string[],
): { readonly gaps: readonly string[]; readonly reused: readonly string[] } {
  const auditedSet = new Set(audited)
  const seen = new Set<string>()
  const reused: string[] = []
  const gaps: string[] = []
  for (const number of minted) {
    if (seen.has(number)) {
      if (!reused.includes(number)) reused.push(number)
    } else {
      seen.add(number)
      if (!auditedSet.has(number)) gaps.push(number)
    }
  }
  return { gaps, reused }
}

/* ==================================================================== *
 * PUBLICATION.
 * ==================================================================== */

export interface PublishSubmission {
  readonly submissionId: string
  readonly tenant: TenantId
  /** The three-stage chain's own state. Only `Released` may be published. */
  readonly state: SubmissionState
  readonly author: string
  readonly reviewer: string | null
  readonly releaseAuthority: string | null
  readonly bump: VersionBumpClass | null
  /** L33429 — mandatory. No role may publish without it. */
  readonly description: string
  readonly basedOn: string
  readonly approvalLog: readonly string[]
  readonly staffing: ChainStaffing
  /** C6 — injected. Defaults to the engine that HOLDS. */
  readonly diff?: VersionDiffEngine
}

/**
 * Publish a version.
 *
 * ORDER, and why each step sits where it does. Each names the most specific
 * missing condition available at that point, so a Release Authority is never
 * told about a later obstacle while an earlier one is the real answer.
 *
 *  1. **Authorisation** — row 4 of the matrix, through task 1's evaluator,
 *     which is where separation of duties bites by identity. L53602: "A Client
 *     Command Center user cannot publish anything", and only the Quality
 *     Manager holds this row at all, as Release Authority.
 *  2. **The preconditions L33471 states** — all three approval stages passed,
 *     a classification present, a republish description present.
 *  3. **THE ELEVEN PUBLISH CHECKS.** Blocked is blocked; there is no argument
 *     to this function that can reach step 7 with a blocker outstanding.
 *  4. **The diff**, because the classification is validated against it and an
 *     unavailable engine HOLDS the submission rather than advancing it.
 *  5. **The classification**, because a mis-classified patch is returned.
 *  6. **The number**, because a version number is never re-used.
 *  7. **The audit write, then the mutation**, through the one mutator.
 *
 * Step 7's mutation does four things and deliberately not a fifth: it appends
 * the minted version, supersedes the prior Published one, writes the adoption
 * rows a notified class requires, and clears the pending submission. It does
 * **not** touch `register.runs`. An in-flight Run finishes on the version it
 * started (`AC-STU-108`), and the way to guarantee that is for publication to
 * have no code that could change a pin.
 */
export function publish(
  register: VersionRegister,
  submission: PublishSubmission,
  context: VersionContext,
  checks: PublishCheckRegister<ApprovalPublishSubject>,
): VersionOutcome {
  const row = versionRow('publish-a-version')

  // 1. AUTHORISATION.
  const decision = versionAffordance(row, context, submission.tenant, {
    author: submission.author,
    reviewer: submission.reviewer,
    releaseAuthority: submission.releaseAuthority,
  })
  if (!PERMITS.publish.has(decision.outcome)) {
    return refuse(register, context, 'publish', 'not-authorised', decision.reason, [...row.sourceRefs, ...decision.decision.sourceRefs], { outcome: decision.outcome })
  }

  // 2. THE PRECONDITIONS (L33471).
  if (submission.state !== 'Released') {
    return refuse(
      register,
      context,
      'publish',
      'not-released',
      `“${submission.submissionId}” is ${submission.state}, and only a submission that has passed all three approval stages may be published. The Release Authority cannot be bypassed.`,
      ['L33471', 'L33511', 'AC-STU-099 L33399'],
    )
  }
  if (submission.bump === null) {
    return refuse(
      register,
      context,
      'publish',
      'classification-missing',
      'No bump classification has been selected. The classification decides how the change reaches the floor, so publication has nothing to distribute against.',
      ['L33424', 'L33471', 'AC-STU-105 L33583'],
    )
  }
  if (submission.description.trim() === '') {
    return refuse(
      register,
      context,
      'publish',
      'description-missing',
      'The mandatory republish description is empty. It is the permanent history entry for every class and the worker-facing change notice for a notified class, and no role may publish without it.',
      ['L33429', 'FUNC-STU-12-01-B-1 L33488', 'AC-STU-105 L33583'],
    )
  }

  // 3. THE ELEVEN PUBLISH CHECKS. Fail closed, three ways, no way past.
  const evaluation = evaluatePublish(checks, {
    staffing: submission.staffing,
    author: submission.author,
  })
  if (evaluation.blocked) {
    const named = evaluation.blockers
      .map((b) => `${b.checkId} (check ${b.ordinal}) — ${b.blockingElement}`)
      .join('; ')
    return refuse(
      register,
      context,
      'publish',
      'publish-checks-blocked',
      `Publication is blocked, failing closed, with the specific check named: ${named}. Nothing is published; the prior version remains in force.`,
      ['FB-STU-09 L31453', 'AC-STU-149 L34487', 'L48330'],
      { blockers: evaluation.blockers },
    )
  }

  // 4. THE DIFF (C6 — injected, defaulting to unavailable).
  const engine = submission.diff ?? versionDiffUnavailable
  const diff = engine.diff(submission.basedOn, '(pending)')
  if (!diff.available) {
    return refuse(
      register,
      context,
      'publish',
      'diff-unavailable',
      `${diff.reason} The submission is held rather than advanced, because advancing an unvalidated classification could auto-adopt a behaviour change.`,
      ['FUNC-STU-12-01-A-2 L33486', 'FB-STU-03 L31447'],
    )
  }

  // 5. THE CLASSIFICATION, VALIDATED AGAINST THE DIFF (AC-STU-106).
  const minimum = minimumBumpFor(diff.changeKinds)
  if (submission.bump === 'PATCH' && minimum !== 'PATCH') {
    const notified = diff.changeKinds.filter((k) => minimumBumpFor([k]) !== 'PATCH')
    return refuse(
      register,
      context,
      'publish',
      'misclassified-patch',
      `The diff carries ${notified.join(', ')}, which is an enforced behaviour change and cannot be published as a PATCH. The submission is returned to the Author for reclassification as ${minimum}; a mis-classified patch would auto-adopt without a Job Owner decision.`,
      ['L33424', 'L33427', 'AC-STU-106 L33584', 'TEST-STU-111 L33595'],
    )
  }

  // 6. THE NUMBER, WHICH IS NEVER RE-USED (L33579).
  const number = nextVersionNumber(submission.basedOn, submission.bump)
  if (mintedNumbers(register).includes(number)) {
    return refuse(
      register,
      context,
      'publish',
      'version-number-reused',
      `${number} has already been minted for this Workflow and a version number is never re-used. The gap is reported rather than the number being issued a second time.`,
      ['L33579', 'TEST-STU-116 L33600'],
      { versionNumber: number },
    )
  }

  // 7. THE AUDIT WRITE, THEN THE MUTATION.
  const bump = submission.bump
  const autoAdopts = bump === 'PATCH'
  const minted: PublishedVersion = {
    number,
    tenant: submission.tenant,
    bump,
    description: submission.description,
    state: 'Published',
    publishedAt: context.at,
    releaseAuthority: context.actor.identityId,
    // D21 — minted versioned, NOT distributable. The package build is a
    // separate act in MOD-STU-14, and until it runs this version has never
    // been safe to run.
    distributable: false,
    autoAdopts,
    approvalLog: submission.approvalLog,
    basedOn: submission.basedOn,
  }
  const notifiedRows: readonly JobAdoption[] = autoAdopts
    ? []
    : register.jobs
        .filter((job) => job.onVersion === submission.basedOn)
        .map((job) => ({
          jobId: job.jobId,
          ownerId: job.ownerId,
          onVersion: job.onVersion,
          decision: null,
          notifiedAt: context.at,
          decidedAt: null,
          windowHours: job.windowHours,
        }))

  return applyVersionAct(
    register,
    {
      act: 'publish',
      versionNumber: number,
      detail: `${number} published as ${bump} by ${context.actor.identityId} against ${submission.submissionId}: ${submission.description}`,
      mutate: (current) => ({
        ...current,
        versions: [
          minted,
          ...current.versions.map((v) =>
            v.number === submission.basedOn && v.state === 'Published'
              ? { ...v, state: 'Superseded' as const }
              : v,
          ),
        ],
        adoption: [...current.adoption, ...notifiedRows],
        pendingSubmission: null,
        // `runs` is untouched, and that omission is the guarantee.
      }),
    },
    context,
  )
}

/* ==================================================================== *
 * ADOPTION — the decision that keys on a FIELD.
 * ==================================================================== */

/**
 * The adoption row, built for ONE Job, with the Job-Owner rider resolved
 * against that Job's own owner field.
 *
 * This is where row 5 stops being a role check. The rider lives on the CELL,
 * so this rewrites only the cells that carry it, and only when the acting
 * identity IS the value of `job.ownerId`. The Read-only Auditor's cell and the
 * Worker's cell carry no rider and are left exactly as the source wrote them.
 */
export function adoptionRowFor(job: JobAdoption, identityId: string): StudioVersionMatrixRow {
  const row = versionRow('decide-adoption')
  if (job.ownerId !== identityId) return row
  const cells = Object.fromEntries(
    Object.entries(row.cells).map(([column, cell]) => [
      column,
      cell.unlessJobOwner
        ? {
            ...cell,
            outcome: 'allowed' as const,
            note: `Allowed — ${identityId} is the value of this Job’s owner field, and the decision keys to the Job Owner field rather than to a role`,
          }
        : cell,
    ]),
  ) as StudioVersionMatrixRow['cells']
  return { ...row, cells }
}

/**
 * Record the Job Owner's adoption decision.
 *
 * `FUNC-STU-12-02-B-1` (L33493): "Roles allowed: the Job Owner. Roles
 * prohibited: no agent, and no Studio role acting for the Job Owner."
 */
export function decideAdoption(
  register: VersionRegister,
  job: JobAdoption,
  choice: 'adopt' | 'defer',
  context: VersionContext,
): VersionOutcome {
  const row = adoptionRowFor(job, context.actor.identityId)
  const decision = versionAffordance(row, context, register.tenant)
  if (!PERMITS['decide-adoption'].has(decision.outcome)) {
    return refuse(
      register,
      context,
      'decide-adoption',
      'not-authorised',
      `${decision.reason} The adoption decision keys to the Job Owner field on ${job.jobId}, which names ${job.ownerId}; a Supervisor cannot force adoption on a Job they do not own, and no Studio role acts for the Job Owner.`,
      [...row.sourceRefs, 'L53602'],
      { outcome: decision.outcome },
    )
  }
  const decided: JobAdoption = { ...job, decision: choice, decidedAt: context.at }
  return applyVersionAct(
    register,
    {
      act: 'decide-adoption',
      versionNumber: job.onVersion,
      detail: `${job.jobId} — the Job Owner field names ${job.ownerId} and ${context.actor.identityId} decided to ${choice} against ${job.onVersion}`,
      mutate: (current) => ({
        ...current,
        adoption: current.adoption.some((a) => a.jobId === job.jobId)
          ? current.adoption.map((a) => (a.jobId === job.jobId ? decided : a))
          : [...current.adoption, decided],
      }),
    },
    context,
  )
}

/* ==================================================================== *
 * ARCHIVAL — and `DEC-ARCH-001`.
 * ==================================================================== */

/**
 * The no-active-Jobs indicator, read across the linkage seam. Three-valued by
 * construction rather than by convention: a `boolean` could not express "the
 * indicator could not be computed", and that is the one case L33505 legislates.
 */
export type NoActiveJobsIndicator =
  | { readonly determinable: true; readonly activeJobs: readonly string[] }
  | { readonly determinable: false; readonly reason: string }

function versionByNumber(register: VersionRegister, number: string): PublishedVersion | null {
  return register.versions.find((v) => v.number === number) ?? null
}

function archivalRefusal(
  register: VersionRegister,
  act: 'archive' | 'unarchive',
  number: string,
  context: VersionContext,
): VersionFailure | null {
  const version = versionByNumber(register, number)
  const origin: VersionOrigin = version === null ? 'no-version' : version.state
  if (!transitionIsDrawn(act, origin)) {
    return refuse(
      register,
      context,
      act,
      'wrong-state',
      `“${act}” is not drawn from ${version === null ? 'a version that does not exist' : `“${origin}”`}. The version state machine moves only along the edges the source draws, and this is not one of them.`,
      [transition(act).sourceRef, 'L33479'],
      { versionNumber: number },
    )
  }
  const row = versionRow('archive-a-version')
  const decision = versionAffordance(row, context, register.tenant)
  if (!PERMITS[act].has(decision.outcome)) {
    return refuse(
      register,
      context,
      act,
      'not-authorised',
      `${decision.reason} Archival is the Quality Manager’s act alone, and no version is ever archived automatically when its Jobs are archived.`,
      [...row.sourceRefs, ...decision.decision.sourceRefs],
      { outcome: decision.outcome, versionNumber: number },
    )
  }
  return null
}

/**
 * Archive a version deliberately, against a clear no-active-Jobs indicator.
 *
 * `FUNC-STU-12-03-D-1` (L33505): "where the no-active-Jobs indicator cannot be
 * computed, archival is blocked rather than performed on an assumption."
 */
export function archive(
  register: VersionRegister,
  number: string,
  indicator: NoActiveJobsIndicator,
  context: VersionContext,
): VersionOutcome {
  const refused = archivalRefusal(register, 'archive', number, context)
  if (refused !== null) return refused

  if (!indicator.determinable) {
    return refuse(
      register,
      context,
      'archive',
      'indicator-uncomputable',
      `The no-active-Jobs indicator for ${number} cannot be computed: ${indicator.reason}. Archival is blocked rather than performed on an assumption, because an unreadable indicator is not evidence that no Job is running this version.`,
      ['FUNC-STU-12-03-D-1 L33505', 'FB-STU-07 L31451'],
      { versionNumber: number },
    )
  }
  if (indicator.activeJobs.length > 0) {
    return refuse(
      register,
      context,
      'archive',
      'active-jobs-exist',
      `${number} still has active Jobs and cannot be archived: ${indicator.activeJobs.join(', ')}. The Archive control names them rather than reporting a bare refusal.`,
      ['L33440', 'TEST-STU-112 L33596', 'SB-STU-15 L33546'],
      { versionNumber: number },
    )
  }

  return applyVersionAct(
    register,
    {
      act: 'archive',
      versionNumber: number,
      detail: `${number} archived by ${context.actor.identityId} against a clear no-active-Jobs indicator`,
      mutate: (current) => ({
        ...current,
        versions: current.versions.map((v) =>
          v.number === number ? { ...v, state: 'Archived' as const } : v,
        ),
      }),
    },
    context,
  )
}

/**
 * `Superseded when a later version exists` (L33479), read as a comparison
 * rather than as a stored flag. An unparseable number sorts below everything,
 * so a malformed row can never make a real version look superseded.
 */
function versionOrder(number: string): readonly [number, number, number] {
  const parts = /^v(\d+)\.(\d+)\.(\d+)$/.exec(number)
  return parts === null
    ? [-1, -1, -1]
    : [Number(parts[1]), Number(parts[2]), Number(parts[3])]
}

function laterVersionExists(register: VersionRegister, number: string): boolean {
  const mine = versionOrder(number)
  return register.versions.some((v) => {
    if (v.number === number) return false
    const other = versionOrder(v.number)
    for (let i = 0; i < 3; i += 1) {
      if (other[i]! !== mine[i]!) return other[i]! > mine[i]!
    }
    return false
  })
}

/**
 * Un-archive a version, with an audited reason.
 *
 * `DEC-ARCH-001` is OPEN and this build takes option (a) as a client-delegated
 * choice under `APP-012` — disclosed on the screen with all three options, and
 * never presented as the source's ruling. The restored state is DERIVED: a
 * version with a later one in the register returns to `Superseded`, so an
 * un-archived version can never claim to be in force while a newer one is.
 */
export function unarchive(
  register: VersionRegister,
  number: string,
  reason: string,
  context: VersionContext,
): VersionOutcome {
  const refused = archivalRefusal(register, 'unarchive', number, context)
  if (refused !== null) return refused

  if (reason.trim() === '') {
    return refuse(
      register,
      context,
      'unarchive',
      'reason-required',
      'Un-archival carries a mandatory audited reason, and it is empty. Option (a) of DEC-ARCH-001 is “reversible by the Quality Manager with an audited reason”, and a reversal with no reason records nothing an auditor can read.',
      ['DEC-ARCH-001 L33443'],
      { versionNumber: number },
    )
  }

  const restored: VersionState = laterVersionExists(register, number) ? 'Superseded' : 'Published'
  return applyVersionAct(
    register,
    {
      act: 'unarchive',
      versionNumber: number,
      detail: `${number} un-archived by ${context.actor.identityId} to ${restored} — reason: ${reason.trim()} (DEC-ARCH-001 option (a), a client-delegated choice under APP-012)`,
      mutate: (current) => ({
        ...current,
        versions: current.versions.map((v) => (v.number === number ? { ...v, state: restored } : v)),
      }),
    },
    context,
  )
}

/* ==================================================================== *
 * EXPORT — complete or failed, never partial.
 * ==================================================================== */

/**
 * What the export renders, in order. The four content modules L33562 names,
 * wrapped in the header and approval log L33575 requires so a document
 * circulating outside the platform can be traced back to its record.
 */
export type ExportSection =
  | 'header'
  | 'screen-configuration'
  | 'instruction-blocks'
  | 'difficulty-levels'
  | 'qualification-requirements'
  | 'approval-log'

export const EXPORT_SECTIONS = [
  'header',
  'screen-configuration',
  'instruction-blocks',
  'difficulty-levels',
  'qualification-requirements',
  'approval-log',
] as const satisfies readonly ExportSection[]

type MissingFromExportSections = Exclude<ExportSection, (typeof EXPORT_SECTIONS)[number]>
const _exportSectionsExhaustive: MissingFromExportSections extends never ? true : never = true
void _exportSectionsExhaustive

export type ExportSectionResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: string }

export type ExportRenderer = (section: ExportSection) => ExportSectionResult

export type ExportOutcome =
  | {
      readonly ok: true
      readonly register: VersionRegister
      readonly document: ExportDocument
      readonly audit: VersionAuditEntry
    }
  | VersionFailure

/**
 * Produce a formatted, read-only export of a version.
 *
 * `FUNC-STU-12-03-E-1` (L33507): "a partial export is never produced; the
 * export either completes or fails with the reason stated, because a partially
 * rendered specification document is worse than none." So every section is
 * rendered BEFORE anything is written, and one failure discards all six —
 * there is no path on which a partially rendered document reaches the register.
 */
export function exportVersion(
  register: VersionRegister,
  number: string,
  render: ExportRenderer,
  context: VersionContext,
): ExportOutcome {
  const version = versionByNumber(register, number)
  if (version === null) {
    return refuse(
      register,
      context,
      'export',
      'wrong-state',
      `No version ${number} exists in this Workflow’s history, so there is nothing to export.`,
      ['L33441'],
      { versionNumber: number },
    )
  }

  const row = versionRow('export-a-version')
  const decision = versionAffordance(row, context, version.tenant)
  // `readOnly` is admitted here and only here: the cell reads "Read-only —
  // may generate the read-only export", and the instruction is inside the
  // token. Mapping it to a disabled control removes an export the source grants.
  if (!PERMITS.export.has(decision.outcome)) {
    return refuse(
      register,
      context,
      'export',
      'not-authorised',
      decision.reason,
      [...row.sourceRefs, ...decision.decision.sourceRefs],
      { outcome: decision.outcome, versionNumber: number },
    )
  }

  const rendered: { section: ExportSection; text: string }[] = []
  for (const section of EXPORT_SECTIONS) {
    const result = render(section)
    if (!result.ok) {
      return refuse(
        register,
        context,
        'export',
        'export-incomplete',
        `The export of ${number} failed at the ${section} section: ${result.reason}. No document is produced — a partially rendered specification document is worse than none.`,
        ['FUNC-STU-12-03-E-1 L33507', 'AC-STU-111 L33589', 'FB-STU-07 L31451'],
        { versionNumber: number },
      )
    }
    rendered.push({ section, text: result.text })
  }

  const produced: ExportDocument = {
    versionNumber: version.number,
    publishedAt: version.publishedAt,
    approvalLog: version.approvalLog,
    readOnly: true,
    sections: rendered,
    generatedAt: context.at,
  }
  const outcome = applyVersionAct(
    register,
    {
      act: 'export',
      versionNumber: number,
      detail: `A read-only export of ${number} was generated by ${context.actor.identityId}, carrying the version number, the publication date and the approval log`,
      mutate: (current) => ({ ...current, exports: [...current.exports, produced] }),
    },
    context,
  )
  return outcome.ok
    ? { ok: true, register: outcome.register, document: produced, audit: outcome.audit }
    : outcome
}

/* ==================================================================== *
 * WHAT THE SCREEN READS. Scope is enforced HERE, not in what it draws.
 * ==================================================================== */

/**
 * The versions this persona may read.
 *
 * A version belonging to another workspace never reaches the render at all —
 * slice 3's `TENANT_ISOLATION` stage refuses it, fed each version's own
 * tenant, rather than a `filter` this module maintains beside it. And a
 * persona whose history cell refuses reads an empty list rather than a
 * filtered one: nothing is drawn and then hidden.
 */
export function visibleVersions(
  register: VersionRegister,
  context: VersionContext,
): readonly PublishedVersion[] {
  const row = versionRow('view-version-history')
  return register.versions.filter((version) => {
    const decision = versionAffordance(row, context, version.tenant)
    return ACTING_OR_READ_ONLY.has(decision.outcome) && !isRefusal(decision.decision)
  })
}

/**
 * The linkage this persona may read, or the declared absence. `AC-STU-053`
 * (L32018) / `FUNC-STU-12-03-C-1` (L33503): "unavailable linkage renders as
 * unavailable with a timestamp, never as zero", because zero is a business
 * answer and this is the absence of one.
 */
export type LinkageReading =
  | { readonly available: true; readonly jobs: readonly LinkedJob[] }
  | { readonly available: false; readonly lastRetrievedAt: string; readonly reason: string }

export function visibleLinkage(
  register: VersionRegister,
  context: VersionContext,
  reading: LinkageReading,
): LinkageReading {
  const row = versionRow('view-job-and-run-linkage')
  const decision = versionAffordance(row, context, register.tenant)
  if (!ACTING_OR_READ_ONLY.has(decision.outcome)) {
    return { available: false, lastRetrievedAt: 'never', reason: decision.reason }
  }
  return reading
}

/* ==================================================================== *
 * THE ROLLBACK QUESTION — two identifiers, and four refusals that are not open.
 * ==================================================================== */

export interface VersionActRefusal {
  readonly ok: false
  readonly reason: string
  readonly sourceRefs: readonly string[]
}

function structuralRefusal(reason: string, sourceRefs: readonly string[]): VersionActRefusal {
  return { ok: false, reason, sourceRefs }
}

/**
 * The four acts L53706 refuses outright, plus the pin swap L33469 refuses in
 * every column.
 *
 * These are NOT audited here, and that is deliberate rather than an omission:
 * every one of them is `Explicitly prohibited`, which carries no rendering, so
 * no control offers them and there is no attempt to record. The audited
 * refusal path is `applyVersionAct`'s, and it covers every act a control can
 * actually reach.
 */
export function deleteVersion(version: PublishedVersion): VersionActRefusal {
  return structuralRefusal(
    `Deleting ${version.number} is refused. Prior versions are retained in full and remain permanently readable, because the floor may already have run this version and the version number is the audit receipt for which limits were in force.`,
    ['L53706', 'L33435', 'FUNC-STU-12-03-A-1 L33499'],
  )
}

export function hideVersion(version: PublishedVersion): VersionActRefusal {
  return structuralRefusal(
    `Hiding ${version.number} is refused, for the same reason deleting it is: the platform does not un-publish a version, because the floor may already have run it.`,
    ['L53703', 'L53706'],
  )
}

export function editInPlace(version: PublishedVersion): VersionActRefusal {
  return structuralRefusal(
    `Editing ${version.number} in place is refused. Version records are immutable once published; a correction is a new version, never an edit.`,
    ['L53706', 'L33575'],
  )
}

export function swapPinnedPackage(run: PinnedRun, to: string): VersionActRefusal {
  return structuralRefusal(
    `Swapping ${run.runId}’s pinned package to ${to} is refused for every role and every agent: a run finishes on the workflow version it started on. A publication cannot re-base an in-flight run; the correct response to a bad version already running is operational — cancel or complete under supervision — not technical.`,
    ['FUNC-STU-12-02-C-1 L33496', 'AC-STU-108 L33586', 'L53602', 'L53707', 'FB-STU-10 L31454'],
  )
}

export type RollbackOutcome =
  | {
      readonly ok: true
      /** Always `false`. The bad version is never withdrawn from history. */
      readonly unpublished: false
      /** Always `true`. Nothing reaches the frontline without sign-off. */
      readonly reEntersChain: true
      readonly basedOn: string
      readonly note: string
      readonly sourceRefs: readonly string[]
    }
  | VersionActRefusal

/**
 * Roll back a defective published version — which is a FORWARD act.
 *
 * L53703: "A published version turns out to be wrong. The platform does not
 * un-publish it, because the floor may already have run it. Instead the
 * previous content is put through the chain again and comes out as a new,
 * higher version number."
 *
 * This returns the instruction and mints nothing: the new number is minted by
 * `publish`, at the end of the chain, exactly like any other version. Skipping
 * the chain is refused — "nothing reaches the frontline without sign-off at
 * each stage" (L53706).
 */
export function rollback(
  version: PublishedVersion,
  options: { readonly skipChain: boolean },
): RollbackOutcome {
  if (options.skipChain) {
    return structuralRefusal(
      `A rollback of ${version.number} that does not go through the three-stage chain is refused. Nothing reaches the frontline without sign-off at each stage, and a rollback is not an exception to that.`,
      ['L53706', 'L33243'],
    )
  }
  return {
    ok: true,
    unpublished: false,
    reEntersChain: true,
    basedOn: version.number,
    note: `The content behind ${version.number} re-enters the three-stage chain as a new submission and comes out as a new, higher version number. ${version.number} stays published and permanently readable; in-flight runs continue on it and cannot be re-based, so the correct response there is operational — cancel or complete under supervision — not technical.`,
    sourceRefs: ['L53703', 'L53706', 'L53707'],
  }
}

/**
 * `DEC-WFROLL-001` and `DEC-VERROLL-001` — the disclosure this module owns.
 *
 * The QUESTION is open and the shared decision canon carries it as `D7`, with
 * both identifiers and both locator sets; the screen renders it through task
 * 3's `DecisionDisclosure` and nothing here duplicates it. What this record
 * adds is the half that is NOT open: the rollback BEHAVIOUR is stated
 * outright, and folding the settled behaviour into the open question would
 * render a refusal the source states as an undecided one.
 */
export const ROLLBACK_DISCLOSURE = {
  canonicalDecision: 'DEC-WFROLL-001',
  aliasDecision: 'DEC-VERROLL-001',
  openQuestion:
    'Whether a version can be marked withdrawn so that no new Job may link to it. Two source identifiers ask this with no cross-reference between them, and neither is obeyed as settling it.',
  settledBehaviour: [
    {
      statement: 'A published version is never un-published, because the floor may already have run it.',
      locator: 'L53703',
    },
    {
      statement: 'Deleting or hiding a published version is refused; prior versions are retained in full.',
      locator: 'L53706',
    },
    {
      statement: 'Rolling back by editing a published version in place is refused.',
      locator: 'L53706',
    },
    {
      statement: 'Skipping the chain for a rollback is refused — nothing reaches the frontline without sign-off at each stage.',
      locator: 'L53706',
    },
    {
      statement: 'In-flight runs cannot be re-based, so the correct response is operational — cancel or complete under supervision — not technical.',
      locator: 'L53707',
    },
  ],
} as const
