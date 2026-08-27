'use client'

import { describedByFor, errorIdFor, hintIdFor, useFieldBinding } from '../Form'
import { statusText, textColor } from '../tokens'

export interface CheckboxFieldProps {
  readonly name: string
  readonly label: string
  readonly hint?: string | undefined
  readonly value?: boolean | undefined
  readonly onChange?: ((next: boolean) => void) | undefined
  readonly error?: string | undefined
}

/** Its own layout, not `FieldShell` — a checkbox's label sits beside the
 *  control, not above it, so this repeats the hint/error rendering rather
 *  than force `FieldShell`'s stacked layout onto an input it doesn't fit. */
export function CheckboxField({ name, label, hint, value, onChange, error }: CheckboxFieldProps) {
  // FIX ROUND 1 (Important finding #2): `displayDefault={false}` — this
  // renders `checked={bound.value ?? false}` below, i.e. unchecked, whether
  // the underlying value is the schema-valid `false` or the actually-held
  // `undefined`. Without seeding, a required boolean left at that visually
  // "already answered" default submitted as `undefined` and the schema
  // rejected it — the user did everything the screen showed them to do and
  // still could not save.
  const bound = useFieldBinding<boolean>(name, value, onChange, error, false)
  const invalid = bound.error !== undefined
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* DEBT D6 (task-11 brief: "six primitives measured as not
            theme-aware ... Checkbox is exactly what a form layer would
            reach for. Do not reach for them"): this native
            `<input type="checkbox">` duplicates
            `src/ui/primitives/Checkbox.tsx`'s job on the token layer
            instead. Reconcile with that primitive once its own migration
            lands. */}
        <input
          id={bound.controlId}
          name={name}
          type="checkbox"
          checked={bound.value ?? false}
          onChange={(e) => bound.onChange(e.target.checked)}
          aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
          aria-invalid={invalid ? 'true' : undefined}
          data-control-id={bound.controlId}
          className="h-4 w-4"
        />
        <label htmlFor={bound.controlId} className={`text-sm font-medium ${textColor('ink')}`}>
          {label}
        </label>
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
