import { describe, it, expect } from 'vitest'
import {
  DOH_MODULES,
  DOH_OUT_OF_SLICE_MODULES,
  dohModuleById,
  type DohModuleId,
} from '@/surfaces/doh/modules'
import {
  TENANT_STATES,
  TENANT_WRITE_CLASSES,
  ALL_WRITE_ACTIONS,
  writeAllowed,
} from '@/surfaces/doh/tenant-state'
import { DOH_SCOPES, DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import { ACCESS_CONDITIONS, PRECEDENCE_RULES } from '@/surfaces/doh/access-conditions'
import { DOH_SCREENS, dohScreenById } from '@/surfaces/doh/screens'
import { DOH_SEAMS, dohSeamById } from '@/surfaces/doh/seams'

describe('DOH_MODULES — the eight slice-4 modules', () => {
  it('carries exactly eight modules, slugged not numbered', () => {
    expect(DOH_MODULES).toHaveLength(8)
    for (const m of DOH_MODULES) {
      expect(m.slug, m.id).not.toMatch(/^SCR-DOH-\d+$/i)
      expect(m.slug, m.id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('names every module from the canonical eight, in id order', () => {
    expect(DOH_MODULES.map((m) => m.id)).toEqual([
      'MOD-DOH-01', 'MOD-DOH-02', 'MOD-DOH-03', 'MOD-DOH-04',
      'MOD-DOH-09', 'MOD-DOH-12', 'MOD-DOH-13', 'MOD-DOH-14',
    ])
  })

  it('resolves a module by id', () => {
    expect(dohModuleById('MOD-DOH-01' as DohModuleId).name).toBe(
      'Tenant Lifecycle and Tier Operations',
    )
    expect(dohModuleById('MOD-DOH-14' as DohModuleId).name).toBe('Qualification Calendar')
  })

  it('gives every module a unique slug', () => {
    const slugs = DOH_MODULES.map((m) => m.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('DOH_OUT_OF_SLICE_MODULES — the other eleven, not built in slice 4', () => {
  it('carries exactly eleven, none overlapping the eight in-slice ids', () => {
    expect(DOH_OUT_OF_SLICE_MODULES).toHaveLength(11)
    const inSlice: ReadonlySet<string> = new Set(DOH_MODULES.map((m) => m.id))
    for (const m of DOH_OUT_OF_SLICE_MODULES) {
      expect(inSlice.has(m.id), m.id).toBe(false)
    }
  })

  it('names the slice or reason that owns each excluded module, never blank', () => {
    for (const m of DOH_OUT_OF_SLICE_MODULES) {
      expect(m.ownedBy.trim().length, m.id).toBeGreaterThan(0)
    }
  })

  it('together with the eight in-slice modules accounts for all nineteen canonical Hub modules', () => {
    expect(DOH_MODULES.length + DOH_OUT_OF_SLICE_MODULES.length).toBe(19)
  })
})

describe('TENANT_STATES — five operating states; pilot is a flag, not a state', () => {
  it('carries five operating tenant states', () => {
    expect(TENANT_STATES).toHaveLength(5)
    expect(TENANT_STATES).not.toContain('pilot')
    expect(TENANT_STATES).not.toContain('draft')
    expect(TENANT_STATES).not.toContain('awaiting_administrator')
  })
})

describe('writeAllowed — the write-class table as one data structure', () => {
  it('encodes the write classes verbatim: soft keeps recertification and clearances open', () => {
    expect(writeAllowed('soft-suspended', 'recertify-worker')).toBe(true)
    expect(writeAllowed('soft-suspended', 'grant-clearance')).toBe(true)
    expect(writeAllowed('soft-suspended', 'create-worker')).toBe(false)
    expect(writeAllowed('soft-suspended', 'create-job')).toBe(false)
    expect(writeAllowed('soft-suspended', 'create-location')).toBe(false)
    expect(writeAllowed('soft-suspended', 'create-shift')).toBe(false)
    expect(writeAllowed('soft-suspended', 'create-part')).toBe(false)
    expect(writeAllowed('soft-suspended', 'edit-configuration')).toBe(false)
  })

  it('D15: blocks a tier upgrade under soft suspension', () => {
    expect(writeAllowed('soft-suspended', 'upgrade-tier')).toBe(false)
  })

  it('hard suspension opens only the enumerated completion pipeline', () => {
    const pipeline = [
      'execute-step', 'capture-data', 'sync-data',
      'substitute-to-complete-run', 'compute-summary',
      'send-notification', 'write-audit',
    ] as const
    for (const a of pipeline) {
      expect(writeAllowed('hard-suspended', a), a).toBe(true)
    }
  })

  it('D16: blocks recertification and clearance grants under hard suspension', () => {
    expect(writeAllowed('hard-suspended', 'recertify-worker')).toBe(false)
    expect(writeAllowed('hard-suspended', 'grant-clearance')).toBe(false)
  })

  it('hard suspension blocks new runs and all master-data writes', () => {
    expect(writeAllowed('hard-suspended', 'start-run')).toBe(false)
    expect(writeAllowed('hard-suspended', 'create-job')).toBe(false)
    expect(writeAllowed('hard-suspended', 'edit-configuration')).toBe(false)
  })

  it('compliance suspension blocks all logins, so every write is blocked', () => {
    for (const a of ALL_WRITE_ACTIONS) {
      expect(writeAllowed('compliance-suspended', a), a).toBe(false)
    }
  })

  it('an active tenant has every write action open', () => {
    for (const a of ALL_WRITE_ACTIONS) {
      expect(writeAllowed('active', a), a).toBe(true)
    }
  })

  it('applies the stricter interpretation where state cannot be determined', () => {
    expect(writeAllowed('indeterminate', 'recertify-worker')).toBe(false)
    for (const a of ALL_WRITE_ACTIONS) {
      expect(writeAllowed('indeterminate', a), a).toBe(false)
    }
  })

  it('is encoded as one table, one row per state, covering every tenant state plus indeterminate', () => {
    expect(TENANT_WRITE_CLASSES).toHaveLength(6)
    expect(TENANT_WRITE_CLASSES.map((r) => r.state).sort()).toEqual(
      [...TENANT_STATES, 'indeterminate'].sort(),
    )
  })
})

describe('DOH_SCOPES — exactly three dimensions', () => {
  it('holds exactly three scope dimensions — Cell, Job and worker are deferred', () => {
    expect(DOH_SCOPES).toEqual(['tenant', 'site', 'area'])
  })

  it('keeps the deferred scopes named but separate from the closed set', () => {
    expect(DEFERRED_DOH_SCOPES).toEqual(['cell', 'job', 'worker'])
    for (const d of DEFERRED_DOH_SCOPES) {
      expect(DOH_SCOPES).not.toContain(d)
    }
  })
})

describe('ACCESS_CONDITIONS — the nine, in source order (L14512)', () => {
  it('enumerates the nine access conditions in the source order, role permission first, safety controls ninth', () => {
    expect(ACCESS_CONDITIONS).toHaveLength(9)
    expect(ACCESS_CONDITIONS[0]).toBe('role-permission')
    expect(ACCESS_CONDITIONS[8]).toBe('safety-controls')
  })

  it('puts two precedence rules above the intersection', () => {
    expect(PRECEDENCE_RULES).toEqual(['explicit-deny-wins', 'safety-controls-win'])
  })
})

describe('DOH_SCREENS — catalogue B, names canonical, never a three-digit form', () => {
  it('never carries a three-digit SCR-DOH-NNN literal', () => {
    for (const s of DOH_SCREENS) {
      expect(s.id, s.id).not.toMatch(/^SCR-DOH-\d{3}$/)
    }
  })

  it('resolves the sign-in and tenant administration area screens', () => {
    expect(dohScreenById('SCR-DOH-01').name).toBe('Sign-in')
    expect(dohScreenById('SCR-DOH-23').name).toMatch(/tenant administration/i)
  })

  it('leaves SCR-DOH-23 ownerless, per D2', () => {
    expect(dohScreenById('SCR-DOH-23').moduleId).toBeNull()
  })

  it('leaves the shared module rail screen ownerless, per S3', () => {
    expect(dohScreenById('SCR-DOH-02').moduleId).toBeNull()
  })
})

describe('DOH_SEAMS — the five named cross-slice seams', () => {
  it('is closed at five', () => {
    expect(DOH_SEAMS).toHaveLength(5)
  })

  it('names every seam owner distinctly, never leaving one nameless', () => {
    for (const s of DOH_SEAMS) {
      expect(s.description.trim().length, s.id).toBeGreaterThan(0)
      expect(s.ownerSlice, s.id).toBeGreaterThan(0)
    }
  })

  it('resolves a seam by id', () => {
    expect(dohSeamById('worker-shift-meter').ownerSlice).toBe(6)
    expect(dohSeamById('platform-access-history-audit').ownerSlice).toBe(10)
  })
})
