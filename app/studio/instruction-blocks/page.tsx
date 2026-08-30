import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { InstructionBlocksScreen } from './InstructionBlocksScreen'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-06')

// The title comes from the module registry, never a second hand-typed
// string, and the route is keyed on the module's slug — never on a screen id
// (D1). This module has one catalogue-B screen, SCR-STU-05, so the shell is
// given it explicitly.
export const metadata: Metadata = {
  title: `${MODULE.name} — Standards and Operations Studio`,
}

// Re-exported so the covering test can import the screen itself: the screen
// needs `useState`, so it lives in its own `'use client'` file, and a file
// carrying `'use client'` cannot also export `metadata`.
export { InstructionBlocksScreen }

export default function InstructionBlocksPage() {
  return <InstructionBlocksScreen />
}
