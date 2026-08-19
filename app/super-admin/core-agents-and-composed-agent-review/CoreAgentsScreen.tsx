'use client'

import { useState } from 'react'
import Link from 'next/link'
import { rolesInDomain, type RoleId } from '@/domain/roles'
import { scenarioRunId } from '@/domain/ids'
import { emptyDomainState } from '@/domain/state'
import { evaluateAccess, type AccessContext, type AccessRequest } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS, type SaInvariantId } from '@/surfaces/sa/invariants'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { Button, Field, Select, StatusPill } from '@/ui/primitives'
import { SA_APPLICABLE_STATE_IDS } from '@/surfaces/sa/screen-states'
import { saAggregateText, saFreshnessFor, type SaFreshness } from '@/surfaces/sa/freshness'
import { SaConsoleShell } from '../SaConsoleShell'

/**
 * MOD-SA-03 — Core Agents and Composed-Agent Review (Band A, the definition
 * layer).
 *
 * This module renders AGENT STATE, not incident ownership: spec §4 D6 gives
 * `WF-PLT-009` (the artificial-intelligence outage) to `MOD-SA-01`, whose
 * health view is the outage's console home. The cross-link below is the
 * whole of this module's relationship to an incident.
 *
 * Everything drawn here is grounded in the frozen source's own entries for
 * `MOD-SA-03`. The source defines exactly TWO controls for this module
 * (`Approve (composed-agent review)` and `Return with reasons`, both
 * L43339, both `ROLE-PLAT-ROOT` / `ROLE-PLAT-ADMIN` / `ROLE-PLAT-ENG`), and
 * this screen builds exactly those two. Every other affordance a reviewer
 * might expect is named in the "unspecified in source" panel instead of
 * invented — an invented control reads back as a requirement.
 */
export const MODULE = saModuleById('MOD-SA-03')

/** The four console roles, straight from the role registry — never a second list. */
export const CONSOLE_ROLES = rolesInDomain('PLATFORM')

/**
 * The twelve applicable screen states: all thirteen less the frontline-only
 * STATE-07, derived from the closed set rather than re-typed beside it.
 */
export const APPLICABLE_STATES: readonly ScreenStateId[] = SA_APPLICABLE_STATE_IDS

// ---------------------------------------------------------------------------
// Seeded fixture data. No backend, no clock: §8 of the spec — every state is a
// fixture the reader steps through, and no value here is computed from an
// ambient `Date.now()` or a network call.
// ---------------------------------------------------------------------------

/** `OBJ-SA-AGENT`, L43358. */
const AGENT_STATES = [
  'registered',
  'evals passing',
  'pending approval',
  'enabled',
  'flagged',
  'disabled',
] as const

/** `OBJ-SA-REVIEW`, the composed-agent submission, L43358. */
const REVIEW_STATES = ['submitted', 'under review', 'approved', 'returned', 'mirrored'] as const
type ReviewState = (typeof REVIEW_STATES)[number]

/** The governance-binding field's three declared values (L88109). */
const GOVERNANCE_BINDINGS = [
  'authoring-time policy',
  'runtime human gate',
  'none — reasoning agent',
] as const
type GovernanceBinding = (typeof GOVERNANCE_BINDINGS)[number]

/**
 * The agent-record schema as the source's fullest enumeration gives it
 * (L86757). The count is contradicted in the source itself — see
 * `SOURCE_CONFLICTS` below.
 */
const AGENT_RECORD_FIELDS = [
  'identity and goal',
  'type',
  'capability scope',
  'memory-access grants',
  'planning mode',
  'governance binding',
  'evaluation-scenario references',
  'tenant availability',
  'status',
  'version',
] as const

interface AgentFixture {
  readonly name: string
  readonly kind: string
  readonly governanceBinding: GovernanceBinding
  readonly state: (typeof AGENT_STATES)[number]
  readonly note: string
}

/** The three pre-built agents shipped at V1 (L43295), and nothing else. */
const V1_AGENTS: readonly AgentFixture[] = [
  {
    name: 'Prevention Agent',
    kind: 'Action agent',
    governanceBinding: 'authoring-time policy',
    state: 'enabled',
    note: 'Coaching interventions inside authored bounds. No per-event runtime gate (DEC-GATE-001, adopted working position).',
  },
  {
    name: 'Deviation and Containment Agent',
    kind: 'Action agent',
    governanceBinding: 'runtime human gate',
    state: 'enabled',
    note: 'Proposals beyond pre-authorised containment route to a runtime human gate.',
  },
  {
    name: 'Shift Handoff Agent',
    kind: 'Reasoning agent',
    governanceBinding: 'none — reasoning agent',
    state: 'enabled',
    note: 'Schedule-triggered handoff brief. Changes nothing and carries no gate.',
  },
]

/** Named in the source, explicitly NOT part of the V1 roster (L43295). */
const NOT_AT_V1: AgentFixture = {
  name: 'Vision Reasoning Agent',
  kind: 'Reasoning agent',
  governanceBinding: 'none — reasoning agent',
  state: 'registered',
  note: 'Later release, together with the vision atoms. Cannot be enabled at V1 — the evaluation gate has no passing scenario for it, and no account holds a control that would override that.',
}

interface ReviewFixture {
  readonly id: string
  readonly composedAgent: string
  readonly tenantLabel: string
  readonly initialState: ReviewState
}

const REVIEWS: readonly ReviewFixture[] = [
  {
    id: 'SUB-1041',
    composedAgent: 'Line-3 Yield Reasoning Agent',
    tenantLabel: 'Tenant A',
    initialState: 'submitted',
  },
  {
    id: 'SUB-1042',
    composedAgent: 'Changeover Advisory Agent',
    tenantLabel: 'Tenant B',
    initialState: 'under review',
  },
]

/**
 * The four per-agent indicators this console renders. Every one is a
 * tenant-month aggregate: the line holds at the tenant, and no measure of an
 * individual person is rendered anywhere on this surface.
 */
const AGGREGATES: readonly { readonly label: string; readonly value: string }[] = [
  { label: 'Agent runs, tenant-month total', value: '18,402' },
  { label: 'Replans, tenant-month total', value: '731' },
  { label: 'Overrides recorded, tenant-month total', value: '96' },
  { label: 'Median run latency over the tenant-month', value: '2.4 s' },
]

const FRESH_AS_OF = 'As of 2026-08-17 05:00 UTC, from the platform aggregation run.'
const STALE_AS_OF =
  'As of 2026-08-16 06:00 UTC — stale, 35 hours old, from the last completed aggregation run.'
const PENDING_AS_OF =
  'As of — not yet arrived. The aggregation run has not completed, and no count is shown in place of one.'
const UNAVAILABLE_AS_OF = 'Unavailable. Last known good as of 2026-08-17 05:00 UTC.'

// The shared vocabulary and the shared mapping. This screen used to define its
// own -- `fresh` / `not-yet-arrived`, inventing words for a vocabulary the
// frozen source states as current/stale/unavailable/reconciled (L42991) -- and
// it collapsed STATE-02 and STATE-13 into one rendering that every other
// screen keeps apart. A value that has not arrived is not a value being
// rebuilt after a failure.
type Freshness = SaFreshness
const freshnessFor = saFreshnessFor

const AS_OF_TEXT: Record<Freshness, string> = {
  current: FRESH_AS_OF,
  stale: STALE_AS_OF,
  reconciled: FRESH_AS_OF,
  loading: PENDING_AS_OF,
  empty: PENDING_AS_OF,
  recovering: PENDING_AS_OF,
  unavailable: UNAVAILABLE_AS_OF,
}

function aggregateValue(freshness: Freshness, value: string): string {
  return saAggregateText(freshness, value)
}

// ---------------------------------------------------------------------------
// Access. Every affordance is driven through `evaluateAccess` from per-control
// allowed-roles (D16) — never a hand-rolled role check, and never module-level
// `roles_allowed`.
// ---------------------------------------------------------------------------

const FIXTURE_STATE = emptyDomainState(scenarioRunId('MOD-SA-03-STORYBOARD'))

function contextFor(role: RoleId): AccessContext {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role,
      // A platform-domain role never ambiently holds a tenant. It reaches
      // tenant content only through a named access class.
      tenant: null,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'storyboard-viewer',
  }
}

const APPROVE_REQUEST: AccessRequest = {
  action: 'sa.core-agents.approve-composed-agent-review',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER'],
  sourceRefs: ['L43339', '§8.8'],
}

const RETURN_REQUEST: AccessRequest = {
  action: 'sa.core-agents.return-composed-agent-review-with-reasons',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER'],
  sourceRefs: ['L43339'],
}

/** D16: all four console roles read every screen unless a rule says otherwise. */
const READ_REQUEST: AccessRequest = {
  action: 'sa.core-agents.read',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
  sourceRefs: ['L42742', 'D16'],
}

const ROLE_DENIED_REASON =
  'Support holds read-only on Band A and Band B; deciding a composed-agent submission is not a Support action (L42715).'

const READ_ONLY_STATE_REASON =
  'This screen is in its read-only state, so no decision can be recorded from it.'

function outcomeLabel(decision: PermissionDecision): string {
  return decision.outcome === 'allowed' ? 'Allowed' : 'Prohibited'
}

// ---------------------------------------------------------------------------

const SCREEN_ANNOTATIONS: readonly string[] = [
  'SCR-SA-03 — Agent roster and agent detail (L42795)',
  'SCR-SA-04 — Composed-agent review queue (L42796)',
  'SB-SA-03 — agent roster, agent detail, and the review queue (L43339)',
  'SCR-SA-AGENTDETAIL — Per-agent detail page (L86233)',
  'SCR-SA-MODELS — Model and Inference settings (L87143)',
]

const UNSPECIFIED_IN_SOURCE: readonly string[] = [
  'SCR-SA-MODELS, "Model and Inference settings" (L87143), is named as a screen of this module, but the source defines no control on it — no model choice, no routing preference, no failover selection. Nothing is drawn for it here.',
  'No control is defined for moving a submission from submitted to under review. The state exists (L43358); the affordance that reaches it does not.',
  'No control is defined for reaching mirrored, the terminal state of the composed-agent submission (L43358). The source states that a return mirrors to the tenant Studio; it names no console act that records the mirror.',
  'No control is defined for any transition of the agent record between registered, evals passing, pending approval, enabled, flagged and disabled. Submitting an enablement change belongs to the Atom Registry; running evaluation scenarios belongs to the Eval Harness.',
  'No filter, sort or search affordance is defined for either the agent roster or the review queue.',
  'No control is defined on the per-agent detail page (SCR-SA-AGENTDETAIL, L86233) beyond reading it.',
]

const SOURCE_CONFLICTS: readonly string[] = [
  'D6 — WF-PLT-009 (the artificial-intelligence outage) is claimed by two modules. It belongs to MOD-SA-01, whose health view is the outage’s console home; this module renders agent state, not incident ownership. Cross-linked below, never duplicated.',
  'The agent record is stated to carry nine fields (L88107, L43289), and the fullest enumeration in the source names ten (L86757) — the extra entry being "identity and goal". All ten are listed here and the discrepancy is flagged rather than quietly resolved; the count itself is not asserted anywhere on this screen.',
  'DEC-GATE-001 remains open: §3.7 and §6.6.1 place the Prevention Agent entirely under pre-authorised Studio-authored policy, while §8.3.2 routes every action agent through a runtime human gate. The adopted working position (2026-08-14) declares gating per agent in the governance-binding field, and ratification stays with the client’s platform team. The roster below shows the working position, labelled as one.',
  'Two of the six per-agent indicators named at L86233 are expressed there as proportions over a period. Section 6 of the slice design forbids any such measure on this console, so they are named and withheld rather than rendered.',
]

/** Only the two invariants this module actually stands on. */
const RELEVANT_INVARIANTS: readonly SaInvariantId[] = ['evaluation-gate', 'sandbox-before-publish']

// ---------------------------------------------------------------------------

function Section({
  title,
  annotation,
  children,
}: {
  readonly title: string
  readonly annotation?: string
  readonly children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {annotation !== undefined ? (
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{annotation}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ReviewRow({
  review,
  state,
  reasons,
  approveDecision,
  returnDecision,
  readOnly,
  onApprove,
  onReturn,
  onReasonsChange,
}: {
  readonly review: ReviewFixture
  readonly state: ReviewState
  readonly reasons: string
  readonly approveDecision: PermissionDecision
  readonly returnDecision: PermissionDecision
  readonly readOnly: boolean
  readonly onApprove: () => void
  readonly onReturn: () => void
  readonly onReasonsChange: (value: string) => void
}) {
  const decided = state === 'approved' || state === 'returned'

  const approveReason =
    approveDecision.outcome !== 'allowed'
      ? ROLE_DENIED_REASON
      : readOnly
        ? READ_ONLY_STATE_REASON
        : decided
          ? `This submission is already ${state}. A decision is recorded once.`
          : undefined

  const returnReason =
    returnDecision.outcome !== 'allowed'
      ? ROLE_DENIED_REASON
      : readOnly
        ? READ_ONLY_STATE_REASON
        : decided
          ? `This submission is already ${state}. A decision is recorded once.`
          : reasons.trim() === ''
            ? 'Free-text reasons are required before this control enables (L43339).'
            : undefined

  return (
    <li
      data-testid="review-row"
      className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
    >
      <p className="font-medium">
        {review.composedAgent}{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">{review.id}</span>
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        Composed in {review.tenantLabel}’s Studio. State:{' '}
        <span data-testid="review-state" className="font-medium text-[var(--color-ink)]">
          {state}
        </span>
      </p>
      <p className="mt-1 text-sm">
        <Link
          data-testid={review.id === REVIEWS[0]?.id ? 'tenant-session-request' : undefined}
          href="/super-admin/support-access/"
          className="text-[var(--color-primary)] underline"
        >
          Request a named access session to see this composition in the tenant’s Studio
        </Link>
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        No link on this console reaches record-level tenant content. There is no ambient browsing
        here: the only route into a tenant is one of the three named access classes.
      </p>

      <div data-testid="review-action-bar" className="mt-3 space-y-2">
        <Field
          label={`Reasons for returning ${review.id}`}
          description="Required before the return control enables. Mirrors to the tenant Studio."
        >
          <textarea
            value={reasons}
            onChange={(e) => onReasonsChange(e.target.value)}
            rows={2}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm"
          />
        </Field>
        <div className="flex flex-wrap items-start gap-3">
          <Button
            onClick={onApprove}
            {...(approveReason !== undefined ? { disabledReason: approveReason } : {})}
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            onClick={onReturn}
            {...(returnReason !== undefined ? { disabledReason: returnReason } : {})}
          >
            Return with reasons
          </Button>
        </div>
      </div>
      {decided ? (
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          Recorded as a label on fixture data. The terminal state mirrored is not reachable from this
          console — see the unspecified-in-source panel.
        </p>
      ) : null}
    </li>
  )
}

export function CoreAgentsScreen() {
  const firstRole = CONSOLE_ROLES[0]?.id ?? 'ROOT_SUPER_ADMIN'
  const [role, setRole] = useState<RoleId>(firstRole)
  const [screen, setScreen] = useState<ScreenStateId>('STATE-03')
  const [reviewStates, setReviewStates] = useState<Readonly<Record<string, ReviewState>>>(() =>
    Object.fromEntries(REVIEWS.map((r) => [r.id, r.initialState])),
  )
  const [reasons, setReasons] = useState<Readonly<Record<string, string>>>({})

  const ctx = contextFor(role)
  const approveDecision = evaluateAccess(APPROVE_REQUEST, ctx)
  const returnDecision = evaluateAccess(RETURN_REQUEST, ctx)
  const readOnly = screen === 'STATE-06'
  const freshness = freshnessFor(screen)

  const overviewModule = saModuleById('MOD-SA-01')
  const atomModule = saModuleById('MOD-SA-02')
  const evalModule = saModuleById('MOD-SA-05')

  return (
    <SaConsoleShell module={MODULE}>
      <div className="space-y-2">
        <Select
          label="Viewing as"
          value={role}
          // Narrowed by lookup against the closed role registry rather than
          // cast: an unknown value from the DOM is ignored, never coerced
          // into a `RoleId` the registry does not carry.
          onChange={(v) => {
            const found = CONSOLE_ROLES.find((r) => r.id === v)
            if (found) setRole(found.id)
          }}
          options={CONSOLE_ROLES.map((r) => ({ value: r.id, label: r.name }))}
        />
        <Select
          label="Screen state"
          value={screen}
          onChange={(v) => {
            const found = APPLICABLE_STATES.find((s) => s === v)
            if (found !== undefined) setScreen(found)
          }}
          options={APPLICABLE_STATES.map((id) => {
            const def = SCREEN_STATES.find((s) => s.id === id)
            return { value: id, label: `${id} — ${def?.name ?? id}` }
          })}
        />
        <p className="text-xs text-[var(--color-ink-subtle)]">
          The role selector is a view-switcher, not a sign-in. Nothing here authenticates anyone.
        </p>
      </div>

      <Section title="Screen state" annotation="The twelve applicable states. STATE-07 is frontline-only and is not offered here.">
        <div data-testid="screen-state-panel">
          {screen === 'STATE-05' ? (
            approveDecision.outcome === 'allowed' ? (
              <p role="note">
                This role is not refused on this screen. Support is the console role this screen
                refuses: it reads everything here and decides nothing.
              </p>
            ) : (
              <ScreenStateBoundary
                state="STATE-05"
                surface="SURF-SA"
                detail={{ decision: approveDecision }}
              />
            )
          ) : (
            <ScreenStateBoundary
              state={screen}
              surface="SURF-SA"
              detail={{
                objectLabel: 'composed-agent submissions awaiting review',
                whatCreatesIt:
                  'A tenant Studio submits a composed reasoning agent for platform review.',
                readOnlyCause:
                  'This console is in its read-only state, so no review decision can be recorded.',
                asOfLabel: STALE_AS_OF,
                originLabel: 'the last completed platform aggregation run',
                commandState: 'queued',
                degradedMissing:
                  'Per-agent aggregates are incomplete while models are degraded.',
                degradedRemaining:
                  'The roster, the record schema and the review decision all remain available — a review is a governance act on a record, not an inference.',
                unavailableCause:
                  'Every artificial-intelligence model is unavailable. The roster, the agent records and both review controls remain operable; only the aggregates below are withheld (AC-SA-000-09).',
                failureWhat: 'The aggregation run failed.',
                wasWritten: false,
                nextStep: 'The roster and the review queue are unaffected; re-run the aggregation.',
                recoveryProgress:
                  'The aggregation run is being recomputed. Counts are withheld until it completes.',
                fieldLabel: 'Reasons for returning',
                rule: 'A return carries free-text reasons.',
                permittedFormat: 'Any free text that names why the composition was returned.',
              }}
            >
              <p>
                The roster, the agent record schema and the composed-agent review queue below, each
                with its as-of time.
              </p>
            </ScreenStateBoundary>
          )}
        </div>
      </Section>

      <Section title="Screens this module carries" annotation="Names are canonical. SCR-SA numbers are annotations only and key no route (D1).">
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {SCREEN_ANNOTATIONS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Section>

      <Section title="Enforced invariants this module stands on">
        <div data-testid="invariant-chips" className="space-y-3">
          {SA_INVARIANTS.filter((i) => RELEVANT_INVARIANTS.includes(i.id)).map((i) => (
            <InvariantChip key={i.id} invariant={i} />
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          These are status chips, not controls. No off position exists for any account including the
          root, so nothing here is focusable and nothing implies an approval path.
        </p>
      </Section>

      <Section
        title="Agent roster"
        annotation="SCR-SA-03. Three pre-built agents ship at V1 (L43295). Agents are records, not code: one schema, one instance per agent."
      >
        <ul className="space-y-3">
          {[...V1_AGENTS, NOT_AT_V1].map((a) => (
            <li
              key={a.name}
              data-testid="agent-row"
              className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
            >
              <p className="font-medium">{a.name}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink-muted)]">
                <span>{a.kind}</span>
                <StatusPill tone="neutral" icon="●" label={a.state} />
                <span>governance binding: {a.governanceBinding}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{a.note}</p>
              {a === NOT_AT_V1 ? (
                <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                  Named in the source, outside the V1 roster.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--color-ink-subtle)]">
          Agent record states: {AGENT_STATES.join(' · ')}. Governance binding takes exactly three
          values: {GOVERNANCE_BINDINGS.join(' · ')} (L88109). Both are rendered vocabularies; this
          module defines no control that moves a record between them.
        </p>
      </Section>

      <Section
        title="Agent record schema"
        annotation="SCR-SA-AGENTDETAIL. Read-only here — this module defines no field-level control."
      >
        <ul className="grid gap-1 pl-5 text-sm text-[var(--color-ink-muted)] sm:grid-cols-2 list-disc">
          {AGENT_RECORD_FIELDS.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div data-testid="absent-read-memory-content" className="mt-3">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'The memory-access grants field lists grant names only. Reading memory content is not a console action for any account, including the root (L42712) — every console role sees counts and volume only (L97152).',
            }}
          />
        </div>
      </Section>

      <Section title="Authoring an agent definition">
        <div data-testid="absent-author-agent-definition">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'Authoring or editing an agent definition is not a console action for any account, including the root — it sits on the root’s own may-not list (L42712) and the Platform Engineer’s (L42714). Platform agent definitions arrive from platform engineering; tenant compositions arrive from the tenant Studio and reach this console only as a submission to review. No control is drawn here, greyed or otherwise.',
            }}
          />
        </div>
      </Section>

      <Section
        title="Composed-agent review queue"
        annotation="SCR-SA-04. WF-SA-COMPOSED-AGENT-REVIEW (L15967, matched by workflow name — the extract carries no module id on it): a composed agent requires review, and is reviewed in the approval queue under its own class."
      >
        <ul className="space-y-4">
          {REVIEWS.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              state={reviewStates[r.id] ?? r.initialState}
              reasons={reasons[r.id] ?? ''}
              approveDecision={approveDecision}
              returnDecision={returnDecision}
              readOnly={readOnly}
              onApprove={() => setReviewStates((prev) => ({ ...prev, [r.id]: 'approved' }))}
              onReturn={() => setReviewStates((prev) => ({ ...prev, [r.id]: 'returned' }))}
              onReasonsChange={(v) => setReasons((prev) => ({ ...prev, [r.id]: v }))}
            />
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--color-ink-subtle)]">
          Submission states: {REVIEW_STATES.join(' · ')} (L43358). A decision here is a rendered
          label on fixture data and advances only on an explicit click.
        </p>
        <p data-testid="critical-class-note" className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          This module carries no critical-class action: a composed-agent review is decided in the
          approval queue under its own class, and none of the eleven critical-class actions belongs
          here. No class badge replaces this action bar, because a badge drawn with no critical
          action behind it would read back as a requirement.
        </p>
      </Section>

      <Section
        title="What each console role sees"
        annotation="Every cell carries an explicit outcome from evaluateAccess. Module-level roles_allowed is authoritative nowhere (D16)."
      >
        <div className="overflow-x-auto">
          <table data-testid="role-outcome-matrix" className="w-full text-left text-sm">
            <caption className="sr-only">
              Per-control outcome for each of the four platform console roles.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="py-2 pr-4">
                  Control
                </th>
                {CONSOLE_ROLES.map((r) => (
                  <th key={r.id} scope="col" className="py-2 pr-4">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className="py-2 pr-4 font-normal">
                  Read this screen
                </th>
                {CONSOLE_ROLES.map((r) => (
                  <td key={r.id} className="py-2 pr-4">
                    Read — {outcomeLabel(evaluateAccess(READ_REQUEST, contextFor(r.id)))}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-2 pr-4 font-normal">
                  Approve (composed-agent review)
                </th>
                {CONSOLE_ROLES.map((r) => {
                  const d = evaluateAccess(APPROVE_REQUEST, contextFor(r.id))
                  return (
                    <td key={r.id} className="py-2 pr-4">
                      {outcomeLabel(d)} — {d.explanation}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <th scope="row" className="py-2 pr-4 font-normal">
                  Return with reasons
                </th>
                {CONSOLE_ROLES.map((r) => {
                  const d = evaluateAccess(RETURN_REQUEST, contextFor(r.id))
                  return (
                    <td key={r.id} className="py-2 pr-4">
                      {outcomeLabel(d)} — {d.explanation}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <th scope="row" className="py-2 pr-4 font-normal">
                  Author or edit an agent definition
                </th>
                {CONSOLE_ROLES.map((r) => (
                  <td key={r.id} className="py-2 pr-4">
                    Absent — this action exists for no account, so no control is drawn for it.
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Per-agent indicators"
        annotation="SCR-SA-AGENTDETAIL. Aggregates only — this console never renders a measure of an individual person."
      >
        <p data-testid="aggregate-as-of" className="text-xs text-[var(--color-ink-subtle)]">
          {AS_OF_TEXT[freshness]}
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {AGGREGATES.map((a) => (
            <li key={a.label} className="flex flex-wrap gap-2">
              <span className="text-[var(--color-ink-muted)]">{a.label}:</span>
              <span data-testid="aggregate-value" className="font-medium">
                {aggregateValue(freshness, a.value)}
              </span>
            </li>
          ))}
        </ul>
        <p data-testid="aggregate-scope" className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          Every indicator above is a tenant-month aggregate. Nothing below tenant-month is rendered
          on this console, and no measure attributable to one person exists here at all.
        </p>
        <p data-testid="withheld-indicators" className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          Two of the six indicators the source names at L86233 — success, and gate approval — are
          expressed there as proportions over a period. Section 6 of the slice design forbids any
          such measure on this console, so they are named here and not rendered. No substitute has
          been invented in their place.
        </p>
      </Section>

      <Section title="Unspecified in source">
        <p className="text-sm text-[var(--color-ink-muted)]">
          The frozen source defines exactly two controls for this module. Each affordance below is a
          gap in the source, not an omission from this build — nothing has been invented to fill it.
        </p>
        <ul
          data-testid="unspecified-in-source"
          className="mt-2 list-disc space-y-2 pl-5 text-sm text-[var(--color-ink-muted)]"
        >
          {UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </Section>

      <Section title="Source conflicts, resolved in the open">
        <ul
          data-testid="source-conflicts"
          className="list-disc space-y-2 pl-5 text-sm text-[var(--color-ink-muted)]"
        >
          {SOURCE_CONFLICTS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Section>

      <Section title="Where the rest of this lives">
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href={`/super-admin/${overviewModule.slug}/`}
              className="text-[var(--color-primary)] underline"
            >
              {overviewModule.name}
            </Link>{' '}
            — platform incidents, including an artificial-intelligence outage (D6).
          </li>
          <li>
            <Link
              href={`/super-admin/${atomModule.slug}/`}
              className="text-[var(--color-primary)] underline"
            >
              {atomModule.name}
            </Link>{' '}
            — an agent’s capability scope is a set of atoms.
          </li>
          <li>
            <Link
              href={`/super-admin/${evalModule.slug}/`}
              className="text-[var(--color-primary)] underline"
            >
              {evalModule.name}
            </Link>{' '}
            — the evaluation scenarios an agent record references.
          </li>
        </ul>
      </Section>
    </SaConsoleShell>
  )
}
