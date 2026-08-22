import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { SyncConflictReviewPanel } from '@/surfaces/cc/modules/cc-10/SyncConflictReviewPanel'
import { CC10_COLUMNS, CC10_MATRIX } from '@/surfaces/cc/modules/cc-10/matrix'
import {
  CC10_DISCLOSURES,
  CC10_SECOND_TREATMENT,
} from '@/surfaces/cc/modules/cc-10/service'

/**
 * `MOD-CC-10` RENDERED, against the frozen source parsed at run time.
 *
 * The unit suite proves the transcription matches the source; this one proves
 * the SCREEN matches the source. Neither can pass by agreeing with the other —
 * both read L38082-L38091 at run time — so there is no gap between them for a
 * correct data table with a wrong screen to hide in.
 *
 * EVERY CELL IS READ THROUGH ITS OWN `data-testid` AND COMPARED FOR EXACT
 * EQUALITY, never by sweeping `textContent` for a word. Both defeats this
 * build has recorded are live in this table: a sweep is beaten by element
 * concatenation, and `Allowed` is a prefix of `Allowed with conditions —
 * individually only; never through Resolve All`, which is the single most
 * safety-bearing cell in the module. A `toContain('Allowed')` on the panel
 * would be green with that cell deleted, with it inverted, and with it
 * replaced by the unconditional token.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const sourceLines = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const L = (n: number): string => {
  const line = sourceLines[n - 1]
  if (line === undefined) throw new Error(`frozen source has no line ${n}`)
  return line
}
const cellsOf = (n: number): string[] =>
  L(n)
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim().replace(/`/g, ''))

describe('SCR-CC-10 — the matrix, rendered cell by cell against L38084-L38091', () => {
  it('draws all forty cells with the source’s own text, matched exactly', () => {
    render(<SyncConflictReviewPanel />)
    const headers = cellsOf(38082)
    let compared = 0
    for (let n = 38084; n <= 38091; n += 1) {
      const ordinal = n - 38083
      const cells = cellsOf(n)
      const capability = cells[0]
      if (capability === undefined) throw new Error(`L${n} has no capability cell`)
      expect(within(screen.getByTestId(`cc10-row-${ordinal}`)).getByText(capability)).toBeTruthy()
      for (const column of CC10_COLUMNS) {
        const at = headers.indexOf(column)
        expect(at).toBeGreaterThan(0)
        const el = screen.getByTestId(`cc10-cell-${ordinal}-${column}`)
        // Exact equality on the element's own text. Not `toContain`, which
        // "Allowed" satisfies against "Allowed with conditions — ...".
        expect(el.textContent).toBe(cells[at])
        compared += 1
      }
    }
    expect(compared).toBe(40)
  })

  it('renders the persona columns in the source’s own order, Tenant Admin first', () => {
    render(<SyncConflictReviewPanel />)
    const table = screen.getByTestId('cc10-matrix')
    const rendered = within(table)
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(rendered).toEqual(cellsOf(38082))
    expect(rendered[1]).toBe('Tenant Admin')
    expect(rendered[rendered.length - 1]).toBe('Worker')
  })

  it('the skew-flagged cell renders its CONDITION, not a bare grant', () => {
    render(<SyncConflictReviewPanel />)
    const el = screen.getByTestId('cc10-cell-5-Quality Manager')
    expect(el.textContent).toBe(cellsOf(38088)[3])
    expect(el.textContent).toContain('individually only; never through Resolve All')
    // And it is NOT the unconditional token, stated separately because the
    // equality above would also hold if the source were misread the same way.
    expect(el.textContent).not.toBe('Allowed')
  })

  it('nothing in the panel is hidden from view', () => {
    // `getByTestId` finds hidden elements and `textContent` reads them, so a
    // `hidden` attribute has beaten a rendering gate in this build before.
    const { container } = render(<SyncConflictReviewPanel />)
    expect(container.querySelectorAll('[hidden]')).toHaveLength(0)
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
  })

  it('the module id reaches the DOM as a string, not as `undefined`', () => {
    // The slice-7 defect this module is shaped to make impossible: four panels
    // shipped `fl-panel-undefined` because their data crossed a client
    // boundary. Asserted on the rendered text rather than on the constant.
    render(<SyncConflictReviewPanel />)
    const el = screen.getByTestId('cc10-module-id')
    expect(el.textContent).toContain('MOD-CC-10')
    expect(el.textContent).not.toContain('undefined')
  })
})

describe('SCR-CC-10 — the storyboard, and its arithmetic on screen', () => {
  it('renders SB-CC-21’s header, entry, both versions and its verdict', () => {
    render(<SyncConflictReviewPanel />)
    expect(screen.getByTestId('cc10-storyboard-header').textContent).toBe(
      L(38146).replace(/^Header: "/, '').replace(/"\.$/, ''),
    )
    expect(screen.getByTestId('cc10-verdict').textContent).toBe(
      L(38155).replace(/^"/, '').replace(/"$/, ''),
    )
    for (const n of [38152, 38153]) {
      const cells = cellsOf(n)
      const row = screen.getByTestId(`cc10-version-${cells[0]}`)
      expect(
        within(row)
          .getAllByRole('cell')
          .map((c) => c.textContent),
      ).toEqual(cells.slice(1))
    }
  })

  it('shows the Resolve All control’s own count, and the exclusion beside it', () => {
    render(<SyncConflictReviewPanel />)
    const controls = screen.getByTestId('cc10-controls')
    expect(controls.textContent).toContain('Resolve All (2 ordinary conflicts; 1 skew-flagged')
    expect(L(38157)).toContain('Resolve All (2 ordinary conflicts; 1 skew-flagged conflict excluded)')
    expect(screen.getByTestId('cc10-resolve-all-exclusion').textContent).toContain(
      'Bulk acceptance is not review',
    )
  })

  it('draws NO operable control, because an interface-only exclusion is bypassable', () => {
    const { container } = render(<SyncConflictReviewPanel />)
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.querySelectorAll('input')).toHaveLength(0)
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0)
    // The rule this stands in for, at its own line.
    expect(L(38187)).toContain('an interface-only exclusion would be bypassable')
  })
})

describe('SCR-CC-10 — open decisions and the seam are on screen, not only in a file', () => {
  it('discloses both decisions with both readings and a labelled client-delegated pick', () => {
    render(<SyncConflictReviewPanel />)
    for (const d of CC10_DISCLOSURES) {
      const card = screen.getByTestId(`cc10-decision-${d.decisionRef}`)
      expect(card.textContent).toContain(d.question)
      expect(card.textContent).toContain('client-delegated choice')
      for (const r of d.readings) {
        expect(card.textContent).toContain(r.locator)
        expect(card.textContent).toContain(r.text.slice(0, 60))
      }
      // The gap itself is disclosed on screen, not only recorded in a comment.
      expect(card.textContent).toContain('canon')
    }
  })

  it('DEC-PLUS-001 is disclosed with both readings verbatim from L14670', () => {
    render(<SyncConflictReviewPanel />)
    const card = screen.getByTestId('cc10-decision-DEC-PLUS-001')
    expect(card.textContent).toContain(
      'a Quality Manager can do everything a Supervisor can do and more',
    )
    expect(card.textContent).toContain('the roles remain unordered and purely additive')
    expect(L(14670)).toContain('a Quality Manager can do everything a Supervisor can do and more')
    expect(L(14670)).toContain('the roles remain unordered and purely additive')
  })

  it('names the owning module of the action set rather than resolving anything itself', () => {
    render(<SyncConflictReviewPanel />)
    const seam = screen.getByTestId('cc10-seam').textContent ?? ''
    expect(seam).toContain('MOD-CC-13')
    expect(seam).toContain('slice 9')
    expect(seam).toContain('open')
    expect(L(38175)).toContain('exercises action 5 of `MOD-CC-13`')
  })
})

describe('SCR-CC-10 — the second treatment is declared on screen and nowhere transcribed', () => {
  it('states that it exists and names its span', () => {
    // THIS GATE'S FIRST WRITING COULD NOT FAIL, and the plant campaign is what
    // found it. It asserted the rendered text equalled `statement` and then
    // looked for 'L80485-L80602' and 'nine-row' — both literals INSIDE that
    // same statement. Shortening the record's `span` field left the sentence
    // untouched, so the plant stayed green: a `toEqual([...MY_CONSTANT])`
    // tautology in another shape. The render is now compared against the
    // record's OTHER fields, which is the only comparison here that has two
    // sides.
    render(<SyncConflictReviewPanel />)
    const el = screen.getByTestId('cc10-second-treatment')
    const text = el.textContent ?? ''
    expect(text).toBe(CC10_SECOND_TREATMENT.statement)
    expect(text).toContain(CC10_SECOND_TREATMENT.span)
    expect(CC10_SECOND_TREATMENT.span).toBe('L80485-L80602')
    // The other matrix has nine rows and this one has eight; the record must
    // say so, and must not have drifted into agreeing with the module it sits in.
    expect(CC10_SECOND_TREATMENT.matrixRows).toBe(9)
    expect(CC10_SECOND_TREATMENT.matrixRows).not.toBe(CC10_MATRIX.length)
    expect(text).toContain('nine-row')
  })

  it('and the rendered matrix is eight rows, not nine', () => {
    render(<SyncConflictReviewPanel />)
    const body = screen.getByTestId('cc10-matrix').querySelector('tbody')
    expect(body?.querySelectorAll('tr')).toHaveLength(8)
    expect(CC10_MATRIX).toHaveLength(8)
    // Counted off the DOM as well as off the constant, so a ninth row appearing
    // in one and not the other cannot pass.
    expect(screen.queryByTestId('cc10-row-9')).toBeNull()
  })
})
