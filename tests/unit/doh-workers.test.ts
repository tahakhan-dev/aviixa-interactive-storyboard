import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { namesPersonBehaviouralMeasure } from '../coverage/person-measure-keys'
import {
  ABSENT_BY_RULE,
  ACTING_STATUSES,
  CLEARANCE_STATES,
  CONTROL_MATRIX,
  CONTROL_STATUSES,
  DECISIONS_ON_SCREEN,
  DOH_CLEARANCES,
  DOH_QUALIFICATIONS,
  DOH_WORKERS,
  EARLIEST_MANDATORY_STAGE,
  ESCALATION_KEY,
  ESCALATION_TARGET_ROLE,
  EXPIRED_BANNER_COPY,
  GATE_POSTURES,
  GATE_POSTURE_FLOOR,
  INSTRUCTION_DIFFICULTIES,
  MANDATORY_EXPIRY_LADDER,
  MEASURE_RULES,
  ON_SHIFT_ROLE_COVERAGE,
  QUALIFICATION_CHIPS,
  QUALIFICATION_CHIP_LABEL,
  QUALIFICATION_STATES,
  READING_STATUSES,
  REGISTER_AS_OF,
  RECORD_REGIONS,
  SEEDED_IMPORT_FILES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  WORKER_STATES,
  addEarlierWarningStage,
  chipFor,
  clearanceIsEffective,
  clearancesVisibleTo,
  clearancesOn,
  effectiveClearanceFor,
  entryIsLate,
  isLadderRefusal,
  ladderHonoursTheMandatoryStages,
  qualificationStateFor,
  qualificationsFor,
  recertificationRefusal,
  resolveEscalation,
  rolesWithStatus,
  secondClearanceRoutesToQualityManager,
  statusFor,
  workerAreaIds,
  workerById,
  workersVisibleTo,
  type Clearance,
  type ControlMatrixRow,
  type ImportFile,
  type Qualification,
  type Worker,
} from '../../app/hub/worker-lifecycle-and-qualifications/fixtures'
import {
  DOH_AREAS,
  SEEDED_CERTIFICATION_TYPES,
  areaById,
} from '../../app/hub/location-configuration/fixtures'
import { DOH_SHIFTS } from '../../app/hub/shift-management/fixtures'
import { TENANT_STATES, writeAllowed } from '@/surfaces/doh/tenant-state'
import { dohModuleById } from '@/surfaces/doh/modules'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../app/hub/HubShell'

/** Widened views of the seeded tuples. `as const` narrows every array member
 *  to its own literal tuple, which makes `.includes` uncallable with a plain
 *  string; the screen gets the same widening from `useState`. */
const WORKERS: readonly Worker[] = DOH_WORKERS
const QUALIFICATIONS: readonly Qualification[] = DOH_QUALIFICATIONS
const CLEARANCES: readonly Clearance[] = DOH_CLEARANCES
const IMPORT_FILES: readonly ImportFile[] = SEEDED_IMPORT_FILES

/**
 * Widened, and deliberately so. `CONTROL_MATRIX` is `as const satisfies`, so
 * every cell is narrowed to the literal it actually holds — which means the
 * COMPILER already refuses some of the comparisons the cross-check below has
 * to make at runtime against the spine. A check that cannot be written is not
 * a check, so this reads the matrix through its declared type.
 */
const MATRIX: readonly ControlMatrixRow[] = CONTROL_MATRIX

const MY_FILES = [
  'app/hub/worker-lifecycle-and-qualifications/fixtures.ts',
  'app/hub/worker-lifecycle-and-qualifications/WorkerLifecycleScreen.tsx',
  'app/hub/worker-lifecycle-and-qualifications/page.tsx',
]

/* ------------------------------------------------------------------ *
 * THE 14/7/1/0 LADDER. The direction is the whole point: a tenant may
 * add EARLIER stages and may never remove or delay one. Both halves
 * are proved, because a function that accepts everything and a
 * function that accepts nothing both pass a one-directional test.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the expiry ladder may gain earlier stages and never later ones', () => {
  it('carries exactly the four mandatory stages, strictly descending', () => {
    expect([...MANDATORY_EXPIRY_LADDER]).toEqual([14, 7, 1, 0])
    for (let i = 1; i < MANDATORY_EXPIRY_LADDER.length; i += 1) {
      expect(MANDATORY_EXPIRY_LADDER[i]! < MANDATORY_EXPIRY_LADDER[i - 1]!).toBe(true)
    }
    expect(EARLIEST_MANDATORY_STAGE).toBe(14)
  })

  it('accepts a stage EARLIER than the platform ladder and returns a strict superset', () => {
    const result = addEarlierWarningStage(30, [...MANDATORY_EXPIRY_LADDER])
    expect(isLadderRefusal(result)).toBe(false)
    if (isLadderRefusal(result)) return
    expect([...result]).toEqual([30, 14, 7, 1, 0])
    expect(ladderHonoursTheMandatoryStages(result)).toBe(true)
  })

  it('REFUSES every stage that is not earlier — the direction, not merely a range', () => {
    // 3 days would sit INSIDE the mandatory four: an addition to look at, a
    // delay in effect. 14 is the ladder's own first rung. 0 is its last.
    for (const days of [14, 13, 7, 3, 1, 0]) {
      const result = addEarlierWarningStage(days, [...MANDATORY_EXPIRY_LADDER])
      expect(isLadderRefusal(result), String(days)).toBe(true)
      if (!isLadderRefusal(result)) continue
      expect(result.refused, String(days)).toMatch(/never remove or delay/i)
    }
  })

  it('refuses a fraction, a negative and a duplicate rather than coercing any of them', () => {
    for (const bad of [1.5, -7, Number.NaN]) {
      expect(isLadderRefusal(addEarlierWarningStage(bad, [...MANDATORY_EXPIRY_LADDER])), String(bad)).toBe(true)
    }
    const once = addEarlierWarningStage(30, [...MANDATORY_EXPIRY_LADDER])
    expect(isLadderRefusal(once)).toBe(false)
    if (isLadderRefusal(once)) return
    expect(isLadderRefusal(addEarlierWarningStage(30, once))).toBe(true)
  })

  it('can never produce a ladder missing a mandatory stage, however many are added', () => {
    let ladder: readonly number[] = [...MANDATORY_EXPIRY_LADDER]
    for (const days of [21, 30, 60, 90]) {
      const next = addEarlierWarningStage(days, ladder)
      expect(isLadderRefusal(next), String(days)).toBe(false)
      if (isLadderRefusal(next)) return
      ladder = next
      expect(ladderHonoursTheMandatoryStages(ladder)).toBe(true)
    }
    expect([...ladder]).toEqual([90, 60, 30, 21, 14, 7, 1, 0])
  })

  it('exports no function that could remove, delay, disable or reorder a stage', () => {
    // Structural, like the Shift that carries no timezone field: the rule is
    // held by what the interface DOES NOT OFFER. A regression that added a
    // remover would red this before it could reach a screen.
    // Not a list of five names anyone could sidestep by picking a sixth: this
    // reads EVERY exported function in the module and refuses any whose name
    // pairs a subtractive verb with the ladder's own nouns. `addEarlierWarningStage`
    // is the only ladder mutator that can exist, and it is additive by
    // construction — the runtime proof of that direction is the case above.
    const source = readFileSync(MY_FILES[0]!, 'utf8')
    const exported = [...source.matchAll(/export function (\w+)/g)].map((m) => m[1] ?? '')
    expect(exported).toContain('addEarlierWarningStage')
    const subtractive =
      /^(remove|delete|clear|reset|drop|delay|postpone|disable|suppress|mute|reorder|shorten|weaken|set|replace|override)\w*(warning|stage|ladder)/i
    expect(exported.filter((name) => subtractive.test(name))).toEqual([])
  })
})

/* ------------------------------------------------------------------ *
 * Qualification state, derived from the ladder rather than stored
 * twice.
 * ------------------------------------------------------------------ */

describe('qualificationStateFor', () => {
  const base: Qualification = {
    id: 'Q-TEST',
    workerId: 'WKR-ARD-0114',
    certificationId: 'CERT-LOTO',
    areaIds: ['AREA-ARD-ASSY'],
    certificationDate: '2025-01-01',
    entryDate: '2025-01-01',
    expiryDate: '2026-01-01',
    daysToExpiry: 0,
    renewedFromExpiry: null,
    note: 'test-only',
  }

  it('walks every rung of the ladder and lands on the right state at each boundary', () => {
    const cases: readonly (readonly [number, string])[] = [
      [365, 'valid'],
      [15, 'valid'],
      [14, 'warning_14'],
      [8, 'warning_14'],
      [7, 'warning_7'],
      [2, 'warning_7'],
      [1, 'warning_1'],
      [0, 'expired'],
      [-5, 'expired'],
    ]
    for (const [days, expected] of cases) {
      expect(qualificationStateFor({ ...base, daysToExpiry: days }), String(days)).toBe(expected)
    }
  })

  it('reads a recertified record as renewed, but never lets renewed hide a warning', () => {
    const renewed = { ...base, renewedFromExpiry: '2026-01-01', daysToExpiry: 200 }
    expect(qualificationStateFor(renewed)).toBe('renewed')
    // The safe direction: a renewal that is itself inside a warning stage
    // shows the stage. Make `renewed` sticky and this assertion reds.
    expect(qualificationStateFor({ ...renewed, daysToExpiry: 6 })).toBe('warning_7')
    expect(qualificationStateFor({ ...renewed, daysToExpiry: -1 })).toBe('expired')
  })

  it('reports a late entry as a late entry rather than as a compliance gap', () => {
    expect(entryIsLate({ ...base, certificationDate: '2026-08-14', entryDate: '2026-08-15' })).toBe(true)
    expect(entryIsLate({ ...base, certificationDate: '2026-08-15', entryDate: '2026-08-15' })).toBe(false)
  })
})

/* ------------------------------------------------------------------ *
 * The recertification rule, and the no-partial-record half of it.
 * ------------------------------------------------------------------ */

describe('recertificationRefusal — the new expiry must postdate the old', () => {
  it('accepts an expiry strictly after the previous one', () => {
    expect(recertificationRefusal('2026-08-14', '2026-08-15')).toBeNull()
    expect(recertificationRefusal('2026-08-14', '2027-08-14')).toBeNull()
  })

  it('refuses an equal or earlier expiry, stating the rule and that nothing partial is written', () => {
    for (const bad of ['2026-08-14', '2026-08-13', '2025-01-01']) {
      const refusal = recertificationRefusal('2026-08-14', bad)
      expect(refusal, bad).not.toBeNull()
      expect(refusal ?? '', bad).toMatch(/postdate/i)
      expect(refusal ?? '', bad).toMatch(/no partial record/i)
    }
  })

  it('refuses a value that is not a date rather than comparing it', () => {
    for (const bad of ['', 'soon', '14/08/2026', '2026-8-1']) {
      expect(recertificationRefusal('2026-08-14', bad), bad).not.toBeNull()
    }
  })
})

/* ------------------------------------------------------------------ *
 * AC-STU-118 — no surface shows a clearance as effective before its
 * command reaches applied on the device. The one place the fifteen
 * device command states are load-bearing in this slice.
 * ------------------------------------------------------------------ */

describe('a clearance is never effective before its command is applied', () => {
  it('treats a granted-but-queued clearance as not effective, and an applied one as effective', () => {
    const queued = DOH_CLEARANCES.find((c) => c.id === 'CLR-2026-0031')
    const applied = DOH_CLEARANCES.find((c) => c.id === 'CLR-2026-0033')
    expect(queued).toBeDefined()
    expect(applied).toBeDefined()
    if (!queued || !applied) return
    expect(queued.commandState).toBe('queued')
    expect(clearanceIsEffective(queued)).toBe(false)
    expect(clearanceIsEffective(applied)).toBe(true)
    // Both directions against ONE record, so the only thing that differs
    // between the two answers is the command state.
    expect(clearanceIsEffective({ ...queued, commandState: 'applied' })).toBe(true)
    expect(clearanceIsEffective({ ...applied, commandState: 'delivered' })).toBe(false)
  })

  it('never treats a lapsed or superseded clearance as effective, however applied its command', () => {
    for (const state of ['lapsed', 'superseded_by_renewal'] as const) {
      const lapsed = DOH_CLEARANCES.find((c) => c.state === state)
      expect(lapsed, state).toBeDefined()
      if (!lapsed) continue
      expect(lapsed.commandState, state).toBe('applied')
      expect(clearanceIsEffective(lapsed), state).toBe(false)
    }
  })

  it('renders Expired for a certificate whose only clearance is queued, and Cleared for one applied', () => {
    const mayaLoto = DOH_QUALIFICATIONS.find((q) => q.id === 'QUAL-0114-LOTO')
    const kaiLoto = DOH_QUALIFICATIONS.find((q) => q.id === 'QUAL-0615-LOTO')
    expect(mayaLoto).toBeDefined()
    expect(kaiLoto).toBeDefined()
    if (!mayaLoto || !kaiLoto) return
    // Both are EXPIRED. What differs is only whether the device has the
    // clearance — which is the whole of AC-STU-118 in one pair.
    expect(qualificationStateFor(mayaLoto)).toBe('expired')
    expect(qualificationStateFor(kaiLoto)).toBe('expired')
    expect(chipFor(mayaLoto, CLEARANCES)).toBe('Expired')
    expect(chipFor(kaiLoto, CLEARANCES)).toBe('Cleared')
    expect(effectiveClearanceFor('QUAL-0114-LOTO', CLEARANCES)).toBeNull()
    expect(effectiveClearanceFor('QUAL-0615-LOTO', CLEARANCES)?.id).toBe('CLR-2026-0033')

    // And the moment the device acknowledges, the chip moves — proving the
    // chip reads the command state rather than a stored flag.
    const acknowledged: readonly Clearance[] = CLEARANCES.map((c) =>
      c.id === 'CLR-2026-0031' ? { ...c, commandState: 'applied' as const } : c,
    )
    expect(chipFor(mayaLoto, acknowledged)).toBe('Cleared')
  })

  it('draws every chip from the closed six-label vocabulary, so no render site invents one', () => {
    expect([...QUALIFICATION_CHIPS]).toEqual(['Valid', '14 days', '7 days', '1 day', 'Expired', 'Cleared'])
    for (const qual of DOH_QUALIFICATIONS) {
      expect(QUALIFICATION_CHIPS, qual.id).toContain(chipFor(qual, CLEARANCES))
    }
    // Every state maps to a label, including `renewed`, which reads Valid
    // because a renewal in force is a certificate in force.
    for (const state of QUALIFICATION_STATES) {
      expect(QUALIFICATION_CHIPS, state).toContain(QUALIFICATION_CHIP_LABEL[state])
    }
  })

  it('returns a qualification to Expired when the clearance lapses, and never to Valid', () => {
    const kaiLoto = DOH_QUALIFICATIONS.find((q) => q.id === 'QUAL-0615-LOTO')
    expect(kaiLoto).toBeDefined()
    if (!kaiLoto) return
    const lapsed: readonly Clearance[] = CLEARANCES.map((c) =>
      c.id === 'CLR-2026-0033' ? { ...c, state: 'lapsed' as const } : c,
    )
    expect(chipFor(kaiLoto, lapsed)).toBe('Expired')
    expect(chipFor(kaiLoto, lapsed)).not.toBe('Valid')
  })
})

/* ------------------------------------------------------------------ *
 * THE ESCALATION KEY. Slice gate 3: (Area, Shift), never (Worker).
 * ------------------------------------------------------------------ */

describe('the second-clearance escalation keys on (Area, Shift) and never on a worker', () => {
  it('carries the key as data, and the function that answers it takes no worker at all', () => {
    expect([...ESCALATION_KEY]).toEqual(['Area', 'Shift'])
    expect(ESCALATION_KEY.join(' ')).not.toMatch(/worker|person|individual/i)
    // The signature is the guarantee: three parameters, and none of them is a
    // worker. Add one and this reds before any screen could pass it.
    expect(secondClearanceRoutesToQualityManager.length).toBe(3)
  })

  it('routes a further clearance on a pair that already holds one, regardless of which worker', () => {
    // Assembly Hall on the early Shift already holds two, granted for two
    // DIFFERENT people — which is the point of the rule.
    const onPair = clearancesOn('AREA-ARD-ASSY', 'SHIFT-ARD-EARLY', CLEARANCES)
    expect(onPair.length).toBeGreaterThan(1)
    expect(new Set(onPair.map((c) => c.workerId)).size).toBeGreaterThan(1)
    expect(secondClearanceRoutesToQualityManager('AREA-ARD-ASSY', 'SHIFT-ARD-EARLY', CLEARANCES)).toBe(true)
  })

  it('does NOT route on a pair that holds none, so the rule is not simply always true', () => {
    expect(clearancesOn('AREA-ARD-PAINT', 'SHIFT-ARD-LATE', CLEARANCES)).toEqual([])
    expect(secondClearanceRoutesToQualityManager('AREA-ARD-PAINT', 'SHIFT-ARD-LATE', CLEARANCES)).toBe(false)
  })

  it('keys on BOTH halves: the same Area on a different Shift is a different pair', () => {
    expect(secondClearanceRoutesToQualityManager('AREA-ARD-POLISH', 'SHIFT-KEL-DAY', CLEARANCES)).toBe(true)
    expect(secondClearanceRoutesToQualityManager('AREA-ARD-POLISH', 'SHIFT-ARD-EARLY', CLEARANCES)).toBe(false)
    expect(secondClearanceRoutesToQualityManager('AREA-ARD-ASSY', 'SHIFT-ARD-LATE', CLEARANCES)).toBe(false)
  })

  it('reads the register it is handed rather than the seed', () => {
    const added: Clearance = {
      ...DOH_CLEARANCES[0]!,
      id: 'CLR-SESSION-01',
      areaId: 'AREA-ARD-PAINT',
      shiftId: 'SHIFT-ARD-LATE',
    }
    expect(secondClearanceRoutesToQualityManager('AREA-ARD-PAINT', 'SHIFT-ARD-LATE', CLEARANCES)).toBe(false)
    expect(
      secondClearanceRoutesToQualityManager('AREA-ARD-PAINT', 'SHIFT-ARD-LATE', [...CLEARANCES, added]),
    ).toBe(true)
  })
})

describe('escalation resolves a ROLE against the roles on shift, never a person', () => {
  it('covers every Shift the shift module seeds, so none arrives here uncovered', () => {
    for (const shift of DOH_SHIFTS) {
      expect(Object.hasOwn(ON_SHIFT_ROLE_COVERAGE, shift.id), shift.id).toBe(true)
    }
    expect(Object.keys(ON_SHIFT_ROLE_COVERAGE).length).toBe(DOH_SHIFTS.length)
  })

  it('holds role identifiers and nothing that could be a person', () => {
    const tenantRoles = rolesInDomain('TENANT').map((r) => r.id)
    for (const [shiftId, roles] of Object.entries(ON_SHIFT_ROLE_COVERAGE)) {
      expect(shiftId).toMatch(/^SHIFT-/)
      for (const roleId of roles) expect(tenantRoles, shiftId).toContain(roleId)
    }
    // Not vacuous: some Shift genuinely carries the target role, and some
    // genuinely does not, so both branches below are reachable.
    const covered = Object.values(ON_SHIFT_ROLE_COVERAGE).filter((r) =>
      r.includes(ESCALATION_TARGET_ROLE),
    )
    expect(covered.length).toBeGreaterThan(0)
    expect(covered.length).toBeLessThan(Object.keys(ON_SHIFT_ROLE_COVERAGE).length)
  })

  it('resolves on shift where the target role is present and marks a fallback where it is not', () => {
    const onShift = resolveEscalation('AREA-ARD-ASSY', 'SHIFT-ARD-EARLY')
    expect(onShift.targetRole).toBe('QUALITY_MANAGER')
    expect(onShift.resolvedOnShift).toBe(true)
    expect(onShift.markedAsFallback).toBe(false)

    const fallback = resolveEscalation('AREA-ARD-PAINT', 'SHIFT-ARD-LATE')
    expect(fallback.resolvedOnShift).toBe(false)
    expect(fallback.markedAsFallback).toBe(true)
    expect(fallback.note).toMatch(/marked/i)
    expect(fallback.note).toMatch(/may have no holder/i)

    // A Shift nobody covers at all still resolves — as a marked fallback,
    // never as a silent success.
    expect(resolveEscalation('AREA-ARD-PAINT', 'SHIFT-NOT-SEEDED').markedAsFallback).toBe(true)
  })
})

/* ------------------------------------------------------------------ *
 * The seeded registers, and their agreement with the modules that own
 * the Areas, the certification types and the Shifts underneath them.
 * ------------------------------------------------------------------ */

describe('the seeded worker, qualification and clearance registers', () => {
  it('carries unique ids and states from the three closed vocabularies', () => {
    expect(new Set(DOH_WORKERS.map((w) => w.id)).size).toBe(DOH_WORKERS.length)
    expect(new Set(DOH_QUALIFICATIONS.map((q) => q.id)).size).toBe(DOH_QUALIFICATIONS.length)
    expect(new Set(DOH_CLEARANCES.map((c) => c.id)).size).toBe(DOH_CLEARANCES.length)
    for (const worker of DOH_WORKERS) {
      expect(WORKER_STATES, worker.id).toContain(worker.state)
      expect(workerById(worker.id, WORKERS)?.name, worker.id).toBe(worker.name)
    }
    for (const clearance of DOH_CLEARANCES) {
      expect(CLEARANCE_STATES, clearance.id).toContain(clearance.state)
    }
    for (const qual of DOH_QUALIFICATIONS) {
      expect(QUALIFICATION_STATES, qual.id).toContain(qualificationStateFor(qual))
    }
    expect(workerById('WKR-NOT-SEEDED', WORKERS)).toBeUndefined()
  })

  it('resolves every qualification to a real worker, a seeded certification type and real Areas', () => {
    const certIds = SEEDED_CERTIFICATION_TYPES.map((c) => c.id)
    for (const qual of DOH_QUALIFICATIONS) {
      expect(workerById(qual.workerId, WORKERS), qual.id).toBeDefined()
      expect(certIds, qual.id).toContain(qual.certificationId)
      expect(qual.areaIds.length, qual.id).toBeGreaterThan(0)
      for (const areaId of qual.areaIds) expect(areaById(areaId), `${qual.id} → ${areaId}`).toBeDefined()
      expect(qual.certificationDate <= qual.entryDate, qual.id).toBe(true)
      if (qual.renewedFromExpiry !== null) {
        expect(recertificationRefusal(qual.renewedFromExpiry, qual.expiryDate), qual.id).toBeNull()
      }
    }
  })

  it('ties every recorded daysToExpiry to its own expiry date and the register stamp', () => {
    // The two are stored separately because this module reads no clock, and
    // nothing but this case stops them contradicting each other — a chip saying
    // "7 days" beside an expiry eight months out, or the Qualification Calendar
    // (which necessarily places a record by its expiry DATE) disagreeing with
    // the chip this module derives from the recorded NUMBER.
    const asOf = REGISTER_AS_OF.slice(0, 10)
    expect(asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const day = (iso: string): number => {
      const [y, m, d] = iso.split('-').map(Number)
      return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1) / 86_400_000
    }
    for (const qual of DOH_QUALIFICATIONS) {
      expect(day(qual.expiryDate) - day(asOf), qual.id).toBe(qual.daysToExpiry)
    }
    // Not vacuous: the seed spans both sides of the stamp.
    expect(DOH_QUALIFICATIONS.some((q) => q.daysToExpiry < 0)).toBe(true)
    expect(DOH_QUALIFICATIONS.some((q) => q.daysToExpiry > 0)).toBe(true)
  })

  it('holds a qualification scoping across Areas under DIFFERENT Sites, which is the stated rule', () => {
    const multiSite = DOH_QUALIFICATIONS.filter((q) => {
      const siteIds = new Set(q.areaIds.map((a) => areaById(a)?.siteId))
      return siteIds.size > 1
    })
    // Not vacuous: at least one qualification genuinely spans Sites, and the
    // rest genuinely do not, so the fixture exercises both shapes.
    expect(multiSite.length).toBeGreaterThan(0)
    expect(multiSite.length).toBeLessThan(DOH_QUALIFICATIONS.length)
    expect(multiSite.map((q) => q.id)).toContain('QUAL-0311-METROLOGY')
  })

  it('resolves every clearance to a real worker, a real Area and a real Shift', () => {
    const shiftIds = DOH_SHIFTS.map((s) => s.id)
    for (const clearance of DOH_CLEARANCES) {
      expect(workerById(clearance.workerId, WORKERS), clearance.id).toBeDefined()
      expect(areaById(clearance.areaId), clearance.id).toBeDefined()
      expect(shiftIds, clearance.id).toContain(clearance.shiftId)
      if (clearance.qualificationId !== null) {
        expect(
          DOH_QUALIFICATIONS.some((q) => q.id === clearance.qualificationId),
          clearance.id,
        ).toBe(true)
      }
      expect(clearance.validForDays, clearance.id).toBeGreaterThan(0)
    }
  })

  it('holds every reachable record shape a reviewer needs to see, and each one only once', () => {
    // An incomplete record; a record with no platform account; a departed one;
    // a reactivated one with the prompt standing; and one whose departure is
    // blocked by assigned runs. Each is the fixture behind a named behaviour,
    // and a fixture edit that dropped one would quietly delete the case.
    expect(DOH_WORKERS.filter((w) => w.instructionDifficulty === null)).toHaveLength(1)
    expect(DOH_WORKERS.filter((w) => w.platformLogin === null)).toHaveLength(1)
    expect(DOH_WORKERS.filter((w) => w.state === 'archived')).toHaveLength(1)
    expect(DOH_WORKERS.filter((w) => w.revalidationPending)).toHaveLength(1)
    expect(
      DOH_WORKERS.filter((w) => w.activeRunIds.length + w.upcomingRunIds.length > 0).length,
    ).toBeGreaterThan(0)
  })

  it('leaves one Area on the location tree holding nobody, which is where STATE-01 is reachable', () => {
    const reached = new Set(DOH_WORKERS.flatMap((w) => workerAreaIds(w, QUALIFICATIONS)))
    const empty = DOH_AREAS.filter((a) => a.state === 'active' && !reached.has(a.id))
    expect(empty.map((a) => a.id)).toContain('AREA-ARD-PACK')
  })

  it('exposes a run only as a reference, and carries no run history of any kind', () => {
    for (const worker of DOH_WORKERS) {
      for (const runId of [...worker.activeRunIds, ...worker.upcomingRunIds]) {
        expect(typeof runId, worker.id).toBe('string')
      }
      // No completed-run list, no historical count, no total: the only run
      // fields are the two the departure flow reads.
      const runKeys = Object.keys(worker).filter((k) => /run/i.test(k))
      expect([...runKeys].sort(), worker.id).toEqual(['activeRunIds', 'upcomingRunIds'])
    }
  })

  it('seeds one clean import file and one that fails, so all-or-nothing is demonstrable', () => {
    expect(SEEDED_IMPORT_FILES.filter((f) => f.failsAtRow === null)).toHaveLength(1)
    const bad = SEEDED_IMPORT_FILES.find((f) => f.failsAtRow !== null)
    expect(bad).toBeDefined()
    expect(bad?.failureRule ?? '').toMatch(/all-or-nothing/i)
    expect(bad?.failureRule ?? '').toMatch(/nothing is written/i)
    for (const file of SEEDED_IMPORT_FILES) {
      expect(file.rows.length, file.id).toBeGreaterThan(0)
      for (const row of file.rows) {
        expect(INSTRUCTION_DIFFICULTIES, file.id).toContain(row.instructionDifficulty)
        expect(areaById(row.homeAreaId), file.id).toBeDefined()
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * Scope, read from the location module's one definition.
 * ------------------------------------------------------------------ */

describe('the clearance corpus is scope-filtered, which the matrix row promises', () => {
  it('shows a tenant-scoped persona the whole corpus', () => {
    expect(clearancesVisibleTo('TENANT_ADMIN', CLEARANCES)).toHaveLength(CLEARANCES.length)
    expect(clearancesVisibleTo('READONLY_AUDITOR', CLEARANCES)).toHaveLength(CLEARANCES.length)
  })

  it('gives an Area-scoped Supervisor a STRICT subset, never the whole corpus', () => {
    const admin = clearancesVisibleTo('TENANT_ADMIN', CLEARANCES).map((c) => c.id)
    const supervisor = clearancesVisibleTo('SUPERVISOR', CLEARANCES).map((c) => c.id)
    for (const id of supervisor) expect(admin, id).toContain(id)
    // STRICT, both ends. A subset assertion that passes when the two are equal
    // proves nothing at all, and a filter returning [] would satisfy the
    // containment above just as happily.
    expect(supervisor.length).toBeGreaterThan(0)
    expect(supervisor.length).toBeLessThan(admin.length)
    // And the row that is genuinely withheld, named, so a filter keyed on the
    // wrong field cannot pass by dropping a different one.
    expect(supervisor).not.toContain('CLR-2026-0033')
    expect(supervisor).toContain('CLR-2026-0031')
  })

  it('places a clearance by its AREA, which is the half of the key carrying the signal', () => {
    for (const roleId of ['SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      const scoped = clearancesVisibleTo(roleId, CLEARANCES)
      for (const clearance of scoped) {
        expect(
          workerAreaIds(workerById(clearance.workerId, WORKERS) ?? DOH_WORKERS[0], QUALIFICATIONS)
            .length,
          clearance.id,
        ).toBeGreaterThan(0)
        expect(clearance.areaId, clearance.id).toBeTruthy()
      }
    }
    // Kai's clearance sits on Polishing Bay; the Supervisor holds Paint and
    // Assembly. Key the filter on the worker's home Area instead of the
    // clearance's own Area and this stops distinguishing them.
    const supervisorAreas = clearancesVisibleTo('SUPERVISOR', CLEARANCES).map((c) => c.areaId)
    expect(supervisorAreas.every((a) => ['AREA-ARD-PAINT', 'AREA-ARD-ASSY'].includes(a))).toBe(true)
  })

  it('gives the Worker no clearance at all, which is the matrix’s one `unavailable` cell', () => {
    expect(clearancesVisibleTo('WORKER', CLEARANCES)).toEqual([])
  })
})

describe('scope on the worker register', () => {
  it('shows a tenant-scoped persona everybody and an Area-scoped Supervisor only their own', () => {
    expect(workersVisibleTo('TENANT_ADMIN', WORKERS, QUALIFICATIONS)).toHaveLength(WORKERS.length)
    expect(workersVisibleTo('READONLY_AUDITOR', WORKERS, QUALIFICATIONS)).toHaveLength(WORKERS.length)

    const supervisor = workersVisibleTo('SUPERVISOR', WORKERS, QUALIFICATIONS)
    // Not vacuous: the Supervisor genuinely loses people, and keeps some.
    expect(supervisor.length).toBeGreaterThan(0)
    expect(supervisor.length).toBeLessThan(WORKERS.length)
    expect(supervisor.map((w) => w.id)).not.toContain('WKR-ARD-0615')
  })

  it('reaches a worker through a qualification Area, not only through their home Area', () => {
    // Tomas is based in the Quality Laboratory, which the Supervisor cannot
    // see, and holds a qualification scoping into Assembly Hall, which they
    // can. Narrow `workerAreaIds` to the home Area alone and this reds.
    const tomas = workerById('WKR-ARD-0311', WORKERS)
    expect(tomas).toBeDefined()
    if (!tomas) return
    expect(tomas.homeAreaId).toBe('AREA-ARD-QC')
    expect(workerAreaIds(tomas, QUALIFICATIONS)).toContain('AREA-ARD-ASSY')
    expect(workersVisibleTo('SUPERVISOR', WORKERS, QUALIFICATIONS).map((w) => w.id)).toContain(
      'WKR-ARD-0311',
    )
  })

  it('resolves a worker from the register it is handed, not from the seed', () => {
    const created: Worker = { ...DOH_WORKERS[0]!, id: 'WKR-SESSION-01', name: 'Created in session' }
    expect(workerById('WKR-SESSION-01', WORKERS)).toBeUndefined()
    expect(workerById('WKR-SESSION-01', [...WORKERS, created])?.name).toBe('Created in session')
    // And an archived record still resolves: history stays readable.
    expect(workerById('WKR-ARD-0402', WORKERS)?.state).toBe('archived')
  })

  it('gives the Worker nobody at all, because the Worker holds no Hub scope (D11)', () => {
    expect(workersVisibleTo('WORKER', WORKERS, QUALIFICATIONS)).toEqual([])
  })

  it('lists a worker’s own qualifications and nobody else’s', () => {
    for (const worker of DOH_WORKERS) {
      for (const qual of qualificationsFor(worker.id, QUALIFICATIONS)) {
        expect(qual.workerId, qual.id).toBe(worker.id)
      }
    }
    expect(qualificationsFor('WKR-ARD-0114', QUALIFICATIONS).map((q) => q.id).sort()).toEqual([
      'QUAL-0114-FLT',
      'QUAL-0114-LOTO',
    ])
  })
})

/* ------------------------------------------------------------------ *
 * The tenant state gate, asserted against the ONE write-class table
 * rather than restated here. D16 lives in this block.
 * ------------------------------------------------------------------ */

describe('the tenant state gate on this module’s writes', () => {
  it('blocks creating a worker in EVERY suspension state and opens it only in active', () => {
    expect(writeAllowed('active', 'create-worker')).toBe(true)
    for (const state of TENANT_STATES.filter((s) => s !== 'active')) {
      expect(writeAllowed(state, 'create-worker'), state).toBe(false)
    }
  })

  it('D16: keeps recertification open in soft suspension and CLOSED in hard', () => {
    expect(writeAllowed('active', 'recertify-worker')).toBe(true)
    // The half that is easy to get wrong in the safe-looking direction: soft
    // suspension deliberately keeps recertification open, because it operates
    // the existing account rather than growing it.
    expect(writeAllowed('soft-suspended', 'recertify-worker')).toBe(true)
    // And the half the census calls the most operationally dangerous silence
    // in the slice.
    expect(writeAllowed('hard-suspended', 'recertify-worker')).toBe(false)
    expect(writeAllowed('compliance-suspended', 'recertify-worker')).toBe(false)
    expect(writeAllowed('archived', 'recertify-worker')).toBe(false)
  })

  it('keeps a clearance open in soft suspension and closed in hard, on the same table', () => {
    expect(writeAllowed('soft-suspended', 'grant-clearance')).toBe(true)
    expect(writeAllowed('hard-suspended', 'grant-clearance')).toBe(false)
  })

  it('closes a qualification entry and a difficulty change wherever configuration edits are closed', () => {
    expect(writeAllowed('active', 'edit-configuration')).toBe(true)
    for (const state of TENANT_STATES.filter((s) => s !== 'active')) {
      expect(writeAllowed(state, 'edit-configuration'), state).toBe(false)
    }
  })
})

/* ------------------------------------------------------------------ *
 * The fifteen-row control matrix, and the two findings that make it
 * worth reading twice.
 * ------------------------------------------------------------------ */

describe('the fifteen-row control matrix', () => {
  it('carries fifteen rows with a distinct id and control name each', () => {
    expect(CONTROL_MATRIX).toHaveLength(15)
    expect(new Set(CONTROL_MATRIX.map((r) => r.id)).size).toBe(15)
    expect(new Set(CONTROL_MATRIX.map((r) => r.control)).size).toBe(15)
  })

  it('declares an explicit status from the closed vocabulary in all seventy-five cells', () => {
    for (const row of CONTROL_MATRIX) {
      const cells = Object.values(row.status)
      expect(cells, row.id).toHaveLength(5)
      for (const cell of cells) expect(CONTROL_STATUSES, row.id).toContain(cell)
      expect(row.rendering.length, row.id).toBeGreaterThan(40)
      expect(row.effect.length, row.id).toBeGreaterThan(40)
      expect(row.sourceRef.length, row.id).toBeGreaterThan(4)
    }
  })

  it('D9: gives the Tenant Admin qualification entry AND recertification', () => {
    // The erratum this decision corrects would have removed the Tenant Admin
    // from both of these lists entirely.
    expect(statusFor('enter-qualification', 'TENANT_ADMIN')).toBe('allowed')
    expect(statusFor('record-recertification', 'TENANT_ADMIN')).toBe('allowed')
    expect(rolesWithStatus('enter-qualification', ACTING_STATUSES)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
    ])
    expect(rolesWithStatus('record-recertification', ACTING_STATUSES)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
    ])
  })

  it('D10: prohibits the Tenant Admin on ALL THREE clearance rows', () => {
    for (const id of [
      'clear-expired-certification',
      'clear-never-held',
      'clear-second-in-area-on-shift',
    ] as const) {
      expect(statusFor(id, 'TENANT_ADMIN'), id).toBe('explicitly-prohibited')
      expect(rolesWithStatus(id, ACTING_STATUSES), id).not.toContain('TENANT_ADMIN')
    }
  })

  it('splits the entry authority from the exception authority, which is the second finding', () => {
    // The Quality Manager may not ENTER a certificate and may clear every
    // class of block. Deliberately different people.
    expect(statusFor('enter-qualification', 'QUALITY_MANAGER')).toBe('explicitly-prohibited')
    expect(rolesWithStatus('clear-expired-certification', ACTING_STATUSES)).toEqual([
      'SUPERVISOR',
      'QUALITY_MANAGER',
    ])
    expect(rolesWithStatus('clear-never-held', ACTING_STATUSES)).toEqual(['QUALITY_MANAGER'])
    expect(rolesWithStatus('clear-second-in-area-on-shift', ACTING_STATUSES)).toEqual([
      'QUALITY_MANAGER',
    ])
    // FB-QUAL-005's canonical case: the Supervisor is prohibited on the
    // never-held row while another role on the same screen holds it.
    expect(statusFor('clear-never-held', 'SUPERVISOR')).toBe('explicitly-prohibited')
  })

  it('prohibits self-attestation on every row a worker could reach', () => {
    for (const id of [
      'enter-qualification',
      'record-recertification',
      'back-date-issue-date',
      'create-or-edit-worker',
    ] as const) {
      expect(statusFor(id, 'WORKER'), id).toBe('explicitly-prohibited')
      expect(rolesWithStatus(id, ACTING_STATUSES), id).not.toContain('WORKER')
    }
  })

  it('gives the gate posture and the clearance duration to the Tenant Admin alone', () => {
    expect(rolesWithStatus('set-gate-posture-or-duration', ACTING_STATUSES)).toEqual(['TENANT_ADMIN'])
    expect([...GATE_POSTURES]).toEqual(['strict', 'notify-only'])
    expect(GATE_POSTURE_FLOOR).toBe('notify-only')
  })

  it('marks exactly one cell `unavailable`, which is the cell the module rail reads', () => {
    const unavailable = MATRIX.flatMap((row) =>
      Object.entries(row.status)
        .filter(([, status]) => status === 'unavailable')
        .map(([roleId]) => `${row.id}:${roleId}`),
    )
    expect(unavailable).toEqual(['read-clearance-corpus:WORKER'])
  })

  it('never carries a prohibition token in the acting or reading lists', () => {
    const prohibitions = ['unavailable', 'explicitly-prohibited', 'not-applicable']
    for (const status of [...ACTING_STATUSES, ...READING_STATUSES]) {
      expect(prohibitions).not.toContain(status)
    }
    expect([...ACTING_STATUSES].sort()).toEqual(['allowed', 'allowed-with-conditions'])
    expect([...READING_STATUSES].sort()).toEqual([
      'allowed',
      'allowed-with-conditions',
      'read-only',
    ])
  })

  it('gives four roles a read of the clearance corpus, and the Worker none', () => {
    expect(rolesWithStatus('read-clearance-corpus', READING_STATUSES)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
  })
})

/* ------------------------------------------------------------------ *
 * SUPPORT, NOT SURVEILLANCE (S10) — the gate that matters most here,
 * run with the SHARED matcher rather than a fifth hand-rolled regular
 * expression.
 * ------------------------------------------------------------------ */

describe('support-not-surveillance, held in the fixture shape itself', () => {
  it('keys no behavioural measure on a person anywhere in this module’s fixtures', () => {
    const rows: readonly object[] = [
      ...DOH_WORKERS,
      ...DOH_QUALIFICATIONS,
      ...DOH_CLEARANCES,
      ...IMPORT_FILES,
      ...IMPORT_FILES.flatMap((f) => f.rows),
      ...CONTROL_MATRIX,
      ...RECORD_REGIONS,
      ...MEASURE_RULES,
      ...ABSENT_BY_RULE,
      ...DECISIONS_ON_SCREEN,
    ]
    // Not vacuous: these are records that genuinely ARE about people, which is
    // the half of the question the matcher does not answer for itself.
    expect(rows.length).toBeGreaterThan(30)
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        expect(namesPersonBehaviouralMeasure(key), key).toBe(false)
      }
    }
  })

  it('names the four measure-shaped fields the record type refuses to compile with', () => {
    // The compile-time half lives in the fixtures file; this asserts the guard
    // is actually there, because a type-level check that gets deleted leaves
    // no runtime trace at all.
    const source = readFileSync(MY_FILES[0]!, 'utf8')
    expect(source).toMatch(/type ForbiddenMeasureField/)
    expect(source).toMatch(/type MeasureFieldOnWorker = Extract<keyof Worker, ForbiddenMeasureField>/)
    expect(source).toMatch(
      /_workerHasNoMeasureField: MeasureFieldOnWorker extends never \? true : never/,
    )
    for (const field of ['runCount', 'productivityScore', 'clearanceCount', 'expiryFrequency']) {
      expect(source, field).toContain(`'${field}'`)
    }
  })

  it('carries the measurement register’s own two rows, with the prohibited use of each', () => {
    expect(MEASURE_RULES.map((r) => r.id)).toEqual(['M-A4', 'M-A5'])
    const qualification = MEASURE_RULES.find((r) => r.id === 'M-A4')
    expect(qualification?.individualLevel ?? '').toMatch(/allowed/i)
    expect(qualification?.prohibitedUse ?? '').toMatch(/expiry frequency as a performance measure/i)
    const clearance = MEASURE_RULES.find((r) => r.id === 'M-A5')
    expect(clearance?.individualLevel ?? '').toMatch(/explicitly prohibited/i)
    expect(clearance?.individualLevel ?? '').toMatch(/by role and by area|by ROLE and by AREA/i)
    expect(clearance?.prohibitedUse ?? '').toMatch(/per-worker/i)
  })

  it('renders no per-worker cut, rate, ranking or working duration anywhere in this module’s source', () => {
    // Structural rather than prose-matching: a DENIAL of a per-worker cut is
    // the disclosure the spec requires, so a line carrying a negation is not a
    // violation. Same three-axis shape the slice-3 gate uses.
    const PERSON_MEASURE =
      /\b(worker|operator|employee|person)[_-]?(ranking|rank|score|league|count|total|rate)\b|\b(productivity|efficiency|performance)[_-]?(score|rating|index)\b|\b(runs?|steps?)\s*per\s*(hour|shift|day)\b/i
    for (const file of MY_FILES) {
      const offending = readFileSync(file, 'utf8')
        .split('\n')
        .filter(
          (line) =>
            PERSON_MEASURE.test(line) &&
            !/\b(no|never|not|cannot|neither|nor|absent|prohibited|refuses)\b/i.test(line),
        )
      expect(offending, file).toEqual([])
    }
  })
})

/* ------------------------------------------------------------------ *
 * The panels the per-module contract requires by name, and the
 * pointers this screen makes at them.
 * ------------------------------------------------------------------ */

describe('the required panels carry real content, not placeholders', () => {
  it('names the grant control, the worker entry path, the certification types and the ladder as ABSENT by rule', () => {
    const labels = ABSENT_BY_RULE.map((a) => a.label).join(' | ')
    expect(labels).toMatch(/clearance-granting control/i)
    expect(labels).toMatch(/qualification-entry path reachable by a worker/i)
    expect(labels).toMatch(/certification type/i)
    expect(labels).toMatch(/weaker than notify-only/i)
    expect(labels).toMatch(/removes, delays or disables an expiry warning stage/i)
    expect(labels).toMatch(/Cell, Job and worker scoping/i)
    for (const item of ABSENT_BY_RULE) {
      expect(item.note.length, item.label).toBeGreaterThan(80)
    }
  })

  it('records the open questions this module actually raises, without inventing a control', () => {
    const all = [...UNSPECIFIED_IN_SOURCE, ...UNRESOLVED_IN_SOURCE].join(' ')
    expect(all).toMatch(/D22|certification type/i)
    expect(all).toMatch(/D16|hard suspension/i)
    expect(all).toMatch(/re-validation prompt/i)
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(5)
    expect(UNRESOLVED_IN_SOURCE.length).toBeGreaterThan(5)
    for (const item of [...UNSPECIFIED_IN_SOURCE, ...UNRESOLVED_IN_SOURCE]) {
      expect(item.trim().length).toBeGreaterThan(60)
    }
  })

  /**
   * THE POINTERS THIS MODULE MAKES AT ITS OWN PANELS. The screen tells the
   * reader, in five places, that a question it raises is recorded below. Each
   * of those is a CLAIM about the build, and the iterate-the-array cases above
   * are structurally incapable of noticing a missing element: delete an entry
   * and the loop runs one fewer time, still green, while the sentence pointing
   * at it quietly becomes a lie. These name the entry each pointer needs.
   */
  it('resolves every pointer the screen makes at its own panels', () => {
    const unresolved = [...UNRESOLVED_IN_SOURCE]
    const unspecified = [...UNSPECIFIED_IN_SOURCE]
    // "…is UNSETTLED in the frozen source… recorded below" — the D8 question.
    expect(unresolved.some((i) => /UNSETTLED|unsettled/.test(i) && /ABSENT|absent/.test(i))).toBe(true)
    // "`Explicitly prohibited` carries NO rendering anywhere in the source."
    expect(unresolved.some((i) => /Explicitly prohibited.*no rendering/i.test(i))).toBe(true)
    // "`Unavailable` is overloaded" — the two senses, kept apart.
    expect(unresolved.some((i) => /Unavailable.*overloaded/i.test(i))).toBe(true)
    // "…the stricter reading is recorded below rather than adopted silently."
    expect(unspecified.some((i) => /soft suspension/i.test(i) && /stricter/i.test(i))).toBe(true)
    // "…the question is recorded below rather than answered by an invented control."
    expect(unspecified.some((i) => /re-validation prompt/i.test(i))).toBe(true)
    // The D16 consequence, stated where a client can act on it.
    expect(unresolved.some((i) => /D16/.test(i) && /strand a line/i.test(i))).toBe(true)
  })

  it('carries the storyboard’s four record regions and its banner copy verbatim', () => {
    expect(RECORD_REGIONS.map((r) => r.name)).toEqual([
      'Identity',
      'Qualifications',
      'Clearances',
      'Activity',
    ])
    expect(EXPIRED_BANNER_COPY).toBe(
      'One certification has expired. New assignment to runs requiring it is blocked. The current run may be completed.',
    )
  })

  it('names every decision this screen renders with a D-reference and a real statement', () => {
    for (const decision of DECISIONS_ON_SCREEN) {
      expect(decision.ref, decision.ref).toMatch(/^D\d+$/)
      expect(decision.statement.length, decision.ref).toBeGreaterThan(60)
    }
    for (const ref of ['D7', 'D9', 'D10', 'D11', 'D16', 'D21', 'D22', 'D23', 'D26']) {
      expect(DECISIONS_ON_SCREEN.map((d) => d.ref), ref).toContain(ref)
    }
  })
})

/* ------------------------------------------------------------------ *
 * The two gates that are cheapest to break and cheapest to check.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 source files — determinism, D1 and route ownership', () => {
  it('reads no clock and no randomness anywhere in this module', () => {
    for (const file of MY_FILES) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/Date\.now|new Date\(|Math\.random/)
    }
  })

  it('D1: writes no three-digit SCR-DOH literal anywhere, and annotates the two two-digit ones', () => {
    for (const file of MY_FILES) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/SCR-DOH-\d{3}/)
    }
    const screen = readFileSync(MY_FILES[1]!, 'utf8')
    expect(screen).toMatch(/SCR-DOH-07/)
    expect(screen).toMatch(/SCR-DOH-08/)
  })

  it('names its own module id more often than any module it cross-references, so the route walk is unambiguous', () => {
    const text = MY_FILES.map((f) => readFileSync(f, 'utf8')).join('\n')
    const own = (text.match(/MOD-DOH-04/g) ?? []).length
    expect(own).toBeGreaterThan(0)
    for (const other of ['01', '02', '03', '05', '06', '07', '09', '10', '11', '12', '13', '14']) {
      const count = (text.match(new RegExp(`MOD-DOH-${other}`, 'g')) ?? []).length
      expect(own, `MOD-DOH-${other}`).toBeGreaterThan(count)
    }
  })

  it('seeds no second copy of a Site, an Area, a Shift or a certification type', () => {
    const fixtures = readFileSync(MY_FILES[0]!, 'utf8')
    for (const producerExport of [
      /export const DOH_SITES/,
      /export const DOH_AREAS/,
      /export const DOH_SHIFTS/,
      /export const SEEDED_CERTIFICATION_TYPES =/,
      /export const SEEDED_ROLE_SCOPES/,
    ]) {
      expect(fixtures, String(producerExport)).not.toMatch(producerExport)
    }
    expect(fixtures).toMatch(/from '\.\.\/location-configuration\/fixtures'/)
    expect(fixtures).toMatch(/from '\.\.\/shift-management\/fixtures'/)
  })
})

/**
 * THE CROSS-CHECK. The module rail reads one field, `rolesReaching` on this
 * module's definition in `@/surfaces/doh/modules`, while this screen renders
 * its own matrix, and the two must not drift.
 *
 * The rule: the roles the spine withholds the route from are exactly the roles
 * this matrix marks `unavailable` — "cannot hold this in any scope", so the
 * route renders ABSENT and the rail does not offer it. `explicitly-prohibited`
 * is deliberately NOT that token: the control exists on this screen for another
 * role, so the refused role opens the screen and reads why.
 *
 * MADE NON-VACUOUS DELIBERATELY. Both sides here are non-empty — the Worker is
 * withheld — but an equality between two sets computed from two sources can
 * still pass against a broken spine if both happen to collapse, so the spine's
 * own count is pinned as well: four roles reach this module, not five and not
 * three. Merge the two status tokens, or widen `rolesReaching` to every role,
 * and one of these three assertions goes red.
 */
describe('MOD-DOH-04 — the rail and this matrix agree about who reaches the module', () => {
  it('withholds the route from exactly the roles the matrix marks unavailable', () => {
    const tenantRoles = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]
    // Guards the narrowing above, and proves the sweep below covers all five.
    expect(Object.keys(CONTROL_MATRIX[0]!.status).sort()).toEqual([...tenantRoles].sort())

    const withheldByTheMatrix = tenantRoles.filter((role) =>
      MATRIX.some((row) => row.status[role] === 'unavailable'),
    )
    const withheldByTheSpine = tenantRoles.filter(
      (role) => !dohModuleById('MOD-DOH-04').rolesReaching.includes(role),
    )

    expect([...withheldByTheSpine].sort()).toEqual([...withheldByTheMatrix].sort())
    // Non-vacuity, three ways: the withheld set is exactly the Worker, the
    // spine reaches four roles rather than however many it happens to list,
    // and the matrix still uses the OTHER prohibition token somewhere — so the
    // equality above cannot be satisfied by collapsing the two into one.
    expect(withheldByTheMatrix).toEqual(['WORKER'])
    expect(dohModuleById('MOD-DOH-04').rolesReaching).toHaveLength(4)
    expect(
      MATRIX.some((row) => Object.values(row.status).includes('explicitly-prohibited')),
    ).toBe(true)
  })
})
