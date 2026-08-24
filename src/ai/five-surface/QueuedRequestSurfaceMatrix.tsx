import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import {
  QUEUED_REQUEST_SURFACE_COLUMNS,
  QUEUED_REQUEST_SURFACE_MATRIX,
  cellText,
} from '@/ai/requests/surface-matrix'
import { stateRecord } from '@/ai/requests/states'
import { FIVE_SURFACE_JOIN } from './surface-codes'
import { OVERLAY_PROVENANCE } from './overlay'

/**
 * THE TWELVE-BY-FIVE QUEUED-REQUEST STATE-TO-SURFACE MATRIX, RENDERED.
 *
 * ── WHY THIS COMPONENT EXISTS: IT WAS AN ORPHAN, AND AN ORPHAN IS NOT SHIPPED
 * Wave 0 built `src/ai/requests/{machine,states,surface-matrix}.ts` — the
 * twelve-state queued-request machine and this matrix — and NOTHING under
 * `app/` reached any of it. `states.ts`'s only importers were the other two
 * files in the cluster: a closed island of three modules.
 *
 * That is a defect and not an abstention. `src/ai/agents/contracts.ts`
 * declared its own seam and was rescued by the task that read the declaration;
 * this cluster declared nothing at all, and a stated abstention and an
 * oversight look identical from outside. This component is the mount, and the
 * matrix is a five-surface overlay in its own right — twelve rows, five surface
 * columns, at L89697-L89708 under the header at L89695 — so it belongs to the
 * five-surface overlay task rather than to a later journey task.
 *
 * ── THE COLUMNS COME THROUGH THE JOIN, NOT THROUGH A SECOND SPELLING ──────
 * The header order is the matrix's own (`QUEUED_REQUEST_SURFACE_COLUMNS`, in
 * the source's column order, with the source's own headings). The journey code
 * on each column comes from `@/ai/five-surface/surface-codes`, so a reader
 * comparing this table with a five-row surface-reaction table elsewhere can
 * line the columns up, and a sixth surface added to either union fails `tsc`
 * rather than dropping a column here.
 *
 * The HEADINGS stay the source's own wording. The matrix writes `Super Admin
 * platform console` where `SURFACES` writes `Super Admin Platform Console`, and
 * a transcription is not corrected to match a registry.
 *
 * ── THE STUDIO COLUMN IS TWELVE STATED ABSENCES, EACH WITH ITS OWN REASON ──
 * `Not applicable` on all twelve rows, and the reasons are NOT uniform: row one
 * reads "Not applicable — the Studio authors content, it does not observe
 * runtime requests" and the other eleven read "Not applicable — authoring
 * surface". Every cell renders its own reason, from the row, because a build
 * that asserted uniformity would have shipped the wrong reason on row one.
 *
 * This is also why no Studio runtime state appears in any overlay this task
 * builds: `AC-42-301` (L89400) binds every surface that DISPLAYS an
 * availability state, and this column is the source saying the Studio displays
 * none.
 *
 * ── THREE ACTS ARE NOT ON THE DEVICE AND THE TABLE IS WHERE THAT LIVES ────
 * L89702 puts the human gate on the Client Command Center, L89706 cancellation
 * with a reason there too, and L89708 reconciliation on the Delivery
 * Operations Hub. This component renders the CELLS and offers NO control at
 * all — no button, no handler, nothing operable — so there is no way for a
 * Frontline mount of it to put a Command Center act or a Hub act on the floor
 * interface. That is enforced by there being nothing to enforce: a component
 * with no interactive element cannot grow one by configuration.
 *
 * ── ONE PROVENANCE MARK, `PROV-4`, OUTSIDE EVERY BRANCH ───────────────────
 * Every cell is a transcribed deterministic rule. Nothing here is a live model
 * call, so nothing here may be labelled live artificial intelligence.
 *
 * No state, no handler — so no `'use client'`.
 */

export interface QueuedRequestSurfaceMatrixProps {
  /** The module this table is being rendered beside, for the heading. */
  readonly mountedOn: string
}

const journeyCodeFor = (queuedRequestId: string): string =>
  FIVE_SURFACE_JOIN.find((row) => row.queuedRequestId === queuedRequestId)?.journeyCode ?? ''

export function QueuedRequestSurfaceMatrix({ mountedOn }: QueuedRequestSurfaceMatrixProps) {
  return (
    <section
      aria-labelledby="queued-request-surface-matrix-heading"
      data-testid="queued-request-surface-matrix"
      className="space-y-4"
    >
      <header className="space-y-2">
        <h3
          id="queued-request-surface-matrix-heading"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          Queued artificial-intelligence requests — what each surface may show, state by state
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Rendered on {mountedOn}. Transcribed from the state-to-surface matrix; header at L89695.
          Every cell is the source&apos;s own wording, and no cell offers a control — where the
          source puts an act on another surface, this table shows the state and offers nothing.
        </p>
        <ProvenanceMark
          classId={OVERLAY_PROVENANCE}
          statement="Every cell below is a transcribed deterministic rule. None of it was produced by a model and none of it is live artificial intelligence."
        />
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Queued artificial-intelligence request states against the five surfaces
          </caption>
          <thead>
            <tr>
              <th scope="col" className="border-b border-[var(--color-border)] p-2">
                State
              </th>
              {QUEUED_REQUEST_SURFACE_COLUMNS.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  data-surface={column.surfaceId}
                  data-journey-surface={journeyCodeFor(column.id)}
                  className="border-b border-[var(--color-border)] p-2 align-bottom"
                >
                  {column.heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUEUED_REQUEST_SURFACE_MATRIX.map((row) => {
              const record = stateRecord(row.state)
              return (
                <tr key={row.state} data-queued-state={row.state}>
                  <th
                    scope="row"
                    className="border-b border-[var(--color-border)] p-2 align-top font-medium text-[var(--color-ink)]"
                  >
                    <code>{row.state}</code>
                    <span className="ml-2 whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                      [{row.locator}]
                    </span>
                    <span className="mt-1 block text-xs font-normal text-[var(--color-ink-muted)]">
                      {record.workerVisibility.cell}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-[var(--color-ink-subtle)]">
                      Terminal: {record.terminal.cell}
                    </span>
                  </th>
                  {QUEUED_REQUEST_SURFACE_COLUMNS.map((column) => {
                    const cell = row.cells[column.id]
                    return (
                      <td
                        key={column.id}
                        data-disposition={cell.disposition}
                        className="border-b border-[var(--color-border)] p-2 align-top text-[var(--color-ink-muted)]"
                      >
                        {cellText(cell)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--color-ink-subtle)]">
        The Standards and Operations Studio column reads <code>Not applicable</code> on every row,
        and the reasons are not uniform — the first row states that the Studio authors content and
        does not observe runtime requests, the rest name the authoring surface. Each cell carries
        its own reason rather than a shared one.
      </p>
    </section>
  )
}
