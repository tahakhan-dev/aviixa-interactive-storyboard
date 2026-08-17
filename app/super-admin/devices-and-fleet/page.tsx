import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { DevicesScreen } from './DevicesScreen'

export const metadata: Metadata = { title: saModuleById('MOD-SA-13').name }

// Re-exported so tests/component/sa-devices.test.tsx can import the screen
// itself: the screen needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { DevicesScreen }

export default function DevicesAndFleetPage() {
  return <DevicesScreen />
}
