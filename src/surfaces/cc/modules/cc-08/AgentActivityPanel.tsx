'use client'

/**
 * A CLIENT COMPONENT, AND THE BUILD IS WHAT SAID SO.
 *
 * This panel renders one `WriteControl` with an `allow(...)` decision — the
 * Supervisor's live re-check at L37674 — and that is `WriteControl`'s only
 * branch that reaches `<Button onClick={onAct}>`. `Button` is a client
 * component, so a SERVER component passing `onAct` hands a function across the
 * boundary and the static export refuses: "Event handlers cannot be passed to
 * Client Component props."
 *
 * IT WAS 34 UNIT AND 15 COMPONENT TESTS GREEN. A component suite mounts the
 * component; the server/client boundary only exists in a build, so nothing but
 * `pnpm build` could see it. That is the fourth defect of this class in this
 * build and the second on this surface.
 *
 * WHY NOT MARK `WriteControl` INSTEAD. Tried, and it is worse: the control is
 * rendered by seven Command Center panels that are all server components and
 * all pass `onAct`. While the control is a server component that pass is
 * server-to-server and only its own enabled branch crosses; marking it client
 * makes EVERY one of those seven passes cross the boundary, turning one broken
 * route into seven. The boundary belongs at the caller that needs
 * interactivity.
 *
 * The six sibling panels are one `allow()` away from this and only render
 * refusals today. `tests/coverage/slice-09-gates.test.ts` should hold that.
 *
 * This file exports a props interface and a component and no data object — a
 * `'use client'` file whose plain data a server component reads returns
 * undefined strings at prerender, which is how four panels shipped with an
 * undefined module id in slice 7.
 */

import type { RoleId } from '@/domain/roles'
import { allow, deny } from '@/policy/decision'
import { crossMatrixContradiction } from '@/ai/agents/contracts'
import { CrossSurfaceLink } from '@/ui/CrossSurfaceLink'
import { DeterministicBoundary } from '@/ui/shared/DeterministicBoundary'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import { WriteControl } from '@/ui/WriteControl'
import {
  CC_LINK_OUT_CELLS,
  ccLinkOutModel,
  type CcLinkOutCell,
} from '@/surfaces/cc/decisions/link-outs'
import {
  ccFallbackPatternById,
  ccFunctionalitiesNamingNoPattern,
} from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC08_ABSENCE_IS_CORRECT_ROW,
  CC08_COLUMNS,
  CC08_LINK_OUT_ROWS,
  CC08_MATRIX,
  CC08_MODULE,
  CC08_SCREEN,
  cc08Row,
  type Cc08Column,
} from './matrix'
import {
  CC08_ACTION_NINE_DISAGREEMENT,
  CC08_COMPOSED_AGENT_GAP,
  CC08_DECLARED_FALLBACKS,
  CC08_DIVERGENCES,
  CC08_FUNCTIONALITIES,
} from './readings'
import {
  CC08_DEGRADATION_PROVENANCE,
  CC08_DEGRADATION_SEAMS,
  CC08_NO_AI_CLAIMS,
  CC08_PAUSE_BANNER_STATEMENTS,
  cc08HealthFlagRollUpLeak,
  cc08PauseDistinguishability,
  cc08PauseStates,
  distinctPauseBannerTexts,
  modesSharingAPauseLabel,
  scopelessPauseBannerStatements,
} from './degradation'

/**
 * `MOD-CC-08` — THE AGENT ACTIVITY PANEL, RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix.ts`, `./readings.ts` and four wave-0 modules,
 * every one of which exports plain data objects. A `'use client'` directive
 * on this file or on any of those would replace those exports with client
 * references and the strings would be gone by the time a route prerenders —
 * the defect that put an undefined module id into four built pages in slice 7
 * while every component test stayed green, because a component suite mounts
 * the component and the client boundary only exists in a build.
 *
 * ── THE MODULE THIS SURFACE'S LINK-OUT COMPONENT EXISTS FOR ──────────────
 *
 * Two cells of this matrix read `Explicitly prohibited` in the Tenant Admin
 * column and their own text names where the act lives: L37671 "a Standards
 * and Operations Studio action, linked from here" and L37672 "Studio or
 * platform action". `FUNC-CC-0801-1-2` (L37781) states the affordance in the
 * positive — "Link to the Standards and Operations Studio for switching,
 * never switch here" — and `AC-CC-301` (L37802) generalises it: "each such
 * control is a link to the Standards and Operations Studio or the platform
 * side."
 *
 * `src/ui/WriteControl.tsx` draws `explicitlyProhibited` at `BASE_ROLE` as a
 * `ProhibitionNotice` with `kind: 'absent'` — a plain note where a control
 * would be, and NO LINK. So transcribing the token correctly and rendering it
 * through the build's one rule produces a cell with no link in exactly the two
 * places the source spells out a destination: a correct transcription and a
 * wrong screen. Both cells are already registered in task 5's
 * `src/surfaces/cc/decisions/link-outs.ts` as `cc-08-switch-agent` and
 * `cc-08-reconfigure-agent`, and `CrossSurfaceLink` renders them here. No link
 * is spelled in this file and no href is typed in it.
 *
 * ── THE THIRD PROHIBITION IS NOT THE SAME SHAPE, AND IS DRAWN DIFFERENTLY ─
 *
 * Row 8's Tenant Admin cell reads `Explicitly prohibited — platform-internal`
 * (L37673): the same token, the same trailing note, and NO destination.
 * `AC-CC-303` (L37804) is "No Command Center endpoint returns orchestrator
 * reasoning internals", so an absence is exactly what the source asks for and
 * a link would be the opposite defect. It is drawn through `WriteControl` and
 * placed beside the two link-outs on purpose: the difference between the
 * three is the note, not the token, and reading the token alone renders two
 * of them wrongly.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `CrossSurfaceLink` and `ccLinkOutModel` for rows 6 and 7.
 *  - `WriteControl` for row 8 and for both readings of row 9's Tenant Admin
 *    cell, and for the frozen session — which reaches it through `gateReason`
 *    rather than a sixth branch, because a frozen session is a condition
 *    outside the person and outside the record that closes the control.
 *  - `ccElementAssignment` for the two §21.3 rows that name this module:
 *    `Agent output produced` (Pushed) and `Coaching indicators` (Refreshed).
 *    Read, never restated, so a change to that table changes this panel.
 *  - `ccFunctionalitiesNamingNoPattern` for `AC-CC-090`, which this module
 *    FAILS on two of its nine functionalities. The failure is rendered, not
 *    repaired.
 *  - NOTHING for the ten operational actions. See below.
 *
 * ── THE ACTION RAIL IS NOT MOUNTED HERE, AND THAT IS A RULING ────────────
 *
 * L38793 enumerates the seven modules whose screens exercise one or more of
 * the ten and does not name this one. L37757, this module's own paragraph,
 * says it "exercises action 9 of `MOD-CC-13`". Both are recorded in
 * `./readings.ts` and neither is adopted; the rail is left unfilled and the
 * shell renders its declared `operational-action-set` seam. Ten operational
 * controls on a screen the enumeration does not name is the drift the closed
 * set exists to prevent.
 */

const H2 = 'mt-10 text-xl font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

/* ==================================================================== *
 * THE STORYBOARD'S OWN STATUS BLOCK, AT THE MOMENT `SB-CC-19` DESCRIBES.
 *
 * L37725 is the header and L37727-L37729 are its three data rows — counted by
 * reading them, and the line after the third is blank. Six columns: the agent
 * and the five status fields `AC-CC-300` requires. It is rendered because the
 * criterion cannot be shown without an instance, and it is labelled an
 * illustration rather than a value.
 * ==================================================================== */
const STORYBOARD_STATUS = [
  {
    agent: 'Prevention Agent',
    state: 'On',
    activations: '2',
    lastActivation: '11:47',
    outputs: '2 coaching cards',
    waiting: '0',
    sourceRef: 'L37727',
  },
  {
    agent: 'Deviation and Containment Agent',
    state: 'On',
    activations: '2',
    lastActivation: '10:22',
    outputs: '2 deviation records, 1 gate item, 1 learned-change proposal',
    waiting: '0',
    sourceRef: 'L37728',
  },
  {
    agent: 'Shift Handoff Agent',
    state: 'On',
    activations: '1',
    lastActivation: '05:30',
    outputs: '1 brief for Day Shift',
    waiting: 'Not applicable — reasoning agent, no gate',
    sourceRef: 'L37729',
  },
] as const satisfies readonly {
  readonly agent: string
  readonly state: string
  readonly activations: string
  readonly lastActivation: string
  readonly outputs: string
  readonly waiting: string
  readonly sourceRef: string
}[]

/** The five status-field headings of L37725, after the `Agent` column. */
const STATUS_FIELDS = [
  'State',
  'Activations this shift',
  'Last activation',
  'Outputs produced',
  'Waiting at the gate',
] as const satisfies readonly string[]

const linkOutCell = (id: string): CcLinkOutCell => {
  const found = CC_LINK_OUT_CELLS.find((c) => c.id === id)
  if (found === undefined) {
    throw new Error(
      `MOD-CC-08 expects link-out cell "${id}" in src/surfaces/cc/decisions/link-outs.ts. ` +
        'Rows 6 and 7 render a link INSTEAD of a control and there is no local spelling of one ' +
        'here.',
    )
  }
  return found
}

const NEVER_QUEUED = 'FB-CC-WRITE queues nothing on this surface in any state'

export interface AgentActivityPanelProps {
  /** Whose column the link-out pointer is checked for. The matrix renders whole. */
  readonly viewerRole: RoleId
}

export function AgentActivityPanel({ viewerRole }: AgentActivityPanelProps) {
  const traceRow = cc08Row(CC08_ABSENCE_IS_CORRECT_ROW)
  const recheck = cc08Row(9)
  const rollUp = cc08Row(5)
  const agentOutput = ccElementAssignment('Agent output produced')
  const coaching = ccElementAssignment('Coaching indicators')
  const sess = ccFallbackPatternById('FB-CC-SESS')
  const agentFb = ccFallbackPatternById('FB-CC-AGENT')
  const silentFunctionalities = ccFunctionalitiesNamingNoPattern(CC08_FUNCTIONALITIES)
  const pauses = cc08PauseStates()
  const tellApart = cc08PauseDistinguishability()
  const leak = cc08HealthFlagRollUpLeak()
  const degradationRow = crossMatrixContradiction('tenant-admin-and-the-ai-degradation-state')
  const switchRow = crossMatrixContradiction('switch-an-agent-on-or-off')

  return (
    <section data-testid="cc-08-panel" data-module={CC08_MODULE.id}>
      <p data-testid="cc-08-identity" className={REF}>
        {CC08_MODULE.id} · {CC08_MODULE.name} · identity {CC08_MODULE.sourceRef} ·{' '}
        {CC08_MODULE.specSection} · rendered on {CC08_SCREEN.id}, register row{' '}
        {CC08_SCREEN.registerRef}
      </p>

      {/* ── THE PAUSE BANNER — AC-42-303, AND WHAT TELLS THE TWO APART ── */}
      <h2 className={H2}>While the agents are paused</h2>
      <p className={NOTE}>
        SB-42-301 (L89348) names this panel as the Command Center surface that carries the pause
        banner. Two of the sixteen operating modes are pauses, and a tenant reading one needs to
        know which: a paused workspace and a paused platform call for different human responses.
        The two are rendered separately, with the message taken from the failure catalogue&rsquo;s
        own tenant-web cell and never spelled on this screen.
      </p>
      <div className="mt-4 space-y-4" data-testid="cc-08-pause-banners">
        {pauses.map((pause) => (
          <div
            key={pause.mode.id}
            data-testid={`cc-08-pause-${pause.scope}`}
            data-mode={pause.mode.id}
            data-failure={pause.failure.id}
            className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
          >
            <p className="font-medium">{pause.tenantWebMessage}</p>
            <p className={NOTE}>
              {pause.mode.id} {pause.mode.name} · {pause.failure.id}{' '}
              {pause.failure.cells.failureMode} · scope {pause.scope} · operational severity{' '}
              {pause.operationalSeverity}, which is the response spine&rsquo;s own band and shares
              no rendering with the manufacturing severity catalogue.
            </p>
            <p className={NOTE}>
              Terminal safe state: {pause.failure.cells.terminalSafeState}. Recovery:{' '}
              {pause.failure.cells.recovery}. Reconciliation: {pause.failure.cells.reconciliation}.
              No control here resumes anything — a resume is a separate audited act on the Super
              Admin platform console.
            </p>
            <p className={REF}>
              Message {pause.failure.attributeLocators[0] === undefined ? '' : 'L'}
              {pause.failure.attributeLocators[0]} · mode row {pause.mode.matrixLocator} ·{' '}
              {pause.inference}
            </p>
          </div>
        ))}
      </div>
      <p data-testid="cc-08-ac-42-303" className={NOTE}>
        <code>AC-42-303</code> requires a paused platform to be distinguishable from an
        unreachable one wherever a state is shown. Measured on the two pause modes rather than
        assumed: the mode contract matrix separates them on{' '}
        {tellApart.modeContractColumnsThatDiffer.length === 0
          ? 'no column at all'
          : tellApart.modeContractColumnsThatDiffer.join(', ')}{' '}
        — the two rows are identical across worker label, invocation, deterministic safety,
        escalation delivery and classification. What separates them here is{' '}
        {tellApart.distinguishedBy}. The worker label alone resolves to{' '}
        {modesSharingAPauseLabel().join(', ')}, so nothing on this panel keys on it.
      </p>
      {/*
        DECLARED A GUIDANCE ELEMENT, so the exactly-one lint has something to
        inspect. A caller that renders a class without declaring the region is
        caught by nobody, which is the half of `AC-42-401` a rendering path can
        skip silently.
      */}
      <div
        className="mt-4"
        data-testid="cc-08-degradation-provenance"
        data-guidance-element="MOD-CC-08 agent degradation state"
      >
        <ProvenanceMark
          classId={CC08_DEGRADATION_PROVENANCE}
          statement="Every statement on this panel about an agent not running is a record of absence. No model produced it, no approved asset carries it and no person instructed it, so it is not live artificial intelligence and is never described as any. The activity log below keeps rendering its historical entries throughout (L37753)."
        />
      </div>
      <p className={NOTE}>
        The banner&rsquo;s own claim is that deterministic safety is untouched, so the boundary is
        rendered rather than asserted. It is drawn for the platform-wide pause; the deterministic
        standing is the same under either, because the deterministic column reads{' '}
        <code>Allowed</code> on all sixteen modes.
      </p>
      <div className="mt-4" data-testid="cc-08-deterministic-boundary">
        <DeterministicBoundary mode="AIMODE-14" />
      </div>
      <div className="mt-6" data-testid="cc-08-pause-spellings">
        <p className="font-medium">
          The source spells this banner more than once, and not identically
        </p>
        <p className={NOTE}>
          Every spelling below was opened by hand and the spans they sit in were swept, so a
          spelling missing from this list reds the covering suite rather than going unnoticed. One
          per scope sits under a table header (L90507) calling its own column an exact
          user-visible message; the others do not, and none is corrected here. Distinct texts:{' '}
          {distinctPauseBannerTexts().length} across {CC08_PAUSE_BANNER_STATEMENTS.length}{' '}
          statements — every one different, and two of them differing only by a full stop.
        </p>
        <ul className="mt-2 space-y-2">
          {CC08_PAUSE_BANNER_STATEMENTS.map((s) => (
            <li key={s.line} data-testid={`cc-08-pause-spelling-${s.line}`}>
              <p className={NOTE}>
                &ldquo;{s.text}&rdquo;
                {s.labelledExactBySource ? ' — labelled an exact user-visible message' : ''}
              </p>
              <p className={REF}>
                L{s.line} · {s.where} · scope{' '}
                {s.scope ?? 'not stated by this line, which is the distinction AC-42-303 protects'}
              </p>
            </li>
          ))}
        </ul>
        <p data-testid="cc-08-scopeless-spelling" className={REF}>
          {scopelessPauseBannerStatements().length === 0
            ? 'Every spelling names its scope.'
            : `Spellings naming no scope: ${scopelessPauseBannerStatements()
                .map((s) => `L${s.line}`)
                .join(', ')}. A reader cannot tell a paused workspace from a paused platform off that wording, and this build does not add a scope the line does not carry.`}
        </p>
      </div>

      {/* ─────────────── PER-AGENT LIVE STATUS, AC-CC-300 ──────────────── */}
      <h2 className={H2}>Per-agent live status</h2>
      <p className={NOTE}>
        The storyboard&rsquo;s own status block, three agents and five status fields each. It is
        an illustration of the panel at 12:20, not a value this build computed.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-08-status" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Agent</th>
              {STATUS_FIELDS.map((f) => (
                <th key={f} scope="col">
                  {f}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {STORYBOARD_STATUS.map((row) => (
              <tr key={row.agent} data-testid={`cc-08-status-${row.agent}`}>
                <th scope="row" className="font-normal">
                  {row.agent}
                </th>
                <td>{row.state}</td>
                <td>{row.activations}</td>
                <td>{row.lastActivation}</td>
                <td>{row.outputs}</td>
                <td>{row.waiting}</td>
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        role="note"
        data-testid="cc-08-composed-agent-gap"
        data-simulated={String(CC08_COMPOSED_AGENT_GAP.simulated)}
        className="mt-4 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          {CC08_COMPOSED_AGENT_GAP.criterion} is demonstrated for the standard agents only
        </p>
        <p className={NOTE}>{CC08_COMPOSED_AGENT_GAP.why}</p>
        <p className={REF}>
          {CC08_COMPOSED_AGENT_GAP.criterion} at L{CC08_COMPOSED_AGENT_GAP.criterionLine} ·{' '}
          {CC08_COMPOSED_AGENT_GAP.namedTest} at L{CC08_COMPOSED_AGENT_GAP.namedTestLine} ·
          storyboard rows {CC08_COMPOSED_AGENT_GAP.storyboardAgentRows}, composed agents{' '}
          {CC08_COMPOSED_AGENT_GAP.storyboardComposedAgents}
        </p>
      </div>

      {/* ─────────────────────────── THE MATRIX ─────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Nine rows, five persona columns, forty-five cells. Transcribed header-keyed from L37664;
        the column order is Tenant Admin first and Worker last, the inversion of every Frontline
        matrix. Three rows carry a qualified prohibition in the Tenant Admin column and they do
        not mean the same thing — rows {CC08_LINK_OUT_ROWS[0].ordinal} and{' '}
        {CC08_LINK_OUT_ROWS[1].ordinal} name a destination and render as links, row{' '}
        {CC08_ABSENCE_IS_CORRECT_ROW} names a boundary and renders as an absence.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-08-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC08_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC08_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-08-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC08_COLUMNS.map((c: Cc08Column) => (
                  <td key={c} data-testid={`cc-08-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── ROWS 6 AND 7 — A LINK INSTEAD OF AN EMPTY CELL ─────────────── */}
      <h2 className={H2}>Switching and reconfiguring an agent — held on another surface</h2>
      <p className={NOTE}>
        Both cells read <code>Explicitly prohibited</code> and both name where the act lives.
        Rendered faithfully through the build&rsquo;s one rule they would draw a note and no
        link, which is the one thing <code>AC-CC-301</code> forbids: &ldquo;each such control is a
        link to the Standards and Operations Studio or the platform side&rdquo;. Neither link is
        spelled here; both cells are registered in the surface&rsquo;s link-out record and the
        pointer is checked against the route registry rather than asserted.
      </p>
      <div className="mt-4 space-y-4">
        {CC08_LINK_OUT_ROWS.map((r) => (
          <CrossSurfaceLink
            key={r.linkOutId}
            model={ccLinkOutModel(linkOutCell(r.linkOutId), viewerRole)}
          />
        ))}
      </div>
      <p className={REF}>
        The second of the two names two owners — &ldquo;Studio&rdquo; and &ldquo;platform
        action&rdquo; — and chooses neither, so no link is drawn to either and both are named.
        Choosing one would be this build deciding on the source&rsquo;s behalf.
      </p>

      {/* ── ROW 8 — THE PROHIBITION WHERE AN ABSENCE IS CORRECT ────────── */}
      <h2 className={H2}>{traceRow.capability} — the same token, and no link</h2>
      <p className={NOTE}>
        {traceRow.sourceRef} carries <code>{traceRow.cells['Tenant Admin'].text}</code>: the same
        token as the two rows above and a note that names no place to send anybody.{' '}
        <code>AC-CC-303</code> (L37804) reads &ldquo;No Command Center endpoint returns
        orchestrator reasoning internals&rdquo;, so the absence <code>WriteControl</code> draws is
        what the source asks for here, and a link would be the opposite defect. The difference
        between this row and the two above is the note, never the token.
      </p>
      <div className="mt-4" data-testid="cc-08-trace-boundary">
        <WriteControl
          label={traceRow.capability}
          decision={deny(
            'explicitlyProhibited',
            'EXPLICIT_DENY',
            'No Command Center role reaches orchestrator reasoning internals.',
            { stage: 'BASE_ROLE', sourceRefs: ['MOD-CC-08 L37673', 'AC-CC-303 L37804'] },
          )}
          roleName="every Command Center role"
          gateReason={null}
          objectReason={null}
          refusalNote="Raw reasoning traces are platform-internal and no Command Center endpoint returns them. FUNC-CC-0804-1-1 (L37795) gives its roles prohibited as every role. Nothing is drawn here, and nothing links away either."
          neverQueuedNote={NEVER_QUEUED}
          onAct={NO_ACT}
        />
      </div>

      {/* ── ROW 9 — THE ABSENT-VERSUS-DISABLED CONFLICT, BOTH RENDERED ── */}
      <h2 className={H2}>{recheck.capability} — the Tenant Admin&rsquo;s cell, drawn both ways</h2>
      <p className={NOTE}>
        This module&rsquo;s own matrix ({recheck.sourceRef}), the surface matrix (L35014) and{' '}
        <code>MOD-CC-13</code>&rsquo;s (L38690) all read{' '}
        <code>{recheck.cells['Tenant Admin'].text}</code>; §25.4 (L48452) reads{' '}
        <code>Unavailable</code>. Four statements, two readings. They render oppositely, and both
        renderings are below so the difference is visible rather than described. Neither is
        chosen.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div data-testid="cc-08-recheck-prohibited">
          <p className={REF}>Reading A — Explicitly prohibited (L37674, L35014, L38690)</p>
          <WriteControl
            label={recheck.capability}
            decision={deny(
              'explicitlyProhibited',
              'EXPLICIT_DENY',
              'The Tenant Admin is explicitly prohibited from requesting an agent re-check.',
              {
                stage: 'BASE_ROLE',
                sourceRefs: ['MOD-CC-08 L37674', 'SURF-CC L35014', 'MOD-CC-13 L38690'],
              },
            )}
            roleName="Tenant Admin"
            gateReason={null}
            objectReason={null}
            refusalNote="Requesting a re-check is the Supervisor's and the Quality Manager's; the Tenant Admin is not an in-shift actor. Nothing is drawn here."
            neverQueuedNote={NEVER_QUEUED}
            onAct={NO_ACT}
          />
        </div>
        <div data-testid="cc-08-recheck-unavailable">
          <p className={REF}>Reading B — Unavailable (L48452)</p>
          <WriteControl
            label={recheck.capability}
            decision={deny(
              'unavailable',
              'ROLE_NOT_GRANTED',
              'Requesting an agent re-check does not confer on the Tenant Admin here.',
              {
                stage: 'BASE_ROLE',
                sourceRefs: ['§25.4 L48452'],
                conditionToEnable:
                  'A Supervisor or Quality Manager grant carries it; the re-check is action 9 of the closed set and runs through the owning Delivery Operations Hub service.',
              },
            )}
            roleName="Tenant Admin"
            gateReason={null}
            objectReason={null}
            refusalNote="Unused on this reading: an `unavailable` outcome never reaches the absent branch."
            neverQueuedNote={NEVER_QUEUED}
            onAct={NO_ACT}
          />
        </div>
      </div>

      {/* ───────────── THE DIVERGENCES, BOTH READINGS, NO WINNER ───────── */}
      <h2 className={H2}>Where another table answers one of these rows differently</h2>
      <p className={NOTE}>
        No decision identifier covers any of these. <code>AC-CC-502</code> requires every cell to
        carry an explicit status and every cell does; that three tables give different statuses to
        the same act is tested by no acceptance criterion at all.
      </p>
      <ul className="mt-4 space-y-6">
        {CC08_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-08-divergence-${d.id}`}>
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
      <p data-testid="cc-08-rollup-row" className={REF}>
        Row {rollUp.ordinal} ({rollUp.sourceRef}) is the one cell of forty-five that grants the
        Tenant Admin anything: {rollUp.cells['Tenant Admin'].text}.
      </p>

      {/* ── THE ROLL-UP LEAK — THE FLAGS REFUSED, THEIR AGGREGATE GRANTED ─ */}
      <h2 className={H2}>
        The {leak.column} is barred from the flags and granted their aggregate
      </h2>
      <p data-testid="cc-08-rollup-leak" data-tokens-differ={String(leak.tokensDiffer)} className={NOTE}>
        Two adjacent rows of one matrix, one column, opposite answers about one class of fact.{' '}
        {leak.flags.row.sourceRef} &ldquo;{leak.flags.row.capability}&rdquo; reads{' '}
        <code>{leak.flags.cellText}</code>; {leak.rollUp.row.sourceRef} &ldquo;
        {leak.rollUp.row.capability}&rdquo; reads <code>{leak.rollUp.cellText}</code>. Both cells
        are read from the transcription through the header&rsquo;s own column word, never by
        position — this matrix runs {leak.column} first where chapter 44 runs Worker first, and an
        index carried between the two inverts both roles silently.
      </p>
      <p className={NOTE}>{leak.disclosure}</p>

      {/* ── THE TWO CROSS-CHAPTER CONTRADICTIONS, CONSUMED NOT RESTATED ── */}
      <h2 className={H2}>Where another chapter answers this module differently</h2>
      <p className={NOTE}>
        Both records live in the build&rsquo;s surface-neutral agent contracts and are cited here
        by identifier rather than transcribed a second time, so a correction lands in one place.
        Neither is adopted, and neither may be: the field a reading could be marked the answer in
        does not exist.
      </p>
      <ul className="mt-4 space-y-6">
        {[degradationRow, switchRow].map((record) => (
          <li key={record.id} data-testid={`cc-08-contradiction-${record.id}`}>
            <p className="font-medium">{record.question}</p>
            <ul className="mt-2 space-y-1">
              {record.readings.map((reading) => (
                <li key={reading.sourceRef} className={NOTE}>
                  <code>{reading.reading}</code> — {reading.where}{' '}
                  <span className="text-[var(--color-ink-subtle)]">
                    [{reading.sourceRef}
                    {reading.cell === null
                      ? ', prose rather than a matrix cell'
                      : `, ${reading.cell.column} column of the header at ${reading.cell.headerRef}`}
                    ]
                  </span>
                </li>
              ))}
            </ul>
            <p className={NOTE}>{record.disclosure}</p>
            <p className={REF}>Adopted: {record.adopted === null ? 'nothing' : 'a reading'}.</p>
          </li>
        ))}
      </ul>

      {/* ── WHAT THE PANEL CLAIMS IT DOES WITH NO AGENTS AT ALL ────────── */}
      <h2 className={H2}>With no agents at all</h2>
      <p className={NOTE}>
        The module&rsquo;s own claims, quoted rather than summarised, because{' '}
        <code>AC-CC-304</code> (L37805) is about the words: an immediate plain-language flag
        naming what was not produced.
      </p>
      <ul className="mt-4 space-y-3">
        {CC08_NO_AI_CLAIMS.map((claim) => (
          <li key={claim.id} data-testid={`cc-08-no-ai-${claim.id}`}>
            <p className={NOTE}>&ldquo;{claim.claim}&rdquo;</p>
            <p className={REF}>L{claim.line}</p>
          </li>
        ))}
      </ul>

      {/* ── SEAMS, EACH NAMING ITS OWNER ───────────────────────────────── */}
      <h2 className={H2}>Left open by this overlay, and who closes each</h2>
      <ul className="mt-4 space-y-3">
        {CC08_DEGRADATION_SEAMS.map((seam) => (
          <li key={seam.id} data-testid={`cc-08-degradation-seam-${seam.id}`}>
            <p className={NOTE}>{seam.what}</p>
            <p className={REF}>Owner: {seam.owner}</p>
          </li>
        ))}
      </ul>

      {/* ─────────── FRESHNESS — TWO ELEMENTS, TWO CLASSES ─────────────── */}
      <h2 className={H2}>Freshness classes for this panel&rsquo;s elements</h2>
      {[agentOutput, coaching].map((a) => (
        <p key={a.element} data-testid={`cc-08-freshness-${a.element}`} className={NOTE}>
          <span className="font-medium">{a.element}: </span>
          {a.classCell} · {a.markerObligation} · {a.perDevice ? 'per device' : 'per scope'} ·
          shared with {a.modules.filter((m) => m !== CC08_MODULE.id).join(', ')} · {a.sourceRef}
        </p>
      ))}
      <p className={REF}>
        Both assignments are read from §21.3&rsquo;s class table, not restated here, so a change
        to that table changes this panel. One is pushed and one is refreshed, and this module is
        the only one on the surface that renders both.
      </p>

      {/* ─────────── AC-CC-090, WHICH THIS MODULE FAILS ────────────────── */}
      <h2 className={H2}>Fallback coverage — and the two functionalities that name no pattern</h2>
      <p
        data-testid="cc-08-ac-090"
        data-silent-count={String(silentFunctionalities.length)}
        className={NOTE}
      >
        <code>AC-CC-090</code> (L35710) requires every functionality in the chapter to reference
        at least one <code>FB-CC-*</code> pattern. This module declares{' '}
        {CC08_FUNCTIONALITIES.length} functionalities and {silentFunctionalities.length} of them
        name none: {silentFunctionalities.join(', ')}. Their own clauses read{' '}
        {CC08_FUNCTIONALITIES.filter((f) => f.patterns.length === 0)
          .map((f) => `"${f.fallbackClause}"`)
          .join(' and ')}
        . Both are honest sentences and neither satisfies the criterion as written. Nothing here
        invents a pattern for either.
      </p>
      <p className={REF}>
        The module declares {CC08_DECLARED_FALLBACKS.length} fallback identifiers at L37772 —{' '}
        {CC08_DECLARED_FALLBACKS.join(', ')} — and <code>FB-CC-WRITE</code> is referenced by no
        functionality in the list; L37772 attaches it to a failed re-check request, which is row{' '}
        {recheck.ordinal}&rsquo;s act. The declared set and the referenced set differ in both
        directions and each was counted separately.
      </p>
      <p data-testid="cc-08-agent-fallback" className={NOTE}>
        <code>{agentFb.id}</code> — {agentFb.triggeringCondition}. Decision controls:{' '}
        {agentFb.decisionControls}. Client-side queueing: {agentFb.clientSideQueueing}. Terminal
        safe state: {agentFb.terminalSafeState}. With agents unavailable the panel is at its most
        important: it states each agent&rsquo;s unavailable state in plain terms, names what was
        not produced, and confirms platform operations has been notified (L37753).
      </p>

      {/* ───────────────── SESSION OFFLINE — FB-CC-SESS ────────────────── */}
      <h2 className={H2}>This session offline</h2>
      <p data-testid="cc-08-session-offline" className={NOTE}>
        <code>{sess.id}</code> — {sess.triggeringCondition}. Decision controls:{' '}
        {sess.decisionControls}. Client-side queueing: {sess.clientSideQueueing}. Terminal safe
        state: {sess.terminalSafeState}. L37747 states it for this panel in one sentence: the
        panel freezes, the re-check control is disabled, nothing is queued.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div data-testid="cc-08-recheck-live">
          <p className={REF}>Supervisor, session live (L37674)</p>
          <WriteControl
            label={recheck.capability}
            decision={allow('BASE_ROLE', ['MOD-CC-08 L37674'])}
            roleName="Supervisor"
            gateReason={null}
            objectReason={null}
            refusalNote="Unused on this rendering: the Supervisor is allowed."
            neverQueuedNote={NEVER_QUEUED}
            onAct={NO_ACT}
          />
        </div>
        <div data-testid="cc-08-recheck-frozen">
          <p className={REF}>Supervisor, session frozen (L37747)</p>
          <WriteControl
            label={recheck.capability}
            decision={allow('BASE_ROLE', ['MOD-CC-08 L37674'])}
            roleName="Supervisor"
            gateReason={CC_FROZEN_CONTROL_REASON}
            objectReason={null}
            refusalNote="Unused on this rendering: the Supervisor is allowed and the session is what closes the control."
            neverQueuedNote={NEVER_QUEUED}
            onAct={NO_ACT}
          />
        </div>
      </div>
      <p className={REF}>
        A frozen session reaches the control through the gate branch rather than a sixth one: it
        is a condition outside the person and outside the record that closes the control, which is
        what that branch already is. The grant is unchanged in both renderings and only the reason
        differs.
      </p>

      {/* ────── THE OPERATIONAL ACTIONS, AND WHY NO RAIL IS MOUNTED ────── */}
      <h2 className={H2}>Operational actions, and the rail this screen does not mount</h2>
      <p
        data-testid="cc-08-action-rail-abstention"
        data-rail-mounted={String(CC08_ACTION_NINE_DISAGREEMENT.railMounted)}
        className={NOTE}
      >
        The source disagrees with itself about whether this screen exercises one of the ten. This
        module&rsquo;s own interconnections paragraph (L
        {CC08_ACTION_NINE_DISAGREEMENT.ownClaimLine}) says it &ldquo;
        {CC08_ACTION_NINE_DISAGREEMENT.ownClaimText}&rdquo;, and{' '}
        <code>MOD-CC-13</code>&rsquo;s enumeration (L
        {CC08_ACTION_NINE_DISAGREEMENT.enumerationLine}) names seven modules, gives action{' '}
        {CC08_ACTION_NINE_DISAGREEMENT.action} to{' '}
        <code>{CC08_ACTION_NINE_DISAGREEMENT.enumerationGivesActionNineTo}</code>, and does not
        name this one. Both readings are recorded and neither is adopted.{' '}
        {CC08_ACTION_NINE_DISAGREEMENT.whyNotMounted}
      </p>
    </section>
  )
}

/**
 * `WriteControl` requires `onAct`. Every control above is a refusal or a
 * frozen session, and no branch reaches it, so nothing is wired to a handler
 * — a no-op is the honest value and a real one would be a second claim that
 * an act is performed here.
 */
function NO_ACT(): void {
  /* Every rendering above is a refusal or a frozen session; never reached. */
}
