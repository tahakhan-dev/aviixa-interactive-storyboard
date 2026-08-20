import { test, expect } from '@playwright/test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { exportedRoutes, scannableRoutes } from './exported-routes'

// The five slice-1 surface roots, and the one claim about them a derived
// list cannot make: that each renders ITS OWN name. Every other assertion
// in this file is derived — see `./exported-routes.ts`.
const SURFACE_ROUTES = [
  { path: '/super-admin/', heading: 'Super Admin Platform Console' },
  { path: '/hub/', heading: 'Delivery Operations Hub' },
  { path: '/studio/', heading: 'Standards and Operations Studio' },
  { path: '/command-center/', heading: 'Client Command Center' },
  { path: '/frontline/', heading: 'Frontline Worker Application' },
]

for (const { path, heading } of SURFACE_ROUTES) {
  test(`${path} renders from the static export with one primary heading`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
  })
}

test('an unknown route renders the accessible not-found page', async ({ page }) => {
  await page.goto('/no-such-place/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
})

/* -------------------------------------------------------------------- *
 * C1. This file used to hand-name SEVEN paths, none of them a module
 * route, so the network proof below had never once run against a slice-3
 * console module or a slice-4 Hub screen — the twenty-eight densest pages
 * in the build. The path list is DERIVED now, from the export itself.
 *
 * Spec §5.5's full frozen-manifest path allowlist is still deferred; what
 * this proves is same-origin-only, GET/HEAD-only, no-`/api` traffic, and it
 * now proves it on EVERY exported route rather than on seven of fifty-three.
 * The status check is folded into the same case rather than run as a second
 * navigation: one page load answers both questions.
 * -------------------------------------------------------------------- */

const ALL_ROUTES = scannableRoutes()

test('the route list is derived from the export, and is not a stub', () => {
  expect(ALL_ROUTES.length).toBeGreaterThan(50)
  for (const { path } of SURFACE_ROUTES) expect(ALL_ROUTES).toContain(path)
})

test('PLANTED: a directory that appears in the export appears in the route list', () => {
  // The proof that the derivation is a derivation. Run against a
  // synthesised tree in the OS temp directory, never against `out/` — the
  // e2e project runs four workers in parallel and each computes this list
  // at import time, so planting inside the real export would race them.
  const root = mkdtempSync(join(tmpdir(), 'route-derivation-'))
  try {
    writeFileSync(join(root, 'index.html'), '<html></html>')
    mkdirSync(join(root, 'surface', 'module'), { recursive: true })
    mkdirSync(join(root, '_next', 'static'), { recursive: true })
    writeFileSync(join(root, '_next', 'static', 'index.html'), '<html></html>')

    // Before: the nested directory holds no page, so it is not a route.
    expect(exportedRoutes(root)).toEqual(['/'])

    // After: the same walk, no edit to it, picks the new page up.
    writeFileSync(join(root, 'surface', 'module', 'index.html'), '<html></html>')
    expect(exportedRoutes(root)).toEqual(['/', '/surface/module/'])

    // And the asset tree is never a route, however many files it holds.
    expect(exportedRoutes(root)).not.toContain('/_next/static/')

    // Restored: remove the page again and the route goes with it.
    rmSync(join(root, 'surface', 'module', 'index.html'))
    expect(exportedRoutes(root)).toEqual(['/'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const path of ALL_ROUTES) {
  test(`${path} serves 200 and makes no foreign-origin, non-GET/HEAD, or /api request`, async ({ page }) => {
    const offenders: string[] = []
    page.on('request', (req) => {
      const url = new URL(req.url())
      const method = req.method()
      if (
        url.origin !== 'http://localhost:4173' ||
        !['GET', 'HEAD'].includes(method) ||
        url.pathname.startsWith('/api')
      ) {
        offenders.push(`${method} ${req.url()}`)
      }
    })
    const response = await page.goto(path)
    // `/no-such-place/` is the one path with no exported file: the host
    // answers it from `404.html`, which is a 404 by design.
    expect(response?.status()).toBe(path === '/no-such-place/' ? 404 : 200)
    await page.waitForLoadState('networkidle')
    expect(offenders).toEqual([])
  })
}
