'use client'

import type { Capture } from '@/data/schemas/operations'
import { captureStateLine, type CaptureState } from '@/frontline/capture'
import { bg, borderColor, controlMinClass, radiusClass, statusBg, statusText, textColor } from '../tokens'

/** Reused from the schema's own `captureType` enum rather than redeclared — see `tokens.ts`'s
 *  header on why a parallel spelling of a closed union is the exact defect to avoid. */
export type CaptureControlType = Capture['captureType']

/**
 * Task 13 — one capture, shaped for a gloved thumb rather than a mouse.
 * §20.2 forbids precision pointing, drag and multitouch, so every captured
 * value below is committed by a single, decisive, ≥44px tap: `ok-not-ok`
 * commits on the tap itself (no separate "confirm"), `photo` commits on the
 * one button it has, and `measurement`/`text`/`barcode` pair a large field
 * with one large commit button — never a stepper that needs repeated
 * precision taps and never a swipe-to-confirm.
 *
 * THE STATE LINE IS THE LADDER'S OWN, NEVER A BARE TICK. Once `state` is
 * supplied, the line under the control is `captureStateLine` from
 * `@/frontline/capture` — the same total, thirteen-member-safe function the
 * sync indicators use — so this control can never render "Saved" or a
 * checkmark standing in for a state it does not know.
 *
 * NOT BUILT ON `fields/TextField`/`fields/NumberField` (Task 11). Those
 * fields use `Form`'s comfortable-density sizing, well under the 60px floor
 * this surface requires (task 13 fix round 1: frozen source
 * `AVIIXA_Production_Product_Blueprint.md` L106276, `DEC-NFR-007`, 11mm
 * minimum), and `FieldShell`'s chrome (label row, hint row,
 * error row) is built for a desk form, not a one-line capture prompt on a
 * shop-floor tablet. The inputs here are built directly on `tokens.ts`'s
 * `spacious` control-min instead of wrapped, for the same "seven
 * non-theme-aware primitives, built fresh rather than papered over" reason
 * `ConfirmDialog.tsx`/`ObjectPage.tsx` give for their own markup.
 */
export interface CaptureControlProps {
  /** A stable registry id (ruling R4), e.g. the step's own field id. */
  readonly controlId: string
  readonly captureType: CaptureControlType
  readonly label: string
  /** The in-progress value for `measurement`/`text`/`barcode`/`ok-not-ok`. Unused by `photo`. */
  readonly value: string
  readonly onChange: (next: string) => void
  readonly onCapture: () => void
  /** The capture's ladder state once committed. Absent before the first commit. */
  readonly state?: CaptureState | undefined
  readonly disabled?: boolean | undefined
}

export function CaptureControl({
  controlId,
  captureType,
  label,
  value,
  onChange,
  onCapture,
  state,
  disabled = false,
}: CaptureControlProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className={`text-sm font-medium ${textColor('ink')}`}>{label}</p>

      {captureType === 'ok-not-ok' ? (
        <div className="flex gap-3">
          <button
            type="button"
            data-control-id={`${controlId}-ok`}
            aria-pressed={value === 'ok'}
            disabled={disabled}
            onClick={() => {
              onChange('ok')
              onCapture()
            }}
            className={`flex-1 ${controlMinClass('spacious')} ${radiusClass('md')} border-2 font-semibold ${
              value === 'ok'
                ? `${statusBg('ok')} ${statusText('ok')} border-transparent`
                : `${borderColor('border-strong')} ${textColor('ink')}`
            }`}
          >
            OK
          </button>
          <button
            type="button"
            data-control-id={`${controlId}-not-ok`}
            aria-pressed={value === 'not-ok'}
            disabled={disabled}
            onClick={() => {
              onChange('not-ok')
              onCapture()
            }}
            className={`flex-1 ${controlMinClass('spacious')} ${radiusClass('md')} border-2 font-semibold ${
              value === 'not-ok'
                ? `${statusBg('danger')} ${statusText('danger')} border-transparent`
                : `${borderColor('border-strong')} ${textColor('ink')}`
            }`}
          >
            Not OK
          </button>
        </div>
      ) : captureType === 'photo' ? (
        <button
          type="button"
          data-control-id={`${controlId}-photo`}
          disabled={disabled}
          onClick={onCapture}
          className={`w-full ${controlMinClass('spacious')} ${radiusClass('md')} border-2 border-dashed ${borderColor('border-strong')} font-semibold ${textColor('ink')}`}
        >
          {state !== undefined ? 'Retake photo' : 'Capture photo'}
        </button>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor={`${controlId}-input`}>
            {label}
          </label>
          <input
            id={`${controlId}-input`}
            data-control-id={`${controlId}-input`}
            type={captureType === 'measurement' ? 'number' : 'text'}
            inputMode={captureType === 'measurement' ? 'decimal' : undefined}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={`flex-1 ${controlMinClass('spacious')} ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-4 text-base ${textColor('ink')}`}
          />
          <button
            type="button"
            data-control-id={`${controlId}-submit`}
            disabled={disabled || value.trim() === ''}
            onClick={onCapture}
            className={`shrink-0 ${controlMinClass('spacious')} ${radiusClass('md')} px-6 font-semibold ${bg('accent')} ${textColor('accent-ink')} disabled:opacity-40`}
          >
            {captureType === 'barcode' ? 'Scan' : 'Record'}
          </button>
        </div>
      )}

      {state !== undefined ? (
        <p role="status" className={`text-xs ${textColor('ink-subtle')}`}>
          {captureStateLine(state)}
        </p>
      ) : null}
    </div>
  )
}
