import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'
import { scannableRoutes } from './exported-routes'

/**
 * CAN A CLIENT GET THERE BY CLICKING? — the assertion this build did not have.
 *
 * ── THE FINDING (audit round 3, `R3-06`; authority APP-016 item 1) ──────────
 * A breadth-first walk of the built export's own links, starting at `/`:
 *
 *     exported routes           102
 *     reachable from / by links  18
 *     NOT reachable              84
 *
 * All five surface roots — `/super-admin/`, `/hub/`, `/studio/`,
 * `/command-center/`, `/frontline/` — were in the 84. The entire product was
 * reachable only by typing a URL. `app/page.tsx` carried three destinations
 * and a comment asserting the surfaces "are reached from the coverage
 * dashboard and review shell"; measured, the dashboard links its own registry
 * indexes plus `/workflows/`, and `/review/` renders no anchor at all.
 *
 * ── WHY 546 GREEN TESTS WERE COMPATIBLE WITH IT ────────────────────────────
 * Every route-level assertion in `tests/e2e/` and `tests/accessibility/`
 * arrives by `page.goto(path)` over a DERIVED route list. That is the right
 * shape for "is this page accessible" and it is structurally incapable of
 * noticing that nothing links the page: a `goto` cannot tell a linked route
 * from an orphan. `tests/e2e/routes.spec.ts` sits beside this file and does
 * exactly that, which is why the two are neighbours rather than one file.
 *
 * A ROUTE REACHABLE ONLY BY `page.goto()` IS NOT REACHABLE. This is a
 * client-validation artefact whose whole purpose is that a stakeholder
 * navigates it, so this file measures the only thing that matters for that
 * purpose: what a person clicking links from the front door can get to.
 *
 * ── WHY THIS IS AN e2e SPEC AND NOT A `tests/coverage/` GATE ───────────────
 * Both were available and the choice is deliberate.
 *
 *  1. THE FIELD UNDER TEST IS THE SERVED PAGE, IN A BROWSER. The anchors a
 *     client can click are the DOM's, and the DOM is what this project ships
 *     — `output: 'export'`, hydrated React. A byte-scan of `index.html` with a
 *     regex is a MODEL of that, and a model I would then have to test.
 *     Chromium resolves the hrefs; nothing here parses HTML.
 *  2. IT REUSES WHAT IS ALREADY HERE. The `webServer` that serves the export
 *     from a snapshot, and `scannableRoutes()`, which `routes.spec.ts` and
 *     `axe.spec.ts` already derive their populations from. No new helper.
 *  3. NO NEW ORDERING OBLIGATION. A `tests/coverage/` gate needs an `AUDITED`
 *     entry in `scripts/check-gate-ordering.mjs` declaring whether `build`
 *     rewrites its subject; this file's subject is the export, `build` does
 *     rewrite it, and the honest verdict would have been the same one
 *     `slice-03-gates` files. Choosing the project that does not need the
 *     entry is not dodging the question — it is not adding a second place
 *     the same answer has to be maintained.
 *
 * The cost, stated: this runs in `test:e2e`, the last step of `verify`, so it
 * is the slowest place to learn about a broken link. Accepted — the property
 * is about a browser, and measuring it anywhere else measures something else.
 */

/**
 * A ROUTE NOTHING LINKS, AND THE WRITTEN REASON IT IS ALLOWED TO STAY THAT
 * WAY. Compared for EQUALITY by the test below, in both directions:
 *
 *   - a route that stops being linked is RED until it is entered here with a
 *     reason, and
 *   - a route entered here that IS reachable is RED until the entry is
 *     deleted, so this list cannot quietly become an excuse.
 *
 * This is the shape `tests/accessibility/axe-states.spec.ts` uses for its own
 * `unreachedRoutes`, chosen because that same audit round confirmed it is a
 * true equality in both directions. A MEMBERSHIP LIST WOULD NOT DO: a subset
 * check passes on the empty set, and this finding exists precisely because no
 * assertion of this kind existed at all.
 */
interface UnreachedRoute {
  readonly id: string
  readonly reason: string
}

const UNREACHED: readonly UnreachedRoute[] = [
  {
    id: '/404/',
    reason:
      'The exported not-found page. It is reached by requesting an address nothing exports — the static host answers that from `404.html`, and `out/404/index.html`, `out/_not-found/index.html` and `out/404.html` are BYTE-IDENTICAL in this export (one sha256 across all three). Nothing links it and nothing should: a link to the error page from the product chrome is an invitation to an error. Its accessibility is covered by route, in `tests/accessibility/axe.spec.ts`, which is the coverage this page needs and reachability is not.',
  },
  {
    id: '/_not-found/',
    reason:
      'Next.js\'s own name for the route above, exported alongside it because the app router emits both; byte-identical to `/404/` and to `404.html` in this build. It is an artefact of the framework\'s naming rather than a destination anyone authored, so there is no page that could name it without inventing a reason to. Same coverage as `/404/`: scanned by route, not reached by a link.',
  },
  {
    id: '/coverage/workflows/',
    reason:
      'The per-registry index for the workflows inventory, exported because `app/coverage/[registry]/page.tsx` enumerates all fourteen `REGISTRY_DESCRIPTORS` slugs in `generateStaticParams`. The dashboard row for that registry deliberately links `/workflows/` instead — the richer, filterable index over the same rows — and this page links `/workflows/` itself, in the paragraph at the top of it. Linking both from the dashboard would put two entry points on one registry, which is the duplication this build refuses elsewhere (see `NON_MODULE_ROUTES` in `app/super-admin/SaConsoleShell.tsx`). Recorded rather than linked, and it is an outbound-only page rather than an island: everything it points at is reached.',
  },
  {
    id: '/no-such-place/',
    reason:
      'Not a file in the export at all. `scannableRoutes()` appends it so the 404 fallback the static host serves for an unexported address is scanned for accessibility like any other page — see the doc comment on that function. No page can link an address nothing exports, and one that did would be a dangling link rather than a reachable route.',
  },
]

const UNREACHED_IDS = UNREACHED.map((u) => u.id)

/** Normalised the way the route list is: origin-relative, one trailing slash. */
function toRoute(url: string, origin: string): string | null {
  if (!url.startsWith(origin)) return null
  const path = new URL(url).pathname
  return path.endsWith('/') ? path : `${path}/`
}

/**
 * THE ENTRY PAGE'S OWN ANCHORS, READ OFF DISK, AND WHY THIS ONE PARSE EARNS
 * ITS PLACE IN A FILE THAT OTHERWISE PARSES NOTHING.
 *
 * FOUND BY PLANTING, not by reading. `playwright.config.ts` serves a SNAPSHOT
 * of `out/` (`.serve-snapshot`, copied at server start) and sets
 * `reuseExistingServer: !CI`, while `scannableRoutes()` reads the LIVE `out/`.
 * A `serve` left running from an earlier suite therefore serves an older
 * export than the one on disk. Measured: with the `/studio/sign-in/` link
 * removed from `app/studio/permissions-and-grants/PermissionsScreen.tsx` and
 * `pnpm build` re-run, this spec PASSED — the stale snapshot still carried the
 * link, and the two route sets were identical, so no assertion below could
 * see the difference. The same run went red the moment the leftover server was
 * killed. A gate that passes on the defect it exists to catch, for a reason
 * outside its own file, is the exact shape this build keeps finding in itself.
 *
 * ONE PAGE IS ENOUGH, AND IT IS THE RIGHT ONE. The whole traversal is seeded
 * from `/`, so a stale `/` is the version of this hazard that changes the
 * answer; and comparing the entry page's anchors as a SET catches a snapshot
 * that differs there at all. Doing it for all 99 routes would double the
 * cost of the run to re-detect the same one fact.
 */
function normaliseAuthoredHref(href: string): string | null {
  if (!href.startsWith('/') || href.startsWith('//')) return null
  const path = (href.split('#')[0] ?? '').split('?')[0] ?? ''
  if (path === '') return null
  return path.endsWith('/') ? path : `${path}/`
}

function entryPageHrefsOnDisk(): string[] {
  const html = readFileSync(join('out', 'index.html'), 'utf8')
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)]
    .map((m) => normaliseAuthoredHref(m[1] ?? ''))
    .filter((h): h is string => h !== null)
  return [...new Set(hrefs)].sort()
}

test('every exported route is reachable from / by clicking, or is recorded with a reason', async ({
  page,
  baseURL,
}) => {
  /* ONE CASE, AND A TRAVERSAL CANNOT BE SPLIT INTO MANY. Playwright's 90s
     default is sized for a page; this visits every reachable route in the
     export in one navigation chain, because the frontier is what the walk
     COMPUTES — a per-route case would have to be handed the answer first, and
     a harness handed the answer proves nothing. `domcontentloaded` rather
     than the default `load` keeps it to what the anchors need. */
  test.setTimeout(300_000)

  const origin = new URL(baseURL ?? 'http://localhost:4173').origin
  const all = scannableRoutes()

  // C17: every population here is DERIVED, and a derived list read off an
  // empty or half-written export scans nothing and reports success.
  expect(all.length, 'the derived route list is a stub — is `out/` built?').toBeGreaterThan(90)
  expect(UNREACHED.length, 'the recorded-unreached list was gutted').toBeGreaterThan(3)

  // THE SERVED TREE IS THE TREE ON DISK, asserted before anything is
  // concluded from it. See `entryPageHrefsOnDisk` — without this the whole
  // case can pass against a `serve` left running from an earlier suite.
  const onDisk = entryPageHrefsOnDisk()
  expect(onDisk.length, 'no anchor was parsed out of out/index.html').toBeGreaterThan(5)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  // BOTH SIDES READ THE AUTHORED ATTRIBUTE, not the resolved URL, and that is
  // the correction the first run of this assertion forced. Resolving in the
  // browser turns the layout's skip link `href="#main"` into
  // `http://localhost:4173/#main`, whose pathname is `/` — so the served side
  // carried a `/` the disk-side regex never matches, and the check went red on
  // a difference in its own two collections rather than on a stale snapshot.
  // Comparing attributes compares the same thing on both sides.
  const servedEntryHrefs = [
    ...new Set(
      (
        await page
          .locator('a[href]')
          .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''))
      )
        .map(normaliseAuthoredHref)
        .filter((h): h is string => h !== null),
    ),
  ].sort()
  expect(
    servedEntryHrefs,
    'the served entry page and out/index.html disagree — the snapshot being served is not this build (a `serve` left running on this port?)',
  ).toEqual(onDisk)

  const seen = new Set<string>(['/'])
  const queue: string[] = ['/']
  const dangling: string[] = []
  let anchors = 0

  while (queue.length > 0) {
    const route = queue.shift()!
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    // A route the walk reached and the server will not serve is a finding in
    // its own right, and it also tells the reader the served snapshot and the
    // derived list came from the same build.
    expect(response?.status(), `${route} was linked but the export does not serve it`).toBe(200)

    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href))
    anchors += hrefs.length

    for (const href of hrefs) {
      const target = toRoute(href, origin)
      if (target === null) continue // off-origin; nothing this export serves
      if (!all.includes(target)) {
        dangling.push(`${route} → ${target}`)
        continue
      }
      if (seen.has(target)) continue
      seen.add(target)
      queue.push(target)
    }
  }

  expect(anchors, 'no anchor was read out of the export at all').toBeGreaterThan(300)

  const reachable = [...seen].sort()

  // The record may not absorb a route that IS reachable — that is how
  // "unreached" stops being a measurement and starts being an excuse.
  expect(
    reachable.filter((r) => UNREACHED_IDS.includes(r)),
    'a route recorded as unreachable is in fact reachable by clicking — delete the entry, do not keep it',
  ).toEqual([])

  // EQUALITY, BOTH DIRECTIONS, over the whole export. Not a subset check: a
  // subset passes on the empty set, which is defect shape 9 in this build's
  // own list.
  expect(
    [...reachable, ...UNREACHED_IDS].sort(),
    'the export holds routes a client cannot click their way to, and nothing accounts for the difference',
  ).toEqual([...all].sort())

  // Every reason is a reason, not a shrug. Same floor as `axe-states.spec.ts`.
  for (const u of UNREACHED) {
    expect(u.reason.length, `${u.id}: an unreachable route must say WHY`).toBeGreaterThan(120)
  }

  expect(dangling, 'a link points at an address the export does not serve').toEqual([])

  console.log(
    `[reachability] ${reachable.length} of ${all.length} scannable routes reached from / ` +
      `by clicking ${anchors} anchors; ${UNREACHED.length} recorded unreachable.`,
  )
})

/* ==================================================================== *
 * THE PLANTS, AS RUN. Each: remove ONE inbound link, `pnpm build`, then
 * `pnpm exec playwright test tests/e2e/reachability.spec.ts
 * --project=chromium --workers=1`. Restore, assert the file byte-identical
 * against a `shasum -a 256` taken before the plant, rebuild, re-run green.
 *
 * P1  `app/hub/HubShell.tsx`'s `<Link href="/hub/devices/">` — the one
 *     inbound edge into `/hub/devices/`, added by this same fix — replaced
 *     with a `<span>`.
 *
 *     RED on the assertion meant: the set equality, 100 elements against
 *     101, the diff naming `/hub/devices/` as present in the derived route
 *     list and absent from both the reachable set and the recorded-unreached
 *     list, under "the export holds routes a client cannot click their way
 *     to, and nothing accounts for the difference". Not a timeout, not the
 *     anchor floor, not a 404.
 *
 * P2  The same, on `app/studio/permissions-and-grants/PermissionsScreen.tsx`'s
 *     `<Link href="/studio/sign-in/">`.
 *
 *     PASSED. That is why the served-tree assertion above exists: a `serve`
 *     left running on port 4173 from an earlier suite was still serving the
 *     PREVIOUS `.serve-snapshot`, which carried the link, and the two route
 *     sets were identical either way so nothing here could see it. Killing
 *     the leftover server and re-running the identical plant went RED on the
 *     set equality, naming `/studio/sign-in/`. The plant found a hole in the
 *     gate before it found the hole in the build, which is the whole reason
 *     for planting rather than reading.
 *
 * P3  THE HOLE P2 OPENED, PLANTED DIRECTLY. `pnpm serve:out` was started by
 *     hand over a good export, then `app/page.tsx`'s `/studio/journey/` href
 *     was changed to `/studio/journey-PLANTED/` and `pnpm build` re-run, so
 *     the disk export and the served snapshot genuinely disagreed.
 *
 *     RED on the served-tree assertion, under "the served entry page and
 *     out/index.html disagree — the snapshot being served is not this build
 *     (a `serve` left running on this port?)". Restored, digest asserted
 *     byte-identical, server killed, rebuilt, re-run green.
 * ==================================================================== */
