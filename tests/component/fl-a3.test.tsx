import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RunPlayerSpine, runPlayerPanelA3 } from '@/frontline/modules/fl-a3/RunPlayerPanel'
import { A3_COLUMNS, A3_MATRIX, type A3Column } from '@/frontline/modules/fl-a3/matrix'
import { A3_VIEW_IDS, a3RenderedViews } from '@/frontline/modules/fl-a3/service'
import { RUN_COMPLETION_STATES } from '@/frontline/modules/fl-a3/charter'

/* ==================================================================== *
 * `MOD-FL-A3` — WHAT THE PANEL ACTUALLY DRAWS.
 *
 * The unit suite proves the transcription; this one proves it REACHES THE
 * SCREEN. A claim held in data and never rendered is a code comment, and a
 * code comment is not a disclosure — so the gates below walk the rendered
 * markup rather than the arrays behind it.
 * ==================================================================== */

const SOURCE_LINES = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

/** The categorical absence, as a predicate over rendered text. */
const EXCLUDED = /\b(pace|timer|countdown|ranking|productivity)\b/i

/**
 * THE RENDERED TEXT, WITH ITS WORD BOUNDARIES INTACT — AND THIS IS NOT
 * FUSSINESS, IT IS THE DIFFERENCE BETWEEN A GATE AND A GATE THAT CANNOT FAIL.
 *
 * `textContent` concatenates adjacent elements with NO separator, so a word at
 * the end of one element is glued to the first character of the next:
 * `<li>…a timer</li><li>STATE-A3-REVIEW…</li>` reads back as `a timerSTATE-A3-
 * REVIEW`. There is no word boundary after `timer` in that string, so
 * `/\btimer\b/` does not match and a sweep built on `container.textContent`
 * reports clean over a screen that is printing the excluded word.
 *
 * That is not hypothetical here: the first version of this file swept
 * `textContent`, the excluded word was planted in a rendered string to watch
 * the gate go red, and the gate stayed green. Walking the text NODES and
 * joining them with a newline restores the boundaries the markup already had.
 * Any later sweep of the built tree needs the same treatment, or a substring
 * match with no `\b` at all.
 */
function renderedText(root: HTMLElement): string {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const parts: string[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    parts.push(node.textContent ?? '')
  }
  return parts.join('\n')
}

function renderColumn(column: A3Column): HTMLElement {
  const { container } = render(<RunPlayerSpine column={column} />)
  return container
}

function controlsIn(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll('[data-testid="fl-a3-control"]')].map(
    (el) => el.textContent ?? '',
  )
}

describe('the panel draws every row through the affordance fold', () => {
  // FAILS IF: a row stops rendering. Ten rows, and each is found by its own id
  // rather than by counting, so a dropped row names itself.
  it('renders all ten matrix rows, each with all five cells beside it', () => {
    const container = renderColumn('worker')
    const rows = [...container.querySelectorAll('[data-testid="fl-a3-matrix-row"]')]
    expect(rows).toHaveLength(10)
    expect(rows.map((r) => r.getAttribute('data-row'))).toEqual(A3_MATRIX.map((r) => r.id))
    expect(container.querySelectorAll('[data-testid="fl-a3-cell"]')).toHaveLength(50)
  })

  // THE TOKEN STILL RENDERS. Wave 0's rule is that a cell whose act is
  // elsewhere goes on saying `Allowed` with its own words; only the CONTROL is
  // refused. All fifty notes must be in the document, including the two that
  // read `Allowed` on the invariant-excluded row.
  //
  // FAILS IF: a note is corrected, downgraded or hidden to make the screen
  // tidier.
  it('shows all fifty cell notes verbatim, including the two Allowed cells of row 10', () => {
    const container = renderColumn('worker')
    const text = container.textContent ?? ''
    for (const row of A3_MATRIX) {
      for (const column of A3_COLUMNS) {
        expect(text, `${row.id}/${column}`).toContain(row.cells[column].note)
      }
    }
    expect(text).toContain('Allowed — in the Delivery Operations Hub, not here')
  })

  // FAILS IF: the Worker loses a control or gains one. Four of the ten rows
  // are the Worker's own acts on this screen.
  it('draws exactly the Worker’s four controls', () => {
    const drawn = controlsIn(renderColumn('worker'))
    expect(drawn).toEqual([
      'Advance through the authored sequence',
      'Edit a value before commit',
      'Append a correction to a committed value',
      'Declare worker-finished',
    ])
  })

  // THE INVERSE TRAP, ON SCREEN. Applying "Supervisor permissive means
  // elsewhere" uniformly would render nothing here, deleting the one
  // non-Worker control this module owns.
  //
  // FAILS IF: the sign-off control disappears, or a second one appears beside
  // it from row 10's two `Allowed` cells.
  it('draws exactly one control for the Supervisor, and it is the sign-off', () => {
    for (const column of ['supervisor', 'qualityManager'] as const) {
      expect(controlsIn(renderColumn(column)), column).toEqual([
        'Authorise an authored sign-off screen',
      ])
    }
  })

  // FAILS IF: a control is drawn for a column that holds no session at all.
  it('draws no control for the Tenant Admin or the Read-only Auditor', () => {
    expect(controlsIn(renderColumn('tenantAdmin'))).toEqual([])
    expect(controlsIn(renderColumn('readonlyAuditor'))).toEqual([])
  })

  // FAILS IF: an act the Delivery Operations Hub owns renders as anything but
  // a statement. Two rows, both classified away from this screen, and both
  // must draw a cross-surface note and no control on every column.
  it('states the two off-surface rows and draws no control on either, for every column', () => {
    for (const column of A3_COLUMNS) {
      const container = renderColumn(column)
      const notes = [...container.querySelectorAll('[data-testid="fl-cross-surface"]')]
      expect(notes.length, column).toBe(2)
      const text = container.textContent ?? ''
      expect(text, column).toContain('Held on another surface')
      expect(text, column).toContain('EXCL-FL-06')
    }
  })

  // FAILS IF: "alter in place" renders as a dead end for the Worker. The route
  // out is the next row of this same matrix and it must be named.
  it('points the Worker from “alter in place” at the append-only correction', () => {
    const container = renderColumn('worker')
    const routed = container.querySelector('[data-testid="fl-a3-routed"]')
    expect(routed).not.toBeNull()
    expect(routed?.textContent ?? '').toContain('Append a correction to a committed value')
  })

  // FAILS IF: the two open Tenant Admin cells render as refusals with nothing
  // said. AC-FL-009-5 (L39948) forbids resolving the question in either
  // direction, and a silent refusal resolves it in one.
  it('discloses the open question on both Tenant Admin cells rather than refusing quietly', () => {
    const container = renderColumn('tenantAdmin')
    const open = [...container.querySelectorAll('[data-outcome="clientDecisionRequired"]')]
    expect(open).toHaveLength(2)
    for (const el of open) {
      expect(el.textContent ?? '').toContain('AC-FL-009-5')
      expect(el.textContent ?? '').toContain('does not answer it in either direction')
    }
  })
})

describe('the finish declaration names only what the device holds', () => {
  // FAILS IF: the completion screen claims a platform record. Four states,
  // one device-held, and the screen may name only that one as its own.
  it('names worker-finished as this device’s state and the other three as the platform’s', () => {
    renderColumn('worker')
    const line = screen.getByTestId('fl-a3-completion-line').textContent ?? ''
    expect(line).toContain('worker-finished')
    expect(line).not.toContain('Run complete')
    expect(line).toContain('run-record states the platform sets')

    const listed = [...document.querySelectorAll('[data-testid="fl-a3-completion-state"]')]
    expect(listed).toHaveLength(4)
    expect(listed.map((el) => el.getAttribute('data-held-by'))).toEqual(
      RUN_COMPLETION_STATES.map((s) => s.heldBy),
    )
    expect(listed.filter((el) => el.getAttribute('data-held-by') === 'device')).toHaveLength(1)
  })

  // FAILS IF: the queued capture is rendered as a bare success. L39622 says
  // there is no state called "synced"; TEST-SCR-FL-003 (L48700) says the label
  // must be one of the ladder's own and never a bare success.
  it('renders the queued capture in its true state and never as synced', () => {
    renderColumn('worker')
    const queued = screen.getByTestId('fl-a3-queued-line').textContent ?? ''
    expect(queued).toContain('Queued in the durable upload queue')
    expect(queued).toContain('The platform does not hold this record yet')
    expect(queued.toLowerCase()).not.toContain('synced')
  })

  // FAILS IF: the two non-device steps of the forward drive are rendered as
  // things this device does.
  it('marks the two steps of the sequence that are not device events', () => {
    const container = renderColumn('worker')
    const steps = [...container.querySelectorAll('[data-testid="fl-a3-sequence-step"]')]
    expect(steps).toHaveLength(13)
    const notDevice = steps.filter((s) => s.getAttribute('data-actor') !== 'device')
    expect(notDevice).toHaveLength(2)
    for (const s of notDevice) expect(s.textContent ?? '').toContain('Not a device event')
  })
})

describe('the decisions this panel discloses', () => {
  // FAILS IF: a difficulty substitution goes silent. DEC-WIDIFF-001 is why it
  // can happen at all and L40622 requires it to be recorded.
  it('renders a substitution notice naming both levels, never a silent downgrade', () => {
    renderColumn('worker')
    const notice = screen.getByTestId('fl-a3-substitution-notice').textContent ?? ''
    expect(notice).toContain('expanded')
    expect(notice).toContain('standard')
    expect(notice).toContain('the substitution is recorded')
    expect(notice).toContain('DEC-WIDIFF-001')
  })

  // FAILS IF: a decision is settled on screen instead of disclosed. The
  // canon's renderer is the only place an open decision renders, and it always
  // carries every reading and labels the build's pick a delegated choice.
  it('renders DEC-WIDIFF-001 and DEC-CAP-001 through the canon’s own renderer', () => {
    const container = renderColumn('worker')
    for (const id of ['DEC-WIDIFF-001', 'DEC-CAP-001']) {
      expect(screen.getByRole('note', { name: `Open decision ${id}` })).toBeDefined()
    }
    const text = container.textContent ?? ''
    expect(text).toContain('All readings stand. None is this build’s to settle.')
    expect(text).toContain('A client-delegated choice under APP-012')
  })

  // FAILS IF: DEC-PKGFIELD-001 is rendered as though it had a canon record, or
  // dropped because it has none. The source names the gap and gives no reading
  // on either side; this build's canon holds no record for it and this module
  // does not own that file, so it is disclosed as a stated gap with its own
  // locators.
  it('discloses DEC-PKGFIELD-001 as a stated gap, with its four locators', () => {
    renderColumn('worker')
    const gap = screen.getByTestId('fl-a3-pkgfield').textContent ?? ''
    expect(gap).toContain('DEC-PKGFIELD-001')
    expect(gap).toContain('gives no reading on either side')
    for (const l of ['L39889', 'L39960', 'L41162', 'L41276']) expect(gap).toContain(l)
  })

  // FAILS IF: the three fallback readings are reconciled on screen.
  it('renders all three readings of this module’s fallback patterns', () => {
    renderColumn('worker')
    const readings = [...document.querySelectorAll('[data-testid="fl-a3-fallback-reading"]')]
    expect(readings).toHaveLength(3)
    const divergence = screen.getByTestId('fl-a3-fallback-divergence').textContent ?? ''
    expect(divergence).toContain('no two of them agree')
    const missing = screen.getByTestId('fl-a3-functionalities-without-pattern').textContent ?? ''
    expect(missing).toContain('FUNC-A3-03-3-1')
    expect(missing).toContain('FUNC-A3-06-1-1')
  })

  // FAILS IF: the two untranscribable rows are dropped rather than disclosed.
  // Both must be on screen, named, located, and carrying their reason.
  it('lists the criterion and the functionality it will not quote, with the reason', () => {
    const container = renderColumn('worker')
    const text = container.textContent ?? ''
    expect(text).toContain('AC-A3-8')
    expect(text).toContain('L40680')
    expect(text).toContain('FUNC-A3-06-1-1')
    expect(text).toContain('L40633')
    expect(text).toContain('enumerates each excluded display by name')
  })
})

describe('the categorical absence, over the rendered markup', () => {
  // THE GATE THE WAVE-3 SWEEP WILL RUN, RUN HERE FIRST. Every column is
  // rendered and the whole text of each is swept.
  //
  // FAILS IF: an excluded word reaches any state of this panel.
  it('renders no excluded word, on any of the five columns', () => {
    for (const column of A3_COLUMNS) {
      const hit = renderedText(renderColumn(column)).match(EXCLUDED)
      expect(hit === null, `${column} rendered "${hit?.[0] ?? ''}"`).toBe(true)
    }
  })

  // THE SAME SWEEP, WATCHED GOING RED, TWICE OVER.
  //
  // First: the source's own AC-A3-8 wording rendered into a throwaway tree —
  // the identical predicate must catch it, or the gate above is a regular
  // expression nobody has ever seen match.
  //
  // Second, and this is the one that matters: the excluded word planted at the
  // END of an element, with a sibling after it. That is the shape that
  // defeated `textContent` and the reason `renderedText` exists. The assertion
  // holds BOTH results, so a later simplification back to `textContent` turns
  // this red instead of quietly disarming the sweep.
  it('catches the excluded wording, including where an element boundary hides it', () => {
    const planted = SOURCE_LINES[40680 - 1]
    expect(planted).toBeDefined()
    const plain = render(<p>{planted}</p>)
    expect(EXCLUDED.test(renderedText(plain.container))).toBe(true)

    const glued = render(
      <ul>
        <li>a step screen is presented, with a timer</li>
        <li>STATE-A3-REVIEW a prior screen is open read-only</li>
      </ul>,
    )
    expect(EXCLUDED.test(renderedText(glued.container))).toBe(true)
    // The concatenation this walker exists to defeat, shown rather than
    // described: no boundary follows the word, so the same predicate misses it.
    expect(EXCLUDED.test(glued.container.textContent ?? '')).toBe(false)
  })
})

describe('the value the controller mounts', () => {
  // FAILS IF: this module claims another module's id, or claims a §22.7 row it
  // does not render. `rendersViews` carries NAMES: `SCR-FL-*` identifiers name
  // two different screens across the source's two registers, so an identifier
  // used as a key would be wrong for one of the two readings, silently.
  it('is a RunPlayerPanel for MOD-FL-A3 naming its six views by name', () => {
    const panel = runPlayerPanelA3()
    expect(panel.module).toBe('MOD-FL-A3')
    expect(panel.heading).toBe('Run Player — the execution spine')
    expect(panel.rendersViews).toEqual(a3RenderedViews().map((v) => v.name))
    // Five, not six: section 22.7's Module column gives SCR-FL-17 to
    // MOD-FL-B10. The unit suite reads that column out of the frozen source.
    expect(panel.rendersViews).toHaveLength(5)
    for (const id of A3_VIEW_IDS) {
      expect(panel.rendersViews.some((n) => n.includes(id))).toBe(false)
    }
  })

  // FAILS IF: the mounting value's body does not render. A panel that type-
  // checks and draws nothing is the failure this catches.
  it('renders its body, and defaults to the Worker column', () => {
    const { container } = render(<>{runPlayerPanelA3().body}</>)
    expect(container.querySelector('[data-testid="fl-a3-panel"]')?.getAttribute('data-column')).toBe(
      'worker',
    )
    expect(controlsIn(container)).toHaveLength(4)
  })
})
