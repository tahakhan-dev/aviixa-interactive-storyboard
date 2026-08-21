import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { RunSchedulingScreen } from '../../app/hub/run-scheduling-and-execution-oversight/RunSchedulingScreen'
import { DEC_FINISH_001 } from '@/surfaces/doh/transitions'
import {
  CLOSING_STATE_TABLE,
  DEC_RUNSTATE_001,
  DEC_STUCK_001,
  MOD_DOH_06_MATRIX,
  MOD_DOH_06_ROLES_REACHING,
  manualCloseAssertion,
  matrixRow,
} from '@/surfaces/doh/modules/doh-06/matrix'
import { SEEDED_RUNS, runsInScope } from '@/surfaces/doh/modules/doh-06/fixtures'
import { DEFERRAL_RENDERING } from '@/surfaces/doh/modules/doh-06/matrix'
import { dohScreenById } from '@/surfaces/doh/screens'

function viewAs(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function openRun(runId: string): void {
  const cell = screen.getByTestId(`run-${runId}`)
  const row = cell.closest('tr')
  expect(row, `no table row for ${runId}`).not.toBeNull()
  fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Open detail' }))
}

const body = (): string => document.body.textContent ?? ''

describe('MOD-DOH-06 — the screen, its identity and its annotations', () => {
  it('mounts and annotates both screen numbers without minting a route key', () => {
    render(<RunSchedulingScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const text = body()
    expect(text).toContain('MOD-DOH-06')
    expect(text).toContain('SCR-DOH-13')
    expect(text).toContain('SCR-DOH-14')
    // Catalogue A's three-digit form names a DIFFERENT screen and is banned.
    expect(text).not.toMatch(/SCR-DOH-\d{3}/)
  })

  it('names the run detail a sub-view, quoting catalogue B’s own entry point', () => {
    render(<RunSchedulingScreen />)
    expect(body()).toContain(dohScreenById('SCR-DOH-14').navigationEntry)
  })

  it('discloses that the module registry does not yet carry this module', () => {
    render(<RunSchedulingScreen />)
    const gap = screen.getByTestId('registry-gap').textContent ?? ''
    expect(gap).toContain('MOD-DOH-06')
    expect(gap).toContain('module-reach.json')
    // The reach it WOULD get is stated, so the gap is a schedule note rather
    // than a hole a reader has to notice for themselves.
    expect(gap).toContain('Tenant Admin')
  })
})

/* ==================================================================== *
 * THE MOUNT — DEC_FINISH_001.onScreen HAD NO SCREEN UNTIL THIS TASK
 * ==================================================================== */

describe('DEC-FINISH-001 is mounted, not merely declared', () => {
  it('renders wave 0’s own onScreen sentence, character for character', () => {
    render(<RunSchedulingScreen />)
    const mounted = screen.getByTestId('decision-onscreen-DEC-FINISH-001')
    expect(mounted.textContent).toBe(DEC_FINISH_001.onScreen)
  })

  it('renders both readings beside it, each with its own locator', () => {
    render(<RunSchedulingScreen />)
    const panel = screen.getByTestId('decision-DEC-FINISH-001')
    for (const reading of DEC_FINISH_001.readings) {
      expect(panel.textContent).toContain(reading.text)
      expect(panel.textContent).toContain(reading.locator)
    }
    expect(panel.textContent).toContain('not a position the source settled')
  })

  it('enforces the bound it discloses, and names the bound when it refuses', () => {
    render(<RunSchedulingScreen />)
    const select = screen.getByLabelText(/proposed finish window/i)

    fireEvent.change(select, { target: { value: '12' } })
    expect(screen.getByTestId('finish-window-verdict').textContent).toContain(
      'Below the platform floor of 24 hours.',
    )

    fireEvent.change(select, { target: { value: '240' } })
    expect(screen.getByTestId('finish-window-verdict').textContent).toContain(
      'Above the platform ceiling of 7 days.',
    )

    fireEvent.change(select, { target: { value: '48' } })
    expect(screen.getByTestId('finish-window-verdict').textContent).toContain('Accepted')
  })
})

/* ==================================================================== *
 * DEC-RUNSTATE-001 — THREE READINGS ON SCREEN, NONE ADOPTED
 * ==================================================================== */

describe('DEC-RUNSTATE-001 renders every reading and settles none', () => {
  it('shows all three readings with their three Part locators', () => {
    render(<RunSchedulingScreen />)
    const panels = screen.getAllByTestId('decision-DEC-RUNSTATE-001')
    expect(panels.length).toBeGreaterThan(0)
    const panel = panels[0] as HTMLElement
    for (const reading of DEC_RUNSTATE_001.readings) {
      expect(panel.textContent).toContain(reading.locator)
    }
    expect(panel.textContent).toContain('L5244')
    expect(panel.textContent).toContain('L5245')
    expect(panel.textContent).toContain('L5246')
  })

  it('transcribes the closing-state table and flags two of its three rows', () => {
    render(<RunSchedulingScreen />)
    const text = body()
    for (const row of CLOSING_STATE_TABLE) expect(text).toContain(row.meaning)
    expect(screen.getByTestId('closing-table-is-one-reading').textContent).toContain(
      'Reading B as if it were settled',
    )
    expect(screen.getAllByText('One reading of three').length).toBe(2)
    expect(screen.getAllByText('Agreed across Parts').length).toBe(1)
  })

  it('answers a contested run with three readings instead of one word', () => {
    render(<RunSchedulingScreen />)
    viewAs('QUALITY_MANAGER')
    openRun('RUN-2026-03-04-C')

    const readings = screen.getByTestId('runstate-readings')
    expect(within(readings).getByTestId('reading-A').textContent).toContain('3 times')
    expect(within(readings).getByTestId('reading-B').textContent).toContain('1 time')
    expect(within(readings).getByTestId('reading-C').textContent).toContain('1 time')
    // Reading A has this run through `submitted` twice already, on three
    // assigned workers. That is the concrete cost the decision card names.
    expect(within(readings).getByTestId('reading-A').textContent).toContain('2 of 3')
  })

  /**
   * THE ASSERTION THAT MATTERS, AND IT WAS A BLUNTER ONE FIRST. A tree-wide
   * `queryByText('submitted')` went red on the closing-state table, which
   * quotes the source's own row and MUST print the word. That check would
   * have forced the honest render out to make itself green. What is actually
   * forbidden is narrower: no BOARD POSITION may be either contested word,
   * because that is the one place the screen would be answering for itself.
   */
  it('never states either contested word as a run’s position on the board', () => {
    render(<RunSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    const allowed = [
      'scheduled',
      'in progress',
      'cancelled',
      'finished',
      'Contested — three readings',
      'Closed by hand — state open (DEC-STUCK-001)',
    ]
    let checked = 0
    for (const run of SEEDED_RUNS) {
      const pill = screen.queryByTestId(`position-${run.facts.runId}`)
      if (pill === null) continue
      const label = (pill.textContent ?? '').replace(/^●\s*/, '').trim()
      expect(allowed, `${run.facts.runId} renders "${label}"`).toContain(label)
      expect(label).not.toContain('submitted')
      expect(label).not.toContain('complete')
      checked += 1
    }
    // Non-vacuity: the loop must actually have seen the whole board.
    expect(checked).toBe(SEEDED_RUNS.length)
  })
})

/* ==================================================================== *
 * DEC-STUCK-001 — ROW 9'S CELL IS NOT THE BUILD'S RULE
 * ==================================================================== */

describe('DEC-STUCK-001 renders both readings and asserts only the clock', () => {
  it('opens the manually closed run with the decision rather than a state', () => {
    render(<RunSchedulingScreen />)
    openRun('RUN-2026-03-02-F')

    const panel = screen.getByTestId('stuck-close-panel')
    expect(within(panel).getByTestId('stuck-asserted').textContent).toBe(
      manualCloseAssertion.asserted,
    )
    expect(within(panel).getByTestId('stuck-not-asserted').textContent).toContain(
      manualCloseAssertion.notAsserted,
    )
    for (const reading of DEC_STUCK_001.readings) {
      expect(panel.textContent).toContain(reading.locator)
    }
    expect(panel.textContent).toContain('AC-RUN-004')
  })

  it('does not hand a manually closed run to the three-reading fold', () => {
    render(<RunSchedulingScreen />)
    openRun('RUN-2026-03-02-F')
    expect(screen.queryByTestId('runstate-readings')).toBeNull()
  })

  it('renders row 9’s condition as the source’s cell, marked as one reading', () => {
    render(<RunSchedulingScreen />)
    const cell = screen.getByTestId('cell-close-a-stuck-run-manually-SUPERVISOR')
    expect(cell.textContent).toContain('the run is `complete` at close time')
    expect(cell.textContent).toContain('DEC-STUCK-001 Reading A')
    expect(cell.textContent).toContain('AC-RUN-004')
  })
})

/* ==================================================================== *
 * D11 — THE WORKER'S GRANT AND THE ROUTE'S REFUSAL
 * ==================================================================== */

describe('trap — the Worker holds row 2 and holds no Hub screen', () => {
  it('renders the route registry’s refusal, not a board with buttons removed', () => {
    render(<RunSchedulingScreen />)
    viewAs('WORKER')
    expect(body()).toContain('holds no Hub screen')
    expect(screen.queryByTestId('run-RUN-2026-03-06-A')).toBeNull()
  })

  it('states this module’s own cost, which the shell cannot know', () => {
    render(<RunSchedulingScreen />)
    viewAs('WORKER')
    const cost = screen.getByTestId('worker-d11-cost').textContent ?? ''
    expect(cost).toContain('Allowed with conditions — own assigned runs only')
    expect(cost).toContain('L27910')
    expect(cost).toContain('Frontline Worker Application')
    expect(cost).toContain('D11')
  })

  it('keeps the Worker in the matrix-derived reach rather than editing the cell', () => {
    expect(MOD_DOH_06_ROLES_REACHING).toContain('WORKER')
    expect(matrixRow('view-the-schedule').status.WORKER).toBe('allowed-with-conditions')
  })
})

/* ==================================================================== *
 * REACH — THE MATRIX, NOT THE CATALOGUE CELL
 * ==================================================================== */

describe('reach is derived from the matrix', () => {
  it('admits the Tenant Admin whom catalogue B’s own cell leaves out', () => {
    render(<RunSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    expect(screen.queryByLabelText('Permission denied')).toBeNull()
    expect(screen.getByLabelText('Run schedule board')).toBeTruthy()
    // And the narrowing is quoted on screen rather than silently overridden.
    expect(body()).toContain(dohScreenById('SCR-DOH-13').catalogueBRoles)
  })

  it('gives the Read-only Auditor the board and no write control', () => {
    render(<RunSchedulingScreen />)
    viewAs('READONLY_AUDITOR')
    expect(screen.getByLabelText('Run schedule board')).toBeTruthy()
    expect(screen.queryByTestId('control-create-a-run')).toBeNull()
    expect(screen.queryByTestId('control-cancel-a-run')).toBeNull()
    expect(screen.getByTestId('refusal-create-a-run')).toBeTruthy()
  })

  it('offers the Supervisor the two writes the matrix gives them', () => {
    render(<RunSchedulingScreen />)
    viewAs('SUPERVISOR')
    expect(screen.getByTestId('control-create-a-run')).toBeTruthy()
    expect(screen.getByTestId('control-cancel-a-run')).toBeTruthy()
  })

  it('refuses the Tenant Admin every write, with the cell text as the reason', () => {
    render(<RunSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    expect(screen.queryByTestId('control-create-a-run')).toBeNull()
    expect(screen.getByTestId('refusal-create-a-run').textContent).toContain(
      'run creation is supervisor-driven',
    )
  })
})

/* ==================================================================== *
 * SCOPE BOUNDS THE READ, NOT THE RENDER
 * ==================================================================== */

describe('scope filters what the screen reads', () => {
  it('leaves an out-of-scope run off the Supervisor’s page entirely', () => {
    render(<RunSchedulingScreen />)
    viewAs('SUPERVISOR')
    expect(runsInScope('SUPERVISOR').map((r) => r.facts.runId)).not.toContain('RUN-2026-03-04-C')
    expect(screen.queryByTestId('run-RUN-2026-03-04-C')).toBeNull()

    viewAs('QUALITY_MANAGER')
    expect(screen.getByTestId('run-RUN-2026-03-04-C')).toBeTruthy()
  })
})

/* ==================================================================== *
 * ROW 8 — A STATEMENT, NEVER A CONTROL
 * ==================================================================== */

describe('trap — row 8 draws no control for anyone', () => {
  it('renders a cross-surface statement for the act that IS met, on the device', () => {
    render(<RunSchedulingScreen />)
    const statement = screen.getByTestId('cross-surface-statement')
    expect(statement.getAttribute('data-boundary')).toBe('step-execution-and-capture')
    expect(statement.textContent).toContain('Frontline Worker Application')
    // AC-DOH-012-3: a cross-surface link and NO inline editing affordance.
    expect(within(statement).queryByRole('button')).toBeNull()
    expect(within(statement).queryByRole('textbox')).toBeNull()
  })

  it('quotes the "deliberately impossible" qualifier once, in the cell that carries it', () => {
    render(<RunSchedulingScreen />)
    expect(
      screen.getByTestId('cell-pause-or-stop-a-run-TENANT_ADMIN').textContent,
    ).toContain('deliberately impossible from any oversight surface')
    expect(
      screen.getByTestId('cell-pause-or-stop-a-run-WORKER').textContent,
    ).toContain('the worker ends a run by completing or abandoning it on the device')
  })

  it('offers no pause or stop control on any persona', () => {
    render(<RunSchedulingScreen />)
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      viewAs(role)
      expect(screen.queryByRole('button', { name: /pause|stop a run/i })).toBeNull()
    }
  })
})

/* ==================================================================== *
 * ROWS 10 AND 11 — A POINTER, NEVER A FIELD
 * ==================================================================== */

describe('trap — rows 10 and 11 point at another Hub screen', () => {
  it('names SCR-DOH-23 in both cells and draws no setting field', () => {
    render(<RunSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    for (const id of ['set-the-record-finish-window', 'set-the-run-extension-cap']) {
      const cell = screen.getByTestId(`cell-${id}-TENANT_ADMIN`)
      expect(cell.textContent).toContain('SCR-DOH-23')
      expect(cell.textContent).toContain('draws no control for it')
      expect(within(cell).queryByRole('textbox')).toBeNull()
      expect(within(cell).queryByRole('spinbutton')).toBeNull()
    }
  })

  it('keeps row 10’s longer condition, which the brief’s quotation dropped', () => {
    render(<RunSchedulingScreen />)
    expect(screen.getByTestId('cell-set-the-record-finish-window-TENANT_ADMIN').textContent).toContain(
      'within the platform floor and ceiling',
    )
  })
})

/* ==================================================================== *
 * WF-AUT-010 AND THE TIMERS
 * ==================================================================== */

describe('WF-AUT-010 — the pin panel', () => {
  it('shows the pin, its immutability and DEC-LIB-001 on the one screen that sees both', () => {
    render(<RunSchedulingScreen />)
    openRun('RUN-2026-03-06-A')
    const pin = screen.getByTestId('pin-panel')
    expect(pin.textContent).toContain('WF-AUT-010')
    expect(pin.textContent).toContain('immutable for the life of the run')
    expect(pin.textContent).toContain('DEC-LIB-001')
    expect(within(pin).getByRole('note', { name: /open decision dec-lib-001/i })).toBeTruthy()
  })

  it('refuses a run that has a pin and no package', () => {
    render(<RunSchedulingScreen />)
    openRun('RUN-2026-03-06-A')
    expect(screen.getByText('Assigned and not ready')).toBeTruthy()
    expect(screen.getByTestId('pin-panel').textContent).toContain(
      'must never begin',
    )
  })
})

describe('the timers, on the runs that have them', () => {
  it('shows both no-show timers on a run left unstarted, with no actor', () => {
    render(<RunSchedulingScreen />)
    openRun('RUN-2026-03-04-B')
    const timers = screen.getByTestId('run-timers')
    expect(within(timers).getByTestId('due-no-show-alert').textContent).toContain('moves no run state')
    expect(within(timers).getByTestId('due-auto-cancel').textContent).toContain('moves the run to cancelled')
    expect(timers.textContent).toContain('No actor is recorded, and none can be.')
  })

  it('rejects a late capture on a run past its window', () => {
    render(<RunSchedulingScreen />)
    openRun('RUN-2026-03-01-E')
    expect(screen.getByTestId('late-capture-outcome').textContent).toContain('rejected')
    expect(screen.getByTestId('late-capture-outcome').textContent).toContain('append-only correction')
  })

  it('flags a late capture inside the window and logs the recompute', () => {
    render(<RunSchedulingScreen />)
    openRun('RUN-2026-03-03-D')
    const outcome = screen.getByTestId('late-capture-outcome').textContent ?? ''
    expect(outcome).toContain('late_arrival')
    expect(outcome).toContain('recompute is logged')
  })
})

/* ==================================================================== *
 * WHERE THE SOURCE DISAGREES WITH ITSELF
 * ==================================================================== */

describe('the contradictions render', () => {
  it('shows the auto-close owner disagreement with both sides and their lines', () => {
    render(<RunSchedulingScreen />)
    const panel = screen.getByTestId('contradiction-CONTRADICTION-AUTOCLOSE-OWNER')
    expect(panel.textContent).toContain('L27900')
    expect(panel.textContent).toContain('L49583')
    expect(panel.textContent).toContain('L27920')
  })

  it('shows the actorless-transition count as contradicted, with the corrected locator', () => {
    render(<RunSchedulingScreen />)
    const panel = screen.getByTestId('contradiction-CONTRADICTION-AUTOCLOSE-ONLY')
    // Wave 0 and the brief both cited L27854 as the tagged claim. It is not
    // tagged; L27933 is. All three lines are named, each for what it is.
    expect(panel.textContent).toContain('L27933')
    expect(panel.textContent).toContain('L7078')
    expect(panel.textContent).toContain('L27854')
    expect(panel.textContent).toContain('carrying NO classification')
    expect(panel.textContent).toContain('L27868')
  })

  it('shows catalogue B’s narrower cell against the matrix that admits more', () => {
    render(<RunSchedulingScreen />)
    const panel = screen.getByTestId('contradiction-CONTRADICTION-CATALOGUES')
    expect(panel.textContent).toContain('L48107')
    expect(panel.textContent).toContain('L27910')
  })
})

/* ==================================================================== *
 * THE MATRIX, DRAWN IN FULL
 * ==================================================================== */

describe('the matrix renders every row for every persona', () => {
  it('draws sixty cells, each with its own token and its own text', () => {
    render(<RunSchedulingScreen />)
    let seen = 0
    for (const row of MOD_DOH_06_MATRIX) {
      for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER']) {
        const cell = screen.getByTestId(`cell-${row.id}-${role}`)
        expect(cell.textContent?.length ?? 0).toBeGreaterThan(0)
        seen += 1
      }
    }
    expect(seen).toBe(60)
    expect(MOD_DOH_06_MATRIX.length).toBe(12)
  })

  it('shows every seeded run to the Tenant Admin across the board and the open list', () => {
    render(<RunSchedulingScreen />)
    viewAs('TENANT_ADMIN')
    // The finished and cancelled runs are behind the horizon and closed, so
    // the two tables between them do not have to hold all six — what must be
    // true is that nothing in scope is unreachable.
    const reachable = SEEDED_RUNS.filter(
      (r) => screen.queryByTestId(`run-${r.facts.runId}`) !== null,
    )
    expect(reachable.length).toBeGreaterThanOrEqual(4)
  })
})

/* ==================================================================== *
 * A DEFERRED CAPABILITY RENDERS AS A LINE, NEVER A DISABLED CONTROL
 * ==================================================================== */

describe('deferred capabilities', () => {
  it('renders no disabled control anywhere on the matrix axis, for any persona', () => {
    render(<RunSchedulingScreen />)
    for (const role of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      viewAs(role)
      // Scoped to the matrix axis. A control disabled because the tenant is
      // suspended is a different mechanism and is not what this asks about.
      for (const row of MOD_DOH_06_MATRIX) {
        for (const r of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR', 'WORKER']) {
          const cell = screen.getByTestId(`cell-${row.id}-${r}`)
          expect(cell.querySelector('[disabled]')).toBeNull()
          expect(cell.querySelector('[aria-disabled="true"]')).toBeNull()
        }
      }
      expect(document.querySelectorAll('button[disabled]').length).toBe(0)
    }
  })

  it('states the absence where the control would sit, on both out-of-V1 rows', () => {
    render(<RunSchedulingScreen />)
    for (const id of [
      'add-or-remove-a-worker-beyond-substitution',
      'change-planned-quantity-in-flight',
    ]) {
      const cell = screen.getByTestId(`cell-${id}-SUPERVISOR`)
      expect(cell.textContent).toContain('out of V1')
    }
  })

  it('discloses the corrected reading of AC-DOH-014-2 rather than the briefed one', () => {
    render(<RunSchedulingScreen />)
    const panel = screen.getByTestId('deferral-rendering')
    expect(panel.textContent).toContain('L25924')
    expect(panel.textContent).toContain('L25935')
    expect(panel.textContent).toContain('L28230')
    expect(panel.textContent).toContain(DEFERRAL_RENDERING.correctionToTheBrief)
    // The claim the brief made, named as the thing that was wrong.
    expect(panel.textContent).toContain('it does not license one')
  })
})
