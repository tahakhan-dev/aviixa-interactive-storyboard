import { describe, it, expect } from 'vitest'
import {
  ROLES,
  roleById,
  rolesInDomain,
  SUPERVISOR_AND_ABOVE,
  QUALITY_MANAGER_AND_ABOVE,
} from '@/domain/roles'

describe('roles', () => {
  it('defines exactly nine human security roles', () => {
    expect(ROLES).toHaveLength(9)
  })

  it('splits four platform roles and five tenant roles', () => {
    expect(rolesInDomain('PLATFORM')).toHaveLength(4)
    expect(rolesInDomain('TENANT')).toHaveLength(5)
  })

  it('never defines a Tenant Super Admin', () => {
    expect(ROLES.map((r) => r.name).join(' ')).not.toMatch(
      /Tenant Super Admin/i,
    )
  })

  it('never treats Job Owner as a role', () => {
    expect(ROLES.map((r) => r.name).join(' ')).not.toMatch(/Job Owner/i)
  })

  it('never treats Plant Manager or Quality Director as a role', () => {
    const names = ROLES.map((r) => r.name).join(' ')
    expect(names).not.toMatch(/Plant Manager/i)
    expect(names).not.toMatch(/Quality Director/i)
  })

  it('marks Root Super Admin as the single backend-created account', () => {
    const root = roleById('ROOT_SUPER_ADMIN')
    expect(root.backendCreatedOnly).toBe(true)
    expect(root.maxInstances).toBe(1)
  })

  // DEC-PLUS-001: "and above" is an enumerated grant, never inferred from rank.
  it('enumerates "Supervisor and above" without Tenant Admin', () => {
    expect([...SUPERVISOR_AND_ABOVE].sort()).toEqual([
      'QUALITY_MANAGER',
      'SUPERVISOR',
    ])
    expect(SUPERVISOR_AND_ABOVE).not.toContain('TENANT_ADMIN')
  })

  it('enumerates "Quality Manager and above" as Quality Manager alone', () => {
    expect([...QUALITY_MANAGER_AND_ABOVE]).toEqual(['QUALITY_MANAGER'])
  })

  it('gives every role a plain-language purpose and a home surface', () => {
    for (const r of ROLES) {
      expect(r.purpose.length).toBeGreaterThan(20)
      expect(r.homeSurface).toBeTruthy()
    }
  })
})
