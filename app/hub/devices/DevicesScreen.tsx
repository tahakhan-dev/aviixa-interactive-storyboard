'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AppShell,
  ConfirmDialog,
  DataTable,
  DetailDrawer,
  FieldShell,
  Form,
  RequireSession,
  SelectField,
  StatusPill,
  TextField,
  Toaster,
  bg,
  borderColor,
  describedByFor,
  radiusClass,
  textColor,
  useAccessContext,
  useFieldBinding,
  useRepository,
  useRepositoryQuery,
  useStore,
  type DataTableColumn,
  type ProductSession,
  type StatusToken,
  type ToastItem,
} from '@/ui/product'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import { deny } from '@/policy/decision'
import { scopeReferenceMessage } from '@/data/scope-reference'
import { Device } from '@/data/schemas/org'
import type {
  AccessContext,
  EnrollDeviceResult,
  ReassignDeviceResult,
  RowOf,
  WriteResult,
} from '@/data/repository'

/**
 * `SCR-DOH-DEVICES` — Task 5 (unit-02). This screen still claims no module
 * and appears in neither screen catalogue. Reconfirmed against the CURRENT
 * `registries/generated/modules.json` before writing this file, not carried
 * over as an assumption: the only module id the device workflows' own
 * headers name (`WF-DVC-001`/`WF-DVC-002`, both self-labelled "Module
 * `MOD-DOH-13`") resolves to a DIFFERENT, unrelated module — "Tenant View
 * of Platform Administration", route `/hub/tenant-view-of-platform-
 * administration/`, whose own purpose line reads "a read-only view of
 * platform administration affecting it" (`modules.json`, `MOD-DOH-13`) and
 * whose own acceptance criterion elsewhere in the source states it renders
 * only "read-only rendering of tier, usage and suspension status" — nothing
 * about a tenant's own device fleet. The attribution is the source's own
 * error, disclosed rather than silently followed: this route is keyed on
 * its own slug, appears in no module's nav rail (`AppShell`'s own
 * `dohModulesReachedBy` never lists it, because no module row names it),
 * and `Task 8` (this unit's registry-reconciliation task) is the one that
 * decides what — if anything — to do about the source's own mislabel.
 *
 * Replaces the previous 1,202-line document-style body (`./fixtures.ts`,
 * left in place, untouched and now unimported, matching every sibling
 * screen's own disposition for its outgoing fixture file) with a real
 * Device register over the repository: `useRepository()`/
 * `useAccessContext()`/`useRepositoryQuery()`, the same runtime pattern
 * `WorkerLifecycleScreen.tsx`/`ShiftManagementScreen.tsx` establish.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ROLE-FLOOR RESEARCH — three write-shaped actions, three different
 * findings, none of them the generic `'hub'`-authority floor
 * (`TENANT_OPERATIONAL_WRITERS` — Tenant Admin, Supervisor, Quality
 * Manager). Read `repository.ts`'s own `ENROLL_DEVICE_REQUEST`/
 * `REASSIGN_DEVICE_REQUEST` comments for the full citations; summarised
 * here:
 * ─────────────────────────────────────────────────────────────────────────
 *  - ENROLL a device (`WF-DVC-001`) — Tenant-Admin-only. That workflow's
 *    own Denied path (L53091): "A Supervisor, Quality Manager, Read-only
 *    Auditor, or Worker attempting enrollment is refused." Independently
 *    corroborated by the Super Admin console's own `MOD-SA-13` permission
 *    matrix, "Enroll a device" row (L45543): Tenant Admin `Allowed`, every
 *    other tenant role `Explicitly prohibited`. Two independent source
 *    locations agree.
 *  - REASSIGN a device (`WF-DVC-002`) — Tenant-Admin-only. That workflow's
 *    own Denied path (L53124), stated with no ambiguity at all: "Reassignment
 *    by a Supervisor is refused; device policy sits with the Tenant Admin."
 *  - SUSPEND (de-authorise) a device — NOT BUILT ON THIS SCREEN, for ANY
 *    tenant role, Tenant Admin included. This is a deviation from this
 *    task's own brief, which assumed the generic `transition('devices', id,
 *    'de-authorised', ctx)` covers it. Two independent facts, both found
 *    live rather than assumed, together make that assumption wrong:
 *      1) `repository.ts#stateMachineLegality` registers a legality graph
 *         for exactly two collections — `captures` and `schedules` — and
 *         explicitly refuses every other collection rather than invent one
 *         (its own comment: "this function refuses rather than invent one").
 *         No graph is registered for `devices`, so `transition('devices',
 *         id, 'de-authorised', ctx)` would refuse EVERY caller, always,
 *         regardless of role — the same substitution Task 2 (unit-02) found
 *         for `shifts` and switched to `.update()` for.
 *      2) Even setting (1) aside, `WF-DVC-005` ("Suspending a device"),
 *         Surface: Super Admin platform console, Module `MOD-SA-13` — NOT
 *         the Delivery Operations Hub at all — states its own Denied path
 *         in full: "A Support account cannot suspend. A Tenant Admin
 *         cannot suspend a device from the Delivery Operations Hub at V1;
 *         enrollment is tenant-self-service but suspension and wipe
 *         authority stay on the console." (L53230.) `WF-DVC-006` (remote
 *         wipe, the workflow that actually reaches the `'de-authorised'`/
 *         `'wiped-and-de-authorised'` states) is Super Admin console only,
 *         critical-class, dual-authorised by the Root Super Admin — also
 *         not a Hub action for any tenant role.
 *    Building a `.update('devices', id, { status: 'de-authorised' }, ctx)`
 *    door here — even narrowed to Tenant Admin — would grant a capability
 *    the source explicitly, by name, denies the Tenant Admin from this
 *    surface. The correct fix is not a narrower floor; it is no door at
 *    all. This screen instead renders WHY no Suspend control exists, the
 *    same disclosure shape `WorkerLifecycleScreen.tsx`'s own header gives
 *    "Grant a clearance" and "Archive a worker" — except surfaced ON
 *    SCREEN here (not only in this comment), because a reader could
 *    otherwise reasonably expect a suspend control to exist beside Reassign
 *    and wonder why it does not. `de-authorised` and `wiped-and-de-
 *    authorised` remain real, schema-valid statuses this screen RENDERS
 *    (two of Bright Bikes's fourteen seeded devices already carry them —
 *    `DEV-BB-TAB-008`/`DEV-BB-TAB-012`) — this screen just never WRITES
 *    either one.
 *
 * `WF-DVC-002`'s own acceptance criteria (`AC-WF-DVC-002-01`, refuse mid-run
 * reassignment; `AC-WF-DVC-002-02`/`03`, package re-stage/eviction on
 * confirmed receipt) are NOT enforced here — the real `Device` schema
 * carries no in-flight-run or package-inventory field this collection's
 * authority can read (no Job/Run/package integration reaches `devices` at
 * this build's authority yet). A disclosed, real gap, not a silently
 * invented mechanic — matching `WorkerLifecycleScreen.tsx`'s own "NOT
 * CARRIED FORWARD as rendered mechanism" disclosures for infrastructure
 * this build does not have.
 *
 * No application-version floor is enforced at enrollment either: the real
 * schema layer (`schemas/org.ts#Device`, `@/domain/**`) carries no
 * app-version-floor value anywhere this build can read one from — the old
 * fixture's `APP_VERSION_FLOOR` constant was invented for the storyboard,
 * not sourced from a real collection, and this rebuild does not carry
 * invented platform policy forward as if it were real data.
 */

type DeviceRow = RowOf<'devices'>
type LocationRow = RowOf<'locations'>
type AreaRow = RowOf<'areas'>
type SiteRow = RowOf<'sites'>

const MODE_LABEL: Readonly<Record<DeviceRow['mode'], string>> = {
  shared: 'Shared',
  personal: 'Personal',
}

/**
 * Six values, the union of `schemas/org.ts#Device`'s own header comment
 * (L8464's "enrolled, active, retired, wiped and de-authorised" union L8483's
 * "enrolled, mode-changed, retired, de-authorised"). `de-authorised` and
 * `wiped-and-de-authorised` each carry their OWN tone — `blocked`, distinct
 * from `retired`'s `offline` — so neither ever collapses into a generic
 * "inactive" reading (Global Constraints' exact-state-vocabulary rule).
 */
const STATUS_LABEL: Readonly<Record<DeviceRow['status'], string>> = {
  enrolled: 'Enrolled',
  'mode-changed': 'Mode changed',
  active: 'Active',
  retired: 'Retired',
  'de-authorised': 'De-authorised',
  'wiped-and-de-authorised': 'Wiped and de-authorised',
}
const STATUS_TONE: Readonly<Record<DeviceRow['status'], StatusToken>> = {
  enrolled: 'info',
  'mode-changed': 'info',
  active: 'ok',
  retired: 'offline',
  'de-authorised': 'blocked',
  'wiped-and-de-authorised': 'blocked',
}

const STORAGE_LABEL: Readonly<Record<DeviceRow['storagePressure'], string>> = {
  ok: 'Ok',
  warning: 'Warning',
  critical: 'Critical',
}
const STORAGE_TONE: Readonly<Record<DeviceRow['storagePressure'], StatusToken>> = {
  ok: 'ok',
  warning: 'warn',
  critical: 'danger',
}

/**
 * No five-role permission matrix for the DEVICE SCREEN's view exists
 * anywhere in the frozen source (same silence the old fixture's own control
 * table already disclosed). This follows the same silence-default this
 * unit's other rebuilt screens already settled on
 * (`ShiftManagementScreen.tsx`/`LocationConfigurationScreen.tsx`'s own
 * `VIEW_REQUEST`): every non-Worker tenant role reads, Worker reaches no
 * Hub route at all (D11). Supervisor's own read access is independently
 * corroborated — `WF-DVC-001`/`WF-DVC-002` both name Supervisor as a
 * "Secondary" actor observing enrollment/reassignment even though excluded
 * from writing either.
 */
const VIEW_REQUEST: AccessRequest = {
  action: 'view-devices',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'],
  sourceRefs: ['L67861', 'WF-DVC-001', 'WF-DVC-002', 'repository.ts'],
}

/** Screen-level display gate for enrollment — matches `repository.ts`'s own `ENROLL_DEVICE_REQUEST` exactly. */
const ENROLL_WRITE_REQUEST: AccessRequest = {
  action: 'enroll-device',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['WF-DVC-001', 'L53091', 'L45543', 'MOD-SA-13', 'repository.ts'],
}
const ENROLL_DENIED_REASON =
  'Only the Tenant Admin may enroll a device — the device-enrollment workflow explicitly refuses a Supervisor, Quality Manager, Read-only Auditor or Worker attempting it, and a second, independent source location confirms the same floor: enrollment is tenant-self-service and Tenant-Admin-only.'

/** Screen-level display gate for reassignment — matches `repository.ts`'s own `REASSIGN_DEVICE_REQUEST` exactly. */
const REASSIGN_WRITE_REQUEST: AccessRequest = {
  action: 'reassign-device',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['WF-DVC-002', 'L53124', 'repository.ts'],
}
const REASSIGN_DENIED_REASON =
  'Only the Tenant Admin may reassign a device — the reassignment workflow states it plainly: device policy sits with the Tenant Admin, and reassignment by a Supervisor is refused.'

const SUSPEND_ABSENCE_NOTE =
  'No Suspend control is drawn here, for any tenant role — including the Tenant Admin. The device-suspension workflow states its own denied path in full: a Tenant Admin cannot suspend a device from the Delivery Operations Hub at this version; suspension and wipe authority stay on the platform console. A device already suspended or wiped by the platform still renders here — its status column shows De-authorised or Wiped and de-authorised distinctly from every other status — this screen just never writes either one.'

/**
 * §8.6.1 fixture adequacy: Bright Bikes carries 14 seeded Devices (this
 * task's own seed-volume check, see the report — 25 total across 14
 * tenants, ample and not thin). `pageSize={6}` gives three genuinely
 * distinct pages — 6, 6, 2 — the same first/middle/last-partial precedent
 * `WorkerLifecycleScreen.tsx`'s own `WORKERS_PAGE_SIZE` sets.
 */
const DEVICES_PAGE_SIZE = 6

const LIST_HREF = '/hub/devices/'

export function DevicesScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <DevicesGate session={session} />}
    </RequireSession>
  )
}

function DevicesGate({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  const viewGate = evaluateAccess(VIEW_REQUEST, ctx)
  if (viewGate.outcome !== 'allowed') {
    return (
      <AppShell surface="SURF-DOH" session={session} title="Devices" breadcrumbs={[{ label: 'Devices' }]}>
        <p data-control-id="devices-unavailable" className={`text-sm ${textColor('ink-muted')}`}>
          {viewGate.explanation}
        </p>
      </AppShell>
    )
  }
  if (ctx.identity.tenant === null) {
    return (
      <AppShell surface="SURF-DOH" session={session} title="Devices" breadcrumbs={[{ label: 'Devices' }]}>
        <p data-control-id="devices-no-tenant" className={`text-sm ${textColor('ink-muted')}`}>
          No live tenant is attached to this identity, so no device inventory can be shown.
        </p>
      </AppShell>
    )
  }
  return <DevicesBody session={session} ctx={ctx} tenantId={ctx.identity.tenant} />
}

function DevicesBody({
  session,
  ctx,
  tenantId,
}: {
  readonly session: ProductSession
  readonly ctx: AccessContext
  readonly tenantId: string
}) {
  const repository = useRepository()
  const store = useStore()
  const searchParams = useSearchParams()

  const devicesQuery = useRepositoryQuery((r, c) => r.list('devices', c))
  const sitesQuery = useRepositoryQuery((r, c) => r.list('sites', c))
  const areasQuery = useRepositoryQuery((r, c) => r.list('areas', c))
  const locationsQuery = useRepositoryQuery((r, c) => r.list('locations', c))

  const tenantSites = sitesQuery.all().filter((s) => s.tenantId === tenantId)
  const siteById = new Map<string, SiteRow>(tenantSites.map((s) => [s.id, s]))
  const tenantAreas = areasQuery.all().filter((a) => siteById.has(a.siteId))
  const areaById = new Map<string, AreaRow>(tenantAreas.map((a) => [a.id, a]))
  const tenantLocations = locationsQuery.all().filter((l) => areaById.has(l.areaId))
  const locationById = new Map<string, LocationRow>(tenantLocations.map((l) => [l.id, l]))

  /**
   * Task 6 (unit-02) cross-link: `WorkerLifecycleScreen.tsx`'s own Worker
   * detail links here with `?locations=<comma-separated ids>` — the
   * Locations within that Worker's scoped Areas (`Device.locationId` is the
   * real field a Device carries; a Device has no Area field of its own).
   * An empty or wholly-unknown id list is a real, honest outcome — the
   * Worker's scoped Areas hold no Location this tenant can read — and
   * renders as a correctly empty table rather than falling back to
   * unfiltered, which would silently widen what a filtered link promised.
   */
  const locationsFilterParam = searchParams.get('locations')
  const filterLocationIds =
    locationsFilterParam === null
      ? null
      : locationsFilterParam
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0)

  function locationLabel(id: string | null): string {
    if (id === null) return 'Unplaced — not yet bound to a Location'
    const location = locationById.get(id)
    if (location === undefined) return id
    const area = areaById.get(location.areaId)
    const site = area !== undefined ? siteById.get(area.siteId) : undefined
    return `${location.name} (${area?.name ?? location.areaId} / ${site?.name ?? area?.siteId ?? '—'})`
  }

  const activeLocationOptions = tenantLocations
    .filter((l) => l.status === 'active')
    .map((l) => ({ value: l.id, label: locationLabel(l.id) }))
  const locationOptionsWithUnplaced = [
    { value: '', label: 'Unplaced — not yet bound to a Location' },
    ...activeLocationOptions,
  ]

  const enrollWriteGate = evaluateAccess(ENROLL_WRITE_REQUEST, ctx)
  const canEnroll = enrollWriteGate.outcome === 'allowed'
  const reassignWriteGate = evaluateAccess(REASSIGN_WRITE_REQUEST, ctx)
  const canReassign = reassignWriteGate.outcome === 'allowed'

  const [enrollOpen, setEnrollOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<readonly ToastItem[]>([])
  const [reassignChoice, setReassignChoice] = useState<Record<string, string>>({})
  const [reassignTarget, setReassignTarget] = useState<{ readonly device: DeviceRow; readonly locationId: string | null } | null>(
    null,
  )
  const [reassignBusy, setReassignBusy] = useState(false)

  function pushToast(tone: StatusToken, label: string): void {
    setToasts((prev) => [...prev, { id: `${store.nextSequence()}`, tone, label }])
  }
  function dismissToast(id: string): void {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function openEnroll(): void {
    setPendingId(`DEV-${tenantId}-${store.nextSequence()}`)
    setEnrollOpen(true)
  }
  function closeEnroll(): void {
    setEnrollOpen(false)
    setPendingId(null)
  }

  /**
   * `enrollDevice`'s `'invalid-reference'` arm has no home in `Form`'s own
   * generic renderer — same translation idiom `WorkerLifecycleScreen.tsx`'s
   * own `toFormResult` uses for `recordQualification`'s equivalent extra arm.
   */
  function toFormResult(result: EnrollDeviceResult): WriteResult<unknown> {
    if (result.ok) return result
    if (result.kind === 'invalid-reference') {
      const explain = scopeReferenceMessage(result.problem)
      return {
        ok: false,
        kind: 'denied',
        decision: deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', explain, {
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
        }),
        reason: 'OBJECT_STATE_INVALID',
        explain,
      }
    }
    return result
  }

  async function onEnrollSubmit(value: DeviceRow): Promise<WriteResult<unknown>> {
    const outcome = await repository.enrollDevice(value, ctx)
    const formResult = toFormResult(outcome)
    if (outcome.ok) {
      pushToast('ok', `${outcome.row.id} was enrolled.`)
      closeEnroll()
    }
    return formResult
  }

  function requestReassign(device: DeviceRow): void {
    const choice = reassignChoice[device.id]
    const nextLocationId = choice === undefined || choice === '' ? null : choice
    setReassignTarget({ device, locationId: nextLocationId })
  }

  async function confirmReassign(): Promise<void> {
    if (reassignTarget === null) return
    setReassignBusy(true)
    const outcome: ReassignDeviceResult = await repository.reassignDevice(
      reassignTarget.device.id,
      reassignTarget.locationId,
      ctx,
    )
    setReassignBusy(false)
    const label = locationLabel(reassignTarget.locationId)
    setReassignTarget(null)
    if (outcome.ok) {
      pushToast('ok', `${reassignTarget.device.id} is now bound to ${label}.`)
    } else if (outcome.kind === 'invalid-reference') {
      pushToast('danger', scopeReferenceMessage(outcome.problem))
    } else {
      pushToast('danger', outcome.explain)
    }
  }

  const columns: readonly DataTableColumn<DeviceRow>[] = [
    {
      key: 'id',
      header: 'Device',
      sortValue: (d) => d.id,
      render: (d) => (
        <span data-control-id={`devices-row-${d.id}`} className={`font-medium ${textColor('ink')}`}>
          {d.id}
        </span>
      ),
    },
    { key: 'mode', header: 'Mode', render: (d) => MODE_LABEL[d.mode] },
    {
      key: 'location',
      header: 'Location',
      sortValue: (d) => locationLabel(d.locationId),
      render: (d) => locationLabel(d.locationId),
    },
    {
      key: 'enrolled',
      header: 'Enrolled by / at',
      sortValue: (d) => d.enrolledAt,
      render: (d) => (
        <span className="flex flex-col text-xs">
          <span className={textColor('ink')}>{d.enrolledBy}</span>
          <span className={textColor('ink-muted')}>{d.enrolledAt.slice(0, 10)}</span>
        </span>
      ),
    },
    {
      key: 'versions',
      header: 'App / policy version',
      render: (d) => (
        <span className="flex flex-col text-xs">
          <span className={textColor('ink')}>App {d.appVersion}</span>
          <span className={textColor('ink-muted')}>Policy {d.policyVersion}</span>
        </span>
      ),
    },
    {
      key: 'sync',
      header: 'Sync health',
      render: (d) => (
        <span data-control-id={`devices-sync-${d.id}`}>
          <StatusPill tone={d.syncHealthy ? 'ok' : 'warn'} label={d.syncHealthy ? 'Healthy' : 'Degraded'} />
        </span>
      ),
    },
    {
      key: 'storage',
      header: 'Storage pressure',
      render: (d) => (
        <span data-control-id={`devices-storage-${d.id}`}>
          <StatusPill tone={STORAGE_TONE[d.storagePressure]} label={STORAGE_LABEL[d.storagePressure]} />
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => (
        <span data-control-id={`devices-status-${d.id}-${d.status}`}>
          <StatusPill tone={STATUS_TONE[d.status]} label={STATUS_LABEL[d.status]} />
        </span>
      ),
    },
    {
      key: 'reassign',
      header: 'Reassign',
      render: (d) =>
        canReassign ? (
          <ReassignControl
            device={d}
            options={locationOptionsWithUnplaced}
            value={reassignChoice[d.id] ?? (d.locationId ?? '')}
            onChange={(v) => setReassignChoice((cur) => ({ ...cur, [d.id]: v }))}
            onRequest={() => requestReassign(d)}
          />
        ) : (
          <p className={`max-w-[16rem] text-xs ${textColor('ink-muted')}`}>{REASSIGN_DENIED_REASON}</p>
        ),
    },
  ]

  return (
    <AppShell
      surface="SURF-DOH"
      session={session}
      title="Devices"
      breadcrumbs={[{ label: 'Devices' }]}
      actions={<EnrollAction canEnroll={canEnroll} onOpen={openEnroll} />}
    >
      <section aria-labelledby="devices-heading" className="mt-6 flex flex-col gap-4">
        <h2 id="devices-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
          Device fleet
        </h2>
        {filterLocationIds !== null ? (
          <p data-control-id="devices-location-filter-banner" className={`text-sm ${textColor('ink-muted')}`}>
            {filterLocationIds.length === 0
              ? 'Filtered to a Worker’s scoped Areas, which name no Location this tenant can read.'
              : `Filtered to devices at Locations within a Worker's scoped Areas (${filterLocationIds.length} Location${filterLocationIds.length === 1 ? '' : 's'}).`}{' '}
            <Link
              href={LIST_HREF}
              data-control-id="devices-clear-location-filter"
              className={`underline ${textColor('ink')}`}
            >
              Clear filter
            </Link>
          </p>
        ) : null}
        <DataTable
          caption="Devices"
          query={
            filterLocationIds === null
              ? devicesQuery.where((d) => d.tenantId === tenantId)
              : devicesQuery.where((d) => d.tenantId === tenantId && d.locationId !== null && filterLocationIds.includes(d.locationId))
          }
          columns={columns}
          rowId={(d) => d.id}
          search={{
            placeholder: 'Search by device id',
            match: (d, q) => d.id.toLowerCase().includes(q.toLowerCase()),
          }}
          pageSize={DEVICES_PAGE_SIZE}
          emptyState={{
            title: 'No devices are enrolled yet.',
            whatCreatesIt: 'A Tenant Admin enrolls the first one from Enroll device.',
          }}
        />
      </section>

      <section
        aria-label="Suspending a device"
        className={`mt-6 ${radiusClass('lg')} border border-dashed ${borderColor('border-strong')} p-4`}
      >
        <h2 className={`text-sm font-semibold ${textColor('ink')}`}>Suspending or de-authorising a device</h2>
        <p className={`mt-1 max-w-prose text-sm ${textColor('ink-muted')}`}>{SUSPEND_ABSENCE_NOTE}</p>
      </section>

      <DetailDrawer open={enrollOpen} onClose={closeEnroll} title="Enroll a device">
        {enrollOpen && pendingId !== null ? (
          <Form
            key={pendingId}
            schema={Device}
            initial={{
              id: pendingId,
              tenantId,
              mode: 'shared',
              locationId: null,
              enrolledAt: new Date(store.clock.now()).toISOString(),
              enrolledBy: ctx.actorOfRecord ?? 'unknown',
              policyVersion: 'policy-2026.3',
              appVersion: '',
              lastSeenAt: null,
              lastHeartbeatAt: null,
              syncHealthy: false,
              clockSkewEventCount: 0,
              storagePressure: 'ok',
              pinnedPackageIds: [],
              status: 'enrolled',
            }}
            onSubmit={onEnrollSubmit}
            submitLabel="Enroll this device"
          >
            <TextField
              name="id"
              label="Device identifier"
              required
              hint="Free text, chosen by the enrolling Tenant Admin — the source's own happy path has Priya typing TAB-014."
            />
            <SelectField
              name="mode"
              label="Mode — fixed at enrollment"
              required
              options={[
                { value: 'shared', label: 'Shared' },
                { value: 'personal', label: 'Personal' },
              ]}
              hint="No control anywhere on this screen changes it later — the source states the mode is fixed at enrollment."
            />
            <LocationField
              name="locationId"
              label="Location"
              options={locationOptionsWithUnplaced}
              hint="An enrolled-but-unplaced device is real and schema-valid — bind it later from Reassign."
            />
            <TextField name="appVersion" label="Application version" required />
            <TextField name="policyVersion" label="Policy version" required />
          </Form>
        ) : null}
      </DetailDrawer>

      {reassignTarget !== null ? (
        <ConfirmDialog
          open
          controlId={`devices-reassign-confirm-${reassignTarget.device.id}`}
          title={`Reassign ${reassignTarget.device.id}`}
          affectedObjects={[{ id: reassignTarget.device.id, label: reassignTarget.device.id }]}
          resultingState={{
            subject: 'Location',
            from: locationLabel(reassignTarget.device.locationId),
            to: locationLabel(reassignTarget.locationId),
          }}
          confirmLabel="Reassign"
          busy={reassignBusy}
          onConfirm={() => void confirmReassign()}
          onCancel={() => setReassignTarget(null)}
        />
      ) : null}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  )
}

function EnrollAction({ canEnroll, onOpen }: { readonly canEnroll: boolean; readonly onOpen: () => void }) {
  const controlId = 'devices-enroll'
  if (canEnroll) {
    return (
      <button
        type="button"
        data-control-id={controlId}
        onClick={onOpen}
        className={`${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
      >
        Enroll device
      </button>
    )
  }
  return (
    <div className="flex max-w-xs flex-col items-end gap-1">
      <button
        type="button"
        disabled
        aria-describedby={`${controlId}-reason`}
        data-control-id={controlId}
        className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('sunken')} px-4 py-2 text-sm font-medium ${textColor('ink-subtle')}`}
      >
        Enroll device
      </button>
      <p id={`${controlId}-reason`} className={`text-right text-xs ${textColor('ink-muted')}`}>
        {ENROLL_DENIED_REASON}
      </p>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * The Reassign control — a per-row Location picker plus a request button,
 * gated per row by `canReassign` at the CALL site (the column's own
 * `render`), the same live/reason-disclosed split every write control in
 * this unit uses (`EnrollAction` above, `EditControl`/`ArchiveControl` in
 * `ShiftManagementScreen.tsx`). No visible `FieldShell` label is used here
 * (unlike the enroll form's own `LocationField`) — the column header
 * "Reassign" already names it, and an `aria-label` carries the same
 * information for assistive technology without repeating it visually in
 * every row of a dense table.
 * ────────────────────────────────────────────────────────────────────── */

function ReassignControl({
  device,
  options,
  value,
  onChange,
  onRequest,
}: {
  readonly device: DeviceRow
  readonly options: readonly { readonly value: string; readonly label: string }[]
  readonly value: string
  readonly onChange: (next: string) => void
  readonly onRequest: () => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label={`Reassign ${device.id} to`}
        data-control-id={`devices-reassign-select-${device.id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-2 py-1 text-xs ${textColor('ink')}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        data-control-id={`devices-reassign-${device.id}`}
        onClick={onRequest}
        className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-2 py-1 text-xs font-medium ${textColor('ink')}`}
      >
        Reassign
      </button>
    </div>
  )
}

/**
 * A nullable Location select — `SelectField` (`@/ui/product/fields`) binds
 * `string` only, and `Device.locationId` is `z.string().nullable()`
 * (`schemas/org.ts`). Built on the same `useFieldBinding`/`FieldShell` join
 * point every field in that directory uses, own markup — the same "own
 * layout" choice `WorkerLifecycleScreen.tsx`'s own `AreaMultiSelect`/
 * `DateFieldLocal` make for the identical reason (a nullable/multi-valued
 * field does not fit the single-`<select>` `SelectField` binds to
 * `string`).
 */
function LocationField({
  name,
  label,
  hint,
  options,
}: {
  readonly name: string
  readonly label: string
  readonly hint?: string
  readonly options: readonly { readonly value: string; readonly label: string }[]
}) {
  const bound = useFieldBinding<string | null>(name, undefined, undefined, undefined, null)
  const invalid = bound.error !== undefined
  const selected = bound.value ?? ''
  return (
    <FieldShell label={label} controlId={bound.controlId} hint={hint} error={bound.error}>
      <select
        id={bound.controlId}
        name={name}
        value={selected}
        onChange={(e) => bound.onChange(e.target.value === '' ? null : e.target.value)}
        aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
        aria-invalid={invalid ? 'true' : undefined}
        data-control-id={bound.controlId}
        className={`${radiusClass('md')} border ${invalid ? 'border-[var(--status-danger)]' : borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm ${textColor('ink')}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
