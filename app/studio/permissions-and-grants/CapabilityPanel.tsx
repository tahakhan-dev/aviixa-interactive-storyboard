import { studioGrantById } from '@/studio/access/grants'
import { STU18_MATRIX } from '@/studio/modules/stu-18/matrix'
import {
  AUTHORING_GRANT_CONDITION,
  capabilityPanelRows,
  studioGrantsFor,
  studioIdentityFor,
  type CapabilityAvailability,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import { StatusPill, type StatusTone } from '@/ui/primitives'

/**
 * `SB-STU-21` (L34631), the capability panel, drawn once and rendered by both
 * of this module's screens.
 *
 * The source's own sentence: "A view showing the signed-in identity, its
 * roles, its grants, and the tenant's tier, followed by a list of Studio
 * capabilities each marked Available or Unavailable with the specific missing
 * condition named, for example 'Requires the authoring grant. Ask your Tenant
 * Admin.'"
 *
 * IT DECIDES NOTHING. Every row it draws comes out of `capabilityPanelRows`,
 * which is the one rule, in `src/studio/`. This file is under `app/`, so it
 * may hold policy and deliberately does not.
 */

const TONE: Readonly<Record<CapabilityAvailability, StatusTone>> = {
  available: 'ok',
  unavailable: 'blocked',
  'decision-open': 'attention',
}

export interface CapabilityPanelProps {
  readonly scenario: Stu18Scenario
}

export function CapabilityPanel({ scenario }: CapabilityPanelProps) {
  const identity = studioIdentityFor(scenario.persona)
  const rows = capabilityPanelRows(scenario, STU18_MATRIX)
  // THE GRANTS THE IDENTITY LAYER REPORTS FOR THIS IDENTITY, read from the
  // same function the evaluator reads. Rendering the scenario's raw fields
  // instead reported GRANT-STU-AUTHOR as Active for a Read-only Auditor who
  // holds no grant at all — a false claim on screen, produced by deriving one
  // answer twice.
  const held = studioGrantsFor(scenario)
  const grants = (['GRANT-STU-AUTHOR', 'GRANT-STU-AGENT', 'GRANT-STU-IMPL'] as const).map(
    (id) => ({ id, state: held[id] ?? null }),
  )

  return (
    <section aria-labelledby="capability-panel" className="mt-8">
      <h2 id="capability-panel" className="text-lg font-semibold">
        Your Studio capabilities
      </h2>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        SB-STU-21, L34631 — the signed-in identity, its roles, its grants and the tenant&rsquo;s
        tier, then every Studio capability marked Available or Unavailable{' '}
        <em>with the specific missing condition named</em>, for example &ldquo;
        {AUTHORING_GRANT_CONDITION}&rdquo;. AC-STU-155 (L34672) is why nothing here goes quiet: a
        user should learn what they need, not that a feature does not exist.
      </p>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Available and Unavailable are <strong>SB-STU-21&rsquo;s own two words</strong> for this
        list, and this list is a set of statements rather than a set of controls. A capability the
        matrix marks <em>Explicitly prohibited</em> is stated here with its reason and is offered{' '}
        <strong>no control anywhere</strong> — not an enabled one and not a disabled one. That token
        carries no rendering in the source, so none is inferred from it.
      </p>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="font-medium text-[var(--color-ink)]">Signed-in identity</dt>
        <dd className="text-[var(--color-ink-muted)]">
          {identity.identityId}
          {identity.signedIn ? '' : ' — not signed in'}
        </dd>

        <dt className="font-medium text-[var(--color-ink)]">Roles held</dt>
        <dd className="text-[var(--color-ink-muted)]">
          {identity.roles.join(', ')} — multi-role is additive, and the audit log records identity
          and action rather than &ldquo;acting as role&rdquo; (L33389).
        </dd>

        <dt className="font-medium text-[var(--color-ink)]">Grants</dt>
        <dd className="text-[var(--color-ink-muted)]">
          <ul className="space-y-1">
            {grants.map((grant) => {
              // DEC-TENGRANT-001 is read off the ONE grant table (task 1's), never a second
              // copy here: L34573 attaches `Expired` to GRANT-STU-IMPL alone,
              // and the other two carry DEC-TENGRANT-001 on the same record.
              const definition = studioGrantById(grant.id)
              return (
                <li key={grant.id} data-testid={`grant-${grant.id}`}>
                  <span className="font-medium text-[var(--color-ink)]">{grant.id}</span> —{' '}
                  {grant.state === null ? 'not recorded for this identity' : grant.state}.{' '}
                  {definition.name}. {definition.assignedBy}
                  {definition.expiryStatus === 'stated' ? (
                    <>
                      {' '}
                      Expired applies to this grant and only to this grant: the capacity is revoked
                      at onboarding&rsquo;s end (L34573).
                    </>
                  ) : (
                    <>
                      {' '}
                      Whether this grant carries an expiry is{' '}
                      <strong>Client Decision Required</strong> under {definition.expiryDecision}.
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </dd>

        <dt className="font-medium text-[var(--color-ink)]">Tenant commercial tier</dt>
        <dd className="text-[var(--color-ink-muted)]">
          {scenario.commercialTier} — the commercial tier gates the Agent Author capability
          (L34586). It is a different thing from the Tier-2 authority boundary, and reading one for
          the other produces nonsense (L11872).
        </dd>

        <dt className="font-medium text-[var(--color-ink)]">Identity layer</dt>
        <dd className="text-[var(--color-ink-muted)]">
          {scenario.identityLayer === 'reachable'
            ? 'Reachable. Roles, grants and the tenant tier are being read live on every action (L34635).'
            : 'Unreachable, so the Studio has fallen back to published read and permits nothing beyond it, failing closed (L34605, AC-STU-156).'}
        </dd>
      </dl>

      <ul className="mt-6 space-y-3">
        {rows.map((entry) => (
          <li
            key={entry.row.id}
            data-testid={`capability-${entry.row.id}`}
            data-availability={entry.availability}
            className="border-l-2 border-[var(--color-border-strong)] pl-3"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium text-[var(--color-ink)]">{entry.row.capability}</span>
              <StatusPill tone={TONE[entry.availability] ?? 'neutral'} icon="●" label={entry.label} />
              <span className="text-xs text-[var(--color-ink-subtle)]">{entry.cellLocator}</span>
            </div>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              {entry.condition}
            </p>
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              The matrix cell for this identity, in the source&rsquo;s own words: {entry.cellText}
              {entry.openDecision === null ? '' : ` (${entry.openDecision} governs this cell.)`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
