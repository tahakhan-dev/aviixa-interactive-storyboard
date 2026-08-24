import { LockedControl } from '@/ui/primitives/LockedControl'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import {
  SHIFT_HANDOFF_MATRIX_HEADINGS,
  SHIFT_HANDOFF_MATRIX_META,
  SHIFT_HANDOFF_ROLE_COLUMNS,
  SHIFT_HANDOFF_ROLE_MATRIX,
  SHIFT_HANDOFF_UNCANONISED_DECISIONS,
  SHIFT_HANDOFF_UNDECIDED_CELLS,
} from '@/surfaces/cc/ai-degradation'
import { OVERLAY_PROVENANCE } from './overlay'

/**
 * SECTION 44.3's SHIFT HANDOFF AGENT DEGRADATION MATRIX, RENDERED.
 *
 * ── ITS AXIS IS FIVE ROLES, NOT FIVE SURFACES, AND THAT IS SAID ON SCREEN ─
 * `| Capability | Worker | Supervisor | Quality Manager | Tenant Admin |
 * Read-only Auditor |` at L92300. Five columns, and every one of them is a
 * TENANT ROLE reaching one surface. A reader who sees five columns on a
 * five-surface page will assume they are the five surfaces, so the axis note
 * renders before the table rather than beneath it.
 *
 * ── FOUR UNDECIDED PERMISSIVE CELLS, EACH DRAWN INOPERABLE ────────────────
 * `DEC-HANDOFF-001` in both the Supervisor and the Quality Manager cells of
 * L92306; `DEC-HANDOFF-002` in both of L92307. Four cells, two rows.
 *
 * Each renders through `LockedControl`, which is inoperable BY CONSTRUCTION
 * rather than by a guard — its props carry no handler, so there is nothing for
 * a caller to pass and nothing for a later edit to re-enable. And the cell's
 * OWN VERBATIM TEXT is printed inside the lock, because the cell states a
 * grant and an open question at once and a paraphrase would have to choose one.
 *
 * ── THE INVERTED-POLARITY ROW GETS NO CONTROL AT ALL, NOT A DISABLED ONE ──
 * L92308's capability is itself a negative — "Be blocked from starting a shift
 * by a missing acknowledgement" — reading `Explicitly prohibited` in four of
 * five cells. On a negative capability a prohibition means THE BEHAVIOUR MUST
 * NOT OCCUR: nobody is blocked. A disabled toggle there would invent the
 * affordance the source is denying, in exactly the way `SB-AI-011` warns about
 * for the evaluation gate — a greyed-out control invites the belief that a
 * sufficiently privileged account could enable it. So the row renders as a
 * statement, marked, with no control drawn.
 *
 * ── THE PERMISSIVE ROWS RENDER TOO ───────────────────────────────────────
 * All eight rows, every cell. A table drawing only the undecided rows is a list
 * of problems rather than an authority matrix, and the granted cells are claims
 * a reader needs as much as the open ones.
 *
 * ── ONE PROVENANCE MARK, `PROV-4` ────────────────────────────────────────
 * Every cell is a transcribed deterministic rule.
 *
 * No state, no handler, nothing operable — so no `'use client'`.
 */

const isUndecided = (locator: string, column: string): boolean =>
  SHIFT_HANDOFF_UNDECIDED_CELLS.some(
    (cell) => cell.locator === locator && cell.column === column,
  )

export function ShiftHandoffRoleMatrix() {
  return (
    <section
      aria-labelledby="shift-handoff-role-matrix-heading"
      data-testid="shift-handoff-role-matrix"
      className="space-y-4"
    >
      <header className="space-y-2">
        <h3
          id="shift-handoff-role-matrix-heading"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          {SHIFT_HANDOFF_MATRIX_META.subHeading}
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {SHIFT_HANDOFF_MATRIX_META.axisNote} Header at{' '}
          {SHIFT_HANDOFF_MATRIX_META.headerRef}, sub-heading at{' '}
          {SHIFT_HANDOFF_MATRIX_META.subHeadingRef}.
        </p>
        <ProvenanceMark
          classId={OVERLAY_PROVENANCE}
          statement="Every cell below is transcribed from the frozen source. None of it was produced by a model and none of it is live artificial intelligence."
        />
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{SHIFT_HANDOFF_MATRIX_META.subHeading}</caption>
          <thead>
            <tr>
              {SHIFT_HANDOFF_MATRIX_HEADINGS.map((heading) => (
                <th key={heading} scope="col" className="border-b border-[var(--color-border)] p-2">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFT_HANDOFF_ROLE_MATRIX.map((row) => (
              <tr
                key={row.locator}
                data-handoff-row={row.locator}
                data-inverted-polarity={String(row.invertedPolarity)}
              >
                <th
                  scope="row"
                  className="border-b border-[var(--color-border)] p-2 align-top font-medium text-[var(--color-ink)]"
                >
                  {row.capability}
                  <span className="ml-2 whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                    [{row.locator}]
                  </span>
                  {row.invertedPolarity ? (
                    <span className="mt-1 block text-xs font-normal text-[var(--color-ink-muted)]">
                      The capability named here is itself a negative, so a prohibition means the
                      behaviour must not occur — nobody is blocked. No control is drawn for this
                      row, because a disabled one would invent the affordance the source denies.
                    </span>
                  ) : null}
                </th>
                {SHIFT_HANDOFF_ROLE_COLUMNS.map((column, index) => {
                  const cell = row.cells[index] ?? ''
                  const undecided = isUndecided(row.locator, column)
                  return (
                    <td
                      key={column}
                      data-role-column={column}
                      data-undecided={String(undecided)}
                      className="border-b border-[var(--color-border)] p-2 align-top text-[var(--color-ink-muted)]"
                    >
                      {undecided ? (
                        <LockedControl
                          controlId={`ch44c3-${row.locator}-${column.replace(/\s+/g, '-')}`}
                          label={`${row.capability} — ${column}`}
                          // THE CELL'S OWN WORDS ARE THE VALUE. A paraphrase
                          // would have to choose between the grant and the open
                          // question, and the cell states both.
                          settingValue={cell}
                          reason={`The cell grants this and names an open client decision as its condition, both at ${row.locator}. Rendering a working control would answer the question; rendering nothing would hide the grant.`}
                          // Nothing about this cell is a reader's to change:
                          // the condition is a client decision, not a setting.
                          remains={null}
                        />
                      ) : (
                        cell
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section
        aria-label="Open client decisions this matrix names"
        data-testid="shift-handoff-open-decisions"
        className="space-y-2 text-xs"
      >
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          Open client decisions this matrix names
        </h4>
        <p className="text-[var(--color-ink-muted)]">
          None of these is a member of the exported decision union, so each is disclosed here
          rather than through the canon, and each is reported as a seam.
        </p>
        <ul className="space-y-2">
          {SHIFT_HANDOFF_UNCANONISED_DECISIONS.map((decision) => (
            <li
              key={decision.id}
              data-open-decision={decision.id}
              className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-2"
            >
              <p className="font-medium text-[var(--color-ink)]">{decision.id}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{decision.question}</p>
              <p className="mt-1 text-[var(--color-ink-subtle)]">
                {decision.whereItAppears} Read from {decision.sourceRef}.
              </p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
