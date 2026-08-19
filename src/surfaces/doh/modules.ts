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
import type { RoleId } from '@/domain/roles'

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
  /**
   * The tenant roles this module's route is offered to, and the ONE place
   * the module rail reads to decide what to draw.
   *
   * THE DERIVATION, and it is one rule applied to every module: a role is
   * withheld exactly when that module's own permission matrix marks any
   * cell in its column `Unavailable` — the token whose own definition is
   * "cannot hold this in any scope", and which the source keeps
   * deliberately distinct from `Explicitly prohibited`. The two are never
   * merged (L10238): `Explicitly prohibited` means the control exists on
   * this screen and this role is not granted it, so the role OPENS the
   * screen and meets a refusal it can read; `Unavailable` means the role
   * has no standing on the module at all, so by the prohibition-rendering
   * rule it renders ABSENT — the rail does not offer the route.
   *
   * ONE OWNER, PLUS A CROSS-CHECK. This field is the copy the chrome reads;
   * each module's own matrix stays the copy the module renders. Neither is
   * derived from the other at runtime (they live in different layers), so
   * each module's unit suite asserts they agree — see
   * `tests/unit/doh-tenant-lifecycle.test.ts`, `tests/unit/doh-locations.test.ts`
   * and `tests/unit/doh-permissions.test.ts` for the pattern the five
   * remaining modules inherit. Drift fails a test instead of shipping.
   *
   * THIS IS THE MODULE'S ANSWER ONLY. Whether the persona reaches SURF-DOH
   * at all is a prior and separate question, owned by the route registry
   * (D11 — the Worker holds no Hub screen), and `HubShell` asks that one
   * first. So a Worker listed here (`MOD-DOH-03`, whose matrix carries no
   * `Unavailable` cell in any column) still reaches no Hub route: this
   * field is never consulted for a persona the surface already withholds.
   * Restating D11 here would give one rule two owners.
   */
  readonly rolesReaching: readonly RoleId[]
}

/* The three shapes the eight matrices actually produce, named once rather
 * than spelled out eight times. Each module below cites the source lines its
 * own matrix occupies, so the derivation is checkable per module and not
 * only in aggregate. */
const ADMIN_AND_AUDITOR = ['TENANT_ADMIN', 'READONLY_AUDITOR'] as const
const EVERY_ROLE_BUT_THE_WORKER = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
] as const
const EVERY_TENANT_ROLE = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const

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
    // L26883-L26896. Supervisor, Quality Manager and Worker are `Unavailable`
    // on all four reading rows; the two reading roles are the only ones the
    // route is offered to.
    rolesReaching: ADMIN_AND_AUDITOR,
  },
  {
    id: 'MOD-DOH-02',
    name: 'Location Configuration',
    slug: 'location-configuration',
    purpose:
      "Hold the tenant's physical structure as the anchor for timezone, shifts, Job binding, scoping and reporting drill-down.",
    // L27113-L27127. Only the Worker is `Unavailable` (on viewing the
    // location tree); the other four read or write somewhere in the matrix.
    rolesReaching: EVERY_ROLE_BUT_THE_WORKER,
  },
  {
    id: 'MOD-DOH-03',
    name: 'Shift Management',
    slug: 'shift-management',
    purpose:
      "Define the tenant's working-time blocks as the anchor for metering, production dating and escalation resolution.",
    // L27287-L27295. The one matrix of the eight carrying no `Unavailable`
    // cell at all — every column, the Worker's included, holds a reading or
    // acting status on `View Shifts`. So this module withholds its route
    // from nobody. The Worker still reaches no Hub route: the route registry
    // answers that first (D11), and this field is never consulted for a
    // persona the surface already withholds.
    rolesReaching: EVERY_TENANT_ROLE,
  },
  {
    id: 'MOD-DOH-04',
    name: 'Worker Lifecycle and Qualifications',
    slug: 'worker-lifecycle-and-qualifications',
    purpose:
      'Hold who may do what, enforce it at assignment and on the device, and provide the audited exception path when the line would otherwise stop.',
    // L27466-L27482. Only the Worker is `Unavailable` (reading the clearance
    // corpus across time).
    rolesReaching: EVERY_ROLE_BUT_THE_WORKER,
  },
  {
    id: 'MOD-DOH-09',
    name: 'Permissions, Roles and Access',
    slug: 'permissions-roles-and-access',
    purpose:
      'Configure who exists in the tenant, what each may do, and where; enforce it across all five surfaces from one place.',
    // L28518-L28533. Only the Worker is `Unavailable` (viewing the user and
    // role register); the other three non-admin roles read that register.
    rolesReaching: EVERY_ROLE_BUT_THE_WORKER,
  },
  {
    id: 'MOD-DOH-12',
    name: 'Integration Surface (Tenant Side)',
    slug: 'integration-surface',
    purpose:
      'Narrowed to single sign-on only (FEAT-DOH-1201): the connection record for the tenant and its contact email. No operational object.',
    // L29038-L29048. Supervisor, Quality Manager and Worker are `Unavailable`
    // on the tenant read view, and hold no reading or acting status on any
    // other row of this matrix — the module offers them nothing at all.
    rolesReaching: ADMIN_AND_AUDITOR,
  },
  {
    id: 'MOD-DOH-13',
    name: 'Tenant View of Platform Administration',
    slug: 'tenant-view-of-platform-administration',
    purpose:
      "Make every platform-side access to a tenant's workspace visible to that tenant, and give the tenant a control it can actually exercise.",
    // L29193-L29204. Supervisor, Quality Manager and Worker are `Unavailable`
    // on Platform Access History and on the post-session report. The rows
    // where the Supervisor and Quality Manager ARE `Allowed` — seeing the
    // support-session banner and ending the session from it — are the Hub
    // CHROME's banner slot, not this module's screen, and they reach every
    // Hub persona through the banner region regardless of the rail.
    rolesReaching: ADMIN_AND_AUDITOR,
  },
  {
    id: 'MOD-DOH-14',
    name: 'Qualification Calendar',
    slug: 'qualification-calendar',
    purpose:
      'Give the Quality Manager a single 60-day, tenant-wide view of certification expiry for planning.',
    // L29341-L29348, the matrix D24 adopts over its seven restatements. Only
    // the Worker is `Unavailable`; the Supervisor reads it filtered to their
    // own Area, and the Tenant Admin and Auditor read it.
    rolesReaching: EVERY_ROLE_BUT_THE_WORKER,
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

/**
 * The modules whose route is offered to `role`, in canonical order — what
 * the module rail draws, computed here so no component has to.
 *
 * The parameter annotation on the callback is load-bearing: `DOH_MODULES` is
 * `as const`, so each `rolesReaching` is a narrow literal tuple whose
 * `.includes` would only accept the members it already lists. Widening the
 * element to `DohModuleDefinition` asks the real question — is this role in
 * the list — instead of a tautology.
 *
 * This answers the MODULE question only. Whether `role` reaches SURF-DOH at
 * all is the route registry's answer (D11), asked first by `app/hub/HubShell.tsx`.
 */
export function dohModulesReachedBy(role: RoleId): readonly DohModuleDefinition[] {
  return DOH_MODULES.filter((m: DohModuleDefinition) => m.rolesReaching.includes(role))
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
export const DOH_OUT_OF_SLICE_MODULES = [
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
] as const satisfies readonly DohOutOfSliceModule[]

/**
 * The two lists together are the surface's whole canonical inventory, and
 * nothing may appear in both. `DohOutOfSliceModule.id` is a bare string by
 * design (these are OUT of the closed set), so this is the only check that
 * can catch a module being listed twice — the exhaustiveness check above
 * covers the in-slice eight and cannot see these eleven at all.
 */
type InSliceId = (typeof DOH_MODULES)[number]['id']
type OutOfSliceId = (typeof DOH_OUT_OF_SLICE_MODULES)[number]['id']
type OverlappingModuleIds = Extract<OutOfSliceId, InSliceId>
const _noModuleIsInBothLists: OverlappingModuleIds extends never ? true : never = true
void _noModuleIsInBothLists
