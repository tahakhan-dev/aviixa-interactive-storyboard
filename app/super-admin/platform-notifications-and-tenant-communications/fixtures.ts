/**
 * MOD-SA-14 — Platform Notifications and Tenant Communications.
 *
 * Seeded fixture data for the broadcast composer and send history screen
 * (annotated SCR-SA-20, L42812/L45614; storyboard SB-SA-14, L45614). Nothing
 * here is computed: there is no clock, no network and no notification
 * machinery. Every timestamp is a fixed label, every state is a rendered
 * value the reader steps through.
 *
 * Every entry below is traced to the frozen source. Where the source names
 * no affordance, `NOTIF_UNSPECIFIED_IN_SOURCE` names the gap rather than
 * this file filling it with a plausible invention.
 */
import type { RoleId } from '@/domain/roles'

/* ------------------------------------------------------------------ *
 * The four platform roles — a view switcher, never a login (spec §8).
 * ------------------------------------------------------------------ */

export interface NotifPlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
}

export const NOTIF_PLATFORM_ROLES = [
  { id: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin', roleAnnotation: 'ROLE-PLAT-ROOT' },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN' },
  { id: 'PLATFORM_ENGINEER', name: 'Platform Engineer', roleAnnotation: 'ROLE-PLAT-ENG' },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP' },
] as const satisfies readonly NotifPlatformRole[]

/* ------------------------------------------------------------------ *
 * The two channels — closed at two (AC-SA-14-01, L45684).
 * ------------------------------------------------------------------ */

/**
 * `AC-SA-14-01` (L45684): "Exactly two channels exist — in-app and email —
 * and no configuration adds a third." Corroborated independently by
 * `AC-SA-07-06-01` (L44281, "platform-wide at every tier") and the numeric
 * facts at L44281 and L47096. This is one of the closed sets the spec lists
 * as a build input (§2.4), so it is a closed union with a real
 * exhaustiveness check, not a widened array.
 */
export type NotifChannelId = 'in-app' | 'email'

export interface NotifChannelDefinition {
  readonly id: NotifChannelId
  readonly name: string
  readonly description: string
  readonly sourceRef: string
}

export const NOTIF_CHANNELS = [
  {
    id: 'in-app',
    name: 'In-app',
    description:
      'An in-app banner on the tenant’s own surfaces. It cannot be muted by a tenant user (AC-SA-14-02), and it is what remains present when email delivery fails (FB-SA-07).',
    sourceRef: 'AC-SA-14-01 L45684, AC-SA-14-02 L45684, FB-SA-07 L45682',
  },
  {
    id: 'email',
    name: 'Email',
    description:
      'Email to the tenant’s recorded contacts. There is no second email vendor: a vendor failure is retried and recorded per recipient, never hidden (FB-SA-07).',
    sourceRef: 'AC-SA-14-01 L45684, FB-SA-07 L45682',
  },
] as const satisfies readonly NotifChannelDefinition[]

type MissingFromChannels = Exclude<NotifChannelId, (typeof NOTIF_CHANNELS)[number]['id']>
const _channelsExhaustive: MissingFromChannels extends never ? true : never = true
void _channelsExhaustive

/* ------------------------------------------------------------------ *
 * OBJ-SA-BROADCAST — thirteen states (L45633).
 * ------------------------------------------------------------------ */

/**
 * The thirteen states the extract records for `OBJ-SA-BROADCAST` at L45633.
 * The companion state vocabulary at L45634 lists the same set as eleven
 * ordered states with `failed` and `cancelled` called out as alternates —
 * the same thirteen values either way, which is why this list is ordered as
 * the eleven followed by the two branches.
 *
 * `AC-SA-14-06` (L45684) is the reason `delivered`, `opened` and
 * `acknowledged` are three separate members here and are rendered as three
 * separate counts on screen: they are tracked as distinct states and never
 * conflated into one number.
 */
export type BroadcastState =
  | 'drafted'
  | 'pending root approval'
  | 'scheduled'
  | 'snapshot taken'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'read'
  | 'acknowledged'
  | 'reconciled'
  | 'failed'
  | 'cancelled'

export const BROADCAST_STATES = [
  'drafted',
  'pending root approval',
  'scheduled',
  'snapshot taken',
  'sending',
  'sent',
  'delivered',
  'opened',
  'read',
  'acknowledged',
  'reconciled',
  'failed',
  'cancelled',
] as const satisfies readonly BroadcastState[]

type MissingFromBroadcastStates = Exclude<BroadcastState, (typeof BROADCAST_STATES)[number]>
const _broadcastStatesExhaustive: MissingFromBroadcastStates extends never ? true : never = true
void _broadcastStatesExhaustive

/* ------------------------------------------------------------------ *
 * Targets — the axis AC-SA-14-03 turns on.
 * ------------------------------------------------------------------ */

/**
 * `AC-SA-14-03` (L45684): "All-tenant broadcasts require root approval
 * (critical class); single-tenant notices do not." `all-tenant-broadcast` is
 * one of the eleven entries in `CRITICAL_ACTIONS`, so the class badge that
 * replaces the action bar here is the same rendering the rest of the console
 * uses for a critical-class action seen by a non-root role (spec §3).
 */
export type BroadcastTarget = 'single-tenant' | 'all-tenant'

export interface BroadcastTargetDefinition {
  readonly id: BroadcastTarget
  readonly label: string
  readonly criticalClass: boolean
  readonly sourceRef: string
}

export const BROADCAST_TARGETS = [
  {
    id: 'single-tenant',
    label: 'A single tenant',
    criticalClass: false,
    sourceRef: 'AC-SA-14-03 L45684',
  },
  {
    id: 'all-tenant',
    label: 'Every tenant',
    criticalClass: true,
    sourceRef: 'AC-SA-14-03 L45684, CRITICAL_ACTIONS L55942',
  },
] as const satisfies readonly BroadcastTargetDefinition[]

type MissingFromTargets = Exclude<BroadcastTarget, (typeof BROADCAST_TARGETS)[number]['id']>
const _targetsExhaustive: MissingFromTargets extends never ? true : never = true
void _targetsExhaustive

/* ------------------------------------------------------------------ *
 * Send history and the audience snapshot.
 * ------------------------------------------------------------------ */

export interface SendHistoryRow {
  readonly id: string
  readonly subject: string
  readonly target: BroadcastTarget
  readonly channels: readonly NotifChannelId[]
  readonly state: BroadcastState
  /** Tenant count in the snapshot stored at send time (AC-SA-14-04). */
  readonly snapshotTenants: number
  readonly snapshotTakenAt: string
  readonly note: string
}

/**
 * The illustrative audience size of 47 tenants for an all-tenant
 * maintenance broadcast is the source's own example (L45616).
 *
 * Every count here is a count of TENANTS. Nothing on this module counts
 * below the tenant, and nothing renders a proportion — a broadcast row is a
 * commercial-and-operational record of what was sent to which tenants, not
 * a measure of anybody's behaviour.
 */
export const SEND_HISTORY = [
  {
    id: 'BC-2201',
    subject: 'Planned maintenance window — platform upgrade',
    target: 'all-tenant',
    channels: ['in-app', 'email'],
    state: 'reconciled',
    snapshotTenants: 47,
    snapshotTakenAt: 'as of 14 August, 09:05',
    note: 'The source’s own illustrative all-tenant maintenance broadcast (L45616). Reconciled against the stored snapshot.',
  },
  {
    id: 'BC-2202',
    subject: 'Incident update — degraded agent responses',
    target: 'all-tenant',
    channels: ['in-app'],
    state: 'sending',
    snapshotTenants: 47,
    snapshotTakenAt: 'as of 16 August, 11:40',
    note: 'Raised from a platform incident (WF-PLT-008). In flight: it is shown in its own state and is never rendered as sent.',
  },
  {
    id: 'BC-2203',
    subject: 'Pilot onboarding notice',
    target: 'single-tenant',
    channels: ['in-app', 'email'],
    state: 'acknowledged',
    snapshotTenants: 1,
    snapshotTakenAt: 'as of 12 August, 16:20',
    note: 'A single-tenant notice needs no root approval (AC-SA-14-03).',
  },
  {
    id: 'BC-2204',
    subject: 'Retention horizon change notice',
    target: 'single-tenant',
    channels: ['email'],
    state: 'failed',
    snapshotTenants: 1,
    snapshotTakenAt: 'as of 15 August, 08:10',
    note: 'Email vendor failure. The in-app banner stays present and unmutable, the per-recipient failure is recorded rather than hidden, and there is no second vendor (FB-SA-07).',
  },
  {
    id: 'BC-2205',
    subject: 'Locale pack availability',
    target: 'all-tenant',
    channels: ['in-app'],
    state: 'pending root approval',
    snapshotTenants: 47,
    snapshotTakenAt: 'no snapshot stored yet',
    note: 'Submitted by an Admin, waiting on the root. An all-tenant broadcast is critical class (AC-SA-14-03).',
  },
] as const satisfies readonly SendHistoryRow[]

/**
 * The reconciliation aggregate for BC-2201, the one reconciled row.
 * `AC-SA-14-06`: three distinct counts, never one combined number.
 * `AC-SA-01-03`: an as-of time always, and stale-with-age or unavailable
 * when it degrades — never a zero, never a blank.
 */
export interface ReconciliationAggregate {
  readonly broadcastId: string
  readonly snapshotTenants: number
  readonly deliveredTenants: number
  readonly openedTenants: number
  readonly acknowledgedTenants: number
  readonly failedTenants: number
}

export const RECONCILIATION = {
  broadcastId: 'BC-2201',
  snapshotTenants: 47,
  deliveredTenants: 45,
  openedTenants: 39,
  acknowledgedTenants: 31,
  failedTenants: 2,
} as const satisfies ReconciliationAggregate

export const RECONCILIATION_AS_OF = 'as of 16 August, 11:55'
export const RECONCILIATION_STALE_AS_OF = 'as of 16 August, 07:55 — 4 hours old'
export const RECONCILIATION_ORIGIN =
  'from the audience snapshot stored with BC-2201'

/* ------------------------------------------------------------------ *
 * Prohibitions rendered ABSENT (spec §3).
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
}

export const NOTIF_ABSENT_CONTROLS = [
  {
    label: 'Add or configure a notification channel',
    note: 'No such control exists for any account, including the root. Exactly two channels exist — in-app and email — and no configuration adds a third (AC-SA-14-01, L45684).',
  },
  {
    label: 'Mute or dismiss an in-app banner',
    note: 'No such control exists anywhere, on this console or on a tenant surface: in-app banners cannot be muted by any tenant user (AC-SA-14-02, L45684). A muted banner would make a notification optional, and the in-app channel is what remains when email fails.',
  },
  {
    label: 'Take a fresh audience snapshot for a re-send',
    note: 'No such control exists. A re-send after partial failure uses the stored snapshot rather than a fresh one (AC-SA-14-07, L45684), so the set of tenants a message was addressed to cannot change after the fact.',
  },
  {
    label: 'Apply a suspension, hold, qualification block or device command from a broadcast',
    note: 'No such control exists here for any account. A notification never enforces a hold, a qualification block, an authorisation, an approval, a suspension or a device command (AC-021-02, L69700), and no notification is the sole enforcement of any control (AC-WF-OPS-003-04, L54509). Enforcement lives in the authorisation layer and, on devices, in the applied command.',
  },
  {
    label: 'Open a tenant’s own record from a broadcast row',
    note: 'No such link exists. Record-level tenant content is reachable only inside a named session under one of the three access classes, and there is no ambient browsing anywhere on this console (AC-SA-000-07, AC-SEC-801). The row below resolves to a session-request form instead.',
  },
] as const satisfies readonly AbsentControl[]

/* ------------------------------------------------------------------ *
 * Workflows.
 * ------------------------------------------------------------------ */

export interface NotifWorkflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  /** How this entry was tied to MOD-SA-14 — stated, never assumed. */
  readonly matchedBy: string
}

export const NOTIF_WORKFLOWS = [
  {
    id: 'unnumbered — §23.14 broadcast',
    name: 'Compose, target, approve, snapshot, deliver, reconcile',
    actor: 'Admin composes; Root Super Admin approves an all-tenant target',
    trigger: 'An Admin composes an announcement with type, severity, body and optional action link',
    terminalStates: [
      'delivered with per-recipient outcomes reconciled against the audience snapshot',
      'cancelled before its window',
    ],
    matchedBy:
      'line proximity — the entry carries no module_id and sits at L45586, inside this module’s own block (its controls at L45614, its module record at L45618)',
  },
  {
    id: 'WF-OPS-003',
    name: 'Raising, delivering and escalating a notification',
    actor: 'The notification service',
    trigger: 'An event occurs that has recipients',
    terminalStates: [
      'escalation never resolves to no one, the fallback is visibly marked, and the underlying enforcement is already in force',
    ],
    matchedBy:
      'name and key_functions — the extraction at L54495 lists WF-OPS-003 among MOD-SA-14’s key functions. It is a cross-surface workflow; this console renders only its platform-to-tenant leg, and OBJ-SA-BROADCAST’s own vocabulary rather than the eleven-state machine drawn at L54514',
  },
  {
    id: 'WF-PLT-008',
    name: 'Managing a platform incident',
    actor: 'Platform Admin and Platform Engineer',
    trigger: 'Degradation detected across more than one tenant',
    terminalStates: [
      'the floor keeps running offline, per-tenant panels keep showing honest local truth, and the platform makes no claim about anything it cannot observe',
    ],
    matchedBy:
      'key_functions — the extraction at L55259 lists WF-PLT-008 and FUNC-SA-NOTIFY-TENANTS against MOD-SA-14. The incident itself lives in MOD-SA-01 (D6); only the tenant communication it raises belongs here',
  },
] as const satisfies readonly NotifWorkflow[]

/* ------------------------------------------------------------------ *
 * Unspecified in source — named, never invented.
 * ------------------------------------------------------------------ */

export interface UnspecifiedAffordance {
  readonly affordance: string
  readonly note: string
}

export const NOTIF_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'A control that cancels a scheduled broadcast',
    note: '`cancelled` is one of the thirteen broadcast states (L45633) and "cancelled before its window" is a terminal state of the §23.14 workflow (L45586), but the source defines no control that reaches it and names no role that holds one. Nothing is drawn.',
  },
  {
    affordance: 'A scheduling or send-window control',
    note: '`scheduled` is a broadcast state and the workflow speaks of a window, but no affordance that sets one is defined anywhere in the source.',
  },
  {
    affordance: 'A control that edits or discards a draft',
    note: '`drafted` is a broadcast state; no edit, discard or draft-list control is named. The composer below therefore composes and sends, and does nothing to an existing draft.',
  },
  {
    affordance: 'The closed vocabulary of announcement types',
    note: 'The §23.14 workflow names "type" as a composer field (L45586) and the module record names maintenance, incident and informational as purposes (L45618) — but no closed field vocabulary is enumerated. The field is free text here rather than an invented list.',
  },
  {
    affordance: 'The closed vocabulary of broadcast severities',
    note: 'The same workflow names "severity" as a composer field. The platform severity catalog belongs to MOD-SA-07, and no broadcast-severity value set is enumerated for this module. The field is free text here rather than an invented list.',
  },
  {
    affordance: 'The allowed-roles set for the re-send control',
    note: 'AC-SA-14-07 (L45684) defines what a re-send does, and FB-SA-07 (L45682) names it as the recovery path, but neither names who holds it. This prototype applies the same set as the send control (Root Super Admin and Admin) and marks that as an inference, not a source fact.',
  },
  {
    affordance: 'A per-recipient delivery failure list',
    note: 'FB-SA-07 requires per-recipient failure to be recorded and escalated with the failed recipient list, but defines no screen or control for reading it on this module. The send history below records that a send failed; it does not invent a recipient-level view.',
  },
  {
    affordance: 'Whether a broadcast requires acknowledgement, and who decides',
    note: '`acknowledged` is a tracked state and AC-SA-14-06 keeps it distinct from delivery and opening, but nothing in the source defines a control that requires an acknowledgement or a role that sets one.',
  },
  {
    affordance: 'Field-level validation rules for the composer',
    note: 'The source states no required-field or format rule for a broadcast. STATE-04 below is rendered against the one rule the workflow implies — a broadcast carries a body — and that rule is named on screen as a prototype rendering, not a source fact.',
  },
] as const satisfies readonly UnspecifiedAffordance[]

/* ------------------------------------------------------------------ *
 * Conflicts and silences in the source, stated rather than resolved
 * silently (spec §4).
 * ------------------------------------------------------------------ */

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const NOTIF_SOURCE_CONFLICTS = [
  {
    topic: 'Two screen numbers for one screen',
    conflict:
      'This module’s screen carries one number at L42812 and L45614, and a different one, SCR-SA-17, at L48746 — the two incompatible SCR-SA numbering schemes the spec records at D1. SCR-SA-17 is also MOD-SA-11’s number in the other scheme.',
    resolution:
      'Names are canonical; numbers are annotations only. This route is keyed on the module slug and never on a number (D1).',
  },
  {
    topic: 'AC-SA-14-05 is missing',
    conflict:
      'The acceptance criteria extracted at L45684 run AC-SA-14-01, -02, -03, -04, -06 and -07. There is no AC-SA-14-05 in the frozen source’s extraction.',
    resolution:
      'The gap is stated and left empty. Nothing was written to fill the number, because an invented criterion reads back as a requirement.',
  },
  {
    topic: 'roles_allowed differs in every extraction of this module',
    conflict:
      'Seven module records name seven different sets: root and Admin (L11671, L60869, L98242), Admin alone (L2442), root, Admin and Support (L21091), all four platform roles (L42748, L45618), and an empty set (L116399).',
    resolution:
      'D16 — module-level roles_allowed is authoritative nowhere. Every affordance here is driven by the per-control allowed-roles at L45614 through evaluateAccess, and all four roles read the screen.',
  },
  {
    topic: 'Three notification state vocabularies',
    conflict:
      'OBJ-SA-BROADCAST carries thirteen states (L45633); NOTIF-SA-08-01 draws an eight-state progression (L44860); WF-OPS-003 draws an eleven-state machine with three named branches (L54514).',
    resolution:
      'This module renders OBJ-SA-BROADCAST’s own vocabulary, because that is the object this screen owns. The other two are not collapsed into it, and delivery, opening and acknowledgement stay three distinct states (AC-SA-14-06).',
  },
  {
    topic: 'Whether the root submits or simply sends an all-tenant broadcast',
    conflict:
      'AC-SA-14-03 requires root approval for every all-tenant broadcast; the only submission control the source defines is the Admin’s (L45614). Nothing states what the root itself does.',
    resolution:
      'D13 / DEC-ROOTSUCC-001 — the root approves its own critical-class actions and no second approver exists. The root’s send control is drawn with that stated on screen rather than a second approval step being invented.',
  },
] as const satisfies readonly SourceConflict[]
