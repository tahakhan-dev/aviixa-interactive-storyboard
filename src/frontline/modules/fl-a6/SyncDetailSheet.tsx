'use client'

import { useState } from 'react'
import { CrossSurfaceAct, frontlineCrossSurfaceModel } from '@/frontline/cross-surface'
import { CAPTURE_STATE_LABEL, captureStateLine } from '@/frontline/capture'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { Button, StatusPill } from '@/ui/primitives'
import {
  A6_CARD,
  A6_CLAIMS_NEVER_MADE,
  A6_SLICE_BOUNDARY,
  A6_STATES,
  A6_WHERE_IT_SURFACES,
  STATES_THIS_SLICE_ONLY_STATES,
} from './charter'
import {
  CLOCK_SKEW_SURFACE_CORROBORATION,
  FL_A6_COLUMNS,
  FL_A6_COLUMN_HEADINGS,
  FL_A6_MATRIX,
  FL_A6_SHAPE,
  type FlA6Column,
  type FlA6MatrixRow,
  type FlA6RowId,
} from './matrix'
import {
  A6_ACCEPTANCE_CRITERIA,
  A6_CARD_PATTERNS,
  A6_DENIAL_TESTS,
  A6_DISCLOSURES,
  A6_FUNCTIONALITIES,
  A6_MAPPED_PATTERNS,
  A6_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  A6_RECONNECT_ORDER,
  A6_SOURCE_FINDINGS,
  A6_STOP_CLASS_GAP,
  A6_SYNCED_WORD_RECORD,
  CACHED_READ_OFFLINE,
  RUNGS_NOT_ON_THE_SHEET,
  SB_FL_015_DENIAL,
  SB_FL_015_LAST_SYNCED,
  SB_FL_015_SHEET,
  SB_FL_015_TOTAL,
  manualSync,
  syncSheetLine,
} from './service'

/**
 * `MOD-FL-A6` — The Offline and Sync Engine. The sync detail sheet.
 *
 * A PLAIN VIEW, NOT A RUN PLAYER PANEL. This module's destination is
 * `SCR-FL-04`, the Notifications and sync inbox: the destination property
 * table lists `MOD-FL-B10` and `MOD-FL-A6` together on that row (L40035) and
 * §22.7 places the sync detail sheet there (L39868). The controller wires this
 * export into its route; nothing under `app/` is created or edited here.
 *
 * EVERY CONTROL ON THIS SHEET IS DECIDED BY `frontlineAffordance` AND NONE IS
 * DECIDED AROUND IT. The one button below exists only where the fold returns
 * `kind: 'control'` for the viewer's own column. `FrontlineAffordance` has no
 * `disabled` member, so a refused act renders as no control plus a stated
 * line — never a greyed-out button, which on this surface would imply a
 * condition that could become true.
 *
 * EVERY CELL PRINTS ITS OWN WORDS BESIDE THE FOLD'S VERDICT, and that is not
 * decoration. Wave 0's fold returns the ROW's cross-surface note for every
 * cell of a cross-surface row, so a table that printed only the verdict would
 * lose the Worker cell of row 5 — "the worker never sees or resolves a
 * conflict" — which is the load-bearing sentence of this whole matrix. Wave 0
 * says what to do instead: "the token is not corrected, downgraded or
 * hidden ... What is refused is the CONTROL."
 *
 * THE SHEET LEADS WITH WHAT IT IS, THEN WHAT IT IS NOT. `SB-FL-015` ends with
 * a denial — no conflict list, no resolve button, no queue-editing control
 * anywhere on the sheet — and that denial is printed rather than merely
 * obeyed, because a reader cannot see an absence.
 *
 * THIS SLICE IS HALF THE MODULE AND THE SHEET SAYS WHICH HALF. Slice 8 builds
 * the offline simulation, package staging, the reconnect ladder and
 * convergence. The offline behaviour is nonetheless stated here, in the
 * source's own words, because a screen rendering only the connected path
 * implies the safety layer needs a network.
 */

const ROW_BY_ID: Readonly<Record<FlA6RowId, FlA6MatrixRow>> = Object.fromEntries(
  FL_A6_MATRIX.map((r) => [r.id, r]),
) as Readonly<Record<FlA6RowId, FlA6MatrixRow>>

/** One-word summaries of what the fold returned, for the cell's own pill. */
const KIND_LABEL: Readonly<Record<FrontlineAffordance['kind'], string>> = {
  control: 'Control drawn here',
  'read-only': 'Visible, unchangeable',
  'cross-surface': 'Held on another surface',
  'named-place': 'Met on another screen of this application',
  routed: 'Routed to another row of this matrix',
  'stated-line': 'No control, and a stated line',
  refusal: 'No control',
}

function affordanceWords(a: FrontlineAffordance): string {
  switch (a.kind) {
    case 'control':
    case 'read-only':
    case 'cross-surface':
    case 'named-place':
    case 'refusal':
      return a.note
    case 'routed':
      return `${a.note} That act is row "${ROW_BY_ID[a.toRowId as FlA6RowId].control}" of this matrix.`
    case 'stated-line':
      return a.line
  }
}

function Ref({ text }: { readonly text: string }) {
  return <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">[{text}]</span>
}

/* ── the sheet itself ──────────────────────────────────────────────── */

function TheSheet({ viewerRole }: { readonly viewerRole: FlA6Column }) {
  const [tried, setTried] = useState(false)
  const trigger = frontlineAffordance(ROW_BY_ID['trigger-manual-sync'], viewerRole)
  const view = frontlineAffordance(ROW_BY_ID['view-sync-state'], viewerRole)
  const attempt = manualSync(true)
  const noConnection = manualSync(false)

  return (
    <section aria-label="The sync detail sheet">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The sync detail sheet
      </h4>

      <p
        data-testid="fl-a6-offline-statement"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {CACHED_READ_OFFLINE.reason} <Ref text={CACHED_READ_OFFLINE.sourceRef} />
      </p>

      {view.kind === 'control' ? (
        <ul className="mt-3 space-y-1">
          {SB_FL_015_SHEET.map((row) => (
            <li key={row.state} data-testid="fl-a6-sheet-line" data-state={row.state}>
              <span className="text-sm text-[var(--color-ink)]">{syncSheetLine(row)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p
          data-testid="fl-a6-no-view-control"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {ROW_BY_ID['view-sync-state'].control} — nothing is drawn here for the{' '}
          {FL_A6_COLUMN_HEADINGS[viewerRole]}. {affordanceWords(view)}
        </p>
      )}

      <p data-testid="fl-a6-last-synced" className="mt-2 text-sm text-[var(--color-ink-muted)]">
        {SB_FL_015_LAST_SYNCED} <Ref text="SB-FL-015 · L41235" />
      </p>

      <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        {SB_FL_015_TOTAL} captures, across {SB_FL_015_SHEET.length} of the{' '}
        {SB_FL_015_SHEET.length + RUNGS_NOT_ON_THE_SHEET.length} rungs the capture ladder
        draws. The other {RUNGS_NOT_ON_THE_SHEET.length} are{' '}
        {RUNGS_NOT_ON_THE_SHEET.map((s) => CAPTURE_STATE_LABEL[s]).join(', ')} — none of them is
        reported here, and the sheet does not imply the ladder ends where the list does.
      </p>

      {trigger.kind === 'control' ? (
        <div className="mt-3">
          <Button variant="secondary" onClick={() => setTried(true)}>
            Try now
          </Button>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {trigger.note} The tablet keeps trying by itself. <Ref text="SB-FL-015 · L41235" />
          </p>
          {tried ? (
            <p data-testid="fl-a6-manual-sync" className="mt-1 text-sm text-[var(--color-ink)]">
              {attempt.line} {attempt.clause} <Ref text={attempt.sourceRef} />
            </p>
          ) : null}
        </div>
      ) : (
        <p
          data-testid="fl-a6-no-sync-control"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {ROW_BY_ID['trigger-manual-sync'].control} — no control is drawn for the{' '}
          {FL_A6_COLUMN_HEADINGS[viewerRole]}. {affordanceWords(trigger)}
        </p>
      )}

      <p
        data-testid="fl-a6-offline-answer"
        className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        What that control says with no connection, stated in this slice and driven in the next:{' '}
        {noConnection.line} {noConnection.clause} <Ref text={noConnection.sourceRef} />
      </p>

      <p data-testid="fl-a6-denial" className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
        {SB_FL_015_DENIAL} <Ref text="SB-FL-015 · L41235" />
      </p>
    </section>
  )
}

/* ── the scope boundary ────────────────────────────────────────────── */

function SliceBoundary() {
  return (
    <section aria-label="Which half of this module this slice builds">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Half of this module
      </h4>
      <p data-testid="fl-a6-slice-boundary" className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
        {A6_SLICE_BOUNDARY.builtHere} {A6_SLICE_BOUNDARY.builtLater}
      </p>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {A6_SLICE_BOUNDARY.whyStatedNow} <Ref text={A6_SLICE_BOUNDARY.sourceRef} />
      </p>
    </section>
  )
}

/* ── the card ──────────────────────────────────────────────────────── */

function Card() {
  return (
    <section aria-label="What the source says this module is">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The module card, transcribed
      </h4>
      <dl className="mt-2 space-y-3">
        {A6_CARD.map((s) => (
          <div key={s.field} data-testid="fl-a6-card-statement">
            <dt className="text-sm font-medium text-[var(--color-ink)]">{s.field}</dt>
            <dd className="text-sm text-[var(--color-ink-muted)]">
              {s.text}{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{s.sourceRef}
                {s.sourceClass === null
                  ? ' · the card carries no classification marker for this field, and the section source status does not name it'
                  : ` · ${s.sourceClass}`}
                ]
              </span>
              {s.elision === null ? null : (
                <span
                  data-testid="fl-a6-card-elision"
                  className="mt-1 block text-xs text-[var(--color-ink-subtle)]"
                >
                  {s.elision}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ── the states ────────────────────────────────────────────────────── */

function States() {
  return (
    <section aria-label="The states this module names, and which of them this slice drives">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        States
      </h4>
      <ul className="mt-2 space-y-2">
        {A6_STATES.map((s) => (
          <li key={s.id} data-testid="fl-a6-state" data-driven={String(s.drivenHere)}>
            <span className="text-sm text-[var(--color-ink)]">{s.id}</span>{' '}
            <span className="text-sm text-[var(--color-ink-muted)]">
              {s.gloss === null
                ? 'The source names this state and gives it no description of its own.'
                : s.gloss}
            </span>{' '}
            <StatusPill
              tone={s.drivenHere ? 'info' : 'stale'}
              icon={s.drivenHere ? '•' : '~'}
              label={s.drivenHere ? 'driven on this screen' : 'stated here, driven next slice'}
            />{' '}
            <Ref text={s.sourceRef} />
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {STATES_THIS_SLICE_ONLY_STATES.length} of the {A6_STATES.length} states this module names
        belong to the offline half, which the next slice builds. They are named here rather than
        rendered as though this screen could reach them.
      </p>
    </section>
  )
}

/* ── the matrix ────────────────────────────────────────────────────── */

function MatrixTable({ viewerRole }: { readonly viewerRole: FlA6Column }) {
  return (
    <section aria-label="Permission matrix">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Who may do what, all {FL_A6_SHAPE.cells} cells
      </h4>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b p-2 align-bottom font-medium">
                Action
              </th>
              {FL_A6_COLUMNS.map((c) => (
                <th key={c} scope="col" className="border-b p-2 align-bottom font-medium">
                  {FL_A6_COLUMN_HEADINGS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FL_A6_MATRIX.map((row) => (
              <tr key={row.id} data-testid="fl-a6-row">
                <th scope="row" className="border-b p-2 align-top font-normal">
                  <span className="text-[var(--color-ink)]">{row.control}</span>
                  <span
                    data-testid="fl-a6-row-why"
                    className="mt-1 block text-xs text-[var(--color-ink-muted)]"
                  >
                    {row.why} <Ref text={row.whyRef} />
                  </span>
                  <span className="mt-1 block">
                    <Ref text={row.sourceRef} />
                  </span>
                </th>
                {FL_A6_COLUMNS.map((column) => {
                  const drawn = frontlineAffordance(row, column)
                  return (
                    <td
                      key={column}
                      data-testid="fl-a6-cell"
                      data-row={row.id}
                      data-column={column}
                      data-kind={drawn.kind}
                      className="border-b p-2 align-top"
                    >
                      <span className="block text-xs font-medium text-[var(--color-ink-subtle)]">
                        {KIND_LABEL[drawn.kind]}
                      </span>
                      <span
                        data-testid="fl-a6-cell-own-words"
                        className="block text-[var(--color-ink)]"
                      >
                        {row.cells[column].note}
                      </span>
                      <span className="block text-[var(--color-ink-muted)]">
                        {affordanceWords(drawn)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {FL_A6_MATRIX.map((row) => {
        const met = row.metElsewhere
        // Annotated rather than inferred. Every row of the const-asserted
        // matrix carries a literal type, so the three cross-surface rows have
        // `metElsewhereRef` as a string LITERAL — which makes the `??` below
        // an unreachable branch and narrows `row` to `never` inside it. The
        // annotation keeps both branches live; the unit suite is what asserts
        // no cross-surface row ever reaches the fallback.
        const metRef: string | null = row.metElsewhereRef
        if (met === null || met.where !== 'another-surface') return null
        return (
          <div key={row.id} className="mt-3">
            <CrossSurfaceAct
              model={frontlineCrossSurfaceModel(
                {
                  capability: row.control,
                  owningSurface: met.surface,
                  whatHappensThere: met.note,
                  sourceRef: `${row.sourceRef}; met elsewhere at ${metRef ?? row.sourceRef}`,
                },
                viewerRole,
              )}
            />
          </div>
        )
      })}

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Row 7 names a bound and no surface. Where the surface was read from instead:
        </p>
        <ul className="mt-1 space-y-1">
          {CLOCK_SKEW_SURFACE_CORROBORATION.map((c) => (
            <li key={c.sourceRef} data-testid="fl-a6-skew-corroboration" className="text-sm">
              <span className="text-[var(--color-ink)]">{c.reading}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.what}</span>{' '}
              <Ref text={c.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          The three denial tests these refusals answer to
        </p>
        <ul className="mt-1 space-y-1">
          {A6_DENIAL_TESTS.map((t) => (
            <li key={t.id} data-testid="fl-a6-denial-test" className="text-sm">
              <span className="text-[var(--color-ink)]">{t.text}</span>{' '}
              <Ref text={t.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ── the reconnect ordering, read rather than re-decided ───────────── */

function ReconnectOrdering() {
  return (
    <section aria-label="The reconnection ordering">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        What happens when the connection comes back
      </h4>
      <ol className="mt-2 space-y-1">
        {A6_RECONNECT_ORDER.map((phase, i) => (
          <li key={phase.phase} data-testid="fl-a6-reconnect-phase" className="text-sm">
            <span className="text-[var(--color-ink)]">
              {i + 1}. {phase.what}
            </span>{' '}
            <span className="text-[var(--color-ink-muted)]">{phase.why}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The order is settled once for the whole surface and this module reads it rather than
        deciding it again. The next slice builds the ladder that walks it.{' '}
        <Ref text="AC-A6-12 · L41256" />
      </p>
      <ul className="mt-2 space-y-1">
        {A6_STOP_CLASS_GAP.map((g) => (
          <li key={g.item} data-testid="fl-a6-stop-class-gap" className="text-sm">
            <span className="text-[var(--color-ink)]">{g.item}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              {g.whyNoClass} {g.whereTheActLives} Open decision: {g.openDecision}.
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── functionalities and the fallback obligation ───────────────────── */

function Functionalities() {
  const mapped = A6_MAPPED_PATTERNS.map((p) => p.id)
  const exercised = A6_FUNCTIONALITIES.filter((f) => f.exercisedInThisSlice)
  return (
    <section aria-label="Functionalities and their fallback patterns">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The {A6_FUNCTIONALITIES.length} functionalities, and the pattern each one names
      </h4>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        This is the largest functionality count of the twelve modules, and this slice exercises{' '}
        {exercised.length} of them. The rest are transcribed and stated; the next slice drives
        them.
      </p>
      <ul className="mt-2 space-y-2">
        {A6_FUNCTIONALITIES.map((f) => (
          <li
            key={f.id}
            data-testid="fl-a6-functionality"
            data-exercised={String(f.exercisedInThisSlice)}
            className="text-sm"
          >
            <span className="text-[var(--color-ink)]">{f.statement}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              {f.rolesProhibited ??
                'The source states no roles-prohibited clause for this functionality.'}{' '}
              {f.connectivity}
            </span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              {f.patterns.length === 0
                ? `Fallback: ${f.patternsNote ?? 'none stated'}`
                : `Fallback: ${f.patterns.join(', ')}.`}
            </span>{' '}
            <Ref text={f.sourceRef} />
          </li>
        ))}
      </ul>
      <p
        data-testid="fl-a6-three-readings"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        The section 22.9 pattern map lists this module against {mapped.length} patterns —{' '}
        {mapped.join(', ')}. The module card names {A6_CARD_PATTERNS.length}:{' '}
        {A6_CARD_PATTERNS.join(', ')}. The functionalities above name{' '}
        {A6_PATTERNS_NAMED_BY_FUNCTIONALITIES.length}:{' '}
        {A6_PATTERNS_NAMED_BY_FUNCTIONALITIES.join(', ')}. Three readings, carried apart.
      </p>
      <div className="mt-2">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Every pattern the map gives this module, and the terminal safe state each one names
        </p>
        <ul className="mt-1 space-y-1">
          {A6_MAPPED_PATTERNS.map((p) => (
            <li key={p.id} data-testid="fl-a6-terminal-safe-state" className="text-sm">
              <span className="text-[var(--color-ink)]">
                {p.id} — {p.title}.
              </span>{' '}
              <span className="text-[var(--color-ink-muted)]">
                Terminal safe state: {p.terminalSafeState}.
              </span>{' '}
              <Ref text={p.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ── findings, claims, criteria, disclosures ───────────────────────── */

function Findings() {
  return (
    <section aria-label="Findings against the source">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        What did not line up, recorded rather than closed
      </h4>
      <ul className="mt-2 space-y-2">
        {A6_SOURCE_FINDINGS.map((f) => (
          <li key={f.sourceRef} data-testid="fl-a6-finding" className="text-sm">
            <span className="text-[var(--color-ink)]">{f.what}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{f.evidence}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{f.notClosedBecause}</span>{' '}
            <Ref text={f.sourceRef} />
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          The three places this module carries the word the ladder does not have, and what each
          one is about
        </p>
        <ul className="mt-1 space-y-1">
          {A6_SYNCED_WORD_RECORD.map((r) => (
            <li key={r.sourceRef} data-testid="fl-a6-word-record" className="text-sm">
              <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{r.aboutWhat}</span>{' '}
              <Ref text={r.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Disclosures() {
  return (
    <section aria-label="Open decisions this module discloses">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Open decisions
      </h4>
      {A6_DISCLOSURES.map((d) => (
        <div
          key={d.decisionRef}
          role="note"
          data-testid="fl-a6-disclosure"
          data-decision={d.decisionRef}
          className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">Open decision {d.decisionRef}</p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{d.question}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            All readings stand. None is this build&rsquo;s to settle.
          </p>
          <ul className="mt-1 space-y-2">
            {d.readings.map((r) => (
              <li key={r.locator + r.text.slice(0, 24)}>
                <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
                <Ref text={r.locator} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            This build&apos;s working position
          </p>
          <p className="mt-1 text-[var(--color-ink)]">{d.adopted}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            A client-delegated choice under APP-012, not a position the source settled.
          </p>
          <p className="mt-2 text-[var(--color-ink-muted)]">{d.whyHere}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{d.canonNote}</p>
        </div>
      ))}
    </section>
  )
}

export function SyncDetailSheetView({
  viewerRole = 'WORKER',
}: {
  readonly viewerRole?: FlA6Column
}) {
  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        Rendered for the {FL_A6_COLUMN_HEADINGS[viewerRole]} column. Two of this module&rsquo;s
        nine rows draw anything at all, both of them the Worker&rsquo;s, and three of the
        remaining seven describe an act held on another surface.
      </p>

      <TheSheet viewerRole={viewerRole} />
      <SliceBoundary />
      <Card />
      <States />
      <MatrixTable viewerRole={viewerRole} />
      <ReconnectOrdering />
      <Functionalities />

      <section aria-label="What this module never claims">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module never claims
        </h4>
        <ul className="mt-2 space-y-2">
          {A6_CLAIMS_NEVER_MADE.map((c) => (
            <li key={c.sourceRef} data-testid="fl-a6-never-claimed" className="text-sm">
              <span className="text-[var(--color-ink)]">{c.claim}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.instead}</span>{' '}
              <Ref text={c.sourceRef} />
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Every line this sheet prints for a capture comes from the closed thirteen-rung ladder:{' '}
          {captureStateLine('queued')}
        </p>
      </section>

      <Findings />

      <section aria-label="Acceptance criteria">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module has to be true
        </h4>
        <ul className="mt-2 space-y-1">
          {A6_ACCEPTANCE_CRITERIA.map((a) => (
            <li key={a.id} data-testid="fl-a6-acceptance" className="text-sm">
              <span className="text-[var(--color-ink)]">{a.text}</span> <Ref text={a.sourceRef} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Where this module surfaces">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Where this module surfaces, and where it does not
        </h4>
        <ul className="mt-2 space-y-1">
          {A6_WHERE_IT_SURFACES.map((w) => (
            <li key={w.sourceRef} data-testid="fl-a6-surfaces" className="text-sm">
              <span className="text-[var(--color-ink)]">{w.place}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{w.what}</span>{' '}
              <Ref text={w.sourceRef} />
            </li>
          ))}
        </ul>
      </section>

      <Disclosures />
    </div>
  )
}
