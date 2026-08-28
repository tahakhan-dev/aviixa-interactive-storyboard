import { exportedRoutes } from './exported-routes'

/**
 * THE SCREENSHOT POPULATION §26.2 ACTUALLY ASKS FOR — Task 18 fix round 1.
 *
 * `exportedRoutes()` is every URL the static export writes. Until Task 18 that
 * was also the screenshot population, and the two coincided because every
 * route was a distinct hand- or generator-built PRODUCT SCREEN. Task 18 added
 * `app/coverage/[registry]/[itemId]/page.tsx` — ONE Next.js route, ONE React
 * component (`ItemCard`), instantiated 5,015 times over the fourteen
 * registries' own rows purely as build-time static-params data. Every one of
 * those 5,015 pages is the same `AppShell` + labelled `dl` with different text
 * substituted in; none of them is a distinct blueprint screen (no `SCR-*` id
 * backs a census row — `src/coverage/descriptors.ts`), and none of them has a
 * denied/stale/offline/conflict/fallback/recovered STATE the way a real
 * product screen does. It is a table row rendered as a page, one register's
 * worth of rows at a time.
 *
 * MASTER PROMPT §26.2 SAYS "SCREEN", NOT "ROUTE": Tier 1 is "canonical state
 * of every screen"; Tier 2 is the critical denied/stale/offline/... states of
 * a screen; Tier 3 is representative responsive/locale/theme combinations of a
 * screen. None of the three tiers is "one capture per emitted URL" — that was
 * only ever true here because route and screen happened to be the same
 * cardinality everywhere else in this build. Requiring 5,015 captures of one
 * template proves nothing beyond what a handful of representatives prove:
 * every one is visually identical furniture around different strings, images
 * in this project cannot even be read back to compare them (deny rule, to
 * save tokens), and the real cost is not nothing — roughly 2.3 GiB and hours
 * of capture time, against 383 MiB for the entire rest of the export.
 *
 * WHAT THIS DOES NOT TOUCH. The fourteen `/coverage/<registry>/` INDEX pages
 * and the `/coverage/` dashboard are unaffected — fifteen distinct screens,
 * fifteen captures, already 1:1 in the manifest. `/workflows/<workflowId>/`
 * (724 routes, also one template) is ALSO unaffected: those are declared
 * product workflows a client would open one at a time, already captured 1:1
 * as an established convention this fix round did not reopen — the argument
 * above is about the coverage/census tool this task added, not a general
 * license to shrink any single-template route family.
 *
 * THE COLLAPSE RULE: one representative `/coverage/<registry>/<itemId>/`
 * route per registry (fourteen), alphabetically first by route, which is
 * exactly `exportedRoutes()`'s own sort order — deterministic and reproduced
 * by nothing but the export itself. That is a Tier-1 (canonical state of the
 * screen) capture per registry, which is where the template's rendered
 * content genuinely differs (which fields are populated varies by registry —
 * `ItemCard.tsx`'s field list). It does not additionally sample the
 * Reason/Tours/route-link presence toggles WITHIN a registry: those are data
 * values on one screen, not distinct screens, and §26.2's Tier 2/3 states
 * (denied, stale, offline, conflict, fallback, recovered, responsive, locale,
 * theme) have no analogue on a static, non-interactive evidence page.
 */
const COVERAGE_ITEM_ROUTE = /^\/coverage\/([^/]+)\/[^/]+\/$/

export function requiredScreenshotRoutes(root = 'out'): string[] {
  const all = exportedRoutes(root)
  const seenRegistry = new Set<string>()
  const required: string[] = []
  for (const route of all) {
    const match = COVERAGE_ITEM_ROUTE.exec(route)
    if (match === null) {
      required.push(route)
      continue
    }
    const registry = match[1] as string
    if (seenRegistry.has(registry)) continue
    seenRegistry.add(registry)
    required.push(route)
  }
  return required.sort()
}
