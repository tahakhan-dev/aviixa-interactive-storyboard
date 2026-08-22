import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'
import { Cc13ActionRail } from '@/surfaces/cc/modules/cc-13/Cc13ActionRail'
import { SyncConflictReviewPanel } from '@/surfaces/cc/modules/cc-10/SyncConflictReviewPanel'
import { SecondTreatmentDisclosure } from '@/surfaces/cc/modules/cc-10-s366/SecondTreatmentDisclosure'
import { CC10_SCREEN, CC10_SLUG } from '@/surfaces/cc/modules/cc-10/service'

const SURFACE = surfaceById('SURF-CC')

export const metadata: Metadata = {
  title: `${CC10_SCREEN.name} — ${SURFACE.name}`,
}

/**
 * `SCR-CC-10` — Sync-conflict review panel, the screen of `MOD-CC-10`. The
 * first route built under `app/command-center/` beyond the surface
 * placeholder, and the only new Command Center route this slice owns
 * outright.
 *
 * `MOD-CC-10` is spelled here on purpose. A route claimed by a slug is
 * demonstrated by the claim, so this file could have shipped without ever
 * naming its own module — and it did, until `registry-build`'s "every
 * demonstrated row is named by a file under app/" gate went red on
 * `MOD-CC-10` and said so. Every other module screen in this tree names the
 * module it serves; a screen that does not is thin, whatever the slug rule
 * infers.
 *
 * ── WHY THIS DIRECTORY IS NAMED `sync-conflict-review-panel` ─────────────
 *
 * Because `src/surfaces/cc/modules.ts` says so. Wave 0 settled every Command
 * Center slug there and this module declares `slug: 'sync-conflict-review-panel'`
 * — the same words the §25.5 register uses for the screen at L48395 and the
 * §21.1.5 inventory uses for the module at L35195, both "Sync-conflict review
 * panel". The dispatch for this task named a shorter path; the spine's word
 * wins, and the reason is mechanical rather than a preference:
 *
 *  - `CC_NAV` in `@/surfaces/cc/screens` publishes each screen's pathname from
 *    `ccScreenSlug`, which reads the spine. A directory under any other name
 *    leaves that navigation entry pointing at a route that does not exist.
 *  - `scripts/build-registries.mjs` treats a declared slug with no directory
 *    of that name as "declared, not built" and drops the module to mention
 *    argmax — the weaker path the slug rule was added to replace.
 *  - The spine is wave 0's file and no slice-8 task owns it, so a mismatch
 *    could not be corrected on the other side until slice 9.
 *
 * `CC10_SLUG` is derived from the spine rather than typed, so this directory's
 * name is the single literal, and `tests/unit/cc-10.test.ts` asserts a
 * directory of exactly that name is on disk.
 *
 * ── AND THIS DIRECTORY TURNS A WAVE-0 GATE RED, WHICH IS THE GATE'S BUG ──
 *
 * `tests/unit/cc-spine.test.ts`, "claims no slug that any surface already uses
 * as a route directory", counts a module's OWN built route as a collision:
 * `CC_CLAIMED_SLUGS.filter((slug) => byName.has(slug))`. It holds only while
 * NO Command Center route exists, and this is the first one. Isolated by
 * parking this directory and re-running that file alone — 24/24 with it gone,
 * 23/24 with it present, nothing else changed.
 *
 * `scripts/build-registries.mjs` has the rule right: it throws on
 * `dirs.length > 1` and treats exactly one directory of the claimed name as
 * what "demonstrated" MEANS. The gate wants `.length > 1` in the same place,
 * which keeps the hardening its own comment describes — a planted
 * `slug: 'sign-in'` still collides two-to-one — while admitting a route that
 * has actually been built. That file is not this task's and is reported
 * rather than edited.
 *
 * ── WHAT THIS PAGE DOES NOT DO ──────────────────────────────────────────
 *
 * It renders no resolution control of its own. The Command Center is a
 * cockpit and owns no operational record: resolving a sync conflict is action
 * 5 of the closed operational action set, executed against sync-conflict
 * records on the Delivery Operations Hub (L38175, L38669).
 *
 * ── AND IT NOW MOUNTS TWO THINGS IT DID NOT ─────────────────────────────
 *
 * **The second treatment.** §36.6 specifies this same module a second time,
 * with a nine-row matrix whose persona columns run in the opposite order, and
 * `cc-10-s366/SecondTreatmentDisclosure.tsx` transcribes it with all four
 * divergences. It was imported by no page and no component test, so a client
 * reviewing this screen saw one treatment and was told nothing about the
 * second. It is mounted below chapter 21's, and the two are not merged. Note
 * the distinction it cost this build a slice to learn: `MOD-CC-02`'s absence
 * from any route is DECLARED in `CC_SEAMS`; that component's absence was
 * declared nowhere and was simply unreferenced. A stated abstention and an
 * oversight look identical from the outside.
 *
 * **The action rail.** L38793 enumerates the modules whose screens exercise
 * one or more of the ten operational actions and names this one for action 5,
 * so this screen mounts `MOD-CC-13`'s rail. `MOD-CC-13` owns no path under
 * `app/` and can only reach a client through a screen that is not its own.
 * The component mounted is `cc-13/Cc13ActionRail.tsx` — the control rail
 * `SB-16-02` draws — and not `cc/actions/ActionRail.tsx`, which is the module
 * CARD and renders the same module's two tables as data. Two rails exist
 * deliberately and neither is the other's second spelling.
 *
 * `heldColumns` is a set rather than one role, and flattening it is the one
 * thing a mounting screen must not do: the source's own worked example is a
 * person holding Supervisor at an Area and Quality Manager at a Site with no
 * dropdown asking which role he is using. It is a rendering input, never an
 * access decision — `evaluateCCAccess` answers that at the door.
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
      screen={CC10_SCREEN}
      builtSlugs={builtSlugs()}
      actionRail={
        <Cc13ActionRail
          personName="Elena"
          scopeFilter="Site"
          heldColumns={['Quality Manager']}
          mountedOn="MOD-CC-10"
        />
      }
    >
      <p className="text-sm text-[var(--color-ink-subtle)]" data-testid="cc10-route">
        {CC10_SCREEN.id} · /command-center/{CC10_SLUG} · register row {CC10_SCREEN.registerRef} ·
        roles that can open it: {CC10_SCREEN.rolesColumn} · surface {SURFACE.id}
      </p>
      <p className="mt-4 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system.
      </p>

      <SyncConflictReviewPanel />
      <SecondTreatmentDisclosure />
    </CommandCenterShell>
  )
}
