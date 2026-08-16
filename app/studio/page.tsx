import { surfaceById } from '@/domain/surfaces'

const SURFACE = surfaceById('SURF-STU')

export default function StudioHome() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        AVIIXA
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{SURFACE.name}</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        {SURFACE.purpose}
      </p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--color-ink)]">
          What this surface owns:{' '}
        </span>
        {SURFACE.ownership}
      </p>
      <p className="mt-6 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation
        storyboard, not a connected production system.
      </p>
    </main>
  )
}
