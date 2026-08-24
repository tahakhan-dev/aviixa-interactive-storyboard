import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync, readdirSync } from 'node:fs'
import { isForeignProbe } from '../probe-paths'
import {
  MANUFACTURING_SEVERITY_SYMBOLS,
  OPERATIONAL_SEVERITY_SYMBOLS,
} from '../coverage/absence-sweep'
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
import { JourneyScreen as StudioJourneyScreen } from '../../app/studio/journey/JourneyScreen'
import { JourneyScreen as HubJourneyScreen } from '../../app/hub/journey/JourneyScreen'
import { AI_DEGRADATION_BY_STEP as HUB_AI_DEGRADATION } from '../../app/hub/journey/effects'

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

/**
 * THE SPELLED NUMERALS THIS GATE CONVICTS ON, AS A LIST RATHER THAN AS A
 * SAMPLE. The first version of this list held `two|three|four|five|six|eight|
 * nine|ten|twelve|thirteen|fifteen|nineteen|twenty-two` — the numerals that
 * happened to be live when it was written — and was blind to `seven`,
 * `eleven`, `fourteen`, `sixteen`, `seventeen`, `EIGHTEEN`, `twenty` and
 * `thirty`. `eighteen` was the live one: eighteen is the Studio's real module
 * figure, and the sentence this build wanted to print was "Twelve capabilities
 * and eighteen modules are two populations" — of which only the first half
 * would have been caught. Commit `803b4ca` fixed this identical shape one
 * directory over ("no `four` in a list holding `five`").
 *
 * So the list is written out to thirty, in one place, and the gate is proved by
 * PLANTING a sentence carrying each of the numerals that used to be absent.
 */
const SPELLED_NUMERALS = [
  'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-two', 'thirty',
] as const

const COUNT_OF_OWN_POPULATION = new RegExp(
  `\\b(?:\\d+|${SPELLED_NUMERALS.join('|')})\\s+(?:rows?|modules?|capabilit)`,
  'i',
)

describe('the widened numeral gate can actually fail', () => {
  // Proved by ADDING, one plant per numeral the first list was blind to.
  it.each(['seven', 'eleven', 'fourteen', 'sixteen', 'seventeen', 'eighteen', 'twenty', 'thirty'])(
    'convicts a rendered "%s modules"',
    (numeral) => {
      expect(`Twelve capabilities and ${numeral} modules are two populations.`).toMatch(
        COUNT_OF_OWN_POPULATION,
      )
    },
  )

  it('leaves a spelled numeral governing something that is not a population alone', () => {
    expect('the single sixteen-mode vocabulary').not.toMatch(COUNT_OF_OWN_POPULATION)
  })
})

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
        COUNT_OF_OWN_POPULATION,
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

  /*
   * THE SCANNED SET IS DERIVED, AND THE HAND LIST IS NOW AN ASSERTION ABOUT
   * THE DIRECTORY RATHER THAN THE SCAN'S ONLY INPUT.
   *
   * It used to be eleven hard-coded paths and nothing compared them to the
   * tree. `src/ai/five-surface/` held exactly six files and all six were
   * listed, so the gap was latent — and a latent gap in a prohibition scan is
   * the kind that survives, because nothing reds when someone adds a file.
   * PROVED: a seventh file in that directory naming both forbidden symbols
   * left this suite 95/95 green, silently unscanned.
   *
   * So the directory half is read from disk and its BASENAMES are compared to
   * the six named below — the `KNOWN_UNREACHABLE`/`STANDING_VIOLATION`
   * equality shape this slice already uses, which reds in both directions: a
   * new file that nobody folded in, and a named file that has been deleted or
   * renamed. Basenames and not full paths, so the equality is a claim about
   * the directory's contents and not about the string used to reach it.
   *
   * The five `ai-degradation.ts` modules stay written out: they are one file
   * each in five unrelated surface directories, and a `readdir` wide enough to
   * find them would pull in those surfaces' whole module trees.
   *
   * The probe skip is `isForeignProbe` and not a private predicate: nine
   * release gates plant `.zz-probe-<pid>` entries on the real filesystem, and
   * a concurrent run's probe appearing here would red the equality with
   * another process's scratch file. The skip is EXACT, so a real file with an
   * ordinary name — which is what a twelfth module looks like — is never
   * skipped by it.
   */
  /*
   * THE PLANTS THAT CLOSED THE TWO FINDINGS ABOVE. Neither writes to `src/`:
   * `FIVE_SURFACE_DIR` was pointed at a copy of the six real files under
   * `/tmp`, so the planted bytes are read by the real suite through the real
   * predicates. Restored byte-identically, sha256 compared before and after
   * (f31c7927…).
   *
   *  A  the copy's `overlay.ts` with `// plant: severityBand
   *     SEEDED_SEVERITY_BANDS CcSeverityCounts` appended — the plant the audit
   *     ran, which was 95/95 GREEN against the two-name regex.
   *     RED  1 failed | 96 passed, and the one failure is the intended case:
   *          'overlay.ts: expected … not to match
   *          /SEEDED_SEVERITY_BANDS|severityBand|…/'. The directory equality
   *          stayed green, because the copy holds the same six basenames —
   *          which is why the equality compares basenames rather than paths.
   *  B  a seventh file, `plant-probe.ts`, in the copy, naming both symbols —
   *     the audit's twelfth-file plant, which was 95/95 GREEN.
   *     RED  TWICE, and both halves are the close: the equality reports
   *          '+ "plant-probe.ts"', and the prohibition scan convicts the file
   *          itself. A new file now either joins the scan or reds the list.
   *  C  a seventh entry, `'renamed-away.ts'`, added to the list below with the
   *     real directory in place — the stale-entry direction.
   *     RED  'expected [ …(5) ] to deeply equal [ …(6) ]', - "renamed-away.ts"
   */
  const FIVE_SURFACE_DIR = 'src/ai/five-surface'

  const FIVE_SURFACE_ENTRIES: readonly string[] = [
    'AiDegradationOverlay.tsx',
    'QueuedRequestSurfaceMatrix.tsx',
    'ShiftHandoffRoleMatrix.tsx',
    'journey-overlay.ts',
    'overlay.ts',
    'surface-codes.ts',
  ]

  const AI_DEGRADATION_MODULES: readonly string[] = [
    'src/studio/ai-degradation.ts',
    'src/surfaces/cc/ai-degradation.ts',
    'src/surfaces/doh/ai-degradation.ts',
    'src/surfaces/sa/ai-degradation.ts',
    'src/frontline/ai-degradation.ts',
  ]

  const fiveSurfaceEntries = (): readonly string[] =>
    readdirSync(FIVE_SURFACE_DIR)
      .filter((entry) => !isForeignProbe(entry) && /\.tsx?$/.test(entry))
      .sort()

  /** Every file of this task, the directory half read from disk. */
  const taskFiles = (): readonly string[] => [
    ...fiveSurfaceEntries().map((entry) => `${FIVE_SURFACE_DIR}/${entry}`),
    ...AI_DEGRADATION_MODULES,
  ]

  /*
   * THE FORBIDDEN NAMES ARE IMPORTED, NOT RESTATED. This file held TWO of the
   * eight — and one of those two was in neither of the other two copies. It
   * was the third consumer of the hoisted list and the only one that had
   * never been converted. PROVED: appending
   * `// plant: severityBand SEEDED_SEVERITY_BANDS CcSeverityCounts` to
   * `src/ai/five-surface/overlay.ts`, a file this gate's own list scans, left
   * the suite 95/95 green — three manufacturing symbols walked past.
   *
   * SUBSTRING AND NOT `\b`-BOUNDED, deliberately, and this is the one place
   * this consumer diverges from `namesAny`'s word-bounded form. The regex it
   * replaces was a bare substring alternation, so bounding it would have
   * NARROWED a prohibition while claiming to widen it —
   * `\bANOMALY_SEVERITIES\b` does not match `SEEDED_ANOMALY_SEVERITIES`. On
   * eleven files this build owns, over-strict is the correct direction: a
   * false positive is a red a human resolves in one reading, and a missed
   * import is `AC-43-103` broken in the shipped tree.
   */
  const FORBIDDEN_MANUFACTURING_SEVERITY = new RegExp(
    MANUFACTURING_SEVERITY_SYMBOLS.join('|'),
  )

  it('scans exactly the files of this task, derived from the directory', () => {
    expect(fiveSurfaceEntries()).toEqual([...FIVE_SURFACE_ENTRIES].sort())
    // The positive control. An equality against a literal list cannot pass
    // over an empty sweep, but the composed list is what the scan below
    // iterates and a floor here names the failure instead of leaving the next
    // reader to work out why a prohibition swept nothing.
    expect(taskFiles().length, 'the task file set collapsed').toBeGreaterThan(10)
  })

  // RED when: the alternation stops matching one of the names it is built
  // from — a symbol given a regex metacharacter, or the join changed. A FLOOR
  // and not an exact count, because an exact count is a stored copy of
  // another file's list and this build already maintains twenty-nine of those.
  // The silence half is asserted too: P8a in `slice-11-gates.test.ts` is the
  // recorded case of a case-sensitive pattern reading a plant as clean, and a
  // pattern that matched the operational vocabulary as well would convict the
  // wrong world.
  it('its forbidden-name pattern fires on every manufacturing symbol and no operational one', () => {
    expect(
      MANUFACTURING_SEVERITY_SYMBOLS.length,
      'the hoisted manufacturing vocabulary collapsed',
    ).toBeGreaterThan(4)
    for (const symbol of MANUFACTURING_SEVERITY_SYMBOLS) {
      expect(FORBIDDEN_MANUFACTURING_SEVERITY.test(symbol), symbol).toBe(true)
    }
    for (const symbol of OPERATIONAL_SEVERITY_SYMBOLS) {
      expect(FORBIDDEN_MANUFACTURING_SEVERITY.test(symbol), symbol).toBe(false)
    }
  })

  it('imports no manufacturing-severity component into any file of this task', () => {
    for (const path of taskFiles()) {
      const text = readFileSync(path, 'utf8')
      expect(text, path).not.toMatch(FORBIDDEN_MANUFACTURING_SEVERITY)
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

  // THE TEXT SCAN THAT USED TO SIT HERE IS GONE. It read the two register
  // files as text and asserted `AI_DEGRADATION_BY_STEP` appeared in them,
  // which the identifier's presence satisfies — so it passed while both
  // journeys rendered no artificial-intelligence degradation at all. The
  // register is now asserted over its VALUE in
  // `tests/unit/ai-five-surface-overlays.test.ts` and over its RENDERING at
  // the bottom of this file.
})

/* ==================================================================== *
 * THE DISCLOSURES ARE ON SCREEN.
 *
 * Defect shape 1 — state written, never read. Each of these records existed
 * and was reachable from nothing, while two doc comments and one boolean said
 * the disclosure was happening. `sourceNotes` is the slot and the component
 * renders it unconditionally; these assertions are over the RENDERED TEXT, so
 * a record routed into the data but dropped by the component still fails.
 * ==================================================================== */

describe('every unresolved source decision is disclosed on screen', () => {
  const textOf = (overlay: Parameters<typeof AiDegradationOverlay>[0]['overlay']): string => {
    const { container } = render(<AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />)
    return container.textContent ?? ''
  }

  it.each(FIVE_SURFACE_OVERLAYS.map((o) => [o.surfaceId, o] as const))(
    '%s renders the source-notes section',
    (_id, overlay) => {
      render(<AiDegradationOverlay overlay={overlay} mountedOn="a test mount" />)
      expect(screen.getByTestId('overlay-source-notes')).toBeTruthy()
    },
  )

  it.each(
    FIVE_SURFACE_OVERLAYS.flatMap((overlay) =>
      overlay.sourceNotes.map((note) => [overlay.surfaceId, note.heading, note] as const),
    ),
  )('%s renders the note %s', (surfaceId, _heading, note) => {
    const overlay = FIVE_SURFACE_OVERLAYS.find((o) => o.surfaceId === surfaceId)
    const text = textOf(overlay!)
    expect(text).toContain(note.heading)
    expect(text).toContain(note.body)
    for (const reading of note.readings) {
      expect(text).toContain(reading.reading)
      expect(text).toContain(reading.text)
    }
    if (note.adopted !== null) {
      expect(text).toContain(note.adopted.why)
      // The build's pick is labelled a client-delegated choice, on screen.
      expect(text).toContain('APP-012')
    }
  })

  it('discloses both readings of `Every Hub module`, neither presented as settled', () => {
    const doh = FIVE_SURFACE_OVERLAYS.find((o) => o.surfaceId === 'SURF-DOH')!
    const text = textOf(doh)
    expect(text).toContain('A — universal')
    expect(text).toContain('B — enumerative')
  })

  it('names the locally disclosed decisions the canon does not hold', () => {
    const stu = textOf(FIVE_SURFACE_OVERLAYS.find((o) => o.surfaceId === 'SURF-STU')!)
    expect(stu).toContain('DEC-AIFALLBACK-001')
    expect(stu).toContain('DEC-STUDIO-001')
    const cc = textOf(FIVE_SURFACE_OVERLAYS.find((o) => o.surfaceId === 'SURF-CC')!)
    expect(cc).toContain('DEC-REPORT-001')
  })

  it('says on screen that this table is not `SURF-STU` module coverage', () => {
    expect(textOf(FIVE_SURFACE_OVERLAYS.find((o) => o.surfaceId === 'SURF-STU')!)).toContain(
      'is not coverage of `SURF-STU` module behaviour',
    )
  })
})

/* ==================================================================== *
 * A DERIVED ROW'S LOCATOR DOES NOT LOOK LIKE A TRANSCRIBED ONE.
 * ==================================================================== */

describe('the row locator says which kind of citation it is', () => {
  it('marks a derived row locator as a basis and a transcribed one as the line itself', () => {
    const doh = FIVE_SURFACE_OVERLAYS.find((o) => o.surfaceId === 'SURF-DOH')!
    const { container } = render(<AiDegradationOverlay overlay={doh} mountedOn="a test mount" />)
    const derived = container.querySelector('tr[data-overlay-kind="derived"]')
    const transcribed = container.querySelector('tr[data-overlay-kind="transcribed"]')
    expect(derived?.textContent ?? '').toContain('derived from L90861')
    expect(transcribed?.textContent ?? '').toContain('[L90907]')
    expect(transcribed?.textContent ?? '').not.toContain('derived from')
  })
})

/* ==================================================================== *
 * THE TWO JOURNEY REGISTERS RENDER THEIR OVERLAY.
 *
 * The gate this replaces read the two register FILES as text. Both journeys
 * still rendered no artificial-intelligence degradation, which is exactly what
 * `journey-overlay.ts` said could not happen.
 * ==================================================================== */

describe('both journey screens render the step\'s degradation', () => {
  it('the Studio journey does, on a Studio-acting step', () => {
    render(<StudioJourneyScreen initialStep={1} />)
    expect(screen.getByTestId('step-ai-degradation')).toBeTruthy()
    expect(screen.getByTestId('ai-degradation-SURF-STU')).toBeTruthy()
  })

  it('the Hub journey does, and reaches the Frontline overlay on its FL step', () => {
    const flStep = HUB_AI_DEGRADATION.find((d) => d.actingSurface === 'FL')
    render(<HubJourneyScreen initialStep={flStep?.step ?? 1} />)
    expect(screen.getByTestId('step-ai-degradation')).toBeTruthy()
    expect(screen.getByTestId('ai-degradation-SURF-FL')).toBeTruthy()
  })
})
