import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AuditAndRetentionScreen } from '../../app/hub/audit-and-retention/AuditAndRetentionScreen'
import {
  AUDIT_FAILURE_GRADING,
  AUDIT_TAXONOMY,
  CONTROL_MATRIX,
} from '@/surfaces/doh/modules/doh-11/matrix'
import { SEEDED_AUDIT_EVENTS } from '@/surfaces/doh/modules/doh-11/fixtures'

/**
 * `SCR-DOH-20`, drawn.
 *
 * WHAT THIS FILE IS FOR. The unit suite proves the SELECTOR and the FOLD
 * return the right answers. This one proves the SCREEN cannot draw an event
 * the selector did not return and cannot draw a control the fold did not
 * return. Those are different failures, so the assertions sweep the rendered
 * document rather than checking the things the screen meant to draw.
 */

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setStore(state: 'writable' | 'unavailable'): void {
  fireEvent.change(screen.getByTestId('audit-store-select'), { target: { value: state } })
}

function kindOf(id: string): string | null {
  return (
    document
      .querySelector<HTMLElement>(`[data-testid="affordance-${id}"]`)
      ?.getAttribute('data-kind') ?? null
  )
}

/** Every affordance kind rendered, by row. The sweep, not a spot check. */
function renderedKinds(): readonly (string | null)[] {
  return CONTROL_MATRIX.map((row) => kindOf(row.id))
}

/** The accessible reason a disabled control carries, resolved through aria. */
function disabledReasonOf(button: HTMLElement): string {
  const id = button.getAttribute('aria-describedby')
  if (id === null) return ''
  return (document.getElementById(id)?.textContent ?? '').trim()
}

const ALL_TEXT = (): string => document.body.textContent ?? ''

describe('MOD-DOH-11 — the screen names itself and derives its own reach', () => {
  it('carries the module and catalogue-B identifiers and the route path', () => {
    render(<AuditAndRetentionScreen />)
    expect(screen.getByText(/MOD-DOH-11 · SCR-DOH-20 · \/hub\/audit-and-retention/)).toBeTruthy()
  })

  it('prints the reach derived from the matrix, and it is the three catalogue B admits', () => {
    render(<AuditAndRetentionScreen />)
    const reach = screen.getByTestId('derived-reach').textContent ?? ''
    expect(reach).toContain('TENANT_ADMIN')
    expect(reach).toContain('QUALITY_MANAGER')
    expect(reach).toContain('READONLY_AUDITOR')
    expect(reach).not.toContain('SUPERVISOR')
    expect(reach).not.toContain('WORKER')
  })
})

describe('the routing branch renders DISABLED with its named reason, never ABSENT', () => {
  it('draws the Quality Manager’s full-log cell as a disabled control', () => {
    render(<AuditAndRetentionScreen />)
    viewAs('QUALITY_MANAGER')
    // The whole point: `disabled`, and specifically NOT `absent`.
    expect(kindOf('read-the-full-tenant-audit-log')).toBe('disabled')
    expect(kindOf('read-the-full-tenant-audit-log')).not.toBe('absent')
  })

  it('carries the cell’s own named permission, the adjacent row and the decision', () => {
    render(<AuditAndRetentionScreen />)
    viewAs('QUALITY_MANAGER')
    const host = screen.getByTestId('affordance-read-the-full-tenant-audit-log')
    const button = host.querySelector('button')
    expect(button).not.toBeNull()
    if (button === null) throw new Error('unreachable')
    // Presence of a button is NOT the assertion — a slice-9 test that
    // asserted only presence was satisfied by an `aria-disabled` control that
    // did nothing. This asserts the state AND the reason, resolved through
    // `aria-describedby` rather than read off adjacent text.
    expect(button.getAttribute('aria-disabled')).toBe('true')
    const reason = disabledReasonOf(button)
    expect(reason).toContain('scoped to Summary and run-state events only')
    expect(reason).toContain('Read Summary and run-state audit events')
    expect(reason).toContain('L28866')
    expect(reason).toContain('DEC-AUDITQM-001')
  })

  it('draws exactly one disabled affordance for the Quality Manager, and none for the others', () => {
    render(<AuditAndRetentionScreen />)
    viewAs('QUALITY_MANAGER')
    expect(renderedKinds().filter((k) => k === 'disabled')).toHaveLength(1)
    for (const role of ['TENANT_ADMIN', 'READONLY_AUDITOR', 'SUPERVISOR'] as const) {
      viewAs(role)
      expect(renderedKinds().filter((k) => k === 'disabled')).toHaveLength(0)
    }
  })

  it('draws every one of the ten rows for every role that reaches the screen', () => {
    render(<AuditAndRetentionScreen />)
    for (const role of ['TENANT_ADMIN', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'SUPERVISOR'] as const) {
      viewAs(role)
      // A null here is a row that drew nothing at all, which is different
      // from a row that drew ABSENT with its reason.
      expect(renderedKinds().filter((k) => k === null), role).toHaveLength(0)
      expect(renderedKinds()).toHaveLength(10)
    }
  })

  it('gives the Tenant Admin and the Auditor a read on that same row, not a disabled control', () => {
    render(<AuditAndRetentionScreen />)
    for (const role of ['TENANT_ADMIN', 'READONLY_AUDITOR'] as const) {
      viewAs(role)
      expect(kindOf('read-the-full-tenant-audit-log')).toBe('read-only')
    }
  })
})

describe('scope is enforced in what the screen READ', () => {
  it('lists the full log for the Tenant Admin and the Auditor, own tenant only', () => {
    render(<AuditAndRetentionScreen />)
    for (const role of ['TENANT_ADMIN', 'READONLY_AUDITOR'] as const) {
      viewAs(role)
      expect(screen.getByTestId('scope-line').getAttribute('data-licence')).toBe('full')
      expect(screen.getByTestId('scope-line').textContent).toBe(
        'You are reading the full tenant audit log.',
      )
      // The positive control first: the register the selector filtered is
      // real and reached the document.
      expect(ALL_TEXT()).toContain('AUD-BB-000001')
      expect(ALL_TEXT()).toContain('AUD-BB-000412')
      // And the other tenant's two rows are nowhere in the document at all —
      // not hidden, not styled away, not present.
      expect(ALL_TEXT()).not.toContain('AUD-NP-')
      expect(ALL_TEXT()).not.toContain('Northpoint')
    }
  })

  it('lists exactly the two scoped classes for the Quality Manager', () => {
    render(<AuditAndRetentionScreen />)
    viewAs('QUALITY_MANAGER')
    expect(screen.getByTestId('scope-line').getAttribute('data-licence')).toBe('scoped')
    expect(screen.getByTestId('scope-line').textContent).toBe(
      'You are reading Summary and run-state events.',
    )
    expect(ALL_TEXT()).toContain('AUD-BB-000001')
    expect(ALL_TEXT()).toContain('AUD-BB-000201')
    // The classes this reader may not read are not in the document either.
    expect(ALL_TEXT()).not.toContain('AUD-BB-000412')
    expect(ALL_TEXT()).not.toContain('AUD-NP-')
  })

  it('offers the Supervisor no table at all, and names the roles that do hold the read', () => {
    render(<AuditAndRetentionScreen />)
    viewAs('SUPERVISOR')
    const note = screen.getByTestId('audit-read-absent')
    expect(note.textContent).toContain('No audit read is offered to this role')
    // STATE-05's second half: the roles that DO carry it, so the refusal is
    // not hidden behind a missing table.
    expect(note.textContent).toContain('Tenant Admin')
    expect(note.textContent).toContain('Read-only Auditor')
    expect(screen.queryByTestId('scope-line')).toBeNull()
    expect(ALL_TEXT()).not.toContain('AUD-BB-')
    expect(ALL_TEXT()).not.toContain('AUD-NP-')
  })

  it('does not offer the Worker the screen at all — D11, at the shell', () => {
    render(<AuditAndRetentionScreen />)
    viewAs('WORKER')
    expect(screen.getByText(/Unavailable for the Worker view/)).toBeTruthy()
    expect(screen.queryByTestId('scope-line')).toBeNull()
    expect(screen.queryByTestId('audit-read-absent')).toBeNull()
    expect(ALL_TEXT()).not.toContain('AUD-BB-')
  })
})

describe('audit failure is graded, and one banner would be wrong', () => {
  it('leaves the export control live and unexplained while the store is writable', () => {
    render(<AuditAndRetentionScreen />)
    const button = screen.getByTestId('export-gate').querySelector('button')
    if (button === null) throw new Error('no export control')
    expect(screen.getByTestId('export-gate').getAttribute('data-kind')).toBe('control')
    expect(button.getAttribute('aria-disabled')).toBeNull()
    expect(screen.queryByTestId('degraded-banner')).toBeNull()
  })

  it('halts the export and CONTINUES the read in the same state', () => {
    render(<AuditAndRetentionScreen />)
    setStore('unavailable')

    // Halt, with its own reason in the accessibility tree.
    expect(screen.getByTestId('export-gate').getAttribute('data-kind')).toBe('halted')
    const button = screen.getByTestId('export-gate').querySelector('button')
    if (button === null) throw new Error('no export control')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    const reason = disabledReasonOf(button)
    expect(reason).toContain('the record system is unavailable')
    expect(reason).toContain('no file is produced')
    expect(reason).toContain('nothing is queued for later')

    // Continue, in the same render. This is the assertion one banner cannot
    // make: the table is still there with its rows.
    expect(screen.getByTestId('scope-line').getAttribute('data-licence')).toBe('full')
    expect(ALL_TEXT()).toContain('AUD-BB-000001')
  })

  it('states the halt and the continue as two different sentences, not one banner', () => {
    render(<AuditAndRetentionScreen />)
    setStore('unavailable')
    expect(screen.getByTestId('degraded-banner').textContent).toBe(
      'Some actions are paused because the record system is unavailable. Nothing has been lost.',
    )
    expect(screen.getByTestId('graded-read').textContent).toContain('Reading continues')
    expect(screen.getByTestId('graded-export').textContent).toContain('Export halts')
    // Two distinct nodes, so a single banner cannot satisfy both reads.
    expect(screen.getByTestId('graded-read')).not.toBe(screen.getByTestId('graded-export'))
    expect(screen.getByTestId('no-unaudited-success').textContent).toContain(
      'Nothing on this screen reports a completed action whose audit could not commit',
    )
    expect(screen.getByTestId('read-conflict').textContent).toContain('audit read access by identity')
  })

  it('reports no produced export anywhere while the store is unavailable', () => {
    render(<AuditAndRetentionScreen />)
    setStore('unavailable')
    for (const claim of [/export complete/i, /file (is )?ready/i, /download your export/i]) {
      expect(claim.test(ALL_TEXT()), String(claim)).toBe(false)
    }
    // Positive control for the three patterns above.
    expect([/export complete/i, /file (is )?ready/i, /download your export/i].filter((r) =>
      r.test('Export complete. Your file is ready — download your export.'),
    )).toHaveLength(3)
  })

  it('renders the graded register’s nine rows and both of its continue rows', () => {
    render(<AuditAndRetentionScreen />)
    expect(AUDIT_FAILURE_GRADING).toHaveLength(9)
    for (const grade of AUDIT_FAILURE_GRADING) {
      expect(ALL_TEXT()).toContain(grade.actionClass)
    }
    expect(ALL_TEXT()).toContain('Reads outside access sessions')
    expect(ALL_TEXT()).toContain('Frontline capture and step execution')
  })
})

describe('the claims this screen may not make, and the ones it must', () => {
  it('states plainly that V1 append-only is not cryptographic tamper-evidence', () => {
    render(<AuditAndRetentionScreen />)
    const text = screen.getByTestId('v1-limits').textContent ?? ''
    expect(text).toContain('append-only access control')
    expect(text).toContain('not a cryptographic one')
    expect(text).toContain('deferred beyond V1')
  })

  it('renders both taxonomy numbers and never only one of them', () => {
    render(<AuditAndRetentionScreen />)
    const text = screen.getByTestId('taxonomy-counts').textContent ?? ''
    expect(text).toContain('enumerates 12 classes')
    expect(text).toContain('13-class taxonomy')
    for (const c of AUDIT_TAXONOMY) {
      expect(screen.getByTestId(`taxonomy-${c.id}`).textContent).toContain(c.stated)
    }
  })

  it('cites four decisions through the one canon renderer and restates none of them', () => {
    render(<AuditAndRetentionScreen />)
    for (const id of [
      'DEC-AUDITQM-001',
      'DEC-AUDITSUP-001',
      'DEC-AUDITHASH-001',
      'DEC-AUDITOFF-001',
    ]) {
      const notes = screen.getAllByRole('note', { name: `Open decision ${id}` })
      // Exactly one home per decision. Two would be the trap the canon exists
      // to prevent, and zero would be a citation nobody can open.
      expect(notes, id).toHaveLength(1)
      expect(notes[0]?.textContent).toContain('A client-delegated choice under APP-012')
    }
  })

  it('names the three retention decisions the canon does not hold, without inventing readings', () => {
    render(<AuditAndRetentionScreen />)
    const text = screen.getByTestId('retention-open-items').textContent ?? ''
    for (const id of ['DEC-RETRIEVE-001', 'DEC-DELETE-001', 'DEC-ANON-001']) {
      expect(text).toContain(id)
      // And no second disclosure panel for any of them.
      expect(screen.queryAllByRole('note', { name: `Open decision ${id}` })).toHaveLength(0)
    }
  })
})

describe('the screen cannot draw more than the selector handed it', () => {
  it('lists no event identifier the seeded register does not contain', () => {
    render(<AuditAndRetentionScreen />)
    const drawn = (ALL_TEXT().match(/AUD-[A-Z]+-\d{6}/g) ?? []).sort()
    const known = SEEDED_AUDIT_EVENTS.map((e) => e.eventId)
    expect(drawn.length).toBeGreaterThan(0)
    for (const id of drawn) expect(known, id).toContain(id)
  })
})
