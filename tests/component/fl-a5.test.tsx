import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DetectionAndContainmentView,
  FL_A5_PANEL,
} from '@/frontline/modules/fl-a5/DetectionAndContainmentPanel'
import { A5_CARD, A5_STATES } from '@/frontline/modules/fl-a5/charter'
import { FL_A5_MATRIX } from '@/frontline/modules/fl-a5/matrix'
import { A5_ACCEPTANCE_CRITERIA, A5_FUNCTIONALITIES } from '@/frontline/modules/fl-a5/service'

/**
 * `MOD-FL-A5`'s panel, checked as a RENDERING rather than as a data
 * structure. The unit suite next door asks whether the transcription matches
 * the frozen source; this one asks whether what the source says reaches the
 * screen, because a claim held in data and never drawn is a code comment and
 * a code comment is not a disclosure.
 *
 * Every gate below was planted, watched go red, and restored. The `FAILS IF`
 * note names the defect that was actually planted.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const L40948 = readFileSync(SOURCE_PATH, 'utf8').split('\n')[40947] ?? ''

function pageText(): string {
  return document.body.textContent ?? ''
}

/**
 * The page text at every state this panel has, in order: first paint, after
 * the capture is committed, after the checklist is started, after it is
 * completed. Two gates below walk it, because a gate that reaches fewer
 * states than the panel has is a gate that passes the defect it was written
 * for — and both of those gates did, until the plants showed it.
 */
function textInEveryState(): readonly [string, string][] {
  render(<DetectionAndContainmentView />)
  const out: [string, string][] = [['first paint', pageText()]]
  fireEvent.click(screen.getByRole('button', { name: /Commit 38\.0 Newton metres/ }))
  out.push(['committed', pageText()])
  fireEvent.click(screen.getByRole('button', { name: /Start the first item/ }))
  out.push(['containment in progress', pageText()])
  fireEvent.click(screen.getByRole('button', { name: /Complete the last item/ }))
  out.push(['containment complete', pageText()])
  return out
}

describe('MOD-FL-A5 — the panel contract', () => {
  // FAILS IF: the panel stops being a Run Player panel, or claims a module
  // it does not own. `rendersViews` is derived from §22.7's own Module
  // column, so a wrong name cannot be typed in. Planted: the filter narrowed
  // to SCR-FL-12, dropping the deviation capture screen. Went red at 1
  // against 2.
  it('exports a RunPlayerPanel naming its own module and its own two views', () => {
    expect(FL_A5_PANEL.module).toBe('MOD-FL-A5')
    expect(FL_A5_PANEL.heading).toBe('On-Device Detection and Containment')
    expect(FL_A5_PANEL.rendersViews).toEqual([
      'Deviation capture screen',
      'Containment checklist',
    ])
  })

  // FAILS IF: the panel body is not the view. Planted: body replaced with a
  // placeholder paragraph. Went red on the cell count.
  it('mounts the view as its body', () => {
    render(<>{FL_A5_PANEL.body}</>)
    expect(screen.getAllByTestId('fl-a5-cell')).toHaveLength(45)
  })
})

describe('trap 1 — the safety layer is stated offline, on first paint', () => {
  // FAILS IF: the offline statement is drawn only after the worker acts, or
  // behind a connectivity check, or not at all. It is asserted on the FIRST
  // render with nothing clicked, because a panel that mentions offline only
  // once something has happened has already implied a network was needed.
  // Planted: the statement moved inside the `committed` branch. Went red.
  it('renders the offline statement before anything has been done', () => {
    render(<DetectionAndContainmentView />)
    const statement = screen.getByTestId('fl-a5-offline-statement')
    expect(statement.textContent).toContain(
      'The lot is protected from the moment of the breach, not from the moment of synchronisation',
    )
    expect(statement.textContent).toContain('L40948')
    // and the sentence it stands for is really at L40948.
    expect(L40948).toContain('the lot is protected from the moment of the breach')
  })

  // FAILS IF: committing the example value stops producing the hold, its
  // scope and the containment launch. What the panel prints comes from the
  // classification alone; that it CANNOT be gated on connectivity is held
  // by the unit gate on `containmentDecision`'s own text, because a
  // connectivity check in jsdom would read as online and this gate would
  // not see it. Planted: the example classification changed to Severity 2.
  // Went red on all three sentences.
  it('draws the hold, its scope and the containment launch from the classification alone', () => {
    render(<DetectionAndContainmentView />)
    fireEvent.click(screen.getByRole('button', { name: /Commit 38\.0 Newton metres/ }))
    const panel = screen.getByTestId('fl-a5-severity-one')
    expect(panel.textContent).toContain('Severity 1 — this lot has been placed on hold.')
    expect(panel.textContent).toContain('the lot has been placed on hold')
    expect(panel.textContent).toContain('It happened at the moment of the breach.')
  })

  // FAILS IF: the panel tells the worker someone has been notified when
  // nobody has. TEST-A5-7 (L41065) asks for a queued escalation and no
  // claim of notification. Planted: the offline line changed to "Your
  // supervisor has been notified." Went red on both assertions.
  it('promises the notification in the future and never in the past', () => {
    render(<DetectionAndContainmentView />)
    fireEvent.click(screen.getByRole('button', { name: /Commit 38\.0 Newton metres/ }))
    const escalation = screen.getByTestId('fl-a5-escalation')
    expect(escalation.textContent).toContain(
      'will be notified when this tablet reconnects',
    )
    expect(escalation.textContent).not.toMatch(/\b(has|have|was|were) been notified\b/i)
    expect(escalation.textContent).not.toMatch(/\bnotified\b(?!\s+when)/i)
  })
})

describe('trap 2 — the hold lifecycle is not a device timeline', () => {
  // FAILS IF: the panel renders the four hold states as though this device
  // held all four. The propagating row is marked on the element itself, so
  // the claim is checkable in the markup rather than in prose. Planted:
  // `heldByThisDevice` dropped from the rendering. Went red at 0 against 1.
  it('marks the one state this device cannot know, in the markup', () => {
    render(<DetectionAndContainmentView />)
    const states = screen.getAllByTestId('fl-a5-state')
    expect(states).toHaveLength(A5_STATES.length)
    const unknowable = states.filter((s) => s.getAttribute('data-held') === 'false')
    expect(unknowable).toHaveLength(1)
    expect(unknowable[0]?.textContent).toContain('STATE-A5-PROPAGATING')
    expect(unknowable[0]?.textContent).toContain('this device cannot know this')
  })

  // FAILS IF: the honesty statement stops being drawn. Planted: the
  // paragraph deleted. Went red.
  it('says in plain words that the fleet sequence is the Command Center’s', () => {
    render(<DetectionAndContainmentView />)
    const honesty = screen.getByTestId('fl-a5-propagation-honesty')
    expect(honesty.textContent).toContain('It does not show a fleet timeline')
    expect(honesty.textContent).toContain('Client Command Center')
    expect(honesty.textContent).toContain('TEST-STATE-003')
  })
})

describe('the matrix, rendered through frontlineAffordance', () => {
  // FAILS IF: a cell is dropped from the rendering, or a row's stated line
  // is not drawn. Forty-five cells and nine row sentences, counted off the
  // markup. Planted: the row-why span removed. Went red at 0 against 9.
  it('draws every cell and every row’s stated line', () => {
    render(<DetectionAndContainmentView />)
    expect(screen.getAllByTestId('fl-a5-cell')).toHaveLength(45)
    expect(screen.getAllByTestId('fl-a5-row-why')).toHaveLength(9)
    expect(screen.getAllByTestId('fl-a5-row')).toHaveLength(FL_A5_MATRIX.length)
  })

  // FAILS IF: the Worker's two controls stop being controls, or a third
  // appears. The kind is on the cell element, so the fold's answer is what
  // the markup records. Planted: row 3's Worker cell set to `allowed` in
  // the matrix. Went red at 3 against 2.
  it('records exactly two control cells, both the Worker’s', () => {
    render(<DetectionAndContainmentView />)
    const controls = screen
      .getAllByTestId('fl-a5-cell')
      .filter((c) => c.getAttribute('data-kind') === 'control')
    expect(controls.map((c) => `${c.getAttribute('data-row')}.${c.getAttribute('data-column')}`))
      .toEqual([
        'trigger-deterministic-evaluation.WORKER',
        'complete-containment-checklist.WORKER',
      ])
  })

  // FAILS IF: a refused act is drawn as a disabled control. There is no
  // `disabled` member on this surface's affordance and there must be no
  // `aria-disabled` in this panel either — a greyed-out control implies a
  // condition that could become true, and none of these can. Planted: the
  // checklist button given a `disabledReason`. Went red.
  it('draws no disabled control anywhere, in any state', () => {
    const { container } = render(<DetectionAndContainmentView />)
    expect(container.querySelectorAll('[aria-disabled="true"]')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: /Commit 38\.0 Newton metres/ }))
    expect(container.querySelectorAll('[aria-disabled="true"]')).toHaveLength(0)
    expect(container.querySelectorAll('button[disabled]')).toHaveLength(0)
  })

  // FAILS IF: the panel draws the Worker's controls for a column the matrix
  // refuses. The Supervisor has no execution session here, so there is no
  // commit control and a stated line stands where it would have been.
  // Planted: the control drawn whenever the row exists rather than when the
  // fold returns `control`. Went red.
  it('draws no control for a column the matrix refuses, and states why instead', () => {
    render(<DetectionAndContainmentView viewerRole="SUPERVISOR" />)
    expect(screen.queryByRole('button', { name: /Commit/ })).toBeNull()
    const stated = screen.getByTestId('fl-a5-no-trigger-control')
    expect(stated.textContent).toContain('no control is drawn for the Supervisor')
    expect(stated.textContent).toContain('Not applicable — no execution session')
  })

  // FAILS IF: an act the source places on another surface is drawn as a
  // control, or its statement stops naming where it is met. Two rows, two
  // surfaces, and no link for a Worker who cannot open either. Planted: row
  // 5 reclassified `screen` with its metElsewhere nulled. The statement
  // disappeared and this went red at 1 against 2.
  it('states the two acts held on other surfaces, and links to neither', () => {
    render(<DetectionAndContainmentView />)
    const statements = screen.getAllByTestId('fl-cross-surface')
    expect(statements).toHaveLength(2)
    expect(statements[0]?.textContent).toContain('Client Command Center')
    expect(statements[0]?.textContent).toContain('Release a held lot, unit, or run')
    expect(statements[1]?.textContent).toContain('Delivery Operations Hub')
    expect(statements[1]?.textContent).toContain('Configure severity action bundles')
    for (const s of statements) {
      expect(s.getAttribute('data-link-state')).not.toBe('link')
      expect(within(s).queryByRole('link')).toBeNull()
    }
  })

  // FAILS IF: the Quality Manager's cancellation cell stops pointing at the
  // release row and falls back to a bare refusal. Trap 6: placement is not
  // an act any column holds, and release is a row of this matrix. Planted:
  // `routedTo` emptied. Went red.
  it('draws the cancellation cell as a pointer at the release row', () => {
    render(<DetectionAndContainmentView />)
    const cell = screen
      .getAllByTestId('fl-a5-cell')
      .find(
        (c) =>
          c.getAttribute('data-row') === 'prevent-or-cancel-hold' &&
          c.getAttribute('data-column') === 'QUALITY_MANAGER',
      )
    expect(cell?.getAttribute('data-kind')).toBe('routed')
    expect(cell?.textContent).toContain('Release a held lot, unit, or run')
    expect(cell?.textContent).toContain('is released, not cancelled')
  })
})

describe('trap 5 — the sentence with no column', () => {
  // FAILS IF: the no-off-switch sentence exists only inside the Read-only
  // Auditor cell. It is a claim about platform console roles, which have no
  // column here, so it is asserted to appear OUTSIDE any cell element.
  // Planted: the row-level paragraph deleted, leaving the cell's copy. Went
  // red, which is the whole point of the gate.
  it('renders the no-off-switch sentence outside the Auditor cell', () => {
    render(<DetectionAndContainmentView />)
    const outside = screen.getByTestId('fl-a5-no-off-switch')
    expect(outside.textContent).toContain('the deterministic backbone has no off switch')
    expect(outside.closest('[data-testid="fl-a5-cell"]')).toBeNull()
    expect(outside.textContent).toContain('L40920')
    expect(outside.textContent).toContain('FUNC-A5-04-1-2')
  })
})

describe('the containment checklist has no way out', () => {
  // FAILS IF: any control appears that would leave the checklist. Every
  // button on the page is inspected at every one of the three states, not
  // just the first, because a dismiss control added to the completed state
  // would pass a first-render-only check. Planted: a "Dismiss" button added
  // to the in-progress state. Went red at the second state.
  it('offers no dismiss, skip or defer control at any state', () => {
    render(<DetectionAndContainmentView />)
    fireEvent.click(screen.getByRole('button', { name: /Commit 38\.0 Newton metres/ }))
    const forbidden = /dismiss|skip|defer|snooze|later|close|cancel/i
    for (const step of ['Start the first item', 'Complete the last item']) {
      for (const b of screen.getAllByRole('button')) {
        expect(forbidden.test(b.textContent ?? ''), b.textContent ?? '').toBe(false)
      }
      fireEvent.click(screen.getByRole('button', { name: new RegExp(step) }))
    }
    for (const b of screen.getAllByRole('button')) {
      expect(forbidden.test(b.textContent ?? ''), b.textContent ?? '').toBe(false)
    }
    expect(screen.getByTestId('fl-a5-checklist').getAttribute('data-state')).toBe(
      'STATE-A5-COMPLETE',
    )
    expect(screen.getByTestId('fl-a5-checklist-complete').textContent).toContain(
      'until a Quality Manager release command reaches this device and this device applies it',
    )
  })
})

describe('what the panel puts on screen', () => {
  // FAILS IF: a card field is held in data and never drawn. Nineteen
  // fields, counted off the markup. Planted: the card list sliced to the
  // first five. Went red at 5 against 19.
  it('draws every card field, every functionality and every criterion', () => {
    render(<DetectionAndContainmentView />)
    expect(screen.getAllByTestId('fl-a5-card-statement')).toHaveLength(A5_CARD.length)
    expect(screen.getAllByTestId('fl-a5-functionality')).toHaveLength(A5_FUNCTIONALITIES.length)
    expect(screen.getAllByTestId('fl-a5-acceptance')).toHaveLength(
      A5_ACCEPTANCE_CRITERIA.length,
    )
    expect(screen.getAllByTestId('fl-a5-finding')).toHaveLength(2)
    expect(screen.getAllByTestId('fl-a5-never-claimed')).toHaveLength(2)
    expect(screen.getAllByTestId('fl-a5-hold-scope')).toHaveLength(3)
  })

  // FAILS IF: the AC-FL-011-1 gap stops being disclosed on screen. Planted:
  // the findings list removed from the render. Went red.
  it('discloses the functionality that names no fallback pattern', () => {
    render(<DetectionAndContainmentView />)
    const text = pageText()
    expect(text).toContain('a non-configurable invariant has no fallback')
    expect(text).toContain('AC-FL-011-1')
    expect(text).toContain('FUNC-A5-04-1-1')
  })

  // FAILS IF: a decision is disclosed without its alternatives, or without
  // the client-delegated label. Three decisions, and each one must carry
  // both readings and the label. Planted: the readings list removed from
  // the disclosure block. Went red.
  it('discloses three decisions, each with all its readings and the label', () => {
    render(<DetectionAndContainmentView />)
    const blocks = screen.getAllByTestId('fl-a5-disclosure')
    expect(blocks).toHaveLength(3)
    const refs = blocks.map((b) => b.textContent ?? '')
    expect(refs.some((t) => t.includes('DEC-GATE-001'))).toBe(true)
    expect(refs.some((t) => t.includes('DEC-NOSHIFT-001'))).toBe(true)
    expect(refs.some((t) => t.includes('DEC-CLOCKWIN-001'))).toBe(true)
    for (const b of blocks) {
      expect(b.textContent).toContain('All readings stand')
      expect(b.textContent).toContain('A client-delegated choice under APP-012')
      expect(within(b).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
    }
  })

  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking
  // reaches the rendered page in ANY state. AC-FL-000-5 (L39100) and
  // AC-SCR-FL-002 (L48690) bind every state of every screen. Planted: the
  // word "countdown" added to the escalation clause. Went red.
  it('renders no pace, timing, countdown or ranking word in any state', () => {
    const forbidden = /\b(pace|timer|countdown|ranking|leaderboard|productivity)\b/i
    for (const [state, text] of textInEveryState()) {
      expect(forbidden.test(text), state).toBe(false)
    }
  })

  // FAILS IF: the panel ever writes "synced" as a state. L39622 says there
  // is no such state and no bare success.
  //
  // IT WALKS EVERY STATE FOR THE SAME REASON THE UNIT GATE READS EVERY
  // FIELD, and the plant is why: the first version stopped after the commit
  // and missed a "Synced." planted on the completion line, which only
  // exists two clicks later. A gate that reaches fewer states than the
  // panel has is a gate that passes the defect it was written for.
  it('never writes synced as a state, in any state', () => {
    for (const [state, text] of textInEveryState()) {
      expect(text, state).not.toMatch(/\bsynced\b/i)
    }
  })
})
