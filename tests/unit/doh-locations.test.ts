import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  ARCHIVAL_CASCADES,
  CASCADE_STATES,
  CONTROL_MATRIX,
  CONTROL_STATUSES,
  DOH_AREAS,
  DOH_CELLS,
  DOH_SITES,
  LOCATION_NODE_FLAGS,
  LOCATION_NODE_STATES,
  NODE_FLAG_CONSEQUENCES,
  SEEDED_CERTIFICATION_TYPES,
  SEEDED_ROLE_SCOPES,
  UNSPECIFIED_IN_SOURCE,
  UNRESOLVED_IN_SOURCE,
  areaById,
  areasForSite,
  cellsForArea,
  siteById,
  visibleAreaIds,
  visibleSiteIds,
  type LocationArea,
  type LocationCell,
  type LocationSite,
} from '../../app/hub/location-configuration/fixtures'
import { dohModuleById } from '@/surfaces/doh/modules'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../app/hub/HubShell'

/** Widened views of the seeded tuples: `as const` narrows each node's `flags`
 *  to its own empty or one-member tuple, which makes `.includes` uncallable
 *  with a plain flag. The screen gets the same widening from `useState`. */
const SITES: readonly LocationSite[] = DOH_SITES
const AREAS: readonly LocationArea[] = DOH_AREAS
const CELLS: readonly LocationCell[] = DOH_CELLS

const MY_FILES = [
  'app/hub/location-configuration/fixtures.ts',
  'app/hub/location-configuration/LocationConfigurationScreen.tsx',
  'app/hub/location-configuration/page.tsx',
]

/* ------------------------------------------------------------------ *
 * The interface tasks 7, 8 and 9 code against. These four exports are
 * the contract; a rename here breaks three sibling modules, so it is
 * asserted rather than assumed.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 fixtures — the exported interface three later modules consume', () => {
  it('exports non-empty Sites and Areas with the accessor functions siblings resolve them through', () => {
    expect(DOH_SITES.length).toBeGreaterThan(0)
    expect(DOH_AREAS.length).toBeGreaterThan(0)
    const firstSite = DOH_SITES[0]
    const firstArea = DOH_AREAS[0]
    expect(firstSite).toBeDefined()
    expect(firstArea).toBeDefined()
    if (!firstSite || !firstArea) return
    expect(siteById(firstSite.id)?.name).toBe(firstSite.name)
    expect(areaById(firstArea.id)?.name).toBe(firstArea.name)
    expect(siteById('SITE-NOT-SEEDED')).toBeUndefined()
    expect(areasForSite(firstSite.id).every((a) => a.siteId === firstSite.id)).toBe(true)
  })

  it('gives every Site exactly one timezone and gives an Area none, so a Shift inherits rather than overrides', () => {
    for (const site of DOH_SITES) {
      expect(site.timezone.trim().length, site.id).toBeGreaterThan(0)
      expect(site.timezone, site.id).toMatch(/^[A-Za-z]+\/[A-Za-z_]+$/)
    }
    for (const area of DOH_AREAS) {
      expect(Object.hasOwn(area, 'timezone'), area.id).toBe(false)
    }
  })

  it('resolves every Area to a seeded Site and every Cell to a seeded Area, with unique ids throughout', () => {
    const siteIds = new Set(DOH_SITES.map((s) => s.id))
    const areaIds = new Set(DOH_AREAS.map((a) => a.id))
    for (const area of DOH_AREAS) expect(siteIds.has(area.siteId), area.id).toBe(true)
    for (const cell of DOH_CELLS) expect(areaIds.has(cell.areaId), cell.id).toBe(true)
    const all = [...DOH_SITES, ...DOH_AREAS, ...DOH_CELLS].map((n) => n.id)
    expect(new Set(all).size).toBe(all.length)
    expect(cellsForArea(DOH_CELLS[0]?.areaId ?? '').length).toBeGreaterThan(0)
  })
})

/* ------------------------------------------------------------------ *
 * D25 and D21.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 fixtures — D25 the default Site, D21 the three flags', () => {
  it('D25: exactly one Site is the provisioning default, it is active, and it carries a renamed history', () => {
    const defaults = DOH_SITES.filter((s) => s.provisionedByDefault)
    expect(defaults).toHaveLength(1)
    const [only] = defaults
    expect(only).toBeDefined()
    if (!only) return
    expect(only.state).toBe('active')
    expect(only.provisionedName.trim().length).toBeGreaterThan(0)
    expect(only.name).not.toBe(only.provisionedName)
  })

  it('D21: active and archived are the only states, and the three lost states appear only as flags', () => {
    expect(LOCATION_NODE_STATES).toEqual(['active', 'archived'])
    expect([...LOCATION_NODE_FLAGS].sort()).toEqual(['archiving', 'scope-pending', 'unbound'])
    for (const node of [...DOH_SITES, ...DOH_AREAS, ...DOH_CELLS]) {
      expect(LOCATION_NODE_STATES).toContain(node.state)
      for (const flag of node.flags) expect(LOCATION_NODE_FLAGS, node.id).toContain(flag)
      // A flag lives on `active`; an archived node has finished its cascade.
      if (node.state === 'archived') expect(node.flags, node.id).toHaveLength(0)
    }
  })

  it('D21: every flag states its own consequence, and every flag is seeded on some node', () => {
    for (const flag of LOCATION_NODE_FLAGS) {
      const row = NODE_FLAG_CONSEQUENCES.find((c) => c.id === flag)
      expect(row, flag).toBeDefined()
      expect(row?.consequence.trim().length, flag).toBeGreaterThan(10)
      const seeded = [...SITES, ...AREAS, ...CELLS].some((n) => n.flags.includes(flag))
      expect(seeded, flag).toBe(true)
    }
  })
})

/* ------------------------------------------------------------------ *
 * The eleven-row control matrix. L10238: no blank cell anywhere.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 fixtures — the control matrix', () => {
  it('carries all eleven source rows, each with a status for all five tenant roles', () => {
    expect(CONTROL_MATRIX).toHaveLength(11)
    for (const row of CONTROL_MATRIX) {
      for (const role of [
        'TENANT_ADMIN',
        'SUPERVISOR',
        'QUALITY_MANAGER',
        'READONLY_AUDITOR',
        'WORKER',
      ] as const) {
        expect(CONTROL_STATUSES, `${row.id}/${role}`).toContain(row.status[role])
      }
      expect(row.control.trim().length, row.id).toBeGreaterThan(0)
      expect(row.rendering.trim().length, row.id).toBeGreaterThan(0)
      expect(row.effect.trim().length, row.id).toBeGreaterThan(0)
      expect(row.sourceRef.trim().length, row.id).toBeGreaterThan(0)
    }
  })

  it('holds the two rows every role is refused, and the one row refused by object state', () => {
    const allFive = CONTROL_MATRIX.filter((r) =>
      Object.values(r.status).every((s) => s === 'explicitly-prohibited' || s === 'not-applicable'),
    )
    // Split/merge/re-parent an Area, view a map, create an equipment record.
    expect(allFive.map((r) => r.id).sort()).toEqual(['CTL-05', 'CTL-10', 'CTL-11'])
    const reparent = CONTROL_MATRIX.find((r) => r.id === 'CTL-04')
    expect(reparent?.status.TENANT_ADMIN).toBe('allowed-with-conditions')
    expect(reparent?.rendering).toMatch(/disabled/i)
  })
})

/* ------------------------------------------------------------------ *
 * Scope is total, and it is computed from one place.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 fixtures — scope resolution', () => {
  it('scopes the Supervisor to a strict subset of Sites and Areas, and the Worker to none', () => {
    const sup = SEEDED_ROLE_SCOPES.SUPERVISOR
    expect(sup.scope).toBe('area')
    expect(sup.areaIds.length).toBeGreaterThan(0)
    expect(sup.areaIds.length).toBeLessThan(DOH_AREAS.length)
    expect(visibleSiteIds('SUPERVISOR').length).toBeLessThan(DOH_SITES.length)
    expect(visibleAreaIds('SUPERVISOR').length).toBe(sup.areaIds.length)
    expect(visibleSiteIds('WORKER')).toEqual([])
    expect(visibleAreaIds('WORKER')).toEqual([])
  })

  it('gives the Tenant Admin and the Auditor the whole tree, and the Quality Manager its own Sites', () => {
    expect(visibleSiteIds('TENANT_ADMIN')).toHaveLength(DOH_SITES.length)
    expect(visibleAreaIds('READONLY_AUDITOR')).toHaveLength(DOH_AREAS.length)
    const qm = visibleSiteIds('QUALITY_MANAGER')
    expect(qm.length).toBeGreaterThan(0)
    expect(qm.length).toBeLessThan(DOH_SITES.length)
    for (const areaId of visibleAreaIds('QUALITY_MANAGER')) {
      expect(qm, areaId).toContain(areaById(areaId)?.siteId)
    }
  })
})

/* ------------------------------------------------------------------ *
 * The cascade, and the support-not-surveillance rule.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 fixtures — the archival cascade record', () => {
  it('binds paused Jobs to a node with a two-value cascade state and at least one held archival', () => {
    expect([...CASCADE_STATES].sort()).toEqual(['cascade_complete', 'cascade_pending_reassignment'])
    expect(ARCHIVAL_CASCADES.length).toBeGreaterThan(0)
    const held = ARCHIVAL_CASCADES.filter((c) => c.state === 'cascade_pending_reassignment')
    expect(held.length).toBeGreaterThan(0)
    for (const cascade of ARCHIVAL_CASCADES) {
      expect(areaById(cascade.nodeId) ?? siteById(cascade.nodeId), cascade.nodeId).toBeDefined()
      if (cascade.state === 'cascade_pending_reassignment') {
        expect(cascade.pausedJobs.length, cascade.nodeId).toBeGreaterThan(0)
      }
    }
  })

  it('S10: no fixture keys a measure on a worker — the cascade keys on the node and the Job', () => {
    const serialised = JSON.stringify({ ARCHIVAL_CASCADES, DOH_SITES, DOH_AREAS, DOH_CELLS })
    expect(serialised).not.toMatch(/worker/i)
    expect(serialised).not.toMatch(/operator/i)
  })
})

/* ------------------------------------------------------------------ *
 * D22, and the two honesty panels.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 fixtures — D22 certifications and the honesty panels', () => {
  it('D22: certification types are a seeded list, every gate input resolves to one of them', () => {
    expect(SEEDED_CERTIFICATION_TYPES.length).toBeGreaterThan(0)
    const ids = new Set(SEEDED_CERTIFICATION_TYPES.map((c) => c.id))
    for (const node of [...DOH_AREAS, ...DOH_CELLS]) {
      if (node.requiredCertificationId !== null) {
        expect(ids.has(node.requiredCertificationId), node.id).toBe(true)
      }
    }
    expect(DOH_AREAS.some((a) => a.requiredCertificationId !== null)).toBe(true)
  })

  it('names Cell scoping, the certification blocker and the map deferral without inventing a control', () => {
    const all = [...UNSPECIFIED_IN_SOURCE, ...UNRESOLVED_IN_SOURCE].join(' ')
    expect(all).toMatch(/Cell/)
    expect(all).toMatch(/certification type/i)
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(3)
    expect(UNRESOLVED_IN_SOURCE.length).toBeGreaterThan(2)
    for (const item of [...UNSPECIFIED_IN_SOURCE, ...UNRESOLVED_IN_SOURCE]) {
      expect(item.trim().length).toBeGreaterThan(40)
    }
  })
})

/* ------------------------------------------------------------------ *
 * The two gates that are cheapest to break and cheapest to check.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 source files — determinism and D1', () => {
  it('reads no clock and no randomness anywhere in this module', () => {
    for (const file of MY_FILES) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toMatch(/Date\.now|new Date\(|Math\.random/)
    }
  })

  it('D1: writes no three-digit SCR-DOH literal anywhere in this module, and annotates the two-digit one', () => {
    for (const file of MY_FILES) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/SCR-DOH-\d{3}/)
    }
    expect(
      readFileSync('app/hub/location-configuration/LocationConfigurationScreen.tsx', 'utf8'),
    ).toMatch(/SCR-DOH-04/)
  })
})

/**
 * THE CROSS-CHECK. Same case as `tests/unit/doh-tenant-lifecycle.test.ts`
 * carries, adapted to this matrix's own spelling of a cell: the module rail
 * reads one field, `rolesReaching` on this module's definition in
 * `@/surfaces/doh/modules`, while this screen renders its own matrix, and the
 * two must not drift.
 *
 * The rule: the roles the spine withholds the route from are exactly the roles
 * this matrix marks `unavailable` — "cannot hold this in any scope", so the
 * route renders ABSENT and the rail does not offer it. `explicitly-prohibited`
 * is deliberately NOT that token: the control exists on this screen for another
 * role, so the refused role opens the screen and reads why.
 */
describe('MOD-DOH-02 — the rail and this matrix agree about who reaches the module', () => {
  it('withholds the route from exactly the roles the matrix marks unavailable', () => {
    const tenantRoles = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]
    // Guards the narrowing above, and proves the sweep below covers all five.
    expect(Object.keys(CONTROL_MATRIX[0]!.status).sort()).toEqual([...tenantRoles].sort())

    const withheldByTheMatrix = tenantRoles.filter((role) =>
      CONTROL_MATRIX.some((row) => row.status[role] === 'unavailable'),
    )
    const withheldByTheSpine = tenantRoles.filter(
      (role) => !dohModuleById('MOD-DOH-02').rolesReaching.includes(role),
    )

    expect([...withheldByTheSpine].sort()).toEqual([...withheldByTheMatrix].sort())
    // Not vacuous: the Worker is withheld, and is the only one.
    expect(withheldByTheMatrix).toEqual(['WORKER'])
  })
})
