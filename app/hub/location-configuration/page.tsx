import type { Metadata } from 'next'
import { Suspense } from 'react'
import { bg, textColor } from '@/ui/product'
import { dohModuleById } from '@/surfaces/doh/modules'
import { LocationConfigurationScreen } from './LocationConfigurationScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-02').name} — Delivery Operations Hub`,
}

// Re-exported so tests/component/doh-locations.test.tsx can import the screen
// itself: the screen needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { LocationConfigurationScreen }

/**
 * Task 1 (unit-02) — the Suspense boundary is not decorative.
 * `LocationConfigurationScreen` reads `useSearchParams()` (`next/navigation`,
 * `?site=<id>&area=<id>`, this task's own tier state), and a statically
 * exported route needs a `<Suspense>` boundary around any component that
 * does — the prerendered shell has no `location`, so the tier is only
 * knowable once the client hydrates. Same pattern, same fallback text, as
 * `tenants-lifecycle-and-pilots/detail/page.tsx`'s own
 * `DetailRouteFallback` (`RequireSession.tsx`'s own `Waiting` shape) — no
 * visible flash between this fallback and the real gate
 * `LocationConfigurationScreen` shows next.
 */
function LocationConfigRouteFallback() {
  return (
    <div className={`flex min-h-dvh items-center justify-center ${bg('sunken')}`}>
      <p className={`text-sm ${textColor('ink-muted')}`}>Preparing the platform console…</p>
    </div>
  )
}

export default function LocationConfigurationPage() {
  return (
    <Suspense fallback={<LocationConfigRouteFallback />}>
      <LocationConfigurationScreen />
    </Suspense>
  )
}
