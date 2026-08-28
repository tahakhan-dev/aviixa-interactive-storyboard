'use client'

import Link from 'next/link'
import { AppShell, StatTile, StatusPill, bg, borderColor, radiusClass, textColor } from '@/ui/product'
import { workflowStatusDisplay, type WorkflowIndexRow } from '@/registry/workflow-index'

/**
 * Task 17 — the workflow object page. Every fact here is a labelled field
 * or a stat, never a locator, a source classification or a narrative
 * sentence (§8.6.2's deletion test): `WorkflowIndexRow` (the only type this
 * component reads) carries no `sourceLine` field at all, so there is
 * nothing here that could render one even by accident.
 *
 * BUILT ON `AppShell` DIRECTLY, NOT NESTED INSIDE `ObjectPage`. `ObjectPage`
 * (Task 12) bundles its own `PageHeader` — a second `<h1>` and a second
 * breadcrumb trail rendered underneath `AppShell`'s own — and `AppShell`
 * (Task 9) always renders one itself with no way to suppress it. Nesting
 * both is a real defect (two `<h1>`s, two competing focus-on-mount effects
 * fighting for the same page, exactly the class of bug PageHeader's own
 * header comment names), not a stylistic choice, and neither component
 * offers an escape hatch for the other today — this is the first screen to
 * mount `AppShell` at all, so no prior task had to resolve it. A workflow
 * row's facts fit one scrollable section without tabs, so this uses
 * `StatusPill`/`StatTile` (both already token-built, Task 12) directly
 * under `AppShell`'s single header rather than reaching for `ObjectPage`'s
 * tab shell where nothing here needs tabbing.
 *
 * NO TOURS SECTION, AND NO `WatchButton` IMPORT — see
 * `app/workflows/WorkflowIndex.tsx`'s header comment for why: `pnpm lint`
 * forbids any file outside `src/ui/demo/**` (`app/layout.tsx`'s own narrow
 * carve-out excepted) from importing that tree, `WatchButton` could not
 * render usably here even if it were allowed (its tour-runner context is
 * provided only inside `DemoChrome`'s own subtree, which is a sibling of
 * page content, never an ancestor of it), and
 * `@/registry/workflow-index`'s own header comment records why tours are
 * not joined into `WorkflowIndexRow` at all.
 */
export interface WorkflowCardProps {
  readonly row: WorkflowIndexRow
}

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className={`text-xs font-medium uppercase tracking-wide ${textColor('ink-muted')}`}>{label}</dt>
      <dd className={`text-sm ${textColor('ink')}`}>{value}</dd>
    </div>
  )
}

const EMPTY = '—'
const join = (values: readonly string[]): string => (values.length > 0 ? values.join(', ') : EMPTY)

export function WorkflowCard({ row }: WorkflowCardProps) {
  const status = workflowStatusDisplay(row.status)

  return (
    <AppShell
      surface="SURF-SA"
      session={{ identity: 'Reviewer', identityId: null, role: 'ADMIN', tenant: null, device: 'desktop' }}
      title={row.name}
      breadcrumbs={[{ label: 'Workflow Index', href: '/workflows/' }, { label: row.id }]}
      {...(row.route !== null
        ? {
            actions: (
              <Link
                href={row.route}
                data-control-id={`workflow-${row.id}-open-route`}
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
          <span className={`text-sm ${textColor('ink-muted')}`}>{row.variantSummary}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            controlId={`workflow-${row.id}-stat-roles`}
            label="Participating roles"
            data={{ kind: 'value', value: row.participatingRoles.length }}
          />
          <StatTile
            controlId={`workflow-${row.id}-stat-objects`}
            label="Primary objects"
            data={{ kind: 'value', value: row.primaryObjects.length }}
          />
          <StatTile
            controlId={`workflow-${row.id}-stat-outcomes`}
            label="Recorded outcomes"
            data={{ kind: 'value', value: row.terminalStates.length }}
          />
        </div>

        <dl className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-4`}>
          <Field label="Initiating role" value={row.primaryActor ?? EMPTY} />
          <Field label="Participating roles" value={join(row.participatingRoles)} />
          <Field label="Owning surface" value={join(row.surfaceNames)} />
          <Field label="Owning module" value={row.moduleLabel ?? EMPTY} />
          <Field label="Primary objects" value={join(row.primaryObjects)} />
          <Field label="Trigger" value={row.trigger ?? EMPTY} />
          <Field label="Recorded outcomes" value={join(row.terminalStates)} />
        </dl>
      </div>
    </AppShell>
  )
}
