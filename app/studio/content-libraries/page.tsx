import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { ContentLibrariesScreen } from './ContentLibrariesScreen'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-07')

// The title comes from the module registry, never a second hand-typed string,
// and the route is keyed on the module's slug — never on a screen id (D1).
// This module has THREE catalogue-B screens (SCR-STU-06, SCR-STU-07,
// SCR-STU-08) and they are three tabs of this one route, so the shell is
// given no `screenId` and annotates with all three.
export const metadata: Metadata = {
  title: `${MODULE.name} — Standards and Operations Studio`,
}

// Re-exported so the covering test can import the screen itself: the screen
// needs `useState`, so it lives in its own `'use client'` file, and a file
// carrying `'use client'` cannot also export `metadata`.
export { ContentLibrariesScreen }

export default function ContentLibrariesPage() {
  return <ContentLibrariesScreen />
}
