import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { REGISTRY_DESCRIPTORS, type RegistryDescriptor } from '@/coverage/descriptors'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'

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

      <div className="mt-6">
        {/*
          This is a review/coverage tool, not a product surface — none of
          the five SurfaceIds is the "true" owner of a cross-cutting index.
          SURF-DOH is picked because it is the tenant system of record for
          authoritative operational registries; STATE-01 never reads this
          value (only STATE-07's Frontline-only guard does), so the choice
          has no behavioural effect today.
        */}
        <ScreenStateBoundary
          state="STATE-01"
          surface="SURF-DOH"
          detail={{
            objectLabel: descriptor.title.toLowerCase(),
            whatCreatesIt: `${descriptor.title} entries are authored as each product surface and module screen is built in slices 3-13, then reconciled against the frozen source. Nothing has created one yet in this storyboard.`,
          }}
        />
      </div>
    </main>
  )
}
