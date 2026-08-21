import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRequire } from 'node:module'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentType } from 'react'
import { JOURNEY_SURFACES } from '@/ui/shared/journey'
import { JOURNEY_STEPS } from '../../app/hub/journey/effects'
import {
  JOURNEY_COMPOSITION,
  SETTLEMENT_CHECKS,
  REFUSAL_DEMONSTRATIONS,
} from '../../app/hub/journey/composition'
import { JourneyScreen } from '../../app/hub/journey/JourneyScreen'
import { RunSchedulingScreen } from '../../app/hub/run-scheduling-and-execution-oversight/RunSchedulingScreen'

/**
 * Task 13 — the operational journey, rendered.
 *
 * `tests/unit/doh-journey.test.ts` proves the fold, the quotations and the
 * refusals against three independent sources. This file proves the things only
 * a render can show: that each step really composes the module route it claims,
 * that the journey adds no control the route already offers, that the step
 * whose act belongs to another surface offers NOTHING, and that every one of
 * the eighteen states this page can be driven into passes axe.
 */

// ---------------------------------------------------------------------------
// axe, in jsdom. `axe-core` is a transitive dependency of `@axe-core/playwright`
// (a declared devDependency) and pnpm does not hoist it, so it is resolved
// through the package that already depends on it — the same indirection
// `tests/component/stu-journey.test.tsx` uses, and version-agnostic for the
// same reason. `package.json` is outside this task's path list.
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
 * `color-contrast` is allowed in the incomplete bucket for the reason
 * `tests/accessibility/axe-policy.ts` states: axe declines to compute a ratio it
 * cannot measure, and in jsdom it can never measure one. The ratios are checked
 * numerically by `tests/unit/token-contrast.test.ts`. Nothing else may sit
 * there — an undecided rule is not a passing rule.
 */
const ALLOWED_INCOMPLETE = new Set(['color-contrast'])

const JOURNEY_DIR = join(process.cwd(), 'app', 'hub', 'journey')

function ids(results: readonly AxeResult[]): readonly string[] {
  return [...new Set(results.map((r) => r.id))].sort()
}

/**
 * A control as a STRUCTURE rather than as a name: anything a person can
 * operate. The duplicate gate below compares these across two renders, so it
 * must not key on a hand-written list of labels.
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

const STEP_NUMBERS = JOURNEY_STEPS.map((s) => s.number)

// ---------------------------------------------------------------------------

describe('the nine journey steps', () => {
  it('renders five surface effects on every step, none blank, each the step’s own sentence', () => {
    expect(JOURNEY_STEPS).toHaveLength(9)
    expect(STEP_NUMBERS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])

    for (const step of JOURNEY_STEPS) {
      renderStep(step.number)
      for (const surface of JOURNEY_SURFACES) {
        const row = screen.getByTestId(`effect-${surface.code}`)
        const text = (row.textContent ?? '').trim()
        expect(text, `step ${step.number} / ${surface.code} is blank`).not.toBe('')

        // The teeth. A blank check passes on any text at all; this pins the row
        // to THIS step's own sentence for THIS surface, so a panel wired to the
        // wrong step, or to a constant, goes red. Whether the sentence is the
        // SOURCE'S is a different question, asked of the frozen source itself
        // in `tests/unit/doh-journey.test.ts`.
        const effect = step.effects[surface.code]
        const sentence = effect.kind === 'affected' ? effect.statement : effect.reason
        // BOTH HALVES, AND THE FIRST ONE WAS FOUND BY PLANTING. `toContain('')`
        // is true of every string, so blanking the record and then comparing
        // the row against that record passes — the expectation was derived from
        // the field under test, which is exactly the trap a journey suite falls
        // into. The row's own text is non-empty whatever the record says,
        // because the surface name and the locator are rendered beside it.
        expect(sentence.trim(), `step ${step.number} / ${surface.code} has no sentence`).not.toBe('')
        expect(text, `step ${step.number} / ${surface.code}`).toContain(sentence)
      }
      cleanup()
    }
  })

  it('composes the real module route on every step but the one that crosses a surface', () => {
    for (const step of JOURNEY_STEPS) {
      const composed = JOURNEY_COMPOSITION[step.number - 1]!
      expect(composed.step).toBe(step.number)
      if (composed.kind === 'cross-surface') continue

      // The route screen rendered STANDALONE, then the journey. The h1 is the
      // module's or the screen's own name, printed by `HubShell`; asserting the
      // journey shows THAT string proves composition rather than a re-drawn
      // panel carrying the same words. Which component belongs to which route
      // is settled by the route's own `page.tsx` — checked in the unit suite,
      // because both sides of this comparison render the same component.
      const Screen = composed.Screen as ComponentType
      render(<Screen />)
      const standaloneHeading = screen.getByRole('heading', { level: 1 }).textContent
      cleanup()
      expect(standaloneHeading).toBeTruthy()

      renderStep(step.number)
      const headings = screen.getAllByRole('heading', { level: 1 })
      expect(headings, `step ${step.number} does not expose exactly one h1`).toHaveLength(1)
      expect(headings[0]!.textContent, `step ${step.number}`).toBe(standaloneHeading)
      cleanup()
    }
  })

  it('exposes exactly one main landmark and one h1 on every step, the seam step included', () => {
    for (const step of JOURNEY_STEPS) {
      const container = renderStep(step.number)
      expect(container.querySelectorAll('main'), `step ${step.number}`).toHaveLength(1)
      expect(screen.getAllByRole('heading', { level: 1 }), `step ${step.number}`).toHaveLength(1)
      // The journey's own chrome is a complementary landmark with an h2, so it
      // never competes with the composed route's main.
      expect(screen.getByTestId('journey-chrome').tagName).toBe('ASIDE')
      cleanup()
    }
  })

  it('re-implements no control — nothing the composed route offers is offered twice', () => {
    for (const step of JOURNEY_STEPS) {
      const composed = JOURNEY_COMPOSITION[step.number - 1]!
      if (composed.kind === 'cross-surface') continue

      const Screen = composed.Screen as ComponentType
      const { container: standalone } = render(<Screen />)
      const routeControls = new Set(controlNames(standalone))
      cleanup()

      renderStep(step.number)
      const chrome = screen.getByTestId('journey-chrome')
      const duplicated = controlNames(chrome).filter((name) => routeControls.has(name))
      expect(duplicated, `step ${step.number} re-offers the route’s own controls`).toEqual([])
      cleanup()
    }
  })

  it('reaches into no module’s write path — every step goes through the route component', () => {
    const files = readdirSync(JOURNEY_DIR).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    expect(files.length).toBeGreaterThan(3)

    for (const file of files) {
      const source = readFileSync(join(JOURNEY_DIR, file), 'utf8')
      const imports = [...source.matchAll(/^import[\s\S]*?from\s+'([^']+)'/gm)].map((m) => m[1]!)

      // A sibling ROUTE may be imported, and only for its screen component:
      // `../<slug>/<Screen>`. Anything else under `app/hub/` — a module's
      // `fixtures`, a helper, a second data file — would be the journey growing
      // a second copy of that module's data.
      const siblings = imports.filter((spec) => spec.startsWith('../'))
      const offenders = siblings.filter((spec) => !/^\.\.\/[a-z0-9-]+\/[A-Z][A-Za-z]*Screen$/.test(spec))
      expect(offenders, `${file} imports a sibling route’s internals`).toEqual([])
    }
  })
})

describe('step 6 — the act belongs to the Frontline Worker Application', () => {
  it('renders a cross-surface statement, and offers no control at all', () => {
    const composed = JOURNEY_COMPOSITION[5]!
    expect(composed.step).toBe(6)
    expect(composed.kind).toBe('cross-surface')

    renderStep(6)

    const notice = screen.getByTestId('cross-surface-statement')
    expect(notice.getAttribute('data-boundary')).toBe('step-execution-and-capture')
    expect(notice.getAttribute('data-registered')).toBe('true')
    expect(notice.textContent).toContain('Frontline Worker Application')
    expect(notice.textContent).toContain('L25726')

    // It is a PLACE, not a schedule: no seam notice anywhere on this step, and
    // none of the words a seam notice uses.
    expect(screen.queryByTestId('seam-is-a-schedule')).toBeNull()
    const page = screen.getByTestId('journey-page')
    expect(page.textContent).not.toContain('Cross-slice seam')
    expect(page.textContent).not.toContain('not built here')

    // "X must not exist" scans for the STRUCTURE, not the name. Step 6 composes
    // no module route, so EVERY control on the page belongs to the journey's own
    // chrome. Outside the step navigation and the open-decision disclosure —
    // neither of which performs the act — there is nothing operable.
    const nav = screen.getByRole('navigation', { name: 'Journey steps' })
    const disclosure = screen.getByRole('button', { name: /what this journey does not settle/i })
    const operable = [
      ...page.querySelectorAll('button, input, select, textarea, [role="button"]'),
    ].filter((el) => !nav.contains(el) && el !== disclosure)
    expect(
      operable.map((el) => el.textContent),
      'step 6 offers an operable control for an act another surface owns',
    ).toEqual([])

    // And a disabled control is refused too — the boundary does not move, so a
    // disabled control would imply a condition that could become true.
    expect(page.querySelectorAll('[disabled]')).toHaveLength(0)
  })

  it('shows the run as assigned-not-ready before the download, because a pin is not a delivery', () => {
    renderStep(5)
    expect(screen.getByTestId('journey-chrome').textContent).toContain('assigned-not-ready')
    cleanup()
    // At step 6 the device holds it and the run could start.
    renderStep(6)
    expect(screen.getByTestId('package-readiness').textContent).toContain('held')
  })
})

describe('step 5 — the pin, which is a Hub act', () => {
  it('renders MOD-DOH-06’s OWN pin panel on the composed route, and draws no second one', async () => {
    const user = userEvent.setup()
    renderStep(5)

    // WF-AUT-010's panel lives in the run DETAIL, which catalogue B mounts as a
    // sub-view of the board rather than a route of its own — so it is reached
    // by the board's own "Open detail" control. The journey drives that control
    // rather than re-drawing the panel: composing a route means using it.
    const route = screen.getByTestId('composed-route')
    expect(screen.queryByTestId('pin-panel'), 'the pin panel is drawn before a run is opened').toBeNull()
    await user.click(screen.getAllByRole('button', { name: 'Open detail' })[0]!)

    const panels = screen.getAllByTestId('pin-panel')
    expect(panels, 'the pin panel is drawn twice').toHaveLength(1)
    expect(route.contains(panels[0]!), 'the pin panel is not the composed route’s').toBe(true)
    expect(panels[0]!.textContent).toContain('WF-AUT-010')
    expect(panels[0]!.textContent).toContain('immutable for the life of the run')

    // The journey's own chrome STATES that the act is the Hub's and cites the
    // workflow — and carries no control of its own over the pin.
    const chrome = screen.getByTestId('journey-chrome')
    expect(chrome.textContent, 'the chrome does not cite the workflow').toContain('WF-AUT-010')
    expect(screen.getByTestId('step-note').textContent).toContain(
      'The pin is a Delivery Operations Hub act',
    )
    expect(screen.getByTestId('step-note').textContent).toContain('never fires a build')
    expect(chrome.querySelectorAll('[data-testid="pin-panel"]')).toHaveLength(0)
    // Outside the step navigation — whose labels legitimately name the step —
    // no control in the chrome mentions the pin at all.
    const nav = screen.getByRole('navigation', { name: 'Journey steps' })
    const chromeControls = [...chrome.querySelectorAll('button')]
      .filter((b) => !nav.contains(b))
      .map((b) => b.textContent ?? '')
    expect(chromeControls.filter((t) => /pin|rebase|package/i.test(t))).toEqual([])
  })
})

describe('the journey never names a state three modules left disputed', () => {
  it('prints `disputed` and all three readings where the source’s Parts disagree', async () => {
    for (const step of [6, 7, 8]) {
      renderStep(step)
      const readings = screen.getByTestId(`run-state-readings-${step}`)
      const text = (readings.textContent ?? '').replace(/\s+/g, ' ')
      expect(text).toContain('Reading A')
      expect(text).toContain('Reading B')
      expect(text).toContain('Reading C')
      expect(text).toContain('L5244')
      expect(text).toContain('L5245')
      expect(text).toContain('L5246')
      expect(text).toContain('None is this build')
      cleanup()
    }

    renderStep(7)
    const position = screen.getByTestId('run-position')
    expect(position.textContent).toContain('disputed — three readings, no winner')
    // And the position line never asserts either disputed word as THE answer.
    expect(position.textContent).not.toMatch(/after:\s*(submitted|complete)\b/)
  })

  it('discloses all three open decisions as OPEN, from a computed verdict', async () => {
    const user = userEvent.setup()
    renderStep(1)
    await user.click(screen.getByRole('button', { name: /show what this journey does not settle/i }))

    const panel = screen.getByTestId('settlement-checks')
    for (const check of SETTLEMENT_CHECKS) {
      const row = screen.getByTestId(`settlement-${check.id}`)
      expect(row.textContent, `${check.id}`).toMatch(/^OPEN — /)
    }
    expect(panel.textContent).toContain('DEC-RUNSTATE-001')
    expect(panel.textContent).toContain('DEC-STUCK-001')
    expect(panel.textContent).toContain('DEC-FINISH-001')
  })
})

describe('the four refusals reach the screen', () => {
  // Pinned against the FROZEN SOURCE's own sentences in
  // `tests/unit/doh-journey.test.ts`. Here the question is only whether the
  // demonstration reaches the reader.
  it('renders what was attempted and what happened, on the step it belongs to', () => {
    for (const demo of REFUSAL_DEMONSTRATIONS) {
      renderStep(demo.atStep)
      const panel = screen.getByTestId(`refusal-${demo.atStep}`)
      const text = (panel.textContent ?? '').replace(/\s+/g, ' ')
      expect(text, `step ${demo.atStep} does not say what was attempted`).toContain(demo.attempted)
      expect(text, `step ${demo.atStep} does not say what happened`).toContain(demo.outcome)
      expect(text, `step ${demo.atStep} cites nothing`).toMatch(/L\d{3,6}/)
      cleanup()
    }
  })

  it('shows the blank closure note as a VALIDATION failure, not a policy refusal', () => {
    renderStep(8)
    const line = screen.getByTestId('closure-note-validation')
    expect(line.textContent).toContain('A closure note is required.')
    expect(line.textContent).toContain('before any permission question is asked')
  })
})

describe('accessibility — axe over every state this page can be driven into', () => {
  /**
   * ONE DECLARED, LOCATED FINDING, IN A FILE THIS TASK MAY NOT EDIT.
   *
   * `app/hub/run-scheduling-and-execution-oversight/RunSchedulingScreen.tsx`
   * gives both run-board tables a sixth column for the "open the run detail"
   * link and heads it with an empty string — `{ key: 'open', header: '' }` at
   * its lines 337 and 365. `Table` renders that as a `<th>` with no discernible
   * text, which axe rules `empty-table-header`. Steps 3, 5 and 9 compose that
   * route, so the finding travels with it and is NOT the journey's own markup.
   *
   * THE FIX, WRITTEN DOWN RATHER THAN LEFT AS "SOMEBODY SHOULD": give the
   * column a real header — `header: 'Open'` — or a visually hidden one. It is
   * one line in each of the two tables, in `MOD-DOH-06`'s route file, which is
   * outside this task's path list, so it is reported to the controller instead.
   *
   * IT IS INVISIBLE TO THE PLAYWRIGHT HARNESS, AND THAT IS THE SECOND HALF OF
   * THE FINDING. `tests/accessibility/axe-policy.ts` filters every scan with
   * `.withTags(WCAG_TAGS)`, and axe tags `empty-table-header` `best-practice`
   * only — so neither `axe.spec.ts` nor `axe-states.spec.ts` can ever see it.
   * The scans below are deliberately UNFILTERED, which is why they can.
   *
   * COMPARED FOR EQUALITY, SO IT GOES RED IN BOTH DIRECTIONS. When the two
   * headers are filled in, this test fails and the declaration must be DELETED
   * — the only kind of exception that cannot rot.
   */
  /**
   * EMPTY, AND THAT IS THE DECLARATION DOING WHAT IT SAID IT WOULD.
   *
   * It held `empty-table-header` on steps 3, 5 and 9 and instructed, in so many
   * words, that filling the two headers in must turn this test red and the
   * declaration must then be DELETED. The headers were filled in -- `header:
   * 'Action'` in both run-board tables, matching that file's own convention two
   * hundred lines lower -- this test went red, and the entries are gone.
   *
   * The record is kept empty rather than removed, because the SECOND half of
   * the finding is still live: the Playwright harness filters every scan with
   * `.withTags(WCAG_TAGS)`, and axe tags `empty-table-header` `best-practice`
   * only, so neither route suite could ever have seen it. The scans below are
   * deliberately UNFILTERED, which is why they did. An exception compared for
   * equality goes red in both directions and cannot rot; a `toContain` would
   * have stayed green through the fix and told nobody.
   */
  const DECLARED_VIOLATIONS: Readonly<Record<number, readonly string[]>> = {}

  it('finds no violation on any of the nine steps but the declared, located one', async () => {
    const found: Record<number, readonly string[]> = {}
    for (const step of JOURNEY_STEPS) {
      const container = renderStep(step.number)
      const result = await axe.run(container)
      const violations = ids(result.violations)
      if (violations.length > 0) found[step.number] = violations
      cleanup()
    }
    expect(found).toEqual(DECLARED_VIOLATIONS)
  }, 300_000)

  it('the journey’s OWN chrome carries no violation on any step', async () => {
    // The half that is this task's to answer. Scanning the chrome alone
    // separates the journey's markup from the route it composes, so the
    // declaration above cannot hide a defect this file introduced.
    const found: Record<number, readonly string[]> = {}
    for (const step of JOURNEY_STEPS) {
      renderStep(step.number)
      const result = await axe.run(screen.getByTestId('journey-chrome'))
      const violations = ids(result.violations)
      const undecided = ids(result.incomplete).filter((id) => !ALLOWED_INCOMPLETE.has(id))
      if (violations.length + undecided.length > 0) found[step.number] = [...violations, ...undecided]
      cleanup()
    }
    expect(found).toEqual({})
  }, 300_000)

  /**
   * DECLARED AND EMPTY, AND COMPARED FOR EQUALITY IN BOTH DIRECTIONS. An
   * exception added here has to be deleted the day the finding is fixed,
   * because a stale entry fails just as loudly as a new finding.
   */
  const DECLARED_INCOMPLETE: Readonly<Record<string, readonly string[]>> = {}

  it('leaves nothing but colour contrast undecided, in the default and driven states alike', async () => {
    const user = userEvent.setup()
    const found: Record<string, readonly string[]> = {}
    for (const step of JOURNEY_STEPS) {
      const container = renderStep(step.number)

      const atDefault = ids((await axe.run(container)).incomplete).filter(
        (id) => !ALLOWED_INCOMPLETE.has(id),
      )
      if (atDefault.length > 0) found[`step ${step.number}`] = atDefault

      // The one state this page can be driven into that is its OWN: the open
      // decisions disclosure. The composed route's persona and simulation
      // controls belong to that module and are driven by that module's suite.
      await user.click(
        screen.getByRole('button', { name: /what this journey does not settle/i }),
      )
      const driven = ids((await axe.run(container)).incomplete).filter(
        (id) => !ALLOWED_INCOMPLETE.has(id),
      )
      if (driven.length > 0) found[`step ${step.number} [decisions open]`] = driven

      cleanup()
    }
    expect(found).toEqual(DECLARED_INCOMPLETE)
  }, 300_000)

  it('finds no violation with the open-decision disclosure driven open either', async () => {
    const user = userEvent.setup()
    const found: Record<number, readonly string[]> = {}
    for (const step of JOURNEY_STEPS) {
      const container = renderStep(step.number)
      await user.click(
        screen.getByRole('button', { name: /what this journey does not settle/i }),
      )
      const violations = ids((await axe.run(container)).violations)
      if (violations.length > 0) found[step.number] = violations
      cleanup()
    }
    expect(found).toEqual(DECLARED_VIOLATIONS)
  }, 300_000)

  it('every horizontally scrollable region the journey owns is focusable, named and rolled', () => {
    // A horizontally scrollable region with no focusable content inside is a
    // SERIOUS violation and has shipped once in this slice already. axe cannot
    // see it in jsdom — there is no layout — so it is asked structurally, of
    // the journey's own chrome, which is the only markup this task owns.
    for (const step of JOURNEY_STEPS) {
      renderStep(step.number)
      const chrome = screen.getByTestId('journey-chrome')
      const scrollers = [...chrome.querySelectorAll('[class*="overflow-x"]')]
      for (const el of scrollers) {
        expect(el.getAttribute('tabindex'), `step ${step.number}`).toBe('0')
        expect(el.getAttribute('role'), `step ${step.number}`).not.toBeNull()
        expect(el.getAttribute('aria-label'), `step ${step.number}`).not.toBeNull()
      }
      cleanup()
    }
  })

  it('the axe run is not vacuous — it really scanned these trees', async () => {
    // A suite reporting "no violations" because axe scanned an empty node is a
    // shape this build has shipped. This plants a real violation into the
    // rendered journey and requires axe to find it.
    const container = renderStep(1)
    const planted = container.ownerDocument.createElement('img')
    planted.setAttribute('src', 'planted.png')
    container.append(planted)
    const result = await axe.run(container)
    expect(ids(result.violations)).toContain('image-alt')
    expect(result.passes.length).toBeGreaterThan(0)
  }, 120_000)

  it('the composed route carries no undecided finding of its own either', async () => {
    // The other half: proved on the route ALONE, with the journey nowhere in the
    // tree — so a clean walk above cannot be the journey hiding a finding the
    // route still has. `MOD-DOH-06`'s board is the route three steps compose.
    const { container } = render(<RunSchedulingScreen />)
    const result = await axe.run(container)
    // This asserted `['empty-table-header']` -- the finding proved to be the
    // ROUTE's, present with the journey nowhere in the tree. The route is fixed,
    // so the same assertion now proves the absence from the same position, and
    // still fails if the route reacquires any finding of its own.
    expect(ids(result.violations)).toEqual([])
    expect(ids(result.incomplete).filter((id) => !ALLOWED_INCOMPLETE.has(id))).toEqual([])
    // This counted the TWO empty headers on the run-board tables, to prove the
    // finding was theirs and not something the journey drew. Both are labelled
    // now, so the same count proves the fix at its source: zero headerless
    // columns on this route.
    //
    // Kept rather than deleted with the declaration above. It is the only
    // assertion here that names the DEFECT rather than axe's verdict on it, so
    // it stays red if the headers are emptied again even under a policy that
    // has stopped reporting the rule.
    const emptyHeaders = [...container.querySelectorAll('th')].filter(
      (th) => (th.textContent ?? '').trim() === '',
    )
    expect(emptyHeaders.length).toBe(0)
  }, 120_000)
})
