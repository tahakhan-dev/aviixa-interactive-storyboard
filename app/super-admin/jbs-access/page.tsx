import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { JbsAccessScreen } from './JbsAccessScreen'

// The title comes from the module registry, not a second hand-typed string,
// and the route is keyed on the module's slug — never on `SCR-SA-23` (D1).
export const metadata: Metadata = { title: `${saModuleById('MOD-SA-16').name} — Super Admin Platform Console` }

export default function JbsAccessPage() {
  return <JbsAccessScreen />
}
