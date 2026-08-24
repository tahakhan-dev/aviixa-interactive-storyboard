'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StudioShell } from '../StudioShell'
import { CapabilityPanel } from './CapabilityPanel'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { STUDIO_GRANT_STATES, type StudioGrantState } from '@/studio/access/grants'
import { STU18_MATRIX, stu18Row } from '@/studio/modules/stu-18/matrix'
import {
  SEEDED_SCENARIO,
  affordanceFor,
  capabilityStatement,
  decisionForRow,
  studioIdentityFor,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import {
  ADMINISTERED_GRANTS,
  SEEDED_GRANT_REGISTER,
  administerGrant,
  grantRowsVisibleTo,
  type GrantAuditWrite,
  type GrantRegister,
} from '@/studio/modules/stu-18/grant-admin'
import {
  CHAPTER20_TENANT_ROLES,
  COARSER_RESTATEMENTS,
  FIVE_ROLE_TABLE,
  PLATFORM_ROLE_ACCESS,
  SECTION_253_DISPUTED,
  UNSPECIFIED_IN_SOURCE,
} from '@/studio/modules/stu-18/restatements'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { routeOpenDecisionFor } from '@/routes/definitions'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { Button, Select, StatusPill, Table, type TableRow } from '@/ui/primitives'
import type { ScreenStateId } from '@/ui/screen-state'

/**
 * `MOD-STU-18` — Permissions and Roles in the Studio, on `SCR-STU-15`
 * (L48273, catalogue B).
 *
 * WHAT THIS SCREEN DECIDES, AND WHERE. Every affordance below is decided PER
 * CONTROL by `decisionForRow`, which is `evaluateStudioAccess` over one
 * matrix row. There is no module-level role list anywhere in this file, and
 * there could not be one: the source heads eight persona columns against five
 * tenant roles, so a role list cannot express the two Supervisor columns, the
 * Plant Manager persona or `GRANT-STU-IMPL`.
 *
 * SCOPE IS ENFORCED IN WHAT THIS SCREEN READS. The grant register is read
 * through `grantRowsVisibleTo`, so a holder in another tenant never enters
 * the render — it is not drawn and then hidden, it is not there.
 *
 * TWO CONTROLS, AND NO INVENTED ONES. L48273 gives this screen "Assign and
 * revoke authoring and Agent Author grants" and `SB-STU-21` (L34631) says the
 * Tenant Admin's view "adds Assign and Revoke controls". Everything else on
 * this screen is a STATEMENT, because the source states it and does not offer
 * it here.
 *
 * DETERMINISM: no clock and no random source. The audit sink is a parameter
 * with a reviewer switch, and it carries no timestamp of its own.
 */

/**
 * The states this screen reaches, DERIVED FROM TASK 2'S MODEL rather than
 * hand-picked here.
 *
 * A hand-written list would be a second answer to a question
 * `src/studio/state/screen-states.ts` already answers, and two derivations of
 * one question is how a screen ends up offering a state the surface excludes.
 * `STATE-07` therefore drops out on its own: it is not applicable anywhere on
 * this surface, and a lost connection renders `STATE-12` with unsaved-work
 * protection (L48330, D22). So do `STATE-09`, `STATE-10` and `STATE-11`,
 * whose departures name other screens.
 */
const APPLICABLE_STATES: readonly ScreenStateId[] = STU_APPLICABLE_STATES.map((r) => r.id).filter(
  (id) => screenRendersState('SCR-STU-15', id),
)

type Stu18StateId = ScreenStateId

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

const GRANT_STATE_OPTIONS = [
  { value: 'not-recorded', label: 'Not recorded' },
  ...STUDIO_GRANT_STATES.map((s) => ({ value: s, label: s })),
]

function asGrantState(value: string): StudioGrantState | null {
  return STUDIO_GRANT_STATES.includes(value as StudioGrantState)
    ? (value as StudioGrantState)
    : null
}

const GRANT_ROW = stu18Row('assign-or-revoke-the-two-grants')

export type PermissionsScreenProps = Partial<Stu18Scenario> & {
  readonly screenState?: Stu18StateId
  /** Whether the audit write in the same transaction succeeds or fails. */
  readonly auditPath?: 'commits' | 'write-fails'
}

export function PermissionsScreen(props: PermissionsScreenProps) {
  const [persona, setPersona] = useState<StudioPersonaColumn>(
    props.persona ?? SEEDED_SCENARIO.persona,
  )
  const [online, setOnline] = useState(props.online ?? SEEDED_SCENARIO.online)
  const [identityLayer, setIdentityLayer] = useState(
    props.identityLayer ?? SEEDED_SCENARIO.identityLayer,
  )
  const [authoringGrant, setAuthoringGrant] = useState<StudioGrantState | null>(
    props.authoringGrant === undefined ? SEEDED_SCENARIO.authoringGrant : props.authoringGrant,
  )
  const [stateId, setStateId] = useState<Stu18StateId>(props.screenState ?? 'STATE-03')
  const [auditPath, setAuditPath] = useState<'commits' | 'write-fails'>(
    props.auditPath ?? 'commits',
  )
  const [register, setRegister] = useState<GrantRegister>(SEEDED_GRANT_REGISTER)
  const [targetId, setTargetId] = useState('IDN-BB-SAM')
  const [message, setMessage] = useState('No grant has been assigned or revoked in this session.')

  const scenario: Stu18Scenario = {
    persona,
    online,
    identityLayer,
    commercialTier: props.commercialTier ?? SEEDED_SCENARIO.commercialTier,
    authoringGrant,
    agentGrant: props.agentGrant === undefined ? SEEDED_SCENARIO.agentGrant : props.agentGrant,
    implGrant: props.implGrant === undefined ? SEEDED_SCENARIO.implGrant : props.implGrant,
  }

  const identity = studioIdentityFor(persona)
  const actor = register.find((h) => h.identityId === identity.identityId) ?? {
    identityId: identity.identityId,
    displayName: PERSONA_LABEL[persona],
    tenant: identity.tenant!,
    roles: identity.roles,
    grants: {},
    note: 'Not a grant-holder in the seeded register; this identity administers rather than holds.',
  }

  // THE ONE ACCESS CALL FOR THESE TWO CONTROLS, per control, over row 18.
  const grantDecision = decisionForRow(GRANT_ROW, scenario)

  /**
   * A business action and its required audit append are ONE transaction, so
   * an audit failure REFUSES the action rather than producing an unaudited
   * success. The sink is handed to `administerGrant`, which asks it AFTER its
   * own domain refusals and BEFORE its mutation.
   */
  const writeAudit: GrantAuditWrite = () =>
    auditPath === 'commits'
      ? { ok: true }
      : { ok: false, reason: 'the tenant audit log refused the append' }

  function act(grant: (typeof ADMINISTERED_GRANTS)[number], action: 'assign' | 'revoke') {
    const result = administerGrant({
      register,
      actor,
      decision: grantDecision,
      targetId,
      grant,
      action,
      writeAudit,
    })
    setRegister(result.register)
    setMessage(result.message)
  }

  const visible = grantRowsVisibleTo(register, actor)

  const registerRows: TableRow[] = visible.map((holder) => ({
    holder: holder.displayName,
    identity: holder.identityId,
    roles: holder.roles.join(', '),
    author: holder.grants['GRANT-STU-AUTHOR'] ?? '—',
    agent: holder.grants['GRANT-STU-AGENT'] ?? '—',
    why: holder.note,
  }))

  const matrixRows: TableRow[] = STU18_MATRIX.map((row) => {
    const cells: TableRow = { capability: row.capability, locator: row.sourceRefs[0] ?? '' }
    for (const column of STUDIO_PERSONA_COLUMNS) {
      cells[column] = capabilityStatement(row, column).text
    }
    return cells
  })

  const auditorOpen = routeOpenDecisionFor('SURF-STU', 'READONLY_AUDITOR')

  return (
    <StudioShell
      module={stuModuleById(STU_MODULES, 'MOD-STU-18')}
      screenId="SCR-STU-15"
      persona={persona as StudioPersonaId}
      onPersonaChange={(next) => setPersona(next as StudioPersonaColumn)}
    >
      <>
      {/* THE MODULE'S OTHER SCREEN, AND THE ONLY PAGE THAT NAMES IT.
         *
         * `MOD-STU-18` has ONE slug and TWO catalogue-B screens: this one,
         * `SCR-STU-15` (L48273), and `SCR-STU-01` Sign-in (L48259). The
         * Studio index links the module by its slug, which reaches this
         * screen; nothing in the whole build linked the other. Audit finding
         * R3-06 walked the built export's own hrefs from `/` and measured
         * `/studio/sign-in/` reachable only by typing the URL, while
         * `/frontline/sign-in/` — the same shape on another surface — is
         * offered by its own surface chrome.
         *
         * IT IS HERE AND NOT ON THE STUDIO INDEX. Two reasons, and the second
         * is the load-bearing one. It is a screen OF THIS MODULE, so the
         * module's own screen is where a reader looking for it would look.
         * And `tests/component/stu-shell.test.tsx` asserts by EQUALITY that
         * the index offers exactly the module routes the persona reaches and
         * no others — a `/studio/*` link there is a surplus element by
         * construction, and it should be: an index of module routes that
         * quietly grew a screen route is the drift that assertion exists to
         * catch. Measured, not assumed: the link was placed there first and
         * that case went red on the surplus.
         *
         * OUTSIDE THE SCREEN-STATE BOUNDARY DELIBERATELY. Inside it, the one
         * inbound edge into `/studio/sign-in/` would exist only in the states
         * whose treatment renders children — a route reachable in some
         * screen states and not others is a route a reviewer can lose by
         * moving a selector. The persona gate still applies: this whole page
         * renders inside `StudioShell`, which renders no module content at
         * all for a Worker (AC-STU-150) and none while DEC-AUDSTU-001 is
         * open. */}
      <p className="mt-6 max-w-prose text-sm text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--color-ink)]">
          This module&rsquo;s other screen:{' '}
        </span>
        <Link href="/studio/sign-in/" className="text-[var(--color-primary)] underline">
          Sign-in
        </Link>{' '}
        — SCR-STU-01, the same module on its own route. One module, one slug,
        two catalogue-B screens; the slug keys this screen, so the sign-in
        screen is registered on the screen rather than on the module (D1).
      </p>
      <ScreenStateBoundary
        state={stateId}
        surface="SURF-STU"
        detail={{
          objectLabel: 'Studio grants',
          whatCreatesIt:
            'A Tenant Admin assigns one from this screen. Nothing else on the platform creates a Studio grant, and no role may assign one to itself (L34584).',
          fieldLabel: 'Grant holder',
          rule: 'A grant is assigned to an identity the identity layer reports, never to a name typed here.',
          permittedFormat: 'Choose a holder from the register above.',
          asOfLabel: 'as at the seeded scenario',
          originLabel: 'the tenant identity layer',
          decision: grantDecision.decision,
          readOnlyCause: `Read-only for the ${PERSONA_LABEL[persona]} view: the grant-administration row of the consolidated matrix (L34558) puts grant administration with the Tenant Admin alone, so this register is readable here and not writable.`,
          failureWhat: 'The read of the grant register failed.',
          wasWritten: false,
          nextStep:
            'No write was attempted and none was queued — the Studio queues nothing, in any state. Authorisation state is re-read on reconnection, and a revoked grant takes effect on the next action rather than at the next sign-in (L34639).',
          recoveryProgress:
            'Authorisation state is being re-read before any write control is re-enabled. Nothing attempted while the layer was down is retroactively permitted (L34663).',
        }}
      >
        <>
          <CapabilityPanel scenario={scenario} />

          <section aria-labelledby="grant-administration" className="mt-10">
            <h2 id="grant-administration" className="text-lg font-semibold">
              Grant administration
            </h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              L34558, the grant-administration row of the consolidated matrix:{' '}
              <em>
                Assign or revoke GRANT-STU-AUTHOR and GRANT-STU-AGENT — Allowed, administers Studio
                capacities from the tenant administration area
              </em>
              . The Tenant Admin <strong>holds no stage of the approval chain</strong>, for
              separation of duties (AC-STU-152, L34669) — administering the keys is not the same
              thing as being able to use them.
            </p>
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
              This register shows the acting identity&rsquo;s own tenant only. Tenant isolation
              applies to every authorisation decision (L34659), and it is applied to the READ:
              a holder outside this tenant is not on this page to be uncovered.
            </p>

            <Table
              caption="Grant holders in this tenant"
              columns={[
                { key: 'holder', header: 'Holder' },
                { key: 'identity', header: 'Identity' },
                { key: 'roles', header: 'Roles' },
                { key: 'author', header: 'GRANT-STU-AUTHOR' },
                { key: 'agent', header: 'GRANT-STU-AGENT' },
                { key: 'why', header: 'Why this row is here' },
              ]}
              rows={registerRows}
              emptyState={{
                title: 'No grant holder in this tenant.',
                whatCreatesIt:
                  'The identity layer reports holders; the Tenant Admin assigns a grant to one of them.',
              }}
            />

            <div className="mt-4 max-w-md">
              <Select
                label="Grant holder to act on"
                value={targetId}
                options={visible.map((h) => ({ value: h.identityId, label: h.displayName }))}
                onChange={setTargetId}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {ADMINISTERED_GRANTS.flatMap((grant) =>
                (['assign', 'revoke'] as const).map((action) => {
                  const label = `${action === 'assign' ? 'Assign' : 'Revoke'} ${
                    grant === 'GRANT-STU-AUTHOR' ? 'the authoring grant' : 'the Agent Author capability'
                  }`
                  const affordance = affordanceFor(label, grantDecision)
                  const key = `${grant}-${action}`
                  switch (affordance.kind) {
                    case 'enabled':
                      return (
                        <Button key={key} onClick={() => act(grant, action)}>
                          {affordance.label}
                        </Button>
                      )
                    case 'disabled':
                      return (
                        <Button key={key} disabledReason={affordance.reason}>
                          {affordance.label}
                        </Button>
                      )
                    case 'decision-open':
                      return (
                        <p key={key} role="note" className="text-sm text-[var(--color-ink-muted)]">
                          {affordance.label} is not offered while {affordance.openDecision} is open.{' '}
                          {affordance.note}
                        </p>
                      )
                    case 'absent':
                      return (
                        <ProhibitionNotice
                          key={key}
                          rendering={{ kind: 'absent', note: affordance.note }}
                        />
                      )
                  }
                }),
              )}
            </div>

            <p role="status" className="mt-4 max-w-prose text-sm text-[var(--color-ink)]">
              {message}
            </p>
          </section>

          <section aria-labelledby="the-matrix" className="mt-10">
            <h2 id="the-matrix" className="text-lg font-semibold">
              The consolidated Studio permission matrix
            </h2>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              L34539 heads eight columns and L34541&ndash;L34563 carry twenty-three rows. Every cell
              carries an explicit status (L34537), and the cell&rsquo;s own words render rather than
              a token: the export row&rsquo;s <em>Read-only — may generate the read-only export</em> grants
              an export that a mechanical reading of the token would take away.
            </p>
            <Table
              caption="Twenty-three capabilities across eight persona columns"
              columns={[
                { key: 'capability', header: 'Capability' },
                ...STUDIO_PERSONA_COLUMNS.map((column) => ({
                  key: column,
                  header: PERSONA_LABEL[column],
                })),
                { key: 'locator', header: 'Source' },
              ]}
              rows={matrixRows}
              emptyState={{
                title: 'The consolidated matrix is empty.',
                whatCreatesIt:
                  'It is transcribed from L34541 to L34563 and is never empty; an empty table here is a defect in the transcription.',
              }}
            />
          </section>

          <RoleTables />
          <DisputedTables />

          <section aria-labelledby="open-decisions" className="mt-10 space-y-4">
            <h2 id="open-decisions" className="text-lg font-semibold">
              The open decisions this screen renders
            </h2>
            {auditorOpen === null ? null : (
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                The route registry records the Read-only Auditor&rsquo;s Studio access as{' '}
                <strong>{auditorOpen.decision}</strong> rather than as a refusal. {auditorOpen.why}
              </p>
            )}
            <DecisionDisclosure id="DEC-AUDSTU-001" />
            <DecisionDisclosure id="D2" />
            <DecisionDisclosure id="D9" />
            <DecisionDisclosure id="DEC-DELEG-001" />
            <DecisionDisclosure id="DEC-TENGRANT-001" />
            <DecisionDisclosure id="DEC-ROLE-001" />
          </section>

          <UnspecifiedPanel />

          <ReviewerControls
            online={online}
            setOnline={setOnline}
            identityLayer={identityLayer}
            setIdentityLayer={setIdentityLayer}
            authoringGrant={authoringGrant}
            setAuthoringGrant={setAuthoringGrant}
            stateId={stateId}
            setStateId={setStateId}
            auditPath={auditPath}
            setAuditPath={setAuditPath}
          />
        </>
      </ScreenStateBoundary>
      </>
    </StudioShell>
  )
}

/* ------------------------------------------------------------------ */

function RoleTables() {
  return (
    <section aria-labelledby="role-tables" className="mt-10">
      <h2 id="role-tables" className="text-lg font-semibold">
        The role tables the source states, all of them
      </h2>

      <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        §5.18&rsquo;s own table — five rows, L34514&ndash;L34518
      </h3>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Headed <strong>Fixed role</strong>. It <strong>includes Plant Manager</strong>, which §3.5
        states is not a role, and it <strong>omits the Read-only Auditor entirely</strong> — which
        is the whole of why DEC-AUDSTU-001 exists.
      </p>
      <Table
        caption="§5.18, the source's own five-row table"
        columns={[
          { key: 'role', header: 'Fixed role, as the source heads the column' },
          { key: 'access', header: 'Access in the Studio' },
          { key: 'locator', header: 'Source' },
        ]}
        rows={FIVE_ROLE_TABLE.map((r) => ({ ...r }))}
        emptyState={{ title: 'No row transcribed.', whatCreatesIt: 'L34514 to L34518.' }}
      />

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Chapter 20&rsquo;s expansion — eight rows, L30821&ndash;L30828
      </h3>
      <Table
        caption="Chapter 20's eight-row tenant-role expansion"
        columns={[
          { key: 'role', header: 'Tenant role' },
          { key: 'identifier', header: 'Identifier' },
          { key: 'access', header: 'Studio access as stated' },
          { key: 'classification', header: 'Classification' },
          { key: 'locator', header: 'Source' },
        ]}
        rows={CHAPTER20_TENANT_ROLES.map((r) => ({ ...r }))}
        emptyState={{ title: 'No row transcribed.', whatCreatesIt: 'L30821 to L30828.' }}
      />

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Platform roles — four rows, L30809&ndash;L30812, both columns
      </h3>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {PLATFORM_ROLE_ACCESS.surfaceMatrixReading} [{PLATFORM_ROLE_ACCESS.surfaceMatrixLocator}]{' '}
        {PLATFORM_ROLE_ACCESS.chapterReading} {PLATFORM_ROLE_ACCESS.reconciliation}
      </p>
      <Table
        caption="Platform roles: standing access and access through a named class"
        columns={[
          { key: 'role', header: 'Platform role' },
          { key: 'standing', header: 'Standing Studio access' },
          { key: 'throughNamedClass', header: 'Access through a named class' },
          { key: 'note', header: 'Note' },
          { key: 'locator', header: 'Source' },
        ]}
        rows={PLATFORM_ROLE_ACCESS.rows.map((r) => ({ ...r }))}
        emptyState={{ title: 'No row transcribed.', whatCreatesIt: 'L30809 to L30812.' }}
      />
    </section>
  )
}

function DisputedTables() {
  return (
    <section aria-labelledby="disputed" className="mt-10">
      <h2 id="disputed" className="text-lg font-semibold">
        The restatements that disagree — recorded, not inherited
      </h2>

      <div
        role="note"
        className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
      >
        <p className="text-sm font-medium text-[var(--color-ink)]">
          {SECTION_253_DISPUTED.title} —{' '}
          <StatusPill tone="attention" icon="●" label="attributed but disputed" />{' '}
          <span className="text-xs text-[var(--color-ink-subtle)]">
            [{SECTION_253_DISPUTED.locator}]
          </span>
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {SECTION_253_DISPUTED.whyDisputed} It renders here as the{' '}
          <strong>alternative reading</strong> under DEC-AUDSTU-001, and not one of its statuses
          reaches a control on this surface.
        </p>
        <Table
          caption="§25.3's eight-row restatement, reproduced as an alternative reading"
          columns={[
            { key: 'action', header: 'Action' },
            { key: 'tenantAdmin', header: 'Tenant Admin' },
            { key: 'supervisor', header: 'Supervisor' },
            { key: 'qualityManager', header: 'Quality Manager' },
            { key: 'readOnlyAuditor', header: 'Read-only Auditor' },
            { key: 'worker', header: 'Worker' },
          ]}
          rows={SECTION_253_DISPUTED.rows.map((r) => ({ ...r }))}
          emptyState={{ title: 'No row transcribed.', whatCreatesIt: 'L48321 to L48328.' }}
        />
        <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {SECTION_253_DISPUTED.disagreements.map((d) => (
            <li key={d.governedBy}>
              {d.what}{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [governed by {d.governedBy}]
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-4 space-y-3">
        {COARSER_RESTATEMENTS.map((r) => (
          <li key={r.id} className="border-l-2 border-[var(--color-border-strong)] pl-3">
            <p className="text-sm font-medium text-[var(--color-ink)]">
              {r.id} — {r.title}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">[{r.locator}]</span>
            </p>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">{r.statement}</p>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-subtle)]">
              {r.disagreement} {r.governedBy}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function UnspecifiedPanel() {
  return (
    <section aria-labelledby="unspecified" className="mt-10">
      <h2 id="unspecified" className="text-lg font-semibold">
        Not specified in the Statement of Work
      </h2>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Three questions this module met that the source does not settle and that carry no{' '}
        <code>DEC-*</code> record in this build&rsquo;s decision register. Each states every reading,
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
                <li key={reading.locator}>
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
  readonly setOnline: (v: boolean) => void
  readonly identityLayer: Stu18Scenario['identityLayer']
  readonly setIdentityLayer: (v: Stu18Scenario['identityLayer']) => void
  readonly authoringGrant: StudioGrantState | null
  readonly setAuthoringGrant: (v: StudioGrantState | null) => void
  readonly stateId: Stu18StateId
  readonly setStateId: (v: Stu18StateId) => void
  readonly auditPath: 'commits' | 'write-fails'
  readonly setAuditPath: (v: 'commits' | 'write-fails') => void
}

function ReviewerControls(p: ReviewerControlsProps) {
  return (
    <section
      aria-label="Storyboard scenario switchers"
      className="mt-10 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Reviewer controls — not part of the product
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Select
          label="Connection"
          value={p.online ? 'online' : 'offline'}
          options={[
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Offline — the Studio requires an active connection' },
          ]}
          onChange={(v) => p.setOnline(v === 'online')}
        />
        <Select
          label="Identity layer"
          value={p.identityLayer}
          options={[
            { value: 'reachable', label: 'Reachable' },
            { value: 'unreachable', label: 'Unreachable — fail closed to published read' },
          ]}
          onChange={(v) => p.setIdentityLayer(v === 'unreachable' ? 'unreachable' : 'reachable')}
        />
        <Select
          label="GRANT-STU-AUTHOR state"
          value={p.authoringGrant ?? 'not-recorded'}
          options={GRANT_STATE_OPTIONS}
          onChange={(v) => p.setAuthoringGrant(asGrantState(v))}
        />
        <Select
          label="Screen state"
          value={p.stateId}
          options={APPLICABLE_STATES.map((id) => ({ value: id, label: id }))}
          onChange={(v) => p.setStateId(v as Stu18StateId)}
        />
        <Select
          label="Audit write"
          value={p.auditPath}
          options={[
            { value: 'commits', label: 'Commits' },
            { value: 'write-fails', label: 'Fails — the action fails with it' },
          ]}
          onChange={(v) => p.setAuditPath(v === 'write-fails' ? 'write-fails' : 'commits')}
        />
      </div>
      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
        STATE-07 is not offered, and that is a ruling rather than an omission: offline is not
        applicable anywhere on this surface, because authoring requires a connection. A lost
        connection renders STATE-12 with unsaved-work protection (L48330).
      </p>
    </section>
  )
}
