'use client'

import Link from 'next/link'
import { AppShell, DataTable, StatusPill, type DataTableColumn, type FilterDef } from '@/ui/product'
import { surfaceById } from '@/domain/surfaces'
import {
  WORKFLOW_INDEX_ROWS,
  MODULE_LABEL_BY_ID,
  DISTINCT_SURFACE_IDS,
  DISTINCT_MODULE_IDS,
  DISTINCT_ROLES,
  DISTINCT_OBJECTS,
  DISTINCT_STATUSES,
  DISTINCT_VARIANT_BUCKETS,
  UNASSIGNED,
  arrayDimensionMatch,
  moduleMatches,
  workflowStatusDisplay,
  VARIANT_BUCKET_LABEL,
  arrayQuery,
  type WorkflowIndexRow,
} from '@/registry/workflow-index'

/**
 * Task 17 — the Workflow Index, replacing the document-style page the
 * §24.3 audit convicted (title, narrative paragraphs, blueprint line
 * numbers rendered as page content). This file renders none of that: every
 * fact below is a table cell or a filter, nothing is a locator or a source
 * classification, and deleting every sentence of prose in this file would
 * not change what the screen does — there isn't any.
 *
 * NO TOURS COLUMN, AND NO `WatchButton` IMPORT. `pnpm lint`'s
 * `local/no-cross-tree-import` forbids every file outside `src/ui/demo/**`
 * from importing that tree — `app/layout.tsx`'s own narrow, paired-with-
 * `no-demo-reexport` carve-out is the ONE exception, and this route is not
 * it (verified live: importing `WatchButton` here fails `pnpm lint`
 * outright). Even without that rule, `useTourRunnerApi`'s context is
 * provided only inside `DemoChrome`'s own subtree, which `app/layout.tsx`
 * mounts as a SIBLING of page content, not an ancestor — a `WatchButton`
 * rendered on a product route would always read the context default
 * (`runner: null`) and be permanently disabled, a dead control under §13
 * regardless of the lint rule. `@/registry/workflow-index`'s own header
 * comment records why tours are not joined into the row data either
 * (`src/data/collections/tours.json` is business truth gated behind
 * `src/data/repository.ts` by §12.6, and all three seeded tours carry
 * `workflowId: null` today, so nothing observable is lost).
 *
 * SIX FILTERS (surface, module, role, object, status, variant coverage),
 * each built from `arrayDimensionMatch`/`moduleMatches` over real,
 * evidence-derived per-row data (`@/registry/workflow-index`) — never a
 * dead control: every non-sentinel option narrows to at least one row by
 * construction (it is read off the loaded rows themselves), and the
 * `UNASSIGNED` sentinel is a real predicate over the rows the dimension
 * does not resolve for, not a value that happens to match everything.
 */

const COLUMNS: readonly DataTableColumn<WorkflowIndexRow>[] = [
  { key: 'id', header: 'ID', render: (r) => r.id, sortValue: (r) => r.id },
  { key: 'name', header: 'Name', render: (r) => r.name, sortValue: (r) => r.name },
  {
    key: 'surface',
    header: 'Surface',
    render: (r) => (r.surfaceNames.length > 0 ? r.surfaceNames.join(', ') : '—'),
  },
  {
    key: 'module',
    header: 'Module',
    hideBelow: 'lg',
    render: (r) => r.moduleLabel ?? '—',
  },
  {
    key: 'initiatingRole',
    header: 'Initiating role',
    hideBelow: 'lg',
    render: (r) => r.primaryActor ?? '—',
  },
  {
    key: 'participatingRoles',
    header: 'Participating roles',
    hideBelow: 'lg',
    render: (r) => (r.participatingRoles.length > 0 ? r.participatingRoles.join(', ') : '—'),
  },
  {
    key: 'objects',
    header: 'Primary objects',
    hideBelow: 'lg',
    render: (r) => (r.primaryObjects.length > 0 ? r.primaryObjects.join(', ') : '—'),
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
    key: 'variant',
    header: 'Variant coverage',
    hideBelow: 'lg',
    render: (r) => r.variantSummary,
  },
]

const FILTERS: readonly FilterDef<WorkflowIndexRow>[] = [
  {
    key: 'surface',
    label: 'Surface',
    options: DISTINCT_SURFACE_IDS.map((id) => ({ value: id, label: surfaceById(id).name })),
    match: (row, value) => arrayDimensionMatch(row.surfaceIds, value),
  },
  {
    key: 'module',
    label: 'Module',
    options: [
      { value: UNASSIGNED, label: 'Not yet mapped to a shipped module' },
      ...DISTINCT_MODULE_IDS.map((id) => ({ value: id, label: MODULE_LABEL_BY_ID.get(id) ?? id })),
    ],
    match: moduleMatches,
  },
  {
    key: 'role',
    label: 'Participating role',
    options: [
      { value: UNASSIGNED, label: 'No role recorded' },
      ...DISTINCT_ROLES.map((role) => ({ value: role, label: role })),
    ],
    match: (row, value) => arrayDimensionMatch(row.participatingRoles, value),
  },
  {
    key: 'object',
    label: 'Primary object',
    options: [
      { value: UNASSIGNED, label: 'No object recorded' },
      ...DISTINCT_OBJECTS.map((object) => ({ value: object, label: object })),
    ],
    match: (row, value) => arrayDimensionMatch(row.primaryObjects, value),
  },
  {
    key: 'status',
    label: 'Implementation status',
    options: DISTINCT_STATUSES.map((status) => ({ value: status, label: workflowStatusDisplay(status).label })),
    match: (row, value) => row.status === value,
  },
  {
    key: 'variant',
    label: 'Variant coverage',
    options: DISTINCT_VARIANT_BUCKETS.map((bucket) => ({ value: bucket, label: VARIANT_BUCKET_LABEL[bucket] })),
    match: (row, value) => row.variantBucket === value,
  },
]

export function WorkflowIndex() {
  return (
    <AppShell
      surface="SURF-SA"
      session={{ identity: 'Reviewer', identityId: null, role: 'ADMIN', tenant: null, device: 'desktop' }}
      title="Workflow Index"
      breadcrumbs={[{ label: 'Workflow Index' }]}
      actions={
        <Link
          href="/workflows/ai-and-its-absence/"
          data-control-id="workflows-ai-absence-link"
          className="text-sm underline"
        >
          AI &amp; its absence
        </Link>
      }
    >
      <DataTable
        caption={`Workflow index, ${WORKFLOW_INDEX_ROWS.length} extracted workflow records — by ID, name, surface, module, roles, primary objects, status and variant coverage.`}
        columns={COLUMNS}
        query={arrayQuery(WORKFLOW_INDEX_ROWS)}
        rowId={(r) => r.id}
        rowHref={(r) => `/workflows/${encodeURIComponent(r.id)}/`}
        filters={FILTERS}
        search={{
          placeholder: 'Search by ID or name',
          match: (row, q) => {
            const needle = q.toLowerCase()
            return row.id.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle)
          },
        }}
        emptyState={{
          title: 'There are no workflows recorded yet.',
          whatCreatesIt: 'scripts/build-registries.mjs, run against registries/raw/extract/CHK-*.json.',
        }}
      />
    </AppShell>
  )
}
