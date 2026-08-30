import type { Metadata } from 'next'
import { Suspense } from 'react'
import { bg, textColor } from '@/ui/product'
import { dohModuleById } from '@/surfaces/doh/modules'
import { PermissionsScreen } from './PermissionsScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-09').name} — Delivery Operations Hub`,
}

// Re-exported so tests/component/doh-permissions.test.tsx can import the
// screen itself: the screen needs `useState`, so it lives in its own
// `'use client'` file, and a file carrying `'use client'` cannot also export
// `metadata`. The route is keyed on the MOD-DOH-09 module slug, never on a
// screen number (D1).
export { PermissionsScreen }

/**
 * Task 3 (unit-02) — the Suspense boundary is not decorative, same reasoning
 * as `location-configuration/page.tsx`'s own (Task 1, unit-02):
 * `PermissionsScreen` reads `useSearchParams()` (`?assign=<userId>`, this
 * task's own cross-tenant deep link), and a statically exported route needs
 * a `<Suspense>` boundary around any component that does — the prerendered
 * shell has no `location`, so the param is only knowable once the client
 * hydrates. Same fallback shape as that file's own
 * `LocationConfigRouteFallback`.
 */
function PermissionsRouteFallback() {
  return (
    <div className={`flex min-h-dvh items-center justify-center ${bg('sunken')}`}>
      <p className={`text-sm ${textColor('ink-muted')}`}>Preparing the platform console…</p>
    </div>
  )
}

export default function PermissionsPage() {
  return (
    <Suspense fallback={<PermissionsRouteFallback />}>
      <PermissionsScreen />
    </Suspense>
  )
}
