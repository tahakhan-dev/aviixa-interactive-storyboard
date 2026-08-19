'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { surfaceById } from '@/domain/surfaces'
import { routeBySurface } from '@/routes/definitions'
import { roleById, type RoleId } from '@/domain/roles'
import {
  DOH_MODULES,
  DOH_OUT_OF_SLICE_MODULES,
  type DohModuleDefinition,
  type DohModuleId,
} from '@/surfaces/doh/modules'
import { DOH_SCREENS } from '@/surfaces/doh/screens'
import { TENANT_WRITE_CLASSES, type TenantState } from '@/surfaces/doh/tenant-state'
import { HubChrome } from '@/ui/doh/HubChrome'
import { PrototypeDisclosure } from '@/ui/sa/PrototypeDisclosure'
import { Breadcrumbs, LiveRegion, Select, StatusPill, type StatusTone } from '@/ui/primitives'
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

const WRITE_CLASS_NOTE = new Map(TENANT_WRITE_CLASSES.map((row) => [row.state, row.note]))

/** Never a bare identifier in the interface (`RouteDefinition.title`'s rule,
 *  `src/routes/definitions.ts`). The token stays the data; this is the label. */
const TENANT_STATE_LABEL: Record<TenantState, string> = {
  active: 'Active',
  'soft-suspended': 'Suspended — billing (soft)',
  'hard-suspended': 'Suspended — read-only (hard)',
  'compliance-suspended': 'Suspended — compliance',
  archived: 'Closed — archived',
}

const TENANT_STATE_TONE: Record<TenantState, StatusTone> = {
  active: 'ok',
  'soft-suspended': 'attention',
  'hard-suspended': 'attention',
  'compliance-suspended': 'blocked',
  archived: 'neutral',
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
 * - No `module`: the module index. The eight slice-4 modules link by slug;
 *   the other eleven render as NOT IN THIS SLICE, each naming the slice that
 *   owns it, so name-matching cannot quietly pull one back in.
 * - `module` supplied: that module's own header (name, module id and its
 *   `SCR-DOH-NN` annotation, purpose, breadcrumb back to `/hub/`) wrapping
 *   `children`. Tasks 3-10 code against this.
 *
 * STATE OWNERSHIP, which the eight module screens inherit: `role` and
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
export interface HubShellProps {
  readonly module?: DohModuleDefinition
  /** Which seeded persona's view renders. Owned by the calling screen. */
  readonly role?: TenantRoleId
  readonly onRoleChange?: (role: TenantRoleId) => void
  /** Read before any write control renders (S2). Defaults to `active`. */
  readonly tenantState?: TenantState
  readonly children?: ReactNode
}

export function HubShell({
  module,
  role,
  onRoleChange,
  tenantState = 'active',
  children,
}: HubShellProps) {
  // Index-only fallback: on a module route the screen above owns this.
  const [ownRole, setOwnRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [supportSessionEnded, setSupportSessionEnded] = useState(false)

  const activeRole = role ?? ownRole
  const setRole = onRoleChange ?? setOwnRole

  const banners = seededHubBanners({
    tenantState,
    supportSessionEnded,
    onEndSession: () => setSupportSessionEnded(true),
  })

  // D11, read out of the route registry rather than re-asserted here.
  const notAHubUser = !HUB_ROUTE.allowedRoles.includes(activeRole)
  const hubRoleNames = HUB_ROUTE.allowedRoles.map((r) => roleById(r).name).join(', ')

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>

      {/* The rail is navigation: it renders on a module route only, and never
          for a persona that reaches no Hub screen (D11). Both conditions live
          in `HubChrome` itself — the shell just tells it the persona. */}
      <HubChrome
        banners={banners}
        role={activeRole}
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
              {WRITE_CLASS_NOTE.get(tenantState) ?? ''}
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
              One access class is seeded open here, the normal support session, and End session on
              it is live: any signed-in tenant web user may press it, because the control belongs to
              the tenant (D12). The compliance-emergency path and the JBS access grant carry no
              End-session control at all — by construction, not by configuration, since the banner
              type has no such field on those two arms, so there is nothing to disable (D13). All
              three classes are exercised on the Tenant View of Platform Administration screen,
              which this slice builds later.
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
        ) : module !== undefined ? (
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

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Not in this slice</h2>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                The other eleven of this surface&apos;s {SURFACE.canonicalModuleCount} canonical
                modules. They are listed rather than dropped, so nothing here is mistaken for
                missing work, and each names the slice that owns it. None is reachable from this
                build.
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
          </>
        )}
      </HubChrome>
    </main>
  )
}
