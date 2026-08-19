import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { TenantLifecycleScreen } from '../../app/hub/tenant-lifecycle-and-tier-operations/TenantLifecycleScreen'
import {
  ABSENT_BY_RULE,
  APPLICABLE_SCREEN_STATES,
  CONSUMPTION_AS_OF,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  HUB_TENANT,
  INAPPLICABLE_SCREEN_STATES,
  LADDER_THRESHOLDS,
  LOADING_PLACEHOLDER,
  READ_VIEW_REGIONS,
  SEEDED_CONSUMPTION,
  SEEDED_TIER,
  UNSPECIFIED_IN_SOURCE,
  UPGRADE_TIER,
  tierRecord,
} from '../../app/hub/tenant-lifecycle-and-tier-operations/fixtures'
import { SUSPENSION_BANNERS } from '../../app/hub/banner-fixtures'
import { TENANT_STATES, writeAllowed } from '@/surfaces/doh/tenant-state'
import { dohModuleById } from '@/surfaces/doh/modules'
import { screenState } from '@/ui/screen-state'

/* ------------------------------------------------------------------ *
 * Helpers. Every assertion below reads the real DOM: a role, an
 * accessible name, an `aria-disabled` state, or the text of the element
 * an `aria-describedby` actually points at. Nothing here can pass
 * against an empty document.
 * ------------------------------------------------------------------ */

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), {
    target: { value: roleId },
  })
}

function setTenantState(state: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Tenant state' }), {
    target: { value: state },
  })
}

function setScreenState(state: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Screen state' }), {
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
 * The rail entry for THIS module, queried out of the shared chrome's real
 * `nav`. `null` is an absence, not a missing query: the Tenant Admin case
 * below finds the same link, so a `null` here means the rail withheld it.
 */
function railLinkToThisModule(): HTMLElement | null {
  return within(screen.getByRole('navigation', { name: 'Hub modules' })).queryByRole('link', {
    name: dohModuleById('MOD-DOH-01').name,
  })
}

/** The always-mounted `aria-live` container the outcome message lands in. */
function outcomeLiveRegion(): HTMLElement {
  const el = region('Tier requests').querySelector('[aria-live]')
  if (el === null) throw new Error('Tier requests has no aria-live container at all')
  return el as HTMLElement
}

const UPGRADE = /Request a tier upgrade/
const DOWNGRADE = /Request a tier downgrade/

describe('MOD-DOH-01 — the shell contract and screen identity', () => {
  it('renders inside the Hub shell with exactly one h1, the module name', () => {
    render(<TenantLifecycleScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Tenant Lifecycle and Tier Operations',
    )
  })

  it('carries the catalogue-B screen number as an annotation and no three-digit form', () => {
    const { container } = render(<TenantLifecycleScreen />)
    expect(screen.getAllByText(/SCR-DOH-03/).length).toBeGreaterThan(0)
    expect(container.textContent ?? '').not.toMatch(/SCR-DOH-\d{3}/)
  })

  it('names the tenant whose own position it renders, from the shared fixture', () => {
    render(<TenantLifecycleScreen />)
    expect(screen.getAllByText(new RegExp(HUB_TENANT.name)).length).toBeGreaterThan(0)
  })
})

describe('MOD-DOH-01 — SCR-DOH-03, the five regions in fixed order', () => {
  it('renders exactly the five regions the source fixes, in that order', () => {
    render(<TenantLifecycleScreen />)
    const readView = region('Tier and usage read view')
    const names = within(readView)
      .getAllByRole('region')
      .map((r) => r.getAttribute('aria-label'))
    expect(names).toEqual([...READ_VIEW_REGIONS])
  })

  it('quotes the meter definition verbatim from the tier record', () => {
    render(<TenantLifecycleScreen />)
    const meter = within(region('Meter definition')).getByText(
      tierRecord(SEEDED_TIER).meterDefinition,
    )
    expect(meter).toBeDefined()
  })

  it('renders consumption as a number and as a bar, with a data-as-of timestamp', () => {
    render(<TenantLifecycleScreen />)
    const consumption = region(READ_VIEW_REGIONS[1])
    const text = consumption.textContent ?? ''
    expect(text).toContain(String(SEEDED_CONSUMPTION))
    expect(text).toContain(String(tierRecord(SEEDED_TIER).ceiling))
    expect(text).toContain(CONSUMPTION_AS_OF)
    // The bar itself: decorative, because the numbers above carry every
    // fact it draws. Nothing is communicated by the bar alone.
    expect(consumption.querySelector('[data-consumption-bar]')).not.toBeNull()
  })

  it('STATE-02 renders a placeholder for the count, never a zero', () => {
    render(<TenantLifecycleScreen />)
    setScreenState('STATE-02')
    const text = region(READ_VIEW_REGIONS[1]).textContent ?? ''
    expect(text).toContain(LOADING_PLACEHOLDER)
    expect(text).not.toContain(String(SEEDED_CONSUMPTION))
    expect(text).not.toMatch(/\b0\b/)
  })

  it('marks all three ladder thresholds and shades the burst band', () => {
    render(<TenantLifecycleScreen />)
    const ladder = region(READ_VIEW_REGIONS[2])
    for (const threshold of LADDER_THRESHOLDS) {
      expect(within(ladder).getAllByText(new RegExp(threshold.label)).length).toBeGreaterThan(0)
    }
    expect(ladder.querySelector('[data-burst-band]')).not.toBeNull()
  })

  it('counts Active Locations at Site level only, and renders deferred scoping absent', () => {
    render(<TenantLifecycleScreen />)
    const locations = region(READ_VIEW_REGIONS[3])
    expect((locations.textContent ?? '')).toMatch(/Site level only/i)
    // Deferred scoping is ABSENT, never a disabled control (slice gate 6).
    expect(within(locations).queryAllByRole('button')).toHaveLength(0)
    expect((locations.textContent ?? '')).toMatch(/Cell, Job and worker/i)
  })

  it('names the suspension status of the tenant state it is showing', () => {
    render(<TenantLifecycleScreen />)
    expect((region(READ_VIEW_REGIONS[4]).textContent ?? '')).toMatch(/active/i)
    setTenantState('hard-suspended')
    expect((region(READ_VIEW_REGIONS[4]).textContent ?? '')).toMatch(/hard-suspended/i)
  })
})

describe('MOD-DOH-01 — the tenant state gate, applied before any write control', () => {
  it('follows writeAllowed for every one of the five operating states', () => {
    render(<TenantLifecycleScreen />)
    for (const state of TENANT_STATES) {
      setTenantState(state)
      const control = screen.getByRole('button', { name: UPGRADE })
      expect(isInert(control)).toBe(!writeAllowed(state, UPGRADE_TIER))
    }
  })

  it('blocks the upgrade under soft suspension, naming the reason and the route out (D15)', () => {
    render(<TenantLifecycleScreen />)
    setTenantState('soft-suspended')
    const control = screen.getByRole('button', { name: UPGRADE })
    expect(isInert(control)).toBe(true)
    const reason = statedReason(control)
    expect(reason).toMatch(/soft-suspended/i)
    expect(reason).toMatch(/platform support/i)
    // The census records the counter-argument: this is a coin-flip the
    // client should settle, and it says so where a reviewer can read it.
    expect(screen.getAllByText(/D15/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/coin-flip/i).length).toBeGreaterThan(0)
  })

  it('carries consumption forward on an upgrade and never resets it', () => {
    render(<TenantLifecycleScreen />)
    fireEvent.click(screen.getByRole('button', { name: UPGRADE }))
    const consumption = region(READ_VIEW_REGIONS[1])
    const text = consumption.textContent ?? ''
    expect(text).toContain(String(SEEDED_CONSUMPTION))
    expect(text).toContain('2,000')
  })

  it('records a downgrade as a request, and never renders it as executed', () => {
    render(<TenantLifecycleScreen />)
    fireEvent.click(screen.getByRole('button', { name: DOWNGRADE }))
    expect(screen.getAllByText(/pending_downgrade/).length).toBeGreaterThan(0)
    const again = screen.getByRole('button', { name: DOWNGRADE })
    expect(isInert(again)).toBe(true)
    expect(statedReason(again)).toMatch(/already recorded/i)
    // Still on the seeded tier: the Hub records the request, the client
    // platform team executes it.
    expect((region(READ_VIEW_REGIONS[1]).textContent ?? '')).toContain(
      String(tierRecord(SEEDED_TIER).ceiling),
    )
  })
})

describe('MOD-DOH-01 — per-role affordances through evaluateAccess', () => {
  it('gives the Supervisor STATE-05 on a deep link, not the read view', () => {
    render(<TenantLifecycleScreen />)
    viewAs('SUPERVISOR')
    expect(screen.queryByRole('region', { name: 'Tier and usage read view' })).toBeNull()
    const refusal = screen.getByRole('region', { name: 'Permission denied' })
    const text = refusal.textContent ?? ''
    expect(text).toMatch(/does not carry/i)
    expect(text).toMatch(/Tenant Admin/)
    expect(text).toMatch(/audited/i)
  })

  it('gives the Quality Manager the same refusal', () => {
    render(<TenantLifecycleScreen />)
    viewAs('QUALITY_MANAGER')
    expect(screen.queryByRole('region', { name: 'Tier and usage read view' })).toBeNull()
    expect((screen.getByRole('region', { name: 'Permission denied' }).textContent ?? '')).toMatch(
      /rail does not offer/i,
    )
  })

  /**
   * THE SCREEN TELLS BOTH REFUSED ROLES "the module rail does not offer this
   * route". This case is what makes that sentence true rather than merely
   * present: it queries the shared chrome's real `nav` and asserts the link is
   * gone. A case that asserts only that the prose carries the words passes
   * because the screen says them — which is exactly how the rail came to ship
   * offering all eight modules to every persona while this screen's own copy
   * claimed otherwise.
   */
  it('offers no route to this module in the rail, to either role the matrix marks Unavailable', () => {
    render(<TenantLifecycleScreen />)
    // Positive control first: the Tenant Admin IS offered it, so a null below
    // is a withheld link and not a query that never matched anything.
    expect(railLinkToThisModule()).not.toBeNull()

    for (const roleId of ['SUPERVISOR', 'QUALITY_MANAGER']) {
      viewAs(roleId)
      expect(railLinkToThisModule()).toBeNull()
      // The rail itself is still drawn, over the modules these roles DO
      // reach: this route is withheld, not the whole navigation.
      expect(
        within(screen.getByRole('navigation', { name: 'Hub modules' })).getAllByRole('link').length,
      ).toBeGreaterThan(0)
    }
  })

  /**
   * The other half of the same pair of matrix rows this screen renders
   * (L26886-L26888), checked against the shipped chrome rather than against
   * its own prose: the soft and hard suspension banners reach the Tenant Admin
   * alone, and the compliance message reaches everyone.
   */
  it('banners a soft suspension to the Tenant Admin and to no other role that opens this screen', () => {
    render(<TenantLifecycleScreen />)
    setTenantState('soft-suspended')
    expect(screen.getAllByText(SUSPENSION_BANNERS['soft-suspended'].heading).length).toBeGreaterThan(
      0,
    )
    viewAs('READONLY_AUDITOR')
    expect(screen.queryByText(SUSPENSION_BANNERS['soft-suspended'].heading)).toBeNull()

    setTenantState('compliance-suspended')
    expect(
      screen.getAllByText(SUSPENSION_BANNERS['compliance-suspended'].heading).length,
    ).toBeGreaterThan(0)
  })

  it('gives the Read-only Auditor the identical read view minus the two request controls', () => {
    render(<TenantLifecycleScreen />)
    viewAs('READONLY_AUDITOR')
    const readView = region('Tier and usage read view')
    const names = within(readView)
      .getAllByRole('region')
      .map((r) => r.getAttribute('aria-label'))
    expect(names).toEqual([...READ_VIEW_REGIONS])
    expect(screen.queryByRole('button', { name: UPGRADE })).toBeNull()
    expect(screen.queryByRole('button', { name: DOWNGRADE })).toBeNull()
    // Absent, but never silently: the reason sits where the control would.
    expect((region('Tier requests').textContent ?? '')).toMatch(/Read-only Auditor/)
  })

  it('renders the twelve-row control matrix with an explicit status in every cell', () => {
    render(<TenantLifecycleScreen />)
    const matrix = region('Control matrix')
    for (const row of CONTROL_MATRIX) {
      const tableRow = within(matrix).getByRole('row', { name: new RegExp(row.control) })
      // PER CELL, not against the row's whole text. Four of these twelve rows
      // carry the same token in all five role columns, so a row that rendered
      // one cell instead of five would still satisfy a `toContain` over the
      // row — the check would pass on a table that had lost four columns.
      const cells = within(tableRow).getAllByRole('cell')
      const statuses = Object.values(row.byRole).map((c) => c.status)
      // Column 0 is the control name and the last is "how it renders here";
      // the five role columns sit between them, in registry order.
      expect(cells).toHaveLength(statuses.length + 2)
      statuses.forEach((status, i) => {
        // The cell's own first element, exactly — never a prefix or substring
        // match, because 'Allowed' is a substring of 'Allowed with conditions'
        // and a cell showing the wrong one of the two would pass.
        expect(cells[i + 1]?.querySelector('span')?.textContent).toBe(status)
      })
    }
    expect(CONTROL_MATRIX).toHaveLength(12)
  })
})

describe('MOD-DOH-01 — connection loss splits three ways (D7)', () => {
  it('STATE-08 keeps the loaded content with a freshness marker and an as-of time', () => {
    render(<TenantLifecycleScreen />)
    setScreenState('STATE-08')
    expect((screen.getByRole('region', { name: 'Screen state' }).textContent ?? '')).toContain(
      CONSUMPTION_AS_OF,
    )
    expect((region(READ_VIEW_REGIONS[1]).textContent ?? '')).toContain(
      String(SEEDED_CONSUMPTION),
    )
  })

  it('STATE-12 names what failed and whether anything was written', () => {
    render(<TenantLifecycleScreen />)
    setScreenState('STATE-12')
    const text = screen.getByRole('region', { name: 'Screen state' }).textContent ?? ''
    expect(text).toMatch(/Nothing was written/i)
  })

  it('STATE-13 refetches the tenant state before re-enabling any write', () => {
    render(<TenantLifecycleScreen />)
    setScreenState('STATE-13')
    expect((screen.getByRole('region', { name: 'Screen state' }).textContent ?? '')).toMatch(
      /before/i,
    )
  })

  it('disables every write control while the connection is lost, and never queues one', () => {
    render(<TenantLifecycleScreen />)
    for (const state of ['STATE-08', 'STATE-12', 'STATE-13']) {
      setScreenState(state)
      for (const name of [UPGRADE, DOWNGRADE]) {
        const control = screen.getByRole('button', { name })
        expect(isInert(control)).toBe(true)
        expect(statedReason(control)).toMatch(/disable rather than queue/i)
      }
    }
  })
})

describe('MOD-DOH-01 — audit is in the same transaction as the action', () => {
  it('says so where a reviewer can read it', () => {
    render(<TenantLifecycleScreen />)
    expect(screen.getAllByText(/same transaction/i).length).toBeGreaterThan(0)
  })

  it('says the action did not happen when the audit write fails', () => {
    render(<TenantLifecycleScreen />)
    fireEvent.click(screen.getByLabelText(/audit-write failure/i))
    fireEvent.click(screen.getByRole('button', { name: UPGRADE }))
    expect(outcomeLiveRegion().textContent ?? '').toMatch(/did not happen/i)
    // The tier is unchanged: the ceiling is still the seeded one.
    expect((region(READ_VIEW_REGIONS[1]).textContent ?? '')).toContain(
      String(tierRecord(SEEDED_TIER).ceiling),
    )
  })

  it('mounts the announcement’s live region before there is anything to announce', () => {
    render(<TenantLifecycleScreen />)
    // Present and empty at first render. A live region inserted at the same
    // moment as its content is not reliably announced, and "the action did
    // not happen" is the one sentence here a reader must not miss.
    const live = outcomeLiveRegion()
    expect(live.textContent).toBe('')

    fireEvent.click(screen.getByLabelText(/audit-write failure/i))
    fireEvent.click(screen.getByRole('button', { name: UPGRADE }))

    // The SAME node now carries the message — so an assistive technology
    // already watching it hears the change, rather than the container and its
    // content arriving together.
    expect(outcomeLiveRegion()).toBe(live)
    expect(live.textContent ?? '').toMatch(/did not happen/i)
  })
})

describe('MOD-DOH-01 — an outcome never outlives the fixture it describes', () => {
  it('clears the outcome when the reviewer moves the tenant state under it', () => {
    render(<TenantLifecycleScreen />)
    fireEvent.click(screen.getByRole('button', { name: UPGRADE }))
    expect(outcomeLiveRegion().textContent ?? '').toMatch(/Upgraded to/i)
    // The refusal that follows belongs to a different tenant state than the
    // one the sentence above was written against, so the sentence goes.
    setTenantState('hard-suspended')
    expect(outcomeLiveRegion().textContent).toBe('')
  })

  it('clears the outcome when the reviewer switches persona', () => {
    render(<TenantLifecycleScreen />)
    fireEvent.click(screen.getByRole('button', { name: DOWNGRADE }))
    expect(outcomeLiveRegion().textContent ?? '').toMatch(/Recorded as a request/i)
    // The Auditor never made this request and holds no control that could.
    viewAs('READONLY_AUDITOR')
    expect(outcomeLiveRegion().textContent).toBe('')
  })

  it('clears the outcome when the reviewer moves the screen state under it', () => {
    render(<TenantLifecycleScreen />)
    fireEvent.click(screen.getByRole('button', { name: UPGRADE }))
    // STATE-02 replaces the consumption figure with a placeholder, so a
    // sentence naming that figure stops being true of what is on screen.
    setScreenState('STATE-02')
    expect(outcomeLiveRegion().textContent).toBe('')
  })
})

describe('MOD-DOH-01 — absent by rule, seams and the honest panels', () => {
  it('draws no control for any action the source prohibits for all five roles', () => {
    render(<TenantLifecycleScreen />)
    const absent = region('Absent by rule')
    expect(within(absent).queryAllByRole('button')).toHaveLength(0)
    for (const item of ABSENT_BY_RULE) {
      expect(within(absent).getAllByText(new RegExp(item.label)).length).toBeGreaterThan(0)
    }
  })

  it('names the Worker-Shift meter seam rather than stubbing it inline', () => {
    render(<TenantLifecycleScreen />)
    const seam = screen.getByText(/Cross-slice seam — not built here/)
    expect(seam).toBeDefined()
    expect((seam.parentElement?.textContent ?? '')).toMatch(/slice 6/)
  })

  it('renders the unspecified-in-source panel, item for item', () => {
    render(<TenantLifecycleScreen />)
    const panel = region('Unspecified in source')
    for (const item of UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(item)).toBeDefined()
    }
  })

  it('renders every decision reference this screen depends on', () => {
    render(<TenantLifecycleScreen />)
    for (const decision of DECISIONS_ON_SCREEN) {
      expect(screen.getAllByText(new RegExp(`\\b${decision.ref}\\b`)).length).toBeGreaterThan(0)
    }
  })

  it('treats pilot as an orthogonal flag, never a sixth state (D19)', () => {
    render(<TenantLifecycleScreen />)
    const selector = screen.getByRole('combobox', { name: 'Tenant state' })
    expect(within(selector).getAllByRole('option')).toHaveLength(TENANT_STATES.length)
    // The flag is off until the reviewer sets it, and setting it changes what
    // renders — so this cannot pass against a paragraph that was always there.
    expect(screen.queryAllByText(/Pilot flag set/)).toHaveLength(0)
    fireEvent.click(screen.getByLabelText(/pilot tenant/i))
    expect(screen.getAllByText(/Pilot flag set/).length).toBeGreaterThan(0)
  })
})

describe('MOD-DOH-01 — the applicable screen states', () => {
  it('walks every applicable state and names it', () => {
    render(<TenantLifecycleScreen />)
    for (const id of APPLICABLE_SCREEN_STATES) {
      setScreenState(id)
      const text = screen.getByRole('region', { name: 'Screen state' }).textContent ?? ''
      expect(text).toContain(id)
      expect(text).toContain(screenState(id).name)
    }
  })

  it('names the states that never render here, each with its reason', () => {
    render(<TenantLifecycleScreen />)
    const panel = region('States that never render here')
    for (const inapplicable of INAPPLICABLE_SCREEN_STATES) {
      expect(within(panel).getAllByText(new RegExp(inapplicable.id)).length).toBeGreaterThan(0)
    }
    expect(within(panel).queryAllByRole('option')).toHaveLength(0)
  })
})
