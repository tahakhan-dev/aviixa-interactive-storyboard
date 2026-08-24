import Link from 'next/link'
import {
  STORYBOARD_ACCEPTANCE_CRITERIA,
  STORYBOARD_TESTS,
  type Storyboard,
} from '@/ai/storyboards/contract'
import { ownerAt, ownersOf } from '@/ai/fallbacks/registry'
import { PAUSE_FEATURE_ATTRIBUTION } from '@/ai/controls/decisions'
import { StoryboardCard } from '@/ui/shared/StoryboardCard'
import {
  AI_AND_ITS_ABSENCE_ROUTE,
  ALL_THIRTY_STORYBOARDS,
  PAUSE_FEATURE_IDENTIFIERS,
  STORYBOARD_IDENTIFIER_ORDER,
} from './scope'

/**
 * SECTION 44A, ON ONE PAGE, AS THIRTY CARDS A READER CAN GET TO.
 *
 * ── THE STRUCTURE IS THE POINT ─────────────────────────────────────────────
 * Thirty cards of nineteen fields and a five-row surface reaction each is over
 * seven hundred measured rows. A page that long without a way in is a wall, so
 * the index is a real navigation control: one in-page link per storyboard,
 * labelled with that storyboard&rsquo;s own NAMED FALLBACK CONTRACT, which is
 * also how `AC-44A-001` is satisfied where a reader can check it. Every card
 * carries a link back to the index.
 *
 * ── THE PAGE IS DRIVEN BY THE LITERAL INDEX, NOT BY THE DATA ───────────────
 * Both the index and the card sections iterate `STORYBOARD_IDENTIFIER_ORDER`,
 * the literal list in `./scope`, and look the card up by identifier. Iterating
 * the data instead would make a missing card VANISH — the page would render
 * twenty-nine sections and look complete. Driven by the index, a missing card
 * renders as a stated gap in the position it should have occupied.
 *
 * ── ONE ALERT IS EXPECTED, AND IT MUST KEEP APPEARING ──────────────────────
 * Storyboard 25 reports `fixedMessageIsNotParaphrased`, because the Spanish
 * rendering of `SCR-FL-LOCK-01`&rsquo;s fixed message does not exist anywhere in
 * the frozen source while `TEST-44A-004` (L92757) requires the worker-facing
 * message set complete in both languages. `StoryboardCard` renders that breach
 * in an alert. Nothing here filters it, suppresses it, or treats a page with one
 * alert on it as a failure: the only way to silence it would be to omit the
 * fixed message, and omitting the message would silence the one paraphrase
 * prohibition the source actually states (L94876).
 *
 * ── PROVENANCE: THIRTY MARKS, ONE CLASS EACH, AND NONE ON THE CHROME ───────
 * The only guidance elements on this page are the thirty cards. Each is one
 * `data-guidance-element` carrying exactly one `ProvenanceMark`, `PROV-3`
 * &mdash; approved content authored and released earlier &mdash; resolved from
 * `STORYBOARD_CARD_FACTS` rather than pinned. No card is nested inside another
 * element carrying a provenance class, which is its own violation under
 * `AC-42-401`. The chrome below &mdash; the scope statement, the criteria, the
 * index and the collision listing &mdash; carries NO provenance class, because
 * it is documentation about a frozen document rather than guidance shown to a
 * worker, and putting a class on it would classify something the contract does
 * not classify.
 *
 * ── NO CONTROL, AND NOTHING TO ACT THROUGH ─────────────────────────────────
 * A server component. There is no button, no input, no filter and no retry
 * anywhere on it; `AC-43-103`&rsquo;s prohibition on a shared severity rendering
 * is honoured by importing no severity component at all, and operational
 * severity, where the cards carry it, crosses as the plain string the source
 * writes.
 */

const anchorFor = (identifier: string): string => identifier.toLowerCase()

const INDEX_ANCHOR = 'storyboard-index'

/** The card at an identifier, or `null` where the aggregate holds none. */
function cardFor(identifier: string): Storyboard | null {
  return ALL_THIRTY_STORYBOARDS.find((s) => s.identifier === identifier) ?? null
}

/**
 * The storyboard&rsquo;s named fallback contract, read at its COMPOUND key.
 * `ownerAt` takes the section number as well as the literal, because sixteen of
 * these literals name two contracts each and `ownersOf` alone would answer
 * about whichever was registered first.
 */
function namedFallbackContract(storyboard: Storyboard): string {
  const owner = ownerAt(storyboard.fallback.chapter, storyboard.fallback.identifier)
  return owner === null
    ? 'No contract is registered under this compound key, so this storyboard is not traceable to a named fallback contract.'
    : owner.contract
}

export function AiAndItsAbsenceScreen() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-[var(--color-ink)]">
        Artificial intelligence and its absence
      </h1>
      <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
        Section 44A of the frozen source: the required artificial-intelligence and fallback
        storyboards. Every one of the thirty is here in full &mdash; the nineteen fields the card
        carries, the five-surface reaction, the audit events its final official state is
        reconstructed from, and its fallback contract keyed on section and literal.
      </p>

      <p
        data-testid="route-source-status"
        className="mt-4 max-w-prose border-l-2 border-[var(--color-border-strong)] pl-3 text-sm text-[var(--color-ink)]"
      >
        {AI_AND_ITS_ABSENCE_ROUTE.sourceStatus}{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">
          Section span {AI_AND_ITS_ABSENCE_ROUTE.chapterSpan}.
        </span>
      </p>

      <section aria-label="What the chapter requires of all thirty" className="mt-8">
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">
          What the chapter requires of all thirty
        </h2>
        <dl data-testid="chapter-acceptance-criteria" className="mt-3 space-y-3 text-sm">
          {STORYBOARD_ACCEPTANCE_CRITERIA.map((criterion) => (
            <div key={criterion.id} data-chapter-criterion={criterion.id}>
              <dt className="font-medium text-[var(--color-ink)]">
                {criterion.id}{' '}
                <span className="text-xs font-normal text-[var(--color-ink-subtle)]">
                  {criterion.sourceRef}
                </span>
              </dt>
              <dd className="mt-0.5 text-[var(--color-ink-muted)]">{criterion.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The index below is where the first of those is checkable: each entry names the storyboard
          and the fallback contract it traces to, read at the compound key rather than at the bare
          literal. The fourth is checkable on every card, which renders the audit events and marks
          the ones the final official state is reconstructed from. The fifth is checkable by
          position: a storyboard presuming a capability absent from the Statement of Work states
          that above its field table, before any behaviour is described.
        </p>
        <dl data-testid="chapter-tests" className="mt-4 space-y-3 text-sm">
          {STORYBOARD_TESTS.map((test) => (
            <div key={test.id} data-chapter-test={test.id}>
              <dt className="font-medium text-[var(--color-ink)]">
                {test.id}{' '}
                <span className="text-xs font-normal text-[var(--color-ink-subtle)]">
                  {test.sourceRef}
                </span>
              </dt>
              <dd className="mt-0.5 text-[var(--color-ink-muted)]">{test.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav
        id={INDEX_ANCHOR}
        aria-label="The thirty storyboards"
        data-testid="storyboard-index"
        className="mt-8"
      >
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">The thirty, and what each traces to</h2>
        <ol className="mt-3 space-y-1 text-sm">
          {STORYBOARD_IDENTIFIER_ORDER.map((identifier) => {
            const storyboard = cardFor(identifier)
            return (
              <li key={identifier} data-storyboard-index-entry={identifier}>
                <a
                  href={`#${anchorFor(identifier)}`}
                  className="text-[var(--color-ink)] underline"
                >
                  {identifier}
                </a>{' '}
                <span className="text-[var(--color-ink-muted)]">
                  {storyboard === null
                    ? 'No card is registered under this identifier, so this storyboard is not on this page.'
                    : `${storyboard.fallback.chapter} · ${storyboard.fallback.identifier} — ${namedFallbackContract(storyboard)}`}
                </span>
              </li>
            )
          })}
        </ol>
      </nav>

      <section
        aria-label="The compound fallback key, and what a bare literal hides"
        data-testid="fallback-key-collisions"
        className="mt-8"
      >
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">
          Why every key on this page carries its section number
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Chapter 40 and 41 hold a fallback-contract register of their own, and its literals overlap
          this chapter&rsquo;s. Where they overlap, one literal names two unrelated contracts, so a
          flat key would silently merge a storyboard contract into an agentic-layer one. Each card
          renders the compound form. The overlapping literals, and who else claims them:
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {ALL_THIRTY_STORYBOARDS.map((storyboard) => {
            const others = ownersOf(storyboard.fallback.identifier).filter(
              (owner) => owner.chapter !== storyboard.fallback.chapter,
            )
            if (others.length === 0) return null
            return (
              <li
                key={storyboard.identifier}
                data-fallback-collision={storyboard.fallback.identifier}
              >
                <span className="font-medium text-[var(--color-ink)]">
                  {storyboard.fallback.chapter} · {storyboard.fallback.identifier}
                </span>{' '}
                <span className="text-[var(--color-ink-muted)]">
                  on this page is {namedFallbackContract(storyboard)}. The same literal is also
                  claimed by{' '}
                  {others
                    .map((owner) => `${owner.chapter} (${owner.contract}, ${owner.locator})`)
                    .join('; ')}
                  .
                </span>
              </li>
            )
          })}
        </ul>

        <p
          data-testid="emergency-pause-attribution"
          className="mt-4 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          One of those other claimants is worth naming in full, because it is a feature and not a
          register row. The chapter-24 family owner reads &ldquo;Artificial-intelligence degraded or
          unavailable, including the platform emergency pause&rdquo;, and that emergency pause is a
          source-attributed feature of {PAUSE_FEATURE_ATTRIBUTION.module} which declares this very
          literal as its own fallback: {PAUSE_FEATURE_IDENTIFIERS[0]} &ldquo;
          {PAUSE_FEATURE_ATTRIBUTION.feature.name}&rdquo;, {PAUSE_FEATURE_IDENTIFIERS[1]} &ldquo;
          {PAUSE_FEATURE_ATTRIBUTION.subFeature.name}&rdquo;, {PAUSE_FEATURE_IDENTIFIERS[2]} &ldquo;
          {PAUSE_FEATURE_ATTRIBUTION.function.name}&rdquo;, actor{' '}
          {PAUSE_FEATURE_ATTRIBUTION.actor}, classified {PAUSE_FEATURE_ATTRIBUTION.classification}.{' '}
          <span className="text-xs text-[var(--color-ink-subtle)]">
            {PAUSE_FEATURE_ATTRIBUTION.sourceRef}.
          </span>{' '}
          {PAUSE_FEATURE_ATTRIBUTION.whatItDoesNotLicense}
        </p>
      </section>

      <div className="mt-10 space-y-10">
        {STORYBOARD_IDENTIFIER_ORDER.map((identifier) => {
          const storyboard = cardFor(identifier)
          return (
            <section
              key={identifier}
              id={anchorFor(identifier)}
              // Deliberately unnamed. `StoryboardCard`'s own article already
              // carries `aria-label="Storyboard SB-AI-NN"`, and repeating it
              // here would give one card two identically-named regions -- which
              // reads to a screen reader, and to a test, as two things.
              data-storyboard-section={identifier}
            >
              {storyboard === null ? (
                <p role="alert" className="text-sm text-[var(--color-ink)]">
                  {identifier} is named in this chapter&rsquo;s index and no card is registered under
                  it, so the page cannot render it. That is a gap in the build, not in the source.
                </p>
              ) : (
                <StoryboardCard storyboard={storyboard} />
              )}
              <p className="mt-2 text-xs">
                <a href={`#${INDEX_ANCHOR}`} className="text-[var(--color-ink-subtle)] underline">
                  Back to the index
                </a>
              </p>
            </section>
          )
        })}
      </div>

      <p className="mt-10 text-sm">
        <Link href="/workflows/" className="text-[var(--color-ink)] underline">
          Back to the workflow index
        </Link>
      </p>
    </main>
  )
}
