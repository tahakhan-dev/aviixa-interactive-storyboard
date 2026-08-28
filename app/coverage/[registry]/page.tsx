import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { REGISTRY_DESCRIPTORS, type RegistryDescriptor, type RegistrySlug } from '@/coverage/descriptors'
import { RegistryIndexScreen } from './RegistryIndexScreen'

interface RegistryParams {
  registry: string
}

/**
 * Task 18 — this route replaces the earlier `RegistryIndex`/
 * `CensusByDimension` document-style rendering (count-header prose, dedup-
 * rule prose, a `sourceLine` locator column, routeless-reason sentences)
 * with `RegistryIndexScreen`, the product-kit index every one of the
 * fourteen registries shares — §8.6.2 forbids exactly the prose and locator
 * content the earlier version rendered as page content. See
 * `RegistryIndexScreen.tsx`'s own header comment and task-18-report.md for
 * the tests that asserted the old rendering and were deleted under APP-017
 * as a result.
 *
 * Exactly the fourteen slugs `REGISTRY_DESCRIPTORS` names, so the route
 * census stays finite and build-time known under `output: 'export'`.
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

/**
 * `params.registry` arrives percent-encoded at render time even though
 * `generateStaticParams` above returns the literal decoded slug — see
 * `app/workflows/[workflowId]/page.tsx`'s header comment for the Next 16
 * divergence this guards. The fourteen slugs are plain ASCII with no
 * character `encodeURIComponent` would touch, so this is a defensive no-op
 * today, applied uniformly rather than left as a special case to remember.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<RegistryParams>
}): Promise<Metadata> {
  const { registry } = await params
  const descriptor = descriptorFor(decodeURIComponent(registry))
  return { title: descriptor?.title ?? 'Registry not found' }
}

export default async function RegistryIndexPage({
  params,
}: {
  params: Promise<RegistryParams>
}) {
  const { registry } = await params
  const descriptor = descriptorFor(decodeURIComponent(registry))
  if (!descriptor) notFound()

  return <RegistryIndexScreen slug={descriptor.slug as RegistrySlug} />
}
