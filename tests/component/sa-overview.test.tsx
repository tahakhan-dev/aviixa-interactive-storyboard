import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { OverviewScreen } from '../../app/super-admin/platform-overview-and-health/OverviewScreen'
import {
  AGGREGATES,
  INCIDENTS,
  PLATFORM_ROLES,
} from '../../app/super-admin/platform-overview-and-health/fixtures'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { SCREEN_STATES } from '@/ui/screen-state'

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

  it('shows Support the incident record and refuses the close control with a named reason', () => {
    render(<OverviewScreen />)
    selectRole('ROLE-PLAT-SUP')
    const card = incidentCard('INC-PLT-02')
    const button = within(card).getByRole('button', { name: /close incident/i })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(card.textContent).toMatch(/Support holds no incident ownership/i)
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
    render(<OverviewScreen />)
    for (const state of SCREEN_STATES.filter((s) => !s.frontlineOnly)) {
      selectState(state.id)
      const region = screen.getByRole('region', { name: 'Screen state' })
      expect(region.textContent, state.id).toContain(state.id)
      expect((region.textContent ?? '').length, state.id).toBeGreaterThan(state.id.length + 20)
    }
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
