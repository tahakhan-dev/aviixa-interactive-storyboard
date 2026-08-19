import type {
  AnnouncementBanner,
  HubBanner,
  SupportSessionBanner,
  SuspensionBanner,
} from '@/ui/doh/BannerRegion'
import type { SaAccessClassId } from '@/surfaces/sa/access-classes'
import type { TenantState } from '@/surfaces/doh/tenant-state'

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

export const SEEDED_PLATFORM_ACCESS_SESSIONS: readonly SeededPlatformAccessSession[] = [
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
]

/** L45684: no tenant user can mute this, so the variant carries no dismiss control. */
export const SEEDED_ANNOUNCEMENTS: readonly AnnouncementBanner[] = [
  {
    kind: 'announcement',
    message:
      'Planned platform maintenance this Saturday, 02:00-04:00 in each workspace timezone. ' +
      'Frontline devices keep working offline throughout.',
  },
]

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
  supportSessionEnded,
  onEndSession,
}: SeededHubBannerOptions): readonly HubBanner[] {
  const suspension = tenantState === 'active' ? [] : [SUSPENSION_BANNERS[tenantState]]
  const open = supportSessionEnded
    ? []
    : SEEDED_PLATFORM_ACCESS_SESSIONS.filter((s) => s.open)
  return [...suspension, ...supportSessionBanners(open, onEndSession), ...SEEDED_ANNOUNCEMENTS]
}
