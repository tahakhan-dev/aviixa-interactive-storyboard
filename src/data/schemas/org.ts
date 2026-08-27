import { z } from 'zod'
import { ROLES, type RoleId } from '@/domain/roles'
import { Stamp } from './platform'

/**
 * The `roles` collection. There is no `OBJ-0xx` business object for it in
 * `registries/generated/business-objects.json`: the platform's roles are a
 * fixed, closed set already declared as data in `@/domain/roles` (`ROLES`,
 * nine rows — four platform console roles, five tenant roles). Per
 * controller ruling R2, this schema does not re-derive that vocabulary; it
 * validates a JSON mirror of the same nine rows, keyed by the same `RoleId`
 * values, so a seed row can never name a role the platform does not have.
 */
const ROLE_IDS = ROLES.map((r) => r.id) as [RoleId, ...RoleId[]]

export const RoleDefinition = z.object({
  id: z.enum(ROLE_IDS),
  name: z.string().min(1),
  domain: z.enum(['PLATFORM', 'TENANT']),
  purpose: z.string().min(1),
  /** `SurfaceId` from `@/domain/surfaces`, carried as a plain string here — see index.ts RELATIONS note. */
  homeSurface: z.string().min(1),
  reachableSurfaces: z.array(z.string()),
  backendCreatedOnly: z.boolean(),
  maxInstances: z.number().int().positive().nullable(),
  sourceRef: z.string().min(1),
}).strict()
export type RoleDefinition = z.infer<typeof RoleDefinition>

// OBJ-006 · Site (L7796-L7811). Fields L7802; lifecycle L7804: "active, archived".
export const Site = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  contact: z.string().min(1),
  /** IANA-style timezone name. One per Site at V1 (L7802). */
  timezone: z.string().min(1),
  status: z.enum(['active', 'archived']),
}).strict()
export type Site = z.infer<typeof Site>

// OBJ-007 · Area (Line) (L7815-L7830). Fields L7821; lifecycle L7823: "active, archived".
export const Area = z.object({
  id: z.string().min(1),
  siteId: z.string().min(1),
  name: z.string().min(1),
  shiftIds: z.array(z.string()),
  status: z.enum(['active', 'archived']),
}).strict()
export type Area = z.infer<typeof Area>

// OBJ-008 · Location (Cell) (L7834-L7849). Fields L7840; lifecycle L7842: "active, archived".
export const Location = z.object({
  id: z.string().min(1),
  areaId: z.string().min(1),
  name: z.string().min(1),
  /** Required certification for the cell-narrowing model, where one is used. */
  requiredCertification: z.string().nullable(),
  status: z.enum(['active', 'archived']),
}).strict()
export type Location = z.infer<typeof Location>

// OBJ-009 · Shift (L7853-L7868). Fields L7859; lifecycle L7861: "active, archived".
export const Shift = z.object({
  id: z.string().min(1),
  siteId: z.string().min(1),
  name: z.string().min(1),
  /** Local time-of-day ("06:00"), not a Stamp — a shift boundary has no date of its own. */
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  areaIds: z.array(z.string()),
  digestDeliveryTime: z.string().min(1),
  /**
   * Derived clarification: L7859 names "nominal production date rule" as a
   * field but the source does not enumerate its values, so this is kept as
   * free text rather than an invented closed set.
   */
  nominalProductionDateRule: z.string().min(1),
  status: z.enum(['active', 'archived']),
}).strict()
export type Shift = z.infer<typeof Shift>

// OBJ-010 · Part (parts registry entry) (L7872-L7887). Fields L7878; lifecycle L7880: "skeletal, complete, archived".
export const Part = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  supplierReference: z.string().nullable(),
  drawingReference: z.string().nullable(),
  status: z.enum(['skeletal', 'complete', 'archived']),
}).strict()
export type Part = z.infer<typeof Part>

// OBJ-028 · Worker record (L8361-L8376). Fields L8367; lifecycle L8369: "active, archived, reactivated".
export const Worker = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  /** No operational difference at V1 (L8367). */
  workerType: z.enum(['employee', 'contractor']),
  instructionDifficultyProfile: z.enum(['simple', 'standard', 'expanded']),
  locale: z.enum(['en', 'es']),
  qualificationIds: z.array(z.string()),
  status: z.enum(['active', 'archived', 'reactivated']),
}).strict()
export type Worker = z.infer<typeof Worker>

// OBJ-031 · Qualification (L8418-L8433). Fields L8424; lifecycle L8426: "valid, expiring, expired, recertified".
export const Qualification = z.object({
  id: z.string().min(1),
  workerId: z.string().min(1),
  certificationType: z.string().min(1),
  /** May span Areas across multiple Sites of the tenant (L8424). */
  areaIds: z.array(z.string()),
  certificationDate: Stamp,
  entryDate: Stamp,
  expiryDate: Stamp.nullable(),
  /** Recertification lineage: the prior Qualification this one supersedes, where one exists. */
  recertifiedFromId: z.string().nullable(),
  status: z.enum(['valid', 'expiring', 'expired', 'recertified']),
}).strict()
export type Qualification = z.infer<typeof Qualification>

// OBJ-032 · Clearance (L8437-L8452). Fields L8443; lifecycle L8445: "requested where applicable, granted, delivered, in force, lapsed".
// Fix round 1 (review finding, Important 1): L8443's field list reads
// "worker reference; qualification or gate reference" -- an exclusive
// either/or, not "qualification" alone. L8441: granted by a Supervisor for
// an EXPIRED certification (qualificationId set), or by a Quality Manager
// where the qualification was NEVER HELD (no Qualification row exists for
// that worker to reference, so qualificationId is null and gateReference
// carries the location/cell-narrowing gate description instead, e.g. a
// Location.requiredCertification string). gateReference is deliberately not
// named *Id/*Ids: it is not a foreign key into any src/data collection (no
// "gates" collection exists in the §3.1 forty-name list), so it is exempt
// from -- not silently missing from -- the RELATIONS/UNCHECKABLE_ID_FIELDS
// coverage sweep by construction.
export const QualificationGrant = z.object({
  id: z.string().min(1),
  workerId: z.string().min(1),
  qualificationId: z.string().min(1).nullable(),
  /** The gate cleared when no Qualification row exists to reference (L8443, "qualification or gate reference"); exactly one of this and qualificationId is set. */
  gateReference: z.string().min(1).nullable(),
  grantedBy: z.string().min(1),
  reasonCategory: z.string().min(1),
  reasonNote: z.string().nullable(),
  grantedAt: Stamp,
  durationMinutes: z.number().int().positive().nullable(),
  lapsedAt: Stamp.nullable(),
  areaId: z.string().nullable(),
  /** The command channel delivers a Clearance to a device (L8443). */
  commandId: z.string().nullable(),
  status: z.enum(['requested', 'granted', 'delivered', 'in-force', 'lapsed']),
}).strict().refine(
  (row) => (row.qualificationId !== null) !== (row.gateReference !== null),
  {
    message: 'exactly one of qualificationId or gateReference must be set, never both, never neither (OBJ-032 L8443: "qualification or gate reference")',
    path: ['qualificationId'],
  },
)
export type QualificationGrant = z.infer<typeof QualificationGrant>

/**
 * OBJ-033 · Device (L8456-L8471) folded with OBJ-034 · Device enrollment
 * (L8475-L8490). The two are one row in this collection: a device's
 * enrollment context (mode, policy version, enrolling identity) is part of
 * its own record rather than a separate one, because nothing in the 40-name
 * collection list (design §3.1) gives enrollment its own collection.
 * Fields L8462 + L8481; lifecycle union of L8464 ("enrolled, active,
 * retired, wiped and de-authorised") and L8483 ("enrolled, mode-changed,
 * retired, de-authorised") — kept as the union of both statements' distinct
 * labels rather than collapsing "de-authorised" and "wiped and
 * de-authorised" into one.
 */
export const Device = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  mode: z.enum(['shared', 'personal']),
  locationId: z.string().nullable(),
  enrolledAt: Stamp,
  enrolledBy: z.string().min(1),
  policyVersion: z.string().min(1),
  appVersion: z.string().min(1),
  lastSeenAt: Stamp.nullable(),
  lastHeartbeatAt: Stamp.nullable(),
  syncHealthy: z.boolean(),
  clockSkewEventCount: z.number().int().nonnegative(),
  storagePressure: z.enum(['ok', 'warning', 'critical']),
  /** Per-device package inventory with per-run pinned versions (L8462). */
  pinnedPackageIds: z.array(z.string()),
  status: z.enum([
    'enrolled',
    'mode-changed',
    'active',
    'retired',
    'de-authorised',
    'wiped-and-de-authorised',
  ]),
}).strict()
export type Device = z.infer<typeof Device>
