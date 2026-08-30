import type { RoleId } from '@/domain/roles'
import { CrossSurfaceLink } from '@/ui/CrossSurfaceLink'
import { CC13_OWNING_PLACES, cc13Action } from '@/surfaces/cc/actions/action-set'
import {
  CC_LINK_OUT_CELLS,
  ccLinkOutModel,
  type CcLinkOutCell,
} from '@/surfaces/cc/decisions/link-outs'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC12_ACTION_6_ROWS,
  CC12_COLUMNS,
  CC12_MATRIX,
  CC12_MODULE,
  CC12_ROW_HELD_ELSEWHERE,
  CC12_ROW_UNIVERSAL_PROHIBITION,
  CC12_SCREEN,
  cc12Row,
  type Cc12Column,
} from './matrix'
import {
  CC12_BRIEF_ABSTENTION,
  CC12_BRIEF_CATEGORIES,
  CC12_DIVERGENCES,
  CC12_TENANT_ADMIN_DECISION,
} from './readings'

/**
 * `MOD-CC-12` — THE SHIFT HANDOFF PANEL, RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix.ts`, `./readings.ts` and five wave-0 modules,
 * every one of which exports plain data objects. A `'use client'` directive
 * on this file or on any of those would replace those exports with client
 * references and the strings would be gone by the time a route prerenders —
 * the defect that put an undefined module id into four built pages in slice 7
 * while every component test stayed green.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `CrossSurfaceLink` and `ccLinkOutModel` for row 7, whose Tenant Admin
 *    cell is already registered as `cc-12-agent-run-time` with the two owners
 *    its note names and neither chosen. No link is spelled here.
 *  - `CC13_OWNING_PLACES` and `cc13Action` for action 6. This module is the
 *    only site L38793 names for it, and the write's destination is wave 0's
 *    reading of the `Executes via` column, never a second spelling.
 *  - `ccElementAssignment` for the freshness class. §21.3's assignment table
 *    puts `Agent output produced` on this module AND on `MOD-CC-08` at
 *    L35890; that row is read, never restated, so a change to the table
 *    changes this panel and cannot leave two answers alive.
 *  - `ccFallbackPatternById` and `CC_FROZEN_CONTROL_REASON` for `FB-CC-SESS`.
 *  - NO CONTROL FOR ANY OF THE TEN. `MOD-CC-13`'s action rail is mounted on
 *    this route by `app/command-center/shift-handoff-panel/` and draws all
 *    ten with their owning places. A second acknowledge control here would be
 *    a second spelling of a closed set that has one owner.
 *
 * ── THE ACKNOWLEDGEMENT IS A WRITE THROUGH AN OWNING SERVICE ─────────────
 *
 * L38657: the Command Center is a cockpit and never an engine — every one of
 * the ten is a command against a Delivery Operations Hub-owned record,
 * executed through the owning Hub service and written to the Hub audit trail.
 * L38471 says the same thing for this module in its own words: the brief, its
 * acknowledgement and its annotations are all written to the Delivery
 * Operations Hub record. So there is no local edit anywhere in this module,
 * no acknowledgement state held here, and the destination is NAMED beside the
 * act rather than implied by a control that appears to perform it.
 *
 * ── ILLUSTRATIVE VALUES ARE NOT RENDERED AT ALL ─────────────────────────
 *
 * Unlike `MOD-CC-04`, which has one storyboard device set it can label as an
 * illustration, every figure this module's storyboard carries is a COUNT of a
 * live source, and a count is exactly what must not be invented. The
 * abstention is declared in `CC12_BRIEF_ABSTENTION` and rendered as a
 * statement, not left as a blank.
 */

const linkOutCell = (id: string): CcLinkOutCell => {
  const found = CC_LINK_OUT_CELLS.find((c) => c.id === id)
  if (found === undefined) {
    throw new Error(
      `MOD-CC-12 expects link-out cell "${id}" in src/surfaces/cc/decisions/link-outs.ts. ` +
        'Row 7 renders a link INSTEAD of a control and there is no local spelling of one here.',
    )
  }
  return found
}

const ACTION_6 = 6
const action6 = cc13Action(ACTION_6)
const action6Place = CC13_OWNING_PLACES.find((p) => p.ordinal === ACTION_6)

const H2 = 'mt-10 text-xl font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

export interface ShiftHandoffPanelProps {
  /** Whose column the link-out's pointer is checked against. The matrix renders whole. */
  readonly viewerRole: RoleId
}

export function ShiftHandoffPanel({ viewerRole }: ShiftHandoffPanelProps) {
  const heldElsewhere = cc12Row(CC12_ROW_HELD_ELSEWHERE)
  const universal = cc12Row(CC12_ROW_UNIVERSAL_PROHIBITION)
  const agentOutput = ccElementAssignment('Agent output produced')
  const sess = ccFallbackPatternById('FB-CC-SESS')

  return (
    <section data-testid="cc-12-panel" data-module={CC12_MODULE.id}>
      <p data-testid="cc-12-identity" className={REF}>
        {CC12_MODULE.id} · {CC12_MODULE.name} · identity {CC12_MODULE.sourceRef} ·{' '}
        {CC12_MODULE.specSection} · rendered on {CC12_SCREEN.id}, register row{' '}
        {CC12_SCREEN.registerRef}
      </p>

      {/* ─────────────────────────── THE MATRIX ─────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Eight rows, five persona columns, forty cells, counted off the source rather than
        subtracted from a span. Transcribed header-keyed from L38481; the column order is Tenant
        Admin first and Worker last, the inversion of every Frontline matrix. Row{' '}
        {CC12_ROW_HELD_ELSEWHERE} is the only row whose act is performed on another surface, and
        it renders as a link rather than as a control.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-12-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC12_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC12_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-12-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC12_COLUMNS.map((c: Cc12Column) => (
                  <td key={c} data-testid={`cc-12-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────────── ROW 7 — A LINK INSTEAD OF A CONTROL ─────────────── */}
      <h2 className={H2}>{heldElsewhere.capability} — held off this surface</h2>
      <p className={NOTE}>
        The Tenant Admin cell of {heldElsewhere.sourceRef} reads a prohibition and then names
        where the act lives. A faithful transcription through the build&rsquo;s one rendering rule
        draws nothing at all — an empty cell in the one place on this matrix where the source
        spells out a destination. The cell names TWO owners and chooses neither, so no link is
        drawn to either and the state says so.
      </p>
      <div className="mt-4">
        <CrossSurfaceLink model={ccLinkOutModel(linkOutCell('cc-12-agent-run-time'), viewerRole)} />
      </div>

      {/* ─────── ROW 8 — A NOTE IN ONE COLUMN THAT BINDS EVERY ROLE ────── */}
      <h2 className={H2}>{universal.capability}</h2>
      <p data-testid="cc-12-universal-prohibition" className={NOTE}>
        Row {CC12_ROW_UNIVERSAL_PROHIBITION} puts its whole rule in the Tenant Admin cell and
        leaves the other four bare: <code>{universal.cells['Tenant Admin'].text}</code> (
        {universal.sourceRef}). The note is not scoped to the column it sits in — it is a
        universal prohibition stated once, and reading it as the Tenant Admin&rsquo;s alone loses
        the rule. Two other statements say it independently: <code>AC-CC-383</code> (L38623)
        forbids the block under any configuration, and <code>FUNC-CC-1203-1-2</code> (L38611)
        prohibits every role and every module from introducing one.
      </p>

      {/* ── ACTION 6 — THE WRITE, AND WHERE IT IS EXECUTED ───────────── */}
      <h2 className={H2}>Acknowledge and annotate — action 6 of the closed set of ten</h2>
      <p data-testid="cc-12-action-6" className={NOTE}>
        <span className="font-medium">
          {action6.authorityAction} · {action6.authority} · {action6.authorityRef}
        </span>{' '}
        Executed via {action6Place?.owningPlace ?? 'no owning place is named in that column'}. This
        surface owns no operational record: L38657 is the discipline, and L38471 states it for this
        module in its own words — the brief, its acknowledgement and its annotations are all
        written to the Delivery Operations Hub record. So the acknowledgement is a command against
        a record held there, not a local edit, and nothing on this panel holds an acknowledgement
        state of its own.
      </p>
      <p data-testid="cc-12-action-6-rows" className={NOTE}>
        This module&rsquo;s matrix splits that one action across rows {CC12_ACTION_6_ROWS.join(' and ')} —{' '}
        {CC12_ACTION_6_ROWS.map((o) => cc12Row(o).capability).join(' and ')} — where §21.16, the
        surface matrix and §25.4 each carry it as one row. The decomposition is recorded below and
        is not resolved here.
      </p>
      <p data-testid="cc-12-no-second-rail" className={NOTE}>
        <span className="font-medium">The control is not drawn twice. </span>
        <code>MOD-CC-13</code>&rsquo;s action rail is mounted on this route by the page and draws
        all ten with each one&rsquo;s owning place and audit obligation. L38793 names this module
        for action {ACTION_6} and for no other, and the ten are a closed set with one owner.
      </p>

      {/* ───────── THE TENANT ADMIN ROW, AND ITS OWN DECISION ─────────── */}
      <h2 className={H2}>The Tenant Admin on row 6, and the decision that already governs it</h2>
      <div
        role="note"
        data-testid="cc-12-tenant-admin-decision"
        data-adopted={String(CC12_TENANT_ADMIN_DECISION.adopted)}
        className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          {CC12_TENANT_ADMIN_DECISION.decisionRef} — {CC12_TENANT_ADMIN_DECISION.question}
        </p>
        <p className={NOTE}>
          Raised at L{CC12_TENANT_ADMIN_DECISION.raisedAt}, in{' '}
          {CC12_TENANT_ADMIN_DECISION.raisedIn}. Chapter 21 never names it, so its standing against
          that chapter&rsquo;s own register is {CC12_TENANT_ADMIN_DECISION.standingInChapter21}.
          Options: {CC12_TENANT_ADMIN_DECISION.options.join('; ')}. The source recommends{' '}
          {CC12_TENANT_ADMIN_DECISION.recommendation}, and a recommendation is not an adoption.
        </p>
        <p className={NOTE}>
          Until decided, L{CC12_TENANT_ADMIN_DECISION.workingPositionRef} states what is served:{' '}
          {CC12_TENANT_ADMIN_DECISION.workingPosition}.
        </p>
        <p className={NOTE}>
          <span className="font-medium">Its own impact statement is narrower than its subject: </span>
          the affected cells it names are {CC12_TENANT_ADMIN_DECISION.affectedCellsAsStated}.{' '}
          {CC12_TENANT_ADMIN_DECISION.affectedCellsGap}
        </p>
        <p className={REF}>{CC12_TENANT_ADMIN_DECISION.canonNote}</p>
      </div>

      {/* ───────────── THE DIVERGENCES, BOTH READINGS, NO WINNER ───────── */}
      <h2 className={H2}>Where another table answers one of these rows differently</h2>
      <p className={NOTE}>
        Six tables answer a permission question about this module. <code>AC-CC-502</code> requires
        every cell to carry an explicit status and every cell does; that six tables give different
        statuses to the same act is tested by no acceptance criterion at all.
      </p>
      <ul className="mt-4 space-y-6">
        {CC12_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-12-divergence-${d.id}`}>
            <p className="font-medium">
              Row{d.ownRows.length === 1 ? '' : 's'} {d.ownRows.join(' and ')} · {d.column} ·{' '}
              {d.capability}
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

      {/* ─────────── THE BRIEF'S OWN BODY, DELIBERATELY NOT DRAWN ─────── */}
      <h2 className={H2}>The brief&rsquo;s six content categories</h2>
      <div
        role="note"
        data-testid="cc-12-brief-abstention"
        data-rendered={String(CC12_BRIEF_ABSTENTION.rendered)}
        className="mt-4 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">No figure is rendered beside any of these</p>
        <p className={NOTE}>{CC12_BRIEF_ABSTENTION.why}</p>
        <p className={NOTE}>{CC12_BRIEF_ABSTENTION.whatIsRenderedInstead}</p>
        <ul data-testid="cc-12-brief-categories" className="mt-2 list-disc pl-6 text-sm">
          {CC12_BRIEF_CATEGORIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className={REF}>
          Read off FUNC-CC-1201-1-2 at L{CC12_BRIEF_ABSTENTION.whatIsOwedRef}, which is the
          normative statement, rather than off the storyboard&rsquo;s section headings at L
          {CC12_BRIEF_ABSTENTION.storyboardRef}, which word them differently.
        </p>
      </div>

      {/* ───────────────── THE FRESHNESS CLASS ──────────────────────────── */}
      <h2 className={H2}>Freshness</h2>
      <p data-testid="cc-12-freshness" className={NOTE}>
        <span className="font-medium">{agentOutput.element}: </span>
        {agentOutput.classCell} · {agentOutput.markerObligation} ·{' '}
        {agentOutput.perDevice ? 'per device' : 'per scope'} · {agentOutput.sourceRef}. The class
        and its marker obligation are read from §21.3&rsquo;s assignment table, not restated here,
        and that row assigns the element to {agentOutput.modules.join(' and ')} together — this
        module and the agent activity panel share it, so a second answer written here would be a
        second answer for both.
      </p>

      {/* ───────────────── SESSION OFFLINE ─────────────────────────────── */}
      <h2 className={H2}>This session offline</h2>
      <p data-testid="cc-12-session-offline" className={NOTE}>
        <code>{sess.id}</code> — {sess.triggeringCondition}. Decision controls:{' '}
        {sess.decisionControls} (&ldquo;{CC_FROZEN_CONTROL_REASON}&rdquo;). Client-side queueing:{' '}
        {sess.clientSideQueueing}. Terminal safe state: {sess.terminalSafeState}. L38569 states the
        module-level consequence: because acknowledgement never blocks a shift, a session outage
        costs only visibility, and the grace-period clock keeps running server-side.
      </p>
      <p className={REF}>
        This module&rsquo;s four fallback identifiers, L38594: FB-CC-AGENT, FB-CC-WRITE,
        FB-CC-SESS, FB-CC-STALE. Terminal safe state on a failed acknowledgement: the brief remains
        unacknowledged and its grace-period clock keeps running (L38596).
      </p>
    </section>
  )
}
