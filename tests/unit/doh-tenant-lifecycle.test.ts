import { describe, it, expect } from 'vitest'
import {
  ACTING_STATUSES,
  CONTROL_MATRIX,
  LADDER_POSITIONS,
  LADDER_THRESHOLDS,
  READING_STATUSES,
  SEEDED_CONSUMPTION,
  SEEDED_TIER,
  SITE_COUNT,
  TENANT_STATE_HISTORY,
  TIER_RECORDS,
  UPGRADE_TARGET_TIER,
  ladderPositionFor,
  rolesWithStatus,
  tierRecord,
} from '../../app/hub/tenant-lifecycle-and-tier-operations/fixtures'
import { TENANT_STATES } from '@/surfaces/doh/tenant-state'
import { dohModuleById } from '@/surfaces/doh/modules'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../app/hub/HubShell'

/**
 * MOD-DOH-01's only pure logic: a percentage becomes one of four ladder
 * positions. The boundaries are where it can silently go wrong — "at the
 * ceiling" reading as under it rather than as the first point inside the
 * burst band is a one-character mistake with a commercial consequence.
 */
describe('ladderPositionFor', () => {
  it('is inclusive at every threshold', () => {
    expect(ladderPositionFor(79.9)).toBe('below_80')
    expect(ladderPositionFor(80)).toBe('at_or_above_80')
    expect(ladderPositionFor(99.9)).toBe('at_or_above_80')
    expect(ladderPositionFor(100)).toBe('at_or_above_100_burst')
    expect(ladderPositionFor(124.9)).toBe('at_or_above_100_burst')
    expect(ladderPositionFor(125)).toBe('above_125_flagged')
  })

  it('covers nothing but the four positions the object carries, and reaches all four', () => {
    const reached = new Set([0, 80, 100, 125, 400].map(ladderPositionFor))
    expect([...reached].sort()).toEqual([...LADDER_POSITIONS].sort())
  })

  it('puts a zero consumption below the first threshold rather than off the ladder', () => {
    expect(ladderPositionFor(0)).toBe('below_80')
  })

  it('agrees with the three marked thresholds, so the bar and the label cannot disagree', () => {
    for (const threshold of LADDER_THRESHOLDS) {
      expect(ladderPositionFor(threshold.percent)).not.toBe(
        ladderPositionFor(threshold.percent - 0.1),
      )
    }
  })
})

describe('the seeded tier and consumption fixture', () => {
  it('sits above the first threshold and inside no burst band, so the screen shows a live position', () => {
    const percent = (SEEDED_CONSUMPTION / tierRecord(SEEDED_TIER).ceiling) * 100
    expect(ladderPositionFor(percent)).toBe('at_or_above_80')
  })

  it('leaves consumption unchanged and only the ceiling moved by an upgrade', () => {
    const before = tierRecord(SEEDED_TIER).ceiling
    const after = tierRecord(UPGRADE_TARGET_TIER).ceiling
    expect(after).toBeGreaterThan(before)
    // AC-DOH-01-2: the count carries forward. There is one seeded count and
    // no per-tier variant of it, so it cannot be reset by a tier change.
    expect(SEEDED_CONSUMPTION).toBe(512)
  })

  it('quotes one meter definition, identical across every tier record', () => {
    const definitions = new Set(TIER_RECORDS.map((t) => t.meterDefinition))
    expect(definitions.size).toBe(1)
  })
})

describe('the twelve-row control matrix', () => {
  it('carries twelve rows with a distinct id and control name each', () => {
    expect(CONTROL_MATRIX).toHaveLength(12)
    expect(new Set(CONTROL_MATRIX.map((r) => r.id)).size).toBe(12)
    expect(new Set(CONTROL_MATRIX.map((r) => r.control)).size).toBe(12)
  })

  it('declares an explicit status and a non-empty detail in all sixty cells', () => {
    for (const row of CONTROL_MATRIX) {
      const cells = Object.values(row.byRole)
      expect(cells).toHaveLength(5)
      for (const cell of cells) {
        expect(cell.status.length).toBeGreaterThan(0)
        expect(cell.detail.length).toBeGreaterThan(0)
      }
    }
  })

  it('derives the acting roles from the matrix, and gives the two writes to the Tenant Admin alone', () => {
    for (const id of ['request-tier-upgrade', 'request-tier-downgrade'] as const) {
      expect(rolesWithStatus(id, ['Allowed', 'Allowed with conditions'])).toEqual(['TENANT_ADMIN'])
    }
  })

  it('gives the read to the Tenant Admin and the Auditor, and to nobody else', () => {
    expect(rolesWithStatus('view-tier-and-consumption', ['Read-only', 'Allowed'])).toEqual([
      'TENANT_ADMIN',
      'READONLY_AUDITOR',
    ])
  })

  it('leaves the four prohibited-for-all rows with no acting role at all', () => {
    for (const id of [
      'execute-downgrade',
      'change-suspension-state',
      'change-ladder-thresholds',
      'view-tenant-group-membership',
    ] as const) {
      expect(rolesWithStatus(id, ['Allowed', 'Allowed with conditions', 'Read-only'])).toEqual([])
    }
  })
})

describe('acting and reading are their own closed sets, never the full status union', () => {
  // The four type errors this file was written to close were all the same
  // bug: `ACTING_STATUSES`/`READING_STATUSES` were annotated as the full
  // `readonly MatrixStatus[]` union, which typechecks 'Unavailable' as an
  // acting or reading status even though no row of the matrix ever grants
  // either to a role holding it. 'Unavailable' (and the other prohibition
  // tokens) are not legitimate members of either set — the annotation was
  // just wider than the data. This test locks the narrower, true sets in at
  // runtime, so a future re-widening of the type fails a real assertion
  // rather than only a compiler diagnostic someone could paper over.
  it('never carries a prohibition token', () => {
    const prohibitionTokens = ['Unavailable', 'Explicitly prohibited', 'Not applicable'] as const
    for (const status of [...ACTING_STATUSES, ...READING_STATUSES]) {
      expect(prohibitionTokens).not.toContain(status)
    }
  })

  it('is exactly the acting pair and the reading triple the matrix actually uses', () => {
    expect([...ACTING_STATUSES].sort()).toEqual(['Allowed', 'Allowed with conditions'].sort())
    expect([...READING_STATUSES].sort()).toEqual(
      ['Allowed', 'Allowed with conditions', 'Read-only'].sort(),
    )
  })
})

describe('support-not-surveillance, held in the fixture shape itself', () => {
  it('keys no fixture row on a worker identifier', () => {
    const keys = [
      ...SITE_COUNT.flatMap((s) => Object.keys(s)),
      ...TENANT_STATE_HISTORY.flatMap((h) => Object.keys(h)),
      ...TIER_RECORDS.flatMap((t) => Object.keys(t)),
    ]
    expect(keys.filter((k) => /worker/i.test(k))).toEqual([])
  })

  it('records every state transition against a team or a trigger, never a person', () => {
    for (const row of TENANT_STATE_HISTORY) {
      expect(row.actor).toMatch(/client platform team|automatic trigger/i)
    }
  })

  it('names only states the Hub can render, and no platform-console-only state as a destination', () => {
    const operating: readonly string[] = TENANT_STATES
    for (const row of TENANT_STATE_HISTORY) {
      expect(operating).toContain(row.to)
    }
  })
})

/**
 * THE CROSS-CHECK. The module rail reads ONE field — `rolesReaching` on this
 * module's definition in `@/surfaces/doh/modules` — while this screen renders
 * its own permission matrix. Two copies of one rule is the drift this build
 * keeps paying for, so this case asserts the two agree.
 *
 * The rule, one sentence: the roles the spine withholds the route from are
 * exactly the roles this matrix marks `Unavailable`. That token's own meaning
 * is "cannot hold this in any scope", so by the prohibition-rendering rule it
 * renders ABSENT and the rail does not offer the route. `Explicitly
 * prohibited` is deliberately NOT that token — the control exists on this
 * screen for another role, so the refused role opens the screen and reads why
 * — and the two are never merged (L10238).
 *
 * Every module suite carries this case, adapted only to how its own matrix
 * spells a cell. The five modules not yet built inherit the pattern.
 */
describe('MOD-DOH-01 — the rail and this matrix agree about who reaches the module', () => {
  it('withholds the route from exactly the roles the matrix marks Unavailable', () => {
    const tenantRoles = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]
    // Guards the narrowing above, and proves the sweep below covers all five.
    expect(Object.keys(CONTROL_MATRIX[0]!.byRole).sort()).toEqual([...tenantRoles].sort())

    const withheldByTheMatrix = tenantRoles.filter((role) =>
      CONTROL_MATRIX.some((row) => row.byRole[role].status === 'Unavailable'),
    )
    const withheldByTheSpine = tenantRoles.filter(
      (role) => !dohModuleById('MOD-DOH-01').rolesReaching.includes(role),
    )

    expect([...withheldByTheSpine].sort()).toEqual([...withheldByTheMatrix].sort())
    // Not vacuous: this module is withheld from three of the five.
    expect(withheldByTheMatrix).toHaveLength(3)
  })
})
