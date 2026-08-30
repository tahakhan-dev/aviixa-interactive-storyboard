import type { WriteAction } from '@/surfaces/doh/tenant-state'
import type { ScreenStateId } from '@/ui/screen-state'
import type { SsoConnectionState, SsoProtocol } from '@/surfaces/doh/sso-connection'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import type { AccessContext } from '@/policy/evaluate'
import type { TenantRoleId } from '../HubShell'
import {
  rolesReachingByMatrix as rolesReachingByRule,
  titleCaseCellStatus,
  type MatrixRowSurface,
  type MatrixStatus,
} from '@/surfaces/doh/modules'

/**
 * MOD-DOH-12 — Integration Surface (tenant side), narrowed to FEAT-DOH-1201
 * single sign-on. Seeded fixture data for the integration settings screen.
 *
 * THE CONNECTION RECORD ITSELF IS NOT HERE. It lives in
 * `@/surfaces/doh/sso-connection`, where the two-track sign-in screen also
 * reads it, so two screens cannot describe one fixture differently. This
 * file holds what is MOD-DOH-12's screen and nothing that belongs to the
 * record: the module card's own permission matrix, the renderings that
 * matrix produces, and the panels that name what the source does not define.
 *
 * Determinism (spec §2): no `Date.now()`, `new Date()` or `Math.random()`
 * anywhere below. Every as-of stamp is a fixed string carried on the record.
 *
 * Support-not-surveillance: this module holds no operational object at all —
 * the card says so outright — so nothing here counts, times, ranks or
 * compares a person, and no key below names a person in any form.
 */

/* ------------------------------------------------------------------ *
 * The module card's permission matrix, nine rows, verified at
 * L29041-L29050. L10238: "Every cell in every permission matrix carries an
 * explicit status" — so every cell below carries one, and the screen renders
 * all five columns.
 *
 * TWO OF THE NINE ROWS DRAW A CONTROL on this screen and the other
 * SEVEN draw none — six because nobody holds them at all, and one, the
 * tier and usage read view, because this slice renders it on another
 * module's screen. All seven stay in the table because a matrix with
 * its inconvenient rows removed is a matrix a reader cannot check, and
 * because that one row is the ONLY row carrying `Unavailable`, and
 * therefore the only row that decides which roles the module rail
 * offers this route to at all. The unit suite partitions all nine and
 * asserts the counts, so this comment cannot drift from them again.
 * ------------------------------------------------------------------ */

/**
 * The Title-Case status vocabulary, and the row's surface, both re-exported
 * from their ONE owner in `@/surfaces/doh/modules`. This module and
 * `MOD-DOH-01` shipped identical copies of this union; the copies are gone
 * and the spelling is unchanged, because this screen prints these words.
 */
export type { MatrixStatus, MatrixRowSurface }

export type ControlId =
  | 'configure-single-sign-on-metadata'
  | 'provide-tenant-contact-email'
  | 'manage-email-vendor-credentials'
  | 'supply-ai-api-key'
  | 'configure-outbound-webhook'
  | 'configure-directory-provisioning'
  | 'call-inbound-business-system-endpoint'
  | 'view-tier-and-usage-read-view'
  | 'change-tier-cap-or-threshold'

export interface MatrixCell {
  readonly status: MatrixStatus
  /** Never blank: a blank cell is an unanswered question (L10238). */
  readonly detail: string
}

export interface ControlMatrixRow {
  readonly id: ControlId
  readonly control: string
  /** Where this row's capability is met — read by the shared derivation in
   *  `@/surfaces/doh/modules`. The tier read view is a Hub SCREEN row even
   *  though this slice builds it on `SCR-DOH-03`; the inbound endpoint is
   *  not a screen control at all. */
  readonly surface: MatrixRowSurface
  readonly byRole: Readonly<Record<TenantRoleId, MatrixCell>>
  /** How this row renders on SCR-DOH-21, by the three-rendering rule. */
  readonly rendering: string
  readonly effect: string
  readonly sourceRef: string
}

const PROHIBITED_FOR_THE_OTHER_FOUR = {
  SUPERVISOR: {
    status: 'Explicitly prohibited',
    detail: 'Runs an Area. The tenant’s outside connections are not the Supervisor’s.',
  },
  QUALITY_MANAGER: {
    status: 'Explicitly prohibited',
    detail: 'Owns quality authority, not the tenant’s configuration of its own connections.',
  },
  READONLY_AUDITOR: {
    status: 'Explicitly prohibited',
    detail: 'Reads tenant-wide records and takes no action at all.',
  },
  WORKER: { status: 'Explicitly prohibited', detail: 'Holds no Hub screen at all (D11).' },
} as const satisfies Readonly<Record<Exclude<TenantRoleId, 'TENANT_ADMIN'>, MatrixCell>>

function sameForAllFive(status: MatrixStatus, detail: string): Readonly<Record<TenantRoleId, MatrixCell>> {
  return {
    TENANT_ADMIN: { status, detail },
    SUPERVISOR: { status, detail },
    QUALITY_MANAGER: { status, detail },
    READONLY_AUDITOR: { status, detail },
    WORKER: { status, detail },
  }
}

export const CONTROL_MATRIX = [
  {
    id: 'configure-single-sign-on-metadata',
    control: 'Configure single sign-on metadata',
    surface: 'screen',
    byRole: {
      TENANT_ADMIN: {
        status: 'Allowed',
        detail: 'The one role that configures the tenant’s own connection record.',
      },
      ...PROHIBITED_FOR_THE_OTHER_FOUR,
    },
    rendering:
      'A live control for the Tenant Admin, gated by the write-class table first. DISABLED with its reason for the Read-only Auditor, who opens this screen and meets a refusal it can read.',
    effect:
      'Writes the protocol onto the connection record and sets its state to configured. It contacts no identity provider, because there is none.',
    sourceRef: 'L29042',
  },
  {
    id: 'provide-tenant-contact-email',
    control: 'Provide the tenant contact email',
    surface: 'screen',
    byRole: {
      TENANT_ADMIN: {
        status: 'Allowed',
        detail: 'The one address AVIIXA email may be directed to outside the tenant’s user records.',
      },
      ...PROHIBITED_FOR_THE_OTHER_FOUR,
    },
    rendering: 'A live control for the Tenant Admin. DISABLED with its reason for the Read-only Auditor.',
    effect:
      'Writes the address onto the same configuration record. Delivery is another module’s and another slice’s; nothing is sent from here.',
    sourceRef: 'L29043',
  },
  {
    id: 'manage-email-vendor-credentials',
    control: 'Manage email-vendor credentials',
    surface: 'another-surface',
    byRole: sameForAllFive(
      'Not applicable',
      'The tenant manages no credentials; the vendor is platform-contracted.',
    ),
    rendering:
      'ABSENT for all five, with the reason in help text. Nothing exists to enable, so nothing is drawn — not even disabled.',
    effect:
      'None. The tenant manages no email credentials, which removes a credential-handling risk entirely (L29035).',
    sourceRef: 'L29044',
  },
  {
    id: 'supply-ai-api-key',
    control: 'Supply an artificial-intelligence application programming interface key',
    surface: 'screen',
    byRole: sameForAllFive(
      'Not applicable',
      'Compute is bundled; no tenant key is required.',
    ),
    rendering: 'ABSENT for all five, with the reason in help text. No such field exists on any screen.',
    effect: 'None. Agents run with no tenant account and no tenant key (AC-DOH-12-4).',
    sourceRef: 'L29045',
  },
  {
    id: 'configure-outbound-webhook',
    control: 'Configure an outbound webhook',
    surface: 'screen',
    byRole: sameForAllFive(
      'Explicitly prohibited',
      'Deferred beyond this version, for every tenant role including the Tenant Admin.',
    ),
    rendering:
      'ABSENT for all five. The prohibition is categorical rather than a routing rule — no role holds it on any surface — so a disabled control would imply a roadmap promise the source has not made.',
    effect: 'None. No outbound webhook exists anywhere, which removes an exfiltration path (L29035).',
    sourceRef: 'L29046',
  },
  {
    id: 'configure-directory-provisioning',
    control: 'Configure directory provisioning',
    surface: 'screen',
    byRole: sameForAllFive(
      'Explicitly prohibited',
      'Deferred beyond this version, for every tenant role including the Tenant Admin.',
    ),
    rendering: 'ABSENT for all five, for the same categorical reason as the row above.',
    effect:
      'None. There is no just-in-time provisioning either: an asserted subject with no existing user record is refused sign-in (L95794).',
    sourceRef: 'L29047',
  },
  {
    id: 'call-inbound-business-system-endpoint',
    control: 'Call the inbound business-system integration endpoint',
    surface: 'another-surface',
    byRole: sameForAllFive(
      'Not applicable',
      'The endpoint is stubbed and returns HTTP status 501, creating nothing.',
    ),
    rendering:
      'ABSENT for all five, with the reason in help text. It is not a screen control at all — an outside system calls it — and no enable control is drawn beside it.',
    effect:
      'None here. A call is recorded as a security-and-operations event so an early integration attempt is visible (L29174).',
    sourceRef: 'L29048',
  },
  {
    id: 'view-tier-and-usage-read-view',
    control: 'View the tier and usage read view',
    surface: 'screen',
    byRole: {
      TENANT_ADMIN: { status: 'Read-only', detail: 'Reads the tenant’s own commercial position.' },
      SUPERVISOR: {
        status: 'Unavailable',
        detail: 'Holds it in no scope; the module rail does not offer this route.',
      },
      QUALITY_MANAGER: {
        status: 'Unavailable',
        detail: 'Holds it in no scope; the module rail does not offer this route.',
      },
      READONLY_AUDITOR: { status: 'Read-only', detail: 'Reads the tenant’s own commercial position.' },
      WORKER: { status: 'Unavailable', detail: 'Holds no Hub screen at all (D11).' },
    },
    rendering:
      'ABSENT here. This slice builds the read view on the Tenant Lifecycle and Tier Operations module’s own screen, SCR-DOH-03, and a second copy of it would be a second answer to one question. This is the ONLY row of the nine carrying Unavailable, and it is therefore the row that decides who the module rail offers this route to.',
    effect: 'A read, rendered on another screen. Nothing on this screen changes a tier, a cap or a ceiling.',
    sourceRef: 'L29049',
  },
  {
    id: 'change-tier-cap-or-threshold',
    control: 'Change a tier, a cap or a threshold',
    surface: 'another-surface',
    byRole: sameForAllFive(
      'Explicitly prohibited',
      'The Super Admin platform console only, for every tenant role including the Tenant Admin.',
    ),
    rendering: 'ABSENT for all five. The refusal is asserted for every tenant role (TEST-DOH-12-D2).',
    effect: 'None here.',
    sourceRef: 'L29050',
  },
] as const satisfies readonly ControlMatrixRow[]

type MissingFromMatrix = Exclude<ControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function matrixRow(id: ControlId): ControlMatrixRow {
  const found = CONTROL_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`No control matrix row for ${id}`)
  return found
}

/**
 * The allowed-roles list every `evaluateAccess` call on this screen passes,
 * derived from the matrix ABOVE rather than typed a second time beside the
 * control. A status change in the table moves the affordance with it.
 */
export function rolesWithStatus(
  id: ControlId,
  statuses: readonly MatrixStatus[],
): readonly TenantRoleId[] {
  const row = matrixRow(id)
  return (Object.keys(row.byRole) as readonly TenantRoleId[]).filter((role) =>
    statuses.includes(row.byRole[role].status),
  )
}

/**
 * See `ACTING_STATUSES` in the tenant-lifecycle module for why these are
 * `as const satisfies` and never `: readonly MatrixStatus[]`: the annotation
 * widens the constant so a prohibition token would typecheck as an acting or
 * reading status, and the widening is erased at runtime so no assertion here
 * can see it. `tsc --noEmit` is the guard for the type; the unit cases pin
 * the contents.
 */
export const ACTING_STATUSES = [
  'Allowed',
  'Allowed with conditions',
] as const satisfies readonly MatrixStatus[]

export const READING_STATUSES = [
  'Allowed',
  'Allowed with conditions',
  'Read-only',
] as const satisfies readonly MatrixStatus[]

/**
 * THE ROLES THIS MODULE'S SCREEN OPENS FOR. The rule itself is not written
 * here: it is `rolesReachingByMatrix` in `@/surfaces/doh/modules`, applied
 * to THIS module's rows — a role reaches the route when a `screen` row
 * offers it something and no `screen` row marks it `Unavailable`.
 *
 * This wrapper exists because the screen passes the list to `evaluateAccess`
 * and the rail reads `rolesReaching` on the spine definition. BOTH now run
 * the one rule; what stops that from being a tautology is that each runs it
 * over its own reference to the rows, and `tests/unit/doh-sso.test.ts`
 * compares the two. Re-reading `rolesReaching` here instead would make that
 * comparison compare a value with itself.
 */
export function rolesReachingByMatrix(): readonly TenantRoleId[] {
  return rolesReachingByRule(CONTROL_MATRIX, titleCaseCellStatus)
}

/* ------------------------------------------------------------------ *
 * The write class both of this screen's writes are gated on. Both are
 * configuration edits, which the source names by that exact phrase
 * ("and all configuration edits", L26919), so neither adds a row to the
 * one write-class table.
 * ------------------------------------------------------------------ */

export const CONFIGURATION_EDIT: WriteAction = 'edit-configuration'

/* ------------------------------------------------------------------ *
 * Labels for the two closed vocabularies the connection record carries.
 * The tokens stay the data; these are the interface wording, because no
 * bare identifier is ever the label a reader is given.
 * ------------------------------------------------------------------ */

export const CONNECTION_STATE_LABEL: Readonly<Record<SsoConnectionState, string>> = {
  configured: 'Configured',
  not_configured: 'Not configured',
  reserved_inert: 'Reserved, inert',
}

export const CONNECTION_STATE_MEANING: Readonly<Record<SsoConnectionState, string>> = {
  configured:
    'A connection record exists and the email domains below resolve onto it. In the built platform an address on one of those domains would be handed to the tenant directory; here the branch is the whole of it.',
  not_configured:
    'No connection record is in force. Every address resolves onto the platform-held credential path instead, which is the secondary track for staff whose organisation has no directory to federate with.',
  reserved_inert:
    'The record exists and does nothing. The module card carries this state in its integration-state vocabulary, and the source describes it for the reserved business-system connection point rather than for single sign-on — so what a reserved-inert single sign-on record means is recorded below as unresolved rather than guessed at here.',
}

export const PROTOCOL_LABEL: Readonly<Record<SsoProtocol, string>> = {
  saml: 'SAML',
  'openid-connect': 'OpenID Connect',
}

/**
 * AC-DOH-12-1 (L29131): both protocols work on every tier and neither is
 * tier-gated. Rendered beside the protocol control so the reader meets the
 * rule where it binds rather than in a release note.
 */
export const PROTOCOL_TIER_RULE =
  'Single sign-on is not tier-gated: SAML and OpenID Connect are both supported on every tier, and neither is held back for a larger plan (AC-DOH-12-1). Nothing on this screen changes a tier either — that control is absent for all five tenant roles, and it is listed below with the reason.'

/** The address the test-connection check resolves. Built from the record’s
 *  own first configured domain, so the check reads the fixture rather than a
 *  second constant that could drift from it. */
export const TEST_CONNECTION_LOCAL_PART = 'directory-probe'

/* ------------------------------------------------------------------ *
 * Screen states. STATE-07, 09, 10 and 11 never occur here.
 * ------------------------------------------------------------------ */

export const APPLICABLE_SCREEN_STATES = [
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

export type ApplicableScreenStateId = (typeof APPLICABLE_SCREEN_STATES)[number]

/** D7: the three states a lost connection can leave a Hub screen in. */
export const CONNECTION_LOSS_STATES = [
  'STATE-08',
  'STATE-12',
  'STATE-13',
] as const satisfies readonly ApplicableScreenStateId[]

export interface InapplicableScreenState {
  readonly id: ScreenStateId
  readonly why: string
}

export const INAPPLICABLE_SCREEN_STATES = [
  {
    id: 'STATE-07',
    why: 'Never. Only the Frontline Worker Application has a true offline state; the Hub is a web surface and connection loss splits three ways instead (D7).',
  },
  {
    id: 'STATE-09',
    why: 'Never. Nothing on this screen is device-facing, no command travels, and nothing on this surface ever queues a write.',
  },
  {
    id: 'STATE-10',
    why: 'Never in this slice. No agent creates, edits, archives or proposes anything on this module, and the connection record is not an agent input.',
  },
  {
    id: 'STATE-11',
    why: 'Never in this slice, for the same reason: nothing on this screen depends on a model being reachable.',
  },
] as const satisfies readonly InapplicableScreenState[]

export const MODULE_STATE_NOTE: Readonly<Record<ApplicableScreenStateId, string>> = {
  'STATE-01':
    'a tenant with no connection record in force. The single sign-on card renders its empty shape and names what would create one; the reviewer’s connection-record control below reaches the same state from the product side.',
  'STATE-02': 'the connection record while it is being fetched. No field is shown as blank or as a default in the meantime.',
  'STATE-03': 'the connection record and the two writes it carries.',
  'STATE-04':
    'the tenant contact email only. It is the one field on this screen a reader types into, so it is the one field that can be invalid.',
  'STATE-05':
    'a role the matrix marks Unavailable meeting this route by deep link — the Supervisor and the Quality Manager. The rail never offers it to them.',
  'STATE-06':
    'the whole screen for the Read-only Auditor, whose two write rows the matrix marks Explicitly prohibited. The cause is named once, in the banner above the card.',
  'STATE-08':
    'the last loaded connection record with a freshness marker and an as-of time, after the connection drops. Both writes disable rather than queue.',
  'STATE-12':
    'a read that failed outright, naming what failed and whether anything was written. Both writes disable rather than queue.',
  'STATE-13':
    'reconnection. The tenant state is refetched before either write is re-enabled, so a write is never re-offered against a state that may have changed while the connection was down.',
}

/* ------------------------------------------------------------------ *
 * Absent by rule. Nothing is drawn where any of these would sit — only
 * the note saying why, and the source token that produced the rendering.
 * ------------------------------------------------------------------ */

export interface AbsentByRule {
  readonly label: string
  readonly token: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'Manage email-vendor credentials',
    token: 'Not applicable — reason stated',
    note: 'Not applicable for all five roles: the tenant manages no credentials, because the vendor is platform-contracted. Nothing exists to enable, so nothing is drawn. The card states the upside plainly — a tenant that manages no email credentials removes a credential-handling risk entirely.',
  },
  {
    label: 'Supply an artificial-intelligence application programming interface key',
    token: 'Not applicable — reason stated',
    note: 'Not applicable for all five roles: compute is bundled and no tenant key is required. No such field exists on this screen or on any other, which is what AC-DOH-12-4 asserts.',
  },
  {
    label: 'Call the inbound business-system integration endpoint',
    token: 'Not applicable — reason stated',
    note: 'Not applicable for all five roles: the endpoint is stubbed and returns HTTP status 501, creating nothing. It is not a screen control at all — an outside system calls it — and a call is recorded as a security-and-operations event so an early integration attempt is visible rather than silent.',
  },
  {
    label: 'Configure an outbound webhook',
    token: 'Explicitly prohibited — categorical',
    note: 'Explicitly prohibited for all five roles, the Tenant Admin included, and deferred beyond this version. No outbound webhook exists anywhere on the platform, which removes an exfiltration path; a disabled toggle here would imply a roadmap promise the source has not made.',
  },
  {
    label: 'Configure directory provisioning',
    token: 'Explicitly prohibited — categorical',
    note: 'Explicitly prohibited for all five roles and deferred beyond this version. Nor is there just-in-time provisioning at sign-in: an asserted subject with no existing user record is refused, and no account is created to receive it.',
  },
  {
    label: 'Change a tier, a cap or a threshold',
    token: 'Explicitly prohibited — categorical',
    note: 'Explicitly prohibited for all five tenant roles: tiers, caps and thresholds are set per tenant on the Super Admin platform console. The refusal is asserted for every tenant role, so no control for it is drawn on any tenant screen.',
  },
  {
    label: 'An enable control on the business-system inbound row',
    token: 'Deliberate absence — the absence is the control',
    note: 'Enabling an inbound business-system integration is a commercial and scope act, not a settings act. The source is explicit that building a disabled toggle here would itself be the defect, so the row is described and no control sits beside it.',
  },
  {
    label: 'A request-access or join-the-beta control',
    token: 'Deliberate absence — the absence is the control',
    note: 'A roadmap position is not a queue a tenant can join from a screen. The out-of-slice panel names each excluded category and where it stands, and offers nothing to press.',
  },
  {
    label: 'Deferred scoping — Cell, Job and worker',
    token: 'Deferred beyond this version',
    note: 'Cell, Job and worker scoping is deferred and no rule may depend on it, so it renders absent rather than disabled. This module scopes nothing below the tenant in any case: one connection record and one contact email, both tenant-wide.',
  },
] as const satisfies readonly AbsentByRule[]

/* ------------------------------------------------------------------ *
 * The rest of the integration surface. Named rather than dropped, and
 * never as a disabled control: this module's card carries four features
 * and this slice builds one of them.
 * ------------------------------------------------------------------ */

export interface OutOfSliceIntegration {
  readonly name: string
  readonly whatTheSourceSays: string
  readonly whereItStands: string
}

export const OUT_OF_SLICE_INTEGRATIONS = [
  {
    name: 'Email delivery through the single platform-contracted vendor',
    whatTheSourceSays:
      'Notifications are delivered by the platform’s email provider. The tenant provides a contact address and manages no credentials.',
    whereItStands:
      'The contact-email field is on this screen, because it is a row of this module’s own matrix and a field of the same configuration record. The delivery behind it belongs to the Notifications module in slice 10, and nothing on this screen sends, queues or schedules a message.',
  },
  {
    name: 'Bundled artificial-intelligence compute',
    whatTheSourceSays: 'Included. No account and no key is required.',
    whereItStands:
      'Out of this slice, and out of this screen entirely. There is no field to fill in, which is the whole of the design: a tenant that supplies no key cannot have one to leak.',
  },
  {
    name: 'Business-system inbound scaffolding',
    whatTheSourceSays:
      'Not available in this release. The connection point exists and is reserved; the inbound endpoint is stubbed, returns HTTP status 501 and creates nothing.',
    whereItStands:
      'Out of this slice. The reserved shape is real — a run-source vocabulary carrying four values of which only one is producible, and reserved external fields held null — and none of it is a control on this screen.',
  },
  {
    name: 'The tier and usage read view',
    whatTheSourceSays:
      'Meter definition, consumption against ceiling, ladder position with burst-band status, active Locations at Site level, and suspension status — read-only.',
    whereItStands:
      'Built in this slice, on the Tenant Lifecycle and Tier Operations module’s own screen (SCR-DOH-03), not here. It is the row of this module’s matrix that gives the Read-only Auditor a reason to reach the module at all.',
  },
] as const satisfies readonly OutOfSliceIntegration[]

/* ------------------------------------------------------------------ *
 * The decisions this screen renders. Each one appears on screen where a
 * reviewer can read it, not only in a comment.
 * ------------------------------------------------------------------ */

export interface RenderedDecision {
  readonly ref: string
  readonly statement: string
}

export const DECISIONS_ON_SCREEN = [
  {
    ref: 'D1',
    statement:
      'Screen catalogue B is canonical. SCR-DOH-21 is an annotation on this module, never a route key — this route is keyed on the module slug. Catalogue A carries the same screen under a three-digit identifier that names a different screen in catalogue B, which is why the three-digit form is forbidden anywhere in this codebase.',
  },
  {
    ref: 'D7',
    statement:
      'Connection loss splits three ways: loaded content degrades to the last record with a freshness marker and an as-of time, a read that fails outright names what failed and whether anything was written, and both write controls disable rather than queue. Reconnection refetches the tenant state before either is re-enabled.',
  },
  {
    ref: 'D8',
    statement:
      'Nine permission tokens, not six. Every refusal on this screen is one of the nine, produced by the shared evaluator, and none of them is a blank cell. Unavailable and Explicitly prohibited are never merged: the first withholds the route, the second lets the role open the screen and read why it may not act.',
  },
  {
    ref: 'D11',
    statement:
      'The Worker holds no Hub screen, so the Worker column of the matrix below is answered rather than blank. The cost is stated rather than hidden: a worker without a device in hand cannot check their own certification expiry.',
  },
  {
    ref: 'D19',
    statement:
      'Five operating tenant states gate the two writes on this screen, and pilot is an orthogonal flag rather than a sixth state. Draft and awaiting-administrator belong to the platform console and never render here, because in draft no user can authenticate at all — and a screen about authentication is exactly where that matters.',
  },
  {
    ref: 'D20',
    statement:
      'The four-digit feature catalogue is the traceability key. This screen is FEAT-DOH-1201 and nothing else of the integration surface; the other three features of the module card are named in the out-of-slice panel rather than half-built.',
  },
  {
    ref: 'D21',
    statement:
      'The module identity card governs this record’s state vocabulary — configured, not configured and reserved-inert. The state NAMES are a derived clarification and renameable; the behaviours behind them are fact.',
  },
] as const satisfies readonly RenderedDecision[]

/* ------------------------------------------------------------------ *
 * What the source does not define, and what it answers twice.
 * ------------------------------------------------------------------ */

export const UNSPECIFIED_IN_SOURCE = [
  'No control is defined for removing, disconnecting or suspending a configured single sign-on connection. The matrix names configuring it and nothing else, so nothing here undoes one.',
  'No metadata FIELD is enumerated for either protocol — no entity identifier, no assertion consumer address, no certificate, no signing key, no discovery document. The source names the two protocols and stops, so this screen offers the protocol choice and invents no field to sit under it.',
  'No control is defined for adding, removing or checking an email domain against the connection record, and no rule is stated for what happens when two tenants claim the same domain.',
  'No second connection is described. The source carries one connection record per tenant and defines no list, no add control and no way to choose between two.',
  'No per-user, per-Site or per-domain override of the protocol choice is defined, and no rule is stated for a tenant that wants both protocols at once.',
  'No health check, re-test schedule, certificate-expiry warning or last-successful-assertion reading is defined for the connection.',
  'No export of the connection record or of the tenant contact email is defined for any tenant role.',
  'No notification, no confirmation step and no cooling-off period is defined for a change to the connection record, even though the change governs how everybody in the tenant signs in.',
] as const

export const UNRESOLVED_IN_SOURCE = [
  'Both screen catalogues list the Tenant Admin alone against this screen, while this module’s own matrix marks the Read-only Auditor Explicitly prohibited — not Unavailable — on both of its write rows. Explicitly prohibited is the token whose own meaning is that the role opens the screen and meets a refusal it can read, so this build admits the Auditor read-only and disables both writes with their reason. The competing reading is that the catalogues are decisive and the Auditor should meet a permission refusal at the route. Recorded rather than settled in silence.',
  'The module rail offers this route to the Read-only Auditor on the strength of one matrix row — the tier and usage read view — and this slice renders that view on another module’s screen. So the route the rail offers the Auditor leads to a screen whose only built section carries nothing the Auditor may act on. The rail rule and the slice boundary are each right on their own; together they leave this seam, and it is named here rather than papered over.',
  'Three identifier namespaces describe the same connection: one chapter publishes five integration cards, another publishes seven, and this module’s key-functions list uses a third scheme again. This build uses the identifier the module card’s own objects-affected field names, and treats the other two as restatements.',
  'The tenant contact email is a row of this module’s permission matrix, while the rendered field on the storyboard that carries it is attributed to the Notifications module. The source does not resolve that module boundary. This screen renders the field, because the configuration record is this module’s object, and states the boundary rather than hiding it.',
  'Reserved-inert is in this module’s integration-state vocabulary, but every description of it in the source is about the reserved business-system connection point. What a reserved-inert single sign-on record means — and whether one can exist at all — is not stated.',
  'DEC-SSO-001 is open: whether an asserted subject with no existing user record should be provisioned just in time. The adopted interim position is refusal, and this screen renders that position rather than the open question’s other branch.',
  'The tenant-lifecycle module renders the same shape — a control its own matrix gives the Tenant Admin and marks Explicitly prohibited for the Read-only Auditor — as ABSENT rather than disabled, and records its own dissent for doing so. This screen renders it disabled with its reason, following the routing-rule half of the prohibition mapping. The two readings are compared here rather than diverging module by module without anyone noticing.',
] as const

/* ------------------------------------------------------------------ *
 * The evaluator context. The tenant partition stays ACTIVE on purpose:
 * the Hub's tenant-state gate is the write-class table, a per-write-class
 * answer, while the evaluator's own suspension stage is a blunt
 * whole-tenant refusal. Routing suspension through the partition would
 * put one rule in two places and make this screen lie about what a
 * soft-suspended tenant can still read.
 * ------------------------------------------------------------------ */

const FIXTURE_TENANT = tenantId('TEN-BRIGHTBIKES')

const FIXTURE_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('DOH-12-INTEGRATION-SURFACE')),
  FIXTURE_TENANT,
  (partition) => ({ ...partition, lifecycleState: 'ACTIVE' }),
)

export function fixtureContext(role: TenantRoleId): AccessContext {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role,
      // A tenant-domain role holds its own tenant ambiently; this module
      // scopes nothing below the tenant, so both scope arrays stay empty.
      tenant: FIXTURE_TENANT,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'ACT-DOH-VIEWER',
  }
}
