import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PATHS = [
  '/',
  '/super-admin/',
  '/hub/',
  '/studio/',
  '/command-center/',
  '/frontline/',
]

for (const path of PATHS) {
  test(`${path} has no WCAG 2.2 A or AA violation`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test(`${path} exposes exactly one level-1 heading`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })

  test(`${path} reaches a skip link with the first Tab press`, async ({ page }) => {
    await page.goto(path)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  })
}
