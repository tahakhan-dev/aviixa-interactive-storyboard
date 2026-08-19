import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { AtomRegistryScreen } from './AtomRegistryScreen'

// The title comes from the module registry, not a second hand-typed string,
// and the route is keyed on the module's slug — never on `SCR-SA-02` (D1).
export const metadata: Metadata = { title: `${saModuleById('MOD-SA-02').name} — AVIIXA` }

export default function AtomRegistryPage() {
  return <AtomRegistryScreen />
}
