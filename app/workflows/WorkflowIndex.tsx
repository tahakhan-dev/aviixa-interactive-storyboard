'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Table, StatusPill, Select, Button, type TableColumn, type TableRow } from '@/ui/primitives'
import { loadRegistry, loadReconciliation } from '@/registry/load'
// Imports the PURE schema module (no `node:fs`), not `@/coverage/registry-
// loader` -- this is a client component, and `registry-loader.ts` pulls in
// `readFileSync`, which Turbopack refuses to put in a browser bundle at all
// ("the chunking context does not support external modules (request:
// node:fs)"), reproduced while first building this against the loader.
import { GeneratedRegistrySchema, type RegistryRow } from '@/coverage/registry-schema'
import { COVERAGE_STATUSES } from '@/coverage/descriptors'
import { SURFACES } from '@/domain/surfaces'
import workflowsRaw from '../../registries/generated/workflows.json'
import modulesRaw from '../../registries/generated/modules.json'
import sourceReconciliationRaw from '../../registries/generated/source-reconciliation.json'

/**
 * R4-B07: master prompt §10.5 requires the index to list every workflow with
 * its ID, plain-language name, owning surface and module, initiating and
 * participating roles, primary objects, implementation status and variant
 * coverage summary, filterable by each of those dimensions. Four of the eight
 * shipped. The four below are the missing ones, and they are here whether or
 * not the extraction can fill them: a column rendered as "not extracted" tells
 * a reader the dimension is required and absent, and a dropped column tells
 * them nothing at all.
 */
const NOT_EXTRACTED = 'not extracted'

const WORKFLOW_COLUMNS: readonly TableColumn[] = [
  { key: 'id', header: 'Stable ID' },
  { key: 'name', header: 'Name' },
  { key: 'primaryActor', header: 'Primary actor' },
  { key: 'participatingRoles', header: 'Participating roles' },
  { key: 'surfacesTouched', header: 'Surfaces touched' },
  { key: 'owningModule', header: 'Owning module' },
  { key: 'primaryObjects', header: 'Primary objects' },
  { key: 'terminalStates', header: 'Terminal states' },
  { key: 'variantCoverage', header: 'Variant coverage summary' },
  { key: 'exercisedBy', header: 'Use cases' },
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
// Final review round 2, MAJOR: "81" used to be a bare literal in the prose
// below ("81 is the MODULE count") -- a hardcoded count outside gate 1's
// walk, which only covered app/coverage/. Derived the same way every other
// count on this page already is.
const MODULES = loadRegistry(GeneratedRegistrySchema, modulesRaw, 'modules registry')
// Final review round 3 (non-blocking): "36" (the extraction-chunk count in
// the prose below) was a bare literal too, outside the count gate's walk
// for the same reason 36 is excluded from its derived forbidden-count set
// -- source-reconciliation.json has no `rows` array to read a length from.
// Reads its own `extracted` field instead, through the schema this
// repo already has for the file (`loadReconciliation`).
const SOURCE_RECONCILIATION = loadReconciliation(sourceReconciliationRaw)

const COLLAPSED_ROWS = WORKFLOWS.rows.filter((r) => (r.collapsedFrom ?? 1) > 1)
const ENTRIES_AFFECTED_BY_COLLAPSE = COLLAPSED_ROWS.reduce((sum, r) => sum + (r.collapsedFrom ?? 1), 0)

// Task 11: filter option sets, computed once from the loaded registry. The
// actor list is every distinct `primaryActor` the extraction recorded
// (426 of them) plus a real, stable sentinel for "no primary actor
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

// Final review, MAJOR 1: `surfacesTouched` is free text off the frozen
// source, not always the SURF-* code -- 95 of 724 rows carry only a prose
// surface name (e.g. "Delivery Operations Hub", "Super Admin platform
// console"), verified against the real registry. Matching the code alone
// silently dropped every row whose cell reads exactly that prose name (44
// of them for SURF-DOH) -- worse than a filter that visibly does not work.
// Matches EITHER the code or the surface's own human name,
// case-insensitively (the frozen source's casing is inconsistent, e.g.
// "Super Admin platform console" vs. the canonical "Super Admin Platform
// Console").
//
// Final review round 2, MAJOR: 13 more rows read "all five"/"All five
// surfaces" -- a row that genuinely touches every surface, including the
// one just selected, but matched no single-surface filter at all (the
// same silent-drop defect one level up). "all five" as a case-insensitive
// substring is unambiguous in this registry: verified it never appears
// anywhere except these 13 rows, all meaning the same thing.
function surfaceTouchedMatches(surfacesTouched: readonly string[] | undefined, surfaceId: string): boolean {
  if (!surfacesTouched || surfacesTouched.length === 0) return false
  const surfaceName = SURFACES.find((s) => s.id === surfaceId)?.name.toLowerCase()
  return surfacesTouched.some((s) => {
    const lower = s.toLowerCase()
    if (lower.includes('all five')) return true
    return s.includes(surfaceId) || (surfaceName !== undefined && lower.includes(surfaceName))
  })
}
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

/* ────────────────────────────────────────────────────────────────────────
 * R4-B07 — THE FOUR MISSING §10.5 FILTERS.
 *
 * Every option list below is COMPUTED FROM THE LOADED ROWS plus one
 * "(not extracted)" sentinel, never written down. That is the same shape
 * `NO_ACTOR_VALUE` above already uses and it is what stops these from being
 * dead controls the day the extraction starts carrying a dimension: a module
 * appearing on one row puts it in the list without an edit here, and until
 * one does, the sentinel is a real predicate over a real field rather than an
 * option that matches everything by accident.
 *
 * Master prompt §13 forbids a dead control, so each of the four narrows the
 * table and updates the live "N of M rows match" status line. Where a
 * dimension is uniformly absent today the sentinel selects every row, and the
 * paragraph above the filters says so rather than leaving a reader to work it
 * out from an unchanged table.
 * ──────────────────────────────────────────────────────────────────────── */
const NOT_EXTRACTED_VALUE = '__not-extracted__'

function dimensionOptions(allLabel: string, values: readonly string[]) {
  return [
    { value: '', label: allLabel },
    { value: NOT_EXTRACTED_VALUE, label: '(not extracted)' },
    ...[...new Set(values)].sort().map((v) => ({ value: v, label: v })),
  ]
}

const ROLE_OPTIONS = dimensionOptions(
  'All participating roles',
  WORKFLOWS.rows.flatMap((r) => r.participatingRoles ?? []),
)
const MODULE_OPTIONS = dimensionOptions(
  'All owning modules',
  WORKFLOWS.rows.flatMap((r) => (r.moduleId === undefined ? [] : [r.moduleId])),
)
const OBJECT_OPTIONS = dimensionOptions('All primary objects', [])
const VARIANT_OPTIONS = dimensionOptions('All variant coverage', [])

/** How many rows carry each of the four, measured rather than asserted. */
const ROWS_WITH_ROLES = WORKFLOWS.rows.filter((r) => (r.participatingRoles ?? []).length > 0).length
const ROWS_WITH_MODULE = WORKFLOWS.rows.filter((r) => r.moduleId !== undefined).length
const ROWS_WITH_USE_CASES = WORKFLOWS.rows.filter((r) => (r.exercisedBy ?? []).length > 0).length

/**
 * R4-B08: the Workflows row of the master prompt §9.6 reconciliation table,
 * rendered verbatim rather than transcribed. `/workflows/` published 724 rows
 * from 725 records and the §9.6 table published 644 against Appendix L's 642,
 * and neither number appeared beside the other: `grep -c` for 642, 644 and
 * 118 in the built page returned zero for each. §10.5 requires the index
 * count to reconcile to the §9.6 table, and this sentence is that
 * reconciliation. Read out of the artefact so it cannot drift from it.
 */
function workflowReconciliationRow() {
  const row = SOURCE_RECONCILIATION.reconciliation.reconciliation_rows.find(
    (r) => r.registry_slug === 'workflows',
  )
  if (row === undefined) {
    throw new Error(
      'The source reconciliation report carries no row for the workflows registry. Master ' +
        'prompt §10.5 requires this index to reconcile to the §9.6 table and there is nothing ' +
        'to reconcile against -- refusing to render a count with no reconciliation beside it.',
    )
  }
  return row
}
const WORKFLOW_RECONCILIATION = workflowReconciliationRow()
/** Non-`WF-` rows: storyboard and placeholder passage records keyed by id and line. */
const WF_PREFIXED_ROWS = WORKFLOWS.rows.filter((r) => r.id.startsWith('WF-')).length

function rowToTableRow(r: RegistryRow): TableRow {
  return {
    id: r.id,
    name: r.label ?? '—',
    primaryActor: r.primaryActor ?? '—',
    // R4-B07. Derived from this row's own extracted actor and trigger text
    // against the closed nine-role vocabulary -- roles NAMED IN the
    // extraction, never the source's own role-result mapping, which §10.5
    // also requires and the extraction does not carry.
    participatingRoles:
      (r.participatingRoles ?? []).length > 0 ? r.participatingRoles?.join(', ') : NOT_EXTRACTED,
    surfacesTouched: (r.surfacesTouched ?? []).length > 0 ? r.surfacesTouched?.join(', ') : '—',
    // The three §10.5 dimensions the workflow extraction carries no field for
    // at all. Rendered, never dropped and never synthesised.
    owningModule: r.moduleId ?? NOT_EXTRACTED,
    primaryObjects: NOT_EXTRACTED,
    terminalStates: (r.terminalStates ?? []).length > 0 ? r.terminalStates?.join(', ') : '—',
    variantCoverage: NOT_EXTRACTED,
    exercisedBy: (r.exercisedBy ?? []).length > 0 ? r.exercisedBy?.join(', ') : NOT_EXTRACTED,
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
  // R4-B07: the four §10.5 dimensions the index could not filter by.
  const [role, setRole] = useState('')
  const [owningModule, setOwningModule] = useState('')
  const [primaryObject, setPrimaryObject] = useState('')
  const [variant, setVariant] = useState('')

  const filteredRows = useMemo(() => {
    /** One predicate for all four, so a dimension cannot be filtered a fifth way. */
    const dimensionMatches = (selected: string, values: readonly string[]): boolean => {
      if (selected === '') return true
      if (selected === NOT_EXTRACTED_VALUE) return values.length === 0
      return values.includes(selected)
    }
    return WORKFLOWS.rows.filter((r) => {
      if (surface !== '' && !surfaceTouchedMatches(r.surfacesTouched, surface)) return false
      if (actor === NO_ACTOR_VALUE && r.primaryActor !== undefined) return false
      if (actor !== '' && actor !== NO_ACTOR_VALUE && r.primaryActor !== actor) return false
      if (status !== '' && r.status !== status) return false
      if (!dimensionMatches(role, r.participatingRoles ?? [])) return false
      if (!dimensionMatches(owningModule, r.moduleId === undefined ? [] : [r.moduleId])) return false
      // Primary objects and variant coverage have no field on the row at all,
      // so every row matches "(not extracted)" and none matches a value --
      // which is the honest behaviour, not a broken filter.
      if (!dimensionMatches(primaryObject, [])) return false
      if (!dimensionMatches(variant, [])) return false
      const isCollapsed = (r.collapsedFrom ?? 1) > 1
      if (collapsed === 'collapsed' && !isCollapsed) return false
      if (collapsed === 'not-collapsed' && isCollapsed) return false
      return true
    })
  }, [surface, actor, status, collapsed, role, owningModule, primaryObject, variant])

  const hasActiveFilter =
    surface !== '' ||
    actor !== '' ||
    status !== '' ||
    collapsed !== '' ||
    role !== '' ||
    owningModule !== '' ||
    primaryObject !== '' ||
    variant !== ''

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
        records across the {SOURCE_RECONCILIATION.extracted} extraction chunks, 1 cross-chunk duplicate
        merged, {WORKFLOWS.rows.length} rows below — the frozen source fixes
        no single workflow total anywhere in its 122,241 lines, and {MODULES.rows.length} is the
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
        A row reads &ldquo;demonstrated in storyboard&rdquo; when a shipped
        route screen under <code>app/</code> names that workflow identifier as
        a whole token, and &ldquo;not represented&rdquo; when none does. That is
        a narrower claim than &ldquo;this build demonstrates the workflow&rdquo;:
        a workflow can be fully built and still read not represented if nothing
        has named it on a route yet. THE SENTENCE THAT STOOD HERE SAID NO
        WORKFLOW HAD BEEN DEMONSTRATED AT ALL, AND IT WAS STILL SAYING SO AFTER
        EIGHTY ROWS HAD MOVED. It is replaced by the rule rather than by a
        fresh count, because a count transcribed into prose is what went stale.
      </p>

      {/*
        R4-B08 — THE TWO WORKFLOW COUNTS, EACH NAMING THE OTHER.

        This page publishes a passage-record count and the master prompt §9.6
        reconciliation table publishes an identifier count, and neither cited
        the other: grep for 642, 644 and 118 in the built page returned zero
        for each. §10.5 requires the index count to reconcile to the §9.6
        table. The reconciliation row's own words are rendered rather than
        transcribed, so the two artefacts cannot drift apart.
      */}
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        <strong>How {WORKFLOWS.rows.length} reconciles to the §9.6 table.</strong> They count
        different things. {WORKFLOWS.rows.length} is the size of this extracted, composite-keyed
        PASSAGE-RECORD set — only {WF_PREFIXED_ROWS} of the rows below carry a{' '}
        <code>WF-</code> identifier at all, and the rest are storyboard and placeholder passages
        keyed by id and source line. The <code>WF-*</code> NAMESPACE is a different scope and is
        reconciled in the §9.6 table on the{' '}
        <Link href="/coverage/" className="text-[var(--color-primary)] underline">
          coverage dashboard
        </Link>
        , whose Workflows row reads: {WORKFLOW_RECONCILIATION.extracted_count}{' '}
        {WORKFLOW_RECONCILIATION.delta}
      </p>

      {/*
        R4-B07 — WHICH OF §10.5'S EIGHT DIMENSIONS THIS INDEX CAN ANSWER.
      */}
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        <strong>Four of master prompt §10.5&rsquo;s dimensions, and what fills them.</strong> The
        section requires this index to list and filter by owning surface and module, initiating
        and participating roles, primary objects and a variant coverage summary. The initiating
        role is the &ldquo;Primary actor&rdquo; column: that is the extraction&rsquo;s own field
        name and it is kept rather than renamed, because the cell holds what the source recorded
        about who starts the workflow. Participating
        roles are DERIVED — the canonical nine role names that occur in each row&rsquo;s own
        extracted actor and trigger text, which fills {ROWS_WITH_ROLES} of{' '}
        {WORKFLOWS.rows.length} rows — and they are not the source&rsquo;s role-result mapping,
        which §10.5 also requires and the extraction does not carry. Owning module fills{' '}
        {ROWS_WITH_MODULE} rows: the workflow extraction records no module field, so the column
        reads &ldquo;{NOT_EXTRACTED}&rdquo; rather than being dropped or guessed at. Primary
        objects and variant coverage read the same way and for the same reason — terminal states
        are end states, not §10.5&rsquo;s seven variant classes, and deriving one from the other
        would be this build&rsquo;s opinion in a source-derived column. The use-case column is
        real where it is filled: {ROWS_WITH_USE_CASES} rows carry the use cases the extraction
        recorded, which is §9.2&rsquo;s trace chain, and it was being discarded before this fix.
      </p>

      {/* Reachability by navigation and not only by URL. The storyboard page is
          a sibling route under this one, and a route nothing links to is a page
          only its author can find. */}
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        <Link
          href="/workflows/ai-and-its-absence/"
          className="text-[var(--color-primary)] underline"
        >
          Artificial intelligence and its absence
        </Link>{' '}
        &mdash; section 44A&rsquo;s required artificial-intelligence and fallback storyboards, all
        thirty on one page, each with its five-surface reaction and the audit events its final
        official state is reconstructed from. Not a workflow row: the frozen source names no screen
        that holds them together, so the page is a derived one and states that above the fold.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <Select label="Surface" options={SURFACE_OPTIONS} value={surface} onChange={setSurface} />
        <Select label="Actor" options={ACTOR_OPTIONS} value={actor} onChange={setActor} />
        <Select label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        <Select label="Collapsed" options={COLLAPSED_OPTIONS} value={collapsed} onChange={setCollapsed} />
        <Select label="Participating role" options={ROLE_OPTIONS} value={role} onChange={setRole} />
        <Select label="Owning module" options={MODULE_OPTIONS} value={owningModule} onChange={setOwningModule} />
        <Select label="Primary object" options={OBJECT_OPTIONS} value={primaryObject} onChange={setPrimaryObject} />
        <Select label="Variant coverage" options={VARIANT_OPTIONS} value={variant} onChange={setVariant} />
        <Button
          variant="secondary"
          onClick={() => {
            setSurface('')
            setActor('')
            setStatus('')
            setCollapsed('')
            setRole('')
            setOwningModule('')
            setPrimaryObject('')
            setVariant('')
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
