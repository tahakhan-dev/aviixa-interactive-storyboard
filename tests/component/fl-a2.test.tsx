import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MyRunsView } from '@/frontline/modules/fl-a2/MyRunsView'
import { A2_CARD, NO_PACE_NO_TIMER_NO_RANKING } from '@/frontline/modules/fl-a2/charter'
import { A2_COLUMNS, A2_MATRIX } from '@/frontline/modules/fl-a2/matrix'
import {
  A2_ACCEPTANCE_CRITERIA,
  A2_DISCLOSURES,
  A2_PENDING_FIXTURE,
} from '@/frontline/modules/fl-a2/service'

/**
 * `MOD-FL-A2`'s view, checked as a RENDERING rather than as a data
 * structure. The unit suite next door asks whether the transcription matches
 * the frozen source; this one asks whether what the source says reaches the
 * screen, because a claim held in data and never drawn is a code comment and
 * a code comment is not a disclosure.
 *
 * IT ALSO COVERS THE ONE THING THE UNIT SUITE STRUCTURALLY CANNOT. That one
 * walks the module's DATA, so a prohibited word typed straight into the JSX
 * would pass it. The sweep below reads the rendered document instead, which
 * is the only place that defect is visible.
 *
 * Every gate below was planted, watched go red, and restored. The `FAILS IF`
 * note names the defect that was actually planted.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function norm(s: string): string {
  return s
    .replace(/[`*_]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * The text a single element contributes ITSELF — its own text nodes, not its
 * descendants'. Walking `textContent` instead would report every ancestor up
 * to `<body>` as carrying whatever a leaf says, which is the element
 * concatenation that defeated a wave-1 sweep from the other direction.
 */
function ownText(el: Element): string {
  return [...el.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent ?? '')
    .join('')
}

describe('MOD-FL-A2 — what reaches the screen', () => {
  // FAILS IF: the module card stops rendering, or a statement is held in
  // data and never drawn. Planted: the Security field removed from the
  // rendered `A2_CARD.map`, by filtering to `onTheCard`. Went red at 5
  // against 15.
  it('draws every card statement, not only the identity card', () => {
    render(<MyRunsView />)
    const drawn = screen.getAllByTestId('fl-a2-card-statement')
    expect(drawn).toHaveLength(A2_CARD.length)
    const texts = screen.getAllByTestId('fl-a2-card-text').map((e) => norm(e.textContent ?? ''))
    for (const s of A2_CARD) {
      expect(texts, `${s.field} is drawn`).toContain(norm(s.text))
    }
    // The identity card's five are marked as such on the markup.
    expect(drawn.filter((e) => e.getAttribute('data-on-the-card') === 'true')).toHaveLength(5)
  })

  // FAILS IF: a matrix row stops rendering, or a row draws something other
  // than what `frontlineAffordance` returns. Planted: the matrix list
  // filtered to `row.surface === 'screen'`, dropping rows 3 and 9 — the two
  // whose acts belong to the Delivery Operations Hub, which are exactly the
  // rows a reader most needs to see. Went red at 7 against 9.
  it('draws all nine matrix rows, including the two met on another surface', () => {
    render(<MyRunsView />)
    const rows = screen.getAllByTestId('fl-a2-matrix-row')
    expect(rows).toHaveLength(9)
    expect(rows.map((r) => r.getAttribute('data-row'))).toEqual(A2_MATRIX.map((r) => r.id))
    const elsewhere = rows.filter((r) => r.getAttribute('data-row-surface') === 'another-surface')
    expect(elsewhere.map((r) => r.getAttribute('data-row'))).toEqual([
      'claim-unassigned-work',
      'cancel-a-run',
    ])
    for (const r of elsewhere) {
      expect(r.getAttribute('data-affordance')).toBe('cross-surface')
      // and wave 0's own cross-surface renderer is what drew it.
      expect(within(r).getAllByTestId('fl-cross-surface').length).toBeGreaterThan(0)
      expect(within(r).queryAllByRole('button')).toEqual([])
    }
  })

  // FAILS IF: the Worker column draws a control the matrix does not permit,
  // or loses one it does. Four matrix controls plus the manual-sync control
  // the sheet draws from the same row — five buttons, and the sheet's is row
  // 6 asked a second time rather than a sixth act.
  //
  // Planted: a "Sort by due time" button added to the list header. Went red
  // at 6 against 5 and named it.
  it('draws exactly the controls the matrix permits, and no others', () => {
    render(<MyRunsView />)
    const labels = screen.getAllByRole('button').map((b) => b.textContent ?? '')
    expect(labels.sort()).toEqual(
      [
        'View own assigned work',
        'Enter a ready Run',
        'Trigger a manual sync',
        'View the sync detail sheet',
        'Sync now',
      ].sort(),
    )
    // No control is drawn disabled. `FrontlineAffordance` has no `disabled`
    // member and `Button` marks a disabled control with `aria-disabled`, so
    // one appearing here means something reached around the fold.
    expect(document.querySelectorAll('[aria-disabled="true"]')).toHaveLength(0)
  })

  // FAILS IF: a non-Worker column draws anything. AC-FL-009-2 (L39945) says
  // no tenant role other than Worker holds an execution session. Planted:
  // the Supervisor render given `column="WORKER"` by a defaulted parameter —
  // which is the defaulted-parameter defeat wave 1 recorded, so the gate
  // asserts the markup's own `data-column` before it asserts the buttons.
  it('draws no control at all for the four columns that are not the Worker’s', () => {
    for (const column of A2_COLUMNS.filter((c) => c !== 'WORKER')) {
      const { unmount } = render(<MyRunsView column={column} />)
      expect(
        screen.getByTestId('fl-a2-my-runs').getAttribute('data-column'),
        `the ${column} render really is the ${column} column`,
      ).toBe(column)
      expect(screen.queryAllByRole('button'), `${column} draws nothing`).toEqual([])
      unmount()
    }
  })

  // FAILS IF: no search field, sort control or filter appears. AC-A2-2
  // (L40482) — "No interface exists for claiming, searching, or reordering
  // unassigned work" — and SB-FL-011's own last sentence. Planted: a
  // `<input type="search">` added to the list header. Went red.
  it('has no search field, no filter and no select anywhere', () => {
    render(<MyRunsView />)
    expect(screen.queryAllByRole('textbox')).toEqual([])
    expect(screen.queryAllByRole('searchbox')).toEqual([])
    expect(screen.queryAllByRole('combobox')).toEqual([])
    expect(screen.queryAllByRole('checkbox')).toEqual([])
    expect(document.querySelectorAll('input, select, textarea')).toHaveLength(0)
    expect(LINES[40481]).toContain('No interface exists for claiming, searching, or reordering')
  })
})

describe('the work list', () => {
  // FAILS IF: a not-yet-ready Run becomes enterable, or loses its stated
  // reason. AC-A2-3 (L40483): shown as not-yet-ready WITH A REASON, not
  // enterable, and never omitted. Planted: `governingRow` changed to return
  // 'enter-a-ready-run' for STATE-A2-NOTREADY. A button appeared on the row
  // and this went red on both assertions.
  it('shows a not-yet-ready Run with its reason and draws no way in', () => {
    render(<MyRunsView />)
    const run = screen
      .getAllByTestId('fl-a2-run')
      .find((r) => r.getAttribute('data-state') === 'STATE-A2-NOTREADY')
    expect(run, 'the not-yet-ready Run is in the list at all').toBeDefined()
    if (run === undefined) throw new Error('no not-yet-ready Run rendered')
    expect(run.getAttribute('data-enterable')).toBe('false')
    expect(within(run).queryAllByRole('button')).toEqual([])
    expect(run.textContent).toContain('Not yet ready. Waiting for the work package.')
    expect(run.textContent).toContain('the package has not arrived, so nothing can be rendered')
    expect(LINES[40482]).toContain('is not enterable, and is never omitted from the list')
  })

  // FAILS IF: the one act this screen exists for stops being drawn. The
  // source's own earlier moment (L40473) is where a READY Run appears, and a
  // screen that renders only the storyboard's later moment demonstrates the
  // refusals and never the act. Planted: the shift-start moment's Run state
  // changed to STATE-A2-INPROGRESS. Went red — no button, and the enterable
  // flag went false.
  it('draws the way into a ready Run, at the moment the source shows one', () => {
    render(<MyRunsView moment="shift-start" />)
    const run = screen
      .getAllByTestId('fl-a2-run')
      .find((r) => r.getAttribute('data-state') === 'STATE-A2-READY')
    expect(run, 'the ready Run is rendered').toBeDefined()
    if (run === undefined) throw new Error('no ready Run rendered')
    expect(run.getAttribute('data-enterable')).toBe('true')
    const button = within(run).getByRole('button')
    expect(button.textContent).toBe('Enter RUN-2026-08-14-A')
    expect(screen.getByTestId('fl-a2-moment').textContent).toContain('L40473')
    expect(LINES[40472]).toContain('`RUN-2026-08-14-A` ready, pre-synced at shift start')
  })

  // FAILS IF: the parked Run is dropped from the list, or its reason names
  // something the worker could do about it. FB-FL-GATE-01 (L40112): "There
  // is no on-device worker override, ever." Planted: the parked Run removed
  // from the fixture — which is the "empty but explained list" DEC-PARK-001
  // is about and is not this build's to choose. Went red.
  it('keeps the parked Run in the list, with its reason and no way out of it', () => {
    render(<MyRunsView />)
    const run = screen
      .getAllByTestId('fl-a2-run')
      .find((r) => r.getAttribute('data-state') === 'STATE-A2-PARKED')
    expect(run, 'the parked Run is in the list').toBeDefined()
    if (run === undefined) throw new Error('no parked Run rendered')
    expect(run.textContent).toContain(
      'Parked — waiting for a clearance from your supervisor. You can continue your other runs.',
    )
    expect(within(run).getByTestId('fl-a2-parked-reason').textContent).toContain(
      'there is no on-device worker override, ever',
    )
    expect(within(run).queryAllByRole('button')).toEqual([])
    expect(LINES[40111]).toContain('There is no on-device worker override, ever')
  })

  // FAILS IF: a Run state the matrix does not speak to is answered anyway.
  // The in-progress row has no governing row, and the screen says so rather
  // than guessing. Planted: `governingRow` changed to fall back to
  // 'enter-a-ready-run'. The unrecorded statement disappeared and a button
  // appeared. Went red.
  it('says so where no matrix row speaks to a Run’s state', () => {
    render(<MyRunsView />)
    const run = screen
      .getAllByTestId('fl-a2-run')
      .find((r) => r.getAttribute('data-state') === 'STATE-A2-INPROGRESS')
    if (run === undefined) throw new Error('no in-progress Run rendered')
    const line = within(run).getByTestId('fl-a2-no-governing-row')
    expect(line.textContent).toContain('unrecorded in the frozen source')
    expect(within(run).queryAllByRole('button')).toEqual([])
  })
})

describe('the sync detail sheet', () => {
  // FAILS IF: the sheet collapses its states into one figure, or prints a
  // bare success. FUNC-A2-04-2-1 (L40446) and AC-A2-5 (L40485). Planted: the
  // rows replaced with a single "14 items pending sync" paragraph. Went red
  // at 1 against 4.
  it('lists pending items by their distinct capture states', () => {
    render(<MyRunsView />)
    const rows = screen.getAllByTestId('fl-a2-sheet-row')
    expect(rows).toHaveLength(Object.keys(A2_PENDING_FIXTURE).length)
    expect(new Set(rows.map((r) => r.getAttribute('data-capture-state'))).size).toBe(rows.length)
    const sheet = screen.getByTestId('fl-a2-sync-sheet')
    expect(sheet.textContent).toContain('14 items are held on this tablet')
    // Not one of the rows says a capture is synced, sent, or done.
    for (const r of rows) {
      expect(r.textContent ?? '').not.toMatch(/\b(synced|sent|done|complete|success)\b/i)
    }
    expect(LINES[40445]).toContain('rather than as one undifferentiated "synced" figure')
  })

  // FAILS IF: the offline manual sync appears to have worked, or the control
  // is withheld offline. FUNC-A2-04-2-2 (L40447): "Offline: the control is
  // present but plainly reports that there is no connection." Planted: the
  // control given a `disabledReason` when offline — the button gained
  // `aria-disabled` and this went red.
  it('keeps the manual sync control present offline and reports no connection', () => {
    render(<MyRunsView online={false} />)
    const button = screen.getByRole('button', { name: 'Sync now' })
    expect(button.getAttribute('aria-disabled')).toBeNull()
    expect(screen.getByTestId('fl-a2-manual-sync-result').textContent).toContain(
      'There is no connection, so nothing was sent.',
    )
    expect(LINES[40446]).toContain('the control is present but plainly reports')
  })
})

describe('the disclosures that must reach the screen', () => {
  // FAILS IF: an open decision is held in data and not drawn, or a reading
  // is dropped from one. Planted: the readings list filtered to the first
  // two, which for DEC-PARK-001 would have dropped the third candidate
  // behaviour — the only one the source names that this screen could
  // otherwise be read as having chosen. Went red on the count.
  it('draws all three decisions and every one of their readings', () => {
    render(<MyRunsView />)
    const drawn = screen.getAllByTestId('fl-a2-decision')
    expect(drawn.map((d) => d.getAttribute('data-decision'))).toEqual(
      A2_DISCLOSURES.map((d) => d.decisionRef),
    )
    for (const d of A2_DISCLOSURES) {
      const block = drawn.find((e) => e.getAttribute('data-decision') === d.decisionRef)
      if (block === undefined) throw new Error(`${d.decisionRef} not drawn`)
      const readings = within(block).getAllByTestId('fl-a2-decision-reading')
      expect(readings, `${d.decisionRef} readings`).toHaveLength(d.readings.length)
      expect(block.textContent).toContain('A client-delegated choice under APP-012')
      expect(block.textContent).toContain(d.canonNote)
    }
  })

  // FAILS IF: the AC-FL-011-1 gap is quietly closed on screen, or the three
  // identifiers stop being named. Planted: the ternary's empty branch forced,
  // so the screen claimed all eleven functionalities name a pattern. Went
  // red.
  it('names the three functionalities that name no fallback pattern', () => {
    render(<MyRunsView />)
    const line = screen.getByTestId('fl-a2-ac-fl-011-1').textContent ?? ''
    for (const id of ['FUNC-A2-01-1-2', 'FUNC-A2-04-1-1', 'FUNC-A2-04-1-2']) {
      expect(line, `${id} is named`).toContain(id)
    }
    expect(line).toContain('AC-FL-011-1 (L40151)')
    expect(line).not.toMatch(/All 11 functionalities/)
  })

  // FAILS IF: the three readings of this module's fallback set are shown as
  // one. Planted: the divergence paragraph removed from the view. Went red.
  it('shows all three readings of the fallback set', () => {
    render(<MyRunsView />)
    const note = screen.getByTestId('fl-a2-pattern-divergence').textContent ?? ''
    expect(note).toContain('names two patterns')
    expect(note).toContain('names four')
    expect(note).toContain('name three')
    expect(note).toContain('none is corrected here')
  })

  // FAILS IF: the Tenant Admin device-session question is answered on
  // screen, or restated instead of read. AC-FL-009-5 (L39948). Planted: the
  // `open.why` branch replaced with "A Tenant Admin does not hold a device
  // session." Went red on the phrase the registry actually carries.
  it('discloses the Tenant Admin device-session question without answering it', () => {
    render(<MyRunsView column="TENANT_ADMIN" />)
    const open = screen.getByTestId('fl-a2-open-decision')
    expect(open.getAttribute('data-decision')).toBe('AC-FL-009-5')
    expect(open.textContent).toContain('the Statement of Work neither grants nor denies it')
    expect(open.textContent).toContain('not resolved in either direction')
    expect(open.textContent).not.toMatch(/\b(does not hold|holds) a device session\b/)
  })

  // FAILS IF: both readings of SCR-FL-02 stop standing together. The
  // destination card reads them from wave 0, whose shape cannot record one
  // as the answer. Planted: the `registerB` line removed from the card.
  it('shows both registers’ readings of SCR-FL-02', () => {
    render(<MyRunsView />)
    const card = screen.getByTestId('fl-a2-contested-token')
    expect(card.getAttribute('data-token')).toBe('SCR-FL-02')
    expect(card.textContent).toContain('My Runs')
    expect(card.textContent).toContain('Fast Personal Identification Number switch, Shared mode')
    expect(card.textContent).toContain('L48530')
    expect(card.textContent).toContain('L39864')
  })

  // FAILS IF: the seven acceptance criteria stop being drawn. Planted: one
  // dropped.
  it('draws the seven acceptance criteria', () => {
    render(<MyRunsView />)
    const drawn = screen.getAllByTestId('fl-a2-ac')
    expect(drawn.map((e) => e.getAttribute('data-ac'))).toEqual(
      A2_ACCEPTANCE_CRITERIA.map((a) => a.id),
    )
  })
})

describe('the categorical absence, swept over the rendered document', () => {
  const HAZARD = /\b(pace|timers?|countdowns?|rankings?)\b/i

  // FAILS IF: any element on this page contributes one of the four words in
  // its OWN text outside the three places entitled to quote the source.
  // `EXCL-FL-08` (L39491) is an Invariant exclusion and a wave-3 task sweeps
  // the built tree for exactly these words.
  //
  // WHY OWN TEXT AND NOT `textContent`. A `textContent` sweep reports every
  // ancestor up to `<body>` as carrying whatever a leaf says, so it cannot
  // tell where the word is. Wave 1 recorded the mirror of that: a
  // `textContent` word sweep defeated by element concatenation.
  //
  // Planted three times. "You are ahead of the usual pace today." in the
  // header — red. The same sentence INSIDE the absence list, which the first
  // version of this gate allowed because the section was allowed — that
  // passed, and is why the selector below names the QUOTING ELEMENT rather
  // than the section; re-planted, red. "Your ranking this shift is third."
  // inside a decision block, and "12 minutes on the countdown." inside a run
  // row — both red.
  //
  // ITS REMAINING CEILING: a hazard word substituted INTO one of the three
  // quoting elements' own data would pass here, because that data is exactly
  // what they are entitled to carry. The unit suite is what stands behind
  // that: it holds every quotation to the source line it cites and holds the
  // set of quoting places to a fixed list.
  it('carries the four words only inside a quoted source statement', () => {
    render(<MyRunsView />)
    // THE THREE ELEMENTS THAT RENDER A TRANSCRIBED FIELD AND NOTHING ELSE,
    // not the three SECTIONS they sit in. Allowing the sections passed a
    // planted "You are ahead of the usual pace today." dropped inside the
    // absence list — the word was in a section entitled to quote the source,
    // in an element that was quoting nothing. Narrowing to the quoting
    // element itself closes that, and pairs with the unit gate that holds the
    // set of quotations to a fixed list.
    const allowed =
      '[data-testid="fl-a2-absence-quote"], [data-testid="fl-a2-reading-text"], [data-testid="fl-a2-card-text"]'
    const offenders: string[] = []
    for (const el of document.querySelectorAll('*')) {
      const own = ownText(el)
      const hit = own.match(HAZARD)
      if (hit === null) continue
      if (el.closest(allowed) === null) {
        offenders.push(`<${el.tagName.toLowerCase()}> "${hit[0]}" in "${own.trim().slice(0, 60)}"`)
      }
    }
    expect(offenders).toEqual([])
    // and the sweep really can see the words where they ARE allowed, which
    // is what proves it is looking at all.
    const inAbsence = [...document.querySelectorAll('[data-testid="fl-a2-absence-quote"]')].filter(
      (el) => HAZARD.test(ownText(el)),
    )
    expect(inAbsence.length).toBeGreaterThan(0)
  })

  // FAILS IF: the absence is not stated on screen. A screen that merely
  // omits a pace figure and never says why leaves the next task free to add
  // one. Planted: the section removed.
  it('states the absence, with its own locators', () => {
    render(<MyRunsView />)
    const section = screen.getByTestId('fl-a2-no-pace')
    expect(within(section).getAllByTestId('fl-a2-absence')).toHaveLength(
      NO_PACE_NO_TIMER_NO_RANKING.length,
    )
    for (const a of NO_PACE_NO_TIMER_NO_RANKING) {
      expect(section.textContent, a.sourceRef).toContain(a.sourceRef)
    }
  })

  // FAILS IF: this screen ever tells a worker a Run is complete because they
  // declared themselves finished. AC-A2-6 (L40486). Planted: the completion
  // claim paragraph rewritten to "Run complete." Went red on both halves.
  it('never says a worker-finished Run is complete', () => {
    render(<MyRunsView />)
    const page = document.body.textContent ?? ''
    expect(page).not.toMatch(/\bRun complete\b/)
    expect(page).not.toMatch(/\bAll runs complete\b/i)
    const claim = screen.getByTestId('fl-a2-completion-claim').textContent ?? ''
    expect(claim).toContain('This screen never claims')
    expect(claim).toContain('worker-finished')
    expect(claim).toContain('complete-and-synced')
    // The four words, all four drawn, with only one of them marked as
    // rendering here.
    const words = screen.getAllByTestId('fl-a2-completion-word')
    expect(words).toHaveLength(4)
    expect(
      words.filter((w) => w.getAttribute('data-renders') === 'true').map((w) => w.getAttribute('data-word')),
    ).toEqual(['worker-finished'])
  })
})

describe('the arriving-command banner and the readiness detail', () => {
  // FAILS IF: the banner blocks, or claims a fleet state this device cannot
  // see. SB-FL-007 (L39709) and L39670. Planted: the banner given
  // `role="alertdialog"`. Went red on the role.
  it('draws a non-blocking banner that names what changed and what follows', () => {
    render(<MyRunsView />)
    const banner = screen.getByTestId('fl-a2-command-banner')
    expect(banner.getAttribute('role')).toBe('note')
    expect(banner.textContent).toContain(
      'Lot WB-2291 has been released. You can continue Run 2026-08-14-A.',
    )
    expect(banner.textContent).toContain('It does not appear mid-capture')
    expect(banner.textContent).toContain('when this tablet has applied the release command')
    expect(screen.queryAllByRole('dialog')).toEqual([])
    expect(screen.queryAllByRole('alertdialog')).toEqual([])
  })

  // FAILS IF: the SCR-FL-05 conflict is settled on screen rather than
  // disclosed. Planted: the note trimmed to §22.7's reading alone. Went red.
  it('discloses both readings of SCR-FL-05 without settling them', () => {
    render(<MyRunsView />)
    const section = screen.getByTestId('fl-a2-package-readiness')
    expect(section.textContent).toContain('Package readiness detail')
    expect(section.textContent).toContain('Training Library')
    expect(section.textContent).toContain('Both readings stand; neither register is corrected.')
    expect(section.textContent).toContain('L39867')
    expect(section.textContent).toContain('L48533')
  })
})
