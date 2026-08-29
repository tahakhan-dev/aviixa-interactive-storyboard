import type { Metadata } from 'next'
import { Suspense } from 'react'
import { bg, textColor } from '@/ui/product'
import { surfaceById } from '@/domain/surfaces'
import { DevicesScreen } from './DevicesScreen'

// No module id in this title, deliberately: this screen group claims no
// module (D5) and its identifier appears in neither screen catalogue (D4) —
// reconfirmed against the current registry in `DevicesScreen.tsx`'s own
// header comment, Task 5 (unit-02).
export const metadata: Metadata = {
  title: `Devices — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so the screen itself stays importable directly — a file
// carrying `'use client'` (required for hooks) cannot also export
// `metadata`, the same split every screen in this surface uses.
export { DevicesScreen }

/**
 * Task 6 (unit-02) — the Suspense boundary is not decorative, same reasoning
 * as `location-configuration/page.tsx`'s own (Task 1, unit-02):
 * `DevicesScreen` now reads `useSearchParams()` (`?locations=<ids>`, the
 * cross-link `WorkerLifecycleScreen.tsx`'s own Worker detail sends here),
 * and a statically exported route needs a `<Suspense>` boundary around any
 * component that does — the prerendered shell has no `location`, so the
 * param is only knowable once the client hydrates.
 */
function DevicesRouteFallback() {
  return (
    <div className={`flex min-h-dvh items-center justify-center ${bg('sunken')}`}>
      <p className={`text-sm ${textColor('ink-muted')}`}>Preparing the Delivery Operations Hub…</p>
    </div>
  )
}

export default function DevicesPage() {
  return (
    <Suspense fallback={<DevicesRouteFallback />}>
      <DevicesScreen />
    </Suspense>
  )
}
