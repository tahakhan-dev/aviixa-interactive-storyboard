'use client'

import { useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { useOverlayFocus } from './useOverlayFocus'

/**
 * Same role, labelling, and `useOverlayFocus` contract as `Dialog`, anchored
 * to a screen edge via `side`.
 *
 * States: closed (renders `null`), open — left, open — right.
 *
 * TASK 9 FIX ROUND 2: migrated the panel onto the new `src/ui/product/
 * tokens.ts` layer (`--surface`/`--ink`, dark-mode aware) rather than the
 * legacy `--color-surface`/`--color-ink` (fixed light, no dark
 * redefinition). This closes a regression fix round 1 introduced: `<main>`
 * in `AppShell.tsx` started setting its own `color: var(--ink)` default so
 * unstyled page content stays legible in dark mode, and CSS `color`
 * inherits — so a `Drawer` mounted under that `<main>` had its UNSTYLED
 * `children` inherit `<main>`'s (dark-mode-correct) ink while sitting on
 * this panel's own STILL-fixed-light background, measuring 1.10:1. Before
 * fix round 1 this "worked" only because nothing in the chain was
 * dark-mode-aware yet, so the fixed dark legacy ink happened to still match
 * this fixed light panel by accident.
 *
 * The real fix is the same pattern `<main>` uses, applied here: `text-[var(
 * --ink)]` on the panel root establishes ITS OWN default, so unstyled
 * children inherit a colour that is always correct for THIS panel's own
 * background — regardless of what colour happens to be inherited from
 * further up the tree. A surface that carries its own background must also
 * carry its own text-colour default; relying on an ancestor's is what broke.
 *
 * THE BACKDROP IS DELIBERATELY NOT MIGRATED. `bg-[var(--color-ink)]/40` is a
 * scrim, not text-on-background content — its job is to darken the page
 * behind the drawer, in every theme, and the legacy token already does that
 * correctly (a fixed dark value regardless of system preference). Swapping
 * it for the dark-mode-aware `--ink` would make the scrim flip to a LIGHT
 * tint in dark mode, which dims nothing — that would be a new bug, not a fix.
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
        className={`absolute top-0 h-full w-full max-w-sm bg-[var(--surface)] p-4 text-[var(--ink)] shadow-lg ${SIDE_CLASS[side]}`}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-base font-semibold text-[var(--ink)]">
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
