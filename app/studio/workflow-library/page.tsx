import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { WorkflowLibraryScreen } from './WorkflowLibraryScreen'

export const metadata: Metadata = {
  title: `${stuModuleById(STU_MODULES, 'MOD-STU-03').name} — Standards and Operations Studio`,
}

// Re-exported so the covering test can import the screen itself: the screen
// needs `useState`, so it lives in its own `'use client'` file, and a file
// carrying `'use client'` cannot also export `metadata`. The route is keyed
// on the MOD-STU-03 module slug, never on a screen number (D1).
export { WorkflowLibraryScreen }

export default function WorkflowLibraryPage() {
  return <WorkflowLibraryScreen />
}
