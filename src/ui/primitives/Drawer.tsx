'use client'

import { useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { useOverlayFocus } from './useOverlayFocus'

/**
 * Same role, labelling, and `useOverlayFocus` contract as `Dialog`, anchored
 * to a screen edge via `side`.
 *
 * States: closed (renders `null`), open — left, open — right.
 */
export type DrawerSide = 'left' | 'right'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  side?: DrawerSide
  children?: ReactNode
}

const SIDE_CLASS: Record<DrawerSide, string> = {
  left: 'left-0',
  right: 'right-0',
}

export function Drawer({ open, onClose, title, side = 'right', children }: DrawerProps) {
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  useOverlayFocus(open, onClose, containerRef)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-ink)]/40">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute top-0 h-full w-full max-w-sm bg-[var(--color-surface)] p-4 shadow-lg ${SIDE_CLASS[side]}`}
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
