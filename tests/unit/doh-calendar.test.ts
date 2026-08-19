import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { namesPersonBehaviouralMeasure } from '../coverage/person-measure-keys'
import {
  ABSENT_BY_RULE,
  APPLICABLE_SCREEN_STATES,
  AS_OF_DATE,
  CALENDAR_AS_OF,
  CALENDAR_FILTER_DIMENSIONS,
  CALENDAR_SCOPES,
  CALENDAR_WEEKS,
  CALENDAR_WEEK_COUNT,
  CONTROL_MATRIX,
  CONTROL_STATUSES,
  DECISIONS_ON_SCREEN,
  DOH_CLEARANCES,
  DOH_QUALIFICATIONS,
  DOH_WORKERS,
  GRID_FOOTER_COPY,
  HORIZON_DAYS,
  HORIZON_END_DATE,
  INAPPLICABLE_SCREEN_STATES,
  NO_FILTERS,
  READING_STATUSES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  alreadyLapsedFor,
  applyFilters,
  calendarAreaIdsFor,
  calendarEntriesFor,
  calendarScopeFor,
  cellCount,
  filtersAreActive,
  rolesWithStatus,
  statusFor,
  weekFor,
  withinHorizon,
  type CalendarEntry,
} from '../../app/hub/qualification-calendar/fixtures'
import {
  REGISTER_AS_OF,
  type Qualification,
} from '../../app/hub/worker-lifecycle-and-qualifications/fixtures'
import { SEEDED_ROLE_SCOPES, visibleAreaIds } from '../../app/hub/location-configuration/fixtures'
import { dohModuleById } from '@/surfaces/doh/modules'
import { DOH_SEAMS, dohSeamById } from '@/surfaces/doh/seams'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../app/hub/HubShell'

const FIXTURES_SRC = readFileSync('app/hub/qualification-calendar/fixtures.ts', 'utf8')
const SCREEN_SRC = readFileSync(
  'app/hub/qualification-calendar/QualificationCalendarScreen.tsx',
  'utf8',
)

/**
 * Day arithmetic exists HERE and nowhere in the module. A test may read a
 * calendar; a screen may not. This is the one place a literal date in the
 * fixture is proved to be the day it claims to be.
 */
function plusDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const t = Date.UTC(y!, m! - 1, d!) + days * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

function qual(id: string, expiryDate: string, daysToExpiry: number): Qualification {
  return {
    id,
    workerId: DOH_WORKERS[0].id,
    certificationId: 'CERT-LOTO',
    areaIds: [DOH_WORKERS[0].homeAreaId],
    certificationDate: '2025-01-01',
    entryDate: '2025-01-01',
    expiryDate,
    daysToExpiry,
    renewedFromExpiry: null,
    note: 'Constructed in the test, never shipped as a fixture.',
  }
}

describe('MOD-DOH-14 — the horizon is 60 days, inclusive, and the literals are proved', () => {
  it('reads its as-of stamp from the producing register rather than restating one', () => {
    expect(CALENDAR_AS_OF).toBe(REGISTER_AS_OF)
    expect(AS_OF_DATE).toBe(REGISTER_AS_OF.slice(0, 10))
    // Non-vacuous: the stamp is a real date, not an empty slice.
    expect(AS_OF_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('HORIZON_END_DATE is exactly the as-of day plus sixty days', () => {
    expect(HORIZON_DAYS).toBe(60)
    expect(HORIZON_END_DATE).toBe(plusDays(AS_OF_DATE, HORIZON_DAYS))
  })

  it('is inclusive at both ends and excludes the day after', () => {
    expect(withinHorizon(AS_OF_DATE)).toBe(true)
    expect(withinHorizon(HORIZON_END_DATE)).toBe(true)
    expect(withinHorizon(plusDays(AS_OF_DATE, -1))).toBe(false)
    expect(withinHorizon(plusDays(AS_OF_DATE, HORIZON_DAYS + 1))).toBe(false)
  })

  /**
   * TEST-DOH-14-N1, verbatim: seed 5, 30, 59, 60 and 61 days out; the first
   * four appear and the fifth does not. The records are built here rather than
   * added to the producing module's seed — this module owns no record and
   * re-seeds nothing.
   */
  it('TEST-DOH-14-N1: 5, 30, 59 and 60 days appear; 61 does not', () => {
    const days = [5, 30, 59, 60, 61] as const
    const register = days.map((d) => qual(`PROBE-${d}`, plusDays(AS_OF_DATE, d), d))
    const entries = calendarEntriesFor('TENANT_ADMIN', register, DOH_WORKERS, DOH_CLEARANCES)
    const ids = entries.map((e) => e.qualificationId).sort()
    expect(ids).toEqual(['PROBE-30', 'PROBE-5', 'PROBE-59', 'PROBE-60'])
    // Non-vacuity in both directions: four in, exactly one out, and the one
    // out is named — a projection that returned nothing would fail the first
    // assertion, and one that returned everything would fail this pair.
    expect(entries).toHaveLength(4)
    expect(ids).not.toContain('PROBE-61')
  })
})

describe('MOD-DOH-14 — the nine-week grid is the horizon drawn, and nothing else', () => {
  it('carries nine weeks whose dates are the day offsets they claim', () => {
    expect(CALENDAR_WEEKS).toHaveLength(CALENDAR_WEEK_COUNT)
    expect(CALENDAR_WEEK_COUNT).toBe(9)
    for (const week of CALENDAR_WEEKS) {
      expect(week.firstDate, `week ${week.index} first`).toBe(plusDays(AS_OF_DATE, week.firstDay))
      expect(week.lastDate, `week ${week.index} last`).toBe(plusDays(AS_OF_DATE, week.lastDay))
    }
  })

  it('is contiguous, starts at the as-of day and stops exactly at the horizon', () => {
    expect(CALENDAR_WEEKS[0]!.firstDay).toBe(0)
    for (let i = 1; i < CALENDAR_WEEKS.length; i += 1) {
      expect(CALENDAR_WEEKS[i]!.firstDay, `gap before week ${i + 1}`).toBe(
        CALENDAR_WEEKS[i - 1]!.lastDay + 1,
      )
    }
    const last = CALENDAR_WEEKS[CALENDAR_WEEKS.length - 1]!
    expect(last.lastDay).toBe(HORIZON_DAYS)
    expect(last.lastDate).toBe(HORIZON_END_DATE)
    // The ninth week is deliberately SHORT: nine seven-day buckets are 63 days
    // and the horizon is 61. A ninth week of seven days would show two days
    // outside the horizon, so the truncation is the rule and not an accident.
    expect(last.lastDay - last.firstDay + 1).toBe(5)
    for (const week of CALENDAR_WEEKS.slice(0, -1)) {
      expect(week.lastDay - week.firstDay + 1, `week ${week.index} length`).toBe(7)
    }
  })

  it('places a date in exactly one week, and outside the horizon in none', () => {
    for (let d = 0; d <= HORIZON_DAYS; d += 1) {
      const matches = CALENDAR_WEEKS.filter((w) => {
        const date = plusDays(AS_OF_DATE, d)
        return date >= w.firstDate && date <= w.lastDate
      })
      expect(matches, `day ${d}`).toHaveLength(1)
    }
    expect(weekFor(plusDays(AS_OF_DATE, -1))).toBeNull()
    expect(weekFor(plusDays(AS_OF_DATE, HORIZON_DAYS + 1))).toBeNull()
  })

  /**
   * THE INVARIANT THAT KEEPS THE TWO HALVES OF A ROW FROM CONTRADICTING EACH
   * OTHER. A record is placed by `expiryDate`; the chip beside it is read from
   * `daysToExpiry`. The producing module ties those two together by test. This
   * asserts the consequence here: the week a record lands in must be the week
   * whose day range contains the count its own chip reads from.
   */
  it('a record’s week by DATE contains the day count its chip reads', () => {
    const placed = DOH_QUALIFICATIONS.filter((q) => withinHorizon(q.expiryDate))
    expect(placed.length).toBeGreaterThan(0)
    for (const q of placed) {
      const week = weekFor(q.expiryDate)
      expect(week, q.id).not.toBeNull()
      expect(q.daysToExpiry, `${q.id} lower`).toBeGreaterThanOrEqual(week!.firstDay)
      expect(q.daysToExpiry, `${q.id} upper`).toBeLessThanOrEqual(week!.lastDay)
    }
  })
})

describe('MOD-DOH-14 — scope bounds the read', () => {
  const roles = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'] as const

  function entriesFor(role: TenantRoleId): readonly CalendarEntry[] {
    return calendarEntriesFor(role, DOH_QUALIFICATIONS, DOH_WORKERS, DOH_CLEARANCES)
  }

  it('every entry sits in an Area the reader’s scope admits', () => {
    for (const role of roles) {
      const admitted = calendarAreaIdsFor(role)
      const entries = entriesFor(role)
      expect(entries.length, role).toBeGreaterThan(0)
      for (const e of entries) expect(admitted, `${role} / ${e.qualificationId}`).toContain(e.areaId)
    }
  })

  it('the Supervisor reads a STRICT subset of the tenant-wide view', () => {
    const wide = entriesFor('QUALITY_MANAGER').map((e) => `${e.qualificationId}|${e.areaId}`)
    const narrow = entriesFor('SUPERVISOR').map((e) => `${e.qualificationId}|${e.areaId}`)
    // Bracketed on both sides: an empty narrow view passes a bare "is a
    // subset", and an identical one passes it too. Neither passes this.
    expect(narrow.length).toBeGreaterThan(0)
    expect(narrow.length).toBeLessThan(wide.length)
    for (const key of narrow) expect(wide).toContain(key)
    // And the withheld row is NAMED, so a filter keyed on the wrong field
    // cannot pass by dropping a different one.
    const withheld = wide.filter((k) => !narrow.includes(k))
    expect(withheld).toContain('QUAL-0311-METROLOGY|AREA-ARD-QC')
  })

  /**
   * The Quality Manager is widened BY ROLE on this one screen. Both halves of
   * that sentence are asserted, because only the pair is the claim: the seeded
   * scope table still says Site, and the Calendar still reads tenant-wide.
   */
  it('widens the Quality Manager by role, past the Site scope the workspace holds them to', () => {
    expect(calendarScopeFor('QUALITY_MANAGER')).toBe('tenant-wide-by-role')
    expect(SEEDED_ROLE_SCOPES.QUALITY_MANAGER.scope).toBe('site')
    const byRole = calendarAreaIdsFor('QUALITY_MANAGER')
    const bySeededScope = visibleAreaIds('QUALITY_MANAGER')
    expect(byRole.length).toBeGreaterThan(bySeededScope.length)
    // Observable, not merely asserted: a real Area the Site scope excludes.
    expect(byRole).toContain('AREA-ARD-STORE')
    expect(bySeededScope).not.toContain('AREA-ARD-STORE')
    // Nobody else is widened.
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'READONLY_AUDITOR', 'WORKER'] as const) {
      expect(calendarScopeFor(role), role).toBe('seeded-role-scope')
      expect([...calendarAreaIdsFor(role)].sort(), role).toEqual([...visibleAreaIds(role)].sort())
    }
  })

  it('a filter can only narrow a set the scope already bounded', () => {
    const entries = entriesFor('SUPERVISOR')
    const admitted = calendarAreaIdsFor('SUPERVISOR')
    // An Area the Supervisor cannot see, named into the filter directly.
    const outOfScope = applyFilters(entries, { ...NO_FILTERS, areaId: 'AREA-ARD-QC' })
    expect(admitted).not.toContain('AREA-ARD-QC')
    expect(outOfScope).toHaveLength(0)
    // And a legal filter narrows rather than widens.
    const narrowed = applyFilters(entries, { ...NO_FILTERS, areaId: 'AREA-ARD-PAINT' })
    expect(narrowed.length).toBeGreaterThan(0)
    expect(narrowed.length).toBeLessThan(entries.length)
    expect(filtersAreActive({ ...NO_FILTERS, areaId: 'AREA-ARD-PAINT' })).toBe(true)
    expect(filtersAreActive(NO_FILTERS)).toBe(false)
  })

  it('lists already-lapsed certificates apart from the grid, never inside it', () => {
    const lapsed = alreadyLapsedFor('TENANT_ADMIN', DOH_QUALIFICATIONS, DOH_WORKERS, DOH_CLEARANCES)
    expect(lapsed.length).toBeGreaterThan(0)
    for (const e of lapsed) expect(e.expiryDate < AS_OF_DATE, e.qualificationId).toBe(true)
    const inGrid = entriesFor('TENANT_ADMIN').map((e) => e.qualificationId)
    for (const e of lapsed) expect(inGrid).not.toContain(e.qualificationId)
  })
})

describe('MOD-DOH-14 — the cell key is (week, Area) and can never be (worker)', () => {
  it('cellCount takes a week and an Area, and has nowhere to put a worker', () => {
    expect(cellCount.length).toBe(3)
    const entries = calendarEntriesFor(
      'TENANT_ADMIN',
      DOH_QUALIFICATIONS,
      DOH_WORKERS,
      DOH_CLEARANCES,
    )
    const week = weekFor('2026-08-25')!
    expect(cellCount(entries, week.index, 'AREA-ARD-PAINT')).toBeGreaterThan(0)
    expect(cellCount(entries, week.index, 'AREA-ARD-STORE')).toBe(0)
    // The grid's total equals the projection's size, so no row is counted
    // twice by the drawing and none is dropped by it.
    const total = CALENDAR_WEEKS.flatMap((w) =>
      [...new Set(entries.map((e) => e.areaId))].map((a) => cellCount(entries, w.index, a)),
    ).reduce((a, b) => a + b, 0)
    expect(total).toBe(entries.length)
  })

  it('no key of a calendar row names a behavioural measure on a person', () => {
    const entries = calendarEntriesFor(
      'TENANT_ADMIN',
      DOH_QUALIFICATIONS,
      DOH_WORKERS,
      DOH_CLEARANCES,
    )
    // These rows genuinely ARE about people, which is the half of the question
    // the shared matcher does not answer for itself.
    expect(entries.length).toBeGreaterThan(3)
    for (const entry of entries) {
      for (const key of Object.keys(entry)) {
        expect(namesPersonBehaviouralMeasure(key), `${entry.qualificationId}.${key}`).toBe(false)
      }
    }
    // Proved in the other direction too: the matcher is live, not asleep.
    expect(namesPersonBehaviouralMeasure('expiriesPerWorker')).toBe(true)
    expect(namesPersonBehaviouralMeasure('recertificationRate')).toBe(true)
  })

  it('neither source file cuts by worker or names a per-worker measure', () => {
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      // The DENIAL is exempt, and the exemption is one named construct rather
      // than a widened pattern: `ForbiddenMeasureField` exists precisely to
      // spell these names out so the compiler can refuse them, and a gate that
      // matched its own denial would be the fourth recorded instance of that
      // defect in this build. Every other line is scanned, word-boundary
      // matched against the identifier forms a per-worker cut would take.
      const scanned = src
        .split('\n')
        .filter((line) => !/ForbiddenMeasureField/.test(line))
        .join('\n')
      expect(scanned, name).not.toMatch(
        /\bperWorker\b|\bbyWorker\b|\bworkerCount\b|\bexpiryFrequency\b|\bworkerRunCount\b/,
      )
    }
    // The exemption is narrow and real: exactly TWO lines in the fixtures file
    // carry it — the type alias that spells the forbidden names out, and the
    // `Extract` that refuses them — and both are the compile-time denial.
    expect(FIXTURES_SRC.split('\n').filter((l) => /ForbiddenMeasureField/.test(l))).toHaveLength(2)
    expect(SCREEN_SRC).not.toMatch(/ForbiddenMeasureField/)
    // Proof the scan is live rather than exempted into silence.
    expect(
      'const x = { workerRunCount: 1 }'
        .split('\n')
        .filter((line) => !/ForbiddenMeasureField/.test(line))
        .join('\n'),
    ).toMatch(/\bworkerRunCount\b/)
    // The worker dimension is not merely missing: it is refused by name.
    expect(CALENDAR_FILTER_DIMENSIONS).toEqual(['week', 'area', 'certification-type'])
    expect(ABSENT_BY_RULE.map((a) => a.label)).toContain('Filter or group by worker')
  })
})

describe('MOD-DOH-14 — the six-row matrix, verified at source L29343-L29350', () => {
  const tenantRoles = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]

  it('carries six rows with an explicit status and detail in every one of the thirty cells', () => {
    expect(CONTROL_MATRIX).toHaveLength(6)
    for (const row of CONTROL_MATRIX) {
      expect(Object.keys(row.status).sort(), row.id).toEqual([...tenantRoles].sort())
      expect(Object.keys(row.detail).sort(), row.id).toEqual([...tenantRoles].sort())
      for (const role of tenantRoles) {
        expect(CONTROL_STATUSES, `${row.id}/${role}`).toContain(row.status[role])
        expect(row.detail[role]!.length, `${row.id}/${role}`).toBeGreaterThan(0)
      }
      expect(row.rendering.length).toBeGreaterThan(0)
      expect(row.sourceRef).toMatch(/^L29\d{3}$/)
    }
  })

  it('carries the four cells the source qualifies, verbatim in substance', () => {
    expect(statusFor('open-the-calendar', 'QUALITY_MANAGER')).toBe('allowed')
    expect(statusFor('open-the-calendar', 'SUPERVISOR')).toBe('read-only')
    expect(statusFor('open-the-calendar', 'TENANT_ADMIN')).toBe('read-only')
    expect(statusFor('open-the-calendar', 'READONLY_AUDITOR')).toBe('read-only')
    expect(statusFor('open-the-calendar', 'WORKER')).toBe('unavailable')
    // The inversion the source built on purpose: the owner cannot act.
    expect(statusFor('record-a-recertification-from-the-calendar', 'QUALITY_MANAGER')).toBe(
      'explicitly-prohibited',
    )
    expect(statusFor('record-a-recertification-from-the-calendar', 'TENANT_ADMIN')).toBe(
      'allowed-with-conditions',
    )
  })

  it('prohibits the horizon change for all five and marks export not-applicable for all five', () => {
    for (const role of tenantRoles) {
      expect(statusFor('change-the-horizon', role), role).toBe('explicitly-prohibited')
      expect(statusFor('export-the-calendar', role), role).toBe('not-applicable')
    }
    // Neither renders anything, so neither can be reached through any list.
    expect(rolesWithStatus('change-the-horizon', READING_STATUSES)).toEqual([])
    expect(rolesWithStatus('export-the-calendar', READING_STATUSES)).toEqual([])
  })

  it('derives every allowed-roles list from the matrix rather than a hand-written list', () => {
    expect(rolesWithStatus('open-the-calendar', READING_STATUSES)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
    // Non-vacuous: the derivation reads the STATUS, not the row's existence.
    expect(rolesWithStatus('open-the-calendar', ['allowed'])).toEqual(['QUALITY_MANAGER'])
    expect(rolesWithStatus('open-the-calendar', ['unavailable'])).toEqual(['WORKER'])
    // And no role list is written into either source file by hand.
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      expect(src, name).not.toMatch(/allowedRoles:\s*\[/)
    }
  })
})

/**
 * THE CROSS-CHECK. The module rail reads `rolesReaching` on this module's
 * spine definition; this screen renders its own matrix; the two must not
 * drift. The rule: the roles the spine withholds the route from are exactly
 * the roles this matrix marks `unavailable`.
 *
 * NON-VACUOUS THREE WAYS, because an equality between two independently
 * computed sets passes against a broken spine if both collapse.
 */
describe('MOD-DOH-14 — the rail and this matrix agree about who reaches the module', () => {
  it('withholds the route from exactly the roles the matrix marks unavailable', () => {
    const tenantRoles = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]
    expect(Object.keys(CONTROL_MATRIX[0]!.status).sort()).toEqual([...tenantRoles].sort())

    const withheldByTheMatrix = tenantRoles.filter((role) =>
      CONTROL_MATRIX.some((row) => row.status[role] === 'unavailable'),
    )
    const withheldByTheSpine = tenantRoles.filter(
      (role) => !dohModuleById('MOD-DOH-14').rolesReaching.includes(role),
    )
    expect([...withheldByTheSpine].sort()).toEqual([...withheldByTheMatrix].sort())

    // 1. the withheld set is exactly the Worker, not merely equal to itself;
    expect(withheldByTheMatrix).toEqual(['WORKER'])
    // 2. the spine's own count is pinned — four roles reach this module;
    expect(dohModuleById('MOD-DOH-14').rolesReaching).toHaveLength(4)
    // 3. the matrix still uses the OTHER prohibition token somewhere, so the
    //    equality cannot be satisfied by merging the two into one.
    expect(
      CONTROL_MATRIX.some((row) =>
        Object.values(row.status).includes('explicitly-prohibited'),
      ),
    ).toBe(true)
  })
})

describe('MOD-DOH-14 — the panels the contract requires, and the module owning no record', () => {
  it('walks eight applicable screen states and names five that never render', () => {
    expect([...APPLICABLE_SCREEN_STATES]).toEqual([
      'STATE-01',
      'STATE-02',
      'STATE-03',
      'STATE-05',
      'STATE-06',
      'STATE-08',
      'STATE-12',
      'STATE-13',
    ])
    expect(INAPPLICABLE_SCREEN_STATES.map((s) => s.id)).toEqual([
      'STATE-04',
      'STATE-07',
      'STATE-09',
      'STATE-10',
      'STATE-11',
    ])
    for (const s of INAPPLICABLE_SCREEN_STATES) expect(s.why.length).toBeGreaterThan(20)
  })

  it('carries the unspecified and unresolved panels, and records the unsettled rendering', () => {
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(3)
    expect(UNRESOLVED_IN_SOURCE.length).toBeGreaterThan(3)
    expect(UNRESOLVED_IN_SOURCE.join(' ')).toMatch(/UNSETTLED/)
    expect(UNRESOLVED_IN_SOURCE.join(' ')).toMatch(/"Explicitly prohibited" carries no rendering/)
    expect(UNRESOLVED_IN_SOURCE.join(' ')).toMatch(/"Unavailable" is overloaded/)
    // The worker-filter divergence is recorded, not quietly taken.
    expect(UNRESOLVED_IN_SOURCE.join(' ')).toMatch(/four filter dimensions/)
  })

  it('renders D24 and the other decisions this screen turns on', () => {
    expect(DECISIONS_ON_SCREEN.map((d) => d.ref)).toEqual(['D1', 'D7', 'D8', 'D11', 'D24'])
    for (const d of DECISIONS_ON_SCREEN) expect(d.statement.length).toBeGreaterThan(40)
  })

  it('quotes SB-DOH-026’s fixed footer without rewording it', () => {
    expect(GRID_FOOTER_COPY).toBe(
      'This view covers the next 60 days tenant-wide. Recertification is recorded on the worker record.',
    )
  })

  it('re-seeds nothing: every record is read from the producing module', () => {
    for (const producerExport of [
      /export const DOH_WORKERS\s*=/,
      /export const DOH_QUALIFICATIONS\s*=/,
      /export const DOH_CLEARANCES\s*=/,
      /export const SEEDED_ROLE_SCOPES\s*=/,
    ]) {
      expect(FIXTURES_SRC, String(producerExport)).not.toMatch(producerExport)
    }
    expect(FIXTURES_SRC).toMatch(/from '\.\.\/worker-lifecycle-and-qualifications\/fixtures'/)
    expect(FIXTURES_SRC).toMatch(/from '\.\.\/location-configuration\/fixtures'/)
    // And the calendar reads the register it is handed, not a module-load Map.
    expect(calendarEntriesFor.length).toBe(4)
    expect(alreadyLapsedFor.length).toBe(4)
  })

  it('reads no clock anywhere in the module', () => {
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      expect(src, name).not.toMatch(/Date\.now\(|new Date\(|Math\.random\(/)
    }
  })

  it('closes its own vocabularies', () => {
    expect([...CALENDAR_SCOPES]).toEqual(['tenant-wide-by-role', 'seeded-role-scope'])
    expect(CONTROL_STATUSES).toHaveLength(6)
  })
})

/**
 * The screen used to say, in "Route to action", that MOD-DOH-14 reached no
 * registered cross-slice seam and that the gap was recorded in the
 * unspecified panel instead. The registry now carries that row
 * (`certification-expiry-digest`, consumed by MOD-DOH-14, owned by
 * MOD-DOH-10), so that disclosure has rotted on purpose: the load-bearing
 * claim flips to this — the seam resolves, names its real owner, and the
 * screen renders it through the shared `SeamNotice` component rather than a
 * hand-rolled copy of one.
 */
describe('MOD-DOH-14 — the cross-slice dependency this screen names', () => {
  it('resolves in the shared seam registry, owned by Notifications (MOD-DOH-10) in slice 10', () => {
    const seam = dohSeamById('certification-expiry-digest')
    expect(seam.consumingModule).toBe('MOD-DOH-14')
    expect(seam.ownerModule).toBe('MOD-DOH-10')
    expect(seam.ownerSlice).toBe(10)
    // Not vacuous: this row sits alongside the others rather than replacing
    // them.
    const consumers: readonly string[] = DOH_SEAMS.map((s) => s.consumingModule)
    expect(consumers).toContain('MOD-DOH-14')
    expect(consumers).toContain('MOD-DOH-12')
  })

  it('renders the seam through the shared SeamNotice component, not a local copy', () => {
    expect(SCREEN_SRC).toMatch(/<SeamNotice\s+seamId="certification-expiry-digest"\s*\/>/)
    // A hand-rolled copy would hardcode the notice's own heading text; the
    // shared component owns that text now, so the screen names only an id.
    expect(SCREEN_SRC).not.toMatch(/Cross-slice seam — not built here/)
    // The false claim it replaced, and the gap statement it required, are
    // both gone from the screen and the fixtures.
    expect(SCREEN_SRC).not.toMatch(/reaches no REGISTERED cross-slice seam/)
    expect(FIXTURES_SRC).not.toMatch(/seam registry carries NO entry for this module/)
  })
})
