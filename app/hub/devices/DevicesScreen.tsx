'use client'

import { useState } from 'react'
import { roleById, type RoleId } from '@/domain/roles'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { CommandStateBadge } from '@/ui/sa/CommandStateBadge'
import {
  Banner,
  Button,
  Checkbox,
  Field,
  LiveRegion,
  Select,
  StatusPill,
  Table,
  type StatusTone,
  type TableRow,
} from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState } from '@/ui/screen-state'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsAction, permitsRead, type PermissionDecision } from '@/policy/decision'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import {
  TENANT_STATES,
  TENANT_WRITE_CLASSES,
  writeAllowed,
  type TenantState,
} from '@/surfaces/doh/tenant-state'
import { HubShell, type HubShellUncataloguedScreen, type TenantRoleId } from '../HubShell'
import {
  ABSENT_BY_RULE,
  APPLICABLE_SCREEN_STATES,
  APP_VERSION_FLOOR,
  AUDIT_FAILURE_COPY,
  BINDABLE_AREAS,
  COMMAND_STATE_ON_CREATION,
  CONSOLE_OWNED_DEVICE_STATES,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  DEVICE_MODES,
  DEVICE_MODE_LABEL,
  DEVICE_PLATFORMS,
  DEVICE_STATE_LABEL,
  DEVICE_WRITE_CLASS,
  FLAG_DEFAULT_ENABLED,
  INAPPLICABLE_SCREEN_STATES,
  LOST_REPORT_CONFIRMATION,
  LOST_REPORT_GATE_CONCERN,
  NOT_READY_COPY,
  OPEN_DECISION_ON_OWNERSHIP,
  READING_STATUSES,
  SCREEN_IDENTIFIER,
  SCREEN_TITLE,
  SEEDED_DEVICES,
  TENANT_DEVICE_ENROLMENT_FLAG,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  WIPE_REQUEST_CONFIRMATION,
  areaLabel,
  meetsVersionFloor,
  rolesWithStatus,
  siteLabel,
  type ApplicableScreenStateId,
  type ControlStatus,
  type Device,
  type DeviceCommandRecord,
  type DeviceControlId,
  type DeviceMode,
  type DevicePlatform,
  type StoragePressure,
  type SyncHealth,
  type WipeRequestRecord,
} from './fixtures'

/**
 * `SCR-DOH-DEVICES` — uncatalogued, and claiming no module.
 *
 * IT WRAPS `HubShell` IN THE SHELL'S UNCATALOGUED-SCREEN MODE. The shell used
 * to have two modes and neither fitted: with a module it prints that module's
 * id and marks it current in the rail, which mints exactly the ownership D5
 * refuses; without one it renders the module index and drops `children`. This
 * screen therefore duplicated the chrome instead — a stated deviation from the
 * per-module contract, now retired. The shell's third mode takes a `screen`
 * descriptor: the shell's own header, breadcrumb, persona switcher, banner
 * region and prototype disclosure, over a route that names no module id
 * anywhere and takes no place in the rail.
 */
const DEVICE_SCREEN: HubShellUncataloguedScreen = {
  title: SCREEN_TITLE,
  annotation: `${SCREEN_IDENTIFIER} — UNCATALOGUED (D4). This identifier occurs exactly once in the frozen source and appears in NEITHER screen catalogue, so no catalogue row is minted for it and no two-digit number is invented. This route is keyed on its own slug and claims no module (D5).`,
  purpose:
    'The tenant’s own device inventory and the enrollment panel behind it. Enrol, reassign, retire, and report a device lost. Suspending and wiping are not built here and never will be from this surface.',
}

const HUB_TENANT_ID = tenantId('TEN-BRIGHTBIKES')

const WRITE_CLASS_NOTE = new Map(TENANT_WRITE_CLASSES.map((row) => [row.state, row.note]))

const STATUS_LABEL: Record<ControlStatus, string> = {
  allowed: 'Allowed',
  'allowed-with-conditions': 'Allowed with conditions',
  'read-only': 'Read-only',
  'explicitly-prohibited': 'Explicitly prohibited',
  'not-applicable': 'Not applicable',
  unavailable: 'Unavailable',
}

const SYNC_TONE: Record<SyncHealth, StatusTone> = {
  healthy: 'ok',
  degraded: 'attention',
  unreachable: 'blocked',
}

const STORAGE_TONE: Record<StoragePressure, StatusTone> = {
  ample: 'ok',
  tight: 'attention',
  full: 'blocked',
}

const SCREEN_STATE_OPTIONS = APPLICABLE_SCREEN_STATES.map((id) => ({
  value: id,
  label: `${id} — ${screenState(id).name}`,
}))

const TENANT_STATE_OPTIONS = TENANT_STATES.map((s) => ({ value: s, label: s }))

const CONNECTION_LOST_REASON =
  'The connection to this workspace’s own records is lost. The inventory degrades to the last loaded records with a freshness marker, and every write control here disables rather than queues — a queued device command would be an action with no audit entry, and worse, one the reader would believe had reached a device.'

/** The evaluator's own feature stage does the flag, so a control behind it
 *  refuses through the same nine ordered stages as every other refusal. */
function fixtureState(flagEnabled: boolean) {
  const base = withTenant(
    emptyDomainState(scenarioRunId('DOH-DEVICES-STORYBOARD')),
    HUB_TENANT_ID,
    () => ({
      displayName: 'Bright Bikes',
      lifecycleState: 'ACTIVE' as const,
      desiredFeatureValues: {},
      tier: 'growth',
      objects: {},
    }),
  )
  return {
    ...base,
    platform: {
      ...base.platform,
      featureControls: { [TENANT_DEVICE_ENROLMENT_FLAG]: flagEnabled },
    },
  }
}

function contextFor(roleId: RoleId, flagEnabled: boolean) {
  return {
    state: fixtureState(flagEnabled),
    identity: {
      signedIn: true,
      role: roleId,
      tenant: HUB_TENANT_ID,
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

function decide(
  roleId: RoleId,
  flagEnabled: boolean,
  action: string,
  controlId: DeviceControlId,
  statuses: readonly ControlStatus[],
  sourceRefs: readonly string[],
): PermissionDecision {
  return evaluateAccess(
    {
      action,
      allowedRoles: rolesWithStatus(controlId, statuses),
      requiredFeature: TENANT_DEVICE_ENROLMENT_FLAG,
      sourceRefs,
    },
    contextFor(roleId, flagEnabled),
  )
}

export function DevicesScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>('active')
  const [stateId, setStateId] = useState<ApplicableScreenStateId>('STATE-03')
  const [flagEnabled, setFlagEnabled] = useState(FLAG_DEFAULT_ENABLED)
  const [auditWillFail, setAuditWillFail] = useState(false)

  const [devices, setDevices] = useState<readonly Device[]>(SEEDED_DEVICES)
  const [commands, setCommands] = useState<readonly DeviceCommandRecord[]>([])
  const [wipeRequests, setWipeRequests] = useState<readonly WipeRequestRecord[]>([])

  const [newId, setNewId] = useState('')
  const [newPlatform, setNewPlatform] = useState<DevicePlatform>('android')
  const [newMode, setNewMode] = useState<DeviceMode>('shared')
  const [newAreaId, setNewAreaId] = useState<string>(BINDABLE_AREAS[0]?.id ?? '')
  const [newVersion, setNewVersion] = useState(APP_VERSION_FLOOR)
  const [reassignTo, setReassignTo] = useState<Record<string, string>>({})
  const [outcome, setOutcome] = useState<string | null>(null)

  const roleName = roleById(role).name
  const definition = screenState(stateId)

  const connectionLost = stateId === 'STATE-08' || stateId === 'STATE-12' || stateId === 'STATE-13'
  const readFailed = stateId === 'STATE-12'
  const emptyRequested = stateId === 'STATE-01'

  const viewDecision = decide(
    role,
    flagEnabled,
    'view-the-device-inventory',
    'view-the-device-inventory',
    READING_STATUSES,
    ['L67861'],
  )
  const enrolDecision = decide(
    role,
    flagEnabled,
    'enrol-a-device',
    'enrol-a-device',
    READING_STATUSES,
    ['WF-DVC-001 L53085'],
  )
  const reassignDecision = decide(
    role,
    flagEnabled,
    'reassign-a-device',
    'reassign-a-device',
    READING_STATUSES,
    ['WF-DVC-002 L53118'],
  )
  const retireDecision = decide(
    role,
    flagEnabled,
    'retire-a-device',
    'retire-a-device',
    READING_STATUSES,
    ['L67861'],
  )
  const lostDecision = decide(
    role,
    flagEnabled,
    'mark-a-device-lost',
    'mark-a-device-lost',
    READING_STATUSES,
    ['WF-DVC-003 L53152'],
  )
  const wipeRequestDecision = decide(
    role,
    flagEnabled,
    'request-a-wipe',
    'request-a-wipe',
    READING_STATUSES,
    ['L103830', 'L107423'],
  )

  const visibleDevices = emptyRequested ? [] : devices

  /**
   * THE TENANT STATE GATE, applied BEFORE any write control renders, then D7's
   * connection rule. One `writeAllowed` call against the ONE table.
   */
  function gateReason(): string | null {
    if (!writeAllowed(tenantState, DEVICE_WRITE_CLASS)) {
      return `Blocked while this workspace is ${tenantState}. ${WRITE_CLASS_NOTE.get(tenantState) ?? ''} Every device write here is gated on the configuration class, because the write-class enumerations name no device class at all — and enrolment against a workspace that is not active is refused by name in the source.`
    }
    if (connectionLost) return CONNECTION_LOST_REASON
    return null
  }

  /**
   * EVERY WRITE GOES THROUGH HERE, and the audit path is checked BEFORE the
   * mutation rather than beside it. An action that cannot be audited does not
   * happen, and no handler on this screen may mutate first and audit after.
   */
  function commit(apply: () => void, said: string): void {
    if (auditWillFail) {
      setOutcome(AUDIT_FAILURE_COPY)
      return
    }
    apply()
    setOutcome(said)
  }

  function changeScenario(apply: () => void): void {
    apply()
    setOutcome(null)
  }

  function changeRole(next: TenantRoleId): void {
    changeScenario(() => setRole(next))
  }

  const enrolValidation: string | null = (() => {
    if (newId.trim() === '') return 'A device identifier is required. Nothing is written until one is given.'
    if (devices.some((d) => d.id === newId.trim())) {
      return `A device with the identifier ${newId.trim()} is already enrolled in this workspace. Identifiers are unique, and nothing is written until this one is.`
    }
    if (newAreaId === '') return 'A device must be bound to a Site and an Area at enrollment.'
    if (!meetsVersionFloor(newVersion)) {
      return `The application version ${newVersion || '(none given)'} is below the floor. The floor is ${APP_VERSION_FLOOR}, it is platform policy rather than a tenant setting, and a device below it cannot be enrolled at all — so it never holds any of this workspace's data, which is safer than a tablet that half works.`
    }
    return null
  })()

  function enrol(): void {
    const areaId = newAreaId
    const area = BINDABLE_AREAS.find((a) => a.id === areaId)
    if (area === undefined) return
    commit(() => {
      setDevices((current) => [
        ...current,
        {
          id: newId.trim(),
          platform: newPlatform,
          mode: newMode,
          siteId: area.siteId,
          areaId,
          appVersion: newVersion,
          enrolledOn: '2026-08-19',
          lastSeen: 'Never — the device has not contacted the platform yet',
          syncHealth: 'unreachable',
          storagePressure: 'ample',
          pendingCaptures: 0,
          state: 'enrolled',
          runInFlight: null,
          note: 'Enrolled in this storyboard run.',
        },
      ])
      setNewId('')
    }, NOT_READY_COPY)
  }

  function reassign(device: Device): void {
    const target = reassignTo[device.id]
    const area = BINDABLE_AREAS.find((a) => a.id === target)
    if (area === undefined) return
    commit(
      () =>
        setDevices((current) =>
          current.map((d) =>
            d.id === device.id
              ? { ...d, areaId: area.id, siteId: area.siteId, state: 'reassigned' }
              : d,
          ),
        ),
      `${device.id} is now bound to ${area.name}. The binding is a server record: the device learns of it at its next sync and re-stages then, and content for runs it no longer serves is evicted only after confirmed receipt plus an integrity check — never on the strength of an attempted upload. Until it syncs it continues its pinned runs, which is correct.`,
    )
  }

  function retire(device: Device): void {
    commit(
      () => {
        setDevices((current) =>
          current.map((d) => (d.id === device.id ? { ...d, state: 'retired' } : d)),
        )
        setCommands((current) => [
          ...current,
          {
            id: `CMD-RET-${device.id}`,
            deviceId: device.id,
            kind: 'retire',
            state: COMMAND_STATE_ON_CREATION,
            raisedAt: '2026-08-19 14:20 tenant time',
            note: 'Created. Not delivered, not downloaded, not applied — this storyboard reaches no device, and the command below shows its true state.',
          },
        ])
      },
      `${device.id} is retired on this workspace's record, and a command has been CREATED for it — nothing more. Its ${device.pendingCaptures} pending captures are unaffected by the retirement and are not recorded anywhere until they arrive.`,
    )
  }

  function markLost(device: Device): void {
    commit(
      () => {
        setDevices((current) =>
          current.map((d) => (d.id === device.id ? { ...d, state: 'reported_lost' } : d)),
        )
        setCommands((current) => [
          ...current,
          {
            id: `CMD-SUS-${device.id}`,
            deviceId: device.id,
            kind: 'suspension-on-lost-report',
            state: COMMAND_STATE_ON_CREATION,
            raisedAt: '2026-08-19 14:22 tenant time',
            note: 'A suspension-class command, created by the lost report. At the device’s next contact it would refuse new work and preserve all local data. If the device never contacts the platform, this stays here with its age and is never shown as applied.',
          },
        ])
      },
      LOST_REPORT_CONFIRMATION,
    )
  }

  function requestWipe(device: Device): void {
    commit(
      () =>
        setWipeRequests((current) => [
          ...current,
          {
            id: `REQ-WIPE-${device.id}`,
            deviceId: device.id,
            raisedAt: '2026-08-19 14:23 tenant time',
            requestedBy: roleName,
            approvalRoute:
              'The platform console’s approval queue, as a critical-class request with its rationale and proposer. A root approver acts on it there.',
            note: 'A request record. It reaches no device.',
          },
        ]),
      WIPE_REQUEST_CONFIRMATION,
    )
  }

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: (
      <>
        <span className="font-medium">{row.control}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
      </>
    ),
    admin: <span className="font-medium">{STATUS_LABEL[row.status.TENANT_ADMIN]}</span>,
    supervisor: <span className="font-medium">{STATUS_LABEL[row.status.SUPERVISOR]}</span>,
    quality: <span className="font-medium">{STATUS_LABEL[row.status.QUALITY_MANAGER]}</span>,
    auditor: <span className="font-medium">{STATUS_LABEL[row.status.READONLY_AUDITOR]}</span>,
    worker: <span className="font-medium">{STATUS_LABEL[row.status.WORKER]}</span>,
    provenance:
      row.provenance === 'quoted-from-source'
        ? 'Quoted from a source row'
        : 'DERIVED from silence — no source row states it',
    rendering: (
      <>
        <span>{row.rendering}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.effect}</span>
      </>
    ),
  }))

  const scenarioControls = (
    <section
      aria-label="Storyboard scenario controls"
      className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Reviewer controls — not part of the product
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-6">
        <Select
          label="Screen state"
          value={stateId}
          options={SCREEN_STATE_OPTIONS}
          onChange={(value) => {
            const next = APPLICABLE_SCREEN_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setStateId(next))
          }}
        />
        <Select
          label="Tenant state"
          value={tenantState}
          options={TENANT_STATE_OPTIONS}
          onChange={(value) => {
            const next = TENANT_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setTenantState(next))
          }}
        />
        <Checkbox
          label={`Feature flag ${TENANT_DEVICE_ENROLMENT_FLAG}`}
          checked={flagEnabled}
          onChange={(next) => changeScenario(() => setFlagEnabled(next))}
        />
        <Checkbox
          label="Simulate an audit-write failure on the next action"
          checked={auditWillFail}
          onChange={(next) => changeScenario(() => setAuditWillFail(next))}
        />
      </div>
      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The feature flag above is the real one, named rather than silent (D3), and it is read by the
        shared access evaluator&rsquo;s own feature stage — so switching it off refuses every device
        control through the same nine ordered stages as any other refusal, rather than by a
        conditional drawn around the controls.
      </p>
    </section>
  )

  return (
    <HubShell
      screen={DEVICE_SCREEN}
      role={role}
      onRoleChange={changeRole}
      tenantState={tenantState}
    >
      <>
        <div
          role="note"
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-ink-muted)]"
        >
          <p className="max-w-prose">
            <span className="font-medium text-[var(--color-ink)]">
              This screen claims no module, and is not in the module rail.{' '}
            </span>
            Every other Hub route wraps the shell around a module definition — its identifier, its
            screen annotation and its place in the rail. This screen group has none of those: it is
            uncatalogued, and the one Hub module the workflow catalogue attributes device enrolment
            to has a card saying the Hub shows the tenant its own position read-only and nothing
            more. Handing the shell a module here would print that module&rsquo;s header over a
            device screen and mint exactly the ownership its card refuses (D5). So it wraps the
            shell in its UNCATALOGUED-SCREEN mode instead: the shell&rsquo;s own header,
            breadcrumb, persona switcher, banner region and disclosure, over a route that names no
            module id anywhere and takes no place in the rail. That disputed attribution is
            recorded in full on the screen it belongs to.
          </p>
        </div>

        {scenarioControls}

            <section aria-label="Screen state" className="mt-6">
              <h2 className="text-lg font-semibold">Screen state</h2>
              <p className="mt-1 text-sm font-medium">
                {definition.id} — {definition.name}
              </p>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                {definition.contract}
              </p>
              <div className="mt-3">
                {stateTreatment(stateId, viewDecision, roleName, commands)}
              </div>
            </section>

            {!flagEnabled ? (
              <section aria-label="Feature flag off" className="mt-6">
                <h2 className="text-lg font-semibold">
                  Tenant device enrolment is switched off
                </h2>
                <div className="mt-3">
                  <Banner
                    tone="attention"
                    heading={`${TENANT_DEVICE_ENROLMENT_FLAG} is off`}
                    body="Every device control is ABSENT rather than disabled while this flag is off: the whole feature is withheld, not individual buttons, and a disabled inventory would imply the records exist and are simply out of reach. The refusal comes from the shared access evaluator's feature stage, not from a conditional wrapped around the controls."
                  />
                </div>
                <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {OPEN_DECISION_ON_OWNERSHIP}
                </p>
              </section>
            ) : null}

            {permitsRead(viewDecision) ? (
              <>
                <section aria-label="Device inventory" className="mt-6">
                  <h2 className="text-lg font-semibold">Device inventory</h2>
                  {stateId === 'STATE-02' ? (
                    <div className="mt-3">
                      <ScreenStateBoundary
                        state="STATE-02"
                        surface="SURF-DOH"
                        detail={{ objectLabel: 'this workspace’s device records' }}
                      />
                      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
                        A skeleton of the inventory, never an empty one and never a row of noughts.
                        &ldquo;No devices&rdquo; and &ldquo;the devices have not arrived&rdquo; are
                        different claims, and only one of them is true here.
                      </p>
                    </div>
                  ) : readFailed ? (
                    <div className="mt-3">
                      <ScreenStateBoundary
                        state="STATE-12"
                        surface="SURF-DOH"
                        detail={{
                          failureWhat: 'The read of this workspace’s device records',
                          wasWritten: false,
                          nextStep:
                            'Nothing was written. Every write control below is disabled rather than queued while this stands, so nothing is waiting to be sent and no command was created that a device might one day receive.',
                        }}
                      />
                    </div>
                  ) : visibleDevices.length === 0 ? (
                    <div className="mt-3">
                      <ScreenStateBoundary
                        state="STATE-01"
                        surface="SURF-DOH"
                        detail={{
                          objectLabel: 'an enrolled device',
                          whatCreatesIt:
                            'Enrolling one below: a device identifier, a mode fixed at enrollment, a Site and Area binding, and an application version at or above the floor.',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 space-y-5">
                      {visibleDevices.map((device) => (
                        <div
                          key={device.id}
                          className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
                          data-device={device.id}
                        >
                          <p className="font-medium">
                            {device.id} —{' '}
                            <span className="font-normal">{DEVICE_MODE_LABEL[device.mode]}</span>
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                            {device.platform} · bound to {siteLabel(device.siteId)} /{' '}
                            {areaLabel(device.areaId)} · enrolled {device.enrolledOn} · application
                            version {device.appVersion} against a floor of {APP_VERSION_FLOOR} ·
                            last seen {device.lastSeen}
                          </p>
                          <p className="mt-2 text-sm">
                            <StatusPill
                              tone={SYNC_TONE[device.syncHealth]}
                              icon="●"
                              label={`sync ${device.syncHealth}`}
                            />{' '}
                            <StatusPill
                              tone={STORAGE_TONE[device.storagePressure]}
                              icon="▣"
                              label={`storage ${device.storagePressure}`}
                            />{' '}
                            <StatusPill tone="neutral" icon="◆" label={device.state} />
                          </p>
                          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
                            {DEVICE_STATE_LABEL[device.state]}
                          </p>
                          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                            {device.pendingCaptures} captures are still on this device and have not
                            reached the server. They are NOT recorded anywhere until they arrive,
                            and nothing on this screen presents them as recorded.
                            {device.state === 'enrolled' ? ` ${NOT_READY_COPY}` : ''}
                          </p>

                          <div className="mt-4 flex flex-wrap items-end gap-4">
                            {permitsAction(reassignDecision) ? (
                              <>
                                <Select
                                  label={`Reassign ${device.id} to`}
                                  value={reassignTo[device.id] ?? device.areaId}
                                  options={BINDABLE_AREAS.map((a) => ({
                                    value: a.id,
                                    label: a.name,
                                  }))}
                                  onChange={(value) =>
                                    changeScenario(() =>
                                      setReassignTo((current) => ({
                                        ...current,
                                        [device.id]: value,
                                      })),
                                    )
                                  }
                                />
                                {(() => {
                                  const gate = gateReason()
                                  const reason =
                                    gate ??
                                    (device.runInFlight !== null
                                      ? `A run is in flight on this device — ${device.runInFlight}. Reassignment is refused while one is, because a run finishes on the package it started on. Repeat it after the shift.`
                                      : (reassignTo[device.id] ?? device.areaId) === device.areaId
                                        ? 'Choose a different Area. Reassigning a device to the Area it already serves would write a binding change that changes nothing.'
                                        : null)
                                  return reason === null ? (
                                    <Button variant="secondary" onClick={() => reassign(device)}>
                                      Reassign {device.id}
                                    </Button>
                                  ) : (
                                    <Button disabledReason={reason}>Reassign {device.id}</Button>
                                  )
                                })()}
                              </>
                            ) : (
                              <ProhibitionNotice
                                rendering={{
                                  kind: 'absent',
                                  note: `No reassignment control is drawn for the ${roleName}: device policy sits with the Tenant Admin, and reassignment by a Supervisor is refused by name.`,
                                }}
                              />
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap items-start gap-4">
                            {permitsAction(retireDecision) ? (
                              (() => {
                                const reason =
                                  gateReason() ??
                                  (device.state === 'retired'
                                    ? 'This device is already retired on this workspace’s record. The source defines no un-retire control, and none is drawn.'
                                    : null)
                                return reason === null ? (
                                  <Button variant="secondary" onClick={() => retire(device)}>
                                    Retire {device.id}
                                  </Button>
                                ) : (
                                  <Button disabledReason={reason}>Retire {device.id}</Button>
                                )
                              })()
                            ) : (
                              <ProhibitionNotice
                                rendering={{
                                  kind: 'absent',
                                  note: `No retire control is drawn for the ${roleName}.`,
                                }}
                              />
                            )}

                            {permitsAction(lostDecision) ? (
                              (() => {
                                const reason =
                                  gateReason() ??
                                  (device.state === 'reported_lost'
                                    ? 'This device is already reported lost, and a suspension-class command exists for it. A superseding command lifts a suspension, and that is issued on the platform console rather than here.'
                                    : null)
                                return reason === null ? (
                                  <Button variant="secondary" onClick={() => markLost(device)}>
                                    Mark {device.id} lost
                                  </Button>
                                ) : (
                                  <Button disabledReason={reason}>Mark {device.id} lost</Button>
                                )
                              })()
                            ) : (
                              <ProhibitionNotice
                                rendering={{
                                  kind: 'absent',
                                  note: `No lost-report control is drawn for the ${roleName}: a Supervisor or Worker cannot mark a device lost.`,
                                }}
                              />
                            )}
                          </div>

                          <div className="mt-4">
                            {permitsAction(wipeRequestDecision) ? (
                              <>
                                <div className="mb-2">
                                  <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
                                </div>
                                {(() => {
                                  const reason = gateReason()
                                  return reason === null ? (
                                    <Button variant="secondary" onClick={() => requestWipe(device)}>
                                      Request a wipe of {device.id}
                                    </Button>
                                  ) : (
                                    <Button disabledReason={reason}>
                                      Request a wipe of {device.id}
                                    </Button>
                                  )
                                })()}
                                <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                                  {WIPE_REQUEST_CONFIRMATION}
                                </p>
                              </>
                            ) : (
                              <ProhibitionNotice
                                rendering={{
                                  kind: 'absent',
                                  note: `No wipe-request control is drawn for the ${roleName}.`,
                                }}
                              />
                            )}
                            <div className="mt-3">
                              <ProhibitionNotice
                                rendering={{
                                  kind: 'absent',
                                  note: 'No control executes a wipe here, for any tenant role. Wipe authority stays on the platform console as a critical-class action under root approval, and even there the erasure runs only after a final sync attempt.',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                    Panel fields are exactly the ones the screen&rsquo;s one source line names:
                    device identifier, platform, device mode of Shared or Personal set at
                    enrollment, location binding, application version against the floor, enrollment
                    date, last seen, sync health, storage-pressure indicator and the retire control.
                    Nothing is drawn beside them that the line does not name. No column, chip or
                    figure here measures the person who used the tablet: pending captures are a
                    queue depth on a device, and there is no per-person cut of anything on this
                    screen in any state.
                  </p>
                </section>

                <section aria-label="Enrol a device" className="mt-6">
                  <h2 className="text-lg font-semibold">Enrol a device</h2>
                  {permitsAction(enrolDecision) ? (
                    <>
                      <div className="mt-3 flex flex-wrap items-start gap-6">
                        <Field
                          label="Device identifier"
                          {...(enrolValidation !== null && newId.trim() === ''
                            ? { error: enrolValidation }
                            : {})}
                        >
                          <input
                            type="text"
                            value={newId}
                            onChange={(e) => changeScenario(() => setNewId(e.target.value))}
                            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                          />
                        </Field>
                        <Select
                          label="Platform"
                          value={newPlatform}
                          options={DEVICE_PLATFORMS.map((p) => ({ value: p, label: p }))}
                          onChange={(value) => {
                            const next = DEVICE_PLATFORMS.find((p) => p === value)
                            if (next !== undefined) changeScenario(() => setNewPlatform(next))
                          }}
                        />
                        <Select
                          label="Device mode — fixed at enrollment"
                          value={newMode}
                          options={DEVICE_MODES.map((m) => ({
                            value: m,
                            label: DEVICE_MODE_LABEL[m],
                          }))}
                          onChange={(value) => {
                            const next = DEVICE_MODES.find((m) => m === value)
                            if (next !== undefined) changeScenario(() => setNewMode(next))
                          }}
                        />
                        <Select
                          label="Location binding"
                          value={newAreaId}
                          options={BINDABLE_AREAS.map((a) => ({
                            value: a.id,
                            label: `${siteLabel(a.siteId)} / ${a.name}`,
                          }))}
                          onChange={(value) => changeScenario(() => setNewAreaId(value))}
                        />
                        <Field
                          label={`Application version — floor ${APP_VERSION_FLOOR}`}
                          description="Platform policy, read here and set on the console. A device below the floor is refused with the floor stated, and never enrols at all."
                        >
                          <input
                            type="text"
                            value={newVersion}
                            onChange={(e) => changeScenario(() => setNewVersion(e.target.value))}
                            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                          />
                        </Field>
                      </div>
                      {enrolValidation !== null ? (
                        <div className="mt-3">
                          <ScreenStateBoundary
                            state="STATE-04"
                            surface="SURF-DOH"
                            detail={{
                              fieldLabel: 'Enrollment',
                              rule: enrolValidation,
                              permittedFormat: `A unique device identifier, a Site and Area binding, and an application version at or above ${APP_VERSION_FLOOR} written as three dot-separated numbers.`,
                            }}
                          />
                        </div>
                      ) : null}
                      <div className="mt-3">
                        {(() => {
                          const reason = gateReason() ?? enrolValidation
                          return reason === null ? (
                            <Button onClick={enrol}>Enrol this device</Button>
                          ) : (
                            <Button disabledReason={reason}>Enrol this device</Button>
                          )
                        })()}
                      </div>
                      <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                        The mode is fixed at enrollment: it is chosen once, here, and no control
                        anywhere changes it afterwards. The application-version floor is platform
                        policy read from the console, not a tenant setting, and no override control
                        for it exists on any surface for any role. A device below the floor is not
                        enrolled at all, so it never holds any of this workspace&rsquo;s data.
                      </p>
                    </>
                  ) : (
                    <ProhibitionNotice
                      rendering={{
                        kind: 'absent',
                        note: !flagEnabled
                          ? `No enrolment control is drawn while ${TENANT_DEVICE_ENROLMENT_FLAG} is off. The whole feature is withheld rather than individual controls disabled, because the open decision behind the flag is about whether the tenant enrols at all.`
                          : `No enrolment control is drawn for the ${roleName}: a Supervisor, Quality Manager, Read-only Auditor or Worker attempting enrollment is refused by name, and a support account cannot enrol either — no write capability exists in a normal support session.`,
                      }}
                    />
                  )}
                </section>

                <section aria-label="Commands and requests" className="mt-6">
                  <h2 className="text-lg font-semibold">Commands and requests raised here</h2>
                  <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                    Every one renders its TRUE state and never a nicer one. Nothing here has been
                    delivered, downloaded, validated or applied, because nothing here reaches a
                    device: this storyboard has no fleet, and in the built platform a command
                    reaches a tablet only at that tablet&rsquo;s next contact.
                  </p>
                  {commands.length === 0 && wipeRequests.length === 0 ? (
                    <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
                      None raised in this storyboard run yet.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {commands.map((command) => (
                        <div key={command.id} className="text-sm" data-command={command.id}>
                          <p>
                            <span className="font-medium">{command.id}</span> — {command.kind} on{' '}
                            {command.deviceId}, raised {command.raisedAt}{' '}
                            <CommandStateBadge state={command.state} />
                          </p>
                          <p className="text-xs text-[var(--color-ink-subtle)]">{command.note}</p>
                        </div>
                      ))}
                      {wipeRequests.map((request) => (
                        <div key={request.id} className="text-sm" data-request={request.id}>
                          <p>
                            <span className="font-medium">{request.id}</span> — a wipe REQUEST on{' '}
                            {request.deviceId}, raised {request.raisedAt} by {request.requestedBy}.
                          </p>
                          <p className="text-xs text-[var(--color-ink-subtle)]">
                            {request.approvalRoute} {request.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
                    Audit is written in the same transaction as the action. If the audit write
                    fails, the action fails with it and this screen says the action did not happen:
                    no device record changes, no command is created and no request is raised.
                  </p>
                  <LiveRegion>
                    {outcome !== null ? (
                      <p className="mt-2 max-w-prose rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-ink)]">
                        {outcome}
                      </p>
                    ) : null}
                  </LiveRegion>
                </section>
              </>
            ) : (
              <section aria-label="Permission denied" className="mt-6">
                <h2 className="text-lg font-semibold">
                  {flagEnabled
                    ? `The device inventory is not offered to the ${roleName}`
                    : 'The device inventory is withheld while the feature flag is off'}
                </h2>
                <div className="mt-3">
                  <ScreenStateBoundary
                    state="STATE-05"
                    surface="SURF-DOH"
                    detail={{ decision: viewDecision }}
                  />
                </div>
                <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {flagEnabled
                    ? 'Every device row the frozen source carries names the Tenant Admin and says nothing about the other four roles. This build withholds on that silence rather than granting on it, and marks the derivation as derived in the control table below rather than presenting it as a source statement.'
                    : `${TENANT_DEVICE_ENROLMENT_FLAG} is off, so the whole feature is withheld rather than individual controls disabled. The refusal comes from the shared evaluator's feature stage.`}
                </p>
                <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                  This refusal is {viewDecision.outcome}, stage {viewDecision.stage}. Nine
                  permission tokens govern it, not six, and it carries an explicit reason rather
                  than a blank cell.
                </p>
              </section>
            )}

            <section aria-label="What the platform console owns" className="mt-6">
              <h2 className="text-lg font-semibold">What the platform console owns</h2>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                Four device states this surface never sets, named so a reader is not left to assume
                the Hub can reach them.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
                {CONSOLE_OWNED_DEVICE_STATES.map((s) => (
                  <li key={s.name}>
                    <span className="font-medium text-[var(--color-ink)]">{s.name}</span> — {s.why}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Control table" className="mt-6">
              <h2 className="text-lg font-semibold">What each of the five tenant roles sees</h2>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
                NO FIVE-ROLE PERMISSION MATRIX FOR DEVICES EXISTS ANYWHERE in the frozen source.
                This table is therefore part quoted and part derived, and every row says which it
                is. Where the source names a role, the cell is quoted. Where it is silent, this
                build WITHHOLDS rather than grants — a silence is not a permission — and marks the
                cell as derived so a reader never mistakes it for a source statement.
              </p>
              <div className="mt-3">
                <Table
                  caption="Device controls by tenant role, with the provenance of every row"
                  columns={[
                    { key: 'control', header: 'Control' },
                    { key: 'admin', header: 'Tenant Admin' },
                    { key: 'supervisor', header: 'Supervisor' },
                    { key: 'quality', header: 'Quality Manager' },
                    { key: 'auditor', header: 'Read-only Auditor' },
                    { key: 'worker', header: 'Worker' },
                    { key: 'provenance', header: 'Provenance' },
                    { key: 'rendering', header: 'How it renders here' },
                  ]}
                  rows={matrixRows}
                  emptyState={{
                    title: 'No device control is defined.',
                    whatCreatesIt: 'The frozen source names the controls this screen carries.',
                  }}
                />
              </div>
            </section>

            <section aria-label="Absent by rule" className="mt-6">
              <h2 className="text-lg font-semibold">Absent by rule</h2>
              <div className="mt-2 space-y-3">
                {ABSENT_BY_RULE.map((item) => (
                  <div key={item.label} className="text-sm text-[var(--color-ink-muted)]">
                    <p className="font-medium text-[var(--color-ink)]">{item.label}</p>
                    <ProhibitionNotice rendering={{ kind: 'absent', note: item.note }} />
                  </div>
                ))}
              </div>
            </section>

            <section aria-label="States that never render here" className="mt-6">
              <h2 className="text-lg font-semibold">States that never render here</h2>
              <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
                {INAPPLICABLE_SCREEN_STATES.map((s) => (
                  <li key={s.id}>
                    <span className="font-medium text-[var(--color-ink)]">{s.id}</span> — {s.why}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Decisions rendered on this screen" className="mt-6">
              <h2 className="text-lg font-semibold">Decisions this screen renders</h2>
              <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
                {DECISIONS_ON_SCREEN.map((d) => (
                  <li key={d.ref}>
                    <span className="font-medium text-[var(--color-ink)]">{d.ref}</span> —{' '}
                    {d.statement}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Unspecified in source" className="mt-6">
              <h2 className="text-lg font-semibold">Unspecified in source</h2>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                This screen has more of these than any other in the slice, because it is built from
                one source line and a storyboard rather than from a module card. Named rather than
                invented.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
                {UNSPECIFIED_IN_SOURCE.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
                {LOST_REPORT_GATE_CONCERN}
              </p>
            </section>

            <section aria-label="Unresolved in source" className="mt-6">
              <h2 className="text-lg font-semibold">Unresolved in source</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
                {UNRESOLVED_IN_SOURCE.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

      </>
    </HubShell>
  )
}

function stateTreatment(
  stateId: ApplicableScreenStateId,
  viewDecision: PermissionDecision,
  roleName: string,
  commands: readonly DeviceCommandRecord[],
) {
  switch (stateId) {
    case 'STATE-01':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The empty rendering is the inventory&rsquo;s own, below: a workspace with no device
          enrolled yet, naming what would appear and what creates it.
        </p>
      )
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-DOH"
          detail={{ objectLabel: 'this workspace’s device records' }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The inventory and the enrollment panel below, each carrying the moment it was true.
        </p>
      )
    case 'STATE-04':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The validation rendering belongs to the enrollment panel below, where the broken rule is
          stated in words and the permitted format is given — including the application-version
          floor, which is the one refusal the source names by acceptance criterion.
        </p>
      )
    case 'STATE-05':
      if (permitsRead(viewDecision)) {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} carries the read, so no refusal renders for this view. Select another persona
            — or switch the feature flag off — to meet the two different refusals this screen has.
          </p>
        )
      }
      return (
        <ScreenStateBoundary
          state="STATE-05"
          surface="SURF-DOH"
          detail={{ decision: viewDecision }}
        />
      )
    case 'STATE-06':
      return (
        <ScreenStateBoundary
          state="STATE-06"
          surface="SURF-DOH"
          detail={{
            readOnlyCause:
              'The application-version floor and the device policy layer are platform-owned and read-only here. Nothing on this screen sets a floor, a policy or a trust window; the tenant enrols within that policy rather than defining it.',
          }}
        />
      )
    case 'STATE-08':
      return (
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-DOH"
          detail={{
            asOfLabel: 'as of the last records loaded before the connection dropped',
            originLabel:
              'the last loaded device records, degraded rather than blanked, with every write control disabled rather than queued',
          }}
        />
      )
    case 'STATE-09': {
      const latest = commands[commands.length - 1]
      return (
        <>
          <ScreenStateBoundary
            state="STATE-09"
            surface="SURF-DOH"
            detail={{ commandState: latest?.state ?? 'created' }}
          />
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            This is the state this screen exists to render honestly. A retire or a lost report
            creates a command and nothing more. It is not delivered, not downloaded, not validated
            and not applied — and a device that never reconnects leaves it here forever, which the
            platform&rsquo;s honest position is to display rather than to report as complete.
            Nothing on this screen ever says a device was wiped.
          </p>
        </>
      )
    }
    case 'STATE-12':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The failure rendering is the inventory&rsquo;s own, below: it names the read as what
          failed and states that nothing was written.
        </p>
      )
    case 'STATE-13':
      return (
        <ScreenStateBoundary
          state="STATE-13"
          surface="SURF-DOH"
          detail={{
            recoveryProgress:
              'Reconnected. The tenant state is being refetched BEFORE any write control is re-enabled, so a device write is never offered against a suspension state that may have changed while the connection was down.',
          }}
        />
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state on the device screen: ${String(exhaustive)}`)
    }
  }
}
