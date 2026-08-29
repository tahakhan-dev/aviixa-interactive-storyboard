'use client'

import { useMemo, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { surfaceById, type SurfaceId } from '@/domain/surfaces'
import type { RoleId } from '@/domain/roles'
import type { TenantId } from '@/domain/ids'
import type { BreadcrumbItem } from '@/ui/primitives'
import { dohModulesReachedBy } from '@/surfaces/doh/modules'
import { SA_BANDS, modulesInBand } from '@/surfaces/sa/modules'
import { CC_MODULE_SPINE } from '@/surfaces/cc/modules'
import { isCcExcludedRole } from '@/surfaces/cc/access'
import { STU_MODULES, stuModulesReachedBy, type StudioPersonaId } from '@/studio/modules'
import { FL_DESTINATIONS, frontlinePathname } from '@/frontline/screens'
import { Nav, type NavGroup, type NavLayout } from './Nav'
import { PageHeader } from './PageHeader'
import { bg, textColor, type DensityToken } from './tokens'
import { useProductSession } from './runtime'

/**
 * Fix round 1 (task-17-review.md, Critical). Master prompt §29.4 / §4 / §21.2:
 * a reader must never mistake a simulated screen for a live system, and
 * every screen carries a not-real statement in its own rendered text —
 * `tests/coverage/rendered-disclosure.test.ts` walks the WHOLE static
 * export and checks for it. `src/ui/sa/PrototypeDisclosure.tsx` is the
 * existing, spec-quoted copy of this sentence (reused verbatim here so the
 * wording never drifts screen to screen — its own header comment states
 * the same reason) but is styled on the legacy `--color-ink-subtle` token,
 * which Task 9's own primitive inventory found NOT dark-mode aware under
 * this shell; `src/ui/product/**` may only style against `tokens.ts` (see
 * `DataTable.tsx`'s header for why), so the text is reused, the markup is
 * not. Centralised HERE, once, rather than in every `AppShell` caller, so
 * every screen this shell has ever hosted or will host carries it without
 * being asked to remember to.
 */
/**
 * Exported (Task 2, unit-01): the sign-in screen renders outside `AppShell`
 * entirely (there is no session yet to build a shell around), but the brief
 * requires it carry the SAME sentence, never a second wording — this is
 * that one constant, reused rather than redeclared.
 *
 * THE SECOND SENTENCE (unit-01 final whole-branch review, must-fix from
 * triage). Writes on these screens DO reach IndexedDB — one transaction per
 * committed write, `src/data/repository.ts` — but `boot()` never reads that
 * store back and `Repository.reset()` has no caller, so the persistence is
 * write-only: a reload silently returns everything to the seed. Rehydration
 * is a later task's work and is deliberately not built here. The SILENCE was
 * the defect: master prompt §29.4 forbids letting a reader believe a
 * capability that is only simulated, and nothing on screen said a reload
 * discards what they just did. It says so now, in the one sentence every
 * screen carrying this disclosure already renders.
 *
 * This makes `NOT_REAL_TEXT` a strict SUPERSET of
 * `src/ui/sa/PrototypeDisclosure.tsx`'s copy rather than a verbatim twin.
 * The shared first sentence is still byte-identical, so the wording that
 * both trees make the same claim in has not drifted; what is added is a
 * second claim that is true of THIS shell's runtime and of no screen the
 * other component hosts.
 */
export const NOT_REAL_TEXT =
  'Simulated behaviour only. This screen is part of a client-validation storyboard: every state shown is seeded fixture data the user steps through, not a computed transition against a connected production system. Anything you change here lives only in this browser tab: reloading the page returns the storyboard to its seeded state, and nothing you do is kept for a later visit.'

function NotRealDisclosure() {
  return <p className={`mt-3 max-w-prose text-xs ${textColor('ink-subtle')}`}>{NOT_REAL_TEXT}</p>
}

/**
 * Fix round 1 (unit-01, Task 10 review, CRITICAL 2) — master prompt §7.7
 * requires every role journey to run login-to-logout; this unit shipped
 * nine screens and a real sign-in with no way to end a session. This is
 * that door: real product chrome, not a reviewer/tour convenience, present
 * on every screen this shell hosts. `signOut()` only clears
 * `ProductSessionContext`'s own state — it never touches the repository
 * (`ProductRuntime.tsx#signOut`), the same real-but-inert-on-business-data
 * shape `RoleSimulator`'s own header claims for a persona switch.
 *
 * FIX ROUND 2 (unit-01, Task 10 re-review, IMPORTANT 2) — round 1's own
 * comment CLAIMED the static reviewer/dashboard callers
 * (`app/coverage/**`, `app/workflows/**`, which pass `session={{ ...,
 * identityId: null }}` — see `ProductSession.identityId`'s own comment for
 * why) would render nothing here. That was false: reading the LIVE
 * session through `useProductSession()` alone means a genuinely signed-in
 * reviewer (which any tour or a reviewer's own click leaves them)
 * visiting one of those routes saw "Signed in as <real identity>" drawn
 * over a nav/chrome built by `chromeFor` from the PASSED-IN synthetic
 * `role: 'ADMIN'` — two identities on one shell, worse than none, and
 * clicking Sign out there cleared the real session without changing
 * anything else on a page that never read it. Fixed by trusting the
 * PASSED PROP over the live context for the one question it alone can
 * answer honestly — "does this AppShell instance represent a real,
 * signed-in account at all" — the exact same `identityId !== null` signal
 * `useRepository.ts#useAccessContext`'s own `identityFor` already treats
 * as "no session" for a null `identityId`. A real, `RequireSession`-gated
 * screen's own prop always carries the live session's real `identityId`
 * (`session.ts#sessionFor` sets it from the signed-in `users` row, never
 * null), so this changes nothing for any of the nine real screens — it
 * only suppresses the three synthetic-session dashboards, which is
 * exactly the set that needed suppressing.
 */
function SessionStatus({ session: passedSession }: { readonly session: ProductSession }) {
  const { session: liveSession, signOut } = useProductSession()
  if (passedSession.identityId === null || liveSession === null) return null
  return (
    <div className={`flex items-center justify-end gap-2 pb-2 text-xs ${textColor('ink-muted')}`}>
      <span>Signed in as {liveSession.identity}</span>
      <button
        type="button"
        data-control-id="app-shell-sign-out"
        onClick={() => signOut()}
        className={`underline ${textColor('ink')}`}
      >
        Sign out
      </button>
    </div>
  )
}

/** Identity, role, scope, tenant, device — the shell's one read of "who is
 *  looking at this and on what". Nothing here is a live scenario read: it is
 *  the caller's own controlled state, exactly as `role`/`tenantState` are
 *  controlled props on `HubShell` today. */
export interface ProductSession {
  /** Display name — rendered ("Signed in as {identity}"), never an actor-attribution key. */
  readonly identity: string
  /**
   * Fix round 2 (unit-01, Task 7 re-review, IMPORTANT 4) — the signed-in
   * `users` row's own id (`USR-...`), carried alongside `identity` (the
   * display name) specifically so `useRepository.ts#useAccessContext` can
   * set `AccessContext.actorOfRecord` to a real, resolvable account id
   * instead of a display name. Every seeded `events.actorId`/`audit.actorId`
   * carries a `USR-*` id (`@/data/schemas/crosscutting`'s own `RELATIONS`
   * declare `events.actorId → users` and `audit.actorId → users`); a
   * display name in that field cannot be resolved back to the account that
   * acted, which is exactly the defect this field closes at its root
   * rather than at each write site that discovers it.
   *
   * `string | null` (fix round 3, unit-01, Task 7 re-review, MINOR) — a
   * handful of static reviewer/dashboard sessions (`app/coverage/**`,
   * `app/workflows/**`) construct a `ProductSession` for a persona that is
   * not a signed-in `users` row at all; those pass `null` rather than a
   * string this field's own contract says must resolve to a real account.
   * `useAccessContext` already treats a `null` `identityId` the same way
   * it treats no session at all (`actorOfRecord: null`), and none of those
   * four screens write, so this was inert either way — but `null` says so
   * honestly, where a placeholder string invited the exact defect this
   * field exists to close, one write away.
   */
  readonly identityId: string | null
  readonly role: RoleId
  readonly tenant: TenantId | null
  readonly scope?: { readonly sites?: readonly string[]; readonly areas?: readonly string[] }
  readonly device: 'desktop' | 'tablet' | 'kiosk'
  /**
   * Task 2 fix round 1 (unit-01, review IMPORTANT 1): true only for a
   * session landed through `session.ts#resolveStepUpCompletion` — the
   * root's own step-up acknowledgement. `useRepository.ts#identityFor`
   * threads this into `IdentitySimulationState.stepUpActive` so
   * `useAccessContext()` reports it truthfully; a later task gates a
   * Root-only action on exactly this flag. Every other sign-in leaves it
   * `undefined` (read as `false`).
   */
  readonly stepUpActive?: boolean
}

export interface AppShellProps {
  readonly surface: SurfaceId
  readonly session: ProductSession
  /**
   * DEVIATION FROM THE BRIEF'S ILLUSTRATIVE INTERFACE SNIPPET, same shape as
   * `ButtonProps.variant` in `src/ui/primitives/Button.tsx`'s own doc
   * comment: the brief's `AppShellProps` lists only `surface`, `session` and
   * `children`, but the brief's own prose requires `AppShell` to compose
   * `PageHeader` — "breadcrumb, one h1, primary actions slot" — and none of
   * that content is derivable from a surface id alone. All three are
   * optional and default to the surface's own name, the same fallback
   * `SaConsoleShell`/`HubShell`/`StudioShell` already use before a page
   * supplies a module.
   */
  readonly title?: string
  readonly breadcrumbs?: readonly BreadcrumbItem[]
  readonly actions?: ReactNode
  readonly children: ReactNode
}

interface SurfaceChrome {
  readonly layout: NavLayout
  readonly density: DensityToken
  readonly groups: readonly NavGroup[]
}

/**
 * `ProductSession` carries a `RoleId`, and Studio's own reach table is keyed
 * on a finer `StudioPersonaId` — three of its eight personas (the two
 * Supervisor columns and the Plant Manager persona) all resolve to the same
 * `SUPERVISOR` role (`STU_PERSONAS[*].deliveredByRole` in
 * `@/studio/modules`), a distinction `ProductSession` does not carry. The
 * source does not settle which of the two a bare Supervisor session gets, so
 * this is a client-delegated choice under the same standing authority as
 * every other undecided reading this build has made (§2) — and it is
 * decided NARROW, not the fuller-access default this file shipped with in
 * review round 1.
 *
 * FIX ROUND 1: reversed from `supervisor-with-authoring-grant`. The two
 * failure modes are not symmetric. Too little access shows a reviewer a
 * module missing that should be there — noticed, questioned, caught. Too
 * much shows a module present that a real Supervisor without the authoring
 * grant would never see — it LOOKS correct and is not, which is the one
 * that misleads a client using this shell to confirm what each role can
 * reach. `supervisor-without-grant`'s own `accessNote` in `@/studio/modules`
 * is read-only reference access to published content only, no drafts or
 * in-review versions — a proper subset of what the authoring-grant persona
 * reaches, never a wider one, so this default can only under-show, never
 * over-show. A later task threading the authoring grant through
 * `ProductSession` can resolve this exactly instead of defaulting it.
 *
 * `null` for a platform-domain role, which never reaches SURF-STU at all
 * (`@/domain/roles`, `reachableSurfaces`).
 */
function studioPersonaFor(role: RoleId): StudioPersonaId | null {
  switch (role) {
    case 'TENANT_ADMIN':
      return 'tenant-admin'
    case 'SUPERVISOR':
      return 'supervisor-without-grant'
    case 'QUALITY_MANAGER':
      return 'quality-manager'
    case 'READONLY_AUDITOR':
      return 'read-only-auditor'
    case 'WORKER':
      return 'worker'
    default:
      return null
  }
}

/**
 * THE ONE PLACE THIS SHELL DECIDES NAVIGATION, per surface, over the same
 * reach maps the old per-surface shells read (`@/surfaces/doh/modules`,
 * `@/surfaces/sa/modules`, `@/surfaces/cc/modules` + `access`,
 * `@/studio/modules`, `@/frontline/screens`) — never a second permission
 * check invented here, and never a route offered a role's own reach map
 * withholds. `src/ui/**` holds no policy; this file is under
 * `src/ui/product/**` and reads only PRE-DERIVED reach, exactly as
 * `HubShell`/`StudioShell` already do.
 */
function chromeFor(surface: SurfaceId, role: RoleId, pathname: string): SurfaceChrome {
  switch (surface) {
    case 'SURF-SA': {
      // D16: module-level `rolesAllowed` is authoritative nowhere in the
      // source: every one of the four platform roles reaches every module
      // route; per-control gating happens inside the screen, not the rail.
      const groups: NavGroup[] = SA_BANDS.map((band) => ({
        id: band.id,
        label: band.name,
        items: modulesInBand(band.id).map((m) => {
          const href = `/super-admin/${m.slug}/`
          return { id: m.id, label: m.name, href, current: pathname.startsWith(href) }
        }),
      }))
      return { layout: 'rail', density: 'comfortable', groups }
    }
    case 'SURF-DOH': {
      const modules = dohModulesReachedBy(role)
      const groups: NavGroup[] = [
        {
          id: 'doh-modules',
          items: modules.map((m) => {
            const href = `/hub/${m.slug}/`
            return { id: m.id, label: m.name, href, current: pathname.startsWith(href) }
          }),
        },
      ]
      return { layout: 'rail', density: 'comfortable', groups }
    }
    case 'SURF-STU': {
      const persona = studioPersonaFor(role)
      const modules = persona === null ? [] : stuModulesReachedBy(STU_MODULES, persona)
      const groups: NavGroup[] = [
        {
          id: 'stu-modules',
          items: modules.flatMap((m) => {
            if (m.slug === null) return []
            const href = `/studio/${m.slug}/`
            return [{ id: m.id, label: m.name, href, current: pathname.startsWith(href) }]
          }),
        },
      ]
      return { layout: 'rail', density: 'compact', groups }
    }
    case 'SURF-CC': {
      // AC-SCR-CC-001: the Read-only Auditor and the Worker are excluded at
      // the surface boundary, not cell by cell — `isCcExcludedRole` is the
      // same door `evaluateCCAccess` checks first.
      const excluded = isCcExcludedRole(role)
      const groups: NavGroup[] = [
        {
          id: 'cc-modules',
          items: excluded
            ? []
            : CC_MODULE_SPINE.flatMap((m) => {
                if (m.slug === null) return []
                const href = `/command-center/${m.slug}/`
                return [{ id: m.id, label: m.name, href, current: pathname.startsWith(href) }]
              }),
        },
      ]
      return { layout: 'bar', density: 'compact', groups }
    }
    case 'SURF-FL': {
      // Only the Worker holds SURF-FL in `reachableSurfaces` (@/domain/roles).
      // `sign-in` is filtered out: it is the pre-authenticated entry gate,
      // never a destination a signed-in worker taps to revisit.
      const reaches = role === 'WORKER'
      const groups: NavGroup[] = [
        {
          id: 'fl-destinations',
          items: !reaches
            ? []
            : FL_DESTINATIONS.filter((d) => d.slug !== 'sign-in').map((d) => {
                const href = `${frontlinePathname(d.slug)}/`
                return { id: d.slug, label: d.name, href, current: pathname.startsWith(href) }
              }),
        },
      ]
      return { layout: 'tabbar', density: 'spacious', groups }
    }
    default: {
      const exhaustive: never = surface
      throw new Error(`AppShell: unknown surface ${String(exhaustive)}`)
    }
  }
}

/**
 * The shell every product screen renders under, hosting `Nav` (role-derived,
 * above) and `PageHeader` (breadcrumb, one `h1`, actions slot) around
 * `children` — and nothing else. Demo chrome is mounted by the route layout
 * OUTSIDE this component; `src/ui/product/**` cannot import
 * `src/ui/demo/**` at all (enforced by `local/no-cross-tree-import`), so
 * there is no way for it to sneak in here even by accident.
 *
 * FIVE SURFACES, THREE STRUCTURAL SHAPES, DELIBERATELY NOT FIVE. `rail`
 * (Super Admin, Hub, Studio) is a collapsing left sidebar; `bar` (Command
 * Center) is a collapsing horizontal strip across the top, giving the
 * monitoring cockpit full-width content below it; `tabbar` (Frontline) is a
 * persistent full-width row of large targets and never collapses into a
 * drawer at all — a gloved-hands floor tablet is narrow-first by
 * construction (master prompt: "a full-screen, shallow, large-target
 * surface, not a desktop page shrunk"), and a slide-out drawer over a bottom
 * tab bar would be the desktop pattern shrunk back onto it. Density and
 * touch-target size (`--density-spacious-control-min`, 60px — task 13 fix
 * round 1, frozen source `AVIIXA_Production_Product_Blueprint.md` L106276,
 * `DEC-NFR-007`: "Minimum 11 millimetres square for any control a gloved
 * worker uses in the run player", Required) carry Frontline's
 * distinctiveness where the layout shape is shared with no other surface
 * anyway.
 *
 * FIX ROUND 1, ITEM 3: every `<main>` below carries `textColor('ink')` as a
 * default. `color` inherits in CSS, so this is not decoration on the
 * landmark — it is the one place that keeps a future migrated screen's
 * UNSTYLED content (a bare `<p>`, a bare `<td>`, anything with no explicit
 * colour class) legible against the new dark `--sunken` shell background.
 * Without it, such content falls back to the browser's own default text
 * colour (effectively black), which is illegible on a dark background and
 * would have looked like a fresh bug in each of the next twelve migration
 * tasks rather than the one place it actually needed fixing. Explicit
 * colour classes elsewhere (the `h1`, the breadcrumb, a real screen's own
 * styled content) simply override this default at the point they're set —
 * inheritance never fights a more specific rule.
 */
export function AppShell({ surface, session, title, breadcrumbs, actions, children }: AppShellProps) {
  const pathname = usePathname()
  const surfaceDef = surfaceById(surface)
  const chrome = useMemo(
    () => chromeFor(surface, session.role, pathname ?? ''),
    [surface, session.role, pathname],
  )
  const resolvedTitle = title ?? surfaceDef.name
  const resolvedBreadcrumbs = breadcrumbs ?? [{ label: surfaceDef.name }]
  const navLabel = `${surfaceDef.name} navigation`

  if (chrome.layout === 'tabbar') {
    return (
      <div className={`flex min-h-dvh flex-col ${bg('sunken')}`} data-surface={surface}>
        <main id="main" className={`flex-1 px-4 py-4 pb-24 ${textColor('ink')}`}>
          <SessionStatus session={session} />
          <PageHeader breadcrumbs={resolvedBreadcrumbs} title={resolvedTitle} actions={actions} />
          <NotRealDisclosure />
          <div className="mt-4">{children}</div>
        </main>
        <Nav ariaLabel={navLabel} groups={chrome.groups} layout={chrome.layout} density={chrome.density} />
      </div>
    )
  }

  if (chrome.layout === 'bar') {
    return (
      <div className={`flex min-h-dvh flex-col ${bg('sunken')}`} data-surface={surface}>
        <Nav ariaLabel={navLabel} groups={chrome.groups} layout={chrome.layout} density={chrome.density} />
        <main id="main" className={`flex-1 px-6 py-6 ${textColor('ink')}`}>
          <SessionStatus session={session} />
          <PageHeader breadcrumbs={resolvedBreadcrumbs} title={resolvedTitle} actions={actions} />
          <NotRealDisclosure />
          <div className="mt-4">{children}</div>
        </main>
      </div>
    )
  }

  return (
    // `flex-col md:flex-row`, not a bare `flex` — `Nav`'s three top-level
    // siblings (persistent rail, narrow-width toggle bar, drawer wrapper)
    // become direct flex items of THIS container (a fragment hoists its
    // children into the parent), so a row-direction parent below `md`
    // placed the toggle bar beside `main` as a narrow column instead of a
    // full-width bar above it — caught live in Chrome at 360px, not by
    // reading the JSX. Stacking below `md` fixes it without `Nav` needing
    // to know its parent's direction.
    <div className={`flex min-h-dvh flex-col md:flex-row ${bg('sunken')}`} data-surface={surface}>
      <Nav ariaLabel={navLabel} groups={chrome.groups} layout={chrome.layout} density={chrome.density} />
      <main id="main" className={`flex-1 px-6 py-6 ${textColor('ink')}`}>
        <SessionStatus session={session} />
        <PageHeader breadcrumbs={resolvedBreadcrumbs} title={resolvedTitle} actions={actions} />
        <NotRealDisclosure />
        <div className="mt-4">{children}</div>
      </main>
    </div>
  )
}
