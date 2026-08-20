import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { reachByStudioMatrix, stuModuleById, STU_MODULES } from '@/studio/modules'
import { publishCheckById } from '@/studio/publish/checks'
import { createPublishCheckRegister, registerPublishChecks } from '@/studio/publish/register'
import { screenRendersState } from '@/studio/state/screen-states'
import { APPROVAL_CONSUMER_CONTRACTS } from '@/studio/modules/stu-11/chain'
import { DIFFICULTY_LEVELS, LOCALES, type DifficultyLevel, type Locale } from '@/studio/vocab'
import {
  STU_09_CROSS_SURFACE,
  STU_09_MATRIX,
  STU_09_MATRIX_AND_CROSS_SURFACE_ROWS,
  STU_09_ROW_IDS,
  STU_09_SOURCE_ROW_COUNT,
  stu09Row,
  type Stu09RowId,
} from '@/studio/modules/stu-09/matrix'
import {
  cellsFor,
  coverageGapElements,
  difficultyAffordance,
  editDifficultyLevel,
  enforcedFor,
  ENFORCED_CONTENT_KEYS,
  FULLY_COVERED_SCREENS,
  gapNote,
  LEVEL_RENDERING_STATES,
  renderingForWorker,
  screenById,
  STU09_DECLARED_LOCALES,
  STU09_DEFAULT_CONTEXT,
  WHEEL_BOLT_SCREENS,
  COMPLETENESS_CHECK_OWNERSHIP,
  type DifficultyAuditEntry,
  type DifficultyCell,
  type LevelRendering,
  type LevelRenderingState,
  type ScreenModel,
} from '@/studio/modules/stu-09/levels'
import {
  DifficultyCoverage,
  EQUIVALENCE_LINE,
  type DifficultyCoverageProps,
} from '@/studio/modules/stu-09/DifficultyCoverage'

/**
 * `MOD-STU-09` — Work-Instruction Difficulty Levels.
 *
 * THIS MODULE HAS NO ROUTE, so this file is the only thing standing between
 * it and Task 15's mount. Two rules follow, and both are applied deliberately
 * rather than assumed:
 *
 * 1. NO ASSERTION HERE MAY PASS ON AN EMPTY SET. Every walk over a
 *    collection pins the collection's own size or contents FIRST, on its own
 *    line, so a fixture that shrank to nothing turns the guard red instead of
 *    turning the walk vacuous.
 * 2. THE FIXTURE IS EIGHT SCREENS, NOT ONE. L32525's illustrative example is
 *    "screens 3 through 10", all eight of them measurement screens carrying
 *    the same block. A coverage assertion run over one screen under-validates
 *    by seven, so every coverage walk below runs the full eight.
 */

const ALL_PERSONAS: readonly StudioPersonaColumn[] = STUDIO_PERSONA_COLUMNS
const GRANT_HOLDER: StudioPersonaColumn = 'supervisor-with-authoring-grant'

/** Markup helper — `tests/unit` is a node environment, so no DOM. */
function markup(over: Partial<DifficultyCoverageProps> = {}): string {
  const screen = screenById(WHEEL_BOLT_SCREENS, 'screen 3')
  const props: DifficultyCoverageProps = {
    screenId: screen.screenId,
    declaredLocales: STU09_DECLARED_LOCALES,
    cells: cellsFor(screen),
    onOpen: () => undefined,
    persona: GRANT_HOLDER,
    ...over,
  }
  return renderToStaticMarkup(createElement(DifficultyCoverage, props))
}

const countOf = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1

/* ==================================================================== *
 * THE MATRIX — L32964-L32971, eight data rows.
 * ==================================================================== */

describe('MOD-STU-09 permission matrix', () => {
  // FAILS IF: a row is dropped from either half, or moved from one half to
  // the other without the other half being updated.
  it('accounts for all eight source rows across the matrix and the cross-surface register', () => {
    expect(STU_09_SOURCE_ROW_COUNT).toBe(8)
    expect(STU_09_MATRIX).toHaveLength(7)
    expect(STU_09_MATRIX_AND_CROSS_SURFACE_ROWS).toBe(STU_09_SOURCE_ROW_COUNT)
  })

  // FAILS IF: any row loses a persona column, or the vocabulary grows a
  // ninth column no row answers.
  it('answers all eight persona columns on every row, with no blank cell', () => {
    expect(ALL_PERSONAS).toHaveLength(8)
    expect(STU_09_MATRIX.length).toBeGreaterThan(0)
    for (const row of STU_09_MATRIX) {
      for (const persona of ALL_PERSONAS) {
        const cell = row.cells[persona]
        expect(cell, `${row.id} / ${persona}`).toBeDefined()
        expect(cell.note.trim(), `${row.id} / ${persona}`).not.toBe('')
      }
    }
  })

  // FAILS IF: any one of the sixteen cells across these two rows stops
  // refusing. Rows 5 and 6 are the source's two universal prohibitions.
  it('refuses rows 5 and 6 in every one of the eight columns', () => {
    const universal: readonly Stu09RowId[] = [
      'publish-a-level-that-has-not-been-reviewed',
      'make-a-level-change-a-capture-gate-limit-or-severity-mapping',
    ]
    expect(universal).toHaveLength(2)
    for (const id of universal) {
      for (const persona of ALL_PERSONAS) {
        expect(stu09Row(id).cells[persona].outcome, `${id} / ${persona}`).toBe(
          'explicitlyProhibited',
        )
      }
    }
  })

  // FAILS IF: a second row is marked with an approval stage, or row 4 loses
  // its stage — either would arm or disarm separation-of-duties wrongly.
  it('occupies the Reviewer stage on exactly one row', () => {
    const staged = STU_09_MATRIX.filter((row) => row.stage !== null)
    expect(staged.map((row) => row.id)).toEqual(['review-drafted-levels-in-the-chain'])
    expect(staged[0]?.stage).toBe('reviewer')
  })

  // FAILS IF: the Plant Manager column stops mirroring the without-grant
  // cell, or stops naming DEC-ROLE-001 as the reason it does.
  it('fills the Plant Manager column from DEC-ROLE-001 and says so on every row', () => {
    expect(STU_09_MATRIX.length).toBe(7)
    for (const row of STU_09_MATRIX) {
      const plant = row.cells['plant-manager-persona']
      expect(plant.outcome, row.id).toBe(row.cells['supervisor-without-grant'].outcome)
      expect(plant.note, row.id).toContain('DEC-ROLE-001')
    }
  })

  // FAILS IF: a row's classification or a cell's outcome moves such that a
  // persona's reach changes. The Worker's `withheld` is AC-STU-150.
  it('derives reach from the screen rows alone', () => {
    const reach = reachByStudioMatrix(STU_09_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach).toEqual({
      'quality-manager': 'offered',
      'supervisor-with-authoring-grant': 'offered',
      'supervisor-without-grant': 'offered',
      'plant-manager-persona': 'offered',
      'tenant-admin': 'offered',
      'read-only-auditor': 'client-decision-open',
      worker: 'withheld',
      'implementation-team': 'offered',
    })
  })

  // FAILS IF: the row-id vocabulary and the matrix stop agreeing.
  it('keeps the row-id vocabulary and the matrix in step', () => {
    expect([...STU_09_ROW_IDS]).toEqual(STU_09_MATRIX.map((row) => row.id))
  })
})

/* ==================================================================== *
 * STEP 6 — ROW 7 IS A CROSS-SURFACE STATEMENT, NEVER A CONTROL (R22).
 * ==================================================================== */

describe('the worker-profile field is a cross-surface statement', () => {
  // FAILS IF: row 7 is added to the persona matrix as a control row.
  it('keeps the profile-field row out of the persona matrix entirely', () => {
    expect(STU_09_MATRIX.length).toBe(7)
    expect(STU_09_MATRIX.map((row) => row.capability)).not.toContain(
      'Set the difficulty level on a worker profile',
    )
    const profile = STU_09_CROSS_SURFACE.find(
      (row) => row.id === 'set-the-difficulty-level-on-a-worker-profile',
    )
    expect(profile?.heldOn).toBe('SURF-DOH')
  })

  // FAILS IF: any of the six source cells is dropped or reworded.
  it('carries all six of row 7’s source cells verbatim', () => {
    const profile = STU_09_CROSS_SURFACE[0]
    expect(profile.cells).toHaveLength(6)
    expect(profile.cells.map((c) => c.text)).toEqual([
      'Not applicable — the profile field is Delivery Operations Hub master data',
      'Allowed — supervisor-entered worker record maintenance in the Delivery Operations Hub',
      'Allowed — same reason',
      'Allowed — same reason',
      'Read-only',
      'Explicitly prohibited — no self-selection is specified',
    ])
  })

  // FAILS IF: MOD-STU-09 is ever given a route, or the panel draws any
  // control inside the profile-field region.
  it('offers no Studio route and no Studio control for the profile field', () => {
    expect(stuModuleById(STU_MODULES, 'MOD-STU-09').slug).toBeNull()
    const html = markup()
    const start = html.indexOf('data-testid="profile-field-cross-surface"')
    expect(start).toBeGreaterThan(-1)
    const region = html.slice(start, html.indexOf('data-testid="frontline-cross-surface"'))
    expect(region.length).toBeGreaterThan(100)
    expect(region).not.toContain('<button')
    expect(region).toContain('Delivery Operations Hub')
    // The profile field's counterpart IS built (census §6.1, MOD-DOH-04,
    // slice 4), so the notice draws it as CONSUMPTION rather than as an
    // absence — drawing "not built here" over a live registry would be the
    // false-absence defect. Contrast MOD-STU-10's parts registry, which has
    // no owning slice at all and says so.
    expect(region).toContain('MOD-DOH-04')
    expect(region).toContain('built in slice 4')
    expect(region).not.toContain('not built here')
  })

  // FAILS IF: row 8's Worker cell is presented as a Studio permission.
  it('answers row 8’s Worker cell for SURF-STU and registers the Frontline consequence', () => {
    const row8 = stu09Row('read-all-three-levels-of-published-content')
    expect(row8.cells.worker.outcome).toBe('explicitlyProhibited')
    expect(row8.cells.worker.note).toContain('AC-STU-150')
    const frontline = STU_09_CROSS_SURFACE.find(
      (row) => row.id === 'read-the-selected-level-on-the-frontline',
    )
    expect(frontline?.heldOn).toBe('SURF-FL')
    expect(frontline?.cells[0]?.text).toBe(
      'Allowed with conditions — the worker sees only the level their profile selects',
    )
  })
})

/* ==================================================================== *
 * STEP 2 — THE EQUIVALENCE GUARANTEE. TEST-STU-093, AC-STU-088.
 * ==================================================================== */

describe('the equivalence guarantee', () => {
  // FAILS IF: `LevelRendering` grows a field an enforced value could be
  // written into, on any of 8 screens x 3 levels x 2 locales.
  it('has no path to a level-specific specification limit', () => {
    expect([...ENFORCED_CONTENT_KEYS]).toEqual([
      'requiredCaptures',
      'gates',
      'specificationLimits',
      'severityMappings',
    ])
    expect(WHEEL_BOLT_SCREENS).toHaveLength(8)
    let inspected = 0
    for (const screen of WHEEL_BOLT_SCREENS) {
      for (const level of DIFFICULTY_LEVELS) {
        // The level maps to LOCALES and to nothing else — this is the
        // brief's `Object.keys(screenModel.levels.simple)` assertion, made
        // exact so it cannot be satisfied by an empty object.
        expect(Object.keys(screen.levels[level]), `${screen.screenId}/${level}`).toEqual([
          ...LOCALES,
        ])
        for (const locale of LOCALES) {
          const rendering = screen.levels[level][locale]
          expect(rendering, `${screen.screenId}/${level}/${locale}`).toBeDefined()
          expect(Object.keys(rendering ?? {})).toEqual(['instructionText', 'state'])
          for (const key of ENFORCED_CONTENT_KEYS) {
            expect(Object.keys(rendering ?? {})).not.toContain(key)
          }
          inspected += 1
        }
      }
    }
    expect(inspected).toBe(48)
  })

  // FAILS IF: `LevelRendering` gains any enforced field — the @ts-expect-error
  // stops being an error and the compiler reports the unused directive.
  it('cannot express a level-specific limit at the type level', () => {
    const bad: LevelRendering = {
      instructionText: 'Torque bolt A.',
      state: 'Authored',
      // TEST-STU-093 — "confirm no such path exists". A level carries
      // instruction text and a review state; enforced content hangs off the
      // SCREEN, so this property has nowhere to go and does not compile.
      // @ts-expect-error TEST-STU-093 — a level has nowhere to put enforced content.
      specificationLimits: { lower: 1, upper: 2, unit: 'Nm', drawingReference: 'X' },
    }
    expect(Object.keys(bad)).toContain('specificationLimits')
  })

  // FAILS IF: `enforcedFor` reaches into the level for anything.
  it('keeps captures, gates, limits and severity mappings byte-identical across levels', () => {
    expect(WHEEL_BOLT_SCREENS).toHaveLength(8)
    expect(DIFFICULTY_LEVELS).toHaveLength(3)
    let compared = 0
    for (const screen of WHEEL_BOLT_SCREENS) {
      const [s, st, e] = DIFFICULTY_LEVELS.map((level) => JSON.stringify(enforcedFor(screen, level)))
      expect(s, screen.screenId).toBe(st)
      expect(st, screen.screenId).toBe(e)
      expect(s?.length ?? 0).toBeGreaterThan(50)
      compared += 1
    }
    expect(compared).toBe(8)
  })

  // FAILS IF: the enforced bundle stops being shared, so two screens' limits
  // could diverge silently while each screen stayed self-consistent.
  it('holds one enforced bundle per screen, identical across all eight measurement screens', () => {
    const serialised = WHEEL_BOLT_SCREENS.map((s) => JSON.stringify(s.enforced))
    expect(serialised).toHaveLength(8)
    expect(new Set(serialised).size).toBe(1)
    expect(serialised[0]).toContain('DWG-A441')
  })
})

/* ==================================================================== *
 * STEP 3 — THE SIX-CELL COVERAGE STRIP. SB-STU-12, L33038.
 * ==================================================================== */

describe('the coverage strip', () => {
  // FAILS IF: the strip stops rendering one cell per level per locale, or
  // the gap sentence loses either the locale or the level.
  it('renders six cells and names the specific gap on each red one', () => {
    const html = markup()
    expect(countOf(html, 'role="gridcell"')).toBe(6)
    expect(html).toContain('Spanish expanded: not reviewed')
    expect(html).toContain(EQUIVALENCE_LINE)
  })

  // FAILS IF: the strip is hard-coded to six cells rather than derived from
  // the declared locale set.
  it('derives the strip from the declared locale set rather than from the number six', () => {
    const screen = screenById(WHEEL_BOLT_SCREENS, 'screen 3')
    const threeLocales = [...LOCALES, 'English' as Locale]
    expect(cellsFor(screen, LOCALES)).toHaveLength(6)
    expect(cellsFor(screen, threeLocales)).toHaveLength(9)
  })

  // FAILS IF: any two of the four gap sentences become the same words — the
  // storyboard requires the SPECIFIC gap, not merely a named one.
  it('names a different gap for every state that is not reviewed', () => {
    const states: readonly (LevelRenderingState | null)[] = [
      null,
      'Authored',
      'Drafted by artificial intelligence',
      'Edited',
    ]
    const notes = states.map((state) =>
      gapNote({ level: 'expanded', locale: 'Spanish', state } as DifficultyCell),
    )
    expect(notes).toHaveLength(4)
    expect(notes.every((n) => n !== null)).toBe(true)
    expect(new Set(notes).size).toBe(4)
    for (const note of notes) expect(note).toContain('Spanish expanded:')
  })

  // FAILS IF: a reviewed or published cell starts reporting a gap.
  it('reports no gap for a reviewed or a published rendering', () => {
    for (const state of ['Reviewed', 'Published within a version'] as const) {
      expect(gapNote({ level: 'simple', locale: 'English', state })).toBeNull()
    }
    expect(coverageGapElements(FULLY_COVERED_SCREENS)).toEqual([])
  })

  // FAILS IF: the panel accepts a short or empty strip — the two shapes that
  // would let every assertion above pass while showing nothing.
  it('refuses a strip that cannot prove coverage', () => {
    const screen = screenById(WHEEL_BOLT_SCREENS, 'screen 3')
    expect(() => markup({ declaredLocales: [] })).toThrow(/declared locale set is empty/i)
    expect(() => markup({ cells: cellsFor(screen).slice(0, 5) })).toThrow(/needs 6/i)
  })
})

/* ==================================================================== *
 * STEP 4 — A DRAFTED-BUT-UNREVIEWED LEVEL BLOCKS PUBLICATION.
 * ==================================================================== */

describe('publication blocking', () => {
  // FAILS IF: a gap element drops the screen, the level or the locale. Each
  // is asserted on its own line, so dropping any one turns exactly one red.
  it('lists every gap by screen, level and locale', () => {
    const gaps = coverageGapElements(WHEEL_BOLT_SCREENS)
    expect(gaps).toHaveLength(1)
    const [gap] = gaps
    expect(gap).toContain('screen 3')
    expect(gap).toContain('expanded')
    expect(gap).toContain('Spanish')
  })

  // FAILS IF: the walk stops at the first screen. The gap is planted on the
  // LAST of the eight, so a first-match walk finds nothing.
  it('walks all eight measurement screens rather than the first', () => {
    const gappedLast: readonly ScreenModel[] = FULLY_COVERED_SCREENS.map((screen, index) =>
      index === FULLY_COVERED_SCREENS.length - 1
        ? {
            ...screen,
            levels: {
              ...screen.levels,
              expanded: {
                ...screen.levels.expanded,
                Spanish: { instructionText: 'x', state: 'Edited' as const },
              },
            },
          }
        : screen,
    )
    expect(gappedLast).toHaveLength(8)
    const gaps = coverageGapElements(gappedLast)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toContain('screen 10')
  })

  // FAILS IF: MOD-STU-09 is added to `locale-completeness`'s ownerModules —
  // which is exactly when this declaration stops being true and this module
  // should register the check for real. The absence is pinned, not guessed.
  it('declares that it does not own the completeness check', () => {
    const check = publishCheckById('locale-completeness')
    expect(check.ownerModules).toEqual(['MOD-STU-17'])
    expect(COMPLETENESS_CHECK_OWNERSHIP.ownedBy).toBe('MOD-STU-17')

    const attempt = registerPublishChecks(createPublishCheckRegister<null>(), {
      checkId: 'locale-completeness',
      implementedBy: 'MOD-STU-09',
      run: () => ({ outcome: 'passed' }),
    })
    expect(attempt.ok).toBe(false)
    expect(attempt.ok === false ? attempt.failure : null).toBe('not-an-owner')
  })

  // FAILS IF: the blocking banner names the level without the locale, or the
  // locale without the level.
  it('blocks with an element that names the level and the locale', () => {
    const html = markup()
    expect(html).toContain('Publication is blocked until every rendering has been reviewed')
    expect(html).toContain('Spanish expanded')
    const clean = markup({ cells: cellsFor(screenById(FULLY_COVERED_SCREENS, 'screen 3')) })
    expect(clean).not.toContain('Publication is blocked')
  })
})

/* ==================================================================== *
 * STEP 5 — THE UNSET PROFILE FIELD IS A DEFINED DEFAULT.
 * ==================================================================== */

describe('the worker-profile difficulty field', () => {
  // FAILS IF: an unset field returns anything but `standard`, or stops
  // saying "default", or starts reading as an absence.
  it('renders the standard level as a defined default when the field is unset', () => {
    const unset = renderingForWorker(null)
    expect(unset.level).toBe('standard')
    expect(unset.isDefault).toBe(true)
    expect(unset.note).toMatch(/defined default/i)
    expect(unset.note).not.toMatch(/no level|nothing to show|not set yet/i)
  })

  // FAILS IF: a set field is reported as a default.
  it('renders the profile’s own level when the field is set', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const set = renderingForWorker(level)
      expect(set.level).toBe(level)
      expect(set.isDefault).toBe(false)
    }
  })

  // FAILS IF: the panel renders an empty state instead of the default line.
  it('shows the default on the panel rather than an empty state', () => {
    const html = markup({ workerProfileLevel: null })
    expect(html).toContain('data-testid="worker-rendering"')
    expect(html).toMatch(/defined default/i)
    expect(html).not.toMatch(/There are no /i)
  })
})

/* ==================================================================== *
 * SCREEN STATES, AFFORDANCES AND THE CHAIN.
 * ==================================================================== */

describe('screen states and per-control affordances', () => {
  // FAILS IF: the drafting-aid states stop applying on SCR-STU-04, or the
  // panel stops saying the author writes all three levels manually.
  it('renders STATE-10 and STATE-11 on SCR-STU-04 and says the author writes all three', () => {
    expect(screenRendersState('SCR-STU-04', 'STATE-10')).toBe(true)
    expect(screenRendersState('SCR-STU-04', 'STATE-11')).toBe(true)
    const degraded = markup({ draftingAid: 'degraded' })
    expect(degraded).toContain('AI assistance degraded')
    expect(degraded).toMatch(/writes all three difficulty levels manually/i)
    const unavailable = markup({ draftingAid: 'unavailable' })
    expect(unavailable).toContain('AI assistance unavailable')
    expect(unavailable).toMatch(/writes all three difficulty levels manually/i)
    expect(markup()).not.toContain('AI assistance')
  })

  // FAILS IF: STATE-07 is ever made applicable on this surface (D22).
  it('renders no offline state anywhere on this surface', () => {
    expect(screenRendersState('SCR-STU-04', 'STATE-07')).toBe(false)
  })

  // FAILS IF: an affordance is derived from a role list rather than the
  // evaluator, or a prohibited persona is drawn a disabled control.
  it('answers each control per persona through the evaluator', () => {
    expect(ALL_PERSONAS).toHaveLength(8)
    const enabled: StudioPersonaColumn[] = []
    const absent: StudioPersonaColumn[] = []
    for (const persona of ALL_PERSONAS) {
      const rendering = difficultyAffordance(
        'edit-a-drafted-level-before-submission',
        persona,
        { ...STU09_DEFAULT_CONTEXT },
        'Open Expanded · Spanish',
      )
      if (rendering.kind === 'enabled') enabled.push(persona)
      if (rendering.kind === 'absent') absent.push(persona)
    }
    expect(enabled).toEqual([
      'quality-manager',
      'supervisor-with-authoring-grant',
      'implementation-team',
    ])
    expect(absent).toEqual([
      'supervisor-without-grant',
      'plant-manager-persona',
      'tenant-admin',
      'read-only-auditor',
      'worker',
    ])
  })

  // FAILS IF: a prohibited persona is drawn a control it must not have.
  it('draws no cell control for a prohibited persona and six for a grant-holder', () => {
    const prohibited = markup({ persona: 'tenant-admin' })
    expect(countOf(prohibited, 'role="gridcell"')).toBe(6)
    expect(countOf(prohibited, 'Open Simple')).toBe(0)
    const holder = markup()
    expect(countOf(holder, 'Open Simple · English')).toBe(1)
  })

  // FAILS IF: the module stops routing drafted levels through the full chain.
  it('reuses MOD-STU-11’s chain as the difficulty-level consumer', () => {
    const contract = APPROVAL_CONSUMER_CONTRACTS.find((c) => c.id === 'difficulty-level')
    expect(contract?.ownerModule).toBe('MOD-STU-09')
    expect(contract?.stages).toHaveLength(3)
    expect(contract?.previewScope).toBe('every drafted level')
    expect(contract?.additionalGates).toEqual([])
  })

  // FAILS IF: the five states of L32981 are reworded or reordered.
  it('carries the five level states L32981 names, in order', () => {
    expect([...LEVEL_RENDERING_STATES]).toEqual([
      'Authored',
      'Drafted by artificial intelligence',
      'Edited',
      'Reviewed',
      'Published within a version',
    ])
  })
})

/* ==================================================================== *
 * THE WRITE PATH AND ITS AUDIT.
 * ==================================================================== */

describe('editing a drafted level goes through the audit path', () => {
  const gapped = screenById(WHEEL_BOLT_SCREENS, 'screen 3')
  const target = { level: 'expanded' as DifficultyLevel, locale: 'Spanish' as Locale }

  // FAILS IF: the audit append moves after the mutation, or the mutation
  // stops being observable. The SAME call is run twice — once accepted, once
  // refused — so the contract is demonstrated where it costs something.
  it('mutates observably when the audit is accepted and not at all when it fails', () => {
    const before = gapped.levels[target.level][target.locale]?.instructionText
    expect(before).toBeDefined()

    const written: DifficultyAuditEntry[] = []
    const accepted = editDifficultyLevel({
      screens: WHEEL_BOLT_SCREENS,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      level: target.level,
      locale: target.locale,
      instructionText: 'Apriete el perno A y registre la lectura.',
      writeAudit: (entry) => {
        written.push(entry)
        return { ok: true }
      },
    })
    expect(accepted.ok).toBe(true)
    const after = screenById(accepted.screens, 'screen 3').levels[target.level][target.locale]
    expect(after?.instructionText).toBe('Apriete el perno A y registre la lectura.')
    expect(after?.instructionText).not.toBe(before)
    expect(after?.state).toBe('Edited')
    expect(written).toHaveLength(1)

    const refused = editDifficultyLevel({
      screens: WHEEL_BOLT_SCREENS,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      level: target.level,
      locale: target.locale,
      instructionText: 'Apriete el perno A y registre la lectura.',
      writeAudit: () => ({ ok: false, reason: 'the tenant audit log rejected the append' }),
    })
    expect(refused.ok).toBe(false)
    expect(refused.screens).toBe(WHEEL_BOLT_SCREENS)
    const untouched = screenById(refused.screens, 'screen 3').levels[target.level][target.locale]
    expect(untouched?.instructionText).toBe(before)
    expect(untouched?.state).toBe('Drafted by artificial intelligence')
    expect(refused.message).toMatch(/audit write failed/i)
  })

  // FAILS IF: a domain refusal reaches the sink. The sink THROWS, so any
  // call at all turns this red rather than being counted and ignored.
  it('never reaches the audit sink on a domain refusal', () => {
    const explode = (): never => {
      throw new Error('the audit sink was reached by a refused action')
    }
    for (const persona of ['tenant-admin', 'worker', 'read-only-auditor'] as const) {
      const result = editDifficultyLevel({
        screens: WHEEL_BOLT_SCREENS,
        screenId: 'screen 3',
        persona,
        level: target.level,
        locale: target.locale,
        instructionText: 'x',
        writeAudit: explode,
      })
      expect(result.ok, persona).toBe(false)
      expect(result.screens).toBe(WHEEL_BOLT_SCREENS)
    }
    // A reviewed rendering, an unknown screen and an empty text are the
    // three non-permission refusals, and none of them may audit either.
    expect(
      editDifficultyLevel({
        screens: WHEEL_BOLT_SCREENS,
        screenId: 'screen 4',
        persona: GRANT_HOLDER,
        level: 'simple',
        locale: 'English',
        instructionText: 'x',
        writeAudit: explode,
      }).ok,
    ).toBe(false)
    expect(
      editDifficultyLevel({
        screens: WHEEL_BOLT_SCREENS,
        screenId: 'screen 99',
        persona: GRANT_HOLDER,
        level: target.level,
        locale: target.locale,
        instructionText: 'x',
        writeAudit: explode,
      }).ok,
    ).toBe(false)
    expect(
      editDifficultyLevel({
        screens: WHEEL_BOLT_SCREENS,
        screenId: 'screen 3',
        persona: GRANT_HOLDER,
        level: target.level,
        locale: target.locale,
        instructionText: '   ',
        writeAudit: explode,
      }).ok,
    ).toBe(false)
  })

  // FAILS IF: the audit entry starts carrying a role, or stops carrying the
  // identity, the screen, the level and the locale.
  it('audits identity and action, never “acting as role”', () => {
    let entry: DifficultyAuditEntry | null = null
    editDifficultyLevel({
      screens: WHEEL_BOLT_SCREENS,
      screenId: 'screen 3',
      persona: GRANT_HOLDER,
      level: target.level,
      locale: target.locale,
      instructionText: 'Apriete el perno A.',
      writeAudit: (e) => {
        entry = e
        return { ok: true }
      },
    })
    const written = entry as DifficultyAuditEntry | null
    expect(written).not.toBeNull()
    expect(written?.actorIdentityId).toBe('IDN-STU09-SUP-GRANT')
    expect(written?.action).toBe('edit-drafted-level')
    expect(written?.screenId).toBe('screen 3')
    expect(written?.level).toBe('expanded')
    expect(written?.locale).toBe('Spanish')
    expect(Object.keys(written ?? {})).not.toContain('role')
    expect(JSON.stringify(written)).not.toMatch(/SUPERVISOR|QUALITY_MANAGER/)
  })
})

/* ==================================================================== *
 * DETERMINISM.
 * ==================================================================== */

describe('determinism', () => {
  // FAILS IF: a clock, a counter or a random value enters any of these.
  it('renders and derives identically on repeated calls', () => {
    expect(markup()).toBe(markup())
    expect(coverageGapElements(WHEEL_BOLT_SCREENS)).toEqual(
      coverageGapElements(WHEEL_BOLT_SCREENS),
    )
    expect(JSON.stringify(cellsFor(screenById(WHEEL_BOLT_SCREENS, 'screen 7')))).toBe(
      JSON.stringify(cellsFor(screenById(WHEEL_BOLT_SCREENS, 'screen 7'))),
    )
  })
})
