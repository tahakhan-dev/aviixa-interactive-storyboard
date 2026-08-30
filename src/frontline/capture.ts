/**
 * THE CAPTURE STATE LADDER AS A CLOSED VOCABULARY, AND THE NINE-FIELD
 * RUNTIME ENVELOPE. Frozen source §22.6.1.
 *
 * TWO STATEMENTS OF THE SAME LADDER, AND THEY AGREE. The numbered workflow
 * at L39584-L39592 names the states in prose; the state diagram at
 * L39596-L39619 draws them. Both give thirteen. `CAPTURE_STATES` below is
 * counted off the diagram and `CAPTURE_LADDER` off the prose, and the two
 * are held equal by `tests/unit/fl-capture.test.ts` rather than by one
 * having been copied from the other.
 *
 * THERE IS NO "SYNCED" AND THERE IS NO BARE SUCCESS. L39622: "there is no
 * single state called 'synced'. A capture that is *uploaded* has not been
 * *accepted*; a capture that is *accepted* has not yet been *reflected in
 * summaries*." `AC-FL-006-3` (L39636) forbids any surface in the platform
 * rendering a capture as "synced" without naming its actual state, and
 * `TEST-SCR-FL-003` (L48700) says the label must be one of the ladder's own
 * and "never a bare success".
 *
 * THAT RULE IS HELD BY THE TYPE, NOT BY A GUARD. `CaptureState` has no
 * `synced` member and no success member, so a screen cannot render one:
 * `captureStateLabel` is a TOTAL `Record` over the union, so there is no
 * fallback branch a fourteenth string could arrive through, and no default
 * that would print something plausible for a state nobody defined.
 */

/**
 * The thirteen. Diagram order (L39598-L39619), which is also the order the
 * numbered workflow walks.
 */
export type CaptureState =
  | 'committed-locally'
  | 'queued'
  | 'uploading'
  | 'upload-interrupted'
  | 'uploaded'
  | 'server-received'
  | 'validated'
  | 'accepted'
  | 'quarantined'
  | 'rejected'
  | 'officially-recorded'
  | 'reflected-in-summaries'
  | 'reconciled'

export const CAPTURE_STATES = [
  'committed-locally',
  'queued',
  'uploading',
  'upload-interrupted',
  'uploaded',
  'server-received',
  'validated',
  'accepted',
  'quarantined',
  'rejected',
  'officially-recorded',
  'reflected-in-summaries',
  'reconciled',
] as const satisfies readonly CaptureState[]

// Same widening hazard and same fix as `PERMISSION_OUTCOMES`: a fourteenth
// member added to the union and not to the array fails to compile here.
type MissingFromCaptureStates = Exclude<CaptureState, (typeof CAPTURE_STATES)[number]>
const _captureStatesExhaustive: MissingFromCaptureStates extends never ? true : never = true
void _captureStatesExhaustive

/**
 * What a screen prints. TOTAL, so every state has a label and no state can
 * fall through to a plausible-looking default. The wording is the source's
 * own — the diagram's node descriptions where it gives one (L39599, L39601,
 * L39603, L39605, L39609), the workflow's wording otherwise.
 */
export const CAPTURE_STATE_LABEL: Readonly<Record<CaptureState, string>> = {
  'committed-locally': 'Committed locally on the device',
  queued: 'Queued in the durable upload queue',
  uploading: 'Uploading to the server',
  'upload-interrupted': 'Upload interrupted and resumable',
  uploaded: 'Uploaded',
  'server-received': 'Server received and acknowledged',
  validated: 'Validated',
  accepted: 'Accepted',
  quarantined: 'Quarantined',
  rejected: 'Rejected',
  'officially-recorded': 'Officially recorded',
  'reflected-in-summaries': 'Reflected in summaries',
  reconciled: 'Reconciled',
}

/**
 * The ladder as the numbered workflow at L39584-L39592 states it, in the
 * order it states it. Independent transcription from the diagram above; the
 * suite asserts the two sets are equal.
 */
export const CAPTURE_LADDER = [
  { state: 'committed-locally', step: 4, sourceRef: 'L39584' },
  { state: 'queued', step: 5, sourceRef: 'L39585' },
  { state: 'uploading', step: 6, sourceRef: 'L39586' },
  { state: 'upload-interrupted', step: 7, sourceRef: 'L39587' },
  { state: 'uploaded', step: 8, sourceRef: 'L39588' },
  { state: 'server-received', step: 8, sourceRef: 'L39588' },
  { state: 'validated', step: 9, sourceRef: 'L39589' },
  { state: 'accepted', step: 9, sourceRef: 'L39589' },
  { state: 'quarantined', step: 9, sourceRef: 'L39589' },
  { state: 'rejected', step: 9, sourceRef: 'L39589' },
  { state: 'officially-recorded', step: 10, sourceRef: 'L39590' },
  { state: 'reflected-in-summaries', step: 11, sourceRef: 'L39591' },
  { state: 'reconciled', step: 12, sourceRef: 'L39592' },
] as const satisfies readonly {
  readonly state: CaptureState
  readonly step: number
  readonly sourceRef: string
}[]

/**
 * THE FIFTEEN EDGES THE DIAGRAM DRAWS, and only those. The other one
 * hundred and fifty-four ordered pairs — including all thirteen
 * self-transitions — are refused by `captureTransition`. Same discipline as
 * `studioPostureTransition` in `@/studio/state/connectivity`: a transition
 * the source does not draw is not "unspecified, therefore allowed".
 *
 * The resumable edge back from `upload-interrupted` to `uploading` is
 * load-bearing and the source says why (L39622): it "is what makes a
 * mid-sync connection drop a delay rather than a loss".
 */
export const CAPTURE_TRANSITIONS = [
  { from: 'committed-locally', to: 'queued' },
  { from: 'queued', to: 'uploading' },
  { from: 'uploading', to: 'upload-interrupted' },
  { from: 'upload-interrupted', to: 'uploading' },
  { from: 'uploading', to: 'uploaded' },
  { from: 'uploaded', to: 'server-received' },
  { from: 'server-received', to: 'validated' },
  { from: 'validated', to: 'accepted' },
  { from: 'validated', to: 'quarantined' },
  { from: 'validated', to: 'rejected' },
  { from: 'accepted', to: 'officially-recorded' },
  { from: 'officially-recorded', to: 'reflected-in-summaries' },
  { from: 'reflected-in-summaries', to: 'reconciled' },
  { from: 'quarantined', to: 'reconciled' },
  { from: 'rejected', to: 'reconciled' },
] as const satisfies readonly {
  readonly from: CaptureState
  readonly to: CaptureState
}[]

/** A typed refusal, never an exception: an undrawn edge is an expected path. */
export type CaptureTransitionRuling =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string }

export function captureTransition(
  from: CaptureState,
  to: CaptureState,
  register: readonly { readonly from: CaptureState; readonly to: CaptureState }[] = CAPTURE_TRANSITIONS,
): CaptureTransitionRuling {
  if (register.some((t) => t.from === from && t.to === to)) return { allowed: true }
  return {
    allowed: false,
    reason:
      `${CAPTURE_STATE_LABEL[from]} to ${CAPTURE_STATE_LABEL[to]} is not an edge the capture ` +
      'state ladder draws (frozen source L39598-L39619).',
  }
}

/**
 * The states in which the capture is still on the device and the platform
 * holds no record of it. `STATE-09` (L48669) is what a screen shows for one
 * of these: "A capture is never shown as recorded by the platform while it
 * sits on the device."
 */
export const HELD_ON_DEVICE_STATES = [
  'committed-locally',
  'queued',
  'uploading',
  'upload-interrupted',
] as const satisfies readonly CaptureState[]

export function platformHoldsTheRecord(state: CaptureState): boolean {
  return !(HELD_ON_DEVICE_STATES as readonly CaptureState[]).includes(state)
}

/* ==================================================================== *
 * THE COMPLETE RUNTIME ENVELOPE — NINE FIELDS.
 *
 * Table at header L39563, separator L39564, data L39565-L39573. Nine rows,
 * counted.
 *
 * `AC-FL-006-1` (L39634): "Every capture event carries all nine envelope
 * elements, with unresolved provenance recorded as an explicit unresolved
 * marker rather than an empty value."
 *
 * THE MARKER RULE IS THE TYPE, NOT A VALIDATION. FIVE of the nine fields
 * carry "Cannot occur" in the source's own fourth column — the step
 * definition, the Job and Run identifiers, the worker identity, the device
 * identity, and the deterministic result on a screen carrying limits — so
 * those five are required and non-nullable. There is no absent case to
 * represent and a field that could be `null` would invite one. The other
 * FOUR are the ones the source says can be absent: the unit or lot binding,
 * named-location provenance, the server-receipt time, and evidence
 * references. Each of those four is a UNION WITH A MARKER carrying a
 * required note, reason or state, so `null`, `undefined` and `''` are
 * untypeable in all nine positions and "an empty value" is not a thing this
 * envelope can hold.
 *
 * FIVE AND FOUR, COUNTED. The first version of this comment said six and
 * three, which is the shape of miscount this build keeps finding: a category
 * boundary read once and not re-derived. `tests/unit/fl-capture.test.ts`
 * counts the fourth column rather than trusting this sentence.
 * ==================================================================== */

/**
 * Named-location provenance, resolved or not. L39570: "Recorded as
 * unresolved with a plain note; never blocks the capture." The note is
 * REQUIRED — an unresolved marker with nothing to say is the empty value the
 * criterion forbids, wearing a different name.
 */
export type NamedLocationProvenance =
  | {
      readonly resolved: true
      readonly site: string
      readonly area: string
      readonly cell: string
    }
  | {
      readonly resolved: false
      /** The plain note L39570 requires. Never blank. */
      readonly note: string
    }

/**
 * L39567: "Absent by design where unit mode is none; recorded as absent,
 * never fabricated." Absence is a MEMBER, so it is recorded rather than
 * inferred from a missing field.
 */
export type UnitOrLotBinding =
  | { readonly kind: 'unit'; readonly id: string }
  | { readonly kind: 'lot'; readonly id: string }
  | { readonly kind: 'absent-by-design'; readonly reason: string }

/**
 * L39571: "Server-receipt time is absent until receipt and is written on
 * arrival; the record shows the capture as not yet server received." The
 * "not yet" is a member and carries the ladder state that says so, so a
 * screen cannot render an absent receipt time as a blank.
 */
export type ServerReceiptTime =
  | { readonly received: true; readonly at: string }
  | {
      readonly received: false
      readonly heldAt: Extract<
        CaptureState,
        'committed-locally' | 'queued' | 'uploading' | 'upload-interrupted'
      >
    }

/**
 * L39572: "Cannot occur for a screen carrying limits; screens with no limits
 * carry no result field rather than a null one." So the field is absent from
 * the type on a no-limits screen rather than present and null — which is why
 * this is a union of the envelope itself and not a nullable member.
 */
export interface DeterministicResult {
  readonly inSpecification: boolean
  /** The severity band, where one was classified. */
  readonly severityBand: number | null
}

interface RuntimeEnvelopeBase {
  /** L39565. Cannot occur unresolved: a Run cannot start without a pinned package. */
  readonly stepDefinition: {
    readonly workflowId: string
    readonly pinnedVersion: string
    readonly stepId: string
  }
  /** L39566. Cannot occur unresolved: a capture exists only inside a Run context. */
  readonly jobId: string
  readonly runId: string
  /** L39567. */
  readonly unitOrLot: UnitOrLotBinding
  /**
   * L39568. The authenticated identity, plus the authorising identity where
   * a second-identity step-up applied. `AC-FL-006-4` (L39637) binds the
   * authorising identity "to that specific authorisation and to nothing
   * else", which is why it sits beside the authorisation it authorised.
   */
  readonly workerIdentity: string
  readonly authorisingIdentity: {
    readonly identity: string
    readonly authorisationId: string
  } | null
  /** L39569. Cannot occur unresolved: the application runs only on an enrolled device. */
  readonly deviceIdentity: string
  /** L39570. */
  readonly namedLocation: NamedLocationProvenance
  /** L39571. Device time preserves the floor's own account. */
  readonly deviceTime: string
  readonly serverReceiptTime: ServerReceiptTime
  /**
   * L39573. "Absent where the screen required no evidence; where evidence
   * was required, the capture cannot commit." An empty array IS the absent
   * case and is honest; a capture missing required evidence never reaches
   * this type, because it never commits.
   */
  readonly evidenceRefs: readonly string[]
}

/** A screen carrying limits: the result field is present and required. */
export interface RuntimeEnvelopeWithLimits extends RuntimeEnvelopeBase {
  readonly screenCarriesLimits: true
  readonly deterministicResult: DeterministicResult
}

/** A screen with no limits: the field is ABSENT, never a null one (L39572). */
export interface RuntimeEnvelopeWithoutLimits extends RuntimeEnvelopeBase {
  readonly screenCarriesLimits: false
  readonly deterministicResult?: never
}

export type RuntimeEnvelope = RuntimeEnvelopeWithLimits | RuntimeEnvelopeWithoutLimits

/**
 * The nine rows of the field table, as the source writes them. This is what
 * `SB-FL-006` (L39624) expands into on screen — "Expanding it lists the
 * envelope fields in plain language" — so the fourth column is carried
 * verbatim rather than summarised.
 */
export interface EnvelopeFieldRow {
  readonly field: string
  readonly content: string
  readonly whyPresent: string
  /** The table's fourth column, verbatim. Never paraphrased. */
  readonly whenUnresolved: string
  readonly sourceRef: string
}

export const ENVELOPE_FIELDS = [
  {
    field: 'Step-definition reference',
    content: 'The Workflow, its pinned version, and the step',
    whyPresent:
      'Ties the record to the exact authored content in force, which is the audit receipt for which limits applied',
    whenUnresolved:
      'Cannot occur: a Run cannot start without a pinned package. The Run is presented as not-yet-ready instead.',
    sourceRef: 'L39565',
  },
  {
    field: 'Job and Run identifiers',
    content: 'The work the capture belongs to',
    whyPresent: 'Roll-up, metering, and summary computation depend on it',
    whenUnresolved: 'Cannot occur: a capture exists only inside a Run context.',
    sourceRef: 'L39566',
  },
  {
    field: 'Unit or Lot identifier where one applies',
    content:
      'The serial for serialized work, the lot for lot work, absent for unit mode none',
    whyPresent: 'Gives a Severity 1 hold a real thing to hold',
    whenUnresolved:
      'Absent by design where unit mode is none; recorded as absent, never fabricated.',
    sourceRef: 'L39567',
  },
  {
    field: 'Worker identity',
    content:
      'The authenticated identity, plus the authorising identity where a second-identity step-up applied, captured against that specific authorisation',
    whyPresent:
      'Attribution, qualification enforcement, and Worker-Shift metering',
    whenUnresolved:
      'Cannot occur: no capture is possible without an authenticated session.',
    sourceRef: 'L39568',
  },
  {
    field: 'Device identity',
    content: 'The enrolled device',
    whyPresent: 'Fleet telemetry, security investigation, and provenance',
    whenUnresolved: 'Cannot occur: the application runs only on an enrolled device.',
    sourceRef: 'L39569',
  },
  {
    field: 'Named-location provenance',
    content:
      'Site, line, and cell, resolved from station and assignment context; never a coordinate',
    whyPresent:
      'Honest record of where the work happened, without a tracking reading',
    whenUnresolved:
      'Recorded as unresolved with a plain note; never blocks the capture.',
    sourceRef: 'L39570',
  },
  {
    field: 'Both timestamps',
    content: 'Device time and server-receipt time',
    whyPresent:
      "Server receipt is authoritative for ordering; device time preserves the floor's own account",
    whenUnresolved:
      'Server-receipt time is absent until receipt and is written on arrival; the record shows the capture as not yet server received.',
    sourceRef: 'L39571',
  },
  {
    field: 'Deterministic result',
    content:
      'In or out of specification, and the severity band where one was classified',
    whyPresent: "The device's classification is the act of record; the server mirrors it",
    whenUnresolved:
      'Cannot occur for a screen carrying limits; screens with no limits carry no result field rather than a null one.',
    sourceRef: 'L39572',
  },
  {
    field: 'Evidence references',
    content: 'Pointers to captured media and other evidence objects',
    whyPresent: 'Binds evidence into the chain without embedding it in the event',
    whenUnresolved:
      'Absent where the screen required no evidence; where evidence was required, the capture cannot commit.',
    sourceRef: 'L39573',
  },
] as const satisfies readonly EnvelopeFieldRow[]

/**
 * The unresolved-marker rule as a sentence a screen prints, so the reason
 * travels with the marker instead of being re-invented per screen.
 * `AC-FL-006-1` (L39634) forbids the alternative.
 */
export function unresolvedProvenanceLine(p: NamedLocationProvenance): string | null {
  if (p.resolved) return null
  return `Where this happened was not resolved: ${p.note} The capture was recorded anyway; provenance never blocks a capture.`
}

/**
 * The sentence a sync indicator prints for one capture. There is no branch
 * that could produce "Synced" — the label comes from the total record above
 * and the second clause is derived from the ladder position, not chosen.
 */
export function captureStateLine(state: CaptureState): string {
  return platformHoldsTheRecord(state)
    ? `${CAPTURE_STATE_LABEL[state]}.`
    : `${CAPTURE_STATE_LABEL[state]}. The platform does not hold this record yet.`
}
