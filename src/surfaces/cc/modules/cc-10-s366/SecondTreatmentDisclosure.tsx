import { Table } from '@/ui/primitives'
import {
  DEC_PLUS_001_DISCLOSED_ELSEWHERE,
  S366_COLUMNS,
  S366_DIVERGENCES,
  S366_FINDINGS,
  S366_HEADER_CELLS,
  S366_MATRIX_SHAPE,
  S366_POINTER_CELLS,
  S366_ROWS,
  type S366Cell,
} from './matrix'

/**
 * `MOD-CC-10`'s §36.6 treatment, ON SCREEN, as the second of two.
 *
 * IT IS A COMPONENT AND NOT A SCREEN. The route is
 * `app/command-center/sync-conflict-review/` and it belongs to the
 * chapter-21 task; this exports a component and the controller wires it
 * beneath that treatment. Nothing here claims a slug, and
 * `src/surfaces/cc/modules.ts` already gives `MOD-CC-10` exactly one.
 *
 * NOT A `'use client'` MODULE, DELIBERATELY. Four Run Player panels shipped
 * with `data-testid="fl-panel-undefined"` in the built HTML while every
 * component test passed, because they declared their panel data as a
 * module-scope const in a client file and Next replaces a client module's
 * exports with client references when a server component imports them. This
 * file has no state, no handler and no effect, so it needs no boundary; the
 * data it reads lives in `./matrix`, which is a plain module.
 *
 * IT DRAWS NO CONTROL FOR ANY ROLE. Not a resolution affordance, not a
 * disabled one, not a hidden one. It renders a transcription and a
 * divergence. `AC-36-604` (L80596) requires the Supervisor's resolution
 * control to be ABSENT rather than disabled, and this component satisfies
 * that by having no controls at all — which is not evidence about the panel
 * that does draw them.
 *
 * IT HOLDS NO POLICY AND NO PROSE OF ITS OWN. Every cell, every locator and
 * every reading comes from `./matrix`. The only strings this file owns are
 * its own headings, and the covering test asserts it carries no copy of any
 * cell's verbatim text — so a later edit that "just fixed the wording" of a
 * cell here, rather than in the transcription, goes red.
 */

/** One cell: the source's own backticked token, then the rest of its words. */
function Cell({ cell }: { cell: S366Cell }) {
  const token = /^`[^`]+`/.exec(cell.verbatim)?.[0] ?? ''
  const rest = cell.verbatim.slice(token.length)
  return (
    <span>
      <code className="text-xs">{token}</code>
      {rest === '' ? null : <span className="text-xs">{rest}</span>}
    </span>
  )
}

export function SecondTreatmentDisclosure() {
  return (
    <section data-testid="cc-10-s366" aria-labelledby="cc-10-s366-heading">
      <h2 id="cc-10-s366-heading" className="text-lg font-medium text-[var(--color-ink)]">
        {S366_MATRIX_SHAPE.module} — the {S366_MATRIX_SHAPE.treatment} treatment,{' '}
        {S366_MATRIX_SHAPE.storyboard}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        The source specifies this module twice. This is the second treatment, transcribed
        header-keyed from its own lines — {S366_MATRIX_SHAPE.rows} rows,{' '}
        {S366_MATRIX_SHAPE.personaColumns} persona columns. Where it disagrees with the first, both
        readings are shown below and neither is chosen.
      </p>

      <div className="mt-4 overflow-x-auto" data-testid="cc-10-s366-matrix">
        <Table
          caption={`Panel permissions, ${S366_MATRIX_SHAPE.treatment}`}
          columns={S366_HEADER_CELLS.map((h) => ({ key: h, header: h }))}
          rows={S366_ROWS.map((row) => ({
            Capability: <span data-testid={`cc-10-s366-row-${row.id}`}>{row.capability}</span>,
            ...Object.fromEntries(S366_COLUMNS.map((c) => [c, <Cell key={c} cell={row.cells[c]} />])),
          }))}
          emptyState={{
            title: 'No rows transcribed',
            whatCreatesIt: 'The transcription is static; an empty table means the module failed to load.',
          }}
        />
      </div>

      <h3 className="mt-6 text-base font-medium text-[var(--color-ink)]">
        A named place is not a permission
      </h3>
      <ul className="mt-2 space-y-2" data-testid="cc-10-s366-pointers">
        {S366_POINTER_CELLS.map(({ row, column, pointer }) => (
          <li key={`${row}-${column}`} className="text-sm text-[var(--color-ink-muted)]">
            <strong className="text-[var(--color-ink)]">
              {column} · {row}
            </strong>{' '}
            — {pointer.note} <span className="text-xs">({pointer.sourceRef})</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-base font-medium text-[var(--color-ink)]">
        Where the two treatments disagree
      </h3>
      <ul className="mt-2 space-y-4" data-testid="cc-10-s366-divergences">
        {S366_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-10-s366-divergence-${d.id}`}>
            <p className="text-sm font-medium text-[var(--color-ink)]">{d.question}</p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              <strong className="text-[var(--color-ink)]">This treatment:</strong> {d.here.text}{' '}
              <span className="text-xs">({d.here.locator})</span>
            </p>
            <p className="text-sm text-[var(--color-ink-muted)]">
              <strong className="text-[var(--color-ink)]">The chapter-21 treatment:</strong>{' '}
              {d.chapter21.text} <span className="text-xs">({d.chapter21.locator})</span>
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              <strong className="text-[var(--color-ink)]">Not chosen.</strong>{' '}
              {d.whyNeitherIsChosen}
            </p>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-base font-medium text-[var(--color-ink)]">
        {DEC_PLUS_001_DISCLOSED_ELSEWHERE.decisionRef}
      </h3>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]" data-testid="cc-10-s366-dec-plus-001">
        {DEC_PLUS_001_DISCLOSED_ELSEWHERE.whyItBitesHere}{' '}
        {DEC_PLUS_001_DISCLOSED_ELSEWHERE.thisSectionsOwnStatement}{' '}
        {DEC_PLUS_001_DISCLOSED_ELSEWHERE.whyNotDisclosedHere} Its readings are carried in full by{' '}
        {DEC_PLUS_001_DISCLOSED_ELSEWHERE.disclosedBy.join(', ')}.{' '}
        <span className="text-xs">({DEC_PLUS_001_DISCLOSED_ELSEWHERE.sourceRef})</span>
      </p>

      <h3 className="mt-6 text-base font-medium text-[var(--color-ink)]">
        Findings against the source
      </h3>
      <ul className="mt-2 space-y-3" data-testid="cc-10-s366-findings">
        {S366_FINDINGS.map((f) => (
          <li key={f.sourceRef} className="text-sm text-[var(--color-ink-muted)]">
            <strong className="text-[var(--color-ink)]">{f.what}</strong> {f.evidence}{' '}
            {f.notClosedBecause} <span className="text-xs">({f.sourceRef})</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
