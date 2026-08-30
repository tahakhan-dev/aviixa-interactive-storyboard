import {
  QUEUED_REQUEST_STATE_IDS,
  stateRecord,
  type QueuedRequestStateId,
  type QueuedRequestStateRecord,
} from './states'

/**
 * THE QUEUED-REQUEST MACHINE — THE RULES, THE EDGES, AND THE ONLY READER.
 *
 * ── RULE 4 IS AN API CONSTRAINT HERE, NOT A COMMENT ────────────────────────
 * L89644: "No state may be inferred from the absence of another. A request
 * that is `uploaded` is not `processing` until the server says so." A comment
 * saying so persuades nobody and stops nothing, so the shape of this module is
 * the enforcement:
 *
 *   1. A request's state is carried as an `ObservedState`, whose single
 *      property is keyed by a `unique symbol` this module does not export.
 *      Code outside cannot name that key, so it cannot read the state id off
 *      the value and it cannot compare the id to a literal.
 *   2. There is no predicate. No `isUploaded`, no `hasAnswer`, no
 *      `awaitingConnection`, and no optional timestamp field standing in for
 *      one — those are the shapes that make `!uploaded` mean something.
 *   3. `matchState` is the only reader, and its handler map is a mapped type
 *      over the whole union with no default branch. Leaving a state out is a
 *      compile error, and there is no parameter to catch the rest. So a reader
 *      that wants to know anything at all must name every state positively;
 *      "not uploaded" narrows to eleven states and yields no conclusion.
 *   4. Each branch is handed the state's own record, so the wording a branch
 *      renders comes from the transcribed table rather than from the branch.
 *
 * What remains writable is `a === b` between two observed states, which asks
 * whether two requests are in the same state. That is a positive identity and
 * rule 4 does not forbid it.
 *
 * ── RULE 5 IS STRUCTURAL, NOT ADVISORY ─────────────────────────────────────
 * L89645: `reconciled` is the only state that guarantees the request appears
 * in the execution record, and every other terminal state must transition into
 * it. So `reconciled` is terminal AND the successor of the other terminals,
 * and the covering test derives that from the edges rather than asserting it.
 *
 * ── THE EDGES ARE THE DIAGRAM, TRANSCRIBED ─────────────────────────────────
 * The state diagram is fenced between L89648 and L89683. Every labelled edge
 * below carries the line it was read from and its trigger text verbatim; the
 * covering test re-parses the fence and compares. The two unlabelled edges —
 * the entry into `SavedLocally` and the exit from `Reconciled` — are the
 * machine's boundary rather than transitions between states, and are not
 * registered as edges.
 *
 * This module computes nothing beyond two filters and one dispatch.
 */

/* ==================================================================== *
 * THE RULES THAT BIND THE STATE SET.
 * ==================================================================== */

export interface StateSetRule {
  readonly text: string
  readonly locator: string
}

export const STATE_SET_RULES = [
  {
    text: 'Every state transition is timestamped and recorded; the transition and its audit event commit together. [SoW Fact — §4.10.1]',
    locator: 'L89641',
  },
  {
    text: '`stale` is not a failure. It is a successful answer arriving into a changed world, and the content is retained because a Quality Manager reviewing the shift will want to see it.',
    locator: 'L89642',
  },
  {
    text: '`expired` and `cancelled` are distinguishable to the worker, because "time ran out" and "someone withdrew it" call for different responses.',
    locator: 'L89643',
  },
  {
    text: 'No state may be inferred from the absence of another. A request that is `uploaded` is not `processing` until the server says so.',
    locator: 'L89644',
  },
  {
    text: '`reconciled` is the only state that guarantees the request appears in the execution record; every other terminal state must transition into it. A request that ends without reconciliation is a data-integrity defect, not merely an unanswered question.',
    locator: 'L89645',
  },
  {
    text: 'Requests never carry a Severity, never trigger containment, and never appear in the Anomaly Register. They are advisory objects and must not be able to imitate safety objects.',
    locator: 'L89646',
  },
] as const satisfies readonly StateSetRule[]

/* ==================================================================== *
 * THE TRANSITIONS.
 * ==================================================================== */

export interface QueuedRequestTransition {
  readonly from: QueuedRequestStateId
  readonly to: QueuedRequestStateId
  /** The diagram's own edge label. */
  readonly trigger: string
  readonly locator: string
}

export const QUEUED_REQUEST_TRANSITIONS = [
  { from: 'saved locally', to: 'waiting for connection', trigger: 'queued for upload', locator: 'L89663' },
  { from: 'saved locally', to: 'cancelled', trigger: 'worker withdraws before upload', locator: 'L89664' },
  { from: 'waiting for connection', to: 'uploaded', trigger: 'server acknowledges receipt', locator: 'L89665' },
  { from: 'waiting for connection', to: 'expired', trigger: 'answerable horizon passed while offline', locator: 'L89666' },
  { from: 'uploaded', to: 'revalidating', trigger: 'revalidation begins', locator: 'L89667' },
  { from: 'revalidating', to: 'processing', trigger: 'context still valid', locator: 'L89668' },
  { from: 'revalidating', to: 'expired', trigger: 'context no longer answerable', locator: 'L89669' },
  { from: 'revalidating', to: 'cancelled', trigger: 'withdrawn by supervisor or quality manager', locator: 'L89670' },
  { from: 'processing', to: 'pending human review', trigger: 'output beyond pre authorised policy', locator: 'L89671' },
  { from: 'processing', to: 'answer available', trigger: 'output within pre authorised policy', locator: 'L89672' },
  { from: 'processing', to: 'failed', trigger: 'technical failure with recorded reason', locator: 'L89673' },
  { from: 'pending human review', to: 'answer available', trigger: 'human gate approved', locator: 'L89674' },
  { from: 'pending human review', to: 'cancelled', trigger: 'human gate declined with reason', locator: 'L89675' },
  { from: 'answer available', to: 'stale', trigger: 'context changed before or after delivery', locator: 'L89676' },
  { from: 'answer available', to: 'reconciled', trigger: 'delivered and folded into the record', locator: 'L89677' },
  { from: 'stale', to: 'reconciled', trigger: 'retained and folded into the record', locator: 'L89678' },
  { from: 'expired', to: 'reconciled', trigger: 'folded into the record', locator: 'L89679' },
  { from: 'cancelled', to: 'reconciled', trigger: 'folded into the record', locator: 'L89680' },
  { from: 'failed', to: 'reconciled', trigger: 'folded into the record', locator: 'L89681' },
] as const satisfies readonly QueuedRequestTransition[]

/** The edges leaving a state. Empty for a state the diagram never leaves. */
export function transitionsFrom(id: QueuedRequestStateId): readonly QueuedRequestTransition[] {
  return QUEUED_REQUEST_TRANSITIONS.filter((t) => t.from === id)
}

/** The edges entering a state. */
export function transitionsInto(id: QueuedRequestStateId): readonly QueuedRequestTransition[] {
  return QUEUED_REQUEST_TRANSITIONS.filter((t) => t.to === id)
}

/* ==================================================================== *
 * THE OBSERVED STATE AND ITS ONLY READER.
 * ==================================================================== */

/**
 * Deliberately NOT exported. A caller that cannot name this key cannot read a
 * state id off an `ObservedState`, and that is the whole enforcement of rule 4
 * at L89644.
 */
const OBSERVED_STATE_ID: unique symbol = Symbol('queued request observed state')

/**
 * A state as observed on a request. It has no readable field, no predicate and
 * no ordering. The only thing that can be done with one is `matchState`.
 */
export interface ObservedState {
  readonly [OBSERVED_STATE_ID]: QueuedRequestStateId
}

const INTERNED: ReadonlyMap<QueuedRequestStateId, ObservedState> = new Map(
  QUEUED_REQUEST_STATE_IDS.map((id) => [
    id,
    Object.freeze({ [OBSERVED_STATE_ID]: id }) as ObservedState,
  ]),
)

/**
 * The observation a server or a local store reports. Interned, so two
 * observations of the same state are the same value and `===` between them
 * asks the positive question "are these two requests in the same state?".
 */
export function observeState(id: QueuedRequestStateId): ObservedState {
  const state = INTERNED.get(id)
  if (state === undefined) {
    throw new Error(`No queued-request state named ${id}.`)
  }
  return state
}

/**
 * A branch for every state. A mapped type over the whole union, so omitting one
 * is a compile error; there is no default parameter, so there is nowhere for
 * "everything else" to go.
 */
export type StateCases<T> = {
  readonly [K in QueuedRequestStateId]: (record: QueuedRequestStateRecord) => T
}

/** The only way to read an observed state. */
export function matchState<T>(state: ObservedState, cases: StateCases<T>): T {
  const id = state[OBSERVED_STATE_ID]
  return cases[id](stateRecord(id))
}
