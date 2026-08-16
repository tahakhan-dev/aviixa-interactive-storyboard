'use client'

import { useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { useOverlayFocus } from './useOverlayFocus'

/**
 * `role="dialog"` with `aria-labelledby` pointing at its title. Focus trap,
 * Escape-to-close and invoker restoration come from `useOverlayFocus`,
 * shared with `Drawer`.
 *
 * States: closed (renders `null`), open.
 */
export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  useOverlayFocus(open, onClose, containerRef)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/40"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-[var(--radius-surface)] bg-[var(--color-surface)] p-4 shadow-lg"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-base font-semibold text-[var(--color-ink)]">
            {title}
          </h2>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}
