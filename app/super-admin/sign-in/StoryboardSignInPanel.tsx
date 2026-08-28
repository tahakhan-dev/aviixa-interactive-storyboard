'use client'

import { useEffect, useState } from 'react'
import { chromeOffParam, isChromeVisibilityHotkey, readStoredChromeHidden } from '@/lib/chromeVisibility'

/**
 * Task 2 (unit-01) — the reviewer-facing "which seeded identity does what"
 * cheat sheet for the sign-in screen, styled in DemoChrome's own visual
 * family (dashed border, monospace, the same violet/amber palette
 * `src/ui/demo/DemoChrome.tsx` uses, sharing no CSS custom property with
 * `src/ui/product/tokens.ts`) rather than the product card's palette — so
 * it reads as reviewer tooling, never as part of the product, in both
 * themes.
 *
 * WHY THIS FILE LIVES HERE, UNDER `app/super-admin/sign-in/`, RATHER THAN
 * UNDER `src/ui/demo/**`. `eslint.config.mjs`'s `local/no-cross-tree-import`
 * "everyone except src/ui/demo/** itself" zone forbids ANY file outside
 * `src/ui/demo/**` (barring the one named carve-out for `app/layout.tsx`,
 * which mounts `<DemoChrome/>` at the root) from importing
 * `src/ui/demo/**` at all — not only `src/ui/product/**`, which is the
 * narrower rule stated in this task's own brief. `SignInScreen.tsx` is an
 * `app/**` file, so it cannot import this panel FROM `src/ui/demo/**`
 * either. And it cannot live under `src/ui/product/**`: that tree may only
 * style against `tokens.ts` (a dark-mode-aware, product-branded palette),
 * while this panel's whole visual point is to look like something else —
 * the fixed, theme-independent chrome palette. `app/super-admin/sign-in/`
 * is the one place that is neither: it can import product primitives
 * freely if it ever needs to, but nothing here reaches into
 * `src/ui/demo/**`.
 *
 * "ABSENT FROM A CHROME-HIDDEN SCREENSHOT" WITHOUT IMPORTING THE HOOK THAT
 * DEFINES IT. `src/ui/demo/useChromeVisibility.ts` is exactly the right
 * logic for this, but it lives under `src/ui/demo/**` and the boundary
 * above forbids importing it from here. FIX ROUND 1 (task-2 review,
 * IMPORTANT 2): the read-only pieces of that logic — the storage key, the
 * `?chrome=off` check, the hotkey predicate — are extracted into
 * `@/lib/chromeVisibility`, a neutral module BOTH this file and
 * `useChromeVisibility.ts` itself import. One definition of "chrome is
 * hidden," not two that can drift; this file no longer carries its own copy.
 */

function slugify(email: string): string {
  return email.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}

export interface StoryboardIdentity {
  readonly email: string
  readonly role: string
  readonly outcome: string
}

/**
 * One row per row of the task brief's own outcome table — the exact
 * `users.json` addresses that reach each of the six `SignInOutcome` kinds.
 * `someone.unlisted@example.com` is not a seed row; it demonstrates the
 * "unknown address" arm, which resolves identically to the removed
 * account below it (R2 in `session.ts`: never disclose which).
 */
export const STORYBOARD_IDENTITIES: readonly StoryboardIdentity[] = [
  {
    email: 'helena.voss@platform.aviixa.example',
    role: 'Admin',
    outcome: 'Signs in and lands on the platform console.',
  },
  {
    email: 'root.admin@platform.aviixa.example',
    role: 'Root Super Admin',
    outcome: 'Requires the enforced-invariant acknowledgement before it can proceed.',
  },
  {
    email: 'someone.unlisted@example.com',
    role: 'not a seeded account',
    outcome: 'Generic "incorrect" message — an unknown address is never disclosed as such.',
  },
  {
    email: 'peter.dijk@vantageindustrial.example',
    role: 'Tenant Admin, removed',
    outcome: 'The same generic "incorrect" message as an unknown address, deliberately.',
  },
  {
    email: 'nadia.ferreira@ironcladfasteners.example',
    role: 'Tenant Admin, invited',
    outcome: 'Invitation not yet accepted.',
  },
  {
    email: 'camille.dubois@brightbikes.example',
    role: 'Worker, suspended',
    outcome: 'Account suspended.',
  },
  {
    email: 'callum.reid@northforgemetal.example',
    role: 'Tenant Admin, active',
    outcome: 'The account itself is fine, but its tenant is suspended.',
  },
]

export interface StoryboardSignInPanelProps {
  readonly onSelect: (email: string) => void
}

export function StoryboardSignInPanel({ onSelect }: StoryboardSignInPanelProps) {
  // Starts `true` for the same reason `useChromeVisibility` does: this is a
  // static export with no per-request server, so the prerendered HTML and
  // the very first client paint must carry zero demo-family markup —
  // resolved for real only after the mount effect below runs.
  const [hidden, setHidden] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (chromeOffParam()) return // stays hidden — see useChromeVisibility's own comment.
    setHidden(readStoredChromeHidden() ?? false)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isChromeVisibilityHotkey(e)) setHidden((prev) => !prev)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  if (hidden) return null

  return (
    <div
      data-demo="storyboard-signin-panel"
      className="rounded border-2 border-dashed border-[#f5d90a] bg-[#1b1030] font-mono text-[#f0e6ff]"
    >
      <button
        type="button"
        data-control-id="storyboard-signin-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs"
      >
        <span>
          <span className="rounded bg-[#f5d90a] px-2 py-0.5 font-bold text-[#1b1030]">STORYBOARD</span>{' '}
          Storyboard sign-in — seeded identities
        </span>
        <span aria-hidden="true">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded ? (
        <div className="max-h-72 overflow-y-auto border-t border-[#4a3070] p-3 text-xs">
          <p className="mb-2 text-[#c9b3ff]">
            Not part of the product. Any non-empty password is accepted for an active account —
            this storyboard has no backend to check one against.
          </p>
          <ul className="space-y-2">
            {STORYBOARD_IDENTITIES.map((identity) => (
              <li
                key={identity.email}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[#4a3070] pb-2 last:border-b-0 last:pb-0"
              >
                <span>
                  <span className="block font-semibold">{identity.email}</span>
                  <span className="block text-[#c9b3ff]">
                    {identity.role} — {identity.outcome}
                  </span>
                </span>
                <button
                  type="button"
                  data-control-id={`storyboard-signin-use-${slugify(identity.email)}`}
                  onClick={() => onSelect(identity.email)}
                  className="rounded border border-[#f5d90a] px-2 py-1 hover:bg-[#2a1a4a]"
                >
                  Use this address
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
