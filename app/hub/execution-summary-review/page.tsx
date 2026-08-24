import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { ExecutionSummaryReviewScreen } from './ExecutionSummaryReviewScreen'
import { SCREEN_TITLE } from './fixtures'
import { AiDegradationOverlay } from '@/ai/five-surface/AiDegradationOverlay'
import { QueuedRequestSurfaceMatrix } from '@/ai/five-surface/QueuedRequestSurfaceMatrix'
import { DOH_AI_OVERLAY } from '@/surfaces/doh/ai-degradation'

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


/**
 * THE SLICE-11 OVERLAYS MOUNT AT THE ROUTE, NOT INSIDE THE SCREEN.
 *
 * `tests/component/doh-summary.test.tsx` renders `ExecutionSummaryReviewScreen`
 * directly and calls `getByRole('table')`, which becomes ambiguous the instant a
 * second table is on the page, and it enumerates every `tr` to check the aging
 * bands. Mounting inside the screen turned three of its assertions red on the
 * overlay's EXISTENCE rather than its content. Those assertions are right and
 * they are not this task's to edit: they measure `MOD-DOH-08`'s own contract,
 * and the overlay is a route-level addition rather than part of it.
 *
 * ── AND THE QUEUED-REQUEST MATRIX IS MOUNTED HERE ON PURPOSE ──────────────
 * `src/ai/requests/{machine,states,surface-matrix}.ts` was an orphan — wave 0
 * built the twelve-state machine and its state-to-surface matrix and nothing
 * under `app/` reached any of it. This is its mount, and this route is the right
 * one: the matrix puts `reconciled` on the Delivery Operations Hub, "Allowed —
 * the record of truth holds it" (L89708), and the execution summary IS that
 * record. It renders states and offers no control anywhere, so nothing about
 * mounting it here puts a Command Center act or a Frontline act on this screen.
 */
export default function ExecutionSummaryReviewPage() {
  return (
    <>
      <ExecutionSummaryReviewScreen />
      <AiDegradationOverlay
        overlay={DOH_AI_OVERLAY}
        mountedOn="MOD-DOH-08 — Execution Summary Review and Distribution"
      />
      <QueuedRequestSurfaceMatrix mountedOn="MOD-DOH-08 — Execution Summary Review and Distribution" />
    </>
  )
}
