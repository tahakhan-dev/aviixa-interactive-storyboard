import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { namesPersonBehaviouralMeasure } from '../coverage/person-measure-keys'
import {
  ABSENT_BY_RULE,
  APPLICABLE_SCREEN_STATES,
  APP_VERSION_FLOOR,
  BINDABLE_AREAS,
  COMMAND_STATE_ON_CREATION,
  CONSOLE_OWNED_DEVICE_STATES,
  CONTROL_MATRIX,
  CONTROL_STATUSES,
  DECISIONS_ON_SCREEN,
  DEVICE_COMMAND_KINDS,
  DEVICE_MODES,
  DEVICE_STATES,
  DEVICE_WRITE_CLASS,
  FLAG_DEFAULT_ENABLED,
  INAPPLICABLE_SCREEN_STATES,
  LOST_REPORT_CONFIRMATION,
  SCREEN_IDENTIFIER,
  SEEDED_DEVICES,
  STATUS_PROVENANCES,
  TENANT_DEVICE_ENROLMENT_FLAG,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  WIPE_REQUEST_CONFIRMATION,
  deviceById,
  meetsVersionFloor,
  rolesWithStatus,
  statusFor,
} from '../../app/hub/devices/fixtures'
import { DOH_MODULES } from '@/surfaces/doh/modules'
import { DOH_SCREENS } from '@/surfaces/doh/screens'
import { TERMINAL_COMMAND_STATES } from '@/ui/ScreenStateBoundary'
import { writeAllowed } from '@/surfaces/doh/tenant-state'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../app/hub/HubShell'

const DIR = 'app/hub/devices'
const FIXTURES_SRC = readFileSync(`${DIR}/fixtures.ts`, 'utf8')
const SCREEN_SRC = readFileSync(`${DIR}/DevicesScreen.tsx`, 'utf8')
const PAGE_SRC = readFileSync(`${DIR}/page.tsx`, 'utf8')

const TENANT_ROLES = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]

describe('the device screen — uncatalogued, and claiming no module (D4, D5)', () => {
  it('keeps the source’s own literal and mints no catalogue row for it', () => {
    expect(SCREEN_IDENTIFIER).toBe('SCR-DOH-DEVICES')
    // Neither catalogue carries it, so nothing in the screen registry does either.
    // Widened deliberately: `DOH_SCREENS` is `as const`, so a narrow comparison
    // would only ever be asked about the ids it already lists, and the compiler
    // would answer the question instead of the registry. Widening asks the real
    // one — is this identifier in the catalogue at all.
    const screenIds: readonly string[] = DOH_SCREENS.map((s) => s.id)
    expect(screenIds).not.toContain(SCREEN_IDENTIFIER)
    expect(screenIds.length).toBeGreaterThan(10)
    expect(DOH_SCREENS.some((s) => s.name.toLowerCase().includes('device'))).toBe(false)
    // And no three-digit form is minted anywhere in the directory.
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
      ['page', PAGE_SRC],
    ] as const) {
      expect(src, name).not.toMatch(/SCR-DOH-\d{2,3}\b/)
    }
  })

  /**
   * THE ANALOGUE OF THE SPINE CROSS-CHECK, for a screen that is not a module.
   * There is no `rolesReaching` to agree with, so what is asserted instead is
   * that NOTHING claims this route: no module id appears anywhere in the
   * directory, no module slug matches it, and the spine's own counts are
   * pinned so the check cannot pass by both sides collapsing to empty.
   */
  it('names no module id anywhere in its own directory, and no module claims its slug', () => {
    const files = readdirSync(DIR).filter((f) => /\.tsx?$/.test(f))
    expect(files.length).toBeGreaterThan(2)
    for (const file of files) {
      const src = readFileSync(`${DIR}/${file}`, 'utf8')
      const found = src.match(/MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g) ?? []
      expect(found, `${file} names a module id`).toEqual([])
    }
    const slugs: readonly string[] = DOH_MODULES.map((m) => m.slug)
    expect(slugs).not.toContain('devices')
    // Non-vacuity: the spine is populated, so "no module claims it" is a real
    // answer rather than an empty registry answering itself.
    expect(DOH_MODULES).toHaveLength(8)
    expect(DOH_SCREENS.length).toBeGreaterThan(10)
    // And the module-id scan is live: it finds one in a sibling directory.
    expect(
      readFileSync('app/hub/qualification-calendar/page.tsx', 'utf8').match(
        /MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g,
      ) ?? [],
    ).not.toEqual([])
  })
})

describe('the device screen — D3, one named feature flag defaulting to enabled', () => {
  it('names the flag rather than defaulting silently, and defaults to enabled', () => {
    expect(TENANT_DEVICE_ENROLMENT_FLAG).toBe('tenantDeviceEnrolment')
    expect(FLAG_DEFAULT_ENABLED).toBe(true)
    // The flag is read by the shared evaluator's own feature stage, not by a
    // conditional wrapped around the controls.
    expect(SCREEN_SRC).toMatch(/requiredFeature: TENANT_DEVICE_ENROLMENT_FLAG/)
    // Exactly one flag name exists in the module: D3 says ONE named flag.
    const names = FIXTURES_SRC.match(/tenantDevice[A-Za-z]*/g) ?? []
    expect([...new Set(names)]).toEqual(['tenantDeviceEnrolment'])
  })

  it('records the open decision behind the flag rather than settling it', () => {
    expect(DECISIONS_ON_SCREEN.map((d) => d.ref)).toEqual(['D3', 'D4', 'D5', 'D7', 'D27'])
    expect(UNRESOLVED_IN_SOURCE.join(' ')).toMatch(/DEC-DEVOWN-001 is open/)
    expect(UNRESOLVED_IN_SOURCE.join(' ')).toMatch(/DEC-WIPE-001 is open/)
    expect(UNSPECIFIED_IN_SOURCE.join(' ')).toMatch(/DEC-DEVLOST-001 is open/)
  })
})

describe('the device screen — the application-version floor', () => {
  it('refuses below the floor, accepts at it, and refuses a malformed version', () => {
    expect(APP_VERSION_FLOOR).toBe('2.1.0')
    expect(meetsVersionFloor('2.1.0')).toBe(true)
    expect(meetsVersionFloor('2.1.1')).toBe(true)
    expect(meetsVersionFloor('2.2.0')).toBe(true)
    expect(meetsVersionFloor('3.0.0')).toBe(true)
    expect(meetsVersionFloor('2.0.9')).toBe(false)
    expect(meetsVersionFloor('1.9.9')).toBe(false)
    // A comparison against a value that is not a version is the silent pass
    // this refusal exists to prevent, so a malformed string is refused.
    expect(meetsVersionFloor('')).toBe(false)
    expect(meetsVersionFloor('2.1')).toBe(false)
    expect(meetsVersionFloor('latest')).toBe(false)
    // Not a string comparison: "10.0.0" must beat "2.1.0".
    expect(meetsVersionFloor('10.0.0')).toBe(true)
  })
})

describe('the device screen — mark-lost is a state plus a request record only (D27)', () => {
  it('creates a command in its TRUE state, and that state is never terminal', () => {
    expect(COMMAND_STATE_ON_CREATION).toBe('created')
    expect(TERMINAL_COMMAND_STATES.has(COMMAND_STATE_ON_CREATION)).toBe(false)
    // Non-vacuous: the terminal set is populated and does contain the states a
    // dishonest screen would reach for.
    expect(TERMINAL_COMMAND_STATES.has('applied')).toBe(true)
    expect(TERMINAL_COMMAND_STATES.has('acknowledged')).toBe(true)
  })

  it('says outright that the request reaches no device, and never says wiped', () => {
    expect(WIPE_REQUEST_CONFIRMATION).toMatch(/wipes nothing itself/)
    expect(WIPE_REQUEST_CONFIRMATION).toMatch(
      /data remains on the device until the device contacts the platform/,
    )
    expect(LOST_REPORT_CONFIRMATION).toMatch(/never triggers an automatic erasure/)
    expect(LOST_REPORT_CONFIRMATION).toMatch(/no device was touched/)
  })

  it('builds neither suspend nor wipe as an act of this surface', () => {
    for (const control of ['execute-a-wipe', 'suspend-a-device'] as const) {
      for (const role of TENANT_ROLES) {
        expect(statusFor(control, role), `${control}/${role}`).toBe('explicitly-prohibited')
      }
      expect(rolesWithStatus(control, ['allowed', 'allowed-with-conditions'])).toEqual([])
    }
    // The two command kinds this screen can create, and no third.
    expect([...DEVICE_COMMAND_KINDS]).toEqual(['suspension-on-lost-report', 'retire'])
    // No handler anywhere writes a wiped or suspended device state.
    expect(SCREEN_SRC).not.toMatch(/state: 'wiped'|state: 'suspended'/)
    expect([...DEVICE_STATES]).not.toContain('wiped')
  })
})

describe('the device screen — the control table is part quoted and part derived', () => {
  it('marks the provenance of every row, and does not claim silence as a source', () => {
    expect(CONTROL_MATRIX.length).toBeGreaterThan(6)
    for (const row of CONTROL_MATRIX) {
      expect(STATUS_PROVENANCES, row.id).toContain(row.provenance)
      expect(Object.keys(row.status).sort(), row.id).toEqual([...TENANT_ROLES].sort())
      for (const role of TENANT_ROLES) {
        expect(CONTROL_STATUSES, `${row.id}/${role}`).toContain(row.status[role])
      }
      expect(row.sourceRef.length, row.id).toBeGreaterThan(0)
    }
    // Both provenances are actually used, so the field is not decoration.
    expect(CONTROL_MATRIX.some((r) => r.provenance === 'quoted-from-source')).toBe(true)
    expect(CONTROL_MATRIX.some((r) => r.provenance === 'derived-from-silence')).toBe(true)
  })

  it('withholds every device control from the other four roles rather than granting on silence', () => {
    for (const row of CONTROL_MATRIX) {
      for (const role of ['SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'] as const) {
        expect(
          ['unavailable', 'explicitly-prohibited'],
          `${row.id}/${role}`,
        ).toContain(row.status[role])
      }
    }
    // And the Tenant Admin does hold something, so the sweep is not vacuous.
    expect(rolesWithStatus('enrol-a-device', ['allowed'])).toEqual(['TENANT_ADMIN'])
    expect(rolesWithStatus('mark-a-device-lost', ['allowed'])).toEqual(['TENANT_ADMIN'])
    expect(rolesWithStatus('request-a-wipe', ['allowed'])).toEqual(['TENANT_ADMIN'])
  })

  it('derives every allowed-roles list from the table rather than a hand-written list', () => {
    for (const [name, src] of [
      ['fixtures', FIXTURES_SRC],
      ['screen', SCREEN_SRC],
    ] as const) {
      expect(src, name).not.toMatch(/allowedRoles:\s*\[/)
    }
    expect(SCREEN_SRC).toMatch(/allowedRoles: rolesWithStatus\(controlId, statuses\)/)
  })
})

describe('the device screen — the tenant state gate, and the concern it raises', () => {
  it('gates every device write through the ONE write-class table', () => {
    expect(DEVICE_WRITE_CLASS).toBe('edit-configuration')
    expect(writeAllowed('active', DEVICE_WRITE_CLASS)).toBe(true)
    expect(writeAllowed('soft-suspended', DEVICE_WRITE_CLASS)).toBe(false)
    expect(writeAllowed('hard-suspended', DEVICE_WRITE_CLASS)).toBe(false)
    expect(writeAllowed('compliance-suspended', DEVICE_WRITE_CLASS)).toBe(false)
    // Which matches the source's own refusal of enrolment against a workspace
    // that is not active — the strict mapping is the source's here.
    expect(SCREEN_SRC).toMatch(/writeAllowed\(tenantState, DEVICE_WRITE_CLASS\)/)
    expect(SCREEN_SRC).not.toMatch(/tenantState === '(soft|hard|compliance)-suspended'/)
  })

  it('raises the consequence for a lost report rather than swallowing it', () => {
    expect(UNSPECIFIED_IN_SOURCE.join(' ')).toMatch(
      /A lost report is gated here as a configuration edit/,
    )
    expect(UNSPECIFIED_IN_SOURCE.join(' ')).toMatch(/security act rather than a configuration edit/)
  })
})

describe('the device screen — records, states and the surveillance line', () => {
  it('carries the panel fields the one source line names, and nothing measuring a person', () => {
    expect(SEEDED_DEVICES.length).toBeGreaterThan(2)
    for (const device of SEEDED_DEVICES) {
      for (const key of Object.keys(device)) {
        expect(namesPersonBehaviouralMeasure(key), `${device.id}.${key}`).toBe(false)
      }
    }
    // The matcher is live rather than asleep on this record shape.
    expect(namesPersonBehaviouralMeasure('capturesPerWorker')).toBe(true)
    expect(namesPersonBehaviouralMeasure('idleMinutes')).toBe(true)
    // A device record names no worker at all, so there is nothing to key on.
    for (const device of SEEDED_DEVICES) {
      expect(Object.keys(device).join(' ')).not.toMatch(/worker|operator|user/i)
    }
  })

  it('binds no finer than the Area, and only to an active one', () => {
    expect(BINDABLE_AREAS.length).toBeGreaterThan(0)
    for (const area of BINDABLE_AREAS) expect(area.state).toBe('active')
    // Non-vacuous: an archived Area exists and is excluded. Widened for the
    // same reason as above — a narrow comparison would answer itself.
    const bindableIds: readonly string[] = BINDABLE_AREAS.map((a) => a.id)
    expect(bindableIds).not.toContain('AREA-ARD-STORE')
    expect(bindableIds.length).toBeGreaterThan(3)
    for (const device of SEEDED_DEVICES) {
      expect(Object.keys(device)).not.toContain('cellId')
      expect(Object.keys(device)).not.toContain('jobId')
    }
    expect(ABSENT_BY_RULE.map((a) => a.label)).toContain('Bind a device below the Area')
  })

  it('holds only the device states this surface can set, and names the console’s four', () => {
    expect([...DEVICE_STATES]).toEqual([
      'enrolled',
      'in_service',
      'reassigned',
      'reported_lost',
      'retired',
    ])
    expect(CONSOLE_OWNED_DEVICE_STATES.map((s) => s.name)).toEqual([
      'Suspended',
      'Wipe pending',
      'Wiped',
      'Never returned',
    ])
    for (const s of CONSOLE_OWNED_DEVICE_STATES) expect(s.why.length).toBeGreaterThan(20)
  })

  it('resolves a device from the register it is handed, not from the seed', () => {
    expect(deviceById.length).toBe(2)
    expect(deviceById('TAB-014', SEEDED_DEVICES)?.id).toBe('TAB-014')
    expect(deviceById('TAB-014', [])).toBeUndefined()
  })

  it('fixes the mode at enrollment, with no control to change it', () => {
    expect([...DEVICE_MODES]).toEqual(['shared', 'personal'])
    for (const role of TENANT_ROLES) {
      expect(statusFor('change-the-device-mode', role), role).toBe('explicitly-prohibited')
    }
  })
})

describe('the device screen — the states and the panels the contract requires', () => {
  it('walks ten applicable screen states, STATE-09 mandatory among them', () => {
    expect([...APPLICABLE_SCREEN_STATES]).toEqual([
      'STATE-01',
      'STATE-02',
      'STATE-03',
      'STATE-04',
      'STATE-05',
      'STATE-06',
      'STATE-08',
      'STATE-09',
      'STATE-12',
      'STATE-13',
    ])
    expect(APPLICABLE_SCREEN_STATES).toContain('STATE-09')
    expect(INAPPLICABLE_SCREEN_STATES.map((s) => s.id)).toEqual([
      'STATE-07',
      'STATE-10',
      'STATE-11',
    ])
  })

  it('carries the unspecified and unresolved panels, and records the unsettled rendering', () => {
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(5)
    const unresolved = UNRESOLVED_IN_SOURCE.join(' ')
    expect(unresolved).toMatch(/UNSETTLED/)
    expect(unresolved).toMatch(/"Explicitly prohibited" carries no rendering/)
    expect(unresolved).toMatch(/"Unavailable" is overloaded/)
    expect(UNSPECIFIED_IN_SOURCE.join(' ')).toMatch(
      /NO FIVE-ROLE PERMISSION MATRIX FOR DEVICES EXISTS ANYWHERE/,
    )
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
