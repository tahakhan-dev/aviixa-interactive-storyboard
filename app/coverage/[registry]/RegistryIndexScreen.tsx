'use client'

import Link from 'next/link'
import { AppShell, DataTable, StatusPill, textColor, type DataTableColumn } from '@/ui/product'
import { arrayQuery, workflowStatusDisplay } from '@/registry/workflow-index'
import {
  getCoverageIndexRows,
  censusBySurface,
  censusByModule,
  routeSegmentFor,
  type CoverageIndexRow,
  type DimensionTally,
} from '@/registry/coverage-index'
import { REGISTRY_DESCRIPTORS, type RegistrySlug } from '@/coverage/descriptors'

/**
 * Task 18 — the browsable index shared by all fourteen `/coverage/<slug>/`
 * routes, built the same way Task 17 built `WorkflowIndex`
 * (`app/workflows/WorkflowIndex.tsx`): `AppShell` + `DataTable` over
 * `Query<T>`, every fact a column or a filter, nothing a locator, a source
 * classification or a narrative sentence (§8.6.2's deletion test — deleting
 * every sentence of prose in this file changes nothing it does, because
 * there is no prose paragraph or bullet list here to delete).
 *
 * REPLACES the earlier `RegistryIndex`/`CensusByDimension` pair this same
 * route used to render (`app/coverage/[registry]/page.tsx`, before this
 * task): that version's count-header paragraph, dedup-rule paragraph,
 * routeless-reason sentences and `sourceLine` column were exactly the
 * §8.6.2 violation this task exists to correct, and `tests/component/
 * registry-index.test.tsx` / `tests/coverage/registry-index-figures.test.ts`
 * — both written to assert that exact document-style rendering — are
 * deleted under APP-017 as a result (task-18-report.md names each obsoleted
 * assertion).
 *
 * DRILLS INTO AN ITEM CARD, not straight to the demonstrating screen. A row's
 * id links to `/coverage/<slug>/<id>/` (`ItemCard.tsx`), which is itself the
 * one place that surfaces the route/tours evidence — master prompt §9.6's
 * own words ("drills into the item's card"), and the same two-hop shape
 * `WorkflowIndex` -> `WorkflowCard` already established for workflows.
 */
const CENSUS_CAPTION = (kind: 'surface' | 'module', groups: number): string =>
  `${groups} ${kind} groups, with rows, demonstrated, other terminal statuses and not-represented counts.`

const CENSUS_COLUMNS: readonly DataTableColumn<DimensionTally>[] = [
  { key: 'group', header: 'Group', render: (t) => t.group, sortValue: (t) => t.group },
  { key: 'total', header: 'Rows', render: (t) => t.total, sortValue: (t) => t.total },
  { key: 'demonstrated', header: 'Demonstrated', render: (t) => t.demonstrated, sortValue: (t) => t.demonstrated },
  { key: 'other', header: 'Mounted, not applicable or decision blocked', render: (t) => t.other, sortValue: (t) => t.other },
  { key: 'notRepresented', header: 'Not represented', render: (t) => t.notRepresented, sortValue: (t) => t.notRepresented },
]

function CensusTable({ kind, tallies }: { readonly kind: 'surface' | 'module'; readonly tallies: readonly DimensionTally[] }) {
  if (tallies.length === 0) return null
  return (
    <div className="mt-6">
      <DataTable
        caption={CENSUS_CAPTION(kind, tallies.length)}
        columns={CENSUS_COLUMNS}
        query={arrayQuery(tallies)}
        rowId={(t) => t.group}
        pageSize={Math.max(tallies.length, 1)}
        emptyState={{ title: `No ${kind} groups recorded.`, whatCreatesIt: 'scripts/build-registries.mjs' }}
      />
    </div>
  )
}

const ROW_COLUMNS: readonly DataTableColumn<CoverageIndexRow>[] = [
  { key: 'id', header: 'ID', render: (r) => r.id, sortValue: (r) => r.id },
  { key: 'name', header: 'Name', render: (r) => r.name, sortValue: (r) => r.name },
  {
    key: 'joinedTo',
    header: 'Joined to / register',
    hideBelow: 'lg',
    render: (r) => [r.moduleId, r.moduleDescriptor, r.surface, r.surfaceDescriptor, r.register].filter(Boolean).join(' · ') || '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: (r) => {
      const display = workflowStatusDisplay(r.status)
      return <StatusPill tone={display.tone} label={display.label} />
    },
  },
  {
    key: 'tours',
    header: 'Tours',
    hideBelow: 'lg',
    render: (r) => (r.tours.length > 0 ? r.tours.map((t) => t.title).join(', ') : '—'),
  },
  /*
    An authored, per-row fact (`registries/authored/census-status-
    overrides.json`), not a registry-wide narrative: why THIS row carries a
    decision-blocked/not-applicable status where the bare status alone would
    read as an unexplained shortfall. Present on a small minority of rows
    (22 of 627 on actionable-controls today, the do-not-use-cron register);
    every other cell in this column reads '—'.

    DELIBERATELY NO `hideBelow` HERE, unlike the other optional columns.
    `DataTable`'s mobile card list (`cardColumns`) renders every one of
    `pageRows` unwindowed, but only the columns with NO `hideBelow` — the
    desktop `<table>` above ~200 rows on a page windows to the ~29 rows
    nearest the current scroll position, which the do-not-use-cron rows
    (near the end of a 627-row array) are not among on first paint. A
    `hideBelow` here would mean this disclosure exists in the data and
    reaches no page at all, the exact defect this column exists to close —
    `tests/coverage/census-closure.test.ts`'s R5-A06 case.
  */
  {
    key: 'reason',
    header: 'Reason',
    render: (r) => r.statusReason ?? '—',
  },
]

export function RegistryIndexScreen({ slug }: { readonly slug: RegistrySlug }) {
  const descriptor = REGISTRY_DESCRIPTORS.find((d) => d.slug === slug)
  if (descriptor === undefined) return null
  const rows = getCoverageIndexRows(slug)
  const bySurface = censusBySurface(rows)
  const byModule = censusByModule(rows)

  return (
    <AppShell
      surface="SURF-SA"
      session={{ identity: 'Reviewer', role: 'ADMIN', tenant: null, device: 'desktop' }}
      title={descriptor.title}
      breadcrumbs={[{ label: 'Coverage dashboard', href: '/coverage/' }, { label: descriptor.title }]}
      {...(slug === 'workflows'
        ? {
            actions: (
              <Link href="/workflows/" data-control-id="coverage-workflows-open-full-index" className="text-sm underline">
                Open the full Workflow Index
              </Link>
            ),
          }
        : {})}
    >
      <DataTable
        caption={`${descriptor.title} index, ${rows.length} rows — by ID, name, join/register, status, tours and reason.`}
        columns={ROW_COLUMNS}
        query={arrayQuery(rows)}
        rowId={(r) => r.id}
        rowHref={(r) => `/coverage/${slug}/${encodeURIComponent(routeSegmentFor(slug, r.id))}/`}
        /*
          Every row of every one of the fourteen registries must actually be
          in the static export, not just claimed by this caption — property
          1 (task-18-report.md): "each index's rendered count equals its
          generated JSON's row count", checked against `out/` by
          `jq`/`python`, not against a live paginated view. `DataTable`'s
          default `pageSize` of 20 would leave 970 of 990 `functions` rows
          out of the exported HTML entirely. `pageSize={rows.length}` still
          windows the desktop `<table>` above ~200 rows (a real, scroll-
          driven virtualization, not a truncation — every row is reachable
          by scrolling) but the `md:hidden` mobile card list below it maps
          over the SAME unwindowed `pageRows`, so every row's full content
          is present in the raw exported HTML either way.
        */
        pageSize={Math.max(rows.length, 1)}
        search={{
          placeholder: 'Search by ID or name',
          match: (row, q) => {
            const needle = q.toLowerCase()
            return row.id.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle)
          },
        }}
        emptyState={{
          title: `There are no ${descriptor.title.toLowerCase()} yet.`,
          whatCreatesIt: 'scripts/build-registries.mjs, run against registries/raw/.',
        }}
      />
      {bySurface.length > 0 || byModule.length > 0 ? (
        <div className="mt-8">
          <h2 className={`text-lg font-semibold ${textColor('ink')}`}>Census by surface and by module</h2>
          <CensusTable kind="surface" tallies={bySurface} />
          <CensusTable kind="module" tallies={byModule} />
        </div>
      ) : null}
    </AppShell>
  )
}
