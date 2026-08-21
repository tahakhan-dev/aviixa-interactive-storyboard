import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { WorkerAssignmentScreen } from '../../app/hub/worker-assignment/WorkerAssignmentScreen'
import {
  CANDIDATE_WORKERS,
  CONCURRENCY_FOOTER,
  POSTURE_COPY,
} from '../../app/hub/worker-assignment/fixtures'
import {
  CONTROL_MATRIX,
  DEFERRAL_RENDERING,
  TENANT_ROLES,
} from '@/surfaces/doh/modules/doh-07/matrix'
import { ABSENCE_NOTES } from '@/surfaces/doh/modules/doh-07/rulings'
import type { TenantRoleId } from '../../app/hub/HubShell'

function selectRole(roleId: TenantRoleId): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setPosture(value: 'strict' | 'notify-only'): void {
  fireEvent.change(screen.getByLabelText(/tenant gate posture/i), { target: { value } })
}

/** Every `<button>`, `<input>`, `<select>` and `<textarea>` on the page. */
function everyControl(container: HTMLElement): readonly Element[] {
  return [...container.querySelectorAll('button, input, select, textarea')]
}

describe('SCR-DOH-15 renders the module rather than the module’s tokens', () => {
  it('names the module and the screen without minting a route key from either', () => {
    render(<WorkerAssignmentScreen />)
    expect(screen.getByRole('heading', { name: /assignment and substitution/i })).toBeTruthy()
    const annotation = screen.getByText(/MOD-DOH-07 · SCR-DOH-15/)
    expect(annotation.textContent).toContain('worker-assignment')
    expect(annotation.textContent).toContain('annotations, never route keys')
  })

  it('renders all eight matrix rows, each with its own source line', () => {
    render(<WorkerAssignmentScreen />)
    const table = screen.getByRole('table', { name: /L28119-L28126/ })
    for (const row of CONTROL_MATRIX) {
      expect(within(table).getByText(row.control), row.id).toBeTruthy()
    }
    expect(CONTROL_MATRIX.length).toBe(8)
  })
})

/* ==================================================================== *
 * THE RULING, ON SCREEN: no control, and a stated line.
 * ==================================================================== */

describe('a deferred or non-existent capability renders as a line, never as a disabled control', () => {
  it('draws NO disabled control anywhere on this screen, for any persona', () => {
    // The strongest form of the ruling: not "the deferred ones are not
    // disabled" but "nothing here is disabled at all", checked across every
    // persona that reaches the screen. A disabled control is how a deferred
    // capability would have shipped, and there is none to inspect.
    let personasChecked = 0
    for (const role of TENANT_ROLES) {
      const { container, unmount } = render(<WorkerAssignmentScreen />)
      selectRole(role)
      personasChecked++
      const disabled = everyControl(container).filter(
        (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
      )
      expect(
        disabled.map((el) => el.textContent),
        `${role} meets a disabled control`,
      ).toEqual([])
      unmount()
    }
    expect(personasChecked).toBe(5)
  })

  it('states each absent capability where it would sit, and never leaves the region empty', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    expect(ABSENCE_NOTES.length).toBe(3)
    for (const row of ABSENCE_NOTES) {
      const card = container.querySelector(`[data-testid="absence-${row.id}"]`)
      expect(card, row.id).toBeTruthy()
      // The capability is named, the line is present, and neither is blank —
      // SB-DOH-005 refuses an empty region as firmly as a disabled control.
      expect(card?.textContent).toContain(row.absence?.capability)
      expect(card?.textContent).toContain(row.absence?.line)
      expect(card?.textContent?.trim().length ?? 0).toBeGreaterThan(80)
      // And no control of any kind inside the region.
      expect(everyControl(card as HTMLElement)).toEqual([])
    }
  })

  it('labels the two kinds of absence differently, roadmap against non-existence', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    const grant = container.querySelector('[data-testid="absence-maintain-per-cell-grant"]')
    const availability = container.querySelector('[data-testid="absence-check-availability"]')
    expect(grant?.getAttribute('data-absence-kind')).toBe('does-not-exist')
    expect(availability?.getAttribute('data-absence-kind')).toBe('deferred-beyond-v1')
    expect(grant?.textContent).toContain('not on the out-of-V1 register at all')
    expect(grant?.textContent).not.toContain('Deferred beyond V1 — out-of-V1 register row')
    expect(availability?.textContent).toContain('out-of-V1 register row 5')
    // And the count contradiction is stated wherever the register is cited.
    expect(availability?.textContent).toContain('twenty-three')
  })

  it('publishes the ruling and both readings it did not adopt', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    const panel = container.querySelector('[data-testid="deferral-ruling"]')
    expect(panel?.textContent).toContain('SB-DOH-005')
    expect(panel?.textContent).toContain('L25924')
    for (const reading of DEFERRAL_RENDERING.notAdopted) {
      expect(panel?.textContent, reading.ref).toContain(reading.ref)
    }
    expect(panel?.textContent).toContain('Read and not adopted')
    // Named more than once on purpose: on the banner that states the ruling
    // and in the register of what the source does not settle.
    expect(screen.getAllByText(/AC-DOH-07-5/).length).toBeGreaterThanOrEqual(2)
  })

  it('draws no grant table and no availability control under either posture', () => {
    for (const posture of ['strict', 'notify-only'] as const) {
      const { container, unmount } = render(<WorkerAssignmentScreen />)
      setPosture(posture)
      const labels = everyControl(container).map((el) => (el.textContent ?? '').toLowerCase())
      expect(labels.some((l) => l.includes('grant')), posture).toBe(false)
      expect(labels.some((l) => l.includes('availability')), posture).toBe(false)
      expect(labels.some((l) => l.includes('double-book')), posture).toBe(false)
      unmount()
    }
  })
})

/* ==================================================================== *
 * ROW 4 — the token says Allowed, the screen says where.
 * ==================================================================== */

describe('row 4 renders a place and not a control, for the two roles it permits', () => {
  it('renders the statement for the Supervisor and the Quality Manager alike', () => {
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      const { container, unmount } = render(<WorkerAssignmentScreen />)
      selectRole(role)
      const note = container.querySelector('[data-testid="command-center-action-8"]')
      expect(note?.getAttribute('data-rendering'), role).toBe('cross-surface')
      expect(note?.textContent).toContain('action number 8')
      // No control inside the region, and no reassign control anywhere.
      expect(everyControl(note as HTMLElement)).toEqual([])
      const labels = everyControl(container).map((el) => (el.textContent ?? '').toLowerCase())
      expect(labels.some((l) => l.includes('reassign')), role).toBe(false)
      unmount()
    }
  })

  it('mints no link for it, and says why in the note itself', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    selectRole('SUPERVISOR')
    const note = container.querySelector('[data-testid="command-center-action-8"]')
    expect(note?.querySelectorAll('a').length).toBe(0)
    expect(note?.textContent).toContain('boundary register')
    // The three cross-check locators are on the page, not only in a comment.
    expect(note?.textContent).toContain('L13421')
    expect(note?.textContent).toContain('L53791')
    expect(note?.textContent).toContain('L53798')
  })

  it('discloses DEC-PLUS-001 and quotes the phrase without expanding it', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    const panel = container.querySelector('[data-testid="dec-plus-001"]')
    expect(panel?.textContent).toContain('DEC-PLUS-001')
    expect(panel?.textContent).toContain('Supervisor and above')
    expect(panel?.textContent).toContain('L13456')
    expect(panel?.textContent).toContain('non-hierarchical')
    expect(panel?.textContent).toContain('invent')
  })
})

/* ==================================================================== *
 * ROW 7 AND D11.
 * ==================================================================== */

describe('the Worker holds a cell and reaches no screen', () => {
  it('renders the whole route Unavailable for the Worker, with the cost stated', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    selectRole('WORKER')
    expect(screen.getByRole('heading', { name: /unavailable for the worker view/i })).toBeTruthy()
    // No assignment panel, no candidate, no matrix table.
    expect(container.querySelector('[data-testid="candidate-WKR-0142"]')).toBeNull()
    expect(screen.queryByRole('table', { name: /L28119-L28126/ })).toBeNull()
  })

  it('keeps the Worker’s row-7 grant visible to the personas who can read the matrix', () => {
    render(<WorkerAssignmentScreen />)
    const table = screen.getByRole('table', { name: /L28119-L28126/ })
    expect(within(table).getByText(/own assignments only/)).toBeTruthy()
    expect(within(table).getByText(/D11/)).toBeTruthy()
  })

  it('derives reach from the matrix and shows the narrower catalogue cell beside it', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    const note = container.querySelector('[data-testid="catalogue-narrowing"]')
    expect(note?.textContent).toContain('L48109')
    expect(note?.textContent).toContain('Tenant Admin, Quality Manager, Read-only Auditor')
    expect(note?.textContent).toContain('L28125')
    expect(screen.getByText(/who this screen is for/i)).toBeTruthy()
  })
})

/* ==================================================================== *
 * THE ASSIGNMENT PANEL — SB-DOH-019.
 * ==================================================================== */

describe('the assignment panel behaves as SB-DOH-019 describes it', () => {
  it('scopes the Supervisor’s candidate list to their own Areas by building it, not hiding it', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    selectRole('SUPERVISOR')
    expect(container.querySelector('[data-testid="candidate-WKR-0142"]')).toBeTruthy()
    // The out-of-Area worker is not in the DOM at all — not hidden, absent.
    expect(container.querySelector('[data-testid="candidate-WKR-0407"]')).toBeNull()
    expect(CANDIDATE_WORKERS.some((w) => w.workerId === 'WKR-0407')).toBe(true)
  })

  it('under strict, removes the assign control on a failing check and names the clearance path', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    selectRole('SUPERVISOR')
    setPosture('strict')
    const maya = container.querySelector('[data-testid="candidate-WKR-0142"]') as HTMLElement
    // ABSENT, not disabled — AC-DOH-07-10 forbids an inline override, and a
    // disabled assign button beside a clearance line is one.
    expect(everyControl(maya)).toEqual([])
    expect(maya.textContent).toContain(POSTURE_COPY.strict)
  })

  it('under notify-only, offers the control and states what will be flagged', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    selectRole('SUPERVISOR')
    setPosture('notify-only')
    const maya = container.querySelector('[data-testid="candidate-WKR-0142"]') as HTMLElement
    expect(everyControl(maya).length).toBe(1)
    expect(maya.textContent).toContain(POSTURE_COPY['notify-only'])
    // The two copies are different sentences, not one reworded: under
    // notify-only there is no block to clear.
    expect(maya.textContent).not.toContain(POSTURE_COPY.strict)
  })

  it('renders the clearance as a checked cross-surface pointer, and drops the link where the role cannot open the target', () => {
    // The Supervisor reaches SURF-CC in the route registry, so the link
    // renders. The Read-only Auditor does not, so it collapses to a plain
    // statement — the pointer is verified, never asserted.
    const supervisor = render(<WorkerAssignmentScreen />)
    selectRole('SUPERVISOR')
    const forSupervisor = supervisor.container.querySelector(
      '[data-testid="cross-surface-statement"]',
    )
    expect(forSupervisor?.getAttribute('data-boundary')).toBe('qualification-clearance-granting')
    expect(forSupervisor?.getAttribute('data-link-state')).toBe('link')
    supervisor.unmount()

    const auditor = render(<WorkerAssignmentScreen />)
    selectRole('READONLY_AUDITOR')
    const forAuditor = auditor.container.querySelector('[data-testid="cross-surface-statement"]')
    expect(forAuditor?.getAttribute('data-link-state')).toBe('statement')
    expect(forAuditor?.querySelectorAll('a').length).toBe(0)
  })

  it('states the concurrency rule and draws no cap', () => {
    render(<WorkerAssignmentScreen />)
    expect(screen.getByText(CONCURRENCY_FOOTER)).toBeTruthy()
  })

  it('pins the package at the first assignment and reports the Worker-Shift count', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    selectRole('SUPERVISOR')
    expect(container.querySelector('[data-testid="package-pin"]')).toBeNull()
    const ahmed = container.querySelector('[data-testid="candidate-WKR-0188"]') as HTMLElement
    fireEvent.click(within(ahmed).getByRole('button'))
    const pin = container.querySelector('[data-testid="package-pin"]')
    expect(pin?.textContent).toContain('workflow v2.1.0')
    expect(pin?.textContent).toContain('immutable for the life of the run')
    expect(pin?.textContent).toContain('1 Worker-Shift')
  })

  it('offers substitution to the Supervisor alone, and delivers the three-field handover', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    selectRole('SUPERVISOR')
    expect(container.querySelector('[data-testid="handover"]')).toBeNull()
    fireEvent.click(container.querySelector('[data-testid="substitute"]') as HTMLElement)
    const handover = container.querySelector('[data-testid="handover"]')
    expect(handover?.textContent).toContain('Last completed step')
    expect(handover?.textContent).toContain('Open flags')
    expect(handover?.textContent).toContain('Current state')
    expect(handover?.textContent).toContain('queued, not applied')
  })

  it('offers substitution to nobody else, and states the refusal rather than hiding it', () => {
    for (const role of ['TENANT_ADMIN', 'QUALITY_MANAGER', 'READONLY_AUDITOR'] as const) {
      const { container, unmount } = render(<WorkerAssignmentScreen />)
      selectRole(role)
      expect(container.querySelector('[data-testid="substitute"]'), role).toBeNull()
      expect(screen.getByRole('heading', { name: /mid-run substitution/i })).toBeTruthy()
      unmount()
    }
  })
})

/* ==================================================================== *
 * THE SEAMS.
 * ==================================================================== */

describe('the two seams this module owns render as closed and say what they carry', () => {
  it('reports both closed, with the content that closes them', () => {
    const { container } = render(<WorkerAssignmentScreen />)
    for (const seamId of ['worker-shift-meter', 'qualification-gate']) {
      const card = container.querySelector(`[data-testid="seam-${seamId}"]`)
      expect(card, seamId).toBeTruthy()
      expect(card?.getAttribute('data-seam-status')).toBe('closed')
      expect(card?.textContent?.length ?? 0).toBeGreaterThan(120)
    }
    // A closed seam must NOT render the "not built here" notice.
    expect(screen.queryByText(/cross-slice seam — not built here/i)).toBeNull()
  })
})
