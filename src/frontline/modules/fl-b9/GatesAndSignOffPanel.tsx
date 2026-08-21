'use client'

import { useState } from 'react'
import type { RunPlayerPanel } from '../../../../app/frontline/run-player/RunPlayerRoute'
import {
  CrossSurfaceAct,
  frontlineCrossSurfaceModel,
} from '@/frontline/cross-surface'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { FL_OVERLAY_ON_ANY_DESTINATION, FL_PLAYER_VIEWS } from '@/frontline/screens'
import { Button, StatusPill } from '@/ui/primitives'
import {
  B9_CARD,
  B9_CLAIMS_NEVER_MADE,
  B9_STATES,
  B9_STATES_SOURCE_REF,
  GATE_IS_IDENTICAL_OFFLINE,
  SAFETY_LAYER,
  SB_FL_018,
} from './charter'
import {
  B9_COLUMNS,
  B9_COLUMN_HEADINGS,
  B9_GENUINE_NON_WORKER_CONTROLS,
  B9_MATRIX,
  B9_SHAPE,
  b9Row,
  type B9Column,
} from './matrix'
import {
  B9_ACCEPTANCE_CRITERIA,
  B9_DISCLOSURES,
  B9_FUNCTIONALITIES,
  B9_MAPPED_PATTERNS,
  B9_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B9_PATTERN_DIVERGENCE,
  B9_SOURCE_FINDINGS,
  CH4_AGAINST_CH22_ON_GATE_OVERRIDE,
  clearanceApplication,
  gateEvaluation,
  signOffReadiness,
} from './service'

/**
 * `MOD-FL-B9` — Gates and Sign-Off Authority. The Run Player panel.
 *
 * EVERY CONTROL ON THIS PANEL IS DECIDED BY `frontlineAffordance` AND NONE IS
 * DECIDED AROUND IT. The matrix draws exactly four controls across its
 * forty-five cells and this panel draws exactly those four: the worker's
 * single control out of a gate block, the Supervisor's and the Quality
 * Manager's sign-off authorisation, and the Quality Manager's substitute
 * sign-off. Three of the four are non-Worker, which on this surface is the
 * exception rather than the rule and is the trap this module exists inside.
 *
 * THE TENANT POSTURE AND THE ARRIVING CLEARANCE ARE STATEMENTS, NOT CONTROLS,
 * AND THAT IS DELIBERATE. Both postures are rendered and neither is switchable
 * here: the posture is set in the Delivery Operations Hub (row 4, L41621) and
 * a switch on this screen would be the configuration control `AC-SCOPE-040`
 * (L2683) forbids. Both clearance outcomes are rendered and neither is
 * triggerable here: a clearance arrives on the command channel as
 * `CMD-FL-CLEAR` and the device is its recipient (L39670).
 *
 * THE STEP-UP SHEET IS NOT DRAWN HERE. `MOD-FL-A1` owns it and §22.7 gives it
 * "Overlay on any destination" (L39865), so authorising raises A1's overlay
 * over this destination rather than opening a panel of it. The pointer is read
 * from wave 0's `FL_OVERLAY_ON_ANY_DESTINATION`, never re-spelled.
 *
 * THE PANEL LEADS WITH THE OFFLINE STATEMENT. The qualification gate is part
 * of the deterministic layer L40948 protects and L41652 says it is enforced
 * locally exactly as online. Slice 7 does not simulate offline; a panel that
 * waited for slice 8 would spend a slice implying the gate needs a network.
 */

const B9_VIEW_NAMES: readonly string[] = FL_PLAYER_VIEWS.filter(
  (v) => v.id === 'SCR-FL-14' || v.id === 'SCR-FL-15',
).map((v) => v.name)

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
      // Unreachable for this matrix: no cell here names another row in its own
      // words, so `routedTo` is empty on all nine and the fold never returns
      // this. The branch exists because the union has the member, and it
      // names the row id rather than looking it up — a lookup would need a
      // cast past `toRowId: string`, and a cast to make a dead branch read
      // nicely is how a dead branch stops being dead safely.
      return `${a.note} That act is row "${a.toRowId}" of this matrix.`
    case 'stated-line':
      return a.line
  }
}

function GateBlock({ viewerRole }: { readonly viewerRole: B9Column }) {
  const [movedOn, setMovedOn] = useState(false)
  const blocked = gateEvaluation(false, 'strict')
  const notified = gateEvaluation(false, 'lenient')
  const drawn = frontlineAffordance(b9Row('be-blocked-at-gate'), viewerRole)

  return (
    <section aria-label="A gate block, and the parked Run">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        A gate block, and the parked Run
      </h4>

      <p
        data-testid="fl-b9-offline-statement"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {GATE_IS_IDENTICAL_OFFLINE.text}{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{GATE_IS_IDENTICAL_OFFLINE.sourceRef}]
        </span>{' '}
        <span className="text-[var(--color-ink-muted)]">{SAFETY_LAYER.reason}</span>{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{SAFETY_LAYER.sourceRef}]
        </span>
      </p>

      <div
        data-testid="fl-b9-storyboard"
        data-state={movedOn ? blocked.parks : blocked.state}
        className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="text-base font-semibold text-[var(--color-ink)]">{SB_FL_018.heading}</p>
        <p className="mt-1 text-sm text-[var(--color-ink)]">{SB_FL_018.requirement}</p>
        <p className="mt-1 text-sm text-[var(--color-ink)]">{SB_FL_018.parked}</p>
        {drawn.kind === 'control' ? (
          <div className="mt-3">
            <Button onClick={() => setMovedOn(true)}>{SB_FL_018.control}</Button>
          </div>
        ) : (
          <p
            data-testid="fl-b9-no-block-control"
            className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
          >
            {b9Row('be-blocked-at-gate').control} — no control is drawn for the{' '}
            {B9_COLUMN_HEADINGS[viewerRole]}. {affordanceWords(drawn)}
          </p>
        )}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-muted)]">
          {SB_FL_018.absent}{' '}
          <span className="whitespace-nowrap text-[var(--color-ink-subtle)]">
            [{SB_FL_018.sourceRef}]
          </span>
        </p>
        {movedOn ? (
          <p data-testid="fl-b9-parked" className="mt-2 text-sm text-[var(--color-ink)]">
            This Run stays set aside until a clearance reaches this tablet or the
            certification is put right. Nothing on this tablet can release it.
          </p>
        ) : null}
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          What the gate does under each tenant posture
        </p>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-muted)]">
          Both are stated and neither is switchable here. The posture is a tenant-level
          setting in the Delivery Operations Hub, and this application exposes no
          configuration control at all.{' '}
          <span className="whitespace-nowrap text-[var(--color-ink-subtle)]">
            [L41621 · AC-SCOPE-040 L2683]
          </span>
        </p>
        <ul className="mt-2 space-y-1">
          {[blocked, notified].map((e) => (
            <li key={e.state} data-testid="fl-b9-posture" data-state={e.state} className="text-sm">
              <span className="text-[var(--color-ink)]">{e.state}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{e.line}</span>{' '}
              {e.parks === null ? null : (
                <StatusPill tone="stale" icon="~" label={`then ${e.parks}`} />
              )}{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{e.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          What happens when a clearance reaches this tablet
        </p>
        <ul className="mt-2 space-y-1">
          {[false, true].map((expired) => {
            const c = clearanceApplication({ alreadyExpiredOnArrival: expired })
            return (
              <li key={c.state} data-testid="fl-b9-clearance" data-state={c.state} className="text-sm">
                <span className="text-[var(--color-ink)]">{c.state}</span>{' '}
                <span className="text-[var(--color-ink-muted)]">{c.reason}</span>{' '}
                <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                  [{c.sourceRef}]
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function SignOff({ viewerRole }: { readonly viewerRole: B9Column }) {
  const [signed, setSigned] = useState<'none' | 'STATE-B9-SIGNED' | 'STATE-B9-SUBSTITUTESIGNED'>(
    'none',
  )
  const authorise = frontlineAffordance(b9Row('authorise-sign-off'), viewerRole)
  const substitute = frontlineAffordance(b9Row('substitute-sign-off'), viewerRole)
  const online = signOffReadiness(true)
  const offline = signOffReadiness(false)

  return (
    <section aria-label="The sign-off, and who may authorise it">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The sign-off, and who may authorise it
      </h4>

      <p data-testid="fl-b9-forced-sync" className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
        {online.line}{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{online.sourceRef}]
        </span>
      </p>
      <p
        data-testid="fl-b9-sign-off-offline"
        className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {offline.line}{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{offline.sourceRef}]
        </span>
      </p>

      <p
        data-testid="fl-b9-step-up-pointer"
        className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        The credential is entered on the {FL_OVERLAY_ON_ANY_DESTINATION.name}, which belongs to
        MOD-FL-A1 and whose own Destination column reads &ldquo;
        {FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn}&rdquo;. It is raised over whichever
        destination the worker is standing on rather than being a panel of this one, and the
        worker&rsquo;s session is not ended by it.{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{FL_OVERLAY_ON_ANY_DESTINATION.sourceRef} · L41660 · AC-B9-6 L41751]
        </span>
      </p>

      <div className="mt-3 space-y-3">
        <div data-testid="fl-b9-authorise" data-kind={authorise.kind}>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            {b9Row('authorise-sign-off').control}
          </p>
          {authorise.kind === 'control' ? (
            <div className="mt-2">
              <Button onClick={() => setSigned('STATE-B9-SIGNED')}>
                Authorise this sign-off as the {B9_COLUMN_HEADINGS[viewerRole]}
              </Button>
            </div>
          ) : (
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              No control is drawn for the {B9_COLUMN_HEADINGS[viewerRole]}.{' '}
              {affordanceWords(authorise)}
            </p>
          )}
        </div>

        <div data-testid="fl-b9-substitute" data-kind={substitute.kind}>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            {b9Row('substitute-sign-off').control}
          </p>
          {substitute.kind === 'control' ? (
            <div className="mt-2">
              <Button
                variant="secondary"
                onClick={() => setSigned('STATE-B9-SUBSTITUTESIGNED')}
              >
                Sign in place of the unavailable supervisor
              </Button>
            </div>
          ) : (
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              No control is drawn for the {B9_COLUMN_HEADINGS[viewerRole]}.{' '}
              {affordanceWords(substitute)}
            </p>
          )}
        </div>
      </div>

      {signed === 'none' ? null : (
        <div data-testid="fl-b9-signed" data-state={signed} className="mt-3 space-y-1">
          <p className="text-sm text-[var(--color-ink)]">
            {signed === 'STATE-B9-SIGNED'
              ? 'Recorded as STATE-B9-SIGNED, carrying the authorising identity captured at the moment of sign-off, against that authorisation only. The worker’s session was not ended and the second identity is released.'
              : 'Recorded as STATE-B9-SUBSTITUTESIGNED, carrying who signed, in lieu of whom, and why, with a notification raised to the Supervisor and the Quality Manager. It is never a silent skip.'}{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{signed === 'STATE-B9-SIGNED' ? 'L41646 · L41632' : 'L41632 · AC-B9-7 L41752'}]
            </span>
          </p>
          {signed === 'STATE-B9-SUBSTITUTESIGNED' ? (
            <p
              data-testid="fl-b9-substitute-record"
              className="max-w-prose text-xs text-[var(--color-ink-muted)]"
            >
              The three fields the record carries are the source&rsquo;s: who signed, in lieu of
              whom, and why. The source gives no worked example of a substitute sign-off, so no
              names are shown here — the fields are named and left unfilled rather than
              populated with invented ones.{' '}
              <span className="whitespace-nowrap text-[var(--color-ink-subtle)]">[L41632]</span>
            </p>
          ) : null}
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {B9_GENUINE_NON_WORKER_CONTROLS.map((g) => (
          <li key={g.rowId} data-testid="fl-b9-genuine-control" className="text-sm">
            <span className="text-[var(--color-ink)]">
              {b9Row(g.rowId).control} — {g.columns.map((c) => B9_COLUMN_HEADINGS[c]).join(' and ')}
            </span>{' '}
            <span className="text-[var(--color-ink-muted)]">{g.why}</span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{g.sourceRef}]
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Card() {
  return (
    <section aria-label="What the source says this module is">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The module card, transcribed
      </h4>
      <dl className="mt-2 space-y-3">
        {B9_CARD.map((s) => (
          <div key={s.id} data-testid="fl-b9-card-statement" data-on-card={String(s.onTheCard)}>
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

function States() {
  return (
    <section aria-label="The states this module names">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        States
      </h4>
      <ul className="mt-2 space-y-1">
        {B9_STATES.map((s) => (
          <li key={s.id} data-testid="fl-b9-state" className="text-sm">
            <span className="text-[var(--color-ink)]">{s.id}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              {s.gloss === null
                ? 'The source names this state and gives it no description of its own.'
                : s.gloss}
            </span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{B9_STATES_SOURCE_REF}]
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        All {B9_STATES.length} are this device&rsquo;s own. None of them is a fleet rendering
        the Client Command Center holds, so nothing on this timeline claims knowledge a
        pull-based device cannot have.
      </p>
    </section>
  )
}

function MatrixTable({ viewerRole }: { readonly viewerRole: B9Column }) {
  return (
    <section aria-label="Permission matrix">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Who may do what, all {B9_SHAPE.cells} cells
      </h4>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b p-2 align-bottom font-medium">
                Action
              </th>
              {B9_COLUMNS.map((c) => (
                <th key={c} scope="col" className="border-b p-2 align-bottom font-medium">
                  {B9_COLUMN_HEADINGS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {B9_MATRIX.map((row) => (
              <tr key={row.id} data-testid="fl-b9-row">
                <th scope="row" className="border-b p-2 align-top font-normal">
                  <span className="text-[var(--color-ink)]">{row.control}</span>
                  <span
                    data-testid="fl-b9-row-why"
                    className="mt-1 block text-xs text-[var(--color-ink-muted)]"
                  >
                    {row.why}{' '}
                    <span className="whitespace-nowrap text-[var(--color-ink-subtle)]">
                      [{row.whyRef}]
                    </span>
                  </span>
                  <span className="mt-1 block whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                    [{row.sourceRef}]
                  </span>
                </th>
                {B9_COLUMNS.map((column) => {
                  const drawn = frontlineAffordance(row, column)
                  return (
                    <td
                      key={column}
                      data-testid="fl-b9-cell"
                      data-row={row.id}
                      data-column={column}
                      data-kind={drawn.kind}
                      className="border-b p-2 align-top"
                    >
                      <span className="block text-xs font-medium text-[var(--color-ink-subtle)]">
                        {KIND_LABEL[drawn.kind]}
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

      {B9_MATRIX.filter((r) => r.metElsewhere !== null).map((row) => {
        const met = row.metElsewhere
        if (met === null || met.where !== 'another-surface') return null
        return (
          <div key={row.id} className="mt-3">
            <CrossSurfaceAct
              model={frontlineCrossSurfaceModel(
                {
                  capability: row.control,
                  owningSurface: met.surface,
                  whatHappensThere: met.note,
                  sourceRef: row.sourceRef,
                },
                viewerRole,
              )}
            />
          </div>
        )
      })}
    </section>
  )
}

function Functionalities() {
  const gaps = B9_FUNCTIONALITIES.filter((f) => f.patterns.length === 0)
  return (
    <section aria-label="Functionalities and their fallback patterns">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The {B9_FUNCTIONALITIES.length} functionalities, and the pattern each one names
      </h4>
      <ul className="mt-2 space-y-2">
        {B9_FUNCTIONALITIES.map((f) => (
          <li key={f.id} data-testid="fl-b9-functionality" className="text-sm">
            <span className="text-[var(--color-ink)]">{f.statement}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              {f.rolesAllowed} {f.connectivity} {f.fallbackClause}
            </span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{f.id} · {f.sourceRef}]
            </span>
          </li>
        ))}
      </ul>
      <p
        data-testid="fl-b9-ac-fl-011-1-gap"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        AC-FL-011-1 asks every functionality in chapter 22 to name at least one FB-FL-*
        pattern. {gaps.length} of this module&rsquo;s {B9_FUNCTIONALITIES.length} names none:{' '}
        {gaps.map((f) => f.id).join(', ')}. The source states the ground itself in the clause
        before — the functionality is enforced on the Client Command Center and not on the
        device, so it has no failure mode here to fall back from. Nothing is assigned to close
        it, because an assigned pattern is indistinguishable from a real one forever
        afterwards.{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [AC-FL-011-1 · L40151 · the gap at L41693]
        </span>
      </p>
      <p
        data-testid="fl-b9-pattern-divergence"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {B9_PATTERN_DIVERGENCE.note} The map names{' '}
        {B9_MAPPED_PATTERNS.map((p) => p.id).join(', ')}; the functionalities name{' '}
        {B9_PATTERNS_NAMED_BY_FUNCTIONALITIES.join(', ')}.{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{B9_PATTERN_DIVERGENCE.sourceRef}]
        </span>
      </p>
    </section>
  )
}

function Disclosures() {
  return (
    <section aria-label="Open decisions this module discloses">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Open decisions
      </h4>
      {B9_DISCLOSURES.map((d) => (
        <div
          key={d.decisionRef}
          role="note"
          data-testid="fl-b9-disclosure"
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
                <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                  [{r.locator}]
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            This build&apos;s working position
          </p>
          <p className="mt-1 text-[var(--color-ink)]">{d.adopted}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            A client-delegated choice — the client delegated the decision, not the pretence
            that the source settled it.
          </p>
          <p className="mt-2 text-[var(--color-ink-muted)]">{d.whyHere}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{d.canonNote}</p>
        </div>
      ))}
    </section>
  )
}

function Contradiction() {
  const c = CH4_AGAINST_CH22_ON_GATE_OVERRIDE
  return (
    <section aria-label="A source contradiction with no decision identifier">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        A source contradiction, disclosed as a contradiction
      </h4>
      <div
        role="note"
        data-testid="fl-b9-contradiction"
        className="mt-2 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm"
      >
        <p className="font-medium text-[var(--color-ink)]">{c.title}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{c.question}</p>
        <ul className="mt-2 space-y-2">
          {c.readings.map((r) => (
            <li key={r.locator} data-testid="fl-b9-contradiction-reading">
              <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{r.locator}]
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Statements that bear on it without closing it
        </p>
        <ul className="mt-1 space-y-2">
          {c.bearsOnIt.map((r) => (
            <li key={r.locator}>
              <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{r.locator}]
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[var(--color-ink)]">{c.whatThisBuildDraws}</p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{c.noDecisionIdentifier}</p>
      </div>
    </section>
  )
}

export function GatesAndSignOffView({
  viewerRole = 'WORKER',
}: {
  readonly viewerRole?: B9Column
}) {
  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        Rendered for the {B9_COLUMN_HEADINGS[viewerRole]} column. Two of the six genuine
        non-Worker on-device controls on this surface are this module&rsquo;s, and both are the
        sign-off — the one thing a Supervisor or a Quality Manager does on a worker&rsquo;s
        tablet.
      </p>

      <GateBlock viewerRole={viewerRole} />
      <SignOff viewerRole={viewerRole} />
      <Card />
      <States />
      <MatrixTable viewerRole={viewerRole} />
      <Functionalities />

      <section aria-label="What this module never claims">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module never claims
        </h4>
        <ul className="mt-2 space-y-2">
          {B9_CLAIMS_NEVER_MADE.map((c) => (
            <li key={c.sourceRef} data-testid="fl-b9-never-claimed" className="text-sm">
              <span className="text-[var(--color-ink)]">{c.claim}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.instead}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{c.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Acceptance criteria">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module has to be true
        </h4>
        <ul className="mt-2 space-y-1">
          {B9_ACCEPTANCE_CRITERIA.map((a) => (
            <li key={a.id} data-testid="fl-b9-acceptance" className="text-sm">
              <span className="text-[var(--color-ink)]">{a.text}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{a.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Disclosures />
      <Contradiction />

      <section aria-label="Findings recorded rather than closed">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Findings, recorded rather than closed
        </h4>
        <ul className="mt-2 space-y-2">
          {B9_SOURCE_FINDINGS.map((f) => (
            <li key={f.sourceRef} data-testid="fl-b9-finding" className="text-sm">
              <span className="text-[var(--color-ink)]">{f.what}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{f.evidence}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{f.notClosedBecause}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{f.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/**
 * The value the Run Player route mounts. The route file is the spine task's
 * and is not edited here; this module exports a panel and the controller
 * wires it in.
 */
export const FL_B9_PANEL: RunPlayerPanel = {
  module: 'MOD-FL-B9',
  heading: 'Gates and Sign-Off Authority',
  rendersViews: B9_VIEW_NAMES,
  body: <GatesAndSignOffView />,
}
