import type { TenantRoleId } from '../HubShell'
import type { DohScope } from '@/surfaces/doh/scope'

/**
 * MOD-DOH-02 seeded fixture data — the tenant's physical structure.
 *
 * THIS FILE IS THE ONE PLACE Sites and Areas are seeded for the whole Hub.
 * Three later modules read them from here and none of them seeds a second
 * copy: scope resolution reads `DOH_SITES` and `DOH_AREAS`, shift binding
 * reads `DOH_SITES` (a Shift binds a Site and inherits its timezone), and the
 * worker record reads `DOH_AREAS`. Import path, verbatim:
 *
 *     import { DOH_SITES, DOH_AREAS, siteById, areaById, areasForSite }
 *       from '../location-configuration/fixtures'
 *
 * Determinism (spec §8): every value below is a literal. No clock is read,
 * no randomness is drawn, and nothing is fetched — an as-of stamp is a fixed
 * string, because a fixture's honesty comes from saying when it was true.
 *
 * Support-not-surveillance (S10): nothing here keys a measure on a person.
 * The archival cascade keys on `(node, Job)`; no fixture carries a person's
 * identifier at all.
 */

/* ------------------------------------------------------------------ *
 * The object-state vocabulary. `OBJ-DOH-SITE`, `OBJ-DOH-AREA` and
 * `OBJ-DOH-CELL` share it (L27106): TWO states, not five.
 * ------------------------------------------------------------------ */

export type LocationNodeState = 'active' | 'archived'

export const LOCATION_NODE_STATES = [
  'active',
  'archived',
] as const satisfies readonly LocationNodeState[]

type MissingFromNodeStates = Exclude<LocationNodeState, (typeof LOCATION_NODE_STATES)[number]>
const _nodeStatesExhaustive: MissingFromNodeStates extends never ? true : never = true
void _nodeStatesExhaustive

/**
 * D21: three states an earlier reading lost are modelled as FLAGS on
 * `active`, never discarded and never promoted to a fourth state. A flag
 * changes what the node may do; it does not change what the node is.
 */
export type LocationNodeFlag = 'scope-pending' | 'unbound' | 'archiving'

export const LOCATION_NODE_FLAGS = [
  'scope-pending',
  'unbound',
  'archiving',
] as const satisfies readonly LocationNodeFlag[]

type MissingFromNodeFlags = Exclude<LocationNodeFlag, (typeof LOCATION_NODE_FLAGS)[number]>
const _nodeFlagsExhaustive: MissingFromNodeFlags extends never ? true : never = true
void _nodeFlagsExhaustive

export interface NodeFlagConsequence {
  readonly id: LocationNodeFlag
  readonly label: string
  /** What the flag actually does, rendered beside every flagged node. */
  readonly consequence: string
  readonly sourceRef: string
}

export const NODE_FLAG_CONSEQUENCES = [
  {
    id: 'scope-pending',
    label: 'Scope pending',
    consequence:
      'this Site is excluded from the role-assignment pickers until its scope is set, so nobody can be scoped to it by accident',
    sourceRef: 'D21',
  },
  {
    id: 'unbound',
    label: 'Unbound',
    consequence:
      'no Job may be created against this node until it is bound, because an unbound node has no shift to date the work against',
    sourceRef: 'D21',
  },
  {
    id: 'archiving',
    label: 'Archiving',
    consequence:
      'the archival is held while the cascade runs, and the node stays operable until every paused Job has been reassigned',
    sourceRef: 'D21, L27107',
  },
] as const satisfies readonly NodeFlagConsequence[]

type MissingFromFlagConsequences = Exclude<
  LocationNodeFlag,
  (typeof NODE_FLAG_CONSEQUENCES)[number]['id']
>
const _flagConsequencesExhaustive: MissingFromFlagConsequences extends never ? true : never = true
void _flagConsequencesExhaustive

/* ------------------------------------------------------------------ *
 * D22: certification types are a SEEDED LIST with no create, edit or
 * retire screen anywhere in the product. Raised as a client blocker
 * rather than answered by inventing an administration screen.
 * ------------------------------------------------------------------ */

export interface CertificationType {
  readonly id: string
  readonly name: string
}

export const SEEDED_CERTIFICATION_TYPES = [
  { id: 'CERT-LOTO', name: 'Lockout and tagout' },
  { id: 'CERT-SOLVENT', name: 'Solvent handling' },
  { id: 'CERT-METROLOGY', name: 'Metrology and gauge calibration' },
  { id: 'CERT-FLT', name: 'Counterbalance truck operation' },
] as const satisfies readonly CertificationType[]

/* ------------------------------------------------------------------ *
 * `OBJ-DOH-SITE`.
 * ------------------------------------------------------------------ */

export interface LocationSite {
  readonly id: string
  readonly name: string
  readonly address: string
  readonly contact: string
  /**
   * ONE timezone per Site. A per-Area or per-Shift override is `Unavailable`
   * (AC-SCOPE-034, L2612), which is why an Area below carries no timezone
   * field at all — a Shift bound to this Site inherits this value and has
   * nothing to override.
   */
  readonly timezone: string
  readonly state: LocationNodeState
  readonly flags: readonly LocationNodeFlag[]
  /**
   * D25: Site is mandatory and a default Site is auto-created at
   * provisioning, before any Tenant Admin signs in (AC-51-12). It is
   * renameable — `provisionedName` is what provisioning called it.
   */
  readonly provisionedByDefault: boolean
  readonly provisionedName: string
  /** The in-use badge (SB-DEC-03 panel 2, L112906): what already refers here. */
  readonly inUseBy: readonly string[]
  readonly note: string
}

export const DOH_SITES = [
  {
    id: 'SITE-ARD-01',
    name: 'Ardenfield Works',
    address: 'Ardenfield Lane, Coventry CV6 4TR',
    contact: 'plant.office@ardenfield.example',
    timezone: 'Europe/London',
    state: 'active',
    flags: [],
    provisionedByDefault: true,
    provisionedName: 'Main Site',
    inUseBy: ['4 Shifts', '3 role assignments', '1 report drill-down path'],
    note: 'Created at provisioning as the default Site and renamed here. Nothing about the rename touched its identifier, so every record that referred to it still does.',
  },
  {
    id: 'SITE-ARD-02',
    name: 'Kelvin Road Finishing',
    address: 'Kelvin Road, Gdansk 80-299',
    contact: 'kelvin.office@ardenfield.example',
    timezone: 'Europe/Warsaw',
    state: 'active',
    flags: [],
    provisionedByDefault: false,
    provisionedName: 'Kelvin Road Finishing',
    inUseBy: ['2 Shifts', '1 role assignment'],
    note: 'A second Site in a second timezone. Production dating for anything under it resolves against Europe/Warsaw, never against the tenant’s first Site.',
  },
  {
    id: 'SITE-ARD-03',
    name: 'Tresco Lane Store',
    address: 'Tresco Lane, Coventry CV6 5AA',
    contact: 'tresco.office@ardenfield.example',
    timezone: 'Europe/London',
    state: 'active',
    flags: ['scope-pending'],
    provisionedByDefault: false,
    provisionedName: 'Tresco Lane Store',
    inUseBy: [],
    note: 'Created last week and not yet scoped. It holds no Area, which is the one place a true empty state is reachable on this screen.',
  },
  {
    id: 'SITE-ARD-04',
    name: 'Old Foundry',
    address: 'Foundry Row, Coventry CV1 2QP',
    contact: 'archive@ardenfield.example',
    timezone: 'Europe/London',
    state: 'archived',
    flags: [],
    provisionedByDefault: false,
    provisionedName: 'Old Foundry',
    inUseBy: ['11 closed Jobs', '2 report drill-down paths'],
    note: 'Soft-archived once its cascade completed. History stays readable: the records that referred to it still resolve, which is why the row stays selectable rather than disappearing.',
  },
] as const satisfies readonly LocationSite[]

/* ------------------------------------------------------------------ *
 * `OBJ-DOH-AREA`. No timezone field, by construction — see LocationSite.
 * ------------------------------------------------------------------ */

export interface LocationArea {
  readonly id: string
  readonly siteId: string
  readonly name: string
  readonly state: LocationNodeState
  readonly flags: readonly LocationNodeFlag[]
  /**
   * A gate input, protected as configuration rather than free text
   * (L27214): it is always one of `SEEDED_CERTIFICATION_TYPES` or null.
   */
  readonly requiredCertificationId: string | null
  readonly inUseBy: readonly string[]
  readonly note: string
}

export const DOH_AREAS = [
  {
    id: 'AREA-ARD-ASSY',
    siteId: 'SITE-ARD-01',
    name: 'Assembly Hall',
    state: 'active',
    flags: [],
    requiredCertificationId: 'CERT-LOTO',
    inUseBy: ['2 open Jobs', '1 role assignment'],
    note: 'Two Jobs are in flight under this Area, which is what holds the re-parent of one of its Locations.',
  },
  {
    id: 'AREA-ARD-PAINT',
    siteId: 'SITE-ARD-01',
    name: 'Paint Line',
    state: 'active',
    flags: ['archiving'],
    requiredCertificationId: 'CERT-SOLVENT',
    inUseBy: ['3 paused Jobs', '1 role assignment'],
    note: 'Archival was confirmed and is held: the cascade paused three Jobs and will not complete until every one of them has been reassigned.',
  },
  {
    id: 'AREA-ARD-PACK',
    siteId: 'SITE-ARD-01',
    name: 'Packing and Despatch',
    state: 'active',
    flags: ['unbound'],
    requiredCertificationId: null,
    inUseBy: ['1 report drill-down path'],
    note: 'Bound to no shift yet, so no Job may be created against it. It still holds records and still appears in reporting.',
  },
  {
    id: 'AREA-ARD-POLISH',
    siteId: 'SITE-ARD-02',
    name: 'Polishing Bay',
    state: 'active',
    flags: [],
    requiredCertificationId: null,
    inUseBy: ['1 open Job'],
    note: 'Inherits Europe/Warsaw from its Site. Nothing on this screen can give it a timezone of its own.',
  },
  {
    id: 'AREA-ARD-QC',
    siteId: 'SITE-ARD-02',
    name: 'Quality Laboratory',
    state: 'active',
    flags: [],
    requiredCertificationId: 'CERT-METROLOGY',
    inUseBy: ['2 role assignments'],
    note: 'Its required certification is a gate input: it is chosen from the seeded list and never typed.',
  },
  {
    id: 'AREA-ARD-STORE',
    siteId: 'SITE-ARD-04',
    name: 'Bonded Store',
    state: 'archived',
    flags: [],
    requiredCertificationId: null,
    inUseBy: ['11 closed Jobs'],
    note: 'Archived with its Site. Still selectable, because the history under it is still readable.',
  },
] as const satisfies readonly LocationArea[]

/* ------------------------------------------------------------------ *
 * `OBJ-DOH-CELL` — the third level, and the node a re-parent acts on.
 *
 * The object exists in the model and is rendered. What is deferred is
 * CELL SCOPING: `cell` is not one of `DOH_SCOPES`, no role may be scoped
 * to one, and every control that would offer it renders ABSENT.
 * ------------------------------------------------------------------ */

export interface LocationCell {
  readonly id: string
  readonly areaId: string
  readonly name: string
  readonly state: LocationNodeState
  readonly flags: readonly LocationNodeFlag[]
  /**
   * Jobs in flight on this node. A non-empty list REFUSES a re-parent
   * (L27149), server-side on every attempt, and no role overrides it —
   * the Tenant Admin included (L27185).
   */
  readonly inFlightJobs: readonly string[]
  readonly requiredCertificationId: string | null
  readonly inUseBy: readonly string[]
}

export const DOH_CELLS = [
  {
    id: 'CELL-ARD-ASSY-L1',
    areaId: 'AREA-ARD-ASSY',
    name: 'Assembly Line 1',
    state: 'active',
    flags: [],
    inFlightJobs: ['JOB-4471', 'JOB-4488'],
    requiredCertificationId: 'CERT-LOTO',
    inUseBy: ['2 open Jobs'],
  },
  {
    id: 'CELL-ARD-ASSY-L2',
    areaId: 'AREA-ARD-ASSY',
    name: 'Assembly Line 2',
    state: 'active',
    flags: [],
    inFlightJobs: [],
    requiredCertificationId: null,
    inUseBy: [],
  },
  {
    id: 'CELL-ARD-PAINT-B1',
    areaId: 'AREA-ARD-PAINT',
    name: 'Spray Booth 1',
    state: 'active',
    flags: [],
    inFlightJobs: [],
    requiredCertificationId: 'CERT-SOLVENT',
    inUseBy: ['1 paused Job'],
  },
  {
    id: 'CELL-ARD-PAINT-B2',
    areaId: 'AREA-ARD-PAINT',
    name: 'Spray Booth 2',
    state: 'active',
    flags: [],
    inFlightJobs: [],
    requiredCertificationId: 'CERT-SOLVENT',
    inUseBy: ['2 paused Jobs'],
  },
  {
    id: 'CELL-ARD-QC-CMM',
    areaId: 'AREA-ARD-QC',
    name: 'Measuring Bench',
    state: 'active',
    flags: [],
    inFlightJobs: [],
    requiredCertificationId: 'CERT-METROLOGY',
    inUseBy: [],
  },
] as const satisfies readonly LocationCell[]

/* ------------------------------------------------------------------ *
 * The unnamed cascade record binding the per-Job pause transactions
 * (L27107, L27227). Two states, exactly as the source gives them.
 * ------------------------------------------------------------------ */

export type CascadeState = 'cascade_pending_reassignment' | 'cascade_complete'

export const CASCADE_STATES = [
  'cascade_pending_reassignment',
  'cascade_complete',
] as const satisfies readonly CascadeState[]

type MissingFromCascadeStates = Exclude<CascadeState, (typeof CASCADE_STATES)[number]>
const _cascadeStatesExhaustive: MissingFromCascadeStates extends never ? true : never = true
void _cascadeStatesExhaustive

/** A Job the cascade paused. Keyed on the node and the Job, never a person. */
export interface PausedJob {
  readonly id: string
  readonly name: string
  readonly areaId: string
}

export interface ArchivalCascade {
  /** The Site or Area whose archival this cascade holds. */
  readonly nodeId: string
  readonly state: CascadeState
  readonly pausedJobs: readonly PausedJob[]
}

export const ARCHIVAL_CASCADES = [
  {
    nodeId: 'AREA-ARD-PAINT',
    state: 'cascade_pending_reassignment',
    pausedJobs: [
      { id: 'JOB-4502', name: 'Batch 22 primer coat', areaId: 'AREA-ARD-PAINT' },
      { id: 'JOB-4507', name: 'Batch 23 top coat', areaId: 'AREA-ARD-PAINT' },
      { id: 'JOB-4511', name: 'Rework — hinge brackets', areaId: 'AREA-ARD-PAINT' },
    ],
  },
  {
    nodeId: 'SITE-ARD-04',
    state: 'cascade_complete',
    pausedJobs: [],
  },
] as const satisfies readonly ArchivalCascade[]

/* ------------------------------------------------------------------ *
 * Lookups. Every consumer resolves through these rather than indexing
 * the arrays, so a missing id is `undefined` and never a silent hole.
 * ------------------------------------------------------------------ */

const SITE_BY_ID = new Map<string, LocationSite>(DOH_SITES.map((s) => [s.id, s]))
const AREA_BY_ID = new Map<string, LocationArea>(DOH_AREAS.map((a) => [a.id, a]))
const CELL_BY_ID = new Map<string, LocationCell>(DOH_CELLS.map((c) => [c.id, c]))

export function siteById(id: string): LocationSite | undefined {
  return SITE_BY_ID.get(id)
}

export function areaById(id: string): LocationArea | undefined {
  return AREA_BY_ID.get(id)
}

export function cellById(id: string): LocationCell | undefined {
  return CELL_BY_ID.get(id)
}

export function areasForSite(siteId: string): readonly LocationArea[] {
  return DOH_AREAS.filter((a) => a.siteId === siteId)
}

export function cellsForArea(areaId: string): readonly LocationCell[] {
  return DOH_CELLS.filter((c) => c.areaId === areaId)
}

export function certificationName(id: string | null): string {
  if (id === null) return 'None'
  return SEEDED_CERTIFICATION_TYPES.find((c) => c.id === id)?.name ?? id
}

/* ------------------------------------------------------------------ *
 * Scope. ONE definition, consumed by the tree, the filters, the search
 * and the export alike — an Area-scoped Supervisor cannot see an
 * out-of-scope node in ANY of them (L27214).
 * ------------------------------------------------------------------ */

export interface SeededRoleScope {
  readonly roleId: TenantRoleId
  /** One of the three live dimensions. Cell, Job and worker are deferred. */
  readonly scope: DohScope
  readonly siteIds: readonly string[]
  readonly areaIds: readonly string[]
  /** How this persona's scope reads in one sentence, shown on screen. */
  readonly label: string
}

const ALL_SITE_IDS: readonly string[] = DOH_SITES.map((s) => s.id)
const ALL_AREA_IDS: readonly string[] = DOH_AREAS.map((a) => a.id)

/**
 * `Record<TenantRoleId, …>` rather than an array: the compiler refuses a
 * missing role, so no persona can reach this screen without a stated scope.
 */
export const SEEDED_ROLE_SCOPES: Readonly<Record<TenantRoleId, SeededRoleScope>> = {
  TENANT_ADMIN: {
    roleId: 'TENANT_ADMIN',
    scope: 'tenant',
    siteIds: ALL_SITE_IDS,
    areaIds: ALL_AREA_IDS,
    label: 'Tenant-wide. Every Site and every Area, including the archived ones.',
  },
  SUPERVISOR: {
    roleId: 'SUPERVISOR',
    scope: 'area',
    siteIds: ['SITE-ARD-01'],
    areaIds: ['AREA-ARD-PAINT'],
    label:
      'Area-scoped to Paint Line. The parent Site renders only as the path to it; every other node of this tenant is out of scope.',
  },
  QUALITY_MANAGER: {
    roleId: 'QUALITY_MANAGER',
    scope: 'site',
    siteIds: ['SITE-ARD-01', 'SITE-ARD-02'],
    areaIds: [
      'AREA-ARD-ASSY',
      'AREA-ARD-PAINT',
      'AREA-ARD-PACK',
      'AREA-ARD-POLISH',
      'AREA-ARD-QC',
    ],
    label: 'Site-scoped to two operating Sites and every Area under them.',
  },
  READONLY_AUDITOR: {
    roleId: 'READONLY_AUDITOR',
    scope: 'tenant',
    siteIds: ALL_SITE_IDS,
    areaIds: ALL_AREA_IDS,
    label: 'Tenant-wide and read-only. Reads everything, changes nothing.',
  },
  WORKER: {
    roleId: 'WORKER',
    scope: 'area',
    siteIds: [],
    areaIds: [],
    label: 'No Hub scope at all: the Worker holds no Hub screen (D11).',
  },
}

export function visibleSiteIds(roleId: TenantRoleId): readonly string[] {
  return SEEDED_ROLE_SCOPES[roleId].siteIds
}

export function visibleAreaIds(roleId: TenantRoleId): readonly string[] {
  return SEEDED_ROLE_SCOPES[roleId].areaIds
}

/* ------------------------------------------------------------------ *
 * The eleven-row control matrix (L27117-L27127). Every cell carries an
 * explicit status: L10238 prohibits a blank, "because a blank cell is an
 * unanswered question that an implementer will answer privately".
 * ------------------------------------------------------------------ */

export type ControlStatus =
  | 'allowed'
  | 'allowed-with-conditions'
  | 'read-only'
  | 'explicitly-prohibited'
  | 'not-applicable'
  | 'unavailable'

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

export interface ControlMatrixRow {
  readonly id: string
  readonly control: string
  readonly status: Readonly<Record<TenantRoleId, ControlStatus>>
  /** How this screen draws each refusal, by rule and not by taste. */
  readonly rendering: string
  readonly effect: string
  readonly sourceRef: string
}

export const CONTROL_MATRIX = [
  {
    id: 'CTL-01',
    control: 'View the location tree',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    rendering:
      'The tree renders for four roles and is scope-filtered for two of them. Out-of-scope nodes are absent from the tree, the filters, the search and the export alike. The Auditor reads it under STATE-06 with the cause named. The Worker reaches no Hub screen at all.',
    effect: 'A read. It grants nothing and narrows what the other ten rows can act on.',
    sourceRef: 'L27117, L27214',
  },
  {
    id: 'CTL-02',
    control: 'Create a Site, an Area or a Location',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'Live for the Tenant Admin while the tenant state opens master-data creation, disabled with the write class named while it does not. ABSENT for the other four: the prohibition is categorical and they cannot hold it in any scope.',
    effect: 'Commits with its audit entry in one transaction.',
    sourceRef: 'L27118, L26919',
  },
  {
    id: 'CTL-03',
    control: 'Edit a name, an address or a contact',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'Live for the Tenant Admin at any time — in-flight Jobs do not hold it. ABSENT for the other four.',
    effect:
      'Editable at any time and fully audited. The identifier never changes, so every record that referred to the node still does.',
    sourceRef: 'L27119',
  },
  {
    id: 'CTL-04',
    control: 'Re-parent a Location or change its depth',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'The one disabled-with-a-reason case on this screen. The control exists for the Tenant Admin and is refused by OBJECT STATE, not by role, so it renders disabled with the blocking Jobs named rather than absent. ABSENT for the other four.',
    effect:
      'Refused on the server on every attempt while a Job is in flight, and no role overrides that — the Tenant Admin included.',
    sourceRef: 'L27149, L27185',
  },
  {
    id: 'CTL-05',
    control: 'Split, merge or re-parent an Area',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'ABSENT for every role including the Tenant Admin. Not supported at V1, and a disabled control would promise a V2 the source has not promised.',
    effect: 'Archive-and-recreate is the sanctioned path, and it is the one this screen offers.',
    sourceRef: 'L27120',
  },
  {
    id: 'CTL-06',
    control: 'Archive a Site or an Area',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'Live for the Tenant Admin behind a confirmation that lists every affected child node and every affected Job first. ABSENT for the other four.',
    effect:
      'A soft archive. History stays readable and the archival is held until the cascade completes.',
    sourceRef: 'L27121, L112908',
  },
  {
    id: 'CTL-07',
    control: 'Reassign a paused Job during the cascade',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'Live for the Tenant Admin tenant-wide and for the Supervisor inside their own Area. ABSENT for the other three.',
    effect: 'Releases the held archival once the last paused Job has been reassigned.',
    sourceRef: 'L27122',
  },
  {
    id: 'CTL-08',
    control: 'Set the Site timezone',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'Live for the Tenant Admin, one value per Site. The per-Area and per-Shift override is ABSENT for everyone, because it does not exist.',
    effect:
      'Everything under the Site inherits it: production dating, shift boundaries and reporting drill-down all resolve against this one value.',
    sourceRef: 'L27123, AC-SCOPE-034 L2612',
  },
  {
    id: 'CTL-09',
    control: 'Set a Location’s required certification',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'Live for the Tenant Admin as a choice from the seeded list, never as free text. ABSENT for the other four.',
    effect:
      'A gate input: what is set here is enforced at assignment and at run start, in another slice. It is protected as configuration for that reason.',
    sourceRef: 'L27124, L27214',
  },
  {
    id: 'CTL-10',
    control: 'View a map of locations',
    status: {
      TENANT_ADMIN: 'not-applicable',
      SUPERVISOR: 'not-applicable',
      QUALITY_MANAGER: 'not-applicable',
      READONLY_AUDITOR: 'not-applicable',
      WORKER: 'not-applicable',
    },
    rendering: 'ABSENT for every role, with the reason in help text. Nothing exists to enable.',
    effect: 'Deferred beyond V1. No geocoding, no coordinates and no map component ships.',
    sourceRef: 'L27125',
  },
  {
    id: 'CTL-11',
    control: 'Create an equipment record',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    rendering:
      'ABSENT for every role, and refused on all three routes a reader might try: from a location, from parts and from a Job.',
    effect: 'No equipment object exists in this product at V1.',
    sourceRef: 'L27126, TEST-DOH-02-D4 L27246',
  },
] as const satisfies readonly ControlMatrixRow[]

/* ------------------------------------------------------------------ *
 * The three refusal routes the equipment-record test requires, named
 * individually so none of them can be quietly dropped.
 * ------------------------------------------------------------------ */

export const EQUIPMENT_REFUSAL_PATHS = [
  'From a location: selecting a Site, an Area or a Location offers no add-equipment control, for any role including the Tenant Admin.',
  'From parts: the parts registry is not in this slice and holds no equipment object to attach one to.',
  'From a Job path: a Job binds to a Location, and there is no equipment record for it to reference.',
] as const

/* ------------------------------------------------------------------ *
 * What the source does not define, and what it answers twice.
 * ------------------------------------------------------------------ */

export const UNSPECIFIED_IN_SOURCE = [
  'Cell exists in the object model — it is the third level of the tree and the node a re-parent acts on — but it is not a scope dimension at V1. No role can be scoped to a Cell, no filter offers one, and no control that would offer one is drawn even inert, because an inert control implies a roadmap promise the source has not made.',
  'No control creates, edits or retires a certification type. The list on this screen is seeded, and the source never says who creates one, on which screen, under which module, or whether the platform seeds any (D22). This is a client blocker, not an oversight to code around.',
  'No search, sort, saved view or column chooser is defined for the tree. The search box here narrows the same scope-filtered set the tree already holds and grants nothing.',
  'No bulk action of any kind is defined over locations — no bulk archive, no bulk re-parent, no bulk certification change.',
  'No control unarchives a node. Archival is soft and history stays readable, but the source names no path back to active.',
  'No control sets an address format, a country or a locale on a Site, and none validates an address beyond it being present.',
  'The depth limit of the hierarchy is not stated. Three levels are seeded because the storyboard describes a three-column tree; nothing in the source says three is the maximum.',
  'CTL-03 names "a name, an address or a contact" without saying which levels of the tree it reaches. An address and a contact are Site-only concepts in the object model built here, so the edit control this screen offers is scoped to the Site; nothing renames an Area or a Location directly. Re-parenting an existing Location is the only structural change offered below the Site.',
] as const

export const UNRESOLVED_IN_SOURCE = [
  'Re-parenting is answered twice. One row allows the Tenant Admin to re-parent a Location while no Job is in flight; the next prohibits splitting, merging or re-parenting an Area for every role at V1. Both are built as written — the Location move is offered and the Area move is absent — and the tension is recorded rather than smoothed over.',
  'The Quality Manager on the cascade. The matrix marks reassigning a paused Job explicitly prohibited for the Quality Manager while the Tenant Admin and the Supervisor hold it on the same screen, which is normally the routing case that renders disabled-with-a-reason. The census reads this module’s prohibitions as categorical instead, so it renders ABSENT. The two readings differ in what a Quality Manager sees, and the client should settle it.',
  'A true empty state is unreachable. A default Site exists before any Tenant Admin signs in (D25, AC-51-12), so the empty state is only ever reached inside a Site that holds no Area — which is what this screen renders.',
  'Whether an archived Site can hold an active Area is not stated. The seeded fixture archives both together, which is the only reading that keeps the cascade meaningful.',
  'No write class names a cascade reassignment. The write-class table opens master-data creation, configuration edits and an enumerated completion pipeline, and a reassignment during a cascade is in none of them by name. It is gated here as an operational action — open while operations continue in full under a soft suspension, and closed under a hard one, whose pipeline does not name it. The mapping is a reading, not a source statement, and it is the one place on this screen where a control is gated by analogy.',
] as const
