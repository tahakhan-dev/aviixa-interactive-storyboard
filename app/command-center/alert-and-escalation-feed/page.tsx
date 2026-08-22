import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { builtSlugs } from '@/surfaces/cc/built-slugs'
import { AlertEscalationFeed } from '@/surfaces/cc/modules/cc-09/AlertEscalationFeed'
import { CC09_MODULE, CC09_SCREEN, CC09_SLUG } from '@/surfaces/cc/modules/cc-09/matrix'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC09_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-09` — the alert and escalation feed, the screen of **`MOD-CC-09`**.
 *
 * `MOD-CC-09` IS NAMED IN THIS FILE ON PURPOSE. A route claimed by a slug is
 * demonstrated by the claim alone, so a module screen can ship without ever
 * saying what it is — `SCR-CC-10`'s page did, until a registry gate went red
 * and said so. The identifier is rendered as well as written, from
 * `CC09_MODULE.id` rather than a literal, so the page and the spine cannot
 * disagree about which module this is.
 *
 * ── WHY THIS DIRECTORY IS NAMED `alert-and-escalation-feed` ──────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so: this module declares
 * `slug: 'alert-and-escalation-feed'`. `CC09_SLUG` is derived from that spine
 * entry rather than typed here, so this directory's name has exactly one
 * spelling in the build. `CC_NAV` publishes this screen's pathname from the
 * same field, and `scripts/build-registries.mjs` reads a declared slug with
 * no directory of that name as "declared, not built". The screen register row
 * is L48394 and it gives this screen `MOD-CC-09 all features`.
 *
 * ── THE CHROME MOUNT POINT IS NOT THIS TASK'S TO FILL ───────────────────
 *
 * `CommandCenterShell` provides two mount points. `chrome` stays unfilled and
 * renders its declared open seam naming the owing module: it is `MOD-CC-02`'s,
 * and `CC_SEAMS` names `MOD-CC-01` as the host, because L36503 says the module
 * "supplies the banner to the board". A `FreshnessMarker` needs a device
 * count, an offline count and an age, and this screen has none for the board's
 * scope; inventing them would be the storyboard's illustrative number
 * rendered as a value. A stated absence naming its owner is what a mount
 * point is for.
 *
 * ── AND `actionRail` IS FILLED, BECAUSE THE SOURCE NAMES THIS SCREEN ────
 *
 * L38793 names the seven modules whose screens exercise one or more of the
 * ten and gives this one actions 1 and 10. L37963, this module's own
 * Interconnections line, states the same two independently. Until the
 * instruction to mount existed the rail was mounted nowhere: `MOD-CC-13` owns
 * no route and no path under `app/`, so a rail waiting for its own module to
 * mount it waits forever — the `cc-10-s366` shape, reached by two files each
 * correctly declining.
 *
 * `Cc13ActionRail` is `SB-16-02`'s CONTROL rail and not wave 0's
 * `src/surfaces/cc/actions/ActionRail.tsx`, which renders the module's card —
 * both §21.16 tables as text and no control. Two rails exist deliberately and
 * neither is the other's second spelling.
 *
 * `heldColumns` is a SET and is not flattened here. L20197's worked example is
 * one person holding Supervisor at an Area and Quality Manager at a Site with
 * no dropdown asking which, and L20195 is why the header carries the person's
 * name and the scope filter and no role indicator at all.
 *
 * THE PERSON AND THE SCOPE ARE THIS MODULE'S OWN STORYBOARD, AND ALL THREE
 * FIELDS COME OFF ONE LINE. L37940: "Quality Manager role at `SITE-RIVERSIDE`,
 * resolved on shift to Elena, at 10:22:16, in-app and email." That is the
 * name, the grant and the scope in the source's own sentence. Sam's Supervisor
 * clearance at L37947 is the module's other worked act and it is rendered in
 * the panel below, where its condition can be shown, rather than by putting a
 * second person in a rail header that L20195 closes at two fields.
 *
 * ── THE VIEWER ROLE IS AN ILLUSTRATION, NOT AN ACCESS DECISION ──────────
 *
 * `evaluateCCAccess` answers the access question at the door and on a real
 * request; this storyboard holds no session. The role below is handed in so
 * `ccLinkOutModel` can check row 9's pointer against the route registry, and
 * it is stated on screen. The matrix itself renders whole, for every role, in
 * every case.
 */

export default function Page() {
  return (
    <CommandCenterShell
      screen={CC09_SCREEN}
      builtSlugs={builtSlugs()}
      actionRail={
        <Cc13ActionRail
          personName="Elena"
          scopeFilter="Site"
          heldColumns={['Quality Manager']}
          mountedOn={CC09_MODULE.id}
        />
      }
    >
      <p data-testid="cc-09-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC09_MODULE.id} · {CC09_MODULE.name} · /command-center/{CC09_SLUG} · specified at{' '}
        {CC09_MODULE.specSection}, source section {CC09_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. The matrix below is rendered whole; the viewer role handed to the
        cross-surface link-out is the Quality Manager, stated rather than inferred, and it is not
        an access decision.
      </p>
      <AlertEscalationFeed viewerRole="QUALITY_MANAGER" />
    </CommandCenterShell>
  )
}
