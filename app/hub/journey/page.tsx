import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { JourneyScreen } from './JourneyScreen'

/**
 * `/hub/journey/` — the operational journey end to end.
 *
 * THIS ROUTE IS NOT A MODULE ROUTE AND MINTS NO SCREEN ID (D1). It composes
 * module routes; it is not one. `app/hub/HubShell.tsx` keys the module rail on
 * each module's own slug, and `journey` is no module's slug, so
 * `scripts/build-doh-module-reach.mjs` neither sees this directory nor
 * attributes it to a module, and the rail never offers it. Nothing here claims
 * a module's route is built.
 */
export const metadata: Metadata = {
  title: `Operational journey — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so the covering test can import the screen itself: it needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { JourneyScreen }

export default function JourneyPage() {
  return <JourneyScreen />
}
