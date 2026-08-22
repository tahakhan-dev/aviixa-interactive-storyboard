import { describe, it, expect } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CoachingView, FL_B8_PANEL } from '@/frontline/modules/fl-b8/CoachingPanel'
import { B8_CARD, B8_STATES, SB_FL_017 } from '@/frontline/modules/fl-b8/charter'
import {
  FL_B8_COLUMNS,
  FL_B8_MATRIX,
  type FlB8Column,
} from '@/frontline/modules/fl-b8/matrix'
import {
  B8_ACCEPTANCE_CRITERIA,
  B8_FUNCTIONALITIES,
  B8_LOCAL_DISCLOSURES,
  B8_NOTIFICATIONS,
} from '@/frontline/modules/fl-b8/service'

/**
 * `MOD-FL-B8`'s panel, checked as a RENDERING rather than as a data structure.
 * The unit suite next door asks whether the transcription matches the frozen
 * source; this one asks whether what the source says reaches the screen, and
 * whether the card behaves as an advisory rather than as a gate.
 *
 * THE GATE THIS FILE EXISTS FOR. A coaching card built as a modal that must be
 * dismissed converts an advisory into a gate, and it ships as ordinary
 * competent interface work. So the modal check is asked in EVERY card state and
 * for EVERY reach of the agent layer, not once on first paint: a card that
 * became modal only after it was played would pass a single-state check.
 *
 * Every gate below was planted, watched go red, and restored. The `FAILS IF`
 * note names the defect that was actually planted.
 */

const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

function srcLine(n: number): string {
  const l = SOURCE[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

/**
 * THE WHOLE PAGE'S TEXT, NOT ONE ELEMENT'S, AND THAT IS THE GATE'S REACH.
 * Wave 1 recorded a word sweep defeated by element concatenation — a forbidden
 * word split across two adjacent spans is invisible to a per-element scan and
 * plainly visible to a reader. Reading the body joins them, which is what a
 * reader does.
 */
function pageText(): string {
  return document.body.textContent ?? ''
}

/**
 * Whether an element is actually on the page for a reader, rather than merely
 * in the document. THIS EXISTS BECAUSE A GATE COULD NOT FAIL WITHOUT IT: a
 * `hidden` attribute leaves `textContent` untouched, so a statement moved
 * behind a click passes a `textContent` check verbatim. jsdom computes no
 * layout, so the check walks the ancestor chain for the three ways a rendering
 * hides a node without removing it.
 */
function isShown(el: Element | null): boolean {
  for (let n: Element | null = el; n !== null; n = n.parentElement) {
    if (n instanceof HTMLElement) {
      if (n.hidden) return false
      const d = n.style.display
      const v = n.style.visibility
      if (d === 'none' || v === 'hidden') return false
    }
    if (n.getAttribute('hidden') !== null) return false
    if (n.getAttribute('aria-hidden') === 'true') return false
  }
  return el !== null
}

/** Every way a rendering can trap a reader behind a card. */
function modalElements(): readonly Element[] {
  return [
    ...document.querySelectorAll('dialog'),
    ...document.querySelectorAll('[role="dialog"]'),
    ...document.querySelectorAll('[role="alertdialog"]'),
    ...document.querySelectorAll('[aria-modal]'),
  ]
}

const EXCLUDED = /\b(pace|timer|countdown|ranking|leaderboard|productivity|quota)\b/i

/** The counter that arrives as a kindness. */
const COUNTER =
  /\b(you have seen this|seen \d+ times?|\d+ times? (?:this|so far|today)|repeat rate|dismissal count|compared (?:to|with) (?:the )?(?:cell|other workers?|your team|average)|cell average)\b/i

const REACH_BUTTONS = {
  available: 'Connected, agent layer answering',
  offline: 'This tablet has no connection',
  'agent-outage': 'A server-side agent outage',
  'emergency-pause': 'A platform-wide or per-tenant emergency pause',
} as const

function renderFor(role: FlB8Column = 'WORKER') {
  cleanup()
  render(<CoachingView viewerRole={role} />)
}

function setReach(reach: keyof typeof REACH_BUTTONS) {
  fireEvent.click(screen.getByRole('button', { name: REACH_BUTTONS[reach] }))
}

/* ==================================================================== *
 * THE CARD IS NOT A GATE.
 * ==================================================================== */

describe('the card at the step is advisory and never a gate', () => {
  // FAILS IF: any state of this panel puts the card behind a modal. Sixteen
  // checks — four reaches × the states each reach can reach — not one on first
  // paint. Planted by wrapping the card region in
  // `<div role="dialog" aria-modal="true">`: red on the first state and on
  // every subsequent one.
  it('renders no dialog, no alertdialog and no aria-modal in any state', () => {
    for (const reach of Object.keys(REACH_BUTTONS) as (keyof typeof REACH_BUTTONS)[]) {
      renderFor('WORKER')
      setReach(reach)
      expect(modalElements(), `${reach} · offered`).toEqual([])

      const play = screen.queryByRole('button', { name: 'Play again' })
      if (play !== null) {
        fireEvent.click(play)
        expect(modalElements(), `${reach} · replayed`).toEqual([])
      }
      const leave = screen.queryByRole('button', { name: 'Leave it open and carry on' })
      if (leave !== null) {
        fireEvent.click(leave)
        expect(modalElements(), `${reach} · viewed`).toEqual([])
      }
      const dismiss = screen.queryByRole('button', { name: 'Dismiss' })
      if (dismiss !== null) {
        fireEvent.click(dismiss)
        expect(modalElements(), `${reach} · dismissed`).toEqual([])
      }
    }
    cleanup()
  })

  // FAILS IF: the statement that the step is unaffected is absent, or hidden,
  // in ANY card state. Planted twice: once by rendering it only when the card
  // had been dismissed — red in the offered, viewed and replayed states — and
  // once by adding `hidden` to it, which `textContent` alone did not catch and
  // `isShown` did.
  it('keeps the step unaffected in every card state, visibly', () => {
    const states: string[] = []
    for (const reach of Object.keys(REACH_BUTTONS) as (keyof typeof REACH_BUTTONS)[]) {
      renderFor('WORKER')
      setReach(reach)
      const check = (label: string) => {
        const el = screen.getByTestId('fl-b8-step-unaffected')
        expect(isShown(el), `${reach} · ${label}`).toBe(true)
        expect(el.textContent, `${reach} · ${label}`).toContain(
          'coaching is advisory and never gates'.replace('coaching', 'Coaching'),
        )
        states.push(`${reach}/${label}`)
      }
      check('offered')
      const play = screen.queryByRole('button', { name: 'Play again' })
      if (play !== null) {
        fireEvent.click(play)
        check('replayed')
      }
      const dismiss = screen.queryByRole('button', { name: 'Dismiss' })
      if (dismiss !== null) {
        fireEvent.click(dismiss)
        check('dismissed')
      }
    }
    expect(states.length).toBeGreaterThanOrEqual(6)
    cleanup()
  })

  // FAILS IF: the card becomes a dialog, or the panel grows a backdrop or an
  // inert wrapper — the three shapes that trap a reader without using the word
  // dialog.
  //
  // THIS ASSERTED `tagName === 'SECTION'` AND THAT WAS THE WRONG PROPERTY. The
  // claim is that coaching never gates (L41471); the element being a `section`
  // rather than a `div` was one way to satisfy it, not the claim itself. When
  // the Frontline modules moved off `<section>` for inner groupings — 128 of
  // them were landmarks, so a composed page exposed about a hundred regions and
  // axe's `landmark-unique` failed on four routes — this went red for a reason
  // that had nothing to do with gating. A gate that fails on a correct change
  // and passes on a `<section role="dialog" aria-modal="true">` is checking the
  // wrong thing in both directions.
  //
  // It now asserts what it means, and it asserts MORE than it did: no dialog
  // element, no dialog role, no modal flag, no backdrop, nothing inert.
  it('draws the card as a plain grouping — never a dialog, a backdrop, or anything inert', () => {
    renderFor('WORKER')
    const region = screen.getByTestId('fl-b8-card-region')
    expect(region.tagName).not.toBe('DIALOG')
    expect(region.getAttribute('role')).not.toBe('dialog')
    expect(region.getAttribute('role')).not.toBe('alertdialog')
    expect(region.getAttribute('aria-modal')).toBeNull()
    expect(document.querySelectorAll('dialog')).toHaveLength(0)
    expect(document.querySelectorAll('[role="dialog"], [role="alertdialog"]')).toHaveLength(0)
    expect(document.querySelectorAll('[aria-modal]')).toHaveLength(0)
    expect(document.querySelectorAll('[inert]')).toHaveLength(0)
    expect(document.querySelectorAll('[data-backdrop]')).toHaveLength(0)
    cleanup()
  })

  // FAILS IF: dismissing removes the card and leaves nothing said, or leaves
  // the card up. Both directions, because a card that could not be dismissed is
  // as wrong as one that had to be.
  it('lets the card be waved away, and says what happened', () => {
    renderFor('WORKER')
    expect(screen.getByTestId('fl-b8-card-region').dataset.cardState).toBe('offered')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.getByTestId('fl-b8-card-region').dataset.cardState).toBe('dismissed')
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull()
    const note = screen.getByTestId('fl-b8-dismissal-note')
    expect(isShown(note)).toBe(true)
    expect(note.textContent).toContain('reaches nobody')
    cleanup()
  })

  // FAILS IF: the card can be replayed only once, or replay leaves the step.
  // `TEST-B8-2` (L41588) asks for repeated playback without leaving the step.
  it('replays without leaving the step, more than once', () => {
    renderFor('WORKER')
    for (const expected of ['STATE-B8-REPLAYED', 'STATE-B8-REPLAYED']) {
      fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
      expect(screen.getByTestId('fl-b8-card-region').dataset.cardState).toBe(
        expected.replace('STATE-B8-', '').toLowerCase(),
      )
      expect(isShown(screen.getByTestId('fl-b8-step-unaffected'))).toBe(true)
    }
    expect(srcLine(41588)).toContain('without leaving the step')
    cleanup()
  })
})

/* ==================================================================== *
 * THE FALLBACK, AND THE MESSAGE THAT MUST NOT APPEAR.
 * ==================================================================== */

describe('what the worker sees when the agent cannot be reached', () => {
  // FAILS IF: the card region announces an agent failure. `TEST-B8-5` (L41591)
  // and `SB-FL-017` frame 3. Scoped to the card region rather than the page,
  // because the page states the rule elsewhere and legitimately — L41504 puts
  // agent unavailability on the oversight surfaces, and a page-wide sweep would
  // therefore be a gate that could never pass rather than one that could never
  // fail. Planted by adding "The coaching agent is unavailable." to the
  // fallback body: red for all three absent reaches.
  it('renders the authored instruction and names no agent failure, for all three causes', () => {
    for (const reach of ['offline', 'agent-outage', 'emergency-pause'] as const) {
      renderFor('WORKER')
      setReach(reach)
      const region = screen.getByTestId('fl-b8-card-region')
      expect(region.dataset.guidance, reach).toBe('authored-work-instruction')
      expect(region.textContent ?? '', reach).toContain('authored Work Instruction')
      expect(region.textContent ?? '', reach).not.toMatch(
        /unavailab|not available|outage|failed|failure|degraded|error|sorry/i,
      )
      expect(screen.queryByRole('button', { name: 'Play again' }), reach).toBeNull()
      expect(screen.queryByRole('button', { name: 'Dismiss' }), reach).toBeNull()
    }
    expect(srcLine(41591)).toContain('no agent-unavailable message appears')
    cleanup()
  })

  // FAILS IF: the three causes render differently to the worker. Compared as
  // rendered text of the card region, which is what a worker actually sees.
  it('renders the same card region for offline, outage and pause', () => {
    const seen: string[] = []
    for (const reach of ['offline', 'agent-outage', 'emergency-pause'] as const) {
      renderFor('WORKER')
      setReach(reach)
      seen.push(screen.getByTestId('fl-b8-card-region').textContent ?? '')
    }
    expect(new Set(seen).size).toBe(1)
    cleanup()
  })

  // FAILS IF: the panel stops saying that the deterministic layer is untouched.
  // `AC-B8-6` (L41581) is the criterion and wave 0's treatment is the source.
  it('states that gates, detection and the Severity 1 hold are untouched', () => {
    renderFor('WORKER')
    setReach('emergency-pause')
    expect(pageText()).toContain('Severity 1 hold')
    expect(pageText()).toContain(
      'exactly as they do connected',
    )
    expect(srcLine(41581)).toContain('leaves gates, detection, classification, and the Severity 1 hold untouched')
    cleanup()
  })
})

/* ==================================================================== *
 * NOTHING IS COUNTING.
 * ==================================================================== */

describe('support, not surveillance', () => {
  // FAILS IF: a counter, a comparison or a repeat rate reaches the page, in any
  // state. Planted by adding "You have seen this 3 times." to the card body:
  // red, and the regex named the phrase.
  it('shows no count, no comparison and no repeat rate, in any state', () => {
    for (const reach of Object.keys(REACH_BUTTONS) as (keyof typeof REACH_BUTTONS)[]) {
      renderFor('WORKER')
      setReach(reach)
      expect(COUNTER.test(pageText()), `${reach} · offered`).toBe(false)
      const dismiss = screen.queryByRole('button', { name: 'Dismiss' })
      if (dismiss !== null) {
        fireEvent.click(dismiss)
        expect(COUNTER.test(pageText()), `${reach} · dismissed`).toBe(false)
      }
    }
    // The gate can fail: the phrase it hunts for is caught when it is put
    // through the identical test.
    expect(COUNTER.test(`${pageText()} You have seen this 3 times.`)).toBe(true)
    cleanup()
  })

  // FAILS IF: an excluded word reaches the rendered page. Read off the body so
  // a word split across two spans is joined the way a reader joins it.
  it('renders no excluded word anywhere on the page, in any state', () => {
    for (const reach of Object.keys(REACH_BUTTONS) as (keyof typeof REACH_BUTTONS)[]) {
      renderFor('WORKER')
      setReach(reach)
      expect(EXCLUDED.test(pageText()), reach).toBe(false)
    }
    expect(EXCLUDED.test(`${pageText()} countdown`)).toBe(true)
    cleanup()
  })

  // FAILS IF: the panel builds the per-worker view row 5 forbids. The three
  // places it names are rendered as statements and none of them is a control.
  it('draws no control for another worker’s coaching history, in any column', () => {
    for (const role of FL_B8_COLUMNS) {
      renderFor(role)
      const cells = screen.getAllByTestId('fl-b8-cell').filter(
        (c) => c.dataset.row === 'see-another-workers-coaching-history',
      )
      expect(cells, role).toHaveLength(5)
      for (const c of cells) {
        expect(c.dataset.kind, `${role}/${c.dataset.column}`).not.toBe('control')
      }
    }
    cleanup()
  })

  // FAILS IF: the notifications table stops saying nobody is told about a
  // single dismissal.
  it('renders both notification rows, including the one whose recipient is nobody', () => {
    renderFor('WORKER')
    const rows = screen.getAllByTestId('fl-b8-notification')
    expect(rows).toHaveLength(B8_NOTIFICATIONS.length)
    expect(rows[0]?.textContent).toContain('Nobody')
    expect(pageText()).toContain('one dismissed nudge is a data point, a pattern is a signal')
    cleanup()
  })
})

/* ==================================================================== *
 * THE MATRIX ON SCREEN.
 * ==================================================================== */

describe('the matrix reaches the screen, cell by cell', () => {
  // FAILS IF: a cell's own words are dropped in favour of the fold's verdict.
  // Wave 0's fold returns the ROW's note for a cross-surface row, so a table
  // that printed only the verdict would lose the Worker cell of row 5. Planted
  // by removing the own-words span: red on all thirty-five.
  it('draws all thirty-five cells with their own words beside the verdict', () => {
    renderFor('WORKER')
    const cells = screen.getAllByTestId('fl-b8-cell')
    expect(cells).toHaveLength(35)
    const own = screen.getAllByTestId('fl-b8-cell-own-words')
    expect(own).toHaveLength(35)
    for (const row of FL_B8_MATRIX) {
      for (const column of FL_B8_COLUMNS) {
        const cell = cells.find(
          (c) => c.dataset.row === row.id && c.dataset.column === column,
        )
        expect(cell, `${row.id}/${column}`).toBeDefined()
        expect(cell?.textContent, `${row.id}/${column}`).toContain(row.cells[column].note)
      }
    }
    cleanup()
  })

  // FAILS IF: the Read-only Auditor's cell of row 5 is rendered as belonging to
  // the Client Command Center — which is what wave 0's fold returns for it, and
  // the reason this module carries a per-column destination. Planted by
  // deleting `metElsewhereByColumn`'s READONLY_AUDITOR entry, which makes the
  // panel fall back to the row's own note: red, because the cell then read
  // "Client Command Center" and its own words say the Hub.
  it('names the Hub for the Auditor and the Command Center for the other two', () => {
    renderFor('WORKER')
    const cells = screen.getAllByTestId('fl-b8-cell').filter(
      (c) => c.dataset.row === 'see-another-workers-coaching-history',
    )
    const byColumn = new Map(cells.map((c) => [c.dataset.column, c]))
    expect(byColumn.get('READONLY_AUDITOR')?.dataset.place).toBe('SURF-DOH')
    expect(byColumn.get('READONLY_AUDITOR')?.textContent).toContain(
      'in the Delivery Operations Hub record',
    )
    expect(byColumn.get('READONLY_AUDITOR')?.textContent).not.toContain(
      'Client Command Center',
    )
    expect(byColumn.get('SUPERVISOR')?.dataset.place).toBe('SURF-CC')
    expect(byColumn.get('QUALITY_MANAGER')?.dataset.place).toBe('SURF-CC')
    // and the two cells that name nowhere name nowhere
    expect(byColumn.get('WORKER')?.dataset.place).toBe('none')
    expect(byColumn.get('TENANT_ADMIN')?.dataset.place).toBe('none')
    cleanup()
  })

  // FAILS IF: the three places stop being drawn as cross-surface statements,
  // or a fourth appears.
  it('draws one cross-surface statement per place named, and no control in any', () => {
    renderFor('WORKER')
    const acts = screen.getAllByTestId('fl-cross-surface')
    expect(acts).toHaveLength(4)
    for (const a of acts) {
      expect(a.querySelector('button')).toBeNull()
    }
    expect(pageText()).toContain('Standards and Operations Studio')
    cleanup()
  })

  // FAILS IF: a non-Worker column is given a control on this panel. Every
  // control this matrix draws is the Worker's.
  it('draws no card control at all for the four non-Worker columns', () => {
    for (const role of FL_B8_COLUMNS.filter((c) => c !== 'WORKER')) {
      renderFor(role)
      expect(screen.queryByRole('button', { name: 'Play again' }), role).toBeNull()
      expect(screen.queryByRole('button', { name: 'Dismiss' }), role).toBeNull()
      const drawn = screen
        .getAllByTestId('fl-b8-cell')
        .filter((c) => c.dataset.column === role && c.dataset.kind === 'control')
      expect(drawn, role).toEqual([])
    }
    cleanup()
  })

  // FAILS IF: a refused act renders as a disabled control rather than as no
  // control plus a stated line. `FrontlineAffordance` has no `disabled` member
  // and this is that rule seen on the page.
  //
  // ASKED FOR EVERY ROLE AND EVERY REACH, NOT ONE. The first version rendered
  // only for the Read-only Auditor, and that role reaches no card at all — so
  // the only control it could have disabled does not render for it, and the
  // gate could not fail. Planted by giving the Worker's "Play again" a
  // `disabledReason`, which `Button` renders as `aria-disabled="true"`: red.
  it('renders no disabled control anywhere on the panel, for any role or reach', () => {
    let checked = 0
    for (const role of FL_B8_COLUMNS) {
      for (const reach of Object.keys(REACH_BUTTONS) as (keyof typeof REACH_BUTTONS)[]) {
        renderFor(role)
        setReach(reach)
        expect(document.querySelectorAll('button[disabled]'), `${role}/${reach}`).toHaveLength(0)
        expect(
          document.querySelectorAll('button[aria-disabled="true"]'),
          `${role}/${reach}`,
        ).toHaveLength(0)
        checked += 1
      }
    }
    expect(checked).toBe(20)
    cleanup()
  })

  // FAILS IF: a column the matrix gives no card to is shown a card anyway, or
  // is shown a card's leftovers. The four non-Worker columns get the view row's
  // own stated line instead, once, rather than three unreachable per-control
  // lines. Planted by dropping `interactive` from `showCard`: red, because the
  // Supervisor was then offered "Play again".
  it('states why there is no card for the four columns that get none', () => {
    for (const role of FL_B8_COLUMNS.filter((c) => c !== 'WORKER')) {
      renderFor(role)
      const stated = screen.getByTestId('fl-b8-no-card-for-role')
      expect(isShown(stated), role).toBe(true)
      expect(stated.textContent, role).toContain(
        FL_B8_MATRIX[0]?.cells[role].note ?? 'x',
      )
      expect(screen.queryByTestId('fl-b8-card-body'), role).toBeNull()
    }
    renderFor('WORKER')
    expect(screen.queryByTestId('fl-b8-no-card-for-role')).toBeNull()
    expect(screen.getByTestId('fl-b8-card-body')).toBeDefined()
    cleanup()
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTIONS ON SCREEN.
 * ==================================================================== */

describe('what the source says reaches the screen', () => {
  // FAILS IF: a card field is held in data and never drawn. A claim held in
  // data and not rendered is a code comment, and a code comment is not a
  // disclosure.
  it('renders every card field, every state and every storyboard frame', () => {
    renderFor('WORKER')
    expect(screen.getAllByTestId('fl-b8-card-field')).toHaveLength(B8_CARD.length)
    expect(screen.getAllByTestId('fl-b8-state')).toHaveLength(B8_STATES.length)
    expect(screen.getAllByTestId('fl-b8-frame')).toHaveLength(SB_FL_017.frames.length)
    expect(screen.getAllByTestId('fl-b8-functionality')).toHaveLength(
      B8_FUNCTIONALITIES.length,
    )
    expect(screen.getAllByTestId('fl-b8-acceptance')).toHaveLength(
      B8_ACCEPTANCE_CRITERIA.length,
    )
    cleanup()
  })

  // FAILS IF: the elided field is drawn without saying it was elided, or the
  // elision note is dropped. Planted by deleting the elision block: red.
  it('says on screen which field is not carried whole, and why', () => {
    renderFor('WORKER')
    const elisions = screen.getAllByTestId('fl-b8-elision')
    expect(elisions).toHaveLength(1)
    expect(isShown(elisions[0] ?? null)).toBe(true)
    expect(elisions[0]?.textContent).toContain('Artificial-intelligence behaviour')
    expect(elisions[0]?.textContent).toContain('L41502')
    cleanup()
  })

  // FAILS IF: the declined acceptance criterion renders as blank rather than as
  // a stated reason. A criterion that cannot be quoted must still be accounted
  // for on the page.
  it('renders the reason in place of the one criterion it cannot quote', () => {
    renderFor('WORKER')
    const items = screen.getAllByTestId('fl-b8-acceptance')
    const ac5 = items.find((i) => i.textContent?.startsWith('AC-B8-5'))
    expect(ac5).toBeDefined()
    expect(ac5?.textContent).toContain('Rendering the criterion would break the criterion')
    expect(ac5?.textContent).toContain('L41580')
    expect(EXCLUDED.test(ac5?.textContent ?? '')).toBe(false)
    cleanup()
  })

  // FAILS IF: the AC-FL-011-1 gap is not disclosed on screen, or is disclosed
  // as filled.
  it('discloses the one functionality that names no fallback pattern', () => {
    renderFor('WORKER')
    const gap = screen.getByTestId('fl-b8-ac-011-gap')
    expect(isShown(gap)).toBe(true)
    expect(gap.textContent).toContain('FUNC-B8-01-2-1')
    expect(gap.textContent).toContain('Nothing is assigned to close it')
    cleanup()
  })

  // FAILS IF: the row-5 finding is left in a comment rather than rendered.
  it('renders the row-5 finding on the page', () => {
    renderFor('WORKER')
    const f = screen.getByTestId('fl-b8-row-5-finding')
    expect(isShown(f)).toBe(true)
    expect(f.textContent).toContain('two different owning surfaces')
    cleanup()
  })
})

/* ==================================================================== *
 * THE DECISIONS ON SCREEN.
 * ==================================================================== */

describe('the open decisions reach the screen', () => {
  // FAILS IF: a reading is dropped, the consequence is dropped, or the canon
  // gap is not declared. A reader must not think the canon holds this record.
  // Planted by dropping the canon note: red.
  it('renders DEC-GATE-001 with every reading, the consequence and the canon gap', () => {
    renderFor('WORKER')
    const d = screen.getByTestId('fl-b8-disclosure')
    expect(isShown(d)).toBe(true)
    expect(d.textContent).toContain('DEC-GATE-001')
    const readings = B8_LOCAL_DISCLOSURES[0]?.readings ?? []
    expect(readings.length).toBeGreaterThanOrEqual(4)
    for (const r of readings) {
      expect(d.textContent, r.locator).toContain(r.locator)
    }
    expect(d.textContent).toContain('advisory-only surface')
    expect(d.textContent).toContain('client-delegated choice under APP-012')
    expect(screen.getByTestId('fl-b8-canon-note').textContent).toContain(
      'does not hold this identifier',
    )
    cleanup()
  })

  // FAILS IF: a decision the canon holds is disclosed with this module's own
  // prose rather than through the shared renderer. Two spellings of one
  // decision is the defect.
  it('renders the two canon decisions through the shared renderer', () => {
    renderFor('WORKER')
    const canon = screen.getAllByTestId('fl-b8-canon-decision')
    expect(canon).toHaveLength(2)
    expect(pageText()).toContain('Open decision DEC-LIB-001')
    expect(pageText()).toContain('Open decision DEC-LANEB-001')
    expect(pageText()).toContain('Does a library edit reach an in-flight Run?')
    cleanup()
  })

  // FAILS IF: a finding is held in data and never drawn.
  it('renders every finding', () => {
    renderFor('WORKER')
    expect(screen.getAllByTestId('fl-b8-finding').length).toBeGreaterThanOrEqual(5)
    expect(pageText()).toContain('§15.2 is the role-grant lifecycle')
    cleanup()
  })
})

/* ==================================================================== *
 * THE PANEL THE ROUTE MOUNTS.
 * ==================================================================== */

describe('the Run Player panel', () => {
  // FAILS IF: the panel claims another module's identity or another state's
  // name. `SCR-FL-13` is §22.7's own name for this state.
  it('claims MOD-FL-B8 and the coaching-card state, and nothing else', () => {
    expect(FL_B8_PANEL.module).toBe('MOD-FL-B8')
    expect(FL_B8_PANEL.rendersViews).toEqual(['Coaching card'])
    expect(FL_B8_PANEL.heading).toBe('Coaching Rendering')
    expect(srcLine(39875)).toContain('Coaching card')
    expect(srcLine(39875)).toContain('MOD-FL-B8')
  })

  // FAILS IF: the panel body does not render, or renders a modal when mounted
  // through the route's own value rather than through the view directly.
  it('renders its body with no modal and the step unaffected', () => {
    cleanup()
    render(<div>{FL_B8_PANEL.body}</div>)
    expect(modalElements()).toEqual([])
    expect(isShown(screen.getByTestId('fl-b8-step-unaffected'))).toBe(true)
    expect(screen.getAllByTestId('fl-b8-cell')).toHaveLength(35)
    cleanup()
  })
})
