import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import type { ScreenStateId } from '@/ui/screen-state'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { CRITICAL_ACTIONS } from '@/surfaces/sa/critical-actions'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { JbsAccessScreen, JBS_GRANT_STATES, JBS_GRANTS, RECONCILIATION_CHECKS, CONSOLE_ROLE_VIEWS, UNSPECIFIED_IN_SOURCE, type SaConsoleRoleToken } from '../../app/super-admin/jbs-access/JbsAccessScreen'

/** D10 / spec §10 gate 4: these four words appear nowhere in SURF-SA copy. */
const FORBIDDEN_WORDS = /\b(tamper-evident|chained|signed|verified)\b/i

/**
 * All rendered copy with a separator at every element edge. `textContent`
 * concatenates adjacent text nodes with nothing between them, which blinds
 * a `\b`-anchored gate at element boundaries; replacing every tag with a
 * space restores them. (Same defect and same fix as the MOD-SA-02 suite.)
 */
function renderedCopy(): string {
  return document.body.innerHTML.replace(/<[^>]*>/g, ' ')
}

function renderAs(role: SaConsoleRoleToken, state?: ScreenStateId) {
  return render(
    <JbsAccessScreen
      initialRole={role}
      {...(state !== undefined ? { initialScreenState: state } : {})}
    />,
  )
}

/**
 * The three cells of one rendered grant row, READ FROM THE DOM. Asserting on
 * the fixture object instead would let any placeholder — '—', 'TBD' — satisfy
 * a "shows a time box" property while the table shows none.
 */
interface GrantRowCells {
  readonly scope: string
  readonly timeBox: string
  readonly reason: string
}

function grantRow(id: string): GrantRowCells {
  const table = screen.getByLabelText('JBS access grants')
  const row = within(table)
    .getAllByRole('row')
    .find((r) => within(r).queryAllByRole('cell')[0]?.textContent === id)
  if (row === undefined) throw new Error(`No rendered row for grant ${id}`)
  const cells = within(row)
    .getAllByRole('cell')
    .map((c) => c.textContent ?? '')
  const [, , scope, timeBox, reason] = cells
  if (scope === undefined || timeBox === undefined || reason === undefined) {
    throw new Error(`Grant row ${id} rendered ${cells.length} cells, expected five`)
  }
  return { scope, timeBox, reason }
}

function reasonTextOf(control: HTMLElement): string {
  const id = control.getAttribute('aria-describedby')
  if (id === null) return ''
  return document.getElementById(id)?.textContent ?? ''
}

const ROOT: SaConsoleRoleToken = 'ROLE-PLAT-ROOT'
const ADMIN: SaConsoleRoleToken = 'ROLE-PLAT-ADMIN'
const ENG: SaConsoleRoleToken = 'ROLE-PLAT-ENG'
const SUP: SaConsoleRoleToken = 'ROLE-PLAT-SUP'
const ALL_ROLES: readonly SaConsoleRoleToken[] = [ROOT, ADMIN, ENG, SUP]

describe('MOD-SA-16 JBS Access — the shell contract', () => {
  it('renders under the console shell with the module id and band as annotations, one h1', () => {
    renderAs(ROOT)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent ?? '').toContain('JBS Access')
    expect(renderedCopy()).toMatch(/MOD-SA-16/)
    expect(renderedCopy()).toMatch(/Operations layer/)
  })

  it('keeps SCR-SA-23 an annotation, never a route key (D1)', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/SCR-SA-23/)
    expect(renderedCopy()).toMatch(/SB-SA-16/)
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })

  it('carries the prototype disclosure', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/prototype|storyboard/i)
  })

  it('uses none of the four forbidden words, for any role in any state', () => {
    for (const role of ALL_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const view = renderAs(role, state.id)
        expect(renderedCopy()).not.toMatch(FORBIDDEN_WORDS)
        view.unmount()
      }
    }
  })
})

describe('MOD-SA-16 — the twelve applicable screen states', () => {
  it('offers exactly the twelve applicable states and never the frontline-only STATE-07', () => {
    expect(SA_APPLICABLE_STATES).toHaveLength(12)
    expect(SA_APPLICABLE_STATES.map((s) => s.id)).not.toContain('STATE-07')
  })

  it('renders every applicable state for every role without throwing', () => {
    for (const role of ALL_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const view = renderAs(role, state.id)
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
        view.unmount()
      }
    }
  })

  it('STATE-11: with every AI model unavailable the module REMAINS OPERABLE (AC-SA-000-09)', () => {
    renderAs(ROOT, 'STATE-11')
    // The one source-defined control is still exercisable, and it is a real
    // enabled button, not a disabled stand-in.
    const revoke = within(screen.getByTestId('revoke-grant-action-bar')).getByRole('button')
    expect(revoke.getAttribute('aria-disabled')).not.toBe('true')
    expect(renderedCopy()).toMatch(/deterministic|consults no model|no model/i)
  })

  it('STATE-01 is the point of this module: no grant exists and JBS holds nothing', () => {
    renderAs(ROOT, 'STATE-01')
    expect(renderedCopy()).toMatch(/JBS holds nothing|holds no standing access/i)
  })

  it('STATE-06 disables the actions under ONE banner naming ONE cause', () => {
    renderAs(ROOT, 'STATE-06')
    expect(
      screen.queryAllByRole('status').length + screen.queryAllByRole('alert').length,
    ).toBeLessThan(3)
    const revoke = within(screen.getByTestId('revoke-grant-action-bar')).getByRole('button')
    expect(revoke.getAttribute('aria-disabled')).toBe('true')
    expect(reasonTextOf(revoke)).toMatch(/read-only/i)
  })
})

describe('MOD-SA-16 — the reconciliation aggregate (AC-SA-01-03)', () => {
  it('renders an as-of timestamp in the success state', () => {
    renderAs(ROOT)
    const agg = screen.getByLabelText('Grant reconciliation')
    expect(agg.textContent ?? '').toMatch(/as of/i)
  })

  it('degrades to stale WITH ITS AGE, never to zero', () => {
    renderAs(ROOT, 'STATE-08')
    const agg = screen.getByLabelText('Grant reconciliation')
    expect(agg.textContent ?? '').toMatch(/stale/i)
    expect(agg.textContent ?? '').toMatch(/hours old|days old/i)
  })

  it('degrades to unavailable, never to zero and never to blank', () => {
    renderAs(ROOT, 'STATE-12')
    const agg = screen.getByLabelText('Grant reconciliation')
    const text = agg.textContent ?? ''
    expect(text).toMatch(/unavailable/i)
    expect(text.trim().length).toBeGreaterThan(40)
    // The reconciliation counts are exactly the ones a reader would expect to
    // be nought. An unreadable aggregate must NOT borrow that nought.
    expect(text).not.toMatch(/\b0\b/)
  })

  it('renders a not-yet-read placeholder while loading, never the number nought', () => {
    renderAs(ROOT, 'STATE-02')
    const text = screen.getByLabelText('Grant reconciliation').textContent ?? ''
    expect(text).toMatch(/not yet read/i)
    expect(text).not.toMatch(/\b0\b/)
  })

  it('renders a genuine nought as a READ VALUE, distinguished from a placeholder', () => {
    renderAs(ROOT)
    const text = screen.getByLabelText('Grant reconciliation').textContent ?? ''
    // FB-ROLE-027 / FB-ROLE-029: both of these must be zero, and a zero here
    // is a reading, not an absence of one.
    expect(RECONCILIATION_CHECKS.filter((c) => c.mustBeZero).length).toBeGreaterThanOrEqual(2)
    for (const check of RECONCILIATION_CHECKS) expect(text).toContain(check.label)
    expect(text).toMatch(/read value|actually read/i)
  })

  it('holds the line at the tenant: no rate, no per-worker series, no comparison of people', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      const copy = renderedCopy()
      expect(copy).not.toMatch(/per worker|per-worker|worker ranking|per hour|per minute|\brate\b/i)
      view.unmount()
    }
  })
})

describe('MOD-SA-16 — no standing access (AC-SA-16-01, AC-SEC-807)', () => {
  it('states that JBS holds no standing access and no default grant exists in any environment', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/no standing access/i)
    expect(renderedCopy()).toMatch(/no default grant exists in any environment/i)
  })

  it('draws no standing-access control for anyone, including the root — ABSENT', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      const panel = screen.getByLabelText('Standing access')
      expect(within(panel).queryAllByRole('button')).toHaveLength(0)
      expect(within(panel).queryAllByRole('checkbox')).toHaveLength(0)
      expect(within(panel).queryAllByRole('switch')).toHaveLength(0)
      expect(within(panel).getByRole('note').textContent ?? '').toMatch(/including the root/i)
      view.unmount()
    }
  })

  it('draws no grant-extension control for anyone — an expired grant never extends itself', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      const panel = screen.getByLabelText('Expiry and extension')
      expect(within(panel).queryAllByRole('button')).toHaveLength(0)
      expect(within(panel).getByRole('note').textContent ?? '').toMatch(/never extends itself/i)
      view.unmount()
    }
  })

  it('draws no route by which JBS holds the root account (AC-SA-16-06) — ABSENT', () => {
    const view = renderAs(ROOT)
    const panel = screen.getByLabelText('Root custody')
    expect(within(panel).queryAllByRole('button')).toHaveLength(0)
    expect(within(panel).getByRole('note').textContent ?? '').toMatch(/custody/i)
    view.unmount()
  })
})

describe('MOD-SA-16 — OBJ-SA-JBSGRANT, seven states', () => {
  it('carries the seven grant states in the source order and closes the set there', () => {
    expect(JBS_GRANT_STATES).toEqual([
      'drafted',
      'pending approval',
      'issued',
      'active',
      'expired',
      'revoked',
      'reconciled',
    ])
  })

  it('exercises every one of the seven states with a fixture row', () => {
    renderAs(ROOT)
    for (const state of JBS_GRANT_STATES) {
      expect(JBS_GRANTS.some((g) => g.state === state)).toBe(true)
    }
    const table = screen.getByLabelText('JBS access grants')
    for (const grant of JBS_GRANTS) expect(table.textContent ?? '').toContain(grant.id)
  })

  it('shows a scope, a time box and a linked reason on every grant (AC-WF-ROLE-027-01)', () => {
    renderAs(ROOT)
    for (const grant of JBS_GRANTS) {
      const { scope, timeBox, reason } = grantRow(grant.id)
      for (const s of grant.scope) expect(scope).toContain(s)
      // Scope is by named modules or tenant tokens (L45890) — never free text.
      expect(scope).toMatch(/^(MOD-SA-\d\d |TENANT-[A-Z0-9-]+)/)
      if (grant.state === 'drafted') {
        // A draft has declared neither yet: that is the gate at AC-SA-16-02,
        // and the cell must say so and name the gate. A dash or a 'TBD' reads
        // as a declared value that happens to be short, which is the lie.
        expect(timeBox).toMatch(/not yet set .*required before submission .*AC-SA-16-02/)
        expect(reason).toMatch(/not yet linked .*required before submission .*AC-SA-16-02/)
      } else {
        // A declared time box is a bounded period the source itself names:
        // five working days (L45873) or four hours (L55086). Never open-ended.
        expect(timeBox).toMatch(/^(five working days|four hours)$/)
        // A linked reason links a ticket; free text is not a linked reason.
        expect(reason).toMatch(/^TICKET-FIXTURE-\d+ — \S/)
      }
    }
  })
})

describe('MOD-SA-16 — grant drafting is gated on all three (AC-SA-16-02)', () => {
  it('refuses submission until scope, time box and reason are all present', () => {
    renderAs(ADMIN)
    const submit = within(screen.getByTestId('submit-grant-action-bar')).getByRole('button')
    expect(submit.getAttribute('aria-disabled')).toBe('true')
    const reason = reasonTextOf(submit)
    expect(reason).toMatch(/scope/i)
    expect(reason).toMatch(/time box/i)
    expect(reason).toMatch(/reason/i)
  })

  it('allows submission once all three are declared', () => {
    renderAs(ADMIN)
    fireEvent.click(screen.getByLabelText(/Scope declared/i))
    fireEvent.click(screen.getByLabelText(/Time box declared/i))
    fireEvent.click(screen.getByLabelText(/Reason linked/i))
    const submit = within(screen.getByTestId('submit-grant-action-bar')).getByRole('button')
    expect(submit.getAttribute('aria-disabled')).not.toBe('true')
    fireEvent.click(submit)
    expect(screen.getByRole('status').textContent ?? '').toMatch(/pending approval/i)
  })

  it('refuses drafting to the Platform Engineer and Support, with a named reason', () => {
    for (const role of [ENG, SUP]) {
      const view = renderAs(role)
      const submit = within(screen.getByTestId('submit-grant-action-bar')).getByRole('button')
      expect(submit.getAttribute('aria-disabled')).toBe('true')
      expect(reasonTextOf(submit).length).toBeGreaterThan(20)
      view.unmount()
    }
  })
})

describe('MOD-SA-16 — approve and issue is the root’s alone', () => {
  it('gives the root the approve-and-issue control', () => {
    renderAs(ROOT)
    const bar = screen.getByTestId('issue-grant-action-bar')
    expect(within(bar).getByRole('button').getAttribute('aria-disabled')).not.toBe('true')
  })

  it('refuses it to the Admin with a reason that names the open decision, not a resolution', () => {
    renderAs(ADMIN)
    const button = within(screen.getByTestId('issue-grant-action-bar')).getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    const reason = reasonTextOf(button)
    expect(reason).toMatch(/DEC-JBSAUTH-001/)
    expect(reason).toMatch(/may not approve and issue|L44712/i)
  })

  it('names no JBS action among the eleven critical-class actions, so no class badge is asserted', () => {
    expect(CRITICAL_ACTIONS).toHaveLength(11)
    expect(CRITICAL_ACTIONS.map((a) => a.id)).not.toContain('jbs-grant-issue')
    for (const role of [ADMIN, ENG, SUP]) {
      const view = renderAs(role)
      const bar = screen.getByTestId('issue-grant-action-bar')
      // The class-badge rendering REPLACES the action bar with a StatusPill.
      // A surviving disabled button is therefore proof the badge was not drawn
      // — whatever label it might have carried.
      const buttons = within(bar).getAllByRole('button')
      expect(buttons).toHaveLength(1)
      const button = buttons[0]
      if (button === undefined) throw new Error('no control in the issue action bar')
      expect(button.getAttribute('aria-disabled')).toBe('true')
      // And the badge's own copy (L23707) appears nowhere in the bar: drawing
      // it would settle DEC-JBSAUTH-001 on a screen.
      expect(within(bar).queryByText(/root approval required/i)).toBeNull()
      expect(reasonTextOf(button)).toMatch(/DEC-JBSAUTH-001/)
      view.unmount()
    }
  })
})

describe('MOD-SA-16 — the one control the source defines: revocation (L45871)', () => {
  it('gives revocation to the Root Super Admin and the Admin, taking effect immediately', () => {
    for (const role of [ROOT, ADMIN]) {
      const view = renderAs(role)
      const bar = screen.getByTestId('revoke-grant-action-bar')
      expect(within(bar).getByRole('button').getAttribute('aria-disabled')).not.toBe('true')
      expect(bar.textContent ?? '').toMatch(/immediately/i)
      view.unmount()
    }
  })

  it('refuses revocation to the Platform Engineer and Support with a named reason', () => {
    for (const role of [ENG, SUP]) {
      const view = renderAs(role)
      const button = within(screen.getByTestId('revoke-grant-action-bar')).getByRole('button')
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(reasonTextOf(button)).toMatch(/Root Super Admin and the Admin|L45871/i)
      view.unmount()
    }
  })

  it('states that revocation leaves no access by any route (WF-ROLE-030)', () => {
    renderAs(ROOT)
    fireEvent.click(within(screen.getByTestId('revoke-grant-action-bar')).getByRole('button'))
    expect(screen.getByRole('status').textContent ?? '').toMatch(/no access by any route/i)
  })
})

describe('MOD-SA-16 — mirroring to both audit streams (L4627)', () => {
  it('names the platform audit stream and the tenant stream with Platform Access History', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    expect(copy).toMatch(/platform audit/i)
    expect(copy).toMatch(/Platform Access History/i)
  })

  it('renders the one-transaction audit guarantee as a chip, never as a control (R2)', () => {
    renderAs(ROOT)
    const section = screen.getByLabelText('The ENFORCED invariant on this screen')
    expect(section.querySelector('button')).toBeNull()
    expect(section.querySelector('input')).toBeNull()
    expect(section.querySelector('[role=switch]')).toBeNull()
    expect(section.querySelector('[tabindex]')).toBeNull()
    const invariant = SA_INVARIANTS.find((i) => i.id === 'one-transaction-audit-guarantee')
    expect(section.textContent ?? '').toContain(invariant?.name ?? 'MISSING')
    expect(section.textContent ?? '').toMatch(/ENFORCED/)
  })
})

describe('MOD-SA-16 — the no-link rule (AC-SA-000-07, AC-SEC-801)', () => {
  it('resolves no link to record-level tenant content, for any role', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      for (const link of screen.getAllByRole('link')) {
        const href = link.getAttribute('href') ?? ''
        expect(href).not.toMatch(/tenant[s]?\/[A-Za-z0-9-]/i)
        expect(href).not.toMatch(/^https?:/)
      }
      view.unmount()
    }
  })

  it('resolves the tenant scope link to this module’s own grant-request form', () => {
    renderAs(ROOT)
    const link = screen.getByTestId('tenant-session-request')
    expect(link.getAttribute('href')).toBe('#request-a-jbs-grant')
    expect(renderedCopy()).toMatch(/no ambient browsing/i)
  })

  it('names every tenant by token only', () => {
    renderAs(ROOT)
    for (const grant of JBS_GRANTS) {
      for (const s of grant.scope) {
        if (s.startsWith('TENANT')) expect(s).toMatch(/^TENANT-[A-Z0-9-]+$/)
      }
    }
  })
})

describe('MOD-SA-16 — every role is shown what it sees when it may not act', () => {
  it('never silently drops a control: each role sees the control or a named refusal', () => {
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      for (const testId of [
        'submit-grant-action-bar',
        'issue-grant-action-bar',
        'revoke-grant-action-bar',
      ]) {
        expect(within(screen.getByTestId(testId)).getAllByRole('button').length).toBe(1)
      }
      view.unmount()
    }
  })

  it('gives all four roles read of the grants list (D16)', () => {
    expect(CONSOLE_ROLE_VIEWS.map((r) => r.token)).toEqual([...ALL_ROLES])
    for (const role of ALL_ROLES) {
      const view = renderAs(role)
      expect(screen.getByLabelText('JBS access grants').textContent ?? '').toContain(
        JBS_GRANTS[0]?.id ?? 'MISSING',
      )
      view.unmount()
    }
  })
})

describe('MOD-SA-16 — unspecified in source (D15)', () => {
  it('names each missing affordance rather than inventing one', () => {
    renderAs(ROOT)
    const panel = screen.getByLabelText('Unspecified in source')
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThanOrEqual(6)
    for (const entry of UNSPECIFIED_IN_SOURCE) {
      expect(panel.textContent ?? '').toContain(entry.what)
    }
    expect(within(panel).queryAllByRole('button')).toHaveLength(0)
  })

  it('records the three open decisions this module cannot resolve', () => {
    renderAs(ROOT)
    const copy = renderedCopy()
    for (const dec of ['DEC-JBSAUTH-001', 'DEC-EMEREND-001', 'DEC-CONSENT-001']) {
      expect(copy).toContain(dec)
    }
  })

  it('records that OBJ-SA-JBSSESSION enumerates no states, and draws none', () => {
    renderAs(ROOT)
    expect(renderedCopy()).toMatch(/OBJ-SA-JBSSESSION/)
    expect(
      UNSPECIFIED_IN_SOURCE.some((e) => /OBJ-SA-JBSSESSION/.test(e.what) || /OBJ-SA-JBSSESSION/.test(e.detail)),
    ).toBe(true)
  })
})
