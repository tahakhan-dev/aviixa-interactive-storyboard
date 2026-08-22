import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Which `app/command-center/` routes exist in the tree. SERVER-ONLY.
 *
 * ── THIRTEEN COPIES, NOT FOUR ────────────────────────────────────────────
 * `CC_NAV` publishes twelve pathnames; the tree holds however many were
 * built. A rail that offered all twelve would point the unbuilt ones at a
 * 404, so the file that is IN the tree asks the tree and hands the shell a
 * finished answer — the division `app/studio/StudioShell.tsx` states.
 *
 * Every Command Center route needed that answer and every one wrote the same
 * function: `app/command-center/page.tsx` and the twelve route directories
 * beneath it, byte-identical bodies, each marked `ponytail:` by its author
 * with an instruction to hoist at "a third" or "a fourth" caller. Thirteen
 * authors each counted only the callers they could see, so the hoist was owed
 * twelve times and performed none. This is the hoist: one definition,
 * thirteen importers, zero copies.
 *
 * ── WHY `src/` AND NOT AN `app/` HELPER ──────────────────────────────────
 * Ten of the thirteen copies said the lift was blocked because "`src/` is
 * deliberately free of `node:fs`". THAT CLAIM IS FALSE and was false when
 * they were written: `src/coverage/registry-loader.ts` opens with
 * `import { readFileSync } from 'node:fs'`, and its own header states the
 * real rule, which is narrower — keep the Node-only reader in a SEPARATE
 * FILE from the pure data a client component may import, so `node:fs` is
 * never pulled into the browser bundle. This file is that separate file. It
 * exports one function, no data, and no component; nothing under
 * `src/surfaces/cc/` that a client module imports imports it.
 *
 * ── SERVER-ONLY, AND WHAT ENFORCES IT ────────────────────────────────────
 * Its importers are the thirteen route files, which are Server Components
 * reading the filesystem at build time. Bundling `node:fs` for a browser is
 * a build failure, not a silent one, so `pnpm build` is the check — the same
 * check that was the only one able to see the client-boundary defect six of
 * seven panels shipped. It carries no `'use client'` directive and must not
 * acquire one: slice 9 gate 11 forbids a client file exporting plain data,
 * and gate 10 forbids the server/`allow()` pair; a `node:fs` importer with a
 * directive would be a third shape and the build would refuse it first.
 *
 * ponytail: the listing is read at render, not written to a generated
 * registry. `tests/coverage/registry-freshness.test.ts` compares the whole
 * of `registries/generated` against a fresh run of three named generators,
 * and a fourth artefact there with no generator in that list turns a
 * coherent tree red. If this answer is ever needed outside a Server
 * Component, add a generator rather than a second directory read.
 */
export function builtSlugs(): readonly string[] {
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
