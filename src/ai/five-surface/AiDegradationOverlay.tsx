import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import {
  APP_012_DELEGATED_CHOICE,
  DRAFT_APPROVAL_NOTICE,
  DRAFT_STRING_RULE,
  FIVE_SURFACE_CLASSIFICATION,
  FIVE_SURFACE_SPINE_ITEM,
  NO_FIVE_COLUMN_STRING_TABLE,
  type OverlayRow,
  type OverlayTable,
  type SourceNote,
  type SurfaceAiOverlay,
} from './overlay'

/**
 * ONE SURFACE'S AI-DEGRADATION OVERLAY, RENDERED.
 *
 * ── IT OPENS AT `h2`, AND THAT IS A FACT ABOUT ITS TEN MOUNTS ─────────────
 * It used to open at `h3` with its inner headings at `h4`, which assumes an
 * `h2` somewhere above it. Nothing guarantees one: `grep -rn
 * "<AiDegradationOverlay"` returns TEN mounts and every one of them is a
 * PAGE-LEVEL SIBLING of a screen — eight render it as a direct child of the
 * page's fragment or shell, and the two journey screens render it in a
 * `<div className="mt-6">` alongside the step's own panels. Not one nests it
 * inside a section that owns an `h2`. So on any host whose screen renders no
 * `h2` in the role being read, the document went `h1` → `h3`, which is the
 * `heading-order` violation axe caught on `/hub/execution-summary-review/` in
 * role `WORKER`.
 *
 * THE FIX IS THE LEVEL, NOT A HEADING ADDED TO A HOST. Propping the wrong
 * level up with an `h2` on ten screens would be nine more edits and would make
 * the overlay's level depend on every future host remembering. A page-level
 * sibling of the screen is a second-level section of the document, so the
 * overlay opens at `h2` and every heading below it — one per table caption,
 * plus the source notes, the stated absences and the obligations — sits at
 * `h3`.
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
 * passing the statement that this build wrote the row. It also joins the
 * table's own `<caption>`, so the statement is in the accessible name and not
 * only in a sibling block. Every row carries `data-overlay-kind`, so the
 * distinction is in the DOM rather than in a colour a screen reader cannot see.
 *
 * THAT BLOCK CARRIES NO `role="note"`, AND THE REASON IS NOT AESTHETIC. Two
 * journey screens mount this component beside components that already own that
 * role — `StudioSeamNotice` on the Studio's seam step — and a shipped gate
 * there resolves THE note by role. A second `note` on the page turns a
 * singular query into an ambiguous one, so the disclosure is carried by the
 * caption, the visible text and `data-testid` instead of by a role it was
 * competing for.
 *
 * The type narrows the dishonest case rather than eliminating it: `whyDerived`
 * is REQUIRED non-null on a derived table, so "derived, reason omitted" has no
 * spelling — but requiring a field is not requiring its content, and `''`
 * still type-checks. What forbids the blank is a gate, in
 * `tests/unit/ai-five-surface-overlays.test.ts`, over every string these
 * overlays render.
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
              {/* A DERIVED ROW'S LOCATOR IS A BASIS, AND SAYS SO. `[L90861]`
                  beside a derived Hub row was visually identical to `[L91082]`
                  beside a transcribed Command Center one, which reads as the
                  line the row IS. */}
              <span className="ml-2 whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                {row.kind === 'derived' ? `derived from ${row.sourceRef}` : `[${row.sourceRef}]`}
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
            {/* NO SEPARATE CITATION HERE. `reading.sourceRef` is always the
                row's own `sourceRef` — this cell's alternate reading is read
                from the row it sits in, already cited on this row via the
                `[${row.sourceRef}]`/`derived from` badge above. A second
                "Read from L#####." sentence restated the same locator as a
                bare blueprint line number, a §8.6.2 violation the badge does
                not also commit. */}
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
              Spine item {DRAFT_STRING_RULE.item} — {DRAFT_STRING_RULE.name}.
            </p>
            {/* `DRAFT_STRING_RULE.locator` (the frozen-source line this spine
                item is read from) is not rendered — a bare `L#####` in prose
                is the §8.6.2 defect this file was audited for. The spine
                item's own number and name are the informative, non-locator
                citation; `spine.ts`'s `RESPONSE_SPINE` is the traceability
                record for the line itself. */}
          </td>
        </tr>
      )}
    </>
  )
}

function Table({
  table,
  mountedOn,
}: {
  readonly table: OverlayTable
  readonly mountedOn: string
}) {
  return (
    <section className="space-y-3" data-overlay-table={table.kind}>
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{table.caption}</h3>

      {/* THE DERIVATION STATEMENT COMES BEFORE THE TABLE, UNCONDITIONALLY.
          `table.headerRef`/`table.captionRef` (the frozen-source lines the
          header row and caption are read from) are NOT spelled out here —
          "Header at L#####, caption at L#####." was a bare blueprint line
          locator rendered as page content, and both facts they cite are
          already on screen: the caption is the `h3` above and the headings
          are the table's own `th` cells below. `OverlayTable` still carries
          both fields for the covering tests and any future registry use. */}
      {table.whyDerived === null ? (
        <p className="text-xs text-[var(--color-ink-subtle)]">
          Transcribed from the frozen source. Every cell is the source&apos;s own wording.
        </p>
      ) : (
        <div
          data-testid="overlay-derivation"
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-xs"
        >
          <p className="font-medium text-[var(--color-ink)]">
            The rows below are this build&apos;s, not the source&apos;s.
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{table.whyDerived}</p>
        </div>
      )}

      {/* A HORIZONTALLY SCROLLABLE REGION IS FOCUSABLE, ROLLED AND NAMED.
          axe cannot see it in jsdom — there is no layout — so it is asked
          structurally by `tests/component/doh-journey.test.tsx`, and a scroller
          with no focusable content inside it is a serious violation that has
          shipped in this slice once already. The name carries the mount because
          one page can hold two overlays for the same surface. */}
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={`${table.caption} — ${mountedOn}`}
      >
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            {table.caption}
            {table.whyDerived === null
              ? ' Transcribed from the frozen source.'
              : ` The rows are this build's, not the source's. ${table.whyDerived}`}
          </caption>
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

/**
 * One decision this build had to take about its own source. Where a line reads
 * two ways BOTH readings render, each with its own locator, and the build's
 * pick renders beneath them labelled a client-delegated choice under APP-012 —
 * never one reading silently obeyed and the other kept in a module.
 */
function Note({ note }: { readonly note: SourceNote }) {
  return (
    <li
      data-source-note={note.sourceRef}
      className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-2"
    >
      <p className="font-medium text-[var(--color-ink)]">{note.heading}</p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{note.body}</p>

      {note.readings.map((reading) => (
        <p key={reading.reading} className="mt-1 text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">Reading {reading.reading}:</span>{' '}
          {reading.text} <span className="text-[var(--color-ink-subtle)]">[{reading.sourceRef}]</span>
        </p>
      ))}

      {note.adopted === null ? null : (
        <p className="mt-1 text-[var(--color-ink)]">
          <span className="font-medium">This build built on reading {note.adopted.reading}.</span>{' '}
          {note.adopted.why} {APP_012_DELEGATED_CHOICE}
        </p>
      )}

      {/* NO "Read from L#####." SENTENCE HERE. `note.sourceRef` was a bare
          blueprint line locator rendered as page content — §8.6.2. It is
          preserved for traceability in `data-source-note` above (and, where
          `note.readings` is non-empty, restated per-reading via the
          `[{reading.sourceRef}]` badges just above), not deleted. */}
    </li>
  )
}

export function AiDegradationOverlay({ overlay, mountedOn }: AiDegradationOverlayProps) {
  /**
   * EVERY ACCESSIBLE NAME IN HERE CARRIES THE MOUNT, AND THERE IS NO `id`.
   *
   * ONE PAGE REALLY DOES HOLD TWO OVERLAYS FOR ONE SURFACE. A journey screen
   * renders the open step's degradation AND embeds the step's composed module
   * route, and that route carries its own surface overlay — Studio step 15
   * composes `app/studio/agents`, which mounts this component for `SURF-STU`.
   * The first version used a fixed `id` and fixed `aria-label`s, so that page
   * went red on axe's `duplicate-id-aria` and `landmark-unique`: two regions
   * with one name is two things a screen-reader user cannot tell apart, which
   * on this component means two DIFFERENT mounts reading as one.
   *
   * So the heading `id` is gone — an `aria-labelledby` target is a duplicate
   * waiting to happen — and every region name is suffixed with `mountedOn`,
   * which is the prop that already says which mount this is.
   */
  const named = (label: string): string => `${label} — ${mountedOn}`

  return (
    <section
      aria-label={named('Behaviour during an artificial-intelligence failure')}
      data-testid={`ai-degradation-${overlay.surfaceId}`}
      data-surface={overlay.surfaceId}
      data-journey-surface={overlay.journeyCode}
      className="space-y-6"
    >
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Behaviour during an artificial-intelligence failure
        </h2>
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
        <Table key={table.caption} table={table} mountedOn={mountedOn} />
      ))}

      {/* WHAT THIS BUILD HAD TO DECIDE ABOUT THE SOURCE. Outside every
          conditional: a disclosure rendered only on some branch is a
          disclosure a reader can miss, and thirteen records of exactly this
          kind reached no screen at all in the first version of these five
          overlays. */}
      <section
        aria-label={named('What this build had to decide about the source')}
        data-testid="overlay-source-notes"
        className="space-y-2 text-xs"
      >
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          What this build had to decide about the source, and what it decided
        </h3>
        <ul className="space-y-2">
          {overlay.sourceNotes.map((note) => (
            <Note key={note.heading} note={note} />
          ))}
        </ul>
      </section>

      {/* WHY THERE IS NO PER-SURFACE STRING TABLE. */}
      <section
        aria-label={named('Why there is no five-column per-surface string table')}
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
        aria-label={named('What this surface renders no state for')}
        data-testid="overlay-stated-absences"
        className="space-y-2 text-xs"
      >
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          What this surface renders no state for, and why
        </h3>
        <ul className="space-y-2">
          {overlay.statedAbsences.map((absence) => (
            <li
              key={absence.what}
              data-stated-absence={absence.sourceRef}
              className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-2"
            >
              <p className="font-medium text-[var(--color-ink)]">{absence.what}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{absence.reason}</p>
              {/* NO "Read from L#####." SENTENCE HERE — a bare blueprint line
                  locator rendered as page content, §8.6.2. `absence.sourceRef`
                  is preserved for traceability in `data-stated-absence` above. */}
            </li>
          ))}
        </ul>
      </section>

      {/* THE OBLIGATIONS, AS OPENABLE CITATIONS RATHER THAN PROSE ABOUT THEM. */}
      <section
        aria-label={named('The acceptance criteria this overlay must not break')}
        data-testid="overlay-obligations"
        className="space-y-2 text-xs"
      >
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          The criteria this overlay must not break
        </h3>
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
