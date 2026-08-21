import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { ExecutionSummaryReviewScreen } from './ExecutionSummaryReviewScreen'
import { SCREEN_TITLE } from './fixtures'

// The module id is NOT in this title, deliberately, and the reason is no
// longer a registration gap — `MOD-DOH-08` is in `DOH_MODULES` now. No Hub
// page title carries a module id: an id is an annotation and never a name
// (D1), and `HubShell` is the one place that prints it. `SCREEN_TITLE` names
// the SCREEN rather than the module for the four reasons `./fixtures`
// records against `ROUTE_SLUG`; the module is "Execution Summary Review and
// Distribution" and this route does not separately expose the distribution.
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
