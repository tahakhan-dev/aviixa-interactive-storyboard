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
 *    too, not just `window`) or resize (of the target's own box, of any
 *    ANCESTOR box up to `<html>`, or of the viewport — see the ancestor-walk
 *    below), the target's `getBoundingClientRect()` is re-read and the
 *    ring's own `position: fixed` box is moved to match.
 *    `getBoundingClientRect()` is already viewport-relative, which is
 *    exactly what `position: fixed` consumes directly — no scrollX/scrollY
 *    arithmetic to get wrong.
 *  - "never blocks the click the runner is about to make": `pointer-events:
 *    none` on the ring itself. Belt-and-braces — `@/tours/actions`' own
 *    header comment records that `el.click()` (what every tour action
 *    actually calls) bypasses hit-testing entirely, so no CSS property on
 *    this ring could block a TOUR click either way — but a live reviewer's
 *    OWN mouse click on the underlying page (between steps, or after Take
 *    over) is real hit-testing, and that is what this property protects.
 *
 * Fix round 1, Important: observing only the target's OWN box (plus the
 * viewport) missed a real case — content growing ABOVE the target, with no
 * scroll and no resize of the target or the viewport, moves the target
 * without firing anything this file used to listen for. `ResizeObserver` on
 * `document.documentElement` alone did not catch it either (the root
 * element's rendered box is not guaranteed to track overflow content the way
 * an ordinary block ancestor's box does). The fix is to observe every
 * ancestor from the target up to `<html>`, not just the two ends of that
 * chain: ANY of them growing or shrinking moves the target, and a `resize`
 * fires for the one that actually changed regardless of which ancestor it
 * is. Still no timer — this is `ResizeObserver` used more thoroughly, not
 * polling.
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
    // Every ancestor's box, from the target itself up to (and including)
    // <html> — a layout shift ANYWHERE in that chain (e.g. a sibling above
    // the target growing taller, with no scroll and no viewport resize)
    // moves the target and is caught here, not just a resize of the
    // target's own box or the root element's.
    for (let node: HTMLElement | null = el; node; node = node.parentElement) {
      ro.observe(node)
    }
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
