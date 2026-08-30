import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { builtSlugs } from '@/surfaces/cc/built-slugs'
import { GovernanceGateQueue } from '@/surfaces/cc/modules/cc-05/GovernanceGateQueue'
import { CC05_MODULE, CC05_SCREEN, CC05_SLUG } from '@/surfaces/cc/modules/cc-05/matrix'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC05_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-06` — the governance gate queue, the screen of **`MOD-CC-05`**.
 *
 * `MOD-CC-05` IS NAMED IN THIS FILE ON PURPOSE. A route claimed by a slug is
 * demonstrated by the claim alone, so a module screen can ship without ever
 * saying what it is — `SCR-CC-10`'s page did, until a registry gate went red
 * and said so. The identifier is rendered as well as written, from
 * `CC05_MODULE.id` rather than a literal, so the page and the spine cannot
 * disagree about which module this is.
 *
 * ── WHY THIS DIRECTORY IS NAMED `governance-gate-queue` ──────────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so: this module declares
 * `slug: 'governance-gate-queue'`. `CC05_SLUG` is derived from that spine
 * entry rather than typed here, so this directory's name has exactly one
 * spelling in the build. `CC_NAV` publishes this screen's pathname from the
 * same field, and `scripts/build-registries.mjs` reads a declared slug with no
 * directory of that name as "declared, not built".
 *
 * ── THIS IS THE QUALITY MANAGER'S LANDING, AND THAT SETS THE BAR ─────────
 *
 * L48391's register row ends "Landing for the Quality Manager", so this is the
 * first screen the person who decides these items sees. The landing is a
 * ROUTING DEFAULT AND NOT A PERMISSION (L35061), and nothing here implements
 * it as a restriction: the shell's rail offers every built route, and the
 * matrix renders whole for every role.
 *
 * TWO SCREENS CLAIM THAT LANDING AND THE REGISTER SAYS SO TWICE.
 * `SCR-CC-07`'s row (L48392) ends "Quality Manager landing" — a second
 * wording of the same claim on the learned-change queue. The landing
 * precedence table resolves the Quality Manager to "Decision queues" (L35075),
 * PLURAL, and L35059 lists three of them: gate items, learned-change
 * proposals, deviations awaiting disposition. So the source is consistent and
 * the singular reading is not the source's: this screen is one of the decision
 * queues a Quality Manager lands on, and only the navigation diagram at L48403
 * draws sign-in straight to this one. Nothing here claims to be the only
 * landing.
 *
 * ── THE SHELL, AND WHAT IS NOT THIS TASK'S TO FILL ──────────────────────
 *
 * `CommandCenterShell` provides two mount points and mounts neither module.
 * `chrome` stays unfilled here and renders its declared open seam naming the
 * owing module: it is `MOD-CC-02`'s, `CC_SEAMS` names `MOD-CC-01` as the host,
 * and a `FreshnessMarker` needs a device count, an offline count and an age
 * that this screen has none of. Inventing them would be the storyboard's
 * illustrative number rendered as a value. A stated absence naming its owner
 * is what a mount point is for; an undeclared absence is the `cc-10-s366`
 * shape, and the difference between the two is the whole difference.
 *
 * ── AND `actionRail` IS FILLED, BECAUSE THE SOURCE NAMES THIS SCREEN ────
 *
 * L38793 names the seven modules whose screens exercise one or more of the
 * ten: *"`MOD-CC-04` for 1, 2, 4, 7 and 9; `MOD-CC-05` for 2; `MOD-CC-06` for
 * 3; `MOD-CC-09` for 1 and 10; `MOD-CC-10` for 5; `MOD-CC-12` for 6;
 * `MOD-CC-03` for 8."* This module is named for action 2, the gate-item
 * decision, and L37171 states the same interconnection independently.
 *
 * `Cc13ActionRail` is `SB-16-02`'s CONTROL rail and not wave 0's
 * `src/surfaces/cc/actions/ActionRail.tsx`, which renders the module's card —
 * both §21.16 tables as text and no control. Two rails exist deliberately and
 * neither is the other's second spelling. The rail carries its own ABSENCE
 * INVERSION — L20195 asks it to draw a `Not applicable` action as absent where
 * `WriteControl` draws it disabled — and that inversion is recorded in the
 * rail rather than repaired in either component. Nothing here touches it.
 *
 * `heldColumns` is a SET and is not flattened: L20197's worked example is one
 * person holding Supervisor at an Area and Quality Manager at a Site with "no
 * dropdown asking which role he is using". The person and the scope are this
 * module's own storyboard — Elena, whose worked example decides this queue's
 * card at L37155, and the Site scope the card's own re-route line names at
 * L37147.
 *
 * ── THE VIEWER ROLE IS AN ILLUSTRATION, NOT AN ACCESS DECISION ──────────
 *
 * `evaluateCCAccess` answers the access question at the door and on a real
 * request; this storyboard holds no session. The matrix renders whole, for
 * every role, in every case, and the panel takes no role prop at all.
 */

export default function Page() {
  return (
    <CommandCenterShell
      screen={CC05_SCREEN}
      builtSlugs={builtSlugs()}
      actionRail={
        <Cc13ActionRail
          personName="Elena"
          scopeFilter="Site"
          heldColumns={['Quality Manager']}
          mountedOn={CC05_MODULE.id}
        />
      }
    >
      <p data-testid="cc-05-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC05_MODULE.id} · {CC05_MODULE.name} · /command-center/{CC05_SLUG} · specified at{' '}
        {CC05_MODULE.specSection}, source section {CC05_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. No gate decision service exists behind these controls, and the two cards
        below are the source&rsquo;s own storyboard rather than live items.
      </p>
      <GovernanceGateQueue />
    </CommandCenterShell>
  )
}
