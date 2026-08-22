import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { AgentActivityPanel } from '@/surfaces/cc/modules/cc-08/AgentActivityPanel'
import { CC08_MODULE, CC08_SCREEN, CC08_SLUG } from '@/surfaces/cc/modules/cc-08/matrix'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC08_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-08` — the agent activity panel, the screen of **`MOD-CC-08`**.
 *
 * `MOD-CC-08` IS NAMED IN THIS FILE ON PURPOSE. A route claimed by a slug is
 * demonstrated by the claim alone, so a module screen can ship without ever
 * saying what it is — `SCR-CC-10`'s page did, until a registry gate went red
 * and said so. The identifier is rendered as well as written, from
 * `CC08_MODULE.id` rather than a literal, so the page and the spine cannot
 * disagree about which module this is.
 *
 * ── WHY THIS DIRECTORY IS NAMED `agent-activity-panel` ───────────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so: this module declares
 * `slug: 'agent-activity-panel'`. `CC08_SLUG` is derived from that spine entry
 * rather than typed here, so this directory's name has exactly one spelling in
 * the build. `CC_NAV` publishes this screen's pathname from the same field,
 * and `scripts/build-registries.mjs` reads a declared slug with no directory
 * of that name as "declared, not built".
 *
 * ── BOTH MOUNT POINTS ARE LEFT UNFILLED, AND EACH FOR ITS OWN REASON ─────
 *
 * `CommandCenterShell` provides two mount points and mounts neither module.
 * Both stay unfilled here and both render their declared open seam naming the
 * owing module. A stated absence naming its owner is what a mount point is
 * for; an undeclared absence is the `cc-10-s366` shape, and the difference
 * between the two is the whole difference.
 *
 *  - `chrome` is `MOD-CC-02`'s, and `CC_SEAMS` names `MOD-CC-01` as the host.
 *    A freshness marker states a device count, an offline count and an age;
 *    this screen has none of the three for the board's scope, and inventing
 *    them would be the storyboard's illustrative number rendered as a value.
 *  - `actionRail` is `MOD-CC-13`'s, and THIS IS A RULING RATHER THAN A
 *    DEFERRAL. L38793 enumerates the modules whose screens exercise one or
 *    more of the ten operational actions and names seven; this module is not
 *    among them. This module's own interconnections paragraph (L37757) says it
 *    "exercises action 9 of `MOD-CC-13`", so the source disagrees with itself,
 *    and both readings are recorded in
 *    `src/surfaces/cc/modules/cc-08/readings.ts` with neither adopted.
 *
 *    The rail is not mounted because the costs are asymmetric. Mounting ten
 *    operational controls on a screen the enumeration does not name is the
 *    exact drift the closed set exists to prevent, and this panel is written
 *    for the Supervisor and the Quality Manager, so it would ship on their
 *    landing view. Leaving the seam open renders a stated absence naming
 *    `MOD-CC-13`, which whichever later task settles the disagreement closes
 *    with one prop and no edit to the shell.
 *
 * ── THE VIEWER ROLE IS AN ILLUSTRATION, NOT AN ACCESS DECISION ──────────
 *
 * `evaluateCCAccess` answers the access question at the door and on a real
 * request; this storyboard holds no session. The role below is handed in so
 * `ccLinkOutModel` can check its pointer against the route registry, and it is
 * stated on screen. The Supervisor is the source's own reader of this panel:
 * `FUNC-CC-0801-1-1` (L37780) gives its roles allowed as "Supervisor, Quality
 * Manager, Plant Manager persona", and the module's illustrative example
 * (L37741) is Sam reading the 09:36 entry — Sam is the Supervisor at Bright
 * Bikes (L1341). The matrix itself renders whole, for every role, in every
 * case.
 */

/**
 * ponytail: this is the same four-line readdir `app/command-center/page.tsx`
 * performs, and it is duplicated rather than hoisted because neither that file
 * nor the shell is this task's to edit and `src/` is deliberately free of
 * `node:fs`. If a fourth caller appears, hoist it into the shell's own
 * directory once instead of spelling it a fourth time.
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
  return (
    <CommandCenterShell screen={CC08_SCREEN} builtSlugs={builtSlugs()}>
      <p data-testid="cc-08-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC08_MODULE.id} · {CC08_MODULE.name} · /command-center/{CC08_SLUG} · specified at{' '}
        {CC08_MODULE.specSection}, source section {CC08_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. The matrix below is rendered whole; the viewer role handed to the
        cross-surface link-outs is the Supervisor, stated rather than inferred, and it is not an
        access decision. No action rail is mounted here and the shell&rsquo;s seam says which
        module owns one.
      </p>
      <AgentActivityPanel viewerRole="SUPERVISOR" />
    </CommandCenterShell>
  )
}
