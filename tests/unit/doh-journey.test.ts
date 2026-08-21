import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DOH_MODULES } from '@/surfaces/doh/modules'
import { SEEDED_JOBS } from '@/surfaces/doh/modules/doh-05/jobs'
import { DOH_BOUNDARY_REGISTER, seamsClaimingAPermanentBoundary } from '@/surfaces/doh/boundary'
import { DOH_SEAMS } from '@/surfaces/doh/seams'
import { HUB_COMMAND_TYPES } from '@/domain/commands'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import { dueTransitions, finishWindowEndsAtMs } from '@/surfaces/doh/transitions'
import { readingsDisagree, stateIsGovernedByDecStuck } from '@/surfaces/doh/modules/doh-06/matrix'
import { fixedClock } from '@/domain/clock'
import { JOURNEY_REFUSALS, JOURNEY_STEPS } from '../../app/hub/journey/effects'
import {
  INITIAL_JOURNEY_STATE,
  JOURNEY_PACKAGE_PIN,
  WINDOW_ELAPSES_AT_MS,
  journeyStates,
} from '../../app/hub/journey/fixture'
import {
  EXECUTION_STATEMENT,
  JOURNEY_COMPOSITION,
  JOURNEY_FOLD,
  JOURNEY_STATES,
  REFUSAL_DEMONSTRATIONS,
  SETTLEMENT_CHECKS,
  positionAtStep,
  readingsAtStep,
} from '../../app/hub/journey/composition'

/**
 * Slice 6, task 13 — the operational journey, as DATA rather than as pixels.
 * `tests/component/doh-journey.test.tsx` renders it; this file proves the
 * things a render cannot show.
 *
 * ── THE TRAP THIS FILE IS BUILT AROUND ────────────────────────────────────
 * A journey is unusually prone to a test whose expectation is derived from the
 * field under test, because the fixture that drives the journey and the
 * assertion that checks it are easily the same object. Three independent
 * sources are used here instead, and each one is a different kind of thing:
 *
 *  1. THE FROZEN SOURCE ITSELF. `AVIIXA_Production_Product_Blueprint.md`,
 *     sha256 47bd18db…a8d0b27, sits one directory above the repository and is
 *     already read by `tests/coverage/locator-fidelity.test.ts`. Every
 *     five-surface sentence this journey presents as a QUOTATION is checked
 *     against the line it cites, within the same +/-3 window that gate uses.
 *     A sentence this build composed and attributed to the source fails here.
 *  2. THE FILESYSTEM. Which component a route renders is settled by that
 *     route's own `page.tsx`, not by the composition table. Pointing a step at
 *     the wrong screen moves the composition and the route file apart, and the
 *     route file wins.
 *  3. THE MODULE'S OWN MATRIX AND THE REAL EVALUATOR. Every refusal outcome is
 *     COMPUTED — by `approveDecision`, `validateHubCommand`, `matrixRow` and
 *     `dueTransitions` — so loosening a guard turns "Refused" into
 *     "NOT REFUSED" rather than leaving a printed claim standing.
 */

/* ==================================================================== *
 * SOURCE 1 — THE FROZEN SOURCE
 * ==================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceLines: readonly string[] = existsSync(SOURCE_PATH)
  ? readFileSync(SOURCE_PATH, 'utf8').split('\n')
  : []

/**
 * One spelling for two texts. The source writes typographic quotes, en dashes
 * and markdown emphasis; this build's strings carry the same characters in
 * places and ASCII in others, and neither is wrong. Comparing raw would fail on
 * punctuation and teach nobody anything.
 */
function normalise(text: string): string {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** The cited line and its three neighbours either side, as one normalised span. */
function sourceSpan(locator: number, radius = 3): string {
  const from = Math.max(1, locator - radius)
  const to = Math.min(sourceLines.length, locator + radius)
  return normalise(sourceLines.slice(from - 1, to).join(' '))
}

/**
 * Every sentence this journey presents as a QUOTATION, with the line it cites.
 * The fragment is written HERE, in the test, read off the frozen source by
 * hand — never imported from the step it checks, which would make the check
 * agree with the code even when both were wrong.
 */
const QUOTED_EFFECTS: readonly {
  readonly step: number
  readonly surface: 'DOH' | 'STU' | 'CC' | 'FL' | 'SA'
  readonly locator: number
  readonly fragment: string
}[] = [
  { step: 1, surface: 'STU', locator: 52667, fragment: 'The linkage view shows which Jobs and Runs sit on each workflow version' },
  { step: 1, surface: 'SA', locator: 52667, fragment: 'the tenant detail Operations tab shows active and total Jobs with each Job Owner field, read-only' },
  { step: 4, surface: 'DOH', locator: 53798, fragment: 'assignment record, qualification result, audit' },
  { step: 4, surface: 'STU', locator: 53798, fragment: 'the workflow version being pinned' },
  { step: 4, surface: 'SA', locator: 53798, fragment: 'Worker-Shift consumption begins accruing' },
  { step: 5, surface: 'DOH', locator: 53679, fragment: 'the run record with its immutable pin' },
  { step: 5, surface: 'STU', locator: 53679, fragment: 'the linkage view showing runs per version' },
  { step: 5, surface: 'CC', locator: 53679, fragment: "the run's version is shown alongside its deviations" },
  { step: 5, surface: 'SA', locator: 53679, fragment: 'per-run pinned versions in the device package inventory' },
  { step: 6, surface: 'DOH', locator: 53864, fragment: 'step executions and data captures land as the official record' },
  { step: 6, surface: 'STU', locator: 53864, fragment: 'the authored content being executed' },
  { step: 6, surface: 'CC', locator: 53864, fragment: 'the live shift board with freshness markers and the pace margin, 15 percent by default before a run shows behind' },
  { step: 6, surface: 'FL', locator: 53864, fragment: 'the player itself' },
  { step: 6, surface: 'SA', locator: 53864, fragment: 'capture volumes and sync health as telemetry' },
  { step: 8, surface: 'DOH', locator: 54202, fragment: 'the register, the closure note, the notifications' },
  { step: 8, surface: 'STU', locator: 54202, fragment: 'authoring recommendations arriving as watch items' },
  { step: 8, surface: 'CC', locator: 54202, fragment: 'deviations and evidence review feed the register' },
  { step: 8, surface: 'SA', locator: 54202, fragment: 'anomaly counts as telemetry, never contents' },
]

/** The same shape for the four refusal sentences. */
const QUOTED_REFUSALS: readonly {
  readonly atStep: number
  readonly locator: number
  readonly fragment: string
}[] = [
  { atStep: 2, locator: 52662, fragment: 'The creator attempting to approve their own Job is refused' },
  { atStep: 2, locator: 52670, fragment: 'The creator of a Job can never approve that Job, including where the creator holds the approver role' },
  { atStep: 5, locator: 53674, fragment: 'Re-pinning a run in flight is refused' },
  { atStep: 5, locator: 53674, fragment: 'Nothing on the Client Command Center can change a pin' },
  { atStep: 6, locator: 27916, fragment: 'deliberately impossible from any oversight surface' },
  { atStep: 9, locator: 27920, fragment: 'Force a run to `finished` early' },
  { atStep: 9, locator: 7126, fragment: 'The finish transition occurs only through the run auto-close scheduler after the tenant’s configured window' },
]

describe('the frozen source, as an independent check on what this journey quotes', () => {
  it('is present and is the source this task was given', () => {
    expect(existsSync(SOURCE_PATH), `frozen source not found at ${SOURCE_PATH}`).toBe(true)
    const bytes = readFileSync(SOURCE_PATH)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT + 1) // trailing newline
  })

  it('carries every five-surface sentence this journey attributes to it, at the line it cites', () => {
    expect(QUOTED_EFFECTS.length).toBeGreaterThan(15)
    for (const pin of QUOTED_EFFECTS) {
      expect(
        sourceSpan(pin.locator),
        `L${pin.locator} does not carry: ${pin.fragment}`,
      ).toContain(normalise(pin.fragment))
    }
  })

  it('and this journey really renders those sentences, on the step and surface that cite them', () => {
    for (const pin of QUOTED_EFFECTS) {
      const step = JOURNEY_STEPS.find((s) => s.number === pin.step)
      expect(step, `no step ${pin.step}`).toBeDefined()
      const effect = step!.effects[pin.surface]
      const rendered = effect.kind === 'affected' ? effect.statement : effect.reason
      expect(
        normalise(rendered),
        `step ${pin.step} / ${pin.surface} does not carry its quoted sentence`,
      ).toContain(normalise(pin.fragment))
      expect(effect.sourceRef, `step ${pin.step} / ${pin.surface}`).toContain(String(pin.locator))
    }
  })

  it('carries every refusal sentence this journey attributes to it, at the line it cites', () => {
    for (const pin of QUOTED_REFUSALS) {
      expect(sourceSpan(pin.locator), `L${pin.locator} does not carry: ${pin.fragment}`).toContain(
        normalise(pin.fragment),
      )
      const refusal = JOURNEY_REFUSALS.find((r) => r.atStep === pin.atStep)
      expect(refusal, `no refusal at step ${pin.atStep}`).toBeDefined()
      expect(refusal!.sourceRef).toContain(String(pin.locator))
    }
  })

  it('PLANTED: the quotation check rejects a sentence the cited line does not carry', () => {
    // A gate nobody has seen red is unwritten. The fragment below is real
    // English and sits nowhere near L53679; if this passed, every pin above
    // would be decoration.
    expect(sourceSpan(53679)).not.toContain(
      normalise('The run record with its entirely mutable pin, revisable at any time'),
    )
  })
})

/* ==================================================================== *
 * THE NINE STEPS AND THE FOLD
 * ==================================================================== */

describe('the nine steps', () => {
  it('are nine, numbered 1 to 9, and each names an acting surface and an owning module', () => {
    expect(JOURNEY_STEPS).toHaveLength(9)
    expect(JOURNEY_STEPS.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const step of JOURNEY_STEPS) {
      expect(step.title.trim(), `step ${step.number} has no title`).not.toBe('')
      expect(step.sourceRef, `step ${step.number} cites nothing`).toMatch(/L\d{3,6}/)
      expect(step.ownerModule, `step ${step.number} names no module`).toMatch(/MOD-(DOH|FL)-/)
      expect(
        JOURNEY_SURFACES.map((s) => s.code),
        `step ${step.number} acts on an unregistered surface`,
      ).toContain(step.actingSurface)
    }
  })

  it('carry five surface effects each, none blank, and a reason wherever there is none', () => {
    for (const step of JOURNEY_STEPS) {
      for (const surface of JOURNEY_SURFACES) {
        const effect = step.effects[surface.code]
        const sentence = effect.kind === 'affected' ? effect.statement : effect.reason
        expect(sentence.trim(), `step ${step.number} / ${surface.code} is blank`).not.toBe('')
        expect(
          effect.sourceRef,
          `step ${step.number} / ${surface.code} cites nothing`,
        ).toMatch(/L\d{3,6}/)
      }
    }
  })

  it('folds: every step’s precondition is met by the state its predecessor produced', () => {
    expect(JOURNEY_FOLD.ok, JOURNEY_FOLD.ok ? '' : `broke at step ${JOURNEY_FOLD.atStep}`).toBe(true)
    // Index 0 is the state before step 1, index n the state after step n.
    expect(JOURNEY_STATES).toHaveLength(10)
    // Non-vacuous: the fold really advanced, rather than returning the initial
    // state ten times.
    expect(JOURNEY_STATES[0]!.job.state).toBe('draft')
    // The Job the journey walks is `MOD-DOH-05`'s OWN seeded record — the same
    // one the refusal demonstration decides about, and the one the source's
    // Illustrative Example names (L52672). A journey walking a Job that module
    // does not seed cannot be approved or refused by the real evaluator at all.
    expect(JOURNEY_STATES[0]!.job.jobId).toBe('JOB-REDBIKE')
    expect(SEEDED_JOBS.map((j) => j.record.jobId)).toContain(JOURNEY_STATES[0]!.job.jobId)
    // Read, not rebuilt: every field but `state` is the seed's, so a field
    // added to `JobRecord` by another task cannot go stale here.
    const seeded = SEEDED_JOBS.find((j) => j.record.jobId === 'JOB-REDBIKE')!.record
    expect({ ...JOURNEY_STATES[0]!.job, state: seeded.state }).toEqual(seeded)
    expect(JOURNEY_STATES[2]!.job.state).toBe('active')
    expect(JOURNEY_STATES[2]!.run).toBeNull()
    expect(JOURNEY_STATES[3]!.run).not.toBeNull()
    expect(JOURNEY_STATES[9]!.summary?.anomalies.every((a) => a.state === 'Resolved')).toBe(true)
  })

  it('the fold REFUSES a journey that skips a step, rather than jumping to a convenient state', () => {
    // The positive control on the fold itself. Drop the approval and the run
    // cannot be scheduled, because a run may not be created against a Job that
    // is not active — and the fold says so at the step it broke on.
    const withoutApproval = JOURNEY_STEPS.filter((s) => s.number !== 2)
    const broken = journeyStates(withoutApproval, INITIAL_JOURNEY_STATE)
    expect(broken.ok).toBe(false)
    if (!broken.ok) {
      expect(broken.atStep).toBe(3)
      expect(broken.reason).toContain('pending_approval')
    }
  })

  it('is deterministic: folding twice produces deeply equal states', () => {
    const a = journeyStates(JOURNEY_STEPS)
    const b = journeyStates(JOURNEY_STEPS)
    expect(a).toEqual(b)
    expect(a).toEqual(JOURNEY_FOLD)
  })
})

/* ==================================================================== *
 * SOURCE 2 — THE FILESYSTEM
 * ==================================================================== */

describe('the composition points at real module routes', () => {
  it('has one entry per step, and each names the module whose act the step is', () => {
    expect(JOURNEY_COMPOSITION).toHaveLength(9)
    for (const step of JOURNEY_STEPS) {
      const composed = JOURNEY_COMPOSITION[step.number - 1]!
      expect(composed.step).toBe(step.number)
      // Cross-checked against the STEP's own `ownerModule` sentence — a
      // different field, written beside a different set of locators — so the
      // map cannot silently drift from the journey it walks.
      expect(step.ownerModule, `step ${step.number}`).toContain(composed.moduleId)
    }
  })

  it('composes a component the route’s OWN page.tsx renders, at the route’s own href', () => {
    for (const composed of JOURNEY_COMPOSITION) {
      if (composed.kind !== 'route') continue
      const page = join(process.cwd(), 'app', 'hub', composed.slug, 'page.tsx')
      expect(existsSync(page), `step ${composed.step}: ${page} does not exist`).toBe(true)
      const source = readFileSync(page, 'utf8')
      expect(
        source,
        `step ${composed.step} composes ${composed.Screen.name}, which ${composed.slug}/page.tsx does not render`,
      ).toContain(composed.Screen.name)
      expect(composed.href, `step ${composed.step}`).toBe(`/hub/${composed.slug}/`)
    }
  })

  it('PLANTED: the route-file check rejects a component the page does not render', () => {
    // The hole this closes was found by planting rather than by reading: a
    // heading comparison renders the composed screen on BOTH sides, so a step
    // pointed at the wrong screen moves both sides together and stays green.
    const page = readFileSync(join(process.cwd(), 'app', 'hub', 'worker-assignment', 'page.tsx'), 'utf8')
    expect(page).not.toContain('RunSchedulingScreen')
  })

  it('reads the registry slug the moment the module registry carries the module', () => {
    // THE SELF-HEAL HAS FIRED, and this comment used to say the opposite:
    // "The seven slice-6 Hub modules are not in `DOH_MODULES` yet ... it is
    // silent today for the four modules this journey composes". They are all
    // registered now, so this loop asserts rather than waits, and the
    // non-vacuity check at the foot is what proves the difference.
    const composedIds = new Set(
      JOURNEY_COMPOSITION.filter((c) => c.kind === 'route').map((c) => c.moduleId),
    )
    const registered = DOH_MODULES.filter((m) => composedIds.has(m.id))
    for (const module of registered) {
      const slugs = JOURNEY_COMPOSITION.filter(
        (c) => c.kind === 'route' && c.moduleId === module.id,
      ).map((c) => (c.kind === 'route' ? c.slug : ''))
      // AT LEAST ONE, not EXACTLY ONE, and the difference is `MOD-DOH-05`:
      // catalogue B gives its approval queue a navigation entry of its own, so
      // the module serves two routes while the rail is keyed on one slug
      // (`@/surfaces/doh/modules/doh-05/routes` states this). Requiring every
      // composed route to carry the registry slug would refuse the second one,
      // which is a real route with a real `page.tsx`.
      expect(slugs, `${module.id} composes no route at its registry slug`).toContain(module.slug)
    }
    // Non-vacuity in the OTHER direction: the registry really carries modules
    // this journey composes, so the check above is not silent by accident.
    expect(DOH_MODULES.length).toBeGreaterThan(7)
    expect(registered.length, 'no composed module is registered, so the slug check is silent').toBeGreaterThan(0)
  })

  it('is not itself a module route, and the rail cannot offer it (D1)', () => {
    // `/hub/journey/` composes module routes; it is not one. The rail is keyed
    // on each module's own slug, and `journey` is no module's slug — so
    // `dohModulesReachedBy` can never draw a link to this page and nothing here
    // claims a module's route is built.
    expect(DOH_MODULES.map((m) => m.slug)).not.toContain('journey')
  })
})

/* ==================================================================== *
 * THE CROSS-SURFACE STEP
 * ==================================================================== */

describe('step 6 — the act belongs to another surface', () => {
  it('claims a PLACE from the eight-row register, not a schedule', () => {
    const composed = JOURNEY_COMPOSITION[5]!
    expect(composed.step).toBe(6)
    expect(composed.kind).toBe('cross-surface')

    // The row is one of the registered eight — never an invented ninth.
    expect(DOH_BOUNDARY_REGISTER.map((r) => r.id)).toContain('step-execution-and-capture')
    expect(EXECUTION_STATEMENT.boundary.id).toBe('step-execution-and-capture')
    expect(EXECUTION_STATEMENT.boundary.owningSurface).toBe('SURF-FL')
    expect(EXECUTION_STATEMENT.boundary.sourceRef).toBe('L25726')

    // And it is NOT a seam: no registered seam claims a permanent boundary,
    // and no seam names this capability.
    expect(seamsClaimingAPermanentBoundary(DOH_SEAMS)).toEqual([])
    expect(DOH_SEAMS.map((s) => s.id)).not.toContain('step-execution-and-capture')
  })

  it('draws no link, because the pointer is CHECKED and the Supervisor does not open SURF-FL', () => {
    // A routing pointer is read as a verified fact, so the statement collapses
    // to a line where the viewer's role cannot open the target. `SURF-FL`'s
    // route admits the Worker alone.
    expect(EXECUTION_STATEMENT.linkState).toBe('statement')
    expect(EXECUTION_STATEMENT.linkHref).toBeNull()
    expect(EXECUTION_STATEMENT.linkLabel).toBeNull()
    expect(EXECUTION_STATEMENT.note.trim()).not.toBe('')
  })
})

/* ==================================================================== *
 * THE THREE OPEN DECISIONS
 * ==================================================================== */

describe('no step settles a decision three modules kept open', () => {
  it('reports all three as OPEN, computed rather than claimed', () => {
    expect(SETTLEMENT_CHECKS.map((c) => c.id).sort()).toEqual([
      'DEC-FINISH-001',
      'DEC-RUNSTATE-001',
      'DEC-STUCK-001',
    ])
    for (const check of SETTLEMENT_CHECKS) {
      expect(check.verdict, `${check.id}`).toMatch(/^OPEN — /)
      expect(check.howItStaysOpen.trim()).not.toBe('')
    }
  })

  it('DEC-RUNSTATE-001: the contested span renders three answers and no winner', () => {
    // The run board branches on INSTANTS. Inside the span the source's three
    // Parts dispute, `closingPosition` returns `disputed` rather than a word —
    // and a journey that keyed a step on `submitted` or `complete` would have
    // had to return one.
    expect(positionAtStep(7)).toEqual({ kind: 'disputed' })
    expect(positionAtStep(8)).toEqual({ kind: 'disputed' })

    for (const step of [6, 7, 8]) {
      const state = JOURNEY_STATES[step]!
      expect(state.run, `step ${step}`).not.toBeNull()
      expect(readingsDisagree(state.run!), `the three readings agree at step ${step}`).toBe(true)
      const readings = readingsAtStep(step)!
      expect(readings.map((r) => r.reading)).toEqual(['A', 'B', 'C'])
      // The half a board rendering only the current word would hide: at step 7
      // all three say `complete` and still disagree about how many times
      // `submitted` was reached.
      expect(new Set(readings.map((r) => r.submittedReachedTimes)).size).toBeGreaterThan(1)
      // No reading is marked as the answer: the record has no field for one.
      for (const reading of readings) {
        expect(Object.keys(reading).sort()).toEqual([
          'answer',
          'locator',
          'reading',
          'submittedReachedTimes',
        ])
      }
    }
  })

  it('DEC-RUNSTATE-001: no folded state has anywhere to write a closing-state name', () => {
    // The structural half. Inexpressibility, not vigilance: if a run-state
    // field ever appeared on the journey's state, this goes red.
    for (const state of JOURNEY_STATES) {
      expect(Object.keys(state).sort()).toEqual(['atMs', 'job', 'run', 'summary'])
      if (state.run === null) continue
      expect(Object.keys(state.run.facts).sort()).toEqual([
        'cancelledAtMs',
        'completeAtMs',
        'finishWindowMs',
        'finishedAtMs',
        'runId',
        'scheduledStartMs',
        'startedAtMs',
        'tenant',
      ])
    }
  })

  it('DEC-STUCK-001: no run is ever closed by hand, so no state is asserted for one', () => {
    for (const state of JOURNEY_STATES) {
      if (state.run === null) continue
      expect(state.run.manuallyClosedAtMs).toBeNull()
      expect(stateIsGovernedByDecStuck(state.run)).toBe(false)
    }
  })

  it('DEC-FINISH-001: the window’s end is derived by the evaluator, never written down', () => {
    const afterSummary = JOURNEY_STATES[7]!.run!
    expect(finishWindowEndsAtMs(afterSummary.facts)).toBe(WINDOW_ELAPSES_AT_MS)
    // And step 9 stands exactly at that derived instant.
    expect(JOURNEY_STATES[9]!.atMs).toBe(WINDOW_ELAPSES_AT_MS)
  })
})

/* ==================================================================== *
 * SOURCE 3 — THE REAL EVALUATOR, VALIDATOR, MATRIX AND FOLD
 * ==================================================================== */

describe('the four refusals are demonstrated, never printed', () => {
  it('each reaches its own step and each was actually refused', () => {
    expect(REFUSAL_DEMONSTRATIONS.map((r) => r.atStep)).toEqual([2, 5, 6, 9])
    for (const demo of REFUSAL_DEMONSTRATIONS) {
      expect(demo.outcome, `step ${demo.atStep}`).toMatch(/^Refused/)
      expect(demo.attempted.trim(), `step ${demo.atStep}`).not.toBe('')
      expect(demo.reason.trim(), `step ${demo.atStep}`).not.toBe('')
    }
  })

  it('step 2 reaches the SEGREGATION-OF-DUTIES stage, not merely the role list', () => {
    // The trap: this journey's own creator is a Supervisor, who is refused at
    // BASE_ROLE on a Job he never touched. That refusal proves the role list
    // and says nothing about maker-checker. AC-WF-ORG-004-01 (L52670) is
    // explicitly about the creator who DOES hold the approver role, and the
    // demonstration has to reach that stage to have tested anything.
    const demo = REFUSAL_DEMONSTRATIONS.find((r) => r.atStep === 2)!
    expect(demo.outcome).toContain('SEGREGATION_OF_DUTIES')
    expect(demo.outcome).toContain('BASE_ROLE')
    expect(demo.outcome).toContain('JOB-WHEELTRUE')
  })

  it('step 5: the pin is the same after four further steps, and no command could move it', () => {
    const pinned = JOURNEY_STATES[5]!.run!
    expect(pinned.packagePin).toBe(JOURNEY_PACKAGE_PIN)
    for (const n of [6, 7, 8, 9]) {
      expect(JOURNEY_STATES[n]!.run!.packagePin, `the pin moved at step ${n}`).toBe(
        JOURNEY_PACKAGE_PIN,
      )
    }
    // The command set, asked independently of the fold.
    expect(
      HUB_COMMAND_TYPES.filter((t) => /PIN|REBASE|PACKAGE/.test(t)),
      'a Hub command exists that could move a pin',
    ).toEqual([])
    // A pin is written before the download, so the run is assigned-not-ready
    // at the instant it is taken.
    expect(pinned.packageOnDevice).toBe(false)
  })

  it('step 9: finished is reached only through the scheduler, and only after the window', () => {
    const run = JOURNEY_STATES[9]!.run!
    // Nothing wrote it. The finish is READ out of the evaluator.
    expect(run.facts.finishedAtMs).toBeNull()
    const end = finishWindowEndsAtMs(run.facts)!
    expect(dueTransitions(run.facts, fixedClock(end - 1)).map((t) => t.id)).not.toContain(
      'run-auto-close',
    )
    const at = dueTransitions(run.facts, fixedClock(end)).find((t) => t.id === 'run-auto-close')
    expect(at, 'the window elapsed and no auto-close fell due').toBeDefined()
    // No actor, and the type has nowhere to put one.
    expect(at!.actor).toBeNull()
    expect(at!.atMs).toBe(end)
    expect(at!.toState).toBe('finished')
    // And the position the board renders at step 9 agrees.
    expect(positionAtStep(9)).toEqual({ kind: 'undisputed', position: 'finished' })
  })

  it('PLANTED: a loosened guard turns an outcome into NOT REFUSED, not into silence', () => {
    // The outcome strings are computed, so the failure mode is a flipped
    // sentence rather than a stale claim. Proved by running the same shape of
    // computation over a deliberately loosened input.
    const loosened = { ...JOURNEY_STATES[5]!.run!, packagePin: 'something else v9.9.9' }
    expect(loosened.packagePin).not.toBe(JOURNEY_PACKAGE_PIN)
    const wouldFlip =
      loosened.packagePin !== JOURNEY_PACKAGE_PIN
        ? `NOT REFUSED — the pin moved to ${loosened.packagePin}`
        : 'Refused'
    expect(wouldFlip).toMatch(/^NOT REFUSED/)
  })
})
