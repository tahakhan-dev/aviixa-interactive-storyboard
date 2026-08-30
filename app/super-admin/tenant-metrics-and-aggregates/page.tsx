import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { TenantMetricsScreen } from './TenantMetricsScreen'

const MODULE = saModuleById('MOD-SA-10')

// The title is built from the module registry, never a second hand-typed
// string, and never from a `SCR-SA-NN` number (D1).
export const metadata: Metadata = { title: `${MODULE.name} — Super Admin Platform Console` }

export default function TenantMetricsPage() {
  return <TenantMetricsScreen />
}
