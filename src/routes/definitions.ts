import type { RoleId } from '@/domain/roles'
import { SURFACES, type SurfaceId } from '@/domain/surfaces'

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
  readonly sourceRefs: readonly string[]
}

const PLATFORM_ROLES: readonly RoleId[] = [
  'ROOT_SUPER_ADMIN',
  'ADMIN',
  'PLATFORM_ENGINEER',
  'SUPPORT',
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
