import {
  STORYBOARD_CARD_CLASSIFICATION,
  STORYBOARD_CARD_CLASSIFICATION_REF,
  storyboardCardProvenance,
  storyboardCardRows,
  type Storyboard,
} from '@/ai/storyboards/contract'
import { storyboardViolations } from '@/ai/storyboards/invariants'
import { GUIDANCE_ELEMENT_ATTRIBUTE } from '@/ai/provenance/contract'
import { ProvenanceMark } from '@/ui/shared/ProvenanceMark'
import { JOURNEY_SURFACES, effectStatement } from '@/ui/shared/journey'

/**
 * THE ONE RENDERER FOR A §44A STORYBOARD, ON ANY SURFACE.
 *
 * Thirty storyboards, one nineteen-field card each and one five-row surface
 * reaction each, all sixty tables measured byte-identical in their field names.
 * Three tasks author the content ten at a time; if each also wrote its own
 * renderer, three readings of six prose prohibitions would become three
 * different screens. So there is one component and it takes one `Storyboard`.
 *
 * ── IT RENDERS ALL NINETEEN, ALWAYS ────────────────────────────────────────
 * `storyboardCardRows` maps the schema, not the data, so there is no branch on
 * which a field can go missing. A field with nothing to say says that in words
 * in its own row — which is the same rule as the five-surface panel's, where a
 * surface with no effect renders "No direct effect" WITH the reason rather than
 * a blank cell.
 *
 * ── WHY IT DOES NOT USE `FiveSurfaceEffects` ───────────────────────────────
 * That component renders a JOURNEY STEP: its heading reads "Step N — title"
 * and its record wants a `workflowRef`, an `ownerModule` and an
 * `actingSurface`. A storyboard is not a journey step and has no acting
 * surface — several of the thirty are platform-wide outages with no actor at
 * all — so composing one would mean inventing three fields to satisfy a
 * heading that would then be wrong. What IS reused is the part that carries the
 * rule: `JOURNEY_SURFACES` for the tuple and its order, and `effectStatement`
 * for the sentence, so the "No direct effect — <reason>" wording is the same
 * string on this card as on every journey panel in the build.
 *
 * ── ONE PROVENANCE CLASS, RESOLVED ─────────────────────────────────────────
 * Exactly one `ProvenanceMark` renders, at the head of the card, and no other
 * path here emits a class. It is `PROV-3` — approved content authored and
 * released earlier — resolved from `STORYBOARD_CARD_FACTS` rather than pinned.
 * The card's locator is passed as the content version, which `PROV-3`'s own
 * contract row permits and which is the honest version of a transcription: the
 * line it was read from.
 *
 * ── A BREACH RENDERS ───────────────────────────────────────────────────────
 * Every invariant in `STORYBOARD_INVARIANTS` runs at render time — the whole
 * list, never a chosen subset — and their violations render in an alert above
 * the card. No count is written here, so a tenth invariant renders the day it
 * is registered. This is a storyboard-rendering surface: a contract
 * breach that shows nothing is the one thing it must not do, and a check whose
 * only consumer is a test suite is a check that stops at the suite.
 *
 * ── NO CONTROL, AND NO CLIENT BOUNDARY ─────────────────────────────────────
 * A card is a reading surface. It offers no button, no input and no retry —
 * the last of those is a prohibition in its own right at L92843, and the
 * safest way to honour "no retry control against a known-offline state" is a
 * component with no control at all. Nothing to act through means no state and
 * no handler, so this is a server component and carries no `'use client'`.
 *
 * ── IT IS MOUNTED NOW, AND THIS PARAGRAPH IS THE CLOSURE IT ASKED FOR ──────
 * This paragraph used to record, as a deliberate wave-0 abstention, that no
 * route rendered this component, and it ended by asking whoever mounted the
 * first storyboard to close it. Tasks 16, 17 and 18 mounted it and none of
 * them came back, so the abstention outlived its own truth — the same defect
 * class as a stale count on a screen, in the one kind of paragraph written
 * specifically to prevent it, and the SECOND time this build has shipped it:
 * `src/ui/shared/ProvenanceMark.tsx` carried the identical shape and was
 * closed earlier in this slice.
 *
 * THE MOUNT IS `app/workflows/ai-and-its-absence/AiAndItsAbsenceScreen.tsx`,
 * which renders one card per storyboard on `/workflows/ai-and-its-absence/`.
 * `app/workflows/WorkflowIndex.tsx` links that route, so the cards are
 * reachable by navigation and not only by typing a URL.
 *
 * NO COUNT IS WRITTEN HERE, deliberately: the number of cards on that page is
 * the length of a register that moves, and a figure transcribed into prose is
 * what goes stale. What matters to a reader of this file is that it is reached
 * from a route at all — and that the claim is made by a gate rather than by a
 * sentence nobody re-measures.
 * `tests/component/storyboard-card-reachability.test.tsx` sweeps `app/` for the
 * MOUNT rather than for the import edge, and requires every mounting file it
 * finds to be named in this paragraph — so the next task to mount a card on a
 * second route goes red here until it writes the path above. An import edge is
 * not a mount: this build planted the deletion of a panel's JSX with its
 * import left in place and the import-closure gate stayed green at 54 of 54.
 */
export interface StoryboardCardProps {
  readonly storyboard: Storyboard
}

export function StoryboardCard({ storyboard }: StoryboardCardProps) {
  const rows = storyboardCardRows(storyboard)
  const violations = storyboardViolations(storyboard)

  return (
    <article
      aria-label={`Storyboard ${storyboard.identifier}`}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      {...{ [GUIDANCE_ELEMENT_ATTRIBUTE]: 'storyboard-card' }}
    >
      <header>
        <h2 className="text-base font-semibold text-[var(--color-ink)]">
          Storyboard {storyboard.number} — {storyboard.identifier}
        </h2>
        <p
          data-testid="storyboard-fallback-key"
          className="mt-1 text-xs text-[var(--color-ink-subtle)]"
        >
          {/* The chapter travels with the literal, always. Sixteen `FB-AI-*`
              literals name a chapter-40 contract AND a storyboard, so a bare
              literal on screen has not said which contract it means. */}
          Fallback contract {storyboard.fallback.chapter} · {storyboard.fallback.identifier}
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          {storyboard.cardHeaderRef} · five-surface reaction {storyboard.surfaceTableRef}
        </p>
        {/* L92766, the chapter's own classification of the field set. Rendered
            rather than only exported: a citation nobody can reach is a record
            whose only consumer is its own declaration. */}
        <p
          data-testid="storyboard-field-set-classification"
          className="mt-1 text-xs text-[var(--color-ink-subtle)]"
        >
          Field set — {STORYBOARD_CARD_CLASSIFICATION} {STORYBOARD_CARD_CLASSIFICATION_REF}
        </p>
      </header>

      <div className="mt-3">
        <ProvenanceMark
          classId={storyboardCardProvenance()}
          contentVersion={storyboard.cardHeaderRef}
        />
      </div>

      {violations.length === 0 ? null : (
        <div
          role="alert"
          className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-sm"
        >
          <p className="font-semibold text-[var(--color-ink)]">
            This storyboard breaks the chapter&apos;s render-time rules.
          </p>
          <ul className="mt-1 space-y-1 text-[var(--color-ink-muted)]">
            {violations.map((breach, index) => (
              <li key={`${breach.invariant}-${index}`}>
                {breach.message}{' '}
                <span className="text-xs text-[var(--color-ink-subtle)]">{breach.sourceRef}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AC-44A-005 (L92750): a presumed-absent capability is declared BEFORE
          the behaviour is described, so this sits above the field table and
          not in a footnote. */}
      {storyboard.absentCapability === null ? null : (
        <p
          data-testid="storyboard-absent-capability"
          className="mt-3 border-l-2 border-[var(--color-border-strong)] pl-3 text-sm text-[var(--color-ink)]"
        >
          {storyboard.absentCapability.statement}{' '}
          <span className="text-xs text-[var(--color-ink-subtle)]">
            {storyboard.absentCapability.sourceRef}
          </span>
        </p>
      )}

      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.id} data-storyboard-field={row.id} className="text-sm">
            <dt className="font-medium text-[var(--color-ink)]">{row.label}</dt>
            <dd className="mt-0.5 text-[var(--color-ink-muted)]">{row.content}</dd>
          </div>
        ))}
      </dl>

      {/* DELIBERATELY UNNAMED, AND SO DELIBERATELY NOT A LANDMARK. These two
          blocks used to carry `aria-label="Five-surface reaction"` and
          `aria-label="Audit trail and reconstruction"`. A NAMED `<section>` is
          a `region` landmark, so on the thirty-card index at
          `/workflows/ai-and-its-absence/` each of those names appeared thirty
          times and axe `landmark-unique` fired. Making them unique per card
          was the wrong repair: it would have kept sixty extra landmarks in the
          landmark list of one page for no reader benefit. The `<h3>` below
          already labels the group, and the enclosing
          `<article aria-label="Storyboard SB-AI-NN">` is what a reader
          navigates by. One edit here covers all thirty cards. */}
      <section className="mt-4">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Five-surface reaction</h3>
        <dl className="mt-2 space-y-3">
          {JOURNEY_SURFACES.map((surface) => {
            const effect = storyboard.surfaces[surface.code]
            const absent = effect.kind === 'noDirectEffect'
            return (
              <div key={surface.code} data-storyboard-surface={surface.code} className="text-sm">
                <dt className="font-medium text-[var(--color-ink)]">{surface.name}</dt>
                <dd
                  className={
                    absent
                      ? 'mt-0.5 italic text-[var(--color-ink-muted)]'
                      : 'mt-0.5 text-[var(--color-ink-muted)]'
                  }
                >
                  {effectStatement(effect)}{' '}
                  <span className="text-xs not-italic text-[var(--color-ink-subtle)]">
                    {effect.sourceRef}
                  </span>
                </dd>
              </div>
            )
          })}
        </dl>
      </section>

      {/* AC-44A-004 (L92749): the final official state is derivable from the
          audit log alone, so the audit events it is reconstructed from are
          rendered as identified events rather than folded into the prose row
          above. A reader can do the reconstruction the criterion describes. */}
      <section className="mt-4">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          Final official state, reconstructed
        </h3>
        <p className="mt-1 text-sm text-[var(--color-ink)]">
          {storyboard.finalOfficialState.name}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {storyboard.audit.map((event) => (
            <li key={event.id} data-storyboard-audit-event={event.id}>
              {storyboard.finalOfficialState.derivedFrom.includes(event.id) ? '→ ' : ''}
              {event.statement}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">{event.sourceRef}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
