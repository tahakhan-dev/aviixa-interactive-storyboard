import type { ScenarioRunId, TenantId, ObjectId } from './ids'
import type { RoleId } from './roles'
import type { SurfaceId } from './surfaces'

/** An append-only record. Nothing in the product story ever edits one. */
export interface LedgerRecord {
  readonly id: string
  readonly sequence: number
  readonly logicalTime: number
  readonly tenant: TenantId | null
  readonly kind: string
  readonly payload: Readonly<Record<string, unknown>>
}

export interface Ledgers {
  readonly audit: readonly LedgerRecord[]
  readonly events: readonly LedgerRecord[]
  readonly commands: readonly LedgerRecord[]
  readonly notifications: readonly LedgerRecord[]
  readonly schedules: readonly LedgerRecord[]
}

/** A tenant's subscription tier: the entitlements it carries. IMPORTANT 3. */
export interface TierDefinition {
  readonly entitlements: readonly string[]
}

/** Platform-owned truth. Written once, read by every eligible tenant view. */
export interface PlatformPartition {
  readonly featureControls: Readonly<Record<string, boolean>>
  readonly tiers: Readonly<Record<string, TierDefinition>>
  readonly severityCatalog: readonly string[]
  /** DEC-TAX-002: the seeded catalogue ships empty. The names are owed. */
  readonly seededJobTypes: readonly string[]
  readonly seededServiceTypes: readonly string[]
  readonly objects: Readonly<Record<string, unknown>>
}

/** One factory's world. Never visible from another tenant's partition. */
export interface TenantPartition {
  readonly displayName: string
  readonly lifecycleState:
    | 'PROVISIONING'
    | 'ACTIVE'
    | 'SOFT_SUSPENDED'
    | 'HARD_SUSPENDED'
    | 'COMPLIANCE_SUSPENDED'
    | 'ARCHIVED'
  readonly desiredFeatureValues: Readonly<Record<string, boolean>>
  /**
   * IMPORTANT 3: which entry of `PlatformPartition.tiers` this tenant is on.
   * Empty string means "no tier assigned" -- the entitlement check (stage 5)
   * reads `state.platform.tiers[tier]` and fails closed when that lookup
   * misses, so an unassigned tenant never inherits an entitlement it was
   * never actually granted.
   */
  readonly tier: string
  readonly objects: Readonly<Record<string, unknown>>
}

export interface ScenarioDomainState {
  readonly runId: ScenarioRunId
  readonly platform: PlatformPartition
  readonly tenants: Readonly<Record<string, TenantPartition>>
  readonly ledgers: Ledgers
  readonly sequence: number
}

/** Who is signed in on the simulated product, per product session. */
export interface IdentitySimulationState {
  readonly signedIn: boolean
  readonly role: RoleId | null
  readonly tenant: TenantId | null
  readonly siteScope: readonly string[]
  readonly areaScope: readonly string[]
  /**
   * IMPORTANT 3 (stage 4 scope intersection). Optional -- not every identity
   * fixture needs to think about shift scope, so existing fixtures that omit
   * it are unaffected; when a request declares `requiredShifts`, an absent
   * `shiftScope` fails closed exactly like an absent `siteScope` entry would.
   */
  readonly shiftScope?: readonly string[]
  /** IMPORTANT 3 (stage 4): which specific object ids this identity may touch. */
  readonly objectScope?: readonly string[]
  /** IMPORTANT 3 (stage 4): named temporary grants currently held. */
  readonly temporaryGrants?: readonly string[]
  readonly qualifications: readonly string[]
  readonly deviceId: string | null
  readonly stepUpActive: boolean
  readonly accessSessionId: string | null
}

/** View state only. Never participates in a product hash or the audit trail. */
export interface PresentationState {
  readonly surface: SurfaceId | null
  readonly locale: 'en' | 'es'
  readonly density: 'comfortable' | 'compact'
  readonly filters: Readonly<Record<string, string>>
  readonly selection: readonly ObjectId[]
  readonly storyStepId: string | null
}

/** Client-review metadata. Separate store, separate type, separate lifecycle. */
export interface ReviewState {
  readonly workspaceId: string
  readonly reviewerLabel: string
  readonly records: readonly Readonly<Record<string, unknown>>[]
  readonly events: readonly Readonly<Record<string, unknown>>[]
}

const EMPTY_TENANT: TenantPartition = {
  displayName: '',
  lifecycleState: 'PROVISIONING',
  desiredFeatureValues: {},
  tier: '',
  objects: {},
}

/**
 * CRITICAL 1(b): a null-prototype map so a tenant id that happens to spell a
 * prototype member ('constructor', '__proto__', 'toString', ...) can never
 * resolve to an inherited value via bracket access. This is defence in
 * depth, not the primary fix -- `tenantPartition` below (CRITICAL 1(a)) is
 * the actual choke point every caller must go through, because a
 * null-prototype object does not survive `{...obj}` (object-spread always
 * produces an Object.prototype-based result), and this map WILL cross a
 * JSON/structuredClone boundary once a later slice's persistence layer
 * exists, which also does not preserve a null prototype.
 */
function emptyTenantsMap(): Record<string, TenantPartition> {
  return Object.create(null) as Record<string, TenantPartition>
}

export function emptyDomainState(runId: ScenarioRunId): ScenarioDomainState {
  return {
    runId,
    platform: {
      featureControls: {},
      tiers: {},
      severityCatalog: [],
      seededJobTypes: [],
      seededServiceTypes: [],
      objects: {},
    },
    tenants: emptyTenantsMap(),
    ledgers: {
      audit: [],
      events: [],
      commands: [],
      notifications: [],
      schedules: [],
    },
    sequence: 0,
  }
}

/**
 * CRITICAL 1(a): the one safe way to look up a tenant partition. `Object.
 * hasOwn` never consults the prototype chain, so a tenant id that spells
 * 'constructor', '__proto__', 'toString', 'hasOwnProperty' or 'valueOf'
 * reports as genuinely absent instead of resolving to the inherited
 * Object.prototype member of that name. Every other place in the kernel and
 * policy layers that needs a tenant partition must call this, never index
 * `state.tenants` directly.
 */
export function tenantPartition(
  state: ScenarioDomainState,
  tenant: TenantId,
): TenantPartition | undefined {
  return Object.hasOwn(state.tenants, tenant) ? state.tenants[tenant] : undefined
}

/**
 * Pure structural-sharing update of exactly one tenant partition. Sibling
 * tenants keep their identical object reference, which is what the isolation
 * test asserts and what keeps selector memoisation cheap.
 */
export function withTenant(
  state: ScenarioDomainState,
  tenant: TenantId,
  fn: (partition: TenantPartition) => TenantPartition,
): ScenarioDomainState {
  const current = tenantPartition(state, tenant) ?? EMPTY_TENANT
  const tenants = Object.assign(emptyTenantsMap(), state.tenants, {
    [tenant]: fn(current),
  })
  return {
    ...state,
    tenants,
  }
}
