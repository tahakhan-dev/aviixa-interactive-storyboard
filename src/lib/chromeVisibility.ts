/**
 * Task 2 fix round 1 (unit-01) — the read/write primitives behind "is demo
 * chrome hidden", extracted out of `src/ui/demo/useChromeVisibility.ts` into
 * this neutral module so a file that may not import `src/ui/demo/**` at all
 * (`eslint.config.mjs`'s `local/no-cross-tree-import` "everyone except
 * `src/ui/demo/**` itself" zone — `app/layout.tsx` is the one named
 * carve-out) can still read the exact same key/query/hotkey convention,
 * rather than keeping a second, hand-copied definition that could silently
 * drift from the real one. `src/ui/demo/useChromeVisibility.ts` itself now
 * imports from here too: this file is the ONE definition of what "chrome is
 * hidden" means; both it and
 * `app/super-admin/sign-in/StoryboardSignInPanel.tsx` are callers, not
 * duplicate owners.
 */

export const CHROME_HIDDEN_STORAGE_KEY = 'aviixa-demo-chrome-hidden'

/**
 * A per-load screenshot override, not a stored preference — see
 * `useChromeVisibility`'s own comment on why this still matters after
 * hidden-by-default at first paint.
 */
export function chromeOffParam(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('chrome') === 'off'
  } catch {
    return false
  }
}

/** Every read wrapped in its own try/catch: a private window or a browser blocking site data must not break the caller. */
export function readStoredChromeHidden(): boolean | null {
  try {
    const raw = window.localStorage.getItem(CHROME_HIDDEN_STORAGE_KEY)
    if (raw === 'true') return true
    if (raw === 'false') return false
    return null
  } catch {
    return null
  }
}

export function writeStoredChromeHidden(hidden: boolean): void {
  try {
    window.localStorage.setItem(CHROME_HIDDEN_STORAGE_KEY, String(hidden))
  } catch {
    // Storage blocked or full — best-effort persistence only; the caller's
    // own in-memory state already took effect regardless.
  }
}

/** Alt+Shift+D — avoids the common browser/OS chords (find, devtools, etc). */
export function isChromeVisibilityHotkey(e: KeyboardEvent): boolean {
  return e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'd'
}
