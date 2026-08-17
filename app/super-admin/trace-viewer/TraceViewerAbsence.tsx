import type { ReactNode } from 'react'
import { ROLES, type RoleId } from '@/domain/roles'
import { scenarioRunId } from '@/domain/ids'
import { emptyDomainState, type IdentitySimulationState } from '@/domain/state'
import { evaluateAccess, type AccessContext, type AccessRequest } from '@/policy/evaluate'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { saModuleById } from '@/surfaces/sa/modules'
import { screenState, type ScreenStateId } from '@/ui/screen-state'
import { Banner, Table, type TableRow } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { SaConsoleShell } from '../SaConsoleShell'

/**
 * MOD-SA-06 — Trace Viewer, built as D9 decided it: **no viewer screen at
 * V1**, and this route is the honest absence that records why.
 *
 * Six passages in the frozen source say no viewer screen exists; four
 * describe one. `DEC-SEC-020` (L104506) independently warns that an
 * unqualified viewer "becomes the ambient-browsing path the source
 * forbids", which is the stronger of the two reasons. So this screen draws
 * **zero controls**: it is a real screen whose content is the recorded
 * decision, not a stub, not a 404, and not a "coming soon".
 *
 * Every prohibition here therefore renders ABSENT (spec §3): the viewer
 * exists for **no** account, the root included, so nothing is drawn and a
 * one-line note sits where the control would be. `disabled-with-reason`
 * would be wrong on the rule — a disabled viewer implies an enabled one
 * exists somewhere — and no critical-class action belongs to this module,
 * so the class-badge rendering does not arise either.
 */

const MODULE = saModuleById('MOD-SA-06')

/** The one platform-domain role set, taken from the closed `ROLES` vocabulary
 *  rather than re-typed here, so it can never drift to five or three. */
const PLATFORM_ROLES = ROLES.filter((r) => r.domain === 'PLATFORM')

/**
 * D16: module-level `roles_allowed` is authoritative nowhere, and MOD-SA-06
 * is the sharpest evidence for it — the extraction carries six mutually
 * inconsistent lists for this one module. So the ONE affordance this screen
 * has is evaluated per-control through `evaluateAccess`: reading the
 * recorded decision. There is no second request, because the source defines
 * no second affordance, and inventing one would ship a fiction.
 */
const READ_THE_DECISION_RECORD: AccessRequest = {
  action: 'sa.trace-viewer.read-decision-record',
  allowedRoles: PLATFORM_ROLES.map((r) => r.id),
  sourceRefs: ['D9', 'L42799', 'L43885', 'L104506'],
}

/** Deterministic: no ambient clock, no random, no fetch. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-06-ABSENCE'))

/** A platform-domain identity holds no ambient tenant — it acts only through
 *  a named access class (`AC-AUTH-006`, L10429). */
function identityFor(role: RoleId): IdentitySimulationState {
  return {
    signedIn: true,
    role,
    tenant: null,
    siteScope: [],
    areaScope: [],
    qualifications: [],
    deviceId: null,
    stepUpActive: false,
    accessSessionId: null,
  }
}

function contextFor(role: RoleId): AccessContext {
  return {
    state: FIXTURE_STATE,
    identity: identityFor(role),
    online: true,
    deviceTrusted: true,
    actorOfRecord: null,
  }
}

/** The recorded date of the decision. A fixture string, never a live clock. */
const DECISION_RECORDED = '2026-08-17'

interface EvidenceRow {
  readonly line: string
  readonly what: string
}

/** Six passages: no viewer screen exists at V1. */
const NO_VIEWER_PASSAGES: readonly EvidenceRow[] = [
  { line: 'L4682', what: 'Trace viewing is backend-only at V1; a viewer interface is a later addition (§8.6.2).' },
  { line: 'L42799', what: 'Screen register: SCR-SA-07 is "trace inspection — backend tooling at V1, not a screen".' },
  { line: 'L43885', what: 'Storyboard SB-SA-06 is explicitly "the honest absence of one".' },
  { line: 'L47798', what: 'Module record: "backend-only at V1 with no screen"; the finding is filed as DEC-TRACE-001.' },
  { line: 'L48736', what: 'DEC-TRACE-001: "no console screen exists"; 21 of 22 register entries draw a screen.' },
  { line: 'L86043', what: 'Module record: traces are inspectable at Tier 1 through backend tooling only.' },
]

/** Four passages: a viewer screen or a control that opens one. */
const VIEWER_PASSAGES: readonly EvidenceRow[] = [
  { line: 'L2173', what: 'A screen-register entry named simply "Trace Viewer", unnumbered.' },
  { line: 'L57772', what: 'A screen showing the orchestrator loop with replanning as a first-class event.' },
  { line: 'L65489', what: 'A control "Open the trace viewer for a scenario run" — filed under the Atom Registry, not this module, and granted to the Platform Engineer alone.' },
  { line: 'L97154', what: 'A role rule listing "open the Trace Viewer" among what the Platform Engineer may do.' },
]

/** What the source DOES define for MOD-SA-06. Definitions only — no
 *  instance of any of these is rendered, here or anywhere on this console. */
const SOURCE_DEFINITIONS: readonly { readonly heading: string; readonly body: string; readonly ref: string }[] = [
  {
    heading: 'OBJ-SA-TRACE — orchestrator trace',
    body: 'States: open · closed and immutable · hot · tiered · retrievable from archive. Owned by SURF-SA.',
    ref: 'L43904',
  },
  {
    heading: 'OBJ-SA-DECISIONRECORD — derived decision record',
    body: 'States: derived · attached to the operational record · retained for the record’s full term. Carries the plan summary, the atoms invoked, the gate outcome and the approver — and it is what a tenant-facing surface receives, not the trace.',
    ref: 'L43904, L34883',
  },
  {
    heading: 'Trace event sequence',
    body: 'plan → act → observe → reflect → replan. Replanning is a first-class event, not an error path.',
    ref: 'L46339, L43833',
  },
  {
    heading: 'Retention',
    body: 'Twenty-four months of hot retrievability, after which a trace tiers to lower-cost storage and nothing is purged; the derived decision record persists for the operational record’s full term.',
    ref: 'L43837, L47800',
  },
  {
    heading: 'AC-SA-06-03 — traces are immutable once closed',
    body: 'No account can edit or delete one. Edit and delete are therefore ABSENT on this surface for every role including the root — there is no control to disable.',
    ref: 'L43964',
  },
  {
    heading: 'AC-SA-06-04 — the Tier-1-internal boundary',
    body: 'No tenant surface exposes orchestrator internal reasoning. A tenant receives a plain-language activity log and an evidence list only.',
    ref: 'L43965',
  },
  {
    heading: 'AC-SA-06-08 — an unwritable trace is not a success',
    body: 'A run whose trace or decision record cannot be written is recorded as failed or incomplete, never as a successful run.',
    ref: 'L43969',
  },
  {
    heading: 'The one workflow this module carries',
    body: '"From an agent run to a fifteen-year-old explanation" — the orchestrator opens a trace when a run begins, and the decision record answers years later with the approver named. It runs end to end in the backend and reaches no console screen at V1. Matched to this module by name and line proximity (L43839, beside the module record at L43893 and OBJ-SA-TRACE at L43904); no extracted workflow carries module_id MOD-SA-06.',
    ref: 'L43839',
  },
]

/**
 * The twelve applicable screen states (STATE-07 is frontline-only and no
 * other surface may render it). The `satisfies Record<...>` shape below is
 * the real exhaustiveness check: dropping a state stops the object from
 * satisfying the record type, and adding a thirteenth is an excess property.
 */
type ApplicableStateId = Exclude<ScreenStateId, 'STATE-07'>

const STATE_CONTRACT = [
  { id: 'STATE-01', behaviour: 'Does not arise. The recorded decision is the content; there is no collection that could be empty.' },
  { id: 'STATE-02', behaviour: 'Does not arise. Nothing is fetched — the decision is compiled into the page.' },
  { id: 'STATE-03', behaviour: `The standing state of this screen: the decision record below, as recorded on ${DECISION_RECORDED}.` },
  { id: 'STATE-04', behaviour: 'Does not arise. No input exists on this screen to validate.' },
  { id: 'STATE-05', behaviour: 'Does not arise for reading. All four console roles read this record. The viewer is absent for all four, which is a platform-wide prohibition, not a refusal aimed at one identity.' },
  { id: 'STATE-06', behaviour: 'Permanent, with one cause named once: no viewer is built at V1. Every console role reads and none acts.' },
  { id: 'STATE-08', behaviour: 'Does not arise. The decision carries the date it was recorded, and no content on this screen ages.' },
  { id: 'STATE-09', behaviour: 'Does not arise. This module issues no command, so there is no command state to render.' },
  { id: 'STATE-10', behaviour: 'Unchanged. No artificial-intelligence model participates in this screen.' },
  { id: 'STATE-11', behaviour: 'Unchanged, and stated plainly on screen. With every model unavailable this screen renders in full (AC-SA-000-09).' },
  { id: 'STATE-12', behaviour: 'Does not arise. Nothing is written from this screen.' },
  { id: 'STATE-13', behaviour: 'Does not arise. There is nothing to replay or recompute.' },
] as const satisfies readonly { readonly id: ApplicableStateId; readonly behaviour: string }[]

type MissingFromStateContract = Exclude<ApplicableStateId, (typeof STATE_CONTRACT)[number]['id']>
const _stateContractExhaustive: MissingFromStateContract extends never ? true : never = true
void _stateContractExhaustive

/** Each one is a named silence, not a gap to fill. Naming them is the whole
 *  point: a plausible invented control reads back as a requirement (R7). */
const UNSPECIFIED_IN_SOURCE: readonly string[] = [
  'Zero controls carry module_id MOD-SA-06 anywhere in the extraction. This screen therefore offers none, and no control here was inferred from a neighbouring module.',
  'DEC-SEC-020 (L104506) — which access class qualifies trace access. Recorded as New — Client Decision Required, with the derived clarification that a trace is layer-3 content and must sit behind an access class. Until that is answered there is nothing to build behind.',
  'DEC-TRACE-001 (L47088, L48736) — how a capability section with no screen at V1 is recorded, and whether a viewer exists at all. Open, and carried honestly rather than resolved in code.',
  'DEC-TRACE-001 (L9482) — what happens when trace writing fails during an agent run. AC-SA-06-08 states the run is recorded failed or incomplete; whether its output is withheld is unanswered.',
  'DEC-RETRIEVE-001 — retrieval behaviour beyond the hot-retrievability horizon. Open. No retrieval affordance is drawn.',
  'DEC-DELETE-001 — deletion behaviour under the no-purge model. Open, and moot on this screen: AC-SA-06-03 makes deletion absent for every account.',
  'AC-SA-06-01, AC-SA-06-02, AC-SA-06-05, AC-SA-06-06 and AC-SA-06-07 are not carried by the extraction; only -03, -04 and -08 were extracted. Their content is unknown here and is not guessed at.',
  'No console-side affordance for the derived decision record. The source places it on the tenant-facing operational record (L34883), never on this console, so none is drawn here.',
]

function Section({
  heading,
  children,
}: {
  readonly heading: string
  readonly children: ReactNode
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{heading}</h2>
      {children}
    </section>
  )
}

export interface TraceViewerAbsenceProps {
  /**
   * STATE-11. A seeded fixture flag, not a control — nothing on this screen
   * sets it. `AC-SA-000-09` (L42887) is a TESTED requirement: with every
   * artificial-intelligence model unavailable this module stays fully
   * operable, which for a screen that invokes no model means it renders
   * identically and says so.
   */
  readonly aiModelsUnavailable?: boolean
}

export function TraceViewerAbsence({ aiModelsUnavailable = false }: TraceViewerAbsenceProps) {
  const roleRows: readonly TableRow[] = PLATFORM_ROLES.map((role) => {
    const decision = evaluateAccess(READ_THE_DECISION_RECORD, contextFor(role.id))
    return {
      role: role.name,
      read:
        decision.outcome === 'allowed'
          ? 'Read — this decision record, in full'
          : `Not read — ${decision.explanation}`,
      viewer: 'Absent — no trace viewer is built for this account',
    }
  })

  return (
    <SaConsoleShell module={MODULE}>
      {aiModelsUnavailable ? (
        <div className="mb-6">
          <Banner
            tone="info"
            heading="Every artificial-intelligence model is unavailable"
            body="This screen invokes no model. Its content is a recorded decision, so it renders in full and nothing below is withheld (AC-SA-000-09, L42887)."
          />
        </div>
      ) : null}

      <Banner
        tone="blocked"
        heading="No trace-viewer screen exists at version one"
        body={`Decision D9, recorded ${DECISION_RECORDED}. This route is that decision, not a placeholder for a screen arriving later. DEC-SEC-020 (L104506) warns that an unqualified trace viewer becomes the ambient-browsing path the source forbids, and DEC-TRACE-001 remains open on whether a viewer exists at all.`}
      />

      <div className="mt-4">
        <ProhibitionNotice
          rendering={{
            kind: 'absent',
            note: 'Where a trace viewer would sit, no trace-viewer screen is drawn here — for any account, including the root. There is no disabled viewer either, because a disabled control would imply an enabled one exists somewhere.',
          }}
        />
      </div>

      <Section heading="Why the source is read this way">
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The frozen source contradicts itself, so both readings are shown with their
          passages rather than one being quietly dropped. Six passages say no screen
          exists; four describe one. Two of those four (L65489, L97154) grant the viewer
          to the Platform Engineer alone and qualify it with no access class — which is
          precisely the shape DEC-SEC-020 names as the ambient-browsing hazard.
        </p>
        <div className="mt-4">
          <Table
            caption="Six passages: no viewer screen at V1"
            columns={[
              { key: 'line', header: 'Passage' },
              { key: 'what', header: 'What it says' },
            ]}
            rows={NO_VIEWER_PASSAGES.map((e) => ({ line: e.line, what: e.what }))}
            emptyState={{
              title: 'No passages recorded.',
              whatCreatesIt: 'Extraction of the frozen source records them.',
            }}
          />
        </div>
        <div className="mt-6">
          <Table
            caption="Four passages: a viewer screen, or a control that opens one"
            columns={[
              { key: 'line', header: 'Passage' },
              { key: 'what', header: 'What it says' },
            ]}
            rows={VIEWER_PASSAGES.map((e) => ({ line: e.line, what: e.what }))}
            emptyState={{
              title: 'No passages recorded.',
              whatCreatesIt: 'Extraction of the frozen source records them.',
            }}
          />
        </div>
      </Section>

      <Section heading="What each console role sees">
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Read access is evaluated per-control through the platform policy evaluator, never
          from a module-level role list — the extraction carries six mutually inconsistent
          role lists for this one module, which is why D16 makes module-level lists
          authoritative nowhere. All four console roles read this record. Not one of them,
          the root included, is offered a viewer, so the prohibition renders as an absence
          rather than as a refusal aimed at an identity.
        </p>
        <div className="mt-4">
          <Table
            caption="What each console role sees on this screen"
            columns={[
              { key: 'role', header: 'Console role' },
              { key: 'read', header: 'This decision record' },
              { key: 'viewer', header: 'Trace viewer' },
            ]}
            rows={roleRows}
            emptyState={{
              title: 'No console roles are defined.',
              whatCreatesIt: 'The platform role registry defines them.',
            }}
          />
        </div>
      </Section>

      <Section heading="The tenant boundary">
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A trace may contain tenant operational content, which is why DEC-SEC-020 calls it
          layer-3 content. Nothing on this screen links to a tenant record, and no
          drill-through is offered from it. Tenant content is reachable only through one of
          the three named access classes — {ACCESS_CLASSES.map((c) => c.name).join(', ')} —
          and no ambient browsing exists anywhere on this console (AC-SA-000-07, L42885;
          AC-SEC-801, L104316).
        </p>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This screen renders no aggregate. It holds no count of its own, and a count of
          traces would be an aggregate over tenant operational content, so none is offered —
          rather than a zero or a blank standing in for one (AC-SA-01-03).
        </p>
      </Section>

      <Section heading="What the source does define for this module">
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Definitions only. No trace, no decision record and no tenant content is rendered
          by this console at V1, and this prototype holds no trace store of any kind.
        </p>
        <dl className="mt-4 space-y-4">
          {SOURCE_DEFINITIONS.map((d) => (
            <div key={d.heading}>
              <dt className="text-sm font-medium text-[var(--color-ink)]">
                {d.heading}{' '}
                <span className="font-normal text-[var(--color-ink-subtle)]">{d.ref}</span>
              </dt>
              <dd className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">{d.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section heading="Screen states on this screen">
        <div className="mt-4">
          <Table
            caption="The twelve applicable screen states"
            columns={[
              { key: 'id', header: 'State' },
              { key: 'name', header: 'Name' },
              { key: 'behaviour', header: 'What this screen does' },
            ]}
            rows={STATE_CONTRACT.map((s) => ({
              id: s.id,
              name: screenState(s.id).name,
              behaviour: s.behaviour,
            }))}
            emptyState={{
              title: 'No screen states are defined.',
              whatCreatesIt: 'The shared screen-state contract defines them.',
            }}
          />
        </div>
      </Section>

      <section className="mt-8" aria-labelledby="unspecified-in-source">
        <h2 id="unspecified-in-source" className="text-lg font-semibold">
          Unspecified in source
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each line below is a silence in the frozen source, named rather than filled. A
          plausible invented control would read back as a requirement, which is worse than
          an empty panel.
        </p>
        <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNSPECIFIED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </SaConsoleShell>
  )
}
