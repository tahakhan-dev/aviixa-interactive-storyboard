'use client'

/**
 * Task 1 — the one place `boot()` is called. Mounted in `app/layout.tsx`
 * wrapping BOTH `{children}` (every product route) and `<DemoChrome/>`, so
 * the repository/session it produces is reachable from every route instead
 * of living only inside the reviewer's own chrome (the structural gap this
 * task exists to close — see task-1-brief.md's framing).
 *
 * Rule 2, "no default-persona flash": before `boot()` resolves, `data` is
 * `null` and `RuntimeDataContext` carries `PRE_BOOT_DATA` (an empty,
 * inert repository, `ready: false`); `sessionState` starts as `SIGNED_OUT`
 * regardless of boot progress. A screen that checks `useRuntimeReady()`
 * before rendering product content never sees a seeded tenant name or a
 * signed-in identity it did not itself produce.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { boot } from '@/data/boot'
import type { Repository } from '@/data/repository'
import type { Store } from '@/data/store'
import {
  PRE_BOOT_DATA,
  ProductSessionContext,
  reviewerAccessContext,
  RuntimeDataContext,
  type RuntimeData,
} from './useRepository'
import { resolveSignIn, SIGNED_OUT, type ProductSessionApi, type ProductSessionState, type SignInOutcome } from './session'

interface BootData {
  readonly repository: Repository
  readonly store: Store
}

export function ProductRuntime({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BootData | null>(null)
  // Mount-once, exactly like DemoChrome's former effect (moved, not
  // duplicated — DemoChrome no longer calls `boot()` itself): nothing about
  // loading and validating the seed ever needs to run twice.
  useEffect(() => {
    let live = true
    void boot()
      .then((result) => {
        if (live) setData({ repository: result.repository, store: result.store })
      })
      .catch(() => {
        // A seed-validation failure throws from `boot()`; the runtime stays
        // on `PRE_BOOT_DATA` forever rather than crashing the tree — every
        // screen already renders its own "not connected yet" state for
        // `ready === false`, matching DemoChrome's prior catch behaviour.
      })
    return () => {
      live = false
    }
  }, [])

  const [sessionState, setSessionState] = useState<ProductSessionState>(SIGNED_OUT)

  const runtimeData: RuntimeData = useMemo(
    () => (data === null ? PRE_BOOT_DATA : { repository: data.repository, store: data.store, ready: true }),
    [data],
  )

  const sessionApi: ProductSessionApi = useMemo(
    () => ({
      ...sessionState,
      signIn(email: string, password: string): SignInOutcome {
        // The lookup runs BEFORE a session exists, so it needs its own
        // cross-tenant read context — the same one the demo Inspector reads
        // through, not `useAccessContext()` (a signed-out identity sees
        // nothing).
        const outcome = resolveSignIn(runtimeData.repository, reviewerAccessContext(runtimeData.store), email, password)
        setSessionState(
          outcome.kind === 'signed-in'
            ? { session: outcome.session, sessionId: email, lastOutcome: outcome }
            : { session: null, sessionId: null, lastOutcome: outcome },
        )
        return outcome
      },
      signOut() {
        setSessionState(SIGNED_OUT)
      },
    }),
    [sessionState, runtimeData],
  )

  return (
    <RuntimeDataContext.Provider value={runtimeData}>
      <ProductSessionContext.Provider value={sessionApi}>{children}</ProductSessionContext.Provider>
    </RuntimeDataContext.Provider>
  )
}
