import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { BuilderScreen } from './BuilderScreen'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-04')

// The title comes from the module registry, never a second hand-typed
// string, and the route is keyed on the module's slug — never on a screen id
// (D1). This module has one catalogue-B screen, `SCR-STU-03`, which the
// shell annotates; catalogue A's `SCR-STU-CANVAS` (L31071) is the same
// screen under another name and mints nothing, and `SCR-STU-BUILDER`
// (L68164) is an uncatalogued storyboard name that becomes no route.
export const metadata: Metadata = {
  title: `${MODULE.name} — Standards and Operations Studio`,
}

// Re-exported so the covering tests can import the screen itself: the screen
// needs `useState`, so it lives in its own `'use client'` file, and a file
// carrying `'use client'` cannot also export `metadata`.
export { BuilderScreen }

export default function BuilderPage() {
  return <BuilderScreen />
}
