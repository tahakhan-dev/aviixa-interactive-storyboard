import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { decisionRecord } from '@/disclosure/decisions'
import { frontlineAffordance } from '@/frontline/matrix'
import { TrainingLibraryView } from '@/frontline/modules/fl-b12/TrainingLibraryView'
import { B12_CARD, B12_CLAIMS_NEVER_MADE, B12_STATES } from '@/frontline/modules/fl-b12/charter'
import {
  FL_B12_COLUMNS,
  FL_B12_MATRIX,
  type FlB12Column,
} from '@/frontline/modules/fl-b12/matrix'
import {
  B12_ACCEPTANCE_CRITERIA,
  B12_FUNCTIONALITIES,
  B12_SOURCE_FINDINGS,
  B12_UNIDENTIFIED_TENSIONS,
} from '@/frontline/modules/fl-b12/service'

/**
 * `MOD-FL-B12`'s Training Library viewer, checked as a RENDERING rather than
 * as a data structure. The unit suite next door asks whether the transcription
 * matches the frozen source; this one asks whether what the source says
 * reaches the screen, because a claim held in data and never drawn is a code
 * comment and a code comment is not a disclosure.
 *
 * WHY SO MANY OF THESE ARE PER-ELEMENT. A `textContent` sweep over the page
 * body passes a line whose sentence was concatenated in from its neighbour,
 * and this build has shipped a gate defeated exactly that way. Where the claim
 * is about ONE cell or ONE line, the assertion is made on that element.
 *
 * Every gate below was planted, watched go red, and restored. The `FAILS IF`
 * note names the defect that was actually planted.
 */

const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')
const L42209 = SOURCE[42208] ?? ''
const L42115 = SOURCE[42114] ?? ''

function pageText(): string {
  return document.body.textContent ?? ''
}

function cellsOf(rowId: string): HTMLElement[] {
  return screen.getAllByTestId('fl-b12-cell').filter((c) => c.getAttribute('data-row') === rowId)
}

/**
 * `getByTestId` FINDS HIDDEN ELEMENTS AND `textContent` STILL READS THEM, so
 * a gate that only asks "is this string on the element" passes a page that
 * draws the element and hides it. This build has shipped a gate defeated by
 * exactly a `hidden` attribute. Every gate below whose claim is "this reaches
 * a reader" runs its element through here first.
 */
function visible(el: HTMLElement): HTMLElement {
  for (let n: HTMLElement | null = el; n !== null; n = n.parentElement) {
    const where = `${el.getAttribute('data-testid') ?? '?'} on <${n.tagName}>`
    expect(n.hidden, where).toBe(false)
    expect(n.getAttribute('aria-hidden'), where).not.toBe('true')
    expect(n.style.display, where).not.toBe('none')
    expect(n.style.visibility, where).not.toBe('hidden')
  }
  return el
}

/* ==================================================================== *
 * THE TWO SENSES REACHING THE SCREEN. THE GATE OF THIS TASK.
 * ==================================================================== */

describe('the two senses of Unavailable, on screen', () => {
  // FAILS IF: the ten Unavailable cells render the same sentence. Asserted per
  // CELL and in both directions — each of row 2's five cells carries the
  // returning sentence and not the permanent one, and each of row 8's carries
  // the permanent one and not the returning one. A page-wide check passes when
  // both sentences appear somewhere; a one-directional check passes when every
  // cell carries both. Planted: row 8's existence set to
  // 'absent-under-condition' in matrix.ts. Went red on all five practice-mode
  // cells for the missing permanent sentence.
  it('draws row 2 and row 8 apart, cell by cell, in both directions', () => {
    render(<TrainingLibraryView />)
    const RETURNS = 'It returns when that condition lifts.'
    const NEVER = 'It exists nowhere for anyone in this scope, so there is nothing to come back to.'

    const offlineCells = cellsOf('view-offline')
    const practiceCells = cellsOf('practice-mode')
    expect(offlineCells).toHaveLength(5)
    expect(practiceCells).toHaveLength(5)

    for (const c of offlineCells) {
      const t = c.textContent ?? ''
      expect(c.getAttribute('data-existence')).toBe('absent-under-condition')
      expect(t, c.getAttribute('data-column') ?? '').toContain(RETURNS)
      expect(t, c.getAttribute('data-column') ?? '').not.toContain(NEVER)
    }
    for (const c of practiceCells) {
      const t = c.textContent ?? ''
      expect(c.getAttribute('data-existence')).toBe('not-in-scope')
      expect(t, c.getAttribute('data-column') ?? '').toContain(NEVER)
      expect(t, c.getAttribute('data-column') ?? '').not.toContain(RETURNS)
    }
  })

  // FAILS IF: the token stops being printed as the source writes it, or the
  // cell's own words are replaced by the fold's verdict. The rule wave 0
  // states is that the token is NOT corrected, downgraded or hidden — what is
  // refused is the control. So all ten cells still say Unavailable on screen
  // while rendering opposite verdicts.
  //
  // THE FIRST VERSION OF THIS GATE COULD NOT FAIL. It asked only whether the
  // own-words span CONTAINED "Unavailable", and the fold's stated line for
  // these rows contains the cell's note inside it — so replacing the own-words
  // span with the verdict left the word in place and the gate green. What
  // separates them is EXACTNESS: the own words are the note and nothing else,
  // and the verdict is a different, longer sentence. Planted again with the
  // own-words span rendering `affordanceWords(drawn)`, and it went red.
  it('still prints the word Unavailable in all ten of those cells', () => {
    render(<TrainingLibraryView />)
    for (const rowId of ['view-offline', 'practice-mode']) {
      const row = FL_B12_MATRIX.find((r) => r.id === rowId)
      for (const c of cellsOf(rowId)) {
        const column = c.getAttribute('data-column') as FlB12Column
        const own = visible(within(c).getByTestId('fl-b12-cell-own-words'))
        const verdict = visible(within(c).getByTestId('fl-b12-cell-verdict'))
        expect(own.textContent, `${rowId}/${column}`).toBe(row?.cells[column].note)
        expect(own.textContent, `${rowId}/${column}`).toContain('Unavailable')
        expect(own.textContent, `${rowId}/${column}`).not.toBe(verdict.textContent)
        expect(verdict.textContent, `${rowId}/${column}`).toContain('no control is drawn here')
      }
    }
  })

  // FAILS IF: the two senses stop being shown side by side with their route-
  // back answers, or one sense's answer replaces the other's. The screen is
  // where a reader meets the overload; a difference visible only to the type
  // system is not a disclosure. Planted: the sense list's `routeBack` swapped
  // for the corroboration text. Went red on both.
  it('shows both senses together, each with its own answer about coming back', () => {
    render(<TrainingLibraryView />)
    const senses = screen.getAllByTestId('fl-b12-sense')
    expect(senses).toHaveLength(2)
    const conditional = senses.find((s) => s.getAttribute('data-row') === 'view-offline')
    const permanent = senses.find((s) => s.getAttribute('data-row') === 'practice-mode')
    expect(within(conditional as HTMLElement).getByTestId('fl-b12-route-back').textContent).toMatch(
      /comes back at the next connection/i,
    )
    expect(within(permanent as HTMLElement).getByTestId('fl-b12-route-back').textContent).toMatch(
      /there never will be/i,
    )
    expect(conditional?.getAttribute('data-existence')).toBe('absent-under-condition')
    expect(permanent?.getAttribute('data-existence')).toBe('not-in-scope')
    // and each sense carries its corroborating readings on screen.
    expect(within(conditional as HTMLElement).getAllByTestId('fl-b12-sense-corroboration')).toHaveLength(2)
    expect(within(permanent as HTMLElement).getAllByTestId('fl-b12-sense-corroboration')).toHaveLength(3)
  })
})

/* ==================================================================== *
 * THE FORTY CELLS, AND THE ONE CONTROL.
 * ==================================================================== */

describe('the matrix on screen', () => {
  // FAILS IF: a cell is dropped, or a cell prints only the fold's verdict and
  // loses its own words. Both halves are asserted on the SAME element, so a
  // cell whose own words were replaced by its neighbour's fails here even
  // though the page as a whole still contains both strings. Planted: the
  // own-words span changed to render the row's control instead of the cell's
  // note. Went red on the first cell whose note is not the control.
  it('draws all forty cells, each with its own words beside the fold’s verdict', () => {
    render(<TrainingLibraryView />)
    const cells = screen.getAllByTestId('fl-b12-cell')
    expect(cells).toHaveLength(40)
    expect(screen.getAllByTestId('fl-b12-row')).toHaveLength(8)
    for (const row of FL_B12_MATRIX) {
      for (const column of FL_B12_COLUMNS) {
        const el = cells.find(
          (c) =>
            c.getAttribute('data-row') === row.id && c.getAttribute('data-column') === column,
        )
        expect(el, `${row.id}/${column}`).toBeDefined()
        const own = within(el as HTMLElement).getByTestId('fl-b12-cell-own-words')
        expect(own.textContent, `${row.id}/${column}`).toBe(row.cells[column].note)
        const verdict = within(el as HTMLElement).getByTestId('fl-b12-cell-verdict')
        expect((verdict.textContent ?? '').length, `${row.id}/${column}`).toBeGreaterThan(0)
        expect(el?.getAttribute('data-kind'), `${row.id}/${column}`).toBe(
          frontlineAffordance(row, column).kind,
        )
      }
    }
  })

  // FAILS IF: this screen draws a control for a role the source does not give
  // one to, in any of the five columns. Rendered five times, once per role,
  // and the Open-it button is looked for by name each time. Planted: the
  // TheLibrary guard changed from `view.kind === 'control'` to
  // `view.kind !== 'stated-line'`, which is true for a refusal. Went red for
  // all four non-Worker roles.
  it('draws its one control for the Worker and for nobody else', () => {
    for (const role of FL_B12_COLUMNS) {
      const { unmount } = render(<TrainingLibraryView viewerRole={role as FlB12Column} />)
      const openIt = screen.queryByRole('button', { name: 'Open it' })
      if (role === 'WORKER') {
        expect(openIt, role).not.toBeNull()
      } else {
        expect(openIt, role).toBeNull()
        expect(screen.getByTestId('fl-b12-no-view-control').textContent, role).toContain(
          'nothing is drawn here',
        )
      }
      unmount()
    }
  })

  // FAILS IF: row 3 draws a control for the Quality Manager, whose cell reads
  // `Allowed with conditions`. It is the authoring row and its own words end
  // "never here". Asserted per cell across all five roles, twenty-five
  // renderings, because the fold takes the VIEWER's role and a check run for
  // one role proves nothing about the other four. Planted: row 3's surface
  // changed to 'screen' in matrix.ts. Went red — the cell rendered
  // `data-kind="control"`.
  it('never draws an authoring control, for any role, in any column', () => {
    for (const role of FL_B12_COLUMNS) {
      const { unmount } = render(<TrainingLibraryView viewerRole={role as FlB12Column} />)
      for (const c of cellsOf('upload-or-version')) {
        expect(c.getAttribute('data-kind'), `${role}/${c.getAttribute('data-column')}`).toBe(
          'cross-surface',
        )
      }
      // and no cell anywhere on the page for any row is a drawn control except
      // the Worker's own view row.
      const controls = screen
        .getAllByTestId('fl-b12-cell')
        .filter((c) => c.getAttribute('data-kind') === 'control')
        .map((c) => `${c.getAttribute('data-row')}/${c.getAttribute('data-column')}`)
      expect(controls, role).toEqual(['view-connected/WORKER'])
      unmount()
    }
  })

  // FAILS IF: the cross-surface statement stops naming the Studio, or stops
  // saying the words that keep authoring off this surface. The statement is
  // rendered through wave 0's component, so this checks that the row reaches
  // it rather than re-checking the component. Planted: metElsewhere.note
  // shortened to drop "never here". Went red.
  it('states the authoring row as held on the Studio, in the source’s words', () => {
    render(<TrainingLibraryView />)
    const statement = visible(screen.getByTestId('fl-cross-surface'))
    const text = statement.textContent ?? ''
    expect(text).toContain('Upload or version training material')
    expect(text).toContain('Standards and Operations Studio')
    expect(text).toContain('never here')
    expect(L42115).toContain('never here')
    // exactly one row of this matrix is held elsewhere.
    expect(screen.getAllByTestId('fl-cross-surface')).toHaveLength(1)
  })
})

/* ==================================================================== *
 * CONNECTED AND NOT, AND WHAT NEITHER STATE MAY SHOW.
 * ==================================================================== */

describe('the two connectivity renderings', () => {
  // FAILS IF: the offline state renders an empty list, or renders the
  // connected line, or the item survives the toggle. The whole of
  // FUNC-B12-02-1-3 is that these two are distinct renderings. Planted: the
  // `!connected` guard removed from the item block, so the item stayed on
  // screen offline. Went red on the item query.
  it('renders the honest line offline, and no list at all', () => {
    render(<TrainingLibraryView />)
    expect(screen.getByTestId('fl-b12-item')).toBeTruthy()
    const before = screen.getByTestId('fl-b12-rendering')
    expect(before.getAttribute('data-state')).toBe('STATE-B12-AVAILABLE')

    fireEvent.click(screen.getByRole('button', { name: 'Show this screen with no connection' }))

    expect(screen.queryByTestId('fl-b12-item')).toBeNull()
    const after = screen.getByTestId('fl-b12-rendering')
    expect(after.getAttribute('data-state')).toBe('STATE-B12-UNAVAILABLE')
    expect(after.textContent).toContain('The Training Library needs a connection.')
    expect(after.textContent).toContain('It is not needed for any of your runs.')
    // the storyboard really writes that line.
    expect(L42209).toContain('The Training Library needs a connection.')
    // and the row's own stated line is drawn where the control would sit.
    expect(screen.getByTestId('fl-b12-offline-line').textContent).toContain(
      'It returns when that condition lifts.',
    )
  })

  // FAILS IF: the offline rendering is an error code or a bare token. The
  // source forbids both by name. Asserted on the element rather than the page,
  // and on its length, because "not an error code" is only checkable as "a
  // sentence a worker can read". Planted: the offline line replaced with
  // "ERR_NO_CONNECTION". Went red on the length and on the pattern.
  it('the offline line is a sentence, not an error code and not a bare token', () => {
    render(<TrainingLibraryView />)
    fireEvent.click(screen.getByRole('button', { name: 'Show this screen with no connection' }))
    const el = visible(screen.getByTestId('fl-b12-rendering'))
    const line = el.textContent ?? ''
    expect(line.length).toBeGreaterThan(80)
    // The locator brackets are stripped first: a frozen-source line number is
    // a citation, not a code shown to a worker, and leaving them in would make
    // this gate fail on the thing it is supposed to require.
    const message = line.replace(/\[[^\]]*\]/g, '').trim()
    expect(message).not.toMatch(/ERR|E\d{3}|\b\d{3,}\b/)
    expect(message).not.toBe('Unavailable')
    expect(message.length).toBeGreaterThan(80)
  })

  // FAILS IF: the safety-layer sentence is missing, or appears only after the
  // worker toggles connectivity. This is the one screen whose honest offline
  // answer is "come back later", and a reader meeting that without the
  // sentence beside it generalises it to the work. Asserted on the FIRST
  // render with nothing clicked. Planted: the OnlineOnlyScope section moved
  // inside the `!connected` branch. Went red on the connected render.
  it('states the safety layer is identical offline, on first paint, in both states', () => {
    render(<TrainingLibraryView />)
    const first = visible(screen.getByTestId('fl-b12-safety-layer')).textContent ?? ''
    expect(first).toMatch(/a Severity 1 hold fires immediately, even offline/i)
    expect(first).toContain('from the moment of the breach')
    fireEvent.click(screen.getByRole('button', { name: 'Show this screen with no connection' }))
    expect(screen.getByTestId('fl-b12-safety-layer').textContent).toBe(first)
  })

  // FAILS IF: any figure about the worker reaches the page, in either
  // connectivity state, for any role, before or after opening an item. Twelve
  // renderings. Swept over the WHOLE body — which includes anything a `hidden`
  // attribute would hide from a query — and then per element so a failure
  // names where. Planted: 'Progress: 40%' added to the item block. Both halves
  // went red and the per-element half named fl-b12-item.
  it('renders no percentage, pace, countdown or ranking, in any state or role', () => {
    const FORBIDDEN = /%|\b(pace|timer|countdown|ranking|leaderboard|productivity|percent)\b/i
    for (const role of FL_B12_COLUMNS) {
      const { unmount } = render(<TrainingLibraryView viewerRole={role as FlB12Column} />)
      const open = screen.queryByRole('button', { name: 'Open it' })
      if (open !== null) fireEvent.click(open)
      expect(FORBIDDEN.test(pageText()), `${role} connected`).toBe(false)
      fireEvent.click(screen.getByRole('button', { name: 'Show this screen with no connection' }))
      expect(FORBIDDEN.test(pageText()), `${role} offline`).toBe(false)
      for (const id of ['fl-b12-cell', 'fl-b12-card-statement', 'fl-b12-functionality', 'fl-b12-rendering']) {
        for (const el of screen.getAllByTestId(id)) {
          expect(
            FORBIDDEN.test(el.textContent ?? ''),
            `${role}: ${id}: ${el.textContent?.slice(0, 60)}`,
          ).toBe(false)
        }
      }
      unmount()
    }
  })
})

/* ==================================================================== *
 * WHAT IS TRANSCRIBED, AND WHETHER IT REACHES THE SCREEN.
 * ==================================================================== */

describe('the transcription on screen', () => {
  // FAILS IF: a transcribed record stops reaching the screen. A transcription
  // nobody can read is a code comment. Planted: the Functionalities section
  // removed from the view. Went red at 0 against 9.
  it('renders every record it holds, with nothing left in the file', () => {
    render(<TrainingLibraryView />)
    expect(screen.getAllByTestId('fl-b12-card-statement')).toHaveLength(B12_CARD.length)
    expect(screen.getAllByTestId('fl-b12-state')).toHaveLength(B12_STATES.length)
    expect(screen.getAllByTestId('fl-b12-functionality')).toHaveLength(B12_FUNCTIONALITIES.length)
    expect(screen.getAllByTestId('fl-b12-acceptance')).toHaveLength(B12_ACCEPTANCE_CRITERIA.length)
    expect(screen.getAllByTestId('fl-b12-never-claimed')).toHaveLength(B12_CLAIMS_NEVER_MADE.length)
    expect(screen.getAllByTestId('fl-b12-finding')).toHaveLength(B12_SOURCE_FINDINGS.length)
    expect(screen.getAllByTestId('fl-b12-denial-test')).toHaveLength(4)
    expect(screen.getAllByTestId('fl-b12-surfaces')).toHaveLength(4)
  })

  // FAILS IF: the three readings of the fallback set are collapsed on screen,
  // or the three gaps stop being named. The three-readings line names each set
  // and each count; the gaps line names each functionality that fills none.
  //
  // THE FIRST VERSION OF THIS GATE COULD NOT FAIL EITHER, and this is the
  // second of the two defeats the plant found in this file: a `hidden`
  // attribute on the gaps paragraph left `getByTestId` finding it and
  // `textContent` reading it, so the gate stayed green over an element no
  // reader could see. `visible` is what closes it, and it walks the ancestors
  // rather than checking the element alone. Planted twice after that — once
  // with the paragraph removed, once with `hidden` on it — and it went red
  // both times.
  it('shows three readings of the fallback set and names the three gaps', () => {
    render(<TrainingLibraryView />)
    const readings = visible(screen.getByTestId('fl-b12-three-readings')).textContent ?? ''
    expect(readings).toContain('FB-FL-CORE-01')
    expect(readings).toContain('FB-FL-SEC-01')
    expect(readings).toContain('Three readings, carried apart and reconciled nowhere.')
    const gaps = visible(screen.getByTestId('fl-b12-pattern-gaps')).textContent ?? ''
    for (const id of ['FUNC-B12-02-1-2', 'FUNC-B12-04-1-2', 'FUNC-B12-05-1-1']) {
      expect(gaps, id).toContain(id)
    }
    expect(gaps).toContain('an assigned pattern is indistinguishable from a real one')
  })

  // FAILS IF: a decision the shared canon holds is re-worded on this screen.
  // The renderer is the canon's own component and the words come from the
  // canon's record, so this asserts the record's question and every one of its
  // readings reaches the page. Planted: the DecisionDisclosure call replaced
  // with a locally worded paragraph. Went red on the readings.
  it('renders both canon decisions in the canon’s own words', () => {
    render(<TrainingLibraryView />)
    const blocks = screen.getAllByTestId('fl-b12-canon-decision')
    expect(blocks).toHaveLength(2)
    for (const id of ['DEC-LIB-001', 'DEC-LANEB-001'] as const) {
      const block = blocks.find((b) => b.getAttribute('data-decision') === id)
      expect(block, id).toBeDefined()
      const text = block?.textContent ?? ''
      const record = decisionRecord(id)
      expect(text, id).toContain(record.question)
      for (const r of record.readings) expect(text, `${id} ${r.locator}`).toContain(r.locator)
      expect(text, id).toContain('client-delegated choice under APP-012')
      // and this module says why it is the screen disclosing it.
      expect(text, id).toContain('Where the frozen source attaches it:')
    }
  })

  // FAILS IF: a tension carrying no decision identifier renders as though it
  // had one, or loses a reading. Both readings and both locators per tension.
  // Planted: the second reading dropped from the renderer's map. Went red at 1
  // against 2.
  it('renders both unidentified tensions with both readings and both locators', () => {
    render(<TrainingLibraryView />)
    const notes = screen.getAllByTestId('fl-b12-tension')
    expect(notes).toHaveLength(2)
    for (const t of B12_UNIDENTIFIED_TENSIONS) {
      const note = notes.find((n) => n.getAttribute('data-tension') === t.key)
      expect(note, t.key).toBeDefined()
      const el = note as HTMLElement
      expect(within(el).getAllByTestId('fl-b12-tension-reading'), t.key).toHaveLength(2)
      const text = el.textContent ?? ''
      expect(text, t.key).toContain(t.question)
      for (const r of t.readings) expect(text, `${t.key} ${r.locator}`).toContain(r.locator)
      expect(text, t.key).toContain('no DEC-* identifier')
      expect(text, t.key).toContain('A source tension carrying no decision identifier')
    }
  })

  // FAILS IF: the screen stops saying what frame 1 names but this slice does
  // not build. A screen that renders one item without saying the frame also
  // names grouping and search implies the frame was met. Planted: the
  // stated-not-built paragraph removed. Went red.
  it('says which parts of the storyboard frame it states rather than builds', () => {
    render(<TrainingLibraryView />)
    const text = visible(screen.getByTestId('fl-b12-frames-not-built')).textContent ?? ''
    expect(text).toContain('grouping by station and a search field')
    expect(text).toContain('neither is built here')
    // and no search control exists, which is what the sentence claims.
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
