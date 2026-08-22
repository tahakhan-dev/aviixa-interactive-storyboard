import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { LearnedChangeApprovals } from '@/surfaces/cc/modules/cc-06/LearnedChangeApprovals'
import { CC06_MODULE, CC06_SCREEN, CC06_SLUG } from '@/surfaces/cc/modules/cc-06/matrix'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC06_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-07` — learned-change approvals, the screen of **`MOD-CC-06`**.
 *
 * THE MODULE IS NAMED IN THIS FILE ON PURPOSE, and on lines that name no
 * other module of this surface. A route claimed by a slug is demonstrated by
 * the claim alone, so a module screen can ship without ever saying what it is
 * — `SCR-CC-10`'s page did, until a registry gate went red and said so. The
 * identifier is rendered as well as written, from `CC06_MODULE.id` rather
 * than a literal, so the page and the spine cannot disagree.
 *
 * The interconnection line this page relies on is deliberately NOT quoted
 * here. It enumerates seven module identifiers, and a file that quotes a list
 * of identifiers contains every identifier in that list — which is how a
 * `page.includes(…)` gate went green on a sibling route after every sentence
 * naming its own module had been deleted.
 *
 * ── WHY THIS DIRECTORY IS NAMED `learned-change-approvals` ───────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so. `CC06_SLUG` is derived from
 * that spine entry rather than typed here, so this directory's name has
 * exactly one spelling in the build. `CC_NAV` publishes this screen's
 * pathname from the same field, and `scripts/build-registries.mjs` reads a
 * declared slug with no directory of that name as "declared, not built".
 *
 * ── THE OTHER SCREEN THIS MODULE APPEARS ON IS NOT BUILT HERE ────────────
 *
 * `SCR-CC-13`, the learning read view, shows this module beside another one,
 * and the spine gives that other module the `learning-read-view` slug. So its
 * route is that module's task, and this one supplies a component for it to
 * mount: `Cc06LearningReadView` in `src/surfaces/cc/modules/cc-06/`. It takes
 * no props. Building that directory here would claim a route this module does
 * not own and would leave a claimed slug with two candidate owners.
 *
 * ── `chrome` IS UNFILLED AND `actionRail` IS FILLED ──────────────────────
 *
 * `CommandCenterShell` provides two mount points and mounts neither module.
 * `chrome` stays unfilled and renders the shell's declared open seam naming
 * its owner: a freshness marker states a device count, an offline count and
 * an age, and this screen has none of the three for the board's scope.
 * Inventing them would be the storyboard's illustrative number rendered as a
 * value.
 *
 * `actionRail` is filled, because L38793 names this screen's module among the
 * modules whose screens exercise one or more of the ten operational actions,
 * and gives it action 3 — the learned-change decision. L37387 states the same
 * thing independently from this module's own side. `Cc13ActionRail` is
 * `SB-16-02`'s CONTROL rail and not `src/surfaces/cc/actions/ActionRail.tsx`,
 * which renders the action module's card — both §21.16 tables as text and no
 * control. Two rails exist deliberately and neither is the other's second
 * spelling.
 *
 * `heldColumns` is a SET and is not flattened. L20197's worked example is one
 * person holding Supervisor at an Area and Quality Manager at a Site with "no
 * dropdown asking which role he is using", and L20195 is why the rail's
 * header carries the person's name and the scope filter and no role indicator
 * at all. The person is this section's own storyboard: Elena, the Quality
 * Manager who opens the proposal and approves it at L37371.
 *
 * `scopeFilter` is an ILLUSTRATION and is stated as one. The rail's header
 * offers Site or Area and §21.9 names neither: this module's proposals are
 * scoped by workflow and screen — "Affects 1 workflow, 1 screen" (L37361) —
 * not by site or area. `Site` is passed because the vocabulary has two
 * members and no third, and minting a third would be an edit to another
 * module's file.
 *
 * ── THE VIEWER ROLE IS AN ILLUSTRATION, NOT AN ACCESS DECISION ───────────
 *
 * `evaluateCCAccess` answers the access question at the door and on a real
 * request; this storyboard holds no session. The role below is handed in so
 * `ccLinkOutModel` can check row 7's pointer against the route registry, and
 * it is stated on screen. The matrix itself renders whole, for every role.
 */

/**
 * ponytail: the fourth spelling of the same four-line readdir — the other
 * three are `app/command-center/page.tsx` and the two module routes already
 * built. It is duplicated rather than hoisted because no shared home for it
 * is this task's to edit: `src/surfaces/cc/shell/` belongs to another task
 * and `src/` is deliberately free of `node:fs`. Reported rather than fixed.
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
    <CommandCenterShell
      screen={CC06_SCREEN}
      builtSlugs={builtSlugs()}
      actionRail={
        <Cc13ActionRail
          personName="Elena"
          scopeFilter="Site"
          heldColumns={['Quality Manager']}
          mountedOn={CC06_MODULE.id}
        />
      }
    >
      <p data-testid="cc-06-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC06_MODULE.id} · {CC06_MODULE.name} · /command-center/{CC06_SLUG} · specified at{' '}
        {CC06_MODULE.specSection}, source section {CC06_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. No proposal below is a live record, no approval commits anything, and
        the scope filter shown on the action rail is an illustration: this module&rsquo;s proposals
        are scoped by workflow and screen rather than by site or area. The viewer role handed to the
        cross-surface link-out is the Quality Manager, stated rather than inferred, and it is not an
        access decision.
      </p>
      <LearnedChangeApprovals viewerRole="QUALITY_MANAGER" />
    </CommandCenterShell>
  )
}
