import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { CreateTenantWizard } from './CreateTenantWizard'

export const metadata: Metadata = { title: `${saModuleById('MOD-SA-09').name} — Super Admin Platform Console` }

// Re-exported so the screen itself stays importable directly — a file
// carrying `'use client'` (required for the wizard's own hooks/state)
// cannot also export `metadata`, the same split every screen in this
// surface uses (`TenantsScreen.tsx`, `TenantDetailScreen.tsx`).
export { CreateTenantWizard }

export default function CreateTenantPage() {
  return <CreateTenantWizard />
}
