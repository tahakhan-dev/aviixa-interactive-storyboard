import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { REGISTRY_DESCRIPTORS, type RegistryDescriptor, type RegistrySlug } from '@/coverage/descriptors'
import { loadGeneratedRegistry } from '@/coverage/registry-loader'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { Table, type TableColumn, type TableRow } from '@/ui/primitives'

interface RegistryParams {
  registry: string
}

/**
 * Exactly the fourteen slugs `REGISTRY_DESCRIPTORS` names, so the route
 * census stays finite and build-time-known under `output: 'export'`.
 */
export function generateStaticParams(): RegistryParams[] {
  return REGISTRY_DESCRIPTORS.map((d) => ({ registry: d.slug }))
}

// Never fall back to on-demand rendering for a slug outside the fourteen —
// there is no server at runtime to render one anyway.
export const dynamicParams = false

function descriptorFor(slug: string): RegistryDescriptor | undefined {
  return REGISTRY_DESCRIPTORS.find((d) => d.slug === slug)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RegistryParams>
}): Promise<Metadata> {
  const { registry } = await params
  const descriptor = descriptorFor(registry)
  return { title: descriptor?.title ?? 'Registry not found' }
}

const ROW_COLUMNS: readonly TableColumn[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  // Addendum §3: FUNC-/FEAT-/SUB- rows carry `moduleId` or `surface` from
  // the band/surface join; ai-storyboards/actionable-controls rows carry
  // `register` naming which sub-inventory they belong to. One generic
  // column surfaces whichever of the two a row actually has, per row,
  // rather than adding fourteen bespoke column sets.
  { key: 'joinedTo', header: 'Joined to / register' },
  { key: 'sourceLine', header: 'Source line' },
  { key: 'status', header: 'Status' },
]

/**
 * Task 9: the generic registry index, shared by all fourteen
 * `/coverage/<slug>/` routes. A plain, synchronous function component (not
 * `async`) so it can be rendered directly in a component test without
 * awaiting a Server Component — `loadGeneratedRegistry` is itself
 * synchronous (`readFileSync`), so nothing here needs `await` either.
 *
 * Renders every row with its id, name (label/register, whichever the row
 * carries — the seven nameless families carry neither and get an em dash),
 * the join/register disclosure, source line and status; the count header
 * states `countedThing` beside the figure, shows both `rawCount` and
 * `reconciledCount` with `dedupRule` whenever they differ, and says
 * plainly when `sourceFixesNoTotal` rather than presenting a total that
 * does not exist.
 */
export function RegistryIndex({ slug }: { slug: RegistrySlug }) {
  const descriptor = descriptorFor(slug)
  if (descriptor === undefined) return null
  const registry = loadGeneratedRegistry(slug)

  if (registry.rows.length === 0) {
    return (
      <ScreenStateBoundary
        state="STATE-01"
        surface="SURF-DOH"
        detail={{
          objectLabel: descriptor.title.toLowerCase(),
          whatCreatesIt: `${descriptor.title} entries are authored as each product surface and module screen is built in slices 3-13, then reconciled against the frozen source. Nothing has created one yet in this storyboard.`,
        }}
      />
    )
  }

  const rows: readonly TableRow[] = registry.rows.map((r) => ({
    id: r.id,
    name: r.label ?? '—',
    joinedTo: r.moduleId ?? r.surface ?? r.register ?? '—',
    sourceLine: r.sourceLine,
    status: r.status,
  }))

  const demonstrated = registry.rows.filter(
    (r) => r.status === 'demonstrated-in-storyboard',
  ).length

  return (
    <div>
      <p className="max-w-prose text-[var(--color-ink-muted)]">{registry.countedThing}</p>
      {registry.sourceFixesNoTotal ? (
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          The frozen source fixes no single total for this inventory; {registry.rawCount}{' '}
          extracted records are listed below.
        </p>
      ) : (
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          Reconciled count: {registry.reconciledCount}. Raw extracted count: {registry.rawCount}.
        </p>
      )}
      {/*
        TWO NUMBERS, BECAUSE ONE READS AS THE WHOLE TRUTH.

        The status column says whether a ROUTE SCREEN demonstrates a row. That
        is the right question for a status and an incomplete answer for a
        reader: measured across the fourteen inventories, 237 rows read
        demonstrated and 663 are named somewhere in the build. This inventory's
        own pair is printed here so the gap is visible rather than inferred —
        offline scenarios read 0 demonstrated against 70 named, because two
        tasks transcribed all seventy use cases and no route spells a UC-OFF-*
        identifier.
      */}
      <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
        {demonstrated} of {registry.rows.length} rows are demonstrated by a shipped screen;{' '}
        {registry.namedInSourceCount} are named somewhere in the build.{' '}
        {registry.namedInSourceMeaning}
      </p>
      {registry.dedupRule !== null ? (
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">{registry.dedupRule}</p>
      ) : null}
      <div className="mt-6 overflow-x-auto" tabIndex={0} role="region" aria-label={`${descriptor.title} table, scrollable horizontally`}>
        <Table
          caption={`${registry.rows.length} rows in the ${descriptor.title} index, by id, name, join/register, source line and status.`}
          columns={ROW_COLUMNS}
          rows={rows}
          emptyState={{
            title: `There are no ${descriptor.title.toLowerCase()} yet.`,
            whatCreatesIt: 'scripts/build-registries.mjs, run against registries/raw/.',
          }}
        />
      </div>
    </div>
  )
}

export default async function RegistryIndexPage({
  params,
}: {
  params: Promise<RegistryParams>
}) {
  const { registry } = await params
  const descriptor = descriptorFor(registry)
  if (!descriptor) notFound()

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm">
        <Link href="/coverage/" className="text-[var(--color-primary)] underline">
          Coverage dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{descriptor.title}</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{descriptor.sourceNote}</p>

      {descriptor.slug === 'workflows' ? (
        // Blocking 2 (final review): this used to render the same
        // permanently-empty ScreenStateBoundary every other not-yet-built
        // registry did -- a second empty page for a concept the real
        // Workflow Index (`/workflows/`) already populates. Task 9 now
        // renders the real rows here too (no registry is empty anymore),
        // but the richer, filterable view (Task 11) still lives at
        // `/workflows/`, so this page keeps pointing there rather than
        // pretending to be the primary place to read this registry.
        <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
          The richer, filterable Workflow Index lives at{' '}
          <Link href="/workflows/" className="text-[var(--color-primary)] underline">
            /workflows/
          </Link>
          . The same {loadGeneratedRegistry('workflows').rows.length} rows also render below.
        </p>
      ) : null}

      <div className="mt-6">
        <RegistryIndex slug={descriptor.slug} />
      </div>
    </main>
  )
}
