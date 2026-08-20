import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { JourneyScreen } from './JourneyScreen'

/**
 * `/studio/journey/` — the Workflow Builder journey end to end.
 *
 * THIS ROUTE IS NOT A MODULE ROUTE AND MINTS NO SCREEN ID (D1). It composes
 * module routes; it is not one. `src/studio/modules.ts` keys every module
 * route on that module's own slug, and `journey` is no module's slug, so
 * `scripts/build-stu-module-reach.mjs` neither sees this directory nor
 * attributes it to a module. Nothing here claims a module's route is built.
 */
export const metadata: Metadata = {
  title: `Workflow Builder journey — ${surfaceById('SURF-STU').name}`,
}

// Re-exported so the covering test can import the screen itself: it needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { JourneyScreen }

export default function JourneyPage() {
  return <JourneyScreen />
}
