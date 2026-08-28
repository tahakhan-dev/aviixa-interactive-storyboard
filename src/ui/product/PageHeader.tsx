'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import type { BreadcrumbItem } from '@/ui/primitives'
import { textColor } from './tokens'

export interface PageHeaderProps {
  readonly breadcrumbs: readonly BreadcrumbItem[]
  readonly title: string
  /** Primary actions slot — the page's own buttons, never the shell's. */
  readonly actions?: ReactNode
}

/**
 * Breadcrumb, one `h1`, primary-actions slot. Nothing else — no narrative
 * sentence, no locator, no source classification (pass criterion 2).
 *
 * BREADCRUMB MARKUP IS INLINED HERE RATHER THAN IMPORTING
 * `src/ui/primitives/Breadcrumbs.tsx` — reuses its `BreadcrumbItem` type,
 * not its render. That primitive hardcodes the legacy `--color-ink*`
 * tokens, which carry no dark-mode redefinition (they are still the pre-
 * task-9 vocabulary the brief says primitives "will migrate onto" the new
 * layer in a later task, not this one). Rendering it here produced nearly
 * invisible breadcrumb text against a dark `AppShell` — caught live in
 * Chrome (Task 9 report, ledger), not by reading the code. The structure
 * below is the same one (`nav[aria-label="Breadcrumb"]` > `ol`, last item
 * `aria-current="page"` and never a link), styled on the new tokens instead.
 *
 * FOCUS-ON-MOUNT IS THE ROUTE-CHANGE FOCUS MOVE. `AppShell` is rendered
 * per-page (as `SaConsoleShell`/`HubShell`/`StudioShell`/`FrontlineShell`
 * already are today), so a route change unmounts the whole previous page
 * tree and mounts a new one — this component's `useEffect` runs fresh on
 * every navigation without a router event listener. `tabIndex={-1}` keeps
 * the heading out of the normal Tab sequence (pass criterion 3: tab order
 * stays source order) while still being a legal `.focus()` target; the
 * global `:focus-visible` rule in `app/globals.css` supplies the visible
 * ring once it lands.
 */
export function PageHeader({ breadcrumbs, title, actions }: PageHeaderProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div>
      <nav aria-label="Breadcrumb">
        <ol className={`flex flex-wrap items-center gap-1 text-sm ${textColor('ink-muted')}`}>
          {breadcrumbs.map((item, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <li key={`${item.label}-${i}`} className="flex items-center gap-1">
                {i > 0 ? <span aria-hidden="true">/</span> : null}
                {!isLast && item.href !== undefined ? (
                  // Fix round 1 (unit-01, Task 5 review) — a plain `<a>` here
                  // forced a full page reload on every breadcrumb click,
                  // which discards this build's whole session (in-memory
                  // only, per `ProductRuntime.tsx`) and, worse, any
                  // just-written business data (`boot()` always rebuilds
                  // the store from the static seed — `src/data/boot.ts`).
                  // `ObjectPage`'s own consumer (`TenantDetailScreen.tsx`,
                  // reachable straight from the create wizard) was this
                  // gap's worst case: a mid-wizard breadcrumb click could
                  // silently drop a session the user was still using.
                  // `Link` keeps this a real client-side navigation, the
                  // same primitive every other in-app link in this surface
                  // already uses (`Nav.tsx`, `TenantsScreen.tsx`'s rowHref).
                  <Link href={item.href} data-control-id={`breadcrumb-${item.href}`} className="hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className={textColor('ink')}>
                    {item.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 ref={headingRef} tabIndex={-1} className={`text-2xl font-semibold ${textColor('ink')}`}>
          {title}
        </h1>
        {actions !== undefined ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
