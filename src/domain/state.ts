import type { ScenarioRunId, TenantId, ObjectId } from './ids'
import type { RoleId } from './roles'
import type { SurfaceId } from './surfaces'
import type {
  NotificationState,
  ScheduleDefinitionState,
  ScheduleOccurrenceState,
} from './vocabularies'

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

/**
 * THE TWO LEDGERS THAT CARRIED A LIFECYCLE AND NO VOCABULARY.
 *
 * `notifications` and `schedules` above are plain `LedgerRecord[]`, whose
 * `payload` is `Record<string, unknown>` -- so before slice 10 a state on
 * either of them was a bare string, and `sent` could be written where
 * `delivered` was meant with nothing to notice. These two narrowings give the
 * lifecycle reducers their vocabulary; they do not give them their machine,
 * which is why neither adds a field beyond the state itself.
 *
 * `@/domain/vocabularies` holds the unions and the reasoning. Both are closed
 * with a compile-time exhaustiveness check in both directions, so a twentieth
 * notification state cannot be written here without being declared there.
 */
export type NotificationLedgerRecord = LedgerRecord & {
  readonly payload: { readonly state: NotificationState }
}

/**
 * A schedule record is about EITHER the rule or one moment the rule produced,
 * never both, and the discriminant is which state field is present. The
 * separation is the source's: a paused rule has not deleted the moments it
 * already planned, and a failed moment does not mean the rule is broken.
 */
export type ScheduleLedgerRecord = LedgerRecord & {
  readonly payload:
    | { readonly definitionState: ScheduleDefinitionState }
    | { readonly occurrenceState: ScheduleOccurrenceState }
}

/** A tenant's subscription tier: the entitlements it carries. IMPORTANT 3. */
export interface TierDefinition {
  readonly entitlements: readonly string[]
}

/** Platform-owned truth. Written once, read by every eligible tenant view. */
export interface PlatformPartition {
  readonly featureControls: Readonly<Record<string, boolean>>
  readonly tiers: Readonly<Record<string, TierDefinition>>
  /**
   * DEVIATION severity -- the platform-side catalogue of Severity 1,
   * Severity 2, Severity 3 and below, with tenant action bundles above the
   * floor. NOT notification severity, which is a THIRD vocabulary and is a
   * recommendation rather than a fact: see `NotificationSeverity` in
   * `@/domain/vocabularies`. L73143 requires the three severity vocabularies
   * be kept "separate in every data structure and every screen label",
   * because letting a tenant's deviation action bundles reach notification
   * escalation behaviour is something no source sentence permits. A
   * notification severity never goes in this array.
   */
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
