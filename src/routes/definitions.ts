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

export function routeByPathname(pathname: string): RouteDefinition | undefined {
  return BY_PATH.get(pathname.replace(/\/$/, '') || '/')
}

export function routesForRole(role: RoleId): readonly RouteDefinition[] {
  return ROUTES.filter((r) => r.allowedRoles.includes(role))
}
