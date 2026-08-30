/**
 * QUARANTINE, DEAD-LETTER AND STALE CANCELLATION — §36.5, frozen source
 * L80367 onwards.
 *
 * A quarantine record is NOT a failed write, and the whole module turns on
 * that distinction. A failed write leaves nothing behind; a quarantine record
 * is a kept thing — retained in full, excluded from every computed figure,
 * and handed to a NAMED ROLE rather than to a service. L80405 says what it
 * carries: "its arrival session identifier, and its detecting step number".
 *
 * ── THE REGISTER ───────────────────────────────────────────────────────────
 * Header L80387, separator L80388, ten data rows L80389-L80398. Four columns:
 * Reason, Detected at step, Owner of the resolution, Status. Transcribed
 * HEADER-KEYED, cell by cell; `cells` is a total `Record`, so a blank cell is
 * untypeable.
 *
 * THE FOURTH COLUMN IS NOT A LIFECYCLE STATUS. `Status` here holds the
 * source-classification of the row — `Derived Clarification`, or a split
 * citation where part of the row is `SoW Fact`. Reading it as a workflow state
 * would invent ten states the source never names. The lifecycle states are
 * `QUARANTINE_TERMINAL_STATES`, and they come from the diagram, not this
 * column.
 *
 * ── THE FINDING THIS MODULE CARRIES ────────────────────────────────────────
 * One row of the ten attributes its detection to a step that cannot have seen
 * its subject yet.
 *
 * L80394 — "Envelope incompleteness, for example a missing worker identity" —
 * gives its detecting step as 21. Step 21 is L79940: "Transfer pass one — the
 * command manifest is read and the stop class is applied." That pass reads the
 * SERVER's command manifest; no capture has left the device. The envelope the
 * row is about arrives one step later, at L79941: "Transfer pass two, then
 * pass three — the captures upload, then the enabling classes are applied." —
 * and that step's own enumeration of the runtime envelope is where the row's
 * example field lives, "the worker identity plus any authorising second
 * identity".
 *
 * So a quarantine timeline built from the register alone shows the fault at
 * step 21 and the record that caused it arriving at step 22: the detection
 * precedes its own evidence.
 *
 * IT IS NOT A TYPO IN ONE CELL. The diagram at L80417 states the same set —
 * "Validation returns non acceptance at step 16, 17, 18, 20, 21, 24, 28 or 32"
 * — so 21 is asserted twice, consistently. NOTHING HERE CORRECTS IT. The
 * register ships as the source states it and `ENVELOPE_STEP_ANACHRONISM`
 * records both readings with both locators, which is the standing rule for a
 * source that disagrees with itself.
 *
 * A SECOND, SMALLER GAP, MEASURED WHILE PROVING THE FIRST. The ten rows use
 * nine distinct detecting steps — 4, 16, 17, 18, 20, 21, 24, 28, 32. The
 * diagram's list above names eight of them: step 4 is absent from it, though
 * L80393's unresolvable-tenant-binding row is detected there. Recorded as
 * `STEPS_ABSENT_FROM_THE_DIAGRAM` rather than tidied.
 *
 * ── WHERE THE STEP NUMBERS COME FROM ───────────────────────────────────────
 * The two the finding turns on are IMPORTED from task 6's step model, which
 * landed while this was being written and had reached the same reading
 * independently. The three that model does not name as constants are cited
 * directly off the frozen source. `PROTOCOL_STEPS_CITED_DIRECTLY` is the whole
 * set either way, and every line in it is opened by the suite.
 *
 * ── WHY NO `RuntimeEnvelope` IMPORT ────────────────────────────────────────
 * `@/frontline/capture` exports `RuntimeEnvelope`, and it is the wrong type
 * here. Its `workerIdentity` is a required `string`, so the record L80394 is
 * ABOUT — one whose worker identity is missing — cannot be expressed in it. A
 * quarantined record is by definition one that failed validation, so the
 * validated shape can never describe it. The retained payload is held opaque
 * and is never read by this module.
 */
import { CAPTURE_UPLOAD_STEP, COMMAND_MANIFEST_READ_STEP } from '@/offline/protocol'
import type { CommandState } from '@/surfaces/sa/command-state'

/* ── the register ──────────────────────────────────────────────────────── */

/** The four columns of L80387, in the source's own order. */
export const QUARANTINE_COLUMNS = [
  'Reason',
  'Detected at step',
  'Owner of the resolution',
  'Status',
] as const

export type QuarantineColumn = (typeof QUARANTINE_COLUMNS)[number]

/**
 * THE SOURCE NAMES NO IDENTIFIER FOR THESE TEN ROWS, so these keys are this
 * build's, in the source's row order, and are never presented as the source's.
 * They are deliberately not written in the document's `XXX-NN` identifier
 * shape: a minted `QUAR-01` beside a line number reads as a frozen-source
 * anchor to `tests/coverage/locator-fidelity.test.ts` and to every human after
 * it, and there is no such identifier in the source to anchor to.
 */
export type QuarantineReasonId =
  | 'checksum-mismatch'
  | 'duplicate-identifier'
  | 'missing-causal-parent'
  | 'unresolvable-run-identifier'
  | 'unresolvable-tenant-binding'
  | 'envelope-incompleteness'
  | 'contradictory-unit-or-lot-binding'
  | 'evidence-integrity-failure'
  | 'unknown-workflow-version'
  | 'record-for-a-finished-run'

export interface QuarantineRegisterRow {
  readonly id: QuarantineReasonId
  /** The frozen-source line this row is transcribed from. */
  readonly line: number
  /** Total over the four columns: a blank cell cannot be written. */
  readonly cells: Readonly<Record<QuarantineColumn, string>>
  /**
   * The `Detected at step` cell parsed to numbers. DERIVED from the cell, not
   * transcribed a second time — L80390's cell reads `17 and 18`, so this is a
   * list rather than a number, and a second hand-written copy is one more
   * thing that can disagree with the source.
   */
  readonly detectedAtSteps: readonly number[]
}

const row = (
  id: QuarantineReasonId,
  line: number,
  cells: Readonly<Record<QuarantineColumn, string>>,
): QuarantineRegisterRow => ({
  id,
  line,
  cells,
  detectedAtSteps: [...cells['Detected at step'].matchAll(/\d+/g)].map((m) => Number(m[0])),
})

export const QUARANTINE_REGISTER = [
  row('checksum-mismatch', 80389, {
    Reason: 'Checksum mismatch on a transferred object',
    'Detected at step': '16',
    'Owner of the resolution': 'Client platform team, as a transport or storage fault',
    Status: '`Derived Clarification`',
  }),
  row('duplicate-identifier', 80390, {
    Reason: 'Duplicate identifier with a differing payload',
    'Detected at step': '17 and 18',
    'Owner of the resolution':
      'Client platform team, then Quality Manager if the payloads differ materially',
    Status: '`Derived Clarification`',
  }),
  row('missing-causal-parent', 80391, {
    Reason: 'Missing causal parent after the transfer session closes',
    'Detected at step': '20',
    'Owner of the resolution':
      'Supervisor, because the usual cause is an interrupted run structure',
    Status: '`Derived Clarification`',
  }),
  row('unresolvable-run-identifier', 80392, {
    Reason: 'Unresolvable Run, Job, Unit or Lot identifier',
    'Detected at step': '20',
    'Owner of the resolution': 'Supervisor, then Quality Manager where a Unit or Lot is involved',
    Status: '`Derived Clarification`',
  }),
  row('unresolvable-tenant-binding', 80393, {
    Reason: 'Unresolvable tenant binding',
    'Detected at step': '4',
    'Owner of the resolution': 'Client platform team only; never written into any tenant',
    Status:
      '`SoW Fact — §1.5` for the isolation rule; the quarantine mechanism is `Derived Clarification`',
  }),
  row('envelope-incompleteness', 80394, {
    Reason: 'Envelope incompleteness, for example a missing worker identity',
    'Detected at step': '21',
    'Owner of the resolution':
      'Supervisor, because attribution is never approximate [SoW Fact — §7.2.1]',
    Status: '`Derived Clarification`',
  }),
  row('contradictory-unit-or-lot-binding', 80395, {
    Reason: 'Contradictory unit or lot binding',
    'Detected at step': '24',
    'Owner of the resolution': 'Quality Manager, per the authority table of §36.3',
    Status: '`Derived Clarification`',
  }),
  row('evidence-integrity-failure', 80396, {
    Reason: 'Evidence object failing its integrity check',
    'Detected at step': '16',
    'Owner of the resolution':
      'Client platform team, with the Quality Manager informed because a proof is missing',
    Status: '`Derived Clarification`',
  }),
  row('unknown-workflow-version', 80397, {
    Reason: 'Record referencing a workflow version that does not exist',
    'Detected at step': '28',
    'Owner of the resolution': 'Client platform team and the Studio Release Authority',
    Status: '`Derived Clarification`',
  }),
  row('record-for-a-finished-run', 80398, {
    Reason: 'Record arriving for a run already finished, outside the window',
    'Detected at step': '32',
    'Owner of the resolution':
      'Quality Manager, under the audited-recompute rule [SoW Fact — §2.4, §6.2.5]',
    Status: '`SoW Fact` for the recompute rule; quarantine routing is `Derived Clarification`',
  }),
] as const satisfies readonly QuarantineRegisterRow[]

export function quarantineReason(id: QuarantineReasonId): QuarantineRegisterRow {
  const found = QUARANTINE_REGISTER.find((r) => r.id === id)
  // A `QuarantineReasonId` that is not in the register is a build defect, not
  // a runtime condition, so this throws rather than widening the return type
  // and pushing a null check onto every caller.
  if (found === undefined) throw new Error(`no quarantine register row for ${id}`)
  return found
}

/* ── the anachronism, recorded and not corrected ───────────────────────── */

export interface StepAnachronism {
  readonly reason: QuarantineReasonId
  /** What the register says, shipped unchanged. */
  readonly registerSaysStep: number
  readonly registerLocator: string
  /** Where the record the row is about actually arrives. */
  readonly subjectArrivesAtStep: number
  readonly subjectLocator: string
  /** The corroborating second statement of the same step number. */
  readonly restatedAt: string
  readonly statement: string
  /**
   * Literal `false`, and it is the point: this build does NOT silently move
   * the row to 22. A consumer that wants the corrected number has to read this
   * record and decide, which is the disclosure the standing rule requires.
   */
  readonly corrected: false
}

export const ENVELOPE_STEP_ANACHRONISM: StepAnachronism = {
  reason: 'envelope-incompleteness',
  /**
   * A LITERAL, DELIBERATELY, where `subjectArrivesAtStep` is imported. This is
   * what the register's own cell says, not what step 21 is; the finding is
   * that the two coincide when they should not, and sourcing both from one
   * constant would erase the thing being recorded.
   */
  registerSaysStep: 21,
  registerLocator: 'AVIIXA_Production_Product_Blueprint.md L80394',
  subjectArrivesAtStep: CAPTURE_UPLOAD_STEP,
  subjectLocator: 'AVIIXA_Production_Product_Blueprint.md L79941',
  restatedAt: 'AVIIXA_Production_Product_Blueprint.md L80417',
  statement:
    'The register detects envelope incompleteness at step 21, the stop-class command manifest read, which carries no capture. The envelope it names arrives at step 22, when the durable queue drains. The detection therefore precedes its own evidence by one step.',
  corrected: false,
}

/**
 * The nine distinct detecting steps of the ten rows, minus the eight the
 * diagram at L80417 lists. Step 4 is the difference: L80393 is detected there
 * and the diagram's non-acceptance list does not name it.
 */
export const STEPS_ABSENT_FROM_THE_DIAGRAM = [4] as const satisfies readonly number[]

/**
 * THE STEP LEDGER. Every step number this module needs, with the frozen-source
 * line it was read off and what that line says. Nothing else in this file
 * carries a step number.
 *
 * THE TWO THE FINDING TURNS ON ARE IMPORTED, NOT SPELLED AGAIN. Task 6's
 * `@/offline/protocol` was not on disk when this module was first written —
 * `src/offline/` held `capability.ts` and `modes.ts` and nothing else — so
 * both numbers were read straight off the frozen source, per the brief's
 * instruction to cite the source and say so. It landed during the wave,
 * carrying `COMMAND_MANIFEST_READ_STEP` and `CAPTURE_UPLOAD_STEP` and having
 * reached the same reading independently, so they are taken from there now: 21
 * and 22 disagreeing between two modules is the one disagreement this finding
 * could not survive. The other three steps are not constants in that module
 * and stay cited directly.
 *
 * A step number with no line beside it is an unfalsifiable claim, so every
 * entry keeps its line and the words that line holds either way.
 * `tests/unit/offline-quarantine.test.ts` opens all five at test time, which is
 * what makes a wrong number a red suite rather than a plausible constant.
 */
export interface CitedStep {
  readonly step: number
  /** Frozen-source line the step is defined at. */
  readonly line: number
  /** Words that line really carries, checked at test time. */
  readonly what: string
}

export type CitedStepKey =
  | 'stop-class command manifest read'
  | 'captures upload'
  | 'revalidation on release'
  | 'expired command'
  | 'stale intelligence request'

export const PROTOCOL_STEPS_CITED_DIRECTLY: Readonly<Record<CitedStepKey, CitedStep>> = {
  'stop-class command manifest read': {
    step: COMMAND_MANIFEST_READ_STEP,
    line: 79940,
    what: 'the command manifest is read and the stop class is applied',
  },
  'captures upload': {
    step: CAPTURE_UPLOAD_STEP,
    line: 79941,
    what: 'the captures upload',
  },
  'revalidation on release': {
    step: 19,
    line: 80410,
    what: 're-runs validation from step 19 onward',
  },
  'expired command': {
    step: 26,
    line: 80400,
    what: 'Step 26 cancels expired commands',
  },
  'stale intelligence request': {
    step: 27,
    line: 80400,
    what: 'step 27 cancels stale artificial-intelligence requests',
  },
}

/**
 * Lines this module asserts something about that is not a step. Same reason as
 * the ledger above: a locator no test opens is decoration.
 */
export const QUARANTINE_LOCATORS = {
  /** The register header, `Reason | Detected at step | Owner | Status`. */
  registerHeader: 80387,
  /** The audit entry commits in the same transaction as the quarantine write. */
  auditGate: 80406,
  /** The diagram naming the two terminal states. */
  terminalStates: 80433,
  /** Where a record goes when the quarantine write cannot happen. */
  refusalDisposition: 80451,
} as const

/* ── the record and its terminal states ────────────────────────────────── */

/**
 * L80433 — "two distinct terminal states — permanent quarantine and dead
 * letter" — and both end in retention. Release is an EXIT, not a terminal
 * state: it re-enters the acceptance path, L80410, "re-runs validation from
 * step 19 onward".
 */
export const QUARANTINE_TERMINAL_STATES = ['permanent quarantine', 'dead letter'] as const

export type QuarantineTerminalState = (typeof QUARANTINE_TERMINAL_STATES)[number]

export interface QuarantineClosure {
  readonly state: QuarantineTerminalState
  /** Mandatory. L80435 gives the disposition control "a mandatory note". */
  readonly note: string
}

export interface QuarantineRecord {
  readonly reason: QuarantineReasonId
  /** Taken from the register row, never passed in: the register owns it. */
  readonly detectedAtSteps: readonly number[]
  /** The named ROLE, verbatim from the row. Never a service. */
  readonly owner: string
  readonly arrivalSession: string
  /**
   * The retained record, held opaque. See the module comment: the validated
   * envelope type cannot describe a record that failed validation.
   */
  readonly retained: unknown
  readonly closure: QuarantineClosure | null
}

/**
 * The audit entry GATES the quarantine write, not the other way around —
 * L80406, and `AC-36-501` (L80476) through `AC-36-506` (L80481) turn on it,
 * `AC-36-505` (L80480) exactly. Where the audit entry cannot commit there is
 * no quarantine record at all and the record is NOT discarded: L80451, "it
 * stays queued on the device, which is the safest place for it".
 *
 * That refusal is why this returns a union rather than throwing or returning
 * `null`. A caller cannot reach the record without discriminating, so the
 * data-loss path cannot be skipped by a caller that forgot it exists.
 */
export type QuarantineWrite =
  | { readonly written: true; readonly record: QuarantineRecord }
  | { readonly written: false; readonly disposition: 'stays queued on the device' }

export function openQuarantine(input: {
  readonly reason: QuarantineReasonId
  readonly arrivalSession: string
  readonly retained: unknown
  /** Did the audit entry commit in the same transaction? */
  readonly auditCommitted: boolean
}): QuarantineWrite {
  if (!input.auditCommitted) return { written: false, disposition: 'stays queued on the device' }
  const registerRow = quarantineReason(input.reason)
  return {
    written: true,
    record: {
      reason: input.reason,
      detectedAtSteps: registerRow.detectedAtSteps,
      owner: registerRow.cells['Owner of the resolution'],
      arrivalSession: input.arrivalSession,
      retained: input.retained,
      closure: null,
    },
  }
}

/**
 * Move a held record to one of the two terminal states. A blank or
 * whitespace-only note is refused, because L80435's disposition control has no
 * unlabelled path and a terminal state recorded without its reason is exactly
 * the silent gap this whole mechanism exists to prevent.
 *
 * There is deliberately NO counterpart that removes a record. Nothing in this
 * module deletes, purges or drops one, for any role including the Tenant Admin
 * and the root account — `AC-36-501` (L80476). The absence is the enforcement.
 */
export function closeQuarantine(
  record: QuarantineRecord,
  state: QuarantineTerminalState,
  note: string,
): QuarantineRecord | null {
  if (note.trim() === '') return null
  return { ...record, closure: { state, note } }
}

/* ── cancellation, the companion mechanism ─────────────────────────────── */

/**
 * L80400 — "Step 26 cancels expired commands and step 27 cancels stale
 * artificial-intelligence requests." — and the same line gives the terminal
 * rule: "Cancelled and superseded are distinct command states; both are
 * audited; neither is a failure."
 *
 * The ordering is the protocol's and is not restated here; this is the record
 * and its terminal states only.
 */
export type CancellationKind = Extract<CitedStepKey, 'expired command' | 'stale intelligence request'>

/**
 * Narrowed from the fifteen already settled in `@/surfaces/sa/command-state`
 * rather than respelled. `Extract` keeps the link: if `CommandState` ever
 * loses either member this stops compiling instead of quietly meaning
 * something else. `failed` and `rejected` are NOT here — L80400, neither of
 * these is a failure.
 */
export type CancellationTerminalState = Extract<CommandState, 'cancelled' | 'superseded'>

export const CANCELLATION_TERMINAL_STATES = [
  'cancelled',
  'superseded',
] as const satisfies readonly CancellationTerminalState[]

/**
 * The two kinds are spelled once, in the step ledger, and read from it here.
 * A second table mapping kind to step would be a second place for 26 and 27 to
 * disagree, which is the commonest defect this build records.
 */
export function cancellationStep(kind: CancellationKind): number {
  return PROTOCOL_STEPS_CITED_DIRECTLY[kind].step
}

export interface CancellationRecord {
  readonly kind: CancellationKind
  readonly atStep: number
  readonly terminalState: CancellationTerminalState
  readonly reason: string
}

export function cancel(
  kind: CancellationKind,
  terminalState: CancellationTerminalState,
  reason: string,
): CancellationRecord {
  return { kind, atStep: cancellationStep(kind), terminalState, reason }
}

/**
 * The retry budget that separates a permanent quarantine from a dead letter is
 * `DEC-SYNC-005` (L80441) and is `TBD — Client Decision Required`. No number is
 * invented here: a budget picked by this build would be indistinguishable from
 * one the source stated. The bound's existence is the part the source does
 * settle — L80382 says an infinite retry loop is prohibited — so `dead letter`
 * is reachable, and only the threshold is open.
 */
export const RETRY_BUDGET_IS_OPEN = 'DEC-SYNC-005'
