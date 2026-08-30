'use client'

import { useEffect, useState } from 'react'
import { LiveRegion } from '@/ui/primitives/LiveRegion'
import type { TourDefinition, TourRunnerState, TourStep } from '@/tours/types'

/**
 * Task 16, pass criterion 2 (the announcement half): "the caption is
 * announced through a polite live region on each step change." Reuses
 * `@/ui/primitives/LiveRegion` verbatim rather than a second hand-rolled
 * `aria-live` div — the exact primitive this codebase already ships for
 * this job (Dialog/Drawer's own status announcements use it).
 *
 * Fix round 1, Minor 2. An `aria-live` region's actual contract is about
 * MUTATIONS after it exists in the document — some assistive tech does not
 * announce content that is already present at the moment the region itself
 * is inserted. Every step change AFTER the first genuinely mutates this
 * node's text (confirmed correct in the fix round 0 review) because the
 * region already exists by then; the one case that did not was the very
 * first paint of a FRESH tour start, where the whole overlay — this
 * component included — mounts with the first step's narration already in
 * its initial render. `ready` starts `false` on every fresh mount (this
 * component is unmounted and remounted with the rest of the overlay between
 * runs — see `TourOverlay`'s own `open` gate) and flips to `true` one tick
 * later, so the region is genuinely inserted EMPTY first and then mutated —
 * the same "post-insertion mutation" shape every later step change already
 * had, now including the first one. Not verified against a live screen
 * reader in this environment (no such tool available here); this is the
 * documented-safe pattern for the ambiguity, not a claim of confirmed
 * announcement.
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
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])

  return (
    <LiveRegion politeness="polite">
      <div data-demo="tour-caption">
        {ready ? (
          <>
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#c9b3ff]">
              {tour.title} — step {state.stepIndex + 1} of {tour.steps.length} — {STATUS_LABEL[state.status]}
            </div>
            <p className="text-sm text-[#f0e6ff]">{step.narration}</p>
            {state.status === 'failed' && state.error ? (
              <p className="text-xs text-[#ff8ba7]">
                Stopped at step &quot;{state.error.stepId}&quot;: {state.error.reason}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </LiveRegion>
  )
}
