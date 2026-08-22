import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { routeBySurface } from '@/routes/definitions'
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
 * ── WHY THE BUILT ROUTES ARE READ HERE AND NOT IN THE SHELL ─────────────
 *
 * `CC_NAV` publishes twelve pathnames and the tree holds one directory. A
 * rail that offered all twelve would point eleven links at a 404. Which of
 * them exist is a fact about the tree, so the file that is IN the tree asks
 * it and hands the shell a finished answer — the division
 * `app/studio/StudioShell.tsx` states and the one that keeps `src/` free of
 * `node:fs`.
 *
 * ponytail: the listing is read at render, not written to a generated
 * registry. `tests/coverage/registry-freshness.test.ts` compares the whole of
 * `registries/generated` against a fresh run of three named generators, and a
 * fourth artefact there with no generator in that list turns a coherent tree
 * red — and neither that file nor `package.json` is this task's. If this
 * surface ever needs the answer at a second place, generate it there instead
 * of reading the directory twice.
 */
function builtSlugs(): readonly string[] {
  const dir = join(process.cwd(), 'app', 'command-center')
  // `withFileTypes` rather than a `statSync` per entry: it answers
  // "directory?" from the one readdir syscall, so a sibling suite deleting
  // its scratch probe between the listing and the stat cannot ENOENT a
  // correct build. The probes carry no `page.tsx` and are dropped by the
  // second filter regardless.
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(dir, name, 'page.tsx')))
    .sort()
}

export default function CommandCenterHome() {
  return <CommandCenterShell builtSlugs={builtSlugs()} />
}
