import { describe, it, expect } from 'vitest'
import { SA_MODULES, SA_BANDS, saModuleById, modulesInBand, type SaModuleId } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { CRITICAL_ACTIONS, CRITICAL_ACTION_COUNT_NOTE } from '@/surfaces/sa/critical-actions'

describe('SA_MODULES — the nineteen-module registry', () => {
  it('carries exactly nineteen modules across two bands, seven and twelve', () => {
    expect(SA_MODULES).toHaveLength(19)
    const a = SA_MODULES.filter((m) => m.band === 'definition')
    const b = SA_MODULES.filter((m) => m.band === 'operations')
    expect(a).toHaveLength(7)
    expect(b).toHaveLength(12)
    expect(SA_BANDS).toHaveLength(2)
  })

  it('never mints MOD-SA-20 — it is an alias-by-denial, not a module', () => {
    expect(SA_MODULES.map((m) => m.id)).not.toContain('MOD-SA-20')
  })

  it('states both bands are V1, so the split carries no acceptance meaning', () => {
    for (const b of SA_BANDS) expect(b.v1).toBe(true)
  })

  it('gives every module a unique slug, never a bare SCR-SA-NN number', () => {
    const slugs = SA_MODULES.map((m) => m.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) {
      expect(s).not.toMatch(/^SCR-SA-\d+$/i)
      expect(s).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('names every module from the canonical list, MOD-SA-01 through MOD-SA-19 in order', () => {
    expect(SA_MODULES.map((m) => m.id)).toEqual([
      'MOD-SA-01', 'MOD-SA-02', 'MOD-SA-03', 'MOD-SA-04', 'MOD-SA-05',
      'MOD-SA-06', 'MOD-SA-07', 'MOD-SA-08', 'MOD-SA-09', 'MOD-SA-10',
      'MOD-SA-11', 'MOD-SA-12', 'MOD-SA-13', 'MOD-SA-14', 'MOD-SA-15',
      'MOD-SA-16', 'MOD-SA-17', 'MOD-SA-18', 'MOD-SA-19',
    ])
  })

  it('resolves a module by id and lists modules in a band', () => {
    expect(saModuleById('MOD-SA-01' as SaModuleId).name).toBe(
      'Platform Overview and Health',
    )
    expect(modulesInBand('definition')).toHaveLength(7)
    expect(modulesInBand('operations')).toHaveLength(12)
  })
})

describe('SA_INVARIANTS — the six ENFORCED invariants', () => {
  it('is closed at six', () => {
    expect(SA_INVARIANTS).toHaveLength(6)
  })

  it('names the six from the frozen source, L2143', () => {
    expect(SA_INVARIANTS.map((i) => i.id).sort()).toEqual(
      [
        'cross-tenant-analytics-anonymisation',
        'encryption-at-rest',
        'encryption-in-transit',
        'evaluation-gate',
        'one-transaction-audit-guarantee',
        'sandbox-before-publish',
      ].sort(),
    )
  })
})

describe('COMMAND_STATES — the fifteen device command states, ordered', () => {
  it('is closed at fifteen, in the exact source order (L42846)', () => {
    expect(COMMAND_STATES).toEqual([
      'created', 'authorised', 'queued', 'available for delivery', 'delivered',
      'downloaded', 'validated', 'applied', 'acknowledged', 'rejected',
      'failed', 'expired', 'cancelled', 'superseded', 'reconciled',
    ])
  })
})

describe('ACCESS_CLASSES — the three named access classes', () => {
  it('is closed at three', () => {
    expect(ACCESS_CLASSES).toHaveLength(3)
  })

  it('names the normal support session, the compliance-emergency path and the JBS access grant', () => {
    expect(ACCESS_CLASSES.map((c) => c.id).sort()).toEqual(
      ['compliance-emergency-path', 'jbs-access-grant', 'normal-support-session'].sort(),
    )
  })
})

describe('CRITICAL_ACTIONS — D12: the source says ten, enumerates eleven', () => {
  it('carries all eleven the source actually enumerates at L55942, not a padded or truncated count', () => {
    expect(CRITICAL_ACTIONS).toHaveLength(11)
  })

  it('records the ten-vs-eleven discrepancy rather than resolving it silently', () => {
    expect(CRITICAL_ACTION_COUNT_NOTE).toMatch(/eleven/i)
    expect(CRITICAL_ACTION_COUNT_NOTE).toMatch(/ten/i)
  })

  it('names every one of the eleven distinctly, with pause and resume kept separate', () => {
    expect(CRITICAL_ACTIONS.map((a) => a.id)).toEqual([
      'tier-publication',
      'compliance-suspension',
      'all-tenant-broadcast',
      'device-wipe',
      'emergency-pause',
      'emergency-resume',
      'erasure-and-archival-execution',
      'retention-value-changes',
      'legal-hold-place-and-release',
      'severity-catalog-changes',
      'floor-register-changes',
    ])
  })
})
