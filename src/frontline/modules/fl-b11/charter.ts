/**
 * `MOD-FL-B11` — Worker Lifecycle on Device. THE IDENTITY CARD, TRANSCRIBED.
 *
 * Frozen source §22.20, which opens at L41929. The identity card proper is
 * L41935-L41943, on the alternating text/blank-line rhythm the chapter uses
 * throughout, which is why the odd lines are cited and the even ones are not.
 * The rest of the card runs to L42062 and each field carries its own line.
 *
 * WHAT "TRANSCRIBED" MEANS HERE, EXACTLY — the discipline `fl-a5` settled and
 * `fl-a6` restated. Each statement's `text` is the card field's own prose with
 * the inline `[SoW Fact — §x.y]` classification marker lifted out into
 * `sourceClass`, and nothing else altered.
 *
 * ── THE CLAIM THIS MODULE IS MOST ABLE TO SHIP ─────────────────────────
 *
 * `worker-finished`, `submitted`, `complete` and `finished` ARE FOUR DIFFERENT
 * STATES and this module owns the two acts that end a worker's involvement —
 * step-away and hand-back — plus the two the source places elsewhere,
 * cancellation and terminal completion. A panel that lets a worker "complete"
 * anything, or that labels a departure "Run complete", tells the worker the
 * platform holds a record it does not hold. `B11_FOUR_RUN_STATES` below is that
 * rule as data rather than as a comment, so it renders.
 *
 * ── WHAT THIS SURFACE OWNS AND WHAT IT ONLY RECEIVES ───────────────────
 *
 * The card's own Owning-surface line (L41941) draws the boundary twice in one
 * sentence: substitution is INITIATED in the Delivery Operations Hub and
 * DELIVERED via the command channel, and cancellation and terminal completion
 * are governance actions OWNED in the Delivery Operations Hub. Four of this
 * module's ten matrix rows are on the far side of that line.
 */

/** How the source classifies the claim, in the source's own vocabulary. */
export type B11SourceClass = 'SoW Fact'

export interface B11CardStatement {
  /** The card field's own label, verbatim. */
  readonly field: string
  readonly text: string
  readonly sourceRef: string
  /**
   * The field's own inline `[SoW Fact — §x.y]` marker, lifted out.
   *
   * `null` WHERE THE CARD CARRIES NO MARKER, and that is a recorded absence
   * rather than a default. Fifteen of the twenty-two fields carry no
   * classification marker of their own, and §22.20's Source status paragraph
   * (L42091) does not name every one of them either. Filling those fifteen
   * with `SoW Fact` because their neighbours carry it would be this build
   * inventing a classification the source withheld. The unit suite counts the
   * markers off the cited lines rather than trusting this sentence.
   */
  readonly sourceClass: B11SourceClass | null
}

/**
 * TWENTY-TWO CARD FIELDS. Five of them — Identifier, Purpose, User benefit,
 * Owning surface, Roles that see and use it — are the identity card proper at
 * L41935-L41943. The other seventeen are the rest of §22.20's card.
 *
 * THE STATES FIELD (L41968) IS NOT ONE OF THE TWENTY-TWO. It is a list of six
 * identifiers rather than prose, and it is carried in `B11_STATES` below with
 * the one gloss the source gives and the five it withholds.
 */
export const B11_CARD = [
  {
    field: 'Identifier and name',
    text: 'MOD-FL-B11. Name. Worker Lifecycle on Device.',
    sourceRef: 'MOD-FL-B11 · L41935',
    sourceClass: 'SoW Fact',
  },
  {
    field: 'Purpose',
    text:
      'To cover the states a worker moves through on the device that are not simply running a Run: ' +
      'pause, step-away and hand-back, substitution handover, at-step certification-expiry ' +
      'enforcement, and honoured suspension states.',
    sourceRef: 'L41937',
    sourceClass: 'SoW Fact',
  },
  {
    field: 'User benefit',
    text:
      'A worker can leave the station without losing work or blocking colleagues, a substitute picks ' +
      'up with real context rather than a verbal handover, and the platform’s governance rules behave ' +
      'on the floor exactly as they are written in the Delivery Operations Hub.',
    sourceRef: 'L41939',
    sourceClass: null,
  },
  {
    field: 'Owning surface',
    text:
      'Frontline Worker Application (SURF-FL). Substitution is initiated in the Delivery Operations ' +
      'Hub and delivered via the command channel. Cancellation and terminal completion are Supervisor ' +
      'and Quality Manager governance actions owned in the Delivery Operations Hub.',
    sourceRef: 'L41941',
    sourceClass: 'SoW Fact',
  },
  {
    field: 'Roles that see and use it',
    text:
      'Worker, for pause, step-away, hand-back, and the substitute’s handover state. Supervisor, who ' +
      'initiates substitution and receives step-away flags. Quality Manager, for cancellation of any ' +
      'area’s run.',
    sourceRef: 'L41943',
    sourceClass: null,
  },
  {
    field: 'Preconditions',
    text:
      'An authenticated session; for substitution, a delivered and validated reassignment or ' +
      'substitution command.',
    sourceRef: 'L41960',
    sourceClass: null,
  },
  {
    field: 'Inputs',
    text:
      'Session idle and lock events; worker-initiated step-away and hand-back actions; substitution ' +
      'commands carrying the substitute identity; the structured handover state comprising the last ' +
      'completed step, the open flags, and the current state; certification expiry dates and the ' +
      'tenant’s enforcement posture; suspension state.',
    sourceRef: 'L41962',
    sourceClass: 'SoW Fact',
  },
  {
    field: 'Outputs',
    text:
      'Pause and resume events; step-away and hand-back flags carrying the lighter operational ' +
      'envelope; the rendered handover state; at-step expiry blocks; attribution preserved across ' +
      'substitution.',
    sourceRef: 'L41964',
    sourceClass: null,
  },
  {
    field: 'Objects affected',
    text:
      'OBJ-FL-SESSION; OBJ-FL-STEPAWAY; OBJ-FL-HANDOVER; and by consequence the Worker-Shift metering ' +
      'record.',
    sourceRef: 'OBJ-FL-SESSION · L41966',
    sourceClass: null,
  },
  {
    field: 'Alternate paths',
    text:
      'Step-away or hand-back, either of which raises a flag to the supervisor. A supervisor-initiated ' +
      'substitution, delivered via the command channel, presenting the substitute with the structured ' +
      'handover state. An at-step certification-expiry block under the tenant’s configured posture. A ' +
      'suspension state applied.',
    sourceRef: 'L41977',
    sourceClass: 'SoW Fact',
  },
  {
    field: 'Online behaviour',
    text:
      'Pause, step-away, and hand-back flags upload immediately. Substitution commands arrive within ' +
      'seconds. Expiry evaluation is identical to offline, because it is local.',
    sourceRef: 'L41979',
    sourceClass: null,
  },
  {
    field: 'Offline behaviour',
    text:
      'Pause preserves on-device progress. Step-away and hand-back flags are recorded and queued; the ' +
      'supervisor is not notified until sync, and no surface may imply otherwise. No substitution ' +
      'command can arrive. At-step expiry enforcement operates locally, because expiry dates travel ' +
      'with the cached qualification data.',
    sourceRef: 'L41981',
    sourceClass: 'SoW Fact',
  },
  {
    field: 'Reconnect behaviour',
    text:
      'Queued flags upload and deliver. Pending substitution commands are validated and applied at a ' +
      'safe boundary, presenting the substitute with the structured handover state.',
    sourceRef: 'L41983',
    sourceClass: null,
  },
  {
    field: 'Artificial-intelligence behaviour',
    text:
      'Not applicable — no artificial-intelligence capability decides a pause, a step-away, a ' +
      'substitution, or an expiry block. The Shift Handoff Agent is a reasoning agent that produces a ' +
      'brief for the Client Command Center handoff panel; it produces no device behaviour and does not ' +
      'participate in the structured handover state a substitute sees, which is composed ' +
      'deterministically from the run record.',
    sourceRef: 'L41985',
    sourceClass: 'SoW Fact',
  },
  {
    field: 'No-artificial-intelligence behaviour',
    text:
      'Identical on this surface. The Shift Handoff brief’s absence affects the Client Command Center, ' +
      'not the device.',
    sourceRef: 'L41987',
    sourceClass: null,
  },
  {
    field: 'Dependencies',
    text:
      'MOD-FL-A1 for session lifecycle; MOD-FL-A6 for command delivery and flag upload; MOD-FL-B9 for ' +
      'the enforcement posture that governs expiry blocks; the Delivery Operations Hub for ' +
      'substitution initiation, cancellation, and the governance rules.',
    sourceRef: 'MOD-FL-A1 · L41989',
    sourceClass: null,
  },
  {
    field: 'Interconnections',
    text:
      'Feeds the Worker-Shift metering the platform computes from device attribution, where a ' +
      'substitution means each worker who actually performed work counts one. Feeds the Client Command ' +
      'Center’s alert feed with step-away flags. Consumes reassignment and substitution commands.',
    sourceRef: 'L41991',
    sourceClass: null,
  },
  {
    field: 'Audit',
    text:
      'Pause and resume, step-away, hand-back, substitution application with the substitute identity ' +
      'and the reason the supervisor gave, the handover state presented, at-step expiry blocks, and ' +
      'every attribution boundary are audited. Pre-substitution steps stay attributed to the original ' +
      'worker, and that attribution is immutable.',
    sourceRef: 'L42003',
    sourceClass: null,
  },
  {
    field: 'Security',
    text:
      'A substitute receives the handover state and the forward path, not the previous worker’s ' +
      'session or credentials. Attribution cannot be re-assigned after the fact, which is what makes ' +
      'the Worker-Shift meter and the quality record honest. Step-away flags are supervisor-visible by ' +
      'design, which is a deliberate transparency and is disclosed as such — it is the one place in ' +
      'the module where the support-not-surveillance reading needs stating plainly, and the mitigation ' +
      'is that the flag records an event rather than a judgement.',
    sourceRef: 'L42005',
    sourceClass: null,
  },
  {
    field: 'Fallback identifier',
    text:
      'FB-FL-CMD-01 for substitution delivery; FB-FL-AUTH-01 for session and expiry; FB-FL-GATE-01 for ' +
      'the expiry block; FB-FL-SEC-01 for suspension; FB-FL-UP-01 for flag delivery.',
    sourceRef: 'FB-FL-CMD-01 · L42007',
    sourceClass: null,
  },
  {
    field: 'Recovery and reconciliation',
    text:
      'Recovery from a paused session is re-authentication. Recovery from an undelivered flag is ' +
      'reconnection. Reconciliation is the Delivery Operations Hub’s run record, where a departure ' +
      'closes open step executions as abandoned with the reason recorded, and where the Worker-Shift ' +
      'meter counts each worker who actually performed work.',
    sourceRef: 'L42009',
    sourceClass: null,
  },
  {
    field: 'Failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation',
    text:
      'The failure is a substitution that cannot be delivered while a worker has handed back. The ' +
      'first fallback is that the Run remains with the original worker’s assignment and their ' +
      'committed captures stay safe. The fallback failure is that the worker is unavailable and the ' +
      'device is offline, in which case nothing changes on the device and the Run simply does not ' +
      'progress. The terminal safe state is an unprogressed Run with complete prior captures, which ' +
      'the Supervisor resolves from the Delivery Operations Hub by cancellation with a categorised ' +
      'reason, partial data preserved and excluded from the summary, or by an end-time extension that ' +
      'is supervisor-authorised, reason-required, capped at shift end plus a tenant-set maximum, and ' +
      'audited.',
    sourceRef: 'L42062',
    sourceClass: null,
  },
] as const satisfies readonly B11CardStatement[]

/* ==================================================================== *
 * THE STATES FIELD.
 *
 * L41968 lists six and glosses exactly one — `STATE-B11-PAUSED`, "at the
 * worker-session level only". The other five are named and left bare. `gloss`
 * is `null` for those five and the panel says so in plain words rather than
 * inventing five descriptions that would read as transcription.
 *
 * THE ONE GLOSS IS THE MODULE'S CENTRAL RULE AND IT IS NOT DECORATION. A pause
 * at the worker-session level only is what makes `AC-B11-1` (L42068) true:
 * pausing one worker's session never changes the Run's state for any other
 * worker. The source withheld five glosses and supplied the one that carries
 * the rule.
 * ==================================================================== */

export interface B11State {
  readonly id: string
  /** The state's own gloss at L41968, verbatim. `null` where the source gives none. */
  readonly gloss: string | null
  /** Whether THIS build can be driven into the state from the panel. */
  readonly drivenHere: boolean
  readonly sourceRef: string
}

export const B11_STATES = [
  { id: 'STATE-B11-ACTIVE', gloss: null, drivenHere: true, sourceRef: 'STATE-B11-ACTIVE · L41968' },
  {
    id: 'STATE-B11-PAUSED',
    gloss: 'at the worker-session level only',
    drivenHere: true,
    sourceRef: 'STATE-B11-PAUSED · L41968',
  },
  {
    id: 'STATE-B11-STEPPEDAWAY',
    gloss: null,
    drivenHere: true,
    sourceRef: 'STATE-B11-STEPPEDAWAY · L41968',
  },
  {
    id: 'STATE-B11-HANDEDBACK',
    gloss: null,
    drivenHere: true,
    sourceRef: 'STATE-B11-HANDEDBACK · L41968',
  },
  {
    id: 'STATE-B11-SUBSTITUTED',
    gloss: null,
    drivenHere: true,
    sourceRef: 'STATE-B11-SUBSTITUTED · L41968',
  },
  {
    id: 'STATE-B11-EXPIRYBLOCKED',
    gloss: null,
    drivenHere: false,
    sourceRef: 'STATE-B11-EXPIRYBLOCKED · L41968',
  },
] as const satisfies readonly B11State[]

/** Derived, never listed twice. */
export const B11_STATES_ONLY_STATED: readonly B11State[] = B11_STATES.filter((s) => !s.drivenHere)

/* ==================================================================== *
 * THE FOUR RUN STATES, WHICH ARE FOUR AND NOT ONE.
 *
 * This is the claim this module is most able to ship, so it is held as a TOTAL
 * record over the four rather than as a sentence in a comment. Each carries
 * who reaches it, and every one of the four says on its face that this panel
 * does not label anything with it.
 *
 * `worker-finished` is the ONLY one of the four the device produces, and it is
 * a DECLARATION rather than a completion — L42056 says so in the source's own
 * words about this module's own diagram: "The only exit is worker-finished,
 * which is a declaration and not a cancellation."
 * ==================================================================== */

export interface B11RunState {
  readonly state: string
  /** What actually happens, in the source's words. */
  readonly what: string
  /** Who reaches it. Never this panel. */
  readonly reachedBy: 'the worker, on this device' | 'the platform run record' | 'the Delivery Operations Hub'
  /**
   * Always `false`. Typed as the literal so no branch can label a control on
   * this panel with one of the three the device does not produce, and so the
   * one it does produce is not dressed up as a completion.
   */
  readonly labelledOnThisPanel: false
  readonly sourceRef: string
}

export const B11_FOUR_RUN_STATES = [
  {
    state: 'worker-finished',
    what:
      'The worker declares their part finished. It is a declaration and not a cancellation, and it is ' +
      'the only exit from Active in this module’s own state diagram.',
    reachedBy: 'the worker, on this device',
    labelledOnThisPanel: false,
    sourceRef: 'L39045, L40545 (STATE-A3-WORKERFINISHED), L42056',
  },
  {
    state: 'submitted',
    what:
      'The declaration stands the Run as submitted on the platform run lifecycle. The platform states ' +
      'submitted, complete, and finished are run-record states, not player states.',
    reachedBy: 'the platform run record',
    labelledOnThisPanel: false,
    sourceRef: 'L39045, L40559, L40545',
  },
  {
    state: 'complete',
    what:
      'Captures and evidence upload on a durable resumable queue; when the server has received and ' +
      'acknowledged all of them the Run moves to complete.',
    reachedBy: 'the platform run record',
    labelledOnThisPanel: false,
    sourceRef: 'L39046, L40560',
  },
  {
    state: 'finished',
    what:
      'The Delivery Operations Hub finishes the record automatically after the tenant’s record-finish ' +
      'window, default 48 hours.',
    reachedBy: 'the Delivery Operations Hub',
    labelledOnThisPanel: false,
    sourceRef: 'L39047',
  },
] as const satisfies readonly B11RunState[]

/* ==================================================================== *
 * THE CLAIMS THIS MODULE MUST NEVER MAKE, HELD AS DATA SO THEY RENDER.
 * ==================================================================== */

export interface B11NeverClaimed {
  readonly claim: string
  readonly instead: string
  readonly sourceRef: string
}

export const B11_CLAIMS_NEVER_MADE = [
  {
    claim: 'That a worker finished, completed, or cancelled a Run.',
    instead:
      'Four different states, and this device reaches one of them. A worker declares worker-finished; ' +
      'the platform stands the Run submitted on that declaration, moves it to complete when the ' +
      'server has received and acknowledged every capture, and the Delivery Operations Hub finishes ' +
      'the record after the tenant’s record-finish window. Cancellation and terminal completion are ' +
      'not on this device at all, and no interface here permits either.',
    sourceRef: 'AC-B11-3 · L42070',
  },
  {
    claim: 'That the supervisor knows a worker stepped away or handed back.',
    instead:
      'Step-away and hand-back flags are recorded and queued while the device is offline; the ' +
      'supervisor is not notified until sync, and no surface may imply otherwise. The flag on this ' +
      'panel says which of the two it is on its face.',
    sourceRef: 'L41981, TEST-B11-6 · L42085',
  },
  {
    claim: 'That one worker pausing has stopped the Run.',
    instead:
      'Pause is a per-worker, session-level idle — a device lock, a log-out, or a timeout — that ' +
      'preserves on-device progress and does not pause the Run, because other workers may still be ' +
      'active on the same Run. There is no state in which the Run itself stops because of something ' +
      'one worker did.',
    sourceRef: 'AC-B11-1 · L42068, L42056',
  },
  {
    claim: 'That a substitute inherits the previous worker’s identity or their steps.',
    instead:
      'A substitute receives the handover state and the forward path, not the previous worker’s ' +
      'session or credentials. Pre-substitution steps stay attributed to the original worker, that ' +
      'attribution is immutable, and it cannot be re-attributed on any surface.',
    sourceRef: 'AC-B11-5 · L42072, L42005',
  },
] as const satisfies readonly B11NeverClaimed[]

/* ==================================================================== *
 * THE STORYBOARD, AND THE SUPERVISOR-VISIBILITY DISCLOSURE.
 * ==================================================================== */

export const SB_FL_020 = {
  id: 'SB-FL-020',
  heading: 'a substitution',
  frame1:
    'Maya taps "Hand back this run" and confirms; a small line reads "Your supervisor will be told ' +
    'when this tablet reconnects."',
  frame2:
    'on Sam’s Client Command Center, the flag appears after reconnection and he substitutes Ahmed ' +
    'with a reason.',
  frame3:
    'Ahmed logs in on TAB-014 and opens the Run; the player shows a handover panel headed "Picking up ' +
    'from Maya", listing the last completed step, the open flags, and the current state, with one ' +
    'control reading "Continue".',
  frame4: 'Ahmed’s first capture is attributed to Ahmed; every prior capture still reads Maya.',
  sourceRef: 'SB-FL-020 · L42058',
} as const

/**
 * THE ONE THING THE CARD ASKS TO BE SAID PLAINLY, so it is said on screen
 * rather than obeyed silently. The Security field (L42005) does not merely
 * permit this disclosure; it requires it — "which is a deliberate transparency
 * and is disclosed as such — it is the one place in the module where the
 * support-not-surveillance reading needs stating plainly".
 */
export const B11_SUPERVISOR_VISIBILITY = {
  what: 'Step-away flags are supervisor-visible by design',
  why: 'which is a deliberate transparency and is disclosed as such',
  mitigation: 'the mitigation is that the flag records an event rather than a judgement',
  sourceRef: 'L42005',
} as const
