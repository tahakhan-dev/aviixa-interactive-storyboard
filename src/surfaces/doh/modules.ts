/**
 * The SURF-DOH spine, part 1 of 6: the eight slice-4 modules of the
 * Delivery Operations Hub's nineteen-module inventory (`canonicalModuleCount`
 * on `SURF-DOH` in `@/domain/surfaces`). Spec §1.
 *
 * Names are canonical; `SCR-DOH-NN` numbers are annotations only (D1), and a
 * three-digit `SCR-DOH-NNN` literal is forbidden anywhere in the codebase —
 * the two source catalogues collide silently on the same identifier. Every
 * `slug` below is a plain name, never a screen number, for the same reason.
 */
export type DohModuleId =
  | 'MOD-DOH-01'
  | 'MOD-DOH-02'
  | 'MOD-DOH-03'
  | 'MOD-DOH-04'
  | 'MOD-DOH-09'
  | 'MOD-DOH-12'
  | 'MOD-DOH-13'
  | 'MOD-DOH-14'

export interface DohModuleDefinition {
  readonly id: DohModuleId
  /** Canonical name (`registries/generated/modules.json`, the source's own §4.1.3 inventory). */
  readonly name: string
  /** URL segment under `/hub/`, unique, never a bare number. */
  readonly slug: string
  /** One plain-language sentence, quoted from the module's own purpose line. */
  readonly purpose: string
}

// Same widening hazard as `SA_MODULES`/`ROLES`/`SCREEN_STATES`: a plain
// `: readonly DohModuleDefinition[]` annotation would widen the const and
// make the exhaustiveness check below vacuous. `as const satisfies` keeps
// every `id` literal narrowed to `DohModuleId`.
export const DOH_MODULES = [
  {
    id: 'MOD-DOH-01',
    name: 'Tenant Lifecycle and Tier Operations',
    slug: 'tenant-lifecycle-and-tier-operations',
    purpose:
      "Enforce the tenant's commercial and compliance state everywhere in the Hub, record every transition, and render the tenant's own position read-only.",
  },
  {
    id: 'MOD-DOH-02',
    name: 'Location Configuration',
    slug: 'location-configuration',
    purpose:
      "Hold the tenant's physical structure as the anchor for timezone, shifts, Job binding, scoping and reporting drill-down.",
  },
  {
    id: 'MOD-DOH-03',
    name: 'Shift Management',
    slug: 'shift-management',
    purpose:
      "Define the tenant's working-time blocks as the anchor for metering, production dating and escalation resolution.",
  },
  {
    id: 'MOD-DOH-04',
    name: 'Worker Lifecycle and Qualifications',
    slug: 'worker-lifecycle-and-qualifications',
    purpose:
      'Hold who may do what, enforce it at assignment and on the device, and provide the audited exception path when the line would otherwise stop.',
  },
  {
    id: 'MOD-DOH-09',
    name: 'Permissions, Roles and Access',
    slug: 'permissions-roles-and-access',
    purpose:
      'Configure who exists in the tenant, what each may do, and where; enforce it across all five surfaces from one place.',
  },
  {
    id: 'MOD-DOH-12',
    name: 'Integration Surface (Tenant Side)',
    slug: 'integration-surface',
    purpose:
      'Narrowed to single sign-on only (FEAT-DOH-1201): the connection record for the tenant and its contact email. No operational object.',
  },
  {
    id: 'MOD-DOH-13',
    name: 'Tenant View of Platform Administration',
    slug: 'tenant-view-of-platform-administration',
    purpose:
      "Make every platform-side access to a tenant's workspace visible to that tenant, and give the tenant a control it can actually exercise.",
  },
  {
    id: 'MOD-DOH-14',
    name: 'Qualification Calendar',
    slug: 'qualification-calendar',
    purpose:
      'Give the Quality Manager a single 60-day, tenant-wide view of certification expiry for planning.',
  },
] as const satisfies readonly DohModuleDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `DohModuleId` gains or loses a
// member that `DOH_MODULES` does not list exactly once.
type MissingFromDohModules = Exclude<DohModuleId, (typeof DOH_MODULES)[number]['id']>
const _dohModulesExhaustive: MissingFromDohModules extends never ? true : never = true
void _dohModulesExhaustive

const BY_ID = new Map(DOH_MODULES.map((m) => [m.id, m]))

export function dohModuleById(id: DohModuleId): DohModuleDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown SURF-DOH module: ${id}`)
  return found
}

export interface DohOutOfSliceModule {
  /** Deliberately a bare string, not `DohModuleId` — these ids are OUT of
   *  this slice's closed set and must never be confused for a route this
   *  slice serves. */
  readonly id: string
  readonly name: string
  /** A plain sentence naming the slice that owns it, or the stated reason it
   *  has no owner yet. Never left blank — spec §1's exclusion table. */
  readonly ownedBy: string
}

/**
 * The other eleven of the Hub's nineteen canonical modules (spec §1's
 * exclusion table, `registries/generated/modules.json` for the names).
 * Rendered by the Task 2 module index as "not in this slice", never
 * silently dropped, so name-matching cannot pull one back into slice 4 by
 * accident.
 */
export const DOH_OUT_OF_SLICE_MODULES: readonly DohOutOfSliceModule[] = [
  { id: 'MOD-DOH-05', name: 'Job Lifecycle and Approval', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-06', name: 'Run Scheduling and Execution Oversight', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-07', name: 'Worker Assignment', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-08', name: 'Execution Summary Review and Distribution', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-10', name: 'Notifications', ownedBy: 'Slice 10' },
  { id: 'MOD-DOH-11', name: 'Audit and Retention', ownedBy: 'Slice 10' },
  { id: 'MOD-DOH-15', name: 'Job Cloning', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-16', name: 'Multi-Area Job Pairing', ownedBy: 'Slice 6' },
  {
    id: 'MOD-DOH-17',
    name: 'Regulated-Industry Mode',
    ownedBy:
      'No single-slice owner — every enforcement target it names sits in slice 6 or slice 10, so slice 4 has nothing to enforce (L29736).',
  },
  { id: 'MOD-DOH-18', name: 'Standard Report Data Sets', ownedBy: 'Slice 6' },
  {
    id: 'MOD-DOH-19',
    name: 'Parts Registry',
    ownedBy:
      'Not yet scheduled — tenant master data, but not tenant setup, users, Workers, qualifications or devices.',
  },
] as const
