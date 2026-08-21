'use client'

import { useState } from 'react'
import type { RunPlayerPanel } from '../../../../app/frontline/run-player/RunPlayerRoute'
import { CrossSurfaceAct, frontlineCrossSurfaceModel } from '@/frontline/cross-surface'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { Button, StatusPill } from '@/ui/primitives'
import {
  B11_CARD,
  B11_CLAIMS_NEVER_MADE,
  B11_FOUR_RUN_STATES,
  B11_STATES,
  B11_STATES_ONLY_STATED,
  B11_SUPERVISOR_VISIBILITY,
  SB_FL_020,
} from './charter'
import {
  B11_BARE_TOKEN_CELLS,
  B11_ELLIPTICAL_CELLS,
  B11_ELSEWHERE_PERMISSIVE_CELLS,
  isB11InvariantExcluded,
  FL_B11_COLUMNS,
  FL_B11_COLUMN_HEADINGS,
  FL_B11_MATRIX,
  FL_B11_SHAPE,
  b11Row,
  type FlB11Column,
  type FlB11MatrixRow,
  type FlB11RowId,
} from './matrix'
import {
  B11_ACCEPTANCE_CRITERIA,
  B11_DISCLOSURES,
  B11_FUNCTIONALITIES,
  B11_FUNCTIONALITIES_NAMING_NO_PATTERN,
  B11_HANDOVER_ELEMENTS,
  B11_MAPPED_PATTERNS,
  B11_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B11_PATTERN_DIVERGENCE,
  B11_SOURCE_FINDINGS,
  B11_SUBSTITUTE_NEVER_RECEIVES,
  B11_SUBSTITUTION_COMMAND,
  B11_VIEW_NAMES,
  applySubstitution,
  atStepExpiry,
  departureFlag,
  pause,
} from './service'

/**
 * `MOD-FL-B11` — Worker Lifecycle on Device. The Run Player panel.
 *
 * §22.7 gives this module exactly two of its twenty-three rows and both are
 * states of the Run Player: `SCR-FL-22`, the step-away and hand-back sheet
 * (L39884), and `SCR-FL-23`, the substitution handover state (L39885). The
 * controller wires this export into that route; nothing under `app/` is
 * created or edited here.
 *
 * EVERY CONTROL ON THIS PANEL IS DECIDED BY `frontlineAffordance` AND NONE IS
 * DECIDED AROUND IT. The matrix draws four controls across its fifty cells and
 * this panel draws exactly those four, all four the Worker's: pause the
 * worker's own session, step away, hand back, and receive the structured
 * handover state. `FrontlineAffordance` has no `disabled` member, so a refused
 * act renders as no control plus a stated line — never a greyed-out button,
 * which on this surface would imply a condition that could become true.
 *
 * THE CONTROL THIS PANEL IS MOST ABLE TO SHIP IS THE ONE IT MUST NOT. A worker
 * who can "complete" anything here is the defect: `worker-finished`,
 * `submitted`, `complete` and `finished` are four different states, one of
 * which the device reaches and three of which it does not, and cancellation
 * and terminal completion are not on this device at all. The four are printed
 * with who reaches each, so an absence a reader cannot see becomes a statement
 * they can.
 *
 * EVERY CELL PRINTS ITS OWN WORDS BESIDE THE FOLD'S VERDICT, and that is not
 * decoration. Wave 0's fold returns the ROW's cross-surface note for every
 * cell of a cross-surface row, so a table that printed only the verdict would
 * lose the eight permissive cells that are the whole point of rows 5, 6, 7 and
 * 10 — and the two reasons row 2 gives for one prohibition. Wave 0 says what
 * to do instead: "the token is not corrected, downgraded or hidden ... What is
 * refused is the CONTROL."
 */

const ROW_BY_ID: Readonly<Record<FlB11RowId, FlB11MatrixRow>> = Object.fromEntries(
  FL_B11_MATRIX.map((r) => [r.id, r]),
) as Readonly<Record<FlB11RowId, FlB11MatrixRow>>

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
      return `${a.note} That act is row "${ROW_BY_ID[a.toRowId as FlB11RowId].control}" of this matrix.`
    case 'stated-line':
      return a.line
  }
}

function Ref({ text }: { readonly text: string }) {
  return <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">[{text}]</span>
}

/* ── SCR-FL-22: the step-away and hand-back sheet ──────────────────── */

function DepartureSheet({ viewerRole }: { readonly viewerRole: FlB11Column }) {
  const [taken, setTaken] = useState<'step-away' | 'hand-back' | null>(null)
  const [online, setOnline] = useState(true)
  const stepAway = frontlineAffordance(b11Row('step-away'), viewerRole)
  const handBack = frontlineAffordance(b11Row('hand-back'), viewerRole)
  const paused = pause('device lock')

  return (
    <section aria-label="Step away and hand back">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Leaving the station
      </h4>

      <p data-testid="fl-b11-pause" className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
        {paused.line} {paused.resumeBy} <Ref text={paused.sourceRef} />
      </p>

      {stepAway.kind === 'control' && handBack.kind === 'control' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setTaken('step-away')}>
            Step away from this run
          </Button>
          <Button variant="secondary" onClick={() => setTaken('hand-back')}>
            Hand back this run
          </Button>
          <Button variant="secondary" onClick={() => setOnline((v) => !v)}>
            {online ? 'Show this with no connection' : 'Show this with a connection'}
          </Button>
        </div>
      ) : (
        <p
          data-testid="fl-b11-no-departure-control"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {b11Row('step-away').control} — no control is drawn for the{' '}
          {FL_B11_COLUMN_HEADINGS[viewerRole]}. {affordanceWords(stepAway)} The same is true of{' '}
          {b11Row('hand-back').control.toLowerCase()}: {affordanceWords(handBack)}
        </p>
      )}

      {taken === null ? null : (
        <div className="mt-2">
          {(() => {
            const flag = departureFlag(taken, online)
            return (
              <p
                data-testid="fl-b11-flag"
                data-kind={flag.kind}
                data-delivered={String(flag.delivered)}
                className="max-w-prose text-sm text-[var(--color-ink)]"
              >
                {flag.line} {flag.notThis} {flag.difference} <Ref text={flag.sourceRef} />
              </p>
            )
          })()}
        </div>
      )}

      <p
        data-testid="fl-b11-supervisor-visibility"
        className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {B11_SUPERVISOR_VISIBILITY.what}, {B11_SUPERVISOR_VISIBILITY.why}, and{' '}
        {B11_SUPERVISOR_VISIBILITY.mitigation}.{' '}
        <Ref text={B11_SUPERVISOR_VISIBILITY.sourceRef} />
      </p>
    </section>
  )
}

/* ── the four run states, which are four and not one ───────────────── */

function FourRunStates() {
  return (
    <section aria-label="The four run states">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Four different states, and this device reaches one of them
      </h4>
      <ul className="mt-2 space-y-2">
        {B11_FOUR_RUN_STATES.map((s) => (
          <li key={s.state} data-testid="fl-b11-run-state" data-state={s.state} className="text-sm">
            <span className="text-[var(--color-ink)]">{s.state}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{s.what}</span>{' '}
            <StatusPill tone="info" icon="•" label={`reached by ${s.reachedBy}`} />{' '}
            <Ref text={s.sourceRef} />
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Nothing on this panel is labelled with any of the four. No interface here permits a worker
        to cancel or terminally complete a Run, and a departure is not a completion.{' '}
        <Ref text="AC-B11-3 · L42070" />
      </p>
    </section>
  )
}

/* ── SCR-FL-23: the substitution handover state ────────────────────── */

function HandoverState({ viewerRole }: { readonly viewerRole: FlB11Column }) {
  const [applied, setApplied] = useState(false)
  const receive = frontlineAffordance(b11Row('receive-handover-state'), viewerRole)
  const outcome = applySubstitution({
    commandClass: 'CMD-FL-REASSIGN',
    commandState: applied ? 'applied' : 'delivered',
    deviceHoldsTheRun: true,
    previousWorker: 'Maya',
  })
  const noRun = applySubstitution({
    commandClass: 'CMD-FL-REASSIGN',
    commandState: 'applied',
    deviceHoldsTheRun: false,
    previousWorker: 'Maya',
  })

  return (
    <section aria-label="The substitution handover state">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Picking up somebody else&rsquo;s work
      </h4>

      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        A substitution is initiated in the Delivery Operations Hub and arrives here as{' '}
        {B11_SUBSTITUTION_COMMAND?.id ?? 'a command'} —{' '}
        {B11_SUBSTITUTION_COMMAND?.effectOnDevice ?? ''} This device is the recipient and never the
        originator. <Ref text={B11_SUBSTITUTION_COMMAND?.sourceRef ?? 'L39663'} />
      </p>

      {receive.kind === 'control' ? (
        <>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => setApplied((v) => !v)}>
              {applied ? 'Show this before the command applies' : 'Apply the substitution command'}
            </Button>
          </div>
          <div className="mt-2" data-testid="fl-b11-handover" data-applied={String(outcome.applied)}>
            {outcome.applied ? (
              <>
                <p className="text-sm font-medium text-[var(--color-ink)]">{outcome.heading}</p>
                <ul className="mt-1 space-y-1">
                  {outcome.elements.map((e) => (
                    <li
                      key={e}
                      data-testid="fl-b11-handover-element"
                      className="text-sm text-[var(--color-ink)]"
                    >
                      {e}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{outcome.attribution}</p>
                <p className="mt-2">
                  <Button variant="primary">{outcome.forwardControl}</Button>
                </p>
                <p className="mt-1">
                  <Ref text={outcome.sourceRef} />
                </p>
              </>
            ) : (
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {outcome.reason} <Ref text={outcome.sourceRef} />
              </p>
            )}
          </div>
        </>
      ) : (
        <p
          data-testid="fl-b11-no-handover-control"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {b11Row('receive-handover-state').control} — nothing is drawn here for the{' '}
          {FL_B11_COLUMN_HEADINGS[viewerRole]}. {affordanceWords(receive)}
        </p>
      )}

      <p
        data-testid="fl-b11-substitute-never"
        className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {B11_SUBSTITUTE_NEVER_RECEIVES} All {B11_HANDOVER_ELEMENTS.length} elements of the handover
        state are presented before the substitute&rsquo;s first capture.{' '}
        <Ref text="AC-B11-4 · L42071" />
      </p>

      <p
        data-testid="fl-b11-typed-rejection"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {noRun.applied ? '' : noRun.reason} <Ref text={noRun.applied ? '' : noRun.sourceRef} />
      </p>

      <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        {SB_FL_020.id} — {SB_FL_020.heading}. {SB_FL_020.frame1} {SB_FL_020.frame2}{' '}
        {SB_FL_020.frame3} {SB_FL_020.frame4} <Ref text={SB_FL_020.sourceRef} />
      </p>
    </section>
  )
}

/* ── at-step certification-expiry enforcement ──────────────────────── */

function ExpiryEnforcement() {
  const current = atStepExpiry({ certificationExpired: false, atAGatedStep: true })
  const midRun = atStepExpiry({ certificationExpired: true, atAGatedStep: false })
  const blocked = atStepExpiry({ certificationExpired: true, atAGatedStep: true })

  return (
    <section aria-label="At-step certification-expiry enforcement">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        When a certification runs out mid-Run
      </h4>
      <ul className="mt-2 space-y-2">
        {[current, midRun, blocked].map((o, i) => (
          <li
            key={o.sourceRef + String(i)}
            data-testid="fl-b11-expiry"
            data-blocked={String(o.blocked)}
            className="text-sm"
          >
            <span className="text-[var(--color-ink)]">{o.line}</span> <Ref text={o.sourceRef} />
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The evaluation is local and does not change with the connection, and the enforcement posture
        it applies is the tenant&rsquo;s, set elsewhere and applied here without device-side
        variation. There is no worker override on this device.{' '}
        <Ref text="FUNC-B11-04-1-2 · L42030" />
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
        {B11_CARD.map((s) => (
          <div key={s.field} data-testid="fl-b11-card-statement">
            <dt className="text-sm font-medium text-[var(--color-ink)]">{s.field}</dt>
            <dd className="text-sm text-[var(--color-ink-muted)]">
              {s.text}{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{s.sourceRef}
                {s.sourceClass === null
                  ? ' · the card carries no classification marker for this field'
                  : ` · ${s.sourceClass}`}
                ]
              </span>
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
    <section aria-label="The states this module names">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        States
      </h4>
      <ul className="mt-2 space-y-2">
        {B11_STATES.map((s) => (
          <li key={s.id} data-testid="fl-b11-state" data-driven={String(s.drivenHere)}>
            <span className="text-sm text-[var(--color-ink)]">{s.id}</span>{' '}
            <span className="text-sm text-[var(--color-ink-muted)]">
              {s.gloss === null
                ? 'The source names this state and gives it no description of its own.'
                : s.gloss}
            </span>{' '}
            <StatusPill
              tone={s.drivenHere ? 'info' : 'stale'}
              icon={s.drivenHere ? '•' : '~'}
              label={s.drivenHere ? 'driven on this panel' : 'stated here, driven next slice'}
            />{' '}
            <Ref text={s.sourceRef} />
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The source glosses exactly one of the {B11_STATES.length} and leaves{' '}
        {B11_STATES.length - 1} bare. The one it glosses carries the rule the whole module turns on:
        a pause is at the worker-session level only. {B11_STATES_ONLY_STATED.length} of the{' '}
        {B11_STATES.length} is stated here rather than driven, because the expiry block that reaches
        it depends on the tenant posture and the clearance channel the next slice builds.
      </p>
    </section>
  )
}

/* ── the matrix ────────────────────────────────────────────────────── */

function MatrixTable({ viewerRole }: { readonly viewerRole: FlB11Column }) {
  return (
    <section aria-label="Permission matrix">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Who may do what, all {FL_B11_SHAPE.cells} cells
      </h4>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {B11_BARE_TOKEN_CELLS.length} of the {FL_B11_SHAPE.cells} cells say nothing but their token,
        so every row carries the sentence from the source that says why, with its own locator.
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b p-2 align-bottom font-medium">
                Action
              </th>
              {FL_B11_COLUMNS.map((c) => (
                <th key={c} scope="col" className="border-b p-2 align-bottom font-medium">
                  {FL_B11_COLUMN_HEADINGS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FL_B11_MATRIX.map((row) => (
              <tr key={row.id} data-testid="fl-b11-row">
                <th scope="row" className="border-b p-2 align-top font-normal">
                  <span className="text-[var(--color-ink)]">{row.control}</span>
                  {isB11InvariantExcluded(row.id) ? (
                    <span
                      data-testid="fl-b11-invariant-row"
                      className="mt-1 block text-xs text-[var(--color-ink)]"
                    >
                      An invariant exclusion. Worker-initiated Run cancellation or terminal
                      completion is excluded on the ground of segregation of duties, and the
                      exclusion is classified Invariant — so a control here would be a broken
                      guarantee rather than a button in the wrong place. <Ref text="EXCL-FL-06 · L39489" />
                    </span>
                  ) : null}
                  <span
                    data-testid="fl-b11-row-why"
                    className="mt-1 block text-xs text-[var(--color-ink-muted)]"
                  >
                    {row.why} <Ref text={row.whyRef} />
                  </span>
                  <span className="mt-1 block">
                    <Ref text={row.sourceRef} />
                  </span>
                </th>
                {FL_B11_COLUMNS.map((column) => {
                  const drawn = frontlineAffordance(row, column)
                  return (
                    <td
                      key={column}
                      data-testid="fl-b11-cell"
                      data-row={row.id}
                      data-column={column}
                      data-kind={drawn.kind}
                      className="border-b p-2 align-top"
                    >
                      <span className="block text-xs font-medium text-[var(--color-ink-subtle)]">
                        {KIND_LABEL[drawn.kind]}
                      </span>
                      <span
                        data-testid="fl-b11-cell-own-words"
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

      {FL_B11_MATRIX.map((row) => {
        const met = row.metElsewhere
        // Annotated rather than inferred, for the reason `fl-a6` recorded: every
        // row of the const-asserted matrix carries a literal type, so the four
        // cross-surface rows have `metElsewhereRef` as a string LITERAL, which
        // makes the `??` below an unreachable branch and narrows `row` to
        // `never` inside it. The annotation keeps both branches live; the unit
        // suite asserts no cross-surface row ever reaches the fallback.
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
          The {B11_ELSEWHERE_PERMISSIVE_CELLS.length} cells that read permissively for an act this
          device does not carry
        </p>
        <ul className="mt-1 space-y-1">
          {B11_ELSEWHERE_PERMISSIVE_CELLS.map((c) => (
            <li
              key={`${c.rowId}.${c.column}`}
              data-testid="fl-b11-elsewhere-cell"
              className="text-sm"
            >
              <span className="text-[var(--color-ink)]">
                {ROW_BY_ID[c.rowId].control} — {FL_B11_COLUMN_HEADINGS[c.column]}
              </span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.note}</span>{' '}
              <Ref text={c.sourceRef} />
            </li>
          ))}
        </ul>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {B11_ELLIPTICAL_CELLS.length} of those {B11_ELSEWHERE_PERMISSIVE_CELLS.length} name no
          surface of their own — they read only &ldquo;&mdash; same&rdquo; and inherit it from the
          cell beside them. That is why the classification is declared on the row and never read off
          a cell&rsquo;s wording.
        </p>
      </div>
    </section>
  )
}

/* ── functionalities and the fallback obligation ───────────────────── */

function Functionalities() {
  return (
    <section aria-label="Functionalities and their fallback patterns">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The {B11_FUNCTIONALITIES.length} functionalities, and the pattern each one names
      </h4>
      <ul className="mt-2 space-y-2">
        {B11_FUNCTIONALITIES.map((f) => (
          <li key={f.id} data-testid="fl-b11-functionality" className="text-sm">
            <span className="text-[var(--color-ink)]">{f.statement}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              {f.rolesAllowed}{' '}
              {f.rolesProhibited ??
                'The source states no roles-prohibited clause for this functionality.'}{' '}
              {f.connectivity} {f.fallbackClause}
            </span>{' '}
            <Ref text={f.sourceRef} />
          </li>
        ))}
      </ul>
      <p
        data-testid="fl-b11-pattern-gap"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {B11_FUNCTIONALITIES_NAMING_NO_PATTERN.length} of the {B11_FUNCTIONALITIES.length} name no
        fallback pattern at all — {B11_FUNCTIONALITIES_NAMING_NO_PATTERN.join(' and ')} — and each
        one gives its own ground in the same clause. The criterion asks every functionality in the
        chapter to name at least one. They are reported here rather than filled: an assigned pattern
        is indistinguishable from a real one afterwards. <Ref text="AC-FL-011-1 · L40151" />
      </p>
      <p
        data-testid="fl-b11-three-readings"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {B11_PATTERN_DIVERGENCE.note} The map gives {B11_MAPPED_PATTERNS.length}:{' '}
        {B11_MAPPED_PATTERNS.map((p) => p.id).join(', ')}. The card gives{' '}
        {B11_PATTERN_DIVERGENCE.fromTheCardsFallbackLine.length}:{' '}
        {B11_PATTERN_DIVERGENCE.fromTheCardsFallbackLine.join(', ')}. The functionalities name{' '}
        {B11_PATTERNS_NAMED_BY_FUNCTIONALITIES.length}:{' '}
        {B11_PATTERNS_NAMED_BY_FUNCTIONALITIES.join(', ')}.{' '}
        <Ref text={B11_PATTERN_DIVERGENCE.divergenceRefs} />
      </p>
      <div className="mt-2">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Every pattern the map gives this module, and the terminal safe state each one names
        </p>
        <ul className="mt-1 space-y-1">
          {B11_MAPPED_PATTERNS.map((p) => (
            <li key={p.id} data-testid="fl-b11-terminal-safe-state" className="text-sm">
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

/* ── disclosures ───────────────────────────────────────────────────── */

function Disclosures() {
  return (
    <section aria-label="Open decisions this module discloses">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Open decisions
      </h4>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        This module&rsquo;s section of the source names no decision identifier anywhere. All four
        below are reached from outside it, and each says by which sentence.
      </p>
      {B11_DISCLOSURES.map((d) => (
        <div
          key={d.decisionRef}
          role="note"
          data-testid="fl-b11-disclosure"
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
              <li key={r.locator + r.text.slice(0, 24)} data-testid="fl-b11-reading">
                <span className="text-[var(--color-ink)]">{r.text}</span> <Ref text={r.locator} />
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

/* ── the view ──────────────────────────────────────────────────────── */

export function WorkerLifecycleView({
  viewerRole = 'WORKER',
}: {
  readonly viewerRole?: FlB11Column
}) {
  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        Rendered for the {FL_B11_COLUMN_HEADINGS[viewerRole]} column. Four of this
        module&rsquo;s ten rows draw anything at all, all four the Worker&rsquo;s, and four of the
        remaining six describe an act held on another surface — the densest such block in this
        surface&rsquo;s twelve matrices.
      </p>

      <DepartureSheet viewerRole={viewerRole} />
      <HandoverState viewerRole={viewerRole} />
      <FourRunStates />
      <ExpiryEnforcement />
      <Card />
      <States />
      <MatrixTable viewerRole={viewerRole} />
      <Functionalities />

      <section aria-label="What this module never claims">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module never claims
        </h4>
        <ul className="mt-2 space-y-2">
          {B11_CLAIMS_NEVER_MADE.map((c) => (
            <li key={c.sourceRef} data-testid="fl-b11-never-claimed" className="text-sm">
              <span className="text-[var(--color-ink)]">{c.claim}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.instead}</span>{' '}
              <Ref text={c.sourceRef} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Acceptance criteria">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module has to be true
        </h4>
        <ul className="mt-2 space-y-1">
          {B11_ACCEPTANCE_CRITERIA.map((a) => (
            <li key={a.id} data-testid="fl-b11-acceptance" className="text-sm">
              <span className="text-[var(--color-ink)]">{a.text}</span> <Ref text={a.sourceRef} />
            </li>
          ))}
        </ul>
      </section>

      <Disclosures />

      <section aria-label="Findings recorded rather than closed">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Findings, recorded rather than closed
        </h4>
        <ul className="mt-2 space-y-2">
          {B11_SOURCE_FINDINGS.map((f) => (
            <li key={f.sourceRef} data-testid="fl-b11-finding" className="text-sm">
              <span className="text-[var(--color-ink)]">{f.what}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{f.evidence}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{f.notClosedBecause}</span>{' '}
              <Ref text={f.sourceRef} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/**
 * The value the Run Player route mounts. The route file is the spine task's
 * and is not edited here; this module exports a panel and the controller wires
 * it in.
 */
export const FL_B11_PANEL: RunPlayerPanel = {
  module: 'MOD-FL-B11',
  heading: 'Worker Lifecycle on Device',
  rendersViews: B11_VIEW_NAMES,
  body: <WorkerLifecycleView />,
}
