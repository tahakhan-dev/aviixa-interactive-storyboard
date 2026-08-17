import type { Metadata } from 'next'
import { CoreAgentsScreen, MODULE } from './CoreAgentsScreen'

export const metadata: Metadata = { title: `${MODULE.name} — AVIIXA Super Admin` }

export default function CoreAgentsPage() {
  return <CoreAgentsScreen />
}
