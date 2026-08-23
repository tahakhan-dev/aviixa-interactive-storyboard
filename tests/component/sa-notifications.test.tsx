import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { roleById, type RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import {
  aggregateResolvesTo,
  cellFromSource,
  columnAttribution,
  evaluateColumnAccess,
  type AggregateColumn,
  type ColumnCell,
  type ColumnMatrixRow,
} from '@/policy/columns'
import { NotificationsScreen } from '../../app/super-admin/platform-notifications-and-tenant-communications/NotificationsScreen'
import { BROADCAST_STATES, NOTIF_ABSENT_CONTROLS, NOTIF_CHANNELS, NOTIF_PLATFORM_ROLES, NOTIF_SOURCE_CONFLICTS, NOTIF_UNSPECIFIED_IN_SOURCE, NOTIF_WORKFLOWS, SEND_HISTORY } from '../../app/super-admin/platform-notifications-and-tenant-communications/fixtures'

const MODULE = saModuleById('MOD-SA-14')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */

function interactiveText(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('button, a, input, select, textarea, [role=switch], [role=button]'),
  ).map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`)
}

/**
 * Every input the SCREEN owns, which is every input except the two fixture
 * switchers. Those two step the storyboard; they are not inputs of the screen
 * under annotation, and freezing them would strand a reader inside the state
 * they stepped into.
 */
function screenOwnedInputs(
  container: HTMLElement,
): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] {
  const switchers = [
    screen.getByLabelText(/view as platform role/i),
    screen.getByLabelText(/Screen state/i),
  ]
  return Array.from(
    container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    ),
  ).filter((el) => !switchers.includes(el))
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

  // Rendered copy for every role, both targets AND every applicable state —
  // not just the default view. Most of this screen's denial and read-only
  // sentences exist only off the default path, so a sweep of the default
  // render can never reach the copy most likely to carry a banned word.
  it('names none of the four forbidden words anywhere in its copy, for any role in any state', () => {
    for (const role of NOTIF_PLATFORM_ROLES) {
      for (const target of ['single-tenant', 'all-tenant'] as const) {
        for (const state of SA_APPLICABLE_STATES) {
          const { container, unmount } = render(
            <NotificationsScreen role={role.id} target={target} screenState={state.id} />,
          )
          expect(container.textContent ?? '', `${role.id}/${target}/${state.id}`).not.toMatch(
            /tamper-evident|chained|signed|verified/i,
          )
          unmount()
        }
      }
    }
  })

  it('renders no rate, no percentage and nothing below the tenant', () => {
    for (const state of SA_APPLICABLE_STATES) {
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
    // The tuple is [roleId, actionable], so the template names the role first
    // and the expectation second — a name that reads back in the order the
    // row is written, and therefore changes when a row's boolean is flipped.
  ] as const)('single-tenant notice: %s — send is actionable=%s', (roleId, actionable) => {
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
    const selector = screen.getByLabelText(/view as platform role/i)
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
    for (const state of SA_APPLICABLE_STATES) {
      expect(within(selector).getByText(new RegExp(state.id)), state.id).toBeDefined()
    }
    expect(within(selector).getAllByRole('option')).toHaveLength(12)
  })

  it.each(SA_APPLICABLE_STATES.map((s) => s.id))('renders %s without losing the module', (stateId) => {
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

  // The screen prints the state contract verbatim — "Every input is disabled"
  // for STATE-06, "nothing may be submitted" for STATE-12. These two walk the
  // inputs the screen owns and the buttons that submit them, in the state the
  // contract is quoted in, not in the default state.
  it.each(['STATE-06', 'STATE-12'] as const)(
    '%s: every input the screen owns is inert and nothing is submitted',
    (stateId) => {
      const { container } = render(<NotificationsScreen role="ADMIN" screenState={stateId} />)
      fireEvent.click(screen.getByRole('button', { name: /Request a support session/i }))
      const inputs = screenOwnedInputs(container)
      expect(inputs.length, 'no inputs found — the walk would pass vacuously').toBe(7)
      for (const el of inputs) {
        expect(el.disabled, `${stateId} ${el.tagName}#${el.id}`).toBe(true)
      }
      for (const name of [/Send notice/i, /Re-send/i, /Submit session request/i]) {
        expect(
          screen.getByRole('button', { name }).getAttribute('aria-disabled'),
          `${stateId} ${String(name)}`,
        ).toBe('true')
      }
    },
  )

  it('STATE-03: those same inputs are live, so the two assertions above can fail', () => {
    const { container } = render(<NotificationsScreen role="ADMIN" screenState="STATE-03" />)
    fireEvent.click(screen.getByRole('button', { name: /Request a support session/i }))
    const inputs = screenOwnedInputs(container)
    expect(inputs.length).toBe(7)
    for (const el of inputs) {
      expect(el.disabled, `${el.tagName}#${el.id}`).toBe(false)
    }
    expect(
      screen.getByRole('button', { name: /Submit session request/i }).getAttribute('aria-disabled'),
    ).toBeNull()
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

/* ==================================================================== *
 * SLICE 10, TASK 12v — THE VERIFICATION GATE OVER SLICE-3 BYTES.
 *
 * This screen is slice 3's. Slice 10 verified it rather than rebuilt it. The
 * question it was verified against: did a platform console render a TENANT
 * preference editor, because the one permissive cell of this module's matrix
 * grants an act whose real home is another surface? It did not — but it also
 * disclosed the boundary nowhere, and a stated abstention and an oversight
 * look identical from outside. This block holds both halves.
 * ==================================================================== */

const SOURCE_LINES = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

function sourceLine(n: number): string {
  const line = SOURCE_LINES[n - 1]
  if (line === undefined) throw new Error(`L${n} is beyond the frozen source`)
  return line
}

/**
 * The three permissive members of `PermissionOutcome`. Named rather than
 * derived by negation: typed `readonly PermissionOutcome[]`, a member added to
 * the union does not silently join this list, and a member REMOVED from it
 * fails to compile here — which is the shape a membership list has to have to
 * be worth more than a length.
 */
const PERMISSIVE: readonly PermissionOutcome[] = ['allowed', 'allowedWithConditions', 'queuedOffline']

/** The actor columns of `MOD-SA-14`'s header, L45653, in source order. */
const PLATFORM_COLUMNS: readonly RoleId[] = [
  'ROOT_SUPER_ADMIN',
  'ADMIN',
  'PLATFORM_ENGINEER',
  'SUPPORT',
]

/**
 * The fifth actor column. `members` is TRANSCRIBED from the header's own words
 * — every tenant role — and never derived from `rolesInDomain('TENANT')`, which
 * would answer a question the header only implies. `narrowsTo` on the cell is
 * what overrides it, and the test below proves the cell's own words are where
 * that narrowing comes from.
 */
const ANY_TENANT_ROLE: AggregateColumn = {
  kind: 'aggregate',
  header: 'Any tenant role',
  members: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'],
  sourceRef: 'L45653',
}

/** Actor cells of one row, in header order: four platform, then the aggregate. */
function rowCells(lineNumber: number): readonly ColumnCell[] {
  const parts = sourceLine(lineNumber).split('|')
  expect(parts).toHaveLength(PLATFORM_COLUMNS.length + 4)
  return parts.slice(2, -1).map((text) => cellFromSource(text))
}

describe('MOD-SA-14 — the matrix as this build counts it', () => {
  it('has six pipe columns at L45653: one action, four platform roles, one aggregate', () => {
    const header = sourceLine(45653)
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s !== '')
    expect(header).toEqual([
      'Action',
      'Root Super Admin',
      'Admin',
      'Platform Engineer',
      'Support',
      'Any tenant role',
    ])
    expect(header[5]).toBe(ANY_TENANT_ROLE.header)
    for (const role of PLATFORM_COLUMNS) expect(roleById(role).domain).toBe('PLATFORM')
  })

  it('has SEVEN data rows, counted by reading to where the body stops — never from the span', () => {
    expect(sourceLine(45654).replace(/[|\-\s]/g, '')).toBe('')
    const body: number[] = []
    for (let n = 45655; n < 45680; n += 1) {
      if (!sourceLine(n).startsWith('|')) break
      body.push(n)
    }
    expect(body).toEqual([45655, 45656, 45657, 45658, 45659, 45660, 45661])
    // 7 rows x 5 actor columns.
    expect(body.length * (PLATFORM_COLUMNS.length + 1)).toBe(35)
    for (const n of body) expect(rowCells(n)).toHaveLength(5)
  })

  it('carries exactly ONE permissive cell in the aggregate column, and it is L45659', () => {
    const permissive: number[] = []
    for (let n = 45655; n <= 45661; n += 1) {
      const aggregate = rowCells(n)[4]
      if (aggregate !== undefined && PERMISSIVE.includes(aggregate.outcome)) permissive.push(n)
    }
    expect(permissive).toEqual([45659])
  })
})

describe('MOD-SA-14 — the aggregate column is attributed to nothing, and this console reads none of it', () => {
  it('refuses all four platform roles on L45659 and grants only the aggregate', () => {
    const cells = rowCells(45659)
    for (const [i, role] of PLATFORM_COLUMNS.entries()) {
      expect(cells[i]?.outcome, `${roleById(role).name} on L45659`).toBe('explicitlyProhibited')
    }
    expect(cells[4]?.outcome).toBe('allowedWithConditions')
  })

  it('narrows to the Tenant Admin from the CELL’s own words, not from the header', () => {
    const detail = rowCells(45659)[4]?.detail ?? ''
    expect(detail).toBe(
      'the Tenant Admin configures tenant notification preferences within the mandatory baseline',
    )
    // Derived: the cell names one tenant role and no other, so the header's
    // five members are not what this cell covers.
    const named = ANY_TENANT_ROLE.members.filter((r) => detail.includes(roleById(r).name))
    expect(named).toEqual(['TENANT_ADMIN'])
    const cell: ColumnCell = { outcome: 'allowedWithConditions', detail, narrowsTo: named }
    expect(aggregateResolvesTo(ANY_TENANT_ROLE, cell)).toEqual(['TENANT_ADMIN'])
    // Without the narrowing the header would answer for all five — which is the
    // silent widening `narrowsTo` exists to prevent.
    expect(aggregateResolvesTo(ANY_TENANT_ROLE, { outcome: 'allowed', detail })).toHaveLength(5)
  })

  it('names no actor, so no access decision may be keyed on it', () => {
    expect(columnAttribution(ANY_TENANT_ROLE)).toBe('NOT_ATTRIBUTABLE')
    const row: ColumnMatrixRow = {
      id: 'MOD-SA-14-author-or-override-a-tenant-internal-notification',
      operation: 'Author or override a tenant-internal notification',
      cells: { 'aggregate:Any tenant role': rowCells(45659)[4] as ColumnCell },
      sourceRef: 'L45659',
    }
    expect(() => evaluateColumnAccess(row, ANY_TENANT_ROLE, null, [ANY_TENANT_ROLE])).toThrow(
      /aggregate and names no actor/,
    )
  })

  it('offers no tenant role on this console at all, so the narrowed role cannot act here', () => {
    expect(NOTIF_PLATFORM_ROLES.map((r) => r.id)).toEqual([...PLATFORM_COLUMNS])
    for (const r of NOTIF_PLATFORM_ROLES) expect(roleById(r.id).domain).toBe('PLATFORM')
    render(<NotificationsScreen />)
    const options = [...document.querySelectorAll('option')].map((o) => o.getAttribute('value'))
    // Non-vacuous: the four ARE there, so a fifth could not hide from this.
    for (const r of PLATFORM_COLUMNS) expect(options).toContain(r)
    expect(options).not.toContain('TENANT_ADMIN')
  })
})

describe('MOD-SA-14 — the tenant-internal notification boundary is ABSENT and stated', () => {
  it('renders the boundary as a note where a control would sit, for every role in every state', () => {
    const boundary = NOTIF_ABSENT_CONTROLS.find(
      (c) => c.label === 'Author or override a tenant-internal notification',
    )
    expect(boundary).toBeDefined()
    for (const role of NOTIF_PLATFORM_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const view = render(<NotificationsScreen role={role.id} screenState={state.id} />)
        // Positive control FIRST: the note is present. An absence loop over a
        // screen that failed to render passes on nothing at all.
        expect(document.body.textContent ?? '').toContain(boundary?.label ?? '')
        const controls = interactiveText(view.container)
        expect(controls.length).toBeGreaterThan(0)
        for (const label of controls) {
          expect(label).not.toMatch(/author|override|tenant[- ]internal|preference/i)
        }
        view.unmount()
      }
    }
  })

  it('quotes the source’s own boundary sentence verbatim, and the act’s real home', () => {
    const boundary = NOTIF_ABSENT_CONTROLS.find(
      (c) => c.label === 'Author or override a tenant-internal notification',
    )
    const note = boundary?.note ?? ''
    expect(sourceLine(45680)).toContain(
      'Never author or override a tenant-internal notification; share delivery infrastructure only',
    )
    expect(note).toContain(
      'Never author or override a tenant-internal notification; share delivery infrastructure only',
    )
    expect(sourceLine(28689)).toContain(
      'Set notification policy — which events fire, to which recipient roles',
    )
    expect(note).toContain('L28689')
    // Its only screen admits the Tenant Admin alone.
    expect(sourceLine(48113)).toContain('SCR-DOH-19')
    expect(sourceLine(48113)).toContain('Tenant Admin')
    expect(note).toContain('L48113')
    render(<NotificationsScreen />)
    expect(document.body.textContent ?? '').toContain(note)
  })
})

describe('MOD-SA-14 — the send and submit holders come from the MATRIX, not the storyboard', () => {
  it('derives the composing-and-sending holders from L45656 and L45657 and finds the same two rows', () => {
    for (const line of [45656, 45657]) {
      const cells = rowCells(line)
      const allowed = PLATFORM_COLUMNS.filter((_, i) => cells[i]?.outcome === 'allowed')
      expect(allowed, `L${line}`).toEqual(['ROOT_SUPER_ADMIN', 'ADMIN'])
      // The other two are `Unavailable`, not `Explicitly prohibited`. The
      // distinction is why this screen draws them an inert control with a named
      // reason on these two rows.
      expect(cells[2]?.outcome, `L${line}`).toBe('unavailable')
      expect(cells[3]?.outcome, `L${line}`).toBe('unavailable')
    }
  })

  it('renders the send control actionable for exactly the roles L45656 grants, and no others', () => {
    const cells = rowCells(45656)
    const actionable = new Set(PLATFORM_COLUMNS.filter((_, i) => cells[i]?.outcome === 'allowed'))
    // Non-vacuous both ways: the set is neither empty nor all four.
    expect(actionable.size).toBeGreaterThan(0)
    expect(actionable.size).toBeLessThan(PLATFORM_COLUMNS.length)
    for (const role of PLATFORM_COLUMNS) {
      const view = render(<NotificationsScreen role={role} target="single-tenant" />)
      const send = within(screen.getByRole('region', { name: /Composer/i })).getByRole('button', {
        name: /Send notice/i,
      })
      expect(send.getAttribute('aria-disabled'), role).toBe(actionable.has(role) ? null : 'true')
      view.unmount()
    }
  })

  it('names L45656 and L45657 in the refusal, and L45658 in the submission refusal', () => {
    const eng = render(<NotificationsScreen role="PLATFORM_ENGINEER" target="single-tenant" />)
    const send = within(screen.getByRole('region', { name: /Composer/i })).getByRole('button', {
      name: /Send notice/i,
    })
    const sendReason =
      document.getElementById(send.getAttribute('aria-describedby') ?? '')?.textContent ?? ''
    expect(sendReason).toContain('L45656')
    expect(sendReason).toContain('L45657')
    eng.unmount()

    const sup = render(<NotificationsScreen role="SUPPORT" target="all-tenant" />)
    const submit = within(screen.getByRole('region', { name: /Composer/i })).getByRole('button', {
      name: /Submit for root approval/i,
    })
    const submitReason =
      document.getElementById(submit.getAttribute('aria-describedby') ?? '')?.textContent ?? ''
    expect(submitReason).toContain('L45658')
    // And L45658 is where the Admin's conditional submission grant actually is.
    expect(rowCells(45658)[1]?.outcome).toBe('allowedWithConditions')
    expect(rowCells(45658)[1]?.detail).toBe('drafts; the root approves as critical class')
    sup.unmount()
  })
})
