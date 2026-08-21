import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { ExecutionSummaryReviewScreen } from './ExecutionSummaryReviewScreen'
import { SCREEN_TITLE } from './fixtures'

// The module id is NOT in this title, deliberately. `MOD-DOH-08` owns this
// route, but it is not yet in `DOH_MODULES` and printing an id the module
// registry does not serve would mint ownership the tree cannot check.
export const metadata: Metadata = {
  title: `${SCREEN_TITLE} — ${surfaceById('SURF-DOH').name}`,
}

// Re-exported for `tests/component/doh-summary.test.tsx`: the screen needs
// `useState`, so it lives in its own `'use client'` file, and a file carrying
// `'use client'` cannot also export `metadata`.
export { ExecutionSummaryReviewScreen }

export default function ExecutionSummaryReviewPage() {
  return <ExecutionSummaryReviewScreen />
}
