import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { DevicesScreen } from '../../app/hub/devices/DevicesScreen'
import {
  ABSENT_BY_RULE,
  APPLICABLE_SCREEN_STATES,
  APP_VERSION_FLOOR,
  CONSOLE_OWNED_DEVICE_STATES,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  INAPPLICABLE_SCREEN_STATES,
  SCREEN_IDENTIFIER,
  SEEDED_DEVICES,
  TENANT_DEVICE_ENROLMENT_FLAG,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
} from '../../app/hub/devices/fixtures'
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

function statedReason(el: HTMLElement): string {
  const id = el.getAttribute('aria-describedby')
  if (id === null) return ''
  return document.getElementById(id)?.textContent ?? ''
}

function deviceCard(id: string): HTMLElement {
  const card = document.querySelector(`[data-device="${id}"]`)
  if (card === null) throw new Error(`No device card for ${id}`)
  return card as HTMLElement
}

describe('the device screen — identity, and the module it deliberately does not claim', () => {
  it('renders one h1, keeps the uncatalogued identifier, and mints no catalogue number', () => {
    render(<DevicesScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const body = document.body.textContent ?? ''
    expect(body).toContain(SCREEN_IDENTIFIER)
    expect(body).toMatch(/UNCATALOGUED/)
    // No SCR-DOH-NN number is invented for it, in either catalogue's form.
    expect(body).not.toMatch(/SCR-DOH-\d/)
    expect(body).toMatch(/Simulated behaviour only/)
  })

  it('wraps the shell in its uncatalogued mode, claiming no module and taking no rail place', () => {
    render(<DevicesScreen />)
    const body = document.body.textContent ?? ''
    expect(body).toMatch(/This screen claims no module, and is not in the module rail/)
    expect(body).toMatch(/mint exactly the ownership its card refuses/)
    expect(body).toMatch(/UNCATALOGUED-SCREEN mode/)
    // No rail: the shared chrome draws one only where a module is current.
    expect(screen.queryByRole('navigation', { name: 'Hub modules' })).toBeNull()
    // But it IS the shell's chrome — its breadcrumb, its persona switcher and
    // its disclosure, rather than a second copy of them. If the shell's
    // uncatalogued mode regressed to dropping children, the inventory below
    // would vanish and this whole file would red.
    expect(
      screen.getByRole('link', { name: 'Delivery Operations Hub' }).getAttribute('href'),
    ).toMatch(/^\/hub\/?$/)
    expect(screen.getByLabelText('View as tenant role')).toBeTruthy()
    expect(region('Device inventory')).toBeTruthy()
  })

  it('renders nothing at all for a persona the surface withholds the Hub from', () => {
    render(<DevicesScreen />)
    viewAs('WORKER')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Unavailable/)
    expect(screen.queryByRole('region', { name: 'Device inventory' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Enrol a device' })).toBeNull()
  })
})

describe('the device screen — the named feature flag (D3)', () => {
  it('defaults to enabled, and switching it off withholds the whole feature', () => {
    render(<DevicesScreen />)
    const flag = screen.getByLabelText(new RegExp(TENANT_DEVICE_ENROLMENT_FLAG, 'i'))
    expect((flag as HTMLInputElement).checked).toBe(true)
    expect(region('Device inventory')).toBeTruthy()

    fireEvent.click(flag)

    expect(screen.queryByRole('region', { name: 'Device inventory' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Enrol a device' })).toBeNull()
    const off = region('Feature flag off')
    expect(off.textContent).toMatch(/ABSENT rather than disabled/)
    expect(off.textContent).toMatch(/DEC-DEVOWN-001/)
    // ABSENT, not disabled: no inert device control is left behind.
    const denied = region('Permission denied')
    expect(within(denied).queryAllByRole('button')).toEqual([])
  })
})

describe('the device screen — the inventory carries the panel fields the source names', () => {
  it('renders every seeded device with its fields', () => {
    render(<DevicesScreen />)
    for (const device of SEEDED_DEVICES) {
      const card = deviceCard(device.id)
      expect(card.textContent, device.id).toContain(device.platform)
      expect(card.textContent, device.id).toContain(device.appVersion)
      expect(card.textContent, device.id).toContain(device.enrolledOn)
      expect(card.textContent, device.id).toContain(device.lastSeen)
      expect(card.textContent, device.id).toMatch(new RegExp(`sync ${device.syncHealth}`))
      expect(card.textContent, device.id).toMatch(
        new RegExp(`storage ${device.storagePressure}`),
      )
      expect(card.textContent, device.id).toContain(APP_VERSION_FLOOR)
    }
  })

  it('never presents unsynced captures as recorded', () => {
    render(<DevicesScreen />)
    const card = deviceCard('TAB-014')
    expect(card.textContent).toMatch(/NOT recorded anywhere until they arrive/)
  })

  it('shows an enrolled-but-unstaged device as not ready, never as ready', () => {
    render(<DevicesScreen />)
    const card = deviceCard('TAB-033')
    expect(card.textContent).toMatch(/NOT READY/)
    expect(card.textContent).not.toMatch(/\bready to run\b/i)
  })
})

describe('the device screen — enrolment, and the floor that refuses by name', () => {
  it('refuses a version below the floor, states the floor, and writes nothing', () => {
    render(<DevicesScreen />)
    fireEvent.change(screen.getByLabelText(/device identifier/i), {
      target: { value: 'TAB-099' },
    })
    fireEvent.change(screen.getByLabelText(/application version/i), {
      target: { value: '2.0.9' },
    })
    const button = screen.getByRole('button', { name: /enrol this device/i })
    expect(isInert(button)).toBe(true)
    expect(statedReason(button)).toContain(APP_VERSION_FLOOR)
    expect(statedReason(button)).toMatch(/cannot be enrolled at all/)
    fireEvent.click(button)
    expect(document.querySelector('[data-device="TAB-099"]')).toBeNull()
  })

  it('enrols at the floor and shows the new device as enrolled and not ready', () => {
    render(<DevicesScreen />)
    fireEvent.change(screen.getByLabelText(/device identifier/i), {
      target: { value: 'TAB-099' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enrol this device/i }))
    const card = deviceCard('TAB-099')
    expect(card.textContent).toMatch(/NOT READY/)
    expect(card.textContent).toMatch(/enrolled/)
  })

  it('refuses a duplicate identifier and writes nothing', () => {
    render(<DevicesScreen />)
    fireEvent.change(screen.getByLabelText(/device identifier/i), {
      target: { value: 'TAB-014' },
    })
    const button = screen.getByRole('button', { name: /enrol this device/i })
    expect(isInert(button)).toBe(true)
    expect(statedReason(button)).toMatch(/already enrolled/)
    expect(document.querySelectorAll('[data-device="TAB-014"]')).toHaveLength(1)
  })

  it('offers no control to change the mode after enrollment', () => {
    render(<DevicesScreen />)
    for (const device of SEEDED_DEVICES) {
      const card = deviceCard(device.id)
      expect(within(card).queryByRole('combobox', { name: /mode/i }), device.id).toBeNull()
      expect(within(card).queryByRole('button', { name: /mode/i }), device.id).toBeNull()
    }
  })
})

describe('the device screen — reassignment refuses mid-run', () => {
  it('disables the reassignment of a device with a run in flight, with the reason', () => {
    render(<DevicesScreen />)
    const card = deviceCard('TAB-014')
    const button = within(card).getByRole('button', { name: /reassign TAB-014/i })
    expect(isInert(button)).toBe(true)
    expect(statedReason(button)).toMatch(/a run finishes on the package it started on/)
    expect(statedReason(button)).toContain('RUN-2026-08-14-A')
  })

  it('reassigns a device with nothing in flight, and says the device learns at next sync', () => {
    render(<DevicesScreen />)
    const card = () => deviceCard('TAB-021')
    expect(card().textContent).toContain('Paint Line')
    fireEvent.change(within(card()).getByRole('combobox', { name: /reassign TAB-021 to/i }), {
      target: { value: 'AREA-ARD-ASSY' },
    })
    fireEvent.click(within(card()).getByRole('button', { name: /reassign TAB-021/i }))
    expect(deviceCard('TAB-021').textContent).toContain('Assembly Hall')
    expect(region('Commands and requests').textContent).toMatch(/learns of it at its next sync/)
    expect(region('Commands and requests').textContent).toMatch(
      /only after confirmed receipt plus an integrity check/,
    )
  })
})

describe('the device screen — mark-lost and the wipe request (D27)', () => {
  it('marks lost as a STATE plus a command in its true state, and touches no device', () => {
    render(<DevicesScreen />)
    fireEvent.click(within(deviceCard('TAB-021')).getByRole('button', { name: /mark TAB-021 lost/i }))
    expect(deviceCard('TAB-021').textContent).toMatch(/reported_lost/)
    const commands = region('Commands and requests')
    expect(commands.textContent).toMatch(/suspension-on-lost-report on TAB-021/)
    expect(commands.textContent).toMatch(/created/)
    expect(commands.textContent).toMatch(/never triggers an automatic erasure/)
    // Its TRUE state, and never a nicer one. Asserted on the rendered STATE
    // BADGE rather than by scanning the region's prose: the copy beside the
    // badge uses those words in its DENIALS ("not delivered, not downloaded,
    // not applied"), and a text scan would be a gate tripping on its own
    // denial — the defect this build has already recorded four times.
    expect(within(commands).getAllByText('created').length).toBeGreaterThan(0)
    for (const terminal of ['applied', 'acknowledged', 'reconciled', 'delivered']) {
      expect(within(commands).queryByText(terminal), terminal).toBeNull()
    }
  })

  it('raises a wipe REQUEST that carries the class badge and reaches no device', () => {
    render(<DevicesScreen />)
    const card = deviceCard('TAB-014')
    expect(within(card).getByText(/Critical class — root approval required/)).toBeTruthy()
    fireEvent.click(within(card).getByRole('button', { name: /request a wipe of TAB-014/i }))
    const commands = region('Commands and requests')
    expect(commands.textContent).toMatch(/a wipe REQUEST on TAB-014/)
    expect(commands.textContent).toMatch(/wipes nothing itself/)
    expect(commands.textContent).toMatch(/root approver/)
    // IMPORTANT 2. The line this replaces was
    //   `expect(document.body.textContent).not.toMatch(/\bwiped\b(?!.*never)/i)`
    // and it could not fail: `textContent` is one long line, so the negative
    // lookahead scanned the whole remaining document and found a "never"
    // thousands of characters later. A planted "the device was wiped." at the
    // front of the body passed it. Replaced with an assertion on what is
    // actually RENDERED as a state: no badge on this screen reads a terminal
    // command state, and the device's own state chip still says what it is.
    for (const terminal of ['wiped', 'applied', 'acknowledged', 'reconciled', 'delivered']) {
      expect(screen.queryByText(terminal), terminal).toBeNull()
    }
    expect(within(card).getAllByText('in_service').length).toBeGreaterThan(0)
    expect(commands.textContent).toMatch(/wipes nothing itself/)
  })

  it('draws no control that executes a wipe or suspends a device, for anybody', () => {
    render(<DevicesScreen />)
    expect(screen.queryByRole('button', { name: /^wipe/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /suspend/i })).toBeNull()
    const card = deviceCard('TAB-014')
    expect(card.textContent).toMatch(/No control executes a wipe here, for any tenant role/)
  })
})

describe('the device screen — the gate, the audit path and the connection', () => {
  it('disables every write with the state’s reason under a suspension', () => {
    render(<DevicesScreen />)
    setTenantState('soft-suspended')
    const card = deviceCard('TAB-021')
    for (const name of [/reassign TAB-021/i, /retire TAB-021/i, /mark TAB-021 lost/i]) {
      const button = within(card).getByRole('button', { name })
      expect(isInert(button), String(name)).toBe(true)
      expect(statedReason(button), String(name)).toMatch(/soft-suspended/)
      expect(statedReason(button), String(name)).toMatch(/write-class enumerations name no device/)
    }
    expect(isInert(screen.getByRole('button', { name: /enrol this device/i }))).toBe(true)
  })

  it('disables rather than queues under connection loss', () => {
    render(<DevicesScreen />)
    setScreenState('STATE-08')
    const button = within(deviceCard('TAB-021')).getByRole('button', { name: /retire TAB-021/i })
    expect(isInert(button)).toBe(true)
    expect(statedReason(button)).toMatch(/disables rather than queues/)
  })

  /**
   * The audit path is proved by making a change APPEAR first and then proving
   * it does not happen under failure — the half that catches a handler that
   * changes nothing at all.
   */
  it('routes every write through the audit path, and says the action did not happen', () => {
    render(<DevicesScreen />)
    // It happens.
    fireEvent.click(within(deviceCard('TAB-021')).getByRole('button', { name: /retire TAB-021/i }))
    expect(deviceCard('TAB-021').textContent).toMatch(/retired/)

    // And under an audit failure the next one does not.
    const view = render(<DevicesScreen />)
    void view
    fireEvent.click(
      screen.getAllByLabelText(/simulate an audit-write failure on the next action/i)[1]!,
    )
    const cards = document.querySelectorAll('[data-device="TAB-021"]')
    const second = cards[cards.length - 1] as HTMLElement
    fireEvent.click(within(second).getByRole('button', { name: /mark TAB-021 lost/i }))
    expect(second.textContent).not.toMatch(/reported_lost/)
    expect(document.body.textContent).toMatch(/The action did not happen/)
    expect(document.body.textContent).toMatch(/no command was created, no request was raised/)
  })
})

describe('the device screen — the states, the table and the panels', () => {
  /**
   * EVERY write handler, not one of five. The recorded defect this exists for
   * is an audit path wired to a single handler — and that one the handler that
   * mutated nothing, so the contract was demonstrated where it cost nothing.
   * Each control is pressed under an audit failure and its OWN observable
   * consequence is asserted absent, and the covered list is pinned against the
   * controls the screen actually draws so a sixth added later cannot go
   * uncovered in silence.
   */
  it('routes EVERY write control through the audit path, not one of five', () => {
    const WRITES = [
      {
        name: /enrol this device/i,
        prepare: () =>
          fireEvent.change(screen.getByLabelText(/device identifier/i), {
            target: { value: 'TAB-777' },
          }),
        assertNothingHappened: () =>
          expect(document.querySelector('[data-device="TAB-777"]')).toBeNull(),
      },
      {
        name: /reassign TAB-021/i,
        prepare: () =>
          fireEvent.change(
            within(deviceCard('TAB-021')).getByRole('combobox', { name: /reassign TAB-021 to/i }),
            { target: { value: 'AREA-ARD-ASSY' } },
          ),
        assertNothingHappened: () =>
          expect(deviceCard('TAB-021').textContent).toMatch(/bound to [^·]*\/ Paint Line/),
      },
      {
        name: /retire TAB-021/i,
        prepare: () => {},
        assertNothingHappened: () =>
          expect(deviceCard('TAB-021').textContent).not.toMatch(/Retired —/),
      },
      {
        name: /mark TAB-021 lost/i,
        prepare: () => {},
        assertNothingHappened: () =>
          expect(deviceCard('TAB-021').textContent).not.toMatch(/reported_lost/),
      },
      {
        name: /request a wipe of TAB-021/i,
        prepare: () => {},
        assertNothingHappened: () =>
          expect(region('Commands and requests').textContent).not.toMatch(/wipe REQUEST/),
      },
    ] as const

    for (const write of WRITES) {
      const view = render(<DevicesScreen />)
      fireEvent.click(screen.getByLabelText(/simulate an audit-write failure on the next action/i))
      write.prepare()
      const button = screen.getByRole('button', { name: write.name })
      expect(isInert(button), String(write.name)).toBe(false)
      fireEvent.click(button)
      expect(document.body.textContent, String(write.name)).toMatch(/The action did not happen/)
      write.assertNothingHappened()
      view.unmount()
    }

    // The covered list equals the list the screen actually draws, so a write
    // control added later and forgotten reds here instead of going uncovered.
    // Matched on the control's VERB rather than on one device's label, since
    // four of the five are drawn once per device.
    const VERBS = [
      /^Enrol this device$/,
      /^Reassign TAB-\d+$/,
      /^Retire TAB-\d+$/,
      /^Mark TAB-\d+ lost$/,
      /^Request a wipe of TAB-\d+$/,
    ]
    expect(VERBS).toHaveLength(WRITES.length)
    render(<DevicesScreen />)
    const drawn = within(region('Device inventory'))
      .getAllByRole('button')
      .concat(within(region('Enrol a device')).getAllByRole('button'))
      .map((b) => b.textContent ?? '')
    expect(drawn.length).toBeGreaterThan(WRITES.length)
    for (const label of drawn) {
      expect(
        VERBS.some((v) => v.test(label)),
        `${label} is drawn but not covered by the audit sweep`,
      ).toBe(true)
    }
    // And every covered verb is actually drawn, so the list cannot pass by
    // covering controls that no longer exist.
    for (const verb of VERBS) {
      expect(drawn.some((label) => verb.test(label)), String(verb)).toBe(true)
    }
  })

  it('walks all ten applicable screen states, STATE-09 among them', () => {
    render(<DevicesScreen />)
    for (const id of APPLICABLE_SCREEN_STATES) {
      setScreenState(id)
      const state = region('Screen state')
      expect(state.textContent, id).toContain(id)
      expect(state.textContent, id).toContain(screenState(id).name)
    }
  })

  it('STATE-09 renders a command state and says nothing is ever reported as done', () => {
    render(<DevicesScreen />)
    setScreenState('STATE-09')
    const state = region('Screen state')
    expect(state.textContent).toMatch(/created/)
    expect(state.textContent).toMatch(/Nothing on this screen ever says a device was wiped/)
    // The badge itself reads a non-terminal state; the prose around it names
    // the terminal ones only to deny them.
    expect(within(state).getAllByText('created').length).toBeGreaterThan(0)
    expect(within(state).queryByText('applied')).toBeNull()
  })

  it('STATE-02 shows a skeleton rather than an empty inventory', () => {
    render(<DevicesScreen />)
    setScreenState('STATE-02')
    const inventory = region('Device inventory')
    expect(inventory.textContent).toMatch(/have not arrived/i)
    expect(document.querySelector('[data-device="TAB-014"]')).toBeNull()
  })

  it('STATE-04 states the broken rule and the permitted format', () => {
    render(<DevicesScreen />)
    fireEvent.change(screen.getByLabelText(/application version/i), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText(/device identifier/i), { target: { value: 'TAB-100' } })
    const enrol = region('Enrol a device')
    expect(enrol.textContent).toMatch(/below the floor/)
    expect(enrol.textContent).toMatch(/three dot-separated numbers/)
  })

  it('renders the control table with a provenance on every row', () => {
    render(<DevicesScreen />)
    const table = region('Control table')
    expect(table.textContent).toMatch(/NO FIVE-ROLE PERMISSION MATRIX FOR DEVICES EXISTS ANYWHERE/)
    for (const row of CONTROL_MATRIX) {
      expect(within(table).getByText(row.control), row.id).toBeTruthy()
    }
    expect(table.textContent).toMatch(/DERIVED from silence/)
    expect(table.textContent).toMatch(/Quoted from a source row/)
  })

  it('names the four device states the platform console owns', () => {
    render(<DevicesScreen />)
    const owned = region('What the platform console owns')
    for (const s of CONSOLE_OWNED_DEVICE_STATES) {
      expect(within(owned).getByText(s.name), s.name).toBeTruthy()
    }
  })

  it('says why each absent control is absent, and draws none of them', () => {
    render(<DevicesScreen />)
    const absent = region('Absent by rule')
    for (const item of ABSENT_BY_RULE) {
      expect(within(absent).getByText(item.label), item.label).toBeTruthy()
      expect(absent.textContent, item.label).toContain(item.note)
    }
    expect(within(absent).queryAllByRole('button')).toEqual([])
  })

  it('renders the decisions and both source panels', () => {
    render(<DevicesScreen />)
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
    // The lost-report gate concern is raised where a reviewer meets it.
    expect(region('Unspecified in source').textContent).toMatch(
      /security consequence of a commercial state/,
    )
  })
})
