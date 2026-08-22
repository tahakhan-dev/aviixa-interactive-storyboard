import type { RoleId } from '@/domain/roles'
import { allow, deny } from '@/policy/decision'
import { CrossSurfaceLink } from '@/ui/CrossSurfaceLink'
import { WriteControl } from '@/ui/WriteControl'
import { cc13Action } from '@/surfaces/cc/actions/action-set'
import { ccPropagationRollUp, type DeviceCommandState } from '@/surfaces/cc/actions/propagation'
import { CC_DECISION_REGISTER } from '@/surfaces/cc/decisions/register'
import {
  CC_LINK_OUT_CELLS,
  ccLinkOutModel,
  type CcLinkOutCell,
} from '@/surfaces/cc/decisions/link-outs'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON, frozenBannerText } from '@/surfaces/cc/fallback/session'
import { ccPushedShowsBothTimes } from '@/surfaces/cc/live/model'
import {
  CC09_DEMONSTRATION_FILTER,
  CC09_FILTER_DIMENSIONS,
  CC09_STORYBOARD_FEED,
  cc09Dimension,
  cc09VisibleEntries,
} from './feed'
import {
  CC09_COLUMNS,
  CC09_LINK_OUT_CELL_ID,
  CC09_MATRIX,
  CC09_MODULE,
  CC09_ROW_HELD_ELSEWHERE,
  CC09_SCREEN,
  cc09Row,
  type Cc09Column,
} from './matrix'
import {
  CC09_ACKNOWLEDGE_RESOLVE_SPLIT,
  CC09_DECOMPOSITION,
  CC09_DIVERGENCES,
  CC09_FILTER_RULE,
  CC09_FILTER_STATEMENTS,
  CC09_OUTSIDE_WRITE_STATEMENT,
  CC09_PUSHED_ELEMENTS,
  CC09_PUSHED_LATENCY_RULE,
  CC09_RESOLVE_ACT,
  CC09_RESOLVE_IS_ONE_OF_THE_TEN,
  CC09_RESOLVE_OUTSIDE_WRITE,
} from './readings'

/**
 * `MOD-CC-09` — THE ALERT AND ESCALATION FEED, RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix.ts`, `./readings.ts`, `./feed.ts` and six
 * wave-0 modules, every one of which exports plain data objects. A
 * `'use client'` directive on this file or on any of those would replace
 * those exports with client references and the strings would be gone by the
 * time a route prerenders — the defect that put an undefined module id into
 * four built pages in slice 7 while every component test stayed green.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `CC_WRITES_OUTSIDE_THE_TEN` for the resolve write, through
 *    `./readings.ts`, which looks the entry up rather than restating it. Wave
 *    0's register is the ONE register of writes outside the ten on this
 *    surface and this module does not mint a second.
 *  - `ccElementAssignment` for both pushed elements, so §21.3's own
 *    eighteen-row table supplies the class and the marker obligation.
 *  - `CrossSurfaceLink` and `ccLinkOutModel` for row 9, already registered as
 *    `cc-09-routing-timers-channels`. No link is spelled here.
 *  - `WriteControl` for the acknowledgement, live and frozen. A frozen
 *    session reaches it through `gateReason` rather than a sixth branch: it
 *    is a condition outside the person and outside the record that closes the
 *    control, which is what that branch already is.
 *  - `ccPropagationRollUp` for action 10's clearance, which rides the command
 *    channel. `in force` is not computed here and no timeout exists anywhere
 *    in the path.
 *  - `CC_DECISION_REGISTER` for `DEC-NOSHIFT-001` and `DEC-CLEAR-001`.
 *  - NOTHING for the ten operational actions themselves. `MOD-CC-13`'s rail
 *    is mounted on this route by
 *    `app/command-center/alert-and-escalation-feed/` and draws all ten; this
 *    panel names the two L37963 and L38793 both give this module and draws no
 *    control for them.
 *
 * ── ONE PATTERN THIS MODULE DOES NOT HAVE, DECLARED RATHER THAN IMPLIED ──
 *
 * `FB-CC-QUEUE` and `WriteControl`'s `missingElement` branch are NOT this
 * module's. L37984 names this module's five fallback identifiers and they are
 * `FB-CC-PUSH`, `FB-CC-SESS`, `FB-CC-WRITE`, `FB-CC-CMD` and `FB-CC-STALE`.
 * Passing `missingElement` here would render the governance gate queue's
 * not-decidable pattern on a feed the source never assigns it to.
 *
 * ── ILLUSTRATIVE VALUES ARE LABELLED AS SUCH, WITH THEIR LINES ──────────
 *
 * The feed entries are `SB-CC-20` (L37930, L37936-L37945) and the alternate
 * path at L37899. The clearance's single device is L37947's, at the state
 * L37947 puts it in and no further along.
 */

/* ==================================================================== *
 * ACTION 10'S CLEARANCE, AT THE MOMENT L37947 DESCRIBES.
 *
 * "Sam grants a clearance under action 10 at 11:34, the Quality Manager is
 * notified, and the clearance rides the command channel to the worker's
 * device, applying at its next sync." ONE device, and it has not synced.
 * `queued` is a server-side state on `COMMAND_APPLIED_LADDER`, so the roll-up
 * answers `issued` — which is exactly what L37951 requires: "the feed renders
 * the command state honestly and never as delivered to an offline device."
 *
 * The device is not named because the source does not name it, and a
 * plausible identifier would be this build inventing a device.
 * ==================================================================== */
const CLEARANCE_DEVICES: readonly DeviceCommandState[] = [
  { deviceId: "the worker's device on Frame Station 1", state: 'queued' },
]

const linkOutCell = (id: string): CcLinkOutCell => {
  const found = CC_LINK_OUT_CELLS.find((c) => c.id === id)
  if (found === undefined) {
    throw new Error(
      `MOD-CC-09 expects link-out cell "${id}" in src/surfaces/cc/decisions/link-outs.ts. ` +
        'Row 9 renders a link INSTEAD of a control and there is no local spelling of one here.',
    )
  }
  return found
}

const decisionRow = (id: string) => CC_DECISION_REGISTER.find((d) => d.id === id)

const H2 = 'mt-10 text-xl font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

export interface AlertEscalationFeedProps {
  /** Whose column the matrix is read down. The matrix itself renders whole. */
  readonly viewerRole: RoleId
}

export function AlertEscalationFeed({ viewerRole }: AlertEscalationFeedProps) {
  const heldElsewhere = cc09Row(CC09_ROW_HELD_ELSEWHERE)
  const acknowledgeRow = cc09Row(4)
  const resolveRow = cc09Row(5)
  const clearanceRow = cc09Row(7)
  const visible = cc09VisibleEntries(CC09_STORYBOARD_FEED, CC09_DEMONSTRATION_FILTER)
  const clearance = ccPropagationRollUp(CLEARANCE_DEVICES)
  const sess = ccFallbackPatternById('FB-CC-SESS')
  const noShift = decisionRow('DEC-NOSHIFT-001')
  const clear = decisionRow('DEC-CLEAR-001')

  return (
    <section data-testid="cc-09-feed" data-module={CC09_MODULE.id}>
      <p data-testid="cc-09-identity" className={REF}>
        {CC09_MODULE.id} · {CC09_MODULE.name} · identity {CC09_MODULE.sourceRef} ·{' '}
        {CC09_MODULE.specSection} · rendered on {CC09_SCREEN.id}, register row{' '}
        {CC09_SCREEN.registerRef}
      </p>

      {/* ─────────────────────────── THE MATRIX ─────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Ten rows, five persona columns, fifty cells. Transcribed header-keyed from L37860; the
        column order is Tenant Admin first and Worker last, the inversion of every Frontline
        matrix. Row {CC09_ROW_HELD_ELSEWHERE} is the only row whose act is performed on another
        surface, and it renders as a link rather than as a control.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-09-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC09_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC09_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-09-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC09_COLUMNS.map((c: Cc09Column) => (
                  <td key={c} data-testid={`cc-09-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── THE FEED, AND THE FILTER THAT CANNOT HIDE AN UNACKNOWLEDGED ── */}
      <h2 className={H2}>The feed</h2>
      <p data-testid="cc-09-filter-state" className={NOTE}>
        Filterable by {CC09_FILTER_DIMENSIONS.join(', ')} — the four L37838 names and no fifth.
        The filter applied here is{' '}
        <code>
          {Object.entries(CC09_DEMONSTRATION_FILTER)
            .map(([k, v]) => `${k} = ${v}`)
            .join(', ')}
        </code>
        . It is session-scoped and is not saved: every session starts at full visibility.
      </p>
      <ul className="mt-4 space-y-4">
        {visible.map((v) => (
          <li
            key={v.entry.id}
            data-testid={`cc-09-entry-${v.entry.id}`}
            data-forced-visible={v.forcedVisible ? 'yes' : 'no'}
            data-matched-filter={v.matchedFilter ? 'yes' : 'no'}
            className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
          >
            <p className="font-medium">
              {v.entry.at ?? 'time not stated'} · {v.entry.state}
              {v.entry.fallbackMarked ? ' · fallback delivery' : ''}
            </p>
            <p className={NOTE}>{v.entry.summary}</p>
            {v.entry.times === null ? null : (
              <p data-testid={`cc-09-times-${v.entry.id}`} className={NOTE}>
                <span className="font-medium">Origin {v.entry.times.originTime}</span> · server
                receipt {v.entry.times.receiptTime}
                {ccPushedShowsBothTimes(v.entry.times)
                  ? ' — both shown, because they differ.'
                  : ' — one time, because they are the same.'}
              </p>
            )}
            <p className={NOTE}>
              <span className="font-medium">Acknowledged: </span>
              {v.entry.acknowledged ?? 'not yet — nobody has claimed it'}
              {v.entry.resolved === null ? null : (
                <>
                  {' · '}
                  <span className="font-medium">Resolved: </span>
                  {v.entry.resolved}
                </>
              )}
            </p>
            <p className={NOTE}>
              {CC09_FILTER_DIMENSIONS.map(
                (d) => `${d}: ${cc09Dimension(v.entry, d) ?? 'not stated in the source'}`,
              ).join(' · ')}
            </p>
            {v.forcedReason === null ? null : (
              <p
                role="note"
                data-testid={`cc-09-forced-${v.entry.id}`}
                className="mt-2 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-sm"
              >
                {v.forcedReason}
              </p>
            )}
            <p className={REF}>{v.entry.sourceRefs.join(' · ')}</p>
          </li>
        ))}
      </ul>

      {/* ───────── THE FILTER RULE, AND ITS THREE STANDINGS ─────────────── */}
      <h2 className={H2}>A filter here can never hide an unacknowledged escalation</h2>
      <div
        role="note"
        data-testid="cc-09-filter-rule"
        data-persists-any-filter={String(CC09_FILTER_RULE.persistsAnyFilter)}
        data-client-decision-required={String(CC09_FILTER_RULE.isClientDecisionRequired)}
        className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className={NOTE}>{CC09_FILTER_RULE.built}</p>
        <p className={NOTE}>
          <span className="font-medium">
            Built to a {CC09_FILTER_RULE.standing}, not to a source fact.{' '}
          </span>
          The persistence rule at {CC09_FILTER_RULE.standingRef} is classified{' '}
          {CC09_FILTER_RULE.standing} on its own line, and it is not a Client Decision Required:{' '}
          {CC09_FILTER_RULE.isClientDecisionRequiredNote}
        </p>
        <p className={NOTE}>
          <span className="font-medium">
            The strictest of the three is {CC09_FILTER_RULE.strictestStatement} (
            {CC09_FILTER_RULE.strictestStatementRef}), and it is what is implemented.{' '}
          </span>
          {CC09_FILTER_RULE.whyTheStrictest}
        </p>
      </div>
      <ul data-testid="cc-09-filter-statements" className="mt-4 space-y-3">
        {CC09_FILTER_STATEMENTS.map((s) => (
          <li key={s.sourceRef} data-testid={`cc-09-filter-statement-${s.sourceRef}`}>
            <p className="text-sm font-medium">
              {s.standing} · {s.sourceRef} · {s.scope}
            </p>
            <p className={NOTE}>{s.text}</p>
          </li>
        ))}
      </ul>

      {/* ────────── THE TWO PUSHED ELEMENTS AND THE LATENCY RULE ────────── */}
      <h2 className={H2}>Both of this module&rsquo;s elements are pushed</h2>
      <ul data-testid="cc-09-pushed-elements" className="mt-3 space-y-2">
        {CC09_PUSHED_ELEMENTS.map((e) => (
          <li key={e.element} className={NOTE} data-testid={`cc-09-pushed-${e.freshnessClass}`}>
            <span className="font-medium">{e.element}: </span>
            {e.classCell} · {e.markerObligation} · {e.modules.join(', ')} · {e.sourceRef}
          </li>
        ))}
      </ul>
      <p data-testid="cc-09-latency-rule" className={NOTE}>
        {CC09_PUSHED_LATENCY_RULE.rule} {CC09_PUSHED_LATENCY_RULE.ruleRefs.join(' · ')} ·{' '}
        AC-CC-112 ({CC09_PUSHED_LATENCY_RULE.criterionRef}). The class and both marker obligations
        are read from §21.3&rsquo;s eighteen-row assignment table, not restated here.
      </p>

      {/* ─── RESOLVE IS GRANTED HERE AND IS NOT ONE OF THE TEN ─────────── */}
      <h2 className={H2}>
        &ldquo;{CC09_RESOLVE_ACT}&rdquo; is granted here and is not one of the ten
      </h2>
      <p
        data-testid="cc-09-resolve-not-one-of-ten"
        data-one-of-the-ten={String(CC09_RESOLVE_IS_ONE_OF_THE_TEN)}
        className={NOTE}
      >
        {CC09_OUTSIDE_WRITE_STATEMENT}
      </p>
      <p className={NOTE}>
        <span className="font-medium">The grant, {resolveRow.sourceRef}: </span>
        Supervisor <code>{resolveRow.cells.Supervisor.text}</code> · Quality Manager{' '}
        <code>{resolveRow.cells['Quality Manager'].text}</code>. Action 1 of the closed set is{' '}
        <code>{cc13Action(1).matrixAction}</code> ({cc13Action(1).matrixRef}) — the
        acknowledgement half only.
      </p>
      <p data-testid="cc-09-outside-write-standing" className={NOTE}>
        {CC09_RESOLVE_OUTSIDE_WRITE.standing}
      </p>
      <ul data-testid="cc-09-ack-resolve-split" className="mt-3 space-y-2">
        {CC09_ACKNOWLEDGE_RESOLVE_SPLIT.map((s) => (
          <li key={s.sourceRef} className={NOTE} data-names={s.names}>
            <span className="font-medium">{s.sourceRef} names {s.names}: </span>
            {s.statement}
          </li>
        ))}
      </ul>

      {/* ── ACKNOWLEDGEMENT, LIVE AND FROZEN. THE EMAIL ROUTE IS NAMED ─── */}
      <h2 className={H2}>{acknowledgeRow.capability} — live, and with this session frozen</h2>
      <p className={NOTE}>
        The Tenant Admin&rsquo;s cell on this row is{' '}
        <code>{acknowledgeRow.cells['Tenant Admin'].text}</code>, and the reason is the source&rsquo;s
        own. A frozen session closes the control for everyone, and it reaches the shared write
        control through its gate branch rather than a sixth: it is a condition outside the person
        and outside the record.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div data-testid="cc-09-acknowledge-tenant-admin">
          <p className={REF}>Tenant Admin — {acknowledgeRow.sourceRef}</p>
          <WriteControl
            label={acknowledgeRow.capability}
            decision={deny(
              'explicitlyProhibited',
              'EXPLICIT_DENY',
              'The Tenant Admin is explicitly prohibited from acknowledging.',
              { stage: 'BASE_ROLE', sourceRefs: ['MOD-CC-09 L37865', 'MOD-CC-13 L38682'] },
            )}
            roleName="Tenant Admin"
            gateReason={null}
            objectReason={null}
            refusalNote={`${acknowledgeRow.cells['Tenant Admin'].note ?? ''} — the source's own reason. Nothing is drawn here.`}
            neverQueuedNote="FB-CC-WRITE queues nothing on this surface in any state"
            onAct={NO_ACT}
          />
        </div>
        <div data-testid="cc-09-acknowledge-frozen">
          <p className={REF}>Supervisor, session frozen — FB-CC-SESS, L37953</p>
          {/* THE FROZEN SESSION REACHES THE SHARED CONTROL THROUGH
              `gateReason`, NOT THROUGH A SIXTH BRANCH AND NOT BY DEMOTING
              THE DECISION. The Supervisor's own cell on this row is a plain
              `Allowed` (L37865); what closes the control is a condition
              outside the person and outside the record, which is exactly
              what that branch already is. Handing `deny('unavailable', …)`
              instead would state that the GRANT does not confer, which is
              false and is the thing this feed exists not to do. */}
          <WriteControl
            label={acknowledgeRow.capability}
            decision={allow('BASE_ROLE', ['MOD-CC-09 L37865'])}
            roleName="Supervisor"
            gateReason={`${CC_FROZEN_CONTROL_REASON}. Acknowledgement remains possible from the email notification, which writes the same single state on the record — FB-CC-SESS, L37953. Server-side timeout and fallback timers continue. Nothing is queued here in any state (AC-CC-072, L35557).`}
            objectReason={null}
            refusalNote="Unused on this branch: an allowed decision never reaches the absent branch."
            neverQueuedNote="FB-CC-WRITE queues nothing on this surface in any state"
            onAct={NO_ACT}
          />
        </div>
      </div>
      <p data-testid="cc-09-frozen-banner" className={NOTE}>
        {frozenBannerText('10:24:03')}
      </p>
      <p className={REF}>
        Frozen control tooltip: &ldquo;{CC_FROZEN_CONTROL_REASON}&rdquo;. One acknowledgement
        state on the record, written from any channel — FUNC-CC-0903-1-1 (L38000), AC-CC-323
        (L38021).
      </p>

      {/* ───────── ROW 9 — A LINK INSTEAD OF A CONTROL ─────────────────── */}
      <h2 className={H2}>{heldElsewhere.capability} — authored in the Studio</h2>
      <p className={NOTE}>
        {heldElsewhere.sourceRef} prohibits every role and names the destination in the same cell.
        A faithful transcription through the build&rsquo;s one rendering rule draws nothing at all,
        which is an empty space where the source states an owner.
      </p>
      <div className="mt-4">
        <CrossSurfaceLink model={ccLinkOutModel(linkOutCell(CC09_LINK_OUT_CELL_ID), viewerRole)} />
      </div>
      <p className={REF}>
        Row 10 (L37871) also carries a noted prohibition and is deliberately NOT a link: its note
        is a reason, not a destination — in-app notifications cannot be muted (L37848, AC-CC-325
        at L38023), so there is nowhere to point.
      </p>

      {/* ───────── ACTION 10 — THE CLEARANCE ON THE COMMAND CHANNEL ────── */}
      <h2 className={H2}>{clearanceRow.capability}</h2>
      <p className={NOTE}>
        <span className="font-medium">Supervisor: </span>
        {clearanceRow.cells.Supervisor.text}. <span className="font-medium">Quality Manager: </span>
        {clearanceRow.cells['Quality Manager'].text}. The never-held authorisation is a separate
        row here — row 8, {cc09Row(8).sourceRef} — and the Supervisor is prohibited on it.
      </p>
      <p data-testid="cc-09-clearance-state" className={NOTE}>
        <span className="font-medium">{clearance.state}: </span>
        {clearance.why}
      </p>
      <p data-testid="cc-09-clearance-devices" className={NOTE}>
        Confirmed ({clearance.confirmedCount} of {clearance.deviceCount}):{' '}
        {clearance.confirmed.length === 0 ? 'none' : clearance.confirmed.join(', ')}. Unconfirmed:{' '}
        {clearance.unconfirmed.length === 0 ? 'none' : clearance.unconfirmed.join(', ')}.
      </p>
      <p className={REF}>
        Illustrative, from L37947. L37951 is the rule it renders: the feed renders the command
        state honestly and never as delivered to an offline device. Owning place, from the
        Executes via column: {cc13Action(10).executesVia} ({cc13Action(10).authorityRef}).
      </p>

      {/* ───────── WHERE ANOTHER TABLE ANSWERS ONE OF THESE ROWS ───────── */}
      <h2 className={H2}>Where another table answers one of these rows differently</h2>
      <p className={NOTE}>
        No decision identifier covers any of these. <code>AC-CC-502</code> requires every cell to
        carry an explicit status and every cell does; that four tables give different statuses to
        the same act is tested by no acceptance criterion at all. Eight of this module&rsquo;s ten
        rows are its own and no other table carries them.
      </p>
      <ul className="mt-4 space-y-6">
        {CC09_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-09-divergence-${d.id}`}>
            <p className="font-medium">
              Row {d.ownRow} · {d.column} · {d.capability}
            </p>
            <p className={NOTE}>{d.question}</p>
            {d.readings.map((r) => (
              <p key={r.locator} className={NOTE}>
                {r.text} <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
              </p>
            ))}
            <p className={NOTE}>{d.renderedConsequence}</p>
            <p className={REF}>
              Stated at {d.statements.map((s) => `L${s.line} "${s.text}"`).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
      <div
        role="note"
        data-testid="cc-09-decomposition"
        data-outcomes-agree={String(CC09_DECOMPOSITION.outcomesAgree)}
        className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">A decomposition, left open</p>
        <p className={NOTE}>{CC09_DECOMPOSITION.finding}</p>
      </div>

      {/* ───────────────── DECISIONS THIS MODULE CARRIES ────────────────── */}
      <h2 className={H2}>Open decisions on this module</h2>
      {noShift === undefined ? null : (
        <p data-testid="cc-09-dec-noshift" className={NOTE}>
          <span className="font-medium">{noShift.id} · {noShift.status} · </span>
          Confirmation of the nobody-on-shift default — delivery to the tenant&rsquo;s Quality
          Manager role irrespective of shift, marked as a fallback. Both readings are preserved:
          the default as recommended, and the possibility that the client specifies a different
          fallback target. Register row L{noShift.line}, appearing in {noShift.whereItAppears};
          owner {noShift.owner}. Raised on this module at L37850 and restated at L37899 and
          L38007.
        </p>
      )}
      {clear === undefined ? null : (
        <p data-testid="cc-09-dec-clear" className={NOTE}>
          <span className="font-medium">{clear.id} · {clear.standing} · </span>
          {clear.status} It governs action 10, which is one of the two actions L38793 gives this
          module. Grant and expiry are defined; revocation is not, and nothing here invents one.
          Raised at L{clear.line}, {clear.whereItAppears}; owner {clear.owner}.
        </p>
      )}

      {/* ───────────────── SESSION OFFLINE ─────────────────────────────── */}
      <h2 className={H2}>This session offline</h2>
      <p data-testid="cc-09-session-offline" className={NOTE}>
        <code>{sess.id}</code> — {sess.triggeringCondition}. Decision controls:{' '}
        {sess.decisionControls}. Client-side queueing: {sess.clientSideQueueing}. Terminal safe
        state: {sess.terminalSafeState}. L37953 names the route that stays open: acknowledgement
        remains possible from the email notification, which writes the same single state on the
        record, and server-side timeout and fallback timers continue.
      </p>
      <p className={REF}>
        This module&rsquo;s five fallback identifiers, L37984: FB-CC-PUSH, FB-CC-SESS,
        FB-CC-WRITE, FB-CC-CMD, FB-CC-STALE. FB-CC-QUEUE is not among them, so the not-decidable
        rendering is not this module&rsquo;s and no control here passes a missing element.
      </p>

      {/* ────── THE OPERATIONAL ACTIONS, WHICH THIS PANEL DOES NOT LIST ── */}
      <h2 className={H2}>Operational actions exercised here</h2>
      <p data-testid="cc-09-exercised-actions" className={NOTE}>
        L38793 names the seven modules whose screens exercise one or more of the ten and gives
        this one actions 1 and 10; L37963, this module&rsquo;s own Interconnections line, states
        the same two independently — it &ldquo;exercises actions 1 and 10 of{' '}
        <code>MOD-CC-13</code>&rdquo;.{' '}
        <span className="font-medium">The controls themselves are not drawn twice on this screen.</span>{' '}
        <code>MOD-CC-13</code>&rsquo;s action rail is mounted on this route and draws all ten with
        each one&rsquo;s owning place and audit obligation.
      </p>
    </section>
  )
}

/**
 * `WriteControl` requires `onAct`. Both controls above are refusals and
 * neither branch reaches it, so nothing is wired to a handler — a no-op is
 * the honest value and a real one would be a second claim that the act is
 * performable here.
 */
function NO_ACT(): void {
  /* Both renderings above are refusals; this is never reached. */
}
