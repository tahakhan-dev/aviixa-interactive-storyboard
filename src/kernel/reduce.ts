import type { ScenarioCommand } from '@/domain/commands'
import { hashState } from '@/domain/hash'
import type { TenantId } from '@/domain/ids'
import type { LedgerRecord, ScenarioDomainState } from '@/domain/state'
import { withTenant } from '@/domain/state'
import { QUALITY_MANAGER_AND_ABOVE } from '@/domain/roles'
import type {
  ProposedTransition,
  TransitionContext,
} from '@/domain/transition'
import { deny, type PermissionDecision } from '@/policy/decision'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import type { SurfaceId } from '@/domain/surfaces'

/** Which access rule and which surfaces each command family carries. */
interface CommandSpec {
  readonly access: Omit<AccessRequest, 'action' | 'resourceTenant' | 'objectState' | 'allowedObjectStates'>
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly firstFallback: string | null
  readonly terminalSafeState: string | null
}

const SPECS: Record<ScenarioCommand['type'], CommandSpec> = {
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
    terminalSafeState: 'The lot remains held and no work resumes on it.',
  },
  PLATFORM_SET_FEATURE_CONTROL: {
    access: {
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      sourceRefs: ['MOD-SA-07', '§8.7'],
    },
    affectedSurfaces: ['SURF-SA', 'SURF-DOH', 'SURF-STU', 'SURF-CC', 'SURF-FL'],
    firstFallback: 'The previous effective value stays in force everywhere.',
    terminalSafeState: 'No tenant sees a partially applied feature change.',
  },
  TENANT_SET_DESIRED_FEATURE: {
    access: {
      allowedRoles: ['TENANT_ADMIN'],
      sourceRefs: ['MOD-DOH-01', '§4.1'],
    },
    affectedSurfaces: ['SURF-DOH', 'SURF-CC', 'SURF-FL'],
    firstFallback: 'The tenant keeps its previous desired value.',
    terminalSafeState: 'The platform effective value is unchanged.',
  },
}

/** The tenant a command targets, or null for a platform-scoped command. */
function commandTenant(command: ScenarioCommand): TenantId | null {
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
 */
function currentLotState(
  state: ScenarioDomainState,
  tenant: TenantId,
  lotId: string,
): string | undefined {
  const object = state.tenants[tenant]?.objects[`lot:${lotId}`]
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
 */
function accessRequestFor(
  command: ScenarioCommand,
  state: ScenarioDomainState,
): Omit<AccessRequest, 'action'> {
  const base = SPECS[command.type].access
  const resourceTenant = commandTenant(command)
  switch (command.type) {
    case 'CC_RELEASE_LOT_HOLD': {
      const lotState = currentLotState(state, command.tenant, command.lotId)
      return {
        ...base,
        resourceTenant,
        allowedObjectStates: ['HELD'],
        ...(lotState !== undefined ? { objectState: lotState } : {}),
      }
    }
    case 'PLATFORM_SET_FEATURE_CONTROL':
      return base
    case 'TENANT_SET_DESIRED_FEATURE':
      return { ...base, resourceTenant }
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

function refuse(
  decision: PermissionDecision,
  priorHash: string,
  ctx: TransitionContext,
  spec: CommandSpec,
  status: ProposedTransition['status'],
  audit: readonly LedgerRecord[],
  logicalTime: number,
  seq: number,
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
    terminalSafeState: spec.terminalSafeState,
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

function unhashableStateDecision(message: string, sourceRefs: readonly string[]): PermissionDecision {
  return deny(
    'blocked',
    'HARD_GATE',
    `This action cannot be completed because the scenario state holds a value that cannot be recorded (${message}). No action can proceed until the state is corrected.`,
    {
      stage: 'COMMAND_VALIDATION',
      sourceRefs,
      auditExpectation: 'NOT_AUDITED',
    },
  )
}

export async function reduce(
  state: ScenarioDomainState,
  command: ScenarioCommand,
  ctx: TransitionContext,
): Promise<ProposedTransition> {
  const spec = SPECS[command.type]
  const logicalTime = ctx.clock.now()
  const seq = state.sequence + 1

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
    )
  }
  const priorHash = priorHashResult.hash

  // A per-transition monotonic counter (IMPORTANT 7). state.sequence never
  // advances on a denial, so two separate denials against the same
  // unchanged state would otherwise compute the same `seq` and collide on
  // id — and within one accepted transition, the event and audit records
  // shared identical arguments, so `event.id === audit.id`. Threading the
  // Clock's own logicalTick() through every record built in this call (and
  // across calls that share one Clock, as a real scenario run does) keeps
  // every emitted id unique.
  const nextRecord = (kind: string, payload: Record<string, unknown>): LedgerRecord =>
    record(`${kind}-${seq}-${ctx.clock.logicalTick()}`, kind, seq, logicalTime, ctx.identity.tenant, payload)

  const decision = evaluateAccess(
    { action: command.type, ...accessRequestFor(command, state) },
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
      decision.outcome === 'decisionRequired' ? 'decisionRequired' : 'denied'
    return refuse(decision, priorHash, ctx, spec, status, audit, logicalTime, seq)
  }

  // CRITICAL 1(d): defence in depth. Stage 2 of evaluateAccess should
  // already have refused any command whose resourceTenant does not match a
  // known, live tenant, but `apply` must never be trusted to discover that
  // on its own — `withTenant`'s `?? EMPTY_TENANT` fallback exists for
  // legitimate future provisioning, and would otherwise silently CONJURE a
  // partition for a tenant that was never provisioned. reduce() must not
  // reach withTenant for an unknown tenant, so it is re-checked explicitly
  // here rather than relying solely on the access check upstream.
  const targetTenant = commandTenant(command)
  if (targetTenant !== null && state.tenants[targetTenant] === undefined) {
    const unknownTenantDecision = deny(
      'blocked',
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
      deny('blocked', 'OBJECT_STATE_INVALID', invalid, {
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
    )
  }

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
    audit: [nextRecord(command.type, { ...command })],
    commands: [],
    notifications: [],
    schedules: [],
    affectedSurfaces: spec.affectedSurfaces,
    correlationId: ctx.correlationId,
    logicalTime,
    sequence: seq,
    firstFallback: spec.firstFallback,
    terminalSafeState: spec.terminalSafeState,
  }
}

function validate(command: ScenarioCommand): string | null {
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
