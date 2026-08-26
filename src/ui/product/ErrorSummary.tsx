'use client'

import { forwardRef } from 'react'
import { bg, borderColor, radiusClass, textColor } from './tokens'

/**
 * Task 11. One entry per failed rule. `fieldId`, when present, makes the
 * entry a link that moves focus to the offending control (`Form.tsx`'s use);
 * omitted, the entry renders as plain text (`Wizard.tsx`'s use, whose
 * `WizardStep.validate` returns bare strings with no field to point at).
 */
export interface ErrorSummaryEntry {
  readonly message: string
  readonly fieldId?: string | undefined
}

export interface ErrorSummaryProps {
  readonly title: string
  readonly entries: readonly ErrorSummaryEntry[]
}

/**
 * `role="alert"` + `tabIndex={-1}`: focusable programmatically (the caller
 * calls `.focus()` on the forwarded ref after a failed submit — property 1
 * of the brief, "the summary receives focus on failed submit") without
 * joining the natural Tab order. `role="alert"` also gets it announced the
 * moment it mounts, for a screen-reader user who never moves focus at all.
 */
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(function ErrorSummary(
  { title, entries },
  ref,
) {
  if (entries.length === 0) return null
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      data-control-id="error-summary"
      className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('surface')} p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]`}
    >
      <p className={`font-semibold ${textColor('ink')}`}>{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {entries.map((entry, i) => (
          <li key={`${entry.fieldId ?? 'entry'}-${i}`} className={`text-sm ${textColor('ink')}`}>
            {entry.fieldId !== undefined ? (
              <a
                href={`#${entry.fieldId}`}
                data-control-id={`error-summary-link-${entry.fieldId}`}
                className="underline hover:no-underline"
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById(entry.fieldId as string)
                  el?.focus()
                  el?.scrollIntoView({ block: 'center' })
                }}
              >
                {entry.message}
              </a>
            ) : (
              entry.message
            )}
          </li>
        ))}
      </ul>
    </div>
  )
})
