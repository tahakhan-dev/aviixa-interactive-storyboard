import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { TrainingLibraryScreen } from './TrainingLibraryScreen'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-08')

// The title comes from the module registry, never a second hand-typed string,
// and the route is keyed on the module's slug — never on a screen id (D1).
// This module has ONE catalogue-B screen, SCR-STU-09, which the shell renders
// as an annotation; catalogue A's SCR-STU-TRAINING is the same screen under a
// second name and mints no route of its own.
export const metadata: Metadata = {
  title: `${MODULE.name} — Standards and Operations Studio`,
}

// Re-exported so the covering test can import the screen itself: the screen
// needs `useState`, so it lives in its own `'use client'` file, and a file
// carrying `'use client'` cannot also export `metadata`.
export { TrainingLibraryScreen }

export default function TrainingLibraryPage() {
  return <TrainingLibraryScreen />
}
