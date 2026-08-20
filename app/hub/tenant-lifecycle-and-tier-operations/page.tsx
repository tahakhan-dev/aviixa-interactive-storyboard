import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { dohModuleById } from '@/surfaces/doh/modules'
import { TenantLifecycleScreen } from './TenantLifecycleScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-01').name} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-tenant-lifecycle.test.tsx can import the
// screen itself: the screen needs `useState`, so it lives in its own
// `'use client'` file, and a file carrying `'use client'` cannot also export
// `metadata`.
export { TenantLifecycleScreen }

export default function TenantLifecycleAndTierOperationsPage() {
  return <TenantLifecycleScreen />
}
