/**
 * `<nav aria-label="Breadcrumb">` with an ordered list. The final item is
 * `aria-current="page"` and is never a link — a reader is already there.
 *
 * States: a single rendering, driven by `items`.
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
                <a href={item.href} className="hover:underline">
                  {item.label}
                </a>
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
