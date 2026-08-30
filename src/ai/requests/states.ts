import { decisionRecord, type DecisionId } from '@/disclosure/decisions'

/**
 * THE QUEUED ARTIFICIAL-INTELLIGENCE REQUEST STATE SET.
 *
 * Section 42.6 of the frozen source defines the states a worker's question
 * passes through between being written on a device and being folded into the
 * execution record. L89620 states the reason the set exists at all: "state
 * vocabularies must not collapse", and no surface may present one state as
 * another. L89618 puts the consequence in the worker's terms — "sent" and
 * "answered" are not the same thing, and a worker who is told the wrong one
 * will make the wrong decision.
 *
 * ── THIS MODULE IS DATA, AND THE READING RULE LIVES NEXT DOOR ──────────────
 * The records below are the table's five columns transcribed. What may be
 * DONE with a state — rule 4's constraint that no state may be inferred from
 * the absence of another — is enforced by `./machine`, because a constraint on
 * reading has to live where the reader is. Nothing here returns a boolean
 * about a state, and nothing here is named `is…`.
 *
 * ── THE WORKER-VISIBLE COLUMN HAS A CELL THAT NEGATES ITSELF ───────────────
 * Most cells carry text meant for a worker's screen. One does not: L89637
 * reads "Not worker-visible; appears in the record" — a cell in the
 * worker-visible column stating that the state is not worker-visible. Rendered
 * naively that sentence appears on the floor interface as a status. So the
 * field is a discriminated union rather than a string: a caller must handle
 * the not-visible case to reach any text at all.
 *
 * ── THE TERMINAL COLUMN IS NOT A BOOLEAN EITHER ────────────────────────────
 * L89633 reads "Yes, with the answer retained", which is the table carrying
 * rule 2 (L89642) inside a flag: `stale` is not a failure, it is a good answer
 * arriving into a changed world, and the content is kept. The exact cell and
 * the boolean it implies are both held, and the covering test asserts they
 * agree rather than deriving one from the other silently.
 *
 * ── THE EXPIRY HORIZON IS A REFUSAL, NOT A NUMBER ──────────────────────────
 * L89634 classifies `expired` as `Client Decision Required` with the horizon
 * held by `DEC-AISTALE-001`. AC-43-112 at L90039 forbids a code-level default
 * that could apply silently, so this module holds no figure — the covering
 * test scans its own bytes for one — and the disclosure text is read from the
 * decision canon rather than restated here, so the two cannot drift.
 */

export type QueuedRequestStateId =
  | 'saved locally'
  | 'waiting for connection'
  | 'uploaded'
  | 'revalidating'
  | 'processing'
  | 'pending human review'
  | 'answer available'
  | 'stale'
  | 'expired'
  | 'cancelled'
  | 'failed'
  | 'reconciled'

/** The state names in the order the source's table writes them. */
export const QUEUED_REQUEST_STATE_IDS = [
  'saved locally',
  'waiting for connection',
  'uploaded',
  'revalidating',
  'processing',
  'pending human review',
  'answer available',
  'stale',
  'expired',
  'cancelled',
  'failed',
  'reconciled',
] as const satisfies readonly QueuedRequestStateId[]

type MissingFromStateIds = Exclude<QueuedRequestStateId, (typeof QUEUED_REQUEST_STATE_IDS)[number]>
const _stateIdsExhaustive: MissingFromStateIds extends never ? true : never = true
void _stateIdsExhaustive

/**
 * The worker-visible column. `cell` is always the source's own text; `kind`
 * says whether that text is something a worker may be shown.
 */
export type WorkerVisibility =
  | { readonly kind: 'worker-visible'; readonly cell: string }
  | { readonly kind: 'not-worker-visible'; readonly cell: string }

/** The terminal column: the source's cell, and the flag it states. */
export interface TerminalFlag {
  readonly terminal: boolean
  readonly cell: string
}

export interface QueuedRequestStateRecord {
  readonly id: QueuedRequestStateId
  readonly meaning: string
  readonly workerVisibility: WorkerVisibility
  readonly terminal: TerminalFlag
  readonly classification: string
  /**
   * The client decision that governs this state's own governing value, where
   * the classification cell names one. `null` everywhere else, and never a
   * value.
   */
  readonly horizonDecision: DecisionId | null
  /** The frozen-source row this record transcribes. */
  readonly locator: string
}

const visible = (cell: string): WorkerVisibility => ({ kind: 'worker-visible', cell })
const notVisible = (cell: string): WorkerVisibility => ({ kind: 'not-worker-visible', cell })
const open = (cell: string): TerminalFlag => ({ terminal: false, cell })
const closed = (cell: string): TerminalFlag => ({ terminal: true, cell })

const EXTENSION = '`User-Mandated Product Extension`'

export const QUEUED_REQUEST_STATES = [
  {
    id: 'saved locally',
    meaning: 'Durably written to the encrypted on-device store; not yet eligible for upload',
    workerVisibility: visible('Saved on this device'),
    terminal: open('No'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89626',
  },
  {
    id: 'waiting for connection',
    meaning: 'Eligible for upload; the device has no usable connection',
    workerVisibility: visible('Waiting for connection'),
    terminal: open('No'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89627',
  },
  {
    id: 'uploaded',
    meaning: 'Server has received and acknowledged the request record',
    workerVisibility: visible('Sent to the platform'),
    terminal: open('No'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89628',
  },
  {
    id: 'revalidating',
    meaning: 'Server is checking the request against current run state',
    workerVisibility: visible('Being checked against this run'),
    terminal: open('No'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89629',
  },
  {
    id: 'processing',
    meaning: 'The orchestrator is planning, retrieving, and evaluating',
    workerVisibility: visible('Being worked on'),
    terminal: open('No'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89630',
  },
  {
    id: 'pending human review',
    meaning: 'Output routed to a human gate in the Client Command Center',
    workerVisibility: visible('Waiting for a supervisor or quality manager'),
    terminal: open('No'),
    classification: '`SoW Fact — §3.7 gate`, state name `User-Mandated Product Extension`',
    horizonDecision: null,
    locator: 'L89631',
  },
  {
    id: 'answer available',
    meaning: 'An answer exists and is queued on the command channel or has been rendered',
    workerVisibility: visible('Answer ready'),
    terminal: open('No'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89632',
  },
  {
    id: 'stale',
    meaning: 'An answer exists but the context it was answered against has changed',
    workerVisibility: visible('Answer is out of date, advice only'),
    terminal: closed('Yes, with the answer retained'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89633',
  },
  {
    id: 'expired',
    meaning: 'The request passed its answerable horizon and no answer will be produced',
    workerVisibility: visible('No longer answerable'),
    terminal: closed('Yes'),
    classification: '`Client Decision Required` — horizon is `DEC-AISTALE-001`',
    horizonDecision: 'DEC-AISTALE-001',
    locator: 'L89634',
  },
  {
    id: 'cancelled',
    meaning: 'Withdrawn by the worker, or by a Supervisor or Quality Manager with a reason',
    workerVisibility: visible('Cancelled, with reason'),
    terminal: closed('Yes'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89635',
  },
  {
    id: 'failed',
    meaning: 'A technical failure prevented an answer; the reason is recorded',
    workerVisibility: visible('Could not be answered'),
    terminal: closed('Yes'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89636',
  },
  {
    id: 'reconciled',
    meaning: 'The request and its outcome are folded into the execution record and audit log',
    workerVisibility: notVisible('Not worker-visible; appears in the record'),
    terminal: closed('Yes'),
    classification: EXTENSION,
    horizonDecision: null,
    locator: 'L89637',
  },
] as const satisfies readonly QueuedRequestStateRecord[]

/** The record for a state. Total over the union, so it cannot answer `undefined`. */
export function stateRecord(id: QueuedRequestStateId): QueuedRequestStateRecord {
  const found = QUEUED_REQUEST_STATES.find((s) => s.id === id)
  if (found === undefined) {
    throw new Error(`No queued-request state record for ${id}.`)
  }
  return found
}

/**
 * The answerable horizon that decides when a request becomes `expired`.
 *
 * There is no number here and there is not meant to be one. `set` is false, the
 * decision identifier is carried so a surface can name it, and the wording is
 * the canon's own so this module cannot soften it.
 */
export interface UnsetHorizon {
  readonly set: false
  readonly decision: DecisionId
  readonly disclosure: string
}

export const EXPIRY_HORIZON: UnsetHorizon = {
  set: false,
  decision: 'DEC-AISTALE-001',
  disclosure: decisionRecord('DEC-AISTALE-001').adopted,
}
