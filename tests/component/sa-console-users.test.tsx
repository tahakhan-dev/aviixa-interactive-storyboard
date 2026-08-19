import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { SA_MODULES, saModuleById } from '@/surfaces/sa/modules'
import { CRITICAL_ACTIONS } from '@/surfaces/sa/critical-actions'
import { PERMISSION_OUTCOMES } from '@/policy/decision'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { ConsoleUsersScreen } from '../../app/super-admin/console-users-roles-and-change-approvals/ConsoleUsersScreen'
import { APPROVAL_REQUESTS, APPROVAL_REQUEST_FIELDS, APPROVAL_STATES, CHANGE_CLASSES, CONSOLE_ACCOUNT_STATES, MATRIX_CONFIGURATION_VERSION, MATRIX_TOKEN_LABEL, ROOT_FROZEN_CAPABILITIES, SA08_PLATFORM_ROLES, SA08_UNSPECIFIED_IN_SOURCE, SA08_WORKFLOWS } from '../../app/super-admin/console-users-roles-and-change-approvals/fixtures'

const MODULE = saModuleById('MOD-SA-08')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */

function interactiveText(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('button, a, input, select, [role=switch], [role=button]'),
  ).map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`)
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function row(regionName: RegExp, text: string): HTMLElement {
  const region = screen.getByRole('region', { name: regionName })
  const cell = within(region).getByText(text)
  const tr = cell.closest('tr')
  if (tr === null) throw new Error(`No table row carries ${text}`)
  return tr as HTMLElement
}

describe('MOD-SA-08 Console Users, Roles and Change Approvals — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<ConsoleUsersScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-08 · Operations layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<ConsoleUsersScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates the screen numbers without ever keying a route on one', () => {
    const { container } = render(<ConsoleUsersScreen />)
    expect(screen.getAllByText(/SCR-SA-12/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/SCR-SA-13/).length).toBeGreaterThan(0)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  // Every role, both root-availability values, and the states that change
  // what is drawn. The single-render version of this gate PASSED while the
  // screen printed "the signed-in role does not carry a grant" to Support
  // and to the Platform Engineer: the default role never sees that refusal,
  // so the gate proved only that the default render was clean. A forbidden
  // word gate has to walk the axis that changes the copy.
  it.each(
    SA08_PLATFORM_ROLES.flatMap((role) =>
      [true, false].flatMap((rootAvailable) =>
        (['STATE-03', 'STATE-06', 'STATE-11', 'STATE-12'] as const).map(
          (screenState) => [role.id, rootAvailable, screenState] as const,
        ),
      ),
    ),
  )('names none of the four forbidden words for %s (root available: %s, %s)', (roleId, rootAvailable, screenState) => {
    const { container } = render(
      <ConsoleUsersScreen role={roleId} rootAvailable={rootAvailable} screenState={screenState} />,
    )
    expect(container.textContent ?? '').not.toMatch(/tamper-evident|chained|signed|verified/i)
  })

  // The gate above walks only what is drawn on arrival. Half this module's
  // copy — every notice a control prints — exists only AFTER a click, and
  // that copy is where a shared reason string would surface.
  it.each(SA08_PLATFORM_ROLES.map((r) => r.id))(
    'names none of the four forbidden words in the copy a click produces, for %s',
    (roleId) => {
      const { container } = render(<ConsoleUsersScreen role={roleId} />)
      const live = Array.from(container.querySelectorAll('button')).filter(
        (b) => b.getAttribute('aria-disabled') !== 'true',
      )
      expect(live.length, 'no live control to click').toBeGreaterThan(0)
      // Asserted after EACH click, not once at the end: the Users pane has
      // one shared notice element, so a later click overwrites the copy an
      // earlier one printed and an end-of-loop assertion never sees it.
      for (const b of live) {
        fireEvent.click(b)
        expect(container.textContent ?? '', b.textContent ?? '').not.toMatch(
          /tamper-evident|chained|signed|verified/i,
        )
      }
    },
  )

  it('resolves no link to record-level tenant content', () => {
    const { container } = render(<ConsoleUsersScreen />)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).toMatch(/^\/super-admin\//)
    }
    expect(screen.getAllByText(/named access class/i).length).toBeGreaterThan(0)
  })

  it('renders no metric below tenant-month, no rate and no per-worker series', () => {
    const { container } = render(<ConsoleUsersScreen />)
    // \b on `rate` deliberately: an unanchored /rate/ matches "generate",
    // "separate" and "moderate", which is how a gate gets written that only
    // ever proves its own prose style.
    expect(container.textContent ?? '').not.toMatch(
      /per worker|per-worker|per shift|\brates?\b|throughput|\d+\s?%/i,
    )
  })
})

describe('MOD-SA-08 Users pane — create is root-only', () => {
  it('offers Create user to the root as a live control', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" />)
    const pane = screen.getByRole('region', { name: /Users pane/i })
    expect(
      within(pane).getByRole('button', { name: /Create user/i }).getAttribute('aria-disabled'),
    ).toBeNull()
  })

  it('renders Create user DISABLED for Admin with the reason "User creation is root-only"', () => {
    render(<ConsoleUsersScreen role="ADMIN" />)
    const pane = screen.getByRole('region', { name: /Users pane/i })
    const create = within(pane).getByRole('button', { name: /Create user/i })
    expect(create.getAttribute('aria-disabled')).toBe('true')
    const describedBy = create.getAttribute('aria-describedby')
    const reason = document.getElementById(describedBy ?? '')
    expect(reason?.textContent ?? '').toMatch(/User creation is root-only/i)
  })

  it.each(['PLATFORM_ENGINEER', 'SUPPORT'] as const)(
    'draws no create control at all for %s — ABSENT, with a note where it would sit',
    (roleId) => {
      render(<ConsoleUsersScreen role={roleId} />)
      const pane = screen.getByRole('region', { name: /Users pane/i })
      expect(within(pane).queryByRole('button', { name: /Create user/i })).toBeNull()
      expect(within(pane).getAllByText(/No account-creation control exists for this role/i).length).toBeGreaterThan(0)
    },
  )

  it('renders the three console account states, closed at the source values', () => {
    render(<ConsoleUsersScreen />)
    expect(CONSOLE_ACCOUNT_STATES).toEqual(['provisioned', 'active', 'disabled'])
    const pane = screen.getByRole('region', { name: /Users pane/i })
    for (const state of CONSOLE_ACCOUNT_STATES) {
      expect(within(pane).getAllByText(new RegExp(state, 'i')).length).toBeGreaterThan(0)
    }
  })

  it('renders role assignment, disable and last-activity review inert for Admin with a named reason', () => {
    render(<ConsoleUsersScreen role="ADMIN" />)
    const pane = screen.getByRole('region', { name: /Users pane/i })
    for (const name of [/Role assignment/i, /Disable account/i, /Last-activity review/i]) {
      const control = within(pane).getByRole('button', { name })
      expect(control.getAttribute('aria-disabled')).toBe('true')
      const reason = document.getElementById(control.getAttribute('aria-describedby') ?? '')
      expect(reason?.textContent ?? '').toMatch(/root/i)
    }
  })

  it('offers no path that could create a second root account (AC-SA-08-01)', () => {
    for (const role of SA08_PLATFORM_ROLES) {
      const { container, unmount } = render(<ConsoleUsersScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `interactive element offered to ${role.id}`).not.toMatch(/second root|new root/i)
      }
      unmount()
    }
    render(<ConsoleUsersScreen />)
    expect(screen.getByText(/no user interface path creates a second/i)).toBeDefined()
  })
})

describe('MOD-SA-08 Roles pane — no blank cell (AC-SA-08-12)', () => {
  it('renders a four-role matrix per module with an explicit token in every cell', () => {
    render(<ConsoleUsersScreen />)
    const pane = screen.getByRole('region', { name: /Roles pane/i })
    const bodyRows = Array.from(pane.querySelectorAll('tbody tr'))
    expect(bodyRows).toHaveLength(SA_MODULES.length)
    const labels = Object.values(MATRIX_TOKEN_LABEL)
    for (const tr of bodyRows) {
      const cells = Array.from(tr.querySelectorAll('td'))
      // One module column plus one column per platform role.
      expect(cells).toHaveLength(1 + SA08_PLATFORM_ROLES.length)
      for (const td of cells.slice(1)) {
        const text = (td.textContent ?? '').trim()
        expect(text, 'a blank matrix cell is prohibited').not.toBe('')
        expect(labels.some((l) => text.startsWith(l)), `cell text: ${text}`).toBe(true)
      }
    }
  })

  it('draws every cell token from the closed nine-token set and says so', () => {
    render(<ConsoleUsersScreen />)
    expect(Object.keys(MATRIX_TOKEN_LABEL).sort()).toEqual([...PERMISSION_OUTCOMES].sort())
    const pane = screen.getByRole('region', { name: /Roles pane/i })
    expect(within(pane).getByText(/closed set of nine/i)).toBeDefined()
  })

  it.each(SA08_PLATFORM_ROLES)('exports the matrix with its configuration version for $roleAnnotation', (role) => {
    render(<ConsoleUsersScreen role={role.id} />)
    const pane = screen.getByRole('region', { name: /Roles pane/i })
    // NOT /configuration version/: the pane's own always-rendered prose says
    // "stamped with the configuration version it was true for", so that
    // regex matches a superset and is true before the click ever happens.
    // The stamp is the version STRING, and the export is the CSV itself.
    const stamp = new RegExp(escapeRegExp(MATRIX_CONFIGURATION_VERSION))
    expect(within(pane).queryAllByText(stamp)).toHaveLength(0)
    expect(pane.querySelector('pre')).toBeNull()
    const exportControl = within(pane).getByRole('button', { name: /Export as comma-separated values/i })
    expect(exportControl.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(exportControl)
    expect(within(pane).getAllByText(stamp).length).toBe(1)
    const csv = pane.querySelector('pre')?.textContent ?? ''
    // One header row plus one row per module, and the role columns in order.
    expect(csv.split('\n')).toHaveLength(SA_MODULES.length + 1)
    expect(csv.split('\n')[0]).toBe(['Module', ...SA08_PLATFORM_ROLES.map((r) => r.name)].join(','))
  })
})

describe('MOD-SA-08 Approval queue — one queue, four classes, six states', () => {
  it('renders exactly one approval queue and states that no parallel decision queue exists', () => {
    render(<ConsoleUsersScreen />)
    expect(screen.getAllByRole('region', { name: /Approval queue/i })).toHaveLength(1)
    expect(screen.getByText(/no parallel decision queue exists/i)).toBeDefined()
  })

  it('carries the four change classes, closed at the source values', () => {
    render(<ConsoleUsersScreen />)
    expect(CHANGE_CLASSES.map((c) => c.id)).toEqual([
      'band-b-routine',
      'engineering',
      'critical',
      'root-only-administrative',
    ])
    const region = screen.getByRole('region', { name: /Change classes/i })
    for (const c of CHANGE_CLASSES) expect(within(region).getByText(c.name)).toBeDefined()
  })

  it('carries the six approval states including the two named failure states', () => {
    expect(APPROVAL_STATES).toEqual([
      'pending',
      'approved',
      'returned',
      'applied',
      'approved-not-applied',
      'approved-not-executed',
    ])
    render(<ConsoleUsersScreen />)
    const queue = screen.getByRole('region', { name: /Approval queue/i })
    for (const state of ['approved-not-applied', 'approved-not-executed']) {
      expect(within(queue).getAllByText(new RegExp(state, 'i')).length).toBeGreaterThan(0)
    }
  })

  it('renders aging as a derived flag on a pending critical request, never as a state', () => {
    render(<ConsoleUsersScreen />)
    const queue = screen.getByRole('region', { name: /Approval queue/i })
    expect(within(queue).getAllByText(/aging/i).length).toBeGreaterThan(0)
    expect(APPROVAL_STATES).not.toContain('aging')
  })

  it('names all nine fields an approval request carries (AC-SA-08-07)', () => {
    render(<ConsoleUsersScreen />)
    expect(APPROVAL_REQUEST_FIELDS).toHaveLength(9)
    const queue = screen.getByRole('region', { name: /Approval queue/i })
    for (const field of APPROVAL_REQUEST_FIELDS) {
      expect(within(queue).getAllByText(new RegExp(field, 'i')).length).toBeGreaterThan(0)
    }
  })

  it('carries composed-agent review and tier publication in the same queue under their own classes', () => {
    render(<ConsoleUsersScreen />)
    const queue = screen.getByRole('region', { name: /Approval queue/i })
    expect(within(queue).getAllByText(/Composed-agent review/i).length).toBeGreaterThan(0)
    expect(within(queue).getAllByText(/Tier publication/i).length).toBeGreaterThan(0)
  })

  it('offers filters on class, state, age and proposer to all four roles', () => {
    for (const role of SA08_PLATFORM_ROLES) {
      const { unmount } = render(<ConsoleUsersScreen role={role.id} />)
      const queue = screen.getByRole('region', { name: /Approval queue/i })
      for (const label of [/Filter by class/i, /Filter by state/i, /Filter by age/i, /Filter by proposer/i]) {
        expect(within(queue).getByLabelText(label), `${role.id}`).toBeDefined()
      }
      unmount()
    }
  })

  it('offers no approve-all control to any role', () => {
    for (const role of SA08_PLATFORM_ROLES) {
      const { container, unmount } = render(<ConsoleUsersScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `offered to ${role.id}`).not.toMatch(/approve all|approve-all|bulk approve/i)
      }
      unmount()
    }
  })

  it('says "Submit for approval", never "Save" or "Apply", on its mutating controls', () => {
    const { container } = render(<ConsoleUsersScreen role="ADMIN" />)
    for (const text of interactiveText(container)) {
      expect(text).not.toMatch(/^\s*(Save|Apply)\b/i)
    }
    expect(screen.getAllByText(/Submit for/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-08 — the three prohibition renderings, by rule', () => {
  it('replaces the action bar with the class badge for a non-root role on a critical item', () => {
    for (const roleId of ['ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'] as const) {
      const { unmount } = render(<ConsoleUsersScreen role={roleId} />)
      const critical = row(/Approval queue/i, 'AR-4473')
      expect(
        within(critical).getByText(/Critical class — root approval required/i),
        roleId,
      ).toBeDefined()
      expect(within(critical).queryByRole('button', { name: /Approve/i }), roleId).toBeNull()
      expect(within(critical).queryByRole('button', { name: /Decline/i }), roleId).toBeNull()
      unmount()
    }
  })

  it('gives the root a live action bar on the same critical item', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" />)
    const critical = row(/Approval queue/i, 'AR-4473')
    expect(
      within(critical).getByRole('button', { name: /Approve/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    expect(within(critical).getByRole('button', { name: /Decline/i })).toBeDefined()
  })

  it('refuses self-approval with a named reason rather than hiding the control (AC-SA-08-05)', () => {
    render(<ConsoleUsersScreen role="ADMIN" />)
    // AR-4472 is an engineering-class request this Admin identity proposed.
    const own = row(/Approval queue/i, 'AR-4472')
    const approve = within(own).getByRole('button', { name: /Approve/i })
    expect(approve.getAttribute('aria-disabled')).toBe('true')
    const reason = document.getElementById(approve.getAttribute('aria-describedby') ?? '')
    expect(reason?.textContent ?? '').toMatch(/own|self-approval|make and approve/i)
  })

  it('draws no approval path at all for anything touching the six enforced invariants', () => {
    for (const role of SA08_PLATFORM_ROLES) {
      const { container, unmount } = render(<ConsoleUsersScreen role={role.id} />)
      const region = screen.getByRole('region', { name: /Enforced invariants/i })
      expect(region.querySelector('button'), role.id).toBeNull()
      expect(region.querySelector('input'), role.id).toBeNull()
      expect(region.querySelector('[role=switch]'), role.id).toBeNull()
      expect(region.querySelector('[tabindex]'), role.id).toBeNull()
      for (const text of interactiveText(container)) {
        expect(text, `offered to ${role.id}`).not.toMatch(/invariant/i)
      }
      unmount()
    }
    render(<ConsoleUsersScreen />)
    expect(screen.getByText(/no approval path exists for any account/i)).toBeDefined()
  })
})

describe('MOD-SA-08 — critical-class routing and the blocked attempt (AC-SA-000-04)', () => {
  it('routes every one of the eleven critical actions to the root and flags the count discrepancy', () => {
    render(<ConsoleUsersScreen />)
    const region = screen.getByRole('region', { name: /Critical-class routing/i })
    // Scoped to the routing TABLE: the same eleven names also fill the
    // initiation selector in this region, and a bare getByText would find
    // both and pass on whichever it liked.
    const table = within(region).getByRole('table', { name: /critical-class actions/i })
    expect(CRITICAL_ACTIONS).toHaveLength(11)
    for (const action of CRITICAL_ACTIONS) {
      const tr = within(table).getByText(action.name).closest('tr')
      expect(tr?.textContent ?? '', action.id).toMatch(/Root Super Admin/)
    }
    expect(within(region).getAllByText(/eleven distinct items/i).length).toBeGreaterThan(0)
  })

  it('blocks an Admin-initiated critical action and records the blocked attempt as an audit event', () => {
    render(<ConsoleUsersScreen role="ADMIN" />)
    const region = screen.getByRole('region', { name: /Critical-class routing/i })
    // Anchored: the panel's own prose says "blocked until the root
    // approves" before anything is submitted, so an unanchored match would
    // pass without the attempt ever being made.
    const outcome = /^Blocked until the root approves$/
    expect(within(region).queryAllByText(outcome)).toHaveLength(0)
    fireEvent.click(within(region).getByRole('button', { name: /Submit for root approval/i }))
    expect(within(region).queryAllByText(outcome)).toHaveLength(1)
    expect(within(region).getAllByText(/blocked attempt is itself an audit event/i).length).toBe(2)
    expect(within(region).queryByText(/^Applied$/)).toBeNull()
  })

  it.each(['PLATFORM_ENGINEER', 'SUPPORT'] as const)(
    'renders the initiation control inert with a named reason for %s',
    (roleId) => {
      render(<ConsoleUsersScreen role={roleId} />)
      const region = screen.getByRole('region', { name: /Critical-class routing/i })
      const submit = within(region).getByRole('button', { name: /Submit for root approval/i })
      expect(submit.getAttribute('aria-disabled')).toBe('true')
      const reason = document.getElementById(submit.getAttribute('aria-describedby') ?? '')
      expect(reason?.textContent ?? '').not.toBe('')
    },
  )
})

describe('MOD-SA-08 — root-unavailable is a first-class screen state (D13)', () => {
  it('freezes the critical class and names the decision', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" rootAvailable={false} />)
    expect(screen.getAllByText(/critical class frozen — no second approver exists/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/DEC-ROOTSUCC-001/).length).toBeGreaterThan(0)
  })

  it('names all seven capabilities the freeze takes down', () => {
    render(<ConsoleUsersScreen rootAvailable={false} />)
    const region = screen.getByRole('region', { name: /Root availability/i })
    expect(ROOT_FROZEN_CAPABILITIES).toHaveLength(7)
    for (const capability of ROOT_FROZEN_CAPABILITIES) {
      expect(within(region).getByText(new RegExp(capability.name, 'i')), capability.id).toBeDefined()
    }
  })

  it('does not drain the queue: pending critical requests stay pending, for every role', () => {
    for (const role of SA08_PLATFORM_ROLES) {
      const { unmount } = render(<ConsoleUsersScreen role={role.id} rootAvailable={false} />)
      const critical = row(/Approval queue/i, 'AR-4473')
      expect(critical.textContent ?? '', role.id).toMatch(/pending/i)
      const approve = within(critical).queryByRole('button', { name: /Approve/i })
      if (approve !== null) expect(approve.getAttribute('aria-disabled'), role.id).toBe('true')
      unmount()
    }
  })

  it('leaves the engineering class approvable while the root is unavailable', () => {
    render(<ConsoleUsersScreen role="ADMIN" rootAvailable={false} />)
    const engineering = row(/Approval queue/i, 'AR-4471')
    expect(
      within(engineering).getByRole('button', { name: /Approve/i }).getAttribute('aria-disabled'),
    ).toBeNull()
  })

  it('states plainly that the root approves its own critical action, and why', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" />)
    // AR-4474 is a critical request the root itself proposed.
    const own = row(/Approval queue/i, 'AR-4474')
    expect(
      within(own).getByRole('button', { name: /Approve/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    expect(within(own).getByText(/no second critical approver/i)).toBeDefined()
  })
})

describe('MOD-SA-08 — no dead controls: every live control does something honest', () => {
  it('an approved engineering change becomes approved, never applied (AC-SA-08-08)', () => {
    render(<ConsoleUsersScreen role="ADMIN" />)
    fireEvent.click(within(row(/Approval queue/i, 'AR-4471')).getByRole('button', { name: /Approve/i }))
    const after = row(/Approval queue/i, 'AR-4471')
    expect(after.textContent ?? '').toMatch(/approved/i)
    expect(after.textContent ?? '').not.toMatch(/\bapplied\b/i)
    expect(within(after).getByText(/Application is a separate step/i)).toBeDefined()
  })

  it('a returned change stops offering a decision and says nothing was applied', () => {
    render(<ConsoleUsersScreen role="ADMIN" />)
    fireEvent.click(
      within(row(/Approval queue/i, 'AR-4471')).getByRole('button', {
        name: /Return with a categorised reason/i,
      }),
    )
    const after = row(/Approval queue/i, 'AR-4471')
    expect(after.textContent ?? '').toMatch(/returned/i)
    expect(within(after).getByRole('button', { name: /Approve/i }).getAttribute('aria-disabled')).toBe('true')
  })

  it('a declined critical request invents no state name for itself', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" />)
    fireEvent.click(within(row(/Approval queue/i, 'AR-4473')).getByRole('button', { name: /Decline/i }))
    const after = row(/Approval queue/i, 'AR-4473')
    expect(within(after).getByText(/nothing executed, the current state stands/i)).toBeDefined()
    expect(within(after).queryByRole('button', { name: /Approve/i })).toBeNull()
    // The source closes the approval-state set without a declined member.
    expect(APPROVAL_STATES).not.toContain('declined')
  })

  // One case per control, each on its OWN render. The previous single-render
  // loop asserted only `getByRole('status').textContent !== ''` against ONE
  // shared notice element: the first click filled it permanently, so the
  // assertion was true forever afterwards and three of the four controls
  // could be no-ops without the gate noticing.
  it.each([
    ['Create user', /Create user/i, /create-account request in this prototype only/i],
    ['Role assignment', /Role assignment/i, /role-assignment act against account CA-04/i],
    ['Disable account', /Disable account/i, /disable-account act against CA-03/i],
    ['Last-activity review', /Last-activity review/i, /Last-activity review opened over the 5 accounts/i],
  ] as const)('the Users pane control %s reports what it, and only it, actually did', (_label, name, said) => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" />)
    const pane = screen.getByRole('region', { name: /Users pane/i })
    expect(within(pane).queryByRole('status')).toBeNull()
    fireEvent.click(within(pane).getByRole('button', { name }))
    expect(within(pane).getByRole('status').textContent ?? '').toMatch(said)
  })

  it('no Users pane control claims an effect the prototype did not have', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" />)
    const pane = screen.getByRole('region', { name: /Users pane/i })
    const accountRow = (id: string): string =>
      within(pane).getByText(id).closest('tr')?.textContent ?? ''
    const before = { 'CA-03': accountRow('CA-03'), 'CA-04': accountRow('CA-04') }
    fireEvent.click(within(pane).getByRole('button', { name: /Disable account/i }))
    // The notice says CA-03 still reads active; the table must agree.
    expect(accountRow('CA-03')).toBe(before['CA-03'])
    expect(accountRow('CA-03')).toMatch(/active/)
    fireEvent.click(within(pane).getByRole('button', { name: /Role assignment/i }))
    expect(accountRow('CA-04')).toBe(before['CA-04'])
    expect(accountRow('CA-04')).toMatch(/No role held/)
    fireEvent.click(within(pane).getByRole('button', { name: /Create user/i }))
    expect(pane.querySelectorAll('tbody tr')).toHaveLength(5)
  })

  // The direction a notice points is read off the DOM, never off the copy.
  // The previous gate accepted "the matrix above" for a matrix the document
  // puts below, because nothing compared the claim with the layout.
  it('points at the matrix in the direction the document actually puts it', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" />)
    const pane = screen.getByRole('region', { name: /Users pane/i })
    fireEvent.click(within(pane).getByRole('button', { name: /Role assignment/i }))
    const notice = within(pane).getByRole('status')
    const matrix = screen.getByRole('region', { name: /Roles pane/i })
    const drawnBelow = Boolean(
      notice.compareDocumentPosition(matrix) & Node.DOCUMENT_POSITION_FOLLOWING,
    )
    const claim = /the matrix (above|below)/.exec(notice.textContent ?? '')
    expect(claim, 'the notice names a direction to the matrix').not.toBeNull()
    expect(claim?.[1]).toBe(drawnBelow ? 'below' : 'above')
  })

  // Every "listed below" / "in the table below" in a Users pane notice, held
  // against the table it points at, in the state that empties it.
  it('STATE-01: the account-scoped controls refuse for the empty pane instead of counting accounts that do not exist', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" screenState="STATE-01" />)
    const pane = screen.getByRole('region', { name: /Users pane/i })
    expect(pane.querySelectorAll('tbody tr')).toHaveLength(0)
    expect(within(pane).getAllByText(/No console account exists yet/i).length).toBeGreaterThan(0)
    for (const name of [/Role assignment/i, /Disable account/i, /Last-activity review/i]) {
      const control = within(pane).getByRole('button', { name })
      expect(control.getAttribute('aria-disabled'), String(name)).toBe('true')
      const reason = document.getElementById(control.getAttribute('aria-describedby') ?? '')
      expect(reason?.textContent ?? '', String(name)).toMatch(/nothing to act on/i)
      fireEvent.click(control)
    }
    // STATE-01 keeps the creating action, and only that one.
    expect(
      within(pane).getByRole('button', { name: /Create user/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    expect(within(pane).queryByRole('status')).toBeNull()
    expect(pane.textContent ?? '').not.toMatch(/\b0 accounts\b/)
  })

  it('counts the accounts the table draws, in the states that draw them', () => {
    for (const state of ['STATE-03', 'STATE-08', 'STATE-13'] as const) {
      const { unmount } = render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" screenState={state} />)
      const pane = screen.getByRole('region', { name: /Users pane/i })
      const drawn = pane.querySelectorAll('tbody tr').length
      fireEvent.click(within(pane).getByRole('button', { name: /Last-activity review/i }))
      expect(within(pane).getByRole('status').textContent ?? '', state).toMatch(
        new RegExp(`over the ${drawn} accounts listed below`),
      )
      unmount()
    }
  })
})

describe('MOD-SA-08 — a recorded click never outranks the role or the state', () => {
  it('clears the decision when the role switcher moves', () => {
    render(<ConsoleUsersScreen role="ADMIN" />)
    fireEvent.click(within(row(/Approval queue/i, 'AR-4471')).getByRole('button', { name: /Approve/i }))
    expect(row(/Approval queue/i, 'AR-4471').textContent ?? '').toMatch(/Approved as request AR-4471/)
    fireEvent.change(screen.getByLabelText(/Console role/i), { target: { value: 'SUPPORT' } })
    const asSupport = row(/Approval queue/i, 'AR-4471')
    expect(asSupport.textContent ?? '').not.toMatch(/Approved as request/)
    expect(asSupport.textContent ?? '').toMatch(/pending/)
  })

  it('clears the decision when the screen-state switcher moves to a state that says nothing was decided', () => {
    render(<ConsoleUsersScreen role="ADMIN" />)
    fireEvent.click(within(row(/Approval queue/i, 'AR-4471')).getByRole('button', { name: /Approve/i }))
    fireEvent.change(screen.getByLabelText(/Screen state/i), { target: { value: 'STATE-12' } })
    const failed = row(/Approval queue/i, 'AR-4471')
    expect(failed.textContent ?? '').not.toMatch(/Approved as request/)
    expect(failed.textContent ?? '').toMatch(/pending/)
    expect(screen.getAllByText(/nothing is shown as decided/i).length).toBeGreaterThan(0)
  })

  it('clears the Users pane notice when the state switcher empties the table under it', () => {
    render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" />)
    const pane = () => screen.getByRole('region', { name: /Users pane/i })
    fireEvent.click(within(pane()).getByRole('button', { name: /Last-activity review/i }))
    expect(within(pane()).getByRole('status').textContent ?? '').toMatch(/5 accounts listed below/)
    fireEvent.change(screen.getByLabelText(/Screen state/i), { target: { value: 'STATE-01' } })
    expect(within(pane()).queryByRole('status')).toBeNull()
    expect(pane().querySelectorAll('tbody tr')).toHaveLength(0)
  })
})

describe('MOD-SA-08 STATE-06 — the read-only claim is backed by the controls', () => {
  it('disables every console input and names exactly one cause', () => {
    const { container } = render(<ConsoleUsersScreen role="ROOT_SUPER_ADMIN" screenState="STATE-06" />)
    const harness = ['Console role', 'Screen state', 'Root availability']
    const selects = Array.from(container.querySelectorAll('select'))
    const consoleSelects = selects.filter(
      (s) => !harness.some((h) => (document.querySelector(`label[for="${s.id}"]`)?.textContent ?? '').includes(h)),
    )
    // Four queue filters plus the critical-action selector.
    expect(consoleSelects).toHaveLength(5)
    for (const s of consoleSelects) expect(s.disabled, s.id).toBe(true)
    // The harness switchers stay operable, exactly as the banner says.
    expect(selects.filter((s) => s.disabled)).toHaveLength(5)
    for (const name of [/Approve/i, /Create user/i, /Role assignment/i, /Disable account/i, /Last-activity review/i, /Submit for root approval/i]) {
      for (const control of screen.getAllByRole('button', { name })) {
        expect(control.getAttribute('aria-disabled'), String(name)).toBe('true')
      }
    }
    // One cause, in one wording. Before this gate the Users pane blamed
    // "a root-only administrative action" for a root that plainly holds it,
    // while the banner blamed the state — two causes for one refusal.
    const reasons = Array.from(container.querySelectorAll('button[aria-describedby]')).map(
      (b) => document.getElementById(b.getAttribute('aria-describedby') ?? '')?.textContent ?? '',
    )
    // ONE wording across every state-blocked control -- and it is a POINTER
    // at the banner, not a restatement of the cause. STATE-06 says "one
    // banner, one cause"; this assertion used to require the cause itself on
    // every control, which is the scatter the contract forbids.
    const stateCaused = reasons.filter((r) => /banner above names the cause/i.test(r))
    expect(new Set(stateCaused).size, 'one wording for the state block').toBe(1)
    expect(stateCaused.length, 'no control points at the banner').toBeGreaterThan(0)
    // Every control this ROLE holds must blame the state and nothing else:
    // the root plainly carries console account administration, so a reason
    // calling it root-only here is a second, false cause for one refusal.
    const pane = screen.getByRole('region', { name: /Users pane/i })
    for (const name of [/Create user/i, /Role assignment/i, /Disable account/i, /Last-activity review/i]) {
      const control = within(pane).getByRole('button', { name })
      const reason = document.getElementById(control.getAttribute('aria-describedby') ?? '')
      expect(reason?.textContent ?? '', String(name)).toMatch(/banner above names the cause/i)
    }
    expect(reasons.filter((r) => /root-only administrative action/i.test(r))).toHaveLength(0)
    // Whatever else refuses does so for a cause that holds in every state:
    // a role that never carried that control (the root cannot return).
    for (const reason of reasons.filter((r) => !/banner above names the cause/i.test(r))) {
      expect(reason).toMatch(/does not carry/i)
    }
  })
})

describe('MOD-SA-08 — the twelve applicable screen states', () => {
  it('offers all twelve, and never the frontline-only STATE-07', () => {
    render(<ConsoleUsersScreen />)
    const selector = screen.getByLabelText(/Screen state/i)
    expect(within(selector).queryByText(/STATE-07/)).toBeNull()
    for (const state of SA_APPLICABLE_STATES) {
      expect(within(selector).getByText(new RegExp(state.id)), state.id).toBeDefined()
    }
    expect(within(selector).getAllByRole('option')).toHaveLength(12)
  })

  it.each(SA_APPLICABLE_STATES.map((s) => s.id))('renders %s without losing the module', (stateId) => {
    render(<ConsoleUsersScreen screenState={stateId} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('region', { name: /Approval queue/i })).toBeDefined()
  })

  it('STATE-11: with every model unavailable the queue remains fully operable', () => {
    render(<ConsoleUsersScreen role="ADMIN" screenState="STATE-11" />)
    const engineering = row(/Approval queue/i, 'AR-4471')
    expect(
      within(engineering).getByRole('button', { name: /Approve/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    expect(screen.getByText(/No agent contributes to any decision on this screen/i)).toBeDefined()
  })

  it('STATE-12: an approval write failure leaves the object unchanged and the request visibly pending (FB-SA-02)', () => {
    render(<ConsoleUsersScreen role="ADMIN" screenState="STATE-12" />)
    expect(screen.getAllByText(/FB-SA-02/).length).toBeGreaterThan(0)
    const engineering = row(/Approval queue/i, 'AR-4471')
    expect(engineering.textContent ?? '').toMatch(/pending/i)
    expect(
      within(engineering).getByRole('button', { name: /Approve/i }).getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('STATE-06: one banner, one cause', () => {
    render(<ConsoleUsersScreen screenState="STATE-06" />)
    expect(
      screen.getAllByRole('status').filter((n) => /read-only/i.test(n.textContent ?? '')),
    ).toHaveLength(1)
  })

  it('STATE-04: names the rule that was broken and what would be accepted', () => {
    render(<ConsoleUsersScreen role="ADMIN" screenState="STATE-04" />)
    expect(screen.getByRole('alert').textContent ?? '').toMatch(/reason/i)
  })

  it('STATE-09: an approved request that has not taken effect renders in its true state', () => {
    render(<ConsoleUsersScreen screenState="STATE-09" />)
    const queue = screen.getByRole('region', { name: /Approval queue/i })
    expect(within(queue).getAllByText(/approved-not-applied/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-08 — aggregates never render as zero or blank (AC-SA-01-03)', () => {
  it('STATE-03 renders the queue aggregate with an as-of timestamp', () => {
    render(<ConsoleUsersScreen screenState="STATE-03" />)
    const region = screen.getByRole('region', { name: /Queue standing/i })
    expect(within(region).getByText(/as of/i)).toBeDefined()
  })

  it('STATE-08 degrades to stale WITH its age, never to zero', () => {
    render(<ConsoleUsersScreen screenState="STATE-08" />)
    const region = screen.getByRole('region', { name: /Queue standing/i })
    expect(region.textContent ?? '').toMatch(/stale/i)
    expect(region.textContent ?? '').toMatch(/\d+ (minutes|hours) old/i)
  })

  it('STATE-12 degrades to unavailable, never to zero or blank', () => {
    render(<ConsoleUsersScreen screenState="STATE-12" />)
    const region = screen.getByRole('region', { name: /Queue standing/i })
    expect(region.textContent ?? '').toMatch(/Unavailable/i)
    expect(region.textContent ?? '').not.toMatch(/\b0\b/)
  })

  it('STATE-01: the aggregate counts the same records the tables draw — none of them', () => {
    render(<ConsoleUsersScreen screenState="STATE-01" />)
    const region = screen.getByRole('region', { name: /Queue standing/i })
    // The contradiction this guards: an aggregate asserting eight records
    // exist on a screen whose two tables both say none do.
    expect(region.textContent ?? '').not.toMatch(/\d+ pending/)
    expect(region.textContent ?? '').not.toMatch(/\b0\b/)
    expect(within(region).getByText(/Nothing is waiting for a platform-level decision/i)).toBeDefined()
    expect(within(region).getByText(/as of/i)).toBeDefined()
    expect(
      screen.getByRole('region', { name: /Approval queue/i }).querySelectorAll('tbody tr'),
    ).toHaveLength(0)
    expect(
      screen.getByRole('region', { name: /Users pane/i }).querySelectorAll('tbody tr'),
    ).toHaveLength(0)
  })

  it('STATE-13: draws only the re-read records, names the ones it will not draw, and counts the same set', () => {
    render(<ConsoleUsersScreen screenState="STATE-13" />)
    const queue = screen.getByRole('region', { name: /Approval queue/i })
    const drawn = Array.from(queue.querySelectorAll('tbody tr'))
    expect(drawn).toHaveLength(6)
    const banner = screen.getAllByText(/being re-read after a failure/i)[0]?.textContent ?? ''
    for (const id of ['AR-4466', 'AR-4467']) {
      expect(within(queue).queryByText(id), id).toBeNull()
      expect(banner, `${id} named in the recovering banner`).toContain(id)
    }
    expect(within(queue).getByText('AR-4471')).toBeDefined()
    // The two withheld records are the approved-not-applied and the
    // approved-not-executed ones, so neither may appear in the aggregate.
    const standing = screen.getByRole('region', { name: /Queue standing/i })
    expect(standing.textContent ?? '').not.toMatch(/approved-not-applied|approved-not-executed/)
    expect(standing.textContent ?? '').toMatch(/2 pending engineering-class requests/)
  })

  it('STATE-02 renders a placeholder, never the number nought', () => {
    render(<ConsoleUsersScreen screenState="STATE-02" />)
    const region = screen.getByRole('region', { name: /Queue standing/i })
    expect(region.textContent ?? '').not.toMatch(/\b0\b/)
    expect(within(region).getByRole('status')).toBeDefined()
  })
})

describe('MOD-SA-08 — what the source does and does not define', () => {
  it('names every workflow the source gives this module, with the panel that carries it', () => {
    render(<ConsoleUsersScreen />)
    const panel = screen.getByRole('region', { name: /Workflows this module renders/i })
    expect(SA08_WORKFLOWS.length).toBeGreaterThan(0)
    for (const w of SA08_WORKFLOWS) {
      // Full name, not a prefix: two of these workflows share their first
      // forty characters, and a prefix match would silently accept one
      // rendered row as proof that both were built.
      const escaped = w.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      expect(within(panel).getAllByText(new RegExp(escaped)).length, w.id).toBeGreaterThan(0)
    }
    expect(SA08_WORKFLOWS.every((w) => w.matchedBy.length > 0)).toBe(true)
  })

  it('names every missing affordance instead of inventing a control', () => {
    render(<ConsoleUsersScreen />)
    const panel = screen.getByRole('region', { name: /Unspecified in source/i })
    expect(SA08_UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const item of SA08_UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(item.affordance), item.affordance).toBeDefined()
    }
    expect(panel.querySelector('button')).toBeNull()
    expect(panel.querySelector('input')).toBeNull()
  })

  it('states the source conflicts rather than resolving them silently', () => {
    render(<ConsoleUsersScreen />)
    const panel = screen.getByRole('region', { name: /Conflicts in the source/i })
    for (const phrase of [/L76133/, /L44774/, /L48793/, /L55989/, /L55942/]) {
      expect(within(panel).getAllByText(phrase).length).toBeGreaterThan(0)
    }
  })

  it('keeps every queue fixture row inside the closed state and class vocabularies', () => {
    for (const request of APPROVAL_REQUESTS) {
      expect(APPROVAL_STATES, request.id).toContain(request.state)
      expect(CHANGE_CLASSES.map((c) => c.id), request.id).toContain(request.changeClass)
    }
  })
})
