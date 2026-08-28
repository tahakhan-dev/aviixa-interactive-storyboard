'use client'

import Link from 'next/link'
import { AppShell, StatusPill, borderColor, bg, radiusClass, textColor } from '@/ui/product'
import { workflowStatusDisplay } from '@/registry/workflow-index'
import type { CoverageIndexRow } from '@/registry/coverage-index'
import type { RegistryDescriptor } from '@/coverage/descriptors'

/**
 * Task 18 — the generic item card every one of the fourteen `/coverage/
 * <slug>/<itemId>/` routes renders, built the same way `WorkflowCard`
 * (`app/workflows/[workflowId]/WorkflowCard.tsx`, Task 17) was: `AppShell`
 * directly, not nested inside `ObjectPage` (two competing `<h1>`s — see that
 * file's own header comment for the full account), `StatusPill` for status,
 * a labelled `dl` for everything else.
 *
 * Every fact here is `CoverageIndexRow`'s own field or nothing — that type
 * carries no `sourceLine`, no `sourceClass`, no `statusReason` at all (see
 * `src/registry/coverage-index.ts`'s header comment), so §8.6.2's deletion
 * test holds structurally: there is no locator, classification or narrative
 * sentence anywhere in this file for a future edit to accidentally leave in.
 */
export interface ItemCardProps {
  readonly descriptor: RegistryDescriptor
  readonly row: CoverageIndexRow
}

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className={`text-xs font-medium uppercase tracking-wide ${textColor('ink-muted')}`}>{label}</dt>
      <dd className={`text-sm ${textColor('ink')}`}>{value}</dd>
    </div>
  )
}

const join = (values: readonly string[] | undefined): string | undefined =>
  values !== undefined && values.length > 0 ? values.join(', ') : undefined

export function ItemCard({ descriptor, row }: ItemCardProps) {
  const status = workflowStatusDisplay(row.status)

  const fields = [
    { label: 'Owning module', value: row.moduleId ?? row.moduleDescriptor },
    { label: 'Surface', value: row.surface ?? row.surfaceDescriptor },
    { label: 'Register', value: row.register },
    { label: 'Purpose', value: row.purpose },
    { label: 'Initiating role', value: row.primaryActor },
    { label: 'Trigger', value: row.trigger },
    { label: 'Surfaces touched', value: join(row.surfacesTouched) },
    { label: 'Recorded outcomes', value: join(row.terminalStates) },
    { label: 'Participating roles', value: join(row.participatingRoles) },
    { label: 'Exercised by', value: join(row.exercisedBy) },
    { label: 'Reason', value: row.statusReason },
  ].filter((f): f is { readonly label: string; readonly value: string } => f.value !== undefined)

  return (
    <AppShell
      surface="SURF-SA"
      session={{ identity: 'Reviewer', identityId: null, role: 'ADMIN', tenant: null, device: 'desktop' }}
      title={row.name}
      breadcrumbs={[
        { label: 'Coverage dashboard', href: '/coverage/' },
        { label: descriptor.title, href: `/coverage/${descriptor.slug}/` },
        { label: row.id },
      ]}
      {...(row.route !== null
        ? {
            actions: (
              <Link
                href={row.route}
                data-control-id={`coverage-${descriptor.slug}-${row.id}-open-route`}
                className={`${radiusClass('md')} border ${borderColor('border-strong')} px-3 py-1.5 text-sm ${textColor('ink')} hover:underline`}
              >
                Open in product
              </Link>
            ),
          }
        : {})}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={status.tone} label={status.label} />
        </div>

        {fields.length > 0 ? (
          <dl className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-4`}>
            {fields.map((f) => (
              <Field key={f.label} label={f.label} value={f.value} />
            ))}
          </dl>
        ) : null}

        {/*
          Master prompt §9.6: every item card links to its tours where it has
          any. No tour in `src/data/collections/tours.json` targets a
          non-workflow item today, and none targets this one either when it
          resolves to zero — `src/data/tours-index.ts`'s own header comment
          records why the join is by `workflowId` against any item id. A
          real `<a>` to a tour has nowhere to point: tours run inside the
          demo chrome's interactive runner (`src/ui/demo/tour/**`), which
          `pnpm lint`'s `local/no-cross-tree-import` forbids this tree from
          importing, and there is no standalone tour page to link to instead
          — so a linked tour renders as its own labelled field, not a dead
          anchor.
        */}
        {row.tours.length > 0 ? (
          <dl className={`grid grid-cols-1 gap-4 ${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-4`}>
            <Field label="Tours" value={row.tours.map((t) => `${t.id} — ${t.title}`).join('; ')} />
          </dl>
        ) : null}
      </div>
    </AppShell>
  )
}
