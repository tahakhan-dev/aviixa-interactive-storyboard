'use client'

import { useState } from 'react'
import { CrossSurfaceStatement } from '@/ui/doh/CrossSurfaceStatement'
import { FiveSurfaceEffects } from '@/ui/shared/FiveSurfaceEffects'
import type { ClosingPosition } from '@/surfaces/doh/modules/doh-06/matrix'
import { JOURNEY_STEPS, journeyStep } from './effects'
import { INSTANT_LABEL, JOURNEY_RUN_ID, type HubJourneyState } from './fixture'
import {
  BLANK_CLOSURE_NOTE_VALIDATION,
  EXECUTION_STATEMENT,
  JOURNEY_FOLD,
  JOURNEY_STATES,
  SETTLEMENT_CHECKS,
  compositionForStep,
  positionAtStep,
  readingsAtStep,
  refusalForStep,
} from './composition'

/**
 * The operational journey, end to end — a Job drafted, approved by a second
 * person, a run scheduled, a worker assigned, the package pinned, the shift
 * run, the Summary computed, an anomaly resolved, the record closed.
 *
 * WHAT MAKES IT REAL RATHER THAN A PICTURE. Each step renders the ACTUAL Hub
 * module route the act is performed on, whole and interactive: `MOD-DOH-05`'s
 * Job lifecycle and its approval queue, `MOD-DOH-06`'s run board and its pin
 * panel, `MOD-DOH-07`'s assignment screen, `MOD-DOH-08`'s review queue. This
 * file draws the journey around them and nothing they already draw. It offers
 * no operational control of its own, because every one already exists a
 * component away and a second copy is a control that can disagree with the
 * first.
 *
 * EXACTLY ONE `<main>` AND EXACTLY ONE `<h1>`, ON EVERY STEP. The composed
 * route brings its own `HubShell`, which is a `<main id="main">` with the
 * module's or the screen's name as its `<h1>`. So the journey's own chrome is
 * a `<complementary>` landmark with an `<h2>`, and step 6 — which composes no
 * route, because its act is the Frontline Worker Application's — supplies the
 * one `<main>` and the one `<h1>` itself.
 *
 * NOTHING HERE NAMES A CLOSING STATE. The position line below prints what
 * `closingPosition` returns, and inside the span the source's three Parts
 * dispute that is the word `disputed` followed by all three readings. There is
 * no branch in this file on `submitted` or on `complete`.
 */

export interface JourneyScreenProps {
  /** Which step opens. Owned by the caller so a test can render any step. */
  readonly initialStep?: number
}

const FIRST_STEP = JOURNEY_STEPS[0]!.number

/** The position, in words, without ever choosing one of the disputed two. */
function positionLabel(position: ClosingPosition | null): string {
  if (position === null) return 'no run yet'
  return position.kind === 'undisputed'
    ? position.position
    : 'disputed — three readings, no winner'
}

function PositionLine({
  label,
  position,
}: {
  readonly label: string
  readonly position: ClosingPosition | null
}) {
  return (
    <span>
      {label} <strong className="font-medium">{positionLabel(position)}</strong>
    </span>
  )
}

/**
 * Step 6. The Hub STATES this act and never offers it: step execution, data
 * capture, offline operation and device modes are row 8 of the eight-row
 * boundary register and belong to the Frontline Worker Application. There is no
 * control here for any part of it, enabled or disabled.
 */
function CrossSurfaceStep({ title, state }: { readonly title: string; readonly state: HubJourneyState | undefined }) {
  const run = state?.run ?? null
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        This step is not performed in the Delivery Operations Hub. It is stated here and offered
        nowhere: the act lives on another surface permanently, and the Hub files every resulting
        capture event as the official record. No control for it exists on this page, enabled or
        disabled.
      </p>
      <div className="mt-6">
        <CrossSurfaceStatement statement={EXECUTION_STATEMENT} />
      </div>
      {run === null ? null : (
        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Run</dt>
            <dd className="text-[var(--color-ink-muted)]">{JOURNEY_RUN_ID}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Pinned work package</dt>
            <dd className="text-[var(--color-ink-muted)]">{run.packagePin}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Package on the device</dt>
            <dd data-testid="package-readiness" className="text-[var(--color-ink-muted)]">
              {run.packageOnDevice
                ? 'held — the run could start'
                : 'assigned-not-ready — a run with a pin but no package must never begin (L53675)'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Workers who have handed in</dt>
            <dd className="text-[var(--color-ink-muted)]">
              {run.workerHandoffs.filter((w) => w.handedOffAtMs !== null).length} of{' '}
              {run.workerHandoffs.length}
            </dd>
          </div>
        </dl>
      )}
    </main>
  )
}

/**
 * The three readings for the journey's run at this step. Rendered wherever they
 * DISAGREE, which is the only place the disclosure does any work — and never
 * with one of them marked as the answer, because none is.
 */
function RunStateReadings({ step }: { readonly step: number }) {
  const readings = readingsAtStep(step)
  if (readings === null) return null
  return (
    <section
      data-testid={`run-state-readings-${step}`}
      aria-label={`DEC-RUNSTATE-001 readings for ${JOURNEY_RUN_ID} at step ${step}`}
      className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
    >
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">
        DEC-RUNSTATE-001 — what each Part calls this run at this instant
      </h3>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        All three readings stand. None is this build&rsquo;s to settle, and this journey adopts none:
        every step reads and writes instants.
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        {readings.map((r) => (
          <div key={r.reading}>
            <dt className="font-medium text-[var(--color-ink)]">Reading {r.reading}</dt>
            <dd className="text-[var(--color-ink-muted)]">
              {r.answer}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">
                Reaches `submitted` {r.submittedReachedTimes} time(s) on this run. [{r.locator}]
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function JourneyScreen({ initialStep = FIRST_STEP }: JourneyScreenProps) {
  const [stepNumber, setStepNumber] = useState(initialStep)
  const [openDecisions, setOpenDecisions] = useState(false)

  const step = journeyStep(stepNumber) ?? JOURNEY_STEPS[0]!
  const composed = compositionForStep(step.number)
  const refusal = refusalForStep(step.number)
  const after = JOURNEY_STATES[step.number]

  if (!JOURNEY_FOLD.ok) {
    return (
      <main id="main" className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Operational journey — Delivery Operations Hub</h1>
        <p role="alert" className="mt-4 max-w-prose text-[var(--color-ink)]">
          The journey does not fold. Step {JOURNEY_FOLD.atStep} could not run from the state its
          predecessor produced: {JOURNEY_FOLD.reason}. Nothing is drawn over a journey that did not
          happen.
        </p>
      </main>
    )
  }

  return (
    <div data-testid="journey-page">
      <aside
        data-testid="journey-chrome"
        aria-label="Operational journey"
        className="mx-auto max-w-5xl px-6 pt-12"
      >
        <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
          Operational journey — a Job to a closed record
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nine steps over one run. A Job is drafted and approved by a second person, a run is
          scheduled, workers are assigned, the work package pins, the shift runs on the device, the
          Execution Summary computes, an anomaly is resolved, and the record closes itself. Each step
          opens the real module route the act is performed on. Nothing on this page is a second copy
          of a control that route already offers.
        </p>

        <nav aria-label="Journey steps" className="mt-6">
          <ol className="flex flex-wrap gap-2">
            {JOURNEY_STEPS.map((s) => {
              const current = s.number === step.number
              return (
                <li key={s.number}>
                  <button
                    type="button"
                    aria-current={current ? 'step' : undefined}
                    onClick={() => setStepNumber(s.number)}
                    className={
                      current
                        ? 'rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] px-3 py-1 text-sm font-semibold text-[var(--color-ink)]'
                        : 'rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-ink-muted)]'
                    }
                  >
                    Step {s.number} — {s.title}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <p data-testid="run-position" className="mt-6 text-sm text-[var(--color-ink-muted)]">
          <PositionLine label="Run position before:" position={positionAtStep(step.number - 1)} /> →{' '}
          <PositionLine label="after:" position={positionAtStep(step.number)} />
          <span className="ml-2 text-xs text-[var(--color-ink-subtle)]">
            Computed from instants at {INSTANT_LABEL[step.number] ?? 'this step'} — never stored, and
            never one of the two words DEC-RUNSTATE-001 disputes.
          </span>
        </p>

        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {composed === null ? (
            <>No route and no statement is composed for this step.</>
          ) : composed.kind === 'cross-surface' ? (
            <>
              Performed on another surface — {composed.moduleId}. No Hub route is composed for this
              step, and no control is offered for it.
            </>
          ) : (
            <>
              Performed on {composed.moduleId} — <code>{composed.href}</code>, composed below.
            </>
          )}
        </p>

        {step.note === null ? null : (
          <p data-testid="step-note" className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {step.note}
          </p>
        )}

        <div className="mt-6">
          <FiveSurfaceEffects step={step} />
        </div>

        {refusal === null ? null : (
          <section
            data-testid={`refusal-${refusal.atStep}`}
            aria-label={`Refusal demonstrated at step ${refusal.atStep}`}
            className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
          >
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Refusal — {refusal.refusal}
            </h3>
            <p className="mt-2 text-sm text-[var(--color-ink)]">{refusal.reason}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">Source: {refusal.sourceRef}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-medium text-[var(--color-ink)]">Attempted</dt>
                <dd className="text-[var(--color-ink-muted)]">{refusal.attempted}</dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--color-ink)]">Outcome</dt>
                <dd className="text-[var(--color-ink)]">{refusal.outcome}</dd>
              </div>
            </dl>
          </section>
        )}

        {step.number === 8 ? (
          <p data-testid="closure-note-validation" className="mt-6 text-sm text-[var(--color-ink)]">
            A blank closure note is refused before any permission question is asked, as a validation
            failure rather than a policy refusal:{' '}
            <strong className="font-medium">
              {BLANK_CLOSURE_NOTE_VALIDATION ?? 'accepted — which would be the defect'}
            </strong>{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">
              L28271 — resolution requires a brief closure note, because auditors require evidence of
              resolution, not just of detection.
            </span>
          </p>
        ) : null}

        <RunStateReadings step={step.number} />

        <section
          aria-label="Open decisions this journey does not settle"
          className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
        >
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Three open decisions, and what keeps each one open here
          </h3>
          <button
            type="button"
            onClick={() => setOpenDecisions((o) => !o)}
            aria-expanded={openDecisions}
            className="mt-3 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-1 text-sm font-medium text-[var(--color-ink)]"
          >
            {openDecisions ? 'Hide' : 'Show'} what this journey does not settle
          </button>
          {openDecisions ? (
            <dl data-testid="settlement-checks" className="mt-3 space-y-3 text-sm">
              {SETTLEMENT_CHECKS.map((check) => (
                <div key={check.id}>
                  <dt className="font-medium text-[var(--color-ink)]">
                    {check.id} — {check.question}
                  </dt>
                  <dd className="mt-0.5 text-[var(--color-ink-muted)]">{check.howItStaysOpen}</dd>
                  <dd
                    data-testid={`settlement-${check.id}`}
                    className="mt-0.5 text-[var(--color-ink)]"
                  >
                    {check.verdict}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      </aside>

      <div data-testid="composed-route">
        {composed === null ? null : composed.kind === 'cross-surface' ? (
          <CrossSurfaceStep title={step.title} state={after} />
        ) : (
          <composed.Screen />
        )}
      </div>
    </div>
  )
}
