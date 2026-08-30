import {
  COMMAND_APPLIED_LADDER,
  COMMAND_STATE_ACTOR,
  type CommandAppliedState,
  type CommandState,
  type FrontlineCommandClass,
} from '@/frontline/commands'
import type { Cc13Ordinal } from './action-set'

/**
 * PER-DEVICE COMMAND PROPAGATION — THE ROLL-UP, WHICH IS THE PART THAT DID
 * NOT EXIST.
 *
 * The fifteen command states already exist twice and are already bound to
 * each other: `@/frontline/commands` holds the device-end union and
 * `@/surfaces/sa/command-state` the console's prose spellings, joined by
 * `SA_SPELLING`. Neither is redefined here and neither file is touched. What
 * is missing is the question this surface asks, which is not "what state is
 * this command in" but "what does a hold look like across the devices it must
 * reach".
 *
 * ── THE THREE-TOKEN VOCABULARY IS THE SOURCE'S, AND IT IS CLOSED AT THREE ─
 *
 * L1632: "the source names the hold lifecycle explicitly as **issued, then
 * propagating, then in force per device** `[SoW Fact — §3.3]`."
 * L1641: "The Client Command Center displays the hold honestly as issued,
 * then propagating, then in force per device, and the platform records
 * propagation lag as telemetry."
 * `AC-PROD-054` (L1680): "a hold renders as issued, propagating, or in force
 * per device, never as a single binary state."
 *
 * There is no fourth token, and this file does not mint one. That matters
 * below.
 *
 * ── `in force` MEANS EVERY RELEVANT DEVICE HAS ACKNOWLEDGED ──────────────
 *
 * L2100: "The Command Center shows the hold as in force on two devices out of
 * two only once both have acknowledged."
 * `AC-FL-007-3` (L39721): "No surface represents a command as effective on a
 * device before that device has acknowledged application."
 *
 * WHY THIS IS NOT `effectiveOnThisDevice`. `@/frontline/commands` exports
 * that predicate and it answers `applied || acknowledged`. It is right where
 * it lives: it is the DEVICE's own question, and on the device `applied` is
 * genuinely effective. This is the SURFACE's question, and the surface's only
 * evidence is the acknowledgement coming back — `COMMAND_STATE_ACTOR` marks
 * both `applied` and `acknowledged` as device-side, and a device that applied
 * and has not yet acknowledged is, from here, indistinguishable from one that
 * has not applied. `AC-FL-007-3` binds the surface, so the roll-up counts
 * acknowledgements. A device at `applied` appears in `unconfirmed`.
 *
 * ── AN EMPTY DEVICE SET IS NOT `in force`, AND `every` SAYS IT IS ────────
 *
 * `[].every(...)` is `true`, so the natural spelling of "every relevant
 * device has confirmed" promotes a command that has reached nobody to the
 * strongest state in the vocabulary. The empty case is answered BEFORE either
 * `every` runs, and it answers `issued`: nothing has propagated because there
 * is nothing to propagate to yet.
 *
 * ── `DEC-WIPE-001`: A DEVICE THAT NEVER RETURNS HOLDS THIS AT
 *    `propagating`, FOREVER, AND THAT IS THE CORRECT ANSWER ──────────────
 *
 * L1678 states the terminal safe state and the open point together: "the
 * command remains in a pre-delivery state and is rendered as such on every
 * surface; the platform never renders it as applied ... the Statement of Work
 * does not state how long a command may remain pending, nor what happens if a
 * device never returns, and this is carried as `DEC-WIPE-001` for the wipe
 * case specifically." L2113 repeats it for the device that never returns.
 *
 * So there is NO TIMEOUT in this file. A timeout that promotes on a guess is
 * the defect the rule exists to prevent, and there is no parameter here that
 * one could be passed through. The three-token vocabulary also has no way to
 * SAY "stuck", and inventing a fourth token would be inventing a rendering
 * the source closed at three.
 *
 * What the source offers instead is the per-device list, and it is an
 * obligation rather than a nicety: L4319 — "Per-device honesty with confirmed
 * and unconfirmed devices listed and lag metered platform-side"; L4246 — "the
 * hold as issued, then propagating with a per-device list, then in force";
 * L1668 — "A hold renders with its propagation state and the count of devices
 * on which it is in force." So the roll-up returns both lists, and a stuck
 * device is disclosed by being named in `unconfirmed`, not by a token.
 */

export const CC_PROPAGATION_STATES = ['issued', 'propagating', 'in force'] as const satisfies
  readonly string[]

export type CcPropagationState = (typeof CC_PROPAGATION_STATES)[number]

/** One device's own command state, as the surface last heard it. */
export interface DeviceCommandState {
  readonly deviceId: string
  readonly state: CommandState
}

export interface CcPropagationRollUp {
  readonly state: CcPropagationState
  /** Devices that have acknowledged. Named, never only counted. */
  readonly confirmed: readonly string[]
  /** Every other relevant device, including any at `applied`. */
  readonly unconfirmed: readonly string[]
  /** L1668's count, and its denominator. */
  readonly confirmedCount: number
  readonly deviceCount: number
  /** Why this state and not another, in words a client can read. */
  readonly why: string
}

/**
 * A state the surface has no device-side evidence for. Membership is read off
 * `COMMAND_APPLIED_LADDER` and `COMMAND_STATE_ACTOR` rather than re-listed,
 * so a ladder state that changed sides would change this too. The six
 * alternative states are deliberately NOT server-side-only: a rejection or a
 * failure is a device answer, and an expiry or a supersession is a fact about
 * a command that has already been out.
 */
function serverSideOnly(state: CommandState): boolean {
  const ladder: readonly string[] = COMMAND_APPLIED_LADDER
  if (!ladder.includes(state)) return false
  return COMMAND_STATE_ACTOR[state as CommandAppliedState] === 'server'
}

export function ccPropagationRollUp(
  devices: readonly DeviceCommandState[],
): CcPropagationRollUp {
  const confirmed = devices.filter((d) => d.state === 'acknowledged').map((d) => d.deviceId)
  const unconfirmed = devices.filter((d) => d.state !== 'acknowledged').map((d) => d.deviceId)
  const base = {
    confirmed,
    unconfirmed,
    confirmedCount: confirmed.length,
    deviceCount: devices.length,
  }

  // Answered before either `every` below, because `[].every(...)` is `true`
  // and would report a command that has reached no device as in force.
  if (devices.length === 0) {
    return {
      ...base,
      state: 'issued',
      why: 'Issued. No device is relevant to it yet, so nothing has propagated. An empty device set is never in force.',
    }
  }

  if (unconfirmed.length === 0) {
    return {
      ...base,
      state: 'in force',
      why: `In force on ${confirmed.length} of ${devices.length} devices. Every relevant device has acknowledged application.`,
    }
  }

  if (devices.every((d) => serverSideOnly(d.state))) {
    return {
      ...base,
      state: 'issued',
      why: `Issued. The command exists and no device has yet taken a device-side step; ${devices.length} device${devices.length === 1 ? '' : 's'} remain unconfirmed.`,
    }
  }

  return {
    ...base,
    state: 'propagating',
    why: `Propagating. ${confirmed.length} of ${devices.length} devices have acknowledged; ${unconfirmed.join(', ')} ${unconfirmed.length === 1 ? 'has' : 'have'} not. It is not in force until every one of them does, and a device that never returns holds it here indefinitely — DEC-WIPE-001 leaves the pending horizon unstated and nothing here promotes it on a timer.`,
  }
}

/* ==================================================================== *
 * WHICH OF THE TEN ARE COMMAND-BEARING: EXACTLY THREE, AND THE SOURCE
 * SAYS SO TWICE.
 *
 * L35372: "The command channel carries exactly five classes platform-wide:
 * lot release; reassignment or substitution; qualification clearance;
 * suspension; and version change. Of these the Command Center originates
 * three: lot release (action 4), reassignment or substitution (action 8), and
 * qualification clearance (action 10). Suspension is a tenant-lifecycle act
 * originated on the Delivery Operations Hub or the Super Admin platform
 * console, never here. Version change is originated by the Standards and
 * Operations Studio's publication pipeline, including the Lane B auto-publish
 * path that a Command Center approval sets in motion — the approval is the
 * Command Center's act; the version change command is the pipeline's."
 *
 * L38719 restates it from the module's own Outputs paragraph: "command-channel
 * actions for actions 4, 8 and 10."
 *
 * `AC-CC-409` (L38866) binds exactly these: "Command-bearing actions render
 * command state honestly and never as applied on an unconfirmed device."
 *
 * THE OTHER SEVEN HAVE NO PER-DEVICE STATE AT ALL, and asking for one is a
 * category error rather than a missing feature. The type refuses it:
 * `CommandBearingOrdinal` is a three-member union, so a roll-up cannot be
 * requested for action 7.
 * ==================================================================== */

export type CommandBearingOrdinal = Extract<Cc13Ordinal, 4 | 8 | 10>

export interface CommandBearingAction {
  readonly ordinal: CommandBearingOrdinal
  /** The action, in the authority table's own words. */
  readonly action: string
  /** The class it rides, from the five the channel carries. */
  readonly commandClass: FrontlineCommandClass
  /** The class's own name, verbatim from the channel table. */
  readonly commandClassName: string
  readonly sourceRefs: readonly string[]
}

export const CC_COMMAND_BEARING_ACTIONS = [
  {
    ordinal: 4,
    action: 'Release a lot hold, including automatic Severity 1 holds',
    commandClass: 'CMD-FL-LOTREL',
    commandClassName: 'Lot release',
    sourceRefs: ['L35372', 'L38719', 'L38668', 'L39662'],
  },
  {
    ordinal: 8,
    action: 'Reassign a run mid-shift, for absence or an expired qualification',
    commandClass: 'CMD-FL-REASSIGN',
    commandClassName: 'Reassignment or substitution',
    sourceRefs: ['L35372', 'L38719', 'L38672', 'L39663'],
  },
  {
    ordinal: 10,
    action: 'Grant a qualification clearance',
    commandClass: 'CMD-FL-CLEAR',
    commandClassName: 'Qualification clearance',
    sourceRefs: ['L35372', 'L38719', 'L38674', 'L39664'],
  },
] as const satisfies readonly CommandBearingAction[]

type MissingBearing = Exclude<
  CommandBearingOrdinal,
  (typeof CC_COMMAND_BEARING_ACTIONS)[number]['ordinal']
>
const _bearingExhaustive: MissingBearing extends never ? true : never = true
void _bearingExhaustive

export function isCommandBearing(ordinal: Cc13Ordinal): ordinal is CommandBearingOrdinal {
  return CC_COMMAND_BEARING_ACTIONS.some((a) => a.ordinal === ordinal)
}

/**
 * The two classes the Command Center does NOT originate, with the source's
 * own reason. Carried because "three of five" is only half a fact without
 * them, and because the version-change case is the subtle one: a Command
 * Center approval sets the Lane B auto-publish path in motion, and it would
 * be easy to read that approval as originating the command. L35372 separates
 * them in the same sentence.
 */
export const CC_CLASSES_NOT_ORIGINATED_HERE = [
  {
    commandClass: 'CMD-FL-SUSPEND',
    commandClassName: 'Suspension',
    whyNotHere:
      'A tenant-lifecycle act originated on the Delivery Operations Hub or the Super Admin platform console, never here.',
    sourceRefs: ['L35372', 'L39665'],
  },
  {
    commandClass: 'CMD-FL-VERSION',
    commandClassName: 'Version change',
    whyNotHere:
      "Originated by the Standards and Operations Studio's publication pipeline, including the Lane B auto-publish path that a Command Center approval sets in motion — the approval is the Command Center's act; the version change command is the pipeline's.",
    sourceRefs: ['L35372', 'L39666'],
  },
] as const satisfies readonly {
  readonly commandClass: FrontlineCommandClass
  readonly commandClassName: string
  readonly whyNotHere: string
  readonly sourceRefs: readonly string[]
}[]

/**
 * `AC-CC-408` (L38865): "No action is queued client-side under any
 * connectivity condition." Stated rather than enforced, and the distinction
 * is the same one `AC-OFF-702` has: a storyboard has no execution path on
 * which to prove a queue is absent. What this file can honestly say is that
 * it holds no queue and offers no parameter that would create one, and that
 * the client-side absence is a claim about the shipped application rather
 * than about this module.
 */
export const CC_NO_CLIENT_SIDE_QUEUE = {
  criterion: 'AC-CC-408',
  criterionRef: 'L38865',
  statement: 'No action is queued client-side under any connectivity condition.',
  enforcement:
    'Named, not enforced. This module holds no queue and exposes no parameter that could hold one; a storyboard has no execution path on which the absence of a client-side queue could be tested, so claiming enforcement would be false.',
} as const
