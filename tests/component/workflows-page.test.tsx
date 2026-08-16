import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import WorkflowIndexPage from '../../app/workflows/page'

// Fix round 1 (defect 3): this page used to read the retired 432-row
// registries/generated/workflow-registry.json; it now reads the ONE
// workflows registry (registries/generated/workflows.json, 724 composite-
// keyed rows) through the same GeneratedRegistrySchema loader every other
// registry uses. These tests replace the ones written against the legacy
// file's bare "unnumbered"/"unstated" rows, which no longer exist as such
// -- composite keying gives each distinct passage its own row.
describe('/workflows/ collapse honesty', () => {
  it('the one genuinely duplicated row visibly states it represents 2 extracted entries', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByRole('cell', { name: 'unnumbered@L74182' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "unnumbered@L74182" cell has no parent row')
    expect(within(row).getByText(/represents 2 extracted entries/i)).toBeTruthy()
  })

  it('an ordinary, non-collapsed row carries no collapse statement', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByRole('cell', { name: 'WF-VALUESTREAM' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "WF-VALUESTREAM" cell has no parent row')
    expect(within(row).queryByText(/extracted entries/i)).toBeNull()
  })

  it('never says "724 workflows" or "725 workflows" and keeps the no-single-total caveat', () => {
    const { container } = render(<WorkflowIndexPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/724\s+workflows\b/i)
    expect(text).not.toMatch(/725\s+workflows\b/i)
    expect(text).toMatch(/MODULE count/)
  })

  it('states the extraction arithmetic near the count caveat: 725 extracted, 1 duplicate merged, 724 rows', () => {
    const { container } = render(<WorkflowIndexPage />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/725/)
    expect(text).toMatch(/724/)
    expect(text).toMatch(/duplicate merged/i)
  })
})
