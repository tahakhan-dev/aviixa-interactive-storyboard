'use client'

import type { ReactNode } from 'react'

/**
 * Task 13 — wraps Frontline content in a realistic 12-inch tablet bezel at
 * desktop widths (Tailwind `lg`, 1024px+) so a reviewer sitting at a laptop
 * sees what a worker sees standing at the device, not a full-bleed desktop
 * page. Below `lg` — the width range a real tablet actually reports — the
 * bezel drops entirely and `children` fill the real viewport, because a
 * worker's own tablet never draws a second device frame around itself.
 *
 * THE FRAME IS DECORATION, NEVER LAYOUT. The bezel and camera dot are
 * `aria-hidden` and only their CSS classes are breakpoint-gated; the
 * element hosting `children` renders the identical classes (`flex-1
 * overflow-auto`) in both states. Nothing here mounts a different
 * component tree above `lg` than below it — only different decoration
 * around the same one — which is what keeps the inner layout's behaviour
 * unchanged between the two widths the brief asks to compare.
 *
 * 1024px, NOT 768px. The brief's own two verification widths are 1440
 * (framed) and 820 (frameless). A `md` (768px) gate would leave the frame
 * ON at 820; only `lg` (1024px) drops it there.
 *
 * Bezel colour is real-world device plastic, not product chrome, so it is
 * a literal `neutral-900`/`neutral-600` rather than a `tokens.ts` accessor
 * — nothing here is a product surface a theme should recolour.
 */
export interface DeviceFrameProps {
  readonly children: ReactNode
}

export function DeviceFrame({ children }: DeviceFrameProps) {
  return (
    <div className="flex w-full justify-center lg:min-h-dvh lg:items-center lg:bg-[var(--sunken)] lg:p-10">
      <div className="relative flex w-full flex-col overflow-hidden lg:aspect-[4/3] lg:w-[1024px] lg:rounded-[2.25rem] lg:border-[14px] lg:border-neutral-900 lg:bg-neutral-900 lg:shadow-2xl">
        <div
          aria-hidden="true"
          className="hidden shrink-0 items-center justify-center py-1.5 lg:flex"
        >
          <span className="h-2 w-2 rounded-full bg-neutral-600" />
        </div>
        <div className="flex-1 overflow-auto lg:rounded-b-[0.5rem]">{children}</div>
      </div>
    </div>
  )
}
