import { test, expect } from '@playwright/test'
import { scannableRoutes } from '../e2e/exported-routes'
import { PINNED_BEST_PRACTICE, pinnedFor, runAxe, scanHere } from './axe-policy'
import { SA_MODULES } from '@/surfaces/sa/modules'
import { STU_MODULES } from '@/studio/modules'
import { DOH_MODULES } from '@/surfaces/doh/modules'

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

/**
 * THE PER-SURFACE FLOORS ARE DERIVED FROM THE MODULE REGISTERS, AND THE NUMBERS
 * THAT USED TO BE HERE ARE GONE RATHER THAN RENUMBERED.
 *
 * WHAT WAS WRONG. This block asserted `> 70` overall and `> 15` / `> 15` /
 * `> 19` per surface, above a comment reading "79 paths today … 18 Studio /
 * 18 Hub / 20 Super Admin / 23 elsewhere". Measured: 103 scannable — 102
 * exported `index.html` directories plus the unexported `/no-such-place/` —
 * split 18 Studio / 20 Hub / 23 Super Admin / 42 elsewhere. Three slices stale,
 * and the same comment's own argument is the finding: "a floor nobody can date
 * is a floor nobody trusts". Worse than stale prose, the floors carried 32
 * routes of slack, so NINE Hub, Studio and console routes could vanish from the
 * export with every one of them still green — a floor that cannot notice the
 * loss it exists to notice.
 *
 * WHY DERIVED AND NOT RESTATED. Restating four numbers reships the identical
 * defect with a fresher set, which is the reasoning `tests/e2e/sa-console.spec.ts`
 * and `axe-states.spec.ts` both already record. So the expectation is derived
 * from the two things that decide it: each surface's MODULE REGISTER, which
 * says which routes the build owes, and the export, which is the field under
 * test. Every routed module must have a scanned route, named individually when
 * it does not. A module added to a register is scanned on the next build with no
 * edit here; a route disappearing from the export names the module that lost it
 * rather than sliding under a threshold.
 *
 * WHAT IT DOES NOT ASSERT, deliberately. Not an equality: each surface also
 * carries routes no module register names — `/studio/journey/`,
 * `/studio/sign-in/`, `/hub/journey/`, `/super-admin/ai-incidents/` and the rest
 * — and every one of them is still scanned by the sweep below, because that
 * sweep is over the export and not over this list. This is the floor, derived;
 * the coverage is the export.
 *
 * `slug` is nullable on the Studio register alone: two modules the source
 * renders inside another module's screen carry `slug: null` and a
 * `noRouteReason`, so they owe no route and are excluded rather than expected.
 * Two Studio modules and two Hub modules share a slug with a sibling, which is
 * why the derivation goes through a `Set`.
 */
const ROUTED_MODULES: readonly { readonly id: string; readonly paths: readonly string[] }[] = [
  {
    id: 'Studio',
    paths: [
      ...new Set(
        STU_MODULES.filter((m) => m.slug !== null).map((m) => `/studio/${String(m.slug)}/`),
      ),
    ],
  },
  { id: 'Hub', paths: [...new Set(DOH_MODULES.map((m) => `/hub/${m.slug}/`))] },
  { id: 'Super Admin', paths: [...new Set(SA_MODULES.map((m) => `/super-admin/${m.slug}/`))] },
]

test('every routed module has a scanned route, and the derivation is not a stub', () => {
  // C17, and it is the guard the whole change turns on twice over: a list
  // derived from a directory that happens to be empty scans nothing and
  // passes, and so does a list derived from a register that has been renamed
  // out from under this file. `tests/e2e/routes.spec.ts` holds the
  // planted-probe proof that the ROUTE derivation actually grows; these floors
  // are over the REGISTER derivation, and they are the only bare numbers left
  // in this file — floors on emptiness, not on scale, so nothing here goes
  // stale when a surface grows.
  for (const surface of ROUTED_MODULES) {
    expect(surface.paths.length, `${surface.id}: its module register is empty or was renamed`).toBeGreaterThan(0)
  }
  const expected = ROUTED_MODULES.flatMap((s) => s.paths)
  expect(new Set(expected).size, 'two surfaces derive one route path').toBe(expected.length)
  expect(PATHS.length, 'the export walk found fewer routes than the registers owe').toBeGreaterThan(
    expected.length,
  )

  // THE ASSERTION THE FOUR FLOORS COULD NOT MAKE. Named individually, per
  // surface, so a route lost from the export reports WHICH MODULE lost it.
  for (const surface of ROUTED_MODULES) {
    expect(
      surface.paths.filter((p) => !PATHS.includes(p)),
      `${surface.id}: its module register owes these routes and the export does not carry them. ` +
        'A route that vanishes from the export is scanned by nothing, and a per-surface count ' +
        'floor cannot tell that from a surface that never had it.',
    ).toEqual([])
  }

  console.log(
    `[axe] ${PATHS.length} scannable routes (${PATHS.length - 1} exported + /no-such-place/); ` +
      ROUTED_MODULES.map((s) => `${s.id} owes ${s.paths.length}`).join(', '),
  )
})

/**
 * `expect(results.violations).toEqual([])` reads ONE of the four buckets axe
 * returns. The other three are `passes`, `inapplicable` and `incomplete` —
 * and `incomplete` is the bucket for checks axe RAN and could not decide.
 * A rule that lands there is not a rule that passed, and a suite that only
 * reads `violations` reports "no violation" while axe is saying "I could
 * not tell". Running the derived route list for the first time put a
 * real finding in exactly that bucket, on a screen nothing had ever
 * scanned, and the assertion above would never have shown it.
 *
 * So the incomplete bucket is checked unconditionally, below, on every
 * route: anything axe could not decide fails the route unless it is named
 * in `ALLOWED_INCOMPLETE_ANYWHERE`. That check does not depend on any
 * per-route exception existing — it is what catches a regression, not the
 * exception list.
 *
 * The allowance itself — `color-contrast`, and what backs it — is stated
 * once, in `./axe-policy`, and imported by this file and by
 * `axe-states.spec.ts` alike. It was written out twice for about an hour,
 * which is how an exception list grows in one copy and not the other: the
 * driven-state harness would have started allowing a rule this file still
 * failed on, or the reverse, and the first anyone would know is a route
 * passing in one harness and not the other.
 *
 * THE SECOND COPY OF THE TAG FILTER USED TO LIVE HERE. This file built its
 * own `AxeBuilder`, called `.withTags([...WCAG_TAGS])` itself, and repeated
 * the incomplete-bucket filter inline — the exact duplication the paragraph
 * above complains about, in the file that complains about it. Both are gone:
 * the scan is `scanHere` from `./axe-policy`, so the rule set, the WCAG
 * assertion, the best-practice pin and the undecided check are decided in
 * ONE place for the route scan and the driven scan alike. Widening the rule
 * set was a one-line change in one file because of it.
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
for (const path of PATHS) {
  test(`${path} has no WCAG 2.2 A or AA violation, and only its pinned best-practice ones`, async ({
    page,
  }) => {
    await page.goto(path)
    // All three buckets, in `./axe-policy`: WCAG violations empty,
    // best-practice violations EQUAL to this route's pin, and nothing
    // undecided that has no recorded reason.
    await scanHere(page, path, path)
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

/**
 * THE ASSERTION THAT RETIRES A PIN.
 *
 * `PINNED_BEST_PRACTICE` records best-practice violations this build has and
 * has not yet fixed. `scanHere` checks that nothing appears BEYOND the pin;
 * this checks the other direction, which is the one that rots if nobody
 * writes it: that every pinned rule is STILL THERE.
 *
 * Compared for EQUALITY at the route's default state. The day the `h3` at
 * `app/studio/training-library/TrainingLibraryScreen.tsx:219` becomes an
 * `h2`, this test goes red — "expected heading-order, received nothing" —
 * and the only way to make it green is to delete the row. An exception list
 * that cannot survive the fix it excuses is an exception list that cannot
 * lie about the state of the build.
 *
 * A `toContain` here would do the opposite: it would stay green forever
 * after the fix, and the pin would sit in the file telling every future
 * reader that a screen is broken when it is not.
 */
for (const path of Object.keys(PINNED_BEST_PRACTICE)) {
  test(`${path}: its pinned best-practice findings are still present, or the pin must go`, async ({
    page,
  }) => {
    await page.goto(path)
    const { bestPracticeIds } = await runAxe(page)
    expect(
      bestPracticeIds,
      `${path}: the best-practice findings here are not the ones pinned for it. If a pinned rule ` +
        'is gone, the defect was FIXED — delete its row from `PINNED_BEST_PRACTICE` rather than ' +
        'keeping an exception that outlived what it excused.',
    ).toEqual(pinnedFor(path))
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
