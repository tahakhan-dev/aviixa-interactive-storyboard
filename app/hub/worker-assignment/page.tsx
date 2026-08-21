import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { WorkerAssignmentScreen } from './WorkerAssignmentScreen'

/**
 * The title names the module rather than reading it from `dohModuleById`,
 * because `MOD-DOH-07` has no `DOH_MODULES` row yet — that one-line
 * registration lives in a file four concurrent wave-1 module tasks share.
 * The name is the canonical one (`registries/generated/modules.json`,
 * §4.1.3), and it becomes a lookup the moment the row lands.
 */
export const metadata: Metadata = {
  title: `Worker Assignment — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-assignment.test.tsx can import the
// screen itself: it needs `useState`, so it lives in its own `'use client'`
// file, and a file carrying `'use client'` cannot also export `metadata`.
export { WorkerAssignmentScreen }

export default function WorkerAssignmentPage() {
  return <WorkerAssignmentScreen />
}
