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
 *
 * `playFromStart` — fix round 2 / Important 2. Both `start()` and
 * `restart()` begin a tour the identical way: close any reviewer-chrome
 * panel a PRIOR run in this same session left open (see
 * `closeOpenReviewerPanels`, `@/tours/actions`), THEN autoplay from step 0.
 * Fix round 1 put this only on `restart()`, at the one entry point the bug
 * was reported through; fix round 2 moved it to the one place both entry
 * points share, because `exit()` a tour, then `start()` a DIFFERENT one,
 * reproduces the identical stale-panel failure `restart()` alone did not
 * cover.
 */
import { closeOpenReviewerPanels, performAction, pollFor, resolveControl } from './actions'
import type { PlaybackSpeed, TourDefinition, TourHost, TourRunner, TourRunnerState, TourStep } from './types'

const STEP_GAP_MS = 650

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fix round 1 (unit-01, Task 10 review, IMPORTANT 3) — `expectRoute`/
 * `expectVisible` used to be asserted exactly once, immediately after
 * `performAction`'s own fixed `settle()` sleep. That sleep is scaled by
 * `speed` (`120 / speed`), but the real async work a check waits on is
 * NOT presentation delay and does not shrink with it: `SignInScreen.tsx`'s
 * own 350ms `setTimeout` before it calls `signIn()`, a genuine
 * `repository`/IndexedDB commit, a route push and the chunk it loads. At
 * 2x speed the old single check ran at 120/2 = 60ms after the action —
 * nowhere near enough — a real product could fail a tour that would have
 * passed at 1x, which is exactly the false-negative class this whole file
 * exists to keep OUT of a release-blocking signal. `next()`'s own
 * single-step path had no gap at all, so a fast manual click-through
 * raced identically.
 *
 * Fixed in the engine, not by padding individual tours: both checks now
 * POLL via `pollFor` (`./actions` — fix round 2 moved it there, see that
 * file's own comment on why: `performAssertState` needed the identical
 * poll and lives in `actions.ts`, one level below this file, so the
 * shared helper has to live where both can reach it without a cycle) —
 * check immediately, then retry every `CHECK_POLL_INTERVAL_MS` up to
 * `CHECK_MAX_ATTEMPTS` times — rather than sleep-then-assert-once.
 */

/** Runs one step's action, then its `expectRoute`/`expectVisible` checks. Never throws — every failure becomes a typed outcome. */
async function runStep(
  step: TourStep,
  host: TourHost,
  speed: PlaybackSpeed,
): Promise<{ readonly ok: true } | { readonly ok: false; readonly reason: string }> {
  const acted = await performAction(step.action, host, speed)
  if (!acted.ok) return acted

  if (step.expectRoute !== undefined) {
    const expectRoute = step.expectRoute
    const met = await pollFor(() => window.location.pathname === expectRoute)
    if (!met) {
      return { ok: false, reason: `expected route "${expectRoute}", found "${window.location.pathname}" after the action.` }
    }
  }
  if (step.expectVisible !== undefined) {
    const expectVisible = step.expectVisible
    const met = await pollFor(() => resolveControl(expectVisible) !== null)
    if (!met) {
      return { ok: false, reason: `expectVisible control "${expectVisible}" is not present after the action.` }
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

  /**
   * Fix round 2 / Important 2 (class, not just the reported reproduction).
   * ANY tour beginning from step 0 — a fresh `start()` just as much as a
   * `restart()` — must replay onto the same clean panel baseline a truly
   * new page load would have. The reviewer reproduced the identical
   * "toggle closes instead of opens" failure through `exit()` a tour that
   * left a panel open, then `start()` a DIFFERENT one — a path `restart()`
   * alone never touched. `start()` and `restart()` now share this one
   * function rather than each re-deriving "how do I begin a tour cleanly."
   */
  async function playFromStart(tour: TourDefinition, myGeneration: number): Promise<void> {
    await closeOpenReviewerPanels(speed)
    if (myGeneration !== generation) return
    await autoplay(tour, 0, myGeneration)
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
      void playFromStart(tour, myGeneration)
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
     * Fix round 1 / Important 3, extended by fix round 2 / Important 2.
     * Replaying a tour's steps from a leftover mid-tour DOM state is not
     * replaying the tour — it is running a different one (see
     * `closeOpenReviewerPanels`'s header comment for the concrete failure
     * this produces). `restart()` shares `playFromStart` with `start()` (see
     * this file's header comment) so both begin from the same clean panel
     * baseline a truly new page load would have.
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
     *
     * NAMED DEBT, MEASURED, WITH AN OWNER (fix round 2 / Important 4): the
     * above is not "happens not to matter" — it is a real, confirmed
     * divergence. Measured live: run `TOUR-ORIENTATION-001` (writes via
     * `run-sample-write`) to completion, hash `repository.exportJson()`;
     * `restart()` it in the same session; hash again. The hashes genuinely
     * differ — the restart's `run-sample-write` opens a SECOND notification
     * (the first unopened one it finds, which is now a different row than
     * run 1 opened), an extra write with no corresponding fresh-start
     * equivalent. Today's three seed tours never exercise this in a way
     * that fails a pass criterion (no assertion checks total notification
     * count), which is why it was not caught as a regression — but it is
     * real domain-state drift, not a coincidence of luck.
     * This runner cannot close it: `TourHost` (`@/tours/types`) has no hook
     * into `@/scenario/lineage#branchFrom` or `@/scenario/controls`'
     * `startClean` — the scenario engine's own actual "begin a clean run"
     * primitives — so `restart()` has no way to ask the domain layer for a
     * fresh branch, only to click real DOM controls. Owner: the task that
     * wires `TourHost` to the scenario engine (gives it a `startClean`- or
     * `branchFrom`-shaped capability), not this one.
     */
    restart() {
      if (state.tourId === null) return
      const tour = currentTour()
      if (!tour) return
      generation += 1
      const myGeneration = generation
      replayPending = false
      setState({ stepIndex: 0, status: 'playing', error: null })
      void playFromStart(tour, myGeneration)
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
