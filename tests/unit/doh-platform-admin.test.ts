import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { namesPersonBehaviouralMeasure } from '../coverage/person-measure-keys'
import {
  ABSENT_BY_RULE,
  ACCESS_CLASS_PANELS,
  ACTING_STATUSES,
  ANNOUNCEMENT_STATES,
  APPLICABLE_SCREEN_STATES,
  BANNER_TEXT_FORM,
  CONTROL_MATRIX,
  CONTROL_STATUSES,
  DECISIONS_ON_SCREEN,
  DISPUTED_ATTRIBUTIONS,
  END_SESSION_WRITE_CLASS,
  EXTEND_TIME_BOX_REASON,
  HISTORY_COLUMNS,
  HISTORY_INTRO_COPY,
  INAPPLICABLE_SCREEN_STATES,
  NO_HISTORY_FILTERS,
  READING_STATUSES,
  SCREEN_BANNERED_CLASSES,
  SEEDED_ACCESS_HISTORY,
  SEEDED_POST_SESSION_REPORT,
  SUPPORT_SESSION_STATES,
  UNREACHABLE_FROM_THE_HUB,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  accessClassPanel,
  filterHistory,
  historyDates,
  rolesWithStatus,
  screenAccessBanners,
  statusFor,
} from '../../app/hub/tenant-view-of-platform-administration/fixtures'
import { SEEDED_PLATFORM_ACCESS_SESSIONS } from '../../app/hub/banner-fixtures'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { dohModuleById } from '@/surfaces/doh/modules'
import { writeAllowed } from '@/surfaces/doh/tenant-state'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../app/hub/HubShell'

const FIXTURES_SRC = readFileSync(
  'app/hub/tenant-view-of-platform-administration/fixtures.ts',
  'utf8',
)
const SCREEN_SRC = readFileSync(
  'app/hub/tenant-view-of-platform-administration/PlatformAdministrationScreen.tsx',
  'utf8',
)

const TENANT_ROLES = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]

describe('MOD-DOH-13 — the matrix, verified at source L29195-L29206', () => {
  /**
   * THE FINDING. The brief that commissioned this screen quoted this matrix as
   * NINE rows. The frozen source carries TEN. This pins the tenth by name so a
   * later edit cannot quietly drop it back to nine.
   */
  it('carries TEN rows, not nine, and the tenth prohibits suppressing the record', () => {
    expect(CONTROL_MATRIX).toHaveLength(10)
    const last = CONTROL_MATRIX[CONTROL_MATRIX.length - 1]!
    expect(last.id).toBe('prevent-an-access-class-from-being-recorded')
    expect(last.sourceRef).toBe('L29206')
    for (const role of TENANT_ROLES) expect(last.status[role], role).toBe('explicitly-prohibited')
    // The source lines are contiguous from the header's first row, so a row
    // silently dropped from the middle leaves a gap this catches.
    const lines = CONTROL_MATRIX.map((r) => Number(r.sourceRef.replace('L', '')))
    expect(lines).toEqual([29197, 29198, 29199, 29200, 29201, 29202, 29203, 29204, 29205, 29206])
  })

  it('fills every one of the fifty cells with a status and a detail', () => {
    for (const row of CONTROL_MATRIX) {
      expect(Object.keys(row.status).sort(), row.id).toEqual([...TENANT_ROLES].sort())
      expect(Object.keys(row.detail).sort(), row.id).toEqual([...TENANT_ROLES].sort())
      for (const role of TENANT_ROLES) {
        expect(CONTROL_STATUSES, `${row.id}/${role}`).toContain(row.status[role])
        expect(row.detail[role]!.length, `${row.id}/${role}`).toBeGreaterThan(0)
      }
    }
  })

  it('carries the cells the source qualifies', () => {
    expect(statusFor('view-platform-access-history', 'TENANT_ADMIN')).toBe('read-only')
    expect(statusFor('view-platform-access-history', 'SUPERVISOR')).toBe('unavailable')
    expect(statusFor('view-platform-access-history', 'QUALITY_MANAGER')).toBe('unavailable')
    expect(statusFor('view-platform-access-history', 'READONLY_AUDITOR')).toBe('read-only')
    expect(statusFor('receive-the-post-session-report', 'TENANT_ADMIN')).toBe('allowed')
    expect(statusFor('receive-the-post-session-report', 'READONLY_AUDITOR')).toBe('read-only')
    expect(statusFor('see-the-support-session-banner', 'WORKER')).toBe('not-applicable')
    expect(statusFor('end-a-support-session-from-the-banner', 'WORKER')).toBe('not-applicable')
  })

  /**
   * D12. Not "the Tenant Admin plus some others" — the whole set, and the
   * narrower restatement elsewhere in the source is excluded deliberately.
   */
  it('grants End session to every signed-in tenant web role, and to the Worker not at all', () => {
    expect(rolesWithStatus('end-a-support-session-from-the-banner', ACTING_STATUSES)).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
    ])
    expect(statusFor('end-a-support-session-from-the-banner', 'TENANT_ADMIN')).toBe('allowed')
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'] as const) {
      expect(statusFor('end-a-support-session-from-the-banner', role), role).toBe(
        'allowed-with-conditions',
      )
    }
  })

  /**
   * THE REASON AFFORDANCES HERE ARE PER CONTROL AND NEVER PER MODULE: two
   * roles the module withholds its route from hold two of its controls.
   */
  it('grants the banner and End session to two roles the module rail withholds the route from', () => {
    const reaching = dohModuleById('MOD-DOH-13').rolesReaching
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      expect(reaching, role).not.toContain(role)
      expect(rolesWithStatus('see-the-support-session-banner', READING_STATUSES), role).toContain(
        role,
      )
      expect(
        rolesWithStatus('end-a-support-session-from-the-banner', ACTING_STATUSES),
        role,
      ).toContain(role)
      expect(rolesWithStatus('view-platform-access-history', READING_STATUSES), role).not.toContain(
        role,
      )
    }
  })

  it('derives every allowed-roles list from the matrix rather than a hand-written list', () => {
    expect(rolesWithStatus('view-platform-access-history', READING_STATUSES)).toEqual([
      'TENANT_ADMIN',
      'READONLY_AUDITOR',
    ])
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      expect(src, name).not.toMatch(/allowedRoles:\s*\[/)
    }
  })
})

/**
 * THE CROSS-CHECK, non-vacuous three ways.
 */
describe('MOD-DOH-13 — the rail and this matrix agree about who reaches the module', () => {
  it('withholds the route from exactly the roles the matrix marks unavailable', () => {
    expect(Object.keys(CONTROL_MATRIX[0]!.status).sort()).toEqual([...TENANT_ROLES].sort())

    const withheldByTheMatrix = TENANT_ROLES.filter((role) =>
      CONTROL_MATRIX.some((row) => row.status[role] === 'unavailable'),
    )
    const withheldByTheSpine = TENANT_ROLES.filter(
      (role) => !dohModuleById('MOD-DOH-13').rolesReaching.includes(role),
    )
    expect([...withheldByTheSpine].sort()).toEqual([...withheldByTheMatrix].sort())

    // 1. the withheld set is exactly these three, not merely equal to itself;
    expect([...withheldByTheMatrix].sort()).toEqual([
      'QUALITY_MANAGER',
      'SUPERVISOR',
      'WORKER',
    ])
    // 2. the spine's own count is pinned — two roles reach this module;
    expect(dohModuleById('MOD-DOH-13').rolesReaching).toHaveLength(2)
    // 3. the matrix still uses the OTHER prohibition tokens, so the equality
    //    cannot be satisfied by collapsing them into one.
    expect(
      CONTROL_MATRIX.some((row) => Object.values(row.status).includes('explicitly-prohibited')),
    ).toBe(true)
    expect(
      CONTROL_MATRIX.some((row) => Object.values(row.status).includes('not-applicable')),
    ).toBe(true)
  })
})

describe('MOD-DOH-13 — all three access classes, scoped to this screen alone', () => {
  /**
   * THE HAZARD THIS TEST EXISTS FOR. `SEEDED_PLATFORM_ACCESS_SESSIONS` is ONE
   * array read by every Hub route, and the shell's copy states that one class
   * is seeded open while the other two carry no End-session control BY
   * CONSTRUCTION. Opening the other two on that array to exercise them here
   * would make that sentence false on every Hub route at once.
   */
  it('leaves the SHARED seeded array exactly as the shell seeded it', () => {
    const open = SEEDED_PLATFORM_ACCESS_SESSIONS.filter((s) => s.open)
    expect(open).toHaveLength(1)
    expect(open[0]!.accessClass).toBe('normal-support-session')
    expect(SEEDED_PLATFORM_ACCESS_SESSIONS).toHaveLength(ACCESS_CLASSES.length)
    // And this module writes to it nowhere: it imports the array and reads it.
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      expect(src, name).not.toMatch(/SEEDED_PLATFORM_ACCESS_SESSIONS\s*(\[|\.push|\.splice|=[^=])/)
    }
    expect(FIXTURES_SRC).toMatch(/from '\.\.\/banner-fixtures'/)
  })

  it('banners all three classes here regardless of that shared open flag', () => {
    expect([...SCREEN_BANNERED_CLASSES].sort()).toEqual(
      ACCESS_CLASSES.map((c) => c.id).sort(),
    )
    const banners = screenAccessBanners([], () => {})
    expect(banners).toHaveLength(3)
    // Non-vacuous in the direction that matters: two of the three are classes
    // the shared array seeds CLOSED, so this list cannot have come from it.
    const closedInTheSharedArray = SEEDED_PLATFORM_ACCESS_SESSIONS.filter((s) => !s.open).map(
      (s) => s.accessClass,
    )
    expect(closedInTheSharedArray).toHaveLength(2)
    for (const id of closedInTheSharedArray) {
      expect(banners.some((b) => b.accessClass === id), id).toBe(true)
    }
  })

  it('carries End session on the support session only, absent by construction elsewhere', () => {
    const banners = screenAccessBanners([], () => {})
    for (const banner of banners) {
      const hasControl = 'onEndSession' in banner
      expect(hasControl, banner.accessClass).toBe(banner.accessClass === 'normal-support-session')
    }
    // The class panels say the same thing, and they are what the screen draws.
    expect(accessClassPanel('normal-support-session').tenantMayEnd).toBe(true)
    expect(accessClassPanel('compliance-emergency-path').tenantMayEnd).toBe(false)
    expect(accessClassPanel('jbs-access-grant').tenantMayEnd).toBe(false)
    // The compliance class carries the report INSTEAD, and it cannot be muted.
    expect(accessClassPanel('compliance-emergency-path').insteadOfEndSession).toMatch(
      /automatic post-session report/i,
    )
    expect(accessClassPanel('compliance-emergency-path').writeCapable).toBe(true)
    expect(accessClassPanel('normal-support-session').writeCapable).toBe(false)
  })

  it('drops a class from the banner list once it has ended, and only that one', () => {
    const after = screenAccessBanners(['normal-support-session'], () => {})
    expect(after).toHaveLength(2)
    expect(after.some((b) => b.accessClass === 'normal-support-session')).toBe(false)
    expect(after.some((b) => b.accessClass === 'compliance-emergency-path')).toBe(true)
  })
})

describe('MOD-DOH-13 — the one command, gated through the one write-class table', () => {
  it('gates End session on the audit write the source requires of it', () => {
    expect(END_SESSION_WRITE_CLASS).toBe('write-audit')
    // Read from the ONE table, never re-derived. Open where "at any time"
    // must hold; closed where nobody is signed in to press it.
    expect(writeAllowed('active', END_SESSION_WRITE_CLASS)).toBe(true)
    expect(writeAllowed('soft-suspended', END_SESSION_WRITE_CLASS)).toBe(true)
    expect(writeAllowed('hard-suspended', END_SESSION_WRITE_CLASS)).toBe(true)
    expect(writeAllowed('compliance-suspended', END_SESSION_WRITE_CLASS)).toBe(false)
    expect(writeAllowed('archived', END_SESSION_WRITE_CLASS)).toBe(false)
    // The mapping is declared where a reviewer meets it, not only in code.
    expect(UNRESOLVED_IN_SOURCE.join(' ')).toMatch(/write-class enumerations name no End-session/)
  })

  it('re-derives no suspension rule anywhere in the module', () => {
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      // A conditional on a tenant state literal would be a second gate.
      expect(src, name).not.toMatch(/tenantState === '(soft|hard|compliance)-suspended'/)
    }
    expect(SCREEN_SRC).toMatch(/writeAllowed\(tenantState, END_SESSION_WRITE_CLASS\)/)
  })
})

describe('MOD-DOH-13 — the history is a read-through projection, and says so', () => {
  it('carries SB-DOH-025’s six columns and its fixed intro line', () => {
    expect([...HISTORY_COLUMNS]).toEqual([
      'Timestamp',
      'Access class',
      'Platform identity',
      'Reason',
      'Ticket reference',
      'Scope',
    ])
    expect(HISTORY_INTRO_COPY).toBe(
      'This is a filtered view of your own audit log. Every platform-side access appears here.',
    )
  })

  it('covers every access class, and records a refusal as a row of its own', () => {
    for (const cls of ACCESS_CLASSES) {
      expect(
        SEEDED_ACCESS_HISTORY.some((r) => r.accessClass === cls.id),
        cls.id,
      ).toBe(true)
    }
    expect(SEEDED_ACCESS_HISTORY.some((r) => /REFUSED/.test(r.what))).toBe(true)
    // And the tenant's own termination is a row, by someone who is not the admin.
    const ended = SEEDED_ACCESS_HISTORY.find((r) => /Ended by tenant/.test(r.reason))
    expect(ended).toBeDefined()
    expect(ended!.platformIdentity).toMatch(/Supervisor/)
  })

  it('filters by class and by date, and narrows rather than widens', () => {
    expect(filterHistory(SEEDED_ACCESS_HISTORY, NO_HISTORY_FILTERS)).toHaveLength(
      SEEDED_ACCESS_HISTORY.length,
    )
    const byClass = filterHistory(SEEDED_ACCESS_HISTORY, {
      accessClass: 'jbs-access-grant',
      onDate: null,
    })
    expect(byClass.length).toBeGreaterThan(0)
    expect(byClass.length).toBeLessThan(SEEDED_ACCESS_HISTORY.length)
    for (const r of byClass) expect(r.accessClass).toBe('jbs-access-grant')
    const dates = historyDates(SEEDED_ACCESS_HISTORY)
    expect(dates.length).toBeGreaterThan(1)
    const byDate = filterHistory(SEEDED_ACCESS_HISTORY, {
      accessClass: null,
      onDate: dates[0]!,
    })
    expect(byDate.length).toBeGreaterThan(0)
    expect(byDate.length).toBeLessThan(SEEDED_ACCESS_HISTORY.length)
    // Combined, and the combination is a conjunction rather than a union.
    expect(
      filterHistory(SEEDED_ACCESS_HISTORY, {
        accessClass: 'jbs-access-grant',
        onDate: dates[0]!,
      }),
    ).toHaveLength(0)
  })

  it('names the audit seam rather than building a second audit store', () => {
    expect(SCREEN_SRC).toMatch(/seamId="platform-access-history-audit"/)
    // Nothing here writes an audit record: the projection is read-through.
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      expect(src, name).not.toMatch(/\bAUDIT_STORE\b|writeAuditRecord|appendAudit/)
    }
  })

  it('names no behavioural measure on a person in any history row or class panel', () => {
    const records: readonly Record<string, unknown>[] = [
      ...SEEDED_ACCESS_HISTORY,
      ...ACCESS_CLASS_PANELS,
      SEEDED_POST_SESSION_REPORT as unknown as Record<string, unknown>,
    ]
    // These rows genuinely ARE about named people, which is the half of the
    // question the shared matcher does not answer for itself.
    expect(records.length).toBeGreaterThan(8)
    for (const record of records) {
      for (const key of Object.keys(record)) {
        expect(namesPersonBehaviouralMeasure(key), key).toBe(false)
      }
    }
    // The matcher is live, not asleep: a session-duration column would trip it.
    expect(namesPersonBehaviouralMeasure('sessionDurationMinutes')).toBe(true)
  })
})

describe('MOD-DOH-13 — the panels the contract requires', () => {
  it('renders the three banner controls with the SOURCE’s own two renderings', () => {
    const labels = ABSENT_BY_RULE.map((a) => a.label)
    expect(labels).toContain('Grant the engineer write access')
    expect(labels).toContain('Hide the banner')
    // And the third is NOT absent: the source marks it disabled with a reason,
    // quoted here. The brief called all three absent; the source does not.
    expect(labels).not.toContain('Extend the time box')
    expect(EXTEND_TIME_BOX_REASON).toBe(
      'The time box is set on the platform side and cannot be extended from here',
    )
    expect(SCREEN_SRC).toMatch(/disabledReason=\{EXTEND_TIME_BOX_REASON\}/)
  })

  it('says "workspace" and never "tenant" in the banner form (D18)', () => {
    expect(BANNER_TEXT_FORM).toContain('your workspace')
    expect(BANNER_TEXT_FORM).not.toContain('your tenant')
  })

  it('names the six things unreachable from the Hub', () => {
    expect([...UNREACHABLE_FROM_THE_HUB]).toEqual([
      'Tier configuration',
      'Feature gates',
      'Pilot management',
      'Tenant-group management',
      'Impersonation control',
      'Usage and billing administration',
    ])
  })

  it('records the disputed workflow attributions rather than obeying or deleting them', () => {
    expect(DISPUTED_ATTRIBUTIONS.map((d) => d.workflow)).toEqual([
      'WF-DVC-001',
      'WF-DVC-002',
      'WF-DVC-003',
    ])
    for (const d of DISPUTED_ATTRIBUTIONS) expect(d.sourceRef).toMatch(/^L5\d{4}$/)
  })

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
  })

  it('carries the decisions, the unspecified panel and the unresolved panel', () => {
    expect(DECISIONS_ON_SCREEN.map((d) => d.ref)).toEqual([
      'D1',
      'D5',
      'D7',
      'D12',
      'D13',
      'D14',
      'D18',
    ])
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(4)
    const unresolved = UNRESOLVED_IN_SOURCE.join(' ')
    expect(unresolved).toMatch(/UNSETTLED/)
    expect(unresolved).toMatch(/"Explicitly prohibited" carries no rendering/)
    expect(unresolved).toMatch(/"Unavailable" is overloaded/)
    // The brief-versus-source finding is on screen, not only in a report.
    expect(unresolved).toMatch(/quoted this module’s matrix as NINE rows/)
    expect(unresolved).toMatch(/L29206/)
  })

  it('closes its own vocabularies', () => {
    expect([...SUPPORT_SESSION_STATES]).toEqual([
      'open',
      'ended_by_time_box',
      'ended_by_tenant',
      'ended_by_engineer',
    ])
    expect([...ANNOUNCEMENT_STATES]).toEqual(['active', 'expired'])
    expect(CONTROL_STATUSES).toHaveLength(6)
  })

  it('reads no clock anywhere in the module', () => {
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      expect(src, name).not.toMatch(/Date\.now\(|new Date\(|Math\.random\(/)
    }
  })
})
