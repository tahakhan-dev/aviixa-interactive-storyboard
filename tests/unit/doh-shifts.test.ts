import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { namesPersonBehaviouralMeasure } from '../coverage/person-measure-keys'
import {
  ABSENT_BY_RULE,
  ACTING_STATUSES,
  ARCHIVAL_REFUSAL_NOTICE_STATES,
  CONTROL_MATRIX,
  CONTROL_STATUSES,
  DECISIONS_ON_SCREEN,
  DOH_SHIFTS,
  ESCALATION_KEY,
  MINUTES_IN_DAY,
  PLATFORM_DEFAULT_DIGEST_TIME,
  READING_STATUSES,
  SHIFT_ANCHORS,
  SHIFT_CARDINALITY_OPTIONS,
  SHIFT_STATES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  areasWithNoBoundShift,
  blocksOverlap,
  digestTimeBoundFor,
  formatMinutes,
  minutesFromMidnight,
  overlapConflict,
  rolesWithStatus,
  selectableAreasFor,
  shiftById,
  shiftTimezone,
  shiftsForArea,
  shiftsVisibleTo,
  timeSegments,
  type ControlMatrixRow,
  type Shift,
} from '../../app/hub/shift-management/fixtures'
import {
  DOH_AREAS,
  DOH_SITES,
  siteById,
  type LocationArea,
} from '../../app/hub/location-configuration/fixtures'
import { TENANT_STATES, writeAllowed } from '@/surfaces/doh/tenant-state'
import { dohModuleById } from '@/surfaces/doh/modules'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../app/hub/HubShell'

/** Widened view of the seeded tuple: `as const` narrows each `areaIds` to its
 *  own literal tuple, which makes `.includes` uncallable with a plain string.
 *  The screen gets the same widening from `useState`. */
const SHIFTS: readonly Shift[] = DOH_SHIFTS
const AREAS: readonly LocationArea[] = DOH_AREAS

/**
 * Widened, and deliberately so. `CONTROL_MATRIX` is `as const satisfies`, so
 * every cell is narrowed to the literal it actually holds — which means the
 * COMPILER already refuses `row.status[role] === 'unavailable'` as a
 * comparison with no overlap, and that is itself a proof this matrix carries
 * no such cell. The runtime cross-check below still has to run against the
 * spine, so it reads the matrix through its declared type rather than through
 * the narrowed literal: a check that cannot be written is not a check.
 */
const MATRIX: readonly ControlMatrixRow[] = CONTROL_MATRIX

const MY_FILES = [
  'app/hub/shift-management/fixtures.ts',
  'app/hub/shift-management/ShiftManagementScreen.tsx',
  'app/hub/shift-management/page.tsx',
]

/* ------------------------------------------------------------------ *
 * TIMEZONE INHERITANCE. The property this module exists to hold, and
 * the reason it is held in the TYPE rather than in prose: there is no
 * field on a Shift for a timezone, and no field on an Area either, so
 * a Shift cannot read one from anywhere but its Site.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — a Shift inherits its Site’s timezone, structurally', () => {
  it('gives no Shift a timezone field of its own, so nothing can drift from the Site’s', () => {
    for (const shift of DOH_SHIFTS) {
      expect(Object.hasOwn(shift, 'timezone'), shift.id).toBe(false)
    }
    // The other half of the same rule, held by the producing module: an Area
    // carries none either, so there is no Area-level value to read by
    // accident. Asserted here as well because THIS module is the one that
    // would read it — a regression there is a defect here.
    for (const area of DOH_AREAS) {
      expect(Object.hasOwn(area, 'timezone'), area.id).toBe(false)
    }
  })

  it('resolves every Shift’s timezone through its parent Site and nowhere else', () => {
    for (const shift of DOH_SHIFTS) {
      const site = siteById(shift.siteId)
      expect(site, shift.id).toBeDefined()
      expect(shiftTimezone(shift.siteId), shift.id).toBe(site?.timezone)
    }
  })

  it('gives Shifts on different Sites different timezones, so inheritance is doing work', () => {
    const byTimezone = new Set(DOH_SHIFTS.map((s) => shiftTimezone(s.siteId)))
    // Not vacuous: a hard-coded timezone, or a single-Site fixture, collapses
    // this set to one member and the case goes red.
    expect(byTimezone.size).toBeGreaterThan(1)
    expect(shiftTimezone('SITE-ARD-01')).toBe('Europe/London')
    expect(shiftTimezone('SITE-ARD-02')).toBe('Europe/Warsaw')
  })

  it('returns null rather than a default when the Shift names a Site this workspace does not hold', () => {
    expect(shiftTimezone('SITE-NOT-SEEDED')).toBeNull()
    expect(digestTimeBoundFor('SITE-NOT-SEEDED')).toBeNull()
  })

  it('binds the digest-time field to the parent Site’s timezone, and pre-fills the platform default', () => {
    expect(PLATFORM_DEFAULT_DIGEST_TIME).toBe('06:00')
    for (const site of DOH_SITES) {
      expect(digestTimeBoundFor(site.id), site.id).toBe(site.timezone)
    }
    // The same 06:00 on two Sites is two different moments. A Shift on each,
    // both at the default, proves the field alone is not the schedule.
    const london = DOH_SHIFTS.find((s) => s.siteId === 'SITE-ARD-01' && s.digestTime === '06:00')
    const warsaw = DOH_SHIFTS.find((s) => s.siteId === 'SITE-ARD-02' && s.digestTime === '06:00')
    expect(london).toBeDefined()
    expect(warsaw).toBeDefined()
    expect(digestTimeBoundFor(london?.siteId ?? '')).not.toBe(
      digestTimeBoundFor(warsaw?.siteId ?? ''),
    )
  })
})

/* ------------------------------------------------------------------ *
 * The overlap refusal — AC-51-13 (L113055), verified by TEST-51-13.
 * The pure logic of this module, and the place a one-character slip
 * has a real consequence: an inclusive endpoint refuses every ordinary
 * pair of adjacent shifts, an exclusive one lets a genuine overlap
 * through.
 * ------------------------------------------------------------------ */

describe('minutesFromMidnight and timeSegments', () => {
  it('parses a wall-clock time and refuses anything that is not one', () => {
    expect(minutesFromMidnight('00:00')).toBe(0)
    expect(minutesFromMidnight('06:00')).toBe(360)
    expect(minutesFromMidnight('23:59')).toBe(MINUTES_IN_DAY - 1)
    for (const bad of ['', '6:00', '24:00', '12:60', 'noon', '06:00:00', '0600']) {
      expect(minutesFromMidnight(bad), bad).toBeNull()
    }
  })

  it('round-trips through formatMinutes', () => {
    for (const t of ['00:00', '06:00', '13:45', '23:59']) {
      const minutes = minutesFromMidnight(t)
      expect(minutes, t).not.toBeNull()
      if (minutes === null) continue
      expect(formatMinutes(minutes)).toBe(t)
    }
  })

  it('splits a block that wraps midnight into two segments and leaves an ordinary one whole', () => {
    expect(timeSegments(360, 840)).toEqual([[360, 840]])
    expect(timeSegments(1320, 360)).toEqual([
      [1320, MINUTES_IN_DAY],
      [0, 360],
    ])
    // Fail-closed: a zero-length block covers the whole day rather than none
    // of it, so it can never be the reason two blocks are declared distinct.
    expect(timeSegments(600, 600)).toEqual([
      [600, MINUTES_IN_DAY],
      [0, 600],
    ])
  })
})

describe('blocksOverlap — the rule AC-51-13 states', () => {
  it('TEST-51-13: refuses 06:00-14:00 against 13:00-21:00, the pair the criterion names', () => {
    expect(
      blocksOverlap(
        { nominalStart: '06:00', nominalEnd: '14:00' },
        { nominalStart: '13:00', nominalEnd: '21:00' },
      ),
    ).toBe(true)
  })

  it('permits two blocks that touch at an endpoint, because a shift ends where the next begins', () => {
    expect(
      blocksOverlap(
        { nominalStart: '06:00', nominalEnd: '14:00' },
        { nominalStart: '14:00', nominalEnd: '22:00' },
      ),
    ).toBe(false)
    expect(
      blocksOverlap(
        { nominalStart: '22:00', nominalEnd: '06:00' },
        { nominalStart: '06:00', nominalEnd: '14:00' },
      ),
    ).toBe(false)
  })

  it('sees an overlap that only exists on the far side of midnight', () => {
    // 22:00-06:00 and 05:00-09:00 share 05:00-06:00, which lies in the
    // wrapped segment. A comparison that ignored the wrap would call these
    // disjoint, and two Shifts would sit on one Area at five in the morning.
    expect(
      blocksOverlap(
        { nominalStart: '22:00', nominalEnd: '06:00' },
        { nominalStart: '05:00', nominalEnd: '09:00' },
      ),
    ).toBe(true)
    expect(
      blocksOverlap(
        { nominalStart: '22:00', nominalEnd: '06:00' },
        { nominalStart: '23:00', nominalEnd: '01:00' },
      ),
    ).toBe(true)
  })

  it('is symmetric, and refuses a block it cannot parse rather than passing it', () => {
    const a = { nominalStart: '10:00', nominalEnd: '18:00' }
    const b = { nominalStart: '17:00', nominalEnd: '20:00' }
    expect(blocksOverlap(a, b)).toBe(blocksOverlap(b, a))
    expect(blocksOverlap(a, { nominalStart: 'later', nominalEnd: '20:00' })).toBe(true)
  })
})

describe('overlapConflict — the refusal, over the register the caller holds', () => {
  it('names the conflicting Shift and the Area it collides on', () => {
    const conflict = overlapConflict(
      { areaIds: ['AREA-ARD-ASSY'], nominalStart: '13:00', nominalEnd: '21:00' },
      SHIFTS,
    )
    expect(conflict).not.toBeNull()
    expect(conflict?.areaId).toBe('AREA-ARD-ASSY')
    expect(conflict?.shift.id).toBe('SHIFT-ARD-EARLY')
  })

  it('permits the same block on an Area that holds nothing overlapping it', () => {
    expect(
      overlapConflict(
        { areaIds: ['AREA-ARD-PACK'], nominalStart: '13:00', nominalEnd: '21:00' },
        SHIFTS,
      ),
    ).toBeNull()
  })

  it('never conflicts a Shift with itself, so an edit that moves nothing is not refused', () => {
    const early = shiftById('SHIFT-ARD-EARLY')
    expect(early).toBeDefined()
    if (!early) return
    expect(overlapConflict({ ...early }, SHIFTS)).toBeNull()
  })

  it('ignores an archived Shift, so a retired one cannot make an Area permanently unusable', () => {
    // Proved in both directions against ONE register, so the only thing that
    // differs between the two answers is the state token. 11:00-12:00 on the
    // Paint Line sits squarely inside Twilight's 10:00-18:00; drop the
    // archived check and the first assertion goes red.
    const archived = SHIFTS.filter((s) => s.state === 'archived')
    expect(archived.map((s) => s.id)).toEqual(['SHIFT-ARD-TWILIGHT'])
    const candidate = {
      areaIds: ['AREA-ARD-PAINT'],
      nominalStart: '11:00',
      nominalEnd: '12:00',
    }
    expect(overlapConflict(candidate, archived)).toBeNull()

    const revived: readonly Shift[] = archived.map((s) => ({ ...s, state: 'active' }))
    expect(overlapConflict(candidate, revived)?.shift.id).toBe('SHIFT-ARD-TWILIGHT')
  })

  it('reads the register it is handed, not the seed, so a Shift created in a session counts', () => {
    const added: Shift = {
      id: 'SHIFT-SESSION-01',
      siteId: 'SITE-ARD-01',
      name: 'Created in this session',
      nominalStart: '09:00',
      nominalEnd: '11:00',
      areaIds: ['AREA-ARD-PACK'],
      digestTime: '06:00',
      state: 'active',
      scheduledRunIds: [],
      note: 'test-only',
    }
    const candidate = {
      areaIds: ['AREA-ARD-PACK'],
      nominalStart: '10:00',
      nominalEnd: '12:00',
    }
    expect(overlapConflict(candidate, SHIFTS)).toBeNull()
    expect(overlapConflict(candidate, [...SHIFTS, added])?.shift.id).toBe('SHIFT-SESSION-01')
  })
})

/* ------------------------------------------------------------------ *
 * The seeded register, and its agreement with the module that owns
 * the Sites and Areas underneath it.
 * ------------------------------------------------------------------ */

describe('the seeded Shift register', () => {
  it('carries unique ids, only the two object states, and a well-formed nominal block each', () => {
    expect(new Set(DOH_SHIFTS.map((s) => s.id)).size).toBe(DOH_SHIFTS.length)
    for (const shift of DOH_SHIFTS) {
      expect(SHIFT_STATES, shift.id).toContain(shift.state)
      expect(minutesFromMidnight(shift.nominalStart), shift.id).not.toBeNull()
      expect(minutesFromMidnight(shift.nominalEnd), shift.id).not.toBeNull()
      expect(minutesFromMidnight(shift.digestTime), shift.id).not.toBeNull()
      expect(shift.nominalStart, shift.id).not.toBe(shift.nominalEnd)
      expect(shiftById(shift.id)?.name, shift.id).toBe(shift.name)
    }
    expect(shiftById('SHIFT-NOT-SEEDED')).toBeUndefined()
  })

  it('never lets a Shift span Sites: every bound Area belongs to the Shift’s own Site', () => {
    for (const shift of DOH_SHIFTS) {
      for (const areaId of shift.areaIds) {
        const area = DOH_AREAS.find((a) => a.id === areaId)
        expect(area, `${shift.id} → ${areaId}`).toBeDefined()
        expect(area?.siteId, `${shift.id} → ${areaId}`).toBe(shift.siteId)
      }
    }
  })

  it('offers only the parent Site’s own active Areas for binding, which is where the no-span rule lives', () => {
    for (const site of DOH_SITES) {
      for (const area of selectableAreasFor(site.id)) {
        expect(area.siteId, area.id).toBe(site.id)
        expect(area.state, area.id).toBe('active')
      }
    }
    const offered = selectableAreasFor('SITE-ARD-01').map((a) => a.id)
    expect(offered).toContain('AREA-ARD-ASSY')
    expect(offered).not.toContain('AREA-ARD-POLISH')
    // An archived Area is not offered, and the archived Site holds only one.
    expect(selectableAreasFor('SITE-ARD-04')).toEqual([])
  })

  it('holds no overlap anywhere in the seed, so the screen opens in a state its own rule permits', () => {
    for (const shift of DOH_SHIFTS) {
      if (shift.state !== 'active') continue
      expect(overlapConflict({ ...shift }, SHIFTS), shift.id).toBeNull()
    }
  })

  it('agrees with the in-use badge the location module already publishes on each Site', () => {
    // The producing module states "4 Shifts" on Ardenfield Works and
    // "2 Shifts" on Kelvin Road. Two fixtures describing one tenant must not
    // disagree about it; add or drop a Shift without touching that badge and
    // this goes red.
    for (const site of DOH_SITES) {
      const badge = site.inUseBy.find((entry) => /\bShifts?\b/.test(entry))
      const seeded = DOH_SHIFTS.filter((s) => s.siteId === site.id).length
      if (badge === undefined) {
        expect(seeded, site.id).toBe(0)
        continue
      }
      expect(badge, site.id).toBe(`${seeded} Shifts`)
    }
  })

  it('leaves exactly the Areas the location module flags unbound with no bound Shift', () => {
    const withNoShift = areasWithNoBoundShift(SHIFTS).map((a) => a.id)
    const flaggedUnbound = AREAS.filter(
      (a) => a.state === 'active' && a.flags.includes('unbound'),
    ).map((a) => a.id)
    expect([...withNoShift].sort()).toEqual([...flaggedUnbound].sort())
    // Not vacuous: the sets are non-empty and the rest of the active Areas
    // genuinely hold a Shift.
    expect(withNoShift.length).toBeGreaterThan(0)
    expect(withNoShift.length).toBeLessThan(
      AREAS.filter((a) => a.state === 'active').length,
    )
  })

  it('recomputes the unbound set from the register it is handed rather than from the seed', () => {
    const bindPack: readonly Shift[] = SHIFTS.map((s) =>
      s.id === 'SHIFT-ARD-EARLY' ? { ...s, areaIds: [...s.areaIds, 'AREA-ARD-PACK'] } : s,
    )
    expect(areasWithNoBoundShift(SHIFTS).map((a) => a.id)).toContain('AREA-ARD-PACK')
    expect(areasWithNoBoundShift(bindPack).map((a) => a.id)).not.toContain('AREA-ARD-PACK')
  })

  it('resolves the Shifts on one Area from the live register, archived ones included', () => {
    expect(shiftsForArea('AREA-ARD-PAINT', SHIFTS).map((s) => s.id).sort()).toEqual(
      ['SHIFT-ARD-LATE', 'SHIFT-ARD-NIGHT', 'SHIFT-ARD-TWILIGHT'].sort(),
    )
    expect(shiftsForArea('AREA-ARD-PACK', SHIFTS)).toEqual([])
  })

  it('exposes a scheduled run only as a reference, and no run state of any kind', () => {
    const refused = DOH_SHIFTS.filter((s) => s.scheduledRunIds.length > 0)
    // Not vacuous: the archival refusal has something to refuse.
    expect(refused.length).toBeGreaterThan(0)
    for (const shift of DOH_SHIFTS) {
      for (const runId of shift.scheduledRunIds) {
        expect(typeof runId, shift.id).toBe('string')
      }
      expect(Object.keys(shift).filter((k) => /^run(?!s?Ids$)/i.test(k)), shift.id).toEqual([])
    }
  })
})

/* ------------------------------------------------------------------ *
 * Scope, read from the location module's one definition.
 * ------------------------------------------------------------------ */

describe('scope on the Shift register', () => {
  it('shows a tenant-scoped persona every Shift and an Area-scoped Supervisor only their own', () => {
    expect(shiftsVisibleTo('TENANT_ADMIN', SHIFTS)).toHaveLength(DOH_SHIFTS.length)
    expect(shiftsVisibleTo('READONLY_AUDITOR', SHIFTS)).toHaveLength(DOH_SHIFTS.length)

    const supervisor = shiftsVisibleTo('SUPERVISOR', SHIFTS)
    // Not vacuous: the Supervisor genuinely loses Shifts, and keeps some.
    expect(supervisor.length).toBeGreaterThan(0)
    expect(supervisor.length).toBeLessThan(DOH_SHIFTS.length)
    for (const shift of supervisor) {
      expect(shift.areaIds.some((a) => ['AREA-ARD-PAINT', 'AREA-ARD-ASSY'].includes(a))).toBe(true)
    }
    expect(supervisor.map((s) => s.id)).not.toContain('SHIFT-KEL-DAY')
  })

  it('shows a Site-scoped Quality Manager the Shifts of their own Sites', () => {
    const qm = shiftsVisibleTo('QUALITY_MANAGER', SHIFTS)
    for (const shift of qm) {
      expect(['SITE-ARD-01', 'SITE-ARD-02'], shift.id).toContain(shift.siteId)
    }
    expect(qm.map((s) => s.id)).toContain('SHIFT-KEL-DAY')
  })

  it('gives the Worker no Shift at all, because the Worker holds no Hub scope (D11)', () => {
    expect(shiftsVisibleTo('WORKER', SHIFTS)).toEqual([])
  })
})

/* ------------------------------------------------------------------ *
 * The tenant state gate, asserted against the ONE write-class table
 * rather than restated here.
 * ------------------------------------------------------------------ */

describe('the tenant state gate on this module’s writes', () => {
  it('blocks creating a Shift in EVERY suspension state, and opens it only in active', () => {
    expect(writeAllowed('active', 'create-shift')).toBe(true)
    for (const state of TENANT_STATES.filter((s) => s !== 'active')) {
      expect(writeAllowed(state, 'create-shift'), state).toBe(false)
    }
  })

  it('closes an edit, a binding and a digest-time change wherever configuration edits are closed', () => {
    expect(writeAllowed('active', 'edit-configuration')).toBe(true)
    for (const state of TENANT_STATES.filter((s) => s !== 'active')) {
      expect(writeAllowed(state, 'edit-configuration'), state).toBe(false)
    }
  })
})

/* ------------------------------------------------------------------ *
 * The seven-row control matrix.
 * ------------------------------------------------------------------ */

describe('the seven-row control matrix', () => {
  it('carries seven rows with a distinct id and control name each', () => {
    expect(CONTROL_MATRIX).toHaveLength(7)
    expect(new Set(CONTROL_MATRIX.map((r) => r.id)).size).toBe(7)
    expect(new Set(CONTROL_MATRIX.map((r) => r.control)).size).toBe(7)
  })

  it('declares an explicit status from the closed vocabulary in all thirty-five cells', () => {
    for (const row of CONTROL_MATRIX) {
      const cells = Object.values(row.status)
      expect(cells, row.id).toHaveLength(5)
      for (const cell of cells) expect(CONTROL_STATUSES, row.id).toContain(cell)
      expect(row.rendering.length, row.id).toBeGreaterThan(40)
      expect(row.effect.length, row.id).toBeGreaterThan(40)
      expect(row.sourceRef.length, row.id).toBeGreaterThan(4)
    }
  })

  it('gives every write to the Tenant Admin alone', () => {
    for (const id of ['create-shift', 'edit-shift', 'archive-shift', 'bind-areas', 'set-digest-time'] as const) {
      expect(rolesWithStatus(id, ACTING_STATUSES), id).toEqual(['TENANT_ADMIN'])
    }
  })

  it('gives the timezone override to nobody at all, the Tenant Admin included', () => {
    expect(rolesWithStatus('override-timezone', READING_STATUSES)).toEqual([])
    expect(rolesWithStatus('override-timezone', ACTING_STATUSES)).toEqual([])
  })

  it('gives the read to all five roles, which is what makes the Worker cell a collision', () => {
    expect(rolesWithStatus('view-shifts', READING_STATUSES)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
      'WORKER',
    ])
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
})

/* ------------------------------------------------------------------ *
 * Support-not-surveillance (S10), and the escalation key.
 * ------------------------------------------------------------------ */

describe('support-not-surveillance, held in the fixture shape itself', () => {
  it('keys no behavioural measure on a person anywhere in this module’s fixtures', () => {
    const rows: readonly Readonly<Record<string, unknown>>[] = [
      ...DOH_SHIFTS,
      ...SHIFT_ANCHORS,
      ...CONTROL_MATRIX,
      ...SHIFT_CARDINALITY_OPTIONS,
      ...ABSENT_BY_RULE,
      ...DECISIONS_ON_SCREEN,
    ]
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        expect(namesPersonBehaviouralMeasure(key), key).toBe(false)
        expect(/worker|operator|employee|person|staff/i.test(key), key).toBe(false)
      }
    }
  })

  it('keys the escalation on Area and Shift, and on nothing else', () => {
    expect([...ESCALATION_KEY]).toEqual(['Area', 'Shift'])
    expect(ESCALATION_KEY.join(' ')).not.toMatch(/worker|person|individual/i)
    const escalation = SHIFT_ANCHORS.find((a) => a.id === 'escalation')
    expect(escalation).toBeDefined()
    expect(escalation?.why).toMatch(/never against a named person/i)
    expect(escalation?.why).toMatch(/marked as a fallback/i)
  })

  it('names the metering anchor as a billing count and never as a measure of anybody', () => {
    const metering = SHIFT_ANCHORS.find((a) => a.id === 'metering')
    expect(metering).toBeDefined()
    expect(metering?.why).toMatch(/never a measure of anybody/i)
    expect(metering?.why).toMatch(/never shown as a pace/i)
  })
})

/* ------------------------------------------------------------------ *
 * The panels the per-module contract requires by name.
 * ------------------------------------------------------------------ */

describe('the required panels carry real content, not placeholders', () => {
  it('names the timezone override, the digest service and the deferred scopes as ABSENT by rule', () => {
    const labels = ABSENT_BY_RULE.map((a) => a.label).join(' | ')
    expect(labels).toMatch(/timezone override/i)
    expect(labels).toMatch(/digest service/i)
    expect(labels).toMatch(/Cell, Job and worker scoping/i)
    for (const item of ABSENT_BY_RULE) {
      expect(item.note.length, item.label).toBeGreaterThan(80)
    }
  })

  it('names the deferred cardinality, the disputed bound and the Worker collision without inventing a control', () => {
    const all = [...UNSPECIFIED_IN_SOURCE, ...UNRESOLVED_IN_SOURCE].join(' ')
    expect(all).toMatch(/DEC-SHIFT-001/)
    expect(all).toMatch(/AC-51-13/)
    expect(all).toMatch(/the bound/i)
    expect(all).toMatch(/Worker/)
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(4)
    expect(UNRESOLVED_IN_SOURCE.length).toBeGreaterThan(4)
    for (const item of [...UNSPECIFIED_IN_SOURCE, ...UNRESOLVED_IN_SOURCE]) {
      expect(item.trim().length).toBeGreaterThan(60)
    }
  })

  /**
   * THE POINTERS THIS MODULE MAKES AT ITS OWN PANELS.
   *
   * The screen tells the reader, in three places, that a question it raises is
   * "recorded as unresolved below". That is a claim about the build, and the
   * case above it — which iterates the array and asserts each element renders —
   * is structurally incapable of noticing a missing element: delete an entry and
   * it iterates one fewer time, still green, while the sentence pointing at it
   * quietly becomes a lie. One of the three pointers had in fact been broken
   * exactly that way. These assertions name the entry each pointer needs, so
   * deleting one reds a test instead of re-breaking a pointer.
   */
  it('resolves every pointer the screen makes at Unresolved in source', () => {
    const unresolved = [...UNRESOLVED_IN_SOURCE]
    // "…should render disabled with its reason, is recorded as unresolved below."
    expect(unresolved.some((i) => /disabled with its reason/i.test(i))).toBe(true)
    // "…an earliest and a latest for the value — is recorded as unresolved below."
    expect(unresolved.some((i) => /earliest and no latest/i.test(i))).toBe(true)
    // The Worker/D11 collision, pointed at from the matrix panel.
    expect(unresolved.some((i) => /Worker/.test(i) && /D11|surface decision/i.test(i))).toBe(true)
  })

  it('records exactly one adopted cardinality option and names the mitigation it ships', () => {
    expect(SHIFT_CARDINALITY_OPTIONS.filter((o) => o.adopted)).toHaveLength(1)
    expect(SHIFT_CARDINALITY_OPTIONS.find((o) => o.adopted)?.id).toBe('A')
    expect(SHIFT_CARDINALITY_OPTIONS).toHaveLength(3)
  })

  it('carries the three notification states of a refused archival, in source order', () => {
    expect([...ARCHIVAL_REFUSAL_NOTICE_STATES]).toEqual(['created', 'delivered', 'read'])
  })

  it('names every decision this screen renders with a D-reference and a real statement', () => {
    for (const decision of DECISIONS_ON_SCREEN) {
      expect(decision.ref, decision.ref).toMatch(/^D\d+$/)
      expect(decision.statement.length, decision.ref).toBeGreaterThan(60)
    }
    expect(DECISIONS_ON_SCREEN.map((d) => d.ref)).toContain('D6')
    expect(DECISIONS_ON_SCREEN.map((d) => d.ref)).toContain('D11')
  })
})

/* ------------------------------------------------------------------ *
 * The two gates that are cheapest to break and cheapest to check.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 source files — determinism and D1', () => {
  it('reads no clock and no randomness anywhere in this module', () => {
    for (const file of MY_FILES) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/Date\.now|new Date\(|Math\.random/)
    }
  })

  it('D1: writes no three-digit SCR-DOH literal anywhere in this module, and annotates the two-digit one', () => {
    for (const file of MY_FILES) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/SCR-DOH-\d{3}/)
    }
    expect(readFileSync('app/hub/shift-management/ShiftManagementScreen.tsx', 'utf8')).toMatch(
      /SCR-DOH-05/,
    )
  })

  it('names its own module id more often than any module it cross-references, so the route walk is unambiguous', () => {
    const text = MY_FILES.map((f) => readFileSync(f, 'utf8')).join('\n')
    const own = (text.match(/MOD-DOH-03/g) ?? []).length
    expect(own).toBeGreaterThan(0)
    for (const other of ['01', '02', '04', '05', '06', '07', '09', '10', '11', '12', '13', '14']) {
      const count = (text.match(new RegExp(`MOD-DOH-${other}`, 'g')) ?? []).length
      expect(own, `MOD-DOH-${other}`).toBeGreaterThan(count)
    }
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
 *
 * THIS MODULE IS THE ONE WITH NO `unavailable` CELL AT ALL, and both sides of
 * the equality are therefore empty. An emptiness compared against an emptiness
 * would be a vacuous case, so the two assertions after it do the real work:
 * the spine must reach all five roles, and this matrix must still carry
 * `explicitly-prohibited` cells. Merge the two tokens — write `unavailable`
 * where a Supervisor is explicitly prohibited from creating a Shift — and this
 * case goes red on the first assertion.
 */
describe('MOD-DOH-03 — the rail and this matrix agree about who reaches the module', () => {
  it('withholds the route from exactly the roles the matrix marks unavailable, which is none of them', () => {
    const tenantRoles = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]
    // Guards the narrowing above, and proves the sweep below covers all five.
    expect(Object.keys(CONTROL_MATRIX[0]!.status).sort()).toEqual([...tenantRoles].sort())

    const withheldByTheMatrix = tenantRoles.filter((role) =>
      MATRIX.some((row) => row.status[role] === 'unavailable'),
    )
    const withheldByTheSpine = tenantRoles.filter(
      (role) => !dohModuleById('MOD-DOH-03').rolesReaching.includes(role),
    )

    expect([...withheldByTheSpine].sort()).toEqual([...withheldByTheMatrix].sort())
    expect(withheldByTheMatrix).toEqual([])
    expect(dohModuleById('MOD-DOH-03').rolesReaching).toHaveLength(5)
    // The token that IS used, and the reason the equality above is not merely
    // an accident of an empty matrix.
    expect(
      MATRIX.some((row) => Object.values(row.status).includes('explicitly-prohibited')),
    ).toBe(true)
  })
})
