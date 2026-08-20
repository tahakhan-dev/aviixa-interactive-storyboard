import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRequire } from 'node:module'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentType } from 'react'
import { SEQUENCE_STATES } from '@/studio/journey/fixture'
import { JOURNEY_STEPS, JOURNEY_SURFACES } from '@/studio/journey/effects'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import {
  JOURNEY_COMPOSITION,
  JOURNEY_STATES,
  REFUSAL_DEMONSTRATIONS,
} from '../../app/studio/journey/composition'
import { JourneyScreen } from '../../app/studio/journey/JourneyScreen'
import { BuilderScreen } from '../../app/studio/builder/BuilderScreen'

/**
 * Task 23 — the Workflow Builder journey, end to end.
 *
 * WHAT THIS FILE IS BUILT NOT TO DO. The brief supplied a step-1 test built
 * on `expect(el).not.toHaveTextContent(/^\s*$/)`. Two defects were proved
 * against real input before any of it was trusted, and both are recorded in
 * the report rather than quietly fixed:
 *
 *  1. `toHaveTextContent` is a `@testing-library/jest-dom` matcher, and this
 *     project does not install `@testing-library/jest-dom` at all. The
 *     assertion would have thrown `is not a function` on the first step, so
 *     it could not have passed OR failed for the reason it names.
 *  2. It renders all twenty-two steps inside ONE `it()`. `cleanup` runs in
 *     `afterEach`, not between renders, so `getByTestId('effect-DOH')` sees
 *     two matching elements on the second iteration and throws. The loop
 *     never reaches step 3.
 *
 * What replaces it asserts the thing the brief was reaching for — no surface
 * row is blank — and adds the assertion that actually has teeth: the row
 * carries the STEP'S OWN sentence, not merely some text.
 */

// ---------------------------------------------------------------------------
// axe, in jsdom.
//
// `axe-core` is a transitive dependency of `@axe-core/playwright` (a declared
// devDependency) and pnpm does not hoist it to the top level, so it cannot be
// imported by bare specifier from here. Adding it to `package.json` was not an
// option -- `package.json` is outside this task's path list -- so it is
// resolved through the package that already depends on it. That is
// version-agnostic: it follows whatever `@axe-core/playwright` resolves.
// ---------------------------------------------------------------------------
const axeRequire = createRequire(createRequire(import.meta.url).resolve('@axe-core/playwright'))

interface AxeResult {
  readonly id: string
  readonly help: string
  readonly nodes: readonly { readonly target: readonly unknown[] }[]
}
interface AxeRun {
  readonly violations: readonly AxeResult[]
  readonly incomplete: readonly AxeResult[]
  readonly passes: readonly AxeResult[]
  readonly inapplicable: readonly AxeResult[]
}
const axe = axeRequire('axe-core') as {
  run(context: Element, options?: unknown): Promise<AxeRun>
}

/**
 * `color-contrast` is allowed in the incomplete bucket for the same stated
 * reason `tests/accessibility/axe.spec.ts` allows it: axe declines to compute
 * a ratio it cannot measure. In jsdom it can never measure one -- there is no
 * layout and no canvas -- so the rule lands in `incomplete` on every element
 * that has any text. The ratios are measured numerically instead, by
 * `tests/unit/token-contrast.test.ts`. Nothing else may sit in that bucket.
 */
const ALLOWED_INCOMPLETE = new Set(['color-contrast'])

const JOURNEY_DIR = join(process.cwd(), 'app', 'studio', 'journey')

const STEP_NUMBERS = JOURNEY_STEPS.map((s) => s.number)

function ids(results: readonly AxeResult[]): readonly string[] {
  return [...new Set(results.map((r) => r.id))].sort()
}

/**
 * A control, as a structure rather than as a name: anything a person can
 * operate. The duplicate gate below compares these across two renders, so it
 * must not key on a hand-written list of labels -- that is the shape task 21
 * shipped, where both tests derived from the same field the code read.
 */
function controlNames(root: HTMLElement): readonly string[] {
  const nodes = root.querySelectorAll(
    'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="checkbox"]',
  )
  return [...nodes]
    .map((el) => (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter((name) => name !== '')
}

function renderStep(step: number): HTMLElement {
  const { container } = render(<JourneyScreen initialStep={step} />)
  return container
}

// ---------------------------------------------------------------------------

describe('the twenty-two journey steps', () => {
  it('renders five surface effects on every one of the 22 steps, none blank', () => {
    expect(JOURNEY_STEPS).toHaveLength(22)
    expect(STEP_NUMBERS).toEqual([...Array(22)].map((_, i) => i + 1))

    for (const step of JOURNEY_STEPS) {
      renderStep(step.number)
      for (const surface of JOURNEY_SURFACES) {
        const row = screen.getByTestId(`effect-${surface.code}`)
        const text = (row.textContent ?? '').trim()
        expect(text, `step ${step.number} / ${surface.code} is blank`).not.toBe('')

        // The teeth. A blank check passes on any text at all; this pins the
        // row to THIS step's own sentence for THIS surface, so a panel wired
        // to the wrong step, or to a constant, goes red.
        const effect = step.effects[surface.code]
        const sentence =
          effect.kind === 'affected' ? effect.statement : effect.reason
        expect(text, `step ${step.number} / ${surface.code}`).toContain(sentence)
      }
      cleanup()
    }
  })

  it('composes the real module route for every step, and no route for the seam step', () => {
    expect(JOURNEY_COMPOSITION).toHaveLength(22)

    for (const step of JOURNEY_STEPS) {
      const composed = JOURNEY_COMPOSITION[step.number - 1]!
      expect(composed.step).toBe(step.number)

      // The composition's module id is cross-checked against the STEP's own
      // `ownerModule` sentence -- a different field, written by a different
      // task -- so the map cannot silently drift from the journey it walks.
      expect(step.ownerModule, `step ${step.number}`).toContain(composed.moduleId)

      if (composed.kind === 'seam') continue

      // THE HOLE THIS CLOSES, FOUND BY PLANTING RATHER THAN BY READING. The
      // h1 comparison below renders `composed.Screen` on BOTH sides, so
      // pointing step 3 at the Workflow Library instead of the Builder moved
      // both sides together and the gate stayed green -- the shape this build
      // has shipped four times. The independent source is the FILESYSTEM: the
      // host module's own route file must be the file that renders this
      // component. Swap the component and the route file no longer names it.
      const host = stuModuleById(STU_MODULES, composed.hostModuleId)
      const routeSource = readFileSync(
        join(process.cwd(), 'app', 'studio', String(host.slug), 'page.tsx'),
        'utf8',
      )
      expect(
        routeSource,
        `step ${step.number} composes a component ${composed.hostModuleId}'s route does not render`,
      ).toContain(composed.Screen.name)

      // The real route screen, rendered standalone, and then the journey.
      // The h1 is the module registry's own name, printed by `StudioShell`;
      // asserting the journey shows THAT string proves composition rather
      // than a re-drawn panel that happens to carry the same words.
      const Screen = composed.Screen as ComponentType
      render(<Screen />)
      const standaloneHeading = screen.getByRole('heading', { level: 1 }).textContent
      cleanup()
      expect(standaloneHeading).toBeTruthy()

      renderStep(step.number)
      const journeyHeading = screen.getByRole('heading', { level: 1 }).textContent
      expect(journeyHeading, `step ${step.number}`).toBe(standaloneHeading)
      cleanup()
    }
  })

  it('imports no module internals — every step goes through the route', () => {
    const files = readdirSync(JOURNEY_DIR).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const source = readFileSync(join(JOURNEY_DIR, file), 'utf8')
      const imports = [...source.matchAll(/^import[\s\S]*?from\s+'([^']+)'/gm)].map((m) => m[1]!)
      const internals = imports.filter((spec) => spec.includes('/studio/modules/stu-'))
      expect(internals, `${file} reaches into a module's internals`).toEqual([])
    }
  })

  it('re-implements no control — nothing the composed route offers is offered twice', () => {
    for (const step of JOURNEY_STEPS) {
      const composed = JOURNEY_COMPOSITION[step.number - 1]!
      if (composed.kind === 'seam') continue

      const Screen = composed.Screen as ComponentType
      const { container: standalone } = render(<Screen />)
      const routeControls = new Set(controlNames(standalone))
      cleanup()

      renderStep(step.number)
      const chrome = screen.getByTestId('journey-chrome')
      const duplicated = controlNames(chrome).filter((name) => routeControls.has(name))
      expect(duplicated, `step ${step.number} re-offers the route's own controls`).toEqual([])
      cleanup()
    }
  })

  it('advances the four sequence states in the order the source hands them on', () => {
    // 23 states: index 0 is before step 1, index n is after step n.
    expect(JOURNEY_STATES).toHaveLength(23)

    const seen: string[] = []
    for (const state of JOURNEY_STATES) {
      if (seen[seen.length - 1] !== state.sequenceState) seen.push(state.sequenceState)
    }
    expect(seen).toEqual([...SEQUENCE_STATES])

    // And the screen says so, per step, rather than only the fold.
    renderStep(12)
    const banner = screen.getByTestId('sequence-state')
    expect(banner.textContent).toContain('STATE-STU-PREPARED')
    expect(banner.textContent).toContain('STATE-WF-DRAFT-SUBMITTED')
  })
})

describe('step 19 — the pin is a Delivery Operations Hub act', () => {
  it('renders a cross-surface statement, not a control, and fires no build', () => {
    const composed = JOURNEY_COMPOSITION[18]!
    expect(composed.step).toBe(19)
    expect(composed.kind).toBe('seam')
    expect(composed.moduleId).toBe('MOD-DOH-06')

    renderStep(19)

    const notice = screen.getByRole('note')
    expect(notice.textContent).toContain('MOD-DOH-06')
    expect(notice.textContent).toContain('slice 6')
    // The seam's own contract sentence, from the registry, states the rule.
    expect(notice.textContent).toContain('it never fires a build')

    // "X must not exist" scans for the STRUCTURE, not the name. Step 19
    // composes no module route at all, so EVERY control on the page belongs
    // to the journey chrome, and none of them may perform the act. The gate
    // is therefore: outside the journey's own step navigation there is no
    // operable control on this step whatsoever.
    const page = screen.getByTestId('journey-page')
    const nav = screen.getByRole('navigation', { name: 'Journey steps' })
    const operable = [...page.querySelectorAll('button, input, select, textarea, [role="button"]')]
      .filter((el) => !nav.contains(el))
    expect(
      operable.map((el) => el.textContent),
      'step 19 offers an operable control for an act another surface owns',
    ).toEqual([])

    // And the run is assigned-not-ready: a pin is not a delivery.
    expect(screen.getByTestId('composed-route').textContent).toContain('assigned-not-ready')
  })
})

describe('the four refusals', () => {
  // Pinned against the FROZEN SOURCE's own sentences, at the locators
  // re-verified against sha256 47bd18db...a8d0b27 for this task. They are NOT
  // read out of `JOURNEY_REFUSALS`, because a test that derives its
  // expectation from the field the code prints agrees with the code even when
  // both are wrong.
  const SOURCE = [
    {
      step: 21,
      locator: 'L53706',
      sentence:
        'Deleting or hiding a published version is refused; prior versions are retained in full.',
    },
    {
      step: 14,
      locator: 'L53567',
      sentence: 'A revision cannot skip the Reviewer stage even where the change is trivial',
    },
    {
      step: 13,
      locator: 'L53535',
      sentence:
        'Rejection without comments is refused, because the comment is the instruction to the Author',
    },
    { step: 17, locator: 'L53602', sentence: 'A publication cannot re-base an in-flight run' },
  ] as const

  it('reaches all four, each on its own step, each naming its reason', () => {
    expect(REFUSAL_DEMONSTRATIONS.map((r) => r.atStep).sort((a, b) => a - b)).toEqual([
      13, 14, 17, 21,
    ])

    for (const { step, locator, sentence } of SOURCE) {
      renderStep(step)
      const panel = screen.getByTestId(`refusal-${step}`)
      const text = (panel.textContent ?? '').replace(/\s+/g, ' ')
      expect(text, `step ${step} does not name its reason`).toContain(sentence)
      expect(text, `step ${step} does not cite its locator`).toContain(locator)
      cleanup()
    }
  })

  it('demonstrates each refusal against the real fold, never as a printed claim', () => {
    for (const demo of REFUSAL_DEMONSTRATIONS) {
      // Every demonstration must have been REFUSED. If a precondition is
      // loosened the outcome flips to "NOT REFUSED" and this goes red -- that
      // is the difference between demonstrating a refusal and printing one.
      expect(demo.outcome, `step ${demo.atStep}`).toMatch(/^Refused —/)
      expect(demo.attempted.length, `step ${demo.atStep}`).toBeGreaterThan(0)

      renderStep(demo.atStep)
      const panel = screen.getByTestId(`refusal-${demo.atStep}`)
      expect(panel.textContent).toContain(demo.attempted)
      expect(panel.textContent).toContain(demo.outcome)
      cleanup()
    }
  })

  it('rollback is forward: nothing is deleted, and the chain cannot be skipped', () => {
    const before = JOURNEY_STATES[20]! // after step 20 — v2.2.0 published
    const after = JOURNEY_STATES[21]! // after step 21 — the rollback

    expect(after.versions.length).toBeGreaterThan(before.versions.length)
    const withdrawn = after.versions.find((v) => v.number === 'v2.2.0')
    expect(withdrawn, 'v2.2.0 was removed rather than retained').toBeDefined()
    expect(withdrawn!.status).toBe('Superseded')
    // The correction came out as a NEW, HIGHER number, not an edit in place.
    expect(after.versions.some((v) => v.number === 'v2.3.0' && v.status === 'Published')).toBe(true)
  })

  it('publication does not re-base an in-flight run, and publish never reads the run register', () => {
    const pinnedAtPublish = JOURNEY_STATES[19]!.hubPin // after step 19
    const afterSupersede = JOURNEY_STATES[20]!.hubPin // after v2.2.0 published
    const afterRollback = JOURNEY_STATES[21]!.hubPin // after v2.3.0 published

    expect(pinnedAtPublish?.version).toBe('v2.1.0')
    expect(afterSupersede?.version).toBe('v2.1.0')
    expect(afterRollback?.version).toBe('v2.1.0')
    expect(afterSupersede?.deviceReadiness).toBe('assigned-not-ready')

    // THE STRUCTURAL HALF IS NOT RE-GATED HERE, DELIBERATELY. `MOD-STU-12`'s
    // publish holds no reference to the run register at all, and
    // `tests/unit/stu-versions.test.ts` (the `register.runs` before/after
    // comparison around L786-L806) is the gate that pins it. Adding a second
    // scan here would be a duplicate gate over a module this task does not
    // own, and the demonstration above needs no such reference: it reads the
    // PIN, which publication never writes.
  })
})

describe('FB-SEQ-012 — the one-person quality team', () => {
  it('is reachable from the journey and reaches its terminal safe state', async () => {
    const user = userEvent.setup()
    renderStep(12)

    await user.click(screen.getByRole('button', { name: /one-person quality team/i }))

    const branch = screen.getByTestId('fb-seq-012')
    const text = (branch.textContent ?? '').replace(/\s+/g, ' ')

    // The source's own answer, quoted: L68291.
    expect(text).toContain('work does not get published faster, it does not get published at all')
    // The terminal safe state, as STATE rather than as prose: the submission
    // is still submitted, stalled, and nothing downstream exists.
    expect(text).toContain('stays submitted')
    expect(screen.getByTestId('fb-seq-012-versions').textContent).toBe('0')
    expect(screen.getByTestId('fb-seq-012-packages').textContent).toBe('0')
    expect(screen.getByTestId('fb-seq-012-pin').textContent).toBe('none')
  })
})

describe('accessibility — axe on every journey step', () => {
  it('finds no violation on any of the 22 steps', async () => {
    const found: Record<number, readonly string[]> = {}
    for (const step of JOURNEY_STEPS) {
      const container = renderStep(step.number)
      const result = await axe.run(container)
      const violations = ids(result.violations)
      if (violations.length > 0) found[step.number] = violations
      cleanup()
    }
    expect(found).toEqual({})
  }, 300_000)

  /**
   * THE DECLARED FINDING IS GONE, AND THIS IS WHERE ITS EXCEPTION WAS.
   *
   * Five journey steps compose `MOD-STU-04`'s route, and that route carried a
   * pre-existing `aria-prohibited-attr`: `app/studio/builder/BuilderScreen.tsx`
   * put `aria-label="Storyboard failure switches"` on a bare `<div>`, which
   * has no role that supports an accessible name, so the label named nothing.
   * This map pinned it as PRESENT on steps 3, 4, 5, 8 and 9 with the fix
   * written down — `<section>` instead of `<div>`, the shape `StudioShell`
   * already uses for its own "Storyboard view switchers" block — because
   * `app/studio/builder/**` was outside that task's path list.
   *
   * Slice 5 task 24 made the fix, AT BOTH SITES: the same defect was also on
   * `app/studio/content-libraries/ContentLibrariesScreen.tsx`'s "Storyboard
   * failure switch" block, which no journey step composes and which the
   * journey walk therefore could not see. Fix once, where all callers route.
   *
   * The exception is DELETED rather than emptied, exactly as its own comment
   * required: "this map is compared for EQUALITY, so the gate goes red in
   * both directions… When `BuilderScreen` is fixed this test fails and the
   * exception must be deleted, which is the only kind of exception that
   * cannot rot." It did, and it is.
   */
  const DECLARED_INCOMPLETE: Readonly<Record<number, readonly string[]>> = {}

  it('leaves nothing but colour contrast and one declared, located finding undecided', async () => {
    const found: Record<number, readonly string[]> = {}
    for (const step of JOURNEY_STEPS) {
      const container = renderStep(step.number)
      const result = await axe.run(container)
      const undecided = ids(result.incomplete).filter((id) => !ALLOWED_INCOMPLETE.has(id))
      if (undecided.length > 0) found[step.number] = undecided
      cleanup()
    }
    expect(found).toEqual(DECLARED_INCOMPLETE)
  }, 300_000)

  it('the composed route carries no undecided finding of its own either', async () => {
    // The other half of the fix, proved on the route ALONE with the journey
    // nowhere in the tree — so a clean walk above cannot be the journey
    // hiding a finding the route still has.
    const { container } = render(<BuilderScreen />)
    const result = await axe.run(container)
    const undecided = result.incomplete.filter((r) => !ALLOWED_INCOMPLETE.has(r.id))
    expect(undecided.map((r) => r.id)).toEqual([])
    // And the block that carried the label is still there, still labelled —
    // the fix changed the element, never removed the disclosure.
    expect(container.querySelector('section[aria-label="Storyboard failure switches"]')).not.toBeNull()
  }, 120_000)

  it('the axe run is not vacuous — it really scanned these trees', async () => {
    // A suite that reports "no violations" because axe scanned an empty node
    // is the shape slice 4 shipped. This plants a real violation into the
    // rendered journey and requires axe to find it.
    const container = renderStep(1)
    const planted = container.ownerDocument.createElement('img')
    planted.setAttribute('src', 'planted.png')
    container.append(planted)
    const result = await axe.run(container)
    expect(ids(result.violations)).toContain('image-alt')
    expect(result.passes.length).toBeGreaterThan(0)
  }, 120_000)
})

describe('the composition is drawn from the registries, not from a second hand-written list', () => {
  it('every composed route points at a module the Studio registry knows, and at its own slug', () => {
    for (const composed of JOURNEY_COMPOSITION) {
      if (composed.kind === 'seam') continue
      const host = stuModuleById(STU_MODULES, composed.hostModuleId)
      expect(host.slug).not.toBeNull()
      expect(composed.href).toBe(`/studio/${host.slug}/`)

      // Where the ACT's module is not the HOST's, the registry's own stated
      // reason is carried -- never invented here. MOD-STU-09 has no route of
      // its own and says why (`noRouteReason`); the journey prints that.
      if (composed.moduleId !== composed.hostModuleId) {
        const acting = stuModuleById(STU_MODULES, composed.moduleId)
        expect(acting.slug).toBeNull()
        expect(composed.hostNote).toBe(acting.noRouteReason)
      } else {
        expect(composed.hostNote).toBeNull()
      }
    }
  })

  it('renders the hosted module’s stated reason on the step that needs it', () => {
    renderStep(7)
    const chrome = screen.getByTestId('journey-chrome')
    expect(chrome.textContent).toContain('MOD-STU-09')
    expect(chrome.textContent).toContain('No route of its own')
  })
})
