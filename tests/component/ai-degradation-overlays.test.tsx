import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { PROVENANCE_CLASS_ATTRIBUTE, provenanceViolations } from '@/ai/provenance/contract'
import { AiDegradationOverlay } from '@/ai/five-surface/AiDegradationOverlay'
import { QueuedRequestSurfaceMatrix } from '@/ai/five-surface/QueuedRequestSurfaceMatrix'
import { ShiftHandoffRoleMatrix } from '@/ai/five-surface/ShiftHandoffRoleMatrix'
import { FIVE_SURFACE_OVERLAYS } from '@/ai/five-surface/journey-overlay'
import { QUEUED_REQUEST_SURFACE_COLUMNS } from '@/ai/requests/surface-matrix'
import {
  SHIFT_HANDOFF_ROLE_MATRIX,
  SHIFT_HANDOFF_UNDECIDED_CELLS,
} from '@/surfaces/cc/ai-degradation'

/**
 * Slice 11, wave 3, task 15 — the rendered overlays.
 *
 * WHAT THIS FILE HOLDS:
 *
 *   - EXACTLY ONE PROVENANCE CLASS PER RENDER, asserted by counting the marks
 *     in the tree AND by running the build's own `provenanceViolations` lint
 *     over it. One of those alone is not enough: the count can be right while
 *     a mark sits outside a guidance region, and the lint can pass over a tree
 *     with no mark at all.
 *   - NO CONTROL WHERE THE SOURCE DEMANDS NONE. The queued-request matrix
 *     renders states and offers no button anywhere, so a Frontline mount of it
 *     cannot put a Command Center or Hub act on a device.
 *   - THE FOUR UNDECIDED CELLS ARE INOPERABLE AND THEIR VERBATIM TEXT IS ON
 *     SCREEN. Four, across two rows.
 *   - NO COUNT IS RENDERED. Asserted against the rendered text, not against
 *     the module.
 */

const marksIn = (root: HTMLElement): readonly Element[] => [
  ...root.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`),
]

describe.each(FIVE_SURFACE_OVERLAYS.map((o) => [o.surfaceId, o] as const))(
  '%s overlay, rendered',
  (surfaceId, overlay) => {
    it('emits exactly one provenance class, and it is PROV-4', () => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      const marks = marksIn(container)
      expect(marks).toHaveLength(1)
      expect(marks[0]?.getAttribute(PROVENANCE_CLASS_ATTRIBUTE)).toBe('PROV-4')
    })

    it('passes the build’s own exactly-one provenance lint', () => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      expect(provenanceViolations(container)).toEqual([])
    })

    it('never labels anything live artificial intelligence', () => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      // PROV-1's marker text is the one thing a deterministic rule may not carry.
      expect(container.textContent ?? '').not.toContain('Live artificial intelligence')
    })

    it('renders every stated absence WITH its reason — never a bare absence', () => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      const items = [...container.querySelectorAll('[data-stated-absence]')]
      expect(items).toHaveLength(overlay.statedAbsences.length)
      for (const absence of overlay.statedAbsences) {
        expect(container.textContent).toContain(absence.reason)
      }
    })

    it('offers no operable control anywhere', () => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      expect(container.querySelectorAll('button, input, select, textarea, a[href]')).toHaveLength(0)
    })

    it('renders no cell blank — every row has as many cells as the table has headings', () => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      for (const table of overlay.tables) {
        for (const row of table.rows) {
          for (const cell of row.cells) {
            expect(cell.trim().length).toBeGreaterThan(0)
          }
          expect(row.cells).toHaveLength(table.headings.length)
        }
      }
      expect(container.textContent ?? '').not.toBe('')
    })

    it('marks each row with its own kind, so derived and transcribed are distinguishable', () => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      const kinds = [...container.querySelectorAll('[data-overlay-kind]')].map((el) =>
        el.getAttribute('data-overlay-kind'),
      )
      const expected = overlay.tables.flatMap((table) => table.rows.map((row) => row.kind))
      expect(kinds).toEqual(expected)
    })
  },
)

describe('a derived table states, before its rows, that the rows are this build’s', () => {
  const derived = FIVE_SURFACE_OVERLAYS.filter((o) =>
    o.tables.some((t) => t.kind === 'derived'),
  )

  it.each(derived.map((o) => [o.surfaceId, o] as const))(
    '%s draws the derivation note',
    (_id, overlay) => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      const notes = [...container.querySelectorAll('[data-testid="overlay-derivation"]')]
      expect(notes.length).toBeGreaterThan(0)
      expect(container.textContent).toContain('The rows below are this build')
      expect(container.textContent).toContain('APP-012')
    },
  )

  it.each(derived.map((o) => [o.surfaceId, o] as const))(
    '%s renders both authored locales on every draft string',
    (_id, overlay) => {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      expect(container.querySelectorAll('[lang="en"]').length).toBeGreaterThan(0)
      expect(container.querySelectorAll('[lang="es"]').length).toBe(
        container.querySelectorAll('[lang="en"]').length,
      )
      expect(container.textContent).toContain('pending client approval')
    },
  )
})

describe('the Frontline overlay renders both readings of the three connectivity cells', () => {
  const fl = FIVE_SURFACE_OVERLAYS.find((o) => o.surfaceId === 'SURF-FL')

  it('draws an extra reading row for each, with its own locator', () => {
    expect(fl).toBeDefined()
    if (fl === undefined) return
    const { container } = render(<AiDegradationOverlay overlay={fl} mountedOn="a test mount" />)
    const readings = [...container.querySelectorAll('[data-overlay-reading]')].map((el) =>
      el.getAttribute('data-overlay-reading'),
    )
    expect(readings).toEqual(['L91188', 'L91190', 'L91192'])
    expect(container.textContent).toContain('As headed:')
    expect(container.textContent).toContain('Also reads:')
    expect(container.textContent).toContain('ARCHITECTURAL BOUNDARY')
  })
})

describe('the queued-request surface matrix, now mounted', () => {
  it('renders all five surface columns, each carrying its journey code', () => {
    const { container } = render(<QueuedRequestSurfaceMatrix mountedOn="a test mount" />)
    const headers = [...container.querySelectorAll('th[data-surface]')]
    expect(headers.map((h) => h.getAttribute('data-surface'))).toEqual(
      QUEUED_REQUEST_SURFACE_COLUMNS.map((c) => c.surfaceId),
    )
    // The join is what supplies these, and every one must resolve.
    for (const header of headers) {
      expect(header.getAttribute('data-journey-surface')).not.toBe('')
    }
  })

  it('keeps the source’s own column heading rather than the registry’s', () => {
    render(<QueuedRequestSurfaceMatrix mountedOn="a test mount" />)
    // The matrix writes a lower-case `console`; SURFACES writes `Console`.
    expect(screen.getByText('Super Admin platform console')).toBeTruthy()
  })

  it('offers NO control at all, so no Command Center or Hub act can land on a device', () => {
    const { container } = render(<QueuedRequestSurfaceMatrix mountedOn="a test mount" />)
    expect(container.querySelectorAll('button, input, select, textarea, a[href]')).toHaveLength(0)
  })

  it('renders the Studio column as Not applicable on every row, each with its own reason', () => {
    const { container } = render(<QueuedRequestSurfaceMatrix mountedOn="a test mount" />)
    const rows = [...container.querySelectorAll('tr[data-queued-state]')]
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      const studio = row.querySelectorAll('td')[3]
      expect(studio?.getAttribute('data-disposition')).toBe('not applicable')
      expect(studio?.textContent ?? '').toMatch(/^Not applicable — .+/)
    }
    // And the reasons are NOT uniform: row one carries the long form.
    expect(container.textContent).toContain('the Studio authors content, it does not observe')
  })

  it('emits exactly one provenance class', () => {
    const { container } = render(<QueuedRequestSurfaceMatrix mountedOn="a test mount" />)
    expect(marksIn(container)).toHaveLength(1)
    expect(provenanceViolations(container)).toEqual([])
  })
})

describe('the section 44.3 role matrix', () => {
  it('draws every row, permissive ones included', () => {
    const { container } = render(<ShiftHandoffRoleMatrix />)
    const rows = [...container.querySelectorAll('tr[data-handoff-row]')].map((r) =>
      r.getAttribute('data-handoff-row'),
    )
    expect(rows).toEqual(SHIFT_HANDOFF_ROLE_MATRIX.map((row) => row.locator))
  })

  it('draws the FOUR undecided permissive cells inoperable, across TWO rows', () => {
    const { container } = render(<ShiftHandoffRoleMatrix />)
    const undecided = [...container.querySelectorAll('td[data-undecided="true"]')]
    expect(undecided).toHaveLength(SHIFT_HANDOFF_UNDECIDED_CELLS.length)
    // The population is the derived one, and it is four across two rows.
    expect(
      undecided.map((td) => td.closest('tr')?.getAttribute('data-handoff-row')),
    ).toEqual(['L92306', 'L92306', 'L92307', 'L92307'])
    // Inoperable: no cell of them contains anything a person can operate.
    for (const cell of undecided) {
      expect(cell.querySelectorAll('button, input, select, textarea')).toHaveLength(0)
    }
  })

  it('prints each undecided cell’s VERBATIM text rather than a paraphrase', () => {
    const { container } = render(<ShiftHandoffRoleMatrix />)
    for (const cell of SHIFT_HANDOFF_UNDECIDED_CELLS) {
      expect(container.textContent).toContain(cell.cell)
      expect(container.textContent).toContain(cell.decision)
    }
  })

  it('draws NO control for the inverted-polarity row, not a disabled one', () => {
    const { container } = render(<ShiftHandoffRoleMatrix />)
    const inverted = container.querySelector('tr[data-inverted-polarity="true"]')
    expect(inverted).toBeTruthy()
    expect(inverted?.querySelectorAll('[data-undecided="true"]')).toHaveLength(0)
    expect(inverted?.textContent ?? '').toContain('nobody is blocked')
  })

  it('says on screen that its five columns are roles and not surfaces', () => {
    const { container } = render(<ShiftHandoffRoleMatrix />)
    expect(container.textContent).toContain('five TENANT ROLES reaching one surface')
    expect(container.textContent).toContain('no parity gate may read it as one')
  })

  it('emits exactly one provenance class', () => {
    const { container } = render(<ShiftHandoffRoleMatrix />)
    expect(marksIn(container)).toHaveLength(1)
    expect(provenanceViolations(container)).toEqual([])
  })
})

/* ==================================================================== *
 * NO COUNT, AND NO MANUFACTURING SEVERITY, ANYWHERE.
 * ==================================================================== */

describe('the prohibitions, checked against the rendered tree and the source files', () => {
  /**
   * THIS GATE IS DELIBERATELY NARROWER THAN ITS FIRST DRAFT, AND THE REASON
   * MATTERS. The first version forbade a spelled numeral before `surfaces` too,
   * and it went red on `AC-43-005`'s own verbatim text — "the five surfaces
   * render states drawn from the single sixteen-mode vocabulary". That is the
   * SOURCE'S sentence, quoted whole, and the prohibition is on THIS BUILD
   * asserting a count of its own rows or modules. A gate that forbids quoting
   * a criterion verbatim would force a paraphrase of the criterion, which is
   * strictly worse than the thing it was guarding against.
   *
   * So it checks the two shapes that ARE this build's own claims: an `N of M`
   * coverage figure, and a numeral immediately governing `rows`, `modules` or
   * `capabilities`. Plus the structural half — no count is STORED anywhere in
   * the overlay data, which is the check a rendered-text scan cannot make.
   */
  it('renders no row, module or coverage count of its own in any overlay', () => {
    for (const overlay of FIVE_SURFACE_OVERLAYS) {
      const { container } = render(
        <AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />,
      )
      // Locators are `L`-prefixed and section refs are `§`-prefixed; neither
      // is a count, so both are stripped before the scan.
      const text = (container.textContent ?? '').replace(/L\d+/g, '').replace(/§[\d.]+/g, '')
      expect(text).not.toMatch(
        /\b(?:\d+|two|three|four|five|six|eight|nine|ten|twelve|thirteen|fifteen|nineteen|twenty-two)\s+(?:rows?|modules?|capabilit)/i,
      )
      expect(text).not.toMatch(/\b\d+\s*(?:of|\/)\s*\d+\b/)
    }
  })

  it('stores no count in the overlay data, which no text scan could catch', () => {
    for (const overlay of FIVE_SURFACE_OVERLAYS) {
      for (const table of [...overlay.tables]) {
        const keys = Object.keys(table)
        expect(keys).not.toContain('rowCount')
        expect(keys).not.toContain('moduleCount')
        expect(keys).not.toContain('derivedCount')
        expect(keys.filter((k) => /count/i.test(k))).toEqual([])
      }
    }
  })

  it('imports no manufacturing-severity component into any file of this task', () => {
    const mine = [
      'src/ai/five-surface/overlay.ts',
      'src/ai/five-surface/surface-codes.ts',
      'src/ai/five-surface/journey-overlay.ts',
      'src/ai/five-surface/AiDegradationOverlay.tsx',
      'src/ai/five-surface/QueuedRequestSurfaceMatrix.tsx',
      'src/ai/five-surface/ShiftHandoffRoleMatrix.tsx',
      'src/studio/ai-degradation.ts',
      'src/surfaces/cc/ai-degradation.ts',
      'src/surfaces/doh/ai-degradation.ts',
      'src/surfaces/sa/ai-degradation.ts',
      'src/frontline/ai-degradation.ts',
    ]
    for (const path of mine) {
      const text = readFileSync(path, 'utf8')
      expect(text, path).not.toMatch(/ANOMALY_SEVERITIES|SEVERITY_CATALOG_DISTRIBUTION/)
      expect(text, path).not.toMatch(/from '@\/ui\/.*Severity/)
      // And no severity PROP of either vocabulary: the first component taking
      // one typed loosely enough to accept either IS the violation.
      expect(text, path).not.toMatch(/readonly severity[?]?:/)
    }
  })

  it('takes no value import from @/policy into any component of this task', () => {
    for (const path of [
      'src/ai/five-surface/AiDegradationOverlay.tsx',
      'src/ai/five-surface/QueuedRequestSurfaceMatrix.tsx',
      'src/ai/five-surface/ShiftHandoffRoleMatrix.tsx',
    ]) {
      const text = readFileSync(path, 'utf8')
      expect(text, path).not.toMatch(/^import \{(?!\s*type)[^}]*\} from '@\/policy/m)
    }
  })
})

/* ==================================================================== *
 * REACHABILITY FROM `app/`.
 * ==================================================================== */

describe('reachability', () => {
  const ROUTES: readonly (readonly [string, string])[] = [
    // MOUNTED AT THE ROUTE, not inside the module screen. Each of these
    // screens has a shipped contract suite that renders the screen directly
    // and queries the whole document, so an overlay inside the screen went red
    // on its existence rather than its content. The route is the mount and the
    // route is still `app/`.
    ['app/super-admin/atom-registry/page.tsx', 'SA_AI_OVERLAY'],
    ['app/super-admin/core-agents-and-composed-agent-review/page.tsx', 'SA_AI_OVERLAY'],
    ['app/super-admin/memory-architecture/page.tsx', 'SA_AI_OVERLAY'],
    ['app/super-admin/eval-harness/page.tsx', 'SA_AI_OVERLAY'],
    ['app/super-admin/console-users-roles-and-change-approvals/page.tsx', 'SA_AI_OVERLAY'],
    ['app/studio/agents/AgentsScreen.tsx', 'STU_AI_OVERLAY'],
    ['app/hub/execution-summary-review/page.tsx', 'DOH_AI_OVERLAY'],
    ['app/command-center/shift-handoff-panel/page.tsx', 'CC_AI_OVERLAY'],
  ]

  it.each(ROUTES)('%s mounts the overlay for its own surface', (path, symbol) => {
    const text = readFileSync(path, 'utf8')
    expect(text, path).toContain('<AiDegradationOverlay')
    expect(text, path).toContain(symbol)
  })

  it('mounts the once-orphaned queued-request matrix from a route under app/', () => {
    const text = readFileSync('app/hub/execution-summary-review/page.tsx', 'utf8')
    expect(text).toContain('<QueuedRequestSurfaceMatrix')
  })

  it('mounts the section 44.3 role matrix from the Command Center route', () => {
    const text = readFileSync('app/command-center/shift-handoff-panel/page.tsx', 'utf8')
    expect(text).toContain('<ShiftHandoffRoleMatrix')
  })

  it('overlays BOTH journey registers, not one', () => {
    for (const path of ['src/studio/journey/effects.ts', 'app/hub/journey/effects.ts']) {
      const text = readFileSync(path, 'utf8')
      expect(text, path).toContain('AI_DEGRADATION_BY_STEP')
      expect(text, path).toContain('aiDegradationForSteps(JOURNEY_STEPS)')
    }
  })
})
