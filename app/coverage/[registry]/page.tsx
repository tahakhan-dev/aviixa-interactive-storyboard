import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { REGISTRY_DESCRIPTORS, type RegistryDescriptor, type RegistrySlug } from '@/coverage/descriptors'
import { loadGeneratedRegistry, type GeneratedRegistry } from '@/coverage/registry-loader'
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

/* ────────────────────────────────────────────────────────────────────────
 * R4-B04 — THE PER-SURFACE, PER-MODULE CENSUS MASTER PROMPT §13.1 REQUIRES.
 *
 * §13.1: "Generate a per-surface, per-module actionable-item census from the
 * `ControlDefinition` registry — counts by surface, module, control type, and
 * implementation status — published in the coverage dashboard, the Section
 * 9.6 registry indexes, and the review package."
 *
 * Before this the census had nothing to compute itself from: `moduleId` was
 * present on 0 of the 630 actionable-control rows and `surface` was the
 * extraction's raw free text, absent on 22 and prose on 15. The generator was
 * discarding a `module_id` the raw extraction carries on 653 of its 759
 * control entries.
 *
 * THREE OF THE FOUR DIMENSIONS ARE COUNTED HERE. The fourth, control type, is
 * not, and the registry's own `dedupRule` above states why in the artefact
 * rather than only here: the frozen source classifies none of these controls
 * against §13.1's two dozen control kinds, and a type column would be this
 * build's taxonomy printed inside a source-derived census. The reconciliation
 * row for this inventory carries that as its delta.
 *
 * GENERIC, NOT SPECIAL-CASED ON A SLUG. Any registry whose rows carry a
 * surface or a module gets these tables; a registry whose rows carry neither
 * renders nothing here rather than an empty section. Today that is
 * actionable-controls and modules.
 * ──────────────────────────────────────────────────────────────────────── */
function tallyBy(
  rows: readonly { readonly status: string }[],
  key: (r: { readonly [k: string]: unknown }) => string | undefined,
): readonly { group: string; total: number; demonstrated: number; notRepresented: number; other: number }[] {
  const groups = new Map<string, { total: number; demonstrated: number; notRepresented: number; other: number }>()
  for (const row of rows) {
    const group = key(row as unknown as { readonly [k: string]: unknown })
    if (group === undefined) continue
    const bucket = groups.get(group) ?? { total: 0, demonstrated: 0, notRepresented: 0, other: 0 }
    bucket.total += 1
    if (row.status === 'demonstrated-in-storyboard') bucket.demonstrated += 1
    else if (row.status === 'not-represented') bucket.notRepresented += 1
    else bucket.other += 1
    groups.set(group, bucket)
  }
  return [...groups.entries()]
    .map(([group, b]) => ({ group, ...b }))
    .sort((a, b) => (a.group < b.group ? -1 : 1))
}

function CensusByDimension({ registry }: { registry: GeneratedRegistry }) {
  const bySurface = tallyBy(registry.rows, (r) => r['surface'] as string | undefined)
  const byModule = tallyBy(registry.rows, (r) =>
    (r['moduleId'] as string | undefined) ?? (r['moduleDescriptor'] as string | undefined),
  )
  if (bySurface.length === 0 && byModule.length === 0) return null

  const noSurface = registry.rows.filter((r) => r.surface === undefined).length
  const noModule = registry.rows.filter(
    (r) => r.moduleId === undefined && r.moduleDescriptor === undefined,
  ).length

  const columns: readonly TableColumn[] = [
    { key: 'group', header: 'Group' },
    { key: 'total', header: 'Rows' },
    { key: 'demonstrated', header: 'Demonstrated' },
    { key: 'other', header: 'Mounted, not applicable or decision blocked' },
    { key: 'notRepresented', header: 'Not represented' },
  ]
  const toRows = (t: ReturnType<typeof tallyBy>): readonly TableRow[] =>
    t.map((g) => ({
      group: g.group,
      total: g.total,
      demonstrated: g.demonstrated,
      other: g.other,
      notRepresented: g.notRepresented,
    }))

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold">Census by surface and by module</h2>
      <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
        Master prompt section 13.1 requires this inventory counted by surface, by module, by
        control type and by implementation status. Three of the four are below.{' '}
        {noSurface > 0
          ? `${noSurface} of ${registry.rows.length} rows record no surface. `
          : 'Every row records a surface. '}
        {noModule > 0
          ? `${noModule} record no module, and a module cell the extraction wrote in prose, or that names several modules at once, is shown as that text rather than guessed into a canonical identifier. `
          : 'Every row records a module. '}
        <strong>Control type is counted nowhere and that is not an omission:</strong> the frozen
        source classifies none of these controls by type, so a type column would be this
        build&rsquo;s own taxonomy inside a source-derived census. The reconciliation row for this
        inventory on the coverage dashboard carries it as the delta.
      </p>
      {bySurface.length > 0 ? (
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Census by surface, scrollable horizontally">
          <Table
            caption={`${bySurface.length} surface groups, with rows, demonstrated, other terminal statuses and not-represented counts.`}
            columns={columns}
            rows={toRows(bySurface)}
            emptyState={{ title: 'No surface recorded on any row', whatCreatesIt: 'scripts/build-registries.mjs' }}
          />
        </div>
      ) : null}
      {byModule.length > 0 ? (
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Census by module, scrollable horizontally">
          <Table
            caption={`${byModule.length} module groups, with rows, demonstrated, other terminal statuses and not-represented counts.`}
            columns={columns}
            rows={toRows(byModule)}
            emptyState={{ title: 'No module recorded on any row', whatCreatesIt: 'scripts/build-registries.mjs' }}
          />
        </div>
      ) : null}
    </div>
  )
}

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
    /*
      R4-B10: the id is a LINK to the screen whose evidence set this row's
      status, wherever the generator resolved one. Fourteen index screens
      rendered 5,018 rows with zero in-row links before this, so a reader
      shown "demonstrated in storyboard" had nowhere to go and check.

      A row with no resolved route renders as plain text with the reason,
      never as a link to nowhere — master prompt §13 forbids a control that
      does nothing, and a dead link is one. No dynamic segment was added:
      master prompt §4.2 requires a finite build-time route inventory and
      `tests/coverage/static-export.test.ts` refuses a second one.
    */
    id:
      r.route === undefined ? (
        r.id
      ) : (
        <Link href={r.route} className="text-[var(--color-primary)] underline">
          {r.id}
        </Link>
      ),
    name: r.label ?? '—',
    joinedTo: [r.moduleId, r.moduleDescriptor, r.surface, r.register].filter(Boolean).join(' · ') || '—',
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
        /*
          R4-B09: THIS SENTENCE NAMED A NUMBER THAT IS NOT WHAT IS LISTED
          BELOW. It printed `rawCount`, the raw extraction-key count, and
          said "are listed below" about it. On two of the ten registries that
          take this branch the two figures differ — notifications printed 205
          against 286 rendered rows, scheduled-work 67 against 90 — because
          both add rows from transcribed registers the raw key count never
          saw, which `dedupRule` states correctly two paragraphs down.

          `registry.rows.length` is what is listed below, so that is what the
          sentence prints. `rawCount` is unchanged and stays where it is
          explained.
        */
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          The frozen source fixes no single total for this inventory; {registry.rows.length}{' '}
          records are listed below, from {registry.rawCount} raw extraction keys.
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
        reader: across the fourteen inventories, far more rows are named
        somewhere in the build than any route screen demonstrates. THE PAIR OF
        NUMBERS THAT STOOD HERE IS GONE RATHER THAN CORRECTED. It was
        renumbered twice and was wrong a third time, and a build-wide figure
        transcribed into a comment cannot be anything else. Measure it: it is
        the sum of the
        `demonstrated-in-storyboard` rows and of `namedInSourceCount` over the
        fourteen `registries/generated/*.json`, which `pnpm build:registries`
        rewrites. This inventory's own pair is printed here so the gap is
        visible rather than inferred — offline scenarios read 0 demonstrated
        against 70 named, because two tasks transcribed all seventy use cases
        and no route spells a UC-OFF-* identifier.

        NOTE FOR THE NEXT READER: this block is a JSX comment and renders
        nowhere. The paragraph below it is what a client sees, and it prints
        this registry's own live pair rather than any total written here.
      */}
      <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
        {demonstrated} of {registry.rows.length} rows are demonstrated by a shipped screen;{' '}
        {registry.namedInSourceCount} are named somewhere in the build.{' '}
        {registry.namedInSourceMeaning}
      </p>
      {/*
        R4-B10: the resolvable fraction, said rather than left to be counted
        off a column of em dashes.
      */}
      <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
        {registry.routeResolvedCount} of {registry.rows.length} rows link to the screen that
        demonstrates them. {registry.routeMeaning}
      </p>
      {registry.dedupRule !== null ? (
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">{registry.dedupRule}</p>
      ) : null}
      <CensusByDimension registry={registry} />
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
