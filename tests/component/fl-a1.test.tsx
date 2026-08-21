import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { routeOpenDecisionFor } from '@/routes/definitions'
import { LoginView } from '@/frontline/modules/fl-a1/LoginView'
import { ProfileLiteView } from '@/frontline/modules/fl-a1/ProfileLiteView'
import { A1_COLUMNS, A1_ROWS, type A1Column } from '@/frontline/modules/fl-a1/matrix'
import { COMPLIANCE_MESSAGE_READINGS } from '@/frontline/modules/fl-a1/service'

/**
 * `MOD-FL-A1`'s two destinations, RENDERED, against the frozen source.
 *
 * WHY THE SOURCE IS READ HERE TOO. The unit suite proves the transcription
 * matches the file; this one proves the RENDER matches the transcription.
 * Between the two there is no gap a correct data table can hide a wrong
 * screen in, and neither suite can pass by agreeing with the other — both
 * compare against L40188-L40197 parsed at run time.
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

/**
 * Anything a person could act through, not `<button>` alone. A disabled
 * control counts: `FrontlineAffordance` has no `disabled` member precisely
 * so no task can reach for one, and a test that only looked for enabled
 * buttons would not notice one arriving.
 */
const AFFORDANCES = 'button, input, select, textarea, [role="button"], [contenteditable="true"]'

function rowNode(row: string): HTMLElement {
  const found = Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="fl-a1-matrix-row"]'),
  ).find((n) => n.dataset.row === row)
  if (found === undefined) throw new Error(`no rendered matrix row: ${row}`)
  return found
}

function affordanceOf(row: string): string {
  return rowNode(row).dataset.affordance ?? 'none'
}

describe('SCR-FL-01 Login — the ten rows, for every persona column', () => {
  // FAILS IF: a row is dropped from the render. All ten render on both
  // destinations; a view that showed only the rows it owns would be a matrix
  // with rows missing and no way for a reader to tell that from a row nobody
  // transcribed.
  it('renders all ten rows, in the source’s order, for each of the five columns', () => {
    for (const column of A1_COLUMNS) {
      const { unmount } = render(<LoginView column={column} />)
      const rows = screen.getAllByTestId('fl-a1-matrix-row')
      expect(rows, column).toHaveLength(10)
      expect(rows.map((r) => r.dataset.row), column).toEqual(A1_ROWS.map((r) => r.id))
      unmount()
    }
  })

  // FAILS IF: a cell is paraphrased on the way to the screen. The expected
  // text is PARSED from the blueprint, so this cannot pass by the render
  // agreeing with the transcription.
  it('prints every cell’s own words verbatim, parsed from L40188-L40197', () => {
    for (const column of A1_COLUMNS) {
      const { unmount } = render(<LoginView column={column} />)
      A1_ROWS.forEach((row, i) => {
        const parsed = cellsOf(40188 + i)
        const node = rowNode(row.id)
        expect(node.textContent, `${row.id}/${column}`).toContain(parsed[0])
        expect(
          within(node).getByTestId('fl-a1-cell-note').textContent,
          `${row.id}/${column}`,
        ).toBe(`${column}: ${parsed[A1_COLUMNS.indexOf(column) + 1]}`)
        expect(node.textContent, `${row.id}/${column}`).toContain(`L${40188 + i}`)
      })
      unmount()
    }
  })

  // A HOLE FOUND BY PLANTING, AND CLOSED. Moving a charter statement AND its
  // locator together — the consistent lie — went red in the unit suite and
  // GREEN here, because this suite asserted only that the card rendered. It
  // now compares the rendered card against the blueprint line itself.
  //
  // FAILS IF: a charter statement is paraphrased on the way to the screen,
  // or re-cited at a line that does not carry it.
  it('renders every card statement at the line it cites, parsed from the blueprint', () => {
    render(<LoginView column="Worker" />)
    const rendered = screen.getAllByTestId('fl-a1-charter-statement')
    expect(rendered.map((n) => n.dataset.statement)).toEqual([
      'identifier',
      'purpose',
      'user-benefit',
      'owning-surface',
      'roles',
      'states',
    ])
    // The card's own five lines, with the source's markup removed.
    const prose = (n: number): string =>
      L(n)
        .replace(/`/g, '')
        .replace(/\*\*/g, '')
        .replace(/\[(SoW Fact|Derived Clarification|Client Decision Required)[^\]]*\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    for (const [statement, line] of [
      ['purpose', 40176],
      ['user-benefit', 40178],
      ['owning-surface', 40180],
      ['roles', 40182],
      ['states', 40207],
    ] as const) {
      const node = rendered.find((n) => n.dataset.statement === statement)
      expect(node, statement).toBeDefined()
      if (node === undefined) continue
      // The statement's own text, not its heading or its locator line.
      const shown = (within(node).getByTestId('fl-a1-charter-text').textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim()
      expect(shown.length, statement).toBeGreaterThan(24)
      // Every sentence the screen prints has to appear in the line it names.
      for (const sentence of shown.split(/(?<=\.)\s+/)) {
        expect(prose(line), `${statement} :: ${sentence.slice(0, 48)}`).toContain(sentence.trim())
      }
    }
  })

  // FAILS IF: a disabled control ever reaches this surface's matrix axis.
  // There is no `disabled` member to express one, and this is what makes
  // that a fact about the screen rather than about the type.
  it('draws no disabled control anywhere, on either destination, for any column', () => {
    for (const column of A1_COLUMNS) {
      for (const view of [<LoginView key="l" column={column} />, <ProfileLiteView key="p" column={column} />]) {
        const { container, unmount } = render(view)
        const inert = container.querySelectorAll('[aria-disabled="true"], [disabled]')
        expect([...inert].map((n) => n.textContent), column).toEqual([])
        unmount()
      }
    }
  })
})

describe('the inverse trap, on screen', () => {
  // THE DEFECT THIS TASK EXISTS TO NOT SHIP.
  //
  // FAILS IF: the Supervisor's or the Quality Manager's genuine on-device
  // control is deleted by the uniform "permissive means elsewhere" rule.
  // Three rows, two columns each, six real controls.
  it('draws a real control for the Supervisor and the Quality Manager on all three genuine rows', () => {
    const drawn: string[] = []
    for (const column of ['Supervisor', 'Quality Manager'] as const) {
      const { unmount } = render(<LoginView column={column} />)
      for (const id of ['sso', 'managed-pin', 'step-up'] as const) {
        const node = rowNode(id)
        expect(affordanceOf(id), `${id}/${column}`).toBe('control')
        expect(within(node).getAllByTestId('fl-a1-control').length, `${id}/${column}`).toBe(1)
        expect(node.querySelectorAll(AFFORDANCES).length, `${id}/${column}`).toBe(1)
        drawn.push(`${id}/${column}`)
      }
      unmount()
    }
    expect(drawn).toHaveLength(6)
  })

  // FAILS IF: the one row where the Worker is the refused party starts
  // drawing the Worker a control. L40192's Worker cell is `Explicitly
  // prohibited` and the file is what says so here.
  it('refuses the Worker on the step-up row, and says so where the control would sit', () => {
    render(<LoginView column="Worker" />)
    const node = rowNode('step-up')
    expect(affordanceOf('step-up')).toBe('refusal')
    expect(node.querySelectorAll(AFFORDANCES)).toHaveLength(0)
    expect(node.textContent).toContain('no control is drawn here')
    expect(cellsOf(40192)[1]).toBe('Explicitly prohibited')
    expect(node.textContent).toContain('Explicitly prohibited')
  })

  // FAILS IF: the three genuine rows stop being stated on screen. A rule
  // that is true on day one is worse disclosed on day thirty.
  it('states the three genuine non-Worker acts on the Login screen itself', () => {
    render(<LoginView column="Worker" />)
    const stated = screen.getAllByTestId('fl-a1-genuine-control')
    expect(stated.map((n) => n.dataset.row)).toEqual(['sso', 'managed-pin', 'step-up'])
    for (const n of stated) expect(n.querySelectorAll(AFFORDANCES)).toHaveLength(0)
  })
})

describe('acts held elsewhere draw a statement and never a control', () => {
  // FAILS IF: row 7's three `Allowed` cells become buttons. The Supervisor's
  // names the Delivery Operations Hub; the Quality Manager's and the Tenant
  // Admin's say only "same path" and name no surface at all.
  it('renders both cross-surface rows as statements, for every column, on both destinations', () => {
    for (const column of A1_COLUMNS) {
      for (const view of [<LoginView key="l" column={column} />, <ProfileLiteView key="p" column={column} />]) {
        const { unmount } = render(view)
        for (const id of ['device-mode', 'pin-reset'] as const) {
          const node = rowNode(id)
          expect(affordanceOf(id), `${id}/${column}`).toBe('cross-surface')
          expect(node.querySelectorAll(AFFORDANCES), `${id}/${column}`).toHaveLength(0)
          expect(
            within(node).getByTestId('fl-cross-surface').textContent,
            `${id}/${column}`,
          ).toContain('Held on another surface')
        }
        expect(rowNode('device-mode').textContent, column).toContain(
          'Super Admin platform console',
        )
        expect(rowNode('pin-reset').textContent, column).toContain('Delivery Operations Hub')
        unmount()
      }
    }
    // And all three of row 7's non-Worker permissive cells are permissive in
    // the file, which is what makes the classification load-bearing.
    expect(cellsOf(40194).slice(2, 5).map((c) => c.split(' —')[0])).toEqual([
      'Allowed',
      'Allowed',
      'Allowed',
    ])
  })

  // FAILS IF: a capability met on the OTHER destination of this surface is
  // dressed as a surface crossing, which would claim a sixth surface.
  it('points at the other destination as a named place, never as a surface crossing', () => {
    render(<LoginView column="Worker" />)
    for (const id of ['language', 'log-out'] as const) {
      const node = rowNode(id)
      expect(affordanceOf(id), id).toBe('named-place')
      expect(node.querySelectorAll(AFFORDANCES), id).toHaveLength(0)
      expect(within(node).getByTestId('fl-named-place').textContent, id).toContain(
        'Met on Profile-lite, not on this screen',
      )
      expect(within(node).queryByTestId('fl-cross-surface'), id).toBeNull()
    }
  })
})

describe('SCR-FL-06 Profile-lite — the two acts it holds, and Not applicable', () => {
  // FAILS IF: the destination stops holding its own two acts.
  it('draws the Worker a control for language preference and for logout', () => {
    render(<ProfileLiteView column="Worker" />)
    for (const id of ['language', 'log-out'] as const) {
      expect(affordanceOf(id), id).toBe('control')
      expect(rowNode(id).querySelectorAll(AFFORDANCES), id).toHaveLength(1)
    }
  })

  // THE CLEAREST `Not applicable` IN THE SLICE.
  //
  // FAILS IF: a Supervisor is told they are forbidden from logging out. The
  // truth is that a step-up is released rather than logged out, and the
  // cell's own words say so — so it renders as a pointer at the step-up row,
  // with the token still on screen.
  it('tells a Supervisor a step-up is released rather than logged out, and points at the step-up row', () => {
    for (const column of ['Supervisor', 'Quality Manager'] as const) {
      const { unmount } = render(<ProfileLiteView column={column} />)
      const node = rowNode('log-out')
      expect(affordanceOf('log-out'), column).toBe('routed')
      expect(node.querySelectorAll(AFFORDANCES), column).toHaveLength(0)
      const routed = within(node).getByTestId('fl-a1-routed')
      expect(routed.dataset.toRow, column).toBe('step-up')
      expect(routed.textContent, column).toContain(
        'Perform a second-identity step-up to authorise a sign-off or approval',
      )
      // The token is not corrected, downgraded or hidden.
      expect(node.textContent, column).toContain('Not applicable')
      unmount()
    }
    expect(cellsOf(40197)[2]).toBe(
      'Not applicable — a step-up is released rather than logged out',
    )
  })

  // FAILS IF: the one bare `Not applicable` of that row is rendered as a
  // prohibition. It names nothing, so it carries no pointer — and the
  // rendering says in words that it is not a refusal.
  it('renders the bare Not applicable as what it is, and says it is not a refusal', () => {
    render(<ProfileLiteView column="Tenant Admin" />)
    const node = rowNode('log-out')
    expect(affordanceOf('log-out')).toBe('refusal')
    const refusal = within(node).getByTestId('fl-a1-refusal')
    expect(refusal.dataset.outcome).toBe('notApplicable')
    expect(refusal.textContent).toContain('This is not a refusal')
    expect(node.querySelectorAll(AFFORDANCES)).toHaveLength(0)
    expect(cellsOf(40197)[4]).toBe('Not applicable')
  })

  // FAILS IF: a Read-only Auditor is drawn any control at all, anywhere.
  // Every one of that column's ten cells is `Explicitly prohibited`.
  it('draws the Read-only Auditor no control on either destination', () => {
    for (const view of [
      <LoginView key="l" column="Read-only Auditor" />,
      <ProfileLiteView key="p" column="Read-only Auditor" />,
    ]) {
      const { unmount } = render(view)
      expect(screen.queryAllByTestId('fl-a1-control')).toHaveLength(0)
      unmount()
    }
    for (let i = 0; i < 10; i += 1) expect(cellsOf(40188 + i)[5]).toBe('Explicitly prohibited')
  })
})

describe('the open questions, disclosed and not answered', () => {
  // FAILS IF: a Tenant Admin's `Client Decision Required` cell is answered
  // in either direction, or the disclosure stops reading the one record and
  // starts restating it. `AC-FL-009-5` (L39948) forbids both directions.
  it('discloses the device-session question on all four cells, in the route registry’s own words', () => {
    const open = routeOpenDecisionFor('SURF-FL', 'TENANT_ADMIN')
    expect(open).not.toBeNull()

    render(<LoginView column="Tenant Admin" />)
    const disclosed = screen.getAllByTestId('fl-a1-open-decision')
    expect(disclosed).toHaveLength(4)
    for (const n of disclosed) {
      expect(n.dataset.decision).toBe('AC-FL-009-5')
      expect(n.textContent).toContain(open?.why ?? 'MISSING')
      expect(n.querySelectorAll(AFFORDANCES)).toHaveLength(0)
    }
    for (const id of ['session', 'sso', 'managed-pin', 'step-up'] as const) {
      expect(rowNode(id).querySelectorAll('[data-testid="fl-a1-open-decision"]'), id).toHaveLength(
        1,
      )
    }
  })

  // FAILS IF: only one wording of the fixed compliance message reaches the
  // screen. `TEST-SCR-FL-006` (L48703) requires both preserved, and every
  // occurrence in chapter 22 quotes Reading A alone.
  it('renders both DEC-MSG-001 wordings, neither of them as the message', () => {
    render(<LoginView column="Worker" />)
    const block = screen.getByTestId('fl-a1-compliance-message')
    for (const r of COMPLIANCE_MESSAGE_READINGS) {
      expect(block.textContent).toContain(r.text)
      expect(block.textContent).toContain(r.locator)
    }
    expect(block.textContent).not.toMatch(/canonical|the correct wording|the fixed message is/i)
    expect(L(5265)).toContain(COMPLIANCE_MESSAGE_READINGS[0].text)
    expect(L(5266)).toContain(COMPLIANCE_MESSAGE_READINGS[1].text)
  })

  // FAILS IF: a decision is rendered without every reading, or without the
  // client-delegated label. Four decisions on both destinations.
  it('renders all four decisions with every reading and the client-delegated label', () => {
    for (const view of [
      <LoginView key="l" column="Worker" />,
      <ProfileLiteView key="p" column="Worker" />,
    ]) {
      const { unmount } = render(view)
      const cards = screen.getAllByTestId('fl-a1-decision')
      expect(cards.map((c) => c.dataset.decision)).toEqual([
        'DEC-MSG-001',
        'DEC-WIPELOGOUT-001',
        'DEC-SUSP-001',
        'DEC-DEVICE-001',
      ])
      for (const c of cards) {
        expect(c.textContent).toContain('A client-delegated choice under APP-012')
        expect(c.textContent).toContain('All readings stand')
        expect(c.querySelectorAll('li').length).toBeGreaterThanOrEqual(2)
      }
      unmount()
    }
  })

  // FAILS IF: the AC-FL-011-1 gap is closed by assigning a pattern, or stops
  // being stated on screen.
  it('states on screen that FUNC-A1-04-1-3 names no fallback pattern', () => {
    render(<LoginView column="Worker" />)
    const stated = screen.getByTestId('fl-a1-ac-fl-011-1').textContent ?? ''
    expect(stated).toContain('FUNC-A1-04-1-3')
    expect(stated).toContain('names none')
    expect(L(40279)).toContain('no external dependency')
    expect(screen.getByTestId('fl-a1-pattern-divergence').textContent).toContain(
      'names two patterns for this module',
    )
  })
})

describe('what the rendered screens never say', () => {
  // FAILS IF: a pace figure, a countdown, a timer, a ranking or a
  // productivity comparison reaches rendered text in ANY state of either
  // destination. AC-FL-000-5 (L39100), AC-SCR-FL-002 (L48690), AC-SCOPE-045
  // (L2683). This is the render, not the data — the wave-3 sweep reads the
  // built tree, and so does this in miniature.
  it('renders no pace, timer, countdown, ranking or productivity comparison, in any state', () => {
    const banned = /\b(pace|timer|countdown|ranking|leaderboard|productivity|quota)\b/i
    const seen: string[] = []
    for (const column of A1_COLUMNS) {
      for (const mode of ['shared', 'personal'] as const) {
        const { container, unmount } = render(<LoginView column={column} deviceMode={mode} />)
        if (banned.test(container.textContent ?? '')) seen.push(`login/${column}/${mode}`)
        unmount()
      }
      const { container, unmount } = render(<ProfileLiteView column={column} />)
      if (banned.test(container.textContent ?? '')) seen.push(`profile-lite/${column}`)
      unmount()
    }
    expect(seen).toEqual([])
  })

  // FAILS IF: "synced" is ever rendered as a state. L39622: there is no
  // single state called "synced", and no bare success.
  it('never renders “synced” as a state', () => {
    const seen: string[] = []
    for (const column of A1_COLUMNS) {
      const { container, unmount } = render(<LoginView column={column} />)
      if (/\bsynced\b/i.test(container.textContent ?? '')) seen.push(`login/${column}`)
      unmount()
    }
    expect(seen).toEqual([])
  })

  // FAILS IF: a screen renders only the connected path. `AC-FL-000-4`
  // (L39099) requires identical outcomes with the network disabled, and a
  // screen silent about it implies a network this surface is built not to
  // need.
  it('states what each destination does with no connection, in the source’s own words', () => {
    // The destination-property table, header L40030, data L40032-L40037.
    // Login is its first row and Profile-lite its last, and each offline
    // cell reads a token then an em dash then the words this screen prints.
    const offlineWords = (n: number): string => {
      const cell = cellsOf(n)[1] ?? ''
      const words = cell.split('—')[1]
      if (words === undefined) throw new Error(`L${n} offline cell names no words: ${cell}`)
      return words.trim()
    }
    expect(cellsOf(40032)[0]).toBe('Login')
    expect(cellsOf(40037)[0]).toBe('Profile-lite')

    for (const [line, view] of [
      [40032, <LoginView key="l" column="Worker" />],
      [40037, <ProfileLiteView key="p" column="Worker" />],
    ] as const) {
      const { unmount } = render(view)
      expect(screen.getByTestId('fl-a1-offline').textContent, `L${line}`).toContain(
        offlineWords(line),
      )
      expect(screen.getByTestId('fl-a1-forced-sync').textContent, `L${line}`).toContain(
        'does not proceed offline',
      )
      unmount()
    }
  })

  // FAILS IF: the login screen stops adapting to device mode, or a mode's
  // name stops rendering. §22.7 names this screen "Login, adapting to device
  // mode" (L39863).
  it('adapts the login screen to both device modes and offers no control to change one', () => {
    for (const [mode, name] of [
      ['shared', 'Shared mode'],
      ['personal', 'Personal or assigned mode'],
    ] as const) {
      const { unmount } = render(<LoginView column="Worker" deviceMode={mode} />)
      const block = screen.getByTestId('fl-a1-device-mode')
      expect(block.textContent, mode).toContain(name)
      expect(block.querySelectorAll(AFFORDANCES), mode).toHaveLength(0)
      expect(block.textContent, mode).toContain('cannot be changed from here')
      unmount()
    }
    expect(L(39863)).toContain('Login, adapting to device mode')
  })
})

/** Kept as a type-level reminder that every column is exercised above. */
const _allColumns: readonly A1Column[] = A1_COLUMNS
void _allColumns
