import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { isForeignProbe } from '../probe-paths'
import { SyncConflictReviewPanel } from '@/surfaces/cc/modules/cc-10/SyncConflictReviewPanel'
import { CC10_COLUMNS, CC10_MATRIX } from '@/surfaces/cc/modules/cc-10/matrix'
import {
  CC10_ACTION_5_STATEMENTS,
  CC10_DISCLOSURES,
  CC10_SEAM,
  CC10_SECOND_TREATMENT,
} from '@/surfaces/cc/modules/cc-10/service'
import {
  S366_DIVERGENCES,
  S366_ROWS,
} from '@/surfaces/cc/modules/cc-10-s366/matrix'
import Page from '../../app/command-center/sync-conflict-review-panel/page'

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

  /**
   * ONE CARD, AND IT CONTRADICTED ITSELF TWO SENTENCES APART. Its predecessor
   * asserted this paragraph contained `'open'`, which was true and was the
   * thing that held the contradiction in place: the seam paragraph said the
   * action set "has neither a module nor a screen in this slice" while the
   * paragraph under it said this screen is one the rail mounts on — and the
   * rail is mounted on this screen. This build's defect shape 6, rendered.
   *
   * SO THE TWO PARAGRAPHS ARE READ TOGETHER, which is how a client reads them.
   * The status and the prose have to agree with the mount, and the clauses
   * that only make sense while the half is absent may not appear at all.
   *
   * FAILS IF: the card reports the seam open beside the rail it mounts, or a
   * closed row keeps prose written in the tense of an absent half.
   * PLANTED: reverted `const THIS_SLICE = 9` to 8 in src/surfaces/cc/seams.ts.
   * RED: the card reports the seam open beside the rail it mounts:
   *      expected 'MOD-CC-10 → MOD-CC-13, slice 9, open. …' to contain
   *      'closed'.
   */
  it('reports the seam as its status, agreeing with the rail it mounts', () => {
    render(<SyncConflictReviewPanel />)
    const seam = screen.getByTestId('cc10-seam').textContent ?? ''
    const mount = screen.getByTestId('cc10-action-rail-mount').textContent ?? ''
    expect(seam).toContain('MOD-CC-13')
    expect(seam).toContain('slice 9')
    // The mount is the substance the status has to agree with, asserted first
    // so the status check below is not the only side of the comparison.
    expect(mount).toContain('the rail mounts on')
    // THE STATUS, NOT THE WORD. `whatIsMissing` says "closed set of ten", so
    // a bare `toContain('closed')` passes while the status reads open — the
    // prefix the panel actually renders is what is asserted.
    expect(seam, 'the card reports the seam open beside the rail it mounts').toContain(
      `slice ${CC10_SEAM.ownerSlice}, closed.`,
    )
    for (const absentTense of [
      'has neither a module nor a screen in this slice',
      'still reports the operational-action-set seam OPEN',
    ]) {
      expect(seam + ' ' + mount, `a closed seam still says: "${absentTense}"`).not.toContain(
        absentTense,
      )
    }
    expect(L(38175)).toContain('exercises action 5 of `MOD-CC-13`')

    // THE OTHER STALE SENTENCE ON THIS CARD, AND IT IS A COUNT. It read "one
    // of the seven the rail mounts on", which is true of MODULES and false of
    // SCREENS: eight route directories mount the rail and MOD-CC-03 owns two
    // of them, because the cell view shows one of its features and is owned by
    // no module. Nothing checked the prose against the tree, which is how it
    // stayed. THE COUNT IS MEASURED FROM DISK AND SPELLED FROM THE
    // MEASUREMENT, never typed here: a ninth mounting route turns this red
    // instead of quietly making the sentence wrong again.
    const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
    const ccRoutes = join(process.cwd(), 'app', 'command-center')
    const mounting = readdirSync(ccRoutes, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !isForeignProbe(e.name))
      .filter((e) => existsSync(join(ccRoutes, e.name, 'page.tsx')))
      // COMMENTS STRIPPED, for the reason the slice-9 gate gives: several of
      // these pages EXPLAIN in prose why the rail does or does not belong on
      // them, and a check that cannot tell a mount from an explanation would
      // force those explanations out of the tree.
      .filter((e) =>
        /<Cc13ActionRail\b/.test(
          readFileSync(join(ccRoutes, e.name, 'page.tsx'), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/[^\n]*/g, ''),
        ),
      )
    expect(mounting.length, 'no route mounts the rail, so the count proves nothing').toBeGreaterThan(
      1,
    )
    expect(mounting.length, 'the measured count outran the number words here').toBeLessThan(
      WORD.length,
    )
    expect(mount, `the card names a count other than the ${mounting.length} routes on disk`).toContain(
      `one of the ${WORD[mounting.length]} the rail mounts on`,
    )
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

/* ==================================================================== *
 * THE SCREEN AS A CLIENT MEETS IT — the whole route, rendered.
 * ==================================================================== */

describe('SCR-CC-10 — both treatments and the action rail are on ONE screen', () => {
  /**
   * THE ROUTE ITSELF IS RENDERED, not the panel alone, and that is the only
   * shape that can answer this question. A component suite that mounts
   * `SyncConflictReviewPanel` proves nothing about what a client sees: slice
   * 8's §36.6 disclosure passed its whole unit suite while being imported by
   * no page at all, and the panel suite above would have stayed green through
   * every day of it.
   *
   * FAILS IF: either element is dropped from the route. Planted by deleting
   * `<SecondTreatmentDisclosure />`; red on `cc-10-s366` missing.
   */
  it('the route renders the chapter-21 panel, the §36.6 treatment and the rail', () => {
    render(<Page />)
    expect(screen.getByTestId('cc10-panel')).toBeTruthy()
    expect(screen.getByTestId('cc-10-s366')).toBeTruthy()
    expect(screen.getByTestId('cc13-rail')).toBeTruthy()
  })

  /**
   * TWO MATRICES, NOT ONE MERGED ONE. The chapter-21 table is eight rows with
   * Tenant Admin first; §36.6's is nine rows with Worker first. A merge would
   * show one table of eight or nine, and every count below is read off the
   * DOM rather than off a constant.
   *
   * FAILS IF: a later hand reconciles the two. Planted by pointing the
   * disclosure's rows at `CC10_MATRIX`; red on the row count and on the
   * column order at once.
   */
  it('and the two matrices keep their own row counts and opposite column orders', () => {
    render(<Page />)
    const ch21 = within(screen.getByTestId('cc10-matrix'))
    expect(ch21.getAllByRole('row')).toHaveLength(1 + CC10_MATRIX.length)
    expect(CC10_MATRIX).toHaveLength(8)

    const s366 = within(screen.getByTestId('cc-10-s366-matrix'))
    expect(s366.getAllByRole('row')).toHaveLength(1 + S366_ROWS.length)
    expect(S366_ROWS).toHaveLength(9)

    // The persona headers, in each table's own order, read off the source.
    expect(CC10_COLUMNS.map((c) => screen.getByTestId(`cc10-col-${c}`).textContent)).toEqual(
      cellsOf(38082).slice(1),
    )
    const s366Headers = s366
      .getAllByRole('columnheader')
      .map((h) => h.textContent?.trim() ?? '')
    expect(s366Headers).toEqual(cellsOf(80547))
    expect(s366Headers.slice(1)).not.toEqual([...CC10_COLUMNS])
  })

  /**
   * ALL FOUR DIVERGENCES ARE ON THE SCREEN, each with BOTH locators and no
   * winner. This is the disclosure the whole split exists to produce and it
   * reached no client until this route mounted it.
   *
   * FAILS IF: a divergence is dropped, or one reading is rendered without its
   * counterpart. Planted by rendering only `d.here`; red on the chapter-21
   * locator.
   */
  it('all four divergences render with both locators and neither chosen', () => {
    render(<Page />)
    const list = within(screen.getByTestId('cc-10-s366-divergences'))
    expect(S366_DIVERGENCES).toHaveLength(4)
    for (const d of S366_DIVERGENCES) {
      const item = within(screen.getByTestId(`cc-10-s366-divergence-${d.id}`))
      expect(item.getByText(d.question)).toBeTruthy()
      // Both locators, each on the screen, read through the item's own subtree
      // so a neighbouring divergence's locator cannot satisfy this.
      expect(item.getByText(`(${d.here.locator})`)).toBeTruthy()
      expect(item.getByText(`(${d.chapter21.locator})`)).toBeTruthy()
      expect(d.chosen).toBeNull()
    }
    expect(list.getAllByText('Not chosen.')).toHaveLength(4)
  })

  /**
   * THE TENANT ADMIN DISAGREEMENT IS TWO ROWS WIDE AND BOTH ARE DRAWN. This
   * is the row a single implementer would have merged away, and it is the
   * reason the two treatments were built by two people who never reconciled.
   */
  it('the Tenant Admin divergence renders as two rows, not one', () => {
    render(<Page />)
    const tenantAdmin = S366_DIVERGENCES.filter((d) => d.column === 'Tenant Admin')
    expect(tenantAdmin).toHaveLength(2)
    for (const d of tenantAdmin) {
      expect(screen.getByTestId(`cc-10-s366-divergence-${d.id}`)).toBeTruthy()
    }
  })

  /**
   * THE RAIL IS THE CONTROL RAIL, NOT THE MODULE CARD. Wave 0's
   * `ActionRail.tsx` renders §21.16's two tables as data and draws no
   * control; this one draws ten controls in three visual states. Mounting the
   * wrong one puts a matrix where the source draws a rail.
   *
   * FAILS IF: the card is mounted instead. The card renders no
   * `cc13-rail-controls` list at all.
   */
  it('the rail draws ten controls and names its mount, and it is not the module card', () => {
    render(<Page />)
    const rail = within(screen.getByTestId('cc13-rail'))
    expect(rail.getAllByTestId(/^cc13-rail-control-\d+$/)).toHaveLength(10)
    expect(screen.getByTestId('cc13-rail-mount').textContent).toContain('MOD-CC-10')
    // L20195: the header carries the person and the scope and nothing else —
    // no role indicator, because there is no active role.
    const header = within(screen.getByTestId('cc13-rail-header'))
    expect(header.getByTestId('cc13-rail-person')).toBeTruthy()
    expect(header.getByTestId('cc13-rail-scope')).toBeTruthy()
  })

  /**
   * THE CAP IS RENDERED AS THE QUESTION. Both identifiers, both locators, and
   * no number anywhere that could be read as a cap value.
   *
   * FAILS IF: a cap value appears on the screen. The scan is over the cap
   * section's own text, so an illustration elsewhere on the page cannot
   * satisfy or defeat it.
   */
  it('the cap renders both identifiers and states no value', () => {
    render(<Page />)
    const cap = screen.getByTestId('cc10-cap-DEC-CONFLICTCAP-001')
    const text = cap.textContent ?? ''
    expect(text).toContain('DEC-CONFLICTCAP-001')
    expect(text).toContain('DEC-SYNC-006')
    expect(text).toContain('L38076')
    expect(text).toContain('L81737')
    expect(screen.getByTestId('cc10-cap').textContent).toContain('showing 3 of 3')
    // The storyboard's fifty is named nowhere as this build's cap.
    expect(text).not.toMatch(/\bcap(?:ped)? (?:is|of|value is) \d/i)
  })

  /**
   * ACTION 5 IS DRAWN THREE TIMES AND THE THREE DISAGREE, cell by cell,
   * through each cell's own `data-testid`. `textContent` welding is what a
   * sweep over this table would fall to, and `Allowed` is a prefix of
   * `Allowed with conditions` in its own Quality Manager column.
   *
   * EVERY CELL IS COMPARED AGAINST THE FROZEN SOURCE, NOT AGAINST THE
   * CONSTANT IT RENDERS, and this gate was rewritten because a plant proved
   * the first version could not fail. Aligning §25.4's Tenant Admin cell onto
   * §21.16's token — the merge a single implementer would have written — moved
   * the constant and the rendered cell together, and a comparison between them
   * stayed green while the unit gate that reads the source went red. A check
   * that reads its expectation out of the value under test is the same shape
   * as a `for...of` over the constant it was meant to verify.
   *
   * The header for each row is parsed from that table's own separator, so the
   * lookup is by column NAME. §21.16 puts an ordinal in column 1 and the other
   * two tables do not.
   */
  it('action 5 renders three statements, cell by cell, against the frozen source', () => {
    render(<Page />)
    const headerFor = (dataLine: number): string[] => {
      for (let n = dataLine - 1; n > dataLine - 20; n -= 1) {
        if (/^\s*\|\s*-{2,}/.test(L(n))) return cellsOf(n - 1)
      }
      throw new Error(`no separator above line ${dataLine}`)
    }

    for (const s of CC10_ACTION_5_STATEMENTS) {
      const line = Number(s.sourceRef.slice(1))
      const header = headerFor(line)
      const source = cellsOf(line)
      for (const c of CC10_COLUMNS) {
        const at = header.indexOf(c)
        expect(at, `${s.sourceRef} header has no ${c} column`).toBeGreaterThan(0)
        expect(
          screen.getByTestId(`cc10-action5-cell-${s.sourceRef}-${c}`).textContent,
          `${s.sourceRef} · ${c}`,
        ).toBe(source[at])
      }
    }

    const qm = screen.getByTestId('cc10-action5-cell-L48448-Quality Manager').textContent ?? ''
    expect(/^Allowed$/.test(qm)).toBe(false)
    expect(qm.startsWith('Allowed')).toBe(true)
    expect(qm).toBe(cellsOf(48448)[3])
  })

  /**
   * THE FRESHNESS OBLIGATION IS THREE TIMESTAMPS AND THE SCREEN SAYS SO. The
   * dispatch for this task said two.
   */
  it('the freshness class and its whole obligation are on the screen', () => {
    render(<Page />)
    const text = screen.getByTestId('cc10-freshness').textContent ?? ''
    expect(text).toContain('Both device timestamps and server receipt')
    expect(text).toContain('Pushed')
    expect(cellsOf(35888)[3]).toBe('Both device timestamps and server receipt')
  })

  /**
   * ROW 8'S TENANT ADMIN CELL GETS A LINK RATHER THAN AN EMPTY SPACE. A
   * faithful transcription of an explicitly prohibited cell draws nothing at
   * all, and `AC-CC-301` requires each such control to BE a link.
   */
  it('the population-B cell renders a cross-surface link-out and not a control', () => {
    render(<Page />)
    const link = screen
      .getAllByTestId('cc-cross-surface-link')
      .find((el) => el.getAttribute('data-cell-id') === 'cc-10-clock-skew-threshold')
    expect(link, 'the clock-skew link-out is on the screen').toBeTruthy()
    expect(within(link as HTMLElement).getByText('Change the clock-skew threshold')).toBeTruthy()
    expect(within(link as HTMLElement).queryByRole('button')).toBeNull()
  })

  /**
   * NOTHING ON THIS SCREEN IS HIDDEN. A `hidden` attribute defeats every read
   * above without changing a single string, which is one of this build's
   * recorded gates-that-could-not-fail.
   */
  it('and nothing on the screen is hidden from view', () => {
    const { container } = render(<Page />)
    expect(container.querySelectorAll('[hidden]')).toHaveLength(0)
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
  })
})
