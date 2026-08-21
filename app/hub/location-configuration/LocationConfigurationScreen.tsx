'use client'

import { useState, type ReactNode } from 'react'
import { HubShell, type TenantRoleId } from '../HubShell'
import { dohModuleById } from '@/surfaces/doh/modules'
import { DOH_SCOPES, DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import {
  writeAllowed,
  type TenantState,
  type WriteAction,
} from '@/surfaces/doh/tenant-state'
import {
  WriteControl as SharedWriteControl,
  type WriteControlProps as SharedWriteControlProps,
} from '@/ui/WriteControl'
import { SeamNotice } from '@/ui/doh/SeamNotice'
import { TENANT_STATE_OPTIONS } from '@/ui/doh/tenant-state-vocabulary'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState, type ScreenStateId } from '@/ui/screen-state'
import {
  Banner,
  Button,
  Checkbox,
  Dialog,
  EmptyState,
  Field,
  LiveRegion,
  PermissionNotice,
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
  ARCHIVAL_CASCADES,
  CONTROL_MATRIX,
  DOH_AREAS,
  DOH_CELLS,
  DOH_SITES,
  EQUIPMENT_REFUSAL_PATHS,
  NODE_FLAG_CONSEQUENCES,
  SEEDED_CERTIFICATION_TYPES,
  SEEDED_ROLE_SCOPES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  certificationName,
  visibleAreaIds,
  visibleSiteIds,
  type ArchivalCascade,
  type ControlStatus,
  type LocationArea,
  type LocationCell,
  type LocationNodeFlag,
  type LocationSite,
  type PausedJob,
} from './fixtures'

/**
 * MOD-DOH-02 — Location Configuration. The tenant's physical structure, and
 * the anchor three later modules resolve against: scope, shift binding and
 * timezone inheritance, and Area-scoped worker records all read the Sites and
 * Areas seeded in `./fixtures`, never a second copy.
 *
 * MOD-DOH-02 owns `OBJ-DOH-SITE`, `OBJ-DOH-AREA` and `OBJ-DOH-CELL`, plus the
 * unnamed cascade record that binds the per-Job pause transactions.
 */
const MODULE = dohModuleById('MOD-DOH-02')

const ALL_HUB_ROLES: readonly RoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
]
const TENANT_ADMIN_ONLY: readonly RoleId[] = ['TENANT_ADMIN']
const ADMIN_AND_SUPERVISOR: readonly RoleId[] = ['TENANT_ADMIN', 'SUPERVISOR']

const FIXTURE_TENANT = tenantId('TEN-ARDENFIELD')

/**
 * The evaluator context holds an ACTIVE tenant partition on purpose. Role and
 * scope are decided here; the tenant lifecycle gate is `writeAllowed` over
 * the one write-class table, called separately below. Folding the suspension
 * into the partition would refuse the READS too, and a hard-suspended tenant
 * is read-only, not blind.
 */
const FIXTURE_STATE = withTenant(
  emptyDomainState(scenarioRunId('DOH-MOD-02-STORYBOARD')),
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
    why: 'Queued belongs to a device command, and no control here reaches a device. Nothing on this surface queues a write.',
  },
  {
    id: 'STATE-10',
    why: 'No agent creates, edits, archives or proposes a location (L27203), so there is no degraded agent output to render.',
  },
  {
    id: 'STATE-11',
    why: 'The same reason: no agent touches this module, so it behaves identically with every model unavailable.',
  },
]

const MODULE_STATE_NOTE: Readonly<Record<ModuleStateId, string>> = {
  'STATE-01':
    'a Site that holds no Area. A true empty tree is unreachable — a default Site exists before any Tenant Admin signs in (D25, AC-51-12) — so this is the only place the empty state renders.',
  'STATE-02':
    'the tree while the hierarchy is being fetched: the three columns render as a skeleton, and a node count that has not arrived is never drawn as nought.',
  'STATE-03': 'the three-column tree, the node detail and the structural controls below.',
  'STATE-04':
    'the heaviest state on this screen. A re-parent refused while Jobs are in flight names those Jobs; an archival lists every affected child node and every affected Job before it can be confirmed; a name outside the permitted format states the rule and the format.',
  'STATE-05':
    'a persona meeting a control its role does not carry — demonstrated below with the archive control, refused by role rather than hidden. Pick the Supervisor or the Quality Manager to see it.',
  'STATE-06':
    'the whole module for the Read-only Auditor, and for every persona while the tenant state closes configuration writes. One banner, one cause.',
  'STATE-08':
    'the tree served from the last load with a freshness marker and an as-of time, while the connection is down (D7).',
  'STATE-12':
    'an audit write that failed. The action did not happen: the tree is unchanged and the change can be attempted again.',
  'STATE-13':
    'reconnection. Tenant state is refetched BEFORE any write control is re-enabled, so nothing is offered on the strength of a stale gate (D7).',
}

/**
 * Why the whole module is read-only, per tenant state. A `Record` rather than a
 * conditional ladder for the same reason `STATUS_TONE` below is one: the
 * compiler refuses a missing key, so a sixth tenant state cannot arrive and
 * silently name no cause at all. `null` means this state is not read-only —
 * soft suspension closes some write classes and the per-control gate names
 * which, but the screen as a whole stays writable.
 */
const READ_ONLY_CAUSE: Readonly<Record<TenantState, string | null>> = {
  active: null,
  'soft-suspended': null,
  'hard-suspended':
    'Hard suspension holds this workspace read-only: only the enumerated completion pipeline stays open, and no configuration edit is in it (L26920).',
  'compliance-suspended':
    'Compliance suspension blocks every login in this workspace, so no signed-in person remains to change anything (L26921).',
  archived:
    'The workspace is closed. The stricter reading applies where the source states no open write class (L26547).',
}

const STATUS_TONE: Readonly<Record<ControlStatus, StatusTone>> = {
  allowed: 'ok',
  'allowed-with-conditions': 'info',
  'read-only': 'stale',
  'explicitly-prohibited': 'blocked',
  'not-applicable': 'neutral',
  unavailable: 'neutral',
}

type Connection = 'online' | 'lost' | 'recovering'
type FocusKind = 'site' | 'area' | 'cell'

/** The moment the seeded tree was last true. A literal — no clock is read. */
const AS_OF = '2026-08-18 06:41 Europe/London'

export function LocationConfigurationScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>('active')
  const [stateId, setStateId] = useState<ModuleStateId>('STATE-03')
  const [connection, setConnection] = useState<Connection>('online')

  const [sites, setSites] = useState<readonly LocationSite[]>(DOH_SITES)
  const [areas, setAreas] = useState<readonly LocationArea[]>(DOH_AREAS)
  const [cells, setCells] = useState<readonly LocationCell[]>(DOH_CELLS)
  const [cascades, setCascades] = useState<readonly ArchivalCascade[]>(ARCHIVAL_CASCADES)

  const [siteFilter, setSiteFilter] = useState('')
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  const [pickedSiteId, setPickedSiteId] = useState<string | null>(null)
  const [pickedAreaId, setPickedAreaId] = useState<string | null>(null)
  const [pickedCellId, setPickedCellId] = useState<string | null>(null)
  const [focusKind, setFocusKind] = useState<FocusKind>('cell')

  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [addressDraft, setAddressDraft] = useState<string | null>(null)
  const [contactDraft, setContactDraft] = useState<string | null>(null)
  const [timezoneDraft, setTimezoneDraft] = useState<string | null>(null)
  const [certificationDraft, setCertificationDraft] = useState<string | null>(null)
  const [reparentTargetId, setReparentTargetId] = useState('')
  /**
   * The reassignment destination, keyed by the cascade it belongs to. ONE shared
   * string served every cascade block, and two blocks render together the moment
   * a second archival is held — reachable in a single action now that archiving a
   * Site over a held child cascade succeeds instead of being wrongly refused.
   * Sharing the state meant choosing a destination in one block silently showed
   * and applied it in the other, so the audit sentence could name an Area the
   * reader never chose for that Job. Same class as the defect this module already
   * shipped once, on a screen whose audit sentence is the product.
   */
  const [reassignTargetByNode, setReassignTargetByNode] = useState<
    Readonly<Record<string, string>>
  >({})

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archiveAcknowledged, setArchiveAcknowledged] = useState(false)
  const [auditWillFail, setAuditWillFail] = useState(false)
  const [auditFailure, setAuditFailure] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const roleName = roleById(role).name
  const scope = SEEDED_ROLE_SCOPES[role]
  const online = connection === 'online'

  /* -------------------------------------------------------------- *
   * Scope, in ONE place. The tree, the filter, the search and the
   * export all read these three lists, so an out-of-scope node cannot
   * leak into one of them by being filtered in only three (L27215).
   *
   * `visibleSiteIds`/`visibleAreaIds` answer from the SEEDED snapshot —
   * correct for a Site- or Area-scoped persona, who is scoped to named
   * nodes and was never going to be handed a node created after load.
   * A tenant-wide persona's scope is "every Site and every Area", which
   * is a LIVE set, not a fixed list: without this, a Site or Area this
   * screen just created would satisfy no scope check and vanish from its
   * own tree the instant it was recorded — a create control that changes
   * state nothing on screen ever shows is a dead control by another name.
   * -------------------------------------------------------------- */
  const inScopeSiteIds = scope.scope === 'tenant' ? sites.map((s) => s.id) : visibleSiteIds(role)
  const inScopeAreaIds = scope.scope === 'tenant' ? areas.map((a) => a.id) : visibleAreaIds(role)
  const scopedSites = sites.filter((s) => inScopeSiteIds.includes(s.id))
  const scopedAreas = areas.filter((a) => inScopeAreaIds.includes(a.id))
  const scopedCells = cells.filter((c) => inScopeAreaIds.includes(c.areaId))

  /* -------------------------------------------------------------- *
   * Node resolution, in ONE place, and from LIVE state.
   *
   * `siteById`/`areaById` answer from the map `fixtures.ts` builds once at
   * module load, over the frozen seed. That is the right answer for a sibling
   * module reading the seeded tree; it is the wrong answer for every resolve
   * on this screen, because a node this session created is not in that map and
   * a node this session renamed is in it under its old name. Resolving a write
   * target through it fails two ways, and the second is worse than the first:
   * the target comes back `undefined` and the control does nothing forever, or
   * a fallback substitutes a DIFFERENT node and the audit sentence names the
   * Area the Job did not go to. Nothing below resolves through the frozen map.
   * -------------------------------------------------------------- */
  const liveSite = (id: string): LocationSite | undefined => sites.find((s) => s.id === id)
  const liveArea = (id: string): LocationArea | undefined => areas.find((a) => a.id === id)

  // Selection always resolves to something in scope: switching persona can
  // never leave a node selected that this persona may not see.
  const selectedSite: LocationSite | undefined =
    scopedSites.find((s) => s.id === pickedSiteId) ?? scopedSites[0]
  const areasOfSelectedSite = scopedAreas.filter((a) => a.siteId === selectedSite?.id)
  const selectedArea: LocationArea | undefined =
    areasOfSelectedSite.find((a) => a.id === pickedAreaId) ?? areasOfSelectedSite[0]
  const cellsOfSelectedArea = scopedCells.filter((c) => c.areaId === selectedArea?.id)
  const selectedCell: LocationCell | undefined =
    cellsOfSelectedArea.find((c) => c.id === pickedCellId) ?? cellsOfSelectedArea[0]

  const focus: FocusKind =
    focusKind === 'cell' && selectedCell === undefined
      ? selectedArea === undefined
        ? 'site'
        : 'area'
      : focusKind === 'area' && selectedArea === undefined
        ? 'site'
        : focusKind

  const focusedNode: LocationSite | LocationArea | LocationCell | undefined =
    focus === 'cell' ? selectedCell : focus === 'area' ? selectedArea : selectedSite
  /** Archival acts on a Site or an Area; with a Location focused it acts on its Area. */
  const archiveTarget: LocationSite | LocationArea | undefined =
    focus === 'site' ? selectedSite : selectedArea

  /**
   * SB-DOH-014 — the tree collapses to fewer columns at shallower depth, and
   * this is the number of columns that actually render. The Area column appears
   * once a Site is selected (empty or not: a Site with no Area is STATE-01, and
   * the empty state naming what creates one is the point of the column). The
   * Location column appears only once there is a Location to put in it.
   */
  const treeColumns: 1 | 2 | 3 =
    selectedSite === undefined ? 1 : cellsOfSelectedArea.length === 0 ? 2 : 3

  const siteName = nameDraft ?? selectedSite?.name ?? ''
  const siteAddress = addressDraft ?? selectedSite?.address ?? ''
  const siteContact = contactDraft ?? selectedSite?.contact ?? ''
  const siteTimezone = timezoneDraft ?? selectedSite?.timezone ?? ''
  const focusCertification =
    certificationDraft ??
    (focus === 'cell'
      ? (selectedCell?.requiredCertificationId ?? '')
      : focus === 'area'
        ? (selectedArea?.requiredCertificationId ?? '')
        : '')

  /* -------------------------------------------------------------- *
   * Every affordance is decided per control, by its own row of the
   * matrix, through the one policy entry point.
   * -------------------------------------------------------------- */
  function decide(
    action: string,
    allowedRoles: readonly RoleId[],
    sourceRefs: readonly string[],
    extra: { readonly requiresOnline?: boolean; readonly requiredAreas?: readonly string[] } = {},
  ): PermissionDecision {
    return evaluateAccess(
      {
        action,
        allowedRoles,
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

  const viewDecision = decide('view-location-tree', ALL_HUB_ROLES, ['L27117', 'L27215'])
  const createDecision = decide('create-location-node', TENANT_ADMIN_ONLY, ['L27118'], {
    requiresOnline: true,
  })
  const editDecision = decide('edit-location-details', TENANT_ADMIN_ONLY, ['L27119'], {
    requiresOnline: true,
  })
  const reparentDecision = decide('reparent-location', TENANT_ADMIN_ONLY, ['L27149', 'L27185'], {
    requiresOnline: true,
  })
  const archiveDecision = decide('archive-location-node', TENANT_ADMIN_ONLY, ['L27122'], {
    requiresOnline: true,
  })
  const timezoneDecision = decide('set-site-timezone', TENANT_ADMIN_ONLY, ['L27124', 'L2612'], {
    requiresOnline: true,
  })
  const certificationDecision = decide(
    'set-required-certification',
    TENANT_ADMIN_ONLY,
    ['L27125', 'L27215'],
    { requiresOnline: true },
  )

  /**
   * The six controls the structural panel holds. The consolidated ABSENT notice
   * replaces the panel only when EVERY one of them is refused categorically —
   * gating it on the create control's decision alone let one control decide
   * five others' visibility, and the moment the six rows disagreed, five
   * affordances would have been driven by a row that is not theirs. If they
   * ever do disagree, the panel renders and each `WriteControl` draws its own
   * ABSENT from its own decision.
   */
  const structuralDecisions = [
    createDecision,
    editDecision,
    reparentDecision,
    archiveDecision,
    timezoneDecision,
    certificationDecision,
  ]
  const everyStructuralControlAbsent = structuralDecisions.every(
    (d) => d.reasonCode === 'ROLE_NOT_GRANTED',
  )

  /* -------------------------------------------------------------- *
   * The tenant state gate, read BEFORE any write control renders. One
   * data table, one function — no conditional here re-derives it.
   * -------------------------------------------------------------- */
  function tenantGate(action: WriteAction): string | null {
    if (writeAllowed(tenantState, action)) return null
    return `The tenant state is ${tenantState}, and the write-class table does not open ${action} in it. The gate is read before this control renders, not after it is pressed.`
  }

  const readOnlyCause: string | null =
    role === 'READONLY_AUDITOR'
      ? 'The Read-only Auditor reads tenant-wide records and takes no action at all, so every input on this screen is inert for this persona.'
      : READ_ONLY_CAUSE[tenantState]

  /* -------------------------------------------------------------- *
   * Writes. Audit is in the SAME transaction as the action: if the
   * audit write fails, the action did not happen.
   * -------------------------------------------------------------- */
  function commit(description: string, apply: () => void): void {
    if (auditWillFail) {
      setAuditFailure(description)
      setLastAction(null)
      return
    }
    apply()
    setAuditFailure(null)
    setLastAction(description)
  }

  function pickSite(id: string): void {
    setPickedSiteId(id)
    setPickedAreaId(null)
    setPickedCellId(null)
    setFocusKind('site')
    setNameDraft(null)
    setAddressDraft(null)
    setContactDraft(null)
    setTimezoneDraft(null)
    setCertificationDraft(null)
  }

  function pickArea(id: string): void {
    setPickedAreaId(id)
    setPickedCellId(null)
    setFocusKind('area')
    setCertificationDraft(null)
  }

  function pickCell(id: string): void {
    setPickedCellId(id)
    setFocusKind('cell')
    setCertificationDraft(null)
    setReparentTargetId('')
  }

  const nameError: string | null =
    siteName.trim().length === 0
      ? 'STATE-04 — a Site must carry a name. Permitted: 1 to 60 characters, at least one of them not a space.'
      : siteName.trim().length > 60
        ? 'STATE-04 — this name is longer than the permitted format. Permitted: 1 to 60 characters.'
        : scopedSites.some((s) => s.id !== selectedSite?.id && s.name === siteName.trim())
          ? 'STATE-04 — another Site in this tenant already carries that name. Permitted: 1 to 60 characters, unique within the tenant.'
          : null

  const blockingJobs: readonly string[] = selectedCell?.inFlightJobs ?? []
  /**
   * Two lists, because they answer two different questions. An Area can RECEIVE
   * work if it is in scope, active and not itself being archived. Re-parenting
   * additionally excludes the Location's current parent, which is not a move.
   * Folding them into one made the reassignment target list depend on whichever
   * Location happened to be selected in the tree — which for an Area-scoped
   * Supervisor emptied it and made their one granted control unusable.
   *
   * `reassignTargets` is ONE role-scoped list shared by every cascade, so a
   * cascade offers Areas unrelated to its own archived node. Deliberate — the
   * source states no rule narrowing a target to the archived subtree — and
   * DISCLOSED ON THE SCREEN beside the picker, not only here: a declaration in
   * a file is not a disclosure to a reader.
   */
  const reassignTargets = scopedAreas.filter(
    (a) => a.state === 'active' && !a.flags.includes('archiving'),
  )
  const reparentTargets = reassignTargets.filter((a) => a.id !== selectedCell?.areaId)

  const heldCascades = cascades.filter((c) => c.state === 'cascade_pending_reassignment')
  const visibleCascades = cascades.filter(
    (c) => inScopeAreaIds.includes(c.nodeId) || inScopeSiteIds.includes(c.nodeId),
  )

  function childNodesOf(nodeId: string): readonly string[] {
    const childAreas = areas.filter((a) => a.siteId === nodeId)
    const childCells = cells.filter(
      (c) => c.areaId === nodeId || childAreas.some((a) => a.id === c.areaId),
    )
    return [...childAreas.map((a) => `${a.name} (${a.id})`), ...childCells.map((c) => `${c.name} (${c.id})`)]
  }

  /**
   * Every Job this archival would touch. Each carries the Area it is actually
   * in — never the node being archived, which for a Site is not an Area at all
   * and would key the reassignment's scope check on the wrong dimension.
   */
  function jobsUnder(nodeId: string): readonly PausedJob[] {
    const areaIds = areas.filter((a) => a.siteId === nodeId).map((a) => a.id)
    const own = cascades
      .filter((c) => c.nodeId === nodeId || areaIds.includes(c.nodeId))
      .flatMap((c) => c.pausedJobs)
    const inFlight = cells
      .filter((c) => c.areaId === nodeId || areaIds.includes(c.areaId))
      .flatMap((c) =>
        c.inFlightJobs.map((id) => ({ id, name: `in flight on ${c.name}`, areaId: c.areaId })),
      )
    return [...own, ...inFlight]
  }

  /**
   * `archiving` is a flag ON `active` (D21), so it joins whatever flags the node
   * already carries and is removed on its own. Replacing the array wholesale
   * silently dropped `unbound` and `scope-pending` from every node archived.
   */
  const addArchiving = (flags: readonly LocationNodeFlag[]): readonly LocationNodeFlag[] =>
    flags.includes('archiving') ? flags : [...flags, 'archiving']
  const dropArchiving = (flags: readonly LocationNodeFlag[]): readonly LocationNodeFlag[] =>
    flags.filter((f) => f !== 'archiving')

  /**
   * A node flagged `archiving` leaves service the moment nothing under it is
   * still held — and the node may be a Site or an Area, so one rule settles
   * both and they cannot drift. Called after every cascade change.
   */
  function settleArchivals(next: readonly ArchivalCascade[]): void {
    const heldNodes = new Set(
      next.filter((c) => c.state === 'cascade_pending_reassignment').map((c) => c.nodeId),
    )
    const held = (nodeId: string): boolean =>
      heldNodes.has(nodeId) || areas.some((a) => a.siteId === nodeId && heldNodes.has(a.id))
    setCascades(next)
    setSites((current) =>
      current.map((s): LocationSite =>
        s.flags.includes('archiving') && !held(s.id)
          ? { ...s, state: 'archived', flags: dropArchiving(s.flags) }
          : s,
      ),
    )
    setAreas((current) =>
      current.map((a): LocationArea =>
        a.flags.includes('archiving') && !held(a.id)
          ? { ...a, state: 'archived', flags: dropArchiving(a.flags) }
          : a,
      ),
    )
  }

  function confirmArchival(): void {
    const target = archiveTarget
    if (!target) return
    // A Job a pending cascade already holds is already accounted for. Carrying
    // it into a second cascade would list it twice and offer two controls that
    // release one Job.
    const alreadyHeld = new Set(
      cascades
        .filter((c) => c.state === 'cascade_pending_reassignment')
        .flatMap((c) => c.pausedJobs.map((j) => j.id)),
    )
    const jobs = jobsUnder(target.id).filter((j) => !alreadyHeld.has(j.id))
    commit(
      `Archival of ${target.name} (${target.id}) recorded with its audit entry in the same transaction as the change.`,
      () => {
        // The target is a Site or an Area, and the flag has to land on whichever
        // it is: mapping over Areas alone applied `archiving` to nothing at all
        // whenever the archived node was a Site.
        setSites((current) =>
          current.map((s): LocationSite =>
            s.id === target.id ? { ...s, flags: addArchiving(s.flags) } : s,
          ),
        )
        setAreas((current) =>
          current.map((a): LocationArea =>
            a.id === target.id ? { ...a, flags: addArchiving(a.flags) } : a,
          ),
        )
        settleArchivals(
          cascades.some((c) => c.nodeId === target.id)
            ? cascades
            : [
                ...cascades,
                jobs.length > 0
                  ? { nodeId: target.id, state: 'cascade_pending_reassignment', pausedJobs: jobs }
                  : { nodeId: target.id, state: 'cascade_complete', pausedJobs: [] },
              ],
        )
      },
    )
    setArchiveDialogOpen(false)
    setArchiveAcknowledged(false)
  }

  function reassignJob(cascade: ArchivalCascade, jobId: string): void {
    // From LIVE state: an Area created in this session is not in the frozen map,
    // so resolving through it fell back to a DIFFERENT Area and the audit
    // sentence below named the Area the Job did not go to.
    const target = liveArea(reassignTargetByNode[cascade.nodeId] ?? '') ?? reassignTargets[0]
    if (!target) return
    const remaining = cascade.pausedJobs.filter((j) => j.id !== jobId)
    commit(
      `${jobId} reassigned to ${target.name} and released from the cascade on ${cascade.nodeId}, recorded with its audit entry in the same transaction as the change.`,
      () =>
        settleArchivals(
          cascades.map((c): ArchivalCascade =>
            c.nodeId === cascade.nodeId
              ? {
                  nodeId: c.nodeId,
                  state: remaining.length === 0 ? 'cascade_complete' : 'cascade_pending_reassignment',
                  pausedJobs: remaining,
                }
              : c,
          ),
        ),
    )
  }

  /* -------------------------------------------------------------- *
   * Search. It narrows the SAME scoped set the tree holds, so it can
   * never surface a node the tree would not.
   * -------------------------------------------------------------- */
  const query = search.trim().toLowerCase()
  function matches(name: string, id: string): boolean {
    return `${name} ${id}`.toLowerCase().includes(query)
  }
  const searchResults = [
    ...scopedSites.filter((s) => matches(s.name, s.id)).map((s) => ({ kind: 'Site', node: s })),
    ...scopedAreas.filter((a) => matches(a.name, a.id)).map((a) => ({ kind: 'Area', node: a })),
    ...scopedCells.filter((c) => matches(c.name, c.id)).map((c) => ({ kind: 'Location', node: c })),
  ]

  const listedSites = scopedSites.filter((s) => siteFilter === '' || s.id === siteFilter)

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: (
      <>
        <span className="font-medium">{row.control}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
      </>
    ),
    ta: <StatusPill tone={STATUS_TONE[row.status.TENANT_ADMIN]} icon="●" label={row.status.TENANT_ADMIN} />,
    sup: <StatusPill tone={STATUS_TONE[row.status.SUPERVISOR]} icon="●" label={row.status.SUPERVISOR} />,
    qm: (
      <StatusPill tone={STATUS_TONE[row.status.QUALITY_MANAGER]} icon="●" label={row.status.QUALITY_MANAGER} />
    ),
    aud: (
      <StatusPill
        tone={STATUS_TONE[row.status.READONLY_AUDITOR]}
        icon="●"
        label={row.status.READONLY_AUDITOR}
      />
    ),
    wkr: <StatusPill tone={STATUS_TONE[row.status.WORKER]} icon="●" label={row.status.WORKER} />,
    rendering: (
      <>
        <span>{row.rendering}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.effect}</span>
      </>
    ),
  }))

  return (
    <HubShell module={MODULE} role={role} onRoleChange={setRole} tenantState={tenantState}>
      <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
        Screen annotation only, never a route key (D1): SCR-DOH-04 Location hierarchy
        configuration, storyboard SB-DOH-014. The other catalogue splits the same screen into a
        browser and a detail-and-edit pair under three-digit identifiers; catalogue B is canonical
        and this codebase writes the three-digit form nowhere.
      </p>

      <section
        aria-label="Scenario controls"
        className="mt-6 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Scenario controls — seeded fixtures, not product controls
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <Select
            label="Tenant state (scenario)"
            value={tenantState}
            onChange={(v) => setTenantState(v as TenantState)}
            options={TENANT_STATE_OPTIONS}
          />
          <Select
            label="Connection"
            value={connection}
            onChange={(v) => setConnection(v as Connection)}
            options={[
              { value: 'online', label: 'Online' },
              { value: 'lost', label: 'Connection lost' },
              { value: 'recovering', label: 'Reconnecting' },
            ]}
          />
          <Select
            label="Screen state"
            value={stateId}
            onChange={(v) => setStateId(v as ModuleStateId)}
            options={APPLICABLE_STATES.map((s) => ({ value: s, label: `${s} — ${screenState(s).name}` }))}
          />
          <Checkbox
            label="Simulate an audit-write failure on the next action"
            checked={auditWillFail}
            onChange={setAuditWillFail}
          />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Five operating tenant states render here; a pilot tenant is functionally identical to a
          paying one and is a flag, not a sixth state (D19). Viewing as {roleName} — scope:{' '}
          {scope.label}
        </p>
      </section>

      {readOnlyCause !== null ? (
        <div className="mt-4">
          <Banner tone="blocked" heading="Read-only" body={readOnlyCause} />
        </div>
      ) : null}

      {connection === 'lost' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Connection lost — STATE-08"
            body={`The tree below is the copy loaded before the connection dropped, as of ${AS_OF}. Every write control is disabled with its reason named and never queued: a structural change accepted here with no audit entry would be a configuration write nobody could account for (D7).`}
          />
        </div>
      ) : null}

      {connection === 'recovering' ? (
        <div className="mt-4">
          <Banner
            tone="info"
            heading="Reconnecting — STATE-13"
            body="Tenant state is refetched before any write control is re-enabled here, so nothing is offered on the strength of a gate answered from a stale copy (D7). A gate that is still closed is safer than one answered from a copy."
          />
        </div>
      ) : null}

      {auditFailure !== null ? (
        <div className="mt-4">
          <ScreenStateBoundary
            state="STATE-12"
            surface="SURF-DOH"
            detail={{
              failureWhat: `The audit entry for: ${auditFailure}`,
              wasWritten: false,
              nextStep:
                'The action did not happen. Audit is written in the same transaction as the change, so a failed audit write rolls the change back with it; the tree below is unchanged and the action can be attempted again.',
            }}
          />
        </div>
      ) : null}

      <LiveRegion>
        {lastAction !== null ? (
          <p className="mt-4 max-w-prose text-sm text-[var(--color-ink)]">
            {lastAction} Nothing left this storyboard: no location store and no Job store exists
            behind this screen.
          </p>
        ) : null}
      </LiveRegion>

      {/* ---------------- the tree ---------------- */}
      <section aria-label="Location hierarchy" className="mt-6">
        <h2 className="text-lg font-semibold">Location hierarchy</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Three columns — Site, Area and Location — collapsing to fewer at shallower depth. An
          archived node greys with an Archived chip and stays selectable, because the history under
          it is still readable. A node with Jobs in flight carries a lock beside its structural
          controls. As of {AS_OF}.
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          D25 — Site is mandatory, and the Site named {liveSite('SITE-ARD-01')?.provisionedName} was
          created at provisioning before any Tenant Admin signed in. It is renameable, which is what
          the edit control below does; the Site-optional path stays reachable by configuration
          rather than by a code change.
        </p>

        {viewDecision.outcome !== 'allowed' ? <PermissionNotice decision={viewDecision} /> : null}

        <div className="mt-3 flex flex-wrap items-end gap-4">
          <Select
            label="Filter by Site"
            value={siteFilter}
            onChange={setSiteFilter}
            options={[
              { value: '', label: 'All Sites in scope' },
              ...scopedSites.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <Field label="Search the location tree">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
            />
          </Field>
        </div>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The filter and the search narrow the same scoped set the columns hold. An out-of-scope
          node is absent from the tree, the filter, the search and the export alike — scope narrows
          a role and never widens it (L27215).
        </p>

        {query !== '' ? (
          <div className="mt-4">
            <p className="text-sm font-medium">Search results</p>
            {searchResults.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                No location matches this search inside your scope.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {searchResults.map((r) => (
                  <li key={r.node.id} className="text-sm">
                    <button
                      type="button"
                      onClick={() =>
                        r.kind === 'Site'
                          ? pickSite(r.node.id)
                          : r.kind === 'Area'
                            ? pickArea(r.node.id)
                            : pickCell(r.node.id)
                      }
                      className="text-left text-[var(--color-primary)] underline"
                    >
                      {r.kind}: {r.node.name} ({r.node.id})
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div
            className={`mt-4 grid gap-4 ${
              treeColumns === 1 ? 'md:grid-cols-1' : treeColumns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
            }`}
          >
            <TreeColumn heading="Sites">
              {listedSites.map((s) => (
                <NodeRow
                  key={s.id}
                  node={s}
                  selected={s.id === selectedSite?.id}
                  onSelect={() => pickSite(s.id)}
                  extra={s.provisionedByDefault ? 'Default Site (D25)' : null}
                />
              ))}
            </TreeColumn>

            {treeColumns < 2 ? null : (
            <TreeColumn heading="Areas">
              {selectedSite === undefined ? (
                <p className="text-sm text-[var(--color-ink-muted)]">Select a Site.</p>
              ) : areasOfSelectedSite.length === 0 ? (
                <EmptyState
                  title="There are no Areas in this Site yet."
                  whatCreatesIt="Create an Area adds the first one. A Site is created with none, and until it holds one, nothing can be scheduled under it."
                />
              ) : (
                areasOfSelectedSite.map((a) => (
                  <NodeRow
                    key={a.id}
                    node={a}
                    selected={a.id === selectedArea?.id}
                    onSelect={() => pickArea(a.id)}
                    extra={`Required certification: ${certificationName(a.requiredCertificationId)}`}
                  />
                ))
              )}
            </TreeColumn>
            )}

            {treeColumns < 3 ? null : (
            <TreeColumn heading="Locations">
              {cellsOfSelectedArea.map((c) => (
                <NodeRow
                  key={c.id}
                  node={c}
                  selected={c.id === selectedCell?.id}
                  onSelect={() => pickCell(c.id)}
                  extra={
                    c.inFlightJobs.length > 0
                      ? `🔒 ${c.inFlightJobs.length} Jobs in flight: ${c.inFlightJobs.join(', ')}`
                      : null
                  }
                />
              ))}
            </TreeColumn>
            )}
          </div>
        )}

        {treeColumns === 3 ? null : (
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {treeColumns === 1
              ? 'One column at this depth: no Site is selected, so there is no Area column and no Location column to draw.'
              : `Two columns at this depth: ${selectedArea?.name ?? 'the selected Site'} holds no Location, so the Location column is not drawn at all rather than drawn empty.`}
          </p>
        )}

        <div className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3">
          <p className="text-sm font-medium">
            D21 — three flags on <code>active</code>, not three extra states
          </p>
          <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink-muted)]">
            {NODE_FLAG_CONSEQUENCES.map((f) => (
              <li key={f.id}>
                {f.label} — {f.consequence} ({f.sourceRef}).
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- node detail ---------------- */}
      <section aria-label="Node detail" className="mt-6">
        <h2 className="text-lg font-semibold">Node detail</h2>
        {focusedNode === undefined ? (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Nothing is selected.</p>
        ) : (
          <>
            <p className="mt-1 text-sm font-medium">
              {focusedNode.name} · {focusedNode.id} · {focusedNode.state}
            </p>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              {focusedNode.state === 'archived'
                ? 'Archived, and still open for history: this is a soft archive, so every record that referred to this node still resolves. No control unarchives it — the source names no path back.'
                : `Timezone in force: ${selectedSite?.timezone ?? 'not set'}, inherited from the Site. Nothing under a Site carries a timezone of its own.`}
            </p>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              In use by: {focusedNode.inUseBy.length === 0 ? 'nothing yet' : focusedNode.inUseBy.join(', ')}.
            </p>
          </>
        )}
      </section>

      {/* ---------------- structural controls ---------------- */}
      <section aria-label="Structural controls" className="mt-6">
        <h2 className="text-lg font-semibold">Structural controls</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every control below is decided by its own row of the module&rsquo;s control matrix, then
          by the tenant state gate, then by the state of the object it acts on — in that order.
          Each one commits with its audit entry in one transaction.
        </p>

        {everyStructuralControlAbsent ? (
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: `Creating, editing, re-parenting, archiving, timezone and required-certification controls are all absent for the ${roleName}: the prohibition is categorical, so it is not held by this role in any scope, and a disabled control would imply a grant that could be given. The tree above stays readable and scope-filtered.`,
            }}
          />
        ) : (
          <div className="mt-4 space-y-6">
            <div>
              <p className="text-sm font-medium">Create</p>
              <div className="flex flex-wrap items-start gap-3">
                <WriteControl
                  label="Create a Site"
                  decision={createDecision}
                  roleName={roleName}
                  gateReason={tenantGate('create-location')}
                  objectReason={null}
                  onAct={() =>
                    commit(
                      'A new Site was recorded with its audit entry in the same transaction as the change.',
                      () =>
                        setSites((current) => [
                          ...current,
                          {
                            // Two digits, so the tenth Site is SITE-ARD-10 and
                            // still matches the format the first nine set.
                            id: `SITE-ARD-${String(current.length + 1).padStart(2, '0')}`,
                            name: `New Site ${current.length + 1}`,
                            address: 'Address not set',
                            contact: 'Contact not set',
                            timezone: 'Europe/London',
                            state: 'active',
                            flags: ['scope-pending'],
                            provisionedByDefault: false,
                            provisionedName: `New Site ${current.length + 1}`,
                            inUseBy: [],
                            note: 'Created on this screen in this storyboard run.',
                          },
                        ]),
                    )
                  }
                />
                <WriteControl
                  label="Create an Area"
                  decision={createDecision}
                  roleName={roleName}
                  gateReason={tenantGate('create-location')}
                  objectReason={
                    selectedSite === undefined ? 'No Site is selected to create the Area under.' : null
                  }
                  onAct={() =>
                    commit(
                      `A new Area under ${selectedSite?.name ?? 'the Site'} was recorded with its audit entry in the same transaction as the change.`,
                      () =>
                        setAreas((current) => [
                          ...current,
                          {
                            id: `AREA-NEW-${current.length + 1}`,
                            siteId: selectedSite?.id ?? '',
                            name: `New Area ${current.length + 1}`,
                            state: 'active',
                            flags: ['unbound'],
                            requiredCertificationId: null,
                            inUseBy: [],
                            note: 'Created on this screen in this storyboard run.',
                          },
                        ]),
                    )
                  }
                />
                <WriteControl
                  label="Create a Location"
                  decision={createDecision}
                  roleName={roleName}
                  gateReason={tenantGate('create-location')}
                  objectReason={
                    selectedArea === undefined
                      ? 'No Area is selected to create the Location under.'
                      : null
                  }
                  onAct={() =>
                    commit(
                      `A new Location under ${selectedArea?.name ?? 'the Area'} was recorded with its audit entry in the same transaction as the change.`,
                      () =>
                        setCells((current) => [
                          ...current,
                          {
                            id: `CELL-NEW-${current.length + 1}`,
                            areaId: selectedArea?.id ?? '',
                            name: `New Location ${current.length + 1}`,
                            state: 'active',
                            flags: [],
                            inFlightJobs: [],
                            requiredCertificationId: null,
                            inUseBy: [],
                          },
                        ]),
                    )
                  }
                />
              </div>
              <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                CTL-02 covers all three levels in one row (L27118): a Site, an Area under the
                selected Site, or a Location under the selected Area. A newly created Area is
                Unbound until a shift binds it, and a newly created Site is scope-pending until its
                scope is set — both flags on <code>active</code> (D21), and both visible on the row
                the moment the node appears. A newly created Location carries no flag of its own.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Edit the Site name, address and contact</p>
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                Editable at any time and fully audited. Jobs in flight do not hold this control —
                only re-parenting is held by them (L27119, L27120).
              </p>
              <div className="mt-2 max-w-md space-y-3">
                <Field
                  label="Site name"
                  {...(nameError !== null ? { error: nameError } : {})}
                  description="1 to 60 characters, unique within the tenant. The identifier never changes, so nothing that referred to this Site stops resolving."
                >
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <Field label="Site address">
                  <input
                    type="text"
                    value={siteAddress}
                    onChange={(e) => setAddressDraft(e.target.value)}
                    className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <Field label="Site contact">
                  <input
                    type="text"
                    value={siteContact}
                    onChange={(e) => setContactDraft(e.target.value)}
                    className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] p-2 text-sm"
                  />
                </Field>
                <WriteControl
                  label="Save the name, address and contact"
                  decision={editDecision}
                  roleName={roleName}
                  gateReason={tenantGate('edit-configuration')}
                  objectReason={nameError}
                  onAct={() => {
                    const target = selectedSite
                    if (!target) return
                    commit(
                      `${target.id} was renamed to ${siteName.trim()} and recorded with its audit entry in the same transaction as the change.`,
                      () => {
                        setSites((current) =>
                          current.map((s): LocationSite =>
                            s.id === target.id
                              ? {
                                  ...s,
                                  name: siteName.trim(),
                                  address: siteAddress,
                                  contact: siteContact,
                                }
                              : s,
                          ),
                        )
                        setNameDraft(null)
                        setAddressDraft(null)
                        setContactDraft(null)
                      },
                    )
                  }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Re-parent a Location</p>
              {focus !== 'cell' || selectedCell === undefined ? (
                <ProhibitionNotice
                  rendering={{
                    kind: 'absent',
                    note: 'Splitting, merging and re-parenting an Area are not supported at V1 and are absent for every role, the Tenant Admin included. Archive-and-recreate is the sanctioned path. Select a Location in the third column to see the re-parent control that does exist.',
                  }}
                />
              ) : (
                <>
                  <div className="max-w-md">
                    <Select
                      label="Re-parent to Area"
                      value={reparentTargetId}
                      onChange={setReparentTargetId}
                      options={[
                        { value: '', label: 'Choose an Area' },
                        ...reparentTargets.map((a) => ({ value: a.id, label: `${a.name} (${a.id})` })),
                      ]}
                    />
                  </div>
                  <div className="mt-2">
                    <WriteControl
                      label="Re-parent this Location"
                      decision={reparentDecision}
                      roleName={roleName}
                      gateReason={tenantGate('edit-configuration')}
                      objectReason={
                        blockingJobs.length > 0
                          ? `🔒 ${selectedCell.name} cannot be re-parented while ${blockingJobs.length} Jobs are in flight on it: ${blockingJobs.join(', ')}. The refusal is checked on the server on every attempt, and no role may override it, including the Tenant Admin (L27185). Reassign or close those Jobs first.`
                          : reparentTargetId === ''
                            ? 'Choose the Area to re-parent this Location into.'
                            : null
                      }
                      onAct={() => {
                        // From LIVE state: resolved through the frozen map, an
                        // Area created in this session came back `undefined`
                        // and this enabled control did nothing, for ever.
                        const target = liveArea(reparentTargetId)
                        const moving = selectedCell
                        if (!target || !moving) return
                        commit(
                          `${moving.name} was re-parented into ${target.name} and recorded with its audit entry in the same transaction as the change.`,
                          () => {
                            setCells((current) =>
                              current.map((c): LocationCell =>
                                c.id === moving.id ? { ...c, areaId: target.id } : c,
                              ),
                            )
                            setPickedCellId(null)
                            setReparentTargetId('')
                          },
                        )
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <p className="text-sm font-medium">Archive</p>
              <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
                Target: {archiveTarget?.name ?? 'nothing selected'} ({archiveTarget?.id ?? '—'}). A
                soft archive; the cascade must complete before the node leaves service.
              </p>
              <div className="mt-2">
                <WriteControl
                  label="Archive this node"
                  decision={archiveDecision}
                  roleName={roleName}
                  gateReason={tenantGate('edit-configuration')}
                  objectReason={
                    archiveTarget === undefined
                      ? 'Nothing is selected to archive.'
                      : archiveTarget.state === 'archived'
                        ? 'This node is already archived, and no control unarchives it.'
                        : null
                  }
                  onAct={() => {
                    setArchiveAcknowledged(false)
                    setArchiveDialogOpen(true)
                  }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Site timezone</p>
              <div className="max-w-md">
                <Select
                  label="Site timezone"
                  value={siteTimezone}
                  onChange={setTimezoneDraft}
                  options={['Europe/London', 'Europe/Warsaw', 'America/Chicago'].map((t) => ({
                    value: t,
                    label: t,
                  }))}
                />
              </div>
              <div className="mt-2">
                <WriteControl
                  label="Save the Site timezone"
                  decision={timezoneDecision}
                  roleName={roleName}
                  gateReason={tenantGate('edit-configuration')}
                  objectReason={selectedSite === undefined ? 'No Site is selected.' : null}
                  onAct={() => {
                    const target = selectedSite
                    if (!target) return
                    commit(
                      `${target.id} now resolves against ${siteTimezone}, recorded with its audit entry in the same transaction as the change.`,
                      () => {
                        setSites((current) =>
                          current.map((s): LocationSite =>
                            s.id === target.id ? { ...s, timezone: siteTimezone } : s,
                          ),
                        )
                        setTimezoneDraft(null)
                      },
                    )
                  }}
                />
              </div>
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'A per-Area or per-Shift timezone override is absent for every role, because it does not exist: one timezone per Site, and everything under it inherits (AC-SCOPE-034, L2612). A Shift bound to this Site takes this value and has nothing to override.',
                }}
              />
            </div>

            <div>
              <p className="text-sm font-medium">Required certification</p>
              <div className="max-w-md">
                <Select
                  label="Required certification"
                  value={focusCertification}
                  onChange={setCertificationDraft}
                  options={[
                    { value: '', label: 'None' },
                    ...SEEDED_CERTIFICATION_TYPES.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
              <div className="mt-2">
                <WriteControl
                  label="Save the required certification"
                  decision={certificationDecision}
                  roleName={roleName}
                  gateReason={tenantGate('edit-configuration')}
                  objectReason={
                    focus === 'site' ? 'A required certification is set on an Area or a Location, not on a Site.' : null
                  }
                  onAct={() => {
                    const target = focus === 'cell' ? selectedCell : selectedArea
                    if (!target) return
                    commit(
                      `${target.id} now requires ${certificationName(focusCertification === '' ? null : focusCertification)}, recorded with its audit entry in the same transaction as the change.`,
                      () => {
                        const value = focusCertification === '' ? null : focusCertification
                        setAreas((current) =>
                          current.map((a): LocationArea =>
                            a.id === target.id ? { ...a, requiredCertificationId: value } : a,
                          ),
                        )
                        setCells((current) =>
                          current.map((c): LocationCell =>
                            c.id === target.id ? { ...c, requiredCertificationId: value } : c,
                          ),
                        )
                        setCertificationDraft(null)
                      },
                    )
                  }}
                />
              </div>
              <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                D22 — the certification types above are a seeded list. No screen in this product
                creates, edits or retires one, and the source never says who would. That is raised
                as a client blocker rather than answered by inventing an administration screen.
                What is set here is a gate input. It is enforced at assignment on the Worker
                Assignment screen, built in this slice; the run-start point is registered to the
                same slice and no control for it is drawn anywhere in this build. That is why this
                is a choice from a list and never free text.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ---------------- the cascade ---------------- */}
      <section aria-label="Archival cascade" className="mt-6">
        <h2 className="text-lg font-semibold">Archival cascade</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          An archival that meets Jobs is held rather than refused: the cascade pauses each Job in
          its own transaction and the node stays operable until every one has been reassigned.
        </p>

        <div className="mt-3">
          <SeamNotice seamId="archival-cascade" />
        </div>

        {visibleCascades.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
            No archival is in progress inside your scope.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {visibleCascades.map((cascade) => {
              // LIVE, so a node renamed in this session is named as it now is.
              const node = liveArea(cascade.nodeId) ?? liveSite(cascade.nodeId)
              return (
                <div
                  key={cascade.nodeId}
                  className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3"
                >
                  <p className="text-sm font-medium">
                    {node?.name ?? cascade.nodeId} · {cascade.nodeId} · {cascade.state}
                  </p>
                  {cascade.state === 'cascade_pending_reassignment' ? (
                    <>
                      <p className="mt-1 text-sm text-[var(--color-status-attention)]">
                        Reassignment required — {cascade.pausedJobs.length} Jobs paused
                      </p>
                      <ul className="mt-2 space-y-2">
                        {cascade.pausedJobs.map((job) => {
                          /* Scope is decided per JOB, on the Area the Job is
                           * actually in. Keying it on the cascade's own node
                           * asked whether a SITE id was in the reader's AREA
                           * scope whenever a Site was the node archived — which
                           * no Area scope ever contains, so the Tenant Admin
                           * read a scope refusal for a control this page's own
                           * matrix marks `allowed` for them. */
                          const reassign = decide(
                            'reassign-paused-job',
                            ADMIN_AND_SUPERVISOR,
                            ['L27123'],
                            { requiresOnline: true, requiredAreas: [job.areaId] },
                          )
                          return (
                            <li key={job.id} className="flex flex-wrap items-center gap-3 text-sm">
                              <span>
                                {job.id} · {job.name}
                              </span>
                              {reassign.reasonCode === 'ROLE_NOT_GRANTED' ? (
                                <ProhibitionNotice
                                  rendering={{
                                    kind: 'absent',
                                    note: `Reassignment is not held by the ${roleName} in any scope, so nothing is drawn here. It is held by the Tenant Admin tenant-wide and by a Supervisor inside their own Area.`,
                                  }}
                                />
                              ) : (
                                <WriteControl
                                  label={`Reassign ${job.id}`}
                                  decision={reassign}
                                  roleName={roleName}
                                  gateReason={tenantGate('start-run')}
                                  objectReason={
                                    reassignTargets.length === 0
                                      ? 'No Area inside your scope can take this Job.'
                                      : null
                                  }
                                  onAct={() => reassignJob(cascade, job.id)}
                                />
                              )}
                            </li>
                          )
                        })}
                      </ul>
                      <div className="mt-3 max-w-md">
                        <Select
                          label={`Reassign the paused Job to — ${cascade.nodeId}`}
                          value={reassignTargetByNode[cascade.nodeId] ?? ''}
                          onChange={(v) =>
                            setReassignTargetByNode((current) => ({
                              ...current,
                              [cascade.nodeId]: v,
                            }))
                          }
                          options={[
                            { value: '', label: 'The first Area in scope' },
                            ...reassignTargets.map((a) => ({ value: a.id, label: a.name })),
                          ]}
                        />
                        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                          This list is scoped to your role and not to this node: it offers every
                          active Area you can see, including Areas that were never under the node
                          being archived, because the source states no rule narrowing a
                          reassignment target to the archived node&apos;s own subtree. Read the Area
                          name before you choose.
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                      The cascade completed and the archival was released. History under this node
                      is still readable.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          {heldCascades.length} archival{heldCascades.length === 1 ? ' is' : 's are'} currently held
          across this tenant. Reassignment here releases the hold in this storyboard only: the Job
          itself belongs to the module named in the seam above, and this screen writes nothing to it.
        </p>
      </section>

      {/* ---------------- export ---------------- */}
      <section aria-label="Export" className="mt-6">
        <h2 className="text-lg font-semibold">Export the location list</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The export carries exactly what this persona may see and nothing more. Nothing is
          downloaded and no file leaves this storyboard — the preview below is the whole of it.
        </p>
        <div className="mt-2">
          <Button variant="secondary" onClick={() => setExportOpen(true)}>
            Export the location list
          </Button>
        </div>
        {exportOpen ? (
          <ul className="mt-3 space-y-1 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3 text-xs">
            {scopedSites.map((s) => (
              <li key={s.id}>
                <span className="block">
                  {s.id} · {s.name} · {s.timezone} · {s.state}
                </span>
                {scopedAreas
                  .filter((a) => a.siteId === s.id)
                  .map((a) => (
                    <span key={a.id} className="block pl-4">
                      {a.id} · {a.name} · {a.state}
                    </span>
                  ))}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* ---------------- the matrix ---------------- */}
      <section aria-label="Control matrix" className="mt-6">
        <h2 className="text-lg font-semibold">What each of the five tenant roles holds here</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The module&rsquo;s eleven control rows, each cell carrying an explicit status because a
          blank cell is an unanswered question an implementer answers privately (L10238). Every
          affordance above is decided by its own row, never by a module-level role list.
        </p>
        <div className="mt-3">
          <Table
            caption="Control matrix for MOD-DOH-02, and how each refusal is drawn on this screen"
            columns={[
              { key: 'control', header: 'Control' },
              { key: 'ta', header: 'Tenant Admin' },
              { key: 'sup', header: 'Supervisor' },
              { key: 'qm', header: 'Quality Manager' },
              { key: 'aud', header: 'Auditor' },
              { key: 'wkr', header: 'Worker' },
              { key: 'rendering', header: 'How it renders here' },
            ]}
            rows={matrixRows}
            emptyState={{
              title: 'No control is defined for this module.',
              whatCreatesIt: 'The frozen source defines the control matrix.',
            }}
          />
        </div>
      </section>

      {/* ---------------- screen states ---------------- */}
      <section aria-label="Screen states" className="mt-6">
        <h2 className="text-lg font-semibold">Screen state</h2>
        <p className="mt-1 text-sm font-medium">
          {stateId} — {screenState(stateId).name}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {screenState(stateId).contract}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          On this module: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, roleName, archiveDecision, readOnlyCause)}</div>
        <p className="mt-4 text-sm font-medium">The four that never apply here</p>
        <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {NEVER_APPLIES.map((s) => (
            <li key={s.id}>
              {s.id} — {s.why}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- absent by rule ---------------- */}
      <section aria-label="Absent by rule" className="mt-6">
        <h2 className="text-lg font-semibold">Absent by rule</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nothing is drawn where each of these would sit — not even inert — because an inert control
          implies a grant that could be given, and a roadmap promise the source has not made.
        </p>
        <div className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'Splitting, merging or re-parenting an Area is not supported at V1 and is absent for all five roles. Archive-and-recreate is the sanctioned path, and it is the one built above.',
            }}
          />
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'A map of locations is deferred beyond V1 for every role. No coordinates are held, no geocoding happens, and no map component ships.',
            }}
          />
          {EQUIPMENT_REFUSAL_PATHS.map((path) => (
            <ProhibitionNotice key={path} rendering={{ kind: 'absent', note: `No equipment record can be created. ${path}` }} />
          ))}
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: `Scoping below an Area is absent everywhere on this screen. The three live dimensions are ${DOH_SCOPES.join(', ')}; ${DEFERRED_DOH_SCOPES.join(', ')} are deferred beyond V1, so a Location is a node in the tree and is not a scope dimension at V1. No picker offers one and no rule depends on one.`,
            }}
          />
        </div>
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

      <Dialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        title={`Archive ${archiveTarget?.name ?? 'this node'}?`}
      >
        <p className="text-sm text-[var(--color-ink-muted)]">
          STATE-04 — everything this archival touches is listed before it can be confirmed. The
          archival is held until the cascade completes.
        </p>
        <p className="mt-3 text-sm font-medium">Affected child nodes</p>
        <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {childNodesOf(archiveTarget?.id ?? '').length === 0 ? (
            <li>None. This node holds no child.</li>
          ) : (
            childNodesOf(archiveTarget?.id ?? '').map((n) => <li key={n}>{n}</li>)
          )}
        </ul>
        <p className="mt-3 text-sm font-medium">Affected Jobs</p>
        <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {jobsUnder(archiveTarget?.id ?? '').length === 0 ? (
            <li>None. Nothing is paused by this archival.</li>
          ) : (
            jobsUnder(archiveTarget?.id ?? '').map((j) => (
              <li key={j.id}>
                {j.id} · {j.name}
              </li>
            ))
          )}
        </ul>
        <div className="mt-3">
          <Checkbox
            label="I have read the affected child nodes and Jobs listed above."
            checked={archiveAcknowledged}
            onChange={setArchiveAcknowledged}
          />
        </div>
        <div className="mt-3">
          {archiveAcknowledged ? (
            <Button onClick={confirmArchival}>Confirm the archival</Button>
          ) : (
            <Button disabledReason="Confirmation weight proportional to consequence: the affected child nodes and Jobs must be acknowledged before this control acts.">
              Confirm the archival
            </Button>
          )}
        </div>
      </Dialog>
    </HubShell>
  )
}

/* ------------------------------------------------------------------ *
 * THIS MODULE'S WORDING for the one shared write control,
 * `@/ui/WriteControl` — which now holds the branch order and both
 * prohibition renderings that were hand-inlined here.
 *
 * The rule it applies is unchanged, and nothing about it is settled here.
 * ABSENT where the role is refused categorically — it cannot hold the
 * control in any scope, and a disabled control would imply a grant that
 * could be given. DISABLED WITH THE REASON where the control exists for
 * this role and is refused by the tenant state, the connection or the
 * state of the object it acts on.
 * ------------------------------------------------------------------ */
const NEVER_QUEUED_NOTE =
  'a structural change accepted with no audit entry would be a configuration write nobody could account for'

type WriteControlProps = Omit<SharedWriteControlProps, 'refusalNote' | 'neverQueuedNote'>

function WriteControl(props: WriteControlProps) {
  return (
    <SharedWriteControl
      {...props}
      refusalNote={`${props.label} is not held by this role in any scope, so nothing is drawn here. Viewing as ${props.roleName}.`}
      neverQueuedNote={NEVER_QUEUED_NOTE}
    />
  )
}

/* ------------------------------------------------------------------ *
 * The tree.
 * ------------------------------------------------------------------ */
function TreeColumn({ heading, children }: { readonly heading: string; readonly children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3">
      <p className="text-sm font-semibold">{heading}</p>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  )
}

interface NodeRowProps {
  readonly node: LocationSite | LocationArea | LocationCell
  readonly selected: boolean
  readonly onSelect: () => void
  readonly extra: string | null
}

function NodeRow({ node, selected, onSelect, extra }: NodeRowProps) {
  const archived = node.state === 'archived'
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={`block w-full rounded-[var(--radius-control)] border p-2 text-left text-sm ${
        selected ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'
      } ${archived ? 'text-[var(--color-ink-subtle)]' : 'text-[var(--color-ink)]'}`}
    >
      <span className="block font-medium">{node.name}</span>
      <span className="block text-xs text-[var(--color-ink-subtle)]">{node.id}</span>
      {archived ? (
        <span className="mt-1 inline-block text-xs font-medium">Archived — open for history</span>
      ) : null}
      {node.flags.map((flag) => (
        <span key={flag} className="mt-1 mr-2 inline-block text-xs font-medium">
          {NODE_FLAG_CONSEQUENCES.find((f) => f.id === flag)?.label ?? flag}
        </span>
      ))}
      {node.inUseBy.length > 0 ? (
        <span className="mt-1 block text-xs">In use — {node.inUseBy.join(', ')}</span>
      ) : null}
      {extra !== null ? <span className="mt-1 block text-xs">{extra}</span> : null}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * The nine applicable screen states.
 * ------------------------------------------------------------------ */
function stateTreatment(
  stateId: ModuleStateId,
  roleName: string,
  archiveDecision: PermissionDecision,
  readOnlyCause: string | null,
) {
  switch (stateId) {
    case 'STATE-01':
      return (
        <ScreenStateBoundary
          state="STATE-01"
          surface="SURF-DOH"
          detail={{
            objectLabel: 'Areas in this Site',
            whatCreatesIt:
              'Create an Area adds the first one. A true empty tree is unreachable: a default Site is created at provisioning, before any Tenant Admin signs in (D25, AC-51-12).',
          }}
        />
      )
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-DOH"
          detail={{ objectLabel: 'the location hierarchy' }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The three-column tree, the node detail and the structural controls above are the success
          rendering.
        </p>
      )
    case 'STATE-04':
      return (
        <ScreenStateBoundary
          state="STATE-04"
          surface="SURF-DOH"
          detail={{
            fieldLabel: 'Re-parent this Location',
            rule: 'A Location cannot be re-parented while Jobs are in flight on it, and the refusal names those Jobs rather than reporting a generic failure.',
            permittedFormat:
              'Permitted once every in-flight Job on the node has been reassigned or closed. The archival confirmation carries the same weight: every affected child node and every affected Job is listed before it can be confirmed.',
          }}
        />
      )
    case 'STATE-05':
      if (archiveDecision.outcome === 'allowed') {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} holds the structural controls, so no refusal renders for this persona. Choose
            the Supervisor or the Quality Manager to see a refusal named rather than hidden behind a
            missing control.
          </p>
        )
      }
      return (
        <ScreenStateBoundary
          state="STATE-05"
          surface="SURF-DOH"
          detail={{ decision: archiveDecision }}
        />
      )
    case 'STATE-06':
      return (
        <ScreenStateBoundary
          state="STATE-06"
          surface="SURF-DOH"
          detail={{
            readOnlyCause:
              readOnlyCause ??
              'Nothing is holding this screen read-only for this persona in this tenant state; the structural controls above are live.',
          }}
        />
      )
    case 'STATE-08':
      return (
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-DOH"
          detail={{
            asOfLabel: `as of ${AS_OF}`,
            originLabel:
              'served from the copy loaded before the connection dropped, with every write control disabled and nothing queued (D7)',
          }}
        />
      )
    case 'STATE-12':
      return (
        <ScreenStateBoundary
          state="STATE-12"
          surface="SURF-DOH"
          detail={{
            failureWhat: 'The audit entry accompanying a structural change',
            wasWritten: false,
            nextStep:
              'The action did not happen. Audit is in the same transaction as the action, so a failed audit write rolls the change back with it.',
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
              'Reconnected. Tenant state is refetched before any write control is re-enabled, so no control is offered on the strength of a gate answered from a stale copy.',
          }}
        />
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state: ${String(exhaustive)}`)
    }
  }
}
