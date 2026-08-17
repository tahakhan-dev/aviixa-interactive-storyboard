export type SurfaceId =
  | 'SURF-SA'
  | 'SURF-DOH'
  | 'SURF-STU'
  | 'SURF-CC'
  | 'SURF-FL'

export interface SurfaceDefinition {
  readonly id: SurfaceId
  /** Full human-readable name. Never a bare acronym. Spec section 20.6. */
  readonly name: string
  /** One plain-language sentence a non-specialist can follow. */
  readonly purpose: string
  /** URL segment under which this surface's routes live. */
  readonly basePath: string
  /** Prefix of the module identifiers this surface owns. */
  readonly modulePrefix: string
  /** Canonical module count from the frozen source, L1089 and AC-COV-112. */
  readonly canonicalModuleCount: number
  /** What this surface authoritatively owns. Spec section 3.3. */
  readonly ownership: string
}

// Task 13 gate: `: readonly SurfaceDefinition[]` WIDENS the const, which
// would make the exhaustiveness check below type-check unconditionally
// (same defect fixed for COVERAGE_STATUSES/REGISTRY_DESCRIPTORS in
// @/coverage/descriptors and CONNECTIVITY_MODES in @/scenario/controls).
// `as const satisfies` keeps every `id` literal narrowed to `SurfaceId`.
export const SURFACES = [
  {
    id: 'SURF-SA',
    name: 'Super Admin Platform Console',
    purpose:
      'The platform control plane. It runs the platform itself and the tenants on it, without browsing tenant operational records.',
    basePath: '/super-admin',
    modulePrefix: 'MOD-SA-',
    canonicalModuleCount: 19,
    ownership: 'Platform configuration, tenant lifecycle, and platform audit.',
  },
  {
    id: 'SURF-DOH',
    name: 'Delivery Operations Hub',
    purpose:
      'The tenant operational system of record. Jobs, Runs, assignments, summaries and qualifications live here officially.',
    basePath: '/hub',
    modulePrefix: 'MOD-DOH-',
    canonicalModuleCount: 19,
    ownership:
      'Authoritative tenant operational records and the tenant audit trail.',
  },
  {
    id: 'SURF-STU',
    name: 'Standards and Operations Studio',
    purpose:
      'Where the work is defined. Workflows, instructions, specifications and training are authored, approved and published here.',
    basePath: '/studio',
    modulePrefix: 'MOD-STU-',
    canonicalModuleCount: 18,
    ownership: 'Definition, version and work-package truth.',
  },
  {
    id: 'SURF-CC',
    name: 'Client Command Center',
    purpose:
      'The monitoring cockpit. It watches the shift and can take ten light operational actions, and it owns no record of its own.',
    basePath: '/command-center',
    modulePrefix: 'MOD-CC-',
    canonicalModuleCount: 13,
    ownership:
      'Nothing. Every action is a command against a Delivery Operations Hub record, executed through the owning service.',
  },
  {
    id: 'SURF-FL',
    name: 'Frontline Worker Application',
    purpose:
      'What the worker holds on the floor. It runs the work, captures the evidence, and keeps working when the network does not.',
    basePath: '/frontline',
    modulePrefix: 'MOD-FL-',
    canonicalModuleCount: 12,
    ownership:
      'The local origin of worker operational captures, contributed to the official record at synchronisation.',
  },
] as const satisfies readonly SurfaceDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `SurfaceId` gains or loses a
// member that `SURFACES` does not list exactly once.
type MissingFromSurfaces = Exclude<SurfaceId, (typeof SURFACES)[number]['id']>
const _surfacesExhaustive: MissingFromSurfaces extends never ? true : never = true
void _surfacesExhaustive

const BY_ID = new Map(SURFACES.map((s) => [s.id, s]))

export function surfaceById(id: SurfaceId): SurfaceDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown surface: ${id}`)
  return found
}
