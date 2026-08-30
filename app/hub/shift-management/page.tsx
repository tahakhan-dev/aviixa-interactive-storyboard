import type { Metadata } from 'next'
import { Suspense } from 'react'
import { bg, textColor } from '@/ui/product'
import { surfaceById } from '@/domain/surfaces'
import { dohModuleById } from '@/surfaces/doh/modules'
import { ShiftManagementScreen } from './ShiftManagementScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-03').name} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-shifts.test.tsx can import the screen
// itself: the screen needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { ShiftManagementScreen }

/**
 * Task 6 (unit-02) — the Suspense boundary is not decorative, same reasoning
 * as `location-configuration/page.tsx`'s own (Task 1, unit-02):
 * `ShiftManagementScreen` now reads `useSearchParams()` (`?site=<id>`, the
 * cross-link `LocationConfigurationScreen.tsx`'s own Site view sends here),
 * and a statically exported route needs a `<Suspense>` boundary around any
 * component that does — the prerendered shell has no `location`, so the
 * param is only knowable once the client hydrates.
 */
function ShiftManagementRouteFallback() {
  return (
    <div className={`flex min-h-dvh items-center justify-center ${bg('sunken')}`}>
      <p className={`text-sm ${textColor('ink-muted')}`}>Preparing the Delivery Operations Hub…</p>
    </div>
  )
}

export default function ShiftManagementPage() {
  return (
    <Suspense fallback={<ShiftManagementRouteFallback />}>
      <ShiftManagementScreen />
    </Suspense>
  )
}
