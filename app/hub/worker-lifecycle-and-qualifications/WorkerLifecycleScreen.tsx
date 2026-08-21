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
import { TENANT_STATE_OPTIONS } from '@/ui/doh/tenant-state-vocabulary'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { CommandStateBadge } from '@/ui/sa/CommandStateBadge'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState } from '@/ui/screen-state'
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
  ABSENT_BY_RULE,
  ABSENT_NOTE_SUFFIX,
  ACTING_STATUSES,
  APPLICABLE_STATES,
  AUDIT_SENTENCE,
  CANONICAL_IMPORT_COLUMNS,
  CLEARANCE_REASON_LABEL,
  CONNECTION_LOST_REASON,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  DEFAULT_CLEARANCE_VALID_FOR_DAYS,
  DOH_CLEARANCES,
  DOH_QUALIFICATIONS,
  DOH_WORKERS,
  EARLIEST_MANDATORY_STAGE,
  ESCALATION_KEY,
  ESCALATION_WINDOW_DEFAULT,
  EXPIRED_BANNER_COPY,
  GATE_POSTURES,
  GATE_POSTURE_FLOOR,
  HARD_SUSPENSION_RECERTIFICATION_CONSEQUENCE,
  INSTRUCTION_DIFFICULTIES,
  MANDATORY_EXPIRY_LADDER,
  MEASURE_RULES,
  MODULE_STATE_DETAIL,
  MODULE_STATE_NOTE,
  NEVER_APPLIES,
  NOTIFY_ONLY_EXPIRY_NOTICE,
  READING_STATUSES,
  READ_ONLY_CAUSE,
  RECORD_REGIONS,
  REGISTER_AS_OF,
  SEEDED_CERTIFICATION_TYPES,
  SEEDED_IMPORT_FILES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  addEarlierWarningStage,
  areaNameFor,
  certificationLabelFor,
  chipFor,
  clearanceIsEffective,
  clearancesOn,
  clearancesVisibleTo,
  entryIsLate,
  isLadderRefusal,
  qualificationStateFor,
  qualificationsFor,
  recertificationRefusal,
  resolveEscalation,
  rolesWithStatus,
  scopeLabelFor,
  secondClearanceRoutesToQualityManager,
  selectableAreas,
  shiftNameFor,
  shiftsBoundTo,
  workerAreaIds,
  workersVisibleTo,
  type Clearance,
  type ControlStatus,
  type GatePosture,
  type InstructionDifficulty,
  type ModuleStateId,
  type Qualification,
  type QualificationChip,
  type Worker,
  type WorkerControlId,
} from './fixtures'

/**
 * MOD-DOH-04 — Worker Lifecycle and Qualifications, `SCR-DOH-07` (worker
 * list) and `SCR-DOH-08` (worker record and qualifications), storyboard
 * SB-DOH-016.
 *
 * Who may do what, enforced at assignment and on the device, with the audited
 * exception path when the line would otherwise stop.
 *
 * THE TWO RULES THAT SHAPE THIS FILE.
 *
 * 1. SUPPORT, NOT SURVEILLANCE — and this is the module where the line bites,
 *    because everything here IS about a person. A worker may be named for
 *    qualification, assignment and lifecycle purposes and may never be
 *    measured. Nothing on this screen renders a pace, a timer against an
 *    expectation, a count of completed work, a ranking, a productivity or
 *    suitability figure, or any comparison between people, in ANY state. The
 *    run references on a record are the object-state condition on archival and
 *    are drawn as names rather than as a number. The clearance escalation
 *    keys on `(Area, Shift)`, and `secondClearanceRoutesToQualityManager` has
 *    no worker parameter for a caller to pass one to.
 *
 * 2. D23 AND D10 GOVERN DIFFERENT CONTROLS, and both hold. D23 is the
 *    clearance REGISTER: read-only, and no grant control on it for anybody,
 *    the Quality Manager included — granting is Client Command Center action
 *    number ten. D10 is the cross-surface HANDOFF that routes to the surface
 *    where granting happens: present for the Supervisor and the Quality
 *    Manager, and disabled with its named reason for the Tenant Admin. No
 *    grant control is minted in the Hub by either of them.
 *
 * MOD-DOH-04 owns `OBJ-DOH-WORKER`, `OBJ-DOH-QUAL` and `OBJ-DOH-CLEAR`. Sites,
 * Areas, role scopes and certification types are read from the module that
 * owns them; Shifts are read from the module that owns those; a run is a
 * reference and never a record.
 */
const MODULE = dohModuleById('MOD-DOH-04')

const FIXTURE_TENANT = tenantId('TEN-ARDENFIELD')

/**
 * The evaluator context holds an ACTIVE tenant partition on purpose. Role and
 * scope are decided here; the tenant lifecycle gate is `writeAllowed` over the
 * one write-class table, called separately below. Folding the suspension into
 * the partition would refuse the READS too, and a hard-suspended tenant is
 * read-only, not blind.
 */
const FIXTURE_STATE = withTenant(
  emptyDomainState(scenarioRunId('DOH-MOD-04-STORYBOARD')),
  FIXTURE_TENANT,
  (partition) => ({
    ...partition,
    displayName: 'Ardenfield Manufacturing',
    lifecycleState: 'ACTIVE',
  }),
)

const STATUS_TONE: Readonly<Record<ControlStatus, StatusTone>> = {
  allowed: 'ok',
  'allowed-with-conditions': 'info',
  'read-only': 'stale',
  'explicitly-prohibited': 'blocked',
  'not-applicable': 'neutral',
  unavailable: 'neutral',
}

const CHIP_TONE: Readonly<Record<QualificationChip, StatusTone>> = {
  Valid: 'ok',
  '14 days': 'info',
  '7 days': 'attention',
  '1 day': 'attention',
  Expired: 'blocked',
  Cleared: 'stale',
}

const SCREEN_STATE_OPTIONS = APPLICABLE_STATES.map((id) => ({
  value: id,
  label: `${id} — ${screenState(id).name}`,
}))

/** The three renderings this screen uses for a role that may not act. */
type RoleRefusal =
  | { readonly kind: 'absent'; readonly note: string }
  | { readonly kind: 'disabled'; readonly reason: string }

export function WorkerLifecycleScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>('active')
  const [stateId, setStateId] = useState<ModuleStateId>('STATE-03')
  const [auditWillFail, setAuditWillFail] = useState(false)

  /** The LIVE registers. Every panel on this screen reads these, so a record
   *  written here is visible to every answer the screen gives. */
  const [workers, setWorkers] = useState<readonly Worker[]>(DOH_WORKERS)
  const [qualifications, setQualifications] =
    useState<readonly Qualification[]>(DOH_QUALIFICATIONS)
  const [clearances] = useState<readonly Clearance[]>(DOH_CLEARANCES)

  /** Tenant settings held in this module's section of the tenant
   *  administration area, which is a screen group owned by no module (D2). */
  const [gatePosture, setGatePosture] = useState<GatePosture>('strict')
  const [clearanceValidForDays, setClearanceValidForDays] = useState<number>(
    DEFAULT_CLEARANCE_VALID_FOR_DAYS,
  )
  const [warningLadder, setWarningLadder] = useState<readonly number[]>([
    ...MANDATORY_EXPIRY_LADDER,
  ])

  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [pickedWorkerId, setPickedWorkerId] = useState<string | null>(null)
  const [pickedQualId, setPickedQualId] = useState<string | null>(null)

  /** The new-worker form. */
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<string>('employee')
  const [newDifficulty, setNewDifficulty] = useState<string>('standard')

  /** The qualification-entry form. */
  const [entryCertId, setEntryCertId] = useState<string>('CERT-LOTO')
  const [entryAreaIds, setEntryAreaIds] = useState<readonly string[]>([])
  const [entryCertDate, setEntryCertDate] = useState('2026-08-19')
  const [entryEntryDate, setEntryEntryDate] = useState('2026-08-19')
  const [entryExpiryDate, setEntryExpiryDate] = useState('2027-08-19')
  const [entryDaysToExpiry, setEntryDaysToExpiry] = useState('365')

  /** The recertification form. */
  const [recertExpiry, setRecertExpiry] = useState('')
  const [recertDays, setRecertDays] = useState('365')
  const [recertCertDate, setRecertCertDate] = useState('2026-08-19')
  const [recertEntryDate, setRecertEntryDate] = useState('2026-08-19')

  /** The instruction-difficulty form. */
  const [difficultyDraft, setDifficultyDraft] = useState<string | null>(null)

  /** The gate-settings form. */
  const [postureDraft, setPostureDraft] = useState<string | null>(null)
  const [durationDraft, setDurationDraft] = useState<string | null>(null)
  const [earlierStageDraft, setEarlierStageDraft] = useState('')

  /** The bulk-import form. */
  const [importFileId, setImportFileId] = useState<string>('IMP-CLEAN')

  /** The Area and Shift a clearance handoff would concern — the escalation
   *  key, and the only two things the second-clearance rule reads. */
  const [handoffAreaId, setHandoffAreaId] = useState('AREA-ARD-ASSY')
  const [handoffShiftId, setHandoffShiftId] = useState('SHIFT-ARD-EARLY')

  const [lastAction, setLastAction] = useState<string | null>(null)
  const [auditFailure, setAuditFailure] = useState<string | null>(null)
  const [importRefusal, setImportRefusal] = useState<string | null>(null)
  const [handoffsTaken, setHandoffsTaken] = useState<readonly string[]>([])

  const roleName = roleById(role).name
  const definition = screenState(stateId)

  // D7: the three states a lost connection can leave this screen in. The
  // reviewer picks the screen state and the connection follows from it, rather
  // than the two drifting apart as separate controls.
  const connectionLost = stateId === 'STATE-08' || stateId === 'STATE-12' || stateId === 'STATE-13'
  const loading = stateId === 'STATE-02'
  const readFailed = stateId === 'STATE-12'
  const online = !connectionLost

  /* -------------------------------------------------------------- *
   * Scope, read from the ONE definition the location module owns.
   * -------------------------------------------------------------- */
  const scopedAreas = selectableAreas(role)
  const inScopeAreaIds = scopedAreas.map((a) => a.id)
  const inScopeSiteIds = [...new Set(scopedAreas.map((a) => a.siteId))]
  const visibleWorkers = workersVisibleTo(role, workers, qualifications)
  /** A filter naming an Area this persona cannot see is not a filter, so it
   *  falls back rather than being reset in whichever handler we remembered. */
  const effectiveAreaFilter = inScopeAreaIds.includes(areaFilter) ? areaFilter : 'all'
  const registerWorkers =
    effectiveAreaFilter === 'all'
      ? visibleWorkers
      : visibleWorkers.filter((w) =>
          workerAreaIds(w, qualifications).includes(effectiveAreaFilter),
        )

  /**
   * IN-SCOPE BY INTERSECTION, not by resetting in a handler. The checkboxes are
   * built from `scopedAreas`, so a persona who holds an Area cannot tick one
   * they do not — but a persona who ticked one and then CHANGED left the id
   * sitting in state with its checkbox gone, and the write read state rather
   * than the checkboxes. The register's Area filter one screen up already
   * solves exactly this hazard by falling back rather than resetting; this is
   * the same rule applied to a write, where getting it wrong records a
   * qualification scoped to an Area the writer does not hold.
   */
  const effectiveEntryAreaIds = entryAreaIds.filter((id) => inScopeAreaIds.includes(id))

  /** The clearance corpus this persona may read. `Read-only — own scope`
   *  (L27484), and the corpus carries free text somebody wrote about a named
   *  person, so an out-of-scope row here leaks more than a register row does. */
  const visibleClearances = clearancesVisibleTo(role, clearances)

  const selectedWorker: Worker | undefined =
    registerWorkers.find((w) => w.id === pickedWorkerId) ?? registerWorkers[0]
  const selectedQualifications =
    selectedWorker === undefined ? [] : qualificationsFor(selectedWorker.id, qualifications)
  const selectedQual: Qualification | undefined =
    selectedQualifications.find((q) => q.id === pickedQualId) ?? selectedQualifications[0]

  const selectedClearances =
    selectedWorker === undefined
      ? []
      : visibleClearances.filter((c) => c.workerId === selectedWorker.id)

  /**
   * SB-DOH-016's banner condition: any qualification on this record reading
   * Expired. It is computed from the CHIP rather than from the raw state, and
   * the difference is load-bearing. The state diagram makes Cleared a state a
   * qualification moves INTO from Expired once the clearance is applied at the
   * device's next sync, so a certificate covered by an applied clearance is not
   * expired for the banner's purposes — and the banner's fixed copy says new
   * assignment is blocked, which would be false while a clearance stands.
   * Because `chipFor` reaches Cleared only through `clearanceIsEffective`, a
   * clearance still queued on the device cannot silence this banner.
   */
  const hasExpiredQualification = selectedQualifications.some(
    (q) => chipFor(q, clearances) === 'Expired',
  )

  const effectiveDifficulty: string =
    difficultyDraft ?? selectedWorker?.instructionDifficulty ?? ''

  /* -------------------------------------------------------------- *
   * Validation. One computation per rule, read by every control the
   * rule binds — never re-derived per button.
   * -------------------------------------------------------------- */
  const newNameError: string | null =
    newName.trim().length === 0
      ? 'Name this worker before recording them. The source fixes no length, no character set and no uniqueness rule for a worker name, so a blank one is the only value refused here — a limit invented on this screen would read back as a requirement.'
      : null

  const entryAreaError: string | null =
    effectiveEntryAreaIds.length === 0
      ? 'Every qualification carries per-Area scope, so at least one Area is required, and it must be an Area this persona actually holds. A qualification may name Areas under different Sites of this tenant; it may not name none, and it may not name one out of scope.'
      : null

  const entryDateError: string | null =
    entryCertDate > entryEntryDate
      ? `A certification date may be BACK-dated and never forward-dated: ${entryCertDate} is after the entry date ${entryEntryDate}. Back-dating is what stops a late entry looking like a compliance gap; a future issue date would be a certificate that does not exist yet.`
      : null

  const recertRefusal: string | null =
    selectedQual === undefined
      ? null
      : recertExpiry.trim().length === 0
        ? 'Give the new expiry this recertification carries. Nothing is written until it postdates the previous one.'
        : recertificationRefusal(selectedQual.expiryDate, recertExpiry)

  const difficultyError: string | null =
    effectiveDifficulty === ''
      ? 'The instruction-difficulty profile accepts only simple, standard or expanded. Until one is accepted the record is held INCOMPLETE and can receive no assignment — no assignment is safer than an assignment whose instructions may render at the wrong level.'
      : null

  /**
   * A whole number of days, or a stated refusal. Blank is the case that
   * mattered: `Number('')` is 0, and 0 days to expiry is EXPIRED — so an
   * emptied field silently recorded a brand-new certificate as already lapsed,
   * which is a validation failure rendering as a safety state.
   */
  function daysError(value: string, field: string): string | null {
    if (value.trim().length === 0 || !Number.isInteger(Number(value))) {
      return `${field} is a whole number of days, counted from the register stamp of ${REGISTER_AS_OF}. Blank is not zero: this storyboard reads no clock, so an empty field would record the certificate as already expired rather than as undated.`
    }
    return null
  }

  const entryDaysError = daysError(entryDaysToExpiry, 'The days to this expiry')
  const recertDaysError = daysError(recertDays, 'The days to the new expiry')

  const durationValue = Number(durationDraft ?? String(clearanceValidForDays))
  const durationError: string | null =
    !Number.isInteger(durationValue) || durationValue < 1
      ? 'A clearance duration is a positive whole number of days. The source states it is a tenant setting rather than a fixed per-shift expiry, and states no minimum, maximum or default, so nothing else is refused here.'
      : null

  const ladderResult =
    earlierStageDraft.trim().length === 0
      ? null
      : addEarlierWarningStage(Number(earlierStageDraft), warningLadder)
  const ladderError: string | null =
    ladderResult !== null && isLadderRefusal(ladderResult) ? ladderResult.refused : null

  const importFile = SEEDED_IMPORT_FILES.find((f) => f.id === importFileId)

  /* -------------------------------------------------------------- *
   * The clearance handoff. D23 keeps the register free of any grant
   * control; this is the cross-surface route to the surface that
   * grants, and its second-clearance condition reads (Area, Shift).
   * -------------------------------------------------------------- */
  /** Same rule as the register's Area filter, and for the same reason: an Area
   *  this persona cannot see is not a choice, so it falls back rather than
   *  being reset in whichever handler we remembered. Without this the Select
   *  renders blank after a persona switch while the routing and the escalation
   *  below keep answering about the Area that left. */
  const effectiveHandoffAreaId = inScopeAreaIds.includes(handoffAreaId)
    ? handoffAreaId
    : (inScopeAreaIds[0] ?? handoffAreaId)
  const handoffShifts = shiftsBoundTo(effectiveHandoffAreaId)
  const effectiveHandoffShiftId =
    handoffShifts.some((s) => s.id === handoffShiftId)
      ? handoffShiftId
      : (handoffShifts[0]?.id ?? handoffShiftId)
  const pairAlreadyCleared = secondClearanceRoutesToQualityManager(
    effectiveHandoffAreaId,
    effectiveHandoffShiftId,
    clearances,
  )
  const escalation = resolveEscalation(effectiveHandoffAreaId, effectiveHandoffShiftId)
  const notifyOnly = gatePosture === 'notify-only'

  /* -------------------------------------------------------------- *
   * Every affordance is decided per control, by its own row of the
   * fifteen-row matrix, through the one policy entry point.
   * -------------------------------------------------------------- */
  function decide(
    action: string,
    controlId: WorkerControlId,
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

  const viewDecision = decide('view-worker-record', 'view-worker', READING_STATUSES, ['L27471'])
  const corpusDecision = decide('read-clearance-corpus', 'read-clearance-corpus', READING_STATUSES, [
    'L27484',
  ])
  const createDecision = decide(
    'create-or-edit-worker',
    'create-or-edit-worker',
    ACTING_STATUSES,
    ['L27470'],
    { requiresOnline: true },
  )
  const enterQualDecision = decide(
    'enter-qualification',
    'enter-qualification',
    ACTING_STATUSES,
    ['L27472', 'L27602'],
    { requiresOnline: true },
  )
  const recertDecision = decide(
    'record-recertification',
    'record-recertification',
    ACTING_STATUSES,
    ['L27473', 'L27610'],
    { requiresOnline: true },
  )
  const difficultyDecision = decide(
    'set-instruction-difficulty',
    'set-instruction-difficulty',
    ACTING_STATUSES,
    ['L27475', 'L52800'],
    { requiresOnline: true },
  )
  const archiveDecision = decide('archive-worker', 'archive-worker', ACTING_STATUSES, ['L27480'], {
    requiresOnline: true,
  })
  const reactivateDecision = decide(
    'reactivate-worker',
    'reactivate-worker',
    ACTING_STATUSES,
    ['L27481'],
    { requiresOnline: true },
  )
  const importDecision = decide(
    'bulk-import-workers',
    'bulk-import-workers',
    ACTING_STATUSES,
    ['L27482'],
    { requiresOnline: true },
  )
  const postureDecision = decide(
    'set-gate-posture-or-duration',
    'set-gate-posture-or-duration',
    ACTING_STATUSES,
    ['L27479'],
    { requiresOnline: true },
  )
  const clearExpiredDecision = decide(
    'clearance-handoff-expired-certification',
    'clear-expired-certification',
    ACTING_STATUSES,
    ['L27476', 'L26059'],
    { requiresOnline: true },
  )
  const clearNeverHeldDecision = decide(
    'clearance-handoff-never-held',
    'clear-never-held',
    ACTING_STATUSES,
    ['L27477', 'L64415'],
    { requiresOnline: true },
  )
  const clearSecondDecision = decide(
    'clearance-handoff-second-in-area-on-shift',
    'clear-second-in-area-on-shift',
    ACTING_STATUSES,
    ['L27478', 'L27437'],
    { requiresOnline: true },
  )

  /* -------------------------------------------------------------- *
   * The tenant state gate, read BEFORE any write control renders.
   * One data table, one function — no conditional here re-derives it.
   * -------------------------------------------------------------- */
  function tenantGate(action: WriteAction, consequence = ''): string | null {
    if (!writeAllowed(tenantState, action)) {
      return `The tenant state is ${tenantState}, and the write-class table does not open ${action} in it. The gate is read before this control renders, not after it is pressed, and nothing is held for later.${consequence}`
    }
    if (connectionLost) return CONNECTION_LOST_REASON
    return null
  }

  const recertGate = tenantGate(
    'recertify-worker',
    tenantState === 'hard-suspended' ? HARD_SUSPENSION_RECERTIFICATION_CONSEQUENCE : '',
  )

  const readOnlyCause: string | null =
    role === 'READONLY_AUDITOR'
      ? 'The Read-only Auditor reads tenant-wide records and takes no action at all, so every control that would WRITE on this module is absent for this persona rather than merely inert. The reading panels still render — that is how this persona reads a worker record, a qualification and the clearance corpus — and none of them can record anything, because no control that would commit a change is drawn.'
      : READ_ONLY_CAUSE[tenantState]

  /* -------------------------------------------------------------- *
   * Writes. Audit is in the SAME transaction as the action: if the
   * audit write fails, the action did not happen. Every one of the
   * write controls on this screen goes through here, and each is
   * covered by a test that mutates something observable first.
   * -------------------------------------------------------------- */
  function commit(description: string, apply: () => void): void {
    setImportRefusal(null)
    if (auditWillFail) {
      setAuditFailure(description)
      setLastAction(null)
      return
    }
    apply()
    setAuditFailure(null)
    setLastAction(description)
  }

  function changeScenario(apply: () => void): void {
    apply()
    setDifficultyDraft(null)
    setPostureDraft(null)
    setDurationDraft(null)
    setEarlierStageDraft('')
    setRecertExpiry('')
    setLastAction(null)
    setAuditFailure(null)
    setImportRefusal(null)
  }

  function pickWorker(id: string): void {
    changeScenario(() => {
      setPickedWorkerId(id)
      setPickedQualId(null)
    })
  }

  function createWorker(): void {
    const id = `WKR-ARD-9${workers.length}`
    const created: Worker = {
      id,
      name: newName.trim(),
      platformLogin: null,
      workerType: newType === 'contractor' ? 'contractor' : 'employee',
      instructionDifficulty: asDifficulty(newDifficulty),
      homeAreaId: inScopeAreaIds[0] ?? 'AREA-ARD-ASSY',
      state: 'active',
      revalidationPending: false,
      activeRunIds: [],
      upcomingRunIds: [],
      note: 'Created in this storyboard run.',
    }
    commit(
      AUDIT_SENTENCE.createWorker(created),
      () => {
        setWorkers((current) => [...current, created])
        setPickedWorkerId(id)
        setNewName('')
      },
    )
  }

  function enterQualification(): void {
    const target = selectedWorker
    if (!target) return
    const id = `QUAL-NEW-${qualifications.length}`
    const created: Qualification = {
      id,
      workerId: target.id,
      certificationId: entryCertId,
      areaIds: effectiveEntryAreaIds,
      certificationDate: entryCertDate,
      entryDate: entryEntryDate,
      expiryDate: entryExpiryDate,
      daysToExpiry: Number(entryDaysToExpiry),
      renewedFromExpiry: null,
      note: 'Entered in this storyboard run.',
    }
    commit(
      AUDIT_SENTENCE.enterQualification(created, target.name),
      () => {
        setQualifications((current) => [...current, created])
        setPickedQualId(id)
      },
    )
  }

  function recordRecertification(): void {
    const target = selectedQual
    if (!target) return
    commit(
      AUDIT_SENTENCE.recordRecertification(target, recertExpiry, recertCertDate, recertEntryDate),
      () => {
        setQualifications((current) =>
          current.map((q): Qualification =>
            q.id === target.id
              ? {
                  ...q,
                  expiryDate: recertExpiry,
                  daysToExpiry: Number(recertDays),
                  certificationDate: recertCertDate,
                  entryDate: recertEntryDate,
                  renewedFromExpiry: target.expiryDate,
                }
              : q,
          ),
        )
        setRecertExpiry('')
      },
    )
  }

  function setInstructionDifficulty(): void {
    const target = selectedWorker
    if (!target) return
    const value = asDifficulty(effectiveDifficulty)
    commit(
      AUDIT_SENTENCE.setInstructionDifficulty(target, value),
      () => {
        setWorkers((current) =>
          current.map((w): Worker =>
            w.id === target.id ? { ...w, instructionDifficulty: value } : w,
          ),
        )
        setDifficultyDraft(null)
      },
    )
  }

  /** Departure, step one of two. */
  function reassignRuns(): void {
    const target = selectedWorker
    if (!target) return
    commit(
      AUDIT_SENTENCE.reassignRuns(target),
      () => {
        setWorkers((current) =>
          current.map((w): Worker =>
            w.id === target.id ? { ...w, activeRunIds: [], upcomingRunIds: [] } : w,
          ),
        )
      },
    )
  }

  /** Departure, step two of two. */
  function archiveWorker(): void {
    const target = selectedWorker
    if (!target) return
    commit(
      AUDIT_SENTENCE.archiveWorker(target),
      () => {
        setWorkers((current) =>
          current.map((w): Worker => (w.id === target.id ? { ...w, state: 'archived' } : w)),
        )
      },
    )
  }

  function reactivateWorker(): void {
    const target = selectedWorker
    if (!target) return
    commit(
      AUDIT_SENTENCE.reactivateWorker(target),
      () => {
        setWorkers((current) =>
          current.map((w): Worker =>
            w.id === target.id ? { ...w, state: 'reactivated', revalidationPending: true } : w,
          ),
        )
      },
    )
  }

  /**
   * Bulk import, all-or-nothing per file. The refusal is a condition on the
   * FILE and is checked on every attempt, so the control stays live and the
   * request meets a stated refusal naming the row and the rule — rather than a
   * greyed button that never says which row is wrong.
   */
  function importWorkers(): void {
    const file = importFile
    if (!file) return
    if (file.failsAtRow !== null) {
      setImportRefusal(file.failureRule)
      setLastAction(null)
      setAuditFailure(null)
      return
    }
    const created: readonly Worker[] = file.rows.map((row, index) => ({
      id: `WKR-IMP-${index}`,
      name: row.name,
      platformLogin: null,
      workerType: row.workerType,
      instructionDifficulty: row.instructionDifficulty,
      homeAreaId: row.homeAreaId,
      state: 'active',
      revalidationPending: false,
      activeRunIds: [],
      upcomingRunIds: [],
      note: `Imported from ${file.fileName} in this storyboard run.`,
    }))
    commit(
      AUDIT_SENTENCE.importWorkers(file, created),
      () => setWorkers((current) => [...current, ...created]),
    )
  }

  function saveGateSettings(): void {
    const nextPosture = postureDraft === 'notify-only' ? 'notify-only' : 'strict'
    const nextLadder =
      ladderResult !== null && !isLadderRefusal(ladderResult) ? ladderResult : warningLadder
    commit(
      AUDIT_SENTENCE.saveGateSettings(nextPosture, durationValue, nextLadder),
      () => {
        setGatePosture(nextPosture)
        setClearanceValidForDays(durationValue)
        setWarningLadder(nextLadder)
        setPostureDraft(null)
        setDurationDraft(null)
        setEarlierStageDraft('')
      },
    )
  }

  /**
   * The cross-surface handoff. It routes and records that it routed; it does
   * NOT grant, and it writes no clearance into this workspace. D23 keeps the
   * Hub free of a grant control for every role, so what a press produces is a
   * routing record in its true state and a plain statement that nothing was
   * granted here.
   */
  function takeHandoff(what: string): void {
    commit(
      AUDIT_SENTENCE.takeHandoff(what, effectiveHandoffAreaId, effectiveHandoffShiftId),
      () =>
        setHandoffsTaken((current) => [
          ...current,
          `${what} — ${areaNameFor(effectiveHandoffAreaId)} on ${shiftNameFor(effectiveHandoffShiftId)}, routed and recorded, granting nothing`,
        ]),
    )
  }

  /* -------------------------------------------------------------- *
   * The refusal renderings, by rule.
   * -------------------------------------------------------------- */
  function absentFor(label: string): RoleRefusal {
    return {
      kind: 'absent',
      note: `${label} is not held by the ${roleName} in any scope on this module, and this build draws nothing where it would sit.${ABSENT_NOTE_SUFFIX}`,
    }
  }

  /**
   * D10 and FB-QUAL-005. The clearance handoffs are the ONE place on this
   * screen where a refusal names a different holder to route to, so they are
   * the one place a refused control renders disabled with its reason rather
   * than absent. The Auditor is not given a disabled control here: their cause
   * is named once for the whole screen, and restating it beside each control
   * would be a second, coarser statement of a refusal already explained.
   */
  function clearanceRefusalFor(controlId: WorkerControlId): RoleRefusal {
    if (role === 'TENANT_ADMIN') {
      return {
        kind: 'disabled',
        reason:
          'The Tenant Admin may not grant a clearance of any kind — expired certification, never-held qualification or second in an Area on a shift. This is disabled rather than absent, and deliberately so: the control exists on this same screen for the Supervisor and the Quality Manager, and the rule teaches itself at the moment it binds. The tenant’s most privileged role sits OUTSIDE the safety-exception path, because the exception is a safety judgement rather than an administrative one (D10).',
      }
    }
    if (role === 'SUPERVISOR' && controlId === 'clear-never-held') {
      return {
        kind: 'disabled',
        reason:
          'Requires Quality Manager authorisation. A never-held qualification has never been assessed for this person at all, so clearing it is a different act from clearing one that has lapsed, and the Supervisor may not take it. The primary failure this guards against is a supervisor believing they can authorise; the disabled control with its reason is the first fallback, and an attempt made through a service path is itself recorded as an audit event (FB-QUAL-005).',
      }
    }
    if (role === 'SUPERVISOR' && controlId === 'clear-second-in-area-on-shift') {
      return {
        kind: 'disabled',
        reason:
          'Routes to the Quality Manager. A second clearance in the same Area on the same shift is escalated regardless of which worker it concerns, because repeated exceptions in one Area are a signal about the AREA rather than about anybody working in it (FB-QUAL-005, and the escalation key is Area and Shift).',
      }
    }
    return absentFor('A clearance handoff')
  }

  /* -------------------------------------------------------------- *
   * Tables.
   * -------------------------------------------------------------- */
  const registerRows: readonly TableRow[] = registerWorkers.map((worker) => {
    const areas = workerAreaIds(worker, qualifications).map(areaNameFor)
    // Read through the same chip the record banner reads, so the register and
    // the record can never disagree about whether somebody has a certificate
    // in force — and so a clearance still queued on a device silences neither.
    const expired = qualificationsFor(worker.id, qualifications).some(
      (q) => chipFor(q, clearances) === 'Expired',
    )
    return {
      worker: (
        <>
          <button
            type="button"
            onClick={() => pickWorker(worker.id)}
            aria-current={worker.id === selectedWorker?.id ? 'true' : undefined}
            className={`block text-left font-medium underline ${
              worker.id === selectedWorker?.id
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-ink)]'
            }`}
          >
            {worker.name}
          </button>
          <span className="block text-xs text-[var(--color-ink-subtle)]">{worker.id}</span>
        </>
      ),
      account: worker.platformLogin ?? 'No platform account — a Worker is not a User',
      type: worker.workerType,
      difficulty:
        worker.instructionDifficulty ??
        'not set — record incomplete, cannot receive assignments',
      areas: areas.join(', '),
      qualification: expired ? (
        <StatusPill tone="blocked" icon="●" label="one expired" />
      ) : (
        <StatusPill tone="ok" icon="●" label="none expired" />
      ),
      state: (
        <StatusPill
          tone={worker.state === 'active' ? 'ok' : worker.state === 'archived' ? 'neutral' : 'info'}
          icon={worker.state === 'active' ? '●' : '◌'}
          label={worker.state}
        />
      ),
    }
  })

  const qualificationRows: readonly TableRow[] = selectedQualifications.map((qual) => {
    const chip = chipFor(qual, clearances)
    return {
      certification: (
        <>
          <button
            type="button"
            onClick={() => changeScenario(() => setPickedQualId(qual.id))}
            aria-current={qual.id === selectedQual?.id ? 'true' : undefined}
            className={`block text-left font-medium underline ${
              qual.id === selectedQual?.id
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-ink)]'
            }`}
          >
            {certificationLabelFor(qual.certificationId)}
          </button>
          <span className="block text-xs text-[var(--color-ink-subtle)]">{qual.id}</span>
        </>
      ),
      areas: qual.areaIds.map(areaNameFor).join(', '),
      certificationDate: (
        <>
          <span>{qual.certificationDate}</span>
          {entryIsLate(qual) ? (
            <span className="block text-xs text-[var(--color-ink-subtle)]">
              entered {qual.entryDate} — a late entry, recorded as one rather than as a gap
            </span>
          ) : null}
        </>
      ),
      entryDate: qual.entryDate,
      expiry: (
        <>
          <span>{qual.expiryDate}</span>
          {qual.renewedFromExpiry !== null ? (
            <span className="block text-xs text-[var(--color-ink-subtle)]">
              postdates {qual.renewedFromExpiry}
            </span>
          ) : null}
        </>
      ),
      chip: (
        <>
          <StatusPill tone={CHIP_TONE[chip]} icon="●" label={chip} />
          <span className="block text-xs text-[var(--color-ink-subtle)]">
            {qualificationStateFor(qual)}
          </span>
        </>
      ),
    }
  })

  const clearanceRows: readonly TableRow[] = visibleClearances.map((clearance) => ({
    clearance: (
      <>
        <span className="font-medium">{clearance.id}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">
          {certificationLabelFor(clearance.certificationId)}
        </span>
      </>
    ),
    where: `${areaNameFor(clearance.areaId)} · ${shiftNameFor(clearance.shiftId)}`,
    grantedBy: roleById(clearance.grantedByRole).name,
    why: (
      <>
        <span>{CLEARANCE_REASON_LABEL[clearance.reasonCode]}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{clearance.reasonText}</span>
      </>
    ),
    when: (
      <>
        <span>{clearance.grantedAt}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">
          {clearance.lapsedAt === null
            ? `runs for ${clearance.validForDays} days`
            : `lapsed ${clearance.lapsedAt}`}
        </span>
      </>
    ),
    state: <StatusPill tone="info" icon="●" label={clearance.state} />,
    command: (
      <>
        <CommandStateBadge state={clearance.commandState} />
        <span className="block text-xs text-[var(--color-ink-subtle)]">
          {clearanceIsEffective(clearance)
            ? 'applied on the device, so the qualification may read Cleared'
            : 'not applied, so nothing here renders as effective'}
        </span>
      </>
    ),
  }))

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: (
      <>
        <span className="font-medium">{row.control}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
      </>
    ),
    admin: (
      <StatusPill tone={STATUS_TONE[row.status.TENANT_ADMIN]} icon="●" label={row.status.TENANT_ADMIN} />
    ),
    supervisor: (
      <StatusPill tone={STATUS_TONE[row.status.SUPERVISOR]} icon="●" label={row.status.SUPERVISOR} />
    ),
    quality: (
      <StatusPill
        tone={STATUS_TONE[row.status.QUALITY_MANAGER]}
        icon="●"
        label={row.status.QUALITY_MANAGER}
      />
    ),
    auditor: (
      <StatusPill
        tone={STATUS_TONE[row.status.READONLY_AUDITOR]}
        icon="●"
        label={row.status.READONLY_AUDITOR}
      />
    ),
    worker: <StatusPill tone={STATUS_TONE[row.status.WORKER]} icon="●" label={row.status.WORKER} />,
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
        stale, failed and recovering are the three ways a lost connection lands here (D7).
      </p>
    </section>
  )

  return (
    <HubShell
      module={MODULE}
      role={role}
      onRoleChange={(next) => changeScenario(() => setRole(next))}
      tenantState={tenantState}
    >
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotations only, never route keys (D1): SCR-DOH-07, the worker list, and SCR-DOH-08,
        the worker record and its qualifications, in the canonical catalogue. Storyboard SB-DOH-016
        fixes the record&rsquo;s four regions and its banner copy. Control matrix L27470-L27484,
        fifteen rows and all five columns.
      </p>

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
          On MOD-DOH-04: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, createDecision, roleName)}</div>
      </section>

      {readOnlyCause !== null ? (
        <section aria-label="Read-only" className="mt-6">
          <p className="text-sm font-medium">STATE-06 — Read-only</p>
          <div className="mt-2">
            <ScreenStateBoundary state="STATE-06" surface="SURF-DOH" detail={{ readOnlyCause }} />
          </div>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            One banner, one cause. It is not restated beside each control below.
          </p>
        </section>
      ) : null}

      {/* -------------------------------------------------------- *
          SCR-DOH-07 — the worker list.
          -------------------------------------------------------- */}
      <section aria-label="Worker register" className="mt-6">
        <h2 className="text-lg font-semibold">Worker register</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Everybody on this workspace&rsquo;s register, with the Areas their qualifications reach.
          Viewing as {roleName}: {scopeLabelFor(role)}
        </p>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The read is decided per control like every other affordance here, and its decision for this
          persona is {viewDecision.outcome}. A WORKER IS NOT A USER: the login column is the link to
          an account the permissions module owns, and a blank one is a real state — somebody can be
          on this register with no account anywhere. Nothing in this table counts, rates, ranks,
          times or compares anybody.
        </p>
        <div className="mt-3 max-w-sm">
          <Select
            label="Filter the register by Area"
            value={effectiveAreaFilter}
            options={[
              { value: 'all', label: 'Every Area in scope' },
              ...scopedAreas.map((a) => ({ value: a.id, label: a.name })),
            ]}
            onChange={(value) => changeScenario(() => setAreaFilter(value))}
          />
        </div>
        <div className="mt-3">
          <Table
            caption={`Workers, ${
              effectiveAreaFilter === 'all' ? 'every Area in scope' : areaNameFor(effectiveAreaFilter)
            }`}
            columns={[
              { key: 'worker', header: 'Person' },
              { key: 'account', header: 'Platform login' },
              { key: 'type', header: 'worker_type' },
              { key: 'difficulty', header: 'Instruction-difficulty profile' },
              { key: 'areas', header: 'Areas reached' },
              { key: 'qualification', header: 'Certification standing' },
              { key: 'state', header: 'Record state' },
            ]}
            rows={registerRows}
            loading={loading}
            {...(readFailed
              ? {
                  error:
                    'The read of this workspace’s worker register failed. Nothing was written, and no change is waiting to be sent.',
                }
              : {})}
            emptyState={{
              title:
                effectiveAreaFilter === 'all'
                  ? 'This workspace holds nobody on its worker register.'
                  : `${areaNameFor(effectiveAreaFilter)} holds nobody.`,
              whatCreatesIt:
                'A Tenant Admin or a Supervisor records one below, or imports a file from the canonical template. Until somebody is qualified for an Area, no run there can be staffed.',
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
            Register as of {REGISTER_AS_OF}. Every warning stage below is read from a recorded number
            of days rather than from a clock: this storyboard reads no clock at all.
          </p>
        )}

        <div className="mt-4 max-w-lg space-y-3">
          <h3 className="text-base font-semibold">Record a worker</h3>
          <Field
            label="Name"
            {...(newNameError !== null ? { error: newNameError } : {})}
            description="Free text. The source fixes no format for it, so nothing here refuses a value except a blank one."
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
            />
          </Field>
          <Select
            label="worker_type"
            value={newType}
            options={[
              { value: 'employee', label: 'employee' },
              { value: 'contractor', label: 'contractor' },
            ]}
            onChange={setNewType}
          />
          <Select
            label="Instruction-difficulty profile for the new record"
            value={newDifficulty}
            options={INSTRUCTION_DIFFICULTIES.map((d) => ({ value: d, label: d }))}
            onChange={setNewDifficulty}
          />
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            The label distinguishes contractor from employee inside one record type and produces no
            operational difference at this version — it is carried because the record carries it, not
            because anything branches on it.
          </p>
          <WriteControl
            label="Create a worker record"
            decision={createDecision}
            roleName={roleName}
            roleRefusal={absentFor('Creating or editing a worker record')}
            gateReason={tenantGate('create-worker')}
            objectReason={newNameError}
            onAct={createWorker}
          />
        </div>
      </section>

      {/* -------------------------------------------------------- *
          SCR-DOH-08 — the worker record, SB-DOH-016's four regions.
          -------------------------------------------------------- */}
      <section aria-label="Worker record" className="mt-6">
        <h2 className="text-lg font-semibold">Worker record</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The storyboard fixes four regions: {RECORD_REGIONS.map((r) => r.name).join(', ')}. Select a
          person in the register above to load theirs.
        </p>

        {selectedWorker === undefined ? (
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            No record is selected, because none is in view.
          </p>
        ) : (
          <>
            {hasExpiredQualification && !notifyOnly ? (
              <div
                role="note"
                className="mt-3 max-w-prose rounded-[var(--radius-control)] border-2 border-[var(--color-status-blocked)] p-3 text-sm font-medium text-[var(--color-ink)]"
              >
                {EXPIRED_BANNER_COPY}
              </div>
            ) : null}
            {hasExpiredQualification && notifyOnly ? (
              <div
                role="note"
                className="mt-3 max-w-prose rounded-[var(--radius-control)] border border-[var(--color-status-attention)] p-3 text-sm text-[var(--color-ink)]"
              >
                {NOTIFY_ONLY_EXPIRY_NOTICE}
              </div>
            ) : null}

            <h3 className="mt-4 text-base font-semibold">Identity</h3>
            <p className="text-sm">
              <span className="font-medium">{selectedWorker.name}</span> ({selectedWorker.id}) —{' '}
              {selectedWorker.workerType}, record state {selectedWorker.state}
            </p>
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              Platform login:{' '}
              {selectedWorker.platformLogin ??
                'none. A Worker is not a User: the account object belongs to another module, and this record links to it rather than being it. Somebody can be on the register with no account at all.'}
            </p>
            <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
              {selectedWorker.note}
            </p>
            {selectedWorker.revalidationPending ? (
              <p
                role="note"
                className="mt-2 max-w-prose rounded-[var(--radius-control)] border border-[var(--color-status-attention)] p-3 text-sm"
              >
                Re-validation prompt standing: this record was reactivated, and every prior
                qualification is held pending until somebody says which ones still apply. Nothing is
                silently re-trusted. The source names this prompt and names no control that answers
                it, so none is drawn — the question is recorded below rather than answered by an
                invented control.
              </p>
            ) : null}

            <div className="mt-4 max-w-lg space-y-3">
              <Select
                label="Instruction-difficulty profile"
                value={effectiveDifficulty === '' ? 'unset' : effectiveDifficulty}
                options={[
                  { value: 'unset', label: 'not set — record incomplete' },
                  ...INSTRUCTION_DIFFICULTIES.map((d) => ({ value: d, label: d })),
                ]}
                onChange={(value) => setDifficultyDraft(value === 'unset' ? '' : value)}
              />
              {difficultyError !== null ? (
                <ScreenStateBoundary
                  state="STATE-04"
                  surface="SURF-DOH"
                  detail={{
                    fieldLabel: 'The instruction-difficulty profile',
                    rule: difficultyError,
                    permittedFormat: `Exactly one of ${INSTRUCTION_DIFFICULTIES.join(', ')}. There is no fourth level for a control to offer, and no default is applied on the record's behalf.`,
                  }}
                />
              ) : null}
              <WriteControl
                label="Set the instruction-difficulty profile"
                decision={difficultyDecision}
                roleName={roleName}
                roleRefusal={absentFor('Setting the instruction-difficulty profile')}
                gateReason={tenantGate('edit-configuration')}
                objectReason={difficultyError}
                onAct={setInstructionDifficulty}
              />
            </div>

            <h3 className="mt-6 text-base font-semibold">Qualifications</h3>
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              Every certificate on this record, with its per-Area scope, both of its dates, its
              expiry and the chip SB-DOH-016 fixes. A qualification may scope to Areas under
              different Sites of this tenant.
            </p>
            <div className="mt-2">
              <Table
                caption={`Qualifications held by ${selectedWorker.name}`}
                columns={[
                  { key: 'certification', header: 'Certification type' },
                  { key: 'areas', header: 'Area scope' },
                  { key: 'certificationDate', header: 'Certification date' },
                  { key: 'entryDate', header: 'Entry date' },
                  { key: 'expiry', header: 'Expiry' },
                  { key: 'chip', header: 'State' },
                ]}
                rows={qualificationRows}
                emptyState={{
                  title: 'This record holds no qualification.',
                  whatCreatesIt:
                    'A Tenant Admin or a Supervisor enters one below. Without one, no gated work in any Area can be assigned to this person.',
                }}
              />
            </div>

            <div className="mt-4 max-w-lg space-y-3">
              <h4 className="text-sm font-semibold">Enter a qualification</h4>
              <Select
                label="Certification type"
                value={entryCertId}
                options={SEEDED_CERTIFICATION_TYPES.map((c) => ({ value: c.id, label: c.name }))}
                onChange={setEntryCertId}
              />
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                Chosen from the seeded list and never typed: the certification type is a gate input
                and is protected as configuration rather than free text. Who creates a type, and on
                which screen, is stated nowhere in the source — so no create, edit or retire control
                is drawn for one anywhere in this build (D22).
              </p>
              <fieldset className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
                <legend className="px-1 text-sm font-medium">Per-Area scope</legend>
                {scopedAreas.length === 0 ? (
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    No Area is in this persona&rsquo;s scope, so there is nothing to scope a
                    qualification to.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {scopedAreas.map((area) => (
                      <Checkbox
                        key={area.id}
                        label={`Scope to ${area.name}`}
                        checked={effectiveEntryAreaIds.includes(area.id)}
                        onChange={() =>
                          setEntryAreaIds(
                            entryAreaIds.includes(area.id)
                              ? entryAreaIds.filter((a) => a !== area.id)
                              : [...entryAreaIds, area.id],
                          )
                        }
                      />
                    ))}
                  </div>
                )}
                {entryAreaError !== null ? (
                  <p className="mt-2 max-w-prose text-xs text-[var(--color-status-blocked)]">
                    {entryAreaError}
                  </p>
                ) : null}
              </fieldset>
              <div className="flex flex-wrap gap-4">
                <Field
                  label="Certification date"
                  {...(entryDateError !== null ? { error: entryDateError } : {})}
                  description="May be back-dated. Both this and the entry date are recorded."
                >
                  <input
                    type="date"
                    value={entryCertDate}
                    onChange={(e) => setEntryCertDate(e.target.value)}
                    className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <Field label="Entry date" description="When the platform received it.">
                  <input
                    type="date"
                    value={entryEntryDate}
                    onChange={(e) => setEntryEntryDate(e.target.value)}
                    className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <Field label="Expiry date">
                  <input
                    type="date"
                    value={entryExpiryDate}
                    onChange={(e) => setEntryExpiryDate(e.target.value)}
                    className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <Field
                  label="Days from the register stamp to that expiry"
                  {...(entryDaysError !== null ? { error: entryDaysError } : {})}
                  description="This storyboard reads no clock, so the warning stage is recorded rather than computed. Enter 6 to see the 7-day stage."
                >
                  <input
                    type="number"
                    value={entryDaysToExpiry}
                    onChange={(e) => setEntryDaysToExpiry(e.target.value)}
                    className="w-32 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
              </div>
              <WriteControl
                label="Enter a qualification"
                decision={enterQualDecision}
                roleName={roleName}
                roleRefusal={absentFor('Entering a qualification')}
                gateReason={tenantGate('edit-configuration')}
                objectReason={entryAreaError ?? entryDateError ?? entryDaysError}
                onAct={enterQualification}
              />
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                SELF-ATTESTATION IS IMPOSSIBLE BY CONSTRUCTION, not by a permission check somebody
                could reconfigure: no worker-role path reaches this control, on this surface, on the
                mobile application, or through any programming interface. The Quality Manager cannot
                reach it either, and that is deliberate — the role that may clear a block is not the
                role that enters the certificate creating one. A first entry is treated here as a
                configuration write, so it closes under soft suspension while a recertification
                stays open; the source attaches its stay-open note to recertification alone, and the
                stricter reading is recorded below rather than adopted silently.
              </p>
            </div>

            <div className="mt-4 max-w-lg space-y-3">
              <h4 className="text-sm font-semibold">Record a recertification</h4>
              {selectedQual === undefined ? (
                <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                  Select a qualification in the table above to recertify one.
                </p>
              ) : (
                <p className="text-sm">
                  Recertifying{' '}
                  <span className="font-medium">
                    {certificationLabelFor(selectedQual.certificationId)}
                  </span>
                  , whose current expiry is {selectedQual.expiryDate}.
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                <Field
                  label="New expiry"
                  {...(recertRefusal !== null ? { error: recertRefusal } : {})}
                  description="Must postdate the previous expiry. Nothing partial is written if it does not."
                >
                  <input
                    type="date"
                    value={recertExpiry}
                    onChange={(e) => setRecertExpiry(e.target.value)}
                    className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <Field label="New certification date" description="Back-dating is allowed.">
                  <input
                    type="date"
                    value={recertCertDate}
                    onChange={(e) => setRecertCertDate(e.target.value)}
                    className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <Field label="New entry date">
                  <input
                    type="date"
                    value={recertEntryDate}
                    onChange={(e) => setRecertEntryDate(e.target.value)}
                    className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <Field
                  label="Days from the register stamp to the new expiry"
                  {...(recertDaysError !== null ? { error: recertDaysError } : {})}
                >
                  <input
                    type="number"
                    value={recertDays}
                    onChange={(e) => setRecertDays(e.target.value)}
                    className="w-32 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
              </div>
              {recertRefusal !== null && recertExpiry.trim().length > 0 ? (
                <ScreenStateBoundary
                  state="STATE-04"
                  surface="SURF-DOH"
                  detail={{
                    fieldLabel: 'The new expiry',
                    rule: recertRefusal,
                    permittedFormat:
                      'A date strictly after the expiry it replaces. Nothing partial is written when it is refused: the existing qualification state stands exactly as it was, because a worker left unqualified is safer than one left half-qualified.',
                  }}
                />
              ) : null}
              <WriteControl
                label="Record a recertification"
                decision={recertDecision}
                roleName={roleName}
                roleRefusal={absentFor('Recording a recertification')}
                gateReason={recertGate}
                objectReason={
                  selectedQual === undefined
                    ? 'Select a qualification in the table above before recertifying one.'
                    : (recertRefusal ?? recertDaysError)
                }
                onAct={recordRecertification}
              />
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                Recertification STAYS OPEN under soft suspension while record creation closes,
                because it operates the existing account rather than growing it — and it is BLOCKED
                under hard suspension, which is D16 and the most operationally dangerous silence in
                this slice. Select the hard-suspended state above to meet the refusal and read the
                consequence in the reason itself.
              </p>
            </div>

            <h3 className="mt-6 text-base font-semibold">Clearances on this record</h3>
            {selectedClearances.length === 0 ? (
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                No clearance has been granted for this person. A clearance is the sanctioned, audited
                exception to a qualification block — the platform&rsquo;s replacement for the
                informal override — and it is granted on another surface entirely.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {selectedClearances.map((clearance) => (
                  <li key={clearance.id} className="text-sm">
                    <span className="font-medium">{clearance.id}</span> —{' '}
                    {CLEARANCE_REASON_LABEL[clearance.reasonCode]}, &ldquo;{clearance.reasonText}
                    &rdquo;, granted by the {roleById(clearance.grantedByRole).name} at{' '}
                    {clearance.grantedAt} on {areaNameFor(clearance.areaId)} ·{' '}
                    {shiftNameFor(clearance.shiftId)}.{' '}
                    {clearance.lapsedAt === null
                      ? `Runs for ${clearance.validForDays} days.`
                      : `Lapsed ${clearance.lapsedAt}.`}{' '}
                    <StatusPill tone="info" icon="●" label={clearance.state} />{' '}
                    <CommandStateBadge state={clearance.commandState} />
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-6 text-base font-semibold">Activity, and the two-step departure</h3>
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              The runs assigned right now, which is also the departure flow&rsquo;s first step. These
              are named references and an object-state condition on archival — this screen holds no
              completed-run history, no figure and no comparison, because a count of somebody&rsquo;s
              work is a measure of them and a list of what must be reassigned is not.
            </p>
            {selectedWorker.activeRunIds.length + selectedWorker.upcomingRunIds.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                No run is assigned, so step one has nothing to do and step two is offered.
              </p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {selectedWorker.activeRunIds.map((id) => (
                  <li key={id}>{id} — active</li>
                ))}
                {selectedWorker.upcomingRunIds.map((id) => (
                  <li key={id}>{id} — upcoming</li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap items-start gap-4">
              <WriteControl
                label="Reassign this worker’s runs"
                decision={archiveDecision}
                roleName={roleName}
                roleRefusal={absentFor('Departing a worker')}
                gateReason={tenantGate('edit-configuration')}
                objectReason={
                  selectedWorker.activeRunIds.length + selectedWorker.upcomingRunIds.length === 0
                    ? 'No run is assigned to this person, so there is nothing to reassign. Step two is offered instead.'
                    : null
                }
                onAct={reassignRuns}
              />
              <WriteControl
                label="Archive this worker"
                decision={archiveDecision}
                roleName={roleName}
                roleRefusal={absentFor('Archiving a worker')}
                gateReason={tenantGate('edit-configuration')}
                objectReason={
                  selectedWorker.state === 'archived'
                    ? 'This record is already archived.'
                    : selectedWorker.activeRunIds.length + selectedWorker.upcomingRunIds.length > 0
                      ? `Departure is a two-step flow and step one has not run: ${[
                          ...selectedWorker.activeRunIds,
                          ...selectedWorker.upcomingRunIds,
                        ].join(', ')} are still assigned. Reassign them first; the order is enforced by what is offered rather than by a warning after the fact.`
                      : null
                }
                onAct={archiveWorker}
              />
              <WriteControl
                label="Reactivate this worker"
                decision={reactivateDecision}
                roleName={roleName}
                roleRefusal={absentFor('Reactivating a departed worker')}
                gateReason={tenantGate('edit-configuration')}
                objectReason={
                  selectedWorker.state === 'archived'
                    ? null
                    : 'This record is not archived, so there is nothing to reactivate. Reactivation reinstates a departed record with its history intact and always raises the re-validation prompt.'
                }
                onAct={reactivateWorker}
              />
            </div>
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Departure reassigns the active and upcoming runs first, then archives; open step
              executions close as abandoned with the reason &ldquo;Worker departed.&rdquo;
              Re-employment reactivates the prior record — history intact — and the re-validation
              prompt is mandatory rather than offered.
            </p>
          </>
        )}
      </section>

      {/* -------------------------------------------------------- *
          Bulk import.
          -------------------------------------------------------- */}
      <section aria-label="Bulk import" className="mt-6">
        <h2 className="text-lg font-semibold">Bulk import</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One canonical comma-separated-values template, all-or-nothing per file. Its columns are{' '}
          {CANONICAL_IMPORT_COLUMNS.join(', ')}. No per-tenant column mapping control is drawn for
          anybody: mapping a tenant&rsquo;s own source file into this template is the client&rsquo;s
          onboarding operation, outside the platform.
        </p>
        <div className="mt-3 max-w-lg space-y-3">
          <Select
            label="File to import"
            value={importFileId}
            options={SEEDED_IMPORT_FILES.map((f) => ({ value: f.id, label: f.fileName }))}
            onChange={(value) => changeScenario(() => setImportFileId(value))}
          />
          {importFile !== undefined ? (
            <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">{importFile.note}</p>
          ) : null}
          <WriteControl
            label="Import workers from the canonical template"
            decision={importDecision}
            roleName={roleName}
            roleRefusal={absentFor('Bulk importing workers')}
            gateReason={tenantGate('create-worker')}
            objectReason={null}
            onAct={importWorkers}
          />
        </div>
      </section>

      {/* -------------------------------------------------------- *
          The ladder and its audiences.
          -------------------------------------------------------- */}
      <section aria-label="The expiry ladder" className="mt-6">
        <h2 className="text-lg font-semibold">The expiry ladder and its audiences</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Four stages, at {MANDATORY_EXPIRY_LADDER.join(', ')} days before expiry and at expiry
          itself. A tenant may add EARLIER stages and may never remove or delay one. This build holds
          that direction as an interface rather than as a warning: the only function that touches the
          ladder returns a strict superset of the mandatory four or a stated refusal, and no remove,
          delay or reorder function exists anywhere for anything to call.
        </p>
        <p className="mt-2 text-sm">
          This workspace warns at:{' '}
          <span className="font-medium">{warningLadder.join(', ')} days</span>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          <li>
            <span className="font-medium text-[var(--color-ink)]">Supervisor and Tenant Admin</span>{' '}
            — each stage, directly.
          </li>
          <li>
            <span className="font-medium text-[var(--color-ink)]">Quality Manager</span> — the expiry
            picture as a section of the per-shift digest, rather than four separate alerts.
          </li>
          <li>
            <span className="font-medium text-[var(--color-ink)]">Each worker</span> — their own
            certifications only, on the device. They hold no Hub screen, and the cost of that is
            stated rather than hidden: a worker without a device in hand cannot check their own
            expiry (D11).
          </li>
        </ul>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Qualification expiry is part of the mandatory notification baseline and always fires; it
          cannot be disabled, and no control to disable it is drawn for any role. No notification in
          this module IS the enforcement — the enforcement is the server-side assignment block and
          the on-device step-level gate.
        </p>
      </section>

      {/* -------------------------------------------------------- *
          Escalation — the (Area, Shift) key.
          -------------------------------------------------------- */}
      <section aria-label="Escalation resolution" className="mt-6">
        <h2 className="text-lg font-semibold">Escalation, resolved on shift</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          On an expiry event the supervisor is notified immediately. Unacknowledged for the
          configurable window, default {ESCALATION_WINDOW_DEFAULT}, it escalates to the{' '}
          {roleById(escalation.targetRole).name} — resolved against the roles on shift.
        </p>
        <p className="mt-2 text-sm">
          Escalation key: ({ESCALATION_KEY.join(', ')}) ={' '}
          <span className="font-medium">
            {areaNameFor(effectiveHandoffAreaId)}, {shiftNameFor(effectiveHandoffShiftId)}
          </span>{' '}
          {escalation.markedAsFallback ? (
            <StatusPill tone="attention" icon="▲" label="fallback, and marked as one" />
          ) : (
            <StatusPill tone="ok" icon="●" label="resolved on shift" />
          )}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">{escalation.note}</p>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The key is a pair of configuration objects and never a person. This module resolves a ROLE
          against the roles on shift and holds no roster of named individuals at all — so there is no
          per-person routing here to get wrong, and nothing to key a measure on even by accident.
          Change the Area and Shift in the handoff panel below to move the resolution.
        </p>
      </section>

      {/* -------------------------------------------------------- *
          The clearance register — D23. Read-only, no grant control.
          -------------------------------------------------------- */}
      <section aria-label="Clearance register" className="mt-6">
        <h2 className="text-lg font-semibold">Clearance register</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The full corpus, with who granted, for whom, where, why, when granted and when lapsed. Its
          decision for this persona is {corpusDecision.outcome}.
        </p>
        <div className="mt-2">
          <ScreenStateBoundary
            state="STATE-06"
            surface="SURF-DOH"
            detail={{
              readOnlyCause:
                'This register is read-only in the Hub for every role, the Quality Manager included, and the cause is D23 rather than any suspension: the Hub owns the clearance record and its enforcement, and the granting act is Client Command Center action number ten. No grant control is drawn here for anybody, and no control edits a recorded clearance for anybody either — the corpus is the evidence that an exception was made, and evidence that can be edited is not evidence.',
            }}
          />
        </div>
        <div className="mt-3">
          <Table
            caption="Clearances across time, by Area and by role"
            columns={[
              { key: 'clearance', header: 'Clearance' },
              { key: 'where', header: 'Area and Shift' },
              { key: 'grantedBy', header: 'Granting role' },
              { key: 'why', header: 'Reason' },
              { key: 'when', header: 'Granted and lapsed' },
              { key: 'state', header: 'Clearance state' },
              { key: 'command', header: 'Command state on the device' },
            ]}
            rows={clearanceRows}
            loading={loading}
            emptyState={{
              title: 'No clearance has ever been granted in this workspace.',
              whatCreatesIt:
                'A Supervisor or a Quality Manager grants one on the Client Command Center; the Hub records it and enforces it.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The corpus is cut by AREA and by ROLE and never by worker. A per-worker cut and a
          per-worker ranking are the named prohibited uses: frequent clearances usually indicate a
          certification-planning failure rather than a worker failure, and re-cutting this data per
          person carries a high bias risk. That is why the granting ROLE is a column and no column
          here totals, rates or ranks anybody.
        </p>
        <div className="mt-3">
          <ScreenStateBoundary
            state="STATE-09"
            surface="SURF-DOH"
            detail={{ commandState: 'queued' }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          STATE-09, and the one place in this slice where the fifteen device command states are
          load-bearing: a clearance renders in its TRUE command state and never as applied until the
          device acknowledges it. The queued clearance above covers an expired certification, and
          that certification still reads Expired on its own record — no surface shows a clearance as
          effective before its command reaches applied on the device.
        </p>
      </section>

      {/* -------------------------------------------------------- *
          The cross-surface handoff — D10. Not a grant control.
          -------------------------------------------------------- */}
      <section aria-label="Clearance handoff" className="mt-6">
        <h2 className="text-lg font-semibold">Handoff to the surface that grants</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          D23 and D10 govern different controls and both hold. The register above is read-only and
          mints no grant control for anybody; these three are the cross-surface route to the Client
          Command Center, where action number ten actually grants. Pressing one records that the
          handoff was taken and grants nothing — this storyboard reaches no Command Center.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <Select
            label="Area for this handoff"
            value={effectiveHandoffAreaId}
            options={scopedAreas.map((a) => ({ value: a.id, label: a.name }))}
            onChange={(value) => changeScenario(() => setHandoffAreaId(value))}
          />
          {handoffShifts.length === 0 ? (
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              This Area is bound to no Shift, so the escalation key has no second half here. An Area
              with no bound Shift can receive no Job either, which is the same gap seen from the
              other side.
            </p>
          ) : (
            <Select
              label="Shift for this handoff"
              value={effectiveHandoffShiftId}
              options={handoffShifts.map((s) => ({ value: s.id, label: s.name }))}
              onChange={(value) => changeScenario(() => setHandoffShiftId(value))}
            />
          )}
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {areaNameFor(effectiveHandoffAreaId)} on {shiftNameFor(effectiveHandoffShiftId)}{' '}
          {pairAlreadyCleared
            ? `already holds ${clearancesOn(effectiveHandoffAreaId, effectiveHandoffShiftId, visibleClearances)
                .map((c) => c.id)
                .join(', ')}, so a further clearance there is a SECOND one and routes to the Quality Manager — regardless of which worker it concerns.`
            : 'holds no clearance yet, so a clearance there would be a first one and the second-clearance escalation does not fire.'}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A clearance granted from here would run for{' '}
          <span className="font-medium">{clearanceValidForDays} days</span> before it lapses
          automatically, which is the tenant setting held in the gate settings below rather than a
          fixed per-shift expiry. On lapse the qualification returns to Expired and never to Valid.
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <WriteControl
            label="Hand off: clear an expired certification"
            decision={clearExpiredDecision}
            roleName={roleName}
            roleRefusal={clearanceRefusalFor('clear-expired-certification')}
            gateReason={tenantGate('grant-clearance')}
            objectReason={
              notifyOnly
                ? 'Under the notify-only posture there is no block to clear. The same events raise immediate notifications to the supervisor and the Quality Manager and are flagged in the audit trail and the Execution Summary instead.'
                : role === 'SUPERVISOR' && pairAlreadyCleared
                  ? `This Area and this Shift already hold a clearance, so this would be a SECOND one and it routes to the Quality Manager — regardless of which worker it concerns. Repeated exceptions in one Area are a signal about the Area.`
                  : null
            }
            onAct={() => takeHandoff('expired-certification clearance')}
          />
          <WriteControl
            label="Hand off: clear a never-held qualification"
            decision={clearNeverHeldDecision}
            roleName={roleName}
            roleRefusal={clearanceRefusalFor('clear-never-held')}
            gateReason={tenantGate('grant-clearance')}
            objectReason={
              notifyOnly
                ? 'Under the notify-only posture there is no block to clear.'
                : null
            }
            onAct={() => takeHandoff('never-held-qualification clearance')}
          />
          <WriteControl
            label="Hand off: clear a second time in this Area on this shift"
            decision={clearSecondDecision}
            roleName={roleName}
            roleRefusal={clearanceRefusalFor('clear-second-in-area-on-shift')}
            gateReason={tenantGate('grant-clearance')}
            objectReason={
              notifyOnly
                ? 'Under the notify-only posture there is no block to clear.'
                : pairAlreadyCleared
                  ? null
                  : 'This Area and this Shift hold no clearance yet, so a clearance here would be a first one rather than a second. Choose a pair that already holds one.'
            }
            onAct={() => takeHandoff('second-in-Area-on-shift clearance')}
          />
        </div>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          An expired-certification clearance carries a mandatory categorised reason — Emergency
          cover, Training-in-progress or Other — with optional free text beside it, never instead of
          it, and the Quality Manager is notified on grant. A never-held one requires Quality Manager
          authorisation in addition to the reason code. Neither reason control is drawn here, because
          neither grant happens here.
        </p>
        <div className="mt-3">
          <SeamNotice seamId="qualification-gate" />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          THREE ENFORCEMENT POINTS, ONE OF THEM THIS SURFACE&rsquo;S. The qualification RECORD and
          its evaluator are built here. The gate at ASSIGNMENT is built too, in this slice, on the
          Worker Assignment screen: it runs server-side under the tenant&rsquo;s posture, so a
          failing check blocks under strict and proceeds with notifications under notify-only. The
          other two &mdash; at RUN START and at OVERRIDE-CARRYING SCREENS &mdash; are enforced on
          the device against the pinned work package, including offline, where a gate block parks
          the run and the worker continues their other assigned runs. That is stated by this
          module&rsquo;s own source rather than inferred: &ldquo;again at run start and at
          override-carrying screens on the device&rdquo; (L28112, restated L28136). Neither is a
          Delivery Operations Hub half of this seam, so neither is an outstanding gap here.
          Naming the seam is the honest alternative to a stub that would look built.
        </p>
        {handoffsTaken.length > 0 ? (
          <div className="mt-3">
            <h3 className="text-sm font-semibold">Handoffs taken in this storyboard run</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
              {handoffsTaken.map((entry, index) => (
                <li key={`${entry}-${String(index)}`}>{entry}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* -------------------------------------------------------- *
          The gate settings — this module's section of SCR-DOH-23.
          -------------------------------------------------------- */}
      <section aria-label="Qualification gate settings" className="mt-6">
        <h2 className="text-lg font-semibold">
          Qualification gate settings — this module&rsquo;s section of the tenant administration area
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The tenant administration area is a screen GROUP rather than a surface and is owned by no
          single module (D2); each module owns its own section, and this is ours. The qualification
          gate is the only configurable gate on the platform — the specification gates and the
          evaluation gate are hard and non-configurable.
        </p>
        <div className="mt-3 max-w-lg space-y-3">
          <Select
            label="Gate posture"
            value={postureDraft ?? gatePosture}
            options={GATE_POSTURES.map((p) => ({
              value: p,
              label: p === 'strict' ? 'strict — the platform default' : 'notify-only — the floor',
            }))}
            onChange={setPostureDraft}
          />
          <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
            {GATE_POSTURE_FLOOR} is the platform floor and no silent posture exists. There is no
            third option in this list and no disabled one either: the floor is held in the shape of
            the vocabulary rather than by a check this screen applies, so there is no weaker value
            for a control to write. A disabled third option would imply a weaker posture exists
            somewhere, and it does not.
          </p>
          <Field
            label="Clearance duration in days"
            {...(durationError !== null ? { error: durationError } : {})}
            description="A tenant setting, not a fixed per-shift expiry. A granted clearance lapses automatically at the end of it, and the qualification returns to Expired rather than to Valid."
          >
            <input
              type="number"
              value={durationDraft ?? String(clearanceValidForDays)}
              onChange={(e) => setDurationDraft(e.target.value)}
              className="w-32 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
            />
          </Field>
          <Field
            label="Add an earlier warning stage, in days before expiry"
            {...(ladderError !== null ? { error: ladderError } : {})}
            description={`Earlier means MORE days before expiry, so a stage must be greater than ${EARLIEST_MANDATORY_STAGE}. Leave it blank to change nothing.`}
          >
            <input
              type="number"
              value={earlierStageDraft}
              onChange={(e) => setEarlierStageDraft(e.target.value)}
              className="w-32 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
            />
          </Field>
          {ladderError !== null ? (
            <ScreenStateBoundary
              state="STATE-04"
              surface="SURF-DOH"
              detail={{
                fieldLabel: 'The warning stage',
                rule: ladderError,
                permittedFormat: `A whole number of days greater than ${EARLIEST_MANDATORY_STAGE} and not already on the ladder. The four mandatory stages always fire and no value can remove or delay one.`,
              }}
            />
          ) : null}
          <WriteControl
            label="Save the qualification gate settings"
            decision={postureDecision}
            roleName={roleName}
            roleRefusal={absentFor('Setting the gate posture or the clearance duration')}
            gateReason={tenantGate('edit-configuration')}
            objectReason={durationError ?? ladderError}
            onAct={saveGateSettings}
          />
        </div>
      </section>

      {/* -------------------------------------------------------- *
          Support, not surveillance — stated where it is enforced.
          -------------------------------------------------------- */}
      <section aria-label="Support not surveillance" className="mt-6">
        <h2 className="text-lg font-semibold">What may and may not be measured here</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This is the module where the line is hardest to hold, because everything on it is about a
          person. The line is not that a worker is never named — it is that a worker may be named for
          qualification, assignment and lifecycle purposes and may never be measured.
        </p>
        <ul className="mt-3 space-y-3">
          {MEASURE_RULES.map((rule) => (
            <li key={rule.id}>
              <p className="text-sm font-medium">
                {rule.id} — {rule.what}
              </p>
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">Individual level: </span>
                {rule.individualLevel}
              </p>
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">Prohibited use: </span>
                {rule.prohibitedUse}
              </p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{rule.sourceRef}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The prohibition is enforced in the shape of the data rather than asserted in this
          paragraph. No fixture behind this screen carries a count of runs, a total, a rate, a pace,
          a working duration, a score or a suitability figure; the record type itself fails to
          compile if one of the four likeliest such fields is added; and every key of every fixture
          array is swept by the shared person-measure matcher in the unit suite rather than by a
          fifth hand-written expression. The escalation keys on ({ESCALATION_KEY.join(', ')}), and
          the function answering it takes no worker at all — a caller who wanted to key it on a
          person would have to change its signature, which is a review-visible act.
        </p>
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
              unchanged, nothing was recorded, and no part of the change was kept. What was
              attempted: {auditFailure}
            </p>
          ) : importRefusal !== null ? (
            <p className="max-w-prose rounded-[var(--radius-control)] border border-[var(--color-status-attention)] p-3 text-sm text-[var(--color-ink)]">
              The import was refused and nothing was written. {importRefusal}
            </p>
          ) : lastAction !== null ? (
            <p className="max-w-prose rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-ink)]">
              {lastAction}
            </p>
          ) : null}
        </LiveRegion>
      </section>

      <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        Audit is written in the same transaction as the action — every qualification entry, every
        recertification with both dates, every clearance grant, use and lapse, every
        permission-relevant record change, every departure and reactivation, and every import
        outcome. If the audit write fails, the action fails with it and this screen says the action
        did not happen. An accepted action is never rendered as done ahead of its true state.
      </p>

      <section aria-label="Control matrix" className="mt-6">
        <h2 className="text-lg font-semibold">What each of the five tenant roles sees</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Fifteen controls, five roles, and an explicit status in every one of the seventy-five
          cells — a blank cell is an unanswered question an implementer would answer privately. Every
          affordance above is driven from this table alone. Two findings are worth reading twice: the
          Tenant Admin cannot grant a clearance of ANY kind, and the Quality Manager cannot ENTER a
          qualification while being able to clear every class of block. The entry authority and the
          exception authority are deliberately different people.
        </p>
        <div className="mt-3">
          <Table
            caption="MOD-DOH-04 control matrix, by tenant role"
            columns={[
              { key: 'control', header: 'Control' },
              { key: 'admin', header: 'Tenant Admin' },
              { key: 'supervisor', header: 'Supervisor' },
              { key: 'quality', header: 'Quality Manager' },
              { key: 'auditor', header: 'Read-only Auditor' },
              { key: 'worker', header: 'Read-only Worker column' },
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
          One cell in this whole matrix reads `unavailable` — the Worker on reading the clearance
          corpus — and it is that cell, and only that cell, that decides which roles the module rail
          offers this route to at all. `Explicitly prohibited` is deliberately NOT that token: it
          means the control exists on this screen and this role is not granted it, so the role opens
          the screen and meets a refusal it can read. Merging the two would either offer a route
          nobody may open or hide a control somebody holds. Whether a refused control should render
          as nothing at all or as a control disabled with its reason is UNSETTLED at the source, and
          the question is recorded as unresolved below rather than closed here.
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
          Three of the thirteen screen states cannot occur on MOD-DOH-04. They are named with their
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

/** Narrow a form value to the closed vocabulary. Anything else is `null`,
 *  which is the incomplete record rather than a silent default. */
function asDifficulty(value: string): InstructionDifficulty | null {
  return INSTRUCTION_DIFFICULTIES.find((d) => d === value) ?? null
}

/* ------------------------------------------------------------------ *
 * The write control. Four branches, applied in the order the rules
 * bind — role first, then the evaluator's own refusal, then the tenant
 * state gate, then the object's own condition. The role branch takes
 * its RENDERING from the caller, because this module is the one where
 * the two renderings genuinely differ by control: a refusal that names
 * a different holder to route to is disabled with that reason, and
 * every other refusal is absent.
 * ------------------------------------------------------------------ */
interface WriteControlProps {
  readonly label: string
  readonly decision: PermissionDecision
  readonly roleName: string
  readonly roleRefusal: RoleRefusal
  readonly gateReason: string | null
  readonly objectReason: string | null
  readonly onAct: () => void
}

function WriteControl({
  label,
  decision,
  roleName,
  roleRefusal,
  gateReason,
  objectReason,
  onAct,
}: WriteControlProps) {
  if (decision.reasonCode === 'ROLE_NOT_GRANTED' && decision.outcome === 'explicitlyProhibited') {
    if (roleRefusal.kind === 'disabled') {
      return (
        <Button disabledReason={`${roleRefusal.reason} Viewing as ${roleName}.`}>{label}</Button>
      )
    }
    return <ProhibitionNotice rendering={{ kind: 'absent', note: roleRefusal.note }} />
  }
  if (decision.outcome !== 'allowed') {
    return (
      <Button
        disabledReason={`${decision.explanation}${
          decision.conditionToEnable !== null ? ` ${decision.conditionToEnable}` : ''
        } Nothing here is queued — never queued, in any state — because a clearance or a certificate accepted with no audit entry would be a safety control nobody could account for (D7). Viewing as ${roleName}.`}
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
 * The ten applicable screen states.
 * ------------------------------------------------------------------ */

function stateTreatment(
  stateId: ModuleStateId,
  createDecision: PermissionDecision,
  roleName: string,
) {
  // The three states whose treatment is NOT a boundary payload. STATE-05 is
  // the one that could never be data at all: its detail carries the decision
  // the evaluator returned for THIS render.
  if (stateId === 'STATE-03') {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        The register, the worker record and every panel below are the success rendering, each
        carrying the moment it was true.
      </p>
    )
  }
  if (stateId === 'STATE-05') {
    if (createDecision.reasonCode !== 'ROLE_NOT_GRANTED') {
      return (
        <p role="note" className="text-sm text-[var(--color-ink-muted)]">
          {roleName} carries the record writes on this module, so no refusal renders for this view
          at the register. Select the Quality Manager to meet a role that reads every record and
          may enter no certificate, or any persona at the clearance handoffs, where the refusals
          differ by role and by control.
        </p>
      )
    }
    return (
      <ScreenStateBoundary state="STATE-05" surface="SURF-DOH" detail={{ decision: createDecision }} />
    )
  }
  if (stateId === 'STATE-06') {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        Read-only renders as its own banner wherever a cause applies — the persona, the tenant
        state, and the clearance register for everybody. One banner, one cause; it is not restated
        here.
      </p>
    )
  }
  // Every remaining applicable state is the same boundary with its own
  // payload. `MODULE_STATE_DETAIL` is keyed on exactly this narrowed union, so
  // an eleventh applicable state fails to compile there rather than falling
  // through to a default treatment here.
  return (
    <ScreenStateBoundary state={stateId} surface="SURF-DOH" detail={MODULE_STATE_DETAIL[stateId]} />
  )
}
