'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { evaluateAccess } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import {
  Banner,
  Button,
  Field,
  FreshnessLabel,
  PermissionNotice,
  Select,
  SkeletonBlock,
  StatusPill,
  Table,
} from '@/ui/primitives'
import { SaConsoleShell } from '../SaConsoleShell'
import {
  GOVERNED_SETTINGS,
  GOVERNED_SETTING_COUNT_NOTE,
  NON_CONFORMING_ENTRIES,
  PLATFORM_FIXED_ITEMS,
  REGISTRY_ABSENT_CONTROLS,
  REGISTRY_AS_OF,
  REGISTRY_ENTRY_STATES,
  REGISTRY_ORIGIN,
  REGISTRY_PLATFORM_ROLES,
  REGISTRY_RECOVERY_NOTE,
  REGISTRY_SOURCE_CONFLICTS,
  REGISTRY_STALE_AS_OF,
  REGISTRY_TENANT_LABEL,
  REGISTRY_UNSPECIFIED_IN_SOURCE,
  REGISTRY_WORKFLOWS,
  WRITABLE_SETTINGS,
  WRITE_CLASSES,
  validateWrite,
  type WriteClassDefinition,
  type WriteOutcome,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-19')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-19-TENANT-CONFIG-REGISTRY'))

/** Whether the screen accepts a write at all, as a separate axis from who is looking. */
type WriteMode = 'writable' | 'read-only'

/**
 * STATE-12 deliberately stays `writable`. FB-SA-10 (L46316) makes the
 * unreadable bound a REJECTION at validation, not a removed control: "retry,
 * then reject the write with the bound stated" — refusing is the behaviour,
 * not the failure. Disabling the control in that state would hide the very
 * outcome the state exists to show.
 */
function writeMode(state: ScreenStateId): WriteMode {
  return state === 'STATE-06' ? 'read-only' : 'writable'
}

/** AC-SA-01-03: as-of always; stale-with-age or unavailable; never zero, never blank. */
type AggregateMode = 'current' | 'stale' | 'unavailable' | 'loading' | 'empty' | 'recovering'

function aggregateMode(state: ScreenStateId): AggregateMode {
  if (state === 'STATE-01') return 'empty'
  if (state === 'STATE-02') return 'loading'
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12') return 'unavailable'
  // STATE-13 neverDo: never show a recovering system as fully recovered. The
  // conformance figures are re-derived setting by setting, so no count and no
  // current as-of is presented until the re-read finishes.
  if (state === 'STATE-13') return 'recovering'
  return 'current'
}

const SUPPORT_READ_ONLY =
  'Support is read-only on this console: it writes nothing outside a named, time-boxed session, and a data repair is not support (L16022).'

/** The named reason a drawn-but-inert control carries. Never a bare "denied". */
function namedReason(
  decision: PermissionDecision,
  role: RoleId,
  writeClass: WriteClassDefinition,
  mode: WriteMode,
): string {
  if (decision.outcome === 'allowed') return ''
  if (decision.reasonCode === 'OBJECT_STATE_INVALID' || mode === 'read-only') {
    return 'This screen is read-only in this state, so no write can be submitted from it. Every panel still reads.'
  }
  if (decision.reasonCode === 'ROLE_NOT_GRANTED') {
    if (role === 'SUPPORT') return SUPPORT_READ_ONLY
    if (writeClass.id === 'current-value') {
      return 'A current-value change platform-side is an Admin action (AC-SA-19-07, L46318). The Platform Engineer is a maker only: a mutating change submits into the approval cycle and never applies directly (L11684).'
    }
    if (writeClass.id === 'default') {
      return 'A default change is engineering class: the Platform Engineer is the maker and the Admin is the checker (AC-SA-19-07, D14, L46668). One person is never both on the same change.'
    }
  }
  return decision.explanation
}

function Section({
  id,
  heading,
  children,
}: {
  readonly id: string
  readonly heading: string
  readonly children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-lg font-semibold">
        {heading}
      </h2>
      {children}
    </section>
  )
}

function boundCell(setting: (typeof GOVERNED_SETTINGS)[number]): string {
  return setting.bound.kind === 'not-stated-in-source'
    ? `Not stated in the source — ${setting.bound.statement}`
    : setting.bound.statement
}

export interface TenantConfigRegistryScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
}

export function TenantConfigRegistryScreen({
  role: initialRole = 'ADMIN',
  screenState: initialScreenState = 'STATE-03',
}: TenantConfigRegistryScreenProps = {}) {
  const [role, setRole] = useState<RoleId>(initialRole)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)
  const [settingId, setSettingId] = useState<string>(WRITABLE_SETTINGS[0]?.id ?? '')
  const [writeClassId, setWriteClassId] = useState<string>('current-value')
  const [rawValue, setRawValue] = useState('')
  const [outcome, setOutcome] = useState<WriteOutcome | null>(null)
  const [routed, setRouted] = useState<WriteClassDefinition | null>(null)

  const mode = aggregateMode(screenState)
  const writability = writeMode(screenState)
  const stateDefinition = SCREEN_STATES.find((s) => s.id === screenState) ?? SCREEN_STATES[0]
  const writeClass = WRITE_CLASSES.find((c) => c.id === writeClassId) ?? WRITE_CLASSES[0]
  const setting = WRITABLE_SETTINGS.find((s) => s.id === settingId) ?? WRITABLE_SETTINGS[0]

  const context = {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role,
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
    actorOfRecord: 'FIXTURE-CONSOLE-OPERATOR',
  }

  // Per-control allowed roles (D16), never the module-level roles_allowed —
  // which this module's own extraction states five different ways.
  const writeDecision = evaluateAccess(
    {
      action: `MOD-SA-19:write-${writeClass.id}`,
      allowedRoles: writeClass.allowedRoles,
      allowedObjectStates: ['writable'],
      objectState: writability,
      sourceRefs: ['L46318', 'L11684', 'L42715'],
    },
    context,
  )
  // All four console roles read every panel here, including the conformance
  // panel, whose extracted control row names all four (L46246).
  const readDecision = evaluateAccess(
    {
      action: 'MOD-SA-19:read-registry',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L46246', 'L42742'],
    },
    context,
  )

  const classBadgeReplacesBar = writeClass.critical && role !== 'ROOT_SUPER_ADMIN'
  const reason = namedReason(writeDecision, role, writeClass, writability)
  const buttonProps = writeDecision.outcome === 'allowed' ? {} : { disabledReason: reason }

  function submit(): void {
    if (writeClass.critical) {
      setOutcome(null)
      setRouted(writeClass)
      return
    }
    if (setting === undefined) return
    setRouted(null)
    setOutcome(validateWrite(setting, rawValue, screenState !== 'STATE-12'))
  }

  function resetOutcome(): void {
    setOutcome(null)
    setRouted(null)
  }

  const asOfLabel = mode === 'stale' ? REGISTRY_STALE_AS_OF : REGISTRY_AS_OF

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screens annotated SCR-SA-26 (L42818, L46246), storyboard SB-SA-19 (L46246), and the
        unnumbered tenant-detail view that reads this registry as configuration truth (L2173). Names
        are canonical; the numbers are annotations only, and this route is keyed on the module slug.
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="Console role (fixture)"
          value={role}
          onChange={(v) => {
            setRole(v as RoleId)
            resetOutcome()
          }}
          options={REGISTRY_PLATFORM_ROLES.map((r) => ({
            value: r.id,
            label: `${r.name} — ${r.roleAnnotation}`,
          }))}
        />
        <Select
          label="Screen state (fixture)"
          value={screenState}
          onChange={(v) => {
            setScreenState(v as ScreenStateId)
            resetOutcome()
          }}
          options={SA_APPLICABLE_STATES.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))}
        />
        <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The role control is a view switcher, not a login. Nothing here authenticates anybody, no
          value below is fetched, and no write leaves the browser.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <p className="font-medium">
          {stateDefinition.id} — {stateDefinition.name}
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.contract}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.neverDo}</p>
      </div>

      {writability === 'read-only' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="One cause: this fixture puts the registry into a read-only state, so no write of any class can be submitted from it. Every panel below still reads, and the current values remain in force unchanged."
          />
        </div>
      ) : null}

      {screenState === 'STATE-12' ? (
        <div className="mt-4">
          <Banner
            tone="blocked"
            heading="Bound validation is unavailable"
            body="What failed: the platform floor register cannot be read, so no bound can be confirmed. Nothing was written. Every setting keeps its last validated value, which is by definition at or stricter than its floor. The next step is to submit the write again once the register can be read — a write attempted now is refused with the bound stated rather than accepted unvalidated (FB-SA-10, L46316)."
          />
        </div>
      ) : null}

      {screenState === 'STATE-13' ? (
        <div className="mt-4">
          <Banner
            tone="info"
            heading="Recovering"
            body={`The floor register is readable again and a per-tenant conformance report is being re-derived across the governed settings. ${REGISTRY_RECOVERY_NOTE}`}
          />
        </div>
      ) : null}

      {screenState === 'STATE-10' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Artificial intelligence is degraded"
            body="No part of a registry write depends on a model, so nothing on this screen changes: the bound comparison, the rejection and the approval routing are all deterministic. This banner exists so a degraded model is never mistaken for a degraded registry."
          />
        </div>
      ) : null}

      <p className="mt-4 max-w-prose text-sm text-[var(--color-ink-muted)]">
        No artificial-intelligence model participates in a registry write. The bound comparison is a
        deterministic check against the platform floor register, so this module remains fully
        operable with every model unavailable (AC-SA-000-09, L42887).
      </p>

      <Section id="sa19-invariants" heading="Enforced invariants on this module">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Both render locked, with no off position for any account including the root. They are
          status readouts. There is no switch here, no approval path around one, and no configuration
          key for either (AC-SA-INV-003, L47849).
        </p>
        <div className="mt-3 space-y-3">
          {SA_INVARIANTS.filter(
            (i) => i.id === 'evaluation-gate' || i.id === 'one-transaction-audit-guarantee',
          ).map((i) => (
            <InvariantChip key={i.id} invariant={i} />
          ))}
        </div>
      </Section>

      <Section id="sa19-summary" heading="Registry conformance summary">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One registry object per tenant. This one is {REGISTRY_TENANT_LABEL}, and the tenant name is
          a label on a commercial and configuration record, not a way in.
        </p>
        {mode === 'loading' ? (
          <SkeletonBlock lines={3} label="Loading the registry conformance summary" />
        ) : mode === 'unavailable' ? (
          <p className="mt-2 max-w-prose text-sm">
            Unavailable — the registry conformance summary could not be read in this state. An
            aggregate that could not be read is never rendered as a count, and never left blank.
          </p>
        ) : mode === 'recovering' ? (
          <p className="mt-2 max-w-prose text-sm">
            Recovering — no conformance count is presented yet. {REGISTRY_RECOVERY_NOTE} A count
            rendered now would report a recovering registry as fully recovered, and the as-of stamp
            attached to it would claim a currency it does not have.
          </p>
        ) : mode === 'empty' ? (
          <p className="mt-2 max-w-prose text-sm">
            No registry object exists for this tenant yet. One is created when the tenant is
            provisioned, carrying every governed setting at its platform default. Nothing on this
            screen creates one.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-1 text-sm">
              {REGISTRY_ENTRY_STATES.map((entryState) => (
                <li key={entryState}>
                  {entryState}: {GOVERNED_SETTINGS.filter((s) => s.entryState === entryState).length}{' '}
                  of {GOVERNED_SETTINGS.length} entries rendered
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <FreshnessLabel asOfLabel={asOfLabel} originLabel={REGISTRY_ORIGIN} />
            </div>
          </>
        )}
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          {GOVERNED_SETTING_COUNT_NOTE}
        </p>
      </Section>

      <Section id="sa19-entries" heading="The three values, per setting">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every governed setting holds three values — the platform default, the bound it is validated
          against, and the tenant&rsquo;s current value (L46205, L116399). A tenant may make the
          platform stricter and may never make it looser; the floor is fixed for everyone, always
          (L1546).
        </p>
        <div className="mt-3">
          <Table
            caption="Registry entries — platform default, bound and current tenant value"
            columns={[
              { key: 'setting', header: 'Setting' },
              { key: 'default', header: 'Platform default' },
              { key: 'bound', header: 'Bound' },
              { key: 'current', header: 'Current tenant value' },
              { key: 'entryState', header: 'Entry state' },
              { key: 'direction', header: 'Direction of strictness' },
              { key: 'source', header: 'Source' },
            ]}
            loading={mode === 'loading'}
            rows={
              mode === 'empty'
                ? []
                : GOVERNED_SETTINGS.map((s) => ({
                    setting: s.name,
                    default: s.platformDefault,
                    bound: boundCell(s),
                    current: s.currentValue,
                    entryState: (
                      <StatusPill
                        tone={s.entryState === 'non-conforming after a bound tightening' ? 'attention' : 'neutral'}
                        icon="•"
                        label={s.entryState}
                      />
                    ),
                    direction: s.stricterDirection,
                    source: s.sourceRef,
                  }))
            }
            emptyState={{
              title: 'This tenant has no registry entries yet',
              whatCreatesIt:
                'Provisioning a tenant creates one entry per governed setting, each at its platform default. No control on this console creates an entry.',
            }}
          />
        </div>
        {mode === 'recovering' ? (
          <p className="mt-2 max-w-prose text-sm">
            The three values above are the stored registry entries and read normally. The entry
            state beside each one is a conformance derivation: while the re-read is in progress it
            is the state derived before the failure, not a current one. {REGISTRY_RECOVERY_NOTE}
          </p>
        ) : null}
      </Section>

      <Section id="sa19-classes" heading="Three write classes, three approval routes">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The columns above do not share an approval route. A current-value change platform-side is
          an Admin action, a default change is engineering class, and a bound change is critical
          class (AC-SA-19-07, L46318) — three routes on one table.
        </p>
        <div className="mt-3">
          <Table
            caption="The three write classes and their approval routes"
            columns={[
              { key: 'target', header: 'What is written' },
              { key: 'class', header: 'Change class' },
              { key: 'route', header: 'Route' },
              { key: 'source', header: 'Source' },
            ]}
            rows={WRITE_CLASSES.map((c) => ({
              target: c.name,
              class: c.changeClass,
              route: c.approvalRoute,
              source: c.sourceRef,
            }))}
            emptyState={{
              title: 'No write class is defined',
              whatCreatesIt: 'AC-SA-19-07 names the three.',
            }}
          />
        </div>
      </Section>

      <Section id="sa19-write" heading="Attempt a write">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every write path, tenant-side and platform-side, lands here, and no bypass exists
          (AC-SA-19-02, L46318). The rejection below is not an error state — it is one of the two
          terminal states of the write workflow, and the more common one.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-6">
          <Select
            label="Setting"
            value={settingId}
            onChange={(v) => {
              setSettingId(v)
              resetOutcome()
            }}
            options={WRITABLE_SETTINGS.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select
            label="Write class"
            value={writeClassId}
            onChange={(v) => {
              setWriteClassId(v)
              resetOutcome()
            }}
            options={WRITE_CLASSES.map((c) => ({ value: c.id, label: `${c.name} — ${c.changeClass}` }))}
          />
          {writeClass.critical ? (
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              A bound change is a change to the floor-register row itself. The source defines no
              value entry for it on this screen — it opens a critical-class request — so no value
              field is drawn here.
            </p>
          ) : (
            <Field
              label="Proposed value"
              description={`${setting?.name ?? 'This setting'} is bounded at ${setting?.bound.statement ?? 'a bound the source does not state'}. ${setting?.stricterDirection ?? ''}`}
            >
              <input
                type="text"
                inputMode="decimal"
                value={rawValue}
                onChange={(e) => {
                  setRawValue(e.target.value)
                  resetOutcome()
                }}
                className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
              />
            </Field>
          )}
        </div>

        <div role="group" aria-label="Write action bar" className="mt-4">
          {classBadgeReplacesBar ? (
            <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
          ) : (
            <Button {...buttonProps} onClick={submit}>
              Submit the write
            </Button>
          )}
        </div>
        {classBadgeReplacesBar ? (
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            For every role but the root, the action bar on a critical-class write is the class badge
            and nothing else, so no control here can be mistaken for an approval path (L23707). A
            blocked attempt is itself an audit event (AC-SA-000-04, L42882).
          </p>
        ) : (
          <div className="mt-2">
            <PermissionNotice decision={writeDecision} />
          </div>
        )}

        {outcome?.kind === 'rejected' ? (
          <p role="alert" className="mt-3 max-w-prose text-sm text-[var(--color-status-blocked)]">
            {outcome.statement}
          </p>
        ) : null}

        {outcome?.kind === 'accepted' && writeClass.id === 'current-value' ? (
          <div role="status" aria-label="Write outcome" className="mt-3 max-w-prose text-sm">
            <StatusPill tone="ok" icon="•" label={`${writeClass.changeClass} write accepted`} />
            <p className="mt-2">Accepted, and applied on acceptance. {outcome.statement}</p>
            <p className="mt-2">
              It commits with its audit event in the same transaction: no code path exists where the
              change commits and its audit event does not, and an audit write that cannot commit
              refuses the action outright (AC-SA-18-01, FB-SA-03, L46191).
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              In this storyboard nothing was stored. No registry object was changed, no audit event
              was written, and the entry above still shows its seeded current value.
            </p>
          </div>
        ) : null}

        {outcome?.kind === 'accepted' && writeClass.id !== 'current-value' ? (
          <div role="status" aria-label="Write outcome" className="mt-3 max-w-prose text-sm">
            <StatusPill
              tone="attention"
              icon="•"
              label={`${writeClass.changeClass} — submitted into the approval cycle, not applied`}
            />
            <p className="mt-2">
              The bound check passed: {outcome.statement} Passing the bound is not the change taking
              effect.
            </p>
            <p className="mt-2">
              {writeClass.changeClass}: {writeClass.approvalRoute} The audit event for the approval
              is written in the same transaction as the approval itself.
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              Nothing has been applied. The platform default is unchanged and stays in force until
              the checker approves. A request is shown in its own state, and this storyboard has no
              queue behind it — no submission left the browser.
            </p>
          </div>
        ) : null}

        {routed !== null ? (
          <div role="status" aria-label="Write outcome" className="mt-3 max-w-prose text-sm">
            <StatusPill tone="attention" icon="•" label="critical class — routed for root approval" />
            <p className="mt-2">
              {routed.changeClass}: {routed.approvalRoute}
            </p>
            <p className="mt-2">
              The root approves its own critical-class actions: no second approver exists on this
              platform, and while the root is unavailable the class is frozen (DEC-ROOTSUCC-001,
              D13). The queue itself lives in{' '}
              <Link
                href="/super-admin/console-users-roles-and-change-approvals/"
                className="text-[var(--color-primary)] underline"
              >
                Console Users, Roles and Change Approvals
              </Link>
              .
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              Nothing has been applied. A request is shown in its own state, and this storyboard has
              no queue behind it.
            </p>
          </div>
        ) : null}
      </Section>

      <Section id="sa19-conformance" heading="Conformance panel — values outside a recently tightened bound">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Tightening a bound surfaces non-conforming existing values rather than rewriting them
          (AC-SA-19-09, L46318, L44568). The list is the whole affordance: the values stay as they
          are until each tenant changes its own, and nothing on this panel changes a tenant value.
        </p>
        {mode === 'recovering' ? (
          <p className="mt-3 max-w-prose text-sm">
            The conformance report is being re-derived and is not presented. {REGISTRY_RECOVERY_NOTE}{' '}
            The rows that were outside their bound before the failure are not re-listed from the
            previous derivation: a list drawn now would read as the finished report.
          </p>
        ) : (
        <div className="mt-3">
          <Table
            caption="Conformance report — current values outside a recently tightened bound"
            columns={[
              { key: 'setting', header: 'Setting' },
              { key: 'tenant', header: 'Tenant' },
              { key: 'current', header: 'Current value' },
              { key: 'bound', header: 'Bound after tightening' },
              { key: 'source', header: 'Source' },
            ]}
            rows={NON_CONFORMING_ENTRIES.map((e) => ({
              setting: e.settingName,
              tenant: e.tenantLabel,
              current: e.currentValue,
              bound: e.tightenedBound,
              source: e.sourceRef,
            }))}
            emptyState={{
              title: 'No current value falls outside its bound',
              whatCreatesIt:
                'Tightening a floor-register bound below an existing tenant value adds a row here.',
            }}
          />
        </div>
        )}
        <div className="mt-2">
          <PermissionNotice decision={readDecision} />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          All four console roles read this panel (L46246). None of them acts on a row from here.
        </p>
      </Section>

      <Section id="sa19-fixed" heading="The seven platform-fixed items">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Fixed for everyone, always (L3606, L12100). These present no control anywhere — including
          no disabled control (AC-FLOOR-003, L12939) — so nothing is drawn beside them.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {PLATFORM_FIXED_ITEMS.map((item) => (
            <li key={item.name}>
              <p className="font-medium">{item.name}</p>
              <p className="text-[var(--color-ink-muted)]">{item.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa19-absent" heading="Controls that do not exist here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these is a note in the place a control would sit. None is a disabled control,
          because a disabled control implies an enabled state exists somewhere.
        </p>
        <ul className="mt-3 space-y-3">
          {REGISTRY_ABSENT_CONTROLS.map((c) => (
            <li key={c.label}>
              <p className="text-sm font-medium">{c.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa19-access" heading="Reaching tenant content from here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every row on this screen belongs to a tenant, and no row opens. There is no ambient
          browsing anywhere on this console (AC-SA-000-07, AC-SEC-801): tenant content is reachable
          only by requesting a session under one of the three named access classes.
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm">
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            Request a named access session in Support Access
          </Link>{' '}
          — that session-request form is the only route from this console to anything inside{' '}
          {REGISTRY_TENANT_LABEL}. The floor register these bounds come from is displayed in{' '}
          <Link href="/super-admin/platform-settings/" className="text-[var(--color-primary)] underline">
            Platform Settings
          </Link>
          ; this module is where a write is validated against it.
        </p>
      </Section>

      <Section id="sa19-workflows" heading="Workflows this module renders">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The extraction attaches no module identifier to any workflow, so each row states how it was
          matched to this module.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {REGISTRY_WORKFLOWS.map((w) => (
            <li key={w.id}>
              <p className="font-medium">{w.name}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{w.id}</p>
              <p className="text-[var(--color-ink-muted)]">
                {w.actor} · {w.trigger}
              </p>
              <p className="text-[var(--color-ink-muted)]">Ends at: {w.terminalStates.join('; ')}.</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">Matched by {w.matchedBy}.</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa19-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented:
          a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {REGISTRY_UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.affordance}>
              <p className="font-medium">{u.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa19-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {REGISTRY_SOURCE_CONFLICTS.map((c) => (
            <li key={c.topic}>
              <p className="font-medium">{c.topic}</p>
              <p className="text-[var(--color-ink-muted)]">{c.conflict}</p>
              <p className="text-[var(--color-ink-muted)]">Resolved as: {c.resolution}</p>
            </li>
          ))}
        </ul>
      </Section>
    </SaConsoleShell>
  )
}
