/**
 * THE SIXTEEN ARTIFICIAL-INTELLIGENCE OPERATING MODES — THE VOCABULARY.
 *
 * `AC-42-301` requires that at any instant every surface displaying an
 * artificial-intelligence availability state for a tenant displays the same
 * mode, drawn from the same sixteen-value vocabulary. A vocabulary shared by
 * five surfaces belongs to none of them, so this module sits outside every
 * surface directory and holds no React, no route and no storage. It is the
 * mode contract matrix and the transition-condition table, as data.
 *
 * ── THE ROWS ARE COUNTED, NOT SPANNED ──────────────────────────────────────
 * The mode matrix's header is L89354 and its separator L89355; its sixteen
 * data rows are L89356-L89371. The transition table's header is L89375 and
 * its separator L89376; its sixteen data rows are L89377-L89392. The dispatch
 * brief for this file placed the transition table's header and separator
 * ABOVE L89375 and gave L89375-L89392 as the rows — eighteen lines for
 * sixteen rows. The row COUNT it gave is right and the span is not, which is
 * the same shape as the roster brief's error one task over.
 * `tests/unit/ai-modes.test.ts` locates both tables by their header text in
 * the frozen bytes and counts the rows beneath, so no number written above
 * is load-bearing.
 *
 * ── THE WORKER-VISIBLE LABEL IS NOT AN IDENTITY ────────────────────────────
 * Sixteen modes carry thirteen distinct labels. `AIMODE-13` and `AIMODE-14`
 * share one, `AIMODE-03` and `AIMODE-15` share one, `AIMODE-01` and
 * `AIMODE-16` share one. A surface keyed on the label collapses a tenant
 * pause into a platform pause, a model rollback into an outage, and a
 * completed recovery into steady state. The identifier is the key. This is
 * measured in the covering test rather than asserted here.
 *
 * ── AND THE MATRIX AND THE PROSE DISAGREE ON FOUR OF THEM ──────────────────
 * Section 42.3's prose quotes the chip text for `AIMODE-04`, `AIMODE-05`,
 * `AIMODE-10` and `AIMODE-12` with different punctuation, and in one case
 * with a different sentence altogether. Both spellings are the source's, so
 * both are carried: `workerLabel` is the matrix cell and `workerLabelProse`
 * the prose, with its own locator. Dropping either would make a verbatim
 * assertion somewhere else in this build a false claim about the source.
 *
 * ── DETERMINISTIC SAFETY IS TYPED, NOT ASSERTED ────────────────────────────
 * The column reads `Allowed` on all sixteen rows, and `AC-42-302` turns that
 * into a testable property. `deterministicSafety` is therefore the literal
 * type `'Allowed'`: a row claiming anything else does not compile. The
 * checker holds it, not a test that could be deleted.
 *
 * ── WHAT THIS MODULE DELIBERATELY DOES NOT HOLD ────────────────────────────
 * `src/studio/state/connectivity.ts` names four postures — Connected,
 * Degraded, ReadOnlyCache, Suspended — and none of them is one of the
 * sixteen. It is Studio-scoped and is not widened into this vocabulary.
 * Connectivity and artificial-intelligence availability are different axes,
 * and conflating them is the `AIMODE-13`-versus-"offline" error that L89289
 * calls out by name.
 *
 * This module is data and two lookups. It computes nothing and decides
 * nothing; `./machine` holds every rule.
 */

export type AiModeId =
  | 'AIMODE-01'
  | 'AIMODE-02'
  | 'AIMODE-03'
  | 'AIMODE-04'
  | 'AIMODE-05'
  | 'AIMODE-06'
  | 'AIMODE-07'
  | 'AIMODE-08'
  | 'AIMODE-09'
  | 'AIMODE-10'
  | 'AIMODE-11'
  | 'AIMODE-12'
  | 'AIMODE-13'
  | 'AIMODE-14'
  | 'AIMODE-15'
  | 'AIMODE-16'

/**
 * Declared as its own literal list rather than mapped off `AI_MODE_ROWS`,
 * because a membership check derived from the array it is meant to police can
 * only ever pass. `Exclude` below fails the type-check if the union and the
 * list drift apart in either direction.
 */
export const AI_MODE_IDS = [
  'AIMODE-01',
  'AIMODE-02',
  'AIMODE-03',
  'AIMODE-04',
  'AIMODE-05',
  'AIMODE-06',
  'AIMODE-07',
  'AIMODE-08',
  'AIMODE-09',
  'AIMODE-10',
  'AIMODE-11',
  'AIMODE-12',
  'AIMODE-13',
  'AIMODE-14',
  'AIMODE-15',
  'AIMODE-16',
] as const satisfies readonly AiModeId[]

type MissingFromModeIds = Exclude<AiModeId, (typeof AI_MODE_IDS)[number]>
const _modeIdsExhaustive: MissingFromModeIds extends never ? true : never = true
void _modeIdsExhaustive

/**
 * The agent-invocation column's vocabulary, closed on the six values the
 * sixteen rows actually use. `Explicitly prohibited for new conversations` is
 * its own value and not a shade of `Explicitly prohibited`: L89279 says the
 * block exists "because a request that cannot complete is worse than one that
 * was never started", which leaves a conversation already under way alone.
 */
export type AgentInvocation =
  | 'Allowed'
  | 'Allowed with conditions'
  | 'Unavailable'
  | 'Client Decision Required'
  | 'Explicitly prohibited'
  | 'Explicitly prohibited for new conversations'

export const AGENT_INVOCATION_VALUES = [
  'Allowed',
  'Allowed with conditions',
  'Unavailable',
  'Client Decision Required',
  'Explicitly prohibited',
  'Explicitly prohibited for new conversations',
] as const satisfies readonly AgentInvocation[]

type MissingFromInvocation = Exclude<AgentInvocation, (typeof AGENT_INVOCATION_VALUES)[number]>
const _invocationExhaustive: MissingFromInvocation extends never ? true : never = true
void _invocationExhaustive

/**
 * The escalation-delivery column's two values. `Queued while offline` is one
 * of the two `PermissionOutcome` members the slice brief names as first
 * exercised here; it describes the Frontline consequence of a platform
 * condition, never a claim that anything was delivered.
 */
export type EscalationDelivery = 'Allowed' | 'Queued while offline'

export const ESCALATION_DELIVERY_VALUES = [
  'Allowed',
  'Queued while offline',
] as const satisfies readonly EscalationDelivery[]

type MissingFromEscalation = Exclude<EscalationDelivery, (typeof ESCALATION_DELIVERY_VALUES)[number]>
const _escalationExhaustive: MissingFromEscalation extends never ? true : never = true
void _escalationExhaustive

export interface AiModeRow {
  readonly id: AiModeId
  /** The matrix's own name for the mode, which is shorter than the prose
   *  heading's on four rows. The matrix is the contract table, so it wins. */
  readonly name: string
  /** The matrix cell. */
  readonly workerLabel: string
  /** Section 42.3's prose chip text where it differs from the matrix cell,
   *  and `null` on the twelve rows where the source states no variant.
   *  Required-and-nullable rather than optional, so every row carries the key
   *  and the array can take the `as const satisfies` form. */
  readonly workerLabelProse: string | null
  readonly proseLocator: string | null
  readonly agentInvocation: AgentInvocation
  /**
   * `AC-42-302`. The literal type, not `string`: the column reads `Allowed`
   * on all sixteen rows and a row claiming otherwise will not compile.
   */
  readonly deterministicSafety: 'Allowed'
  readonly escalationDelivery: EscalationDelivery
  readonly classification: string
  readonly matrixLocator: string
}

/**
 * THE MODE CONTRACT MATRIX, cell for cell. Every string here is asserted
 * verbatim against the frozen bytes by `tests/unit/ai-modes.test.ts`.
 */
export const AI_MODE_ROWS = [
  { id: 'AIMODE-01', name: 'Online and healthy', workerLabel: 'Live coaching available', workerLabelProse: null, proseLocator: null, agentInvocation: 'Allowed', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`User-Mandated Product Extension` on `SoW Fact — §7.9.1`', matrixLocator: 'L89356' },
  { id: 'AIMODE-02', name: 'Online and degraded', workerLabel: 'Live coaching slow', workerLabelProse: null, proseLocator: null, agentInvocation: 'Allowed with conditions', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`User-Mandated Product Extension`', matrixLocator: 'L89357' },
  { id: 'AIMODE-03', name: 'Online and unavailable', workerLabel: 'Live coaching unavailable', workerLabelProse: null, proseLocator: null, agentInvocation: 'Unavailable', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`User-Mandated Product Extension`', matrixLocator: 'L89358' },
  { id: 'AIMODE-04', name: 'Offline with local artificial intelligence', workerLabel: 'On-device assistant, not live', workerLabelProse: 'On-device assistant — not live', proseLocator: 'L89271', agentInvocation: 'Client Decision Required', deterministicSafety: 'Allowed', escalationDelivery: 'Queued while offline', classification: '`Recommendation — R&D`, gated by `DEC-ONDEVICE-001`', matrixLocator: 'L89359' },
  { id: 'AIMODE-05', name: 'Offline without local artificial intelligence', workerLabel: 'Offline, approved instructions only', workerLabelProse: 'Offline — approved instructions only', proseLocator: 'L89273', agentInvocation: 'Unavailable', deterministicSafety: 'Allowed', escalationDelivery: 'Queued while offline', classification: '`SoW Fact — §7.9.1, §7.12`', matrixLocator: 'L89360' },
  { id: 'AIMODE-06', name: 'Cached approved guidance only', workerLabel: 'Approved cached guidance', workerLabelProse: null, proseLocator: null, agentInvocation: 'Unavailable', deterministicSafety: 'Allowed', escalationDelivery: 'Queued while offline', classification: '`SoW Fact — §5.7.2`', matrixLocator: 'L89361' },
  { id: 'AIMODE-07', name: 'Deterministic no artificial intelligence', workerLabel: 'No coaching content available', workerLabelProse: null, proseLocator: null, agentInvocation: 'Explicitly prohibited', deterministicSafety: 'Allowed', escalationDelivery: 'Queued while offline', classification: '`Derived Clarification`', matrixLocator: 'L89362' },
  { id: 'AIMODE-08', name: 'Intermittent connectivity', workerLabel: 'Connection unstable', workerLabelProse: null, proseLocator: null, agentInvocation: 'Explicitly prohibited for new conversations', deterministicSafety: 'Allowed', escalationDelivery: 'Queued while offline', classification: '`Derived Clarification`', matrixLocator: 'L89363' },
  { id: 'AIMODE-09', name: 'Failure during conversation', workerLabel: 'Live assistant stopped', workerLabelProse: null, proseLocator: null, agentInvocation: 'Allowed with conditions', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`Derived Clarification`', matrixLocator: 'L89364' },
  { id: 'AIMODE-10', name: 'Reconnecting', workerLabel: 'Reconnecting, your work is saved', workerLabelProse: 'Reconnecting — your work is saved', proseLocator: 'L89283', agentInvocation: 'Unavailable', deterministicSafety: 'Allowed', escalationDelivery: 'Queued while offline', classification: '`Derived Clarification`', matrixLocator: 'L89365' },
  { id: 'AIMODE-11', name: 'Synchronizing', workerLabel: 'Sending your work', workerLabelProse: null, proseLocator: null, agentInvocation: 'Allowed with conditions', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`SoW Fact — §7.10.2`', matrixLocator: 'L89366' },
  { id: 'AIMODE-12', name: 'Request pending revalidation', workerLabel: 'Checking your question against the run', workerLabelProse: 'Your question is being checked against the current state of this run.', proseLocator: 'L89287', agentInvocation: 'Allowed with conditions', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`User-Mandated Product Extension`', matrixLocator: 'L89367' },
  { id: 'AIMODE-13', name: 'Tenant suspension', workerLabel: 'Live coaching paused by the platform', workerLabelProse: null, proseLocator: null, agentInvocation: 'Explicitly prohibited', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`SoW Fact — §8.7.5`', matrixLocator: 'L89368' },
  { id: 'AIMODE-14', name: 'Platform suspension', workerLabel: 'Live coaching paused by the platform', workerLabelProse: null, proseLocator: null, agentInvocation: 'Explicitly prohibited', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`SoW Fact — §8.7.5`', matrixLocator: 'L89369' },
  { id: 'AIMODE-15', name: 'Model rollback', workerLabel: 'Live coaching unavailable', workerLabelProse: null, proseLocator: null, agentInvocation: 'Allowed with conditions', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`Derived Clarification` on `SoW Fact — §8.5.1`', matrixLocator: 'L89370' },
  { id: 'AIMODE-16', name: 'Recovery complete', workerLabel: 'Live coaching available', workerLabelProse: null, proseLocator: null, agentInvocation: 'Allowed', deterministicSafety: 'Allowed', escalationDelivery: 'Allowed', classification: '`Derived Clarification`', matrixLocator: 'L89371' },
] as const satisfies readonly AiModeRow[]

type MissingFromModeRows = Exclude<AiModeId, (typeof AI_MODE_ROWS)[number]['id']>
const _modeRowsExhaustive: MissingFromModeRows extends never ? true : never = true
void _modeRowsExhaustive

const BY_ID = new Map<AiModeId, AiModeRow>(AI_MODE_ROWS.map((row): [AiModeId, AiModeRow] => [row.id, row]))

/**
 * The one lookup. `_modeRowsExhaustive` above proves every identifier of the
 * union has a row, so the non-null is discharged by the compiler rather than
 * by hope.
 */
export function aiMode(id: AiModeId): AiModeRow {
  return BY_ID.get(id)!
}

/**
 * Every mode carrying a given worker-visible label. Returns an ARRAY and
 * never a single mode, because three labels have two owners each — a resolver
 * that silently picks one is how a tenant pause renders as a platform pause.
 */
export function modesCarryingWorkerLabel(
  label: string,
  register: readonly AiModeRow[] = AI_MODE_ROWS,
): readonly AiModeId[] {
  return register.filter((row) => row.workerLabel === label).map((row) => row.id)
}

/* ==================================================================== *
 * THE TRANSITION-CONDITION TABLE.
 * ==================================================================== */

/**
 * The From cell names one mode on ten rows, two modes on three, and `Any` on
 * three. It is modelled as it is written rather than flattened to a single
 * source, because "any mode" and "these two modes" are different claims and
 * expanding `Any` into a list would silently re-answer the question every
 * time a mode is added.
 */
export type TransitionSource =
  | { readonly kind: 'any' }
  | { readonly kind: 'modes'; readonly modes: readonly AiModeId[] }

/**
 * The To cell names a mode on fifteen rows and `Prior mode` on one — the
 * resume row. `Prior mode` is not a mode identifier and is not turned into
 * one: what a resume returns to depends on what was recorded before the
 * pause, and a machine that guesses it would invent a state.
 */
export type TransitionTarget =
  | { readonly kind: 'mode'; readonly mode: AiModeId }
  | { readonly kind: 'prior-mode' }

export interface AiModeTransition {
  readonly from: TransitionSource
  readonly to: TransitionTarget
  /** Verbatim from the Trigger column. */
  readonly trigger: string
  /** Verbatim from the "Who or what decides" column. */
  readonly decidedBy: string
  readonly classification: string
  /**
   * `'settling-period'` on the one row whose trigger names it, and `null`
   * elsewhere. This records what the trigger text already says, so the guard
   * in `./machine` keys on a field rather than on a string match — a trigger
   * reworded by a future transcription would otherwise silently ungate it.
   */
  readonly guard: 'settling-period' | null
  readonly locator: string
}

export const AI_MODE_TRANSITIONS = [
  { from: { kind: 'modes', modes: ['AIMODE-01'] }, to: { kind: 'mode', mode: 'AIMODE-02' }, trigger: 'Latency or error-rate alert threshold breached', decidedBy: 'Observability thresholds in platform settings', classification: '`SoW Fact — §8.7.1 Observability`', guard: null, locator: 'L89377' },
  { from: { kind: 'modes', modes: ['AIMODE-02'] }, to: { kind: 'mode', mode: 'AIMODE-03' }, trigger: 'Circuit breaker opens', decidedBy: 'Platform, per `DEC-AICB-001`', classification: '`Client Decision Required`', guard: null, locator: 'L89378' },
  { from: { kind: 'modes', modes: ['AIMODE-01', 'AIMODE-02'] }, to: { kind: 'mode', mode: 'AIMODE-08' }, trigger: 'Device connectivity flapping', decidedBy: 'Device-side hysteresis policy', classification: '`Derived Clarification`', guard: null, locator: 'L89379' },
  { from: { kind: 'modes', modes: ['AIMODE-08'] }, to: { kind: 'mode', mode: 'AIMODE-05' }, trigger: 'Connection lost beyond the settling period', decidedBy: 'Device', classification: '`Derived Clarification`', guard: 'settling-period', locator: 'L89380' },
  { from: { kind: 'modes', modes: ['AIMODE-05'] }, to: { kind: 'mode', mode: 'AIMODE-06' }, trigger: "Step has a packaged asset for the worker's locale", decidedBy: 'Device, from the package', classification: '`SoW Fact — §5.7.2`', guard: null, locator: 'L89381' },
  { from: { kind: 'modes', modes: ['AIMODE-05', 'AIMODE-06'] }, to: { kind: 'mode', mode: 'AIMODE-07' }, trigger: 'No packaged asset for the step and locale', decidedBy: 'Device, from the package', classification: '`Derived Clarification`', guard: null, locator: 'L89382' },
  { from: { kind: 'any' }, to: { kind: 'mode', mode: 'AIMODE-13' }, trigger: 'Per-tenant emergency pause applied', decidedBy: 'Super Admin, critical-class action', classification: '`SoW Fact — §8.7.5, §8.8.3`', guard: null, locator: 'L89383' },
  { from: { kind: 'any' }, to: { kind: 'mode', mode: 'AIMODE-14' }, trigger: 'Platform-wide emergency pause applied', decidedBy: 'Super Admin, critical-class action', classification: '`SoW Fact — §8.7.5, §8.8.3`', guard: null, locator: 'L89384' },
  { from: { kind: 'modes', modes: ['AIMODE-13', 'AIMODE-14'] }, to: { kind: 'prior-mode' }, trigger: 'Resume, a separate audited act', decidedBy: 'Super Admin', classification: '`SoW Fact — §8.7.5`', guard: null, locator: 'L89385' },
  { from: { kind: 'modes', modes: ['AIMODE-05'] }, to: { kind: 'mode', mode: 'AIMODE-10' }, trigger: 'Connectivity returns', decidedBy: 'Device', classification: '`SoW Fact — §7.10.2`', guard: null, locator: 'L89386' },
  { from: { kind: 'modes', modes: ['AIMODE-10'] }, to: { kind: 'mode', mode: 'AIMODE-11' }, trigger: 'Session established', decidedBy: 'Device and server', classification: '`SoW Fact — §7.10.2`', guard: null, locator: 'L89387' },
  { from: { kind: 'modes', modes: ['AIMODE-11'] }, to: { kind: 'mode', mode: 'AIMODE-12' }, trigger: 'Queued artificial-intelligence requests uploaded', decidedBy: 'Server', classification: '`User-Mandated Product Extension`', guard: null, locator: 'L89388' },
  { from: { kind: 'modes', modes: ['AIMODE-12'] }, to: { kind: 'mode', mode: 'AIMODE-16' }, trigger: 'Revalidation passed and reconciliation confirmed', decidedBy: 'Server', classification: '`User-Mandated Product Extension`', guard: null, locator: 'L89389' },
  { from: { kind: 'modes', modes: ['AIMODE-12'] }, to: { kind: 'mode', mode: 'AIMODE-07' }, trigger: 'Revalidation failed', decidedBy: 'Server', classification: '`User-Mandated Product Extension`', guard: null, locator: 'L89390' },
  { from: { kind: 'any' }, to: { kind: 'mode', mode: 'AIMODE-15' }, trigger: 'Rollback initiated and approval-cycled', decidedBy: 'Super Admin', classification: '`SoW Fact — §8.8.3`', guard: null, locator: 'L89391' },
  { from: { kind: 'modes', modes: ['AIMODE-15'] }, to: { kind: 'mode', mode: 'AIMODE-02' }, trigger: 'Target version serving and evaluation-passing', decidedBy: 'Evaluation gate', classification: '`SoW Fact — §8.5.1`', guard: null, locator: 'L89392' },
] as const satisfies readonly AiModeTransition[]
