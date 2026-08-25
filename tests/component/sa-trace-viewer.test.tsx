import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ROLES } from '@/domain/roles'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { TraceViewerAbsence } from '../../app/super-admin/trace-viewer/TraceViewerAbsence'

const MODULE = saModuleById('MOD-SA-06')
const PLATFORM_ROLES = ROLES.filter((r) => r.domain === 'PLATFORM')

/** D10 / spec §10 gate 4, word-bounded so "designed"/"assigned" do not mask a real hit. */
const FORBIDDEN_WORDS = /\b(tamper-evident|chained|signed|verified)\b/i

function textOf(container: HTMLElement): string {
  return container.textContent ?? ''
}

describe('MOD-SA-06 Trace Viewer — the honest absence (D9)', () => {
  it('renders under the console shell with band and module id as an annotation, one h1', () => {
    render(<TraceViewerAbsence />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-06 · Definition layer/)).toBeDefined()
    expect(screen.getByRole('main')).toBeDefined()
  })

  it('draws ZERO CONTROLS — the whole screen is a record, not a viewer', () => {
    const { container } = render(<TraceViewerAbsence />)
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('select')).toBeNull()
    expect(container.querySelector('textarea')).toBeNull()
    expect(container.querySelector('form')).toBeNull()
    expect(container.querySelector('[role=switch]')).toBeNull()
    expect(container.querySelector('[role=button]')).toBeNull()
    expect(container.querySelector('[tabindex]')).toBeNull()
    expect(container.querySelector('[aria-disabled]')).toBeNull()
  })

  it('renders the missing viewer as ABSENT — a one-line note, not a disabled control', () => {
    render(<TraceViewerAbsence />)
    const note = screen.getByRole('note')
    expect(note.textContent).toMatch(/no trace-viewer screen is drawn here/i)
    expect(note.textContent).toMatch(/for any account, including the root/i)
    expect(note.tagName).toBe('P')
  })

  it('cites the decision record: D9, DEC-TRACE-001 and DEC-SEC-020 at L104506', () => {
    const { container } = render(<TraceViewerAbsence />)
    const text = textOf(container)
    expect(text).toContain('D9')
    expect(text).toContain('DEC-TRACE-001')
    expect(text).toContain('DEC-SEC-020')
    expect(text).toContain('L104506')
    expect(text).toMatch(/becomes the ambient-browsing path the source forbids/)
  })

  it('shows both sides of the contradiction with their line numbers, six against four', () => {
    const { container } = render(<TraceViewerAbsence />)
    const text = textOf(container)
    for (const line of ['L42799', 'L43885', 'L47798', 'L48736', 'L86043', 'L4682']) {
      expect(text, `no-viewer passage ${line}`).toContain(line)
    }
    for (const line of ['L57772', 'L65489', 'L97154', 'L2173']) {
      expect(text, `viewer passage ${line}`).toContain(line)
    }
  })

  it('shows all four platform roles, and gives none of them a viewer — root included', () => {
    render(<TraceViewerAbsence />)
    expect(PLATFORM_ROLES).toHaveLength(4)
    const table = screen.getByRole('table', { name: /what each console role sees/i })
    // One header row plus one row per platform role, and no fifth.
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(PLATFORM_ROLES.length + 1)
    PLATFORM_ROLES.forEach((role, i) => {
      const row = rows[i + 1]
      expect(row, role.id).toBeDefined()
      const cells = within(row as HTMLElement).getAllByRole('cell')
      expect(cells[0]?.textContent, role.id).toBe(role.name)
      // All four read this decision record (D16: all four read unless a rule says otherwise)...
      expect(cells[1]?.textContent, role.id).toMatch(/Read/)
      // ...and not one of them, root included, is offered a viewer.
      expect(cells[2]?.textContent, role.id).toMatch(/Absent/)
    })
  })

  it('names every applicable screen state and excludes the frontline-only STATE-07', () => {
    const { container } = render(<TraceViewerAbsence />)
    const text = textOf(container)
    const applicable = SA_APPLICABLE_STATES
    expect(applicable).toHaveLength(12)
    for (const state of applicable) {
      expect(text, state.id).toContain(state.id)
    }
    expect(text).not.toContain('STATE-07')
  })

  it('STATE-11: with every artificial-intelligence model unavailable the module stays operable', () => {
    const { container: normal } = render(<TraceViewerAbsence />)
    const { container: degraded } = render(<TraceViewerAbsence aiModelsUnavailable />)

    // AC-SA-000-09: the whole recorded decision is still readable, unchanged.
    for (const marker of ['DEC-SEC-020', 'L104506', 'OBJ-SA-TRACE', 'DEC-TRACE-001']) {
      expect(textOf(degraded), marker).toContain(marker)
    }
    expect(degraded.querySelectorAll('h2')).toHaveLength(normal.querySelectorAll('h2').length)

    // ...and the unavailability is stated rather than silently ignored.
    expect(textOf(degraded)).toMatch(/every artificial-intelligence model is unavailable/i)
    expect(textOf(degraded)).toMatch(/invokes no model/i)

    // Still zero controls in the degraded state.
    expect(degraded.querySelector('button')).toBeNull()
  })

  it('resolves no link to record-level tenant content, and offers no drill-through at all', () => {
    const { container } = render(<TraceViewerAbsence />)
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '')
    expect(hrefs.length).toBeGreaterThan(0) // the breadcrumb back to the console
    for (const href of hrefs) {
      expect(href, href).toMatch(/^\/super-admin\/?$/)
    }
    // The three named access classes are the only route to tenant content.
    expect(textOf(container)).toMatch(/named access class/i)
  })

  it('renders an unspecified-in-source panel naming each missing affordance', () => {
    render(<TraceViewerAbsence />)
    const panel = screen.getByRole('region', { name: /unspecified in source/i })
    const text = panel.textContent ?? ''
    expect(text).toMatch(/zero controls/i)
    expect(text).toContain('DEC-SEC-020')
    expect(text).toContain('DEC-RETRIEVE-001')
    expect(text).toContain('DEC-DELETE-001')
    expect(text).toContain('DEC-TRACE-001')
    // R5-A01. This panel used to say AC-SA-06-01, -02, -05, -06 and -07 were
    // "not carried by the extraction" and their content unknown. L43962-L43969
    // carry all eight, so none of the five may be named as a silence here.
    for (const n of ['01', '02', '05', '06', '07']) {
      expect(text).not.toContain(`AC-SA-06-${n}`)
    }
  })

  it('renders all eight acceptance criteria and says where each is borne', () => {
    const { container } = render(<TraceViewerAbsence />)
    const text = textOf(container)
    for (let n = 1; n <= 8; n += 1) {
      const id = `AC-SA-06-0${n}`
      expect(text, `${id} is not rendered`).toContain(id)
    }
    // Seven of the eight are backend obligations with no screen, and saying so
    // is a different statement from the source being silent about them.
    expect(text).toMatch(/Backend obligation with no screen/i)
    // AC-SA-06-07 requires the absence to be stated in the console. This route
    // IS that statement -- the page was abstaining from its own obligation.
    expect(text).toMatch(/THIS SCREEN IS THIS CRITERION/i)
  })

  it('states plainly that it renders no aggregate rather than rendering a zero', () => {
    const { container } = render(<TraceViewerAbsence />)
    expect(textOf(container)).toMatch(/renders no aggregate/i)

    // AC-SA-01-03: never a zero standing in for an absent count. An aggregate is
    // rendered on this console as a value standing on its own — a stat tile, a
    // table cell, a definition value. So: no element anywhere in this tree may
    // have a bare number as its entire text. (Line refs like L4682 and ids like
    // STATE-01 are not bare numbers and are unaffected.)
    const bareNumbers = [...container.querySelectorAll('*')]
      .map((el) => el.textContent?.trim() ?? '')
      .filter((t) => /^-?\d[\d,.]*$/.test(t))
    expect(bareNumbers, 'a bare number rendered as a value').toEqual([])

    // ...and no count of the module's objects in running prose either, which is
    // the same defect wearing a label.
    expect(textOf(container)).not.toMatch(
      /\b\d[\d,]*\s+(?:traces?|trace records?|decision records?)\b/i,
    )
    expect(textOf(container)).not.toMatch(
      /\b(?:traces?|decision records?)\b[^.]{0,40}?[:=]\s*\d/i,
    )
  })

  it('uses none of the four forbidden words, and no metric below tenant-month', () => {
    const { container } = render(<TraceViewerAbsence />)
    const text = textOf(container)
    expect(text).not.toMatch(FORBIDDEN_WORDS)
    expect(text).not.toMatch(/per-worker|per worker|per-shift|per hour|\bper-run\b|\brate\b/i)
  })

  it('carries the prototype disclosure', () => {
    render(<TraceViewerAbsence />)
    expect(screen.getByText(/Simulated behaviour only/)).toBeDefined()
  })
})
