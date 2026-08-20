import type { RoleId } from '@/domain/roles'
import type { TenantId } from '@/domain/ids'
import type { ScenarioDomainState } from '@/domain/state'
import type { PermissionOutcome } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type IdentityLayerState,
  type StudioAccessDecision,
  type StudioIdentity,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioCommercialTier, StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import {
  enforceTierTwoBoundary,
  type Tier2RequestClass,
  type TierTwoAuditWrite,
  type TierTwoRefusalAudit,
} from '@/studio/access/refusal'
import {
  ENABLEMENT_AUTHORITY_POSITION,
  charterRow,
  enablementRow,
  type CharterAction,
  type CharterMatrixRow,
} from './matrix'
import {
  NOT_ENTITLED_REASON,
  STU01_TENANT,
  capabilityById,
  type AtomicCapabilityId,
  type CapabilityRegister,
} from './capabilities'

/**
 * The service layer of `MOD-STU-01`.
 *
 * L31668: "The boundary is enforced at the service layer, not the
 * user-interface layer, so that a crafted application programming interface
 * request is refused identically to a user-interface action." Nothing in this
 * file consults a screen, and no screen re-derives anything in it. A control
 * removed from a page stops nobody; these functions are what stop people.
 *
 * TWO OPPOSITE AUDIT RULES LIVE HERE, AND THE SOURCE STATES BOTH.
 *
 * - A REFUSAL that cannot be audited still refuses. `FUNC-STU-01-01-C-1`
 *   (L31599): "if the audit write fails, the refusal is still enforced
 *   because refusing is the safe direction." Delegated to
 *   `enforceTierTwoBoundary`, which is the only place that asymmetry lives.
 * - A WRITE that cannot be audited does not happen. `FB-STU-10` (L31454):
 *   "Action does not happen; state unchanged; user told the action was not
 *   performed." That is `setCapabilityEnablement` below, and the audit write
 *   sits AFTER every domain refusal and BEFORE the mutation, so a failed
 *   audit leaves the register exactly as it was handed in.
 *
 * DETERMINISM: no clock, no randomness. The audit sink and every register
 * arrive as parameters.
 */

/* ==================================================================== *
 * THE AUDIT SINK — one shape, shared with the Tier-2 refusal path.
 * ==================================================================== */

/** L34657 audits identity and action, never "acting as role". */
export type CharterAuditEntry = TierTwoRefusalAudit
export type CharterAuditWrite = TierTwoAuditWrite

/* ==================================================================== *
 * PERSONA → IDENTITY.
 *
 * The eight columns are matrix COLUMNS, not roles, and three of them are not
 * reachable by a role alone. This table says which signed-in person reads
 * each column, so the evaluator resolves the column rather than a screen
 * asserting it.
 * ==================================================================== */

export interface SeededPersonaIdentity {
  readonly identity: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
}

function seeded(
  identityId: string,
  roles: readonly RoleId[],
  grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>> = {},
  tenant: TenantId = STU01_TENANT,
): SeededPersonaIdentity {
  return { identity: { identityId, roles, signedIn: true, tenant }, grants }
}

const PERSONA_IDENTITIES: Readonly<Record<StudioPersonaColumn, SeededPersonaIdentity>> = {
  'quality-manager': seeded('IDN-STU-QM', ['QUALITY_MANAGER']),
  'supervisor-with-authoring-grant': seeded('IDN-STU-SUP-GRANT', ['SUPERVISOR'], {
    'GRANT-STU-AUTHOR': 'Active',
  }),
  'supervisor-without-grant': seeded('IDN-STU-SUP', ['SUPERVISOR']),
  // DEC-ROLE-001 (L34522): the Plant Manager persona's Studio access "is
  // delivered by a Supervisor role without the authoring grant". So this
  // identity IS that one, and the evaluator resolves the without-grant column
  // for it — which is the honest answer, because no Plant Manager role exists
  // in this build's registry to resolve.
  'plant-manager-persona': seeded('IDN-STU-PLANT', ['SUPERVISOR']),
  'tenant-admin': seeded('IDN-STU-ADMIN', ['TENANT_ADMIN']),
  'read-only-auditor': seeded('IDN-STU-AUD', ['READONLY_AUDITOR']),
  worker: seeded('IDN-STU-WKR', ['WORKER']),
  // L34520: "the client's implementation team holds a provisioned, temporary
  // authoring capacity during onboarding". The capacity is a GRANT attached to
  // whatever tenant role the person holds, never a sixth role (L34584).
  'implementation-team': seeded('IDN-STU-IMPL', ['SUPERVISOR'], { 'GRANT-STU-IMPL': 'Active' }),
}

export function personaIdentity(persona: StudioPersonaColumn): SeededPersonaIdentity {
  return PERSONA_IDENTITIES[persona]
}

/* ==================================================================== *
 * THE DECISION.
 * ==================================================================== */

export interface CharterContext {
  /** The register, passed in. Never a module-load snapshot. */
  readonly state: ScenarioDomainState
  readonly identityLayer: IdentityLayerState
  readonly online: boolean
  readonly commercialTier?: StudioCommercialTier
}

/**
 * The row a given action is evaluated against.
 *
 * ONE PLACE, AND BOTH CALLERS ROUTE THROUGH IT. The enablement row is the
 * resolved one, not the raw transcription — see `enablementRow` in
 * `./matrix`. If the screen used the resolved row and the service used the
 * raw one, a crafted request would succeed exactly where the screen refuses,
 * which is the failure L31668 exists to prevent.
 */
export function charterActionRow(action: CharterAction): CharterMatrixRow {
  return action === 'enable-a-capability' ? enablementRow() : charterRow(action)
}

/** Per-control affordances come from HERE, never from a module-level role list. */
export function charterDecision(
  action: CharterAction,
  persona: StudioPersonaColumn,
  ctx: CharterContext,
): StudioAccessDecision {
  const who = personaIdentity(persona)
  return evaluateStudioAccess({
    row: charterActionRow(action),
    identity: who.identity,
    grants: who.grants,
    commercialTier: ctx.commercialTier ?? 'Enterprise',
    identityLayer: ctx.identityLayer,
    state: ctx.state,
    online: ctx.online,
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  })
}

/* ==================================================================== *
 * THE AFFORDANCE — two renderings, and only two.
 * ==================================================================== */

export type CharterControlRendering =
  /**
   * `Explicitly prohibited` carries NO rendering anywhere in the frozen
   * source, so this build rules it ABSENT — and the happy path's step 4
   * (L31611) supplies the other half: "the areas where they would sit carry
   * an explanatory line rather than blank space." The note is never empty.
   */
  | { readonly kind: 'absent'; readonly note: string }
  /**
   * Disabled, with the reason and the decision identifier. Never queued and
   * never hidden: the control's EXISTENCE is what `DEC-CAPAUTH-001` is about,
   * so hiding it would answer the decision by omission.
   */
  | {
      readonly kind: 'disabled'
      readonly label: string
      readonly reason: string
      /** The cell's own open decision, where it defers to one. */
      readonly openDecision: string | null
    }

/**
 * THE ONE FOLD. Every rendering of every charter control on this surface
 * comes through here, so a branch cannot be fixed on one screen and left
 * wrong on another. Three inputs decide it and nothing else: the evaluator's
 * outcome, the cell's own open decision, and the label the screen supplies.
 */
export function charterAffordance(
  action: CharterAction,
  persona: StudioPersonaColumn,
  ctx: CharterContext,
  label: string,
): CharterControlRendering {
  const decision = charterDecision(action, persona, ctx)
  const cell = charterActionRow(action).cells[persona]

  // `Explicitly prohibited` → ABSENT, with the explanatory line L31611
  // requires in place of blank space.
  if (decision.outcome === 'explicitlyProhibited') {
    return {
      kind: 'absent',
      note:
        `${decision.reason} No control for this act is drawn here, for anyone, because the act does not exist ` +
        'on this surface for this view.',
    }
  }

  // A READ is not a control. Drawing a disabled button for "see the charter
  // statements" would invent a control the source never names, and the
  // statements themselves are the rendering.
  if (decision.outcome === 'readOnly') {
    return {
      kind: 'absent',
      note: `${decision.reason} Reading needs no control: the statements themselves are the rendering.`,
    }
  }

  return {
    kind: 'disabled',
    label,
    reason:
      `${decision.reason} ` +
      (action === 'enable-a-capability'
        ? `${ENABLEMENT_AUTHORITY_POSITION} Until DEC-CAPAUTH-001 is answered this control acts for nobody. `
        : '') +
      'Nothing here is queued for later — the Studio queues no write in any state.',
    openDecision: cell.openDecision,
  }
}

/**
 * SB-STU-02's per-row control.
 *
 * TWO CLAUSES, IN THIS ORDER, AND THE ORDER IS THE POINT. Authority first,
 * entitlement second — `AC-STU-155` wants the SPECIFIC missing condition, and
 * for a persona who holds nothing here the specific condition is their own
 * authority, not the tenant's entitlement set. Naming entitlement to a persona
 * the matrix refuses outright would disclose tenant configuration to somebody
 * with no access to it, which is STATE-05's "never disclose what the actor may
 * not see". `setCapabilityEnablement` refuses in the same order for the same
 * reason; a control and a service that ordered these differently would tell
 * one story on the screen and another to an application programming interface
 * caller.
 *
 * A NOT-ENTITLED ROW STILL CARRIES A CONTROL. It is DISABLED, not absent:
 * L30751 requires the row to be "shown greyed with the reason stated ... rather
 * than hidden, so the tenant can see what exists without being able to use it".
 *
 * It takes the ROW rather than a name because the entitlement clause reads the
 * row. A name-only signature is how the first draft ended up naming
 * DEC-CAPAUTH-001 on a capability whose real obstacle was that the tenant is
 * not entitled to it at all.
 */
export function enablementAffordance(
  row: {
    readonly name: string
    readonly entitlement: 'included' | 'not-included'
    readonly notIncludedReason: string | null
  },
  persona: StudioPersonaColumn,
  ctx: CharterContext,
): CharterControlRendering {
  const base = charterAffordance(
    'enable-a-capability',
    persona,
    ctx,
    `Enable or disable ${row.name}`,
  )
  if (base.kind === 'absent') return base
  if (row.entitlement === 'included') return base
  return {
    ...base,
    reason:
      `${row.name}: ${row.notIncludedReason ?? NOT_ENTITLED_REASON}. A capability outside the entitlement set ` +
      'cannot be enabled from the Studio at all; the entitlement is set in the Super Admin platform console, ' +
      `and adding one is a commercial change rather than a Studio setting. ${base.reason}`,
  }
}

/* ==================================================================== *
 * THE UNIVERSAL REFUSAL — FUNC-STU-01-01-C-1 (L31599), AC-STU-041 (L31674).
 * ==================================================================== */

export interface DefineRequest {
  /** The acting person. L34657: identity, never a role. */
  readonly actorIdentityId: string
  /** What was actually asked for, for the audit entry. */
  readonly detail: string
  /** Defaults to `define-atom`; the other three define-class verbs are legal here. */
  readonly requestClass?: Tier2RequestClass
}

export interface DefineRefusal {
  /** Always true for a define-class request, whatever the audit did. */
  readonly refused: boolean
  /** Whether the refusal reached the audit trail. Never changes `refused`. */
  readonly audited: boolean
  readonly outcome: PermissionOutcome
  readonly reason: string
  readonly auditFailure: string | null
}

export function requestDefine(
  request: DefineRequest,
  writeAudit: CharterAuditWrite,
): DefineRefusal {
  const enforcement = enforceTierTwoBoundary(
    {
      requestClass: request.requestClass ?? 'define-atom',
      actorIdentityId: request.actorIdentityId,
      detail: request.detail,
    },
    writeAudit,
  )
  return {
    refused: enforcement.refused,
    audited: enforcement.audit === 'written',
    outcome: enforcement.outcome,
    reason: enforcement.reason,
    auditFailure: enforcement.auditFailure,
  }
}

export interface DefineCapabilityRequest {
  /**
   * The role the caller holds. Consulted for WORDING only — never for the
   * decision. "Roles allowed: none — this is a universal refusal" (L31599),
   * and the covering test walks all five roles asserting an identical outcome.
   */
  readonly actor: RoleId
  readonly identityId: string
  readonly detail: string
}

export interface DefineCapabilityResult {
  /**
   * Typed `false`, not `boolean`. A change that let this path succeed fails to
   * compile rather than shipping behind a green suite.
   */
  readonly ok: false
  readonly outcome: PermissionOutcome
  readonly reason: string
  readonly audited: boolean
}

/**
 * The service entry point `AC-STU-041` names: a define-class request refused
 * at the service layer whether it arrives from the interface or from an
 * application programming interface call. No screen is consulted.
 */
export const studioService = {
  defineCapability(
    request: DefineCapabilityRequest,
    writeAudit: CharterAuditWrite,
  ): DefineCapabilityResult {
    const refusal = requestDefine(
      { actorIdentityId: request.identityId, detail: request.detail },
      writeAudit,
    )
    return {
      ok: false,
      outcome: refusal.outcome,
      reason:
        `${refusal.reason} The ${request.actor} role does not carry this act, and neither does any other: the ` +
        'refusal is universal, and the path forward is a platform engineering change in the foundation.',
      audited: refusal.audited,
    }
  },
}

/* ==================================================================== *
 * THE WRITE PATH — domain refusals, then the audit, then the mutation.
 * ==================================================================== */

export interface EnablementWrite {
  readonly register: CapabilityRegister
  readonly capability: AtomicCapabilityId
  readonly to: 'enabled' | 'disabled'
  readonly identity: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
  readonly commercialTier: StudioCommercialTier
  readonly identityLayer: IdentityLayerState
  readonly state: ScenarioDomainState
  readonly online: boolean
  /**
   * C19: the row is a PARAMETER, never a role list read from somewhere else.
   * Defaults to the resolved enablement row, which is what a product caller
   * gets and what the covering test exercises for the refusal path.
   */
  readonly row?: CharterMatrixRow
}

export type EnablementRefusedBy =
  | 'tenant-isolation'
  | 'unknown-capability'
  | 'entitlement'
  | 'access'
  | 'audit'

export type EnablementResult =
  | {
      readonly ok: true
      readonly register: CapabilityRegister
      readonly audit: 'written'
      readonly reason: string
    }
  | {
      readonly ok: false
      readonly refusedBy: EnablementRefusedBy
      readonly reason: string
      /** ALWAYS the register that was handed in. Nothing was written. */
      readonly register: CapabilityRegister
      readonly audit: 'written' | 'failed'
    }

function audited(
  writeAudit: CharterAuditWrite,
  entry: CharterAuditEntry,
): { readonly ok: boolean; readonly failure: string | null } {
  try {
    const result = writeAudit(entry)
    return result.ok ? { ok: true, failure: null } : { ok: false, failure: result.failure }
  } catch (error) {
    // A sink that throws must not propagate: a caller that catches an
    // exception around this has to guess what happened, and "an exception
    // escaped, so the write went through" is the fail-open direction.
    return { ok: false, failure: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * The only way an enablement state changes.
 *
 * ORDER, AND WHY IT IS THIS ORDER. Every domain refusal runs first, so a
 * refused request never produces an "enablement changed" audit entry. Then
 * the audit write. Then, only then, the mutation. The covering test proves
 * the ordering on a request that ACTUALLY MUTATES — an audit gate in front of
 * a handler that changes nothing demonstrates the contract where it costs
 * nothing, which is a defect this build has shipped before.
 */
export function setCapabilityEnablement(
  input: EnablementWrite,
  writeAudit: CharterAuditWrite,
): EnablementResult {
  const row = input.row ?? enablementRow()
  const unchanged = input.register

  const refuse = (
    refusedBy: EnablementRefusedBy,
    outcome: PermissionOutcome,
    reason: string,
  ): EnablementResult => {
    const attempt = audited(writeAudit, {
      identityId: input.identity.identityId,
      action: 'enable',
      outcome,
      reason,
      detail: `${input.to} ${input.capability} in ${input.register.tenant}`,
    })
    return {
      ok: false,
      refusedBy,
      reason,
      register: unchanged,
      audit: attempt.ok ? 'written' : 'failed',
    }
  }

  // 1. TENANT ISOLATION, read first. L31668: "a request naming another
  //    tenant's capability enablement is refused and audited."
  if (input.register.tenant !== input.identity.tenant) {
    return refuse(
      'tenant-isolation',
      'explicitlyProhibited',
      `This request names capability enablement in ${input.register.tenant}, and the signed-in identity belongs ` +
        `to ${input.identity.tenant ?? 'no tenant'}. Refused and audited; tenant isolation is not a preference.`,
    )
  }

  // 2. THE CAPABILITY MUST EXIST IN THE TENANT'S OWN REGISTER.
  const capability = capabilityById(input.register.rows, input.capability)
  if (capability === null) {
    return refuse(
      'unknown-capability',
      'unavailable',
      `No capability “${input.capability}” is present in this tenant’s registry reading, so its enablement ` +
        'cannot be changed. Nothing was written.',
    )
  }

  // 3. THE MATRIX, THROUGH THE EVALUATOR. Never a role list here.
  const decision = evaluateStudioAccess({
    row,
    identity: input.identity,
    grants: input.grants,
    commercialTier: input.commercialTier,
    identityLayer: input.identityLayer,
    state: input.state,
    online: input.online,
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  })
  if (decision.outcome !== 'allowed' && decision.outcome !== 'allowedWithConditions') {
    return refuse('access', decision.outcome, decision.reason)
  }

  // 4. ENTITLEMENT, AFTER AUTHORITY. TEST-STU-007 (L30788) requires this
  //    refusal through the interface AND through the application programming
  //    interface, both audited; this is the one path both arrive on. It runs
  //    after the matrix so a persona with no authority here is never told
  //    what the tenant is entitled to — see `enablementAffordance`, which
  //    orders the same two clauses the same way.
  if (capability.entitlement !== 'included') {
    return refuse(
      'entitlement',
      'unavailable',
      `${capability.name}: ${NOT_ENTITLED_REASON}. A capability outside the entitlement set cannot be enabled ` +
        'from the Studio at all; the entitlement is set in the Super Admin platform console.',
    )
  }

  // 5. THE AUDIT WRITE, AFTER EVERY REFUSAL AND BEFORE THE MUTATION.
  const reason =
    `${capability.name} set to ${input.to} for ${input.register.tenant}. ` +
    'Configuration surfaces follow the capability, and any Workflow depending on a disabled capability is ' +
    'blocked from publication with the dependent screens named.'
  const attempt = audited(writeAudit, {
    identityId: input.identity.identityId,
    action: 'enable',
    outcome: decision.outcome,
    reason,
    detail: `${input.to} ${input.capability} in ${input.register.tenant}`,
  })
  if (!attempt.ok) {
    return {
      ok: false,
      refusedBy: 'audit',
      reason:
        `The audit write failed (${attempt.failure ?? 'no reason given'}), so the action was not performed and ` +
        `${capability.name} remains ${capability.enablement}. Nothing was changed, and you are being told so ` +
        'rather than being shown a confirmation for a write that did not happen.',
      register: unchanged,
      audit: 'failed',
    }
  }

  // 6. THE MUTATION. A NEW register; the one handed in is never touched.
  return {
    ok: true,
    audit: 'written',
    reason,
    register: {
      ...input.register,
      rows: input.register.rows.map((r) =>
        r.id === input.capability ? { ...r, enablement: input.to } : r,
      ),
    },
  }
}
