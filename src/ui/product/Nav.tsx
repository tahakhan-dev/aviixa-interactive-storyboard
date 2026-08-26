'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Drawer } from '@/ui/primitives'
import {
  bg,
  borderColor,
  controlMinClass,
  gapClass,
  hoverBgSunken,
  LIGHT_TOKEN_STYLE,
  shadowClass,
  textColor,
  type DensityToken,
} from './tokens'

/**
 * One entry the signed-in role actually reaches. `id` is always the
 * control's own registry identifier (a module id like `MOD-DOH-04`, or a
 * route slug where no module id exists, e.g. a Frontline destination) —
 * Controller ruling R4: derive `data-control-id` from the registry entry
 * rather than inventing a parallel scheme, so Task 15's tour engine can
 * resolve a step to this exact link.
 */
export interface NavItem {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly current?: boolean
}

/** `label` is omitted for a flat, ungrouped list (Hub, Command Center). */
export interface NavGroup {
  readonly id: string
  readonly label?: string
  readonly items: readonly NavItem[]
}

/**
 * Three genuinely different navigation shapes, one per surface character:
 * `rail` — a left sidebar (Super Admin, Hub, Studio); `bar` — a horizontal
 * strip across the top (Command Center's monitoring cockpit); `tabbar` — a
 * persistent full-width row of large targets (Frontline's floor tablet,
 * which is narrow-first by design and never collapses into a drawer — see
 * `AppShell`'s doc comment for why that is a deliberate reading of the
 * pass criterion rather than an omission).
 */
export type NavLayout = 'rail' | 'bar' | 'tabbar'

export interface NavProps {
  readonly ariaLabel: string
  readonly groups: readonly NavGroup[]
  readonly layout: NavLayout
  readonly density: DensityToken
}

function NavList({
  groups,
  density,
  direction = 'column',
  onNavigate,
}: {
  readonly groups: readonly NavGroup[]
  readonly density: DensityToken
  readonly direction?: 'row' | 'column'
  readonly onNavigate?: () => void
}) {
  const hasAnyItem = groups.some((g) => g.items.length > 0)
  if (!hasAnyItem) {
    return (
      <p className={`px-3 py-2 text-sm ${textColor('ink-subtle')}`}>
        No modules are offered to this role.
      </p>
    )
  }
  return (
    <div className={`flex ${direction === 'row' ? 'flex-row flex-wrap items-center' : 'flex-col'} ${gapClass(density)}`}>
      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <div key={group.id}>
            {group.label !== undefined ? (
              <p className={`px-3 pb-1 text-xs font-semibold uppercase tracking-wide ${textColor('ink-subtle')}`}>
                {group.label}
              </p>
            ) : null}
            <ul className={`flex ${direction === 'row' ? 'flex-row flex-wrap items-center' : 'flex-col'} ${gapClass('compact')}`}>
              {group.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    data-control-id={item.id}
                    aria-current={item.current === true ? 'page' : undefined}
                    onClick={() => onNavigate?.()}
                    className={`block rounded-[var(--radius-md)] px-3 py-2 text-sm ${controlMinClass(density)} flex items-center ${
                      item.current === true
                        ? `${bg('accent')} ${textColor('accent-ink')} font-medium`
                        : `${textColor('ink')} ${hoverBgSunken}`
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  )
}

/** Rail (sidebar) and bar (top strip) share the same collapse-to-drawer
 *  behaviour at narrow widths; only the persistent-width layout differs. */
function ResponsiveNav({
  ariaLabel,
  groups,
  density,
  direction,
  persistentClassName,
}: {
  readonly ariaLabel: string
  readonly groups: readonly NavGroup[]
  readonly density: DensityToken
  readonly direction: 'row' | 'column'
  readonly persistentClassName: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav aria-label={ariaLabel} className={`hidden md:block ${persistentClassName}`}>
        <NavList groups={groups} density={density} direction={direction} />
      </nav>

      <div className={`flex items-center justify-between border-b ${borderColor('border')} p-2 md:hidden`}>
        <span className={`text-sm font-semibold ${textColor('ink')}`}>{ariaLabel}</span>
        <button
          type="button"
          data-control-id="nav-toggle"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={`rounded-[var(--radius-md)] border ${borderColor('border-strong')} px-3 py-1.5 text-sm ${textColor('ink')} ${controlMinClass(density)}`}
        >
          Menu
        </button>
      </div>

      <div className="md:hidden">
        <Drawer open={open} onClose={() => setOpen(false)} title={ariaLabel} side="left">
          {/* `LIGHT_TOKEN_STYLE`: the Drawer's own background is always
             light (legacy token, no dark redefinition), so its content is
             pinned to light values too rather than inheriting the page's
             real (possibly dark) theme — see that constant's doc comment. */}
          <div style={LIGHT_TOKEN_STYLE}>
            <NavList groups={groups} density={density} onNavigate={() => setOpen(false)} />
          </div>
        </Drawer>
      </div>
    </>
  )
}

function TabBarNav({ ariaLabel, groups, density }: { readonly ariaLabel: string; readonly groups: readonly NavGroup[]; readonly density: DensityToken }) {
  const items = groups.flatMap((g) => g.items)
  return (
    <nav
      aria-label={ariaLabel}
      className={`sticky bottom-0 flex w-full border-t ${borderColor('border')} ${bg('raised')} ${shadowClass(2)}`}
    >
      {items.length === 0 ? (
        <p className={`w-full px-3 py-3 text-center text-sm ${textColor('ink-subtle')}`}>
          No destinations are offered to this role.
        </p>
      ) : (
        items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            data-control-id={item.id}
            aria-current={item.current === true ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-center text-sm ${controlMinClass(density)} ${
              item.current === true ? `${textColor('accent')} font-semibold` : textColor('ink')
            }`}
          >
            {item.label}
          </Link>
        ))
      )}
    </nav>
  )
}

export function Nav({ ariaLabel, groups, layout, density }: NavProps) {
  if (layout === 'tabbar') {
    return <TabBarNav ariaLabel={ariaLabel} groups={groups} density={density} />
  }
  if (layout === 'bar') {
    return (
      <ResponsiveNav
        ariaLabel={ariaLabel}
        groups={groups}
        density={density}
        direction="row"
        persistentClassName={`w-full border-b ${borderColor('border')} ${bg('raised')} px-4 py-2`}
      />
    )
  }
  return (
    <ResponsiveNav
      ariaLabel={ariaLabel}
      groups={groups}
      density={density}
      direction="column"
      persistentClassName={`w-64 shrink-0 border-r ${borderColor('border')} ${bg('raised')} p-3`}
    />
  )
}
