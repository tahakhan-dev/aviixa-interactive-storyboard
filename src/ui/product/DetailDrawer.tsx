'use client'

import type { ReactNode } from 'react'
import { Drawer, type DrawerSide } from '@/ui/primitives'
import { borderColor } from './tokens'

/**
 * Task 12 — a quick-view side panel over `src/ui/primitives/Drawer.tsx`
 * directly, not a reimplementation. Drawer is the ONE overlay primitive
 * already migrated onto this token layer (Task 9 fix round 2, 16.19:1 dark
 * / 17.85:1 light) — see `ConfirmDialog.tsx`'s header for why `Dialog`,
 * still unmigrated, is NOT reused the same way.
 *
 * `status` and `actions` are optional slots so a caller can render a
 * `StatusPill`/`FreshnessStamp` summary above the content and a row of
 * buttons below it, without this component knowing anything about either.
 */
export interface DetailDrawerProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly title: string
  readonly side?: DrawerSide
  readonly status?: ReactNode
  readonly actions?: ReactNode
  readonly children: ReactNode
}

export function DetailDrawer({
  open,
  onClose,
  title,
  side = 'right',
  status,
  actions,
  children,
}: DetailDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title={title} side={side}>
      {status !== undefined ? <div className="mb-3">{status}</div> : null}
      <div className="flex flex-col gap-3">{children}</div>
      {actions !== undefined ? (
        <div className={`mt-4 flex items-center gap-2 border-t ${borderColor('border')} pt-3`}>{actions}</div>
      ) : null}
    </Drawer>
  )
}
