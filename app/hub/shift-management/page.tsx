import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { dohModuleById } from '@/surfaces/doh/modules'
import { ShiftManagementScreen } from './ShiftManagementScreen'

export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-03').name} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-shifts.test.tsx can import the screen
// itself: the screen needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { ShiftManagementScreen }

export default function ShiftManagementPage() {
  return <ShiftManagementScreen />
}
