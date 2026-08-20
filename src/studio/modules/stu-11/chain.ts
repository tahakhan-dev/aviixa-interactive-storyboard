import type { RoleId } from '@/domain/roles'
import type { TenantId } from '@/domain/ids'
import type { ScenarioDomainState } from '@/domain/state'
import { isRefusal, type PermissionDecision } from '@/policy/decision'
import {
  evaluateStudioAccess,
  STUDIO_APPROVAL_STAGES,
  type IdentityLayerState,
  type StudioAccessDecision,
  type StudioAccessInput,
  type StudioApprovalStage,
  type StudioIdentity,
} from '@/studio/access/evaluate'
import type { StudioCommercialTier, StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import type { StudioModuleId } from '@/studio/modules'
import type { SubmissionState } from '@/studio/vocab'
import type { PublishCheckImplementation } from '@/studio/publish/register'
import { routedProhibitionApplies } from '@/studio/modules/stu-18/rendering'
import { approvalRow, type StudioApprovalCapabilityId } from './matrix'

/**
 * `MOD-STU-11` — the approval chain **as a service**.
 *
 * S2: this is not a screen with a workflow behind it. Four other modules reuse
 * it (`FUNC-STU-11-06-A-1`, L33320: "one governance floor for everything that
 * reaches the floor"), so the chain is a value plus a set of pure transitions
 * and the screen is one consumer of five.
 *
 * ### The four rules this file exists to hold
 *
 * 1. **A gate that can be bypassed is not a gate.** There is one mutator,
 *    `applyTransition`; the seven named wrappers all route through it; the
 *    audit sink is a REQUIRED field on the context with no default; and the
 *    transition table is closed data drawn from the source's own state diagram
 *    (L33343-L33350). `Released` has exactly one edge into it, from `Advanced`,
 *    taken by the Release Authority (L33355). Nothing here takes a waiver, a
 *    force, an acknowledgement or a severity below "refused".
 * 2. **Maker-checker is real, and it is checked by IDENTITY** (L33389,
 *    `TEST-STU-152` L34681). The evaluator does the checking; this file feeds
 *    it the stage occupancy, and it feeds it from the WHOLE history of the
 *    submission rather than from the current cycle, because a submission is
 *    one submission across every Submitted/Returned cycle it goes through
 *    (L33289).
 * 3. **A missing second person BLOCKS.** `DEC-RELAUTH-001`'s deadlock is
 *    detected before submission and names which stage has no eligible distinct
 *    holder. It never auto-approves and never substitutes an unauthorised
 *    role.
 * 4. **Notification is not completion.** The five notification rows are
 *    carried as data, every one of them marked as proving no approval, and no
 *    progression state is a submission state.
 *
 * ### Determinism
 *
 * No clock and no randomness. The transition timestamp is the caller's `at`,
 * the version is the injected diff engine's, and the same inputs fold to the
 * same chain every time.
 */

/* ==================================================================== *
 * THE FIVE REUSE CONSUMERS.
 * ==================================================================== */

export type ApprovalConsumer =
  | 'workflow'
  | 'training-library'
  | 'content-library-edit'
  | 'difficulty-level'
  | 'composed-agent'

export const APPROVAL_CONSUMERS = [
  'workflow',
  'training-library',
  'content-library-edit',
  'difficulty-level',
  'composed-agent',
] as const satisfies readonly ApprovalConsumer[]

type MissingFromConsumers = Exclude<ApprovalConsumer, (typeof APPROVAL_CONSUMERS)[number]>
const _consumersExhaustive: MissingFromConsumers extends never ? true : never = true
void _consumersExhaustive

export interface ApprovalConsumerContract {
  readonly id: ApprovalConsumer
  readonly ownerModule: StudioModuleId
  /** What the Reviewer steps through. `DEC-LIBREV-001` scopes one of them. */
  readonly previewScope: 'every screen' | 'the changed item only' | 'every drafted level' | 'the composition'
  /** The three stages, always three. A consumer may ADD a gate, never remove one. */
  readonly stages: readonly StudioApprovalStage[]
  readonly additionalGates: readonly string[]
  readonly decisionRef: string | null
  readonly sourceRef: string
}

export const APPROVAL_CONSUMER_CONTRACTS = [
  {
    id: 'workflow',
    ownerModule: 'MOD-STU-04',
    previewScope: 'every screen',
    stages: [...STUDIO_APPROVAL_STAGES],
    additionalGates: [],
    decisionRef: null,
    sourceRef: 'L33239-L33243, FUNC-STU-11-01-B-1 L33298',
  },
  {
    id: 'training-library',
    ownerModule: 'MOD-STU-08',
    previewScope: 'every screen',
    stages: [...STUDIO_APPROVAL_STAGES],
    additionalGates: [],
    decisionRef: null,
    sourceRef: 'FUNC-STU-08-02-A-1 L32846 — "identical governance floor to Workflow content"',
  },
  {
    id: 'content-library-edit',
    ownerModule: 'MOD-STU-07',
    // D17 / `DEC-LIBREV-001` (L32622): "lightweight review" is option (a) —
    // the FULL three-stage chain with a preview scoped to the changed item.
    // The source's own recommendation and its own interim treatment: "Until it
    // is decided, this blueprint treats library edits as passing the full
    // chain and records the divergence."
    previewScope: 'the changed item only',
    stages: [...STUDIO_APPROVAL_STAGES],
    additionalGates: [],
    decisionRef: 'DEC-LIBREV-001',
    sourceRef: 'FUNC-STU-07-04-B-1 L32678, DEC-LIBREV-001 L32622',
  },
  {
    id: 'difficulty-level',
    ownerModule: 'MOD-STU-09',
    previewScope: 'every drafted level',
    stages: [...STUDIO_APPROVAL_STAGES],
    additionalGates: [],
    decisionRef: null,
    sourceRef: 'FUNC-STU-09-02-A-1 L32994, L33249 — the same rule covers drafted difficulty levels',
  },
  {
    id: 'composed-agent',
    ownerModule: 'MOD-STU-15',
    previewScope: 'the composition',
    stages: [...STUDIO_APPROVAL_STAGES],
    // L33251: composed and modified agents "pass this same chain, PLUS an
    // evaluation gate and a platform review". Two gates added; none removed.
    additionalGates: ['an evaluation gate', 'a platform review'],
    decisionRef: null,
    sourceRef: 'FUNC-STU-15-03-B-1 L34052, L33251',
  },
] as const satisfies readonly ApprovalConsumerContract[]

/* ==================================================================== *
 * THE TRANSITIONS — the source's own state diagram, as data.
 * ==================================================================== */

export type ApprovalTransitionId =
  | 'submit'
  | 'withdraw'
  | 'return-with-comments'
  | 'advance'
  | 'resubmit'
  | 'release'
  | 'decline'

export const APPROVAL_TRANSITION_IDS = [
  'submit',
  'withdraw',
  'return-with-comments',
  'advance',
  'resubmit',
  'release',
  'decline',
] as const satisfies readonly ApprovalTransitionId[]

type MissingFromTransitionIds = Exclude<
  ApprovalTransitionId,
  (typeof APPROVAL_TRANSITION_IDS)[number]
>
const _transitionIdsExhaustive: MissingFromTransitionIds extends never ? true : never = true
void _transitionIdsExhaustive

/** The state a transition departs from. `no-submission` is the diagram's `Drafting`. */
export type ApprovalOrigin = SubmissionState | 'no-submission'

/** What a transition needs in the text field, and what to call it when it is empty. */
export type TextRequirement = 'comments' | 'decline-reason' | null

export interface ApprovalTransitionDefinition {
  readonly id: ApprovalTransitionId
  readonly from: readonly ApprovalOrigin[]
  readonly to: SubmissionState
  /** The matrix row that authorises it. Per-control, never a module role list. */
  readonly capability: StudioApprovalCapabilityId
  /** Which stage the actor occupies by performing it. */
  readonly stage: StudioApprovalStage
  /** `FUNC-STU-11-01-A-2` — withdrawal and correction are the Author's own acts. */
  readonly authorOnly: boolean
  readonly requiresText: TextRequirement
  /** `FUNC-STU-12-01-A-2` (L33486) — the classification is validated against the diff. */
  readonly requiresDiff: boolean
  readonly mintsVersion: boolean
  readonly sourceRef: string
}

export const APPROVAL_TRANSITIONS = [
  {
    id: 'submit',
    from: ['no-submission'],
    to: 'Submitted',
    capability: 'author-and-submit',
    stage: 'author',
    authorOnly: false,
    requiresText: null,
    requiresDiff: false,
    mintsVersion: false,
    sourceRef: 'L33343 "Drafting --> Submitted : Author submits", FUNC-STU-11-01-A-1 L33295',
  },
  {
    id: 'withdraw',
    from: ['Submitted'],
    to: 'Withdrawn',
    capability: 'author-and-submit',
    stage: 'author',
    authorOnly: true,
    requiresText: null,
    requiresDiff: false,
    mintsVersion: false,
    sourceRef:
      'L33345 "Submitted --> Withdrawn : Author withdraws before review", FUNC-STU-11-01-A-2 L33296 (Recommendation — R&D; the Statement of Work does not describe withdrawal)',
  },
  {
    id: 'return-with-comments',
    from: ['Submitted'],
    to: 'Returned with comments',
    capability: 'return-with-comments',
    stage: 'reviewer',
    authorOnly: false,
    requiresText: 'comments',
    requiresDiff: false,
    mintsVersion: false,
    sourceRef: 'L33346, FUNC-STU-11-01-B-2 L33299, L53535 (rejection without comments is refused)',
  },
  {
    id: 'advance',
    from: ['Submitted'],
    to: 'Advanced',
    capability: 'advance-to-release',
    stage: 'reviewer',
    authorOnly: false,
    requiresText: null,
    requiresDiff: true,
    mintsVersion: false,
    sourceRef: 'L33348 "UnderReview --> AwaitingRelease : Reviewer advances", FUNC-STU-12-01-A-2 L33486',
  },
  {
    id: 'resubmit',
    from: ['Returned with comments'],
    to: 'Submitted',
    capability: 'author-and-submit',
    stage: 'author',
    authorOnly: true,
    requiresText: null,
    requiresDiff: false,
    mintsVersion: false,
    sourceRef:
      'L33347 "Returned --> Drafting : Author corrects" then L33343, AC-WF-AUT-007-01/04 L53575',
  },
  {
    id: 'release',
    from: ['Advanced'],
    to: 'Released',
    capability: 'release-and-publish',
    stage: 'release-authority',
    authorOnly: false,
    requiresText: null,
    requiresDiff: true,
    mintsVersion: true,
    sourceRef: 'L33350 "AwaitingRelease --> Released", FUNC-STU-11-01-C-1 L33302',
  },
  {
    id: 'decline',
    from: ['Advanced'],
    to: 'Returned with comments',
    // FINDING: the matrix names no Decline row. `SB-STU-14` (L33357) puts
    // "Release and Decline controls and a mandatory reason field on Decline"
    // at the SAME stage, so row 6 governs both — a Decline is the Release
    // Authority stage refusing, not a separate authority.
    capability: 'release-and-publish',
    stage: 'release-authority',
    authorOnly: false,
    requiresText: 'decline-reason',
    requiresDiff: false,
    mintsVersion: false,
    sourceRef: 'L33349 "AwaitingRelease --> Returned : Release Authority declines with a reason", SB-STU-14 L33357',
  },
] as const satisfies readonly ApprovalTransitionDefinition[]

type MissingFromTransitions = Exclude<ApprovalTransitionId, (typeof APPROVAL_TRANSITIONS)[number]['id']>
const _transitionsExhaustive: MissingFromTransitions extends never ? true : never = true
void _transitionsExhaustive

const TRANSITION_BY_ID: Readonly<Record<ApprovalTransitionId, ApprovalTransitionDefinition>> =
  Object.fromEntries(
    APPROVAL_TRANSITIONS.map((t): [ApprovalTransitionId, ApprovalTransitionDefinition] => [t.id, t]),
  ) as Record<ApprovalTransitionId, ApprovalTransitionDefinition>

/**
 * FINDING — the state diagram draws SEVEN nodes; L33289 enumerates FIVE
 * states. D21's ruling is that the module identity card governs the
 * enumeration, so `Drafting` and `UnderReview` are recorded here rather than
 * minted as states. `AwaitingRelease` is not in this list: it is the diagram's
 * label for the enumerated `Advanced`.
 */
export const DIAGRAM_ONLY_NODES = [
  {
    node: 'Drafting',
    note:
      'The diagram’s entry node (L33335). It is the state before a submission exists at all, which is why this model calls that origin `no-submission` rather than adding a sixth submission state.',
    sourceRef: 'L33335, L33343, L33347',
  },
  {
    node: 'UnderReview',
    note:
      'The Reviewer opening the submission from the queue (L33344). It records no transition of its own — the two lawful reviewer outcomes are Return and Advance (FUNC-STU-11-01-B-2, L33299) — so opening a submission changes nothing and is not an enumerated state.',
    sourceRef: 'L33338, L33344',
  },
] as const

/* ==================================================================== *
 * STAFFABILITY — `FUNC-STU-11-02-A-2` (L33307), publish check 11.
 * ==================================================================== */

export interface ChainStaffing {
  /** Identities that may author and submit — row 1 of the matrix. */
  readonly authoringGrantHolders: readonly string[]
  /** Identities that may act as Reviewer — row 2. */
  readonly reviewerEligible: readonly string[]
  /** The tenant-default Release Authority plus any per-workflow override. */
  readonly releaseAuthorityEligible: readonly string[]
}

export type StaffabilityVerdict =
  | { readonly staffable: true }
  | {
      readonly staffable: false
      readonly shortfall: StudioApprovalStage
      readonly reason: string
    }

const STAGE_LABEL: Readonly<Record<StudioApprovalStage, string>> = {
  author: 'Author',
  reviewer: 'Reviewer',
  'release-authority': 'Release Authority',
}

/**
 * Can three DISTINCT people occupy the three stages, given this author?
 *
 * The whole point is naming which stage falls short, so this does not return a
 * boolean: `AC-STU-103` (L33403) requires the block to name the shortfall, and
 * `FB-STU-09` requires the specific check to be named. Brute force over the
 * candidate pairs, because there are at most two open stages.
 */
export function checkChainStaffable(
  staffing: ChainStaffing,
  author: string,
): StaffabilityVerdict {
  if (!staffing.authoringGrantHolders.includes(author)) {
    return {
      staffable: false,
      shortfall: 'author',
      reason: `${author} holds no authoring grant, so no Author stage can be occupied on this submission. The chain has no entry.`,
    }
  }
  const reviewers = staffing.reviewerEligible.filter((r) => r !== author)
  const releasers = staffing.releaseAuthorityEligible.filter((r) => r !== author)
  if (reviewers.length === 0) {
    return {
      staffable: false,
      shortfall: 'reviewer',
      reason: `No eligible Reviewer exists who is not ${author}. The Reviewer must be a different person from the Author (L33245), so this submission cannot be reviewed and therefore cannot be released.`,
    }
  }
  if (releasers.length === 0) {
    return {
      staffable: false,
      shortfall: 'release-authority',
      reason: `No eligible Release Authority exists who is not ${author}. The Release Authority cannot be bypassed (L33243), so the submission would stall at the release stage.`,
    }
  }
  const pairExists = reviewers.some((r) => releasers.some((a) => a !== r))
  if (!pairExists) {
    return {
      staffable: false,
      shortfall: 'release-authority',
      reason: `Only one person besides ${author} is eligible for both the Reviewer and the Release Authority stages, and no person may occupy two stages on one submission. This tenant can author and review but cannot release — DEC-RELAUTH-001's silent operational deadlock, named before the authoring cycle is spent rather than at release time.`,
    }
  }
  return { staffable: true }
}

/**
 * `Stalled` — D21's flag, DERIVED and never stored.
 *
 * A stored boolean nothing sets is a field that can only ever be stale, and
 * `applyTransition` has no honest moment to set one: the staffing check
 * refuses at submission, so a chain becomes stalled AFTER it was submitted,
 * when the people who could have finished it stop being eligible. Deriving it
 * from the staffing the caller holds now means it cannot drift from the truth.
 *
 * It is a flag and not a state: the enumeration stays at L33289's five. It
 * exists because the source names the state rather than leaving it implicit,
 * L68315: "Stalled is a named state rather than an implicit delay, so a
 * tenant can see that its own staffing is what is holding publication". The
 * transition it names is L68307. What it makes visible is the staffing
 * shortfall of `DEC-RELAUTH-001` (L33255): "The Workflow stalls and the floor
 * keeps running on the prior version, which is safe but is also a silent
 * operational deadlock".
 */
export function chainStalled(
  chain: ApprovalChain,
  staffing: ChainStaffing,
): { readonly stalled: boolean; readonly reason: string | null } {
  if (chain.state !== 'Submitted') return { stalled: false, reason: null }
  const verdict = checkChainStaffable(staffing, chain.authorOfRecord)
  return verdict.staffable
    ? { stalled: false, reason: null }
    : { stalled: true, reason: verdict.reason }
}

export interface ApprovalPublishSubject {
  readonly staffing: ChainStaffing
  readonly author: string
}

/**
 * Publish check eleven, `chain-staffable`, registered into Task 5's register.
 * `MOD-STU-11` is the only module the check names as an owner, so nobody else
 * can register it and this cannot register anything else.
 */
export const chainStaffablePublishCheck: PublishCheckImplementation<ApprovalPublishSubject> = {
  checkId: 'chain-staffable',
  implementedBy: 'MOD-STU-11',
  run: (subject) => {
    const verdict = checkChainStaffable(subject.staffing, subject.author)
    return verdict.staffable
      ? { outcome: 'passed' }
      : { outcome: 'blocked', blockingElement: `${STAGE_LABEL[verdict.shortfall]} — ${verdict.reason}` }
  },
}

/* ==================================================================== *
 * C6 — THE DIFF ENGINE IS INJECTED, AND ITS DEFAULT IS UNAVAILABLE.
 * ==================================================================== */

export type DiffResult =
  | {
      readonly available: true
      readonly changedScreens: number
      readonly changeSummary: string
      readonly nextVersion: string
    }
  | { readonly available: false; readonly reason: string }

export interface DiffEngine {
  /** `MOD-STU-12` owns the real one. This module never implements it. */
  readonly ownedBy: 'MOD-STU-12'
  readonly diff: (chain: ApprovalChain) => DiffResult
}

/**
 * THE DEFAULT, and the reason it is this one. An unwired diff engine must not
 * let a submission through: `FUNC-STU-12-01-A-2` (L33486) — "where the diff
 * engine is unavailable, the classification cannot be validated and the
 * submission is held rather than advanced, because advancing an unvalidated
 * classification could auto-adopt a behaviour change."
 */
export const diffUnavailable: DiffEngine = {
  ownedBy: 'MOD-STU-12',
  diff: () => ({
    available: false,
    reason:
      'The diff engine of MOD-STU-12 cannot be reached, so the classification cannot be validated against the diff.',
  }),
}

/**
 * A seeded stand-in carrying the source's own illustrative change summary and
 * diff (L33359). It is a fixture for this storyboard, not an implementation:
 * `MOD-STU-12` owns the engine and this module only consumes one.
 */
export const seededDiffEngine: DiffEngine = {
  ownedBy: 'MOD-STU-12',
  diff: () => ({
    available: true,
    changedScreens: 8,
    changeSummary: 'Torque specification updated per engineering change order; severity bands re-based',
    nextVersion: 'v2.2.0',
  }),
}

/* ==================================================================== *
 * THE CHAIN VALUE.
 * ==================================================================== */

export interface ApprovalComment {
  readonly by: string
  readonly at: string
  readonly text: string
  readonly transition: ApprovalTransitionId
}

export interface ApprovalAuditEntry {
  /** A refusal is recorded AS A REFUSAL and never as a transition. */
  readonly kind: 'transition' | 'refusal'
  readonly submissionId: string
  readonly transition: ApprovalTransitionId
  /** L33387 — role, timestamp, version and comments, permanently. */
  readonly actor: string
  readonly role: RoleId | null
  readonly at: string
  readonly version: string | null
  readonly comments: readonly string[]
  readonly fromState: SubmissionState | null
  readonly toState: SubmissionState | null
  readonly refusalCode: ApprovalRefusalCode | null
}

export type AuditWriteResult = { readonly ok: true } | { readonly ok: false; readonly reason: string }
export type AuditWrite = (entry: ApprovalAuditEntry) => AuditWriteResult

export interface ApprovalChain {
  readonly submissionId: string
  readonly consumer: ApprovalConsumer
  readonly subject: string
  readonly tenant: TenantId
  readonly state: SubmissionState
  /**
   * EVERY identity that has ever occupied each stage on this submission. This
   * is what separation of duties reads, and it reads the whole history rather
   * than the current cycle because L33289 makes one submission one submission
   * across every Submitted/Returned cycle: a person who reviewed cycle one
   * still cannot release cycle two.
   */
  readonly stageHistory: Readonly<Record<StudioApprovalStage, readonly string[]>>
  /** The Author. Corrections always go back to them (L33242). */
  readonly authorOfRecord: string
  /** Who holds the Reviewer stage for the CURRENT cycle. Cleared by a resubmit. */
  readonly reviewerOfRecord: string | null
  readonly releaseAuthorityOfRecord: string | null
  readonly comments: readonly ApprovalComment[]
  /** The permanent record. Refusals and transitions both, in order. */
  readonly log: readonly ApprovalAuditEntry[]
  readonly versionMinted: string | null
  /** How many times this submission has entered the queue. L33289. */
  readonly cycles: number
  /**
   * Whether the queue notification was delivered. It gates NOTHING:
   * `AC-WF-AUT-006-03` (L53543) — "Returned items are visible in the Author's
   * queue independently of notification delivery."
   */
  readonly notificationDelivered: boolean
}

export interface ApprovalContext {
  readonly actor: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
  readonly commercialTier: StudioCommercialTier
  readonly identityLayer: IdentityLayerState
  readonly domain: ScenarioDomainState
  readonly online: boolean
  /** The caller's timestamp. This module reads no clock. */
  readonly at: string
  /** REQUIRED, and deliberately without a default: a write with nowhere to
   *  record it is not a write this chain performs. */
  readonly audit: AuditWrite
  readonly staffing: ChainStaffing
  /** Defaults to `diffUnavailable`, which HOLDS rather than advances. */
  readonly diff?: DiffEngine
  /** The Reviewer's comments, or the Release Authority's Decline reason. */
  readonly comments?: string
}

export interface NewSubmission {
  readonly submissionId: string
  readonly consumer: ApprovalConsumer
  readonly subject: string
  readonly tenant: TenantId
}

export type ApprovalRefusalCode =
  | 'not-authorised'
  | 'wrong-stage'
  | 'not-the-author'
  | 'comments-required'
  | 'decline-reason-required'
  | 'diff-unavailable'
  | 'chain-not-staffable'
  | 'transition-not-recorded'

export const APPROVAL_REFUSAL_CODES = [
  'not-authorised',
  'wrong-stage',
  'not-the-author',
  'comments-required',
  'decline-reason-required',
  'diff-unavailable',
  'chain-not-staffable',
  'transition-not-recorded',
] as const satisfies readonly ApprovalRefusalCode[]

type MissingFromRefusalCodes = Exclude<ApprovalRefusalCode, (typeof APPROVAL_REFUSAL_CODES)[number]>
const _refusalCodesExhaustive: MissingFromRefusalCodes extends never ? true : never = true
void _refusalCodesExhaustive

export interface ApprovalRefusal {
  readonly code: ApprovalRefusalCode
  readonly transition: ApprovalTransitionId
  /** Plain words naming the specific missing condition (`AC-STU-155`). */
  readonly reason: string
  readonly sourceRefs: readonly string[]
  /**
   * Slice 3's decision, where the refusal came OUT OF the evaluator. `null`
   * on a chain-domain refusal — and that null is deliberate. `EvaluationStage`
   * has no member for "this transition is not drawn from this state", and
   * reporting a chain-domain refusal under a borrowed access stage would be a
   * lie about why, on a screen whose whole job is explaining refusals. The
   * chain's own `code` is the answer; nothing is borrowed.
   */
  readonly decision: PermissionDecision | null
}

export type ApprovalOutcome =
  | {
      readonly ok: true
      readonly state: SubmissionState
      readonly chain: ApprovalChain
      readonly audit: ApprovalAuditEntry
      readonly auditFailure: null
    }
  | {
      readonly ok: false
      /** The TRUE current stage, unchanged. L33365 — on reconnection the actor
       *  sees the true stage and repeats the transition. */
      readonly state: SubmissionState | null
      /** The chain, byte-for-byte as it was. `null` only on a refused submit. */
      readonly chain: ApprovalChain | null
      readonly refusal: ApprovalRefusal
      /** Set where the REFUSAL's own audit write failed. It never revives the
       *  refusal — a refusal that could not be recorded is still a refusal. */
      readonly auditFailure: string | null
    }

/* ==================================================================== *
 * THE AFFORDANCE QUESTION — per control, through task 1's evaluator.
 * ==================================================================== */

/**
 * The stage occupancy this actor faces, read from the WHOLE history. Where the
 * actor has ever held a stage, that stage reads as theirs so separation of
 * duties bites; otherwise it reads as the last holder, which is what a screen
 * displays.
 */
function occupancyFor(
  chain: ApprovalChain | null,
  actorId: string,
): Pick<StudioAccessInput, 'authorOfRecord' | 'reviewerOfRecord' | 'releaseAuthorityOfRecord'> {
  const held = (stage: StudioApprovalStage): string | null => {
    const occupants = chain?.stageHistory[stage] ?? []
    if (occupants.includes(actorId)) return actorId
    return occupants.length === 0 ? null : occupants[occupants.length - 1]!
  }
  return {
    authorOfRecord: held('author'),
    reviewerOfRecord: held('reviewer'),
    releaseAuthorityOfRecord: held('release-authority'),
  }
}

/**
 * May this actor take this capability on this chain? One row, one answer, one
 * evaluator. Every control on the screen asks this and nothing re-derives a
 * role, a grant or a stage.
 */
export function approvalAffordance(
  capability: StudioApprovalCapabilityId,
  context: ApprovalContext,
  chain: ApprovalChain | null,
): StudioAccessDecision {
  return evaluateStudioAccess({
    row: approvalRow(capability),
    identity: context.actor,
    grants: context.grants,
    commercialTier: context.commercialTier,
    identityLayer: context.identityLayer,
    state: context.domain,
    online: context.online,
    ...(chain === null ? {} : { resourceTenant: chain.tenant }),
    ...occupancyFor(chain, context.actor.identityId),
  })
}

/**
 * THE ROUTED PROHIBITION, ANSWERED IN THE DOMAIN RATHER THAN ON THE SCREEN.
 *
 * Returns the capability this identity is routed to on this row, or `null`
 * where the cell is not a routed prohibition. `SCR-STU-11` calls this and
 * draws what it returns; it derives no column and evaluates no permission of
 * its own, which is why the answer is checkable here without rendering
 * anything.
 *
 * **THE ROUTE IS CHECKED, NOT ASSERTED.** The pointer on the matrix row only
 * nominates a target; what decides the rendering is the EVALUATOR'S answer
 * for that target, for this same identity. `routedProhibitionApplies`
 * (`MOD-STU-18`, task 11's mechanism) is the one implementation of that
 * check, and a pointer at a row this identity does not hold returns `null` —
 * so the cell falls back to ABSENT and no disabled control is manufactured.
 *
 * The columns read are the ones the EVALUATOR resolved, never a column
 * re-derived from the persona: multi-role is additive (L33389), and asking a
 * column the evaluator did not resolve would answer for somebody else.
 */
export function approvalRoute(
  capability: StudioApprovalCapabilityId,
  context: ApprovalContext,
  chain: ApprovalChain | null,
): StudioApprovalCapabilityId | null {
  const row = approvalRow(capability)
  const decision = approvalAffordance(capability, context, chain)
  const routedTo =
    decision.personaColumns.map((column) => row.routedTo[column]).find((t) => t != null) ?? null
  const routedDecision = routedTo === null ? null : approvalAffordance(routedTo, context, chain)
  return routedProhibitionApplies(decision, routedTo, routedDecision) ? routedTo : null
}

/**
 * DELIBERATELY NOT AN `ApprovalRefusal`. Taking the Reviewer stage is not a
 * transition — the two lawful reviewer outcomes are Return and Advance
 * (`FUNC-STU-11-01-B-2`, L33299) — so naming one of them here would report the
 * refusal under a transition the actor never attempted. The evaluator's own
 * decision is the answer and nothing is borrowed to dress it up.
 */
export type ApprovalEligibility =
  | { readonly ok: true; readonly decision: StudioAccessDecision }
  | { readonly ok: false; readonly decision: StudioAccessDecision; readonly reason: string }

/**
 * May this identity take the **Reviewer** stage on this submission? The
 * queue's own read — it decides what to offer and it writes nothing. The
 * audited refusal happens when the actor attempts the act (`advance` or
 * `return-with-comments`), because that is the write.
 */
export function review(chain: ApprovalChain, context: ApprovalContext): ApprovalEligibility {
  const decision = approvalAffordance('review-a-submission', context, chain)
  return isRefusal(decision.decision)
    ? { ok: false, decision, reason: decision.reason }
    : { ok: true, decision }
}

/**
 * What the queue READS. Scope is enforced here, not in what the screen draws:
 * a submission belonging to another tenant never reaches the render at all,
 * and a persona whose approval-log cell refuses reads an empty queue rather
 * than a filtered one.
 *
 * Tenant isolation is slice 3's `TENANT_ISOLATION` stage doing the work, fed
 * the chain's own tenant — not a `filter` this module maintains beside it.
 */
export function visibleQueue(
  chains: readonly ApprovalChain[],
  context: ApprovalContext,
): readonly ApprovalChain[] {
  return chains.filter(
    (chain) => !isRefusal(approvalAffordance('read-the-approval-log', context, chain).decision),
  )
}

/* ==================================================================== *
 * THE ONE MUTATOR.
 * ==================================================================== */

function refuse(
  chain: ApprovalChain | null,
  definition: ApprovalTransitionDefinition,
  context: ApprovalContext,
  code: ApprovalRefusalCode,
  reason: string,
  sourceRefs: readonly string[],
  decision: PermissionDecision | null,
): ApprovalOutcome {
  // The refusal is recorded AS A REFUSAL. `AC-STU-102` and TEST-STU-104/105/106
  // all require an audit entry on a refused attempt, and slice 3 marks every
  // Studio refusal `RECORDED_AS_REFUSAL` (L34657).
  const written = context.audit({
    kind: 'refusal',
    submissionId: chain?.submissionId ?? '(no submission)',
    transition: definition.id,
    actor: context.actor.identityId,
    role: context.actor.roles[0] ?? null,
    at: context.at,
    version: chain?.versionMinted ?? null,
    comments: context.comments === undefined || context.comments.trim() === '' ? [] : [context.comments],
    fromState: chain?.state ?? null,
    toState: null,
    refusalCode: code,
  })
  return {
    ok: false,
    state: chain?.state ?? null,
    chain,
    refusal: { code, transition: definition.id, reason, sourceRefs, decision },
    // A failed audit NEVER revives the refusal. It is reported alongside it.
    auditFailure: written.ok ? null : written.reason,
  }
}

function appended(
  history: Readonly<Record<StudioApprovalStage, readonly string[]>>,
  stage: StudioApprovalStage,
  actorId: string,
): Readonly<Record<StudioApprovalStage, readonly string[]>> {
  const current = history[stage]
  return current.includes(actorId)
    ? history
    : { ...history, [stage]: [...current, actorId] }
}

const EMPTY_HISTORY: Readonly<Record<StudioApprovalStage, readonly string[]>> = {
  author: [],
  reviewer: [],
  'release-authority': [],
}

/**
 * THE ONE ENTRY POINT. Order, and why each step sits where it does:
 *
 *  1. the state machine, because "you cannot advance a released submission" is
 *     true of everyone and is the diagram's own answer (L33343-L33350);
 *  2. staffability, because `FUNC-STU-11-02-A-2` runs it BEFORE submission;
 *  3. the Author-only acts, because withdrawal and correction belong to the
 *     Author by name (`FUNC-STU-11-01-A-2`);
 *  4. authorisation, through the matrix row this transition names — which is
 *     where separation of duties bites, by identity;
 *  5. the mandatory text, because the comment is the instruction to the Author
 *     (L53535) and the Decline reason is a stated field (SB-STU-14);
 *  6. the diff, because the classification is validated against it (L33486);
 *  7. THE AUDIT WRITE — after every domain refusal, before any mutation;
 *  8. the mutation.
 *
 * Steps 7 and 8 are the whole of L33387: the audit "commits in the same
 * transaction as the state change". If the audit write does not commit, the
 * transition did not happen and the submission remains at its prior stage —
 * which is also L33365's reconnect rule, since a transition interrupted by
 * connectivity loss is one that was never recorded.
 */
export function applyTransition(
  chain: ApprovalChain | null,
  transition: ApprovalTransitionId,
  context: ApprovalContext,
  newSubmission: NewSubmission,
): ApprovalOutcome {
  const definition = TRANSITION_BY_ID[transition]
  const origin: ApprovalOrigin = chain === null ? 'no-submission' : chain.state

  // 1. THE STATE MACHINE.
  if (!definition.from.includes(origin)) {
    return refuse(
      chain,
      definition,
      context,
      'wrong-stage',
      `“${definition.id}” is not drawn from ${origin === 'no-submission' ? 'a submission that does not exist yet' : `“${origin}”`}. The chain moves only along the edges the source draws, and this is not one of them.`,
      [definition.sourceRef, 'L33334-L33352'],
      null,
    )
  }

  // 2. STAFFABILITY, before submission (`FUNC-STU-11-02-A-2`, `AC-STU-103`).
  if (definition.id === 'submit') {
    const staffable = checkChainStaffable(context.staffing, context.actor.identityId)
    if (!staffable.staffable) {
      return refuse(
        chain,
        definition,
        context,
        'chain-not-staffable',
        `${STAGE_LABEL[staffable.shortfall]} — ${staffable.reason}`,
        ['FUNC-STU-11-02-A-2 L33307', 'AC-STU-103 L33403', 'DEC-RELAUTH-001 L33255', 'FB-SEQ-012 L68262'],
        null,
      )
    }
  }

  // 3. THE AUTHOR'S OWN ACTS.
  if (definition.authorOnly && chain !== null && chain.authorOfRecord !== context.actor.identityId) {
    return refuse(
      chain,
      definition,
      context,
      'not-the-author',
      `“${definition.id}” belongs to the Author of this submission, ${chain.authorOfRecord}. Corrections go back to the Author, so nobody else performs them.`,
      [definition.sourceRef, 'L33242'],
      null,
    )
  }

  // 4. AUTHORISATION — the matrix row, per control, and separation of duties.
  const affordance = approvalAffordance(definition.capability, context, chain)
  if (isRefusal(affordance.decision)) {
    return refuse(
      chain,
      definition,
      context,
      'not-authorised',
      affordance.reason,
      affordance.decision.sourceRefs,
      affordance.decision,
    )
  }

  // 5. THE MANDATORY TEXT.
  const text = (context.comments ?? '').trim()
  if (definition.requiresText === 'comments' && text === '') {
    return refuse(
      chain,
      definition,
      context,
      'comments-required',
      'A return with no comments is refused, because the comment is the instruction to the Author. Say what has to change.',
      ['L53535', 'AC-WF-AUT-006-01 L53543'],
      null,
    )
  }
  if (definition.requiresText === 'decline-reason' && text === '') {
    return refuse(
      chain,
      definition,
      context,
      'decline-reason-required',
      'A Decline carries a mandatory reason field, and it is empty. The submission returns to the Author with the reason recorded, so a Decline with no reason records nothing the Author can act on.',
      ['SB-STU-14 L33357', 'L33331'],
      null,
    )
  }

  // 6. THE DIFF (C6 — injected, defaulting to unavailable).
  const engine = context.diff ?? diffUnavailable
  // Only `advance` and `release` need one, and both depart from a state that
  // requires an existing chain, so there is nothing to diff against on a null.
  const diff = definition.requiresDiff && chain !== null ? engine.diff(chain) : null
  if (diff !== null && !diff.available) {
    return refuse(
      chain,
      definition,
      context,
      'diff-unavailable',
      `${diff.reason} The submission is HELD rather than advanced, because advancing an unvalidated classification could auto-adopt a behaviour change.`,
      ['FUNC-STU-12-01-A-2 L33486', 'L33243'],
      null,
    )
  }

  // 7. THE AUDIT WRITE — after every domain refusal, before any mutation.
  const version = definition.mintsVersion && diff !== null && diff.available ? diff.nextVersion : chain?.versionMinted ?? null
  const entry: ApprovalAuditEntry = {
    kind: 'transition',
    submissionId: chain?.submissionId ?? newSubmission.submissionId,
    transition: definition.id,
    actor: context.actor.identityId,
    role: context.actor.roles[0] ?? null,
    at: context.at,
    version,
    comments: definition.requiresText === null ? [] : [text],
    fromState: chain?.state ?? null,
    toState: definition.to,
    refusalCode: null,
  }
  const written = context.audit(entry)
  if (!written.ok) {
    return {
      ok: false,
      state: chain?.state ?? null,
      chain,
      refusal: {
        code: 'transition-not-recorded',
        transition: definition.id,
        reason: `${written.reason}. The transition is not recorded, so the submission remains at its prior stage. No transition is ever inferred from a partial request — repeat it once the record can be written.`,
        sourceRefs: ['L33365', 'L33387', 'FB-STU-10'],
        decision: null,
      },
      auditFailure: written.reason,
    }
  }

  // 8. THE MUTATION.
  const base = chain ?? seedChain(newSubmission, context)
  const resubmitting = definition.id === 'resubmit'
  const next: ApprovalChain = {
    ...base,
    state: definition.to,
    stageHistory: appended(base.stageHistory, definition.stage, context.actor.identityId),
    authorOfRecord: definition.id === 'submit' ? context.actor.identityId : base.authorOfRecord,
    reviewerOfRecord: resubmitting
      ? null
      : definition.stage === 'reviewer'
        ? context.actor.identityId
        : base.reviewerOfRecord,
    releaseAuthorityOfRecord: resubmitting
      ? null
      : definition.stage === 'release-authority'
        ? context.actor.identityId
        : base.releaseAuthorityOfRecord,
    comments:
      text === '' || definition.requiresText === null
        ? base.comments
        : [...base.comments, { by: context.actor.identityId, at: context.at, text, transition: definition.id }],
    log: [...base.log, entry],
    versionMinted: version,
    cycles: definition.to === 'Submitted' ? base.cycles + 1 : base.cycles,
    notificationDelivered: base.notificationDelivered,
  }
  return { ok: true, state: next.state, chain: next, audit: entry, auditFailure: null }
}

function seedChain(newSubmission: NewSubmission, context: ApprovalContext): ApprovalChain {
  return {
    submissionId: newSubmission.submissionId,
    consumer: newSubmission.consumer,
    subject: newSubmission.subject,
    tenant: newSubmission.tenant,
    state: 'Submitted',
    stageHistory: EMPTY_HISTORY,
    authorOfRecord: context.actor.identityId,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
    comments: [],
    log: [],
    versionMinted: null,
    cycles: 0,
    notificationDelivered: false,
  }
}

/* ==================================================================== *
 * THE SEVEN NAMED WRAPPERS. Every one routes through `applyTransition`.
 * ==================================================================== */

const NO_NEW_SUBMISSION = (chain: ApprovalChain): NewSubmission => ({
  submissionId: chain.submissionId,
  consumer: chain.consumer,
  subject: chain.subject,
  tenant: chain.tenant,
})

export function submit(context: ApprovalContext, newSubmission: NewSubmission): ApprovalOutcome {
  return applyTransition(null, 'submit', context, newSubmission)
}

export function withdraw(chain: ApprovalChain, context: ApprovalContext): ApprovalOutcome {
  return applyTransition(chain, 'withdraw', context, NO_NEW_SUBMISSION(chain))
}

export function returnWithComments(chain: ApprovalChain, context: ApprovalContext): ApprovalOutcome {
  return applyTransition(chain, 'return-with-comments', context, NO_NEW_SUBMISSION(chain))
}

export function advance(chain: ApprovalChain, context: ApprovalContext): ApprovalOutcome {
  return applyTransition(chain, 'advance', context, NO_NEW_SUBMISSION(chain))
}

export function resubmit(chain: ApprovalChain, context: ApprovalContext): ApprovalOutcome {
  return applyTransition(chain, 'resubmit', context, NO_NEW_SUBMISSION(chain))
}

export function release(chain: ApprovalChain, context: ApprovalContext): ApprovalOutcome {
  return applyTransition(chain, 'release', context, NO_NEW_SUBMISSION(chain))
}

export function decline(chain: ApprovalChain, context: ApprovalContext): ApprovalOutcome {
  return applyTransition(chain, 'decline', context, NO_NEW_SUBMISSION(chain))
}

/* ==================================================================== *
 * NOTIFICATION IS NOT COMPLETION.
 * ==================================================================== */

export type AgeingBand =
  | 'under 24 hours'
  | 'beyond 24 hours'
  | 'beyond 48 hours'
  | 'beyond 72 hours'
  /** A stamp that will not parse. Reporting "under 24 hours" for one would be
   *  a claim about an age nothing here knows. */
  | 'age not readable'

/**
 * The queue's ageing indicator (`SB-STU-14`, L33357). The intervals are
 * **not specified in the Statement of Work** (L33385); the Delivery Operations
 * Hub's 24/48/72 hour highlights are adopted here as `Recommendation — R&D`,
 * which the source itself says needs no client decision "since it changes no
 * control". It changes none here either: ageing renders, and moves nothing.
 *
 * Both timestamps are the caller's. No clock is read.
 */
export function ageingBand(submittedAt: string, asOf: string): AgeingBand {
  const hours = (Date.parse(asOf) - Date.parse(submittedAt)) / 3_600_000
  if (!Number.isFinite(hours)) return 'age not readable'
  if (hours >= 72) return 'beyond 72 hours'
  if (hours >= 48) return 'beyond 48 hours'
  if (hours >= 24) return 'beyond 24 hours'
  return 'under 24 hours'
}

export interface ApprovalNotificationRow {
  readonly trigger: string
  readonly recipient: string
  readonly channel: string
  readonly progression: readonly string[]
  /**
   * Always `false`, and it is a field rather than a comment so a screen has to
   * render the answer. Delivery, opening and acknowledgement are distinct from
   * the business action; none of them is a stage of the chain and none of them
   * proves an approval happened.
   */
  readonly provesApproval: false
}

const BASE_PROGRESSION = [
  'created',
  'eligible',
  'queued',
  'sent',
  'provider-accepted',
  'delivered',
  'opened',
  'read',
  'acknowledged',
] as const

/** L33379-L33383, the five rows of the module card's notification table. */
export function approvalNotificationRows(): readonly ApprovalNotificationRow[] {
  return [
    {
      trigger: 'A submission enters the Approval Queue',
      recipient: 'Eligible Reviewers',
      channel: 'In-app and email',
      progression: [...BASE_PROGRESSION, 'claimed', 'acted'],
      provesApproval: false,
    },
    {
      trigger: 'A submission is returned with comments',
      recipient: 'The Author',
      channel: 'In-app and email',
      progression: [...BASE_PROGRESSION, 'acted'],
      provesApproval: false,
    },
    {
      trigger: 'A submission is advanced to release',
      recipient: 'The Release Authority',
      channel: 'In-app and email',
      progression: [...BASE_PROGRESSION, 'claimed', 'acted'],
      provesApproval: false,
    },
    {
      trigger: 'A submission ages beyond the tenant’s review interval',
      recipient: 'The Quality Manager',
      channel: 'In-app and email',
      progression: [...BASE_PROGRESSION, 'escalated'],
      provesApproval: false,
    },
    {
      trigger: 'The chain cannot be staffed at submission',
      recipient: 'The Author and the Tenant Admin',
      channel: 'In-app and email',
      progression: [...BASE_PROGRESSION, 'acted'],
      provesApproval: false,
    },
  ]
}
