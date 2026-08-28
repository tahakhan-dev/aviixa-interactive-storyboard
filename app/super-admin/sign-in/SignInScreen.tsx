'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { NOT_REAL_TEXT } from '@/ui/product/AppShell'
import { controlIdFor } from '@/ui/product/Form'
import { ErrorSummary, type ErrorSummaryEntry } from '@/ui/product/ErrorSummary'
import { TextField } from '@/ui/product/fields/TextField'
import { useProductSession, useRuntimeReady, type SignInOutcome, type StepUpCompletionResult } from '@/ui/product/runtime'
import { bg, borderColor, radiusClass, shadowClass, statusBg, statusText, textColor } from '@/ui/product/tokens'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { StoryboardSignInPanel } from './StoryboardSignInPanel'

/**
 * `SCR-SA` sign-in — the entry point every other Super Admin route
 * redirects a signed-out visitor to (the redirect itself is Task 3's; this
 * task builds only the screen it redirects to).
 *
 * A REAL SCREEN, NOT A DOCUMENT ABOUT ONE. Master prompt §8.6.2's three
 * litmus tests (Figma test, screenshot test, deletion test) are why this
 * file contains no numbered happy-path steps, no line-locator citations
 * printed as content, and no bullet list standing in for a control — every
 * citation below is in a comment, and every visible line of copy is either
 * a label, a real validation message, or a plain-language account-state
 * explanation a paying tenant's IT admin would actually be shown.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(value: string): string | undefined {
  if (value.trim().length === 0) return 'Enter your work email address.'
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address.'
  return undefined
}

function validatePassword(value: string): string | undefined {
  // `session.ts#resolveSignIn`'s own comment states the rest: no password
  // is ever checked against anything for an active account — any
  // non-empty string is accepted. That is a storyboard fact, disclosed
  // there and in the "Storyboard sign-in" panel below (a demo affordance),
  // never as a caveat printed on this card — a real sign-in card never
  // tells you how weak its own check is.
  if (value.length === 0) return 'Enter your password.'
  return undefined
}

function humanizeLifecycle(lifecycle: string): string {
  const spaced = lifecycle.replace(/-/g, ' ')
  return spaced.length === 0 ? spaced : spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

interface FieldErrors {
  readonly email?: string | undefined
  readonly password?: string | undefined
}

export function SignInScreen() {
  const router = useRouter()
  const session = useProductSession()
  const ready = useRuntimeReady()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)
  const [outcome, setOutcome] = useState<SignInOutcome | null>(null)
  const [stepUpResult, setStepUpResult] = useState<StepUpCompletionResult | null>(null)
  const [stepUpPending, setStepUpPending] = useState(false)
  // Bumped exactly at the two moments the summary/outcome region must take
  // focus: an immediate client-validation failure, and an
  // `invalid-credentials` result arriving after the simulated pending
  // delay. A monotonic counter, not a boolean, for the same reason
  // `Form.tsx`'s own `submitAttempt` is one (fix round 1 there): two
  // failures in a row must still refire the effect even when nothing about
  // the error set changed.
  const [focusSignal, setFocusSignal] = useState(0)

  const summaryRef = useRef<HTMLDivElement>(null)
  const outcomeRef = useRef<HTMLDivElement>(null)
  const pendingTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (focusSignal > 0) summaryRef.current?.focus()
  }, [focusSignal])

  useEffect(() => {
    if (outcome !== null && outcome.kind !== 'invalid-credentials' && outcome.kind !== 'signed-in') {
      outcomeRef.current?.focus()
    }
  }, [outcome])

  // Cleanup only — never a dependency on `pending`/`outcome` (that would
  // re-subscribe on every keystroke-driven re-render); this exists purely
  // so a submit-in-flight timeout is cancelled if the screen unmounts
  // before it fires.
  useEffect(
    () => () => {
      if (pendingTimeoutRef.current !== null) window.clearTimeout(pendingTimeoutRef.current)
    },
    [],
  )

  function clearOutcomeOnEdit(): void {
    if (outcome !== null) {
      setOutcome(null)
      setStepUpResult(null)
    }
  }

  function handleEmailChange(next: string): void {
    setEmail(next)
    clearOutcomeOnEdit()
    if (touched.email) setFieldErrors((prev) => ({ ...prev, email: validateEmail(next) }))
  }

  function handlePasswordChange(next: string): void {
    setPassword(next)
    clearOutcomeOnEdit()
    if (touched.password) setFieldErrors((prev) => ({ ...prev, password: validatePassword(next) }))
  }

  function handleEmailBlur(): void {
    setTouched((prev) => ({ ...prev, email: true }))
    setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))
  }

  function handlePasswordBlur(): void {
    setTouched((prev) => ({ ...prev, password: true }))
    setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }))
  }

  function handleUseIdentity(nextEmail: string): void {
    setEmail(nextEmail)
    setPassword('')
    setTouched({ email: false, password: false })
    setFieldErrors({})
    setOutcome(null)
    setStepUpResult(null)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    if (!ready || pending) return // boot() hasn't resolved yet, or a submit is already in flight.

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    setTouched({ email: true, password: true })
    setFieldErrors({ email: emailError, password: passwordError })

    if (emailError !== undefined || passwordError !== undefined) {
      setOutcome(null)
      setFocusSignal((n) => n + 1)
      return
    }

    setOutcome(null)
    setStepUpResult(null)
    setPending(true)
    // `resolveSignIn` (`@/ui/product/runtime/session.ts`) is a synchronous,
    // pure lookup over already-loaded fixture data — there is no network
    // call here to actually wait on. This delay is presentation only: it
    // makes the submit button's pending state something a reviewer (and a
    // Task 10 tour) can actually observe, rather than a same-tick flash
    // nothing could see. It reads no clock and sets no scenario state, so
    // it is not the simulated-clock the master prompt's "no Date.now()"
    // constraint is about.
    pendingTimeoutRef.current = window.setTimeout(() => {
      const result = session.signIn(email, password)
      setPending(false)
      setOutcome(result)
      if (result.kind === 'invalid-credentials') setFocusSignal((n) => n + 1)
      if (result.kind === 'signed-in') router.push('/super-admin/platform-overview-and-health/')
    }, 350)
  }

  // Task 2 fix round 1 (unit-01, review IMPORTANT 1): routes through the
  // real runtime write (`session.completeStepUp()` ->
  // `session.ts#resolveStepUpCompletion` -> `repository.update`) instead of
  // flipping local `useState` — the confirmation sentence this panel shows
  // is only true once this call has actually landed.
  async function handleConfirmStepUp(): Promise<void> {
    if (stepUpPending) return
    setStepUpPending(true)
    const result = await session.completeStepUp()
    setStepUpPending(false)
    setStepUpResult(result)
    // Denied/persistence-unavailable: fall through — `stepUpResult` now
    // holds the failure, the acknowledgement panel (invariants + a "Try
    // again" control) stays rendered below, and NOTHING navigates. A
    // session appearing when its record could not be written would be the
    // same defect this whole fix round exists to remove, in a new place.
    if (result.kind === 'signed-in') router.push('/super-admin/platform-overview-and-health/')
  }

  const displayedEmailError = touched.email ? fieldErrors.email : undefined
  const displayedPasswordError = touched.password ? fieldErrors.password : undefined

  const summaryEntries: ErrorSummaryEntry[] = []
  if (displayedEmailError !== undefined) {
    summaryEntries.push({ message: displayedEmailError, fieldId: controlIdFor('email') })
  }
  if (displayedPasswordError !== undefined) {
    summaryEntries.push({ message: displayedPasswordError, fieldId: controlIdFor('password') })
  }
  if (outcome?.kind === 'invalid-credentials') {
    // No `fieldId` — R2 (`session.ts`): a link that moved focus to one
    // field over the other would itself disclose which one this storyboard
    // thinks is wrong, which is exactly what "generic, never disclose
    // whether the address exists" forbids.
    summaryEntries.push({ message: 'The email or password you entered is incorrect.' })
  }

  return (
    <div className={`flex min-h-dvh items-center justify-center px-4 py-10 ${bg('sunken')}`} data-surface="SURF-SA">
      <main id="main" className="flex w-full max-w-md flex-col gap-6">
        <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('surface')} ${shadowClass(2)} p-8`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${textColor('ink-subtle')}`}>AVIIXA</p>
          <h1 className={`mt-2 text-2xl font-semibold ${textColor('ink')}`}>Sign in to the platform console</h1>
          <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
            For platform administrators, engineers and support staff.
          </p>

          <p className={`mt-3 max-w-prose text-xs ${textColor('ink-subtle')}`}>{NOT_REAL_TEXT}</p>

          <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {summaryEntries.length > 0 ? (
              <ErrorSummary ref={summaryRef} title="There is a problem" entries={summaryEntries} />
            ) : null}

            {outcome?.kind === 'signed-in' ? (
              <div role="status" className={`text-sm ${textColor('ink-muted')}`}>
                Signed in as {outcome.session.identity}. Loading the platform console…
              </div>
            ) : null}

            <TextField
              name="email"
              label="Work email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              error={displayedEmailError}
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              error={displayedPasswordError}
            />

            <button
              type="submit"
              data-control-id="sign-in-submit"
              aria-busy={pending ? 'true' : undefined}
              disabled={pending || !ready}
              className={`self-start ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium ${textColor('accent-ink')} disabled:opacity-50`}
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
            {!ready ? (
              <p role="status" className={`text-xs ${textColor('ink-subtle')}`}>
                Preparing sign-in…
              </p>
            ) : null}

            {outcome?.kind === 'invitation-pending' ? (
              <div
                ref={outcomeRef}
                role="status"
                tabIndex={-1}
                data-control-id="sign-in-outcome-invitation-pending"
                className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('surface')} p-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]`}
              >
                <p className={`font-semibold ${textColor('ink')}`}>Invitation not yet accepted</p>
                <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
                  {email} has an open invitation to this platform that has not been accepted yet.
                  Sign-in is not available until the invited administrator accepts it. Ask your
                  platform administrator to resend the invitation if it has expired.
                </p>
              </div>
            ) : null}

            {outcome?.kind === 'account-suspended' ? (
              <div
                ref={outcomeRef}
                role="alert"
                tabIndex={-1}
                data-control-id="sign-in-outcome-account-suspended"
                className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('surface')} p-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]`}
              >
                <p className={`font-semibold ${statusText('danger')}`}>Account suspended</p>
                {/* Property: the outcome's OWN `reason` string — the
                    governing authority — never a second, hand-typed copy
                    of it. */}
                <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>{outcome.reason}</p>
              </div>
            ) : null}

            {outcome?.kind === 'tenant-suspended' ? (
              <div
                ref={outcomeRef}
                role="alert"
                tabIndex={-1}
                data-control-id="sign-in-outcome-tenant-suspended"
                className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('surface')} p-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]`}
              >
                <p className={`font-semibold ${statusText('danger')}`}>Tenant account suspended</p>
                <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
                  This account is fine, but its organisation&rsquo;s account is currently{' '}
                  {humanizeLifecycle(outcome.lifecycle).toLowerCase()} (lifecycle: {outcome.lifecycle}
                  ). Contact your platform administrator.
                </p>
              </div>
            ) : null}

            {outcome?.kind === 'step-up-required' ? (
              <div
                ref={outcomeRef}
                role="status"
                tabIndex={-1}
                data-control-id="sign-in-outcome-step-up-required"
                className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('surface')} p-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]`}
              >
                <p className={`font-semibold ${textColor('ink')}`}>Step-up verification required</p>
                <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
                  The Root Super Admin account requires an authenticator step-up before it can sign
                  in. Six platform invariants render locked below — confirm the platform floor
                  register to continue.
                </p>
                {/*
                  WF-ROLE-004 "First root sign-in and the enforced-invariant
                  acknowledgement" (frozen source L55644-L55654): happy
                  path step 1 "The root signs in", step 2 "Platform
                  Settings renders the six enforced invariants as locked",
                  step 3 "The root confirms the platform floor register",
                  step 4 "The session is audited." What follows renders
                  exactly those four steps — `SA_INVARIANTS`
                  (`@/surfaces/sa/invariants`) is the same six-invariant
                  data `PlatformSettingsScreen.tsx` renders, reused rather
                  than re-typed — and Confirm now performs step 4 for real:
                  `session.completeStepUp()` ->
                  `session.ts#resolveStepUpCompletion` writes the root's own
                  `lastSignInAt` through `repository.update`, which appends
                  the audit row atomically (Task 2 fix round 1, review
                  IMPORTANT 1 — this used to be a local `useState` flag
                  claiming a record that was never written).
                */}
                <div className="mt-3 space-y-2">
                  {SA_INVARIANTS.map((invariant) => (
                    <div key={invariant.id} className="flex items-start gap-2">
                      <span
                        className={`shrink-0 ${radiusClass('pill')} ${statusBg('blocked')} ${statusText('blocked')} px-2 py-0.5 text-xs font-medium`}
                      >
                        🔒 ENFORCED
                      </span>
                      <span className={`text-sm ${textColor('ink')}`}>{invariant.name}</span>
                    </div>
                  ))}
                </div>
                {stepUpResult?.kind === 'signed-in' ? (
                  <p role="status" className={`mt-3 text-sm font-medium ${statusText('ok')}`}>
                    Confirmed. This sign-in attempt has been recorded.
                  </p>
                ) : (
                  <>
                    {stepUpResult !== null ? (
                      <div className="mt-3">
                        {/* Property, same shape as `Form.tsx`'s own two
                            failure headings: "you may not do this" and
                            "this could not be made durable" are different
                            recourse, so they read distinctly. */}
                        <p className={`text-sm font-semibold ${statusText('danger')}`}>
                          {stepUpResult.kind === 'denied'
                            ? 'This acknowledgement could not be completed'
                            : 'This could not be recorded'}
                        </p>
                        <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>{stepUpResult.explain}</p>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      data-control-id="sign-in-stepup-confirm"
                      aria-busy={stepUpPending ? 'true' : undefined}
                      disabled={stepUpPending}
                      onClick={() => {
                        void handleConfirmStepUp()
                      }}
                      className={`mt-3 ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium ${textColor('accent-ink')} disabled:opacity-50`}
                    >
                      {stepUpPending ? 'Confirming…' : stepUpResult !== null ? 'Try again' : 'Confirm the platform floor register'}
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </form>
        </div>

        <StoryboardSignInPanel onSelect={handleUseIdentity} />
      </main>
    </div>
  )
}
