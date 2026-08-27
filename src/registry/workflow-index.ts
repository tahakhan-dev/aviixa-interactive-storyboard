/**
 * Task 17 — the Workflow Index's one data layer. Everything the list screen
 * (`app/workflows/WorkflowIndex.tsx`) and the detail screen
 * (`app/workflows/[workflowId]/WorkflowCard.tsx`) read comes through here,
 * so the two screens can never disagree about what a workflow row means.
 *
 * SOURCE FIELDS VS. DERIVED FIELDS. `registries/generated/workflows.json`
 * carries eight real extracted fields per row (id, sourceLine, status,
 * label, primaryActor, trigger, surfacesTouched, terminalStates) plus
 * `participatingRoles`/`exercisedBy`, already derived by
 * `scripts/build-registries.mjs`. It carries NO module, NO business-object
 * and NO variant-coverage field for any row — verified: zero of 724 rows
 * carry `moduleId`. This file does not fabricate those three; it derives
 * them the same way `participatingRoles` already is (scan real extracted
 * text against a closed, real vocabulary; keep only what the evidence
 * supports) and says, in each derivation's own comment, exactly what
 * evidence it rests on:
 *
 *  - OWNING MODULE: a workflow row's own `route` (R4-B10 — the shipped
 *    screen that demonstrates it) matched EXACTLY against a module row's
 *    own `route` in `modules.json`. Same route, same screen, same module —
 *    not a guess. Resolves 68 of 724 rows across 13 modules; the rest read
 *    unmapped, honestly, because no route resolves for them yet.
 *  - PRIMARY OBJECTS: the 99 canonical business-object labels
 *    (`business-objects.json`) found as whole-word matches in a row's own
 *    `label` + `trigger` text — the identical technique
 *    `build-registries.mjs` already uses for `participatingRoles` against
 *    the nine-role vocabulary, pointed at a different closed vocabulary.
 *    Resolves 452 of 724 rows.
 *  - VARIANT COVERAGE: a row's own `terminalStates` count, bucketed. A
 *    workflow's terminal states ARE its recorded outcome variants — the
 *    extraction's own field for "how this workflow can end" — so a count
 *    of them is a real, non-invented coverage summary, not a proxy for one.
 *
 * NEVER RENDERED HERE: `sourceLine`. `WorkflowIndexRow` carries no such
 * field at all — not omitted at the last render step, absent from the type
 * — so no screen built against this module can leak a blueprint locator
 * even by accident (§8.6.2's deletion test).
 */
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema, type RegistryRow } from '@/coverage/registry-schema'
import type { CoverageStatus } from '@/coverage/descriptors'
import { SURFACES, surfaceById, type SurfaceId } from '@/domain/surfaces'
import type { Query } from '@/data/repository'
import type { StatusToken } from '@/ui/product/tokens'

import workflowsRaw from '../../registries/generated/workflows.json'
import modulesRaw from '../../registries/generated/modules.json'
import businessObjectsRaw from '../../registries/generated/business-objects.json'

const WORKFLOWS = loadRegistry(GeneratedRegistrySchema, workflowsRaw, 'workflows registry')
const MODULES = loadRegistry(GeneratedRegistrySchema, modulesRaw, 'modules registry')
const BUSINESS_OBJECTS = loadRegistry(GeneratedRegistrySchema, businessObjectsRaw, 'business objects registry')

/**
 * TOURS ARE NOT WIRED IN HERE, DELIBERATELY. Two independent doors both
 * close on the direct path: `src/data/collections/tours.json` is business
 * truth and master prompt §12.6 requires it reach a component only through
 * `src/data/repository.ts` (a direct static import from this file is
 * exactly the "collections" boundary `pnpm lint`'s
 * `local/no-cross-tree-import` rule catches — verified live, not assumed);
 * going through `Repository` properly means booting the persistence layer
 * and holding an `AccessContext`/identity inside what is otherwise a
 * synchronous, build-time-known static-registry read, for a feature that
 * resolves to zero rows today (all three seeded tours carry
 * `workflowId: null` — `src/data/collections/tours.json`, checked). A
 * `WatchButton` would not even render usably from here regardless:
 * `useTourRunnerApi`'s context is provided only inside `DemoChrome`'s own
 * subtree, and `DemoChrome` mounts as a SIBLING of page content in
 * `app/layout.tsx` — a button mounted on a product route reads the
 * context's default (`runner: null`) and is permanently disabled, which
 * `pnpm lint` also refuses outright (`local/no-cross-tree-import`: nothing
 * outside `src/ui/demo/**` may import demo chrome, `app/layout.tsx`'s own
 * narrow carve-out excepted). Wiring tours in here would cost real scope
 * for a control that cannot work today either way. `WorkflowIndexRow`
 * carries no `tourIds` field as a result — when a future task gives a tour
 * a real `workflowId` and a legitimate client-side read path for product
 * screens exists, this is where that join belongs.
 */

/* ────────────────────────────────────────────────────────────────────── *
 * Owning surface — resolved from `surfacesTouched`'s free text.
 * ────────────────────────────────────────────────────────────────────── */

function resolveSurfaceIds(surfacesTouched: readonly string[] | undefined): readonly SurfaceId[] {
  if (surfacesTouched === undefined || surfacesTouched.length === 0) return []
  // 13 of 724 rows read "all five"/"All five surfaces" — a row that
  // genuinely touches every surface but names none of them individually.
  if (surfacesTouched.some((s) => s.toLowerCase().includes('all five'))) {
    return SURFACES.map((s) => s.id)
  }
  const ids = new Set<SurfaceId>()
  for (const raw of surfacesTouched) {
    const lower = raw.toLowerCase()
    for (const surface of SURFACES) {
      // Matches either the SURF-* code or the surface's own human name
      // (case-insensitively) — 95 of 724 rows carry only the prose name
      // ("Delivery Operations Hub"), never the code.
      if (lower.includes(surface.id.toLowerCase()) || lower.includes(surface.name.toLowerCase())) {
        ids.add(surface.id)
      }
    }
  }
  return [...ids]
}

/* ────────────────────────────────────────────────────────────────────── *
 * Owning module — resolved from an exact route match against modules.json.
 * ────────────────────────────────────────────────────────────────────── */

const MODULE_BY_ROUTE = new Map<string, RegistryRow>()
for (const m of MODULES.rows) {
  if (m.route !== undefined) MODULE_BY_ROUTE.set(m.route, m)
}

function resolveModule(row: RegistryRow): { readonly id: string; readonly label: string } | null {
  if (row.route === undefined) return null
  const m = MODULE_BY_ROUTE.get(row.route)
  if (m === undefined) return null
  return { id: m.id, label: m.label ?? m.id }
}

/* ────────────────────────────────────────────────────────────────────── *
 * Primary objects — whole-word matches against the business-object
 * vocabulary, longest label first so "Data Capture" is not also counted
 * for a shorter label it happens to contain.
 * ────────────────────────────────────────────────────────────────────── */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const OBJECT_LABELS = [...new Set(BUSINESS_OBJECTS.rows.map((r) => r.label).filter((l): l is string => l !== undefined))].sort(
  (a, b) => b.length - a.length,
)
const OBJECT_PATTERNS = OBJECT_LABELS.map((label) => ({ label, pattern: new RegExp(`\\b${escapeRegExp(label)}\\b`, 'i') }))

function derivePrimaryObjects(row: RegistryRow): readonly string[] {
  const text = [row.label, row.trigger].filter((s): s is string => s !== undefined).join(' ')
  if (text === '') return []
  const found: string[] = []
  for (const { label, pattern } of OBJECT_PATTERNS) {
    if (pattern.test(text)) found.push(label)
  }
  return found
}

/* ────────────────────────────────────────────────────────────────────── *
 * Variant coverage — bucketed from `terminalStates.length`.
 * ────────────────────────────────────────────────────────────────────── */

export type VariantCoverageBucket = 'none' | 'single' | 'double' | 'multi'

function variantCoverageBucketFor(terminalStates: readonly string[]): VariantCoverageBucket {
  const n = terminalStates.length
  if (n === 0) return 'none'
  if (n === 1) return 'single'
  if (n === 2) return 'double'
  return 'multi'
}

export const VARIANT_BUCKET_LABEL: Readonly<Record<VariantCoverageBucket, string>> = {
  none: 'No terminal state recorded',
  single: 'Single recorded outcome',
  double: 'Two recorded outcomes',
  multi: 'Three or more recorded outcomes',
}

/* ────────────────────────────────────────────────────────────────────── *
 * Implementation status — display tone/label, exhaustive over the five-
 * member `CoverageStatus` vocabulary (workflows.json uses two of them
 * today; the other three are handled so a future row that starts using one
 * renders correctly rather than falling through).
 * ────────────────────────────────────────────────────────────────────── */

export function workflowStatusDisplay(status: CoverageStatus): { readonly tone: StatusToken; readonly label: string } {
  switch (status) {
    case 'demonstrated-in-storyboard':
      return { tone: 'ok', label: 'Demonstrated in storyboard' }
    case 'mounted-in-another-screen':
      return { tone: 'info', label: 'Mounted in another screen' }
    case 'decision-blocked':
      return { tone: 'blocked', label: 'Decision blocked' }
    case 'not-applicable':
      return { tone: 'offline', label: 'Not applicable' }
    case 'not-represented':
      return { tone: 'pending', label: 'Not yet represented' }
  }
}

/* ────────────────────────────────────────────────────────────────────── *
 * The view model.
 * ────────────────────────────────────────────────────────────────────── */

export interface WorkflowIndexRow {
  readonly id: string
  readonly name: string
  readonly primaryActor: string | null
  readonly participatingRoles: readonly string[]
  readonly surfaceIds: readonly SurfaceId[]
  readonly surfaceNames: readonly string[]
  readonly moduleId: string | null
  readonly moduleLabel: string | null
  readonly primaryObjects: readonly string[]
  readonly status: CoverageStatus
  readonly terminalStates: readonly string[]
  readonly variantBucket: VariantCoverageBucket
  readonly variantSummary: string
  readonly route: string | null
  readonly trigger: string | null
}

export const WORKFLOW_INDEX_ROWS: readonly WorkflowIndexRow[] = WORKFLOWS.rows.map((row) => {
  const surfaceIds = resolveSurfaceIds(row.surfacesTouched)
  const module = resolveModule(row)
  const terminalStates = row.terminalStates ?? []
  const variantBucket = variantCoverageBucketFor(terminalStates)
  return {
    id: row.id,
    name: row.label ?? row.id,
    primaryActor: row.primaryActor ?? null,
    participatingRoles: row.participatingRoles ?? [],
    surfaceIds,
    surfaceNames: surfaceIds.map((id) => surfaceById(id).name),
    moduleId: module?.id ?? null,
    moduleLabel: module?.label ?? null,
    primaryObjects: derivePrimaryObjects(row),
    status: row.status,
    terminalStates,
    variantBucket,
    variantSummary: VARIANT_BUCKET_LABEL[variantBucket],
    route: row.route ?? null,
    trigger: row.trigger ?? null,
  }
})

const WORKFLOW_INDEX_ROWS_BY_ID = new Map(WORKFLOW_INDEX_ROWS.map((r) => [r.id, r] as const))

export function getWorkflowIndexRow(id: string): WorkflowIndexRow | undefined {
  return WORKFLOW_INDEX_ROWS_BY_ID.get(id)
}

export function allWorkflowIndexIds(): readonly string[] {
  return WORKFLOW_INDEX_ROWS.map((r) => r.id)
}

/* ────────────────────────────────────────────────────────────────────── *
 * Filter option sets — every value computed from the loaded rows, never
 * hand-written, so a filter can never offer an option that matches zero
 * rows and can never silently miss one that exists.
 * ────────────────────────────────────────────────────────────────────── */

function distinctSorted<T extends string>(values: Iterable<T>): readonly T[] {
  return [...new Set(values)].sort()
}

export const DISTINCT_SURFACE_IDS = distinctSorted(WORKFLOW_INDEX_ROWS.flatMap((r) => r.surfaceIds))
export const DISTINCT_MODULE_IDS = distinctSorted(
  WORKFLOW_INDEX_ROWS.flatMap((r) => (r.moduleId === null ? [] : [r.moduleId])),
)
export const DISTINCT_ROLES = distinctSorted(WORKFLOW_INDEX_ROWS.flatMap((r) => r.participatingRoles))
export const DISTINCT_OBJECTS = distinctSorted(WORKFLOW_INDEX_ROWS.flatMap((r) => r.primaryObjects))
export const DISTINCT_STATUSES = distinctSorted(WORKFLOW_INDEX_ROWS.map((r) => r.status))
export const DISTINCT_VARIANT_BUCKETS = distinctSorted(WORKFLOW_INDEX_ROWS.map((r) => r.variantBucket))

export const MODULE_LABEL_BY_ID: ReadonlyMap<string, string> = new Map(
  WORKFLOW_INDEX_ROWS.flatMap((r) => (r.moduleId !== null && r.moduleLabel !== null ? [[r.moduleId, r.moduleLabel] as const] : [])),
)

/** The sentinel filter value for "this dimension is not recorded on the row" — a real, selectable option, never a silent no-op. */
export const UNASSIGNED = '__unassigned__'

/**
 * `T extends string` is always safely widened to `string` for a runtime
 * `.includes` check — this is the one cast in this file, contained here
 * rather than repeated at every call site.
 */
export function arrayDimensionMatch<T extends string>(values: readonly T[], selected: string): boolean {
  if (selected === UNASSIGNED) return values.length === 0
  return (values as readonly string[]).includes(selected)
}

export function moduleMatches(row: WorkflowIndexRow, selected: string): boolean {
  if (selected === UNASSIGNED) return row.moduleId === null
  return row.moduleId === selected
}

/* ────────────────────────────────────────────────────────────────────── *
 * `Query<T>` over a plain in-memory array — `@/data/repository`'s own
 * `QueryImpl` is not exported (it is built to wrap `Store`, not a static
 * registry array), so this is a small, self-contained factory with the
 * identical two-phase (`filtered` then `paged`) semantics `DataTable`
 * already depends on: `total()` reflects every `.where()` applied so far,
 * never a `.page()` call.
 * ────────────────────────────────────────────────────────────────────── */

export function arrayQuery<T>(rows: readonly T[]): Query<T> {
  function make(filtered: readonly T[], paged: readonly T[] | null): Query<T> {
    return {
      where: (pred) => make(filtered.filter(pred), null),
      sort: (key, dir = 'asc') => {
        const factor = dir === 'asc' ? 1 : -1
        const sorted = [...filtered].sort((a, b) => {
          const av = a[key]
          const bv = b[key]
          if (av === bv) return 0
          if (av === null || av === undefined) return 1
          if (bv === null || bv === undefined) return -1
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
          return String(av) < String(bv) ? -1 * factor : 1 * factor
        })
        return make(sorted, null)
      },
      page: (index, size) => make(filtered, filtered.slice(index * size, index * size + size)),
      all: () => paged ?? filtered,
      first: () => (paged ?? filtered)[0],
      count: () => (paged ?? filtered).length,
      total: () => filtered.length,
    }
  }
  return make(rows, null)
}
