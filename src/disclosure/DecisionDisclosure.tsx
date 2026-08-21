import { decisionRecord, type DecisionId } from './decisions'

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
 *    the build implemented -- all of them;
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
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        A client-delegated choice under APP-012, not a position the source settled.
      </p>
    </section>
  )
}
