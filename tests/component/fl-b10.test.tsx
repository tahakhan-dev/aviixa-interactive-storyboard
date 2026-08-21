import { describe, it, expect } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { frontlineAffordance } from '@/frontline/matrix'
import { NotificationsInboxView } from '@/frontline/modules/fl-b10/NotificationsInboxView'
import {
  B10_CARD,
  B10_CLAIMS_NEVER_MADE,
  B10_NOTIFICATION_STATES,
} from '@/frontline/modules/fl-b10/charter'
import {
  FL_B10_COLUMNS,
  FL_B10_MATRIX,
  b10Row,
  type FlB10Column,
} from '@/frontline/modules/fl-b10/matrix'
import {
  B10_ACCEPTANCE_CRITERIA,
  B10_FUNCTIONALITIES,
  B10_INBOX,
  SB_FL_019,
  deviceRungsFor,
} from '@/frontline/modules/fl-b10/service'

/**
 * `MOD-FL-B10`'s view, checked as a RENDERING rather than as a data structure.
 * The unit suite next door asks whether the transcription matches the frozen
 * source; this one asks whether what the source says reaches the screen,
 * because a claim held in data and never drawn is a code comment and a code
 * comment is not a disclosure.
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
 * THE WHOLE PAGE'S TEXT, NOT ONE ELEMENT'S, AND THAT IS THE SWEEP'S REACH.
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
 * `textContent` check answers "is this string in the DOM", and a
 * `hidden` attribute on the same element leaves `textContent` untouched — so a
 * statement moved behind a click would pass verbatim. jsdom computes no
 * layout, so the check walks the ancestor chain for the ways a rendering hides
 * a node without removing it.
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
  return true
}

/** Every button the view offers, by its accessible name. */
function buttonNames(): readonly string[] {
  return screen.queryAllByRole('button').map((b) => b.textContent?.trim() ?? '')
}

/**
 * The page text at every state this view has, for every persona column,
 * because a sweep that reaches fewer states than the view has is a sweep that
 * passes the defect it was written for. Clicking is repeated until the button
 * set stops changing, so the inbox ladder is walked to its end rather than
 * advanced one rung.
 */
function textInEveryState(
  prune?: (body: HTMLElement) => void,
): readonly [string, string][] {
  const out: [string, string][] = []
  const read = (): string => {
    if (prune === undefined) return pageText()
    const clone = document.body.cloneNode(true) as HTMLElement
    prune(clone)
    return clone.textContent ?? ''
  }
  for (const role of FL_B10_COLUMNS) {
    cleanup()
    render(<NotificationsInboxView viewerRole={role} />)
    out.push([`${role} first paint`, read()])
    for (let pass = 0; pass < 5; pass += 1) {
      const buttons = screen.queryAllByRole('button')
      if (buttons.length === 0) break
      for (const b of buttons) {
        const name = b.textContent?.trim()
        fireEvent.click(b)
        out.push([`${role} pass ${pass} after "${name}"`, read()])
      }
    }
  }
  cleanup()
  return out
}

/* ==================================================================== *
 * THE INBOX.
 * ==================================================================== */

describe('the inbox', () => {
  // FAILS IF: the Worker's inbox stops being drawn, or is drawn for a column
  // the matrix refuses. Both directions are asserted, because a view that
  // drew the list unconditionally would pass a Worker-only check.
  // Planted: the `view.kind === 'control'` branch replaced with `true`. The
  // Worker case stayed green and all four other columns went red.
  it('draws the item list for the Worker and a stated line for the other four', () => {
    for (const role of FL_B10_COLUMNS) {
      cleanup()
      render(<NotificationsInboxView viewerRole={role} />)
      const drawn = frontlineAffordance(b10Row('view-own-inbox'), role)
      const items = screen.queryAllByTestId('fl-b10-inbox-item')
      if (drawn.kind === 'control') {
        expect(items.length, role).toBe(B10_INBOX.length)
        expect(screen.queryByTestId('fl-b10-no-inbox'), role).toBeNull()
      } else {
        expect(items.length, role).toBe(0)
        const stated = screen.getByTestId('fl-b10-no-inbox')
        expect(isShown(stated), role).toBe(true)
        expect(stated.textContent, role).toContain(b10Row('view-own-inbox').control)
      }
    }
    cleanup()
  })

  // FAILS IF: an item can be advanced past the rungs its own trigger row
  // exercises. The ordinary inbox item's row (L41837) stops at `read` and does
  // NOT carry `acknowledged`, so the last click has to leave no button behind.
  // Planted: the Open button rendered whenever `next !== undefined`, which is
  // always true for a defaulted lookup — the item then walked to
  // `acknowledged` and this went red on the final rung.
  it('walks each item only to the end of its own trigger’s ladder', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    for (const item of B10_INBOX) {
      const ladder = deviceRungsFor(item.trigger)
      expect(ladder.length).toBeGreaterThan(1)
    }
    for (let pass = 0; pass < 6; pass += 1) {
      const opens = screen.queryAllByRole('button').filter((b) => b.textContent?.trim() === 'Open')
      if (opens.length === 0) break
      for (const b of opens) fireEvent.click(b)
    }
    const rungs = screen.queryAllByTestId('fl-b10-inbox-item').map((el) => el.dataset['rung'])
    expect(rungs).toEqual(B10_INBOX.map((i) => deviceRungsFor(i.trigger).at(-1)))
    expect(rungs).not.toContain('acknowledged')
    expect(screen.queryAllByTestId('fl-b10-ladder-end').length).toBe(B10_INBOX.length)
    cleanup()
  })

  // FAILS IF: a rung is rendered without the sentence that says what it does
  // not establish. Each rung's line names the next distinction — delivery is
  // not opening, opening is not acknowledgement — and a bare state word is the
  // collapse L41848 forbids. Planted: the `fl-b10-rung-line` paragraph replaced
  // with `{at}`, which renders "delivered" and looks like a state label.
  it('prints the honest rung sentence beside every item, not a bare state word', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const lines = screen.queryAllByTestId('fl-b10-rung-line')
    expect(lines.length).toBe(B10_INBOX.length)
    for (const l of lines) {
      expect(isShown(l)).toBe(true)
      expect((l.textContent ?? '').length).toBeGreaterThan(60)
      expect(l.textContent).toMatch(/is not/)
    }
    cleanup()
  })

  // FAILS IF: the offline position or the back-fill stamp is moved behind a
  // click. Both are claims about what the screen is, so they belong on first
  // paint; `isShown` is what makes the check about a reader rather than about
  // the DOM. Planted: `hidden` added to the offline statement paragraph —
  // `textContent` stayed identical and this went red.
  it('states the offline position and the event-time stamp on first paint', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const offline = screen.getByTestId('fl-b10-offline-statement')
    const stamp = screen.getByTestId('fl-b10-backfill-stamp')
    expect(isShown(offline)).toBe(true)
    expect(isShown(stamp)).toBe(true)
    expect(offline.textContent).toContain('no surface may imply one has')
    expect(stamp.textContent).toContain('original event time')
    expect(stamp.textContent).not.toContain('arrival time — ')
    cleanup()
  })
})

/* ==================================================================== *
 * THE MATRIX, DRAWN.
 * ==================================================================== */

describe('the permission matrix on screen', () => {
  // FAILS IF: a row or a cell stops being drawn. Seven rows, thirty-five
  // cells, and the cell count is the product rather than a second constant.
  // Planted: the row map sliced to the first six.
  it('draws all seven rows and all thirty-five cells', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    expect(screen.queryAllByTestId('fl-b10-row')).toHaveLength(FL_B10_MATRIX.length)
    expect(screen.queryAllByTestId('fl-b10-cell')).toHaveLength(
      FL_B10_MATRIX.length * FL_B10_COLUMNS.length,
    )
    cleanup()
  })

  // FAILS IF: a cell prints only the fold's verdict and drops its own words.
  //
  // THIS GATE COULD NOT FAIL WHEN IT WAS FIRST WRITTEN, and the reason is the
  // trap this build has recorded most: `toContain`. Wave 0's `statedLine`
  // BUILDS its sentence out of the cell's note — "<control> — no control is
  // drawn here. <cell.note> It exists nowhere for anyone…" — so the verdict
  // string CONTAINS the own-words string on exactly the rows where the two
  // were supposed to differ. Deleting the own-words span left every
  // `toContain(own)` passing. The plant was run, the gate stayed green, and
  // the gate was rewritten rather than the plant.
  //
  // What it asserts now is the own-words ELEMENT and its EXACT text, so a
  // deletion has nowhere to hide, plus the verdict separately, plus that the
  // two really are different strings somewhere — without that last one a
  // rendering that printed the note twice would satisfy both halves.
  //
  // Planted, second time: the `fl-b10-cell-own-words` span deleted. Went red
  // on the first cell it reached.
  it('prints every cell’s own words beside the fold’s verdict', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    let differed = 0
    for (const row of FL_B10_MATRIX) {
      for (const column of FL_B10_COLUMNS) {
        const cell = document.querySelector(
          `[data-testid="fl-b10-cell"][data-row="${row.id}"][data-column="${column}"]`,
        )
        expect(cell, `${row.id}.${column}`).not.toBeNull()
        const own = row.cells[column].note
        const drawn = frontlineAffordance(row, column)
        const verdict = drawn.kind === 'stated-line' ? drawn.line : drawn.note
        const ownEl = cell?.querySelector('[data-testid="fl-b10-cell-own-words"]')
        expect(ownEl, `${row.id}.${column} own-words element`).not.toBeNull()
        expect(ownEl?.textContent, `${row.id}.${column} own words, exactly`).toBe(own)
        expect(cell?.textContent, `${row.id}.${column} verdict`).toContain(verdict)
        if (own !== verdict) differed += 1
      }
    }
    expect(differed, 'at least one cell where the two really differ').toBeGreaterThan(0)
    cleanup()
  })

  // FAILS IF: the push row is drawn as anything other than a stated line in
  // the permanent sense, in every column. The tail is what tells a reader
  // which of the token's two senses this is. Planted: the row's `existence`
  // switched to the other real sense — every cell's tail changed and this went
  // red five times.
  it('draws the push row as a stated line with no route back, in all five columns', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const cells = document.querySelectorAll('[data-row="receive-os-push-alert"]')
    expect(cells).toHaveLength(5)
    for (const c of cells) {
      expect((c as HTMLElement).dataset['kind']).toBe('stated-line')
      expect(c.textContent).toContain('there is nothing to come back to')
      expect(c.textContent).not.toContain('It returns when that condition lifts')
    }
    // and both senses are named on the page, so the reader is not asked to
    // infer which one applies here
    expect(screen.queryAllByTestId('fl-b10-unavailable-sense')).toHaveLength(3)
    cleanup()
  })

  // FAILS IF: any control at all is drawn on a refused cell. This is the
  // structural claim of the whole surface — `FrontlineAffordance` has no
  // `disabled` member — and the check is that the cell region holds no
  // interactive element, not merely that it says the right words.
  // Planted: a `<button>` added to the refusal branch of the cell renderer
  // reading "Request access". Went red naming the cell.
  it('puts no interactive element in any refused or stated-line cell', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    for (const cell of document.querySelectorAll('[data-testid="fl-b10-cell"]')) {
      const kind = (cell as HTMLElement).dataset['kind']
      if (kind === 'control') continue
      expect(
        cell.querySelectorAll('button, a, input, select, textarea').length,
        `${(cell as HTMLElement).dataset['row']}.${(cell as HTMLElement).dataset['column']}`,
      ).toBe(0)
    }
    cleanup()
  })
})

/* ==================================================================== *
 * THE CHANGE NOTICE.
 * ==================================================================== */

describe('SB-FL-019, the change notice', () => {
  // FAILS IF: the notice grows a dismiss control, or its single control is
  // renamed. The storyboard gives it exactly one control reading "Start" and
  // states in its own words that there is no dismiss. Planted: a second button
  // added reading "Not now", which is what a dismiss control gets called when
  // nobody wants to call it dismiss. Went red on the control count.
  it('offers exactly one control on the notice, reading Start, and no dismiss', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const notice = screen.getByTestId('fl-b10-change-notice')
    const controls = notice.querySelectorAll('button, a, input, select, textarea')
    expect([...controls].map((c) => c.textContent?.trim())).toEqual([SB_FL_019.control])
    const absence = screen.getByTestId('fl-b10-no-dismiss')
    expect(isShown(absence)).toBe(true)
    expect(absence.textContent).toContain(SB_FL_019.absent)
    cleanup()
  })

  // FAILS IF: the screen states the three-signature chain as a fact. A
  // CMD-FL-VERSION arriving by Lane B auto-publication is indistinguishable at
  // this end from one that passed the chain, so nothing here may name the
  // chain as something that ran — not in the notice, not in a caption.
  //
  // THE EXCLUSION IS NOT A HOLE, AND IT WAS NOT WRITTEN TO MAKE THE GATE PASS.
  // The chain language legitimately appears once on this page: inside the
  // shared canon's DEC-LANEB-001 record, which QUOTES AC-STU-097 as one of two
  // readings neither of which is the answer. Disclosing a reading is the
  // opposite of asserting it. So the sweep reads the page with the disclosure
  // notes removed, and the second half asserts the phrase really is inside one
  // — without that, deleting the disclosure would make this gate greener.
  //
  // Planted: "Approved by Author, Reviewer and Release Authority." added to
  // the notice. Went red naming every state it appeared in.
  it('never states the three-signature chain as a fact outside a disclosed reading', () => {
    // ASSERTIVE PHRASINGS ONLY. The words "three-signature chain" appear on
    // this page in a DENIAL — "indistinguishable from a change that passed the
    // three-signature chain" — so a sweep for the phrase would fire on the
    // very sentence that holds the position. These three are the shapes that
    // can only be a claim: an approval attributed to a party, and
    // AC-STU-097's own wording.
    const CLAIMED = /\bapproved by\b|\bthree recorded transitions\b/i
    for (const [where, text] of textInEveryState((body) => {
      for (const note of body.querySelectorAll('[role="note"]')) note.remove()
    })) {
      expect(CLAIMED.test(text), `${where}`).toBe(false)
    }
    // the exclusion is real: AC-STU-097's wording IS on the page, inside the
    // canon's record, as a reading rather than a claim. Without this half,
    // deleting the disclosure would make the gate greener.
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const note = screen.getByRole('note', { name: 'Open decision DEC-LANEB-001' })
    expect(/three recorded transitions/i.test(note.textContent ?? '')).toBe(true)
    // and the denial is drawn, in the change notice itself
    const denial = screen.getByTestId('fl-b10-laneb-device-end')
    expect(isShown(denial)).toBe(true)
    expect(denial.textContent).toContain('never that the chain ran')
    cleanup()
    // the reason the claim would be false, read off the command table
    expect(srcLine(39666)).toContain('including Lane B auto-published patches')
  })

  // FAILS IF: the in-situ flag is dropped or reworded. It is the second half
  // of the storyboard — the notice at the start plus the reminder at the point
  // of change — and it is the half a screen forgets. Planted: the flag text
  // changed to "Updated", which is not the source's wording.
  it('shows the in-situ flag in the storyboard’s own words after Start', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    expect(screen.queryByTestId('fl-b10-in-situ-flag')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: SB_FL_019.control }))
    const flag = screen.getByTestId('fl-b10-in-situ-flag')
    expect(isShown(flag)).toBe(true)
    expect(flag.textContent).toContain('Changed in this version.')
    expect(srcLine(41894)).toContain('Changed in this version.')
    cleanup()
  })
})

/* ==================================================================== *
 * THE SWEEPS — WHAT MUST NOT BE ON THIS SCREEN, IN ANY STATE.
 * ==================================================================== */

describe('what this screen never offers', () => {
  // FAILS IF: a mute affordance appears anywhere, for any persona, in any
  // state. Row 3 is prohibited in all five columns, so no branch can produce
  // one — and this is the module's single most consequential absence, which is
  // why it is swept over control NAMES and over page text both. Planted: a
  // "Mute" button added to the inbox item, which is the natural place for it.
  // Went red on the control-name half in every persona state.
  it('offers no mute control and describes none as available, in any state', () => {
    const MUTE = /\bmute|muted|muting|silence|snooze\b/i
    for (const role of FL_B10_COLUMNS) {
      cleanup()
      render(<NotificationsInboxView viewerRole={role} />)
      for (let pass = 0; pass < 5; pass += 1) {
        const buttons = screen.queryAllByRole('button')
        if (buttons.length === 0) break
        for (const name of buttonNames()) {
          expect(MUTE.test(name), `${role}: control "${name}"`).toBe(false)
        }
        for (const b of buttons) fireEvent.click(b)
      }
      const controls = document.querySelectorAll('button, a, input, select, textarea')
      for (const c of controls) {
        expect(MUTE.test(c.textContent ?? ''), `${role}: ${c.textContent}`).toBe(false)
      }
    }
    cleanup()
    // and the source rule the absence answers to
    expect(srcLine(41794)).toContain('in-app notifications cannot be muted, platform-wide')
  })

  // FAILS IF: a channel outside V1 is offered as a control. Short Message
  // Service, operating-system push, webhooks, external recipients and quiet
  // hours are all outside V1; the screen NAMES them, which is correct, and
  // must never OFFER them. Planted: a "Quiet hours" button added beside the
  // matrix. Went red.
  it('offers no control for a channel the source places outside V1', () => {
    const EXCLUDED = /\b(short message service|sms|push|webhook|external recipient|quiet hours)\b/i
    for (const role of FL_B10_COLUMNS) {
      cleanup()
      render(<NotificationsInboxView viewerRole={role} />)
      for (const c of document.querySelectorAll('button, a, input, select, textarea')) {
        expect(EXCLUDED.test(c.textContent ?? ''), `${role}: ${c.textContent}`).toBe(false)
      }
    }
    cleanup()
    expect(srcLine(41798)).toContain('are all outside V1')
  })

  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking reaches
  // the page in any state, for any persona. AC-FL-000-5 (L39100),
  // TEST-FL-000-3 (L39108), AC-SCR-FL-002 (L48690), AC-SCOPE-045 (L2683).
  // The sweep reads the joined body text, so a word split across two spans is
  // still caught. Planted: "countdown" in the change-notice prose. Went red
  // naming every state it appeared in.
  it('carries no pace, timing, countdown or ranking word on the page, in any state', () => {
    const FORBIDDEN = /\b(pace|timers?|countdowns?|rankings?|leaderboards?|productivity)\b/i
    const states = textInEveryState()
    expect(states.length).toBeGreaterThan(FL_B10_COLUMNS.length)
    const offenders = states.filter(([, text]) => FORBIDDEN.test(text)).map(([where]) => where)
    expect(offenders).toEqual([])
    expect(srcLine(39108)).toContain('TEST-FL-000-3')
  })

  // FAILS IF: the word "synced" reaches the page as a state. L39622 says there
  // is no such state and no bare success. Planted: an inbox item's rung line
  // changed to "Synced". Went red.
  it('never writes synced on the page, in any state', () => {
    for (const [where, text] of textInEveryState()) {
      expect(/\bsynced\b/i.test(text), where).toBe(false)
    }
  })

  // FAILS IF: either DEC-MSG-001 wording reaches this screen. The decision is
  // disclosed in full by MOD-FL-A1 and MOD-FL-A7; a third spelling here is how
  // two screens start disclosing one decision differently. Planted: Reading A
  // pasted into the decision-home note as an illustration. Went red.
  it('prints neither DEC-MSG-001 wording, in any state', () => {
    const readingA = 'Operation suspended. Contact your supervisor.'
    const readingB = 'Operation suspended — your work has been saved.'
    for (const [where, text] of textInEveryState()) {
      expect(text.includes(readingA), where).toBe(false)
      expect(text.includes(readingB), where).toBe(false)
    }
    expect(srcLine(5265)).toContain(readingA)
    expect(srcLine(5266)).toContain(readingB)
  })
})

/* ==================================================================== *
 * WHAT THE SCREEN HAS TO SAY.
 * ==================================================================== */

describe('what reaches the screen', () => {
  // FAILS IF: a card field, a functionality, a criterion or a never-claimed
  // line is held in data and not drawn. That is the defect the whole file
  // exists for: a claim in a constant is a code comment. Planted: the card
  // section's map sliced to the first ten fields.
  it('draws every card field, functionality, criterion and never-claimed line', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    expect(screen.queryAllByTestId('fl-b10-card-field')).toHaveLength(B10_CARD.length)
    expect(screen.queryAllByTestId('fl-b10-functionality')).toHaveLength(
      B10_FUNCTIONALITIES.length,
    )
    expect(screen.queryAllByTestId('fl-b10-acceptance')).toHaveLength(
      B10_ACCEPTANCE_CRITERIA.length,
    )
    expect(screen.queryAllByTestId('fl-b10-never-claimed')).toHaveLength(
      B10_CLAIMS_NEVER_MADE.length,
    )
    expect(screen.queryAllByTestId('fl-b10-trigger')).toHaveLength(4)
    expect(screen.queryAllByTestId('fl-b10-finding')).toHaveLength(4)
    cleanup()
  })

  // FAILS IF: the state list is drawn without saying which four this device
  // has. Nineteen chips, four marked, and the marking is read off the DOM
  // attribute rather than the module's array. Planted: the `data-device`
  // attribute set from `!s.deviceObservable`. Went red at 15 against 4.
  it('draws all nineteen states and marks exactly the four the device writes', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const chips = screen.queryAllByTestId('fl-b10-state')
    expect(chips).toHaveLength(B10_NOTIFICATION_STATES.length)
    expect(chips).toHaveLength(19)
    const marked = chips.filter((c) => c.dataset['device'] === 'true')
    expect(marked.map((c) => c.textContent?.split(' ')[0])).toEqual([
      'delivered',
      'opened',
      'read',
      'acknowledged',
    ])
    const gap = screen.getByTestId('fl-b10-earlier-clause-gap')
    expect(isShown(gap)).toBe(true)
    expect(gap.textContent).toContain('reconciled')
    cleanup()
  })

  // FAILS IF: the shared decision canon's DEC-LANEB-001 record stops being
  // rendered, or is rendered without the APP-012 label that makes it a
  // client-delegated choice rather than the source's ruling. The readings come
  // from the canon, so this also proves this screen wrote no second spelling.
  // Planted: `<DecisionDisclosure id="DEC-LANEB-001" />` removed and replaced
  // with a paragraph naming the decision. Went red on the role="note".
  it('renders DEC-LANEB-001 from the shared canon, with the APP-012 label', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const note = screen.getByRole('note', { name: 'Open decision DEC-LANEB-001' })
    expect(isShown(note)).toBe(true)
    expect(note.textContent).toContain('All readings stand. None is this build’s to settle.')
    expect(note.textContent).toContain('A client-delegated choice under APP-012')
    expect(note.querySelectorAll('li').length).toBeGreaterThanOrEqual(2)
    const why = screen.getByTestId('fl-b10-laneb-why-here')
    expect(why.textContent).toContain('CMD-FL-VERSION')
    cleanup()
  })

  // FAILS IF: the open item with no decision identifier is dropped, or is
  // given one. A client searching the canon for it would find nothing, and
  // saying so is the disclosure. Planted: the note's heading changed to name
  // DEC-LIB-001, a real canon record about a neighbouring subject.
  it('discloses the explanatory-video open item as having no identifier', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const note = screen.getByTestId('fl-b10-open-no-identifier')
    expect(isShown(note)).toBe(true)
    expect(note.textContent).toContain('gives it no DEC identifier')
    expect(note.textContent).not.toMatch(/DEC-[A-Z]+-\d+/)
    cleanup()
  })

  // FAILS IF: the AC-FL-011-1 gap report or the three fallback readings are
  // held in data and not drawn. Both are the module reporting rather than
  // fixing, and a report nobody can read is not a report. Planted: the
  // three-readings paragraph deleted.
  it('draws the four fallback gaps and the three divergent readings', () => {
    cleanup()
    render(<NotificationsInboxView viewerRole="WORKER" />)
    const gaps = screen.getByTestId('fl-b10-pattern-gaps')
    expect(isShown(gaps)).toBe(true)
    expect(gaps.textContent).toContain('4 of the 13')
    expect(gaps.textContent).toContain('reported rather than filled')
    const readings = screen.getByTestId('fl-b10-three-readings')
    expect(isShown(readings)).toBe(true)
    expect(readings.textContent).toContain('FB-FL-UP-01')
    expect(readings.textContent).toContain('FB-FL-PKG-01')
    cleanup()
  })
})

/* ==================================================================== *
 * THE EXPORT.
 * ==================================================================== */

describe('the export', () => {
  // FAILS IF: this module starts exporting a Run Player panel. Its destination
  // is SCR-FL-04 and §25.5 gives it the whole destination, so it exports a
  // plain view component and the controller wires it into its own route.
  // Planted: a `FL_B10_PANEL` export added alongside. There is no import of it
  // to go red, so the gate instead asserts the shape of what IS exported:
  // a component that renders standalone with no panel wrapper and defaults to
  // the Worker column. Planted for real: the default parameter removed, which
  // made `render(<NotificationsInboxView />)` throw on the heading lookup.
  it('is a plain view component that defaults to the Worker column', () => {
    cleanup()
    render(<NotificationsInboxView />)
    expect(pageText()).toContain('Rendered for the Worker column')
    expect(screen.queryAllByTestId('fl-b10-inbox-item')).toHaveLength(B10_INBOX.length)
    cleanup()
    render(<NotificationsInboxView viewerRole={'READONLY_AUDITOR' satisfies FlB10Column} />)
    expect(pageText()).toContain('Rendered for the Read-only Auditor column')
    cleanup()
  })
})
