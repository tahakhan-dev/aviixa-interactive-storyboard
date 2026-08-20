import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import { publishCheckById } from '@/studio/publish/checks'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { Button, EmptyState, StatusPill } from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState } from '@/ui/screen-state'

import {
  CORPUS_PROPERTIES,
  ESCALATION_RECIPIENT_ROLES,
  LIBRARY_CATALOGUE_A_IDS,
  LIBRARY_IDS,
  LIBRARY_NAMES,
  LIBRARY_SCREEN_IDS,
  NOTIFICATION_CHANNELS,
  ROUTING_RULE_FIELDS,
  SEEDED_SEVERITY_BANDS,
  curatedDefaultCoverage,
  isInForce,
  itemById,
  reuseImpact,
  type LibraryId,
  type LibraryItem,
  type LibraryRegister,
} from './libraries'
import { libraryControls, readableItems, type Stu07Scenario } from './rendering'
import type { Stu07CapabilityId } from './matrix'

/**
 * `SB-STU-10` — the Content Libraries. *"Three tabs, one per library"*
 * (L32725), rendered as one route because they are one module, and keyed on
 * that module's slug rather than on any of the three screen numbers (D1).
 *
 * WHAT EVERY LIST ROW SHOWS, from the storyboard itself: *"item name, state,
 * the count of referencing screens, and the count of Workflows affected"*.
 * The last two are not decoration. This module's whole property is that a
 * change here propagates, so **the impact is shown before the edit is
 * made** — and `editLibraryItem` refuses an edit whose shown impact no
 * longer matches the register, which is what turns the display into a rule.
 *
 * THE POLICY IS NOT HERE. Every affordance comes from `libraryControls`,
 * which asks task 1's evaluator once per control over that control's own
 * matrix row. This component is handed finished answers and draws them.
 */

export interface ContentLibrariesViewProps {
  readonly scenario: Stu07Scenario
  readonly activeTab: LibraryId
  readonly register: LibraryRegister
  readonly selectedItemId?: string | undefined
  readonly onSelect?: ((itemId: string) => void) | undefined
  readonly onAct?: ((control: Stu07CapabilityId, itemId: string) => void) | undefined
  readonly lastMessage?: string | null | undefined
}

function stateLabel(item: LibraryItem): string {
  return item.library === 'coaching-corpus' ? item.assetState : item.state
}

function stateTone(item: LibraryItem): 'ok' | 'info' | 'stale' | 'blocked' | 'neutral' {
  const label = stateLabel(item)
  if (label === 'Published' || label === 'Indexed') return 'ok'
  if (label === 'Approved') return 'info'
  if (label === 'Archived' || label === 'Retired') return 'stale'
  if (label === 'Flagged for review') return 'blocked'
  return 'neutral'
}

/**
 * Flagged assets are grouped at the top of the Coaching Corpus tab, as
 * `SB-STU-10` states. Every other tab keeps the register's own order — a
 * sort nobody asked for is a second thing to keep true.
 */
function orderFlaggedFirst(
  items: readonly LibraryItem[],
  library: LibraryId,
): readonly LibraryItem[] {
  if (library !== 'coaching-corpus') return items
  const flagged = items.filter((i) => i.library === 'coaching-corpus' && i.assetState === 'Flagged for review')
  return [...flagged, ...items.filter((i) => !flagged.includes(i))]
}

export function ContentLibrariesView({
  scenario,
  activeTab,
  register,
  selectedItemId,
  onSelect,
  onAct,
  lastMessage = null,
}: ContentLibrariesViewProps) {
  // Scope is applied to the READ, before anything is ordered or drawn.
  const readable = readableItems(scenario, register, activeTab)
  const items = orderFlaggedFirst(readable.items, activeTab)
  const selected = selectedItemId === undefined ? items[0] : itemById(register, selectedItemId)
  const controls = libraryControls(scenario, activeTab)
  const screenId = LIBRARY_SCREEN_IDS[activeTab]

  return (
    <div className="space-y-10">
      <PointerModelPanel />

      <section aria-labelledby="library-heading">
        <h2 id="library-heading" className="text-xl font-semibold">
          {LIBRARY_NAMES[activeTab]}
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          {screenId} · {LIBRARY_CATALOGUE_A_IDS[activeTab]} — screen identifiers are an annotation
          here, never a route key. All three tabs are one module, {LIBRARY_IDS.length} libraries on
          one route.
        </p>

        {readable.withheldReason === null ? null : (
          <p
            data-testid="read-scope"
            className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
          >
            <span className="font-medium text-[var(--color-ink)]">
              {readable.withheldCount} item{readable.withheldCount === 1 ? '' : 's'} in this library
              are not read from this view:{' '}
            </span>
            {readable.withheldReason}
          </p>
        )}

        {items.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={`No item is readable in the ${LIBRARY_NAMES[activeTab]} from this view`}
              whatCreatesIt="The Quality Manager creates an item here, or an authoring-grant holder proposes one through the approval chain. Nothing else in the platform creates one."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const impact = reuseImpact(register, item.id)
              return (
                <li
                  key={item.id}
                  data-testid={`library-item-${item.id}`}
                  className="rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-3">
                    {onSelect === undefined ? (
                      <span className="font-medium text-[var(--color-ink)]">{item.name}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className="font-medium text-[var(--color-primary)] underline"
                      >
                        {item.name}
                      </button>
                    )}
                    <StatusPill tone={stateTone(item)} icon="●" label={stateLabel(item)} />
                    <span className="text-xs text-[var(--color-ink-subtle)]">
                      {item.id} · version {item.version}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                    Referenced by {impact.screenCount} screen
                    {impact.screenCount === 1 ? '' : 's'} across {impact.workflowCount} Workflow
                    {impact.workflowCount === 1 ? '' : 's'}
                    {impact.screenCount === 0 ? '.' : `: ${impact.screenNames.join(', ')}.`}
                  </p>
                  {item.supersedes === null ? null : (
                    <p className="mt-1 text-sm text-[var(--color-ink-subtle)]">
                      A correction linked to {item.supersedes}. The record it corrects is unchanged
                      and stays in force until this one passes review.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {selected === undefined ? null : (
        <ItemDetail
          register={register}
          item={selected}
          controls={controls}
          onAct={onAct}
          lastMessage={lastMessage}
        />
      )}

      {activeTab === 'containment-checklists' ? <ChecklistTab /> : null}
      {activeTab === 'coaching-corpus' ? <CorpusTab register={register} /> : null}
      {activeTab === 'escalation-routing' ? <RoutingTab /> : null}

      <section aria-labelledby="states-heading">
        <h2 id="states-heading" className="text-lg font-semibold">
          Screen states this surface applies here
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {STU_APPLICABLE_STATES.filter((row) => screenRendersState(screenId, row.id)).map((row) => (
            <li key={row.id}>
              <span className="font-medium text-[var(--color-ink)]">
                {row.id} {screenState(row.id).name}
              </span>
              {row.departure === null ? '' : ` — ${row.departure}`}
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <ScreenStateBoundary
            state="STATE-08"
            surface="SURF-STU"
            detail={{
              asOfLabel: 'as at the last successful read of this workspace',
              originLabel: 'the tenant workspace, read through the Studio',
            }}
          />
        </div>
      </section>
    </div>
  )
}

/* ==================================================================== *
 * The property the whole module is about.
 * ==================================================================== */

function PointerModelPanel() {
  return (
    <section
      aria-labelledby="pointer-model-heading"
      className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
    >
      <h2 id="pointer-model-heading" className="text-lg font-semibold">
        Screens hold pointers, never copies
      </h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
        Items are authored or uploaded once and referenced from many screens via pickers, so
        updating a library item propagates to every screen that references it (AC-STU-071, L32763).
        That is the point of these three libraries and it is also the hazard: an edit here reaches
        screens nobody is looking at. So every item states what it reaches before it can be edited,
        and an edit prepared against an out-of-date reference list is refused rather than made.
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        A picker that fails to load never clears an existing pointer (AC-STU-018, L31098), and an
        item cannot be archived while screens reference it — the archival is refused and the
        referencing screens are named, because a dangling pointer would leave a screen with no
        containment or no routing (AC-STU-077, L32769).
      </p>
    </section>
  )
}

/* ==================================================================== *
 * One item: its content, its reference list, its controls.
 * ==================================================================== */

function ItemDetail({
  register,
  item,
  controls,
  onAct,
  lastMessage,
}: {
  readonly register: LibraryRegister
  readonly item: LibraryItem
  readonly controls: readonly ReturnType<typeof libraryControls>[number][]
  readonly onAct?: ((control: Stu07CapabilityId, itemId: string) => void) | undefined
  readonly lastMessage: string | null
}) {
  const impact = reuseImpact(register, item.id)
  return (
    <section aria-labelledby="item-heading" data-testid="item-detail">
      <h2 id="item-heading" className="text-xl font-semibold">
        {item.name}
      </h2>

      {isInForce(item) ? (
        <p
          role="note"
          data-testid="in-force-banner"
          className="mt-2 max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3 text-sm"
        >
          This item is in force on the floor. Edits pass review before taking effect — and the
          correction is written as a linked new record, never as an edit of these bytes, so this
          version stays in force on every screen that references it until the review completes.
        </p>
      ) : null}

      <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        What an edit here would reach
      </h3>
      <p data-testid="reuse-impact" className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
        {impact.screenCount} screen{impact.screenCount === 1 ? '' : 's'} across{' '}
        {impact.workflowCount} Workflow{impact.workflowCount === 1 ? '' : 's'}
        {impact.screenCount === 0
          ? '. Nothing references it yet.'
          : `: ${impact.screenNames.join(', ')} — in ${impact.workflowNames.join(', ')}.`}
      </p>

      {item.library === 'containment-checklists' ? (
        <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm text-[var(--color-ink-muted)]">
          {item.steps.map((step) => (
            <li key={step.id}>{step.text}</li>
          ))}
        </ol>
      ) : null}

      {item.library === 'escalation-routing' ? <RuleTable item={item} /> : null}

      {item.library === 'coaching-corpus' ? (
        <dl className="mt-3 grid gap-2 text-sm text-[var(--color-ink-muted)] sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Index state</dt>
            <dd>
              {item.indexed
                ? 'In the multimodal index — reachable by semantic ranking as well as by metadata filter.'
                : 'Not indexed. Retrievable only by metadata filter, not by semantic ranking, and the screen’s curated default carries coaching until indexing completes.'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Language variant</dt>
            <dd>{item.locale} — authored, never translated at run time.</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Resolution rate</dt>
            <dd>
              {item.resolutionRate === null
                ? 'No effectiveness data yet — the curated default is what cold start uses.'
                : `${Math.round(item.resolutionRate * 100)} per cent of difficulties resolved.`}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-ink)]">Approval</dt>
            <dd>
              {item.approved ? 'Approved by the quality team.' : 'Not approved.'} Indexing never
              changes this (AC-STU-072, L32764).
            </dd>
          </div>
        </dl>
      ) : null}

      <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        What this view may do with it
      </h3>
      <ul className="mt-2 space-y-3">
        {controls.map((control) => (
          <li key={control.id} data-testid={`control-${control.id}`}>
            {control.affordance.kind === 'enabled' ? (
              <>
                <Button onClick={() => onAct?.(control.id, item.id)}>
                  {control.affordance.label}
                </Button>
                <span className="ml-2 text-xs text-[var(--color-ink-subtle)]">
                  {control.affordance.note}
                </span>
              </>
            ) : null}
            {control.affordance.kind === 'disabled' ? (
              <Button disabledReason={control.affordance.reason}>
                {control.affordance.label}
              </Button>
            ) : null}
            {control.affordance.kind === 'decision-open' ? (
              <p role="note" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">
                  {control.affordance.label}:{' '}
                </span>
                {control.affordance.note} No control is offered while{' '}
                {control.affordance.openDecision} is open — an offered control would assert the
                access the decision has not granted.
              </p>
            ) : null}
            {control.affordance.kind === 'absent' ? (
              <p role="note" className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
                {control.affordance.note} This is a categorical prohibition, so it renders as an
                absence rather than as a control that refuses.
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {lastMessage === null ? null : (
        <p
          data-testid="write-outcome"
          role="status"
          className="mt-4 max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 text-sm"
        >
          {lastMessage}
        </p>
      )}
    </section>
  )
}

function RuleTable({ item }: { readonly item: Extract<LibraryItem, { library: 'escalation-routing' }> }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">
          One rule per severity level: recipient roles, channels, acknowledgement timeout, fallback
          recipients, dedupe window.
        </caption>
        <thead>
          <tr className="text-xs uppercase tracking-wide text-[var(--color-ink-subtle)]">
            <th scope="col" className="py-1 pr-4">
              Severity level
            </th>
            <th scope="col" className="py-1 pr-4">
              Recipient roles
            </th>
            <th scope="col" className="py-1 pr-4">
              Channels
            </th>
            <th scope="col" className="py-1 pr-4">
              Acknowledgement timeout
            </th>
            <th scope="col" className="py-1 pr-4">
              Fallback recipients
            </th>
            <th scope="col" className="py-1">
              Dedupe window
            </th>
          </tr>
        </thead>
        <tbody className="text-[var(--color-ink-muted)]">
          {item.rules.map((rule) => (
            <tr key={rule.severityBand}>
              <td className="py-1 pr-4">{rule.severityBand}</td>
              <td className="py-1 pr-4">{rule.recipientRoles.join(', ')}</td>
              <td className="py-1 pr-4">{rule.channels.join(', ')}</td>
              <td className="py-1 pr-4">
                {rule.acknowledgementRequired ? `${rule.timeoutMinutes} minutes` : 'Not required'}
              </td>
              <td className="py-1 pr-4">{rule.fallbackRecipientRoles.join(', ')}</td>
              <td className="py-1">{rule.dedupeWindowMinutes} minutes</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ==================================================================== *
 * Tab 1 — the Containment Checklist Library.
 * ==================================================================== */

function ChecklistTab() {
  return (
    <>
      <section aria-labelledby="launch-heading">
        <h2 id="launch-heading" className="text-lg font-semibold">
          Every step must render from the package
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
          Under the adopted working position of DEC-CONTLAUNCH-001 the checklist launches locally on
          the device, from the version-pinned work package, at the instant of classification and
          with no network required. So every step must be fully renderable from the package with no
          server call — a step that requires a server lookup cannot be a launch-time step, and
          authoring refuses it (L32653). The checklist the engineer selected is policy, never the
          agent’s discretion.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Only two of the three libraries reach the device: containment checklists and coaching
          assets ship in the package, while escalation routing resolves server-side. That asymmetry
          is why an offline device can contain a deviation but cannot escalate one until it syncs
          (L32723).
        </p>
        <div className="mt-3">
          <StudioSeamNotice seam={stuSeamById(STU_SEAMS, 'global-severity-catalog')} />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Severity applicability is tagged against that catalog, seeded here as{' '}
          {SEEDED_SEVERITY_BANDS.join(', ')}. Severity levels are never defined in the Studio.
        </p>
      </section>

      <section aria-labelledby="checklist-decisions-heading" className="space-y-4">
        <h2 id="checklist-decisions-heading" className="text-lg font-semibold">
          Open client decisions that govern this tab
        </h2>
        <DecisionDisclosure id="D15" />
        <DecisionDisclosure id="D17" />
      </section>
    </>
  )
}

/* ==================================================================== *
 * Tab 2 — the Coaching Corpus.
 * ==================================================================== */

function CorpusTab({ register }: { readonly register: LibraryRegister }) {
  const check = publishCheckById('coaching-default-per-locale')
  const coverage = curatedDefaultCoverage(register, 'torque-photograph')
  return (
    <>
      <section aria-labelledby="corpus-properties-heading">
        <h2 id="corpus-properties-heading" className="text-lg font-semibold">
          The four properties that keep the corpus safe
        </h2>
        <dl className="mt-3 space-y-3">
          {CORPUS_PROPERTIES.map((property) => (
            <div key={property.id} data-testid={`corpus-property-${property.id}`}>
              <dt className="text-sm font-semibold text-[var(--color-ink)]">
                {property.heading}{' '}
                <span className="font-normal text-[var(--color-ink-subtle)]">
                  [{property.sourceRef}]
                </span>
              </dt>
              <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {property.quotation}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="index-heading">
        <h2 id="index-heading" className="text-lg font-semibold">
          Indexing never changes approval state
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
          An asset that is Approved but not yet Indexed is retrievable only by metadata filter, not
          by semantic ranking, and the screen’s curated default carries coaching until indexing
          completes (L32647). Approval is the quality team’s audited decision; indexing changes only
          how an asset is found. AC-STU-072 (L32764) is the rule, and it holds on the failure path
          too: when indexing is unavailable the asset stays Approved and not Indexed and is counted
          in the backlog, never left silently unindexed.
        </p>
        <div className="mt-3">
          <StudioSeamNotice seam={stuSeamById(STU_SEAMS, 'multimodal-embedding-service')} />
        </div>
      </section>

      <section aria-labelledby="defaults-heading">
        <h2 id="defaults-heading" className="text-lg font-semibold">
          Curated defaults per locale
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {coverage.map((row) => (
            <li key={row.locale}>
              <span className="font-medium text-[var(--color-ink)]">{row.locale}: </span>
              {row.itemId ?? 'no curated default designated'}
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          This module supplies the reading; it does not own the block. {check.name} is publish check{' '}
          {check.ordinal} and it belongs to {check.ownerModules.join(', ')} — it refuses{' '}
          {check.refuses.charAt(0).toLowerCase()}
          {check.refuses.slice(1)} naming {check.namesElement}. Two channels, two locales, and one
          owner each: nothing here claims a block it does not perform.
        </p>
      </section>

      <section
        aria-labelledby="embed-heading"
        className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
      >
        <h2 id="embed-heading" className="text-lg font-semibold">
          Unspecified in the Statement of Work — DEC-EMBED-001
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
          The Statement of Work names a specific external multimodal embedding model and
          simultaneously states that corpus media may contain identifiable workers and is subject to
          the platform’s personal-information policy. It does not state whether corpus content
          crosses the platform boundary to be embedded, under what data-processing terms, in which
          region, how a model deprecation is handled, or whether the index must be rebuilt when the
          model changes (L32606).
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-[var(--color-ink-muted)]">
          <li>
            Embed in-region under a data-processing agreement with no retention by the model
            provider.
          </li>
          <li>
            Embed only non-identifiable asset types and exclude video containing identifiable
            workers from semantic indexing, falling back to metadata retrieval for those.
          </li>
          <li>Run an in-boundary embedding model, accepting a quality difference.</li>
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This build takes the first, with an explicit no-training, no-retention term and a
          documented index-rebuild procedure for model version changes — a client-delegated choice
          under APP-012, not a position the source settled. Corpus media containing identifiable
          workers is held in the tenant’s own isolated memory, never shared across tenants and never
          exported as external training data (L32756).
        </p>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          DEC-EMBED-001 carries no record in the twenty-four this surface’s shared disclosure
          registry holds, so it is disclosed here, on the tab it binds, rather than left unstated.
        </p>
      </section>
    </>
  )
}

/* ==================================================================== *
 * Tab 3 — Escalation Routing Templates.
 * ==================================================================== */

function RoutingTab() {
  return (
    <>
      <section aria-labelledby="rule-fields-heading">
        <h2 id="rule-fields-heading" className="text-lg font-semibold">
          The three things a rule names
        </h2>
        <dl className="mt-3 space-y-3">
          {ROUTING_RULE_FIELDS.map((field) => (
            <div key={field.id} data-testid={`rule-field-${field.id}`}>
              <dt className="text-sm font-semibold text-[var(--color-ink)]">
                {field.heading}{' '}
                <span className="font-normal text-[var(--color-ink-subtle)]">
                  [{field.sourceRef}]
                </span>
              </dt>
              <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {field.quotation}
                {field.parts.length === 0 ? '' : ` Parts: ${field.parts.join(', ')}.`}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="categorical-heading">
        <h2 id="categorical-heading" className="text-lg font-semibold">
          Two things no control on this surface does
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
          A template names roles, never individuals — the roles a rule may name are{' '}
          {ESCALATION_RECIPIENT_ROLES.join(', ')}, and no user interface or application programming
          interface path permits naming a person (AC-STU-075, L32767). The platform has two
          channels only at V1, {NOTIFICATION_CHANNELS.join(' and ')}, and no third can be configured
          on a template (AC-STU-076, L32768).
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Both are refused in all eight persona columns, the Quality Manager included, so both
          render as an absence rather than as a control that refuses — there is no condition under
          which either becomes possible. An attempt made through the write path is refused, and the
          attempt to name a person is recorded in the tenant audit log (TEST-STU-080).
        </p>
      </section>

      <section aria-labelledby="resolution-heading">
        <h2 id="resolution-heading" className="text-lg font-semibold">
          How a rule reaches a person
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
          At run time the Deviation and Containment Agent loads the referenced template and, for
          each role, resolves the actual people on shift through the Delivery Operations Hub.
          Resolution is on-shift only; there is no separate on-call calendar. The agent sends on the
          configured channels, starts the acknowledgement timer, fires the fallback tier if the
          timer lapses, and records every step. It executes the template; it never chooses
          recipients (L32616).
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Escalation routing resolves server-side and is not packaged, which is why an offline
          device can contain a deviation but cannot escalate one until it syncs (L32723). Where
          nobody holding a role is on shift the platform’s nobody-on-shift fallback applies and the
          delivery is visibly marked as a fallback delivery, carried as an open drafting value under
          DEC-NOSHIFT-001 (L32618).
        </p>
        <div className="mt-3">
          <StudioSeamNotice
            seam={stuSeamById(STU_SEAMS, 'escalation-delivery-and-role-resolution')}
          />
        </div>
      </section>
    </>
  )
}
