import { test, expect } from '@playwright/test'

// The nineteen-module registry, mirrored here (not imported) since this
// spec runs against the served static export, not the source tree —
// `tests/component/sa-console.test.tsx` is the test that imports
// `SA_MODULES` directly and would fail first if this list drifted from it.
const DEFINITION_LAYER_MODULES = [
  'Platform Overview and Health',
  'Atom Registry',
  'Core Agents and Composed-Agent Review',
  'Memory Architecture',
  'Eval Harness',
  'Trace Viewer',
  'Platform Settings',
]
const OPERATIONS_LAYER_MODULES = [
  'Console Users, Roles and Change Approvals',
  'Tenants, Lifecycle and Pilots',
  'Tenant Metrics and Aggregates',
  'Tiers, Entitlements and Caps',
  'Usage and Metering',
  'Devices and Fleet',
  'Platform Notifications and Tenant Communications',
  'Support Access',
  'JBS Access',
  'Data Lifecycle and Archival',
  'Platform Audit',
  'The Tenant-Configuration Registry',
]

test('/super-admin/ renders the module index with one primary heading', async ({ page }) => {
  const response = await page.goto('/super-admin/')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Super Admin Platform Console')
})

test('/super-admin/ lists all nineteen modules under their two named, V1-labelled bands', async ({ page }) => {
  await page.goto('/super-admin/')
  await expect(page.getByRole('heading', { name: /Definition layer.*V1/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Operations layer.*V1/ })).toBeVisible()
  for (const name of [...DEFINITION_LAYER_MODULES, ...OPERATIONS_LAYER_MODULES]) {
    await expect(page.getByRole('link', { name })).toBeVisible()
  }
})

test('/super-admin/ links every module by slug — the href carries no bare SCR-SA-NN number', async ({ page }) => {
  await page.goto('/super-admin/')
  const links = page.getByRole('main').getByRole('link')
  const count = await links.count()
  expect(count).toBe(19)
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href')
    expect(href, `link ${i}`).toMatch(/^\/super-admin\/[a-z0-9-]+\/$/)
    expect(href, `link ${i}`).not.toMatch(/SCR-SA-\d+/i)
  }
})

test('/super-admin/ carries the prototype disclosure and none of the four forbidden words', async ({ page }) => {
  await page.goto('/super-admin/')
  const body = (await page.textContent('body')) ?? ''
  expect(body.toLowerCase()).toMatch(/simulated/)
  expect(body.toLowerCase()).not.toMatch(/tamper-evident/)
  expect(body.toLowerCase()).not.toMatch(/\bchained\b/)
  expect(body.toLowerCase()).not.toMatch(/\bsigned\b/)
  expect(body.toLowerCase()).not.toMatch(/\bverified\b/)
})
