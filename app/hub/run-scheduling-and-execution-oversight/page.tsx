import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { dohModuleById } from '@/surfaces/doh/modules'
import { RunSchedulingScreen } from './RunSchedulingScreen'

// MOD-DOH-06's route. The registry now carries the module, so this is the
// registry read the hardcoded name promised to become.
export const metadata: Metadata = {
  title: `${dohModuleById('MOD-DOH-06').name} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-run.test.tsx can import the screen
// itself: it needs `useState`, so it lives in its own `'use client'` file, and
// a file carrying `'use client'` cannot also export `metadata`.
export { RunSchedulingScreen }

export default function RunSchedulingPage() {
  return <RunSchedulingScreen />
}
