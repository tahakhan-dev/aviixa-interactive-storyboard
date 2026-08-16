import { test, expect } from '@playwright/test'

test('every registry index route renders from the static export', async ({ page }) => {
  const slugs = [
    'modules', 'features', 'sub-features', 'functions', 'workflows',
    'business-use-cases', 'business-objects', 'events', 'commands',
    'notifications', 'offline-scenarios', 'ai-storyboards',
    'scheduled-work', 'actionable-controls',
  ]
  for (const s of slugs) {
    const res = await page.goto(`/coverage/${s}/`)
    expect(res?.status(), s).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  }
})

test('the workflow index renders and states its reconciled count honestly', async ({ page }) => {
  await page.goto('/workflows/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  // 81 is the module count and must never be presented as a workflow total.
  const body = (await page.textContent('body')) ?? ''
  expect(body).not.toMatch(/81\s+workflows/i)
})
