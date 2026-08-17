import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { TiersScreen } from './TiersScreen'

// The title comes from the module registry, not a second hand-typed string,
// and the route is keyed on the module's slug — never on `SCR-SA-17` or the
// second scheme's `SCR-SA-14` (D1).
export const metadata: Metadata = { title: `${saModuleById('MOD-SA-11').name} — AVIIXA` }

export default function TiersEntitlementsAndCapsPage() {
  return <TiersScreen />
}
