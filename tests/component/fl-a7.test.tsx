import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { A7ProfileLiteView } from '@/frontline/modules/fl-a7/ProfileLiteView'
import {
  A7_COLUMNS,
  A7_ROWS,
  a7RowById,
  type A7Column,
} from '@/frontline/modules/fl-a7/matrix'
import {
  A7_DISCLOSURES,
  A7_SUSPENSION_STATES,
} from '@/frontline/modules/fl-a7/service'

/**
 * `MOD-FL-A7` on `SCR-FL-06` Profile-lite, RENDERED, against the frozen
 * source.
 *
 * WHY THE SOURCE IS READ HERE TOO. The unit suite proves the transcription
 * matches the file; this one proves the RENDER matches the source. Between
 * the two there is no gap a correct data table can hide a wrong screen in,
 * and neither suite can pass by agreeing with the other — both compare
 * against L41295-L41305 parsed at run time.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const sourceLines = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const L = (n: number): string => {
  const line = sourceLines[n - 1]
  if (line === undefined) throw new Error(`frozen source has no line ${n}`)
  return line
}
const cellsOf = (n: number): string[] =>
  L(n)
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim().replace(/`/g, ''))

function at<T>(xs: readonly T[], i: number, what: string): T {
  const v = xs[i]
  if (v === undefined) throw new Error(`${what}: nothing at index ${i}`)
  return v
}

/**
 * Anything a person could act through, not `<button>` alone. A DISABLED
 * control counts: `FrontlineAffordance` has no `disabled` member precisely
 * so no task can reach for one, and a sweep that only looked for enabled
 * buttons would not notice one arriving.
 */
const AFFORDANCES = 'button, input, select, textarea, [role="button"], [contenteditable="true"]'

function rowNode(row: string): HTMLElement {
  const found = Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="fl-a7-matrix-row"]'),
  ).find((n) => n.dataset.row === row)
  if (found === undefined) throw new Error(`no rendered matrix row: ${row}`)
  return found
}

/**
 * THE TEXT OF A NODE AND EVERY DESCENDANT, WITH THE ELEMENT BOUNDARIES
 * REPLACED BY SPACES.
 *
 * `textContent` CONCATENATES ACROSS ELEMENTS AND THAT DEFEATED A WAVE 1
 * GATE. Two adjacent spans reading "no" and "dismiss" produce the string
 * "nodismiss", so a word sweep over `textContent` misses a word that is
 * plainly on the screen, and a phrase sweep matches a phrase that is not.
 * Walking the text nodes and joining on a space is what makes a word sweep
 * mean what it says.
 */
function words(node: HTMLElement): string {
  const parts: string[] = []
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
  let n = walker.nextNode()
  while (n !== null) {
    parts.push(n.textContent ?? '')
    n = walker.nextNode()
  }
  return (
    parts
      .join(' ')
      .replace(/\s+/g, ' ')
      // Joining on a space puts one in front of any punctuation that began
      // its own text node — `Met on {name}, not on this screen` renders as
      // three nodes and comes back "Met on Run Player , not on this screen".
      // Closing that gap cannot re-join two words, so the property the join
      // exists for is untouched.
      .replace(/ +([:;,.])/g, '$1')
      .trim()
  )
}

/* ==================================================================== *
 * ALL NINE ROWS, ALL SIX COLUMNS.
 * ==================================================================== */

describe('SCR-FL-06 Profile-lite — the nine rows, for every persona column', () => {
  // FAILS IF: a row is dropped from the render, or the sixth column is not
  // renderable. All nine render for each of the SIX columns — a view that
  // showed only the rows it owns would be a matrix with rows missing and no
  // way for a reader to tell that from a row nobody transcribed.
  //
  // Planted: the row list sliced to eight in MatrixSection. Went red naming
  // the column it was rendering.
  it('renders all nine rows, in the source’s order, for each of the six columns', () => {
    expect(A7_COLUMNS).toHaveLength(6)
    for (const column of A7_COLUMNS) {
      const { unmount } = render(<A7ProfileLiteView column={column} />)
      const rows = screen.getAllByTestId('fl-a7-matrix-row')
      expect(rows, column).toHaveLength(9)
      expect(
        rows.map((r) => r.dataset.row),
        column,
      ).toEqual(A7_ROWS.map((r) => r.id))
      unmount()
    }
  })

  // FAILS IF: a cell is paraphrased on the way to the screen. The expected
  // string is PARSED from the source row, not taken from the transcription,
  // so a wrong transcription rendered faithfully still fails here.
  //
  // Planted: `{cell.note}` replaced with `{cell.outcome}` in MatrixSection.
  // Went red on the first row of the first column.
  it('prints every cell’s own words, parsed from the source, in every column', () => {
    let checked = 0
    for (const column of A7_COLUMNS) {
      const { unmount } = render(<A7ProfileLiteView column={column} />)
      for (const [i, row] of A7_ROWS.entries()) {
        const expected = at(cellsOf(41297 + i), A7_COLUMNS.indexOf(column) + 1, row.id)
        const printed = words(rowNode(row.id))
        expect(printed, `${row.id}.${column}`).toContain(expected)
        checked += 1
      }
      unmount()
    }
    expect(checked).toBe(54)
  })

  // FAILS IF: a source line stops being shown beside the cell it belongs to.
  // A citation a reader cannot open is the defect this build has recorded
  // most often, so the line is on the screen and not only in the data.
  it('shows each row’s own line beside it', () => {
    render(<A7ProfileLiteView column="Worker" />)
    for (const row of A7_ROWS) {
      expect(words(rowNode(row.id)), row.id).toContain(row.sourceRef)
    }
  })
})

/* ==================================================================== *
 * NOT ONE CONTROL, IN ANY COLUMN.
 * ==================================================================== */

describe('what this screen never draws', () => {
  // FAILS IF: any interactive affordance appears anywhere in a rendered
  // matrix row, in any of the six columns. Not one row of this matrix draws
  // a control on this destination, and the sweep is over the WHOLE row
  // subtree rather than over the `control` branch — a disabled button added
  // to a refusal block would be found.
  //
  // Planted: a `<Button disabled>` added to the refusal branch. Went red
  // naming the row and the column. Planted again on the cross-surface
  // branch. Went red there too.
  it('draws no control, enabled or disabled, in any row of any column', () => {
    for (const column of A7_COLUMNS) {
      const { unmount } = render(<A7ProfileLiteView column={column} />)
      for (const row of A7_ROWS) {
        const found = rowNode(row.id).querySelectorAll(AFFORDANCES)
        expect(
          Array.from(found).map((f) => f.outerHTML.slice(0, 80)),
          `${row.id}.${column}`,
        ).toEqual([])
      }
      unmount()
    }
  })

  // FAILS IF: the sweep above is passing because the selector never matches.
  // The same selector is run over a node that DOES hold a control, so the
  // gate is proved able to see one rather than assumed to be.
  it('the control sweep can see a control', () => {
    const host = document.createElement('div')
    host.innerHTML = '<div><span>x</span><button type="button">Dismiss</button></div>'
    document.body.appendChild(host)
    expect(host.querySelectorAll(AFFORDANCES)).toHaveLength(1)
    host.remove()
  })

  // FAILS IF: `words()` stops being what the word sweeps read.
  //
  // WAVE 1 SHIPPED A `textContent` WORD SWEEP THAT COULD NOT FAIL, DEFEATED
  // BY ELEMENT CONCATENATION, and this is that failure reproduced on demand
  // so the fix is a demonstrated property rather than a claim in a comment.
  // Two adjacent spans reading "no" and "dismiss" give `textContent` the
  // string "nodismiss" — a phrase sweep for "no dismiss" misses a phrase
  // that is plainly on the screen, and a word sweep for "dismiss" misses the
  // word. Walking the text nodes and joining on a space is what fixes it.
  it('reads across element boundaries, which textContent does not', () => {
    const host = document.createElement('div')
    host.innerHTML = '<p><span>no</span><span>dismiss</span></p>'
    document.body.appendChild(host)
    expect(host.textContent).toBe('nodismiss')
    expect(host.textContent).not.toContain('no dismiss')
    expect(words(host)).toBe('no dismiss')
    expect(words(host)).toContain('no dismiss')
    host.remove()
  })

  // FAILS IF: a dismiss affordance for the compliance lock reaches any
  // column, by any name. TEST-A7-4 (L41438) is the source's own test for
  // it, and SB-FL-016 (L41412) says "no dismiss".
  //
  // THE WORD SWEEP RUNS OVER `words()`, NOT `textContent`, AND THAT IS WHY
  // IT WORKS. A wave 1 gate of this shape was defeated by element
  // concatenation — "no" and "dismiss" in adjacent spans read as
  // "nodismiss". Planted exactly that here as two spans; the textContent
  // version passed, this one went red.
  it('offers no dismissal of the compliance lock, for any persona', () => {
    for (const column of A7_COLUMNS) {
      const { unmount } = render(<A7ProfileLiteView column={column} />)
      const row = rowNode('dismiss-compliance-lock')
      expect(row.querySelectorAll(AFFORDANCES), column).toHaveLength(0)
      expect(row.dataset.outcome, column).toBe('explicitlyProhibited')
      expect(words(row), column).toContain('no control is drawn here')
      const lock = screen.getByTestId('fl-a7-no-dismiss')
      expect(words(lock), column).toContain('no control anywhere in this module that lifts the lock')
      expect(screen.getByTestId('fl-a7-compliance-lock').querySelectorAll(AFFORDANCES)).toHaveLength(
        0,
      )
      unmount()
    }
  })

  // FAILS IF: a pace figure, timing widget, countdown or ranking word
  // reaches the rendered screen in any column. AC-FL-000-5 (L39100),
  // TEST-FL-000-3 (L39108), AC-SCR-FL-002 (L48690), AC-SCOPE-045 (L2683).
  // The unit suite sweeps the DATA; this sweeps the SCREEN, because a word
  // can reach one without the other.
  it('renders no pace, timing, countdown or ranking word, in any column', () => {
    const FORBIDDEN = /\b(pace|timer|countdown|ranking|leaderboard|productivity)\b/i
    for (const column of A7_COLUMNS) {
      const { unmount } = render(<A7ProfileLiteView column={column} />)
      const text = words(screen.getByTestId('fl-a7-profile-lite'))
      expect(text.length, column).toBeGreaterThan(3000)
      expect(FORBIDDEN.test(text), `${column}: ${text.match(FORBIDDEN)?.[0] ?? ''}`).toBe(false)
      expect(text, column).not.toMatch(/\bsynced\b/i)
      unmount()
    }
    // Proved able to see one, on the same predicate.
    expect(FORBIDDEN.test('a b timer c')).toBe(true)
  })

  // FAILS IF: the build-plan grade reaches the screen. `C1` is a re-plan
  // rigour grade and not a source value; the source's own Band column for
  // this module reads `A` at L39852 and is not this module's to restate.
  it('prints neither the build-plan grade nor the source’s Band value', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const text = words(screen.getByTestId('fl-a7-profile-lite'))
    expect(text).not.toMatch(/\bC1\b/)
    expect(text).not.toMatch(/\bC2\b/)
    expect(at(cellsOf(39852), 2, 'band')).toBe('A')
  })
})

/* ==================================================================== *
 * THE ROWS THAT ARE MET SOMEWHERE ELSE.
 * ==================================================================== */

describe('the rows this screen does not own', () => {
  // FAILS IF: a row met on another surface renders as anything but a
  // statement, or a row met on another destination renders as a surface
  // crossing. L1598 and AC-PROD-040 (L1614) cap the platform at five
  // surfaces; a cross-surface statement over a Frontline destination would
  // claim a sixth.
  //
  // Planted: row 9's affordance forced to cross-surface. Went red — the
  // named-place node was absent and the cross-surface node appeared on a row
  // that names a destination of this same surface.
  it('states the four elsewhere-acts and names the one other destination', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const crossSurface = ['wipe-or-deauthorise', 'soft-or-hard-suspension', 'compliance-suspension']
    for (const id of crossSurface) {
      expect(rowNode(id).dataset.affordance, id).toBe('cross-surface')
      expect(rowNode(id).querySelector('[data-testid="fl-cross-surface"]'), id).not.toBeNull()
    }
    // Row 3 is also cross-surface, and its STATEMENT is MOD-FL-A1's — see
    // the deferral gate below. The affordance is unchanged.
    expect(rowNode('pin-reset').dataset.affordance).toBe('cross-surface')

    const named = rowNode('complete-in-flight-run')
    expect(named.dataset.affordance).toBe('named-place')
    expect(named.querySelector('[data-testid="fl-named-place"]')).not.toBeNull()
    expect(named.querySelector('[data-testid="fl-cross-surface"]')).toBeNull()
    expect(words(named)).toContain('Met on Run Player, not on this screen')
  })

  // FAILS IF: row 9's sentence is trimmed on the way to the screen. It is
  // the most consequential in the matrix: hard suspension is not a stop for
  // work already running. Parsed from L41305 rather than restated.
  it('renders row 9’s five verbs verbatim, from L41305', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const printed = words(rowNode('complete-in-flight-run'))
    expect(printed).toContain(at(cellsOf(41305), 1, 'worker cell'))
    for (const verb of ['complete', 'capture', 'sync', 'compute summaries', 'close']) {
      expect(printed, verb).toContain(verb)
    }
    expect(printed).toContain('no new Runs start')
  })

  // FAILS IF: the four prohibited-everywhere rows stop being stated where
  // they are attempted and start pointing somewhere. Every one of them is
  // refused on every destination alike; a pointer would say the act is met
  // somewhere it is not.
  it('states the four prohibited-everywhere rows here rather than pointing away', () => {
    render(<A7ProfileLiteView column="Worker" />)
    for (const id of [
      'read-store-outside',
      'export-media',
      'dismiss-compliance-lock',
      'capture-under-compliance-stop',
    ]) {
      const node = rowNode(id)
      expect(node.dataset.affordance, id).toBe('refusal')
      expect(node.dataset.rowSurface, id).toBe('screen')
      expect(node.querySelector('[data-testid="fl-cross-surface"]'), id).toBeNull()
      expect(node.querySelector('[data-testid="fl-named-place"]'), id).toBeNull()
    }
  })
})

/* ==================================================================== *
 * ROW 3 IS STATED ONCE ON THIS SCREEN, BY MOD-FL-A1.
 * ==================================================================== */

describe('row 3, which MOD-FL-A1 also carries on this destination', () => {
  // FAILS IF: this module draws a SECOND cross-surface statement for the
  // Personal-Identification-Number reset. §25.5 mounts MOD-FL-A1 and
  // MOD-FL-A7 on this destination both (L48534) and MOD-FL-A1 already
  // states the act there; two statements of one act on one screen is one
  // screen saying a thing twice.
  //
  // Planted: `DeferredToNeighbour` swapped back for `ControlOrLine` on that
  // row. Went red — the cross-surface node appeared.
  it('defers the statement and draws no second cross-surface block', () => {
    for (const column of A7_COLUMNS) {
      const { unmount } = render(<A7ProfileLiteView column={column} />)
      const node = rowNode('pin-reset')
      expect(node.querySelector('[data-testid="fl-cross-surface"]'), column).toBeNull()
      const deferred = node.querySelector<HTMLElement>('[data-testid="fl-a7-deferred-statement"]')
      expect(deferred, column).not.toBeNull()
      expect(deferred?.dataset.defersTo, column).toBe('MOD-FL-A1')
      // And no other row defers: the deferral is one row's, not a habit.
      expect(screen.getAllByTestId('fl-a7-deferred-statement'), column).toHaveLength(1)
      unmount()
    }
  })

  // FAILS IF: the sixth-column reading is lost with the statement. It is the
  // one thing MOD-FL-A1's five-column matrix cannot hold, and it is the
  // reason deferring the STATEMENT must not defer the CELL.
  it('still prints the Platform-roles cell MOD-FL-A1 cannot hold', () => {
    render(<A7ProfileLiteView column="Platform roles" />)
    const printed = words(rowNode('pin-reset'))
    expect(printed).toContain(at(cellsOf(41299), 6, 'platform cell'))
    expect(printed).toContain('tenant credential administration is a tenant action')
    expect(cellsOf(40194)).toHaveLength(6)
    expect(cellsOf(41299)).toHaveLength(7)
  })

  // FAILS IF: the wording divergence between L40194 and L41299 stops being
  // shown. Two transcriptions of one act that are not the same text is a
  // finding, and a finding nobody can read is not disclosed.
  it('shows that the two transcriptions are not the same text', () => {
    render(<A7ProfileLiteView column="Supervisor" />)
    const shown = words(screen.getByTestId('fl-a7-row3-divergence'))
    const a1 = at(cellsOf(40194), 2, 'a1 supervisor')
    const a7 = at(cellsOf(41299), 2, 'a7 supervisor')
    expect(a1).not.toBe(a7)
    expect(shown).toContain(a1.slice(a7.length).replace(/^, /, ''))
    expect(shown).toMatch(/\bdiffers?\b/i)
    expect(shown).not.toMatch(/\bagree/i)
  })
})

/* ==================================================================== *
 * THE ONE OPEN DECISION IN THE MATRIX, AND THE SIX DISCLOSED BESIDE IT.
 * ==================================================================== */

describe('the decisions this screen discloses', () => {
  // FAILS IF: row 4's Tenant Admin cell is rendered as the device-session
  // question, or the two are shown without being told apart. It is the only
  // Client Decision Required cell in the slice that argues its own
  // reasoning, and the argument is what makes it a second question.
  //
  // Planted: the `distinctFrom` line removed from the render. Went red.
  it('tells row 4’s wipe-authority question apart from the device-session one', () => {
    render(<A7ProfileLiteView column="Tenant Admin" />)
    const node = rowNode('wipe-or-deauthorise')
    expect(node.dataset.outcome).toBe('clientDecisionRequired')
    const open = screen.getByTestId('fl-a7-open-decision')
    expect(open.dataset.decision).toBe('Tenant Admin wipe authority')
    const shown = words(open)
    expect(shown).toContain('critical class')
    expect(shown).toContain('AC-FL-009-5')
    expect(shown).toMatch(/device-session question/i)
    // It renders on the Tenant Admin column and on no other, because that is
    // the only column whose cell carries it.
    const { unmount } = render(<A7ProfileLiteView column="Worker" />)
    void unmount
    expect(screen.queryAllByTestId('fl-a7-open-decision')).toHaveLength(1)
  })

  // FAILS IF: a disclosed decision loses a reading, an adopted position, or
  // the note declaring the canon gap. All six render, each with every
  // reading and its own locator, and each labelled a client-delegated
  // choice.
  //
  // Planted: the readings list dropped from the render. Went red on the
  // first decision.
  it('renders all six with every reading, its locator, and the canon gap', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const nodes = screen.getAllByTestId('fl-a7-decision')
    expect(nodes).toHaveLength(6)
    expect(nodes.map((n) => n.dataset.decision)).toEqual(
      A7_DISCLOSURES.map((d) => d.decisionRef),
    )
    for (const [i, d] of A7_DISCLOSURES.entries()) {
      const shown = words(at(nodes, i, d.decisionRef))
      expect(shown, d.decisionRef).toContain(d.decisionRef)
      for (const r of d.readings) {
        expect(shown, `${d.decisionRef} reading`).toContain(r.text)
        expect(shown, `${d.decisionRef} locator`).toContain(r.locator)
      }
      expect(shown, d.decisionRef).toContain(d.adopted)
      expect(shown, d.decisionRef).toContain('client-delegated choice')
      expect(shown, d.decisionRef).toContain('DecisionId')
    }
  })

  // FAILS IF: both wordings of the fixed compliance message stop standing
  // together on the screen, or either is rendered AS the message. Parsed
  // from L5265 and L5266; TEST-SCR-FL-006 (L48703) requires both preserved.
  //
  // Planted: Reading B dropped from the rendered readings. Went red.
  it('shows both wordings of the fixed message, and neither as the message', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const readingA = L(5265).replace(/`/g, '').replace(/^.*?: "/, '').replace(/"$/, '')
    const readingB = L(5266).replace(/`/g, '').replace(/^.*?: "/, '').replace(/"$/, '')
    const msg = screen
      .getAllByTestId('fl-a7-decision')
      .find((n) => n.dataset.decision === 'DEC-MSG-001')
    expect(msg).toBeDefined()
    const shown = words(msg as HTMLElement)
    expect(shown).toContain(readingA)
    expect(shown).toContain(readingB)
    // The lock block describes the lock and prints NEITHER wording, because
    // Profile-lite is not the lock screen.
    const lock = words(screen.getByTestId('fl-a7-compliance-lock'))
    expect(lock).not.toContain(readingA)
    expect(lock).not.toContain(readingB)
  })

  // FAILS IF: DEC-SUSP-001 renders a payment path. §4.2.1 and §8.12 state
  // there is no payment integration, and the adopted position is release by
  // an explicit operator signal with no payment event observed.
  it('renders no payment path for the soft-suspension exit', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const soft = screen
      .getAllByTestId('fl-a7-suspension-state')
      .find((n) => n.dataset.state === 'STATE-A7-SOFTSUSP')
    expect(soft).toBeDefined()
    const shown = words(soft as HTMLElement)
    expect(shown).toContain('explicit operator signal')
    expect(shown).not.toMatch(/automatic(ally)? on payment/i)
    expect(shown).toContain('no payment event observed')
  })

  // FAILS IF: the command-class finding stops naming the identifier the
  // source raises. Recorded, not fixed — @/frontline/commands is wave 0's
  // file and not this module's to edit.
  it('shows the command-class gap under DEC-CMDCLASS-001', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const node = screen.getByTestId('fl-a7-command-class-finding')
    expect(node.dataset.decision).toBe('DEC-CMDCLASS-001')
    const shown = words(node)
    expect(shown).toContain('DEC-CMDCLASS-001')
    expect(shown).toContain('L51551')
    expect(L(51551)).toContain('DEC-CMDCLASS-001')
  })
})

/* ==================================================================== *
 * THE THREE SUSPENSION STATES, AND THE OFFLINE CLAIM.
 * ==================================================================== */

describe('what this screen says about suspension and about being offline', () => {
  // FAILS IF: the three states are collapsed on screen, or one is dropped.
  // L41410 says they are genuinely different on the device.
  it('renders three distinct suspension states', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const nodes = screen.getAllByTestId('fl-a7-suspension-state')
    expect(nodes).toHaveLength(3)
    expect(nodes.map((n) => n.dataset.state)).toEqual(
      A7_SUSPENSION_STATES.map((s) => s.stateId),
    )
    const texts = nodes.map((n) => words(n))
    expect(new Set(texts).size).toBe(3)
  })

  // FAILS IF: the screen implies a security command could reach a dark
  // device, or gates the deterministic safety layer behind connectivity.
  // L41323 forbids the first; L40948 forbids the second, and reading either
  // as the other is the inversion AC-FL-000-4 (L39099) exists to prevent.
  //
  // Planted: the offline claim removed from the render. Went red.
  it('states that no security command arrives offline, and that the safety layer does not change', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const shown = words(screen.getByTestId('fl-a7-offline'))
    expect(shown).toContain('no surface may imply otherwise')
    expect(shown).toContain('last known state')
    expect(shown).toContain('identical offline')
    // Wave 0's own safety-layer sentence, on the screen rather than only in
    // the table it comes from.
    expect(shown).toContain('protected from the moment of the breach')
  })

  // FAILS IF: AC-FL-011-1's answer is not shown, or the three fallback
  // readings stop standing together. This module has no gap, and the screen
  // has to say so rather than say nothing.
  it('answers AC-FL-011-1 on screen and carries all three fallback readings', () => {
    render(<A7ProfileLiteView column="Worker" />)
    expect(words(screen.getByTestId('fl-a7-ac-fl-011-1'))).toContain(
      'All 11 functionalities of this module name at least one FB-FL-* pattern',
    )
    // R4-C03. This assertion stopped at the first clause, so the SECOND
    // clause -- a figure about the whole chapter -- shipped wrong for as long
    // as the page has existed: "Twelve functionalities elsewhere in this
    // chapter name none", where the measured figure is twenty-eight. Twelve
    // was MOD-FL-A5's count produced by a regex blind to `FB-FL-SEV1-01`.
    // `tests/unit/hub-source-figures.test.ts` holds the number to all twelve
    // modules' own data; this holds the RENDERED sentence to that number.
    expect(words(screen.getByTestId('fl-a7-ac-fl-011-1'))).toContain(
      '28 functionalities elsewhere in this chapter name none; none of them is this module\u2019s.',
    )
    const divergence = words(screen.getByTestId('fl-a7-pattern-divergence'))
    expect(divergence).toContain('names three patterns')
    expect(divergence).toContain('names four')
    expect(divergence).toContain('FB-FL-AUTH-01')
    expect(screen.getAllByTestId('fl-a7-pattern')).toHaveLength(3)
  })

  // FAILS IF: a lockout attempt count or duration reaches the screen.
  // L41371 says both are Not specified in the Statement of Work.
  it('names no lockout attempt count and no lockout duration', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const shown = words(screen.getByTestId('fl-a7-lockout-threshold'))
    expect(shown).toContain('Not specified in the Statement of Work')
    expect(shown).toContain('TBD — Client Decision Required')
    expect(shown).not.toMatch(/\b(three|four|five|six|ten|\d+)\s+(attempts|failures|minutes)\b/i)
  })
})

/* ==================================================================== *
 * THE DESTINATION CARD IS MOD-FL-A1'S, AND IS NOT DRAWN TWICE.
 * ==================================================================== */

describe('what this module leaves to MOD-FL-A1 on the shared destination', () => {
  // FAILS IF: this module draws its own destination card. §25.5 mounts both
  // modules here (L48534) and MOD-FL-A1's card already carries SCR-FL-06
  // with BOTH readings of the contested token beside it. Two copies is how
  // one of them quietly stops mentioning the alternative — which is the
  // reason @/disclosure/DecisionDisclosure exists at all.
  //
  // Planted: an `A1DestinationCard`-shaped block added to this view. Went
  // red on the contested-token sweep.
  it('draws no second destination card and no second contested-token block', () => {
    render(<A7ProfileLiteView column="Worker" />)
    expect(screen.queryAllByTestId('fl-a1-destination')).toHaveLength(0)
    expect(screen.queryAllByTestId('fl-a1-contested-token')).toHaveLength(0)
    expect(screen.queryAllByTestId('fl-a7-destination')).toHaveLength(0)
    // The destination IS named, in one sentence, so a reader is not left
    // wondering which screen they are on.
    expect(words(screen.getByTestId('fl-a7-profile-lite'))).toContain('Profile-lite')
    expect(L(48534)).toContain('MOD-FL-A1, MOD-FL-A7')
  })

  // FAILS IF: this module's own charter stops rendering. The identity card
  // is MOD-FL-A7's and MOD-FL-A1 does not carry it, so leaving the
  // destination card to the neighbour must not leave the charter with it.
  it('renders its own identity card, which the neighbour does not carry', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const statements = screen.getAllByTestId('fl-a7-charter-statement')
    expect(statements.length).toBeGreaterThan(4)
    const shown = words(screen.getByTestId('fl-a7-charter'))
    expect(shown).toContain('Security and Data Protection')
    expect(shown).toContain('L41285')
  })
})

/* ==================================================================== *
 * THE COLUMN TYPE IS THE HEADER'S OWN WORDS.
 * ==================================================================== */

describe('the six persona columns on screen', () => {
  // FAILS IF: a column heading on screen is not the header's own word, or
  // the sixth column is described as one role. It covers four, and the
  // screen says which.
  it('names the header’s own six words, and says the sixth covers four roles', () => {
    const header = cellsOf(41295)
    expect(header.slice(1)).toEqual([...A7_COLUMNS])
    for (const column of A7_COLUMNS) {
      const { unmount } = render(<A7ProfileLiteView column={column} />)
      const matrix = screen.getByTestId('fl-a7-matrix')
      expect(matrix.dataset.column, column).toBe(column)
      expect(words(matrix), column).toContain(`What Profile-lite draws for the ${column} column`)
      const roles = words(screen.getByTestId('fl-a7-column-roles'))
      if (column === 'Platform roles') {
        expect(roles).toContain('ROOT_SUPER_ADMIN')
        expect(roles).toContain('set of roles rather than one role')
      } else {
        expect(roles, column).not.toContain('set of roles rather than one role')
      }
      unmount()
    }
  })

  // FAILS IF: a row's affordance changes with the column in a way the
  // classification does not license. The classification is the ROW's, so
  // every column of a given row resolves to the same kind — which is the
  // whole reason `surface`, `existence` and `metElsewhere` are per row and
  // not per cell (the elliptical-cell trap, L41299 among them).
  it('resolves each row to one kind across all six columns', () => {
    const byRow = new Map<string, Set<string>>()
    for (const column of A7_COLUMNS) {
      const { unmount } = render(<A7ProfileLiteView column={column} />)
      for (const row of A7_ROWS) {
        const kind = rowNode(row.id).dataset.affordance ?? 'none'
        byRow.set(row.id, (byRow.get(row.id) ?? new Set()).add(kind))
      }
      unmount()
    }
    for (const [id, kinds] of byRow) {
      expect([...kinds], `${id}: ${[...kinds].join(', ')}`).toHaveLength(1)
    }
    expect(byRow.size).toBe(9)
    expect(a7RowById('pin-reset').home.kind).toBe('another-surface')
  })
})

/* ==================================================================== *
 * SLICE 8 — §34.7 ON SCREEN.
 *
 * The unit suite proves the classification matches the register. These
 * prove the SCREEN does, and each expectation is parsed out of L78766-L78819
 * at run time rather than compared to the shipped record.
 * ==================================================================== */

const registerCell = (line: number, index: number): string =>
  at(cellsOf(line), index, `L${line} cell ${index}`)

function nodesBy(testid: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${testid}"]`))
}

/** The seven class names, parsed from the source's own table at L78723. */
const CLASS_NAMES_FROM_SOURCE: readonly string[] = (() => {
  const names: string[] = []
  for (let n = 78_723; L(n).startsWith('|'); n += 1) names.push(at(cellsOf(n), 0, `L${n} class`))
  return names
})()

describe('what §34.7 classifies this module’s functions as, on screen', () => {
  // FAILS IF: a register row this module owns is missing from the screen, or
  // one it does not own appears. The expected set of lines is found by
  // walking the Module column of the source, never listed here.
  //
  // Planted: A7_REGISTER_ROWS sliced to four in the view's map. Went red
  // naming the missing line.
  it('renders every row whose Module cell names it, with its class and its own line', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const rendered = nodesBy('fl-a7-register-row')

    const expected: number[] = []
    for (let n = 78_768; L(n).startsWith('|'); n += 1) {
      if (registerCell(n, 1).includes('MOD-FL-A7')) expected.push(n)
    }
    expect(expected.length).toBeGreaterThan(0)
    expect(rendered.map((node) => Number(node.dataset.line))).toEqual(expected)

    for (const node of rendered) {
      const line = Number(node.dataset.line)
      const text = words(node)
      expect(node.dataset.class, `L${line}`).toBe(registerCell(line, 2))
      expect(text, `L${line} function`).toContain(registerCell(line, 0))
      expect(text, `L${line} class`).toContain(registerCell(line, 2))
      expect(text, `L${line} reason`).toContain(registerCell(line, 3))
      expect(text, `L${line} locator`).toContain(`L${line}`)
    }
  })

  // FAILS IF: the two rows filed Cross-module are not drawn, or the storage
  // row is drawn as anything but named-and-not-restated. A module-labelled
  // filter returns none of the three, so a screen that showed only the five
  // would be a screen missing this module's own compliance stop.
  //
  // Planted: the DeviceStanding block rendered without OfflineClassification.
  // Went red on the reach nodes.
  it('draws the two rows it reaches and names the third without restating it', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const reach = nodesBy('fl-a7-cross-module-reach')
    expect(reach).toHaveLength(2)
    for (const node of reach) {
      const line = Number(node.dataset.line)
      expect(registerCell(line, 1)).toBe('Cross-module')
      expect(words(node)).toContain(registerCell(line, 0))
      expect(words(node)).toContain(`L${line}`)
    }
    const storage = at(nodesBy('fl-a7-storage-row-not-restated'), 0, 'storage row')
    expect(words(storage)).toContain(registerCell(78_819, 0))
    // Named, and its four options are nowhere on this screen.
    expect(words(document.body)).not.toContain('degrade capture fidelity')
  })

  // FAILS IF: the screen claims a class tally the register does not carry, or
  // claims a row outside the seven. Both numbers come off the parsed rows.
  //
  // ONE PLANT, RUN THREE TIMES, GREEN TWICE. A7_ROWS_UNDER_AC_OFF_702
  // filtered on 'Blocked offline' instead of 'Fully available offline':
  //   1. the check asserted only that the two identifiers appeared — green;
  //   2. the check asserted the COUNT — still green, because this module has
  //      two rows of each class and the number was true of the defect and of
  //      the fix alike, which is the position-check trap this build records;
  //   3. the check asserts the LINES — red.
  // The number was never the claim. Which rows they are is.
  it('states the tally and the two criteria, with the rows each governs', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const tally = words(at(nodesBy('fl-a7-register-tally'), 0, 'tally'))

    const lines = [78_800, 78_801, 78_802, 78_803, 78_804, 78_817, 78_818]
    const counts = new Map<string, number>()
    for (const line of lines) {
      const klass = registerCell(line, 2)
      counts.set(klass, (counts.get(klass) ?? 0) + 1)
    }
    for (const [klass, n] of counts) expect(tally, klass).toContain(`${klass} ${n}`)

    // The two criteria are about NUMBERS of rows, so the numbers are read.
    const outsideTheSeven = lines.filter(
      (n) => !CLASS_NAMES_FROM_SOURCE.includes(registerCell(n, 2)),
    )
    const fullyAvailable = lines.filter((n) => registerCell(n, 2) === 'Fully available offline')
    expect(fullyAvailable.length).toBeGreaterThan(0)
    expect(tally).toContain(`${outsideTheSeven.length} of them carries a class outside the seven`)
    // THE LINES AND NOT THE COUNT. The first version of this check compared
    // counts, and the plant that filtered AC-OFF-702's set on 'Blocked
    // offline' stayed green: this module has two rows of each class, so the
    // number was true of the defect and of the fix alike.
    expect(tally).toContain(
      `governs are ${fullyAvailable.map((n) => `L${n}`).join(' and ')}`,
    )
    const blocked = lines.filter((n) => registerCell(n, 2) === 'Blocked offline')
    expect(blocked).toHaveLength(fullyAvailable.length)
    expect(blocked).not.toEqual(fullyAvailable)
    expect(L(78_832)).toContain('AC-OFF-702')
  })

  // FAILS IF: the one functionality the register classifies nowhere is not
  // disclosed, or is disclosed with an answer. Both readings must be on the
  // screen and neither may be marked the answer.
  //
  // Planted: the block's readings map sliced to one. Went red on the count.
  it('discloses the functionality no register row classifies, with both readings', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const block = at(nodesBy('fl-a7-unclassified-functionality'), 0, 'unclassified block')
    expect(block.dataset.functionality).toBe('FUNC-A7-04-1-1')
    const text = words(block)
    expect(text).toContain('AC-OFF-701')
    expect(text).toContain('L41376')
    expect(text).toContain('Neither reading is chosen')
    expect(text).not.toMatch(/\bthe answer is\b/i)
  })
})

describe('row 9 as a behaviour, on screen', () => {
  // FAILS IF: a state of L41315 is missing from the standing list, or hard
  // suspension is drawn as a stop for work already running. The seven come
  // from the source's own line and the pair of answers from the render.
  //
  // Planted: STATE-A7-HARDSUSP's in-flight answer flipped to 'no' in
  // offline.ts. Went red here and in the unit suite.
  it('draws all seven states, and hard suspension does not stop work already running', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const standings = nodesBy('fl-a7-standing')
    const states = standings.map((n) => n.dataset.state ?? '')
    expect(states).toHaveLength(7)
    for (const state of states) expect(cellsOf(41_315).join(' '), state).toContain(state)

    const hard = at(
      standings.filter((n) => n.dataset.state === 'STATE-A7-HARDSUSP'),
      0,
      'hard suspension',
    )
    expect(hard.dataset.newRuns).toBe('no')
    expect(hard.dataset.inFlight).toBe('yes')
    const soft = at(
      standings.filter((n) => n.dataset.state === 'STATE-A7-SOFTSUSP'),
      0,
      'soft suspension',
    )
    expect(soft.dataset.newRuns).toBe('yes')
    const lock = at(
      standings.filter((n) => n.dataset.state === 'STATE-A7-COMPLIANCELOCK'),
      0,
      'compliance lock',
    )
    expect(lock.dataset.inFlight).toBe('no')
  })

  // FAILS IF: an expired trust window safe-stops a state the register does
  // not put the window on. The boundary is parsed: a state's own register row
  // carries L78817's expiry text, or it does not.
  //
  // Planted: the view rendered with a fixed trustWindow of 'expired'. Went
  // red on the valid pass, where every safe-stop flag must be false.
  it('safe-stops on an expired window only where the register puts the window', () => {
    const window = registerCell(78_817, 5)
    const governed = new Map<string, boolean>([
      ['STATE-A7-NORMAL', registerCell(78_804, 5) === window],
      ['STATE-A7-SOFTSUSP', registerCell(78_804, 5) === window],
      ['STATE-A7-HARDSUSP', registerCell(78_804, 5) === window],
      ['STATE-A7-COMPLIANCELOCK', registerCell(78_804, 5) === window],
      ['STATE-A7-PINLOCK', registerCell(78_801, 5) === window],
      ['STATE-A7-WIPEPENDING', registerCell(78_803, 5) === window],
      ['STATE-A7-WIPED', registerCell(78_803, 5) === window],
    ])
    expect([...governed.values()].filter(Boolean)).toHaveLength(4)

    const valid = render(<A7ProfileLiteView column="Worker" />)
    for (const node of nodesBy('fl-a7-standing')) {
      expect(node.dataset.safeStop, node.dataset.state).toBe('false')
    }
    valid.unmount()

    render(<A7ProfileLiteView column="Worker" trustWindow="expired" />)
    for (const node of nodesBy('fl-a7-standing')) {
      const state = node.dataset.state ?? ''
      expect(node.dataset.safeStop, state).toBe(String(governed.get(state)))
    }
    const stopped = at(
      nodesBy('fl-a7-standing').filter((n) => n.dataset.state === 'STATE-A7-HARDSUSP'),
      0,
      'hard suspension expired',
    )
    expect(words(stopped)).toContain(registerCell(78_817, 8))
  })

  // FAILS IF: the five verbs are drawn as sharing one class, or a verb the
  // register classifies nowhere is drawn with one. The classes come off the
  // source lines each verb is mapped to.
  //
  // Planted: 'compute summaries' mapped to 78_780 in offline.ts. Went red on
  // the "classified by no row" assertion.
  it('shows that the five verbs do not share one class', () => {
    render(<A7ProfileLiteView column="Worker" />)
    const verbs = nodesBy('fl-a7-verb')
    expect(verbs.map((n) => n.dataset.verb)).toEqual([
      'complete',
      'capture',
      'sync',
      'compute summaries',
      'close',
    ])

    const complete = at(verbs.filter((n) => n.dataset.verb === 'complete'), 0, 'complete')
    expect(complete.dataset.classes).toBe(
      [registerCell(78_780, 2), registerCell(78_781, 2)].join(' | '),
    )
    expect(registerCell(78_780, 2)).not.toBe(registerCell(78_781, 2))

    const summaries = at(
      verbs.filter((n) => n.dataset.verb === 'compute summaries'),
      0,
      'compute summaries',
    )
    expect(summaries.dataset.classes).toBe('')
    expect(words(summaries)).toContain('classified by no row of the register')

    // And L78781's own Function cell never reaches the screen: it names a
    // state L39622 says does not exist.
    expect(registerCell(78_781, 0)).toMatch(/\bsynced\b/i)
    expect(words(document.body)).not.toContain(registerCell(78_781, 0))
  })
})

/** Referenced so a column rename fails to compile here too, not only in src. */
const _columnTypeIsUsed: A7Column = 'Platform roles'
void _columnTypeIsUsed
