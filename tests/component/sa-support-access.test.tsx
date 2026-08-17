import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { saModuleById } from '@/surfaces/sa/modules'
import { CRITICAL_ACTIONS } from '@/surfaces/sa/critical-actions'
import { SupportAccessScreen } from '../../app/super-admin/support-access/SupportAccessScreen'
import {
  BANNER_STATES,
  EMERGENCY_SESSION_STATES,
  EMERGENCY_TIME_BOX,
  SESSION_STATES,
  SUPPORT_ABSENT_CONTROLS,
  SUPPORT_PLATFORM_ROLES,
  SUPPORT_SESSIONS,
  SUPPORT_SOURCE_CONFLICTS,
  SUPPORT_UNSPECIFIED_IN_SOURCE,
  SUPPORT_WORKFLOWS,
  UNSPECIFIED_EMERGENCY_CLASS_VALUE,
  UNSPECIFIED_REASON_CLASS_VALUE,
} from '../../app/super-admin/support-access/fixtures'

const MODULE = saModuleById('MOD-SA-15')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/**
 * Every interactive element on the page. The ABSENT gates use it: an ABSENT
 * prohibition draws NO control, only a note. Prose that names a prohibited
 * idea is not a violation; a control that offers it is.
 */
function interactiveText(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('button, a, input, select, textarea, [role=switch], [role=button]'),
  ).map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`)
}

function region(name: RegExp): HTMLElement {
  return screen.getByRole('region', { name })
}

describe('MOD-SA-15 Support Access — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<SupportAccessScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-15 · Operations layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<SupportAccessScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates SCR-SA-21 and SCR-SA-22 without keying any route on a number', () => {
    const { container } = render(<SupportAccessScreen />)
    expect(screen.getAllByText(/SCR-SA-21/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/SCR-SA-22/).length).toBeGreaterThan(0)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  it('names none of the four forbidden words anywhere in its copy, for any role or state', () => {
    for (const role of SUPPORT_PLATFORM_ROLES) {
      const { container, unmount } = render(<SupportAccessScreen role={role.id} />)
      expect(container.textContent ?? '', role.id).not.toMatch(
        /tamper-evident|chained|signed|verified/i,
      )
      unmount()
    }
  })

  it('resolves every link to a console route, and never to record-level tenant content', () => {
    for (const role of SUPPORT_PLATFORM_ROLES) {
      const { container, unmount } = render(<SupportAccessScreen role={role.id} />)
      for (const el of Array.from(container.querySelectorAll('a[href]'))) {
        expect(el.getAttribute('href'), role.id).toMatch(/^\/super-admin\/[a-z-]*\/?$/)
      }
      unmount()
    }
  })

  it('offers no link out of a session row into the tenant it names', () => {
    render(<SupportAccessScreen />)
    const list = region(/Support session list/i)
    expect(list.querySelectorAll('a[href]')).toHaveLength(0)
    for (const row of SUPPORT_SESSIONS) {
      expect(within(list).getAllByText(row.tenantLabel).length).toBeGreaterThan(0)
    }
  })

  it('renders no metric below tenant-month and no rate anywhere', () => {
    const { container } = render(<SupportAccessScreen />)
    expect(container.textContent ?? '').not.toMatch(
      /\bper worker\b|\bby worker\b|per hour|per day|per week|actions\/|utilisation rate|throughput|\brate\b/i,
    )
  })
})

describe('MOD-SA-15 — read-only without exception (AC-SA-15-01, L45832)', () => {
  it('offers no write, repair or grant-write control to any role, including the root', () => {
    for (const role of SUPPORT_PLATFORM_ROLES) {
      const { container, unmount } = render(<SupportAccessScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `control offered to ${role.id}`).not.toMatch(
          /\bwrite\b|repair|\bedit\b|amend|grant the engineer/i,
        )
      }
      unmount()
    }
  })

  it('states that a data repair is not support, and renders the write grant as an absence', () => {
    render(<SupportAccessScreen />)
    const absences = region(/Controls that do not exist here/i)
    expect(within(absences).getByText(/a data repair is not support/i)).toBeDefined()
    expect(within(absences).getByText(/Grant the engineer write access/i)).toBeDefined()
    expect(absences.querySelectorAll('button')).toHaveLength(0)
    expect(absences.querySelectorAll('input, select, textarea')).toHaveLength(0)
  })

  it('names every absent control the source closes, each as a note rather than a disabled control', () => {
    render(<SupportAccessScreen />)
    const absences = region(/Controls that do not exist here/i)
    for (const control of SUPPORT_ABSENT_CONTROLS) {
      expect(within(absences).getByText(control.label)).toBeDefined()
    }
  })
})

describe('MOD-SA-15 — D18: no extension, no export from inside a session', () => {
  it('offers no extend and no export control to any role', () => {
    for (const role of SUPPORT_PLATFORM_ROLES) {
      const { container, unmount } = render(<SupportAccessScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `control offered to ${role.id}`).not.toMatch(/extend|export|download/i)
      }
      unmount()
    }
  })

  it('names both absences with their decision references', () => {
    render(<SupportAccessScreen />)
    const absences = region(/Controls that do not exist here/i)
    expect(within(absences).getByText(/DEC-SUPEXT-001/)).toBeDefined()
    expect(within(absences).getByText(/DEC-SUPEXP-001/)).toBeDefined()
    expect(within(absences).getByText(/a new session with a fresh reason/i)).toBeDefined()
  })
})

describe('MOD-SA-15 — D17: the Platform Engineer never enters tenant context', () => {
  it('draws no session-open form and no emergency form for the Platform Engineer', () => {
    const { container } = render(<SupportAccessScreen role="PLATFORM_ENGINEER" />)
    expect(screen.queryByRole('region', { name: /Open a support session/i })).toBeNull()
    for (const text of interactiveText(container)) {
      expect(text).not.toMatch(/open a support session|authorise|compliance-emergency session/i)
    }
  })

  it('renders the prohibition as an absence naming both sides of the conflict', () => {
    render(<SupportAccessScreen role="PLATFORM_ENGINEER" />)
    const note = region(/Platform Engineer/i)
    expect(within(note).getByText(/L20740/)).toBeDefined()
    expect(within(note).getByText(/L65401/)).toBeDefined()
    expect(note.querySelectorAll('button, input, select')).toHaveLength(0)
  })

  it('still lets the Platform Engineer read the session list — read is not the prohibition', () => {
    render(<SupportAccessScreen role="PLATFORM_ENGINEER" />)
    expect(region(/Support session list/i)).toBeDefined()
  })
})

describe('MOD-SA-15 — the ordering that prevents browse-first-justify-later (L45753)', () => {
  it('keeps the tenant selector inert until a ticket-linked reason class is selected', () => {
    render(<SupportAccessScreen role="SUPPORT" />)
    const form = region(/Open a support session/i)
    const tenant = within(form).getByLabelText(/Tenant/i)
    expect(tenant.hasAttribute('disabled')).toBe(true)

    fireEvent.change(within(form).getByLabelText(/reason class/i), {
      target: { value: UNSPECIFIED_REASON_CLASS_VALUE },
    })
    expect(within(form).getByLabelText(/Tenant/i).hasAttribute('disabled')).toBe(false)
  })

  it('invents no reason class: the only selectable option names its own absence', () => {
    render(<SupportAccessScreen role="SUPPORT" />)
    const form = region(/Open a support session/i)
    const select = within(form).getByLabelText(/reason class/i)
    const labels = Array.from(select.querySelectorAll('option')).map((o) => o.textContent ?? '')
    expect(labels).toHaveLength(2)
    expect(labels.join(' ')).toMatch(/never enumerat/i)
    expect(labels.join(' ')).not.toMatch(/billing|incident|onboarding|defect|investigation/i)
  })

  it('refuses to open a session without a ticket reference (AC-SA-15-02)', () => {
    render(<SupportAccessScreen role="SUPPORT" />)
    const form = region(/Open a support session/i)
    const open = within(form).getByRole('button', { name: /Open a support session/i })
    expect(open.getAttribute('aria-disabled')).toBe('true')
    expect(within(form).getAllByText(/ticket reference/i).length).toBeGreaterThan(0)
  })

  it('opens the session only once reason class, tenant and ticket are all supplied', () => {
    render(<SupportAccessScreen role="SUPPORT" />)
    const form = region(/Open a support session/i)
    fireEvent.change(within(form).getByLabelText(/reason class/i), {
      target: { value: UNSPECIFIED_REASON_CLASS_VALUE },
    })
    fireEvent.change(within(form).getByLabelText(/Tenant/i), { target: { value: 'TEN-BRIGHT' } })
    fireEvent.change(within(form).getByLabelText(/ticket reference/i), {
      target: { value: 'TKT-4471' },
    })
    const open = within(form).getByRole('button', { name: /Open a support session/i })
    expect(open.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(open)
    expect(screen.getByText(/session requested/i)).toBeDefined()
  })

  it('renders the two-hour default time box as a stated default, not an editable field', () => {
    render(<SupportAccessScreen role="SUPPORT" />)
    const form = region(/Open a support session/i)
    expect(within(form).getByText(/Two hours/i)).toBeDefined()
    expect(within(form).queryByLabelText(/time box/i)).toBeNull()
  })
})

describe('MOD-SA-15 — per-control allowed roles, through evaluateAccess', () => {
  it('gives all four platform roles the read of the session list', () => {
    for (const role of SUPPORT_PLATFORM_ROLES) {
      const { unmount } = render(<SupportAccessScreen role={role.id} />)
      expect(region(/Support session list/i), role.id).toBeDefined()
      unmount()
    }
  })

  it('offers the session-open form to root, Admin and Support', () => {
    for (const role of ['ROOT_SUPER_ADMIN', 'ADMIN', 'SUPPORT'] as const) {
      const { unmount } = render(<SupportAccessScreen role={role} />)
      expect(region(/Open a support session/i), role).toBeDefined()
      unmount()
    }
  })

  it('shows Support the emergency form but refuses it the authorisation, with the reason named', () => {
    render(<SupportAccessScreen role="SUPPORT" />)
    const form = region(/Compliance-emergency/i)
    const rootSlot = within(form).getByRole('button', { name: /Authorise as the Root Super Admin/i })
    expect(rootSlot.getAttribute('aria-disabled')).toBe('true')
    const adminSlot = within(form).getByRole('button', { name: /Authorise as the platform Admin/i })
    expect(adminSlot.getAttribute('aria-disabled')).toBe('true')
  })

  it('lets the root fill only the root slot, and the Admin only the Admin slot', () => {
    const rootView = render(<SupportAccessScreen role="ROOT_SUPER_ADMIN" />)
    const rootForm = region(/Compliance-emergency/i)
    expect(
      within(rootForm)
        .getByRole('button', { name: /Authorise as the Root Super Admin/i })
        .getAttribute('aria-disabled'),
    ).toBeNull()
    expect(
      within(rootForm)
        .getByRole('button', { name: /Authorise as the platform Admin/i })
        .getAttribute('aria-disabled'),
    ).toBe('true')
    rootView.unmount()

    render(<SupportAccessScreen role="ADMIN" />)
    const adminForm = region(/Compliance-emergency/i)
    expect(
      within(adminForm)
        .getByRole('button', { name: /Authorise as the platform Admin/i })
        .getAttribute('aria-disabled'),
    ).toBeNull()
    expect(
      within(adminForm)
        .getByRole('button', { name: /Authorise as the Root Super Admin/i })
        .getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('cannot be initiated by one person: one filled slot never opens the session (AC-SA-15-07)', () => {
    render(<SupportAccessScreen role="ROOT_SUPER_ADMIN" />)
    const form = region(/Compliance-emergency/i)
    fireEvent.click(within(form).getByRole('button', { name: /Authorise as the Root Super Admin/i }))
    expect(within(form).getByText(/one of two authorisations/i)).toBeDefined()
    expect(
      within(form)
        .getByRole('button', { name: /Open the compliance-emergency session/i })
        .getAttribute('aria-disabled'),
    ).toBe('true')
  })
})

describe('MOD-SA-15 — D19: the emergency time box is required and unset', () => {
  it('renders the time box as not yet set, referencing DEC-SEC-017', () => {
    render(<SupportAccessScreen role="ROOT_SUPER_ADMIN" />)
    const form = region(/Compliance-emergency/i)
    expect(
      within(form).getAllByText(new RegExp(EMERGENCY_TIME_BOX.replace(/[—]/g, '.'))).length,
    ).toBeGreaterThan(0)
    expect(within(form).getAllByText(/DEC-SEC-017/).length).toBeGreaterThan(0)
  })

  it('keeps the Open control inactive while the time box has no value', () => {
    render(<SupportAccessScreen role="ROOT_SUPER_ADMIN" />)
    const form = region(/Compliance-emergency/i)
    fireEvent.change(within(form).getByLabelText(/emergency class/i), {
      target: { value: UNSPECIFIED_EMERGENCY_CLASS_VALUE },
    })
    fireEvent.change(within(form).getByLabelText(/declared scope/i), {
      target: { value: 'One tenant, one Job record' },
    })
    fireEvent.click(within(form).getByRole('button', { name: /Authorise as the Root Super Admin/i }))
    expect(
      within(form)
        .getByRole('button', { name: /Open the compliance-emergency session/i })
        .getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('renders the post-session report as automatic, and its suppression as an absence', () => {
    render(<SupportAccessScreen role="ROOT_SUPER_ADMIN" />)
    const absences = region(/Controls that do not exist here/i)
    expect(within(absences).getByText(/Suppress the tenant post-session report/i)).toBeDefined()
  })
})

describe('MOD-SA-15 — the tenant ends it, and no banner means no session', () => {
  it('mirrors the tenant End-session control into the session detail, inert with its reason', () => {
    render(<SupportAccessScreen />)
    const detail = region(/Session detail/i)
    const end = within(detail).getByRole('button', { name: /End session/i })
    expect(end.getAttribute('aria-disabled')).toBe('true')
    expect(within(detail).getByText(/belongs to the tenant/i)).toBeDefined()
  })

  it('renders the banner state as a first-class field on the session detail', () => {
    render(<SupportAccessScreen />)
    const detail = region(/Session detail/i)
    expect(within(detail).getAllByText(/Tenant banner/i).length).toBeGreaterThan(0)
    expect(within(detail).getByText(/no read of tenant content/i)).toBeDefined()
  })

  it('carries a closed banner vocabulary and a closed session vocabulary', () => {
    expect(BANNER_STATES).toHaveLength(3)
    expect(SESSION_STATES).toHaveLength(8)
    expect(EMERGENCY_SESSION_STATES).toHaveLength(7)
  })

  it('states the mirroring obligation and points at the platform audit module, not a tenant record', () => {
    render(<SupportAccessScreen />)
    const mirror = region(/Mirrored into the tenant/i)
    expect(within(mirror).getAllByText(/Platform Access History/i).length).toBeGreaterThan(0)
    const links = Array.from(mirror.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'))
    for (const href of links) expect(href).toMatch(/^\/super-admin\/[a-z-]*\/?$/)
  })
})

describe('MOD-SA-15 — the twelve applicable screen states', () => {
  it('offers exactly the twelve, and never the frontline-only STATE-07', () => {
    render(<SupportAccessScreen />)
    const select = screen.getByLabelText(/Screen state/i)
    const values = Array.from(select.querySelectorAll('option')).map((o) => o.getAttribute('value'))
    expect(values).toHaveLength(12)
    expect(values).not.toContain('STATE-07')
  })

  it('renders every applicable state with its contract and its never-do', () => {
    for (const state of APPLICABLE_STATES) {
      const { unmount } = render(<SupportAccessScreen screenState={state.id} />)
      expect(screen.getByText(state.contract), state.id).toBeDefined()
      expect(screen.getByText(state.neverDo), state.id).toBeDefined()
      unmount()
    }
  })

  it('STATE-11: with every artificial-intelligence model unavailable the module stays operable', () => {
    render(<SupportAccessScreen role="SUPPORT" screenState="STATE-11" />)
    const form = region(/Open a support session/i)
    fireEvent.change(within(form).getByLabelText(/reason class/i), {
      target: { value: UNSPECIFIED_REASON_CLASS_VALUE },
    })
    fireEvent.change(within(form).getByLabelText(/Tenant/i), { target: { value: 'TEN-BRIGHT' } })
    fireEvent.change(within(form).getByLabelText(/ticket reference/i), {
      target: { value: 'TKT-4471' },
    })
    const open = within(form).getByRole('button', { name: /Open a support session/i })
    expect(open.getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(open)
    expect(screen.getByText(/session requested/i)).toBeDefined()
    expect(screen.getByText(/no part of this module depends on a model/i)).toBeDefined()
  })

  it('STATE-06 read-only: one banner, one cause, and the open control inert', () => {
    render(<SupportAccessScreen role="SUPPORT" screenState="STATE-06" />)
    const form = region(/Open a support session/i)
    expect(
      within(form)
        .getByRole('button', { name: /Open a support session/i })
        .getAttribute('aria-disabled'),
    ).toBe('true')
    expect(screen.getAllByText(/read-only in this state/i).length).toBeGreaterThan(0)
  })
})

describe('MOD-SA-15 — aggregates never render as zero or blank (AC-SA-01-03)', () => {
  it('renders an as-of timestamp with the session list', () => {
    render(<SupportAccessScreen />)
    const list = region(/Support session list/i)
    expect(within(list).getByText(/as of/i)).toBeDefined()
  })

  it('degrades to stale with its age under STATE-08', () => {
    render(<SupportAccessScreen screenState="STATE-08" />)
    const list = region(/Support session list/i)
    expect(within(list).getByText(/minutes old|hours old/i)).toBeDefined()
  })

  it('degrades to unavailable under STATE-12, and never to a count of zero', () => {
    render(<SupportAccessScreen screenState="STATE-12" />)
    const list = region(/Support session list/i)
    expect(within(list).getByText(/Unavailable/i)).toBeDefined()
    expect(list.textContent ?? '').not.toMatch(/\b0\b/)
  })

  it('renders a sentence, not a zero, when nothing has happened yet under STATE-01', () => {
    render(<SupportAccessScreen screenState="STATE-01" />)
    const list = region(/Support session list/i)
    expect(within(list).getByText(/No support session has been opened/i)).toBeDefined()
    expect(list.textContent ?? '').not.toMatch(/\b0\b/)
  })
})

describe('MOD-SA-15 — invariants are status chips, never controls', () => {
  it('renders the audit invariant as a chip with no control of any kind', () => {
    render(<SupportAccessScreen />)
    const panel = region(/Enforced invariant/i)
    expect(panel.querySelector('button')).toBeNull()
    expect(panel.querySelector('input')).toBeNull()
    expect(panel.querySelector('[role=switch]')).toBeNull()
    expect(panel.querySelector('[tabindex]')).toBeNull()
  })
})

describe('MOD-SA-15 — the class-badge rendering, and why it does not appear here', () => {
  it('holds no action from the eleven critical-class list, and says so rather than badging by taste', () => {
    render(<SupportAccessScreen />)
    const panel = region(/critical class/i)
    const names = CRITICAL_ACTIONS.map((a) => a.name)
    expect(names).toHaveLength(11)
    expect(within(panel).getByText(/none of the eleven/i)).toBeDefined()
  })
})

describe('MOD-SA-15 — what the source does not define', () => {
  it('names every unspecified affordance rather than inventing one', () => {
    render(<SupportAccessScreen />)
    const panel = region(/Unspecified in source/i)
    for (const item of SUPPORT_UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(item.affordance)).toBeDefined()
    }
    expect(within(panel).getAllByText(/reason class/i).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/emergency class/i).length).toBeGreaterThan(0)
  })

  it('records every conflict it resolved, with the resolution stated', () => {
    render(<SupportAccessScreen />)
    const panel = region(/Conflicts in the source/i)
    for (const conflict of SUPPORT_SOURCE_CONFLICTS) {
      expect(within(panel).getByText(conflict.topic)).toBeDefined()
    }
  })

  it('states how each workflow was matched to this module', () => {
    render(<SupportAccessScreen />)
    const panel = region(/Workflows this module renders/i)
    for (const wf of SUPPORT_WORKFLOWS) {
      expect(within(panel).getByText(wf.name)).toBeDefined()
    }
    expect(within(panel).getAllByText(/Matched by/i).length).toBe(SUPPORT_WORKFLOWS.length)
  })
})

describe('MOD-SA-15 — every state renders without a dead control', () => {
  it('leaves no button that is neither actionable nor carrying a stated reason', () => {
    for (const state of APPLICABLE_STATES) {
      for (const role of SUPPORT_PLATFORM_ROLES) {
        const { container, unmount } = render(
          <SupportAccessScreen role={role.id} screenState={state.id as ScreenStateId} />,
        )
        for (const btn of Array.from(container.querySelectorAll('button'))) {
          if (btn.getAttribute('aria-disabled') === 'true') {
            expect(btn.getAttribute('aria-describedby'), `${role.id}/${state.id}`).toBeTruthy()
          }
        }
        unmount()
      }
    }
  })
})
