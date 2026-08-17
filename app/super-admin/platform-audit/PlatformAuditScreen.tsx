'use client'

import { useState } from 'react'
import Link from 'next/link'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS, type SaInvariantDefinition } from '@/surfaces/sa/invariants'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { Button, Select, StatusPill, Table, type TableRow } from '@/ui/primitives'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsAction, type PermissionDecision } from '@/policy/decision'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { roleById, type RoleId } from '@/domain/roles'
import { SaConsoleShell } from '../SaConsoleShell'

/**
 * MOD-SA-18 — Platform Audit (Band B, the operations layer).
 *
 * Screen annotations only, never route keys (D1): SCR-SA-25 "Platform audit
 * search and export" (L42817, L46121), SB-SA-18 (L46121), SB-RBAC-04 "the
 * enforcement-parity view" (L20953), and SCR-SA-21 "Platform audit" in the
 * second, incompatible numbering scheme (L48750).
 *
 * The frozen source defines exactly TWO controls here (both L46121): the
 * filters, held by all four console roles, and the class-filtered export,
 * held by the Root Super Admin and the Admin. Everything else on this screen
 * is a readout of a state the source fixes, an acceptance criterion, or an
 * entry in the unspecified-in-source panel. No third control is invented.
 *
 * Method note for the reviewer: `controls`, `screens`, `objects`,
 * `state_vocabularies`, `business_rules` and `numeric_facts` were matched by
 * `module_id === 'MOD-SA-18'`. The extract carries NO `workflows` entry with
 * a module id, so the three workflows rendered below were matched by NAME and
 * LINE PROXIMITY to §23.18 (L46094-L46213) and by name for the two that sit
 * elsewhere (L74182, L74896).
 */

/* ------------------------------------------------------------------ *
 * The four platform roles. `ROLE-PLAT-*` is the spec's vocabulary and
 * `RoleId` is this build's; the mapping is written once and every access
 * decision goes through `evaluateAccess` with the `RoleId` (D16).
 * ------------------------------------------------------------------ */
export type SaConsoleRoleToken =
  | 'ROLE-PLAT-ROOT'
  | 'ROLE-PLAT-ADMIN'
  | 'ROLE-PLAT-ENG'
  | 'ROLE-PLAT-SUP'

export interface SaConsoleRoleView {
  readonly token: SaConsoleRoleToken
  readonly roleId: RoleId
  readonly label: string
}

/**
 * The human name of any role, in either security domain. The audit log records
 * acts by tenant-domain actors too (a registry write by a Tenant Admin, say),
 * so a platform-only lookup would fall through to the raw enum token and print
 * an internal identifier where every other row prints a name.
 */
function roleName(id: RoleId): string {
  return roleById(id).name
}

export const CONSOLE_ROLE_VIEWS = [
  { token: 'ROLE-PLAT-ROOT', roleId: 'ROOT_SUPER_ADMIN', label: roleName('ROOT_SUPER_ADMIN') },
  { token: 'ROLE-PLAT-ADMIN', roleId: 'ADMIN', label: roleName('ADMIN') },
  { token: 'ROLE-PLAT-ENG', roleId: 'PLATFORM_ENGINEER', label: roleName('PLATFORM_ENGINEER') },
  { token: 'ROLE-PLAT-SUP', roleId: 'SUPPORT', label: roleName('SUPPORT') },
] as const satisfies readonly SaConsoleRoleView[]

type MissingFromConsoleRoles = Exclude<
  SaConsoleRoleToken,
  (typeof CONSOLE_ROLE_VIEWS)[number]['token']
>
const _consoleRolesExhaustive: MissingFromConsoleRoles extends never ? true : never = true
void _consoleRolesExhaustive

function consoleRoleView(token: SaConsoleRoleToken): SaConsoleRoleView {
  const found = CONSOLE_ROLE_VIEWS.find((r) => r.token === token)
  if (!found) throw new Error(`Unknown console role: ${token}`)
  return found
}

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */
export const APPLICABLE_SCREEN_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/* ------------------------------------------------------------------ *
 * Closed vocabularies the source fixes for this module.
 * ------------------------------------------------------------------ */

/**
 * D3 / L46141: OBJ-SA-AUDITENTRY has exactly one state, "and only
 * `committed`, because there is no draft, edited, or deleted state by
 * construction". Two other vocabularies exist in the source and are both
 * refused on the record below: `written` (L21299) and
 * `committed/refused/parked` (L74127) — parked cannot coexist with FB-SA-03
 * (L46191), which states there is no queued-audit path and no client-side
 * buffer.
 */
export type AuditEntryState = 'committed'

export const AUDIT_ENTRY_STATES = ['committed'] as const satisfies readonly AuditEntryState[]

type MissingFromEntryStates = Exclude<AuditEntryState, (typeof AUDIT_ENTRY_STATES)[number]>
const _entryStatesExhaustive: MissingFromEntryStates extends never ? true : never = true
void _entryStatesExhaustive

/** OBJ-SA-AUDITEXPORT (L46140, L46141), in order. */
export type AuditExportState = 'requested' | 'generated' | 'delivered'

export const AUDIT_EXPORT_STATES = [
  'requested',
  'generated',
  'delivered',
] as const satisfies readonly AuditExportState[]

type MissingFromExportStates = Exclude<AuditExportState, (typeof AUDIT_EXPORT_STATES)[number]>
const _exportStatesExhaustive: MissingFromExportStates extends never ? true : never = true
void _exportStatesExhaustive

/* ------------------------------------------------------------------ *
 * D4 — the event class fixture. PROVISIONAL, and its size appears nowhere
 * on screen. The source gives two irreconcilable figures (L46178 versus
 * L47835) and the list itself is nowhere in the extract, so this fixture is
 * seeded ONLY with classes the source actually names, each with the line
 * that names it. Rendering a count here would make a claim the source
 * cannot support.
 * ------------------------------------------------------------------ */
export interface AuditEventClass {
  readonly id: string
  readonly name: string
  /** The line in the frozen source that names this class. */
  readonly sourceRef: string
  /** True for the three named access classes (L4612, L107886). */
  readonly isAccessClass: boolean
}

export const AUDIT_EVENT_CLASSES = [
  {
    id: 'locked-setting-attempt',
    name: 'Locked setting attempt',
    sourceRef: 'AC-SEC-602, L104033',
    isAccessClass: false,
  },
  {
    id: 'support-session',
    name: 'Support session',
    sourceRef: 'Named access class, L4612 / AC-4873 L107886',
    isAccessClass: true,
  },
  {
    id: 'compliance-emergency',
    name: 'Compliance emergency',
    sourceRef: 'Named access class, L4612 / AC-4873 L107886',
    isAccessClass: true,
  },
  {
    id: 'jbs-access-grant',
    name: 'JBS access grant',
    sourceRef: 'Named access class, L4612 / AC-4873 L107886',
    isAccessClass: true,
  },
  {
    id: 'approval',
    name: 'Approval',
    // The count that stood here ("the four change classes") is dropped: this
    // screen states no count of classes of any kind, and a reader cannot tell
    // a change-class count from an event-class one (D4).
    sourceRef: 'The change classes, L21026',
    isAccessClass: false,
  },
  {
    id: 'denial',
    name: 'Denial',
    sourceRef: 'One authorisation decision, end to end — "deny with reason and write an audited denial", L20695',
    isAccessClass: false,
  },
  {
    id: 'tenant-lifecycle',
    name: 'Tenant lifecycle',
    sourceRef: 'OBJ-SA-TENANT, L45003',
    isAccessClass: false,
  },
  {
    id: 'device-command',
    name: 'Device command',
    sourceRef: 'The fifteen command states, L42846',
    isAccessClass: false,
  },
  {
    id: 'registry-write',
    name: 'Registry write',
    sourceRef: 'Workflow 23.19 — accepted and committed with its audit event, L46213',
    isAccessClass: false,
  },
  {
    id: 'emergency-pause',
    name: 'Emergency pause',
    sourceRef: 'Pause and resume audited as their own acts, L21561',
    isAccessClass: false,
  },
  {
    id: 'audit-export',
    name: 'Audit export',
    sourceRef: 'The export action is itself audited, L46121',
    isAccessClass: false,
  },
] as const satisfies readonly AuditEventClass[]

const CLASS_FIXTURE_LABEL =
  'PROVISIONAL — the event class list and its size are unresolved in the frozen source (L46178 gives one figure, L47835 another, and the list itself appears nowhere). This fixture is seeded only with classes the source actually names, each carrying the line that names it. No size is stated anywhere on this screen.'

export function auditEventClass(id: string): AuditEventClass | undefined {
  return AUDIT_EVENT_CLASSES.find((c) => c.id === id)
}

/**
 * Which classes a role may read. L74182: "Results render with class filters
 * showing only permitted classes."
 *
 * - Root and Admin: every class.
 * - Support: "Read own session records" (L74224) — its own support-session
 *   records and nothing else. The narrowest and most explicit statement the
 *   source makes about audit read scope on this surface.
 * - Platform Engineer: "Read platform log for engineering classes" (L74223).
 *   The source never says WHICH classes are engineering classes. Narrowing by
 *   guess would fabricate a permission boundary that reads back as a
 *   requirement, so this prototype does not narrow it — it renders the whole
 *   list with the gap named, and the gap is in the unspecified-in-source
 *   panel. Failing closed to an empty list would contradict the grant itself.
 */
export function readableClassesFor(roleId: RoleId): readonly AuditEventClass[] {
  if (roleId === 'SUPPORT') return AUDIT_EVENT_CLASSES.filter((c) => c.id === 'support-session')
  return AUDIT_EVENT_CLASSES
}

/* ------------------------------------------------------------------ *
 * Fixture audit entries. Seeded data a reader steps through — there is no
 * audit store behind this screen, and no claim is made that there is.
 * Actors are the source's own cast (L1040, L1476, L4597-L4601); the tenant
 * is the recurring illustrative tenant TEN-BRIGHTBIKES (L27).
 * ------------------------------------------------------------------ */
export interface AuditEntry {
  readonly id: string
  readonly classId: string
  readonly actor: string
  readonly actorRole: RoleId
  readonly tenant: string | null
  readonly object: string
  readonly occurredAt: string
  readonly state: AuditEntryState
  /** AC-SA-18-05: cross-tenant access events mirror into the tenant's stream. */
  readonly mirrored: boolean
}

const AS_OF_CURRENT = '2026-08-17 09:12 UTC'
const AS_OF_STALE = '2026-08-17 05:12 UTC'
const STALE_AGE = 'four hours old'

export const AUDIT_ENTRIES = [
  {
    id: 'AUD-BB-000001',
    classId: 'tenant-lifecycle',
    actor: 'Noah',
    actorRole: 'ADMIN',
    tenant: 'TEN-BRIGHTBIKES',
    object: 'OBJ-SA-TENANT',
    occurredAt: '2026-08-14 08:40 UTC',
    state: 'committed',
    mirrored: true,
  },
  {
    id: 'AUD-BB-000002',
    classId: 'approval',
    actor: 'Aisha',
    actorRole: 'ROOT_SUPER_ADMIN',
    tenant: 'TEN-BRIGHTBIKES',
    object: 'OBJ-SA-CHANGEREQUEST',
    occurredAt: '2026-08-14 09:02 UTC',
    state: 'committed',
    mirrored: false,
  },
  {
    id: 'AUD-BB-000003',
    classId: 'locked-setting-attempt',
    actor: 'Daniel',
    actorRole: 'PLATFORM_ENGINEER',
    tenant: null,
    object: 'INV-ENCRYPTION-AT-REST',
    occurredAt: '2026-08-15 11:26 UTC',
    state: 'committed',
    mirrored: false,
  },
  {
    id: 'AUD-BB-000004',
    classId: 'support-session',
    actor: 'Sophia',
    actorRole: 'SUPPORT',
    tenant: 'TEN-BRIGHTBIKES',
    object: 'OBJ-SA-ACCESSSESSION',
    occurredAt: '2026-08-15 14:03 UTC',
    state: 'committed',
    mirrored: true,
  },
  {
    id: 'AUD-BB-000005',
    classId: 'support-session',
    actor: 'Sophia',
    actorRole: 'SUPPORT',
    tenant: 'TEN-BRIGHTBIKES',
    object: 'OBJ-SA-ACCESSSESSION',
    occurredAt: '2026-08-15 16:11 UTC',
    state: 'committed',
    mirrored: true,
  },
  {
    id: 'AUD-BB-000006',
    classId: 'denial',
    actor: 'Daniel',
    actorRole: 'PLATFORM_ENGINEER',
    tenant: null,
    object: 'OBJ-SA-ACCESSSESSION',
    occurredAt: '2026-08-16 07:48 UTC',
    state: 'committed',
    mirrored: false,
  },
  {
    id: 'AUD-BB-000007',
    classId: 'device-command',
    actor: 'Noah',
    actorRole: 'ADMIN',
    tenant: 'TEN-BRIGHTBIKES',
    object: 'OBJ-SA-COMMAND',
    occurredAt: '2026-08-16 10:15 UTC',
    state: 'committed',
    mirrored: true,
  },
  {
    id: 'AUD-BB-000008',
    classId: 'registry-write',
    actor: 'Priya',
    actorRole: 'TENANT_ADMIN',
    tenant: 'TEN-BRIGHTBIKES',
    object: 'OBJ-SA-REGENTRY',
    occurredAt: '2026-08-16 13:30 UTC',
    state: 'committed',
    mirrored: true,
  },
  {
    id: 'AUD-BB-000009',
    classId: 'locked-setting-attempt',
    actor: 'Noah',
    actorRole: 'ADMIN',
    tenant: null,
    object: 'INV-ONE-TRANSACTION-AUDIT',
    occurredAt: '2026-08-17 08:05 UTC',
    state: 'committed',
    mirrored: false,
  },
  {
    id: 'AUD-BB-000010',
    classId: 'compliance-emergency',
    actor: 'Aisha',
    actorRole: 'ROOT_SUPER_ADMIN',
    tenant: 'TEN-BRIGHTBIKES',
    object: 'OBJ-SA-ACCESSSESSION',
    occurredAt: '2026-08-17 08:44 UTC',
    state: 'committed',
    mirrored: true,
  },
] as const satisfies readonly AuditEntry[]

const ANY = '__any__'

const ACTOR_OPTIONS = Array.from(new Set(AUDIT_ENTRIES.map((e) => e.actor))).sort()
// `flatMap`, not `filter` with a type predicate: the fixture is `as const`, so
// `tenant` is a literal union and a `t is string` predicate is wider than the
// value it narrows — which TypeScript rejects outright (TS2677).
const TENANT_OPTIONS = Array.from(
  new Set(AUDIT_ENTRIES.flatMap((e) => (e.tenant === null ? [] : [e.tenant]))),
).sort()
const OBJECT_OPTIONS = Array.from(new Set(AUDIT_ENTRIES.map((e) => e.object))).sort()

/** Fixture date ranges. No ambient clock: every bound is a seeded string. */
interface DateRange {
  readonly id: string
  readonly label: string
  readonly from: string
}

const DATE_RANGES: readonly DateRange[] = [
  { id: ANY, label: 'Every entry in the fixture', from: '' },
  { id: 'since-16', label: 'From 2026-08-16', from: '2026-08-16' },
  { id: 'since-17', label: 'From 2026-08-17', from: '2026-08-17' },
]

/* ------------------------------------------------------------------ *
 * Access. Both controls come from L46121 with their own allowed roles.
 * Nothing here reads a module-level `roles_allowed` — for MOD-SA-18 that
 * array ranges from two roles (L2442) to six including tenant-side mirrored
 * readers (L46125), and D16 makes it authoritative nowhere.
 * ------------------------------------------------------------------ */
const DOMAIN_STATE = emptyDomainState(scenarioRunId('MOD-SA-18-fixture'))

const ACTOR_OF_RECORD = 'person-fixture-audit-reader'

function accessContext(roleId: RoleId) {
  return {
    state: DOMAIN_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      // A platform-domain role holds no ambient tenant. Record-level tenant
      // content is reachable only inside a named access class.
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
    actorOfRecord: ACTOR_OF_RECORD,
  } as const
}

export interface ControlDefinition {
  readonly id: string
  readonly label: string
  readonly effect: string
  readonly allowedRoles: readonly RoleId[]
  readonly sourceRefs: readonly string[]
  readonly refusalReasons?: Readonly<Partial<Record<RoleId, string>>>
  readonly defaultRefusalReason: string
}

/** The two controls the frozen source defines for MOD-SA-18, both at L46121. */
export const MODULE_CONTROLS = [
  {
    id: 'audit-filters',
    label: 'Filter the log',
    effect:
      'Searches the append-only log on event class, actor, tenant, object and date range. No edit or delete affordance anywhere, not even greyed (L46121).',
    allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
    sourceRefs: ['L46121'],
    defaultRefusalReason:
      'All four console roles hold the filters (L46121); no refusal reason applies.',
  },
  {
    id: 'class-filtered-export',
    label: 'Request a class-filtered export',
    effect:
      'Produces a file for external retention; the export action is itself audited (L46121).',
    allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
    sourceRefs: ['L46121'],
    refusalReasons: {
      PLATFORM_ENGINEER:
        'The class-filtered export names the Root Super Admin and the Admin only (L46121). The Platform Engineer reads the log and exports nothing from it.',
      SUPPORT:
        'The class-filtered export names the Root Super Admin and the Admin only (L46121). The Support role reads its own session records and exports nothing.',
    },
    defaultRefusalReason:
      'The class-filtered export names the Root Super Admin and the Admin only (L46121).',
  },
] as const satisfies readonly ControlDefinition[]

function controlById(id: string): ControlDefinition {
  const found = MODULE_CONTROLS.find((c) => c.id === id)
  if (!found) throw new Error(`Unknown MOD-SA-18 control: ${id}`)
  return found
}

function decisionFor(control: ControlDefinition, roleId: RoleId): PermissionDecision {
  return evaluateAccess(
    { action: control.id, allowedRoles: control.allowedRoles, sourceRefs: control.sourceRefs },
    accessContext(roleId),
  )
}

function mayAct(control: ControlDefinition, roleId: RoleId): boolean {
  return permitsAction(decisionFor(control, roleId))
}

function refusalReason(control: ControlDefinition, roleId: RoleId): string {
  return control.refusalReasons?.[roleId] ?? control.defaultRefusalReason
}

/* ------------------------------------------------------------------ *
 * The workflows the source defines that touch this module. The extract
 * carries no `workflows` row with a `module_id`, so these were matched by
 * NAME and by LINE PROXIMITY to §23.18.
 * ------------------------------------------------------------------ */
export interface ModuleWorkflow {
  readonly name: string
  readonly match: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  readonly builtAs: string
}

export const MODULE_WORKFLOWS = [
  {
    name: 'An operator change and its audit event in one transaction',
    match: 'line proximity — §23.18 audit commitment, L46094',
    actor: 'Console operator',
    trigger: 'An operator performs an administrative or operational change',
    terminalStates: [
      'both committed and classified',
      'transaction rolled back and the action does not happen',
    ],
    builtAs:
      'The export below writes its own audit entry in the same transaction as the export request; the failure path is the STATE-12 treatment and the FB-SA-03 panel.',
  },
  {
    name: 'A role reading the audit log',
    match: 'name match, L74182 — the same workflow named twice in the extract',
    actor: 'Any reading identity',
    trigger: 'The identity opens the audit view on its surface',
    terminalStates: ['Results render with class filters showing only permitted classes'],
    builtAs:
      'The filter panel below, whose class options are the classes this role may read — see the role note beside the class filter.',
  },
  {
    name: 'An audit-store outage',
    match: 'name match, L74896',
    actor: 'Platform monitoring',
    trigger: 'Health monitoring reports the audit store as unhealthy, or a write fails',
    terminalStates: [
      'Halt-class actions refused with unchanged state',
      'Device queues drain and commit their pairs on restoration',
    ],
    builtAs:
      'The STATE-12 failure treatment and the STATE-13 recovery treatment on the state strip above, plus the FB-SA-03 panel.',
  },
] as const satisfies readonly ModuleWorkflow[]

/* ------------------------------------------------------------------ *
 * D15 — what the source does not define. Named, never invented.
 * ------------------------------------------------------------------ */
export interface UnspecifiedItem {
  readonly what: string
  readonly why: string
}

export const UNSPECIFIED_IN_SOURCE = [
  {
    what: 'The event class list itself',
    why: 'The frozen source gives two irreconcilable figures for the number of named classes (L46178 versus L47835) and never enumerates them. The filter above is driven by a provisional fixture seeded only with classes the source names, and no size is stated anywhere on this screen (D4).',
  },
  {
    what: 'Which classes are "engineering classes" for the Platform Engineer',
    why: 'L74223 grants the Platform Engineer a read of the platform log "for engineering classes" and never says which classes those are. This prototype does not guess the boundary; the Platform Engineer sees the whole provisional list with this gap named.',
  },
  {
    what: 'SB-RBAC-04, the enforcement-parity view',
    why: 'Named as a screen of this module at L20953 and never described. No layout, no columns, no controls and no acceptance criteria were extracted for it, so nothing is drawn for it.',
  },
  {
    what: 'AC-SA-18-03, AC-SA-18-07 and AC-SA-18-09',
    why: 'Indexed in the module’s acceptance set and never extracted (census C24). Three of this module’s ten criteria are therefore unknown to this build.',
  },
  {
    what: 'FUNC-SA-18-01-A1 through FUNC-SA-18-04-A4',
    why: 'Nine function identifiers are listed on the module row (L46125) with no definition anywhere in the extract. Nine unknown functions is not nine controls, and none was drawn.',
  },
  {
    what: 'An audit-entry detail view on this surface',
    why: 'The only audit detail view in the source is SB-AUD-03 (L74153), which belongs to the Delivery Operations Hub, not to this console. No detail view is defined for SCR-SA-25, so a row here expands to nothing.',
  },
  {
    what: 'The export file format, its delivery path and who advances it',
    why: 'OBJ-SA-AUDITEXPORT closes at requested, generated and delivered (L46141), but the source names no format, no destination, no delivery mechanism and no actor for the two transitions. The fixture advances on an explicit click and claims nothing about how a real one would.',
  },
  {
    what: 'The audit retention value and any control over it',
    why: 'AC-SA-18-08 requires audit retention never to be shorter than the tenant data it evidences, and names FB-SA-10 as the enforcement point — but no retention value and no retention control belongs to this module. Retention-value changes are a critical-class action elsewhere on this console.',
  },
] as const satisfies readonly UnspecifiedItem[]

/* ------------------------------------------------------------------ *
 * Rendering.
 * ------------------------------------------------------------------ */
const MODULE = saModuleById('MOD-SA-18')

const AUDIT_INVARIANT: SaInvariantDefinition = (() => {
  const found = SA_INVARIANTS.find((i) => i.id === 'one-transaction-audit-guarantee')
  if (!found) throw new Error('The one-transaction audit guarantee is missing from SA_INVARIANTS.')
  return found
})()

type AggregateVariant = 'current' | 'stale' | 'unavailable' | 'reading' | 'empty'

/**
 * The aggregate reads the same rows the table reads, so it cannot assert a
 * count over records the same screen says do not exist. STATE-01 is that case
 * and gets its own rendering: the empty state is not "no match for the current
 * filter", and it is not a zero either.
 */
function aggregateVariant(state: ScreenStateId): AggregateVariant {
  switch (state) {
    case 'STATE-01':
      return 'empty'
    case 'STATE-02':
    case 'STATE-13':
      return 'reading'
    case 'STATE-08':
      return 'stale'
    case 'STATE-12':
      return 'unavailable'
    default:
      return 'current'
  }
}

function Section({
  id,
  heading,
  children,
}: {
  readonly id: string
  readonly heading: string
  readonly children: React.ReactNode
}) {
  return (
    <section id={id} aria-label={heading} className="mt-8">
      <h2 className="text-lg font-semibold">{heading}</h2>
      {children}
    </section>
  )
}

export interface PlatformAuditScreenProps {
  readonly initialRole?: SaConsoleRoleToken
  readonly initialScreenState?: ScreenStateId
}

export function PlatformAuditScreen({
  initialRole = 'ROLE-PLAT-ROOT',
  initialScreenState = 'STATE-03',
}: PlatformAuditScreenProps) {
  const [roleToken, setRoleToken] = useState<SaConsoleRoleToken>(initialRole)
  const [screenStateId, setScreenStateId] = useState<ScreenStateId>(initialScreenState)
  const [classFilter, setClassFilter] = useState<string>(ANY)
  const [actorFilter, setActorFilter] = useState<string>(ANY)
  const [tenantFilter, setTenantFilter] = useState<string>(ANY)
  const [objectFilter, setObjectFilter] = useState<string>(ANY)
  const [rangeFilter, setRangeFilter] = useState<string>(ANY)
  const [exportState, setExportState] = useState<AuditExportState | null>(null)
  const [exportEntries, setExportEntries] = useState<readonly AuditEntry[]>([])

  const role = consoleRoleView(roleToken)
  const roleId = role.roleId
  const readableClasses = readableClassesFor(roleId)
  const readableClassIds = new Set(readableClasses.map((c) => c.id))

  const exportControl = controlById('class-filtered-export')
  const filterControl = controlById('audit-filters')
  const mayExport = mayAct(exportControl, roleId)
  const variant = aggregateVariant(screenStateId)

  // A control that ignores the screen state is a dead control. STATE-06 is
  // read-only, so nothing is submitted from it; under STATE-12 the audit store
  // cannot be read, and an export writes its own audit entry — an action that
  // cannot be audited does not happen (AC-SA-18-02, FB-SA-03 L46191).
  const submissionBlocked: string | null =
    screenStateId === 'STATE-06'
      ? 'This screen is in its read-only state. Nothing is submitted from it, so the export request is refused here rather than left live.'
      : screenStateId === 'STATE-12'
        ? 'The audit store could not be read, and an export writes its own audit entry in the same transaction. An action that cannot be audited does not happen (AC-SA-18-02, FB-SA-03 L46191), so nothing may be submitted from this state.'
        : null

  // L74224: Support reads its OWN session records — the actor bound, not just
  // the class bound. Every other role's scope is the class bound alone.
  const scoped = [...AUDIT_ENTRIES, ...exportEntries].filter((e) => {
    if (!readableClassIds.has(e.classId)) return false
    if (roleId === 'SUPPORT') return e.actor === 'Sophia'
    return true
  })

  const range = DATE_RANGES.find((r) => r.id === rangeFilter)
  const rows = scoped.filter(
    (e) =>
      (classFilter === ANY || e.classId === classFilter) &&
      (actorFilter === ANY || e.actor === actorFilter) &&
      (tenantFilter === ANY || e.tenant === tenantFilter) &&
      (objectFilter === ANY || e.object === objectFilter) &&
      (range === undefined || range.from === '' || e.occurredAt >= range.from),
  )

  const filtered =
    classFilter !== ANY ||
    actorFilter !== ANY ||
    tenantFilter !== ANY ||
    objectFilter !== ANY ||
    rangeFilter !== ANY

  const tableRows: readonly TableRow[] =
    screenStateId === 'STATE-01'
      ? []
      : rows.map((e) => ({
          id: e.id,
          class: (
            <span data-testid="audit-entry-class">{auditEventClass(e.classId)?.name ?? e.classId}</span>
          ),
          actor: `${e.actor} (${roleName(e.actorRole)})`,
          tenant: e.tenant ?? 'Platform — no tenant',
          object: e.object,
          occurredAt: e.occurredAt,
          state: <span data-testid="audit-entry-state">{e.state}</span>,
          mirrored: e.mirrored ? 'Mirrored to the tenant stream' : 'Platform stream only',
        }))

  function requestExport() {
    const receiptId = `AUD-BB-EXP-${String(exportEntries.length + 1).padStart(4, '0')}`
    setExportState('requested')
    // AC-SA-18-01 / L46121: the export action is itself audited, and the
    // action and its audit event commit together. In this prototype that is
    // one state update — the entry appears at the same moment the export does,
    // never one without the other.
    setExportEntries((prev) => [
      ...prev,
      {
        id: receiptId,
        classId: 'audit-export',
        actor: role.label === roleName('ROOT_SUPER_ADMIN') ? 'Aisha' : 'Noah',
        actorRole: roleId,
        tenant: null,
        object: 'OBJ-SA-AUDITEXPORT',
        occurredAt: AS_OF_CURRENT,
        state: 'committed',
        mirrored: false,
      },
    ])
  }

  function advanceExport() {
    setExportState((prev) => {
      if (prev === 'requested') return 'generated'
      if (prev === 'generated') return 'delivered'
      return prev
    })
  }

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotations, never route keys (D1): SCR-SA-25 “Platform audit search and export”
        (L42817, L46121) · SB-SA-18 (L46121) · SB-RBAC-04 “the enforcement-parity view” (L20953) ·
        SCR-SA-21 in the second numbering scheme (L48750). This route is keyed on the module slug.
      </p>

      <Section id="sa18-view" heading="View">
        <div className="mt-3 flex flex-wrap gap-4">
          <Select
            label="Console role (view switcher, not a sign-on)"
            value={roleToken}
            options={CONSOLE_ROLE_VIEWS.map((r) => ({ value: r.token, label: `${r.label} — ${r.token}` }))}
            onChange={(v) => {
              const next = CONSOLE_ROLE_VIEWS.find((r) => r.token === v)
              if (next) setRoleToken(next.token)
            }}
          />
          <Select
            label="Screen state"
            value={screenStateId}
            options={APPLICABLE_SCREEN_STATES.map((s) => ({
              value: s.id,
              label: `${s.id} — ${s.name}`,
            }))}
            onChange={(v) => {
              const next = APPLICABLE_SCREEN_STATES.find((s) => s.id === v)
              if (next) setScreenStateId(next.id)
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Twelve applicable states — the thirteen less the frontline-only STATE-07, which only the
          Frontline Worker Application has. Under STATE-11 every artificial-intelligence model is
          unavailable and this module keeps working in full: nothing below consults a model
          (AC-SA-000-09, L42887).
        </p>
      </Section>

      <div className="mt-6">
        <ScreenStateBoundary
          state={screenStateId}
          surface="SURF-SA"
          detail={{
            objectLabel: 'platform audit entries',
            whatCreatesIt:
              'An administrative or operational change anywhere on this console creates one, in the same transaction as the change (workflow §23.18, L46094).',
            fieldLabel: 'Date range',
            rule: 'The range must fall inside the fixture window, because there is no store behind this screen to read a wider one from.',
            permittedFormat: 'One of the seeded ranges offered in the filter below.',
            decision: {
              ...decisionFor(exportControl, 'SUPPORT'),
              explanation:
                'The class-filtered export names the Root Super Admin and the Admin only (L46121). The Support role reads its own session records here and exports nothing — the refusal is stated, not hidden behind a missing button.',
            },
            readOnlyCause:
              'This module is read-and-export only for every console role. There is no write path to an audit entry on any surface, for any account (AC-SA-18-04, AC-SEC-701 L104169).',
            asOfLabel: `as of ${AS_OF_STALE} (${STALE_AGE}, fixture value)`,
            originLabel: 'seeded platform audit fixture',
            commandState: 'queued',
            degradedMissing:
              'Model-assisted grouping of related entries is missing.',
            degradedRemaining:
              'Filtering, reading and exporting are deterministic and continue unchanged.',
            unavailableCause:
              'Every artificial-intelligence model is unavailable in this state. This module reads and exports a log: the filters, the results and the export below all keep working, because none of them consults a model (AC-SA-000-09, L42887).',
            failureWhat:
              'The audit store could not be read — the FB-SA-03 and audit-store-outage path (L46191, L74896).',
            wasWritten: false,
            nextStep:
              'Nothing was written and nothing was exported. Retry the read; an action that cannot be audited does not happen (AC-SA-18-02).',
            recoveryProgress:
              'Re-reading the audit stream. The aggregate below is shown as being read, never as a zero.',
          }}
        />
      </div>

      <Section id="sa18-guarantee" heading="What this module is">
        <div data-testid="invariant-chip-region" className="mt-3">
          <InvariantChip invariant={AUDIT_INVARIANT} />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The one-transaction audit guarantee is the sixth ENFORCED invariant, and it is this
          module’s central promise — but its ENFORCED rendering lives on{' '}
          <Link href="/super-admin/platform-settings/" className="text-[var(--color-primary)] underline">
            Platform Settings
          </Link>{' '}
          (MOD-SA-07), so the promise this screen depends on is displayed from another module’s
          screen. AC-SA-18-01: no code path exists where an administrative change commits and its
          audit event does not. AC-SA-18-02 and FB-SA-03: an audit write that cannot commit refuses
          the action outright — there is no queued-audit path and no client-side buffer, so an action
          that cannot be audited does not happen.
        </p>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The log is append-only as a stated design property (prototype — there is no store behind
          this screen). AC-SA-18-10 defers a V2 hardening of the immutability guarantee and does not
          claim it at V1; the terms that criterion uses are deliberately not repeated anywhere in
          this interface (D10, AC-SCOPE-033 L2612).
        </p>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Anonymisation operates on the identity-resolution layer and never rewrites an audit row
          (D11, L8368) — the only reading that keeps AC-SA-17-06 and AC-SA-18-04 both true.
        </p>
      </Section>

      <Section id="sa18-entry-state" heading="The audit entry has exactly one state">
        <div className="mt-3">
          <StatusPill tone="ok" icon="✅" label="committed" />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          OBJ-SA-AUDITENTRY closes at <strong>committed</strong> alone (L46141), because no other
          state exists by construction — no draft, no edited, no deleted.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Decision D3: the frozen source carries three vocabularies for this object. “written”
          (L21299) and “committed / refused / parked” (L74127) are both refused here. Parked cannot
          coexist with the one-transaction guarantee: FB-SA-03 (L46191) states there is no
          queued-audit path and no client-side buffer, so an entry is never waiting to be committed.
        </p>
      </Section>

      <Section id="sa18-aggregate" heading="Entries in view">
        <div
          data-testid="entries-aggregate"
          className="mt-3 rounded border border-[var(--color-border)] p-3 text-sm"
        >
          {variant === 'current' ? (
            <p>
              <strong>
                {tableRows.length === 0
                  ? 'No entry matches the current filter'
                  : `${tableRows.length} matching`}
              </strong>{' '}
              — as of {AS_OF_CURRENT} (fixture value, not a live clock).
            </p>
          ) : null}
          {variant === 'stale' ? (
            <p>
              <strong>
                {tableRows.length === 0
                  ? 'No entry matches the current filter'
                  : `${tableRows.length} matching`}
              </strong>{' '}
              — as of {AS_OF_STALE}, {STALE_AGE} (fixture value). Shown with its age, never as though
              it were current.
            </p>
          ) : null}
          {variant === 'empty' ? (
            <p>
              <strong>No platform audit entry has been recorded yet</strong> — as of {AS_OF_CURRENT}{' '}
              (fixture value, not a live clock). The aggregate reads the rows the table below reads,
              so it says what that table says rather than counting records this screen states do not
              exist.
            </p>
          ) : null}
          {variant === 'reading' ? (
            <p>
              <strong>Being read</strong> — the count has not arrived. A count that has not arrived is
              a placeholder, never the number nought.
            </p>
          ) : null}
          {variant === 'unavailable' ? (
            <p>
              <strong>Unavailable</strong> — the audit aggregate could not be produced. It is not
              rendered as a zero and not left blank (AC-SA-01-03, L43070; FB-SA-01).
            </p>
          ) : null}
        </div>
      </Section>

      <Section id="sa18-filters" heading={filterControl.label}>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {filterControl.effect} All four console roles hold this control (L46121) — it is decided
          per control through the policy evaluator, never from the module’s own roles list, which
          for this module ranges from two roles (L2442) to six (L46125) and is authoritative nowhere
          (D16).
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Select
            label="Event class"
            value={classFilter}
            options={[
              { value: ANY, label: 'Every class this role may read' },
              ...readableClasses.map((c) => ({ value: c.id, label: c.name })),
            ]}
            onChange={setClassFilter}
          />
          <Select
            label="Actor"
            value={actorFilter}
            options={[
              { value: ANY, label: 'Any actor' },
              ...ACTOR_OPTIONS.map((a) => ({ value: a, label: a })),
            ]}
            onChange={setActorFilter}
          />
          <Select
            label="Tenant"
            value={tenantFilter}
            options={[
              { value: ANY, label: 'Any tenant' },
              ...TENANT_OPTIONS.map((t) => ({ value: t, label: t })),
            ]}
            onChange={setTenantFilter}
          />
          <Select
            label="Object"
            value={objectFilter}
            options={[
              { value: ANY, label: 'Any object' },
              ...OBJECT_OPTIONS.map((o) => ({ value: o, label: o })),
            ]}
            onChange={setObjectFilter}
          />
          <Select
            label="Date range"
            value={rangeFilter}
            options={DATE_RANGES.map((r) => ({ value: r.id, label: r.label }))}
            onChange={setRangeFilter}
          />
        </div>

        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The class list is a fixture, not a closed set. {CLASS_FIXTURE_LABEL}
        </p>

        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {roleId === 'SUPPORT'
            ? 'This role reads its own session records and nothing else (L74224), so the class filter offers one class and the results are bound to this actor’s own sessions.'
            : null}
          {roleId === 'PLATFORM_ENGINEER'
            ? 'This role reads the platform log “for engineering classes” (L74223) — and the source never says which classes those are. That boundary is unspecified in source, so this prototype does not draw one: the whole provisional list is offered and the gap is named in the panel below, rather than guessing a permission boundary that would read back as a requirement.'
            : null}
          {roleId === 'ROOT_SUPER_ADMIN' || roleId === 'ADMIN'
            ? 'This role reads every class in the provisional fixture. Results render with class filters showing only permitted classes (L74182).'
            : null}
        </p>

        <ul className="mt-3 space-y-1 text-xs text-[var(--color-ink-subtle)]">
          {readableClasses.map((c) => (
            <li key={c.id}>
              {c.name} — {c.sourceRef}
              {c.isAccessClass ? ' · a named access class' : ''}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa18-results" heading="Results">
        <div className="mt-3">
          <Table
            caption="Platform audit entries matching the current filter"
            columns={[
              { key: 'id', header: 'Entry' },
              { key: 'class', header: 'Event class' },
              { key: 'actor', header: 'Actor' },
              { key: 'tenant', header: 'Tenant' },
              { key: 'object', header: 'Object' },
              { key: 'occurredAt', header: 'When' },
              { key: 'state', header: 'State' },
              { key: 'mirrored', header: 'Mirroring' },
            ]}
            rows={tableRows}
            filtered={filtered}
            loading={screenStateId === 'STATE-02'}
            {...(screenStateId === 'STATE-12'
              ? { error: 'The audit store could not be read (FB-SA-03, L46191).' }
              : {})}
            emptyState={{
              title: 'No platform audit entry has been recorded yet.',
              whatCreatesIt:
                'An administrative or operational change anywhere on this console writes one, in the same transaction as the change itself.',
            }}
          />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The Object column names an object; it does not reach it. No link on this console resolves
          to record-level tenant content — that needs a named access class (AC-SA-000-07 L42885,
          AC-SEC-801 L104316). The session-request form is the only route:{' '}
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            request a support session
          </Link>
          .
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          AC-SA-18-05: every cross-tenant access event mirrors into the affected tenant’s own audit
          stream, shown in the Mirroring column. AC-SA-18-06: the tenant’s Platform Access History
          reads these same records rather than a distinct view of them.
        </p>
      </Section>

      <Section id="sa18-export" heading={exportControl.label}>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {exportControl.effect}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {mayExport ? (
            submissionBlocked !== null ? (
              <Button disabledReason={submissionBlocked}>Request a class-filtered export</Button>
            ) : exportState === null ? (
              <Button onClick={requestExport}>Request a class-filtered export</Button>
            ) : (
              <Button disabledReason="An export is already in flight. Its state is shown beside this control; a second request would be a second export, not a retry.">
                Request a class-filtered export
              </Button>
            )
          ) : (
            <ProhibitionNotice
              rendering={{
                kind: 'disabled-with-reason',
                label: 'Request a class-filtered export',
                reason: refusalReason(exportControl, roleId),
              }}
            />
          )}
          {exportState !== null ? (
            <>
              <span className="text-sm">
                Export state:{' '}
                <strong data-testid="export-state" className="font-semibold">
                  {exportState}
                </strong>
              </span>
              {exportState !== 'delivered' ? (
                submissionBlocked !== null ? (
                  <Button variant="secondary" disabledReason={submissionBlocked}>
                    Advance the export fixture
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={advanceExport}>
                    Advance the export fixture
                  </Button>
                )
              ) : null}
            </>
          ) : null}
        </div>
        {exportState !== null ? (
          <p role="status" className="mt-3 max-w-prose text-sm">
            The export request wrote its own audit entry in the same transaction as the request, and
            that entry is in the results above. Included classes: the current class filter, plus the
            three named access classes — no filter and no export can omit an access class (AC-4873,
            L107886).
          </p>
        ) : null}
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          OBJ-SA-AUDITEXPORT closes at requested, generated and delivered (L46141). These are
          rendered labels on fixture data that advance only on an explicit click, with the state name
          always visible — nothing here produces a file, and no delivery is claimed.
        </p>
        <div className="mt-3">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'There is no control to exclude a named access class from an export, and none is drawn: no filter or export can omit a class (AC-4873, L107886).',
            }}
          />
        </div>
        <div className="mt-2">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'There is no destination, endpoint or delivery-address field here. The source names no outbound destination for this export, and inventing one would ship a fiction that reads back as a requirement.',
            }}
          />
        </div>
      </Section>

      <Section id="sa18-prohibitions" heading="What does not exist here">
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Three renderings, applied by rule (spec §3). The two below are ABSENT: the action exists
          for nobody, including the root, so nothing is drawn and a note sits where a control would
          be. The export refusal above is DISABLED WITH A NAMED REASON, because that action does
          exist on this platform — just not for that role. The third rendering, the class badge that
          replaces an action bar, does not appear on this screen: no critical-class action belongs to
          this module, and drawing the badge anyway would assert a routing the source does not make.
        </p>
        <div className="mt-3 space-y-2">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'There is no edit or delete affordance on an audit entry anywhere on this screen, not even greyed (L46121, AC-SA-18-04). AC-SEC-701 (L104169) extends that to the root account: no surface, role or administrative path offers either.',
            }}
          />
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'There is no draft, park or hold affordance on an audit entry. An entry is committed or it does not exist, and the action that would have written it is refused instead (FB-SA-03, L46191).',
            }}
          />
        </div>
      </Section>

      <Section id="sa18-workflows" heading="The workflows this module carries">
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Matched by name and line proximity: the extract carries no workflow row with a module id.
        </p>
        <ul className="mt-3 space-y-3">
          {MODULE_WORKFLOWS.map((w) => (
            <li key={w.name} className="rounded border border-[var(--color-border)] p-3 text-sm">
              <p className="font-medium">{w.name}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{w.match}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">
                {w.actor} · {w.trigger}
              </p>
              <p className="mt-1 text-[var(--color-ink-muted)]">
                Terminal states: {w.terminalStates.join(' · ')}
              </p>
              <p className="mt-1 text-[var(--color-ink-muted)]">Built as: {w.builtAs}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa18-access-classes" heading="The three named access classes">
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every one of them mirrors into the tenant’s own stream, and no filter or export can omit a
          class (AC-4873, L107886). They are the only route to record-level tenant content anywhere
          on this console; there is no ambient browsing here or on any other module screen.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      </Section>

      <Section id="sa18-unspecified" heading="Unspecified in source">
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Named, not invented. A plausible control drawn to fill one of these gaps would read back as
          a requirement (D15).
        </p>
        <ul className="mt-3 space-y-3">
          {UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.what} className="rounded border border-dashed border-[var(--color-border)] p-3 text-sm">
              <p className="font-medium">{u.what}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{u.why}</p>
            </li>
          ))}
        </ul>
      </Section>
    </SaConsoleShell>
  )
}
