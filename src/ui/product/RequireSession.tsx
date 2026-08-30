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
 *
 * FIX ROUND 1 (Task 6, review IMPORTANT 5) — the redirect now appends
 * `?next=<encoded current path+search>` to `signInHref`, read from
 * `window.location` inside the effect (client-only, so no SSR/prerender
 * concern) rather than `useSearchParams()` — that hook requires a
 * `<Suspense>` boundary under static export, which would force one onto
 * every page.tsx that renders `<RequireSession>` for a value only ever
 * needed at redirect time. `SignInScreen.tsx#resolveLandingHref` reads it
 * back and returns to it after a successful sign-in, so a deep link (a
 * tenant detail `?tenant=` URL, for one) survives the sign-in round trip
 * instead of always landing on the Overview dashboard — master prompt
 * §6.2's "reload and back/forward reconstruct the exact permitted state."
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
    if (ready && session === null) {
      const returnTo = `${window.location.pathname}${window.location.search}`
      const separator = signInHref.includes('?') ? '&' : '?'
      router.replace(`${signInHref}${separator}next=${encodeURIComponent(returnTo)}`)
    }
  }, [ready, session, router, signInHref])

  if (!ready) return <Waiting label="Preparing the platform console…" />
  if (session === null) return <Waiting label="Redirecting to sign in…" />
  return <>{children(session)}</>
}
