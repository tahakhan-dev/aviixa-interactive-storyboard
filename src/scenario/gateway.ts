import type { ScenarioCommand } from '@/domain/commands'
import type { ScenarioDomainState } from '@/domain/state'
import type { CommittedTransition, TransitionContext } from '@/domain/transition'
import type { PermissionDecision } from '@/policy/decision'
import type { StorageBootstrapState } from '@/persistence/bootstrap'
import { permittedUnder, type ActionClass } from '@/persistence/capability'

// ─────────────────────────────────────────────────────────────────────────
// THIS FILE IS THE ONLY MUTATION ENTRY POINT IN THE APPLICATION.
//
// `reduce` (the pure kernel) and `commitTransition` (the persistence
// coordinator) are imported here and ONLY here. A later lint gate forbids
// any component under `src/ui/`, `src/coverage/` or `app/` from importing
// either directly -- every product action across the later slices must flow
// through `dispatch` below. If a future change needs to widen that gate,
// widen it to exempt this one file, never to permit `reduce`/
// `commitTransition` imports generally: this file is deliberately the sole
// exception, not the first of many.
// ─────────────────────────────────────────────────────────────────────────
import { reduce } from '@/kernel/reduce'
import { commitTransition } from '@/persistence/coordinator'

export interface GatewayDeps {
  readonly db: IDBDatabase
  readonly storageState: StorageBootstrapState
}

export type GatewayResult =
  | { readonly ok: true; readonly committed: CommittedTransition }
  | {
      readonly ok: false
      /** Plain language a non-specialist can act on. Never a bare identifier. */
      readonly reason: string
      readonly decision: PermissionDecision | null
      /**
       * `'input'` (fix round 1): a null/undefined `state` or `command` reached
       * the gateway. Distinct from `'validation'`, which is the KERNEL's
       * verdict on a well-formed command's field values (e.g. an empty
       * `lotId`) -- a missing argument is not a command at all, so it is
       * never handed to `reduce` in the first place.
       */
      readonly blockedBy: 'capability' | 'policy' | 'validation' | 'persistence' | 'input'
    }

/**
 * Which `ActionClass` each command family belongs to, for the capability
 * gate consulted before the kernel ever runs.
 *
 * - `CC_RELEASE_LOT_HOLD` -> `'release'`: it releases a quality hold on a
 *   lot, which is exactly what the `release` action class names -- and it is
 *   one of the eleven durable classes, so it may only proceed when storage
 *   is `ready-durable`.
 * - `PLATFORM_SET_FEATURE_CONTROL` -> `'lifecycleChange'`: an authoritative,
 *   platform-wide change to a feature's effective value. No action class in
 *   this table names "configuration change" specifically, and this is not an
 *   approval/publication/release/hold workflow step -- `lifecycleChange` is
 *   the closest fit for "an authoritative state transition that must be
 *   durably recorded."
 * - `TENANT_SET_DESIRED_FEATURE` -> `'lifecycleChange'`: the tenant-scoped
 *   counterpart of the same kind of authoritative state mutation, for the
 *   same reason.
 */
function actionClassFor(command: ScenarioCommand): ActionClass {
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD':
      return 'release'
    case 'PLATFORM_SET_FEATURE_CONTROL':
    case 'TENANT_SET_DESIRED_FEATURE':
      return 'lifecycleChange'
  }
}

/**
 * The one and only path to a domain mutation. Runs four stages in order and
 * stops at the first refusal; never throws -- every stage's failure,
 * including a caller passing a missing argument, is a typed `GatewayResult`,
 * never an exception a caller must catch.
 *
 * 0. Input: a null/undefined `state` or `command` is refused immediately,
 *    with `blockedBy: 'input'` -- neither `actionClassFor` (which reads
 *    `command.type`) nor `reduce` (which reads `state.sequence`, including
 *    inside ITS OWN catch-all) is safe to call with either missing, so this
 *    must run before either is ever reached.
 * 1. Capability: a durable command is refused here, before the kernel ever
 *    runs, if storage cannot durably record it -- a kernel run that cannot
 *    be committed is a transition that half-happened, so no kernel work
 *    happens at all when it could not be persisted anyway.
 * 2. Kernel: `reduce` proposes a transition. Anything but `'accepted'` is a
 *    refusal: `'validationFailed'` reports `blockedBy: 'validation'`,
 *    everything else (`'denied'`, `'blocked'`, `'decisionRequired'`,
 *    `'noOp'`) reports `blockedBy: 'policy'`.
 * 3. Persistence: `commitTransition` commits the accepted proposal in one
 *    IndexedDB transaction. A failure reports `blockedBy: 'persistence'`.
 */
export async function dispatch(
  state: ScenarioDomainState,
  command: ScenarioCommand,
  ctx: TransitionContext,
  deps: GatewayDeps,
): Promise<GatewayResult> {
  // Fix round 1 (CRITICAL): a caller passing a null/undefined `state` or
  // `command` -- e.g. an uninitialised selector result -- previously threw a
  // TypeError instead of returning a typed refusal, breaking the one
  // guarantee this file exists to keep. Guarded here, before either value is
  // ever dereferenced.
  if (!command) {
    return {
      ok: false,
      reason: 'No command was supplied to the gateway, so no action could be attempted. Nothing was changed.',
      decision: null,
      blockedBy: 'input',
    }
  }
  if (!state) {
    return {
      ok: false,
      reason: 'No scenario state was supplied to the gateway, so no action could be attempted. Nothing was changed.',
      decision: null,
      blockedBy: 'input',
    }
  }

  const actionClass = actionClassFor(command)
  if (!permittedUnder(deps.storageState, actionClass)) {
    return {
      ok: false,
      reason:
        `This action cannot be completed because the current storage mode ` +
        `(${deps.storageState}) does not allow it to be durably recorded. ` +
        `Nothing was changed.`,
      decision: null,
      blockedBy: 'capability',
    }
  }

  const proposed = await reduce(state, command, ctx)

  if (proposed.status === 'validationFailed') {
    return {
      ok: false,
      reason: proposed.decision.explanation,
      decision: proposed.decision,
      blockedBy: 'validation',
    }
  }
  if (proposed.status !== 'accepted' || proposed.nextState === null) {
    return {
      ok: false,
      reason: proposed.decision.explanation,
      decision: proposed.decision,
      blockedBy: 'policy',
    }
  }

  const commitResult = await commitTransition(deps.db, proposed)
  if (!commitResult.ok) {
    return {
      ok: false,
      reason: commitResult.failure.reason,
      decision: proposed.decision,
      blockedBy: 'persistence',
    }
  }

  return { ok: true, committed: commitResult.committed }
}
