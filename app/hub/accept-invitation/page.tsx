import type { Metadata } from 'next'
import { Suspense } from 'react'
import { bg, textColor } from '@/ui/product'
import { surfaceById } from '@/domain/surfaces'
import { AcceptInvitationScreen } from './AcceptInvitationScreen'

export const metadata: Metadata = { title: `Accept invitation — ${surfaceById('SURF-DOH').name}` }

/**
 * Task 8 (unit-01) — one static route, `/hub/accept-invitation/`, reading
 * the tenant id from a client-side search parameter (`?tenant=<id>`) rather
 * than a dynamic segment — the same routing ruling Task 6 made for
 * `TenantDetailScreen.tsx` and for the identical reason: under
 * `output: "export"` a dynamic segment emits one file per id
 * `generateStaticParams` enumerates, and a tenant Task 5's wizard creates at
 * runtime has no matching file.
 *
 * THE SUSPENSE BOUNDARY IS NOT DECORATIVE, for the same reason
 * `TenantDetailScreen`'s own route file gives: `AcceptInvitationScreen`
 * reads `useSearchParams()`, which Next.js requires a `<Suspense>` boundary
 * for under static export (the prerendered shell has no `location`). The
 * fallback below is the exact loading shape this screen's own `Waiting`
 * renders (same tokens), so there is no visible flash between the two.
 */
function AcceptInvitationRouteFallback() {
  return (
    <div className={`flex min-h-dvh items-center justify-center ${bg('sunken')}`}>
      <p className={`text-sm ${textColor('ink-muted')}`}>Preparing the platform…</p>
    </div>
  )
}

// Re-exported so the screen stays importable directly — a file carrying
// `'use client'` (required for `useSearchParams`/hooks) cannot also export
// `metadata`, the same split every screen in this build uses.
export { AcceptInvitationScreen }

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<AcceptInvitationRouteFallback />}>
      <AcceptInvitationScreen />
    </Suspense>
  )
}
