import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { DrillDown } from '@/surfaces/cc/modules/cc-03/DrillDown'
import { CC03_MODULE, CC03_RUN_SCREEN, CC03_RUN_SLUG } from '@/surfaces/cc/modules/cc-03/matrix'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC03_RUN_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-04` — the run drill-down, the screen **`MOD-CC-03`** owns.
 *
 * THE MODULE IS NAMED IN THIS FILE ON PURPOSE. A route claimed by a slug is
 * demonstrated by the claim alone, so a module screen can ship without ever
 * saying what it is — `SCR-CC-10`'s page did, until a registry gate went red
 * and said so. The identifier is rendered as well as written, from
 * `CC03_MODULE.id` rather than a literal, so the page and the spine cannot
 * disagree about which module this is.
 *
 * ── ONE MODULE, TWO SCREENS, AND ONLY THIS ONE IS A SLUG CLAIM ───────────
 *
 * The screen register puts this module on two rows: `SCR-CC-03` Cell view
 * shows one feature of it (L48388) and `SCR-CC-04` Run drill-down shows all
 * features (L48389). One module owns at most one route —
 * `scripts/build-registries.mjs` throws on a slug matching more than one
 * directory — so `src/surfaces/cc/modules.ts` claims `run-drill-down`, the
 * `all features` row, and the cell view is left to the generator's argmax
 * rule, which can settle it because that row names no second module.
 *
 * `CC03_RUN_SLUG` is derived from the spine through `ccScreenSlug` rather
 * than typed here, so this directory's name has exactly one spelling in the
 * build. `CC_NAV` publishes this screen's pathname from the same field, and
 * the generator reads a declared slug with no directory of that name as
 * "declared, not built".
 *
 * ── THE ACTION RAIL IS MOUNTED HERE, AND THIS SCREEN IS WHY ─────────────
 *
 * `MOD-CC-13` owns no route and no path under `app/`, so a rail waiting for
 * its own module to mount it waits forever. L38793 names the seven modules
 * whose screens exercise one or more of the ten, and this one is named there
 * for action 8. Its own storyboard `SB-CC-24` (L38765) opens on THIS screen:
 * "Sam opens the run view for `RUN-2026-08-14-A` and selects 'Reassign'."
 * And this module's own interconnection line, L36706, says the same thing
 * from the other side.
 *
 * `Cc13ActionRail` is `SB-16-02`'s CONTROL rail and not wave 0's
 * `src/surfaces/cc/actions/ActionRail.tsx`, which renders that module's card
 * — both §21.16 tables as text and no control. Two rails exist deliberately
 * and neither is the other's second spelling.
 *
 * `heldColumns` is a SET and is not flattened here. L20197's worked example
 * is Sam holding Supervisor at `AREA-ASSY-A` and Quality Manager at
 * `SITE-RIVERSIDE` with "no dropdown asking which role he is using", and it
 * is the same Sam who runs this module's three-tap drill in `SB-CC-14`
 * (L36757) and reassigns the run in `SB-CC-24`. The scope filter is the Area
 * because L20197 states the reassignment control is enabled for runs in his
 * Area and disabled elsewhere.
 *
 * ── THE CHROME MOUNT POINT STAYS UNFILLED, AND THAT IS DECLARED ─────────
 *
 * `chrome` is `MOD-CC-02`'s and `CC_SEAMS` names `MOD-CC-01` as the host. A
 * `FreshnessMarker` needs a device count, an offline count and an age; this
 * screen has none for the board's scope, and inventing them would be the
 * storyboard's illustrative number rendered as a value. The seam renders as
 * an open seam naming its owner, which is what a mount point is for.
 *
 * ── THE VIEWER ROLE IS AN ILLUSTRATION, NOT AN ACCESS DECISION ──────────
 *
 * `evaluateCCAccess` answers the access question at the door and on a real
 * request; this storyboard holds no session. The role below is handed in so
 * the history boundary's pointer can be checked against the route registry,
 * and it is stated on screen. The matrix itself renders whole, for every
 * role, in every case.
 */

/**
 * ponytail: the same four-line readdir `app/command-center/page.tsx` and the
 * deviation workspace's route both perform, duplicated a third time rather
 * than hoisted because neither the shell nor `src/` is this task's to edit
 * and `src/` is deliberately free of `node:fs`. It is now on its fourth
 * spelling across two tasks; the upgrade is one helper beside the shell.
 */
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
      screen={CC03_RUN_SCREEN}
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
      <p data-testid="cc-03-run-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC03_MODULE.id} · {CC03_MODULE.name} · /command-center/{CC03_RUN_SLUG} · specified at{' '}
        {CC03_MODULE.specSection}, source section {CC03_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. The permission matrix below is rendered whole; the viewer role handed
        to the history boundary&rsquo;s pointer is the Supervisor, stated rather than inferred,
        and it is not an access decision.
      </p>
      <DrillDown screen={CC03_RUN_SCREEN} viewerRole="SUPERVISOR" builtSlugs={built} />
    </CommandCenterShell>
  )
}
