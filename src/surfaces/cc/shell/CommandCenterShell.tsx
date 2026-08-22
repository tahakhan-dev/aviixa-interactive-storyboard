import type { ReactNode } from 'react'
import Link from 'next/link'
import { surfaceById } from '@/domain/surfaces'
import { PrototypeDisclosure } from '@/ui/sa/PrototypeDisclosure'
import { CC_NAV, ccPathname, type CcNavEntry, type CcScreen } from '@/surfaces/cc/screens'
import { ccSeam, ccSeamStatus, type CcSeamId } from '@/surfaces/cc/seams'

const SURFACE = surfaceById('SURF-CC')

/* ==================================================================== *
 * THE `SURF-CC` SHELL — the frame every Command Center screen mounts
 * inside, and the one place this surface's navigation is drawn.
 *
 * IT IS A SERVER COMPONENT AND MUST STAY ONE. `src/surfaces/cc/screens.ts`
 * records why in its own words: four Run Player panels shipped
 * `data-testid="fl-panel-undefined"` in the built HTML while every component
 * test passed, because a `'use client'` module's exports are replaced with
 * client references and a component suite never crosses that boundary. This
 * shell reads `CC_NAV` — plain server data — so a `'use client'` directive
 * here would empty it in the build and in nothing else.
 *
 * WHAT IS BUILT IS A PROP, NOT A DERIVATION, AND THAT IS THE POINT.
 * `CC_NAV` publishes twelve pathnames and one directory exists. A rail that
 * offered all twelve would point eleven links at a 404 — slice 4's defect
 * shape 5, a screen pointing at content that is not there. The shell
 * therefore fails closed on a route it has not been told exists.
 *
 * The set is supplied by the caller under `app/` rather than read from disk
 * here, for the reason `app/studio/StudioShell.tsx` states: the file in
 * `app/` asks every question and hands components finished answers. It also
 * keeps the fail-closed branch non-vacuous. Today every route but one is
 * unbuilt, so "offers no link for an unbuilt route" is satisfied by the
 * absence rather than by the rule — a test that passes on the code and on
 * its own negation, which this build has shipped four times. Driving the set
 * from the caller lets `tests/component/cc-shell.test.tsx` assert both
 * directions over the same tree.
 *
 * ── THE TWO MOUNT POINTS, AND WHY NEITHER RENDERS A MODULE HERE ─────────
 *
 * The dispatch for this task says the shell mounts `MOD-CC-02`'s chrome and
 * `MOD-CC-13`'s action rail. It provides the mount points and renders
 * NEITHER MODULE, and the reason is on the record rather than a preference:
 *
 *  - `CC_SEAMS`'s `sync-state-chrome-host` — slice 8's, not editable here —
 *    names `MOD-CC-01` as the owner of the missing half, and the source
 *    agrees at L36503: the module "supplies markers to every other module;
 *    supplies the banner to the board". The board is `MOD-CC-01`'s. A
 *    freshness marker states a device count, an offline count and an age;
 *    the shell knows none of the three and has no element of its own to
 *    stamp. Mounting it here means inventing all three, which is the
 *    storyboard's illustrative `50` rendered as a value.
 *  - `operational-action-set` names `MOD-CC-13`, which appears in no row of
 *    the thirteen-screen register and is nobody's route.
 *
 * Both seams are OPEN and both are rendered as open, so a reviewer meets a
 * stated absence naming its owner rather than a blank. A screen that HAS the
 * data hands it in through `chrome` or `actionRail` and the seam notice
 * steps aside — no edit to this file, which is what a mount point is for.
 * ==================================================================== */

export interface CommandCenterShellProps {
  /**
   * The register row this route serves. Omitted on the surface index, which
   * serves no screen and owns no module.
   */
  readonly screen?: CcScreen
  /**
   * Which of `CC_NAV`'s route keys have a directory in the tree. Required,
   * never defaulted: a default of `CC_NAV`'s own keys would make the rail
   * offer every route whether or not it exists, and a default of `[]` would
   * hide a route that does exist. Both are answers the shell would be
   * inventing on the caller's behalf.
   */
  readonly builtSlugs: readonly string[]
  /** `MOD-CC-02`'s chrome, supplied by a screen that has marker data. */
  readonly chrome?: ReactNode
  /** `MOD-CC-13`'s action rail, supplied by a screen that mounts it. */
  readonly actionRail?: ReactNode
  readonly children?: ReactNode
}

/**
 * A seam rendered as what it is. `ccSeamStatus` is derived from the owning
 * slice rather than stored, so a closed seam stops rendering this notice by
 * itself when its owner lands — there is no second field to remember.
 */
function SeamNotice({ id }: { readonly id: CcSeamId }) {
  const seam = ccSeam(id)
  if (ccSeamStatus(seam) === 'closed') return null
  return (
    <div
      role="note"
      data-testid={`cc-seam-${seam.id}`}
      className="mt-4 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        Not built here — {seam.consumingModule} needs {seam.owningModule}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">{seam.whatIsMissing}</p>
    </div>
  )
}

/**
 * One rail row. A built route is a link; an unbuilt one is the same row
 * without one, saying which it is. It is listed rather than dropped so that
 * nothing here is mistaken for a screen the register does not carry.
 *
 * The roles column is printed, never applied. The register's own words are
 * what it says — `SCR-CC-10` reads "Supervisor for viewing, Quality Manager
 * for resolution" — and this shell holds no session to test them against.
 * Filtering the rail by a role nobody has chosen would be simulating an
 * access decision; `evaluateCCAccess` in `src/surfaces/cc/access.ts` is
 * where that question is answered, at the door and on a real request.
 */
function RailRow({ entry, built }: { readonly entry: CcNavEntry; readonly built: boolean }) {
  return (
    <li data-testid={`cc-rail-${entry.screen}`}>
      <div className="flex flex-wrap items-baseline gap-2">
        {built ? (
          <Link href={entry.pathname} className="text-[var(--color-primary)] underline">
            {entry.label}
          </Link>
        ) : (
          <span className="text-[var(--color-ink)]">{entry.label}</span>
        )}
        <span className="text-xs text-[var(--color-ink-subtle)]">{entry.screen}</span>
        <span className="text-xs text-[var(--color-ink-subtle)]">
          {entry.owningModule ?? 'no Command Center module owns this route'}
        </span>
      </div>
      {built ? null : (
        <p
          data-testid={`cc-rail-unbuilt-${entry.screen}`}
          className="mt-1 max-w-prose text-sm text-[var(--color-ink-subtle)]"
        >
          <span className="font-medium text-[var(--color-ink)]">No link offered: </span>
          This screen&rsquo;s route key <code>{entry.pathname}</code> is declared on the module
          spine and no directory of that name is built yet. It is listed rather than dropped, so an
          unbuilt screen is not mistaken for one the register does not carry.
        </p>
      )}
    </li>
  )
}

export function CommandCenterShell({
  screen,
  builtSlugs,
  chrome,
  actionRail,
  children,
}: CommandCenterShellProps) {
  // ONE DERIVATION OF A ROUTE'S PATH, and it is `ccPathname` in the spine.
  // Recovering the slug back out of `entry.pathname` here would be a second
  // spelling of the same join, and the two would drift the first time either
  // changed. `builtCount` counts rail entries rather than the caller's list,
  // so a slug the register does not key cannot inflate the number on screen.
  const builtPaths = new Set(builtSlugs.map(ccPathname))
  const builtCount = CC_NAV.filter((e) => builtPaths.has(e.pathname)).length
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        {screen === undefined ? 'AVIIXA' : SURFACE.name}
      </p>

      {screen === undefined ? (
        <div>
          <h1 className="mt-2 text-3xl font-semibold">{SURFACE.name}</h1>
          <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">{SURFACE.purpose}</p>
          <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">What this surface owns: </span>
            {SURFACE.ownership}
          </p>
        </div>
      ) : (
        <div>
          <h1 className="mt-2 text-3xl font-semibold">{screen.name}</h1>
          <p className="mt-3 max-w-prose text-[var(--color-ink-muted)]">{screen.purpose}</p>
          <p
            data-testid="cc-screen-annotation"
            className="mt-2 text-sm text-[var(--color-ink-subtle)]"
          >
            {screen.id} · register row {screen.registerRef} · roles that can open it:{' '}
            {screen.rolesColumn}
          </p>
        </div>
      )}

      {/* THE CHROME MOUNT POINT. `MOD-CC-02`'s elements go here when a screen
          has the marker data they require; until then the seam is what is
          honestly renderable. */}
      <div data-testid="cc-chrome-slot">{chrome ?? <SeamNotice id="sync-state-chrome-host" />}</div>

      <nav aria-label="Command Center screens" className="mt-8">
        <h2 className="text-lg font-semibold">The screens of this surface</h2>
        <p
          data-testid="cc-rail-counts"
          className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {CC_NAV.length} routes are keyed from the screen register and {builtCount} of them are
          built. The register itself carries thirteen screens: the thirteenth route key is the
          sign-in, which reuses the Delivery Operations Hub&rsquo;s own identity module and is
          authored on another surface, so a rail of twelve over a register of thirteen is the
          mapping rather than a gap.
        </p>
        <ul className="mt-3 space-y-4">
          {CC_NAV.map((entry) => (
            <RailRow
              key={entry.screen}
              entry={entry}
              built={builtPaths.has(entry.pathname)}
            />
          ))}
        </ul>
      </nav>

      {/* THE ACTION-RAIL MOUNT POINT. The closed set of ten is exercised FROM
          these screens and owns none of them. */}
      <div data-testid="cc-action-rail-slot">
        {actionRail ?? <SeamNotice id="operational-action-set" />}
      </div>

      {children === undefined ? null : <div className="mt-6">{children}</div>}

      <PrototypeDisclosure />
    </main>
  )
}
