import { isHubCommand, type ScenarioCommand } from '@/domain/commands'
import { hashState } from '@/domain/hash'
import type { TenantId } from '@/domain/ids'
import type { LedgerRecord, ScenarioDomainState } from '@/domain/state'
import { tenantPartition, withTenant } from '@/domain/state'
import { QUALITY_MANAGER_AND_ABOVE } from '@/domain/roles'
import type {
  ObjectVersionChange,
  ProposedTransition,
  TransitionContext,
} from '@/domain/transition'
import { deny, type PermissionDecision } from '@/policy/decision'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import type { SurfaceId } from '@/domain/surfaces'
// SLICE 6. The twelve Hub Job/Run/Assignment/Summary commands are narrowed as
// ONE family at each of the five sites below, rather than as twelve cases in
// four switches and a Record. Every Hub-specific fact -- access rule, action
// class, validation, state change -- lives in `@/surfaces/doh/objects`,
// beside the records it is about, so this file stays the kernel and does not
// become a second home for module knowledge.
import {
  HUB_COMMAND_SPECS,
  applyHubCommand,
  hubAccessRequest,
  hubCommandTenant,
  validateHubCommand,
} from '@/surfaces/doh/objects'

/** Which access rule and which surfaces each command family carries. */
interface CommandSpec {
  readonly access: Omit<AccessRequest, 'action' | 'resourceTenant' | 'objectState' | 'allowedObjectStates'>
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly firstFallback: string | null
  /**
   * IMPORTANT 4: what happens if the first fallback itself cannot be
   * honoured. No command in slice 1 authors a distinct fallback-failure
   * narrative yet -- each command's single fallback below already doubles
   * as its terminal safe state. A later slice with a two-step fallback
   * chain should populate this for real instead of leaving it null.
   */
  readonly fallbackFailure: string | null
  readonly terminalSafeState: string | null
}

const SPECS: Record<ScenarioCommand['type'], CommandSpec> = {
  // The Hub family. `Record<ScenarioCommand['type'], ...>` still makes the
  // table exhaustive by construction: a thirteenth Hub command that
  // `HUB_COMMAND_SPECS` does not carry fails to compile here.
  ...HUB_COMMAND_SPECS,
  // MOD-CC-13 action 4. Quality Manager only; a Supervisor may request with
  // a note but never perform the release. DEC-PLUS-001: Tenant Admin is
  // EXPLICITLY PROHIBITED on all ten Command Center operational actions —
  // that is a denial, not merely an absence from the allow-list, so it
  // audits as EXPLICIT_DENY (RECORDED_AS_REFUSAL) rather than a silent,
  // untraceable ROLE_NOT_GRANTED.
  CC_RELEASE_LOT_HOLD: {
    access: {
      allowedRoles: QUALITY_MANAGER_AND_ABOVE,
      deniedRoles: ['TENANT_ADMIN'],
      sourceRefs: ['MOD-CC-13 action 4', '§6.14.2', 'DEC-PLUS-001'],
    },
    affectedSurfaces: ['SURF-DOH', 'SURF-CC', 'SURF-FL'],
    firstFallback:
      'If the release cannot be recorded, the hold stands and the lot stays contained.',
    fallbackFailure: null,
    terminalSafeState: 'The lot remains held and no work resumes on it.',
  },
  PLATFORM_SET_FEATURE_CONTROL: {
    access: {
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      sourceRefs: ['MOD-SA-07', '§8.7'],
    },
    affectedSurfaces: ['SURF-SA', 'SURF-DOH', 'SURF-STU', 'SURF-CC', 'SURF-FL'],
    firstFallback: 'The previous effective value stays in force everywhere.',
    fallbackFailure: null,
    terminalSafeState: 'No tenant sees a partially applied feature change.',
  },
  TENANT_SET_DESIRED_FEATURE: {
    access: {
      allowedRoles: ['TENANT_ADMIN'],
      sourceRefs: ['MOD-DOH-01', '§4.1'],
    },
    affectedSurfaces: ['SURF-DOH', 'SURF-CC', 'SURF-FL'],
    firstFallback: 'The tenant keeps its previous desired value.',
    fallbackFailure: null,
    terminalSafeState: 'The platform effective value is unchanged.',
  },
}

/** The tenant a command targets, or null for a platform-scoped command. */
function commandTenant(command: ScenarioCommand): TenantId | null {
  // Every Hub command is tenant-scoped; there is no platform-scoped Hub act.
  if (isHubCommand(command)) return hubCommandTenant(command)
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD':
    case 'TENANT_SET_DESIRED_FEATURE':
      return command.tenant
    case 'PLATFORM_SET_FEATURE_CONTROL':
      return null
  }
}

/**
 * The current state string of a lot object, or undefined if the lot has
 * never been recorded in this tenant's partition at all. IMPORTANT 4:
 * MOD-CC-13 action 4's precondition (the lot must be HELD) is enforced by
 * feeding this into stage 6 of evaluateAccess as `objectState`, not by
 * trusting the command.
 *
 * CRITICAL 1(a): goes through `tenantPartition` (Object.hasOwn-based)
 * rather than indexing `state.tenants` directly. The old
 * `state.tenants[tenant]?.objects[...]` crashed for a poisoned tenant id
 * (e.g. 'constructor'): `state.tenants['constructor']` resolved to the
 * inherited `Object` constructor (truthy, so `?.` did not short-circuit),
 * `.objects` on that is `undefined`, and indexing `undefined[...]` threw.
 */
function currentLotState(
  state: ScenarioDomainState,
  tenant: TenantId,
  lotId: string,
): string | undefined {
  const object = tenantPartition(state, tenant)?.objects[`lot:${lotId}`]
  if (object && typeof object === 'object' && 'state' in object) {
    const value = (object as { state: unknown }).state
    return typeof value === 'string' ? value : undefined
  }
  return undefined
}

/**
 * Layers the per-instance dynamic fields (which tenant a record belongs to,
 * what state it is currently in) onto a command family's static access
 * rule. CRITICAL 1: `resourceTenant` is set for every tenant-scoped command
 * so stage 2 can compare the record's owning tenant against the actor's
 * own tenant, not just check that the actor's tenant is live.
 *
 * CRITICAL 2: uses `command.tenant` directly (typed `TenantId`, never
 * `null`) rather than the nullable `commandTenant()` helper, so
 * `resourceTenant` is never accidentally assigned a value that could be
 * null -- it is either a real TenantId or the property is absent entirely
 * (PLATFORM_SET_FEATURE_CONTROL, which names no resource tenant at all).
 */
function accessRequestFor(
  command: ScenarioCommand,
  state: ScenarioDomainState,
  actorOfRecord: string | null,
): Omit<AccessRequest, 'action'> {
  // SLICE 6: `actorOfRecord` is threaded in because MOD-DOH-05 row 10
  // (L27703) and MOD-DOH-16 row 5 (L29617) state every role cell as
  // conditional on the acting identity being the value of the target Job's
  // OWNER FIELD. That condition cannot be answered from the command alone.
  if (isHubCommand(command)) return hubAccessRequest(command, state, actorOfRecord)
  const base = SPECS[command.type].access
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD': {
      const lotState = currentLotState(state, command.tenant, command.lotId)
      return {
        ...base,
        resourceTenant: command.tenant,
        allowedObjectStates: ['HELD'],
        ...(lotState !== undefined ? { objectState: lotState } : {}),
      }
    }
    case 'PLATFORM_SET_FEATURE_CONTROL':
      return base
    case 'TENANT_SET_DESIRED_FEATURE':
      return { ...base, resourceTenant: command.tenant }
  }
}

function record(
  id: string,
  kind: string,
  seq: number,
  logicalTime: number,
  tenant: LedgerRecord['tenant'],
  payload: Record<string, unknown>,
): LedgerRecord {
  return {
    id,
    sequence: seq,
    logicalTime,
    tenant,
    kind,
    payload,
  }
}

/**
 * IMPORTANT 4: everything on ProposedTransition that is derivable straight
 * from the TransitionContext and command, regardless of accept/deny —
 * actor, tenant (IMPORTANT 1: the RESOURCE's tenant, not merely the
 * actor's), scope, device, causation/idempotency ids, and the fields this
 * slice cannot populate yet (documented on ProposedTransition itself).
 */
function contextualFields(ctx: TransitionContext, recordTenant: TenantId | null) {
  return {
    causationId: ctx.causationId ?? null,
    idempotencyKey: ctx.idempotencyKey ?? null,
    actor: ctx.actorOfRecord,
    tenant: recordTenant,
    scope: { siteScope: ctx.identity.siteScope, areaScope: ctx.identity.areaScope },
    device: ctx.identity.deviceId,
    deviceTime: null,
    projectionRefreshStates: [],
    activeFailureInjection: ctx.failureInjection,
    recoveryRequirements: [],
    reconciliationRequirements: [],
  } as const
}

function refuse(
  decision: PermissionDecision,
  priorHash: string,
  ctx: TransitionContext,
  spec: CommandSpec,
  status: ProposedTransition['status'],
  audit: readonly LedgerRecord[],
  logicalTime: number,
  seq: number,
  recordTenant: TenantId | null,
): ProposedTransition {
  return {
    status,
    decision,
    nextState: null,
    priorStateHash: priorHash,
    // A denial never applies a mutation, so there is no "next" state — the
    // hash stands for "nothing changed."
    nextStateHash: priorHash,
    events: [],
    audit,
    commands: [],
    notifications: [],
    schedules: [],
    objectTransitions: [],
    affectedSurfaces: spec.affectedSurfaces,
    correlationId: ctx.correlationId,
    // MINOR 8: reuse the logicalTime already read once at the top of
    // reduce() instead of calling ctx.clock.now() again, which would
    // silently split under any advancing (non-fixed) clock.
    logicalTime,
    // MINOR 9: agree with the sequence number the audit record (if any)
    // was built with, instead of a hardcoded 0 that could contradict it.
    sequence: seq,
    firstFallback: spec.firstFallback,
    fallbackFailure: spec.fallbackFailure,
    terminalSafeState: spec.terminalSafeState,
    ...contextualFields(ctx, recordTenant),
  }
}

/**
 * CRITICAL 3: `canonicalSerialize` deliberately throws on any value that
 * cannot be part of domain state (Date, Map, class instances, ...). The
 * kernel's contract is that illegal transitions return a typed denial, so a
 * state that has drifted into holding one of those values must degrade to
 * a denial too, not an unhandled rejection.
 */
async function tryHash(value: unknown): Promise<{ hash: string } | { error: string }> {
  try {
    return { hash: await hashState(value) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

/** CRITICAL 1(c): the shared shape every internal-failure denial uses. */
function internalFailureDecision(explanation: string, sourceRefs: readonly string[]): PermissionDecision {
  return deny('explicitlyProhibited', 'HARD_GATE', explanation, {
    stage: 'COMMAND_VALIDATION',
    sourceRefs,
    auditExpectation: 'NOT_AUDITED',
  })
}

function unhashableStateDecision(message: string, sourceRefs: readonly string[]): PermissionDecision {
  return internalFailureDecision(
    `This action cannot be completed because the scenario state holds a value that cannot be recorded (${message}). No action can proceed until the state is corrected.`,
    sourceRefs,
  )
}

/**
 * IMPORTANT 4: the object lifecycle/version change(s) an ACCEPTED transition
 * made. Only CC_RELEASE_LOT_HOLD touches an object's lifecycle in slice 1.
 */
function objectTransitionsFor(
  command: ScenarioCommand,
  priorState: ScenarioDomainState,
  seq: number,
): readonly ObjectVersionChange[] {
  if (command.type !== 'CC_RELEASE_LOT_HOLD') return []
  return [
    {
      objectId: `lot:${command.lotId}`,
      fromState: currentLotState(priorState, command.tenant, command.lotId) ?? null,
      toState: 'RELEASED',
      version: seq,
    },
  ]
}

/**
 * CRITICAL 1(c): the kernel never throws (spec section 3.4.1). This
 * outermost boundary guards every remaining bare call site inside
 * `reduceInner` the same way `tryHash` already guards `hashState` — a
 * malformed command, an unregistered command type, or any other internal
 * surprise degrades to a typed denial instead of an unhandled exception or
 * rejection.
 */
export async function reduce(
  state: ScenarioDomainState,
  command: ScenarioCommand,
  ctx: TransitionContext,
): Promise<ProposedTransition> {
  try {
    return await reduceInner(state, command, ctx)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const logicalTime = ctx.clock.now()
    const seq = state.sequence + 1
    // `commandTenant`'s switch has no default: an unrecognised command.type
    // (only reachable by bypassing the type system, as in the malformed-
    // command test) falls through and returns `undefined` rather than
    // throwing, so this needs no extra guarding.
    const recordTenant = commandTenant(command) ?? ctx.identity.tenant
    return {
      status: 'denied',
      decision: internalFailureDecision(
        `This action could not be completed because of an unexpected internal error (${message}). Nothing was changed.`,
        [],
      ),
      nextState: null,
      priorStateHash: '',
      nextStateHash: '',
      events: [],
      audit: [],
      commands: [],
      notifications: [],
      schedules: [],
      objectTransitions: [],
      affectedSurfaces: [],
      correlationId: ctx.correlationId,
      logicalTime,
      sequence: seq,
      firstFallback: null,
      fallbackFailure: null,
      terminalSafeState: null,
      ...contextualFields(ctx, recordTenant),
    }
  }
}

async function reduceInner(
  state: ScenarioDomainState,
  command: ScenarioCommand,
  ctx: TransitionContext,
): Promise<ProposedTransition> {
  const spec = SPECS[command.type]
  const logicalTime = ctx.clock.now()
  const seq = state.sequence + 1
  // IMPORTANT 1: attribute every ledger record and the transition itself to
  // the RESOURCE's tenant (commandTenant), not the actor's own tenant. For a
  // same-tenant action these are identical, so nothing changes there. For a
  // cross-tenant refusal, this is the fix: the record lands in the VICTIM
  // tenant's trail, not the attacker's -- an attacker's own tenant
  // previously showed a refusal that was not about them, while the victim's
  // trail stayed empty. Falls back to the actor's own tenant only for a
  // platform-scoped command, which names no resource tenant at all.
  const recordTenant = commandTenant(command) ?? ctx.identity.tenant

  const priorHashResult = await tryHash(state)
  if ('error' in priorHashResult) {
    return refuse(
      unhashableStateDecision(priorHashResult.error, spec.access.sourceRefs),
      '',
      ctx,
      spec,
      'denied',
      [],
      logicalTime,
      seq,
      recordTenant,
    )
  }
  const priorHash = priorHashResult.hash

  // A per-transition monotonic counter (IMPORTANT 7), prefixed with this
  // run's ScenarioRunId (M1 honesty fix). state.sequence never advances on a
  // denial, so two separate denials against the same unchanged state would
  // otherwise compute the same `seq` and collide on id — and within one
  // accepted transition, the event and audit records shared identical
  // arguments, so `event.id === audit.id`. Threading the Clock's own
  // logicalTick() through every record built in this call keeps every
  // emitted id unique WITHIN this run, and deterministically: no
  // Math.random()/crypto.randomUUID(), which spec section 6 forbids in the
  // transition engine.
  //
  // M1: this is NOT globally unique across two independent Clock instances
  // that happen to share the same runId (a fixture-construction error, not
  // a real scenario shape) — only across runs, which always carry distinct
  // runIds. And calling `logicalTick()` here is exactly why `reduce` is
  // observably non-pure: two calls with textually identical (state,
  // command, ctx) arguments emit different record ids, even though the
  // resulting `nextStateHash` stays identical, because ledger records are
  // not written into `state.ledgers` by this pure kernel — persisting them
  // is the PersistenceCoordinator's job (spec section 5.4).
  const nextRecord = (kind: string, payload: Record<string, unknown>): LedgerRecord =>
    record(
      `${state.runId}-${kind}-${seq}-${ctx.clock.logicalTick()}`,
      kind,
      seq,
      logicalTime,
      recordTenant,
      payload,
    )

  const decision = evaluateAccess(
    { action: command.type, ...accessRequestFor(command, state, ctx.actorOfRecord) },
    {
      state,
      identity: ctx.identity,
      online: ctx.online,
      deviceTrusted: ctx.deviceTrusted,
      actorOfRecord: ctx.actorOfRecord,
    },
  )

  if (decision.outcome !== 'allowed') {
    // MOD-DOH-17 / audit contract: only RECORDED and RECORDED_AS_REFUSAL
    // outcomes write to the audit trail. NOT_AUDITED denials — most bare
    // ROLE_NOT_GRANTED refusals — leave no audit record at all.
    const audit =
      decision.auditExpectation === 'NOT_AUDITED'
        ? []
        : [
            // `action` (kept per ruling, not dead): names the attempted
            // action on the refusal record even when nothing else about the
            // attempt is recorded.
            nextRecord(`${command.type}_REFUSED`, {
              action: command.type,
              reasonCode: decision.reasonCode,
              stage: decision.stage,
            }),
          ]
    const status =
      decision.outcome === 'clientDecisionRequired' ? 'decisionRequired' : 'denied'
    return refuse(decision, priorHash, ctx, spec, status, audit, logicalTime, seq, recordTenant)
  }

  // CRITICAL 1(d): defence in depth. Stage 2 of evaluateAccess should
  // already have refused any command whose resourceTenant does not match a
  // known, live tenant, but `apply` must never be trusted to discover that
  // on its own — `withTenant`'s `?? EMPTY_TENANT` fallback exists for
  // legitimate future provisioning, and would otherwise silently CONJURE a
  // partition for a tenant that was never provisioned. reduce() must not
  // reach withTenant for an unknown tenant, so it is re-checked explicitly
  // here rather than relying solely on the access check upstream.
  //
  // CRITICAL 1(a): tenantPartition() (Object.hasOwn-based), not a raw
  // `state.tenants[targetTenant] === undefined` index, which resolved a
  // poisoned targetTenant like 'constructor' to the inherited `Object`
  // constructor (truthy, so this guard never fired).
  const targetTenant = commandTenant(command)
  if (targetTenant !== null && tenantPartition(state, targetTenant) === undefined) {
    const unknownTenantDecision = deny(
      'explicitlyProhibited',
      'TENANT_MISMATCH',
      'This command targets a tenant that does not exist in this scenario run, so nothing was changed.',
      {
        stage: 'TENANT_ISOLATION',
        sourceRefs: spec.access.sourceRefs,
        auditExpectation: 'RECORDED_AS_REFUSAL',
      },
    )
    return refuse(
      unknownTenantDecision,
      priorHash,
      ctx,
      spec,
      'denied',
      [
        nextRecord(`${command.type}_REFUSED`, {
          action: command.type,
          reasonCode: unknownTenantDecision.reasonCode,
          stage: unknownTenantDecision.stage,
        }),
      ],
      logicalTime,
      seq,
      recordTenant,
    )
  }

  // Validation runs after authorisation so a denial never leaks field detail.
  const invalid = validate(command)
  if (invalid) {
    return refuse(
      // MINOR 10: a malformed command field never reached evaluateAccess's
      // stage 6 (OBJECT_STATE) — it is a distinct kernel-level check that
      // runs after authorisation, so it gets its own stage rather than
      // borrowing OBJECT_STATE's and misreporting where the refusal came
      // from.
      deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', invalid, {
        stage: 'COMMAND_VALIDATION',
        sourceRefs: spec.access.sourceRefs,
      }),
      priorHash,
      ctx,
      spec,
      'validationFailed',
      [],
      logicalTime,
      seq,
      recordTenant,
    )
  }

  // IMPORTANT 4: computed from PRIOR state, before apply() below mutates
  // (structurally-shares) the lot object's recorded state.
  const objectTransitions = objectTransitionsFor(command, state, seq)

  const nextState = apply(state, command, seq)
  const nextHashResult = await tryHash(nextState)
  if ('error' in nextHashResult) {
    // The mutation itself produced an unhashable state. Refuse rather than
    // hand back a next state nobody can verify — and never leak the
    // unhashable state itself in `nextState`.
    return refuse(
      unhashableStateDecision(nextHashResult.error, spec.access.sourceRefs),
      priorHash,
      ctx,
      spec,
      'denied',
      [],
      logicalTime,
      seq,
      recordTenant,
    )
  }
  const nextHash = nextHashResult.hash

  return {
    status: 'accepted',
    decision,
    nextState,
    priorStateHash: priorHash,
    nextStateHash: nextHash,
    events: [nextRecord(command.type, { ...command })],
    // MOD-DOH-17: audit atomicity. The audit record is emitted in the same
    // ProposedTransition as the action — there is no path to an accepted
    // status without its audit record alongside it.
    // M5: '_RECORDED' distinguishes the audit record's kind from the event
    // record's kind (both otherwise shared the bare command type), so a
    // consumer merging the two ledgers can tell them apart.
    audit: [nextRecord(`${command.type}_RECORDED`, { ...command })],
    commands: [],
    notifications: [],
    schedules: [],
    objectTransitions,
    affectedSurfaces: spec.affectedSurfaces,
    correlationId: ctx.correlationId,
    logicalTime,
    sequence: seq,
    firstFallback: spec.firstFallback,
    fallbackFailure: spec.fallbackFailure,
    terminalSafeState: spec.terminalSafeState,
    ...contextualFields(ctx, recordTenant),
  }
}

function validate(command: ScenarioCommand): string | null {
  if (isHubCommand(command)) return validateHubCommand(command)
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD':
      if (command.lotId.trim() === '') {
        return 'A lot must be named before a hold on it can be released.'
      }
      if (command.note.trim() === '') {
        return 'A release note is required so the reason is on the record.'
      }
      return null
    case 'PLATFORM_SET_FEATURE_CONTROL':
      return command.feature.trim() === '' ? 'A feature must be named.' : null
    case 'TENANT_SET_DESIRED_FEATURE':
      return command.feature.trim() === '' ? 'A feature must be named.' : null
  }
}

function apply(
  state: ScenarioDomainState,
  command: ScenarioCommand,
  seq: number,
): ScenarioDomainState {
  const bumped = { ...state, sequence: seq }
  if (isHubCommand(command)) return applyHubCommand(bumped, command)
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD':
      return withTenant(bumped, command.tenant, (p) => ({
        ...p,
        objects: {
          ...p.objects,
          [`lot:${command.lotId}`]: { state: 'RELEASED', releaseNote: command.note },
        },
      }))
    case 'PLATFORM_SET_FEATURE_CONTROL':
      return {
        ...bumped,
        platform: {
          ...bumped.platform,
          featureControls: {
            ...bumped.platform.featureControls,
            [command.feature]: command.enabled,
          },
        },
      }
    case 'TENANT_SET_DESIRED_FEATURE':
      return withTenant(bumped, command.tenant, (p) => ({
        ...p,
        desiredFeatureValues: {
          ...p.desiredFeatureValues,
          [command.feature]: command.enabled,
        },
      }))
  }
}
