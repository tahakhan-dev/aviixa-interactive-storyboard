import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { QUEUED_REQUEST_STATE_IDS, stateRecord } from '@/ai/requests/states'
import {
  QUEUED_REQUEST_TRANSITIONS,
  STATE_SET_RULES,
  transitionsFrom,
  transitionsInto,
} from '@/ai/requests/machine'

/**
 * THE SIX RULES THAT BIND THE QUEUED-REQUEST STATE SET, AND THE NINETEEN EDGES.
 *
 * ── WHY THIS EXISTS: `machine.ts` WAS REACHED FROM NOTHING ─────────────────
 * Wave 0 task 5 built `states.ts`, `surface-matrix.ts` and `machine.ts`. Wave 3
 * task 15 mounted the first two through `QueuedRequestSurfaceMatrix`, and its
 * own comment claimed all three — measured on this tree before this component
 * existed, `machine.ts` had ZERO importers anywhere under `src/` or `app/`, so
 * the twelve states rendered and the six rules that govern moving between them
 * did not. It stated no abstention either, and a stated abstention and an
 * oversight look identical from outside. This is the mount rather than a
 * paragraph, because there was nothing about the transition function that
 * warranted abstaining: the states are already on this route and the rules
 * belong beside them.
 *
 * ── WHAT THIS RENDERING MAKES VISIBLE, AND WHAT IT CANNOT ──────────────────
 * All six rules render as the source's own sentences with their own lines
 * (L89641-L89646). Three of the six are also DEMONSTRATED by what is drawn
 * rather than merely quoted:
 *
 *   RULE 5 — "every other terminal state must transition into `reconciled`" —
 *     is derived from the edges, not asserted. The section below reads the
 *     terminal flag off each state record and, for every terminal state that
 *     is not `reconciled` itself, finds its edge into `reconciled` in
 *     `QUEUED_REQUEST_TRANSITIONS`. A missing edge renders as a stated breach
 *     in the position it should have occupied instead of vanishing.
 *   RULE 2 — `stale` is not a failure — is visible in the shape of the graph:
 *     `stale` is downstream of `answer available` and not a sibling of
 *     `failed`, and its terminal cell reads "Yes, with the answer retained".
 *   RULE 3 — `expired` and `cancelled` are distinguishable to the worker — is
 *     visible because the two states' incoming edges and worker-visible texts
 *     both render, and they differ.
 *
 * THREE ARE QUOTED AND NOT DEMONSTRATED, AND THIS PANEL SAYS SO ON SCREEN:
 *
 *   RULE 4 — "no state may be inferred from the absence of another" — is a
 *     constraint on READING a state, and no rendering can demonstrate the
 *     absence of a predicate. It is enforced in `machine.ts` at compile time:
 *     the state id sits behind an unexported `unique symbol`, `matchState` is
 *     the only reader, and its handler map is a mapped type over the whole
 *     union with no default branch. `tests/component/ai-requests-state-machine-panel.test.tsx`
 *     holds that claim against the module's own bytes, so the sentence on
 *     screen reds if the enforcement is ever softened.
 *   RULE 1 — the transition and its audit event commit together — cannot be
 *     shown here at all. This build renders no request instance, no timestamp
 *     and no audit event on this route, so the rule is quoted and nothing
 *     below is evidence for it.
 *   RULE 6 — requests never carry a Severity, never trigger containment and
 *     never appear in the Anomaly Register — is the one rule the MOUNT makes
 *     load-bearing, because this route also renders `MOD-DOH-08`'s Anomaly
 *     Register. No state below carries a severity, this panel imports no
 *     severity component, and no request appears in that register. That is an
 *     absence, and an absence is consistent with the rule rather than proof of
 *     it, which is why the rule is quoted here rather than claimed as met.
 *
 * ── ONE PROVENANCE CLASS, `PROV-4`, OUTSIDE EVERY BRANCH ───────────────────
 * Every sentence below is a transcribed deterministic rule or a transcribed
 * diagram edge. Nothing here was produced by a model, so nothing here may be
 * labelled live artificial intelligence.
 *
 * No state, no handler, and no control of any kind — so no `'use client'`, and
 * no way for this panel to put another surface's act on this screen.
 */

/** The only class this panel may emit. A rule is `PROV-4`. */
const PANEL_PROVENANCE: ProvenanceClassId = 'PROV-4'

/** The state every other terminal state owes an edge to, under rule 5. */
const RECONCILED = 'reconciled'

export interface StateMachinePanelProps {
  /** The module this panel is being rendered beside, for the heading. */
  readonly mountedOn: string
}

export function StateMachinePanel({ mountedOn }: StateMachinePanelProps) {
  const terminalsOwingReconciliation = QUEUED_REQUEST_STATE_IDS.filter(
    (id) => stateRecord(id).terminal.terminal && id !== RECONCILED,
  )
  const intoReconciled = transitionsInto(RECONCILED)
  const fromNonTerminal = intoReconciled.filter((t) => !stateRecord(t.from).terminal.terminal)

  return (
    <section
      aria-labelledby="queued-request-state-machine-heading"
      data-testid="queued-request-state-machine"
      className="space-y-4"
    >
      <header className="space-y-2">
        <h3
          id="queued-request-state-machine-heading"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          Queued artificial-intelligence requests — the rules that bind the state set, and the
          transitions they govern
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Rendered on {mountedOn}, beside the states themselves. The six rules are transcribed from
          L89641 to L89646 and the nineteen labelled edges from the state diagram fenced between
          L89648 and L89683. This panel offers no control: it renders the machine and operates
          nothing.
        </p>
        <ProvenanceMark
          classId={PANEL_PROVENANCE}
          statement="Every rule and every edge below is transcribed from the frozen source. None of it was produced by a model and none of it is live artificial intelligence."
        />
      </header>

      <div>
        <h4 className="text-base font-medium text-[var(--color-ink)]">
          The six rules that bind the state set
        </h4>
        <ol className="mt-2 space-y-2 text-sm">
          {STATE_SET_RULES.map((rule, index) => (
            <li key={rule.locator} data-state-set-rule={index + 1}>
              <span className="text-[var(--color-ink)]">{rule.text}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{rule.locator}]
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h4 className="text-base font-medium text-[var(--color-ink)]">
          Rule 5, derived from the edges rather than asserted
        </h4>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Every terminal state other than <code>reconciled</code> owes an edge into it. The terminal
          flag is read off each state&rsquo;s own row and the edge is looked up in the transcribed
          diagram; a terminal state with no such edge renders below as a breach rather than
          disappearing from the list.
        </p>
        <ul className="mt-2 space-y-1 text-sm" data-testid="rule-5-derivation">
          {terminalsOwingReconciliation.map((id) => {
            const edge = intoReconciled.find((t) => t.from === id) ?? null
            return (
              <li key={id} data-terminal-state={id}>
                <code>{id}</code>{' '}
                <span className="text-[var(--color-ink-subtle)]">
                  (terminal: {stateRecord(id).terminal.cell})
                </span>{' '}
                {edge === null ? (
                  <span role="alert" className="text-[var(--color-ink)]">
                    has no edge into <code>reconciled</code>, which is a breach of rule 5 at L89645
                    — a request that ends without reconciliation is a data-integrity defect.
                  </span>
                ) : (
                  <span className="text-[var(--color-ink-muted)]">
                    &rarr; <code>{edge.to}</code> on &ldquo;{edge.trigger}&rdquo;{' '}
                    <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                      [{edge.locator}]
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          <code>reconciled</code> is itself terminal and is the one terminal state that owes no such
          edge; the diagram&rsquo;s <code>Reconciled --&gt; [*]</code> is the machine&rsquo;s
          boundary rather than a transition and is not registered as an edge.{' '}
          {fromNonTerminal.length === 0
            ? 'Every edge into it leaves a terminal state.'
            : `${intoReconciled.length} edges enter it in all, and ${fromNonTerminal.length} of them leave a state that is not terminal — ${fromNonTerminal.map((t) => t.from).join(', ')}. Reconciliation is reachable without a terminal state first, and rule 5 does not forbid that: it binds the terminal states, not the route in.`}
        </p>
      </div>

      <div>
        <h4 className="text-base font-medium text-[var(--color-ink)]">
          The nineteen transitions, by the state they leave
        </h4>
        <ul className="mt-2 space-y-2 text-sm" data-testid="transitions-by-state">
          {QUEUED_REQUEST_STATE_IDS.map((id) => {
            const leaving = transitionsFrom(id)
            const record = stateRecord(id)
            return (
              <li key={id} data-transitions-from={id}>
                <span className="font-medium text-[var(--color-ink)]">
                  <code>{id}</code>
                </span>{' '}
                <span className="text-xs text-[var(--color-ink-subtle)]">
                  worker-visible text:{' '}
                  {record.workerVisibility.kind === 'worker-visible'
                    ? `“${record.workerVisibility.cell}”`
                    : record.workerVisibility.cell}{' '}
                  [{record.locator}]
                </span>
                {leaving.length === 0 ? (
                  <p className="mt-0.5 text-[var(--color-ink-muted)]">
                    The diagram registers no edge leaving this state. That is a stated absence: its
                    exit is the machine&rsquo;s boundary, not a transition into another state.
                  </p>
                ) : (
                  <ul className="mt-0.5 space-y-0.5">
                    {leaving.map((edge) => (
                      <li key={edge.locator} className="text-[var(--color-ink-muted)]">
                        &rarr; <code>{edge.to}</code> on &ldquo;{edge.trigger}&rdquo;{' '}
                        <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                          [{edge.locator}]
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          {QUEUED_REQUEST_TRANSITIONS.length} labelled edges in all. The two unlabelled ones — the
          entry into <code>saved locally</code> and the exit from <code>reconciled</code> — are the
          machine&rsquo;s boundary rather than transitions between states and are not registered.
        </p>
      </div>

      <div data-testid="what-this-panel-does-not-show">
        <h4 className="text-base font-medium text-[var(--color-ink)]">
          What this panel does not show, named rather than left to be inferred
        </h4>
        <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
          <li data-not-demonstrated="4">
            Rule 4 — no state may be inferred from the absence of another — is a constraint on
            reading a state, and no rendering can demonstrate the absence of a predicate. It is
            enforced where the reader is: the state id sits behind a symbol the transition module
            does not export, there is no predicate to call, and the only reader takes a branch for
            every one of the twelve states with no default. That is a compile-time property, so it
            is quoted here and held by a suite rather than shown.
          </li>
          <li data-not-demonstrated="1">
            Rule 1 — every transition is timestamped and recorded, and the transition and its audit
            event commit together — has nothing to be evidence for on this route. No request
            instance, no timestamp and no audit event is rendered here.
          </li>
          <li data-not-demonstrated="6">
            Rule 6 — requests never carry a Severity, never trigger containment and never appear in
            the Anomaly Register — is quoted rather than claimed as met. This route also renders
            this module&rsquo;s Anomaly Register, no state above carries a severity, and this panel
            imports no severity component; an absence is consistent with the rule and is not proof
            of it.
          </li>
        </ul>
      </div>
    </section>
  )
}
