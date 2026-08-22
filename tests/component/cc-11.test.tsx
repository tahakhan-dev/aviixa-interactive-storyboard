import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import { ReportsAndBuilder } from '@/surfaces/cc/modules/cc-11/ReportsAndBuilder'
import { CC11_COLUMNS, CC11_MATRIX } from '@/surfaces/cc/modules/cc-11/matrix'
import {
  CC11_DATA_SETS,
  CC11_DEC_REPORT_CARDS,
  CC11_OPEN_IDENTITY,
} from '@/surfaces/cc/modules/cc-11/report-sets'

/**
 * `MOD-CC-11` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually SEES, because on this module
 * the two answers come apart twice: a set whose identity the source leaves
 * open renders as a NAME unless the screen says otherwise, and a class cell
 * carrying a class and a qualifier renders as one string unless the screen
 * draws both.
 *
 * ── THREE BEATEN-GATE SHAPES ARE ACTIVE HERE ─────────────────────────────
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS, so a check that the disabled
 *    control carries its reason passes when the paragraph beside it carries
 *    the same words. The frozen control's reason is resolved through
 *    `aria-describedby` off the control itself and `reason.hidden === false`
 *    is asserted too.
 *  - A NAME-KEYED CELL LOOKUP IS BLIND TO COLUMN ORDER. Reversing the body's
 *    columns leaves every `data-testid` on its own value and a name-keyed
 *    gate green with every cell under the wrong heading — on this matrix that
 *    would read the Worker's column as the Tenant Admin's, which is the whole
 *    danger of this surface's column order. The order is asserted
 *    positionally as well.
 *  - AN ALLOWANCE TAKING ITS ALLOWED STRING FROM THE VALUE UNDER TEST. The
 *    invention gate compares rendered set names against the source's own swap
 *    EXAMPLES rather than against the model's own names, so a set renamed to
 *    an example consistently in the model could not satisfy it.
 */

/*
 * THE REDUNDANCY CAMPAIGN, RUN BECAUSE REDUNDANT PROTECTIONS CANNOT BE
 * VERIFIED ONE AT A TIME. Two guards cover one defect — wave 0's register no
 * longer opening with report-format authoring: the runtime `throw` in
 * `ReportsAndBuilder.tsx` and the unit suite's own assertion next door.
 *
 *   defect alone, component suite  → RED (Error: MOD-CC-11 reads
 *                                   report-format authoring as the FIRST …)
 *   defect alone, unit suite       → RED (expected 'Report-format authoring
 *                                   (PLANT-U22 mo…' to be 'Report-format
 *                                   authoring')
 *   defect + throw removed         → component suite GREEN, 9 passed
 *   defect + unit assertion removed→ unit suite GREEN, 31 passed
 *
 * So each guard is the sole protection inside its own suite and the two are
 * redundant only ACROSS suites. Removing either alone leaves the defect
 * catchable; removing both would leave it invisible in both.
 */

afterEach(cleanup)

const RENDER = () => render(<ReportsAndBuilder />)

/** A disabled control's reason, resolved off the control rather than welded. */
function reasonOf(control: HTMLElement): HTMLElement {
  const id = control.getAttribute('aria-describedby')
  expect(id, 'a disabled control with no aria-describedby states no reason').toBeTruthy()
  const reason = document.getElementById(id as string)
  expect(reason).not.toBeNull()
  expect((reason as HTMLElement).hidden).toBe(false)
  return reason as HTMLElement
}

describe('the nine rows render, header-keyed and whole', () => {
  // FAILS IF: a row or a cell stops rendering. Forty-five cells asserted by
  // row ordinal and column NAME.
  // PLANTED: changed `CC11_MATRIX.map` to `CC11_MATRIX.slice(0, 7).map` in
  // `ReportsAndBuilder.tsx` — dropping exactly the two rows that prohibit
  // everybody, which a reader scanning grants would not miss.
  // RED: expected [ <tr>…(7)</tr>, …(7) ] to have a length of 10 but got 8
  it('renders every cell of every row under its own column', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-11-matrix')).getAllByRole('row')).toHaveLength(
      CC11_MATRIX.length + 1,
    )
    for (const row of CC11_MATRIX) {
      for (const column of CC11_COLUMNS) {
        expect(
          screen.getByTestId(`cc-11-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the body cells are drawn in an order the header row does not
  // carry. This is the check the name-keyed one CANNOT make. On this matrix
  // seven rows give the Tenant Admin a grant and the Worker a prohibition, so
  // a reversed body puts a grant under the Worker's heading on seven rows.
  // PLANTED: `[...CC11_COLUMNS].reverse().map` for the body cells only.
  // RED: expected [ 'Explicitly prohibited', …(4) ] to deeply equal
  //      [ 'Allowed', …(4) ] — and the name-keyed gate above STAYED GREEN on
  //      the same plant, which is the whole reason this one exists.
  it('draws the body cells in the header’s own order', () => {
    RENDER()
    const table = screen.getByTestId('cc-11-matrix')
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((h) => h.textContent)
    expect(headers).toEqual(['Capability on this module', ...CC11_COLUMNS, 'Source'])
    const firstRow = within(screen.getByTestId('cc-11-row-1'))
      .getAllByRole('cell')
      .map((c) => c.textContent)
    expect(firstRow.slice(0, CC11_COLUMNS.length)).toEqual(
      CC11_COLUMNS.map((c) => CC11_MATRIX[0]?.cells[c].text),
    )
  })
})

describe('the five sets render as proposals, and nothing is invented', () => {
  // FAILS IF: a set renders as a settled name. Every one of the five must
  // carry the pending wording on screen, not only in the model.
  // PLANTED: changed the identity cell to render `Confirmed` whenever
  // `namesDifferAt` is empty — which is true of the three uncontested sets and
  // is exactly the plausible shortcut.
  // RED: set 1: expected 'Confirmed' to contain 'Pending — proposed, not
  //      confirmed'
  it('all five sets render as pending, with both Parts’ names', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-11-data-sets')).getAllByRole('row')).toHaveLength(
      CC11_DATA_SETS.length + 1,
    )
    for (const set of CC11_DATA_SETS) {
      expect(screen.getByTestId(`cc-11-set-${set.ordinal}-cc`).textContent).toContain(
        set.commandCenterName,
      )
      expect(screen.getByTestId(`cc-11-set-${set.ordinal}-doh`).textContent).toContain(set.hubName)
      expect(
        screen.getByTestId(`cc-11-set-${set.ordinal}-identity`).textContent,
        `set ${set.ordinal}`,
      ).toContain('Pending — proposed, not confirmed')
    }
    expect(screen.getByTestId('cc-11-identity-gap').textContent).toContain(
      'names 5 standard data sets and confirms 0',
    )
  })

  // FAILS IF: an outcome-flavoured example is rendered as a set. This is the
  // failure mode the dispatch names: the source hands a reader three
  // plausible names as ILLUSTRATIONS of a permitted swap, and one of them
  // sitting in the table would read as source-backed forever. The allowed
  // strings come from `swapExamples`, never from the set names under test.
  // PLANTED: changed set 4's `commandCenterName` to `Deviation trends by
  // severity` in `report-sets.ts`.
  // RED: expected [ Array(1) ] to deeply equal []
  it('no swap example is rendered as a set name, and they are labelled as examples', () => {
    RENDER()
    const offenders: string[] = []
    for (const set of CC11_DATA_SETS) {
      for (const half of ['cc', 'doh']) {
        const text = screen.getByTestId(`cc-11-set-${set.ordinal}-${half}`).textContent ?? ''
        for (const example of CC11_OPEN_IDENTITY.swapExamples) {
          if (text.toLowerCase().includes(example.toLowerCase())) {
            offenders.push(`set ${set.ordinal} renders the swap example "${example}"`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
    // And the examples DO appear, once, in the paragraph that calls them the
    // source's illustrations of a swap and not sets.
    const note = screen.getByTestId('cc-11-swap-not-grow').textContent ?? ''
    for (const example of CC11_OPEN_IDENTITY.swapExamples) expect(note).toContain(example)
    expect(note).toContain('not a sixth set')
    expect(note).toContain('no set is invented here')
  })

  // FAILS IF: the three cards are merged on screen, or one recommendation is
  // rendered as the decision's.
  // PLANTED: rendered only `CC11_DEC_REPORT_CARDS[0]` instead of mapping.
  // RED: TestingLibraryElementError: Unable to find an element by:
  //      [data-testid="cc-11-card-29892"]
  it('renders three decision cards, each with its own options and recommendation', () => {
    RENDER()
    for (const card of CC11_DEC_REPORT_CARDS) {
      const el = screen.getByTestId(`cc-11-card-${card.line}`)
      expect(el.textContent).toContain(card.recommendation)
      expect(el.textContent).toContain('recorded and not adopted')
      for (const option of card.options) expect(el.textContent).toContain(option)
    }
    expect(screen.getByTestId('cc-11-three-cards').textContent).toContain(
      'no two offer the same options',
    )
  })
})

describe('the class and its qualifier are drawn as two things', () => {
  // FAILS IF: the qualifier is collapsed into the class or the class is
  // dropped for the cell. Both are rendered in their own elements and the two
  // must differ — a screen showing only one of them has answered a question
  // the source asks twice.
  // PLANTED: rendered `{figures.freshnessClass}` in the class-cell slot, so
  // both elements read `refreshed`.
  // RED: expected 'refreshed' to be 'Refreshed with an explicit
  //      data-as-of…' // Object.is equality
  it('renders the verbatim class cell, the class it names, and the obligation', () => {
    RENDER()
    const cellText = screen.getByTestId('cc-11-class-cell').textContent
    const classText = screen.getByTestId('cc-11-class').textContent
    expect(cellText).toBe('Refreshed with an explicit data-as-of stamp')
    expect(classText).toBe('refreshed')
    expect(cellText).not.toBe(classText)
    expect(screen.getByTestId('cc-11-marker-obligation').textContent).toBe(
      'Data-as-of timestamp on the file itself',
    )
  })
})

describe('the frozen session closes the control and queues nothing', () => {
  // FAILS IF: the frozen control renders enabled, or renders no reason. The
  // reason is resolved through `aria-describedby` rather than off
  // `textContent`, which would be satisfied by the paragraph beside it.
  // PLANTED: changed `gateReason={CC_FROZEN_CONTROL_REASON}` to
  // `gateReason={null}` in `ReportsAndBuilder.tsx`.
  // RED: expected null to be 'true' // Object.is equality — the
  //      `aria-disabled` check fires first, before the reason is resolved
  it('the frozen control is disabled and states why, off the control itself', () => {
    RENDER()
    const frozen = within(screen.getByTestId('cc-11-authoring-frozen')).getByRole('button')
    // The primitive marks refusal with `aria-disabled`, not the `disabled`
    // attribute, so the control stays focusable and its reason reachable. A
    // gate keyed on `.disabled` reads every control on this build as enabled.
    expect(frozen.getAttribute('aria-disabled')).toBe('true')
    expect(reasonOf(frozen).textContent).toBe(CC_FROZEN_CONTROL_REASON)
    // The live control is the same grant, the same person, and enabled.
    const live = within(screen.getByTestId('cc-11-authoring-live')).getByRole('button')
    expect(live.getAttribute('aria-disabled')).toBeNull()
    expect(live.getAttribute('aria-describedby')).toBeNull()
    expect(live.textContent).toBe(frozen.textContent)
    expect(screen.getByTestId('cc-11-queues-nothing').textContent).toContain(
      'Nothing is queued, in any state',
    )
  })

  // FAILS IF: this screen grows operational controls. L38793 does not name
  // this module among the screens that exercise the ten, and a rail mounted
  // inside this panel would add ten buttons and pass every other gate here.
  // The count is the gate: two controls, the same act in two session states.
  // PLANTED: rendered a third `WriteControl` for `Export on demand`.
  // RED: expected …(3) to have a length of 2 but got 3
  it('draws exactly two controls and no link at all', () => {
    const { container } = RENDER()
    expect(container.querySelectorAll('button')).toHaveLength(2)
    expect(container.querySelector('a')).toBeNull()
    expect(screen.getByTestId('cc-11-no-action-rail').textContent).toContain(
      'No action rail is mounted on this screen',
    )
  })
})

describe('the Tenant Admin baseline renders whole', () => {
  // FAILS IF: a divergence is dropped on screen. Three modules on five rows,
  // each rendered with its own line and its own cell.
  // PLANTED: changed the divergence list's `.map` to `.slice(0, 3).map`.
  // RED: TestingLibraryElementError: Unable to find an element by:
  //      [data-testid="cc-11-ta-divergence-37670"]
  it('renders the restriction, all five divergent rows, and the two notes beside them', () => {
    RENDER()
    expect(screen.getByTestId('cc-11-ta-baseline').textContent).toContain(
      'Allowed with conditions — report and banner routes only',
    )
    for (const line of [36264, 36265, 36268, 37670, 38488]) {
      expect(screen.getByTestId(`cc-11-ta-divergence-${line}`)).toBeTruthy()
    }
    expect(screen.getByTestId('cc-11-ta-banner-module').textContent).toContain('MOD-CC-02')
    expect(screen.getByTestId('cc-11-ta-self-divergence').textContent).toContain('Read-only')
  })
})
