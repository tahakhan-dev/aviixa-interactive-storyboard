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
import type { AccessContext, Repository } from '@/data/repository'
import type { Store } from '@/data/store'
import { tenantId, type TenantId } from '@/domain/ids'
import { ROLES, type RoleId } from '@/domain/roles'
import type { ConnectivityMode } from '@/scenario/controls'
import { createTourRunner } from '@/tours/runner'
import { listTours } from '@/tours/registry'
import type { TourDefinition, TourHost, TourRunner, TourRunnerState } from '@/tours/types'
import { reviewerAccessContext, useRepository, useRuntimeReady, useStore } from '@/ui/product/runtime'
import { useChromeVisibility } from './useChromeVisibility'
import { RoleSimulator } from './RoleSimulator'
import { ScenarioControls } from './ScenarioControls'
import { Inspector } from './Inspector'
import { TourOverlay } from './tour/TourOverlay'
import { ToursMenu } from './tour/ToursMenu'

/**
 * Task 14 — `src/ui/demo/` is the reviewer's out-of-product tool. This file
 * defines `DemoControllerContext` (the reviewer's own scenario/persona/
 * clock/connectivity picker — never part of the product), the tour runner
 * context, and `DemoDataContext` (the repository/store, plus a reviewer
 * `AccessContext`).
 *
 * Task 1 (unit-01) — the ONE `ProductSessionContext` (the simulated
 * signed-in identity a real product screen reads through
 * `useProductSession()`) moved to `@/ui/product/runtime`: `boot()` now runs
 * there too (`<ProductRuntime>`, mounted in `app/layout.tsx` around BOTH
 * `{children}` and this component), not here — this file no longer calls
 * `boot()` and no longer declares a `ProductSessionContext` of its own.
 * `DemoDataContext` below is a thin re-export of the runtime's
 * `useRepository()`/`useStore()`/`useRuntimeReady()` plus
 * `reviewerAccessContext` (also moved to the runtime, reused rather than
 * redeclared — `session.ts#resolveSignIn`'s own pre-session user lookup
 * needs the identical cross-tenant read identity).
 *
 * `RoleSimulator`'s persona picker still only touches `DemoControllerContext`
 * — see `useMemo`s below: changing `personaId` rebuilds `controller`, and
 * never calls anything in `@/data/repository` — no `create`/`update`/
 * `transition`, ever. That is the whole proof for "changing the demo persona
 * executes no product command": there is no code path from here into a
 * write.
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

export const FAILURE_INJECTION_MODES = [
  'none',
  'network-error',
  'validation-error',
  'permission-denied',
] as const satisfies readonly FailureInjectionMode[]

/**
 * Reviewer bookmarks over the story, not product state — nothing in
 * `src/data` reads this today. Kept short and honestly labelled rather than
 * invented as a longer fake itinerary.
 */
export const DEMO_CHECKPOINTS = [
  'Shift start',
  'Mid-shift',
  'End of shift',
  'Reconciled',
] as const satisfies readonly string[]

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
 * DemoDataContext — the one `Repository` instance the runtime boots, plus a
 * reviewer-only `AccessContext` the Inspector reads through. Deliberately
 * `ROOT_SUPER_ADMIN`/no tenant, NOT the simulated persona above: the
 * Inspector is a reviewer tool proving what actually happened in the data
 * layer, not a view scoped to whichever persona the RoleSimulator currently
 * shows — `withinScope` (`@/data/repository`) already lets a PLATFORM-domain
 * identity read across every tenant, exactly what a cross-surface
 * propagation view needs. Task 1 (unit-01): `repository`/`store` and
 * `reviewerAccessContext` itself now come from `@/ui/product/runtime` — this
 * context is a thin re-export, not a second source of either.
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

/* ────────────────────────────────────────────────────────────────────── *
 * TourRunnerContext — Task 16. The ONE `TourRunner` instance this session
 * uses (Task 15's engine, `@/tours/runner`), shared by `WatchButton`,
 * `ToursMenu` and `TourOverlay` — all three are "index rows and screens" /
 * chrome consumers of the same running tour, never a second runner each.
 * `runner` is `null` until the runtime's `boot()` (`@/ui/product/runtime`,
 * an ancestor of `<DemoChrome>` now) resolves — a tour needs the SAME
 * repository/tours data every other reviewer tool waits on, so this
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

  // Task 1 (unit-01): `boot()` runs exactly once, in `<ProductRuntime>`
  // (`app/layout.tsx`), an ancestor of this component now — not here. This
  // reads the SAME repository/store every product screen reads through the
  // runtime; `useRuntimeReady()` replaces the local `dataState === null`
  // check this file used to make itself.
  const ready = useRuntimeReady()
  const repository = useRepository()
  const store = useStore()

  const [personaId, setPersonaId] = useState<RoleId>(DEFAULT_PERSONA_ID)
  const [connectivity, setConnectivity] = useState<ConnectivityMode>('online')
  const [failureInjection, setFailureInjection] = useState<FailureInjectionMode>('none')
  const [checkpointIndex, setCheckpointIndex] = useState(0)
  // The real clock lives on the store (`store.clock`, stable across renders
  // — `createStore` builds it once), not a second decorative one here. This
  // component just needs to re-render whenever the store changes so the
  // readout below stays fresh; `advanceClock` below writes the SAME clock
  // every product screen reads through `repository.ts`.
  const [, forceRender] = useState(0)
  useEffect(() => store.subscribe(() => forceRender((n) => n + 1)), [store])
  const clockMs = store.clock.now()

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
        // The real store clock — the same one `repository.ts` stamps every
        // committed write with — not a decorative copy. `notify()` is what
        // makes every product screen (and this bar's own `clockMs` readout
        // above) re-render off the new time, exactly like a committed write.
        store.clock.advance(ms)
        store.notify()
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
    [persona, connectivity, clockMs, failureInjection, checkpointIndex, store],
  )

  const demoData: DemoDataApi = useMemo(() => {
    if (!ready) return { repository: null, store: null, reviewerAccess: null }
    return { repository, store, reviewerAccess: reviewerAccessContext(store) }
  }, [ready, repository, store])

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
  // that — `demoData` is itself stable once `ready` flips true (see its own
  // `useMemo` above), so this only ever transitions null -> one runner,
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
