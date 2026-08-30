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
 *
 * FIX ROUND 1 — `affectedObjects`/`resultingState` were `string[]`/`string`:
 * a caller could pass `[]` and `"Are you sure?"` and it typechecked. The
 * TYPE now forces the naming brief §4 requires, rather than merely
 * permitting it:
 *   - `affectedObjects` is a non-empty tuple of `{ id, label }` (never a
 *     bare string a caller could leave vague), OR the explicit
 *     `{ kind: 'no-object', reason }` variant for the rare action that
 *     touches no named object — that must be a deliberate, distinct value,
 *     not an empty array that reads as an oversight.
 *   - `resultingState` is a `{ subject, from, to }` transition, not free
 *     prose — "Are you sure?" cannot be assigned to it.
 *
 * FIX ROUND 2 — the type shape from round 1 cannot forbid a non-empty
 * STRING from being blank: `{ kind: 'no-object', reason: '' }`, `[{ id: '',
 * label: '' }]` and `{ subject: '', from: 'x', to: 'x' }` all typecheck and
 * render empty. A vacuous confirmation is worse than none — it looks like a
 * safeguard and carries no information at the exact moment a user decides
 * whether to proceed — so `assertMeaningfulConfirmProps` below throws in
 * development (never production, so it costs the shipped bundle nothing;
 * `process.env.NODE_ENV !== 'production'` is eliminated as dead code by the
 * build's minifier) the moment it sees a blank `reason`, a blank `id`/
 * `label`, or a blank `subject`. The thrown message names the offending
 * prop and cites brief §4, so whoever trips it mid-flow knows what to fix
 * and why, not just that "props are invalid".
 *
 * `from === to` IS DELIBERATELY NOT GUARDED. An idempotent action can
 * legitimately confirm a transition that does not change value — e.g.
 * "Archive lot LOT-1" when LOT-1 is already archived, or "Re-run" a step
 * whose status stays 'queued' either way. That is real information (the
 * user learns the action is a no-op, not a surprise), not a vacuous
 * placeholder, so banning it would reject a legitimate caller just to make
 * the check tidier. A blank `subject`/`from`/`to` is still caught by the
 * blank-string checks above regardless of whether `from` and `to` match.
 */
export interface AffectedObject {
  readonly id: string
  readonly label: string
}

/** Non-empty by construction — a destructive action names at least one object, or says explicitly that it names none. */
export type ConfirmDialogAffected =
  | readonly [AffectedObject, ...AffectedObject[]]
  | { readonly kind: 'no-object'; readonly reason: string }

/** The resulting simulated state as a named transition, never a sentence a caller could leave vague. */
export interface ConfirmDialogTransition {
  readonly subject: string
  readonly from: string
  readonly to: string
}

/**
 * Throws in development when `affectedObjects`/`resultingState` are
 * present but vacuous (blank strings the type system cannot forbid) — see
 * "FIX ROUND 2" above. No-op in production: the whole function call is
 * gated by `process.env.NODE_ENV !== 'production'` at the call site, which
 * the build's minifier dead-code-eliminates for a production build.
 */
function assertMeaningfulConfirmProps(
  affectedObjects: ConfirmDialogAffected,
  resultingState: ConfirmDialogTransition,
): void {
  if ('kind' in affectedObjects) {
    if (affectedObjects.reason.trim() === '') {
      throw new Error(
        "ConfirmDialog: affectedObjects is { kind: 'no-object', reason: '' } — reason is blank. " +
          'Brief §4 requires a confirmation to state which fictional objects are affected, or ' +
          'explicitly say why none are, so it never implies a real platform change occurred; a ' +
          'blank reason gives the user nothing to decide from.',
      )
    }
  } else {
    const blank = affectedObjects.find((obj) => obj.id.trim() === '' || obj.label.trim() === '')
    if (blank) {
      const field = blank.id.trim() === '' ? 'id' : 'label'
      throw new Error(
        `ConfirmDialog: affectedObjects contains an entry with a blank ${field} — brief §4 requires ` +
          'the affected fictional objects to be named, not left blank, so the confirmation never ' +
          'implies a real platform change occurred.',
      )
    }
  }
  if (resultingState.subject.trim() === '') {
    throw new Error(
      'ConfirmDialog: resultingState.subject is blank — brief §4 requires the resulting simulated ' +
        'state to name what changes, so the confirmation never implies a real platform change occurred.',
    )
  }
}

export interface ConfirmDialogProps {
  readonly open: boolean
  readonly controlId: string
  readonly title: string
  /** The fictional objects this action would touch — never "this item". */
  readonly affectedObjects: ConfirmDialogAffected
  /** The resulting simulated state, as a transition — never "Are you sure?". */
  readonly resultingState: ConfirmDialogTransition
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

  if (process.env.NODE_ENV !== 'production') {
    assertMeaningfulConfirmProps(affectedObjects, resultingState)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/40">
      {/* DEBT D6 (see file header): duplicates `src/ui/primitives/Dialog.tsx`'s `role="alertdialog"` markup. */}
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
          {'kind' in affectedObjects ? (
            <p className={textColor('ink')}>{affectedObjects.reason}</p>
          ) : (
            <ul className={`list-disc pl-5 ${textColor('ink')}`}>
              {affectedObjects.map((obj) => (
                <li key={obj.id}>{obj.label}</li>
              ))}
            </ul>
          )}
          <p className={textColor('ink')}>
            {resultingState.subject}: {resultingState.from} → {resultingState.to}
          </p>
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
