import {
  BOUNDARY_COLUMNS,
  BOUNDARY_COLUMN_IDS,
  BOUNDARY_PROVENANCE_CLASS,
  deterministicStandingUnder,
  uniformlyProhibitedRows,
  type BoundaryCell,
} from '@/ai/boundary/matrix'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import type { AiModeId } from '@/ai/modes'

/**
 * WHAT THE DETERMINISTIC LAYER STILL DOES, FOR ANY ARTIFICIAL-INTELLIGENCE
 * STATE.
 *
 * Section 40.1's boundary, rendered. The data, the counts and the locators
 * are `@/ai/boundary/matrix`; this file is the rendering, and it exists
 * because three properties of that matrix are claims about a screen rather
 * than claims about a record.
 *
 * ── IT CANNOT RENDER SAFETY AS DEGRADED, AND THAT IS STRUCTURAL ────────────
 * The mode reaches the banner and nothing else. The matrix is rendered from
 * `standing.rows`, which is the same array under every one of the sixteen
 * modes because `deterministicStandingUnder` takes no branch on its argument.
 * `tests/component/deterministic-boundary.test.tsx` renders all sixteen and
 * requires the table's markup to be identical in every one, so a future
 * branch on the mode goes red rather than shipping. The source has no
 * transition from an artificial-intelligence state to a weaker deterministic
 * standing, so there is none here — and the phrase a controller brief once
 * attributed to the source, that centrally evidentiary actions fail closed,
 * is not in the frozen bytes at all. What is there is the opposite, and it is
 * rendered on screen with its line rather than summarised.
 *
 * ── THE SUPERVISOR'S RELEASE CELL, WHICH SAYS BOTH "NO" AND "YOU MAY ASK" ──
 * Its two clauses are two different acts. Rendered as one run of text they
 * read as one hedged permission, which is the failure this component exists
 * to avoid on the surface where a person acts. So the prohibition is the
 * cell's outcome and stands alone, and the other act is a separate element
 * that names itself as a different act, says what it reads where the source
 * grants it, and carries that locator. The covering test strips that element
 * out and requires what is left to read as a flat prohibition — no `Allowed`,
 * no hedge — which is a property of the tree and cannot be asserted of the
 * data.
 *
 * ── THE FOUR-COLUMN UNIFORMITY IS STATED BEFORE THE TABLE ──────────────────
 * The agent rows read the same prohibition in every column, and eight rows of
 * a table is where a pattern goes to hide. The statement comes first and
 * names the rows it is about; it carries no number, because a number is a
 * second claim about the same list and it is the one that goes stale in
 * silence. `uniformlyProhibitedRows` derives the list from the cells.
 *
 * ── ONE PROVENANCE CLASS, AND IT IS `PROV-4` ───────────────────────────────
 * Everything on this screen is a deterministic rule. One mark, rendered once,
 * through the one component that may render one. Nothing here can be labelled
 * live artificial intelligence, because nothing here is.
 *
 * ── NO CLIENT BOUNDARY, AND THAT IS A DECISION ─────────────────────────────
 * There is no state, no handler and nothing to act through: this is a
 * statement of what the platform does, not a control. So it is a server
 * component and carries no `'use client'`. Where a surface wants
 * interactivity around it, the boundary belongs at that caller — which is
 * where this build learned to put it after marking a shared control turned
 * one broken route into seven.
 *
 * ── IT IS REACHABLE FROM NO ROUTE, AND THAT IS STATED ──────────────────────
 * Measured: nothing under `app/` renders this component. Its only caller is
 * `tests/component/deterministic-boundary.test.tsx`. That is deliberate —
 * this is the agent half of the slice and the surfaces that will mount it are
 * waves 2 through 4, which own the route directories this task may not touch.
 * It is written down because a stated abstention and an oversight look
 * identical from outside; whoever mounts the first one closes this paragraph.
 */
export interface DeterministicBoundaryProps {
  /** The state being spoken about. It reaches the banner and nothing else. */
  readonly mode: AiModeId
}

/**
 * One cell. The clause after the outcome is rendered according to what it IS,
 * because a condition, a reason and a different act are three things and a
 * single footnote treatment renders them as one.
 */
function Cell({ cell }: { readonly cell: BoundaryCell }) {
  return (
    <>
      <span data-clause="outcome" className="font-semibold">
        {cell.outcome}
      </span>

      {cell.qualifierKind === 'condition' && cell.qualifier !== null ? (
        <span data-clause="condition" className="block text-[var(--color-ink-muted)]">
          Only where: {cell.qualifier}
        </span>
      ) : null}

      {cell.qualifierKind === 'reason-for-not-applicable' && cell.qualifier !== null ? (
        <span data-clause="reason" className="block text-[var(--color-ink-muted)]">
          Because: {cell.qualifier}
        </span>
      ) : null}

      {cell.separateAct === null ? null : (
        <span
          data-clause="separate-act"
          className="mt-2 block rounded-[var(--radius-chip)] border border-dashed border-[var(--color-border-strong)] p-2 text-[var(--color-ink-muted)]"
        >
          <span className="block font-semibold text-[var(--color-ink)]">
            A different act, not a softening of the line above
          </span>
          <span className="block">
            This cell’s own second clause reads “{cell.qualifier}”. That is the source naming a
            different act inside a prohibition cell, and it is kept here rather than dropped.
          </span>
          <span className="block">
            {cell.separateAct.act} — {cell.separateAct.outcomeElsewhere} at{' '}
            {cell.separateAct.grantedAt}. The act this cell forbids is{' '}
            {cell.separateAct.prohibitedAct}, and it stays forbidden:{' '}
            {cell.separateAct.prohibitionRefs.join(', ')}.
          </span>
          <span className="block">{cell.separateAct.reading}</span>
        </span>
      )}
    </>
  )
}

export function DeterministicBoundary({ mode }: DeterministicBoundaryProps) {
  const standing = deterministicStandingUnder(mode)
  const uniform = uniformlyProhibitedRows(standing.rows)

  return (
    <section
      data-deterministic-boundary
      className="space-y-4 text-sm text-[var(--color-ink)]"
    >
      <header className="space-y-2">
        <h3 className="text-base font-semibold">
          What the deterministic layer still does
        </h3>
        <p data-mode-standing>
          Operating mode {standing.mode} — {standing.modeName}. Worker-visible label:{' '}
          “{standing.workerLabel}”. Agent invocation: {standing.agentInvocation}. Deterministic
          safety:{' '}
          <strong data-deterministic-safety>{standing.deterministicSafety}</strong>.
        </p>
      </header>

      <ProvenanceMark classId={BOUNDARY_PROVENANCE_CLASS} />

      <ul className="space-y-2">
        {standing.statements.map((statement) => (
          <li key={statement.sourceRef} data-safety-statement className="space-y-1">
            <span className="block">{statement.text}</span>
            <span className="block text-[var(--color-ink-muted)]">
              {statement.sourceRef} — {statement.scope}
            </span>
          </li>
        ))}
      </ul>

      <div
        data-uniform-agent-pattern
        className="rounded-[var(--radius-card)] border border-[var(--color-border-strong)] p-3"
      >
        <p className="font-semibold">
          Every agent below reads the same prohibition in every column of this matrix:
        </p>
        <ul className="mt-1 list-disc pl-5">
          {uniform.map((row) => (
            <li key={row.id} data-uniform-agent>
              {row.component}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          No agent may evaluate the rule, set the band, place the hold, or release it. The
          deviation-triggering path is deterministic end to end.
        </p>
      </div>

      <table data-boundary-matrix className="w-full border-collapse text-left align-top">
        <caption className="pb-2 text-left text-[var(--color-ink-muted)]">
          What may and may not touch the deviation-triggering path.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="border-b border-[var(--color-border)] p-2">
              Component
            </th>
            {BOUNDARY_COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                data-column-heading={column.id}
                className="border-b border-[var(--color-border)] p-2"
              >
                {column.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standing.rows.map((row) => (
            <tr key={row.id} data-component={row.id} data-component-kind={row.kind}>
              <th scope="row" className="border-b border-[var(--color-border)] p-2 align-top">
                <span data-component-name className="font-semibold">
                  {row.component}
                </span>
                {row.rosterAbsence === null ? null : (
                  <span
                    data-roster-absence
                    className="mt-1 block font-normal text-[var(--color-ink-muted)]"
                  >
                    {row.rosterAbsence}
                  </span>
                )}
              </th>
              {BOUNDARY_COLUMN_IDS.map((columnId) => (
                <td
                  key={columnId}
                  data-column={columnId}
                  data-outcome={row.cells[columnId].outcome}
                  className="border-b border-[var(--color-border)] p-2 align-top"
                >
                  <Cell cell={row.cells[columnId]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
