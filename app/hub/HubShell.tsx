'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { surfaceById } from '@/domain/surfaces'
import { routeBySurface } from '@/routes/definitions'
import { roleById, type RoleId } from '@/domain/roles'
import {
  DOH_MODULES,
  DOH_OUT_OF_SLICE_MODULES,
  dohModulesReachedBy,
  type DohModuleDefinition,
  type DohModuleId,
} from '@/surfaces/doh/modules'
import { DOH_SCREENS } from '@/surfaces/doh/screens'
import {
  writeAllowed,
  writeClassNote,
  type TenantState,
  type WriteAction,
} from '@/surfaces/doh/tenant-state'
import { HubChrome } from '@/ui/doh/HubChrome'
import {
  TENANT_STATE_LABEL,
  TENANT_STATE_TONE,
} from '@/ui/doh/tenant-state-vocabulary'
import { PrototypeDisclosure } from '@/ui/sa/PrototypeDisclosure'
import { Breadcrumbs, LiveRegion, Select, StatusPill } from '@/ui/primitives'
import { seededHubBanners } from './banner-fixtures'

const SURFACE = surfaceById('SURF-DOH')

/**
 * The route registry is the ONE place that says which roles reach this
 * surface, and it does not list the Worker. D11 is therefore read out of
 * data here rather than re-asserted as a conditional in the shell.
 */
const HUB_ROUTE = routeBySurface('SURF-DOH')

/**
 * The five fixed tenant roles, in registry order. Declared as a tuple so the
 * shell's `role` prop is narrowed to the tenant security domain — a console
 * role can never be handed to a Hub screen. `tests/component/doh-shell.test.tsx`
 * asserts this list equals `rolesInDomain('TENANT')`, so it cannot drift from
 * the registry unnoticed.
 */
const TENANT_ROLE_IDS = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly RoleId[]

export type TenantRoleId = (typeof TENANT_ROLE_IDS)[number]

const ROLE_OPTIONS = TENANT_ROLE_IDS.map((id) => ({ value: id, label: roleById(id).name }))

function isTenantRole(value: string): value is TenantRoleId {
  return TENANT_ROLE_IDS.some((id) => id === value)
}

/**
 * THE WRITE CLASS ENDING A PLATFORM SUPPORT SESSION IS GATED ON, and the ONE
 * definition of it. The write-class enumerations name no End-session class at
 * all; the act's one required write is its AUDIT ENTRY, because terminating a
 * session is itself an audited act, and `write-audit` is a class the one table
 * already names. So this is a LOOKUP in that table rather than a new row in it.
 *
 * Exported because the route that owns the session composes its own refusal on
 * top of this one (a lost connection, a session already ended). Two copies of
 * this mapping would be two things to drift.
 */
export const END_SESSION_WRITE_CLASS: WriteAction = 'write-audit'

/**
 * Why the End-session control cannot act in this tenant state, or `null`.
 *
 * COMPUTED HERE BECAUSE THE BANNER IS CHROME ON EVERY HUB ROUTE AND THE GATE IS
 * ONE. `src/ui/**` holds no policy, so `BannerRegion` cannot ask the write-class
 * table anything and must be handed a reason; this file is in `app/`, already
 * holds the tenant state, already assembles the banners, and every Hub route
 * wraps it. Computing it once here gates the control on all of them without a
 * single module screen changing. The alternative — each screen computing a
 * reason and passing it down — puts one session's gate in nine files.
 *
 * The consequence is right in both directions. Open under soft and hard
 * suspension, which is what "at any time" requires of this control. Closed
 * under compliance suspension and after archival, where it is not a restriction
 * at all: no user is signed in to press it.
 */
export function endSessionRefusalFor(tenantState: TenantState): string | null {
  if (writeAllowed(tenantState, END_SESSION_WRITE_CLASS)) return null
  return (
    `Blocked while this workspace is ${tenantState}. ${writeClassNote(tenantState)} ` +
    'Ending a session is itself an audited act, and this state closes the audit write it needs — ' +
    'under a compliance suspension that is not a restriction at all, because sign-in is blocked ' +
    'for everyone and nobody is here to press it. The session’s own platform-side time box still ' +
    'bounds it, and it expires regardless of anything this workspace can or cannot do.'
  )
}

/** D1: catalogue-B screen ids are annotations on a module, never route keys. */
function screenAnnotation(moduleId: DohModuleId): string {
  return DOH_SCREENS.filter((s) => s.moduleId === moduleId)
    .map((s) => s.id)
    .join(' · ')
}

/**
 * The shell every Hub route renders under. Two modes, selected by whether
 * `module` is supplied — the same shape `SaConsoleShell` uses on `SURF-SA`:
 *
 * - No `module`: the module index. Every row of `DOH_MODULES` links by slug;
 *   every row of `DOH_OUT_OF_SLICE_MODULES` renders as NOT IN THIS SLICE,
 *   each naming the slice that owns it, so name-matching cannot quietly pull
 *   one back in. Both lists are READ and never counted in prose: this
 *   sentence used to say "the eight slice-4 modules" and "the other eleven",
 *   and slice 6 moved seven rows from the second register to the first in a
 *   single edit, falsifying both numbers at once.
 * - `module` supplied: that module's own header (name, module id and its
 *   `SCR-DOH-NN` annotation, purpose, breadcrumb back to `/hub/`) wrapping
 *   `children`. Tasks 3-10 code against this.
 *
 * STATE OWNERSHIP, which every module screen inherits: `role` and
 * `tenantState` are controlled props owned by the calling screen's own
 * `useState`, matching the nineteen slice-3 screens. The shell falls back to
 * local state for `role` only on the index, where there is no calling screen.
 * So a module screen stays independently testable — render it, drive its own
 * state, no provider.
 *
 * The shell does hold ONE piece of state of its own: whether the reviewer has
 * pressed End session, which decides whether the seeded support-session banner
 * is still bannered. It is chrome state, not simulation state a screen drives:
 * no module screen reads it, none needs to, and it resets with the shell. If a
 * later module needs to own that session, it becomes a controlled prop like
 * the two above — do not mirror it into a screen's state.
 */
/**
 * A route that owns NO module: an uncatalogued screen group, whose identifier
 * appears in neither screen catalogue and which no module id may claim.
 *
 * Without this, `HubShell` had two modes and neither fitted such a route: with
 * `module` it prints that module's id and marks it current in the rail, which
 * mints ownership the source refuses; without `module` it renders the module
 * index and DROPS `children` entirely. So the device screen could not wrap the
 * shell at all and duplicated its chrome instead. This is the third option —
 * the shell's own header and chrome over a screen that claims no module.
 */
export interface HubShellUncataloguedScreen {
  readonly title: string
  /** Sits where a module's id and `SCR-DOH-NN` annotation would. */
  readonly annotation: string
  readonly purpose: string
}

export interface HubShellProps {
  readonly module?: DohModuleDefinition
  /** For a route that owns no module. Mutually exclusive with `module` in
   *  practice; `module` wins if both are supplied. */
  readonly screen?: HubShellUncataloguedScreen
  /** Which seeded persona's view renders. Owned by the calling screen. */
  readonly role?: TenantRoleId
  readonly onRoleChange?: (role: TenantRoleId) => void
  /** Read before any write control renders (S2). Defaults to `active`. */
  readonly tenantState?: TenantState
  /**
   * THE ROUTE RENDERS THE PLATFORM-SIDE BANNER SLOTS ITSELF, so the chrome
   * carries the suspension slot only.
   *
   * One session must have ONE control, gated ONCE. The chrome's End-session
   * control is unconditionally live by design — `src/ui/**` holds no policy,
   * so `BannerRegion` cannot ask a tenant-state gate anything — and a route
   * that owns the session holds the gate. Without this flag both were drawn:
   * the module's own control disabled with its reason and the chrome's live
   * beside it, which is a write control rendering ungated on a route that had
   * just refused it. The chrome yields to the route that owns the session
   * rather than the other way round, because the gate is policy and policy may
   * not move into `src/ui/`.
   */
  readonly ownsPlatformBanners?: boolean
  readonly children?: ReactNode
}

export function HubShell({
  module,
  screen,
  role,
  onRoleChange,
  tenantState = 'active',
  ownsPlatformBanners = false,
  children,
}: HubShellProps) {
  // Index-only fallback: on a module route the screen above owns this.
  const [ownRole, setOwnRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [supportSessionEnded, setSupportSessionEnded] = useState(false)

  const activeRole = role ?? ownRole
  const setRole = onRoleChange ?? setOwnRole

  // D11, read out of the route registry rather than re-asserted here.
  const notAHubUser = !HUB_ROUTE.allowedRoles.includes(activeRole)
  const hubRoleNames = HUB_ROUTE.allowedRoles.map((r) => roleById(r).name).join(', ')

  /**
   * The shell decides; the chrome draws. Two questions, asked here because
   * `src/ui/` may hold no permission logic at all — "taking a button off the
   * screen does not stop anyone", so a component that answered either of
   * these would be answering something only the enforcement layer may:
   *
   * 1. Does this persona reach SURF-DOH at all? One registry statement, and
   *    it does not list the Worker (D11). A persona that reaches nothing is
   *    offered no chrome — no rail, no banner region, no module content.
   * 2. Which modules does it reach? Each module's own matrix answers that,
   *    carried on the module definition and read by `dohModulesReachedBy`.
   *    A module the matrix marks `Unavailable` renders ABSENT, so the rail
   *    does not offer the route — a Supervisor is not shown a link to a
   *    screen whose own copy says the rail does not offer it.
   */
  const railModules = notAHubUser ? [] : dohModulesReachedBy(activeRole)
  /**
   * The suspension slot is always the chrome's: no route owns a suspension and
   * none carries a control over one. The support-session and announcement
   * slots go to the route that owns them, where one exists — see
   * `ownsPlatformBanners`. Filtered HERE rather than in `banner-fixtures`, so
   * the seeded data stays one unconditional set and the shell keeps the whole
   * decision about what is drawn.
   */
  const endSessionRefusal = endSessionRefusalFor(tenantState)
  const banners = notAHubUser
    ? []
    : seededHubBanners({
        tenantState,
        role: activeRole,
        supportSessionEnded,
        onEndSession: () => setSupportSessionEnded(true),
      })
        .filter((banner) => !ownsPlatformBanners || banner.kind === 'suspension')
        /* THE GATE TRAVELS WITH THE CONTROL. The reason is attached to the
           banner's own data rather than threaded as a prop, so it flows through
           `HubChrome` untouched and no third file learns about it. When the
           tenant state permits the write this is the identity map. */
        .map((banner) =>
          banner.kind === 'support-session' &&
          banner.accessClass === 'normal-support-session' &&
          endSessionRefusal !== null
            ? { ...banner, endSessionDisabledReason: endSessionRefusal }
            : banner,
        )

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>

      {/* The rail is navigation: it renders on a module route only, over the
          modules this persona actually reaches, and not at all for a persona
          that reaches no Hub screen (D11). Every one of those decisions is
          made above; the chrome draws the two lists it is handed. */}
      <HubChrome
        banners={banners}
        modules={railModules}
        {...(module !== undefined ? { activeModuleId: module.id } : {})}
      >
        {notAHubUser ? (
          <h1 className="text-3xl font-semibold">
            Unavailable for the {roleById(activeRole).name} view
          </h1>
        ) : module !== undefined ? (
          <div>
            <Breadcrumbs
              items={[{ label: SURFACE.name, href: '/hub/' }, { label: module.name }]}
            />
            <h1 className="mt-2 text-3xl font-semibold">{module.name}</h1>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              {module.id} · {screenAnnotation(module.id)} — annotations, never route keys; this
              route is keyed on the module slug (D1).
            </p>
            <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{module.purpose}</p>
            <PrototypeDisclosure />
          </div>
        ) : screen !== undefined ? (
          <div>
            <Breadcrumbs
              items={[{ label: SURFACE.name, href: '/hub/' }, { label: screen.title }]}
            />
            <h1 className="mt-2 text-3xl font-semibold">{screen.title}</h1>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{screen.annotation}</p>
            <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{screen.purpose}</p>
            <PrototypeDisclosure />
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold">{SURFACE.name}</h1>
            <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{SURFACE.purpose}</p>
            <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
              <span className="font-medium text-[var(--color-ink)]">
                What this surface owns:{' '}
              </span>
              {SURFACE.ownership}
            </p>
            <PrototypeDisclosure />
          </div>
        )}

        {/* Reviewer chrome, deliberately separated from the product chrome
            above and below it. It is a view switcher over seeded fixtures,
            not a session role context — see the copy inside, which says so on
            screen rather than only here. */}
        <section
          aria-label="Storyboard view switchers"
          className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Reviewer controls — not part of the product
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <Select
              label="View as tenant role"
              value={activeRole}
              options={ROLE_OPTIONS}
              onChange={(value) => {
                if (isTenantRole(value)) setRole(value)
              }}
            />
            <p className="text-sm text-[var(--color-ink-muted)]">
              <span className="font-medium text-[var(--color-ink)]">Tenant state: </span>
              <StatusPill
                tone={TENANT_STATE_TONE[tenantState]}
                icon="●"
                label={TENANT_STATE_LABEL[tenantState]}
              />{' '}
              {writeClassNote(tenantState)}
            </p>
          </div>
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Choosing a persona re-renders this storyboard&apos;s seeded fixtures from that
            person&apos;s point of view. It performs no product action, changes no business state,
            and alters no audit actor. The Hub itself renders no control that changes a signed-in
            user&apos;s own role or session role context (AC-16-12, L20225), and the tenant
            permissions matrix marks that categorically prohibited for all five tenant roles, so it
            renders ABSENT rather than disabled.
          </p>
          {notAHubUser ? null : (
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Two things change with the persona and are meant to. The module rail offers only the
              modules whose own permission matrix gives this persona something — a module marked
              Unavailable renders ABSENT, so the route is not offered rather than offered and then
              refused. And the suspension banner splits on two adjacent rows of the tenant-lifecycle
              matrix (L26886-L26888): the soft and hard suspension banners reach the Tenant Admin
              alone, because no other user sees anything at all in those two states, while the
              compliance-suspension message reaches all five roles, because sign-in is blocked for
              everyone and everyone must be told why. The archived state is covered by neither row;
              it is shown to every persona here and recorded as an open question rather than guessed.
            </p>
          )}
          {notAHubUser || ownsPlatformBanners ? null : (
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              One access class is seeded open here, the normal support session, and End session on
              it is live: any signed-in tenant web user may press it, because the control belongs to
              the tenant (D12). The compliance-emergency path and the JBS access grant carry no
              End-session control at all — by construction, not by configuration, since the banner
              type has no such field on those two arms, so there is nothing to disable (D13). All
              three classes are exercised on the Tenant View of Platform Administration screen,
              which this slice builds later.
            </p>
          )}
          {notAHubUser || !ownsPlatformBanners ? null : (
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              This route owns the platform-side banner slots, so the chrome above carries the
              suspension slot only. The support-session and announcement banners, and the one
              End-session control over that session, are rendered by the screen below — one
              session, one control, gated once. Drawing both would put a live, ungated write
              control beside a refused one.
            </p>
          )}
          <LiveRegion>
            {supportSessionEnded ? (
              <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
                Support session ended in this storyboard. No platform session was terminated — this
                storyboard reaches no platform; the seeded session simply stops being bannered.
              </p>
            ) : null}
          </LiveRegion>
        </section>

        {notAHubUser ? (
          <div
            role="note"
            className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4"
          >
            <p className="max-w-prose text-[var(--color-ink)]">
              The {roleById(activeRole).name} holds no Hub screen. Every Hub route renders
              Unavailable for this persona — no module rail, no banner region, no module content:
              the route registry admits {hubRoleNames}, and no Worker.
            </p>
            <p className="mt-3 max-w-prose text-[var(--color-ink-muted)]">
              What that costs, stated rather than hidden: a worker without a device in hand cannot
              check their own certification expiry. Workers meet their own certification alerts on
              the device instead.
            </p>
            <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-subtle)]">
              D11 — DEC-WKRVIEW-001 is open, and the source names the stake plainly: a Worker web
              view &ldquo;changes the login model&apos;s surface area, the training burden, and the
              attack surface&rdquo; (L23067).
            </p>
            <PrototypeDisclosure />
          </div>
        ) : module !== undefined || screen !== undefined ? (
          <div className="mt-6">{children}</div>
        ) : (
          <>
            <section className="mt-8">
              <h2 className="text-lg font-semibold">In this slice</h2>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                Names are canonical. Module ids and SCR-DOH-NN screen numbers below are annotations;
                every route is keyed on the module slug, never on a screen number (D1).
              </p>
              <ul className="mt-3 space-y-4">
                {DOH_MODULES.map((m) => (
                  <li key={m.id}>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <Link
                        href={`/hub/${m.slug}/`}
                        className="text-[var(--color-primary)] underline"
                      >
                        {m.name}
                      </Link>
                      <span className="text-xs text-[var(--color-ink-subtle)]">{m.id}</span>
                      <span className="text-xs text-[var(--color-ink-subtle)]">
                        {screenAnnotation(m.id)}
                      </span>
                    </div>
                    <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                      {m.purpose}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* "None is reachable from this build" IS AN ABSENCE CLAIM AND IT
                HAS BEEN FALSE ONCE. Wave 2 of slice 10 shipped
                `/hub/notifications` and `/hub/audit-and-retention` while their
                two modules were still rows of this register, so this paragraph
                told every reader of `/hub/` that two modules they could open
                did not exist here. (Neither module is named by id in this file
                on purpose: `scripts/build-registries.mjs` reads `app/hub/` as a
                route of its own and refuses a tie between two module ids
                mentioned equally often on a route no slug claims.) It is not a
                claim this component can check — it is about the whole authored
                tree — so it is MEASURED rather than reviewed:
                `tests/unit/doh-spine.test.ts` scans every authored `app/hub/`
                route for a module id this register names, and carries a
                positive control proving the scan finds one on a routed module.
                Do not reword this sentence without reading that case. */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Not in this slice</h2>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                The other {DOH_OUT_OF_SLICE_MODULES.length} of this surface&apos;s{' '}
                {SURFACE.canonicalModuleCount} canonical modules. They are listed rather than
                dropped, so nothing here is mistaken for missing work, and each names the slice that
                owns it. None is reachable from this build.
              </p>
              <ul className="mt-3 space-y-3">
                {DOH_OUT_OF_SLICE_MODULES.map((m) => (
                  <li key={m.id}>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[var(--color-ink)]">{m.name}</span>
                      <span className="text-xs text-[var(--color-ink-subtle)]">{m.id}</span>
                    </div>
                    <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                      <span className="font-medium text-[var(--color-ink)]">Owner: </span>
                      {m.ownedBy}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* THE ROUTES ON THIS SURFACE THAT CLAIM NO MODULE, LISTED HERE
                BECAUSE OTHERWISE NOTHING LISTS THEM.

                Audit finding R3-06 measured the built export: `/hub/devices/`
                had no inbound link from any page in the whole build, so a
                client could reach it only by typing the URL. It is not in
                either register above and cannot be — its screen identifier
                occurs once in the frozen source and in neither screen
                catalogue, so nothing states which module owns it, and filing
                it among the modules would invent the catalogue row the source
                withholds. Listed separately and labelled instead.

                Deliberately NOT the same treatment as the journeys. The two
                composed walkthroughs (`/hub/journey/` and `/studio/journey/`)
                are linked from `/` under the guided-story mode, which is where
                a reader looking for a walkthrough goes; this is a screen, and
                a screen belongs with its surface. One inbound link each, so
                no route has two entry points. */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold">
                Screens that claim no module{' '}
                <span className="font-normal text-[var(--color-ink-subtle)]">
                  — and for which no module identifier is minted
                </span>
              </h2>
              <ul className="mt-3 space-y-3">
                <li>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Link
                      href="/hub/devices/"
                      className="text-[var(--color-primary)] underline"
                    >
                      Device enrollment
                    </Link>
                  </div>
                  <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                    Enrolling a tablet, binding it to a location, and the device
                    inventory with its last-seen and mode. The frozen source
                    names this screen once and places it in neither screen
                    catalogue, so it states no owning module and no navigation
                    entry point for it either — this entry is a build decision,
                    made so the route is not one only its author can find.
                  </p>
                </li>
              </ul>
            </section>
          </>
        )}
      </HubChrome>
    </main>
  )
}
