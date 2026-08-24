import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import {
  DRAFT_APPROVAL_NOTICE,
  DRAFT_STRING_RULE,
  FIVE_SURFACE_CLASSIFICATION,
  FIVE_SURFACE_SPINE_ITEM,
  NO_FIVE_COLUMN_STRING_TABLE,
  type OverlayRow,
  type OverlayTable,
  type SurfaceAiOverlay,
} from './overlay'

/**
 * ONE SURFACE'S AI-DEGRADATION OVERLAY, RENDERED.
 *
 * ── EXACTLY ONE PROVENANCE MARK, AND IT IS THE ONLY PATH TO A CLASS ───────
 * `ProvenanceMark` renders once, from `overlay.provenance`. No other path in
 * this component emits a class, and there is no branch that emits a second one:
 * the mark is outside every conditional. `AC-42-401`'s exactly-one rule is
 * therefore structural here rather than conventional, and
 * `provenanceViolations` has nothing to find.
 *
 * The class is `PROV-4` on every overlay. Nothing this component renders was
 * produced by a model — a transcribed table cell and a sentence derived from
 * one by a stated rule are both deterministic rules. The absolute rule is that
 * cached approved guidance and deterministic rules are NEVER labelled live
 * artificial intelligence, so `PROV-1` is unreachable from here by
 * construction rather than by care.
 *
 * ── `transcribed` AND `derived` ARE VISUALLY DIFFERENT, ROW BY ROW ─────────
 * A derived table draws its `whyDerived` before the table, unconditionally, so
 * a reader who scrolls straight to a behaviour cell cannot reach it without
 * passing the statement that this build wrote the row. Every row also carries
 * `data-overlay-kind`, so the distinction is in the accessibility tree and in
 * the DOM rather than in a colour a screen reader cannot see.
 *
 * The type makes the honest case the only expressible one: `whyDerived` is
 * REQUIRED non-null on a derived table, so "derived with no stated reason" —
 * which is what a build inference passing as a source claim looks like — has
 * no spelling.
 *
 * ── A CELL THAT READS TWO WAYS RENDERS BOTH READINGS, NEVER A CHOICE ──────
 * Section 43.3.4's table is headed for artificial-intelligence failure and
 * three of its cells describe connectivity. Each renders under the heading it
 * has AND with the other reading, each with its own locator. Choosing between
 * them is the one thing this component may not do, because a worker reading
 * "unavailable during an AI failure" on `MOD-FL-B12` would walk to a better
 * signal, and online-only-by-design is not fixed by walking anywhere.
 *
 * ── NO COUNT IS RENDERED, ANYWHERE ────────────────────────────────────────
 * Not a row count, not a module count, not a "3 of 5 surfaces". Two of this
 * slice's live cases are a stated count beside a contradicting enumeration and
 * the Hub's own informal module list is a third — L90861 states no number and
 * every brief describing it said "nine" over an enumeration of eight. A count
 * is also a canon-size-literal hazard: `tests/coverage/canon-size-literal.test.ts`
 * lexes a number in a double-quoted JSX attribute as well as in text. Nothing
 * here spells one.
 *
 * ── NO STRING IS PRESENTED AS FINAL ──────────────────────────────────────
 * Every message this build wrote renders with `DRAFT_APPROVAL_NOTICE` and both
 * authored locales beside it. Spine item 3 (L89928) is why: every message in
 * chapter 43 is a `Recommendation — R&D` draft requiring client approval, and a
 * locale pack with untranslated keys fails publication rather than shipping
 * gaps to a floor. A transcribed cell carries no such notice — it is the
 * source's own words, not this build's draft — and conflating the two would
 * either mark the source provisional or mark a draft final.
 *
 * ── NO SEVERITY PROP, OF EITHER VOCABULARY ───────────────────────────────
 * `AC-43-103` (L89975) — operational and manufacturing severity never share a
 * rendering component. This component takes no severity prop at all, which is
 * the only way to be certain it is not the shared one: a prop typed loosely
 * enough to accept either vocabulary IS the violation, and six of the eight
 * routes this mounts on sit on surfaces that render manufacturing severity
 * elsewhere.
 *
 * No state, no handler, nothing operable — so no `'use client'`.
 */

export interface AiDegradationOverlayProps {
  readonly overlay: SurfaceAiOverlay
  /**
   * The module this overlay is being rendered beside, for the heading. The
   * overlay itself is the SURFACE's; a module route says which module is
   * showing it so a reader knows why it is here.
   */
  readonly mountedOn: string
}

/** A row's own kind, in the DOM and in the accessibility tree. */
function Row({ row, headings }: { readonly row: OverlayRow; readonly headings: readonly string[] }) {
  const draft = (row as { readonly draft?: { readonly en: string; readonly es: string } }).draft

  return (
    <>
      <tr data-overlay-kind={row.kind} data-overlay-row={row.sourceRef}>
        {row.cells.map((cell, index) =>
          index === 0 ? (
            <th
              key={headings[index] ?? String(index)}
              scope="row"
              className="border-b border-[var(--color-border)] p-2 align-top font-medium text-[var(--color-ink)]"
            >
              {cell}
              <span className="ml-2 whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{row.sourceRef}]
              </span>
            </th>
          ) : (
            <td
              key={headings[index] ?? String(index)}
              className="border-b border-[var(--color-border)] p-2 align-top text-[var(--color-ink-muted)]"
            >
              {cell}
            </td>
          ),
        )}
      </tr>

      {row.readings.map((reading) => (
        <tr key={`${row.sourceRef}-${String(reading.cellIndex)}`} data-overlay-reading={row.sourceRef}>
          <td
            colSpan={headings.length}
            className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-2 text-xs"
          >
            <p className="font-medium text-[var(--color-ink)]">
              This cell reads two ways under the heading above, and both readings are the source&apos;s.
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              <span className="font-medium">As headed:</span> {reading.asHeaded}
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              <span className="font-medium">Also reads:</span> {reading.alsoReads}
            </p>
            <p className="mt-1 text-[var(--color-ink-subtle)]">Read from {reading.sourceRef}.</p>
          </td>
        </tr>
      ))}

      {draft === undefined ? null : (
        <tr data-overlay-draft={row.sourceRef}>
          <td
            colSpan={headings.length}
            className="border-b border-dashed border-[var(--color-border-strong)] p-2 text-xs"
          >
            <p className="font-medium text-[var(--color-ink)]">{DRAFT_APPROVAL_NOTICE}</p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              <span lang="en">{draft.en}</span>
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              <span lang="es">{draft.es}</span>
            </p>
            <p className="mt-1 text-[var(--color-ink-subtle)]">
              Spine item {DRAFT_STRING_RULE.item} at {DRAFT_STRING_RULE.locator}.
            </p>
          </td>
        </tr>
      )}
    </>
  )
}

function Table({ table }: { readonly table: OverlayTable }) {
  return (
    <section className="space-y-3" data-overlay-table={table.kind}>
      <h4 className="text-sm font-semibold text-[var(--color-ink)]">{table.caption}</h4>

      {/* THE DERIVATION STATEMENT COMES BEFORE THE TABLE, UNCONDITIONALLY. */}
      {table.whyDerived === null ? (
        <p className="text-xs text-[var(--color-ink-subtle)]">
          Transcribed from the frozen source. Header at {table.headerRef}, caption at{' '}
          {table.captionRef}. Every cell is the source&apos;s own wording.
        </p>
      ) : (
        <div
          role="note"
          aria-label="Why the rows below are derived rather than transcribed"
          data-testid="overlay-derivation"
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-xs"
        >
          <p className="font-medium text-[var(--color-ink)]">
            The rows below are this build&apos;s, not the source&apos;s.
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{table.whyDerived}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{table.caption}</caption>
          <thead>
            <tr>
              {table.headings.map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="border-b border-[var(--color-border)] p-2"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <Row key={row.sourceRef + (row.cells[0] ?? '')} row={row} headings={table.headings} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function AiDegradationOverlay({ overlay, mountedOn }: AiDegradationOverlayProps) {
  const headingId = `ai-degradation-${overlay.surfaceId.toLowerCase()}-heading`

  return (
    <section
      aria-labelledby={headingId}
      data-testid={`ai-degradation-${overlay.surfaceId}`}
      data-surface={overlay.surfaceId}
      data-journey-surface={overlay.journeyCode}
      className="space-y-6"
    >
      <header className="space-y-2">
        <h3 id={headingId} className="text-lg font-semibold text-[var(--color-ink)]">
          Behaviour during an artificial-intelligence failure
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Rendered on {mountedOn}. The obligation is one shared mode label across the five
          surfaces, not one shared sentence: &ldquo;One event, five distinct obligations, one
          shared label.&rdquo; [L90834]
        </p>
        {/* THE ONLY PROVENANCE MARK IN THIS COMPONENT. Outside every branch. */}
        <ProvenanceMark
          classId={overlay.provenance}
          statement="Everything below is a deterministic rule — a transcribed table cell, or a sentence derived from one by a stated rule. None of it was produced by a model and none of it is live artificial intelligence."
        />
      </header>

      {overlay.tables.map((table) => (
        <Table key={table.headerRef + table.caption} table={table} />
      ))}

      {/* WHY THERE IS NO PER-SURFACE STRING TABLE. */}
      <section
        role="note"
        aria-label="Why there is no five-column per-surface string table"
        data-testid="overlay-no-string-table"
        className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3 text-xs"
      >
        <p className="text-[var(--color-ink-muted)]">
          {NO_FIVE_COLUMN_STRING_TABLE.whatTheSourceHas} [
          {NO_FIVE_COLUMN_STRING_TABLE.headerRef}]
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          {NO_FIVE_COLUMN_STRING_TABLE.whatThatMeans}
        </p>
        <p className="mt-1 text-[var(--color-ink)]">
          {NO_FIVE_COLUMN_STRING_TABLE.soWhereTheContractBinds}
        </p>
      </section>

      {/* WHAT THIS SURFACE RENDERS NO STATE FOR, AND WHY. Never omitted: a
          stated abstention and an oversight look identical from outside. */}
      <section
        aria-label="What this surface renders no state for"
        data-testid="overlay-stated-absences"
        className="space-y-2 text-xs"
      >
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          What this surface renders no state for, and why
        </h4>
        <ul className="space-y-2">
          {overlay.statedAbsences.map((absence) => (
            <li
              key={absence.what}
              data-stated-absence={absence.sourceRef}
              className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-2"
            >
              <p className="font-medium text-[var(--color-ink)]">{absence.what}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{absence.reason}</p>
              <p className="mt-1 text-[var(--color-ink-subtle)]">Read from {absence.sourceRef}.</p>
            </li>
          ))}
        </ul>
      </section>

      {/* THE OBLIGATIONS, AS OPENABLE CITATIONS RATHER THAN PROSE ABOUT THEM. */}
      <section
        aria-label="The acceptance criteria this overlay must not break"
        data-testid="overlay-obligations"
        className="space-y-2 text-xs"
      >
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          The criteria this overlay must not break
        </h4>
        <ul className="space-y-1">
          {overlay.obligations.map((obligation) => (
            <li
              key={obligation.id}
              data-obligation={obligation.id}
              data-withheld={String(obligation.withheld !== null)}
            >
              <span className="font-medium text-[var(--color-ink)]">{obligation.id}</span>{' '}
              <span className="text-[var(--color-ink-subtle)]">[{obligation.sourceRef}]</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{obligation.text}</span>
              {/* A PARTIALLY RENDERED CRITERION SAYS SO. A trimmed citation with
                  no explanation reads as the whole criterion, which is the one
                  way this list could mislead. */}
              {obligation.withheld === null ? null : (
                <span className="mt-1 block text-[var(--color-ink-subtle)]">
                  Part of this criterion&apos;s own wording is not printed here.{' '}
                  {obligation.withheld}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-[var(--color-ink-subtle)]">
          {FIVE_SURFACE_CLASSIFICATION.text} [{FIVE_SURFACE_CLASSIFICATION.sourceRef}]
        </p>
        <p className="text-[var(--color-ink-subtle)]">
          Spine item {FIVE_SURFACE_SPINE_ITEM.item} — {FIVE_SURFACE_SPINE_ITEM.name}. Defined once
          per surface in section 43.3 and inherited by every catalogued row. [
          {FIVE_SURFACE_SPINE_ITEM.locator}]
        </p>
      </section>
    </section>
  )
}
