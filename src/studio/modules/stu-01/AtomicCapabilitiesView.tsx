import type { ScenarioDomainState } from '@/domain/state'
import type { TenantId } from '@/domain/ids'
import type { StudioPersonaColumn } from '@/studio/access/evaluate'
import { STU_PERSONAS, stuPersonaById } from '@/studio/modules'
import { studioConnectivityTreatment } from '@/studio/state/connectivity'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import { Banner, Button, FreshnessLabel, StatusPill } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import {
  AUTHORITY_TIERS,
  AUTHORITY_TIER_HEADINGS,
  CHARTER_ACTIONS,
  CHARTER_ACTION_HEADINGS,
  CHARTER_PLATFORM_ENGINEER_CELLS,
  ENABLEMENT_AUTHORITY_POSITION,
  ENABLEMENT_AUTHORITY_READINGS,
  TIER_AUTHORITY_MATRIX,
  charterRow,
} from './matrix'
import {
  CAPABILITY_REGISTER,
  NOT_ENTITLED_REASON,
  STU01_SEED_STATE,
  STU01_TENANT,
  capabilitiesForTenant,
  capabilityById,
  consequenceLine,
  notAvailableReason,
  sectionRenderings,
  type AtomicCapabilityRow,
  type CapabilityRegister,
} from './capabilities'
import { CHARTER_STATEMENTS } from './charter'
import { charterAffordance, enablementAffordance, type CharterControlRendering } from './service'
import { NotAvailableLine } from './NotAvailableLine'

/**
 * `SCR-STU-CAPS` — the Atomic Capabilities view, and the charter it enforces.
 *
 * READ-ONLY BY RULING, NOT BY OMISSION (D12). `DEC-CAPAUTH-001` is open and
 * nobody holds capability enablement, so every enable-or-disable control here
 * is rendered DISABLED with the decision named rather than working or hidden:
 * building an operator would pre-empt the decision, and dropping the view
 * would hide the mechanism `AC-STU-006` and `AC-STU-008` require to be
 * visible.
 *
 * THIS SCREEN DECIDES; THE PRIMITIVES DRAW. Every affordance below comes from
 * `charterAffordance` in `./service`, which asks `evaluateStudioAccess`. No
 * component under `src/ui/` is handed a question, and nothing here reads a
 * role list.
 *
 * SCOPE IS ENFORCED IN THE READ. The rows this screen has at all come from
 * `capabilitiesForTenant`, which filters by tenant before anything is drawn.
 * A screen that drew only its own rows while READING another tenant's has
 * already crossed the boundary.
 *
 * NO STUDIO MODULE COUNT RENDERS HERE (`AC-STU-014`, L30992). The count is
 * derived and belongs in the one scoped element on the module index that
 * carries its qualifier.
 */
export interface AtomicCapabilitiesViewProps {
  readonly persona: StudioPersonaColumn
  /** The registers this reader may read from. Defaults to the seeded one. */
  readonly registers?: readonly CapabilityRegister[]
  readonly tenant?: TenantId
  readonly state?: ScenarioDomainState
  readonly identityLayer?: 'reachable' | 'unreachable'
  readonly online?: boolean
  /**
   * How the capability registry read went. `FB-STU-07` (L30767-L30774):
   * `last-retrieved` is the first fallback and `unreadable` the terminal safe
   * state, and the two are kept apart because one shows content and one must
   * not.
   */
  readonly registryRead?: 'current' | 'last-retrieved' | 'unreadable'
}

function personaName(persona: StudioPersonaColumn): string {
  return stuPersonaById(STU_PERSONAS, persona).name
}

/** One rendering rule for every control on this screen. */
function Control({ rendering }: { readonly rendering: CharterControlRendering }) {
  if (rendering.kind === 'absent') {
    return <ProhibitionNotice rendering={{ kind: 'absent', note: rendering.note }} />
  }
  return (
    <Button variant="secondary" disabledReason={rendering.reason}>
      {rendering.label}
    </Button>
  )
}

export function AtomicCapabilitiesView({
  persona,
  registers = [CAPABILITY_REGISTER],
  tenant = STU01_TENANT,
  state = STU01_SEED_STATE,
  identityLayer = 'reachable',
  online = true,
  registryRead = 'current',
}: AtomicCapabilitiesViewProps) {
  const ctx = { state, identityLayer, online }
  const rows = capabilitiesForTenant(registers, tenant)
  const register = registers.find((r) => r.tenant === tenant) ?? null
  const sections = sectionRenderings(rows, null)

  // The FB-STU-07 terminal safe state. The area is unavailable, every
  // capability-dependent surface freezes, and publication is blocked — so
  // nothing below may render, because rendering an enablement state that
  // could not be read is the "stale as current" claim L30790 forbids.
  if (registryRead === 'unreadable' || register === null) {
    const treatment = studioConnectivityTreatment({ kind: 'failed-read' })
    return (
      <ScreenStateBoundary
        state="STATE-12"
        surface="SURF-STU"
        detail={{
          failureWhat: 'The capability registry and the tenant entitlement set could not be read.',
          wasWritten: false,
          nextStep: `${treatment.reason} Every capability-dependent configuration surface in the Builder is frozen read-only and publication is blocked, because publishing a Workflow whose capability dependencies cannot be verified would place unverifiable content on the floor (FB-STU-07, L30774). Already-published Workflows and already-pinned packages are untouched.`,
        }}
      />
    )
  }

  // A register that READ successfully and holds nothing is not a failure and
  // is not a blank list: STATE-01 names what would appear here and what
  // creates it. This is also what removes the last unreachable-looking branch
  // from the exemplar below — with no rows there is nothing to exemplify, so
  // the exemplar is never asked to invent one.
  if (rows.length === 0) {
    return (
      <ScreenStateBoundary
        state="STATE-01"
        surface="SURF-STU"
        detail={{
          objectLabel: 'atomic capabilities in this tenant’s entitlement set',
          whatCreatesIt:
            'A Platform Engineer engineers and registers a capability in the Super Admin platform console, and an Admin approves the registration; the console then sets which tenants are entitled to it. Nothing in the Studio creates one.',
        }}
      />
    )
  }

  return (
    <div className="space-y-10">
      {/* ---------------------------------------------------------------- *
          The charter itself. Every claim, with the line it was read at.
       * ---------------------------------------------------------------- */}
      <section aria-labelledby="charter-heading">
        <h2 id="charter-heading" className="text-xl font-semibold">
          The charter
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This module holds no records and stores nothing. It states what the Studio is allowed to
          be, and every module on this surface inherits it. Each claim below carries the line of the
          frozen source it was read at.
        </p>
        <dl className="mt-4 space-y-4">
          {CHARTER_STATEMENTS.map((statement) => (
            <div key={statement.id} data-testid={`charter-${statement.id}`}>
              <dt className="text-sm font-semibold text-[var(--color-ink)]">
                {statement.heading}{' '}
                <span className="font-normal text-[var(--color-ink-subtle)]">
                  [{statement.sourceRef} · {statement.sourceClass}]
                </span>
              </dt>
              <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">{statement.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------------------------------------------------------- *
          The module's own permission matrix, per cell, for this view.
       * ---------------------------------------------------------------- */}
      <section aria-labelledby="matrix-heading">
        <h2 id="matrix-heading" className="text-xl font-semibold">
          What this view may do
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Viewing as <strong>{personaName(persona)}</strong>. Each answer below is this module&rsquo;s
          own permission cell for that column, evaluated per control — never a role list.
        </p>
        <ul className="mt-4 space-y-4">
          {CHARTER_ACTIONS.map((action) => {
            const row = charterRow(action)
            const cell = row.cells[persona]
            const derivation = row.derivation[persona]
            return (
              <li key={action} data-testid={`charter-action-${action}`}>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {CHARTER_ACTION_HEADINGS[action]}
                </p>
                <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">{cell.note}</p>
                {derivation !== null ? (
                  <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">{derivation}</p>
                ) : null}
                <div className="mt-2">
                  <Control
                    rendering={charterAffordance(
                      action,
                      persona,
                      ctx,
                      CHARTER_ACTION_HEADINGS[action],
                    )}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            The Platform Engineer row, which is not a column of this surface
          </p>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The source&rsquo;s table lists <code>ROLE-PLAT-ENG</code> as a seventh actor. It is not
            one of this surface&rsquo;s eight persona columns, and nothing below is a Studio control:
            each is an act of the Super Admin platform console, stated here so the row is not lost.
          </p>
          <ul className="mt-2 space-y-1">
            {CHARTER_PLATFORM_ENGINEER_CELLS.map((cell) => (
              <li key={cell.action} className="text-sm text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">
                  {CHARTER_ACTION_HEADINGS[cell.action]}
                </span>
                {' — '}
                {cell.note}{' '}
                <span className="text-xs text-[var(--color-ink-subtle)]">[{cell.sourceRef}]</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
          The tier authority matrix — quoted once, for the whole surface.
       * ---------------------------------------------------------------- */}
      <section aria-labelledby="tiers-heading">
        <h2 id="tiers-heading" className="text-xl font-semibold">
          What each tier may do
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              What each tier may do, from the frozen source at L30757 to L30765
            </caption>
            <thead>
              <tr>
                <th scope="col" className="border-b p-2 text-left">
                  Action
                </th>
                {AUTHORITY_TIERS.map((tier) => (
                  <th key={tier} scope="col" className="border-b p-2 text-left">
                    {AUTHORITY_TIER_HEADINGS[tier]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIER_AUTHORITY_MATRIX.map((row) => (
                <tr key={row.action}>
                  <th scope="row" className="border-b p-2 text-left font-medium">
                    {row.heading}{' '}
                    <span className="text-xs font-normal text-[var(--color-ink-subtle)]">
                      [{row.sourceRef}]
                    </span>
                  </th>
                  {AUTHORITY_TIERS.map((tier) => (
                    <td key={tier} className="border-b p-2 text-[var(--color-ink-muted)]">
                      {row.cells[tier].note}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
          SB-STU-02 — the Atomic Capability area itself.
       * ---------------------------------------------------------------- */}
      <section aria-labelledby="capabilities-heading">
        <h2 id="capabilities-heading" className="text-xl font-semibold">
          Atomic capabilities
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The six rows the frozen source states at L33975 to L33982, which map a capability to the
          configuration surface it switches on. This is not the atom registry and no count is claimed
          from it: the source says there is no fixed atom count, and the fourteen atoms it names
          elsewhere are illustrative rather than a committed set [L43112 · L43116].
        </p>
        {registryRead === 'last-retrieved' ? (
          <div className="mt-3">
            <Banner
              tone="stale"
              heading="Last retrieved, not current"
              body="The capability registry and the entitlement set could not be read just now, so this area is open read-only against the last successfully retrieved enablement state (FB-STU-07, L30772). Nothing here is presented as current."
            />
            <FreshnessLabel
              asOfLabel={`Last retrieved ${register.retrievedAt}`}
              originLabel="from the atomic capability registry in the Super Admin platform console"
            />
          </div>
        ) : (
          <FreshnessLabel
            asOfLabel={`Read ${register.retrievedAt}`}
            originLabel="from the atomic capability registry in the Super Admin platform console"
          />
        )}

        <p className="mt-3 max-w-prose text-sm font-medium text-[var(--color-ink)]">
          There is no control anywhere in this view that would bring a capability into existence,
          because no such capability exists to be brought into existence from a tenant surface. The
          path forward is a platform engineering change in the foundation, evaluated and registered
          in the Super Admin platform console [AC-STU-005 · L30780].
        </p>

        <ul className="mt-4 space-y-6">
          {rows.map((row) => (
            <CapabilityRow key={row.id} row={row} persona={persona} ctx={ctx} />
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- *
          The nine sections this enablement state produces.
       * ---------------------------------------------------------------- */}
      <section aria-labelledby="sections-heading">
        <h2 id="sections-heading" className="text-xl font-semibold">
          Configuration follows capability
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Enabling a capability switches on the corresponding configuration surface in the Builder;
          disabling it removes that surface [L33973]. This is what the nine configuration sections
          look like under the enablement state above.
        </p>
        <ul className="mt-3 space-y-2">
          {sections.map(({ section, rendering }) => (
            <li key={section} data-testid={`section-${section}`} className="text-sm">
              {rendering.kind === 'present' ? (
                <>
                  <span className="font-medium text-[var(--color-ink)]">{section}</span>{' '}
                  <StatusPill tone="ok" icon="●" label="Present" />
                </>
              ) : rendering.kind === 'frozen-read-only' ? (
                <>
                  <span className="font-medium text-[var(--color-ink)]">{section}</span>{' '}
                  <StatusPill tone="stale" icon="◐" label="Frozen read-only" />{' '}
                  <span className="text-[var(--color-ink-muted)]">{rendering.reason}</span>
                </>
              ) : (
                <NotAvailableLine
                  section={section}
                  reason={rendering.reason}
                  viewHref={null}
                  whoToAsk={WHO_TO_ASK}
                />
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            What the Builder renders where a capability is not enabled (SB-STU-04, L31640)
          </p>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Every entitled capability is enabled in this seeded state, so no section is standing
            down today. This is the line that would render if one were, produced by the same
            component the nine-section panel uses.
          </p>
          <div className="mt-2">
            <NotAvailableLine
              section="Deviation rules and severity mapping"
              reason={notAvailableReason(capabilityById(rows, 'CAP-CONTAINMENT') ?? rows[0]!)}
              viewHref={ENABLEMENT_VIEW_HREF}
              whoToAsk={WHO_TO_ASK}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
          The open decision, and the three readings behind it.
       * ---------------------------------------------------------------- */}
      <section aria-labelledby="decision-heading" className="space-y-4">
        <h2 id="decision-heading" className="text-xl font-semibold">
          Why nothing here acts
        </h2>
        <div className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            Three statements of the frozen source answer &ldquo;who may enable a capability&rdquo;,
            and they do not agree. All three stand.
          </p>
          <ul className="mt-2 space-y-2">
            {ENABLEMENT_AUTHORITY_READINGS.map((reading) => (
              <li key={reading.locator} className="text-sm text-[var(--color-ink-muted)]">
                {reading.text}{' '}
                <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                  [{reading.locator}]
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[var(--color-ink)]">{ENABLEMENT_AUTHORITY_POSITION}</p>
        </div>
        <DecisionDisclosure id="D12" />
      </section>

      {/* ---------------------------------------------------------------- *
          Notifications — three triggers, and the third is deliberately
          not a notification. Rendered as the source's own table states it.
       * ---------------------------------------------------------------- */}
      <section aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" className="text-xl font-semibold">
          Notifications
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Notification triggers for this module, from the frozen source at L31660 to L31664
            </caption>
            <thead>
              <tr>
                <th scope="col" className="border-b p-2 text-left">
                  Trigger
                </th>
                <th scope="col" className="border-b p-2 text-left">
                  Recipient
                </th>
                <th scope="col" className="border-b p-2 text-left">
                  Channel
                </th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_ROWS.map((row) => (
                <tr key={row.trigger}>
                  <th scope="row" className="border-b p-2 text-left font-medium">
                    {row.trigger}
                  </th>
                  <td className="border-b p-2 text-[var(--color-ink-muted)]">{row.recipient}</td>
                  <td className="border-b p-2 text-[var(--color-ink-muted)]">{row.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/* ==================================================================== *
 * The capability row — SB-STU-02's four columns, its control, and its
 * consequence line.
 * ==================================================================== */

function CapabilityRow({
  row,
  persona,
  ctx,
}: {
  readonly row: AtomicCapabilityRow
  readonly persona: StudioPersonaColumn
  readonly ctx: { readonly state: ScenarioDomainState; readonly identityLayer: 'reachable' | 'unreachable'; readonly online: boolean }
}) {
  const outsideEntitlement = row.entitlement === 'not-included'
  return (
    <li
      data-testid={`capability-${row.id}`}
      // "Shown greyed with the reason stated" (L30751) — greyed as a SUNKEN
      // surface, not as reduced opacity. Opacity was the first draft and axe
      // caught it: it dropped six elements of this row below the WCAG 2.2 AA
      // contrast minimum, so the row the source requires to stay readable
      // became the one row on the screen a low-vision reader could not read.
      className={`rounded-[var(--radius-surface)] border p-4 ${
        outsideEntitlement
          ? 'border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)]'
          : 'border-[var(--color-border-strong)]'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-semibold text-[var(--color-ink)]">Capability: {row.name}</span>
        <span className="text-xs text-[var(--color-ink-subtle)]">
          [{row.sourceRef}] {row.sourceWording}
        </span>
      </div>

      <dl className="mt-2 space-y-1 text-sm">
        <div>
          <dt className="inline font-medium text-[var(--color-ink)]">Enablement state: </dt>
          <dd className="inline text-[var(--color-ink-muted)]">
            {outsideEntitlement ? (
              <>
                Not available. <strong>{NOT_ENTITLED_REASON}</strong>. Shown rather than hidden, so
                what exists is visible even where it cannot be used [AC-STU-008 · L30783].
              </>
            ) : (
              <>{row.enablement === 'enabled' ? 'Enabled' : 'Disabled'} for this tenant.</>
            )}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-[var(--color-ink)]">
            Configuration surfaces it switches on:{' '}
          </dt>
          <dd className="inline text-[var(--color-ink-muted)]">
            {row.surfaceWording}
            {row.sections.length > 0 ? <> ({row.sections.join(' · ')})</> : null}{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">{row.sectionMappingNote}</span>
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-[var(--color-ink)]">
            Workflows currently relying on it:{' '}
          </dt>
          <dd className="inline text-[var(--color-ink-muted)]">
            {row.reliedOnBy.length > 0
              ? row.reliedOnBy.join(', ')
              : 'No published Workflow relies on it in this workspace yet.'}
          </dd>
        </div>
      </dl>

      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {consequenceLine(row)}
      </p>

      <div className="mt-3">
        <Control rendering={enablementAffordance(row, persona, ctx)} />
      </div>
    </li>
  )
}

/* ==================================================================== *
 * Constants this screen renders.
 * ==================================================================== */

const ENABLEMENT_VIEW_HREF = '/studio/capabilities/'

/**
 * `SB-STU-04` requires the line to state who to ask. In this build that
 * question is genuinely open, so the sentence says so and names the
 * decision's own recommendation rather than inventing an owner.
 */
const WHO_TO_ASK =
  'Who to ask is itself undecided: DEC-CAPAUTH-001 is open, and its recommendation is the Tenant Admin with a ' +
  'recorded Quality Manager consultation. Until the client answers it, no role in this tenant holds capability ' +
  'enablement, and the request goes to whoever the client names.'

/** L31660-L31664, transcribed. The third row is a notification that is NOT sent. */
const NOTIFICATION_ROWS = [
  {
    trigger: 'A capability a published Workflow depends on is disabled',
    recipient: 'Quality Manager',
    channel: 'In-app and email',
  },
  {
    trigger: 'A newly registered capability becomes available within entitlement',
    recipient: 'Quality Manager and Tenant Admin',
    channel: 'In-app',
  },
  {
    trigger: 'A request to define a foundation object is refused',
    recipient:
      'Not applicable — a refusal is audited, not notified; notifying every refusal would train users to ignore notifications',
    channel: 'Not applicable — see reason in the preceding cell',
  },
] as const
