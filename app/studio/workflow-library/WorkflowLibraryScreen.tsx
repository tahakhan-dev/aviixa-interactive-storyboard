'use client'

import { useState } from 'react'
import { StudioShell } from '../StudioShell'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { STUDIO_GRANT_STATES, type StudioGrantState } from '@/studio/access/grants'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import {
  DEFAULT_FILTERS,
  LIBRARY_AS_OF,
  SEEDED_LIBRARY,
  SEEDED_SCENARIO,
  SEEDED_TAXONOMY_COUNTS,
  STATE_MACHINE_NOTES,
  UNSPECIFIED_IN_SOURCE,
  WORKFLOW_OBJECT,
  WORKFLOW_TRANSITIONS,
  applyLibraryFilters,
  createCustomType,
  createWorkflow,
  libraryAffordance,
  libraryDecision,
  linkageStatement,
  openWorkflowById,
  type LibraryAuditWrite,
  type LibraryControlRendering,
  type LibraryFilters,
  type LibraryScenario,
  type LibraryState,
  type WorkflowRecord,
  workflowsVisibleTo,
} from '@/studio/modules/stu-03/library'
import { WORKFLOW_STATUSES, type WorkflowStatus } from '@/studio/vocab'
import { STU_03_MATRIX } from '@/studio/modules/stu-03/matrix'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import {
  Button,
  Field,
  Select,
  StatusPill,
  Table,
  type StatusTone,
  type TableRow,
} from '@/ui/primitives'
import type { ScreenStateId } from '@/ui/screen-state'

/**
 * `MOD-STU-03` — the Workflow Library and Tenant Workspace, on `SCR-STU-02`
 * (L48260, catalogue B). Catalogue A calls the same view `SCR-STU-LIBRARY`
 * (L31069) and its New Workflow form `SCR-STU-NEWWF` (L31070); neither is a
 * route key, and the route is keyed on the module slug (D1).
 *
 * **IT IS THE LANDING VIEW.** `AC-STU-017` (L31097): "The Workflow Library is
 * the landing view and opens with the Published filter applied."
 *
 * WHAT THIS SCREEN DECIDES, AND WHERE. Every affordance below is decided PER
 * CONTROL by `libraryAffordance`, which is `evaluateStudioAccess` over one
 * matrix row. There is no module-level role list anywhere in this file, and
 * there could not be one: the source heads eight persona columns against five
 * tenant roles.
 *
 * SCOPE IS ENFORCED IN WHAT THIS SCREEN READS. `workflowsVisibleTo` is the
 * only way rows reach this component, and it applies the tenant filter and
 * the draft-visibility filter to the READ. A row this persona may not read is
 * not drawn and then hidden — it is not here.
 *
 * NO CONTROL IS INVENTED. `SB-STU-06` (L31976) gives this screen a table, a
 * four-control filter bar and one New Workflow button; `SCR-STU-NEWWF` gives
 * the four settings it captures; `FUNC-STU-03-02-B-1` gives the custom-type
 * control. Everything else on this screen is a STATEMENT, because the source
 * states it and does not offer it here — including, above all, the un-archival
 * transition, which the state machine draws and the source cannot support.
 *
 * DETERMINISM: no clock and no random source. The audit sink is a parameter
 * with a reviewer switch and carries no timestamp of its own.
 */

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-03')
const BUILDER = stuModuleById(STU_MODULES, 'MOD-STU-04')
const VERSIONING = stuModuleById(STU_MODULES, 'MOD-STU-12')
const LINKAGE_SEAM = stuSeamById(STU_SEAMS, 'job-and-run-linkage-counts')

/**
 * The states this screen reaches, DERIVED FROM TASK 2'S MODEL rather than
 * hand-picked here. `STATE-07`, `STATE-09`, `STATE-10` and `STATE-11` drop
 * out on their own: the first renders nowhere on this surface (D22) and the
 * other three name other screens (L48330).
 */
const APPLICABLE_STATES: readonly ScreenStateId[] = STU_APPLICABLE_STATES.map((r) => r.id).filter(
  (id) => screenRendersState('SCR-STU-02', id),
)

const PERSONA_LABEL: Readonly<Record<StudioPersonaColumn, string>> = {
  'quality-manager': 'Quality Manager',
  'supervisor-with-authoring-grant': 'Supervisor with GRANT-STU-AUTHOR',
  'supervisor-without-grant': 'Supervisor without the grant',
  'plant-manager-persona': 'Plant Manager persona',
  'tenant-admin': 'Tenant Admin',
  'read-only-auditor': 'Read-only Auditor',
  worker: 'Frontline Worker',
  'implementation-team': 'Implementation team (GRANT-STU-IMPL)',
}

/**
 * The status badge `SB-STU-06` asks for. TOTAL over the four statuses, not a
 * lookup with a fallback: a fifth status fails to compile here rather than
 * quietly rendering as neutral. Colour is never load-bearing on its own —
 * the pill carries a required label and a decorative icon.
 */
const STATUS_BADGE: Readonly<
  Record<WorkflowStatus, { readonly tone: StatusTone; readonly icon: string }>
> = {
  Published: { tone: 'ok', icon: '●' },
  'In Review': { tone: 'info', icon: '◐' },
  Draft: { tone: 'attention', icon: '○' },
  Archived: { tone: 'neutral', icon: '▣' },
}

/** One rendering rule, drawn once. Handed a finished answer; decides nothing. */
function Control({ rendering }: { readonly rendering: LibraryControlRendering }) {
  switch (rendering.kind) {
    case 'enabled':
      return <Button>{rendering.label}</Button>
    case 'disabled':
      return <Button disabledReason={rendering.reason}>{rendering.label}</Button>
    case 'decision-open':
      return (
        <p role="note" className="text-sm text-[var(--color-ink-muted)]">
          <strong>{rendering.label}</strong> is not offered while {rendering.openDecision} is open.{' '}
          {rendering.note}
        </p>
      )
    case 'absent':
      return <ProhibitionNotice rendering={{ kind: 'absent', note: rendering.note }} />
    default: {
      const exhaustive: never = rendering
      throw new Error(`Unhandled library rendering: ${JSON.stringify(exhaustive)}`)
    }
  }
}

export type WorkflowLibraryScreenProps = Partial<LibraryScenario> & {
  readonly screenState?: ScreenStateId
  /** Whether the audit write in the same transaction succeeds or fails. */
  readonly auditPath?: 'commits' | 'write-fails'
  readonly filters?: LibraryFilters
  /** The register, passed in. Never a module-load snapshot closed over. */
  readonly library?: LibraryState
}

export function WorkflowLibraryScreen(props: WorkflowLibraryScreenProps) {
  const [persona, setPersona] = useState<StudioPersonaColumn>(props.persona ?? SEEDED_SCENARIO.persona)
  const [online, setOnline] = useState(props.online ?? SEEDED_SCENARIO.online)
  const [identityLayer, setIdentityLayer] = useState(props.identityLayer ?? SEEDED_SCENARIO.identityLayer)
  const [linkageAvailable, setLinkageAvailable] = useState(
    props.linkageAvailable ?? SEEDED_SCENARIO.linkageAvailable,
  )
  const [implGrant, setImplGrant] = useState<StudioGrantState | null>(
    props.implGrant === undefined ? SEEDED_SCENARIO.implGrant : props.implGrant,
  )
  const [stateId, setStateId] = useState<ScreenStateId>(props.screenState ?? 'STATE-03')
  const [auditPath, setAuditPath] = useState<'commits' | 'write-fails'>(props.auditPath ?? 'commits')
  const [filters, setFilters] = useState<LibraryFilters>(props.filters ?? DEFAULT_FILTERS)
  const [library, setLibrary] = useState<LibraryState>(props.library ?? SEEDED_LIBRARY)
  const [draftName, setDraftName] = useState('Assembly — Crank Bolt Torque')
  const [message, setMessage] = useState(
    'Nothing has been created in this session. The Library opened on the Published filter (AC-STU-017).',
  )

  const scenario: LibraryScenario = {
    persona,
    online,
    identityLayer,
    commercialTier: props.commercialTier ?? SEEDED_SCENARIO.commercialTier,
    authoringGrant: props.authoringGrant === undefined ? SEEDED_SCENARIO.authoringGrant : props.authoringGrant,
    implGrant,
    linkageAvailable,
  }

  /**
   * THE READ. Two selectors over two matrix rows, plus tenant scope, applied
   * before anything is drawn. R14, `AC-STU-048`.
   */
  const readable = workflowsVisibleTo(library, scenario)
  const rows = applyLibraryFilters(readable, filters)

  const writeAudit: LibraryAuditWrite = () =>
    auditPath === 'commits'
      ? { ok: true }
      : { ok: false, reason: 'the tenant audit log refused the append' }

  const newWorkflow = libraryAffordance('create-a-new-workflow', scenario, 'New Workflow')
  const customType = libraryAffordance(
    'create-a-custom-job-type-or-service-type-tag',
    scenario,
    'Create a custom Job Type',
  )
  const seededEdit = libraryAffordance(
    'edit-or-delete-a-platform-seeded-starter-type',
    scenario,
    'Edit a platform-seeded starter type',
  )
  const linkageDecision = libraryDecision('see-linkage-counts', scenario)

  function create() {
    const result = createWorkflow({
      state: library,
      scenario,
      draft: { name: draftName, jobType: library.jobTypes[0]?.name ?? '', serviceTypeTag: null },
      writeAudit,
    })
    setLibrary(result.state)
    setMessage(result.message)
  }

  function addCustomJobType() {
    const result = createCustomType({
      state: library,
      scenario,
      kind: 'Job Type',
      name: 'Heat Treatment',
      writeAudit,
    })
    setLibrary(result.state)
    setMessage(result.message)
  }

  /**
   * The cross-tenant probe. It is a REVIEWER control over the query layer,
   * not a product control: L32004 requires the refusal to be demonstrable,
   * and a claim about a refusal nobody can run is a claim.
   */
  function probeAnotherTenant() {
    const result = openWorkflowById({
      state: library,
      scenario,
      workflowId: 'WF-OTHER-FRAME-WELD',
      writeAudit,
    })
    setMessage(result.ok ? `Opened ${result.workflow.name}.` : result.message)
  }

  const tableRows: TableRow[] = rows.map((workflow) => libraryRow(workflow))

  return (
    <StudioShell
      module={MODULE}
      screenId="SCR-STU-02"
      persona={persona as StudioPersonaId}
      onPersonaChange={(next) => setPersona(next as StudioPersonaColumn)}
    >
      <ScreenStateBoundary
        state={stateId}
        surface="SURF-STU"
        detail={{
          objectLabel: 'Workflows',
          whatCreatesIt:
            'A Quality Manager, a Supervisor holding GRANT-STU-AUTHOR, or the implementation team during onboarding creates one from this screen. Nothing else on the platform creates a Workflow.',
          fieldLabel: 'Job Type',
          rule: 'Every Workflow carries exactly one Job Type (AC-STU-050), and the Job Type must resolve in this workspace.',
          permittedFormat:
            'Choose a Job Type this tenant has created. The platform-seeded catalogue ships empty at version 1 under DEC-TAX-002.',
          asOfLabel: `as at ${LIBRARY_AS_OF}`,
          originLabel: 'the tenant workspace, with linkage from the Delivery Operations Hub',
          decision: linkageDecision.decision,
          readOnlyCause: `Read-only for the ${PERSONA_LABEL[persona]} view: this persona reads the inventory and its linkage counts, and the authoring rows of L31904–L31912 withhold every write.`,
          failureWhat: 'The read of the Workflow inventory failed.',
          wasWritten: false,
          nextStep:
            'No write was attempted and none was queued — the Studio queues nothing, in any state. The Library re-reads records, taxonomy and linkage on reconnection and states the refresh time (L31984).',
          recoveryProgress:
            'Records, taxonomy and linkage are being re-read. Any Workflow whose classification references a taxonomy entry that no longer resolves is flagged with the entry named, and is never silently reclassified (L32008).',
        }}
      >
        <>
          <section aria-labelledby="the-inventory">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="the-inventory" className="text-lg font-semibold">
                  The tenant&rsquo;s Workflow inventory
                </h2>
                <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                  The landing view, opened on the <strong>Published</strong> filter (AC-STU-017,
                  AC-STU-047). Each tenant&rsquo;s workspace is fully isolated: a user in one
                  tenant&rsquo;s workspace can never see another tenant&rsquo;s Workflow content
                  (L31879), and that is applied to the READ rather than to the render.
                </p>
              </div>
              {/* SB-STU-06: the New Workflow button sits top-right. */}
              <div className="shrink-0">
                <Control rendering={newWorkflow} />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Status"
                value={filters.status}
                options={[
                  { value: 'All', label: 'All statuses' },
                  ...WORKFLOW_STATUSES.map((s) => ({ value: s, label: s })),
                ]}
                onChange={(value) =>
                  setFilters({ ...filters, status: value as LibraryFilters['status'] })
                }
              />
              <Select
                label="Job Type"
                value={filters.jobType}
                options={[
                  { value: 'All', label: 'All Job Types' },
                  ...library.jobTypes.map((t) => ({ value: t.name, label: t.name })),
                ]}
                onChange={(value) => setFilters({ ...filters, jobType: value })}
              />
              <Select
                label="Service Type tag"
                value={filters.serviceTypeTag}
                options={[
                  { value: 'All', label: 'All Service Type tags' },
                  ...library.serviceTypeTags.map((t) => ({ value: t.name, label: t.name })),
                ]}
                onChange={(value) => setFilters({ ...filters, serviceTypeTag: value })}
              />
              <Field
                label="Name search"
                description="A deterministic filter, not a semantic one — the only semantic search on this surface is over the Coaching Corpus in MOD-STU-07 (L31986)."
              >
                <input
                  type="search"
                  value={filters.nameSearch}
                  onChange={(event) => setFilters({ ...filters, nameSearch: event.target.value })}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-2 py-1.5 text-sm"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Table
                caption="One row per Workflow: name, status, Job Type, Service Type tag where applied, current version, linkage counts and last published date"
                columns={[
                  { key: 'name', header: 'Workflow' },
                  { key: 'status', header: 'Status' },
                  { key: 'jobType', header: 'Job Type' },
                  { key: 'serviceTypeTag', header: 'Service Type tag' },
                  { key: 'version', header: 'Current version' },
                  { key: 'jobs', header: 'Linked Jobs' },
                  { key: 'runs', header: 'Linked Runs' },
                  { key: 'lastPublished', header: 'Last published' },
                ]}
                rows={tableRows}
                filtered={readable.length > 0 && tableRows.length === 0}
                emptyState={{
                  title: 'No Workflow is readable in this workspace yet.',
                  whatCreatesIt:
                    'A grant-holder selects New Workflow, names it, applies exactly one Job Type and optionally a Service Type tag, and the Studio creates it in Draft.',
                }}
              />
            </div>

            <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-subtle)]">
              Linkage counts are the Jobs and Runs currently linked to each version, read live from
              the Delivery Operations Hub (L31877). Where they cannot be read they render as{' '}
              <em>Linkage unavailable, last retrieved at</em> with the timestamp and{' '}
              <strong>never as zero</strong>, because showing zero linked Jobs would invite an
              author to change a Workflow they believe is unused (L31930, L31956, AC-STU-053). A{' '}
              <strong>live</strong> zero still reads as zero: no linked Jobs is a business answer,
              and the absence of an answer is not.
            </p>

            <p role="status" className="mt-4 max-w-prose text-sm text-[var(--color-ink)]">
              {message}
            </p>
          </section>

          <section aria-labelledby="new-workflow" className="mt-10">
            <h2 id="new-workflow" className="text-lg font-semibold">
              New Workflow — {BUILDER.name} is the next screen, not this one
            </h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Catalogue A&rsquo;s <code>SCR-STU-NEWWF</code> (L31070) captures the four Workflow
              settings before canvas entry. Creating a Workflow lands it in <strong>Draft</strong>{' '}
              and opens the Builder canvas, which is {BUILDER.name}&rsquo;s screen — this module
              feeds it on creation and reads {VERSIONING.name} for version and status (L31992).
            </p>
            <div className="mt-3 max-w-md">
              <Field
                label="Workflow name"
                description="Following the platform convention (L31918). Job Type is required and is taken from this workspace's own entries; the Service Type tag is optional."
              >
                <input
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-2 py-1.5 text-sm"
                />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {newWorkflow.kind === 'enabled' ? (
                <Button onClick={create}>Create in Draft</Button>
              ) : (
                <Control rendering={newWorkflow} />
              )}
            </div>
          </section>

          <TaxonomyPanel
            library={library}
            customType={customType}
            seededEdit={seededEdit}
            onCreateCustomJobType={addCustomJobType}
          />

          <StateMachinePanel />

          <section aria-labelledby="the-matrix" className="mt-10">
            <h2 id="the-matrix" className="text-lg font-semibold">
              This module&rsquo;s permission matrix
            </h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Nine rows at L31904&ndash;L31912 against the eight persona columns the consolidated
              matrix heads. The module&rsquo;s own table heads seven; the Plant Manager column is
              filled from <strong>DEC-ROLE-001</strong> and every cell says so, because a blank cell
              would read as withheld without anybody writing it down.
            </p>
            <Table
              caption="Nine capabilities across eight persona columns"
              columns={[
                { key: 'capability', header: 'Action' },
                ...STUDIO_PERSONA_COLUMNS.map((column) => ({
                  key: column,
                  header: PERSONA_LABEL[column],
                })),
                { key: 'locator', header: 'Source' },
              ]}
              rows={STU_03_MATRIX.map((row) => {
                const cells: TableRow = { capability: row.capability, locator: row.sourceRefs[0] ?? '' }
                for (const column of STUDIO_PERSONA_COLUMNS) cells[column] = row.cells[column].note
                return cells
              })}
              emptyState={{
                title: 'The matrix is empty.',
                whatCreatesIt:
                  'It is transcribed from L31904 to L31912 and is never empty; an empty table here is a defect in the transcription.',
              }}
            />
          </section>

          <section aria-labelledby="the-seam" className="mt-10">
            <h2 id="the-seam" className="text-lg font-semibold">
              Where linkage counts come from
            </h2>
            <div className="mt-3">
              <StudioSeamNotice seam={LINKAGE_SEAM} />
            </div>
          </section>

          <section aria-labelledby="the-object" className="mt-10">
            <h2 id="the-object" className="text-lg font-semibold">
              The object this module owns
            </h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              <strong>{WORKFLOW_OBJECT.numericId}</strong> [{WORKFLOW_OBJECT.numericRef}], also
              carried as <strong>{WORKFLOW_OBJECT.mnemonic}</strong> [{WORKFLOW_OBJECT.mnemonicRef}].{' '}
              {WORKFLOW_OBJECT.note}
            </p>
          </section>

          <section aria-labelledby="open-decisions" className="mt-10 space-y-4">
            <h2 id="open-decisions" className="text-lg font-semibold">
              The open decisions this screen renders
            </h2>
            <DecisionDisclosure id="D20" />
            <DecisionDisclosure id="D6" />
            <DecisionDisclosure id="D11" />
            <DecisionDisclosure id="D28" />
          </section>

          <UnspecifiedPanel />

          <ReviewerControls
            online={online}
            setOnline={setOnline}
            identityLayer={identityLayer}
            setIdentityLayer={setIdentityLayer}
            linkageAvailable={linkageAvailable}
            setLinkageAvailable={setLinkageAvailable}
            implGrant={implGrant}
            setImplGrant={setImplGrant}
            stateId={stateId}
            setStateId={setStateId}
            auditPath={auditPath}
            setAuditPath={setAuditPath}
            onProbeAnotherTenant={probeAnotherTenant}
          />
        </>
      </ScreenStateBoundary>
    </StudioShell>
  )
}

/* ------------------------------------------------------------------ */

/**
 * ONE row, derived once. The linkage cells read `linkageStatement`, so the
 * never-a-zero rule is applied in the same fold the seam notice reads rather
 * than being re-derived per column.
 */
function libraryRow(workflow: WorkflowRecord): TableRow {
  const linkage = linkageStatement(workflow.linkage)
  // NARROWED ON THE DISCRIMINANT, NEVER CAST. A cast here would be the one
  // place a count could be read off a reading that has none — the exact move
  // the union shape exists to make impossible, undone by two characters.
  const reading = workflow.linkage
  const jobs = reading.status === 'unavailable' ? linkage : `${reading.linkedJobs}`
  const runs = reading.status === 'unavailable' ? linkage : `${reading.linkedRuns}`
  return {
    name: workflow.name,
    status: (
      <StatusPill
        tone={STATUS_BADGE[workflow.status].tone}
        icon={STATUS_BADGE[workflow.status].icon}
        label={workflow.status}
      />
    ),
    jobType: workflow.jobType,
    // "where applied" (L31976): an absent tag is stated as absent rather than
    // drawn as an empty cell, and nothing structural hangs on it (AC-STU-051).
    serviceTypeTag: workflow.serviceTypeTag ?? 'None applied',
    version: workflow.currentVersion ?? 'No published version yet',
    jobs,
    runs,
    lastPublished: workflow.lastPublishedAt ?? 'Never published',
  }
}

function TaxonomyPanel({
  library,
  customType,
  seededEdit,
  onCreateCustomJobType,
}: {
  readonly library: LibraryState
  readonly customType: LibraryControlRendering
  readonly seededEdit: LibraryControlRendering
  readonly onCreateCustomJobType: () => void
}) {
  return (
    <section aria-labelledby="the-taxonomy" className="mt-10">
      <h2 id="the-taxonomy" className="text-lg font-semibold">
        The classification taxonomy
      </h2>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        <strong>Job Type is structural</strong>: every Workflow carries exactly one, the Delivery
        Operations Hub filters workflow selection by it, and it is available at every commercial
        tier (L31890). <strong>Service Type is an optional tag</strong>: it refines filtering and
        can pre-populate qualification requirements through the tenant&rsquo;s mapping, but it never
        decides platform behaviour and nothing structural may hang on it (L31890, AC-STU-051).
      </p>

      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
        The platform-seeded catalogue holds{' '}
        <strong>zero Job Types and zero Service Type tags</strong> at version 1, under
        DEC-TAX-002&rsquo;s adopted working position of 2026-08-14. The counts of{' '}
        {SEEDED_TAXONOMY_COUNTS.jobTypes} and {SEEDED_TAXONOMY_COUNTS.serviceTypeTags} remain
        source-confirmed [{SEEDED_TAXONOMY_COUNTS.countsRef}]; only the names and codes are owed by
        the client, and this build does not invent them — no screen, table, or example here names a
        starter Job Type or Service Type tag as though it were canonical (L31894).
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {SEEDED_TAXONOMY_COUNTS.contradictsSection532} {SEEDED_TAXONOMY_COUNTS.reconciliation} [
        {SEEDED_TAXONOMY_COUNTS.reconciliationRef}]
      </p>

      <Table
        caption="The taxonomy entries this workspace can classify against"
        columns={[
          { key: 'name', header: 'Entry' },
          { key: 'kind', header: 'Kind' },
          { key: 'origin', header: 'Origin' },
          { key: 'why', header: 'Why it is here' },
        ]}
        rows={[...library.jobTypes, ...library.serviceTypeTags].map((entry) => ({
          name: entry.name,
          kind: entry.kind,
          origin: entry.origin,
          why: entry.sourceRef,
        }))}
        emptyState={{
          title: 'This workspace has no Job Type or Service Type tag yet.',
          whatCreatesIt:
            'The tenant creates its own, immediately and on every tier, with no platform approval step — because the platform-seeded catalogue ships empty at version 1 (L31892).',
        }}
      />

      <div className="mt-4 flex flex-wrap items-start gap-4">
        {customType.kind === 'enabled' ? (
          <Button onClick={onCreateCustomJobType}>{customType.label}</Button>
        ) : (
          <Control rendering={customType} />
        )}
      </div>

      <div className="mt-4">
        <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          A platform-seeded starter type is inherited <strong>read-only</strong> and cannot be
          edited or deleted by any tenant role (AC-STU-049, L31910) — including the Quality Manager,
          whose cell is the only one that states the reason. That holds whether the seeded catalogue
          is empty or full, so it is a rule over the eight columns rather than a check over the
          entries.
        </p>
        <div className="mt-2">
          <Control rendering={seededEdit} />
        </div>
      </div>
    </section>
  )
}

function StateMachinePanel() {
  return (
    <section aria-labelledby="the-states" className="mt-10">
      <h2 id="the-states" className="text-lg font-semibold">
        The Workflow state machine
      </h2>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {STATE_MACHINE_NOTES.onlyRouteIn} {STATE_MACHINE_NOTES.archivalIsManual} [
        {STATE_MACHINE_NOTES.sourceRef}]
      </p>
      <Table
        caption="The transitions L31959–L31972 draws"
        columns={[
          { key: 'from', header: 'From' },
          { key: 'to', header: 'To' },
          { key: 'label', header: 'What causes it' },
          { key: 'status', header: 'Source status' },
        ]}
        rows={WORKFLOW_TRANSITIONS.map((t) => ({
          from: t.from,
          to: t.to ?? 'End of history',
          label: t.label,
          status: t.unspecifiedInSource ? 'Not specified in the Statement of Work' : 'Drawn and stated',
        }))}
        emptyState={{
          title: 'No transition transcribed.',
          whatCreatesIt: 'The state diagram at L31959 to L31972.',
        }}
      />
      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
        {STATE_MACHINE_NOTES.unArchivalIsOpen} <strong>No control is offered for it here</strong>,
        for anybody. That is a statement about this screen and not about the platform: archival is
        a per-version act, DEC-ARCH-001 is proposed in section 20.2.12, and {VERSIONING.name} is the
        module that owns the version and the decision. None of this module&rsquo;s nine matrix rows
        names archival, so a control here would be one its own permission table could not evaluate.
      </p>
    </section>
  )
}

function UnspecifiedPanel() {
  return (
    <section aria-labelledby="unspecified" className="mt-10">
      <h2 id="unspecified" className="text-lg font-semibold">
        Not specified in the Statement of Work
      </h2>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Three questions this module met that the source does not settle. Each states every reading,
        the position this build took, and what that position costs — a client-delegated choice under
        APP-012, not a position the source settled.
      </p>
      <ul className="mt-3 space-y-4">
        {UNSPECIFIED_IN_SOURCE.map((item) => (
          <li
            key={item.id}
            data-testid={`unspecified-${item.id}`}
            className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
          >
            <p className="text-sm font-medium text-[var(--color-ink)]">
              {item.id} — {item.question}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">[{item.locator}]</span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
              {item.readings.map((reading) => (
                <li key={reading.locator + reading.text.slice(0, 24)}>
                  {reading.text}{' '}
                  <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                    [{reading.locator}]
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">{item.adopted}</p>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-subtle)]">
              What this costs: {item.cost}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface ReviewerControlsProps {
  readonly online: boolean
  readonly setOnline: (value: boolean) => void
  readonly identityLayer: LibraryScenario['identityLayer']
  readonly setIdentityLayer: (value: LibraryScenario['identityLayer']) => void
  readonly linkageAvailable: boolean
  readonly setLinkageAvailable: (value: boolean) => void
  readonly implGrant: StudioGrantState | null
  readonly setImplGrant: (value: StudioGrantState | null) => void
  readonly stateId: ScreenStateId
  readonly setStateId: (value: ScreenStateId) => void
  readonly auditPath: 'commits' | 'write-fails'
  readonly setAuditPath: (value: 'commits' | 'write-fails') => void
  readonly onProbeAnotherTenant: () => void
}

function ReviewerControls(props: ReviewerControlsProps) {
  return (
    <section
      aria-label="Reviewer controls for the Workflow Library"
      className="mt-10 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Reviewer controls — not part of the product
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="Connectivity"
          value={props.online ? 'online' : 'offline'}
          options={[
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Connection lost' },
          ]}
          onChange={(value) => props.setOnline(value === 'online')}
        />
        <Select
          label="Identity layer"
          value={props.identityLayer}
          options={[
            { value: 'reachable', label: 'Reachable' },
            { value: 'unreachable', label: 'Unreachable — fail closed to published read' },
          ]}
          onChange={(value) => props.setIdentityLayer(value as LibraryScenario['identityLayer'])}
        />
        <Select
          label="Delivery Operations Hub linkage"
          value={props.linkageAvailable ? 'live' : 'unavailable'}
          options={[
            { value: 'live', label: 'Answering' },
            { value: 'unavailable', label: 'Unavailable — last retrieved, never zero' },
          ]}
          onChange={(value) => props.setLinkageAvailable(value === 'live')}
        />
        <Select
          label="GRANT-STU-IMPL"
          value={props.implGrant ?? 'not-recorded'}
          options={[
            { value: 'not-recorded', label: 'Not recorded' },
            ...STUDIO_GRANT_STATES.map((s) => ({ value: s, label: s })),
          ]}
          onChange={(value) =>
            props.setImplGrant(
              STUDIO_GRANT_STATES.includes(value as StudioGrantState)
                ? (value as StudioGrantState)
                : null,
            )
          }
        />
        <Select
          label="Screen state"
          value={props.stateId}
          options={APPLICABLE_STATES.map((id) => ({ value: id, label: id }))}
          onChange={(value) => props.setStateId(value as ScreenStateId)}
        />
        <Select
          label="Audit path"
          value={props.auditPath}
          options={[
            { value: 'commits', label: 'The audit append commits' },
            { value: 'write-fails', label: 'The audit append fails — the action fails with it' },
          ]}
          onChange={(value) => props.setAuditPath(value as 'commits' | 'write-fails')}
        />
      </div>
      <div className="mt-4">
        <Button variant="secondary" onClick={props.onProbeAnotherTenant}>
          Request another tenant&rsquo;s Workflow identifier
        </Button>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          TEST-STU-060 (L32028). The query layer returns a <strong>refusal</strong>, not an empty
          result, and the attempt is audited (L32004). Running it is what makes the claim
          checkable rather than stated.
        </p>
      </div>
    </section>
  )
}
