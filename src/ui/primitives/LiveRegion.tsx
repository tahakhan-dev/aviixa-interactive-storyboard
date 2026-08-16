import type { ReactNode } from 'react'

/**
 * A bare `aria-live` region with `aria-atomic="true"`, so an assistive
 * technology re-reads the whole message rather than a diff of it.
 *
 * States: polite (default), assertive.
 */
export interface LiveRegionProps {
  politeness?: 'polite' | 'assertive'
  children: ReactNode
}

export function LiveRegion({ politeness = 'polite', children }: LiveRegionProps) {
  return (
    <div aria-live={politeness} aria-atomic="true">
      {children}
    </div>
  )
}
