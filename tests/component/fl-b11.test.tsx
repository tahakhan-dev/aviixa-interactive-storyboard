import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FL_B11_PANEL,
  WorkerLifecycleView,
} from '@/frontline/modules/fl-b11/WorkerLifecyclePanel'
import { B11_CARD, B11_FOUR_RUN_STATES, B11_STATES } from '@/frontline/modules/fl-b11/charter'
import {
  B11_ELSEWHERE_PERMISSIVE_CELLS,
  FL_B11_COLUMNS,
  FL_B11_MATRIX,
  type FlB11Column,
} from '@/frontline/modules/fl-b11/matrix'
import {
  B11_ACCEPTANCE_CRITERIA,
  B11_DISCLOSURES,
  B11_FUNCTIONALITIES,
  B11_SOURCE_FINDINGS,
  B11_VIEW_NAMES,
} from '@/frontline/modules/fl-b11/service'

/**
 * `MOD-FL-B11`'s panel, checked as a RENDERING rather than as a data
 * structure. The unit suite next door asks whether the transcription matches
 * the frozen source; this one asks whether what the source says reaches the
 * screen, because a claim held in data and never drawn is a code comment and a
 * code comment is not a disclosure.
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
 * in the document. THIS EXISTS BECAUSE A GATE COULD NOT FAIL WITHOUT IT, and
 * wave 1 recorded the case: a `textContent` sweep is untouched by a `hidden`
 * attribute, so a statement moved behind a click passed verbatim. jsdom
 * computes no layout, so the check walks the ancestor chain for the ways a
 * rendering hides a node without removing it.
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

function buttonNames(): readonly string[] {
  return screen.queryAllByRole('button').map((b) => b.textContent?.trim() ?? '')
}

/** Render for one persona column and hand back its buttons. */
function paintFor(role: FlB11Column): readonly string[] {
  cleanup()
  render(<WorkerLifecycleView viewerRole={role} />)
  return buttonNames()
}

/**
 * The page text at EVERY state this panel has, for EVERY persona column,
 * because a gate that reaches fewer states than the panel has is a gate that
 * passes the defect it was written for. The panel's states are the departure
 * taken (none, step-away, hand-back), the connectivity toggle, and the
 * substitution applied — so every button is pressed in every combination the
 * role can reach.
 */
function everyStateText(): readonly { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  for (const role of FL_B11_COLUMNS) {
    cleanup()
    render(<WorkerLifecycleView viewerRole={role} />)
    out.push({ where: `${role} first paint`, text: pageText() })
    const press = (label: string) => {
      const b = screen.queryAllByRole('button').find((x) => x.textContent?.trim() === label)
      if (b !== undefined) fireEvent.click(b)
    }
    for (const label of [
      'Step away from this run',
      'Hand back this run',
      'Show this with no connection',
      'Apply the substitution command',
    ]) {
      press(label)
      out.push({ where: `${role} after ${label}`, text: pageText() })
    }
    press('Show this with a connection')
    press('Show this before the command applies')
    out.push({ where: `${role} toggled back`, text: pageText() })
  }
  cleanup()
  return out
}

afterEach(cleanup)

/* ==================================================================== *
 * WHAT THE PANEL DRAWS, AND FOR WHOM.
 * ==================================================================== */

describe('the controls this panel draws', () => {
  // FAILS IF: any role other than the Worker is offered a control here. This
  // module owns none of the six genuine non-Worker on-device controls this
  // surface has, so every non-Worker column is a page of statements. Planted:
  // row 8's SUPERVISOR cell retyped `allowed`, which reads plausible — a
  // supervisor stepping in as a substitute. The Supervisor column grew two
  // buttons and this went red.
  it('offers buttons to the Worker and to nobody else', () => {
    expect(paintFor('WORKER').length).toBeGreaterThan(0)
    for (const role of ['SUPERVISOR', 'QUALITY_MANAGER', 'TENANT_ADMIN', 'READONLY_AUDITOR'] as const) {
      expect(paintFor(role), role).toEqual([])
    }
  })

  // FAILS IF: this panel offers a control that completes, finishes or cancels
  // anything. THIS IS THE DEFECT THIS MODULE IS MOST ABLE TO SHIP. The sweep
  // covers every button the panel has in every state the Worker can drive it
  // into, not just first paint. Planted: the handover's forward control
  // relabelled from "Continue" to "Complete this run", which is the single
  // most plausible wrong label on this screen. Went red.
  it('never offers a control that completes, finishes or cancels a Run', () => {
    cleanup()
    render(<WorkerLifecycleView viewerRole="WORKER" />)
    const seen = new Set<string>()
    // press everything, repeatedly, so a control that only appears after
    // another is pressed is still swept.
    for (let pass = 0; pass < 4; pass += 1) {
      for (const b of screen.queryAllByRole('button')) {
        seen.add(b.textContent?.trim() ?? '')
        fireEvent.click(b)
      }
    }
    expect(seen.size).toBeGreaterThan(3)
    for (const label of seen) {
      expect(label, `button "${label}"`).not.toMatch(
        /\b(complete|completed|completing|finish|finished|cancel|cancelled|submit|submitted)\b/i,
      )
    }
  })

  // FAILS IF: the matrix stops rendering every cell with its own words. Wave
  // 0's fold returns the ROW's cross-surface note for every cell of a
  // cross-surface row, so a table printing only the verdict loses all eight
  // permissive cells — the whole point of this matrix. Planted: the
  // `fl-b11-cell-own-words` span removed so each cell drew only
  // `affordanceWords(drawn)`. Went red at zero own-words spans and on the
  // eight-cell check below.
  it('draws all fifty cells with their own words above the fold’s verdict', () => {
    render(<WorkerLifecycleView viewerRole="WORKER" />)
    expect(screen.getAllByTestId('fl-b11-row')).toHaveLength(10)
    const cells = screen.getAllByTestId('fl-b11-cell')
    expect(cells).toHaveLength(50)
    const own = screen.getAllByTestId('fl-b11-cell-own-words')
    expect(own).toHaveLength(50)
    // each cell's own note is inside its own cell, not merely somewhere on the
    // page — a page-level `toContain` would pass if all fifty were printed in
    // one paragraph.
    for (const row of FL_B11_MATRIX) {
      for (const column of FL_B11_COLUMNS) {
        const td = cells.find(
          (c) =>
            c.getAttribute('data-row') === row.id && c.getAttribute('data-column') === column,
        )
        expect(td, `${row.id}.${column} has a cell`).toBeDefined()
        expect(td?.textContent, `${row.id}.${column}`).toContain(row.cells[column].note)
        expect(isShown(td ?? null), `${row.id}.${column} is shown`).toBe(true)
      }
    }
  })

  // FAILS IF: one of the eight permissive elsewhere-cells does not reach the
  // screen with its own wording. These are the cells that read `Allowed` for
  // an act this device does not have, and hiding one is how a reader concludes
  // the matrix is uniform. Planted: the elsewhere-cell list rendered as ids
  // only, dropping `{c.note}`. Went red naming the first cell.
  it('prints every one of the eight permissive elsewhere-cells in its own words', () => {
    render(<WorkerLifecycleView viewerRole="WORKER" />)
    const listed = screen.getAllByTestId('fl-b11-elsewhere-cell')
    expect(listed).toHaveLength(8)
    for (const c of B11_ELSEWHERE_PERMISSIVE_CELLS) {
      const hit = listed.find((el) => el.textContent?.includes(c.note))
      expect(hit, `${c.rowId}.${c.column}: "${c.note.slice(0, 40)}"`).toBeDefined()
      expect(isShown(hit ?? null)).toBe(true)
    }
    // and both invariant rows say so where a reader meets them.
    expect(screen.getAllByTestId('fl-b11-invariant-row')).toHaveLength(2)
  })

  // FAILS IF: row 2's two different reasons are not both drawn, EACH IN ITS
  // OWN CELL. One prohibition, two grounds, and a reader who sees one
  // concludes the other does not exist.
  //
  // THE PAGE-LEVEL VERSION OF THIS GATE COULD NOT FAIL. Planted: the matrix
  // table restricted to the viewer's own column, which is a plausible "tidier"
  // rendering and drops the Supervisor ground entirely for a Worker. A
  // `pageText().toContain(...)` check stayed green — because row 2's governing
  // sentence, rendered in `fl-b11-row-why`, ENDS with the same clause. The
  // gate was passing on the row's `why`, not on the Supervisor's cell, so it
  // asserted nothing about the rendering it claimed to protect. Asking each
  // cell by `data-row`/`data-column` turns the same plant red.
  it('draws both of row 2’s reasons, each in its own cell', () => {
    render(<WorkerLifecycleView viewerRole="WORKER" />)
    const cells = screen.getAllByTestId('fl-b11-cell')
    const cellFor = (column: string) =>
      cells.find(
        (c) =>
          c.getAttribute('data-row') === 'pause-run-for-everybody' &&
          c.getAttribute('data-column') === column,
      )
    const worker = cellFor('WORKER')
    const supervisor = cellFor('SUPERVISOR')
    expect(worker, 'the Worker cell is drawn').toBeDefined()
    expect(supervisor, 'the Supervisor cell is drawn').toBeDefined()
    expect(isShown(worker ?? null)).toBe(true)
    expect(isShown(supervisor ?? null)).toBe(true)
    expect(worker?.textContent).toContain('pause is not a Run state')
    expect(supervisor?.textContent).toContain(
      'pausing or stopping a run is deliberately impossible from the Client Command Center',
    )
    // and they are genuinely two different grounds, not one printed twice.
    expect(worker?.textContent).not.toContain('Client Command Center')
    // both are the source's own words at the row's own line.
    expect(srcLine(41950)).toContain('pause is not a Run state')
    expect(srcLine(41950)).toContain('deliberately impossible from the Client Command Center')
  })
})

/* ==================================================================== *
 * WHAT THE PANEL STATES BEFORE A READER DOES ANYTHING.
 * ==================================================================== */

describe('what a reader sees on first paint', () => {
  // FAILS IF: the four run states are not all stated, or one is put behind a
  // click. A reader cannot see an absence, so the panel says which state this
  // device reaches and which three it does not. Planted: the FourRunStates
  // section wrapped in `hidden={!expanded}`, which leaves `textContent`
  // untouched — the exact shape wave 1 recorded a gate failing to catch. The
  // `isShown` walk is what caught it.
  it('states all four run states, visibly, before any interaction', () => {
    render(<WorkerLifecycleView viewerRole="WORKER" />)
    const listed = screen.getAllByTestId('fl-b11-run-state')
    expect(listed).toHaveLength(4)
    for (const s of B11_FOUR_RUN_STATES) {
      const el = listed.find((x) => x.getAttribute('data-state') === s.state)
      expect(el, s.state).toBeDefined()
      expect(isShown(el ?? null), `${s.state} is shown`).toBe(true)
      expect(el?.textContent, s.state).toContain(s.reachedBy)
    }
    // exactly one of the four is reached on this device.
    const here = listed.filter((x) => x.textContent?.includes('the worker, on this device'))
    expect(here).toHaveLength(1)
  })

  // FAILS IF: the offline answer for a departure flag is not reachable, or it
  // claims the supervisor knows. Slice 7 does not simulate offline, so the
  // panel STATES it — a screen rendering only the connected path implies the
  // supervisor always knows. Planted: the offline branch removed so the
  // toggle did nothing. Went red because the offline wording never appeared.
  it('reaches the offline wording for both departures and never claims delivery', () => {
    render(<WorkerLifecycleView viewerRole="WORKER" />)
    for (const label of ['Step away from this run', 'Hand back this run']) {
      const take = screen.queryAllByRole('button').find((b) => b.textContent?.trim() === label)
      expect(take, label).toBeDefined()
      fireEvent.click(take as HTMLElement)
      const flag = screen.getByTestId('fl-b11-flag')
      expect(flag.getAttribute('data-delivered')).toBe('true')
      const offline = screen
        .queryAllByRole('button')
        .find((b) => b.textContent?.trim() === 'Show this with no connection')
      expect(offline, 'the offline toggle exists').toBeDefined()
      fireEvent.click(offline as HTMLElement)
      const off = screen.getByTestId('fl-b11-flag')
      expect(off.getAttribute('data-delivered')).toBe('false')
      expect(off.textContent).toContain('when this tablet reconnects')
      expect(off.textContent).not.toMatch(/\b(has been sent|has been told)\b/)
      fireEvent.click(
        screen
          .queryAllByRole('button')
          .find((b) => b.textContent?.trim() === 'Show this with a connection') as HTMLElement,
      )
    }
    expect(srcLine(41981)).toContain('no surface may imply otherwise')
  })

  // FAILS IF: the handover renders before the command is applied, or renders
  // fewer than three elements. AC-B11-4 requires all three before the
  // substitute's first capture. Planted: the panel's `commandState` fixed at
  // 'applied' so the pre-application state was unreachable. Went red on the
  // first assertion.
  it('withholds the handover until the command applies, then shows all three elements', () => {
    render(<WorkerLifecycleView viewerRole="WORKER" />)
    expect(screen.getByTestId('fl-b11-handover').getAttribute('data-applied')).toBe('false')
    expect(screen.queryAllByTestId('fl-b11-handover-element')).toHaveLength(0)
    fireEvent.click(
      screen
        .queryAllByRole('button')
        .find((b) => b.textContent?.trim() === 'Apply the substitution command') as HTMLElement,
    )
    expect(screen.getByTestId('fl-b11-handover').getAttribute('data-applied')).toBe('true')
    const elements = screen.getAllByTestId('fl-b11-handover-element')
    expect(elements.map((e) => e.textContent)).toEqual([
      'The last completed step',
      'The open flags',
      'The current state',
    ])
    expect(elements.every((e) => isShown(e))).toBe(true)
    // the panel also states what a substitute never receives.
    expect(screen.getByTestId('fl-b11-substitute-never').textContent).toContain(
      'not the previous worker’s session or credentials',
    )
  })

  // FAILS IF: the card, the states, the functionalities, the criteria, the
  // disclosures or the findings stop reaching the page. A record held in data
  // and never drawn is a code comment. Planted: the `Disclosures` section
  // dropped from the view's composition, which is the easiest thing to lose in
  // a re-order. Went red at zero disclosures.
  it('renders every record this module carries', () => {
    render(<WorkerLifecycleView viewerRole="WORKER" />)
    expect(screen.getAllByTestId('fl-b11-card-statement')).toHaveLength(B11_CARD.length)
    expect(screen.getAllByTestId('fl-b11-state')).toHaveLength(B11_STATES.length)
    expect(screen.getAllByTestId('fl-b11-functionality')).toHaveLength(B11_FUNCTIONALITIES.length)
    expect(screen.getAllByTestId('fl-b11-acceptance')).toHaveLength(
      B11_ACCEPTANCE_CRITERIA.length,
    )
    expect(screen.getAllByTestId('fl-b11-finding')).toHaveLength(B11_SOURCE_FINDINGS.length)
    const disclosures = screen.getAllByTestId('fl-b11-disclosure')
    expect(disclosures).toHaveLength(B11_DISCLOSURES.length)
    // EVERY reading of every disclosure, not just the identifier. A disclosure
    // that printed the question and dropped the alternatives would be an
    // assertion wearing a disclosure's markup.
    const readings = screen.getAllByTestId('fl-b11-reading')
    expect(readings).toHaveLength(B11_DISCLOSURES.reduce((n, d) => n + d.readings.length, 0))
    for (const d of B11_DISCLOSURES) {
      const box = disclosures.find((x) => x.getAttribute('data-decision') === d.decisionRef)
      expect(box, d.decisionRef).toBeDefined()
      for (const r of d.readings) {
        expect(box?.textContent, `${d.decisionRef}: ${r.text.slice(0, 40)}`).toContain(r.text)
        expect(box?.textContent, `${d.decisionRef} locator`).toContain(r.locator)
      }
      expect(box?.textContent).toContain('A client-delegated choice under APP-012')
    }
    // and the two AC-FL-011-1 gaps are stated rather than quietly absent.
    expect(screen.getByTestId('fl-b11-pattern-gap').textContent).toContain('FUNC-B11-01-1-2')
    expect(screen.getByTestId('fl-b11-pattern-gap').textContent).toContain('FUNC-B11-02-1-3')
  })
})

/* ==================================================================== *
 * CATEGORICAL ABSENCES, ON THE RENDERED PAGE.
 * ==================================================================== */

describe('what never reaches the page', () => {
  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking reaches
  // the rendered page, in any state, for any role.
  //
  // ONE CLAUSE IS ALLOWED AND IT IS DEFINED BY THE SOURCE, NOT BY THE MODULE.
  // DEC-PARK-001's third candidate behaviour is the source's own proposal and
  // contains the word; quoting a proposed escalation inside a disclosure is
  // not a display.
  //
  // THE FIRST VERSION OF THIS GATE COULD NOT FAIL, and the reason is the exact
  // tautology shape this build keeps finding. It took the allowed string OUT
  // OF `B11_DISCLOSURES` — the value under test — and subtracted that from the
  // page. Planted: the reading shortened to "the run no-show timers take
  // over.", which is no longer the source's words. The gate subtracted the
  // shortened string, found nothing left, and stayed green. The allowance is
  // now the SOURCE's clause, asserted to be at L41682 and asserted to be
  // quoted whole by the module, so shortening the reading turns it red twice
  // over: the quote check fails, and the module's own "timers" survives the
  // subtraction.
  //
  // Planted twice more: "countdown" added to the pause sentence, and "timers"
  // added to a card field. Both went red naming the state.
  it('carries no pace, timing, countdown or ranking word in any state', () => {
    const FORBIDDEN = /\b(pace|timers?|countdowns?|rankings?|leaderboards?|productivity)\b/i
    // the source's own clause, at the line this module cites for it.
    const SOURCE_CLAUSE =
      'the run no-show timers at plus 15 and plus 30 minutes take over'
    expect(srcLine(41682), 'the allowance is the source’s').toContain(SOURCE_CLAUSE)
    expect(srcLine(41682)).toContain('DEC-PARK-001')
    // and the module quotes it whole rather than paraphrasing it.
    const reading = B11_DISCLOSURES.find((d) => d.decisionRef === 'DEC-PARK-001')?.readings.find(
      (r) => FORBIDDEN.test(r.text),
    )?.text
    expect(reading, 'the module carries the reading').toBeDefined()
    expect(reading, 'quoted verbatim, not paraphrased').toContain(SOURCE_CLAUSE)

    const states = everyStateText()
    expect(states.length).toBeGreaterThan(25)
    for (const s of states) {
      const parts = s.text.split(SOURCE_CLAUSE)
      expect(parts.length - 1, `${s.where}: the source clause appears exactly once`).toBe(1)
      expect(parts.join(' '), s.where).not.toMatch(FORBIDDEN)
    }
  })

  // FAILS IF: the word "synced" reaches the page in any state. L39622 says
  // there is no such state and no bare success. Planted: the offline flag
  // wording changed to "The flag is synced when this tablet reconnects." Went
  // red naming the state it appeared in.
  it('never writes synced anywhere on the page', () => {
    for (const s of everyStateText()) {
      expect(s.text, s.where).not.toMatch(/\bsynced\b/i)
    }
  })

  // FAILS IF: a build-plan rigour grade reaches the page. Planted: `C2` added
  // to the panel's opening paragraph. Went red.
  it('renders no build-plan grade in any state', () => {
    for (const s of everyStateText()) {
      expect(s.text, s.where).not.toMatch(/\b(C1|C2)\b/)
    }
  })
})

/* ==================================================================== *
 * THE PANEL THE ROUTE MOUNTS.
 * ==================================================================== */

describe('the Run Player panel this module exports', () => {
  // FAILS IF: the panel claims another module's id, or names a §22.7 row that
  // is not its own. One panel may not claim another module's identity, and the
  // route is a shared file six modules mount into. Planted: `module` changed
  // to 'MOD-FL-B9'. Went red.
  it('claims its own module and the two views the register gives it', () => {
    expect(FL_B11_PANEL.module).toBe('MOD-FL-B11')
    expect(FL_B11_PANEL.heading).toBe('Worker Lifecycle on Device')
    expect(FL_B11_PANEL.rendersViews).toEqual([...B11_VIEW_NAMES])
    expect(FL_B11_PANEL.rendersViews).toEqual([
      'Step-away and hand-back sheet',
      'Substitution handover state',
    ])
    // the register's own Module column says both are this module's.
    expect(srcLine(39884)).toContain('`MOD-FL-B11`')
    expect(srcLine(39885)).toContain('`MOD-FL-B11`')
    // and the panel body renders.
    render(<div>{FL_B11_PANEL.body}</div>)
    expect(screen.getAllByTestId('fl-b11-row')).toHaveLength(10)
  })
})
