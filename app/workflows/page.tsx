import type { Metadata } from 'next'
import { Table, type TableColumn, type TableRow } from '@/ui/primitives'

export const metadata: Metadata = { title: 'Workflow Index' }

const WORKFLOW_COLUMNS: readonly TableColumn[] = [
  { key: 'id', header: 'Stable ID' },
  { key: 'name', header: 'Name' },
  { key: 'surface', header: 'Owning surface' },
  { key: 'module', header: 'Owning module' },
  { key: 'initiatingRole', header: 'Initiating role' },
  { key: 'participatingRoles', header: 'Participating roles' },
  { key: 'primaryObjects', header: 'Primary objects' },
  { key: 'status', header: 'Implementation status' },
  { key: 'variantCoverage', header: 'Variant coverage' },
]

/**
 * No workflow item is represented yet: no generated per-workflow registry
 * exists in this codebase (slices 3-13 haven't run to author one), so this
 * list is honestly empty rather than seeded with invented rows.
 *
 * ponytail: no per-column filter UI (surface/role/status/...) sits in front
 * of this — every filter would operate on a permanently empty list, which
 * is functionless scaffolding ("later can scaffold for itself"). Add
 * Select-driven filters over `WORKFLOW_COLUMNS` once real rows exist.
 */
const WORKFLOW_ROWS: readonly TableRow[] = []

export default function WorkflowIndexPage() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>
      <h1 className="mt-2 text-3xl font-semibold">Workflow Index</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Simulated behaviour only. The frozen source fixes no single workflow
        total anywhere in its 122,241 lines — 81 is the module count, not a
        workflow count, and this index never presents it as one.
      </p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        No workflow entry is represented in this build yet: workflow entries
        are authored as each module screen is built in slices 3-13, then
        reconciled against the frozen source.
      </p>

      <div className="mt-6">
        <Table
          caption="Reconciled workflow entries, by stable ID, owning surface and module, initiating and participating roles, primary objects, implementation status, and variant coverage."
          columns={WORKFLOW_COLUMNS}
          rows={WORKFLOW_ROWS}
          emptyState={{
            title: 'There are no workflows recorded yet.',
            whatCreatesIt:
              'Workflow entries are populated once each module screen is authored in slices 3-13 and reconciled against the frozen source.',
          }}
        />
      </div>
    </main>
  )
}
