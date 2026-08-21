import { expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * THE ONE ACCESSIBILITY POLICY BOTH HARNESSES READ.
 *
 * `axe.spec.ts` scans every exported route at its default state.
 * `axe-states.spec.ts` drives every derived control position and scans
 * there. They had the same tag list and the same incomplete-bucket rule
 * written out twice for about an hour, which is how an exception list grows
 * in one copy and not the other. One copy, imported by both.
 */

/**
 * THESE TAGS NO LONGER FILTER THE SCAN. THEY CLASSIFY ITS RESULT.
 *
 * WHAT THEY USED TO DO, AND WHAT IT COST. `runAxe` called
 * `.withTags([...WCAG_TAGS])`, and so did `axe.spec.ts` in its own second
 * copy. A tag list passed to `withTags` is a RULE FILTER: axe runs only the
 * rules carrying one of those tags and never evaluates the rest. Every axe
 * rule tagged `best-practice` and nothing else was therefore invisible to
 * the ENTIRE Playwright harness — the route scan and the state-driving scan
 * alike — and "invisible" meant it could not appear in `violations`, in
 * `incomplete`, or in any count either suite reported.
 *
 * That is not a theoretical hole. Two empty table headers shipped on the
 * run-scheduling board and were caught by the COMPONENT harness, which does
 * not filter, while both route suites stayed green. `empty-table-header` is
 * tagged `best-practice` only. The headers are fixed; the blindness was not,
 * until this change.
 *
 * MEASURED BEFORE THE CHANGE, NOT ASSUMED. Every one of the 79 scannable
 * routes was scanned once with no tag restriction at all. The whole build
 * carries exactly ONE violation that the filter was hiding —
 * `heading-order`, one node, on `/studio/training-library/` — and the
 * undecided bucket gained nothing: untagged `incomplete` is still
 * `color-contrast` and nothing else. The blindness was real and wide; what
 * was hiding behind it was one defect. Both halves of that sentence are the
 * finding.
 *
 * AND THE BLINDNESS ITSELF IS PROVEN, not inferred from the count. Three
 * best-practice-only rules — `empty-table-header`, `heading-order`,
 * `landmark-unique` — were planted into a live page and scanned twice, once
 * with the filter and once without. All three were reported untagged; NONE
 * of the three appeared under the filter, in either bucket. A low count from
 * a scan that cannot see is worth nothing, so the scan was shown to see
 * first.
 *
 * `runAxe` now passes no tags, so axe runs every rule it enables by default:
 * WCAG A/AA and best-practice together. The list below survives to sort the
 * findings into the two buckets `scanHere` asserts on separately — a
 * best-practice violation is real and is asserted, but it is not a WCAG 2.2
 * AA failure and must never be reported to a client as one.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const

/** A rule is a WCAG finding if it carries any tag this build's claim names.
 *  Everything else axe runs — `best-practice` today — is the other bucket. */
const isWcagRule = (tags: readonly string[]): boolean =>
  tags.some((t) => (WCAG_TAGS as readonly string[]).includes(t))

/**
 * BEST-PRACTICE VIOLATIONS THIS BUILD HAS AND HAS NOT YET FIXED, BY ROUTE.
 *
 * COMPARED FOR EQUALITY, AND THAT IS THE WHOLE POINT. `toContain` on an
 * exception list stays green through a fix and tells nobody, so the
 * exception outlives the defect and the next reader believes the screen is
 * still broken. An equality comparison goes red in BOTH directions: red when
 * a new best-practice violation appears anywhere, and red when a pinned one
 * is fixed and the row is not deleted. It cannot rot. A declaration on this
 * build retired itself correctly this week for exactly that reason.
 *
 * THE ONE ROW. `heading-order` on `/studio/training-library/`: the approval
 * log section jumps from the page `h1` straight to an `h3` at
 * `app/studio/training-library/TrainingLibraryScreen.tsx:219`. It is a real
 * defect and it is NOT SUPPRESSED — it is recorded, asserted, and named with
 * its file and line in the task report. It sits in `app/`, which this task
 * has no write access to, so it is pinned rather than fixed. Deleting this
 * row is the last step of fixing it, and the suite will demand that step.
 *
 * TWO ASSERTIONS HOLD THIS DOWN, AND NEITHER ALONE WOULD DO.
 *
 * `scanHere` asserts that every scan, in every driven state, finds NOTHING
 * BEYOND this route's pin. That is what catches a new best-practice
 * violation appearing anywhere.
 *
 * `axe.spec.ts` separately asserts that each pinned rule IS STILL PRESENT on
 * its route at the default state, compared for EQUALITY. That is what
 * retires the pin: the day somebody moves that `h3` to an `h2`, the pin
 * stops matching what the page reports and the suite goes red until the row
 * is deleted. An exception that cannot outlive its defect cannot rot.
 *
 * WHY THE PER-SCAN CHECK IS A SUBSET AND NOT AN EQUALITY, which is a real
 * weakening and is here for a measured reason. The defect is STATE-DEPENDENT:
 * `heading-order` fires on `/studio/training-library/` at its default state
 * and in most driven persona views, and does NOT fire in the
 * `read-only-auditor` view, because that persona's open-decision affordance
 * renders a `ProhibitionNotice` (`TrainingLibraryScreen.tsx:81`) in place of
 * part of the screen and the surviving heading run no longer skips a level.
 * A per-scan equality therefore goes red on a state where the defect is
 * genuinely absent, which teaches people to delete the assertion rather than
 * the defect. The equality lives at the route's default state instead, where
 * it is stable, and the per-scan check keeps its job of catching anything
 * NEW. Both directions are still covered; they are covered by two assertions
 * rather than by one.
 *
 * Keyed by ROUTE PATH, so the pin holds in every driven state of that route
 * and nowhere else. A best-practice violation on any other path is red.
 */
export const PINNED_BEST_PRACTICE: Readonly<Record<string, readonly string[]>> = {
  '/studio/training-library/': ['heading-order'],
}

export const pinnedFor = (path: string): readonly string[] =>
  [...(PINNED_BEST_PRACTICE[path] ?? [])].sort()

/**
 * `expect(results.violations).toEqual([])` reads ONE of the four buckets axe
 * returns. The other three are `passes`, `inapplicable` and `incomplete` —
 * and `incomplete` is the bucket for checks axe RAN and could not decide.
 * A rule that lands there is not a rule that passed, and a suite that only
 * reads `violations` reports "no violation" while axe is saying "I could
 * not tell". Running the derived route list for the first time put a real
 * finding in exactly that bucket, on a screen nothing had ever scanned, and
 * the violations assertion would never have shown it. So `assertClean`
 * checks BOTH buckets, unconditionally, everywhere.
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
 * (`--color-ink-subtle` on `--color-surface-sunken`) to 17.85:1.
 *
 * IT IS NOT A JSDOM ARTEFACT AND MUST NOT BE REPORTED AS ONE. Under jsdom
 * `color-contrast` is unresolvable by construction, because jsdom computes
 * no layout and no used colour — every occurrence is the environment, and a
 * jsdom pass carries no information about the ratio at all. These scans run
 * under REAL CHROMIUM, where axe does compute ratios, so an occurrence here
 * is axe declining on a SPECIFIC element for one of the two reasons above.
 * That is why the driven scans return their incomplete ids to the caller
 * instead of discarding them: the counts and the routes they land on are
 * reported, not summarised away.
 *
 * The ceiling that remains: a FUTURE colour pair that axe also declines to
 * compute would be allowed here too, and only the token measurement would
 * catch it.
 */
export const ALLOWED_INCOMPLETE_ANYWHERE: readonly string[] = ['color-contrast']

export interface ScanResult {
  /** Rules carrying a WCAG tag this build's claim names. */
  readonly violationIds: readonly string[]
  /** Rules axe ran and decided against that carry NO WCAG tag — today,
   *  everything tagged `best-practice`. Real findings, separately asserted,
   *  and never reported to a client as WCAG 2.2 AA failures. */
  readonly bestPracticeIds: readonly string[]
  readonly incompleteIds: readonly string[]
  readonly detail: string
}

/** Runs axe over the page AS IT CURRENTLY STANDS — after whatever the
 *  caller has driven — and reports both decided and undecided findings.
 *  Asserts nothing, so a positive control can inspect a planted defect.
 *
 *  NO `withTags`. Every rule axe enables by default runs; the split between
 *  WCAG and best-practice is made HERE, on the result, so a best-practice
 *  rule can be counted, asserted and reported instead of never evaluated. */
export async function runAxe(page: Page): Promise<ScanResult> {
  const results = await new AxeBuilder({ page }).analyze()
  const decided = results.violations
  return {
    violationIds: decided.filter((v) => isWcagRule(v.tags)).map((v) => v.id).sort(),
    bestPracticeIds: decided.filter((v) => !isWcagRule(v.tags)).map((v) => v.id).sort(),
    incompleteIds: results.incomplete.map((r) => r.id).sort(),
    detail: decided
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
      .join('\n'),
  }
}

/**
 * THREE BUCKETS NOW, ALL THREE UNCONDITIONAL. Returns the ALLOWED incomplete
 * ids that were actually present, so the caller can report what axe could not
 * decide rather than only that it was permitted.
 *
 * `path` is the ROUTE, and it is separate from `where` on purpose: `where`
 * is the human label for a driven state (`/hub/devices/ [STATE-04]`) and is
 * free text, while `path` is what the best-practice pin is keyed by. Passing
 * the label as the key would silently miss every pin the moment a driven
 * state appended anything to it.
 */
export async function scanHere(page: Page, path: string, where: string): Promise<readonly string[]> {
  const { violationIds, bestPracticeIds, incompleteIds, detail } = await runAxe(page)
  expect(violationIds, `${where}: WCAG 2.2 A/AA violation\n${detail}`).toEqual([])
  expect(
    bestPracticeIds.filter((id) => !pinnedFor(path).includes(id)),
    `${where}: a best-practice violation nothing has recorded a reason for. Add the fix, not the ` +
      'rule: `PINNED_BEST_PRACTICE` is for defects that are already known, named with a file and ' +
      'a line in the task report, and waiting on the screen owner — it is not a suppression list. ' +
      'The pin is separately asserted STILL PRESENT at the route default by `axe.spec.ts`, so a ' +
      `row added here cannot outlive the defect it names.\n${detail}`,
  ).toEqual([])
  expect(
    incompleteIds.filter((id) => !ALLOWED_INCOMPLETE_ANYWHERE.includes(id)),
    `${where}: axe could not decide a rule nothing has recorded a reason for`,
  ).toEqual([])
  return incompleteIds
}
