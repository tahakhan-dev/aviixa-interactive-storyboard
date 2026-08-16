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

test('no request leaves the origin after load', async ({ page }) => {
  const foreign: string[] = []
  page.on('request', (req) => {
    const url = new URL(req.url())
    if (url.origin !== 'http://localhost:4173') foreign.push(req.url())
  })
  await page.goto('/hub/')
  await page.waitForLoadState('networkidle')
  expect(foreign).toEqual([])
})
