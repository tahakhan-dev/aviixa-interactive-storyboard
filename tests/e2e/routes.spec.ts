import { test, expect } from '@playwright/test'

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

// I7 (partial): full build-manifest path allowlisting per spec section 5.5
// is DEFERRED to the release slice -- this proves same-origin-only,
// GET/HEAD-only, no-/api traffic across every slice-1 surface plus the
// entry and not-found pages, not yet a full frozen-manifest path allowlist.
const NO_NETWORK_PATHS = ['/', ...SURFACE_ROUTES.map((r) => r.path), '/no-such-place/']

for (const path of NO_NETWORK_PATHS) {
  test(`${path} makes no foreign-origin, non-GET/HEAD, or /api request`, async ({ page }) => {
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
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect(offenders).toEqual([])
  })
}
