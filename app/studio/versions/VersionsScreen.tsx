'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import { screenState } from '@/ui/screen-state'
import { renderAdoption, renderAdoptionSummary } from '@/studio/state/adoption'
import { PUBLISH_CHECKS } from '@/studio/publish/checks'
import { evaluatePublish, registeredOwners } from '@/studio/publish/register'
import {
  JOB_OWNER_COLUMN_CELLS,
  STU_12_CROSS_SURFACE,
  STU_12_MATRIX,
  STU_12_SOURCE_ROW_COUNT,
  versionRow,
  type StudioVersionCapabilityId,
} from '@/studio/modules/stu-12/matrix'
import {
  VERSION_CHANGE_KINDS,
  screenLevelDiff,
  seededVersionDiffEngine,
} from '@/studio/modules/stu-12/diff'
import {
  ADOPTION_STATES,
  EXPORT_SECTIONS,
  ROLLBACK_DISCLOSURE,
  VERSION_STATES,
  VERSION_TRANSITIONS,
  adoptionState,
  archive,
  decideAdoption,
  deleteVersion,
  editInPlace,
  exportVersion,
  hideVersion,
  mintedNumbers,
  nextVersionNumber,
  publish,
  reconcileVersionNumbers,
  rollback,
  swapPinnedPackage,
  versionAffordance,
  versionRoute,
  visibleLinkage,
  pendingSubmission,
  visibleVersions,
  type ExportOutcome,
  type VersionAuditEntry,
  type VersionContext,
  type VersionOutcome,
  type VersionRegister,
} from '@/studio/modules/stu-12/versions'
import { Button, Checkbox, EmptyState, Select, StatusPill } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { StudioShell } from '../StudioShell'
import {
  CHECK_SCENARIO_IDS,
  FIXTURE_AS_OF,
  FIXTURE_DOMAIN,
  FIXTURE_REGISTER,
  JOB_OWNER_IDENTITY,
  LINKAGE_UNAVAILABLE,
  RELEASED_SUBMISSION,
  SEEDED_DEVICES,
  SEEDED_VIEWERS,
  registerFor,
  type CheckScenarioId,
} from './fixtures'

/**
 * `SCR-STU-12` — Version Control (`SB-STU-15`, L33546), with catalogue A's
 * `SCR-STU-VERSION`, `SCR-STU-DIFF` and `SCR-STU-LINKAGE` folded in as the
 * three sub-views they are (D1).
 *
 * THE SCREEN DECIDES NOTHING. Every affordance comes from
 * `versionAffordance`, which is `evaluateStudioAccess` over one matrix row;
 * every write goes through `applyVersionAct`, which writes the audit before it
 * mutates. There is no role list in this file and no second copy of any rule.
 *
 * SCOPE IS ENFORCED IN THE READ. `visibleVersions` is what this renders over,
 * and a version belonging to another workspace is refused by slice 3's tenant
 * isolation stage before it reaches a row. Nothing here is drawn and hidden.
 *
 * PUBLICATION CANNOT BE TALKED PAST. The publish control calls `publish`,
 * which evaluates task 5's eleven checks and returns before the audit write if
 * any of them blocks. There is nothing on this screen — no confirmation, no
 * second control, no state — that reaches publication with a blocker
 * outstanding.
 */

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-12')

const VERSION_TONE = { Published: 'ok', Superseded: 'info', Archived: 'neutral' } as const
const ADOPTION_TONE = {
  Notified: 'attention',
  'Decided-adopt': 'ok',
  'Decided-defer': 'info',
  Outdated: 'stale',
} as const

const SCENARIO_LABELS: Readonly<Record<CheckScenarioId, string>> = {
  'all-pass': 'All eleven checks registered and passing',
  'one-fails': 'One check refuses — locale completeness',
  'one-cannot-run': 'One check cannot answer — severity mapping',
  'ten-unregistered': 'The live register of this wave — ten checks have no implementation',
}

export function VersionsScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [register, setRegister] = useState<VersionRegister>(FIXTURE_REGISTER)
  const [scenario, setScenario] = useState<CheckScenarioId>('all-pass')
  const [auditWillFail, setAuditWillFail] = useState(false)
  const [log, setLog] = useState<readonly VersionAuditEntry[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [compareTo, setCompareTo] = useState('v2.1.0')

  const viewer = SEEDED_VIEWERS[persona]

  const context: VersionContext = {
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
  }

  return (
    <StudioShell module={MODULE} screenId="SCR-STU-12" persona={persona} onPersonaChange={setPersona}>
      <VersionControl
        persona={persona}
        viewerNote={viewer.note}
        register={register}
        setRegister={setRegister}
        scenario={scenario}
        setScenario={setScenario}
        auditWillFail={auditWillFail}
        setAuditWillFail={setAuditWillFail}
        log={log}
        note={note}
        setNote={setNote}
        compareTo={compareTo}
        setCompareTo={setCompareTo}
        context={context}
      />
    </StudioShell>
  )
}

interface VersionControlProps {
  readonly persona: StudioPersonaId
  readonly viewerNote: string
  readonly register: VersionRegister
  readonly setRegister: (next: VersionRegister) => void
  readonly scenario: CheckScenarioId
  readonly setScenario: (next: CheckScenarioId) => void
  readonly auditWillFail: boolean
  readonly setAuditWillFail: (next: boolean) => void
  readonly log: readonly VersionAuditEntry[]
  readonly note: string | null
  readonly setNote: (next: string | null) => void
  readonly compareTo: string
  readonly setCompareTo: (next: string) => void
  readonly context: VersionContext
}

function VersionControl(props: VersionControlProps) {
  const { persona, register, context } = props
  const checks = registerFor(props.scenario)
  const visible = visibleVersions(register, context)
  const linkage = visibleLinkage(register, context, LINKAGE_UNAVAILABLE)
  const evaluation = evaluatePublish(checks, {
    staffing: RELEASED_SUBMISSION.staffing,
    author: RELEASED_SUBMISSION.author,
  })
  const owners = registeredOwners(checks)
  const diff = screenLevelDiff(seededVersionDiffEngine('MINOR'), props.compareTo, '(pending)')
  const published = register.versions[0]!
  const linkageSeam = stuSeamById(STU_SEAMS, 'job-and-run-linkage-counts')
  const ownerSeam = stuSeamById(STU_SEAMS, 'job-owner-and-adoption-decision')
  const reconciliation = reconcileVersionNumbers(mintedNumbers(register), [
    ...mintedNumbers(register).filter((n) => n !== 'v2.0.1'),
  ])

  /**
   * The one rendering rule for every control on this screen, and the two cases
   * it keeps apart.
   *
   * `Explicitly prohibited` — the MATRIX CELL'S OWN TOKEN — carries no
   * rendering: nothing is drawn that could be mistaken for a control, only a
   * note saying so. That is read off the row, through the columns the
   * evaluator actually resolved, never re-derived here.
   *
   * Everything else that refuses is DISABLED WITH THE REASON NAMED, which is
   * how `SB-STU-15` states the archive control — "disabled with the reason
   * stated while active Jobs exist".
   */
  function control(
    capability: StudioVersionCapabilityId,
    label: string,
    act: () => void,
    objectReason: string | null = null,
  ) {
    const row = versionRow(capability)
    const decision = versionAffordance(row, context, register.tenant, {
      author: RELEASED_SUBMISSION.author,
      reviewer: RELEASED_SUBMISSION.reviewer,
      releaseAuthority: RELEASED_SUBMISSION.releaseAuthority,
    })
    // THE ROUTED PROHIBITION. Decided in the domain (`versionRoute`), drawn
    // here. Null on every cell of this card today — the reasons are on
    // `versionRoute` itself, beside the check rather than beside the drawing.
    const routedTo = versionRoute(row, context, register.tenant, {
      author: RELEASED_SUBMISSION.author,
      reviewer: RELEASED_SUBMISSION.reviewer,
      releaseAuthority: RELEASED_SUBMISSION.releaseAuthority,
    })
    if (routedTo !== null) {
      return (
        <span data-control={capability} data-enabled="false">
          <Button
            variant="secondary"
            disabledReason={`${label} is disabled because ${decision.reason} ${versionRow(routedTo).capability} is the route open to you and is enabled beside this one.`}
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
        <span data-control={capability} data-enabled="absent">
          <ProhibitionNotice rendering={{ kind: 'absent', note: `${label}: ${decision.reason}` }} />
        </span>
      )
    }
    // `readOnly` is permitted on the export row and only there — the token
    // "Read-only — may generate the read-only export" carries its own
    // instruction, and mapping it to a disabled control would remove an export
    // the source grants. The domain answers that, not this component.
    const permitted =
      decision.outcome === 'allowed' ||
      decision.outcome === 'allowedWithConditions' ||
      (capability === 'export-a-version' && decision.outcome === 'readOnly')
    if (!permitted || objectReason !== null) {
      return (
        <span data-control={capability} data-enabled="false">
          <Button
            variant="secondary"
            disabledReason={`${label} is disabled because ${permitted ? objectReason : decision.reason}`}
          >
            {label}
          </Button>
        </span>
      )
    }
    return (
      <span data-control={capability} data-enabled="true">
        <Button variant="secondary" onClick={act}>
          {label}
        </Button>
      </span>
    )
  }

  /**
   * The one place an act's outcome reaches the screen. A refusal is reported
   * with its own reason and its own code; a failed audit write is reported
   * beside it and never revives the act.
   */
  function run(step: () => VersionOutcome | ExportOutcome) {
    const outcome = step()
    if (outcome.ok) {
      props.setRegister(outcome.register)
      props.setNote(
        `Recorded — ${outcome.audit.detail}. The audit entry committed in the same transaction as the change.`,
      )
      return
    }
    props.setNote(
      `Refused — ${outcome.refusal.code}. ${outcome.refusal.reason}${
        outcome.auditFailure === null
          ? ''
          : ` The refusal’s own audit write also failed: ${outcome.auditFailure}. The refusal stands regardless.`
      }`,
    )
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="purpose-heading">
        <h2 id="purpose-heading" className="text-lg font-semibold">
          The version number is the audit receipt
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every published Workflow carries a semantic version, <code>vMAJOR.MINOR.PATCH</code>. At
          republish the Author selects the bump classification and the Reviewer validates it against
          the diff — a mis-classified patch is returned, because the classification decides how the
          change reaches the floor. Anyone can answer &ldquo;which limits were in force for this
          run&rdquo; from the version number alone.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          Viewing as {SEEDED_VIEWERS[persona].identity.identityId}. {props.viewerNote}
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          {pendingSubmission(register) === null
            ? 'No submission is awaiting publication on this Workflow.'
            : `${pendingSubmission(register)?.submissionId} is ${pendingSubmission(register)?.state} and awaiting publication.`}{' '}
          Publication is what clears it; a publication that could not be audited leaves it exactly
          where it was.
        </p>
      </section>

      <section aria-labelledby="states-heading">
        <h2 id="states-heading" className="text-lg font-semibold">
          Screen states this surface applies here
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {STU_APPLICABLE_STATES.filter((row) => screenRendersState('SCR-STU-12', row.id)).map(
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
          There is no offline state here. Publication, history, diff, linkage, archival and export
          all require the Studio. On the device the pinned version governs regardless of what has
          been published centrally, and the first-screen change notice renders from the package with
          no connectivity — but that is the Frontline surface, not this one.
        </p>
      </section>

      <section aria-labelledby="classes-heading">
        <h2 id="classes-heading" className="text-lg font-semibold">
          The three classes, and what makes a change notified
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          PATCH covers corrections that change no operating behaviour. MINOR and MAJOR are the
          notified classes — changes to what the worker does or what the platform enforces — with
          MAJOR marking restructuring. A patch auto-adopts; a notified class waits for the owner
          named on each Job.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {VERSION_CHANGE_KINDS.map((kind) => (
            <li key={kind.id}>
              <span className="font-medium text-[var(--color-ink)]">{kind.words}</span> —{' '}
              {kind.notified
                ? `notified${kind.marksMajor ? ', and marks MAJOR' : ', so a PATCH carrying it is returned'}`
                : 'no operating behaviour changes, so it may be a PATCH'}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">{kind.sourceRef}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          From {props.compareTo} the next number would be {nextVersionNumber(props.compareTo, 'PATCH')}{' '}
          as a PATCH, {nextVersionNumber(props.compareTo, 'MINOR')} as a MINOR and{' '}
          {nextVersionNumber(props.compareTo, 'MAJOR')} as a MAJOR. Every republish requires a
          mandatory description of what changed and why; it is stored permanently for every class,
          and for a notified class it is also the worker-facing change notice.
        </p>
      </section>

      <section aria-labelledby="checks-heading">
        <h2 id="checks-heading" className="text-lg font-semibold">
          Publish-time validation — a gate set, not a warning set
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Eleven checks stand between a released submission and the floor. Where a check refuses,
          where a check cannot answer, and where no module has registered an implementation for it
          at all, publication is blocked, failing closed, with the specific check named. Nothing is
          published; the prior version remains in force. There is no way past a blocker on this
          screen and none in the module behind it.
        </p>
        <div className="mt-3 max-w-md">
          <Select
            label="Publish-check scenario (reviewer control — not part of the product)"
            value={props.scenario}
            options={CHECK_SCENARIO_IDS.map((id) => ({ value: id, label: SCENARIO_LABELS[id] }))}
            onChange={(value) => {
              const found = CHECK_SCENARIO_IDS.find((id) => id === value)
              if (found !== undefined) props.setScenario(found)
            }}
          />
        </div>
        <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {PUBLISH_CHECKS.map((check) => {
            const blocker = evaluation.blockers.find((b) => b.checkId === check.id)
            return (
              <li key={check.id} data-testid={`check-${check.id}`}>
                <StatusPill
                  tone={blocker === undefined ? 'ok' : blocker.kind === 'failed' ? 'blocked' : 'stale'}
                  icon={blocker === undefined ? '✓' : '■'}
                  label={blocker === undefined ? 'passed' : blocker.kind}
                />{' '}
                <span className="font-medium text-[var(--color-ink)]">
                  {check.ordinal}. {check.id}
                </span>{' '}
                — {blocker === undefined ? check.refuses : blocker.blockingElement}{' '}
                <span className="text-xs text-[var(--color-ink-subtle)]">
                  {check.sourceRef} · implemented by {owners.get(check.id) ?? 'nobody yet'}
                </span>
                {check.note === null ? null : (
                  <span className="block text-xs text-[var(--color-ink-subtle)]">{check.note}</span>
                )}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
          {evaluation.blocked
            ? `Publication is blocked by ${evaluation.blockers.length} of the eleven.`
            : 'All eleven answered and none refuses.'}
        </p>
      </section>

      <section aria-labelledby="publish-heading">
        <h2 id="publish-heading" className="text-lg font-semibold">
          Publish {RELEASED_SUBMISSION.submissionId}
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The submission has passed all three approval stages. The Release Authority signs off
          against the diff and the change summary; the classification and the republish description
          are carried into the version record; a new version number is minted. Where the publication
          transaction fails, no version number is minted.
        </p>
        <div className="mt-3">
          <Checkbox
            label="Simulate an audit-write failure on the next act"
            checked={props.auditWillFail}
            onChange={props.setAuditWillFail}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          {control('publish-a-version', `Publish as ${RELEASED_SUBMISSION.bump}`, () =>
            run(() => publish(register, RELEASED_SUBMISSION, context, checks)),
          )}
          {control(
            'export-a-version',
            'Export the current version',
            () =>
              run(() =>
                exportVersion(register, published.number, (section) => ({
                  ok: true,
                  text: `${section} of ${published.number}`,
                }), context),
              ),
          )}
        </div>
        {props.note === null ? null : (
          <p role="status" className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
            {props.note}
          </p>
        )}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The export renders {EXPORT_SECTIONS.length} sections and carries the version number, the
          publication date and the approval log, so a document circulating outside the platform can
          be traced back to its record. A partial export is never produced: the export either
          completes or fails with the reason stated.
        </p>
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-lg font-semibold">
          Version history — newest first
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Prior versions are retained in full and remain permanently readable. A version is{' '}
          {VERSION_STATES.join(', ')} — and never <em>Outdated</em>, which is the per-Job adoption
          state and belongs on the Job.
        </p>
        {visible.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No version is readable from this view"
              whatCreatesIt="A version appears here when a Release Authority publishes one in this workspace and this persona’s version-history cell permits the read. The Worker is prohibited outright; the Read-only Auditor’s cell defers to DEC-AUDSTU-001, which is open."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {visible.map((version) => (
              <li
                key={version.number}
                data-testid={`version-row-${version.number}`}
                className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-[var(--color-ink)]">{version.number}</span>
                  <StatusPill tone="info" icon="◆" label={version.bump} />
                  <StatusPill
                    tone={VERSION_TONE[version.state]}
                    icon="●"
                    label={version.state}
                  />
                  <StatusPill
                    tone={version.distributable ? 'ok' : 'stale'}
                    icon="▣"
                    label={version.distributable ? 'distributable' : 'not yet distributable'}
                  />
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    published {version.publishedAt} · Release Authority {version.releaseAuthority}
                  </span>
                </div>
                <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {version.description}
                </p>
                <div className="mt-2 flex flex-wrap items-start gap-3">
                  {control(
                    'archive-a-version',
                    `Archive ${version.number}`,
                    () =>
                      run(() =>
                        archive(register, version.number, { determinable: true, activeJobs: [] }, context),
                      ),
                    version.state === 'Archived'
                      ? 'it is already archived, and the version state machine draws no edge from Archived to Archived'
                      : register.jobs.some((j) => j.onVersion === version.number)
                        ? `active Jobs still run it: ${register.jobs
                            .filter((j) => j.onVersion === version.number)
                            .map((j) => j.jobId)
                            .join(', ')}`
                        : null,
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          On restoration, minted version numbers are reconciled against audit entries and any gap is
          reported; a version number is never re-used. This register mints{' '}
          {mintedNumbers(register).length} numbers; reconciliation reports{' '}
          {reconciliation.gaps.length === 0 ? 'no gap' : `a gap at ${reconciliation.gaps.join(', ')}`}{' '}
          and {reconciliation.reused.length === 0 ? 'no re-use' : `re-use of ${reconciliation.reused.join(', ')}`}.
        </p>
      </section>

      <section aria-labelledby="diff-heading">
        <h2 id="diff-heading" className="text-lg font-semibold">
          The screen-level diff
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Which screens changed, what instruction text was added or removed, what specification-limit
          values changed, and what severity-mapping or deviation-rule updates were made. Where the
          diff engine is unavailable the classification cannot be validated and the submission is
          held rather than advanced.
        </p>
        <div className="mt-3 max-w-xs">
          <Select
            label="Compare from"
            value={props.compareTo}
            options={register.versions
              .filter((v) => v.tenant === register.tenant)
              .map((v) => ({ value: v.number, label: v.number }))}
            onChange={props.setCompareTo}
          />
        </div>
        {diff.available ? (
          <>
            <p className="mt-2 text-sm text-[var(--color-ink)]">
              {diff.changedScreens.length} changed screens. {diff.changeSummary}.
            </p>
            <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
              {diff.changedScreens.map((screen) => (
                <li key={screen.screen}>
                  <span className="font-medium text-[var(--color-ink)]">
                    Screen {screen.screen} — {screen.name}
                  </span>
                  <ul className="mt-1 space-y-1 pl-5">
                    {screen.fields.map((field) => (
                      <li
                        key={field.field}
                        className={
                          field.isSpecificationLimit
                            ? 'rounded-[var(--radius-control)] bg-[var(--color-surface-sunken)] px-2 py-1'
                            : undefined
                        }
                      >
                        {field.field}: <em>{field.before}</em> → <strong>{field.after}</strong>
                        {field.isSpecificationLimit ? ' — a specification limit' : ''}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-ink)]">{diff.reason}</p>
        )}
      </section>

      <section aria-labelledby="linkage-heading">
        <h2 id="linkage-heading" className="text-lg font-semibold">
          Job and Run linkage
        </h2>
        <div className="mt-2">
          <StudioSeamNotice seam={linkageSeam} />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
          {linkage.available
            ? `${linkage.jobs.length} Jobs are on a version of this Workflow.`
            : `Linkage unavailable, last retrieved at ${linkage.lastRetrievedAt} — ${linkage.reason}. This is an absence, not a zero: zero is a business answer and nobody has given one.`}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {register.runs.map((run_) => (
            <li key={run_.runId}>
              {run_.runId} on {run_.jobId} — pinned to <strong>{run_.pinnedVersion}</strong>,{' '}
              {run_.inFlight ? 'in flight' : 'complete'}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="adoption-heading">
        <h2 id="adoption-heading" className="text-lg font-semibold">
          Adoption — decided by the owner named on each Job
        </h2>
        <div className="mt-2">
          <StudioSeamNotice seam={ownerSeam} />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Adoption per Job is {ADOPTION_STATES.join(', ')}, the last of which is what the update
          window produces when nobody decides. The decision keys to the Job Owner{' '}
          <strong>field</strong> on the Job record — defaulting to the creator and reassignable, and
          not a role. A Supervisor cannot force adoption on a Job they do not own, and no Studio role
          acts for the Job Owner.
        </p>
        <ul className="mt-3 space-y-3">
          {register.jobs.map((job) => {
            const row = register.adoption.find((a) => a.jobId === job.jobId) ?? {
              jobId: job.jobId,
              ownerId: job.ownerId,
              onVersion: job.onVersion,
              decision: null,
              notifiedAt: null,
              decidedAt: null,
              windowHours: job.windowHours,
            }
            const state = adoptionState(row, FIXTURE_AS_OF)
            return (
              <li
                key={job.jobId}
                data-testid={`adoption-row-${job.jobId}`}
                className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-[var(--color-ink)]">{job.jobId}</span>
                  <StatusPill tone={ADOPTION_TONE[state]} icon="●" label={state} />
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    owner field: {job.ownerId} · on {job.onVersion} · {job.windowHours}-hour update
                    window
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-start gap-3">
                  {control(
                    'decide-adoption',
                    `Adopt on ${job.jobId}`,
                    () => run(() => decideAdoption(register, row, 'adopt', context)),
                    context.actor.identityId === job.ownerId
                      ? null
                      : `the Job Owner field on ${job.jobId} names ${job.ownerId}, and ${context.actor.identityId} is not that person`,
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          The Job Owner in this scenario is {JOB_OWNER_IDENTITY}, who is not one of the eight persona
          columns and does not need to be: the permission keys on a field value, so the same Quality
          Manager is refused on a Job she does not own and permitted on one she does.
        </p>
      </section>

      <section aria-labelledby="devices-heading">
        <h2 id="devices-heading" className="text-lg font-semibold">
          What the devices report
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {renderAdoptionSummary({ jobsNotified: register.jobs.length, devicesOnVersion: 0, devicesTotal: SEEDED_DEVICES.length })}{' '}
          Adoption is reported per device with explicit command states, from the Delivery Operations
          Hub, and never as a binary claim. Until a command reaches applied, the device is not on the
          new version and no view here says otherwise.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {SEEDED_DEVICES.map((device) => {
            const rendering = renderAdoption(device)
            return (
              <li key={device.deviceId} data-testid={`device-${device.deviceId}`}>
                {rendering.label}
                {rendering.determinate ? '' : ' — never as adopted'}
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="pinning-heading">
        <h2 id="pinning-heading" className="text-lg font-semibold">
          The pinning guarantee
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Runs in progress continue on the version they started. The per-run pinned package is never
          swapped mid-run by a notified-class publish, and this is the one row of the permission
          table where every one of the seven source columns refuses — the Job Owner column included,
          where ten of the other eleven rows read <em>Not applicable</em>.
        </p>
        <div className="mt-2">
          {control('swap-pinned-package-in-flight', 'Swap the pinned package', () => undefined)}
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          {swapPinnedPackage(register.runs[0]!, 'v2.2.0').reason}
        </p>
        <div className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm">
          <p className="font-medium text-[var(--color-ink)]">
            {STU_12_CROSS_SURFACE[0]!.capability} — a cross-surface statement, never a Studio control
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            Rebasing a scheduled Run is at the supervisor&rsquo;s discretion in the Delivery
            Operations Hub, owned by {STU_12_CROSS_SURFACE[0]!.owner}. It is one of the twelve rows
            of this module&rsquo;s permission table and it is not one of this screen&rsquo;s
            controls, so it is described here rather than drawn.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-[var(--color-ink-subtle)]">
            {STU_12_CROSS_SURFACE[0]!.cells.map((cell) => (
              <li key={cell.column}>
                {cell.column}: {cell.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="rollback-heading">
        <h2 id="rollback-heading" className="text-lg font-semibold">
          Rolling back a defective version
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The question of whether a version can be marked withdrawn is open, and it carries{' '}
          <strong>two</strong> source identifiers with no cross-reference between them. The
          behaviour, by contrast, is not open at all:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {/* Keyed on the STATEMENT, not the locator. Three of these five
              rows cite L53706, so keying on the locator gave three siblings
              one key — which React reconciles by dropping or mis-updating
              rows, silently losing a settled-behaviour statement from a
              disclosure whose whole job is to be complete. The statements
              are distinct; `tests/coverage/slice-05-gates.test.ts`'s
              ROLLBACK_ALIAS_FIXTURE asserts all five reach the page. */}
          {ROLLBACK_DISCLOSURE.settledBehaviour.map((settled) => (
            <li key={settled.statement}>
              {settled.statement}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">[{settled.locator}]</span>
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-subtle)]">
          <li>{deleteVersion(published).reason}</li>
          <li>{hideVersion(published).reason}</li>
          <li>{editInPlace(published).reason}</li>
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
          {(() => {
            const forward = rollback(published, { skipChain: false })
            return forward.ok ? forward.note : forward.reason
          })()}
        </p>
        <div className="mt-3">
          <DecisionDisclosure id="D7" />
        </div>
      </section>

      <section aria-labelledby="disclosure-heading">
        <h2 id="disclosure-heading" className="text-lg font-semibold">
          The open decisions this module meets
        </h2>
        <div className="mt-2 space-y-4">
          <DecisionDisclosure id="D5" />
          <DecisionDisclosure id="D6" />
          <DecisionDisclosure id="D21" />
          <DecisionDisclosure id="D28" />
        </div>
      </section>

      <section aria-labelledby="machine-heading">
        <h2 id="machine-heading" className="text-lg font-semibold">
          The version state machine
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {VERSION_TRANSITIONS.map((definition) => (
            <li key={definition.id}>
              <span className="font-medium text-[var(--color-ink)]">{definition.id}</span> — drawn
              from {definition.from.join(' or ')} to{' '}
              {definition.to ?? 'a derived state, because a later version decides it'}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">{definition.sourceRef}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          Anything the table does not draw is refused, and the refusal names the origin it was not
          drawn from. Archival is a deliberate act against a clear no-active-Jobs indicator; where
          the indicator cannot be computed, archival is blocked rather than performed on an
          assumption.
        </p>
      </section>

      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="text-lg font-semibold">
          The audited act
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Version minting, classification, the republish description, adoption decisions, archival
          and export generation are all audited. The audit write happens after every domain refusal
          and <strong>before</strong> any change: if it does not commit, the act did not happen, no
          version number is minted, no adoption row is written, and the prior version remains in
          force.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {props.log.map((entry, index) => (
            <li key={`${entry.at}-${entry.act}-${index}`}>
              {entry.kind} · {entry.act} · {entry.actor} · {entry.role ?? 'no role'} · {entry.at} ·{' '}
              {entry.versionNumber ?? 'no version'} · {entry.detail}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="matrix-heading">
        <h2 id="matrix-heading" className="text-lg font-semibold">
          Who may do what, per control
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The source&rsquo;s table has {STU_12_SOURCE_ROW_COUNT} data rows: the{' '}
          {STU_12_MATRIX.length} controls below, plus the rebase, which belongs to another surface.
          Each control above asks this table for its own row and gets its own answer, and the seventh
          column is a field on the Job rather than a persona.
        </p>
        <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
          {STU_12_MATRIX.map((row) => (
            <li key={row.id}>
              <span className="font-medium text-[var(--color-ink)]">{row.capability}</span> —{' '}
              {row.cells[persona].note}
              <span className="block text-xs text-[var(--color-ink-subtle)]">
                Job Owner column: {JOB_OWNER_COLUMN_CELLS[row.id].text} · {row.sourceRefs.join(', ')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
