import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// I4 (final review): this used to cover exactly the 7 routes slice 1
// shipped. Slice 2b added 17 more (`/coverage/` and its fourteen registry
// indexes, `/workflows/`, `/review/`) and none of them ever got an axe,
// skip-link, or keyboard check -- `/review/` is the only interactive route
// in the whole build and had ZERO e2e coverage. Spec §8 requires WCAG 2.2 AA
// on every route and state; this is now every route in the 25-page export
// (24 distinct paths -- `/404.html`/`/_not-found/` both render the same
// not-found content `/no-such-place/` already exercises).
const REGISTRY_SLUGS = [
  'modules', 'features', 'sub-features', 'functions', 'workflows',
  'business-use-cases', 'business-objects', 'events', 'commands',
  'notifications', 'offline-scenarios', 'ai-storyboards',
  'scheduled-work', 'actionable-controls',
]

const PATHS = [
  '/',
  '/super-admin/',
  '/hub/',
  '/studio/',
  '/command-center/',
  '/frontline/',
  // I6: spec section 5.1 requires a generated ACCESSIBLE 404, and section 9
  // sets the AA bar over the whole surface census -- the not-found page is
  // part of that census and must not be the one page nothing checks.
  '/no-such-place/',
  '/coverage/',
  ...REGISTRY_SLUGS.map((s) => `/coverage/${s}/`),
  '/workflows/',
  '/review/',
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

// I4 (final review): `/review/` is the only interactive route in this build
// -- an input, a select, a textarea and four buttons -- and had no keyboard
// coverage at all. Proves every one of those controls is reachable by Tab
// and operable from the keyboard alone, with no mouse interaction.
test('/review/ input, select, textarea and buttons are all keyboard-reachable and operable', async ({ page }) => {
  await page.goto('/review/')

  const reviewerInput = page.getByLabel('Reviewer name')
  const surfaceSelect = page.getByLabel('Which surface this note is about')
  const noteTextarea = page.getByLabel('Note', { exact: true })
  const acceptButton = page.getByRole('button', { name: 'Accept for client review' })
  const needsChangeButton = page.getByRole('button', { name: 'Needs change' })
  const questionButton = page.getByRole('button', { name: 'Question' })
  const commentButton = page.getByRole('button', { name: 'Comment' })

  await reviewerInput.focus()
  await expect(reviewerInput).toBeFocused()
  await page.keyboard.type('Keyboard Reviewer')

  await page.keyboard.press('Tab')
  await expect(surfaceSelect).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(noteTextarea).toBeFocused()
  await page.keyboard.type('Reached and filled from the keyboard alone.')

  await page.keyboard.press('Tab')
  await expect(acceptButton).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(needsChangeButton).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(questionButton).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(commentButton).toBeFocused()

  // Activating a focused button from the keyboard (Enter) actually submits.
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Notes recorded this session' })).toBeVisible()
  await expect(page.getByText('Comment', { exact: true }).last()).toBeVisible()
})
