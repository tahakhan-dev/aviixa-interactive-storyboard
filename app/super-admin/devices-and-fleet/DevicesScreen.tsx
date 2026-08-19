'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SaConsoleShell } from '../SaConsoleShell'
import { saModuleById } from '@/surfaces/sa/modules'
import { CommandStateBadge } from '@/ui/sa/CommandStateBadge'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import {
  Banner,
  Button,
  PermissionNotice,
  Select,
  StatusPill,
  Table,
  type StatusTone,
  type TableRow,
} from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState, type ScreenStateId } from '@/ui/screen-state'
import { evaluateAccess } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { RootUnavailableFreeze } from '@/ui/sa/RootUnavailableFreeze'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import {
  ABSENT_BY_RULE,
  DEVICES,
  DEVICE_PLATFORM_ROLES,
  DEVICE_POLICY_ITEMS,
  DEVICE_WORKFLOWS,
  FLEET_AGGREGATES,
  REACHED_WIPE_SEQUENCE,
  SEEDED_COMMANDS,
  SUSPENSION_COMMAND,
  UNREACHED_STEPPER_END_REASON,
  UNREACHED_WIPE_SEQUENCE,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  type CommandLogRow,
  type DeviceLifecycleState,
  type DeviceRow,
  type WipeStep,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-13')

const ALL_CONSOLE_ROLES: readonly RoleId[] = DEVICE_PLATFORM_ROLES.map((r) => r.roleId)
const ROOT_AND_ADMIN: readonly RoleId[] = ['ROOT_SUPER_ADMIN', 'ADMIN']
const ROOT_ONLY: readonly RoleId[] = ['ROOT_SUPER_ADMIN']

const SCREEN_STATE_OPTIONS = SA_APPLICABLE_STATES.map((s) => ({
  value: s.id,
  label: `${s.id} — ${s.name}`,
}))

const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-MOD-13-STORYBOARD'))

const DEVICE_STATE_TONE: Record<DeviceLifecycleState, StatusTone> = {
  enrolled: 'info',
  active: 'ok',
  'mode changed': 'attention',
  retired: 'neutral',
  'de-authorised': 'blocked',
}

function contextFor(roleId: RoleId) {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      // A console role holds no ambient tenant: it acts through a named
      // access class or not at all (AC-AUTH-006, L10429).
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
  } as const
}

/** Every affordance on this screen is decided here, by its own control
 *  entry's allowed-roles — never by the module-level `roles_allowed` list,
 *  which differs in all nine extraction chunks naming this module (D16). */
function decide(
  roleId: RoleId,
  action: string,
  allowedRoles: readonly RoleId[],
  sourceRefs: readonly string[],
  openDecision?: string,
): PermissionDecision {
  return evaluateAccess(
    {
      action,
      allowedRoles,
      sourceRefs,
      ...(openDecision !== undefined ? { openDecision } : {}),
    },
    contextFor(roleId),
  )
}

/**
 * The ONE cause of this module's read-only rendering (STATE-06: "Never
 * scatter the cause across several messages. One banner, one cause."). It is
 * rendered verbatim in all three places the state is stated — the module
 * note, the boundary banner and every disabled control's reason — because a
 * second wording of the same fact, role-framed or otherwise, IS the defect
 * that rule exists to prevent. Change it here or nowhere.
 *
 * It names the device-detail selector because that selector is genuinely
 * disabled below, and it exempts the two view switchers because they are not
 * module inputs: they are the storyboard's own controls, and disabling the
 * screen-state one would leave no way out of this state.
 */
const STATE_06_CAUSE =
  'Read-only (STATE-06): every input is disabled — the wipe draft, the approval, the suspension record, both fixture steppers and the device-detail selector. The role and screen-state selectors are storyboard view switchers rather than module inputs, and they stay live so this state can be left. One state, one cause.'

/** The screen state gates every control on this module BEFORE the role
 *  decision is consulted: STATE-06 disables every input and STATE-12 lets
 *  nothing be submitted, whatever the role holds. A control that ignores the
 *  screen state is a dead control by another name. `null` means the screen
 *  state blocks nothing. */
function stateBlocker(stateId: ScreenStateId): string | null {
  if (stateId === 'STATE-06') {
    return STATE_06_CAUSE
  }
  if (stateId === 'STATE-12') {
    return 'Nothing can be submitted while the platform audit write accompanying a device command is failing (STATE-12). A device command and its audit entry commit together, so a command that cannot be audited is not recorded at all.'
  }
  return null
}

export function DevicesScreen() {
  const [sourceRoleId, setSourceRoleId] = useState<string>('ROLE-PLAT-ROOT')
  const [stateId, setStateId] = useState<ScreenStateId>('STATE-03')
  const [detailDeviceId, setDetailDeviceId] = useState<string>('DEV-TAB-0141')
  const [reachedIndex, setReachedIndex] = useState(0)
  const [unreachedIndex, setUnreachedIndex] = useState(0)
  const [commands, setCommands] = useState<readonly CommandLogRow[]>(SEEDED_COMMANDS)
  const [draftOpened, setDraftOpened] = useState(false)
  const [approvalRecorded, setApprovalRecorded] = useState(false)

  /** A recorded click belongs to the role and the screen state it was made
   *  under. Moving either switcher clears it, so a refusal is never rendered
   *  beside a notice saying the same action is already done.
   *
   *  ALL THREE recorded interactions, `commands` included: the log resets to
   *  the seeded rows because the suspension row, the spent-control branch and
   *  the "already recorded" reason are three renderings of one fact, and a
   *  reset that clears two of them leaves the third contradicting the refusal
   *  printed directly above it. */
  function resetInteractions(): void {
    setDraftOpened(false)
    setApprovalRecorded(false)
    setCommands(SEEDED_COMMANDS)
  }

  const role = DEVICE_PLATFORM_ROLES.find((r) => r.sourceId === sourceRoleId) ?? DEVICE_PLATFORM_ROLES[0]
  const roleId = role.roleId
  const definition = screenState(stateId)
  const blocked = stateBlocker(stateId)

  // `DEVICES[0]`, not `devices[0]`: the seeded tuple's first element is
  // statically known to exist under noUncheckedIndexedAccess. The fallback is
  // unreachable — the selector only offers ids that are in the list.
  const detailDevice: DeviceRow = DEVICES.find((d) => d.id === detailDeviceId) ?? DEVICES[0]

  const draftDecision = decide(roleId, 'draft-device-wipe-request', ROOT_AND_ADMIN, [
    'L45498',
    'WF-DVC-006 L53257',
  ])
  const approveDecision = decide(roleId, 'approve-device-wipe-request', ROOT_ONLY, [
    'L45498',
    'AC-SA-13-03 L45570',
    'L55942',
  ])
  const suspendDecision = decide(roleId, 'issue-device-suspension', ROOT_AND_ADMIN, [
    'WF-DVC-005 L53224',
  ])
  const readDecision = decide(roleId, 'read-fleet', ALL_CONSOLE_ROLES, ['D16 L42742', 'L45502'])

  const reachedStep: WipeStep = REACHED_WIPE_SEQUENCE[reachedIndex] ?? REACHED_WIPE_SEQUENCE[0]
  const reachedNext = REACHED_WIPE_SEQUENCE[reachedIndex + 1]
  const unreachedStep: WipeStep = UNREACHED_WIPE_SEQUENCE[unreachedIndex] ?? UNREACHED_WIPE_SEQUENCE[0]
  const unreachedNext = UNREACHED_WIPE_SEQUENCE[unreachedIndex + 1]

  const suspensionRecorded = commands.some((c) => c.id === SUSPENSION_COMMAND.id)

  const fleetRows: readonly TableRow[] = DEVICES.map((d) => ({
    device: (
      <>
        <span className="font-medium">{d.id}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{d.tenantLabel}</span>
      </>
    ),
    state: <StatusPill tone={DEVICE_STATE_TONE[d.state]} icon="●" label={d.state} />,
    binding: (
      <>
        <span>{d.mode} mode</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{d.binding}</span>
      </>
    ),
    version: (
      <>
        <span>{d.appVersion}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{d.floorStatus}</span>
      </>
    ),
    contact: (
      <>
        <span>{d.contact === 'reached' ? `last seen ${d.lastSeen}` : 'has not been reached'}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">
          heartbeat {d.heartbeat}
        </span>
      </>
    ),
    sync: (
      <>
        <span>{d.syncHealth}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">
          clock skew: {d.clockSkew} · storage pressure: {d.storagePressure}
        </span>
      </>
    ),
  }))

  const aggregateRows: readonly TableRow[] = FLEET_AGGREGATES.map((a) => ({
    tenant: a.tenantLabel,
    enrolled: a.enrolled,
    unreached: a.unreached,
    freshness:
      a.freshness === 'current' ? (
        <span>{a.asOf}</span>
      ) : a.freshness === 'stale' ? (
        <span>
          {a.asOf} — stale, {a.age ?? 'age not recorded'}
        </span>
      ) : (
        <span>
          Unavailable — {a.asOf}. The measure is unavailable and is never rendered as a count it
          does not have.
        </span>
      ),
  }))

  const commandRows: readonly TableRow[] = commands.map((c) => ({
    id: c.id,
    device: c.device,
    command: c.command,
    state: <CommandStateBadge state={c.state} />,
    recorded: c.recordedAt,
    note: c.note,
  }))

  const packageRows: readonly TableRow[] = detailDevice.packages.map((p) => ({
    version: p.packageVersion,
    scope: p.scope,
  }))

  const auditRows: readonly TableRow[] = detailDevice.auditTrail.map((a) => ({
    when: a.when,
    what: a.what,
    entryClass: a.entryClass,
    mirrored: a.mirrored,
  }))

  const workflowRows: readonly TableRow[] = DEVICE_WORKFLOWS.map((w) => ({
    id: (
      <>
        <span className="font-medium">{w.id}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{w.sourceRef}</span>
      </>
    ),
    name: w.name,
    actor: w.actor,
    trigger: w.trigger,
    terminal: w.terminalState,
    here: w.here,
  }))

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotations only, never route keys (D1): SCR-SA-19 fleet cross-tenant table and
        device detail (L42811, L45498), SB-SA-13 (L45498), SB-SA-DEVICE-01 (L117496), SB-31-09
        (L76038), and the unnumbered §8.13 section (L53070). The route is named; no number keys
        anything.
      </p>

      <section aria-label="Prototype boundary" className="mt-6">
        <Banner
          tone="attention"
          heading="No device channel exists behind this screen"
          body="This is the highest-risk module in the storyboard, because every element of it is a claim about a real device channel. There is none. Both command sequences below are seeded fixtures that advance one step at a time, only when you click, with the command state named at every step. Nothing here reaches a device, and nothing here reports what a device has done."
        />
      </section>

      <section aria-label="View controls" className="mt-6 flex flex-wrap gap-4">
        <Select
          label="View as platform role"
          value={sourceRoleId}
          onChange={(v) => {
            setSourceRoleId(v)
            resetInteractions()
          }}
          options={DEVICE_PLATFORM_ROLES.map((r) => ({
            value: r.sourceId,
            label: `${r.name} (${r.sourceId})`,
          }))}
        />
        <Select
          label="Screen state"
          value={stateId}
          onChange={(v) => {
            setStateId(v as ScreenStateId)
            resetInteractions()
          }}
          options={SCREEN_STATE_OPTIONS}
        />
      </section>
      <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        The role selector is a view switcher, not a sign-in. Every affordance below is decided by
        its own control entry&rsquo;s allowed-roles through the policy evaluator. All four console
        roles read the whole fleet; only the Admin and the root hold a device action, and only the
        root approves one.
      </p>

      <section aria-label="Screen state" className="mt-6">
        <h2 className="text-lg font-semibold">Screen state</h2>
        <p className="mt-1 text-sm font-medium">
          {definition.id} — {definition.name}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {definition.contract}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          On this module: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, role.name, draftDecision)}</div>
      </section>

      <section aria-label="Fleet summary" className="mt-6">
        <h2 className="text-lg font-semibold">Fleet summary</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Device counts by tenant, each carrying the moment it was true. A degraded figure renders
          stale with its age and a wholly unavailable one renders unavailable; neither renders as a
          zero and neither renders as a blank (AC-SA-01-03).
        </p>
        <div className="mt-3">
          <Table
            caption="Enrolled and unreached device counts by tenant, with their as-of stamps"
            columns={[
              { key: 'tenant', header: 'Tenant' },
              { key: 'enrolled', header: 'Devices enrolled' },
              { key: 'unreached', header: 'Devices unreached' },
              { key: 'freshness', header: 'As of' },
            ]}
            rows={aggregateRows}
            emptyState={{
              title: 'No fleet aggregate has been computed.',
              whatCreatesIt: 'The aggregation layer computes it from device telemetry.',
            }}
          />
        </div>
      </section>

      <section aria-label="Fleet" className="mt-6">
        <h2 className="text-lg font-semibold">Fleet</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The cross-tenant fleet: enrolled devices, their mode and binding, their application
          version against the floor, when each was last seen, its heartbeat and its sync health,
          with clock-skew and storage-pressure signals (§8.13, L53070). This table names no worker:
          a device row carries equipment telemetry, a binding class and nothing about a person.
        </p>
        {readDecision.outcome !== 'allowed' ? <PermissionNotice decision={readDecision} /> : null}
        <div className="mt-3">
          <Table
            caption="Enrolled devices across tenants, with their contact and sync telemetry"
            columns={[
              { key: 'device', header: 'Device' },
              { key: 'state', header: 'Device state' },
              { key: 'binding', header: 'Mode and binding' },
              { key: 'version', header: 'Application version' },
              { key: 'contact', header: 'Contact' },
              { key: 'sync', header: 'Sync health' },
            ]}
            rows={fleetRows}
            emptyState={{
              title: 'No device is enrolled.',
              whatCreatesIt:
                'A tenant enrolls its own devices. No console role can enroll one (AC-SA-13-02).',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          A device that has not been reached is rendered as unreached, with everything the platform
          cannot know about it stated as unknown. No row renders an unreached device as having
          taken a command (AC-SA-13-05).
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Reaching record-level tenant content needs a named access class. The session-request form
          lives in{' '}
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            Support Access
          </Link>
          , and there is no ambient browsing anywhere on this console.
        </p>
      </section>

      <section aria-label="Device detail" className="mt-6">
        <h2 className="text-lg font-semibold">Device detail</h2>
        <div className="mt-2 max-w-sm">
          {/* A module input, not a storyboard view switcher: STATE-06 says
              every input is disabled, so this one genuinely is. */}
          <Select
            label="Open a device detail"
            value={detailDevice.id}
            onChange={setDetailDeviceId}
            options={DEVICES.map((d) => ({ value: d.id, label: `${d.id} — ${d.tenantLabel}` }))}
            disabled={stateId === 'STATE-06'}
          />
        </div>
        <p className="mt-2 max-w-prose text-sm font-medium">
          {detailDevice.id} · {detailDevice.state} · {detailDevice.mode} mode ·{' '}
          {detailDevice.tenantLabel}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {detailDevice.note}
        </p>

        <h3 className="mt-4 text-base font-semibold">Package inventory</h3>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Which package version each run on this device executed against, counted in the
          tenant-month (AC-SA-13-06). The run records themselves are not reachable from here.
        </p>
        <div className="mt-2">
          <Table
            caption="Package versions recorded against this device"
            columns={[
              { key: 'version', header: 'Package version' },
              { key: 'scope', header: 'Scope' },
            ]}
            rows={packageRows}
            emptyState={{
              title: 'No package has been recorded against this device.',
              whatCreatesIt:
                'A device enrolled with no package has no runnable work until one is published to it (WF-DVC-001).',
            }}
          />
        </div>

        <h3 className="mt-4 text-base font-semibold">Device audit trail</h3>
        <div className="mt-2">
          <Table
            caption="Audit entries recorded against this device"
            columns={[
              { key: 'when', header: 'When' },
              { key: 'what', header: 'What was recorded' },
              { key: 'entryClass', header: 'Class' },
              { key: 'mirrored', header: 'Mirroring' },
            ]}
            rows={auditRows}
            emptyState={{
              title: 'No audit entry has been recorded against this device.',
              whatCreatesIt: 'Every recorded device action writes one, in the same transaction.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Entry state is committed alone; no other state exists by construction (D3). Every
          platform-side device action also appears in that tenant&rsquo;s own audit stream.
        </p>
      </section>

      <section aria-label="Wipe and de-authorisation" className="mt-6">
        <h2 className="text-lg font-semibold">Wipe and de-authorisation</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The one control the frozen source defines for this module (L45498): the Admin drafts and
          the Root Super Admin approves. It is critical class, and it is mirrored to the platform
          audit stream and to the tenant&rsquo;s own audit stream (AC-SA-13-03). The control opens a
          request and displays the command state vocabulary explicitly; it does not act on a device.
        </p>

        <div className="mt-3 space-y-3">
          <div>
            {draftDecision.outcome === 'allowed' && blocked === null ? (
              <Button onClick={() => setDraftOpened(true)}>
                Draft the wipe and de-authorisation request
              </Button>
            ) : (
              <Button
                disabledReason={
                  blocked ??
                  `${draftDecision.explanation} The Admin drafts this request and the Root Super Admin approves it (L45498); the Platform Engineer and Support read the fleet and hold no device action. Viewing as ${role.name}.`
                }
              >
                Draft the wipe and de-authorisation request
              </Button>
            )}
            {draftOpened ? (
              <p role="status" className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
                Request SA-REQ-0134 is open against DEV-TAB-0271 and awaiting root approval.
                Drafting is not approving: a blocked attempt is itself an audit event
                (AC-SA-000-04), and exactly one root account exists, so no second approver is
                available.
              </p>
            ) : null}
          </div>

          <div>
            {approveDecision.outcome !== 'allowed' ? (
              // Critical class seen by a non-root role: the class badge
              // REPLACES the action bar, so no disabled action is drawn.
              <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
            ) : blocked !== null ? (
              // Root holds it, but the screen state does not permit it.
              <Button disabledReason={blocked}>Approve the critical-class request</Button>
            ) : (
              <>
                <Button onClick={() => setApprovalRecorded(true)}>
                  Approve the critical-class request
                </Button>
                {approvalRecorded ? (
                  <p role="status" className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
                    The approval is recorded and mirrored to both audit streams. It authorises a
                    command; it does not reach a device. What happens next is the sequence below,
                    and it happens one honest step at a time.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        <p role="note" className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Sync-then-wipe is the rule, not a preference: every erasure on a reachable device is
          preceded by a final sync attempt of its pending captures, because de-authorising a device
          must not destroy unsynced work (AC-SA-13-04). The sequence below is ordered so the final
          sync attempt cannot be stepped past.
        </p>
      </section>

      <section aria-label="Wipe on a device that returns" className="mt-6">
        <h2 className="text-lg font-semibold">Wipe on a device that returns</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          WF-DVC-006 on DEV-TAB-0141, a device in contact with the platform. Step it yourself: the
          fixture moves only when you click, and its true command state is named at every step.
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The order is the rule. The final sync attempt of the device&rsquo;s pending captures sits
          at the validated state, and erasure runs only after it, so there is no step from a queued
          command to an erased device (AC-SA-13-04).
        </p>
        <div className="mt-3">
          <CommandStateBadge state={reachedStep.state} />
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">{reachedStep.note}</p>
        {reachedStep.finalSyncAttempt === true ? (
          <p className="mt-1 max-w-prose text-sm font-medium">
            This is the final sync attempt required by AC-SA-13-04.
          </p>
        ) : null}
        <div className="mt-2">
          {reachedNext !== undefined && blocked === null ? (
            <Button variant="secondary" onClick={() => setReachedIndex(reachedIndex + 1)}>
              Advance the reachable-device fixture one state
            </Button>
          ) : (
            <Button
              disabledReason={
                blocked ??
                'The sequence has reached its last state; there is nothing further to step.'
              }
            >
              Advance the reachable-device fixture one state
            </Button>
          )}
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          {reachedNext !== undefined
            ? `The next state in this sequence is ${reachedNext.state}. Until you step it, this command is exactly what the badge says it is.`
            : 'The sequence is at its last state. Nothing further is claimed.'}
        </p>
      </section>

      <section aria-label="Wipe on a device that never returns" className="mt-6">
        <h2 className="text-lg font-semibold">Wipe on a device that never returns</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          WF-DVC-004 and WF-CMD-WIPE on DEV-TAB-0271, reported stolen and out of contact for eleven
          days. This is the sharpest criterion in the slice: no console view renders an unreached
          device as having taken a command (AC-SA-13-05). The sequence therefore has nowhere to go
          after the platform has done everything it can do on its own side.
        </p>
        <div className="mt-3">
          <CommandStateBadge state={unreachedStep.state} />
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {unreachedStep.note}
        </p>
        <div className="mt-2">
          {unreachedNext !== undefined && blocked === null ? (
            <Button variant="secondary" onClick={() => setUnreachedIndex(unreachedIndex + 1)}>
              Advance the unreachable-device fixture one state
            </Button>
          ) : (
            <Button disabledReason={blocked ?? UNREACHED_STEPPER_END_REASON}>
              Advance the unreachable-device fixture one state
            </Button>
          )}
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          {unreachedNext !== undefined
            ? `The next state in this sequence is ${unreachedNext.state}.`
            : 'The device is de-authorised server-side, which is a platform-side fact. The command itself is outstanding, the captures held on the device are named as unrecovered, and DEC-WIPE-001 is open.'}
        </p>
      </section>

      <section aria-label="Command log" className="mt-6">
        <h2 className="text-lg font-semibold">Command log</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every command directed at a device is accepted and recorded, including one directed at a
          device that is not reporting. Each row shows its true state from the fifteen-state
          vocabulary, and none of them says a command arrived.
        </p>
        <div className="mt-3">
          {suspendDecision.outcome === 'allowed' && !suspensionRecorded && blocked === null ? (
            <Button
              variant="secondary"
              onClick={() => setCommands([...commands, SUSPENSION_COMMAND])}
            >
              Record a device suspension command
            </Button>
          ) : (
            <Button
              disabledReason={
                // One rendering, one cause, named in precedence order. This
                // branch used to fall through to "already recorded" whenever
                // the button was disabled for ANY reason, so a role that never
                // held the command was told the action was already done rather
                // than that it lacks the grant.
                blocked ??
                (suspensionRecorded
                  ? 'The suspension command is already recorded in the log below. This storyboard records it once.'
                  : `${suspendDecision.explanation} The Root Super Admin and the platform Admin hold this command (WF-DVC-005, L53224); the Platform Engineer and Support read the fleet and hold no device action. Viewing as ${role.name}.`)
              }
            >
              Record a device suspension command
            </Button>
          )}
        </div>
        <div className="mt-3">
          <Table
            caption="Commands recorded against devices, each with its true state"
            columns={[
              { key: 'id', header: 'Command' },
              { key: 'device', header: 'Device' },
              { key: 'command', header: 'What was recorded' },
              { key: 'state', header: 'State' },
              { key: 'recorded', header: 'Recorded at' },
              { key: 'note', header: 'What is true' },
            ]}
            rows={commandRows}
            emptyState={{
              title: 'No command has been recorded.',
              whatCreatesIt: 'A console action records one; a device answers it, or does not.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          A suspension preserves all local data on the device. Nothing in this log is a report from
          a device: the only device-side facts this prototype can show are the ones you step
          through above.
        </p>
      </section>

      <section aria-label="Device policy layer" className="mt-6">
        <h2 className="text-lg font-semibold">Device policy layer</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          `OBJ-SA-DEVICEPOLICY` (L45517). The console owns these three positions. The source names
          no control that changes any of them, so they are read here and the missing editors are
          named below rather than drawn.
        </p>
        <dl className="mt-3 space-y-3">
          {DEVICE_POLICY_ITEMS.map((item) => (
            <div key={item.name}>
              <dt className="text-sm font-medium">
                {item.name}: {item.value}
              </dt>
              <dd className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                {item.note} ({item.sourceRef})
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Device workflows" className="mt-6">
        <h2 className="text-lg font-semibold">Device workflows</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The device workflows the frozen source defines, with the actor it names, the trigger and
          the terminal state it states. WF-DVC-001 to WF-DVC-006 carry no module identifier in the
          extraction and are matched here by line proximity: they sit immediately under this
          module&rsquo;s own entry at L53070, whose key functions name four of them.
        </p>
        <div className="mt-3">
          <Table
            caption="Device workflows, their actors, triggers and terminal states"
            columns={[
              { key: 'id', header: 'Workflow' },
              { key: 'name', header: 'Name' },
              { key: 'actor', header: 'Actor' },
              { key: 'trigger', header: 'Trigger' },
              { key: 'terminal', header: 'Terminal state' },
              { key: 'here', header: 'How it appears here' },
            ]}
            rows={workflowRows}
            emptyState={{
              title: 'No device workflow is defined.',
              whatCreatesIt: 'The frozen source defines them.',
            }}
          />
        </div>
      </section>

      <section aria-label="Absent by rule" className="mt-6">
        <h2 className="text-lg font-semibold">Absent by rule</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          These actions do not exist on this platform for any account, the root included. Nothing is
          drawn where each would sit — only the note saying why.
        </p>
        <div className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
          {ABSENT_BY_RULE.map((note) => (
            <ProhibitionNotice key={note} rendering={{ kind: 'absent', note }} />
          ))}
        </div>
      </section>

      <section aria-label="Unspecified in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unspecified in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One control carries this module&rsquo;s identifier in the frozen source — the wipe control
          — and it is built above, alongside the workflows the source defines. Everything below is
          an affordance a reader might expect and the source does not define. It is named rather
          than invented, because a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNSPECIFIED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Unresolved in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unresolved in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Questions the frozen source leaves open or answers twice. None is resolved silently in
          code.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNRESOLVED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <RootUnavailableFreeze actions={['device-wipe']} />
    </SaConsoleShell>
  )
}

/* ------------------------------------------------------------------ *
 * The twelve applicable screen states. STATE-07 is frontline-only.
 * ------------------------------------------------------------------ */

const MODULE_STATE_NOTE: Record<ScreenStateId, string> = {
  'STATE-01':
    'the fleet before a tenant has enrolled a device. No console role creates one — the note says what does.',
  'STATE-02':
    'the fleet table and the device counts while they are being fetched. A count that has not arrived is a placeholder, never the number nought.',
  'STATE-03': 'the fleet, the device detail, the command log and both steppers below.',
  'STATE-04':
    'the wipe request, when its reason is missing. The rule and the accepted form are stated rather than the value merely refused.',
  'STATE-05':
    'a role without a device action meeting its control — the Platform Engineer meeting the wipe draft, for instance.',
  // Not a paraphrase: the one cause verbatim. A note that reworded it would
  // be the second message STATE-06 forbids.
  'STATE-06': STATE_06_CAUSE,
  'STATE-07': 'nothing. Only the Frontline Worker Application has a true offline state.',
  'STATE-08':
    'a degraded fleet count, served last-known-good and stamped stale with its age (AC-SA-01-03).',
  'STATE-09':
    'a command travelling to a device, rendered by its own true state from the fifteen and never as having taken effect early (AC-SA-000-08).',
  'STATE-10':
    'nothing on this module changes: no device reading and no command state depends on an artificial-intelligence model.',
  'STATE-11':
    'the module with every artificial-intelligence model unavailable. The fleet still reads, both steppers still step, and every control still decides — nothing here depends on a model (AC-SA-000-09).',
  'STATE-12':
    'a platform audit write that failed alongside a device command. Nothing may be submitted: every control that would submit one is disabled, the command is not recorded and the device is untouched. Reading is not submitting, so the fleet, the detail pane and the log still read.',
  'STATE-13':
    're-aggregating fleet telemetry after a gap, with the degraded window recorded rather than smoothed over.',
}

function stateTreatment(stateId: ScreenStateId, roleName: string, draftDecision: PermissionDecision) {
  switch (stateId) {
    case 'STATE-01':
      return (
        <ScreenStateBoundary
          state="STATE-01"
          surface="SURF-SA"
          detail={{
            objectLabel: 'enrolled devices',
            whatCreatesIt:
              'A tenant enrolls its own devices within platform policy. No console role can enroll one, the root included (AC-SA-13-02).',
          }}
        />
      )
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-SA"
          detail={{ objectLabel: 'the cross-tenant fleet' }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The fleet, the device detail, the command log and both wipe sequences below are the
          success rendering.
        </p>
      )
    case 'STATE-04':
      return (
        <ScreenStateBoundary
          state="STATE-04"
          surface="SURF-SA"
          detail={{
            fieldLabel: 'Reason for the wipe and de-authorisation request',
            rule: 'A wipe and de-authorisation request carries its reason, because the reason is what the root approves against and what both audit streams record.',
            permittedFormat:
              'A stated reason naming the report behind it — a device reported lost, or a device reported stolen.',
          }}
        />
      )
    case 'STATE-05':
      if (draftDecision.outcome === 'allowed') {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} holds the wipe draft, so no refusal renders for this role. Select the
            Platform Engineer or Support to see the refusal named rather than hidden behind a
            missing control.
          </p>
        )
      }
      return (
        <ScreenStateBoundary state="STATE-05" surface="SURF-SA" detail={{ decision: draftDecision }} />
      )
    case 'STATE-06':
      return (
        <ScreenStateBoundary
          state="STATE-06"
          surface="SURF-SA"
          // The same string every disabled control on this module prints. The
          // role framing that used to sit here was a SECOND cause for one
          // read-only rendering, and false for the root, who holds both the
          // draft and the approval and is disabled anyway.
          detail={{ readOnlyCause: STATE_06_CAUSE }}
        />
      )
    case 'STATE-08':
      return (
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-SA"
          detail={{
            asOfLabel: 'as of 2026-08-16 05:30 platform time, 135 minutes old',
            originLabel: 'served last-known-good from the aggregation layer',
          }}
        />
      )
    case 'STATE-09':
      return <ScreenStateBoundary state="STATE-09" surface="SURF-SA" detail={{ commandState: 'queued' }} />
    case 'STATE-10':
      return (
        <ScreenStateBoundary
          state="STATE-10"
          surface="SURF-SA"
          detail={{
            degradedMissing: 'Platform agent quality has crossed the alert threshold.',
            degradedRemaining:
              'Every reading and every control on this module behaves unchanged: no device fact and no command state comes from a model.',
          }}
        />
      )
    case 'STATE-11':
      return (
        <ScreenStateBoundary
          state="STATE-11"
          surface="SURF-SA"
          detail={{
            unavailableCause:
              'Every platform artificial-intelligence model is unavailable, and is said to be unavailable. Nothing on this module depends on one: the fleet reads, both steppers step, the command log records, and every control still decides through the policy evaluator (AC-SA-000-09).',
          }}
        />
      )
    case 'STATE-12':
      return (
        <ScreenStateBoundary
          state="STATE-12"
          surface="SURF-SA"
          detail={{
            failureWhat: 'The platform audit write accompanying a device command',
            wasWritten: false,
            nextStep:
              'The command is not recorded and no device is touched. The action can be attempted again.',
          }}
        />
      )
    case 'STATE-13':
      return (
        <ScreenStateBoundary
          state="STATE-13"
          surface="SURF-SA"
          detail={{
            recoveryProgress:
              'Re-aggregating fleet telemetry after a gap: two of three tenant fleets recomputed, with the degraded window recorded rather than smoothed over.',
          }}
        />
      )
    case 'STATE-07':
      // Unreachable: STATE-07 is frontline-only and the selector never offers
      // it. Handled so the switch stays exhaustive over ScreenStateId.
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Only the Frontline Worker Application has a true offline state.
        </p>
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state: ${String(exhaustive)}`)
    }
  }
}
