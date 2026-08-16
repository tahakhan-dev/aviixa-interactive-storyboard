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

/** Platform-owned truth. Written once, read by every eligible tenant view. */
export interface PlatformPartition {
  readonly featureControls: Readonly<Record<string, boolean>>
  readonly tiers: Readonly<Record<string, unknown>>
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
  objects: {},
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
    tenants: {},
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

export function tenantPartition(
  state: ScenarioDomainState,
  tenant: TenantId,
): TenantPartition | undefined {
  return state.tenants[tenant]
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
  const current = state.tenants[tenant] ?? EMPTY_TENANT
  return {
    ...state,
    tenants: { ...state.tenants, [tenant]: fn(current) },
  }
}
