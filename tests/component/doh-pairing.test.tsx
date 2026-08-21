import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PairedSchedulingScreen } from '../../app/hub/multi-area-job-pairing/PairedSchedulingScreen'
import { MOD_DOH_16_TENANT_ADMIN_CONTRADICTION } from '@/surfaces/doh/job-owner'
import { CONTROL_MATRIX } from '@/surfaces/doh/modules/doh-16/matrix'
import { FLAG_CHIP_TEXT, SCOPE_PLACEHOLDER_TEXT } from '@/surfaces/doh/modules/doh-16/pairing'

/**
 * The paired scheduling view, drawn.
 *
 * WHAT THIS FILE IS ACTUALLY FOR. The unit suite proves the FOLD returns the
 * right answer; this one proves the SCREEN cannot draw a control the fold did
 * not return. Those are different failures, so the assertions below sweep the
 * rendered document for controls rather than checking the ones the screen
 * meant to draw.
 */

const PERSONAS = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function choosePair(pairId: string): void {
  fireEvent.change(screen.getByLabelText(/paired jobs/i), { target: { value: pairId } })
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

function lane(side: 'a' | 'b'): HTMLElement {
  const el = screen.getByTestId(`lane-${side}`)
  return el
}

/* ==================================================================== *
 * THE UNCATALOGUED ROUTE
 * ==================================================================== */

describe('the route names a storyboard, not a screen identifier', () => {
  it('renders the shell’s uncatalogued-screen header with the storyboard name', () => {
    render(<PairedSchedulingScreen />)
    const annotation = screen.getByText(/MOD-DOH-16 · SB-DOH-028/)
    expect(annotation.textContent).toContain('an uncatalogued storyboard name')
    expect(annotation.textContent).toContain('none is minted')
  })

  it('mints no screen identifier for this view anywhere in the rendered document', () => {
    render(<PairedSchedulingScreen />)
    for (const role of PERSONAS) {
      viewAs(role)
      // Catalogue A's row for this view is a three-digit literal; catalogue B
      // has no row at all. Neither shape may appear.
      expect(document.body.textContent ?? '').not.toMatch(/SCR-[A-Z]{2,3}-\d{2,3}/)
    }
  })

  it('states that the module rail does not offer this route, rather than hiding it', () => {
    render(<PairedSchedulingScreen />)
    expect(screen.getByTestId('reach').textContent).toContain(
      'the rail offers this route to nobody',
    )
  })
})

/* ==================================================================== *
 * TRAP 1 — the contradiction is DRAWN as two readings.
 * ==================================================================== */

describe('rows 4 and 5 render both readings for the Tenant Admin and settle neither', () => {
  it('draws the disclosed shape on both review-flag rows', () => {
    render(<PairedSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    expect(kindOf('receive-the-review-flag')).toBe('disclosed')
    expect(kindOf('act-on-the-review-flag')).toBe('disclosed')
  })

  it('prints the two cells verbatim, side by side, with their own locators', () => {
    render(<PairedSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    const cell = affordance('act-on-the-review-flag')
    expect(cell?.textContent).toContain('L29616')
    expect(cell?.textContent).toContain('L29617')
    for (const reading of MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.readings) {
      expect(cell?.textContent).toContain(reading.cell)
    }
  })

  it('draws no averaged single answer — no control and no read-only in the disclosed cells', () => {
    render(<PairedSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    for (const id of ['receive-the-review-flag', 'act-on-the-review-flag']) {
      const cell = affordance(id)
      expect(cell?.querySelector('button')).toBeNull()
      expect(cell?.textContent).toContain('The source answers this cell twice')
    }
  })

  it('discloses for the Tenant Admin only — the other three Hub personas get one answer', () => {
    render(<PairedSchedulingScreen />)
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'] as const) {
      viewAs(role)
      expect(kindOf('receive-the-review-flag'), role).not.toBe('disclosed')
      expect(kindOf('act-on-the-review-flag'), role).not.toBe('disclosed')
    }
  })
})

/* ==================================================================== *
 * TRAP 2 — Job Owner never renders as a role.
 * ==================================================================== */

describe('Job Owner renders as a field on the Job, never as a role', () => {
  it('offers five personas in the switcher and no sixth', () => {
    render(<PairedSchedulingScreen />)
    const select = screen.getByLabelText(/view as tenant role/i) as HTMLSelectElement
    expect(select.options).toHaveLength(5)
    expect([...select.options].map((o) => o.value).sort()).toEqual([...PERSONAS].sort())
  })

  it('names the owner FIELD when it says where the flag routed', () => {
    render(<PairedSchedulingScreen />)
    const routing = screen.getByTestId('flag-routing')
    expect(routing.textContent).toContain('the Job Owner field on JOB-REDBIKE')
    expect(routing.textContent).toContain('confers no permissions')
  })

  it('discloses catalogue A’s Primary role cell and the reading it does not take', () => {
    render(<PairedSchedulingScreen />)
    const note = screen.getByTestId('job-owner-not-a-role')
    expect(note.textContent).toContain('Supervisor and Job Owner')
    expect(note.textContent).toContain('mints a sixth tenant role')
    expect(note.textContent).toContain('L27652')
  })
})

/* ==================================================================== *
 * THE DEFERRAL RULING, DRAWN.
 * ==================================================================== */

describe('nothing on this screen is ever drawn disabled', () => {
  it('renders no disabled control in any persona, for any pair', () => {
    render(<PairedSchedulingScreen />)
    for (const pairId of ['PAIR-PAINT-ASSY', 'PAIR-WHEEL-PAINT']) {
      for (const role of PERSONAS) {
        viewAs(role)
        if (role !== 'WORKER') choosePair(pairId)
        for (const button of screen.queryAllByRole('button')) {
          expect(button.getAttribute('aria-disabled'), `${role} / ${pairId}`).not.toBe('true')
        }
        expect(document.querySelector('[data-kind="disabled"]')).toBeNull()
      }
    }
  })

  it('draws no propagation control anywhere, enabled or disabled, in any persona', () => {
    render(<PairedSchedulingScreen />)
    for (const role of PERSONAS) {
      viewAs(role)
      for (const label of buttonLabels()) {
        expect(label, role).not.toMatch(/propagat/i)
      }
    }
  })

  it('renders a stated line where the propagation control would sit', () => {
    render(<PairedSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    const cell = affordance('cause-automated-propagation-across-the-link')
    expect(cell?.getAttribute('data-kind')).toBe('absent')
    expect(cell?.querySelector('button')).toBeNull()
    expect(cell?.textContent).toContain('flagging only at V1')
    expect(cell?.textContent).toContain('no such capability exists')
  })

  it('lists what it deliberately does not draw, and says which absence is not a deferral', () => {
    render(<PairedSchedulingScreen />)
    const entries = screen.getAllByTestId('absent-by-rule')
    expect(entries.length).toBeGreaterThanOrEqual(4)
    expect(entries.map((e) => e.textContent ?? '').join(' ')).toContain(
      'exists nowhere rather than one scheduled for later',
    )
  })

  it('draws no receive control for anybody, however permissive the cell', () => {
    render(<PairedSchedulingScreen />)
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'] as const) {
      viewAs(role)
      expect(affordance('receive-the-review-flag')?.querySelector('button'), role).toBeNull()
    }
  })
})

/* ==================================================================== *
 * THE TWO LANES, THE PLACEHOLDER AND THE FLAG CHIP — SB-DOH-028.
 * ==================================================================== */

describe('the paired view draws two lanes, and an out-of-scope lane names existence only', () => {
  it('draws both lanes in full for a tenant-scoped persona', () => {
    render(<PairedSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    expect(lane('a').getAttribute('data-scope')).toBe('in-scope')
    expect(lane('b').getAttribute('data-scope')).toBe('in-scope')
    expect(lane('a').textContent).toContain('JOB-PAINTLINE')
    expect(lane('b').textContent).toContain('JOB-REDBIKE')
  })

  it('replaces the out-of-scope lane with the storyboard’s own placeholder text', () => {
    render(<PairedSchedulingScreen />)
    viewAs('SUPERVISOR')
    const paint = lane('a')
    expect(paint.getAttribute('data-scope')).toBe('placeholder')
    expect(paint.textContent).toContain(SCOPE_PLACEHOLDER_TEXT)
  })

  it('leaks nothing about the out-of-scope Job — not its name, its owner or its state', () => {
    render(<PairedSchedulingScreen />)
    viewAs('SUPERVISOR')
    const paint = lane('a').textContent ?? ''
    expect(paint).not.toContain('Paint line preparation')
    expect(paint).not.toContain('ACT-DOH-TENANT-ADMIN')
    expect(paint).not.toContain('Job Owner field names')
    // The partner lane the Supervisor DOES hold still renders in full, so the
    // placeholder is a per-lane answer and not the whole view being withheld.
    expect(lane('b').textContent).toContain('Red bike frame assembly')
  })

  it('shows the Area the node path resolved to, which is the DEC-AREA-001 walk drawn', () => {
    render(<PairedSchedulingScreen />)
    viewAs('SUPERVISOR')
    choosePair('PAIR-WHEEL-PAINT')
    // JOB-WHEELTRUE is bound to a Location; the lane names the Area the walk
    // reached, so a reader can see the rule ran.
    expect(lane('a').textContent).toContain('CELL-WHEEL-2')
    expect(lane('a').textContent).toContain('resolves to Area AREA-ASSY-A')
  })

  it('puts the flag chip on the partner of the side that changed, and nowhere else', () => {
    render(<PairedSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    expect(screen.getByTestId('flag-chip-b').textContent).toContain(FLAG_CHIP_TEXT)
    expect(screen.queryByTestId('flag-chip-a')).toBeNull()
  })

  it('draws no flag chip on a pair where neither side changed', () => {
    render(<PairedSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    choosePair('PAIR-WHEEL-PAINT')
    expect(screen.queryByTestId('flag-chip-a')).toBeNull()
    expect(screen.queryByTestId('flag-chip-b')).toBeNull()
    expect(screen.getByTestId('flag-routing').textContent).toContain('no review flag has been raised')
  })
})

/* ==================================================================== *
 * D11 — the Worker meets the shell, not this screen.
 * ==================================================================== */

describe('the Worker reaches no Hub route, and this screen does not argue with that', () => {
  it('renders the shell’s D11 note instead of the module content', () => {
    render(<PairedSchedulingScreen />)
    viewAs('WORKER')
    expect(screen.getByText(/holds no Hub screen/)).toBeTruthy()
    expect(screen.queryByTestId('reach')).toBeNull()
    expect(screen.queryByTestId('lane-a')).toBeNull()
  })
})

/* ==================================================================== *
 * ROWS 1 AND 2 — scope over both Jobs.
 * ==================================================================== */

describe('the pairing controls need scope over both Jobs', () => {
  it('offers both to the Tenant Admin', () => {
    render(<PairedSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    expect(kindOf('create-a-pairing-between-two-jobs')).toBe('control')
    expect(kindOf('remove-a-pairing')).toBe('control')
    expect(buttonLabels()).toContain('Create a pairing between two Jobs')
  })

  it('withholds them from a Supervisor over only one, and names the Job rather than the person', () => {
    render(<PairedSchedulingScreen />)
    viewAs('SUPERVISOR')
    expect(kindOf('create-a-pairing-between-two-jobs')).toBe('absent')
    expect(affordance('create-a-pairing-between-two-jobs')?.textContent).toContain('JOB-PAINTLINE')
    expect(buttonLabels()).not.toContain('Create a pairing between two Jobs')
  })

  it('offers no pairing control to the Quality Manager or the Read-only Auditor', () => {
    render(<PairedSchedulingScreen />)
    for (const role of ['QUALITY_MANAGER', 'READONLY_AUDITOR'] as const) {
      viewAs(role)
      for (const label of buttonLabels()) {
        expect(label, role).not.toMatch(/pairing/i)
      }
    }
  })
})

/* ==================================================================== *
 * THE WHOLE MATRIX RENDERS, AND DEC-AREA-001 RENDERS AS WHAT IT IS.
 * ==================================================================== */

describe('the screen renders every row and its own disclosures', () => {
  it('draws an affordance for all six rows, in every Hub persona', () => {
    render(<PairedSchedulingScreen />)
    for (const role of PERSONAS.filter((r) => r !== 'WORKER')) {
      viewAs(role)
      for (const row of CONTROL_MATRIX) {
        expect(affordance(row.id), `${role} / ${row.id}`).not.toBeNull()
      }
    }
  })

  it('renders DEC-AREA-001 as an adopted working position with ratification outstanding', () => {
    render(<PairedSchedulingScreen />)
    const note = screen.getByTestId('dec-area-001')
    expect(note.textContent).toContain('WALKING UP the node path')
    expect(note.textContent).toContain('Outstanding')
    expect(note.textContent).toContain('It is never classified as SoW Fact')
  })

  it('records the silences on screen, including the pairing act having no Hub command', () => {
    render(<PairedSchedulingScreen />)
    const all = screen.getAllByTestId('unresolved').map((e) => e.textContent ?? '').join(' ')
    // The command gap this line used to pin is closed: DOH_PAIR_JOBS and
    // DOH_UNPAIR_JOBS exist. The screen records that it WAS a gap and what
    // closed it, rather than dropping the disclosure.
    expect(all).toContain('none of them paired or unpaired two Jobs')
    expect(all).toContain('DOH_PAIR_JOBS')
    expect(all).toContain('settles neither')
  })
})
