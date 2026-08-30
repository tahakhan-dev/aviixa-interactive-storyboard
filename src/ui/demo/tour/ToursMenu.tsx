'use client'

import { useMemo, useState } from 'react'
import { GeneratedRegistrySchema } from '@/coverage/registry-schema'
import { loadRegistry } from '@/registry/load'
import { SURFACES } from '@/domain/surfaces'
import type { TourDefinition } from '@/tours/types'
// R4-B10 precedent (`app/workflows/WorkflowIndex.tsx`): a `registries/
// generated/*.json` import is NOT `src/data/collections` — the one path the
// cross-tree-import boundary rule actually forbids outside `src/data/**` —
// so this needs no `Repository` door the way `tours.json` itself does
// (`@/tours/registry#listTours`, used below for `tours` itself).
import modulesRaw from '../../../../registries/generated/modules.json'
import { useTourRunnerApi, useTourRunnerState } from '../DemoChrome'
import { WatchButton } from './WatchButton'

const MODULES = loadRegistry(GeneratedRegistrySchema, modulesRaw, 'modules registry')

function navigateRoutes(tour: TourDefinition): readonly string[] {
  return tour.steps
    .map((s) => (s.action.kind === 'navigate' ? s.action.route : null))
    .filter((r): r is string => r !== null)
}

/** The FIRST navigated route that resolves to a known product surface — the tour's starting surface. */
function surfaceLabelFor(routes: readonly string[]): string {
  for (const route of routes) {
    const surface = SURFACES.find((s) => route === s.basePath || route.startsWith(`${s.basePath}/`))
    if (surface) return surface.name
  }
  return 'No product surface (demo chrome only)'
}

/** The DEEPEST navigated route with an exact modules-registry match — the module the tour actually demonstrates. */
function moduleLabelFor(routes: readonly string[]): string {
  for (let i = routes.length - 1; i >= 0; i -= 1) {
    const route = routes[i]
    if (!route) continue
    const row = MODULES.rows.find((r) => r.route === route)
    if (row) return `${row.id} — ${row.label ?? row.id}`
  }
  return 'No module identified'
}

interface GroupedTour {
  readonly tour: TourDefinition
  readonly surfaceLabel: string
  readonly moduleLabel: string
  readonly workflowLabel: string
}

function groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return map
}

function statusFor(tourId: string, activeState: ReturnType<typeof useTourRunnerState>): string {
  if (!activeState || activeState.tourId !== tourId) return 'Not started'
  switch (activeState.status) {
    case 'playing':
      return 'Playing'
    case 'paused':
      return 'Paused'
    case 'done':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'idle':
      return 'Not started'
  }
}

/**
 * Task 16, pass criterion 4: every tour `tours.json` carries, grouped by
 * surface / module / workflow, searchable, each row showing its live
 * status. `tours` comes straight from `useTourRunnerApi()` — the SAME list
 * `DemoChrome` built via `@/tours/registry#listTours` (the repository door,
 * never a direct `src/data/collections` import) — so this menu's count is
 * definitionally the same number `scripts/validate-collections.mjs` checks
 * `tours.json` against, not a second, independently-filtered copy that
 * could quietly drift from it.
 */
export function ToursMenu() {
  const { runner, tours } = useTourRunnerApi()
  const activeState = useTourRunnerState()
  const [search, setSearch] = useState('')

  const grouped: readonly GroupedTour[] = useMemo(
    () =>
      tours.map((tour) => {
        const routes = navigateRoutes(tour)
        return {
          tour,
          surfaceLabel: surfaceLabelFor(routes),
          moduleLabel: moduleLabelFor(routes),
          workflowLabel: tour.workflowId ?? 'No workflow assigned',
        }
      }),
    [tours],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return grouped
    return grouped.filter((g) => g.tour.id.toLowerCase().includes(q) || g.tour.title.toLowerCase().includes(q))
  }, [grouped, search])

  const bySurface = useMemo(() => groupBy(filtered, (g) => g.surfaceLabel), [filtered])

  return (
    <div data-demo="tours-menu">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <label className="flex items-center gap-1 text-xs text-[#c9b3ff]">
          Search
          <input
            type="text"
            data-control-id="demo-tours-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tours…"
            className="rounded border border-[#4a3070] bg-[#1b1030] px-2 py-1 text-xs text-[#f0e6ff]"
          />
        </label>
        {/* Pass criterion 4's own check: this count is the FULL `tours`
            list length, never `filtered.length` — search narrows what is
            DISPLAYED, never what this reads as "every tour". */}
        <span data-demo="tours-count" className="text-[10px] text-[#c9b3ff]">
          {tours.length} tour{tours.length === 1 ? '' : 's'} total
        </span>
      </div>
      {runner === null ? (
        <p className="text-xs text-[#c9b3ff]">Tour data is still loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-[#c9b3ff]">No tour matches &quot;{search}&quot;.</p>
      ) : (
        Array.from(bySurface.entries()).map(([surfaceLabel, surfaceTours]) => (
          <section key={surfaceLabel} data-demo="tours-surface-group" className="mb-2">
            <h4 className="text-xs font-bold text-[#f5d90a]">{surfaceLabel}</h4>
            {Array.from(groupBy(surfaceTours, (g) => g.moduleLabel).entries()).map(([moduleLabel, moduleTours]) => (
              <div key={moduleLabel} className="ml-2">
                <h5 className="text-[11px] font-semibold text-[#c9b3ff]">{moduleLabel}</h5>
                {Array.from(groupBy(moduleTours, (g) => g.workflowLabel).entries()).map(
                  ([workflowLabel, workflowTours]) => (
                    <div key={workflowLabel} className="ml-2">
                      <h6 className="text-[10px] uppercase tracking-wide text-[#8a72c0]">{workflowLabel}</h6>
                      <ul className="ml-2 flex flex-col gap-1">
                        {workflowTours.map(({ tour }) => (
                          <li
                            key={tour.id}
                            data-demo="tours-row"
                            className="flex items-center justify-between gap-2 text-xs text-[#f0e6ff]"
                          >
                            <span>
                              <strong>{tour.id}</strong> — {tour.title}
                            </span>
                            <span className="flex items-center gap-2">
                              <span data-demo="tours-status">{statusFor(tour.id, activeState)}</span>
                              <WatchButton tourId={tour.id} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  )
}
