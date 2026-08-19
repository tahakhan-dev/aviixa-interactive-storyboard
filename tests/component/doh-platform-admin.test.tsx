import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { PlatformAdministrationScreen } from '../../app/hub/tenant-view-of-platform-administration/PlatformAdministrationScreen'
import {
  ABSENT_BY_RULE,
  ACCESS_CLASS_PANELS,
  APPLICABLE_SCREEN_STATES,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  DISPUTED_ATTRIBUTIONS,
  EXTEND_TIME_BOX_REASON,
  HISTORY_INTRO_COPY,
  INAPPLICABLE_SCREEN_STATES,
  SEEDED_ACCESS_HISTORY,
  SEEDED_POST_SESSION_REPORT,
  UNREACHABLE_FROM_THE_HUB,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
} from '../../app/hub/tenant-view-of-platform-administration/fixtures'
import { SEEDED_PLATFORM_ACCESS_SESSIONS } from '../../app/hub/banner-fixtures'
import { dohModuleById } from '@/surfaces/doh/modules'
import { screenState } from '@/ui/screen-state'

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setScreenState(state: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Screen state' }), {
    target: { value: state },
  })
}

function setTenantState(state: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Tenant state' }), {
    target: { value: state },
  })
}

function region(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

function isInert(el: HTMLElement): boolean {
  return el.getAttribute('aria-disabled') === 'true'
}

/** The reason text a disabled control actually points assistive tech at. */
function statedReason(el: HTMLElement): string {
  const id = el.getAttribute('aria-describedby')
  if (id === null) return ''
  return document.getElementById(id)?.textContent ?? ''
}

/**
 * The module's OWN End-session control, scoped to its own region. The Hub
 * chrome above carries one too, for the shell's seeded session; conflating
 * the two would let this suite pass against a screen that drew none of its own.
 */
function ownEndSessionButtons(): readonly HTMLElement[] {
  return within(region('Platform access in progress')).queryAllByRole('button', {
    name: /^end session$/i,
  })
}

describe('MOD-DOH-13 — identity, and the two catalogues that collide here', () => {
  it('wraps in the Hub shell and annotates both screen numbers without minting a route key', () => {
    render(<PlatformAdministrationScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      dohModuleById('MOD-DOH-13').name,
    )
    const body = document.body.textContent ?? ''
    expect(body).toContain('SCR-DOH-22')
    expect(body).toContain('SCR-DOH-PAH-02')
    // This is the module where the two catalogues collide most dangerously.
    expect(body).not.toMatch(/SCR-DOH-\d{3}(?!-)/)
  })

  it('carries the prototype disclosure and the fixed history line', () => {
    render(<PlatformAdministrationScreen />)
    expect(document.body.textContent).toMatch(/Simulated behaviour only/)
    expect(region('Platform Access History').textContent).toContain(HISTORY_INTRO_COPY)
  })
})

describe('MOD-DOH-13 — all three access classes, and the shared seed left alone', () => {
  it('banners all three classes here while the shared seed still opens exactly one', () => {
    render(<PlatformAdministrationScreen />)
    const own = region('Platform access in progress')
    for (const panel of ACCESS_CLASS_PANELS) {
      expect(within(own).getByText(panel.name), panel.accessClass).toBeTruthy()
      expect(own.textContent, panel.accessClass).toContain(panel.reason)
    }
    // The shared array is untouched, which is what keeps the shell's own copy
    // true on every other Hub route.
    expect(SEEDED_PLATFORM_ACCESS_SESSIONS.filter((s) => s.open)).toHaveLength(1)
  })

  it('draws exactly one End-session control, on the support session alone', () => {
    render(<PlatformAdministrationScreen />)
    expect(ownEndSessionButtons()).toHaveLength(1)
    const own = region('Platform access in progress')
    expect(own.textContent).toMatch(
      /No End-session control exists on this class, for any role, and none is disabled either/,
    )
    expect(own.textContent).toMatch(/automatic post-session report/i)
  })

  it('disables Extend the time box with the source’s own reason, for every persona', () => {
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      const view = render(<PlatformAdministrationScreen />)
      viewAs(role)
      const buttons = within(region('Platform access in progress')).getAllByRole('button', {
        name: /extend the time box/i,
      })
      expect(buttons.length, role).toBe(ACCESS_CLASS_PANELS.length)
      for (const button of buttons) {
        expect(isInert(button), role).toBe(true)
        expect(statedReason(button), role).toBe(EXTEND_TIME_BOX_REASON)
      }
      view.unmount()
    }
  })
})

describe('MOD-DOH-13 — End session is a real control with an honest consequence', () => {
  it('ends the seeded session, drops its banner, and claims nothing about a platform', () => {
    render(<PlatformAdministrationScreen />)
    const own = () => region('Platform access in progress')
    // Before: open, bannered, and the control live.
    expect(own().textContent).toMatch(/Open/)
    expect(within(own()).getByText(/read-only session open on this workspace/i)).toBeTruthy()
    const button = ownEndSessionButtons()[0]!
    expect(isInert(button)).toBe(false)

    fireEvent.click(button)

    expect(own().textContent).toMatch(/Ended — by this workspace, from the banner/)
    expect(within(own()).queryByText(/read-only session open on this workspace/i)).toBeNull()
    expect(own().textContent).toMatch(/No platform session was terminated/)
    // The other two classes are untouched by it.
    expect(own().textContent).toMatch(/dual-authorised compliance-emergency access is open/i)
  })

  it('says the action did not happen when the audit write fails, and changes nothing', () => {
    render(<PlatformAdministrationScreen />)
    fireEvent.click(
      screen.getByLabelText(/simulate an audit-write failure on the next end session/i),
    )
    fireEvent.click(ownEndSessionButtons()[0]!)
    const own = region('Platform access in progress')
    expect(own.textContent).toMatch(/The action did not happen/)
    // And the session is still open, still bannered.
    expect(own.textContent).toMatch(/Open/)
    expect(within(own).getByText(/read-only session open on this workspace/i)).toBeTruthy()
  })

  it('is live for every one of the four web roles, not the Tenant Admin alone (D12)', () => {
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      const view = render(<PlatformAdministrationScreen />)
      viewAs(role)
      const buttons = ownEndSessionButtons()
      expect(buttons, role).toHaveLength(1)
      expect(isInert(buttons[0]!), role).toBe(false)
      fireEvent.click(buttons[0]!)
      expect(region('Platform access in progress').textContent, role).toMatch(
        /Ended — by this workspace, from the banner/,
      )
      view.unmount()
    }
  })

  it('disables rather than queues under connection loss, and keeps the banner', () => {
    render(<PlatformAdministrationScreen />)
    setScreenState('STATE-08')
    const button = ownEndSessionButtons()[0]!
    expect(isInert(button)).toBe(true)
    expect(statedReason(button)).toMatch(/disables rather than queues/i)
    expect(statedReason(button)).toMatch(/time box remains the bound/i)
    // The banner is still there — visibility does not depend on the write path.
    expect(
      within(region('Platform access in progress')).getByText(
        /read-only session open on this workspace/i,
      ),
    ).toBeTruthy()
    // NEVER QUEUED, asserted as a property rather than as a word-scan: the
    // screen uses the word "queued" in two DENIALS (the disabled reason itself,
    // and the panel naming STATE-09 as a state that never renders here), so a
    // text scan would be a gate tripping on its own denial — the defect this
    // build has already recorded four times. What is asserted instead is that
    // the control is inert, that its reason says why, and that no queued
    // command state is drawn anywhere on the screen.
    expect(screen.queryByText(/^queued$/i)).toBeNull()
    expect(screen.queryByText(/^available for delivery$/i)).toBeNull()
    expect(region('States that never render here').textContent).toMatch(
      /STATE-09.*nothing is ever queued/s,
    )
  })

  it('applies the tenant state gate before the control renders', () => {
    render(<PlatformAdministrationScreen />)
    setTenantState('compliance-suspended')
    const button = ownEndSessionButtons()[0]!
    expect(isInert(button)).toBe(true)
    expect(statedReason(button)).toMatch(/compliance-suspended/)
    expect(statedReason(button)).toMatch(/not a restriction at all/i)
    // Open again under soft suspension: "at any time" has to keep meaning it.
    setTenantState('soft-suspended')
    expect(isInert(ownEndSessionButtons()[0]!)).toBe(false)
  })
})

describe('MOD-DOH-13 — the history, its readers and its refusals', () => {
  it('renders every seeded row for the Tenant Admin, with the six fixed columns', () => {
    render(<PlatformAdministrationScreen />)
    const history = region('Platform Access History')
    for (const header of [
      'Timestamp',
      'Access class',
      'Platform identity',
      'Reason',
      'Ticket reference',
      'Scope',
    ]) {
      expect(within(history).getByRole('columnheader', { name: header }), header).toBeTruthy()
    }
    for (const row of SEEDED_ACCESS_HISTORY) {
      expect(history.textContent, row.auditId).toContain(row.auditId)
    }
    expect(history.textContent).toMatch(/A write was attempted and REFUSED/)
  })

  it('refuses the Supervisor and Quality Manager the table while keeping their banner control', () => {
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER']) {
      const view = render(<PlatformAdministrationScreen />)
      viewAs(role)
      const history = region('Platform Access History')
      expect(within(history).queryByRole('table'), role).toBeNull()
      expect(history.textContent, role).toMatch(/is not offered to/i)
      expect(history.textContent, role).toMatch(/the refusal is about the history/i)
      // The guarantee is not taken away with the table.
      expect(ownEndSessionButtons(), role).toHaveLength(1)
      expect(isInert(ownEndSessionButtons()[0]!), role).toBe(false)
      // And the post-session report is absent for them.
      expect(region('Post-session report').textContent, role).toMatch(/No post-session report/)
      view.unmount()
    }
  })

  it('gives the Read-only Auditor the table and the report', () => {
    render(<PlatformAdministrationScreen />)
    viewAs('READONLY_AUDITOR')
    expect(within(region('Platform Access History')).getByRole('table')).toBeTruthy()
    expect(region('Post-session report').textContent).toContain(
      SEEDED_POST_SESSION_REPORT.forAuditId,
    )
  })

  it('filters by access class and by date, and narrows the real table', () => {
    render(<PlatformAdministrationScreen />)
    const rowCount = () =>
      within(region('Platform Access History')).getAllByRole('row').length - 1
    const before = rowCount()
    fireEvent.change(screen.getByRole('combobox', { name: 'Access class' }), {
      target: { value: 'jbs-access-grant' },
    })
    const after = rowCount()
    expect(after).toBeGreaterThan(0)
    expect(after).toBeLessThan(before)
    expect(region('Platform Access History').textContent).toContain('JBS-2026-0117')
    expect(region('Platform Access History').textContent).not.toContain('SUP-2026-4471')
  })

  it('disables the export control with its reason rather than inventing a permission for it', () => {
    render(<PlatformAdministrationScreen />)
    const button = within(region('Platform Access History')).getByRole('button', {
      name: /export this view/i,
    })
    expect(isInert(button)).toBe(true)
    expect(statedReason(button)).toMatch(/carries no row for it/i)
    expect(statedReason(button)).toMatch(/another module’s authority/i)
  })

  it('names the audit seam and its owning slice', () => {
    render(<PlatformAdministrationScreen />)
    const history = region('Platform Access History')
    expect(history.textContent).toMatch(/Cross-slice seam — not built here/)
    expect(history.textContent).toMatch(/slice 10/)
    expect(history.textContent).toMatch(/one audit truth per tenant/i)
  })
})

describe('MOD-DOH-13 — announcements, the scope gate and the panels', () => {
  it('renders the announcement with no dismiss or mute control anywhere', () => {
    render(<PlatformAdministrationScreen />)
    const announcements = region('Platform announcements')
    expect(announcements.textContent).toMatch(/Planned platform maintenance/)
    expect(within(announcements).queryAllByRole('button')).toEqual([])
    expect(announcements.textContent).toMatch(/no dismiss field at all/i)
  })

  it('names the six things unreachable from the Hub, and links to none of them', () => {
    render(<PlatformAdministrationScreen />)
    const gate = region('Not reachable from the Hub')
    for (const item of UNREACHABLE_FROM_THE_HUB) {
      expect(within(gate).getByText(item), item).toBeTruthy()
    }
    expect(within(gate).queryAllByRole('link')).toEqual([])
    expect(within(gate).queryAllByRole('button')).toEqual([])
  })

  it('records the disputed device-workflow attributions on screen', () => {
    render(<PlatformAdministrationScreen />)
    const disputed = region('Attributed but disputed')
    for (const d of DISPUTED_ATTRIBUTIONS) {
      expect(within(disputed).getByText(d.workflow), d.workflow).toBeTruthy()
    }
    expect(disputed.textContent).toMatch(/a read-only module cannot own device enrolment/i)
    expect(disputed.textContent).toMatch(/uncatalogued and claims no module/i)
  })

  it('renders all ten matrix rows, the tenth included', () => {
    render(<PlatformAdministrationScreen />)
    const matrix = region('Control matrix')
    expect(CONTROL_MATRIX).toHaveLength(10)
    for (const row of CONTROL_MATRIX) {
      expect(within(matrix).getByText(row.control), row.id).toBeTruthy()
    }
    expect(
      within(matrix).getByText('Prevent a platform-side access class from being recorded'),
    ).toBeTruthy()
    expect(matrix.textContent).toMatch(/quoted only\s+nine/i)
  })

  it('says why each absent control is absent', () => {
    render(<PlatformAdministrationScreen />)
    const absent = region('Absent by rule')
    for (const item of ABSENT_BY_RULE) {
      expect(within(absent).getByText(item.label), item.label).toBeTruthy()
      expect(absent.textContent, item.label).toContain(item.note)
    }
    // No control is drawn in that panel — it is notes where controls would be.
    expect(within(absent).queryAllByRole('button')).toEqual([])
  })

  it('walks all eight applicable screen states', () => {
    render(<PlatformAdministrationScreen />)
    for (const id of APPLICABLE_SCREEN_STATES) {
      setScreenState(id)
      const state = region('Screen state')
      expect(state.textContent, id).toContain(id)
      expect(state.textContent, id).toContain(screenState(id).name)
    }
  })

  it('STATE-01 says an empty history is not a failure', () => {
    render(<PlatformAdministrationScreen />)
    setScreenState('STATE-01')
    const history = region('Platform Access History')
    expect(history.textContent).toMatch(/No platform-side access has ever occurred/)
    expect(history.textContent).toMatch(/it is not a failure/i)
  })

  it('STATE-12 names what failed and says nothing was written', () => {
    render(<PlatformAdministrationScreen />)
    setScreenState('STATE-12')
    const history = region('Platform Access History')
    expect(history.textContent).toMatch(/read of this workspace’s audit records failed/i)
    expect(history.textContent).toMatch(/Nothing was written/)
    // The banner survives it, because visibility does not depend on this read.
    expect(
      within(region('Platform access in progress')).getByText(
        /read-only session open on this workspace/i,
      ),
    ).toBeTruthy()
  })

  it('renders the decisions and both source panels', () => {
    render(<PlatformAdministrationScreen />)
    for (const d of DECISIONS_ON_SCREEN) {
      expect(region('Decisions rendered on this screen').textContent, d.ref).toContain(d.statement)
    }
    for (const item of UNSPECIFIED_IN_SOURCE) {
      expect(region('Unspecified in source').textContent).toContain(item)
    }
    for (const item of UNRESOLVED_IN_SOURCE) {
      expect(region('Unresolved in source').textContent).toContain(item)
    }
    for (const s of INAPPLICABLE_SCREEN_STATES) {
      expect(region('States that never render here').textContent, s.id).toContain(s.why)
    }
  })
})
