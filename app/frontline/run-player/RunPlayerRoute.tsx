import type { ReactNode } from 'react'
import {
  FL_PLAYER_VIEWS,
  FL_OVERLAY_ON_ANY_DESTINATION,
  type FrontlinePlayerView,
} from '@/frontline/screens'
import type { FrontlineModuleId } from '@/frontline/fallbacks'

/**
 * THE SHARED RUN PLAYER ROUTE. SIX MODULES MOUNT INTO THIS ONE FILE, AND
 * THAT IS THE WHOLE REASON IT EXISTS AS A SPINE TASK'S WORK RATHER THAN A
 * MODULE'S.
 *
 * §25.5 gives this destination six of the twelve modules (L48531), which the
 * shell renders from the register's own column. Six agents each creating
 * `app/frontline/run-player/` is a path collision, and this build has
 * recorded that collision happening three times already. So the route
 * directory is created once, here, and the six modules own only their own
 * directories under `src/frontline/`: each one exports a panel and registers
 * it, and none of them edits this file's layout.
 *
 * NO MODULE IDENTIFIER IS SPELLED IN THIS FILE, AND THAT IS NOT STYLE.
 * `scripts/build-registries.mjs` awards a route to whichever module its own
 * files name most often and REFUSES OUTRIGHT on a tie — "A route must either
 * name its own module more often than any it cross-references, or be claimed
 * by a slug declaration." A route hosting six modules cannot win that
 * argmax honestly, and naming one of the six more often than the others to
 * satisfy it would be manufacturing the evidence. So the six are named from
 * data, and the route claims no module until one declares a slug for it.
 *
 * WHY THE PLAYER'S STATES ARE PANELS AND NOT ROUTES. `AC-FL-010-2` (L40046):
 * "Capture, coaching, deviation, handover, and sign-off are implemented as
 * states of the Run Player and are not reachable as independent
 * destinations." `TEST-FL-010-2` (L40056) is the test that says so, and
 * `AC-FL-010-1` (L40045) is what a seventh route would break. Every one of
 * §22.7's Run Player rows is a state of THIS route.
 *
 * THE SLOT IS A LIST, NOT A ROUTER. There is no path segment, no query
 * parameter and no `<Link>` into a panel — nothing here can be deep-linked,
 * because a panel that could be addressed would be a destination wearing a
 * different word.
 */

export interface RunPlayerPanel {
  /** The mounting module. One panel may not claim another module's id. */
  readonly module: FrontlineModuleId
  /** The panel's own heading. Rendered at level 3, under the route's level 2. */
  readonly heading: string
  /** Which §22.7 rows this panel is the state of. Names, never route keys. */
  readonly rendersViews: readonly string[]
  readonly body: ReactNode
}

/**
 * The states this route is responsible for, taken from §22.7's own
 * Destination column rather than from a list anyone maintains. Thirteen of
 * the seventeen non-destination rows say "Run Player"; the other four are
 * the notifications inbox, the Training Library viewer, Profile-lite and the
 * full-screen suspension interrupt, which belong to other destinations.
 */
export const RUN_PLAYER_VIEWS: readonly FrontlinePlayerView[] = FL_PLAYER_VIEWS.filter(
  (v) => v.placement === 'run-player',
)

/**
 * The one row whose Destination column reads "Overlay on any destination" —
 * the second-identity step-up sheet. It is not this route's state and not
 * any route: an overlay opens over whichever destination the worker is
 * standing on. It is named here because the Run Player is where a sign-off
 * invokes it and a reader needs to know it is not a panel.
 */
export const OVERLAY_ON_ANY_DESTINATION = FL_OVERLAY_ON_ANY_DESTINATION

export function RunPlayerRoute({
  panels = [],
}: {
  readonly panels?: readonly RunPlayerPanel[]
}) {
  return (
    <div className="space-y-6">
      <section aria-label="States of this route">
        <h2 className="text-lg font-semibold">
          Everything below happens here, as a change of state
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The worker enters a ready run and stays. Capture, coaching, deviation handling,
          handover and sign-off are states of this one screen, not places to navigate to,
          and none of them has an address a link could reach. {RUN_PLAYER_VIEWS.length}{' '}
          states are recorded against this route in the source&rsquo;s twenty-three-row
          register.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {RUN_PLAYER_VIEWS.map((v) => (
            <li key={v.sourceRef} data-testid="fl-player-view">
              <span className="text-[var(--color-ink)]">{v.name}</span>{' '}
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                [{v.sourceRef}]
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {OVERLAY_ON_ANY_DESTINATION.name} is not one of them. Its own Destination column
          reads &ldquo;{OVERLAY_ON_ANY_DESTINATION.destinationColumn}&rdquo;, so it opens
          over whichever destination the worker is standing on rather than belonging to
          this route.{' '}
          <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
            [{OVERLAY_ON_ANY_DESTINATION.sourceRef}]
          </span>
        </p>
      </section>

      {panels.length === 0 ? (
        <p
          data-testid="fl-run-player-no-panels"
          className="max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          No panel is mounted yet. This wave built the route and the slot the six modules
          mount into; the panels themselves are later waves of this slice.
        </p>
      ) : (
        panels.map((p) => (
          <section key={p.module} aria-label={p.heading} data-testid={`fl-panel-${p.module}`}>
            <h3 className="text-base font-semibold">{p.heading}</h3>
            <div className="mt-2">{p.body}</div>
          </section>
        ))
      )}
    </div>
  )
}
