'use client'

import { errorIdFor, hintIdFor, useFieldBinding } from '../Form'
import { borderColor, statusText, textColor } from '../tokens'

export interface RadioOption {
  readonly value: string
  readonly label: string
}

export interface RadioGroupProps {
  readonly name: string
  /** The group's accessible name, via `aria-labelledby` on the `role="radiogroup"` wrapper. */
  readonly label: string
  readonly options: readonly RadioOption[]
  readonly hint?: string | undefined
  readonly required?: boolean | undefined
  readonly value?: string | undefined
  readonly onChange?: ((next: string) => void) | undefined
  readonly error?: string | undefined
}

/** No primitive to duplicate here (unlike `SelectField`/`CheckboxField`) —
 *  `src/ui/primitives/` has no radio-group component, theme-aware or
 *  otherwise, so this carries no DEBT D6 marker. */
export function RadioGroup({ name, label, options, hint, required, value, onChange, error }: RadioGroupProps) {
  const bound = useFieldBinding<string>(name, value, onChange, error)
  const invalid = bound.error !== undefined
  const groupLabelId = `${bound.controlId}-label`
  const describedBy = [hint !== undefined ? hintIdFor(bound.controlId) : null, invalid ? errorIdFor(bound.controlId) : null]
    .filter((p): p is string => p !== null)
    .join(' ')

  return (
    <div className="flex flex-col gap-1">
      <span id={groupLabelId} className={`text-sm font-medium ${textColor('ink')}`}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      <div
        id={bound.controlId}
        // `tabIndex={-1}`: `role="radiogroup"` carries no implicit tabindex,
        // so without this an `ErrorSummary` link's `getElementById(id)?.focus()`
        // (Form.tsx's field-focus contract) would silently no-op here.
        tabIndex={-1}
        role="radiogroup"
        aria-labelledby={groupLabelId}
        aria-describedby={describedBy.length > 0 ? describedBy : undefined}
        aria-invalid={invalid ? 'true' : undefined}
        data-control-id={bound.controlId}
        className="flex flex-col gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {options.map((opt) => {
          const optionId = `${bound.controlId}-${opt.value}`
          return (
            <label key={opt.value} htmlFor={optionId} className={`flex items-center gap-2 text-sm ${textColor('ink')}`}>
              <input
                id={optionId}
                type="radio"
                name={name}
                value={opt.value}
                checked={bound.value === opt.value}
                onChange={() => bound.onChange(opt.value)}
                data-control-id={optionId}
                className={`h-4 w-4 ${borderColor('border-strong')}`}
              />
              {opt.label}
            </label>
          )
        })}
      </div>
      {hint !== undefined ? (
        <p id={hintIdFor(bound.controlId)} className={`text-xs ${textColor('ink-muted')}`}>
          {hint}
        </p>
      ) : null}
      {bound.error !== undefined ? (
        <p id={errorIdFor(bound.controlId)} className={`text-xs font-medium ${statusText('danger')}`}>
          {bound.error}
        </p>
      ) : null}
    </div>
  )
}
