import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import { JobLifecycleScreen } from '../../app/hub/job-lifecycle-and-approval/JobLifecycleScreen'
import { JobCloningPanel } from '@/surfaces/doh/modules/doh-15/JobCloningPanel'
import {
  CLONE_DIALOGUE_FOOTER,
  COPIED_ELEMENTS,
  MOD_DOH_15_MATRIX,
  MOD_DOH_15_MOUNT,
  RECURRENCE_PROMPT,
  RESET_ELEMENTS,
} from '@/surfaces/doh/modules/doh-15/matrix'
import { SEEDED_JOBS } from '@/surfaces/doh/modules/doh-05/jobs'

/**
 * `MOD-DOH-15` — the clone dialogue, as a person meets it.
 *
 * The unit suite proves the fold. This one proves the two things only a
 * rendered tree can show: that the panel is MOUNTED inside the Job editor
 * and reachable with no route of its own, and that every refusal on it is an
 * ABSENCE — a note where a control would sit, and never a disabled control
 * standing in for a capability that does not exist.
 */

const SOURCE_JOB = SEEDED_JOBS[0]!.record

function panel(role: Parameters<typeof JobCloningPanel>[0]['role'] = 'SUPERVISOR') {
  return render(<JobCloningPanel role={role} sourceJob={SOURCE_JOB} />)
}

function region(): HTMLElement {
  return screen.getByRole('region', { name: 'Job cloning' })
}

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

describe('the panel is mounted inside the Job editor and has no route of its own', () => {
  it('renders inside SCR-DOH-11, the Job editor sub-view of the MOD-DOH-05 route', () => {
    render(<JobLifecycleScreen />)
    const editor = screen.getByRole('region', { name: 'Job editor' })
    expect(within(editor).getByTestId('mod-doh-15')).toBeTruthy()
  })

  it('states the mount and its line rather than implying a route', () => {
    panel()
    const note = within(region()).getByTestId('doh-15-no-route')
    expect(note.textContent).toContain('has no screen of its own')
    expect(note.textContent).toContain(MOD_DOH_15_MOUNT.sourceRef)
    expect(note.textContent).toContain(MOD_DOH_15_MOUNT.mountedIn)
  })

  it('discloses catalogue B`s narrowing without enforcing it', () => {
    render(<JobLifecycleScreen />)
    viewAs('TENANT_ADMIN')
    const own = screen.getByTestId('mod-doh-15')
    expect(within(own).getByTestId('doh-15-catalogue-narrowing').textContent).toContain(
      'Tenant Admin',
    )
    // ... and the Tenant Admin still gets the control the matrix grants.
    expect(within(within(own).getByTestId('row-1')).getByRole('button')).toBeTruthy()
  })
})

describe('the clone control follows the row, and nothing else does', () => {
  it('offers it to the Tenant Admin and the Supervisor', () => {
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR'] as const) {
      cleanup()
      panel(role)
      const control = within(region()).getByTestId('row-1')
      const button = within(control).getByRole('button', { name: 'Clone a Job' })
      expect(button.getAttribute('aria-disabled')).not.toBe('true')
    }
  })

  it('draws a NOTE, not a disabled button, for the three roles refused — TEST-DOH-15-D2', () => {
    for (const role of ['QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER'] as const) {
      cleanup()
      panel(role)
      const cell = within(region()).getByTestId('row-1')
      expect(within(cell).queryByRole('button')).toBeNull()
      expect(within(cell).getByRole('note')).toBeTruthy()
    }
  })
})

describe('every refusal on this panel is an absence', () => {
  it('draws no control at all for rows 3 to 6, for any role', () => {
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      cleanup()
      panel(role)
      for (const id of ['row-3-affordance', 'row-4', 'row-5', 'row-6']) {
        const cell = within(region()).getByTestId(id)
        expect(within(cell).queryByRole('button'), `${role}/${id}`).toBeNull()
        expect(within(cell).getByRole('note'), `${role}/${id}`).toBeTruthy()
      }
    }
  })

  it('draws no Approve control for the Quality Manager, whose cell is permissive', () => {
    panel('QUALITY_MANAGER')
    expect(screen.queryByRole('button', { name: /approve/i })).toBeNull()
    const cell = within(region()).getByTestId('row-3-affordance')
    expect(within(cell).getByRole('note').textContent).toContain('SCR-DOH-12')
  })

  it('offers no link out either, because the target is a screen of this same surface', () => {
    panel('QUALITY_MANAGER')
    expect(within(region()).queryAllByRole('link')).toHaveLength(0)
  })
})

describe('the recurrence prompt renders only on the branch that raises it', () => {
  it('shows the source`s own sentence where the source recurs', () => {
    panel()
    expect(within(region()).getByTestId('recurrence-prompt').textContent).toBe(RECURRENCE_PROMPT)
  })

  it('shows no prompt and no control where it does not — TEST-DOH-15-N2', () => {
    panel()
    fireEvent.click(screen.getByLabelText('The source Job recurs'))
    expect(within(region()).queryByTestId('recurrence-prompt')).toBeNull()
    const cell = within(region()).getByTestId('row-2')
    expect(within(cell).queryByRole('button')).toBeNull()
    expect(within(cell).getByRole('note').textContent).toContain('L29494')
  })

  it('keeps the reset row visible on both branches — the reset is not conditional', () => {
    panel()
    expect(within(region()).getByTestId('recurrence-row').textContent).toContain(
      'Recurrence: reset to one-off',
    )
    fireEvent.click(screen.getByLabelText('The source Job recurs'))
    expect(within(region()).getByTestId('recurrence-row').textContent).toContain(
      'Recurrence: reset to one-off',
    )
  })
})

describe('the dialogue lists what is copied and what is reset', () => {
  it('lists six copied elements and three reset ones — SB-DOH-027`s two columns', () => {
    panel()
    expect(within(within(region()).getByTestId('copied-elements')).getAllByRole('listitem')).toHaveLength(
      COPIED_ELEMENTS.length,
    )
    expect(within(within(region()).getByTestId('reset-elements')).getAllByRole('listitem')).toHaveLength(
      RESET_ELEMENTS.length,
    )
  })

  it('offers the new-name field at the top, and names it a reset rather than a copy', () => {
    panel()
    const field = within(region()).getByLabelText('Name for the clone')
    expect(field).toBeTruthy()
    expect(within(region()).getByText(/Reset, never copied/)).toBeTruthy()
  })

  it('prints the storyboard`s footer line verbatim', () => {
    panel()
    expect(within(region()).getByTestId('clone-dialogue-footer').textContent).toBe(
      CLONE_DIALOGUE_FOOTER,
    )
  })

  it('names no seeded Job Type or Service Type — DEC-TAX-002 ships the catalogue empty', () => {
    panel()
    const text = region().textContent ?? ''
    expect(text).toContain('never invented')
    expect(text).not.toMatch(/starter (Job Type|Service Type)/)
  })
})

describe('the whole matrix and its silences reach the reader', () => {
  it('renders all six rows with their own lines', () => {
    panel()
    const list = within(region()).getByTestId('doh-15-matrix')
    expect(within(list).getAllByRole('listitem')).toHaveLength(MOD_DOH_15_MATRIX.length)
    for (const row of MOD_DOH_15_MATRIX) {
      expect(list.textContent).toContain(row.sourceRef)
      expect(list.textContent).toContain(row.control)
    }
  })

  it('renders the silences rather than filling them in', () => {
    panel()
    const list = within(region()).getByTestId('doh-15-silences')
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThanOrEqual(6)
    expect(list.textContent).toContain('the cloning identity')
    expect(list.textContent).toContain('Recurrence is not a field of the Job record')
  })
})
