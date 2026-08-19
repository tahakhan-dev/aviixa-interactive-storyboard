import type { Metadata } from 'next'
import { CoreAgentsScreen, MODULE } from './CoreAgentsScreen'

export const metadata: Metadata = { title: `${MODULE.name} — Super Admin Platform Console` }

export default function CoreAgentsPage() {
  return <CoreAgentsScreen />
}
