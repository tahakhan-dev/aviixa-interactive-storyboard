import type { Metadata } from 'next'
import { surfaceById } from '@/domain/surfaces'
import { SyncConflictReviewPanel } from '@/surfaces/cc/modules/cc-10/SyncConflictReviewPanel'
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
 * It renders no resolution control. The Command Center is a cockpit and owns
 * no operational record: resolving a sync conflict is action 5 of the closed
 * operational action set, executed against sync-conflict records on the
 * Delivery Operations Hub (L38175, L38669). The owning module of that set is
 * slice 9's and appears in no row of the screen register, so the seam is
 * declared rather than stubbed — `@/surfaces/cc/seams` carries it and the
 * panel renders it.
 *
 * There is no shell here either. `MOD-CC-02` is the surface chrome and the
 * live shift board that hosts it is slice 9's; inventing a Command Center
 * shell now would be a second spelling of one slice 9 will write.
 */
export default function Page() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        {SURFACE.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{CC10_SCREEN.name}</h1>
      <p className="mt-3 max-w-prose text-[var(--color-ink-muted)]">{CC10_SCREEN.purpose}</p>
      <p className="mt-2 text-sm text-[var(--color-ink-subtle)]" data-testid="cc10-route">
        {CC10_SCREEN.id} · /command-center/{CC10_SLUG} · register row {CC10_SCREEN.registerRef} ·
        roles that can open it: {CC10_SCREEN.rolesColumn}
      </p>
      <p className="mt-6 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        Simulated behaviour only. This surface is a client-validation storyboard, not a connected
        production system.
      </p>

      <SyncConflictReviewPanel />
    </main>
  )
}
