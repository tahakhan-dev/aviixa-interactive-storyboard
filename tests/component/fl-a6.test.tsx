import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { HELD_ON_DEVICE_STATES } from '@/frontline/capture'
import { SyncDetailSheetView } from '@/frontline/modules/fl-a6/SyncDetailSheet'
import { A6_CARD, A6_CLAIMS_NEVER_MADE, A6_STATES } from '@/frontline/modules/fl-a6/charter'
import {
  A6_BOUNDED_SETTINGS,
  A6_CLASSIFICATION_ROWS,
  A6_DRIVERS,
  A6_SITUATIONS,
  A6_STATE_AXES,
  A6_UNDRIVEN,
  a6StateReading,
} from '@/frontline/modules/fl-a6/offline'
import { FL_A6_MATRIX } from '@/frontline/modules/fl-a6/matrix'
import {
  A6_ACCEPTANCE_CRITERIA,
  A6_DISCLOSURES,
  A6_FUNCTIONALITIES,
  SB_FL_015_SHEET,
} from '@/frontline/modules/fl-a6/service'

/**
 * `MOD-FL-A6`'s sync detail sheet, checked as a RENDERING rather than as a
 * data structure. The unit suite next door asks whether the transcription
 * matches the frozen source; this one asks whether what the source says
 * reaches the screen, because a claim held in data and never drawn is a code
 * comment and a code comment is not a disclosure.
 *
 * Every gate below was planted, watched go red, and restored. The `FAILS IF`
 * note names the defect that was actually planted.
 */

const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')
const L41235 = SOURCE[41234] ?? ''
const L41098 = SOURCE[41097] ?? ''

function pageText(): string {
  return document.body.textContent ?? ''
}

describe('the sheet itself', () => {
  // FAILS IF: the sheet stops rendering the storyboard's five lines, or a line
  // stops carrying the capture ladder's own sentence. Element by element, not
  // off the page text, because a page-text sweep passes a line whose sentence
  // was concatenated in from its neighbour. Planted: syncSheetLine changed to
  // print only the storyboard's short label. Went red on the first line.
  it('draws SB-FL-015’s five lines, each with its ladder sentence', () => {
    render(<SyncDetailSheetView />)
    const lines = screen.getAllByTestId('fl-a6-sheet-line')
    expect(lines).toHaveLength(5)
    SB_FL_015_SHEET.forEach((row, i) => {
      const text = lines[i]?.textContent ?? ''
      expect(text, row.state).toContain(`${row.storyboardLabel}: ${row.count}.`)
      const held = (HELD_ON_DEVICE_STATES as readonly string[]).includes(row.state)
      expect(text.includes('The platform does not hold this record yet.'), row.state).toBe(held)
      // and the storyboard really writes this line.
      expect(L41235).toContain(`${row.storyboardLabel}: ${row.count}.`)
    })
  })

  // FAILS IF: any line the sheet prints for a capture carries the word the
  // ladder does not have. Per element, so a "Synced" injected into one line is
  // caught by that line rather than lost in a page-wide sweep that the
  // storyboard's own "Last synced 08:29." would have to exempt anyway.
  // Planted: the committed-locally line replaced with "Synced: 2." Went red
  // naming that line.
  it('carries no synced label on any of its capture lines', () => {
    render(<SyncDetailSheetView />)
    for (const line of screen.getAllByTestId('fl-a6-sheet-line')) {
      expect(line.textContent ?? '', line.getAttribute('data-state') ?? '').not.toMatch(
        /\bsynced\b/i,
      )
    }
    // the one place on the sheet that does carry the word is the storyboard's
    // own last-contact line, and it is the source's words verbatim.
    const lastSynced = screen.getByTestId('fl-a6-last-synced')
    expect(lastSynced.textContent).toContain('Last synced 08:29.')
    expect(L41235).toContain('Last synced 08:29.')
  })

  // FAILS IF: the offline statement is drawn only after the worker acts, or
  // not at all. It is asserted on the FIRST render with nothing clicked,
  // because a sheet that mentions offline only once something has happened has
  // already implied a network was needed. Planted: the statement moved below
  // the manual-sync result and into its `tried` branch. Went red.
  it('renders the offline statement before anything has been done', () => {
    render(<SyncDetailSheetView />)
    const statement = screen.getByTestId('fl-a6-offline-statement')
    expect(statement.textContent).toContain('back-filled content from the last synchronisation')
    expect(statement.textContent).toContain('L40035')
  })

  // FAILS IF: the manual control claims something completed, or claims a
  // notification, or asks the worker for anything. FUNC-A6-02-2-3 gives it two
  // honest answers and neither is a completion. Planted: the online line
  // changed to "Everything has been sent." Went red.
  it('reports an attempt when the control is used, and never a completion', () => {
    render(<SyncDetailSheetView />)
    expect(screen.queryByTestId('fl-a6-manual-sync')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try now' }))
    const result = screen.getByTestId('fl-a6-manual-sync')
    expect(result.textContent).toContain('The tablet is contacting the server now.')
    expect(result.textContent).toContain('Online: attempts immediately.')
    expect(result.textContent).not.toMatch(/\b(sent|uploaded|complete|done|success|synced)\b/i)
  })

  // FAILS IF: the offline half of the control's behaviour is not stated. This
  // slice does not drive it and the next one does — but a sheet that rendered
  // only the connected answer would imply the control needs a network to have
  // anything to say. Planted: the offline-answer paragraph deleted. Went red.
  it('states what the control says with no connection, in this slice', () => {
    render(<SyncDetailSheetView />)
    const stated = screen.getByTestId('fl-a6-offline-answer')
    expect(stated.textContent).toContain('Offline: reports no connection honestly.')
    expect(stated.textContent).toContain('There is no connection right now')
    expect(stated.textContent).toContain('your work carries on either way')
  })

  // FAILS IF: the sheet grows any of the three things the storyboard says it
  // does not have. This is the denial rendered as a check rather than as a
  // sentence: every button on the page is enumerated and the list is asserted
  // whole, so a Resolve control added anywhere — not only on the sheet — goes
  // red. Planted: a "Resolve All" button added to the matrix table for the
  // Quality Manager column. Went red naming it.
  it('has no conflict list, no resolve control and no queue editor anywhere', () => {
    render(<SyncDetailSheetView />)
    const names = screen.getAllByRole('button').map((b) => b.textContent ?? '')
    expect(names).toEqual(['Try now'])
    for (const name of names) {
      expect(name).not.toMatch(/resolve|conflict|delete|reorder|clear|suppress|pause/i)
    }
    expect(screen.getByTestId('fl-a6-denial').textContent).toContain(
      'There is no conflict list, no resolve button, and no queue-editing control anywhere on the sheet.',
    )
    // and no control anywhere is drawn disabled: FrontlineAffordance has no
    // such member, so a disabled control could only arrive by hand.
    for (const b of screen.getAllByRole('button')) {
      expect(b.hasAttribute('disabled'), b.textContent ?? '').toBe(false)
    }
  })
})

describe('the matrix, as the viewer sees it', () => {
  // FAILS IF: the table stops drawing every cell. Planted: the column loop
  // narrowed to four columns. Went red at 36 against 45.
  it('draws all forty-five cells and all nine rows', () => {
    render(<SyncDetailSheetView />)
    expect(screen.getAllByTestId('fl-a6-cell')).toHaveLength(45)
    expect(screen.getAllByTestId('fl-a6-row')).toHaveLength(9)
  })

  // FAILS IF: a cell's own words stop reaching the screen. THIS IS THE GATE
  // THIS MODULE MOST NEEDED. Wave 0's fold returns the ROW's cross-surface
  // note for every cell of a cross-surface row, so a table that printed only
  // the fold's verdict would silently drop the Worker cell of row 5 — "the
  // worker never sees or resolves a conflict" — which is the load-bearing
  // sentence of the whole matrix, and drop the Supervisor's Read-only and the
  // Quality Manager's Resolve and Resolve-All with it. Planted: the cell's
  // own-words span removed, leaving only affordanceWords. Went red on all
  // three of row 5's cells at once.
  it('prints every cell’s own words beside the fold’s verdict', () => {
    render(<SyncDetailSheetView />)
    for (const row of FL_A6_MATRIX) {
      for (const column of ['WORKER', 'SUPERVISOR', 'QUALITY_MANAGER', 'TENANT_ADMIN', 'READONLY_AUDITOR'] as const) {
        const cell = document.querySelector(
          `[data-testid="fl-a6-cell"][data-row="${row.id}"][data-column="${column}"]`,
        )
        expect(cell, `${row.id}.${column} is drawn`).not.toBeNull()
        const ownWords = cell?.querySelector('[data-testid="fl-a6-cell-own-words"]')
        expect(ownWords?.textContent, `${row.id}.${column}`).toBe(row.cells[column].note)
      }
    }
    // the three sentences of row 5, spelled out, because they are the ones a
    // fold-only table loses and a count would not notice.
    const worker = document.querySelector(
      '[data-testid="fl-a6-cell"][data-row="resolve-sync-conflict"][data-column="WORKER"]',
    )
    expect(worker?.textContent).toContain('the worker never sees or resolves a conflict')
    expect(L41098).toContain('the worker never sees or resolves a conflict')
    const supervisor = document.querySelector(
      '[data-testid="fl-a6-cell"][data-row="resolve-sync-conflict"][data-column="SUPERVISOR"]',
    )
    expect(supervisor?.textContent).toContain('view only, in the Client Command Center conflict-review panel')
    const qm = document.querySelector(
      '[data-testid="fl-a6-cell"][data-row="resolve-sync-conflict"][data-column="QUALITY_MANAGER"]',
    )
    expect(qm?.textContent).toContain('Resolve and Resolve-All, in the Client Command Center')
  })

  // FAILS IF: a cross-surface row draws a control, or is drawn as anything
  // else. All fifteen cells of the three rows carry the same verdict and the
  // data attribute is what carries it, so this reads the rendering rather than
  // the model. Planted: row 7 reclassified `screen` in the matrix. Its Tenant
  // Admin cell came back `control` and this went red.
  it('marks every cell of the three cross-surface rows as held elsewhere', () => {
    render(<SyncDetailSheetView />)
    const crossSurface = document.querySelectorAll(
      '[data-testid="fl-a6-cell"][data-kind="cross-surface"]',
    )
    expect(crossSurface).toHaveLength(15)
    const controls = document.querySelectorAll('[data-testid="fl-a6-cell"][data-kind="control"]')
    expect([...controls].map((c) => `${c.getAttribute('data-row')}.${c.getAttribute('data-column')}`)).toEqual([
      'view-sync-state.WORKER',
      'trigger-manual-sync.WORKER',
    ])
    // and the three statements are drawn as statements, with no link off this
    // surface for a Worker, who reaches no other surface at all.
    expect(screen.getAllByTestId('fl-cross-surface')).toHaveLength(3)
    for (const note of screen.getAllByTestId('fl-cross-surface')) {
      expect(note.getAttribute('data-link-state')).toBe('statement')
    }
  })

  // FAILS IF: row 7's surface is asserted rather than cited on screen. Its
  // cell names no surface, so the reader is owed the line the surface was read
  // from — and it is not the neighbouring row's. Planted: the corroboration
  // list emptied. Went red.
  it('shows where row 7’s surface was read from, since its own cell is silent', () => {
    render(<SyncDetailSheetView />)
    const cell = document.querySelector(
      '[data-testid="fl-a6-cell"][data-row="set-clock-skew-threshold"][data-column="TENANT_ADMIN"]',
    )
    // The CELL's own words, not the whole cell: the cell also prints the
    // row-level statement, which does name the Hub. What has to stay silent is
    // the transcription, because that is what the source made silent.
    const ownWords = cell?.querySelector('[data-testid="fl-a6-cell-own-words"]')
    expect(ownWords?.textContent).toContain('platform ceiling 60 minutes')
    expect(ownWords?.textContent).not.toMatch(/Hub|Command Center|Studio|console/i)
    expect(cell?.textContent).toContain('a tenant setting in the Delivery Operations Hub')
    const corroborations = screen.getAllByTestId('fl-a6-skew-corroboration')
    expect(corroborations).toHaveLength(2)
    expect(corroborations.map((c) => c.textContent ?? '').join(' ')).toContain('L61256')
    // and the row-level statement, which does name the Hub, cites the line it
    // came from rather than row 6's.
    const statements = screen.getAllByTestId('fl-cross-surface').map((n) => n.textContent ?? '')
    expect(statements.some((s) => s.includes('L38091'))).toBe(true)
  })

  // FAILS IF: the sheet is drawn for a role whose cell says the act does not
  // arise. Row 1 and row 2 are Not applicable for a Supervisor — no execution
  // session — so the Supervisor gets the stated line and no control. Planted:
  // the sheet rendered unconditionally rather than behind the fold. Went red
  // because the control appeared for a Supervisor.
  it('draws no sheet and no control for a Supervisor, and says why', () => {
    render(<SyncDetailSheetView viewerRole="SUPERVISOR" />)
    expect(screen.queryAllByTestId('fl-a6-sheet-line')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Try now' })).toBeNull()
    expect(screen.getByTestId('fl-a6-no-view-control').textContent).toContain(
      'equivalent state is in the Client Command Center',
    )
    expect(screen.getByTestId('fl-a6-no-sync-control').textContent).toContain(
      'no execution session',
    )
  })
})

describe('what the sheet says about itself', () => {
  // FAILS IF: the module renders as though it were finished when two of its
  // twenty-eight functionalities are still not driven, or as though the
  // offline half were still somebody else's. Planted twice: the SliceBoundary
  // section removed from the view (red on the missing test id), and the
  // undriven list dropped from OfflineHalf while the boundary prose stayed —
  // which is a screen that admits the gap in one place and hides it in the
  // other. Went red at 0 against 2.
  it('states which half of the module was built when, and what is still undriven', () => {
    render(<SyncDetailSheetView />)
    const boundary = screen.getByTestId('fl-a6-slice-boundary')
    expect(boundary.textContent).toContain('the connected path')
    expect(boundary.textContent).toContain('The offline half followed')
    expect(boundary.textContent).toContain('DEC-STORE-001')
    const undriven = screen.getAllByTestId('fl-a6-undriven')
    expect(undriven).toHaveLength(A6_UNDRIVEN.length)
    expect(undriven.map((u) => u.getAttribute('data-functionality'))).toEqual(
      A6_UNDRIVEN.map((u) => u.id),
    )
    // and no state is now marked stated-but-not-driven, because none is.
    const stated = screen
      .getAllByTestId('fl-a6-state')
      .filter((s) => s.getAttribute('data-driven') === 'false')
    expect(stated).toHaveLength(0)
    expect(screen.getAllByTestId('fl-a6-state')).toHaveLength(A6_STATES.length)
  })

  // FAILS IF: the card, the functionalities, the criteria or the disclosures
  // stop reaching the screen. A transcription nobody can read is a code
  // comment. Planted: the Functionalities section removed. Went red at 0
  // against 28. Planted again once the offline half added two findings: the
  // findings list sliced to six — red at 8 against 6.
  it('renders every transcribed record it holds', () => {
    render(<SyncDetailSheetView />)
    expect(screen.getAllByTestId('fl-a6-card-statement')).toHaveLength(A6_CARD.length)
    expect(screen.getAllByTestId('fl-a6-functionality')).toHaveLength(A6_FUNCTIONALITIES.length)
    expect(screen.getAllByTestId('fl-a6-acceptance')).toHaveLength(
      A6_ACCEPTANCE_CRITERIA.length,
    )
    expect(screen.getAllByTestId('fl-a6-never-claimed')).toHaveLength(
      A6_CLAIMS_NEVER_MADE.length,
    )
    expect(screen.getAllByTestId('fl-a6-finding')).toHaveLength(8)
    expect(screen.getAllByTestId('fl-a6-denial-test')).toHaveLength(3)
    expect(screen.getAllByTestId('fl-a6-terminal-safe-state')).toHaveLength(8)
  })

  // FAILS IF: a disclosure loses a reading, or a reading loses its locator, or
  // the gap in the shared canon stops being declared on screen. Planted:
  // DEC-WIPE-001's canonNote paragraph removed from the renderer. Went red.
  it('renders all four decisions with both readings and the canon gap', () => {
    render(<SyncDetailSheetView />)
    const notes = screen.getAllByTestId('fl-a6-disclosure')
    expect(notes).toHaveLength(4)
    for (const d of A6_DISCLOSURES) {
      const note = notes.find((n) => n.getAttribute('data-decision') === d.decisionRef)
      expect(note, d.decisionRef).toBeDefined()
      const text = note?.textContent ?? ''
      expect(text, d.decisionRef).toContain(d.question)
      expect(text, d.decisionRef).toContain('DecisionId')
      expect(text, d.decisionRef).toContain('client-delegated choice')
      for (const r of d.readings) {
        expect(within(note as HTMLElement).getByText(r.text, { exact: false })).toBeTruthy()
        expect(text, `${d.decisionRef} locator`).toContain(r.locator)
      }
    }
  })

  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking reaches
  // the rendered page. Swept over the whole body AND over each rendered
  // record, because the two catch different things: the body catches a word
  // assembled from two adjacent elements, and the per-element sweep catches a
  // word that a body-wide sweep would find but not locate. Planted:
  // "countdown" added to the trust-window state gloss. Both halves went red,
  // and the per-element half named the field.
  it('renders no pace, timing, countdown or ranking word', () => {
    const FORBIDDEN = /\b(pace|timer|countdown|ranking|leaderboard|productivity)\b/i
    render(<SyncDetailSheetView />)
    expect(FORBIDDEN.test(pageText())).toBe(false)
    for (const id of [
      'fl-a6-sheet-line',
      'fl-a6-card-statement',
      'fl-a6-state',
      'fl-a6-functionality',
      'fl-a6-cell',
      'fl-a6-acceptance',
      'fl-a6-finding',
      'fl-a6-disclosure',
    ]) {
      for (const el of screen.getAllByTestId(id)) {
        expect(FORBIDDEN.test(el.textContent ?? ''), `${id}: ${el.textContent?.slice(0, 60)}`).toBe(
          false,
        )
      }
    }
  })
})

/* ==================================================================== *
 * THE OFFLINE HALF, ON THE SCREEN.
 *
 * The unit suite next door asks whether the mechanisms produce what they
 * claim. This block asks the only question that cannot be answered there: does
 * the offline half REACH the page. A state resolved and never drawn is a
 * function nobody called, and the whole reason this module states its offline
 * behaviour at all is that a screen showing only the connected path implies
 * the safety layer needs a network.
 * ==================================================================== */

describe('the offline half, as the viewer sees it', () => {
  // FAILS IF: a state this build claims to drive never appears on the page.
  // Read off the elements' own `data-state` attributes rather than off the
  // page text, because a page-text search for STATE-A6-OFFLINE also matches
  // the States list above it, where the identifier is merely NAMED — so a
  // text sweep here would pass with the whole offline section deleted.
  //
  // Planted: the OfflineHalf section removed from the view. Went red at 0
  // against 7. Planted again: the three situations replaced with the connected
  // one three times — the section still rendered, and this went red naming the
  // four states nothing reached.
  it('draws every one of the seven states, reached rather than listed', () => {
    render(<SyncDetailSheetView />)
    const drawn = new Set(
      screen.getAllByTestId('fl-a6-held-state').map((el) => el.getAttribute('data-state')),
    )
    for (const s of A6_STATES) {
      expect(drawn.has(s.id), `${s.id} is reached on the page`).toBe(true)
    }
    expect(screen.getAllByTestId('fl-a6-situation')).toHaveLength(A6_SITUATIONS.length)
  })

  // FAILS IF: a held state is drawn without the sentence that says what it
  // means for the worker. Per element, because the sheet draws the same state
  // more than once — STATE-A6-OFFLINE holds in two of the three situations —
  // and a page-wide check passes when one of the two loses its line.
  //
  // Planted: the line span dropped from the held-state list item, leaving the
  // identifier alone. Went red on the first element, naming its state.
  it('prints each held state’s own sentence beside it, every time it holds', () => {
    render(<SyncDetailSheetView />)
    const seen: string[] = []
    for (const el of screen.getAllByTestId('fl-a6-held-state')) {
      const id = el.getAttribute('data-state') ?? ''
      seen.push(id)
      const text = el.textContent ?? ''
      expect(text.length, id).toBeGreaterThan(id.length + 40)
      expect(text.startsWith(id), id).toBe(true)
    }
    // and a state really is drawn more than once, which is what makes the
    // per-element form of this check different from a page-wide one.
    expect(seen.length).toBeGreaterThan(new Set(seen).size)
  })

  // FAILS IF: the refusal at 96 hours never reaches the page, or reaches it as
  // an acceptance. TEST-A6-4 is a denial test and a denial nobody can read is
  // not a denial. Planted: the value handed to the ruling changed from 96 to
  // 24, so the paragraph still rendered and still read like a refusal notice —
  // with nothing above the ceiling in it. Red on the missing 96, which is the
  // number TEST-A6-4 names.
  it('shows the platform refusing a 96-hour trust window, with both ceilings beside it', () => {
    render(<SyncDetailSheetView />)
    const refusal = screen.getByTestId('fl-a6-ceiling-refusal').textContent ?? ''
    expect(refusal).toContain('96')
    expect(refusal).toContain('above the platform ceiling')
    // AND IT SAYS SO IN TEST-A6-4's OWN TERMS. The first version of this line
    // asserted the word "accepted" was absent, and went red on the refusal's
    // own sentence — "it is not accepted and noted" — which is precisely the
    // thing the denial test asks to see. A word-absence check here would have
    // had to be satisfied by softening the refusal, so what is asserted is the
    // denial rather than the absence of a word inside it.
    expect(refusal).toContain('not accepted and noted')
    const settings = screen.getAllByTestId('fl-a6-bounded-setting')
    expect(settings).toHaveLength(A6_BOUNDED_SETTINGS.length)
    expect(settings.map((el) => el.getAttribute('data-setting'))).toEqual(
      A6_BOUNDED_SETTINGS.map((b) => b.id),
    )
  })

  // FAILS IF: a driver's evidence is drawn as prose about the mechanism rather
  // than the mechanism's own output. Each evidence element is compared with
  // what the module published, so a panel that summarised them would go red.
  // Planted: the evidence span replaced with the driver's `what` sentence.
  // Went red on the first driver.
  it('draws every driver with the output its mechanism produced', () => {
    render(<SyncDetailSheetView />)
    const drivers = screen.getAllByTestId('fl-a6-driver')
    expect(drivers).toHaveLength(A6_DRIVERS.length)
    for (const d of A6_DRIVERS) {
      const el = drivers.find((n) => n.getAttribute('data-driver') === d.id)
      expect(el, d.id).toBeDefined()
      expect(el?.textContent ?? '', d.id).toContain(d.evidence)
    }
    expect(screen.getAllByTestId('fl-a6-driver-evidence')).toHaveLength(A6_DRIVERS.length)
  })

  // FAILS IF: the four axes, the register rows, the reconnect outcome or the
  // reconciliation obligation stop reaching the page. Each of the four is a
  // finding or an obligation this module holds, and a record nobody can read
  // is a code comment. Planted: the axes list sliced to its first two — red at
  // 4 against 2, which a mere presence check would have passed.
  it('renders the axes, the register rows, the resume point and the reconciliation row', () => {
    render(<SyncDetailSheetView />)
    expect(screen.getAllByTestId('fl-a6-axis')).toHaveLength(A6_STATE_AXES.length)
    expect(screen.getAllByTestId('fl-a6-register-row')).toHaveLength(A6_CLASSIFICATION_ROWS.length)
    expect(screen.getByTestId('fl-a6-eighth-token').textContent).toContain('AC-OFF-701')
    const reconnect = screen.getByTestId('fl-a6-reconnect-outcome').textContent ?? ''
    expect(reconnect).toContain('step 22')
    expect(reconnect).toContain('carries on from that step rather than starting again')
    expect(screen.getByTestId('fl-a6-reconciliation').textContent).toContain('unexplained divergence')
  })

  // FAILS IF: a source mode's Frontline-behaviour cell is drawn under a
  // situation whose lever that mode does not belong to. The modes are what
  // keeps device-dark and server-unreachable apart on screen after both
  // collapse onto STATE-A6-OFFLINE, so drawing the wrong set silently undoes
  // the distinction L78650 requires. Planted: every situation's mode list read
  // off the FIRST situation's lever instead of its own — red at 21 modes
  // expected against 3 drawn.
  it('draws only the modes each situation’s own lever reproduces', () => {
    render(<SyncDetailSheetView />)
    const expected = A6_SITUATIONS.reduce(
      (n, s) => n + a6StateReading(s.situation).modes.length,
      0,
    )
    expect(screen.getAllByTestId('fl-a6-mode')).toHaveLength(expected)
    const dark = a6StateReading(A6_SITUATIONS[1]?.situation ?? A6_SITUATIONS[0].situation)
    const unreachable = a6StateReading(A6_SITUATIONS[2]?.situation ?? A6_SITUATIONS[0].situation)
    expect(dark.modes.length).not.toBe(unreachable.modes.length)
  })

  // FAILS IF: the offline half carries a phrasing this build forbids. Swept
  // over the new sections specifically, because the page-wide sweep above was
  // written before they existed and a region nobody sweeps is where anything
  // hides. Planted: "Synced" written as the label of a held state. Went red
  // naming that element.
  it('claims nothing synced, and no pace, timing or countdown word', () => {
    const FORBIDDEN = /\b(pace|timer|countdown|ranking|leaderboard|productivity|synced)\b/i
    render(<SyncDetailSheetView />)
    for (const id of [
      'fl-a6-held-state',
      'fl-a6-axis',
      'fl-a6-driver',
      'fl-a6-undriven',
      'fl-a6-bounded-setting',
      'fl-a6-ceiling-refusal',
      'fl-a6-reconnect-outcome',
      'fl-a6-register-row',
      'fl-a6-reconciliation',
      'fl-a6-mode',
    ]) {
      for (const el of screen.getAllByTestId(id)) {
        expect(FORBIDDEN.test(el.textContent ?? ''), `${id}: ${el.textContent?.slice(0, 70)}`).toBe(
          false,
        )
      }
    }
  })
})
