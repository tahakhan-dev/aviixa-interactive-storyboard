'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AppShell,
  RequireSession,
  StatusPill,
  bg,
  borderColor,
  radiusClass,
  textColor,
  useProductSession,
  useRepositoryQuery,
  useStore,
  type ProductSession,
} from '@/ui/product'
import type { AccessContext, Repository, RowOf } from '@/data/repository'

/**
 * Task 7 (closure sweep) — LV-0010's own landing route: the read-only Hub
 * view a support session (`repository.ts#openSupportSession`) navigates a
 * Root/Admin/Support operator INTO, closing the "no in-app link between the
 * Super Admin console and a tenant's Hub" gap Unit 1's own closure record
 * disclosed. This screen claims no `MOD-DOH-*` module and appears in no
 * screen catalogue — it exists only while a support session is open, is
 * never offered a nav-rail entry (`AppShell`'s own `chromeFor('SURF-DOH', …)`
 * gives a PLATFORM-domain role an empty rail, matching the route registry's
 * own D11 gate — no Hub module ever lists a platform role as a reacher), and
 * carries none of the write affordances the rest of `app/hub/**` builds.
 *
 * WHY THERE IS NO WRITE CONTROL ANYWHERE ON THIS SCREEN, BY OMISSION RATHER
 * THAN BY A DISABLED BUTTON: `WF-ROLE-022`'s own Denied path is unconditional
 * — "Any write refused" — and AC-SA-15-01 (frozen source) states the session
 * is read-only without exception. `openSupportSession`'s own row always
 * carries `readOnly: true`, and no tenant-domain write door this build has
 * ever exists a PLATFORM-domain identity could reach anyway (`evaluateAccess`'s
 * own PLATFORM branch keeps `identity.tenant` null for the whole life of this
 * session — see `session.ts#actingContextFor`). A rendered-but-disabled write
 * control would imply an enabled state exists somewhere for this identity;
 * for a support session it categorically does not, so none is drawn — the
 * same "absence, not a disabled control" discipline `SupportAccessScreen.tsx`'s
 * own `ProhibitionNotice` uses.
 *
 * Fix round 1 (coordinator review, Critical 2 / Important 9) — the on-screen
 * banner below used to render "(AC-SA-15-01)" as page text and point the
 * reader at "this file's own header comment", both defects: a bare
 * requirement identifier is never product copy (the citation belongs here,
 * in the comment, not on screen), and a sentence written to whoever reads
 * the SOURCE is not a sentence for whoever is USING the product. It also
 * claimed "for every account including the root", which overclaims — Root
 * and Admin retain their ordinary `'platform'`-authority write capability
 * (`users`/`role-grants`/`tenants`, `PLATFORM_WRITERS`) for the whole life of
 * this session; that capability is pre-existing and outside this task's
 * reach to remove, not something a support session grants or revokes. The
 * true, narrower claim this screen can actually stand behind: this session
 * grants no additional write authority into the TARGET TENANT'S OWN
 * operational data — which is the fact `readOnly: true` and the PLATFORM
 * branch's `identity.tenant === null` invariant (both cited above) actually
 * establish.
 *
 * WHICH TENANT THIS SCREEN RENDERS: never `session.tenant` (always `null`
 * for a signed-in PLATFORM identity, and it must stay that way — see
 * `AppShell.tsx#ProductSession.accessSessionId`'s own comment). Resolved
 * instead from `ctx.identity.accessSessionId` (threaded from
 * `ProductSession.accessSessionId`, `useRepository.ts#identityFor`) — the
 * open `access-sessions` row's own `tenantId` names the target, and every
 * read below is scoped to it by hand (`withinScope`'s own PLATFORM branch
 * does not narrow by tenant — a platform identity reads across every
 * tenant through its named access session, by design — so the FILTER here
 * is this screen's job, not the repository's).
 */

interface SupportSessionView {
  readonly accessSession: RowOf<'access-sessions'>
  readonly tenant: RowOf<'tenants'> | undefined
  readonly sites: readonly RowOf<'sites'>[]
}

/**
 * Fix round 1 (coordinator review, Important 7) — two guards added, both a
 * single line: `platformUserId === ctx.actorOfRecord` (this session belongs
 * to the identity looking at it — nothing today can hand `accessSessionId` a
 * foreign or forged id, since it only ever lands from this identity's own
 * successful `openSupportSession` call, but this is the one place a forged
 * or wrong id would actually be caught, and a session record is exactly the
 * kind of row where "trust the id, it can only ever be ours" is the wrong
 * default) and `readOnly === true` (this screen exists to render a
 * READ-ONLY session; a row that somehow was not one is not this screen's to
 * render as though it were).
 */
function selectSupportSessionView(repository: Repository, ctx: AccessContext): SupportSessionView | null {
  const accessSessionId = ctx.identity.accessSessionId
  if (accessSessionId === null) return null
  const accessSession = repository.get('access-sessions', accessSessionId, ctx)
  if (
    accessSession === undefined ||
    accessSession.closedAt !== null ||
    accessSession.platformUserId !== ctx.actorOfRecord ||
    !accessSession.readOnly
  ) {
    return null
  }
  const tenant = repository.get('tenants', accessSession.tenantId, ctx)
  const sites = repository.list('sites', ctx).where((s) => s.tenantId === accessSession.tenantId).all()
  return { accessSession, tenant, sites }
}

function formatTimestamp(iso: string): string {
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString()
}

export function SupportSessionScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <SupportSessionConsole session={session} />}
    </RequireSession>
  )
}

function SupportSessionConsole({ session }: { readonly session: ProductSession }) {
  const router = useRouter()
  const store = useStore()
  const { closeSupportSession } = useProductSession()
  const rawView = useRepositoryQuery(selectSupportSessionView)
  const [closing, setClosing] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)

  // Fix round 1 (coordinator review, Important 3) — the two-hour time box
  // was written (`expiresAt`) but never read: this screen kept rendering
  // tenant data, and the "Ends by …" banner kept reading as a still-live
  // promise, forever past expiry. Matches `OverviewScreen.tsx`'s own
  // established contract for `useRepositoryQuery`: the simulated-clock
  // comparison happens HERE, in plain render code, after the pure
  // `(repository, ctx)` selector returns — never inside the selector itself,
  // so `store.clock.now()` is never a hidden input the query cache could
  // serve stale.
  const nowMs = store.clock.now()
  const view = rawView !== null && Date.parse(rawView.accessSession.expiresAt) > nowMs ? rawView : null

  async function handleClose() {
    setCloseError(null)
    setClosing(true)
    const result = await closeSupportSession()
    setClosing(false)
    if (result.kind === 'closed') {
      router.push('/super-admin/support-access/')
      return
    }
    if (result.kind === 'denied' || result.kind === 'persistence-unavailable') {
      setCloseError(result.explain)
    } else {
      setCloseError('No support session is open to close.')
    }
  }

  if (view === null) {
    return (
      <AppShell surface="SURF-DOH" session={session} title="No support session is open">
        <p data-control-id="support-session-none" className={`text-sm ${textColor('ink-muted')}`}>
          There is no open support session for {session.identity} to view. Open one from{' '}
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            Support Access
          </Link>
          {' '}in the Super Admin platform console.
        </p>
      </AppShell>
    )
  }

  const { accessSession, tenant, sites } = view
  const expiresAt = formatTimestamp(accessSession.expiresAt)

  return (
    <AppShell
      surface="SURF-DOH"
      session={session}
      title={`Read-only support session — ${tenant?.name ?? accessSession.tenantId}`}
    >
      <div
        data-control-id="support-session-banner"
        role="status"
        className={`rounded-[var(--radius-surface)] border ${borderColor('border-strong')} ${bg('sunken')} p-4`}
      >
        <p className="text-sm font-medium">
          Platform support is viewing this workspace, read-only. Engineer {session.identity}. Ends by{' '}
          {expiresAt}.
        </p>
        <p className={`mt-1 text-xs ${textColor('ink-subtle')}`}>
          This session grants no write authority into this tenant&apos;s own operational data. No
          create, edit or archive control is offered anywhere on this screen — not a disabled one,
          because none exists for a support session to enable.
        </p>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Session</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">Reason and ticket</dt>
            <dd className={textColor('ink-muted')}>{accessSession.purpose}</dd>
          </div>
          <div>
            <dt className="font-medium">Opened</dt>
            <dd className={textColor('ink-muted')}>{formatTimestamp(accessSession.openedAt)}</dd>
          </div>
          <div>
            <dt className="font-medium">Expires</dt>
            <dd className={textColor('ink-muted')}>{expiresAt}</dd>
          </div>
          <div>
            <dt className="font-medium">Session id</dt>
            <dd className={textColor('ink-muted')}>{accessSession.id}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Tenant</h2>
        {tenant === undefined ? (
          <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
            The tenant named by this session could not be read.
          </p>
        ) : (
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Name</dt>
              <dd className={textColor('ink-muted')}>{tenant.name}</dd>
            </div>
            <div>
              <dt className="font-medium">Lifecycle</dt>
              <dd>
                <StatusPill tone="info" icon="•" label={tenant.lifecycle} />
              </dd>
            </div>
            <div>
              <dt className="font-medium">Tier</dt>
              <dd className={textColor('ink-muted')}>{tenant.tier}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Sites</h2>
        <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
          Read through the session, exactly as this tenant&apos;s own users would see the list — no
          create, edit or archive control is offered here.
        </p>
        {sites.length === 0 ? (
          <p className={`mt-2 text-sm ${textColor('ink-muted')}`}>No sites are recorded for this tenant.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {sites.map((s) => (
              <li key={s.id} className={textColor('ink-muted')}>
                {s.name} <span className={`text-xs ${textColor('ink-subtle')}`}>({s.status})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <button
          type="button"
          data-control-id="support-session-close"
          disabled={closing}
          onClick={() => void handleClose()}
          className={`${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50`}
        >
          {closing ? 'Closing…' : 'Close this session and return to the Super Admin console'}
        </button>
        {closeError !== null ? (
          <p data-control-id="support-session-close-error" className={`mt-2 text-sm ${textColor('ink-muted')}`}>
            {closeError}
          </p>
        ) : null}
      </section>
    </AppShell>
  )
}
