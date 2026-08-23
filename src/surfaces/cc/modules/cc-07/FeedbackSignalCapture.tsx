'use client'

/**
 * A CLIENT COMPONENT, AND ONLY `pnpm build` COULD SAY SO.
 *
 * This panel renders at least one `WriteControl` with an `allow(...)` decision,
 * and that is the control's only branch reaching `<Button onClick={onAct}>`.
 * `Button` is a client component, so a SERVER component passing `onAct` hands
 * a function across the boundary and the static export refuses: "Event
 * handlers cannot be passed to Client Component props."
 *
 * SIX OF THE SEVEN COMMAND CENTER PANELS HAD THIS, every one of them green on
 * its own unit and component suites — a component suite mounts the component,
 * and the server/client boundary exists only in a build. The build stops at
 * the first failing route, so they were found by counting `allow(` across all
 * seven rather than by rebuilding six times.
 *
 * Marking the shared `WriteControl` instead was tried and is worse: all seven
 * panels pass `onAct`, so while the control is a server component those passes
 * are server-to-server and only its own enabled branch crosses. Marking it
 * client makes every one of the seven cross. The boundary belongs at the
 * caller that needs interactivity.
 *
 * A `'use client'` file must not export a plain data object a server component
 * reads — its strings come back undefined at prerender, which is how four
 * panels shipped with an undefined module id in slice 7.
 */

import { OWN_OUTSIDE_WRITE_ACTS } from './readings'
import { allow } from '@/policy/decision'
import { WriteControl } from '@/ui/WriteControl'
import {
  CC_WRITES_OUTSIDE_THE_TEN,
  OUTSIDE_WRITE_COUNT_STATEMENT,
  type OutsideWrite,
} from '@/surfaces/cc/actions/outside-writes'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import {
  CC07_COLUMNS,
  CC07_MATRIX,
  CC07_MODULE,
  CC07_OUTSIDE_WRITE_ROWS,
  CC07_ROW_BINDS_EVERY_MODULE,
  CC07_ROW_LEARNING_READ_VIEW,
  CC07_SCREEN,
  cc07Row,
  type Cc07Column,
} from './matrix'
import { CC07_DIVERGENCES, CC07_GAPS } from './readings'
import {
  CC07_AI_ELEMENT_OBLIGATION,
  CC07_AI_FAILURE_CELL,
  CC07_AI_FAILURE_READING,
  CC07_AI_FAILURE_ROW,
  CC07_DEGRADATION_GAPS,
  CC07_NEVER_LIVE,
  CC07_NO_CONTROL_RULE,
  CC07_RENDERED_ELEMENT_PROVENANCE,
  CC07_SAFETY_FLAG_DISCLOSURE,
  CC07_SIGNAL_PROVENANCE,
  uniformlyProhibitedRows,
} from './degradation'

/**
 * `MOD-CC-07` — FEEDBACK SIGNAL CAPTURE, RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix.ts`, `./readings.ts` and three wave-0 modules,
 * every one of which exports plain data objects. A `'use client'` directive on
 * this file or on any of those would replace those exports with client
 * references and the strings would be gone by the time a route prerenders —
 * the defect that put an undefined module id into four built pages in slice 7
 * while every component test stayed green, because a component suite mounts
 * the component and the client boundary only exists in a build.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `CC_WRITES_OUTSIDE_THE_TEN` for the two writes of `DEC-CCWRITE-001`'s
 *    four that originate on this module. Wave 0 minted that register with all
 *    six granted writes and both counts computed from a flag; a second
 *    register here would be the two-spellings defect the whole file exists to
 *    prevent. The two are SELECTED from it by act, never re-typed.
 *  - `WriteControl` for those two controls, in both of the states §21.10
 *    specifies for them. The fifth branch is not used: neither control has a
 *    missing element, and `FB-CC-QUEUE` is not one of this module's three
 *    fallback identifiers (L37584).
 *  - `ccFallbackPatternById` and `CC_FROZEN_CONTROL_REASON` for the frozen
 *    session. `FB-CC-SESS`'s cells are transcribed once, in wave 0.
 *  - NOTHING for the ten operational actions. L38793 names the seven modules
 *    whose screens exercise one or more of them and this is not among them,
 *    so the route leaves `actionRail` unfilled and the shell renders its own
 *    declared seam. Drawing ten operational controls on a screen that
 *    exercises none of them is the drift the closed set exists to prevent.
 *  - NOTHING from `src/ui/CrossSurfaceLink.tsx`. Population B is cells the
 *    source marks prohibited and then names a destination for; no cell of
 *    these thirty-five names a destination on another surface. Row 6 names
 *    "the learning read view", which is `SCR-CC-13` — this module's own route.
 *
 * ── THE TWO CONTROLS ARE DRAWN TWICE, AND THAT IS THE SPECIFICATION ──────
 *
 * §21.10 states two things about these controls that render oppositely, and
 * both are stated as fact rather than as readings, so both are drawn:
 * L37497 — feedback "is always optional and one tap — never required, never
 * gating" — and L37562, `FB-CC-SESS`: "feedback controls are disabled with the
 * rest of the surface's write controls, and nothing is queued". A panel that
 * drew only the enabled state would assert nothing about the frozen one, and a
 * panel that drew only the frozen one would make the never-blocking rule
 * unobservable. Both branches of `WriteControl` are therefore exercised on
 * real data, which is also what stops either check passing on its own negation.
 */

const H2 = 'mt-10 text-xl font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'


function ownOutsideWrite(act: string): OutsideWrite {
  const found = CC_WRITES_OUTSIDE_THE_TEN.find((w) => w.act === act)
  if (found === undefined) {
    throw new Error(
      `MOD-CC-07 expects "${act}" in src/surfaces/cc/actions/outside-writes.ts. ` +
        'Two of DEC-CCWRITE-001’s four named writes originate on this module and are read ' +
        'from that register; there is no second spelling of one here.',
    )
  }
  return found
}

/** The matrix row each of the two writes is granted on, by ordinal. */
const OUTSIDE_WRITE_ROW_OF: Record<string, number> = {
  'Marking a prior case relevant or not relevant': CC07_OUTSIDE_WRITE_ROWS[0],
  'Optional one-tap feedback on agent outputs': CC07_OUTSIDE_WRITE_ROWS[1],
}

/**
 * `WriteControl` requires `onAct`. Nothing on this surface performs an
 * operational record's write, and a real handler would be a second claim that
 * the act commits here. `AC-CC-284` (L37615) is the reason it matters on this
 * module specifically: a learning-store failure never blocks or reverses a
 * governed decision, so the signal's own write is never on a decision's path.
 */
function NO_ACT(): void {
  /* A storyboard performs no write; the learning store is the Hub's. */
}

/**
 * `SB-CC-18`'s controls (L37554), exported on their own so the four modules
 * whose screens produce these signals can mount them.
 *
 * MOUNTING IS NOT OWNERSHIP AND THIS IS THE MOUNTED HALF. L37570 names the
 * producers — "The modules that produce signals — `MOD-CC-04`, `MOD-CC-05`,
 * `MOD-CC-06`, `MOD-CC-12`" — and the storyboard puts one row beneath an
 * agent's interpretation on a deviation workspace, a two-state control beside
 * each retrieved prior case, and an "Annotate" control beside each
 * handoff-brief item. None of those four directories is this task's to edit,
 * so this is offered rather than mounted there, and `mountedOn` makes each
 * mount say whose screen it is on.
 *
 * IT IS ALSO MOUNTED ON THIS MODULE'S OWN ROUTE, deliberately. A component
 * that compiles, passes its suite and is imported by nothing is not shipped —
 * `cc-10-s366` is slice 8's example and it went a whole slice unrendered. This
 * one is reachable from `app/command-center/learning-read-view/` on the day it
 * lands, whatever the four producer tasks do.
 */
export function FeedbackAffordances({
  mountedOn,
  frozen,
}: {
  /** The module id of the screen this is mounted inside. */
  readonly mountedOn: string
  /** `FB-CC-SESS` — a frozen viewer session disables every one of these. */
  readonly frozen: boolean
}) {
  return (
    <div data-testid="cc-07-affordances" data-mounted-on={mountedOn} data-frozen={String(frozen)}>
      <p className={REF}>
        SB-CC-18 (L37554), mounted on {mountedOn}. Session state:{' '}
        {frozen ? 'frozen' : 'live'}.
      </p>
      {OWN_OUTSIDE_WRITE_ACTS.map((act) => {
        const write = ownOutsideWrite(act)
        const ordinal = OUTSIDE_WRITE_ROW_OF[act] as number
        const row = cc07Row(ordinal)
        return (
          <div key={act} data-testid={`cc-07-write-${ordinal}`} className="mt-4">
            <p className="text-sm font-medium">{row.capability}</p>
            <WriteControl
              label={row.capability}
              decision={allow('BASE_ROLE', [`MOD-CC-07 ${row.sourceRef}`])}
              roleName="Supervisor"
              gateReason={frozen ? CC_FROZEN_CONTROL_REASON : null}
              objectReason={null}
              refusalNote="Unused on this row: the Supervisor and the Quality Manager are both Allowed here, so no refusal branch is reached."
              neverQueuedNote="FB-CC-SESS queues nothing client-side on this surface, ever"
              onAct={NO_ACT}
            />
            <p className={REF}>
              {row.sourceRef} · granted to {write.granted.split(';')[0]} · outside the counted ten
              under DEC-CCWRITE-001, {write.exclusionKind}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export function FeedbackSignalCapture() {
  const sess = ccFallbackPatternById('FB-CC-SESS')
  const write = ccFallbackPatternById('FB-CC-WRITE')
  const agent = ccFallbackPatternById('FB-CC-AGENT')
  const optionality = cc07Row(CC07_ROW_BINDS_EVERY_MODULE)
  const readView = cc07Row(CC07_ROW_LEARNING_READ_VIEW)

  return (
    <section data-testid="cc-07-panel" data-module={CC07_MODULE.id}>
      <p data-testid="cc-07-identity" className={REF}>
        {CC07_MODULE.id} · {CC07_MODULE.name} · identity {CC07_MODULE.sourceRef} ·{' '}
        {CC07_MODULE.specSection} · rendered on {CC07_SCREEN.id}, register row{' '}
        {CC07_SCREEN.registerRef}
      </p>

      {/* ─────────────────────────── THE MATRIX ─────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Seven rows, five persona columns, thirty-five cells, walked from the separator at L37504.
        Transcribed header-keyed from L37503; the column order is Tenant Admin first and Worker
        last, the inversion of every Frontline matrix. Three tokens, and{' '}
        <code>Read-only</code> appears exactly once — on row {CC07_ROW_LEARNING_READ_VIEW}, which
        is the row that governs this module&rsquo;s own screen.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-07-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC07_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC07_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-07-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC07_COLUMNS.map((c: Cc07Column) => (
                  <td key={c} data-testid={`cc-07-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─────── ROW 7 BINDS THE OTHER TWELVE MODULES, NOT A PERSON ─────── */}
      <h2 className={H2}>{optionality.capability} — a rule about modules, not about people</h2>
      <p data-testid="cc-07-optionality" className={NOTE}>
        Row {CC07_ROW_BINDS_EVERY_MODULE} ({optionality.sourceRef}) is the only row of the seven
        where all five cells prohibit, and no control is drawn for it, because the act it forbids
        is not one a person performs. L37499 states it as an implementation rule: &ldquo;no
        interaction on this surface may be blocked pending feedback, and no feedback control may
        be modal&rdquo;. FUNC-CC-0703-1-1 (L37604) records its prohibited roles as &ldquo;every
        role and every module from gating on feedback&rdquo;, and FUNC-CC-0703-1-2 (L37605) adds
        &ldquo;every module from converting a feedback control into a required field&rdquo;. The
        Tenant Admin cell carries the note that says so:{' '}
        <code>{optionality.cells['Tenant Admin'].text}</code>.
      </p>
      <p className={REF}>
        L37497 — the two mandatory items are a decline&rsquo;s categorised reason and the note
        accompanying a lot-release request, and both are mandatory because they are parts of a
        governed decision rather than because they are feedback.
      </p>

      {/* ────── THE TWO WRITES OUTSIDE THE COUNTED TEN, AND THEIR CONTROLS ── */}
      <h2 className={H2}>Two writes that originate here and sit outside the closed set of ten</h2>
      <p data-testid="cc-07-outside-write-statement" className={NOTE}>
        {OUTSIDE_WRITE_COUNT_STATEMENT}
      </p>
      <ul className="mt-4 space-y-4">
        {OWN_OUTSIDE_WRITE_ACTS.map((act) => {
          const w = ownOutsideWrite(act)
          return (
            <li key={act} data-testid={`cc-07-outside-write-${w.exclusionKind}-${w.section}`}>
              <p className="font-medium">
                {w.act} · {w.section} · {w.exclusionKind}
              </p>
              <p className={NOTE}>{w.standing}</p>
              <p className={REF}>Granted: {w.granted}</p>
              <p className={REF}>Read at {w.sourceRefs.join(', ')}</p>
            </li>
          )
        })}
      </ul>
      <p className={REF}>
        DEC-CCWRITE-001 is raised at L35350, which names four writes and attributes these two to
        §6.5.5 and §6.8.2. This module&rsquo;s own Source status (L37630) files the same two under
        the same identifier. Neither is re-minted here; the register is wave 0&rsquo;s.
      </p>

      {/* ───────────── THE CONTROLS, LIVE AND FROZEN, BOTH DRAWN ────────── */}
      <h2 className={H2}>The controls, live and with the session frozen</h2>
      <p className={NOTE}>
        Both states are specified as fact and both are drawn, because a panel showing only one
        asserts nothing about the other. Live: L37497 — always optional, one tap, never required,
        never gating. Frozen: L37562 — &ldquo;feedback controls are disabled with the rest of the
        surface&rsquo;s write controls, and nothing is queued&rdquo;.
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div data-testid="cc-07-controls-live">
          <p className={REF}>Live session</p>
          <FeedbackAffordances mountedOn={CC07_MODULE.id} frozen={false} />
        </div>
        <div data-testid="cc-07-controls-frozen">
          <p className={REF}>Frozen session — FB-CC-SESS</p>
          <FeedbackAffordances mountedOn={CC07_MODULE.id} frozen={true} />
        </div>
      </div>
      <p className={REF}>
        The third feedback affordance of SB-CC-18 — the &ldquo;Annotate&rdquo; control beside each
        handoff-brief item, row 3 — is not among the two writes outside the ten: it writes to the
        Delivery Operations Hub brief record as well as the learning store (FUNC-CC-0702-2-1,
        L37599), and action 6 of the closed set is acknowledging and annotating the handoff brief.
        It is transcribed in the matrix and drawn on MOD-CC-12&rsquo;s screen, not here.
      </p>

      {/* ───────────── ROW 6 — THE ROW ABOUT THIS MODULE'S OWN SCREEN ───── */}
      <h2 className={H2}>{readView.capability}</h2>
      <p data-testid="cc-07-read-view-row" className={NOTE}>
        Row {CC07_ROW_LEARNING_READ_VIEW} ({readView.sourceRef}) is the only row that names a
        screen inside its cells, and the screen it names is this one. The Supervisor cell reads{' '}
        <code>{readView.cells.Supervisor.text}</code> and the Quality Manager cell reads{' '}
        <code>{readView.cells['Quality Manager'].text}</code>. The register row for{' '}
        {CC07_SCREEN.id} names one role in its &ldquo;Roles that can open it&rdquo; column:{' '}
        <code>{CC07_SCREEN.rolesColumn}</code> ({CC07_SCREEN.registerRef}). Both are rendered;
        neither is chosen.
      </p>

      {/* ───────────── THE DIVERGENCES, BOTH READINGS, NO WINNER ───────── */}
      <h2 className={H2}>Where another statement answers one of these questions differently</h2>
      <p className={NOTE}>
        No decision identifier covers any of these. <code>AC-CC-502</code> requires every cell to
        carry an explicit status and every cell does; that five statements give different statuses
        to the same actor is tested by no acceptance criterion at all. MTX-TEN-02c (L22054) is a
        fifth table answering the same question at module level, and it is the one that disagrees.
      </p>
      <ul className="mt-4 space-y-6">
        {CC07_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-07-divergence-${d.id}`}>
            <p className="font-medium">
              {d.subject} · {d.column}
              {d.ownRow === null ? '' : ` · row ${d.ownRow}`}
            </p>
            <p className={NOTE}>{d.question}</p>
            {d.readings.map((r: { text: string; locator: string }) => (
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

      {/* ─────────────── TWO GAPS THAT ARE NOT DIVERGENCES ─────────────── */}
      <h2 className={H2}>Two criteria asserted against nothing on this module</h2>
      <ul className="mt-4 space-y-6">
        {CC07_GAPS.map((g) => (
          <li key={g.id} data-testid={`cc-07-gap-${g.id}`}>
            <p className="font-medium">{g.binds}</p>
            <p className={NOTE}>{g.absence}</p>
            <p className={NOTE}>{g.notRepaired}</p>
            <p className={REF}>Read at {g.sourceRefs.join(', ')}</p>
          </li>
        ))}
      </ul>

      {/* ───────────────── SESSION OFFLINE AND THE FALLBACKS ────────────── */}
      <h2 className={H2}>This session offline</h2>
      <p data-testid="cc-07-session-offline" className={NOTE}>
        <code>{sess.id}</code> — {sess.triggeringCondition}. Decision controls:{' '}
        {sess.decisionControls} (&ldquo;{CC_FROZEN_CONTROL_REASON}&rdquo;). Client-side queueing:{' '}
        {sess.clientSideQueueing}. Terminal safe state: {sess.terminalSafeState}. L37562 adds this
        module&rsquo;s own reason for accepting the loss: &ldquo;a queued optional signal is not
        worth a second behaviour to explain&rdquo;, and points at option (b) of DEC-CCOFF-001 as
        the client&rsquo;s alternative. L37564 — on reconnect the controls return, no replay
        occurs, and the user may give the signal deliberately if they still wish to.
      </p>
      <p data-testid="cc-07-fallbacks" className={REF}>
        This module&rsquo;s three fallback identifiers, L37584: {write.id} for signal write
        failures, with the module-specific difference that a signal failure never blocks its
        underlying decision; {sess.id} for session loss; {agent.id} where the outputs being rated
        are absent. Terminal safe state on a failed write, L37607: the signal is lost and the
        decision, its mandatory elements and its audit entry are intact — losing a ranking hint is
        acceptable and losing or blocking a governed decision is not.
      </p>

      {/* ────────── WHERE ELSE THIS MODULE APPEARS, AND WHY NOT HERE ────── */}
      <h2 className={H2}>Mounted inside four other modules&rsquo; screens</h2>
      <p data-testid="cc-07-producers" className={NOTE}>
        L37570 names the modules that produce these signals — MOD-CC-04, MOD-CC-05, MOD-CC-06 and
        MOD-CC-12 — and SB-CC-18 (L37554) places the affordances on their screens rather than on
        this one: a row beneath the agent&rsquo;s interpretation on a deviation workspace, a
        two-state control beside each retrieved prior case, and an Annotate control beside each
        handoff-brief item. That is mounting, not ownership; it moves mention counts and is not
        evidence of a route. <code>FeedbackAffordances</code> is exported from this file for those
        four screens to mount, and none of their directories is edited from here.
      </p>
      <p className={REF}>
        MOD-CC-06 states the same relation from the other side and lists a different four —
        L37387: &ldquo;Consumes learning signals produced in MOD-CC-04, MOD-CC-05, MOD-CC-07 and
        MOD-CC-12&rdquo;, naming this module among the producers where L37570 names MOD-CC-06.
        Both lists are four long and they are not the same four; neither is corrected here.
      </p>

      {/* ──────────── THE ARTIFICIAL-INTELLIGENCE OVERLAY ──────────────── */}
      <h2 className={H2}>When artificial intelligence fails on this surface</h2>
      <p data-testid="cc-07-ai-behaviour" className={NOTE}>
        The behaviour matrix of §43.3.3 keys its rows on module NAMES, not identifiers. The row
        reading <code>{CC07_AI_FAILURE_ROW.moduleCell}</code> is attributed to{' '}
        <code>{CC07_MODULE.id}</code> because that string is this module&rsquo;s registered name and
        for no other reason. The behaviour cell reads{' '}
        <code>{CC07_AI_FAILURE_ROW.behaviourCell}</code>, classification{' '}
        {CC07_AI_FAILURE_ROW.classificationCell}; parsed as an outcome it is{' '}
        <code data-testid="cc-07-ai-outcome">{CC07_AI_FAILURE_CELL.outcome}</code>.{' '}
        {CC07_AI_FAILURE_READING.statement} {CC07_AI_FAILURE_READING.butTheThingRATEDMayBeGone}
      </p>
      <p data-testid="cc-07-ai-attribution" className={NOTE}>
        {CC07_AI_FAILURE_READING.attributionCaveat}
      </p>
      <p className={REF}>Read at {CC07_AI_FAILURE_READING.sourceRef}</p>

      <h2 className={H2}>What this module emits, and what it never claims</h2>
      <p data-testid="cc-07-provenance" className={NOTE}>
        Every element of this panel is a source table compared against a role and a module, which
        the classification tree resolves to <code>{CC07_RENDERED_ELEMENT_PROVENANCE}</code>. A
        signal, once a named person gives it, is attributed to that identity, which resolves to{' '}
        <code>{CC07_SIGNAL_PROVENANCE}</code>. The two are held on separate elements and neither
        is merged into the other. {CC07_NEVER_LIVE.hereItMeans}
      </p>
      <p className={REF}>{CC07_NEVER_LIVE.rule} Read at {CC07_NEVER_LIVE.sourceRef}</p>
      <p data-testid="cc-07-ai-element-obligation" className={NOTE}>
        {CC07_AI_ELEMENT_OBLIGATION.criterion} {CC07_AI_ELEMENT_OBLIGATION.hereItMeans}
      </p>
      <p className={REF}>Read at {CC07_AI_ELEMENT_OBLIGATION.sourceRef}</p>

      <h2 className={H2}>Rows that draw no control for anybody</h2>
      <p data-testid="cc-07-no-control-rule" className={NOTE}>
        {CC07_NO_CONTROL_RULE.rule} {CC07_NO_CONTROL_RULE.whyThisRow}{' '}
        {CC07_NO_CONTROL_RULE.andItIsAlreadyHeld}
      </p>
      <ul className="mt-2 space-y-1">
        {uniformlyProhibitedRows().map((row) => (
          <li key={row.ordinal} data-testid="cc-07-no-control-row" className="text-sm">
            Row {row.ordinal} — {row.capability} — prohibited in every column, so no control is
            drawn for any of them.{' '}
            <span className="text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
          </li>
        ))}
      </ul>
      <p className={REF}>Read at {CC07_NO_CONTROL_RULE.sourceRef}</p>

      <h2 className={H2}>The safety flag this surface would receive</h2>
      <div
        role="note"
        data-testid="cc-07-safety-flag-disclosure"
        className="mt-2 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
      >
        <p className="font-medium">
          Open decision {CC07_SAFETY_FLAG_DISCLOSURE.decisionRef}
        </p>
        <p className={NOTE}>{CC07_SAFETY_FLAG_DISCLOSURE.question}</p>
        <ul className="mt-3 space-y-2">
          {CC07_SAFETY_FLAG_DISCLOSURE.readings.map((r) => (
            <li key={r.locator} data-testid="cc-07-safety-flag-reading">
              {r.text} <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
            </li>
          ))}
        </ul>
        <p data-testid="cc-07-safety-flag-adopted" className={NOTE}>
          {CC07_SAFETY_FLAG_DISCLOSURE.adopted}
        </p>
        <p className={NOTE}>{CC07_SAFETY_FLAG_DISCLOSURE.whyHere}</p>
        <p data-testid="cc-07-safety-flag-co-discloser" className={NOTE}>
          {CC07_SAFETY_FLAG_DISCLOSURE.coDiscloser}
        </p>
        <p data-testid="cc-07-safety-flag-canon-note" className={REF}>
          {CC07_SAFETY_FLAG_DISCLOSURE.canonNote}
        </p>
      </div>

      <h2 className={H2}>What chapters 40 to 44 do not say about this module</h2>
      <ul className="mt-4 space-y-6">
        {CC07_DEGRADATION_GAPS.map((g) => (
          <li key={g.what} data-testid="cc-07-degradation-gap">
            <p className="font-medium">{g.what}</p>
            <p className={NOTE}>{g.measured}</p>
            <p className={NOTE}>{g.notRepaired}</p>
            <p className={REF}>Read at {g.sourceRefs.join(', ')}</p>
          </li>
        ))}
      </ul>

      {/* ────── THE ACTION RAIL, WHICH THIS SCREEN DELIBERATELY LACKS ───── */}
      <h2 className={H2}>Operational actions exercised here: none</h2>
      <p data-testid="cc-07-no-action-rail" className={NOTE}>
        L38793 names the seven modules whose screens exercise one or more of the ten operational
        actions, and this module is not among them. The route therefore leaves{' '}
        <code>actionRail</code> unfilled and <code>CommandCenterShell</code> renders its own
        declared <code>operational-action-set</code> seam. Ten operational controls on a screen
        that exercises none of them is exactly the drift the closed set exists to prevent. This
        module writes learning signals only, and L37519 says so: &ldquo;No operational record is
        altered by a feedback signal.&rdquo;
      </p>
    </section>
  )
}
