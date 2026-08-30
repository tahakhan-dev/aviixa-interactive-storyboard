import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { MODULE_HEADER } from '@/surfaces/doh/modules/doh-05/routes'
import { JobLifecycleScreen } from './JobLifecycleScreen'

export const metadata: Metadata = {
  title: `${MODULE_HEADER.title} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported so tests/component/doh-job.test.tsx can import the screen
// itself: it needs `useState`, so it lives in its own `'use client'` file,
// and a file carrying `'use client'` cannot also export `metadata`.
export { JobLifecycleScreen }

export default function JobLifecyclePage() {
  return <JobLifecycleScreen />
}
