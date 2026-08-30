import { frontlineConnectivityTreatment } from '@/frontline/access'
import { flDestinationBySlug, type FrontlineSlug } from '@/frontline/screens'
import {
  A1_CHARTER_STATEMENTS,
  a1CharterStatement,
  type A1CharterStatementId,
} from './charter'
import {
  A1_FUNCTIONALITIES,
  A1_FUNCTIONALITIES_NAMING_NO_PATTERN,
  A1_OPEN_DECISIONS,
  A1_PATTERNS_FROM_MAP,
  A1_PATTERN_DIVERGENCE,
  COMPLIANCE_MESSAGE_FRONTLINE_RENDERINGS,
  COMPLIANCE_MESSAGE_READINGS,
} from './service'

/**
 * The blocks both of `MOD-FL-A1`'s destinations carry. They live here rather
 * than in each view because two copies of a disclosure is how one of them
 * quietly stops mentioning the alternative — the reason
 * `@/disclosure/DecisionDisclosure` exists at all.
 */

const CARD = 'rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4'
const DASHED =
  'rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4'

/**
 * The destination this view is, as §25.5 states it, plus BOTH readings of
 * the `SCR-FL-*` token it carries. Read from wave 0's `FL_DESTINATIONS`,
 * whose `contested` field has no shape in which a single reading could be
 * recorded as the answer — so this component cannot print one either.
 *
 * The two destinations differ here and the difference is the whole ruling:
 * `SCR-FL-01` is the ONE token both registers agree on, and `SCR-FL-06` is
 * one of the five they do not.
 */
export function A1DestinationCard({ viewing }: { readonly viewing: FrontlineSlug }) {
  const d = flDestinationBySlug(viewing)
  const c = d.contested
  return (
    <div
      data-testid="fl-a1-destination"
      data-slug={d.slug}
      className={`${CARD} space-y-2`}
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">{d.name}</h2>
      <p className="text-sm text-[var(--color-ink-muted)]">{d.purpose}.</p>
      <p className="text-sm text-[var(--color-ink-muted)]">
        Roles that can open it: {d.rolesThatCanOpen}. Modules and features shown: {d.modulesShown}.
        Navigation entry point: {d.navigationEntryPoint}.
      </p>
      <div data-testid="fl-a1-contested-token" data-token={c.token} className="pt-2 text-sm">
        <p className="font-medium text-[var(--color-ink)]">
          The identifier {c.token}, in both registers
        </p>
        <p className="text-[var(--color-ink-muted)]">
          The six-destination register calls it “{c.registerA}” [{c.registerARef}]. The
          twenty-three-row register calls it “{c.registerB}” [{c.registerBRef}].
        </p>
        <p className="text-[var(--color-ink-muted)]">
          {c.agreement.agree ? c.agreement.why : c.agreement.whatEachNames}
        </p>
        <p className="text-xs text-[var(--color-ink-subtle)]">
          No screen identifier is used as a route key on this surface; this destination is keyed on
          the plain name “{d.slug}”.
        </p>
      </div>
    </div>
  )
}

export function A1CharterCard({
  ids,
  heading,
}: {
  readonly ids?: readonly A1CharterStatementId[]
  readonly heading: string
}) {
  const statements =
    ids === undefined ? A1_CHARTER_STATEMENTS : ids.map((id) => a1CharterStatement(id))
  return (
    <div data-testid="fl-a1-charter" className={`${CARD} space-y-3`}>
      <h2 className="text-base font-semibold text-[var(--color-ink)]">{heading}</h2>
      <dl className="space-y-3">
        {statements.map((s) => (
          <div key={s.id} data-testid="fl-a1-charter-statement" data-statement={s.id}>
            <dt className="text-sm font-medium text-[var(--color-ink)]">{s.heading}</dt>
            <dd data-testid="fl-a1-charter-text" className="text-sm text-[var(--color-ink-muted)]">
              {s.text}
            </dd>
            <dd className="text-xs text-[var(--color-ink-subtle)]">
              {s.sourceRef} · {s.sourceClass}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * `DEC-MSG-001`, with BOTH wordings and neither marked as the answer. This
 * is the first place in this build's application tree that Reading B stands
 * beside Reading A; before it, Reading B was recorded only in
 * `registries/raw/extract/` and `registries/generated/`, and the only
 * application asset carrying either wording carried Reading A alone.
 *
 * NEITHER STRING IS RENDERED AS THE MESSAGE. They are shown as two readings
 * of a fixed string the source states twice, differently — the lock screen
 * that would show one of them is `SCR-FL-21` and belongs to `MOD-FL-A7`.
 */
export function A1ComplianceMessageReadings() {
  return (
    <div
      data-testid="fl-a1-compliance-message"
      className={`${DASHED} space-y-3`}
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        The fixed compliance-suspension message — two wordings, both preserved
      </h2>
      <p className="text-sm text-[var(--color-ink-muted)]">
        AC-A1-7 (L40321) requires a compliance suspension to block all logins immediately and to
        display the fixed message verbatim. The source fixes that message twice, in two different
        wordings, and the shorter one drops the only actionable instruction. TEST-SCR-FL-006
        (L48703) requires both to be preserved, so both stand here and neither is presented as the
        message.
      </p>
      <ul className="space-y-2">
        {COMPLIANCE_MESSAGE_READINGS.map((r) => (
          <li key={r.label} data-testid="fl-a1-message-reading" data-reading={r.label}>
            <span className="text-sm font-medium text-[var(--color-ink)]">{r.label}:</span>{' '}
            <span className="text-sm text-[var(--color-ink)]">“{r.text}”</span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{r.locator}]
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Where this chapter renders it, and which wording each place quotes
      </p>
      <ul className="space-y-1">
        {COMPLIANCE_MESSAGE_FRONTLINE_RENDERINGS.map((r) => (
          <li key={r.locator} className="text-xs text-[var(--color-ink-muted)]">
            {r.where} — quotes {r.quotes} [{r.locator}]
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The four decisions this module discloses. `DecisionDisclosure` renders a
 * `DecisionId`, and none of these four is a member of that canon's exported
 * union — adding a record means editing a file this module does not own.
 * The three obligations that component discharges are discharged here: the
 * identifier, every reading with its own locator, and this build's working
 * position labelled a client-delegated choice.
 */
export function A1OpenDecisions() {
  return (
    <div
      data-testid="fl-a1-decisions"
      className="space-y-4"
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        Open decisions this screen discloses and does not settle
      </h2>
      {A1_OPEN_DECISIONS.map((d) => (
        <div key={d.id} role="note" data-testid="fl-a1-decision" data-decision={d.id} className={DASHED}>
          <p className="font-medium text-[var(--color-ink)]">Open decision {d.id}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{d.question}</p>

          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            All readings stand. None is this build&rsquo;s to settle.
          </p>
          <ul className="mt-1 space-y-2">
            {d.readings.map((r) => (
              <li key={r.locator + r.text.slice(0, 24)} className="text-sm">
                <span className="text-[var(--color-ink)]">{r.text}</span>{' '}
                <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                  [{r.locator}]
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            This build&apos;s working position
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink)]">{d.adopted}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            A client-delegated choice under APP-012, not a position the source settled.
          </p>

          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
            Why it bears on this module: {d.bearingHere}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * `AC-FL-011-1` (L40151) asked of this module's fourteen functionalities,
 * with the answer shown whether or not it is empty. It is not empty:
 * `FUNC-A1-04-1-3` names no pattern, and nothing is assigned to close it.
 */
export function A1FallbackContract() {
  return (
    <div
      data-testid="fl-a1-fallbacks"
      className={`${CARD} space-y-3`}
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        Fallback patterns, and the criterion that every functionality names one
      </h2>

      <ul className="space-y-2">
        {A1_PATTERNS_FROM_MAP.map((p) => (
          <li key={p.id} data-testid="fl-a1-pattern" data-pattern={p.id} className="text-sm">
            <span className="font-medium text-[var(--color-ink)]">
              {p.id} — {p.title}
            </span>
            <br />
            <span className="text-[var(--color-ink-muted)]">
              Criticality: {p.criticality}. Terminal safe state: {p.terminalSafeState}.
            </span>{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">[{p.sourceRef}]</span>
          </li>
        ))}
      </ul>

      <p data-testid="fl-a1-pattern-divergence" className="text-sm text-[var(--color-ink-muted)]">
        {A1_PATTERN_DIVERGENCE.note}{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">
          [{A1_PATTERN_DIVERGENCE.sourceRef}]
        </span>
      </p>

      <p data-testid="fl-a1-ac-fl-011-1" className="text-sm text-[var(--color-ink)]">
        {A1_FUNCTIONALITIES_NAMING_NO_PATTERN.length === 0
          ? `All ${A1_FUNCTIONALITIES.length} functionalities of this module name at least one FB-FL-* pattern, which is what AC-FL-011-1 (L40151) requires.`
          : `AC-FL-011-1 (L40151) requires every functionality to name at least one FB-FL-* pattern. ${A1_FUNCTIONALITIES_NAMING_NO_PATTERN.join(', ')} names none: its Fallback clause reads “Not applicable — session preservation is a local invariant with no external dependency.” (L40279). Its neighbour FUNC-A1-03-1-3 opens with the same words and then names FB-FL-CORE-01 inside them (L40271), so the source supplies one from inside that construction where it has one to supply. Nothing is assigned here to close the gap, because assigning a plausible pattern would make the criterion pass against an invented fact.`}
      </p>
    </div>
  )
}

/**
 * The offline standing of this destination, read from wave 0 rather than
 * restated. `AC-FL-000-4` (L39099) requires identical outcomes with the
 * network disabled, and a screen that renders only the connected path
 * implies a network this surface is built not to need.
 *
 * THE ONE THING THIS MODULE ADDS TO THAT, AND THE SOURCE STATES IT: the
 * step-up for a forced-sync action does NOT proceed offline (L40224,
 * L40222), and the step waits rather than proceeding on stale cache
 * (L40307). That is a step named, not a denial — the sign-off is not
 * refused, it is deferred until the sync completes.
 */
export function A1OfflineStanding({ viewing }: { readonly viewing: FrontlineSlug }) {
  const destination = flDestinationBySlug(viewing)
  const cachedRead = frontlineConnectivityTreatment({ kind: 'cached-read' })

  return (
    <div
      data-testid="fl-a1-offline"
      className={`${CARD} space-y-2`}
    >
      <h2 className="text-base font-semibold text-[var(--color-ink)]">
        With no connection
      </h2>
      <p className="text-sm text-[var(--color-ink-muted)]">
        {destination.name}: {destination.offlineNote}.{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">[{destination.sourceRef}]</span>
      </p>
      <p className="text-sm text-[var(--color-ink-muted)]">{cachedRead.reason}</p>
      <p data-testid="fl-a1-forced-sync" className="text-sm text-[var(--color-ink)]">
        A second-identity step-up that authorises a designated high-risk action such as a sign-off
        does not proceed offline: the identities and authority those actions record have to be
        fresh rather than cached, so the step waits for the synchronisation instead of running on
        cached authority. That is a step named, not a denial.{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">[L40222, L40224, L40307]</span>
      </p>
    </div>
  )
}
