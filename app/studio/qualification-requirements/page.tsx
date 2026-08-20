import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { QualificationRequirementsScreen } from './QualificationRequirementsScreen'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-13')

// The title comes from the module registry, never a second hand-typed string,
// and the route is keyed on the module's slug — never on a screen id (D1).
// This module has ONE catalogue-B screen, SCR-STU-10, which the shell renders
// as an annotation.
export const metadata: Metadata = {
  title: `${MODULE.name} — Standards and Operations Studio`,
}

// Re-exported so the covering test can import the screen itself: the screen
// needs `useState`, so it lives in its own `'use client'` file, and a file
// carrying `'use client'` cannot also export `metadata`.
export { QualificationRequirementsScreen }

export default function QualificationRequirementsPage() {
  return <QualificationRequirementsScreen />
}
