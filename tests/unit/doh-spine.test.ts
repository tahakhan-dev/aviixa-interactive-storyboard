import { existsSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import {
  DOH_MODULES,
  DOH_OUT_OF_SLICE_MODULES,
  MATRIX_ROW_SURFACE_DIVERGENCES,
  cellStatus,
  dohModuleById,
  rolesReachingByMatrix,
  type DohModuleId,
} from '@/surfaces/doh/modules'
import { MOD_DOH_05_MATRIX } from '@/surfaces/doh/modules/doh-05/matrix'
import { MOD_DOH_06_MATRIX } from '@/surfaces/doh/modules/doh-06/matrix'
import { MOD_DOH_15_MATRIX } from '@/surfaces/doh/modules/doh-15/matrix'
import { CONTROL_MATRIX as DOH_19_MATRIX } from '@/surfaces/doh/modules/doh-19/matrix'
import {
  TENANT_STATES,
  TENANT_WRITE_CLASSES,
  ALL_WRITE_ACTIONS,
  writeAllowed,
} from '@/surfaces/doh/tenant-state'
import { DOH_SCOPES, DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import {
  ACCESS_CONDITIONS,
  EVALUATION_ORDER,
  PRECEDENCE_RULES,
} from '@/surfaces/doh/access-conditions'
import { DOH_SCREENS, dohScreenById } from '@/surfaces/doh/screens'
import { DOH_SEAMS, dohSeamById } from '@/surfaces/doh/seams'

describe('DOH_MODULES — the fifteen built modules', () => {
  it('carries exactly fifteen modules, slugged not numbered', () => {
    expect(DOH_MODULES).toHaveLength(15)
    for (const m of DOH_MODULES) {
      expect(m.slug, m.id).not.toMatch(/^SCR-DOH-\d+$/i)
      expect(m.slug, m.id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('names every built module in id order — the slice-4 eight plus the slice-6 seven', () => {
    expect(DOH_MODULES.map((m) => m.id)).toEqual([
      'MOD-DOH-01', 'MOD-DOH-02', 'MOD-DOH-03', 'MOD-DOH-04',
      'MOD-DOH-05', 'MOD-DOH-06', 'MOD-DOH-07', 'MOD-DOH-08',
      'MOD-DOH-09', 'MOD-DOH-12', 'MOD-DOH-13', 'MOD-DOH-14',
      'MOD-DOH-15', 'MOD-DOH-16', 'MOD-DOH-19',
    ])
  })

  it('resolves a module by id', () => {
    expect(dohModuleById('MOD-DOH-01' as DohModuleId).name).toBe(
      'Tenant Lifecycle and Tier Operations',
    )
    expect(dohModuleById('MOD-DOH-14' as DohModuleId).name).toBe('Qualification Calendar')
  })

  /**
   * SLUG IS UNIQUE PER ROUTE AND NOT PER MODULE, which was the shape before
   * `MOD-DOH-15` landed and is no longer the claim the spine makes. What is
   * asserted instead is stronger than uniqueness: every slug names a route
   * directory that EXISTS, so no rail entry can point at a 404, and the only
   * module sharing another's slug is the one the source gives no screen of
   * its own (L48105 mounts `MOD-DOH-15` inside `MOD-DOH-05`'s Job editor).
   */
  it('gives every module a slug naming a built route, sharing one only where the source mounts one module in another', () => {
    for (const m of DOH_MODULES) {
      expect(existsSync(`app/hub/${m.slug}/page.tsx`), `${m.id} -> app/hub/${m.slug}`).toBe(true)
    }
    const shared = DOH_MODULES.filter(
      (m) => DOH_MODULES.filter((o) => o.slug === m.slug).length > 1,
    ).map((m) => m.id)
    expect(shared).toEqual(['MOD-DOH-05', 'MOD-DOH-15'])
    expect(dohScreenById('SCR-DOH-11').alsoShows).toContain('MOD-DOH-15')
  })
})

/**
 * THE `another-surface` RULING, PINNED AGAINST LIVE ROWS.
 *
 * The register in `@/surfaces/doh/modules` is prose; these are the rows it
 * describes. Each assertion is written so that CORRECTING a divergence goes
 * red here — a task that reclassifies `MOD-DOH-05` row 8 or renames the
 * member has to come back and update the register rather than leaving a
 * finding describing a tree that no longer exists.
 */
describe('MatrixRowSurface — `another-surface` means "not this module’s own screen"', () => {
  it('registers all three divergences, each naming where it lives and why', () => {
    expect(MATRIX_ROW_SURFACE_DIVERGENCES).toHaveLength(3)
    for (const d of MATRIX_ROW_SURFACE_DIVERGENCES) {
      expect(d.where.length, d.where).toBeGreaterThan(10)
      expect(d.why.length, d.where).toBeGreaterThan(80)
      expect(d.sourceRef, d.where).toMatch(/L\d{4,5}/)
    }
  })

  it('the two rows the register names are still classified `another-surface`, and their alternative is still a Hub screen', () => {
    const mapping = MOD_DOH_05_MATRIX.find(
      (r) => r.id === 'maintain-the-tag-to-qualification-set-mapping',
    )!
    expect(mapping.surface).toBe('another-surface')
    expect(mapping.sourceRef).toContain('L27701')
    // The alternative is the tenant administration area, which is SCR-DOH-23
    // — a Hub screen group, not a surface (L1598, AC-PROD-040 L1614).
    expect(mapping.detail.TENANT_ADMIN).toContain('tenant administration area')
    expect(dohScreenById('SCR-DOH-23').name).toBe('Tenant administration area')

    const approve = MOD_DOH_15_MATRIX.find((r) => r.id === 'approve-the-cloned-job')!
    expect(approve.surface).toBe('another-surface')
    expect(approve.metInstead).toContain('L48106')
    expect(dohScreenById('SCR-DOH-12').name).toBe('Job approval queue')
  })

  it('MOD-DOH-06 puts the SAME fourth case on the other side of the line, and its answer does not move', () => {
    // Two rows set in the tenant administration area — the same place as
    // MOD-DOH-05 row 8 — and classified `screen` rather than
    // `another-surface`. That is the vocabulary being one member short, not
    // a module being careless: both cards refuse a cross-surface link and
    // both are right to.
    const settings = MOD_DOH_06_MATRIX.filter((r) =>
      ['set-the-record-finish-window', 'set-the-run-extension-cap'].includes(r.id),
    )
    expect(settings).toHaveLength(2)
    for (const row of settings) {
      expect(row.surface, row.id).toBe('screen')
      expect(row.detail.TENANT_ADMIN, row.id).toContain('tenant administration area')
    }
    // Reclassifying them the way MOD-DOH-05 classifies its own does not move
    // this module's reach, because row 2 admits every role on its own screen.
    const asIfElsewhere = MOD_DOH_06_MATRIX.map((r) =>
      settings.some((s) => s.id === r.id) ? { ...r, surface: 'another-surface' as const } : r,
    )
    expect(rolesReachingByMatrix(asIfElsewhere, cellStatus)).toEqual(
      rolesReachingByMatrix(MOD_DOH_06_MATRIX, cellStatus),
    )
  })

  it('neither MOD-DOH-05 nor MOD-DOH-15 carries a boundary pointer, which is why the token cannot be read as a surface', () => {
    for (const row of [...MOD_DOH_05_MATRIX, ...MOD_DOH_15_MATRIX]) {
      expect((row as { boundary?: string }).boundary, row.id).toBeUndefined()
    }
    // Non-vacuous: rows that DO name a surface carry it on their own field,
    // never on the classification.
    const inline = DOH_19_MATRIX.find((r) => r.id === 'add-a-part-inline-during-authoring')!
    expect(inline.surface).toBe('another-surface')
    expect(inline.metElsewhere?.surface).toBe('SURF-STU')
  })

  it('the classification, not the token, is what keeps the Quality Manager off MOD-DOH-15', () => {
    // Clause one alone. Reclassify row 3 `screen` and the module gains a
    // Quality Manager whose only standing is an act on another screen; the
    // build's `noClassification` mutant pins the same fact.
    const asIfScreen = MOD_DOH_15_MATRIX.map((r) =>
      r.id === 'approve-the-cloned-job' ? { ...r, surface: 'screen' as const } : r,
    )
    expect(rolesReachingByMatrix(MOD_DOH_15_MATRIX, cellStatus)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
    ])
    expect(rolesReachingByMatrix(asIfScreen, cellStatus)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
    ])
  })
})

describe('DOH_OUT_OF_SLICE_MODULES — the other four, not built here', () => {
  it('carries exactly four, none overlapping the fifteen in-slice ids', () => {
    expect(DOH_OUT_OF_SLICE_MODULES).toHaveLength(4)
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

  it('together with the fifteen in-slice modules accounts for all nineteen canonical Hub modules', () => {
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

describe('ACCESS_CONDITIONS — the nine, in definition order (L14514-L14522)', () => {
  it('enumerates the nine access conditions in the definition order, role permission first, safety controls ninth', () => {
    expect(ACCESS_CONDITIONS).toHaveLength(9)
    expect(ACCESS_CONDITIONS[0]).toBe('role-permission')
    expect(ACCESS_CONDITIONS[8]).toBe('safety-controls')
  })

  // The source states an ORDER as well as a LIST, and they differ. Keeping
  // them in one array is what reported a safety breach as a role denial.
  it('carries the workflow order as a separate array, safety first (L14532)', () => {
    expect(EVALUATION_ORDER).toHaveLength(9)
    expect(EVALUATION_ORDER[0]).toBe('safety-controls')
    expect(ACCESS_CONDITIONS[0]).not.toBe(EVALUATION_ORDER[0])
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

describe('DOH_SEAMS — the eight named cross-slice seams', () => {
  it('names every seam from the canonical eight, in id order', () => {
    expect(DOH_SEAMS.map((s) => s.id)).toEqual([
      // The eighth. `MOD-DOH-08` reads Regulated-Industry mode for row 14's
      // forced-on constraint and builds none of it; there was no row for it.
      'regulated-industry-mode',
      'worker-shift-meter',
      'archival-cascade',
      'shift-digest-delivery',
      'platform-access-history-audit',
      'qualification-gate',
      'tenant-contact-email-delivery',
      'certification-expiry-digest',
    ])
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
