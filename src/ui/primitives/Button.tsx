'use client'

import { useId, type ReactNode } from 'react'
import type { StatusTone } from './StatusPill'

/**
 * Uses `aria-disabled` rather than the bare `disabled` attribute, so the
 * control stays focusable and screen-reader users navigating by control
 * still land on it and hear why it does not act (shared primitive contract,
 * rule 2). A disabled button REQUIRES `disabledReason`; the reason renders as
 * visible text wired through `aria-describedby` and the handler is never
 * called while disabled or loading.
 *
 * States: default, hover/focus/active (native + `:focus-visible` from
 * globals.css), disabled (via `disabledReason`), loading.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export interface ButtonProps {
  children: ReactNode
  /**
   * Deviation from brief: the interface bullet lists `variant` unmarked
   * (implying required), but the brief's own verbatim tests never pass one —
   * requiring it would fail those tests under strict TS. Made optional,
   * defaulting to 'primary'.
   */
  variant?: ButtonVariant
  tone?: StatusTone
  disabledReason?: string
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  /**
   * Fix round 1 (closure sweep Task 7, coordinator review, Minor 11) — this
   * primitive rendered no `data-control-id` at all, for any caller, in the
   * whole codebase. Optional and additive: every existing call site is
   * unaffected (no attribute rendered when omitted, exactly today's
   * behaviour); a caller that needs one no longer has to wrap this component
   * in an extra element just to get an identifiable control.
   */
  controlId?: string
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-ink)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]',
  danger: 'bg-[var(--color-status-blocked)] text-[var(--color-primary-ink)]',
}

export function Button({
  children,
  variant = 'primary',
  disabledReason,
  loading = false,
  onClick,
  type = 'button',
  controlId,
}: ButtonProps) {
  const reasonId = useId()
  const disabled = disabledReason !== undefined
  const inert = disabled || loading

  return (
    <>
      <button
        type={type}
        data-control-id={controlId}
        aria-disabled={inert ? 'true' : undefined}
        aria-busy={loading ? 'true' : undefined}
        aria-describedby={disabled ? reasonId : undefined}
        onClick={() => {
          if (inert) return
          onClick?.()
        }}
        className={`rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${VARIANT_CLASS[variant]} ${inert ? 'opacity-50' : ''}`}
      >
        {children}
      </button>
      {disabled ? (
        <span id={reasonId} className="block text-xs text-[var(--color-ink-muted)]">
          {disabledReason}
        </span>
      ) : null}
    </>
  )
}
