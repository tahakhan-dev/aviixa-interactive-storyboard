import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { stripComments } from '../coverage/strip-comments'
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
import { BARE_PROHIBITION, dohModuleById } from '@/surfaces/doh/modules'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../app/hub/HubShell'

/** Widened views of the seeded tuples: `as const` narrows each node's `flags`
 *  to its own empty or one-member tuple, which makes `.includes` uncallable
 *  with a plain flag. The screen gets the same widening from `useState`. */
const SITES: readonly LocationSite[] = DOH_SITES
const AREAS: readonly LocationArea[] = DOH_AREAS
const CELLS: readonly LocationCell[] = DOH_CELLS

/**
 * THE MODULE'S OWN SOURCE FILES, ENUMERATED FROM THE DIRECTORY rather than
 * named by hand. `MY_FILES` was a hardcoded three-path list, and this module's
 * determinism gate and its three-digit `SCR-DOH` gate lived only inside it —
 * so a fourth file this module grew would have escaped both while the suite
 * stayed green. That is the defect slice 4 gate 3 exists to catch, and gate
 * 3 could not see it: its assertion checks that a hand-named path still
 * EXISTS, which says nothing about the list existing at all.
 *
 * A directory walk means a fourth file is covered the moment it exists.
 * Gate 3 now re-applies BOTH constraints slice-wide from the directory as
 * well, so this suite is the module-level half of a rule that no longer
 * depends on any one suite remembering it.
 */
const MODULE_DIR = 'app/hub/location-configuration'

function moduleSources(): { file: string; src: string }[] {
  return readdirSync(MODULE_DIR)
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => `${MODULE_DIR}/${f}`)
    // Stripped, not raw: a source file that NAMES `Date.now()` in order to
    // deny it is correct code, and a gate over raw text fails on it — the
    // exact hazard `stripComments` exists for.
    .map((file) => ({ file, src: stripComments(readFileSync(file, 'utf8')) }))
}

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
  it('walks the module directory, so a fourth file cannot escape the two gates below', () => {
    // Non-vacuity. Both gates below iterate this walk, and an empty walk
    // passes both — which is the hand list's defect wearing a directory.
    const files = moduleSources().map((s) => s.file)
    expect(files.length).toBeGreaterThan(2)
    expect(files).toContain(`${MODULE_DIR}/fixtures.ts`)
    expect(files).toContain(`${MODULE_DIR}/LocationConfigurationScreen.tsx`)
  })

  it('reads no clock and no randomness anywhere in this module', () => {
    for (const { file, src } of moduleSources()) {
      expect(src, file).not.toMatch(/Date\.now|new Date\(|Math\.random/)
    }
  })

  it('D1: writes no three-digit SCR-DOH literal anywhere in this module, and annotates the two-digit one', () => {
    for (const { file, src } of moduleSources()) {
      expect(src, file).not.toMatch(/SCR-DOH-\d{3}/)
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

/* ------------------------------------------------------------------ *
 * THE CITATION GATE. Every `sourceRef` from CTL-05 through CTL-11 was
 * exactly one row low, so each named its NEIGHBOUR inside the same frozen
 * table -- `CTL-06 Archive a Site or an Area` cited L27121, which holds
 * "Split, merge or re-parent an Area", and `CTL-11 Create an equipment
 * record` cited L27126, which holds "View a map of locations". The row's
 * own `detail` cells were right the whole time, so the fixture disagreed
 * with itself and the screen printed the wrong half.
 *
 * Nothing could fail: the only assertion over `sourceRef` in this suite was
 * `.length > 0`, which a wrong line number passes. This is the gate. The
 * eleven matrix rows are consecutive at L27117-L27127 in the frozen source,
 * verified line by line, so the mapping below is checkable arithmetic
 * rather than a copy of the fixture.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 — every control cites its own row of the frozen matrix table', () => {
  /** L27117 + n for the nth row. Read at source, row by row. */
  const MATRIX_LINE: Readonly<Record<string, string>> = Object.fromEntries(
    CONTROL_MATRIX.map((row, i) => [row.id, `L${27117 + i}`]),
  )

  it('is the eleven consecutive rows L27117-L27127, in source order', () => {
    expect(CONTROL_MATRIX.map((r) => r.id)).toEqual([
      'CTL-01', 'CTL-02', 'CTL-03', 'CTL-04', 'CTL-05', 'CTL-06',
      'CTL-07', 'CTL-08', 'CTL-09', 'CTL-10', 'CTL-11',
    ])
    expect(MATRIX_LINE['CTL-01']).toBe('L27117')
    expect(MATRIX_LINE['CTL-11']).toBe('L27127')
  })

  it('names its own matrix line in `sourceRef`, with CTL-04 the one declared exception', () => {
    for (const row of CONTROL_MATRIX) {
      if (row.id === 'CTL-04') {
        // CTL-04 deliberately cites the alternate-path prose that states the
        // in-flight-Jobs refusal (L27149) and the function entry (L27185),
        // because the refusal it renders is object state and not the matrix
        // cell. Asserted, so the exception cannot quietly become a twelfth.
        expect(row.sourceRef).toBe('L27149, L27185')
        continue
      }
      expect(row.sourceRef, row.id).toContain(MATRIX_LINE[row.id])
    }
  })

  it('agrees with its own Tenant Admin detail cell — the half of the row that was right', () => {
    for (const row of CONTROL_MATRIX) {
      expect(row.detail.TENANT_ADMIN, row.id).toContain(MATRIX_LINE[row.id])
    }
  })

  it('cites no line that is blank in the frozen source', () => {
    // Lines 27204 and 27214 are both empty at the frozen source: L27203 is
    // the artificial-intelligence paragraph and L27215 is the Security
    // paragraph, and each citation sat one line off its own sentence. A
    // citation at a blank line points a reader at nothing. The two bad numbers
    // are written here WITHOUT the citation prefix on purpose -- naming a
    // blank line is not citing one, and tests/coverage/locator-fidelity.test.ts
    // reads every citation in this tree as a claim.
    // RAW, not `moduleSources()`: two of the four bad citations lived in doc
    // comments, which `stripComments` removes. A citation is a claim wherever
    // it is written.
    const raw = readdirSync(MODULE_DIR)
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => ({ file: `${MODULE_DIR}/${f}`, text: readFileSync(`${MODULE_DIR}/${f}`, 'utf8') }))
    expect(raw.length).toBeGreaterThan(1)
    for (const { file, text } of raw) {
      expect(text, file).not.toMatch(/L27204/)
      expect(text, file).not.toMatch(/L27214/)
    }
    // Not vacuous: the lines they were corrected TO are cited in the module.
    const all = raw.map((r) => r.text).join('\n')
    expect(all).toMatch(/L27203/)
    expect(all).toMatch(/L27215/)
  })
})

/* ------------------------------------------------------------------ *
 * ONE OWNER for the bare-prohibition wording. It was hand-written three
 * times, in three near-identical wordings, across three module fixtures --
 * the same drift `DohControlMatrixRow` was hoisted to end, missed because
 * no single-module review sees two copies. Two of the three said "none of
 * the four non-admin roles", which is false in MOD-DOH-04, where the Tenant
 * Admin's own cell carries the token on three rows.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 — the bare-prohibition cell has one owner', () => {
  it('fills every bare cell from the shared constant rather than a local copy', () => {
    const bare = CONTROL_MATRIX.flatMap((row) =>
      Object.values(row.detail).filter((d) => d === BARE_PROHIBITION),
    )
    expect(bare.length).toBeGreaterThan(10)
    expect(BARE_PROHIBITION).toContain('UNSPECIFIED_IN_SOURCE')
  })

  it('is worded for any role, so a Tenant Admin cell carrying it stays true', () => {
    expect(BARE_PROHIBITION).not.toMatch(/non-admin/i)
  })

  it('is declared in no module fixture — three copies are how the wordings drifted', () => {
    for (const file of [
      'app/hub/location-configuration/fixtures.ts',
      'app/hub/shift-management/fixtures.ts',
      'app/hub/worker-lifecycle-and-qualifications/fixtures.ts',
    ]) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/const BARE_PROHIBITION\s*=/)
    }
  })
})
