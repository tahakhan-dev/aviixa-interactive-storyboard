import { ConnectivityBanner } from '@/surfaces/cc/modules/cc-02/SyncStateChrome'
import { CC02_TENANT_BANNER_MINUTES } from '@/surfaces/cc/modules/cc-02/chrome'
import { CC01_SITE_ELAPSED_MINUTES } from './board'

/* ==================================================================== *
 * THE SHELL'S CHROME SLOT, FILLED BY THE BOARD THAT OWNS THE DATA.
 *
 * `CommandCenterShell` takes `chrome` as a prop and renders the
 * `sync-state-chrome-host` seam notice when it is absent. `CC_SEAMS` names
 * `MOD-CC-01` as the owner of the missing half, and L36503 splits
 * `MOD-CC-02`'s two contributions along exactly the line this file follows:
 * "Supplies markers to every other module; supplies the banner to the
 * board." The BANNER is site-wide and belongs in the shell's slot; the
 * MARKERS are per-element and belong beside the elements, which is why they
 * render inside `./LiveShiftBoard` and not here.
 *
 * Nothing under `../cc-02/` is edited. `ConnectivityBanner` is that module's
 * own exported component, handed this screen's elapsed time.
 *
 * THE BANNER IS WITHHELD, AND WITHHOLDING IT IS THE RULE RATHER THAN A GAP.
 * `cc02BannerShows` renders nothing for an unknown elapsed time, and L36587
 * is the warrant: unknown is treated as not-lost and "the tenant banner is
 * withheld rather than guessed", because "a false site-wide banner would be
 * its own credibility failure". Neither of this board's storyboards states a
 * site out of contact — `SB-CC-12` (L36383) opens "Live · all devices
 * synced" and the illustrative example at L36391 has one tablet dark, not a
 * site — so passing a minute count here would be this build inventing the
 * one figure the whole section exists to refuse to invent.
 *
 * The statement below therefore renders in place of the banner rather than
 * beside it, so a reviewer meets a stated withholding rather than a blank.
 * ==================================================================== */

export function BoardSyncChrome() {
  return (
    <div data-testid="cc01-board-chrome" className="mt-6">
      <ConnectivityBanner elapsedMinutes={CC01_SITE_ELAPSED_MINUTES} />
      <p
        className="max-w-prose text-sm text-[var(--color-ink-muted)]"
        data-testid="cc01-banner-withheld"
      >
        <span className="font-medium text-[var(--color-ink)]">
          No site-wide connectivity banner is drawn:{' '}
        </span>
        the site&rsquo;s elapsed time out of contact is unknown for this screen, and an unknown
        elapsed time is treated as not-lost. The banner fires at {CC02_TENANT_BANNER_MINUTES}{' '}
        minutes and is withheld rather than guessed below that, because a false site-wide banner
        would be its own credibility failure. Every element below still carries its own marker,
        which is the per-device truth this screen does hold.
      </p>
    </div>
  )
}
