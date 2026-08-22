import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { DrillDown } from '@/surfaces/cc/modules/cc-03/DrillDown'
import { CC03_CELL_SCREEN, CC03_CELL_SLUG, CC03_MODULE } from '@/surfaces/cc/modules/cc-03/matrix'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC03_CELL_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-03` — the cell view. The second screen of **`MOD-CC-03`**, and the
 * one no module claims.
 *
 * THE MODULE IS NAMED IN THIS FILE ON PURPOSE, and here it is load-bearing
 * rather than merely good practice. This route carries NO slug claim at all:
 * `scripts/build-registries.mjs` awards an unclaimed route by argmax over the
 * module ids the files under it name. A page that never says what it is would
 * leave this directory demonstrating nothing, or worse, demonstrating
 * whichever module its imports happened to mention most. The identifier is
 * rendered as well as written, from `CC03_MODULE.id` rather than a literal.
 *
 * ── WHY THIS DIRECTORY IS NAMED `cell-view`, AND WHY THAT WAS NOT A CHOICE
 *
 * The dispatch expected `ccScreenSlug` to return `null` for this screen and
 * told this task to choose the register's own name. It does not return
 * `null`. `src/surfaces/cc/screens.ts` carries `unownedSlug: 'cell-view'` on
 * this row, deliberately, "so the route key is settled here rather than
 * invented by whichever slice-9 task builds the directory" — and `CC_NAV`
 * has been publishing `/command-center/cell-view` since slice 8. A directory
 * under any other name would leave a published navigation entry pointing at
 * a route that does not exist. `CC03_CELL_SLUG` is read from that field and
 * is not typed here.
 *
 * ── ONE ROUTE DIRECTORY, ONE MODULE, AND THIS ONE IS NOT A SECOND CLAIM ─
 *
 * `AC-CC-040` (L35261) forbids a fourteenth module route. This is not one:
 * the register carries thirteen SCREENS and this is the third of them
 * (L48388). `MOD-CC-03` still owns exactly one slug — `run-drill-down`, the
 * `all features` row at L48389 — and appearing on a second register row is
 * not a second claim of ownership. Two screens, one module, one slug.
 *
 * ── WHAT THIS SCREEN SHOWS, AND WHAT IT DOES NOT ────────────────────────
 *
 * The register's own cell is `MOD-CC-03 FEAT-CC-0301` — the three-level
 * drill path, and only that. `FEAT-CC-0302`'s exception-led navigation and
 * `FEAT-CC-0303`'s history boundary are the run drill-down's, so the link
 * into the Delivery Operations Hub is rendered there and not here. The
 * permission matrix still renders whole on both, because the matrix is the
 * module's and not the screen's.
 *
 * ── THE ACTION RAIL IS MOUNTED HERE TOO ─────────────────────────────────
 *
 * L38793 names modules, not screens, and this module has two. Mounting the
 * rail on only one of them would make action 8 reachable from one of this
 * module's two routes and not the other, which is a rule the source states
 * nowhere. `SB-CC-24` opens on the run view specifically, so the rail's
 * `mountedOn` says which module's context this is and the rail itself lists
 * all ten either way — L20197: "The action rail shows all ten actions."
 *
 * ── THE CHROME MOUNT POINT STAYS UNFILLED, AND THAT IS DECLARED ─────────
 *
 * `chrome` is `MOD-CC-02`'s and `CC_SEAMS` names `MOD-CC-01` as the host.
 * This screen has no device count, no offline count and no age for the
 * board's scope, and inventing them would be the storyboard's illustrative
 * number rendered as a value. The seam renders as an open seam naming its
 * owner.
 */

/** ponytail: see the note on the sibling route; a fourth spelling of one readdir. */
function builtSlugs(): readonly string[] {
  const dir = join(process.cwd(), 'app', 'command-center')
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(dir, name, 'page.tsx')))
    .sort()
}

export default function Page() {
  const built = builtSlugs()
  return (
    <CommandCenterShell
      screen={CC03_CELL_SCREEN}
      builtSlugs={built}
      actionRail={
        <Cc13ActionRail
          personName="Sam"
          scopeFilter="Area"
          heldColumns={['Supervisor', 'Quality Manager']}
          mountedOn={CC03_MODULE.id}
        />
      }
    >
      <p data-testid="cc-03-cell-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC03_MODULE.id} · {CC03_MODULE.name} · /command-center/{CC03_CELL_SLUG} · specified at{' '}
        {CC03_MODULE.specSection}, source section {CC03_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. This route carries no slug claim on the module spine; its key is the
        screen catalogue&rsquo;s own <code>unownedSlug</code>, and the page names its module so
        the registry generator has something to award the route to.
      </p>
      <DrillDown screen={CC03_CELL_SCREEN} viewerRole="SUPERVISOR" builtSlugs={built} />
    </CommandCenterShell>
  )
}
