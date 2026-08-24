import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * `src/ui/shared/StoryboardCard.tsx` IS MOUNTED, AND ITS OWN FILE HAS TO SAY SO.
 *
 * ── THE DEFECT THIS EXISTS FOR ─────────────────────────────────────────────
 * The component's header carried a stated abstention — "nothing under `app/`
 * renders this component", written as a deliberate wave-0 choice and ending
 * with a request that whoever mounted the first storyboard close the
 * paragraph. Tasks 16, 17 and 18 mounted it on
 * `/workflows/ai-and-its-absence/` and none of them came back, so a file
 * shipped a measured claim about the tree that the tree contradicted. That is
 * the SECOND time this build shipped that exact shape — `ProvenanceMark`
 * carried the same sentence and the same rot — and `grep -rn "StoryboardCard"
 * tests/` found no reachability assertion of any kind, which is why it shipped
 * both times.
 *
 * ── WHY IT SWEEPS FOR THE MOUNT AND NOT FOR THE IMPORT ─────────────────────
 * AN IMPORT EDGE IS NOT A MOUNT. `tests/coverage/slice-11-gates.test.ts` gate
 * 12 walks the import closure, and this build PLANTED the deletion of a
 * panel's JSX with its `import` line left in place: the closure gate stayed
 * green at 54 of 54 with the panel off the page. So the field measured here is
 * the JSX element, and the import is asserted only as a companion — a mount
 * with no import would be a build error, and an import with no mount is the
 * defect.
 *
 * ── WHY IT IS AN EQUALITY AND NOT A PRESENCE CHECK ─────────────────────────
 * The sweep is derived from `app/`, and the answer it is checked against is
 * the component's OWN paragraph. Presence alone ("something mounts it") would
 * go green forever after the first mount and would never notice a second route
 * the paragraph does not name — which is the identical rot one wave later. So
 * every mounting file the sweep finds must be named in
 * `StoryboardCard.tsx`, and the paragraph must claim no abstention. Adding a
 * mount without writing its path there is RED.
 *
 * ── C17: AN ENUMERATION THAT FINDS NOTHING MUST BE RED ─────────────────────
 * The sweep carries a floor, and the matcher carries a synthesised positive
 * AND negative control, because a walk over the wrong directory returns an
 * empty list and every `every()` over it is vacuously true.
 */

const REPO = process.cwd()
const APP = join(REPO, 'app')
const CARD = 'src/ui/shared/StoryboardCard.tsx'
const CARD_SOURCE = readFileSync(join(REPO, CARD), 'utf8')

/** The JSX element, not the import specifier. `<StoryboardCard` followed by
 *  whitespace or `/` or `>` — so `<StoryboardCardHeader` can never match. */
const MOUNT_RE = /<StoryboardCard[\s/>]/
const IMPORT_RE = /from '@\/ui\/shared\/StoryboardCard'/

function tsxFilesUnder(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...tsxFilesUnder(path))
    else if (/\.tsx?$/.test(entry.name)) out.push(path)
  }
  return out
}

const APP_FILES = tsxFilesUnder(APP)
const MOUNTS = APP_FILES.filter((f) => MOUNT_RE.test(readFileSync(f, 'utf8'))).map((f) =>
  relative(REPO, f),
)
const IMPORTERS = APP_FILES.filter((f) => IMPORT_RE.test(readFileSync(f, 'utf8'))).map((f) =>
  relative(REPO, f),
)

describe('the matcher tells a mount from an import edge', () => {
  it('matches the element and refuses the import line and a longer name', () => {
    // THE POSITIVE CONTROL. Without it a regex that matches nothing makes
    // every assertion below vacuously true on an empty MOUNTS list.
    expect(MOUNT_RE.test('        <StoryboardCard storyboard={storyboard} />')).toBe(true)
    expect(MOUNT_RE.test('<StoryboardCard/>')).toBe(true)
    expect(MOUNT_RE.test('<StoryboardCard>')).toBe(true)
    // THE NEGATIVE CONTROLS, and the first is the whole point of this file:
    // the exact bytes that stayed green when a sibling panel's JSX was deleted.
    expect(MOUNT_RE.test("import { StoryboardCard } from '@/ui/shared/StoryboardCard'")).toBe(false)
    expect(MOUNT_RE.test('<StoryboardCardHeader storyboard={s} />')).toBe(false)
  })

  it('walked a populated tree', () => {
    // C17. A walk over a renamed or empty directory finds nothing and reports
    // success; this is the floor that makes the emptiness red instead.
    expect(APP_FILES.length, 'the app/ walk found no TypeScript files').toBeGreaterThan(50)
  })
})

describe('StoryboardCard is reachable from a route', () => {
  it('is MOUNTED under app/, not merely imported there', () => {
    expect(MOUNTS, 'no file under app/ renders <StoryboardCard>').not.toEqual([])
    // Every importer mounts it. An importer that does not is either dead
    // weight or a mount somebody deleted and left the import behind, which is
    // the exact shape the closure gate cannot see.
    expect(
      IMPORTERS.filter((f) => !MOUNTS.includes(f)),
      'a file imports StoryboardCard and renders no card',
    ).toEqual([])
  })

  it('names every mounting file in the component’s own reachability paragraph', () => {
    // THE ANSWER AND THE FIELD COME FROM DIFFERENT PLACES: the field is the
    // sweep above, the answer is the paragraph the component ships. A second
    // route mounting a card goes red here until the paragraph names it, which
    // is precisely what tasks 16-18 did not do.
    expect(
      MOUNTS.filter((f) => !CARD_SOURCE.includes(f)),
      `${CARD} does not name every file that mounts it`,
    ).toEqual([])
  })

  it('claims no abstention, because the tree contradicts one', () => {
    // The stale sentence, in the shapes it was written in. Held against the
    // file rather than against a banner heading: asserting that a section
    // heading is present passes on any prose beneath it, true or false, which
    // is how the sibling Frontline abstention shipped a false premise.
    expect(CARD_SOURCE).not.toMatch(/nothing under [`'"]?app\/[`'"]? renders/i)
    expect(CARD_SOURCE).not.toMatch(/closes this paragraph/i)
  })

  it('is mounted on a route, and that route is linked from somewhere else', () => {
    // Reachability by navigation, derived from the mount rather than typed. A
    // mounting screen sits in a route directory; that directory needs a
    // `page.tsx` for the route to exist at all, and some other file under
    // `app/` has to link the path or the page is one only its author finds.
    for (const mount of MOUNTS) {
      const dir = mount.slice(0, mount.lastIndexOf('/'))
      const page = readFileSync(join(REPO, dir, 'page.tsx'), 'utf8')
      const screen = mount.slice(dir.length + 1).replace(/\.tsx$/, '')
      expect(page, `${dir}/page.tsx does not render ${screen}`).toContain(`<${screen}`)

      // BOTH QUOTE STYLES, AND THAT IS NOT PEDANTRY. A `<Link href="...">`
      // attribute is double-quoted and an entry in a route record is
      // single-quoted, and this build already has a finding open against a
      // resolver that read one of the two — it shrank a closure and went
      // GREEN. Measured here by plant P3: the single-quoted form is how
      // `app/super-admin/SaConsoleShell.tsx` links its non-module route, and
      // the double-quote-only version reported it as unlinked.
      const href = `${dir.replace(/^app/, '')}/`
      const linkers = APP_FILES.filter((f) => {
        if (relative(REPO, f) === mount) return false
        const text = readFileSync(f, 'utf8')
        return text.includes(`"${href}"`) || text.includes(`'${href}'`)
      })
      expect(linkers, `nothing under app/ links ${href}`).not.toEqual([])
    }
  })
})

/* ==================================================================== *
 * THE PLANT CAMPAIGN, AS RUN.
 *
 * Each plant was spliced in, this file run with
 * `pnpm exec vitest run tests/component/storyboard-card-reachability.test.tsx`,
 * and the planted file restored and asserted byte-identical against a
 * `shasum -a 256` digest taken before the plant.
 *
 *  P1  THE DEFECT THAT SHIPPED, RE-CREATED. The old abstention sentence put
 *      back into `StoryboardCard.tsx`'s header, with the mount left in place —
 *      a file claiming nothing renders it while a route does.
 *      RED  at 'claims no abstention, because the tree contradicts one':
 *           expected 'nothing under `app/` renders this component' not to
 *           match /nothing under [`'"]?app\/[`'"]? renders/i
 *
 *  P2  THE MOUNT DELETED, THE IMPORT LEFT — the exact shape that kept a
 *      sibling reachability gate green at 54 of 54.
 *      `<StoryboardCard storyboard={storyboard} />` in
 *      `AiAndItsAbsenceScreen.tsx` replaced by a `<p>`, its import untouched.
 *      RED  at 'is MOUNTED under app/, not merely imported there':
 *           no file under app/ renders <StoryboardCard>
 *           AND at 'a file imports StoryboardCard and renders no card'.
 *      This is the plant the import-closure gate cannot fail on.
 *
 *  P3  A SECOND MOUNT ADDED AND THE PARAGRAPH NOT UPDATED — the recurrence
 *      this file exists to stop, rather than the instance it was written for.
 *      A `<StoryboardCard>` element added to a second route's screen.
 *      RED  at 'names every mounting file in the component’s own reachability
 *           paragraph': src/ui/shared/StoryboardCard.tsx does not name every
 *           file that mounts it.
 *      AND IT CAUGHT A DEFECT IN THIS FILE. It also went red at 'nothing under
 *      app/ links /super-admin/ai-incidents/' — which is FALSE:
 *      `app/super-admin/SaConsoleShell.tsx` links it, single-quoted, in its
 *      `NON_MODULE_ROUTES` record. The link check read `"${href}"` only. Fixed
 *      to read both quote styles before the plant was restored; a plant that
 *      reds for the wrong reason is one of the four this build has already
 *      shipped, and this one named its own cause.
 * ==================================================================== */
