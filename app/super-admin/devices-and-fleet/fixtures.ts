import type { RoleId } from '@/domain/roles'
import type { CommandState } from '@/surfaces/sa/command-state'

/**
 * MOD-SA-13 seeded fixture data. Spec §8, and risk R1 in the census: this is
 * the highest-risk module in the slice, because every element of it is a
 * claim about a device channel this prototype does not have. Nothing below
 * is computed. No `Date.now()`, `new Date()` or `Math.random()`: every
 * as-of stamp and every age is a fixed string, because the honesty of a
 * fleet reading comes from saying WHEN it was true.
 *
 * `AC-SA-13-05` (L45570) governs the whole file: no console view renders an
 * unreached device as wiped, locked or updated. The two wipe sequences below
 * are therefore ADVANCED BY THE READER, one explicit step at a time, and the
 * unreachable one has no step past `available for delivery` to advance to.
 *
 * The fleet rows carry device telemetry only. No row names a worker, carries
 * a rate, or descends below the tenant for anything commercial — §6 of the
 * spec holds here exactly as it holds on `MOD-SA-12`.
 */

/**
 * The four console roles in the source's own `ROLE-PLAT-*` spelling, paired
 * with the `RoleId` the policy evaluator already knows. A deliberate subset
 * of `RoleId` (the PLATFORM domain only), so no exhaustiveness check over
 * `RoleId` is possible or wanted.
 *
 * D16: this module's `roles_allowed` differs in all nine extraction chunks
 * that name it — `["Admin","Platform Engineer"]` (L2442), `["Root Super
 * Admin","Admin"]` (L11670), `["Root Super Admin","Admin","Support"]`
 * (L21090), all four (L45502), `[]` (L98241) — so module-level
 * `roles_allowed` is authoritative nowhere and every affordance on the
 * screen is decided by its own control entry instead.
 */
export interface DevicePlatformRole {
  readonly sourceId: string
  readonly roleId: RoleId
  readonly name: string
}

export const DEVICE_PLATFORM_ROLES = [
  { sourceId: 'ROLE-PLAT-ROOT', roleId: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin' },
  { sourceId: 'ROLE-PLAT-ADMIN', roleId: 'ADMIN', name: 'Admin' },
  { sourceId: 'ROLE-PLAT-ENG', roleId: 'PLATFORM_ENGINEER', name: 'Platform Engineer' },
  { sourceId: 'ROLE-PLAT-SUP', roleId: 'SUPPORT', name: 'Support' },
] as const satisfies readonly DevicePlatformRole[]

/** `OBJ-SA-DEVICE`'s five lifecycle states, in the source's own order
 *  (L45517, restated as a state vocabulary at L45518). */
export type DeviceLifecycleState =
  | 'enrolled'
  | 'active'
  | 'mode changed'
  | 'retired'
  | 'de-authorised'

export const DEVICE_LIFECYCLE_STATES = [
  'enrolled',
  'active',
  'mode changed',
  'retired',
  'de-authorised',
] as const satisfies readonly DeviceLifecycleState[]

type MissingFromDeviceStates = Exclude<
  DeviceLifecycleState,
  (typeof DEVICE_LIFECYCLE_STATES)[number]
>
const _deviceStatesExhaustive: MissingFromDeviceStates extends never ? true : never = true
void _deviceStatesExhaustive

/**
 * Whether the platform has heard from this device at all recently. `reached`
 * is the ONLY value under which any device-side effect may be rendered as
 * having happened; every other value renders the effect as outstanding
 * (AC-SA-13-05).
 */
export type DeviceContact = 'reached' | 'not reached'

export interface PackageInventoryRow {
  readonly packageVersion: string
  readonly scope: string
  /** A count at the tenant-month grain (AC-SA-13-06). Never a rate, never a
   *  series, never attached to a person. */
}

export interface DeviceAuditRow {
  readonly when: string
  readonly what: string
  readonly entryClass: string
  readonly mirrored: string
}

export interface DeviceRow {
  readonly id: string
  /** An anonymised tenant label. No link on this console resolves to the
   *  tenant record behind it. */
  readonly tenantLabel: string
  readonly state: DeviceLifecycleState
  /** Shared or Personal — an enrollment binding class, set tenant-side. It
   *  names a binding, never a named person. */
  readonly mode: 'Shared' | 'Personal'
  readonly binding: string
  readonly appVersion: string
  readonly floorStatus: string
  readonly contact: DeviceContact
  readonly lastSeen: string
  readonly heartbeat: string
  readonly syncHealth: string
  readonly clockSkew: string
  readonly storagePressure: string
  /** One plain sentence for the detail pane. Says what is outstanding, and
   *  never converts an outstanding command into an accomplished one. */
  readonly note: string
  readonly packages: readonly PackageInventoryRow[]
  readonly auditTrail: readonly DeviceAuditRow[]
}

export const DEVICES = [
  {
    id: 'DEV-TAB-0141',
    tenantLabel: 'Brightbikes Manufacturing (TEN-BRIGHTBIKES)',
    state: 'active',
    mode: 'Shared',
    binding: 'Assembly area 2',
    appVersion: '4.2.0',
    floorStatus: 'at or above the application-version floor',
    contact: 'reached',
    lastSeen: '2026-08-16 07:41 platform time',
    heartbeat: 'reporting',
    syncHealth: 'all captures synced',
    clockSkew: 'none recorded in the last seven days',
    storagePressure: 'none recorded',
    note: 'Operating normally against the current package. Nothing is outstanding against this device.',
    packages: [
      {
        packageVersion: 'PKG-ASSY-4.2.0',
        scope: 'Assembly area 2',
      },
      {
        packageVersion: 'PKG-ASSY-4.1.0',
        scope: 'Assembly area 2, superseded',
      },
    ],
    auditTrail: [
      {
        when: '2026-07-02 09:12 platform time',
        what: 'Device enrolled by the tenant, in Shared mode',
        entryClass: 'tenant-side enrollment',
        mirrored: 'recorded in the tenant’s own audit stream',
      },
      {
        when: '2026-08-04 06:30 platform time',
        what: 'Package version moved from PKG-ASSY-4.1.0 to PKG-ASSY-4.2.0',
        entryClass: 'routine',
        mirrored: 'recorded in the tenant’s own audit stream',
      },
    ],
  },
  {
    id: 'DEV-TAB-0208',
    tenantLabel: 'Clearwater Tooling (TEN-CLEARWATER)',
    state: 'enrolled',
    mode: 'Shared',
    binding: 'not yet bound to an area',
    appVersion: '3.9.1',
    floorStatus: 'below the application-version floor of 4.1.0',
    contact: 'not reached',
    lastSeen: 'not seen since enrollment',
    heartbeat: 'not reporting',
    syncHealth: 'unknown — the device has not been reached',
    clockSkew: 'unknown — the device has not been reached',
    storagePressure: 'unknown — the device has not been reached',
    note: 'Enrolled with no package, and therefore no runnable work (WF-DVC-001, L53085). It has not been reached since, so every device-side reading here is stated as unknown rather than filled in.',
    packages: [],
    auditTrail: [
      {
        when: '2026-08-11 14:05 platform time',
        what: 'Device enrolled by the tenant',
        entryClass: 'tenant-side enrollment',
        mirrored: 'recorded in the tenant’s own audit stream',
      },
    ],
  },
  {
    id: 'DEV-TAB-0233',
    tenantLabel: 'North Forge Components (TEN-NORTHFORGE)',
    state: 'mode changed',
    mode: 'Personal',
    binding: 'Inspection area 1',
    appVersion: '4.1.0',
    floorStatus: 'at or above the application-version floor',
    contact: 'not reached',
    lastSeen: '2026-08-14 18:02 platform time',
    heartbeat: 'not reporting for 41 hours',
    syncHealth: 'captures held locally and unsynced: 7 recorded before the last contact',
    clockSkew: 'one event recorded at the last contact, 4 minutes ahead of platform time',
    storagePressure: 'signalled at the last contact',
    note: 'A mode change was recorded platform-side and the device has not been reached since. The mode change is rendered as outstanding, not as taken (AC-SA-13-05).',
    packages: [
      {
        packageVersion: 'PKG-INSP-4.1.0',
        scope: 'Inspection area 1',
      },
    ],
    auditTrail: [
      {
        when: '2026-08-15 08:20 platform time',
        what: 'Mode change recorded platform-side; outstanding against the device',
        entryClass: 'routine',
        mirrored: 'recorded in the tenant’s own audit stream',
      },
    ],
  },
  {
    id: 'DEV-TAB-0271',
    tenantLabel: 'Clearwater Tooling (TEN-CLEARWATER)',
    state: 'de-authorised',
    mode: 'Shared',
    binding: 'Assembly area 1',
    appVersion: '4.2.0',
    floorStatus: 'at or above the application-version floor',
    contact: 'not reached',
    lastSeen: '2026-08-05 11:58 platform time',
    heartbeat: 'not reporting for 11 days',
    syncHealth: 'captures held locally and unsynced: 23 recorded before the last contact',
    clockSkew: 'unknown since the last contact',
    storagePressure: 'unknown since the last contact',
    note: 'Reported stolen. De-authorised server-side, so it cannot authenticate; the erasure itself is outstanding and stays outstanding while the device is unreached (WF-DVC-004, L53189). This console renders it as de-authorised and the wipe as pending, never as erased.',
    packages: [
      {
        packageVersion: 'PKG-ASSY-4.2.0',
        scope: 'Assembly area 1',
      },
    ],
    auditTrail: [
      {
        when: '2026-08-06 09:00 platform time',
        what: 'Wipe and de-authorisation request drafted by the Admin',
        entryClass: 'critical class',
        mirrored: 'mirrored to the tenant’s own audit stream',
      },
      {
        when: '2026-08-06 09:34 platform time',
        what: 'Request approved by the Root Super Admin; command recorded and queued',
        entryClass: 'critical class',
        mirrored: 'mirrored to the tenant’s own audit stream',
      },
    ],
  },
  {
    id: 'DEV-TAB-0294',
    tenantLabel: 'Brightbikes Manufacturing (TEN-BRIGHTBIKES)',
    state: 'retired',
    mode: 'Shared',
    binding: 'unbound at retirement',
    appVersion: '4.2.0',
    floorStatus: 'at or above the application-version floor at retirement',
    contact: 'reached',
    lastSeen: '2026-07-30 16:44 platform time',
    heartbeat: 'not reporting — retired',
    syncHealth: 'all captures synced at the final sync attempt',
    clockSkew: 'none recorded before retirement',
    storagePressure: 'none recorded before retirement',
    note: 'End of the roughly two-year fleet lifecycle. Retired and wiped with a final sync attempt that completed and was acknowledged by the device itself (L42510).',
    packages: [
      {
        packageVersion: 'PKG-ASSY-4.2.0',
        scope: 'Assembly area 3, at retirement',
      },
    ],
    auditTrail: [
      {
        when: '2026-07-30 15:10 platform time',
        what: 'Wipe and de-authorisation approved by the Root Super Admin',
        entryClass: 'critical class',
        mirrored: 'mirrored to the tenant’s own audit stream',
      },
      {
        when: '2026-07-30 16:44 platform time',
        what: 'Device acknowledged the erasure after its final sync attempt completed',
        entryClass: 'critical class',
        mirrored: 'mirrored to the tenant’s own audit stream',
      },
    ],
  },
] as const satisfies readonly DeviceRow[]

/**
 * `AC-SA-01-03`: a fleet aggregate carries the moment it was true, a
 * degraded one is stale with its age, a wholly unavailable one says so.
 * Neither is ever a zero and neither is ever a blank.
 */
export type AggregateFreshness = 'current' | 'stale' | 'unavailable'

export interface FleetAggregateRow {
  readonly tenantLabel: string
  readonly enrolled: string
  readonly unreached: string
  readonly asOf: string
  readonly freshness: AggregateFreshness
  /** Required by `stale`: the age, in words. */
  readonly age?: string
}

export const FLEET_AGGREGATES = [
  {
    tenantLabel: 'Brightbikes Manufacturing (TEN-BRIGHTBIKES)',
    enrolled: '48 devices enrolled',
    unreached: 'none unreached in the last 24 hours',
    asOf: 'as of 2026-08-16 07:45 platform time',
    freshness: 'current',
  },
  {
    tenantLabel: 'North Forge Components (TEN-NORTHFORGE)',
    enrolled: '17 devices enrolled',
    unreached: '3 unreached in the last 24 hours',
    asOf: 'as of 2026-08-16 05:30 platform time',
    freshness: 'stale',
    age: '135 minutes old',
  },
  {
    tenantLabel: 'Clearwater Tooling (TEN-CLEARWATER)',
    enrolled: 'Measure unavailable',
    unreached: 'Measure unavailable',
    asOf: 'as of the last successful aggregation, 2026-08-15 22:10 platform time',
    freshness: 'unavailable',
  },
] as const satisfies readonly FleetAggregateRow[]

/**
 * One step of a wipe command, as the READER advances it. `state` is one of
 * the fifteen canonical command states and is always on screen; `note` says
 * what is true at that step and, where relevant, what is NOT.
 */
export interface WipeStep {
  readonly state: CommandState
  readonly note: string
  /** `AC-SA-13-04`: the final sync attempt of pending captures. Erasure does
   *  not begin before this step, and there is no way to step past it. */
  readonly finalSyncAttempt?: true
  /** The step at which erasure actually runs on the device. It sits after
   *  the final-sync step by construction, which is what makes sync-then-wipe
   *  structural here rather than a promise in copy. */
  readonly erasureRuns?: true
}

/**
 * A wipe on a device that does come back. WF-DVC-006 (L53257) and the §23.13
 * walkthrough (L45474): drafted, approved, queued, delivered, validated,
 * a final sync attempt, erasure, the device's own acknowledgement, and the
 * reconciliation statement.
 */
export const REACHED_WIPE_SEQUENCE = [
  {
    state: 'created',
    note: 'The Admin drafts the wipe and de-authorisation request with its reason. Nothing has been sent to any device.',
  },
  {
    state: 'authorized',
    note: 'The Root Super Admin approves the critical-class request. The approval is recorded in the platform audit stream and mirrored into the tenant’s own audit stream (AC-SA-13-03).',
  },
  {
    state: 'queued',
    note: 'The command is recorded on the platform side. The device has not been contacted, and nothing has happened on it.',
  },
  {
    state: 'available for delivery',
    note: 'The command is waiting for the device to make contact. It has not been delivered.',
  },
  {
    state: 'delivered',
    note: 'The device made contact and received the command. It has not acted on it.',
  },
  {
    state: 'downloaded',
    note: 'The device has the command payload. Still nothing has been erased.',
  },
  {
    state: 'validated',
    note: 'The device checks the command against its own enrollment, then attempts a final sync of its pending captures. Erasure does not begin until that attempt completes or is recorded as impossible — de-authorising a device must not destroy unsynced work (AC-SA-13-04). This step is the final sync attempt, and there is no path around it.',
    finalSyncAttempt: true,
  },
  {
    state: 'applied',
    note: 'The device reports that the erasure ran, after its final sync attempt completed. This is the device’s own report; nothing on this console renders a command as applied on anything weaker (AC-SA-000-08).',
    erasureRuns: true,
  },
  {
    state: 'acknowledged',
    note: 'The device confirms the completed command. The device is de-authorised server-side and erased device-side, and both facts are now true rather than assumed.',
  },
  {
    state: 'reconciled',
    note: 'A reconciliation statement names what the final sync attempt recovered and what it did not. Nothing is closed to make the statement look clean (WF-RES-003, L55481).',
  },
] as const satisfies readonly WipeStep[]

/**
 * A wipe on a device that never comes back — `WF-CMD-WIPE` (L81586),
 * `WF-DEV-WIPE` (L117496), `WF-DVC-004` (L53189). The sequence STOPS at
 * `available for delivery`. There is no further state to advance to, because
 * there is no further fact: the device has not been reached, and DEC-WIPE-001
 * is open on how long the command may stay pending.
 */
export const UNREACHED_WIPE_SEQUENCE = [
  {
    state: 'created',
    note: 'The Admin drafts the wipe and de-authorisation request after the tenant reports the device stolen.',
  },
  {
    state: 'authorized',
    note: 'The Root Super Admin approves the critical-class request. The device is de-authorised server-side, so it cannot authenticate; that is a platform-side fact and it does not touch the device.',
  },
  {
    state: 'queued',
    note: 'The command is recorded on the platform side. The console accepts and records every command directed at an offline device, and claims nothing about its arrival.',
  },
  {
    state: 'available for delivery',
    note: 'Waiting for a device that has not made contact for 11 days. The command stays here: not delivered, and never rendered as taken. The 23 captures held on the device remain unsynced and are named as unrecovered rather than written off. How long a command may remain pending is unstated in the frozen source — DEC-WIPE-001 is open, and this fixture does not invent an expiry.',
  },
] as const satisfies readonly WipeStep[]

/** The reason the unreachable stepper is inert once it reaches the end. */
export const UNREACHED_STEPPER_END_REASON =
  'There is no further state to step to. The device has not been reached, so the next fact does not exist — advancing would render an unreached device as having taken the command, which AC-SA-13-05 forbids. DEC-WIPE-001 is open on how long the command may stay pending.'

export interface CommandLogRow {
  readonly id: string
  readonly device: string
  readonly command: string
  readonly state: CommandState
  readonly recordedAt: string
  readonly note: string
}

export const SEEDED_COMMANDS = [
  {
    id: 'CMD-0611',
    device: 'DEV-TAB-0271',
    command: 'Wipe and de-authorisation',
    state: 'available for delivery',
    recordedAt: '2026-08-06 09:34 platform time',
    note: 'Recorded and outstanding. It has not been delivered: the device has not made contact for 11 days.',
  },
  {
    id: 'CMD-0618',
    device: 'DEV-TAB-0233',
    command: 'Mode change to Shared',
    state: 'queued',
    recordedAt: '2026-08-15 08:20 platform time',
    note: 'Recorded and outstanding. It has not been delivered: the device has not reported for 41 hours.',
  },
  {
    id: 'CMD-0620',
    device: 'DEV-TAB-0141',
    command: 'Package update to PKG-ASSY-4.2.0',
    state: 'reconciled',
    recordedAt: '2026-08-04 06:30 platform time',
    note: 'Concluded: the device confirmed the completed command and the reconciliation pass closed it.',
  },
] as const satisfies readonly CommandLogRow[]

/**
 * WF-DVC-005 (L53224) — a device suspension issued by the platform Admin
 * against a device that is not reporting. Appending this row is what the
 * suspension control does: the command is accepted and recorded, and the
 * console says plainly that it has not arrived.
 */
export const SUSPENSION_COMMAND = {
  id: 'CMD-0623',
  device: 'DEV-TAB-0271',
  command: 'Device suspension',
  state: 'queued',
  recordedAt: '2026-08-16 08:02 platform time',
  note: 'Recorded and outstanding. It has not been delivered: the device has not made contact for 11 days. All local data is preserved by a suspension; nothing is erased by it (WF-DVC-005, L53224).',
} as const satisfies CommandLogRow

export interface DevicePolicyItem {
  readonly name: string
  readonly value: string
  readonly note: string
  readonly sourceRef: string
}

/**
 * `OBJ-SA-DEVICEPOLICY` (L45517). The source names these three as the policy
 * the console owns, and defines NO control for editing any of them — so they
 * render as read-only configuration truth, and the missing editors are named
 * in the unspecified-in-source panel rather than drawn.
 */
export const DEVICE_POLICY_ITEMS = [
  {
    name: 'Minimum device specification',
    value: 'Working floor: a mainstream Android and iOS specification',
    note: 'DEC-DEVICE-001 is open — the client owes the standardised device profile (make, class, capability tier, operating-system split), and the published specification follows from it. The value shown is the working floor the source states, not a settled figure.',
    sourceRef: 'L45517, DEC-DEVICE-001 L4484',
  },
  {
    name: 'Application-version floor',
    value: '4.1.0',
    note: 'A device below the floor is shown as below the floor. The fleet carries mixed versions and each device’s version is stated explicitly (WF-AUT-008, L53596).',
    sourceRef: 'L45517, L76078',
  },
  {
    name: 'Cache-validity rule',
    value: 'Enforced on the device; the console owns the policy',
    note: 'A device holding content past validity cannot start new work. The rule is enforced device-side, which is why this console can state the policy and never the outcome (L98241).',
    sourceRef: 'L45517, L98241',
  },
] as const satisfies readonly DevicePolicyItem[]

export interface DeviceWorkflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalState: string
  readonly here: string
  readonly sourceRef: string
}

/**
 * The device workflows the frozen source defines. WF-DVC-001…006 carry no
 * `module_id` in the extraction; they are matched to this module by LINE
 * PROXIMITY — they sit at L53085…L53257, immediately under the CHK-016
 * `MOD-SA-13` module entry at L53070, whose `key_functions` list is exactly
 * `["WF-DVC-003","WF-DVC-004","WF-DVC-005","WF-DVC-006"]`. The remaining
 * three are matched by name (they name the wipe and the device explicitly).
 */
export const DEVICE_WORKFLOWS = [
  {
    id: 'WF-DVC-001',
    name: 'Enrolling a device into the tenant’s fleet',
    actor: 'Tenant Admin — no console role',
    trigger: 'The Tenant Admin opens device enrollment',
    terminalState: 'enrolled with no package, therefore no runnable work',
    here: 'No control. Enrollment is tenant self-service within platform policy, and no console role holds it (AC-SA-13-02).',
    sourceRef: 'L53085',
  },
  {
    id: 'WF-DVC-002',
    name: 'Reassigning a device to another area or worker group',
    actor: 'Tenant Admin — no console role',
    trigger: 'The Tenant Admin changes the device’s area binding',
    terminalState: 'device holds stale content but cannot start new work',
    here: 'No control. The console reads the binding and the cache-validity policy; it does not set a tenant’s binding.',
    sourceRef: 'L53118',
  },
  {
    id: 'WF-DVC-003',
    name: 'Handling a lost device',
    actor: 'Tenant Admin reports; platform Admin acts',
    trigger: 'The Tenant Admin marks the device lost',
    terminalState:
      'cached authority expired, device unable to authenticate or start work, captures still held locally and unsynced',
    here: 'The de-authorisation is drafted below as a critical-class request. The captures stay named as unrecovered.',
    sourceRef: 'L53150',
  },
  {
    id: 'WF-DVC-004',
    name: 'Handling a stolen device',
    actor: 'Tenant Admin reports; platform Admin proposes; Root Super Admin approves',
    trigger: 'The tenant reports theft',
    terminalState:
      'device de-authorised server-side, wipe pending indefinitely, unsynced captures declared lost in a named reconciliation statement',
    here: 'This is the unreachable-device stepper below. It stops at available for delivery and never claims more.',
    sourceRef: 'L53189',
  },
  {
    id: 'WF-DVC-005',
    name: 'Suspending a device',
    actor: 'platform Admin',
    trigger: 'The Admin issues a device suspension',
    terminalState: 'device unable to authenticate after the window, all local data preserved',
    here: 'The suspension control below records the command against the device and says plainly that it has not arrived.',
    sourceRef: 'L53224',
  },
  {
    id: 'WF-DVC-006',
    name: 'Wiping a device under the sync-then-wipe rule',
    actor: 'platform Admin proposes, Root Super Admin approves',
    trigger: 'The Admin raises a wipe and de-authorisation request with its reason',
    terminalState:
      'wipe held, device de-authorised, captures still on the encrypted store, named statement of what has not been recovered',
    here: 'Both steppers below are this workflow: one on a device that returns, one on a device that does not.',
    sourceRef: 'L53257',
  },
  {
    id: 'WF-CMD-WIPE',
    name: 'A remote wipe issued to a device that never returns',
    actor: 'Root Super Admin and platform Admin',
    trigger: 'A wipe is issued as a critical-class action to an unreachable device',
    terminalState:
      'command pending, not applied, honestly rendered; DEC-WIPE-001 governs a device that never returns',
    here: 'The unreachable stepper, and the open decision named on it rather than resolved in code.',
    sourceRef: 'L81586',
  },
  {
    id: 'WF-DEV-WIPE',
    name: 'Authorise, queue, attempt final sync, erase',
    actor: 'the client’s platform team',
    trigger: 'A wipe command is issued to a device that is offline',
    terminalState: 'the wipe stays pending and is rendered as pending; the device is not assumed erased',
    here: 'The order of the steps is the rule: the final sync attempt sits before erasure and cannot be stepped past.',
    sourceRef: 'L117496',
  },
  {
    id: 'WF-RES-003',
    name: 'Producing a reconciliation statement',
    actor: 'the reconciliation service',
    trigger: 'Device reconnection, run finish, incident recovery, wipe, suspension exit, or a scheduled pass',
    terminalState:
      'the difference remains open, named, and aging; nothing is closed to make a report look clean',
    here: 'The last step of the reachable stepper, and the named statement of unrecovered captures on the unreachable one.',
    sourceRef: 'L55481',
  },
] as const satisfies readonly DeviceWorkflow[]

/**
 * ABSENT by rule (spec §3): the action exists for no account, the root
 * included. Nothing is drawn where each would sit — only the note.
 */
export const ABSENT_BY_RULE = [
  'No console role can enroll a tenant’s device. Enrollment is tenant self-service within platform policy (AC-SA-13-02, L45570), so no enrollment control exists on this console for any account including the root.',
  'No control wipes a device without a final sync attempt of its pending captures. The sequence has no such path for any account including the root — de-authorising a device must not destroy unsynced work (AC-SA-13-04, L45570).',
  'No control marks a command applied, or a device wiped, locked or updated, on anything weaker than the device’s own report. There is no override for an unreached device (AC-SA-13-05, AC-SA-000-08).',
  'No delete or purge control exists on this or any storage surface. The captures held on an unreached device are named as unrecovered; they are not cleared from the record to tidy it (L46074).',
  'No control here opens record-level tenant content — not a run, not a capture, not a worker record. There is no ambient browsing anywhere on this console (AC-SA-000-07, AC-SEC-801).',
  'No control cancels or expires a pending command. Cancelled and expired are states in the vocabulary, and the source defines no console action that causes either; DEC-WIPE-001 is open on the lifetime of a pending command.',
] as const satisfies readonly string[]

/**
 * D15 / per-module contract item 8: affordances a reader might expect on a
 * fleet screen that the frozen source does not define. Named, not invented —
 * a plausible invented control reads back as a requirement.
 */
export const UNSPECIFIED_IN_SOURCE = [
  'No filter or sort control is defined for the cross-tenant fleet table. The source names the columns (§8.13, L53070) and no control over them.',
  'No export of the fleet inventory or of a device audit trail is defined for this module.',
  'No editor is defined for the minimum device specification, the application-version floor or the cache-validity rule. The console owns the policy layer; the source names no control that changes a value in it.',
  'No control is defined for retiring a device. Retired is one of the five device states and the source names no console action that causes it.',
  'No control is defined for acknowledging or clearing a clock-skew event or a storage-pressure signal. They are rendered as telemetry and nothing more.',
  'No control is defined for changing a device’s mode or its area binding from this console. Both are tenant-side (WF-DVC-002).',
  'No search across the fleet is defined, and none is drawn: a search box on a cross-tenant fleet is the ambient-browsing path the source forbids.',
] as const satisfies readonly string[]

/** Questions the frozen source leaves open or answers twice. None is
 *  resolved silently in code. */
export const UNRESOLVED_IN_SOURCE = [
  'DEC-WIPE-001 is open: a wipe requiring a final sync attempt cannot reach a device that never returns, and no expiry is stated. The pending command is left pending and named, rather than given an invented lifetime (L4475, L1678).',
  'DEC-DEVICE-001 is open: the standardised device profile is owed by the client, so the minimum device specification is shown as a working floor rather than a published figure (L4484).',
  'This module’s roles_allowed differs in every extraction chunk that names it — two roles at L2442, two different ones at L11670, three at L21090, four at L45502, none at L98241. D16: module-level roles_allowed is authoritative nowhere, and every affordance here is decided by its own control entry instead.',
  'The critical-class list is titled "the ten critical actions" and enumerates eleven (L55942). D12: all eleven are carried, and device wipe is one of them either way.',
] as const satisfies readonly string[]
