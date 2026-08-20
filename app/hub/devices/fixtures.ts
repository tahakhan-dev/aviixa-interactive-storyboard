import type { ScreenStateId } from '@/ui/screen-state'
import type { CommandState } from '@/ui/ScreenStateBoundary'
import type { WriteAction } from '@/surfaces/doh/tenant-state'
import { DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import { DOH_AREAS, DOH_SITES, areaById } from '../location-configuration/fixtures'
import type { TenantRoleId } from '../HubShell'
import type { ControlStatus, DohControlMatrixRow } from '@/surfaces/doh/modules'

/**
 * `SCR-DOH-DEVICES` — Device enrollment and the tenant's device inventory.
 *
 * THIS SCREEN IS NOT A MODULE, AND CLAIMS NONE. The screen identifier occurs
 * exactly once in the frozen source (L67861) and appears in NEITHER screen
 * catalogue, so no catalogue row is minted for it and no module id appears
 * anywhere in this directory. The workflow catalogue does attribute device
 * enrolment and reassignment to a Hub module — the tenant view of platform
 * administration — but that module's own card says the Hub shows the tenant
 * its own position, read-only, and nothing more; a read-only module cannot own
 * device enrolment. Its card governs (D5), and those catalogue rows are
 * recorded as attributed-but-disputed on THAT screen rather than acted on here.
 *
 * BEHIND ONE NAMED FEATURE FLAG, defaulting to enabled (D3). `DEC-DEVOWN-001`
 * is an open Client Decision on whether a Tenant Admin may enrol at all: three
 * acceptance criteria and the platform console's own role matrix — which
 * prohibits all four platform roles from enrolling — say yes, against two
 * storyboard strings that say the console does it. The flag is named, never a
 * silent default, and flipping it renders the whole feature ABSENT with the
 * decision stated.
 *
 * MARK-LOST IS A STATE PLUS A REQUEST RECORD ONLY (D27). It reaches no device.
 * A lost report never triggers an automatic erasure; it creates a
 * suspension-class command that the device applies at its next contact, and a
 * wipe REQUEST that a root approver acts on from another console entirely.
 * Nothing here renders a command as applied, and nothing here says "wiped".
 *
 * Determinism: every value below is a literal. Nothing reads a clock.
 */

/** Registry order, so every derived role list comes out in one order. */
const TENANT_ROLE_ORDER = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly TenantRoleId[]

/* ------------------------------------------------------------------ *
 * D3 — the one named feature flag.
 * ------------------------------------------------------------------ */

/** Named in the plan, never a silent default. Read by the shared evaluator's
 *  feature stage, so a control behind it refuses through the same nine ordered
 *  stages every other refusal on this surface goes through. */
export const TENANT_DEVICE_ENROLMENT_FLAG = 'tenantDeviceEnrolment'

export const FLAG_DEFAULT_ENABLED = true

export const OPEN_DECISION_ON_OWNERSHIP =
  'DEC-DEVOWN-001 — Client Decision Required, adopted working position null. Whether a Tenant Admin may enrol a device at all is open: enrolment is described as tenant self-service within platform policy, and the platform console’s own role matrix prohibits all four platform roles from enrolling, which leaves the tenant as the only party who can. Two storyboard strings put enrolment on the console instead. This build ships enrolment behind the named flag above and records the decision rather than settling it.'

/* ------------------------------------------------------------------ *
 * The device record. Fields are exactly the panel fields the one source
 * line names, and no field is invented beside them.
 * ------------------------------------------------------------------ */

/** Set at enrollment and FIXED there — the source states the mode is fixed at
 *  enrollment, so no control anywhere changes it afterwards. */
export type DeviceMode = 'shared' | 'personal'

export const DEVICE_MODES = ['shared', 'personal'] as const satisfies readonly DeviceMode[]

type MissingFromDeviceModes = Exclude<DeviceMode, (typeof DEVICE_MODES)[number]>
const _deviceModesExhaustive: MissingFromDeviceModes extends never ? true : never = true
void _deviceModesExhaustive

export const DEVICE_MODE_LABEL: Readonly<Record<DeviceMode, string>> = {
  shared: 'Shared — handed from person to person at a station',
  personal: 'Personal — belongs to one worker',
}

export type DevicePlatform = 'android' | 'ios'

export const DEVICE_PLATFORMS = ['android', 'ios'] as const satisfies readonly DevicePlatform[]

type MissingFromPlatforms = Exclude<DevicePlatform, (typeof DEVICE_PLATFORMS)[number]>
const _platformsExhaustive: MissingFromPlatforms extends never ? true : never = true
void _platformsExhaustive

/**
 * The states this SURFACE holds for a device. Taken from the source's own
 * device state diagram, minus the three the platform console owns and this
 * screen never sets — suspended, wipe-pending and wiped — plus `retired`,
 * which the source names in the device audit trail ("from enrollment through
 * mode changes to retirement") and in the retire control on this very screen.
 */
export type DeviceState = 'enrolled' | 'in_service' | 'reassigned' | 'reported_lost' | 'retired'

export const DEVICE_STATES = [
  'enrolled',
  'in_service',
  'reassigned',
  'reported_lost',
  'retired',
] as const satisfies readonly DeviceState[]

type MissingFromDeviceStates = Exclude<DeviceState, (typeof DEVICE_STATES)[number]>
const _deviceStatesExhaustive: MissingFromDeviceStates extends never ? true : never = true
void _deviceStatesExhaustive

export const DEVICE_STATE_LABEL: Readonly<Record<DeviceState, string>> = {
  enrolled: 'Enrolled — registered, but holding no runnable package yet',
  in_service: 'In service — receiving packages, capturing and syncing',
  reassigned: 'Reassigned — binding changed, packages re-staged at next sync',
  reported_lost: 'Reported lost — a suspension-class command exists for it',
  retired: 'Retired — withdrawn from service by this workspace',
}

/** The states the PLATFORM console owns and this screen never sets. Named so a
 *  reader is not left to assume this surface can reach them. */
export const CONSOLE_OWNED_DEVICE_STATES = [
  {
    name: 'Suspended',
    why: 'Refuses new work at next contact, local data preserved. The console issues it; this screen’s lost report is what asks for it.',
  },
  {
    name: 'Wipe pending',
    why: 'Authorised at critical class, final sync attempted. Root approval only, and never from this surface.',
  },
  {
    name: 'Wiped',
    why: 'Local store erased and the device de-authorised. Reachable only from the console, and only after a final sync attempt.',
  },
  {
    name: 'Never returned',
    why: 'The command stays pending indefinitely because the device never reconnects. The platform’s honest position is to display that rather than report the wipe complete; the bound is an open decision.',
  },
] as const satisfies readonly { name: string; why: string }[]

export type SyncHealth = 'healthy' | 'degraded' | 'unreachable'

export const SYNC_HEALTHS = [
  'healthy',
  'degraded',
  'unreachable',
] as const satisfies readonly SyncHealth[]

type MissingFromSyncHealths = Exclude<SyncHealth, (typeof SYNC_HEALTHS)[number]>
const _syncHealthsExhaustive: MissingFromSyncHealths extends never ? true : never = true
void _syncHealthsExhaustive

export type StoragePressure = 'ample' | 'tight' | 'full'

export const STORAGE_PRESSURES = [
  'ample',
  'tight',
  'full',
] as const satisfies readonly StoragePressure[]

type MissingFromStorage = Exclude<StoragePressure, (typeof STORAGE_PRESSURES)[number]>
const _storageExhaustive: MissingFromStorage extends never ? true : never = true
void _storageExhaustive

/**
 * `AC-009-01`: a device below the application-version floor cannot be enrolled,
 * and the refusal states the floor. The floor is platform policy, read here
 * and never set here.
 */
export const APP_VERSION_FLOOR = '2.1.0'

/**
 * Versions compare as dotted triples. A malformed string is REFUSED rather
 * than compared, because a comparison against a value that is not a version is
 * exactly the silent pass this check exists to prevent.
 */
const VERSION = /^\d+\.\d+\.\d+$/

export function meetsVersionFloor(version: string): boolean {
  if (!VERSION.test(version) || !VERSION.test(APP_VERSION_FLOOR)) return false
  const a = version.split('.').map(Number)
  const b = APP_VERSION_FLOOR.split('.').map(Number)
  for (let i = 0; i < 3; i += 1) {
    const left = a[i] ?? 0
    const right = b[i] ?? 0
    if (left !== right) return left > right
  }
  return true
}

export interface Device {
  readonly id: string
  readonly platform: DevicePlatform
  /** Fixed at enrollment. No control changes it afterwards. */
  readonly mode: DeviceMode
  readonly siteId: string
  readonly areaId: string
  readonly appVersion: string
  readonly enrolledOn: string
  readonly lastSeen: string
  readonly syncHealth: SyncHealth
  readonly storagePressure: StoragePressure
  /**
   * Captures still on the device and not yet accepted by the server. Device
   * telemetry — a queue depth — and deliberately NOT a measure of whoever used
   * the tablet: there is no per-person cut of it anywhere, and unsynced
   * captures are never presented as recorded.
   */
  readonly pendingCaptures: number
  readonly state: DeviceState
  /** The run pinned to this device right now, or `null`. A reassignment is
   *  refused while one is in flight: a run finishes on the package it started on. */
  readonly runInFlight: string | null
  readonly note: string
}

/**
 * THE SURVEILLANCE PROHIBITION, held by the compiler as well as by the sweep.
 * A device record must never gain a measure of the person who used it. Union
 * and denial on ONE line deliberately, so a line-based scan reads the denial
 * with the tokens it names.
 */
type ForbiddenMeasureField = 'workerRunCount' | 'operatorScore' | 'capturesPerWorker' | 'idleMinutes' | 'productivityScore' // never on a device record.
type MeasureFieldOnDevice = Extract<keyof Device, ForbiddenMeasureField>
const _deviceHasNoMeasureField: MeasureFieldOnDevice extends never ? true : never = true
void _deviceHasNoMeasureField

export const SEEDED_DEVICES = [
  {
    id: 'TAB-014',
    platform: 'android',
    mode: 'shared',
    siteId: 'SITE-ARD-01',
    areaId: 'AREA-ARD-ASSY',
    appVersion: '2.1.0',
    enrolledOn: '2026-03-04',
    lastSeen: '2026-08-19 14:07 tenant time',
    syncHealth: 'degraded',
    storagePressure: 'tight',
    pendingCaptures: 12,
    state: 'in_service',
    runInFlight: 'RUN-2026-08-14-A',
    note: 'The tablet the source’s own worked example follows. It carries a run in flight, which is what makes a reassignment refusable rather than theoretical.',
  },
  {
    id: 'TAB-021',
    platform: 'android',
    mode: 'shared',
    siteId: 'SITE-ARD-01',
    areaId: 'AREA-ARD-PAINT',
    appVersion: '2.2.1',
    enrolledOn: '2026-05-19',
    lastSeen: '2026-08-19 13:52 tenant time',
    syncHealth: 'healthy',
    storagePressure: 'ample',
    pendingCaptures: 0,
    state: 'in_service',
    runInFlight: null,
    note: 'Nothing in flight, so this is the one a reassignment can actually move.',
  },
  {
    id: 'TAB-033',
    platform: 'ios',
    mode: 'personal',
    siteId: 'SITE-ARD-02',
    areaId: 'AREA-ARD-QC',
    appVersion: '2.1.0',
    enrolledOn: '2026-06-30',
    lastSeen: '2026-08-12 08:41 tenant time',
    syncHealth: 'unreachable',
    storagePressure: 'ample',
    pendingCaptures: 3,
    state: 'enrolled',
    runInFlight: null,
    note: 'Enrolled and never pre-staged, so it holds no runnable package. It shows as enrolled with no package and NEVER as ready — a tablet with no package cannot execute, which is correct.',
  },
] as const satisfies readonly Device[]

export function deviceById(id: string, register: readonly Device[]): Device | undefined {
  return register.find((d) => d.id === id)
}

export function areaLabel(areaId: string): string {
  return areaById(areaId)?.name ?? areaId
}

export function siteLabel(siteId: string): string {
  return DOH_SITES.find((s) => s.id === siteId)?.name ?? siteId
}

/** Areas a device may be bound to: active Areas only. An archived Area cannot
 *  receive a device, for the same reason it cannot receive a Job. */
export const BINDABLE_AREAS = DOH_AREAS.filter((a) => a.state === 'active')

/* ------------------------------------------------------------------ *
 * Commands and requests. NOTHING HERE REACHES A DEVICE.
 * ------------------------------------------------------------------ */

export type DeviceCommandKind = 'suspension-on-lost-report' | 'retire'

export const DEVICE_COMMAND_KINDS = [
  'suspension-on-lost-report',
  'retire',
] as const satisfies readonly DeviceCommandKind[]

type MissingFromCommandKinds = Exclude<DeviceCommandKind, (typeof DEVICE_COMMAND_KINDS)[number]>
const _commandKindsExhaustive: MissingFromCommandKinds extends never ? true : never = true
void _commandKindsExhaustive

export interface DeviceCommandRecord {
  readonly id: string
  readonly deviceId: string
  readonly kind: DeviceCommandKind
  /**
   * ITS TRUE STATE, and never a nicer one. A command a storyboard creates has
   * been created and nothing more: it has not been delivered, downloaded,
   * validated or applied, because no device exists for it to reach.
   */
  readonly state: CommandState
  readonly raisedAt: string
  readonly note: string
}

/** The only state a command this screen creates may hold. `created` is
 *  non-terminal, which is what the Queued screen state exists to render. */
export const COMMAND_STATE_ON_CREATION: CommandState = 'created'

export interface WipeRequestRecord {
  readonly id: string
  readonly deviceId: string
  readonly raisedAt: string
  readonly requestedBy: string
  /** Where the approval actually happens. Never on this surface. */
  readonly approvalRoute: string
  readonly note: string
}

export const WIPE_REQUEST_CONFIRMATION =
  'The request goes to the platform team, and the data remains on the device until the device contacts the platform. This request wipes nothing itself: pressing it created a record and reached no device. Approval is a critical-class act by a root approver on the platform console, and even after approval the erasure runs only after a final sync attempt succeeds — a device that never reconnects never wipes, and the command sits pending with its age rather than being reported complete.'

export const LOST_REPORT_CONFIRMATION =
  'Marked lost in this storyboard run. Two records exist and no device was touched: the device state is now reported lost, and a suspension-class command has been CREATED for it. At the device’s next contact — if there is one — it would refuse new work and preserve every local capture. A lost report never triggers an automatic erasure, and the unsynced captures still on the device are not recorded anywhere until they arrive.'

/* ------------------------------------------------------------------ *
 * The control table. DERIVED, NOT QUOTED — and the difference is
 * marked per row, because no five-role matrix for devices exists
 * anywhere in the frozen source.
 * ------------------------------------------------------------------ */

/**
 * The cell-status union and the row's surface come from their ONE owner,
 * `@/surfaces/doh/modules`. Six Hub matrices shipped six identical copies of
 * this union, each with its own exhaustiveness proof; six proofs of six
 * unions prove nothing about the seventh spelling.
 *
 * THE ARRAY STAYS LOCAL, AND DELIBERATELY. The spine imports these matrices
 * to derive `rolesReaching`, so a VALUE imported back from the spine closes
 * a runtime cycle — and it closes it in the worst way: with a fixture module
 * as the entry point, the spine re-enters a sibling fixture that is still
 * mid-evaluation and reads `undefined` off it (reproduced as
 * `TypeError: Cannot read properties of undefined (reading 'map')` in
 * `permissions-roles-and-access`). A `import type` is erased and opens no
 * edge at all. The `Exclude` proof below is over the ONE union, so this
 * array is provably the whole of it and the six copies cannot drift apart.
 */
export type { ControlStatus, MatrixRowSurface } from '@/surfaces/doh/modules'

export const CONTROL_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
  'explicitly-prohibited',
  'not-applicable',
  'unavailable',
] as const satisfies readonly ControlStatus[]

type MissingFromControlStatuses = Exclude<ControlStatus, (typeof CONTROL_STATUSES)[number]>
const _controlStatusesExhaustive: MissingFromControlStatuses extends never ? true : never = true
void _controlStatusesExhaustive

/** Whether a row's statuses are the source's words or this build's derivation. */
export type StatusProvenance = 'quoted-from-source' | 'derived-from-silence'

export const STATUS_PROVENANCES = [
  'quoted-from-source',
  'derived-from-silence',
] as const satisfies readonly StatusProvenance[]

type MissingFromProvenance = Exclude<StatusProvenance, (typeof STATUS_PROVENANCES)[number]>
const _provenanceExhaustive: MissingFromProvenance extends never ? true : never = true
void _provenanceExhaustive

export type DeviceControlId =
  | 'view-the-device-inventory'
  | 'enrol-a-device'
  | 'reassign-a-device'
  | 'retire-a-device'
  | 'mark-a-device-lost'
  | 'request-a-wipe'
  | 'execute-a-wipe'
  | 'suspend-a-device'
  | 'change-the-device-mode'

/**
 * The shared Hub row shape, plus the one field only this matrix carries.
 * Six Hub matrices declared three different row shapes between them; the
 * shape is declared once now, and the extension below is the honest
 * exception rather than a fourth private copy.
 */
export interface ControlMatrixRow extends DohControlMatrixRow<DeviceControlId> {
  /** Devices is the one module with NO five-role table anywhere in the
   *  frozen source, so every row states whether its statuses are the
   *  source's words or this build's derivation. */
  readonly provenance: StatusProvenance
}

const TENANT_ADMIN_ONLY: Readonly<Record<TenantRoleId, ControlStatus>> = {
  TENANT_ADMIN: 'allowed',
  SUPERVISOR: 'unavailable',
  QUALITY_MANAGER: 'unavailable',
  READONLY_AUDITOR: 'unavailable',
  WORKER: 'unavailable',
}

const PROHIBITED_FOR_ALL_FIVE: Readonly<Record<TenantRoleId, ControlStatus>> = {
  TENANT_ADMIN: 'explicitly-prohibited',
  SUPERVISOR: 'explicitly-prohibited',
  QUALITY_MANAGER: 'explicitly-prohibited',
  READONLY_AUDITOR: 'explicitly-prohibited',
  WORKER: 'explicitly-prohibited',
}

/**
 * NO FIVE-ROLE TABLE FOR DEVICES EXISTS ANYWHERE IN THE FROZEN SOURCE, so
 * no per-cell cause can be quoted from one. A blank cell is forbidden
 * (L10238) and a cause this build wrote would read as the source’s — so
 * every non-Tenant-Admin cell below says which of the two it is, and the
 * absence of the table itself is recorded in UNSPECIFIED_IN_SOURCE.
 */
const NO_ROLE_TABLE_QUOTED =
  'Unavailable. No five-role table for devices exists in the frozen source; this row’s refusal is QUOTED from the workflow’s own denied path, which states the outcome without qualifying it per role. See UNSPECIFIED_IN_SOURCE.'

const NO_ROLE_TABLE_DERIVED =
  'Unavailable. No five-role table for devices exists in the frozen source and this row says nothing at all about this role, so this build WITHHOLDS rather than granting on silence. Derived, not quoted; see UNSPECIFIED_IN_SOURCE.'

export const CONTROL_MATRIX = [
  {
    id: 'view-the-device-inventory',
    control: 'View the device inventory',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'read-only',
      SUPERVISOR: 'unavailable',
      QUALITY_MANAGER: 'unavailable',
      READONLY_AUDITOR: 'unavailable',
      WORKER: 'unavailable',
    },
    provenance: 'derived-from-silence',
    detail: {
      TENANT_ADMIN:
        'Read-only — the panel fields are named and the Tenant Admin is the role named on every device row this source has (L67861, L53089). Derived, not quoted.',
      SUPERVISOR: NO_ROLE_TABLE_DERIVED,
      QUALITY_MANAGER: NO_ROLE_TABLE_DERIVED,
      READONLY_AUDITOR: NO_ROLE_TABLE_DERIVED,
      WORKER: NO_ROLE_TABLE_DERIVED,
    },
    rendering:
      'The inventory renders for the Tenant Admin. ABSENT for the other four — and their absence is DERIVED, not quoted: the source names the Tenant Admin on every device row it has and states nothing at all about the other four, so this build withholds rather than granting on silence.',
    effect: 'A read of this workspace’s own device records.',
    sourceRef: 'L67861 panel fields; L53089 "Tenant Admin opens device enrollment"',
  },
  {
    id: 'enrol-a-device',
    control: 'Enrol a device',
    surface: 'screen',
    status: TENANT_ADMIN_ONLY,
    provenance: 'quoted-from-source',
    detail: {
      TENANT_ADMIN:
        'Allowed — behind the named feature flag; the workflow opens with the Tenant Admin (WF-DVC-001 L53085).',
      SUPERVISOR: NO_ROLE_TABLE_QUOTED,
      QUALITY_MANAGER: NO_ROLE_TABLE_QUOTED,
      READONLY_AUDITOR: NO_ROLE_TABLE_QUOTED,
      WORKER: NO_ROLE_TABLE_QUOTED,
    },
    rendering:
      'Live for the Tenant Admin behind the named feature flag. ABSENT for the other four: the workflow’s own denied path names all four attempting enrolment and being refused, so the refusal is quoted rather than derived.',
    effect:
      'Creates the device record with its audit event in the same transaction, fixes the mode, and binds the device to a Site and an Area.',
    sourceRef: 'WF-DVC-001 L53085, AC-WF-DVC-001-01 to -04 L53099',
  },
  {
    id: 'reassign-a-device',
    control: 'Reassign a device to another Area',
    surface: 'screen',
    status: TENANT_ADMIN_ONLY,
    provenance: 'quoted-from-source',
    detail: {
      TENANT_ADMIN:
        'Allowed — and refused while a run is in flight on the device (AC-WF-DVC-002-01 L53132).',
      SUPERVISOR:
        'Unavailable — reassignment by a Supervisor is refused by name, because device policy sits with the Tenant Admin (WF-DVC-002 L53118).',
      QUALITY_MANAGER: NO_ROLE_TABLE_DERIVED,
      READONLY_AUDITOR: NO_ROLE_TABLE_DERIVED,
      WORKER: NO_ROLE_TABLE_DERIVED,
    },
    rendering:
      'Live for the Tenant Admin, and DISABLED with its reason while a run is in flight on the device. ABSENT for the other four: reassignment by a Supervisor is refused by name, because device policy sits with the Tenant Admin.',
    effect:
      'Changes the Area binding. The device re-stages at its next sync and evicts what it no longer needs only after confirmed receipt plus an integrity check.',
    sourceRef: 'WF-DVC-002 L53118, AC-WF-DVC-002-01 L53132',
  },
  {
    id: 'retire-a-device',
    control: 'Retire a device',
    surface: 'screen',
    status: TENANT_ADMIN_ONLY,
    provenance: 'derived-from-silence',
    detail: {
      TENANT_ADMIN:
        'Allowed — the retire control is named in the screen’s one source line, with no role list beside it (L67861). Derived, not quoted.',
      SUPERVISOR: NO_ROLE_TABLE_DERIVED,
      QUALITY_MANAGER: NO_ROLE_TABLE_DERIVED,
      READONLY_AUDITOR: NO_ROLE_TABLE_DERIVED,
      WORKER: NO_ROLE_TABLE_DERIVED,
    },
    rendering:
      'Live for the Tenant Admin. The control is named in the screen’s one source line; no role list is given for it, so it inherits the Tenant Admin-only shape every other device row has, and that inheritance is marked as derived.',
    effect:
      'Withdraws the device from service on this workspace’s record and creates a command whose true state is rendered. Retirement is on the device audit trail.',
    sourceRef: 'L67861 "retire control"; device audit trail L53063',
  },
  {
    id: 'mark-a-device-lost',
    control: 'Mark a device lost',
    surface: 'screen',
    status: TENANT_ADMIN_ONLY,
    provenance: 'quoted-from-source',
    detail: {
      TENANT_ADMIN:
        'Allowed — the workflow opens with the Tenant Admin (WF-DVC-003 L53152).',
      SUPERVISOR:
        'Unavailable — a Supervisor cannot mark a device lost, stated by name in the denied path (AC-WF-DVC-003-01 L53164).',
      QUALITY_MANAGER: NO_ROLE_TABLE_DERIVED,
      READONLY_AUDITOR: NO_ROLE_TABLE_DERIVED,
      WORKER:
        'Unavailable — a Worker cannot mark a device lost, stated by name in the denied path (AC-WF-DVC-003-01 L53164).',
    },
    rendering:
      'Live for the Tenant Admin. ABSENT for the other four: a Supervisor or Worker cannot mark a device lost, stated by name in the workflow’s denied path.',
    effect:
      'A STATE plus a request record, and nothing else (D27). The device state becomes reported lost and a suspension-class command is created. It reaches no device, and a lost report never triggers an automatic erasure.',
    sourceRef: 'WF-DVC-003 L53152, AC-WF-DVC-003-01 L53164',
  },
  {
    id: 'request-a-wipe',
    control: 'Request a wipe',
    surface: 'screen',
    status: TENANT_ADMIN_ONLY,
    provenance: 'quoted-from-source',
    detail: {
      TENANT_ADMIN:
        'Allowed, and carrying the critical-class badge: the press creates a request routed to the platform team, and approval is not the tenant’s (SB-SEC-005 L103830, L107423).',
      SUPERVISOR: NO_ROLE_TABLE_DERIVED,
      QUALITY_MANAGER: NO_ROLE_TABLE_DERIVED,
      READONLY_AUDITOR: NO_ROLE_TABLE_DERIVED,
      WORKER: NO_ROLE_TABLE_DERIVED,
    },
    rendering:
      'Live for the Tenant Admin, and carrying the CLASS BADGE — the one critical-class action a slice-4 role can see and cannot approve. The badge is what stops a reader believing the press wiped anything.',
    effect:
      'Creates a request record routed to the platform team. It wipes nothing itself: the data remains on the device until the device contacts the platform, and even then only after a final sync attempt.',
    sourceRef: 'SB-SEC-005 screen 1, L103830; critical-class approval L107423',
  },
  {
    id: 'execute-a-wipe',
    control: 'Execute a wipe',
    surface: 'another-surface',
    status: PROHIBITED_FOR_ALL_FIVE,
    provenance: 'quoted-from-source',
    detail: {
      TENANT_ADMIN:
        'Explicitly prohibited — the tenant cannot invoke a remote wipe; wipe authority stays on the platform console under root approval (AC-009-04 L67867, TEST-009-02 L67869).',
      SUPERVISOR:
        'Explicitly prohibited — the tenant cannot invoke a remote wipe; wipe authority stays on the platform console under root approval (AC-009-04 L67867, TEST-009-02 L67869).',
      QUALITY_MANAGER:
        'Explicitly prohibited — the tenant cannot invoke a remote wipe; wipe authority stays on the platform console under root approval (AC-009-04 L67867, TEST-009-02 L67869).',
      READONLY_AUDITOR:
        'Explicitly prohibited — the tenant cannot invoke a remote wipe; wipe authority stays on the platform console under root approval (AC-009-04 L67867, TEST-009-02 L67869).',
      WORKER:
        'Explicitly prohibited — the tenant cannot invoke a remote wipe; wipe authority stays on the platform console under root approval (AC-009-04 L67867, TEST-009-02 L67869).',
    },
    rendering:
      'ABSENT for every tenant role. A categorical rule: the tenant cannot invoke a remote wipe, and wipe authority stays on the platform console under root approval. Nothing is drawn, and nothing is disabled either — a disabled Wipe control would imply the tenant might one day hold it.',
    effect: 'Nothing here.',
    sourceRef: 'AC-009-04 L67867, TEST-009-02 L67869',
  },
  {
    id: 'suspend-a-device',
    control: 'Suspend a device',
    surface: 'another-surface',
    status: PROHIBITED_FOR_ALL_FIVE,
    provenance: 'quoted-from-source',
    detail: {
      TENANT_ADMIN:
        'Explicitly prohibited — suspension is a platform console workflow (WF-DVC-005 L53224). The lost report on this screen asks for one, and asking is not issuing.',
      SUPERVISOR:
        'Explicitly prohibited — suspension is a platform console workflow (WF-DVC-005 L53224). The lost report on this screen asks for one, and asking is not issuing.',
      QUALITY_MANAGER:
        'Explicitly prohibited — suspension is a platform console workflow (WF-DVC-005 L53224). The lost report on this screen asks for one, and asking is not issuing.',
      READONLY_AUDITOR:
        'Explicitly prohibited — suspension is a platform console workflow (WF-DVC-005 L53224). The lost report on this screen asks for one, and asking is not issuing.',
      WORKER:
        'Explicitly prohibited — suspension is a platform console workflow (WF-DVC-005 L53224). The lost report on this screen asks for one, and asking is not issuing.',
    },
    rendering:
      'ABSENT for every tenant role. Suspension is a platform console workflow and belongs to the console’s own device module; the lost report on this screen is what ASKS for one, and asking is not the same as issuing.',
    effect: 'Nothing here.',
    sourceRef: 'WF-DVC-005 L53224 — console only',
  },
  {
    id: 'change-the-device-mode',
    control: 'Change the device mode after enrollment',
    surface: 'screen',
    status: PROHIBITED_FOR_ALL_FIVE,
    provenance: 'quoted-from-source',
    detail: {
      TENANT_ADMIN:
        'Explicitly prohibited — the mode is fixed at enrollment (AC-WF-DVC-001-03 L53099), so no role changes it afterwards, here or anywhere.',
      SUPERVISOR:
        'Explicitly prohibited — the mode is fixed at enrollment (AC-WF-DVC-001-03 L53099), so no role changes it afterwards, here or anywhere.',
      QUALITY_MANAGER:
        'Explicitly prohibited — the mode is fixed at enrollment (AC-WF-DVC-001-03 L53099), so no role changes it afterwards, here or anywhere.',
      READONLY_AUDITOR:
        'Explicitly prohibited — the mode is fixed at enrollment (AC-WF-DVC-001-03 L53099), so no role changes it afterwards, here or anywhere.',
      WORKER:
        'Explicitly prohibited — the mode is fixed at enrollment (AC-WF-DVC-001-03 L53099), so no role changes it afterwards, here or anywhere.',
    },
    rendering:
      'ABSENT for every role. The mode is fixed at enrollment, so no editor is drawn beside it on any row and no disabled one either.',
    effect: 'Nothing. Shared or Personal is decided once, at enrollment.',
    sourceRef: 'AC-WF-DVC-001-03 L53099 "Mode is fixed at enrollment"',
  },
] as const satisfies readonly ControlMatrixRow[]

type MissingFromMatrix = Exclude<DeviceControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function rolesWithStatus(
  controlId: DeviceControlId,
  statuses: readonly ControlStatus[],
): readonly TenantRoleId[] {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) return []
  return TENANT_ROLE_ORDER.filter((roleId) => statuses.includes(row.status[roleId]))
}

export function statusFor(controlId: DeviceControlId, roleId: TenantRoleId): ControlStatus {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) throw new Error(`Unknown device control: ${controlId}`)
  return row.status[roleId]
}

export const ACTING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
] as const satisfies readonly ControlStatus[]

export const READING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
] as const satisfies readonly ControlStatus[]

/* ------------------------------------------------------------------ *
 * The tenant state gate. The write-class enumerations name no device
 * class at all, so every device write is mapped onto the configuration
 * class the source DOES name — device binding and policy are
 * configuration — under the stricter reading the source instructs
 * wherever tenant-state governance is ambiguous. The mapping is stated
 * on screen and no row is added to the one write-class table.
 * ------------------------------------------------------------------ */

export const DEVICE_WRITE_CLASS: WriteAction = 'edit-configuration'

/**
 * And the consequence, flagged rather than swallowed: enrolment against a
 * workspace that is not active is refused BY NAME in the source, so the strict
 * mapping is right there. It is not stated anywhere for a LOST REPORT, and a
 * lost report is a security act rather than a configuration edit — a workspace
 * thirty days behind on its bills still needs to be able to say a tablet has
 * gone. This build takes the stricter reading and raises the consequence.
 */
export const LOST_REPORT_GATE_CONCERN =
  'A lost report is gated as a configuration edit, which closes it under a billing suspension. The source refuses ENROLMENT against a workspace that is not active by name, and says nothing at all about reporting a device lost. Taking the stricter reading in that silence means a workspace behind on its bills cannot report a missing tablet through this surface — which is a security consequence of a commercial state, and the client should settle it rather than inherit it.'

/* ------------------------------------------------------------------ *
 * Screen states. STATE-09 is MANDATORY here: a retire or a wipe
 * request renders in its true command state and never as done.
 * ------------------------------------------------------------------ */

export const APPLICABLE_SCREEN_STATES = [
  'STATE-01',
  'STATE-02',
  'STATE-03',
  'STATE-04',
  'STATE-05',
  'STATE-06',
  'STATE-08',
  'STATE-09',
  'STATE-12',
  'STATE-13',
] as const satisfies readonly ScreenStateId[]

export type ApplicableScreenStateId = (typeof APPLICABLE_SCREEN_STATES)[number]

export interface InapplicableScreenState {
  readonly id: ScreenStateId
  readonly why: string
}

export const INAPPLICABLE_SCREEN_STATES = [
  {
    id: 'STATE-07',
    why: 'Never. This is a Hub web screen; the devices it lists have a true offline state and this screen does not. Connection loss splits three ways here instead, and every write control disables rather than queues.',
  },
  {
    id: 'STATE-10',
    why: 'Never in this slice. No agent enrols, reassigns, retires or reports a device, and no agent may make an offline device appear remotely controlled — that last is prohibited outright rather than merely absent.',
  },
  {
    id: 'STATE-11',
    why: 'Never in this slice, for the same reason: nothing on this screen depends on a model.',
  },
] as const satisfies readonly InapplicableScreenState[]

/* ------------------------------------------------------------------ *
 * Absent by rule.
 * ------------------------------------------------------------------ */

export interface AbsentByRule {
  readonly label: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'Wipe this device',
    note: 'The tenant cannot invoke a remote wipe. Wipe authority stays on the platform console as a critical-class action under root approval, preceded by a final sync attempt. Nothing is drawn here and nothing is disabled either: a disabled Wipe control would imply the tenant might one day hold it.',
  },
  {
    label: 'Suspend this device',
    note: 'A platform console workflow, and this surface is not it. The lost report on this screen ASKS for a suspension-class command; asking is not issuing, and the command reaches the device only at its next contact.',
  },
  {
    label: 'Change the device mode',
    note: 'The mode is Shared or Personal, fixed at enrollment. No editor is drawn beside it on any row and no disabled one either.',
  },
  {
    label: 'Set or override the application-version floor',
    note: 'The floor is platform policy, read here and set on the console. No on-device override control exists for any role, on any surface — that prohibition is categorical rather than a routing rule, so nothing is drawn.',
  },
  {
    label: 'Bind a device below the Area',
    note: `Cell, Job and worker scoping (${DEFERRED_DOH_SCOPES.join(', ')}) is deferred beyond this version and no rule may depend on it, so the binding stops at the Area and nothing finer is offered — not even disabled, because a disabled Cell picker would imply a roadmap promise the source has not made.`,
  },
  {
    label: 'Anything for the other four tenant roles',
    note: 'Every device control here is Tenant Admin only in the source rows that exist, and no five-role matrix for devices exists anywhere. The other four roles are withheld rather than granted on silence, and the derivation is marked row by row in the control table rather than presented as a source statement.',
  },
] as const satisfies readonly AbsentByRule[]

/* ------------------------------------------------------------------ *
 * Decisions rendered on screen.
 * ------------------------------------------------------------------ */

export interface RenderedDecision {
  readonly ref: string
  readonly statement: string
}

export const DECISIONS_ON_SCREEN = [
  {
    ref: 'D3',
    statement:
      'Tenant device enrolment is built behind ONE named feature flag defaulting to enabled — tenantDeviceEnrolment. DEC-DEVOWN-001 is an open Client Decision on whether a Tenant Admin may enrol at all: three acceptance criteria and the platform console’s own role matrix, which prohibits all four platform roles from enrolling, say yes, against two storyboard strings that put enrolment on the console. The flag is named rather than silent, and flipping it renders the whole feature absent with the decision stated.',
  },
  {
    ref: 'D4',
    statement:
      'This screen keeps the literal SCR-DOH-DEVICES and is marked uncatalogued. The identifier occurs exactly once in the frozen source and appears in neither screen catalogue; minting a two-digit catalogue-B number for it would invent a catalogue row that does not exist.',
  },
  {
    ref: 'D5',
    statement:
      'This screen claims no module. The workflow catalogue attributes device enrolment and reassignment to a Hub module whose own card says the Hub shows the tenant its own position read-only and nothing more — and a read-only module cannot own device enrolment. The card governs, and the disputed attribution is recorded on that module’s own screen rather than acted on here.',
  },
  {
    ref: 'D7',
    statement:
      'Connection loss splits three ways. The inventory degrades to the last loaded records with a freshness marker; a read that fails outright names what failed and whether anything was written; every write control disables with a named reason and NEVER queues. Reconnection refetches the tenant state before any write is re-enabled.',
  },
  {
    ref: 'D27',
    statement:
      'Mark-lost ships as a STATE plus a request record only. The source already states that the control wipes nothing itself: the request goes to the platform team and the data remains on the device until the device contacts the platform. A lost report never triggers an automatic erasure, and nothing here renders a command as applied.',
  },
] as const satisfies readonly RenderedDecision[]

/* ------------------------------------------------------------------ *
 * What the source does not define, and what it answers twice.
 * ------------------------------------------------------------------ */

export const UNSPECIFIED_IN_SOURCE = [
  'NO FIVE-ROLE PERMISSION MATRIX FOR DEVICES EXISTS ANYWHERE in the frozen source. Every device row names the Tenant Admin and says nothing about the other four. This build withholds on that silence rather than granting on it, and marks every derived row as derived.',
  'No CAUSE is stated for any cell of this matrix, because the matrix itself has no source. Every per-role detail below therefore says which of two things it is: QUOTED from the workflow’s own denied path, or DERIVED from the source saying nothing about that role. Neither is a reason the source gives per role, and none is invented to fill the field.',
  'DEC-DEVLOST-001 is open and the source carries no lost-device or stolen-device classification at all, no reporting path and no distinct handling for the two. The maximum age at which a lost report should escalate to a stolen classification or an automatic wipe is a Client Decision with the trade-off stated: a premature wipe destroys evidence that exists only on that device, and a late one prolongs exposure.',
  'A lost report is gated here as a configuration edit, which closes it under a billing suspension. Reporting a missing tablet is a security act rather than a configuration edit, and the source says nothing about it — raised as a client decision rather than settled quietly.',
  'No control is defined for cancelling or withdrawing a wipe request once raised, and no expiry is stated for one.',
  'No control is defined for un-marking a device found again, though the source does say a suspension is lifted by a superseding command issued on the console.',
  'No paging, sort order or maximum row count is defined for the device inventory, and no refresh control or polling interval is stated for last-seen.',
  'No tenant-facing device profile is defined — DEC-DEVICE-001 leaves the standardised device profile and the scanner list owed by the client — so no minimum-specification field is drawn on the enrolment form.',
  'Nothing states what a retire does to captures still pending on the device. This build retires the record and says plainly that pending captures are unaffected by it, rather than implying the retirement collected them.',
] as const

export const UNRESOLVED_IN_SOURCE = [
  'The rendering rule for a refusal is UNSETTLED in the frozen source, and this build does not settle it. Chapter 30 and the role chapters state opposite rules, both carrying acceptance criteria, and two named tests assert opposite renderings of the same control for the same role. This screen follows its brief — categorical prohibitions render ABSENT, and a control this role holds but cannot use right now renders disabled with its reason — states here that the reading is unsettled, and expects a slice-wide gate to decide it.',
  '"Explicitly prohibited" carries no rendering anywhere in the frozen source. It is a statement about authority, so no row of the table above told this build how to draw anything; the mapping from token to rendering is a build decision, recorded as one.',
  '"Unavailable" is overloaded in the source and the two senses are kept apart here. Role-level withholding of the whole screen — the four non-admin columns — renders nothing at all. Transient unavailability of an action the Tenant Admin DOES hold renders disabled with a reason, and the mid-run reassignment refusal is exactly that second kind.',
  'DEC-DEVOWN-001 is open on whether a Tenant Admin may enrol a device at all. Three acceptance criteria and the console’s own role matrix say yes; two storyboard strings say the console enrols. This build ships behind the named flag and records both readings.',
  'DEC-WIPE-001 is open and live throughout this family: a final sync attempt is required before erasure, an offline device cannot perform one, and no bound is stated for how long a wipe command may remain pending nor what happens if the device never returns. Both readings are preserved in the source and neither is chosen here.',
  'The device screen identifier occurs exactly once and in neither screen catalogue, so nothing states which module owns it, which navigation entry point reaches it, or which roles can open it. The route is built uncatalogued and claims no module rather than inventing a catalogue row.',
  'The one source line for this screen lists panel fields for a single device and does not say whether the screen is a list, a single-device panel, or both. This build renders an inventory with a panel per device, which is the shape the device-inventory storyboard elsewhere implies, and records that the two descriptions were merged.',
] as const

/* ------------------------------------------------------------------ *
 * Copy quoted rather than paraphrased.
 * ------------------------------------------------------------------ */

/** The uncatalogued screen identifier, kept verbatim (D4). */
export const SCREEN_IDENTIFIER = 'SCR-DOH-DEVICES'

export const SCREEN_TITLE = 'Device enrollment'

export const AUDIT_FAILURE_COPY =
  'The action did not happen. The audit write failed, and because audit is in the same transaction as the action, the transaction rolled back with it: no device record changed, no command was created, no request was raised, and nothing was written. Enrollment, mode setting, location binding and every later change are on the device audit trail and in this workspace’s log — an action that cannot be audited does not happen.'

export const NOT_READY_COPY =
  'Enrolled with no package, and therefore NOT READY. A device that enrols but never completes its first package pre-stage holds no runnable content; it shows as enrolled with no package and never as ready, because a tablet with no package cannot execute — which is correct, not a fault.'
