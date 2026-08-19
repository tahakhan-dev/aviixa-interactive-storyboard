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

