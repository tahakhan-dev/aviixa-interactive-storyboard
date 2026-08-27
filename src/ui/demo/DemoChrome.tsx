'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { boot } from '@/data/boot'
import { scenarioStateFor, type AccessContext, type Repository } from '@/data/repository'
import type { Store } from '@/data/store'
import { CANONICAL_EPOCH_MS, fixedClock, type Clock } from '@/domain/clock'
import { tenantId, type TenantId } from '@/domain/ids'
import { ROLES, type RoleId } from '@/domain/roles'
import type { ConnectivityMode } from '@/scenario/controls'
import { createTourRunner } from '@/tours/runner'
import { listTours } from '@/tours/registry'
import type { TourDefinition, TourHost, TourRunner, TourRunnerState } from '@/tours/types'
import type { ProductSession } from '@/ui/product/AppShell'
import { useChromeVisibility } from './useChromeVisibility'
import { RoleSimulator } from './RoleSimulator'
import { ScenarioControls } from './ScenarioControls'
import { Inspector } from './Inspector'
import { TourOverlay } from './tour/TourOverlay'
import { ToursMenu } from './tour/ToursMenu'

/**
 * Task 14 — `src/ui/demo/` is the reviewer's out-of-product tool. This file
 * is the one place both of §7.3.1's contexts are defined, because it is the
 * one component that owns both kinds of state: `DemoControllerContext` (the
 * reviewer's own scenario/persona/clock/connectivity picker — never part of
 * the product) and `ProductSessionContext` (the simulated signed-in identity
 * `src/ui/product/AppShell#ProductSession` shape needs, so a page can do
 * `const { session } = useProductSession()` and hand it straight to
 * `AppShell` without caring where it came from). They are two different
 * `useState` trees under two different `createContext`s so switching one can
 * never touch the other — see `useMemo`s below: changing `personaId` rebuilds
 * `session` and, through it, `ProductSessionContext`'s value, but never calls
 * anything in `@/data/repository` — no `create`/`update`/`transition`, ever.
 * That is the whole proof for "changing the demo persona executes no product
 * command": there is no code path from here into a write.
 */

/* ────────────────────────────────────────────────────────────────────── *
 * Personas — one per fixed RoleId (`@/domain/roles#ROLES`), never redrawn.
 * Tenant-domain roles are pinned to Bright Bikes, the §10.1 canonical cast
 * tenant every collection's seed data is deepest for; platform-domain roles
 * carry no tenant, matching `evaluateAccess`'s own PLATFORM-domain rule that
 * an ambient tenant on a platform role is a violation, not a convenience.
 * ────────────────────────────────────────────────────────────────────── */

export const DEMO_TENANT: TenantId = tenantId('TEN-BRIGHTBIKES')

export interface DemoPersona {
  readonly id: RoleId
  readonly label: string
  readonly role: RoleId
  readonly tenant: TenantId | null
}

export const DEMO_PERSONAS: readonly DemoPersona[] = ROLES.map((r) => ({
  id: r.id,
  label: r.name,
  role: r.id,
  tenant: r.domain === 'TENANT' ? DEMO_TENANT : null,
}))

const DEFAULT_PERSONA_ID: RoleId = 'SUPERVISOR'

export type FailureInjectionMode = 'none' | 'network-error' | 'validation-error' | 'permission-denied'

export const FAILURE_INJECTION_MODES: readonly FailureInjectionMode[] = [
  'none',
  'network-error',
  'validation-error',
  'permission-denied',
]

/**
 * Reviewer bookmarks over the story, not product state — nothing in
 * `src/data` reads this today. Kept short and honestly labelled rather than
 * invented as a longer fake itinerary.
 */
export const DEMO_CHECKPOINTS: readonly string[] = ['Shift start', 'Mid-shift', 'End of shift', 'Reconciled']

/* ────────────────────────────────────────────────────────────────────── *
 * DemoControllerContext — the reviewer's own tool: scenario, checkpoint,
 * persona, viewport (device is carried on `ProductSession` itself; the demo
 * controller's `persona.tenant`/`role` selection is what drives it),
 * injected failure. Never product truth.
 * ────────────────────────────────────────────────────────────────────── */

export interface DemoControllerState {
  readonly persona: DemoPersona
  readonly connectivity: ConnectivityMode
  readonly clockMs: number
  readonly failureInjection: FailureInjectionMode
  readonly checkpointIndex: number
}

export interface DemoControllerApi extends DemoControllerState {
  setPersona(id: RoleId): void
  setConnectivity(mode: ConnectivityMode): void
  advanceClock(ms: number): void
  setFailureInjection(mode: FailureInjectionMode): void
  setCheckpoint(index: number): void
  reset(): void
}

const DemoControllerContext = createContext<DemoControllerApi | null>(null)

export function useDemoController(): DemoControllerApi {
  const ctx = useContext(DemoControllerContext)
  if (ctx === null) throw new Error('useDemoController() must be called under <DemoChrome>')
  return ctx
}

/* ────────────────────────────────────────────────────────────────────── *
 * ProductSessionContext — the simulated signed-in identity. Shape reused
 * verbatim from `@/ui/product/AppShell#ProductSession` (never redeclared)
 * so a future page can pass `useProductSession().session` straight through
 * as `AppShellProps.session`.
 * ────────────────────────────────────────────────────────────────────── */

export interface ProductSessionApi {
  readonly session: ProductSession
}

const ProductSessionContext = createContext<ProductSessionApi | null>(null)

export function useProductSession(): ProductSessionApi {
  const ctx = useContext(ProductSessionContext)
  if (ctx === null) throw new Error('useProductSession() must be called under <DemoChrome>')
  return ctx
}

/* ────────────────────────────────────────────────────────────────────── *
 * DemoDataContext — the one `Repository` instance this app boots, plus a
 * reviewer-only `AccessContext` the Inspector reads through. Deliberately
 * `ROOT_SUPER_ADMIN`/no tenant, NOT the simulated persona above: the
 * Inspector is a reviewer tool proving what actually happened in the data
 * layer, not a view scoped to whichever persona the RoleSimulator currently
 * shows — `withinScope` (`@/data/repository`) already lets a PLATFORM-domain
 * identity read across every tenant, exactly what a cross-surface
 * propagation view needs.
 * ────────────────────────────────────────────────────────────────────── */

export interface DemoDataApi {
  readonly repository: Repository | null
  readonly store: Store | null
  readonly reviewerAccess: AccessContext | null
}

const DemoDataContext = createContext<DemoDataApi>({ repository: null, store: null, reviewerAccess: null })

export function useDemoData(): DemoDataApi {
  return useContext(DemoDataContext)
}

function reviewerAccessContext(store: Store): AccessContext {
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

/* ────────────────────────────────────────────────────────────────────── *
 * TourRunnerContext — Task 16. The ONE `TourRunner` instance this session
 * uses (Task 15's engine, `@/tours/runner`), shared by `WatchButton`,
 * `ToursMenu` and `TourOverlay` — all three are "index rows and screens" /
 * chrome consumers of the same running tour, never a second runner each.
 * `runner` is `null` until `boot()` (above) resolves — a tour needs the
 * SAME repository/tours data every other reviewer tool waits on, so this
 * follows the identical null-until-ready shape as `DemoDataApi` rather than
 * inventing a second "not ready yet" convention.
 * ────────────────────────────────────────────────────────────────────── */

export interface TourRunnerApi {
  readonly runner: TourRunner | null
  readonly tours: readonly TourDefinition[]
}

const TourRunnerContext = createContext<TourRunnerApi>({ runner: null, tours: [] })

export function useTourRunnerApi(): TourRunnerApi {
  return useContext(TourRunnerContext)
}

// Module-level, not an inline arrow in the hook below: `useSyncExternalStore`
// re-subscribes whenever the `subscribe` function reference changes, and an
// inline `() => () => {}` is a NEW reference every render — exactly the
// "effect keyed on a value that churns" class this build keeps producing
// (task brief). A `runner === null` caller never actually has anything to
// subscribe to, so the fallback only needs to be referentially STABLE, not
// distinct per call.
const NOOP_SUBSCRIBE = () => () => {}

/**
 * Reactive read of the shared runner's state — re-renders the caller on
 * every `TourRunner#subscribe` notification. `TourOverlay` and `ToursMenu`
 * both need this (spotlight/caption/controls react to every step; the menu's
 * per-row status pill reacts to the same state) — one hook, not two
 * hand-rolled subscriptions to the same store.
 */
export function useTourRunnerState(): TourRunnerState | null {
  const { runner } = useTourRunnerApi()
  return useSyncExternalStore(
    runner ? runner.subscribe : NOOP_SUBSCRIBE,
    () => runner?.state ?? null,
    // Server snapshot: this app is a static export (see `next.config.ts`) —
    // there is no tour running during prerender, matching
    // `useChromeVisibility`'s own "chrome carries zero markup before
    // hydration" property.
    () => null,
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * DemoChrome
 * ────────────────────────────────────────────────────────────────────── */

export function DemoChrome() {
  // `useChromeVisibility` runs first and unconditionally — every hook below
  // it must too (`if (hidden) return null` is the LAST statement in this
  // function, after every hook call, never before one).
  const { hidden, hide } = useChromeVisibility()

  const [dataState, setDataState] = useState<{ repository: Repository; store: Store } | null>(null)
  // Mount-once: `boot()` loads the seed, validates it and stands up the one
  // `Repository` this session uses. Nothing about that ever needs to run
  // twice, so an empty dependency array is correct, not an oversight.
  useEffect(() => {
    let cancelled = false
    boot()
      .then((result) => {
        if (!cancelled) setDataState({ repository: result.repository, store: result.store })
      })
      .catch(() => {
        // A seed validation failure throws from `boot()`; the chrome bar
        // still renders (persona/scenario controls are presentation-only),
        // it just has no repository to read — `Inspector`/`PropagationDrawer`
        // render their own "not connected yet" state for a null repository.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const [personaId, setPersonaId] = useState<RoleId>(DEFAULT_PERSONA_ID)
  const [connectivity, setConnectivity] = useState<ConnectivityMode>('online')
  const [failureInjection, setFailureInjection] = useState<FailureInjectionMode>('none')
  const [checkpointIndex, setCheckpointIndex] = useState(0)
  // Lazily constructed exactly once (functional initialiser) — never
  // rebuilt, never touches ambient time; `clock.advance` is the only writer.
  const [clock] = useState<Clock>(() => fixedClock(CANONICAL_EPOCH_MS))
  const [clockMs, setClockMs] = useState<number>(() => clock.now())

  // `DEMO_PERSONAS` is a module-level constant array, so `.find()` returns
  // the SAME object reference across renders as long as `personaId` is
  // unchanged — `persona` is therefore referentially stable exactly when it
  // should be, which is what makes the `useMemo` below correct.
  const persona = DEMO_PERSONAS.find((p) => p.id === personaId) ?? DEMO_PERSONAS[0]!

  const controller: DemoControllerApi = useMemo(
    () => ({
      persona,
      connectivity,
      clockMs,
      failureInjection,
      checkpointIndex,
      setPersona: setPersonaId,
      setConnectivity,
      advanceClock(ms: number) {
        clock.advance(ms)
        setClockMs(clock.now())
      },
      setFailureInjection,
      setCheckpoint: setCheckpointIndex,
      reset() {
        // Presentation-only, exactly like `RoleSimulator`'s persona switch:
        // every field this touches is local React state. No repository
        // call, so this can never approve work, change business state, or
        // touch an existing audit row's actor — the same guarantee a
        // persona switch carries, extended to the whole controller.
        setPersonaId(DEFAULT_PERSONA_ID)
        setConnectivity('online')
        setFailureInjection('none')
        setCheckpointIndex(0)
      },
    }),
    [persona, connectivity, clockMs, failureInjection, checkpointIndex, clock],
  )

  const session: ProductSession = useMemo(
    () => ({
      identity: `${persona.label} (demo)`,
      role: persona.role,
      tenant: persona.tenant,
      device: 'desktop',
    }),
    [persona],
  )
  const productSessionValue: ProductSessionApi = useMemo(() => ({ session }), [session])

  const demoData: DemoDataApi = useMemo(() => {
    if (dataState === null) return { repository: null, store: null, reviewerAccess: null }
    return {
      repository: dataState.repository,
      store: dataState.store,
      reviewerAccess: reviewerAccessContext(dataState.store),
    }
  }, [dataState])

  // `router` itself is not a stable reference across renders; a `ref` kept
  // current every render (safe — Next.js's own docs use this exact "always
  // current" ref pattern) means `tourHost.navigate` reads the LATEST router
  // at call time without `tourHost` itself needing `router` in its own
  // dependency array. That is what keeps `tourHost` — and therefore, below,
  // the `TourRunner` built from it — from being torn down and rebuilt on
  // every render: the defect class the brief names, applied to the one
  // effect-adjacent value in this file most exposed to it (a tour is
  // mid-autoplay the instant a re-render would otherwise hand it a NEW
  // host/runner it never subscribed to).
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const tourHost: TourHost = useMemo(
    () => ({
      navigate(route: string) {
        routerRef.current.push(route)
      },
    }),
    [],
  )

  // Built once repository/reviewerAccess are ready, and never again after
  // that — `demoData` is itself stable once `dataState` resolves (see its
  // own `useMemo` above), so this only ever transitions null -> one runner,
  // matching `createTourRunner`'s own contract: `tours` is handed to it
  // once, at construction, not re-read on every render.
  const tourRunnerApi: TourRunnerApi = useMemo(() => {
    if (!demoData.repository || !demoData.reviewerAccess) return { runner: null, tours: [] }
    const tours = listTours(demoData.repository, demoData.reviewerAccess)
    return { runner: createTourRunner(tours, tourHost), tours }
  }, [demoData, tourHost])

  // THE PROPERTY THIS FUNCTION EXISTS TO GUARANTEE: every hook above still
  // ran, so `show()` (reachable only through the hotkey while hidden — see
  // `useChromeVisibility`) keeps working. But the JSX below is `null`, so
  // the DOM and accessibility tree carry zero demo nodes. A `display:none`
  // wrapper would still ship every node below to a client's inspector; this
  // ships none.
  if (hidden) return null

  return (
    <DemoControllerContext.Provider value={controller}>
      <ProductSessionContext.Provider value={productSessionValue}>
        <DemoDataContext.Provider value={demoData}>
          <TourRunnerContext.Provider value={tourRunnerApi}>
            <DemoChromeBar onHide={hide} />
            {/* Task 16 — the overlay is its own top-level demo node, not
                nested inside `DemoChromeBar`'s panel toggles: it must be
                visible regardless of which chrome panel (if any) is open,
                and it disappears along with everything else here the
                instant `hidden` is true (this whole function already
                returned `null` above when that's the case). */}
            <TourOverlay />
          </TourRunnerContext.Provider>
        </DemoDataContext.Provider>
      </ProductSessionContext.Provider>
    </DemoControllerContext.Provider>
  )
}

type OpenPanel = 'none' | 'scenario' | 'inspector' | 'tours'

/**
 * The visible bar. Deliberately NOT the product design system: monospace
 * type, a dashed high-contrast border and a violet/amber palette that
 * shares no CSS custom property with `src/ui/product/tokens.ts` — chrome
 * must be visually distinct from product user interface in both themes, and
 * a fixed palette that never reads `prefers-color-scheme` is the cheapest
 * way to guarantee that: it looks the same, and stays legible, regardless
 * of which theme the product half of the page is currently in.
 */
function DemoChromeBar({ onHide }: { onHide: () => void }) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>('none')

  function toggle(panel: OpenPanel) {
    setOpenPanel((current) => (current === panel ? 'none' : panel))
  }

  return (
    <div
      data-demo="chrome-root"
      className="fixed inset-x-0 bottom-0 z-[999] border-t-4 border-dashed border-[#f5d90a] bg-[#1b1030] font-mono text-[#f0e6ff] shadow-[0_-4px_24px_rgba(0,0,0,0.55)]"
    >
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs">
        <span data-demo="badge" className="rounded bg-[#f5d90a] px-2 py-0.5 font-bold text-[#1b1030]">
          DEMO CHROME
        </span>
        <RoleSimulator />
        <button
          type="button"
          data-control-id="demo-scenario-toggle"
          data-demo="control"
          aria-expanded={openPanel === 'scenario'}
          onClick={() => toggle('scenario')}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a]"
        >
          Scenario
        </button>
        <button
          type="button"
          data-control-id="demo-inspector-toggle"
          data-demo="control"
          aria-expanded={openPanel === 'inspector'}
          onClick={() => toggle('inspector')}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a]"
        >
          Inspector
        </button>
        <button
          type="button"
          data-control-id="demo-tours-toggle"
          data-demo="control"
          aria-expanded={openPanel === 'tours'}
          onClick={() => toggle('tours')}
          className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a]"
        >
          Tours
        </button>
        <span className="ml-auto hidden text-[10px] text-[#c9b3ff] sm:inline">Alt+Shift+D toggles chrome</span>
        <button
          type="button"
          data-control-id="demo-chrome-hide"
          data-demo="control"
          onClick={onHide}
          className="rounded bg-[#f5d90a] px-2 py-1 font-bold text-[#1b1030] hover:bg-[#fef08a]"
        >
          Hide chrome
        </button>
      </div>
      <Panel open={openPanel === 'scenario'} label="panel-scenario">
        <ScenarioControls />
      </Panel>
      <Panel open={openPanel === 'inspector'} label="panel-inspector">
        <Inspector />
      </Panel>
      <Panel open={openPanel === 'tours'} label="panel-tours">
        <ToursMenu />
      </Panel>
    </div>
  )
}

function Panel({ open, label, children }: { open: boolean; label: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div data-demo={label} className="max-h-[60vh] overflow-y-auto border-t border-[#4a3070] bg-[#241542] p-3">
      {children}
    </div>
  )
}
