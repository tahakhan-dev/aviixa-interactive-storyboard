'use client'

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import Link from 'next/link'
import type { WriteResult } from '@/data/repository'
import { ErrorSummary, type ErrorSummaryEntry } from './ErrorSummary'
import { bg, borderColor, radiusClass, statusText, textColor } from './tokens'

export interface WizardStep {
  readonly id: string
  readonly title: string
  readonly content: ReactNode
  readonly validate: () => string[]
}

/**
 * DEVIATION FROM THE BRIEF, same reasoning as `Form.tsx`'s: `onComplete`
 * accepts a synchronous `WriteResult<unknown>` OR a `Promise` of one, so a
 * real repository write (`create`/`update`/`transition`, all
 * `Promise`-returning per `src/data/repository.ts`'s own header) can be
 * passed here directly.
 */
export interface WizardProps {
  readonly steps: readonly WizardStep[]
  readonly onComplete: () => WriteResult<unknown> | Promise<WriteResult<unknown>>
  readonly cancelHref: string
}

/**
 * EVERY STEP'S `content` STAYS MOUNTED, ONLY THE CURRENT ONE IS VISIBLE
 * (`hidden`, not a conditional render). That single choice is what makes
 * "Back preserving values" (brief property 4) true for free: nothing in
 * this component owns field state, so nothing here can lose it — nothing
 * ever unmounts to lose it from in the first place.
 *
 * DIRTY DETECTION is the same trick in miniature: rather than requiring
 * every step's `content` to report back through some bespoke callback prop,
 * a single `onChange`/`onInput` listener on the wrapper around all the
 * steps catches the native, always-bubbling DOM events every text input,
 * select, checkbox, radio and textarea already fires. One listener, no
 * coupling to what any given step happens to render.
 */
export function Wizard({ steps, onComplete, cancelHref }: WizardProps) {
  const [index, setIndex] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [attemptSeq, setAttemptSeq] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<WriteResult<unknown> | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const step = steps[index]
  if (step === undefined) throw new Error('Wizard: steps must be non-empty.')
  const isLast = index === steps.length - 1
  const liveErrors = step.validate()

  // FIX ROUND 1 (Critical finding): keyed on `step.id` — a stable string —
  // never on the `step` object itself or `index`+`step` together.
  // `step = steps[index]` is a FRESH object reference on every render
  // whenever the caller builds `steps` inline (this component's own
  // docblock recommends exactly that pattern for a step's local state), so
  // keying on the object churned on every keystroke in ANY field on the
  // step: a re-render rebuilds `steps`, which changes `step`'s reference,
  // which re-fired this effect and stole focus back to the summary after
  // every character typed. `step.id` only changes on an ACTUAL step change.
  // No re-check of `step.validate()` inside the body — `attemptSeq`
  // incrementing already IS the "a blocked Next just happened" signal (see
  // `handleNext`); re-deriving validity here would just read a closure that
  // goes stale between renders for no benefit.
  //
  // FIX ROUND 2 (the sweep miss): `attemptSeq > 0`, not `attempted` (a
  // boolean). `setAttempted(true)` while already `true` was a no-op — same
  // value in, React bails the re-render, so a SECOND consecutive blocked
  // Next never re-fired this effect. Same defect shape as `Form.tsx`'s
  // `submitAttempted` -> `submitAttempt` fix (Important #3, fix round 1),
  // one layer up: that one was a dependency that stopped distinguishing two
  // different events; this one was a piece of state that could not change
  // again once it had changed once. A counter that increments on every
  // blocked Next is guaranteed to differ every time.
  useEffect(() => {
    if (attemptSeq > 0) summaryRef.current?.focus()
  }, [attemptSeq, step.id])

  useEffect(() => {
    if (result !== null) resultRef.current?.focus()
  }, [result])

  // Warn on a real browser navigation/close/reload while dirty — the part
  // of "warns on navigating away dirty" no in-app confirm can cover.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent): void => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const handleNext = (): void => {
    if (liveErrors.length > 0) {
      setAttemptSeq((n) => n + 1)
      return
    }
    if (isLast) {
      void handleComplete()
      return
    }
    setIndex((i) => i + 1)
  }

  const handleBack = (): void => {
    setIndex((i) => Math.max(0, i - 1))
  }

  const handleComplete = async (): Promise<void> => {
    setSubmitting(true)
    const outcome = await Promise.resolve(onComplete())
    setSubmitting(false)
    setResult(outcome)
    if (outcome.ok) setDirty(false)
  }

  const handleCancelClick = (e: MouseEvent<HTMLAnchorElement>): void => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) {
      e.preventDefault()
    }
  }

  const summaryEntries: ErrorSummaryEntry[] = liveErrors.map((message) => ({ message }))

  return (
    <div
      className="flex flex-col gap-4"
      onChangeCapture={() => setDirty(true)}
      onInputCapture={() => setDirty(true)}
    >
      <nav aria-label="Progress" className={`text-sm ${textColor('ink-muted')}`}>
        Step {index + 1} of {steps.length}: <span className={`font-medium ${textColor('ink')}`}>{step.title}</span>
      </nav>

      {attemptSeq > 0 && summaryEntries.length > 0 ? (
        <ErrorSummary ref={summaryRef} title="Fix these before continuing" entries={summaryEntries} />
      ) : null}

      {result !== null && !result.ok ? (
        <div
          ref={resultRef}
          role="alert"
          tabIndex={-1}
          data-control-id="wizard-result-failure"
          className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('surface')} p-4 focus:outline-none`}
        >
          <p className={`font-semibold ${textColor('ink')}`}>
            {result.kind === 'denied' ? 'This action is not permitted' : 'This could not be saved'}
          </p>
          <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>{result.explain}</p>
        </div>
      ) : null}

      {result !== null && result.ok ? (
        <div
          ref={resultRef}
          role="status"
          tabIndex={-1}
          data-control-id="wizard-result-success"
          className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('surface')} p-4 focus:outline-none`}
        >
          <p className={`font-semibold ${statusText('ok')}`}>Saved.</p>
        </div>
      ) : null}

      <div>
        {steps.map((s) => (
          <div key={s.id} hidden={s.id !== step.id}>
            {s.content}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={cancelHref}
          data-control-id="wizard-cancel"
          onClick={handleCancelClick}
          className={`text-sm underline ${textColor('ink-muted')}`}
        >
          Cancel
        </Link>
        <button
          type="button"
          data-control-id="wizard-back"
          onClick={handleBack}
          disabled={index === 0}
          className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-3 py-1.5 text-sm ${textColor('ink')} disabled:opacity-50`}
        >
          Back
        </button>
        <button
          type="button"
          data-control-id="wizard-next"
          onClick={handleNext}
          // `aria-disabled`, not the native attribute (Button.tsx's own
          // convention): a blocked Next stays focusable and clickable, so
          // clicking it while blocked is what surfaces the summary rather
          // than silently doing nothing.
          aria-disabled={liveErrors.length > 0 || submitting ? 'true' : undefined}
          disabled={submitting}
          className={`${radiusClass('md')} ${bg('accent')} px-4 py-1.5 text-sm font-medium ${textColor('accent-ink')} ${liveErrors.length > 0 ? 'opacity-50' : ''} disabled:opacity-50`}
        >
          {submitting ? 'Saving…' : isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  )
}
