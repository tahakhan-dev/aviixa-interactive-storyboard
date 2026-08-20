/**
 * The Studio grant model. Spec §2 S1.
 *
 * Frozen source, `MOD-STU-18`:
 * - L34571 — "**Objects affected.** `GRANT-STU-AUTHOR`, `GRANT-STU-AGENT`,
 *   `GRANT-STU-IMPL`, and every Studio object by way of access control."
 * - L34573 — "**States.** A grant is Assigned, Active, Revoked, or Expired,
 *   the last applying to the implementation team's capacity at onboarding's
 *   end."
 * - L34584 — "authoring is a capability, not a sixth role ... where the grant
 *   cannot be evaluated, the Studio denies the authoring capability rather
 *   than assuming it, failing closed."
 *
 * A GRANT IS NOT A ROLE, AND THIS FILE MUST NEVER GROW A ROLE LIST. The three
 * ids below are capabilities layered on a role. `RoleId` lives in
 * `@/domain/roles` and the role→capability mapping lives in `MOD-STU-18`'s
 * matrix, which task 4 owns as data. This file owns the grants themselves.
 */

/**
 * L34571, closed at three. A fourth grant is a source change, never a drift.
 */
export type StudioGrantId = 'GRANT-STU-AUTHOR' | 'GRANT-STU-AGENT' | 'GRANT-STU-IMPL'

export const STUDIO_GRANTS = [
  'GRANT-STU-AUTHOR',
  'GRANT-STU-AGENT',
  'GRANT-STU-IMPL',
] as const satisfies readonly StudioGrantId[]

type MissingFromStudioGrants = Exclude<StudioGrantId, (typeof STUDIO_GRANTS)[number]>
const _studioGrantsExhaustive: MissingFromStudioGrants extends never ? true : never = true
void _studioGrantsExhaustive

/** L34573, in source order. Four states, not three. */
export type StudioGrantState = 'Assigned' | 'Active' | 'Revoked' | 'Expired'

export const STUDIO_GRANT_STATES = [
  'Assigned',
  'Active',
  'Revoked',
  'Expired',
] as const satisfies readonly StudioGrantState[]

type MissingFromGrantStates = Exclude<StudioGrantState, (typeof STUDIO_GRANT_STATES)[number]>
const _grantStatesExhaustive: MissingFromGrantStates extends never ? true : never = true
void _grantStatesExhaustive

/**
 * The COMMERCIAL tier, which L11872 insists is a different thing from the
 * AUTHORITY tier: "This Tier-2 boundary is an authority model and is distinct
 * from the commercial tiers (Growth, Enterprise) that gate specific
 * entitlements ... Reading one for the other produces nonsense such as 'an
 * Enterprise tenant may define atoms', which is false at every commercial
 * tier." The three names are L11872's ("Starter, Growth, and Enterprise").
 *
 * `indeterminate` is a real fifth member for the same reason
 * `TenantWriteState` carries one (`@/surfaces/doh/tenant-state`): a tier that
 * cannot be read must fail the gate from inside the table, not from a
 * fallback branch a caller can route around.
 *
 * Deliberately NOT slice 3's `PlatformPartition.tiers` entitlement strings.
 * Those are free-form entitlement names; this is the named commercial tier the
 * Agent Author gate reads (L34586). Conflating them is exactly the confusion
 * L11872 warns about.
 */
export type StudioCommercialTier = 'Starter' | 'Growth' | 'Enterprise' | 'indeterminate'

export const STUDIO_COMMERCIAL_TIERS = [
  'Starter',
  'Growth',
  'Enterprise',
  'indeterminate',
] as const satisfies readonly StudioCommercialTier[]

type MissingFromTiers = Exclude<StudioCommercialTier, (typeof STUDIO_COMMERCIAL_TIERS)[number]>
const _tiersExhaustive: MissingFromTiers extends never ? true : never = true
void _tiersExhaustive

/**
 * D24: "`Expired` applies to `GRANT-STU-IMPL` because §5.11.4 requires
 * revocation at onboarding's end; the other two grants render `Client Decision
 * Required` under `DEC-TENGRANT-001`."
 *
 * The state exists in the union for all three because L34573 states it once
 * for the vocabulary. What is per-grant is whether the source states a rule
 * that PRODUCES it — and for two of the three it does not.
 */
export type GrantExpiryStatus = 'stated' | 'clientDecisionRequired'

export interface StudioGrantDefinition {
  readonly id: StudioGrantId
  /** Full words. The capability panel (`SB-STU-21`) renders this, not the id. */
  readonly name: string
  /** One plain sentence: what holding this grant lets a person do. */
  readonly purpose: string
  /** Who may assign and revoke it. Never self-assignment (L34584). */
  readonly assignedBy: string
  /**
   * The commercial tiers that carry this grant, or `null` where the source
   * states no tier gate. Only the Agent Author capability is tier-gated
   * (L34586: "tier-gated to Growth and Enterprise").
   */
  readonly requiredTiers: readonly StudioCommercialTier[] | null
  readonly expiryStatus: GrantExpiryStatus
  /** The open decision governing expiry, where D24 leaves it open. */
  readonly expiryDecision: string | null
  readonly sourceRefs: readonly string[]
}

export const STUDIO_GRANT_DEFINITIONS = [
  {
    id: 'GRANT-STU-AUTHOR',
    name: 'The authoring grant',
    purpose:
      'Layers authoring on a Supervisor or Quality Manager role to constitute a quality engineer. ' +
      'Authoring is a capability, not a sixth role.',
    assignedBy: 'The Tenant Admin. Self-assignment is prohibited to every role.',
    requiredTiers: null,
    expiryStatus: 'clientDecisionRequired',
    expiryDecision: 'DEC-TENGRANT-001',
    sourceRefs: ['L34584', 'L34571', 'D24'],
  },
  {
    id: 'GRANT-STU-AGENT',
    name: 'The Agent Author capability',
    purpose:
      'Permits composing a reasoning agent in the Agent Builder. Compose authority is deliberately narrow.',
    assignedBy: 'The Tenant Admin; held by the Quality Manager or a delegated administrator.',
    requiredTiers: ['Growth', 'Enterprise'],
    expiryStatus: 'clientDecisionRequired',
    expiryDecision: 'DEC-TENGRANT-001',
    sourceRefs: ['L34586', 'L34571', 'D24'],
  },
  {
    id: 'GRANT-STU-IMPL',
    name: 'The implementation team’s temporary capacity',
    purpose:
      'A temporary author-and-submit capacity during onboarding. It holds no approval stage, ' +
      'so approval authority rests with the tenant from day one.',
    assignedBy: 'Provisioned, audited and revoked by the Tenant Admin at onboarding’s end.',
    requiredTiers: null,
    expiryStatus: 'stated',
    expiryDecision: null,
    sourceRefs: ['L34588', 'L34573', 'D24'],
  },
] as const satisfies readonly StudioGrantDefinition[]

type MissingFromGrantDefinitions = Exclude<
  StudioGrantId,
  (typeof STUDIO_GRANT_DEFINITIONS)[number]['id']
>
const _grantDefinitionsExhaustive: MissingFromGrantDefinitions extends never ? true : never = true
void _grantDefinitionsExhaustive

const GRANT_BY_ID = new Map<StudioGrantId, StudioGrantDefinition>(
  STUDIO_GRANT_DEFINITIONS.map((g) => [g.id, g]),
)

export function studioGrantById(id: StudioGrantId): StudioGrantDefinition {
  const g = GRANT_BY_ID.get(id)
  // Unreachable for a well-typed caller: `_grantDefinitionsExhaustive` above
  // proves every StudioGrantId has a definition row.
  if (!g) throw new Error(`No Studio grant definition for ${id}`)
  return g
}

/**
 * ONLY `Active` confers a capability, and an absent grant confers nothing.
 *
 * DERIVED CLARIFICATION, and a deliberate fail-closed reading. L34573 names
 * four states and does not say which of them are in force. `Assigned` and
 * `Active` are stated as SEPARATE states, so they cannot both mean "in force"
 * without one of them being decorative — and L34584 settles which way the
 * ambiguity falls: "where the grant cannot be evaluated, the Studio denies the
 * authoring capability rather than assuming it, failing closed."
 *
 * The cost of being wrong in this direction is that an assigned-but-not-yet-
 * activated grant-holder is told, by name, what they are waiting for
 * (`grantStateNote` below). The cost of being wrong in the other direction is
 * that a grant nobody activated authors content that reaches a factory floor.
 */
export function grantConfersCapability(state: StudioGrantState | undefined): boolean {
  return state === 'Active'
}

/**
 * The specific missing condition for each state, in plain language.
 * `AC-STU-155` — "Every unavailable capability is shown with its specific
 * missing condition named" — so no caller may render a bare status token.
 */
const GRANT_STATE_NOTES: Readonly<Record<StudioGrantState, string>> = {
  Assigned:
    'the grant is assigned but not yet active, so it confers nothing until it is activated',
  Active: 'the grant is active',
  Revoked: 'the grant has been revoked',
  Expired: 'the grant has expired',
}

export function grantStateNote(state: StudioGrantState): string {
  return GRANT_STATE_NOTES[state]
}

/**
 * The note for a grant that may be absent entirely. Absent is not the same as
 * revoked and must not be reported as one — L34605 requires a revocation to be
 * NAMED, which is only meaningful if "never held" reads differently.
 */
export function grantHoldingNote(state: StudioGrantState | undefined): string {
  return state === undefined ? 'the grant is not held' : GRANT_STATE_NOTES[state]
}
