import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { NotificationsScreen } from './NotificationsScreen'

const MODULE = saModuleById('MOD-SA-14')

// The title is built from the module registry, never a second hand-typed
// string, and never from a `SCR-SA-NN` number (D1). The directory name is
// the registry's own `slug`, which is what `SaConsoleShell` links to.
export const metadata: Metadata = { title: `${MODULE.name} — Super Admin Platform Console` }

export default function NotificationsPage() {
  return <NotificationsScreen />
}
