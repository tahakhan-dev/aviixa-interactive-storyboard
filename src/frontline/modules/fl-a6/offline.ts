import type { ConnectivityMode } from '@/scenario/controls'
import { HELD_ON_DEVICE_STATES, type ServerReceiptTime } from '@/frontline/capture'
import { COMMAND_CLASS_PHASE, admitCommandClass } from '@/frontline/commands'
import { clearanceApplication, gateEvaluation, signOffReadiness } from '@/frontline/modules/fl-b9/service'
import {
  OFFLINE_CLASSIFICATION,
  OFFLINE_CLASS_CONTRADICTION,
  ROWS_OUTSIDE_THE_SEVEN,
  type OfflineClassificationRow,
} from '@/offline/capability'
import {
  recordDeviceClockCorrection,
  resolveConflict,
  type ConflictRecord,
  type ConflictResolution,
  type SkewFlag,
} from '@/offline/conflict'
import {
  CONVERGENCE_VERDICTS,
  compareSession,
  convergenceObligation,
  type ObservedDifference,
} from '@/offline/convergence'
import { offMode, offModesFor, type OffMode, type OffModeId } from '@/offline/modes'
import { packageIsEnterable, packageReadiness, rePull, type PackageStaging } from '@/offline/package/delivery'
import { mayEvict, storageRule, type EvictionCandidate } from '@/offline/package/storage'
import { openQuarantine } from '@/offline/quarantine'
import {
  PROTOCOL_STEPS,
  TRANSFER_PASSES,
  firstNonSuccessStep,
  isSuccessfulFullPass,
  type ProtocolStep,
  type StepOutcome,
  type TransferPass,
} from '@/offline/protocol'
import { A6_STATES } from './charter'
import { A6_FUNCTIONALITIES } from './service'

/**
 * `MOD-FL-A6`'s OFFLINE HALF. Slice 7 built the identity, the matrix, the
 * refusals and the connected path; this file is the other half, and it is
 * almost entirely composition.
 *
 * ── THE ONE STRUCTURAL RULING IN THIS FILE ─────────────────────────────
 *
 * NOTHING HERE RE-DERIVES A MECHANISM THAT ALREADY EXISTS. The twenty-eight
 * source modes and the six-member mapping are `@/offline/modes`'s; the seven
 * capability classes and the fifty-two-row register are
 * `@/offline/capability`'s; the thirty-seven steps, their phases and the
 * ordering invariants are `@/offline/protocol`'s; the conflict authority, the
 * skew guard and the resolution routing are `@/offline/conflict`'s; the
 * package staging, pinning, eviction and storage rules are
 * `@/offline/package/*`'s; the forced sync before a sign-off, the gate
 * evaluation and the clearance are `MOD-FL-B9`'s; the durable queue's contents
 * are the four device-held rungs of `@/frontline/capture`'s ladder; and the
 * reconnection ORDER is `@/frontline/commands`'s. Every one of them is
 * imported and run. A second spelling of any of them is the defect this build
 * records most often.
 *
 * WHAT IS GENUINELY THIS MODULE'S, AND THEREFORE WHAT IS WRITTEN HERE:
 *
 *   1. The seven `STATE-A6-*` states. Nothing outside §22.15 knows them, and
 *      the resolver below is the only place a device situation becomes one.
 *   2. The two bounded tenant settings the card names, and their ceilings.
 *      `TEST-A6-4` (L41265) asks for a platform REJECTION at 96 hours and
 *      slice 7 shipped no code that could refuse one.
 *   3. The binding from each of the twenty-eight functionalities to the
 *      mechanism that now exercises it, so `exercisedInThisSlice` is checkable
 *      against something rather than being a flag anybody can flip.
 *
 * ── THE SEVEN STATES ARE FOUR AXES, NOT ONE MACHINE ────────────────────
 *
 * L41112 lists seven identifiers in one flat sentence and glosses exactly one.
 * Read as a single exclusive machine, a device that is offline AND inside its
 * trust window is untypeable — and that pair is the ordinary case the card's
 * whole Offline behaviour paragraph (L41129) describes. So the seven are
 * carried as four independent axes: the link, the transfer session, the trust
 * window, and the clock. `A6_STATE_AXES` states the split and its evidence;
 * the axes partition the seven exactly, with none in two and none left out.
 *
 * ── THE LINK AXIS UNDER `dependency-down`, WHICH THE SOURCE SETTLES ────
 *
 * The one place the four axes could have been this build's guess is what
 * `STATE-A6-CONNECTED` means when the link is up and the backend is not
 * answering. It is not a guess: `OFF-MODE-08`'s Frontline-behaviour cell at
 * L78650 reads "`Allowed` — engine treats it as offline for sync purposes",
 * and the engine is this module. The same row's oversight cell requires
 * surfaces to distinguish device-dark from server-unreachable, which is why
 * the reading below carries the `ConnectivityMode` and the source modes BESIDE
 * the state rather than folding them into it.
 */

/* ==================================================================== *
 * THE SEVEN STATES, AND THE FOUR AXES THEY SIT ON.
 * ==================================================================== */

/** Derived from the charter's transcription, never listed a second time. */
export type A6StateId = (typeof A6_STATES)[number]['id']

export type A6LinkState = Extract<A6StateId, 'STATE-A6-CONNECTED' | 'STATE-A6-OFFLINE'>
export type A6TransferState = Extract<A6StateId, 'STATE-A6-SYNCING' | 'STATE-A6-INTERRUPTED'>
export type A6TrustState = Extract<A6StateId, 'STATE-A6-TRUSTVALID' | 'STATE-A6-TRUSTEXPIRED'>
export type A6ClockState = Extract<A6StateId, 'STATE-A6-SKEWFLAGGED'>

export interface A6StateAxis {
  readonly axis: string
  readonly members: readonly A6StateId[]
  /** Why this group is its own axis rather than a branch of another. */
  readonly why: string
  readonly sourceRef: string
}

/**
 * The four axes. Their members partition the seven exactly — the covering
 * suite proves it against `A6_STATES` rather than against this list.
 */
export const A6_STATE_AXES = [
  {
    axis: 'The link',
    members: ['STATE-A6-CONNECTED', 'STATE-A6-OFFLINE'],
    why:
      'Whether the platform can be reached at all. Every other axis holds independently of it: the ' +
      'card describes a device that is offline and inside its trust window as the ordinary case.',
    sourceRef: 'L41129',
  },
  {
    axis: 'The transfer session',
    members: ['STATE-A6-SYNCING', 'STATE-A6-INTERRUPTED'],
    why:
      'Whether a transfer is under way or stopped part-way. It is not a branch of the link, because ' +
      'the interrupted state is precisely what a mid-sync connection drop leaves behind: the link is ' +
      'gone and the transfer is half done. Neither member holds when no transfer is in flight.',
    sourceRef: 'FUNC-A6-02-2-2 · L41170',
  },
  {
    axis: 'The trust window',
    members: ['STATE-A6-TRUSTVALID', 'STATE-A6-TRUSTEXPIRED'],
    why:
      'Whether cached credentials and qualifications are still trusted. One of the two always holds, ' +
      'connected or not, and the source glosses the first as "inside the offline trust window" — a ' +
      'condition, not a link posture.',
    sourceRef: 'FUNC-A6-05-1-1 · L41185',
  },
  {
    axis: 'The clock',
    members: ['STATE-A6-SKEWFLAGGED'],
    why:
      'Whether this device’s clock has been found materially wrong. It has no opposite member in the ' +
      'source’s list, which is consistent with the guard: the flag’s presence is the flag, and ' +
      'nothing clears it.',
    sourceRef: 'FUNC-A6-04-2-1 · L41181',
  },
] as const satisfies readonly A6StateAxis[]

/* ==================================================================== *
 * THE LINK AXIS, READ OFF THE TWENTY-EIGHT SOURCE MODES.
 * ==================================================================== */

/**
 * Which of the two link states each scenario lever puts this engine in, and
 * the source mode the answer is read from. The basis is not retyped: it is
 * pulled out of `@/offline/modes` by identifier at module load, so a change to
 * that transcription moves this rather than leaving two readings alive.
 *
 * Total over the six members, so a seventh `ConnectivityMode` would not
 * compile without a decision being made about it.
 */
export const A6_LINK_BASIS: Readonly<Record<ConnectivityMode, OffModeId>> = {
  online: 'OFF-MODE-01',
  slow: 'OFF-MODE-02',
  flapping: 'OFF-MODE-03',
  offline: 'OFF-MODE-04',
  'dependency-down': 'OFF-MODE-08',
  recovering: 'OFF-MODE-23',
}

export const A6_LINK_BY_CONNECTIVITY: Readonly<Record<ConnectivityMode, A6LinkState>> = {
  online: 'STATE-A6-CONNECTED',
  slow: 'STATE-A6-CONNECTED',
  flapping: 'STATE-A6-CONNECTED',
  offline: 'STATE-A6-OFFLINE',
  'dependency-down': 'STATE-A6-OFFLINE',
  recovering: 'STATE-A6-CONNECTED',
}

/** The Frontline-behaviour cell each link answer was read from, verbatim. */
export function a6LinkBasisCell(connectivity: ConnectivityMode): string {
  return offMode(A6_LINK_BASIS[connectivity]).frontlineBehaviour
}

/* ==================================================================== *
 * THE TWO BOUNDED TENANT SETTINGS THE CARD NAMES.
 *
 * `TEST-A6-4` (L41265) is a DENIAL test — "assert platform rejection rather
 * than a logged acceptance" — so the ruling type below has no member in which
 * an over-ceiling value could be accepted and noted. There is no third branch
 * to reach.
 * ==================================================================== */

export type A6BoundedSettingId = 'offline-trust-window' | 'clock-skew-threshold'

export interface A6BoundedSetting {
  readonly id: A6BoundedSettingId
  /** The setting's own name, as the matrix row and the card write it. */
  readonly name: string
  readonly unit: 'hours' | 'minutes'
  readonly defaultValue: number
  readonly ceiling: number
  /** The source's own words for the bound. */
  readonly clause: string
  readonly sourceRef: string
}

export const A6_BOUNDED_SETTINGS = [
  {
    id: 'offline-trust-window',
    name: 'the offline trust window',
    unit: 'hours',
    defaultValue: 24,
    ceiling: 72,
    clause:
      'tenant-set, default about 24 hours, platform ceiling 72 hours, shortenable but never ' +
      'exceedable',
    sourceRef: 'FUNC-A6-05-1-1 · L41185',
  },
  {
    id: 'clock-skew-threshold',
    name: 'the clock-skew threshold',
    unit: 'minutes',
    defaultValue: 5,
    ceiling: 60,
    clause: 'the tenant-set threshold, default about 5 minutes with a platform ceiling of 60 minutes',
    sourceRef: 'FUNC-A6-04-2-1 · L41181',
  },
] as const satisfies readonly A6BoundedSetting[]

type MissingFromBoundedSettings = Exclude<
  A6BoundedSettingId,
  (typeof A6_BOUNDED_SETTINGS)[number]['id']
>
const _boundedSettingsExhaustive: MissingFromBoundedSettings extends never ? true : never = true
void _boundedSettingsExhaustive

export function boundedSetting(id: A6BoundedSettingId): A6BoundedSetting {
  const found = A6_BOUNDED_SETTINGS.find((s) => s.id === id)
  if (found === undefined) throw new Error(`no bounded setting ${id}`)
  return found
}

export type A6BoundedSettingRuling =
  | { readonly accepted: true; readonly setting: A6BoundedSetting; readonly value: number }
  | { readonly accepted: false; readonly setting: A6BoundedSetting; readonly refusal: string }

/**
 * `value` carries no default. A defaulted parameter does not count toward
 * `Function.length`, and an omitted argument here would silently accept the
 * platform default in place of the value a tenant actually offered.
 */
export function boundedSettingRuling(
  id: A6BoundedSettingId,
  value: number,
): A6BoundedSettingRuling {
  const setting = boundedSetting(id)
  if (value > setting.ceiling) {
    return {
      accepted: false,
      setting,
      refusal:
        `${value} ${setting.unit} is above the platform ceiling of ${setting.ceiling} ` +
        `${setting.unit} for ${setting.name}. The platform refuses the value; it is not accepted ` +
        'and noted.',
    }
  }
  return { accepted: true, setting, value }
}

/* ==================================================================== *
 * THE STATE RESOLVER.
 * ==================================================================== */

export interface A6DeviceSituation {
  readonly connectivity: ConnectivityMode
  /** Whether a transfer session is under way, stopped part-way, or neither. */
  readonly transfer: 'none' | 'in-progress' | 'interrupted'
  readonly hoursSinceLastSuccessfulSync: number
  /** The tenant's offline trust window in force, in hours. */
  readonly trustWindowHours: number
  /** The device's skew reading, or `null` where its clock is within the threshold. */
  readonly skew: SkewFlag | null
}

export interface A6StateReading {
  readonly link: A6LinkState
  readonly transfer: A6TransferState | null
  readonly trust: A6TrustState
  readonly clock: A6ClockState | null
  /** Every state that holds, in the order L41112 names them. Never empty. */
  readonly held: readonly A6StateId[]
  /** The scenario lever this situation runs under. */
  readonly connectivity: ConnectivityMode
  /**
   * Every source mode that lever reproduces, carried BESIDE the state and
   * never folded into it, so the device-dark versus server-unreachable
   * distinction survives the two-member link axis.
   */
  readonly modes: readonly OffMode[]
}

/**
 * A situation becomes a set of states. Total: exactly one link member and
 * exactly one trust member always hold, so `held` cannot come back empty.
 *
 * A trust window above the platform ceiling THROWS rather than being clamped
 * or trusted. `boundedSettingRuling` refuses such a value, so a situation
 * carrying one describes a device the platform would never have configured;
 * clamping it here would silently invent the tenant's intent, and trusting it
 * would let a 96-hour window decide whether cached authority is still good.
 */
export function a6StateReading(situation: A6DeviceSituation): A6StateReading {
  const window = boundedSettingRuling('offline-trust-window', situation.trustWindowHours)
  if (!window.accepted) throw new RangeError(window.refusal)

  const link = A6_LINK_BY_CONNECTIVITY[situation.connectivity]
  const transfer: A6TransferState | null =
    situation.transfer === 'in-progress'
      ? 'STATE-A6-SYNCING'
      : situation.transfer === 'interrupted'
        ? 'STATE-A6-INTERRUPTED'
        : null
  const trust: A6TrustState =
    situation.hoursSinceLastSuccessfulSync <= window.value
      ? 'STATE-A6-TRUSTVALID'
      : 'STATE-A6-TRUSTEXPIRED'
  const clock: A6ClockState | null = situation.skew === null ? null : 'STATE-A6-SKEWFLAGGED'

  const holds = new Set<A6StateId>([link, trust])
  if (transfer !== null) holds.add(transfer)
  if (clock !== null) holds.add(clock)

  return {
    link,
    transfer,
    trust,
    clock,
    held: A6_STATES.map((s) => s.id).filter((id) => holds.has(id)),
    connectivity: situation.connectivity,
    modes: offModesFor(situation.connectivity),
  }
}

/* ==================================================================== *
 * WHAT THE SHEET SAYS WHILE EACH STATE HOLDS.
 *
 * A total record over the seven, so a state cannot hold and leave the sheet
 * with nothing to say about it. Every line is the source's own claim for that
 * state rather than a description of the pixel.
 * ==================================================================== */

export interface A6StateLine {
  readonly line: string
  readonly sourceRef: string
}

export const A6_STATE_LINES: Readonly<Record<A6StateId, A6StateLine>> = {
  'STATE-A6-CONNECTED': {
    line:
      'The tablet is reaching the office. Sync runs continuously and by itself, packages stage as ' +
      'they arrive, and server-receipt times are written.',
    sourceRef: 'L41127',
  },
  'STATE-A6-OFFLINE': {
    line:
      'The tablet cannot reach the office. A full Run still executes from the pinned package, work ' +
      'accumulates durably on the device, and nothing arrives from the office while this holds — no ' +
      'hold can be released and no clearance can land.',
    sourceRef: 'L41129',
  },
  'STATE-A6-SYNCING': {
    line:
      'A transfer is running in the background. It is never a worker action and nothing on this ' +
      'screen was waiting for it.',
    sourceRef: 'FUNC-A6-02-1-1 · L41167',
  },
  'STATE-A6-INTERRUPTED': {
    line:
      'A transfer stopped part-way. It carries on from where it left off rather than starting again, ' +
      'and nothing is sent twice.',
    sourceRef: 'FUNC-A6-02-2-2 · L41170',
  },
  'STATE-A6-TRUSTVALID': {
    line:
      'Cached credentials and qualifications are still trusted, because this device is inside the ' +
      'offline trust window its tenant set.',
    sourceRef: 'STATE-A6-TRUSTVALID · L41112',
  },
  'STATE-A6-TRUSTEXPIRED': {
    line:
      'The offline trust window has run out. No new session starts and no designated high-risk ' +
      'action proceeds, and every piece of work already on this device is preserved.',
    sourceRef: 'L41239',
  },
  'STATE-A6-SKEWFLAGGED': {
    line:
      'This device’s clock was found materially wrong, so its timestamps no longer decide anything on ' +
      'their own. Ordering follows server receipt, and a conflict that would have turned on the ' +
      'device clock goes to the Client Command Center for a person to settle.',
    sourceRef: 'FUNC-A6-04-2-2 · L41182',
  },
}

/* ==================================================================== *
 * THE RECONNECT LADDER, WALKED.
 *
 * The thirty-seven steps, their phases, the two ordering invariants and the
 * three transfer passes are all `@/offline/protocol`'s. What is added here is
 * the one question §22.15 asks and that file does not: where does an
 * interrupted reconnection RESUME, and what does the worker get told.
 *
 * `AC-36-101` AND `AC-36-102` ARE DELIBERATELY NOT REPORTED HERE, and that is
 * a correction rather than an omission. The first draft carried both on the
 * result, computed by handing `satisfiesAc36101` the steps this walk had
 * executed. Those steps are always a prefix of 1 to 37, and on a prefix the
 * criterion is true unconditionally — if step 15 is in the list then so is
 * every step below it. A field that cannot be false is not a check, and its
 * gate could not be made to fail: the plant that changed the executed list to
 * all thirty-seven left the suite green. Both invariants constrain an ORDER,
 * they are asserted against real orders in `@/offline/protocol`'s own suite,
 * and a walk that is in order by construction has nothing to add to them.
 * ==================================================================== */

export interface A6Reconnection {
  /** `isSuccessfulFullPass` over all thirty-seven. */
  readonly completed: boolean
  /** The step to resume from, or `null` where every step succeeded. */
  readonly resumeAt: ProtocolStep | null
  /** The transfer passes the run actually reached. */
  readonly passesReached: readonly TransferPass[]
  readonly line: string
  readonly sourceRef: string
}

export function a6Reconnect(outcomes: readonly StepOutcome[]): A6Reconnection {
  const resumeAt = firstNonSuccessStep(outcomes)
  const completed = isSuccessfulFullPass(outcomes)
  // `outcomes` is positional against `PROTOCOL_STEPS`, so a short list is a
  // run that stopped early with everything it DID attempt succeeding — a
  // dropped link between two steps, which is the ordinary offline case. Taking
  // the protocol's own length here instead would have called two successful
  // steps a run that reached all three transfer passes; the covering suite
  // planted exactly that and it went red on the pass count.
  const reached = resumeAt === null ? outcomes.length : resumeAt.number - 1
  return {
    completed,
    resumeAt,
    passesReached: TRANSFER_PASSES.filter((p) => p.step <= reached),
    line:
      resumeAt === null
        ? 'The reconnection ran every one of its thirty-seven steps and none of them came back a ' +
          'non-success.'
        : `The reconnection stopped at step ${resumeAt.number}, ${resumeAt.title} It carries on from ` +
          'that step rather than starting again, and nothing already transferred is sent twice.',
    sourceRef:
      resumeAt === null
        ? 'AC-A6-1 · L41245'
        : 'AC-A6-3 · L41247, FUNC-A6-02-2-2 · L41170',
  }
}

/* ==================================================================== *
 * THE FIVE REGISTER ROWS THIS MODULE OWNS, AND THE ONE THAT BREAKS
 * `AC-OFF-701`.
 *
 * The register is keyed on Function and its Module column is an ordinary
 * column, so this reads the column rather than treating it as a key — which
 * is why the filter is written out rather than a lookup being called.
 * ==================================================================== */

export const A6_CLASSIFICATION_ROWS: readonly OfflineClassificationRow[] =
  OFFLINE_CLASSIFICATION.filter((r) => r.module === '`MOD-FL-A6`')

/**
 * The rows `AC-OFF-701` cannot account for, read from `@/offline/capability`
 * rather than re-filtered here, intersected with this module's own.
 *
 * THE INTERSECTION IS THE FINDING. `AC-OFF-701` requires every Frontline
 * function to carry exactly one of the seven classes; the register classifies
 * one function outside them, and that function is this module's. So the row
 * the criterion cannot account for is `MOD-FL-A6`'s, and the class it carries
 * — `Explicitly prohibited on the device` — is the same refusal row 5 of this
 * module's own matrix already draws. It is the register agreeing with §22.15,
 * expressed in a token §34.7 closed itself out of.
 */
export const A6_ROWS_OUTSIDE_THE_SEVEN: readonly OfflineClassificationRow[] =
  ROWS_OUTSIDE_THE_SEVEN.filter((r) => r.module === '`MOD-FL-A6`')

/** The contradiction itself, read from wave 0 and never re-opened here. */
export const A6_CLASS_CONTRADICTION = OFFLINE_CLASS_CONTRADICTION

/* ==================================================================== *
 * RECONCILIATION, WHICH IS THE CARD'S WORD FOR CONVERGENCE.
 *
 * The card's Recovery and reconciliation field (L41156) names three
 * comparisons on this device: expected step executions against received
 * captures, the server command ledger against device acknowledgements, and
 * the conflict-review panel where a true conflict occurred. The first two are
 * the `SURF-FL` row of §36.6's obligation table, and the comparator with its
 * three verdicts is `@/offline/convergence`'s. Both are read; neither is
 * rewritten.
 * ==================================================================== */

export const A6_CONVERGENCE_ROW = convergenceObligation('SURF-FL')
export const A6_CONVERGENCE_VERDICTS = CONVERGENCE_VERDICTS

/* ==================================================================== *
 * THE FIXTURES THE DRIVERS RUN ON.
 *
 * Held as named constants because the panel renders their outcomes and the
 * covering suite re-derives them. A fixture private to one of the two would
 * let the panel and the gate disagree about what was run.
 * ==================================================================== */

/** A tablet that has been dark for six hours, mid-transfer when the link went. */
export const A6_OFFLINE_SITUATION: A6DeviceSituation = {
  connectivity: 'offline',
  transfer: 'interrupted',
  hoursSinceLastSuccessfulSync: 6,
  trustWindowHours: 24,
  skew: null,
}

/** The same tablet a day and a half later, its clock found materially wrong. */
export const A6_TRUST_EXPIRED_SITUATION: A6DeviceSituation = {
  connectivity: 'dependency-down',
  transfer: 'none',
  hoursSinceLastSuccessfulSync: 30,
  trustWindowHours: 24,
  skew: { deviationMinutes: 11, thresholdMinutesInForce: 5, deviceClockCorrectedAt: null },
}

/** The connected case the slice-7 sheet already draws, stated as a situation. */
export const A6_CONNECTED_SITUATION: A6DeviceSituation = {
  connectivity: 'online',
  transfer: 'in-progress',
  hoursSinceLastSuccessfulSync: 0,
  trustWindowHours: 24,
  skew: null,
}

/**
 * THE THREE SITUATIONS THE SHEET RENDERS, and between them they reach all
 * seven states. Named here rather than in the component, because the covering
 * suite drives the same three and a fixture private to the panel would let the
 * screen and the gate disagree about what was reachable.
 */
export interface A6NamedSituation {
  readonly label: string
  readonly situation: A6DeviceSituation
}

export const A6_SITUATIONS = [
  {
    label: 'Connected, with a transfer running in the background',
    situation: A6_CONNECTED_SITUATION,
  },
  {
    label: 'Dark since this morning, cut off part-way through a transfer',
    situation: A6_OFFLINE_SITUATION,
  },
  {
    label: 'The backend has stopped answering, the window has run out, and the clock is wrong',
    situation: A6_TRUST_EXPIRED_SITUATION,
  },
] as const satisfies readonly A6NamedSituation[]

/**
 * Every state the three situations between them actually reach, DERIVED by
 * running the resolver. This is what `drivenHere` on the charter's seven is
 * checked against: a state nothing can reach cannot claim to be driven, and a
 * declaration flipped without a situation that produces it goes red here.
 */
export const A6_STATES_REACHED: readonly A6StateId[] = A6_STATES.map((s) => s.id).filter((id) =>
  A6_SITUATIONS.some((n) => a6StateReading(n.situation).held.includes(id)),
)

/** Steps 1 to 21 succeeded and step 22 did not: the queue drain was cut off. */
export const A6_INTERRUPTED_OUTCOMES: readonly StepOutcome[] = PROTOCOL_STEPS.map((s) =>
  s.number < 22 ? 'success' : 'non-success',
)

/** A conflict on a measurement where one of the two writes is skew-flagged. */
export const A6_SKEWED_CONFLICT: ConflictRecord = {
  objectFamily: 'shared-checklist-item',
  versions: [
    {
      value: '12.4 mm',
      workerId: 'WKR-1',
      deviceCaptureTimestamp: '2026-08-22T08:31:00.000Z',
      serverReceiptTimestamp: '2026-08-22T09:02:00.000Z',
      skewFlagged: {
        deviationMinutes: 11,
        thresholdMinutesInForce: 5,
        deviceClockCorrectedAt: null,
      },
    },
    {
      value: '12.6 mm',
      workerId: 'WKR-2',
      deviceCaptureTimestamp: '2026-08-22T08:29:00.000Z',
      serverReceiptTimestamp: '2026-08-22T09:02:00.000Z',
      skewFlagged: null,
    },
  ],
  beyondSpecificationLimits: false,
  familyHumanTrigger: null,
}

/**
 * THE SAME CONFLICT WITH NEITHER WRITE FLAGGED, and it is not decoration.
 * The family matters: a family whose authority row opens `Always` routes to a
 * person whether or not a clock is in doubt, so a fixture on one of those
 * cannot show the skew guard doing anything. This pair is on a last-write-wins
 * family, where the flag is the only difference between the two outcomes —
 * which is what makes `FUNC-A6-04-2-2` visible rather than assumed.
 */
export const A6_CLEAN_CONFLICT: ConflictRecord = {
  ...A6_SKEWED_CONFLICT,
  versions: [
    { ...A6_SKEWED_CONFLICT.versions[0], skewFlagged: null },
    A6_SKEWED_CONFLICT.versions[1],
  ],
}

/** Media whose upload was attempted and never confirmed. */
export const A6_UNCONFIRMED_MEDIA: EvictionCandidate = {
  objectId: 'EVD-1',
  receiptConfirmed: false,
  integrityCheckPassed: false,
  runCompleteAndSynced: false,
}

/** A package assigned while the device was dark, so nothing arrived. */
export const A6_UNSTAGED_PACKAGE: PackageStaging = {
  kind: 'not-arrived',
  reason: 'the device was offline when the Run was assigned',
}

/** A capture still on the device, so its server-receipt time is absent. */
export const A6_UNRECEIVED_CAPTURE: ServerReceiptTime = {
  received: false,
  heldAt: 'upload-interrupted',
}

/**
 * A difference the `SURF-FL` row expects — commands not yet delivered because
 * the device was offline — that the surface is NOT showing. L80658 makes the
 * quiet case unexplained rather than honest, and this is that case.
 */
export const A6_QUIET_DIFFERENCE: ObservedDifference = {
  surface: 'SURF-FL',
  expected: true,
  displayed: false,
  what: 'a command pending on the server side and absent on the device side',
}

/* ==================================================================== *
 * THE DRIVERS: WHAT EXERCISES EACH FUNCTIONALITY, AND WHAT IT PRODUCED.
 *
 * `evidence` is the LIVE OUTPUT of the mechanism on the fixtures above,
 * computed when this module loads. It is not a description of what would
 * happen. The covering suite re-runs each mechanism and compares, so a driver
 * whose mechanism stops working cannot keep its sentence.
 * ==================================================================== */

export type A6DriverId =
  | 'device-state'
  | 'bounded-settings'
  | 'reconnect-ladder'
  | 'transfer-passes'
  | 'package-staging'
  | 'version-pinning'
  | 'on-device-storage'
  | 'conflict-routing'
  | 'skew-guard'
  | 'capability-class'
  | 'queue-durability'
  | 'command-validation'
  | 'capture-envelope'
  | 'b9-gate'
  | 'manual-sync'
  | 'reconciliation'

export type A6FunctionalityId = (typeof A6_FUNCTIONALITIES)[number]['id']

export interface A6Driver {
  readonly id: A6DriverId
  /** What this build actually runs. */
  readonly what: string
  /** Where the mechanism lives. Every one of them is another task's file. */
  readonly from: string
  /** The functionalities it exercises. */
  readonly drives: readonly A6FunctionalityId[]
  /** The card field it exercises where it exercises no functionality. */
  readonly drivesCardField: string | null
  /** The mechanism's own output on this module's fixtures. */
  readonly evidence: string
}

const RESOLVED: ConflictResolution = resolveConflict(A6_SKEWED_CONFLICT)
const RESOLVED_CLEAN: ConflictResolution = resolveConflict(A6_CLEAN_CONFLICT)
const RECONNECTION = a6Reconnect(A6_INTERRUPTED_OUTCOMES)
const REFUSED_WINDOW = boundedSettingRuling('offline-trust-window', 96)
const EVICTION = mayEvict(A6_UNCONFIRMED_MEDIA)
const MINIMAL_SCOPE = storageRule('minimal-scope')
const REBASE = rePull(A6_UNSTAGED_PACKAGE, 'v2.2.0', true)
const HELD_RECORD = openQuarantine({
  reason: 'envelope-incompleteness',
  arrivalSession: 'SESSION-1',
  retained: null,
  auditCommitted: false,
})
const CORRECTED = recordDeviceClockCorrection(
  { deviationMinutes: 11, thresholdMinutesInForce: 5, deviceClockCorrectedAt: null },
  '2026-08-22T10:00:00.000Z',
)
const UNKNOWN_CLASS = admitCommandClass('CMD-FL-WIPE')
const OFFLINE_READING = a6StateReading(A6_OFFLINE_SITUATION)
const EXPIRED_READING = a6StateReading(A6_TRUST_EXPIRED_SITUATION)
const QUIET = compareSession([A6_QUIET_DIFFERENCE])

export const A6_DRIVERS = [
  {
    id: 'device-state',
    what: 'Resolves a device situation into the states of L41112 that hold, on all four axes at once.',
    from: 'this module; the six scenario levers are @/scenario/controls’s and the twenty-eight source modes are @/offline/modes’s',
    drives: ['FUNC-A6-02-1-1'],
    drivesCardField: null,
    evidence:
      `A tablet on the offline lever, cut off mid-transfer, holds ${OFFLINE_READING.held.join(' and ')}. ` +
      `A tablet whose backend has stopped answering and whose window has run out holds ` +
      `${EXPIRED_READING.held.join(' and ')}.`,
  },
  {
    id: 'bounded-settings',
    what: 'Refuses a tenant value above the platform ceiling, with no branch that accepts and notes it.',
    from: 'this module; TEST-A6-4 asks for the refusal and slice 7 shipped no code that could give one',
    drives: ['FUNC-A6-04-2-1', 'FUNC-A6-05-1-1'],
    drivesCardField: null,
    evidence: REFUSED_WINDOW.accepted
      ? 'A 96-hour offline trust window was accepted, which the platform ceiling forbids.'
      : REFUSED_WINDOW.refusal,
  },
  {
    id: 'reconnect-ladder',
    what: 'Walks the thirty-seven-step protocol over observed outcomes and reports where it resumes.',
    from: '@/offline/protocol',
    drives: ['FUNC-A6-01-1-2', 'FUNC-A6-02-2-2'],
    drivesCardField: null,
    evidence: RECONNECTION.line,
  },
  {
    id: 'transfer-passes',
    what: 'Binds the three adopted passes to the protocol steps that run them, and each command class to the pass it drains in.',
    from: '@/offline/protocol and @/frontline/commands',
    drives: ['FUNC-A6-03-1-1', 'FUNC-A6-06-1-2', 'FUNC-A6-06-1-3'],
    drivesCardField: null,
    evidence: `Pass ${TRANSFER_PASSES[0]?.pass ?? 0} runs at step ${TRANSFER_PASSES[0]?.step ?? 0} and a version change drains in the ${COMMAND_CLASS_PHASE['CMD-FL-VERSION']} pass.`,
  },
  {
    id: 'package-staging',
    what: 'Answers whether a Run may be entered from the staging state its package is in.',
    from: '@/offline/package/delivery, forwarding MOD-FL-A2’s own readiness states',
    drives: ['FUNC-A6-01-1-1'],
    drivesCardField: null,
    evidence: `A package that never arrived leaves the Run at ${packageReadiness(A6_UNSTAGED_PACKAGE)}, enterable: ${String(packageIsEnterable(A6_UNSTAGED_PACKAGE))}.`,
  },
  {
    id: 'version-pinning',
    what: 'Refuses a re-pull against a Run that is under way, so an in-flight Run cannot be re-based.',
    from: '@/offline/package/delivery, which reads the refusal from this module’s own matrix row',
    drives: ['FUNC-A6-01-1-3', 'FUNC-A6-06-1-1'],
    drivesCardField: null,
    evidence: `A forced re-pull on a Run under way restaged nothing: ${String(REBASE.restaged)}.`,
  },
  {
    id: 'on-device-storage',
    what: 'Withholds eviction until confirmed receipt, an integrity check and the run-completion condition the storage rule names third, and reads the minimal-scope rule beside it.',
    from: '@/offline/package/storage',
    drives: ['FUNC-A6-07-1-1', 'FUNC-A6-07-1-2', 'FUNC-A6-07-1-3'],
    drivesCardField: null,
    evidence: EVICTION.evict
      ? 'Media with no confirmed receipt was evicted, which the rule forbids.'
      : `Media with no confirmed receipt is retained: ${EVICTION.line}. The scope rule beside it: ` +
        `${MINIMAL_SCOPE.rule}, enforced at ${MINIMAL_SCOPE.enforcementPoint.toLowerCase()}.`,
  },
  {
    id: 'conflict-routing',
    what: 'Routes a conflict, and suppresses automatic resolution where either competing write is skew-flagged.',
    from: '@/offline/conflict',
    drives: ['FUNC-A6-04-2-2', 'FUNC-A6-08-1-1', 'FUNC-A6-08-1-4'],
    drivesCardField: null,
    evidence:
      `A conflict on a last-write-wins family with one write skew-flagged routes to ` +
      `${RESOLVED.route} and names no last write. The same conflict with neither write flagged ` +
      `routes to ${RESOLVED_CLEAN.route} and names version ${String(RESOLVED_CLEAN.lastWriteWinner)}.`,
  },
  {
    id: 'skew-guard',
    what: 'Records a device clock correction inside the flag, which is why nothing can clear one.',
    from: '@/offline/conflict, whose recordDeviceClockCorrection returns a flag and never null',
    drives: [],
    drivesCardField: 'Alternate paths — a clock-skew detection (L41125)',
    evidence: `After the clock was corrected the flag still reads a deviation of ${CORRECTED.deviationMinutes} minutes against a threshold of ${CORRECTED.thresholdMinutesInForce}.`,
  },
  {
    id: 'capability-class',
    what: 'Reads this module’s own rows of the fifty-two-row classification register, and the one of them the criterion cannot account for.',
    from: '@/offline/capability',
    drives: [],
    drivesCardField: 'Objects affected — the staged package set and the durable queue (L41110)',
    evidence: `${A6_CLASSIFICATION_ROWS.length} register rows name this module, and ${A6_ROWS_OUTSIDE_THE_SEVEN.length} of them carries a class AC-OFF-701 does not.`,
  },
  {
    id: 'queue-durability',
    what: 'Holds work on the device where it cannot be written anywhere else, and offers no operation that removes an item.',
    from: '@/frontline/capture for the device-held rungs, @/offline/quarantine for the refusal that keeps a record on the device',
    drives: ['FUNC-A6-02-2-1'],
    drivesCardField: null,
    evidence: HELD_RECORD.written
      ? 'A quarantine record was written without its audit entry, which the rule forbids.'
      : `A record whose audit entry could not commit ${HELD_RECORD.disposition}, alongside the ${HELD_ON_DEVICE_STATES.length} rungs the platform holds no record of.`,
  },
  {
    id: 'command-validation',
    what: 'Validates a command class before anything is applied and returns a typed rejection rather than a failure.',
    from: '@/frontline/commands',
    drives: ['FUNC-A6-03-1-2'],
    drivesCardField: null,
    evidence: UNKNOWN_CLASS.accepted
      ? 'An unrecognised command class was accepted, which the five-class closure forbids.'
      : 'An unrecognised command class comes back as a reason rather than as an applied command.',
  },
  {
    id: 'capture-envelope',
    what: 'Carries both timestamps and the worker each write is attributed to, with the server-receipt time a member that says it is absent rather than a blank.',
    from: '@/frontline/capture and @/offline/conflict',
    drives: ['FUNC-A6-04-1-1', 'FUNC-A6-04-1-2', 'FUNC-A6-08-1-3'],
    drivesCardField: null,
    evidence: A6_UNRECEIVED_CAPTURE.received
      ? 'A capture still on the device reported a server-receipt time.'
      : `A capture still on the device reports no server-receipt time and names the rung it is held at: ${A6_UNRECEIVED_CAPTURE.heldAt}.`,
  },
  {
    id: 'b9-gate',
    what: 'Blocks a sign-off whose forced sync cannot complete, parks a Run on a failed gate, and applies or rejects an arriving clearance.',
    from: '@/frontline/modules/fl-b9/service, which built all three in slice 7',
    drives: ['FUNC-A6-05-2-1', 'FUNC-A6-05-3-1', 'FUNC-A6-05-3-2'],
    drivesCardField: null,
    evidence: `With no connection a sign-off proceeds: ${String(signOffReadiness(false).proceeds)}; a lapsed qualification under the strict posture parks the Run as ${gateEvaluation(false, 'strict').parks ?? 'nothing'}; an expired clearance applies: ${String(clearanceApplication({ alreadyExpiredOnArrival: true }).applied)}.`,
  },
  {
    id: 'manual-sync',
    what: 'Answers the manual control honestly in both connectivity states, with no field in which an obligation could be recorded.',
    from: 'this module’s own service, built in slice 7',
    drives: ['FUNC-A6-02-2-3'],
    drivesCardField: null,
    evidence: 'The control reports an attempt or reports no connection, and asks for nothing either way.',
  },
  {
    id: 'reconciliation',
    what: 'Compares this surface against the record and classifies each difference as honest or unexplained.',
    from: '@/offline/convergence',
    drives: [],
    drivesCardField: 'Recovery and reconciliation (L41156)',
    evidence: `An expected difference this surface does not actually display comes back as ${QUIET.verdict}, and the session converged: ${String(QUIET.converged)}.`,
  },
] as const satisfies readonly A6Driver[]

type MissingFromDrivers = Exclude<A6DriverId, (typeof A6_DRIVERS)[number]['id']>
const _driversExhaustive: MissingFromDrivers extends never ? true : never = true
void _driversExhaustive

export function a6Driver(id: A6DriverId): A6Driver {
  const found = A6_DRIVERS.find((d) => d.id === id)
  if (found === undefined) throw new Error(`no driver ${id}`)
  return found
}

/**
 * The driver each functionality is exercised by, DERIVED from the drivers'
 * own `drives` lists so the binding is stated once. `null` is the honest
 * answer for the two this build does not drive, and `A6_UNDRIVEN` says why
 * for each.
 */
export const A6_DRIVER_OF: Readonly<Record<A6FunctionalityId, A6DriverId | null>> =
  Object.fromEntries(
    A6_FUNCTIONALITIES.map((f) => [
      f.id,
      A6_DRIVERS.find((d) => (d.drives as readonly string[]).includes(f.id))?.id ?? null,
    ]),
  ) as Readonly<Record<A6FunctionalityId, A6DriverId | null>>

export interface A6Undriven {
  readonly id: A6FunctionalityId
  readonly why: string
  readonly sourceRef: string
}

/**
 * The two of the twenty-eight this build does not exercise, and neither is an
 * omission. Driving either would be this build answering a question the source
 * left open or building a capability the source excluded.
 */
export const A6_UNDRIVEN = [
  {
    id: 'FUNC-A6-07-1-4',
    why:
      'Its whole body is `Client Decision Required` under DEC-STORE-001 — the Roles allowed clause ' +
      'and both connectivity clauses. AC-FL-011-5 requires the decision to remain visibly open and ' +
      'forbids any implementation closing it silently, so any storage-full behaviour written here ' +
      'would be indistinguishable from one the source stated. The terminal safe state the source ' +
      'DOES give is carried on the card and in this module’s disclosure.',
    sourceRef: 'AC-FL-011-5 · L40155',
  },
  {
    id: 'FUNC-A6-08-1-2',
    why:
      'It states an excluded capability rather than a behaviour: concurrent same-record editing is ' +
      'out of scope, so there is nothing to run. It is the same functionality whose Fallback field ' +
      'reads "Not applicable — an excluded capability has no failure mode", which is why it is also ' +
      'one of the two that name no FB-FL-* pattern.',
    sourceRef: 'FUNC-A6-08-1-2 · L41205',
  },
] as const satisfies readonly A6Undriven[]

/** How much of the module this build exercises, counted rather than claimed. */
export const A6_DRIVEN_COUNT = A6_FUNCTIONALITIES.filter(
  (f) => A6_DRIVER_OF[f.id] !== null,
).length
