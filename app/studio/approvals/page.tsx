import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { ApprovalWorkflowScreen } from './ApprovalWorkflowScreen'

export const metadata: Metadata = {
  title: `${stuModuleById(STU_MODULES, 'MOD-STU-11').name} — ${surfaceById('SURF-STU').name}`,
}

// Re-exported so the covering test can import the screen itself: the screen
// needs `useState`, so it lives in its own `'use client'` file, and a file
// carrying `'use client'` cannot also export `metadata`.
export { ApprovalWorkflowScreen }

export default function ApprovalWorkflowPage() {
  return <ApprovalWorkflowScreen />
}
