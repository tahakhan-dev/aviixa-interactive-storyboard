import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { STU_14_CROSS_SURFACE } from './matrix'
import {
  OFFLINE_SEVERITY_STATEMENT,
  PACKAGE_CONTENT_GROUPINGS,
  PACKAGE_EXCLUSIONS,
  PINNING_LINE,
  SUPERSESSION_NOTE,
  coachingOmissionLines,
  packageManifestLines,
  verifyCompleteness,
  verifyIntegrity,
  withTrainingItem,
  type WorkPackage,
} from './package'
import {
  STU_14_LOCAL_DISCLOSURES,
  packageRefusals,
  pinnedVersionAffordance,
  type Stu14Scenario,
} from './rendering'

/**
 * `SB-STU-17` (L33905) — the read-only package contents view, for one Run.
 *
 * **THERE IS NO CONTROL ON THIS VIEW, AND THERE CANNOT BE.** The storyboard
 * is a read-only manifest, every write row of the card is `Explicitly
 * prohibited` in all eight columns, and the three rows with an `Allowed` cell
 * anywhere are acts of other surfaces (R22). So this file draws no button, no
 * form and no input, and the covering test scans its own source for them —
 * because "an implementer reading only the Allowed cells will put a Build
 * button on a Studio screen" is the defect this module is named for.
 *
 * **SCOPE IS ENFORCED IN THE READ.** The manifest is drawn only where the
 * read affordance permits it; where it does not, the manifest is not built
 * into the markup at all rather than built and hidden.
 *
 * THIS COMPONENT COMPUTES NO PERMISSION. It is handed a scenario, asks
 * `./rendering` — which lives under `src/studio/` — and draws the answers.
 */
export interface PackageManifestViewProps {
  readonly pkg: WorkPackage
  readonly scenario: Stu14Scenario
}

const CARD = 'rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4'
const HEADING = 'text-base font-semibold text-[var(--color-ink)]'
const BODY = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const META = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

export function PackageManifestView({ pkg, scenario }: PackageManifestViewProps) {
  const read = pinnedVersionAffordance(scenario)
  const integrity = verifyIntegrity(pkg)
  const completeness = verifyCompleteness(pkg)
  const quarantined = verifyIntegrity(withTrainingItem(pkg, 'TRN-BB-WHEEL-ALIGNMENT'))
  const refusals = packageRefusals(scenario)

  return (
    <div data-testid="stu14-manifest-region" className="space-y-6">
      {/* ---- SB-STU-17, the manifest itself ---- */}
      <section aria-labelledby="stu14-manifest" className={CARD}>
        <h2 id="stu14-manifest" className={HEADING}>
          SB-STU-17 — the package contents view for {pkg.runId}
        </h2>
        <p className={BODY}>
          A read-only manifest, presented by both the Studio and the Delivery Operations Hub. It is
          the record that lets a device and the platform both prove what was delivered.
        </p>

        {read.kind === 'decision-open' ? (
          <p role="note" className={BODY}>
            {read.note} No manifest is drawn for this persona while {read.openDecision} is open —
            drawing one would assert an access the decision has not granted, and withholding it
            silently would pre-empt the decision in the other direction.
          </p>
        ) : read.kind === 'absent' ? (
          <p role="note" className={BODY}>
            {read.note}
          </p>
        ) : (
          <>
            {read.kind === 'disabled' ? <p className={META}>{read.reason}</p> : null}
            <dl className="mt-3 space-y-2 text-sm">
              {packageManifestLines(pkg).map((line) => (
                <div key={line.label}>
                  <dt className="font-medium text-[var(--color-ink)]">{line.label}</dt>
                  <dd className="text-[var(--color-ink-muted)]">{line.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 max-w-prose text-sm font-medium text-[var(--color-ink)]">
              {PINNING_LINE}
            </p>
            <ul className={`${META} mt-2 space-y-1`}>
              {coachingOmissionLines(pkg).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ---- D8: both groupings of one element set, neither as THE count ---- */}
      <section aria-labelledby="stu14-contents" className={CARD}>
        <h2 id="stu14-contents" className={HEADING}>
          What the package contains — recorded twice, counted never
        </h2>
        <p className={BODY}>
          Two acceptance criteria group the same contents differently, and both are test-strength
          assertions about one manifest. Both groupings are recorded below over one element set, so
          both criteria are satisfied and neither count is presented as the count.
        </p>
        {PACKAGE_CONTENT_GROUPINGS.map((grouping) => (
          <div key={grouping.id} className="mt-3">
            <p className="text-sm font-medium text-[var(--color-ink)]">{grouping.criterion}</p>
            <p className={META}>
              {grouping.note} [{grouping.locator}]
            </p>
            <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink-muted)]">
              {grouping.groups.map((group) => (
                <li key={group.text}>
                  {group.text} <span className={META}>({group.elements.join(', ')})</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-3">
          <p className="text-sm font-medium text-[var(--color-ink)]">Excluded, by design</p>
          <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink-muted)]">
            {PACKAGE_EXCLUSIONS.map((exclusion) => (
              <li key={exclusion.id}>
                {exclusion.text} {exclusion.reason} <span className={META}>[{exclusion.sourceRef}]</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Integrity, quarantine, and the separate completeness act ---- */}
      <section aria-labelledby="stu14-integrity" className={CARD}>
        <h2 id="stu14-integrity" className={HEADING}>
          Completeness, integrity, and quarantine
        </h2>
        <p className={BODY}>{completeness.statement}</p>
        <p className={BODY}>{integrity.statement}</p>
        <p className={BODY}>
          <span className="font-medium text-[var(--color-ink)]">
            Where a training item is found:{' '}
          </span>
          {quarantined.statement}
        </p>
        <p className={META}>
          Quarantined is a flag on a package, not a sixth member of the state enumeration: the card
          enumerates Defined, Built, Delivered, Pinned and Superseded, and puts quarantine in the
          prose beside them (L33839, D21).
        </p>
      </section>

      {/* ---- Offline severity, stated correctly (R10) ---- */}
      <section aria-labelledby="stu14-offline" className={CARD}>
        <h2 id="stu14-offline" className={HEADING}>
          Offline severity handling
        </h2>
        <p className={BODY}>{OFFLINE_SEVERITY_STATEMENT}</p>
        <p className={META}>{SUPERSESSION_NOTE}</p>
      </section>

      {/* ---- R22: the acts this surface does not hold ---- */}
      <section aria-labelledby="stu14-cross-surface" className={CARD}>
        <h2 id="stu14-cross-surface" className={HEADING}>
          What happens somewhere else — and therefore has no control here
        </h2>
        <ul className="mt-2 space-y-3">
          {STU_14_CROSS_SURFACE.map((row) => (
            <li key={row.id}>
              <p className="text-sm font-medium text-[var(--color-ink)]">{row.capability}</p>
              <p className={BODY}>{row.statement}</p>
              <p className={META}>
                Held on {row.heldOn} — {row.owner}
              </p>
              <ul className={`${META} mt-1 space-y-1`}>
                {row.cells.map((cell) => (
                  <li key={cell.column}>
                    {cell.column}: {cell.text}
                  </li>
                ))}
              </ul>
              <p className={META}>Source: {row.sourceRefs.join(' · ')}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- The four categorical prohibitions, as absences ---- */}
      <section aria-labelledby="stu14-refused" className={CARD}>
        <h2 id="stu14-refused" className={HEADING}>
          Refused to every persona, with the reason where a control would be
        </h2>
        <p className={BODY}>
          Each of these is an absence rather than a disabled control. No cell of this card names an
          alternative anywhere on this surface, so a disabled control would imply a condition that
          could become true. The list is the same length for every persona.
        </p>
        <ul className="mt-2 space-y-2">
          {refusals.map((refusal) => (
            <li key={refusal.id}>
              <p className="text-sm font-medium text-[var(--color-ink)]">{refusal.capability}</p>
              <p className={BODY}>{refusal.note}</p>
              <p className={META}>Source: {refusal.sourceRefs.join(' · ')}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- The seams this module consumes ---- */}
      <StudioSeamNotice seam={stuSeamById(STU_SEAMS, 'package-build-trigger-and-pin')} />
      <StudioSeamNotice seam={stuSeamById(STU_SEAMS, 'package-delivery-on-device')} />

      {/* ---- The open decisions ---- */}
      <DecisionDisclosure id="D8" />
      <DecisionDisclosure id="DEC-LIB-001" />
      <DecisionDisclosure id="DEC-WIDIFF-001" />
      <DecisionDisclosure id="D21" />

      {STU_14_LOCAL_DISCLOSURES.map((disclosure) => (
        <section
          key={disclosure.decisionRef}
          role="note"
          aria-label={`Open decision ${disclosure.decisionRef}`}
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">
            Open decision {disclosure.decisionRef}
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{disclosure.question}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
            All readings stand. None is this build&rsquo;s to settle.
          </p>
          <ul className="mt-1 space-y-2">
            {disclosure.readings.map((reading) => (
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
          <p className="mt-1 text-[var(--color-ink)]">{disclosure.adopted}</p>
          <p className={META}>
            A client-delegated choice under APP-012, not a position the source settled.{' '}
            {disclosure.canonNote}
          </p>
        </section>
      ))}
    </div>
  )
}
