import type { Clock } from './clock'
import type { CorrelationId } from './ids'
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
  /** An active simulated failure, or null. Always labelled in the interface. */
  readonly failureInjection: string | null
}

/**
 * What the pure kernel returns. It is a PROPOSAL: it is not visible product
 * truth until the PersistenceCoordinator commits it in one transaction.
 * Spec section 5.4.
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
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly correlationId: CorrelationId
  readonly logicalTime: number
  readonly sequence: number
  readonly firstFallback: string | null
  readonly terminalSafeState: string | null
}

export interface CommittedTransition extends ProposedTransition {
  readonly committed: true
  readonly committedState: ScenarioDomainState
}
