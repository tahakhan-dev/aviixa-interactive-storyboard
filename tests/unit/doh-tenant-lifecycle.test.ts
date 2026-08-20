import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { namesPersonBehaviouralMeasure } from '../coverage/person-measure-keys'
import { stripComments } from '../coverage/strip-comments'
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
  UNRESOLVED_IN_SOURCE,
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
 * THE MODULE'S OWN SOURCE FILES, ENUMERATED FROM THE DIRECTORY rather than
 * named by hand. Slice 4 gate 3 (`tests/coverage/slice-04-gates.test.ts`)
 * found this suite scanning NOTHING at all — no determinism gate, no
 * three-digit `SCR-DOH` gate — the same defect shape `doh-workers.test.ts`
 * shipped with a hardcoded `MY_FILES`, one level worse: there was no list to
 * fall behind, because there was no gate. A directory walk means a fourth
 * file this module grows is covered the moment it exists.
 */
const MODULE_DIR = 'app/hub/tenant-lifecycle-and-tier-operations'

function moduleSources(): { file: string; src: string }[] {
  return readdirSync(MODULE_DIR)
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => `${MODULE_DIR}/${f}`)
    // Stripped, not raw: this module's own fixtures.ts carries a doc comment
    // NAMING `Date.now()`, `new Date()` and `Math.random()` in order to deny
    // them, and a gate over raw source text would fail on correct code today
    // — the exact hazard `stripComments` exists for (see its own doc
    // comment, and `hubSources()` in `tests/coverage/slice-04-gates.test.ts`).
    .map((file) => ({ file, src: stripComments(readFileSync(file, 'utf8')) }))
}

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

  it('moves only the ceiling up a tier, and keeps no per-tier count a change could reset to', () => {
    const before = tierRecord(SEEDED_TIER).ceiling
    const after = tierRecord(UPGRADE_TARGET_TIER).ceiling
    expect(after).toBeGreaterThan(before)
    // AC-DOH-01-2's structural half: consumption is ONE module-level figure,
    // so a tier record holds nothing a tier change could swap in for it. The
    // behavioural half — that the screen still shows the same figure after an
    // upgrade — is asserted against the rendered screen, in
    // `tests/component/doh-tenant-lifecycle.test.tsx`. `SEEDED_CONSUMPTION`
    // is not asserted here: pinning a constant to its own literal proves
    // nothing about carry-forward.
    for (const record of TIER_RECORDS) {
      expect(Object.keys(record).filter((k) => /consum|used|count/i.test(k))).toEqual([])
    }
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

/**
 * THE CONTENTS OF `ACTING_STATUSES` AND `READING_STATUSES`, AND NOTHING MORE.
 *
 * Read the claim carefully, because an earlier version of this block claimed
 * more than it delivers. The bug these two constants were fixed for was a
 * TYPE ANNOTATION: `: readonly MatrixStatus[]` widened them to the whole
 * six-token union, so `'Unavailable'` typechecked as an acting or reading
 * status and four `TS2345` errors fell out of `decide()`'s narrower
 * parameter. An annotation is erased at runtime. Re-add it and every
 * assertion below stays green while all four errors come back.
 *
 * `pnpm typecheck` — `tsc --noEmit` — IS THE GUARD for that bug, and it is
 * the only guard for it. What these two cases pin is the constants' contents:
 * that nobody adds a prohibition token to either list, and that the acting
 * pair and reading triple stay the sets the matrix actually uses. That is
 * worth having and it is a real check; it is not coverage of the annotation,
 * and calling it that would teach the next reader that a green unit suite
 * means the type is safe.
 */
describe('acting and reading carry the contents the matrix uses (tsc guards the type)', () => {
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
  /**
   * RESCOPED. This case used to run a raw `/worker/i` substring test over
   * three fixture arrays — the same shape of gate `tests/coverage/person-
   * measure-keys.ts` replaced everywhere else in this build after it refused
   * `accountState` for containing `count`. It now calls the shared matcher,
   * and it widens to `CONTROL_MATRIX`'s own top-level keys alongside the
   * three record arrays, matching the shape `doh-workers.test.ts` and
   * `doh-platform-admin.test.ts` use for the same gate.
   */
  it('keys no behavioural measure on a person anywhere in this module’s fixtures', () => {
    const rows: readonly object[] = [...SITE_COUNT, ...TENANT_STATE_HISTORY, ...TIER_RECORDS, ...CONTROL_MATRIX]
    // Not vacuous: these are records the module genuinely keeps, which is the
    // half of the question the matcher does not answer for itself.
    expect(rows.length).toBeGreaterThan(10)
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        expect(namesPersonBehaviouralMeasure(key), key).toBe(false)
      }
    }
    // The matcher is live rather than asleep on this record shape.
    expect(namesPersonBehaviouralMeasure('workerRanking')).toBe(true)
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

/**
 * THE POINTER THIS SCREEN MAKES AT ITS OWN UNRESOLVED PANEL.
 *
 * The absence note shown to every role but the Tenant Admin says the
 * competing reading — that this control should render disabled with its
 * reason, the way the Tenant Admin's own copy of it does, rather than absent
 * — "is recorded in the unresolved panel". That is a claim about the build.
 * The iterate-the-array pattern this file's other checks use is structurally
 * incapable of noticing that entry going missing: delete it and the panel
 * just renders one fewer item, still green, while the screen's sentence
 * quietly becomes a lie. This names the entry the pointer needs, so deleting
 * it reds a test instead of re-breaking a pointer — the exact shape of
 * defect MOD-DOH-03 shipped and fixed in this same panel.
 */
describe('MOD-DOH-01 — the pointer this screen makes at Unresolved in source', () => {
  it('resolves the upgrade-absence note’s pointer onto a real Unresolved-in-source entry', () => {
    expect(UNRESOLVED_IN_SOURCE.length).toBeGreaterThan(0)
    expect(UNRESOLVED_IN_SOURCE.some((i) => /disabled with its reason/i.test(i))).toBe(true)
  })
})

/**
 * ADDED. Slice gate 3 measured this suite at zero `readFileSync` calls: no
 * determinism gate and no three-digit `SCR-DOH` gate existed anywhere in it,
 * for either of the module's two source files. Both gates are new here, and
 * both read the DIRECTORY rather than a hand-typed pair of paths, so a third
 * file this module grows is covered without anyone remembering to add it.
 */
describe('MOD-DOH-01 source files — determinism and the three-digit SCR-DOH literal', () => {
  it('reads no clock and no randomness anywhere in this module', () => {
    for (const { file, src } of moduleSources()) {
      expect(src, file).not.toMatch(/Date\.now|new Date\(|Math\.random/)
    }
  })

  it('writes no three-digit SCR-DOH literal anywhere in this module', () => {
    for (const { file, src } of moduleSources()) {
      expect(src, file).not.toMatch(/SCR-DOH-\d{3}/)
    }
  })
})
