/**
 * `OFF-MODE-01` … `OFF-MODE-28`, and THE MAPPING onto the six-member
 * `ConnectivityMode` the scenario engine already drives.
 *
 * The transcription is the easy half. The mapping is why this file exists and
 * why it is central: twenty-one later tasks need to know which of the six
 * scenario levers reproduces a given source mode, and if this file does not
 * answer it, each of them answers it privately and differently.
 *
 * ── THE SOURCE ─────────────────────────────────────────────────────────────
 * L78639 introduces the table: "**The twenty-eight modes.** Every cell carries
 * an explicit status." The header is L78641 and carries SEVEN columns —
 * Identifier, Mode, Detection signal, Frontline behaviour, Oversight-surface
 * display obligation, Terminal safe state if unresolved, Source status. The
 * twenty-eight data rows are L78643-L78670, `OFF-MODE-01` … `OFF-MODE-28` in
 * order with no gap. Every cell below is transcribed HEADER-KEYED, cell by
 * cell, never positionally.
 *
 * Above the table the source draws its own machine, L78600-L78634: twelve
 * mermaid states and their transitions. That machine is the evidence the
 * mapping rests on, and it is also where the mapping runs out.
 *
 * ── THE MAPPING IS A BUILD RULING, NOT A SOURCE FACT ───────────────────────
 * `@/scenario/controls`'s `ConnectivityMode` has six members — `online`,
 * `slow`, `flapping`, `offline`, `dependency-down`, `recovering`. The source
 * never states how its twenty-eight relate to them, because the source has
 * never heard of them. So `connectivity` on every row below is A CLIENT-
 * DELEGATED CHOICE UNDER APP-012, disclosed in `OFF_MODE_CONNECTIVITY_RULING`
 * with the readings and their locators, and never presented as the source's
 * answer. `ConnectivityMode` is NOT widened here: the six are what the
 * scenario engine drives and what every existing surface already reads, and
 * `@/scenario/controls` is another agent's file besides.
 *
 * `mappingKind` records what each row cost:
 *
 *   `direct`    (3)  the member absorbs exactly this one source mode and names
 *                    the same condition — 01, 02, 03.
 *   `narrowed`  (21) the member absorbs several source modes. Nothing is
 *                    wrong, but a distinction the source draws is not
 *                    recoverable from the member alone.
 *   `delegated` (4)  the source mode IS NOT A CONNECTIVITY CONDITION. None of
 *                    the six names it; the pick is this build's.
 *
 * ── WHAT THE EVIDENCE IS, GROUP BY GROUP ───────────────────────────────────
 * The eleven `dependency-down` rows are not this build's grouping. They are
 * the source's own: L78637 says the diagram collapses them deliberately,
 * "because putting all eleven backend variants in the diagram would exceed a
 * readable node count". Counted here: 08, 09, 10, 11, 12, 17, 18, 19, 20, 21,
 * 22 — eleven. `dependency-down` also keeps the one distinction the source
 * explicitly demands of it, at L78650: "Surfaces must distinguish device-dark
 * from server-unreachable". Device-dark is `offline`; server-unreachable is
 * `dependency-down`; they are never the same member.
 *
 * 13-16 are the four browser-offline modes. They are `narrowed` onto `offline`
 * with a caveat that matters: the connectivity lost is a WEB SURFACE'S, not
 * the device's, and the source's device-side machine (L78600-L78634) carries
 * no node for any of them. Their own Frontline-behaviour cells say so.
 *
 * ── WHERE THE SIX CANNOT CARRY THE TWENTY-EIGHT, STATED PLAINLY ────────────
 * Four modes are not connectivity conditions at all. 25 Conflict detected, 26
 * Quarantine required and 27 Recovery required are the three non-clean exits
 * from Synchronizing (L78629, L78630, L78631) — the link is up and sync is
 * finishing, so `recovering` is the pick. 28 Safely blocked is a terminal safe
 * state reachable from device-offline (L78620) and exiting to Reconnecting
 * (L78626), so `offline` is the pick. In all four cases the source states no
 * connectivity posture and none of the six names the condition; they are
 * `delegated` and they are listed in `OFF_MODES_DELEGATED` so a consumer can
 * see the four rather than discover them.
 *
 * ── THE SCOPE LIMIT, AND IT IS LOAD-BEARING ────────────────────────────────
 * `connectivity` answers ONE question: under which of the six scenario levers
 * does this mode occur. IT IS NOT A DISPLAY INSTRUCTION and must never be read
 * as one. Driving a surface to `recovering` because a conflict is open would
 * show a syncing marker, and L78667 requires something else entirely for
 * `OFF-MODE-25` — a conflict-review panel in the Client Command Center. The
 * display obligation is the row's OWN `oversightDisplayObligation` cell, every
 * time. Nothing here overrides it.
 */
import type { ConnectivityMode } from '@/scenario/controls'
import type { DecisionReading } from '@/disclosure/decisions'

export type OffModeId =
  | 'OFF-MODE-01'
  | 'OFF-MODE-02'
  | 'OFF-MODE-03'
  | 'OFF-MODE-04'
  | 'OFF-MODE-05'
  | 'OFF-MODE-06'
  | 'OFF-MODE-07'
  | 'OFF-MODE-08'
  | 'OFF-MODE-09'
  | 'OFF-MODE-10'
  | 'OFF-MODE-11'
  | 'OFF-MODE-12'
  | 'OFF-MODE-13'
  | 'OFF-MODE-14'
  | 'OFF-MODE-15'
  | 'OFF-MODE-16'
  | 'OFF-MODE-17'
  | 'OFF-MODE-18'
  | 'OFF-MODE-19'
  | 'OFF-MODE-20'
  | 'OFF-MODE-21'
  | 'OFF-MODE-22'
  | 'OFF-MODE-23'
  | 'OFF-MODE-24'
  | 'OFF-MODE-25'
  | 'OFF-MODE-26'
  | 'OFF-MODE-27'
  | 'OFF-MODE-28'

/**
 * Source order, `OFF-MODE-01` … `OFF-MODE-28`. Kept as a literal tuple with
 * `as const satisfies`, never annotated `readonly OffModeId[]` — the
 * annotation widens the tuple back to the union and every exhaustiveness
 * check below then type-checks unconditionally, which is the defect
 * `@/scenario/controls` records having already been bitten by twice.
 */
export const OFF_MODE_IDS = [
  'OFF-MODE-01',
  'OFF-MODE-02',
  'OFF-MODE-03',
  'OFF-MODE-04',
  'OFF-MODE-05',
  'OFF-MODE-06',
  'OFF-MODE-07',
  'OFF-MODE-08',
  'OFF-MODE-09',
  'OFF-MODE-10',
  'OFF-MODE-11',
  'OFF-MODE-12',
  'OFF-MODE-13',
  'OFF-MODE-14',
  'OFF-MODE-15',
  'OFF-MODE-16',
  'OFF-MODE-17',
  'OFF-MODE-18',
  'OFF-MODE-19',
  'OFF-MODE-20',
  'OFF-MODE-21',
  'OFF-MODE-22',
  'OFF-MODE-23',
  'OFF-MODE-24',
  'OFF-MODE-25',
  'OFF-MODE-26',
  'OFF-MODE-27',
  'OFF-MODE-28',
] as const satisfies readonly OffModeId[]

type MissingFromOffModeIds = Exclude<OffModeId, (typeof OFF_MODE_IDS)[number]>
const _offModeIdsAreExhaustive: MissingFromOffModeIds extends never ? true : never = true
void _offModeIdsAreExhaustive

/** What the `connectivity` field cost. See the file header. */
export type OffModeMappingKind = 'direct' | 'narrowed' | 'delegated'

/**
 * One row of L78643-L78670. The first seven fields are the source's seven
 * columns, header-keyed and in header order. The last three are this build's
 * mapping and are marked as such — no source column produced them.
 *
 * Every field is required. There is no optional cell, because the source's own
 * rule for this table is that "Every cell carries an explicit status" (L78639)
 * and an optional field is how a blank cell gets in.
 */
export interface OffMode {
  readonly identifier: OffModeId
  readonly mode: string
  readonly detectionSignal: string
  readonly frontlineBehaviour: string
  readonly oversightDisplayObligation: string
  readonly terminalSafeStateIfUnresolved: string
  readonly sourceStatus: string
  /** BUILD RULING under APP-012, not a source column. See the file header. */
  readonly connectivity: ConnectivityMode
  /** BUILD RULING under APP-012, not a source column. */
  readonly mappingKind: OffModeMappingKind
  /** Why this row maps where it does, and what the mapping loses. */
  readonly mappingBasis: string
}

export const OFF_MODES = [
  {
    identifier: 'OFF-MODE-01',
    mode: 'Fully online',
    detectionSignal: 'Continuous bidirectional sync succeeding',
    frontlineBehaviour: '`Allowed` — full capability',
    oversightDisplayObligation: 'Live with freshness marker showing current',
    terminalSafeStateIfUnresolved: '`Not applicable — no failure present`',
    sourceStatus: '`SoW Fact — §7.10.2`',
    connectivity: 'online',
    mappingKind: 'direct',
    mappingBasis: 'The member names this condition and absorbs no other source mode.',
  },
  {
    identifier: 'OFF-MODE-02',
    mode: 'Slow connectivity',
    detectionSignal: 'Elevated latency, uploads succeeding slowly',
    frontlineBehaviour: '`Allowed` — sync continues, queue depth may rise',
    oversightDisplayObligation: 'Live with an increasing marker age and rising pending count',
    terminalSafeStateIfUnresolved: '`Queued while offline` behaviour if throughput falls to zero',
    sourceStatus: '`Derived Clarification`',
    connectivity: 'slow',
    mappingKind: 'direct',
    mappingBasis: 'The member names this condition and absorbs no other source mode.',
  },
  {
    identifier: 'OFF-MODE-03',
    mode: 'Intermittent or flapping connectivity',
    detectionSignal: 'Repeated short losses and restorations',
    frontlineBehaviour: '`Allowed` — durable queue resumes where it left off',
    oversightDisplayObligation: 'Marker alternates; the platform must not flap the tile between live and offline on every transition',
    terminalSafeStateIfUnresolved: 'Treated as device offline once losses dominate',
    sourceStatus: '`SoW Fact — §5.14.2, §7.10.2`',
    connectivity: 'flapping',
    mappingKind: 'direct',
    mappingBasis: 'The member names this condition and absorbs no other source mode.',
  },
  {
    identifier: 'OFF-MODE-04',
    mode: 'One tablet offline',
    detectionSignal: 'Heartbeat stops for a single device',
    frontlineBehaviour: '`Allowed` — full offline execution of the pinned package',
    oversightDisplayObligation: 'Tile shows the count of offline devices and pending captures',
    terminalSafeStateIfUnresolved: 'Trust-window expiry leads to safely blocked',
    sourceStatus: '`SoW Fact — §6.2.3, §6.2.7`',
    connectivity: 'offline',
    mappingKind: 'narrowed',
    mappingBasis: 'One of four device-dark modes that differ only in how many devices or Sites are affected; `offline` keeps none of that scope distinction.',
  },
  {
    identifier: 'OFF-MODE-05',
    mode: 'Multiple tablets offline',
    detectionSignal: 'Heartbeats stop for several devices in one Area',
    frontlineBehaviour: '`Allowed` — each device independent',
    oversightDisplayObligation: 'Per-device list behind the marker',
    terminalSafeStateIfUnresolved: 'As `OFF-MODE-04`, per device',
    sourceStatus: '`SoW Fact — §6.2.3`',
    connectivity: 'offline',
    mappingKind: 'narrowed',
    mappingBasis: 'One of four device-dark modes that differ only in how many devices or Sites are affected; `offline` keeps none of that scope distinction.',
  },
  {
    identifier: 'OFF-MODE-06',
    mode: 'Entire Site offline',
    detectionSignal: 'All devices at a Site dark',
    frontlineBehaviour: '`Allowed` — the floor is not stopped',
    oversightDisplayObligation: 'Graded protocol: 30-minute platform alert, 60-minute Tenant Admin banner, 120-minute on-call escalation',
    terminalSafeStateIfUnresolved: 'Trust-window expiry per device',
    sourceStatus: '`SoW Fact — §4.13.1, §6.2.4`',
    connectivity: 'offline',
    mappingKind: 'narrowed',
    mappingBasis: 'One of four device-dark modes that differ only in how many devices or Sites are affected; `offline` keeps none of that scope distinction.',
  },
  {
    identifier: 'OFF-MODE-07',
    mode: 'Multi-Site outage',
    detectionSignal: 'Multiple Sites dark simultaneously',
    frontlineBehaviour: '`Allowed` — unchanged on each device',
    oversightDisplayObligation: 'Graded protocol applies per Site; platform operations correlate',
    terminalSafeStateIfUnresolved: 'Trust-window expiry per device',
    sourceStatus: '`Derived Clarification` extending §4.13.1',
    connectivity: 'offline',
    mappingKind: 'narrowed',
    mappingBasis: 'One of four device-dark modes that differ only in how many devices or Sites are affected; `offline` keeps none of that scope distinction.',
  },
  {
    identifier: 'OFF-MODE-08',
    mode: 'Frontline online but backend unavailable',
    detectionSignal: 'Requests fail while the link is up',
    frontlineBehaviour: '`Allowed` — engine treats it as offline for sync purposes',
    oversightDisplayObligation: 'Surfaces must distinguish device-dark from server-unreachable',
    terminalSafeStateIfUnresolved: 'Safely blocked for actions requiring online confirmation',
    sourceStatus: '`Derived Clarification`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-09',
    mode: 'Upload service unavailable',
    detectionSignal: 'Upload endpoint failing',
    frontlineBehaviour: '`Queued while offline` — captures queue, nothing is lost',
    oversightDisplayObligation: 'Pending capture counts rise; the marker must not read live',
    terminalSafeStateIfUnresolved: 'Media eviction is suspended, since eviction requires confirmed receipt',
    sourceStatus: '`SoW Fact — §7.10.7`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-10',
    mode: 'Command service unavailable',
    detectionSignal: 'Command pull failing',
    frontlineBehaviour: '`Allowed` — execution continues; no commands arrive',
    oversightDisplayObligation: 'Commands display as queued; no surface may show delivery',
    terminalSafeStateIfUnresolved: 'Holds remain held; parked runs remain parked',
    sourceStatus: '`SoW Fact — §7.10.3`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-11',
    mode: 'Authentication service unavailable',
    detectionSignal: 'Login or token refresh failing',
    frontlineBehaviour: '`Cached read-only while offline` — cached credentials trusted within the offline trust window',
    oversightDisplayObligation: 'Login failures surfaced without exposing credential detail',
    terminalSafeStateIfUnresolved: 'Safely blocked once the trust window expires',
    sourceStatus: '`SoW Fact — §7.10.5, §8.13.1`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-12',
    mode: 'Artificial-intelligence service unavailable',
    detectionSignal: 'Agent endpoints failing or emergency pause active',
    frontlineBehaviour: '`Allowed with conditions` — authored Work Instructions replace agent coaching',
    oversightDisplayObligation: 'Renders as agent unavailability, never silence',
    terminalSafeStateIfUnresolved: '`Not applicable — the deterministic layer is unaffected and continues`',
    sourceStatus: '`SoW Fact — §7.9.1, §7.9.4, §8.7.5`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-13',
    mode: 'Delivery Operations Hub browser offline',
    detectionSignal: 'The Hub user\'s own browser loses connectivity',
    frontlineBehaviour: '`Not applicable — no device impact`',
    oversightDisplayObligation: 'The Hub is a server-rendered records surface; it must show a disconnected state rather than a stale form that appears saveable',
    terminalSafeStateIfUnresolved: 'Unsaved form input preserved locally and re-submittable; no partial write',
    sourceStatus: '`Derived Clarification`',
    connectivity: 'offline',
    mappingKind: 'narrowed',
    mappingBasis: 'The connectivity lost is a web surface browser’s, not the device’s. The source’s device-side machine carries no node for it, so `offline` is read here as the affected surface’s own connectivity.',
  },
  {
    identifier: 'OFF-MODE-14',
    mode: 'Studio browser offline',
    detectionSignal: 'The author\'s browser loses connectivity',
    frontlineBehaviour: '`Not applicable — no device impact`',
    oversightDisplayObligation: 'The Studio requires connectivity; authoring in progress must not appear published',
    terminalSafeStateIfUnresolved: 'Submission held in its approval state; never a partial publish',
    sourceStatus: '`SoW Fact — §5.14.1` plus `Derived Clarification`',
    connectivity: 'offline',
    mappingKind: 'narrowed',
    mappingBasis: 'The connectivity lost is a web surface browser’s, not the device’s. The source’s device-side machine carries no node for it, so `offline` is read here as the affected surface’s own connectivity.',
  },
  {
    identifier: 'OFF-MODE-15',
    mode: 'Command Center browser offline',
    detectionSignal: 'The supervisor\'s browser loses connectivity',
    frontlineBehaviour: '`Not applicable — no device impact`',
    oversightDisplayObligation: 'The board must state that it is no longer receiving pushed events, with the age of the last received event',
    terminalSafeStateIfUnresolved: 'Read-only with an explicit disconnected banner; the ten actions disabled',
    sourceStatus: '`Derived Clarification` from §6.2.1',
    connectivity: 'offline',
    mappingKind: 'narrowed',
    mappingBasis: 'The connectivity lost is a web surface browser’s, not the device’s. The source’s device-side machine carries no node for it, so `offline` is read here as the affected surface’s own connectivity.',
  },
  {
    identifier: 'OFF-MODE-16',
    mode: 'Super Admin browser offline',
    detectionSignal: 'The console operator\'s browser loses connectivity',
    frontlineBehaviour: '`Not applicable — no device impact`',
    oversightDisplayObligation: 'Console shows disconnected; maker-checker submissions must not appear approved',
    terminalSafeStateIfUnresolved: 'In-flight approvals held; no critical-class action completes',
    sourceStatus: '`Derived Clarification` from §8.8.3',
    connectivity: 'offline',
    mappingKind: 'narrowed',
    mappingBasis: 'The connectivity lost is a web surface browser’s, not the device’s. The source’s device-side machine carries no node for it, so `offline` is read here as the affected surface’s own connectivity.',
  },
  {
    identifier: 'OFF-MODE-17',
    mode: 'Backend outage',
    detectionSignal: 'Platform services broadly unavailable',
    frontlineBehaviour: '`Allowed` — devices continue offline execution',
    oversightDisplayObligation: 'All web surfaces show unavailability honestly; no cached page may present as live',
    terminalSafeStateIfUnresolved: 'Safely blocked for all online-confirmation actions',
    sourceStatus: '`Derived Clarification`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-18',
    mode: 'Database outage',
    detectionSignal: 'Primary data store unavailable',
    frontlineBehaviour: '`Allowed` — devices unaffected',
    oversightDisplayObligation: 'Writes must fail closed; the one-transaction audit guarantee means an unauditable action does not happen',
    terminalSafeStateIfUnresolved: 'No write proceeds; queued device data is retained and not acknowledged',
    sourceStatus: '`SoW Fact — §4.10.1, §8.18`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-19',
    mode: 'Queue outage',
    detectionSignal: 'The messaging or queue layer unavailable',
    frontlineBehaviour: '`Queued while offline` — device queue is independent and durable',
    oversightDisplayObligation: 'Command creation must fail closed rather than appear queued',
    terminalSafeStateIfUnresolved: 'Commands not created; no surface shows a phantom queued command',
    sourceStatus: '`Derived Clarification`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-20',
    mode: 'Object-storage outage',
    detectionSignal: 'Evidence media store unavailable',
    frontlineBehaviour: '`Queued while offline` — media stays on the device',
    oversightDisplayObligation: 'Evidence views show unavailability, never a broken or blank frame implying no evidence exists',
    terminalSafeStateIfUnresolved: 'Media eviction suspended because receipt cannot be confirmed',
    sourceStatus: '`SoW Fact — §7.10.7`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-21',
    mode: 'Regional outage',
    detectionSignal: 'The deployment region unavailable',
    frontlineBehaviour: '`Allowed` — devices continue offline execution',
    oversightDisplayObligation: 'All surfaces unavailable; status communication is out-of-platform',
    terminalSafeStateIfUnresolved: 'Devices operate on pinned packages within the trust window, then safely blocked',
    sourceStatus: '`SoW Fact — §10.5 deployment posture`; recovery objectives `Client Decision Required`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-22',
    mode: 'Integration outage',
    detectionSignal: 'A tenant integration endpoint unavailable',
    frontlineBehaviour: '`Not applicable — the device consumes no tenant integration directly`',
    oversightDisplayObligation: 'Integration surface shows the failure; no operational record is altered',
    terminalSafeStateIfUnresolved: 'Integration retries per its own contract; no operational blocking',
    sourceStatus: '`SoW Fact — §4.1.3 module 12`',
    connectivity: 'dependency-down',
    mappingKind: 'narrowed',
    mappingBasis: 'One of the eleven backend variants the source itself says are collapsed into a single node in its own diagram; `dependency-down` keeps the device-dark versus server-unreachable distinction the source requires and loses which dependency failed.',
  },
  {
    identifier: 'OFF-MODE-23',
    mode: 'Reconnecting',
    detectionSignal: 'Link restored, session re-establishing',
    frontlineBehaviour: '`Allowed` — automatic, never a worker action',
    oversightDisplayObligation: 'Marker shows reconnecting; no surface may pre-emptively show current',
    terminalSafeStateIfUnresolved: 'Returns to the prior degraded mode on failure',
    sourceStatus: '`SoW Fact — §7.10.2`',
    connectivity: 'recovering',
    mappingKind: 'narrowed',
    mappingBasis: 'Both reconnection and synchronization land on the single `recovering` member; which of the two is in progress is not recoverable from the mode alone.',
  },
  {
    identifier: 'OFF-MODE-24',
    mode: 'Synchronizing',
    detectionSignal: 'Captures uploading and commands downloading',
    frontlineBehaviour: '`Allowed` — worker continues; sync is background',
    oversightDisplayObligation: 'Marker shows in-progress with remaining count',
    terminalSafeStateIfUnresolved: 'Partial sync retained; durable queue resumes',
    sourceStatus: '`SoW Fact — §7.10.2`',
    connectivity: 'recovering',
    mappingKind: 'narrowed',
    mappingBasis: 'Both reconnection and synchronization land on the single `recovering` member; which of the two is in progress is not recoverable from the mode alone.',
  },
  {
    identifier: 'OFF-MODE-25',
    mode: 'Conflict detected',
    detectionSignal: 'Two writes to one record, or a skew-flagged timestamp',
    frontlineBehaviour: '`Not applicable — the worker never sees or resolves a conflict`',
    oversightDisplayObligation: 'Conflict-review panel in the Client Command Center, capped list with a count and a Resolve All accepting the most recent version',
    terminalSafeStateIfUnresolved: 'Conflict remains open and audited until a Quality Manager decides',
    sourceStatus: '`SoW Fact — §4.13.2, §7.10.8, §7.1.5`',
    connectivity: 'recovering',
    mappingKind: 'delegated',
    mappingBasis: 'Not a connectivity condition. It is a non-clean exit from Synchronizing in the source’s own machine, so the link is up; `recovering` is this build’s pick and the source states none.',
  },
  {
    identifier: 'OFF-MODE-26',
    mode: 'Quarantine required',
    detectionSignal: 'An arriving record fails validation',
    frontlineBehaviour: '`Not applicable — quarantine is server-side`',
    oversightDisplayObligation: 'The record is held unapplied and visible as quarantined, never silently dropped',
    terminalSafeStateIfUnresolved: 'Quarantined record retained pending human decision',
    sourceStatus: '`Derived Clarification`; the source names validation but not a quarantine state',
    connectivity: 'recovering',
    mappingKind: 'delegated',
    mappingBasis: 'Not a connectivity condition. It is a non-clean exit from Synchronizing in the source’s own machine, so the link is up; `recovering` is this build’s pick and the source states none.',
  },
  {
    identifier: 'OFF-MODE-27',
    mode: 'Recovery required',
    detectionSignal: 'Reconciliation cannot complete automatically',
    frontlineBehaviour: '`Allowed with conditions` — device may continue where safe',
    oversightDisplayObligation: 'An explicit recovery item is raised, owned by a named role',
    terminalSafeStateIfUnresolved: 'Controlled hold on the affected scope until recovery completes',
    sourceStatus: '`Derived Clarification`',
    connectivity: 'recovering',
    mappingKind: 'delegated',
    mappingBasis: 'Not a connectivity condition. It is a non-clean exit from Synchronizing in the source’s own machine, so the link is up; `recovering` is this build’s pick and the source states none.',
  },
  {
    identifier: 'OFF-MODE-28',
    mode: 'Safely blocked',
    detectionSignal: 'Continuation would breach an invariant',
    frontlineBehaviour: '`Explicitly prohibited` — the blocked action cannot proceed',
    oversightDisplayObligation: 'The block, its reason and its exit condition are displayed on every surface that shows the affected work',
    terminalSafeStateIfUnresolved: 'The safe stop itself is the terminal state; work already captured is preserved',
    sourceStatus: '`SoW Fact — §7.13.2 parked run; §7.10.5 trust window`',
    connectivity: 'offline',
    mappingKind: 'delegated',
    mappingBasis: 'Not a connectivity condition. It is a terminal safe state reachable from device-offline in the source’s own machine; `offline` is this build’s pick and the source states none.',
  },
] as const satisfies readonly OffMode[]

/**
 * TWO checks, not one, and the pair is the point. The first says no
 * `OffModeId` is missing from the table; the second says the table invents no
 * identifier the union does not declare. Either alone passes a table that is
 * wrong in the other direction.
 */
type MissingFromOffModes = Exclude<OffModeId, (typeof OFF_MODES)[number]['identifier']>
const _everyOffModeIdIsTranscribed: MissingFromOffModes extends never ? true : never = true
void _everyOffModeIdIsTranscribed

type ExtraInOffModes = Exclude<(typeof OFF_MODES)[number]['identifier'], OffModeId>
const _offModesInventNoIdentifier: ExtraInOffModes extends never ? true : never = true
void _offModesInventNoIdentifier

const BY_ID: ReadonlyMap<string, OffMode> = new Map(OFF_MODES.map((m) => [m.identifier, m]))

/**
 * Total over `OffModeId`. The throw is unreachable through the type and is
 * kept for the caller who arrives through a cast or from parsed data.
 */
export function offMode(id: OffModeId): OffMode {
  const found = BY_ID.get(id)
  if (found === undefined) throw new Error(`Unknown offline mode identifier: ${id}`)
  return found
}

/** Every source mode that occurs under one scenario lever. Never empty. */
export function offModesFor(connectivity: ConnectivityMode): readonly OffMode[] {
  return OFF_MODES.filter((m) => m.connectivity === connectivity)
}

/**
 * The four modes that are not connectivity conditions, where the six members
 * genuinely cannot carry the twenty-eight and the pick is this build's alone.
 * Derived rather than re-listed, so it cannot drift from the rows above.
 */
export const OFF_MODES_DELEGATED: readonly OffMode[] = OFF_MODES.filter(
  (m) => m.mappingKind === 'delegated',
)

/**
 * The disclosure. `DecisionReading` is IMPORTED from the canon's own shape,
 * never redeclared — two fields, no `preferred` flag, because a flag like that
 * is how a disclosure quietly becomes an assertion.
 *
 * `decisionRef` is this build's key and says so. The source names no `DEC-*`
 * for this question, and `tests/unit/offline-modes.test.ts` holds that open:
 * it asserts `DEC-OFFMODE-001` appears NOWHERE in the frozen source and
 * NOWHERE in `@/disclosure/decisions`. The moment a later task lifts this into
 * the canon, that gate goes red and forces the switch rather than leaving two
 * spellings of one ruling alive.
 */
export interface OffModeConnectivityRuling {
  readonly decisionRef: 'DEC-OFFMODE-001'
  readonly keyIsThisBuilds: true
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly adopted: string
  /** What `connectivity` does NOT mean. Disclosed, not buried in a comment. */
  readonly scopeLimit: string
  readonly canonNote: string
}

export const OFF_MODE_CONNECTIVITY_RULING: OffModeConnectivityRuling = {
  decisionRef: 'DEC-OFFMODE-001',
  keyIsThisBuilds: true,
  question:
    'The source declares twenty-eight offline and degraded modes; the scenario engine drives six ' +
    'connectivity modes. Which of the six reproduces each of the twenty-eight?',
  readings: [
    {
      text:
        'The source enumerates twenty-eight modes, each with its own detection signal, Frontline ' +
        'behaviour, display obligation and terminal safe state, and relates them to no smaller ' +
        'set. Read strictly, the twenty-eight are the vocabulary and nothing maps onto anything.',
      locator: 'L78639 · table L78641 header, rows L78643-L78670',
    },
    {
      text:
        'The source draws its own machine with twelve states, and says outright that it collapsed ' +
        'a group of the modes to get there: the diagram shows backend-unavailable as one node ' +
        '"because putting all eleven backend variants in the diagram would exceed a readable node ' +
        'count". That machine is the DEVICE-SIDE one (L78637), and four of the twenty-eight say ' +
        'in their own Frontline-behaviour cell that they are `Not applicable — no device impact`, ' +
        'so they are outside it. So the source itself treats its twenty-eight as collapsible onto ' +
        'a smaller set of postures, and names one such collapse.',
      locator: 'L78637 · machine L78600-L78634',
    },
    {
      text:
        'Neither reading answers the question actually asked, because the six members belong to ' +
        'this build rather than to the source. The source can supply the grouping evidence and ' +
        'cannot supply the mapping.',
      locator: 'L78641 read against @/scenario/controls',
    },
  ],
  adopted:
    'Each of the twenty-eight carries a `connectivity` member of the existing six and a ' +
    '`mappingKind` recording what that cost: three direct, twenty-one narrowed, four delegated. ' +
    'The eleven-member `dependency-down` group is the source’s own grouping (L78637), not this ' +
    'build’s, and the device-dark versus server-unreachable split the source requires at L78650 ' +
    'is preserved as `offline` versus `dependency-down`. `ConnectivityMode` is NOT widened to ' +
    'twenty-eight: the six are what the scenario engine drives and what every existing surface ' +
    'already reads. This is a client-delegated choice under APP-012, not a position the source ' +
    'settled.',
  scopeLimit:
    '`connectivity` says which scenario lever reproduces a mode. It is NOT a display instruction. ' +
    'Four modes have no connectivity posture in the source at all and their member is this ' +
    'build’s pick; `OFF-MODE-25` in particular is mapped to `recovering` while its display ' +
    'obligation at L78667 is a conflict-review panel, which no connectivity marker provides. The ' +
    'display obligation is always the row’s own `oversightDisplayObligation` cell.',
  canonNote:
    'The frozen source names no `DEC-*` identifier for this question, so `DEC-OFFMODE-001` is ' +
    'this build’s key rather than the source’s, declared as a gap for the decision canon rather ' +
    'than filed under a neighbouring identifier. `@/disclosure/decisions` is another task’s file ' +
    'and is read here, never written.',
}
