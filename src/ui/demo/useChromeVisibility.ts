'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Task 14 — the property this whole file exists to guarantee: "hidden means
 * unmounted, not `display:none`." `DemoChrome` calls this hook first, then
 * does `if (hidden) return null` — every hook below still runs on every
 * render (React's own rule: hooks never skip), but the JSX this produces is
 * `null`, so the DOM and accessibility tree get zero demo nodes. A CSS-only
 * hide would still ship every node to a client's inspector and to a screen
 * reader; this ships none.
 */

const STORAGE_KEY = 'aviixa-demo-chrome-hidden'

/**
 * Every read/write wrapped in its own try/catch, per the brief: a private
 * window or a browser blocking site data must not break the page, and the
 * hook must still return a working (session-only) `hidden` toggle when
 * storage is unavailable.
 */
function readStoredHidden(): boolean | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'true') return true
    if (raw === 'false') return false
    return null
  } catch {
    return null
  }
}

function writeStoredHidden(hidden: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(hidden))
  } catch {
    // Storage blocked or full — the in-memory `hidden` state set by the
    // caller already took effect; this is a best-effort persistence layer
    // on top of it, never a requirement for the toggle to work this session.
  }
}

/**
 * `?chrome=off` reads straight off `window.location.search` rather than
 * `next/navigation`'s `useSearchParams()` — this app is a static export
 * (`next.config.ts`, `output: 'export'`), and `useSearchParams()` forces a
 * Suspense boundary around any component that calls it. `DemoChrome` mounts
 * once at the root layout; a plain `URLSearchParams` read needs neither a
 * boundary nor a dependency on a Next.js navigation context, and this value
 * is only ever read once, at mount (see the effect below), so there is no
 * reactivity to lose by reading it the plain way.
 */
function chromeOffParam(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('chrome') === 'off'
  } catch {
    return false
  }
}

export interface ChromeVisibility {
  readonly hidden: boolean
  readonly hide: () => void
  readonly show: () => void
}

/**
 * The hotkey answers a question `hide`/`show` alone cannot: once chrome is
 * hidden, it renders NO DOM — so no on-screen control can call `show()`
 * without itself being a demo node that a `chrome=off` capture would catch.
 * A global, non-visual `keydown` listener is not a DOM node and is invisible
 * to both a screenshot and an accessibility-tree query, so it can keep
 * `show()` reachable even while every visible trace of chrome is gone.
 * Alt+Shift+D avoids the common browser/OS chords (find, devtools, etc).
 */
function isToggleHotkey(e: KeyboardEvent): boolean {
  return e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'd'
}

export function useChromeVisibility(): ChromeVisibility {
  // FIX ROUND 1 (Critical): starts `true`, not `false`. This app is a
  // static export (`next.config.ts`, `output: 'export'`) -- there is no
  // per-request server, so `next build` renders every route's HTML once,
  // ahead of time, with no browser and no effects. A `false` default meant
  // that prerendered HTML, and the very first client paint before this
  // hook's own mount effect below ever runs, both rendered chrome
  // unconditionally: `DEMO CHROME` and `data-demo="chrome-root"` shipped in
  // all 103 files under `out/`, in the raw served bytes, regardless of
  // `?chrome=off` -- a static export cannot read a query string at render
  // time, so that param changed nothing either. Defaulting to `true` means
  // the exported HTML and the pre-hydration paint both carry ZERO demo
  // markup; the mount effect below is what resolves the real state once
  // client JS actually runs, matching "demo chrome is a client-only
  // reviewer tool, not part of the document the product serves."
  const [hidden, setHidden] = useState(true)

  // Mount-only, client-side: this is now the ONLY place `hidden` is ever
  // resolved away from its safe `true` default, and it runs after
  // hydration, never during the static-export prerender.
  //
  // `?chrome=off` still does real work here, just not the same work it did
  // before: chrome was already absent at first paint either way now, so
  // this param's job is to keep it that way even AFTER hydration would
  // otherwise show it (its actual use: a screenshot tool that waits for
  // the page to finish hydrating/settling before capturing must still see
  // no chrome). It is still never persisted -- a per-load capture
  // override, not a new stored preference -- and the hotkey still works
  // normally afterward if a live session needs to bring chrome up anyway.
  //
  // With no `chrome=off`, the stored preference (if any) applies; with
  // neither, `hidden` resolves to `false` -- the ordinary "chrome appears
  // once the client has mounted" default this fix round's whole point is
  // to move OUT of the initial render and INTO here. Runs exactly once;
  // neither source is a value this effect needs to react to again
  // afterward — the hotkey and the `hide`/`show` calls below are what
  // change `hidden` from here on.
  useEffect(() => {
    if (chromeOffParam()) return // stays hidden -- see comment above.
    const stored = readStoredHidden()
    setHidden(stored ?? false)
  }, [])

  // Registered once, unconditionally, regardless of `hidden` — this is what
  // keeps `show()` reachable while chrome is unmounted. `setHidden` with a
  // functional updater means this effect never needs `hidden` in its
  // dependency array (it would otherwise re-subscribe the listener on every
  // toggle, tearing down and rebuilding a document-level listener for no
  // reason — the exact "effect keyed on a value that churns" trap named in
  // the brief).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isToggleHotkey(e)) return
      setHidden((prev) => {
        const next = !prev
        writeStoredHidden(next)
        return next
      })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const hide = useCallback(() => {
    setHidden(true)
    writeStoredHidden(true)
  }, [])

  const show = useCallback(() => {
    setHidden(false)
    writeStoredHidden(false)
  }, [])

  return { hidden, hide, show }
}
