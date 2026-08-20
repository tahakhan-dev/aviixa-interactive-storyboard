import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { DevicesScreen } from './DevicesScreen'
import { SCREEN_TITLE } from './fixtures'

// No module id in this title, deliberately: this screen group claims no module
// (D5) and its identifier appears in neither screen catalogue (D4).
export const metadata: Metadata = {
  title: `${SCREEN_TITLE} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-devices.test.tsx can import the screen
// itself: it needs `useState`, so it lives in its own `'use client'` file, and
// a file carrying `'use client'` cannot also export `metadata`.
export { DevicesScreen }

export default function DevicesPage() {
  return <DevicesScreen />
}
