import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { StandardReportDataSets } from '@/surfaces/doh/modules/doh-18/StandardReportDataSets'
import { DOH_18_BLOCKED, DOH_18_BUILDABLE } from '@/surfaces/doh/modules/doh-18/datasets'
import type { TenantRoleId } from '../../app/hub/HubShell'

const TENANT_ROLES: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

/**
 * "No inline editing affordance" is not "no `<button>`". This looks for
 * anything a person could act through, a disabled control included — a
 * disabled control implies a condition that could become true, and neither the
 * boundary nor the decision block moves on this card.
 */
const AFFORDANCES =
  'button, input, select, textarea, [role="button"], [contenteditable="true"], [aria-disabled]'

function renderFor(role: TenantRoleId) {
  const { unmount } = render(<StandardReportDataSets role={role} />)
  return { root: screen.getByTestId('doh-18'), unmount }
}

describe('MOD-DOH-18 renders as a component and offers nothing', () => {
  it('draws no affordance for any of the five roles', () => {
    for (const role of TENANT_ROLES) {
      const { root, unmount } = renderFor(role)
      expect(root.querySelectorAll(AFFORDANCES)).toHaveLength(0)
      unmount()
    }
  })

  it('names the module and states that the Command Center renders the data', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    expect(root.getAttribute('data-module')).toBe('MOD-DOH-18')
    expect(within(root).getByTestId('doh-18-no-screen').textContent).toContain('SCR-DOH-02')
    expect(within(root).getByTestId('doh-18-no-screen').textContent).toContain(
      'the Client Command Center renders it',
    )
    unmount()
  })
})

describe('sets 4 and 5 render decision-blocked, and a reader sees both wordings', () => {
  it('renders all five sets, with the blocked two no less prominent', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    const sets = within(root).getByTestId('doh-18-sets')
    expect(sets.querySelectorAll('li')).toHaveLength(5)
    // Same element type, same container, nothing collapsed and nothing hidden.
    for (const ordinal of [1, 2, 3, 4, 5]) {
      const node = within(root).getByTestId(`doh-18-set-${ordinal}`)
      expect(node.tagName).toBe('LI')
      expect(node.hasAttribute('hidden')).toBe(false)
      expect(node.getAttribute('aria-hidden')).toBeNull()
    }
    unmount()
  })

  /**
   * BOTH WORDINGS, READ OUT OF SEPARATE ELEMENTS. A single `textContent` read
   * over the whole card would be satisfied by the two names appearing anywhere
   * on the page, including inside each other — `Allocation consumption trend`
   * is a substring of the Hub's `Tier-allocation consumption trend`, so this
   * asserts each wording in its OWN node.
   */
  it('shows both candidate wordings for each blocked set, and no chosen name', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    for (const set of DOH_18_BLOCKED) {
      const node = within(root).getByTestId(`doh-18-set-${set.ordinal}`)
      expect(node.getAttribute('data-build')).toBe('decision-blocked')
      const hub = within(root).getByTestId(`doh-18-set-${set.ordinal}-wording-hub`)
      const cc = within(root).getByTestId(`doh-18-set-${set.ordinal}-wording-cc`)
      expect(hub.textContent).toContain(set.hubWording.text)
      expect(cc.textContent).toContain(set.commandCenterWording.text)
      expect(hub).not.toBe(cc)
      // Neither is marked as the answer, and no single name is offered.
      expect(within(root).queryByTestId(`doh-18-set-${set.ordinal}-name`)).toBeNull()
      // The decision is named where the block is stated.
      expect(node.textContent).toContain('DEC-REPORT-001')
    }
    expect(DOH_18_BLOCKED).toHaveLength(2)
    unmount()
  })

  /**
   * NOT A CHECKMARK, AND NOT `unavailable`. Both are wrong in opposite
   * directions: a checkmark says implemented, and `unavailable` says the
   * capability is absent when it is present, identified twice, and held.
   */
  it('marks a blocked set held rather than done or absent', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    for (const set of DOH_18_BLOCKED) {
      const node = within(root).getByTestId(`doh-18-set-${set.ordinal}`)
      const text = node.textContent ?? ''
      expect(text).toContain('Decision-blocked')
      expect(text).toContain('Held, not absent and not implemented')
      for (const forbidden of ['✓', '✔', '✅', 'Unavailable', 'unavailable', 'Complete', 'Done']) {
        expect(text).not.toContain(forbidden)
      }
    }
    unmount()
  })

  it('the tally never counts a blocked set as implemented', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    const tally = within(root).getByTestId('doh-18-set-tally').textContent ?? ''
    expect(tally).toContain(`${DOH_18_BUILDABLE.length} built`)
    expect(tally).toContain(`${DOH_18_BLOCKED.length} decision-blocked`)
    expect(tally).toContain('counted as implemented nowhere')
    unmount()
  })

  it('states the decision is recorded once, elsewhere', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    const home = within(root).getByTestId('doh-18-decision-home').textContent ?? ''
    expect(home).toContain('src/surfaces/cc/modules/cc-11/report-sets.ts')
    expect(home).toContain('not restated here')
    unmount()
  })
})

describe('the two cross-surface statements', () => {
  it('renders exactly two, one per distinct boundary, for every role', () => {
    for (const role of TENANT_ROLES) {
      const { root, unmount } = renderFor(role)
      const statements = within(root).getAllByTestId('cross-surface-statement')
      expect(statements).toHaveLength(2)
      // One from the register, one off it — and the component says which.
      expect(statements.map((s) => s.getAttribute('data-registered')).sort()).toEqual([
        'false',
        'true',
      ])
      unmount()
    }
  })

  it('the registered one is the Custom Report Builder and names the owning surface', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    const registered = within(root)
      .getAllByTestId('cross-surface-statement')
      .find((s) => s.getAttribute('data-registered') === 'true')
    if (registered === undefined) throw new Error('expected a registered statement')
    expect(registered.getAttribute('data-boundary')).toBe('custom-report-builder')
    expect(registered.textContent).toContain('Custom Report Builder')
    expect(registered.textContent).toContain('Client Command Center')
    unmount()
  })

  /**
   * THE OFF-REGISTER ONE PRINTS WHY IT IS OFF-REGISTER. A reader is never
   * shown a boundary claim the register does not carry without being told the
   * register does not carry it.
   */
  it('the off-register one prints why no register row is borrowed', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    const off = within(root)
      .getAllByTestId('cross-surface-statement')
      .find((s) => s.getAttribute('data-registered') === 'false')
    if (off === undefined) throw new Error('expected an off-register statement')
    expect(off.getAttribute('data-boundary')).toBe('request-a-report-beyond-the-five-sets')
    expect(off.textContent).toContain('Standards and Operations Studio')
    expect(off.textContent).toContain('Job-to-workflow reference')
    expect(off.textContent).toContain('L29927')
    unmount()
  })

  /**
   * A LINK IS DRAWN ONLY WHERE THE REGISTRY ADMITS THE VIEWER, and the states
   * are read off the component rather than off the model, so a component that
   * drew a link on a `statement` answer would fail here. At least two distinct
   * link states occur across the five roles — otherwise this passes on a
   * component that hard-coded one.
   */
  it('draws a link only where the statement says one was checked', () => {
    const observed = new Set<string>()
    for (const role of TENANT_ROLES) {
      const { root, unmount } = renderFor(role)
      for (const statement of within(root).getAllByTestId('cross-surface-statement')) {
        const state = statement.getAttribute('data-link-state') ?? ''
        observed.add(state)
        const anchors = statement.querySelectorAll('a')
        expect(anchors).toHaveLength(state === 'link' ? 1 : 0)
      }
      unmount()
    }
    expect(observed.size).toBeGreaterThan(1)
  })
})

describe('the permission matrix as the component prints it', () => {
  it('prints eight action rows and a cell for each of the five roles', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    const body = root.querySelectorAll('tbody tr')
    expect(body).toHaveLength(8)
    for (const row of body) {
      expect(row.querySelectorAll('td, th')).toHaveLength(6)
    }
    unmount()
  })

  it('states the boundary in the cell of a bare-Allowed row rather than offering it', () => {
    const { root, unmount } = renderFor('TENANT_ADMIN')
    const row = [...root.querySelectorAll('tbody tr')].find((r) =>
      (r.textContent ?? '').startsWith('Author and export report formats'),
    )
    if (row === undefined) throw new Error('expected the report-formats row')
    expect(row.textContent).toContain('met on the Client Command Center Builder')
    expect(row.querySelectorAll(AFFORDANCES)).toHaveLength(0)
    unmount()
  })
})
