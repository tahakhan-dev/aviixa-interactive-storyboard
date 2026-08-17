/**
 * The fifteen device command states, in the exact source order (frozen
 * source L42846). One shared component (`@/ui/sa/CommandStateBadge`);
 * `MOD-SA-07`, `MOD-SA-09` and `MOD-SA-13` all consume it.
 *
 * `CommandState` itself is NOT redefined here — it already lives in
 * `@/ui/ScreenStateBoundary` (STATE-09's Queued rendering consumes the same
 * fifteen). This module imports that one type and adds the canonical
 * ORDER the source gives it, which the type alone does not carry.
 */
import type { CommandState } from '@/ui/ScreenStateBoundary'

export const COMMAND_STATES = [
  'created',
  'authorised',
  'queued',
  'available for delivery',
  'delivered',
  'downloaded',
  'validated',
  'applied',
  'acknowledged',
  'rejected',
  'failed',
  'expired',
  'cancelled',
  'superseded',
  'reconciled',
] as const satisfies readonly CommandState[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `CommandState` gains or loses
// a member that `COMMAND_STATES` does not list exactly once.
type MissingFromCommandStates = Exclude<CommandState, (typeof COMMAND_STATES)[number]>
const _commandStatesExhaustive: MissingFromCommandStates extends never ? true : never = true
void _commandStatesExhaustive

export type { CommandState }
