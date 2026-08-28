'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  chromeOffParam,
  isChromeVisibilityHotkey,
  readStoredChromeHidden,
  writeStoredChromeHidden,
} from '@/lib/chromeVisibility'

/**
 * Task 14 — the property this whole file exists to guarantee: "hidden means
 * unmounted, not `display:none`." `DemoChrome` calls this hook first, then
 * does `if (hidden) return null` — every hook below still runs on every
 * render (React's own rule: hooks never skip), but the JSX this produces is
 * `null`, so the DOM and accessibility tree get zero demo nodes. A CSS-only
 * hide would still ship every node to a client's inspector and to a screen
 * reader; this ships none.
 *
 * Task 2 fix round 1 (unit-01): the storage key / `?chrome=off` read /
 * hotkey predicate moved to `@/lib/chromeVisibility` — a neutral module a
 * file outside `src/ui/demo/**` may import — so
 * `app/super-admin/sign-in/StoryboardSignInPanel.tsx` (which the
 * `local/no-cross-tree-import` boundary forbids from importing this file
 * directly) can read the exact same definition of "chrome is hidden"
 * instead of carrying its own copy. This hook is now a thin caller of that
 * module, not its owner.
 */

export interface ChromeVisibility {
  readonly hidden: boolean
  readonly hide: () => void
  readonly show: () => void
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
    const stored = readStoredChromeHidden()
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
      if (!isChromeVisibilityHotkey(e)) return
      setHidden((prev) => {
        const next = !prev
        writeStoredChromeHidden(next)
        return next
      })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const hide = useCallback(() => {
    setHidden(true)
    writeStoredChromeHidden(true)
  }, [])

  const show = useCallback(() => {
    setHidden(false)
    writeStoredChromeHidden(false)
  }, [])

  return { hidden, hide, show }
}
