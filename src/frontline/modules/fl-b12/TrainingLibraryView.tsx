'use client'

import { useState } from 'react'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { CrossSurfaceAct, frontlineCrossSurfaceModel } from '@/frontline/cross-surface'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { Button, StatusPill } from '@/ui/primitives'
import {
  B12_CARD,
  B12_CLAIMS_NEVER_MADE,
  B12_INVENTORY_ROW,
  B12_ONLINE_ONLY_SCOPE,
  B12_STATES,
  B12_WHERE_IT_SURFACES,
} from './charter'
import {
  B12_UNAVAILABLE_SENSES,
  FL_B12_COLUMNS,
  FL_B12_COLUMN_HEADINGS,
  FL_B12_MATRIX,
  FL_B12_SHAPE,
  type FlB12Column,
  type FlB12MatrixRow,
  type FlB12RowId,
} from './matrix'
import {
  B12_ACCEPTANCE_CRITERIA,
  B12_CANON_DECISIONS,
  B12_CARD_PATTERNS,
  B12_DENIAL_TESTS,
  B12_FUNCTIONALITIES,
  B12_ILLUSTRATIVE_ITEM,
  B12_MAPPED_PATTERNS,
  B12_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B12_PATTERN_GAPS,
  B12_SOURCE_FINDINGS,
  B12_UNIDENTIFIED_TENSIONS,
  SB_FL_021_FRAMES,
  SB_FL_021_STATED_NOT_BUILT,
  libraryRendering,
} from './service'

/**
 * `MOD-FL-B12` — The Training Library Viewer.
 *
 * A PLAIN VIEW, NOT A RUN PLAYER PANEL. This module's destination is its own:
 * `SCR-FL-05` Training Library, a route distinct from the Run Player and
 * distinct from the Studio's authoring screen. The controller wires this export
 * into its route; nothing under `app/` is created or edited here.
 *
 * EVERY CELL IS DECIDED BY `frontlineAffordance` AND NONE IS DECIDED AROUND IT.
 * The one control on this screen — opening a piece of material — exists only
 * where the fold returns `kind: 'control'` for the viewer's own column.
 * `FrontlineAffordance` has no `disabled` member, so a refused act renders as
 * no control plus a stated line.
 *
 * EVERY CELL PRINTS ITS OWN WORDS BESIDE THE FOLD'S VERDICT. Five of the eight
 * modules shipped before this one do that and three do not, and the five are
 * right: the fold returns the ROW's note for every cell of a cross-surface row,
 * so a table printing only the verdict would lose the Quality Manager cell of
 * row 3 — the one that ends "never here" — which is the sentence that keeps
 * authoring off this surface.
 *
 * THE TWO `Unavailable` ROWS ARE THE POINT OF THIS SCREEN. Row 2 and row 8
 * carry the same token six rows apart and mean opposite things. They render
 * apart because wave 0's fold reads capability existence before it reads the
 * token, and the screen shows both senses side by side under the table so a
 * reader meets the overload rather than inheriting one sense from the other.
 *
 * WHAT THIS SCREEN NEVER DRAWS, AND WHY IT CANNOT. No progress reading, no
 * completion count, no "modules watched" figure, no pace, no countdown, no
 * comparison to another worker, in any state. There is no record to compute one
 * from: row 6 of the matrix forbids a viewing creating any production record at
 * all, which is the prohibition holding at the source rather than at the
 * display.
 */

const ROW_BY_ID: Readonly<Record<FlB12RowId, FlB12MatrixRow>> = Object.fromEntries(
  FL_B12_MATRIX.map((r) => [r.id, r]),
) as Readonly<Record<FlB12RowId, FlB12MatrixRow>>

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
      return `${a.note} That act is row "${ROW_BY_ID[a.toRowId as FlB12RowId].control}" of this matrix.`
    case 'stated-line':
      return a.line
  }
}

function Ref({ text }: { readonly text: string }) {
  return <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">[{text}]</span>
}

/* ── the library itself ────────────────────────────────────────────── */

function TheLibrary({
  viewerRole,
  connected,
  onToggle,
}: {
  readonly viewerRole: FlB12Column
  readonly connected: boolean
  readonly onToggle: () => void
}) {
  const [playing, setPlaying] = useState(false)
  const view = frontlineAffordance(ROW_BY_ID['view-connected'], viewerRole)
  const offline = frontlineAffordance(ROW_BY_ID['view-offline'], viewerRole)
  const rendering = libraryRendering(connected)
  const item = B12_ILLUSTRATIVE_ITEM

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The Training Library
      </h3>

      <p
        data-testid="fl-b12-rendering"
        data-state={rendering.state}
        data-connected={String(connected)}
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {rendering.line} <Ref text={rendering.sourceRef} />
      </p>

      <p className="mt-2">
        <Button variant="secondary" onClick={onToggle}>
          {connected ? 'Show this screen with no connection' : 'Show this screen connected'}
        </Button>
      </p>

      {connected && view.kind === 'control' ? (
        <div className="mt-3">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            One item, and it is the frozen source&rsquo;s own
          </p>
          <div
            data-testid="fl-b12-item"
            className="mt-1 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3 text-sm"
          >
            <p className="text-[var(--color-ink)]">
              The {item.length} video on {item.subject}, in {item.language}, uploaded by{' '}
              {item.uploadedBy} and currently at {item.version}. Station: {item.station}.
            </p>
            <p className="mt-1">
              <StatusPill tone="info" icon="i" label={item.classification} />
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">{item.whatItIsNot}</p>
            <p className="mt-1">
              <Ref text={item.sourceRef} />
            </p>
            <p className="mt-2">
              <Button variant="secondary" onClick={() => setPlaying(true)}>
                Open it
              </Button>
            </p>
            {playing ? (
              <p data-testid="fl-b12-playing" className="mt-2 text-[var(--color-ink)]">
                {SB_FL_021_FRAMES[1].description} Nothing about this viewing enters the production
                record. <Ref text={SB_FL_021_FRAMES[1].sourceRef} />
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {connected && view.kind !== 'control' ? (
        <p
          data-testid="fl-b12-no-view-control"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {ROW_BY_ID['view-connected'].control} — nothing is drawn here for the{' '}
          {FL_B12_COLUMN_HEADINGS[viewerRole]}. {affordanceWords(view)}
        </p>
      ) : null}

      {!connected ? (
        <p
          data-testid="fl-b12-offline-line"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {affordanceWords(offline)} <Ref text={ROW_BY_ID['view-offline'].sourceRef} />
        </p>
      ) : null}

      <p data-testid="fl-b12-frames-not-built" className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        {SB_FL_021_STATED_NOT_BUILT} <Ref text={SB_FL_021_FRAMES[0].sourceRef} />
      </p>
    </div>
  )
}

/* ── online-only, and the half that does not generalise ────────────── */

function OnlineOnlyScope() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Online-only, and what that does not mean
      </h3>
      <p data-testid="fl-b12-online-only" className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
        {B12_ONLINE_ONLY_SCOPE.whatIsOnlineOnly}{' '}
        <Ref text={B12_ONLINE_ONLY_SCOPE.whatIsOnlineOnlyRef} />
      </p>
      <p
        data-testid="fl-b12-safety-layer"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {B12_ONLINE_ONLY_SCOPE.whatDoesNotGeneralise}{' '}
        <Ref text={B12_ONLINE_ONLY_SCOPE.whatDoesNotGeneraliseRef} />
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {B12_ONLINE_ONLY_SCOPE.whyItIsSaidHere} <Ref text={B12_ONLINE_ONLY_SCOPE.whyRef} />
      </p>
    </div>
  )
}

/* ── the card ──────────────────────────────────────────────────────── */

function Card() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The module card, transcribed
      </h3>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        Band {B12_INVENTORY_ROW.band} — {B12_INVENTORY_ROW.oneLineScope}.{' '}
        <Ref text={B12_INVENTORY_ROW.sourceRef} />
      </p>
      <dl className="mt-2 space-y-3">
        {B12_CARD.map((s) => (
          <div key={s.field} data-testid="fl-b12-card-statement">
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
                  data-testid="fl-b12-card-elision"
                  className="mt-1 block text-xs text-[var(--color-ink-subtle)]"
                >
                  {s.elision}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ── the states ────────────────────────────────────────────────────── */

function States() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        States
      </h3>
      <ul className="mt-2 space-y-2">
        {B12_STATES.map((s) => (
          <li key={s.id} data-testid="fl-b12-state" data-driven={String(s.drivenHere)}>
            <span className="text-sm text-[var(--color-ink)]">{s.id}</span>{' '}
            <span className="text-sm text-[var(--color-ink-muted)]">
              {s.clause === null
                ? 'The source names this state and gives it no clause of its own.'
                : s.clause}
            </span>{' '}
            <StatusPill
              tone={s.drivenHere ? 'info' : 'stale'}
              icon={s.drivenHere ? '•' : '~'}
              label={s.drivenHere ? 'driven on this screen' : 'stated here, driven later'}
            />{' '}
            <Ref text={s.sourceRef} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── the matrix ────────────────────────────────────────────────────── */

function MatrixTable({ viewerRole }: { readonly viewerRole: FlB12Column }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Who may do what, all {FL_B12_SHAPE.cells} cells
      </h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b p-2 align-bottom font-medium">
                Action
              </th>
              {FL_B12_COLUMNS.map((c) => (
                <th key={c} scope="col" className="border-b p-2 align-bottom font-medium">
                  {FL_B12_COLUMN_HEADINGS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FL_B12_MATRIX.map((row) => (
              <tr key={row.id} data-testid="fl-b12-row">
                <th scope="row" className="border-b p-2 align-top font-normal">
                  <span className="text-[var(--color-ink)]">{row.control}</span>
                  <span
                    data-testid="fl-b12-row-why"
                    className="mt-1 block text-xs text-[var(--color-ink-muted)]"
                  >
                    {row.why} <Ref text={row.whyRef} />
                  </span>
                  <span className="mt-1 block">
                    <Ref text={row.sourceRef} />
                  </span>
                </th>
                {FL_B12_COLUMNS.map((column) => {
                  const drawn = frontlineAffordance(row, column)
                  return (
                    <td
                      key={column}
                      data-testid="fl-b12-cell"
                      data-row={row.id}
                      data-column={column}
                      data-kind={drawn.kind}
                      data-existence={row.existence}
                      className="border-b p-2 align-top"
                    >
                      <span className="block text-xs font-medium text-[var(--color-ink-subtle)]">
                        {KIND_LABEL[drawn.kind]}
                      </span>
                      <span
                        data-testid="fl-b12-cell-own-words"
                        className="block text-[var(--color-ink)]"
                      >
                        {row.cells[column].note}
                      </span>
                      <span
                        data-testid="fl-b12-cell-verdict"
                        className="block text-[var(--color-ink-muted)]"
                      >
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

      {FL_B12_MATRIX.map((row) => {
        const met = row.metElsewhere
        // Annotated rather than inferred, for the reason `fl-a6` records: every
        // row of the const-asserted matrix carries a literal type, so the
        // cross-surface row's `metElsewhereRef` is a string LITERAL, which makes
        // the `??` below an unreachable branch and narrows `row` to `never`
        // inside it. The annotation keeps both branches live.
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

      <div className="mt-4">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Two rows of this table read the same token and mean opposite things
        </p>
        <ul className="mt-1 space-y-2">
          {B12_UNAVAILABLE_SENSES.map((s) => (
            <li
              key={s.rowId}
              data-testid="fl-b12-sense"
              data-row={s.rowId}
              data-existence={s.existence}
              className="text-sm"
            >
              <span className="text-[var(--color-ink)]">
                {ROW_BY_ID[s.rowId].control} — Unavailable, {s.cellWords}.
              </span>{' '}
              <span data-testid="fl-b12-route-back" className="text-[var(--color-ink-muted)]">
                {s.routeBack}
              </span>{' '}
              <Ref text={s.sourceRef} />
              <ul className="mt-1 space-y-1 pl-4">
                {s.corroboration.map((c) => (
                  <li key={c.sourceRef} data-testid="fl-b12-sense-corroboration">
                    <span className="text-[var(--color-ink-muted)]">{c.reading}</span>{' '}
                    <Ref text={c.sourceRef} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          The tests these refusals answer to
        </p>
        <ul className="mt-1 space-y-1">
          {B12_DENIAL_TESTS.map((t) => (
            <li key={t.id} data-testid="fl-b12-denial-test" className="text-sm">
              <span className="text-[var(--color-ink)]">{t.text}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{t.type}.</span>{' '}
              <Ref text={t.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── functionalities and the fallback obligation ───────────────────── */

function Functionalities() {
  const mapped = B12_MAPPED_PATTERNS.map((p) => p.id)
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The {B12_FUNCTIONALITIES.length} functionalities, and the pattern each one names
      </h3>
      <ul className="mt-2 space-y-2">
        {B12_FUNCTIONALITIES.map((f) => (
          <li
            key={f.id}
            data-testid="fl-b12-functionality"
            data-patterns={String(f.patterns.length)}
            className="text-sm"
          >
            <span className="text-[var(--color-ink)]">{f.statement}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              Purpose: {f.purpose} Roles prohibited: {f.rolesProhibited} {f.connectivity}
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
        data-testid="fl-b12-three-readings"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        The section 22.9 pattern map lists this module against {mapped.length} pattern
        {mapped.length === 1 ? '' : 's'} — {mapped.join(', ')}. The module card names{' '}
        {B12_CARD_PATTERNS.length}: {B12_CARD_PATTERNS.join(', ')}. The functionalities above name{' '}
        {B12_PATTERNS_NAMED_BY_FUNCTIONALITIES.length}:{' '}
        {B12_PATTERNS_NAMED_BY_FUNCTIONALITIES.join(', ')}. Three readings, carried apart and
        reconciled nowhere.
      </p>

      <p
        data-testid="fl-b12-pattern-gaps"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {B12_PATTERN_GAPS.length} of the {B12_FUNCTIONALITIES.length} name no FB-FL pattern at all.
        Each gives its own ground and none is filled here, because an assigned pattern is
        indistinguishable from a real one afterwards:{' '}
        {B12_PATTERN_GAPS.map((f) => `${f.id} — ${f.patternsNote ?? ''}`).join(' ')}{' '}
        <Ref text="AC-FL-011-1 · L40151" />
      </p>

      <div className="mt-2">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Every pattern the map gives this module, and the terminal safe state each one names
        </p>
        <ul className="mt-1 space-y-1">
          {B12_MAPPED_PATTERNS.map((p) => (
            <li key={p.id} data-testid="fl-b12-terminal-safe-state" className="text-sm">
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
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The card adds a clause the map does not carry: uniquely in this chapter, the terminal
          state of that pattern for this module is simply unavailability, because no execution
          depends on the library. <Ref text="FB-FL-CORE-01 · L42167" />
        </p>
      </div>
    </div>
  )
}

/* ── findings and disclosures ──────────────────────────────────────── */

function Findings() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        What did not line up, recorded rather than closed
      </h3>
      <ul className="mt-2 space-y-2">
        {B12_SOURCE_FINDINGS.map((f) => (
          <li key={f.sourceRef} data-testid="fl-b12-finding" className="text-sm">
            <span className="text-[var(--color-ink)]">{f.what}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{f.evidence}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{f.notClosedBecause}</span>{' '}
            <Ref text={f.sourceRef} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Disclosures() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Open decisions
      </h3>

      {B12_CANON_DECISIONS.map((d) => (
        <div key={d.id} data-testid="fl-b12-canon-decision" data-decision={d.id} className="mt-3">
          <DecisionDisclosure id={d.id} />
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">{d.whyHere}</p>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Where the frozen source attaches it: {d.whereTheSourceAttachesIt}
          </p>
        </div>
      ))}

      {B12_UNIDENTIFIED_TENSIONS.map((t) => (
        <div
          key={t.key}
          role="note"
          data-testid="fl-b12-tension"
          data-tension={t.key}
          className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">
            A source tension carrying no decision identifier
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{t.question}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            All readings stand. None is this build&rsquo;s to settle.
          </p>
          <ul className="mt-1 space-y-2">
            {t.readings.map((r) => (
              <li key={r.locator + r.text.slice(0, 24)} data-testid="fl-b12-tension-reading">
                <span className="text-[var(--color-ink)]">{r.text}</span> <Ref text={r.locator} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            This build&apos;s working position
          </p>
          <p className="mt-1 text-[var(--color-ink)]">{t.adopted}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            A client-delegated choice, not a position the source settled.
          </p>
          <p className="mt-2 text-[var(--color-ink-muted)]">{t.whyHere}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{t.noIdentifierNote}</p>
        </div>
      ))}
    </div>
  )
}

export function TrainingLibraryView({
  viewerRole = 'WORKER',
}: {
  readonly viewerRole?: FlB12Column
}) {
  const [connected, setConnected] = useState(true)

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        Rendered for the {FL_B12_COLUMN_HEADINGS[viewerRole]} column. One of this module&rsquo;s
        eight rows draws anything at all, and it is the Worker&rsquo;s. One row is held on another
        surface, two carry the word Unavailable in two opposite senses, and the remaining four are
        prohibitions on every role.
      </p>

      <TheLibrary
        viewerRole={viewerRole}
        connected={connected}
        onToggle={() => setConnected((c) => !c)}
      />
      <OnlineOnlyScope />
      <Card />
      <States />
      <MatrixTable viewerRole={viewerRole} />
      <Functionalities />

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module never claims
        </h3>
        <ul className="mt-2 space-y-2">
          {B12_CLAIMS_NEVER_MADE.map((c) => (
            <li key={c.sourceRef} data-testid="fl-b12-never-claimed" className="text-sm">
              <span className="text-[var(--color-ink)]">{c.claim}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.instead}</span>{' '}
              <Ref text={c.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <Findings />

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module has to be true
        </h3>
        <ul className="mt-2 space-y-1">
          {B12_ACCEPTANCE_CRITERIA.map((a) => (
            <li key={a.id} data-testid="fl-b12-acceptance" className="text-sm">
              <span className="text-[var(--color-ink)]">{a.text}</span> <Ref text={a.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Where this module surfaces
        </h3>
        <ul className="mt-2 space-y-1">
          {B12_WHERE_IT_SURFACES.map((w) => (
            <li key={w.sourceRef} data-testid="fl-b12-surfaces" className="text-sm">
              <span className="text-[var(--color-ink)]">{w.place}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{w.what}</span>{' '}
              <Ref text={w.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <Disclosures />
    </div>
  )
}
