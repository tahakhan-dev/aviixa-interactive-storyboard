/**
 * Task 7 (`src/data/repository.ts`) — the only door to business truth.
 * Master prompt §12.6: replacing the JSON database with a real API later
 * changes this one file, not the 154 screens that read through it.
 *
 * Write order, exactly as the brief states it, extended by Fix round 1 for
 * §12.4: truth-store authority (`@/data/truth-stores`) → `evaluateAccess`
 * (`@/policy/evaluate`, never a second permission check) → the
 * `PersistenceCapability` action-class gate (`@/persistence/capability`,
 * blocking every durable action class outright unless storage is
 * `ready-durable`) → state-machine legality (`stateMachineLegality` below,
 * delegating to the real tables in `@/frontline/capture` and
 * `@/domain/vocabularies` rather than inventing one) → commit the next
 * collection snapshot plus the new audit/event rows in ONE IndexedDB
 * transaction (`commitToPersistence`, reusing `openDatabase`/`STORES`/
 * `errorMessage` from `@/persistence/schema` — the same low-level bridge
 * `boot.ts` already opens through `bootstrapStorage`, not a second
 * persistence path) → only once that transaction's `oncomplete` fires does
 * the in-memory store mutate and `notify()` fire. A denial or a persistence
 * failure at any stage returns `{ ok: false }` and mutates nothing.
 *
 * `create`/`update`/`transition` are therefore `Promise`-returning — that is
 * the one interface change Fix round 1 makes, because "commit, then
 * publish" cannot be expressed synchronously and the brief's original
 * synchronous signature made §12.4's commit contract unimplementable. Reads
 * (`list`/`get`) stay synchronous: they serve rendering and must not force
 * every screen to await.
 *
 * READS run a lighter, deliberately different check (`withinScope`, below)
 * rather than `evaluateAccess` itself, and this is unchanged from the
 * original cut — Fix round 1 confirms it rather than revising it.
 * `evaluateAccess`'s suspension stage denies EVERY action for a tenant
 * whose lifecycle is suspended, and its own reason text says why: "so
 * actions that create or change work are refused" — reads are not an
 * action in that sense. This matches what the build already established
 * two tasks ago for the Hub surface: hard suspension gates WRITES and lets
 * the floor keep READING (`@/surfaces/doh/tenant-state.ts` and the access
 * evaluator's own `TENANT_SUSPENDED` reason text agree on exactly this
 * split). `TEN-NORTHFORGE` (soft-suspended in the seed) still needing to
 * see its own tenant's rows is exactly the case that split describes.
 * `withinScope` reuses the SAME two questions `evaluateAccess`'s own
 * TENANT_ISOLATION and SCOPE stages ask — does this row's tenant match the
 * actor's, does this row's site/area sit inside the actor's declared scope
 * — without also asking the action-shaped questions (suspension,
 * entitlement, safety, segregation of duties) that a plain list/get was
 * never going to need answered.
 */
import { z } from 'zod'
import { COLLECTIONS, RELATIONS, type CollectionName } from './schemas'
import type { Event as EventRow, Audit as AuditRow } from './schemas/crosscutting'
import type { CollectionData, Store } from './store'
import { truthStoreFor, writableThroughRepository, type TruthStoreAuthority } from './truth-stores'
import { roleById, type RoleId } from '@/domain/roles'
import type { SurfaceId } from '@/domain/surfaces'
import {
  emptyDomainState,
  type ScenarioDomainState,
  type TenantPartition,
} from '@/domain/state'
import { scenarioRunId, tenantId as brandTenantId } from '@/domain/ids'
import { evaluateAccess, type AccessContext, type AccessRequest } from '@/policy/evaluate'
import { deny, permitsAction, type PermissionDecision } from '@/policy/decision'
import { captureTransition, type CaptureState } from '@/frontline/capture'
import {
  SCHEDULE_DEFINITION_TRANSITIONS,
  SCHEDULE_OCCURRENCE_TRANSITIONS,
  type ScheduleDefinitionState,
  type ScheduleOccurrenceState,
} from '@/domain/vocabularies'
import { errorMessage, openDatabase, STORES } from '@/persistence/schema'
import { permittedUnder, type ActionClass } from '@/persistence/capability'
import type { StorageBootstrapState } from '@/persistence/bootstrap'

export type { AccessContext } from '@/policy/evaluate'

/** The row shape for one collection, derived from its own zod schema — never redeclared. */
export type RowOf<N extends CollectionName> = z.infer<(typeof COLLECTIONS)[N]['schema']>

/**
 * Reused, not redrawn: OBJ-024/OBJ-083's own folded schema
 * (`@/data/schemas/crosscutting#Event`) IS the domain-event row shape, and
 * OBJ-084's own schema (`#Audit`) IS the audit-event row shape. A
 * `WriteResult`'s `events`/`audit` arrays are literal rows of these two
 * types — the exact rows this call also appended to the `events`/`audit`
 * collections — so they can never disagree with what a later `list('audit',
 * ctx)` shows, which is the trap Task 5 paid for (facts drawn beside each
 * other instead of derived once).
 */
export type DomainEvent = EventRow
export type AuditEvent = AuditRow

export interface Query<T> {
  where(pred: (row: T) => boolean): Query<T>
  sort(key: keyof T & string, dir?: 'asc' | 'desc'): Query<T>
  page(index: number, size: number): Query<T>
  all(): readonly T[]
  first(): T | undefined
  count(): number
  /** Count before paging — the pagination control needs both this and `count()`. */
  total(): number
}

/** §12.4: `ready-durable` versus everything else, exposed so a screen can render it rather than guess. */
export interface PersistenceCapability {
  readonly state: StorageBootstrapState
  readonly durable: boolean
}

export interface Repository {
  list<N extends CollectionName>(name: N, ctx: AccessContext): Query<RowOf<N>>
  get<N extends CollectionName>(name: N, id: string, ctx: AccessContext): RowOf<N> | undefined
  create<N extends CollectionName>(name: N, row: RowOf<N>, ctx: AccessContext): Promise<WriteResult<RowOf<N>>>
  update<N extends CollectionName>(
    name: N,
    id: string,
    patch: Partial<RowOf<N>>,
    ctx: AccessContext,
  ): Promise<WriteResult<RowOf<N>>>
  transition<N extends CollectionName>(
    name: N,
    id: string,
    to: string,
    ctx: AccessContext,
  ): Promise<WriteResult<RowOf<N>>>
  /**
   * Fix round 1 (unit-01, Task 5 review) — the one door for onboarding a
   * tenant: its own row plus its first Tenant Admin's `users` row, under a
   * SINGLE, explicitly-declared authorisation rather than two calls through
   * the generic `create()` door (which is what the reverted `authorizeWrite`
   * carve-outs existed to route around). See this method's own
   * implementation comment for the full reasoning, including why an
   * up-front authorisation — not two per-write ones — is what actually
   * closes the staleness deadlock the review measured, and why the method
   * is safe to call again with the SAME two rows after a partial failure.
   */
  provisionTenant(
    tenant: RowOf<'tenants'>,
    admin: RowOf<'users'>,
    ctx: AccessContext,
  ): Promise<ProvisionTenantResult>
  subscribe(listener: () => void): () => void
  reset(): void
  exportJson(): Record<CollectionName, unknown[]>
  importJson(data: unknown): { ok: true } | { ok: false; problems: string[] }
  /** The current §12.4 durability state. Enforced HERE (the capability gate below), never left to a screen to check. */
  persistenceCapability(): PersistenceCapability
}

/**
 * Fix round 1: a THIRD, distinguishable failure shape. "You may not do
 * this" (`kind: 'denied'`, a real `PermissionDecision`) and "this could not
 * be made durable" (`kind: 'persistence-unavailable'`) lead to different
 * screens and different user recourse, and the original two-armed union
 * could not tell them apart — a caller had no way to know whether a denial
 * was about identity/scope or about storage.
 */
export type WriteResult<T> =
  | { ok: true; row: T; events: DomainEvent[]; audit: AuditEvent[]; affectedSurfaces: SurfaceId[] }
  | { ok: false; kind: 'denied'; decision: PermissionDecision; reason: string; explain: string }
  | {
      ok: false
      kind: 'persistence-unavailable'
      reason: string
      explain: string
      capability: PersistenceCapability
    }

/**
 * Fix round 1 (unit-01, Task 5 review, minor): the two failure arms above
 * never actually depend on `WriteResult<T>`'s own `T` — only the `ok: true`
 * arm does. `refusal`/`persistenceRefusal`/`truthStoreRefusal`/
 * `notFoundRefusal`/`invalidResultRefusal` below all only ever construct a
 * failure arm, so they no longer carry a phantom `<T>` that was never used
 * in their bodies. Derived from `WriteResult` itself (`Extract`), never a
 * second, hand-typed copy of the same two shapes — and this is exactly
 * what `provisionTenant`'s own result type reuses below, rather than
 * redeclaring "denied"/"persistence-unavailable" a third time.
 */
type WriteDenied = Extract<WriteResult<unknown>, { kind: 'denied' }>
type WritePersistenceUnavailable = Extract<WriteResult<unknown>, { kind: 'persistence-unavailable' }>

/**
 * `provisionTenant`'s own result — deliberately NOT `WriteResult<T>` for
 * some folded `{tenant, admin}` tuple, because the two-write policy this
 * type exists to carry (brief: "decide how you handle a second write
 * failing after the first succeeded ... implement it") has a real THIRD
 * failure shape `WriteResult` has no room for: the tenant committed but its
 * administrator did not. `partial` names that shape directly rather than
 * forcing it through `denied`/`persistence-unavailable`, which would have
 * to lie about which one it was. The other three arms are exactly
 * `WriteResult`'s own shapes (`Extract`, not redeclared) so a caller
 * routing `denied`/`persistence-unavailable` the same way it already
 * routes a plain `WriteResult`'s failure arms needs no special case for
 * this door specifically.
 */
export type ProvisionTenantResult =
  | { ok: true; tenant: RowOf<'tenants'>; admin: RowOf<'users'> }
  | WriteDenied
  | WritePersistenceUnavailable
  | {
      ok: false
      kind: 'partial'
      tenant: RowOf<'tenants'>
      /** Exactly `createRow`'s own failure shape — see that function. */
      adminFailure: WriteDenied | WritePersistenceUnavailable
    }

/* ────────────────────────────────────────────────────────────────────── *
 * Query
 * ────────────────────────────────────────────────────────────────────── */

/**
 * `filtered` is the row set after every `where()`/`sort()` so far, BEFORE
 * paging. `paged` is null until `page()` is called; once set, `all()`/
 * `count()` read the page while `total()` still reads `filtered.length` —
 * this is the whole answer to "`total()` before paging, `count()` for the
 * current page." Trap #1 from the brief: an unfiltered `list()`'s `total()`
 * compared against a filtered call's `total()` is how a caller tells "no
 * rows exist" apart from "rows exist but none match the filter" — both
 * render `all()` as `[]`, but only one of them also reports the wider
 * `total()` as zero.
 */
class QueryImpl<T> implements Query<T> {
  private constructor(
    private readonly filtered: readonly T[],
    private readonly paged: readonly T[] | null,
  ) {}

  static from<T>(rows: readonly T[]): QueryImpl<T> {
    return new QueryImpl(rows, null)
  }

  where(pred: (row: T) => boolean): Query<T> {
    return new QueryImpl(this.filtered.filter(pred), null)
  }

  sort(key: keyof T & string, dir: 'asc' | 'desc' = 'asc'): Query<T> {
    const factor = dir === 'asc' ? 1 : -1
    const sorted = [...this.filtered].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av) < String(bv) ? -1 * factor : 1 * factor
    })
    return new QueryImpl(sorted, null)
  }

  page(index: number, size: number): Query<T> {
    const start = index * size
    return new QueryImpl(this.filtered, this.filtered.slice(start, start + size))
  }

  all(): readonly T[] {
    return this.paged ?? this.filtered
  }

  first(): T | undefined {
    return this.all()[0]
  }

  count(): number {
    return this.all().length
  }

  total(): number {
    return this.filtered.length
  }
}

/* ────────────────────────────────────────────────────────────────────── *
 * Read-visibility scoping
 * ────────────────────────────────────────────────────────────────────── */

function asRecord(row: unknown): Record<string, unknown> {
  return row as Record<string, unknown>
}

/**
 * Fix round 2 — tenant resolution, walked from the existing `RELATIONS`
 * graph (`@/data/schemas`) rather than hand-listed per collection.
 *
 * THE HOLE THIS CLOSES. `captures` and `evidence` carry no `tenantId`
 * field of their own (§7.4 puts tenant isolation second in the evaluation
 * order, above roles and scopes; §26.3 names it an adversarial release
 * gate) — the OLD `rowTenantOf` read `row.tenantId` directly and returned
 * `null` for both, which made the write-time isolation check a no-op on
 * exactly the two collections holding worker evidence. Denormalising a
 * `tenantId` onto those schemas was rejected: it would be a second,
 * independently-writable copy of a fact `RELATIONS` already expresses
 * through `runId`/`jobId`/`siteId`/`workerId`/`deviceId`, and a second copy
 * of one fact is what this whole layer exists to prevent.
 *
 * `TENANT_REACHABLE` is the fixed point of "which collections have a path
 * to `tenants`", computed once by walking `RELATIONS` — a scalar
 * (non-array), non-self-referential relation whose `to` is already
 * reachable makes `from` reachable too. This is what keeps a merely
 * INCIDENTAL relation (e.g. `users.role → roles`, which exists for
 * referential-integrity checking, not tenant scoping) from being read as a
 * tenant path: `roles` has no outgoing relation at all, so it is never
 * reachable, so `role` is never offered as a candidate.
 */
const TENANT_REACHABLE: ReadonlySet<CollectionName> = (() => {
  const reachable = new Set<CollectionName>(['tenants'])
  let changed = true
  while (changed) {
    changed = false
    for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
      if (reachable.has(name)) continue
      const canReach = RELATIONS.some((r) => r.from === name && !r.array && r.to !== name && reachable.has(r.to))
      if (canReach) {
        reachable.add(name)
        changed = true
      }
    }
  }
  return reachable
})()

/** Every scalar, non-self-referential relation from `name` whose target can itself reach a tenant. */
function tenantCandidateRelations(name: CollectionName) {
  return RELATIONS.filter((r) => r.from === name && !r.array && r.to !== name && TENANT_REACHABLE.has(r.to))
}

/**
 * `'direct'`: the row's own schema carries `tenantId` (or the row IS
 * `tenants`, whose `id` is the tenant). `'transitive'`: no field of its
 * own, but `RELATIONS` gives at least one path to a tenant-bearing
 * collection — `captures` and `evidence` land here. `'none'`: no path
 * exists in the graph at all, a static schema fact, not a per-row failure
 * — `roles`, `feature-controls`, `entitlements`, `schedules` (its one
 * relation is the self-referential `definitionId`, filtered out above) and
 * `evaluations` (same, `scenarioId`) are genuinely platform-scoped, not
 * holes: there is no tenant to isolate a platform-wide register against.
 */
export function tenantResolutionKind(name: CollectionName): 'direct' | 'transitive' | 'none' {
  if (name === 'tenants') return 'direct'
  if (!TENANT_REACHABLE.has(name)) return 'none'
  const direct = RELATIONS.some((r) => r.from === name && r.field === 'tenantId' && r.to === 'tenants')
  return direct ? 'direct' : 'transitive'
}

export type TenantResolution =
  | { readonly kind: 'resolved'; readonly tenant: string }
  /** No tenant concept applies to this row — `tenantResolutionKind(name) === 'none'`. Not a failure. */
  | { readonly kind: 'none' }
  /** Two or more of this row's OWN references resolve to different tenants. Refuse; never guess. */
  | { readonly kind: 'conflict'; readonly candidates: readonly string[] }
  /** A candidate reference was present but could not be walked to any tenant (a dangling id, most likely). Refuse. */
  | { readonly kind: 'unresolved' }

/**
 * Walks `tenantCandidateRelations` for `row`, recursing into each
 * referenced row's own tenant. `chain` is the set of collections already
 * being resolved in this call stack — a guard against a cycle (there is
 * none reachable after the self-loop filter above, but the guard costs
 * nothing and turns a future graph change that DID introduce one into a
 * `'none'` contribution rather than a stack overflow).
 *
 * Every resolved candidate is collected into a `Set`: one member is the
 * answer, more than one is a genuine conflict (refused, never picked
 * between), and zero when at least one candidate FIELD was present but
 * did not resolve (a dangling reference) is `'unresolved'` (refused) —
 * distinct from zero because every candidate field was itself null/absent,
 * which is `'none'` exactly like a collection with no path at all.
 */
function resolveTenantId(
  name: CollectionName,
  row: Record<string, unknown>,
  store: Store,
  chain: ReadonlySet<CollectionName> = new Set(),
): TenantResolution {
  if (name === 'tenants') {
    return typeof row.id === 'string' ? { kind: 'resolved', tenant: row.id } : { kind: 'unresolved' }
  }
  const relations = tenantCandidateRelations(name)
  if (relations.length === 0) return { kind: 'none' }
  if (chain.has(name)) return { kind: 'none' }
  const nextChain = new Set(chain)
  nextChain.add(name)

  const candidates = new Set<string>()
  let anyCandidateFieldPresent = false

  for (const rel of relations) {
    const value = row[rel.field]
    if (value === null || value === undefined || typeof value !== 'string') continue
    anyCandidateFieldPresent = true

    if (rel.to === 'tenants') {
      candidates.add(value)
      continue
    }
    const targetRows = store.get(rel.to) as readonly Record<string, unknown>[]
    const target = targetRows.find((r) => r.id === value)
    if (target === undefined) continue // dangling reference: contributes nothing
    const sub = resolveTenantId(rel.to, target, store, nextChain)
    if (sub.kind === 'resolved') candidates.add(sub.tenant)
  }

  if (candidates.size === 1) return { kind: 'resolved', tenant: [...candidates][0]! }
  if (candidates.size > 1) return { kind: 'conflict', candidates: [...candidates] }
  return anyCandidateFieldPresent ? { kind: 'unresolved' } : { kind: 'none' }
}

/**
 * The read-time reading of `evaluateAccess`'s TENANT_ISOLATION and SCOPE
 * stages (see this file's header for why the full evaluator is not called
 * for a plain read). An identity with an EMPTY `siteScope`/`areaScope`
 * reads as carrying no restriction on that dimension at all — exactly what
 * a Read-only Auditor's or Tenant Admin's role-grant carries (no
 * `siteIds`/`areaIds`), the same reading `evaluateAccess`'s own SCOPE stage
 * gives an undeclared `requiredSites`/`requiredAreas`: an absent
 * constraint is never a narrower one than a declared, matching one.
 *
 * Fix round 2: a `'conflict'` or `'unresolved'` tenant resolution is
 * treated as NOT the caller's tenant (hidden from a TENANT-domain reader)
 * rather than shown by default — the same fail-closed rule the write path
 * applies, read for visibility instead of authorisation.
 */
function withinScope(name: CollectionName, row: Record<string, unknown>, ctx: AccessContext, store: Store): boolean {
  const { identity } = ctx
  if (!identity.signedIn || identity.role === null) return false
  const domain = roleById(identity.role).domain

  if (domain === 'TENANT') {
    if (identity.tenant === null) return false
    const resolution = resolveTenantId(name, row, store)
    // 'none' -> a platform-scoped row (e.g. `roles`), visible to every
    // signed-in identity. 'resolved' -> must match the actor's own tenant.
    // 'conflict'/'unresolved' -> fail closed, never shown as the caller's own.
    if (resolution.kind === 'resolved' && resolution.tenant !== identity.tenant) return false
    if (resolution.kind === 'conflict' || resolution.kind === 'unresolved') return false
  }
  // PLATFORM-domain identities are not narrowed by tenant here: they read
  // across tenants through a named access session, matching
  // `evaluateAccess`'s own PLATFORM branch.

  const siteVal = row.siteId
  if (typeof siteVal === 'string' && identity.siteScope.length > 0 && !identity.siteScope.includes(siteVal)) {
    return false
  }
  const areaVal = row.areaId
  if (typeof areaVal === 'string' && identity.areaScope.length > 0 && !identity.areaScope.includes(areaVal)) {
    return false
  }
  return true
}

function rowId(row: Record<string, unknown>): string {
  const id = row.id
  return typeof id === 'string' ? id : ''
}

/* ────────────────────────────────────────────────────────────────────── *
 * Write authorisation
 * ────────────────────────────────────────────────────────────────────── */

const TENANT_OPERATIONAL_WRITERS: readonly RoleId[] = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER']
const FRONTLINE_WRITERS: readonly RoleId[] = ['WORKER', 'SUPERVISOR', 'QUALITY_MANAGER']
const PLATFORM_WRITERS: readonly RoleId[] = ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER']
const COMMAND_ISSUERS: readonly RoleId[] = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER']

/**
 * `provisionTenant`'s own, single, explicitly-declared authorisation —
 * fix round 1 (unit-01, Task 5 review), replacing the two per-write
 * `authorizeWrite` exemptions the first pass bolted onto the generic
 * floor. `L75180`/`L52400`/`SB-31-01` are the SAME identifiers
 * `TenantsScreen.tsx`'s own `createDecision` already cites for "who may
 * create a tenant" — the same business decision, now also enforced at the
 * point of the actual write, not only at the point of showing the button.
 * Deliberately role-only, no `resourceTenant`: provisioning a tenant names
 * no existing resource to isolate against (the row does not exist until
 * this authorisation has already passed), so there is nothing here for a
 * stale or fresh `ctx.state` to disagree about either way.
 */
const PROVISION_TENANT_REQUEST: AccessRequest = {
  action: 'provision-tenant',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
  sourceRefs: ['L75180', 'L52400', 'SB-31-01'],
}

/**
 * The generic write door's own default role policy, keyed by truth-store
 * authority. This is deliberately the BROAD authority boundary this task
 * owns ("no collection write bypasses truth-store + role + scope"), not a
 * per-collection, per-action permission matrix — the narrower per-command
 * rules `@/kernel/reduce.ts`'s `SPECS` already carry for the twelve Hub
 * commands sit on top of, and never below, this floor.
 */
function defaultWriteRoles(authority: TruthStoreAuthority): readonly RoleId[] {
  switch (authority) {
    case 'hub':
    case 'studio':
      return TENANT_OPERATIONAL_WRITERS
    case 'device-local':
      return FRONTLINE_WRITERS
    case 'platform':
      return PLATFORM_WRITERS
    case 'command-queue':
      return COMMAND_ISSUERS
    case 'audit':
    case 'telemetry':
    case 'cc-projection':
    case 'review':
      return []
  }
}

function affectedSurfacesFor(authority: TruthStoreAuthority): readonly SurfaceId[] {
  switch (authority) {
    case 'hub':
      return ['SURF-DOH', 'SURF-CC']
    case 'studio':
      return ['SURF-STU', 'SURF-DOH', 'SURF-CC']
    case 'device-local':
      return ['SURF-FL', 'SURF-DOH']
    case 'command-queue':
      return ['SURF-CC', 'SURF-DOH', 'SURF-FL']
    case 'platform':
      return ['SURF-SA']
    case 'audit':
    case 'telemetry':
    case 'cc-projection':
    case 'review':
      return []
  }
}

/**
 * Fix round 1, §12.4: which `ActionClass` (`@/persistence/capability`) a
 * write against this collection represents, for the `ready-durable` vs.
 * `ephemeral-preview` gate. Every class below is in that module's own
 * `DURABLE_ACTIONS` set, so every write this repository can perform is
 * blocked outright unless storage is fully durable — exactly what §12.4
 * requires ("block every action representing durable evidence, a required
 * audit, capture acceptance, queue or command acceptance, approval,
 * publication, release, hold, synchronisation, or an authoritative
 * lifecycle change").
 */
function actionClassFor(name: CollectionName, authority: TruthStoreAuthority): ActionClass {
  if (name === 'holds') return 'hold'
  switch (authority) {
    case 'device-local':
      return 'captureAcceptance'
    case 'command-queue':
      return 'queueAcceptance'
    case 'studio':
      return 'publication'
    case 'platform':
      return 'lifecycleChange'
    case 'hub':
    case 'audit':
    case 'telemetry':
    case 'cc-projection':
    case 'review':
      return 'requiredAudit'
  }
}

/**
 * Fix round 2: `TENANT_MISMATCH` for a conflicting or unresolvable tenant
 * is returned BEFORE `evaluateAccess` ever runs — resolving the row's
 * owning tenant is a precondition for asking whether the actor's own
 * tenant may touch it, not one more thing `evaluateAccess` itself checks.
 * §7.4 puts tenant isolation above role/scope in the evaluation order; this
 * keeps that ordering rather than letting a role check run first against a
 * tenant the write cannot even prove.
 */
function tenantIsolationDenial(
  name: CollectionName,
  resolution: Extract<TenantResolution, { kind: 'conflict' | 'unresolved' }>,
): PermissionDecision {
  const detail =
    resolution.kind === 'conflict'
      ? `its own references resolve to more than one tenant (${resolution.candidates.join(', ')})`
      : `its owning tenant could not be determined from its own references`
  return deny(
    'explicitlyProhibited',
    'TENANT_MISMATCH',
    `This "${name}" row's tenant must be verifiable before it can be written: ${detail}. The write is refused ` +
      'rather than assumed to belong to the caller\'s tenant.',
    { stage: 'TENANT_ISOLATION', sourceRefs: ['§7.4', '§26.3', 'repository.ts'], auditExpectation: 'RECORDED_AS_REFUSAL' },
  )
}

function authorizeWrite(
  name: CollectionName,
  authority: TruthStoreAuthority,
  action: 'create' | 'update' | 'transition',
  row: Record<string, unknown>,
  ctx: AccessContext,
  store: Store,
): PermissionDecision {
  const resolution = resolveTenantId(name, row, store)
  if (resolution.kind === 'conflict' || resolution.kind === 'unresolved') {
    return tenantIsolationDenial(name, resolution)
  }
  const rowTenant = resolution.kind === 'resolved' ? resolution.tenant : null
  const siteId = typeof row.siteId === 'string' ? row.siteId : undefined
  const areaId = typeof row.areaId === 'string' ? row.areaId : undefined

  /**
   * Task 6 (unit-01) finding, corrected in fix round 1 (review IMPORTANT 1)
   * — `resourceTenant` is NEVER declared for a write to the `tenants`
   * collection itself, even though `resolveTenantId` above resolves one
   * (`name === 'tenants'` returns `{ kind: 'resolved', tenant: row.id }` —
   * the row's OWN id, by construction). That self-resolution is CORRECT and
   * load-bearing for READ visibility (`withinScope` above, ~L374: it is how
   * a TENANT-domain reader's own tenant row is matched at all) — the
   * narrower, write-path-only problem is that feeding it back into
   * `authorizeWrite`'s `resourceTenant` duplicates the role floor
   * (`defaultWriteRoles`) that already gates who may write `tenants` at
   * all, and on this one collection it can only ever produce a FALSE
   * refusal, never a true isolation catch (there is no second tenant to be
   * isolated from — the actor and the resource are the same platform-wide
   * record).
   *
   * It is also a LOAD-BEARING dead end this task's own live drive found:
   * the feature-and-suspension stage (`evaluateAccess`,
   * `NOT_YET_OR_NO_LONGER_ACTIVE_STATES`) refuses any write whose
   * `resourceTenant` resolves to a `PROVISIONING` (`invited`/`pilot`) or
   * `ARCHIVED` tenant — correct for an OPERATIONAL write reaching INTO a
   * not-yet-live or closed tenant, but with the pre-fix code this ALSO
   * refused the platform's own `Activate`/(future unit 10)
   * suspend-release/reactivate/restore writes ON that tenant's own row,
   * because the very state those actions exist to change is what the floor
   * was reading back as a refusal.
   *
   * `create` REMAINS EXEMPT TOO, but for a reason unrelated to the
   * `Activate` case above, and unrelated to staleness (fix round 1, unit-01
   * Task 5 review): a brand-new tenant's id is not yet in
   * `state.platform.tenants` no matter how fresh that state is — the row
   * being authorised does not exist until AFTER this very check passes —
   * so `evaluate.ts`'s platform-domain M4 check (`tenantPartition(state,
   * req.resourceTenant) === undefined` denies `TENANT_MISMATCH`) would
   * refuse it regardless. This exemption still matters for the GENERIC
   * `repository.create('tenants', …)` door — a future direct caller that
   * does not go through `provisionTenant` below would hit it again — but
   * Task 5's create wizard no longer depends on it: `provisionTenant` never
   * calls `authorizeWrite` for either of its two internal writes at all
   * (see that method's own comment for why one up-front authorisation
   * replaces the generic door's per-write check for this one compound
   * action).
   *
   * SCOPE OF WHAT THIS REMOVES, PRECISELY (fix round 1, unit-01 Task 5
   * review, accuracy correction): omitting `resourceTenant` here removes
   * its input to THREE checks in `evaluate.ts`, not one — the TENANT-domain
   * and PLATFORM-domain halves of the tenant-isolation stage's
   * resource-matching check (`req.resourceTenant !== undefined && …`, ~L205
   * and ~L229) AND the feature-and-suspension stage's `suspensionTenant`
   * lookup (~L315, `domain === 'TENANT' ? identity.tenant :
   * (req.resourceTenant ?? null)`), which is what `SUSPENDED_STATES` and
   * `NOT_YET_OR_NO_LONGER_ACTIVE_STATES` actually key off. It does NOT
   * remove the tenant-isolation stage's ACTOR-side checks, which do not
   * depend on `resourceTenant` at all (a TENANT-domain role still needs a
   * live ambient tenant, ~L192; a PLATFORM-domain role still may not carry
   * one, ~L212) — those keep applying to a `tenants` write exactly as they
   * do to any other. The floor for a `tenants` write is therefore
   * ROLE-ONLY as far as the RESOURCE is concerned
   * (`defaultWriteRoles('platform')`: `ROOT_SUPER_ADMIN`/`ADMIN`/
   * `PLATFORM_ENGINEER`) — wider than this screen's own `Activate` gate,
   * which excludes `PLATFORM_ENGINEER`. Every caller of
   * `repository.update`/`.transition('tenants', …)` MUST carry its own
   * role/object-state gate (as `TenantDetailScreen.tsx` does) — this floor
   * will not catch a caller that forgets one.
   *
   * FIX ROUND 1 (unit-01, Task 5 review) — THE `users` CARVE-OUT THIS
   * COMMENT BLOCK USED TO SIT BESIDE IS REVERTED, NOT REPAIRED. A narrower
   * exemption here (declare `resourceTenant` for `users` UNLESS the target
   * tenant's own current lifecycle was `invited`) shipped in this task's
   * first pass. Measured, under review: it was calibrated to the WRONG
   * condition. The write it existed for was never refused by the
   * feature-and-suspension stage it was written against — it was refused
   * `TENANT_MISMATCH` at the EARLIER tenant-isolation stage, because the
   * `ctx` the wizard's own two sequential writes shared was captured once,
   * before either write ran (`useAccessContext`'s own staleness, fixed
   * above in `src/ui/product/runtime/useRepository.ts` — but a value
   * already closed over by an in-flight multi-write handler does not
   * become fresher mid-execution just because the hook that produced it
   * now is). And once the actual condition was measured rather than
   * assumed, the exemption did not carry the narrowness its own name
   * claimed: `onboardingFirstUser` gated on nothing but "does this tenant's
   * CURRENT lifecycle happen to be invited" — not on the row being created
   * actually being a first Tenant Admin, not on its role, not on its
   * status, not on the tenant having no administrator yet. Any of the
   * three platform writers (including `PLATFORM_ENGINEER`, whom the
   * wizard's OWN gate excludes) could have created any number of `users`
   * rows, of any role and status, into any of the four seeded `invited`
   * tenants, including ones that already had one. Onboarding now has its
   * own door instead (`provisionTenant` below) — one explicit, single
   * authorisation for the whole compound action, never a second exemption
   * bolted onto the generic floor every OTHER `users` write still needs.
   */
  const req: AccessRequest = {
    action: `${action.toUpperCase()} ${name}`,
    allowedRoles: defaultWriteRoles(authority),
    sourceRefs: ['§12.5', '§12.6', 'repository.ts'],
    ...(rowTenant !== null && name !== 'tenants' ? { resourceTenant: brandTenantId(rowTenant) } : {}),
    ...(siteId !== undefined && ctx.identity.siteScope.length > 0 ? { requiredSites: [siteId] } : {}),
    ...(areaId !== undefined && ctx.identity.areaScope.length > 0 ? { requiredAreas: [areaId] } : {}),
  }
  return evaluateAccess(req, ctx)
}

/* ────────────────────────────────────────────────────────────────────── *
 * State-machine legality
 * ────────────────────────────────────────────────────────────────────── */

type TransitionRuling =
  | { readonly allowed: true; readonly field: string }
  | { readonly allowed: false; readonly reason: string }

/**
 * Delegates to the REAL, already-wired state machines: `captureTransition`
 * (`@/frontline/capture`, the fifteen edges the frozen source's own
 * diagram draws) for `captures`, and the definition/occurrence transition
 * tables (`@/domain/vocabularies`) for `schedules`. No other collection in
 * this build has a legality graph the source actually states, and this
 * function refuses rather than invent one — a fabricated graph would pass
 * every type check while deciding a question nobody sourced (the brief's
 * own trap #3: a `transition()` that returns `{ ok: true }` without really
 * consulting a state machine).
 *
 * This gap is recorded debt, not a TODO for this file: each §24.2
 * workflow unit registers the machine for the collections it actually
 * drives, against the source, once it has the screens that need it.
 */
function stateMachineLegality(name: CollectionName, row: Record<string, unknown>, to: string): TransitionRuling {
  if (name === 'captures') {
    const from = row.status as CaptureState
    const ruling = captureTransition(from, to as CaptureState)
    return ruling.allowed ? { allowed: true, field: 'status' } : { allowed: false, reason: ruling.reason }
  }
  if (name === 'schedules') {
    if (row.kind === 'definition') {
      const from = row.status as ScheduleDefinitionState
      const edge = SCHEDULE_DEFINITION_TRANSITIONS.find(
        (t) => (t.from as readonly string[]).includes(from) && t.to === to,
      )
      return edge
        ? { allowed: true, field: 'status' }
        : {
            allowed: false,
            reason: `"${from}" to "${to}" is not an edge the schedule-definition state ladder draws (@/domain/vocabularies).`,
          }
    }
    if (row.kind === 'occurrence') {
      const from = row.status as ScheduleOccurrenceState
      const edge = SCHEDULE_OCCURRENCE_TRANSITIONS.find(
        (t) => (t.from as readonly string[]).includes(from) && t.to === to,
      )
      return edge
        ? { allowed: true, field: 'status' }
        : {
            allowed: false,
            reason: `"${from}" to "${to}" is not an edge the schedule-occurrence state ladder draws (@/domain/vocabularies).`,
          }
    }
  }
  return {
    allowed: false,
    reason: `No state machine is registered for "${name}" in this build — transition() refuses rather than guess a legality graph the source does not state.`,
  }
}

/* ────────────────────────────────────────────────────────────────────── *
 * Scenario state, for the tenant-isolation/suspension stages evaluateAccess needs
 * ────────────────────────────────────────────────────────────────────── */

const TENANT_LIFECYCLE_MAP: Readonly<Record<string, TenantPartition['lifecycleState']>> = {
  invited: 'PROVISIONING',
  pilot: 'PROVISIONING',
  active: 'ACTIVE',
  'soft-suspended': 'SOFT_SUSPENDED',
  'hard-suspended': 'HARD_SUSPENDED',
  'compliance-suspended': 'COMPLIANCE_SUSPENDED',
  // Still operating while its tier changes -- not a suspension.
  'pending-downgrade': 'ACTIVE',
  archived: 'ARCHIVED',
}

/**
 * Projects the `tenants`/`feature-controls` collections into the
 * `ScenarioDomainState` shape `evaluateAccess` reads for tenant-isolation
 * and feature/suspension checks — derived from the collections' own truth
 * every time it is called, never a second copy of it. Exported so a caller
 * building an `AccessContext` (the scratch route, and any future screen)
 * does not have to re-derive this mapping itself.
 */
export function scenarioStateFor(store: Store): ScenarioDomainState {
  const base = emptyDomainState(scenarioRunId('RUN-data-repository'))
  const tenantRows = store.get('tenants') as readonly { id: string; lifecycle: string; tier: string }[]
  const featureRows = store.get('feature-controls') as readonly {
    featureKey: string
    platformDefault: boolean
    globallyDisabled: boolean
    tenantDesired: Record<string, boolean>
  }[]

  const featureControls: Record<string, boolean> = {}
  for (const f of featureRows) featureControls[f.featureKey] = f.globallyDisabled ? false : f.platformDefault

  const tenants: Record<string, TenantPartition> = Object.create(null) as Record<string, TenantPartition>
  for (const t of tenantRows) {
    const desiredFeatureValues: Record<string, boolean> = {}
    for (const f of featureRows) {
      const desired = f.tenantDesired[t.id]
      if (desired !== undefined) desiredFeatureValues[f.featureKey] = desired
    }
    tenants[t.id] = {
      displayName: t.id,
      lifecycleState: TENANT_LIFECYCLE_MAP[t.lifecycle] ?? 'ACTIVE',
      desiredFeatureValues,
      tier: t.tier,
      objects: {},
    }
  }

  return { ...base, platform: { ...base.platform, featureControls }, tenants }
}

/* ────────────────────────────────────────────────────────────────────── *
 * §12.4 persistence — one IndexedDB transaction per committed write
 * ────────────────────────────────────────────────────────────────────── */

// `satisfies (typeof STORES)[number]` the same way `@/persistence/coordinator`
// ties its own store-name constants to the schema — a typo here is a
// compile error, not a silently-missed store.
const SNAPSHOT_STORE = 'snapshots' satisfies (typeof STORES)[number]
const AUDIT_STORE = 'audit' satisfies (typeof STORES)[number]
const EVENTS_STORE = 'events' satisfies (typeof STORES)[number]

/**
 * The out-of-line key the repository's live snapshot is stored under.
 * Deliberately a STRING key, not a bare sequence integer: `@/persistence/
 * coordinator#commitTransition` already keys the SAME `snapshots` store by
 * `ScenarioDomainState.sequence` (a small integer) for the OTHER kernel
 * subsystem (`src/kernel`, `src/scenario`) — sharing that integer key space
 * would risk two unrelated systems' sequence counters colliding on the same
 * key. `commitTransition` itself is not reused here for the same reason
 * Task 7's original report gave: its `ProposedTransition`/`ScenarioDomainState`
 * types are that OTHER subsystem's shape and are not a plain collection
 * row set — reusing its TYPE would mean an unchecked cast, and reusing its
 * KEY SPACE would mean a collision. What IS reused, deliberately, is
 * everything genuinely shared: `openDatabase`, `STORES`, `errorMessage`
 * from `@/persistence/schema` (the same bridge `boot.ts` already opens
 * through `bootstrapStorage`), the SAME `audit`/`events` object stores
 * (keyed by `id`, so two independently-generated id schemes cannot
 * collide), and the exact abort/complete discipline `commitTransition`
 * already established (never call `preventDefault()` on a request's
 * `error` event; resolve only on the transaction's own `oncomplete`).
 */
const SNAPSHOT_KEY = 'repository-snapshot'

type CommitOutcome = { readonly ok: true } | { readonly ok: false; readonly reason: string }

/**
 * Commits the repository's full collection snapshot plus the ONE new
 * audit row and ONE new event row this write produced, in a single
 * `readwrite` IndexedDB transaction — §12.4's "next snapshot plus every
 * required record in one transaction." Resolves `{ ok: true }` only once
 * the transaction's `oncomplete` fires, matching `commitTransition`'s own
 * rule that a resolved `put()` request is not durability. Never throws:
 * every failure — no factory, a refused `open()`, a synchronous `put()`
 * throw, or an asynchronous request-error event — resolves a typed
 * failure instead, and the transaction is left to its OWN default abort
 * (no `preventDefault()`) rather than forced, so a partial write is never
 * silently accepted.
 */
async function commitToPersistence(
  factory: IDBFactory | null,
  snapshot: CollectionData,
  audit: AuditEvent,
  event: DomainEvent,
): Promise<CommitOutcome> {
  if (!factory) return { ok: false, reason: 'No IndexedDB implementation is available in this environment.' }

  let db: IDBDatabase
  try {
    db = await openDatabase(factory)
  } catch (err) {
    return { ok: false, reason: `Could not open the database: ${errorMessage(err)}` }
  }

  return new Promise((resolve) => {
    let settled = false
    const settle = (result: CommitOutcome) => {
      if (settled) return
      settled = true
      db.close()
      resolve(result)
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([SNAPSHOT_STORE, AUDIT_STORE, EVENTS_STORE], 'readwrite')
    } catch (err) {
      settle({ ok: false, reason: `Could not open the commit transaction: ${errorMessage(err)}` })
      return
    }

    let abortReason: string | null = null
    tx.onabort = () => settle({ ok: false, reason: abortReason ?? `Transaction aborted: ${errorMessage(tx.error)}` })
    tx.onerror = (ev) => {
      // The request's default action is to abort the transaction. Do NOT
      // call preventDefault() — see `commitTransition`'s own comment on
      // why that would silently accept a partial write.
      const target = ev.target as IDBRequest | null
      abortReason ??= `A record could not be written: ${errorMessage(target?.error ?? tx.error)}`
    }
    tx.oncomplete = () => settle({ ok: true })

    try {
      tx.objectStore(SNAPSHOT_STORE).put(snapshot, SNAPSHOT_KEY)
      tx.objectStore(AUDIT_STORE).put(audit)
      tx.objectStore(EVENTS_STORE).put(event)
    } catch (err) {
      abortReason = `A record could not be written: ${errorMessage(err)}`
      try {
        tx.abort()
      } catch {
        // Already finishing/aborted; onabort/onerror above still resolves.
      }
    }
  })
}

/* ────────────────────────────────────────────────────────────────────── *
 * Write plumbing shared by create/update/transition
 * ────────────────────────────────────────────────────────────────────── */

const PLATFORM_TENANT_MARKER = 'PLATFORM'

function resolveEventTenant(name: CollectionName, row: Record<string, unknown>, store: Store): string {
  const resolution = resolveTenantId(name, row, store)
  return resolution.kind === 'resolved' ? resolution.tenant : PLATFORM_TENANT_MARKER
}

/**
 * `Audit.before`/`after` are `Record<string, string | number | boolean |
 * null>` (OBJ-084's own schema) — a business row commonly carries arrays
 * and nested objects a plain record cannot hold. Every primitive field is
 * copied as-is; every non-primitive field is copied as its JSON text, so
 * nothing is silently dropped from the audit trail and the record always
 * satisfies its own schema (criterion 5: an exported session must
 * re-validate).
 */
function toAuditPrimitives(row: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(row)) {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value
    } else {
      out[key] = JSON.stringify(value)
    }
  }
  return out
}

function refusal(decision: PermissionDecision): WriteDenied {
  return { ok: false, kind: 'denied', decision, reason: decision.reasonCode, explain: decision.explanation }
}

function persistenceRefusal(actionClass: ActionClass, capability: PersistenceCapability, detail: string): WritePersistenceUnavailable {
  return {
    ok: false,
    kind: 'persistence-unavailable',
    reason: 'PERSISTENCE_NOT_DURABLE',
    explain:
      `This action ("${actionClass}") represents durable evidence, a required audit record, or an ` +
      `authoritative change, and storage is "${capability.state}" rather than fully durable (§12.4). ${detail} ` +
      'Navigation and read-only inspection remain available; nothing was changed.',
    capability,
  }
}

function truthStoreRefusal(name: CollectionName, authority: TruthStoreAuthority): WriteDenied {
  const decision = deny(
    'explicitlyProhibited',
    'HARD_GATE',
    `"${name}" is ${authority}-owned truth (§12.5). This generic write door never targets a ${authority} ` +
      `collection directly — ${
        authority === 'audit' || authority === 'telemetry'
          ? 'a row of this kind is only ever appended as a by-product of a real write elsewhere, atomically with it'
          : 'no surface holds an owned write through this door for it'
      }.`,
    { stage: 'COMMAND_VALIDATION', sourceRefs: ['§12.5'] },
  )
  return refusal(decision)
}

function notFoundRefusal(name: CollectionName, id: string, action: string): WriteDenied {
  return refusal(
    deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', `No "${name}" row with id "${id}" exists to ${action}.`, {
      stage: 'COMMAND_VALIDATION',
      sourceRefs: ['repository.ts'],
    }),
  )
}

function invalidResultRefusal(name: CollectionName, verb: string, issues: readonly string[]): WriteDenied {
  return refusal(
    deny(
      'explicitlyProhibited',
      'OBJECT_STATE_INVALID',
      `The ${verb} would produce an invalid "${name}" row: ${issues.join('; ')}`,
      { stage: 'COMMAND_VALIDATION', sourceRefs: ['repository.ts'] },
    ),
  )
}

/** What `boot.ts` hands `createRepository` — the same IndexedDB factory it already resolved for `bootstrapStorage`, plus the durability that call established. */
export interface PersistenceHandle {
  readonly factory: IDBFactory | null
  readonly capability: PersistenceCapability
}

/* ────────────────────────────────────────────────────────────────────── *
 * The repository
 * ────────────────────────────────────────────────────────────────────── */

export function createRepository(store: Store, persistence: PersistenceHandle): Repository {
  // Mutable only here, in this closure: downgraded on a real commit
  // failure (see `commitWrite` below) so every subsequent durable write
  // is honestly blocked too, not just the one that failed.
  let capability: PersistenceCapability = persistence.capability

  async function commitWrite<N extends CollectionName>(
    name: N,
    action: 'create' | 'update' | 'transition',
    nextRows: readonly RowOf<N>[],
    row: RowOf<N>,
    before: RowOf<N> | null,
    ctx: AccessContext,
    authority: TruthStoreAuthority,
  ): Promise<WriteResult<RowOf<N>>> {
    const seq = store.nextSequence()
    const occurredAt = new Date(store.clock.now()).toISOString()
    const rec = asRecord(row)
    const id = rowId(rec)
    const tenant = resolveEventTenant(name, rec, store)
    // Safe: `authorizeWrite` (called by every caller of `commitWrite` before
    // this point) only permits an action for a signed-in identity with a
    // non-null role — `evaluateAccess`'s own SESSION stage guarantees it.
    const role = ctx.identity.role as RoleId

    const event: DomainEvent = {
      id: `EVT-${seq}-${name}-${id}`,
      kind: 'operational',
      tenantId: tenant,
      actorId: ctx.actorOfRecord ?? 'unattributed',
      siteId: typeof rec.siteId === 'string' ? rec.siteId : null,
      areaId: typeof rec.areaId === 'string' ? rec.areaId : null,
      occurredAt,
      signalType: `${name}.${action}`,
      runId: typeof rec.runId === 'string' ? rec.runId : name === 'runs' ? id : null,
      stepExecutionId: null,
      status: 'recorded',
    }

    const audit: AuditEvent = {
      id: `AUD-${seq}-${name}-${id}`,
      tenantId: tenant === PLATFORM_TENANT_MARKER ? null : tenant,
      actorId: ctx.actorOfRecord ?? 'unattributed',
      effectiveRole: role,
      scope: { siteIds: [...ctx.identity.siteScope], areaIds: [...ctx.identity.areaScope] },
      action: `${action.toUpperCase()} ${name}`,
      result: 'success',
      denialReason: null,
      subjectRef: `${name}:${id}`,
      occurredAt,
      before: before ? toAuditPrimitives(asRecord(before)) : null,
      after: toAuditPrimitives(rec),
      auditClass: name,
      correlationId: event.id,
      causationId: null,
    }

    // The prospective NEXT store state, computed but NOT yet applied —
    // §12.4: nothing becomes visible in-memory until the durable commit
    // resolves. `store.snapshot()` is the CURRENT state; only these three
    // keys change.
    const prospective: CollectionData = {
      ...store.snapshot(),
      [name]: nextRows,
      events: [...store.get('events'), event],
      audit: [...store.get('audit'), audit],
    }

    const committed = await commitToPersistence(persistence.factory, prospective, audit, event)
    if (!committed.ok) {
      // Downgrade honestly: a commit that just failed means storage is no
      // longer trustworthy for THIS session, not only for this one write.
      capability = { state: 'persistence-denied', durable: false }
      return {
        ok: false,
        kind: 'persistence-unavailable',
        reason: 'PERSISTENCE_COMMIT_FAILED',
        explain: `The write could not be committed durably (${committed.reason}). Nothing was changed.`,
        capability,
      }
    }

    // Only now — after the ONE IndexedDB transaction's `oncomplete` — does
    // the in-memory store mutate and `notify()` fire. "Commit, then
    // publish": no subscriber ever sees a write that is not durable.
    store.replace(name, nextRows)
    store.replace('events', prospective.events)
    store.replace('audit', prospective.audit)
    store.notify()

    return { ok: true, row, events: [event], audit: [audit], affectedSurfaces: [...affectedSurfacesFor(authority)] }
  }

  /**
   * Fix round 1 (unit-01, Task 5 review) — the mechanical half of `create`
   * (persistence-capability gate, duplicate-id check, schema validation,
   * commit), factored out from AUTHORISATION so `provisionTenant` below can
   * reuse it for both of its writes without re-running `authorizeWrite`/
   * `evaluateAccess` a second time. The public `create()` method still
   * calls `authorizeWrite` itself, once, before calling this — this
   * function trusts its caller to have already decided the actor MAY
   * create this row; it is not itself reachable from outside this closure.
   */
  async function createRow<N extends CollectionName>(
    name: N,
    row: RowOf<N>,
    ctx: AccessContext,
    authority: TruthStoreAuthority,
  ): Promise<WriteResult<RowOf<N>>> {
    const actionClass = actionClassFor(name, authority)
    if (!permittedUnder(capability.state, actionClass)) {
      return persistenceRefusal(actionClass, capability, `Creating a "${name}" row is not permitted right now.`)
    }

    const rows = store.get(name) as readonly RowOf<N>[]
    const id = rowId(asRecord(row))
    if (rows.some((r) => rowId(asRecord(r)) === id)) {
      return refusal(
        deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', `A "${name}" row with id "${id}" already exists.`, {
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
        }),
      )
    }
    const parsed = COLLECTIONS[name].schema.safeParse(row)
    if (!parsed.success) {
      return invalidResultRefusal(name, 'create', parsed.error.issues.map((i) => i.message))
    }

    const nextRows = [...rows, parsed.data as RowOf<N>]
    return commitWrite(name, 'create', nextRows, parsed.data as RowOf<N>, null, ctx, authority)
  }

  const repository: Repository = {
    list(name, ctx) {
      const rows = store.get(name) as readonly RowOf<typeof name>[]
      const visible = rows.filter((row) => withinScope(name, asRecord(row), ctx, store))
      return QueryImpl.from(visible)
    },

    get(name, id, ctx) {
      const rows = store.get(name) as readonly RowOf<typeof name>[]
      const row = rows.find((r) => rowId(asRecord(r)) === id)
      if (row === undefined) return undefined
      return withinScope(name, asRecord(row), ctx, store) ? row : undefined
    },

    async create(name, row, ctx) {
      const authority = truthStoreFor(name)
      if (!writableThroughRepository(authority)) return truthStoreRefusal(name, authority)

      const decision = authorizeWrite(name, authority, 'create', asRecord(row), ctx, store)
      if (!permitsAction(decision)) return refusal(decision)

      return createRow(name, row, ctx, authority)
    },

    /**
     * Fix round 1 (unit-01, Task 5 review) — see the `Repository` interface
     * and `createRow`'s own comments for the full reasoning. One
     * authorisation for the whole compound action, then two mechanical
     * writes that never re-ask `evaluateAccess` — this is what makes the
     * SECOND write immune to `useAccessContext`'s staleness (fixed
     * separately, `src/ui/product/runtime/useRepository.ts`): there is no
     * second `evaluateAccess` call for a stale `ctx.state` to mislead.
     *
     * IDEMPOTENT ON `tenant.id` — deliberately, and only because this
     * method's own two callers (this repository's public surface has
     * exactly one: `CreateTenantWizard.tsx`) always pass the SAME two rows
     * on a retry. If a tenant with this id already exists, this method
     * does NOT attempt to recreate it (the generic door would correctly —
     * and unhelpfully, for a retry — refuse a duplicate id); it resumes at
     * the administrator write using the row already on file. This is safe
     * PRECISELY because the two-write policy lives here, with the writes:
     * a caller cannot retry "the administrator only" through any other
     * door, so there is no way to reach this idempotent branch except by
     * retrying the exact compound action that put the tenant there. Any
     * edit the caller made to the TENANT half of its two arguments since
     * the first attempt is silently ignored here, on purpose — the
     * committed row is authoritative, never a second, divergent copy of a
     * fact this repository already owns. `CreateTenantWizard.tsx` freezes
     * its own Identity/Commercial fields once this is true, rather than
     * leaving them editable and silently inert.
     */
    async provisionTenant(tenant, admin, ctx) {
      const decision = evaluateAccess(PROVISION_TENANT_REQUEST, ctx)
      if (!permitsAction(decision)) {
        return { ok: false, kind: 'denied', decision, reason: decision.reasonCode, explain: decision.explanation }
      }

      const existing = (store.get('tenants') as readonly RowOf<'tenants'>[]).find((t) => t.id === tenant.id)
      let tenantRow: RowOf<'tenants'>
      if (existing) {
        tenantRow = existing
      } else {
        const tenantResult = await createRow('tenants', tenant, ctx, 'platform')
        if (!tenantResult.ok) return tenantResult
        tenantRow = tenantResult.row
      }

      const adminResult = await createRow('users', admin, ctx, 'platform')
      if (!adminResult.ok) {
        return { ok: false, kind: 'partial', tenant: tenantRow, adminFailure: adminResult }
      }
      return { ok: true, tenant: tenantRow, admin: adminResult.row }
    },

    async update(name, id, patch, ctx) {
      const authority = truthStoreFor(name)
      if (!writableThroughRepository(authority)) return truthStoreRefusal(name, authority)

      const rows = store.get(name) as readonly RowOf<typeof name>[]
      const idx = rows.findIndex((r) => rowId(asRecord(r)) === id)
      if (idx === -1) return notFoundRefusal(name, id, 'update')
      const before = rows[idx]!

      const decision = authorizeWrite(name, authority, 'update', asRecord(before), ctx, store)
      if (!permitsAction(decision)) return refusal(decision) // nothing mutated

      const actionClass = actionClassFor(name, authority)
      if (!permittedUnder(capability.state, actionClass)) {
        return persistenceRefusal(actionClass, capability, `Updating "${name}:${id}" is not permitted right now.`)
      }

      const merged = { ...before, ...patch }
      const parsed = COLLECTIONS[name].schema.safeParse(merged)
      if (!parsed.success) {
        return invalidResultRefusal(name, 'update', parsed.error.issues.map((i) => i.message))
      }

      const next = [...rows]
      next[idx] = parsed.data as RowOf<typeof name>
      return commitWrite(name, 'update', next, parsed.data as RowOf<typeof name>, before, ctx, authority)
    },

    async transition(name, id, to, ctx) {
      const authority = truthStoreFor(name)
      if (!writableThroughRepository(authority)) return truthStoreRefusal(name, authority)

      const rows = store.get(name) as readonly RowOf<typeof name>[]
      const idx = rows.findIndex((r) => rowId(asRecord(r)) === id)
      if (idx === -1) return notFoundRefusal(name, id, 'transition')
      const before = rows[idx]!

      const decision = authorizeWrite(name, authority, 'transition', asRecord(before), ctx, store)
      if (!permitsAction(decision)) return refusal(decision) // nothing mutated

      const actionClass = actionClassFor(name, authority)
      if (!permittedUnder(capability.state, actionClass)) {
        return persistenceRefusal(actionClass, capability, `Transitioning "${name}:${id}" is not permitted right now.`)
      }

      const legality = stateMachineLegality(name, asRecord(before), to)
      if (!legality.allowed) {
        return refusal(
          deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', legality.reason, {
            stage: 'OBJECT_STATE',
            sourceRefs: ['repository.ts'],
          }),
        )
      }

      const merged = { ...before, [legality.field]: to }
      const parsed = COLLECTIONS[name].schema.safeParse(merged)
      if (!parsed.success) {
        return invalidResultRefusal(name, 'transition', parsed.error.issues.map((i) => i.message))
      }

      const next = [...rows]
      next[idx] = parsed.data as RowOf<typeof name>
      return commitWrite(name, 'transition', next, parsed.data as RowOf<typeof name>, before, ctx, authority)
    },

    subscribe(listener) {
      return store.subscribe(listener)
    },

    reset() {
      store.resetToSeed()
      store.notify()
    },

    exportJson() {
      const snap = store.snapshot()
      const out = {} as Record<CollectionName, unknown[]>
      for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
        out[name] = [...snap[name]]
      }
      return out
    },

    importJson(data) {
      if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        return { ok: false, problems: ['Top level must be an object keyed by collection name.'] }
      }
      const record = data as Record<string, unknown>
      const problems: string[] = []
      const next = {} as Record<CollectionName, readonly unknown[]>

      for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
        const rows = record[name]
        if (!Array.isArray(rows)) {
          problems.push(`${name}: missing or not an array`)
          continue
        }
        const seen = new Set<string>()
        const parsedRows: unknown[] = []
        rows.forEach((row: unknown, i: number) => {
          const result = COLLECTIONS[name].schema.safeParse(row)
          if (!result.success) {
            for (const issue of result.error.issues) {
              problems.push(`${name}[${i}] ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            }
            return
          }
          const parsedId = (result.data as { id?: string }).id
          if (typeof parsedId === 'string') {
            if (seen.has(parsedId)) problems.push(`${name}[${i}]: duplicate id ${parsedId}`)
            seen.add(parsedId)
          }
          parsedRows.push(result.data)
        })
        next[name] = parsedRows
      }

      if (problems.length > 0) return { ok: false, problems }
      store.restore(next as CollectionData)
      store.notify()
      return { ok: true }
    },

    persistenceCapability() {
      return capability
    },
  }

  return repository
}
