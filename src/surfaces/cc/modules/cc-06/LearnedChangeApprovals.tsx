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

import type { RoleId } from '@/domain/roles'
import { allow, deny } from '@/policy/decision'
import { CrossSurfaceLink } from '@/ui/CrossSurfaceLink'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { WriteControl } from '@/ui/WriteControl'
import {
  CC_LINK_OUT_CELLS,
  ccLinkOutModel,
  type CcLinkOutCell,
} from '@/surfaces/cc/decisions/link-outs'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC06_COLUMNS,
  CC06_LINK_OUT_CELL_ID,
  CC06_MATRIX,
  CC06_MODULE,
  CC06_ROW_HELD_ELSEWHERE,
  CC06_SCREEN,
  cc06Row,
  type Cc06Column,
} from './matrix'
import {
  CC06_AGING,
  CC06_APPROVED_NOT_PUBLISHED,
  CC06_CONFIGURATION_BOUNDARY,
  CC06_DIVERGENCES,
  CC06_LANEB_STANDING,
  CC06_PACKAGE_TESTS,
  CC06_PKGFIELD_DISCLOSURE,
  CC06_XSURFACE_ROWS,
  ccLaneBApplication,
} from './lane-b'

/**
 * `MOD-CC-06` — LEARNED-CHANGE APPROVALS (LANE B), RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix.ts`, `./lane-b.ts` and five shared modules,
 * every one of which exports plain data objects. A `'use client'` directive
 * on this file or on any of those would replace those exports with client
 * references and the strings would be gone by the time a route prerenders —
 * the defect that put an undefined module id into four built pages in slice 7
 * while every component test stayed green.
 *
 * ══ THE ONE THING THIS PANEL EXISTS TO DRAW ══════════════════════════════
 *
 * The Lane B application path. §26.7 marks Command Center configuration
 * editing `Explicitly prohibited` at L49595 and grants the Lane B decision at
 * L49593, and `AC-CC-060` (L35470) is what holds them together: "exactly one
 * outbound configuration path, the Lane B application path". A panel built
 * from the prohibition alone renders an empty cell and enforces the
 * criterion against nothing. Both rows render below with their locators, the
 * boundary is stated as a boundary rather than disclosed as a contradiction,
 * and the path itself renders in all three of its outcomes.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `CrossSurfaceLink` and `ccLinkOutModel` for row 7, already registered as
 *    `cc-06-edit-configured-value`. No link and no href is spelled here.
 *  - `WriteControl` for the three decision controls. The not-decidable case
 *    goes through its `missingElement` branch, which is the branch wave 0
 *    added for exactly this: the item's context is incomplete, the missing
 *    element is named, the control is disabled and the waiting clock keeps
 *    running.
 *  - `ccElementAssignment` for the proposal's freshness obligation. §21.3's
 *    table assigns `Lane B proposal arrival` to this module as `Pushed` with
 *    an age-in-days obligation; that assignment is read, never restated.
 *  - `DecisionDisclosure` for `DEC-LANEB-001`, which the shared canon carries.
 *    Pointed at, not respelled.
 *  - NOTHING for the ten operational actions. `MOD-CC-13`'s action rail is
 *    mounted on this route by `app/command-center/learned-change-approvals/`
 *    and draws all ten; this panel names the one L38793 gives this module —
 *    action 3 — and draws no control for it. The control belongs on the
 *    surface and the record does not.
 *
 * ── THE ILLUSTRATIVE PROPOSAL IS THE SOURCE'S OWN, AND LABELLED ONE ──────
 *
 * `SB-CC-17` (L37355) is §21.9's own proposal card, and every value below
 * comes off it: the header at L37357, the value row at L37359, the scope row
 * at L37361, the evidence at L37363, the package test row at L37365 and the
 * age row at L37367. Nothing is invented and nothing is computed from a
 * clock.
 */

/* ==================================================================== *
 * THE STORYBOARD'S OWN PROPOSAL CARD, PANEL BY PANEL.
 * ==================================================================== */
const SB_CC_17 = [
  { label: 'Header', text: 'Coaching trigger, screen 6 · Assembly — Wheel Bolt Torque Verification', sourceRef: 'L37357' },
  { label: 'Value', text: '80 percent → 75 percent of expected step time', sourceRef: 'L37359' },
  {
    label: 'Scope',
    text: 'Affects 1 workflow, 1 screen · 3 runs currently scheduled this week inherit this value',
    sourceRef: 'L37361',
  },
  {
    label: 'Evidence',
    text:
      '11 activations over six weeks. 2 prevented a deviation. 9 escalated into a deviation. At 75 percent, the coaching window would have covered 8 of the 9.',
    sourceRef: 'L37363',
  },
  {
    label: 'Package test',
    text: 'Package-borne · approval publishes a patch version · Bright Bikes adoption timing: next run boundary.',
    sourceRef: 'L37365',
  },
  { label: 'Age', text: 'Created 12 days ago · stale flag at 30 days.', sourceRef: 'L37367' },
] as const satisfies readonly {
  readonly label: string
  readonly text: string
  readonly sourceRef: string
}[]

const linkOutCell = (id: string): CcLinkOutCell => {
  const found = CC_LINK_OUT_CELLS.find((c) => c.id === id)
  if (found === undefined) {
    throw new Error(
      `MOD-CC-06 expects link-out cell "${id}" in src/surfaces/cc/decisions/link-outs.ts. ` +
        'Row 7 renders a link INSTEAD of a control and there is no local spelling of one here.',
    )
  }
  return found
}

const NEVER_QUEUED =
  'this surface holds nothing and queues nothing in any state; the decision commits synchronously or not at all'

const H2 = 'mt-10 text-xl font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

export interface LearnedChangeApprovalsProps {
  /** Whose column the matrix is read down. The matrix itself renders whole. */
  readonly viewerRole: RoleId
}

export function LearnedChangeApprovals({ viewerRole }: LearnedChangeApprovalsProps) {
  const heldElsewhere = cc06Row(CC06_ROW_HELD_ELSEWHERE)
  const approve = cc06Row(3)
  const annotate = cc06Row(2)
  const arrival = ccElementAssignment(CC06_AGING.elementName)
  const sess = ccFallbackPatternById('FB-CC-SESS')
  const queue = ccFallbackPatternById('FB-CC-QUEUE')

  return (
    <section data-testid="cc-06-approvals" data-module={CC06_MODULE.id}>
      <p data-testid="cc-06-identity" className={REF}>
        {CC06_MODULE.id} · {CC06_MODULE.name} · identity {CC06_MODULE.sourceRef} ·{' '}
        {CC06_MODULE.specSection} · rendered on {CC06_SCREEN.id}, register row{' '}
        {CC06_SCREEN.registerRef}
      </p>

      {/* ─────────────────────────── THE MATRIX ─────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Eight rows, five persona columns, forty cells, transcribed header-keyed from L37292. The
        column order is Tenant Admin first and Worker last, the inversion of every Frontline matrix.
        Four status tokens are used, one more than any other module matrix on this surface:{' '}
        <code>Read-only</code> appears here and is neither an absence nor a refusal. Row{' '}
        {CC06_ROW_HELD_ELSEWHERE} is the only row whose prohibition names a place a person may go,
        and it renders as a link rather than as a control.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-06-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC06_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC06_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-06-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC06_COLUMNS.map((c: Cc06Column) => (
                  <td key={c} data-testid={`cc-06-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ════════════ THE CONFIGURATION BOUNDARY — BOTH §26.7 ROWS ══════ */}
      <h2 className={H2}>
        The one outbound configuration path, and the row that looks like its denial
      </h2>
      <p className={NOTE}>
        §26.7&rsquo;s cross-surface matrix carries both of these, and read one at a time they say
        opposite things about this surface. Read together with{' '}
        <code>{CC06_CONFIGURATION_BOUNDARY.criterion}</code> they are a boundary, and building from
        the prohibition alone would leave that criterion asserted against nothing.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-06-xsurface" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Record type</th>
              <th scope="col">Single source of truth</th>
              <th scope="col">Client Command Center</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC06_XSURFACE_ROWS.map((r) => (
              <tr key={r.line} data-testid={`cc-06-xsurface-row-${r.line}`}>
                <th scope="row" className="font-normal">
                  {r.recordType}
                </th>
                <td>{r.singleSourceOfTruth}</td>
                <td data-testid={`cc-06-xsurface-cc-${r.line}`}>{r.commandCenterCell}</td>
                <td className="text-[var(--color-ink-subtle)]">L{r.line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        role="note"
        data-testid="cc-06-configuration-boundary"
        data-is-contradiction={String(CC06_CONFIGURATION_BOUNDARY.isContradiction)}
        className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          L{CC06_CONFIGURATION_BOUNDARY.grantingRowLine} and L
          {CC06_CONFIGURATION_BOUNDARY.prohibitingRowLine} are a boundary, not a contradiction
        </p>
        <p className={NOTE}>
          <span className="font-medium">
            {CC06_CONFIGURATION_BOUNDARY.criterion} (L{CC06_CONFIGURATION_BOUNDARY.criterionLine}):{' '}
          </span>
          {CC06_CONFIGURATION_BOUNDARY.criterionText}
        </p>
        <p className={NOTE}>
          <span className="font-medium">
            L{CC06_CONFIGURATION_BOUNDARY.grantingRowLine} governs:{' '}
          </span>
          {CC06_CONFIGURATION_BOUNDARY.grantingRowGoverns}
        </p>
        <p className={NOTE}>
          <span className="font-medium">
            L{CC06_CONFIGURATION_BOUNDARY.prohibitingRowLine} governs:{' '}
          </span>
          {CC06_CONFIGURATION_BOUNDARY.prohibitingRowGoverns}
        </p>
        <p className={NOTE}>{CC06_CONFIGURATION_BOUNDARY.whyNot}</p>
        <p data-testid="cc-06-boundary-cost" className={NOTE}>
          <span className="font-medium">What reading only the prohibition would cost: </span>
          {CC06_CONFIGURATION_BOUNDARY.costOfReadingOnlyTheProhibition}
        </p>
        <p className={REF}>
          Also stated at{' '}
          {CC06_CONFIGURATION_BOUNDARY.alsoStatedAt.map((n) => `L${n}`).join(' and ')}.
        </p>
      </div>

      {/* ═════════════════ THE PATH ITSELF, ALL THREE OUTCOMES ═════════ */}
      <h2 className={H2}>The Lane B application path</h2>
      <p className={NOTE}>
        One question decides where an approved change lands: is the value package-borne — does it
        travel inside the work package the device carries and evaluates, possibly offline — or
        server-only (L37275)? The decision is always human; the publication is automatic and fully
        audited (L37280). Nothing on this surface writes: the decision is here and the record is on
        the surface that owns the value.
      </p>
      <div className="mt-4 space-y-6">
        {CC06_PACKAGE_TESTS.map((test) => {
          const outcome = ccLaneBApplication(test)
          return (
            <div
              key={test}
              data-testid={`cc-06-path-${test}`}
              data-outcome={outcome.kind}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
            >
              <p className="font-medium">Package test: {test}</p>
              {outcome.kind === 'applies' ? (
                <>
                  <ol className="mt-2 list-decimal pl-6 text-sm">
                    {outcome.steps.map((s) => (
                      <li key={s.ordinal} className="mt-1 text-[var(--color-ink-muted)]">
                        {s.step}{' '}
                        <span className="text-[var(--color-ink-subtle)]">[{s.sourceRef}]</span>
                      </li>
                    ))}
                  </ol>
                  <p className={REF}>
                    Terminal safe state where publication ultimately cannot complete:{' '}
                    {outcome.terminalSafeState}
                  </p>
                </>
              ) : (
                <>
                  <p className={NOTE}>{outcome.why}</p>
                  <div className="mt-3">
                    <WriteControl
                      label={approve.capability}
                      decision={allow('BASE_ROLE', [`MOD-CC-06 ${approve.sourceRef}`])}
                      roleName="Quality Manager"
                      gateReason={null}
                      objectReason={null}
                      refusalNote="Unused on this rendering: the Quality Manager is allowed on this row."
                      neverQueuedNote={NEVER_QUEUED}
                      missingElement={outcome.missingElement}
                      onAct={NO_ACT}
                    />
                  </div>
                  <p className={REF}>
                    Open decision {outcome.openDecision} · {outcome.sourceRef} · fallback{' '}
                    {queue.id}, {queue.triggeringCondition}
                  </p>
                </>
              )}
            </div>
          )
        })}
      </div>
      <p
        role="note"
        data-testid="cc-06-approved-not-published"
        className="mt-4 max-w-prose rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-ink-muted)]"
      >
        <span className="font-medium text-[var(--color-ink)]">
          {CC06_APPROVED_NOT_PUBLISHED.state}, never{' '}
          {CC06_APPROVED_NOT_PUBLISHED.neverRenderedAs}:{' '}
        </span>
        {CC06_APPROVED_NOT_PUBLISHED.why}{' '}
        <span className="text-[var(--color-ink-subtle)]">
          [{CC06_APPROVED_NOT_PUBLISHED.sourceRefs.join(' · ')}]
        </span>
      </p>

      {/* ══════════════ ROW 7 — A LINK INSTEAD OF A CONTROL ═══════════ */}
      <h2 className={H2}>{heldElsewhere.capability} — held on another surface</h2>
      <p className={NOTE}>
        The Tenant Admin cell of {heldElsewhere.sourceRef} reads{' '}
        <code>{heldElsewhere.cells['Tenant Admin'].text}</code>. Rendered through the build&rsquo;s
        one rule, <code>explicitlyProhibited</code> draws nothing at all — an empty cell exactly
        where the source spells out where the act lives. This is the other half of the same
        boundary: the configuration edit is prohibited here and named elsewhere, and the Lane B
        decision above is the one path that is not.
      </p>
      <div className="mt-4">
        <CrossSurfaceLink model={ccLinkOutModel(linkOutCell(CC06_LINK_OUT_CELL_ID), viewerRole)} />
      </div>

      {/* ═══════════════════ THE STORYBOARD'S PROPOSAL ════════════════ */}
      <h2 className={H2}>A Lane B proposal card</h2>
      <dl data-testid="cc-06-proposal-card" className="mt-3 text-sm">
        {SB_CC_17.map((panel) => (
          <div key={panel.label} className="mt-2">
            <dt className="font-medium">{panel.label}</dt>
            <dd className="text-[var(--color-ink-muted)]">
              {panel.text}{' '}
              <span className="text-[var(--color-ink-subtle)]">[{panel.sourceRef}]</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className={REF}>
        Illustrative, from the source&rsquo;s own storyboard SB-CC-17 (L37355). Every value is the
        storyboard&rsquo;s; none is computed and no clock is read. {arrival.element}:{' '}
        {arrival.classCell} · {arrival.markerObligation} · {arrival.sourceRef}.
      </p>

      {/* ═════════════ THE DECISION CONTROLS, AS THE ROWS STATE THEM ═══ */}
      <h2 className={H2}>The decision row, drawn for the two roles that reach it</h2>
      <p className={NOTE}>
        Row 3 and row 4 give the Quality Manager <code>Allowed</code> and the Supervisor{' '}
        <code>Explicitly prohibited</code>; row 2 gives the Supervisor{' '}
        <code>{annotate.cells.Supervisor.text}</code>. The prefix matters here more than anywhere
        else in this matrix: <code>Allowed</code> is a prefix of{' '}
        <code>Allowed with conditions</code>, and a classifier that read row 2 as an unconditional
        grant would hand the Supervisor the decision this module exists to withhold.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div data-testid="cc-06-supervisor-annotate">
          <p className={REF}>Supervisor · row 2 · {annotate.sourceRef}</p>
          <WriteControl
            label={annotate.capability}
            decision={allow('BASE_ROLE', [`MOD-CC-06 ${annotate.sourceRef}`])}
            roleName="Supervisor"
            gateReason={null}
            objectReason={null}
            refusalNote="Unused on this rendering: the Supervisor is granted annotation."
            neverQueuedNote={NEVER_QUEUED}
            onAct={NO_ACT}
          />
          <p className={REF}>
            Condition, verbatim from the cell: {annotate.cells.Supervisor.note ?? 'none'}.
          </p>
        </div>
        <div data-testid="cc-06-supervisor-approve">
          <p className={REF}>Supervisor · row 3 · {approve.sourceRef}</p>
          <WriteControl
            label={approve.capability}
            decision={deny(
              'explicitlyProhibited',
              'EXPLICIT_DENY',
              'The Supervisor is explicitly prohibited from approving a Lane B proposal.',
              {
                stage: 'BASE_ROLE',
                sourceRefs: [`MOD-CC-06 ${approve.sourceRef}`, 'MOD-CC-13 L38684'],
              },
            )}
            roleName="Supervisor"
            gateReason={null}
            objectReason={null}
            refusalNote="Decision authority is Quality Manager and above: Supervisors observe and annotate, and record-affecting authority sits with the Quality Manager (L37271). Nothing is drawn here."
            neverQueuedNote={NEVER_QUEUED}
            onAct={NO_ACT}
          />
        </div>
      </div>

      {/* ═══════════════ THE DIVERGENCES, BOTH READINGS, NO WINNER ════ */}
      <h2 className={H2}>Where another table answers one of these rows differently</h2>
      <p className={NOTE}>
        No decision identifier covers either of these. <code>AC-CC-502</code> requires every cell to
        carry an explicit status and every cell does; that four tables give different statuses to
        the same act is tested by no acceptance criterion at all. The first is the shape the surface
        deliberately left open in slice 8 — a decomposition that may or may not be a contradiction —
        and it is left open here for the same reason.
      </p>
      <ul className="mt-4 space-y-6">
        {CC06_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-06-divergence-${d.id}`}>
            <p className="font-medium">
              Row{d.ownRows.length === 1 ? '' : 's'} {d.ownRows.join(', ')} · {d.column}
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

      {/* ═══════════════════════ THE TWO DECISIONS ════════════════════ */}
      <h2 className={H2}>Two recorded contradictions touch this module</h2>
      <p className={NOTE}>
        L37282 — and the source says they &ldquo;must not be resolved silently&rdquo;. They stand
        differently to the shared decision canon and are disclosed differently for that reason.
      </p>

      <div data-testid="cc-06-laneb-standing" className="mt-4">
        <DecisionDisclosure id="DEC-LANEB-001" />
        <p className={NOTE}>
          <span className="font-medium">
            The canon holds this record and it states the Standards and Operations Studio&rsquo;s
            side of the question:{' '}
          </span>
          {CC06_LANEB_STANDING.differenceFromTheCanonRecord} §21.9 raises the same identifier at L
          {CC06_LANEB_STANDING.chapter21Line} and recommends{' '}
          {CC06_LANEB_STANDING.chapter21Recommendation}; the decision owner it names is{' '}
          {CC06_LANEB_STANDING.chapter21Owner}. A recommendation is not an adoption and nothing here
          promotes it to one.
        </p>
        <p className={REF}>{CC06_LANEB_STANDING.whyNotRespelled}</p>
      </div>

      <div
        data-testid="cc-06-pkgfield"
        className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          {CC06_PKGFIELD_DISCLOSURE.decisionRef} — open, and absent from the shared canon
        </p>
        <p className={NOTE}>{CC06_PKGFIELD_DISCLOSURE.question}</p>
        {CC06_PKGFIELD_DISCLOSURE.readings.map((r, i) => (
          <p key={r.locator + String(i)} className={NOTE}>
            {r.text} <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
          </p>
        ))}
        <p className={NOTE}>{CC06_PKGFIELD_DISCLOSURE.canonNote}</p>
        <p className={NOTE}>
          <span className="font-medium">What this module does meanwhile: </span>
          {CC06_PKGFIELD_DISCLOSURE.behaviour}
        </p>
        <p className={REF}>{CC06_PKGFIELD_DISCLOSURE.sourceRefs.join(' · ')}</p>
      </div>

      {/* ════════ THE OPERATIONAL ACTION THIS SCREEN EXERCISES ════════ */}
      <h2 className={H2}>Operational actions exercised here</h2>
      <p data-testid="cc-06-exercised-actions" className={NOTE}>
        Two independent lines of the source name the same one: L37387 — this module
        &ldquo;exercises action 3 of <code>MOD-CC-13</code>&rdquo; — and L38793, which names the
        seven modules whose screens exercise one or more of the ten and gives this one action 3.{' '}
        <span className="font-medium">The control itself is not drawn twice on this screen.</span>{' '}
        <code>MOD-CC-13</code>&rsquo;s action rail is mounted on this route and draws all ten with
        each one&rsquo;s owning place and audit obligation; a second control here would be a second
        spelling of it, and the ten are a closed set with one owner.
      </p>

      {/* ═══════════════════════ SESSION OFFLINE ══════════════════════ */}
      <h2 className={H2}>This session offline</h2>
      <p data-testid="cc-06-session-offline" className={NOTE}>
        <code>{sess.id}</code> — {sess.triggeringCondition}. Decision controls:{' '}
        {sess.decisionControls} (&ldquo;{CC_FROZEN_CONTROL_REASON}&rdquo;). Client-side queueing:{' '}
        {sess.clientSideQueueing}. Terminal safe state: {sess.terminalSafeState}. Unlike gate items,
        Lane B proposals carry no timeout, so a disconnected approver delays nothing beyond their
        own decision, and the {CC06_AGING.staleAfterDays}-day stale flag continues server-side
        (L37377).
      </p>
      <p className={REF}>
        This module&rsquo;s four fallback identifiers, L37402: FB-CC-QUEUE for incomplete proposal
        context including an indeterminate package test; FB-CC-WRITE for decision failures;
        FB-CC-SESS for session loss; FB-CC-AGENT for proposal-generation unavailability. With agents
        unavailable no new proposals arise, existing proposals remain decidable, and the queue says
        so, so that an empty queue is not misread as a settled configuration (L37383).
      </p>
    </section>
  )
}

/**
 * `WriteControl` requires `onAct`. Every control above is either a refusal or
 * disabled for want of a resolved element, so none reaches it — a no-op is
 * the honest value and a real one would be a second claim that the act is
 * performed here rather than through the owning service.
 */
function NO_ACT(): void {
  /* Every rendering above is a refusal or a disabled control; never reached. */
}
