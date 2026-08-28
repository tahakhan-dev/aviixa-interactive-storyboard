'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LiveRegion } from '@/ui/primitives'
import { bg, textColor } from './tokens'
import { useProductSession, useRuntimeReady } from './runtime'
import type { ProductSession } from './AppShell'

/**
 * Task 3 (unit-01) — the signed-out guard, built once here so every screen
 * inside the product shell reuses the SAME rule rather than re-deriving it:
 * a visitor with `useProductSession().session === null` must never see a
 * default persona's dashboard, and nothing renders seeded data before
 * `useRuntimeReady()` is true. This is the FIRST screen inside the shell
 * (`platform-overview-and-health` is where a sign-in lands), so it is where
 * this pattern is set; a later screen wraps its own body in
 * `<RequireSession signInHref="...">` instead of re-implementing the two
 * checks below.
 *
 * WHY IT LIVES UNDER `src/ui/product/`, NOT `app/**`: it depends on nothing
 * but the runtime hooks (`useRuntimeReady`, `useProductSession`) already
 * exported from here, plus `next/navigation` — the same framework import
 * `AppShell.tsx` already makes (`usePathname`) — so it belongs beside the
 * runtime it reads, reachable by every surface's screens (`app/super-admin/**`
 * today, `app/hub/**`/`app/studio/**`/`app/command-center/**`/`app/frontline/**`
 * once those surfaces grow their own sign-in flows), not duplicated into one
 * `app/**` route tree. `signInHref` is a required prop rather than a
 * hardcoded `/super-admin/sign-in/` for exactly that reason — only Task 2
 * built a sign-in screen so far, and this component does not assume which
 * surface's sign-in a given caller needs.
 *
 * Two distinct pre-content states, per the brief's Rule 2 ("no default-
 * persona flash"):
 *  - `!ready`: the repository has not booted yet. Loading, never seeded
 *    data, never a default identity.
 *  - `ready && session === null`: signed out. The redirect is issued from
 *    an effect (a render must not have a navigation side effect), and the
 *    render in the meantime is the SAME inert loading shape, not a flash of
 *    `children`'s dashboard with a null session forced through it.
 */
export interface RequireSessionProps {
  readonly signInHref: string
  readonly children: (session: ProductSession) => ReactNode
}

function Waiting({ label }: { readonly label: string }) {
  return (
    <div className={`flex min-h-dvh items-center justify-center ${bg('sunken')}`}>
      <LiveRegion>
        <p className={`text-sm ${textColor('ink-muted')}`}>{label}</p>
      </LiveRegion>
    </div>
  )
}

export function RequireSession({ signInHref, children }: RequireSessionProps) {
  const ready = useRuntimeReady()
  const { session } = useProductSession()
  const router = useRouter()

  useEffect(() => {
    if (ready && session === null) router.replace(signInHref)
  }, [ready, session, router, signInHref])

  if (!ready) return <Waiting label="Preparing the platform console…" />
  if (session === null) return <Waiting label="Redirecting to sign in…" />
  return <>{children(session)}</>
}
