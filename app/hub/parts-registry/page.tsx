import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { PartsRegistryScreen } from './PartsRegistryScreen'
import { SCREEN_TITLE } from './title'

// The module id is NOT in this title, deliberately, and the reason is no
// longer a registration gap — `MOD-DOH-19` is in `DOH_MODULES` now. No Hub
// page title carries a module id: an id is an annotation and never a name
// (D1), and `HubShell` is the one place that prints it. The title carries
// catalogue B's own screen name for `SCR-DOH-06` (L48100), which is what a
// browser tab is naming.
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
