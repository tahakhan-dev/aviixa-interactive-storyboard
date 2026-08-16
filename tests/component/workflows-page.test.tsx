import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import WorkflowIndexPage from '../../app/workflows/page'

// Honesty defect (post-handoff review): the "unnumbered" row on /workflows/
// stands for 199 raw extraction entries and "unstated" for 66, with nothing
// on the page telling a reader either row is anything but one ordinary
// record. These tests prove the page now says so, visibly, in the row
// itself -- and only in rows that actually collapsed.
describe('/workflows/ collapse honesty', () => {
  it('the "unnumbered" row visibly states how many extracted entries it represents', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByRole('cell', { name: 'unnumbered' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "unnumbered" cell has no parent row')
    expect(within(row).getByText(/199 extracted entries/i)).toBeTruthy()
    expect(within(row).getByText(/distinct identifiers/i)).toBeTruthy()
  })

  it('the "unstated" row visibly states how many extracted entries it represents', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByRole('cell', { name: 'unstated' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "unstated" cell has no parent row')
    expect(within(row).getByText(/66 extracted entries/i)).toBeTruthy()
  })

  it('an ordinary, non-collapsed row carries no collapse statement', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByRole('cell', { name: 'WF-VALUESTREAM' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "WF-VALUESTREAM" cell has no parent row')
    expect(within(row).queryByText(/extracted entries/i)).toBeNull()
  })

  it('never says "432 workflows" and keeps the no-single-total caveat', () => {
    const { container } = render(<WorkflowIndexPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/432\s+workflows\b/i)
    expect(text).toMatch(/MODULE count/)
  })

  it('states near the count caveat that some rows represent multiple extracted entries, with a total', () => {
    const { container } = render(<WorkflowIndexPage />)
    const text = container.textContent ?? ''
    // 325 raw entries collapse into the 32 rows whose id repeats in the raw
    // extraction (2 placeholder ids + 30 real ids the extraction reused).
    expect(text).toMatch(/325/)
    expect(text).toMatch(/more than one extracted entry/i)
  })
})
