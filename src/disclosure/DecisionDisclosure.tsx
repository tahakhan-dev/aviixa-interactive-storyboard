import type { ReactNode } from 'react'
import { decisionRecord, type DecisionId } from './decisions'
import { textColor } from '@/ui/product/tokens'

/**
 * THE APP-012 SENTENCE, DECLARED ONCE.
 *
 * Unit 1's final whole-branch review found it written out longhand in seven
 * hand-rolled disclosures across three routed screens, three tasks apart —
 * which is the drift this directory exists to prevent, arriving through a
 * seam rather than through any one task. It is a constant now, so a screen
 * cannot render a seventh wording of it by editing a string it happens to own.
 */
export const CLIENT_DELEGATED_SENTENCE =
  'A client-delegated choice under APP-012, not a position the source settled.'

/**
 * The ONLY place an open decision is rendered, on ANY surface. A module
 * writing its own disclosure prose is a defect, because that is how two
 * screens end up disclosing the same decision differently and how one of them
 * quietly stops mentioning the alternative. That risk is no longer confined to
 * one surface: `DEC-LANEB-001`, `DEC-WFROLL-001`, `DEC-LIB-001` and
 * `DEC-TAX-002` are cited by `SURF-STU` and by `SURF-DOH` both, and a Hub
 * screen citing one gets this component and this record -- the identical
 * wording and the identical locator set the Studio screen renders, because
 * there is only one of each.
 *
 * What it always renders, for every record in the canon:
 *
 * 1. the identifier -- the source's own `DEC-*` where the source names one,
 *    and this build's key with the plain statement where it does not;
 * 2. **every** reading, each with its own frozen-source locator. Not the one
 *    the build implemented -- all of them; and where a record carries NONE,
 *    the sentence saying so, because a heading over an empty region is how a
 *    recorded absence turns into an oversight nobody can tell apart from one;
 * 3. this build's working position, labelled a **client-delegated choice under
 *    APP-012**. Never "the source settles this".
 *
 * It computes nothing. It is handed an id, looks the record up in a frozen
 * table, and renders it. No policy lives here.
 */
export interface DecisionDisclosureProps {
  readonly id: DecisionId
}

export function DecisionDisclosure({ id }: DecisionDisclosureProps) {
  const decision = decisionRecord(id)

  return (
    <section
      role="note"
      aria-label={`Open decision ${decision.decisionRef ?? decision.id}`}
      className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">
        {decision.decisionRef === null ? (
          <>
            Open decision {decision.id} — the source records this conflict but gives it no
            `DEC-*` identifier
            {/* AND THE ALIAS RENDERS HERE TOO. It did not, and the omission was
                invisible while the only aliased record also had a `DEC-*`
                identifier. `S10-IDENT-SCHED-001` has none and three spellings,
                so the branch that says "no identifier" was the branch that
                silently dropped the spellings a client would search on. */}
            {decision.alias !== null ? <> (also cited as {decision.alias})</> : null}
          </>
        ) : (
          <>
            Open decision {decision.decisionRef}
            {decision.alias !== null ? <> (also cited as {decision.alias})</> : null}
          </>
        )}
      </p>

      <p className="mt-1 text-[var(--color-ink-muted)]">{decision.question}</p>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        All readings stand. None is this build&rsquo;s to settle.
      </p>
      {/* AN EMPTY READING LIST IS A DISCLOSURE, NOT AN EMPTY REGION. Without
          this the list rendered as nothing at all under a heading promising
          readings, which is the shape of a screen pointing at content that is
          not there. `DEC-FINISH-002` is the case: the frozen source names the
          contradiction and never writes down either side of it, so the record
          carries no reading and this sentence is what the absence looks like.
          Written to be true of the missing-record stand-in as well, whose
          cause is carried by its own working position below. */}
      {decision.readings.length === 0 ? (
        <p className="mt-1 text-[var(--color-ink)]">
          No reading is listed, and none has been invented to fill the gap. What the absence
          means is stated in this build&rsquo;s working position below.
        </p>
      ) : null}

      <ul className="mt-1 space-y-2">
        {decision.readings.map((reading) => (
          <li key={reading.locator + reading.text.slice(0, 24)}>
            <span className="text-[var(--color-ink)]">{reading.text}</span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{reading.locator}]
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        This build&apos;s working position
      </p>
      <p className="mt-1 text-[var(--color-ink)]">{decision.adopted}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{CLIENT_DELEGATED_SENTENCE}</p>
    </section>
  )
}

/**
 * THE ID-LESS VARIANT, for a routed product screen.
 *
 * `DecisionDisclosure` above renders the canon record: the `DEC-*`
 * identifier and every reading with its own frozen-source `L` locator. That
 * is right for the surfaces that cite the canon and WRONG as primary page
 * content on a routed product screen, where a requirement identifier or a
 * line locator is a product-fidelity breach. So the three unit-1 screens
 * wrote their own `<details>` blocks in plain language instead — seven of
 * them, each defensible alone, and together the exact duplication this
 * directory exists to hold.
 *
 * This is the shared shape for that case. It takes NO `DecisionId`, because
 * none of these questions has a canon record and minting a fake id to reach
 * the signature above would put a wrong identifier in a real table. What it
 * guarantees is the one thing the hand-rolled copies were drifting on: the
 * APP-012 sentence, from the constant, appended to every body, once.
 *
 * The caller supplies the plain-language body. It computes nothing.
 */
export interface ControlDisclosureProps {
  /** Stable control id, as every other product control on these screens carries. */
  readonly controlId: string
  /** The `<summary>` line — plain language, no identifier, no locator. */
  readonly summary: ReactNode
  /** The body, ending before the APP-012 sentence this component appends. */
  readonly children: ReactNode
  /** Layout only (margins). The type and colour are this component's. */
  readonly className?: string
}

export function ControlDisclosure({
  controlId,
  summary,
  children,
  className,
}: ControlDisclosureProps) {
  return (
    <details
      data-control-id={controlId}
      className={className === undefined ? 'text-xs' : `${className} text-xs`}
    >
      <summary className={`cursor-pointer ${textColor('ink-muted')}`}>{summary}</summary>
      <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
        {children} {CLIENT_DELEGATED_SENTENCE}
      </p>
    </details>
  )
}
