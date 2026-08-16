'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Table, StatusPill, Select, Button, type TableColumn, type TableRow } from '@/ui/primitives'
import { loadRegistry } from '@/registry/load'
// Imports the PURE schema module (no `node:fs`), not `@/coverage/registry-
// loader` -- this is a client component, and `registry-loader.ts` pulls in
// `readFileSync`, which Turbopack refuses to put in a browser bundle at all
// ("the chunking context does not support external modules (request:
// node:fs)"), reproduced while first building this against the loader.
import { GeneratedRegistrySchema, type RegistryRow } from '@/coverage/registry-schema'
import { COVERAGE_STATUSES } from '@/coverage/descriptors'
import { SURFACES } from '@/domain/surfaces'
import workflowsRaw from '../../registries/generated/workflows.json'

const WORKFLOW_COLUMNS: readonly TableColumn[] = [
  { key: 'id', header: 'Stable ID' },
  { key: 'name', header: 'Name' },
  { key: 'primaryActor', header: 'Primary actor' },
  { key: 'surfacesTouched', header: 'Surfaces touched' },
  { key: 'terminalStates', header: 'Terminal states' },
  { key: 'sourceLine', header: 'Source line' },
  { key: 'status', header: 'Implementation status' },
  { key: 'extractionCoverage', header: 'Extraction coverage' },
]

/**
 * Fix round 1 (defect 3): this page used to read the retired, legacy
 * `registries/generated/workflow-registry.json` (432 rows, deduped by the
 * extractor's bare id) -- so Task 7's composite-key fix
 * (`registries/generated/workflows.json`, 724 rows, worst residual collapse
 * 2) reached this file but never this screen. Now reads the ONE workflows
 * registry through the same strict `GeneratedRegistrySchema` every other
 * registry index uses.
 */
const WORKFLOWS = loadRegistry(GeneratedRegistrySchema, workflowsRaw, 'workflows registry')

const COLLAPSED_ROWS = WORKFLOWS.rows.filter((r) => (r.collapsedFrom ?? 1) > 1)
const ENTRIES_AFFECTED_BY_COLLAPSE = COLLAPSED_ROWS.reduce((sum, r) => sum + (r.collapsedFrom ?? 1), 0)

// Task 11: filter option sets, computed once from the loaded registry. The
// actor list is every distinct `primaryActor` the extraction recorded
// (427 of them) plus a real, stable sentinel for "no primary actor
// recorded" -- since every one of today's 724 rows carries one, selecting
// it can never match a row, which is what makes a deterministic no-match
// filter combination possible without relying on which real values happen
// not to co-occur.
const NO_ACTOR_VALUE = '__none__'
const DISTINCT_ACTORS = [...new Set(WORKFLOWS.rows.map((r) => r.primaryActor).filter((a) => a !== undefined))].sort()

const SURFACE_OPTIONS = [
  { value: '', label: 'All surfaces' },
  ...SURFACES.map((s) => ({ value: s.id, label: s.name })),
]
const ACTOR_OPTIONS = [
  { value: '', label: 'All actors' },
  { value: NO_ACTOR_VALUE, label: '(no primary actor recorded)' },
  ...DISTINCT_ACTORS.map((a) => ({ value: a, label: a })),
]
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...COVERAGE_STATUSES.map((s) => ({ value: s, label: s })),
]
const COLLAPSED_OPTIONS = [
  { value: '', label: 'All rows' },
  { value: 'collapsed', label: 'Collapsed rows only' },
  { value: 'not-collapsed', label: 'Not collapsed' },
]

function rowToTableRow(r: RegistryRow): TableRow {
  return {
    id: r.id,
    name: r.label ?? '—',
    primaryActor: r.primaryActor ?? '—',
    surfacesTouched: (r.surfacesTouched ?? []).length > 0 ? r.surfacesTouched?.join(', ') : '—',
    terminalStates: (r.terminalStates ?? []).length > 0 ? r.terminalStates?.join(', ') : '—',
    sourceLine: r.sourceLine,
    status: r.status,
    extractionCoverage:
      (r.collapsedFrom ?? 1) > 1 ? (
        <StatusPill
          tone="attention"
          icon="ℹ"
          label={`Represents ${r.collapsedFrom} extracted entries — could not be separated, the source gave them the same passage at the same source line`}
        />
      ) : (
        '—'
      ),
  }
}

/**
 * Task 11: four composing filters (surface, actor, status, collapsed-or-
 * not) plus a clear button. Filter state is component-local `useState` and
 * is presentation-only -- it narrows which rows render, dispatches nothing,
 * and never touches `WORKFLOWS` itself or any domain state. A combination
 * that matches zero rows renders a distinct "no workflows match" message,
 * never the registry's own (never-true-today) empty state.
 */
export function WorkflowIndex() {
  const [surface, setSurface] = useState('')
  const [actor, setActor] = useState('')
  const [status, setStatus] = useState('')
  const [collapsed, setCollapsed] = useState('')

  const filteredRows = useMemo(() => {
    return WORKFLOWS.rows.filter((r) => {
      if (surface !== '' && !(r.surfacesTouched ?? []).some((s) => s.includes(surface))) return false
      if (actor === NO_ACTOR_VALUE && r.primaryActor !== undefined) return false
      if (actor !== '' && actor !== NO_ACTOR_VALUE && r.primaryActor !== actor) return false
      if (status !== '' && r.status !== status) return false
      const isCollapsed = (r.collapsedFrom ?? 1) > 1
      if (collapsed === 'collapsed' && !isCollapsed) return false
      if (collapsed === 'not-collapsed' && isCollapsed) return false
      return true
    })
  }, [surface, actor, status, collapsed])

  const hasActiveFilter = surface !== '' || actor !== '' || status !== '' || collapsed !== ''

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm">
        <Link href="/coverage/" className="text-[var(--color-primary)] underline">
          Coverage dashboard
        </Link>
      </p>
      <p className="mt-2 text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        AVIIXA
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Workflow Index</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Simulated behaviour only. {WORKFLOWS.rawCount} extracted workflow
        records across the 36 extraction chunks, 1 cross-chunk duplicate
        merged, {WORKFLOWS.rows.length} rows below — the frozen source fixes
        no single workflow total anywhere in its 122,241 lines, and 81 is the
        MODULE count, not a workflow count. This index never presents{' '}
        {WORKFLOWS.rows.length} as a workflow total, only as the size of this
        extracted, composite-keyed record set.
      </p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Rows are keyed on id plus source line whenever the extracted id is a
        placeholder (&ldquo;unnumbered&rdquo; or &ldquo;unstated&rdquo;) or
        repeats at more than one source line, so distinct passages no longer
        collapse into one row just because the source gave them the same
        placeholder text. Only {COLLAPSED_ROWS.length} row still represents
        more than one extracted entry — {ENTRIES_AFFECTED_BY_COLLAPSE} in
        total — because it is a genuine duplicate: the same passage, at the
        same source line, extracted twice.
      </p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        No workflow has been demonstrated in this build yet: every row below
        reads &ldquo;not represented&rdquo; because slices 3-13, which build
        the module screens that would demonstrate one, have not run.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <Select label="Surface" options={SURFACE_OPTIONS} value={surface} onChange={setSurface} />
        <Select label="Actor" options={ACTOR_OPTIONS} value={actor} onChange={setActor} />
        <Select label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        <Select label="Collapsed" options={COLLAPSED_OPTIONS} value={collapsed} onChange={setCollapsed} />
        <Button
          variant="secondary"
          onClick={() => {
            setSurface('')
            setActor('')
            setStatus('')
            setCollapsed('')
          }}
        >
          Clear filters
        </Button>
      </div>

      {hasActiveFilter ? (
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]" role="status">
          {filteredRows.length} of {WORKFLOWS.rows.length} rows match the current filters.
        </p>
      ) : null}

      <div
        className="mt-4 overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Workflow registry table, scrollable horizontally"
      >
        {filteredRows.length === 0 && hasActiveFilter ? (
          <p className="text-[var(--color-ink-muted)]">
            No workflows match the current filters. Try clearing one of them.
          </p>
        ) : (
          <Table
            caption={`${filteredRows.length} extracted workflow records, by stable ID, name, primary actor, surfaces touched, terminal states, source line, implementation status, and extraction coverage.`}
            columns={WORKFLOW_COLUMNS}
            rows={filteredRows.map(rowToTableRow)}
            emptyState={{
              title: 'There are no workflows recorded yet.',
              whatCreatesIt: 'scripts/build-registries.mjs, run against registries/raw/extract/CHK-*.json.',
            }}
          />
        )}
      </div>
    </main>
  )
}
