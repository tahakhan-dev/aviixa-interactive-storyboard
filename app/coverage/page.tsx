import type { Metadata } from 'next'
import Link from 'next/link'
import {
  REGISTRY_DESCRIPTORS,
  COVERAGE_STATUSES,
  countByStatus,
  type CoverageStatus,
} from '@/coverage/descriptors'
import { Table, StatusPill, type StatusTone } from '@/ui/primitives'

export const metadata: Metadata = { title: 'Coverage Dashboard' }

const STATUS_TONE: Record<CoverageStatus, StatusTone> = {
  'demonstrated-in-storyboard': 'ok',
  'decision-blocked': 'attention',
  'not-applicable': 'neutral',
  'not-represented': 'stale',
}

// Deliberately no checkmark glyph anywhere in this map: a check reads as
// "done", and this application has no backend to be done with.
const STATUS_ICON: Record<CoverageStatus, string> = {
  'demonstrated-in-storyboard': '◆',
  'decision-blocked': '⏸',
  'not-applicable': '—',
  'not-represented': '○',
}

const STATUS_LABEL: Record<CoverageStatus, string> = {
  'demonstrated-in-storyboard': 'Demonstrated in storyboard',
  'decision-blocked': 'Decision blocked',
  'not-applicable': 'Not applicable',
  'not-represented': 'Not represented',
}

/**
 * Every one of the fourteen registries is `not-represented` today: this
 * build implements the review-shell infrastructure (slice 2b), not the 81
 * module screens that would ever demonstrate a module, workflow, event, or
 * any of the other inventories on a running surface. Slices 3-13 have not
 * run, so the dashboard says that plainly rather than dressing up zero rows
 * as "coming soon".
 */
const REGISTRY_STATUS_ENTRIES: readonly { status: CoverageStatus }[] = REGISTRY_DESCRIPTORS.map(
  () => ({ status: 'not-represented' as const }),
)
const RECONCILIATION_SUMMARY = countByStatus(REGISTRY_STATUS_ENTRIES)

export default function CoveragePage() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>
      <h1 className="mt-2 text-3xl font-semibold">Coverage Dashboard</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Simulated behaviour only. Every row below states what this storyboard
        actually shows today, never what a finished product would show.
      </p>

      <div className="mt-6">
        <Table
          caption="The fourteen source-derived inventories the master prompt names, and this build's honest status against each."
          columns={[
            { key: 'registry', header: 'Registry' },
            { key: 'expected', header: 'Reconciled count' },
            { key: 'status', header: 'Status in this build' },
          ]}
          rows={REGISTRY_DESCRIPTORS.map((d) => ({
            registry: <Link href={`/coverage/${d.slug}/`}>{d.title}</Link>,
            expected:
              d.expectedCount === null
                ? 'No single closed count in the frozen source'
                : `${d.expectedCount}`,
            status: (
              <StatusPill
                tone={STATUS_TONE['not-represented']}
                icon={STATUS_ICON['not-represented']}
                label={STATUS_LABEL['not-represented']}
              />
            ),
          }))}
          emptyState={{
            title: 'No registries defined',
            whatCreatesIt: 'REGISTRY_DESCRIPTORS',
          }}
        />
      </div>

      <h2 className="mt-8 text-xl font-semibold">Reconciliation summary</h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Counted across the fourteen registries above, not across their
        individual entries — the item-level registries themselves belong to
        slices 3-13, which have not run yet.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
        {COVERAGE_STATUSES.map((status) => (
          <li key={status}>
            {STATUS_LABEL[status]}: {RECONCILIATION_SUMMARY[status]} of {REGISTRY_DESCRIPTORS.length}
          </li>
        ))}
      </ul>
    </main>
  )
}
