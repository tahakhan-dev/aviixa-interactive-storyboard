import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { NotificationsScreen } from '../../app/hub/notifications/NotificationsScreen'
import {
  CONTROL_MATRIX,
  categoriesInGroup,
  doh10GroupPartition,
} from '@/surfaces/doh/modules/doh-10/matrix'
import { NOTIFICATION_STATES } from '@/domain/vocabularies'
import type { TenantRoleId } from '../../app/hub/HubShell'

/**
 * `SCR-DOH-19`, drawn.
 *
 * WHAT THIS FILE IS FOR, AND WHAT IT IS NOT. The unit suite proves the two
 * folds return the right answer. This one proves the SCREEN cannot draw a
 * control either fold did not return, and that the one control it does draw
 * actually writes something a reader can see. Those are different failures,
 * so the assertions below SWEEP the rendered document rather than checking
 * the controls the screen meant to draw.
 *
 * THE FOUR THAT REACH THE SCREEN. `HubShell` asks D11 at the route registry
 * before any child renders and the Worker holds no Hub route, so on this
 * route the Worker sees "Unavailable for the Worker view" and none of this
 * module's content reaches the document at all. Sweeping the Worker for
 * controls here would pass against an almost-empty page and read as
 * evidence; the Worker's real assertions are its own case below and the
 * fold's, in the unit suite.
 */

const REACHING: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
]
const SUSPENDED = ['soft-suspended', 'hard-suspended', 'compliance-suspended', 'archived']

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setTenantState(state: string): void {
  fireEvent.change(screen.getByLabelText(/^tenant state$/i), { target: { value: state } })
}

function kindOf(id: string): string | null {
  return (
    document
      .querySelector<HTMLElement>(`[data-testid="affordance-${id}"]`)
      ?.getAttribute('data-kind') ?? null
  )
}

/** Every button inside a matrix affordance cell. The chrome's is not ours. */
function affordanceButtons(): readonly HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-testid^="affordance-"] button')]
}

/** Every button inside a preference group of the given id. */
function groupButtons(group: string): readonly HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>(
      `[data-testid="preference-group-${group}"] button`,
    ),
  ]
}

function lockedControls(): readonly HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-testid="locked-control"]')]
}

/** The text `aria-describedby` really resolves to, not the text nearby. */
function describedByText(el: HTMLElement): string {
  const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  return ids
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ')
    .trim()
}

describe('the screen names itself and states what it does not claim', () => {
  it('carries the module id and the catalogue-B screen id, from the registry', () => {
    render(<NotificationsScreen />)
    // Derived, not printed as text: the shell reads `MOD-DOH-10`'s row and
    // `screenAnnotation` reads `SCR-DOH-19` out of `@/surfaces/doh/screens`.
    // This case used to assert a hand-written annotation string, which is what
    // a route carries when its module is not registered.
    expect(screen.getByText(/MOD-DOH-10 · SCR-DOH-19/)).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Notifications')
  })

  it('claims no registry gap and no missing rail, because there is neither', () => {
    render(<NotificationsScreen />)
    // THE INVERSION OF WHAT THIS CASE USED TO ASSERT, and it is the defect
    // it was pinning: it required "draws no rail entry" to appear TWICE on a
    // route the rail now offers. Both phrasings are refused here.
    expect(document.body.textContent).not.toMatch(/draws no rail entry/i)
    expect(document.body.textContent).not.toMatch(/not yet a row in the Hub module registry/i)
    // Non-vacuous: the rail is drawn on this route and offers this module.
    const rail = screen.getByRole('navigation', { name: 'Hub modules' })
    expect(within(rail).getByRole('link', { name: 'Notifications' })).toBeTruthy()
  })

  it('renders both catalogue rows, catalogue A by name and never by literal', () => {
    render(<NotificationsScreen />)
    expect(screen.getByText(/Roles that can open it: Tenant Admin\./)).toBeTruthy()
    expect(
      screen.getByText(/Primary role: Tenant Admin sets policy; each user sets preferences\./),
    ).toBeTruthy()
    expect(document.body.textContent).toContain('L26070')
    expect(/SCR-DOH-\d{3}/.test(document.body.textContent ?? '')).toBe(false)
  })
})

describe('the twelve matrix rows draw only what the fold returned', () => {
  it('renders one affordance cell per row for every reaching role', () => {
    render(<NotificationsScreen />)
    for (const role of REACHING) {
      viewAs(role)
      for (const row of CONTROL_MATRIX) {
        expect(kindOf(row.id), `${role}/${row.id}`).not.toBeNull()
      }
      expect(document.querySelectorAll('[data-testid^="affordance-"]')).toHaveLength(12)
    }
  })

  it('draws a button in a matrix cell only where the fold returned `control`', () => {
    render(<NotificationsScreen />)
    for (const role of REACHING) {
      viewAs(role)
      for (const state of ['active', ...SUSPENDED]) {
        setTenantState(state)
        const controls = CONTROL_MATRIX.filter((r) => kindOf(r.id) === 'control')
        expect(affordanceButtons(), `${role}/${state}`).toHaveLength(controls.length)
      }
      setTenantState('active')
    }
  })

  it('gives the Read-only Auditor no acknowledge control in any tenant state', () => {
    render(<NotificationsScreen />)
    viewAs('READONLY_AUDITOR')
    for (const state of ['active', ...SUSPENDED]) {
      setTenantState(state)
      expect(kindOf('acknowledge-a-notification'), state).toBe('absent')
      expect(
        screen.queryByRole('button', { name: /^Acknowledge a notification$/ }),
        state,
      ).toBeNull()
    }
    // The positive control: the token DOES produce a control for a role that
    // holds it, so the absence above is not an absence of the whole row.
    setTenantState('active')
    viewAs('SUPERVISOR')
    expect(kindOf('acknowledge-a-notification')).toBe('control')
    expect(screen.getByRole('button', { name: /^Acknowledge a notification$/ })).toBeTruthy()
  })

  it('closes the policy control in every suspension state and reopens it when active', () => {
    render(<NotificationsScreen />)
    viewAs('TENANT_ADMIN')
    expect(kindOf('set-notification-policy')).toBe('control')
    for (const state of SUSPENDED) {
      setTenantState(state)
      expect(kindOf('set-notification-policy'), state).toBe('absent')
      expect(
        screen.queryByRole('button', { name: /Set notification policy/ }),
        state,
      ).toBeNull()
    }
    setTenantState('active')
    expect(kindOf('set-notification-policy')).toBe('control')
  })

  /**
   * SCOPED TO THIS MODULE'S OWN CONTENT, AND THE FIRST DRAFT WAS NOT.
   * An unscoped "no `aria-disabled` anywhere on this route" sweep is RED on
   * the shipped tree, and correctly so: `HubShell`'s own suspension-banner
   * End-session control is a `Button` with a `disabledReason`, which is
   * exactly what `aria-disabled` is for — a widget that exists and declines.
   * It appears under `compliance-suspended` on every Hub route. A gate that
   * forbids the mechanism rather than the misuse of it would have convicted
   * the chrome for doing the right thing, so this one asks the question about
   * the regions this module draws.
   */
  it('renders no `aria-disabled` in any of this module’s own regions', () => {
    render(<NotificationsScreen />)
    const ownRegions = () => [
      ...document.querySelectorAll<HTMLElement>('[data-testid^="affordance-"]'),
      ...document.querySelectorAll<HTMLElement>('[data-testid^="preference-group-"]'),
    ]
    for (const role of REACHING) {
      viewAs(role)
      for (const state of ['active', ...SUSPENDED]) {
        setTenantState(state)
        const regions = ownRegions()
        // Non-vacuous: the regions exist and are populated before they are
        // swept for a thing they must not contain.
        expect(regions.length, `${role}/${state} rendered no region to sweep`).toBe(15)
        for (const region of regions) {
          expect(
            region.querySelectorAll('[aria-disabled], button[disabled], input[disabled]'),
            `${role}/${state} draws a disabled control in ${region.getAttribute('data-testid')}`,
          ).toHaveLength(0)
        }
      }
      setTenantState('active')
    }
  })

  it('confirms the one `aria-disabled` on this route belongs to the shell, not here', () => {
    render(<NotificationsScreen />)
    viewAs('TENANT_ADMIN')
    setTenantState('active')
    expect(document.querySelectorAll('[aria-disabled]')).toHaveLength(0)
    setTenantState('compliance-suspended')
    const disabled = [...document.querySelectorAll<HTMLElement>('[aria-disabled]')]
    expect(disabled).toHaveLength(1)
    // It is the chrome's End-session control, outside every region above.
    expect(disabled[0]!.closest('[data-testid^="affordance-"]')).toBeNull()
    expect(disabled[0]!.closest('[data-testid^="preference-group-"]')).toBeNull()
  })
})

describe('the Worker never reaches this route’s content', () => {
  it('meets the shell’s refusal and none of the module’s rows', () => {
    render(<NotificationsScreen />)
    viewAs('WORKER')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Unavailable for the Worker view',
    )
    expect(document.querySelectorAll('[data-testid^="affordance-"]')).toHaveLength(0)
    expect(document.querySelectorAll('[data-testid="locked-control"]')).toHaveLength(0)
    // The positive control: switching back brings the content, so the two
    // absences above are the shell withholding rather than a broken render.
    viewAs('TENANT_ADMIN')
    expect(document.querySelectorAll('[data-testid^="affordance-"]')).toHaveLength(12)
  })
})

describe('the three preference groups, and the two that carry no operable control', () => {
  it('draws every one of the eighty-seven categories in exactly one group', () => {
    render(<NotificationsScreen />)
    const partition = doh10GroupPartition()
    expect(
      document.querySelectorAll('[data-testid="preference-group-always-sent"] li'),
    ).toHaveLength(partition.alwaysSent)
    expect(
      document.querySelectorAll('[data-testid="preference-group-protected"] li'),
    ).toHaveLength(partition.protectedGroup)
    expect(
      document.querySelectorAll('[data-testid="preference-group-configurable"] li'),
    ).toHaveLength(partition.configurable)
    expect(document.querySelectorAll('[data-group]')).toHaveLength(partition.total)
    expect(partition).toEqual({
      alwaysSent: 12,
      protectedGroup: 34,
      configurable: 41,
      total: 87,
    })
  })

  it('draws NO button in the two locked groups, for any persona', () => {
    render(<NotificationsScreen />)
    for (const role of REACHING) {
      viewAs(role)
      expect(groupButtons('always-sent'), role).toHaveLength(0)
      expect(groupButtons('protected'), role).toHaveLength(0)
    }
    // The positive control the absence loop needs: the configurable group DOES
    // draw buttons for three of the four, so the two loops above are not
    // passing over an unrendered region.
    viewAs('TENANT_ADMIN')
    expect(groupButtons('configurable')).toHaveLength(41)
  })

  it('gives every locked control a reason that resolves in the accessibility tree', () => {
    render(<NotificationsScreen />)
    viewAs('TENANT_ADMIN')
    const locked = lockedControls()
    // 12 always sent + 34 protected. The Tenant Admin's configurable group is
    // toggles, so the count is exactly the two locked groups.
    expect(locked).toHaveLength(46)
    for (const el of locked) {
      expect(el.getAttribute('role')).toBe('group')
      expect(el.getAttribute('tabindex')).toBe('0')
      expect(el.hasAttribute('aria-disabled')).toBe(false)
      expect(el.querySelectorAll('button, input, [contenteditable]')).toHaveLength(0)
      const labelId = el.getAttribute('aria-labelledby') ?? ''
      expect(document.getElementById(labelId)?.textContent?.trim()).not.toBe('')
      expect(describedByText(el).length, el.getAttribute('data-locked-control') ?? '')
        .toBeGreaterThan(20)
    }
  })

  it('separates the two locked groups by whether anything remains changeable', () => {
    render(<NotificationsScreen />)
    viewAs('TENANT_ADMIN')
    const always = categoriesInGroup('always-sent')[0]!
    const prot = categoriesInGroup('protected')[0]!
    const alwaysEl = document.querySelector<HTMLElement>(`[data-locked-control="ch30c2-${always.id}"]`)!
    const protEl = document.querySelector<HTMLElement>(`[data-locked-control="ch30c2-${prot.id}"]`)!
    expect((alwaysEl.getAttribute('aria-describedby') ?? '').split(/\s+/)).toHaveLength(1)
    expect((protEl.getAttribute('aria-describedby') ?? '').split(/\s+/)).toHaveLength(2)
    expect(describedByText(protEl)).toContain('What you may still change')
    expect(describedByText(alwaysEl)).not.toContain('What you may still change')
  })

  it('locks the Read-only Auditor out of the Configurable group with both criteria named', () => {
    render(<NotificationsScreen />)
    viewAs('READONLY_AUDITOR')
    expect(groupButtons('configurable')).toHaveLength(0)
    expect(lockedControls()).toHaveLength(87)
    const first = categoriesInGroup('configurable')[0]!
    const el = document.querySelector<HTMLElement>(`[data-locked-control="ch30c2-${first.id}"]`)!
    const reason = describedByText(el)
    expect(reason).toContain('AC-AUTH-003')
    expect(reason).toContain('AC-DOH-011-2')
    expect(reason).toContain('L28690')
  })

  it('prints no severity anywhere without its Recommendation — R&D label beside it', () => {
    render(<NotificationsScreen />)
    viewAs('TENANT_ADMIN')
    const lines = [
      ...document.querySelectorAll<HTMLElement>('[data-group="configurable"] p'),
    ].map((p) => p.textContent ?? '')
    const withSeverity = lines.filter((t) => /Recommended severity/.test(t))
    // Non-vacuous: there are as many severity lines as configurable rows.
    expect(withSeverity).toHaveLength(41)
    for (const line of withSeverity) {
      expect(line).toContain('Recommendation — R&D')
      expect(line).toContain('DEC-NOTIFSEV-001')
    }
  })
})

describe('the one control that writes — before-state, activation, result, evidence', () => {
  it('flips one category, reads the new state back three ways, and flips it again', () => {
    render(<NotificationsScreen />)
    viewAs('TENANT_ADMIN')
    const category = categoriesInGroup('configurable')[0]!
    const row = () => document.querySelector<HTMLElement>(`[data-testid="preference-${category.id}"]`)!
    const readout = () =>
      document.querySelector<HTMLElement>('[data-testid="email-suppression-readout"]')!
        .textContent ?? ''
    const trail = () =>
      [
        ...document.querySelectorAll<HTMLElement>('[data-testid="preference-audit-trail"] li'),
      ].map((li) => li.textContent ?? '')

    // BEFORE. All three readers agree, and the readout is not merely present.
    expect(row().getAttribute('data-email')).toBe('on')
    expect(readout()).toContain('Email suppressed on 0 of 41')
    expect(readout()).toContain('Nothing is suppressed.')
    expect(trail()).toHaveLength(0)

    // ACTIVATION.
    fireEvent.click(screen.getByRole('button', { name: `Suppress email for ${category.id}` }))

    // AFTER — the typed result, read back rather than assumed.
    expect(row().getAttribute('data-email')).toBe('suppressed')
    expect(readout()).toContain('Email suppressed on 1 of 41')
    expect(readout()).toContain(`Suppressed: ${category.id}.`)
    // EVIDENCE — the audit event L73685 requires, rendered.
    expect(trail()).toHaveLength(1)
    expect(trail()[0]).toContain(`Email suppressed on ${category.id}`)
    expect(trail()[0]).toContain('TENANT_ADMIN')
    // And the label really changed, so the control is not a one-way switch.
    expect(
      screen.getByRole('button', { name: `Restore email for ${category.id}` }),
    ).toBeTruthy()

    // AND BACK.
    fireEvent.click(screen.getByRole('button', { name: `Restore email for ${category.id}` }))
    expect(row().getAttribute('data-email')).toBe('on')
    expect(readout()).toContain('Email suppressed on 0 of 41')
    expect(trail()).toHaveLength(2)
    expect(trail()[1]).toContain(`Email restored on ${category.id}`)
  })

  it('touches no other category, so the state is per key and not a screen flag', () => {
    render(<NotificationsScreen />)
    viewAs('TENANT_ADMIN')
    const [first, second] = categoriesInGroup('configurable')
    fireEvent.click(screen.getByRole('button', { name: `Suppress email for ${first!.id}` }))
    expect(
      document
        .querySelector<HTMLElement>(`[data-testid="preference-${second!.id}"]`)!
        .getAttribute('data-email'),
    ).toBe('on')
    expect(
      [...document.querySelectorAll('[data-email="suppressed"]')],
    ).toHaveLength(1)
  })

  it('leaves the locked categories with no `data-email` setting to write at all', () => {
    render(<NotificationsScreen />)
    viewAs('TENANT_ADMIN')
    for (const group of ['always-sent', 'protected'] as const) {
      const values = [
        ...document.querySelectorAll<HTMLElement>(`[data-group="${group}"]`),
      ].map((el) => el.getAttribute('data-email'))
      expect(new Set(values)).toEqual(new Set(['not-a-setting-here']))
    }
  })
})

describe('the counted claims are the ones the screen prints', () => {
  it('prints the preference-matrix tally it measures rather than a quoted one', () => {
    render(<NotificationsScreen />)
    const text = document.body.textContent ?? ''
    expect(text).toContain('4 data rows and 5 permission columns, 20 cells')
    expect(text).toContain('11 of them read a bare')
    expect(text).toContain('1 column is bare in every cell')
    expect(text).toContain('2 are a prohibition in every cell')
    expect(text).toContain('May disable a mandatory family; May disable a protected category')
  })

  it('carries the Derived Clarification label wherever the eighty-seven renders', () => {
    render(<NotificationsScreen />)
    const text = document.body.textContent ?? ''
    expect(text).toContain('12 always sent, 34 protected, 41 configurable, 87 in total')
    expect(text).toContain('87 and the thirteen-family organisation')
    expect(text).toContain('Derived Clarification')
    expect(text).toContain('DEC-NOTIFCOUNT-001')
    // No per-class figure, which is the one count in the section that does
    // not reconcile with its own catalogue.
    expect(text).toContain('No per-class figure is shown')
  })

  it('names the four double-claimed identifiers and the two register sizes', () => {
    render(<NotificationsScreen />)
    const text = document.body.textContent ?? ''
    expect(text).toContain('38 identifiers at L73676')
    expect(text).toContain('NOTIF-020, NOTIF-021, NOTIF-022, NOTIF-023')
    expect(text).toContain('25 rows against 87')
    expect(text).toContain('agree on the name of none of the 25 overlapping identifiers')
  })

  it('lists all nineteen notification states without folding any of them', () => {
    render(<NotificationsScreen />)
    const listed = [
      ...document.querySelectorAll<HTMLElement>('[data-testid="notification-states"] code'),
    ].map((c) => c.textContent)
    expect(listed).toEqual([...NOTIFICATION_STATES])
    expect(listed).toHaveLength(19)
    expect(document.body.textContent).toContain(
      'Sending is not delivery; delivery is not opening; opening is not acknowledgement; acknowledgement is not the business action.',
    )
  })
})

describe('the open decisions are cited by the one component that renders them', () => {
  it('renders four disclosures and writes no fifth wording of its own', () => {
    render(<NotificationsScreen />)
    const notes = [...document.querySelectorAll<HTMLElement>('[role="note"]')].map(
      (n) => n.getAttribute('aria-label') ?? '',
    )
    for (const id of [
      'DEC-NOTIFPREF-001',
      'DEC-NOTIFCOUNT-001',
      'DEC-NOTIFSEV-001',
      'DEC-NOTIFACK-001',
    ]) {
      expect(notes).toContain(`Open decision ${id}`)
    }
    expect(notes.filter((n) => n.startsWith('Open decision'))).toHaveLength(4)
  })

  it('states the abstention on DEC-NOTIFPRI-001 rather than leaving it absent', () => {
    render(<NotificationsScreen />)
    const notes = [...document.querySelectorAll<HTMLElement>('[role="note"]')].map(
      (n) => n.getAttribute('aria-label') ?? '',
    )
    expect(notes).not.toContain('Open decision DEC-NOTIFPRI-001')
    expect(
      screen.getByText(/DEC-NOTIFPRI-001 is deliberately not rendered here/),
    ).toBeTruthy()
    expect(document.body.textContent).toContain('this screen draws no priority')
  })

  it('renders all nine findings with a grade and a locator each', () => {
    render(<NotificationsScreen />)
    expect(document.querySelectorAll('[data-testid^="finding-"]')).toHaveLength(9)
    expect(
      document.querySelector('[data-testid="finding-categorical-to-absent-inverts-the-preferences-screen"]'),
    ).not.toBeNull()
    expect(document.querySelector('[data-testid="finding-read-only-on-a-write-act"]')).not.toBeNull()
    expect(
      document.querySelector('[data-testid="finding-readonly-auditor-holds-two-writes"]'),
    ).not.toBeNull()
  })
})
