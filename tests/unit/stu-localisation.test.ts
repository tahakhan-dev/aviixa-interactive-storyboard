import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { isForeignProbe } from '../probe-paths'
import { LocalisationScreen } from '../../app/studio/localisation/LocalisationScreen'
import { reachByStudioMatrix, STU_PERSONAS } from '@/studio/modules'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { decisionRecord } from '@/disclosure/decisions'
import { publishCheckById } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  evaluatePublish,
  registerPublishChecks,
} from '@/studio/publish/register'
import { LOCALES, type Locale } from '@/studio/vocab'
import {
  STU_17_MATRIX,
  STU_17_PLATFORM_SIDE,
  STU_17_ROW_IDS,
  STU_17_SOURCE_ROW_COUNT,
  stu17Row,
  type Stu17RowId,
} from '@/studio/modules/stu-17/matrix'
import {
  COVERAGE_CELL_RENDERINGS,
  ELEMENT_LOCALE_STATES,
  OBJ_STU_LOCALE_GAP,
  PERMANENT_LINE,
  WHEEL_BOLT_LOCALISATION,
  WORKER_FACING_ELEMENT_KINDS,
  WORKFLOW_LOCALE_STATES,
  coverageGrid,
  evaluateLocaleCompleteness,
  localeCompletenessCheck,
  withoutElement,
  type LocalisationAuditEntry,
  type LocalisationAuditWrite,
  type LocalisedWorkflow,
} from '@/studio/modules/stu-17/locales'
import * as localesModule from '@/studio/modules/stu-17/locales'
import * as matrixModule from '@/studio/modules/stu-17/matrix'
import * as renderingModule from '@/studio/modules/stu-17/rendering'
import {
  coverageReportAffordance,
  localisationControls,
  localisationService,
  stu17Scenario,
} from '@/studio/modules/stu-17/rendering'

/**
 * `MOD-STU-17` — Localisation. Frozen source §5.17, card L34351-L34498.
 *
 * The four rules this file exists to hold, each with its planted defect
 * recorded in the task report:
 *
 * 1. THE BLOCK IS PER LOCALE (L34361, `FUNC-STU-17-03-A-2` L34410). English
 *    publishes while Spanish is blocked, and the missing element is NAMED.
 * 2. THE CHECK FAILS CLOSED (`FUNC-STU-17-03-A-1` L34409, `AC-STU-149`
 *    L34487). Where it cannot run, EVERY declared locale is blocked.
 * 3. ROW 7 RENDERS NOTHING (L34382). All six cells read `Not applicable`,
 *    so no locale-pack management surface exists anywhere on the Studio.
 * 4. `OBJ-STU-LOCALE` IS A REGISTERED GAP, never an invented `OBJ-1xx`.
 */

const STU_17_DIR = join(process.cwd(), 'src', 'studio', 'modules', 'stu-17')
const APP_DIR = join(process.cwd(), 'app')

/**
 * The two spellings row 7 could reach a screen under. Both carry `[-\s]`
 * because the frozen source writes "locale-pack" HYPHENATED throughout
 * (L34359, L34382) — a pattern spelling it "locale pack" cannot match the
 * one thing it exists to forbid.
 */
const LOCALE_PACK_LIFECYCLE = /locale[-\s]pack\s+(management|versioning|governance)/i
const LOCALE_PACK_MANAGEMENT = /manage\s+(a\s+|the\s+)?locale[-\s]pack/i

/**
 * A CONCURRENT process's scratch probe is skipped. This walk covers all of
 * `app/`, so it meets every probe any sibling suite plants under any surface
 * — `slice-04-gates` under `app/hub/`, `slice-05-gates` under `app/studio/`,
 * `slice-2c-gates` under `app/coverage/` and `app/workflows/` — each deleted
 * the moment its own assertion finishes. Listing one and then reading it
 * fails a correct build on a race, not on a finding.
 * `tests/probe-paths.ts` carries the full account.
 *
 * No `own` argument: this file plants nothing, so it should see no probe.
 */
function filesUnder(dir: string, match: RegExp, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (isForeignProbe(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) filesUnder(full, match, acc)
    else if (match.test(entry.name)) acc.push(full)
  }
  return acc
}

/* ==================================================================== *
 * STEP 1 — the source's own table, L34376-L34383. EIGHT data rows.
 * ==================================================================== */

describe('the permission matrix is the source table at L34376-L34383', () => {
  it('carries all eight source rows across the matrix and the platform-side record', () => {
    expect(STU_17_SOURCE_ROW_COUNT).toBe(8)
    expect(STU_17_MATRIX.length + STU_17_PLATFORM_SIDE.length).toBe(STU_17_SOURCE_ROW_COUNT)
  })

  it('transcribes the seven screen rows in the source’s own order and wording', () => {
    expect(STU_17_MATRIX.map((row) => row.capability)).toEqual([
      'Declare a Workflow’s locale coverage',
      'Author a locale variant',
      'Request artificial-intelligence drafting of a locale variant',
      'Publish into an incomplete locale',
      'Enable run-time machine translation',
      'Add a locale beyond English and Spanish',
      'View the coverage report',
    ])
  })

  it('answers all eight persona columns on every row — no blank cells (L10238)', () => {
    for (const row of STU_17_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.cells[column].note.trim()).not.toBe('')
      }
    }
  })

  it('carries the source’s own cell wording on the three rows that state a reason', () => {
    expect(stu17Row('enable-run-time-machine-translation').cells['quality-manager'].note).toBe(
      'Explicitly prohibited — nothing is translated at run time, anywhere',
    )
    expect(stu17Row('add-a-locale-beyond-english-and-spanish').cells['quality-manager'].note).toBe(
      'Explicitly prohibited — two languages at V1',
    )
    expect(stu17Row('view-the-coverage-report').cells['read-only-auditor'].note).toBe(
      'Client Decision Required — DEC-AUDSTU-001',
    )
  })

  it('declares no `routedTo` at all — the absence IS the answer, MOD-STU-06 style', () => {
    // The surface renders a refusal DISABLED only where a cell's own words
    // point the reader at another row OF THIS MATRIX that the evaluator says
    // this same persona may act on. No cell of this card does, so the field is
    // not written: a map of eight nulls per row that no fold reads is a
    // declaration nothing consults, and that is the shape of defect this slice
    // has now shipped twice. Slice 5 gate 17 holds the cross-module version.
    //
    // FAILS IF: the field is declared again on this card without a fold that
    // reads it.
    for (const row of STU_17_MATRIX) {
      expect(Object.hasOwn(row, 'routedTo'), row.id).toBe(false)
    }
    void STUDIO_PERSONA_COLUMNS
  })

  it('derives reach from its own screen rows', () => {
    const reach = reachByStudioMatrix(STU_17_MATRIX, (row, persona) => row.cells[persona].outcome)
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
    expect(STU_PERSONAS.map((p) => p.id).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
  })
})

/* ==================================================================== *
 * STEP 4 / ROW 7 — all six cells `Not applicable`. NOTHING RENDERS.
 * ==================================================================== */

describe('row 7 — locale-pack versioning and governance sit platform-side', () => {
  it('is not a matrix row, so no persona’s reach is derived from it', () => {
    expect(STU_17_ROW_IDS).not.toContain('manage-locale-pack-versioning-and-governance')
    expect(STU_17_MATRIX.map((r) => r.id as string)).toEqual([...STU_17_ROW_IDS])
  })

  /**
   * FOUND BY PLANTING THE DEFECT, not by reading the code. Adding
   * `surface: 'screen'` to `STU_17_PLATFORM_SIDE` left every assertion above
   * green while making the module unreadable to
   * `scripts/build-stu-module-reach.mjs`, whose `matrixIn` accepts a module
   * directory only when EXACTLY ONE exported array has `surface` on every
   * row. This is that rule, asserted here so the failure is named rather than
   * arriving as "exports no readable permission matrix" at build time.
   */
  it('leaves exactly one array the reach generator can read as this module’s matrix', () => {
    const modules: readonly Readonly<Record<string, unknown>>[] = [
      matrixModule,
      localesModule,
      renderingModule,
    ]
    const readable = modules.flatMap((mod) =>
      Object.entries(mod)
        .filter(
          ([, value]) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((row) => row !== null && typeof row === 'object' && 'surface' in row),
        )
        .map(([name]) => name),
    )
    expect(readable).toEqual(['STU_17_MATRIX'])
  })

  it('records all six source cells verbatim as `Not applicable`', () => {
    const [row] = STU_17_PLATFORM_SIDE
    expect(row).toBeDefined()
    if (row === undefined) throw new Error('row 7 is missing from STU_17_PLATFORM_SIDE')
    expect(row.capability).toBe('Manage locale-pack versioning and governance')
    expect(row.cells.map((c) => c.text)).toEqual([
      'Not applicable — locale-pack versioning sits platform-side',
      'Not applicable — same reason',
      'Not applicable — same reason',
      'Not applicable — same reason',
      'Not applicable — same reason',
      'Not applicable — same reason',
    ])
    expect(row.renders).toBe('nothing')
  })

  it('offers no control for it on any persona’s screen', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const ids = localisationControls(stu17Scenario({ persona })).map((c) => c.id as string)
      expect(ids).not.toContain('manage-locale-pack-versioning-and-governance')
      // A positive control: the list is never empty, so the assertion above
      // cannot pass because nothing was produced.
      expect(ids.length).toBe(6)
    }
  })

  it('offers no locale-pack management anywhere under app/', () => {
    const files = filesUnder(APP_DIR, /\.tsx?$/)
    expect(files.length).toBeGreaterThan(0)
    const corpus = files.map((f) => readFileSync(f, 'utf8')).join('\n')

    // TWO POSITIVE CONTROLS, because a bare `not.toMatch` over a corpus is
    // the shape that passes on an empty scan and on a pattern that could
    // never match anything.
    //
    // One: this module's own screen really is in the corpus.
    expect(corpus).toContain('Localisation coverage —')
    // Two: the patterns DO match the source's own row-7 wording, hyphen and
    // all. The brief's suggested pattern spelled it "locale pack" with a
    // space, which the source never writes — see the task report.
    expect(STU_17_PLATFORM_SIDE[0]?.capability).toMatch(LOCALE_PACK_MANAGEMENT)
    expect(STU_17_PLATFORM_SIDE[0]?.cells[0]?.text).toMatch(LOCALE_PACK_LIFECYCLE)

    expect(corpus).not.toMatch(LOCALE_PACK_LIFECYCLE)
    expect(corpus).not.toMatch(LOCALE_PACK_MANAGEMENT)
  })
})

/* ==================================================================== *
 * STEP 2 — per-locale blocking, never whole-publication blocking.
 * ==================================================================== */

describe('the completeness check blocks per locale (L34361, FUNC-STU-17-03-A-2)', () => {
  it('publishes English and blocks Spanish when a Spanish coaching default is missing', () => {
    const r = evaluateLocaleCompleteness(WHEEL_BOLT_LOCALISATION)
    expect(r.publishable).toEqual(['English'])
    expect(r.blocked).toEqual(['Spanish'])
    expect(r.blockers.map((b) => b.element)).toEqual([
      'Screen 7, Section 6, curated coaching default',
    ])
    expect(r.blockers[0]?.locale).toBe('Spanish')
    expect(r.blockers[0]?.kind).toBe('Designated coaching default')
    expect(r.reason).toBeNull()
  })

  it('publishes both locales once the missing element is designated', () => {
    const complete: LocalisedWorkflow = {
      ...WHEEL_BOLT_LOCALISATION,
      elements: WHEEL_BOLT_LOCALISATION.elements.map((element) => ({
        ...element,
        states: { English: 'Complete', Spanish: 'Complete' } as const,
      })),
    }
    const r = evaluateLocaleCompleteness(complete)
    expect(r.publishable).toEqual(['English', 'Spanish'])
    expect(r.blocked).toEqual([])
    expect(r.blockers).toEqual([])
  })

  it('reads back the per-locale summary lines SB-STU-20 requires', () => {
    const r = evaluateLocaleCompleteness(WHEEL_BOLT_LOCALISATION)
    expect(r.summaries.map((s) => `${s.locale}: ${s.line}`)).toEqual([
      'English: Ready to publish',
      'Spanish: Blocked, 1 missing element',
    ])
    expect(r.summaries.map((s) => s.state)).toEqual([
      'Complete and publishable',
      'Incomplete and blocked',
    ])
    expect(WORKFLOW_LOCALE_STATES).toEqual([
      'Complete and publishable',
      'Incomplete and blocked',
    ])
  })

  it('counts a drafted-but-unreviewed variant separately from a missing one', () => {
    const drafted: LocalisedWorkflow = {
      ...WHEEL_BOLT_LOCALISATION,
      elements: WHEEL_BOLT_LOCALISATION.elements.map((element) =>
        element.kind === 'Screen-specific notes'
          ? {
              ...element,
              states: {
                English: 'Complete',
                Spanish: 'Drafted by artificial intelligence',
              } as const,
            }
          : element,
      ),
    }
    const r = evaluateLocaleCompleteness(drafted)
    expect(r.summaries.map((s) => s.line)).toEqual([
      'Ready to publish',
      'Blocked, 1 missing element and 1 drafted awaiting review',
    ])
    expect(r.blocked).toEqual(['Spanish'])
  })
})

/* ==================================================================== *
 * STEP 3 — FAIL CLOSED. AC-STU-149 (L34487), FUNC-STU-17-03-A-1 (L34409).
 * ==================================================================== */

describe('where the check cannot run, publication is blocked in every locale', () => {
  it('blocks publication in every declared locale when the check cannot run', () => {
    const r = evaluateLocaleCompleteness(WHEEL_BOLT_LOCALISATION, { checkStatus: 'unrunnable' })
    expect(r.publishable).toEqual([])
    expect(r.blocked).toEqual(['English', 'Spanish'])
    expect(r.reason).toMatch(/could not be verified/i)
  })

  it('blocks a Workflow that declares no locale at all rather than passing it', () => {
    const undeclared: LocalisedWorkflow = { ...WHEEL_BOLT_LOCALISATION, declaredLocales: [] }
    const r = evaluateLocaleCompleteness(undeclared)
    expect(r.publishable).toEqual([])
    expect(r.reason).toMatch(/could not be verified/i)
  })

  it('reaches publish check 6 through task 5’s register, per locale', () => {
    const check = publishCheckById('locale-completeness')
    expect(check.ordinal).toBe(6)
    expect(check.ownerModules).toEqual(['MOD-STU-17'])

    const spanish = registerPublishChecks(
      createPublishCheckRegister<LocalisedWorkflow>(),
      localeCompletenessCheck('Spanish'),
    )
    expect(spanish.ok).toBe(true)
    if (!spanish.ok) throw new Error(spanish.failure)
    const blocked = evaluatePublish(spanish.register, WHEEL_BOLT_LOCALISATION)
    const six = blocked.blockers.filter((b) => b.checkId === 'locale-completeness')
    expect(six.map((b) => ({ kind: b.kind, element: b.blockingElement }))).toEqual([
      {
        kind: 'failed',
        element: 'Spanish — Screen 7, Section 6, curated coaching default is missing',
      },
    ])

    const english = registerPublishChecks(
      createPublishCheckRegister<LocalisedWorkflow>(),
      localeCompletenessCheck('English'),
    )
    if (!english.ok) throw new Error(english.failure)
    const passing = evaluatePublish(english.register, WHEEL_BOLT_LOCALISATION)
    expect(passing.passed).toContain('locale-completeness')
    expect(
      passing.blockers.filter((b) => b.checkId === 'locale-completeness'),
    ).toEqual([])
  })

  it('reports `cannot-run` to the register when the check itself cannot answer', () => {
    const registered = registerPublishChecks(
      createPublishCheckRegister<LocalisedWorkflow>(),
      localeCompletenessCheck('English', { checkStatus: 'unrunnable' }),
    )
    if (!registered.ok) throw new Error(registered.failure)
    const evaluation = evaluatePublish(registered.register, WHEEL_BOLT_LOCALISATION)
    const six = evaluation.blockers.filter((b) => b.checkId === 'locale-completeness')
    expect(six.map((b) => b.kind)).toEqual(['cannot-run'])
    expect(six[0]?.blockingElement).toMatch(/could not be verified/i)
    expect(evaluation.passed).not.toContain('locale-completeness')
  })

  it('is refused registration by any module that does not own it (C4)', () => {
    const attempt = registerPublishChecks(createPublishCheckRegister<LocalisedWorkflow>(), {
      ...localeCompletenessCheck('English'),
      implementedBy: 'MOD-STU-09',
    })
    expect(attempt.ok).toBe(false)
    if (attempt.ok) throw new Error('a non-owner was allowed to register check 6')
    expect(attempt.failure).toBe('not-an-owner')
  })
})

/* ==================================================================== *
 * STEP 5 — SB-STU-20's grid. Every Missing cell LINKS to the editor.
 * ==================================================================== */

describe('SB-STU-20 — the coverage grid (L34447)', () => {
  it('draws one row per worker-facing element and one column per declared locale', () => {
    const grid = coverageGrid(WHEEL_BOLT_LOCALISATION)
    expect(grid.locales).toEqual(['English', 'Spanish'])
    expect(grid.elements.length).toBe(WHEEL_BOLT_LOCALISATION.elements.length)
    expect(grid.cells.length).toBe(grid.elements.length * grid.locales.length)
    expect(COVERAGE_CELL_RENDERINGS).toEqual([
      'Complete',
      'Drafted awaiting review',
      'Missing',
    ])
  })

  it('names the element in every Missing cell', () => {
    const grid = coverageGrid(WHEEL_BOLT_LOCALISATION)
    const missing = grid.cells.filter((c) => c.rendering === 'Missing')
    expect(missing.map((c) => c.note)).toEqual([
      'Missing — Screen 7, Section 6, curated coaching default, Spanish',
    ])
  })

  it('links every Missing cell straight to the editor for that element in that locale', () => {
    const grid = coverageGrid(WHEEL_BOLT_LOCALISATION)
    const missing = grid.cells.filter((c) => c.rendering === 'Missing')
    expect(missing.map((c) => c.editorLink?.href)).toEqual([
      '/studio/screen-configuration?workflow=WF-WHEEL-BOLT&screen=SCR-7&element=screen-7-section-6-coaching-default&locale=Spanish',
    ])
  })

  /**
   * R13 — the assertion above is driven by the ELEMENT, not by the grid. With
   * the element gone, its link is gone and the blocker with it; a test that
   * merely iterated the grid would stay green either way.
   */
  it('loses that link when the element itself is removed', () => {
    const without = withoutElement(WHEEL_BOLT_LOCALISATION, 'screen-7-section-6-coaching-default')
    const grid = coverageGrid(without)
    expect(grid.cells.filter((c) => c.rendering === 'Missing')).toEqual([])
    expect(grid.cells.map((c) => c.editorLink?.href ?? null)).not.toContain(
      '/studio/screen-configuration?workflow=WF-WHEEL-BOLT&screen=SCR-7&element=screen-7-section-6-coaching-default&locale=Spanish',
    )
    expect(evaluateLocaleCompleteness(without).blocked).toEqual([])
  })

  it('covers every worker-facing element the source names, coaching defaults included', () => {
    expect(WORKER_FACING_ELEMENT_KINDS).toEqual([
      'Instruction text at each difficulty level',
      'Screen-specific notes',
      'Shared Instruction Blocks',
      'Deviation-capture forms',
      'Coaching assets',
      'Training Library content',
      'Designated coaching default',
    ])
    expect(ELEMENT_LOCALE_STATES).toEqual([
      'Authored',
      'Drafted by artificial intelligence',
      'Reviewed',
      'Complete',
      'Incomplete',
    ])
    // Every kind is actually exercised by the fixture, so the check is
    // demonstrated over the whole element set rather than over one row.
    expect([...new Set(WHEEL_BOLT_LOCALISATION.elements.map((e) => e.kind))].sort()).toEqual(
      [...WORKER_FACING_ELEMENT_KINDS].sort(),
    )
  })

  it('carries the permanent line verbatim (L34447)', () => {
    expect(PERMANENT_LINE).toBe(
      'Nothing is translated at run time. Every locale variant is authored and reviewed.',
    )
  })
})

/* ==================================================================== *
 * STEP 6 — no run-time translation, and no third locale.
 * ==================================================================== */

describe('no run-time translation path and no third locale exist', () => {
  it('draws no control for run-time translation for any persona', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const controls = localisationControls(stu17Scenario({ persona }))
      const translation = controls.find((c) => c.id === 'enable-run-time-machine-translation')
      expect(translation?.affordance.kind).toBe('absent')
      expect(translation?.serviceKey).toBeNull()
      const third = controls.find((c) => c.id === 'add-a-locale-beyond-english-and-spanish')
      expect(third?.affordance.kind).toBe('absent')
      expect(third?.serviceKey).toBeNull()
    }
  })

  it('draws no control for publishing into an incomplete locale, for anybody', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const control = localisationControls(stu17Scenario({ persona })).find(
        (c) => c.id === 'publish-into-an-incomplete-locale',
      )
      expect(control?.affordance.kind).toBe('absent')
    }
  })

  it('enables authoring for the two personas the source allows, and only those', () => {
    const enabled = STUDIO_PERSONA_COLUMNS.filter((persona) => {
      const control = localisationControls(stu17Scenario({ persona })).find(
        (c) => c.id === 'author-a-locale-variant',
      )
      return control?.affordance.kind === 'enabled'
    })
    expect(enabled).toEqual([
      'quality-manager',
      'supervisor-with-authoring-grant',
      'implementation-team',
    ])
  })

  it('closes the locale set at two', () => {
    expect(LOCALES).toEqual(['English', 'Spanish'])
    // A third locale is not a runtime refusal to be tested — it does not
    // type-check, which is the strongest form the refusal can take.
    // @ts-expect-error `Locale` is closed at English and Spanish (L34381).
    const third: Locale = 'French'
    expect(third).toBe('French')
  })
})

/* ==================================================================== *
 * D11 — `OBJ-STU-LOCALE` is a registered gap, handed to task 25.
 * ==================================================================== */

describe('D11 — OBJ-STU-LOCALE has no numeric counterpart', () => {
  it('registers the gap rather than papering over it', () => {
    expect(OBJ_STU_LOCALE_GAP.mnemonic).toBe('OBJ-STU-LOCALE')
    expect(OBJ_STU_LOCALE_GAP.numericCounterpart).toBeNull()
    expect(OBJ_STU_LOCALE_GAP.notThisObject.id).toBe('OBJ-051')
    expect(OBJ_STU_LOCALE_GAP.notThisObject.locator).toBe('L8875')
    expect(OBJ_STU_LOCALE_GAP.handOffTo).toContain('Task 25')
  })

  it('is the same gap task 3 recorded on D11, not a second copy of the ruling', () => {
    expect(decisionRecord('D11').adopted).toContain('OBJ-STU-LOCALE')
    expect(OBJ_STU_LOCALE_GAP.decision).toBe('D11')
  })

  it('mints no OBJ-1xx identifier anywhere in this module', () => {
    const files = filesUnder(STU_17_DIR, /\.tsx?$/)
    expect(files.length).toBeGreaterThan(0)
    const corpus = files.map((f) => readFileSync(f, 'utf8')).join('\n')
    expect(corpus).toContain('OBJ-STU-LOCALE')
    expect(corpus.match(/OBJ-1\d\d/g)).toBeNull()
  })
})

/* ==================================================================== *
 * The Derived Clarification at L34361 — BOTH readings render.
 * ==================================================================== */

describe('the per-locale reading is disclosed from the canon, never presented as settled', () => {
  // FAILS IF: the canonical record loses a reading, a reading loses its own
  // locator, or a reading gains a field in which it could be marked the answer.
  it('holds both readings with their own locators, and neither is the answer', () => {
    const record = decisionRecord('D29')
    // The source states this conflict at L34361 and never gives it a `DEC-*`
    // identifier, so the record says so rather than inventing one.
    expect(record.decisionRef).toBeNull()
    expect(record.alias).toBeNull()
    expect(record.readings).toHaveLength(2)
    for (const r of record.readings) expect(r.locator).toContain('L34361')
    expect(record.readings[0]?.text).toMatch(/publishes in English and is blocked in Spanish/)
    expect(record.readings[1]?.text).toMatch(/any incompleteness blocks the whole publication/)
    for (const r of record.readings) expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
    // The position, and the cost of it, live only in `adopted`.
    expect(record.adopted).toMatch(/per-locale/i)
    expect(record.adopted).toMatch(/Derived Clarification/)
    expect(record.adopted).toMatch(/partially localised improvement impossible to ship/)
  })

  // THE HALF THAT MATTERS. FAILS IF: `MOD-STU-17` mints its own copy of the
  // decision again, under ANY name -- two wordings of one decision is how one
  // of them quietly stops mentioning the alternative. Not keyed on the old
  // export's name, because a re-mint would simply be called something else.
  // Proven able to fail by planting `PER_LOCALE_BLOCKING` back: see the task
  // report.
  it('keeps no local copy of the decision anywhere in the module', () => {
    const localCopies = Object.entries(localesModule)
      .filter(([, value]) => Array.isArray((value as { readings?: unknown } | null)?.readings))
      .map(([name]) => name)
    expect(localCopies).toEqual([])
    // A positive control, so the assertion above cannot pass on an empty scan:
    // the module really is loaded and really does export its seeds.
    expect(Object.keys(localesModule)).toContain('WHEEL_BOLT_LOCALISATION')
  })

  // FAILS IF: the screen goes back to wording the decision itself, or renders
  // the canonical record without its alternative. Every assertion is read OFF
  // THE RECORD, so a rewording follows instead of going stale.
  it('renders the canonical record on the screen, both readings and the label', () => {
    const record = decisionRecord('D29')
    const html = renderToStaticMarkup(createElement(LocalisationScreen))
    expect(html).toContain(record.question)
    for (const r of record.readings) expect(html).toContain(r.text)
    expect(html).toContain(record.adopted)
    expect(html).toContain('client-delegated choice')
    expect(html).toContain('APP-012')
    // AND NO SECOND WORDING: the screen must not hand-render the tension.
    const screen = readFileSync(
      join(APP_DIR, 'studio', 'localisation', 'LocalisationScreen.tsx'),
      'utf8',
    )
    expect(screen).toContain('<DecisionDisclosure id="D29" />')
    expect(screen).not.toContain('per-locale-disclosure')
    expect(screen).not.toContain('Both readings stand')
  })
})

/* ==================================================================== *
 * Nothing this screen offers is a dead control.
 * ==================================================================== */

describe('no control writes state nothing reads', () => {
  it('gives every enabled control a real service key', () => {
    const seen = new Set<Stu17RowId>()
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      for (const control of localisationControls(stu17Scenario({ persona }))) {
        if (control.affordance.kind !== 'enabled') continue
        expect(control.serviceKey).not.toBeNull()
        seen.add(control.id)
      }
    }
    expect([...seen].sort()).toEqual([
      'author-a-locale-variant',
      'declare-a-workflows-locale-coverage',
      'request-artificial-intelligence-drafting-of-a-locale-variant',
    ])
  })

  /**
   * The effect, not the call. Designating the Spanish coaching default is the
   * one act the card's example describes, and what makes it real is that
   * Spanish becomes publishable afterwards.
   */
  it('authoring the missing variant is what unblocks the locale', () => {
    const log: LocalisationAuditEntry[] = []
    const result = localisationService.authorLocaleVariant(
      WHEEL_BOLT_LOCALISATION,
      'screen-7-section-6-coaching-default',
      'Spanish',
      'Complete',
      'IDN-BB-SAM',
      (entry) => {
        log.push(entry)
        return 'committed'
      },
    )
    expect(result.outcome).toBe('applied')
    if (result.outcome !== 'applied') throw new Error(result.reason)
    expect(evaluateLocaleCompleteness(result.workflow).publishable).toEqual([
      'English',
      'Spanish',
    ])
    expect(coverageGrid(result.workflow).cells.filter((c) => c.rendering === 'Missing')).toEqual([])
    expect(log.map((e) => e.detail)).toEqual([
      'Screen 7, Section 6, curated coaching default, Spanish — Complete',
    ])
    // The workflow handed in is never mutated.
    expect(evaluateLocaleCompleteness(WHEEL_BOLT_LOCALISATION).blocked).toEqual(['Spanish'])
  })

  it('drafting a variant does NOT unblock the locale — it awaits review (AC-STU-146)', () => {
    const result = localisationService.requestDrafting(
      WHEEL_BOLT_LOCALISATION,
      'screen-7-section-6-coaching-default',
      'Spanish',
      'IDN-BB-SAM',
      () => 'committed',
    )
    if (result.outcome !== 'applied') throw new Error(result.reason)
    const after = evaluateLocaleCompleteness(result.workflow)
    expect(after.publishable).toEqual(['English'])
    expect(after.blocked).toEqual(['Spanish'])
    expect(after.summaries.map((s) => s.line)).toEqual([
      'Ready to publish',
      'Blocked, 1 drafted awaiting review',
    ])
  })

  it('refuses every act whose audit entry cannot be written (FB-STU-10)', () => {
    const refuse: LocalisationAuditWrite = () => 'failed'
    const acts = [
      () =>
        localisationService.declareLocaleCoverage(
          WHEEL_BOLT_LOCALISATION,
          ['English'],
          'IDN-BB-SAM',
          refuse,
        ),
      () =>
        localisationService.authorLocaleVariant(
          WHEEL_BOLT_LOCALISATION,
          'screen-7-section-6-coaching-default',
          'Spanish',
          'Complete',
          'IDN-BB-SAM',
          refuse,
        ),
      () =>
        localisationService.requestDrafting(
          WHEEL_BOLT_LOCALISATION,
          'screen-7-section-6-coaching-default',
          'Spanish',
          'IDN-BB-SAM',
          refuse,
        ),
    ]
    // All three, not one: an audit contract demonstrated on a single handler
    // is demonstrated where it costs nothing.
    expect(acts.map((run) => run().outcome)).toEqual(['refused', 'refused', 'refused'])
  })

  it('refuses a third locale at run time as well as at compile time', () => {
    const result = localisationService.declareLocaleCoverage(
      WHEEL_BOLT_LOCALISATION,
      ['English', 'French' as Locale],
      'IDN-BB-SAM',
      () => 'committed',
    )
    expect(result.outcome).toBe('refused')
    if (result.outcome !== 'refused') throw new Error('a third locale was accepted')
    expect(result.reason).toMatch(/two languages at V1/i)
  })

  it('gates the coverage report itself, once, in the read', () => {
    const kinds = STUDIO_PERSONA_COLUMNS.map(
      (persona) => coverageReportAffordance(stu17Scenario({ persona })).kind,
    )
    expect(kinds).toEqual([
      'enabled',
      'enabled',
      'disabled',
      'disabled',
      'disabled',
      'decision-open',
      'absent',
      'enabled',
    ])
  })

  it('never enables a control on a row the matrix refuses', () => {
    const refusedEverywhere: readonly Stu17RowId[] = [
      'publish-into-an-incomplete-locale',
      'enable-run-time-machine-translation',
      'add-a-locale-beyond-english-and-spanish',
    ]
    for (const id of refusedEverywhere) {
      for (const column of STUDIO_PERSONA_COLUMNS as readonly StudioPersonaColumn[]) {
        expect(stu17Row(id).cells[column].outcome).toBe('explicitlyProhibited')
      }
    }
  })
})
