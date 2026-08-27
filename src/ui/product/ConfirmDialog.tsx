'use client'

import { useId, useRef } from 'react'
import { useOverlayFocus } from '@/ui/primitives/useOverlayFocus'
import { bg, borderColor, radiusClass, statusBg, statusText, textColor } from './tokens'

/**
 * Task 12, pass criterion 1 — a confirmation on a destructive action must
 * never imply a real platform change occurred (brief §4), so it never asks
 * "Are you sure?": it names the fictional objects the action would touch
 * (`affectedObjects`) and the simulated state that would result
 * (`resultingState`), as sentences, not a bare yes/no.
 *
 * NOT BUILT ON `src/ui/primitives/Dialog.tsx`. That primitive still styles
 * on the legacy `--color-ink`/`--color-surface` tokens — no dark-mode
 * redefinition — the exact defect `Drawer.tsx` carried before Task 9 fix
 * round 2 migrated it (16.19:1 dark / 17.85:1 light). `Drawer` was migrated
 * because Task 12 mounts drawers directly (Task 9 report); the same is true
 * of dialogs here, so wrapping `Dialog` and papering over its contrast with
 * an inline override would be exactly the "compensating style" the brief
 * forbids. `DataTable.tsx`/`TableToolbar.tsx`/`fields/*` already set the
 * precedent for the other option the brief offers instead of migrating:
 * build fresh, token-only markup and record the duplication as debt.
 *
 * DEBT D6 (progress.md, "Debts D6-D8 recorded with owners", Dialog is
 * explicitly one of the seven non-theme-aware primitives on that list,
 * "owned by tasks 10-13"): this is a second `role="alertdialog"`
 * implementation alongside `Dialog.tsx`. Reconcile when a future task
 * migrates `Dialog` itself onto `tokens.ts`.
 *
 * FOCUS CONTRACT REUSED, NOT REBUILT: `useOverlayFocus` is `Dialog` and
 * `Drawer`'s own shared primitive (its docblock calls this "rule 4" —
 * traps Tab, closes on Escape, restores focus to the invoker on close).
 * That hook sets no colour at all, so reusing it here does not reintroduce
 * the contrast defect above; only the surrounding markup is new.
 *
 * THE BACKDROP SCRIM IS DELIBERATELY THE SAME LEGACY TOKEN `Drawer.tsx`
 * KEEPS (see that file's own comment): a scrim darkens the page behind the
 * overlay in every theme, and the dark-mode-aware `--ink` would flip it to
 * a light tint in dark mode — a new bug, not a fix.
 */
export interface ConfirmDialogProps {
  readonly open: boolean
  readonly controlId: string
  readonly title: string
  /** The fictional objects this action would touch, named — never "this item". */
  readonly affectedObjects: readonly string[]
  /** The resulting simulated state, as a sentence — never "Are you sure?". */
  readonly resultingState: string
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly busy?: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

export function ConfirmDialog({
  open,
  controlId,
  title,
  affectedObjects,
  resultingState,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  useOverlayFocus(open, onCancel, containerRef)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/40">
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        data-control-id={controlId}
        className={`w-full max-w-md ${radiusClass('lg')} border ${borderColor('border')} ${bg('surface')} p-4 shadow-lg`}
      >
        <h2 id={titleId} className={`text-base font-semibold ${textColor('ink')}`}>
          {title}
        </h2>
        <div id={descId} className="mt-3 space-y-2 text-sm">
          <p className={textColor('ink-muted')}>This will affect:</p>
          <ul className={`list-disc pl-5 ${textColor('ink')}`}>
            {affectedObjects.map((obj) => (
              <li key={obj}>{obj}</li>
            ))}
          </ul>
          <p className={textColor('ink')}>{resultingState}</p>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            data-control-id={`${controlId}-cancel`}
            onClick={onCancel}
            className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-3 py-1.5 text-sm ${textColor('ink')}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-control-id={`${controlId}-confirm`}
            onClick={onConfirm}
            aria-disabled={busy ? 'true' : undefined}
            disabled={busy}
            className={`${radiusClass('md')} px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${statusBg('danger')} ${statusText('danger')}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
