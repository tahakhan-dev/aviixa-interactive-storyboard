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

/** What "Create an Area" will name and identify the next Area as. */
const NEW_AREA_ID = `AREA-NEW-${DOH_AREAS.length + 1}`
const NEW_AREA_NAME = `New Area ${DOH_AREAS.length + 1}`

/** The Site whose archival meets Jobs — the cascade node that is not an Area. */
const SITE_WITH_JOBS = DOH_SITES.filter((s) =>
  DOH_CELLS.some(
    (c) =>
      c.inFlightJobs.length > 0 &&
      DOH_AREAS.some((a) => a.id === c.areaId && a.siteId === s.id),
  ),
)[0]

/** Select a node by name, archive it, and acknowledge the STATE-04 dialog. */
function archiveSelectedNode(name: string): void {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
  click(/^archive this node$/i)
  const dialog = screen.getByRole('dialog')
  fireEvent.click(within(dialog).getByLabelText(/i have read/i))
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: /^confirm the archival$/i }),
  )
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

  // RE-PINNED. This asserted "not built here" over `archival-cascade`, whose
  // `ownerSlice` is 6 — so the moment slice 6 shipped MOD-DOH-05 the pin was
  // holding the screen to a false absence. The negative assertion is the one
  // that matters: a closed seam may never wear the outstanding wording.
  it('names the archival cascade as a cross-slice seam its owning slice has closed', () => {
    render(<LocationConfigurationScreen />)
    const cascade = region('Archival cascade').textContent ?? ''
    expect(cascade).toMatch(/Cross-slice seam — closed at slice 6/i)
    expect(cascade).not.toMatch(/not built here/i)
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

  it('re-parents a Location into an Area created in this session, rather than doing nothing at all', () => {
    render(<LocationConfigurationScreen />)
    const free = DOH_CELLS.find((c) => c.inFlightJobs.length === 0)
    expect(free).toBeDefined()
    if (!free) return
    const parent = DOH_AREAS.find((a) => a.id === free.areaId)
    const site = DOH_SITES.find((s) => s.id === parent?.siteId)
    expect(parent).toBeDefined()
    expect(site).toBeDefined()
    if (!parent || !site) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(site.name) }))
    click(/^create an area$/i)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(parent.name) }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(free.name) }))
    setSelect(/re-parent to area/i, NEW_AREA_ID)
    expect(
      (screen.getByLabelText(/re-parent to area/i) as HTMLSelectElement).value,
      'the Area just created must be an option',
    ).toBe(NEW_AREA_ID)
    const button = screen.getByRole('button', { name: /^re-parent this location$/i })
    expect(button.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(button)
    // Resolved through the frozen module-load map the target came back
    // undefined, so this ENABLED control did nothing at all, for ever.
    expect(document.body.textContent ?? '').toContain(`re-parented into ${NEW_AREA_NAME}`)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(NEW_AREA_NAME) }))
    expect(region('Location hierarchy').textContent ?? '').toContain(free.name)
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
    // Two digits, so the tenth Site still matches the format the first nine set.
    const row = screen.getByRole('button', { name: /New Site 5/ }).textContent ?? ''
    expect(row).toContain(`SITE-ARD-${String(DOH_SITES.length + 1).padStart(2, '0')}`)
  })

  it('collapses the tree to fewer columns at shallower depth, rather than drawing an empty frame', () => {
    render(<LocationConfigurationScreen />)
    const tree = () => region('Location hierarchy')
    const emptyArea = DOH_AREAS.find((a) => !DOH_CELLS.some((c) => c.areaId === a.id))
    const fullArea = DOH_AREAS.find((a) => DOH_CELLS.some((c) => c.areaId === a.id))
    expect(emptyArea).toBeDefined()
    expect(fullArea).toBeDefined()
    if (!emptyArea || !fullArea) return
    fireEvent.click(screen.getByRole('button', { name: new RegExp(fullArea.name) }))
    expect(within(tree()).queryByText('Locations'), 'three columns at full depth').not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(emptyArea.name) }))
    expect(within(tree()).queryByText('Locations'), 'the column collapses').toBeNull()
    expect(tree().textContent ?? '').toMatch(/two columns at this depth/i)
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

  it('releases the held archival once every paused Job has been reassigned, into the Area actually chosen', () => {
    render(<LocationConfigurationScreen />)
    const cascade = ARCHIVAL_CASCADES.find((c) => c.state === 'cascade_pending_reassignment')
    expect(cascade).toBeDefined()
    if (!cascade) return
    const target = AREAS.find(
      (a) => a.id !== cascade.nodeId && a.state === 'active' && !a.flags.includes('archiving'),
    )
    expect(target).toBeDefined()
    if (!target) return
    setSelect(/reassign the paused job to/i, target.id)
    // The select must actually hold the chosen id: a value that is not an
    // option is silently dropped, and the test would then only ever exercise
    // the fallback rather than the target it names.
    expect(
      (screen.getByLabelText(/reassign the paused job to/i) as HTMLSelectElement).value,
      'the chosen Area must be a real option on this render',
    ).toBe(target.id)
    for (const job of cascade.pausedJobs) {
      fireEvent.click(
        within(region('Archival cascade')).getByRole('button', {
          name: new RegExp(`reassign ${job.id}`, 'i'),
        }),
      )
      // The audit sentence names the Area chosen, not whichever came first.
      expect(document.body.textContent ?? '', job.id).toContain(
        `${job.id} reassigned to ${target.name}`,
      )
    }
    expect(region('Archival cascade').textContent ?? '').toMatch(/cascade_complete/)
  })

  it('reassigns a paused Job into an Area created in this session, and the audit names that Area', () => {
    render(<LocationConfigurationScreen />)
    const cascade = ARCHIVAL_CASCADES.find((c) => c.state === 'cascade_pending_reassignment')
    const job = cascade?.pausedJobs[0]
    expect(job).toBeDefined()
    if (!job) return
    click(/^create an area$/i)
    setSelect(/reassign the paused job to/i, NEW_AREA_ID)
    expect((screen.getByLabelText(/reassign the paused job to/i) as HTMLSelectElement).value).toBe(
      NEW_AREA_ID,
    )
    fireEvent.click(
      within(region('Archival cascade')).getByRole('button', {
        name: new RegExp(`reassign ${job.id}`, 'i'),
      }),
    )
    // Resolved through the frozen module-load map this named a DIFFERENT Area:
    // a wrong audit sentence, which on this screen is worse than an inert button.
    expect(document.body.textContent ?? '').toContain(`${job.id} reassigned to ${NEW_AREA_NAME}`)
  })

  it('keys the reassignment scope on the Job’s own Area, so a cascade on a Site is not refused to the Tenant Admin', () => {
    render(<LocationConfigurationScreen />)
    expect(SITE_WITH_JOBS, 'a Site with Jobs under it must be seeded').toBeDefined()
    if (!SITE_WITH_JOBS) return
    archiveSelectedNode(SITE_WITH_JOBS.name)
    const cascadeText = region('Archival cascade').textContent ?? ''
    expect(cascadeText, 'the Site archival must open its own cascade').toContain(
      SITE_WITH_JOBS.id,
    )
    // Every Job under the Site is reassignable BY THE TENANT ADMIN: keyed on the
    // Site id, the Area-scope check refused a control this page's own matrix
    // marks `allowed` for this role.
    const inFlight = DOH_CELLS.filter((c) =>
      DOH_AREAS.some((a) => a.id === c.areaId && a.siteId === SITE_WITH_JOBS.id),
    ).flatMap((c) => c.inFlightJobs)
    expect(inFlight.length).toBeGreaterThan(0)
    for (const jobId of inFlight) {
      const button = within(region('Archival cascade')).getByRole('button', {
        name: new RegExp(`reassign ${jobId}`, 'i'),
      })
      expect(button.getAttribute('aria-disabled'), jobId).toBeNull()
    }
    // And a Job an existing cascade already holds is not carried into a second
    // block: it would be listed twice with two controls releasing one Job.
    const alreadyHeld = ARCHIVAL_CASCADES.filter(
      (c) => c.state === 'cascade_pending_reassignment',
    ).flatMap((c) => c.pausedJobs.map((j) => j.id))
    expect(alreadyHeld.length).toBeGreaterThan(0)
    for (const jobId of alreadyHeld) {
      expect(
        within(region('Archival cascade')).getAllByRole('button', {
          name: new RegExp(`reassign ${jobId}`, 'i'),
        }),
        jobId,
      ).toHaveLength(1)
    }
    // The archiving flag lands on the node archived, which here is a Site.
    const archivingLabel = NODE_FLAG_CONSEQUENCES.find((f) => f.id === 'archiving')?.label ?? '@@'
    expect(
      screen.getByRole('button', { name: new RegExp(SITE_WITH_JOBS.name) }).textContent ?? '',
    ).toContain(archivingLabel)
  })

  it('keys the reassignment destination per cascade, so two held archivals cannot share one target', () => {
    render(<LocationConfigurationScreen />)
    expect(SITE_WITH_JOBS, 'a Site with Jobs under it must be seeded').toBeDefined()
    if (!SITE_WITH_JOBS) return
    const heldArea = ARCHIVAL_CASCADES.find(
      (c) => c.state === 'cascade_pending_reassignment' && c.pausedJobs.length > 0,
    )
    expect(heldArea).toBeDefined()
    const areaJob = heldArea?.pausedJobs[0]
    if (!heldArea || !areaJob) return

    // Reach the two-cascade state the way a reader does: archive the Site while
    // the child cascade is still held. Nothing here constructs a cascade behind
    // the UI's back, because the path is the thing under test.
    archiveSelectedNode(SITE_WITH_JOBS.name)
    const siteJob = DOH_CELLS.filter((c) =>
      DOH_AREAS.some((a) => a.id === c.areaId && a.siteId === SITE_WITH_JOBS.id),
    ).flatMap((c) => c.inFlightJobs)[0]
    expect(siteJob, 'the Site cascade must hold a Job of its own').toBeDefined()
    if (siteJob === undefined) return

    // Two selects, told apart by their accessible names rather than by position.
    const areaSelect = () =>
      screen.getByLabelText(
        new RegExp(`reassign the paused job to .*${heldArea.nodeId}`, 'i'),
      ) as HTMLSelectElement
    const siteSelect = () =>
      screen.getByLabelText(
        new RegExp(`reassign the paused job to .*${SITE_WITH_JOBS.id}`, 'i'),
      ) as HTMLSelectElement
    expect(areaSelect()).not.toBe(siteSelect())

    const forArea = AREAS.find(
      (a) => a.state === 'active' && !a.flags.includes('archiving') && a.siteId === SITE_WITH_JOBS.id,
    )
    const forSite = AREAS.find(
      (a) => a.state === 'active' && !a.flags.includes('archiving') && a.siteId !== SITE_WITH_JOBS.id,
    )
    expect(forArea).toBeDefined()
    expect(forSite).toBeDefined()
    if (!forArea || !forSite) return

    // Choosing in one block must leave the other alone, in both directions.
    fireEvent.change(areaSelect(), { target: { value: forArea.id } })
    expect(areaSelect().value).toBe(forArea.id)
    expect(siteSelect().value, 'the other cascade keeps its own destination').toBe('')
    fireEvent.change(siteSelect(), { target: { value: forSite.id } })
    expect(siteSelect().value).toBe(forSite.id)
    expect(areaSelect().value, 'and is not overwritten in return').toBe(forArea.id)

    // And acting on one names ITS OWN Job and ITS OWN Area in the audit sentence.
    fireEvent.click(
      within(region('Archival cascade')).getByRole('button', {
        name: new RegExp(`reassign ${areaJob.id}`, 'i'),
      }),
    )
    expect(document.body.textContent ?? '').toContain(
      `${areaJob.id} reassigned to ${forArea.name}`,
    )
    fireEvent.click(
      within(region('Archival cascade')).getByRole('button', {
        name: new RegExp(`reassign ${siteJob}`, 'i'),
      }),
    )
    expect(document.body.textContent ?? '').toContain(`${siteJob} reassigned to ${forSite.name}`)
  })

  it('keeps the flags a node already carried when it is archived', () => {
    render(<LocationConfigurationScreen />)
    const flagged = DOH_SITES.find(
      (s) => s.state === 'active' && s.flags.length > 0 && !DOH_AREAS.some((a) => a.siteId === s.id),
    )
    expect(flagged, 'a flagged Site with nothing under it must be seeded').toBeDefined()
    if (!flagged) return
    archiveSelectedNode(flagged.name)
    const row = screen.getByRole('button', { name: new RegExp(flagged.name) }).textContent ?? ''
    expect(row).toMatch(/archived/i)
    for (const flag of flagged.flags) {
      const label = NODE_FLAG_CONSEQUENCES.find((f) => f.id === flag)?.label ?? '@@'
      expect(row, flag).toContain(label)
    }
  })

  it('gives the Supervisor a reassignment they can actually press, and no other write', () => {
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
    const button = within(region('Archival cascade')).getByRole('button', {
      name: new RegExp(`reassign ${firstJob.id}`, 'i'),
    })
    // Present is not enough: `getByRole` is satisfied by an aria-disabled
    // button, so the Supervisor's ONE granted write on this screen has to be
    // proved pressable — it needs an in-scope Area that is not the one being
    // archived, or it is refused for want of anywhere to send the Job.
    expect(button.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(button)
    expect(document.body.textContent ?? '').toContain(`${firstJob.id} reassigned to`)
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

/* ------------------------------------------------------------------ *
 * WHAT THE CLIENT ACTUALLY READS. Two claims this screen prints that had
 * no covering case at all: the citation under each control name, and the
 * disclosure beside the reassignment picker.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-02 — the citation under each control name reaches the page', () => {
  /**
   * `row.sourceRef` is the only half of the row this screen prints -- the
   * per-cell `detail` never reaches the DOM here -- so a wrong line number in
   * the fixture is a wrong line number on the client's screen with nothing
   * beside it to contradict. `tests/unit/doh-locations.test.ts` pins the
   * numbers to the frozen table; this pins them to the page. Stop rendering
   * `row.sourceRef` and this reds.
   */
  it('prints every row’s source reference in the control cell', () => {
    render(<LocationConfigurationScreen />)
    const matrix = region('Control matrix')
    for (const row of CONTROL_MATRIX) {
      const tableRow = within(matrix).getByRole('row', { name: new RegExp(row.control) })
      expect(tableRow.textContent ?? '', row.id).toContain(row.sourceRef)
    }
  })

  it('prints the corrected line for the two rows the off-by-one was reported on', () => {
    render(<LocationConfigurationScreen />)
    const matrix = region('Control matrix')
    // CTL-06 read L27121 ("Split, merge or re-parent an Area"); its own row is
    // L27122. CTL-11 read L27126 ("View a map of locations"); its own row is
    // L27127. Named literally, so the arithmetic in the unit gate cannot drift
    // as a block and stay green.
    const archive = within(matrix).getByRole('row', { name: /Archive a Site or an Area/ })
    expect(archive.textContent ?? '').toContain('L27122')
    expect(archive.textContent ?? '').not.toContain('L27121')
    const equipment = within(matrix).getByRole('row', { name: /Create an equipment record/ })
    expect(equipment.textContent ?? '').toContain('L27127')
    expect(equipment.textContent ?? '').not.toContain('L27126')
  })
})

describe('MOD-DOH-02 — the reassignment picker discloses its own scope', () => {
  /**
   * `reassignTargets` is ONE role-scoped list shared by every cascade, so a
   * cascade offers Areas that were never under its own archived node. That was
   * deferred as "deliberate and pre-existing, documented in a code comment" --
   * and a declaration in a file is not a disclosure on a screen. This is the
   * sentence, and this is the case that fails when it is deleted.
   */
  it('says on the page that the options are scoped to the role and not to the node', () => {
    render(<LocationConfigurationScreen />)
    const cascade = region('Archival cascade').textContent ?? ''
    expect(cascade).toMatch(/scoped to your role and not to this node/i)
    expect(cascade).toMatch(/were never under the node being archived/i)
  })

  it('is true of the picker: it offers an Area from outside the archived node’s own subtree', () => {
    render(<LocationConfigurationScreen />)
    const held = ARCHIVAL_CASCADES.find((c) => c.state === 'cascade_pending_reassignment')
    expect(held).toBeDefined()
    if (!held) return
    const picker = screen.getByLabelText(/reassign the paused job to/i) as HTMLSelectElement
    const offered = [...picker.options].map((o) => o.value).filter((v) => v !== '')
    // An Area under a DIFFERENT Site than the cascade's node is on offer,
    // which is precisely what the sentence above discloses. If a later change
    // scopes the options per node, this case reds and the sentence must go
    // with it -- the two cannot drift apart silently.
    const nodeSiteId = AREAS.find((a) => a.id === held.nodeId)?.siteId ?? held.nodeId
    const unrelated = AREAS.filter((a) => a.siteId !== nodeSiteId).map((a) => a.id)
    expect(unrelated.length).toBeGreaterThan(0)
    expect(offered.some((id) => unrelated.includes(id))).toBe(true)
  })
})
