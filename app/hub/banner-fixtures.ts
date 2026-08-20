import type {
  AnnouncementBanner,
  HubBanner,
  SupportSessionBanner,
  SuspensionBanner,
} from '@/ui/doh/BannerRegion'
import type { SaAccessClassId } from '@/surfaces/sa/access-classes'
import type { TenantState } from '@/surfaces/doh/tenant-state'
import type { RoleId } from '@/domain/roles'

/**
 * The seeded banner fixtures behind the Hub's three-slot banner region.
 *
 * Ruling C1: the shell owns the wiring, and the support-session and
 * announcement banners live here as ONE seeded fixture module so a later
 * task (the tenant view of platform administration, task 10) extends this
 * DATA and never redefines `BannerRegion` — its support-session arm is a
 * discriminated union, and two constructions of one closed union is exactly
 * the drift this file exists to prevent. `supportSessionBanners` below is
 * the only place that union is built.
 *
 * Deterministic: every string is a literal. No clock, no random, no fetch.
 */

/**
 * D18: the tenant-facing wording is "workspace", never "tenant" — the form
 * carried by the hard gate (L23801), which `AC-CMD-007` forbids rewording.
 *
 * One row per non-active tenant state, so the shell LOOKS THE BANNER UP
 * from the state it holds rather than re-deriving a suspension rule with a
 * conditional. The write class each state opens is not restated here: that
 * is `TENANT_WRITE_CLASSES`' single table, and a second prose copy of it
 * would be a second gate to drift.
 */
export const SUSPENSION_BANNERS: Record<Exclude<TenantState, 'active'>, SuspensionBanner> = {
  'soft-suspended': {
    kind: 'suspension',
    tenantState: 'soft-suspended',
    heading: 'This workspace is suspended for billing',
    message:
      'Operations continue in full. New Jobs, Workers, locations, shifts and parts, and every ' +
      'configuration edit, are held until billing is settled. Contact platform support to resolve it.',
  },
  'hard-suspended': {
    kind: 'suspension',
    tenantState: 'hard-suspended',
    heading: 'This workspace is suspended and read-only',
    message:
      'Work already in flight may be completed and closed. Nothing new may be started, and ' +
      'certifications cannot be renewed while the suspension holds. Contact platform support.',
  },
  'compliance-suspended': {
    kind: 'suspension',
    tenantState: 'compliance-suspended',
    heading: 'This workspace is suspended on compliance grounds',
    message:
      'Sign-in is blocked for every user in this workspace while the suspension holds. This ' +
      'storyboard renders the state so a reviewer can read it; in the product no session survives it.',
  },
  archived: {
    kind: 'suspension',
    tenantState: 'archived',
    heading: 'This workspace is closed',
    message:
      'The workspace is archived and holds no open write path. Records remain readable for the ' +
      'retention the platform holds them under.',
  },
}

/**
 * WHO SEES EACH SUSPENSION BANNER. Two adjacent rows of the tenant lifecycle
 * and tier module's permission matrix (L26886-L26888) carry two different
 * answers, and a single rule for both was the defect this table replaces:
 *
 * - Seeing the suspension banner in the soft or hard state is `Allowed` for
 *   the Tenant Admin and `Not applicable` for everyone else, in the source's
 *   own words because no other user sees anything at all in those two
 *   states. Suspension for non-payment is a commercial matter between the
 *   workspace's administrator and the platform; a Supervisor's shift does
 *   not change because of it, and telling them would leak the commercial
 *   relationship to people who hold no part in it.
 * - Seeing the compliance-suspension message is `Allowed` for all five
 *   roles. Sign-in is blocked for everyone in that state, so everyone must
 *   be told why.
 *
 * `archived` is the fourth entry in `SUSPENSION_BANNERS` and NO row of that
 * matrix covers it. Its audience is therefore not derived — it is left as
 * this storyboard already had it, shown to every Hub persona, and recorded
 * as an open question rather than guessed into a rule. Do not read the
 * value below as a source statement.
 */
const EVERY_TENANT_ROLE = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const

const SUSPENSION_BANNER_AUDIENCE = {
  'soft-suspended': ['TENANT_ADMIN'],
  'hard-suspended': ['TENANT_ADMIN'],
  'compliance-suspended': EVERY_TENANT_ROLE,
  archived: EVERY_TENANT_ROLE,
} as const satisfies Record<Exclude<TenantState, 'active'>, readonly RoleId[]>

/**
 * The suspension slot, for one persona. `null` means the slot is empty —
 * either the workspace is not suspended, or this persona is not one the
 * source shows this class of suspension to.
 */
export function suspensionBannerFor(
  tenantState: TenantState,
  role: RoleId,
): SuspensionBanner | null {
  if (tenantState === 'active') return null
  // Widened deliberately: the tables above are `as const`, so a narrow
  // `.includes` would only ever accept the roles already listed and the
  // question would answer itself.
  const audience: readonly RoleId[] = SUSPENSION_BANNER_AUDIENCE[tenantState]
  return audience.includes(role) ? SUSPENSION_BANNERS[tenantState] : null
}

/**
 * The platform-side access sessions this storyboard seeds, one per access
 * class (`ACCESS_CLASSES`). `open` is the seeded state of each — the shell
 * banners the open ones. Extending this array is how task 10 adds the other
 * classes to its own screen without touching a component.
 */
export interface SeededPlatformAccessSession {
  readonly accessClass: SaAccessClassId
  /** D18: "workspace", never "tenant". */
  readonly message: string
  readonly open: boolean
}

// `as const satisfies`, never a leading `: readonly T[]` annotation: the
// annotation widens the const and makes the exhaustiveness check below
// vacuous, which is how a closed vocabulary quietly stops being closed.
export const SEEDED_PLATFORM_ACCESS_SESSIONS = [
  {
    accessClass: 'normal-support-session',
    message:
      'A platform support engineer has a read-only session open on this workspace. Support is ' +
      'read-only without exception, and you can end this session yourself.',
    open: true,
  },
  {
    accessClass: 'compliance-emergency-path',
    message:
      'A dual-authorised compliance-emergency access is open on this workspace. It carries an ' +
      'automatic post-session report, and no control suppresses that report.',
    open: false,
  },
  {
    accessClass: 'jbs-access-grant',
    message:
      'A JBS access grant is open on this workspace. Every touch under it is scoped, time-boxed, ' +
      'reason-linked, audited and mirrored to you.',
    open: false,
  },
] as const satisfies readonly SeededPlatformAccessSession[]

// The doc comment above claims one entry per access class. This is what
// makes the claim true rather than aspirational: it fails to compile if a
// class is added to `SaAccessClassId` and not seeded here.
type MissingFromSeededSessions = Exclude<
  SaAccessClassId,
  (typeof SEEDED_PLATFORM_ACCESS_SESSIONS)[number]['accessClass']
>
const _seededSessionsExhaustive: MissingFromSeededSessions extends never ? true : never = true
void _seededSessionsExhaustive

/** L45684: no tenant user can mute this, so the variant carries no dismiss control. */
export const SEEDED_ANNOUNCEMENTS = [
  {
    kind: 'announcement',
    message:
      'Planned platform maintenance this Saturday, 02:00-04:00 in each workspace timezone. ' +
      'Frontline devices keep working offline throughout.',
  },
] as const satisfies readonly AnnouncementBanner[]

/**
 * The ONE construction of `SupportSessionBanner`'s discriminated union.
 *
 * D12: any signed-in tenant web user may end the normal support session,
 * "because the control belongs to the tenant". D13: the other two classes
 * carry no End-session control at all — the union has no `onEndSession`
 * field on that arm, so the control is ABSENT by construction rather than
 * omitted or disabled here.
 */
export function supportSessionBanners(
  sessions: readonly SeededPlatformAccessSession[],
  onEndSession: () => void,
): readonly SupportSessionBanner[] {
  return sessions.map((session) =>
    session.accessClass === 'normal-support-session'
      ? {
          kind: 'support-session',
          accessClass: 'normal-support-session',
          message: session.message,
          onEndSession,
        }
      : {
          kind: 'support-session',
          accessClass: session.accessClass,
          message: session.message,
        },
  )
}

export interface SeededHubBannerOptions {
  /** Held by the shell; the suspension banner is a lookup on it, never a rule. */
  readonly tenantState: TenantState
  /**
   * The persona the banners are assembled for. The suspension slot splits
   * on it (see `suspensionBannerFor`); the other two slots do not — the tenant
   * view of platform administration's matrix marks seeing the support-session
   * banner and seeing a platform announcement `Allowed` for every Hub role
   * alike (L29198, L29201). This directory names no module id literal, by the
   * build rule: it claims no module.
   */
  readonly role: RoleId
  /** True once the reviewer has pressed End session in this storyboard. */
  readonly supportSessionEnded: boolean
  readonly onEndSession: () => void
}

/**
 * Suspension · support session · announcement — the three slots, in that
 * order, and nothing more (S3).
 */
export function seededHubBanners({
  tenantState,
  role,
  supportSessionEnded,
  onEndSession,
}: SeededHubBannerOptions): readonly HubBanner[] {
  const suspension = suspensionBannerFor(tenantState, role)
  const open = supportSessionEnded
    ? []
    : SEEDED_PLATFORM_ACCESS_SESSIONS.filter((s) => s.open)
  return [
    ...(suspension === null ? [] : [suspension]),
    ...supportSessionBanners(open, onEndSession),
    ...SEEDED_ANNOUNCEMENTS,
  ]
}
