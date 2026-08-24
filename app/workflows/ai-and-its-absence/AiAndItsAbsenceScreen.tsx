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
  SB_01_TO_10_CANON_BACKED_DECISIONS,
  SB_01_TO_10_LOCAL_DISCLOSURES,
} from '@/ai/storyboards/sb-01-to-10/decisions'
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
 * index, the collision listing and the decision disclosures &mdash; carries NO
 * provenance class, because it is documentation about a frozen document rather
 * than guidance shown to a worker, and putting a class on it would classify
 * something the contract does not classify.
 *
 * ── THE DECISION DISCLOSURES, AND WHY THEY ARE ON THIS PAGE ────────────────
 * `src/ai/storyboards/sb-01-to-10/decisions.ts` held local decision records
 * that reached a gate and no screen: measured by transitive closure from `app/`, it
 * had zero importers anywhere under `src/` or `app/`, and the only thing naming
 * it was a COMMENT in `src/coverage/uninventoried.ts`. A comment is not an
 * importer, and a record that discloses nothing to anyone is the shape this
 * slice has already been corrected for twice. They are rendered rather than
 * deleted because they disclose something no card on this page carries: most of
 * their readings are read from lines OUTSIDE section 44A, which each reading now
 * says on screen. The other two ranges hold no such records, and the section
 * states that asymmetry with its measurable basis rather than leaving a reader
 * to notice it.
 *
 * ── NO CONTROL, AND NOTHING TO ACT THROUGH ─────────────────────────────────
 * A server component. There is no button, no input, no filter and no retry
 * anywhere on it; `AC-43-103`&rsquo;s prohibition on a shared severity rendering
 * is honoured by importing no severity component at all, and operational
 * severity, where the cards carry it, crosses as the plain string the source
 * writes.
 */

const anchorFor = (identifier: string): string => identifier.toLowerCase()

/**
 * SECTION 44A'S OWN BOUNDS, READ FROM THE ROUTE RECORD RATHER THAN RETYPED.
 * The two numbers exist once, in `./scope`, where the chapter span is already
 * declared and already held against the source by the route suite.
 */
const [FIRST_44A_LINE, LAST_44A_LINE] = (
  AI_AND_ITS_ABSENCE_ROUTE.chapterSpan.match(/\d+/g) ?? []
).map(Number) as [number, number]

/**
 * Whether a reading's line sits outside section 44A. Derived per reading and
 * never counted into a sentence: a stated total is a stored copy of a derived
 * answer, and this build removes stale counts rather than renumbering them.
 */
function readingIsOutside44A(locator: string): boolean {
  const line = /L(\d{4,6})/.exec(locator)
  if (line === null) return false
  const at = Number(line[1])
  return at < FIRST_44A_LINE || at > LAST_44A_LINE
}

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

      <section
        aria-label="The decisions storyboards 1 to 10 name, disclosed"
        data-testid="sb-01-to-10-decisions"
        className="mt-8"
      >
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">
          The decisions storyboards 1 to 10 name
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The <code>DEC-*</code> identifiers of storyboards 1 to 10 travel inside the transcribed
          field text of the cards, because that is where the source puts them. Some have a record in
          the platform canon and are cited from the cards rather than restated:{' '}
          {SB_01_TO_10_CANON_BACKED_DECISIONS.join(', ')}. The rest are not members of the
          canon&rsquo;s exported union, so there is no identifier to cite them by &mdash; and their
          readings sit on lines the cards do not transcribe. Those are below, every reading with its
          own line, none of them named as the source&rsquo;s answer.
        </p>
        <dl className="mt-4 space-y-6 text-sm">
          {SB_01_TO_10_LOCAL_DISCLOSURES.map((record) => (
            <div key={record.decisionRef} data-local-decision={record.decisionRef}>
              <dt className="font-medium text-[var(--color-ink)]">
                {record.decisionRef}
                {record.canonicalId === null ? (
                  <span className="ml-2 text-xs font-normal text-[var(--color-ink-subtle)]">
                    the canon holds no record of this question under any spelling
                  </span>
                ) : (
                  <span className="ml-2 text-xs font-normal text-[var(--color-ink-subtle)]">
                    the canon holds this question canonically as {record.canonicalId} and carries
                    this spelling as its alias
                  </span>
                )}
              </dt>
              <dd className="mt-1 text-[var(--color-ink-muted)]">
                <p className="text-[var(--color-ink)]">{record.question}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
                  Every reading. None is the answer.
                </p>
                <ul className="mt-1 space-y-2">
                  {record.readings.map((reading) => (
                    <li key={reading.locator} data-reading-locator={reading.locator}>
                      <span className="text-[var(--color-ink)]">{reading.text}</span>{' '}
                      <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                        [{reading.locator}]
                      </span>
                      {readingIsOutside44A(reading.locator) ? (
                        <span
                          data-outside-44a="true"
                          className="ml-1 whitespace-nowrap text-xs text-[var(--color-ink-subtle)]"
                        >
                          read from outside section 44A
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
                  Why the disclosure is here rather than a pointer into the canon
                </p>
                <p className="mt-1">{record.canonNote}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
                  What these cards do under the open question
                </p>
                <p className="mt-1">{record.behaviour}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                  Named by {record.namedBy.join(', ')}.
                </p>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The other two ranges, 44A.11-20 and 44A.21-30, hold no local decision records at all, on
          the reasoning that the source&rsquo;s own cells already carry every reading and the
          identifier, so a local record would be a second home for the same thing. That reasoning
          does not reach these seven, and the difference is marked on each reading above rather than
          argued here: the readings tagged &ldquo;read from outside section 44A&rdquo; come from
          chapter 21&rsquo;s scope and escalation clauses, §36&rsquo;s reconnection ordering, the
          offline device-wipe entry and chapter 40&rsquo;s separate statement of the
          recovery-objective question, and no card on this page transcribes any of them. The two
          that are inside the chapter are its own decision-register rows, which no card transcribes
          either. What the cards carry is the identifier; what is above is the readings it stands
          for.
        </p>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Several of these questions also have a register home elsewhere in this build and this page
          is not it: the escalation fallback, the &ldquo;Supervisor and above&rdquo; ordering, the
          reconnection order and the device-wipe question are all rows of the Client Command
          Center&rsquo;s own chapter-21 decision register, and the reconnection question carries a
          fuller record still on the offline protocol. Those registers hold the row; what is above is
          what these ten cards need a reader to know where the identifier appears in a field, and it
          names the canonical spelling wherever there is one to name.
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
