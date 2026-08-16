import type { Metadata } from 'next'
import Link from 'next/link'
import { Table, type TableColumn, type TableRow } from '@/ui/primitives'
import { loadWorkflowRegistry } from '@/registry/load'
import workflowRegistryRaw from '../../registries/generated/workflow-registry.json'

export const metadata: Metadata = { title: 'Workflow Index' }

const WORKFLOW_COLUMNS: readonly TableColumn[] = [
  { key: 'id', header: 'Stable ID' },
  { key: 'name', header: 'Name' },
  { key: 'primaryActor', header: 'Primary actor' },
  { key: 'surfacesTouched', header: 'Surfaces touched' },
  { key: 'terminalStates', header: 'Terminal states' },
  { key: 'sourceLine', header: 'Source line' },
  { key: 'status', header: 'Implementation status' },
]

/**
 * BLOCKING 2 (final review): this used to be a literal `[]` -- no generated
 * per-workflow registry existed, even though slice 1's extraction
 * (`registries/raw/extract/CHK-*.json`) already held 432 distinct
 * `workflows[]` entries. `scripts/build-workflow-registry.mjs` now produces
 * `registries/generated/workflow-registry.json` from that extraction
 * (committed, deterministic, sorted by id); validated here with the same
 * strict-Zod-on-load discipline every other registry uses (`@/registry/
 * load`'s `loadRegistry`), so a count on this screen and a count anywhere
 * else that reads this file come from the one validated source.
 *
 * ponytail: no per-column filter UI (surface/actor/status/...) sits in
 * front of this yet -- spec §7 asks for one, but the finding that restored
 * these rows didn't, and 432 static rows read fine on one page without it.
 * Add Select-driven filters over `WORKFLOW_COLUMNS` if reviewers actually
 * need to narrow this list.
 */
const WORKFLOW_REGISTRY = loadWorkflowRegistry(workflowRegistryRaw)

const WORKFLOW_ROWS: readonly TableRow[] = WORKFLOW_REGISTRY.map((r) => ({
  id: r.id,
  name: r.name,
  primaryActor: r.primaryActor,
  surfacesTouched: r.surfacesTouched.length > 0 ? r.surfacesTouched.join(', ') : '—',
  terminalStates: r.terminalStates.length > 0 ? r.terminalStates.join(', ') : '—',
  sourceLine: r.sourceLine,
  status: r.status,
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
        Simulated behaviour only. {WORKFLOW_REGISTRY.length} workflow records
        extracted from the frozen source, each with a name and source line —
        the frozen source fixes no single workflow total anywhere in its
        122,241 lines, and 81 is the MODULE count, not a workflow count. This
        index never presents {WORKFLOW_REGISTRY.length} as a workflow total,
        only as the size of this extracted, deduplicated record set.
      </p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        No workflow has been demonstrated in this build yet: every row below
        reads &ldquo;not represented&rdquo; because slices 3-13, which build
        the module screens that would demonstrate one, have not run.
      </p>

      <div className="mt-6 overflow-x-auto">
        <Table
          caption={`${WORKFLOW_REGISTRY.length} extracted workflow records, by stable ID, name, primary actor, surfaces touched, terminal states, source line, and implementation status.`}
          columns={WORKFLOW_COLUMNS}
          rows={WORKFLOW_ROWS}
          emptyState={{
            title: 'There are no workflows recorded yet.',
            whatCreatesIt: 'scripts/build-workflow-registry.mjs, run against registries/raw/extract/CHK-*.json.',
          }}
        />
      </div>
    </main>
  )
}
