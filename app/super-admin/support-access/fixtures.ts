import type { RoleId } from '@/domain/roles'

/**
 * MOD-SA-15 Support Access — the seeded fixtures this module's screen steps
 * through. No backend and no clock: every "as of" value below is a fixture
 * string, never a computed time (spec §8, and the no-ambient-Date rule).
 *
 * The binding constraint on this file is that a normal support session is
 * READ-ONLY WITHOUT EXCEPTION (`AC-SA-15-01`, L45832) and that "a data
 * repair is not support" (L16022). Nothing here describes, names or seeds a
 * write capability inside a session for any account, including the root.
 *
 * Two closed lists the source promises and never enumerates — the support
 * session's reason classes and the emergency classes — are recorded in
 * `SUPPORT_UNSPECIFIED_IN_SOURCE` rather than filled in. The single
 * selectable option in each selector names its own absence; inventing a
 * plausible class name would ship a fiction that reads back as a
 * requirement.
 */

/* ------------------------------------------------------------------ *
 * The four platform roles. `ROLE-PLAT-*` is the plan's annotation for the
 * same four accounts `@/domain/roles` already carries; both are rendered so
 * a reviewer can match one to the other. The selector is a VIEW SWITCHER,
 * not a login (spec §8).
 * ------------------------------------------------------------------ */

export interface SupportPlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
}

export const SUPPORT_PLATFORM_ROLES = [
  { id: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin', roleAnnotation: 'ROLE-PLAT-ROOT' },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN' },
  { id: 'PLATFORM_ENGINEER', name: 'Platform Engineer', roleAnnotation: 'ROLE-PLAT-ENG' },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP' },
] as const satisfies readonly SupportPlatformRole[]

/* ------------------------------------------------------------------ *
 * Closed vocabularies. `as const satisfies` keeps each member literal-
 * narrowed, so the exhaustiveness checks below are real rather than vacuous
 * (a plain `: readonly T[]` annotation would widen the const).
 * ------------------------------------------------------------------ */

/**
 * `OBJ-SA-SESSION` (L45772) — the SURF-SA-owned object, and the vocabulary
 * this module renders. Four other cuts exist in the source and are recorded
 * in `SUPPORT_SOURCE_CONFLICTS` rather than merged into this one.
 */
export type SessionState =
  | 'requested'
  | 'open'
  | 'active'
  | 'ended by tenant'
  | 'expired'
  | 'closed by operator'
  | 'mirrored'
  | 'reported'

export const SESSION_STATES = [
  'requested',
  'open',
  'active',
  'ended by tenant',
  'expired',
  'closed by operator',
  'mirrored',
  'reported',
] as const satisfies readonly SessionState[]

type MissingFromSessionStates = Exclude<SessionState, (typeof SESSION_STATES)[number]>
const _sessionStatesExhaustive: MissingFromSessionStates extends never ? true : never = true
void _sessionStatesExhaustive

/** `OBJ-SA-EMERGENCYSESSION` (L45772). */
export type EmergencySessionState =
  | 'requested'
  | 'open'
  | 'active'
  | 'expired'
  | 'closed'
  | 'mirrored'
  | 'reported'

export const EMERGENCY_SESSION_STATES = [
  'requested',
  'open',
  'active',
  'expired',
  'closed',
  'mirrored',
  'reported',
] as const satisfies readonly EmergencySessionState[]

type MissingFromEmergencyStates = Exclude<
  EmergencySessionState,
  (typeof EMERGENCY_SESSION_STATES)[number]
>
const _emergencyStatesExhaustive: MissingFromEmergencyStates extends never ? true : never = true
void _emergencyStatesExhaustive

/**
 * "No banner means no session." L14887 suspends the session on a missed
 * banner heartbeat and serves no further reads until the banner is
 * confirmed visible; `AC-4870` (L107883) puts the banner and the committed
 * session-open event BEFORE the first read. The banner state is therefore a
 * first-class field on the session detail, not a footnote.
 */
export type BannerState =
  | 'confirmed visible to the tenant'
  | 'not yet confirmed — no read served'
  | 'heartbeat missed — session suspended'

export const BANNER_STATES = [
  'confirmed visible to the tenant',
  'not yet confirmed — no read served',
  'heartbeat missed — session suspended',
] as const satisfies readonly BannerState[]

type MissingFromBannerStates = Exclude<BannerState, (typeof BANNER_STATES)[number]>
const _bannerStatesExhaustive: MissingFromBannerStates extends never ? true : never = true
void _bannerStatesExhaustive

/* ------------------------------------------------------------------ *
 * The two closed lists the source names and never enumerates.
 * ------------------------------------------------------------------ */

/** The sentinel value for "a reason class was selected"; it names no class. */
export const UNSPECIFIED_REASON_CLASS_VALUE = 'reason-class-unspecified-in-source'

export const UNSPECIFIED_REASON_CLASS_LABEL =
  'A reason class the source never enumerates (L103270 calls the list closed and never writes it out)'

/** The sentinel value for "an emergency class was selected"; it names no class. */
export const UNSPECIFIED_EMERGENCY_CLASS_VALUE = 'emergency-class-unspecified-in-source'

export const UNSPECIFIED_EMERGENCY_CLASS_LABEL =
  'An emergency class the source never enumerates (L104252 requires a named class and never names one)'

/** D19: required and unset. Not hard-coded to the one-hour suggestion. */
export const EMERGENCY_TIME_BOX = 'Not yet set — DEC-SEC-017'

/** L103270: two hours, configurable in Platform Settings — not on this screen. */
export const SUPPORT_TIME_BOX =
  'Two hours (the default). The value is set in Platform Settings, not here.'

/* ------------------------------------------------------------------ *
 * The session list — "who, tenant, reason, scope, expiry and action count"
 * (L54979, L55009). The action count is a count of the PLATFORM
 * operator's own reads inside one session, which is what makes a session
 * reconcilable against the tenant's own stream (L14880). It is not a
 * measure of anybody inside the tenant, and there is no series, no rate and
 * no comparison between operators anywhere in this file.
 * ------------------------------------------------------------------ */

export interface SupportSessionRow {
  readonly id: string
  readonly operator: string
  readonly operatorRole: string
  readonly tenantLabel: string
  readonly ticketRef: string
  readonly reasonClassLabel: string
  readonly scopeLabel: string
  readonly expiryLabel: string
  readonly actionCountLabel: string
  readonly state: SessionState
  readonly bannerState: BannerState
}

const REASON_CLASS_RECORDED = 'Recorded against the ticket; class name unspecified in source'

export const SUPPORT_SESSIONS = [
  {
    id: 'SES-4471',
    operator: 'Support operator on ticket TKT-4471',
    operatorRole: 'Support',
    tenantLabel: 'Bright Bikes',
    ticketRef: 'TKT-4471',
    reasonClassLabel: REASON_CLASS_RECORDED,
    scopeLabel: 'One tenant workspace, read-only',
    expiryLabel: 'Time box two hours from open',
    actionCountLabel: '11 reads recorded',
    state: 'ended by tenant',
    bannerState: 'confirmed visible to the tenant',
  },
  {
    id: 'SES-4488',
    operator: 'Support operator on ticket TKT-4488',
    operatorRole: 'Support',
    tenantLabel: 'Northfield Assembly',
    ticketRef: 'TKT-4488',
    reasonClassLabel: REASON_CLASS_RECORDED,
    scopeLabel: 'One tenant workspace, read-only',
    expiryLabel: 'Time box two hours from open',
    actionCountLabel: '4 reads recorded',
    state: 'active',
    bannerState: 'confirmed visible to the tenant',
  },
  {
    id: 'SES-4502',
    operator: 'Admin on ticket TKT-4502',
    operatorRole: 'Admin',
    tenantLabel: 'Harbour Tooling',
    ticketRef: 'TKT-4502',
    reasonClassLabel: REASON_CLASS_RECORDED,
    scopeLabel: 'One tenant workspace, read-only',
    expiryLabel: 'Expired at its time box; overrun recorded',
    actionCountLabel: '7 reads recorded',
    state: 'expired',
    bannerState: 'heartbeat missed — session suspended',
  },
] as const satisfies readonly SupportSessionRow[]

/** The session the detail panel renders. */
export const SESSION_DETAIL: SupportSessionRow = SUPPORT_SESSIONS[1]

/** Every tenant this console knows by name. A name here opens nothing. */
export interface TenantOption {
  readonly value: string
  readonly label: string
}

export const TENANT_OPTIONS = [
  { value: 'TEN-BRIGHT', label: 'Bright Bikes' },
  { value: 'TEN-NORTH', label: 'Northfield Assembly' },
  { value: 'TEN-HARBOUR', label: 'Harbour Tooling' },
] as const satisfies readonly TenantOption[]

export const SESSION_LIST_AS_OF = 'as of 09:41, 16 August 2026 (fixture)'
export const SESSION_LIST_STALE_AS_OF = 'as of 08:12, 16 August 2026 (fixture) — 89 minutes old'
export const SESSION_LIST_ORIGIN = 'seeded fixture, this storyboard'

/* ------------------------------------------------------------------ *
 * ABSENT controls — spec §3. Each exists for NO account, including the
 * root. A one-line note sits where a control would be; none is a disabled
 * control, because a disabled control implies an enabled state exists
 * somewhere.
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
}

export const SUPPORT_ABSENT_CONTROLS = [
  {
    label: 'Grant the engineer write access',
    note: 'This control does not exist, on this console or on the tenant banner, for any account including the root (L64699). No write capability of any kind exists inside a normal support session (AC-SA-15-01, L45832): a data repair is not support (L16022), and a change to tenant data is reachable only through the compliance-emergency path.',
  },
  {
    label: 'Extend the time box of an open session',
    note: 'No in-place extension exists (AC-WF-ROLE-024-01, L56107; D18, DEC-SUPEXT-001). A longer investigation opens a new session with a fresh reason and a fresh time box, so every session carries its own justification. An overrun beyond the box is recorded for investigation rather than absorbed.',
  },
  {
    label: 'Export anything from inside a session',
    note: 'No export exists from inside a session (D18, DEC-SUPEXP-001). An export removes tenant operational content into a system the tenant cannot see, which breaks the mirroring guarantee that makes the read accountable. Findings leave a session as prose on the ticket.',
  },
  {
    label: 'Hide or suppress the tenant banner',
    note: 'This control does not exist (L64699). Visibility is the tenant’s guarantee, not a platform preference: no tenant record is read while the tenant cannot see that it is being read (L14887).',
  },
  {
    label: 'Suppress the tenant post-session report',
    note: 'This control does not exist (L64828). The report is generated automatically at closure of a compliance-emergency session, states what was accessed, and is retained even if its delivery fails.',
  },
  {
    label: 'End a compliance-emergency session from the tenant banner',
    note: 'No tenant-side End-session control is offered for the emergency class, because an emergency access the tenant could terminate would not be an emergency access (L64828). The emergency session ends at its box or on closure, and the tenant learns of it through the automatic post-session report.',
  },
] as const satisfies readonly AbsentControl[]

/* ------------------------------------------------------------------ *
 * Unspecified in source. Named, never invented (D15).
 * ------------------------------------------------------------------ */

export interface UnspecifiedAffordance {
  readonly affordance: string
  readonly note: string
}

export const SUPPORT_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'The closed list of ticket-linked reason class values',
    note: 'L103270 and AC-SA-15-02 make a reason class from a closed list mandatory before a session can open, and the list itself is never written out anywhere in the frozen source. The selector therefore carries one option that names its own absence. Filling it with plausible values — "investigation", "billing query", "defect triage" — would ship an invented vocabulary that reads back as a requirement.',
  },
  {
    affordance: 'The named emergency class values',
    note: 'L104252 and AC-SA-15-07 require a named emergency class before the compliance-emergency Open control activates, and no enumeration exists. Same treatment as the reason class, for the same reason.',
  },
  {
    affordance: 'The permitted values and shape of the declared scope',
    note: 'AC-SA-15-08 fixes that the scope is declared before the session opens and can never be widened during it, but the source states no vocabulary, granularity or validation rule for what a scope may say. The field accepts free text and states the constraint rather than enforcing an invented grammar.',
  },
  {
    affordance: 'The ticket reference format',
    note: 'A ticket reference is mandatory (L103270) and no format, checksum or external system is named. The field is required and unvalidated beyond being non-empty.',
  },
  {
    affordance: 'Any filter, sort or search on the session list',
    note: 'The source names the columns the list carries (L54979, L58038) and no control over them. None is drawn. A filter that could hide an access class would be the beginning of the "no filter or export can omit a class" problem that AC-4873 forbids on the audit side.',
  },
  {
    affordance: 'The reconciliation control for action counts across the two streams',
    note: 'FB-SUP-001 (L16125) and FB-BOUNDARY-001 (L14880) both say the action counts in the platform stream and the tenant stream are compared and any discrepancy raised as a finding. Neither names who compares them, on what screen, or with what control. No control is drawn.',
  },
  {
    affordance: 'FUNC-SA-REVOKE-MIDFLOW',
    note: 'L54998 lists this among this module’s key functions and the source never defines what it revokes, who holds it, or what it looks like. Named here rather than guessed at.',
  },
] as const satisfies readonly UnspecifiedAffordance[]

/* ------------------------------------------------------------------ *
 * Conflicts in the source, each resolved in the open.
 * ------------------------------------------------------------------ */

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const SUPPORT_SOURCE_CONFLICTS = [
  {
    topic: 'The Platform Engineer and tenant context (D17)',
    conflict:
      'L20740 states the Platform Engineer may not enter tenant context under any access class and may not open a support session. L65401 lists "Open a read-only support session (Allowed with conditions)" among the same role’s permissions. The two cannot both hold.',
    resolution:
      'The prohibition holds. Band A and Band B separation is the stronger and more restated principle, and the narrower grant is the safer prototype. The control renders ABSENT for the Platform Engineer, with the conflict named where the control would sit.',
  },
  {
    topic: 'Five vocabularies for the support session object',
    conflict:
      'OBJ-SA-SESSION names eight states (L45772); OBJ-SUPPORT-SESSION four (L4651); OBJ-079 four (L9715); the unnumbered object at L55009 five, including "overrun"; and L70757 an eight-token set with "Refused" and "VisibilityDegraded".',
    resolution:
      'OBJ-SA-SESSION (L45772) is rendered: it is the SURF-SA-owned object stated in this module’s own section, and it is the only cut that carries the mirroring and reporting states the mirroring obligation needs. Overrun is rendered as a recorded property of an expired session, which is what L56107 makes it, rather than as a sixth state.',
  },
  {
    topic: 'Extension of the time box',
    conflict:
      'DEC-SUPEXT-001 is open. L64699 describes the tenant-banner extension control as "Disabled — the time box is set on the platform side", which implies a platform-side control exists; L56107 states there is no in-place extension at all.',
    resolution:
      'D18: no extension anywhere. The control is ABSENT platform-side rather than disabled, because a disabled extension control implies an enabled one exists somewhere, and under D18 it never does.',
  },
  {
    topic: 'Export from inside a session',
    conflict:
      'DEC-SUPEXP-001 is open, with three options ranging from no export to unrestricted export. The recommendation is no export.',
    resolution:
      'D18: no export. It is the only reading that keeps the mirroring guarantee intact, because an export moves tenant content somewhere the tenant’s own stream cannot follow it.',
  },
  {
    topic: 'The compliance-emergency time box',
    conflict:
      'The two-hour default belongs to normal support sessions only (L103270). DEC-SEC-017 records that the emergency session’s own default is undecided.',
    resolution:
      'D19: rendered as required-and-unset — "Not yet set — DEC-SEC-017" — not hard-coded to the one-hour suggestion. The Open control cannot activate while a required field has no value, so the prototype shows the gap instead of papering over it.',
  },
] as const satisfies readonly SourceConflict[]

/* ------------------------------------------------------------------ *
 * Workflows. The extraction attaches no `module_id` to any workflow, so
 * each row states how it was matched to MOD-SA-15.
 * ------------------------------------------------------------------ */

export interface SupportWorkflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  readonly matchedBy: string
}

export const SUPPORT_WORKFLOWS = [
  {
    id: 'WF-PLT-001',
    name: 'Opening a normal support session',
    actor: 'Support',
    trigger: 'Support selects the tenant and a ticket-linked reason class',
    terminalStates: [
      'no session; the tenant’s data is untouched and the attempt is logged in both streams',
    ],
    matchedBy:
      'name, and by module row: L54998 lists WF-PLT-001 among MOD-SA-15’s key functions on the same line',
  },
  {
    id: 'WF-PLT-002',
    name: 'Opening the compliance-emergency path',
    actor: 'Root Super Admin and one platform Admin',
    trigger: 'A named emergency class is selected and scope declared',
    terminalStates: [
      'the session is closed, write access is revoked, and the outstanding report obligation is a tracked open item visible in both streams',
    ],
    matchedBy: 'name, and by module row: L54998 lists WF-PLT-002 among MOD-SA-15’s key functions',
  },
  {
    id: 'WF-SA-OPEN-SUPPORT-SESSION',
    name: 'Open a support session',
    actor: 'Support',
    trigger: 'A tenant raises a ticket',
    terminalStates: ['session ends at time box, operator close, or tenant End-session press'],
    matchedBy: 'name and line proximity — L16111, inside the support-session passage',
  },
  {
    id: 'WF-SA-CLOSE-SESSION',
    name: 'Close a support session',
    actor: 'Support',
    trigger: 'Investigation complete',
    terminalStates: ['session-ended event mirrored to both audit streams'],
    matchedBy: 'name and line proximity — L16111, the same passage',
  },
  {
    id: 'WF-SA-ESCALATE-TO-EMERGENCY',
    name: 'Escalate a finding that requires a data change',
    actor: 'Support',
    trigger: 'Investigation concludes tenant data must change',
    terminalStates: [
      'handed to the compliance-emergency path; no support session ever becomes a write session',
    ],
    matchedBy: 'name and line proximity — L16111, the same passage',
  },
  {
    id: 'WF-SA-EMERGENCY-OPEN',
    name: 'Open a compliance-emergency session',
    actor: 'Root Super Admin plus one Admin',
    trigger: 'Tenant data must genuinely change',
    terminalStates: ['session closed with the automatic post-session report to the tenant'],
    matchedBy: 'name and line proximity — L15418, the compliance-emergency passage',
  },
  {
    id: 'WF-SA-EMERGENCY-COAUTH',
    name: 'Co-authorise an emergency session',
    actor: 'Admin',
    trigger: 'The root initiates the compliance-emergency path',
    terminalStates: ['session opens with the declared scope'],
    matchedBy: 'name and line proximity — L15838, the same passage',
  },
  {
    id: 'WF-ROLE-023',
    name: 'The tenant ending a support session from its own banner',
    actor: 'Tenant Admin',
    trigger: 'The Tenant Admin presses End session',
    terminalStates: [
      'the session ends by time box at the latest, and the failed termination is recorded',
    ],
    matchedBy:
      'name and line proximity — L56077, in the run of WF-ROLE-022 to WF-ROLE-026 that covers this module',
  },
  {
    id: 'WF-ROLE-024',
    name: 'A support session expiring at its time box',
    actor: 'The session expiry job',
    trigger: 'The time box elapses',
    terminalStates: [
      'the session ends, and any period beyond the box is recorded as an overrun for investigation',
    ],
    matchedBy: 'name and line proximity — L56099, the same run',
  },
  {
    id: 'WF-ROLE-026',
    name: 'Closing a compliance-emergency session and issuing the tenant report',
    actor: 'The platform',
    trigger: 'The session closes or its box expires',
    terminalStates: [
      'the session is closed and the outstanding report is a tracked, visible obligation in both streams',
    ],
    matchedBy: 'name and line proximity — L56144, the same run',
  },
] as const satisfies readonly SupportWorkflow[]
