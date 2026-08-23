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

import { allow } from '@/policy/decision'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import { WriteControl } from '@/ui/WriteControl'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC05_COLUMNS,
  CC05_MATRIX,
  CC05_MODULE,
  CC05_POLICY_AUTHORED_ELSEWHERE,
  CC05_ROWS_NOBODY_HOLDS,
  CC05_SCREEN,
  cc05Row,
  type Cc05Column,
} from './matrix'
import {
  CC05_AC_CC_090,
  CC05_DECISION_CONTROLS,
  CC05_FALLBACKS_NO_FUNCTIONALITY_NAMES,
  CC05_FUNCTIONALITIES,
  CC05_FUNCTIONALITIES_NAMING_NO_PATTERN,
  CC05_MODULE_FALLBACK_REF,
  CC05_NOT_DECIDABLE_ITEM,
  CC05_ORIGIN_TIME_UNSTATED,
  CC05_QUEUE_PATTERN,
  CC05_SCOPE_DIVERGENCE,
  CC05_STORYBOARD_ITEM,
  CC05_STORYBOARD_LINES,
  CC05_STORYBOARD_REF,
  CC05_TIMEOUT_MINUTES,
  CC05_UNACTIONED_RULES,
  cc05Decidability,
  cc05MissingElementFor,
  cc05ScopeText,
  cc05TimeoutMinutes,
  cc05WaitingText,
  type Cc05GateItem,
} from './queue'
import {
  CC05_AI07,
  CC05_AI07_ATTRIBUTES,
  CC05_GATE_DECISION_NOTE,
  CC05_GATE_DECISION_ROW,
  CC05_PERSISTENCE_PROVENANCE,
  CC05_PROPOSING_AGENT,
  CC05_STATE_PROVENANCE,
  cc05DegradationFold,
  cc05EmptyQueueReading,
} from './degradation'
import {
  CC05_DIVERGENCES,
  CC05_FOREIGN_FALLBACK_NAMES,
  CC05_INVENTORY_ROW,
  CC05_TENANT_ADMIN_DECISION,
} from './readings'

/**
 * `MOD-CC-05` — THE GOVERNANCE GATE QUEUE, RENDERED.
 *
 * THIS BLOCK USED TO OPEN "A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use
 * client'`", WHICH LINE 1 OF THIS FILE CONTRADICTS. The panel is a client
 * component, for the reason the block above line 1 gives at length, and the
 * two paragraphs disagreed in one file. The rule the sentence was reaching for
 * is real and it is about the DATA modules, not about this one: `./matrix.ts`,
 * `./queue.ts`, `./readings.ts`, `./degradation.ts` and the wave-0 modules
 * behind them export plain data objects and must not acquire `'use client'`
 * themselves. A directive on any of those replaces their exports with client
 * references, and their strings are gone by the time a route prerenders — the
 * defect that put an undefined module id into four built pages in slice 7
 * while every component test stayed green.
 *
 * ── THE ONE THING THIS SCREEN EXISTS TO GET RIGHT ────────────────────────
 *
 * `SCR-CC-06` is where a Quality Manager lands. L48391's register row says so
 * in its own words — "Landing for the Quality Manager" — so this is the first
 * screen the person who decides these items sees, and it must be honest about
 * what it cannot decide before it is useful.
 *
 * `FB-CC-QUEUE` is threefold and the third part is the one that gets lost.
 * L37115: the item "renders not decidable, names the missing element, disables
 * its decision controls, and **keeps its waiting clock running**." A clock
 * that stops because an item cannot be decided is a different and wrong thing
 * — it is a silent expiry with the record still on screen, and L37228's
 * `AC-CC-247` requires undecided items to age visibly.
 *
 * SO THE TWO CARDS BELOW GO THROUGH ONE `GateCard`, AND THAT IS THE POINT.
 * There is no second rendering path for a not-decidable item — the same
 * component draws both, `cc05WaitingText` is given a number of seconds and
 * nothing else, and the two illustrative items carry the SAME
 * `waitingSeconds`. A screen with two rendering paths can drift; this one
 * cannot, and the component suite still asserts the two clocks read
 * identically, because a structural guarantee nobody checked is a claim.
 *
 * ── WHAT IT CONSUMES RATHER THAN REBUILDS ────────────────────────────────
 *
 *  - `WriteControl`'s FIFTH branch — task 3's `missingElement`, consumed and
 *    not forked. The disabled reason it composes is the one place the clause
 *    "the waiting time keeps running and this item never expires on its own"
 *    is written, and this module reads it rather than spelling a second copy.
 *  - `ccFallbackPatternById` for `FB-CC-QUEUE` and `FB-CC-SESS`, so the
 *    triggering condition, the decision-control cell and the terminal safe
 *    state are the registry's verbatim cells rather than a paraphrase.
 *  - `ccFunctionalitiesNamingNoPattern` for `AC-CC-090`'s answer, computed in
 *    `./queue.ts` from the source's own twelve-row list.
 *  - `ccElementAssignment('Gate item arrival')` for the marker obligation.
 *    §21.3's assignment table gives this module `Pushed` with the obligation
 *    `Waiting time from arrival` (L35886) — a PUSHED row, not a refreshed one
 *    — and that assignment is read, never restated.
 *  - NOTHING for the ten operational actions. `MOD-CC-13`'s rail is mounted
 *    on this route by `app/command-center/governance-gate-queue/` and draws
 *    all ten; L38793 gives this module action 2 alone.
 *
 * ── ILLUSTRATIVE VALUES ARE LABELLED AS SUCH, WITH THEIR LINE ────────────
 *
 * Both cards are `SB-CC-16` (L37143), and the second is the first with its
 * scope of impact removed. The trigger origin time is `null` on both, because
 * L37159 requires it and the source supplies none for this card; the card says
 * so rather than substituting the creation time.
 */

const H2 = 'mt-10 text-xl font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

/**
 * `WriteControl` requires `onAct`. This is a storyboard and no Delivery
 * Operations Hub gate service exists in this build, so a no-op is the honest
 * value: a real handler would be a second claim that the decision commits from
 * here. L37049 puts the record on the Hub — "Records the outcome: every
 * decision … written to the immutable audit trail".
 */
function NO_ACT(): void {
  /* No gate decision service exists in this storyboard. */
}

/**
 * The D7 clause, built from `FB-CC-QUEUE`'s own transcribed cell rather than
 * written out here. `AC-CC-091` (L35711) is the surface rule it serves.
 */
const NEVER_QUEUED = `nothing is written on this path under ${CC05_QUEUE_PATTERN.id} (${CC05_QUEUE_PATTERN.clientSideQueueing})`

/**
 * ONE CARD COMPONENT FOR BOTH ITEMS.
 *
 * `AC-CC-240` (L37221) requires the scope of impact to be the card's LEADING
 * element, so the scope block is the first child and stays first whether or
 * not the scope resolved — L37056 is explicit that an uncomputable scope makes
 * the item not decidable "rather than decidable with the scope omitted", so
 * the slot is filled with the absence rather than dropped.
 */
function GateCard({ item }: { readonly item: Cc05GateItem }) {
  const decidability = cc05Decidability(item)
  const missingElement = cc05MissingElementFor(item)
  const timeout = cc05TimeoutMinutes(item.severityOne)

  return (
    <article
      data-testid={`cc-05-card-${item.id}`}
      data-decidable={String(decidability.decidable)}
      className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
    >
      {/* LEADING ELEMENT — AC-CC-240. First child, always. */}
      <p
        data-testid={`cc-05-scope-${item.id}`}
        data-scope-resolved={String(item.scopeOfImpact !== null)}
        className="text-lg font-semibold"
      >
        {item.scopeOfImpact === null
          ? 'Scope of impact: could not be computed'
          : cc05ScopeText(item.scopeOfImpact)}
      </p>

      <p data-testid={`cc-05-waiting-${item.id}`} className={NOTE}>
        Proposed by {item.proposingAgent} · created {item.createdAt} · waiting{' '}
        {cc05WaitingText(item.waitingSeconds)} · timeout {timeout} minutes, then re-routes to the
        next person per the Studio-authored policy.
      </p>

      <p data-testid={`cc-05-origin-${item.id}`} className={REF}>
        {item.triggerOriginTime === null
          ? CC05_ORIGIN_TIME_UNSTATED
          : `Trigger origin time: ${item.triggerOriginTime}`}
      </p>

      <p className={NOTE}>{item.intervention}</p>
      <p className={NOTE}>Reason in plain language: {item.triggerContext}</p>

      <p data-testid={`cc-05-evidence-${item.id}`} className={NOTE}>
        Evidence:{' '}
        {item.evidence === null ? 'could not be resolved' : item.evidence.join(', ')}.
      </p>

      {decidability.decidable ? null : (
        <p data-testid={`cc-05-not-decidable-${item.id}`} className={NOTE}>
          <span className="font-medium">Not decidable. </span>
          {decidability.missingElement} could not be resolved. The waiting clock above is still
          running and this item never expires on its own; it re-routes on timeout to a person who
          may be able to resolve the context. It is never made decidable by defaulting the missing
          element.
        </p>
      )}

      <div data-testid={`cc-05-controls-${item.id}`} className="mt-4 flex flex-wrap gap-3">
        {CC05_DECISION_CONTROLS.map((label, index) => (
          <div key={label} data-testid={`cc-05-control-${item.id}-${index + 1}`}>
            <WriteControl
              label={label}
              decision={allow('BASE_ROLE', [
                `MOD-CC-05 ${cc05Row(index + 3).sourceRef}`,
                'MOD-CC-13 L38683',
              ])}
              roleName="Quality Manager"
              gateReason={null}
              objectReason={null}
              refusalNote="Unused on this rendering: the Quality Manager's cells on rows 3, 4 and 5 are `Allowed`, so the absent branch is never reached."
              neverQueuedNote={NEVER_QUEUED}
              missingElement={missingElement}
              onAct={NO_ACT}
            />
          </div>
        ))}
      </div>
      <p className={REF}>
        Three controls of equal visual weight plus an optional note field, {CC05_STORYBOARD_REF}{' '}
        {CC05_STORYBOARD_LINES.decisionRow}. Every decision is two interactions — the decision, plus
        an optional note.
      </p>
    </article>
  )
}

/**
 * WHAT THE QUEUE IS WHEN THE AGENT THAT FILLS IT IS DEGRADED, PAUSED OR GONE.
 *
 * Every value here comes from `./degradation.ts`, which consumes `AI-07`'s own
 * attribute row rather than restating it. Three things are drawn and each
 * answers a question the rest of this panel does not:
 *
 *  1. `AI-07`'s human approval, validation gate, expiry and safe stop, whole.
 *     The expiry is the one that decides the empty state below.
 *  2. The pending item under all sixteen operating modes. The guarantee cell
 *     is COMPOSED FROM the standing's own fields rather than written out, so a
 *     field that ever changed would change the sentence on screen — a screen
 *     printing "never expired" from a string constant would keep printing it.
 *  3. What an empty queue means, which is two different things and depends on
 *     whether the mode lets the agent raise anything.
 *
 * ONE PROVENANCE CLASS, AND THE ELEMENT DECLARES ITSELF SO THE LINT CAN SEE
 * IT. Everything below is the source's own tables compared against a mode, so
 * the class is the deterministic one; `data-guidance-element` puts this region
 * into `provenanceViolations`' population, without which a component suite
 * asserting "no violations" passes on a panel carrying no marks at all.
 */
function CellText({ flag, whenTrue, whenFalse }: {
  readonly flag: boolean
  readonly whenTrue: string
  readonly whenFalse: string
}) {
  return <>{flag ? whenTrue : whenFalse}</>
}

function DegradationOverlay() {
  const fold = cc05DegradationFold(CC05_STORYBOARD_ITEM)

  return (
    <section
      data-testid="cc-05-degradation"
      data-guidance-element={`${CC05_MODULE.id} under artificial-intelligence degradation`}
    >
      <h2 className={H2}>Under artificial-intelligence degradation</h2>

      <ProvenanceMark
        classId={CC05_PERSISTENCE_PROVENANCE}
        statement={
          'Everything in this section is the source’s own tables compared against an ' +
          'operating mode. No model is in the path, so none of it is live artificial ' +
          'intelligence and none of it may be labelled as such.'
        }
      />

      {/* ───────────── AI-07'S OWN ROW, CONSUMED ───────────── */}
      <p className={NOTE}>
        The proposals in this queue are {CC05_AI07.id} &mdash; {CC05_AI07.title} &mdash; raised by{' '}
        {CC05_PROPOSING_AGENT.name}, whose roster row binds it to{' '}
        <code>{CC05_PROPOSING_AGENT.governanceBinding}</code> ({CC05_PROPOSING_AGENT.sourceRef}).
        The ability register&rsquo;s own attributes are below, whole and unedited; this module
        holds no second copy of them.
      </p>
      <dl data-testid="cc-05-ai07" className="mt-2 space-y-2">
        {CC05_AI07_ATTRIBUTES.map((attribute) => (
          <div key={attribute.attribute} data-testid={`cc-05-ai07-${attribute.attribute}`}>
            <dt className="text-sm font-medium">{attribute.label}</dt>
            <dd className={NOTE}>{attribute.value}</dd>
          </div>
        ))}
      </dl>
      <p className={REF}>
        {CC05_AI07.id} &middot; {CC05_AI07.sourceRef}. The gate never executes on its own, and no
        failure state changes that.
      </p>

      {/* ───────────── THE SIXTEEN MODES ───────────── */}
      <table data-testid="cc-05-degradation-table" className="mt-4 w-full text-left text-sm">
        <caption className={`${NOTE} caption-bottom`}>
          The same raised item under every operating mode the platform declares. The agent
          invocation column is the only one that varies; the item&rsquo;s standing is the same
          sentence on every row, and that repetition is the statement.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="pr-3">Mode</th>
            <th scope="col" className="pr-3">Agent invocation</th>
            <th scope="col" className="pr-3">A raised item</th>
            <th scope="col">An empty queue</th>
          </tr>
        </thead>
        <tbody>
          {fold.map((standing) => (
            <tr
              key={standing.mode}
              data-testid={`cc-05-persistence-row-${standing.mode}`}
              className="align-top"
            >
              <th scope="row" className="pr-3 font-normal">
                {standing.mode} &middot; {standing.modeName}
              </th>
              <td data-testid={`cc-05-invocation-${standing.mode}`} className="pr-3">
                {standing.agentInvocation}
              </td>
              <td data-testid={`cc-05-standing-${standing.mode}`} className="pr-3">
                <CellText
                  flag={standing.stillInQueue}
                  whenTrue="Stays in the queue"
                  whenFalse="Leaves the queue"
                />
                {'; '}
                <CellText
                  flag={standing.selfApproved}
                  whenTrue="self-approved"
                  whenFalse="never self-approved"
                />
                {', '}
                <CellText
                  flag={standing.selfDeclined}
                  whenTrue="self-declined"
                  whenFalse="never self-declined"
                />
                {', '}
                <CellText flag={standing.expired} whenTrue="expired" whenFalse="never expired" />
                {'. The decision stays human: '}
                {standing.humanApproval}
              </td>
              <td data-testid={`cc-05-empty-${standing.mode}`}>
                {cc05EmptyQueueReading(standing.mode).statement}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ───────────── DEC-GATE-001, BY REFERENCE ───────────── */}
      <div data-testid="cc-05-gate-decision" className="mt-4">
        <p className={NOTE}>
          <code>{CC05_GATE_DECISION_ROW.id}</code> &mdash; {CC05_GATE_DECISION_ROW.status}.
          Decision owner: {CC05_GATE_DECISION_ROW.owner}. Where it appears:{' '}
          {CC05_GATE_DECISION_ROW.whereItAppears}.
        </p>
        <p className={REF}>{CC05_GATE_DECISION_NOTE}</p>
      </div>

      {/* ───────────── THE SEAM, NAMED WITH ITS OWNER ───────────── */}
      <p data-testid="cc-05-live-mode-seam" className={REF}>
        This storyboard holds no live operating mode, so no single degraded state is claimed here
        and the table above speaks about all sixteen instead. A connected build&rsquo;s mode
        source is the seam: whoever supplies the current mode to this surface also owes the
        one-line state this panel would then draw, and that line carries{' '}
        <code>{CC05_STATE_PROVENANCE}</code>, the class the agent degradation contract already
        resolved for a degraded state &mdash; not the deterministic class the table above carries.
        Drawing that line now, with nothing to derive it from, would assert a platform state this
        build cannot observe.
      </p>
    </section>
  )
}

export function GovernanceGateQueue() {
  const arrival = ccElementAssignment('Gate item arrival')
  const queue = CC05_QUEUE_PATTERN
  const sess = ccFallbackPatternById('FB-CC-SESS')
  const policyRow = cc05Row(CC05_POLICY_AUTHORED_ELSEWHERE.row)

  return (
    <section data-testid="cc-05-queue" data-module={CC05_MODULE.id}>
      <p data-testid="cc-05-identity" className={REF}>
        {CC05_MODULE.id} · {CC05_MODULE.name} · identity {CC05_MODULE.sourceRef} ·{' '}
        {CC05_MODULE.specSection} · rendered on {CC05_SCREEN.id}, register row{' '}
        {CC05_SCREEN.registerRef} · {CC05_SCREEN.navigationEntry}
      </p>

      {/* ─────────────────── THE TWO CARDS, ONE RENDERING PATH ──────────── */}
      <h2 className={H2}>The queue</h2>
      <p className={NOTE}>
        Both cards are {CC05_STORYBOARD_REF} ({CC05_STORYBOARD_LINES.card}), and the second is the
        first with its scope of impact removed. Every other field is identical,{' '}
        <span className="font-medium">including the waiting time</span>, so the difference on
        screen is exactly the difference <code>{queue.id}</code> describes and nothing else.
      </p>
      <GateCard item={CC05_STORYBOARD_ITEM} />
      <GateCard item={CC05_NOT_DECIDABLE_ITEM} />

      <div
        role="note"
        data-testid="cc-05-queue-pattern"
        className="mt-4 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          <code>{queue.id}</code> — {queue.title}
        </p>
        <p className={NOTE}>
          Triggering condition: {queue.triggeringCondition}. Decision controls:{' '}
          {queue.decisionControls}. Client-side queueing: {queue.clientSideQueueing}. Terminal safe
          state: {queue.terminalSafeState}.
        </p>
        <p className={NOTE}>
          The obligation is threefold and the third part is the one that gets lost: the decision
          controls are disabled, the missing element is named, and the waiting clock keeps running.
          A clock that stops because an item cannot be decided is a different and wrong thing.
        </p>
        <p className={REF}>{queue.sourceRef}</p>
      </div>

      <p data-testid="cc-05-arrival-element" className={NOTE}>
        <span className="font-medium">{arrival.element}: </span>
        {arrival.classCell} · marker obligation {arrival.markerObligation} ·{' '}
        {arrival.perDevice ? 'per device' : 'per scope'} · {arrival.sourceRef}. A pushed row, not a
        refreshed one: the class and its obligation are read from §21.3&rsquo;s assignment table
        rather than restated here.
      </p>

      <p data-testid="cc-05-scope-divergence" className={REF}>
        Three statements of what the scope of impact contains name three quantities —{' '}
        {CC05_SCOPE_DIVERGENCE.proseWording} ({CC05_SCOPE_DIVERGENCE.proseRefs.join(', ')}) — and
        the storyboard card leads with a fourth, {CC05_SCOPE_DIVERGENCE.extraQuantity} (
        {CC05_SCOPE_DIVERGENCE.storyboardRef}). {CC05_SCOPE_DIVERGENCE.note}
      </p>

      {/* ─────────────────── UNACTIONED ITEMS ───────────────────────────── */}
      <h2 className={H2}>Unactioned items</h2>
      <ul data-testid="cc-05-unactioned" className="mt-2 space-y-3">
        {CC05_UNACTIONED_RULES.map((r) => (
          <li key={r.criterion} className={NOTE}>
            <span className="font-medium">
              {r.criterion} ({r.criterionRef}):{' '}
            </span>
            {r.rule} {r.why} ({r.whyRef})
          </li>
        ))}
      </ul>
      <p data-testid="cc-05-timeouts" className={NOTE}>
        Defaults: a {CC05_TIMEOUT_MINUTES.severityOne}-minute window at Severity 1,{' '}
        {CC05_TIMEOUT_MINUTES.otherwise} minutes otherwise, configurable per severity level
        (L37068). The timers run server-side, so an item never waits on a disconnected browser.
      </p>

      {/* ─────────────────── THE MATRIX ─────────────────────────────────── */}
      <h2 className={H2}>Roles that see and use it, and their permissions</h2>
      <p className={NOTE}>
        Eight rows, five persona columns, forty cells. Transcribed header-keyed from L37076; the
        column order is Tenant Admin first and Worker last, the inversion of every Frontline matrix.
        Quality Manager entries are enumerated grants under <code>DEC-PLUS-001</code> (L37087).
      </p>
      <div className="mt-4 overflow-x-auto">
        <table data-testid="cc-05-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Capability on this module</th>
              {CC05_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {CC05_MATRIX.map((row) => (
              <tr key={row.ordinal} data-testid={`cc-05-row-${row.ordinal}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC05_COLUMNS.map((c: Cc05Column) => (
                  <td key={c} data-testid={`cc-05-cell-${row.ordinal}-${c}`}>
                    {row.cells[c].text}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────── THE TWO ROWS NOBODY HOLDS, AND WHERE ONE OF THEM IS ──── */}
      <div
        role="note"
        data-testid="cc-05-nobody-holds"
        className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          Rows {CC05_ROWS_NOBODY_HOLDS.join(' and ')} are prohibited in all five columns
        </p>
        <p className={NOTE}>
          <span className="font-medium">{policyRow.capability} ({policyRow.sourceRef}): </span>
          authored in the {CC05_POLICY_AUTHORED_ELSEWHERE.destination}, whose gate responsibility
          the four-surface division states as &ldquo;{CC05_POLICY_AUTHORED_ELSEWHERE.divisionText}
          &rdquo; ({CC05_POLICY_AUTHORED_ELSEWHERE.divisionRef}).{' '}
          {CC05_POLICY_AUTHORED_ELSEWHERE.whyNoLinkHere}
        </p>
        <p className={NOTE}>
          <span className="font-medium">
            {cc05Row(8).capability} ({cc05Row(8).sourceRef}):{' '}
          </span>
          an authoring-time control that belongs to the Standards and Operations Studio&rsquo;s
          approval chain plus platform review. AC-CC-248 (L37229) — composed-agent approval never
          appears in this queue.
        </p>
        <p className={REF}>
          Both cells render as nothing at all under this build&rsquo;s one rendering rule, which is
          why their destinations are named here rather than left to the matrix alone.
        </p>
      </div>

      {/* ─────────────────── AC-CC-090, COUNTED ─────────────────────────── */}
      <h2 className={H2}>{CC05_AC_CC_090.criterion} against this module&rsquo;s own list</h2>
      <div
        role="note"
        data-testid="cc-05-ac-090"
        data-met={String(CC05_AC_CC_090.met)}
        data-total={String(CC05_FUNCTIONALITIES.length)}
        data-naming-none={String(CC05_FUNCTIONALITIES_NAMING_NO_PATTERN.length)}
        className="mt-2 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className={NOTE}>
          {CC05_AC_CC_090.criterion} ({CC05_AC_CC_090.criterionRef}) —{' '}
          {CC05_AC_CC_090.criterionText}
        </p>
        <p className={NOTE}>
          This module declares {CC05_FUNCTIONALITIES.length} functionalities and{' '}
          {CC05_FUNCTIONALITIES_NAMING_NO_PATTERN.length} of them name no{' '}
          <code>FB-CC-*</code> pattern: {CC05_FUNCTIONALITIES_NAMING_NO_PATTERN.join(', ')}.{' '}
          {CC05_AC_CC_090.finding}
        </p>
        <p className={NOTE}>
          The mirror image: {CC05_MODULE_FALLBACK_REF} declares five fallback identifiers for the
          module and {CC05_FALLBACKS_NO_FUNCTIONALITY_NAMES.length} of them —{' '}
          {CC05_FALLBACKS_NO_FUNCTIONALITY_NAMES.join(', ')} — are named by no functionality&rsquo;s
          own fallback clause.
        </p>
        <ul className="mt-2 space-y-1">
          {CC05_FUNCTIONALITIES.map((f) => (
            <li key={f.id} data-testid={`cc-05-func-${f.id}`} className={REF}>
              {f.id} ({f.sourceRef}) — Fallback: {f.fallbackClause}
            </li>
          ))}
        </ul>
      </div>

      {/* ─────────────────── THE DIVERGENCES ────────────────────────────── */}
      <h2 className={H2}>Where another table answers one of these rows differently</h2>
      <p className={NOTE}>
        Five tables in this source answer the same permission question about this module. The fifth
        — chapter 17&rsquo;s <code>MTX-TEN-02c</code> at L22062 — is keyed on the MODULE rather than
        on a capability, and it is the one no brief in this slice names.
      </p>
      <ul className="mt-4 space-y-6">
        {CC05_DIVERGENCES.map((d) => (
          <li key={d.id} data-testid={`cc-05-divergence-${d.id}`}>
            <p className="font-medium">
              Rows {d.ownRows.join(', ')} · {d.column} · {d.capability}
            </p>
            <p className={NOTE}>{d.question}</p>
            {d.readings.map((r) => (
              <p key={r.locator} className={NOTE}>
                {r.text} <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
              </p>
            ))}
            <p className={NOTE}>{d.renderedConsequence}</p>
            <p className={REF}>
              Stated at {d.statements.map((s) => `L${s.line} "${s.text}"`).join(' · ')} · decision
              identifier: {d.decisionRef ?? 'none'}
            </p>
          </li>
        ))}
      </ul>

      <div
        role="note"
        data-testid="cc-05-tacc"
        data-adopted={String(CC05_TENANT_ADMIN_DECISION.adopted !== null)}
        className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="font-medium">
          {CC05_TENANT_ADMIN_DECISION.decisionRef} ({CC05_TENANT_ADMIN_DECISION.classification}) —{' '}
          {CC05_TENANT_ADMIN_DECISION.question}
        </p>
        <p className={NOTE}>
          Interim position, stated in condition [{CC05_TENANT_ADMIN_DECISION.conditionKey}] at{' '}
          {CC05_TENANT_ADMIN_DECISION.conditionRef}:{' '}
          {CC05_TENANT_ADMIN_DECISION.interimPosition}
        </p>
        <p className={NOTE}>
          <span className="font-medium">Recommended and not adopted: </span>
          {CC05_TENANT_ADMIN_DECISION.recommendation}
        </p>
        <p className={NOTE}>{CC05_TENANT_ADMIN_DECISION.affectedHere}</p>
        <p className={REF}>
          Card {CC05_TENANT_ADMIN_DECISION.cardRef} · chapter register{' '}
          {CC05_TENANT_ADMIN_DECISION.registerRef}. Carried here as a pointer; this build spells it
          nowhere twice.
        </p>
      </div>

      <p data-testid="cc-05-inventory-row" className={REF}>
        §21.1&rsquo;s module inventory ({CC05_INVENTORY_ROW.sourceRef}) gives this module principal
        user {CC05_INVENTORY_ROW.principalUser} and secondary user{' '}
        {CC05_INVENTORY_ROW.secondaryUser}, and its &ldquo;Not a user&rdquo; column reads &ldquo;
        {CC05_INVENTORY_ROW.notAUser}&rdquo;. {CC05_INVENTORY_ROW.whatIsUnusual}
      </p>

      <p data-testid="cc-05-foreign-fallbacks" className={REF}>
        The master feature traceability table (
        {CC05_FOREIGN_FALLBACK_NAMES.sourceRefs.join(', ')}) names this module&rsquo;s fallbacks as{' '}
        {CC05_FOREIGN_FALLBACK_NAMES.names.join(' and ')}, which are in neither the nine{' '}
        <code>FB-CC-*</code> patterns nor {CC05_FOREIGN_FALLBACK_NAMES.ownDeclarationRef}, and
        classifies it &ldquo;{CC05_FOREIGN_FALLBACK_NAMES.offlineClaim}&rdquo;.{' '}
        {CC05_FOREIGN_FALLBACK_NAMES.note}
      </p>

      {/* ─────────────────── SESSION OFFLINE ────────────────────────────── */}
      <h2 className={H2}>This session offline</h2>
      <p data-testid="cc-05-session-offline" className={NOTE}>
        <code>{sess.id}</code> — {sess.triggeringCondition}. Decision controls:{' '}
        {sess.decisionControls} (&ldquo;{CC_FROZEN_CONTROL_REASON}&rdquo;). Client-side queueing:{' '}
        {sess.clientSideQueueing}. Terminal safe state: {sess.terminalSafeState}. Server-side timers
        continue and re-route on timeout, so an item never waits on a disconnected browser (L37161).
      </p>
      <p className={REF}>
        Items already raised remain fully decidable, including during an emergency pause, because
        the human authority does not depend on the agent that raised the item (L37167).
      </p>

      <DegradationOverlay />

      {/* ─────────────────── THE OPERATIONAL ACTIONS ────────────────────── */}
      <h2 className={H2}>Operational actions exercised here</h2>
      <p data-testid="cc-05-exercised-actions" className={NOTE}>
        L38793 names the seven modules whose screens exercise one or more of the ten and gives this
        one <span className="font-medium">action 2</span> alone — the gate-item decision.{' '}
        <code>MOD-CC-13</code>&rsquo;s action rail is mounted on this route and draws all ten with
        each one&rsquo;s owning place and audit obligation; a second list here would be a second
        spelling of a closed set that has one owner, so the controls are not drawn twice.
      </p>
      <p className={REF}>
        L37171 states the same interconnection independently: this module &ldquo;exercises action 2
        of MOD-CC-13&rdquo;.
      </p>
    </section>
  )
}
