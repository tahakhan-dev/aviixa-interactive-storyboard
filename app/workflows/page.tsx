import type { Metadata } from 'next'
import Link from 'next/link'
import { Table, StatusPill, type TableColumn, type TableRow } from '@/ui/primitives'
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema } from '@/coverage/registry-loader'
import workflowsRaw from '../../registries/generated/workflows.json'

export const metadata: Metadata = { title: 'Workflow Index' }

const WORKFLOW_COLUMNS: readonly TableColumn[] = [
  { key: 'id', header: 'Stable ID' },
  { key: 'name', header: 'Name' },
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
 *
 * ponytail: no per-column filter UI (surface/actor/status/...) sits in
 * front of this yet -- spec §7 asks for one, but 724 static rows still
 * read fine on one page without it. Add Select-driven filters over
 * `WORKFLOW_COLUMNS` if reviewers actually need to narrow this list.
 */
const WORKFLOWS = loadRegistry(GeneratedRegistrySchema, workflowsRaw, 'workflows registry')

const COLLAPSED_ROWS = WORKFLOWS.rows.filter((r) => (r.collapsedFrom ?? 1) > 1)
const ENTRIES_AFFECTED_BY_COLLAPSE = COLLAPSED_ROWS.reduce((sum, r) => sum + (r.collapsedFrom ?? 1), 0)

const WORKFLOW_ROWS: readonly TableRow[] = WORKFLOWS.rows.map((r) => ({
  id: r.id,
  name: r.label ?? '—',
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
}))

export default function WorkflowIndexPage() {
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

      <div
        className="mt-6 overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Workflow registry table, scrollable horizontally"
      >
        <Table
          caption={`${WORKFLOWS.rows.length} extracted workflow records, by stable ID, name, source line, implementation status, and extraction coverage.`}
          columns={WORKFLOW_COLUMNS}
          rows={WORKFLOW_ROWS}
          emptyState={{
            title: 'There are no workflows recorded yet.',
            whatCreatesIt: 'scripts/build-registries.mjs, run against registries/raw/extract/CHK-*.json.',
          }}
        />
      </div>
    </main>
  )
}
