import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { WorkPackageScreen } from './WorkPackageScreen'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-14')

// The title comes from the module registry, never a second hand-typed string,
// and the route is keyed on the module's slug. This module has NO catalogue-B
// screen at all — its view is the storyboard SB-STU-17 (L33905) — so no
// `screenId` is passed and the shell renders the module's own declared
// absence as the annotation instead of a borrowed id (D1).
export const metadata: Metadata = {
  title: `${MODULE.name} — Standards and Operations Studio`,
}

// Re-exported so the covering test can import the screen itself: the screen
// needs `useState`, so it lives in its own `'use client'` file, and a file
// carrying `'use client'` cannot also export `metadata`.
export { WorkPackageScreen }

export default function WorkPackagePage() {
  return <WorkPackageScreen />
}
