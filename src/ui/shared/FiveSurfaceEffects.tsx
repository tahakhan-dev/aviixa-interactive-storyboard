import {
  JOURNEY_SURFACES,
  effectStatement,
  type JourneyStep,
  type JourneySurfaceCode,
} from '@/studio/journey/effects'

/**
 * The five-surface effect panel for one journey step.
 *
 * The rule this renders: an action's effect is visible on **every surface it
 * touches, and honestly absent on the ones it does not**. A surface with no
 * effect renders "No direct effect" **with the reason** — an omission or a
 * blank cell would be the defect this component exists to prevent, and the
 * data model makes an empty statement impossible rather than merely
 * discouraged (`effectStatement` always returns a sentence).
 *
 * This component holds no policy: it renders the step record it is handed
 * and computes nothing about who may do what.
 */
export interface FiveSurfaceEffectsProps {
  readonly step: JourneyStep
}

export function FiveSurfaceEffects({ step }: FiveSurfaceEffectsProps) {
  return (
    <section
      aria-label={`Five-surface effects for step ${step.number}: ${step.title}`}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">
        Step {step.number} — {step.title}
        {step.wfAut === null ? null : (
          <span className="ml-2 font-normal text-[var(--color-ink-subtle)]">{step.wfAut}</span>
        )}
      </h3>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        Acted on by {step.ownerModule} · {step.sourceRef}
      </p>

      <dl className="mt-3 space-y-3">
        {JOURNEY_SURFACES.map((surface) => {
          const effect = step.effects[surface.code as JourneySurfaceCode]
          const absent = effect.kind === 'noDirectEffect'
          return (
            <div key={surface.code} data-testid={`effect-${surface.code}`} className="text-sm">
              <dt className="font-medium text-[var(--color-ink)]">
                {surface.name}{' '}
                <span className="text-[var(--color-ink-subtle)]">({surface.code})</span>
              </dt>
              <dd
                className={
                  absent
                    ? 'mt-0.5 text-[var(--color-ink-muted)] italic'
                    : 'mt-0.5 text-[var(--color-ink)]'
                }
              >
                {effectStatement(effect)}{' '}
                <span className="not-italic text-xs text-[var(--color-ink-subtle)]">
                  {effect.sourceRef}
                </span>
              </dd>
            </div>
          )
        })}
      </dl>

      {step.note === null ? null : (
        <p className="mt-3 border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-ink-muted)]">
          {step.note}
        </p>
      )}
    </section>
  )
}
