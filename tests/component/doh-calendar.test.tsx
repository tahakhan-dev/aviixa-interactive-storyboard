import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { QualificationCalendarScreen } from '../../app/hub/qualification-calendar/QualificationCalendarScreen'
import {
  ABSENT_BY_RULE,
  APPLICABLE_SCREEN_STATES,
  CALENDAR_AS_OF,
  CALENDAR_WEEKS,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  DOH_CLEARANCES,
  DOH_QUALIFICATIONS,
  DOH_WORKERS,
  GRID_FOOTER_COPY,
  HORIZON_END_DATE,
  INAPPLICABLE_SCREEN_STATES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  alreadyLapsedFor,
  calendarEntriesFor,
} from '../../app/hub/qualification-calendar/fixtures'
import { DOH_AREAS, visibleAreaIds } from '../../app/hub/location-configuration/fixtures'
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

function region(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

/** The rail entry for this module, out of the shared chrome's real `nav`. */
function railLink(): HTMLElement | null {
  const nav = screen.queryByRole('navigation', { name: 'Hub modules' })
  if (nav === null) return null
  return within(nav).queryByRole('link', { name: dohModuleById('MOD-DOH-14').name })
}

describe('MOD-DOH-14 — the screen, its identity and its refusals', () => {
  it('wraps in the Hub shell and annotates the screen number without minting a route key', () => {
    render(<QualificationCalendarScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      dohModuleById('MOD-DOH-14').name,
    )
    const body = document.body.textContent ?? ''
    expect(body).toContain('SCR-DOH-09')
    // The three-digit catalogue-A form names a DIFFERENT screen and is
    // forbidden anywhere in this codebase.
    expect(body).not.toMatch(/SCR-DOH-\d{3}/)
    expect(railLink()).not.toBeNull()
  })

  /**
   * TEST-DOH-14-D1. The refusal a Worker meets is rendered ONE LAYER UP, by
   * the surface: the route registry withholds every Hub route from the Worker
   * before any module is consulted, so the Calendar's own STATE-05 branch is
   * never what a Worker sees. Both halves are asserted, because either alone
   * would let the other rot: the surface refuses, AND this module's matrix
   * still marks the Worker unavailable (pinned in the unit suite).
   */
  it('refuses the Worker at the surface, states what it costs, and offers no rail entry', () => {
    render(<QualificationCalendarScreen />)
    viewAs('WORKER')
    const body = document.body.textContent ?? ''
    expect(body).toMatch(/holds no Hub screen/i)
    expect(body).toMatch(/without a device in hand cannot check their own certification expiry/i)
    // No grid, and no rail entry to reach one by.
    expect(screen.queryByRole('region', { name: 'Qualification Calendar grid' })).toBeNull()
    expect(railLink()).toBeNull()
  })

  it('renders the whole grid for the four reading roles', () => {
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      const view = render(<QualificationCalendarScreen />)
      viewAs(role)
      expect(
        screen.getByRole('region', { name: 'Qualification Calendar grid' }),
        role,
      ).toBeTruthy()
      view.unmount()
    }
  })
})

describe('MOD-DOH-14 — the horizon is drawn, and it is drawn from the record’s own dates', () => {
  it('names the horizon, its last day and the as-of stamp', () => {
    render(<QualificationCalendarScreen />)
    const horizon = region('The horizon')
    expect(horizon.textContent).toContain(HORIZON_END_DATE)
    expect(horizon.textContent).toContain(CALENDAR_AS_OF)
    expect(horizon.textContent).toMatch(/inclusive at both ends/i)
  })

  it('draws nine week columns and the fixed footer line', () => {
    render(<QualificationCalendarScreen />)
    const grid = region('Qualification Calendar grid')
    for (const week of CALENDAR_WEEKS) {
      expect(within(grid).getByText(week.label), week.label).toBeTruthy()
    }
    expect(grid.textContent).toContain(GRID_FOOTER_COPY)
  })

  it('a cell count equals the number of rows the same cell expands to', () => {
    render(<QualificationCalendarScreen />)
    const grid = region('Qualification Calendar grid')
    const cells = within(grid).getAllByRole('button')
    expect(cells.length).toBeGreaterThan(0)
    for (const cell of cells) {
      const drawn = Number(cell.textContent)
      expect(Number.isInteger(drawn)).toBe(true)
      fireEvent.click(cell)
      const expanded = region('Expanded cell')
      // One row per certification in the cell, plus the header row.
      const rows = within(expanded).getAllByRole('row')
      expect(rows.length - 1, cell.getAttribute('data-cell') ?? '').toBe(drawn)
      fireEvent.click(cell)
    }
  })

  it('an expanded row carries the worker name, the type, the expiry date and the chip', () => {
    render(<QualificationCalendarScreen />)
    const grid = region('Qualification Calendar grid')
    fireEvent.click(within(grid).getAllByRole('button')[0]!)
    const expanded = region('Expanded cell')
    const entries = calendarEntriesFor(
      'QUALITY_MANAGER',
      DOH_QUALIFICATIONS,
      DOH_WORKERS,
      DOH_CLEARANCES,
    )
    const shown = entries.find((e) => expanded.textContent?.includes(e.workerName))
    expect(shown).toBeDefined()
    expect(expanded.textContent).toContain(shown!.certificationName)
    expect(expanded.textContent).toContain(shown!.expiryDate)
    expect(expanded.textContent).toContain(shown!.chip)
    // The row links through to the record, which is the only route to action.
    expect(
      within(expanded).getByRole('link', { name: shown!.workerName }).getAttribute('href'),
    ).toMatch(/^\/hub\/worker-lifecycle-and-qualifications\/?$/)
  })
})

describe('MOD-DOH-14 — scope is enforced in what the screen READS', () => {
  it('gives the Quality Manager an Area their Site scope excludes, and the Supervisor neither', () => {
    render(<QualificationCalendarScreen />)
    // Default persona is the Quality Manager, who owns this screen.
    expect(region('Scope').textContent).toMatch(/tenant-wide/i)
    expect(within(region('Qualification Calendar grid')).getByText('Bonded Store')).toBeTruthy()

    viewAs('SUPERVISOR')
    expect(region('Scope').textContent).toMatch(/Filtered to this reader/i)
    const supervisorGrid = region('Qualification Calendar grid')
    expect(within(supervisorGrid).queryByText('Bonded Store')).toBeNull()
    expect(within(supervisorGrid).queryByText('Quality Laboratory')).toBeNull()
    expect(within(supervisorGrid).getByText('Paint Line')).toBeTruthy()
  })

  /**
   * Derived INDEPENDENTLY of the function under test. Reading the expected
   * set out of `calendarEntriesFor` would make this pass whatever that
   * function does — the vacuity that this slice has already shipped twice.
   * The expectation comes from the location module's own scope answer and the
   * producing module's own records.
   */
  it('draws no Area, and no row in an Area, outside the reader’s own scope', () => {
    render(<QualificationCalendarScreen />)
    viewAs('SUPERVISOR')
    const scopedAreaNames = new Set(
      DOH_AREAS.filter((a) => visibleAreaIds('SUPERVISOR').includes(a.id)).map((a) => a.name),
    )
    expect(scopedAreaNames.size).toBeGreaterThan(0)
    expect(scopedAreaNames.size).toBeLessThan(DOH_AREAS.length)

    const grid = region('Qualification Calendar grid')
    const cells = within(grid).getAllByRole('button')
    expect(cells.length).toBeGreaterThan(0)
    const drawnAreas = new Set<string>()
    for (const cell of cells) {
      const areaId = (cell.getAttribute('data-cell') ?? '').split('|')[1] ?? ''
      expect(visibleAreaIds('SUPERVISOR'), areaId).toContain(areaId)
      fireEvent.click(cell)
      const expanded = region('Expanded cell')
      for (const row of within(expanded).getAllByRole('row').slice(1)) {
        const areaCell = within(row).getAllByRole('cell')[2]!
        expect(scopedAreaNames, areaCell.textContent ?? '').toContain(areaCell.textContent)
        drawnAreas.add(areaCell.textContent ?? '')
      }
      fireEvent.click(cell)
    }
    // Non-vacuous: rows were actually inspected, in more than one Area.
    expect(drawnAreas.size).toBeGreaterThan(1)
  })

  it('clears the Area filter on a persona change rather than filtering on an unseeable Area', () => {
    render(<QualificationCalendarScreen />)
    const areaFilter = () => screen.getByRole('combobox', { name: 'Area' }) as HTMLSelectElement
    fireEvent.change(areaFilter(), { target: { value: 'AREA-ARD-QC' } })
    expect(areaFilter().value).toBe('AREA-ARD-QC')
    viewAs('SUPERVISOR')
    expect(areaFilter().value).toBe('every-area')
    // And Quality Laboratory is no longer even an option to pick.
    expect(
      within(areaFilter()).queryByRole('option', { name: 'Quality Laboratory' }),
    ).toBeNull()
  })
})

describe('MOD-DOH-14 — the filters change what is read, not only what is drawn', () => {
  it('an Area filter narrows the grid to that Area’s counts', () => {
    render(<QualificationCalendarScreen />)
    const before = within(region('Qualification Calendar grid')).getAllByRole('button').length
    fireEvent.change(screen.getByRole('combobox', { name: 'Area' }), {
      target: { value: 'AREA-ARD-PAINT' },
    })
    const after = within(region('Qualification Calendar grid')).getAllByRole('button')
    expect(after.length).toBeGreaterThan(0)
    expect(after.length).toBeLessThan(before)
    for (const cell of after) {
      expect(cell.getAttribute('data-cell')).toMatch(/\|AREA-ARD-PAINT$/)
    }
  })

  it('a week filter narrows to that week alone', () => {
    render(<QualificationCalendarScreen />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Week' }), { target: { value: '1' } })
    const cells = within(region('Qualification Calendar grid')).getAllByRole('button')
    expect(cells.length).toBeGreaterThan(0)
    for (const cell of cells) expect(cell.getAttribute('data-cell')).toMatch(/^1\|/)
  })

  it('a certification-type filter narrows to that type alone', () => {
    render(<QualificationCalendarScreen />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Certification type' }), {
      target: { value: 'CERT-SOLVENT' },
    })
    const grid = region('Qualification Calendar grid')
    const cells = within(grid).getAllByRole('button')
    expect(cells.length).toBeGreaterThan(0)
    for (const cell of cells) {
      fireEvent.click(cell)
      const text = region('Expanded cell').textContent ?? ''
      expect(text).toContain('Solvent handling')
      expect(text).not.toContain('Counterbalance truck operation')
      fireEvent.click(cell)
    }
  })

  it('offers no certification type that could only ever return nothing', () => {
    render(<QualificationCalendarScreen />)
    viewAs('SUPERVISOR')
    const select = screen.getByRole('combobox', { name: 'Certification type' })
    const reachable = new Set(
      calendarEntriesFor('SUPERVISOR', DOH_QUALIFICATIONS, DOH_WORKERS, DOH_CLEARANCES).map(
        (e) => e.certificationName,
      ),
    )
    const offered = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent ?? '')
      .filter((label) => label !== 'Every certification type')
    expect(offered.length).toBeGreaterThan(0)
    for (const label of offered) expect(reachable, label).toContain(label)
    // Non-vacuous: a seeded certification type that IS in the workspace and is
    // NOT offered, because nothing of that type expires inside the horizon in
    // this reader's Areas. An unfiltered list would carry it.
    expect(offered).not.toContain('Lockout and tagout')
    expect(offered.length).toBeLessThan(4)
  })
})

describe('MOD-DOH-14 — no write, and no control that could be mistaken for one', () => {
  const REGIONS = [
    'The horizon',
    'Scope',
    'Filters',
    'Qualification Calendar grid',
    'Expanded cell',
    'Outside the forward horizon',
    'Route to action',
  ] as const

  it('every control on this screen is a filter or a grid-cell expander, for every persona', () => {
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      const view = render(<QualificationCalendarScreen />)
      viewAs(role)
      for (const name of REGIONS) {
        for (const button of within(region(name)).queryAllByRole('button')) {
          expect(
            button.getAttribute('data-cell'),
            `${role} / ${name} / ${button.textContent}`,
          ).not.toBeNull()
        }
      }
      view.unmount()
    }
  })

  it('draws no recertification, horizon or export control anywhere, for anybody', () => {
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      const view = render(<QualificationCalendarScreen />)
      viewAs(role)
      for (const pattern of [/recertif/i, /export/i, /horizon/i, /change the 60/i]) {
        expect(screen.queryByRole('button', { name: pattern }), `${role} ${pattern}`).toBeNull()
      }
      view.unmount()
    }
  })

  it('says why each absent control is absent, rather than leaving a gap', () => {
    render(<QualificationCalendarScreen />)
    const absent = region('Absent by rule')
    for (const item of ABSENT_BY_RULE) {
      expect(within(absent).getByText(item.label), item.label).toBeTruthy()
      expect(absent.textContent, item.label).toContain(item.note)
    }
    // The worker filter's absence is stated at the filters too, where a reader
    // would look for it, and not only in the panel at the bottom.
    expect(region('Filters').textContent).toMatch(/No worker filter is drawn/)
  })
})

describe('MOD-DOH-14 — the states, the panels and the honest omissions', () => {
  it('walks all eight applicable screen states', () => {
    render(<QualificationCalendarScreen />)
    for (const id of APPLICABLE_SCREEN_STATES) {
      setScreenState(id)
      const state = region('Screen state')
      expect(state.textContent, id).toContain(id)
      expect(state.textContent, id).toContain(screenState(id).name)
    }
  })

  it('STATE-12 names what failed, says nothing was written, and keeps the records reachable', () => {
    render(<QualificationCalendarScreen />)
    setScreenState('STATE-12')
    const grid = region('Qualification Calendar grid')
    expect(grid.textContent).toMatch(/60-day expiry projection/i)
    expect(grid.textContent).toMatch(/no enforcement anywhere is affected/i)
    expect(region('Route to action').textContent).toMatch(/Open the worker records/)
  })

  it('STATE-01 names what would appear and what creates it, and is not a failure', () => {
    render(<QualificationCalendarScreen />)
    setScreenState('STATE-01')
    const grid = region('Qualification Calendar grid')
    expect(grid.textContent).toMatch(/expiring in the next 60 days/i)
    expect(grid.textContent).toMatch(/qualification record carrying an expiry date/i)
  })

  it('STATE-08 carries the freshness marker and states that no write disables', () => {
    render(<QualificationCalendarScreen />)
    setScreenState('STATE-08')
    const state = region('Screen state')
    expect(state.textContent).toContain(CALENDAR_AS_OF)
    expect(state.textContent).toMatch(/scope-filtered/i)
    expect(state.textContent).toMatch(/this module has none/i)
  })

  it('lists the already-lapsed certificates outside the grid, with the reason', () => {
    render(<QualificationCalendarScreen />)
    const outside = region('Outside the forward horizon')
    const lapsed = alreadyLapsedFor(
      'QUALITY_MANAGER',
      DOH_QUALIFICATIONS,
      DOH_WORKERS,
      DOH_CLEARANCES,
    )
    expect(lapsed.length).toBeGreaterThan(0)
    for (const e of lapsed) expect(outside.textContent, e.qualificationId).toContain(e.workerName)
    expect(outside.textContent).toMatch(/no expiry date/i)
    expect(outside.textContent).toMatch(/unrepresentable/i)
    // And none of them is inside the grid.
    const grid = region('Qualification Calendar grid')
    for (const cell of within(grid).getAllByRole('button')) {
      fireEvent.click(cell)
      for (const e of lapsed) {
        expect(region('Expanded cell').textContent, e.qualificationId).not.toContain(e.expiryDate)
      }
      fireEvent.click(cell)
    }
  })

  it('renders the matrix, the decisions and both source panels', () => {
    render(<QualificationCalendarScreen />)
    const matrix = region('Control matrix')
    for (const row of CONTROL_MATRIX) {
      expect(within(matrix).getByText(row.control), row.id).toBeTruthy()
    }
    expect(matrix.textContent).toMatch(/OWNS this screen and cannot act on it/i)
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

  it('names the cross-slice seam its notification half depends on', () => {
    render(<QualificationCalendarScreen />)
    const action = region('Route to action')
    expect(action.textContent).toMatch(/Cross-slice seam — not built here/)
    expect(action.textContent).toMatch(/slice 10/)
  })

  it('states that audit is in the same transaction and that a refusal is audited too', () => {
    render(<QualificationCalendarScreen />)
    expect(region('Audit').textContent).toMatch(/same transaction/i)
    expect(region('Audit').textContent).toMatch(/refused attempt is recorded/i)
  })

  it('carries the prototype disclosure', () => {
    render(<QualificationCalendarScreen />)
    expect(document.body.textContent).toMatch(/Simulated behaviour only/)
  })
})
