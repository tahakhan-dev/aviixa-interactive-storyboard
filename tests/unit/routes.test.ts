import { describe, it, expect } from 'vitest'
import { ROUTES, routesForRole, routeByPathname, routeBySurface } from '@/routes/definitions'
import { SURFACES } from '@/domain/surfaces'
import { ROLES } from '@/domain/roles'
import { metadata as superAdminMetadata } from '../../app/super-admin/page'
import { metadata as hubMetadata } from '../../app/hub/page'
import { metadata as studioMetadata } from '../../app/studio/page'
import { metadata as commandCenterMetadata } from '../../app/command-center/page'
import { metadata as frontlineMetadata } from '../../app/frontline/page'

describe('route registry', () => {
  it('gives every surface at least one route', () => {
    for (const s of SURFACES) {
      expect(ROUTES.some((r) => r.surface === s.id), s.id).toBe(true)
    }
  })

  it('uses unique route ids and unique pathnames', () => {
    expect(new Set(ROUTES.map((r) => r.id)).size).toBe(ROUTES.length)
    expect(new Set(ROUTES.map((r) => r.pathname)).size).toBe(ROUTES.length)
  })

  it('gives every route a title, one heading, and source refs', () => {
    for (const r of ROUTES) {
      expect(r.title.length, r.id).toBeGreaterThan(3)
      expect(r.heading.length, r.id).toBeGreaterThan(3)
      expect(r.sourceRefs.length, r.id).toBeGreaterThan(0)
    }
  })

  it('grants every route to at least one of the nine roles', () => {
    for (const r of ROUTES) {
      expect(r.allowedRoles.length, r.id).toBeGreaterThan(0)
    }
  })

  it('gives every role at least one reachable route', () => {
    for (const role of ROLES) {
      expect(routesForRole(role.id).length, role.id).toBeGreaterThan(0)
    }
  })

  // Read-only Auditor reaches the Hub only. MOD-CC-13 note 4, DEC-AUDSTU-001.
  it('keeps the Read-only Auditor out of the Command Center and Frontline', () => {
    const surfaces = new Set(routesForRole('READONLY_AUDITOR').map((r) => r.surface))
    expect(surfaces.has('SURF-CC')).toBe(false)
    expect(surfaces.has('SURF-FL')).toBe(false)
  })

  // MOD-FL-A2: the Worker's home is the Frontline application.
  it('keeps the Worker on the Frontline surface', () => {
    const surfaces = new Set(routesForRole('WORKER').map((r) => r.surface))
    expect([...surfaces]).toEqual(['SURF-FL'])
  })

  it('resolves a route by pathname', () => {
    expect(routeByPathname('/command-center')?.surface).toBe('SURF-CC')
  })

  // M6: routeByPathname must normalise more than exactly one trailing slash,
  // and must not be case-sensitive about the path segment.
  it('resolves a route regardless of extra trailing slashes or case', () => {
    expect(routeByPathname('/hub//')?.surface).toBe('SURF-DOH')
    expect(routeByPathname('/Hub/')?.surface).toBe('SURF-DOH')
    expect(routeByPathname('/HUB')?.surface).toBe('SURF-DOH')
  })

  // I5: roles.ts's homeSurface/reachableSurfaces and this file's ternary must
  // not be allowed to drift apart silently -- slice 3 must not be able to
  // change one and forget the other.
  it('agrees with roles.ts reachableSurfaces for every role', () => {
    for (const role of ROLES) {
      const fromRoutes = [...new Set(routesForRole(role.id).map((r) => r.surface))].sort()
      const fromRoleDef = [...role.reachableSurfaces].sort()
      expect(fromRoutes, role.id).toEqual(fromRoleDef)
    }
  })

  it('uses no bare acronym as a route title', () => {
    for (const r of ROUTES) {
      expect(r.title, r.id).not.toMatch(/^(SURF|MOD|DOH|STU|CC|FL|SA)-/)
    }
  })

  // M2: RouteDefinition.title is documented as "Browser tab title" -- each
  // page's own `metadata.title` export must actually be sourced from it,
  // not a second hand-typed string that can drift.
  it('wires every surface page metadata.title from the route registry', () => {
    expect(superAdminMetadata.title).toBe(routeBySurface('SURF-SA').title)
    expect(hubMetadata.title).toBe(routeBySurface('SURF-DOH').title)
    expect(studioMetadata.title).toBe(routeBySurface('SURF-STU').title)
    expect(commandCenterMetadata.title).toBe(routeBySurface('SURF-CC').title)
    expect(frontlineMetadata.title).toBe(routeBySurface('SURF-FL').title)
  })
})
