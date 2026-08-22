'use client'

import { useState } from 'react'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { Button } from '@/ui/primitives'
import {
  B10_CARD,
  B10_CLAIMS_NEVER_MADE,
  B10_DEVICE_OBSERVABLE_STATES,
  B10_NOTIFICATION_STATES,
  B10_RESIDUAL_RISK,
  B10_SERVER_SIDE_STATES,
  B10_STATES_NOT_COVERED_BY_THE_EARLIER_CLAUSE,
  B10_STATES_SOURCE_REF,
  B10_WHERE_IT_SURFACES,
  type B10DeviceObservableState,
} from './charter'
import {
  FL_B10_COLUMNS,
  FL_B10_COLUMN_HEADINGS,
  FL_B10_MATRIX,
  FL_B10_SHAPE,
  UNAVAILABLE_TWO_SENSES,
  b10Row,
  type FlB10Column,
} from './matrix'
import {
  B10_ACCEPTANCE_CRITERIA,
  B10_BACKFILL_STAMP,
  B10_CARD_PATTERNS,
  B10_CHANGE_TIERS,
  B10_DENIAL_TESTS,
  B10_EXPLANATORY_VIDEO_OPEN,
  B10_FUNCTIONALITIES,
  B10_FUNCTIONALITIES_NAMING_NO_PATTERN,
  B10_HONESTY_RULE,
  B10_ILLUSTRATIVE_EXAMPLE,
  B10_INBOX,
  B10_INBOX_IS_ILLUSTRATIVE,
  B10_LANEB_AT_THE_DEVICE_END,
  B10_MAPPED_PATTERNS,
  B10_NOTIFICATION_TABLE,
  B10_OFFLINE_STATEMENT,
  B10_OFFLINE_TREATMENT,
  B10_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B10_PATTERN_DIVERGENCE,
  B10_SOURCE_FINDINGS,
  B10_VERSION_PINNING_HOLDS,
  B10_WHERE_ITS_DECISIONS_LIVE,
  DEVICE_RUNG_LINE,
  SB_FL_019,
  advanceOnDevice,
  deviceRungsFor,
} from './service'

/**
 * `MOD-FL-B10` — Notifications. The Notifications and sync inbox.
 *
 * A PLAIN VIEW, NOT A RUN PLAYER PANEL. This module's destination is
 * `SCR-FL-04` and §25.5 gives it the whole destination — "MOD-FL-B10 all
 * features" (L48532). The controller wires this export into its route;
 * nothing under `app/` is created or edited here.
 *
 * THE SYNC DETAIL SHEET ON THIS DESTINATION IS `MOD-FL-A6`'s. L40035 lists
 * both modules against this row and L39868 places the sheet across My Runs and
 * Notifications with `MOD-FL-A2` and `MOD-FL-A6` against it. This view renders
 * none of it and writes no sync label of any kind.
 *
 * EVERY CONTROL IS DECIDED BY `frontlineAffordance` AND NONE IS DECIDED AROUND
 * IT. Two rows of seven draw anything, both the Worker's. `FrontlineAffordance`
 * has no `disabled` member, so a refused act renders as no control plus a
 * stated line.
 *
 * EVERY CELL PRINTS ITS OWN WORDS BESIDE THE FOLD'S VERDICT. Twenty-nine of
 * this matrix's thirty-five cells are a bare token, so the row's governing
 * sentence carries the reason; the six that have words of their own keep them,
 * including row 6's, which is the only place the source says why there is no
 * push.
 *
 * THE ONE AFFORDANCE THIS SCREEN MUST NOT HAVE IS A MUTE, and the way it does
 * not have one is that nothing here can produce it: row 3 is prohibited in all
 * five columns, the fold returns a refusal for every one of them, and a
 * refusal has no branch that draws a control.
 */

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
    case 'routed':
    case 'refusal':
      return a.note
    case 'stated-line':
      return a.line
  }
}

function Ref({ text }: { readonly text: string }) {
  return <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">[{text}]</span>
}

/* ── the inbox ─────────────────────────────────────────────────────── */

function TheInbox({ viewerRole }: { readonly viewerRole: FlB10Column }) {
  const view = frontlineAffordance(b10Row('view-own-inbox'), viewerRole)
  const unread = frontlineAffordance(b10Row('leave-general-notification-unread'), viewerRole)
  const [rungs, setRungs] = useState<Readonly<Record<string, B10DeviceObservableState>>>(
    Object.fromEntries(B10_INBOX.map((i) => [i.id, i.startsAt])),
  )

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The inbox, for the identity that is logged in
      </h3>

      <p
        data-testid="fl-b10-offline-statement"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {B10_OFFLINE_STATEMENT.text} <Ref text={B10_OFFLINE_STATEMENT.sourceRef} />
      </p>
      <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        {B10_OFFLINE_TREATMENT.reason} <Ref text={B10_OFFLINE_TREATMENT.sourceRef} />
      </p>

      <p
        data-testid="fl-b10-backfill-stamp"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {B10_BACKFILL_STAMP.rule} {B10_BACKFILL_STAMP.notTheArrivalTime}{' '}
        <Ref text={B10_BACKFILL_STAMP.sourceRef} />
      </p>
      <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        {B10_BACKFILL_STAMP.notStatedInChapter22} <Ref text={B10_BACKFILL_STAMP.corroboration} />
      </p>

      {view.kind === 'control' ? (
        <>
          <ul className="mt-3 space-y-3">
            {B10_INBOX.map((item) => {
              const at = rungs[item.id] ?? item.startsAt
              const next = advanceOnDevice(item.trigger, at)
              const ladder = deviceRungsFor(item.trigger)
              return (
                <li
                  key={item.id}
                  data-testid="fl-b10-inbox-item"
                  data-rung={at}
                  className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3"
                >
                  <p className="text-sm text-[var(--color-ink)]">{item.subject}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    Stamped with {item.stamp}.
                  </p>
                  <p
                    data-testid="fl-b10-rung-line"
                    className="mt-1 text-sm text-[var(--color-ink-muted)]"
                  >
                    {DEVICE_RUNG_LINE[at]}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                    This item&rsquo;s own trigger row exercises {ladder.length} of the four states
                    this device can write: {ladder.join(', ')}.{' '}
                    <Ref text={item.trigger === 'any-notification-to-the-identity' ? 'L41837' : 'L41839'} />
                  </p>
                  {next === null ? (
                    <p
                      data-testid="fl-b10-ladder-end"
                      className="mt-2 text-sm text-[var(--color-ink-muted)]"
                    >
                      There is no further state for this item on this device. Nothing here waits on
                      the worker.
                    </p>
                  ) : (
                    <div className="mt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setRungs((r) => ({ ...r, [item.id]: next }))}
                      >
                        Open
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            {B10_INBOX_IS_ILLUSTRATIVE}
          </p>
        </>
      ) : (
        <p
          data-testid="fl-b10-no-inbox"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {b10Row('view-own-inbox').control} — nothing is drawn here for the{' '}
          {FL_B10_COLUMN_HEADINGS[viewerRole]}. {affordanceWords(view)}
        </p>
      )}

      <p
        data-testid="fl-b10-no-read-obligation"
        className="mt-3 max-w-prose text-sm text-[var(--color-ink)]"
      >
        {unread.kind === 'control'
          ? `${affordanceWords(unread)}. Nothing on this device gates on the inbox having been opened, and no item here has to be cleared.`
          : `${b10Row('leave-general-notification-unread').control} — ${affordanceWords(unread)}`}{' '}
        <Ref text={b10Row('leave-general-notification-unread').whyRef} />
      </p>

      <p
        data-testid="fl-b10-honesty-rule"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        Throughout: {B10_HONESTY_RULE.text}. <Ref text={B10_HONESTY_RULE.sourceRef} />{' '}
        <Ref text={B10_HONESTY_RULE.platformRef} />
      </p>
    </div>
  )
}

/* ── the nineteen states, and the four this device has ─────────────── */

function States() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {B10_NOTIFICATION_STATES.length} notification states, and the{' '}
        {B10_DEVICE_OBSERVABLE_STATES.length} this device has
      </h3>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The platform notification state vocabulary applies in full. On this surface the states the
        device can observe and write are {B10_DEVICE_OBSERVABLE_STATES.join(', ')}; the earlier
        states are server-side and are never inferred by the device.{' '}
        <Ref text={B10_STATES_SOURCE_REF} />
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {B10_NOTIFICATION_STATES.map((s) => (
          <li
            key={s.id}
            data-testid="fl-b10-state"
            data-device={String(s.deviceObservable)}
            className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] px-2 py-1 text-xs"
          >
            <span className="text-[var(--color-ink)]">{s.id}</span>{' '}
            <span className="text-[var(--color-ink-subtle)]">
              {s.deviceObservable ? 'this device writes it' : 'server-side; never inferred here'}
            </span>
          </li>
        ))}
      </ul>
      <p
        data-testid="fl-b10-earlier-clause-gap"
        className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]"
      >
        The line&rsquo;s own gloss says &ldquo;the earlier states&rdquo;, and{' '}
        {B10_SERVER_SIDE_STATES.length - B10_STATES_NOT_COVERED_BY_THE_EARLIER_CLAUSE.length} of the{' '}
        {B10_SERVER_SIDE_STATES.length} off-device states are earlier than delivered. The other{' '}
        {B10_STATES_NOT_COVERED_BY_THE_EARLIER_CLAUSE.length} —{' '}
        {B10_STATES_NOT_COVERED_BY_THE_EARLIER_CLAUSE.join(', ')} — follow acknowledged and are off
        this device because the first clause is exhaustive, not because the source called them
        earlier. This build does not extend the gloss to cover them.
      </p>
    </div>
  )
}

/* ── the two change tiers and SB-FL-019 ────────────────────────────── */

function ChangeNotice({ viewerRole }: { readonly viewerRole: FlB10Column }) {
  const dismiss = frontlineAffordance(b10Row('dismiss-change-notice-unseen'), viewerRole)
  const [started, setStarted] = useState(false)

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Work-instruction changes, in two tiers
      </h3>
      <ul className="mt-2 space-y-2">
        {B10_CHANGE_TIERS.map((t) => (
          <li key={t.tier} data-testid="fl-b10-change-tier" data-tier={t.tier} className="text-sm">
            <span className="text-[var(--color-ink)]">A {t.tier} change is {t.whatItIs}.</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{t.whatTheWorkerSees}</span>{' '}
            <Ref text={t.sourceRef} />
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {B10_VERSION_PINNING_HOLDS.text} <Ref text={B10_VERSION_PINNING_HOLDS.sourceRef} />
      </p>

      <div
        data-testid="fl-b10-change-notice"
        className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
      >
        <p className="text-xs uppercase tracking-wide text-[var(--color-ink-subtle)]">
          {SB_FL_019.notAStep} <Ref text={SB_FL_019.sourceRef} />
        </p>
        <p className="mt-1 text-base font-medium text-[var(--color-ink)]">{SB_FL_019.heading}</p>
        <p className="mt-2 text-sm text-[var(--color-ink)]">
          <span className="text-xs uppercase tracking-wide text-[var(--color-ink-subtle)]">
            {B10_ILLUSTRATIVE_EXAMPLE.marker}
          </span>{' '}
          {B10_ILLUSTRATIVE_EXAMPLE.workflow} was republished as{' '}
          {B10_ILLUSTRATIVE_EXAMPLE.version} — {B10_ILLUSTRATIVE_EXAMPLE.whatChanged}.{' '}
          {B10_ILLUSTRATIVE_EXAMPLE.whatDidNot} <Ref text={B10_ILLUSTRATIVE_EXAMPLE.sourceRef} />
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          The notice {SB_FL_019.carries}.
        </p>
        <p
          data-testid="fl-b10-laneb-device-end"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {B10_LANEB_AT_THE_DEVICE_END.consequence}{' '}
          <Ref text={B10_LANEB_AT_THE_DEVICE_END.classRef} />
        </p>
        <div className="mt-3">
          <Button onClick={() => setStarted(true)}>{SB_FL_019.control}</Button>
        </div>
        {started ? (
          <p data-testid="fl-b10-in-situ-flag" className="mt-2 text-sm text-[var(--color-ink)]">
            {SB_FL_019.inSitu}
          </p>
        ) : null}
        <p
          data-testid="fl-b10-no-dismiss"
          className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {SB_FL_019.absent} {affordanceWords(dismiss)}{' '}
          <Ref text={b10Row('dismiss-change-notice-unseen').sourceRef} />
        </p>
      </div>
    </div>
  )
}

/* ── the matrix ────────────────────────────────────────────────────── */

function MatrixTable() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Who may do what, all {FL_B10_SHAPE.cells} cells
      </h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b p-2 align-bottom font-medium">
                Action
              </th>
              {FL_B10_COLUMNS.map((c) => (
                <th key={c} scope="col" className="border-b p-2 align-bottom font-medium">
                  {FL_B10_COLUMN_HEADINGS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FL_B10_MATRIX.map((row) => (
              <tr key={row.id} data-testid="fl-b10-row">
                <th scope="row" className="border-b p-2 align-top font-normal">
                  <span className="text-[var(--color-ink)]">{row.control}</span>
                  <span
                    data-testid="fl-b10-row-why"
                    className="mt-1 block text-xs text-[var(--color-ink-muted)]"
                  >
                    {row.why} <Ref text={row.whyRef} />
                  </span>
                  <span className="mt-1 block">
                    <Ref text={row.sourceRef} />
                  </span>
                </th>
                {FL_B10_COLUMNS.map((column) => {
                  const drawn = frontlineAffordance(row, column)
                  return (
                    <td
                      key={column}
                      data-testid="fl-b10-cell"
                      data-row={row.id}
                      data-column={column}
                      data-kind={drawn.kind}
                      className="border-b p-2 align-top"
                    >
                      <span className="block text-xs font-medium text-[var(--color-ink-subtle)]">
                        {KIND_LABEL[drawn.kind]}
                      </span>
                      <span
                        data-testid="fl-b10-cell-own-words"
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

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          The push row carries a token that means two opposite things elsewhere in this slice, and
          this is which one it means here
        </p>
        <ul className="mt-1 space-y-1">
          {UNAVAILABLE_TWO_SENSES.map((u) => (
            <li key={u.sourceRef} data-testid="fl-b10-unavailable-sense" className="text-sm">
              <span className="text-[var(--color-ink)]">
                {u.row} — {u.cellWords}.
              </span>{' '}
              <span className="text-[var(--color-ink-muted)]">
                Sense: {u.sense}. Route back: {u.routeBack}
              </span>{' '}
              <Ref text={u.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          The three denial tests these refusals answer to
        </p>
        <ul className="mt-1 space-y-1">
          {B10_DENIAL_TESTS.map((t) => (
            <li key={t.id} data-testid="fl-b10-denial-test" className="text-sm">
              <span className="text-[var(--color-ink)]">{t.text}</span> <Ref text={t.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── the trigger table ─────────────────────────────────────────────── */

function Triggers() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        What produces a notification here, and which states each one exercises
      </h3>
      <ul className="mt-2 space-y-2">
        {B10_NOTIFICATION_TABLE.map((t) => {
          const rungs = deviceRungsFor(t.id)
          return (
            <li key={t.id} data-testid="fl-b10-trigger" data-trigger={t.id} className="text-sm">
              <span className="text-[var(--color-ink)]">{t.trigger}.</span>{' '}
              <span className="text-[var(--color-ink-muted)]">
                {t.recipient}. Channel: {t.channel}. States exercised:{' '}
                {t.statesExercised.join(', ')}.
              </span>{' '}
              <span className="text-[var(--color-ink-subtle)]">
                {rungs.length === 0
                  ? 'None of them is a state this device can observe, so nothing about it reaches the inbox.'
                  : `Of those, this device observes and writes ${rungs.join(', ')}.`}
              </span>{' '}
              <Ref text={t.sourceRef} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ── functionalities and the fallback obligation ───────────────────── */

function Functionalities() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The {B10_FUNCTIONALITIES.length} functionalities, and the pattern each one names
      </h3>
      <ul className="mt-2 space-y-2">
        {B10_FUNCTIONALITIES.map((f) => (
          <li key={f.id} data-testid="fl-b10-functionality" className="text-sm">
            <span className="text-[var(--color-ink)]">{f.statement}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">
              Purpose: {f.purpose}. Roles allowed: {f.rolesAllowed}.{' '}
              {f.rolesProhibited === null
                ? 'The source states no roles-prohibited clause for this functionality.'
                : `Roles prohibited: ${f.rolesProhibited}.`}{' '}
              {f.connectivity}
            </span>{' '}
            <span className="text-[var(--color-ink-muted)]">Fallback: {f.fallbackClause}</span>{' '}
            <Ref text={f.sourceRef} />
          </li>
        ))}
      </ul>

      <p
        data-testid="fl-b10-pattern-gaps"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {B10_FUNCTIONALITIES_NAMING_NO_PATTERN.length} of the {B10_FUNCTIONALITIES.length} name no
        FB-FL pattern, each on a ground the source itself gives:{' '}
        {B10_FUNCTIONALITIES_NAMING_NO_PATTERN.map((g) => `${g.id} — ${g.ground}`).join(' ')} They
        are reported rather than filled: an assigned pattern is indistinguishable from a real one
        forever afterwards. <Ref text="AC-FL-011-1 · L40151" />
      </p>

      <p
        data-testid="fl-b10-three-readings"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        The section 22.9 pattern map lists this module against {B10_MAPPED_PATTERNS.length}{' '}
        patterns — {B10_MAPPED_PATTERNS.map((p) => p.id).join(', ')}. The module card names{' '}
        {B10_CARD_PATTERNS.length}: {B10_CARD_PATTERNS.join(', ')}. The functionalities above name{' '}
        {B10_PATTERNS_NAMED_BY_FUNCTIONALITIES.length}:{' '}
        {B10_PATTERNS_NAMED_BY_FUNCTIONALITIES.join(', ')}. {B10_PATTERN_DIVERGENCE.note}{' '}
        <Ref text={B10_PATTERN_DIVERGENCE.mapRef} /> <Ref text={B10_PATTERN_DIVERGENCE.cardRef} />{' '}
        <Ref text={B10_PATTERN_DIVERGENCE.omittedByTheMap} />
      </p>

      <div className="mt-2">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Every pattern the map gives this module, and the terminal safe state each one names
        </p>
        <ul className="mt-1 space-y-1">
          {B10_MAPPED_PATTERNS.map((p) => (
            <li key={p.id} data-testid="fl-b10-terminal-safe-state" className="text-sm">
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
    </div>
  )
}

/* ── card, findings, criteria, disclosures ─────────────────────────── */

function Card() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        The module card, in the source&rsquo;s own words
      </h3>
      <dl className="mt-2 space-y-2">
        {B10_CARD.map((s) => (
          <div key={s.sourceRef} data-testid="fl-b10-card-field" className="text-sm">
            <dt className="font-medium text-[var(--color-ink)]">{s.field}</dt>
            <dd className="text-[var(--color-ink-muted)]">
              {s.text} <Ref text={s.sourceRef} />
              {s.sourceClass === null ? (
                <span className="ml-1 text-xs text-[var(--color-ink-subtle)]">
                  The card states no classification for this field.
                </span>
              ) : (
                <span className="ml-1 text-xs text-[var(--color-ink-subtle)]">{s.sourceClass}</span>
              )}
              {s.elision === null ? null : (
                <span className="ml-1 text-xs text-[var(--color-ink-subtle)]">{s.elision}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p data-testid="fl-b10-residual-risk" className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {B10_RESIDUAL_RISK.id}: {B10_RESIDUAL_RISK.risk}. {B10_RESIDUAL_RISK.mitigation}{' '}
        <Ref text={B10_RESIDUAL_RISK.sourceRef} />
      </p>
    </div>
  )
}

function Findings() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        What did not line up, recorded rather than closed
      </h3>
      <ul className="mt-2 space-y-2">
        {B10_SOURCE_FINDINGS.map((f) => (
          <li key={f.sourceRef} data-testid="fl-b10-finding" className="text-sm">
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

      <div className="mt-3">
        <DecisionDisclosure id="DEC-LANEB-001" />
      </div>
      <p
        data-testid="fl-b10-laneb-why-here"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        Why it is on this screen: {B10_LANEB_AT_THE_DEVICE_END.whatTheModuleSays}{' '}
        {B10_LANEB_AT_THE_DEVICE_END.consequence} The command class this device receives is{' '}
        {B10_LANEB_AT_THE_DEVICE_END.whatTheDeviceReceives}, whose authority column reads &ldquo;
        {B10_LANEB_AT_THE_DEVICE_END.authorityColumn}&rdquo;.{' '}
        <Ref text={B10_LANEB_AT_THE_DEVICE_END.sourceRef} />{' '}
        <Ref text={B10_LANEB_AT_THE_DEVICE_END.statusRef} />
      </p>

      <div
        role="note"
        data-testid="fl-b10-open-no-identifier"
        className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
      >
        <p className="font-medium text-[var(--color-ink)]">
          Open item — the source records this one and gives it no DEC identifier
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          {B10_EXPLANATORY_VIDEO_OPEN.title} {B10_EXPLANATORY_VIDEO_OPEN.question}
        </p>
        <p className="mt-2 text-[var(--color-ink)]">
          {B10_EXPLANATORY_VIDEO_OPEN.whatTheSourceSays}
        </p>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          {B10_EXPLANATORY_VIDEO_OPEN.whatThisBuildDraws}
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          {B10_EXPLANATORY_VIDEO_OPEN.noDecisionIdentifier}{' '}
          <Ref text={B10_EXPLANATORY_VIDEO_OPEN.sourceRef} />
        </p>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Where the decisions this module touches are disclosed
        </p>
        <ul className="mt-1 space-y-1">
          {B10_WHERE_ITS_DECISIONS_LIVE.map((d) => (
            <li key={d.decisionRef} data-testid="fl-b10-decision-home" className="text-sm">
              <span className="text-[var(--color-ink)]">{d.decisionRef}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">
                {d.where} {d.why}
              </span>{' '}
              <Ref text={d.sourceRef} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function NotificationsInboxView({
  viewerRole = 'WORKER',
}: {
  readonly viewerRole?: FlB10Column
}) {
  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        Rendered for the {FL_B10_COLUMN_HEADINGS[viewerRole]} column. Two of this module&rsquo;s
        seven rows draw anything at all, both of them the Worker&rsquo;s, and not one of the seven
        describes an act held on another surface — which is rare on this surface and is why this
        screen carries no cross-surface statement.
      </p>

      <TheInbox viewerRole={viewerRole} />
      <States />
      <ChangeNotice viewerRole={viewerRole} />
      <Triggers />
      <MatrixTable />
      <Card />
      <Functionalities />

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          What this module never claims
        </h3>
        <ul className="mt-2 space-y-2">
          {B10_CLAIMS_NEVER_MADE.map((c) => (
            <li key={c.sourceRef} data-testid="fl-b10-never-claimed" className="text-sm">
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
          {B10_ACCEPTANCE_CRITERIA.map((a) => (
            <li key={a.id} data-testid="fl-b10-acceptance" className="text-sm">
              <span className="text-[var(--color-ink)]">{a.text}</span> <Ref text={a.sourceRef} />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Where this module surfaces, and whose sheet shares the destination
        </h3>
        <ul className="mt-2 space-y-1">
          {B10_WHERE_IT_SURFACES.map((w) => (
            <li key={w.sourceRef} data-testid="fl-b10-surfaces" className="text-sm">
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
