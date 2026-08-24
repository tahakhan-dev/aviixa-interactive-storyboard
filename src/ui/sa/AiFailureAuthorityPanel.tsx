import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { LockedControl } from '@/ui/primitives/LockedControl'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import {
  CONSOLE_AUTHORITY_ATTRIBUTION,
  CONSOLE_AUTHORITY_AXIS_HEADING,
  CONSOLE_AUTHORITY_CLASSIFICATION_HEADING,
  CONSOLE_AUTHORITY_COLUMNS,
  CONSOLE_AUTHORITY_CROSS_REFERENCES,
  CONSOLE_AUTHORITY_PROVENANCE,
  CONSOLE_AUTHORITY_ROWS,
  CONSOLE_AUTHORITY_SEAMS,
  NOT_SHIPPABLE_AUTHORITY_ROWS,
  UNCANONISED_DECISIONS,
} from '@/surfaces/sa/ai-failure-authority'

/**
 * THE PLATFORM CONSOLE'S FAILURE-RESPONSE AUTHORITY MATRIX, RENDERED.
 *
 * Fifteen controls against four console roles, plus the classification column,
 * plus the three things a plain table would silently get wrong.
 *
 * ── IT IS NOW REACHABLE, AND THE PARAGRAPH THAT SAID OTHERWISE IS GONE ─────
 * This paragraph used to read "Measured: nothing under `app/` imports this
 * component", and it was true when it was written. It is not now:
 * `app/super-admin/ai-incidents/AiIncidentConsoleScreen.tsx` mounts this panel,
 * that screen is rendered by the route of the same name, and the console index
 * in `app/super-admin/SaConsoleShell.tsx` links to it. The `console-mount` row
 * of `CONSOLE_AUTHORITY_SEAMS` is marked closed rather than deleted, because a
 * closed seam is the record that the abstention was deliberate and followed up.
 *
 * ── AN UNSHIPPABLE ROW IS DRAWN, INOPERABLE, WITH ITS READINGS ─────────────
 * The rows that may not render as working controls are
 * `NOT_SHIPPABLE_AUTHORITY_ROWS`, and NOT the count that used to stand in this
 * paragraph — it said "Four rows are undecided", which was a stored copy of a
 * derived answer and went stale the moment shippability separated from
 * undecidedness. The population is a superset of the undecided rows by the
 * provider-or-model-failover row, whose cells all grant and whose governing
 * policy is an open decision; the module's `shippable` doc explains why the two
 * are not one flag. Nothing here states how many there are.
 *
 * The site-scoped pause is the sharp case: it is a third pause scope the client
 * has not agreed to, so drawing a working control invents a capability and
 * drawing nothing tells a reader the scope does not exist. `LockedControl` is
 * the shipped answer to exactly that — visible,
 * inoperable BY CONSTRUCTION rather than by a guard, with the reason inline
 * and in the accessibility tree. Its props carry no handler, so there is
 * nothing for a caller to pass and nothing for a later edit to re-enable.
 *
 * The row's own verbatim text is printed inside the lock. A paraphrase of a
 * cell that reads two ways is a choice between them, and choosing is the one
 * thing this panel may not do.
 *
 * ── EVERY ROW IS RENDERED, INCLUDING THE PERMISSIVE ONES ───────────────────
 * The table draws all fifteen with every cell's outcome and every stated
 * condition. A panel that drew only the undecided rows would be a list of
 * problems rather than an authority matrix. `AC-43-353` (L91306) reads, in
 * full: "Every critical-class response requires root approval, with no path
 * around it for any account." It is a rule about the APPROVAL of a response,
 * not a statement about which rows are granted — this comment used to call it
 * "a claim about the granted rows", which reads more into it than the line
 * says. What follows from it here is narrower and enough: a matrix that drew
 * only the unshippable rows would render no critical-class response at all, so
 * the criterion would have nothing on screen to bind to.
 *
 * ── PROVENANCE, ONE CLASS, STATED ON SCREEN ────────────────────────────────
 * `PROV-4`. Everything here is a deterministic rule transcribed from the
 * frozen source. Exactly one `ProvenanceMark` renders and no other path in
 * this component emits a class.
 *
 * ── NO CLIENT BOUNDARY ─────────────────────────────────────────────────────
 * There is no state, no handler and nothing operable, so this is a server
 * component and carries no `'use client'`. Six of slice 9's seven panels
 * shipped a function across the boundary because their enabled branch drew a
 * button; this panel has no enabled branch to draw one in.
 */
export function AiFailureAuthorityPanel() {
  const canonised = [
    ...new Set(CONSOLE_AUTHORITY_ROWS.flatMap((row) => row.canonisedDecisions)),
  ]

  return (
    <section
      aria-labelledby="sa-ai-failure-authority-heading"
      data-testid="sa-ai-failure-authority"
      className="space-y-6"
    >
      <header className="space-y-2">
        <h2
          id="sa-ai-failure-authority-heading"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          {CONSOLE_AUTHORITY_ATTRIBUTION.caption}
        </h2>
        <ProvenanceMark
          classId={CONSOLE_AUTHORITY_PROVENANCE}
          statement="Every cell below is transcribed from the frozen source. No agent produced any of it and none of it is live artificial intelligence."
        />
      </header>

      {/* THE ATTRIBUTION, FIRST AND UNCONDITIONALLY. A reader who scrolls
          straight to the table must not be able to reach a permission cell
          before reading which module this matrix is and is not the source's
          for. */}
      <section
        role="note"
        aria-label="Which module the source assigns this matrix to"
        data-testid="authority-attribution"
        className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
      >
        <p className="font-medium text-[var(--color-ink)]">
          The source assigns this matrix to no module.
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          {CONSOLE_AUTHORITY_ATTRIBUTION.whatTheSourceAssigns}
        </p>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          The identifier a build would reach for is{' '}
          <span className="font-medium text-[var(--color-ink)]">
            {CONSOLE_AUTHORITY_ATTRIBUTION.theIdentifierABuildWouldReachFor}
          </span>
          . {CONSOLE_AUTHORITY_ATTRIBUTION.whyThatReachIsNotTheSource}
        </p>
        <p className="mt-2 text-[var(--color-ink)]">
          {CONSOLE_AUTHORITY_ATTRIBUTION.howThisBuildRendersIt}
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          Caption at {CONSOLE_AUTHORITY_ATTRIBUTION.captionRef}.
        </p>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            {CONSOLE_AUTHORITY_ATTRIBUTION.caption}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="border-b border-[var(--color-border)] p-2">
                {CONSOLE_AUTHORITY_AXIS_HEADING}
              </th>
              {CONSOLE_AUTHORITY_COLUMNS.map((column) => (
                <th
                  key={column.role}
                  scope="col"
                  className="border-b border-[var(--color-border)] p-2"
                >
                  {column.header}
                </th>
              ))}
              <th scope="col" className="border-b border-[var(--color-border)] p-2">
                {CONSOLE_AUTHORITY_CLASSIFICATION_HEADING}
              </th>
            </tr>
          </thead>
          <tbody>
            {CONSOLE_AUTHORITY_ROWS.map((row) => (
              <tr
                key={row.id}
                data-authority-row={row.id}
                data-undecided={String(row.undecided)}
                data-shippable={String(row.shippable)}
              >
                <th
                  scope="row"
                  className="border-b border-[var(--color-border)] p-2 font-medium text-[var(--color-ink)]"
                >
                  {row.operation}
                  <span className="ml-2 whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                    [{row.sourceRef}]
                  </span>
                </th>
                {/* THE SOURCE'S WORDS, NOT THE PARSED `detail`. A bare cell's
                    `detail` is a sentence the parser supplies to satisfy
                    L10238's no-blank-cells rule, and printing it told an
                    operator their authority is "stated bare in the source".
                    The outcome beside it is still the parsed one, so the
                    machine-readable half and the human half cannot disagree.
                    Both come off the row already joined, because a component
                    holds no policy. */}
                {row.renderedCells.map((cell) => (
                  <td
                    key={cell.columnKey}
                    data-outcome={cell.outcome}
                    className="border-b border-[var(--color-border)] p-2 align-top text-[var(--color-ink-muted)]"
                  >
                    {cell.verbatim}
                  </td>
                ))}
                <td className="border-b border-[var(--color-border)] p-2 align-top text-[var(--color-ink-muted)]">
                  {row.classification}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-label="Controls that cannot ship as enabled" className="space-y-3">
        <h3 className="text-base font-semibold text-[var(--color-ink)]">
          Controls that cannot ship as enabled
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Each of these is drawn and inoperable. Not absent, because the source names the control;
          not working, because either the authority behind it or the policy governing it is an open
          question — and each row states which of those it is. The row is printed as the source
          writes it rather than summarised, so a reader can see both readings.
        </p>
        {/* THE LOCK'S OWN WORDS COME OFF THE ROW, ALL THREE OF THEM. This
            block used to pass `settingValue="No authority settled"` to every
            row while printing the row's own reason below it, and on the
            provider-or-model-failover row that reason says the authority IS
            settled — one card contradicting itself two paragraphs apart. The
            incident console spelled the same three props again with a different
            label. Both now read one derived field, so neither can choose. */}
        {NOT_SHIPPABLE_AUTHORITY_ROWS.map((row) => (
          <LockedControl
            key={row.id}
            controlId={`sa-ai-failure-${row.id}`}
            label={row.operation}
            settingValue={row.notShippableLock?.settingValue ?? ''}
            reason={row.notShippableLock?.reason ?? ''}
            remains={row.notShippableLock?.remains ?? null}
          />
        ))}
      </section>

      {/* NO EMPTINESS GUARD, AND `tsc` IS THE REASON. The list is a const
          tuple, so a `.length === 0` branch here is statically dead and the
          compiler says so — a guard that cannot fire is a guard nobody can
          trust. If a future edit makes the list computed, that branch has to
          come back with a test that can reach it. */}
      <section aria-label="Decisions that govern a row without being named in it" className="space-y-2">
        <h3 className="text-base font-semibold text-[var(--color-ink)]">
          Decisions that govern a row without being named in it
        </h3>
        <ul className="space-y-2 text-sm">
          {CONSOLE_AUTHORITY_CROSS_REFERENCES.map((reference) => (
            <li key={`${reference.rowId}-${reference.decision}`} className="text-[var(--color-ink-muted)]">
              <span className="font-medium text-[var(--color-ink)]">{reference.decision}</span> —{' '}
              {reference.reading}{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{reference.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
      </section>

      {canonised.map((id) => (
        <DecisionDisclosure key={id} id={id} />
      ))}

      {/* THE UNCANONISED HALF, AND WHY IT IS A SEAM RATHER THAN A DISCLOSURE
          WRITTEN HERE. Two identifiers this matrix names have no canon record,
          and a panel that wrote its own readings for them would be the second
          home the canon exists to prevent. So the panel says what is missing
          and names the file that owns it. */}
      <section
        role="note"
        aria-label="Open decisions this panel may not disclose"
        data-testid="authority-seams"
        className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
      >
        <p className="font-medium text-[var(--color-ink)]">
          {UNCANONISED_DECISIONS.length === 0
            ? 'Every open decision this matrix names is in the decision canon.'
            : `Named by this matrix and not yet in the decision canon: ${UNCANONISED_DECISIONS.join(', ')}.`}
        </p>
        <ul className="mt-2 space-y-2">
          {CONSOLE_AUTHORITY_SEAMS.map((seam) => (
            <li key={seam.id} data-seam={seam.id} className="text-[var(--color-ink-muted)]">
              {seam.whatIsMissing}{' '}
              <span className="text-[var(--color-ink)]">
                Owned by {seam.owner} — {seam.ownerTask}.
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
