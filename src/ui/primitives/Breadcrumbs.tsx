import Link from 'next/link'

/**
 * `<nav aria-label="Breadcrumb">` with an ordered list. The final item is
 * `aria-current="page"` and is never a link — a reader is already there.
 *
 * States: a single rendering, driven by `items`.
 *
 * FIX ROUND 2 (unit-01, Task 5 re-review) — every non-final item used a
 * plain `<a href>`, a full page load discarding whatever in-memory session
 * or unsaved form state the current page held (the same hazard already
 * fixed in `PageHeader.tsx`'s own inlined breadcrumb markup, fix round 1).
 * This component is the shared primitive `SaConsoleShell`, `StudioShell`,
 * `HubShell`, AND `SchedulerScaffold` render their breadcrumbs through
 * (a fourth consumer beyond the three the review named), so the fix
 * belongs here once rather than at each call site. Every `href` passed to
 * this component is an internal route (grepped across all four consumers
 * before this change), so nothing legitimately depends on the reload —
 * `next/link`'s client-side navigation is a strict improvement, not a
 * behaviour change worth gating.
 */
export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--color-ink-muted)]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {!isLast && item.href !== undefined ? (
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="text-[var(--color-ink)]">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
