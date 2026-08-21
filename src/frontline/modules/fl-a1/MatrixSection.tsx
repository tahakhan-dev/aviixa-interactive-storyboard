import { CrossSurfaceAct, NamedPlace, frontlineCrossSurfaceModel } from '@/frontline/cross-surface'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { flDestinationBySlug, type FrontlineSlug } from '@/frontline/screens'
import { routeOpenDecisionFor } from '@/routes/definitions'
import { Button } from '@/ui/primitives'
import {
  A1_COLUMN_ROLE,
  A1_ROWS,
  a1RowById,
  a1RowsFor,
  type A1Column,
} from './matrix'

/**
 * THE ONE PLACE `MOD-FL-A1` DRAWS A MATRIX CELL, SHARED BY BOTH ITS
 * DESTINATIONS.
 *
 * EVERY CELL GOES THROUGH `frontlineAffordance` AND NOTHING GOES AROUND IT.
 * There is no branch below that reads `cell.outcome` to decide what to draw:
 * the fold is handed the row and the column and its seven members are
 * rendered exhaustively. A row met on another surface returns a statement
 * even where its token reads `Allowed`, and the token is not corrected,
 * downgraded or hidden — it renders beside the statement in the source's own
 * words with the source's own line, because what is refused is the CONTROL
 * and never the record of what the source said.
 *
 * THE ONLY MEMBER THAT DRAWS A CONTROL IS `control`, AND IT DRAWS AN ENABLED
 * ONE. `FrontlineAffordance` has no `disabled` member, so nothing here may
 * pass `disabledReason` to a `Button` — a disabled control on this axis
 * implies a condition that could become true, and none of these conditions
 * moves. A refusal, a stated line, a cross-surface act and a named place all
 * draw NO control and a stated line where the control would sit.
 *
 * `Not applicable` IS NOT A REFUSAL, AND THIS IS WHERE THAT SHOWS. Seven of
 * this matrix's fifty cells carry it and six of the seven are routed to
 * another row of this matrix by the cell's own words — so a Supervisor
 * reading row 10 is told a step-up is released rather than logged out and is
 * pointed at the step-up row, not told they are forbidden from logging out.
 * The seventh, row 10's Tenant Admin cell, is a bare `Not applicable` naming
 * nothing, so it renders as what it is, in its own band, with its token
 * shown.
 */

const TONE = {
  control: 'border-[var(--color-border-strong)]',
  stated: 'border-dashed border-[var(--color-border-strong)]',
} as const

function rowControlName(id: string): string {
  const row = A1_ROWS.find((r) => r.id === id)
  return row === undefined ? id : row.control
}

/** Present only where the row's classification keeps the act on this screen. */
function ControlOrLine({
  affordance,
  column,
  viewing,
  control,
  sourceRef,
}: {
  readonly affordance: FrontlineAffordance
  readonly column: A1Column
  readonly viewing: FrontlineSlug
  readonly control: string
  readonly sourceRef: string
}) {
  switch (affordance.kind) {
    case 'control':
      return (
        <div data-testid="fl-a1-control">
          <Button variant="secondary">{control}</Button>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{affordance.note}</p>
        </div>
      )

    case 'read-only':
      return (
        <p data-testid="fl-a1-read-only" className="text-sm text-[var(--color-ink-muted)]">
          Visible and unchangeable. {affordance.note}
        </p>
      )

    case 'cross-surface':
      return (
        <CrossSurfaceAct
          model={frontlineCrossSurfaceModel(
            {
              capability: control,
              owningSurface: affordance.surface,
              whatHappensThere: affordance.note,
              sourceRef,
            },
            A1_COLUMN_ROLE[column],
          )}
        />
      )

    case 'named-place':
      return (
        <NamedPlace
          capability={control}
          destination={affordance.destination}
          note={affordance.note}
          sourceRef={sourceRef}
        />
      )

    case 'routed':
      return (
        <p
          data-testid="fl-a1-routed"
          data-to-row={affordance.toRowId}
          className={`rounded-[var(--radius-surface)] border p-3 text-sm ${TONE.stated}`}
        >
          <span className="text-[var(--color-ink)]">{affordance.note}</span>{' '}
          <span className="text-[var(--color-ink-muted)]">
            No control is drawn here. The act this cell points at is “{rowControlName(affordance.toRowId)}”,
            on this same screen.
          </span>
        </p>
      )

    case 'stated-line':
      return (
        <p
          data-testid="fl-a1-stated-line"
          data-existence={affordance.existence}
          className={`rounded-[var(--radius-surface)] border p-3 text-sm text-[var(--color-ink-muted)] ${TONE.stated}`}
        >
          {affordance.line}
        </p>
      )

    case 'refusal':
      return (
        <div
          data-testid="fl-a1-refusal"
          data-outcome={affordance.outcome}
          className={`rounded-[var(--radius-surface)] border p-3 text-sm ${TONE.stated}`}
        >
          <p className="text-[var(--color-ink)]">
            {control} — no control is drawn here. {affordance.note}
          </p>
          {affordance.outcome === 'notApplicable' ? (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              This is not a refusal. The act does not arise for this role on this surface, and the
              cell states why.
            </p>
          ) : null}
          {affordance.openDecision === null ? null : (
            <OpenDeviceSessionQuestion decision={affordance.openDecision} viewing={viewing} />
          )}
        </div>
      )
  }
}

/**
 * The four `Client Decision Required` cells of this matrix defer to one
 * unanswered question and it is recorded ONCE, as a `RouteOpenDecision` on
 * `SURF-FL` in `src/routes/definitions.ts`. This reads that record; it does
 * not restate it, and there is no branch here that could answer it in either
 * direction — `AC-FL-009-5` (L39948) forbids both directions and an absence
 * from `allowedRoles` reads as one of them.
 */
function OpenDeviceSessionQuestion({
  decision,
  viewing,
}: {
  readonly decision: string
  readonly viewing: FrontlineSlug
}) {
  const open = routeOpenDecisionFor('SURF-FL', 'TENANT_ADMIN')
  return (
    <div
      data-testid="fl-a1-open-decision"
      data-decision={decision}
      className="mt-2 border-t border-dashed border-[var(--color-border-strong)] pt-2"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        An open question, disclosed and not answered
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink)]">
        {open === null
          ? `No open-decision record is registered for the Tenant Admin on this surface, and this cell defers to ${decision}. That is a defect in this build’s route registry, stated here rather than hidden.`
          : open.why}
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {decision} · recorded once for the {flDestinationBySlug(viewing).name} destination and for
        every other cell that defers to it.
      </p>
    </div>
  )
}

export interface A1MatrixSectionProps {
  /** Which of this module's two destinations is asking. */
  readonly viewing: FrontlineSlug
  /** The persona column the reader is standing in. */
  readonly column: A1Column
  readonly heading: string
}

/**
 * ALL TEN ROWS RENDER ON BOTH DESTINATIONS, AND THAT IS THE POINT. A view
 * that showed only the rows it happens to own would be a matrix with rows
 * missing, and the reader would have no way to tell a row that is met
 * elsewhere from a row nobody transcribed. The rows met elsewhere render as
 * a named place or a cross-surface statement — no control, and a sentence
 * saying where the act is met.
 */
export function A1MatrixSection({ viewing, column, heading }: A1MatrixSectionProps) {
  const rows = a1RowsFor(viewing)

  return (
    <section
      data-testid="fl-a1-matrix"
      data-column={column}
      data-viewing={viewing}
      aria-label={heading}
      className="space-y-4"
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">{heading}</h2>
      <p className="text-sm text-[var(--color-ink-muted)]">
        Ten rows and five persona columns, transcribed from the frozen source at L40188 to L40197.
        Every cell below shows the source’s own token and words, and what this screen draws for the{' '}
        {column} column beside it.
      </p>

      <ul className="space-y-4">
        {rows.map((row) => {
          const affordance = frontlineAffordance(row, column)
          const cell = row.cells[column]
          return (
            <li
              key={row.id}
              data-testid="fl-a1-matrix-row"
              data-row={row.id}
              data-affordance={affordance.kind}
              data-row-surface={row.surface}
              className={`rounded-[var(--radius-surface)] border p-4 ${TONE.control}`}
            >
              <h3 className="text-sm font-medium text-[var(--color-ink)]">
                {a1RowById(row.id).control}
              </h3>
              <p data-testid="fl-a1-cell-note" className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {column}: {cell.note}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</p>
              <div className="mt-3">
                <ControlOrLine
                  affordance={affordance}
                  column={column}
                  viewing={viewing}
                  control={row.control}
                  sourceRef={row.sourceRef}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
