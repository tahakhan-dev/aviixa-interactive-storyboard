'use client'

import { useState } from 'react'
import { Select } from '@/ui/primitives'
import type { RoleId } from '@/domain/roles'

/**
 * THE REVIEWER'S VIEWER CONTROL FOR BOTH SCHEDULER SCREENS, AND THE ONLY
 * INTERACTIVE ELEMENT ANYWHERE ON EITHER OF THEM.
 *
 * ── WHY IT IS A FILE OF ITS OWN, AND A CLIENT ONE ──────────────────────────
 * `SchedulerScaffold` renders it, so it is the chrome's control and not a
 * screen control — but the scaffold, both screens and both route files stay
 * SERVER components, and both pages keep exporting `metadata`. The boundary is
 * this leaf alone, which is the shape slice 9 arrived at the hard way: the
 * `onAct` defect reached six of seven panels because the boundary was pushed
 * down into a shared control every server caller passed a function to, and
 * "the boundary belongs at the caller that needs interactivity". Nothing is
 * handed across it here but strings.
 *
 * IT EXPORTS NO PLAIN DATA. A `'use client'` module's exports become client
 * references, so a server component reading one gets `undefined` at prerender
 * — the defect four slice-7 panels shipped. Two types and one component leave
 * this file and nothing else.
 *
 * ── WHAT IT SWITCHES, AND WHAT IT HONESTLY DOES NOT ───────────────────────
 * It answers ONE question per role: what Matrix A's own cell says about the
 * read this screen IS. Nothing on either screen is operable for any of the
 * four roles, so the difference between a cell reading Allowed and one reading
 * Read-only changes nothing that is drawn, and the copy below says so rather
 * than letting a reviewer infer a gate that is not there.
 *
 * The cell text is transcribed, not decided: `evaluateAccess` is never asked,
 * because a read-permissive cell is answered by the cell alone and a decision
 * rendered here would claim a tenant-isolation check this screen never makes.
 */

export interface ViewerRoleAnswer {
  readonly roleId: RoleId
  readonly roleName: string
  /**
   * What Matrix A's cell says for this role, as `ColumnCell.detail` holds it.
   *
   * NOT PRESENTED AS A QUOTATION, and that is the whole of R4-05. `detail` is
   * required never to be blank (L10238), so `cellFromSource` fills a BARE cell
   * — and all four platform cells of `PER-SCHED-01` and `PER-SCHED-02` are
   * bare — with a sentence of its own, `Allowed, stated bare in the source`.
   * This screen used to print that after the verb "reads" and inside quotation
   * marks, which put the build's annotation into the source's mouth. The
   * sentence now introduces it with a colon and no quotes: a description of
   * the cell, which it is, rather than a transcription of it, which it is not.
   * `src/surfaces/sa/ai-failure-authority.ts` solves the same problem the
   * other way, by carrying the row's verbatim text; that costs a field on
   * every cell and this screen prints four of them.
   */
  readonly cellDetail: string
}

export interface ViewerRoleProps {
  /**
   * Non-empty BY TYPE, and the first is the position the page loads in. Matrix
   * A's header declares four platform columns; the scaffold is what throws if
   * it ever finds fewer, because a viewer control offering one position proves
   * nothing about a page and a silent empty select would classify as a state
   * driver in the accessibility harness and drive nothing.
   */
  readonly answers: readonly [ViewerRoleAnswer, ...ViewerRoleAnswer[]]
  /** The governed operation this screen is a view of, e.g. `PER-SCHED-01`. */
  readonly operation: string
  /** That operation as the source's own enumeration words it. */
  readonly operationName: string
  /** The Matrix A row's own locator, so the cell can be opened and read. */
  readonly sourceRef: string
}

export function ViewerRole({ answers, operation, operationName, sourceRef }: ViewerRoleProps) {
  const [head] = answers
  const [roleId, setRoleId] = useState<RoleId>(head.roleId)
  // Total by construction: `roleId` only ever holds a value taken from this
  // very list, in the handler below, so there is no branch here that renders
  // nothing and no fallback answering from the wrong column.
  const current = answers.find((a) => a.roleId === roleId) ?? head

  return (
    <section
      aria-label="Storyboard view switcher"
      className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Reviewer control — not part of the product
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-6">
        <Select
          label="View as platform role"
          value={roleId}
          options={answers.map((a) => ({ value: a.roleId, label: a.roleName }))}
          onChange={(value) => {
            const chosen = answers.find((a) => a.roleId === value)
            if (chosen !== undefined) setRoleId(chosen.roleId)
          }}
        />
        <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">
            Viewing as {current.roleName}.{' '}
          </span>
          This screen is a view, and the read it is a view of is {operation} — {operationName}.
          Matrix A&rsquo;s cell for {current.roleName}: {current.cellDetail} ({sourceRef}).
        </p>
      </div>
      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Choosing a role re-renders this storyboard from that person&rsquo;s point of view. It
        performs no product action, changes no business state and alters no audit actor, and it is
        not a login: nothing in this build authenticates anybody.
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        What it does not change is anything below it. This screen offers no operable control to any
        of the four roles, so the distance between a cell that reads Allowed and one that reads
        Read-only changes nothing that is drawn here — it is stated rather than simulated. Where the
        source answers a governed control per role, all four answers are printed side by side
        further down, because the answer is a matrix and hiding three of its columns behind this
        control would make a reader drive it four times to see one table.
      </p>
    </section>
  )
}
