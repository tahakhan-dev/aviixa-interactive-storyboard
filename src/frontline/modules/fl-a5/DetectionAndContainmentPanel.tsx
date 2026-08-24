'use client'

import { useState } from 'react'
import { surfaceById } from '@/domain/surfaces'
import {
  CrossSurfaceAct,
  frontlineCrossSurfaceModel,
} from '@/frontline/cross-surface'
import type { UnitOrLotBinding } from '@/frontline/capture'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { Button, StatusPill } from '@/ui/primitives'
import {
  A5_CARD,
  A5_CLAIMS_NEVER_MADE,
  A5_STATES,
  NO_OFF_SWITCH,
  PROPAGATION_IS_NOT_A_DEVICE_TIMELINE,
  STATES_THIS_DEVICE_CANNOT_HOLD,
} from './charter'
import {
  FL_A5_COLUMNS,
  FL_A5_COLUMN_HEADINGS,
  FL_A5_MATRIX,
  FL_A5_SHAPE,
  type FlA5Column,
  type FlA5MatrixRow,
  type FlA5RowId,
} from './matrix'
import {
  A5_ACCEPTANCE_CRITERIA,
  A5_DISCLOSURES,
  A5_FUNCTIONALITIES,
  A5_MAPPED_PATTERNS,
  A5_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  A5_SOURCE_FINDINGS,
  HOLD_SCOPE_RULES,
  SAFETY_LAYER_OFFLINE,
  containmentAfter,
  containmentDecision,
  escalationDelivery,
  type ContainmentState,
} from './service'

/**
 * `MOD-FL-A5` — On-Device Detection and Containment. The Run Player panel.
 *
 * EVERY CONTROL ON THIS PANEL IS DECIDED BY `frontlineAffordance` AND NONE IS
 * DECIDED AROUND IT. The two buttons below exist only where the fold returns
 * `kind: 'control'` for the viewer's own column, and there is no branch that
 * draws one on any other kind. `FrontlineAffordance` has no `disabled`
 * member, so a refused act renders as no control plus a stated line — never
 * a greyed-out button, which on this surface would imply a condition that
 * could become true.
 *
 * THE PANEL LEADS WITH THE OFFLINE STATEMENT, AND THAT ORDER IS THE POINT.
 * This slice is titled "online execution" and this module is the one whose
 * defining property that title contradicts. Slice 8 builds the offline
 * simulation; a panel that waited for it would spend a slice implying the
 * safety layer needs a network, which is the single claim chapter 22 exists
 * to deny (L40948).
 *
 * THE `viewerRole` PROP IS A COLUMN, NOT A PREFERENCE. §25.5 gives this
 * destination to "Worker; Supervisor within a step-up" (L48531), so the
 * default is the Worker. It is a prop because the cross-surface pointer is
 * CHECKED per role against `@/routes/definitions` rather than asserted, and
 * because a matrix whose column can never change is a matrix nobody can see
 * refuse anything.
 */

const ROW_BY_ID: Readonly<Record<FlA5RowId, FlA5MatrixRow>> = Object.fromEntries(
  FL_A5_MATRIX.map((r) => [r.id, r]),
) as Readonly<Record<FlA5RowId, FlA5MatrixRow>>

/** The Illustrative Example's own capture, L41038. */
const EXAMPLE = {
  value: '38.0 Newton metres',
  binding: { kind: 'lot', id: 'LOT-WB-2291' },
} as const satisfies { readonly value: string; readonly binding: UnitOrLotBinding }

const EXAMPLE_RESULT = { inSpecification: false, severityBand: 1 } as const

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
      return `${a.note} That act is row "${ROW_BY_ID[a.toRowId as FlA5RowId].control}" of this matrix.`
    case 'stated-line':
      return a.line
  }
}

function Card() {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The module card, transcribed
      </h4>
      <dl className="mt-2 space-y-3">
        {A5_CARD.map((s) => (
          <div key={s.field} data-testid="fl-a5-card-statement">
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
                  data-testid="fl-a5-card-elision"
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

function States() {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        States
      </h4>
      <ul className="mt-2 space-y-2">
        {A5_STATES.map((s) => (
          <li key={s.id} data-testid="fl-a5-state" data-held={String(s.heldByThisDevice)}>
            <span className="text-sm text-[var(--color-ink)]">{s.id}</span>{' '}
            <span className="text-sm text-[var(--color-ink-muted)]">
              {s.gloss === null
                ? 'The source names this state and gives it no description of its own.'
                : s.gloss}
            </span>{' '}
            <StatusPill
              tone={s.heldByThisDevice ? 'info' : 'stale'}
              icon={s.heldByThisDevice ? '•' : '~'}
              label={
                s.heldByThisDevice
                  ? 'this device holds this'
                  : 'this device cannot know this'
              }
            />{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{s.sourceRef}]
            </span>
          </li>
        ))}
      </ul>
      <p
        data-testid="fl-a5-propagation-honesty"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {PROPAGATION_IS_NOT_A_DEVICE_TIMELINE.claim}{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{PROPAGATION_IS_NOT_A_DEVICE_TIMELINE.sourceRef}]
        </span>{' '}
        {STATES_THIS_DEVICE_CANNOT_HOLD.length} of the {A5_STATES.length} states listed
        under this module belongs to that rendering rather than to this device.
      </p>
    </div>
  )
}

function MatrixTable({ viewerRole }: { readonly viewerRole: FlA5Column }) {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Who may do what, all {FL_A5_SHAPE.cells} cells
      </h4>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b p-2 align-bottom font-medium">
                Action
              </th>
              {FL_A5_COLUMNS.map((c) => (
                <th key={c} scope="col" className="border-b p-2 align-bottom font-medium">
                  {FL_A5_COLUMN_HEADINGS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FL_A5_MATRIX.map((row) => (
              <tr key={row.id} data-testid="fl-a5-row">
                <th scope="row" className="border-b p-2 align-top font-normal">
                  <span className="text-[var(--color-ink)]">{row.control}</span>
                  <span
                    data-testid="fl-a5-row-why"
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
                {FL_A5_COLUMNS.map((column) => {
                  const drawn = frontlineAffordance(row, column)
                  return (
                    <td
                      key={column}
                      data-testid="fl-a5-cell"
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

      <p
        data-testid="fl-a5-no-off-switch"
        className="mt-3 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {NO_OFF_SWITCH.text}{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{NO_OFF_SWITCH.sourceRef}]
        </span>{' '}
        <span className="text-[var(--color-ink-muted)]">{NO_OFF_SWITCH.whyOutsideTheCell}</span>{' '}
        <span className="text-[var(--color-ink-muted)]">{NO_OFF_SWITCH.corroboration}</span>{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{NO_OFF_SWITCH.corroborationRef}]
        </span>
      </p>

      {FL_A5_MATRIX.filter((r) => r.metElsewhere !== null).map((row) => {
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
    </div>
  )
}

function SeverityOneMoment({ viewerRole }: { readonly viewerRole: FlA5Column }) {
  const [committed, setCommitted] = useState(false)
  const [containment, setContainment] = useState<ContainmentState>('STATE-A5-LAUNCHED')

  const trigger = frontlineAffordance(
    ROW_BY_ID['trigger-deterministic-evaluation'],
    viewerRole,
  )
  const checklist = frontlineAffordance(
    ROW_BY_ID['complete-containment-checklist'],
    viewerRole,
  )

  const decision = containmentDecision(EXAMPLE_RESULT, EXAMPLE.binding)
  const offline = escalationDelivery(false)

  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        A Severity 1 moment
      </h4>

      <p
        data-testid="fl-a5-offline-statement"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {SAFETY_LAYER_OFFLINE.reason}{' '}
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
          [{SAFETY_LAYER_OFFLINE.sourceRef}]
        </span>
      </p>

      {trigger.kind === 'control' ? (
        <div className="mt-3">
          <Button onClick={() => setCommitted(true)}>Commit {EXAMPLE.value}</Button>
        </div>
      ) : (
        <p
          data-testid="fl-a5-no-trigger-control"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {ROW_BY_ID['trigger-deterministic-evaluation'].control} — no control is drawn for the{' '}
          {FL_A5_COLUMN_HEADINGS[viewerRole]}. {affordanceWords(trigger)}
        </p>
      )}

      {committed ? (
        <div data-testid="fl-a5-severity-one" className="mt-3 space-y-2">
          <p className="text-base font-semibold text-[var(--color-ink)]">
            Severity 1 — this lot has been placed on hold.
          </p>
          <p className="text-sm text-[var(--color-ink)]">
            {decision.line}{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{decision.sourceRef}]
            </span>
          </p>
          <p data-testid="fl-a5-escalation" className="text-sm text-[var(--color-ink-muted)]">
            {offline.line} {offline.clause}{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{offline.sourceRef}]
            </span>
          </p>

          <div data-testid="fl-a5-checklist" data-state={containment}>
            <p className="text-sm font-medium text-[var(--color-ink)]">
              The pre-authorised containment checklist, item by item.
            </p>
            {checklist.kind === 'control' ? (
              <div className="mt-2 flex gap-2">
                {containment === 'STATE-A5-LAUNCHED' ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setContainment(containmentAfter(containment, 'start-first-item'))
                    }
                  >
                    Start the first item
                  </Button>
                ) : null}
                {containment === 'STATE-A5-INPROGRESS' ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setContainment(containmentAfter(containment, 'complete-last-item'))
                    }
                  >
                    Complete the last item
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                {affordanceWords(checklist)}
              </p>
            )}
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              There is no control here that leaves this checklist, and that is structural rather
              than a convention: the act vocabulary this module exposes has two members and
              neither is a dismissal, a skip or a deferral.{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [AC-A5-5 · L41050]
              </span>
            </p>
            {containment === 'STATE-A5-COMPLETE' ? (
              <p
                data-testid="fl-a5-checklist-complete"
                className="mt-2 text-sm text-[var(--color-ink)]"
              >
                Containment complete. The held lot stays unavailable for further work until a
                Quality Manager release command reaches this device and this device applies it.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">Where a hold lands</p>
        <ul className="mt-1 space-y-1">
          {HOLD_SCOPE_RULES.map((r) => (
            <li key={r.scope} data-testid="fl-a5-hold-scope" className="text-sm">
              <span className="text-[var(--color-ink)]">{r.rule}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{r.why}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{r.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Functionalities() {
  const mapped = A5_MAPPED_PATTERNS.map((p) => p.id)
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The {A5_FUNCTIONALITIES.length} functionalities, and the pattern each one names
      </h4>
      <ul className="mt-2 space-y-2">
        {A5_FUNCTIONALITIES.map((f) => (
          <li key={f.id} data-testid="fl-a5-functionality" className="text-sm">
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
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{f.sourceRef}]
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The section 22.9 pattern map lists this module against {mapped.length} patterns —{' '}
        {mapped.join(', ')}. The functionalities above name{' '}
        {A5_PATTERNS_NAMED_BY_FUNCTIONALITIES.length}:{' '}
        {A5_PATTERNS_NAMED_BY_FUNCTIONALITIES.join(', ')}.
      </p>
      <ul className="mt-2 space-y-2">
        {A5_SOURCE_FINDINGS.map((f) => (
          <li key={f.sourceRef} data-testid="fl-a5-finding" className="text-sm">
            <span className="text-[var(--color-ink)]">{f.what}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{f.evidence}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{f.notClosedBecause}</span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{f.sourceRef}]
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The three open decisions, in the shared canon's own shape. This renders
 * every reading with its own locator and labels the working position a
 * client-delegated choice — the same three parts `DecisionDisclosure`
 * renders, which is the component this would call if the canon's
 * `DecisionId` union held these three identifiers. It does not, and
 * `canonNote` says so on screen rather than only in a report.
 */
function Disclosures() {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Open decisions
      </h4>
      {A5_DISCLOSURES.map((d) => (
        <div
          key={d.decisionRef}
          role="note"
          data-testid="fl-a5-disclosure"
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
            A client-delegated choice under APP-012, not a position the source settled.
          </p>
          <p className="mt-2 text-[var(--color-ink-muted)]">{d.whyHere}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{d.canonNote}</p>
        </div>
      ))}
    </div>
  )
}

export function DetectionAndContainmentView({
  viewerRole = 'WORKER',
}: {
  readonly viewerRole?: FlA5Column
}) {
  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        Rendered for the {FL_A5_COLUMN_HEADINGS[viewerRole]} column. The two acts this module
        owns are its first and sixth rows; every other permissive cell in its matrix belongs to
        the {surfaceById('SURF-CC').name} or the {surfaceById('SURF-DOH').name}.
      </p>

      <SeverityOneMoment viewerRole={viewerRole} />
      <Card />
      <States />
      <MatrixTable viewerRole={viewerRole} />
      <Functionalities />

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module never claims
        </h4>
        <ul className="mt-2 space-y-2">
          {A5_CLAIMS_NEVER_MADE.map((c) => (
            <li key={c.sourceRef} data-testid="fl-a5-never-claimed" className="text-sm">
              <span className="text-[var(--color-ink)]">{c.claim}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.instead}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{c.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module has to be true
        </h4>
        <ul className="mt-2 space-y-1">
          {A5_ACCEPTANCE_CRITERIA.map((a) => (
            <li key={a.id} data-testid="fl-a5-acceptance" className="text-sm">
              <span className="text-[var(--color-ink)]">{a.text}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{a.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Disclosures />
    </div>
  )
}

/**
 * NO PANEL OBJECT IS EXPORTED FROM THIS FILE, AND THAT IS THE FIX RATHER THAN
 * A TIDY-UP. It carries `'use client'`, so an object exported here becomes a
 * client reference in a build and a server component reading its string fields
 * gets nothing -- the slice-7 defect that shipped `data-testid=
 * "fl-panel-undefined"` for four of six Run Player modules. The panel the route
 * mounts is built in the server module `./panel.tsx`, which is what
 * `app/frontline/run-player/page.tsx` imports and what the component suite
 * asserts on. A duplicate here, imported by nothing but that suite, is how the
 * assertion that looked like it guarded the mounted id stopped being able to
 * fail; `tests/coverage/slice-09-gates.test.ts` gate 11 now convicts the shape
 * across `src` and `app` rather than on the Command Center alone.
 */
