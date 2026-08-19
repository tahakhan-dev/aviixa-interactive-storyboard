import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { PlatformAuditScreen } from './PlatformAuditScreen'

// The title comes from the module registry, not a second hand-typed string,
// and the route is keyed on the module's slug — never on `SCR-SA-25` or the
// second scheme's `SCR-SA-21` (D1).
export const metadata: Metadata = { title: `${saModuleById('MOD-SA-18').name} — Super Admin Platform Console` }

export default function PlatformAuditPage() {
  return <PlatformAuditScreen />
}
