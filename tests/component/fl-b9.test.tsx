import { describe, it, expect } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FL_OVERLAY_ON_ANY_DESTINATION } from '@/frontline/screens'
import { GatesAndSignOffView } from '@/frontline/modules/fl-b9/GatesAndSignOffPanel'
// THE PANEL THE ROUTE ACTUALLY MOUNTS, from the SERVER module. This suite used
// to read `FL_B9_PANEL` out of the `'use client'` file above -- a duplicate that
// `app/frontline/run-player/page.tsx` never imported, so the module id and
// heading a client sees on /frontline/run-player/ were asserted by nothing and
// the assertion below could not fail. See `./panel.tsx`'s own comment for the
// slice-7 defect this shape shipped once.
import { FL_B9_ROUTE_PANEL } from '@/frontline/modules/fl-b9/panel'
import { B9_CARD, B9_STATES, SB_FL_018 } from '@/frontline/modules/fl-b9/charter'
import { B9_COLUMNS, B9_MATRIX, type B9Column } from '@/frontline/modules/fl-b9/matrix'
import {
  B9_ACCEPTANCE_CRITERIA,
  B9_DISCLOSURES,
  B9_FUNCTIONALITIES,
} from '@/frontline/modules/fl-b9/service'

/**
 * `MOD-FL-B9`'s panel, checked as a RENDERING rather than as a data
 * structure. The unit suite next door asks whether the transcription matches
 * the frozen source; this one asks whether what the source says reaches the
 * screen, because a claim held in data and never drawn is a code comment and
 * a code comment is not a disclosure.
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
 * Wave 1 recorded a word sweep defeated by element concatenation — a
 * forbidden word split across two adjacent spans is invisible to a
 * per-element scan and plainly visible to a reader. Reading the body joins
 * them, which is what a reader does.
 */
function pageText(): string {
  return document.body.textContent ?? ''
}

/**
 * Whether an element is actually on the page for a reader, rather than merely
 * in the document. THIS EXISTS BECAUSE A GATE COULD NOT FAIL WITHOUT IT: the
 * two "stated on first paint" gates below read `textContent`, and a
 * `hidden={!movedOn}` attribute on the same element leaves `textContent`
 * untouched — so a statement moved behind a click passed both of them
 * verbatim. `textContent` answers "is this string in the DOM", and the claim
 * these gates make is "a reader sees this before they have done anything".
 * jsdom computes no layout, so the check walks the ancestor chain for the two
 * ways a rendering hides a node without removing it.
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

/** Every button the panel offers, by its accessible name. */
function buttonNames(): readonly string[] {
  return screen.queryAllByRole('button').map((b) => b.textContent?.trim() ?? '')
}

/** Render for one persona column and hand back its buttons. */
function paintFor(role: B9Column): readonly string[] {
  cleanup()
  render(<GatesAndSignOffView viewerRole={role} />)
  return buttonNames()
}

/**
 * The page text at every state this panel has, for every persona column,
 * because a gate that reaches fewer states than the panel has is a gate that
 * passes the defect it was written for. Two sweeps below walk it.
 */
function textInEveryState(): readonly [string, string][] {
  const out: [string, string][] = []
  for (const role of B9_COLUMNS) {
    cleanup()
    render(<GatesAndSignOffView viewerRole={role} />)
    out.push([`${role} first paint`, pageText()])
    for (const b of screen.queryAllByRole('button')) {
      fireEvent.click(b)
      out.push([`${role} after "${b.textContent?.trim()}"`, pageText()])
    }
  }
  cleanup()
  return out
}

describe('MOD-FL-B9 — the panel contract', () => {
  // FAILS IF: the panel stops being a Run Player panel, or claims a module it
  // does not own, or claims a view whose Module column is another module's.
  // `rendersViews` is derived from §22.7's own rows. Planted: the filter
  // widened to include SCR-FL-16, the worker-finished completion screen,
  // which is MOD-FL-A3's. Went red at 3 against 2.
  it('exports a RunPlayerPanel naming its own module and its own two views', () => {
    expect(FL_B9_ROUTE_PANEL.module).toBe('MOD-FL-B9')
    expect(FL_B9_ROUTE_PANEL.heading).toBe('Gates and Sign-Off Authority')
    expect(FL_B9_ROUTE_PANEL.rendersViews).toEqual([
      'Gate block and parked-run notice',
      'Supervisor sign-off screen with step-up',
    ])
    // both really are this module's rows of the twenty-three-row register.
    expect(srcLine(39876)).toContain('`MOD-FL-B9`')
    expect(srcLine(39877)).toContain('`MOD-FL-B9`')
  })

  // FAILS IF: the panel body is not the view. Planted: body replaced with a
  // placeholder paragraph. Went red on the cell count.
  it('mounts the view as its body, all forty-five cells', () => {
    render(<>{FL_B9_ROUTE_PANEL.body}</>)
    expect(screen.getAllByTestId('fl-b9-cell')).toHaveLength(45)
    expect(screen.getAllByTestId('fl-b9-row')).toHaveLength(9)
  })
})

describe('the four controls, and only the four', () => {
  // FAILS IF: a control appears for a persona the matrix refuses, or the
  // sign-off loses its authorising persona. THIS IS THE INVERSE TRAP AS A
  // RENDERING: three of the four controls belong to the Supervisor and the
  // Quality Manager, and the uniform rule "a permissive Supervisor cell means
  // the act is elsewhere" would leave the two right-hand columns below empty
  // and this module's sign-off screen with no way to be authorised.
  //
  // Planted: the sign-off row reclassified `another-surface` with SURF-CC.
  // The Supervisor and Quality Manager columns went to no buttons at all and
  // this went red on both.
  it('draws each persona exactly the controls its own column earns', () => {
    expect(paintFor('WORKER')).toEqual([SB_FL_018.control])
    expect(paintFor('SUPERVISOR')).toEqual(['Authorise this sign-off as the Supervisor'])
    expect(paintFor('QUALITY_MANAGER')).toEqual([
      'Authorise this sign-off as the Quality Manager',
      'Sign in place of the unavailable supervisor',
    ])
    expect(paintFor('TENANT_ADMIN')).toEqual([])
    expect(paintFor('READONLY_AUDITOR')).toEqual([])
  })

  // FAILS IF: the panel grows a control the matrix does not draw — a posture
  // switch, a clearance trigger, an unpark, an override. The total across all
  // five personas is four, which is the matrix's own control count, and both
  // sides are counted rather than one being asserted against a literal.
  // Planted: a posture switch added beside the two posture statements. Went
  // red at 5 against 4.
  it('offers no control anywhere that the matrix does not draw', () => {
    const rendered = B9_COLUMNS.map((r) => paintFor(r).length).reduce((a, b) => a + b, 0)
    cleanup()
    let fromMatrix = 0
    for (const row of B9_MATRIX) {
      for (const column of B9_COLUMNS) {
        // the fold is the authority; this counts what it returns.
        if (row.cells[column].outcome === 'allowed' || row.cells[column].outcome === 'allowedWithConditions') {
          if (row.surface === 'screen' && row.existence === 'present') fromMatrix += 1
        }
      }
    }
    expect(rendered).toBe(fromMatrix)
    expect(rendered).toBe(4)
  })

  // FAILS IF: a field appears anywhere on this panel. SB-FL-018 is explicit:
  // "There is no code field, no 'proceed anyway', and no supervisor password
  // box on the worker's path." A sign-off authorisation raises MOD-FL-A1's
  // overlay; a credential box drawn HERE would be this module building A1's
  // sheet. Asserted after every click of every persona, because a box that
  // appears only once something has happened is the one a first-paint check
  // misses. Planted: a password input added under the authorise button. Went
  // red on the Supervisor's post-click state.
  it('draws no input, no field and no password box, in any state', () => {
    for (const role of B9_COLUMNS) {
      cleanup()
      render(<GatesAndSignOffView viewerRole={role} />)
      for (const b of [...screen.queryAllByRole('button')]) fireEvent.click(b)
      expect(document.querySelectorAll('input'), `${role} input`).toHaveLength(0)
      expect(document.querySelectorAll('textarea'), `${role} textarea`).toHaveLength(0)
      expect(document.querySelectorAll('select'), `${role} select`).toHaveLength(0)
      expect(pageText(), `${role}`).not.toMatch(/proceed anyway['"’”]?\s*$/i)
    }
    cleanup()
    expect(srcLine(41736)).toContain('no supervisor password box')
  })
})

describe('the gate block, and the offline statement it leads with', () => {
  // FAILS IF: the offline statement is drawn only after the worker acts, or
  // behind a connectivity check, or not at all. Asserted on the FIRST render
  // with nothing clicked, because a panel that mentions offline only once
  // something has happened has already implied a network was needed. Planted:
  // the statement moved inside the `movedOn` branch. Went red.
  //
  // THIS GATE COULD NOT FAIL AGAINST THE SUBTLER PLANT and `isShown` is what
  // closed it. Planted second: `hidden={!movedOn}` left on the same element.
  // `textContent` is unchanged by the attribute, so the gate passed a panel
  // that showed the offline statement only after the worker had acted —
  // exactly the defect it was written for. GREEN, then red once the
  // visibility of the node was asserted rather than its presence.
  it('states that the gate is enforced locally before anything has been done', () => {
    render(<GatesAndSignOffView />)
    const statement = screen.getByTestId('fl-b9-offline-statement')
    expect(isShown(statement), 'the offline statement is shown, not merely present').toBe(true)
    expect(statement.textContent).toContain(
      'The gate itself is enforced locally, exactly as online.',
    )
    expect(statement.textContent).toContain('L41652')
    expect(srcLine(41652)).toContain('The gate itself is enforced locally, exactly as online.')
  })

  // FAILS IF: the storyboard's own words stop reaching the screen, or the
  // single control stops parking the Run. Planted: the parked sentence
  // dropped from the storyboard block. Went red.
  it('renders SB-FL-018’s three sentences and parks on its one control', () => {
    render(<GatesAndSignOffView />)
    const board = screen.getByTestId('fl-b9-storyboard')
    expect(board.textContent).toContain(SB_FL_018.heading)
    expect(board.textContent).toContain(SB_FL_018.requirement)
    expect(board.textContent).toContain(SB_FL_018.parked)
    expect(board.getAttribute('data-state')).toBe('STATE-B9-BLOCKED')
    expect(screen.queryByTestId('fl-b9-parked')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: SB_FL_018.control }))
    expect(board.getAttribute('data-state')).toBe('STATE-B9-PARKED')
    expect(screen.getByTestId('fl-b9-parked').textContent).toContain('Nothing on this tablet can release it.')
  })

  // FAILS IF: the panel tells a worker their Run was set aside under a
  // posture that does not block, or hides one of the two postures. Both are
  // statements and neither is switchable. Planted: the lenient row dropped
  // from the rendering. Went red at 1 against 2.
  it('renders both tenant postures as statements, with only strict parking', () => {
    render(<GatesAndSignOffView />)
    const rows = screen.getAllByTestId('fl-b9-posture')
    expect(rows.map((r) => r.getAttribute('data-state'))).toEqual([
      'STATE-B9-BLOCKED',
      'STATE-B9-NOTIFIED',
    ])
    expect(rows[0]?.textContent).toContain('STATE-B9-PARKED')
    expect(rows[1]?.textContent).not.toContain('STATE-B9-PARKED')
    expect(rows[1]?.textContent).toContain('the step is not blocked')
  })

  // FAILS IF: an already-expired clearance is rendered as applied. Planted:
  // the two clearance rows rendered in one collapsed sentence that said the
  // clearance was applied. Went red on the rejected state.
  it('renders both clearance outcomes, and the rejected one keeps the Run parked', () => {
    render(<GatesAndSignOffView />)
    const rows = screen.getAllByTestId('fl-b9-clearance')
    expect(rows.map((r) => r.getAttribute('data-state'))).toEqual([
      'STATE-B9-CLEARED',
      'STATE-B9-CLEARANCEEXPIRED',
    ])
    expect(rows[1]?.textContent).toContain('rejected rather than applied')
    expect(rows[1]?.textContent).toContain('Run stays parked')
  })
})

describe('the sign-off, and the overlay this module does not own', () => {
  // FAILS IF: the panel implies the step-up sheet is a panel of this route,
  // or stops naming where it comes from. §22.7 gives SCR-FL-03 "Overlay on
  // any destination" and MOD-FL-A1 owns it. Planted: the pointer paragraph
  // deleted, leaving the authorise button with no account of what it raises.
  // Went red.
  it('names MOD-FL-A1’s overlay and says it is raised over this destination', () => {
    render(<GatesAndSignOffView viewerRole="SUPERVISOR" />)
    const pointer = screen.getByTestId('fl-b9-step-up-pointer')
    expect(pointer.textContent).toContain(FL_OVERLAY_ON_ANY_DESTINATION.name)
    expect(pointer.textContent).toContain(FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn)
    expect(pointer.textContent).toContain('MOD-FL-A1')
    expect(pointer.textContent).toContain(FL_OVERLAY_ON_ANY_DESTINATION.sourceRef)
    expect(pointer.textContent).toContain('session is not ended')
  })

  // FAILS IF: the panel says an offline sign-off is queued, held or pending.
  // The offline behaviour is stated on first paint whether or not this slice
  // simulates it, because a screen that renders only the connected path has
  // already made the claim. Planted: `hidden={signed === 'none'}` on the
  // offline paragraph — the same `textContent`-blind hole as the gate above,
  // GREEN until `isShown` was asserted, then red.
  it('states the offline sign-off behaviour on first paint, and never queues it', () => {
    render(<GatesAndSignOffView viewerRole="SUPERVISOR" />)
    const offline = screen.getByTestId('fl-b9-sign-off-offline')
    expect(isShown(offline), 'the offline sign-off line is shown, not merely present').toBe(true)
    expect(offline.textContent).toContain('does not proceed')
    expect(offline.textContent).not.toMatch(/\b(queued|queue|pending)\b/i)
    expect(screen.getByTestId('fl-b9-forced-sync').textContent).toContain(
      'a sign-off is a designated high-risk action',
    )
  })

  // FAILS IF: a substitute sign-off is recorded without its three fields, or
  // is presented as a silent skip, or is filled with invented names. AC-B9-7
  // (L41752) asks for who signed, in lieu of whom, and why, plus a raised
  // notification. Planted: the record paragraph given a made-up signatory and
  // a made-up supervisor. Went red on the no-names assertion.
  it('records a substitute sign-off in full, with its fields named and unfilled', () => {
    render(<GatesAndSignOffView viewerRole="QUALITY_MANAGER" />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in place of the unavailable supervisor' }))
    const signed = screen.getByTestId('fl-b9-signed')
    expect(signed.getAttribute('data-state')).toBe('STATE-B9-SUBSTITUTESIGNED')
    expect(signed.textContent).toContain('who signed, in lieu of whom, and why')
    expect(signed.textContent).toContain('notification raised')
    expect(signed.textContent).toContain('never a silent skip')
    const record = screen.getByTestId('fl-b9-substitute-record')
    expect(record.textContent).toContain('no names are shown here')
    expect(srcLine(41752)).toContain('AC-B9-7')
  })

  // FAILS IF: the Quality Manager loses the substitute sign-off, or the
  // Supervisor gains it. The Supervisor's cell is Not applicable because the
  // Supervisor is the party being substituted for — a statement about this
  // act on this device, not a pointer elsewhere. Planted: the substitute row
  // given the Supervisor an `allowed` cell. Went red on the refusal wording.
  it('refuses the substitute sign-off to the Supervisor in the source’s own words', () => {
    render(<GatesAndSignOffView viewerRole="SUPERVISOR" />)
    const block = screen.getByTestId('fl-b9-substitute')
    expect(block.getAttribute('data-kind')).toBe('refusal')
    expect(block.textContent).toContain('the Supervisor is the party being substituted for')
    expect(screen.getByTestId('fl-b9-authorise').getAttribute('data-kind')).toBe('control')
  })
})

describe('the matrix as it renders', () => {
  // FAILS IF: a cell's rendered kind stops matching what the fold returns for
  // it, which is what "renders through frontlineAffordance and never around
  // it" means in markup. Every one of the forty-five carries its kind on the
  // element. Planted: the Tenant Admin column rendered from the token
  // directly instead of from the fold. Went red on row 5's five cells.
  it('marks all forty-five cells with the kind the fold returned', () => {
    render(<GatesAndSignOffView />)
    const kinds = new Map<string, number>()
    for (const cell of screen.getAllByTestId('fl-b9-cell')) {
      const k = cell.getAttribute('data-kind') ?? ''
      kinds.set(k, (kinds.get(k) ?? 0) + 1)
    }
    // 3 cross-surface rows × 5, 1 stated-line row × 5, 4 controls, 31 refusals
    expect(kinds.get('cross-surface')).toBe(15)
    expect(kinds.get('stated-line')).toBe(5)
    expect(kinds.get('control')).toBe(4)
    expect(kinds.get('refusal')).toBe(21)
    expect(kinds.get('routed')).toBeUndefined()
    expect([...kinds.values()].reduce((a, b) => a + b, 0)).toBe(45)
  })

  // FAILS IF: row 5's Tenant Admin cell draws a configuration control on this
  // device, or claims a surface the source does not name for it. The rendered
  // line names WHAT would sit there and WHY it does not. Planted: the row set
  // to `existence: 'present'`, which drew a control in the Tenant Admin
  // column. Went red on the kind and on the button count.
  it('renders row 5 as a stated line naming no surface', () => {
    render(<GatesAndSignOffView viewerRole="TENANT_ADMIN" />)
    const cells = screen
      .getAllByTestId('fl-b9-cell')
      .filter((c) => c.getAttribute('data-row') === 'set-clearance-duration')
    expect(cells).toHaveLength(5)
    for (const c of cells) expect(c.getAttribute('data-kind')).toBe('stated-line')
    const ta = cells.find((c) => c.getAttribute('data-column') === 'TENANT_ADMIN')
    expect(ta?.textContent).toContain('Set the clearance duration')
    expect(ta?.textContent).toContain('no control is drawn here')
    expect(ta?.textContent).toContain('uniform at tenant level, deliberately not per-user')
    expect(ta?.textContent).not.toContain('Delivery Operations Hub')
    expect(buttonNames()).toEqual([])
  })

  // FAILS IF: a cross-surface row stops rendering a statement of where the
  // act is met. Three rows, three surfaces, three statements. Planted: the
  // cross-surface block filtered to rows whose token is permissive, which
  // dropped none of them but rendered the Studio row twice. Went red at 4
  // against 3.
  it('renders one cross-surface statement for each of the three rows', () => {
    render(<GatesAndSignOffView />)
    const notes = screen.getAllByTestId('fl-cross-surface')
    expect(notes).toHaveLength(3)
    const text = notes.map((n) => n.textContent ?? '').join(' || ')
    expect(text).toContain('Client Command Center action 10, delivered on the command channel')
    expect(text).toContain('strict blocking is the default')
    expect(text).toContain('as a Studio authoring choice per screen with an authoring grant')
    // and none of them draws a control.
    for (const n of notes) expect(n.querySelectorAll('button')).toHaveLength(0)
  })
})

describe('what the panel discloses', () => {
  // FAILS IF: a transcribed statement is held in data and never drawn. The
  // card, the states, the functionalities and the acceptance criteria are all
  // counted against their own registers rather than against a literal.
  // Planted: the card section filtered to `onTheCard` only, which dropped
  // thirteen fields including the offline behaviour. Went red.
  it('draws every card field, state, functionality and criterion it holds', () => {
    render(<GatesAndSignOffView />)
    expect(screen.getAllByTestId('fl-b9-card-statement')).toHaveLength(B9_CARD.length)
    expect(screen.getAllByTestId('fl-b9-state')).toHaveLength(B9_STATES.length)
    expect(screen.getAllByTestId('fl-b9-functionality')).toHaveLength(B9_FUNCTIONALITIES.length)
    expect(screen.getAllByTestId('fl-b9-acceptance')).toHaveLength(B9_ACCEPTANCE_CRITERIA.length)
    const text = pageText()
    for (const s of B9_CARD) expect(text, s.field).toContain(s.sourceRef)
    for (const s of B9_STATES) expect(text, s.id).toContain(s.id)
  })

  // FAILS IF: an open decision reaches the screen without every reading and
  // every locator beside it, or without its working position labelled a
  // client-delegated choice. That is the whole contract of a disclosure.
  // Planted: DEC-SUBAUTH-001's second reading dropped from the rendering,
  // leaving only §7.13.3's. Went red.
  it('renders all three decisions with every reading, every locator and the label', () => {
    render(<GatesAndSignOffView />)
    const notes = screen.getAllByTestId('fl-b9-disclosure')
    expect(notes).toHaveLength(3)
    for (const [i, d] of B9_DISCLOSURES.entries()) {
      const t = notes[i]?.textContent ?? ''
      expect(t, d.decisionRef).toContain(d.decisionRef)
      expect(t, d.decisionRef).toContain('client-delegated choice')
      for (const r of d.readings) {
        expect(t, `${d.decisionRef} ${r.locator}`).toContain(r.locator)
        expect(t, `${d.decisionRef} reading`).toContain(r.text)
      }
      expect(t, d.decisionRef).toContain(d.canonNote)
    }
  })

  // FAILS IF: the Ch4.4 conflict is rendered as settled, or one of its two
  // readings is dropped, or it is dressed as a decision. Ch4.4 is the short
  // chapter an implementer reads first, so the conflict has to be on the
  // screen and not only in a report. Planted: the bears-on-it list dropped,
  // which left the two readings facing each other with nothing saying that
  // EXCL-FL-05 settles the Worker column only. Went red.
  it('renders both readings of the gate-override conflict and settles neither', () => {
    render(<GatesAndSignOffView />)
    const note = screen.getByTestId('fl-b9-contradiction')
    expect(screen.getAllByTestId('fl-b9-contradiction-reading')).toHaveLength(2)
    const t = note.textContent ?? ''
    expect(t).toContain('L2671')
    expect(t).toContain('L41619')
    expect(t).toContain('L39488')
    expect(t).toContain('worker-initiated')
    expect(t).toContain('No override control is drawn on this device for any column')
    expect(t).toContain('No DEC-* identifier is attached to this conflict')
  })

  // FAILS IF: the AC-FL-011-1 gap is rendered as met, or is not rendered at
  // all. One of thirteen names no pattern and the screen says which one and
  // why nothing was assigned to it. Planted: the paragraph reworded to say
  // every functionality names a pattern. Went red.
  it('renders the AC-FL-011-1 gap by name and refuses to fill it', () => {
    render(<GatesAndSignOffView />)
    const p = screen.getByTestId('fl-b9-ac-fl-011-1-gap')
    expect(p.textContent).toContain('FUNC-B9-01-2-2')
    expect(p.textContent).toContain('Nothing is assigned to close it')
    expect(p.textContent).toContain('L40151')
    expect(screen.getByTestId('fl-b9-pattern-divergence').textContent).toContain('FB-FL-PKG-01')
  })

  // FAILS IF: a finding is recorded in data and never drawn. Three of them,
  // and the DEC-GATE-001 misassignment is the one a reader of the dispatch
  // most needs on the screen. Planted: the findings section deleted from the
  // view. Went red.
  it('renders all three findings, including the decision that is not this module’s', () => {
    render(<GatesAndSignOffView />)
    expect(screen.getAllByTestId('fl-b9-finding')).toHaveLength(3)
    const t = pageText()
    expect(t).toContain('DEC-GATE-001 is not this module')
    expect(t).toContain('queuedOffline')
    expect(t).toContain('AC-SCOPE-040')
  })
})

describe('what nothing this panel draws may contain', () => {
  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking
  // reaches the rendered page in ANY state for ANY persona. The one string
  // that legitimately carries the word is DEC-PARK-001's third candidate
  // behaviour, the source's own proposal quoted verbatim at L41682 inside a
  // disclosure of an open decision — so the sweep subtracts that one string
  // from the page rather than exempting a region, and any other occurrence
  // fails wherever it is.
  //
  // Planted twice: "countdown" in the parked notice, which appears only after
  // a click and only for the Worker, and "timers" in the substitute record,
  // which appears only after a click and only for the Quality Manager.
  // Both went red — a first-paint-only sweep would have passed both, and a
  // `\btimer\b` pattern would have passed the second.
  it('carries no pace, timing, countdown or ranking word in any state', () => {
    const FORBIDDEN = /\b(pace|timers?|countdowns?|rankings?|leaderboards?|productivity)\b/i
    // ANNOTATED, because `as const` gives each reading its own literal type
    // and `flatMap` over the three disclosures produces a tuple TypeScript
    // will not widen on its own.
    const readings: readonly { readonly text: string }[] = B9_DISCLOSURES.flatMap(
      (d) => [...d.readings],
    )
    const quoted = readings.map((r) => r.text).find((t) => FORBIDDEN.test(t)) ?? ''
    expect(quoted, 'the one quoted reading exists').not.toBe('')
    // BACKTICKS STRIPPED ON THE SOURCE SIDE ONLY. The line writes
    // `Not specified in the Statement of Work` and `DEC-PARK-001` in
    // backticks and a data field cannot carry them, so the source is folded
    // and the transcription is not — which keeps this a check on the WORDS
    // rather than on both sides being folded until they agree.
    expect(srcLine(41682).replace(/`/g, '')).toContain(quoted)

    const states = textInEveryState()
    expect(states.length).toBeGreaterThan(8)
    for (const [where, text] of states) {
      expect(text, `${where} shows the quoted reading`).toContain(quoted)
      const rest = text.split(quoted).join(' ')
      const hit = rest.match(FORBIDDEN)
      expect(hit?.[0] ?? null, `${where}: ${rest.slice(Math.max(0, (hit?.index ?? 0) - 40), (hit?.index ?? 0) + 40)}`).toBeNull()
    }
  })

  // FAILS IF: the word "synced" reaches the page in any state. L39622: there
  // is no single state called "synced". Planted: the applied-clearance
  // sentence opened with "Synced." Went red on every persona's first paint.
  it('never writes synced anywhere on the page', () => {
    for (const [where, text] of textInEveryState()) {
      expect(text, where).not.toMatch(/\bsynced\b/i)
    }
  })

  // FAILS IF: the build plan's rigour grade reaches the screen. The source's
  // own module-inventory column is Band and reads B for this module; neither
  // it nor C1 is a product fact this panel states. Planted: "Grade C1" added
  // to the identifier card field. Went red on every persona.
  it('states no build-plan grade in any state', () => {
    for (const [where, text] of textInEveryState()) {
      expect(text, where).not.toMatch(/\bC1\b/)
      expect(text, where).not.toMatch(/\bC2\b/)
    }
  })
})
