import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { RunSchedulingScreen } from './RunSchedulingScreen'

/**
 * MOD-DOH-06's route. The title is NOT read from `dohModuleById('MOD-DOH-06')`
 * because that module is not in `DOH_MODULES` yet — see `MODULE_REGISTRY_GAP`
 * in `@/surfaces/doh/modules/doh-06/matrix`, which the screen renders. The
 * name below is the canonical one from the module inventory (§4.1.3) and from
 * the identity card at L27891, and it becomes a registry read the moment the
 * registry carries the module.
 */
export const metadata: Metadata = {
  title: `Run Scheduling and Execution Oversight — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-run.test.tsx can import the screen
// itself: it needs `useState`, so it lives in its own `'use client'` file, and
// a file carrying `'use client'` cannot also export `metadata`.
export { RunSchedulingScreen }

export default function RunSchedulingPage() {
  return <RunSchedulingScreen />
}
