import type { ReactNode } from 'react'
import Link from 'next/link'
import { surfaceById } from '@/domain/surfaces'
import { SA_BANDS, modulesInBand, type SaModuleDefinition } from '@/surfaces/sa/modules'
import { PrototypeDisclosure } from '@/ui/sa/PrototypeDisclosure'
import { Breadcrumbs } from '@/ui/primitives'

const SURFACE = surfaceById('SURF-SA')

/**
 * The shared chrome every one of the nineteen `MOD-SA-*` module routes
 * renders under (per-module contract item 1: "band and module id shown as
 * an annotation"). Two modes, selected by whether `module` is supplied:
 *
 * - No `module`: the console home / module index — this slice's Task 2
 *   acceptance criterion, all nineteen modules grouped under their two
 *   named bands ("Definition layer" / "Operations layer"), each labelled
 *   V1 (D25 — the split carries no acceptance meaning).
 * - `module` supplied: a single module's own header (name, band-and-id
 *   annotation, purpose, breadcrumb back to the index), for tasks 3-21 to
 *   wrap their own content in.
 *
 * Every module link resolves by `slug`, never by a bare `SCR-SA-NN` number
 * (D1) — module directories under `app/super-admin/<slug>/` are what each
 * later task creates.
 */
/**
 * Routes on this surface that are NOT modules.
 *
 * Measured before this list existed: `app/super-admin/occurrence-detail/` is
 * already reached from `src/surfaces/sa/scheduler/SchedulerScaffold.tsx`, so it
 * is not listed here — a second link would be a second entry point to one
 * screen. The incident console had no inbound link at all, which is what this
 * list exists for.
 *
 * `attribution` is not decoration. The incident console's slug is this build's
 * own — the frozen source carries no URL notation for the surface — and a
 * reader arriving from this index should learn that before the screen loads.
 */
const NON_MODULE_ROUTES = [
  {
    href: '/super-admin/ai-incidents/',
    name: 'Artificial-intelligence incident console',
    storyboard: 'SB-43-351, L91276',
    attribution: 'route slug is a build decision under APP-012, not a source fact',
  },
] as const

export interface SaConsoleShellProps {
  readonly module?: SaModuleDefinition
  readonly children?: ReactNode
}

function ModuleList({ modules }: { readonly modules: readonly SaModuleDefinition[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {modules.map((m) => (
        <li key={m.id} className="flex items-baseline gap-2">
          <Link href={`/super-admin/${m.slug}/`} className="text-[var(--color-primary)] underline">
            {m.name}
          </Link>
          <span className="text-xs text-[var(--color-ink-subtle)]">{m.id}</span>
        </li>
      ))}
    </ul>
  )
}

export function SaConsoleShell({ module, children }: SaConsoleShellProps) {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>

      {module === undefined ? (
        <>
          <h1 className="mt-2 text-3xl font-semibold">{SURFACE.name}</h1>
          <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{SURFACE.purpose}</p>
          <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">What this surface owns: </span>
            {SURFACE.ownership}
          </p>
          <PrototypeDisclosure />

          {SA_BANDS.map((band) => (
            <section key={band.id} className="mt-8">
              <h2 className="text-lg font-semibold">
                {band.name} <span className="font-normal text-[var(--color-ink-subtle)]">— V1</span>
              </h2>
              <ModuleList modules={modulesInBand(band.id)} />
            </section>
          ))}

          {/* THE NON-MODULE ROUTES, LISTED SEPARATELY AND LABELLED.
             *
             * `SA_MODULES` is the module inventory and these routes are not in
             * it — no `MOD-*` identifier claims either screen, so listing them
             * among the modules would file them under an identifier the source
             * never assigns. They are reached from here because a route
             * nothing links to is a route only a URL-typist finds, and this
             * build's rule is that a component reachable from nothing is not
             * shipped.
             *
             * The incident console closes the `console-mount` seam in
             * `src/surfaces/sa/ai-failure-authority.ts`, which named this file
             * as the mount point. Its slug is this build's own: the frozen
             * source carries no URL notation for the surface at all, and the
             * screen says so above the fold. */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold">
              Cross-module screens{' '}
              <span className="font-normal text-[var(--color-ink-subtle)]">
                — not module routes, and no module identifier is minted for them
              </span>
            </h2>
            <ul className="mt-3 space-y-2">
              {NON_MODULE_ROUTES.map((route) => (
                <li key={route.href} className="flex flex-wrap items-baseline gap-2">
                  <Link href={route.href} className="text-[var(--color-primary)] underline">
                    {route.name}
                  </Link>
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    {route.storyboard} · {route.attribution}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <>
          <Breadcrumbs
            items={[
              { label: SURFACE.name, href: '/super-admin/' },
              { label: SA_BANDS.find((b) => b.id === module.band)?.name ?? module.band },
              { label: module.name },
            ]}
          />
          <h1 className="mt-2 text-3xl font-semibold">{module.name}</h1>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            {module.id} · {SA_BANDS.find((b) => b.id === module.band)?.name ?? module.band}
          </p>
          <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{module.purpose}</p>
          <PrototypeDisclosure />
          <div className="mt-6">{children}</div>
        </>
      )}
    </main>
  )
}

