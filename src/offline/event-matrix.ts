/**
 * THE FIVE-SURFACE EVENT MATRIX — `OFF-EVT-01` … `OFF-EVT-20`. Frozen source
 * chapter 34.
 *
 * ── TWO BLOCKS, TWENTY ROWS, COUNTED ───────────────────────────────────────
 * The source splits the matrix in two and gives each block its own header,
 * with identical columns:
 *
 *   part one, events originating on the device or on the floor
 *     intro L78278 · header L78280 · separator L78281 · rows L78282-L78291
 *     `OFF-EVT-01` … `OFF-EVT-10`
 *   part two, events originating on the server while the tablet is offline
 *     intro L78315 · header L78317 · separator L78318 · rows L78319-L78328
 *     `OFF-EVT-11` … `OFF-EVT-20`
 *
 *     10 + 10              =  20 events, no gap in the numbering
 *     20 rows x 10 columns = 200 cells
 *     20 rows x  5 surfaces = 100 surface cells, every one non-blank
 *
 * The two headers are compared cell by cell and are identical, which is what
 * makes one `EVENT_MATRIX_COLUMNS` legitimate for both blocks. `block` on
 * each row keeps them distinguishable, because the two are different claims:
 * part one is what the device did while dark, part two is what the server did
 * while it was.
 *
 * ── HEADER-KEYED, NEVER POSITIONAL ─────────────────────────────────────────
 * Chapter 34's five-surface tables do not agree on column order across the
 * chapter, and a positional transcription inverts cells silently because both
 * readings are internally coherent. Every cell below is keyed through
 * `EVENT_MATRIX_COLUMNS`, which carries each heading verbatim.
 *
 * The heading here is `Super Admin`. The per-surface state contract in the
 * same chapter (`@/offline/state-contract`) heads the same column `Super
 * Admin platform console`. Same surface, two headings; both transcribed as
 * written.
 *
 * ── THE CELLS ARE THE NINE PERMISSION OUTCOMES, AND SEVEN OF THEM APPEAR ───
 * All 100 surface cells open with a backticked token, and every token is one
 * this build already has in `@/policy/decision`. No tenth token is minted
 * here. Counted across the 100:
 *
 *     `Read-only`                       32
 *     `Allowed`                         25
 *     `Not applicable — <reason>`       19  (ten distinct reasons)
 *     `Queued while offline`             9
 *     `Allowed with conditions`          7
 *     `Cached read-only while offline`   6
 *     `Client Decision Required`         2
 *
 * Seven of the nine. `unavailable` and `explicitlyProhibited` appear in no
 * cell of either block — which is a fact about the matrix, not a gap in the
 * transcription, and the count above is where a reader can see it.
 *
 * THE TOKEN IS MATCHED ON EXACT EQUALITY, never on a prefix. `Allowed` is a
 * prefix of `Allowed with conditions`, and a prefix test would read all seven
 * conditional cells as plain `Allowed` — the same defect a slice 7 gate was
 * beaten by.
 *
 * `notApplicable` carries its reason INSIDE the backticks in every one of its
 * nineteen cells, so `OffEventCell` is a discriminated union in the shape
 * `@/policy/decision` already uses: a reasonless `notApplicable` cell cannot
 * be constructed.
 *
 * ── `OFF-EVT-04` IS THE ROW TO READ TWICE ──────────────────────────────────
 * A worker finishing offline records `worker-finished` ON THE DEVICE, and
 * that is not the run standing `submitted`. The Hub cell of L78285 —
 * "run cannot yet stand `submitted` on the server" — and its Recovery cell,
 * which stands the run `submitted` on receipt and `complete` only when every
 * assigned device has synced.
 *
 * On a connected floor the two are the same instant, which is what makes the
 * distinction easy to lose: L39045 and L40559 both say worker-finished stands
 * the Run as `submitted`. Offline they come apart, and the four states are
 * ordered device-side worker-finished, then `submitted`, then `complete`,
 * then `finished`. The boundary is stated directly at L40545 — "The platform states
 * `submitted`, `complete`, and `finished` are run-record states, not player
 * states". L39047 puts `finished` on the Hub after the record-finish window.
 * The twelve Frontline modules of slice 7 all carry this distinction, and
 * this row is where the offline matrix states it.
 *
 * ── WHAT BINDS TO THE COMMAND CHANNEL, AND WHAT DOES NOT ───────────────────
 * `commandBinding` is this build's, not a source column. Eight of the twenty
 * events ARE a command-channel act; twelve are not, and each of the twelve
 * says why rather than carrying an empty field.
 *
 *     class-bound          7  covering all five `CMD-FL-*` classes
 *     stop class, no class 1  `OFF-EVT-19`, remote wipe or de-authorisation
 *     not a command       12
 *
 * The phase each drains in is read from `COMMAND_CLASS_PHASE` in
 * `@/frontline/commands` and is NOT restated here. Slice 7 settled
 * `DEC-SYNC-001`'s adopted Option C ordering in that file and made the
 * stop-class versus enabling-class membership total over the five classes; a
 * second spelling of it here would be a second thing to keep in step. What
 * this file adds is the twenty events' side of the same binding, by
 * consumption.
 *
 * `OFF-EVT-19` is the one that cannot be class-bound. Remote wipe and device
 * de-authorisation are named in the stop class at L39672 and are carried by
 * none of the five classes, which is `DEC-CMDCLASS-001` — recorded, with its
 * evidence, in `STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS`. Its `items` field
 * is typed FROM that array, so the two cannot drift apart.
 */
import type { PermissionOutcome } from '@/policy/decision'
import type { SurfaceId } from '@/domain/surfaces'
import {
  COMMAND_CLASS_PHASE,
  STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS,
  type FrontlineCommandClass,
  type ReconnectionPhase,
} from '@/frontline/commands'

/**
 * The five surface headings of L78280 and L78317 — identical in both blocks —
 * verbatim, keyed onto this build's surface identifiers.
 */
export const EVENT_MATRIX_COLUMNS: Readonly<Record<SurfaceId, string>> = {
  'SURF-DOH': 'Delivery Operations Hub',
  'SURF-STU': 'Standards and Operations Studio',
  'SURF-CC': 'Client Command Center',
  'SURF-FL': 'Frontline Worker Application',
  'SURF-SA': 'Super Admin',
}

/** Which of the source's two blocks a row came from. They are not merged. */
export type OffEventBlock = 'device-or-floor' | 'server-while-offline'

export type OffEventId =
  | 'OFF-EVT-01'
  | 'OFF-EVT-02'
  | 'OFF-EVT-03'
  | 'OFF-EVT-04'
  | 'OFF-EVT-05'
  | 'OFF-EVT-06'
  | 'OFF-EVT-07'
  | 'OFF-EVT-08'
  | 'OFF-EVT-09'
  | 'OFF-EVT-10'
  | 'OFF-EVT-11'
  | 'OFF-EVT-12'
  | 'OFF-EVT-13'
  | 'OFF-EVT-14'
  | 'OFF-EVT-15'
  | 'OFF-EVT-16'
  | 'OFF-EVT-17'
  | 'OFF-EVT-18'
  | 'OFF-EVT-19'
  | 'OFF-EVT-20'

/**
 * One surface cell. The discriminated union is the same shape
 * `PermissionDecision` uses in `@/policy/decision`: `notApplicable` carries a
 * required stated reason and every other outcome cannot carry one.
 */
export type OffEventCell =
  | {
      readonly outcome: Exclude<PermissionOutcome, 'notApplicable'>
      /** The cell verbatim, token and note together. */
      readonly text: string
      readonly notApplicableReason?: never
    }
  | {
      readonly outcome: 'notApplicable'
      readonly text: string
      /** The source's own reason, taken from inside the backticks. */
      readonly notApplicableReason: string
    }

/** The two stop-class items the five command classes do not carry. */
export type StopClassItemWithoutACommandClass =
  (typeof STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS)[number]['item']

/**
 * BUILD RULING, not a source column: what each event does to the command
 * channel. Every arm carries a reason, so "no command" is a rendering rather
 * than an omission.
 */
export type OffEventCommandBinding =
  | { readonly kind: 'class'; readonly commandClass: FrontlineCommandClass; readonly why: string }
  | {
      readonly kind: 'stop-class-without-a-command-class'
      readonly items: readonly StopClassItemWithoutACommandClass[]
      readonly why: string
    }
  | { readonly kind: 'none'; readonly why: string }

export interface OffEventRow {
  readonly identifier: OffEventId
  /** The `Event` cell with its identifier removed, verbatim. */
  readonly event: string
  readonly block: OffEventBlock
  /** Total over the five surfaces. A blank cell cannot be expressed. */
  readonly cells: Readonly<Record<SurfaceId, OffEventCell>>
  readonly rolesAffected: string
  readonly workerImpact: string
  readonly fallback: string
  readonly recovery: string
  /** BUILD RULING. See the file header. */
  readonly commandBinding: OffEventCommandBinding
  readonly sourceRef: string
}

/** L78282-L78291 and L78319-L78328. Twenty rows, counted, in source order. */
export const OFF_EVENT_MATRIX = [
  {
    identifier: 'OFF-EVT-01',
    event: 'In-specification capture recorded offline',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': {
        outcome: 'notApplicable',
        text: '`Not applicable — nothing has arrived to file`',
        notApplicableReason: 'nothing has arrived to file',
      },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — the Studio consumes no runtime captures`',
        notApplicableReason: 'the Studio consumes no runtime captures',
      },
      'SURF-CC': { outcome: 'cachedReadOnlyOffline', text: '`Cached read-only while offline` — tile unchanged with age marker' },
      'SURF-FL': { outcome: 'allowed', text: '`Allowed` — committed locally, queued' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — queue depth rises' },
    },
    rolesAffected: 'Worker; Supervisor sees only the marker',
    workerImpact: 'None; work continues',
    fallback: 'Durable queue holds the capture across a mid-sync drop',
    recovery: 'Uploaded, server received, validated, accepted, officially recorded, reflected in summaries',
    commandBinding: { kind: 'none', why: 'The event is an upward capture. Nothing travels down the command channel.' },
    sourceRef: 'L78282',
  },
  {
    identifier: 'OFF-EVT-02',
    event: 'Severity 2 deviation classified offline',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': {
        outcome: 'notApplicable',
        text: '`Not applicable — not yet received`',
        notApplicableReason: 'not yet received',
      },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no runtime role`',
        notApplicableReason: 'no runtime role',
      },
      'SURF-CC': { outcome: 'cachedReadOnlyOffline', text: '`Cached read-only while offline` — no deviation shown, marker shows data owed' },
      'SURF-FL': { outcome: 'allowed', text: '`Allowed` — classified at capture, deviation form opens from package' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — no operational content' },
    },
    rolesAffected: 'Worker; Quality Manager on arrival',
    workerImpact: 'Deviation capture opens immediately; guidance is authored Work Instructions',
    fallback: 'Tenant action bundle for Severity 2 executes device-side actions immediately; escalation delivery deferred',
    recovery: 'Escalation delivered at sync; anomaly enters the register as a Concern',
    commandBinding: { kind: 'none', why: 'The event is an upward capture and a device-side action bundle. Escalation delivery is not a command.' },
    sourceRef: 'L78283',
  },
  {
    identifier: 'OFF-EVT-03',
    event: 'Severity 1 deviation classified offline',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': {
        outcome: 'notApplicable',
        text: '`Not applicable — not yet received`',
        notApplicableReason: 'not yet received',
      },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no runtime role`',
        notApplicableReason: 'no runtime role',
      },
      'SURF-CC': { outcome: 'cachedReadOnlyOffline', text: '`Cached read-only while offline` — hold not yet visible' },
      'SURF-FL': { outcome: 'allowed', text: '`Allowed` — hold placed locally and immediately on the breaching scope' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — no operational content' },
    },
    rolesAffected: 'Worker; Quality Manager holds sole release authority',
    workerImpact: 'Work on the held scope stops locally at once',
    fallback: 'Containment checklist launches on-device from the package',
    recovery: 'Escalation delivered at sync; Critical anomaly auto-entered with its containment record',
    commandBinding: { kind: 'none', why: 'The hold is placed locally by the device. Its RELEASE is a command, and that is OFF-EVT-11.' },
    sourceRef: 'L78284',
  },
  {
    identifier: 'OFF-EVT-04',
    event: 'Worker finishes their part of the run offline',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': { outcome: 'readOnly', text: '`Read-only` — run cannot yet stand `submitted` on the server' },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no runtime role`',
        notApplicableReason: 'no runtime role',
      },
      'SURF-CC': { outcome: 'cachedReadOnlyOffline', text: '`Cached read-only while offline` — run shows its last known state' },
      'SURF-FL': { outcome: 'allowed', text: '`Allowed` — worker-finished recorded locally' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — queue depth rises' },
    },
    rolesAffected: 'Worker; Supervisor',
    workerImpact: 'Worker moves to their next assigned run',
    fallback: 'Two-stage completion keeps worker-finished distinct from complete-and-synced',
    recovery: 'Run stands `submitted` on receipt; `complete` only when every assigned device has synced',
    commandBinding: { kind: 'none', why: 'The event is an upward declaration. Nothing travels down the command channel.' },
    sourceRef: 'L78285',
  },
  {
    identifier: 'OFF-EVT-05',
    event: 'Qualification gate blocks a step offline',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': { outcome: 'readOnly', text: '`Read-only` — no clearance can be delivered' },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no runtime role`',
        notApplicableReason: 'no runtime role',
      },
      'SURF-CC': { outcome: 'allowedWithConditions', text: '`Allowed with conditions` — expired qualification is a standing signal' },
      'SURF-FL': { outcome: 'allowed', text: '`Allowed` — gate enforced locally, run parks' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — no operational content' },
    },
    rolesAffected: 'Worker; Supervisor grants clearance as action 10',
    workerImpact: 'Blocked run parks; worker continues other assigned runs',
    fallback: 'Parking is the source-named fallback, not an offline override',
    recovery: 'Clearance arrives on the command channel at next sync; parked run resumes',
    commandBinding: { kind: 'none', why: 'The event is the local gate enforcing. The clearance that unparks it is a command, and that is OFF-EVT-12.' },
    sourceRef: 'L78286',
  },
  {
    identifier: 'OFF-EVT-06',
    event: 'Clock skew beyond threshold detected on device',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': { outcome: 'allowedWithConditions', text: '`Allowed with conditions` — skew event audited on receipt' },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no runtime role`',
        notApplicableReason: 'no runtime role',
      },
      'SURF-CC': { outcome: 'allowedWithConditions', text: '`Allowed with conditions` — routes to conflict-and-skew review' },
      'SURF-FL': { outcome: 'allowed', text: '`Allowed` — skew flagged as an operational event' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — clock-skew events are named telemetry' },
    },
    rolesAffected: 'Quality Manager resolves; Supervisor views',
    workerImpact: 'None visible mid-step',
    fallback: 'Device timestamps are not trusted to decide ordering alone',
    recovery: 'Server-receipt time orders the record; affected conflicts route to human review',
    commandBinding: { kind: 'none', why: 'A skew flag is an operational event travelling up, not a command travelling down.' },
    sourceRef: 'L78287',
  },
  {
    identifier: 'OFF-EVT-07',
    event: 'Worker steps away or hands back offline',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': { outcome: 'readOnly', text: '`Read-only` — flag not yet received' },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no runtime role`',
        notApplicableReason: 'no runtime role',
      },
      'SURF-CC': { outcome: 'cachedReadOnlyOffline', text: '`Cached read-only while offline` — no flag visible' },
      'SURF-FL': { outcome: 'allowed', text: '`Allowed` — flag raised locally and queued' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — no operational content' },
    },
    rolesAffected: 'Worker; Supervisor',
    workerImpact: 'Handover state preserved',
    fallback: 'Flag is queued, not dropped',
    recovery: 'Flag delivered at sync and surfaced to the Supervisor',
    commandBinding: { kind: 'none', why: 'A step-away or hand-back flag travels up on the operational event envelope.' },
    sourceRef: 'L78288',
  },
  {
    identifier: 'OFF-EVT-08',
    event: 'Coaching card requested at a step, offline',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': {
        outcome: 'notApplicable',
        text: '`Not applicable — no coaching role`',
        notApplicableReason: 'no coaching role',
      },
      'SURF-STU': { outcome: 'readOnly', text: '`Read-only` — authored coaching assets already in the package' },
      'SURF-CC': { outcome: 'readOnly', text: '`Read-only` — agent activity panel shows no new selection' },
      'SURF-FL': { outcome: 'allowedWithConditions', text: '`Allowed with conditions` — agent-selected card unavailable' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — agent availability visible' },
    },
    rolesAffected: 'Worker',
    workerImpact: 'Authored Work Instructions render instead; guidance never disappears',
    fallback: 'The step\'s authored Work Instructions are the source-named fallback',
    recovery: 'Agent-selected coaching resumes when connectivity returns',
    commandBinding: { kind: 'none', why: 'A coaching card is agent output, not a command-channel class.' },
    sourceRef: 'L78289',
  },
  {
    identifier: 'OFF-EVT-09',
    event: 'Photo evidence captured offline',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': {
        outcome: 'notApplicable',
        text: '`Not applicable — not yet received`',
        notApplicableReason: 'not yet received',
      },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no runtime role`',
        notApplicableReason: 'no runtime role',
      },
      'SURF-CC': { outcome: 'cachedReadOnlyOffline', text: '`Cached read-only while offline` — evidence not yet reviewable' },
      'SURF-FL': { outcome: 'allowed', text: '`Allowed` — stored in the app\'s encrypted store, never the device gallery' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — storage-pressure signal may rise' },
    },
    rolesAffected: 'Worker; Quality Manager marks evidence reviewed later',
    workerImpact: 'None',
    fallback: 'Media is evicted only after confirmed server receipt plus an integrity check',
    recovery: 'Evidence uploaded, validated, accepted, then available for review',
    commandBinding: { kind: 'none', why: 'Evidence travels up. Nothing travels down the command channel.' },
    sourceRef: 'L78290',
  },
  {
    identifier: 'OFF-EVT-10',
    event: 'Storage pressure rises on the device',
    block: 'device-or-floor',
    cells: {
      'SURF-DOH': {
        outcome: 'notApplicable',
        text: '`Not applicable — device-local condition`',
        notApplicableReason: 'device-local condition',
      },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no runtime role`',
        notApplicableReason: 'no runtime role',
      },
      'SURF-CC': { outcome: 'readOnly', text: '`Read-only` — surfaced through device state where telemetry allows' },
      'SURF-FL': { outcome: 'clientDecisionRequired', text: '`Client Decision Required` — storage-full behaviour is deferred' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — storage-pressure signals are named telemetry' },
    },
    rolesAffected: 'Tenant Admin; platform team',
    workerImpact: '`Client Decision Required`',
    fallback: '`Client Decision Required — DEC-STORE-001`; no behaviour may be invented',
    recovery: '`Client Decision Required — DEC-STORE-001`',
    commandBinding: { kind: 'none', why: 'A device-local condition. DEC-STORE-001 is open and no behaviour is invented here.' },
    sourceRef: 'L78291',
  },
  {
    identifier: 'OFF-EVT-11',
    event: 'Quality Manager releases a lot hold',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'allowed', text: '`Allowed` — decision and audit recorded in one transaction' },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — release is not an authoring act`',
        notApplicableReason: 'release is not an authoring act',
      },
      'SURF-CC': { outcome: 'allowed', text: '`Allowed` — action 4; displays issued then propagating' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — hold remains in force locally' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — no console role in tenant release' },
    },
    rolesAffected: 'Quality Manager only; Supervisor may request with a note',
    workerImpact: 'Held scope stays held until the command lands',
    fallback: 'Command held as queued and available for delivery',
    recovery: 'Delivered, downloaded, validated, applied, acknowledged, reconciled; display moves to in force for that device',
    commandBinding: {
      kind: 'class',
      commandClass: 'CMD-FL-LOTREL',
      why: 'The row IS the lot release. Its Recovery cell walks the command state ladder to reconciled.',
    },
    sourceRef: 'L78319',
  },
  {
    identifier: 'OFF-EVT-12',
    event: 'Supervisor grants a qualification clearance',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'allowed', text: '`Allowed` — grant, duration and categorised reason recorded' },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — clearances are not authored`',
        notApplicableReason: 'clearances are not authored',
      },
      'SURF-CC': { outcome: 'allowed', text: '`Allowed` — action 10' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — parked run stays parked' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — no console role' },
    },
    rolesAffected: 'Supervisor grants; Quality Manager on second override in the same area and shift',
    workerImpact: 'Parked run remains parked; other runs continue',
    fallback: 'Parked run is the terminal safe state until delivery',
    recovery: 'Clearance applies at next sync; parked run resumes',
    commandBinding: {
      kind: 'class',
      commandClass: 'CMD-FL-CLEAR',
      why: 'The row IS the qualification clearance, Command Center action 10.',
    },
    sourceRef: 'L78320',
  },
  {
    identifier: 'OFF-EVT-13',
    event: 'Supervisor reassigns a run or substitutes a worker',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'allowed', text: '`Allowed` — executed through the Hub assignment service' },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — assignment is not authored`',
        notApplicableReason: 'assignment is not authored',
      },
      'SURF-CC': { outcome: 'allowed', text: '`Allowed` — action 8' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — original assignment still active locally' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — no console role' },
    },
    rolesAffected: 'Supervisor; both workers',
    workerImpact: 'Substitute receives structured handover only after the command lands',
    fallback: 'Command queued; pre-substitution steps stay attributed to the original worker',
    recovery: 'Applied and acknowledged; Worker-Shift metering counts each worker who actually worked',
    commandBinding: {
      kind: 'class',
      commandClass: 'CMD-FL-REASSIGN',
      why: 'The row IS the reassignment or substitution, Command Center action 8.',
    },
    sourceRef: 'L78321',
  },
  {
    identifier: 'OFF-EVT-14',
    event: 'Studio publishes a notified-class version',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'allowed', text: '`Allowed` — version history recorded' },
      'SURF-STU': { outcome: 'allowed', text: '`Allowed` — three-stage chain completed' },
      'SURF-CC': { outcome: 'readOnly', text: '`Read-only` — no adoption display' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — in-flight run stays pinned' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — package inventory per run visible' },
    },
    rolesAffected: 'Job Owner decides adoption; Author, Reviewer, Release Authority',
    workerImpact: 'None mid-run; notice appears at the next execution boundary',
    fallback: 'Version pinning holds; changes never interrupt an in-flight run',
    recovery: 'Version-change command applies at next sync; change notice renders on the first screen of the next execution',
    commandBinding: {
      kind: 'class',
      commandClass: 'CMD-FL-VERSION',
      why: 'Its Recovery cell: the version-change command applies at the next sync.',
    },
    sourceRef: 'L78322',
  },
  {
    identifier: 'OFF-EVT-15',
    event: 'Lane B approval auto-publishes a patch',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'allowed', text: '`Allowed` — audited publication recorded' },
      'SURF-STU': { outcome: 'allowed', text: '`Allowed` — patch recorded against the workflow' },
      'SURF-CC': { outcome: 'allowed', text: '`Allowed` — action 3 taken by Quality Manager or above' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — arrives per the tenant\'s adoption timing' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — package inventory visible' },
    },
    rolesAffected: 'Quality Manager decides; `DEC-LANEB-001` unresolved',
    workerImpact: 'None; patch applies without ceremony at next execution',
    fallback: 'Server-only values apply immediately server-side; package-borne values wait for the package',
    recovery: 'Patch adopted at next sync or next run boundary per tenant adoption timing',
    commandBinding: {
      kind: 'class',
      commandClass: 'CMD-FL-VERSION',
      why: 'A Lane B patch distributes as a version change on the same class.',
    },
    sourceRef: 'L78323',
  },
  {
    identifier: 'OFF-EVT-16',
    event: 'Tenant Admin changes a severity action bundle',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'allowed', text: '`Allowed` — configuration change audited' },
      'SURF-STU': { outcome: 'clientDecisionRequired', text: '`Client Decision Required` — republication requirement not stated' },
      'SURF-CC': { outcome: 'readOnly', text: '`Read-only` — bundle change is configuration, not an operational action' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — device executes the bundle carried in its pinned package' },
      'SURF-SA': { outcome: 'readOnly', text: '`Read-only` — floor register governs the minimum' },
    },
    rolesAffected: 'Tenant Admin; Quality Manager',
    workerImpact: 'None mid-run',
    fallback: 'The pinned package\'s bundle continues to govern',
    recovery: '`Client Decision Required — DEC-BUNDLE-001` proposed in Section 35.7',
    commandBinding: { kind: 'none', why: 'A severity action bundle is tenant configuration. The device executes the bundle carried in its pinned package, so nothing is dispatched to it.' },
    sourceRef: 'L78324',
  },
  {
    identifier: 'OFF-EVT-17',
    event: 'Soft or hard suspension applied to the tenant',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'allowed', text: '`Allowed` — lifecycle state changed and audited' },
      'SURF-STU': { outcome: 'readOnly', text: '`Read-only` — authoring constrained per state' },
      'SURF-CC': { outcome: 'readOnly', text: '`Read-only` — banner where applicable' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — suspension honoured only once received' },
      'SURF-SA': { outcome: 'allowed', text: '`Allowed` — console may initiate' },
    },
    rolesAffected: 'Tenant Admin banner for soft; all roles for hard',
    workerImpact: 'Under soft, operations continue in full; under hard, in-flight runs complete and no new runs start',
    fallback: 'Cached suspension state is trusted only within the offline trust window',
    recovery: 'Suspension applied at next contact; forced re-sync bounded by the trust window',
    commandBinding: {
      kind: 'class',
      commandClass: 'CMD-FL-SUSPEND',
      why: 'Soft and hard suspension are two of the three states L39665 gives that one class.',
    },
    sourceRef: 'L78325',
  },
  {
    identifier: 'OFF-EVT-18',
    event: 'Compliance suspension applied',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'allowed', text: '`Allowed` — critical-class action recorded' },
      'SURF-STU': { outcome: 'readOnly', text: '`Read-only` — logins blocked' },
      'SURF-CC': { outcome: 'readOnly', text: '`Read-only` — logins blocked' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — device locks at next contact with the fixed message' },
      'SURF-SA': { outcome: 'allowed', text: '`Allowed` — client platform team only, critical class' },
    },
    rolesAffected: 'All tenant roles; Root Super Admin approves',
    workerImpact: 'Work is preserved; the device locks on contact',
    fallback: 'Cache-validity rule bounds how long a dark tablet may continue',
    recovery: 'Device locks at next contact showing the fixed worker-facing message',
    commandBinding: {
      kind: 'class',
      commandClass: 'CMD-FL-SUSPEND',
      why: 'The compliance stop is the third of the three states L39665 gives that one class.',
    },
    sourceRef: 'L78326',
  },
  {
    identifier: 'OFF-EVT-19',
    event: 'Remote wipe or de-authorisation issued',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'readOnly', text: '`Read-only` — mirrored to the tenant audit stream' },
      'SURF-STU': {
        outcome: 'notApplicable',
        text: '`Not applicable — no authoring role`',
        notApplicableReason: 'no authoring role',
      },
      'SURF-CC': { outcome: 'readOnly', text: '`Read-only` — not a Command Center action' },
      'SURF-FL': { outcome: 'queuedOffline', text: '`Queued while offline` — no erasure can occur' },
      'SURF-SA': { outcome: 'allowedWithConditions', text: '`Allowed with conditions` — critical class, final sync attempt required first' },
    },
    rolesAffected: 'Root Super Admin approves; Admin submits',
    workerImpact: 'None until the device returns',
    fallback: '`Client Decision Required — DEC-WIPE-001`; pending duration and never-returns case unstated',
    recovery: 'Final sync attempted, then erasure, then audit reconciliation',
    commandBinding: {
      kind: 'stop-class-without-a-command-class',
      items: ['Device de-authorisation', 'Remote data wipe'],
      why: 'Named in the stop class at L39672 and carried by none of the five classes. The gap is DEC-CMDCLASS-001, recorded in @/frontline/commands.',
    },
    sourceRef: 'L78327',
  },
  {
    identifier: 'OFF-EVT-20',
    event: 'Platform-wide agent emergency pause',
    block: 'server-while-offline',
    cells: {
      'SURF-DOH': { outcome: 'readOnly', text: '`Read-only` — no record impact' },
      'SURF-STU': { outcome: 'readOnly', text: '`Read-only` — authoring unaffected' },
      'SURF-CC': { outcome: 'allowedWithConditions', text: '`Allowed with conditions` — renders as agent unavailability, never silence' },
      'SURF-FL': { outcome: 'allowedWithConditions', text: '`Allowed with conditions` — coaching absent; deterministic layer untouched' },
      'SURF-SA': { outcome: 'allowed', text: '`Allowed` — Super Admin action, resume is separate and audited' },
    },
    rolesAffected: 'Platform team; all tenant roles observe unavailability',
    workerImpact: 'Authored Work Instructions continue; gates and classification continue',
    fallback: 'The deterministic backbone has no off switch',
    recovery: 'Resume is a separate audited act; in-flight agent runs checkpoint and park',
    commandBinding: { kind: 'none', why: 'A platform-wide agent pause is a Super Admin act on the reasoning layer, not a device command. The deterministic backbone has no off switch.' },
    sourceRef: 'L78328',
  },
] as const satisfies readonly OffEventRow[]

type MissingFromEventMatrix = Exclude<
  OffEventId,
  (typeof OFF_EVENT_MATRIX)[number]['identifier']
>
const _eventMatrixExhaustive: MissingFromEventMatrix extends never ? true : never = true
void _eventMatrixExhaustive

/**
 * Which phase of `DEC-SYNC-001`'s adopted order this event's command drains
 * in, or `null` where the event carries no command at all.
 *
 * The class case DEFERS to `COMMAND_CLASS_PHASE`; it does not restate it. The
 * classless case is `stop-class` because L39672 names device de-authorisation
 * and remote wipe inside the stop class itself, which is the one thing
 * `COMMAND_CLASS_PHASE` cannot say — those two acts have no class to key on.
 */
export function offEventDrainPhase(row: OffEventRow): ReconnectionPhase | null {
  switch (row.commandBinding.kind) {
    case 'class':
      return COMMAND_CLASS_PHASE[row.commandBinding.commandClass]
    case 'stop-class-without-a-command-class':
      return 'stop-class'
    case 'none':
      return null
  }
}
