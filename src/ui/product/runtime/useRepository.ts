'use client'

/**
 * Task 1 (`src/ui/product/runtime/useRepository.ts`) — the one door every
 * product screen reads the repository, the session and derived access
 * through. Two contexts live here: `RuntimeDataContext` (the booted
 * `Repository`/`Store`, or an inert empty pair before `boot()` resolves) and
 * `ProductSessionContext` (the simulated signed-in identity,
 * `@/ui/product/runtime/session#ProductSessionApi`). `ProductRuntime.tsx`
 * is the ONLY component that renders either Provider.
 */
import { createContext, useContext, useMemo, useRef, useSyncExternalStore, type Context } from 'react'
import { createRepository, scenarioStateFor, type AccessContext, type Repository } from '@/data/repository'
import { createStore, type CollectionData, type Store } from '@/data/store'
import { COLLECTIONS, type CollectionName } from '@/data/schemas'
import type { IdentitySimulationState } from '@/domain/state'
import type { ProductSession } from '@/ui/product/AppShell'
import type { ProductSessionApi } from './session'

/* ────────────────────────────────────────────────────────────────────── *
 * Pre-boot placeholder — zero rows in every §3.1 collection, so a caller
 * inside `<ProductRuntime>` reads an always-valid, empty `Repository`
 * before `boot()` resolves rather than a `null` every selector has to
 * guard against. Module-level and built once: it is never written to
 * (`capability.state: 'uninitialized'` never becomes durable), so sharing
 * it across every not-yet-booted render, and across server rendering
 * itself (the static export prerenders with no repository at all), is
 * safe — this IS the pre-boot value `useRepositoryQuery` below reads.
 * ────────────────────────────────────────────────────────────────────── */
const EMPTY_SEED = (Object.keys(COLLECTIONS) as CollectionName[]).reduce(
  (seed, name) => {
    seed[name] = []
    return seed
  },
  {} as Record<CollectionName, readonly unknown[]>,
) as CollectionData
const EMPTY_STORE: Store = createStore(EMPTY_SEED)
const EMPTY_REPOSITORY: Repository = createRepository(EMPTY_STORE, {
  factory: null,
  capability: { state: 'uninitialized', durable: false },
})

export interface RuntimeData {
  readonly repository: Repository
  readonly store: Store
  /** False until `boot()` resolves. Rule 2: screens gate their loading state on this, never on `repository`/`session` being "empty". */
  readonly ready: boolean
}

const PRE_BOOT_DATA: RuntimeData = { repository: EMPTY_REPOSITORY, store: EMPTY_STORE, ready: false }

const RuntimeDataContext: Context<RuntimeData | null> = createContext<RuntimeData | null>(null)
const ProductSessionContext: Context<ProductSessionApi | null> = createContext<ProductSessionApi | null>(null)

// `ProductRuntime.tsx` renders both Providers; nothing else may construct
// either context, which is what keeps this the ONE `ProductSessionContext`
// in the tree (`grep -rn "ProductSessionContext" src` proves it).
export { RuntimeDataContext, ProductSessionContext, PRE_BOOT_DATA }

function useRuntimeData(): RuntimeData {
  const ctx = useContext(RuntimeDataContext)
  if (ctx === null) {
    throw new Error(
      'useRepository()/useStore()/useAccessContext()/useRuntimeReady()/useRepositoryQuery() must be called under <ProductRuntime>',
    )
  }
  return ctx
}

export function useRepository(): Repository {
  return useRuntimeData().repository
}

export function useStore(): Store {
  return useRuntimeData().store
}

export function useRuntimeReady(): boolean {
  return useRuntimeData().ready
}

export function useProductSession(): ProductSessionApi {
  const ctx = useContext(ProductSessionContext)
  if (ctx === null) throw new Error('useProductSession() must be called under <ProductRuntime>')
  return ctx
}

/**
 * ROOT_SUPER_ADMIN, no tenant, signed in — the one identity that needs to
 * read across every tenant rather than its own: the demo Inspector (moved
 * here from `DemoChrome.tsx`, which now only re-exports it through
 * `DemoDataContext`) and `session.ts#resolveSignIn`'s own user/tenant
 * lookup, which runs BEFORE a real session exists and so cannot use
 * `useAccessContext()` (a signed-out identity sees nothing — `withinScope`
 * fails closed). Read-only in both call sites: `actorOfRecord` below is
 * never used to attribute a write.
 */
export function reviewerAccessContext(store: Store): AccessContext {
  return {
    state: scenarioStateFor(store),
    identity: {
      signedIn: true,
      role: 'ROOT_SUPER_ADMIN',
      tenant: null,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'demo-inspector',
  }
}

const SIGNED_OUT_IDENTITY: IdentitySimulationState = {
  signedIn: false,
  role: null,
  tenant: null,
  siteScope: [],
  areaScope: [],
  qualifications: [],
  deviceId: null,
  stepUpActive: false,
  accessSessionId: null,
}

function identityFor(session: ProductSession | null): IdentitySimulationState {
  if (session === null) return SIGNED_OUT_IDENTITY
  return {
    signedIn: true,
    role: session.role,
    tenant: session.tenant,
    siteScope: session.scope?.sites ? [...session.scope.sites] : [],
    areaScope: session.scope?.areas ? [...session.scope.areas] : [],
    qualifications: [],
    deviceId: null,
    // Task 2 fix round 1 (unit-01, review IMPORTANT 1): was hardcoded
    // `false` for every session regardless of how it landed. Threaded
    // through from `ProductSession.stepUpActive` (true only for a session
    // `session.ts#resolveStepUpCompletion` produced) so a later task can
    // gate a Root-only action on the caller's REAL step-up state instead
    // of a value this hook silently discarded.
    stepUpActive: session.stepUpActive ?? false,
    accessSessionId: null,
  }
}

interface AccessContextCache {
  readonly session: ProductSession | null
  readonly version: number
  readonly value: AccessContext
}

/**
 * Built from the CURRENT product session — signed-out (rule 2: never a
 * default persona) until `useProductSession().session` is non-null, which
 * itself is `null` until `signIn()` resolves to `{ kind: 'signed-in' }`.
 *
 * FIX ROUND 1 (unit-01, Task 5 review) — CRITICAL STALENESS FIX. This used
 * to be a plain `useMemo` keyed on `[store, session]`. `store` is created
 * ONCE in `ProductRuntime` and never replaced, and `session` only changes
 * on sign-in/sign-out — so `scenarioStateFor(store)` was computed exactly
 * ONCE per signed-in session and never again, no matter how many writes
 * happened afterward. Every `evaluateAccess` call anywhere in the app that
 * reads `ctx.state` (tenant isolation, feature/suspension) was therefore
 * reasoning about the store as it stood at sign-in time, forever, for any
 * component that stayed mounted. Measured consequence (task-5-report.md,
 * fix round 1): the create-tenant wizard's second write (the invited
 * administrator's `users` row) was refused `TENANT_MISMATCH` at the
 * TENANT_ISOLATION stage — not `TENANT_NOT_ACTIVE` at FEATURE_AND_
 * SUSPENSION as an earlier fix's own comment claimed — because the
 * tenant this second write named did not exist yet in the STALE `ctx.state`
 * captured before either write ran, even though the first write had
 * already committed it to the real `store` by the time the second write's
 * authorisation check ran.
 *
 * FIX: the exact same subscribe-and-version machinery `useRepositoryQuery`
 * below already uses (and this file already relies on elsewhere) —
 * `Repository#subscribe` notifies on every committed write;
 * `useSyncExternalStore` re-derives the snapshot whenever that fires or
 * `session` changes; a version counter (not the store reference, which
 * never changes) is what actually invalidates the cache. This makes
 * `ctx.state` current AS OF THE MOST RECENT RENDER, not as of mount — see
 * this file's own header comment on `useRepositoryQuery` for why a version
 * counter is used instead of comparing `select`'s output directly.
 *
 * WHAT THIS DOES NOT FIX ON ITS OWN: a value already read out of this hook
 * and closed over by an in-flight async function (e.g. a multi-step submit
 * handler) does not become fresher mid-execution just because the store
 * changed — React does not re-run a running closure. That is a structural
 * property of JavaScript, not of this hook, and it is why a compound,
 * multi-write action (like onboarding a tenant) belongs behind ONE
 * authorisation check inside the data layer (`repository.ts#provisionTenant`)
 * rather than two sequential calls through this hook's stale-until-next-
 * render value. This fix closes the class of bug where a component that
 * STAYS MOUNTED across a write (its own, or one made by a completely
 * different call) keeps reasoning about `ctx.state` from before that write,
 * for the rest of its mounted lifetime — a real, independently-diagnosed
 * defect this build's screens had not yet visibly tripped over only
 * because every write path that could have exercised it either never
 * declares `resourceTenant` (Task 6's `tenants`-collection fix) or triggers
 * a full unmount/remount before the next gate check (client-side page
 * navigation). See `task-5-report.md`'s fix-round section for the measured
 * account of which of the unit's known deadlocks this alone does, and does
 * not, remove.
 */
export function useAccessContext(): AccessContext {
  const { store, repository } = useRuntimeData()
  const { session } = useProductSession()
  const versionRef = useRef(0)
  const cacheRef = useRef<AccessContextCache | null>(null)

  const subscribe = useMemo(
    () => (onStoreChange: () => void) =>
      repository.subscribe(() => {
        versionRef.current += 1
        onStoreChange()
      }),
    [repository],
  )

  function getSnapshot(): AccessContext {
    const cache = cacheRef.current
    if (cache && cache.session === session && cache.version === versionRef.current) {
      return cache.value
    }
    const value: AccessContext = {
      state: scenarioStateFor(store),
      identity: identityFor(session),
      online: true,
      deviceTrusted: true,
      actorOfRecord: session?.identity ?? null,
    }
    cacheRef.current = { session, version: versionRef.current, value }
    return value
  }

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

interface QueryCache<T> {
  readonly repository: Repository
  readonly ctx: AccessContext
  readonly version: number
  readonly value: T
}

/**
 * CONTRACT: `select` must be a pure function of `(repository, ctx)` alone —
 * it may read anything reachable from those two arguments, but it must not
 * close over any other reactive value (component state, props, a filter
 * string) and expect a change in that value alone to invalidate the cache
 * below. The cache is keyed on `(repository, ctx, version)`, NOT on
 * `select`'s own identity, precisely so the idiomatic call site — an inline
 * arrow, a fresh function reference every render — still hits the cache
 * instead of missing it every render (fix round 1: keying on `select`
 * identity defeated the cache for exactly that calling convention, which is
 * the only one this hook's own signature invites — there is no deps array).
 * A caller that needs to parameterise a query by something other than
 * `repository`/`ctx` must fold that parameter into scope some other way
 * (e.g. filtering the already-fetched `T` outside this hook), not rely on
 * `select`'s closure being re-read on every call.
 *
 * `select` reads through `Query#all()`/`#first()` etc., which return a
 * fresh array/value on every call even when nothing changed — reading
 * `select(repository, ctx)` directly as `useSyncExternalStore`'s snapshot
 * would look "changed" on every unrelated re-render. `versionRef` is
 * bumped only by an actual `repository.subscribe` notification, so the
 * cached value is reused until real data changes or `ctx` changes (a
 * different signed-in identity).
 *
 * Server/pre-boot snapshot: the SAME `getSnapshot` serves both — the
 * static export prerenders with no repository, and `useRuntimeData()`
 * already answers that with `PRE_BOOT_DATA` (`EMPTY_REPOSITORY`), so the
 * pre-boot value here IS the server value, exactly as
 * `@/ui/demo/DemoChrome#useTourRunnerState` reads `null` for both.
 */
export function useRepositoryQuery<T>(select: (r: Repository, ctx: AccessContext) => T): T {
  const { repository } = useRuntimeData()
  const ctx = useAccessContext()
  const versionRef = useRef(0)
  const cacheRef = useRef<QueryCache<T> | null>(null)

  const subscribe = useMemo(
    () => (onStoreChange: () => void) =>
      repository.subscribe(() => {
        versionRef.current += 1
        onStoreChange()
      }),
    [repository],
  )

  function getSnapshot(): T {
    const cache = cacheRef.current
    if (
      cache &&
      cache.repository === repository &&
      cache.ctx === ctx &&
      cache.version === versionRef.current
    ) {
      return cache.value
    }
    const value = select(repository, ctx)
    cacheRef.current = { repository, ctx, version: versionRef.current, value }
    return value
  }

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
