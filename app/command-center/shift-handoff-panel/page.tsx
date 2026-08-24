import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { builtSlugs } from '@/surfaces/cc/built-slugs'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { ShiftHandoffPanel } from '@/surfaces/cc/modules/cc-12/ShiftHandoffPanel'
import { CC12_MODULE, CC12_SCREEN, CC12_SLUG } from '@/surfaces/cc/modules/cc-12/matrix'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'
import { AiDegradationOverlay } from '@/ai/five-surface/AiDegradationOverlay'
import { CC_AI_OVERLAY } from '@/surfaces/cc/ai-degradation'
import { ShiftHandoffRoleMatrix } from '@/ai/five-surface/ShiftHandoffRoleMatrix'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC12_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-12` — the shift handoff panel, the screen of **`MOD-CC-12`**.
 *
 * `MOD-CC-12` IS NAMED IN THIS FILE ON PURPOSE. A route claimed by a slug is
 * demonstrated by the claim alone, so a module screen can ship without ever
 * saying what it is — `SCR-CC-10`'s page did, until a registry gate went red
 * and said so. The identifier is rendered as well as written, from
 * `CC12_MODULE.id` rather than a literal, so the page and the spine cannot
 * disagree about which module this is.
 *
 * ── WHY THIS DIRECTORY IS NAMED `shift-handoff-panel` ────────────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so. `CC12_SLUG` is derived from
 * that spine entry rather than typed here, so this directory's name has
 * exactly one spelling in the build. `CC_NAV` publishes this screen's
 * pathname from the same field, and `scripts/build-registries.mjs` reads a
 * declared slug with no directory of that name as "declared, not built".
 *
 * ── THE SHELL'S CHROME MOUNT STAYS UNFILLED, AND THAT IS DECLARED ───────
 *
 * `chrome` is `MOD-CC-02`'s, and `CC_SEAMS` names `MOD-CC-01` as the host. A
 * `FreshnessMarker` needs a device count, an offline count and an age; this
 * screen has none of the three, and inventing them would be the storyboard's
 * illustrative number rendered as a value. The seam renders instead, naming
 * the owing module. A stated absence naming its owner is what a mount point
 * is for; an undeclared absence is the `cc-10-s366` shape, and the difference
 * between the two is the whole difference.
 *
 * ── AND `actionRail` IS FILLED, BECAUSE THE SOURCE NAMES THIS SCREEN ────
 *
 * L38793 names the seven modules whose screens exercise one or more of the
 * ten operational actions, and gives this one action 6. `MOD-CC-13` owns no
 * route and no path under `app/`, so a rail waiting for its own module to
 * mount it waits forever — the shape two wave-1 tasks found independently.
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
 * is this module's own illustrative example — Sam, opening the Command Center
 * at 06:00 and acknowledging at 06:04 (L38563) — and the scope is the site
 * this module's storyboard header names, `SITE-RIVERSIDE` (L38547).
 *
 * ── THE VIEWER ROLE IS AN ILLUSTRATION, NOT AN ACCESS DECISION ──────────
 *
 * `evaluateCCAccess` answers the access question at the door and on a real
 * request; this storyboard holds no session. The role below is handed in so
 * `ccLinkOutModel` can check its pointer against the route registry, and it
 * is stated on screen. It is not load-bearing for what the page draws: row
 * 7's cell names two owners and chooses neither, so the model resolves to
 * `owner-undecided` for every role and draws no link at all. The matrix
 * itself renders whole, for every role, in every case.
 */

export default function Page() {
  return (
    <CommandCenterShell
      screen={CC12_SCREEN}
      builtSlugs={builtSlugs()}
      actionRail={
        <Cc13ActionRail
          personName="Sam"
          scopeFilter="Site"
          heldColumns={['Supervisor', 'Quality Manager']}
          mountedOn={CC12_MODULE.id}
        />
      }
    >
      <p data-testid="cc-12-route" className="text-sm text-[var(--color-ink-subtle)]">
        {CC12_MODULE.id} · {CC12_MODULE.name} · /command-center/{CC12_SLUG} · specified at{' '}
        {CC12_MODULE.specSection}, source section {CC12_MODULE.sourceSection}
      </p>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system. The matrix below is rendered whole; the viewer role handed to the
        cross-surface link-out is the Supervisor, stated rather than inferred, and it is not an
        access decision.
      </p>
      <ShiftHandoffPanel viewerRole="SUPERVISOR" />

      {/* THE SECTION 44.3 ROLE MATRIX, WHOSE AXIS IS A CAPABILITY BY FIVE
          TENANT ROLES AND NOT A SURFACE. Four of its permissive cells are
          undecided across two rows, and each renders inoperable with both
          readings rather than enabled. */}
      <ShiftHandoffRoleMatrix />

      <AiDegradationOverlay
        overlay={CC_AI_OVERLAY}
        mountedOn={`${CC12_MODULE.id} — ${CC12_MODULE.name}`}
      />
    </CommandCenterShell>
  )
}
