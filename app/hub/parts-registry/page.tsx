import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { PartsRegistryScreen, SCREEN_TITLE } from './PartsRegistryScreen'

// The module id is NOT in this title, deliberately. `MOD-DOH-19` owns this
// route, but it is not yet in `DOH_MODULES` and printing an id the module
// registry does not serve would mint ownership the tree cannot check.
export const metadata: Metadata = {
  title: `${SCREEN_TITLE} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported for `tests/component/doh-parts.test.tsx`: the screen needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { PartsRegistryScreen }

export default function PartsRegistryPage() {
  return <PartsRegistryScreen />
}
