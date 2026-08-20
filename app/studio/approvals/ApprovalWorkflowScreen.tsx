'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import { screenState } from '@/ui/screen-state'
import {
  FB_SEQ_012,
  fbSeq012TerminalState,
  journeyStateAfterStep,
  journeyStates,
  linkableVersions,
} from '@/studio/journey/fixture'
import { JOURNEY_STEPS } from '@/studio/journey/effects'
import { STU_11_MATRIX, approvalRow } from '@/studio/modules/stu-11/matrix'
import {
  APPROVAL_CONSUMER_CONTRACTS,
  DIAGRAM_ONLY_NODES,
  advance,
  ageingBand,
  approvalAffordance,
  approvalNotificationRows,
  approvalRoute,
  chainStalled,
  checkChainStaffable,
  decline,
  release,
  resubmit,
  returnWithComments,
  seededDiffEngine,
  visibleQueue,
  withdraw,
  type ApprovalAuditEntry,
  type ApprovalChain,
  type ApprovalContext,
  type ApprovalOutcome,
} from '@/studio/modules/stu-11/chain'
import {
  LANE_B_VALUE_CLASSES,
  laneBEntersTheChain,
  seededLaneBClassifier,
  SEEDED_LANE_B_FIELD_MAP,
} from '@/studio/modules/stu-11/laneb'
import { Button, Checkbox, EmptyState, StatusPill } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { StudioShell } from '../StudioShell'
import {
  FIXTURE_AS_OF,
  FIXTURE_DOMAIN,
  FIXTURE_STAFFING,
  ONE_PERSON_QUALITY_TEAM,
  SEEDED_CHAINS,
  SEEDED_VIEWERS,
  SUBMITTED_TIMES,
} from './fixtures'

/**
 * `SCR-STU-11` — the Approval Queue and the review preview (`SB-STU-14`,
 * L33357).
 *
 * THE SCREEN DECIDES NOTHING. Every affordance comes from
 * `approvalAffordance`, which is `evaluateStudioAccess` over one matrix row;
 * every state change goes through `applyTransition`, which writes the audit
 * before it mutates. There is no role list on this file and no second copy of
 * any rule.
 *
 * SCOPE IS ENFORCED IN THE READ. `visibleQueue` is what this renders over, and
 * a submission belonging to another tenant is refused by slice 3's tenant
 * isolation stage before it ever reaches a row. Nothing here is drawn and then
 * hidden.
 */

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-11')

/** The four review obligations `SB-STU-14` names, in the source's own words. */
const REVIEW_OBLIGATIONS = [
  'instruction text',
  'specification limits',
  'coaching content',
  'deviation rules',
] as const

const STATE_TONE = {
  Submitted: 'info',
  'Returned with comments': 'attention',
  Advanced: 'info',
  Released: 'ok',
  Withdrawn: 'neutral',
} as const

export interface ApprovalWorkflowScreenProps {
  /**
   * Reviewer chrome, not a product control: which seeded submission opens in
   * the preview. It exists so the covering test can drive BOTH branches of
   * `SB-STU-14`'s one hard control rule — the Author's own submission, where
   * Advance is disabled with a stated reason, and somebody else's, where it is
   * not. Without it the enabled branch is unreachable from a render and the
   * assertion could not fail.
   */
  readonly selectedSubmissionId?: string
}

export function ApprovalWorkflowScreen({ selectedSubmissionId }: ApprovalWorkflowScreenProps) {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [chains, setChains] = useState<readonly ApprovalChain[]>(SEEDED_CHAINS)
  const [opened, setOpened] = useState<string | null>(selectedSubmissionId ?? null)
  const [commentDraft, setCommentDraft] = useState('')
  const [auditWillFail, setAuditWillFail] = useState(false)
  const [log, setLog] = useState<readonly ApprovalAuditEntry[]>([])
  const [outcomeNote, setOutcomeNote] = useState<string | null>(null)

  const viewer = SEEDED_VIEWERS[persona]

  const context: ApprovalContext = {
    actor: viewer.identity,
    grants: viewer.grants,
    commercialTier: 'Enterprise',
    identityLayer: 'reachable',
    domain: FIXTURE_DOMAIN,
    online: true,
    at: FIXTURE_AS_OF,
    audit: (entry) => {
      if (auditWillFail) return { ok: false, reason: 'the audit store did not commit this entry' }
      setLog((current) => [...current, entry])
      return { ok: true }
    },
    staffing: FIXTURE_STAFFING,
    diff: seededDiffEngine,
    comments: commentDraft,
  }

  const queue = visibleQueue(chains, context)
  const openId = opened ?? queue[0]?.submissionId ?? null
  const open = queue.find((c) => c.submissionId === openId) ?? null

  function run(step: () => ApprovalOutcome): void {
    const outcome = step()
    if (outcome.ok) {
      setChains((current) =>
        current.map((c) => (c.submissionId === outcome.chain.submissionId ? outcome.chain : c)),
      )
      setCommentDraft('')
      setOutcomeNote(
        `${outcome.chain.submissionId} is now ${outcome.chain.state}, recorded with its audit entry in the same transaction as the change.`,
      )
      return
    }
    setOutcomeNote(
      `Refused — ${outcome.refusal.code}. ${outcome.refusal.reason}${
        outcome.auditFailure === null ? '' : ` The refusal’s own audit write also failed: ${outcome.auditFailure}. The refusal stands regardless.`
      }`,
    )
  }

  /**
   * The one rendering rule for every control on this screen, and the two
   * cases it has to keep apart.
   *
   * `Explicitly prohibited` — the MATRIX CELL'S OWN TOKEN — carries no
   * rendering: nothing is drawn that could be mistaken for a control, only a
   * note saying so. That is read off the row, through the columns the
   * evaluator actually resolved for this identity, never re-derived here.
   *
   * A SEPARATION-OF-DUTIES REFUSAL IS NOT THAT TOKEN, and rendering it as one
   * would be wrong twice over: the cell says `Allowed`, and `SB-STU-14`
   * (L33357) states the opposite treatment outright — "The Advance control is
   * disabled with a stated reason if the reviewer is the Author." The
   * evaluator's outcome for both is `explicitlyProhibited`, which is why this
   * reads the cell rather than the outcome. Branching on the outcome made the
   * Advance control VANISH on exactly the case the storyboard exists to show.
   */
  function control(
    capability: Parameters<typeof approvalAffordance>[0],
    label: string,
    chain: ApprovalChain,
    act: () => void,
    testid?: string,
    /**
     * A condition the OBJECT imposes that the permission matrix does not — the
     * Author-only acts. Without it a control would render enabled and then
     * refuse when pressed, which is a control that does nothing.
     */
    objectReason: string | null = null,
  ) {
    const decision = approvalAffordance(capability, context, chain)
    const row = approvalRow(capability)

    // THE ROUTED PROHIBITION. Decided in the domain (`approvalRoute`), drawn
    // here. `MOD-STU-11`'s one routed row is `Edit content while reviewing`,
    // whose Quality Manager cell names the route in its own words —
    // "corrections go back to the Author" (L33272) — and whose route is
    // `Return a submission with comments`, the lawful Reviewer outcome
    // (`FUNC-STU-11-01-B-2`, L33299). Everything else is ABSENT.
    const routedTo = approvalRoute(capability, context, chain)
    if (routedTo !== null) {
      return (
        <span data-testid={testid} data-enabled="false">
          <Button
            variant="secondary"
            disabledReason={`${label} is disabled because ${decision.reason} ${approvalRow(routedTo).capability} is the route open to you and is enabled beside this one.`}
          >
            {label}
          </Button>
        </span>
      )
    }

    const prohibitedByCell =
      decision.personaColumns.length > 0 &&
      decision.personaColumns.every((column) => row.cells[column].outcome === 'explicitlyProhibited')
    if (prohibitedByCell) {
      return (
        <span data-testid={testid} data-enabled="absent">
          <ProhibitionNotice
            rendering={{ kind: 'absent', note: `${label}: ${decision.reason}` }}
          />
        </span>
      )
    }
    const permitted = decision.outcome === 'allowed' || decision.outcome === 'allowedWithConditions'
    if (!permitted || objectReason !== null) {
      return (
        <span data-testid={testid} data-enabled="false">
          <Button
            variant="secondary"
            disabledReason={`${label} is disabled on ${chain.submissionId} because ${permitted ? objectReason : decision.reason}`}
          >
            {label}
          </Button>
        </span>
      )
    }
    return (
      <span data-testid={testid} data-enabled="true">
        <Button variant="secondary" onClick={act}>
          {label}
        </Button>
      </span>
    )
  }

  const fold = journeyStates(JOURNEY_STEPS)
  const afterSubmit = fold.ok
    ? journeyStateAfterStep(fold.states, FB_SEQ_012.branchesFromStep)
    : { ok: false as const, reason: 'the journey fold did not reach the submit step' }
  const stalled = afterSubmit.ok ? fbSeq012TerminalState(afterSubmit.state) : null
  const shortfall = checkChainStaffable(ONE_PERSON_QUALITY_TEAM, 'IDN-SAM')

  return (
    <StudioShell module={MODULE} screenId="SCR-STU-11" persona={persona} onPersonaChange={setPersona}>
      <div className="space-y-8">
        <section aria-labelledby="chain-heading">
          <h2 id="chain-heading" className="text-lg font-semibold">
            The three-stage chain
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            No Workflow content reaches the frontline without explicit human sign-off at each stage.
            The Author completes and submits; the Reviewer — who must be a different person — steps
            through every screen and either returns the Workflow with comments or advances it, and
            cannot edit content directly; the Release Authority grants final publication sign-off
            against the diff and the change summary, and cannot be bypassed. Separation of duties is
            checked against <strong>identity</strong>, never against role: a user holding both the
            Supervisor and Quality Manager roles is still one person and still cannot occupy two
            stages.
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
            Viewing as {viewer.identity.identityId}. {viewer.note}
          </p>
        </section>

        <section aria-labelledby="states-heading">
          <h2 id="states-heading" className="text-lg font-semibold">
            Screen states this surface applies here
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
            {STU_APPLICABLE_STATES.filter((row) => screenRendersState('SCR-STU-11', row.id)).map(
              (row) => (
                <li key={row.id}>
                  <span className="font-medium text-[var(--color-ink)]">
                    {row.id} {screenState(row.id).name}
                  </span>
                  {row.departure === null ? '' : ` — ${row.departure}`}
                </li>
              ),
            )}
          </ul>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
            There is no offline state here. Approval and version control are web-only and require an
            active connection; a transition interrupted by connectivity loss is not recorded, so the
            submission remains at its prior stage and on reconnection the actor sees the true stage
            and repeats the transition. No transition is ever inferred from a partial request
            (L33365).
          </p>
        </section>

        <section aria-labelledby="queue-heading">
          <h2 id="queue-heading" className="text-lg font-semibold">
            Approval Queue
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            What this queue lists is what this persona may <em>read</em>. A submission belonging to
            another workspace is refused by tenant isolation before it reaches a row here — it is
            not drawn and hidden.
          </p>
          {queue.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                title="No submission is readable from this view"
                whatCreatesIt="A submission appears here when an Author submits a Workflow in this workspace and this persona’s approval-log cell permits the read. The Worker is prohibited outright; the Read-only Auditor’s cell defers to DEC-AUDSTU-001, which is open."
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {queue.map((chain) => (
                <li
                  key={chain.submissionId}
                  data-testid={`queue-row-${chain.submissionId}`}
                  className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-[var(--color-ink)]">{chain.subject}</span>
                    <span className="text-xs text-[var(--color-ink-subtle)]">
                      {chain.submissionId}
                    </span>
                    <StatusPill tone={STATE_TONE[chain.state]} icon="●" label={chain.state} />
                    <StatusPill
                      tone="neutral"
                      icon="◷"
                      label={ageingBand(
                        SUBMITTED_TIMES[chain.submissionId] ?? FIXTURE_AS_OF,
                        FIXTURE_AS_OF,
                      )}
                    />
                    {chainStalled(chain, FIXTURE_STAFFING).stalled ? (
                      <StatusPill tone="blocked" icon="■" label="Stalled" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                    Author {chain.authorOfRecord} · submitted{' '}
                    {SUBMITTED_TIMES[chain.submissionId] ?? FIXTURE_AS_OF} · cycle {chain.cycles} ·
                    notification {chain.notificationDelivered ? 'delivered' : 'not delivered'}
                    {chain.notificationDelivered
                      ? ''
                      : ' — and this item is in the queue anyway, because a returned item is visible independently of notification delivery (AC-WF-AUT-006-03).'}
                  </p>
                  <div className="mt-2">
                    <Button variant="secondary" onClick={() => setOpened(chain.submissionId)}>
                      Open in preview
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {open === null ? null : (
          <section aria-labelledby="preview-heading">
            <h2 id="preview-heading" className="text-lg font-semibold">
              {open.state === 'Advanced'
                ? `Release Authority stage — ${open.submissionId}`
                : `Review preview — ${open.submissionId}`}
            </h2>

            {open.state === 'Advanced' ? (
              <div className="mt-2 max-w-prose space-y-2 text-sm text-[var(--color-ink-muted)]">
                <p>
                  At this stage the preview is replaced by the diff and the change summary. Change
                  summary: <strong>{seededDiffEngine.diff(open).available ? 'Torque specification updated per engineering change order; severity bands re-based' : 'unavailable'}</strong>. The diff engine belongs to MOD-STU-12 and is injected here; where
                  it is unavailable the submission is <strong>held</strong> rather than advanced,
                  because advancing an unvalidated classification could auto-adopt a behaviour
                  change.
                </p>
              </div>
            ) : (
              <div className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
                <p>
                  The Reviewer steps through each screen exactly as the worker will see it, in a
                  chosen locale and difficulty level. The four review obligations, each with a tick
                  and a comment box:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {REVIEW_OBLIGATIONS.map((obligation) => (
                    <li key={obligation}>{obligation}</li>
                  ))}
                </ul>
                <p className="mt-2">
                  The Reviewer cannot edit content directly — corrections go back to the Author. No
                  control on this screen writes into the Workflow, for any role, including the
                  Quality Manager.
                </p>
              </div>
            )}

            <div className="mt-4 max-w-prose">
              <label
                htmlFor="approval-comment"
                className="block text-sm font-medium text-[var(--color-ink)]"
              >
                {open.state === 'Advanced'
                  ? 'Reason (mandatory on Decline)'
                  : 'Comments to the Author (mandatory on Return)'}
              </label>
              <textarea
                id="approval-comment"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm"
              />
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                A return with no comments is refused, because the comment is the instruction to the
                Author. A Decline with no reason is refused for the same reason.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-start gap-3">
              {open.state === 'Submitted' ? (
                <>
                  {control(
                    'return-with-comments',
                    'Return with comments',
                    open,
                    () => run(() => returnWithComments(open, context)),
                    'return-control',
                  )}
                  {control(
                    'advance-to-release',
                    'Advance',
                    open,
                    () => run(() => advance(open, context)),
                    'advance-control',
                  )}
                  {/*
                    Row 3 of the card (L33272), rendered where it binds. It can
                    never be enabled for anybody — `FUNC-STU-11-01-B-3`
                    (L33300) allows it to no role, `AC-STU-098` (L33398) says
                    "in any path", and there is no `act` because there is no
                    act. What varies is DISABLED against ABSENT, and it is the
                    matrix's `routedTo` that decides which: a Reviewer-stage
                    persona sees the rule and the route beside it, and everyone
                    else sees nothing to click at all.
                  */}
                  {control(
                    'edit-content-while-reviewing',
                    'Edit the content here',
                    open,
                    () => undefined,
                    'edit-while-reviewing-control',
                  )}
                  {control(
                    'author-and-submit',
                    'Withdraw',
                    open,
                    () => run(() => withdraw(open, context)),
                    'withdraw-control',
                    open.authorOfRecord === viewer.identity.identityId
                      ? null
                      : `withdrawal belongs to the Author of this submission, ${open.authorOfRecord}, and nobody else performs it`,
                  )}
                </>
              ) : null}
              {open.state === 'Advanced' ? (
                <>
                  {control(
                    'release-and-publish',
                    'Release',
                    open,
                    () => run(() => release(open, context)),
                    'release-control',
                  )}
                  {control(
                    'release-and-publish',
                    'Decline',
                    open,
                    () => run(() => decline(open, context)),
                    'decline-control',
                  )}
                </>
              ) : null}
              {open.state === 'Returned with comments'
                ? control(
                    'author-and-submit',
                    'Revise and resubmit',
                    open,
                    () => run(() => resubmit(open, context)),
                    'resubmit-control',
                    open.authorOfRecord === viewer.identity.identityId
                      ? null
                      : `corrections go back to the Author of this submission, ${open.authorOfRecord}`,
                  )
                : null}
            </div>

            {open.state === 'Submitted' ? (
              <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                Withdrawal is `Recommendation — R&amp;D` (FUNC-STU-11-01-A-2): the Statement of Work
                does not describe it, and it weakens no control — it exists so an accidental
                submission does not have to be corrected through a meaningless review cycle.
              </p>
            ) : null}

            {open.comments.length === 0 ? null : (
              <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-muted)]">
                {open.comments.map((c) => (
                  <li key={`${c.at}-${c.by}`}>
                    {c.by} on {c.at} ({c.transition}): {c.text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section aria-labelledby="audit-heading">
          <h2 id="audit-heading" className="text-lg font-semibold">
            The audited transition
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Every transition is permanently recorded with role, timestamp, version and comments, and
            commits in the same transaction as the state change. The audit write happens after every
            domain refusal and <strong>before</strong> any change: if it does not commit, the
            transition did not happen and the submission stays at its prior stage.
          </p>
          <div className="mt-2">
            <Checkbox
              label="Simulate an audit-write failure on the next transition"
              checked={auditWillFail}
              onChange={setAuditWillFail}
            />
          </div>
          {outcomeNote === null ? null : (
            <p role="status" className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
              {outcomeNote}
            </p>
          )}
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
            {log.map((entry, index) => (
              <li key={`${entry.at}-${entry.transition}-${index}`}>
                {entry.kind} · {entry.submissionId} · {entry.transition} · {entry.actor} ·{' '}
                {entry.role ?? 'no role'} · {entry.at} · {entry.version ?? 'no version'} ·{' '}
                {entry.fromState ?? 'no prior state'} → {entry.toState ?? 'no state change'}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="staffing-heading">
          <h2 id="staffing-heading" className="text-lg font-semibold">
            When the chain cannot be staffed — {FB_SEQ_012.id}
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {FB_SEQ_012.primaryFailure}. Detection: {FB_SEQ_012.detection}. First fallback:{' '}
            {FB_SEQ_012.firstFallback}. Fallback failure: {FB_SEQ_012.fallbackFailure}. Terminal safe
            state: {FB_SEQ_012.terminalSafeState}. Recovery: {FB_SEQ_012.recovery}. What it proves:{' '}
            {FB_SEQ_012.whatItProves}.
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
            Against a one-Quality-Manager tenant this check refuses before submission and names the
            shortfall: <strong>{shortfall.staffable ? 'staffable' : shortfall.reason}</strong>
          </p>
          {stalled === null ? null : (
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              In that state the submission stays {stalled.submission?.status ?? 'Submitted'} and
              carries the <strong>Stalled</strong> flag — a flag, never a sixth submission state.
              Versions: {stalled.versions.length}. Work packages: {stalled.workPackages.length}.
              Versions a Job could link to: {linkableVersions(stalled).length}. Work does not get
              published faster; it does not get published at all.
            </p>
          )}
        </section>

        <section aria-labelledby="relauth-heading">
          <h2 id="relauth-heading" className="text-lg font-semibold">
            An open client decision governs the staffing rule
          </h2>
          <div className="mt-2">
            <DecisionDisclosure id="D26" />
          </div>
        </section>

        <section aria-labelledby="laneb-heading">
          <h2 id="laneb-heading" className="text-lg font-semibold">
            The chain against Lane-B automatic publication
          </h2>
          <div className="mt-2">
            <DecisionDisclosure id="D14" />
          </div>
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {seededLaneBClassifier.provenance}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
            {LANE_B_VALUE_CLASSES.map((valueClass) => {
              const routing = laneBEntersTheChain(valueClass)
              return (
                <li key={valueClass}>
                  <span className="font-medium text-[var(--color-ink)]">{valueClass}</span> —{' '}
                  {routing.routesThroughChain
                    ? 'routes through the full three-stage chain'
                    : 'the single Lane-B decision stands'}
                  . {routing.reason}
                </li>
              )
            })}
          </ul>
          <ul className="mt-2 space-y-1 text-xs text-[var(--color-ink-subtle)]">
            {Object.entries(SEEDED_LANE_B_FIELD_MAP).map(([field, valueClass]) => (
              <li key={field}>
                {field} → {valueClass}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="reuse-heading">
          <h2 id="reuse-heading" className="text-lg font-semibold">
            One governance floor for everything that reaches the floor
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
            {APPROVAL_CONSUMER_CONTRACTS.map((contract) => (
              <li key={contract.id}>
                <span className="font-medium text-[var(--color-ink)]">{contract.id}</span> (
                {contract.ownerModule}) — the same three stages, preview scoped to{' '}
                {contract.previewScope}
                {contract.additionalGates.length === 0
                  ? ''
                  : `, plus ${contract.additionalGates.join(' and ')}`}
                {contract.decisionRef === null ? '' : ` · ${contract.decisionRef} is open`}.{' '}
                <span className="text-xs text-[var(--color-ink-subtle)]">{contract.sourceRef}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="notify-heading">
          <h2 id="notify-heading" className="text-lg font-semibold">
            Notifications — and what none of them proves
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Delivery, opening and acknowledgement are distinct from the business action. None of the
            progression states below is a stage of the chain, and none of them proves an approval
            happened. Nothing here advances a submission, and neither does time: a submission that
            ages past the review interval raises an escalation notification and stays exactly where
            it is.
          </p>
          <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
            {approvalNotificationRows().map((row) => (
              <li key={row.trigger}>
                <span className="font-medium text-[var(--color-ink)]">{row.trigger}</span> →{' '}
                {row.recipient} · {row.channel} · {row.progression.join(', ')} ·{' '}
                {row.provesApproval ? '' : 'proves no approval'}
              </li>
            ))}
          </ul>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            The review-queue ageing interval is not specified in the Statement of Work (L33385). The
            Delivery Operations Hub&rsquo;s 24, 48 and 72 hour highlights are adopted here as
            `Recommendation — R&amp;D`, which changes no control.
          </p>
        </section>

        <section aria-labelledby="matrix-heading">
          <h2 id="matrix-heading" className="text-lg font-semibold">
            Who may do what, per control
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Each control above asks this table for its own row and gets its own answer. There is no
            module-level role list anywhere in this module.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
            {STU_11_MATRIX.map((row) => {
              const cell = row.cells[persona]
              return (
                <li key={row.id}>
                  <span className="font-medium text-[var(--color-ink)]">{row.capability}</span> —{' '}
                  {cell.note}{' '}
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    {row.sourceRefs.join(', ')}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            The state diagram draws two nodes the enumeration does not carry, recorded rather than
            minted as states:{' '}
            {DIAGRAM_ONLY_NODES.map((node) => `${node.node} — ${node.note}`).join(' ')}
          </p>
        </section>
      </div>
    </StudioShell>
  )
}
