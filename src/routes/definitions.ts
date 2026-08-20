import type { RoleId } from '@/domain/roles'
import { SURFACES, type SurfaceId } from '@/domain/surfaces'

/**
 * A role whose access to a surface the source has NOT SETTLED.
 *
 * C16. `allowedRoles` is a list, and a list has two answers: in, or out. The
 * source's answer for the Read-only Auditor on `SURF-STU` has three — row 1
 * of the consolidated Studio matrix (L34541) reads `Client Decision Required
 * — DEC-AUDSTU-001`, and `AC-STU-157` (L34674) requires it to stay unassumed:
 * "The Read-only Auditor's Studio access is not assumed; every affected cell
 * states `Client Decision Required` under `DEC-AUDSTU-001`."
 *
 * Leaving the role out of `allowedRoles` and stopping there records a
 * REFUSAL, which pre-empts the decision in option (a)'s direction — the exact
 * direction the criterion forbids. Adding it records a GRANT, which pre-empts
 * it in option (b)'s. So the registry records the third answer explicitly,
 * and `routesForRole` is deliberately unchanged: this GRANTS NOTHING. It
 * exists so the role can be told the decision is open instead of meeting a
 * silence that reads as "no".
 */
export interface RouteOpenDecision {
  readonly role: RoleId
  /** The source's own decision identifier. */
  readonly decision: string
  readonly why: string
}

export interface RouteDefinition {
  readonly id: string
  readonly pathname: string
  readonly surface: SurfaceId
  /** Browser tab title. Never a bare identifier. */
  readonly title: string
  /** The one primary heading rendered on the page. */
  readonly heading: string
  /** One plain-language sentence describing why this page exists. */
  readonly purpose: string
  readonly allowedRoles: readonly RoleId[]
  /**
   * Roles whose access is NEITHER granted NOR refused, because a named source
   * decision is open. Never consulted by `routesForRole`; see
   * `RouteOpenDecision`.
   */
  readonly openDecisionRoles: readonly RouteOpenDecision[]
  readonly sourceRefs: readonly string[]
}

const PLATFORM_ROLES: readonly RoleId[] = [
  'ROOT_SUPER_ADMIN',
  'ADMIN',
  'PLATFORM_ENGINEER',
  'SUPPORT',
]

/**
 * The one open surface decision in the build. Kept to `SURF-STU` and to one
 * role on purpose: a general escape hatch from `allowedRoles` is how a
 * refusal quietly becomes a permission, so this names the decision that
 * justifies it and nothing else can be added without naming one too.
 */
const STUDIO_OPEN_DECISION_ROLES: readonly RouteOpenDecision[] = [
  {
    role: 'READONLY_AUDITOR',
    decision: 'DEC-AUDSTU-001',
    why:
      'The §5.18 permission table enumerates five fixed roles and the Read-only Auditor is not one of them, so the Statement of Work states nothing about whether this role may open the Studio. AC-STU-157 (L34674) forbids assuming either answer, so this registry records the question rather than an answer: the role is not in allowedRoles, and its absence there is not a refusal.',
  },
]

export const ROUTES: readonly RouteDefinition[] = SURFACES.map((s) => {
  const allowedRoles: readonly RoleId[] =
    s.id === 'SURF-SA'
      ? PLATFORM_ROLES
      : s.id === 'SURF-FL'
        ? (['WORKER'] as const)
        : s.id === 'SURF-CC'
          ? (['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const)
          : s.id === 'SURF-STU'
            ? (['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const)
            : ([
                'TENANT_ADMIN',
                'SUPERVISOR',
                'QUALITY_MANAGER',
                'READONLY_AUDITOR',
              ] as const)

  return {
    id: `ROUTE-${s.id}-HOME`,
    pathname: s.basePath,
    surface: s.id,
    title: s.name,
    heading: s.name,
    purpose: s.purpose,
    allowedRoles,
    openDecisionRoles: s.id === 'SURF-STU' ? STUDIO_OPEN_DECISION_ROLES : [],
    sourceRefs: [s.id, 'L1089'],
  }
})

const BY_PATH = new Map(ROUTES.map((r) => [r.pathname, r]))

// M6: strip ALL trailing slashes (not just one -- `/hub//` left one behind)
// and lower-case the path (`/Hub/` never matched anything). BY_PATH's keys
// (SURFACES[].basePath) are already lower-case with no trailing slash.
export function routeByPathname(pathname: string): RouteDefinition | undefined {
  const normalised = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  return BY_PATH.get(normalised)
}

export function routesForRole(role: RoleId): readonly RouteDefinition[] {
  return ROUTES.filter((r) => r.allowedRoles.includes(role))
}

/**
 * The open source decision governing this role's access to this surface, or
 * `null`. Separate from `routesForRole` on purpose: a caller asking "may
 * this role in?" gets the same answer it always got, and a caller that wants
 * to TELL the role why the question is open has to ask for that explicitly.
 */
export function routeOpenDecisionFor(
  surface: SurfaceId,
  role: RoleId,
): RouteOpenDecision | null {
  const route = BY_SURFACE.get(surface)
  if (route === undefined) return null
  return route.openDecisionRoles.find((o) => o.role === role) ?? null
}

const BY_SURFACE = new Map(ROUTES.map((r) => [r.surface, r]))

/**
 * M2: the one route each surface's page component reads its
 * `metadata.title` from, so `RouteDefinition.title`'s "Browser tab title"
 * doc comment is true rather than aspirational. `routes.test.ts` proves
 * every surface has exactly one route, so this lookup is safe.
 */
export function routeBySurface(id: SurfaceId): RouteDefinition {
  const found = BY_SURFACE.get(id)
  if (!found) throw new Error(`no route registered for surface: ${id}`)
  return found
}
