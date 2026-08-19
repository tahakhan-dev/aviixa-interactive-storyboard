import type { ScreenStateId } from '@/ui/screen-state'
import type { SaAccessClassId } from '@/surfaces/sa/access-classes'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import type { SupportSessionBanner } from '@/ui/doh/BannerRegion'
import {
  SEEDED_ANNOUNCEMENTS,
  SEEDED_PLATFORM_ACCESS_SESSIONS,
  supportSessionBanners,
} from '../banner-fixtures'
import type { TenantRoleId } from '../HubShell'

/**
 * MOD-DOH-13 — Tenant View of Platform Administration. Seeded fixture data for
 * `SCR-DOH-22`, Platform Access History and announcements, plus the
 * post-session report panel.
 *
 * THE MODULE OWNS NO BUSINESS OBJECT. Its identity card says so outright:
 * "a filtered projection of `OBJ-DOH-AUDIT`; no new operational object". So
 * this file holds a READ-THROUGH view over a seeded audit fixture and exactly
 * one command — End session — and nothing else.
 *
 * HOW THE THREE ACCESS CLASSES ARE SCOPED TO THIS SCREEN WITHOUT TOUCHING THE
 * SHARED ARRAY. `SEEDED_PLATFORM_ACCESS_SESSIONS` is ONE array read by every
 * Hub route, and the shell's own copy states that one class is seeded open
 * while the other two carry no End-session control BY CONSTRUCTION rather than
 * by configuration. Flipping `open` on that array to exercise all three here
 * would make that sentence false on `/hub/` and on every module route at once.
 * So this module reads the same array, unchanged, and decides FOR ITSELF which
 * classes it banners — `SCREEN_BANNERED_CLASSES` below. The `open` flags stay
 * exactly as the shell seeded them, and the union is still built by the single
 * constructor `supportSessionBanners`, so no second construction of it exists.
 *
 * Determinism: every value below is a literal. Nothing reads a clock.
 */

/** Registry order, so every derived role list comes out in one order. */
const TENANT_ROLE_ORDER = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly TenantRoleId[]

/* ------------------------------------------------------------------ *
 * The support session's own state vocabulary, from the module identity
 * card. Four values, and there is no fifth: a session that ends has a
 * recorded CAUSE, which is what reconciliation asserts.
 * ------------------------------------------------------------------ */

export type SupportSessionState =
  | 'open'
  | 'ended_by_time_box'
  | 'ended_by_tenant'
  | 'ended_by_engineer'

export const SUPPORT_SESSION_STATES = [
  'open',
  'ended_by_time_box',
  'ended_by_tenant',
  'ended_by_engineer',
] as const satisfies readonly SupportSessionState[]

type MissingFromSessionStates = Exclude<
  SupportSessionState,
  (typeof SUPPORT_SESSION_STATES)[number]
>
const _sessionStatesExhaustive: MissingFromSessionStates extends never ? true : never = true
void _sessionStatesExhaustive

export const SESSION_STATE_LABEL: Readonly<Record<SupportSessionState, string>> = {
  open: 'Open',
  ended_by_time_box: 'Ended — the platform-side time box expired',
  ended_by_tenant: 'Ended — by this workspace, from the banner',
  ended_by_engineer: 'Ended — closed by the engineer',
}

export type AnnouncementState = 'active' | 'expired'

export const ANNOUNCEMENT_STATES = [
  'active',
  'expired',
] as const satisfies readonly AnnouncementState[]

type MissingFromAnnouncementStates = Exclude<
  AnnouncementState,
  (typeof ANNOUNCEMENT_STATES)[number]
>
const _announcementStatesExhaustive: MissingFromAnnouncementStates extends never ? true : never =
  true
void _announcementStatesExhaustive

/* ------------------------------------------------------------------ *
 * The three access classes as this screen exercises them.
 * ------------------------------------------------------------------ */

/**
 * All three, deliberately, because `AC-DOH-13-1` requires all three to appear
 * here mirrored identically — and this is the screen the shell's own copy
 * points at when it says the other two classes are exercised later in the
 * slice. This list is THIS SCREEN'S, not the shared array's: the shared
 * array's `open` flags are read below and left exactly as they are.
 */
export const SCREEN_BANNERED_CLASSES = [
  'normal-support-session',
  'compliance-emergency-path',
  'jbs-access-grant',
] as const satisfies readonly SaAccessClassId[]

type MissingFromBanneredClasses = Exclude<
  SaAccessClassId,
  (typeof SCREEN_BANNERED_CLASSES)[number]
>
const _banneredClassesExhaustive: MissingFromBanneredClasses extends never ? true : never = true
void _banneredClassesExhaustive

export interface AccessClassPanel {
  readonly accessClass: SaAccessClassId
  readonly name: string
  /** Who opened it and when — the banner names both, and this is that data. */
  readonly engineer: string
  readonly startedAt: string
  readonly reason: string
  readonly ticketReference: string
  /** Whether the TENANT holds an End-session control on this class (D13). */
  readonly tenantMayEnd: boolean
  /** What this class carries INSTEAD, where the tenant may not end it. */
  readonly insteadOfEndSession: string
  readonly writeCapable: boolean
  readonly timeBox: string
}

export const ACCESS_CLASS_PANELS = [
  {
    accessClass: 'normal-support-session',
    name: 'The normal support session',
    engineer: 'Sophia',
    startedAt: '18 August, 10:02 tenant time',
    reason: 'Investigating Summary render failure',
    ticketReference: 'SUP-2026-4471',
    tenantMayEnd: true,
    insteadOfEndSession:
      'Not applicable — this is the one class the tenant ends itself, and the control is a real control rather than a notice.',
    writeCapable: false,
    timeBox: 'Two hours by default, set platform-side.',
  },
  {
    accessClass: 'compliance-emergency-path',
    name: 'The compliance-emergency path',
    engineer: 'Aisha and Noah, dual-authorised',
    startedAt: '20 August, 14:10 tenant time',
    reason: 'Regulator-directed retrieval under a compliance hold',
    ticketReference: 'CMP-2026-0032',
    tenantMayEnd: false,
    insteadOfEndSession:
      'An automatic post-session report to this workspace, stating exactly what was accessed. No control suppresses that report, and none exists to be disabled.',
    writeCapable: true,
    timeBox: 'Bounded by the authorisation itself, platform-side.',
  },
  {
    accessClass: 'jbs-access-grant',
    name: 'The JBS access grant',
    engineer: 'Marcus, delivery partner',
    startedAt: '19 August, 09:30 tenant time',
    reason: 'Agreed onboarding review of the Ardenfield configuration',
    ticketReference: 'JBS-2026-0117',
    tenantMayEnd: false,
    insteadOfEndSession:
      'The grant is scoped, time-boxed, reason-linked, audited and mirrored to this workspace. JBS holds no standing access by default, so the grant lapsing is the bound.',
    writeCapable: false,
    timeBox: 'The grant’s own window, set when it was granted.',
  },
] as const satisfies readonly AccessClassPanel[]

type MissingFromPanels = Exclude<SaAccessClassId, (typeof ACCESS_CLASS_PANELS)[number]['accessClass']>
const _panelsExhaustive: MissingFromPanels extends never ? true : never = true
void _panelsExhaustive

export function accessClassPanel(id: SaAccessClassId): AccessClassPanel {
  const found = ACCESS_CLASS_PANELS.find((p) => p.accessClass === id)
  if (found === undefined) throw new Error(`Unknown access class panel: ${id}`)
  return found
}

/** The shared registry's own description of each class, read and not restated. */
export function accessClassDescription(id: SaAccessClassId): string {
  const found = ACCESS_CLASSES.find((c) => c.id === id)
  if (found === undefined) throw new Error(`Unknown access class: ${id}`)
  return found.description
}

/**
 * The banners THIS SCREEN draws, built by the ONE constructor of the
 * `SupportSessionBanner` union.
 *
 * Note what is read and what is not: the shared array supplies each class's
 * seeded MESSAGE, so the wording never drifts between the shell and this
 * screen; its `open` flag is deliberately NOT consulted here, because this
 * screen's own reason for showing a class is `AC-DOH-13-1` rather than the
 * shell's seeded scenario. The array itself is untouched — the shell still
 * banners exactly the one class it seeded open, and the sentence in its copy
 * about the other two stays true everywhere else in the Hub.
 */
export function screenAccessBanners(
  endedClasses: readonly SaAccessClassId[],
  onEndSession: () => void,
): readonly SupportSessionBanner[] {
  const sessions = SEEDED_PLATFORM_ACCESS_SESSIONS.filter(
    (s) =>
      SCREEN_BANNERED_CLASSES.some((c) => c === s.accessClass) &&
      !endedClasses.includes(s.accessClass),
  )
  return supportSessionBanners(sessions, onEndSession)
}

/** The announcement this workspace currently carries, read from the shell's seed. */
export const SCREEN_ANNOUNCEMENTS = SEEDED_ANNOUNCEMENTS

export const ANNOUNCEMENT_WINDOW = '21-22 August 2026, set by the client’s platform team'

/* ------------------------------------------------------------------ *
 * PLATFORM ACCESS HISTORY. A read-through view over a SEEDED AUDIT
 * FIXTURE, and the audit store itself is another slice's (D14) —
 * `AC-SA-18-06` requires this to read the SAME records the tenant can
 * query directly, so a second store built to make this slice
 * self-contained would be the defect, and would stay invisible until
 * the two had to be reconciled.
 * ------------------------------------------------------------------ */

/** SB-DOH-025 fixes these six columns. No seventh is invented, and the
 *  table below carries no duration, count or rate of anybody's work. */
export const HISTORY_COLUMNS = [
  'Timestamp',
  'Access class',
  'Platform identity',
  'Reason',
  'Ticket reference',
  'Scope',
] as const satisfies readonly string[]

export interface AccessHistoryRow {
  readonly auditId: string
  readonly at: string
  /** The date half of `at`, for the date filter. Recorded, never parsed. */
  readonly onDate: string
  readonly accessClass: SaAccessClassId
  readonly platformIdentity: string
  readonly reason: string
  readonly ticketReference: string
  readonly scope: string
  /** What the access actually did. Never collapsed into "accessed". */
  readonly what: string
}

/**
 * Seeded from the source's own worked example rather than invented: Sophia's
 * 18 August support session with its refused write attempt, the 20 August
 * dual-authorised compliance emergency, and a JBS grant under the same
 * discipline. Every row is a PLATFORM-SIDE act against this workspace, which
 * is the whole content of this projection.
 */
export const SEEDED_ACCESS_HISTORY = [
  {
    auditId: 'AUD-BB-000212',
    at: '18 August 2026, 10:02 tenant time',
    onDate: '2026-08-18',
    accessClass: 'normal-support-session',
    platformIdentity: 'Sophia, platform Support',
    reason: 'Investigating Summary render failure',
    ticketReference: 'SUP-2026-4471',
    scope: 'Read-only, this workspace, two-hour time box',
    what: 'Session opened. The banner was confirmed displayed and the session-open event committed to this workspace’s audit stream BEFORE any tenant content was read.',
  },
  {
    auditId: 'AUD-BB-000213',
    at: '18 August 2026, 10:19 tenant time',
    onDate: '2026-08-18',
    accessClass: 'normal-support-session',
    platformIdentity: 'Sophia, platform Support',
    reason: 'Investigating Summary render failure',
    ticketReference: 'SUP-2026-4471',
    scope: 'Read-only, run RUN-2026-08-14-A and its captures',
    what: 'Read the run and its captures. Every read is a row here within seconds of happening.',
  },
  {
    auditId: 'AUD-BB-000214',
    at: '18 August 2026, 10:33 tenant time',
    onDate: '2026-08-18',
    accessClass: 'normal-support-session',
    platformIdentity: 'Sophia, platform Support',
    reason: 'Investigating Summary render failure',
    ticketReference: 'SUP-2026-4471',
    scope: 'Refused — support access is read-only without exception at V1',
    what: 'A write was attempted and REFUSED. The refusal is recorded here as its own row, so a reader sees what was turned away and not only what succeeded.',
  },
  {
    auditId: 'AUD-BB-000215',
    at: '18 August 2026, 10:48 tenant time',
    onDate: '2026-08-18',
    accessClass: 'normal-support-session',
    platformIdentity: 'Sam, Supervisor, from the banner',
    reason: 'Ended by tenant — the line was busy',
    ticketReference: 'SUP-2026-4471',
    scope: 'Session termination, recorded with its cause',
    what: 'Ended by the tenant, eleven minutes in. Any signed-in tenant web user may do this; it was not the Tenant Admin who did.',
  },
  {
    auditId: 'AUD-BB-000217',
    at: '19 August 2026, 09:30 tenant time',
    onDate: '2026-08-19',
    accessClass: 'jbs-access-grant',
    platformIdentity: 'Marcus, JBS delivery partner',
    reason: 'Agreed onboarding review of the Ardenfield configuration',
    ticketReference: 'JBS-2026-0117',
    scope: 'Scoped, time-boxed and reason-linked; mirrored to this workspace',
    what: 'A granted delivery-partner access, appearing here exactly as any other platform access does. JBS holds no standing access by default.',
  },
  {
    auditId: 'AUD-BB-000218',
    at: '20 August 2026, 14:10 tenant time',
    onDate: '2026-08-20',
    accessClass: 'compliance-emergency-path',
    platformIdentity: 'Aisha and Noah, two senior platform staff',
    reason: 'Regulator-directed retrieval under a compliance hold',
    ticketReference: 'CMP-2026-0032',
    scope: 'Dual-authorised; the only class carrying write capability into this workspace',
    what: 'A compliance-emergency access, dual-authorised and entirely separate from support. It carries an automatic post-session report to this workspace, and no control suppresses that report.',
  },
] as const satisfies readonly AccessHistoryRow[]

/** Every access class appears in the seeded history — `AC-DOH-13-1`. */
type MissingFromHistory = Exclude<
  SaAccessClassId,
  (typeof SEEDED_ACCESS_HISTORY)[number]['accessClass']
>
const _historyCoversEveryClass: MissingFromHistory extends never ? true : never = true
void _historyCoversEveryClass

export interface HistoryFilterState {
  readonly accessClass: SaAccessClassId | null
  readonly onDate: string | null
}

export const NO_HISTORY_FILTERS: HistoryFilterState = { accessClass: null, onDate: null }

export function filterHistory(
  rows: readonly AccessHistoryRow[],
  filters: HistoryFilterState,
): readonly AccessHistoryRow[] {
  return rows.filter(
    (r) =>
      (filters.accessClass === null || r.accessClass === filters.accessClass) &&
      (filters.onDate === null || r.onDate === filters.onDate),
  )
}

export function historyDates(rows: readonly AccessHistoryRow[]): readonly string[] {
  return [...new Set(rows.map((r) => r.onDate))].sort()
}

/** The line SB-DOH-025 fixes above the table. Quoted, never reworded. */
export const HISTORY_INTRO_COPY =
  'This is a filtered view of your own audit log. Every platform-side access appears here.'

/* ------------------------------------------------------------------ *
 * The post-session report, `SCR-DOH-PAH-02` — generated automatically
 * after a compliance-emergency session, stating what was accessed.
 * ------------------------------------------------------------------ */

export interface PostSessionReport {
  readonly forAuditId: string
  readonly generatedAt: string
  readonly accessedItems: readonly string[]
  readonly authorisedBy: readonly string[]
}

export const SEEDED_POST_SESSION_REPORT: PostSessionReport = {
  forAuditId: 'AUD-BB-000218',
  generatedAt: '20 August 2026, 15:02 tenant time',
  accessedItems: [
    'The Ardenfield Works configuration record, read.',
    'Two closed run summaries from the week of 10 August, read.',
    'One retention-hold marker, written — this is the only platform access class with write capability into this workspace.',
  ],
  authorisedBy: ['Aisha, senior platform staff', 'Noah, senior platform staff'],
}

/* ------------------------------------------------------------------ *
 * The ten-row control matrix. VERIFIED AT SOURCE: header L29195, rows
 * L29197-L29206. Ten rows, not nine — the brief's convenience excerpt
 * stops at L29205 and omits the last row, which is recorded as a
 * finding rather than reconciled in silence.
 * ------------------------------------------------------------------ */

export type ControlStatus =
  | 'allowed'
  | 'allowed-with-conditions'
  | 'read-only'
  | 'explicitly-prohibited'
  | 'not-applicable'
  | 'unavailable'

export const CONTROL_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
  'explicitly-prohibited',
  'not-applicable',
  'unavailable',
] as const satisfies readonly ControlStatus[]

type MissingFromControlStatuses = Exclude<ControlStatus, (typeof CONTROL_STATUSES)[number]>
const _controlStatusesExhaustive: MissingFromControlStatuses extends never ? true : never = true
void _controlStatusesExhaustive

export type PlatformAdminControlId =
  | 'view-platform-access-history'
  | 'see-the-support-session-banner'
  | 'end-a-support-session-from-the-banner'
  | 'see-a-platform-announcement'
  | 'post-or-edit-a-platform-announcement'
  | 'configure-tiers-or-feature-gates'
  | 'manage-pilots-or-tenant-groups'
  | 'initiate-or-approve-a-compliance-emergency-access'
  | 'receive-the-post-session-report'
  | 'prevent-an-access-class-from-being-recorded'

export interface ControlMatrixRow {
  readonly id: PlatformAdminControlId
  readonly control: string
  readonly status: Readonly<Record<TenantRoleId, ControlStatus>>
  readonly detail: Readonly<Record<TenantRoleId, string>>
  readonly rendering: string
  readonly effect: string
  readonly sourceRef: string
}

const PROHIBITED_FOR_ALL_FIVE: Readonly<Record<TenantRoleId, ControlStatus>> = {
  TENANT_ADMIN: 'explicitly-prohibited',
  SUPERVISOR: 'explicitly-prohibited',
  QUALITY_MANAGER: 'explicitly-prohibited',
  READONLY_AUDITOR: 'explicitly-prohibited',
  WORKER: 'explicitly-prohibited',
}

function sameDetailForAllFive(detail: string): Readonly<Record<TenantRoleId, string>> {
  return {
    TENANT_ADMIN: detail,
    SUPERVISOR: detail,
    QUALITY_MANAGER: detail,
    READONLY_AUDITOR: detail,
    WORKER: detail,
  }
}

export const CONTROL_MATRIX = [
  {
    id: 'view-platform-access-history',
    control: 'View Platform Access History',
    status: {
      TENANT_ADMIN: 'read-only',
      SUPERVISOR: 'unavailable',
      QUALITY_MANAGER: 'unavailable',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Read-only.',
      SUPERVISOR: 'Unavailable.',
      QUALITY_MANAGER: 'Unavailable.',
      READONLY_AUDITOR: 'Read-only.',
      WORKER: 'Unavailable — and the Worker holds no Hub screen at all.',
    },
    rendering:
      'The table renders for the two reading roles. For the other three it is ABSENT and the rail does not offer this route — a Supervisor or Quality Manager arriving by deep link meets STATE-05 here while still seeing the banner above, because the banner is Hub chrome and this table is the module.',
    effect: 'A read of this workspace’s own audit records, filtered to platform-side access.',
    sourceRef: 'L29197',
  },
  {
    id: 'see-the-support-session-banner',
    control: 'See the support-session banner',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'allowed',
      WORKER: 'not-applicable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed.',
      SUPERVISOR: 'Allowed.',
      QUALITY_MANAGER: 'Allowed.',
      READONLY_AUDITOR: 'Allowed.',
      WORKER: 'Not applicable — the banner is a Delivery Operations Hub web element.',
    },
    rendering:
      'Hub chrome, above all content, in a distinct colour, and it does not scroll away. It reaches every Hub persona regardless of the rail, which is why two roles this module withholds its table from still see it.',
    effect:
      'A guarantee rather than a courtesy: no banner means no session. The session does not open, or terminates, if the banner cannot be shown.',
    sourceRef: 'L29198',
  },
  {
    id: 'end-a-support-session-from-the-banner',
    control: 'End a support session from the banner',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'allowed-with-conditions',
      WORKER: 'not-applicable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed.',
      SUPERVISOR:
        'Allowed with conditions — any signed-in web user seeing the banner may end it, because the control belongs to the tenant.',
      QUALITY_MANAGER: 'Allowed with conditions — same condition.',
      READONLY_AUDITOR: 'Allowed with conditions — same condition.',
      WORKER: 'Not applicable — no Hub web session.',
    },
    rendering:
      'Live for all four web roles, including the Read-only Auditor, whose read-only posture is about this workspace’s records rather than about a platform session over them. On the normal support session only: the other two classes carry no such control at all, and the banner type has no field for one.',
    effect:
      'Ends the seeded session and records the cause. The widening past the Tenant Admin is deliberate in the source — a session must not continue merely because one person is away.',
    sourceRef: 'L29199',
  },
  {
    id: 'see-a-platform-announcement',
    control: 'See a platform announcement',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'allowed',
      WORKER: 'not-applicable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed.',
      SUPERVISOR: 'Allowed.',
      QUALITY_MANAGER: 'Allowed.',
      READONLY_AUDITOR: 'Allowed.',
      WORKER: 'Not applicable — announcements render in the Hub.',
    },
    rendering:
      'A banner for the announcement’s defined duration, expiring automatically. No dismiss or mute control is drawn for anybody: an in-app banner cannot be muted by any tenant user, so the variant carries no such field.',
    effect: 'A message. It carries no action.',
    sourceRef: 'L29200',
  },
  {
    id: 'post-or-edit-a-platform-announcement',
    control: 'Post or edit a platform announcement',
    status: PROHIBITED_FOR_ALL_FIVE,
    detail: sameDetailForAllFive(
      'Explicitly prohibited — the client’s platform team only.',
    ),
    rendering:
      'ABSENT. A categorical rule: no tenant role posts or edits one, on any surface, so no composer, editor or scheduler is drawn and no disabled one either.',
    effect: 'Nothing here. The client’s platform team acts on another surface entirely.',
    sourceRef: 'L29201',
  },
  {
    id: 'configure-tiers-or-feature-gates',
    control: 'Configure tiers or feature gates',
    status: PROHIBITED_FOR_ALL_FIVE,
    detail: sameDetailForAllFive('Explicitly prohibited — Super Admin platform console only.'),
    rendering:
      'ABSENT, and named in the scope-gate panel as one of the six things unreachable from the Hub. Nothing is drawn, and no link points at a console this surface cannot reach.',
    effect: 'Nothing here.',
    sourceRef: 'L29202',
  },
  {
    id: 'manage-pilots-or-tenant-groups',
    control: 'Manage pilots or tenant groups',
    status: PROHIBITED_FOR_ALL_FIVE,
    detail: sameDetailForAllFive('Explicitly prohibited — Super Admin platform console only.'),
    rendering: 'ABSENT, and named in the scope-gate panel for the same reason.',
    effect: 'Nothing here.',
    sourceRef: 'L29203',
  },
  {
    id: 'initiate-or-approve-a-compliance-emergency-access',
    control: 'Initiate or approve a compliance-emergency access',
    status: PROHIBITED_FOR_ALL_FIVE,
    detail: sameDetailForAllFive(
      'Explicitly prohibited — dual-authorised by two senior platform staff.',
    ),
    rendering:
      'ABSENT. The authorisation is two named platform people, and nothing a tenant role could press would be part of it, so nothing is drawn that could look like a step in that path.',
    effect: 'Nothing here. The tenant receives the post-session report instead.',
    sourceRef: 'L29204',
  },
  {
    id: 'receive-the-post-session-report',
    control: 'Receive the post-session report for a compliance emergency',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'unavailable',
      QUALITY_MANAGER: 'unavailable',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed — the tenant receives a full report of what was accessed.',
      SUPERVISOR: 'Unavailable.',
      QUALITY_MANAGER: 'Unavailable.',
      READONLY_AUDITOR: 'Read-only.',
      WORKER: 'Unavailable.',
    },
    rendering:
      'The report panel renders for the two reading roles and is ABSENT for the other three. It is generated automatically: no control requests it, and no control suppresses it.',
    effect: 'A read. The report states what was accessed, item by item.',
    sourceRef: 'L29205',
  },
  {
    id: 'prevent-an-access-class-from-being-recorded',
    control: 'Prevent a platform-side access class from being recorded',
    status: PROHIBITED_FOR_ALL_FIVE,
    detail: sameDetailForAllFive(
      'Explicitly prohibited — for every role, and for every PLATFORM role too: mirroring is automatic and suppression is prohibited to all.',
    ),
    rendering:
      'ABSENT, and this row is the load-bearing one for the whole screen: it is what makes the history a guarantee rather than a report. THE BRIEF’S EXCERPT OF THIS MATRIX OMITTED THIS ROW; it is at L29206 in the frozen source and is recorded as a finding rather than quietly restored.',
    effect:
      'Nothing here, by design. An access that cannot be audited does not happen — failing the audit mirror stops the access class rather than proceeding unrecorded.',
    sourceRef: 'L29206',
  },
] as const satisfies readonly ControlMatrixRow[]

type MissingFromMatrix = Exclude<PlatformAdminControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function rolesWithStatus(
  controlId: PlatformAdminControlId,
  statuses: readonly ControlStatus[],
): readonly TenantRoleId[] {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) return []
  return TENANT_ROLE_ORDER.filter((roleId) => statuses.includes(row.status[roleId]))
}

export function statusFor(
  controlId: PlatformAdminControlId,
  roleId: TenantRoleId,
): ControlStatus {
  const row = CONTROL_MATRIX.find((r) => r.id === controlId)
  if (row === undefined) throw new Error(`Unknown MOD-DOH-13 control: ${controlId}`)
  return row.status[roleId]
}

export const ACTING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
] as const satisfies readonly ControlStatus[]

export const READING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
] as const satisfies readonly ControlStatus[]

/* ------------------------------------------------------------------ *
 * The tenant state gate for the module's ONE command.
 * ------------------------------------------------------------------ */

/**
 * THE WRITE CLASS END-SESSION IS GATED ON — DEFINED ONCE, IN THE SHELL, AND
 * RE-EXPORTED HERE.
 *
 * The write-class enumerations name no End-session class at all. The act's one
 * required write is its AUDIT ENTRY — "session termination by the tenant is
 * itself an audited act" — and `write-audit` is a class the one table already
 * names, so the gate is a lookup in that table rather than a new row in it.
 *
 * It lives in `app/hub/HubShell.tsx` rather than here because the banner is
 * chrome on EVERY Hub route and the gate is one: the shell computes the refusal
 * and hands it to the banner region, so the control is gated on all nine routes
 * and not only on the one that owns the session. A second copy of the mapping
 * here would be a second thing to drift, so this is a re-export and nothing
 * more. This module composes its own further conditions — a lost connection, a
 * session already ended — on top of the shell's answer.
 *
 * The consequence is right in both directions. Under soft and hard suspension
 * the audit write stays open, so a workspace behind on its bills can still end
 * a platform session — which is what "at any time" requires. Under compliance
 * suspension and after archival it closes, and there it is not a restriction at
 * all: no user is signed in to press it.
 */
export { END_SESSION_WRITE_CLASS } from '../HubShell'

/* ------------------------------------------------------------------ *
 * Screen states. STATE-01 is real and common here: many workspaces have
 * never been touched by the platform side at all.
 * ------------------------------------------------------------------ */

export const APPLICABLE_SCREEN_STATES = [
  'STATE-01',
  'STATE-02',
  'STATE-03',
  'STATE-05',
  'STATE-06',
  'STATE-08',
  'STATE-12',
  'STATE-13',
] as const satisfies readonly ScreenStateId[]

export type ApplicableScreenStateId = (typeof APPLICABLE_SCREEN_STATES)[number]

export interface InapplicableScreenState {
  readonly id: ScreenStateId
  readonly why: string
}

export const INAPPLICABLE_SCREEN_STATES = [
  {
    id: 'STATE-04',
    why: 'Never. The one command here takes no input at all — the banner offers a control, not a form — so there is no value that can be invalid.',
  },
  {
    id: 'STATE-07',
    why: 'Never. Banners are Hub web elements and this surface has no offline mode; connection loss splits three ways instead, and the End-session control disables rather than queues.',
  },
  {
    id: 'STATE-09',
    why: 'Never. Nothing here is device-facing and no command travels to a device, so nothing is ever queued. The End-session write disables under connection loss instead — a queued termination would be a control the tenant believed it had pressed.',
  },
  {
    id: 'STATE-10',
    why: 'Never in this slice. No agent opens, ends or records a platform access session, and the module is fully functional with every agent paused.',
  },
  {
    id: 'STATE-11',
    why: 'Never in this slice, for the same reason: no artificial-intelligence component participates in platform access.',
  },
] as const satisfies readonly InapplicableScreenState[]

/* ------------------------------------------------------------------ *
 * The scope gate: six things unreachable from the Hub (AC-DOH-13-7).
 * "The Hub shows the tenant its own position, read-only — nothing more."
 * ------------------------------------------------------------------ */

export const UNREACHABLE_FROM_THE_HUB = [
  'Tier configuration',
  'Feature gates',
  'Pilot management',
  'Tenant-group management',
  'Impersonation control',
  'Usage and billing administration',
] as const satisfies readonly string[]

/* ------------------------------------------------------------------ *
 * Absent by rule. Nothing is drawn where any of these would sit.
 * ------------------------------------------------------------------ */

export interface AbsentByRule {
  readonly label: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'Grant the engineer write access',
    note: 'The control does not exist, because write capability belongs only to the dual-authorised compliance-emergency path. Support access is read-only without exception at V1 — a data repair is not support — and nothing on this banner could widen it.',
  },
  {
    label: 'Hide the banner',
    note: 'The control does not exist, because visibility is the tenant’s guarantee. No banner means no session: the session does not open, or terminates, if the banner cannot be shown. A dismiss control would turn the guarantee into a preference.',
  },
  {
    label: 'End the compliance-emergency access, or the JBS grant',
    note: 'No End-session control exists on either class, and the banner type carries no field for one on those two arms — so it is absent by construction rather than omitted or disabled. An emergency access the tenant could terminate would not be an emergency access. The compliance class carries the automatic post-session report instead.',
  },
  {
    label: 'Suppress or decline the post-session report',
    note: 'No control exists. The report is generated automatically after a compliance-emergency session and states what was accessed; a control to stop it would remove the only thing the tenant gets in exchange for a class it cannot end.',
  },
  {
    label: 'Mute or dismiss a platform announcement',
    note: 'An in-app banner cannot be muted by any tenant user, so the announcement variant carries no dismiss field at all. It expires on its own defined duration and not before.',
  },
  {
    label: 'Post, edit or schedule an announcement',
    note: 'Explicitly prohibited for all five tenant roles — the client’s platform team only. No composer is drawn, and no disabled one either.',
  },
  {
    label: 'Initiate or approve a compliance-emergency access',
    note: 'Explicitly prohibited for all five. The authorisation is two named senior platform people; nothing a tenant role could press is part of that path, so nothing is drawn that could look like a step in it.',
  },
  {
    label: 'Prevent an access class from being recorded',
    note: 'Explicitly prohibited for every tenant role AND every platform role. Mirroring is automatic, and an access that cannot be audited does not happen — the mirror failing stops the access rather than letting it proceed unrecorded. This is the row that makes the history a guarantee rather than a report.',
  },
  {
    label: 'Deferred scoping',
    note: `This module has no scoping dimension at all: a platform-side access is against the WORKSPACE, and Platform Access History is that workspace's own filtered audit projection rather than anything cut by Site, Area or anything beneath them. So Cell, Job and worker scoping (${DEFERRED_DOH_SCOPES.join(', ')}) renders ABSENT here in the strongest sense — there is no filter, picker or column it could sit in, and no rule on this screen could depend on it. Stated rather than omitted, because this is the one Hub route where a reader might otherwise wonder whether the omission was an oversight.`,
  },
  {
    label: 'Everything the scope gate puts outside the Hub',
    note: `Tier configuration, feature gates, pilot management, tenant-group management, impersonation control and usage administration. Six things, none reachable from this surface, none linked to from here. The Hub shows the tenant its own position, read-only — nothing more.`,
  },
] as const satisfies readonly AbsentByRule[]

/* ------------------------------------------------------------------ *
 * Decisions rendered on screen.
 * ------------------------------------------------------------------ */

export interface RenderedDecision {
  readonly ref: string
  readonly statement: string
}

export const DECISIONS_ON_SCREEN = [
  {
    ref: 'D1',
    statement:
      'Screen catalogue B is canonical. The SCR-DOH-NN number in the header is an annotation on this module and never a route key — and this is the module where the two catalogues collide most dangerously, because the three-digit form of a similar-looking identifier names Platform Access History in one catalogue and the tenant administration area in the other. The three-digit form appears nowhere in this codebase.',
  },
  {
    ref: 'D5',
    statement:
      'This module’s own card wins over the workflow catalogue. The card’s scope gate says the Hub shows the tenant its own position, read-only — nothing more — and a read-only module cannot own device enrolment. The workflow catalogue nonetheless attributes device enrolment, reassignment and the lost-device report to this module; those rows are recorded below as attributed but disputed, rather than either obeyed or deleted.',
  },
  {
    ref: 'D7',
    statement:
      'Connection loss splits three ways. The banner renders from the last loaded state with a freshness marker, the End-session control DISABLES rather than queues — a queued termination is a control the tenant believes it has pressed — and the session’s own time box remains the bound throughout. Reconnection refetches the banner state, so a session ended during the outage no longer shows as open.',
  },
  {
    ref: 'D12',
    statement:
      'Any signed-in tenant web user may press End session: Tenant Admin allowed, the other three allowed with conditions, because the control belongs to the tenant. The competing row that grants the platform-side Support role the tenant’s own control is excluded — it contradicts the premise of the control.',
  },
  {
    ref: 'D13',
    statement:
      'The banner appears on all three access classes, and End-session on the normal support session only. An emergency access the tenant could terminate would not be an emergency access; the compliance-emergency class carries the automatic post-session report instead, and the control to suppress that report does not exist.',
  },
  {
    ref: 'D14',
    statement:
      'Platform Access History is a read-through view over a seeded audit fixture, with the slice-10 dependency declared. The audit store is one truth per tenant and belongs to another module; building a second store here to make this slice self-contained would be the defect, and it would stay invisible until the two had to be reconciled.',
  },
  {
    ref: 'D18',
    statement:
      'The support banner says "workspace", not "tenant" — the form carried by the hard gate, which the no-rewording rule forbids paraphrasing.',
  },
] as const satisfies readonly RenderedDecision[]

/* ------------------------------------------------------------------ *
 * What the source does not define, and what it answers twice.
 * ------------------------------------------------------------------ */

export const UNSPECIFIED_IN_SOURCE = [
  'No retention period is stated for Platform Access History, and no paging, page size or maximum row count is defined for it.',
  'No control is defined for a tenant to request a platform access, to pre-authorise one, or to refuse one in advance.',
  'No behaviour is defined for a tenant that ends a session while an engineer is mid-read: whether the read completes or is cut, and what the audit row says about it.',
  'No wording is defined for the tenant-facing name of a JBS delivery partner, and no rule states whether the partner organisation or the individual is named in the history.',
  'No notification is defined for a JBS access grant opening, though the compliance-emergency class and the support session both have one.',
  'No permission row exists anywhere in this module’s matrix for the export control the storyboard puts on the history table, so no role holds it here — see the unresolved panel for the row that exists in another module’s matrix.',
  'No definition is given for what a second, concurrent access of the same class should render — one banner, two, or a combined one.',
] as const

export const UNRESOLVED_IN_SOURCE = [
  'The rendering rule for a refusal is UNSETTLED in the frozen source, and this build does not settle it. Chapter 30 and the role chapters state opposite rules, both carrying acceptance criteria, and two named tests assert opposite renderings of the same control for the same role. This screen follows its brief — categorical prohibitions and not-applicable rows render ABSENT, and the one control the source itself marks disabled renders disabled with the source’s own reason — states here that the reading is unsettled, and expects a slice-wide gate to decide it.',
  '"Explicitly prohibited" carries no rendering anywhere in the frozen source. It is a statement about authority, so no cell of the matrix above told this build how to draw anything; the mapping from token to rendering is a build decision, recorded as one.',
  '"Unavailable" is overloaded in the source and the two senses are kept apart here. Role-level withholding of a whole module — the Supervisor, Quality Manager and Worker columns on the history and report rows — renders nothing and decides the rail. Transient unavailability of an action a role does hold renders disabled with a reason, and the End-session control under connection loss is exactly that second kind.',
  'The brief that commissioned this screen quoted this module’s matrix as NINE rows. The frozen source carries TEN: the tenth, at L29206, prohibits every role from preventing an access class being recorded. It is the row that makes the whole screen a guarantee rather than a report. Recorded as a finding; the missing row adds no new Unavailable cell, so the module rail is unaffected.',
  'A second matrix elsewhere in the source restates the Platform Access History row differently — Allowed for the Tenant Admin, Explicitly prohibited for the Supervisor and the Worker, Read-only for the Quality Manager — and restates End-session as Tenant Admin only. Both readings are the source’s. This module’s own card governs, and the restatements are recorded as drafting drift rather than reconciled in silence.',
  'A storyboard panel elsewhere states that the support-session banner "is shown to Tenant Admins only", which contradicts this module’s own matrix, its acceptance criterion that the banner is visible to every signed-in tenant web user, and its own happy path in which a Supervisor ends the session. The matrix governs; the panel line is recorded here.',
  'The write-class enumerations name no End-session class at all. This screen gates it on the audit write the source DOES require of it — session termination is itself an audited act — rather than adding a row to the one write-class table. The mapping is stated where the control renders.',
  'The storyboard puts an export control on the history table and this module’s matrix carries no row for it. A different module’s matrix does carry an audit-log export row with per-role statuses, but that is another module’s authority over another object. The control renders disabled with that stated, rather than borrowing a status across a module boundary.',
  'The workflow catalogue attributes device enrolment, device reassignment and the lost-device report to this module, on a surface whose own scope gate says it shows the tenant its own position read-only and nothing more. The card governs; the catalogue rows are attributed but disputed, and the device screen this slice builds is uncatalogued and claims no module.',
] as const

/* ------------------------------------------------------------------ *
 * The workflow-catalogue rows this module is attributed but disputes.
 * ------------------------------------------------------------------ */

export interface DisputedAttribution {
  readonly workflow: string
  readonly what: string
  readonly sourceRef: string
}

export const DISPUTED_ATTRIBUTIONS = [
  {
    workflow: 'WF-DVC-001',
    what: 'Enrolling a device into the tenant’s fleet.',
    sourceRef: 'L53085',
  },
  {
    workflow: 'WF-DVC-002',
    what: 'Reassigning a device to another Area or worker group.',
    sourceRef: 'L53118',
  },
  {
    workflow: 'WF-DVC-003',
    what: 'Handling a lost device — the tenant-side report half.',
    sourceRef: 'L53152',
  },
] as const satisfies readonly DisputedAttribution[]

/* ------------------------------------------------------------------ *
 * Copy the source fixes. Quoted, never reworded.
 * ------------------------------------------------------------------ */

/** D18: "workspace", never "tenant". The banner text is fixed in the source. */
export const BANNER_TEXT_FORM =
  'Platform support is viewing your workspace. Started [time]. Engineer [name]. End session.'

/** L64699, verbatim: the one banner control the source marks DISABLED rather
 *  than absent, with the reason it carries. */
export const EXTEND_TIME_BOX_REASON =
  'The time box is set on the platform side and cannot be extended from here'

export const AUDIT_FAILURE_COPY =
  'The action did not happen. The audit write failed, and because audit is in the same transaction as the action, the transaction rolled back with it: the session is still open, still bannered, and still read-only. Nothing was written. An access that cannot be audited does not happen — which is the same rule seen from the other side.'

export const END_SESSION_SIMULATION_COPY =
  'Ended in this storyboard run, and recorded with its cause. No platform session was terminated: this storyboard reaches no platform and never will. In the built platform the termination and its audit entry commit together, and the end is recorded with its cause — ended by tenant, by engineer, or by time box.'
