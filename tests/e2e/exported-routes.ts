import { readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * EVERY ROUTE IN THE STATIC EXPORT, READ FROM THE EXPORT.
 *
 * THE DEFECT. `tests/accessibility/axe.spec.ts` and `tests/e2e/routes.spec.ts`
 * each carried a HAND-WRITTEN path list. The axe list was last edited for
 * slice 2b and its own comment claimed it was "every route in the 25-page
 * export (24 distinct paths)". By the time slice 4 shipped, the export held
 * 52 distinct paths: slice 3 added nineteen `/super-admin/<module>/` routes
 * and slice 4 added nine `/hub/<module>/` ones, and NOT ONE of those
 * twenty-eight was ever axe-scanned, checked for a single `h1`, or checked
 * for a skip link. `routes.spec.ts` was worse — seven paths, none of them a
 * module route — so its same-origin / GET-HEAD-only / no-`/api` proof had
 * never touched a slice-3 or slice-4 screen either. The suite was 95/95
 * green and the claim it was quoted for, "WCAG 2.2 AA on every route", was
 * false over more than half the build.
 *
 * It is the same shape slice 4's gate 3 exists to catch one level up — an
 * enumeration maintained by hand, with no way to notice when it falls
 * behind what it covers — and it is fixed the same way: the list is
 * DERIVED. A tenth Hub module, a twentieth console module or a whole new
 * surface is scanned the moment `pnpm build` emits its `index.html`, with
 * no edit here and none in either spec.
 *
 * WHAT COUNTS AS A ROUTE: any directory under the export root that holds an
 * `index.html`, plus the root itself. `_next/` is the only exclusion — it
 * is the asset tree, and it holds no `index.html` anyway, so the exclusion
 * is belt-and-braces rather than load-bearing.
 *
 * `/404/` and `/_not-found/` are NOT excluded. They are exported pages and
 * the accessible-404 requirement (spec §5.1, §9) applies to them; the hand
 * list skipped both on the reasoning that `/no-such-place/` renders the
 * same content, which is exactly the kind of reasoning that stops being
 * true without anything going red. Scanning all three costs seconds and
 * removes an exclusion nobody would maintain.
 *
 * Pure over `root` so its own behaviour can be proved against a synthesised
 * tree — see `tests/e2e/routes.spec.ts`, which plants a directory and
 * asserts the route appears, then asserts it is gone once removed. A route
 * list derived from a directory that happens to be EMPTY is the same
 * family of defect as the hand list, so every caller pins a floor.
 */
export function exportedRoutes(root = 'out'): string[] {
  if (!existsSync(root)) throw new Error(`No static export at ${root} — run \`pnpm build\` first.`)
  const routes: string[] = []

  const walk = (dir: string, prefix: string): void => {
    if (existsSync(join(dir, 'index.html'))) routes.push(prefix)
    for (const entry of readdirSync(dir)) {
      if (entry === '_next') continue
      const child = join(dir, entry)
      if (statSync(child).isDirectory()) walk(child, `${prefix}${entry}/`)
    }
  }

  walk(root, '/')
  return routes.sort()
}

/**
 * The derived list plus the one path that is NOT a file in the export: an
 * address nothing exports, which the static host answers from `404.html`.
 * Spec §5.1 requires that fallback to be accessible too, and it is the only
 * route no directory walk can discover.
 */
export function scannableRoutes(root = 'out'): string[] {
  return [...exportedRoutes(root), '/no-such-place/']
}
