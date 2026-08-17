import { test, expect } from '@playwright/test'

test('the review route has its own page title', async ({ page }) => {
  await page.goto('/review/')
  await expect(page).toHaveTitle(/client review/i)
})

test('the review route still has one primary heading and a main landmark', async ({ page }) => {
  await page.goto('/review/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('main')).toBeVisible()
})
