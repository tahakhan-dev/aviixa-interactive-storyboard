import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { SCREEN_STATES } from '@/ui/screen-state'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { saModuleById } from '@/surfaces/sa/modules'
import {
  CoreAgentsScreen,
  MODULE,
  APPLICABLE_STATES,
  CONSOLE_ROLES,
} from '../../app/super-admin/core-agents-and-composed-agent-review/CoreAgentsScreen'

/** D10's four forbidden words. No carve-outs: "signed-in" is also forbidden. */
const FORBIDDEN_WORDS = /tamper-evident|chained|signed|verified/i

function selectRole(roleId: string) {
  fireEvent.change(screen.getByLabelText(/viewing as/i), { target: { value: roleId } })
}

function selectState(stateId: string) {
  fireEvent.change(screen.getByLabelText(/screen state/i), { target: { value: stateId } })
}

describe('MOD-SA-03 — Core Agents and Composed-Agent Review', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one <h1>', () => {
    render(<CoreAgentsScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-03 · Definition layer/)).toBeDefined()
    expect(MODULE).toEqual(saModuleById('MOD-SA-03'))
  })

  it('annotates its SCR-SA numbers without ever keying a route on one', () => {
    const { container } = render(<CoreAgentsScreen />)
    expect(screen.getAllByText(/SCR-SA-03/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/SCR-SA-04/).length).toBeGreaterThan(0)
    for (const a of Array.from(container.querySelectorAll('a'))) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/SCR-SA-\d+/i)
    }
  })

  it('carries the prototype disclosure', () => {
    render(<CoreAgentsScreen />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
  })

  it('offers the twelve applicable screen states and never the frontline-only STATE-07', () => {
    render(<CoreAgentsScreen />)
    expect(APPLICABLE_STATES).toHaveLength(12)
    expect(APPLICABLE_STATES).not.toContain('STATE-07')
    const options = within(screen.getByLabelText(/screen state/i)).getAllByRole('option')
    expect(options).toHaveLength(12)
    for (const s of SCREEN_STATES) {
      if (s.frontlineOnly) continue
      selectState(s.id)
      expect(screen.getByTestId('screen-state-panel').textContent ?? '', s.id).not.toBe('')
    }
  })

  // ---- the two source-defined controls, and nothing invented ------------

  it('builds exactly the two controls the source defines for this module', () => {
    render(<CoreAgentsScreen />)
    const bar = screen.getAllByTestId('review-action-bar')[0]
    expect(bar).toBeDefined()
    const labels = within(bar as HTMLElement)
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(labels).toEqual(['Approve', 'Return with reasons'])
  })

  it.each([
    ['ROOT_SUPER_ADMIN'],
    ['ADMIN'],
    ['PLATFORM_ENGINEER'],
  ])('lets %s act on a composed-agent submission', (roleId) => {
    render(<CoreAgentsScreen />)
    selectRole(roleId)
    const bar = screen.getAllByTestId('review-action-bar')[0] as HTMLElement
    expect(within(bar).getByRole('button', { name: 'Approve' }).getAttribute('aria-disabled')).toBeNull()
  })

  it('renders Approve and Return DISABLED WITH A NAMED REASON for Support — visible, inert, reason stated', () => {
    render(<CoreAgentsScreen />)
    selectRole('SUPPORT')
    const bar = screen.getAllByTestId('review-action-bar')[0] as HTMLElement
    const approve = within(bar).getByRole('button', { name: 'Approve' })
    expect(approve.getAttribute('aria-disabled')).toBe('true')
    const describedBy = approve.getAttribute('aria-describedby')
    expect(describedBy).not.toBeNull()
    const reason = document.getElementById(describedBy ?? '')
    expect(reason?.textContent ?? '').toMatch(/read-only/i)
  })

  it('shows every one of the four platform roles what it sees, including when it may not act', () => {
    render(<CoreAgentsScreen />)
    const matrix = screen.getByTestId('role-outcome-matrix')
    expect(CONSOLE_ROLES).toHaveLength(4)
    for (const role of CONSOLE_ROLES) {
      expect(within(matrix).getByText(role.name), role.id).toBeDefined()
    }
    // Every cell carries an explicit outcome — no blank cells.
    for (const cell of Array.from(matrix.querySelectorAll('tbody td'))) {
      expect((cell.textContent ?? '').trim()).not.toBe('')
    }
    // Read is granted to all four unless a rule says otherwise.
    expect((matrix.textContent ?? '').match(/Read/g)?.length ?? 0).toBeGreaterThanOrEqual(4)
  })

  // ---- prohibitions, by rule -------------------------------------------

  it('renders authoring or editing an agent definition ABSENT for every account, including the root', () => {
    render(<CoreAgentsScreen />)
    for (const role of CONSOLE_ROLES) {
      selectRole(role.id)
      expect(screen.queryByRole('button', { name: /author|edit an agent definition/i }), role.id).toBeNull()
      const note = screen.getByTestId('absent-author-agent-definition')
      expect(note.tagName.toLowerCase(), role.id).not.toBe('button')
      expect(note.textContent ?? '', role.id).toMatch(/including the root/i)
      expect(note.querySelector('button, input, [role=switch]'), role.id).toBeNull()
    }
  })

  it('renders memory-access grants as grant names only — reading memory content is ABSENT for every account', () => {
    render(<CoreAgentsScreen />)
    const note = screen.getByTestId('absent-read-memory-content')
    expect(note.querySelector('button, input, [role=switch]')).toBeNull()
    expect(note.textContent ?? '').toMatch(/counts and volume only|content/i)
  })

  it('renders the relevant ENFORCED invariants as status chips, never as controls', () => {
    const { container } = render(<CoreAgentsScreen />)
    const chips = screen.getByTestId('invariant-chips')
    expect(chips.querySelector('button')).toBeNull()
    expect(chips.querySelector('input')).toBeNull()
    expect(chips.querySelector('[role=switch]')).toBeNull()
    expect(chips.querySelector('[tabindex]')).toBeNull()
    const gate = SA_INVARIANTS.find((i) => i.id === 'evaluation-gate')
    expect(chips.textContent ?? '').toContain(gate?.name ?? 'the evaluation gate')
    expect(container.querySelectorAll('[role=switch]')).toHaveLength(0)
  })

  it('states plainly that this module carries no critical-class action, rather than drawing a class badge with nothing behind it', () => {
    render(<CoreAgentsScreen />)
    expect(screen.getByTestId('critical-class-note').textContent ?? '').toMatch(
      /no critical-class action/i,
    )
  })

  // ---- Return requires reasons -----------------------------------------

  it('keeps Return with reasons inert until free-text reasons are supplied', () => {
    render(<CoreAgentsScreen />)
    selectRole('PLATFORM_ENGINEER')
    const bar = screen.getAllByTestId('review-action-bar')[0] as HTMLElement
    const ret = within(bar).getByRole('button', { name: 'Return with reasons' })
    expect(ret.getAttribute('aria-disabled')).toBe('true')
    fireEvent.change(within(bar).getByLabelText(/reasons/i), {
      target: { value: 'The containment scope exceeds the declared capability scope.' },
    })
    expect(
      (within(bar).getByRole('button', { name: 'Return with reasons' })).getAttribute('aria-disabled'),
    ).toBeNull()
  })

  it('advances a submission only on explicit user action, with the state name always visible', () => {
    render(<CoreAgentsScreen />)
    selectRole('ADMIN')
    const row = screen.getAllByTestId('review-row')[0] as HTMLElement
    expect(within(row).getByTestId('review-state').textContent).toBe('submitted')
    fireEvent.click(within(row).getByRole('button', { name: 'Approve' }))
    expect(within(row).getByTestId('review-state').textContent).toBe('approved')
  })

  // ---- AC-SA-000-09: STATE-11 --------------------------------------------

  it('remains operable with every artificial-intelligence model unavailable (AC-SA-000-09)', () => {
    render(<CoreAgentsScreen />)
    selectRole('ADMIN')
    selectState('STATE-11')
    expect(screen.getAllByText(/unavailable/i).length).toBeGreaterThan(0)
    const row = screen.getAllByTestId('review-row')[0] as HTMLElement
    const approve = within(row).getByRole('button', { name: 'Approve' })
    expect(approve.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(approve)
    expect(within(row).getByTestId('review-state').textContent).toBe('approved')
    // The roster still renders every agent record — records, not inference.
    expect(screen.getAllByTestId('agent-row').length).toBeGreaterThan(0)
  })

  // ---- AC-SA-01-03: aggregates -------------------------------------------

  it('renders every aggregate with an as-of time, and degrades to stale-with-age or unavailable — never zero, never blank', () => {
    render(<CoreAgentsScreen />)
    for (const stateId of APPLICABLE_STATES) {
      selectState(stateId)
      const cells = screen.getAllByTestId('aggregate-value')
      expect(cells.length, stateId).toBeGreaterThan(0)
      for (const cell of cells) {
        const text = (cell.textContent ?? '').trim()
        expect(text, `${stateId} aggregate blank`).not.toBe('')
        expect(text, `${stateId} aggregate zeroed`).not.toBe('0')
      }
      expect(screen.getByTestId('aggregate-as-of').textContent ?? '', stateId).toMatch(/as of/i)
    }
    selectState('STATE-08')
    expect(screen.getByTestId('aggregate-as-of').textContent ?? '').toMatch(/stale/i)
    selectState('STATE-11')
    for (const cell of screen.getAllByTestId('aggregate-value')) {
      expect(cell.textContent ?? '').toMatch(/unavailable/i)
    }
  })

  // ---- the no-link rule, and the metric line -----------------------------

  it('resolves every tenant reference to a session-request form, never to record-level tenant content', () => {
    const { container } = render(<CoreAgentsScreen />)
    const links = Array.from(container.querySelectorAll('a'))
    expect(links.length).toBeGreaterThan(0)
    for (const a of links) {
      const href = a.getAttribute('href') ?? ''
      expect(href).toMatch(/^\/super-admin\//)
      expect(href).not.toMatch(/tenant[s]?\/[^/]+\/(record|run|trace|memory|agent)/)
    }
    const sessionLink = screen.getByTestId('tenant-session-request')
    expect(sessionLink.getAttribute('href')).toMatch(/^\/super-admin\/support-access\/?$/)
    expect(sessionLink.textContent ?? '').toMatch(/session/i)
  })

  it('holds the line at the tenant: no per-worker series, and the source’s two proportional indicators are withheld, not rendered', () => {
    const { container } = render(<CoreAgentsScreen />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/per-worker|per worker|worker ranking|by worker/i)
    expect(screen.getByTestId('withheld-indicators').textContent ?? '').toMatch(/not rendered/i)
    expect(screen.getByTestId('aggregate-scope').textContent ?? '').toMatch(/tenant-month/i)
  })

  it('uses none of the four forbidden words anywhere in its copy, for any role in any state', () => {
    const { container } = render(<CoreAgentsScreen />)
    for (const role of CONSOLE_ROLES) {
      selectRole(role.id)
      for (const stateId of APPLICABLE_STATES) {
        selectState(stateId)
        const hit = FORBIDDEN_WORDS.exec(container.textContent ?? '')
        expect(hit?.[0], `${role.id}/${stateId} rendered "${hit?.[0] ?? ''}"`).toBeUndefined()
      }
    }
  })

  it('claims no production capability — the review decision is a rendered label on fixture data', () => {
    render(<CoreAgentsScreen />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
  })

  // ---- unspecified in source ---------------------------------------------

  it('names each affordance the source leaves undefined, rather than inventing one', () => {
    render(<CoreAgentsScreen />)
    const panel = screen.getByTestId('unspecified-in-source')
    const items = within(panel).getAllByRole('listitem')
    expect(items.length).toBeGreaterThanOrEqual(5)
    const text = panel.textContent ?? ''
    expect(text).toMatch(/SCR-SA-MODELS/)
    expect(text).toMatch(/under review/)
    expect(text).toMatch(/mirrored/)
  })

  /**
   * THE SCREEN HELD A PRIVATE ROSTER AND INVENTED A GOVERNANCE POSITION.
   *
   * Before slice 11 this file's component carried its own copy of the
   * governance-binding vocabulary and its own four agents, and it gave the
   * Vision Reasoning Agent `none — reasoning agent`. The frozen source states
   * no binding for it anywhere: L43295 says only that the agent ships in a
   * later release together with the vision atoms, and its roster row at L91466
   * reads "Not specified beyond the roster entry".
   *
   * So the screen rendered a governance contract nobody wrote, on the one
   * field where inventing one reads as a commitment. The roster is now the
   * single source and this pair of assertions is what stops the private copy
   * coming back: one proves the three V1 bindings reach the page from the
   * roster, the other proves the fourth renders as a STATED ABSENCE rather
   * than as a value, a blank, or an omitted agent.
   */
  it('renders each V1 binding from the shared roster and the Vision agent as a stated absence', () => {
    render(<CoreAgentsScreen />)

    const bindings = screen.getAllByTestId('agent-governance-binding').map((n) => n.textContent)
    expect(bindings).toHaveLength(3)
    expect(bindings.join(' | ')).toContain('authoring-time policy')
    expect(bindings.join(' | ')).toContain('runtime human gate')
    expect(bindings.join(' | ')).toContain('none — reasoning agent')

    // The absence is rendered, singular, and carries the source's own words for
    // why it is absent — not an empty cell and not a fourth binding. getByTestId
    // throws on zero AND on more than one, so it carries the singularity itself.
    const absence = screen.getByTestId('agent-governance-absence')
    expect(absence.textContent).toContain('not stated')
    expect(absence.textContent).toContain('Not specified beyond the roster entry')

    // And no binding element anywhere claims a value for the Vision agent.
    for (const b of bindings) {
      expect(b).not.toContain('Not specified')
    }
  })

  it('records the source conflicts it resolved rather than resolving them silently', () => {
    render(<CoreAgentsScreen />)
    const panel = screen.getByTestId('source-conflicts')
    const text = panel.textContent ?? ''
    // D6 — incident ownership belongs to MOD-SA-01, not here.
    expect(text).toMatch(/MOD-SA-01/)
    // The agent record: stated nine fields, ten enumerated.
    expect(text).toMatch(/nine/i)
    expect(text).toMatch(/DEC-GATE-001/)
  })
})
