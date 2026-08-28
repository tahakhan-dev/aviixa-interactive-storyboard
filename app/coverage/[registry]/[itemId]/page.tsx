import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { REGISTRY_DESCRIPTORS, type RegistrySlug } from '@/coverage/descriptors'
import { allCoverageItemParams, getCoverageIndexRow, idForRouteSegment } from '@/registry/coverage-index'
import { ItemCard } from './ItemCard'

interface ItemParams {
  registry: string
  itemId: string
}

/**
 * Task 18 — one route per row across all fourteen `registries/generated/
 * *.json` files, 5,015 pairs at the time of writing, so the set stays finite
 * and build-time known under `output: 'export'` (§4.2: static export has no
 * fallback render). Same shape as `app/workflows/[workflowId]/page.tsx`'s
 * `generateStaticParams`, over `allCoverageItemParams()`
 * (`src/registry/coverage-index.ts`) instead of one registry's ids.
 */
export function generateStaticParams(): ItemParams[] {
  return allCoverageItemParams().map((p) => ({ ...p }))
}

// Never fall back to on-demand rendering for a pair outside the generated
// set — there is no server at runtime to render one anyway.
export const dynamicParams = false

function descriptorFor(slug: string): (typeof REGISTRY_DESCRIPTORS)[number] | undefined {
  return REGISTRY_DESCRIPTORS.find((d) => d.slug === slug)
}

/**
 * The decoded `[itemId]` segment is a ROUTE SEGMENT
 * (`@/registry/coverage-index#routeSegmentFor`), not always the row's own
 * id — 19 `actionable-controls` rows collide case-insensitively with
 * another row in the same registry and carry a disambiguating suffix in
 * their segment. `idForRouteSegment` reverses that before any row lookup;
 * a segment that resolves to no id falls back to the literal decoded
 * string, which is correct for the other 4,996 rows where segment and id
 * are the same string.
 */
function resolveRow(slug: RegistrySlug, decodedItemId: string) {
  const id = idForRouteSegment(slug, decodedItemId) ?? decodedItemId
  return getCoverageIndexRow(slug, id)
}

/**
 * BOTH PARAMS ARRIVE PERCENT-ENCODED AT RENDER TIME, even though
 * `generateStaticParams` above returns (and the static export correctly
 * writes output files under) the literal decoded pair — the exact Next 16
 * divergence `app/workflows/[workflowId]/page.tsx`'s own header comment
 * found and `AGENTS.md` warns this version's training-data assumptions get
 * wrong. `decodeURIComponent` on every param, every time, before any lookup.
 */
export async function generateMetadata({ params }: { params: Promise<ItemParams> }): Promise<Metadata> {
  const { registry, itemId } = await params
  const slug = decodeURIComponent(registry) as RegistrySlug
  const descriptor = descriptorFor(slug)
  const row = descriptor === undefined ? undefined : resolveRow(slug, decodeURIComponent(itemId))
  return { title: row?.name ?? 'Item not found' }
}

export default async function CoverageItemPage({ params }: { params: Promise<ItemParams> }) {
  const { registry, itemId } = await params
  const slug = decodeURIComponent(registry) as RegistrySlug
  const descriptor = descriptorFor(slug)
  if (descriptor === undefined) notFound()
  const row = resolveRow(slug, decodeURIComponent(itemId))
  if (row === undefined) notFound()
  return <ItemCard descriptor={descriptor} row={row} />
}
