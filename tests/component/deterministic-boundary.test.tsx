import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { DeterministicBoundary } from '@/ui/shared/DeterministicBoundary'
import {
  BOUNDARY_COLUMNS,
  BOUNDARY_COLUMN_IDS,
  BOUNDARY_PROVENANCE_CLASS,
  BOUNDARY_ROWS,
  DETERMINISTIC_SAFETY_STATEMENTS,
  boundaryRow,
  uniformlyProhibitedRows,
} from '@/ai/boundary/matrix'
import { AI_MODE_IDS } from '@/ai/modes'

/**
 * Slice 11, wave 1, task 8 — the deterministic boundary, against rendered
 * output.
 *
 * `tests/unit/ai-boundary.test.ts` proves the matrix as data against the
 * frozen source. This file proves the four things only a rendered tree can be
 * wrong about, and each of them is the difference between shipping the
 * source's meaning and shipping a paraphrase of it:
 *
 *   - A PROHIBITION SOFTENED BY ITS OWN SECOND CLAUSE. The Supervisor's
 *     release cell says both "no" and "you may ask". Rendered as one run of
 *     text those read as one hedged permission. So the cell is rendered and
 *     the word `Allowed` is required to appear NOWHERE inside it except
 *     inside the element that names the other act — which is a claim about
 *     the tree and cannot be made about the data.
 *   - A PATTERN BURIED IN IDENTICAL-LOOKING ROWS. The agent rows read the
 *     same prohibition four times each, and that uniformity is section 40.1's
 *     entire argument. It is required to render as its own statement naming
 *     its own rows, and to carry no number, because a number on a screen is a
 *     claim that stops measuring.
 *   - SAFETY DEGRADING AS A CONSEQUENCE OF AN AI STATE. The component is
 *     rendered under every one of the sixteen operating modes and the matrix
 *     markup is required to be byte-identical in all sixteen. A component
 *     that merely happens not to weaken the boundary today would pass a
 *     spot-check on one mode.
 *   - EXACTLY ONE PROVENANCE CLASS. Everything here is a deterministic rule,
 *     so one mark, and `PROV-4`.
 */

const RENDERED_MODE = 'AIMODE-05'

/** Whitespace-collapsed text, because JSX splits a sentence across nodes. */
const textOf = (element: Element | null): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim()

const cellFor = (root: HTMLElement, rowId: string, columnId: string): HTMLElement => {
  const cell = root.querySelector<HTMLElement>(
    `[data-component="${rowId}"] [data-column="${columnId}"]`,
  )
  if (cell === null) throw new Error(`No rendered cell for ${rowId} / ${columnId}.`)
  return cell
}

describe('the boundary matrix, rendered', () => {
  it('renders every row and every cell of the source’s table', () => {
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)

    for (const column of BOUNDARY_COLUMNS) {
      expect(textOf(container.querySelector(`[data-column-heading="${column.id}"]`))).toBe(
        column.heading,
      )
    }

    for (const row of BOUNDARY_ROWS) {
      const rendered = container.querySelector(`[data-component="${row.id}"]`)
      expect(rendered, `row ${row.id} is not rendered`).not.toBeNull()
      expect(textOf(rendered?.querySelector('[data-component-name]') ?? null)).toBe(row.component)

      for (const columnId of BOUNDARY_COLUMN_IDS) {
        const cell = cellFor(container, row.id, columnId)
        expect(cell.getAttribute('data-outcome')).toBe(row.cells[columnId].outcome)
        expect(textOf(cell.querySelector('[data-clause="outcome"]'))).toBe(
          row.cells[columnId].outcome,
        )
        const qualifier = row.cells[columnId].qualifier
        if (qualifier !== null) expect(textOf(cell)).toContain(qualifier)
      }
    }
  })

  it('states the absence where a component is not on the agent roster', () => {
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    for (const row of BOUNDARY_ROWS) {
      const absence = container.querySelector(
        `[data-component="${row.id}"] [data-roster-absence]`,
      )
      if (row.rosterAbsence === null) {
        expect(absence, `${row.id} renders an absence it does not have`).toBeNull()
      } else {
        expect(textOf(absence)).toBe(row.rosterAbsence)
      }
    }
  })
})

describe('the cell whose own text grants what the cell forbids', () => {
  const supervisor = boundaryRow('supervisor-human')

  it('leads with the prohibition and never with the affordance', () => {
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    const cell = cellFor(container, supervisor.id, 'releaseSeverity1Hold')

    expect(cell.getAttribute('data-outcome')).toBe('Explicitly prohibited')
    expect(textOf(cell.querySelector('[data-clause="outcome"]'))).toBe('Explicitly prohibited')
    expect(cell.querySelector('[data-clause="separate-act"]')).not.toBeNull()
  })

  it('confines every trace of a permission to the element naming the other act', () => {
    // This is the assertion the data cannot make. Remove the element that
    // names the request, and what is left of the cell must read as a flat
    // prohibition -- no "Allowed", no "may", nothing a reader could take as a
    // softening of the sentence above it.
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    const cell = cellFor(container, supervisor.id, 'releaseSeverity1Hold')

    expect(textOf(cell)).toContain('Allowed')

    const stripped = cell.cloneNode(true) as HTMLElement
    for (const node of Array.from(stripped.querySelectorAll('[data-clause="separate-act"]'))) {
      node.remove()
    }
    expect(textOf(stripped)).toBe('Explicitly prohibited')
  })

  it('names the other act, what it reads, and where the source grants it', () => {
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    const act = supervisor.cells.releaseSeverity1Hold.separateAct
    if (act === null) throw new Error('The separate act is missing from the data.')

    const rendered = textOf(
      cellFor(container, supervisor.id, 'releaseSeverity1Hold').querySelector(
        '[data-clause="separate-act"]',
      ),
    )
    expect(rendered).toContain(act.act)
    expect(rendered).toContain(act.outcomeElsewhere)
    expect(rendered).toContain(act.grantedAt)
    expect(rendered).toContain(act.reading)
  })

  it('renders no separate-act element on any other cell', () => {
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    const carrying = Array.from(container.querySelectorAll('[data-clause="separate-act"]')).map(
      (node) => node.closest('[data-column]')?.getAttribute('data-column'),
    )
    expect(carrying).toEqual(['releaseSeverity1Hold'])
  })
})

describe('the uniformity that is section 40.1’s argument', () => {
  it('renders as its own statement, naming its own rows', () => {
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    const named = Array.from(container.querySelectorAll('[data-uniform-agent]')).map((node) =>
      textOf(node),
    )
    expect(named).toEqual(uniformlyProhibitedRows().map((row) => row.component))
    expect(named.length).toBeGreaterThan(0)
  })

  it('carries no count of them on the screen', () => {
    // A number here is a second claim about the same list, and it is the one
    // that goes stale silently. The list is the claim.
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    const block = container.querySelector('[data-uniform-agent-pattern]')
    expect(block).not.toBeNull()
    expect(textOf(block)).not.toMatch(/\b(\d+|one|two|three|four|five|six|seven|eight)\b/i)
  })
})

describe('the deterministic standing under an artificial-intelligence state', () => {
  it('reads Allowed under every one of the operating modes', () => {
    for (const mode of AI_MODE_IDS) {
      const { container, unmount } = render(<DeterministicBoundary mode={mode} />)
      const safety = container.querySelectorAll('[data-deterministic-safety]')
      expect(safety.length).toBe(1)
      expect(textOf(safety[0] ?? null)).toBe('Allowed')
      unmount()
    }
  })

  it('renders the identical matrix markup under every mode', () => {
    // The strong form. A component that merely happens not to weaken the
    // boundary in the mode a spot-check picked would pass the assertion
    // above and fail this one.
    const markupPerMode = AI_MODE_IDS.map((mode) => {
      const { container, unmount } = render(<DeterministicBoundary mode={mode} />)
      const markup = container.querySelector('[data-boundary-matrix]')?.outerHTML ?? ''
      unmount()
      return markup
    })
    expect((markupPerMode[0] ?? '').length).toBeGreaterThan(0)
    expect(new Set(markupPerMode).size).toBe(1)
  })

  it('still says which state it is speaking about', () => {
    const labels = AI_MODE_IDS.map((mode) => {
      const { container, unmount } = render(<DeterministicBoundary mode={mode} />)
      const label = textOf(container.querySelector('[data-mode-standing]'))
      unmount()
      return label
    })
    expect(new Set(labels).size).toBeGreaterThan(1)
  })

  it('renders each source statement with the line it is on', () => {
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    const rendered = Array.from(container.querySelectorAll('[data-safety-statement]')).map((n) =>
      textOf(n),
    )
    expect(rendered.length).toBe(DETERMINISTIC_SAFETY_STATEMENTS.length)
    DETERMINISTIC_SAFETY_STATEMENTS.forEach((statement, index) => {
      expect(rendered[index]).toContain(statement.sourceRef)
      expect(rendered[index]).toContain(statement.scope)
    })
  })
})

describe('provenance', () => {
  it('emits exactly one class, and it is the deterministic-rules class', () => {
    const { container } = render(<DeterministicBoundary mode={RENDERED_MODE} />)
    const marks = container.querySelectorAll('[data-provenance-class]')
    expect(marks.length).toBe(1)
    expect(marks[0]?.getAttribute('data-provenance-class')).toBe(BOUNDARY_PROVENANCE_CLASS)
  })
})
