/**
 * Task 18 — the one data layer behind all fourteen `/coverage/<slug>/`
 * indexes and their item cards, the same shape `@/registry/workflow-index`
 * already established for the Workflow Index (Task 17): a single module
 * both the list screen and the detail screen read, so the two can never
 * disagree about what a row means.
 *
 * CLIENT-SAFE, NO `node:fs`. Every one of the fourteen generated registries
 * is a static import, same as `workflow-index.ts`'s own `workflowsRaw` —
 * this is what lets `RegistryIndexScreen`/`ItemCard` be ordinary client
 * components instead of needing `loadGeneratedRegistry` (Node-only,
 * `src/coverage/registry-loader.ts`, used by Server Components only).
 *
 * NO `sourceLine`, NO `sourceClass`, NO `statusReason` ON `CoverageIndexRow`.
 * §8.6.2 forbids a blueprint locator, a source classification or a
 * narrative sentence as page content, so the view model carries none of the
 * three — the same discipline `WorkflowIndexRow` already applies (its own
 * header comment: "carries no `sourceLine` field at all ... so there is
 * nothing here that could render one even by accident").
 */
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema, type RegistryRow } from '@/coverage/registry-schema'
import { REGISTRY_DESCRIPTORS, type CoverageStatus, type RegistrySlug } from '@/coverage/descriptors'
import { toursLinkedTo, type LinkedTour } from '@/data/tours-index'

import modulesRaw from '../../registries/generated/modules.json'
import featuresRaw from '../../registries/generated/features.json'
import subFeaturesRaw from '../../registries/generated/sub-features.json'
import functionsRaw from '../../registries/generated/functions.json'
import workflowsRaw from '../../registries/generated/workflows.json'
import businessUseCasesRaw from '../../registries/generated/business-use-cases.json'
import businessObjectsRaw from '../../registries/generated/business-objects.json'
import eventsRaw from '../../registries/generated/events.json'
import commandsRaw from '../../registries/generated/commands.json'
import notificationsRaw from '../../registries/generated/notifications.json'
import offlineScenariosRaw from '../../registries/generated/offline-scenarios.json'
import aiStoryboardsRaw from '../../registries/generated/ai-storyboards.json'
import scheduledWorkRaw from '../../registries/generated/scheduled-work.json'
import actionableControlsRaw from '../../registries/generated/actionable-controls.json'

const RAW: Record<RegistrySlug, unknown> = {
  modules: modulesRaw,
  features: featuresRaw,
  'sub-features': subFeaturesRaw,
  functions: functionsRaw,
  workflows: workflowsRaw,
  'business-use-cases': businessUseCasesRaw,
  'business-objects': businessObjectsRaw,
  events: eventsRaw,
  commands: commandsRaw,
  notifications: notificationsRaw,
  'offline-scenarios': offlineScenariosRaw,
  'ai-storyboards': aiStoryboardsRaw,
  'scheduled-work': scheduledWorkRaw,
  'actionable-controls': actionableControlsRaw,
}

/** One row's full view model — every field a screen may render, and no more. */
export interface CoverageIndexRow {
  readonly id: string
  readonly name: string
  readonly status: CoverageStatus
  readonly surface?: string
  readonly moduleId?: string
  readonly moduleDescriptor?: string
  readonly surfaceDescriptor?: string
  readonly register?: string
  readonly purpose?: string
  readonly primaryActor?: string
  readonly trigger?: string
  readonly surfacesTouched?: readonly string[]
  readonly terminalStates?: readonly string[]
  readonly participatingRoles?: readonly string[]
  readonly exercisedBy?: readonly string[]
  readonly route: string | null
  readonly tours: readonly LinkedTour[]
  /**
   * WHY this row carries the status it does, when the status alone would
   * read as a shortfall and is not one — an authored, per-row fact from
   * `registries/authored/census-status-overrides.json`, not a locator or a
   * registry-wide narrative. Present on a small minority of rows (the
   * decision-blocked/not-applicable ones an author actually recorded a
   * reason for); every other row carries none.
   */
  readonly statusReason?: string
}

function toIndexRow(row: RegistryRow): CoverageIndexRow {
  return {
    id: row.id,
    name: row.label ?? row.id,
    status: row.status,
    ...(row.surface !== undefined ? { surface: row.surface } : {}),
    ...(row.moduleId !== undefined ? { moduleId: row.moduleId } : {}),
    ...(row.moduleDescriptor !== undefined ? { moduleDescriptor: row.moduleDescriptor } : {}),
    ...(row.surfaceDescriptor !== undefined ? { surfaceDescriptor: row.surfaceDescriptor } : {}),
    ...(row.register !== undefined ? { register: row.register } : {}),
    ...(row.purpose !== undefined ? { purpose: row.purpose } : {}),
    ...(row.primaryActor !== undefined ? { primaryActor: row.primaryActor } : {}),
    ...(row.trigger !== undefined ? { trigger: row.trigger } : {}),
    ...(row.surfacesTouched !== undefined ? { surfacesTouched: row.surfacesTouched } : {}),
    ...(row.terminalStates !== undefined ? { terminalStates: row.terminalStates } : {}),
    ...(row.participatingRoles !== undefined ? { participatingRoles: row.participatingRoles } : {}),
    ...(row.exercisedBy !== undefined ? { exercisedBy: row.exercisedBy } : {}),
    ...(row.statusReason !== undefined ? { statusReason: row.statusReason } : {}),
    route: row.route ?? null,
    tours: toursLinkedTo(row.id),
  }
}

/**
 * Built by iterating `REGISTRY_DESCRIPTORS` — the same exhaustive fourteen-
 * slug list `src/coverage/descriptors.ts`'s own compile-time check
 * (`_registryDescriptorsExhaustive`) guarantees covers every `RegistrySlug` —
 * so the loop provably assigns every key `Record<RegistrySlug, ...>`
 * requires. The one cast per accumulator is the seed only, the same idiom
 * `countByStatus`/`countByClass` in `descriptors.ts` already use for the
 * same reason (`Object.fromEntries(...) as Record<...>`); every VALUE
 * assigned into it is still fully type-checked by the compiler.
 */
function bySlug<T>(build: (slug: RegistrySlug) => T): Record<RegistrySlug, T> {
  const result = {} as Record<RegistrySlug, T>
  for (const d of REGISTRY_DESCRIPTORS) {
    result[d.slug] = build(d.slug)
  }
  return result
}

const ROWS_BY_SLUG: Record<RegistrySlug, readonly CoverageIndexRow[]> = bySlug((slug) => {
  const registry = loadRegistry(GeneratedRegistrySchema, RAW[slug], `${slug} registry`)
  return registry.rows.map(toIndexRow)
})

const ROW_BY_ID: Record<RegistrySlug, ReadonlyMap<string, CoverageIndexRow>> = bySlug(
  (slug) => new Map(ROWS_BY_SLUG[slug].map((r) => [r.id, r] as const)),
)

/** Every row of one registry, in the fourteen files' own order. */
export function getCoverageIndexRows(slug: RegistrySlug): readonly CoverageIndexRow[] {
  return ROWS_BY_SLUG[slug]
}

export function getCoverageIndexRow(slug: RegistrySlug, id: string): CoverageIndexRow | undefined {
  return ROW_BY_ID[slug].get(id)
}

export function allCoverageIndexIds(slug: RegistrySlug): readonly string[] {
  return ROWS_BY_SLUG[slug].map((r) => r.id)
}

/**
 * ROUTE SEGMENT, not always the same string as `id`. `actionable-controls`
 * rows are keyed on their exact raw label text (`idPrefix: ''`, per
 * `src/coverage/descriptors.ts`) — all 627 exact ids are distinct, but 19
 * of them share a lower-cased form with another row in the SAME registry
 * ("Approve" / "approve"). Measured live: on this machine's default
 * case-insensitive filesystem (macOS APFS — the same hazard
 * `eslint-rules/no-cross-tree-import.mjs`'s own case probe exists for),
 * `next build`'s static export writes both rows into ONE directory and the
 * later row's page silently wins, so `find out/coverage/actionable-controls
 * -mindepth 1 -maxdepth 1 | wc -l` read 608 against 627 rows before this
 * fix — nineteen items reachable only as someone else's page, on exactly
 * the platform this build is developed and verified on.
 *
 * Only a row that genuinely collides gets a suffix; every other row's route
 * segment is its own id, unchanged, on every registry.
 */
function routeSegments(slug: RegistrySlug): ReadonlyMap<string, string> {
  const seenCount = new Map<string, number>()
  const segments = new Map<string, string>()
  for (const id of allCoverageIndexIds(slug)) {
    const key = id.toLowerCase()
    const n = (seenCount.get(key) ?? 0) + 1
    seenCount.set(key, n)
    segments.set(id, n === 1 ? id : `${id}__${n}`)
  }
  return segments
}

const ROUTE_SEGMENT_BY_ID: Record<RegistrySlug, ReadonlyMap<string, string>> = bySlug(routeSegments)
const ID_BY_ROUTE_SEGMENT: Record<RegistrySlug, ReadonlyMap<string, string>> = bySlug((slug) => {
  const reverse = new Map<string, string>()
  for (const [id, segment] of ROUTE_SEGMENT_BY_ID[slug]) reverse.set(segment, id)
  return reverse
})

/** The route segment `rowHref`/`generateStaticParams` must use for this id — see `routeSegments` above. */
export function routeSegmentFor(slug: RegistrySlug, id: string): string {
  return ROUTE_SEGMENT_BY_ID[slug].get(id) ?? id
}

/** The inverse of `routeSegmentFor` — what a decoded `[itemId]` param resolves to before any row lookup. */
export function idForRouteSegment(slug: RegistrySlug, segment: string): string | undefined {
  return ID_BY_ROUTE_SEGMENT[slug].get(segment)
}

/**
 * Every `(registry, itemId)` pair across all fourteen inventories — the
 * population `app/coverage/[registry]/[itemId]/page.tsx`'s
 * `generateStaticParams` expands, 5,015 pairs at the time of writing (one
 * per row of the fourteen `registries/generated/*.json` files, summed).
 * `itemId` is the ROUTE SEGMENT (`routeSegmentFor`), not always the bare id.
 */
export function allCoverageItemParams(): readonly { registry: RegistrySlug; itemId: string }[] {
  return REGISTRY_DESCRIPTORS.flatMap((d) =>
    allCoverageIndexIds(d.slug).map((id) => ({ registry: d.slug, itemId: routeSegmentFor(d.slug, id) })),
  )
}

/**
 * §13.1's per-surface / per-module tally — DATA, not narrative: group name,
 * row count, demonstrated count, every other terminal status, not-represented
 * count. Reused from the same computation `app/coverage/[registry]/page.tsx`
 * carried before this task (`tallyBy`); only the presentation changed.
 * Registries whose rows carry neither dimension return an empty array for
 * both, and a caller renders nothing for an empty array.
 */
export interface DimensionTally {
  readonly group: string
  readonly total: number
  readonly demonstrated: number
  readonly other: number
  readonly notRepresented: number
}

function tallyBy(
  rows: readonly CoverageIndexRow[],
  key: (row: CoverageIndexRow) => string | undefined,
): readonly DimensionTally[] {
  const groups = new Map<string, { total: number; demonstrated: number; notRepresented: number; other: number }>()
  for (const row of rows) {
    const group = key(row)
    if (group === undefined) continue
    const bucket = groups.get(group) ?? { total: 0, demonstrated: 0, notRepresented: 0, other: 0 }
    bucket.total += 1
    if (row.status === 'demonstrated-in-storyboard') bucket.demonstrated += 1
    else if (row.status === 'not-represented') bucket.notRepresented += 1
    else bucket.other += 1
    groups.set(group, bucket)
  }
  return [...groups.entries()].map(([group, b]) => ({ group, ...b })).sort((a, b) => (a.group < b.group ? -1 : 1))
}

export function censusBySurface(rows: readonly CoverageIndexRow[]): readonly DimensionTally[] {
  return tallyBy(rows, (r) => r.surface)
}

export function censusByModule(rows: readonly CoverageIndexRow[]): readonly DimensionTally[] {
  return tallyBy(rows, (r) => r.moduleId ?? r.moduleDescriptor)
}
