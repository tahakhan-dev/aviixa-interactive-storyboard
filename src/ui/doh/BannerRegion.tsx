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
                action={
                  banner.accessClass === 'normal-support-session' ? (
                    <Button variant="secondary" onClick={banner.onEndSession}>
                      End session
                    </Button>
                  ) : undefined
                }
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
