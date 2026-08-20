import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { CapabilitiesScreen } from './CapabilitiesScreen'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-01')

// The title comes from the module registry, never a second hand-typed string,
// and the route is keyed on the module's slug — never on a screen id (D1).
export const metadata: Metadata = {
  title: `${MODULE.name} — Standards and Operations Studio`,
}

export default function CapabilitiesPage() {
  return <CapabilitiesScreen />
}
