import { Banner, Button, type StatusTone } from '@/ui/primitives'
import type { TenantState } from '@/surfaces/doh/tenant-state'
import type { SaAccessClassId } from '@/surfaces/sa/access-classes'

/**
 * S3: the closed set of three banner classes at V1 — suspension, support
 * session (with End-session), platform announcement — "and nothing more".
 *
 * The support-session variant reuses `SaAccessClassId` (`@/surfaces/sa/
 * access-classes`) rather than inventing a second three-member vocabulary:
 * the platform-side access class that opened the session IS one of those
 * three, and D13 turns on which one. It is a discriminated union, not a
 * boolean flag, so a caller literally cannot construct a
 * `compliance-emergency-path` banner carrying an `onEndSession` handler —
 * TypeScript rejects the literal, the same proof shape `ProhibitionNotice`
 * already uses for its own closed union.
 */
export interface SuspensionBanner {
  readonly kind: 'suspension'
  readonly tenantState: Exclude<TenantState, 'active'>
  readonly heading: string
  readonly message: string
}

export type SupportSessionBanner =
  | {
      readonly kind: 'support-session'
      readonly accessClass: 'normal-support-session'
      readonly message: string
      /** D12: any signed-in tenant web user may end THIS class only. */
      readonly onEndSession: () => void
      /**
       * A reason the control cannot act RIGHT NOW, computed by the caller and
       * HANDED IN. Present renders the control disabled carrying this text;
       * absent renders it live.
       *
       * THIS COMPONENT STILL HOLDS NO POLICY, and could not: a string is not a
       * decision. It does not know the tenant state, it does not know which
       * write class ending a session belongs to, and it cannot ask.
       * `app/hub/HubShell.tsx` computes it — that file is in `app/`, it already
       * holds the tenant state, it already assembles these banners, and every
       * Hub route wraps it, so one computation gates the control on all of them.
       *
       * Without this the control was live and UNGATED on every route that did
       * not own the session: a tenant could end, from another module's screen,
       * the very session the owning route was refusing with a named reason.
       * The banner is chrome on nine routes and the gate is one; a per-screen
       * prop would have taxed all nine to fix one.
       */
      readonly endSessionDisabledReason?: string
    }
  | {
      readonly kind: 'support-session'
      /**
       * D13: the compliance-emergency path and the JBS access grant carry
       * no End-session control — "an emergency access the tenant could
       * terminate would not be an emergency access". The type has no
       * `onEndSession` field on this arm at all, so there is nothing to
       * omit and nothing to disable: the control is ABSENT.
       */
      readonly accessClass: Exclude<SaAccessClassId, 'normal-support-session'>
      readonly message: string
    }

export interface AnnouncementBanner {
  readonly kind: 'announcement'
  /** L45684: the announcement banner cannot be muted by any tenant user — no
   *  dismiss control exists on this variant, by construction. */
  readonly message: string
}

export type HubBanner = SuspensionBanner | SupportSessionBanner | AnnouncementBanner

export interface BannerRegionProps {
  readonly banners: readonly HubBanner[]
}

const HEADING: Record<HubBanner['kind'], string> = {
  suspension: 'Tenant suspended',
  'support-session': 'Platform access in progress',
  announcement: 'Platform announcement',
}

const TONE: Record<HubBanner['kind'], StatusTone> = {
  suspension: 'blocked',
  'support-session': 'attention',
  announcement: 'info',
}

/**
 * The End-session control, or nothing. Drawn by the arm the banner is on and
 * by the reason it was handed — never by anything this file worked out.
 */
function endSessionAction(banner: SupportSessionBanner) {
  if (banner.accessClass !== 'normal-support-session') return undefined
  if (banner.endSessionDisabledReason !== undefined) {
    return <Button disabledReason={banner.endSessionDisabledReason}>End session</Button>
  }
  return (
    <Button variant="secondary" onClick={banner.onEndSession}>
      End session
    </Button>
  )
}

export function BannerRegion({ banners }: BannerRegionProps) {
  if (banners.length === 0) return null

  return (
    <div className="space-y-3">
      {banners.map((banner, index) => {
        switch (banner.kind) {
          case 'suspension':
            return (
              <Banner
                key={index}
                tone={TONE.suspension}
                heading={banner.heading}
                body={banner.message}
              />
            )

          case 'support-session':
            return (
              <Banner
                key={index}
                tone={TONE['support-session']}
                heading={HEADING['support-session']}
                body={banner.message}
                action={endSessionAction(banner)}
              />
            )

          case 'announcement':
            return (
              <Banner
                key={index}
                tone={TONE.announcement}
                heading={HEADING.announcement}
                body={banner.message}
              />
            )

          default: {
            const exhaustive: never = banner
            throw new Error(`Unhandled Hub banner: ${JSON.stringify(exhaustive)}`)
          }
        }
      })}
    </div>
  )
}
