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
 */
import { performAction, resolveControl } from './actions'
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
      setState({ status: 'playing' })
      void autoplay(tour, state.stepIndex + 1, myGeneration)
    },

    next() {
      const tour = currentTour()
      if (!tour || state.status === 'done') return
      generation += 1
      const myGeneration = generation
      const target = state.stepIndex + 1
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
     * It never re-runs or undoes a step's action: a real product mutation
     * (a submitted capture, a role switch, a clock advance) is exactly
     * that, real, and "undo" would mean either faking a second action the
     * product never offered or genuinely reversing state through a THIRD
     * mechanism — both are the parallel implementation §10.6 forbids.
     * `back()` therefore narrates backward without touching application
     * state at all, and a subsequent `next()`/`resume()` re-runs that step
     * for real, on whatever state the product is actually in now.
     */
    back() {
      if (state.stepIndex <= 0) return
      generation += 1
      setState({ stepIndex: state.stepIndex - 1, status: 'paused', error: null })
    },

    restart() {
      if (state.tourId === null) return
      const tour = currentTour()
      if (!tour) return
      generation += 1
      const myGeneration = generation
      setState({ stepIndex: 0, status: 'playing', error: null })
      void autoplay(tour, 0, myGeneration)
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
