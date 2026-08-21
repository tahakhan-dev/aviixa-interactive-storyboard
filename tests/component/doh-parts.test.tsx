import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PartsRegistryScreen } from '../../app/hub/parts-registry/PartsRegistryScreen'
import { CONTROL_MATRIX } from '@/surfaces/doh/modules/doh-19/matrix'

/**
 * `SCR-DOH-06`, drawn.
 *
 * WHAT THIS FILE IS ACTUALLY FOR. The unit suite proves the FOLD returns the
 * right answer; this one proves the SCREEN cannot draw a control the fold did
 * not return. Those are different failures, so the assertions below sweep the
 * rendered document for controls rather than checking the ones the screen
 * meant to draw.
 */

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setTenantState(state: string): void {
  fireEvent.change(screen.getByTestId('tenant-state-select'), { target: { value: state } })
}

function kindOf(id: string): string | null {
  return document
    .querySelector<HTMLElement>(`[data-testid="affordance-${id}"]`)
    ?.getAttribute('data-kind') ?? null
}

/** Every button in the document, by its accessible text. */
function buttonLabels(): readonly string[] {
  return screen.queryAllByRole('button').map((b) => (b.textContent ?? '').trim())
}

/**
 * THE FOUR THAT REACH THE SCREEN, AND WHY THE WORKER IS NOT SWEPT WITH THEM.
 *
 * `HubShell` asks D11 at the route registry BEFORE any child renders, and the
 * Worker holds no Hub route — so on this route the Worker sees "Unavailable
 * for the Worker view" and NONE of this module's rows reach the document at
 * all. Sweeping the Worker for controls here would pass against an empty page
 * and read as evidence; the Worker's real assertion is its own case below.
 *
 * The fold's own D11 branch is therefore UNREACHABLE through this screen. It
 * is proved in `tests/unit/doh-parts.test.ts`, which calls the fold directly,
 * and it is kept because the fold is the module's answer rather than this
 * route's — a second mount that skipped the shell would need it.
 */
const REACHING_ROLES = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']
const SUSPENDED = ['soft-suspended', 'hard-suspended', 'compliance-suspended', 'archived']

/** Only this module's affordances. The shell's own chrome is not this card's. */
function affordanceButtons(): readonly HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-testid^="affordance-"] button')]
}

describe('MOD-DOH-19 — the screen names itself and derives its own reach', () => {
  it('carries the module and catalogue-B identifiers without claiming a rail entry', () => {
    render(<PartsRegistryScreen />)
    expect(screen.getByText(/MOD-DOH-19 · SCR-DOH-06 · \/hub\/parts-registry/)).toBeTruthy()
  })

  it('prints the reach it DERIVED, and names catalogue B as the narrower cell', () => {
    render(<PartsRegistryScreen />)
    const reach = screen.getByTestId('derived-reach').textContent ?? ''
    expect(reach).toContain('TENANT_ADMIN')
    expect(reach).toContain('SUPERVISOR')
    expect(reach).toContain('QUALITY_MANAGER')
    expect(reach).toContain('READONLY_AUDITOR')
    expect(reach).not.toContain('WORKER')

    const narrower = screen.getByTestId('catalogue-b-narrower').textContent ?? ''
    expect(narrower).toContain('Tenant Admin, Supervisor')
    expect(narrower).toContain('Quality Manager and Read-only Auditor')
  })

  it('renders all eight rows for a role that reaches the screen', () => {
    render(<PartsRegistryScreen />)
    for (const row of CONTROL_MATRIX) {
      expect(document.querySelector(`[data-testid="row-${row.id}"]`)).toBeTruthy()
    }
    expect(CONTROL_MATRIX.length).toBe(8)
  })
})

describe('C2 — the inline-add seam draws no control, for anybody', () => {
  it('is a cross-surface statement in all five personas and never a control', () => {
    render(<PartsRegistryScreen />)
    for (const role of REACHING_ROLES) {
      viewAs(role)
      expect(kindOf('add-a-part-inline-during-authoring')).toBe('cross-surface')
    }
  })

  it('says the act is done in the Studio and the record is owned HERE', () => {
    render(<PartsRegistryScreen />)
    const note = document.querySelector<HTMLElement>(
      '[data-testid="affordance-add-a-part-inline-during-authoring"]',
    )
    expect(note?.getAttribute('data-owned-here')).toBe('true')
    expect(note?.textContent).toContain('Done in the Standards and Operations Studio. Owned here.')
    expect(note?.textContent).toContain('a second entry point is not a second owner')
    expect(note?.textContent).toContain(
      'No control for this act exists here, enabled or disabled.',
    )
  })

  it('draws NO add-a-part control anywhere in the document, in any persona', () => {
    render(<PartsRegistryScreen />)
    for (const role of REACHING_ROLES) {
      viewAs(role)
      for (const label of buttonLabels()) {
        expect(label).not.toMatch(/add a part/i)
        expect(label).not.toMatch(/inline/i)
      }
    }
  })

  it('row 8 is the contrast: owned THERE, and never linked', () => {
    render(<PartsRegistryScreen />)
    const note = document.querySelector<HTMLElement>(
      '[data-testid="affordance-set-ingestion-limits-or-storage-metering"]',
    )
    expect(note?.getAttribute('data-owned-here')).toBe('false')
    expect(note?.textContent).toContain('Owned by the Super Admin Platform Console.')
    expect(note?.querySelector('a')).toBeNull()
  })
})

describe('the deferral ruling, drawn', () => {
  it('no control on this screen is ever rendered disabled, in any persona or tenant state', () => {
    render(<PartsRegistryScreen />)
    for (const role of REACHING_ROLES) {
      viewAs(role)
      for (const state of ['active', ...SUSPENDED]) {
        setTenantState(state)
        // SCOPED TO THIS MODULE'S AFFORDANCES. The shell's own End-session
        // chrome control IS disabled under suspension — that is MOD-DOH-01's
        // gate travelling with its own control, not this card's. Sweeping the
        // whole document would fail on another module's correct behaviour.
        for (const button of affordanceButtons()) {
          expect(button.hasAttribute('disabled')).toBe(false)
          expect(button.getAttribute('aria-disabled')).not.toBe('true')
        }
        expect(document.querySelector('[data-kind="disabled"]')).toBeNull()
      }
    }
  })

  it('every absent row states a line where the control would sit — never an empty region', () => {
    render(<PartsRegistryScreen />)
    for (const role of REACHING_ROLES) {
      viewAs(role)
      for (const el of document.querySelectorAll<HTMLElement>('[data-kind="absent"]')) {
        expect((el.textContent ?? '').trim().length).toBeGreaterThan(20)
      }
    }
  })

  it('row 6 draws a stated line and NO link — there is no surface to send anyone to', () => {
    render(<PartsRegistryScreen />)
    for (const role of REACHING_ROLES) {
      viewAs(role)
      const el = document.querySelector<HTMLElement>(
        '[data-testid="affordance-type-a-part-number-on-the-floor"]',
      )
      expect(el?.getAttribute('data-kind')).toBe('absent')
      expect(el?.querySelector('a')).toBeNull()
      expect(el?.textContent).toContain('nobody types a part number on the floor')
    }
  })

  it('row 7 refuses every role including the Tenant Admin, and points nowhere', () => {
    render(<PartsRegistryScreen />)
    for (const role of REACHING_ROLES) {
      viewAs(role)
      const el = document.querySelector<HTMLElement>(
        '[data-testid="affordance-create-a-bom-recipe-sku-or-routing-entity"]',
      )
      expect(el?.getAttribute('data-kind')).toBe('absent')
      expect(el?.querySelector('a')).toBeNull()
    }
  })
})

describe('the two conditions, drawn', () => {
  it('the bulk upload is a control while active and a stated line under every suspension', () => {
    render(<PartsRegistryScreen />)
    expect(kindOf('bulk-upload-parts-by-csv')).toBe('control')
    for (const state of SUSPENDED) {
      setTenantState(state)
      expect(kindOf('bulk-upload-parts-by-csv')).toBe('absent')
      const el = document.querySelector<HTMLElement>(
        '[data-testid="affordance-bulk-upload-parts-by-csv"]',
      )
      expect(el?.textContent).toContain('blocked right now by the tenant state')
      // The refusal is a LINE, not a greyed button.
      expect(el?.querySelector('button')).toBeNull()
    }
  })

  it('archiving survives every tenant state — its condition is a consequence, not a gate', () => {
    render(<PartsRegistryScreen />)
    for (const state of ['active', ...SUSPENDED]) {
      setTenantState(state)
      expect(kindOf('archive-a-part')).toBe('control')
    }
  })
})

describe('the Worker, and the four roles that reach this screen', () => {
  it('the Worker is refused the whole route by D11, before any row renders', () => {
    render(<PartsRegistryScreen />)
    viewAs('WORKER')
    // The shell answers first, from the route registry. `Unavailable` on row 5
    // and no Hub route are the same withholding seen from two places.
    expect(screen.getByText(/Unavailable for the Worker view/)).toBeTruthy()
    for (const row of CONTROL_MATRIX) {
      expect(document.querySelector(`[data-testid="row-${row.id}"]`)).toBeNull()
    }
    for (const label of buttonLabels()) {
      expect(label).not.toMatch(/upload|archive|edit a part/i)
    }
  })

  it('the three read-only roles see the table and no write path', () => {
    render(<PartsRegistryScreen />)
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      viewAs(role)
      expect(kindOf('view-the-registry')).toBe('read-only')
      expect(kindOf('bulk-upload-parts-by-csv')).toBe('absent')
      expect(kindOf('edit-a-part-record')).toBe('absent')
      expect(kindOf('archive-a-part')).toBe('absent')
    }
  })

  it('the Read-only Auditor gets the open-decision line for the Studio, not a refusal', () => {
    render(<PartsRegistryScreen />)
    viewAs('READONLY_AUDITOR')
    const line = screen.getByTestId('open-decision-add-a-part-inline-during-authoring')
    expect(line.textContent).toContain('DEC-AUDSTU-001')
    expect(line.textContent).toContain('No link is drawn and none is refused')
  })

  it('the three Studio-opening roles get a checked link, never an asserted one', () => {
    render(<PartsRegistryScreen />)
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER']) {
      viewAs(role)
      const link = document
        .querySelector('[data-testid="affordance-add-a-part-inline-during-authoring"]')
        ?.querySelector('a')
      expect(link?.getAttribute('href')).toBe('/studio')
    }
    // The Worker never gets this far: the shell refuses the route outright.
    viewAs('WORKER')
    expect(
      document.querySelector('[data-testid="affordance-add-a-part-inline-during-authoring"]'),
    ).toBeNull()
  })
})

describe('the findings and the silences are on the page, not only in a comment', () => {
  it('prints all seven findings, including the six the plan did not list', () => {
    render(<PartsRegistryScreen />)
    for (const id of [
      'C2-inline-add-is-a-studio-act',
      'row-6-is-not-row-2',
      'row-6-is-a-restatement',
      'row-1-permissive-token-hides-a-total-block',
      'row-4-condition-is-not-a-gate',
      'part-state-vocabulary-splits-across-chapters',
      'studio-points-at-a-hub-row-that-does-not-exist',
    ]) {
      expect(screen.getByTestId(`finding-${id}`)).toBeTruthy()
    }
  })

  it('states the boundary-register gap rather than binding a row to the wrong owner', () => {
    render(<PartsRegistryScreen />)
    const gap = screen.getByTestId('register-gap').textContent ?? ''
    expect(gap).toContain('DohBoundaryId')
    expect(gap).toContain('render module-locally')
  })
})
