import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Cc06LearningReadView } from '@/surfaces/cc/modules/cc-06/LearningReadView'
import { LearnedChangeApprovals } from '@/surfaces/cc/modules/cc-06/LearnedChangeApprovals'
import {
  CC06_COLUMNS,
  CC06_MATRIX,
  CC06_ROW_HELD_ELSEWHERE,
  cc06Cell,
  cc06Row,
} from '@/surfaces/cc/modules/cc-06/matrix'
import {
  CC06_LEARNING_VIEW_CONTENT,
  CC06_PACKAGE_TESTS,
  CC06_XSURFACE_ROWS,
  ccLaneBApplication,
} from '@/surfaces/cc/modules/cc-06/lane-b'

/**
 * `MOD-CC-06` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually SEES, because on this module
 * the two answers come apart three times: a correct transcription of row 7
 * rendered through the build's one rule draws nothing at all where the source
 * names a destination; a proposal whose field the source does not classify
 * must be DISABLED with the missing element named rather than absent or
 * actionable; and a screen that renders only §26.7's prohibition renders no
 * Lane B path at all while every transcription gate stays green.
 *
 * ── THREE BEATEN-GATE SHAPES ARE ACTIVE HERE ─────────────────────────────
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS, so a check that a disabled
 *    control carries its reason passes when the paragraph beside it carries
 *    the same words. Every disabled reason below is resolved through
 *    `aria-describedby` off the control itself, with `hidden === false`
 *    asserted too, because a `hidden` attribute defeats the same read.
 *  - A NAME-KEYED CELL LOOKUP IS BLIND TO COLUMN ORDER. Reversing the body's
 *    columns leaves every `data-testid` on its own value and the gate green,
 *    with every cell under the wrong heading. The order is asserted
 *    positionally alongside, on purpose.
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`. Every cell assertion
 *    is exact equality against the model's own cell text, which the unit
 *    suite independently pins to its source line.
 */

afterEach(cleanup)

const RENDER = () => render(<LearnedChangeApprovals viewerRole="QUALITY_MANAGER" />)

/**
 * THE FROZEN SOURCE, READ HERE TOO, AND THE PLANT CAMPAIGN IS WHY.
 *
 * Two gates below first took their expected values from the model they were
 * checking the RENDER of — `CC06_COLUMNS` for the header order and
 * `CC06_XSURFACE_ROWS` for the §26.7 cells. Both stayed GREEN under plants
 * that changed the model, because the render moved with it: the catalogued
 * "allowance taking its allowed string from the value under test", found by
 * planting rather than by reading. The unit suite pins those models to the
 * source, so the pair was covered — but neither gate was worth anything on
 * its own, and a gate that is only sound because another one exists is a gate
 * that stops being sound the day the other is edited. Both now read the
 * source line at test time.
 */
const LINES = readFileSync(join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'), 'utf8').split('\n')
const srcLine = (n: number): string => LINES[n - 1] ?? ''
const cellsOf = (line: string): readonly string[] => {
  const parts = line.split('|')
  return parts.slice(1, parts.length - 1).map((c) => c.trim())
}
const columnIndex = (headerLine: number, column: string): number => {
  const i = cellsOf(srcLine(headerLine)).findIndex((c) => c.replace(/`/g, '').trim() === column)
  expect(i, `column "${column}" is not in the header at L${headerLine}`).toBeGreaterThanOrEqual(0)
  return i
}

/** A disabled control's reason, resolved off the control rather than welded. */
function reasonOf(control: HTMLElement): HTMLElement {
  const id = control.getAttribute('aria-describedby')
  expect(id, 'a disabled control with no aria-describedby states no reason').toBeTruthy()
  const reason = document.getElementById(id as string)
  expect(reason).not.toBeNull()
  expect((reason as HTMLElement).hidden).toBe(false)
  return reason as HTMLElement
}

describe('the eight rows render, header-keyed and whole', () => {
  // FAILS IF: a row or a cell stops rendering, or a value drifts from the
  // model. Forty cells asserted by row ordinal and column NAME.
  // PLANTED: deleted the `<td>` for the `Source` column in
  // `LearnedChangeApprovals.tsx`. STAYED GREEN, correctly — the source column
  // is not a persona column. Re-planted by dropping row 5 from the body map.
  // RED — "expected 8 to be 9" on the row count.
  it('renders every cell of every row under its own column', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-06-matrix')).getAllByRole('row')).toHaveLength(
      CC06_MATRIX.length + 1,
    )
    for (const row of CC06_MATRIX) {
      for (const column of CC06_COLUMNS) {
        expect(
          screen.getByTestId(`cc-06-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the body's columns are reordered while every value stays on its
  // own `data-testid`. Positional, and it is the only check that can see it.
  // PLANTED: changed the body's `CC06_COLUMNS.map` to
  // `[...CC06_COLUMNS].reverse().map`. RED here and GREEN on the gate above,
  // which is why both exist.
  // PLANTED (second): swapped 'Tenant Admin' and 'Worker' in `CC06_COLUMNS`
  // itself. STAYED GREEN while the expectation came from `CC06_COLUMNS` — the
  // render moved with the model. The order now comes from the SOURCE header
  // line and the same plant is RED.
  it('renders the columns in the header’s order, positionally', () => {
    RENDER()
    const sourceOrder = cellsOf(srcLine(37292))
    const table = screen.getByTestId('cc-06-matrix')
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((h) => h.textContent)
    expect(headers).toEqual([...sourceOrder, 'Source'])
    for (const row of CC06_MATRIX) {
      const cells = within(screen.getByTestId(`cc-06-row-${row.ordinal}`))
        .getAllByRole('cell')
        .map((c) => c.textContent)
      const line = Number(row.sourceRef.slice(1))
      expect(cells).toEqual([...cellsOf(srcLine(line)).slice(1), row.sourceRef])
    }
  })
})

describe('the Lane B path renders, in all three of its outcomes', () => {
  // FAILS IF: the path stops rendering — which is precisely what a module
  // built from §26.7's prohibition alone would ship, with every transcription
  // gate still green.
  // PLANTED: removed the whole `CC06_PACKAGE_TESTS.map(…)` block from
  // `LearnedChangeApprovals.tsx`. RED on all three.
  it('draws a landing for each package test, and a refusal for the third', () => {
    RENDER()
    for (const test of CC06_PACKAGE_TESTS) {
      const panel = screen.getByTestId(`cc-06-path-${test}`)
      expect(panel.getAttribute('data-outcome')).toBe(ccLaneBApplication(test).kind)
    }
    expect(screen.getByTestId('cc-06-path-package-borne').getAttribute('data-outcome')).toBe(
      'applies',
    )
    expect(screen.getByTestId('cc-06-path-server-only').getAttribute('data-outcome')).toBe('applies')
    expect(screen.getByTestId('cc-06-path-not-enumerated').getAttribute('data-outcome')).toBe(
      'not-decidable',
    )
    // The two landings are different, on screen and not only in the model.
    expect(screen.getByTestId('cc-06-path-package-borne').textContent).toContain(
      'auto-publishes a patch version',
    )
    expect(screen.getByTestId('cc-06-path-server-only').textContent).toContain(
      'applies immediately',
    )
    expect(screen.getByTestId('cc-06-path-server-only').textContent).not.toContain(
      'auto-publishes a patch version',
    )
  })

  // FAILS IF: an unclassifiable proposal renders as actionable, or as absent,
  // or disabled without naming what is missing. It must be DISABLED and it
  // must name the ONE element — that is the whole content of FB-CC-QUEUE, and
  // the reason is read off the control rather than off the paragraph beside
  // it, because `textContent` welds the two.
  // PLANTED: dropped the `missingElement` prop from the `WriteControl` in the
  // not-decidable arm. RED — the control became enabled.
  // PLANTED (second, for the redundancy): kept `missingElement` and deleted
  // the explanatory paragraph above it. STAYED GREEN, correctly — the gate
  // reads the control's own reason and not the prose. Both removals together:
  // RED, on the control.
  it('disables the undecidable proposal and names the missing element on the control', () => {
    RENDER()
    const panel = screen.getByTestId('cc-06-path-not-enumerated')
    const control = within(panel).getByRole('button')
    expect(control.getAttribute('aria-disabled')).toBe('true')
    const out = ccLaneBApplication('not-enumerated')
    if (out.kind !== 'not-decidable') throw new Error('unreachable')
    const reason = reasonOf(control)
    expect(reason.textContent).toContain(out.missingElement)
    expect(reason.textContent).toContain('Not decidable')
    // The waiting clock keeps running and nothing expires: the branch's own
    // sentence, and the module's `AC-CC-263` in one.
    expect(reason.textContent).toContain('never expires on its own')
    // And nothing is queued, in any state.
    expect(reason.textContent).toContain('never queued, in any state')
  })
})

describe('the configuration boundary renders as a boundary', () => {
  // FAILS IF: either §26.7 row stops rendering, or the note is drawn as a
  // contradiction. Both cells are asserted whole — the truncated
  // transcription of the middle row is the defect this catches on screen.
  // PLANTED: set `data-is-contradiction` to hard-coded 'true'. RED.
  // PLANTED (second): truncated L49594's cell in `lane-b.ts` to what a
  // 230-character read of the line produces — the defect that actually
  // happened while writing this module. STAYED GREEN while the expectation
  // came from `CC06_XSURFACE_ROWS`, because the render moved with the model.
  // The cell now comes from the SOURCE line, header-keyed, and the same plant
  // is RED here as well as in the unit suite.
  it('draws both rows with their whole Client Command Center cells', () => {
    RENDER()
    const ccIndex = columnIndex(49574, 'Client Command Center')
    for (const row of CC06_XSURFACE_ROWS) {
      expect(
        screen.getByTestId(`cc-06-xsurface-cc-${row.line}`).textContent,
        `L${row.line}`,
      ).toBe(cellsOf(srcLine(row.line))[ccIndex])
    }
    expect(
      screen.getByTestId('cc-06-configuration-boundary').getAttribute('data-is-contradiction'),
    ).toBe('false')
    // The cost of the one-sided reading is on screen, not only in a comment.
    expect(screen.getByTestId('cc-06-boundary-cost').textContent).toContain('AC-CC-060')
  })

  // FAILS IF: row 7 draws a control, or draws nothing. `explicitlyProhibited`
  // renders as nothing at all, so a faithful transcription through the one
  // rule produces an empty cell where the source names a destination.
  // PLANTED: replaced the `CrossSurfaceLink` with a `WriteControl` carrying
  // the row's prohibition. RED — no link element, and a button appeared.
  it('draws a link for row 7 and no control anywhere near it', () => {
    RENDER()
    const link = screen.getByTestId('cc-cross-surface-link')
    expect(link.getAttribute('data-cell-id')).toBe('cc-06-edit-configured-value')
    expect(within(link).queryByRole('button')).toBeNull()
    // Scoped to the link. The capability also appears as the matrix row's own
    // header, and an unscoped lookup that matched either would be satisfied
    // by the transcription alone with the link deleted.
    expect(within(link).getByText(cc06Row(CC06_ROW_HELD_ELSEWHERE).capability)).toBeTruthy()
  })
})

describe('the decision row is drawn as the rows state it', () => {
  // FAILS IF: the Supervisor's prohibition draws a control of any kind. A
  // disabled one would invite the belief the right exists somewhere; the
  // source's token draws nothing, and the refusal note is what stands in its
  // place.
  // PLANTED: changed the `deny('explicitlyProhibited', …)` to
  // `deny('unavailable', …)`. RED — a button appeared.
  it('draws nothing for the Supervisor’s approve cell, and states why', () => {
    RENDER()
    const approve = screen.getByTestId('cc-06-supervisor-approve')
    expect(within(approve).queryByRole('button')).toBeNull()
    expect(within(approve).getByRole('note').textContent).toContain(
      'Supervisors observe and annotate',
    )
  })

  // FAILS IF: row 2's condition is dropped, which is what a prefix classifier
  // does to it — it reads `Allowed with conditions` as `Allowed` and the
  // annotation-only limit disappears from the screen entirely.
  // PLANTED: rendered `annotate.cells.Supervisor.token` in place of `.note`.
  // RED — 'annotation only, no decision' was no longer on screen.
  it('draws the Supervisor’s annotation control with its condition verbatim', () => {
    RENDER()
    const annotate = screen.getByTestId('cc-06-supervisor-annotate')
    expect(within(annotate).getByRole('button')).toBeTruthy()
    expect(annotate.textContent).toContain(cc06Cell(2, 'Supervisor').note as string)
    expect(annotate.textContent).toContain('annotation only, no decision')
  })
})

describe('the learning read view, which mounts on another module’s screen', () => {
  // FAILS IF: the component offers any control at all. FUNC-CC-0605-1-1
  // prohibits every role from acting from this view, and a disabled control
  // would imply a condition that could become true.
  // PLANTED: added a disabled `WriteControl` for row 5 to
  // `LearningReadView.tsx`. RED.
  it('renders no control of any kind, disabled or otherwise', () => {
    render(<Cc06LearningReadView />)
    const view = screen.getByTestId('cc-06-learning-read-view')
    expect(within(view).queryAllByRole('button')).toHaveLength(0)
    expect(within(view).queryAllByRole('link')).toHaveLength(0)
  })

  // FAILS IF: either feature stops rendering. The register names one and the
  // screen's own name is the other's, and the component renders both so the
  // mount is correct under either reading.
  // PLANTED: deleted the aging section. RED.
  it('renders both features the two readings of the register name', () => {
    render(<Cc06LearningReadView />)
    for (const item of CC06_LEARNING_VIEW_CONTENT) {
      expect(screen.getByTestId('cc-06-learning-content').textContent).toContain(item)
    }
    expect(screen.getByTestId('cc-06-aging').textContent).toContain('never expires')
    expect(screen.getByTestId('cc-06-aging-marker').textContent).toContain('Pushed')
    expect(screen.getByTestId('cc-06-no-switch').getAttribute('data-switch-exists')).toBe('false')
    expect(screen.getByTestId('cc-06-feature-readings').textContent).toContain('FEAT-CC-0603')
    expect(screen.getByTestId('cc-06-feature-readings').textContent).toContain('FEAT-CC-0605')
  })
})

describe('the client boundary, which a component suite cannot see by mounting', () => {
  // FAILS IF: any file of this module acquires `'use client'`. A component
  // suite mounts the component and the client boundary only exists in a
  // build, so this is read off the file text — four panels shipped an
  // undefined module id in slice 7 exactly this way.
  // PLANTED: added `'use client'` to `LearningReadView.tsx`. RED.
  //
  // THE FIRST SPELLING OF THIS GATE COULD NOT PASS, which is the opposite
  // failure and just as useless: `not.toContain("'use client'")` was red on
  // the clean tree, because two files EXPLAIN in a comment why they must not
  // acquire the directive. A directive is a STATEMENT, so the check is
  // anchored at both ends of a line — a comment mentioning it is prose and a
  // line that IS it is the defect.
  it('has no `use client` directive on any file of this module', () => {
    const dir = join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-06')
    const files = ['matrix.ts', 'lane-b.ts', 'LearnedChangeApprovals.tsx', 'LearningReadView.tsx']
    for (const name of files) {
      const lines = readFileSync(join(dir, name), 'utf8').split('\n')
      expect(
        lines.filter((l) => /^\s*(['"])use client\1;?\s*$/.test(l)),
        name,
      ).toHaveLength(0)
    }
  })
})
