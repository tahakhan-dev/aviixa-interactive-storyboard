import type { ReactNode } from 'react'
import Link from 'next/link'
import { DOH_MODULES, type DohModuleId } from '@/surfaces/doh/modules'
import type { RoleId } from '@/domain/roles'
import { routeBySurface } from '@/routes/definitions'
import { BannerRegion, type HubBanner } from './BannerRegion'

/**
 * S3: "a three-slot banner region and nothing more. Plus the module rail,
 * which is shared and owned by no module." This is the whole of it — every
 * one of the eight module screens (tasks 3-10) wraps its content in
 * `HubShell`, which wraps it in THIS. No module-specific content belongs
 * here; that is `HubShell`'s job, not the shared chrome's.
 *
 * The rail links the eight in-slice modules by `slug`, never by a bare
 * `SCR-DOH-NN` number (D1), and renders under exactly two conditions —
 * see `activeModuleId` and `role` below.
 */

/** The one registry statement of who reaches this surface. It does not list
 *  the Worker (D11), and the rail reads that rather than restating it. */
const HUB_ROUTE = routeBySurface('SURF-DOH')

export interface HubChromeProps {
  readonly banners: readonly HubBanner[]
  /**
   * Supplied by a module screen so the rail can mark its own entry current;
   * omitted on the module index. Task 2 fix 1: the rail renders ONLY when
   * this is supplied. On the index it was pure duplication of a richer list
   * that already carries each module's id, `SCR-DOH-NN` annotation and
   * purpose; between modules it is the actual navigation.
   */
  readonly activeModuleId?: DohModuleId
  /**
   * The persona the chrome is rendering for. REQUIRED, and deliberately not
   * defaulted: a D11 guard whose default is "show it" fails open, and the
   * caller always knows the persona. Task 2 fix round 2 (Minor-6).
   *
   * A persona the route registry does not admit reaches no Hub screen, so it
   * is offered NO chrome at all — neither the module rail (eight links whose
   * every destination renders `Unavailable`) nor the banner region (whose
   * support-session slot carries a live End-session button). Both were the
   * same mistake: chrome offered to a persona that reaches nothing.
   */
  readonly role: RoleId
  readonly children: ReactNode
}

export function HubChrome({ banners, activeModuleId, role, children }: HubChromeProps) {
  // One question, asked once: does this persona reach this surface at all?
  // Everything the chrome offers hangs off it.
  const reachesHub = HUB_ROUTE.allowedRoles.includes(role)
  const showRail = reachesHub && activeModuleId !== undefined

  return (
    <div className="space-y-6">
      <BannerRegion banners={reachesHub ? banners : []} />
      {showRail ? (
        <nav
          aria-label="Hub modules"
          className="flex flex-wrap gap-x-4 gap-y-2 border-b border-[var(--color-border-strong)] pb-3 text-sm"
        >
          {DOH_MODULES.map((m) => {
            const isActive = m.id === activeModuleId
            return (
              <Link
                key={m.id}
                href={`/hub/${m.slug}/`}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'font-semibold text-[var(--color-ink)]'
                    : 'text-[var(--color-primary)] underline'
                }
              >
                {m.name}
              </Link>
            )
          })}
        </nav>
      ) : null}
      <div>{children}</div>
    </div>
  )
}
