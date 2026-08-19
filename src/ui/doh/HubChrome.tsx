import type { ReactNode } from 'react'
import Link from 'next/link'
import { DOH_MODULES, type DohModuleId } from '@/surfaces/doh/modules'
import { BannerRegion, type HubBanner } from './BannerRegion'

/**
 * S3: "a three-slot banner region and nothing more. Plus the module rail,
 * which is shared and owned by no module." This is the whole of it — every
 * one of the eight module screens (tasks 3-10) wraps its content in
 * `HubShell`, which wraps it in THIS. No module-specific content belongs
 * here; that is `HubShell`'s job, not the shared chrome's.
 *
 * The rail links the eight in-slice modules by `slug`, never by a bare
 * `SCR-DOH-NN` number (D1).
 */
export interface HubChromeProps {
  readonly banners: readonly HubBanner[]
  /** Omitted on the module index; supplied by a module screen so the rail
   *  can mark its own entry current. */
  readonly activeModuleId?: DohModuleId
  readonly children: ReactNode
}

export function HubChrome({ banners, activeModuleId, children }: HubChromeProps) {
  return (
    <div className="space-y-6">
      <BannerRegion banners={banners} />
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
      <div>{children}</div>
    </div>
  )
}
