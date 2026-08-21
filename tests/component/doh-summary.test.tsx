import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ExecutionSummaryReviewScreen } from '../../app/hub/execution-summary-review/ExecutionSummaryReviewScreen'
import { REVIEW_QUEUE } from '../../app/hub/execution-summary-review/fixtures'
import { DOH_CATALOGUE_AB_SWAP } from '@/surfaces/doh/screens'

/**
 * `SCR-DOH-16` and its `SCR-DOH-17` sub-view, drawn.
 *
 * WHAT THIS FILE IS ACTUALLY FOR. The unit suite proves the FOLD returns the
 * right answer; this one proves the SCREEN cannot draw a control the fold did
 * not return. Those are different failures — four tasks on this build shipped
 * the second while the first was green — so the assertions below sweep the
 * rendered document for controls rather than checking the ones the screen
 * meant to draw.
 */

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

/** Every button in the document, by its accessible text. */
function buttonLabels(): readonly string[] {
  return screen.queryAllByRole('button').map((b) => (b.textContent ?? '').trim())
}

function affordance(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-testid="affordance-${id}"]`)
}

function kindOf(id: string): string | null {
  return affordance(id)?.getAttribute('data-kind') ?? null
}

describe('MOD-DOH-08 — the screen and the two screens it carries', () => {
  it('names both catalogue-B screens and mounts the detail as a sub-view, not a route', () => {
    render(<ExecutionSummaryReviewScreen />)
    expect(screen.getByText(/SCR-DOH-16 — Execution Summary review queue/)).toBeTruthy()
    expect(
      screen.getByText(/SCR-DOH-17 — Summary detail and Anomaly Register/),
    ).toBeTruthy()
    expect(screen.getByText(/A sub-view of the review queue, not a route of its own/)).toBeTruthy()
  })

  it('discloses the catalogue A/B swap verbatim rather than picking one silently', () => {
    render(<ExecutionSummaryReviewScreen />)
    const note = screen.getByTestId('catalogue-swap')
    expect(note.textContent).toBe(DOH_CATALOGUE_AB_SWAP.statement)
    expect(screen.getByText(/Catalogue A also gives this module a third screen/)).toBeTruthy()
  })
})

describe('trap 1 and 2 — no release control exists on this surface, for anybody', () => {
  it('draws no release or request button in any of the five personas', () => {
    render(<ExecutionSummaryReviewScreen />)
    for (const role of [
      'QUALITY_MANAGER',
      'TENANT_ADMIN',
      'SUPERVISOR',
      'READONLY_AUDITOR',
      'WORKER',
    ]) {
      viewAs(role)
      // Swept, not asked of one control: nothing anywhere in the document may
      // offer a release or a request-release, enabled OR disabled.
      for (const label of buttonLabels()) {
        expect(label).not.toMatch(/releas/i)
      }
    }
  })

  it('renders the row as a cross-surface statement instead, for the Quality Manager who holds the authority', () => {
    render(<ExecutionSummaryReviewScreen />)
    expect(kindOf('release-a-severity-1-lot-hold')).toBe('cross-surface')
    const note = affordance('release-a-severity-1-lot-hold')
    expect(note?.textContent).toContain('Quality Manager only, uniformly')
    expect(note?.textContent).toContain('lives on another surface permanently')
  })

  it("keeps the Supervisor's request path on screen, with its mandatory note", () => {
    render(<ExecutionSummaryReviewScreen />)
    viewAs('SUPERVISOR')
    const note = affordance('release-a-severity-1-lot-hold')
    expect(note?.getAttribute('data-kind')).toBe('cross-surface')
    expect(note?.textContent).toContain('may request release with a note')
    expect(note?.textContent).toContain('mandatory')
  })
})

describe('trap 4 — no reclassification trigger on this surface', () => {
  it('draws no reclassify control for any persona and states where the act lives', () => {
    render(<ExecutionSummaryReviewScreen />)
    for (const role of ['QUALITY_MANAGER', 'TENANT_ADMIN', 'READONLY_AUDITOR']) {
      viewAs(role)
      for (const label of buttonLabels()) {
        expect(label).not.toMatch(/reclassif/i)
      }
    }
    viewAs('QUALITY_MANAGER')
    expect(kindOf('reclassify-an-anomaly-severity')).toBe('cross-surface')
    expect(affordance('reclassify-an-anomaly-severity')?.textContent).toContain('recorded reason')
  })
})

describe('trap 3 — the Worker meets D11 before anything else', () => {
  it('renders no module content at all, and says what that costs', () => {
    render(<ExecutionSummaryReviewScreen />)
    viewAs('WORKER')
    expect(screen.getByText(/holds no Hub screen/)).toBeTruthy()
    // The queue, the register and every affordance are gone with the route.
    expect(affordance('add-a-correction-annotation')).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    for (const label of buttonLabels()) {
      expect(label).not.toMatch(/annotat/i)
    }
  })
})

describe('trap 5 — `Unavailable` renders ABSENT, not an empty queue', () => {
  it('gives the Tenant Admin and the Supervisor no queue and no disabled queue', () => {
    render(<ExecutionSummaryReviewScreen />)
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR']) {
      viewAs(role)
      expect(screen.queryByRole('table')).toBeNull()
      const absent = screen.getByTestId('queue-absent')
      expect(absent.textContent).toContain('ABSENT')
      // Not "you have no items": there is no standing to have items under.
      expect(absent.textContent).not.toMatch(/no items|empty/i)
    }
  })

  it('gives the Quality Manager and the Read-only Auditor the real queue', () => {
    render(<ExecutionSummaryReviewScreen />)
    for (const role of ['QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      viewAs(role)
      const table = screen.getByRole('table')
      expect(within(table).getAllByRole('row').length).toBe(REVIEW_QUEUE.length + 1)
    }
  })
})

describe('trap 6 — the review toggle constraint renders and the control does not', () => {
  it('draws no toggle, switch or checkbox for any persona', () => {
    render(<ExecutionSummaryReviewScreen />)
    for (const role of ['TENANT_ADMIN', 'QUALITY_MANAGER', 'SUPERVISOR', 'READONLY_AUDITOR']) {
      viewAs(role)
      expect(screen.queryAllByRole('switch')).toHaveLength(0)
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
      for (const label of buttonLabels()) {
        expect(label).not.toMatch(/review toggle/i)
      }
    }
  })

  it('states the constraint, naming Regulated-Industry mode and the module that is not built', () => {
    render(<ExecutionSummaryReviewScreen />)
    viewAs('TENANT_ADMIN')
    const constraint = screen.getByTestId('review-toggle-constraint')
    expect(constraint.textContent).toContain('forced on and not disableable in Regulated-Industry')
    expect(constraint.textContent).toContain('MOD-DOH-17')
    expect(constraint.textContent).toContain('is not built in this slice')
  })
})

describe('the aging bands are highlights, and nothing on the screen is a lock', () => {
  it('bands every queued item and says outright that no lock follows', () => {
    render(<ExecutionSummaryReviewScreen />)
    const table = screen.getByRole('table')
    expect(within(table).getByText('Aged past 72 hours')).toBeTruthy()
    expect(within(table).getByText('Aged past 48 hours')).toBeTruthy()
    expect(within(table).getByText('Aged past 24 hours')).toBeTruthy()
    expect(within(table).getByText('Under 24 hours')).toBeTruthy()

    const note = screen.getByTestId('aging-is-not-a-lock')
    expect(note.textContent).toContain('the pressure, not a lock')
    expect(note.textContent).toContain('does not lock the run')
  })

  it('offers no control that would act on an aged item', () => {
    render(<ExecutionSummaryReviewScreen />)
    for (const label of buttonLabels()) {
      expect(label).not.toMatch(/escalat|overdue|breach|unlock/i)
    }
  })
})

describe('what the Quality Manager may actually do here', () => {
  it('draws the four Hub acts as controls and nothing else', () => {
    render(<ExecutionSummaryReviewScreen />)
    expect(kindOf('mark-a-summary-reviewed')).toBe('control')
    expect(kindOf('flag-an-anomaly')).toBe('control')
    expect(kindOf('resolve-an-anomaly')).toBe('control')
    expect(kindOf('add-a-correction-annotation')).toBe('control')
    expect(kindOf('export-the-pdf-summary')).toBe('control')
    // And the categorical refusals draw nothing at all.
    expect(kindOf('edit-a-capture-or-evidence')).toBe('absent')
    expect(kindOf('force-a-re-finalisation')).toBe('absent')
  })

  it('draws no disabled control anywhere, because no routed pointer resolves for this persona', () => {
    render(<ExecutionSummaryReviewScreen />)
    for (const role of ['QUALITY_MANAGER', 'TENANT_ADMIN', 'SUPERVISOR', 'READONLY_AUDITOR']) {
      viewAs(role)
      expect(document.querySelectorAll('[data-kind="disabled"]')).toHaveLength(0)
    }
  })

  it('renders the register with its Open-to-Resolved lifecycle and the closure note', () => {
    render(<ExecutionSummaryReviewScreen />)
    const register = screen.getByRole('list', { name: 'Anomaly Register' })
    expect(register.textContent).toContain('Critical')
    expect(register.textContent).toContain('Open')
    expect(register.textContent).toContain('resolution requires a closure note')
    expect(register.textContent).toContain('Torque gauge re-zeroed')
  })
})

describe('the deferred rows', () => {
  it('render absent with their reason, and name the three-way disagreement about how', () => {
    render(<ExecutionSummaryReviewScreen />)
    expect(kindOf('bulk-or-automated-pdf-distribution')).toBe('absent')
    expect(kindOf('set-a-per-area-review-toggle')).toBe('absent')
    expect(affordance('bulk-or-automated-pdf-distribution')?.textContent).toContain(
      'deferred beyond V1',
    )
    expect(
      screen.getByText(/Three sources disagree on how a deferred capability renders/),
    ).toBeTruthy()
  })
})

describe('the two contradictions render on screen', () => {
  it('shows every reading of both, with its locator, and names neither as the answer', () => {
    render(<ExecutionSummaryReviewScreen />)
    const lot = screen.getByTestId('contradiction-CONTRADICTION-LOT-RELEASE-SURFACE')
    expect(lot.textContent).toContain('L28307')
    expect(lot.textContent).toContain('L28285')
    expect(lot.textContent).toContain('L49579')
    expect(lot.textContent).toContain('None is named as the source’s answer')

    const reclass = screen.getByTestId('contradiction-CONTRADICTION-RECLASSIFICATION-SURFACE')
    expect(reclass.textContent).toContain('L28304')
    expect(reclass.textContent).toContain('L49578')
    expect(reclass.textContent).toContain('L13426')
    expect(reclass.textContent).toContain('True under every reading')
  })
})

describe('who reaches this module, derived and stated', () => {
  it('names the derived reach rather than a hand-written rail', () => {
    render(<ExecutionSummaryReviewScreen />)
    const section = screen.getByRole('region', { name: 'Who reaches this module' })
    expect(section.textContent).toContain('QUALITY_MANAGER, READONLY_AUDITOR')
    expect(section.textContent).toContain('L28301')
    expect(section.textContent).toContain('met on no screen in this slice')
  })
})
