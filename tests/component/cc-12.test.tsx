import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ShiftHandoffPanel } from '@/surfaces/cc/modules/cc-12/ShiftHandoffPanel'
import {
  CC12_COLUMNS,
  CC12_MATRIX,
  CC12_ROW_HELD_ELSEWHERE,
  CC12_ROW_UNIVERSAL_PROHIBITION,
  cc12Row,
} from '@/surfaces/cc/modules/cc-12/matrix'
import {
  CC12_BRIEF_CATEGORIES,
  CC12_TENANT_ADMIN_DECISION,
} from '@/surfaces/cc/modules/cc-12/readings'

/**
 * `MOD-CC-12` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually SEES, because on this module
 * the two answers come apart three times: a correct transcription of row 7
 * rendered through the build's one rule draws nothing at all where the source
 * spells out two destinations; a correct transcription of row 8 puts a
 * universal prohibition inside one persona's cell, where a per-column reader
 * loses it; and the acknowledgement this module exists for is a command
 * against a record on another surface, so a control drawn HERE would be the
 * cockpit claiming to be the engine.
 *
 * ── BEATEN-GATE SHAPES ACTIVE HERE ───────────────────────────────────────
 *
 *  - A NAME-KEYED CELL LOOKUP IS BLIND TO COLUMN ORDER. Reversing the body's
 *    columns leaves every `data-testid` on its own value and a name-keyed gate
 *    green, with every cell under the wrong heading — and this matrix's column
 *    order is the one that inverts silently. The order is asserted separately,
 *    positionally, on purpose. Header-keying protects the transcription and
 *    does not protect the render.
 *  - `textContent` WELDS ADJACENT ELEMENTS. Nothing below reads a control's
 *    reason off `textContent`; this panel draws no control at all, and that
 *    absence is asserted as a count of zero over the whole subtree rather than
 *    inferred from the absence of a test id.
 *  - A COUNT TRUE OF BOTH A DEFECT AND ITS FIX. The "no figure is rendered"
 *    gate scans the CATEGORY LIST for digits rather than the whole panel,
 *    which is full of legitimate line numbers.
 */

afterEach(cleanup)

const RENDER = () => render(<ShiftHandoffPanel viewerRole="SUPERVISOR" />)

/* ==================================================================== *
 * THE EXPECTED CELL TEXTS COME FROM THE FROZEN SOURCE, NOT FROM THE
 * CONSTANT THAT RENDERS THEM.
 *
 * A component gate that compares the rendered cell to `CC12_MATRIX` is a
 * tautology: a plant that moves the constant moves the expectation with it
 * and the gate stays green. Wave 2 found exactly that shape in a sibling. So
 * the header is parsed off L38481 at test time and every rendered cell is
 * compared against the source's own row, header-keyed by column NAME.
 * ==================================================================== */
const LINES = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')
const srcLine = (n: number): string => LINES[n - 1] ?? ''
const srcCells = (n: number): string[] =>
  srcLine(n)
    .trim()
    .split('|')
    .slice(1, -1)
    .map((c) => c.replaceAll('`', '').trim())
const OWN_HEADER = 38481
const srcColumn = (name: string): number => srcCells(OWN_HEADER).indexOf(name)

describe('the eight rows render, header-keyed and whole', () => {
  // FAILS IF: a rendered cell drifts from the FROZEN SOURCE, in any row, in
  // any column. The expectation is the source's own cell, header-keyed by
  // column name at test time — never `CC12_MATRIX`, which is what draws it.
  // A gate whose expected value is produced by the code under test is a
  // tautology, and a plant that moves the constant moves both.
  // PLANTED: changed row 2's Quality Manager cell in `matrix.ts` from
  // `Allowed with conditions — within Area scope` to `Allowed`.
  // RED: row 2 · Quality Manager: expected 'Allowed' to be 'Allowed with
  //      conditions — within Area scope' // Object.is equality
  it('renders every cell of every row under its own column, read off the source', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-12-matrix')).getAllByRole('row')).toHaveLength(
      CC12_MATRIX.length + 1,
    )
    for (const row of CC12_MATRIX) {
      const src = srcCells(Number(row.sourceRef.slice(1)))
      expect(src[0], `row ${row.ordinal} capability`).toBe(
        screen.getByTestId(`cc-12-row-${row.ordinal}`).querySelector('th')?.textContent,
      )
      for (const column of CC12_COLUMNS) {
        expect(
          screen.getByTestId(`cc-12-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(src[srcColumn(column)])
      }
    }
  })

  // FAILS IF: the body cells are drawn in an order the header row does not
  // carry. This is the check the name-keyed one above CANNOT make: reversing
  // the body's column order leaves every testid on its own value and the
  // name-keyed gate green, with the Worker's column read as the Tenant
  // Admin's — the exact silent inversion this matrix's column order is
  // dangerous for, and on row 6 it turns a prohibition into a grant.
  // PLANTED: `[...CC12_COLUMNS].reverse().map` for the body cells only.
  // RED: expected [ 'Worker', 'Read-only Auditor', …(3) ] to deeply equal
  //      [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('draws the body cells in the header’s own order, not only under its own names', () => {
    RENDER()
    const header = within(screen.getByTestId('cc-12-matrix'))
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(header).toEqual([...srcCells(OWN_HEADER), 'Source'])
    for (const row of CC12_MATRIX) {
      const drawn = [...screen.getByTestId(`cc-12-row-${row.ordinal}`).querySelectorAll('td')]
        .map((td) => td.getAttribute('data-testid'))
        .filter((id): id is string => id !== null)
        .map((id) => id.replace(`cc-12-cell-${row.ordinal}-`, ''))
      expect(drawn, `row ${row.ordinal}`).toEqual([...CC12_COLUMNS])
    }
  })
})

describe('row 7 draws a LINK-OUT, and it draws no link because the cell names two owners', () => {
  // FAILS IF: row 7's cell stops rendering as a cross-surface link-out. The
  // build's one rendering rule draws `explicitlyProhibited` as nothing at all,
  // so the faithful transcription of the one cell on this matrix that names a
  // destination is an EMPTY CELL.
  // PLANTED: deleted the `<CrossSurfaceLink>` from `ShiftHandoffPanel.tsx`.
  // RED: Unable to find an element by: [data-testid="cc-cross-surface-link"]
  it('renders the cell as a link-out in the owner-undecided state', () => {
    RENDER()
    const link = screen.getByTestId('cc-cross-surface-link')
    expect(link.getAttribute('data-cell-id')).toBe('cc-12-agent-run-time')
    expect(link.getAttribute('data-link-state')).toBe('owner-undecided')
    expect(link.textContent).toContain(cc12Row(CC12_ROW_HELD_ELSEWHERE).capability)
    expect(link.textContent).toContain('L38489')
  })

  // FAILS IF: one of the two owners is picked. The cell names both and chooses
  // neither, so drawing a link to either would be this build choosing on the
  // source's behalf — and drawing a control would offer to perform, here, an
  // act performed elsewhere.
  // PLANTED: changed `owner` on `cc-12-agent-run-time` in link-outs.ts from
  // the ambiguous pair to `{ kind: 'named', surface: 'SURF-STU', place: 'the
  // Studio settings' }`.
  // RED: expected 'link' to be 'owner-undecided' // Object.is equality
  it('names both owners, links to neither, and offers no control', () => {
    RENDER()
    const link = screen.getByTestId('cc-cross-surface-link')
    expect(link.textContent).toContain('tenant configuration')
    expect(link.textContent).toContain('Studio settings')
    expect(within(link).queryAllByRole('link')).toEqual([])
    expect(within(link).queryAllByRole('button')).toEqual([])
  })
})

describe('row 8’s note is a rule for every role, and it is rendered as one', () => {
  // FAILS IF: the universal prohibition is rendered as the Tenant Admin's own.
  // The note sits in one persona's cell and binds all five, and two other
  // lines of the source restate it independently of the matrix.
  // PLANTED: replaced the rendered `universal.cells['Tenant Admin'].text` with
  // `universal.cells.Supervisor.text` in `ShiftHandoffPanel.tsx`.
  // RED: expected 'Block a shift from starting…Explicitly prohibited…' to
  //      contain 'no such capability exists for any role'
  it('renders the whole clause, the criterion and the functionality that restate it', () => {
    RENDER()
    const box = screen.getByTestId('cc-12-universal-prohibition')
    // The expected clause is the SOURCE's own Tenant Admin cell on that row,
    // not the model's — the model is what renders it.
    const universalRow = cc12Row(CC12_ROW_UNIVERSAL_PROHIBITION)
    expect(box.textContent).toContain(
      srcCells(Number(universalRow.sourceRef.slice(1)))[srcColumn('Tenant Admin')],
    )
    expect(box.textContent).toContain('no such capability exists for any role')
    expect(box.textContent).toContain('AC-CC-383')
    expect(box.textContent).toContain('L38623')
    expect(box.textContent).toContain('FUNC-CC-1203-1-2')
    expect(box.textContent).toContain('L38611')
  })
})

describe('action 6 names its owning service and draws no control anywhere on this panel', () => {
  // FAILS IF: the write's destination stops being named beside the act. The
  // Command Center owns no operational record: the acknowledgement is a
  // command against a Delivery Operations Hub brief record, and a panel that
  // shows the act without its owner has drawn a cockpit that looks like an
  // engine.
  // PLANTED: deleted the `{action6Place?.owningPlace …}` expression from
  // `ShiftHandoffPanel.tsx`, leaving the authority and the discipline.
  // RED: expected '…Supervisor and above · L38670 Executed via . This surface
  //      owns no operational record…' to contain 'Brief record on the
  //      Delivery Operations Hub'
  it('renders the authority, the owning place and both statements of the discipline', () => {
    RENDER()
    const box = screen.getByTestId('cc-12-action-6')
    expect(box.textContent).toContain('Supervisor and above')
    expect(box.textContent).toContain('L38670')
    expect(box.textContent).toContain('Brief record on the Delivery Operations Hub')
    expect(box.textContent).toContain('L38657')
    expect(box.textContent).toContain('L38471')
    expect(box.textContent).toContain('not a local edit')
  })

  // FAILS IF: this panel draws ANY control. Every one of the ten belongs to
  // the rail the route mounts, and an acknowledge button here would be a
  // second spelling of a closed set that has one owner. Asserted as a count of
  // zero over the whole rendered subtree, which is true of the fix and false
  // of the defect however the control is labelled.
  // PLANTED: added an `<button>Acknowledge brief</button>` footer to
  // `ShiftHandoffPanel.tsx`, which is what SB-CC-23 draws.
  // RED: expected [ <button …/> ] to deeply equal []
  it('draws no button and no anchor of its own, and does not mount the rail', () => {
    const { container } = RENDER()
    expect(within(container).queryAllByRole('button')).toEqual([])
    expect(within(container).queryAllByRole('link')).toEqual([])
    expect(screen.queryByTestId('cc13-rail')).toBeNull()
    expect(screen.getByTestId('cc-12-no-second-rail').textContent).toContain('not drawn twice')
  })

  // FAILS IF: the two rows this matrix uses for one action stop being named.
  // The decomposition is the finding; a panel that shows one row has already
  // chosen a reading.
  it('names both of its own rows for the one action', () => {
    RENDER()
    const rows = screen.getByTestId('cc-12-action-6-rows').textContent ?? ''
    expect(rows).toContain('4 and 5')
    expect(rows).toContain('Acknowledge the brief')
    expect(rows).toContain('Annotate a brief item')
  })
})

describe('the Tenant Admin row carries its own decision, unadopted', () => {
  // FAILS IF: the working position is rendered as an adoption, or the
  // decision's own narrower impact statement is dropped. `DEC-TACC-001` names
  // MTX-TEN-01 and MTX-TEN-02c and does not name this module's matrix row,
  // which is the one place the source grants that role a scoped in-module
  // capability.
  // PLANTED: flipped `adopted` to `true` in `readings.ts`.
  // RED: expected 'true' to be 'false' // Object.is equality
  it('renders the identifier, the three options, the working position and the gap', () => {
    RENDER()
    const box = screen.getByTestId('cc-12-tenant-admin-decision')
    expect(box.getAttribute('data-adopted')).toBe('false')
    expect(box.textContent).toContain('DEC-TACC-001')
    expect(box.textContent).toContain('L23069')
    expect(box.textContent).toContain('L22072')
    for (const option of CC12_TENANT_ADMIN_DECISION.options) {
      expect(box.textContent, option).toContain(option)
    }
    expect(box.textContent).toContain('a recommendation is not an adoption')
    expect(box.textContent).toContain('L38488')
    expect(box.textContent).toContain('foreign')
  })
})

describe('the divergences carry both readings and no winner', () => {
  // FAILS IF: a reading is dropped, or one is marked. Three divergences, two
  // readings each, both locators rendered — the shape is enforced by the type
  // and the rendering is checked here.
  // PLANTED: rendered only `d.readings[0]` in `ShiftHandoffPanel.tsx`.
  // (Deleting a reading from the record itself is a TYPE error — `readings` is
  // a fixed-length pair — so the plant is on the rendering, which is the half
  // a type cannot hold.)
  // RED: expected 'Row 6 · Tenant Admin · See the unacknow…' to contain
  //      '§21.1.4 · L35078'
  it('renders both readings and both locators for all three', () => {
    RENDER()
    const flag = screen.getByTestId('cc-12-divergence-unacknowledged-flag-tenant-admin')
    expect(flag.textContent).toContain('L38488')
    expect(flag.textContent).toContain('§21.1.2 · L35004')
    expect(flag.textContent).toContain('§21.1.3 · L35078')
    expect(flag.textContent).toContain('MTX-TEN-02c · L22069')

    const tokens = screen.getByTestId('cc-12-divergence-acknowledge-annotate-tenant-admin')
    expect(tokens.textContent).toContain('L38486')
    expect(tokens.textContent).toContain('L38487')
    expect(tokens.textContent).toContain('§25.4 row 6 · L48449')
    expect(tokens.textContent).toContain('§21.16 row 6 · L38687')

    const shape = screen.getByTestId('cc-12-divergence-acknowledge-annotate-decomposition')
    expect(shape.textContent).toContain('FUNC-CC-1203-1-1 · L38610')
    expect(shape.textContent).toContain('FUNC-CC-1203-2-1 · L38614')
    expect(shape.textContent).toContain('L38670')
  })

  // FAILS IF: a rendered divergence acquires an adopted, preferred or chosen
  // reading. Checked against the rendered text of all three at once, because a
  // word that marks a winner is a word a reviewer would read.
  // PLANTED: prefixed the flag record's `renderedConsequence` with "The second
  // reading is adopted."
  // RED: cc-12-divergence-unacknowledged-flag-tenant-admin marks a winner with
  //      "adopted": expected 'row 6 · tenant admin · see the unack…' not to
  //      contain 'adopted'
  it('renders no word that marks one reading as the answer', () => {
    RENDER()
    for (const id of [
      'cc-12-divergence-unacknowledged-flag-tenant-admin',
      'cc-12-divergence-acknowledge-annotate-tenant-admin',
      'cc-12-divergence-acknowledge-annotate-decomposition',
    ]) {
      const text = screen.getByTestId(id).textContent ?? ''
      for (const word of ['adopted', 'preferred', 'we choose', 'the correct reading']) {
        expect(text.toLowerCase(), `${id} marks a winner with "${word}"`).not.toContain(word)
      }
    }
  })
})

describe('the brief’s body is named and never numbered', () => {
  // FAILS IF: a figure appears beside any of the six categories. Every number
  // in SB-CC-23 is a count of a live source this storyboard does not hold, and
  // a count rendered from nothing is the defect this slice guards against. The
  // scan is over the CATEGORY LIST rather than the panel, because the panel is
  // full of legitimate line numbers and a whole-panel digit scan would be a
  // gate that fails on the truth.
  // PLANTED: rendered the storyboard's own figures beside the categories —
  // "2 open · containment 80 percent complete overall".
  // RED: expected '2 open deviations with containment state' not to match /\d/
  it('lists the six categories and puts no digit beside any of them', () => {
    RENDER()
    const items = within(screen.getByTestId('cc-12-brief-categories')).getAllByRole('listitem')
    expect(items).toHaveLength(CC12_BRIEF_CATEGORIES.length)
    expect(items.map((li) => li.textContent)).toEqual([...CC12_BRIEF_CATEGORIES])
    for (const li of items) {
      expect(li.textContent ?? '', li.textContent ?? '').not.toMatch(/\d/)
    }
    expect(screen.getByTestId('cc-12-brief-abstention').getAttribute('data-rendered')).toBe('false')
  })
})

describe('the freshness class and the frozen session', () => {
  // FAILS IF: the class assignment is restated rather than read from §21.3's
  // table, or the shared assignment loses its second module. The row puts this
  // element on `MOD-CC-08` AND `MOD-CC-12`; a panel naming only itself has
  // written a second answer for a row that has one.
  // PLANTED: dropped `MOD-CC-08` from the `modules` array on that row in
  // live/model.ts.
  // RED: expected 'Agent output produced: Pushed · Production time · per scope
  //      · L35890. …assigns the element to MOD-CC-12 together…' to contain
  //      'MOD-CC-08 and MOD-CC-12'
  it('renders the row’s own class, obligation and both owning modules', () => {
    RENDER()
    const text = screen.getByTestId('cc-12-freshness').textContent ?? ''
    expect(text).toContain('Agent output produced')
    expect(text).toContain('Pushed')
    expect(text).toContain('Production time')
    expect(text).toContain('L35890')
    expect(text).toContain('MOD-CC-08 and MOD-CC-12')
  })

  // FAILS IF: the session-offline statement drops the fact that nothing is
  // queued. `FB-CC-SESS`'s row is `None, deliberately` — the STRONGER of the
  // two refusal shapes, because a write exists on that path and is still not
  // queued — so the rendered words are the pattern's own.
  // PLANTED: softened that cell in `fallback/patterns.ts` to the weaker
  // `Not applicable — nothing is written`, which five of the nine rows use.
  // RED: expected 'FB-CC-SESS — Platform unreachable fro…' to contain
  //      'None, deliberately'
  it('renders FB-CC-SESS’s own cells, including that nothing is queued', () => {
    RENDER()
    const text = screen.getByTestId('cc-12-session-offline').textContent ?? ''
    expect(text).toContain('FB-CC-SESS')
    expect(text).toContain('Disabled with the reason shown')
    expect(text).toContain('None, deliberately')
    expect(text).toContain('Frozen labelled board')
    expect(text).toContain('L38569')
  })

  // FAILS IF: this module or its route acquires `'use client'` while exporting
  // plain data a server component reads. Asserted on the route file too: it is
  // the file that renders the module identifier the registry generator reads
  // out of the built HTML.
  // PLANTED: added `'use client'` to `ShiftHandoffPanel.tsx`.
  // RED: src/surfaces/cc/modules/cc-12/ShiftHandoffPanel.tsx: expected true to
  //      be false // Object.is equality
  it('neither the module nor its route is a client module', () => {
    for (const f of [
      'src/surfaces/cc/modules/cc-12/ShiftHandoffPanel.tsx',
      'src/surfaces/cc/modules/cc-12/matrix.ts',
      'src/surfaces/cc/modules/cc-12/readings.ts',
      'app/command-center/shift-handoff-panel/page.tsx',
    ]) {
      expect(/^'use client'/m.test(readFileSync(join(process.cwd(), f), 'utf8')), f).toBe(false)
    }
  })
})
