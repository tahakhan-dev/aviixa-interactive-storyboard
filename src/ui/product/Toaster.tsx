'use client'

import { bg, borderColor, radiusClass, statusText, textColor, zIndexClass, type StatusToken } from './tokens'

/**
 * Task 12 — a stack of toasts, controlled by the caller (same shape as
 * `DataTable`'s own state contract: this component owns no timers and no
 * queue of its own; it renders `toasts` and calls `onDismiss`). Not built on
 * `src/ui/primitives/Toast.tsx` — that primitive renders exactly one toast
 * on the legacy `--color-*` tokens and `src/ui/product/**` may only
 * reference `tokens.ts` (see `DataTable.tsx`'s header for the same rule
 * applied to `Table`/`Checkbox`/`Select`/`Field`/`Tabs`).
 *
 * DEBT D6 (progress.md, "Debts D6-D8 recorded with owners" — same debt
 * `DataTable.tsx`/`TableToolbar.tsx`/`fields/*` already carry): this is a
 * second, token-built implementation of the same idea as
 * `src/ui/primitives/Toast.tsx`, necessary because that primitive is not
 * theme-aware and migrating it is out of this task's scope.
 *
 * Colour is never load-bearing alone: icon and label are both always
 * rendered, same rule as `StatusPill`/`Banner`/`Toast`.
 */
export interface ToastItem {
  readonly id: string
  readonly tone: StatusToken
  readonly label: string
  readonly icon?: string
}

export interface ToasterProps {
  readonly toasts: readonly ToastItem[]
  readonly onDismiss: (id: string) => void
}

const DEFAULT_ICON: Readonly<Record<StatusToken, string>> = {
  ok: '✓',
  info: 'ℹ',
  warn: '▲',
  danger: '✕',
  stale: '◐',
  offline: '○',
  queued: '…',
  pending: '◔',
  conflict: '⇆',
  blocked: '⛔',
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null

  return (
    // DEBT D6 (see file header): duplicates `src/ui/primitives/Toast.tsx`'s single-toast markup.
    <div role="status" className={`fixed bottom-4 right-4 flex flex-col gap-2 ${zIndexClass('toast')}`}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-control-id={`toast-${toast.id}`}
          className={`flex items-center gap-3 ${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-3 shadow-lg`}
        >
          <span aria-hidden="true" className={statusText(toast.tone)}>
            {toast.icon ?? DEFAULT_ICON[toast.tone]}
          </span>
          <span className={`text-sm ${textColor('ink')}`}>{toast.label}</span>
          <button
            type="button"
            data-control-id={`toast-dismiss-${toast.id}`}
            onClick={() => onDismiss(toast.id)}
            className={`ml-auto text-xs underline ${textColor('ink-muted')}`}
          >
            {`Dismiss: ${toast.label}`}
          </button>
        </div>
      ))}
    </div>
  )
}
