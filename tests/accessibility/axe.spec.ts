import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { scannableRoutes } from '../e2e/exported-routes'

// C1: this list used to be WRITTEN BY HAND, and its own comment claimed it
// was "every route in the 25-page export (24 distinct paths)". It was last
// correct for slice 2b. Slice 3 then added nineteen `/super-admin/<module>/`
// routes and slice 4 added nine `/hub/<module>/` ones, and none of those
// twenty-eight was ever scanned -- no axe pass, no single-`h1` check, no
// skip-link check -- while the suite stayed green and the AA claim kept
// being quoted. Spec §8 requires WCAG 2.2 AA on every route and state.
//
// It is DERIVED now. See `tests/e2e/exported-routes.ts`: every directory in
// the export holding an `index.html`, plus the unexported address the host
// answers from `404.html`. A new route is scanned the moment `pnpm build`
// emits it, with no edit here.
const PATHS = scannableRoutes()

test('the scanned route list is derived from the export, and is not a stub', () => {
  // The vacuity guard this whole change turns on: a list derived from a
  // directory that happens to be empty scans nothing and passes, which is
  // the hand list's defect wearing a walk. `tests/e2e/routes.spec.ts` holds
  // the planted-probe proof that the derivation actually grows; this pins
  // the floor at the scale the export has had since slice 3. 54 paths today.
  expect(PATHS.length).toBeGreaterThan(50)
  expect(PATHS.filter((p) => p.startsWith('/hub/')).length).toBeGreaterThan(9)
  expect(PATHS.filter((p) => p.startsWith('/super-admin/')).length).toBeGreaterThan(19)
})

/**
 * `expect(results.violations).toEqual([])` reads ONE of the four buckets axe
 * returns. The other three are `passes`, `inapplicable` and `incomplete` —
 * and `incomplete` is the bucket for checks axe RAN and could not decide.
 * A rule that lands there is not a rule that passed, and a suite that only
 * reads `violations` reports "no violation" while axe is saying "I could
 * not tell". Running the derived 54-route list for the first time put a
 * real finding in exactly that bucket, on a screen nothing had ever
 * scanned, and the assertion above would never have shown it.
 *
 * So the incomplete bucket is checked unconditionally, below, on every
 * route: anything axe could not decide fails the route unless it is named
 * in `ALLOWED_INCOMPLETE_ANYWHERE`. That check does not depend on any
 * per-route exception existing — it is what catches a regression, not the
 * exception list.
 *
 * `color-contrast` is allowed EVERYWHERE, and this is the stated ceiling:
 * axe declines to compute a ratio for an element whose content is only
 * non-text characters (every `StatusPill` glyph is an `aria-hidden` `●`,
 * which is decorative by construction — the pill's meaning is in its
 * required sibling label) and for a text box it judges partly obscured by
 * or overlapping a neighbour. What backs the allowance is that the ratios
 * are computed NUMERICALLY elsewhere rather than assumed: the six status
 * tones are measured on the darkest surface they render on by
 * `tests/unit/token-contrast.test.ts`, and the ink tokens run 5.57:1
 * (`--color-ink-subtle` on `--color-surface-sunken`) to 17.85:1. The
 * ceiling that remains: a FUTURE colour pair that axe also declines to
 * compute would be allowed here too, and only the token measurement would
 * catch it.
 *
 * Everything else must be gone from the incomplete bucket or the route
 * goes red — including, as of this build, `aria-prohibited-attr` on
 * `/hub/qualification-calendar/`: fifty empty calendar cells used to
 * render `<span aria-label="none expiring">—</span>`, prohibited because a
 * bare `span`'s implicit `generic` role takes no accessible name (WCAG 2.2
 * §4.1.2, §1.3.1). That was carried here as a route-specific pin — a
 * documented, deliberately temporary exception — while the fix waited on
 * the screen owner. The screen owner has since fixed it (`role="img"` on
 * the same span, in the same loop, in
 * `app/hub/qualification-calendar/QualificationCalendarScreen.tsx`), axe
 * no longer lists the rule as incomplete on that route, and the pin was
 * deleted rather than kept as an empty fixture — see git history for the
 * shape of a route-specific pin (`PinnedIncomplete`) if a future finding
 * needs one again. The unconditional check below still fails on any route
 * where a prohibited ARIA attribute — or anything else undecided — shows
 * up unexplained, this one included.
 */
const ALLOWED_INCOMPLETE_ANYWHERE: readonly string[] = ['color-contrast']

for (const path of PATHS) {
  test(`${path} has no WCAG 2.2 A or AA violation`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])

    // The undecided bucket. Unconditional: no route gets a pass here
    // unless the rule is in `ALLOWED_INCOMPLETE_ANYWHERE` above. This is
    // what would go red if `aria-prohibited-attr`, or anything else axe
    // cannot decide, showed up on any route — this one included.
    const undecided = results.incomplete.map((r) => r.id)
    expect(
      undecided.filter((id) => !ALLOWED_INCOMPLETE_ANYWHERE.includes(id)).sort(),
      `${path}: axe could not decide a rule nothing has recorded a reason for`,
    ).toEqual([])
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
// -- an input, two selects, a textarea and four buttons -- and had no
// keyboard coverage at all. Proves every one of those controls is reachable
// by Tab and operable from the keyboard alone, with no mouse interaction.
//
// Fix round 1 (review, Major 1): the severity select is new -- `severity`
// used to be hardcoded with no control at all. Added to this test's tab
// sequence between the surface select and the note textarea, matching
// where it actually sits in the form; leaving it unproven here would be
// exactly the kind of interactive control with no keyboard coverage this
// test exists to catch.
test('/review/ input, selects, textarea and buttons are all keyboard-reachable and operable', async ({ page }) => {
  await page.goto('/review/')

  const reviewerInput = page.getByLabel('Reviewer name')
  const surfaceSelect = page.getByLabel('Which surface this note is about')
  const severitySelect = page.getByLabel('Severity')
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
  await expect(severitySelect).toBeFocused()

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
