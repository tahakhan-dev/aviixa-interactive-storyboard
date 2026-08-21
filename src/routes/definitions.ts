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
  /**
   * The source's own identifier for the open question. A `DEC-*` where the
   * source names one; otherwise the source's own acceptance criterion that
   * carries the question open.
   *
   * WIDENED, AND ONLY IN THE DOC COMMENT, BECAUSE THE SECOND CASE ARRIVED.
   * `DEC-AUDSTU-001` is named by the source. The Tenant Admin device session
   * below is not: L39837 classifies it `Not specified in the Statement of
   * Work` and no `DEC-*` is attached to it anywhere. Minting one here would
   * fabricate a source identifier, so the field carries `AC-FL-009-5`, which
   * is the source's own identifier for the instruction to keep it open. What
   * is never allowed is a blank or an invented `DEC-*`.
   */
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
 * TWO open surface decisions, not one, and the rule that kept it to one is
 * unchanged: a general escape hatch from `allowedRoles` is how a refusal
 * quietly becomes a permission, so an entry exists only where the SOURCE
 * refuses to answer and names its refusal. Nothing can be added without
 * naming one too.
 */
const STUDIO_OPEN_DECISION_ROLES: readonly RouteOpenDecision[] = [
  {
    role: 'READONLY_AUDITOR',
    decision: 'DEC-AUDSTU-001',
    why:
      'The §5.18 permission table enumerates five fixed roles and the Read-only Auditor is not one of them, so the Statement of Work states nothing about whether this role may open the Studio. AC-STU-157 (L34674) forbids assuming either answer, so this registry records the question rather than an answer: the role is not in allowedRoles, and its absence there is not a refusal.',
  },
]

/**
 * THE SECOND ONE, AND IT IS THE IDENTICAL CASE ON A DIFFERENT SURFACE.
 *
 * `SURF-FL` gives `allowedRoles: ['WORKER']`, and until now
 * `openDecisionRoles: []` — so the Tenant Admin's absence from the list was
 * the whole record, and an absence reads as "no". That is a REFUSAL, and it
 * is the one thing `AC-FL-009-5` (L39948) forbids: "The Tenant Admin
 * device-session question is carried as an open item and is not silently
 * resolved in either direction by the implementation."
 *
 * The source's own tenant-role table for this surface (row at L39837) reads
 * `Client Decision Required` in the "Session on the device" column, with the
 * basis column reading `Not specified in the Statement of Work`.
 *
 * ELEVEN CELLS INHERIT THIS ANSWER, AND THEY WERE COUNTED, NOT ESTIMATED.
 * Every `Client Decision Required` cell in the twelve Frontline permission
 * matrices — all eleven of the 539 — sits in the Tenant Admin column:
 * L40188, L40189, L40190, L40192 (`MOD-FL-A1`), L40361 (`MOD-FL-A2`),
 * L40526, L40534 (`MOD-FL-A3`), L40722 (`MOD-FL-A4`), L41300
 * (`MOD-FL-A7`), L41623, L41624 (`MOD-FL-B9`). Each of them defers to the
 * same unanswered question, so recording it once here is what stops eleven
 * cells being answered eleven times privately.
 *
 * IT ALSO CHANGES WHAT THE HUB SAYS. `crossSurfaceStatement` in
 * `@/surfaces/doh/boundary` reads `routeOpenDecisionFor` for every boundary
 * row, and row 8 of the §19.1.2 register — step execution and data capture,
 * L25726 — is owned by `SURF-FL`. Before this, a Tenant Admin reading that
 * row on a Hub screen was told the Frontline "is not a surface your role
 * opens", which asserts exactly the refusal the criterion withholds. Now
 * they are told the question is open.
 *
 * THIS GRANTS NOTHING. `routesForRole` is unchanged and does not consult
 * this field, exactly as for `DEC-AUDSTU-001`.
 */
const FRONTLINE_OPEN_DECISION_ROLES: readonly RouteOpenDecision[] = [
  {
    role: 'TENANT_ADMIN',
    decision: 'AC-FL-009-5',
    why:
      "The frozen source's tenant-role table for this surface (L39837) reads `Client Decision Required` for a Tenant Admin device session, with the basis column reading `Not specified in the Statement of Work` — the Statement of Work neither grants nor denies it. AC-FL-009-5 (L39948) requires the question to be carried as an open item and not resolved in either direction by the implementation, so this registry records the question rather than an answer: the role is not in allowedRoles, and its absence there is not a refusal. No DEC-* identifier is attached to this conflict anywhere in the source, which is why this names the criterion rather than inventing one.",
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
    openDecisionRoles:
      s.id === 'SURF-STU'
        ? STUDIO_OPEN_DECISION_ROLES
        : s.id === 'SURF-FL'
          ? FRONTLINE_OPEN_DECISION_ROLES
          : [],
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
