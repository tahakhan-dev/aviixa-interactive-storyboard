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
    stepUpActive: false,
    accessSessionId: null,
  }
}

/**
 * Built from the CURRENT product session — signed-out (rule 2: never a
 * default persona) until `useProductSession().session` is non-null, which
 * itself is `null` until `signIn()` resolves to `{ kind: 'signed-in' }`.
 */
export function useAccessContext(): AccessContext {
  const { store } = useRuntimeData()
  const { session } = useProductSession()
  return useMemo<AccessContext>(
    () => ({
      state: scenarioStateFor(store),
      identity: identityFor(session),
      online: true,
      deviceTrusted: true,
      actorOfRecord: session?.identity ?? null,
    }),
    [store, session],
  )
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
