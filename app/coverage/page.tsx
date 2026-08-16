import type { Metadata } from 'next'
import Link from 'next/link'
import {
  REGISTRY_DESCRIPTORS,
  COVERAGE_STATUSES,
  countByStatus,
  SOURCE_CLASSES,
  countByClass,
  type CoverageStatus,
} from '@/coverage/descriptors'
import { Table, StatusPill, type StatusTone } from '@/ui/primitives'
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema, loadGeneratedRegistry } from '@/coverage/registry-loader'
import workflowsRaw from '../../registries/generated/workflows.json'

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

const WORKFLOWS = loadRegistry(GeneratedRegistrySchema, workflowsRaw, 'workflows registry')

/**
 * Minor (final review): this used to hardcode every one of the fourteen
 * rows to `'not-represented'` and then run them through `countByStatus` --
 * a tautology dressed up as a computation, since the input was a constant.
 * Now a real per-registry derivation: `workflows` is checked against its
 * actual generated registry (`registries/generated/workflows.json`, 724
 * composite-keyed records -- fix round 1, defect 3: this used to read the
 * retired 432-row `workflow-registry.json`); the other thirteen have no
 * item-level registry yet (slices 3-13 haven't built one), so there is
 * nothing to derive a status FROM, and `'not-represented'` is the honest
 * default rather than a stand-in for a computation that doesn't exist.
 * Today this still evaluates to not-represented for all fourteen -- that is
 * the true state of the build, not a hardcoded assumption -- but it will
 * change the moment any registry actually has a demonstrated row.
 */
function registryStatus(slug: string): CoverageStatus {
  if (slug === 'workflows') {
    return WORKFLOWS.rows.some((r) => r.status !== 'not-represented')
      ? 'demonstrated-in-storyboard'
      : 'not-represented'
  }
  return 'not-represented'
}

const REGISTRY_STATUS_ENTRIES: readonly { status: CoverageStatus }[] = REGISTRY_DESCRIPTORS.map(
  (d) => ({ status: registryStatus(d.slug) }),
)
const RECONCILIATION_SUMMARY = countByStatus(REGISTRY_STATUS_ENTRIES)

/**
 * Task 10 / addendum §5: source-defined and derived are counted from
 * `modules.json`'s own `sourceClass` field on each row -- a STRUCTURED
 * value the build script maps straight from the raw extraction's
 * `classification`, never parsed out of `RegistryDescriptor.sourceNote`
 * prose. This is the one place in the whole build that reads 63 for
 * modules' source-defined count -- everywhere else (the table above,
 * `RegistryDescriptor.expectedCount`) correctly reads 81, the total
 * inventory count; 63 is a narrower, different figure (only the SoW-Fact
 * modules) and must never replace 81 as "the" module count.
 */
const MODULES_CLASS_COUNTS = countByClass(loadGeneratedRegistry('modules').rows)

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
            // Blocking 2 (final review): the Workflow Index (`/workflows/`)
            // is the real, populated index for this registry; `/coverage/
            // workflows/` is a generic per-registry placeholder page that
            // itself now just points here (see app/coverage/[registry]/
            // page.tsx) rather than being a second, permanently-empty page
            // for the same concept. Link straight to the real one.
            registry: (
              <Link href={d.slug === 'workflows' ? '/workflows/' : `/coverage/${d.slug}/`}>
                {d.title}
              </Link>
            ),
            expected:
              d.expectedCount === null
                ? 'No single closed count in the frozen source'
                : `${d.expectedCount}`,
            status: (
              <StatusPill
                tone={STATUS_TONE[registryStatus(d.slug)]}
                icon={STATUS_ICON[registryStatus(d.slug)]}
                label={STATUS_LABEL[registryStatus(d.slug)]}
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

      <h2 className="mt-8 text-xl font-semibold">Source classification</h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Orthogonal to the status above: this says what the frozen source
        itself claims about an item, never what this build did with it. Of
        the 81 modules, 63 are source-defined (SoW Fact) and 18 are derived
        (Derived Clarification, DEC-STUDIO-001) — the 18 Studio modules may
        never be presented as source-backed. No other registry has been
        classified against the source yet.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
        {SOURCE_CLASSES.map((sourceClass) => (
          <li key={sourceClass}>
            {sourceClass}: {MODULES_CLASS_COUNTS.source[sourceClass]} of 81 modules
          </li>
        ))}
      </ul>
    </main>
  )
}
