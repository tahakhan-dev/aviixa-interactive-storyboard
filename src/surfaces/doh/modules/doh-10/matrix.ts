import type { SurfaceId } from '@/domain/surfaces'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import {
  BARE_PROHIBITION,
  type ControlStatus,
  type DohControlMatrixRow,
} from '@/surfaces/doh/modules'
import type { WriteAction } from '@/surfaces/doh/tenant-state'
import { CH_30C_2_CATEGORIES, notificationKey, type NotificationKey } from '@/registry/signals'

/**
 * MOD-DOH-10 — Notifications, §19.13. Screen `SCR-DOH-19` at
 * `/hub/notifications`; catalogue B row L48113.
 *
 * ── THE SPANS, RE-MEASURED LINE BY LINE ───────────────────────────────────
 * Identity card L28670-L28683. "**Roles and permissions.**" L28685. Control
 * matrix: header L28687, separator L28688, **12 data rows L28689-L28700**.
 * Numbered workflow L28704-L28712. The brief's twelve is correct.
 *
 * ── EVERY ONE OF THE TWELVE ACTS IS A WRITE, AND THAT IS THE FIRST TRAP ───
 * Read the Action column's verbs down the body: Set, Set, Disable, Mute,
 * Mute, Mute, Set, Add, Configure, Configure, Acknowledge, Change. There is
 * no read row on this card at all — no "View the notification policy", no
 * "See my notifications". So the `Read-only` token, which occurs in exactly
 * ONE cell (L28699, the Read-only Auditor on "Acknowledge a notification"),
 * can only ever land on a write.
 *
 * That matters because the inherited fold renders `read-only` as STATE-06 —
 * "every input is disabled, with one banner naming the cause"
 * (`@/ui/screen-state`) — which reads as *disabled by the object's state*,
 * i.e. not right now. Acknowledgement is not withheld from that role right
 * now. It is withheld always, and the source says so twice outside this
 * card: `AC-AUTH-003` (L10426) — "The Read-only Auditor holds no write
 * capability anywhere and no Client Command Center access at all" — and
 * `AC-DOH-011-2` (L25695) — "A Read-only Auditor session renders no write
 * control anywhere in the Hub, including in the tenant administration area."
 * So the cell renders as no control with the permanent cause named, and
 * `Doh10Affordance` in `./rendering` has NO `read-only` arm for the fold to
 * reach. `DOH_10_READ_ONLY_CELLS` measures that the token occurs once, so a
 * second occurrence cannot arrive unnoticed.
 *
 * ── AND THE SAME TWO CRITERIA CONTRADICT TWO PERMISSIVE CELLS ─────────────
 * See `DOH_10_FINDINGS` entry `readonly-auditor-holds-two-writes`. Rows 2
 * and 5 give the Read-only Auditor `Allowed` — both writes. Neither brief
 * names this and it is not the same trap as the one above: there the token
 * withholds and the question is how to draw the withholding, here the token
 * GRANTS and two acceptance criteria refuse. It is disclosed, not tidied.
 *
 * ── WHERE A CELL'S ACT IS MET IS A PER-CELL QUESTION ON THIS CARD ─────────
 * `MatrixRowSurface` (`@/surfaces/doh/modules`) is per ROW, and rows 2, 5
 * and 11 need three different answers in three different columns of the same
 * row: met on this screen for the Tenant Admin, met on `SURF-FL` for the
 * Worker on row 11 (L28681 — the module "feeds the Frontline inbox"; L28710
 * — acknowledgement is "one state on the record and **any channel writes
 * it**"), and met on NO NAMED SCREEN for the Worker on rows 2 and 5. So
 * `surface` stays `screen` — which is correct for the four Hub roles and is
 * what `rolesReachingByMatrix` needs — and `metByRole` carries the per-cell
 * answer. This is a fifth reading of the row-level token's inadequacy, and
 * it belongs in `MATRIX_ROW_SURFACE_DIVERGENCES`, which this task does not
 * own; see the report.
 */

/* ==================================================================== *
 * 1. THE TWELVE-ROW CONTROL MATRIX, L28689-L28700.
 * ==================================================================== */

export type Doh10ControlId =
  | 'set-notification-policy'
  | 'set-own-channel-preferences'
  | 'disable-a-mandatory-baseline-event'
  | 'mute-in-app-notifications'
  | 'mute-a-digest-section'
  | 'mute-the-digest-service-itself'
  | 'set-per-shift-digest-delivery-times'
  | 'add-an-external-recipient'
  | 'configure-quiet-hours'
  | 'configure-a-short-message-service-push-or-webhook-channel'
  | 'acknowledge-a-notification'
  | 'change-the-critical-re-notify-interval'

/**
 * WHERE ONE CELL'S ACT IS PERFORMED. Three answers, and the third is the one
 * the row-level vocabulary has no member for: an act a cell GRANTS and no
 * screen on any surface draws.
 *
 * The reservation `@/surfaces/doh/modules` puts on `another-surface` — "a
 * capability that exists NOWHERE is a `screen` row whose every cell refuses"
 * — does not cover it, because here the cell does not refuse. It grants, and
 * the source names no screen. Collapsing that into `here` would draw a
 * control on a screen the role cannot open; collapsing it into
 * `other-surface` would point at a place the source does not name, and a
 * routing pointer reads as a verified fact.
 */
export type Doh10CellPointer =
  /** Met on this module's own screen. */
  | { readonly kind: 'here' }
  /** Met on a surface the source names for this cell. */
  | {
      readonly kind: 'other-surface'
      readonly surface: SurfaceId
      /** The source's own name for the view, never a minted `SCR-*` id. */
      readonly screen: string
      readonly note: string
    }
  /** Granted, and the source names no screen on any surface that draws it. */
  | { readonly kind: 'no-screen-named'; readonly note: string }

export interface Doh10Row extends DohControlMatrixRow<Doh10ControlId> {
  /**
   * The suspension write class this act belongs to, or `null` where the
   * source states no tenant-state condition.
   *
   * ROW 1 ONLY, and it is a transcription rather than a judgement: L28689
   * says the Tenant Admin's grant is "blocked in every suspension state as a
   * configuration edit", and `edit-configuration` is already a `WriteAction`
   * in `@/surfaces/doh/tenant-state`. The suspension table names this act by
   * name rather than by category — L26919's soft-suspension blocked column
   * reads "all configuration edits including tenant settings, roles and
   * permissions, and **notification policy**" — so the class is read, never
   * re-derived. The other eleven rows carry no tenant-state clause anywhere
   * on the card; see `UNSPECIFIED_IN_SOURCE`.
   */
  readonly writeAction: WriteAction | null
  /** Per cell, per role. Required — an unstated pointer is a silent `here`. */
  readonly metByRole: Readonly<Record<TenantRoleId, Doh10CellPointer>>
}

const HERE: Doh10CellPointer = { kind: 'here' }

const ALL_HERE: Readonly<Record<TenantRoleId, Doh10CellPointer>> = {
  TENANT_ADMIN: HERE,
  SUPERVISOR: HERE,
  QUALITY_MANAGER: HERE,
  READONLY_AUDITOR: HERE,
  WORKER: HERE,
}

/**
 * The Worker's own-preference cells on rows 2 and 5. Both are `Allowed`, and
 * the Worker holds no Hub route (D11, `@/routes/definitions`) — so the grant
 * is real and this surface cannot draw it. The two Hub screens the source
 * names for these acts are the notification policy-and-preferences screen
 * (catalogue B L48113, catalogue A L26070) and the per-shift digest view,
 * whose storyboard `SB-015-03` names it a Delivery Operations Hub screen
 * with "per-section mute controls and no service-level mute" (L68775). Both
 * are Hub screens. The Frontline inbox storyboard `SB-021-03` on the same
 * line lists only "the notifications addressed to the logged-in identity,
 * the back-fill state on login, the sync-status detail" and the statement
 * that general notifications carry no read obligation — no preference
 * control. So no screen on any surface is named for these two cells.
 */
const WORKER_NO_SCREEN: Doh10CellPointer = {
  kind: 'no-screen-named',
  note:
    'The cell grants this act to the Worker and the Delivery Operations Hub admits no Worker (D11), so it cannot be drawn here. The two views the source names for it — the notification policy-and-preferences screen (L48113, L26070) and the per-shift digest view (SB-015-03, L68775) — are both Hub screens. The Frontline inbox storyboard, SB-021-03 at L69696, draws no preference control. The authority is real and the source names no screen for it; none is invented, and no pointer is drawn at a surface the source does not name.',
}

/**
 * Row 11's Worker cell, and it is the one cell on this card whose other
 * surface the source does name. L28681: the module "feeds the Frontline
 * inbox". L28710: acknowledgement "is one state on the record and **any
 * channel writes it**". The inbox is the Worker's own-notification view.
 */
const WORKER_ACK_ON_FRONTLINE: Doh10CellPointer = {
  kind: 'other-surface',
  surface: 'SURF-FL',
  screen: 'the identity-scoped inbox (SB-021-03)',
  note:
    'L28681 — this module "feeds the Frontline inbox"; L28710 — acknowledgement "is one state on the record and any channel writes it". The cell’s own condition is "own notifications", which is what the identity-scoped inbox holds — SB-021-03, L69696. The act is real, it is the Worker’s, and it happens there rather than here.',
}

const ROW_2_AND_5_MET: Readonly<Record<TenantRoleId, Doh10CellPointer>> = {
  ...ALL_HERE,
  WORKER: WORKER_NO_SCREEN,
}

const ROW_11_MET: Readonly<Record<TenantRoleId, Doh10CellPointer>> = {
  ...ALL_HERE,
  WORKER: WORKER_ACK_ON_FRONTLINE,
}

/** Four bare tokens beside one qualified Tenant Admin cell. Rows 1 and 7. */
const FOUR_BARE = (tenantAdmin: string): Readonly<Record<TenantRoleId, string>> => ({
  TENANT_ADMIN: tenantAdmin,
  SUPERVISOR: BARE_PROHIBITION,
  QUALITY_MANAGER: BARE_PROHIBITION,
  READONLY_AUDITOR: BARE_PROHIBITION,
  WORKER: BARE_PROHIBITION,
})

/**
 * One reason in all five columns. Used where the source states the cause on
 * a NEARBY LINE OF THIS CARD or in the chapter that owns the rule, so the
 * cell is not a bare token at all — it is a token whose cause the source
 * gives once for everyone. Carrying it into every column follows the ruling
 * `MOD-DOH-19` recorded: a cell that renders "same reason" beside no reason
 * is the blank cell L10238 forbids.
 */
const ONE_REASON = (reason: string): Readonly<Record<TenantRoleId, string>> => ({
  TENANT_ADMIN: reason,
  SUPERVISOR: reason,
  QUALITY_MANAGER: reason,
  READONLY_AUDITOR: reason,
  WORKER: reason,
})

const ALL_STATUS = (s: ControlStatus): Readonly<Record<TenantRoleId, ControlStatus>> => ({
  TENANT_ADMIN: s,
  SUPERVISOR: s,
  QUALITY_MANAGER: s,
  READONLY_AUDITOR: s,
  WORKER: s,
})

const ADMIN_ONLY = (admin: ControlStatus): Readonly<Record<TenantRoleId, ControlStatus>> => ({
  TENANT_ADMIN: admin,
  SUPERVISOR: 'explicitly-prohibited',
  QUALITY_MANAGER: 'explicitly-prohibited',
  READONLY_AUDITOR: 'explicitly-prohibited',
  WORKER: 'explicitly-prohibited',
})

/**
 * The cause the four non-baseline prohibitions share, stated by the chapter
 * that owns the channel set rather than by this card: L51601 — Short Message
 * Service, push, webhooks, quality-management-system integration channels,
 * external recipients and quiet hours are "all outside V1", and "no
 * notification behaviour in this document may assume them".
 */
const OUT_OF_V1 =
  'Explicitly prohibited — out of V1. The channel set is closed at two, platform-wide, at every tier, and L51601 puts Short Message Service, operating-system push, webhooks, quality-management-system integration channels, external recipients and quiet hours outside V1 with the words "no notification behaviour in this document may assume them". No role holds this on any surface, so nothing is drawn and no pointer is offered.'

export const CONTROL_MATRIX = [
  {
    id: 'set-notification-policy',
    control: 'Set notification policy — which events fire, to which recipient roles',
    surface: 'screen',
    writeAction: 'edit-configuration',
    metByRole: ALL_HERE,
    status: ADMIN_ONLY('allowed-with-conditions'),
    detail: FOUR_BARE(
      'Allowed with conditions, and there are two of them in the one cell: never below the mandatory baseline, and blocked in every suspension state as a configuration edit. The first is a floor on WHAT may be set and the second is a gate on WHEN — a screen that folds either into an enabled button ships a policy editor that is live under suspension or that can drop the baseline.',
    ),
    rendering:
      'A control for the Tenant Admin while the tenant state permits a configuration edit, and the stated line in its place while it does not. Never a disabled control, and never a control that could reach below the baseline.',
    effect:
      'The tenant’s notification policy changes above the mandatory baseline. The baseline itself is unreachable from here.',
    sourceRef: 'L28689',
  },
  {
    id: 'set-own-channel-preferences',
    control: 'Set own channel preferences within policy',
    surface: 'screen',
    writeAction: null,
    metByRole: ROW_2_AND_5_MET,
    status: ALL_STATUS('allowed'),
    detail: ONE_REASON(
      'Allowed, for all five roles and with no condition stated on this row. It is the user half of the two-level model (L28689 sets the policy; this sets preferences within it), and L73672 states the model: the Tenant Admin sets which events fire and to which recipient roles, each user sets channel preferences within that policy. What a preference can reach is bounded elsewhere and not by this cell: in-app cannot be muted at any level (L28692, L51601), and the mandatory baseline is unreachable (L28691).',
    ),
    rendering:
      'The three preference groups the storyboard draws (SB-PREF-01, L73702): Always sent and Protected as visible locked controls with their reason inline, and Configurable with a working email toggle. Two of the five roles do not get an operable toggle, and neither reason is this row’s token — see the findings.',
    effect:
      'One person’s email preferences change within the tenant policy. The in-app item always exists.',
    sourceRef: 'L28690',
  },
  {
    id: 'disable-a-mandatory-baseline-event',
    control: 'Disable a mandatory-baseline event',
    surface: 'screen',
    writeAction: null,
    metByRole: ALL_HERE,
    status: ALL_STATUS('explicitly-prohibited'),
    detail: ONE_REASON(
      'Explicitly prohibited for every role, and the cause is on this card twice: L28682 — "The mandatory baseline cannot be disabled by any role" — and L28706, where mandatory-baseline events "skip the enablement check entirely and are always eligible". The three families are named at L51603: subscription and tier lifecycle; qualification expiry on the 14, 7, 1, 0 day schedule; and the allocation ladder at 80, 100 and 125 per cent plus the burst-entry event.',
    ),
    rendering:
      'No control for anyone. The Always-sent group renders the affected categories as VISIBLE LOCKED controls with this reason inline — which is the opposite of drawing nothing, and is what SB-PREF-01 (L73702) requires.',
    effect: 'None. The row records a floor rather than an act anyone performs.',
    sourceRef: 'L28691',
  },
  {
    id: 'mute-in-app-notifications',
    control: 'Mute in-app notifications',
    surface: 'screen',
    writeAction: null,
    metByRole: ALL_HERE,
    status: ALL_STATUS('explicitly-prohibited'),
    detail: ONE_REASON(
      'Explicitly prohibited for every role. L28682: "In-app cannot be muted." L51601 states it as a platform-wide fact at every tier. The preference workflow’s own step 5 (L73684) says why no screen needs a gate for it: the platform "validates that in-app remains enabled, which it always does because the control does not exist".',
    ),
    rendering:
      'No control, and no locked control either — L73684 is explicit that the control does not exist, so drawing one greyed out would claim a setting the platform has none of. The statement renders in the preferences panel instead.',
    effect: 'None. In-app delivery is unconditional.',
    sourceRef: 'L28692',
  },
  {
    id: 'mute-a-digest-section',
    control: 'Mute a digest section',
    surface: 'screen',
    writeAction: null,
    metByRole: ROW_2_AND_5_MET,
    status: ALL_STATUS('allowed'),
    detail: ONE_REASON(
      'Allowed for all five roles, with no condition on this row. L73672 states the rule it belongs to: "Users mute sections of the digest, not services." The per-shift digest view draws the controls — SB-015-03 names "per-section mute controls and no service-level mute" (L68775).',
    ),
    rendering:
      'A per-section control where the viewer has a screen for it. The Worker has none named anywhere; see the pointer on this row.',
    effect: 'One section stops appearing in that person’s digest. The digest still delivers.',
    sourceRef: 'L28693',
  },
  {
    id: 'mute-the-digest-service-itself',
    control: 'Mute the digest service itself',
    surface: 'screen',
    writeAction: null,
    metByRole: ALL_HERE,
    status: ALL_STATUS('explicitly-prohibited'),
    detail: ONE_REASON(
      'Explicitly prohibited for every role, and the Tenant Admin cell carries the reason the source gives once for all of them: "users mute sections, not services". L73672 states the same rule as a fact at Part IX. The distinction from the row above is the whole of it — a section is a preference, a service is not.',
    ),
    rendering:
      'No control and the reason in its place. No pointer: there is no surface on which anyone mutes the service.',
    effect: 'None.',
    sourceRef: 'L28694',
  },
  {
    id: 'set-per-shift-digest-delivery-times',
    control: 'Set per-Shift digest delivery times',
    surface: 'screen',
    writeAction: null,
    metByRole: ALL_HERE,
    status: ADMIN_ONLY('allowed'),
    detail: FOUR_BARE(
      'Allowed. The source states the bare token and attaches no condition — no suspension clause, no bound — so none is invented here; the silence is recorded in UNSPECIFIED_IN_SOURCE. The times are a Shift property, which is why this card depends on MOD-DOH-03 for "shifts and digest times" (L28680).',
    ),
    rendering: 'A control for the Tenant Admin; the stated refusal in its place for the other four.',
    effect: 'Each Shift’s digest delivers at the time set for that Shift.',
    sourceRef: 'L28695',
  },
  {
    id: 'add-an-external-recipient',
    control: 'Add an external recipient',
    surface: 'screen',
    writeAction: null,
    metByRole: ALL_HERE,
    status: ALL_STATUS('explicitly-prohibited'),
    detail: ONE_REASON(
      `${OUT_OF_V1} This card states the security consequence directly at L28682: "External recipients are impossible at V1, which removes a whole exfiltration path."`,
    ),
    rendering: 'No control for any role and the reason in its place. No pointer.',
    effect: 'None. Every recipient resolves to a platform role holder.',
    sourceRef: 'L28696',
  },
  {
    id: 'configure-quiet-hours',
    control: 'Configure quiet hours',
    surface: 'screen',
    writeAction: null,
    metByRole: ALL_HERE,
    status: ALL_STATUS('explicitly-prohibited'),
    detail: ONE_REASON(OUT_OF_V1),
    rendering: 'No control for any role and the reason in its place. No pointer.',
    effect: 'None. Delivery is not time-windowed at V1.',
    sourceRef: 'L28697',
  },
  {
    id: 'configure-a-short-message-service-push-or-webhook-channel',
    control: 'Configure a Short Message Service, push or webhook channel',
    surface: 'screen',
    writeAction: null,
    metByRole: ALL_HERE,
    status: ALL_STATUS('explicitly-prohibited'),
    detail: ONE_REASON(
      `${OUT_OF_V1} L51601 adds the rule that governs any proposal to widen the set: "Any additional channel proposed anywhere in this blueprint is a \`Recommendation — R&D\` and nothing more."`,
    ),
    rendering: 'No control for any role and the reason in its place. No pointer.',
    effect: 'None. The channel set stays closed at in-app and email.',
    sourceRef: 'L28698',
  },
  {
    id: 'acknowledge-a-notification',
    control: 'Acknowledge a notification',
    surface: 'screen',
    writeAction: null,
    metByRole: ROW_11_MET,
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'allowed-with-conditions',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed. Acknowledgement is one state on the record and any channel writes it; acknowledge and resolve are distinct, timestamped states (L28710).',
      SUPERVISOR:
        'Allowed. Acknowledgement is one state on the record and any channel writes it; acknowledge and resolve are distinct, timestamped states (L28710).',
      QUALITY_MANAGER:
        'Allowed. Acknowledgement is one state on the record and any channel writes it; acknowledge and resolve are distinct, timestamped states (L28710).',
      READONLY_AUDITOR:
        'Read-only, on an act that is a write. The notification record is legible to this role and the acknowledgement is not available in any state — not withheld for now, withheld always. AC-AUTH-003 (L10426): "The Read-only Auditor holds no write capability anywhere and no Client Command Center access at all." AC-DOH-011-2 (L25695): "A Read-only Auditor session renders no write control anywhere in the Hub, including in the tenant administration area." So no control renders and none is drawn disabled, which would read as a state that could change.',
      WORKER:
        'Allowed with conditions — own notifications. The condition is the scope of the act, not a gate on it, and the act is met on the Frontline identity-scoped inbox rather than here; see this row’s pointer.',
    },
    rendering:
      'A control for the three roles that hold it. For the Read-only Auditor, no control and the permanent cause named — never a disabled control. For the Worker, the statement that the act is theirs and happens on the Frontline inbox.',
    effect:
      'One acknowledgement state is written on the record, with its timestamp. Resolution is a separate state (L28710).',
    sourceRef: 'L28699',
  },
  {
    id: 'change-the-critical-re-notify-interval',
    control: 'Change the Critical re-notify interval',
    surface: 'screen',
    writeAction: null,
    metByRole: ALL_HERE,
    status: ALL_STATUS('explicitly-prohibited'),
    detail: ONE_REASON(
      'Explicitly prohibited for every role, and the Tenant Admin cell carries the reason for all of them: 4 hours standard, 1 hour in Regulated-Industry mode, set from the Super Admin platform console. L28711 states the behaviour as a fact of the platform rather than a setting of the tenant, and L28680 records the dependency on MOD-DOH-17 for the Regulated-Industry interval. No tenant role opens the platform console, so no link is drawn.',
    ),
    rendering:
      'No control for any role and the interval stated as a read value with its two settings. Never a disabled control: the value is not out of reach for now, it is not a tenant setting at all.',
    effect: 'None here. The interval is a platform value the tenant reads.',
    sourceRef: 'L28700',
  },
] as const satisfies readonly Doh10Row[]

/** The source's own row count, so a dropped row cannot pass as a full read. */
export const DOH_10_SOURCE_ROW_COUNT = 12

const BY_ID = new Map<Doh10ControlId, Doh10Row>(CONTROL_MATRIX.map((r) => [r.id, r]))

export function doh10Row(id: Doh10ControlId): Doh10Row {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`MOD-DOH-10: no matrix row is transcribed for "${id}".`)
  return found
}

/**
 * Every cell carrying the `Read-only` token, derived rather than asserted.
 * MEASURED: exactly one, row 11's Read-only Auditor cell (L28699). Exported
 * because the fold's missing `read-only` arm is a claim about the whole card
 * and a second such cell must fail loudly rather than fall to a default.
 */
export const DOH_10_READ_ONLY_CELLS: readonly string[] = CONTROL_MATRIX.flatMap((row) =>
  (Object.keys(row.status) as TenantRoleId[])
    .filter((role) => row.status[role] === 'read-only')
    .map((role) => `${row.id}:${role}`),
)

/** Cells whose act this surface grants and no surface's screen draws. */
export const DOH_10_UNSCREENED_GRANTS: readonly string[] = CONTROL_MATRIX.flatMap((row) =>
  (Object.keys(row.metByRole) as TenantRoleId[])
    .filter(
      (role) =>
        row.metByRole[role].kind === 'no-screen-named' &&
        (row.status[role] === 'allowed' || row.status[role] === 'allowed-with-conditions'),
    )
    .map((role) => `${row.id}:${role}`),
)

/* ==================================================================== *
 * 2. THE TWO SCREEN CATALOGUES DISAGREE ABOUT THIS MODULE'S SCREEN, AND
 *    THE DISAGREEMENT IS THE ANSWER TO THE PERMISSIVE-CELL TRAP.
 * ==================================================================== */

/**
 * Catalogue B (canonical here, L48113) gives `MOD-DOH-10` the screen
 * "Notification policy", the purpose "Set which events fire, to which roles,
 * above the baseline", and a "Roles that can open it" cell reading **Tenant
 * Admin** alone. Ten of this card's twelve rows agree with that: they are
 * policy acts and only the Tenant Admin holds any of them.
 *
 * The other two rows — 2 and 5 — grant all five roles a PERSONAL preference,
 * and catalogue A's row for the same module answers them. It is at L26070,
 * and it reads "Notification policy **and preferences**" with a Primary role
 * of "Tenant Admin sets policy; **each user sets preferences**". Its
 * identifier is the banned three-digit form (`@/surfaces/doh/screens` — the
 * two catalogues use the same trailing numbers for different screens, and
 * catalogue A's `019` is `MOD-DOH-09`'s users-and-roles screen while
 * catalogue B's `19` is this one), so it is named here by locator and name
 * only, exactly as `DOH_CATALOGUE_AB_SWAP` and `DOH_UNCATALOGUED_SCREEN_NAMES`
 * name theirs.
 *
 * SO THE TRAP IS NOT A CONTRADICTION TO RESOLVE BY WIDENING A SCREEN. The
 * source draws one module across two halves and each catalogue records one
 * of them. This build renders both halves on one route and states which
 * catalogue each half's role list comes from. It does not widen catalogue B's
 * cell, and it does not mint a second screen identifier for the preferences
 * half.
 */
export const DOH_10_CATALOGUE_SPLIT = {
  id: 'C2-permissive-cells-against-a-single-role-screen',
  grade: 'C2',
  catalogueB: {
    screenId: 'SCR-DOH-19',
    name: 'Notification policy',
    roles: 'Tenant Admin',
    sourceRef: 'L48113',
  },
  catalogueA: {
    name: 'Notification policy and preferences',
    roles: 'Tenant Admin sets policy; each user sets preferences',
    sourceRef: 'L26070',
  },
  policyRows: [
    'set-notification-policy',
    'disable-a-mandatory-baseline-event',
    'mute-in-app-notifications',
    'mute-the-digest-service-itself',
    'set-per-shift-digest-delivery-times',
    'add-an-external-recipient',
    'configure-quiet-hours',
    'configure-a-short-message-service-push-or-webhook-channel',
    'change-the-critical-re-notify-interval',
  ],
  preferenceRows: ['set-own-channel-preferences', 'mute-a-digest-section'],
  acknowledgementRows: ['acknowledge-a-notification'],
  statement:
    'Catalogue B admits the Tenant Admin alone to this module’s screen and describes only the policy half. Catalogue A describes the same module’s screen as "Notification policy and preferences" and names every user for the preferences half. Neither catalogue is declared wrong: the two halves are drawn on one route with each half’s role list attributed to the catalogue that states it, and no screen identifier is minted for the preferences half. Catalogue A’s identifier is the banned three-digit form and is named by locator and name only.',
} as const

type SplitRowId = (typeof DOH_10_CATALOGUE_SPLIT)['policyRows'][number]
type UnknownSplitRow = Exclude<SplitRowId, Doh10ControlId>
const _splitRowsAreRealRows: UnknownSplitRow extends never ? true : never = true
void _splitRowsAreRealRows

/**
 * Every row is in exactly one of the three lists above, checked here rather
 * than by eye — a row in none of them would silently render in neither half.
 */
export function doh10UnpartitionedRows(): readonly Doh10ControlId[] {
  const named = new Set<string>([
    ...DOH_10_CATALOGUE_SPLIT.policyRows,
    ...DOH_10_CATALOGUE_SPLIT.preferenceRows,
    ...DOH_10_CATALOGUE_SPLIT.acknowledgementRows,
  ])
  return CONTROL_MATRIX.filter((r) => !named.has(r.id)).map((r) => r.id)
}

/* ==================================================================== *
 * 3. THE 30C.10 PREFERENCE MATRIX, L73708-L73711, AND THE COUNT THAT
 *    JUSTIFIES DRAWING A LOCKED CONTROL AT ALL.
 * ==================================================================== */

/**
 * Header L73706, separator L73707, **four data rows L73708-L73711**, five
 * permission columns — TWENTY cells. The common brief's span included the
 * header and the separator and dropped the fourth row; the corrected span is
 * in the task brief and it is right.
 *
 * COUNTED COLUMN BY COLUMN, and this is the claim a reader is most likely to
 * doubt because two other numbers are in circulation:
 *
 *   May disable a mandatory family   EP, EP, EP, "EP for mandatory content"
 *                                    → 3 bare + 1 qualified
 *   May disable a protected category EP, EP, EP, EP  → 4 bare
 *   May disable in-app               EP, EP, EP, "Not applicable" → 3 bare
 *   May reduce email                 NA, AwC, AwC, Allowed → 0
 *   May change recipient roles       NA, Allowed, EP, NA → 1 bare
 *
 * ELEVEN bare `Explicitly prohibited` cells of twenty, TWELVE counting the
 * qualified variant. ONE column is bare in every cell; TWO are a prohibition
 * in every cell once the qualified variant counts. It was never three, and
 * "every cell of three of its five columns" is what a span stopping at the
 * third data row looks like.
 *
 * THE TRAP SURVIVES THE CORRECTION, which is the only reason the numbers
 * matter here rather than in a footnote: the ABSENT rule applied to the
 * protected-category column ALONE still deletes the Protected group, and
 * applied to the mandatory-family column still deletes Always sent. Two
 * columns are enough for the inversion; the count was wrong and the
 * consequence was not.
 *
 * AND THE "Level" COLUMN IS NOT A COLUMN OF ACTORS. Three of its four rows
 * name a party — the platform floor, the Tenant Admin's policy, an
 * individual user — and the fourth names a DELIVERY, the digest sections.
 * Only two of the four are levels a tenant viewer occupies, which is why
 * `preferenceLevelFor` below maps five roles onto two rows and not four.
 */
export type PreferenceLevel =
  | 'Platform floor'
  | 'Tenant Admin policy'
  | 'Individual user'
  | 'Digest sections'

export type PreferenceColumn =
  | 'May disable a mandatory family'
  | 'May disable a protected category'
  | 'May disable in-app'
  | 'May reduce email'
  | 'May change recipient roles'

export const PREFERENCE_COLUMNS = [
  'May disable a mandatory family',
  'May disable a protected category',
  'May disable in-app',
  'May reduce email',
  'May change recipient roles',
] as const satisfies readonly PreferenceColumn[]

type MissingFromPreferenceColumns = Exclude<
  PreferenceColumn,
  (typeof PREFERENCE_COLUMNS)[number]
>
const _preferenceColumnsExhaustive: MissingFromPreferenceColumns extends never ? true : never = true
void _preferenceColumnsExhaustive

export interface PreferenceMatrixRow {
  readonly level: PreferenceLevel
  /** `true` where the row names a party; `false` where it names a delivery. */
  readonly isAParty: boolean
  /** The five cells, verbatim from the source's own line. */
  readonly cells: Readonly<Record<PreferenceColumn, string>>
  readonly sourceRef: string
}

export const PREFERENCE_MATRIX = [
  {
    level: 'Platform floor',
    isAParty: true,
    cells: {
      'May disable a mandatory family': 'Explicitly prohibited',
      'May disable a protected category': 'Explicitly prohibited',
      'May disable in-app': 'Explicitly prohibited',
      'May reduce email': 'Not applicable — the floor sets no user preference',
      'May change recipient roles': 'Not applicable — the floor sets no recipients',
    },
    sourceRef: 'L73708',
  },
  {
    level: 'Tenant Admin policy',
    isAParty: true,
    cells: {
      'May disable a mandatory family': 'Explicitly prohibited',
      'May disable a protected category': 'Explicitly prohibited',
      'May disable in-app': 'Explicitly prohibited',
      'May reduce email': 'Allowed with conditions — not for Critical categories',
      'May change recipient roles': 'Allowed',
    },
    sourceRef: 'L73709',
  },
  {
    level: 'Individual user',
    isAParty: true,
    cells: {
      'May disable a mandatory family': 'Explicitly prohibited',
      'May disable a protected category': 'Explicitly prohibited',
      'May disable in-app': 'Explicitly prohibited',
      'May reduce email':
        'Allowed with conditions — within tenant policy and not for Critical categories',
      'May change recipient roles': 'Explicitly prohibited',
    },
    sourceRef: 'L73710',
  },
  {
    level: 'Digest sections',
    isAParty: false,
    cells: {
      'May disable a mandatory family': 'Explicitly prohibited for mandatory content',
      'May disable a protected category': 'Explicitly prohibited',
      'May disable in-app': 'Not applicable — the digest is a delivery, not a channel',
      'May reduce email': 'Allowed',
      'May change recipient roles': 'Not applicable — digest audience follows the shift',
    },
    sourceRef: 'L73711',
  },
] as const satisfies readonly PreferenceMatrixRow[]

/** Four rows, five columns. Stated so a dropped row cannot pass. */
export const PREFERENCE_MATRIX_SHAPE = { dataRows: 4, columns: 5, cells: 20 } as const

/**
 * Counted from the cells rather than restated. `bare` is a cell reading
 * exactly `Explicitly prohibited`; `qualified` is a cell that prohibits and
 * adds a scope. The two are reported separately because collapsing them is
 * what produced both circulating numbers.
 */
export function preferenceProhibitionCounts(): {
  readonly bare: number
  readonly qualified: number
  readonly columnsBareThroughout: readonly PreferenceColumn[]
  readonly columnsProhibitedThroughout: readonly PreferenceColumn[]
} {
  const isBare = (cell: string) => cell === 'Explicitly prohibited'
  const prohibits = (cell: string) => cell.startsWith('Explicitly prohibited')
  let bare = 0
  let qualified = 0
  for (const row of PREFERENCE_MATRIX) {
    for (const column of PREFERENCE_COLUMNS) {
      const cell = row.cells[column]
      if (isBare(cell)) bare += 1
      else if (prohibits(cell)) qualified += 1
    }
  }
  return {
    bare,
    qualified,
    columnsBareThroughout: PREFERENCE_COLUMNS.filter((c) =>
      PREFERENCE_MATRIX.every((r) => isBare(r.cells[c])),
    ),
    columnsProhibitedThroughout: PREFERENCE_COLUMNS.filter((c) =>
      PREFERENCE_MATRIX.every((r) => prohibits(r.cells[c])),
    ),
  }
}

/**
 * Which preference-matrix row a tenant viewer occupies. Two of the four rows
 * are reachable: the Tenant Admin sits on its own row (L73709) and the other
 * four roles are individual users (L73710). The platform floor is not a
 * viewer and the digest-sections row is not a party at all.
 */
export function preferenceLevelFor(role: TenantRoleId): PreferenceLevel {
  return role === 'TENANT_ADMIN' ? 'Tenant Admin policy' : 'Individual user'
}

export function preferenceRow(level: PreferenceLevel): PreferenceMatrixRow {
  const row = PREFERENCE_MATRIX.find((r) => r.level === level)
  if (!row) throw new Error(`MOD-DOH-10: no 30C.10 preference row for level "${level}".`)
  return row
}

/* ==================================================================== *
 * 4. THE THREE GROUPS SB-PREF-01 DRAWS, AND THE TWO KEY SPACES THEY ARE
 *    ENUMERATED IN.
 * ==================================================================== */

/**
 * L73702: "The preferences screen renders three groups: Always sent, locked,
 * with the explanation 'These are required for safety, compliance, or your
 * organisation's account'; Protected, locked for disabling with email
 * frequency options only; and Configurable, with an email toggle per
 * category. Every locked control states its reason inline rather than showing
 * a disabled control with no explanation."
 *
 * The flowchart at L73690-L73696 gives the gate ORDER, and the order settles
 * a double-membership the prose creates: mandatory families first, then the
 * non-disableable set, then the in-app channel.
 *
 * THE MEMBERSHIP IS ENUMERATED IN CHAPTER 30C.2's KEY SPACE, and the proof is
 * the section's own illustrative example: L73704 calls `NOTIF-059` "the
 * containment-checklist-incomplete alert", which is what Ch30C.2 row L73043
 * names it. In Chapter 27.7's register `NOTIF-059` does not exist at all —
 * that register stops at `NOTIF-025`. So this whole section reads in Ch30C.2
 * identifiers and every key below is built with `notificationKey`.
 *
 * ALWAYS SENT — the three mandatory families of L51603, resolved into
 * Ch30C.2 rows. Twelve: `NOTIF-001`-`NOTIF-004` are the subscription and
 * tier lifecycle, `NOTIF-005`-`NOTIF-008` the allocation ladder at 80, 100
 * and 125 per cent plus burst-band entry, and `NOTIF-020`-`NOTIF-023` the
 * qualification expiry at 14, 7, 1 and 0 days. All twelve read `Yes` in
 * Ch30C.2's own Mandatory column, which `doh10AlwaysSentAllMandatory`
 * measures rather than assumes.
 *
 * PROTECTED — L73676's enumeration, MINUS the four the mandatory gate takes
 * first. L73676 opens "Beyond the three mandatory families" and then its own
 * range `NOTIF-020` through `NOTIF-031` includes `NOTIF-020`-`NOTIF-023`,
 * which ARE one of those three families. The enumeration contradicts its own
 * opening clause on four identifiers; the flowchart's gate order resolves
 * which group draws them, and neither reading is discarded — see
 * `DOH_10_FINDINGS`. So 38 identifiers at L73676, 34 in the Protected group.
 *
 * CONFIGURABLE — L73676's "Every other category remains configurable". 41.
 * 12 + 34 + 41 = 87, which is the whole catalogue, and the partition is
 * checked in `doh10GroupPartition` rather than trusted to this comment.
 */
export type PreferenceGroupId = 'always-sent' | 'protected' | 'configurable'

const range = (from: number, to: number): readonly string[] => {
  const out: string[] = []
  for (let n = from; n <= to; n += 1) out.push(`NOTIF-${String(n).padStart(3, '0')}`)
  return out
}

/**
 * L73676's enumeration, transcribed as the source writes it — four ranges and
 * seven singletons. Kept as the source's own list rather than the group
 * membership, because the difference between the two IS the finding.
 */
export const L73676_NON_DISABLEABLE_SET = [
  ...range(9, 12),
  ...range(20, 31),
  'NOTIF-032',
  'NOTIF-035',
  'NOTIF-046',
  'NOTIF-048',
  'NOTIF-049',
  'NOTIF-051',
  ...range(54, 62),
  'NOTIF-071',
  'NOTIF-073',
  'NOTIF-074',
  ...range(83, 86),
] as const satisfies readonly string[]

/**
 * The three mandatory families of L51603 in Ch30C.2's identifiers.
 *
 * Both enumerations above carry `as const satisfies` and NOT a leading
 * `readonly string[]` annotation, which is not a style choice: a leading
 * array-type annotation widens the const regardless of what follows it, and
 * `tests/coverage/slice-2c-gates.test.ts` refuses the form for exported
 * closed vocabularies. It caught both of these.
 */
export const MANDATORY_FAMILY_CATEGORIES = [
  ...range(1, 8),
  ...range(20, 23),
] as const satisfies readonly string[]

type Ch30C2Id = (typeof CH_30C_2_CATEGORIES)[number]['id']

const isCh30C2Id = (id: string): id is Ch30C2Id =>
  CH_30C_2_CATEGORIES.some((r) => r.id === id)

/**
 * The keyed group of one category, by the flowchart's gate order. Returns a
 * branded `NotificationKey`, so no caller downstream can hold a bare
 * `NOTIF-*` literal — the collision `@/registry/signals` closed stays closed
 * through this module. Throws on an identifier Ch30C.2 does not hold, which
 * is how a mistranscription of L73676 fails loudly.
 */
export interface PreferenceCategory {
  readonly key: NotificationKey
  readonly id: Ch30C2Id
  readonly name: string
  readonly group: PreferenceGroupId
  readonly family: number
  /** Ch30C.2's Mandatory cell, verbatim. Prose, never a boolean. */
  readonly mandatory: string
  /**
   * Ch30C.2's Severity cell. `Recommendation — R&D` under DEC-NOTIFSEV-001
   * and never renderable as a source-backed value — see
   * `PREFERENCE_SEVERITY_LABEL`.
   */
  readonly recommendedSeverity: string
  readonly sourceLine: number
}

function groupOf(id: string): PreferenceGroupId {
  if (MANDATORY_FAMILY_CATEGORIES.includes(id)) return 'always-sent'
  if (L73676_NON_DISABLEABLE_SET.includes(id)) return 'protected'
  return 'configurable'
}

export const PREFERENCE_CATEGORIES: readonly PreferenceCategory[] = CH_30C_2_CATEGORIES.map(
  (row) => ({
    key: notificationKey('ch-30c.2-categories', row.id),
    id: row.id,
    name: row.name,
    group: groupOf(row.id),
    family: row.family,
    mandatory: row.mandatory,
    recommendedSeverity: row.recommendedSeverity,
    sourceLine: row.sourceLine,
  }),
)

export function categoriesInGroup(group: PreferenceGroupId): readonly PreferenceCategory[] {
  return PREFERENCE_CATEGORIES.filter((c) => c.group === group)
}

/**
 * The partition, measured. Every one of the eighty-seven is in exactly one
 * group and the three sizes sum to the whole catalogue — asserted over the
 * registry rather than over this module's own constants, so a group that
 * shrank with its own check cannot pass.
 */
export function doh10GroupPartition(): {
  readonly alwaysSent: number
  readonly protectedGroup: number
  readonly configurable: number
  readonly total: number
} {
  return {
    alwaysSent: categoriesInGroup('always-sent').length,
    protectedGroup: categoriesInGroup('protected').length,
    configurable: categoriesInGroup('configurable').length,
    total: PREFERENCE_CATEGORIES.length,
  }
}

/** Always-sent rows whose Ch30C.2 Mandatory cell does NOT open with `Yes`. */
export function doh10AlwaysSentNotMandatory(): readonly string[] {
  return categoriesInGroup('always-sent')
    .filter((c) => !c.mandatory.startsWith('Yes'))
    .map((c) => `${c.id} L${c.sourceLine} [${c.mandatory}]`)
}

/** The four identifiers L73676 claims that its own opening clause excludes. */
export function doh10DoubleClaimedCategories(): readonly string[] {
  return L73676_NON_DISABLEABLE_SET.filter((id) => MANDATORY_FAMILY_CATEGORIES.includes(id))
}

/** Any identifier in either enumeration that Ch30C.2 does not hold. */
export function doh10UnknownEnumeratedIds(): readonly string[] {
  return [...L73676_NON_DISABLEABLE_SET, ...MANDATORY_FAMILY_CATEGORIES].filter(
    (id) => !isCh30C2Id(id),
  )
}

/**
 * WHAT MUST TRAVEL WITH ANY SEVERITY THIS SCREEN PRINTS. `DEC-NOTIFSEV-001`
 * puts the four levels, the three priority levels and the whole assignment
 * table in `Recommendation — R&D` (L73186 is the classification line the
 * decision record cites), so a bare "Critical" on a preferences screen would
 * read as a source-backed value. The label is a constant rather than a habit
 * because the screen prints the severity beside every locked category.
 */
export const PREFERENCE_SEVERITY_LABEL = {
  classification: 'Recommendation — R&D',
  decision: 'DEC-NOTIFSEV-001',
  /** The classification sentence itself, whole: L73186. */
  classifiedAt: 'L73186',
  note:
    'The four severity levels and their assignment to categories are a proposal, not a Statement of Work fact. Nothing on this screen presents a notification severity as source-backed, and the one condition the preference matrix attaches to the email control — "not for Critical categories" — selects by a value this decision has not settled.',
} as const

/**
 * The categories the matrix's email condition would withhold a toggle from —
 * "not for Critical categories" (L73709, L73710) — inside the group the
 * toggle renders for. MEASURED AND EMPTY: all eight Critical categories in
 * the catalogue are in the Protected group, which is locked anyway, so the
 * condition currently selects nothing at all. It is still rendered, because
 * DEC-NOTIFSEV-001 could ratify a different assignment and this set would
 * stop being empty without a line of this file changing.
 */
export function doh10CriticalConfigurableCategories(): readonly PreferenceCategory[] {
  return categoriesInGroup('configurable').filter((c) => c.recommendedSeverity === 'Critical')
}

/* ==================================================================== *
 * 5. FINDINGS — rendered on screen, not kept in a comment.
 * ==================================================================== */

export interface Doh10Finding {
  readonly id: string
  readonly grade: 'C1' | 'C2' | 'C3'
  readonly title: string
  readonly what: string
  readonly why: string
  readonly sourceRef: string
}

export const DOH_10_FINDINGS = [
  {
    id: 'categorical-to-absent-inverts-the-preferences-screen',
    grade: 'C1',
    title: 'The ABSENT rule applied to the preference matrix deletes the two groups the storyboard draws',
    what:
      'The 30C.10 matrix reads a prohibition in every cell of two of its five columns — May disable a mandatory family and May disable a protected category — while SB-PREF-01 requires the categories those columns cover to be VISIBLE AND LOCKED WITH AN INLINE REASON. Eleven of the twenty cells are a bare `Explicitly prohibited` and a twelfth is the qualified "Explicitly prohibited for mandatory content".',
    why:
      'The categorical-prohibition rule this build inherited sends `Explicitly prohibited` to ABSENT — nothing drawn. Applied here it deletes the Always-sent and Protected groups and leaves a preferences screen showing only what can be switched off, which tells a Tenant Admin that the protected set does not exist. That is the false claim the ABSENT rule exists to prevent, pointed the other way. So those cells render through `LockedControl`: visible, inoperable, reason inline. The correction to the count does not weaken this — one column alone still deletes a whole group.',
    sourceRef: 'L73706-L73711 (the matrix); L73702 (SB-PREF-01); L73681 (the workflow’s own "rendered as locked"); L73719 (AC-30C-1003)',
  },
  {
    id: 'read-only-on-a-write-act',
    grade: 'C1',
    title: '`Read-only` lands on a write, on a card with no read row for it to mean anything else',
    what:
      'L28699 gives the Read-only Auditor `Read-only` on "Acknowledge a notification". Every one of the twelve acts on this card is a write — Set, Set, Disable, Mute, Mute, Mute, Set, Add, Configure, Configure, Acknowledge, Change — so there is no row on which the token could carry its STATE-06 sense of a rendered object with its inputs disabled.',
    why:
      'STATE-06 reads as disabled by the object’s state: not right now. Acknowledgement is withheld from this role always, and the source says so outside this card — AC-AUTH-003 (L10426) and AC-DOH-011-2 (L25695). So `Doh10Affordance` has no `read-only` arm and the cell renders as no control with the permanent cause named. A disabled control here would be a promise that something exists and is currently out of reach.',
    sourceRef: 'L28699, L28689-L28700, L10426, L25695',
  },
  {
    id: 'readonly-auditor-holds-two-writes',
    grade: 'C1',
    title: 'Two cells grant the Read-only Auditor a write that two acceptance criteria refuse',
    what:
      'Rows 2 (L28690) and 5 (L28693) give the Read-only Auditor `Allowed` on setting its own channel preferences and muting a digest section. Both are writes. AC-AUTH-003 (L10426) says the role "holds no write capability anywhere"; AC-DOH-011-2 (L25695) says a Read-only Auditor session "renders no write control anywhere in the Hub". Neither brief names this, and it is the opposite shape from the trap above: there the token withholds, here it grants.',
    why:
      'Both readings stand and this build settles neither. What it will not do is render a live write control for a role two acceptance criteria say writes nothing, because that ships a failure of a named test rather than a disclosure. So the preference controls render LOCKED for this role with the two criteria named inline and the matrix cell quoted beside them — a client-delegated choice under APP-012, not a claim the source settled it. The source mints no decision identifier for the conflict and none is minted here; the canon is not this module’s to add to. See the report.',
    sourceRef: 'L28690, L28693, L10426, L25695',
  },
  {
    id: 'permissive-cells-against-a-single-role-screen',
    grade: 'C2',
    title: 'Rows grant acts to roles whose catalogue-B screen admits one of them',
    what:
      'Two of the twelve rows are `Allowed` in all five columns (L28690, L28693) and a third holds three grants, a `Read-only` and a conditional grant (L28699). Catalogue B’s row for this module admits the Tenant Admin alone (L48113). Catalogue A’s row for the same module (L26070) reads "Notification policy and preferences" with a primary role of "Tenant Admin sets policy; each user sets preferences".',
    why:
      'The screen is not widened and the cells are not narrowed. The source draws one module in two halves and each catalogue records one half; both render here with the catalogue each role list comes from named. The rows are partitioned nine policy, two preference, one acknowledgement, and `doh10UnpartitionedRows` proves no row falls outside the partition. Catalogue A’s identifier is the banned three-digit form and is named by locator and name only.',
    sourceRef: 'L28690, L28693, L28699, L48113, L26070',
  },
  {
    id: 'worker-holds-two-acts-with-no-screen-anywhere',
    grade: 'C2',
    title: 'The Worker is granted two preference acts and the source names no screen for either',
    what:
      'Rows 2 and 5 grant the Worker `Allowed`. The Worker holds no Delivery Operations Hub route (D11), and the two views the source names for these acts are both Hub screens — the notification policy-and-preferences screen (L48113, L26070) and the per-shift digest view, whose storyboard SB-015-03 names "per-section mute controls and no service-level mute" on the Hub (L68775). The Frontline inbox storyboard, SB-021-03 at L69696, draws no preference control.',
    why:
      'Row 11 is the contrast that makes this a finding rather than an oversight: there the Worker’s cell IS met somewhere the source names, because the module "feeds the Frontline inbox" (L28681) and acknowledgement is written by "any channel" (L28710). So a per-cell pointer distinguishes an act met elsewhere from an act met nowhere, and the second draws no link at all. A routing pointer reads as a verified fact, and there is nothing here to verify it against.',
    sourceRef: 'L28690, L28693, L28699, L28681, L28710, L68775, L69696, L48113, L26070',
  },
  {
    id: 'row-surface-token-cannot-answer-per-cell',
    grade: 'C2',
    title: '`MatrixRowSurface` is per row and rows 2, 5 and 11 need three answers in one row',
    what:
      'Row 11 is met on this screen for three roles, on `SURF-FL` for the Worker, and refused to the Read-only Auditor. Rows 2 and 5 are met here for four roles and nowhere for the Worker. The shared token classifies the ROW.',
    why:
      '`surface` stays `screen`, which is correct for the four Hub roles and is what `rolesReachingByMatrix` reads; the per-cell answer lives in `metByRole`. Classifying the rows `another-surface` would withhold them from the reach rule and delete this module’s only permissive rows from its own reach. This is a fifth reading of the row-token’s inadequacy and belongs beside the three already recorded in `MATRIX_ROW_SURFACE_DIVERGENCES`, which this task does not own.',
    sourceRef: 'L28690, L28693, L28699',
  },
  {
    id: 'l73676-contradicts-its-own-opening-clause',
    grade: 'C3',
    title: 'The non-disableable set enumerates four identifiers its own first clause excludes',
    what:
      'L73676 opens "Beyond the three mandatory families, the following must not be silently disabled" and then enumerates `NOTIF-020` through `NOTIF-031`. In Ch30C.2 `NOTIF-020` to `NOTIF-023` are the qualification expiry warnings at 14, 7, 1 and 0 days (L72984-L72987) — which L51603 names as one of the three mandatory families. Thirty-eight identifiers are enumerated; four of them are members of the set the clause excludes.',
    why:
      'The flowchart resolves which group draws them without either side being discarded: gate 1 asks the mandatory families (L73690) and gate 2 the non-disableable set (L73692), so the four are Always sent and the Protected group holds thirty-four. Both memberships are recorded — `L73676_NON_DISABLEABLE_SET` keeps the source’s own thirty-eight and `doh10DoubleClaimedCategories` names the four. Rendering the four twice would show a reader the same category locked for two different reasons two panels apart.',
    sourceRef: 'L73676, L73690, L73692, L51603, L72984, L72987',
  },
  {
    id: 'the-critical-condition-selects-nothing',
    grade: 'C3',
    title: 'The email control’s only condition selects no category, and it selects by a recommendation',
    what:
      'L73709 and L73710 allow reducing email "with conditions — not for Critical categories". MEASURED over the catalogue: all eight categories with a recommended severity of Critical are in the Protected group, which is locked regardless, so the condition withholds a toggle from nothing. And "Critical" is assigned by the severity model DEC-NOTIFSEV-001 classifies `Recommendation — R&D`.',
    why:
      'A condition that currently selects nothing still renders, because it is the matrix’s own cell and because a ratified severity assignment would make it bite without any code changing. What must never happen is the screen presenting the selection as source-backed: the label travels with every severity printed. `doh10CriticalConfigurableCategories` measures the set rather than asserting it is empty.',
    sourceRef: 'L73709, L73710, DEC-NOTIFSEV-001',
  },
  {
    id: 'digest-category-contradicts-full-configurability',
    grade: 'C3',
    title: 'One configurable category’s own Mandatory cell says part of it cannot be muted',
    what:
      '`NOTIF-087`, the per-shift digest (L73096), falls in the Configurable group by L73676’s "Every other category remains configurable", and its own Mandatory cell reads "No, but sections carrying mandatory content cannot be muted". The preference matrix’s fourth row is about exactly this — the Digest sections row (L73711), whose mandatory-family cell is the qualified "Explicitly prohibited for mandatory content".',
    why:
      'The digest is the one category whose configurability is partial at the level below the category, and this card’s rows 5 and 6 are the two halves of it: a section is a preference and the service is not (L28693, L28694). The category renders in the Configurable group with its own cell quoted, so a reader is not told the whole digest is optional.',
    sourceRef: 'L73096, L73711, L28693, L28694',
  },
] as const satisfies readonly Doh10Finding[]

/* ==================================================================== *
 * 6. WHAT THE SOURCE DOES NOT SAY.
 * ==================================================================== */

export const UNSPECIFIED_IN_SOURCE = [
  {
    id: 'no-tenant-state-clause-on-eleven-of-twelve-rows',
    question:
      'Do the suspension states gate the other eleven acts as they gate setting the policy?',
    what:
      'L28689 says the policy edit is "blocked in every suspension state as a configuration edit". No other row of L28689-L28700 carries any tenant-state clause, and the card’s Preconditions (L28675) name none either.',
    treatment:
      'The gate is applied to row 1 alone, read off `edit-configuration` in `@/surfaces/doh/tenant-state` rather than re-derived. Whether a personal channel preference is a "configuration edit" in L26919’s sense is precisely what is unstated, and it is recorded rather than decided.',
    sourceRef: 'L28689, L28675, L26919',
  },
  {
    id: 'bare-prohibitions-on-rows-1-and-7',
    question:
      'Why are the four non-admin roles prohibited from setting the policy and the digest delivery times?',
    what:
      'L28689 and L28695 state the bare token for the Supervisor, Quality Manager, Read-only Auditor and Worker and qualify it nowhere. Ten of the twelve rows do carry a cause the source states somewhere — the baseline floor at L28682 and L28706, in-app unmutability at L28682, sections-not-services at L73672, out of V1 at L51601, the platform-set interval at L28700 — and these two do not.',
    treatment:
      'Those eight cells carry the shared bare-prohibition wording from `@/surfaces/doh/modules` and invent no per-role reason. A cause written here would read back as the source’s.',
    sourceRef: 'L28689, L28695',
  },
  {
    id: 'no-screen-for-the-worker-preference-grants',
    question: 'Where does a Worker set its own channel preferences or mute a digest section?',
    what:
      'Rows 2 and 5 grant it. The Hub admits no Worker (D11). The two views the source names for these acts are Hub screens (L48113, L26070, L68775), and the Frontline inbox storyboard at L69696 draws no preference control.',
    treatment:
      'The grant is stated, no screen is invented and no surface is pointed at. `DOH_10_UNSCREENED_GRANTS` measures the two cells so the absence is a number rather than a paragraph.',
    sourceRef: 'L28690, L28693, L68775, L69696, L48113, L26070',
  },
  {
    id: 'discarded-preference-notification',
    question:
      'What does the screen do when a policy change would discard a preference already set?',
    what:
      'L73685 commits a preference change with its audit event and L73686 says a preference that a later policy change would turn into a disabled protected category "is discarded and the user is notified of the discard"; AC-30C-1004 (L73720) requires the notification to carry the reason.',
    treatment:
      'Not built. This storyboard has no policy-change-over-time fixture and simulating one would require inventing the sequence. The obligation is recorded and the screen states plainly that the discard path is not drawn here rather than implying preferences are permanent.',
    sourceRef: 'L73685, L73686, L73720',
  },
] as const
