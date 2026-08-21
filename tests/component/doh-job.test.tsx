import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import { JobLifecycleScreen } from '../../app/hub/job-lifecycle-and-approval/JobLifecycleScreen'
import { JobApprovalQueueScreen } from '../../app/hub/job-approval-queue/JobApprovalQueueScreen'
import {
  MOD_DOH_05_ACTS,
  MOD_DOH_05_MATRIX,
  doh05Row,
} from '@/surfaces/doh/modules/doh-05/matrix'
import { SEEDED_JOBS } from '@/surfaces/doh/modules/doh-05/jobs'

/**
 * `MOD-DOH-05` across both of its routes.
 *
 * The unit suite proves the derivations. This one proves what a person
 * actually meets: that both halves of the two-status cell reach the screen as
 * two separate controls, that the row the source restates draws nothing, that
 * the adjacent row draws nothing — not even a disabled control — and that the
 * panel of Jobs you may not act on lists them and offers no way to act.
 */

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function region(name: string | RegExp): HTMLElement {
  return screen.getByRole('region', { name })
}

describe('the Job list and editor route', () => {
  it('renders the whole fourteen-row matrix, once, on this route', () => {
    render(<JobLifecycleScreen />)
    const table = within(region('Control matrix')).getByRole('table')
    // Header row plus fourteen. The matrix is not split across the module's
    // two routes: this is the only place it renders in full.
    expect(within(table).getAllByRole('row')).toHaveLength(MOD_DOH_05_MATRIX.length + 1)
    for (const row of MOD_DOH_05_MATRIX) {
      expect(within(table).getByText(new RegExp(`${row.ordinal}\\. ${row.control}`))).toBeTruthy()
    }
  })

  it('lists every seeded Job with its parent-node binding and its owner', () => {
    render(<JobLifecycleScreen />)
    const list = within(region('Job list')).getByRole('table')
    for (const job of SEEDED_JOBS) {
      expect(within(list).getByText(job.record.name)).toBeTruthy()
      expect(within(list).getAllByText(job.record.parentNodeId).length).toBeGreaterThan(0)
    }
  })

  it('shows the archival-cascade pause as derived rather than as a fifth state', () => {
    render(<JobLifecycleScreen />)
    const note = screen.getByTestId('derived-cascade-pause')
    expect(note.textContent).toMatch(/Derived, not stored/)
    // The Job's own state is still printed as active beside the pause.
    expect(note.textContent).toMatch(/still active/)
  })

  it('states the adopted position on DEC-AREA-001 and never calls it a SoW fact', () => {
    render(<JobLifecycleScreen />)
    const panel = screen.getByTestId('dec-area-001-position')
    expect(panel.textContent).toMatch(/Derived Clarification — adopted working position/)
    expect(panel.textContent).toMatch(/never SoW Fact/)
    expect(panel.textContent).toMatch(/Outstanding/)
  })

  it('ships the seeded taxonomy catalogue empty and names none of the sixteen', () => {
    render(<JobLifecycleScreen />)
    expect(screen.getByTestId('seeded-catalogue-empty').textContent).toMatch(
      /holds 0 Job Types and 0 Service Type tags/,
    )
    // The open decision renders through the shared canon component, so a Hub
    // reader and a Studio reader see the identical wording and locators.
    expect(screen.getByRole('note', { name: /Open decision DEC-TAX-002/ })).toBeTruthy()
  })

  it('renders the version panel’s cross-surface statement with no editing affordance', () => {
    render(<JobLifecycleScreen />)
    const statement = screen.getByTestId('cross-surface-statement')
    expect(statement.getAttribute('data-boundary')).toBe('workflow-and-instruction-authoring')
    expect(within(statement).queryAllByRole('button')).toEqual([])
    expect(within(statement).queryAllByRole('textbox')).toEqual([])
  })
})

describe('row 11 — the two-status cell reaches the screen as two controls', () => {
  it('prints both statuses in the Quality Manager cell', () => {
    render(<JobLifecycleScreen />)
    const cell = screen.getByTestId('two-status-cell-QUALITY_MANAGER')
    expect(cell.textContent).toMatch(/Explicitly prohibited/)
    expect(cell.textContent).toMatch(/Allowed/)
    expect(cell.textContent).toMatch(/for proposing/)
    expect(cell.textContent).toMatch(/for approving/)
  })

  it('gives the Quality Manager the approve control and withholds the propose control', () => {
    render(<JobLifecycleScreen />)
    viewAs('QUALITY_MANAGER')
    const recurrence = screen.getByRole('heading', { name: 'Recurrence' }).parentElement!
    // The approve half is offered.
    const approve = within(recurrence).getByRole('button', {
      name: 'Approve the proposed recurrence',
    })
    expect(approve.hasAttribute('disabled')).toBe(false)
    // The propose half is not drawn at all — a disabled propose control would
    // imply a condition that could become true for this role, and it cannot.
    expect(
      within(recurrence).queryByRole('button', { name: 'Propose a recurrence change' }),
    ).toBeNull()
  })

  it('gives the Supervisor the propose control and withholds the approve control', () => {
    render(<JobLifecycleScreen />)
    viewAs('SUPERVISOR')
    const recurrence = screen.getByRole('heading', { name: 'Recurrence' }).parentElement!
    expect(
      within(recurrence).getByRole('button', { name: 'Propose a recurrence change' }),
    ).toBeTruthy()
    expect(
      within(recurrence).queryByRole('button', { name: 'Approve the proposed recurrence' }),
    ).toBeNull()
  })

  it('says on screen why one cell became two controls', () => {
    render(<JobLifecycleScreen />)
    expect(screen.getByTestId('two-acts-one-cell').textContent).toMatch(
      /two statuses in one cell/,
    )
  })
})

describe('row 5 and row 8 draw nothing, and say so', () => {
  it('marks row 5 a restatement and offers no control anywhere for it', () => {
    render(<JobLifecycleScreen />)
    const note = screen.getByTestId('restatement-not-an-act')
    expect(note.textContent).toMatch(/A restatement, not a second act/)
    expect(note.textContent).toMatch(/row 4/)
    // No control on either route bears its name. NOT THE LOAD-BEARING CHECK,
    // and saying so is cheaper than letting it read as one: the screens name
    // the acts they draw, so a row wrongly promoted to an act is never
    // mentioned here and this assertion stays green over a matrix that has
    // grown a capability nobody holds. The reachable version is the
    // drawn-set-against-derived-set gate in `tests/unit/doh-job.test.ts`,
    // which goes red on exactly that mutation.
    expect(
      screen.queryByRole('button', { name: /Approve a Job the same identity created/ }),
    ).toBeNull()
    expect(MOD_DOH_05_ACTS.map((a) => a.rowId)).not.toContain(
      'approve-a-job-the-same-identity-created',
    )
  })

  it('states row 8 as met elsewhere and draws no control, disabled or otherwise', () => {
    render(<JobLifecycleScreen />)
    const panel = screen.getByTestId('row-8-met-elsewhere')
    expect(panel.textContent).toMatch(/maintained in the tenant administration area/)
    expect(within(panel).queryAllByRole('button')).toEqual([])
    expect(within(panel).queryAllByRole('link')).toEqual([])
    // The permissive token is still printed in the matrix; what is refused is
    // the control, not the source's own word.
    expect(doh05Row('maintain-the-tag-to-qualification-set-mapping').status.TENANT_ADMIN).toBe(
      'allowed-with-conditions',
    )
  })
})

describe('row 10 — the version-adoption control follows the Job’s owner field', () => {
  it('offers the decision to the owner and to nobody else', () => {
    render(<JobLifecycleScreen />)
    viewAs('SUPERVISOR') // Sam owns JOB-BRAKECHECK, the selected Job
    const panel = screen.getByRole('heading', { name: 'Workflow version' }).parentElement!
    expect(
      within(panel).getByRole('button', { name: 'Adopt this version on this Job' }),
    ).toBeTruthy()

    viewAs('QUALITY_MANAGER')
    const asQm = screen.getByRole('heading', { name: 'Workflow version' }).parentElement!
    expect(
      within(asQm).queryByRole('button', { name: 'Adopt this version on this Job' }),
    ).toBeNull()
    expect(asQm.textContent).toMatch(/Job Owner is a field on the Job record/)
  })
})

describe('the Job approval queue route', () => {
  it('lists a Job the viewer did not create with a live Approve control', () => {
    render(<JobApprovalQueueScreen />)
    const queue = within(region('Awaiting your decision')).getByRole('table')
    expect(within(queue).getByText('Red bike frame assembly')).toBeTruthy()
    const approve = within(queue).getByRole('button', { name: 'Approve' })
    expect(approve.hasAttribute('disabled')).toBe(false)
  })

  it('holds the viewer’s own Job out of that queue entirely', () => {
    render(<JobApprovalQueueScreen />)
    const queue = within(region('Awaiting your decision')).getByRole('table')
    expect(within(queue).queryByText('Wheel truing, night shift')).toBeNull()
  })

  it('lists it in the panel that carries no decision control', () => {
    render(<JobApprovalQueueScreen />)
    const panel = region(/Awaiting another approver/)
    expect(within(panel).getByText('Wheel truing, night shift')).toBeTruthy()
    // The panel is the point: listed, named, and nothing to press.
    expect(within(panel).queryAllByRole('button')).toEqual([])
    expect(within(panel).getAllByTestId('no-decision-control').length).toBe(1)
  })

  it('names the creator prominently, because that is the governance fact here', () => {
    render(<JobApprovalQueueScreen />)
    const queue = within(region('Awaiting your decision')).getByRole('table')
    expect(within(queue).getByText('Sam (Supervisor)')).toBeTruthy()
  })

  it('renders row 4’s escape clause for the Tenant Admin and draws no Approve control', () => {
    render(<JobApprovalQueueScreen />)
    viewAs('TENANT_ADMIN')
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull()
    const escape = screen.getByTestId('prohibition-with-an-escape')
    expect(escape.textContent).toMatch(
      /unless the Tenant Admin also holds an approver role and did not create it/,
    )
    expect(escape.textContent).toMatch(/two tenant roles at once/)
  })

  it('renders row 5 as the reason attached to row 4, not as a row anybody can act on', () => {
    render(<JobApprovalQueueScreen />)
    const note = screen.getByTestId('row-5-is-a-restatement')
    expect(note.textContent).toMatch(/not a second act/)
    expect(note.textContent).toMatch(/routed to a second qualified approver|second act/)
  })

  it('links to the route that holds the matrix rather than restating it', () => {
    render(<JobApprovalQueueScreen />)
    expect(within(region('What this queue is')).getByRole('link', { name: /Job list and editor/ }))
      .toBeTruthy()
    // No second copy of the matrix on this route.
    expect(screen.queryByRole('region', { name: 'Control matrix' })).toBeNull()
  })

  it('refuses the Supervisor with a reason they can read, rather than withholding the route', () => {
    render(<JobApprovalQueueScreen />)
    viewAs('SUPERVISOR')
    // No cell on row 4 marks the Supervisor Unavailable, so the route opens
    // and the refusal is met on the screen rather than at the rail.
    expect(screen.getByRole('heading', { level: 1, name: /Job approval queue/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull()
  })

  it('draws nothing for either categorically refused role, in either spelling', () => {
    // The two roles are refused by DIFFERENT reason codes at the same stage —
    // EXPLICIT_DENY for the Supervisor, ROLE_NOT_GRANTED for the Tenant Admin
    // — and both mean the same thing to a reader. Keying the rendering on the
    // reason code drew a disabled Approve for one and nothing for the other;
    // this is the assertion that caught it and holds it fixed.
    for (const role of ['SUPERVISOR', 'TENANT_ADMIN', 'READONLY_AUDITOR']) {
      render(<JobApprovalQueueScreen />)
      viewAs(role)
      expect(screen.queryByRole('button', { name: 'Approve' }), role).toBeNull()
      cleanup()
    }
  })
})

describe('the Worker meets the surface’s refusal, not this module’s', () => {
  it('renders no module content at all for the Worker on either route', () => {
    render(<JobLifecycleScreen />)
    viewAs('WORKER')
    expect(screen.queryByRole('region', { name: 'Control matrix' })).toBeNull()
    expect(screen.getByRole('heading', { name: /Unavailable for the Worker view/ })).toBeTruthy()
  })
})
