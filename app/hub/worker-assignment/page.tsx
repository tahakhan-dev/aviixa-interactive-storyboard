import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { dohModuleById } from '@/surfaces/doh/modules'
import { WorkerAssignmentScreen } from './WorkerAssignmentScreen'

// The row landed, so this is the lookup the hardcoded name promised to become.
export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-07').name} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-assignment.test.tsx can import the
// screen itself: it needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { WorkerAssignmentScreen }

export default function WorkerAssignmentPage() {
  return <WorkerAssignmentScreen />
}
