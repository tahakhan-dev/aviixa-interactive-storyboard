import { isHubCommand, type ScenarioCommand } from '@/domain/commands'
import type { ScenarioDomainState } from '@/domain/state'
import type { CommittedTransition, TransitionContext } from '@/domain/transition'
import type { PermissionDecision } from '@/policy/decision'
import type { StorageBootstrapState } from '@/persistence/bootstrap'
import { permittedUnder, type ActionClass } from '@/persistence/capability'
import { hubActionClass } from '@/surfaces/doh/objects'

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
 *
 * Fix round 1 (IMPORTANT): the switch used to have no `default`, so an
 * unrecognised `command.type` (reachable only by a caller bypassing the type
 * system, but the shape guard below does exactly that check, not a value
 * check) fell through and returned `undefined` SILENTLY. `permittedUnder`
 * then failed closed on that `undefined`, which is correct in effect but
 * wrong in category: `dispatch` reported `blockedBy: 'capability'` with a
 * reason blaming "the current storage mode", which was false -- storage was
 * fully durable. Returning `undefined` explicitly here lets `dispatch` tell
 * "unrecognised command" (an input problem) apart from "storage can't
 * durably record this" (an actual capability problem).
 */
function actionClassFor(command: ScenarioCommand): ActionClass | undefined {
  // SLICE 6. The switch's `default: return undefined` fails CLOSED, which is
  // right for a shape that bypassed the type system -- but every one of the
  // twelve Hub commands is a well-formed member of `ScenarioCommand`, so
  // falling into that default would have reported each of them as "not a
  // recognised action" and refused every Hub write on this branch. Each Hub
  // command's class is declared in `HUB_COMMAND_SPECS` alongside its access
  // rule; all twelve are durable classes, so none proceeds outside
  // `ready-durable`.
  if (isHubCommand(command)) return hubActionClass(command)
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD':
      return 'release'
    case 'PLATFORM_SET_FEATURE_CONTROL':
    case 'TENANT_SET_DESIRED_FEATURE':
      return 'lifecycleChange'
    default:
      return undefined
  }
}

/**
 * Fix round 1 (IMPORTANT): `!command`/`!state` only ever caught the FALSY
 * subset (`null`, `undefined`, `0`, `false`, `''`). A truthy-but-malformed
 * shape -- `{}`, `[]`, `5`, `'x'`, `true` -- sailed straight past that guard
 * and into `actionClassFor`/`reduce`, which is exactly the "unrecognised
 * shape reported as a capability/policy failure" bug this checks for
 * instead. `object`-typed and non-null is necessary but not sufficient: `{}`
 * and `[]` are both `typeof 'object'` and non-null, so the discriminator
 * field itself (`type` for a command) is checked too.
 */
function isMalformedCommand(command: unknown): boolean {
  return typeof command !== 'object' || command === null || !('type' in command)
}

/**
 * Same reasoning as `isMalformedCommand` above, checked against `sequence`
 * -- the first field `reduce()` dereferences (`state.sequence + 1`) -- since
 * `ScenarioDomainState` has no single discriminant field the way a command's
 * `type` is one.
 */
function isMalformedState(state: unknown): boolean {
  return typeof state !== 'object' || state === null || !('sequence' in state)
}

/**
 * Final review BLOCKING 1: `ctx` was never guarded the way `state`/`command`
 * are, so a malformed `ctx` reached `reduce()`, which dereferences
 * `ctx.clock.now()` unconditionally as its first read of the argument. A
 * missing or non-callable `clock.now` threw a raw TypeError straight out of
 * the "never throws" gateway. Checked here, before `reduce` is ever called.
 */
function isMalformedContext(ctx: unknown): boolean {
  if (typeof ctx !== 'object' || ctx === null) return true
  const clock = (ctx as { clock?: unknown }).clock
  if (typeof clock !== 'object' || clock === null) return true
  return typeof (clock as { now?: unknown }).now !== 'function'
}

/**
 * Final review BLOCKING 1: `deps` was never guarded either. `deps.storageState`
 * is read (in `permittedUnder(deps.storageState, ...)`) before `deps.db` is
 * ever touched, so a null/undefined `deps` threw a TypeError reading
 * `storageState` off it. A `deps` of `{}` sailed past that -- `storageState`
 * was simply `undefined`, and `permittedUnder` fails closed on an unmapped
 * key (see capability.ts), so the caller got back `blockedBy: 'capability'`
 * with a reason blaming "the current storage mode" -- FALSE, there was no
 * storage state to consult at all. This is exactly the same category error
 * `actionClassFor`'s missing `default` produced for `command` (fix round 1),
 * now fixed for `deps` too: a caller supplying no dependencies is an input
 * problem, never a capability verdict.
 */
function isMalformedDeps(deps: unknown): boolean {
  return (
    typeof deps !== 'object' ||
    deps === null ||
    !('db' in deps) ||
    !('storageState' in deps)
  )
}

/**
 * The one and only path to a domain mutation. Runs four stages in order and
 * stops at the first refusal; never throws -- every stage's failure,
 * including a caller passing a missing or malformed argument in ANY of the
 * four positions (`state`, `command`, `ctx`, `deps`), is a typed
 * `GatewayResult`, never an exception a caller must catch. (Final review
 * BLOCKING 1: this comment used to claim all four while only `state` and
 * `command` were actually guarded -- `ctx` and `deps` threw. All four are
 * now guarded before any of them is dereferenced.)
 *
 * 0. Input: any malformed `state`, `command`, `ctx` or `deps` -- not just
 *    falsy, but any shape missing the field the next stage would dereference
 *    -- is refused immediately, with `blockedBy: 'input'`. `actionClassFor`
 *    reads `command.type`; `permittedUnder` reads `deps.storageState`;
 *    `reduce` reads `state.sequence` and `ctx.clock.now()` (including inside
 *    its own catch-all); `commitTransition` reads `deps.db`. None of those
 *    is safe to call with its argument malformed, so all four are checked
 *    before any of them is ever reached. An unrecognised (but structurally
 *    well-formed) command type is caught right after, for the same reason.
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
  // Fix round 1 (CRITICAL, then widened as IMPORTANT): a caller passing a
  // null/undefined `state` or `command` -- e.g. an uninitialised selector
  // result -- previously threw a TypeError instead of returning a typed
  // refusal. The original `!command`/`!state` guards fixed that but only for
  // the FALSY subset; a truthy-but-malformed shape (`{}`, `[]`, `5`, `'x'`,
  // `true`) sailed past them and got misreported as a capability or policy
  // failure further down (see `isMalformedCommand`/`isMalformedState` above).
  // Guarded here, before either value is ever dereferenced.
  if (isMalformedCommand(command)) {
    return {
      ok: false,
      reason:
        'The command supplied to the gateway was not a valid, recognised command, so no action could be attempted. Nothing was changed.',
      decision: null,
      blockedBy: 'input',
    }
  }
  if (isMalformedState(state)) {
    return {
      ok: false,
      reason:
        'The scenario state supplied to the gateway was not a valid state object, so no action could be attempted. Nothing was changed.',
      decision: null,
      blockedBy: 'input',
    }
  }
  // Final review BLOCKING 1: `ctx` and `deps` guarded on the same footing as
  // `state`/`command` above -- see `isMalformedContext`/`isMalformedDeps`.
  if (isMalformedContext(ctx)) {
    return {
      ok: false,
      reason:
        'The transition context supplied to the gateway was not a valid context object with a working clock, so no action could be attempted. Nothing was changed.',
      decision: null,
      blockedBy: 'input',
    }
  }
  if (isMalformedDeps(deps)) {
    return {
      ok: false,
      reason:
        'The dependencies supplied to the gateway did not include a database handle and a storage state, so no action could be attempted. Nothing was changed.',
      decision: null,
      blockedBy: 'input',
    }
  }

  const actionClass = actionClassFor(command)
  if (actionClass === undefined) {
    return {
      ok: false,
      reason: `The command type "${command.type}" is not a recognised action, so no action could be attempted. Nothing was changed.`,
      decision: null,
      blockedBy: 'input',
    }
  }
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
