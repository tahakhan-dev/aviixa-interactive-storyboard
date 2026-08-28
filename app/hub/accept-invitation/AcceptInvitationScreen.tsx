'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AppShell,
  NOT_REAL_TEXT,
  bg,
  borderColor,
  radiusClass,
  reviewerAccessContext,
  shadowClass,
  textColor,
  useProductSession,
  useRepository,
  useRuntimeReady,
  useStore,
  type InvitationAcceptanceResult,
  type ProductSession,
} from '@/ui/product'
import { Banner, LiveRegion } from '@/ui/primitives'
import {
  INVITATION_VALIDITY_DAYS,
  classifyTenantAdminInvitation,
  type Repository,
  type TenantAdminInvitationStatus,
} from '@/data/repository'
import type { Store } from '@/data/store'
import { roleById } from '@/domain/roles'

/**
 * Task 8 (unit-01) — the unit's cross-surface handoff. Every screen before
 * this one lives on the Super Admin console; this is the first that renders
 * on a SECOND surface (`SURF-DOH`, the Delivery Operations Hub) and the
 * first Hub screen anywhere in this build to use the `src/ui/product` shell
 * at all (`app/hub/**` elsewhere still renders the earlier `HubShell.tsx`
 * demo chrome, a separate, unrelated tree this file does not touch).
 *
 * WHY THIS SCREEN CANNOT USE `RequireSession` (`@/ui/product/RequireSession`).
 * `RequireSession` exists to redirect a signed-out visitor AWAY, to a sign-in
 * screen. This screen's entire pre-acceptance purpose is to be reachable
 * BY a signed-out visitor — the one holding the invitation link — and one
 * click here is what PRODUCES their session, not a precondition for seeing
 * the page. So this screen reads `useProductSession()` directly and renders
 * its own three states: no session yet (the invitation card, or one of its
 * branches, rendered bare — the same undressed centered-card layout
 * `SignInScreen.tsx` uses for the identical reason, no session to build
 * `AppShell` chrome around); and a landed session (`AppShell surface=
 * "SURF-DOH"`, the real product shell, once one exists).
 *
 * HOW THE INVITATION IS IDENTIFIED IN THE URL. `?tenant=<id>`, the same
 * search-parameter shape Task 6 ruled for `TenantDetailScreen.tsx` and for
 * the identical reason: a static export emits one file per enumerated
 * dynamic-segment id, and a tenant Task 5's wizard creates at runtime has
 * no matching file. `provisionTenant` (`repository.ts`) enforces "a tenant's
 * first administrator" as a singleton, so the tenant id alone is enough to
 * find the one invitation that belongs to it — no email in the URL, no
 * second identifier.
 *
 * WHY THERE IS NO CREDENTIAL-SETUP FORM HERE. The frozen source's own
 * onboarding narrative (§30.3.1) describes this step as "completes single
 * sign-on federation or the platform-managed credential path," but
 * `@/data/schemas/platform#User` carries no password/credential field of
 * any kind for this storyboard to write to or pretend to check — the same
 * gap `SignInScreen.tsx`'s own header already discloses for sign-in itself
 * ("no password is ever checked against anything"). Rendering invented
 * password fields that are validated and then silently discarded would be
 * exactly the false capability master prompt §2.3/§8.6.2 forbid; the one
 * real, schema-carried fact this acceptance can honestly change is the
 * account's own `status`, stamped with `lastSignInAt` — so the control this
 * screen offers is a single, honestly-described Accept action, not a
 * fabricated sign-up form.
 */

const LANDED_BANNER_TITLE = 'You are signed in'

function Centered({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className={`flex min-h-dvh items-center justify-center px-4 py-10 ${bg('sunken')}`} data-surface="SURF-DOH">
      <main id="main" className="flex w-full max-w-md flex-col gap-6">
        <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('surface')} ${shadowClass(2)} p-8`}>
          {children}
        </div>
        <p className={`max-w-prose text-xs ${textColor('ink-subtle')}`}>{NOT_REAL_TEXT}</p>
      </main>
    </div>
  )
}

function Waiting() {
  return (
    <Centered>
      <p className={`text-sm ${textColor('ink-muted')}`} role="status">
        Preparing the platform…
      </p>
    </Centered>
  )
}

/**
 * A tiny, deliberately un-cached read hook — `useRepositoryQuery`
 * (`@/ui/product`) is hardwired to `useAccessContext()`, which reports
 * nothing for a signed-out identity (`withinScope` fails closed by design,
 * per `repository.ts`'s own header). This screen's pre-acceptance read is
 * exactly the case `session.ts#resolveSignIn` already carries the same
 * exception for: a cross-tenant, signed-out-safe lookup through
 * `reviewerAccessContext(store)`, re-run on every store change via a plain
 * subscribe/re-render rather than the versioned cache `useRepositoryQuery`
 * builds for the common, signed-in case — this screen has exactly one
 * caller and does not need that cache's machinery.
 */
function useInvitationPreview(
  store: Store,
  repository: Repository,
  tenantIdParam: string | null,
): TenantAdminInvitationStatus | null {
  const [, bump] = useState(0)
  useEffect(() => repository.subscribe(() => bump((n) => n + 1)), [repository])
  if (tenantIdParam === null) return null
  const ctx = reviewerAccessContext(store)
  const tenants = repository.list('tenants', ctx).all()
  const users = repository.list('users', ctx).all()
  return classifyTenantAdminInvitation(tenants, users, tenantIdParam, store.clock.now())
}

function humanizeLifecycle(lifecycle: string): string {
  const spaced = lifecycle.replace(/-/g, ' ')
  return spaced.length === 0 ? spaced : spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function formatPlatformDate(iso: string): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return 'an unknown date'
  return new Date(ms).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })
}

export function AcceptInvitationScreen() {
  const ready = useRuntimeReady()
  const store = useStore()
  const repository = useRepository()
  const session = useProductSession()
  const searchParams = useSearchParams()
  const tenantIdParam = searchParams.get('tenant')

  const preview = useInvitationPreview(store, repository, ready ? tenantIdParam : null)

  const [accepting, setAccepting] = useState(false)
  const [acceptResult, setAcceptResult] = useState<InvitationAcceptanceResult | null>(null)
  const outcomeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (acceptResult !== null && acceptResult.kind !== 'signed-in') outcomeRef.current?.focus()
  }, [acceptResult])

  async function handleAccept(): Promise<void> {
    if (tenantIdParam === null || accepting) return
    setAccepting(true)
    const result = await session.acceptInvitation(tenantIdParam)
    setAccepting(false)
    setAcceptResult(result)
  }

  if (!ready) return <Waiting />

  if (session.session !== null) {
    return <LandedView session={session.session} />
  }

  // The door's own write-time answer (once tried) is authoritative over
  // the render-time preview — matching `TenantDetailScreen.tsx`'s own split
  // between `activateGate` (a preview) and `repository.update`'s live
  // re-check: a preview can go stale between paint and click, the write
  // never can.
  if (acceptResult !== null && acceptResult.kind !== 'signed-in') {
    return (
      <Centered>
        <OutcomeBanner outcomeRef={outcomeRef} result={acceptResult} />
      </Centered>
    )
  }


  if (tenantIdParam === null || preview === null || preview.kind === 'not-found') {
    return (
      <Centered>
        <h1 className="sr-only">This invitation link isn&rsquo;t recognized</h1>
        <div ref={outcomeRef} tabIndex={-1} className="focus:outline-none">
          <Banner
            tone="neutral"
            heading="This invitation link isn't recognized"
            body={
              tenantIdParam === null
                ? 'This page needs an invitation to show and none was named in the address.'
                : "It doesn't match any invitation this platform can find. Check the link, or contact the person who invited you."
            }
          />
        </div>
      </Centered>
    )
  }

  if (preview.kind === 'already-accepted') {
    return (
      <Centered>
        <h1 className="sr-only">Already accepted</h1>
        <div ref={outcomeRef} tabIndex={-1} className="focus:outline-none">
          <Banner
            tone="info"
            heading="Already accepted"
            body={`${preview.admin.displayName}'s invitation to ${preview.tenant.name} has already been accepted. If this is your account, contact your platform administrator for help signing in.`}
          />
        </div>
      </Centered>
    )
  }

  if (preview.kind === 'expired') {
    return (
      <Centered>
        <h1 className="sr-only">This invitation has expired</h1>
        <div ref={outcomeRef} tabIndex={-1} className="focus:outline-none">
          <Banner
            tone="attention"
            heading="This invitation has expired"
            body={`It was issued on ${formatPlatformDate(preview.invitedAt)} for ${preview.tenant.name}. Ask your platform administrator to re-issue it.`}
          />
        </div>
      </Centered>
    )
  }

  if (preview.kind === 'tenant-blocked') {
    return (
      <Centered>
        <h1 className="sr-only">This workspace is not available</h1>
        <div ref={outcomeRef} tabIndex={-1} className="focus:outline-none">
          <Banner
            tone="blocked"
            heading="This workspace is not available"
            body={`${preview.tenant.name}'s account is currently ${humanizeLifecycle(preview.tenant.lifecycle).toLowerCase()}. Contact your platform administrator.`}
          />
        </div>
      </Centered>
    )
  }

  // `preview.kind === 'ok'` — the eligible, ordinary case.
  return (
    <Centered>
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${textColor('ink-subtle')}`}>AVIIXA</p>
      <h1 className={`mt-2 text-2xl font-semibold ${textColor('ink')}`}>Accept your invitation</h1>
      <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
        {preview.tenant.name} has invited {preview.admin.displayName} ({preview.admin.email}) to administer this
        workspace as its Tenant Admin.
      </p>

      <button
        type="button"
        data-control-id="accept-invitation-submit"
        aria-busy={accepting ? 'true' : undefined}
        disabled={accepting}
        onClick={() => {
          void handleAccept()
        }}
        className={`mt-6 self-start ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50`}
      >
        {accepting ? 'Accepting…' : 'Accept invitation'}
      </button>

      <details data-control-id="accept-invitation-expiry-disclosure" className="mt-4 text-xs">
        <summary className={`cursor-pointer ${textColor('ink-muted')}`}>
          Why this invitation is treated as valid for {INVITATION_VALIDITY_DAYS} days
        </summary>
        <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
          This platform's specification does not fix how long an invitation to set up an account stays open before
          it lapses. The closest figure it gives anywhere is a recommendation of seven days for the general
          account-invitation case, offered as a suggestion rather than a settled rule, with no separate figure
          named for a Tenant Admin's own invitation. This build uses that same seven-day window here rather than
          inventing an unrelated number. A client-delegated choice under APP-012, not a position the source
          settled.
        </p>
      </details>

      <details data-control-id="accept-invitation-activation-disclosure" className="mt-2 text-xs">
        <summary className={`cursor-pointer ${textColor('ink-muted')}`}>
          Why accepting this invitation does not switch the workspace on by itself
        </summary>
        <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
          This platform's specification describes one version of this moment where accepting the invitation and
          the workspace switching on happen together, in the same step. This build instead keeps those as two
          separate acts: accepting sets your own account active; a platform administrator switches the workspace
          on afterward, from the Super Admin console. This console follows the second reading rather than the
          first. A client-delegated choice under APP-012, not a position the source settled.
        </p>
      </details>
    </Centered>
  )
}

function OutcomeBanner({
  outcomeRef,
  result,
}: {
  readonly outcomeRef: React.RefObject<HTMLDivElement | null>
  readonly result: Exclude<InvitationAcceptanceResult, { kind: 'signed-in' }>
}) {
  const content = (() => {
    switch (result.kind) {
      case 'not-found':
        return {
          tone: 'neutral' as const,
          heading: "This invitation link isn't recognized",
          body: "It doesn't match any invitation this platform can find. Check the link, or contact the person who invited you.",
        }
      case 'already-accepted':
        return {
          tone: 'info' as const,
          heading: 'Already accepted',
          body: 'This invitation has already been accepted. If this is your account, contact your platform administrator for help signing in.',
        }
      case 'expired':
        return {
          tone: 'attention' as const,
          heading: 'This invitation has expired',
          body: `It was issued on ${formatPlatformDate(result.invitedAt)}. Ask your platform administrator to re-issue it.`,
        }
      case 'tenant-blocked':
        return {
          tone: 'blocked' as const,
          heading: 'This workspace is not available',
          body: `This workspace's account is currently ${humanizeLifecycle(result.lifecycle).toLowerCase()}. Contact your platform administrator.`,
        }
      case 'denied':
      case 'persistence-unavailable':
        return {
          tone: 'blocked' as const,
          heading: 'This could not be completed',
          body: result.explain,
        }
    }
  })()

  return (
    <>
      <h1 className="sr-only">{content.heading}</h1>
      <div ref={outcomeRef} tabIndex={-1} className="focus:outline-none">
        <Banner tone={content.tone} heading={content.heading} body={content.body} />
      </div>
    </>
  )
}

/**
 * Fix round 1 (unit-01, Task 8 review, MINOR) — focus moves to this landing
 * banner on mount, matching what every failure branch above already does
 * through `outcomeRef`: the tree swaps to this component the instant a
 * session lands, and without this a keyboard/screen-reader user's focus
 * would fall to `<body>` with no announcement of what just happened.
 */
function LandedView({ session }: { readonly session: ProductSession }) {
  const landedRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    landedRef.current?.focus()
  }, [])
  // The role label is READ from the session, never hand-typed beside it —
  // fix round 1 (unit-01, Task 8 review, MINOR): this used to hardcode
  // "Tenant Admin" directly in the sentence below, true only because
  // `acceptInvitation` (`repository.ts`) only ever lands a `TENANT_ADMIN`
  // today, which made the hardcoded string an assertion the code did not
  // itself derive.
  const roleLabel = roleById(session.role).name
  // No extra heading added here: `AppShell` already renders a real `<h1>`
  // (the surface's own default title, "Delivery Operations Hub") for every
  // screen it wraps — adding a second would be exactly the double-`<h1>`
  // this file's own header already warns `TenantDetailScreen.tsx` about
  // avoiding. The four bare (pre-session) branch states below have no such
  // heading to inherit, which is what the fix-round `sr-only` headings
  // there are actually for.
  return (
    <AppShell surface="SURF-DOH" session={session}>
      <LiveRegion>
        <div ref={landedRef} tabIndex={-1} className="focus:outline-none">
          <Banner
            tone="ok"
            heading={LANDED_BANNER_TITLE}
            body={`Signed in as ${session.identity} — ${roleLabel}. Your workspace becomes fully active once the platform team activates it from the Super Admin console; until then you can see it here but it is not yet operating.`}
          />
        </div>
      </LiveRegion>
    </AppShell>
  )
}

