import type { Metadata } from 'next'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { LearningView } from './LearningView'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-16')

// The title comes from the module registry, never a second hand-typed string,
// and the route is keyed on the module's slug — never on a screen id (D1).
// Catalogue B carries no row for MOD-STU-16 at all: catalogue A's
// SCR-STU-LEARN is rendered here and annotated SCR-STU-13, minting no new
// screen id (plan C12). The module's own `uncataloguedScreen` note is what
// the shell prints, so no id is borrowed here.
export const metadata: Metadata = {
  title: `${MODULE.name} — Standards and Operations Studio`,
}

// Re-exported so the covering test can import the view itself: it needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { LearningView }

export default function LearningPage() {
  return <LearningView />
}
