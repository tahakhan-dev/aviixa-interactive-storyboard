import type { Metadata } from 'next'
import { Suspense } from 'react'
import { bg, textColor } from '@/ui/product'
import { saModuleById } from '@/surfaces/sa/modules'
import { TenantDetailScreen } from './TenantDetailScreen'

export const metadata: Metadata = { title: `${saModuleById('MOD-SA-09').name} — Super Admin Platform Console` }

/**
 * Task 6 (unit-01) — the tenant detail object page. Controller ruling
 * (task-6-brief.md's own routing decision, amended before dispatch): this is
 * ONE static route, `/super-admin/tenants-lifecycle-and-pilots/detail/`,
 * that reads the tenant id from a client-side search parameter
 * (`?tenant=<id>`) rather than a dynamic `[tenantId]/` segment.
 *
 * WHY. Under `output: "export"` (`next.config.ts`) a dynamic segment emits
 * one HTML file per id enumerated by `generateStaticParams` and NOTHING
 * else — a tenant Task 5's create wizard adds at runtime has no matching
 * file, and the host answers a real 404 for it. Master prompt §6.2
 * explicitly permits carrying an object dimension on a search parameter
 * instead: the pathname stays statically exportable (this file emits
 * exactly one page, `out/super-admin/tenants-lifecycle-and-pilots/detail/
 * index.html`, for all 29 seeded tenants AND every tenant created in a
 * session), and the class of 404 this build has shipped before (Task 4's
 * own list-row-to-nowhere defect) cannot recur here structurally.
 *
 * THE SUSPENSE BOUNDARY IS NOT DECORATIVE. `TenantDetailScreen` reads
 * `useSearchParams()` (`next/navigation`), and Next.js requires a component
 * that does so to sit under a `<Suspense>` boundary for a statically
 * exported route — the prerendered shell has no `location`, so the id is
 * only knowable once the client hydrates. The fallback below is the exact
 * loading shape `RequireSession.tsx`'s own `Waiting` renders (same tokens),
 * so there is no visible flash between this file's fallback and the real
 * gate `TenantDetailScreen` shows next.
 */
function DetailRouteFallback() {
  return (
    <div className={`flex min-h-dvh items-center justify-center ${bg('sunken')}`}>
      <p className={`text-sm ${textColor('ink-muted')}`}>Preparing the platform console…</p>
    </div>
  )
}

// Re-exported so the screen itself stays importable directly — a file
// carrying `'use client'` (required for `useSearchParams`/hooks) cannot
// also export `metadata`, the same split every screen in this surface uses.
export { TenantDetailScreen }

export default function TenantDetailPage() {
  return (
    <Suspense fallback={<DetailRouteFallback />}>
      <TenantDetailScreen />
    </Suspense>
  )
}
