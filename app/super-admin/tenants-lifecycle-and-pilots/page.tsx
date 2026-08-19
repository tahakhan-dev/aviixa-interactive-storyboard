import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { TenantsScreen } from './TenantsScreen'

export const metadata: Metadata = { title: `${saModuleById('MOD-SA-09').name} — Super Admin Platform Console` }

// Re-exported so tests/component/sa-tenants.test.tsx can import the screen
// itself: the screen needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { TenantsScreen }

export default function TenantsLifecycleAndPilotsPage() {
  return <TenantsScreen />
}
