import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { builtSlugs } from '@/surfaces/cc/built-slugs'
import { Cc06LearningReadView } from '@/surfaces/cc/modules/cc-06/LearningReadView'
import { FeedbackSignalCapture } from '@/surfaces/cc/modules/cc-07/FeedbackSignalCapture'
import { CC07_MODULE, CC07_SCREEN, CC07_SLUG } from '@/surfaces/cc/modules/cc-07/matrix'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC07_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-13` — the learning read view, the screen of **`MOD-CC-07`**.
 *
 * `MOD-CC-07` IS NAMED IN THIS FILE ON PURPOSE. A route claimed by a slug is
 * demonstrated by the claim alone, so a module screen can ship without ever
 * saying what it is — `SCR-CC-10`'s page did, until a registry gate went red
 * and said so. The identifier is rendered as well as written, from
 * `CC07_MODULE.id` rather than a literal, so the page and the spine cannot
 * disagree about which module this is.
 *
 * ── WHY THIS ROUTE EXISTS AT ALL ─────────────────────────────────────────
 *
 * An earlier draft of this task's dispatch said this module has no route and
 * mounts only inside other modules' screens. That was wrong, and the spine is
 * the authority: `src/surfaces/cc/modules.ts` declares
 * `slug: 'learning-read-view'` for this module, `CC_CLAIMED_SLUGS` carries it
 * and `CC_NAV` publishes its pathname. A claimed slug with no directory of
 * that name is what `scripts/build-registries.mjs` reads as "declared, not
 * built", which leaves the module honestly not-represented and the rail
 * offering no link. `MOD-CC-13` is the only routeless module on this surface.
 * `CC07_SLUG` is derived from the spine rather than typed here, so this
 * directory's name has exactly one spelling in the build.
 *
 * ── THE SCREEN SERVES TWO MODULES, AND THE BOUNDARY WAS AGREED ───────────
 *
 * L48398's `Modules and features shown` column reads `MOD-CC-06 FEAT-CC-0603,
 * MOD-CC-07`. The screen is this task's because the SLUG is this module's;
 * `MOD-CC-06` claims `learned-change-approvals` for `SCR-CC-07` and one module
 * owns at most one route, so its appearance here is a mount and not a claim.
 * Its half arrives as `Cc06LearningReadView`, a props-free server component
 * its own task wrote for this route and named in its own file header — so the
 * mount is one import and one element, and nothing of `MOD-CC-06`'s content is
 * built or stubbed on this side of the line.
 *
 * Both halves render on the same page because the register puts them there.
 * Which feature `FEAT-CC-0603` names is an open question both tasks reached
 * independently and neither settled: §21.9 calls it Aging (L37420), §25's
 * inventory calls it The package test (L47539), and this screen's own Purpose
 * column — "Read what the platform has learned, changing nothing" — is
 * `FUNC-CC-0605-1-1`'s own Purpose (L37434) in every word but the verb, which
 * reads "show". `FUNC-CC-0605-1-1` sits under `FEAT-CC-0605`, The learning
 * read view (L37432). Both records carry both readings and neither adopts one.
 * It is a near-quotation rather than a quotation, and the distinction is one
 * this build has paid for: the two tasks that own the halves of this screen
 * both wrote "verbatim" before either had compared the words.
 *
 * ── `actionRail` IS DELIBERATELY UNFILLED ────────────────────────────────
 *
 * L38793 enumerates the seven modules whose screens exercise one or more of
 * the ten operational actions: `MOD-CC-03`, `MOD-CC-04`, `MOD-CC-05`,
 * `MOD-CC-06`, `MOD-CC-09`, `MOD-CC-10`, `MOD-CC-12`. This module is not
 * among them, so `CommandCenterShell` renders its own declared
 * `operational-action-set` seam and no rail is mounted here. Ten operational
 * controls on a screen that exercises none of them is exactly the drift the
 * closed set exists to prevent — the live shift board's task mounted the rail
 * once and removed it on reading the same line.
 *
 * `chrome` is unfilled for the reason every non-board route leaves it unfilled:
 * it is `MOD-CC-02`'s, `CC_SEAMS` names `MOD-CC-01` as its host, and a
 * freshness marker states a device count, an offline count and an age that this
 * screen has none of. Inventing them would be the storyboard's illustrative
 * number rendered as a value.
 */

export default function Page() {
  return (
    <CommandCenterShell screen={CC07_SCREEN} builtSlugs={builtSlugs()}>
      <p data-testid="cc-07-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC07_MODULE.id} · {CC07_MODULE.name} · /command-center/{CC07_SLUG} · specified at{' '}
        {CC07_MODULE.specSection}, source section {CC07_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. This screen serves two modules and the register row says so; the matrix
        below is rendered whole, for every role, and the roles column of the register row is
        rendered beside the one matrix row that disagrees with it rather than reconciled with it.
      </p>
      <Cc06LearningReadView />
      <FeedbackSignalCapture />
    </CommandCenterShell>
  )
}
