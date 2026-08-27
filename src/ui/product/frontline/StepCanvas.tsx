'use client'

import type { ReactNode } from 'react'
import { bg, borderColor, controlMinClass, radiusClass, textColor } from '../tokens'

/**
 * Task 13 — one step of the Run Player, shown one at a time. §20.2: no
 * precision pointing, no drag, no hover — moving between steps is exactly
 * two full-width, ≥44px tap targets (`Back`/`Next`), never a swipe gesture
 * and never a small "‹ ›" pager. `children` is the slot for the step's own
 * capture controls (`CaptureControl`); this component owns only the step
 * frame — number, title, instructions, navigation — never the capture
 * itself.
 *
 * NO PACE TIMER (§15.2). There is deliberately no elapsed-time, no
 * "step N of M, Xs remaining" and no per-step clock anywhere in this file —
 * the run's shallow chrome (`RunPlayerShell`) is about the run and the
 * step, never about how fast the worker standing here is going.
 */
export interface StepCanvasProps {
  /** A stable registry id (ruling R4), e.g. the step's own id. */
  readonly controlId: string
  readonly stepNumber: number
  readonly totalSteps: number
  readonly title: string
  readonly instructions?: string | undefined
  readonly onPrev?: (() => void) | undefined
  readonly onNext?: (() => void) | undefined
  readonly nextLabel?: string | undefined
  readonly nextDisabled?: boolean | undefined
  readonly children?: ReactNode | undefined
}

export function StepCanvas({
  controlId,
  stepNumber,
  totalSteps,
  title,
  instructions,
  onPrev,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  children,
}: StepCanvasProps) {
  return (
    <section aria-label={`Step ${stepNumber} of ${totalSteps}`} className="flex h-full flex-col gap-4">
      <p className={`text-xs font-semibold uppercase tracking-wide ${textColor('ink-subtle')}`}>
        {`Step ${stepNumber} of ${totalSteps}`}
      </p>
      <h2 className={`text-xl font-semibold ${textColor('ink')}`}>{title}</h2>
      {instructions !== undefined ? (
        <p className={`text-base ${textColor('ink-muted')}`}>{instructions}</p>
      ) : null}
      {children !== undefined ? <div className="flex-1">{children}</div> : null}
      <div className={`mt-auto flex gap-3 border-t ${borderColor('border')} pt-4`}>
        <button
          type="button"
          data-control-id={`${controlId}-prev`}
          onClick={onPrev}
          disabled={onPrev === undefined}
          className={`flex-1 ${controlMinClass('spacious')} ${radiusClass('md')} border ${borderColor('border-strong')} font-semibold ${textColor('ink')} disabled:opacity-40`}
        >
          Back
        </button>
        <button
          type="button"
          data-control-id={`${controlId}-next`}
          onClick={onNext}
          disabled={nextDisabled || onNext === undefined}
          className={`flex-1 ${controlMinClass('spacious')} ${radiusClass('md')} font-semibold ${bg('accent')} ${textColor('accent-ink')} disabled:opacity-40`}
        >
          {nextLabel}
        </button>
      </div>
    </section>
  )
}
