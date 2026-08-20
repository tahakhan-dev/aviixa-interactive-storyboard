'use client'

import { useState } from 'react'
import { JOURNEY_STEPS, journeyStep, type JourneyStep } from '@/studio/journey/effects'
import {
  FB_SEQ_012,
  fbSeq012TerminalState,
  type JourneyState,
} from '@/studio/journey/fixture'
import { STU_MODULES, stuModuleById } from '@/studio/modules'
import { FiveSurfaceEffects } from '@/ui/stu/FiveSurfaceEffects'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import {
  JOURNEY_FOLD,
  JOURNEY_STATES,
  compositionForStep,
  refusalForStep,
  type ComposedSeam,
} from './composition'

/**
 * The Workflow Builder journey, end to end — the master prompt's *real
 * interactive authoring journey rather than a picture*.
 *
 * WHAT MAKES IT REAL RATHER THAN A PICTURE. Each of the twenty-two steps
 * renders the ACTUAL module route the act is performed on, whole and
 * interactive: `MOD-STU-04`'s Builder, `MOD-STU-11`'s Approval Queue,
 * `MOD-STU-12`'s version history. This file draws the journey around them and
 * nothing they already draw. It offers no authoring control of its own,
 * because every authoring control already exists one component away, and a
 * second copy is a control that can disagree with the first.
 *
 * EXACTLY ONE `<main>` AND EXACTLY ONE `<h1>`, ON EVERY STEP. The composed
 * route brings its own `StudioShell`, which is a `<main id="main">` with the
 * module's registry name as its `<h1>`. So the journey's own chrome is a
 * `<complementary>` landmark with an `<h2>`, and step 19 — which composes no
 * route, because its act is another surface's — supplies the one `<main>` and
 * the one `<h1>` itself. `tests/accessibility/axe.spec.ts` asserts exactly
 * one `<h1>` on every exported route, and `tests/component/stu-journey.test.tsx`
 * runs axe over all twenty-two of these steps.
 */

export interface JourneyScreenProps {
  /** Which step opens. Owned by the caller so a test can render any step. */
  readonly initialStep?: number
}

const FIRST_STEP = JOURNEY_STEPS[0]!.number

function StateLine({
  label,
  state,
}: {
  readonly label: string
  readonly state: JourneyState | undefined
}) {
  return (
    <span>
      {label} <strong className="font-medium">{state?.sequenceState ?? 'not reached'}</strong>
    </span>
  )
}

/**
 * Step 19. The Studio STATES this act and never offers it: the pin is written
 * in the Delivery Operations Hub at run assignment, and `MOD-DOH-06` owns it
 * in slice 6. There is no button here whose token could be read as a build.
 */
function SeamStep({ step, composed }: { readonly step: JourneyStep; readonly composed: ComposedSeam }) {
  const pin = JOURNEY_STATES[step.number]?.hubPin
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">{step.title}</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        This step is not performed in the Standards and Operations Studio. It is stated here and
        offered nowhere: the act belongs to {composed.moduleId}, and no build fires on this surface.
      </p>
      <div className="mt-6">
        <StudioSeamNotice seam={composed.seam} />
      </div>
      {pin === null || pin === undefined ? null : (
        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Run</dt>
            <dd className="text-[var(--color-ink-muted)]">{pin.runId}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Pinned version</dt>
            <dd className="text-[var(--color-ink-muted)]">{pin.version}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Device readiness</dt>
            <dd className="text-[var(--color-ink-muted)]">
              {pin.deviceReadiness} — the pin is written before the download, so a pin is not a
              delivery and a delivery is not an execution (L53677).
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Owned by</dt>
            <dd className="text-[var(--color-ink-muted)]">{pin.ownedBy}</dd>
          </div>
        </dl>
      )}
    </main>
  )
}

export function JourneyScreen({ initialStep = FIRST_STEP }: JourneyScreenProps) {
  const [stepNumber, setStepNumber] = useState(initialStep)
  const [branch, setBranch] = useState(false)

  const step = journeyStep(stepNumber) ?? JOURNEY_STEPS[0]!
  const composed = compositionForStep(step.number)
  const refusal = refusalForStep(step.number)
  const before = JOURNEY_STATES[step.number - 1]
  const after = JOURNEY_STATES[step.number]

  if (!JOURNEY_FOLD.ok) {
    return (
      <main id="main" className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Workflow Builder journey — SEQ-011</h1>
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
        aria-label="Workflow Builder journey"
        className="mx-auto max-w-5xl px-6 pt-12"
      >
        <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
          Workflow Builder journey — SEQ-011
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Twenty-two steps from an empty workspace to a published, packaged, pinned, superseded,
          rolled-back and archived Workflow. Each step opens the real module route the act is
          performed on. Nothing on this page is a second copy of a control that route already
          offers.
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
                    onClick={() => {
                      setStepNumber(s.number)
                      setBranch(false)
                    }}
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

        <p data-testid="sequence-state" className="mt-6 text-sm text-[var(--color-ink-muted)]">
          <StateLine label="Sequence state before:" state={before} /> →{' '}
          <StateLine label="after:" state={after} />
        </p>

        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {composed === null || composed.kind === 'seam' ? (
            <>
              Performed on another surface — {composed?.moduleId ?? 'unknown'}. No Studio route is
              composed for this step.
            </>
          ) : (
            <>
              Performed on {stuModuleById(STU_MODULES, composed.hostModuleId).name} —{' '}
              <code>{composed.href}</code>, composed below.
            </>
          )}
        </p>

        {composed !== null && composed.kind === 'route' && composed.hostNote !== null ? (
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The act is {composed.moduleId}&rsquo;s.{' '}
            {stuModuleById(STU_MODULES, composed.moduleId).name} has no route of its own, and says
            why: {composed.hostNote}
          </p>
        ) : null}

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

        {step.number === FB_SEQ_012.branchesFromStep ? (
          <section
            aria-label="FB-SEQ-012 — the one-person quality team"
            className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
          >
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              {FB_SEQ_012.id} — the one-person quality team
            </h3>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              {FB_SEQ_012.primaryFailure}. {FB_SEQ_012.detection}.
            </p>
            <button
              type="button"
              onClick={() => setBranch((b) => !b)}
              aria-expanded={branch}
              className="mt-3 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-1 text-sm font-medium text-[var(--color-ink)]"
            >
              {branch ? 'Close the' : 'Follow the'} one-person quality team branch
            </button>
            {branch ? <FbSeq012Branch /> : null}
          </section>
        ) : null}
      </aside>

      <div data-testid="composed-route">
        {composed === null ? null : composed.kind === 'seam' ? (
          <SeamStep step={step} composed={composed} />
        ) : (
          <composed.Screen />
        )}
      </div>
    </div>
  )
}

/**
 * The branch, derived from the state step 12 produced rather than written
 * down beside it — so it cannot drift from the journey it branches out of.
 * The terminal safe state is shown as STATE (no version, no package, no pin)
 * as well as in words, because "nothing publishes" is a claim and an empty
 * version register is the evidence for it.
 */
function FbSeq012Branch() {
  const afterSubmit = JOURNEY_STATES[FB_SEQ_012.branchesFromStep]
  if (afterSubmit === undefined) {
    return (
      <p role="alert" className="mt-3 text-sm">
        The journey never reached step {FB_SEQ_012.branchesFromStep}, so this branch has no state to
        branch from.
      </p>
    )
  }
  const terminal = fbSeq012TerminalState(afterSubmit)
  return (
    <div data-testid="fb-seq-012" className="mt-3 space-y-2 text-sm">
      <p className="text-[var(--color-ink-muted)]">
        First fallback: {FB_SEQ_012.firstFallback}. It fails too — {FB_SEQ_012.fallbackFailure}.
      </p>
      <p className="text-[var(--color-ink)]">
        Terminal safe state: {FB_SEQ_012.terminalSafeState}.
      </p>
      <p className="text-[var(--color-ink)]">
        What it proves: {FB_SEQ_012.whatItProves} ({FB_SEQ_012.sourceRef}).
      </p>
      <dl className="grid grid-cols-4 gap-2 text-xs">
        <div>
          <dt className="font-medium text-[var(--color-ink)]">Submission</dt>
          <dd data-testid="fb-seq-012-submission" className="text-[var(--color-ink-muted)]">
            {terminal.submission?.status ?? 'none'}
            {terminal.submission?.stalled === true ? ', stalled' : ''}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">Versions</dt>
          <dd data-testid="fb-seq-012-versions" className="text-[var(--color-ink-muted)]">
            {terminal.versions.length}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">Work packages</dt>
          <dd data-testid="fb-seq-012-packages" className="text-[var(--color-ink-muted)]">
            {terminal.workPackages.length}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">Hub pin</dt>
          <dd data-testid="fb-seq-012-pin" className="text-[var(--color-ink-muted)]">
            {terminal.hubPin === null ? 'none' : terminal.hubPin.version}
          </dd>
        </div>
      </dl>
    </div>
  )
}
