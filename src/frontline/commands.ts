/**
 * THE COMMAND CHANNEL — THE DEVICE END. Frozen source §22.6.2.
 *
 * SETTLED HERE ONCE, FOR SLICE 7 AND SLICE 8 BOTH. `src/domain/commands.ts`
 * says it plainly: "the shape of a member never changes once a later slice
 * depends on it." Slice 8 builds the reconnect ladder and convergence over
 * exactly these five classes and exactly this state vocabulary, so this file
 * is written to be EXTENDED (a payload added to a class, a device-side
 * ledger built over `CommandState`) and not REOPENED (a sixth class, a
 * renamed state, a re-ordered drain).
 *
 * THIS IS THE DEVICE END, NOT THE ORIGINATION END. `CC_RELEASE_LOT_HOLD` in
 * `@/domain/commands` is the Client Command Center's act that MAKES a
 * `CMD-FL-LOTREL`; nothing here dispatches anything. The two are deliberately
 * separate: L39670 — "No surface may show a lot as released because a
 * Quality Manager created the release command; the lot is released on a given
 * device when that device has *applied* the command."
 *
 * EXACTLY FIVE, AND THE CLOSURE IS THE TYPE. L39658: "There are exactly five
 * classes." `AC-FL-007-1` (L39719): "The device accepts exactly five command
 * classes and rejects any other class with a typed reason." A sixth class
 * cannot be added to the union without failing the exhaustiveness check
 * below, which is why the wipe and de-authorisation gap further down is
 * recorded as a GAP rather than closed by minting a class the source forbids.
 */

export type FrontlineCommandClass =
  | 'CMD-FL-LOTREL'
  | 'CMD-FL-REASSIGN'
  | 'CMD-FL-CLEAR'
  | 'CMD-FL-SUSPEND'
  | 'CMD-FL-VERSION'

export interface FrontlineCommandClassRow {
  readonly id: FrontlineCommandClass
  /** Column 1, verbatim. */
  readonly name: string
  /** Column 3, verbatim. */
  readonly origin: string
  /** Column 4, verbatim. */
  readonly authority: string
  /** Column 5, verbatim. */
  readonly effectOnDevice: string
  readonly sourceRef: string
}

/** Header L39660, separator L39661, data L39662-L39666. Five rows, counted. */
export const FL_COMMAND_CLASSES = [
  {
    id: 'CMD-FL-LOTREL',
    name: 'Lot release',
    origin: 'Client Command Center',
    authority: 'Quality Manager only, uniformly',
    effectOnDevice: 'Lifts a held lot locally so work on it may resume',
    sourceRef: 'L39662',
  },
  {
    id: 'CMD-FL-REASSIGN',
    name: 'Reassignment or substitution',
    origin: 'Delivery Operations Hub or Client Command Center',
    authority: 'Supervisor and above',
    effectOnDevice:
      "Alters the worker's assigned work; presents structured handover to a substitute",
    sourceRef: 'L39663',
  },
  {
    id: 'CMD-FL-CLEAR',
    name: 'Qualification clearance',
    origin: 'Client Command Center, action 10',
    authority: 'Supervisor and above',
    effectOnDevice:
      'Unparks a run blocked at a qualification gate, for the tenant-set clearance duration',
    sourceRef: 'L39664',
  },
  {
    id: 'CMD-FL-SUSPEND',
    name: 'Suspension',
    origin: 'Delivery Operations Hub or Super Admin platform console',
    authority: 'Tenant lifecycle or platform authority',
    effectOnDevice:
      'Applies soft, hard, or compliance suspension behaviour on the device',
    sourceRef: 'L39665',
  },
  {
    id: 'CMD-FL-VERSION',
    name: 'Version change',
    origin: 'Standards and Operations Studio or platform',
    authority: 'Publication authority, including Lane B auto-published patches',
    effectOnDevice:
      'Makes a new workflow version available at the boundary of the next execution',
    sourceRef: 'L39666',
  },
] as const satisfies readonly FrontlineCommandClassRow[]

type MissingFromClasses = Exclude<
  FrontlineCommandClass,
  (typeof FL_COMMAND_CLASSES)[number]['id']
>
const _classesExhaustive: MissingFromClasses extends never ? true : never = true
void _classesExhaustive

/**
 * `AC-FL-007-1`'s typed rejection. A class the device does not recognise
 * never becomes a `FrontlineCommandClass`; it comes back as a reason.
 */
export type CommandClassRuling =
  | { readonly accepted: true; readonly class: FrontlineCommandClass }
  | { readonly accepted: false; readonly reason: string }

export function admitCommandClass(candidate: string): CommandClassRuling {
  const row = FL_COMMAND_CLASSES.find((c) => c.id === candidate)
  if (row === undefined) {
    return {
      accepted: false,
      reason:
        `"${candidate}" is not one of the five command classes this device accepts. ` +
        'The channel is closed at five (frozen source L39658); an unrecognised class is ' +
        'rejected with this reason and the rejection is acknowledged back to the server.',
    }
  }
  return { accepted: true, class: row.id }
}

/* ==================================================================== *
 * THE STATE VOCABULARY. L39670, one sentence, two halves.
 *
 * "A command is *created*, then *authorized*, then *queued*, then *available
 * for delivery*, then *delivered*, then *downloaded* by the device, then
 * *validated* on the device, then *applied*, then *acknowledged* back to the
 * server. It may instead be *rejected*, *failed*, *expired*, *cancelled*,
 * *superseded*, or *reconciled*."
 *
 * NINE ON THE APPLIED LADDER, SIX ALTERNATIVES. The source calls the second
 * six "instead", never "terminal" — so they are `CommandAlternativeState`
 * here rather than `CommandTerminalState`. The distinction matters because
 * `superseded` is explicitly NOT an end: L39713 has the server reissue, "with
 * the original marked *superseded* rather than silently replaced", and
 * reconciliation runs afterwards over exactly those.
 *
 * "MUST NEVER BE COLLAPSED" is the heading of L39670 and it is why these are
 * fifteen members rather than a `done: boolean`.
 * ==================================================================== */

export type CommandAppliedState =
  | 'created'
  | 'authorized'
  | 'queued'
  | 'available-for-delivery'
  | 'delivered'
  | 'downloaded'
  | 'validated'
  | 'applied'
  | 'acknowledged'

export type CommandAlternativeState =
  | 'rejected'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'superseded'
  | 'reconciled'

export type CommandState = CommandAppliedState | CommandAlternativeState

export const COMMAND_APPLIED_LADDER = [
  'created',
  'authorized',
  'queued',
  'available-for-delivery',
  'delivered',
  'downloaded',
  'validated',
  'applied',
  'acknowledged',
] as const satisfies readonly CommandAppliedState[]

export const COMMAND_ALTERNATIVE_STATES = [
  'rejected',
  'failed',
  'expired',
  'cancelled',
  'superseded',
  'reconciled',
] as const satisfies readonly CommandAlternativeState[]

type MissingFromLadder = Exclude<CommandAppliedState, (typeof COMMAND_APPLIED_LADDER)[number]>
const _ladderExhaustive: MissingFromLadder extends never ? true : never = true
void _ladderExhaustive

type MissingFromAlternatives = Exclude<
  CommandAlternativeState,
  (typeof COMMAND_ALTERNATIVE_STATES)[number]
>
const _alternativesExhaustive: MissingFromAlternatives extends never ? true : never = true
void _alternativesExhaustive

/**
 * Which side of the boundary each ladder state happens on. The device writes
 * only four of the nine, and `AC-FL-007-3` (L39721) turns on that split: "No
 * surface represents a command as effective on a device before that device
 * has acknowledged application."
 */
export const COMMAND_STATE_ACTOR: Readonly<Record<CommandAppliedState, 'server' | 'device'>> = {
  created: 'server',
  authorized: 'server',
  queued: 'server',
  'available-for-delivery': 'server',
  delivered: 'server',
  downloaded: 'device',
  validated: 'device',
  applied: 'device',
  acknowledged: 'device',
}

/**
 * L39670, restated as the one predicate a screen may ask. A lot is not
 * released because someone created a release command.
 */
export function effectiveOnThisDevice(state: CommandState): boolean {
  return state === 'applied' || state === 'acknowledged'
}

/* ==================================================================== *
 * DEC-SYNC-001 — THE RECONNECTION ORDER, OPTION C.
 *
 * L39672 states the adopted position in full: "stop-class commands first —
 * suspension in all three states, device de-authorisation and remote wipe,
 * and any tenant compliance stop — then the full capture upload, then the
 * enabling classes of lot release, reassignment or substitution,
 * qualification clearance and version change." Restated at L48683 and in
 * §22.15. Both source readings — safety-first and integrity-first — stay on
 * the record in the `DEC-SYNC-001` card and are NOT reproduced here as a
 * choice this file makes; `@/disclosure/decisions` is where a reading is
 * disclosed, and there is exactly one of those in this build.
 *
 * THREE PHASES, AND THE ORDER IS THE ARRAY. A caller drains by iterating
 * `DEC_SYNC_001_ORDER`; there is no comparator to get backwards and no
 * priority number to tie.
 * ==================================================================== */

export type ReconnectionPhase = 'stop-class' | 'capture-upload' | 'enabling-class'

export interface ReconnectionPhaseRow {
  readonly phase: ReconnectionPhase
  readonly what: string
  readonly why: string
}

export const DEC_SYNC_001_ORDER = [
  {
    phase: 'stop-class',
    what:
      'Suspension in all three states, device de-authorisation and remote wipe, and any tenant compliance stop.',
    why: 'A suspension must land before the device creates more work.',
  },
  {
    phase: 'capture-upload',
    what: 'The full capture upload, with nothing discarded.',
    why: 'Unsynced evidence is never put at risk by an operation that could wipe or reset local state.',
  },
  {
    phase: 'enabling-class',
    what:
      'Lot release, reassignment or substitution, qualification clearance, and version change.',
    why: 'An enabling command delayed by one queue drain costs nothing and guarantees the evidence is already safe.',
  },
] as const satisfies readonly ReconnectionPhaseRow[]

/**
 * Which phase a command class drains in. TOTAL over the five, so a class
 * cannot drain in a phase nobody assigned it, and `CMD-FL-SUSPEND` is the
 * only one of the five in the stop class.
 */
export const COMMAND_CLASS_PHASE: Readonly<
  Record<FrontlineCommandClass, Extract<ReconnectionPhase, 'stop-class' | 'enabling-class'>>
> = {
  'CMD-FL-SUSPEND': 'stop-class',
  'CMD-FL-LOTREL': 'enabling-class',
  'CMD-FL-REASSIGN': 'enabling-class',
  'CMD-FL-CLEAR': 'enabling-class',
  'CMD-FL-VERSION': 'enabling-class',
}

/**
 * A FINDING, RECORDED RATHER THAN CLOSED, and it is the one thing about this
 * channel that does not line up.
 *
 * `DEC-SYNC-001`'s stop class names four things: suspension in all three
 * states, device de-authorisation, remote wipe, and any tenant compliance
 * stop. Only two of those four map onto a command class — soft/hard
 * suspension and the compliance stop are both `CMD-FL-SUSPEND` (L39665:
 * "Applies soft, hard, or compliance suspension behaviour on the device").
 *
 * DE-AUTHORISATION AND REMOTE WIPE HAVE NO COMMAND CLASS AMONG THE FIVE, and
 * minting a sixth is not available: `AC-FL-007-1` (L39719) has the device
 * accept exactly five and reject anything else with a typed reason. The
 * matrix places the act on the platform side instead — `MOD-FL-A7` row 4
 * (L41300) reads `Client Decision Required` for the Tenant Admin and
 * `Allowed with conditions` for platform roles — and `DEC-WIPE-001` records
 * that the source states neither the pending lifetime nor the never-returns
 * behaviour.
 *
 * So the ordering vocabulary and the class vocabulary are not the same
 * vocabulary, and this build does not pretend they are.
 */
export const STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS = [
  {
    item: 'Device de-authorisation',
    whyNoClass:
      'Named in the stop class at L39672 and in FB-FL-SEC-01 at L40120, but it is not one of the five classes at L39662-L39666, and AC-FL-007-1 (L39719) closes the device at exactly five. No sixth class is minted here.',
    whereTheActLives: 'MOD-FL-A7 row 4, L41300 — a platform critical-class act.',
    openDecision: 'DEC-WIPE-001',
  },
  {
    item: 'Remote data wipe',
    whyNoClass:
      'Same basis. L39672 orders it first on reconnection; the five classes do not carry it, and a wipe additionally requires a final synchronisation an offline device cannot perform.',
    whereTheActLives: 'MOD-FL-A7 row 4, L41300 — a platform critical-class act.',
    openDecision: 'DEC-WIPE-001',
  },
] as const satisfies readonly {
  readonly item: string
  readonly whyNoClass: string
  readonly whereTheActLives: string
  readonly openDecision: string
}[]

/**
 * The drain, as one fold. Slice 8 builds the ladder that CALLS this; the
 * order it calls in is fixed here so that slice extends the mechanism rather
 * than re-deciding it.
 *
 * A command whose class drains in a different phase is not dropped and not
 * re-ordered inside its phase: `AC-FL-007-2` (L39720) — "Commands are
 * applied in the order the server assigned" — so within a phase the caller's
 * own order is preserved.
 */
export function commandsForPhase<T extends { readonly class: FrontlineCommandClass }>(
  commands: readonly T[],
  phase: Extract<ReconnectionPhase, 'stop-class' | 'enabling-class'>,
): readonly T[] {
  return commands.filter((c) => COMMAND_CLASS_PHASE[c.class] === phase)
}
