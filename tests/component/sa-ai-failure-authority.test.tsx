import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiFailureAuthorityPanel } from '@/ui/sa/AiFailureAuthorityPanel'
import { provenanceClass } from '@/ai/provenance/classes'
import {
  CONSOLE_AUTHORITY_ROWS,
  CONSOLE_AUTHORITY_SEAMS,
  UNDECIDED_AUTHORITY_ROWS,
  consoleAuthorityRow,
} from '@/surfaces/sa/ai-failure-authority'

/**
 * Slice 11, wave 2, task 9 — the authority matrix against rendered output.
 *
 * `tests/unit/sa-ai-failure-authority.test.ts` proves the matrix as data
 * against the frozen bytes. This file proves the four things only a tree can
 * be wrong about:
 *
 *   - AN UNDECIDED CONTROL DRAWN AS A WORKING ONE, OR NOT DRAWN AT ALL. Both
 *     are false claims and they are opposite. The panel is required to draw
 *     each undecided row AND to contain no operable element anywhere — no
 *     `button`, no `input`, no `switch`, and no `aria-disabled`, because a
 *     greyed-out toggle invites the belief that a sufficiently privileged
 *     account could enable it, and a slice-9 test was satisfied by exactly
 *     that token.
 *   - A CELL THAT READS TWO WAYS, SUMMARISED INTO ONE. The kill switch's
 *     Platform Engineer cell grants and defers in the same sentence. Both
 *     halves are required in the rendered text.
 *   - AN ATTRIBUTION A READER REACHES AFTER THE PERMISSIONS. Document order
 *     is asserted: the attribution note precedes the table.
 *   - A SECOND HOME FOR ONE DECISION. The three canonised decisions are
 *     required to render through the canon's own component, and the two that
 *     are not in the canon are required to render as seams with no local
 *     readings of their own.
 */

const OPERABLE = 'button, input, select, textarea, a[href], [role="button"], [role="switch"], [contenteditable="true"]'

describe('AiFailureAuthorityPanel', () => {
  it('renders every control the source names, with the line it came from', () => {
    const { container } = render(<AiFailureAuthorityPanel />)
    CONSOLE_AUTHORITY_ROWS.forEach((row) => {
      const rendered = container.querySelector(`[data-authority-row="${row.id}"]`)
      expect(rendered, `${row.id} is missing from the table`).not.toBeNull()
      expect(rendered?.textContent).toContain(row.operation)
      expect(rendered?.textContent).toContain(row.sourceRef)
    })
  })

  /**
   * THE SOURCE'S WORDS, AND THE PARSED OUTCOME BESIDE THEM. Found by planting:
   * printing `ColumnCell.detail` put "Allowed, stated bare in the source" into
   * eleven permission cells — a sentence the parser supplies to satisfy
   * L10238's no-blank-cells rule, correct as data and false as an authority
   * statement. So the cell's TEXT is required to be the source's, and its
   * `data-outcome` is required to be the parser's, on the same element.
   */
  it('renders every cell of every row, in the source’s own words', () => {
    const { container } = render(<AiFailureAuthorityPanel />)
    CONSOLE_AUTHORITY_ROWS.forEach((row) => {
      const rendered = container.querySelector(`[data-authority-row="${row.id}"]`)
      const drawn = [...(rendered?.querySelectorAll('td[data-outcome]') ?? [])]
      expect(drawn.map((td) => td.getAttribute('data-outcome')), row.id).toEqual(
        row.renderedCells.map((cell) => cell.outcome),
      )
      expect(drawn.map((td) => td.textContent), row.id).toEqual(
        row.renderedCells.map((cell) => cell.verbatim),
      )
      expect(rendered?.textContent).not.toContain('stated bare in the source')
      expect(rendered?.textContent).toContain(row.classification)
    })
  })

  it('draws every undecided row and offers no control anywhere on the panel', () => {
    const { container } = render(<AiFailureAuthorityPanel />)
    UNDECIDED_AUTHORITY_ROWS.forEach((row) => {
      const lock = container.querySelector(`[data-locked-control="sa-ai-failure-${row.id}"]`)
      expect(lock, `${row.id} renders no locked control`).not.toBeNull()
      // The row VERBATIM, not a summary of it.
      expect(lock?.textContent).toContain(row.verbatim)
    })
    expect(container.querySelectorAll(OPERABLE)).toHaveLength(0)
    expect(container.querySelectorAll('[aria-disabled]')).toHaveLength(0)
    expect(container.querySelectorAll('[disabled]')).toHaveLength(0)
  })

  it('renders the site-scoped pause as neither an absent scope nor a working one', () => {
    const { container } = render(<AiFailureAuthorityPanel />)
    const row = consoleAuthorityRow('site-scoped-pause')
    const lock = container.querySelector(`[data-locked-control="sa-ai-failure-${row.id}"]`)
    expect(lock, 'the site-scoped pause row draws no locked control').not.toBeNull()
    expect(lock?.textContent).toContain('Site-scoped pause')
    expect(lock?.textContent).toContain('DEC-AIPAUSE-001')
    // Three of its four role cells defer and the fourth refuses; both readings
    // are on screen because the whole row is.
    expect(lock?.textContent).toContain('Client Decision Required')
    expect(lock?.textContent).toContain('Explicitly prohibited')
    expect(lock?.querySelectorAll(OPERABLE)).toHaveLength(0)
  })

  it('renders the kill switch’s Platform Engineer cell whole, both readings intact', () => {
    const { container } = render(<AiFailureAuthorityPanel />)
    const row = consoleAuthorityRow('runaway-loop-kill-switch')
    const lock = container.querySelector(`[data-locked-control="sa-ai-failure-${row.id}"]`)
    const text = lock?.textContent ?? ''
    // The permissive half and the deferring half, in one cell.
    expect(text).toContain('applies under a declared emergency with post-hoc approval')
    expect(text).toContain('subject to client decision')
    // And the classification's own deferral, which is where this row's
    // undecidedness lives — no role cell carries it.
    expect(text).toContain('the emergency-application path is')
  })

  it('puts the attribution note before the first permission cell', () => {
    const { container } = render(<AiFailureAuthorityPanel />)
    const attribution = container.querySelector('[data-testid="authority-attribution"]')
    const table = container.querySelector('table')
    expect(attribution).not.toBeNull()
    expect(table).not.toBeNull()
    if (attribution === null || table === null) throw new Error('unreachable')
    expect(
      attribution.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(attribution?.textContent).toContain('The source assigns this matrix to no module.')
    expect(attribution?.textContent).toContain('MOD-SA-07')
    expect(attribution?.textContent).toContain('APP-012')
  })

  it('discloses the three canonised decisions through the canon’s own component', () => {
    render(<AiFailureAuthorityPanel />)
    ;['DEC-AIFAILOVER-001', 'DEC-AIQUAR-001', 'DEC-AIREPLAY-001'].forEach((id) => {
      const note = screen.getByRole('note', { name: `Open decision ${id}` })
      expect(note.textContent).toContain('A client-delegated choice under APP-012')
    })
  })

  it('carries the two uncanonised identifiers as seams, with no readings of its own', () => {
    const { container } = render(<AiFailureAuthorityPanel />)
    const seams = container.querySelector('[data-testid="authority-seams"]')
    expect(seams?.textContent).toContain('DEC-AIPAUSE-001')
    expect(seams?.textContent).toContain('DEC-KILL-001')
    CONSOLE_AUTHORITY_SEAMS.forEach((seam) => {
      const row = container.querySelector(`[data-seam="${seam.id}"]`)
      expect(row, `${seam.id} is not rendered`).not.toBeNull()
      expect(row?.textContent).toContain(seam.owner)
      expect(row?.textContent).toContain(seam.ownerTask)
    })
    // Neither uncanonised identifier may acquire a disclosure note here: that
    // is the second home the canon exists to prevent.
    expect(screen.queryByRole('note', { name: 'Open decision DEC-AIPAUSE-001' })).toBeNull()
    expect(screen.queryByRole('note', { name: 'Open decision DEC-KILL-001' })).toBeNull()
  })

  it('emits exactly one provenance class, and it is the deterministic-rule one', () => {
    const { container } = render(<AiFailureAuthorityPanel />)
    const marks = container.querySelectorAll('[data-provenance-class]')
    expect(marks).toHaveLength(1)
    expect(marks[0]?.getAttribute('data-provenance-class')).toBe('PROV-4')
    // The MARKER, not just the attribute: the six markers are pairwise
    // distinct and this is the deterministic-rule one, so a panel that
    // silently emitted a live class would change this text as well as the
    // attribute.
    expect(marks[0]?.querySelector('[data-testid="provenance-marker"]')?.textContent).toBe(
      provenanceClass('PROV-4').markerText,
    )
  })
})
