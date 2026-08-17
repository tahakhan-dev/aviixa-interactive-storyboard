import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { SCREEN_STATES } from '@/ui/screen-state'
import { saModuleById } from '@/surfaces/sa/modules'
import { NotificationsScreen } from '../../app/super-admin/platform-notifications-and-tenant-communications/NotificationsScreen'
import {
  BROADCAST_STATES,
  NOTIF_ABSENT_CONTROLS,
  NOTIF_CHANNELS,
  NOTIF_PLATFORM_ROLES,
  NOTIF_SOURCE_CONFLICTS,
  NOTIF_UNSPECIFIED_IN_SOURCE,
  NOTIF_WORKFLOWS,
  SEND_HISTORY,
} from '../../app/super-admin/platform-notifications-and-tenant-communications/fixtures'

const MODULE = saModuleById('MOD-SA-14')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

function interactiveText(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('button, a, input, select, textarea, [role=switch], [role=button]'),
  ).map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`)
}

describe('MOD-SA-14 Platform Notifications — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<NotificationsScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-14 · Operations layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<NotificationsScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates the screen numbers without ever keying a route on one', () => {
    const { container } = render(<NotificationsScreen />)
    expect(screen.getByText(/SCR-SA-20/)).toBeDefined()
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  // Rendered copy, for every role and both targets — not just the default
  // view. The shared `PermissionNotice` renders `decision.explanation`, and
  // the default text for `ROLE_NOT_GRANTED` is "The signed-in role does not
  // carry a grant for this action", which contains one of the four forbidden
  // words. A gate that only renders the default role never sees it.
  it('names none of the four forbidden words anywhere in its copy, for any role', () => {
    for (const role of NOTIF_PLATFORM_ROLES) {
      for (const target of ['single-tenant', 'all-tenant'] as const) {
        const { container, unmount } = render(
          <NotificationsScreen role={role.id} target={target} />,
        )
        expect(container.textContent ?? '', `${role.id}/${target}`).not.toMatch(
          /tamper-evident|chained|signed|verified/i,
        )
        unmount()
      }
    }
  })

  it('renders no rate, no percentage and nothing below the tenant', () => {
    for (const state of APPLICABLE_STATES) {
      const { container, unmount } = render(<NotificationsScreen screenState={state.id} />)
      const text = container.textContent ?? ''
      expect(text, state.id).not.toMatch(/\d\s?%/)
      expect(text, state.id).not.toMatch(/per worker|per-worker|open rate|delivery rate/i)
      unmount()
    }
  })

  it('states that no telemetry leaves the browser', () => {
    render(<NotificationsScreen />)
    expect(screen.getByText(/no telemetry leaves the browser/i)).toBeDefined()
  })
})

describe('MOD-SA-14 — exactly two channels, closed (AC-SA-14-01, L45684)', () => {
  it('closes the channel set at two, in-app and email', () => {
    expect(NOTIF_CHANNELS).toHaveLength(2)
    expect(NOTIF_CHANNELS.map((c) => c.id)).toEqual(['in-app', 'email'])
  })

  it('renders the channel selector as two fixed options with the note that no others exist at V1', () => {
    render(<NotificationsScreen role="ADMIN" />)
    const region = screen.getByRole('region', { name: /Channel/i })
    for (const channel of NOTIF_CHANNELS) {
      expect(within(region).getAllByText(new RegExp(channel.name, 'i')).length).toBeGreaterThan(0)
    }
    expect(within(region).getByText(/no others exist at V1/i)).toBeDefined()
  })

  it('offers no control that adds, configures or removes a channel, to any role', () => {
    for (const role of NOTIF_PLATFORM_ROLES) {
      const { container, unmount } = render(<NotificationsScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `offered to ${role.id}`).not.toMatch(
          /add a channel|new channel|configure channel|remove channel/i,
        )
      }
      unmount()
    }
    render(<NotificationsScreen />)
    expect(screen.getByText(/no configuration adds a third/i)).toBeDefined()
  })

  it('gives the two roles the source names the interactive selector and the other two the reason', () => {
    for (const role of NOTIF_PLATFORM_ROLES) {
      const { unmount } = render(<NotificationsScreen role={role.id} />)
      const region = screen.getByRole('region', { name: /Channel/i })
      if (role.id === 'ROOT_SUPER_ADMIN' || role.id === 'ADMIN') {
        expect(within(region).getByLabelText(/Channel/i), role.id).toBeDefined()
      } else {
        expect(region.querySelector('select'), role.id).toBeNull()
        expect(within(region).getByRole('note').textContent ?? '', role.id).toMatch(/role/i)
      }
      unmount()
    }
  })
})

describe('MOD-SA-14 — the broadcast object and its states', () => {
  it('carries the thirteen broadcast states, closed, in source order', () => {
    expect(BROADCAST_STATES).toEqual([
      'drafted',
      'pending root approval',
      'scheduled',
      'snapshot taken',
      'sending',
      'sent',
      'delivered',
      'opened',
      'read',
      'acknowledged',
      'reconciled',
      'failed',
      'cancelled',
    ])
  })

  it('keeps delivery, opening and acknowledgement distinct and never conflates them (AC-SA-14-06)', () => {
    render(<NotificationsScreen />)
    const region = screen.getByRole('region', { name: /Reconciliation/i })
    for (const word of [/Delivered to/i, /Opened by/i, /Acknowledged by/i]) {
      expect(within(region).getByText(word)).toBeDefined()
    }
    expect(region.textContent ?? '').not.toMatch(/engagement|reach|read receipts combined/i)
  })

  it('renders every send-history row in its own state, never collapsed to sent', () => {
    render(<NotificationsScreen />)
    const history = screen.getByRole('region', { name: /Send history/i })
    for (const row of SEND_HISTORY) {
      const cell = within(history).getByText(row.subject).closest('tr')
      expect(cell?.textContent ?? '', row.id).toMatch(new RegExp(row.state, 'i'))
    }
  })

  it('records a delivery failure rather than hiding it (FB-SA-07)', () => {
    render(<NotificationsScreen />)
    const history = screen.getByRole('region', { name: /Send history/i })
    expect(within(history).getAllByText(/failed/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-14 — per-control allowed roles, through evaluateAccess', () => {
  it.each([
    ['ROOT_SUPER_ADMIN', true],
    ['ADMIN', true],
    ['PLATFORM_ENGINEER', false],
    ['SUPPORT', false],
  ] as const)('single-tenant notice: send is actionable=%s for %s', (roleId, actionable) => {
    render(<NotificationsScreen role={roleId} target="single-tenant" />)
    const composer = screen.getByRole('region', { name: /Composer/i })
    const send = within(composer).getByRole('button', { name: /Send notice/i })
    if (actionable) {
      expect(send.getAttribute('aria-disabled')).toBeNull()
    } else {
      expect(send.getAttribute('aria-disabled')).toBe('true')
      const describedBy = send.getAttribute('aria-describedby')
      const reason = document.getElementById(describedBy ?? '')
      expect(reason?.textContent ?? '').toMatch(/Platform Engineer|Support/i)
    }
  })

  it('all-tenant target replaces the action bar with the critical-class badge for every non-root role', () => {
    for (const role of NOTIF_PLATFORM_ROLES.filter((r) => r.id !== 'ROOT_SUPER_ADMIN')) {
      const { unmount } = render(<NotificationsScreen role={role.id} target="all-tenant" />)
      const composer = screen.getByRole('region', { name: /Composer/i })
      expect(within(composer).queryByRole('button', { name: /Send notice/i }), role.id).toBeNull()
      expect(
        within(composer).getByText(/Critical class — root approval required/i),
        role.id,
      ).toBeDefined()
      unmount()
    }
  })

  it('offers the Admin the source-defined Submit for root approval control in place of the send control', () => {
    render(<NotificationsScreen role="ADMIN" target="all-tenant" />)
    const composer = screen.getByRole('region', { name: /Composer/i })
    const submit = within(composer).getByRole('button', { name: /Submit for root approval/i })
    expect(submit.getAttribute('aria-disabled')).toBeNull()
  })

  it.each(['PLATFORM_ENGINEER', 'SUPPORT'] as const)(
    'draws Submit for root approval inert with a named reason for %s',
    (roleId) => {
      render(<NotificationsScreen role={roleId} target="all-tenant" />)
      const composer = screen.getByRole('region', { name: /Composer/i })
      const submit = within(composer).getByRole('button', { name: /Submit for root approval/i })
      expect(submit.getAttribute('aria-disabled')).toBe('true')
      const reason = document.getElementById(submit.getAttribute('aria-describedby') ?? '')
      expect(reason?.textContent ?? '').toMatch(/Admin/i)
    },
  )

  it('shows the root that it approves its own critical-class action, with no second approver', () => {
    render(<NotificationsScreen role="ROOT_SUPER_ADMIN" target="all-tenant" />)
    const composer = screen.getByRole('region', { name: /Composer/i })
    expect(within(composer).getByRole('button', { name: /Send notice/i })).toBeDefined()
    expect(within(composer).getByText(/DEC-ROOTSUCC-001/)).toBeDefined()
  })

  it('names every one of the four platform roles as a view switcher, never a login', () => {
    render(<NotificationsScreen />)
    expect(NOTIF_PLATFORM_ROLES).toHaveLength(4)
    const selector = screen.getByLabelText(/Console role/i)
    for (const role of NOTIF_PLATFORM_ROLES) {
      expect(within(selector).getByText(new RegExp(role.roleAnnotation))).toBeDefined()
    }
    expect(screen.getByText(/view switcher, not a login/i)).toBeDefined()
  })
})

describe('MOD-SA-14 — the audience snapshot (AC-SA-14-04, AC-SA-14-07)', () => {
  it('states that every send stores a snapshot taken at send time', () => {
    render(<NotificationsScreen />)
    expect(screen.getByText(/taken at send time/i)).toBeDefined()
  })

  it('re-sends against the stored snapshot, and offers no control that takes a fresh one', () => {
    render(<NotificationsScreen role="ADMIN" />)
    const region = screen.getByRole('region', { name: /Re-send/i })
    fireEvent.click(within(region).getByRole('button', { name: /Re-send/i }))
    expect(within(region).getByText(/stored audience snapshot/i)).toBeDefined()
    const { container } = render(<NotificationsScreen role="ROOT_SUPER_ADMIN" />)
    for (const text of interactiveText(container)) {
      expect(text).not.toMatch(/fresh snapshot|refresh the audience|retake the snapshot/i)
    }
  })
})

describe('MOD-SA-14 — prohibitions rendered by rule', () => {
  it('renders the enforced invariant as a status chip with no control of any kind', () => {
    render(<NotificationsScreen />)
    const region = screen.getByRole('region', { name: /Enforced invariant/i })
    expect(region.querySelector('button')).toBeNull()
    expect(region.querySelector('input')).toBeNull()
    expect(region.querySelector('[role=switch]')).toBeNull()
    expect(region.querySelector('[tabindex]')).toBeNull()
    expect(within(region).getByText(/ENFORCED/)).toBeDefined()
  })

  it('draws a one-line note where each absent control would be, and never a disabled one', () => {
    render(<NotificationsScreen />)
    const absences = screen.getByRole('region', { name: /Controls that do not exist/i })
    expect(NOTIF_ABSENT_CONTROLS.length).toBeGreaterThan(0)
    for (const control of NOTIF_ABSENT_CONTROLS) {
      expect(within(absences).getByText(control.label), control.label).toBeDefined()
    }
    expect(absences.querySelector('button')).toBeNull()
    expect(absences.querySelector('input')).toBeNull()
  })

  it('offers no mute or dismiss control for an in-app banner, to any role (AC-SA-14-02)', () => {
    for (const role of NOTIF_PLATFORM_ROLES) {
      const { container, unmount } = render(<NotificationsScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `offered to ${role.id}`).not.toMatch(/mute|silence|suppress|dismiss/i)
      }
      unmount()
    }
    render(<NotificationsScreen />)
    expect(screen.getByText(/cannot be muted by any tenant user/i)).toBeDefined()
  })

  it('offers no control by which a notification enforces anything (AC-021-02, AC-WF-OPS-003-04)', () => {
    const { container } = render(<NotificationsScreen role="ROOT_SUPER_ADMIN" />)
    for (const text of interactiveText(container)) {
      expect(text).not.toMatch(/suspend|place a hold|issue a device command|block a qualification/i)
    }
    expect(screen.getByText(/never enforces/i)).toBeDefined()
  })
})

describe('MOD-SA-14 — the twelve applicable screen states', () => {
  it('offers all twelve, and never the frontline-only STATE-07', () => {
    render(<NotificationsScreen />)
    const selector = screen.getByLabelText(/Screen state/i)
    expect(within(selector).queryByText(/STATE-07/)).toBeNull()
    for (const state of APPLICABLE_STATES) {
      expect(within(selector).getByText(new RegExp(state.id)), state.id).toBeDefined()
    }
    expect(within(selector).getAllByRole('option')).toHaveLength(12)
  })

  it.each(APPLICABLE_STATES.map((s) => s.id))('renders %s without losing the module', (stateId) => {
    render(<NotificationsScreen screenState={stateId} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('region', { name: /Composer/i })).toBeDefined()
  })

  it('STATE-11: with every model unavailable the module remains fully operable', () => {
    render(<NotificationsScreen role="ADMIN" target="single-tenant" screenState="STATE-11" />)
    const composer = screen.getByRole('region', { name: /Composer/i })
    expect(
      within(composer).getByRole('button', { name: /Send notice/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    expect(screen.getByRole('region', { name: /Send history/i })).toBeDefined()
    expect(screen.getByText(/no part of this module depends on a model/i)).toBeDefined()
  })

  it('STATE-06: one banner, one cause', () => {
    render(<NotificationsScreen screenState="STATE-06" />)
    expect(
      screen.getAllByRole('status').filter((n) => /read-only/i.test(n.textContent ?? '')),
    ).toHaveLength(1)
  })

  it('STATE-09: an accepted send renders in its true broadcast state, never as sent', () => {
    render(<NotificationsScreen role="ADMIN" target="single-tenant" screenState="STATE-09" />)
    const composer = screen.getByRole('region', { name: /Composer/i })
    expect(within(composer).getByText(/snapshot taken/i)).toBeDefined()
  })

  it('STATE-04: names the broken rule and what would be accepted', () => {
    render(<NotificationsScreen role="ADMIN" screenState="STATE-04" />)
    expect(screen.getByRole('alert').textContent ?? '').toMatch(/body/i)
  })
})

describe('MOD-SA-14 — aggregates never render as zero or blank (AC-SA-01-03)', () => {
  it('STATE-03 renders the reconciliation aggregate with an as-of timestamp', () => {
    render(<NotificationsScreen screenState="STATE-03" />)
    const region = screen.getByRole('region', { name: /Reconciliation/i })
    expect(within(region).getByText(/as of/i)).toBeDefined()
  })

  it('STATE-08 degrades to stale WITH its age, never to zero', () => {
    render(<NotificationsScreen screenState="STATE-08" />)
    const region = screen.getByRole('region', { name: /Reconciliation/i })
    expect(region.textContent ?? '').toMatch(/stale/i)
    expect(region.textContent ?? '').toMatch(/\d+ (minutes|hours) old/i)
  })

  it('STATE-12 degrades to unavailable, never to zero or blank', () => {
    render(<NotificationsScreen screenState="STATE-12" />)
    const region = screen.getByRole('region', { name: /Reconciliation/i })
    expect(region.textContent ?? '').toMatch(/Unavailable/i)
    expect(region.textContent ?? '').not.toMatch(/\b0\b/)
  })

  it('STATE-02 renders a placeholder, never the number nought', () => {
    render(<NotificationsScreen screenState="STATE-02" />)
    const region = screen.getByRole('region', { name: /Reconciliation/i })
    expect(region.textContent ?? '').not.toMatch(/\b0\b/)
    expect(within(region).getByRole('status')).toBeDefined()
  })
})

describe('MOD-SA-14 — the no-link rule', () => {
  it('resolves every link to the console, never to record-level tenant content', () => {
    const { container } = render(<NotificationsScreen />)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).toMatch(/^\/super-admin\//)
    }
    expect(screen.getByText(/named access class/i)).toBeDefined()
  })

  it('resolves a tenant on a broadcast row to a session-request form, not to the tenant', () => {
    render(<NotificationsScreen role="SUPPORT" />)
    fireEvent.click(screen.getByRole('button', { name: /Request a support session/i }))
    expect(screen.getByRole('region', { name: /Session request/i })).toBeDefined()
    expect(screen.getByText(/no ambient browsing/i)).toBeDefined()
  })
})

describe('MOD-SA-14 — what the source does not define', () => {
  it('names every missing affordance instead of inventing a control', () => {
    render(<NotificationsScreen />)
    const panel = screen.getByRole('region', { name: /Unspecified in source/i })
    expect(NOTIF_UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const item of NOTIF_UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(item.affordance), item.affordance).toBeDefined()
    }
    expect(panel.querySelector('button')).toBeNull()
    expect(panel.querySelector('input')).toBeNull()
  })

  it('states the conflicts the source leaves open rather than resolving them silently', () => {
    render(<NotificationsScreen />)
    const panel = screen.getByRole('region', { name: /Conflicts in the source/i })
    expect(NOTIF_SOURCE_CONFLICTS.length).toBeGreaterThan(0)
    for (const phrase of [/AC-SA-14-05/, /SCR-SA-17/, /roles_allowed/]) {
      expect(within(panel).getAllByText(phrase).length).toBeGreaterThan(0)
    }
  })

  it('says how each workflow was matched to this module', () => {
    render(<NotificationsScreen />)
    const panel = screen.getByRole('region', { name: /Workflows/i })
    for (const workflow of NOTIF_WORKFLOWS) {
      expect(within(panel).getByText(workflow.name), workflow.id).toBeDefined()
    }
    expect(within(panel).getAllByText(/Matched by/i).length).toBe(NOTIF_WORKFLOWS.length)
  })
})
