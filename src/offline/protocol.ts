/**
 * THE PRODUCTION RECONNECTION PROTOCOL — thirty-seven ordered steps under
 * eight phase headings, as an ordered machine.
 *
 * §36.1 opens at L79894, "The Production Reconnection Protocol — Thirty-Seven
 * Ordered Steps". The enumeration runs L79908 (step 1) to L79967 (step 37),
 * one step per line with no gaps, under eight phase headings at L79906,
 * L79916, L79922, L79929, L79938, L79945, L79953 and L79962.
 *
 * WHY THIS FILE IS A SPINE RATHER THAN A TRANSCRIPTION. Three other modules
 * in this slice cite step numbers — the conflict resolver at step 24, the
 * quarantine register at step 25, the convergence comparator at step 35. A
 * step number written as a bare integer in each of those files is four
 * private copies of one ordering, and the ordering is the protocol: L79904
 * says "the ordering below is the protocol". So the numbers live here once.
 *
 * ── THE ARITHMETIC, COUNTED RATHER THAN CLAIMED ────────────────────────────
 *   phase 1  L79906  steps  1-7    L79908-L79914   7
 *   phase 2  L79916  steps  8-10   L79918-L79920   3
 *   phase 3  L79922  steps 11-14   L79924-L79927   4
 *   phase 4  L79929  steps 15-20   L79931-L79936   6
 *   phase 5  L79938  steps 21-22   L79940-L79941   2
 *   phase 6  L79945  steps 23-27   L79947-L79951   5
 *   phase 7  L79953  steps 28-33   L79955-L79960   6
 *   phase 8  L79962  steps 34-37   L79964-L79967   4
 *                                                 ──
 *                                                 37
 *
 * Steps are contiguous line-per-step in every phase. Phase 5 is the one place
 * the enumeration is interrupted: a blank line, and then the Ordering notice
 * at L79943, which is prose about steps 21 and 22 rather than a step. The
 * blank line is deliberately not cited — a blank line states nothing, so a
 * citation of one is always false.
 *
 * ── WHAT THE STEPS MUST NOT BE MADE TO CLAIM ───────────────────────────────
 * STEP 21 IS THE COMMAND MANIFEST READ. STEP 22 IS THE CAPTURE UPLOAD. They
 * are one line apart in the source and one integer apart here, and the
 * distinction is the whole of `DEC-SYNC-001`'s adopted position: the stop
 * class lands before any capture leaves the device. L79940 titles step 21
 * "Transfer pass one — the command manifest is read and the stop class is
 * applied"; L79941 titles step 22 "Transfer pass two, then pass three — the
 * captures upload, then the enabling classes are applied".
 *
 * Anything that says a capture was inspected at step 21 is describing an
 * inspection of a record that has not arrived. `COMMAND_MANIFEST_READ_STEP`
 * and `CAPTURE_UPLOAD_STEP` exist so that claim is a type error to write by
 * accident rather than a comment nobody re-reads.
 *
 * ── OUTCOME CODES ARE THE SOURCE'S OWN TERM ────────────────────────────────
 * L80020, the Detection clause of fallback contract `FB-SYNC-01`: "Per-step
 * outcome codes, emitted to fleet telemetry as sync health". The source names
 * the mechanism and never enumerates the codes, so this file does not invent
 * a taxonomy for them. What it carries is the two triggers the source states
 * in its own words — L80026 "Entry trigger. Any step returning a non-success
 * outcome" and L80027 "Exit trigger. A successful full pass of steps 1 to 37,
 * or an authorised human act named in the relevant blocker entry".
 *
 * That is why `StepOutcome` has two members and not six. A richer enum would
 * be this build's vocabulary wearing the source's authority.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────────
 * A per-step `failure` field. Only steps 1 and 2 state a `**Failure:**`
 * clause — L79908 and L79909 — so thirty-five of thirty-seven rows would be
 * blank, and the common brief's rule is that a blank cell is untypeable.
 * Three steps name a Chapter 37 blocker and those three carry it; the rest
 * carry `null` explicitly, which is a statement rather than an omission.
 */

import type { DecisionReading } from '@/disclosure/decisions'
import { DEC_SYNC_001_ORDER, type ReconnectionPhase } from '@/frontline/commands'

export type ProtocolPhaseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/**
 * One step. `title` is the source's own bold title verbatim, terminal period
 * included, because the period is inside the bold span in the source.
 *
 * `blocker` is the Chapter 37 blocker the step routes to where the step names
 * one, and `null` where it names none. Three steps name one: 11 → `OFF-BLK-06`
 * (L79924), 13 → `OFF-BLK-04` (L79926), 14 → `OFF-BLK-22` (L79927).
 */
export interface ProtocolStep {
  readonly number: number
  readonly title: string
  readonly phase: ProtocolPhaseNumber
  /** Frozen-source line carrying this step. */
  readonly sourceLine: number
  readonly blocker: string | null
}

export const PROTOCOL_STEPS = [
  { number: 1, title: 'Connectivity detection.', phase: 1, sourceLine: 79908, blocker: null },
  { number: 2, title: 'Secure device reconnection.', phase: 1, sourceLine: 79909, blocker: null },
  { number: 3, title: 'Identity verification.', phase: 1, sourceLine: 79910, blocker: null },
  { number: 4, title: 'Tenant verification.', phase: 1, sourceLine: 79911, blocker: null },
  { number: 5, title: 'Device verification.', phase: 1, sourceLine: 79912, blocker: null },
  {
    number: 6,
    title: 'Token and certificate validation.',
    phase: 1,
    sourceLine: 79913,
    blocker: null,
  },
  {
    number: 7,
    title: 'Device suspension and wipe status check.',
    phase: 1,
    sourceLine: 79914,
    blocker: null,
  },
  { number: 8, title: 'User role revalidation.', phase: 2, sourceLine: 79918, blocker: null },
  { number: 9, title: 'Scope revalidation.', phase: 2, sourceLine: 79919, blocker: null },
  {
    number: 10,
    title: 'Qualification revalidation.',
    phase: 2,
    sourceLine: 79920,
    blocker: null,
  },
  {
    number: 11,
    title: 'Application compatibility.',
    phase: 3,
    sourceLine: 79924,
    blocker: 'OFF-BLK-06',
  },
  { number: 12, title: 'Package compatibility.', phase: 3, sourceLine: 79925, blocker: null },
  {
    number: 13,
    title: 'Local database integrity.',
    phase: 3,
    sourceLine: 79926,
    blocker: 'OFF-BLK-04',
  },
  { number: 14, title: 'Queue integrity.', phase: 3, sourceLine: 79927, blocker: 'OFF-BLK-22' },
  {
    number: 15,
    title: 'Exchange of synchronization manifests.',
    phase: 4,
    sourceLine: 79931,
    blocker: null,
  },
  { number: 16, title: 'Checksums.', phase: 4, sourceLine: 79932, blocker: null },
  { number: 17, title: 'Idempotency.', phase: 4, sourceLine: 79933, blocker: null },
  { number: 18, title: 'Deduplication.', phase: 4, sourceLine: 79934, blocker: null },
  {
    number: 19,
    title: 'Event sequence validation.',
    phase: 4,
    sourceLine: 79935,
    blocker: null,
  },
  {
    number: 20,
    title: 'Causal dependency validation.',
    phase: 4,
    sourceLine: 79936,
    blocker: null,
  },
  {
    number: 21,
    title: 'Transfer pass one — the command manifest is read and the stop class is applied.',
    phase: 5,
    sourceLine: 79940,
    blocker: null,
  },
  {
    number: 22,
    title:
      'Transfer pass two, then pass three — the captures upload, then the enabling classes are applied.',
    phase: 5,
    sourceLine: 79941,
    blocker: null,
  },
  { number: 23, title: 'Conflict detection.', phase: 6, sourceLine: 79947, blocker: null },
  {
    number: 24,
    title: 'Object-specific resolution.',
    phase: 6,
    sourceLine: 79948,
    blocker: null,
  },
  {
    number: 25,
    title: 'Invalid-record quarantine.',
    phase: 6,
    sourceLine: 79949,
    blocker: null,
  },
  {
    number: 26,
    title: 'Expired command cancellation.',
    phase: 6,
    sourceLine: 79950,
    blocker: null,
  },
  {
    number: 27,
    title: 'Stale artificial-intelligence-request cancellation.',
    phase: 6,
    sourceLine: 79951,
    blocker: null,
  },
  {
    number: 28,
    title: 'Workflow and version revalidation.',
    phase: 7,
    sourceLine: 79955,
    blocker: null,
  },
  {
    number: 29,
    title: 'Human review where context changed.',
    phase: 7,
    sourceLine: 79956,
    blocker: null,
  },
  {
    number: 30,
    title: 'Artificial-intelligence analysis rerun where still eligible.',
    phase: 7,
    sourceLine: 79957,
    blocker: null,
  },
  { number: 31, title: 'Dashboard recomputation.', phase: 7, sourceLine: 79958, blocker: null },
  { number: 32, title: 'Summary recomputation.', phase: 7, sourceLine: 79959, blocker: null },
  { number: 33, title: 'Notification generation.', phase: 7, sourceLine: 79960, blocker: null },
  {
    number: 34,
    title: 'Acknowledgement propagation.',
    phase: 8,
    sourceLine: 79964,
    blocker: null,
  },
  {
    number: 35,
    title: 'Five-surface convergence validation.',
    phase: 8,
    sourceLine: 79965,
    blocker: null,
  },
  { number: 36, title: 'Audit completion.', phase: 8, sourceLine: 79966, blocker: null },
  {
    number: 37,
    title: 'Worker-facing confirmation.',
    phase: 8,
    sourceLine: 79967,
    blocker: null,
  },
] as const satisfies readonly ProtocolStep[]

/**
 * One phase heading.
 *
 * `declaredRange` is the parenthesised range in the heading, VERBATIM — note
 * that phase 5's reads "21 and 22" while the other seven read "N to M", which
 * is why it is a string rather than a numeric pair. `declaredSteps` is that
 * range read out. `steps` is what the enumeration actually puts under the
 * heading.
 *
 * FOR SEVEN PHASES THE TWO AGREE. For phase 8 they do not, and that is the
 * count contradiction — see `PHASE_EIGHT_STEP_COUNT_CONTRADICTION`. The two
 * fields are kept separate rather than reconciled so the disagreement is data
 * the machine can be asked about instead of a comment.
 */
export interface ProtocolPhaseRow {
  readonly phase: ProtocolPhaseNumber
  readonly title: string
  readonly headingLine: number
  readonly declaredRange: string
  readonly declaredSteps: readonly number[]
  readonly steps: readonly number[]
}

export const PROTOCOL_PHASES = [
  {
    phase: 1,
    title: 'Connection and identity proof',
    headingLine: 79906,
    declaredRange: '1 to 7',
    declaredSteps: [1, 2, 3, 4, 5, 6, 7],
    steps: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    phase: 2,
    title: 'Authority revalidation',
    headingLine: 79916,
    declaredRange: '8 to 10',
    declaredSteps: [8, 9, 10],
    steps: [8, 9, 10],
  },
  {
    phase: 3,
    title: 'Local integrity and compatibility',
    headingLine: 79922,
    declaredRange: '11 to 14',
    declaredSteps: [11, 12, 13, 14],
    steps: [11, 12, 13, 14],
  },
  {
    phase: 4,
    title: 'Manifest exchange and transfer guards',
    headingLine: 79929,
    declaredRange: '15 to 20',
    declaredSteps: [15, 16, 17, 18, 19, 20],
    steps: [15, 16, 17, 18, 19, 20],
  },
  {
    phase: 5,
    title: 'The three-pass transfer',
    headingLine: 79938,
    declaredRange: '21 and 22',
    declaredSteps: [21, 22],
    steps: [21, 22],
  },
  {
    phase: 6,
    title: 'Disagreement, invalidity and staleness',
    headingLine: 79945,
    declaredRange: '23 to 27',
    declaredSteps: [23, 24, 25, 26, 27],
    steps: [23, 24, 25, 26, 27],
  },
  {
    phase: 7,
    title: 'Revalidation and recomputation',
    headingLine: 79953,
    declaredRange: '28 to 33',
    declaredSteps: [28, 29, 30, 31, 32, 33],
    steps: [28, 29, 30, 31, 32, 33],
  },
  {
    phase: 8,
    title: 'Convergence and audit',
    headingLine: 79962,
    declaredRange: '34 to 36',
    declaredSteps: [34, 35, 36],
    steps: [34, 35, 36, 37],
  },
] as const satisfies readonly ProtocolPhaseRow[]

/**
 * THE PHASE-8 COUNT CONTRADICTION, CARRIED AND NOT RESOLVED.
 *
 * The heading at L79962 declares phase 8 as "steps 34 to 36" and step 37 is
 * enumerated under it at L79967. The source states the reconciliation itself
 * at L79904 — "Step 37, the worker-facing confirmation, closes phase eight
 * rather than opening a ninth" — and then contradicts its own heading by
 * leaving the heading at 36.
 *
 * A THIRD WITNESS, and it is the reason this is recorded rather than treated
 * as a typo. The step-to-obligation traceability table at L80001-L80012 has
 * TEN rows, not eight, and it splits step 37 out from 34-36 exactly as the
 * heading does: L80011 is "34 to 36 | Convergence and audit" and L80012 is a
 * separate row, "37 | Worker confirmation". So the source separates 37 from
 * phase 8 in two places and folds it in at one.
 *
 * NOTHING IS RENUMBERED. Both readings agree on every step number and on the
 * total of thirty-seven; they disagree only on whether phase 8 has three
 * members or four. Renumbering to make a heading true would move a step
 * number that three other modules in this slice cite.
 */
export interface PhaseCountContradiction {
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly adopted: string
}

export const PHASE_EIGHT_STEP_COUNT_CONTRADICTION: PhaseCountContradiction = {
  question:
    'Does phase 8 hold three steps or four? The heading says three; the enumeration puts four under it.',
  readings: [
    {
      text: 'Reading A — three. The phase heading reads "Phase 8 — Convergence and audit (steps 34 to 36)."',
      locator: 'L79962',
    },
    {
      text: 'Reading A, corroborated. The step-to-obligation traceability table gives "34 to 36" as one row and "37" as a separate row, so it too keeps step 37 outside the convergence-and-audit group.',
      locator: 'L80011 and L80012',
    },
    {
      text: 'Reading B — four. "Step 37, the worker-facing confirmation, closes phase eight rather than opening a ninth."',
      locator: 'L79904',
    },
    {
      text: 'Reading B, corroborated by position. Step 37 is enumerated under the phase 8 heading with no intervening heading, at the line immediately after step 36.',
      locator: 'L79967',
    },
  ],
  adopted:
    'Neither is chosen and no step is renumbered. `PROTOCOL_PHASES` carries the heading’s range on `declaredSteps` and the enumeration’s membership on `steps`, and for phase 8 alone the two differ. Both totals agree that there are thirty-seven steps and eight phases; the disagreement is confined to which phase step 37 belongs to, and it changes no step number.',
}

/**
 * THE THREE SOURCE CLASSIFICATIONS, ALL ON ONE LINE.
 *
 * L80042 is the Source status bullet of the `FB-SYNC-01` fallback contract,
 * and it classifies three different things separately in one sentence. Each
 * is carried with what it governs, because they do not govern the same thing
 * and a build that flattened them would be claiming the enumeration is a
 * `SoW Fact`.
 *
 * A LOCATOR CORRECTED. The dispatching brief attributed this line to
 * `AC-36-101`. It is not: `AC-36-101` is a row of the acceptance-criteria
 * table at L80048 and states the invariant, while L80042 is the Source status
 * bullet six lines above it and states the classifications. The two claims
 * are real and both are cited here, at the lines that carry them.
 */
export interface ProtocolSourceClassification {
  /** What is being classified. */
  readonly governs: string
  /** The source's own classification token for it. */
  readonly classification: string
  readonly locator: string
}

export const PROTOCOL_SOURCE_CLASSIFICATIONS = [
  {
    governs:
      'The reconnection obligations themselves — that authority is proven before data moves, that nothing is destroyed, that the worker is told the truth.',
    classification: 'SoW Fact',
    locator: 'L80042',
  },
  {
    governs:
      'The thirty-seven-step enumeration — that there are thirty-seven of them and that they run in this order.',
    classification: 'User-Mandated Product Extension',
    locator: 'L80042',
  },
  {
    governs:
      'The ordering of the three transfer passes inside steps 21 and 22 — stop class, then captures, then enabling classes.',
    classification: 'Derived Clarification — adopted working position',
    locator: 'L80042',
  },
] as const satisfies readonly ProtocolSourceClassification[]

/**
 * `AC-36-101`, at L80048: "Steps 1 to 14 complete before any manifest is
 * exchanged, in every reconnection."
 *
 * This is the invariant the machine turns on. Step 15 is the manifest
 * exchange — L79931, "Exchange of synchronization manifests" — and it is the
 * FIRST step at which anything leaves or enters the device. Everything before
 * it is proof: identity and device in phase 1, authority in phase 2,
 * integrity in phase 3. L79993 restates the point in the diagram commentary,
 * "authority proof and integrity proof run before any manifest is exchanged,
 * so a de-authorised device never gets as far as offering its data".
 */
export const MANIFEST_EXCHANGE_STEP = 15

/** The criterion verbatim, from the row at L80048. */
export const AC_36_101_CRITERION =
  'Steps 1 to 14 complete before any manifest is exchanged, in every reconnection.'

/**
 * Step 21 reads the command manifest and applies the stop class. Step 22
 * uploads the captures and then applies the enabling classes.
 *
 * THESE TWO CONSTANTS ARE WHY THIS FILE IS A SPINE. A register that
 * attributes a defect found IN A CAPTURE to step 21 is attributing it to a
 * step at which no capture has been uploaded: L79940 has the stop class
 * applied "before any capture leaves the device", and L79941 is where pass
 * two "drains the durable queue in full". Anything reasoning about when a
 * capture became inspectable reads `CAPTURE_UPLOAD_STEP`, not 21.
 */
export const COMMAND_MANIFEST_READ_STEP = 21
export const CAPTURE_UPLOAD_STEP = 22

/**
 * The three transfer passes, bound to the steps that run them.
 *
 * The ORDER AND THE PHASE VOCABULARY ARE NOT RE-DERIVED HERE. Slice 7 settled
 * both in `@/frontline/commands` — `DEC_SYNC_001_ORDER` is the adopted order
 * and the array's own order is the ordering. This file adds only the one fact
 * that module cannot know, which is which protocol step each pass runs in:
 * pass one is step 21, passes two and three are step 22. L79938 heads the
 * phase "The three-pass transfer (steps 21 and 22)".
 *
 * Derived from `DEC_SYNC_001_ORDER` rather than restated, so a change to the
 * adopted order there cannot leave a second spelling of it here.
 */
export interface TransferPass {
  readonly pass: 1 | 2 | 3
  readonly reconnectionPhase: ReconnectionPhase
  readonly step: number
  readonly locator: string
}

export const TRANSFER_PASSES: readonly TransferPass[] = DEC_SYNC_001_ORDER.map((row, i) => ({
  pass: (i + 1) as 1 | 2 | 3,
  reconnectionPhase: row.phase,
  step: i === 0 ? COMMAND_MANIFEST_READ_STEP : CAPTURE_UPLOAD_STEP,
  locator: i === 0 ? 'L79940' : 'L79941',
}))

/**
 * The two outcome states the source's own triggers distinguish. See the file
 * header: L80020 names per-step outcome codes without enumerating them, and
 * L80026/L80027 state the entry and exit triggers in terms of success and
 * non-success. Two members, because two is what the source supports.
 */
export type StepOutcome = 'success' | 'non-success'

export function step(number: number): ProtocolStep {
  const found = PROTOCOL_STEPS.find((s) => s.number === number)
  if (found === undefined) {
    throw new RangeError(`no protocol step ${number}; the protocol has 37, numbered 1 to 37`)
  }
  return found
}

export function stepsInPhase(phase: ProtocolPhaseNumber): readonly ProtocolStep[] {
  return PROTOCOL_STEPS.filter((s) => s.phase === phase)
}

/**
 * `AC-36-101` (L80048) against an OBSERVED execution order.
 *
 * Takes the step numbers in the order they were actually run and answers
 * whether every one of steps 1 to 14 completed before the manifest exchange
 * at step 15. A run that never reaches step 15 has not violated the criterion
 * — the criterion constrains what may precede a manifest exchange, not
 * whether one happens — so it holds vacuously, and that is deliberate: the
 * fallback contract's terminal safe state (L80025) is a device that never got
 * that far and is still correct.
 */
export function satisfiesAc36101(executionOrder: readonly number[]): boolean {
  const manifestAt = executionOrder.indexOf(MANIFEST_EXCHANGE_STEP)
  if (manifestAt === -1) return true
  const before = executionOrder.slice(0, manifestAt)
  for (let n = 1; n <= 14; n += 1) {
    if (!before.includes(n)) return false
  }
  return true
}

/**
 * `AC-36-102` (L80049) against the same observed order: step 7, the
 * suspension and wipe status check, evaluates before steps 21 and 22. Carried
 * beside `AC-36-101` because it is the second ordering invariant on this
 * machine and it is the one that keeps a suspended device from uploading
 * under a stale authority.
 */
export function satisfiesAc36102(executionOrder: readonly number[]): boolean {
  const sevenAt = executionOrder.indexOf(7)
  for (const transferStep of [COMMAND_MANIFEST_READ_STEP, CAPTURE_UPLOAD_STEP]) {
    const at = executionOrder.indexOf(transferStep)
    if (at === -1) continue
    if (sevenAt === -1 || sevenAt > at) return false
  }
  return true
}

/**
 * L80027, the exit trigger of `FB-SYNC-01`: "A successful full pass of steps
 * 1 to 37". All thirty-seven, in order, every one successful.
 */
export function isSuccessfulFullPass(outcomes: readonly StepOutcome[]): boolean {
  return outcomes.length === PROTOCOL_STEPS.length && outcomes.every((o) => o === 'success')
}

/**
 * L80026, the entry trigger: "Any step returning a non-success outcome". The
 * step number is what the first fallback needs — L80022, "Resume from the
 * durable queue at the failed step" — so this returns the step rather than a
 * boolean. `null` means no step failed.
 *
 * `outcomes` is positional against `PROTOCOL_STEPS`, so index 0 is step 1.
 */
export function firstNonSuccessStep(outcomes: readonly StepOutcome[]): ProtocolStep | null {
  const i = outcomes.findIndex((o) => o !== 'success')
  return i === -1 ? null : step(i + 1)
}

/* ==================================================================== *
 * `DEC-SYNC-001`, DISCLOSED LOCALLY.
 *
 * WHY LOCALLY. `@/disclosure/decisions` holds twenty-nine records and its
 * `DecisionId` union does not contain `DEC-SYNC-001` — every one of the
 * twenty-nine was raised while `SURF-STU` was built. That file is another
 * task's path and one later task lifts the Frontline and offline decisions
 * all at once. `Stu14LocalDisclosure` set the idiom and slice 7 followed it:
 * disclose in the canon's own shape, import `DecisionReading` rather than
 * redeclaring it, declare the gap on `canonNote`, and never file a decision
 * under a neighbouring identifier.
 *
 * THE STAND-IN IS BUILT TO EXPIRE. The covering suite reads the canon's
 * exported `DecisionId` union out of the file and asserts this identifier is
 * ABSENT from it. The moment it is lifted, this module's suite goes red and
 * forces the switch.
 *
 * WHAT IS NOT RE-DERIVED. The adopted order and the five command classes are
 * `@/frontline/commands`'s, settled in slice 7 and read here rather than
 * respelt. What this record adds is the disclosure the ordering owes: the
 * source's own disagreement, both readings, and the label `APP-012` requires.
 * ==================================================================== */

export type ProtocolDecisionRef = 'DEC-SYNC-001'

export interface ProtocolLocalDisclosure {
  readonly decisionRef: ProtocolDecisionRef
  readonly question: string
  /** The canon's own reading shape, imported. Two fields, and neither is `answer`. */
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why this module is a place the decision has to be disclosed. */
  readonly whyHere: string
  /** Why it is disclosed locally rather than through the shared canon. */
  readonly canonNote: string
}

const CANON_NOTE =
  'The shared decision canon at @/disclosure/decisions carries no record keyed to this identifier — ' +
  'its DecisionId union has twenty-nine members and this is not one of them — and that file is ' +
  'another task’s path. Disclosed here in the canon’s own shape so it can be absorbed without a ' +
  'rewrite, and declared as a gap rather than filed under a neighbouring identifier.'

export const PROTOCOL_DISCLOSURES = [
  {
    decisionRef: 'DEC-SYNC-001',
    question:
      'On reconnection, does the device upload its pending captures before pulling pending commands, or after? The Statement of Work describes both directions of the exchange and never fixes their relative order.',
    readings: [
      {
        text: 'The ambiguity, stated by the source itself: §7.10.2 has captures flowing up and control actions flowing down whenever the device has connectivity, which is a statement of concurrency rather than of precedence, and §7.10.3 and §7.21 item E3 defer payload design and ordering semantics to the Functional Specification. "There is therefore no ordering requirement in the source, and the deferral is explicit rather than accidental."',
        locator: 'L80069',
      },
      {
        text: 'Interpretation A — commands first. The argument is safety and authority: a suspension, a compliance stop, a de-authorisation, a wipe order or a lot release must land before the device does anything else, because the cache-validity rule exists to stop a suspended worker continuing on a dark tablet.',
        locator: 'L80070 · SoW Fact — §8.13.1',
      },
      {
        text: 'Interpretation B — captures first. The argument is data integrity and the platform’s own sync-then-wipe rule: remote wipe is preceded by a final sync attempt of pending captures precisely because de-authorising a worker or a device must never silently destroy unsynced work.',
        locator: 'L80071 · SoW Fact — §7.11, §8.13.3',
      },
      {
        text: 'Why neither reading is subordinate: "The source contains one sentence supporting each… Neither sentence is subordinate to the other in the text."',
        locator: 'L80072',
      },
      {
        text: 'The adopted position, Option C, split by urgency — pull the command manifest and apply the stop class, then upload the full durable queue to acknowledgement, then apply the enabling class. Its stated cost: "it is more complex than either simple ordering, it requires the five command classes to be classified as stop class or enabling class in the payload contract, and it adds a state to the device in which authority is known but not yet fully applied."',
        locator: 'L80073',
      },
      {
        text: 'Ratification is still outstanding, and the source says what happens if it goes the other way: "If the client rules the other way and requires a single global ordering, either evidence is delayed behind a command drain or a suspended tenant keeps producing work for one more cycle, and §36.1’s three transfer passes revert to a single exchange in the decided direction."',
        locator: 'L80075',
      },
    ],
    adopted:
      'Option C is adopted, and this build implements it — a client-delegated choice under APP-012, not a position the source settled. The order itself is @/frontline/commands’s DEC_SYNC_001_ORDER, settled in slice 7 and read here rather than respelt; TRANSFER_PASSES binds it to the steps that run it, pass one at step 21 and passes two and three at step 22. The source records the adoption as `Derived Clarification — adopted working position`, adopted at Option C on 2026-08-14 (L80067), and both source readings stay on the record above. Ratification remains with the client’s platform leadership and must be recorded before the Frontline Functional Specification closes item E3 (L80075).',
    whyHere:
      'Steps 21 and 22 ARE the adopted ordering. L79904 says the pair "were once a deliberate exception, presented as an unordered pair. They are no longer." A step machine that ordered 21 before 22 without disclosing why would be presenting an adopted working position as the protocol’s natural shape, which is the exact substitution APP-012 exists to prevent.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly ProtocolLocalDisclosure[]
