import type { ScenarioCommand } from '@/domain/commands'
import { hashState } from '@/domain/hash'
import type { LedgerRecord, ScenarioDomainState } from '@/domain/state'
import { withTenant } from '@/domain/state'
import type {
  ProposedTransition,
  TransitionContext,
} from '@/domain/transition'
import { deny, type PermissionDecision } from '@/policy/decision'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import type { SurfaceId } from '@/domain/surfaces'

/** Which access rule and which surfaces each command family carries. */
interface CommandSpec {
  readonly access: Omit<AccessRequest, 'action'>
  readonly affectedSurfaces: readonly SurfaceId[]
  readonly firstFallback: string | null
  readonly terminalSafeState: string | null
}

const SPECS: Record<ScenarioCommand['type'], CommandSpec> = {
  // MOD-CC-13 action 4. Quality Manager only; a Supervisor may request with
  // a note but never perform the release.
  CC_RELEASE_LOT_HOLD: {
    access: {
      allowedRoles: ['QUALITY_MANAGER'],
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
  // DEC-PLUS-001: Tenant Admin is explicitly prohibited on all ten Command
  // Center operational actions; this is a Delivery Operations Hub setting.
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

function record(
  kind: string,
  seq: number,
  logicalTime: number,
  tenant: LedgerRecord['tenant'],
  payload: Record<string, unknown>,
): LedgerRecord {
  return {
    id: `${kind}-${seq}`,
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
): ProposedTransition {
  return {
    status,
    decision,
    nextState: null,
    priorStateHash: priorHash,
    nextStateHash: priorHash,
    events: [],
    audit,
    commands: [],
    notifications: [],
    schedules: [],
    affectedSurfaces: spec.affectedSurfaces,
    correlationId: ctx.correlationId,
    logicalTime: ctx.clock.now(),
    sequence: 0,
    firstFallback: spec.firstFallback,
    terminalSafeState: spec.terminalSafeState,
  }
}

export async function reduce(
  state: ScenarioDomainState,
  command: ScenarioCommand,
  ctx: TransitionContext,
): Promise<ProposedTransition> {
  const spec = SPECS[command.type]
  const priorHash = await hashState(state)
  const logicalTime = ctx.clock.now()
  const seq = state.sequence + 1

  const decision = evaluateAccess(
    { action: command.type, ...spec.access },
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
            record(`${command.type}_REFUSED`, seq, logicalTime, ctx.identity.tenant, {
              reasonCode: decision.reasonCode,
              stage: decision.stage,
            }),
          ]
    const status =
      decision.outcome === 'decisionRequired' ? 'decisionRequired' : 'denied'
    return refuse(decision, priorHash, ctx, spec, status, audit)
  }

  // Validation runs after authorisation so a denial never leaks field detail.
  const invalid = validate(command)
  if (invalid) {
    return refuse(
      deny('blocked', 'OBJECT_STATE_INVALID', invalid, {
        stage: 'OBJECT_STATE',
        sourceRefs: spec.access.sourceRefs,
      }),
      priorHash,
      ctx,
      spec,
      'validationFailed',
      [],
    )
  }

  const nextState = apply(state, command, seq)
  const nextHash = await hashState(nextState)

  return {
    status: 'accepted',
    decision,
    nextState,
    priorStateHash: priorHash,
    nextStateHash: nextHash,
    events: [record(command.type, seq, logicalTime, ctx.identity.tenant, { ...command })],
    // MOD-DOH-17: audit atomicity. The audit record is emitted in the same
    // ProposedTransition as the action — there is no path to an accepted
    // status without its audit record alongside it.
    audit: [record(command.type, seq, logicalTime, ctx.identity.tenant, { ...command })],
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
          [`lot:${command.lotId}`]: { held: false, releaseNote: command.note },
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
