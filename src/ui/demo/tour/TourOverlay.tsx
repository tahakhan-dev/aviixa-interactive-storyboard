'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOverlayFocus } from '@/ui/primitives/useOverlayFocus'
import { resolveControl } from '@/tours/actions'
import type { TourDefinition } from '@/tours/types'
import { useTourRunnerApi, useTourRunnerState } from '../DemoChrome'
import { Spotlight } from './Spotlight'
import { NarrationCaption } from './NarrationCaption'
import { TourControls } from './TourControls'

/**
 * Pass criterion 3's own target: the control the CURRENT (or, walking
 * backward, the most recent) step actually named — its `spotlight` first,
 * falling back to `expectVisible` (also a controlId, per `@/tours/types`) —
 * so Take over almost never lands on nothing even on a step that carries
 * neither (e.g. a bare `navigate`).
 */
function lastTouchedElement(tour: TourDefinition, stepIndex: number): HTMLElement | null {
  for (let i = stepIndex; i >= 0; i -= 1) {
    const step = tour.steps[i]
    if (!step) continue
    const id = step.spotlight ?? step.expectVisible
    if (!id) continue
    const el = resolveControl(id)
    if (el) return el
  }
  return null
}

/**
 * Task 16 — the overlay itself: spotlight + caption + controls, one demo
 * node, visible exactly while a tour is active and not taken over.
 *
 * PASS CRITERION 3 — the property this file is most responsible for.
 * `useOverlayFocus` (reused, not re-forked — brief's own instruction) gives
 * this overlay its Tab-trap and its DEFAULT close behaviour: restore focus
 * to whatever was focused before the overlay opened (the `WatchButton`, most
 * of the time). That default is exactly right for Exit/Escape, and exactly
 * WRONG for Take over, which must leave focus on the element the TOUR last
 * touched, not on the button that started it. The fix is ordering, not a
 * fork of the hook: `open` flips to `false` the instant Take over is
 * clicked (via `takenOver`), which makes React tear down
 * `useOverlayFocus`'s effect — its cleanup fires first, in React's normal
 * cleanups-before-setups commit order, and calls
 * `previouslyFocused.current?.focus()`. The SEPARATE effect below, declared
 * after it and keyed on `takenOver`, is a NEW effect on this same commit —
 * its setup runs after every cleanup has already run — so it focuses the
 * tour's own last-touched element LAST, correctly overriding the hook's
 * restore rather than racing it.
 */
export function TourOverlay() {
  const { runner, tours } = useTourRunnerApi()
  const state = useTourRunnerState()
  const [takenOver, setTakenOver] = useState(false)
  const takeOverTargetRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const tour: TourDefinition | null = state?.tourId ? (tours.find((t) => t.id === state.tourId) ?? null) : null
  const step = tour && state ? (tour.steps[state.stepIndex] ?? null) : null

  // A fresh session (start() or restart(), both of which land on stepIndex 0
  // with status 'playing') always clears any PRIOR take-over — the only way
  // back into a taken-over tour is a new WatchButton click, and that click
  // must reopen the overlay. `takeOver()` itself never re-enters this
  // condition (it moves status away from 'playing'), so there is no race
  // between this reset and a fresh Take over click on the same render.
  useEffect(() => {
    if (state?.status === 'playing' && state.stepIndex === 0) setTakenOver(false)
  }, [state?.status, state?.stepIndex])

  const open = state !== null && state.tourId !== null && !takenOver

  const handleExit = useCallback(() => {
    runner?.exit()
  }, [runner])

  useOverlayFocus(open, handleExit, containerRef)

  // See this file's header comment: runs after useOverlayFocus's own
  // close-cleanup in the same commit, so its `.focus()` call is the one
  // that actually sticks.
  useEffect(() => {
    if (takenOver) takeOverTargetRef.current?.focus()
  }, [takenOver])

  if (!open || !runner || !state || !tour || !step) return null

  function handleTakeOver() {
    takeOverTargetRef.current = lastTouchedElement(tour!, state!.stepIndex)
    runner?.takeOver()
    setTakenOver(true)
  }

  return (
    <div data-demo="tour-overlay" ref={containerRef}>
      <Spotlight controlId={step.spotlight ?? null} />
      <div
        data-demo="tour-panel"
        className="fixed inset-x-0 bottom-16 z-[999] mx-auto flex max-w-xl flex-col gap-2 rounded-lg border-2 border-dashed border-[#f5d90a] bg-[#1b1030] p-3 font-mono shadow-[0_-4px_24px_rgba(0,0,0,0.55)]"
      >
        <NarrationCaption tour={tour} step={step} state={state} />
        <TourControls runner={runner} state={state} onTakeOver={handleTakeOver} />
      </div>
    </div>
  )
}
