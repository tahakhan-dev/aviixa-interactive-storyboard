import type { Metadata } from 'next'
import { routeBySurface } from '@/routes/definitions'
import { builtSlugs } from '@/surfaces/cc/built-slugs'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'

// M2: sourced from the route registry, not a second hand-typed string.
export const metadata: Metadata = { title: routeBySurface('SURF-CC').title }

/**
 * The Client Command Center's surface index.
 *
 * ── THIS FILE NAMES NO MODULE IDENTIFIER, AND THAT IS DELIBERATE ────────
 *
 * Every other route in this tree names the module it serves, because a route
 * claimed by a slug is demonstrated by the claim alone and can ship without
 * ever saying what it is. This route is the exception, and inverting the rule
 * here is what keeps the rest of it true.
 *
 * `scripts/build-registries.mjs` treats any directory holding a `page.tsx` as
 * a route, `command-center` included. No module declares it as a slug, so it
 * falls to argmax over the module identifiers this file's own text names —
 * and argmax on an unclaimed route is not a preference, it is a verdict: the
 * winner is recorded as demonstrated-in-storyboard, and a TIE THROWS THE
 * BUILD outright ("A route must either name its own module more often than
 * any it cross-references, or be claimed by a slug declaration").
 *
 * A surface index that listed its thirteen modules in prose would therefore
 * either hand one of them a route it does not own or refuse the build on a
 * tie between two of them. That is the same defect the generator was fixed
 * for in slice 8 — a chrome module read demonstrated off another module's
 * screen, and the inventory reported 58 demonstrated modules where 57 are —
 * arriving through the other door.
 *
 * So the rail's identifiers come from `CC_NAV`, which is imported data. The
 * scan reads file TEXT, and a value rendered from an import is not text. The
 * page shows every module identifier a reviewer needs and contains none.
 *
 * ── WHY THE BUILT ROUTES ARE READ BY THE ROUTE AND NOT BY THE SHELL ─────
 *
 * `CC_NAV` publishes twelve pathnames and the tree holds whatever was built.
 * A rail that offered all twelve would point the unbuilt ones at a 404.
 * Which of them exist is a fact about the tree, so the route asks the tree
 * and hands the shell a finished answer — the division
 * `app/studio/StudioShell.tsx` states.
 *
 * The reading itself now lives once, in `@/surfaces/cc/built-slugs`. It was
 * spelled thirteen times — here and in every route directory below — with
 * each author's `ponytail:` note saying the hoist was blocked because "`src/`
 * is deliberately free of `node:fs`". That was never true:
 * `src/coverage/registry-loader.ts` imports `node:fs` and its header states
 * the real, narrower rule the shared module now follows. Thirteen authors
 * each counted only the callers they could see.
 */
export default function CommandCenterHome() {
  return <CommandCenterShell builtSlugs={builtSlugs()} />
}
