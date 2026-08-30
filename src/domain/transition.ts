import type { Clock } from './clock'
import type { CausationId, CorrelationId, IdempotencyKey, TenantId } from './ids'
import type {
  IdentitySimulationState,
  LedgerRecord,
  ScenarioDomainState,
} from './state'
import type { SurfaceId } from './surfaces'
import type { PermissionDecision } from '@/policy/decision'

export type TransitionStatus =
  | 'accepted'
  | 'denied'
  | 'blocked'
  | 'validationFailed'
  | 'decisionRequired'
  | 'noOp'

export interface TransitionContext {
  readonly clock: Clock
  readonly identity: IdentitySimulationState
  readonly online: boolean
  readonly deviceTrusted: boolean
  readonly actorOfRecord: string | null
  readonly correlationId: CorrelationId
  /**
   * IMPORTANT 4: what caused this transition to be attempted -- e.g. the
   * correlationId of an upstream transition that led to this one. Optional:
   * unlike `actorOfRecord` (RULING 1), an absent causationId is not a
   * security gap, just less provenance, so existing fixtures that omit it
   * stay valid.
   */
  readonly causationId?: CausationId
  /** IMPORTANT 4: minted by the caller, carried through, never dropped. */
  readonly idempotencyKey?: IdempotencyKey
  /** An active simulated failure, or null. Always labelled in the interface. */
  readonly failureInjection: string | null
}

/**
 * IMPORTANT 4: one entry of `ProposedTransition.objectTransitions`.
 *
 * `version` is approximated by the transition's own monotonic `sequence`
 * number (spec section 3.5's "monotonic sequence") until per-object version
 * counters exist as their own field on stored objects -- no command in
 * slice 1 needs true optimistic-concurrency versioning yet. Upgrade this
 * when a later slice's command actually depends on distinguishing "this
 * object's 3rd change" from "the whole scenario's 3rd change".
 */
export interface ObjectVersionChange {
  readonly objectId: string
  readonly fromState: string | null
  readonly toState: string
  readonly version: number
}

/**
 * What the pure kernel returns. It is a PROPOSAL: it is not visible product
 * truth until the PersistenceCoordinator commits it in one transaction.
 * Spec section 5.4.
 *
 * IMPORTANT 4: this is the complete spec section 3.5 field list. Fields this
 * slice's kernel cannot yet populate meaningfully are still present (never
 * silently omitted) and carry a fixed, documented default plus a comment
 * naming what fills them in:
 *
 * - `deviceTime`: always null. Spec section 6 calls for a SEPARATE injected
 *   clock for "real local review metadata", distinct from the fictional
 *   scenario `Clock` this slice already has. No such second clock is wired
 *   up yet -- a later slice that builds real local review metadata should
 *   inject one and populate this for real.
 * - `projectionRefreshStates`: always []. No projections/read-models exist
 *   in slice 1 (the kernel has no consumer of them yet); a later CQRS-style
 *   projection layer populates this.
 * - `fallbackFailure`: always null (see CommandSpec.fallbackFailure in
 *   reduce.ts) -- no slice-1 command authors a distinct fallback-failure
 *   narrative yet.
 * - `recoveryRequirements` / `reconciliationRequirements`: always []. No
 *   slice-1 command requires either; populate per-command when one does.
 */
export interface ProposedTransition {
  readonly status: TransitionStatus
  readonly decision: PermissionDecision
  /** null on every outcome except 'accepted'. */
  readonly nextState: ScenarioDomainState | null
  readonly priorStateHash: string
  readonly nextStateHash: string
  readonly events: readonly LedgerRecord[]
  readonly audit: readonly LedgerRecord[]
  readonly commands: readonly LedgerRecord[]
  readonly notifications: readonly LedgerRecord[]
  readonly schedules: readonly LedgerRecord[]
  /** IMPORTANT 4: object lifecycle/version changes this transition made. */
  readonly objectTransitions: readonly ObjectVersionChange[]
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly correlationId: CorrelationId
  readonly causationId: CausationId | null
  readonly idempotencyKey: IdempotencyKey | null
  /** Who this transition is attributed to. Null on an unattributable refusal. */
  readonly actor: string | null
  /** The RESOURCE's tenant (IMPORTANT 1), not merely the actor's own. */
  readonly tenant: TenantId | null
  readonly scope: {
    readonly siteScope: readonly string[]
    readonly areaScope: readonly string[]
  }
  readonly device: string | null
  readonly logicalTime: number
  /** See the class comment: always null in slice 1. */
  readonly deviceTime: number | null
  readonly sequence: number
  /** See the class comment: always [] in slice 1. */
  readonly projectionRefreshStates: readonly string[]
  /** Threaded straight through from TransitionContext.failureInjection. */
  readonly activeFailureInjection: string | null
  readonly firstFallback: string | null
  /** See the class comment: always null in slice 1. */
  readonly fallbackFailure: string | null
  readonly terminalSafeState: string | null
  /** See the class comment: always [] in slice 1. */
  readonly recoveryRequirements: readonly string[]
  /** See the class comment: always [] in slice 1. */
  readonly reconciliationRequirements: readonly string[]
}

export interface CommittedTransition extends ProposedTransition {
  readonly committed: true
  readonly committedState: ScenarioDomainState
}
