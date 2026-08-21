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
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const

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
  readonly violationIds: readonly string[]
  readonly incompleteIds: readonly string[]
  readonly detail: string
}

/** Runs axe over the page AS IT CURRENTLY STANDS — after whatever the
 *  caller has driven — and reports both decided and undecided findings.
 *  Asserts nothing, so a positive control can inspect a planted defect. */
export async function runAxe(page: Page): Promise<ScanResult> {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze()
  return {
    violationIds: results.violations.map((v) => v.id).sort(),
    incompleteIds: results.incomplete.map((r) => r.id).sort(),
    detail: results.violations
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
      .join('\n'),
  }
}

/**
 * Both buckets, both unconditional. Returns the ALLOWED incomplete ids that
 * were actually present, so the caller can report what axe could not decide
 * rather than only that it was permitted.
 */
export async function scanHere(page: Page, where: string): Promise<readonly string[]> {
  const { violationIds, incompleteIds, detail } = await runAxe(page)
  expect(violationIds, `${where}: WCAG 2.2 A/AA violation\n${detail}`).toEqual([])
  expect(
    incompleteIds.filter((id) => !ALLOWED_INCOMPLETE_ANYWHERE.includes(id)),
    `${where}: axe could not decide a rule nothing has recorded a reason for`,
  ).toEqual([])
  return incompleteIds
}
