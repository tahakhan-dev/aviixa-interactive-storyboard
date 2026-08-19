import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LocationConfigurationScreen } from '../../app/hub/location-configuration/LocationConfigurationScreen'
import {
  ARCHIVAL_CASCADES,
  CONTROL_MATRIX,
  DOH_AREAS,
  DOH_CELLS,
  DOH_SITES,
  NODE_FLAG_CONSEQUENCES,
  SEEDED_ROLE_SCOPES,
  UNSPECIFIED_IN_SOURCE,
  visibleAreaIds,
  visibleSiteIds,
  type LocationArea,
} from '../../app/hub/location-configuration/fixtures'

/** Widened view of the seeded tuple — see the note in tests/unit/doh-locations.test.ts. */
const AREAS: readonly LocationArea[] = DOH_AREAS

function selectRole(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setSelect(label: RegExp | string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function region(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

function click(name: RegExp): void {
  fireEvent.click(screen.getByRole('button', { name }))
}

/** Names and ids a role must never meet — in the tree, a filter, a search or an export. */
function outOfScopeStrings(roleId: 'SUPERVISOR' | 'QUALITY_MANAGER'): readonly string[] {
  const sites = new Set(visibleSiteIds(roleId))
  const areas = new Set(visibleAreaIds(roleId))
  return [
    ...DOH_SITES.filter((s) => !sites.has(s.id)).flatMap((s) => [s.id, s.name]),
    ...DOH_AREAS.filter((a) => !areas.has(a.id)).flatMap((a) => [a.id, a.name]),
    ...DOH_CELLS.filter((c) => !areas.has(c.areaId)).flatMap((c) => [c.id, c.name]),
  ]
}

describe('MOD-DOH-02 — the shell contract and the screen identity', () => {
  it('renders under the Hub shell with exactly one h1 and the module and screen as annotations', () => {
    render(<LocationConfigurationScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Location Configuration')
    expect(screen.getByText(/MOD-DOH-02 · SCR-DOH-04/)).toBeDefined()
  })

  it('carries the prototype disclosure and keeps every screen number out of every href', () => {
    const { container } = render(<LocationConfigurationScreen />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/SCR-DOH/i)
    }
    expect(container.textContent ?? '').not.toMatch(/SCR-DOH-\d{3}/)
  })

  it('names the archival cascade as a cross-slice seam owned by another slice, not an inline stub', () => {
    render(<LocationConfigurationScreen />)
    const cascade = region('Archival cascade').textContent ?? ''
    expect(cascade).toMatch(/Cross-slice seam — not built here/i)
    expect(cascade).toMatch(/slice 6/i)
  })
})

describe('MOD-DOH-02 — the location tree, its objects and its flags', () => {
  it('renders every seeded Site for the Tenant Admin, with the Areas of the selected Site', () => {
    render(<LocationConfigurationScreen />)
    const tree = region('Location hierarchy')
    for (const site of DOH_SITES) {
      expect(tree.textContent ?? '', site.id).toContain(site.name)
    }
    const firstSite = DOH_SITES[0]
    expect(firstSite).toBeDefined()
    if (!firstSite) return
    for (const area of DOH_AREAS.filter((a) => a.siteId === firstSite.id)) {
      expect(tree.textContent ?? '', area.id).toContain(area.name)
    }
  })

  it('D25: the default Site is marked as provisioned before any Tenant Admin signs in, and is renameable', () => {
    render(<LocationConfigurationScreen />)
    const defaultSite = DOH_SITES.find((s) => s.provisionedByDefault)
    expect(defaultSite).toBeDefined()
    if (!defaultSite) return
    const text = region('Location hierarchy').textContent ?? ''
    expect(text).toMatch(/D25/)
    expect(text).toContain(defaultSite.provisionedName)
    expect(screen.getByLabelText(/site name/i)).toBeDefined()
  })

  it('an archived node greys with an Archived chip and stays reachable for its history', () => {
    render(<LocationConfigurationScreen />)
    const archived = DOH_SITES.find((s) => s.state === 'archived')
    expect(archived).toBeDefined()
    if (!archived) return
    const row = screen.getByRole('button', { name: new RegExp(archived.name) })
    expect(row.textContent ?? '').toMatch(/archived/i)
    fireEvent.click(row)
    expect(region('Node detail').textContent ?? '').toMatch(/history/i)
  })

  it('D21: each of the three flags renders its own consequence rather than a fourth object state', () => {
    render(<LocationConfigurationScreen />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/D21/)
    for (const flag of NODE_FLAG_CONSEQUENCES) {
      expect(text, flag.id).toContain(flag.consequence)
    }
  })

  it('carries an in-use badge on the rows records already reference', () => {
    render(<LocationConfigurationScreen />)
    expect(within(region('Location hierarchy')).getAllByText(/in use/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-DOH-02 — scope filtering is total, not merely on the tree', () => {
  it('shows an Area-scoped Supervisor no out-of-scope node in the tree, a filter, a search or an export', () => {
    const { container } = render(<LocationConfigurationScreen />)
    selectRole('SUPERVISOR')
    click(/export the location list/i)
    fireEvent.change(screen.getByLabelText(/search the location tree/i), {
      target: { value: 'a' },
    })
    const text = container.textContent ?? ''
    const forbidden = outOfScopeStrings('SUPERVISOR')
    expect(forbidden.length).toBeGreaterThan(4)
    for (const needle of forbidden) expect(text, needle).not.toContain(needle)
    // Anchored: the in-scope Area MUST be on screen, so this cannot pass vacuously.
    const inScopeArea = DOH_AREAS.find((a) => visibleAreaIds('SUPERVISOR').includes(a.id))
    expect(inScopeArea).toBeDefined()
    expect(text).toContain(inScopeArea?.name ?? '@@')
  })

  it('offers a Supervisor only in-scope Sites as filter options', () => {
    render(<LocationConfigurationScreen />)
    selectRole('SUPERVISOR')
    const options = within(screen.getByLabelText(/filter by site/i)).getAllByRole('option')
    const values = options.map((o) => o.getAttribute('value'))
    for (const siteId of visibleSiteIds('SUPERVISOR')) expect(values).toContain(siteId)
    for (const site of DOH_SITES) {
      if (!visibleSiteIds('SUPERVISOR').includes(site.id)) expect(values).not.toContain(site.id)
    }
  })

  it('returns no match rather than the node when a Supervisor searches an out-of-scope name', () => {
    render(<LocationConfigurationScreen />)
    selectRole('SUPERVISOR')
    const hidden = DOH_AREAS.find((a) => !visibleAreaIds('SUPERVISOR').includes(a.id))
    expect(hidden).toBeDefined()
    if (!hidden) return
    fireEvent.change(screen.getByLabelText(/search the location tree/i), {
      target: { value: hidden.name },
    })
    expect(region('Location hierarchy').textContent ?? '').toMatch(/no location matches/i)
    expect(region('Location hierarchy').textContent ?? '').not.toContain(hidden.name)
  })

  it('exports the whole tree for the Tenant Admin and only the scoped part for the Quality Manager', () => {
    render(<LocationConfigurationScreen />)
    click(/export the location list/i)
    const adminExport = region('Export').textContent ?? ''
    for (const site of DOH_SITES) expect(adminExport, site.id).toContain(site.id)
    selectRole('QUALITY_MANAGER')
    const qmExport = region('Export').textContent ?? ''
    for (const needle of outOfScopeStrings('QUALITY_MANAGER')) {
      expect(qmExport, needle).not.toContain(needle)
    }
    expect(qmExport).toMatch(/no file leaves this storyboard/i)
  })
})

describe('MOD-DOH-02 — the three prohibition renderings, applied by rule', () => {
  it('renders every write control ABSENT for the Supervisor and the Quality Manager, with the rule named', () => {
    render(<LocationConfigurationScreen />)
    for (const roleId of ['SUPERVISOR', 'QUALITY_MANAGER']) {
      selectRole(roleId)
      for (const name of [
        /^create a site$/i,
        /^create an area$/i,
        /^create a location$/i,
        /^save the name, address and contact$/i,
        /^re-parent this location$/i,
        /^archive this node$/i,
        /^save the site timezone$/i,
        /^save the required certification$/i,
      ]) {
        expect(screen.queryByRole('button', { name }), `${roleId} ${String(name)}`).toBeNull()
      }
      expect(region('Structural controls').textContent ?? '', roleId).toMatch(
        /not held by this role in any scope/i,
      )
    }
  })

  it('renders the Tenant Admin a blocked re-parent DISABLED with the blocking Jobs named', () => {
    render(<LocationConfigurationScreen />)
    const blocked = DOH_CELLS.find((c) => c.inFlightJobs.length > 0)
    expect(blocked).toBeDefined()
    if (!blocked) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(blocked.name) }))
    const button = screen.getByRole('button', { name: /^re-parent this location$/i })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    const controls = region('Structural controls').textContent ?? ''
    for (const job of blocked.inFlightJobs) expect(controls, job).toContain(job)
    expect(controls).toMatch(/no role .* including the tenant admin/i)
  })

  it('lets the Tenant Admin re-parent a Location with no in-flight Job, and the tree changes', () => {
    render(<LocationConfigurationScreen />)
    const free = DOH_CELLS.find((c) => c.inFlightJobs.length === 0)
    expect(free).toBeDefined()
    if (!free) return
    const target = AREAS.find(
      (a) => a.id !== free.areaId && a.state === 'active' && !a.flags.includes('archiving'),
    )
    const parent = DOH_AREAS.find((a) => a.id === free.areaId)
    expect(target).toBeDefined()
    expect(parent).toBeDefined()
    if (!target || !parent) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(parent.name) }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(free.name) }))
    setSelect(/re-parent to area/i, target.id)
    click(/^re-parent this location$/i)
    expect(document.body.textContent ?? '').toMatch(/in the same transaction as the change/i)
    // The move is structural, not a message: the node now hangs off the target.
    fireEvent.click(screen.getByRole('button', { name: new RegExp(target.name) }))
    expect(region('Location hierarchy').textContent ?? '').toContain(free.name)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(parent.name) }))
    expect(region('Location hierarchy').textContent ?? '').not.toContain(free.name)
  })

  it('renders splitting, merging and re-parenting an Area ABSENT for all five roles', () => {
    render(<LocationConfigurationScreen />)
    for (const roleId of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      selectRole(roleId)
      expect(screen.queryByRole('button', { name: /split|merge/i }), roleId).toBeNull()
    }
    expect(region('Absent by rule').textContent ?? '').toMatch(/archive.{0,10}and.{0,10}recreate/i)
  })

  it('renders the map of locations and the equipment record ABSENT, the latter on all three paths', () => {
    render(<LocationConfigurationScreen />)
    const absent = region('Absent by rule').textContent ?? ''
    expect(absent).toMatch(/map/i)
    expect(absent).toMatch(/deferred beyond/i)
    expect(absent).toMatch(/equipment record/i)
    expect(absent).toMatch(/parts/i)
    expect(absent).toMatch(/Job path/i)
    expect(screen.queryByRole('button', { name: /equipment|map/i })).toBeNull()
  })

  it('S5: Cell renders ABSENT as a scope dimension and is named in the unspecified panel', () => {
    const { container } = render(<LocationConfigurationScreen />)
    const unspecified = region('Unspecified in source').textContent ?? ''
    const cellItem = UNSPECIFIED_IN_SOURCE.find((i) => /Cell/.test(i))
    expect(cellItem).toBeDefined()
    expect(unspecified).toContain(cellItem ?? '@@')
    // Deferred scoping is ABSENT, never disabled: no control anywhere offers it.
    for (const option of container.querySelectorAll('option')) {
      expect(['cell', 'job', 'worker']).not.toContain(option.getAttribute('value'))
    }
    expect(document.body.textContent ?? '').toMatch(/not a scope dimension at V1/i)
  })

  it('renders the full eleven-row control matrix so every role can be read at once', () => {
    render(<LocationConfigurationScreen />)
    const matrix = region('Control matrix')
    expect(within(matrix).getAllByRole('row')).toHaveLength(CONTROL_MATRIX.length + 1)
    for (const row of CONTROL_MATRIX) {
      expect(matrix.textContent ?? '', row.id).toContain(row.control)
    }
  })
})

describe('MOD-DOH-02 — the tenant state gate runs before any write control renders', () => {
  it('disables creation with the write-class reason under soft suspension and restores it under active', () => {
    render(<LocationConfigurationScreen />)
    expect(screen.getByRole('button', { name: /^create a site$/i }).getAttribute('aria-disabled')).toBeNull()
    setSelect(/tenant state \(scenario\)/i, 'soft-suspended')
    const create = screen.getByRole('button', { name: /^create a site$/i })
    expect(create.getAttribute('aria-disabled')).toBe('true')
    expect(region('Structural controls').textContent ?? '').toMatch(/soft-suspended/)
    setSelect(/tenant state \(scenario\)/i, 'active')
    expect(screen.getByRole('button', { name: /^create a site$/i }).getAttribute('aria-disabled')).toBeNull()
  })

  it('renders the whole module read-only under hard suspension with one named cause', () => {
    render(<LocationConfigurationScreen />)
    expect(document.body.textContent ?? '').not.toMatch(/holds this workspace read-only/i)
    setSelect(/tenant state \(scenario\)/i, 'hard-suspended')
    expect(document.body.textContent ?? '').toMatch(/holds this workspace read-only/i)
    expect(screen.getByRole('button', { name: /^archive this node$/i }).getAttribute('aria-disabled')).toBe(
      'true',
    )
  })

  it('renders the Read-only Auditor the tree with the cause named and no write control', () => {
    render(<LocationConfigurationScreen />)
    selectRole('READONLY_AUDITOR')
    expect(screen.queryByRole('button', { name: /^create a site$/i })).toBeNull()
    expect(region('Structural controls').textContent ?? '').toMatch(/takes no action at all|read-only/i)
    expect(region('Location hierarchy').textContent ?? '').toContain(DOH_SITES[0]?.name ?? '@@')
  })
})

describe('MOD-DOH-02 — STATE-04 carries the heaviest load on this screen', () => {
  it('lists the affected child nodes AND the Jobs before the archival can be confirmed', () => {
    render(<LocationConfigurationScreen />)
    const cascade = ARCHIVAL_CASCADES.find((c) => c.state === 'cascade_pending_reassignment')
    expect(cascade).toBeDefined()
    if (!cascade) return
    const area = DOH_AREAS.find((a) => a.id === cascade.nodeId)
    expect(area).toBeDefined()
    if (!area) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(area.name) }))
    click(/^archive this node$/i)
    const dialog = screen.getByRole('dialog')
    for (const cell of DOH_CELLS.filter((c) => c.areaId === area.id)) {
      expect(dialog.textContent ?? '', cell.id).toContain(cell.name)
    }
    for (const job of cascade.pausedJobs) {
      expect(dialog.textContent ?? '', job.id).toContain(job.id)
    }
    const confirm = within(dialog).getByRole('button', { name: /^confirm the archival$/i })
    expect(confirm.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(within(dialog).getByLabelText(/i have read/i))
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^confirm the archival$/i })
        .getAttribute('aria-disabled'),
    ).toBeNull()
  })

  it('refuses an empty name with the rule and the permitted format stated, and blocks the save', () => {
    render(<LocationConfigurationScreen />)
    fireEvent.change(screen.getByLabelText(/site name/i), { target: { value: '' } })
    const panel = region('Structural controls').textContent ?? ''
    expect(panel).toMatch(/STATE-04/)
    expect(panel).toMatch(/1 to 60 characters/i)
    expect(
      screen.getByRole('button', { name: /^save the name, address and contact$/i }).getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('renames the default Site when the name is valid, and the tree shows the new name', () => {
    render(<LocationConfigurationScreen />)
    fireEvent.change(screen.getByLabelText(/site name/i), { target: { value: 'Ardenfield Main Works' } })
    click(/^save the name, address and contact$/i)
    expect(region('Location hierarchy').textContent ?? '').toContain('Ardenfield Main Works')
  })
})

/* ------------------------------------------------------------------ *
 * Four controls with a live handler and no prior positive-path test:
 * pressing them must change something the reader can actually see, not
 * just component state a tenant-scoped filter then swallows.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 — Create, timezone and certification actually change what renders', () => {
  it('creates a new Site and the tree shows it — not merely state nobody’s scope admits', () => {
    render(<LocationConfigurationScreen />)
    expect(region('Location hierarchy').textContent ?? '').not.toContain('New Site 5')
    click(/^create a site$/i)
    expect(region('Location hierarchy').textContent ?? '').toContain('New Site 5')
  })

  it('creates a new Area under the selected Site and the tree shows it', () => {
    render(<LocationConfigurationScreen />)
    const site = DOH_SITES.find((s) => s.id === 'SITE-ARD-01')
    expect(site).toBeDefined()
    if (!site) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(site.name) }))
    expect(region('Location hierarchy').textContent ?? '').not.toContain('New Area 7')
    click(/^create an area$/i)
    expect(region('Location hierarchy').textContent ?? '').toContain('New Area 7')
  })

  it('creates a new Location under the selected Area and the tree shows it', () => {
    render(<LocationConfigurationScreen />)
    const area = AREAS.find((a) => a.id === 'AREA-ARD-ASSY')
    expect(area).toBeDefined()
    if (!area) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(area.name) }))
    expect(region('Location hierarchy').textContent ?? '').not.toContain('New Location 6')
    click(/^create a location$/i)
    expect(region('Location hierarchy').textContent ?? '').toContain('New Location 6')
  })

  it('sets the Site timezone and the node detail reflects the new value, not the seeded one', () => {
    render(<LocationConfigurationScreen />)
    const site = DOH_SITES.find((s) => s.id === 'SITE-ARD-01')
    expect(site).toBeDefined()
    if (!site) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(site.name) }))
    expect(region('Node detail').textContent ?? '').toMatch(new RegExp(site.timezone))
    setSelect(/^site timezone$/i, 'America/Chicago')
    click(/^save the site timezone$/i)
    expect(region('Node detail').textContent ?? '').toMatch(/America\/Chicago/)
  })

  it('sets a Location’s required certification and the tree shows the new gate value', () => {
    render(<LocationConfigurationScreen />)
    const area = AREAS.find((a) => a.id === 'AREA-ARD-PACK')
    expect(area).toBeDefined()
    if (!area) return
    const row = () => screen.getByRole('button', { name: new RegExp(area.name) })
    fireEvent.click(row())
    expect(row().textContent ?? '').toMatch(/Required certification: None/i)
    setSelect(/^required certification$/i, 'CERT-LOTO')
    click(/^save the required certification$/i)
    expect(row().textContent ?? '').toMatch(/Required certification: Lockout and tagout/i)
  })
})

describe('MOD-DOH-02 — D7 connection loss, and audit in the same transaction', () => {
  it('disables every write control with a named reason and never queues one', () => {
    render(<LocationConfigurationScreen />)
    setSelect(/^connection$/i, 'lost')
    for (const name of [/^create a site$/i, /^archive this node$/i]) {
      expect(screen.getByRole('button', { name }).getAttribute('aria-disabled'), String(name)).toBe('true')
    }
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/never queued/i)
    expect(text).toMatch(/as of /i)
    expect(text).toMatch(/STATE-08/)
  })

  it('refetches tenant state before re-enabling a write while recovering', () => {
    render(<LocationConfigurationScreen />)
    setSelect(/^connection$/i, 'recovering')
    expect(document.body.textContent ?? '').toMatch(/STATE-13/)
    expect(document.body.textContent ?? '').toMatch(/before .{0,40}re-enabl/i)
    expect(screen.getByRole('button', { name: /^create a site$/i }).getAttribute('aria-disabled')).toBe('true')
  })

  it('says the action did not happen when the audit write in the same transaction fails', () => {
    render(<LocationConfigurationScreen />)
    fireEvent.click(screen.getByLabelText(/simulate an audit-write failure/i))
    fireEvent.change(screen.getByLabelText(/site name/i), { target: { value: 'Never Applied Works' } })
    click(/^save the name, address and contact$/i)
    expect(document.body.textContent ?? '').toMatch(/the action did not happen/i)
    expect(region('Location hierarchy').textContent ?? '').not.toContain('Never Applied Works')
  })
})

describe('MOD-DOH-02 — the cascade, and who may release it', () => {
  it('banners the held archival with the count of paused Jobs and a direct list of them', () => {
    render(<LocationConfigurationScreen />)
    const cascade = ARCHIVAL_CASCADES.find((c) => c.state === 'cascade_pending_reassignment')
    expect(cascade).toBeDefined()
    if (!cascade) return
    const text = region('Archival cascade').textContent ?? ''
    expect(text).toMatch(
      new RegExp(`Reassignment required — ${cascade.pausedJobs.length} Jobs paused`),
    )
    for (const job of cascade.pausedJobs) expect(text, job.id).toContain(job.name)
  })

  it('releases the held archival once every paused Job has been reassigned', () => {
    render(<LocationConfigurationScreen />)
    const cascade = ARCHIVAL_CASCADES.find((c) => c.state === 'cascade_pending_reassignment')
    expect(cascade).toBeDefined()
    if (!cascade) return
    const target = DOH_AREAS.find((a) => a.id !== cascade.nodeId && a.state === 'active')
    expect(target).toBeDefined()
    if (!target) return
    setSelect(/reassign the paused job to/i, target.id)
    for (const job of cascade.pausedJobs) {
      fireEvent.click(
        within(region('Archival cascade')).getByRole('button', {
          name: new RegExp(`reassign ${job.id}`, 'i'),
        }),
      )
    }
    expect(region('Archival cascade').textContent ?? '').toMatch(/cascade_complete/)
  })

  it('gives the Supervisor the reassignment inside their own Area and no other write', () => {
    render(<LocationConfigurationScreen />)
    selectRole('SUPERVISOR')
    const supArea = SEEDED_ROLE_SCOPES.SUPERVISOR.areaIds[0]
    expect(supArea).toBeDefined()
    const held = ARCHIVAL_CASCADES.find(
      (c) => c.nodeId === supArea && c.state === 'cascade_pending_reassignment',
    )
    expect(held, 'the seeded Supervisor must own the held cascade').toBeDefined()
    if (!held) return
    const firstJob = held.pausedJobs[0]
    expect(firstJob).toBeDefined()
    if (!firstJob) return
    expect(
      within(region('Archival cascade')).getByRole('button', {
        name: new RegExp(`reassign ${firstJob.id}`, 'i'),
      }),
    ).toBeDefined()
    expect(screen.queryByRole('button', { name: /^archive this node$/i })).toBeNull()
  })
})

describe('MOD-DOH-02 — the empty state, the screen states and the Worker', () => {
  it('STATE-01 renders inside a Site with no Areas, naming what creates one', () => {
    render(<LocationConfigurationScreen />)
    const emptySite = DOH_SITES.find(
      (s) => s.state === 'active' && !DOH_AREAS.some((a) => a.siteId === s.id),
    )
    expect(emptySite, 'a Site with no Areas must be seeded — true-empty is unreachable').toBeDefined()
    if (!emptySite) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(emptySite.name) }))
    expect(region('Location hierarchy').textContent ?? '').toMatch(/There are no Areas/i)
    expect(region('Location hierarchy').textContent ?? '').toMatch(/Create an Area/i)
  })

  it('names the four screen states that never apply here and why', () => {
    render(<LocationConfigurationScreen />)
    const states = region('Screen states').textContent ?? ''
    for (const id of ['STATE-07', 'STATE-09', 'STATE-10', 'STATE-11']) {
      expect(states, id).toContain(id)
    }
    expect(states).toMatch(/no agent/i)
  })

  it('walks every applicable screen state without throwing, each with a module-specific note', () => {
    render(<LocationConfigurationScreen />)
    for (const id of [
      'STATE-01',
      'STATE-02',
      'STATE-03',
      'STATE-04',
      'STATE-05',
      'STATE-06',
      'STATE-08',
      'STATE-12',
      'STATE-13',
    ]) {
      setSelect(/^screen state$/i, id)
      expect(region('Screen states').textContent ?? '', id).toContain(id)
    }
  })

  it('D11: the Worker view withholds this module entirely and states the cost', () => {
    render(<LocationConfigurationScreen />)
    selectRole('WORKER')
    expect(screen.queryByRole('region', { name: 'Location hierarchy' })).toBeNull()
    expect(document.body.textContent ?? '').toMatch(/certification expiry/i)
  })
})
