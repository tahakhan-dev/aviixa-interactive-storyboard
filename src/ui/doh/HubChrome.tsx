import type { ReactNode } from 'react'
import Link from 'next/link'
import type { DohModuleDefinition, DohModuleId } from '@/surfaces/doh/modules'
import { BannerRegion, type HubBanner } from './BannerRegion'

/**
 * S3: "a three-slot banner region and nothing more. Plus the module rail,
 * which is shared and owned by no module." This is the whole of it — EVERY
 * module screen on this surface wraps its content in `HubShell`, which wraps
 * it in THIS. No module-specific content belongs here; that is `HubShell`'s
 * job, not the shared chrome's.
 *
 * THE COUNT IS GONE ON PURPOSE. This read "every one of the eight module
 * screens (tasks 3-10)" and slice 6 registered fifteen, so the sentence was
 * describing a surface that had stopped existing. A number written into
 * prose beside a registry that grows is a statement with an expiry date on
 * it; "every module screen" is the claim actually being made and it does not
 * expire. `DOH_MODULES` is where the count lives.
 *
 * THIS COMPONENT HOLDS NO POLICY, AND CANNOT. "Taking a button off the
 * screen does not stop anyone" — so a component that decided who may see a
 * route would be deciding something the enforcement layer must decide, and
 * an architectural gate forbids it outright. Fix round 3 moved BOTH
 * decisions out rather than correcting them here: the shell computes which
 * modules this persona reaches and which banners it is shown, and hands
 * this component two lists to draw. A component holding no policy cannot
 * hold a WRONG policy, which is the second half of the same fix — the rail
 * used to offer every registered module to every persona that reached the
 * surface, including ones each module's own matrix marks `Unavailable`.
 *
 * The rail links by `slug`, never by a bare `SCR-DOH-NN` number (D1).
 */

export interface HubChromeProps {
  /**
   * The banners to draw, already chosen for the persona by the shell. Empty
   * renders nothing at all, not an empty wrapper.
   */
  readonly banners: readonly HubBanner[]
  /**
   * The rail's entries, already chosen for the persona by the shell —
   * `dohModulesReachedBy` in `@/surfaces/doh/modules` computes it. Empty
   * renders no rail: a persona offered no route is offered no navigation.
   */
  readonly modules: readonly DohModuleDefinition[]
  /**
   * Supplied by a module screen so the rail can mark its own entry current;
   * omitted on the module index. The rail renders ONLY when this is
   * supplied. On the index it was pure duplication of a richer list that
   * already carries each module's id, `SCR-DOH-NN` annotation and purpose;
   * between modules it is the actual navigation.
   */
  readonly activeModuleId?: DohModuleId
  readonly children: ReactNode
}

export function HubChrome({ banners, modules, activeModuleId, children }: HubChromeProps) {
  const showRail = activeModuleId !== undefined && modules.length > 0

  return (
    <div className="space-y-6">
      <BannerRegion banners={banners} />
      {showRail ? (
        <nav
          aria-label="Hub modules"
          className="flex flex-wrap gap-x-4 gap-y-2 border-b border-[var(--color-border-strong)] pb-3 text-sm"
        >
          {modules.map((m) => {
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
