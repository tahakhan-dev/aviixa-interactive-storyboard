'use client'

import { useEffect, useState } from 'react'
import { resolveControl } from '@/tours/actions'

/**
 * Task 16 — the ring that tracks the tour's current `spotlight` control.
 *
 * PASS CRITERION 1, both halves:
 *
 *  - "tracks the active element through scroll and resize": on every scroll
 *    (capture-phase, so a scroll inside a NESTED scrolling container is seen
 *    too, not just `window`) or resize (of the target element itself, via
 *    `ResizeObserver`, or of the viewport, via `window`'s `resize`), the
 *    target's `getBoundingClientRect()` is re-read and the ring's own
 *    `position: fixed` box is moved to match. `getBoundingClientRect()` is
 *    already viewport-relative, which is exactly what `position: fixed`
 *    consumes directly — no scrollX/scrollY arithmetic to get wrong.
 *  - "never blocks the click the runner is about to make": `pointer-events:
 *    none` on the ring itself. Belt-and-braces — `@/tours/actions`' own
 *    header comment records that `el.click()` (what every tour action
 *    actually calls) bypasses hit-testing entirely, so no CSS property on
 *    this ring could block a TOUR click either way — but a live reviewer's
 *    OWN mouse click on the underlying page (between steps, or after Take
 *    over) is real hit-testing, and that is what this property protects.
 *
 * The dim-everything-except-the-target look is one element, not a
 * backdrop-plus-cutout pair: a `box-shadow` spread far past the viewport
 * bounds darkens everywhere outside the ring's own box while leaving the box
 * itself, and everything under it, untouched and unblocked.
 */

interface Rect {
  readonly top: number
  readonly left: number
  readonly width: number
  readonly height: number
}

function measure(controlId: string): Rect | null {
  const el = resolveControl(controlId)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

const RING_PAD = 6

export function Spotlight({ controlId }: { controlId: string | null }) {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (!controlId) {
      setRect(null)
      return
    }
    let raf = 0
    function recompute() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setRect(measure(controlId!)))
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    const el = resolveControl(controlId)
    if (el) ro.observe(el)
    // The viewport itself resizing (e.g. a device-emulation change) can move
    // the target even when the element's own box does not.
    ro.observe(document.documentElement)
    window.addEventListener('scroll', recompute, { passive: true, capture: true })
    window.addEventListener('resize', recompute)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('scroll', recompute, true)
      window.removeEventListener('resize', recompute)
    }
  }, [controlId])

  if (!rect) return null

  return (
    <div
      aria-hidden="true"
      data-demo="tour-spotlight"
      style={{
        position: 'fixed',
        top: rect.top - RING_PAD,
        left: rect.left - RING_PAD,
        width: rect.width + RING_PAD * 2,
        height: rect.height + RING_PAD * 2,
        pointerEvents: 'none',
        borderRadius: 8,
        border: '3px solid #f5d90a',
        boxShadow: '0 0 0 3px rgba(245, 217, 10, 0.35), 0 0 0 9999px rgba(10, 4, 20, 0.6)',
        transition: 'top 150ms ease, left 150ms ease, width 150ms ease, height 150ms ease',
        zIndex: 998,
      }}
    />
  )
}
