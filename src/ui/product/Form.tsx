'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import type { ZodType } from 'zod'
import type { WriteResult } from '@/data/repository'
import { ErrorSummary, type ErrorSummaryEntry } from './ErrorSummary'
import { bg, borderColor, radiusClass, statusText, textColor } from './tokens'

/**
 * Task 11 — the form layer every create/edit flow across the five surfaces
 * builds on.
 *
 * THE SINGLE MOST IMPORTANT PROPERTY: `schema` is a `ZodType<T>`, the exact
 * same object `src/data/repository.ts` parses the row against on write
 * (§'s brief, "the same schema the repository validates against"). This
 * component never carries a second, hand-written copy of any rule — a value
 * either passes `schema.safeParse` or it doesn't, and that is the one
 * question both this form and the repository ask.
 *
 * DEVIATION FROM THE BRIEF: `FormProps.onSubmit` is typed here as
 * `(value: T) => WriteResult<unknown> | Promise<WriteResult<unknown>>`, not
 * the brief's bare `WriteResult<unknown>`. `src/data/repository.ts`'s own
 * header (fix round 1) makes `create`/`update`/`transition` all
 * `Promise`-returning — "commit, then publish" cannot be expressed
 * synchronously — so a literal, un-widened `onSubmit` signature would make
 * it impossible to pass `repository.create` (or any real write path) to this
 * component at all. Accepting the union and awaiting it internally is the
 * one change that keeps the brief's synchronous callers working (a plain
 * object return needs no `await`) while making the real, asynchronous
 * repository path usable, which is the entire point of Task 11's own
 * "single most important property" note.
 */
export interface FormProps<T> {
  readonly schema: ZodType<T>
  readonly initial: Partial<T>
  readonly onSubmit: (value: T) => WriteResult<unknown> | Promise<WriteResult<unknown>>
  readonly children: ReactNode
  readonly submitLabel: string
}

interface FormContextValue {
  readonly values: Readonly<Record<string, unknown>>
  readonly setValue: (name: string, value: unknown) => void
  readonly errors: Readonly<Record<string, readonly string[]>>
}

const FormContext = createContext<FormContextValue | null>(null)

/** Deterministic, not `useId()`-generated: `ErrorSummary`'s links target
 *  `#field-<name>` by this exact convention, and both the field component
 *  (setting `id`) and the summary (setting `href`) need to compute the same
 *  string independently without a registry between them. One form per
 *  screen is the only shape this build ever needs (Task 11 brief). */
export function controlIdFor(name: string): string {
  return `field-${name}`
}

export function hintIdFor(controlId: string): string {
  return `${controlId}-hint`
}

export function errorIdFor(controlId: string): string {
  return `${controlId}-error`
}

/**
 * The join point every field in `src/ui/product/fields/*` reads and writes
 * through. Two modes, chosen per-call by whether the caller passed its own
 * `value`/`onChange`/`error` (a field used standalone — inside a `Wizard`
 * step's caller-managed state, say) or left them out (a field used inside a
 * `<Form>`, wired through context). A field component never needs to know
 * which mode it's in; it just always calls this hook.
 */
export function useFieldBinding<V>(
  name: string,
  value: V | undefined,
  onChange: ((next: V) => void) | undefined,
  error: string | undefined,
  /**
   * FIX ROUND 1 (Important finding #2): what this field shows the user when
   * it holds no value of its own yet — `false` for a checkbox, the first
   * `<option>` for a native `<select>` with no placeholder (the browser
   * auto-selects it whether or not anything was ever written to state).
   * Seeded into `Form`'s `values` once at mount, context mode only, so a
   * required field the user never touches submits the SAME thing it visibly
   * showed — never `undefined` for a value that reads as already filled in.
   */
  displayDefault?: V,
): { readonly value: V | undefined; readonly onChange: (next: V) => void; readonly error: string | undefined; readonly controlId: string } {
  const ctx = useContext(FormContext)
  const standalone = value !== undefined || onChange !== undefined
  const resolvedValue = value !== undefined ? value : (ctx?.values[name] as V | undefined)
  const resolvedOnChange = onChange ?? ((next: V) => ctx?.setValue(name, next))
  // All of this field's messages, not just the first — `ErrorSummary` lists
  // every one for the same field, and showing fewer beside the field than
  // in the summary was its own (Minor) inconsistency.
  const resolvedError = error ?? ctx?.errors[name]?.join(' ')

  // Runs once at mount (`[]`), never on every render/keystroke — the exact
  // shape of the Critical finding (an effect re-firing on a value that
  // churns) is what this seeding effect must NOT become. Context mode only:
  // a standalone field (explicit `value`/`onChange` passed in, e.g. a
  // `Wizard` step's own local state) is the caller's own state to seed, not
  // this hook's.
  useEffect(() => {
    if (!standalone && ctx !== null && displayDefault !== undefined && ctx.values[name] === undefined) {
      ctx.setValue(name, displayDefault)
    }
    // Deliberately `[]`: see the comment above — seed once at mount, not on
    // every render (no `react-hooks/exhaustive-deps` rule is configured in
    // this project — see Wizard.tsx fix round 1 — so this is a plain
    // comment, not a lint-suppression directive).
  }, [])

  return { value: resolvedValue, onChange: resolvedOnChange, error: resolvedError, controlId: controlIdFor(name) }
}

export interface FieldShellProps {
  readonly label: string
  readonly controlId: string
  readonly hint?: string | undefined
  readonly error?: string | undefined
  readonly required?: boolean | undefined
  readonly children: ReactNode
}

/**
 * The label/hint/error chrome every field in `fields/*` renders through —
 * one place computing the hint/error ids and the visible error text, so the
 * seven field components differ only in the input they wrap.
 *
 * DEBT D6 (task brief: "six primitives measured as not theme-aware ...
 * Field, Select and Checkbox are exactly what a form layer would reach
 * for. Do not reach for them"): this is a second implementation of
 * `src/ui/primitives/Field.tsx`'s label/description/error job, built on
 * the token layer instead. Necessary now — migrating that primitive is out
 * of this task's scope — and it WILL need reconciling with whichever task
 * migrates `Field` onto this token layer.
 */
export function FieldShell({ label, controlId, hint, error, required = false, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={controlId} className={`text-sm font-medium ${textColor('ink')}`}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint !== undefined ? (
        <p id={hintIdFor(controlId)} className={`text-xs ${textColor('ink-muted')}`}>
          {hint}
        </p>
      ) : null}
      {error !== undefined ? (
        <p id={errorIdFor(controlId)} className={`text-xs font-medium ${statusText('danger')}`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** `aria-describedby` for a field, computed the one way both `FieldShell`
 *  (which renders the ids) and every field component (which must point at
 *  them) agree on. */
export function describedByFor(controlId: string, hasHint: boolean, hasError: boolean): string | undefined {
  const parts = [hasHint ? hintIdFor(controlId) : null, hasError ? errorIdFor(controlId) : null].filter(
    (p): p is string => p !== null,
  )
  return parts.length > 0 ? parts.join(' ') : undefined
}

function flattenZodErrors(error: { readonly issues: readonly { path: readonly PropertyKey[]; message: string }[] }): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(form)'
    const existing = out[key] ?? []
    existing.push(issue.message)
    out[key] = existing
  }
  return out
}

export function Form<T>({ schema, initial, onSubmit, children, submitLabel }: FormProps<T>) {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({ ...initial }))
  const [errors, setErrors] = useState<Record<string, readonly string[]>>({})
  // FIX ROUND 1 (Important finding #3): a MONOTONIC counter, not a boolean.
  // `submitAttempted` (`false -> true`, then permanently `true`) cannot
  // distinguish "just submitted" from "submitted a while ago" on a second
  // click that happens to fail with the same NUMBER of errors as the
  // first — `errorCount` was the old (broken) second dependency, and two
  // different failing field sets can share a count. A count that increments
  // on every submit attempt is guaranteed to differ every time, regardless
  // of what the error set looks like.
  const [submitAttempt, setSubmitAttempt] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<WriteResult<unknown> | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // Depends on `submitAttempt` ALONE — `errors` itself is read from this
  // render's closure, not as a dependency, which is correct here: React
  // batches `setSubmitAttempt`/`setErrors` from the same `handleSubmit` call
  // into one commit, so the effect that runs after `submitAttempt` changes
  // always sees the `errors` that was set alongside it.
  useEffect(() => {
    if (submitAttempt > 0 && Object.keys(errors).length > 0) summaryRef.current?.focus()
  }, [submitAttempt])

  useEffect(() => {
    if (result !== null) resultRef.current?.focus()
  }, [result])

  const setValue = (name: string, value: unknown): void => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const ctxValue: FormContextValue = { values, setValue, errors }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setSubmitAttempt((n) => n + 1)
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error))
      setResult(null)
      return
    }
    setErrors({})
    setSubmitting(true)
    const outcome = await Promise.resolve(onSubmit(parsed.data))
    setSubmitting(false)
    setResult(outcome)
    // Property: values are never cleared on a denial or a persistence
    // failure — only `values` state drives every field, and nothing here
    // resets it on either failure arm. A success also leaves it as-is; the
    // caller (which owns navigation) decides what happens next.
  }

  // Minor finding #1: a root-level zod issue (an unrecognized top-level key
  // on a `.strict()` schema, `path: []`) keys as `'(form)'` in `errors` —
  // no field carries `id="field-(form)"`, so that entry must render as
  // plain text, never a dead link a click silently no-ops on.
  const summaryEntries: ErrorSummaryEntry[] = Object.entries(errors).flatMap(([name, msgs]) =>
    msgs.map((message) => (name === '(form)' ? { message } : { message, fieldId: controlIdFor(name) })),
  )

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void handleSubmit(e)
      }}
      className="flex flex-col gap-4"
    >
      {submitAttempt > 0 && summaryEntries.length > 0 ? (
        <ErrorSummary ref={summaryRef} title="There is a problem" entries={summaryEntries} />
      ) : null}

      {result !== null && !result.ok ? (
        <div
          ref={resultRef}
          role="alert"
          tabIndex={-1}
          data-control-id="write-result-failure"
          className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('surface')} p-4 focus:outline-none`}
        >
          {/* Property 3: the DECISION's plain-language `explain`, never
              `result.reason` (the code) — and the two failure kinds render
              distinctly (different heading), because "you may not do this"
              and "this could not be made durable" call for different
              recourse (brief, "The three results, and why each needs its
              own treatment"). */}
          <p className={`font-semibold ${textColor('ink')}`}>
            {result.kind === 'denied' ? 'This action is not permitted' : 'This could not be saved'}
          </p>
          <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>{result.explain}</p>
        </div>
      ) : null}

      {result !== null && result.ok ? (
        <div
          ref={resultRef}
          role="status"
          tabIndex={-1}
          data-control-id="write-result-success"
          className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('surface')} p-4 focus:outline-none`}
        >
          <p className={`font-semibold ${statusText('ok')}`}>Saved.</p>
        </div>
      ) : null}

      <FormContext.Provider value={ctxValue}>{children}</FormContext.Provider>

      <button
        type="submit"
        data-control-id="form-submit"
        aria-disabled={submitting ? 'true' : undefined}
        className={`self-start ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium ${textColor('accent-ink')} disabled:opacity-50`}
        disabled={submitting}
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
