import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { ExecutionSummaryReviewScreen } from './ExecutionSummaryReviewScreen'
import { SCREEN_TITLE } from './fixtures'
import { AiDegradationOverlay } from '@/ai/five-surface/AiDegradationOverlay'
import { QueuedRequestSurfaceMatrix } from '@/ai/five-surface/QueuedRequestSurfaceMatrix'
import { StateMachinePanel } from '@/ai/requests/StateMachinePanel'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
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
 * under `app/` reached any of it. This route is the right mount: the matrix puts
 * `reconciled` on the Delivery Operations Hub, "Allowed — the record of truth
 * holds it" (L89708), and the execution summary IS that record. Both panels
 * render states and offer no control anywhere, so nothing about mounting them
 * here puts a Command Center act or a Frontline act on this screen.
 *
 * ── THE PARAGRAPH ABOVE USED TO CLAIM ALL THREE FILES AND COVERED TWO ─────
 * `{machine,states,surface-matrix}` names three modules and
 * `QueuedRequestSurfaceMatrix` imports two. Measured by transitive closure from
 * `app/` before this line was written: `machine.ts` — the transition function
 * and the six rules that bind the state set — had ZERO importers anywhere under
 * `src/` or `app/`, so the twelve states rendered here and the rules governing
 * movement between them did not. `tests/coverage/slice-11-gates.test.ts` gate 12
 * named it, and `StateMachinePanel` below is the mount that retires the naming.
 * The rules belong beside the states rather than on a route of their own, and
 * one of them — rule 6, that a request never appears in the Anomaly Register —
 * is only load-bearing where the Anomaly Register is, which is here.
 *
 * ── AND THEY ARE NOT V1, WHICH THIS ROUTE DID NOT SAY (R7-C02) ────────────
 * Both panels were mounted flush against `MOD-DOH-08`'s own content, under the
 * Hub's chrome, with nothing to tell a reader they are anything else. L89727
 * classifies the state set they render: "The state set is `User-Mandated
 * Product Extension`". The channel it presumes is itself an open question —
 * `DEC-ASK-001` at L92730/L92732, whose option (a) is no question channel at
 * all — and master prompt §18.3 requires exactly these modes ("worker-initiated
 * offline help, queued help requests, cached artificial-intelligence help, and
 * on-device artificial intelligence") put in a separate "Extension decision
 * preview", `DEC-AIHELP-001` preserved, and excluded from implemented V1
 * coverage until approved.
 *
 * The storyboard cards on `/workflows/ai-and-its-absence/` already disclosed
 * it — chapter 44A's first card says the storyboard presumes a worker-initiated
 * question channel the Statement of Work does not describe — so the same
 * extension was honest on one surface and silent on another. (Its identifier
 * is deliberately not spelled here: `tests/coverage/slice-11-gates.test.ts`
 * grades every file naming a slice-11 identifier against that slice's prose
 * rules, and it convicted this comment when it did spell it. The gate is
 * right; naming the card is enough to say what this paragraph says.)
 *
 * WHAT WAS DECIDED, AND WHY IT IS DISCLOSURE HERE RATHER THAN A `LIM-*` ROW.
 * The defect is what a reader of THIS route concludes, so the remedy goes
 * where that reader is. `LIM-VISUAL-01` is the right shape for a build-wide
 * capability the export does not have and no single screen could disclose;
 * this is the opposite — a per-route classification the panels themselves must
 * carry, and putting it only on `/coverage/` would leave the Hub page reading
 * exactly as it did. Nor is a new disclosure written here:
 * `DecisionDisclosure` is the ONLY place this build renders an open decision,
 * and it renders `DEC-AIHELP-001` with `DEC-ASK-001` as its alias and all four
 * readings including option (a). A second wording on this route is the defect
 * that component exists to prevent.
 *
 * NOTHING IS SETTLED HERE. The build takes no position on scope and constructs
 * no question channel; the two cards recommend different options and the canon
 * says so.
 *
 * The V1 coverage half needs nothing added: the twelve states carry no
 * identifier, so no census row of the fourteen inventories counts them, and
 * `MOD-DOH-08` itself is a V1 module whose own status is unaffected by what
 * this route mounts beside it.
 *
 * GATED BY CONTAINMENT, not by a substring. Both panels render INSIDE
 * `[data-extension-decision-preview]`, and
 * `tests/component/ai-requests-state-machine-panel.test.tsx` asserts that
 * containment on the route's own element tree — so moving a panel out from
 * under the label is red, and so is deleting the label.
 */
export default function ExecutionSummaryReviewPage() {
  return (
    <>
      <ExecutionSummaryReviewScreen />
      <AiDegradationOverlay
        overlay={DOH_AI_OVERLAY}
        mountedOn="MOD-DOH-08 — Execution Summary Review and Distribution"
      />
      <section
        data-extension-decision-preview
        aria-labelledby="extension-decision-preview-heading"
        className="mt-10 space-y-4 rounded-[var(--radius-surface)] border-2 border-dashed border-[var(--color-border-strong)] p-4"
      >
        <header className="space-y-2">
          <h2
            id="extension-decision-preview-heading"
            className="text-lg font-semibold text-[var(--color-ink)]"
          >
            Extension decision preview — not V1, and not implemented V1 coverage
          </h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Everything inside this border is a separately classified extension, not part of{' '}
            <code>MOD-DOH-08</code> and not part of what this build claims as V1. The frozen source
            classifies the queued-request state set at L89727 &mdash; &ldquo;The state set is{' '}
            <code>User-Mandated Product Extension</code>&rdquo; &mdash; and the worker-initiated
            question channel it presumes is an open client decision rather than a described
            capability, recorded at L92730 and L92732. Master prompt &sect;18.3 requires these modes
            kept in a separate extension decision preview, with <code>DEC-AIHELP-001</code>{' '}
            preserved, and excluded from implemented V1 coverage until approved. No row of the
            fourteen inventories counts these states, and nothing here is a control.
          </p>
        </header>
        <DecisionDisclosure id="DEC-AIHELP-001" />
        <QueuedRequestSurfaceMatrix mountedOn="MOD-DOH-08 — Execution Summary Review and Distribution" />
        <StateMachinePanel mountedOn="MOD-DOH-08 — Execution Summary Review and Distribution" />
      </section>
    </>
  )
}
