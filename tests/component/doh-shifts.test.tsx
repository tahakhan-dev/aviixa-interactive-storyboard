import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ShiftManagementScreen } from '../../app/hub/shift-management/ShiftManagementScreen'
import {
  ABSENT_BY_RULE,
  CONTROL_MATRIX,
  DOH_SHIFTS,
  PLATFORM_DEFAULT_DIGEST_TIME,
  SHIFT_ANCHORS,
  SHIFT_CARDINALITY_OPTIONS,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  shiftsVisibleTo,
  type Shift,
} from '../../app/hub/shift-management/fixtures'
import { DOH_SITES } from '../../app/hub/location-configuration/fixtures'

const SHIFTS: readonly Shift[] = DOH_SHIFTS

/** Every write control this module draws, by its exact accessible name. */
const WRITE_CONTROLS = [
  /^create a shift$/i,
  /^save this shift$/i,
  /^bind this shift to the selected areas$/i,
  /^set the digest delivery time$/i,
  /^archive this shift$/i,
] as const

function region(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

function selectRole(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setSelect(label: RegExp | string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function setInput(label: RegExp | string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function button(name: RegExp): HTMLElement {
  return screen.getByRole('button', { name })
}

function click(name: RegExp): void {
  fireEvent.click(button(name))
}

/** Select a Shift in the register by its name. */
function pickShift(name: string): void {
  fireEvent.click(within(region('Shift register')).getByRole('button', { name: new RegExp(name) }))
}

const EARLY = DOH_SHIFTS.find((s) => s.id === 'SHIFT-ARD-EARLY')!
const LATE = DOH_SHIFTS.find((s) => s.id === 'SHIFT-ARD-LATE')!
const KELVIN = DOH_SHIFTS.find((s) => s.id === 'SHIFT-KEL-DAY')!
/** The Site the location module seeds with no Area, and therefore no Shift. */
const SITE_WITH_NO_SHIFT = DOH_SITES.find((s) => !DOH_SHIFTS.some((sh) => sh.siteId === s.id))!

describe('MOD-DOH-03 — the shell contract and the screen identity', () => {
  it('renders under the Hub shell with exactly one h1 and the module and screen as annotations', () => {
    render(<ShiftManagementScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Shift Management')
    expect(screen.getByText(/MOD-DOH-03 · SCR-DOH-05/)).toBeDefined()
  })

  it('carries the prototype disclosure and keeps every screen number out of every href', () => {
    const { container } = render(<ShiftManagementScreen />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/SCR-DOH/i)
    }
    expect(container.textContent ?? '').not.toMatch(/SCR-DOH-\d{3}/)
  })

  it('names the digest delivery as a cross-slice seam owned by a later slice, not an inline stub', () => {
    render(<ShiftManagementScreen />)
    const digest = region('Per-Shift digest delivery time').textContent ?? ''
    expect(digest).toMatch(/Cross-slice seam — not built here/i)
    expect(digest).toMatch(/slice 10/i)
  })

  it('draws no send control, no delivery status and no recipient list for the digest', () => {
    render(<ShiftManagementScreen />)
    const digest = region('Per-Shift digest delivery time')
    // Including the mute control: there is one digest service per Shift and
    // no role may suppress it, so the screen says so and must not draw one.
    for (const name of [/send/i, /deliver now/i, /recipient/i, /preview the digest/i, /mute/i]) {
      expect(within(digest).queryByRole('button', { name }), String(name)).toBeNull()
    }
  })
})

/* ------------------------------------------------------------------ *
 * TIMEZONE INHERITANCE — the property this module exists to hold, and
 * the only one whose absence would be invisible on a green suite.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — a Shift inherits its Site’s timezone and can never override it', () => {
  it('shows the inherited timezone as read-only text against the Shift being edited', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    const editor = region('Shift editor').textContent ?? ''
    expect(editor).toMatch(/Europe\/London/)
    expect(editor).toMatch(/inherited/i)
  })

  it('follows the parent Site: changing the Site in the editor changes the timezone shown', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    // Absence first, then the act, then presence — the shape a control that
    // writes state nothing reads would fail.
    expect(region('Shift editor').textContent ?? '').not.toMatch(/Europe\/Warsaw/)
    setSelect(/parent site/i, 'SITE-ARD-02')
    const editor = region('Shift editor').textContent ?? ''
    expect(editor).toMatch(/Europe\/Warsaw/)
    expect(editor).not.toMatch(/Europe\/London/)
  })

  it('re-offers the Areas of the new Site only, so a Shift can never be made to span Sites', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    const editor = () => region('Shift editor')
    expect(within(editor()).getByLabelText(/bind to Assembly Hall/i)).toBeDefined()
    setSelect(/parent site/i, 'SITE-ARD-02')
    expect(within(editor()).queryByLabelText(/bind to Assembly Hall/i)).toBeNull()
    expect(within(editor()).getByLabelText(/bind to Polishing Bay/i)).toBeDefined()
  })

  it('draws no control anywhere that could give a Shift a timezone of its own', () => {
    render(<ShiftManagementScreen />)
    expect(screen.queryByLabelText(/timezone/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /timezone/i })).toBeNull()
    const absent = region('Absent by rule').textContent ?? ''
    expect(absent).toMatch(/per-Shift timezone override/i)
    expect(absent).toMatch(/per-Area timezone/i)
  })

  it('shows each Shift in the register against the timezone its own Site carries', () => {
    render(<ShiftManagementScreen />)
    const register = region('Shift register')
    const earlyRow = within(register).getByRole('row', { name: new RegExp(EARLY.name) })
    expect(earlyRow.textContent ?? '').toMatch(/Europe\/London/)
    const kelvinRow = within(register).getByRole('row', { name: new RegExp(KELVIN.name) })
    expect(kelvinRow.textContent ?? '').toMatch(/Europe\/Warsaw/)
  })
})

/* ------------------------------------------------------------------ *
 * The register, its scope filter and its Site filter.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — the Shift register', () => {
  it('lists every seeded Shift for the Tenant Admin with its times, Areas and digest time', () => {
    render(<ShiftManagementScreen />)
    const register = region('Shift register').textContent ?? ''
    for (const shift of DOH_SHIFTS) {
      expect(register, shift.id).toContain(shift.name)
      expect(register, shift.id).toContain(`${shift.nominalStart}–${shift.nominalEnd}`)
    }
    expect(register).toContain('07:15')
    expect(register).toMatch(new RegExp(`as of`, 'i'))
  })

  it('scope-filters an Area-scoped Supervisor out of the Shifts they do not hold', () => {
    render(<ShiftManagementScreen />)
    expect(region('Shift register').textContent ?? '').toContain(KELVIN.name)
    selectRole('SUPERVISOR')
    const register = region('Shift register').textContent ?? ''
    expect(register).not.toContain(KELVIN.name)
    expect(register).toContain(EARLY.name)
    for (const shift of shiftsVisibleTo('SUPERVISOR', SHIFTS)) {
      expect(register, shift.id).toContain(shift.name)
    }
  })

  it('reaches STATE-01 through the Site filter, on the Site that holds no Shift', () => {
    render(<ShiftManagementScreen />)
    expect(region('Shift register').textContent ?? '').toContain(EARLY.name)
    setSelect(/filter the register by Site/i, SITE_WITH_NO_SHIFT.id)
    const register = region('Shift register').textContent ?? ''
    expect(register).not.toContain(EARLY.name)
    expect(register).toMatch(/holds no Shift/i)
    expect(register).toMatch(/Tenant Admin creates one/i)
  })

  it('shows a Shift created in this session, so the register reads live state and not the seed', () => {
    render(<ShiftManagementScreen />)
    expect(region('Shift register').textContent ?? '').not.toContain('Night Handover')
    // 23:00-01:00 on the Assembly Hall: the window the seed deliberately
    // leaves free, so a lawful create is reachable without unbinding anything.
    setInput(/^shift name$/i, 'Night Handover')
    setInput(/^nominal start$/i, '23:00')
    setInput(/^nominal end$/i, '01:00')
    click(/^create a shift$/i)
    expect(region('Shift register').textContent ?? '').toContain('Night Handover')
    // The unbound-Area panel is recomputed from the live register too.
    expect(region('Areas with no bound Shift').textContent ?? '').toContain('Packing and Despatch')
  })
})

/* ------------------------------------------------------------------ *
 * The overlap refusal, STATE-04, and the rule stated at the moment it
 * binds.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — the overlap refusal (AC-51-13)', () => {
  it('refuses a new Shift overlapping an existing one on a shared Area, naming both and the rule', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    // Enabled first, on the Assembly Hall window the seed leaves free — so the
    // refusal below is the times changing and nothing else.
    setInput(/^shift name$/i, 'Fits between')
    setInput(/^nominal start$/i, '23:00')
    setInput(/^nominal end$/i, '01:00')
    expect(button(/^create a shift$/i).getAttribute('aria-disabled')).toBeNull()

    // TEST-51-13's own pair: 06:00-14:00 already holds this Area.
    setInput(/^nominal start$/i, '13:00')
    setInput(/^nominal end$/i, '21:00')
    expect(button(/^create a shift$/i).getAttribute('aria-disabled')).toBe('true')
    const editor = region('Shift editor').textContent ?? ''
    expect(editor).toContain(EARLY.name)
    expect(editor).toMatch(/Assembly Hall/)
    expect(editor).toMatch(/overlapping/i)
    expect(editor).toMatch(/AC-51-13/)
  })

  it('permits a block that only touches an endpoint, because a Shift ends where the next begins', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    // Ardenfield Late ends at 22:00 on the Assembly Hall; this starts there.
    setInput(/^shift name$/i, 'Straight after Late')
    setInput(/^nominal start$/i, '22:00')
    setInput(/^nominal end$/i, '23:30')
    expect(button(/^create a shift$/i).getAttribute('aria-disabled')).toBeNull()
  })

  it('refuses a blank name and a zero-length block, stating the rule and what would be accepted', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    setInput(/^shift name$/i, '   ')
    expect(button(/^create a shift$/i).getAttribute('aria-disabled')).toBe('true')
    expect(region('Shift editor').textContent ?? '').toMatch(/name/i)
    setInput(/^shift name$/i, 'Zero length')
    setInput(/^nominal start$/i, '09:00')
    setInput(/^nominal end$/i, '09:00')
    expect(button(/^create a shift$/i).getAttribute('aria-disabled')).toBe('true')
    expect(region('Shift editor').textContent ?? '').toMatch(/no working-time block/i)
  })
})

/* ------------------------------------------------------------------ *
 * Every write control changes something visible, and every one of them
 * goes through the audit path.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — the writes, and what each one changes on screen', () => {
  it('an edit changes the register row and records before-and-after values, forward-effective only', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    setInput(/^shift name$/i, 'Ardenfield Opening')
    click(/^save this shift$/i)
    const register = region('Shift register').textContent ?? ''
    expect(register).toContain('Ardenfield Opening')
    expect(register).not.toContain(EARLY.name)
    const audit = region('Last recorded action').textContent ?? ''
    expect(audit).toContain(EARLY.name)
    expect(audit).toContain('Ardenfield Opening')
    expect(audit).toMatch(/forward/i)
  })

  it('binding an Area changes the register row AND the Areas-with-no-bound-Shift panel', () => {
    render(<ShiftManagementScreen />)
    expect(region('Areas with no bound Shift').textContent ?? '').toContain('Packing and Despatch')
    pickShift(EARLY.name)
    fireEvent.click(screen.getByLabelText(/bind to Packing and Despatch/i))
    click(/^bind this shift to the selected areas$/i)
    expect(region('Shift register').textContent ?? '').toContain('Packing and Despatch')
    expect(region('Areas with no bound Shift').textContent ?? '').not.toContain(
      'Packing and Despatch',
    )
  })

  it('setting the digest time changes the register row, and shows the default and the bound beside the field', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    const digest = region('Per-Shift digest delivery time').textContent ?? ''
    expect(digest).toContain(PLATFORM_DEFAULT_DIGEST_TIME)
    expect(digest).toMatch(/Europe\/London/)
    setInput(/^digest delivery time$/i, '04:45')
    click(/^set the digest delivery time$/i)
    expect(region('Shift register').textContent ?? '').toContain('04:45')
  })

  it('refuses an archival while runs are scheduled and raises NOTIF-DOH-03-3 in its true state', () => {
    render(<ShiftManagementScreen />)
    pickShift(LATE.name)
    click(/^archive this shift$/i)
    const notice = region('Last recorded action').textContent ?? ''
    expect(notice).toMatch(/NOTIF-DOH-03-3/)
    expect(notice).toMatch(/created/)
    expect(notice).not.toMatch(/\bdelivered\b/)
    for (const runId of LATE.scheduledRunIds) expect(notice).toContain(runId)
    // The Shift did NOT archive.
    const row = within(region('Shift register')).getByRole('row', { name: new RegExp(LATE.name) })
    expect(row.textContent ?? '').not.toMatch(/archived/i)
  })

  it('archives a Shift no run is scheduled against, and the register says so', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    const before = within(region('Shift register')).getByRole('row', {
      name: new RegExp(EARLY.name),
    })
    expect(before.textContent ?? '').not.toMatch(/archived/i)
    click(/^archive this shift$/i)
    const after = within(region('Shift register')).getByRole('row', {
      name: new RegExp(EARLY.name),
    })
    expect(after.textContent ?? '').toMatch(/archived/i)
  })

  it('an audit-write failure means the action did not happen — proved against a write that does mutate', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    // First, the same act with the audit path healthy, so the failure below
    // is not merely a control that was never going to change anything.
    setInput(/^digest delivery time$/i, '04:45')
    click(/^set the digest delivery time$/i)
    expect(region('Shift register').textContent ?? '').toContain('04:45')

    fireEvent.click(screen.getByLabelText(/simulate an audit-write failure/i))
    setInput(/^digest delivery time$/i, '03:15')
    click(/^set the digest delivery time$/i)
    expect(region('Last recorded action').textContent ?? '').toMatch(/did not happen/i)
    const register = region('Shift register').textContent ?? ''
    expect(register).not.toContain('03:15')
    expect(register).toContain('04:45')
  })

  /**
   * EVERY write, not just the one that was easiest to wire — and each with a
   * setup that genuinely mutates, so a handler that changes nothing cannot
   * pass this by refusing quietly. The mutation each one would have made is
   * asserted absent from the register afterwards.
   */
  const AUDIT_CASES = [
    {
      control: /^create a shift$/i,
      setUp: () => {
        setInput(/^shift name$/i, 'Audit probe')
        setInput(/^nominal start$/i, '23:00')
        setInput(/^nominal end$/i, '01:00')
      },
      absentAfter: 'Audit probe',
    },
    {
      control: /^save this shift$/i,
      setUp: () => setInput(/^shift name$/i, 'Renamed by the probe'),
      absentAfter: 'Renamed by the probe',
    },
    {
      control: /^bind this shift to the selected areas$/i,
      setUp: () => fireEvent.click(screen.getByLabelText(/bind to Packing and Despatch/i)),
      absentAfter: 'Packing and Despatch',
    },
    {
      control: /^set the digest delivery time$/i,
      setUp: () => setInput(/^digest delivery time$/i, '03:15'),
      absentAfter: '03:15',
    },
    {
      control: /^archive this shift$/i,
      setUp: () => undefined,
      absentAfter: null,
    },
  ] as const

  it.each(AUDIT_CASES.map((c) => [String(c.control), c] as const))(
    'routes %s through the audit path, and the action does not happen when audit fails',
    (_name, testCase) => {
      render(<ShiftManagementScreen />)
      pickShift(EARLY.name)
      fireEvent.click(screen.getByLabelText(/simulate an audit-write failure/i))
      testCase.setUp()
      expect(button(testCase.control).getAttribute('aria-disabled')).toBeNull()
      click(testCase.control)
      expect(region('Last recorded action').textContent ?? '').toMatch(/did not happen/i)
      const register = region('Shift register')
      if (testCase.absentAfter !== null) {
        expect(register.textContent ?? '').not.toContain(testCase.absentAfter)
      }
      const row = within(register).getByRole('row', { name: new RegExp(EARLY.name) })
      expect(row.textContent ?? '').not.toMatch(/archived/i)
    },
  )
})

/* ------------------------------------------------------------------ *
 * The tenant state gate, applied BEFORE any write control renders.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — the tenant state gate', () => {
  it('opens the writes in the active state and closes every one of them in every suspension state', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    // The editor opens on the selected Shift, so a create from it would be a
    // duplicate of that Shift on its own Area — refused, and correctly. Move
    // the block into the free window first, so what the loop below measures is
    // the tenant state and nothing else.
    setInput(/^nominal start$/i, '23:00')
    setInput(/^nominal end$/i, '01:00')
    for (const control of WRITE_CONTROLS) {
      expect(button(control).getAttribute('aria-disabled'), String(control)).toBeNull()
    }
    for (const state of ['soft-suspended', 'hard-suspended', 'compliance-suspended', 'archived']) {
      setSelect(/^tenant state$/i, state)
      for (const control of WRITE_CONTROLS) {
        expect(button(control).getAttribute('aria-disabled'), `${state} ${String(control)}`).toBe(
          'true',
        )
      }
      expect(region('Shift editor').textContent ?? '', state).toContain(state)
    }
    // Back to active, and the writes open again. A scenario change clears the
    // draft on purpose — an outcome sentence or a half-typed block standing
    // over a fixture that has moved underneath it is no longer true of it —
    // so the free window is set again rather than assumed to have survived.
    setSelect(/^tenant state$/i, 'active')
    setInput(/^nominal start$/i, '23:00')
    setInput(/^nominal end$/i, '01:00')
    for (const control of WRITE_CONTROLS) {
      expect(button(control).getAttribute('aria-disabled'), String(control)).toBeNull()
    }
  })
})

/* ------------------------------------------------------------------ *
 * D7 — a lost connection, three ways, and never a queue.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — a lost connection (D7)', () => {
  it.each(['STATE-08', 'STATE-12', 'STATE-13'])(
    '%s disables every write control with a named reason and queues nothing',
    (stateId) => {
      render(<ShiftManagementScreen />)
      pickShift(EARLY.name)
      setSelect(/^screen state$/i, stateId)
      for (const control of WRITE_CONTROLS) {
        expect(button(control).getAttribute('aria-disabled'), String(control)).toBe('true')
      }
      expect(document.body.textContent ?? '').toMatch(/never queued|rather than queued/i)
    },
  )

  it('STATE-08 keeps the last loaded register with a freshness marker and an as-of time', () => {
    render(<ShiftManagementScreen />)
    setSelect(/^screen state$/i, 'STATE-08')
    expect(region('Shift register').textContent ?? '').toContain(EARLY.name)
    expect(document.body.textContent ?? '').toMatch(/as of/i)
  })

  it('STATE-12 names what failed and whether anything was written', () => {
    render(<ShiftManagementScreen />)
    setSelect(/^screen state$/i, 'STATE-12')
    const text = region('Screen state contract').textContent ?? ''
    expect(text).toMatch(/Shift register/i)
    expect(text).toMatch(/written/i)
  })

  it('STATE-13 refetches the tenant state before re-enabling a write', () => {
    render(<ShiftManagementScreen />)
    setSelect(/^screen state$/i, 'STATE-13')
    expect(region('Screen state contract').textContent ?? '').toMatch(/refetch/i)
  })
})

/* ------------------------------------------------------------------ *
 * Prohibition renderings, applied by rule.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — what each of the five tenant roles sees', () => {
  it('draws no write control at all for the Supervisor or the Quality Manager, and still shows the register', () => {
    render(<ShiftManagementScreen />)
    pickShift(EARLY.name)
    expect(button(/^create a shift$/i)).toBeDefined()
    for (const roleId of ['SUPERVISOR', 'QUALITY_MANAGER']) {
      selectRole(roleId)
      for (const control of WRITE_CONTROLS) {
        expect(screen.queryByRole('button', { name: control }), `${roleId} ${String(control)}`).toBeNull()
      }
      expect(region('Shift register').textContent ?? '', roleId).toContain(EARLY.name)
    }
  })

  it('puts the Read-only Auditor in STATE-06 with the cause named, and draws no write for them', () => {
    render(<ShiftManagementScreen />)
    selectRole('READONLY_AUDITOR')
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/STATE-06/)
    expect(text).toMatch(/reads tenant-wide records and takes no action/i)
    for (const control of WRITE_CONTROLS) {
      expect(screen.queryByRole('button', { name: control }), String(control)).toBeNull()
    }
  })

  it('renders the Worker as not a Hub user and shows them no Shift at all (D11)', () => {
    render(<ShiftManagementScreen />)
    selectRole('WORKER')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Unavailable/i)
    const text = document.body.textContent ?? ''
    for (const shift of DOH_SHIFTS) expect(text, shift.id).not.toContain(shift.name)
    expect(text).toMatch(/certification expiry/i)
  })

  it('states the collision between the Worker’s matrix grant and the surface decision', () => {
    render(<ShiftManagementScreen />)
    const matrix = region('Control matrix').textContent ?? ''
    expect(matrix).toMatch(/D11/)
    expect(matrix).toMatch(/renders on no screen|renders nowhere/i)
  })

  it('renders all seven matrix rows with an explicit status in every one of the thirty-five cells', () => {
    render(<ShiftManagementScreen />)
    const matrix = region('Control matrix')
    for (const row of CONTROL_MATRIX) {
      const rendered = within(matrix).getByRole('row', { name: new RegExp(row.control) })
      const text = rendered.textContent ?? ''
      expect(text.trim().length, row.id).toBeGreaterThan(0)
      for (const status of Object.values(row.status)) {
        expect(text, `${row.id} ${status}`).toContain(status)
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * The panels the per-module contract requires by name.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-03 — the required panels', () => {
  it('states the three things a Shift anchors, and that editing changes future behaviour only', () => {
    render(<ShiftManagementScreen />)
    const anchors = region('What the Shift anchors').textContent ?? ''
    for (const anchor of SHIFT_ANCHORS) {
      expect(anchors, anchor.id).toContain(anchor.what)
      expect(anchors, anchor.id).toContain(anchor.why)
    }
    expect(anchors).toMatch(/Area/)
    expect(anchors).toMatch(/never against a named person/i)
  })

  it('renders DEC-SHIFT-001 as the open decision it is, with all three options and the one adopted', () => {
    render(<ShiftManagementScreen />)
    const panel = region('Shift-to-Area cardinality').textContent ?? ''
    expect(panel).toMatch(/DEC-SHIFT-001/)
    expect(panel).toMatch(/open/i)
    expect(panel).toMatch(/D6/)
    for (const option of SHIFT_CARDINALITY_OPTIONS) {
      expect(panel, option.id).toContain(option.statement)
    }
    expect(panel).toMatch(/defer/i)
  })

  it('names every deferred scope as absent rather than drawing an inert control for it', () => {
    render(<ShiftManagementScreen />)
    const absent = region('Absent by rule')
    for (const item of ABSENT_BY_RULE) {
      expect(absent.textContent ?? '', item.label).toContain(item.note)
    }
    expect(within(absent).queryAllByRole('button')).toEqual([])
  })

  it('names the states that never render here, with a reason for each', () => {
    render(<ShiftManagementScreen />)
    const text = region('States that never render here').textContent ?? ''
    for (const id of ['STATE-07', 'STATE-09', 'STATE-10', 'STATE-11']) {
      expect(text, id).toContain(id)
    }
    expect(text).toMatch(/no agent/i)
  })

  it('lists what the source leaves unspecified and unresolved without inventing a control', () => {
    render(<ShiftManagementScreen />)
    const unspecified = region('Unspecified in source').textContent ?? ''
    for (const item of UNSPECIFIED_IN_SOURCE) expect(unspecified).toContain(item)
    const unresolved = region('Unresolved in source').textContent ?? ''
    for (const item of UNRESOLVED_IN_SOURCE) expect(unresolved).toContain(item)
  })

  /**
   * A sentence pointing at content elsewhere in the build is a claim, and the
   * iterate-the-array case above cannot fail when the target is deleted. These
   * tie each pointer to the entry it names: remove the entry and this reds.
   */
  it('makes no pointer at Unresolved in source that the panel does not answer', () => {
    render(<ShiftManagementScreen />)
    const unresolved = region('Unresolved in source').textContent ?? ''

    expect(region('Control matrix').textContent ?? '').toMatch(
      /recorded as unresolved below/i,
    )
    expect(unresolved).toMatch(/disabled with its reason/i)

    expect(region('Per-Shift digest delivery time').textContent ?? '').toMatch(
      /recorded as unresolved below/i,
    )
    expect(unresolved).toMatch(/earliest and no latest/i)
  })

  it('does not contradict itself about the prohibition it renders', () => {
    render(<ShiftManagementScreen />)
    selectRole('SUPERVISOR')
    const body = document.body.textContent ?? ''
    // The matrix on this same screen shows the Tenant Admin holding four of
    // these five writes with conditions, so the refusal note must not call the
    // prohibition unconditional.
    expect(body).not.toMatch(/categorical rather than conditional/i)
    expect(body).toMatch(/can never press it/i)
    expect(body).toMatch(/allowed-with-conditions/)
    // THE THIRD POINTER. This refusal note tells the reader the unsettled half
    // "is recorded in Unresolved in source", and that clause is a claim about
    // the build exactly like the two pinned above it. The array entry's
    // EXISTENCE is already protected — deleting it reds the unit case — but the
    // clause that points at it was not, so editing the sentence alone left
    // every test in the round green. The phrase occurs nowhere else in this
    // module, so nothing but the clause itself can satisfy this.
    expect(body).toMatch(/recorded in Unresolved in source/i)
  })

  it('offers an archived Site in the register filter but never as a parent for a Shift', () => {
    render(<ShiftManagementScreen />)
    const archived = DOH_SITES.find((s) => s.state === 'archived')
    expect(archived).toBeDefined()
    if (!archived) return
    const optionValues = (el: HTMLElement) =>
      [...el.querySelectorAll('option')].map((o) => o.getAttribute('value'))
    expect(optionValues(screen.getByLabelText(/filter the register by Site/i))).toContain(
      archived.id,
    )
    expect(optionValues(screen.getByLabelText(/^parent site$/i))).not.toContain(archived.id)
  })

  it('drops a Site filter the persona can no longer see rather than holding a dead value', () => {
    render(<ShiftManagementScreen />)
    setSelect(/filter the register by Site/i, 'SITE-ARD-02')
    expect(region('Shift register').textContent ?? '').toContain(KELVIN.name)
    // The Supervisor is Area-scoped to the first Site only, so SITE-ARD-02
    // leaves their option list entirely.
    selectRole('SUPERVISOR')
    const filter = screen.getByLabelText(/filter the register by Site/i) as HTMLSelectElement
    expect(filter.value).toBe('all')
    expect(region('Shift register').textContent ?? '').toContain(EARLY.name)
  })

  it('states that audit is in the same transaction as the action', () => {
    render(<ShiftManagementScreen />)
    expect(document.body.textContent ?? '').toMatch(/same transaction/i)
  })

  it('renders every decision reference this screen carries where a reviewer can read it', () => {
    render(<ShiftManagementScreen />)
    const text = region('Decisions rendered on this screen').textContent ?? ''
    for (const ref of ['D6', 'D7', 'D11', 'D19', 'D21', 'D25']) expect(text, ref).toContain(ref)
  })
})
