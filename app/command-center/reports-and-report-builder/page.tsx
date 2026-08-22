import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { CC11_MODULE, CC11_SCREEN, CC11_SLUG } from '@/surfaces/cc/modules/cc-11/matrix'
import { ReportsAndBuilder } from '@/surfaces/cc/modules/cc-11/ReportsAndBuilder'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC11_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-11` — reports and the Custom Report Builder, the screen of
 * **`MOD-CC-11`**.
 *
 * THE MODULE IDENTIFIER IS NAMED IN THIS FILE ON PURPOSE. A route claimed by
 * a slug is demonstrated by the claim alone, so a module screen can ship
 * without ever saying what it is — `SCR-CC-10`'s page did, until a registry
 * gate went red and said so. It is rendered as well as written, from
 * `CC11_MODULE.id` rather than a literal, so the page and the spine cannot
 * disagree about which module this is.
 *
 * ── WHY THIS DIRECTORY IS NAMED `reports-and-report-builder` ─────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so: this module declares
 * `slug: 'reports-and-report-builder'`, which is neither the screen's short
 * name nor its register name. `CC11_SLUG` is derived from that spine entry
 * rather than typed here, so the directory's name has exactly one spelling in
 * the build. `CC_NAV` publishes this screen's pathname from the same field,
 * and `scripts/build-registries.mjs` reads a declared slug with no directory
 * of that name as "declared, not built".
 *
 * ── BOTH SHELL MOUNT POINTS STAY UNFILLED, AND THE SECOND IS THE FINDING ─
 *
 * `chrome` is `MOD-CC-02`'s and `CC_SEAMS` names `MOD-CC-01` as its host. A
 * `FreshnessMarker` needs a device count, an offline count and an age; this
 * screen holds none of them, and inventing them would be the storyboard's
 * illustrative number rendered as a value.
 *
 * `actionRail` is `MOD-CC-13`'s, and it is unfilled DELIBERATELY rather than
 * by omission. L38793 enumerates the modules whose screens exercise one or
 * more of the ten operational actions: *"`MOD-CC-04` for 1, 2, 4, 7 and 9;
 * `MOD-CC-05` for 2; `MOD-CC-06` for 3; `MOD-CC-09` for 1 and 10; `MOD-CC-10`
 * for 5; `MOD-CC-12` for 6; `MOD-CC-03` for 8."* Seven modules, and this one
 * is not one of them. The reports screen exercises none of the ten: L38299
 * puts its one write — report-format authoring — explicitly outside the list,
 * and `AC-CC-410` (L38867) makes that a criterion. Ten operational controls
 * on a screen that exercises none of them is the exact drift the closed set
 * exists to prevent.
 *
 * So the shell renders its declared `operational-action-set` seam, which
 * names the owing module and states the absence. A stated absence naming its
 * owner is what a mount point is for; an undeclared absence is the
 * `cc-10-s366` shape, and the difference between the two is the whole
 * difference.
 *
 * ── AND NO CROSS-SURFACE LINK ────────────────────────────────────────────
 *
 * No cell of this module's matrix is a population-B link-out — a cell the
 * source marks prohibited and then names a destination for. Rows 8 and 9 are
 * prohibited-with-a-note and their notes name a product rule and a roadmap,
 * neither of which is a surface to link to.
 * `src/surfaces/cc/decisions/link-outs.ts` registers thirteen such cells and
 * none is this one's.
 */

/**
 * ponytail: the same four-line readdir `app/command-center/page.tsx` and the
 * deviation workspace's route each perform. Duplicated rather than hoisted
 * because neither that file nor the shell is this task's to edit and `src/`
 * is deliberately free of `node:fs`. It is now spelled three times; the
 * fourth caller should hoist it into the shell's own directory.
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
    <CommandCenterShell screen={CC11_SCREEN} builtSlugs={builtSlugs()}>
      <p data-testid="cc-11-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC11_MODULE.id} · {CC11_MODULE.name} · /command-center/{CC11_SLUG} · specified at{' '}
        {CC11_MODULE.specSection}, source section {CC11_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. No report is generated, no file is delivered and no schedule runs. The
        five data sets below are named as the source proposes them and the identity of the list is
        an open client item, so nothing here should be read as a confirmed report catalogue.
      </p>
      <ReportsAndBuilder />
    </CommandCenterShell>
  )
}
