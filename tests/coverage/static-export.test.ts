import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, sep } from 'node:path'
import { isForeignProbe, isOrphanProbe } from '../probe-paths'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'

const OUT = join(process.cwd(), 'out')

/**
 * The one probe convention, hoisted into `tests/probe-paths.ts` — a scratch
 * probe belonging to a CONCURRENT process is skipped, so this scan is blind
 * to every probe but the ones it plants itself. That file carries the full
 * account, including why the match is EXACT and never a prefix.
 */
function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

describe('static export', () => {
  it('emits an out/ directory', () => {
    expect(existsSync(OUT)).toBe(true)
  })

  it('emits index.html and 404.html', () => {
    expect(existsSync(join(OUT, 'index.html'))).toBe(true)
    expect(existsSync(join(OUT, '404.html'))).toBe(true)
  })

  it('contains no server-only artifacts', () => {
    // Next 16 emits `_clientMiddlewareManifest.js` unconditionally under
    // `output: 'export'`, even though real middleware cannot exist there
    // (a middleware.ts source file throws at build time under static
    // export). Allowlisted by exact basename only, so any other
    // middleware-named file - any casing - still fails this check.
    const KNOWN_BENIGN = new Set(['_clientMiddlewareManifest.js'])
    const FORBIDDEN = /\/api\/|middleware|\.node$|server\.js$/i

    const files = walk(OUT)
    const forbidden = files.filter(
      (f) => !KNOWN_BENIGN.has(basename(f)) && FORBIDDEN.test(f),
    )
    expect(forbidden).toEqual([])
  })
})

/* -------------------------------------------------------------------- *
 * THE ROUTE POPULATION OF THE WHOLE EXPORT, DERIVED.
 *
 * `tests/e2e/routes.spec.ts` floors its derived route list at `> 50` against
 * an actual 70. Twenty routes could stop building and stay green — and
 * because `tests/e2e/exported-routes.ts` derives that population FROM `out/`
 * itself, a route that stops building simply leaves the population rather
 * than going red. Every axe scan, every same-origin proof and every
 * single-`h1` check silently stops covering it. That is the same defect one
 * level up that the hand-written path list was replaced to fix.
 *
 * The floor cannot be raised into an equality inside the e2e suite without
 * an expectation from OUTSIDE `out/`, so the equality is asserted here, in
 * the release project, where `pnpm verify` reaches it without a browser.
 *
 * THE EXPECTATION IS NOT TAKEN FROM THE SUBJECT. The subject is `out/`. The
 * expectation is `app/**\/page.tsx` — the authored tree — with the one
 * dynamic segment expanded through `REGISTRY_DESCRIPTORS`, the module
 * vocabulary the route's own `generateStaticParams` reads. A count read out
 * of `out/` would prove only that the export equals itself.
 *
 * ORDERING (item 0.9): of the steps in `pnpm verify`, only `build` writes
 * `out/`, and nothing writes `app/` or `src/coverage/descriptors.ts`. The
 * two sides are never authored by the same step.
 * -------------------------------------------------------------------- */

/**
 * The two routes Next emits that no `page.tsx` authors. Named, and fixed at
 * exactly two: a third appearing turns this red and forces the decision
 * rather than quietly widening the exception.
 */
const FRAMEWORK_ROUTES = ['/404/', '/_not-found/'] as const

function authoredRoutes(): readonly string[] {
  const routes = walk(join(process.cwd(), 'app'))
    .filter((f) => basename(f) === 'page.tsx')
    .map((f) => relative(join(process.cwd(), 'app'), dirname(f)))
    .map((rel) => (rel === '' ? '/' : `/${rel.split(sep).join('/')}/`))
    .flatMap((route) => {
      if (!route.includes('[')) return [route]
      // The ONE dynamic route this build has. A second one must be taught
      // here rather than silently dropping its whole expansion out of the
      // expected population -- which is why this throws instead of skipping.
      if (!route.includes('[registry]')) {
        throw new Error(
          `${route} is a dynamic route this gate does not know how to expand. Teach it the ` +
            'route’s own generateStaticParams source, the way [registry] reads ' +
            'REGISTRY_DESCRIPTORS.',
        )
      }
      return REGISTRY_DESCRIPTORS.map((d) => route.replace('[registry]', d.slug))
    })
  return [...routes, ...FRAMEWORK_ROUTES].sort()
}

function exportedRouteDirs(): readonly string[] {
  return walk(OUT)
    .filter((f) => basename(f) === 'index.html')
    .map((f) => relative(OUT, dirname(f)))
    .map((rel) => (rel === '' ? '/' : `/${rel.split(sep).join('/')}/`))
    .sort()
}

describe('the export holds exactly the routes app/ authors', () => {
  // RED when: a page stops exporting, a page is authored and never exported,
  // or a dynamic route grows a slug the vocabulary does not name. The
  // non-vacuity halves are asserted first: a derivation over an empty tree
  // and a subject over an empty tree would agree with each other.
  it('derives a non-empty population from both the authored tree and the export', () => {
    expect(authoredRoutes().length, 'no page.tsx found under app/').toBeGreaterThan(50)
    expect(exportedRouteDirs().length, 'out/ holds no index.html — run `pnpm build`').toBeGreaterThan(
      50,
    )
    // The dynamic route must actually expand, or the equality below could be
    // satisfied by a build that stopped emitting all fourteen.
    expect(REGISTRY_DESCRIPTORS.length).toBeGreaterThan(1)
    expect(authoredRoutes()).toContain(`/coverage/${REGISTRY_DESCRIPTORS[0]?.slug ?? ''}/`)
  })

  it('exports every authored route and no others', () => {
    expect(
      exportedRouteDirs(),
      'the static export no longer matches the routes authored under app/. A route on the ' +
        'authored side only stopped exporting — and it leaves the derived e2e/axe population ' +
        'silently, rather than failing anything. A route on the export side only has no author.',
    ).toEqual(authoredRoutes())
  })
})

/* -------------------------------------------------------------------- *
 * A PROBE IN THE SHIPPED ARTEFACT.
 *
 * Everything else in this class has been a TEST seeing a probe. This is a
 * probe becoming part of the PRODUCT, and it is the most serious instance
 * found: `next build` does NOT clear `out/`. Measured directly — a
 * `.zz-probe-<pid>/index.html` and a plain `zz-marker.txt` planted in `out/`
 * both survived a full `pnpm build`, and the export's route count went 70 to
 * 71 because the probe's `index.html` is a route like any other. The e2e and
 * axe route populations are DERIVED from `out/`, so they then invent cases
 * for a page that is nobody's screen.
 *
 * WHY THIS GATE KEYS ON ORPHANS AND NOT ON EVERY PROBE. A LIVE probe under
 * `out/` belongs to a running sibling — `slice-04-gates` and `slice-05-gates`
 * both plant one there to prove their own gates can fail — and failing on it
 * would re-open the very race this whole item closed. An ORPHAN belongs to
 * nobody: no `finally` and no exit handler will ever remove it, `.gitignore`
 * hides it from `git status`, and `isForeignProbe` hides it from every other
 * gate at once. That is precisely how one sat in `app/super-admin/`
 * unnoticed, and in `out/` it ships.
 *
 * WHAT THIS GATE DOES NOT CLOSE, stated rather than implied: a probe that is
 * live AT BUILD TIME is still wrong in `out/`, because the artefact outlives
 * the test that made it, and no concurrent gate can tell that case apart from
 * a sibling's plant three milliseconds ago. The durable fix is for the build
 * to start from a clean `out/`, which is `package.json` / `scripts/**` and
 * belongs to another path list. Recorded in the task report as a finding.
 *
 * `scripts/build-registries.mjs` carries the same orphan refusal for `app/`
 * and `src/`; this is the `out/` half, which nothing covered.
 * -------------------------------------------------------------------- */

/** Every entry name under `out/`, probes INCLUDED — the one walk that must see them. */
function allExportEntries(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // Deliberately NOT `isForeignProbe`: this is the scan whose whole subject
    // is the probes every other scan hides. `isOrphanProbe` below is what
    // keeps a live sibling's plant from failing a correct build.
    const full = join(dir, entry.name)
    acc.push(full)
    if (entry.isDirectory()) allExportEntries(full, acc)
  }
  return acc
}

describe('the shipped export carries no orphaned scratch probe', () => {
  // RED when: a probe is left in `out/` by a run that crashed, or by a build
  // that inherited one, and then ships. The non-vacuity half is asserted in
  // the same case: a scan of an empty export would find no orphan either.
  it('scans a non-empty export and finds no probe nobody owns', () => {
    const entries = allExportEntries(OUT)
    expect(entries.length, 'out/ is empty — run `pnpm build`').toBeGreaterThan(50)
    expect(
      entries.filter((f) => isOrphanProbe(basename(f))),
      'a scratch probe from a dead process is in the static export. It is invisible to ' +
        '`git status` and to every other gate, and `next build` does not clear out/, so it ' +
        'ships. Delete it.',
    ).toEqual([])
  })
})
