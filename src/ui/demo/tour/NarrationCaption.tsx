'use client'

import { LiveRegion } from '@/ui/primitives/LiveRegion'
import type { TourDefinition, TourRunnerState, TourStep } from '@/tours/types'

/**
 * Task 16, pass criterion 2 (the announcement half): "the caption is
 * announced through a polite live region on each step change." Reuses
 * `@/ui/primitives/LiveRegion` verbatim rather than a second hand-rolled
 * `aria-live` div — the exact primitive this codebase already ships for
 * this job (Dialog/Drawer's own status announcements use it). The
 * announcement itself needs no extra JS: an `aria-live="polite"` region
 * re-announces whenever the TEXT it contains actually changes, and the
 * narration string genuinely changes on every `stepIndex` change (React
 * re-renders this component every time `useTourRunnerState()` — the
 * caller — sees a new `TourRunnerState`).
 */
export interface NarrationCaptionProps {
  readonly tour: TourDefinition
  readonly step: TourStep
  readonly state: TourRunnerState
}

const STATUS_LABEL: Record<TourRunnerState['status'], string> = {
  idle: 'Idle',
  playing: 'Playing',
  paused: 'Paused',
  failed: 'Stopped',
  done: 'Complete',
}

export function NarrationCaption({ tour, step, state }: NarrationCaptionProps) {
  return (
    <LiveRegion politeness="polite">
      <div data-demo="tour-caption">
        <div className="text-[10px] font-bold uppercase tracking-wide text-[#c9b3ff]">
          {tour.title} — step {state.stepIndex + 1} of {tour.steps.length} — {STATUS_LABEL[state.status]}
        </div>
        <p className="text-sm text-[#f0e6ff]">{step.narration}</p>
        {state.status === 'failed' && state.error ? (
          <p className="text-xs text-[#ff8ba7]">
            Stopped at step &quot;{state.error.stepId}&quot;: {state.error.reason}
          </p>
        ) : null}
      </div>
    </LiveRegion>
  )
}
