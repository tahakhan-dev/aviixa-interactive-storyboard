import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { OverviewScreen } from '../../app/super-admin/platform-overview-and-health/OverviewScreen'
import { AGGREGATES, INCIDENTS, MODULE_STATE_NOTES, PLATFORM_ROLES, READ_ONLY_CAUSE, READ_ONLY_CONTROL_POINTER } from '../../app/super-admin/platform-overview-and-health/fixtures'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { SCREEN_STATES } from '@/ui/screen-state'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'

function selectRole(sourceRoleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as platform role/i), {
    target: { value: sourceRoleId },
  })
}

function stateSelect(): HTMLElement {
  return screen.getByRole('combobox', { name: 'Screen state' })
}

function selectState(stateId: string): void {
  fireEvent.change(stateSelect(), { target: { value: stateId } })
}

function aggregatesRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Platform aggregates' })
}

function incidentCard(id: string): HTMLElement {
  return screen.getByRole('article', { name: `Incident ${id}` })
}

/** The one tile whose value is recomputed from the incident records below it. */
function openIncidentsTile(): HTMLElement {
  const tile = within(aggregatesRegion())
    .getAllByRole('listitem')
    .find((li) => (li.textContent ?? '').includes('Platform incidents not yet closed'))
  if (tile === undefined) throw new Error('AGG-OPEN-INCIDENTS tile is not rendered')
  return tile
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

describe('MOD-SA-01 — the console shell contract', () => {
  it('renders under the shell with exactly one h1 and the module id and band as annotations', () => {
    render(<OverviewScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Platform Overview and Health',
    )
    expect(screen.getByText(/MOD-SA-01 · Definition layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<OverviewScreen />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
  })

  it('shows the SCR-SA screen numbers as annotations and never as a route key', () => {
    const { container } = render(<OverviewScreen />)
    expect(screen.getByText(/SCR-SA-01/)).toBeDefined()
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })
})

describe('MOD-SA-01 — AC-SA-01-01 and AC-SA-01-03, the eight aggregate elements', () => {
  it('renders exactly eight aggregate elements', () => {
    render(<OverviewScreen />)
    expect(within(aggregatesRegion()).getAllByRole('listitem')).toHaveLength(AGGREGATES.length)
    expect(AGGREGATES).toHaveLength(8)
  })

  it('gives every aggregate an as-of timestamp, and never renders one as zero or blank', () => {
    render(<OverviewScreen />)
    for (const item of within(aggregatesRegion()).getAllByRole('listitem')) {
      const text = item.textContent ?? ''
      expect(text.trim().length).toBeGreaterThan(0)
      expect(text).toMatch(/as of /i)
      expect(text).not.toMatch(/\b0\b/)
    }
  })

  it('degrades to stale-with-age or unavailable, naming the age and never a value it does not have', () => {
    render(<OverviewScreen />)
    const text = aggregatesRegion().textContent ?? ''
    expect(text).toMatch(/stale/i)
    expect(text).toMatch(/measure unavailable/i)
    expect(text).toMatch(/\d+ minutes old/i)
    expect(text).toMatch(/reconciled/i)
  })

  it('counts incidents from the same records the incident list reads', () => {
    render(<OverviewScreen />)
    // Widened deliberately: the fixture's literal types happen to exclude
    // 'closed' today, and comparing against it directly would be a type
    // error rather than the assertion this test means to make.
    const states: readonly string[] = INCIDENTS.map((i) => i.state)
    const open = states.filter((s) => s !== 'closed').length
    expect(aggregatesRegion().textContent).toContain(`${open} platform incidents not yet closed`)
    selectRole('ROLE-PLAT-ROOT')
    fireEvent.click(within(incidentCard('INC-PLT-02')).getByRole('button', { name: /close/i }))
    expect(aggregatesRegion().textContent).toContain(
      `${open - 1} platform incidents not yet closed`,
    )
    expect(aggregatesRegion().textContent).not.toContain(
      `${open} platform incidents not yet closed`,
    )
  })

  it('re-stamps the incident count when it is recomputed here, never keeping the stamp of the value it replaced', () => {
    render(<OverviewScreen />)
    const before = openIncidentsTile().textContent ?? ''
    expect(before).toContain('3 platform incidents not yet closed')
    expect(before).toContain('as of 2026-08-16 09:12 platform time')

    selectRole('ROLE-PLAT-ROOT')
    fireEvent.click(within(incidentCard('INC-PLT-02')).getByRole('button', { name: /close/i }))

    const after = openIncidentsTile().textContent ?? ''
    expect(after).toContain('2 platform incidents not yet closed')
    // The stamp says WHEN the new count was true. Carrying the aggregation
    // layer's 09:12 snapshot across a recomputation would present one stamp
    // for two different counts.
    expect(after).not.toContain('2026-08-16 09:12 platform time')
    expect(after).toContain('as of the incident closed on this screen')
  })

  it('renders no rate and no measure below tenant-month anywhere on the screen', () => {
    const { container } = render(<OverviewScreen />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\brates?\b/i)
    expect(text).not.toMatch(/per[- ](worker|person|operator|shift|hour|minute|run)\b/i)
  })
})

describe('MOD-SA-01 — the four platform roles', () => {
  it('offers all four platform roles and gives every one of them the aggregates', () => {
    render(<OverviewScreen />)
    expect(PLATFORM_ROLES).toHaveLength(4)
    for (const role of PLATFORM_ROLES) {
      selectRole(role.sourceId)
      expect(
        within(aggregatesRegion()).getAllByRole('listitem'),
        role.sourceId,
      ).toHaveLength(AGGREGATES.length)
      expect(screen.getAllByRole('article').length, role.sourceId).toBeGreaterThan(0)
    }
  })

  it('shows Support the incident record and draws NO close control at all, on any incident', () => {
    render(<OverviewScreen />)
    selectRole('ROLE-PLAT-SUP')
    for (const incident of INCIDENTS) {
      const card = incidentCard(incident.id)
      // ABSENT, not disabled: no control, inert or otherwise, and no
      // aria-disabled element standing in for one.
      expect(within(card).queryByRole('button'), incident.id).toBeNull()
      expect(card.querySelector('[aria-disabled]'), incident.id).toBeNull()
      expect(card.textContent, incident.id).toMatch(/No close control is drawn here for Support/i)
      expect(card.textContent, incident.id).toMatch(
        /a disabled control would imply an enabled state exists somewhere for this role/i,
      )
    }
  })

  it('offers the close control to root, Admin and Platform Engineer when the record permits it', () => {
    render(<OverviewScreen />)
    for (const sourceId of ['ROLE-PLAT-ROOT', 'ROLE-PLAT-ADMIN', 'ROLE-PLAT-ENG']) {
      selectRole(sourceId)
      const button = within(incidentCard('INC-PLT-02')).getByRole('button', {
        name: /close incident/i,
      })
      expect(button.getAttribute('aria-disabled'), sourceId).toBeNull()
    }
  })
})

describe('MOD-SA-01 — the three prohibition renderings, by rule', () => {
  it('renders every ENFORCED invariant as a status chip, never as a control', () => {
    render(<OverviewScreen />)
    const posture = screen.getByRole('region', { name: 'Security posture' })
    for (const inv of SA_INVARIANTS) {
      expect(within(posture).getByText(new RegExp(`${inv.name} — ENFORCED`))).toBeDefined()
    }
    expect(posture.querySelector('button')).toBeNull()
    expect(posture.querySelector('input')).toBeNull()
    expect(posture.querySelector('[role=switch]')).toBeNull()
    expect(posture.querySelector('[tabindex]')).toBeNull()
  })

  it('renders de-anonymisation ABSENT for every account including the root', () => {
    render(<OverviewScreen />)
    for (const sourceId of PLATFORM_ROLES.map((r) => r.sourceId)) {
      selectRole(sourceId)
      const comparative = screen.getByRole('region', { name: 'Cross-tenant comparative' })
      expect(comparative.querySelector('button'), sourceId).toBeNull()
      expect(comparative.textContent, sourceId).toMatch(
        /no control to disable anonymisation exists/i,
      )
    }
  })

  it('disables the close control with the rule that blocks it, never a bare greyed control', () => {
    render(<OverviewScreen />)
    selectRole('ROLE-PLAT-ROOT')
    const card = incidentCard('INC-PLT-01')
    const button = within(card).getByRole('button', { name: /close incident/i })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(card.textContent).toMatch(/reconciliation item/i)
  })

  it('replaces the emergency-pause action area with the critical-class badge for a non-root role', () => {
    render(<OverviewScreen />)
    const agents = () => screen.getByRole('region', { name: 'Agent health' })
    selectRole('ROLE-PLAT-ADMIN')
    expect(agents().textContent).toMatch(/Critical class — root approval required/)
    expect(within(agents()).queryByRole('link', { name: /emergency pause/i })).toBeNull()
    selectRole('ROLE-PLAT-ROOT')
    expect(within(agents()).getByRole('link', { name: /emergency pause/i })).toBeDefined()
  })
})

describe('MOD-SA-01 — the twelve applicable screen states', () => {
  it('offers every state but the frontline-only STATE-07', () => {
    render(<OverviewScreen />)
    const options = within(stateSelect()).getAllByRole('option')
    expect(options).toHaveLength(SCREEN_STATES.length - 1)
    expect(options.map((o) => o.getAttribute('value'))).not.toContain('STATE-07')
  })

  it('renders a named treatment for each of the twelve', () => {
    // One marker per state, taken from the TREATMENT the screen draws for
    // it — never from the shared SCREEN_STATES contract paragraph and never
    // from MODULE_STATE_NOTES, both of which are asserted separately below.
    // Deleting either the note or the treatment must fail this test.
    const treatmentMarker: Record<string, RegExp> = {
      'STATE-01': /There are no platform incidents yet/i,
      'STATE-02': /Loading the platform aggregates/i,
      'STATE-03': /the success rendering/i,
      'STATE-04': /Verification checklist is not accepted/i,
      'STATE-05': /holds the incident close, so no refusal renders/i,
      'STATE-06': /Every input this module owns is disabled for every console role/i,
      'STATE-08': /42 minutes old/i,
      'STATE-09': /enters the queued state/i,
      'STATE-10': /Rendered in the agent-health panel below/i,
      'STATE-11': /Rendered in the agent-health panel below/i,
      'STATE-12': /Nothing was written/i,
      'STATE-13': /two of three dependent views recomputed/i,
    }
    render(<OverviewScreen />)
    const applicable = SA_APPLICABLE_STATES
    expect(applicable).toHaveLength(12)
    for (const state of applicable) {
      selectState(state.id)
      const text = screen.getByRole('region', { name: 'Screen state' }).textContent ?? ''
      expect(text, state.id).toContain(state.id)
      // The module-specific sentence, verbatim — not a length floor the
      // shared header satisfies on its own.
      expect(text, state.id).toContain(MODULE_STATE_NOTES[state.id])
      const marker = treatmentMarker[state.id]
      if (marker === undefined) {
        throw new Error(`no treatment marker declared for ${state.id}`)
      }
      expect(text, state.id).toMatch(marker)
    }
  })

  it('names the refusal in the STATE-05 treatment for a role without incident ownership', () => {
    render(<OverviewScreen />)
    selectRole('ROLE-PLAT-SUP')
    selectState('STATE-05')
    const text = screen.getByRole('region', { name: 'Screen state' }).textContent ?? ''
    expect(text).toMatch(/does not carry a grant for this action/i)
  })

  it('STATE-06 and STATE-12 stop the one write this screen has, with the cause named', () => {
    render(<OverviewScreen />)
    selectRole('ROLE-PLAT-ROOT')
    for (const [stateId, cause] of [
      ['STATE-06', /The cause is named once, in the screen-state banner above/i],
      ['STATE-12', /Nothing can be submitted while the platform audit write is failing/i],
      ['STATE-13', /cannot close while any dependent view is behind/i],
    ] as const) {
      selectState(stateId)
      // INC-PLT-02 is the record that is otherwise closeable: nothing about
      // the record blocks it, so only the screen state can.
      const card = incidentCard('INC-PLT-02')
      const button = within(card).getByRole('button', { name: /close incident/i })
      expect(button.getAttribute('aria-disabled'), stateId).toBe('true')
      expect(card.textContent, stateId).toMatch(cause)
      fireEvent.click(button)
      expect(incidentCard('INC-PLT-02').textContent, stateId).not.toMatch(/same transaction/i)
    }
  })

  it('STATE-06: every input this module owns is genuinely disabled, and the two view switchers are not', () => {
    render(<OverviewScreen />)
    selectRole('ROLE-PLAT-ROOT')
    selectState('STATE-06')
    for (const label of [/tenant filter/i, /capability filter/i, /incident filter/i]) {
      const input = screen.getByLabelText(label)
      expect(input, String(label)).toBeInstanceOf(HTMLSelectElement)
      expect((input as HTMLSelectElement).disabled, String(label)).toBe(true)
    }
    for (const incident of INCIDENTS) {
      const button = within(incidentCard(incident.id)).getByRole('button', {
        name: /close incident/i,
      })
      expect(button.getAttribute('aria-disabled'), incident.id).toBe('true')
    }
    // The banner says these two stay live because they are storyboard view
    // switchers and the way out of the state. Copy and render must agree.
    expect((screen.getByLabelText(/view as platform role/i) as HTMLSelectElement).disabled).toBe(
      false,
    )
    expect((stateSelect() as HTMLSelectElement).disabled).toBe(false)
  })

  it('STATE-06 states its cause exactly once, and the disabled controls point at it instead of repeating it', () => {
    const { container } = render(<OverviewScreen />)
    selectRole('ROLE-PLAT-ROOT')
    selectState('STATE-06')
    const text = container.textContent ?? ''
    expect(occurrences(text, READ_ONLY_CAUSE)).toBe(1)
    // One pointer per disabled close, and no pointer restates the cause.
    expect(occurrences(text, READ_ONLY_CONTROL_POINTER)).toBe(INCIDENTS.length)
    expect(READ_ONLY_CONTROL_POINTER).not.toContain('disabled for every console role')
  })

  it('STATE-06 prints the SAME one cause for all four console roles, never a second cause per role', () => {
    render(<OverviewScreen />)
    selectState('STATE-06')
    const banners = PLATFORM_ROLES.map((r) => {
      selectRole(r.sourceId)
      return screen.getByRole('region', { name: 'Screen state' }).textContent ?? ''
    })
    for (const [i, banner] of banners.entries()) {
      expect(banner, PLATFORM_ROLES[i]?.sourceId).toContain(READ_ONLY_CAUSE)
    }
    expect(new Set(banners).size).toBe(1)
  })

  it('AC-SA-000-09: the module stays operable with every artificial-intelligence model unavailable', () => {
    render(<OverviewScreen />)
    selectRole('ROLE-PLAT-ROOT')
    selectState('STATE-11')
    expect(within(aggregatesRegion()).getAllByRole('listitem')).toHaveLength(AGGREGATES.length)
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0)
    const button = within(incidentCard('INC-PLT-02')).getByRole('button', {
      name: /close incident/i,
    })
    expect(button.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(button)
    expect(incidentCard('INC-PLT-02').textContent).toMatch(/closed/i)
    expect(
      within(screen.getByRole('region', { name: 'Agent health' })).getByRole('link', {
        name: /emergency pause/i,
      }),
    ).toBeDefined()
  })
})

describe('MOD-SA-01 — incidents', () => {
  it('AC-SA-01-05: one agent degrading across two tenants is one platform incident', () => {
    render(<OverviewScreen />)
    const card = incidentCard('INC-PLT-01')
    expect(card.textContent).toMatch(/one platform incident/i)
    expect(card.textContent).toMatch(/Tenant A/)
    expect(card.textContent).toMatch(/Tenant B/)
    expect(screen.getAllByRole('article')).toHaveLength(INCIDENTS.length)
  })

  it('carries every attribute AC-4880 requires before a close', () => {
    render(<OverviewScreen />)
    const card = incidentCard('INC-PLT-01')
    for (const attribute of [
      /classification/i,
      /role owner/i,
      /detection source/i,
      /communication decision/i,
      /verification checklist/i,
    ]) {
      expect(card.textContent, String(attribute)).toMatch(attribute)
    }
  })

  it('writes the close and its audit record in one transaction, and never re-offers the control', () => {
    render(<OverviewScreen />)
    selectRole('ROLE-PLAT-ROOT')
    fireEvent.click(within(incidentCard('INC-PLT-02')).getByRole('button', { name: /close/i }))
    const card = incidentCard('INC-PLT-02')
    expect(card.textContent).toMatch(/same transaction/i)
    expect(within(card).queryByRole('button')).toBeNull()
  })

  it('filters the incident list by state, tenant and capability', () => {
    render(<OverviewScreen />)
    fireEvent.change(screen.getByLabelText(/incident filter/i), {
      target: { value: 'mitigated' },
    })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    fireEvent.change(screen.getByLabelText(/incident filter/i), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText(/tenant filter/i), { target: { value: 'Tenant C' } })
    expect(screen.queryByRole('article', { name: 'Incident INC-PLT-01' })).toBeNull()
    fireEvent.change(screen.getByLabelText(/tenant filter/i), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText(/capability filter/i), {
      target: { value: 'connectivity protocol' },
    })
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('renders the 30/60/120-minute connectivity ladder', () => {
    render(<OverviewScreen />)
    const ladder = screen.getByRole('region', { name: 'Connectivity-loss protocol' })
    expect(ladder.textContent).toMatch(/30 minutes/)
    expect(ladder.textContent).toMatch(/60 minutes/)
    expect(ladder.textContent).toMatch(/120 minutes/)
  })
})

describe('MOD-SA-01 — the boundaries this surface must not cross', () => {
  it('AC-SA-01-02 / AC-SA-000-07: no link resolves to record-level tenant content', () => {
    const { container } = render(<OverviewScreen />)
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '')
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href).toMatch(/^\/super-admin\//)
      expect(href).not.toMatch(/tenant[s]?\/[^/]/)
    }
    expect(container.textContent).toMatch(/session-request/i)
  })

  it('never uses the four forbidden words', () => {
    const { container } = render(<OverviewScreen />)
    expect(container.textContent ?? '').not.toMatch(
      /tamper-evident|chained|\bsigned\b|\bverified\b/i,
    )
  })

  it('names each unspecified affordance instead of inventing one', () => {
    render(<OverviewScreen />)
    const panel = screen.getByRole('region', { name: 'Unspecified in source' })
    for (const missing of [
      /acknowledge/i,
      /assign/i,
      /escalate/i,
      /annotate/i,
      /threshold/i,
      /refresh/i,
      /export/i,
    ]) {
      expect(panel.textContent, String(missing)).toMatch(missing)
    }
    const { container } = render(<OverviewScreen />)
    const buttonNames = [...container.querySelectorAll('button')].map((b) => b.textContent ?? '')
    for (const invented of [/acknowledge/i, /escalate/i, /assign/i]) {
      expect(buttonNames.join(' '), String(invented)).not.toMatch(invented)
    }
  })
})
