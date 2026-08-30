import type { TenantId } from '@/domain/ids'
import type { RoleId } from '@/domain/roles'
import { permitsAction } from '@/policy/decision'
import type { StudioAccessDecision } from '@/studio/access/evaluate'
import { studioGrantById, type StudioGrantId, type StudioGrantState } from '@/studio/access/grants'
import { SEEDED_TENANT } from './rendering'

/**
 * Grant administration — the ONE write path this module owns, and the two
 * controls `SCR-STU-15` carries (L48273: "Assign and revoke authoring and
 * Agent Author grants").
 *
 * THE ORDER IS THE CONTRACT, and it is the same order the Hub's own
 * permissions module uses:
 *
 *   1. THIS FUNCTION'S OWN DOMAIN REFUSALS. A refused action is not an
 *      action, so it appends no audit entry — the sink is not called at all,
 *      and the covering test proves that by handing in a sink that throws.
 *   2. THE AUDIT APPEND. L34657: "Grant assignment and revocation, every
 *      authorisation refusal, and every approval-stage occupancy are audited
 *      with identity and action, never with 'acting as role'."
 *   3. THE MUTATION, and only if the append succeeded. A business action and
 *      its audit entry are ONE transaction: an audit failure REFUSES the
 *      action rather than producing an unaudited success.
 *
 * WHY THAT ORDER IS DEMONSTRATED HERE AND NOT ON A CONTROL THAT CHANGES
 * NOTHING. This build has shipped an audit path wired to the one write
 * handler whose success path mutated nothing, so the contract was
 * demonstrated where it cost nothing. Assigning a grant this register does
 * not yet hold IS an observable mutation, and the covering test runs the same
 * call twice — once with the sink accepting, asserting the register changed,
 * and once with it failing, asserting it did not.
 *
 * DETERMINISM. No clock. The audit entry carries no timestamp of its own;
 * the caller supplies `at` if it has one, and this module never invents one.
 * The register is never mutated in place: every result carries a new array,
 * and a refusal carries the ORIGINAL one.
 */

export interface GrantHolder {
  readonly identityId: string
  readonly displayName: string
  readonly tenant: TenantId
  readonly roles: readonly RoleId[]
  /** Absent means the grant was never recorded, which is not `Revoked`. */
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
  /** Why this row is in the register, in the source's own terms. */
  readonly note: string
}

export type GrantRegister = readonly GrantHolder[]

/**
 * The seeded register. Four holders from the source's own illustrative
 * example (L34633) plus one holder in a DIFFERENT TENANT, which exists so the
 * tenant-scope rule has something real to exclude — a scope filter with
 * nothing outside it is a filter no test can fail.
 */
export const SEEDED_GRANT_REGISTER: GrantRegister = [
  {
    identityId: 'IDN-BB-PRIYA',
    displayName: 'Priya Raman',
    tenant: SEEDED_TENANT,
    roles: ['TENANT_ADMIN'],
    grants: {},
    note: 'Administers Studio capacities and holds no stage of the approval chain (L34517, AC-STU-152).',
  },
  {
    identityId: 'IDN-BB-ELENA',
    displayName: 'Elena Duarte',
    tenant: SEEDED_TENANT,
    roles: ['QUALITY_MANAGER'],
    grants: {},
    note: 'Authoring and Release Authority by role, not by grant (L34514, L34584).',
  },
  {
    identityId: 'IDN-BB-SAM',
    displayName: 'Sam Okonkwo',
    tenant: SEEDED_TENANT,
    roles: ['SUPERVISOR'],
    grants: { 'GRANT-STU-AUTHOR': 'Active' },
    note: 'A quality engineer: the Supervisor role with the authoring grant applied (L34515).',
  },
  {
    identityId: 'IDN-BB-OMAR',
    displayName: 'Omar Haddad',
    tenant: SEEDED_TENANT,
    roles: ['READONLY_AUDITOR'],
    grants: {},
    note: 'The one person whose Studio access the source cannot state — DEC-AUDSTU-001 (L34633).',
  },
  {
    identityId: 'IDN-OTHER-JUNO',
    displayName: 'Juno Alvarez',
    tenant: 'TEN-OTHER-TENANT' as TenantId,
    roles: ['SUPERVISOR'],
    grants: { 'GRANT-STU-AUTHOR': 'Active' },
    note: 'A grant-holder in a different tenant. Tenant isolation applies to every authorisation decision (L34659), so this row is not readable here.',
  },
]

/**
 * SCOPE IS ENFORCED IN WHAT THE SCREEN READS, NOT IN WHAT IT DRAWS. This is
 * the read, and it is the only way either screen gets rows: a row outside the
 * acting identity's tenant never enters the render at all, so it cannot be
 * recovered from the markup, from a hidden element, or from a filter applied
 * one branch later.
 */
export function grantRowsVisibleTo(register: GrantRegister, actor: GrantHolder): GrantRegister {
  return register.filter((holder) => holder.tenant === actor.tenant)
}

/**
 * Total over the seeded register. Throws on an unknown identifier rather than
 * returning `undefined`: every caller here passes an id that came out of the
 * register, so an unknown one is a defect and not a state to render.
 */
export function holderById(register: GrantRegister, identityId: string): GrantHolder {
  const found = register.find((holder) => holder.identityId === identityId)
  if (found === undefined) {
    throw new Error(`MOD-STU-18: no grant holder is registered for "${identityId}".`)
  }
  return found
}

/* ==================================================================== *
 * The audit sink.
 * ==================================================================== */

export interface GrantAuditEntry {
  /** Identity and action, never "acting as role" (L34657). */
  readonly actorIdentityId: string
  readonly action: 'assign' | 'revoke'
  readonly grant: StudioGrantId
  readonly subjectIdentityId: string
  readonly tenant: TenantId
  readonly sourceRefs: readonly string[]
}

export type GrantAuditWrite = (entry: GrantAuditEntry) => { ok: true } | { ok: false; reason: string }

/** The two grants L34558 names. `GRANT-STU-IMPL` is not one of them. */
export const ADMINISTERED_GRANTS = [
  'GRANT-STU-AUTHOR',
  'GRANT-STU-AGENT',
] as const satisfies readonly StudioGrantId[]

type AdministeredGrant = (typeof ADMINISTERED_GRANTS)[number]

function isAdministered(grant: StudioGrantId): grant is AdministeredGrant {
  return (ADMINISTERED_GRANTS as readonly StudioGrantId[]).includes(grant)
}

export interface AdministerGrantInput {
  readonly register: GrantRegister
  readonly actor: GrantHolder
  /** From `decisionForRow(stu18Row('assign-or-revoke-the-two-grants'), …)`. */
  readonly decision: StudioAccessDecision
  readonly targetId: string
  readonly grant: StudioGrantId
  readonly action: 'assign' | 'revoke'
  readonly writeAudit: GrantAuditWrite
}

export interface AdministerGrantResult {
  readonly ok: boolean
  /** The NEW register on success; the ORIGINAL, untouched, on every refusal. */
  readonly register: GrantRegister
  readonly message: string
}

const SOURCE_REFS = ['L34558', 'L34657', 'AC-STU-152 L34669'] as const

export function administerGrant(input: AdministerGrantInput): AdministerGrantResult {
  const { register, actor, decision, targetId, grant, action, writeAudit } = input
  const refuse = (message: string): AdministerGrantResult => ({ ok: false, register, message })

  /* ---- 1. DOMAIN REFUSALS. The audit sink is not reached by any of these. */

  // The evaluator's answer for this control, per control, over the matrix
  // row. Never a role list, and never re-derived here.
  if (!permitsAction(decision.decision)) {
    return refuse(
      `Refused before anything was written: ${decision.reason} Nothing was assigned or revoked, ` +
        'and no audit entry was appended, because a refused action is not an action.',
    )
  }

  if (!isAdministered(grant)) {
    const definition = studioGrantById(grant)
    return refuse(
      `${grant} is not administered from this screen. L34558 names two grants — ` +
        `${ADMINISTERED_GRANTS.join(' and ')} — and ${definition.name} is provisioned and revoked ` +
        'as an identity-layer action at onboarding’s end (§5.11.4, L34588), which is why it holds ' +
        'even when the Studio is degraded. Nothing was written.',
    )
  }

  // FUNC-STU-18-02-A-1 (L34584): "Roles prohibited: self-assignment by any
  // role." A Tenant Admin assigning themselves the authoring grant is the
  // privilege-escalation path this refuses by name rather than by absence.
  if (targetId === actor.identityId) {
    return refuse(
      'Refused: self-assignment of a Studio grant is prohibited for every role, including the ' +
        'Tenant Admin who administers them (L34584). Nothing was written, and no audit entry was ' +
        'appended.',
    )
  }

  const target = register.find((holder) => holder.identityId === targetId)
  if (target === undefined) {
    return refuse(
      `No holder named ${targetId} is in this register, so nothing was written. A grant is never ` +
        'created against an identity the identity layer did not report.',
    )
  }

  // Tenant isolation applies to every authorisation decision (L34659). The
  // read filter above already keeps this row off the screen; this is the same
  // rule at the write, because taking a control off the screen does not stop
  // anyone.
  if (target.tenant !== actor.tenant) {
    return refuse(
      `Refused: ${target.displayName} belongs to a different tenant, and tenant isolation applies ` +
        'to every authorisation decision (L34659). Nothing was written.',
    )
  }

  const current = target.grants[grant]
  const next: StudioGrantState | undefined = action === 'assign' ? 'Active' : 'Revoked'
  if (current === next) {
    return refuse(
      `${target.displayName} already holds ${grant} in the ${next} state. Nothing was written, ` +
        'and no audit entry was appended for an action that would change nothing.',
    )
  }
  if (action === 'revoke' && current === undefined) {
    return refuse(
      `${target.displayName} holds no ${grant}, so there is nothing to revoke. A grant that was ` +
        'never recorded is not the same thing as one that was revoked, and reporting it as ' +
        'revoked would be a false claim about what happened.',
    )
  }

  /* ---- 2. THE AUDIT APPEND, before the mutation and after the refusals. */

  const audit = writeAudit({
    actorIdentityId: actor.identityId,
    action,
    grant,
    subjectIdentityId: target.identityId,
    tenant: actor.tenant,
    sourceRefs: SOURCE_REFS,
  })
  if (!audit.ok) {
    return refuse(
      `The audit write failed, so the action did not happen: ${audit.reason}. ${grant} on ` +
        `${target.displayName} is unchanged, nothing is left half-applied, and nothing was queued ` +
        'for later — audit commits in the same transaction as the action, so a failed audit fails ' +
        'the action with it.',
    )
  }

  /* ---- 3. THE MUTATION. */

  const updated = register.map((holder) =>
    holder.identityId === target.identityId
      ? { ...holder, grants: { ...holder.grants, [grant]: next } }
      : holder,
  )
  const verb = action === 'assign' ? 'Assigned' : 'Revoked'
  return {
    ok: true,
    register: updated,
    message:
      `${verb} ${grant} ${action === 'assign' ? 'to' : 'from'} ${target.displayName}, with its ` +
      'audit entry in the same transaction, recorded against identity and action rather than ' +
      '“acting as role” (L34657). The affected user and the Quality Manager are notified in-app ' +
      'and by email (L34653).',
  }
}
