/**
 * Task 15 — the tour runner.
 *
 * INVARIANT THIS FILE KEEPS: `state.stepIndex` is the index of the step
 * most recently started — by the time any caller observes `status:
 * 'paused' | 'done' | 'failed'`, that step has finished running (its
 * action performed, its `expectRoute`/`expectVisible` checked). This is
 * what makes `next()` unambiguous: it always means "run
 * `stepIndex + 1`."
 *
 * A STEP NEVER SKIPS. Pass criterion 3: an action that fails, an
 * `expectRoute` that does not match, or an `expectVisible` control that is
 * absent all set `status: 'failed'` and record `{ stepId, reason }` on
 * `state.error` — the loop stops there, on that exact step, rather than
 * moving on and reporting success over a broken product.
 *
 * `generation` is the one piece of internal state that makes `pause()`,
 * `takeOver()`, `exit()`, `restart()` and a fresh `start()` all able to
 * stop an in-flight autoplay loop without a cancellation token threaded
 * through every `await`: each call that should stop the CURRENT loop
 * increments it, and the loop's own `while` condition (and every
 * post-`await` check) compares against the generation it captured when it
 * began — a stale loop simply stops mutating state once it notices it has
 * been superseded, rather than fighting the new one for control of
 * `state`. The DEFECT CLASS THIS BUILD KEEPS PRODUCING (an effect keyed on
 * a value that churns, or frozen when it should not) does not apply here
 * because this is not a React effect at all — it is one hand-rolled
 * cancellation counter, read at exactly the points a truly async loop
 * needs it and nowhere else.
 *
 * `replayPending` — fix round 1 / Important 2. `back()` moves `stepIndex`
 * backward without running anything (a real product mutation cannot be
 * "undone" by a second, parallel mechanism — see `back()`'s own comment).
 * The NEXT `next()`/`resume()` call must therefore run `stepIndex` itself
 * — the step the caller just rewound to — rather than `stepIndex + 1`,
 * which would silently skip straight past it and re-run the step the
 * caller was already on. `replayPending` is that one-shot instruction: set
 * by `back()`, consumed (and cleared) by the very next `next()`/`resume()`,
 * and cleared on `start()`/`restart()`/`exit()` so it never bleeds from one
 * tour run into another.
 */
import { closeOpenReviewerPanels, performAction, resolveControl } from './actions'
import type { PlaybackSpeed, TourDefinition, TourHost, TourRunner, TourRunnerState, TourStep } from './types'

const STEP_GAP_MS = 650

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Runs one step's action, then its `expectRoute`/`expectVisible` checks. Never throws — every failure becomes a typed outcome. */
async function runStep(
  step: TourStep,
  host: TourHost,
  speed: PlaybackSpeed,
): Promise<{ readonly ok: true } | { readonly ok: false; readonly reason: string }> {
  const acted = await performAction(step.action, host, speed)
  if (!acted.ok) return acted

  if (step.expectRoute !== undefined) {
    const actual = window.location.pathname
    if (actual !== step.expectRoute) {
      return { ok: false, reason: `expected route "${step.expectRoute}", found "${actual}" after the action.` }
    }
  }
  if (step.expectVisible !== undefined) {
    if (!resolveControl(step.expectVisible)) {
      return { ok: false, reason: `expectVisible control "${step.expectVisible}" is not present after the action.` }
    }
  }
  return { ok: true }
}

export function createTourRunner(tours: readonly TourDefinition[], host: TourHost): TourRunner {
  let state: TourRunnerState = { tourId: null, stepIndex: 0, status: 'idle', error: null }
  let speed: PlaybackSpeed = 1
  let generation = 0
  let replayPending = false
  const listeners = new Set<() => void>()

  function setState(patch: Partial<TourRunnerState>): void {
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }

  function findTour(id: string): TourDefinition | undefined {
    return tours.find((t) => t.id === id)
  }

  function currentTour(): TourDefinition | null {
    return state.tourId === null ? null : (findTour(state.tourId) ?? null)
  }

  /** Runs `tour.steps[index]` onward, autoplaying with a real-time gap between steps, until done, failed, or superseded. */
  async function autoplay(tour: TourDefinition, index: number, myGeneration: number): Promise<void> {
    let i = index
    while (myGeneration === generation) {
      if (i >= tour.steps.length) {
        setState({ status: 'done' })
        return
      }
      const step = tour.steps[i]!
      setState({ stepIndex: i })
      const result = await runStep(step, host, speed)
      if (myGeneration !== generation) return // pause()/takeOver()/exit()/a new start() won already
      if (!result.ok) {
        setState({ status: 'failed', error: { stepId: step.id, reason: result.reason } })
        return
      }
      i += 1
      await sleep(STEP_GAP_MS / speed)
    }
  }

  return {
    start(id) {
      generation += 1
      replayPending = false
      const tour = findTour(id)
      if (!tour) {
        setState({ tourId: id, stepIndex: 0, status: 'failed', error: { stepId: '(none)', reason: `Unknown tour id "${id}".` } })
        return
      }
      const myGeneration = generation
      setState({ tourId: id, stepIndex: 0, status: 'playing', error: null })
      void autoplay(tour, 0, myGeneration)
    },

    pause() {
      if (state.status !== 'playing') return
      generation += 1 // stops the in-flight autoplay loop at its next check
      setState({ status: 'paused' })
    },

    resume() {
      if (state.status !== 'paused') return
      const tour = currentTour()
      if (!tour) return
      generation += 1
      const myGeneration = generation
      // See `replayPending`'s header comment: a `back()` immediately before
      // this `resume()` must re-run the step it rewound to, not skip past it.
      const target = replayPending ? state.stepIndex : state.stepIndex + 1
      replayPending = false
      setState({ status: 'playing' })
      void autoplay(tour, target, myGeneration)
    },

    next() {
      const tour = currentTour()
      if (!tour || state.status === 'done') return
      generation += 1
      const myGeneration = generation
      // See `replayPending`'s header comment.
      const target = replayPending ? state.stepIndex : state.stepIndex + 1
      replayPending = false
      setState({ status: 'paused' })
      void (async () => {
        if (target >= tour.steps.length) {
          if (myGeneration === generation) setState({ status: 'done' })
          return
        }
        const step = tour.steps[target]!
        const result = await runStep(step, host, speed)
        if (myGeneration !== generation) return
        if (!result.ok) {
          setState({ stepIndex: target, status: 'failed', error: { stepId: step.id, reason: result.reason } })
          return
        }
        setState({ stepIndex: target, status: 'paused' })
      })()
    },

    /**
     * Rewinds the TOUR'S OWN POINTER — spotlight and narration — one step.
     * It never re-runs or undoes a step's action itself: a real product
     * mutation (a submitted capture, a role switch, a clock advance) is
     * exactly that, real, and "undo" would mean either faking a second
     * action the product never offered or genuinely reversing state through
     * a THIRD mechanism — both are the parallel implementation §10.6
     * forbids. `back()` therefore narrates backward without touching
     * application state at all — but it DOES set `replayPending`, so the
     * very next `next()`/`resume()` call re-runs the step it just rewound
     * to (`state.stepIndex`) for real, on whatever state the product is
     * actually in now, rather than the step `back()` moved away from.
     */
    back() {
      if (state.stepIndex <= 0) return
      generation += 1
      replayPending = true
      setState({ stepIndex: state.stepIndex - 1, status: 'paused', error: null })
    },

    /**
     * Fix round 1 / Important 3. Replaying a tour's steps from a leftover
     * mid-tour DOM state is not replaying the tour — it is running a
     * different one (see `closeOpenReviewerPanels`'s header comment for the
     * concrete failure this produces). Before autoplaying from step 0 again,
     * `restart()` closes any reviewer-chrome panel a PRIOR run in this same
     * session left open, so the replay's first toggle click opens it fresh
     * exactly as it would on a truly new page load — the condition replay
     * determinism was actually proved under.
     *
     * What this does NOT reset, and why that is still honest replay:
     *   - Demo persona / connectivity / failure-injection / checkpoint —
     *     each is set by the tour's OWN steps via an absolute-value
     *     `select`/`switchRole` action, which lands on the same value
     *     regardless of what it was before. No separate reset is needed for
     *     state a tour's own steps already re-establish every run.
     *   - The simulated clock — only ever moved forward by two real
     *     buttons a reviewer has, toward an absolute target stamp; a second
     *     run reaching an already-reached stamp computes a zero delta and
     *     succeeds trivially, the same self-correcting property.
     *   - Real repository writes a step already performed (e.g.
     *     `run-sample-write`'s `repository.update()`). Reversing those
     *     would require a second, reverse write path — precisely the
     *     parallel-implementation shortcut §10.6 forbids `back()` from
     *     taking, for the same reason it must not exist here either. A
     *     tour that writes is not restart-idempotent against the
     *     repository, and this file does not pretend otherwise.
     */
    restart() {
      if (state.tourId === null) return
      const tour = currentTour()
      if (!tour) return
      generation += 1
      const myGeneration = generation
      replayPending = false
      setState({ stepIndex: 0, status: 'playing', error: null })
      void (async () => {
        await closeOpenReviewerPanels(speed)
        if (myGeneration !== generation) return
        await autoplay(tour, 0, myGeneration)
      })()
    },

    setSpeed(x) {
      speed = x
    },

    takeOver() {
      generation += 1 // stops any in-flight autoplay loop; nothing else in the app is touched
      if (state.status === 'playing' || state.status === 'idle') setState({ status: 'paused' })
    },

    exit() {
      generation += 1
      replayPending = false
      setState({ tourId: null, stepIndex: 0, status: 'idle', error: null })
    },

    get state() {
      return state
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
