import type { Metadata } from 'next'
import { Suspense } from 'react'
import { surfaceById } from '@/domain/surfaces'
import { dohModuleById } from '@/surfaces/doh/modules'
import { bg, textColor } from '@/ui/product'
import { WorkerLifecycleScreen } from './WorkerLifecycleScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-04').name} — ${surfaceById('SURF-DOH').name}`,
}

/**
 * Task 4 (unit-02) — this screen now reads a `?worker=<id>` search
 * parameter (`WorkerLifecycleScreen.tsx`'s own comment explains why: the
 * same `output: "export"` constraint `TenantDetailScreen.tsx`'s own
 * `page.tsx` documents for its `?tenant=<id>` deep link). `useSearchParams()`
 * requires a `<Suspense>` boundary under static export — the prerendered
 * shell has no `location`, so the id is only knowable once the client
 * hydrates. The fallback below matches `RequireSession.tsx`'s own loading
 * shape (same tokens), so there is no visible flash between this fallback
 * and the real gate `WorkerLifecycleScreen` shows next.
 */
function WorkerLifecycleRouteFallback() {
  return (
    <div className={`flex min-h-dvh items-center justify-center ${bg('sunken')}`}>
      <p className={`text-sm ${textColor('ink-muted')}`}>Preparing the Delivery Operations Hub…</p>
    </div>
  )
}

// Re-exported so the screen itself stays importable directly — a file
// carrying `'use client'` (required for `useSearchParams`/hooks) cannot
// also export `metadata`, the same split every screen in this surface uses.
export { WorkerLifecycleScreen }

export default function WorkerLifecyclePage() {
  return (
    <Suspense fallback={<WorkerLifecycleRouteFallback />}>
      <WorkerLifecycleScreen />
    </Suspense>
  )
}
