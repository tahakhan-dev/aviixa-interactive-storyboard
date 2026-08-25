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
  // 724 rows is a much bigger table than the legacy 432-row page, and
  // `getByRole('cell', ...)` computes an accessible name for every cell it
  // scans -- getByText on exact cell content is equivalent here (ids are
  // unique) and far cheaper, but the table is still large enough that a
  // slow CI runner needs more than the 5s default.
  it('the one genuinely duplicated row visibly states it represents 2 extracted entries', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByText('unnumbered@L74182', { selector: 'td' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "unnumbered@L74182" cell has no parent row')
    expect(within(row).getByText(/represents 2 extracted entries/i)).toBeTruthy()
  }, 15000)

  it('an ordinary, non-collapsed row carries no collapse statement', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByText('WF-VALUESTREAM', { selector: 'td' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "WF-VALUESTREAM" cell has no parent row')
    expect(within(row).queryByText(/extracted entries/i)).toBeNull()
  }, 15000)

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

// Fix round 2, §0: consolidating onto one shared row shape (fix round 1)
// flattened the Workflow Index from 8 columns to 5, silently dropping
// primary actor, surfaces touched and terminal states -- spec §7 columns,
// and the exact data Task 11's surface/actor filters need. Restored as
// workflow-only extension fields; these tests prove the restored columns
// actually render real per-row data, not just exist in the schema.
describe('/workflows/ spec §7 columns restored', () => {
  it('renders the primary actor for a real row', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByText('WF-VALUESTREAM', { selector: 'td' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "WF-VALUESTREAM" cell has no parent row')
    // R4-B07 added a derived "Participating roles" cell, which names the
    // same nine-role vocabulary this row's primary actor is written in, so
    // "Quality Manager" now legitimately appears twice in the row. The claim
    // under test is that the PRIMARY ACTOR cell renders real per-row data,
    // and it is asserted on that cell rather than on the row.
    const actorCell = within(row).getAllByRole('cell')[2]
    expect(actorCell?.textContent).toMatch(/Quality Manager/)
  }, 15000)

  it('renders the surfaces touched for a real row', () => {
    render(<WorkflowIndexPage />)
    const idCell = screen.getByText('WF-VALUESTREAM', { selector: 'td' })
    const row = idCell.closest('tr')
    if (row === null) throw new Error('fixture bug: "WF-VALUESTREAM" cell has no parent row')
    expect(within(row).getByText(/SURF-STU/)).toBeTruthy()
  }, 15000)

  it('column headers include primary actor, surfaces touched and terminal states', () => {
    render(<WorkflowIndexPage />)
    expect(screen.getByRole('columnheader', { name: /primary actor/i })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: /surfaces touched/i })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: /terminal states/i })).toBeTruthy()
    // R4-B07: the four master prompt §10.5 dimensions the index did not ship.
    // Held here as well as in tests/coverage/workflow-index.test.ts, because
    // this file is the one that renders the component rather than reading the
    // export, so a column lost in a refactor reds before the build runs.
    expect(screen.getByRole('columnheader', { name: /participating roles/i })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: /owning module/i })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: /primary objects/i })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: /variant coverage summary/i })).toBeTruthy()
  })
})
