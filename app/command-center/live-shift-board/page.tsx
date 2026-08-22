import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { builtSlugs } from '@/surfaces/cc/built-slugs'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'
import { LiveShiftBoard } from '@/surfaces/cc/modules/cc-01/LiveShiftBoard'
import { BoardSyncChrome } from '@/surfaces/cc/modules/cc-01/BoardSyncChrome'
import { CC01_LANDING_ROLE, CC01_SCREEN, CC01_SLUG } from '@/surfaces/cc/modules/cc-01/board'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC01_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-02` — the live shift board. **`MOD-CC-01`'s screen**, with
 * `MOD-CC-02`'s chrome riding on it.
 *
 * `MOD-CC-01` is spelled here on purpose. A route claimed by a slug is
 * demonstrated by the claim alone, so this file could ship without ever
 * saying what it is — `SCR-CC-10`'s page did exactly that in slice 8 until
 * the registry gate went red and said so. Every module screen in this tree
 * names the module it serves.
 *
 * ── WHY THIS DIRECTORY IS NAMED `live-shift-board` ──────────────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so. `MOD-CC-01` declares
 * `slug: 'live-shift-board'` there, `CC_NAV` publishes this screen's pathname
 * from that same declaration through `ccScreenSlug`, and
 * `scripts/build-registries.mjs` reads a declared slug with no directory of
 * that name as "declared, not built". `CC01_SLUG` is derived from the spine
 * rather than typed, so the directory name has one literal spelling and the
 * page cannot drift from the rail.
 *
 * ── TWO MODULES, ONE SCREEN, AND ONLY ONE OF THEM HAS A ROUTE ───────────
 *
 * The register's row (L48387) names `MOD-CC-01, MOD-CC-02`. `MOD-CC-02` is
 * surface chrome and declares `slug: null` with its reason on its own spine
 * record; `AC-CC-040` (L35261) forbids a fourteenth module route, and giving
 * the chrome one would be that fourteenth. So it is MOUNTED here and not
 * routed: `BoardSyncChrome` fills the shell's `chrome` prop with
 * `MOD-CC-02`'s own exported components, and the `sync-state-chrome-host`
 * seam notice steps aside without an edit to the shell.
 *
 * ── WHY THIS SCREEN AND NOT THE SHELL ───────────────────────────────────
 *
 * The shell provides both mount points and mounts neither module, which was
 * right: a freshness marker states a device count, an offline count and an
 * age, and the shell knows none of the three. `CC_SEAMS` names `MOD-CC-01`
 * as the owner of the missing half and L36503 agrees — the module "supplies
 * markers to every other module; supplies the banner to the board". This is
 * the board. The counts it hands the marker are the source's own storyboard
 * device list (L35967-L35969), transcribed with its lines and labelled on
 * screen as the storyboard's, because inventing them here would be the same
 * illustrative-number-as-a-value the shell refused to commit.
 *
 * ── AND `MOD-CC-13`'S ACTION RAIL IS DELIBERATELY NOT MOUNTED HERE ──────
 *
 * The pattern this surface requires is that the routeless action module
 * mounts inside other modules' screens, and the shell has an `actionRail`
 * prop for exactly that. This screen still does not fill it, because the
 * source names the screens that do and this is not one of them. L38793:
 * "Every other module on this surface is where one or more of the ten
 * actions is exercised: `MOD-CC-04` for 1, 2, 4, 7 and 9; `MOD-CC-05` for 2;
 * `MOD-CC-06` for 3; `MOD-CC-09` for 1 and 10; `MOD-CC-10` for 5;
 * `MOD-CC-12` for 6; `MOD-CC-03` for 8." Seven modules; `MOD-CC-01` is
 * absent from the list.
 *
 * That agrees with everything else on this card — L36278 "no records. The
 * board writes nothing", L36280 "None. This module is read-only by
 * construction" — and with its own matrix, which carries no action row at
 * all. Putting ten operational controls on a board that exercises none of
 * them would be the drift the closed set exists to prevent, arrived at
 * through the mounting rule rather than through the enumeration.
 *
 * So `actionRail` is left unfilled and the shell renders its declared
 * `operational-action-set` seam, which names the owing module. A stated
 * absence is not the same as an oversight, and this paragraph is the
 * statement.
 *
 * The viewer role passed to the board is the Supervisor, because L35076
 * makes this screen the Supervisor's landing. It is a rendering input to two
 * consumers that ask a role-shaped question, not an access decision:
 * `evaluateCCAccess` answers that at the door on a real request.
 *
 * The built-route listing is asked by the ROUTE rather than by the shell for
 * the reason `app/command-center/page.tsx` states: the file that is in the
 * tree asks the question about the tree and hands the shell a finished
 * answer. The reading itself is `@/surfaces/cc/built-slugs`, one definition
 * for all thirteen routes.
 */
export default function Page() {
  return (
    <CommandCenterShell
      screen={CC01_SCREEN}
      builtSlugs={builtSlugs()}
      chrome={<BoardSyncChrome />}
    >
      <p className="text-sm text-[var(--color-ink-subtle)]" data-testid="cc01-route">
        {CC01_SCREEN.id} · /command-center/{CC01_SLUG} · register row {CC01_SCREEN.registerRef} ·
        modules shown: {CC01_SCREEN.modulesShown}
      </p>
      <p className="mt-4 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system.
      </p>
      <LiveShiftBoard viewerRole={CC01_LANDING_ROLE} />
    </CommandCenterShell>
  )
}
