'use client'

import { useState } from 'react'
import { HubShell, type TenantRoleId } from '../HubShell'
import { dohModuleById } from '@/surfaces/doh/modules'
import { DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import {
  TENANT_STATES,
  writeAllowed,
  type TenantState,
  type WriteAction,
} from '@/surfaces/doh/tenant-state'
import { SeamNotice } from '@/ui/doh/SeamNotice'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState, type ScreenStateId } from '@/ui/screen-state'
import {
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
import { evaluateAccess } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import { roleById, type RoleId } from '@/domain/roles'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import {
  DOH_SITES,
  areaById,
  visibleAreaIds,
  visibleSiteIds,
} from '../location-configuration/fixtures'
import {
  ABSENT_BY_RULE,
  ACTING_STATUSES,
  ARCHIVAL_REFUSAL_NOTICE_INITIAL_STATE,
  ARCHIVAL_REFUSAL_NOTICE_STATES,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  DOH_SHIFTS,
  ESCALATION_KEY,
  PLATFORM_DEFAULT_DIGEST_TIME,
  READING_STATUSES,
  REGISTER_AS_OF,
  SHIFT_ANCHORS,
  SHIFT_CARDINALITY_MITIGATION,
  SHIFT_CARDINALITY_OPTIONS,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  areasWithNoBoundShift,
  crossesMidnight,
  digestTimeBoundFor,
  minutesFromMidnight,
  overlapConflict,
  rolesWithStatus,
  scopeLabelFor,
  selectableAreasFor,
  shiftTimezone,
  shiftsVisibleTo,
  type ControlStatus,
  type Shift,
  type ShiftControlId,
} from './fixtures'

/**
 * MOD-DOH-03 — Shift Management, `SCR-DOH-05`, storyboards SB-DOH-015 and
 * SCR-TEN-SHIFT-01.
 *
 * The tenant's working-time blocks, and the anchor three platform mechanics
 * resolve against: the Worker-Shift meter's window, the production date of a
 * run that crosses midnight, and on-shift escalation resolution.
 *
 * THE ONE RULE THAT SHAPES THIS FILE: a Shift has no timezone of its own. It
 * is not that no control writes one — it is that there is no field to write
 * to, on the Shift or on an Area, so every reference to a Shift's timezone
 * anywhere below resolves through `shiftTimezone(siteId)` and could not
 * resolve any other way. Change the parent Site in the editor and the
 * inherited value moves with it, because the value was never stored here.
 *
 * MOD-DOH-03 owns `OBJ-DOH-SHIFT` and nothing else. Sites and Areas are read
 * from the module that owns them and are never written here; a run is a
 * reference and never a record.
 */
const MODULE = dohModuleById('MOD-DOH-03')

const FIXTURE_TENANT = tenantId('TEN-ARDENFIELD')

/**
 * The Sites a Shift may name as its parent. Archived Sites are offered in the
 * register's own filter — the Shifts under a closed Site are still readable —
 * but not here: a working-time block on a closed facility is a block nobody
 * can work. The source states no rule either way, so this is a derived
 * clarification, and it is the same one `selectableAreasFor` already applies
 * one level down.
 */
const ACTIVE_PARENT_SITES = DOH_SITES.filter((s) => s.state === 'active')

/**
 * The evaluator context holds an ACTIVE tenant partition on purpose. Role and
 * scope are decided here; the tenant lifecycle gate is `writeAllowed` over
 * the one write-class table, called separately below. Folding the suspension
 * into the partition would refuse the READS too, and a hard-suspended tenant
 * is read-only, not blind.
 */
const FIXTURE_STATE = withTenant(
  emptyDomainState(scenarioRunId('DOH-MOD-03-STORYBOARD')),
  FIXTURE_TENANT,
  (partition) => ({
    ...partition,
    displayName: 'Ardenfield Manufacturing',
    lifecycleState: 'ACTIVE',
  }),
)

/** The nine screen states this module reaches. See NEVER_APPLIES for the rest. */
const APPLICABLE_STATES = [
  'STATE-01',
  'STATE-02',
  'STATE-03',
  'STATE-04',
  'STATE-05',
  'STATE-06',
  'STATE-08',
  'STATE-12',
  'STATE-13',
] as const satisfies readonly ScreenStateId[]

type ModuleStateId = (typeof APPLICABLE_STATES)[number]

const NEVER_APPLIES: readonly { readonly id: ScreenStateId; readonly why: string }[] = [
  {
    id: 'STATE-07',
    why: 'Offline is frontline-only. This is a web surface with no offline mode; a lost connection splits three ways instead (D7).',
  },
  {
    id: 'STATE-09',
    why: 'Queued belongs to a device command, and the per-Shift digest is not one. No control here reaches a device, and nothing on this surface queues a write.',
  },
  {
    id: 'STATE-10',
    why: 'No agent creates, edits, archives or proposes a Shift. The one agent that touches this module READS shift timing, and it renders on no screen in this slice.',
  },
  {
    id: 'STATE-11',
    why: 'The same reason: no agent writes here, so this module behaves identically with every model unavailable.',
  },
]

const MODULE_STATE_NOTE: Readonly<Record<ModuleStateId, string>> = {
  'STATE-01':
    'a Site that holds no Shift. Reachable from the Site filter above the register — the third Site was created last week, holds no Area, and therefore holds no working-time block either.',
  'STATE-02':
    'the register while it is being fetched: a skeleton of the eventual table, and never a zero-row grid, because an empty grid reads as "this workspace has no Shift" rather than "the rows have not arrived".',
  'STATE-03': 'the register, the editor beneath it, and the anchoring panel beneath that.',
  'STATE-04':
    'the heaviest state on this screen. A Shift whose times would overlap another Shift on an Area they share is refused with the rule stated and both Shifts named; a blank name and a block of no length are refused with what would be accepted stated beside them.',
  'STATE-05':
    'a persona meeting a control its role does not carry. Every write here belongs to the Tenant Admin alone, so select any other persona to see the refusal named rather than left as a blank space.',
  'STATE-06':
    'the whole module for the Read-only Auditor, and for every persona while the tenant state closes configuration writes. One banner, one cause.',
  'STATE-08':
    'the register served from the last load with a freshness marker and an as-of time, while the connection is down (D7).',
  'STATE-12':
    'a read that failed outright, naming what failed and whether anything was written. Every write control disables rather than queues.',
  'STATE-13':
    'reconnection. The tenant state is refetched BEFORE any write control is re-enabled, so a write is never re-offered against a suspension state that may have changed while the connection was down.',
}

/**
 * Why the whole module is read-only, per tenant state. A `Record` rather than
 * a conditional ladder: the compiler refuses a missing key, so a sixth tenant
 * state cannot arrive and silently name no cause at all. `null` means this
 * state is not read-only as a whole. `soft-suspended` is a deliberate `null`
 * and is the one to read twice: it closes SOME write classes in general, and
 * on this module it happens to close every one of them, because MOD-DOH-03
 * uses only `create-shift` and `edit-configuration` and soft suspension closes
 * both. It is still not given a module-wide banner, because the cause it would
 * name is a per-class refusal rather than a state of the screen, and every one
 * of the five controls already names that class where it binds. One banner one
 * cause cuts both ways: a banner asserting the whole screen is read-only would
 * be a second, coarser statement of five refusals that are already explained.
 */
const READ_ONLY_CAUSE: Readonly<Record<TenantState, string | null>> = {
  active: null,
  'soft-suspended': null,
  'hard-suspended':
    'Hard suspension holds this workspace read-only: only the enumerated completion pipeline stays open, and no configuration edit is in it. A Shift is configuration, so nothing here can be created, edited, bound or archived.',
  'compliance-suspended':
    'Compliance suspension blocks every login in this workspace, so no signed-in person remains to change a Shift.',
  archived:
    'The workspace is closed. The source states no open write class for a closed tenant, and the stricter interpretation applies in that silence.',
}

const STATUS_TONE: Readonly<Record<ControlStatus, StatusTone>> = {
  allowed: 'ok',
  'allowed-with-conditions': 'info',
  'read-only': 'stale',
  'explicitly-prohibited': 'blocked',
  'not-applicable': 'neutral',
  unavailable: 'neutral',
}

const SCREEN_STATE_OPTIONS = APPLICABLE_STATES.map((id) => ({
  value: id,
  label: `${id} — ${screenState(id).name}`,
}))

const TENANT_STATE_OPTIONS = TENANT_STATES.map((s) => ({ value: s, label: s }))

/** D7's own sentence for a Hub write meeting a lost connection. */
const CONNECTION_LOST_REASON =
  'The connection to this workspace’s own records is lost. The register above degrades to the last loaded rows with a freshness marker, and every write control here disables rather than queues — never queued, in any state, because a Shift accepted with no audit entry would be a configuration change nobody could account for (D7).'

export function ShiftManagementScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>('active')
  const [stateId, setStateId] = useState<ModuleStateId>('STATE-03')
  const [auditWillFail, setAuditWillFail] = useState(false)

  /** The LIVE register. Everything on this screen reads it — the table, the
   *  overlap validator, the unbound-Area panel — so a Shift created or
   *  re-bound here is visible to every answer the screen gives. */
  const [shifts, setShifts] = useState<readonly Shift[]>(DOH_SHIFTS)

  const [siteFilter, setSiteFilter] = useState<string>('all')
  const [pickedShiftId, setPickedShiftId] = useState<string | null>(null)

  /** Nullable overlays on the selected Shift. `null` means "unedited", so a
   *  different selection shows the record rather than the last draft. */
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [siteDraft, setSiteDraft] = useState<string | null>(null)
  const [startDraft, setStartDraft] = useState<string | null>(null)
  const [endDraft, setEndDraft] = useState<string | null>(null)
  const [areaDraft, setAreaDraft] = useState<readonly string[] | null>(null)
  const [digestDraft, setDigestDraft] = useState<string | null>(null)

  const [lastAction, setLastAction] = useState<string | null>(null)
  const [auditFailure, setAuditFailure] = useState<string | null>(null)
  const [archivalRefusal, setArchivalRefusal] = useState<Shift | null>(null)

  const roleName = roleById(role).name
  const definition = screenState(stateId)

  // D7: the three states a lost connection can leave this screen in. The
  // reviewer picks the screen state and the connection follows from it,
  // rather than the two drifting apart as separate controls.
  const connectionLost = stateId === 'STATE-08' || stateId === 'STATE-12' || stateId === 'STATE-13'
  const loading = stateId === 'STATE-02'
  const readFailed = stateId === 'STATE-12'
  const online = !connectionLost

  /* -------------------------------------------------------------- *
   * Scope, read from the ONE definition the location module owns.
   * An Area-scoped Supervisor who cannot see a node on the location
   * tree does not meet a Shift bound to it here either.
   * -------------------------------------------------------------- */
  const inScopeSiteIds = visibleSiteIds(role)
  const inScopeAreaIds = visibleAreaIds(role)
  const visibleShifts = shiftsVisibleTo(role, shifts)
  /** A filter naming a Site this persona cannot see is not a filter, so it
   *  falls back rather than being reset in whichever handler we remembered. */
  const effectiveSiteFilter = inScopeSiteIds.includes(siteFilter) ? siteFilter : 'all'
  const registerShifts =
    effectiveSiteFilter === 'all'
      ? visibleShifts
      : visibleShifts.filter((s) => s.siteId === effectiveSiteFilter)

  const selectedShift: Shift | undefined =
    registerShifts.find((s) => s.id === pickedShiftId) ?? registerShifts[0]

  /* -------------------------------------------------------------- *
   * The editor's effective values: the draft where one exists, the
   * selected record otherwise. Every one of the five write controls
   * below reads these, so a control can never act on a value the
   * reviewer cannot see.
   * -------------------------------------------------------------- */
  const draftName = nameDraft ?? selectedShift?.name ?? ''
  const draftSiteId = siteDraft ?? selectedShift?.siteId ?? ACTIVE_PARENT_SITES[0]?.id ?? ''
  const draftStart = startDraft ?? selectedShift?.nominalStart ?? '06:00'
  const draftEnd = endDraft ?? selectedShift?.nominalEnd ?? '14:00'
  const draftAreaIds = areaDraft ?? selectedShift?.areaIds ?? []
  const draftDigest = digestDraft ?? selectedShift?.digestTime ?? PLATFORM_DEFAULT_DIGEST_TIME

  /**
   * THE INHERITED TIMEZONE. Resolved from the Site the editor currently
   * names, not stored beside it — which is why it moves the moment the
   * parent Site does, and why no control on this screen can make it drift.
   */
  const inheritedTimezone = shiftTimezone(draftSiteId)
  const selectableAreas = selectableAreasFor(draftSiteId)

  /* -------------------------------------------------------------- *
   * Validation. One computation per rule, read by every control the
   * rule binds — never re-derived per button.
   * -------------------------------------------------------------- */
  const nameError: string | null =
    draftName.trim().length === 0
      ? 'Name this Shift before recording it. The source fixes no length, no character set and no uniqueness rule for a Shift name, so a blank one is the only value refused here — a limit invented on this screen would read back as a requirement.'
      : null

  const blockError: string | null =
    minutesFromMidnight(draftStart) === null || minutesFromMidnight(draftEnd) === null
      ? 'A nominal start and end are each a 24-hour wall-clock time in the form HH:MM, read in the Site’s own timezone.'
      : draftStart === draftEnd
        ? `A start and an end at the same instant define no working-time block. Give the Shift a start and an end that differ; an end earlier than the start is read as crossing midnight, which is how ${draftStart} to an earlier time would be recorded.`
        : null

  const digestError: string | null =
    minutesFromMidnight(draftDigest) === null
      ? `A delivery time is a 24-hour wall-clock time in the form HH:MM. The platform default is ${PLATFORM_DEFAULT_DIGEST_TIME}, and it is read in ${inheritedTimezone ?? 'the Site’s own timezone'}.`
      : null

  function overlapReason(excludeId: string | undefined): string | null {
    if (blockError !== null) return null
    const conflict = overlapConflict(
      {
        ...(excludeId !== undefined ? { id: excludeId } : {}),
        areaIds: draftAreaIds,
        nominalStart: draftStart,
        nominalEnd: draftEnd,
      },
      shifts,
    )
    if (conflict === null) return null
    const areaName = areaById(conflict.areaId)?.name ?? conflict.areaId
    return `🔒 ${areaName} already holds ${conflict.shift.name}, ${conflict.shift.nominalStart}–${conflict.shift.nominalEnd}, and ${draftStart}–${draftEnd} would run over it. The platform refuses to record two Shifts with overlapping times bound to the same Area (AC-51-13). Move the times so they meet at an endpoint rather than cross, or unbind ${areaName}.`
  }

  const createOverlap = overlapReason(undefined)
  const editOverlap = overlapReason(selectedShift?.id)

  /* -------------------------------------------------------------- *
   * Every affordance is decided per control, by its own row of the
   * seven-row matrix, through the one policy entry point.
   * -------------------------------------------------------------- */
  function decide(
    action: string,
    controlId: ShiftControlId,
    statuses: readonly ControlStatus[],
    sourceRefs: readonly string[],
    extra: { readonly requiresOnline?: boolean } = {},
  ): PermissionDecision {
    return evaluateAccess(
      {
        action,
        allowedRoles: rolesWithStatus(controlId, statuses) as readonly RoleId[],
        sourceRefs,
        resourceTenant: FIXTURE_TENANT,
        ...extra,
      },
      {
        state: FIXTURE_STATE,
        identity: {
          signedIn: true,
          role,
          tenant: FIXTURE_TENANT,
          siteScope: inScopeSiteIds,
          areaScope: inScopeAreaIds,
          qualifications: [],
          deviceId: null,
          stepUpActive: false,
          accessSessionId: null,
        },
        online,
        deviceTrusted: true,
        actorOfRecord: 'storyboard-viewer',
      },
    )
  }

  const viewDecision = decide('view-shifts', 'view-shifts', READING_STATUSES, ['L27297'])
  const createDecision = decide('create-shift', 'create-shift', ACTING_STATUSES, ['L27291'], {
    requiresOnline: true,
  })
  const editDecision = decide('edit-shift', 'edit-shift', ACTING_STATUSES, ['L27292', 'L27375'], {
    requiresOnline: true,
  })
  const bindDecision = decide('bind-shift-to-areas', 'bind-areas', ACTING_STATUSES, ['L27294'], {
    requiresOnline: true,
  })
  const digestDecision = decide(
    'set-shift-digest-time',
    'set-digest-time',
    ACTING_STATUSES,
    ['L27295', 'L118001'],
    { requiresOnline: true },
  )
  const archiveDecision = decide('archive-shift', 'archive-shift', ACTING_STATUSES, ['L27293'], {
    requiresOnline: true,
  })

  /* -------------------------------------------------------------- *
   * The tenant state gate, read BEFORE any write control renders.
   * One data table, one function — no conditional here re-derives it.
   * -------------------------------------------------------------- */
  function tenantGate(action: WriteAction): string | null {
    if (!writeAllowed(tenantState, action)) {
      return `The tenant state is ${tenantState}, and the write-class table does not open ${action} in it. The gate is read before this control renders, not after it is pressed, and nothing is held for later.`
    }
    if (connectionLost) return CONNECTION_LOST_REASON
    return null
  }

  const readOnlyCause: string | null =
    role === 'READONLY_AUDITOR'
      ? 'The Read-only Auditor reads tenant-wide records and takes no action at all, so every control that would WRITE a Shift is absent for this persona rather than merely inert. The editor’s own fields still render and still respond — they are how this persona reads a Shift’s times, its bound Areas and the timezone it inherits — and none of them can record anything, because the control that would commit the change is not drawn.'
      : READ_ONLY_CAUSE[tenantState]

  /* -------------------------------------------------------------- *
   * Writes. Audit is in the SAME transaction as the action: if the
   * audit write fails, the action did not happen. Every one of the
   * five write controls goes through here.
   * -------------------------------------------------------------- */
  function commit(description: string, apply: () => void): void {
    setArchivalRefusal(null)
    if (auditWillFail) {
      setAuditFailure(description)
      setLastAction(null)
      return
    }
    apply()
    setAuditFailure(null)
    setLastAction(description)
  }

  function resetDrafts(): void {
    setNameDraft(null)
    setSiteDraft(null)
    setStartDraft(null)
    setEndDraft(null)
    setAreaDraft(null)
    setDigestDraft(null)
  }

  /** A scenario change makes every outcome sentence untrue of the fixture now
   *  rendered around it, so it clears them rather than leaving one standing. */
  function changeScenario(apply: () => void): void {
    apply()
    resetDrafts()
    setLastAction(null)
    setAuditFailure(null)
    setArchivalRefusal(null)
  }

  function pickShift(id: string): void {
    changeScenario(() => setPickedShiftId(id))
  }

  /** Changing the parent Site clears the Area selection, because an Area of
   *  the old Site cannot travel: a Shift may not span Sites (L72144). */
  function changeSite(id: string): void {
    setSiteDraft(id)
    setAreaDraft([])
  }

  function toggleArea(areaId: string): void {
    setAreaDraft(
      draftAreaIds.includes(areaId)
        ? draftAreaIds.filter((a) => a !== areaId)
        : [...draftAreaIds, areaId],
    )
  }

  function createShift(): void {
    const id = `SHIFT-NEW-${shifts.length + 1}`
    const created: Shift = {
      id,
      siteId: draftSiteId,
      name: draftName.trim(),
      nominalStart: draftStart,
      nominalEnd: draftEnd,
      areaIds: draftAreaIds,
      digestTime: draftDigest,
      state: 'active',
      scheduledRunIds: [],
      note: 'Created in this storyboard run.',
    }
    commit(
      `${created.name} was created on ${draftSiteId}, ${created.nominalStart}–${created.nominalEnd}, and recorded with its audit entry in the same transaction as the change. It inherits ${inheritedTimezone ?? 'no timezone, because it names a Site this workspace does not hold'} from its Site and carries none of its own.`,
      () => {
        setShifts((current) => [...current, created])
        setPickedShiftId(id)
        resetDrafts()
      },
    )
  }

  function saveShift(): void {
    const target = selectedShift
    if (!target) return
    commit(
      `${target.name} was renamed to ${draftName.trim()} and its nominal block moved from ${target.nominalStart}–${target.nominalEnd} to ${draftStart}–${draftEnd}, with before-and-after values recorded in the same transaction as the change. The change is forward-effective only: every completed run keeps the production date it was stamped with, the Shift it was recorded against and the metering attribution it earned.`,
      () => {
        setShifts((current) =>
          current.map((s): Shift =>
            s.id === target.id
              ? {
                  ...s,
                  name: draftName.trim(),
                  siteId: draftSiteId,
                  nominalStart: draftStart,
                  nominalEnd: draftEnd,
                  areaIds: draftAreaIds,
                }
              : s,
          ),
        )
        resetDrafts()
      },
    )
  }

  function bindAreas(): void {
    const target = selectedShift
    if (!target) return
    const names = draftAreaIds.map((a) => areaById(a)?.name ?? a)
    commit(
      `${target.name} is now bound to ${names.length === 0 ? 'no Area at all' : names.join(', ')}, recorded with its audit entry in the same transaction as the change. Cardinality beyond the overlap refusal is deferred, so no count was required of this binding in either direction.`,
      () => {
        setShifts((current) =>
          current.map((s): Shift => (s.id === target.id ? { ...s, areaIds: draftAreaIds } : s)),
        )
        resetDrafts()
      },
    )
  }

  function setDigestTime(): void {
    const target = selectedShift
    if (!target) return
    commit(
      `The digest delivery time on ${target.name} moved from ${target.digestTime} to ${draftDigest}, read in ${inheritedTimezone ?? 'the Site’s own timezone'}, and recorded with its audit entry in the same transaction as the change. This registers a delivery preference and sends nothing: delivery belongs to another slice.`,
      () => {
        setShifts((current) =>
          current.map((s): Shift => (s.id === target.id ? { ...s, digestTime: draftDigest } : s)),
        )
        resetDrafts()
      },
    )
  }

  /**
   * The archival request. The refusal is a condition on the OBJECT and is
   * checked on every attempt, so the control stays live and the request meets
   * a stated refusal that raises NOTIF-DOH-03-3 — rather than a greyed button
   * that never explains which runs are in the way, or who can move them.
   */
  function archiveShift(): void {
    const target = selectedShift
    if (!target) return
    if (target.scheduledRunIds.length > 0) {
      setArchivalRefusal(target)
      setLastAction(null)
      setAuditFailure(null)
      return
    }
    commit(
      `${target.name} was archived and recorded with its audit entry in the same transaction as the change. It stays in the register: the runs it already stamped still resolve through it, and it no longer occupies its Areas for the overlap refusal.`,
      () => {
        setShifts((current) =>
          current.map((s): Shift => (s.id === target.id ? { ...s, state: 'archived' } : s)),
        )
        resetDrafts()
      },
    )
  }

  /* -------------------------------------------------------------- *
   * The register table.
   * -------------------------------------------------------------- */
  const registerRows: readonly TableRow[] = registerShifts.map((shift) => {
    const timezone = shiftTimezone(shift.siteId)
    const areaNames = shift.areaIds.map((a) => areaById(a)?.name ?? a)
    return {
      shift: (
        <>
          <button
            type="button"
            onClick={() => pickShift(shift.id)}
            aria-current={shift.id === selectedShift?.id ? 'true' : undefined}
            className={`block text-left font-medium underline ${
              shift.id === selectedShift?.id
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-ink)]'
            }`}
          >
            {shift.name}
          </button>
          <span className="block text-xs text-[var(--color-ink-subtle)]">{shift.id}</span>
        </>
      ),
      block: (
        <>
          <span>
            {shift.nominalStart}–{shift.nominalEnd}
          </span>
          {crossesMidnight(shift) ? (
            <span className="block text-xs text-[var(--color-ink-subtle)]">crosses midnight</span>
          ) : null}
        </>
      ),
      site: (
        <>
          <span>{shift.siteId}</span>
          <span className="block text-xs text-[var(--color-ink-subtle)]">
            {timezone ?? 'timezone unresolved — this Shift names a Site this workspace does not hold'}
          </span>
        </>
      ),
      areas: areaNames.length === 0 ? 'No Area bound' : areaNames.join(', '),
      digest: shift.digestTime,
      state: (
        <StatusPill
          tone={shift.state === 'active' ? 'ok' : 'neutral'}
          icon={shift.state === 'active' ? '●' : '◌'}
          label={shift.state}
        />
      ),
    }
  })

  const filteredSite = DOH_SITES.find((s) => s.id === effectiveSiteFilter)

  /* -------------------------------------------------------------- *
   * The matrix table.
   * -------------------------------------------------------------- */
  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: (
      <>
        <span className="font-medium">{row.control}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
      </>
    ),
    admin: <StatusPill tone={STATUS_TONE[row.status.TENANT_ADMIN]} icon="●" label={row.status.TENANT_ADMIN} />,
    supervisor: <StatusPill tone={STATUS_TONE[row.status.SUPERVISOR]} icon="●" label={row.status.SUPERVISOR} />,
    quality: <StatusPill tone={STATUS_TONE[row.status.QUALITY_MANAGER]} icon="●" label={row.status.QUALITY_MANAGER} />,
    auditor: <StatusPill tone={STATUS_TONE[row.status.READONLY_AUDITOR]} icon="●" label={row.status.READONLY_AUDITOR} />,
    worker: <StatusPill tone={STATUS_TONE[row.status.WORKER]} icon="●" label={row.status.WORKER} />,
    rendering: (
      <>
        <span>{row.rendering}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.effect}</span>
      </>
    ),
  }))

  /** Computed from the WHOLE register and then narrowed to this persona's own
   *  Areas — never from the scope-filtered register, which would report an
   *  Area as unbound merely because the Shift holding it is out of scope. */
  const unboundAreas = areasWithNoBoundShift(shifts).filter((a) => inScopeAreaIds.includes(a.id))

  const scenarioControls = (
    <section
      aria-label="Storyboard scenario controls"
      className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Reviewer controls — not part of the product
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-6">
        <Select
          label="Tenant state"
          value={tenantState}
          options={TENANT_STATE_OPTIONS}
          onChange={(value) => {
            const next = TENANT_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setTenantState(next))
          }}
        />
        <Select
          label="Screen state"
          value={stateId}
          options={SCREEN_STATE_OPTIONS}
          onChange={(value) => {
            const next = APPLICABLE_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setStateId(next))
          }}
        />
        <Checkbox
          label="Simulate an audit-write failure on the next write"
          checked={auditWillFail}
          onChange={setAuditWillFail}
        />
      </div>
      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
        These three re-render seeded fixtures. They perform no product action and change no business
        state. No tenant role holds a control that changes a suspension state anywhere in this
        workspace, so the first of them stands in for the client platform team&rsquo;s act, taken on
        another surface entirely. The screen state and the connection move together on purpose:
        stale, failed and recovering are the three ways a lost connection lands here (D7), and
        splitting them into two controls would let the screen claim one thing and the write controls
        another.
      </p>
    </section>
  )

  const annotation = (
    <p className="text-xs text-[var(--color-ink-subtle)]">
      Screen annotation only, never a route key (D1): SCR-DOH-05, Shift management, in the canonical
      catalogue. Storyboard SB-DOH-015 fixes the editor form beneath the register; SCR-TEN-SHIFT-01
      fixes the digest-time field with its default and its bound beside it. Control matrix
      L27291-L27297.
    </p>
  )

  return (
    <HubShell module={MODULE} role={role} onRoleChange={(next) => changeScenario(() => setRole(next))} tenantState={tenantState}>
      {annotation}

      <div className="mt-6">{scenarioControls}</div>

      <section aria-label="Screen state contract" className="mt-6">
        <h2 className="text-lg font-semibold">Screen state</h2>
        <p className="mt-1 text-sm font-medium">
          {definition.id} — {definition.name}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {definition.contract}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          On MOD-DOH-03: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, createDecision, roleName)}</div>
      </section>

      {readOnlyCause !== null ? (
        <section aria-label="Read-only" className="mt-6">
          <p className="text-sm font-medium">STATE-06 — Read-only</p>
          <div className="mt-2">
            <ScreenStateBoundary
              state="STATE-06"
              surface="SURF-DOH"
              detail={{ readOnlyCause }}
            />
          </div>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            One banner, one cause. It is not restated beside each control below.
          </p>
        </section>
      ) : null}

      <section aria-label="Shift register" className="mt-6">
        <h2 className="text-lg font-semibold">Shift register</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every working-time block this workspace holds, with the timezone each one inherits from
          its own Site. Viewing as {roleName}: {scopeLabelFor(role)}
        </p>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The read is decided per control like every other affordance here, and its decision for
          this persona is {viewDecision.outcome}: all five tenant roles hold the read on this
          module, so nobody meets this screen as a refusal at the door. Every refusal below is per
          control instead.
        </p>
        <div className="mt-3 max-w-sm">
          <Select
            label="Filter the register by Site"
            value={effectiveSiteFilter}
            options={[
              { value: 'all', label: 'Every Site' },
              ...DOH_SITES.filter((s) => inScopeSiteIds.includes(s.id)).map((s) => ({
                value: s.id,
                label: `${s.name} (${s.timezone})`,
              })),
            ]}
            onChange={(value) => changeScenario(() => setSiteFilter(value))}
          />
        </div>
        <div className="mt-3">
          <Table
            caption={`Shifts, ${filteredSite !== undefined ? filteredSite.name : 'every Site'}`}
            columns={[
              { key: 'shift', header: 'Shift' },
              { key: 'block', header: 'Nominal block' },
              { key: 'site', header: 'Parent Site and inherited timezone' },
              { key: 'areas', header: 'Bound Areas' },
              { key: 'digest', header: 'Digest delivery time' },
              { key: 'state', header: 'State' },
            ]}
            rows={registerRows}
            loading={loading}
            {...(readFailed
              ? {
                  error:
                    'The read of this workspace’s Shift register failed. Nothing was written, and no change is waiting to be sent.',
                }
              : {})}
            emptyState={{
              title:
                filteredSite !== undefined
                  ? `${filteredSite.name} holds no Shift.`
                  : 'This workspace holds no Shift.',
              whatCreatesIt:
                'A Tenant Admin creates one in the editor below. Until a Shift is bound to an Area, that Area can receive no Job.',
            }}
          />
        </div>
        {connectionLost ? (
          <div className="mt-2">
            <ScreenStateBoundary
              state="STATE-08"
              surface="SURF-DOH"
              detail={{
                asOfLabel: `as of ${REGISTER_AS_OF}`,
                originLabel:
                  'the last rows loaded before the connection dropped, degraded rather than blanked, with every write control disabled rather than queued',
              }}
            />
          </div>
        ) : (
          <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
            Register as of {REGISTER_AS_OF}.
          </p>
        )}
      </section>

      <section aria-label="Shift editor" className="mt-6">
        <h2 className="text-lg font-semibold">Shift editor</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The form the storyboard fixes: a name, a parent Site with its timezone shown as read-only
          inherited text, a nominal start and end, and the bound Areas as a multi-select. Selecting a
          row in the register above loads it here; the same form records a new Shift.
        </p>

        {selectedShift === undefined ? (
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            No Shift is selected, because none is in view. The form below still records a new one.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm">
              Editing <span className="font-medium">{selectedShift.name}</span> ({selectedShift.id})
            </p>
            <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
              {selectedShift.note}
            </p>
          </>
        )}

        <div className="mt-4 max-w-lg space-y-4">
          <Field
            label="Shift name"
            {...(nameError !== null ? { error: nameError } : {})}
            description="Free text. The source fixes no format for it, so nothing here refuses a value except a blank one."
          >
            <input
              type="text"
              value={draftName}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
            />
          </Field>

          <Select
            label="Parent Site"
            value={draftSiteId}
            options={ACTIVE_PARENT_SITES.filter((s) => inScopeSiteIds.includes(s.id)).map((s) => ({
              value: s.id,
              label: `${s.name} (${s.id})`,
            }))}
            onChange={changeSite}
          />
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Active Sites only. A Shift on a closed facility is a block nobody can work, so an
            archived Site is not offered as a parent — while the register filter above still offers
            it, because the Shifts recorded under a closed Site stay readable. The source states no
            rule either way; this is a derived clarification, and the same one the Area list below
            applies one level down.
          </p>

          <div
            role="note"
            className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3"
          >
            <p className="text-sm">
              <span className="font-medium">Timezone, inherited: </span>
              {inheritedTimezone ?? 'unresolved — this Shift names a Site this workspace does not hold'}
            </p>
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Read-only, and read-only structurally rather than by a rule this screen applies: a
              Shift carries no timezone field, and neither does an Area, so this value exists in
              exactly one place — the parent Site — and moves the instant the Site above does.
              Overriding it is prohibited for all five tenant roles and deferred beyond this version,
              so no control for it is drawn for anybody.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Field
              label="Nominal start"
              {...(blockError !== null ? { error: blockError } : {})}
            >
              <input
                type="time"
                value={draftStart}
                onChange={(e) => setStartDraft(e.target.value)}
                className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
              />
            </Field>
            <Field label="Nominal end" description="An end earlier than the start crosses midnight.">
              <input
                type="time"
                value={draftEnd}
                onChange={(e) => setEndDraft(e.target.value)}
                className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
              />
            </Field>
          </div>

          <fieldset className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
            <legend className="px-1 text-sm font-medium">Bound Areas</legend>
            {selectableAreas.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">
                This Site holds no active Area, so there is nothing to bind. A Shift with no Area is
                permitted here — cardinality is deferred — and the consequence falls on the Area
                rather than the Shift.
              </p>
            ) : (
              <div className="space-y-2">
                {selectableAreas.map((area) => (
                  <Checkbox
                    key={area.id}
                    label={`Bind to ${area.name}`}
                    checked={draftAreaIds.includes(area.id)}
                    onChange={() => toggleArea(area.id)}
                  />
                ))}
              </div>
            )}
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Only this Site&rsquo;s own active Areas are offered, which is where the no-span-Sites
              rule lives: an Area under another Site is never offered rather than offered and then
              refused, and changing the parent Site above clears the selection for the same reason.
            </p>
          </fieldset>

          {createOverlap !== null || editOverlap !== null ? (
            <ScreenStateBoundary
              state="STATE-04"
              surface="SURF-DOH"
              detail={{
                fieldLabel: 'The nominal block and its bound Areas',
                rule: createOverlap ?? editOverlap ?? '',
                permittedFormat:
                  'Two Shifts may share an Area only if their blocks meet at an endpoint rather than cross — a Shift ends at the instant the next begins. An archived Shift no longer occupies its Areas and is not counted here.',
              }}
            />
          ) : null}

          <div className="flex flex-wrap items-start gap-4">
            <WriteControl
              label="Create a Shift"
              decision={createDecision}
              roleName={roleName}
              gateReason={tenantGate('create-shift')}
              objectReason={nameError ?? blockError ?? createOverlap}
              onAct={createShift}
            />
            <WriteControl
              label="Save this Shift"
              decision={editDecision}
              roleName={roleName}
              gateReason={tenantGate('edit-configuration')}
              objectReason={
                selectedShift === undefined
                  ? 'Select a Shift in the register above before saving a change to one.'
                  : (nameError ?? blockError ?? editOverlap)
              }
              onAct={saveShift}
            />
            <WriteControl
              label="Bind this Shift to the selected Areas"
              decision={bindDecision}
              roleName={roleName}
              gateReason={tenantGate('edit-configuration')}
              objectReason={
                selectedShift === undefined
                  ? 'Select a Shift in the register above before changing which Areas it holds.'
                  : editOverlap
              }
              onAct={bindAreas}
            />
            <WriteControl
              label="Archive this Shift"
              decision={archiveDecision}
              roleName={roleName}
              gateReason={tenantGate('edit-configuration')}
              objectReason={
                selectedShift === undefined
                  ? 'Select a Shift in the register above before archiving one.'
                  : null
              }
              onAct={archiveShift}
            />
          </div>

          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            An edit is forward-effective only and is audited at the same weight as a permission
            change, with before-and-after values. Archival is refused while runs are still scheduled
            against the Shift: the request is checked on every attempt and its refusal raises
            NOTIF-DOH-03-3 to the requester, which is why the control stays live rather than greyed —
            a greyed control names neither the runs in the way nor the person who can move them.
          </p>
        </div>
      </section>

      <section aria-label="Last recorded action" className="mt-6">
        {/* The container is mounted BEFORE there is anything to announce: a
            live region inserted at the same moment as its content is not
            reliably announced, and "the action did not happen" is the one
            sentence on this screen a reader must not miss. */}
        <LiveRegion>
          {auditFailure !== null ? (
            <p className="max-w-prose rounded-[var(--radius-control)] border border-[var(--color-status-blocked)] p-3 text-sm text-[var(--color-ink)]">
              The action did not happen. The audit write failed, and because audit is in the same
              transaction as the action, the transaction rolled back with it: the register is
              unchanged, nothing was recorded, and no part of the change was kept. What was attempted:{' '}
              {auditFailure}
            </p>
          ) : archivalRefusal !== null ? (
            <p className="max-w-prose rounded-[var(--radius-control)] border border-[var(--color-status-attention)] p-3 text-sm text-[var(--color-ink)]">
              The archival of {archivalRefusal.name} was refused: {archivalRefusal.scheduledRunIds.length}{' '}
              runs are still scheduled against it —{' '}
              {archivalRefusal.scheduledRunIds.join(', ')}. A Supervisor must cancel or reschedule
              them first, on a screen this slice does not build. The refusal raises NOTIF-DOH-03-3 to
              the requester, and it renders in its true state, {ARCHIVAL_REFUSAL_NOTICE_INITIAL_STATE}
              , and no further: this storyboard reaches no notification channel, and the remaining
              states of that notification belong to a channel it has not touched. The Shift is
              unchanged and stays active.
            </p>
          ) : lastAction !== null ? (
            <p className="max-w-prose rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-ink)]">
              {lastAction}
            </p>
          ) : null}
        </LiveRegion>
      </section>

      <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        Audit is written in the same transaction as the action. If the audit write fails, the action
        fails with it and this screen says the action did not happen — an accepted action is never
        rendered as done ahead of its true state. The three states NOTIF-DOH-03-3 can hold are{' '}
        {ARCHIVAL_REFUSAL_NOTICE_STATES.join(', ')}; only the first is reachable here, and it is
        deliberately not shown as any of the others — this storyboard reaches no channel that could
        move it on.
      </p>

      <section aria-label="Per-Shift digest delivery time" className="mt-6">
        <h2 className="text-lg font-semibold">Per-Shift digest delivery time</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The last field of the editor form, drawn in its own panel because the tenant-administration
          storyboard puts the platform default and the bound beside it. It registers a delivery
          preference on this Shift and nothing else.
        </p>
        <div className="mt-3 max-w-lg space-y-3">
          <Field
            label="Digest delivery time"
            {...(digestError !== null ? { error: digestError } : {})}
            description={`Platform default ${PLATFORM_DEFAULT_DIGEST_TIME}. Bound to ${digestTimeBoundFor(draftSiteId) ?? 'no timezone, because this Shift names a Site this workspace does not hold'}, inherited from the parent Site.`}
          >
            <input
              type="time"
              value={draftDigest}
              onChange={(e) => setDigestDraft(e.target.value)}
              className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
            />
          </Field>
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            The bound is the timezone anchor, not a permitted window: {PLATFORM_DEFAULT_DIGEST_TIME}{' '}
            on one Site and {PLATFORM_DEFAULT_DIGEST_TIME} on another are two different moments, and a
            calendar trigger is evaluated in the Site&rsquo;s timezone rather than a server&rsquo;s or
            in coordinated universal time alone. The competing reading of &ldquo;the bound&rdquo; — an
            earliest and a latest for the value — is recorded as unresolved below rather than invented
            here.
          </p>
          <WriteControl
            label="Set the digest delivery time"
            decision={digestDecision}
            roleName={roleName}
            gateReason={tenantGate('edit-configuration')}
            objectReason={
              selectedShift === undefined
                ? 'Select a Shift in the register above before setting its delivery time.'
                : digestError
            }
            onAct={setDigestTime}
          />
          <div className="mt-2">
            <SeamNotice seamId="shift-digest-delivery" />
          </div>
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            This module owns the TIME and nothing beyond it. There is one digest service per Shift
            and no role may suppress it — a reader mutes a section, never a service — so no
            mute-the-service control is drawn for anybody, and no send control, delivery status or
            recipient list is drawn either. Naming the seam is the honest alternative to a stub that
            would look built.
          </p>
        </div>
      </section>

      <section aria-label="What the Shift anchors" className="mt-6">
        <h2 className="text-lg font-semibold">What the Shift anchors</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A Shift is not a calendar entry. Three platform mechanics resolve against it, and an edit
          moves all three from the next instance onward.
        </p>
        <ul className="mt-3 space-y-3">
          {SHIFT_ANCHORS.map((anchor) => (
            <li key={anchor.id}>
              <p className="text-sm font-medium">{anchor.what}</p>
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">{anchor.why}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{anchor.sourceRef}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The escalation key is ({ESCALATION_KEY.join(', ')}) and it is a key on two configuration
          objects, not on a person. Nothing in this module is grouped by a person, measured against a
          person, or compared between people, in any state — no roster, no per-person figure, no
          pace. Resolving the role-holders who are on a given Shift is a later module&rsquo;s work
          and reads these Shifts; it writes nothing keyed on anybody.
        </p>
      </section>

      <section aria-label="Areas with no bound Shift" className="mt-6">
        <h2 className="text-lg font-semibold">Areas with no bound Shift</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The queryable state this module owes the rest of the platform: an Area with no bound Shift
          can receive no Job. The refusal itself belongs to a later slice; the state belongs here,
          and it is recomputed from the register above every time a binding changes.
        </p>
        {unboundAreas.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
            Every active Area in view holds at least one active Shift.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {unboundAreas.map((area) => (
              <li key={area.id} className="text-sm">
                <StatusPill tone="attention" icon="▲" label="unbound" />{' '}
                <span className="font-medium">{area.name}</span>{' '}
                <span className="text-[var(--color-ink-subtle)]">({area.id})</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Unbound is a flag on an active Area, never a third object state (D21), and this module is
          what sets and clears it. An archived Area is not listed: it holds no Job either way.
        </p>
      </section>

      <section aria-label="Shift-to-Area cardinality" className="mt-6">
        <h2 className="text-lg font-semibold">Shift-to-Area cardinality — an open decision</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          DEC-SHIFT-001 is open, and the source calls it blocking for this module. It is not
          mentioned once in this module&rsquo;s own chapter, which states a many-Areas reading four
          times as though nothing were in question — so an implementer reading only that chapter
          would never learn there is a decision to make (D6).
        </p>
        <ul className="mt-3 space-y-2">
          {SHIFT_CARDINALITY_OPTIONS.map((option) => (
            <li key={option.id} className="text-sm">
              <StatusPill
                tone={option.adopted ? 'ok' : 'neutral'}
                icon={option.adopted ? '◆' : '◇'}
                label={option.adopted ? `Option ${option.id} — shipped as the mitigation` : `Option ${option.id} — not built`}
              />{' '}
              <span className="text-[var(--color-ink-muted)]">{option.statement}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {SHIFT_CARDINALITY_MITIGATION}
        </p>
      </section>

      <section aria-label="Control matrix" className="mt-6">
        <h2 className="text-lg font-semibold">What each of the five tenant roles sees</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Seven controls, five roles, and an explicit status in every cell — a blank cell is an
          unanswered question an implementer would answer privately. Every affordance above is driven
          from this table alone.
        </p>
        <div className="mt-3">
          <Table
            caption="MOD-DOH-03 control matrix, by tenant role"
            columns={[
              { key: 'control', header: 'Control' },
              { key: 'admin', header: 'Tenant Admin' },
              { key: 'supervisor', header: 'Supervisor' },
              { key: 'quality', header: 'Quality Manager' },
              { key: 'auditor', header: 'Read-only Auditor' },
              { key: 'worker', header: 'Worker' },
              { key: 'rendering', header: 'How it renders here' },
            ]}
            rows={matrixRows}
            emptyState={{
              title: 'No control is defined for this module.',
              whatCreatesIt: 'The frozen source defines the matrix.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The Worker cell on the read row is the one place in this whole matrix a Worker is granted
          anything, and it collides with D11: the Worker holds no Hub screen, so the grant renders on
          no screen at all. The collision is stated here rather than settled in silence, and the cost
          is stated with it — a worker without a device in hand cannot see their own shift times, and
          meets them on the device instead. The four roles the write rows prohibit meet those
          controls as ABSENT, following the house rule the neighbouring Hub modules already apply to
          a categorical prohibition; the competing reading, that a control the Tenant Admin holds on
          this same screen should render disabled with its reason, is recorded as unresolved below.
        </p>
      </section>

      <section aria-label="Absent by rule" className="mt-6">
        <h2 className="text-lg font-semibold">Absent by rule</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nothing is drawn where each of these would sit — only the note saying why. An inert control
          would imply that an enabled state exists for somebody, and for these it does not. The
          deferred scopes are {DEFERRED_DOH_SCOPES.join(', ')}.
        </p>
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
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Four of the thirteen screen states cannot occur on MOD-DOH-03. They are named with their
          reason rather than quietly left out of the selector.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {NEVER_APPLIES.map((s) => (
            <li key={s.id}>
              <span className="font-medium text-[var(--color-ink)]">{s.id}</span> — {s.why}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Decisions rendered on this screen" className="mt-6">
        <h2 className="text-lg font-semibold">Decisions this screen renders</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each one is a judgement made against the frozen source, visible here rather than buried in
          a comment a reviewer would never read.
        </p>
        <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
          {DECISIONS_ON_SCREEN.map((d) => (
            <li key={d.ref}>
              <span className="font-medium text-[var(--color-ink)]">{d.ref}</span> — {d.statement}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Unspecified in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unspecified in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Affordances a reader might expect on this screen that the source does not define. Named
          here rather than invented, because a plausible invented control reads back as a
          requirement.
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
    </HubShell>
  )
}

/* ------------------------------------------------------------------ *
 * The write control. Inlined here rather than shared: the neighbouring
 * Hub module carries an equivalent one and does not export it, and a
 * shared primitive for it does not exist. The four branches are the
 * three prohibition renderings plus the acting case, applied in the
 * order the rules bind — role first (nothing is drawn for a role that
 * cannot hold it in any scope), then the evaluator's own refusal, then
 * the tenant state gate, then the object's own condition.
 * ------------------------------------------------------------------ */
interface WriteControlProps {
  readonly label: string
  readonly decision: PermissionDecision
  readonly roleName: string
  readonly gateReason: string | null
  readonly objectReason: string | null
  readonly onAct: () => void
}

function WriteControl({
  label,
  decision,
  roleName,
  gateReason,
  objectReason,
  onAct,
}: WriteControlProps) {
  if (decision.reasonCode === 'ROLE_NOT_GRANTED') {
    return (
      <ProhibitionNotice
        rendering={{
          kind: 'absent',
          note: `${label} is not held by the ${roleName} in any scope, and this build draws nothing where it would sit. The Tenant Admin does hold it on this same screen, under conditions the matrix below states — so what is settled is that this persona can never press it, and what is NOT settled is whether that should render as nothing at all or as a control disabled with its reason. The frozen source decides this shape both ways in different places; it is recorded in Unresolved in source and is being settled once, for every module, rather than here.`,
        }}
      />
    )
  }
  if (decision.outcome !== 'allowed') {
    return (
      <Button
        disabledReason={`${decision.explanation}${
          decision.conditionToEnable !== null ? ` ${decision.conditionToEnable}` : ''
        } Nothing here is queued — never queued, in any state — because a configuration change accepted with no audit entry would be a change nobody could account for (D7). Viewing as ${roleName}.`}
      >
        {label}
      </Button>
    )
  }
  if (gateReason !== null) return <Button disabledReason={gateReason}>{label}</Button>
  if (objectReason !== null) return <Button disabledReason={objectReason}>{label}</Button>
  return <Button onClick={onAct}>{label}</Button>
}

/* ------------------------------------------------------------------ *
 * The nine applicable screen states.
 * ------------------------------------------------------------------ */

function stateTreatment(
  stateId: ModuleStateId,
  createDecision: PermissionDecision,
  roleName: string,
) {
  switch (stateId) {
    case 'STATE-01':
      return (
        <ScreenStateBoundary
          state="STATE-01"
          surface="SURF-DOH"
          detail={{
            objectLabel: 'Shifts on this Site',
            whatCreatesIt:
              'A Tenant Admin records one in the editor below. Select the Site that holds no Shift in the register filter above to see it.',
          }}
        />
      )
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-DOH"
          detail={{ objectLabel: 'this workspace’s Shift register' }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The register, the editor and the anchoring panel below are the success rendering, each
          carrying the moment it was true.
        </p>
      )
    case 'STATE-04':
      return (
        <ScreenStateBoundary
          state="STATE-04"
          surface="SURF-DOH"
          detail={{
            fieldLabel: 'A Shift’s nominal block',
            rule: 'Two Shifts bound to the same Area may not overlap in time, and a Shift must carry a name and a block of some length.',
            permittedFormat:
              'A start and an end as HH:MM, read in the parent Site’s timezone, meeting a neighbouring Shift at an endpoint rather than crossing it. Set the times in the editor below to see the refusal name both Shifts and the Area they share.',
          }}
        />
      )
    case 'STATE-05':
      if (createDecision.reasonCode !== 'ROLE_NOT_GRANTED') {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} carries this module&rsquo;s writes, so no refusal renders for this view.
            Select any other persona to see the refusal named rather than left as a blank space
            where a control would be.
          </p>
        )
      }
      return (
        <ScreenStateBoundary
          state="STATE-05"
          surface="SURF-DOH"
          detail={{ decision: createDecision }}
        />
      )
    case 'STATE-06':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Read-only renders as its own banner above the register whenever a cause applies — the
          persona, or the tenant state. One banner, one cause; it is not restated here.
        </p>
      )
    case 'STATE-08':
      return (
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-DOH"
          detail={{
            asOfLabel: `as of ${REGISTER_AS_OF}`,
            originLabel:
              'the last register loaded before the connection dropped, with every write control disabled rather than queued',
          }}
        />
      )
    case 'STATE-12':
      return (
        <ScreenStateBoundary
          state="STATE-12"
          surface="SURF-DOH"
          detail={{
            failureWhat: 'The read of this workspace’s Shift register failed.',
            wasWritten: false,
            nextStep:
              'The rows above are the last that loaded. Every write control is disabled rather than queued while the connection is down, so nothing is waiting to be sent.',
          }}
        />
      )
    case 'STATE-13':
      return (
        <ScreenStateBoundary
          state="STATE-13"
          surface="SURF-DOH"
          detail={{
            recoveryProgress:
              'Reconnected. The tenant state is being refetched BEFORE any write control is re-enabled — a Shift offered against a stale suspension state is a write the gate never actually saw. The register stays marked as the last loaded until the refetch lands.',
          }}
        />
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state on MOD-DOH-03: ${String(exhaustive)}`)
    }
  }
}
