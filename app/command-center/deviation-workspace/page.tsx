import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { builtSlugs } from '@/surfaces/cc/built-slugs'
import { DeviationWorkspace } from '@/surfaces/cc/modules/cc-04/DeviationWorkspace'
import { CC04_MODULE, CC04_SCREEN, CC04_SLUG } from '@/surfaces/cc/modules/cc-04/matrix'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC04_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-05` — the deviation workspace and evidence review, the screen of
 * **`MOD-CC-04`**.
 *
 * `MOD-CC-04` IS NAMED IN THIS FILE ON PURPOSE. A route claimed by a slug is
 * demonstrated by the claim alone, so a module screen can ship without ever
 * saying what it is — `SCR-CC-10`'s page did, until a registry gate went red
 * and said so. The identifier is rendered as well as written, from
 * `CC04_MODULE.id` rather than a literal, so the page and the spine cannot
 * disagree about which module this is.
 *
 * ── WHY THIS DIRECTORY IS NAMED `deviation-workspace` ────────────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so: `MOD-CC-04` declares
 * `slug: 'deviation-workspace'`. `CC04_SLUG` is derived from that spine entry
 * rather than typed here, so this directory's name has exactly one spelling
 * in the build. `CC_NAV` publishes this screen's pathname from the same
 * field, and `scripts/build-registries.mjs` reads a declared slug with no
 * directory of that name as "declared, not built".
 *
 * ── THE SHELL IS USED, AND WHAT IT MOUNTS IS NOT THIS TASK'S TO FILL ────
 *
 * `CommandCenterShell` provides two mount points and mounts neither module.
 * Both stay unfilled here and both render their declared open seam naming the
 * owing module:
 *
 *  - `chrome` is `MOD-CC-02`'s, and `CC_SEAMS` names `MOD-CC-01` as the host.
 *    A `FreshnessMarker` needs a device count, an offline count and an age;
 *    this screen has none for the board's scope, and inventing them would be
 *    the storyboard's illustrative number rendered as a value.
 * A stated absence naming its owner is what a mount point is for. An
 * undeclared absence is the `cc-10-s366` shape, and the difference between
 * the two is the whole difference.
 *
 * ── AND `actionRail` IS FILLED, BECAUSE THE SOURCE NAMES THIS SCREEN ────
 *
 * This file first declared the rail another task's to wire, and that was a
 * CIRCLE rather than an abstention: `MOD-CC-13` owns no route and no path
 * under `app/`, so a rail waiting for its own module to mount it waits
 * forever — the `cc-10-s366` shape exactly, reached by two files each
 * correctly declining.
 *
 * L38793 breaks it by naming the seven modules whose screens exercise one or
 * more of the ten: *"`MOD-CC-04` for 1, 2, 4, 7 and 9; `MOD-CC-05` for 2;
 * `MOD-CC-06` for 3; `MOD-CC-09` for 1 and 10; `MOD-CC-10` for 5;
 * `MOD-CC-12` for 6; `MOD-CC-03` for 8."* This module is the widest of the
 * seven, and L36943 states the same five independently.
 *
 * `Cc13ActionRail` is `SB-16-02`'s CONTROL rail and not wave 0's
 * `src/surfaces/cc/actions/ActionRail.tsx`, which renders the module's card —
 * both §21.16 tables as text and no control. Two rails exist deliberately and
 * neither is the other's second spelling.
 *
 * `heldColumns` is a SET and is not flattened here. L20197's worked example
 * is one person holding Supervisor at an Area and Quality Manager at a Site
 * with no dropdown asking which, and L20195 is why the header carries the
 * person's name and the scope filter and no role indicator at all. The person
 * and the scope are this module's own storyboard: Elena, notified as the
 * Quality Manager role at `SITE-RIVERSIDE` (L36921), who marks evidence
 * reviewed and releases the hold in `SB-CC-15`'s worked example (L36925).
 *
 * ── THE VIEWER ROLE IS AN ILLUSTRATION, NOT AN ACCESS DECISION ──────────
 *
 * `evaluateCCAccess` answers the access question at the door and on a real
 * request; this storyboard holds no session. The role below is handed in so
 * `ccLinkOutModel` can check its pointer against the route registry, and it
 * is stated on screen. It is not load-bearing for what the page draws:
 * `routesForRole` admits every role on `SCR-CC-05`'s register row to the
 * Delivery Operations Hub, so row 12's link resolves identically for both.
 * The matrix itself renders whole, for every role, in every case.
 */

export default function Page() {
  return (
    <CommandCenterShell
      screen={CC04_SCREEN}
      builtSlugs={builtSlugs()}
      actionRail={
        <Cc13ActionRail
          personName="Elena"
          scopeFilter="Site"
          heldColumns={['Quality Manager']}
          mountedOn={CC04_MODULE.id}
        />
      }
    >
      <p data-testid="cc-04-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC04_MODULE.id} · {CC04_MODULE.name} · /command-center/{CC04_SLUG} · specified at{' '}
        {CC04_MODULE.specSection}, source section {CC04_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. The matrix below is rendered whole; the viewer role handed to the
        cross-surface link-outs is the Quality Manager, stated rather than inferred, and it is not
        an access decision.
      </p>
      <DeviationWorkspace viewerRole="QUALITY_MANAGER" />
    </CommandCenterShell>
  )
}
