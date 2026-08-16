import { describe, it, expect } from 'vitest'
import { ROUTES, routesForRole, routeByPathname } from '@/routes/definitions'
import { SURFACES } from '@/domain/surfaces'
import { ROLES } from '@/domain/roles'

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

  it('uses no bare acronym as a route title', () => {
    for (const r of ROUTES) {
      expect(r.title, r.id).not.toMatch(/^(SURF|MOD|DOH|STU|CC|FL|SA)-/)
    }
  })
})
