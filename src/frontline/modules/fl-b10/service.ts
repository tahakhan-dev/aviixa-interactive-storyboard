import { frontlineConnectivityTreatment } from '@/frontline/access'
import { FL_COMMAND_CLASSES, type FrontlineCommandClass } from '@/frontline/commands'
import {
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'
import {
  B10_NOTIFICATION_STATES,
  type B10DeviceObservableState,
  type B10NotificationState,
} from './charter'

/**
 * `MOD-FL-B10`'s own logic and vocabulary. Frozen source §22.19.
 *
 * ── THE ONE STRUCTURAL RULING IN THIS FILE ─────────────────────────────
 *
 * THIS MODULE NEVER ADVANCES A NOTIFICATION PAST THE STATES ITS OWN TRIGGER
 * ROW EXERCISES, AND IT NEVER WRITES A STATE THE DEVICE DOES NOT HOLD. The
 * source's notification table (L41837-L41840) gives each of this module's four
 * triggers its OWN list of exercised states, and they are not the same list:
 * an ordinary inbox item ends at `read` with no acknowledgement, a
 * notified-class change notice reaches `acknowledged`, an in-situ step flag
 * stops at `opened`, and a patch-level change exercises `created` and
 * `suppressed` and therefore nothing the device can see at all.
 *
 * So the device ladder is DERIVED per trigger — the trigger's own exercised
 * states, intersected with the four `charter.ts` marks device-observable —
 * rather than being one hard-coded four-rung ladder applied to everything.
 * A single ladder would have this screen offering to acknowledge an ordinary
 * message, which is the exact shape of `L41848`'s rule being broken:
 * acknowledgement is not the business action, and an acknowledgement the
 * source never gave the type is not even a notification state.
 *
 * `advanceOnDevice` returns `null` at the end of a trigger's own list, so
 * there is no branch through which a fifth rung or a foreign state arrives.
 *
 * ── WHAT THIS FILE DOES NOT DO ─────────────────────────────────────────
 *
 * IT WRITES NO SYNC STATE. The sync detail sheet on this destination is
 * `MOD-FL-A6`'s (L39868, L40035) and the capture ladder is `@/frontline/
 * capture`'s. This module's card says it "carries the honest sync-status
 * detail" and this build reads that as naming A6's sheet rather than as
 * licence to spell a second one. L39622 has no state called synced and no bare
 * success; the safest way to hold that here is to produce no sync label at
 * all.
 */

/* ==================================================================== *
 * THE NOTIFICATION TABLE — FOUR TRIGGERS, EACH WITH ITS OWN STATE LIST.
 * Header L41835, separator L41836, data L41837-L41840.
 * ==================================================================== */

export type B10TriggerId =
  | 'any-notification-to-the-identity'
  | 'patch-level-change'
  | 'notified-class-change'
  | 'affected-steps-flag'

export interface B10TriggerRow {
  readonly id: B10TriggerId
  /** Column 1, verbatim. */
  readonly trigger: string
  /** Column 2, verbatim. */
  readonly recipient: string
  /** Column 3, verbatim. */
  readonly channel: string
  /** Column 4, verbatim, parsed into the platform's own state identifiers. */
  readonly statesExercised: readonly B10NotificationState[]
  readonly sourceRef: string
}

export const B10_NOTIFICATION_TABLE = [
  {
    id: 'any-notification-to-the-identity',
    trigger: "Any notification addressed to the worker's identity",
    recipient: 'The worker, in the identity-scoped inbox',
    channel:
      'in-app only on this surface; email is delivered by the Delivery Operations Hub to the ' +
      "worker's address where one exists",
    statesExercised: [
      'created',
      'eligible',
      'queued',
      'sent',
      'provider-accepted',
      'delivered',
      'opened',
      'read',
    ],
    sourceRef: 'L41837',
  },
  {
    id: 'patch-level-change',
    trigger: 'A patch-level work-instruction change',
    recipient: 'Nobody is forced',
    channel:
      'Not applicable — no notification is forced on the worker; the change is fully tracked in ' +
      'the version history',
    statesExercised: ['created', 'suppressed'],
    sourceRef: 'L41838',
  },
  {
    id: 'notified-class-change',
    trigger: 'A notified-class work-instruction change',
    recipient: 'The worker, on the first screen of the next execution',
    channel: 'In-application change notice, part of starting the work',
    statesExercised: [
      'created',
      'eligible',
      'queued',
      'delivered',
      'opened',
      'read',
      'acknowledged',
    ],
    sourceRef: 'L41839',
  },
  {
    id: 'affected-steps-flag',
    trigger: 'Affected steps under a notified change',
    recipient: 'The worker, in situ where they meet the step',
    channel: 'In-application flag',
    statesExercised: ['created', 'eligible', 'delivered', 'opened'],
    sourceRef: 'L41840',
  },
] as const satisfies readonly B10TriggerRow[]

type MissingFromTriggers = Exclude<B10TriggerId, (typeof B10_NOTIFICATION_TABLE)[number]['id']>
const _triggersExhaustive: MissingFromTriggers extends never ? true : never = true
void _triggersExhaustive

const DEVICE_OBSERVABLE: ReadonlySet<string> = new Set(
  B10_NOTIFICATION_STATES.filter((s) => s.deviceObservable).map((s) => s.id),
)

export function triggerRow(id: B10TriggerId): B10TriggerRow {
  const found = B10_NOTIFICATION_TABLE.find((t) => t.id === id)
  if (found === undefined) throw new Error(`MOD-FL-B10 has no notification trigger "${id}"`)
  return found
}

/**
 * The rungs THIS trigger's own row exercises that the device can observe and
 * write. Derived from two independent readings — the source's own column 4 and
 * `charter.ts`'s reading of L41808 — so a state can only appear here if BOTH
 * say it belongs. Empty for the patch-level tier, which is the point of it.
 */
export function deviceRungsFor(id: B10TriggerId): readonly B10DeviceObservableState[] {
  return triggerRow(id).statesExercised.filter((s): s is B10DeviceObservableState =>
    DEVICE_OBSERVABLE.has(s),
  )
}

/**
 * The next rung, or `null` at the end of this trigger's own list. A state the
 * trigger does not exercise is not "not yet reached" — it is not a state this
 * item ever has, so it returns `null` rather than skipping forward to one.
 */
export function advanceOnDevice(
  id: B10TriggerId,
  current: B10DeviceObservableState,
): B10DeviceObservableState | null {
  const rungs = deviceRungsFor(id)
  const at = rungs.indexOf(current)
  if (at === -1) return null
  return rungs[at + 1] ?? null
}

/**
 * The sentence a rung prints. TOTAL over the four, so every device-observable
 * state has words and no state can be rendered with a bare tick. Each one
 * names what the rung does NOT establish, because L41848's rule is the whole
 * point of the four being separate.
 */
export const DEVICE_RUNG_LINE: Readonly<Record<B10DeviceObservableState, string>> = {
  delivered:
    'Delivered to this device. Delivery is not opening — nothing here says the worker has seen it.',
  opened:
    'Opened on this device. Opening is not acknowledgement — nothing here says the worker has ' +
    'taken it in.',
  read:
    'Read on this device. This is where an ordinary inbox item ends; reading is not the business ' +
    'action and nothing gates on it.',
  acknowledged:
    'Acknowledged on this device. Acknowledgement is not the business action — the work itself is ' +
    'still the work itself.',
}

/**
 * The rule the four rungs exist to hold, in the source's own words, as a
 * sentence a screen prints. L41848 states it as this module's reconciliation
 * rule and the platform states it at L9175 and L51605.
 */
export const B10_HONESTY_RULE = {
  text:
    'sending is not delivery, delivery is not opening, opening is not acknowledgement, and ' +
    'acknowledgement is not the business action',
  sourceRef: 'L41848',
  platformRef: 'L51605 (the nineteen states), L9175 (the same rule at platform level)',
} as const

/* ==================================================================== *
 * THE INBOX ITSELF.
 * ==================================================================== */

/**
 * WHY THE BACK-FILL STAMP IS THE EVENT TIME AND WHERE THAT IS ACTUALLY
 * STATED, WHICH IS NOT §22.19.
 *
 * §22.19 says the inbox back-fills on login (L41780, L41856, `AC-B10-1`
 * L41904) and says nothing about which time a back-filled item carries. The
 * rule is in §30C, and it is stated four times: `AC-30C-1104` (L73787)
 * "Back-filled items display their original event time"; the channel fallback
 * at L73804, "the in-app item is created on restoration with its original
 * event time"; the same words as a node of that section's diagram (L73819);
 * and `AC-30C-1205` (L73842), "Replayed notifications carry their original
 * event time and are duplicate-suppressed".
 *
 * IT IS NOT THE HUB'S SCHEDULER BACKFILL AND THE TWO MUST NOT BE FOLDED
 * TOGETHER. L26804 and L27381 use "backfill against the original due time" for
 * a missed scheduled occurrence, which is a different mechanism with a
 * different clock — a DUE time rather than an EVENT time. This module carries
 * the notification rule and cites the notification lines.
 */
export const B10_BACKFILL_STAMP = {
  rule: 'Back-filled items display their original event time.',
  notTheArrivalTime:
    'A notice stamped with when it arrived would misdate the event it is about. A worker who was ' +
    'offline for two hours and logs in on a different tablet sees when each thing happened, not ' +
    'when their tablet caught up.',
  sourceRef: 'AC-30C-1104 · L73787',
  corroboration: 'AC-30C-1205 · L73842, and the channel fallback at L73804',
  notStatedInChapter22:
    '§22.19 states the back-fill and does not state which time a back-filled item carries. This ' +
    'build reads the rule off §30C and cites §30C, rather than attributing it to the module ' +
    'chapter that is silent on it.',
} as const

/** What the destination is offline, read from wave 0 rather than re-decided. */
export const B10_OFFLINE_TREATMENT = frontlineConnectivityTreatment({ kind: 'cached-read' })

/**
 * The offline sentence this module owns, which is stronger than the shared
 * treatment's and is the module card's own words. The shared treatment says
 * nothing implies the platform knows about this device; L41821 additionally
 * forbids implying anything arrived.
 */
export const B10_OFFLINE_STATEMENT = {
  text:
    'The inbox renders from the last back-fill as cached content, and the sync-status detail is ' +
    'live and local. No new notification can arrive, and no surface may imply one has.',
  sourceRef: 'L41821',
} as const

/**
 * THE INBOX'S OWN CONTENT IS ILLUSTRATIVE AND SAYS SO, and the two fields that
 * are NOT illustrative are the ones the rulings turn on: `trigger`, which
 * decides which device rungs the item can ever hold, and `stamp`, which is the
 * original event time rather than the arrival time.
 *
 * NEITHER ITEM IS A CHANGE NOTICE, and that is the shape of the module rather
 * than a gap in the fixture. A notified-class change notice is not an inbox
 * item: it is the first screen of the next execution (L41839, L41894). Putting
 * one in this list would make it dismissible by scrolling past, which is the
 * one thing L41796 forbids.
 */
export interface B10InboxItem {
  readonly id: string
  readonly subject: string
  /** The original event time, never the time the back-fill delivered it. */
  readonly stamp: string
  readonly trigger: B10TriggerId
  readonly startsAt: B10DeviceObservableState
}

export const B10_INBOX = [
  {
    id: 'illustrative-assignment',
    subject: 'You have been assigned RUN-2026-08-14-A on Assembly — Wheel Bolt Torque Verification.',
    stamp: 'the moment the assignment was made',
    trigger: 'any-notification-to-the-identity',
    startsAt: 'delivered',
  },
  {
    id: 'illustrative-escalation-outcome',
    subject:
      'The hold on LOT-WB-2291 was released. The release was decided elsewhere and this device ' +
      'applied the command.',
    stamp: 'the moment the release was decided',
    trigger: 'any-notification-to-the-identity',
    startsAt: 'delivered',
  },
] as const satisfies readonly B10InboxItem[]

export const B10_INBOX_IS_ILLUSTRATIVE =
  'Two illustrative items. Their subjects are this build’s; their stamps are the original event ' +
  'time and their state ladder is the one their own trigger row exercises, and neither of those ' +
  'is this build’s to choose.'

/**
 * SB-FL-019, the change notice, transcribed. L41894.
 *
 * THE ABSENCE IS PART OF THE STORYBOARD AND IS CARRIED AS A FIELD RATHER THAN
 * AS A CONVENTION: "There is no dismiss control and no way to reach the first
 * step without passing through it." A reader cannot see an absence, so the
 * screen prints it and the component suite asserts no control other than the
 * single named one exists on the notice.
 */
export const SB_FL_019 = {
  heading: 'This work has changed since you last did it',
  carries:
    "carrying the author's republish description verbatim, a list of the affected steps, and a " +
    'single control reading "Start"',
  notAStep: 'The first screen of the next execution is not a step.',
  absent: 'There is no dismiss control and no way to reach the first step without passing through it.',
  inSitu: 'Later, at each affected step, a small in-situ flag reads "Changed in this version."',
  control: 'Start',
  inSituFlag: 'Changed in this version.',
  sourceRef: 'SB-FL-019 · L41894',
} as const

/**
 * The source's own worked example, kept as the example it is. `Illustrative
 * Example` is the source's own marker on it, and it is carried so the change
 * notice on screen has a real author description rather than one this build
 * wrote for it.
 */
export const B10_ILLUSTRATIVE_EXAMPLE = {
  marker: 'Illustrative Example',
  version: 'v2.2.0',
  workflow: 'Assembly — Wheel Bolt Torque Verification',
  whatChanged: 'a notified change that adds a second verification step',
  whatDidNot:
    "Maya's RUN-2026-08-14-A, in flight on v2.1.0, is untouched. She was never interrupted mid-run " +
    'and never learned about the change as floor rumour.',
  sourceRef: 'L41896',
} as const

/* ==================================================================== *
 * THE TWO CHANGE TIERS.
 * ==================================================================== */

export interface B10ChangeTier {
  readonly tier: 'patch-level' | 'notified'
  readonly whatItIs: string
  readonly whatTheWorkerSees: string
  readonly trigger: B10TriggerId
  readonly sourceRef: string
}

export const B10_CHANGE_TIERS = [
  {
    tier: 'patch-level',
    whatItIs:
      'an adjusted tolerance range or similar parameter change that alters the evaluation, not ' +
      'what the worker does',
    whatTheWorkerSees:
      'Nothing. It applies at the next execution without ceremony, forcing no notification on the ' +
      'worker, with the change fully tracked in the version history.',
    trigger: 'patch-level-change',
    sourceRef: 'FUNC-B10-03-1-1 · L41868',
  },
  {
    tier: 'notified',
    whatItIs: 'a first-two-digit version change — steps added or altered, the method itself revised',
    whatTheWorkerSees:
      'The start of the next execution, with the first screen carrying a change notice built from ' +
      'the description the author is required to enter when republishing, and the affected steps ' +
      'flagged in situ where they meet them.',
    trigger: 'notified-class-change',
    sourceRef: 'FUNC-B10-03-2-1 · L41871',
  },
] as const satisfies readonly B10ChangeTier[]

/**
 * The rule both tiers obey, which the source's own diagram puts at the bottom
 * of both branches. Neither tier can reach a Run already under way.
 */
export const B10_VERSION_PINNING_HOLDS = {
  text:
    'Never interrupt an in-flight Run; version pinning holds and the notice belongs to the ' +
    'boundary of the next execution.',
  sourceRef: 'FUNC-B10-03-2-3 · L41873',
  diagramRef: 'L41888',
} as const

/**
 * THE DEVICE END OF `DEC-LANEB-001`, WHICH IS THIS MODULE'S OWN ANGLE ON A
 * DECISION THE SHARED CANON ALREADY HOLDS.
 *
 * The readings and the build position live in `@/disclosure/decisions` — the
 * canon's `DecisionId` union has `DEC-LANEB-001` as a member, so this module
 * renders `DecisionDisclosure` and writes NO second spelling of either
 * reading. What is recorded here is only the consequence at this end, which
 * the canon record does not carry because it was raised on `SURF-STU`.
 *
 * THE CONSEQUENCE: the command channel has exactly one class for a version
 * change, and its own Authority column folds both routes into one phrase —
 * "Publication authority, including Lane B auto-published patches" (L39666).
 * So a `CMD-FL-VERSION` that arrived by auto-publication and one that arrived
 * through the three-signature chain are the SAME CLASS carrying the SAME
 * fields, and the device cannot tell them apart. A change notice that said
 * "approved by Author, Reviewer and Release Authority" would therefore be a
 * claim the device has no basis for on half its inputs.
 */
export const B10_LANEB_AT_THE_DEVICE_END = {
  whatTheDeviceReceives: 'CMD-FL-VERSION' satisfies FrontlineCommandClass,
  authorityColumn:
    FL_COMMAND_CLASSES.find((c) => c.id === 'CMD-FL-VERSION')?.authority ??
    'the command channel does not carry CMD-FL-VERSION',
  consequence:
    'One class carries both routes, so at the device end an auto-published Lane B patch is ' +
    'indistinguishable from a change that passed the three-signature chain. The change notice on ' +
    'this surface therefore says what changed and who described it, and never that the chain ran.',
  whatTheModuleSays:
    "Treat Lane B auto-published patches exactly this way, arriving per the tenant's adoption " +
    'timing. Roles allowed: Quality Manager and above decided the change in the Client Command ' +
    'Center. Roles prohibited: nothing auto-approves.',
  sourceRef: 'FUNC-B10-03-1-2 · L41869',
  classRef: 'CMD-FL-VERSION · L39666',
  statusRef: 'L41927',
} as const

/* ==================================================================== *
 * THE THIRTEEN FUNCTIONALITIES, AND `AC-FL-011-1`.
 * ==================================================================== */

export interface B10Functionality {
  readonly id: string
  readonly statement: string
  readonly purpose: string
  readonly rolesAllowed: string
  /** `null` where the source states no roles-prohibited clause. One of thirteen. */
  readonly rolesProhibited: string | null
  readonly connectivity: string
  /** The Fallback clause's own words. */
  readonly fallbackClause: string
  /** The `FB-FL-*` identifiers that clause names. Empty where it names none. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

export const B10_FUNCTIONALITIES = [
  {
    id: 'FUNC-B10-01-1-1',
    statement:
      'Back-fill the inbox on login so a worker logging in on any device sees the notifications ' +
      'addressed to their identity; the inbox follows the login, not the hardware.',
    purpose: 'identity travels with the worker',
    rolesAllowed: 'Worker, own identity only',
    rolesProhibited: 'all others',
    connectivity: 'Online: back-fills. Offline: renders the last back-filled set as cached content.',
    fallbackClause: 'FB-FL-CORE-01',
    patterns: ['FB-FL-CORE-01'],
    sourceRef: 'FUNC-B10-01-1-1 · L41856',
  },
  {
    id: 'FUNC-B10-01-1-2',
    statement: 'Carry the honest sync-status detail in the inbox.',
    purpose: 'one place for state the worker may want to check',
    rolesAllowed: 'Worker',
    rolesProhibited: 'no resolution action is offered',
    connectivity: 'Online and offline: the sync detail is always live and local.',
    fallbackClause: 'FB-FL-UP-01',
    patterns: ['FB-FL-UP-01'],
    sourceRef: 'FUNC-B10-01-1-2 · L41857',
  },
  {
    id: 'FUNC-B10-01-2-1',
    statement:
      'Let general notifications carry no read obligation, so a worker may leave them unread and ' +
      'nothing gates on having opened the inbox.',
    purpose: 'support, not surveillance; an inbox that gates work becomes a compliance instrument',
    rolesAllowed: 'Worker',
    rolesProhibited: 'no platform behaviour may require an inbox open',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Not applicable — the absence of an obligation cannot fail.',
    patterns: [],
    sourceRef: 'FUNC-B10-01-2-1 · L41859',
  },
  {
    id: 'FUNC-B10-01-2-2',
    statement: 'Ensure in-application notifications cannot be muted.',
    purpose: 'platform-wide rule; the worker may ignore, but the platform does not hide',
    rolesAllowed: 'nobody may mute',
    rolesProhibited: 'every role, including Tenant Admin',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Not applicable — a prohibition has no failure mode.',
    patterns: [],
    sourceRef: 'FUNC-B10-01-2-2 · L41860',
  },
  {
    id: 'FUNC-B10-02-1-1',
    statement:
      'Deliver notifications only when the worker opens the application and on sync, never as ' +
      'interruptive alerts.',
    purpose: 'the open-application assumption made real by the shared-station posture',
    rolesAllowed: 'Worker',
    rolesProhibited: 'no build may enable push in this scope',
    connectivity: 'Online: on sync. Offline: nothing new arrives.',
    fallbackClause: 'FB-FL-CORE-01',
    patterns: ['FB-FL-CORE-01'],
    sourceRef: 'FUNC-B10-02-1-1 · L41863',
  },
  {
    id: 'FUNC-B10-02-1-2',
    statement: 'Make no real-time push promise an offline floor cannot keep.',
    purpose: 'the offline-honesty line',
    rolesAllowed: 'all',
    rolesProhibited: 'no surface may imply an alert reached an offline device',
    connectivity: 'Online and offline: identical position.',
    fallbackClause: 'Not applicable — a refusal to promise cannot fail.',
    patterns: [],
    sourceRef: 'FUNC-B10-02-1-2 · L41864',
  },
  {
    id: 'FUNC-B10-02-1-3',
    statement:
      'Restrict channels to in-application and email, platform-wide, at every tier, with Short ' +
      'Message Service, operating-system push, webhooks, external recipients, and quiet hours all ' +
      'outside V1.',
    purpose: 'two channels, stated once',
    rolesAllowed: 'nobody may add a channel',
    rolesProhibited: 'every role',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Not applicable — an excluded channel has no failure mode.',
    patterns: [],
    sourceRef: 'FUNC-B10-02-1-3 · L41865',
  },
  {
    id: 'FUNC-B10-03-1-1',
    statement:
      'Apply a patch-level change — an adjusted tolerance range or similar parameter change that ' +
      'alters the evaluation, not what the worker does — at the next execution without ceremony, ' +
      'forcing no notification on the worker, with the change fully tracked in the version history.',
    purpose:
      "do not spend the worker's attention on something that does not change their actions",
    rolesAllowed: 'automatic',
    rolesProhibited: 'no notification is forced',
    connectivity: 'Online: arrives as a command. Offline: waits.',
    fallbackClause: 'FB-FL-CMD-01',
    patterns: ['FB-FL-CMD-01'],
    sourceRef: 'FUNC-B10-03-1-1 · L41868',
  },
  {
    id: 'FUNC-B10-03-1-2',
    statement:
      "Treat Lane B auto-published patches exactly this way, arriving per the tenant's adoption " +
      'timing.',
    purpose: 'consistency between learned and authored patches',
    rolesAllowed: 'Quality Manager and above decided the change in the Client Command Center',
    rolesProhibited: 'nothing auto-approves',
    connectivity: 'Online: arrives. Offline: waits.',
    fallbackClause: 'FB-FL-CMD-01',
    patterns: ['FB-FL-CMD-01'],
    sourceRef: 'FUNC-B10-03-1-2 · L41869',
  },
  {
    id: 'FUNC-B10-03-2-1',
    statement:
      'Present a first-two-digit version change — steps added or altered, the method itself ' +
      'revised — at the start of the next execution, with the first screen carrying a change ' +
      'notice built from the description the author is required to enter when republishing.',
    purpose: 'the notice is part of starting the work, not an inbox item that can be ignored',
    rolesAllowed: 'Worker sees it',
    rolesProhibited: 'nobody may suppress it',
    connectivity: 'Online: arrives as a command. Offline: waits with the command.',
    fallbackClause: 'FB-FL-CMD-01',
    patterns: ['FB-FL-CMD-01'],
    sourceRef: 'FUNC-B10-03-2-1 · L41871',
  },
  {
    id: 'FUNC-B10-03-2-2',
    statement: 'Flag the affected steps in situ where the worker meets them.',
    purpose: 'the notice at the start plus the reminder at the point of change',
    rolesAllowed: 'Worker',
    rolesProhibited: 'nobody may suppress the flags',
    connectivity:
      'Online and offline: identical, because the flags travel in the package.',
    fallbackClause: 'FB-FL-PKG-01',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'FUNC-B10-03-2-2 · L41872',
  },
  {
    id: 'FUNC-B10-03-2-3',
    statement:
      'Never interrupt an in-flight Run; version pinning holds and the notice belongs to the ' +
      'boundary of the next execution.',
    purpose: "no change under the worker's feet",
    rolesAllowed: 'automatic',
    rolesProhibited: 'nobody may force a mid-Run change',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'FB-FL-PKG-01',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'FUNC-B10-03-2-3 · L41873',
  },
  {
    id: 'FUNC-B10-03-3-1',
    statement: 'Optionally attach a short explanatory video to a notified change.',
    purpose: 'richer explanation of a method change',
    rolesAllowed: 'Client Decision Required — not committed',
    // THE ONE OF THIRTEEN WITH NO ROLES-PROHIBITED CLAUSE. Recorded as absent
    // rather than filled from its neighbours.
    rolesProhibited: null,
    connectivity:
      'Online and offline: Client Decision Required — package economics are precisely the open ' +
      'question.',
    fallbackClause: 'FB-FL-PKG-01',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'FUNC-B10-03-3-1 · L41875',
  },
] as const satisfies readonly B10Functionality[]

/**
 * `AC-FL-011-1` (L40151) asks every functionality to name at least one
 * `FB-FL-*` pattern. FOUR OF THIRTEEN NAME NONE, and every one gives the
 * source's own ground for it in the Fallback clause itself: an absent
 * obligation, a prohibition, a refusal to promise, and an excluded channel.
 *
 * REPORTED, NOT FILLED. An assigned pattern is indistinguishable from a real
 * one forever afterwards, and the criterion then reads clean because nobody
 * looked. The gap is derived from `patterns.length` rather than listed
 * separately, so a functionality cannot be dropped from the report by being
 * forgotten here.
 */
export const B10_FUNCTIONALITIES_NAMING_NO_PATTERN = B10_FUNCTIONALITIES.filter(
  (f) => f.patterns.length === 0,
).map((f) => ({ id: f.id, ground: f.fallbackClause, sourceRef: f.sourceRef }))

/**
 * THREE PARTS OF THE SOURCE GIVE THIS MODULE THREE DIFFERENT FALLBACK SETS,
 * and this build carries all three and reconciles none. No `DEC` identifier is
 * attached to the divergence anywhere.
 *
 *   §22.9's module map      2 — FB-FL-CORE-01 (L40130), FB-FL-CMD-01 (L40135)
 *   the module card         3 — the two above plus FB-FL-UP-01 (L41846)
 *   the functionality clauses 4 — the three above plus FB-FL-PKG-01
 *
 * The map is the reading that omits most: FB-FL-UP-01's map row (L40134) lists
 * `MOD-FL-A4` and `MOD-FL-A6` and not this module, while this module's card
 * names it "for read-state upload"; and FB-FL-PKG-01's map row (L40132) lists
 * `MOD-FL-A2`, `MOD-FL-A3` and `MOD-FL-A6` and not this module, while three of
 * this module's own functionalities name it. Measured on wave 1 and wave 2
 * modules the shape was identical each time — A1 2/3/4, A3 4/6/7, A5 3/4/7 —
 * and this module reads 2/3/4.
 */
export const B10_MAPPED_PATTERNS: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-B10')

export const B10_CARD_PATTERNS = [
  'FB-FL-CORE-01',
  'FB-FL-CMD-01',
  'FB-FL-UP-01',
] as const satisfies readonly FrontlineFallbackId[]

export const B10_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(B10_FUNCTIONALITIES.flatMap((f) => f.patterns)),
] as const satisfies readonly FrontlineFallbackId[]

export const B10_PATTERN_DIVERGENCE = {
  note:
    "Three readings of one module's fallback set, carried apart because the source does not " +
    'reconcile them and attaches no decision identifier to the divergence. The §22.9 map is the ' +
    'narrowest, the card adds the read-state upload pattern, and the functionality clauses add the ' +
    'package pattern that carries the in-situ step flags. Nothing here picks one.',
  mapRef: 'L40130 (FB-FL-CORE-01), L40135 (FB-FL-CMD-01)',
  cardRef: 'FB-FL-CORE-01 · L41846',
  omittedByTheMap: 'FB-FL-UP-01 · L40134, FB-FL-PKG-01 · L40132',
} as const

/* ==================================================================== *
 * THE ACCEPTANCE CRITERIA. Eight, L41904-L41911.
 * ==================================================================== */

export interface B10AcceptanceCriterion {
  readonly id: string
  readonly text: string
  readonly sourceRef: string
}

export const B10_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-B10-1',
    text: 'The inbox is scoped to the logged-in identity and back-fills on login on any conformant device.',
    sourceRef: 'AC-B10-1 · L41904',
  },
  {
    id: 'AC-B10-2',
    text: 'No operating-system push notification is registered, requested, or delivered by the application.',
    sourceRef: 'AC-B10-2 · L41905',
  },
  {
    id: 'AC-B10-3',
    text: 'General notifications carry no read obligation and no platform behaviour gates on inbox opening.',
    sourceRef: 'AC-B10-3 · L41906',
  },
  {
    id: 'AC-B10-4',
    text: 'In-application notifications cannot be muted by any role.',
    sourceRef: 'AC-B10-4 · L41907',
  },
  {
    id: 'AC-B10-5',
    text: 'A patch-level change forces no worker notification and is tracked in the version history.',
    sourceRef: 'AC-B10-5 · L41908',
  },
  {
    id: 'AC-B10-6',
    text: 'A notified change is presented on the first screen of the next execution and cannot be bypassed.',
    sourceRef: 'AC-B10-6 · L41909',
  },
  {
    id: 'AC-B10-7',
    text: 'No change of either tier interrupts an in-flight Run.',
    sourceRef: 'AC-B10-7 · L41910',
  },
  {
    id: 'AC-B10-8',
    text: 'Only in-application and email channels exist; no additional channel is present in the build.',
    sourceRef: 'AC-B10-8 · L41911',
  },
] as const satisfies readonly B10AcceptanceCriterion[]

/**
 * The three denial tests this module's refusals answer to. L41919-L41921.
 * Rendered beside the refusals rather than filed only in a suite, because the
 * refusals are the module's product and a reader cannot see what was tried.
 */
export const B10_DENIAL_TESTS = [
  {
    id: 'TEST-B10-3',
    text: "Attempt to view another identity's inbox by session switch and by deep link and assert both fail.",
    sourceRef: 'TEST-B10-3 · L41919',
  },
  {
    id: 'TEST-B10-4',
    text: 'Attempt to mute an in-application notification and assert no control exists.',
    sourceRef: 'TEST-B10-4 · L41920',
  },
  {
    id: 'TEST-B10-5',
    text: 'Attempt to bypass a notified-change notice and assert no path to the first step exists.',
    sourceRef: 'TEST-B10-5 · L41921',
  },
] as const

/* ==================================================================== *
 * WHAT DID NOT LINE UP.
 * ==================================================================== */

export interface B10SourceFinding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  readonly sourceRef: string
}

export const B10_SOURCE_FINDINGS = [
  {
    what: 'The back-fill stamp rule is real and is not in this module’s chapter.',
    evidence:
      '§22.19 states the back-fill four times and never says which time a back-filled item carries. ' +
      'The rule that it carries the original event time is §30C’s, stated at AC-30C-1104, again at ' +
      'AC-30C-1205 for replay, and again in the channel fallback prose.',
    notClosedBecause:
      'Nothing needs closing — it is a citation correction. This module renders the rule and cites ' +
      '§30C for it, rather than attributing it to a chapter that is silent on it. Folding it into ' +
      'the Hub’s scheduler backfill, which uses the original DUE time, would be a second mistake ' +
      'on top of the first.',
    sourceRef: 'AC-30C-1104 · L73787',
  },
  {
    what: 'L41808’s own gloss reaches six of the fifteen states it excludes, not fifteen.',
    evidence:
      'The line names four states the device observes and writes, then says "the earlier states are ' +
      'server-side and are never inferred by the device". Six states are earlier than delivered. ' +
      'Nine follow acknowledged — claimed, acted, escalated, resolved, expired, superseded, ' +
      'cancelled, failed, reconciled — and the word earlier does not reach them.',
    notClosedBecause:
      'The first clause is exhaustive for the device, so all fifteen are off the device either way ' +
      'and no behaviour turns on it. What would be wrong is quoting the gloss over nine states it ' +
      'was not written about, so the module records which ground each state is off the device on.',
    sourceRef: 'L41808',
  },
  {
    what: 'This module’s dispatch assigned it DEC-MSG-001, and the module has no anchor for it.',
    evidence:
      'DEC-MSG-001 is the fixed worker-facing compliance-suspension message in its two wordings. It ' +
      'occurs nowhere in §22.19: this module’s Source status paragraph names only DEC-LANEB-001. ' +
      'The renderings the dispatch listed belong to MOD-FL-A1 and MOD-FL-A7 — the surface-level ' +
      'terminal safe state, FB-FL-SEC-01, FUNC-A7-05-3-1 and SB-FL-016.',
    notClosedBecause:
      'The dispatch asked this module to report the second wording as unrecorded if it were ' +
      'recorded nowhere in this build. It is recorded, twice, and this module is not a third place ' +
      'for it: MOD-FL-A1 and MOD-FL-A7 both carry both wordings with the L44923 divergence beside ' +
      'them. A third spelling of one decision is the defect the disclosure rule exists to prevent, ' +
      'so this module discloses where the decision lives and prints neither wording.',
    sourceRef: 'L41927',
  },
  {
    what: 'One functionality is Client Decision Required and carries no DEC identifier.',
    evidence:
      'FUNC-B10-03-3-1, the optional explanatory video, is classified SoW Fact as an option to ' +
      'explore and Client Decision Required as to whether it ships, with its Roles allowed and its ' +
      'connectivity clause both reading Client Decision Required. It is the only functionality of ' +
      'the thirteen with no Roles prohibited clause.',
    notClosedBecause:
      'The source attaches no DEC identifier to it anywhere, and filing it under a neighbouring one ' +
      'because that one happens to exist is forbidden. It is disclosed as an open item with no ' +
      'identifier, which is what a client searching for it would need to be told.',
    sourceRef: 'FUNC-B10-03-3-1 · L41875',
  },
] as const satisfies readonly B10SourceFinding[]

/**
 * THE OPEN ITEM THIS MODULE CARRIES THAT THE SOURCE NEVER NAMED.
 *
 * Shape borrowed from `MOD-FL-B9`'s record of the same situation: an
 * unresolved question with no `DEC-*` identifier is disclosed as exactly that,
 * because the alternative is filing it under a neighbour and making it
 * unfindable under its own subject forever.
 */
export const B10_EXPLANATORY_VIDEO_OPEN = {
  title: 'Whether the optional explanatory video ships.',
  question:
    'Can a short explanatory video be attached to a notified change without breaking the offline ' +
    'package economics?',
  whatTheSourceSays:
    'Carried as a build-time option to explore, added only if it fits cleanly within the offline ' +
    'package economics, and not a committed behaviour of this release.',
  whatThisBuildDraws:
    'Nothing. No video affordance exists on this screen, and the change notice carries the ' +
    "author's description and the affected-step list only. An option to explore is not a feature " +
    'to render.',
  noDecisionIdentifier:
    'The source attaches no DEC-* identifier to this anywhere. It is disclosed under its own ' +
    'subject rather than filed under a neighbouring identifier that already exists.',
  sourceRef: 'FUNC-B10-03-3-1 · L41875',
} as const

/**
 * WHERE THE DECISIONS THIS MODULE TOUCHES ARE ACTUALLY DISCLOSED.
 *
 * `DEC-LANEB-001` IS IN THE SHARED CANON, which is the uncommon case on this
 * surface: the canon holds twenty-nine records and thirteen Frontline
 * identifiers have been confirmed absent from it. This one is a member of the
 * exported `DecisionId` union, so this module renders `DecisionDisclosure` and
 * writes no local stand-in and no second spelling of either reading. There is
 * nothing here to expire.
 *
 * `DEC-MSG-001` IS NOT IN THE CANON AND IS NOT THIS MODULE'S EITHER. It is
 * disclosed in full, with both wordings and the divergence, by `MOD-FL-A1` and
 * `MOD-FL-A7`, whose functionalities and storyboard actually carry the
 * message. This module has no occurrence of it in §22.19 and prints neither
 * wording.
 */
export const B10_WHERE_ITS_DECISIONS_LIVE = [
  {
    decisionRef: 'DEC-LANEB-001',
    where: 'The shared decision canon, rendered by DecisionDisclosure on this screen.',
    why:
      "This module's Source status names it — Lane B patch behaviour carries DEC-LANEB-001 — and " +
      'FUNC-B10-03-1-2 preserves the contradiction. The canon already holds the readings, so this ' +
      'screen renders them from there and adds only the consequence at the device end.',
    sourceRef: 'L41927, FUNC-B10-03-1-2 · L41869',
  },
  {
    decisionRef: 'DEC-MSG-001',
    where: 'MOD-FL-A1 and MOD-FL-A7, both of which carry Reading A and Reading B and the divergence.',
    why:
      'It is the fixed worker-facing compliance-suspension message, and §22.19 contains no ' +
      'occurrence of it. FUNC-A7-05-3-1 shows the message and SB-FL-016 is the screen that shows ' +
      'it. This module states where it is disclosed and prints neither wording, because a third ' +
      'spelling of one decision is how two screens start disclosing it differently.',
    sourceRef: 'DEC-MSG-001 · L5263 (readings L5265-L5266), TEST-SCR-FL-006 · L48703',
  },
] as const satisfies readonly {
  readonly decisionRef: string
  readonly where: string
  readonly why: string
  readonly sourceRef: string
}[]
