import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { PairedSchedulingScreen } from './PairedSchedulingScreen'
import { SCREEN_TITLE } from './title'

// No screen identifier in this title, deliberately and twice over. Catalogue B
// carries no row for this view, so there is no id to print; catalogue A's row
// is a three-digit literal this codebase forbids. The storyboard name is the
// registration and it renders inside the shell's own annotation.
export const metadata: Metadata = {
  title: `${SCREEN_TITLE} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported for `tests/component/doh-pairing.test.tsx`: the screen needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { PairedSchedulingScreen }

export default function MultiAreaJobPairingPage() {
  return <PairedSchedulingScreen />
}
