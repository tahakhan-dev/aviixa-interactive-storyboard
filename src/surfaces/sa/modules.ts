/**
 * The SURF-SA spine: the nineteen Super Admin capability modules across two
 * navigation bands. Spec §1, §4 D25: the split is navigation only, "sequences
 * the build and carries no commercial or acceptance meaning" (L2397) — both
 * bands are V1, labelled by meaning ("Definition layer" / "Operations
 * layer"), never by number.
 *
 * `MOD-SA-20` is deliberately absent: §8.20 is a diligence narrative the
 * frozen source names only to refuse ("Nineteen module identifiers; §8.20
 * Fundability Surface deliberately excluded", L4567) — an alias-by-denial,
 * not a twentieth module.
 *
 * D16: `roles_allowed` at module level is authoritative nowhere (it is
 * inconsistent for every module in the source). This registry deliberately
 * carries no `rolesAllowed` field — every affordance a module renders is
 * driven by per-control allowed-roles through `evaluateAccess`, and all four
 * platform roles read every screen unless a control says otherwise.
 */
export type SaBandId = 'definition' | 'operations'

export interface SaBandDefinition {
  readonly id: SaBandId
  /** Meaning, not a number — D25. */
  readonly name: string
  /** Both bands are V1; the split carries no acceptance meaning. */
  readonly v1: true
}

export const SA_BANDS = [
  { id: 'definition', name: 'Definition layer', v1: true },
  { id: 'operations', name: 'Operations layer', v1: true },
] as const satisfies readonly SaBandDefinition[]

type MissingFromBands = Exclude<SaBandId, (typeof SA_BANDS)[number]['id']>
const _bandsExhaustive: MissingFromBands extends never ? true : never = true
void _bandsExhaustive

export type SaModuleId =
  | 'MOD-SA-01' | 'MOD-SA-02' | 'MOD-SA-03' | 'MOD-SA-04' | 'MOD-SA-05'
  | 'MOD-SA-06' | 'MOD-SA-07' | 'MOD-SA-08' | 'MOD-SA-09' | 'MOD-SA-10'
  | 'MOD-SA-11' | 'MOD-SA-12' | 'MOD-SA-13' | 'MOD-SA-14' | 'MOD-SA-15'
  | 'MOD-SA-16' | 'MOD-SA-17' | 'MOD-SA-18' | 'MOD-SA-19'

export interface SaModuleDefinition {
  readonly id: SaModuleId
  /** Canonical name. `SCR-SA-NN` numbers are annotations only — D1 — and
   *  never appear here or in any route. */
  readonly name: string
  /** URL segment under `/super-admin/`, unique, never a bare number. */
  readonly slug: string
  readonly band: SaBandId
  /** One plain-language sentence, grounded in the spec, never inventing an
   *  affordance the source does not name. */
  readonly purpose: string
}

// Same widening hazard as `SURFACES`/`ROLES`/`SCREEN_STATES`: a plain
// `: readonly SaModuleDefinition[]` annotation would widen the const and
// make the exhaustiveness check below vacuous. `as const satisfies` keeps
// every `id` literal narrowed to `SaModuleId`.
export const SA_MODULES = [
  {
    id: 'MOD-SA-01',
    name: 'Platform Overview and Health',
    slug: 'platform-overview-and-health',
    band: 'definition',
    purpose:
      "The platform's health and incident home: the eight aggregate elements, the connectivity ladder and platform incidents, with no control that performs a tenant operational action.",
  },
  {
    id: 'MOD-SA-02',
    name: 'Atom Registry',
    slug: 'atom-registry',
    band: 'definition',
    purpose:
      'The catalog of platform atoms. Atom creation is absent for every account, including the root.',
  },
  {
    id: 'MOD-SA-03',
    name: 'Core Agents and Composed-Agent Review',
    slug: 'core-agents-and-composed-agent-review',
    band: 'definition',
    purpose:
      "Reviews the platform's core agents and composed-agent state — agent state, not incident ownership.",
  },
  {
    id: 'MOD-SA-04',
    name: 'Memory Architecture',
    slug: 'memory-architecture',
    band: 'definition',
    purpose:
      'The five typed memory stores, read-only. No export path, and no individual-level profile record can be created.',
  },
  {
    id: 'MOD-SA-05',
    name: 'Eval Harness',
    slug: 'eval-harness',
    band: 'definition',
    purpose:
      'The evaluation gate: enabling a capability with a pending or failing scenario is not offered to any account.',
  },
  {
    id: 'MOD-SA-06',
    name: 'Trace Viewer',
    slug: 'trace-viewer',
    band: 'definition',
    purpose:
      'Carries the decision that no trace-viewer screen is built at V1, and why — an unqualified viewer would become the ambient-browsing path the source forbids.',
  },
  {
    id: 'MOD-SA-07',
    name: 'Platform Settings',
    slug: 'platform-settings',
    band: 'definition',
    purpose:
      'The ten navigable settings categories, the six ENFORCED invariants rendered as status chips, and the emergency pause proposal.',
  },
  {
    id: 'MOD-SA-08',
    name: 'Console Users, Roles and Change Approvals',
    slug: 'console-users-roles-and-change-approvals',
    band: 'operations',
    purpose:
      'Console users, the four-role matrix, and the change-approval queue that routes every critical-class action to the root.',
  },
  {
    id: 'MOD-SA-09',
    name: 'Tenants, Lifecycle and Pilots',
    slug: 'tenants-lifecycle-and-pilots',
    band: 'operations',
    purpose:
      'Tenant lifecycle from invited to archived, and pilots. No operational action is offered from the tenant detail page, for any console role.',
  },
  {
    id: 'MOD-SA-10',
    name: 'Tenant Metrics and Aggregates',
    slug: 'tenant-metrics-and-aggregates',
    band: 'operations',
    purpose:
      'Cross-tenant comparatives, anonymised before aggregation, never rendered below tenant-month.',
  },
  {
    id: 'MOD-SA-11',
    name: 'Tiers, Entitlements and Caps',
    slug: 'tiers-entitlements-and-caps',
    band: 'operations',
    purpose:
      'The three tier bands, entitlements and caps, and the per-tenant feature override.',
  },
  {
    id: 'MOD-SA-12',
    name: 'Usage and Metering',
    slug: 'usage-and-metering',
    band: 'operations',
    purpose:
      'Usage and the Worker-Shift billing unit, rendered as a count on a commercial ledger — never a rate, never a per-worker series.',
  },
  {
    id: 'MOD-SA-13',
    name: 'Devices and Fleet',
    slug: 'devices-and-fleet',
    band: 'operations',
    purpose:
      'The fifteen device command states and the fleet. Fixtures advance only on explicit user action, with the state name always visible.',
  },
  {
    id: 'MOD-SA-14',
    name: 'Platform Notifications and Tenant Communications',
    slug: 'platform-notifications-and-tenant-communications',
    band: 'operations',
    purpose: 'The two closed notification channels, and tenant communications.',
  },
  {
    id: 'MOD-SA-15',
    name: 'Support Access',
    slug: 'support-access',
    band: 'operations',
    purpose:
      'The normal support session: read-only without exception, ended from the tenant’s own banner.',
  },
  {
    id: 'MOD-SA-16',
    name: 'JBS Access',
    slug: 'jbs-access',
    band: 'operations',
    purpose:
      'The JBS access grant. No standing access — every touch is scoped, time-boxed, reason-linked, audited and mirrored.',
  },
  {
    id: 'MOD-SA-17',
    name: 'Data Lifecycle and Archival',
    slug: 'data-lifecycle-and-archival',
    band: 'operations',
    purpose:
      'Data lifecycle and archival. Nothing is purged; delete and purge are absent on every storage surface.',
  },
  {
    id: 'MOD-SA-18',
    name: 'Platform Audit',
    slug: 'platform-audit',
    band: 'operations',
    purpose:
      'The platform audit log. Entries are committed alone; edit and delete are absent, not even greyed.',
  },
  {
    id: 'MOD-SA-19',
    name: 'The Tenant-Configuration Registry',
    slug: 'tenant-configuration-registry',
    band: 'operations',
    purpose:
      'The platform default, bound and current value for every governed setting, for every tenant. Rejects an out-of-bound write.',
  },
] as const satisfies readonly SaModuleDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `SaModuleId` gains or loses a
// member that `SA_MODULES` does not list exactly once.
type MissingFromModules = Exclude<SaModuleId, (typeof SA_MODULES)[number]['id']>
const _modulesExhaustive: MissingFromModules extends never ? true : never = true
void _modulesExhaustive

const BY_ID = new Map(SA_MODULES.map((m) => [m.id, m]))

export function saModuleById(id: SaModuleId): SaModuleDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown SURF-SA module: ${id}`)
  return found
}

export function saBandById(id: SaBandId): SaBandDefinition {
  const found = SA_BANDS.find((b) => b.id === id)
  if (!found) throw new Error(`Unknown SURF-SA band: ${id}`)
  return found
}

export function modulesInBand(band: SaBandId): readonly SaModuleDefinition[] {
  return SA_MODULES.filter((m) => m.band === band)
}
