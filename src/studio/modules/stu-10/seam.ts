import { scenarioRunId, tenantId, type TenantId } from '@/domain/ids'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { permitsAction } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type IdentityLayerState,
  type StudioAccessDecision,
  type StudioIdentity,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioCommercialTier, StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import type { PublishCheckImplementation, PublishCheckVerdict } from '@/studio/publish/register'
import {
  writeAllowed,
  writeClassNote,
  type TenantWriteState,
} from '@/surfaces/doh/tenant-state'
import {
  type PartsRegistrySeam,
  type RegistryPartState,
} from '@/studio/seams/parts/registry'
import { stu10Row, type Stu10RowId } from './matrix'

/**
 * `MOD-STU-10`'s service layer — the one deliberate seam, and the three
 * refusals that are not negotiable.
 *
 * THE ORDER IS THE CONTRACT, and every refusal below names the SPECIFIC
 * missing condition rather than a status token:
 *
 *   1. DOMAIN REFUSALS. The per-control affordance from the evaluator; the
 *      tenant's suspension state; the registry's reachability; the name
 *      itself. None of them reaches the audit sink, because a refused action
 *      is not an action.
 *   2. THE HAND-OFF. `FUNC-STU-10-02-B-1` (L33143): "if the hand-off cannot
 *      be confirmed, the reference is not created, because a reference to a
 *      part that does not exist in the registry would break genealogy."
 *   3. THE AUDIT APPEND, after the hand-off is confirmed and BEFORE the
 *      reference is attached. L33205: "The audit event and the registry
 *      write commit in the same transaction."
 *   4. THE MUTATION — the reference on the step, and only then.
 *
 * A COMMERCIAL STATE IS NEVER PRESENTED AS A TECHNICAL FAULT.
 * `FUNC-STU-10-02-C-1` (L33145): the author is told "the tenant's suspension
 * state is blocking master-data writes, not that the registry is down,
 * because presenting a commercial state as a technical fault would be
 * dishonest." The suspension check therefore runs BEFORE the reachability
 * check, so a suspended tenant is never told about a registry it was never
 * going to be allowed to write to — and it reads slice 4's own write-class
 * table (`writeAllowed(state, 'create-part')`), never a second copy of it.
 *
 * DETERMINISM. No clock, no randomness, no module-level mutable state. The
 * draft is threaded through as a value; every result carries a NEW draft and
 * every refusal carries the ORIGINAL one.
 */

/* ==================================================================== *
 * THE DRAFT — part references on work-instruction steps.
 * ==================================================================== */

export interface PartReference {
  readonly partId: string
  readonly name: string
  readonly state: RegistryPartState
}

export interface StepDraft {
  readonly stepId: string
  /** Empty is the ORDINARY case: a step is never forced to carry one. */
  readonly references: readonly PartReference[]
}

export interface AuthoringDraft {
  readonly tenant: TenantId
  readonly steps: readonly StepDraft[]
}

export const STU10_TENANT: TenantId = tenantId('TEN-BRIGHT-BIKES')

export const STU10_SEED_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-PARTS')),
  STU10_TENANT,
  (p) => ({ ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

/**
 * The seeded draft. Two steps, and BOTH start with no part reference —
 * `AC-STU-094` (L33218) is "a part reference is optional on every step", and
 * a fixture whose steps all arrive pre-referenced could never show that.
 */
export const SEEDED_DRAFT: AuthoringDraft = {
  tenant: STU10_TENANT,
  steps: [
    { stepId: 'STEP-1', references: [] },
    { stepId: 'STEP-2', references: [] },
  ],
}

/**
 * The references one step carries. Throws on an unknown step rather than
 * returning an empty array: "this step has no references" and "there is no
 * such step" are different answers, and an assertion written over the first
 * would pass silently on the second.
 */
export function stepReferences(draft: AuthoringDraft, stepId: string): readonly PartReference[] {
  const step = draft.steps.find((s) => s.stepId === stepId)
  if (step === undefined) {
    throw new Error(
      `MOD-STU-10: no step named "${stepId}" is in this draft. An empty reference list and a ` +
        'missing step must never read the same.',
    )
  }
  return step.references
}

/* ==================================================================== *
 * PERSONA → IDENTITY, and the per-control affordance.
 * ==================================================================== */

export interface SeededPartsIdentity {
  readonly identity: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
}

function seeded(
  identityId: string,
  roles: readonly RoleId[],
  grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>> = {},
): SeededPartsIdentity {
  return { identity: { identityId, roles, signedIn: true, tenant: STU10_TENANT }, grants }
}

const PERSONA_IDENTITIES: Readonly<Record<StudioPersonaColumn, SeededPartsIdentity>> = {
  'quality-manager': seeded('IDN-STU10-QM', ['QUALITY_MANAGER']),
  'supervisor-with-authoring-grant': seeded('IDN-STU10-SUP-GRANT', ['SUPERVISOR'], {
    'GRANT-STU-AUTHOR': 'Active',
  }),
  'supervisor-without-grant': seeded('IDN-STU10-SUP', ['SUPERVISOR']),
  'plant-manager-persona': seeded('IDN-STU10-PLANT', ['SUPERVISOR']),
  'tenant-admin': seeded('IDN-STU10-ADMIN', ['TENANT_ADMIN']),
  'read-only-auditor': seeded('IDN-STU10-AUD', ['READONLY_AUDITOR']),
  worker: seeded('IDN-STU10-WKR', ['WORKER']),
  'implementation-team': seeded('IDN-STU10-IMPL', ['SUPERVISOR'], { 'GRANT-STU-IMPL': 'Active' }),
}

export function partsPersonaIdentity(persona: StudioPersonaColumn): SeededPartsIdentity {
  return PERSONA_IDENTITIES[persona]
}

export interface PartsContext {
  readonly state: ScenarioDomainState
  readonly identityLayer: IdentityLayerState
  readonly online: boolean
  readonly commercialTier?: StudioCommercialTier
}

export const STU10_DEFAULT_CONTEXT: PartsContext = {
  state: STU10_SEED_STATE,
  identityLayer: 'reachable',
  online: true,
}

/** Per-control affordances come from HERE, never from a module-level role list. */
export function partsDecision(
  rowId: Stu10RowId,
  persona: StudioPersonaColumn,
  ctx: PartsContext = STU10_DEFAULT_CONTEXT,
): StudioAccessDecision {
  const who = partsPersonaIdentity(persona)
  return evaluateStudioAccess({
    row: stu10Row(rowId),
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

export type PartsControlRendering =
  | { readonly kind: 'absent'; readonly note: string }
  | { readonly kind: 'disabled'; readonly label: string; readonly reason: string }
  | { readonly kind: 'enabled'; readonly label: string }

/**
 * THE ONE FOLD for both of `SB-STU-13`'s controls.
 *
 * The tenant-state and registry conditions are folded in HERE rather than at
 * each control, so the mini-form's Add button and the step's own picker can
 * never disagree about why the seam is closed.
 */
export function partsAffordance(
  rowId: Stu10RowId,
  persona: StudioPersonaColumn,
  label: string,
  options: {
    readonly ctx?: PartsContext
    readonly tenantState?: TenantWriteState
    readonly registryReachable?: boolean
  } = {},
): PartsControlRendering {
  const decision = partsDecision(rowId, persona, options.ctx ?? STU10_DEFAULT_CONTEXT)

  if (decision.outcome === 'explicitlyProhibited') {
    return {
      kind: 'absent',
      note:
        `${decision.reason} No control for this act is drawn here, because the act does not ` +
        'exist on this surface for this view.',
    }
  }
  if (decision.outcome === 'readOnly') {
    return {
      kind: 'absent',
      note: `${decision.reason} Reading needs no control: the reference itself is the rendering.`,
    }
  }
  if (!permitsAction(decision.decision)) {
    return { kind: 'disabled', label, reason: decision.reason }
  }

  const tenantState = options.tenantState ?? 'active'
  if (!writeAllowed(tenantState, 'create-part')) {
    return { kind: 'disabled', label, reason: suspensionReason(tenantState) }
  }
  if (options.registryReachable === false) {
    return { kind: 'disabled', label, reason: UNREACHABLE_REASON }
  }
  return { kind: 'enabled', label }
}

/* ==================================================================== *
 * THE THREE REFUSALS.
 * ==================================================================== */

/**
 * The suspension sentence. It names the SUSPENSION and says nothing about
 * the registry, and the covering test asserts both halves — that it matches
 * /suspend/i and that it does NOT match /unavailable|down|outage|error/i.
 *
 * `writeClassNote` is slice 4's own note for the state, quoted rather than
 * paraphrased, so the two surfaces cannot drift into two different accounts
 * of the same commercial state.
 */
function suspensionReason(state: TenantWriteState): string {
  return (
    `This tenant’s ${state} state is blocking master-data writes, including new parts, so the ` +
    'inline-add seam is closed. The parts registry itself is fine — this is a commercial state, ' +
    'not a technical fault. You may reference an existing part or leave the step with no part ' +
    `reference. ${writeClassNote(state)}`
  )
}

const UNREACHABLE_REASON =
  'The Delivery Operations Hub parts registry cannot be reached, so no new part can be created ' +
  'and no new reference attached. Existing references are untouched, and you may continue ' +
  'authoring without a part reference: a reference is optional per part.'

export interface InlineAddPartInput {
  readonly draft: AuthoringDraft
  readonly stepId: string
  readonly persona: StudioPersonaColumn
  /** The ONE writable field (L33207). There is no identifier parameter. */
  readonly name: string
  readonly registry: PartsRegistrySeam
  readonly tenantState?: TenantWriteState
  readonly ctx?: PartsContext
  readonly writeAudit: PartsAuditWrite
}

export interface PartsAuditEntry {
  /** Identity and action, never "acting as role" (L34657). */
  readonly actorIdentityId: string
  readonly action: 'inline-add-part'
  readonly stepId: string
  readonly partId: string
  readonly partName: string
  readonly tenant: TenantId
  readonly sourceRefs: readonly string[]
}

export type PartsAuditWrite = (
  entry: PartsAuditEntry,
) => { readonly ok: true } | { readonly ok: false; readonly reason: string }

export type InlineAddPartResult =
  | {
      readonly ok: true
      readonly draft: AuthoringDraft
      readonly partId: string
      readonly message: string
    }
  | { readonly ok: false; readonly draft: AuthoringDraft; readonly reason: string }

const ADD_SOURCE_REFS = ['L33096', 'L33143', 'L33205', 'AC-STU-096 L33220'] as const

export function inlineAddPart(input: InlineAddPartInput): InlineAddPartResult {
  const { draft, stepId, persona, name, registry, writeAudit } = input
  const ctx = input.ctx ?? STU10_DEFAULT_CONTEXT
  const tenantState = input.tenantState ?? 'active'
  const refuse = (reason: string): InlineAddPartResult => ({ ok: false, draft, reason })

  /* ---- 1. DOMAIN REFUSALS. The audit sink is not reached by any of these. */

  const decision = partsDecision('inline-add-a-part-through-the-mini-form', persona, ctx)
  if (!permitsAction(decision.decision)) {
    return refuse(
      `Refused before anything was written: ${decision.reason} No part was created, no reference ` +
        'was attached, and no audit entry was appended, because a refused action is not an action.',
    )
  }

  const step = draft.steps.find((s) => s.stepId === stepId)
  if (step === undefined) {
    return refuse(
      `No step named ${stepId} is in this draft, so nothing was written. A part reference is ` +
        'never attached to a step the draft does not hold.',
    )
  }

  if (name.trim() === '') {
    return refuse(
      'The mini-form accepts a name and nothing else, and an empty name is not a name. Nothing ' +
        'was created in the parts registry and no reference was attached.',
    )
  }

  // THE SUSPENSION CHECK RUNS BEFORE THE REACHABILITY CHECK. A suspended
  // tenant must hear about the suspension, never about the registry.
  if (!writeAllowed(tenantState, 'create-part')) {
    return refuse(suspensionReason(tenantState))
  }

  if (!registry.reachable) {
    return refuse(UNREACHABLE_REASON)
  }

  /* ---- 2. THE HAND-OFF. No confirmation, no reference (L33143). */

  const handOff = registry.createSkeletal(draft.tenant, name.trim())
  if (!handOff.confirmed) {
    return refuse(
      `${handOff.reason} Nothing was attached to ${stepId}, and no audit entry was appended for a ` +
        'creation that did not happen.',
    )
  }

  /* ---- 3. THE AUDIT APPEND, before the reference is attached. */

  const audit = writeAudit({
    actorIdentityId: partsPersonaIdentity(persona).identity.identityId,
    action: 'inline-add-part',
    stepId,
    partId: handOff.part.partId,
    partName: handOff.part.name,
    tenant: draft.tenant,
    sourceRefs: ADD_SOURCE_REFS,
  })
  if (!audit.ok) {
    return refuse(
      `The audit write failed, so the action did not happen: ${audit.reason}. ${stepId} carries no ` +
        'reference to this part, nothing is left half-applied, and nothing was queued for later — ' +
        'the audit event and the registry write commit in the same transaction (L33205).',
    )
  }

  /* ---- 4. THE MUTATION. */

  const reference: PartReference = {
    partId: handOff.part.partId,
    name: handOff.part.name,
    state: handOff.part.state,
  }
  return {
    ok: true,
    partId: reference.partId,
    draft: {
      ...draft,
      steps: draft.steps.map((s) =>
        s.stepId === stepId ? { ...s, references: [...s.references, reference] } : s,
      ),
    },
    message:
      `The platform minted ${reference.partId} and the Delivery Operations Hub registry confirmed ` +
      `a Skeletal record for “${reference.name}”. ${stepId} now carries the reference. Complete ` +
      'the record in the Delivery Operations Hub; the Studio never advances it past Skeletal.',
  }
}

/* ==================================================================== *
 * UNRESOLVABLE REFERENCES BLOCK SUBMISSION — publish check 7's element.
 * ==================================================================== */

export interface PartsPublishSubject {
  readonly draft: AuthoringDraft
  readonly registry: PartsRegistrySeam
}

/**
 * Every unresolvable reference, named by STEP AND PART NAME — L33211: "a
 * reference whose record cannot be found is flagged by step and part name
 * and blocks submission, because a package carrying an unresolvable part
 * reference would break the consumption record."
 *
 * Both halves are in every string this returns, and the covering test
 * asserts each one separately: a message that named only the step would send
 * an author to a step with three references and no way to tell which.
 */
export function unresolvableReferences(subject: PartsPublishSubject): readonly string[] {
  const { draft, registry } = subject
  return draft.steps.flatMap((step) =>
    step.references.flatMap((reference) =>
      registry.resolve(draft.tenant, reference.partId) === null
        ? [`${step.stepId} — part “${reference.name}” (${reference.partId}) cannot be resolved in the parts registry`]
        : [],
    ),
  )
}

/**
 * `MOD-STU-10`'s registration into publish check 7, `library-pointer`, whose
 * `ownerModules` names this module alongside `MOD-STU-06` and `MOD-STU-07`.
 * This module registers the PART-REFERENCE element of that check and nothing
 * else; the block-title and asset halves belong to its two co-owners (C4).
 *
 * A DRAFT WITH NO REFERENCES PASSES, and that is the requirement rather than
 * a hole: `AC-STU-094` (L33218) is "a part reference is optional on every
 * step; no configuration can make it mandatory". The covering test therefore
 * asserts BOTH — that an empty draft passes AND that a draft carrying one
 * unresolvable reference blocks — because the first assertion alone is
 * satisfied by a check that can only ever pass.
 */
export const partReferencePublishCheck: PublishCheckImplementation<PartsPublishSubject> = {
  checkId: 'library-pointer',
  implementedBy: 'MOD-STU-10',
  run: (subject): PublishCheckVerdict => {
    if (!subject.registry.reachable) {
      // FB-STU-09 / AC-STU-149: a check that cannot run blocks, failing
      // closed. An unreachable registry cannot answer "does this record
      // exist", and answering "yes" would be the invisible stub R21 names.
      return {
        outcome: 'cannot-run',
        reason:
          'the Delivery Operations Hub parts registry cannot be reached, so no part reference on ' +
          'this draft can be re-resolved. Publication is blocked rather than assumed, because a ' +
          'package carrying an unresolvable part reference would break the consumption record',
      }
    }
    const unresolvable = unresolvableReferences(subject)
    if (unresolvable.length === 0) return { outcome: 'passed' }
    return { outcome: 'blocked', blockingElement: unresolvable.join('; ') }
  },
}
