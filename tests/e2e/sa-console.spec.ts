import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'
import { modulesInBand } from '@/surfaces/sa/modules'

/**
 * THE CONSOLE INDEX, AGAINST THE TWO REGISTERS IT IS BUILT FROM.
 *
 * ── THE COUNT THAT USED TO BE HERE IS REMOVED, NOT RENUMBERED ──────────────
 * This file asserted `expect(count).toBe(19)` over the index's links, and it
 * went red when `/super-admin/ai-incidents/` — deliberately a NON-MODULE
 * route, per the long comment in its `page.tsx` — joined the index and made it
 * twenty. Changing 19 to 20 would reship the identical defect with a fresher
 * number: the next non-module screen, or the twentieth module, breaks it
 * again, and a reviewer reading a bare number cannot tell a correct one from a
 * stale one. So there is no number in this file. The expectation is DERIVED
 * from the two places the index itself reads:
 *
 *   the MODULES         `@/surfaces/sa/modules`, via `modulesInBand`, which is
 *                       the same register `SaConsoleShell` maps over
 *   the NON-MODULES     `NON_MODULE_ROUTES`, read out of the shell's own bytes
 *                       because it is a module-local const with no export
 *
 * Adding a module or declaring a non-module route moves the expectation on the
 * next run with no edit here. Adding an UNDECLARED link still reds, because
 * the assertion is a SET EQUALITY in both directions rather than a count or a
 * subset — a subset check passes on the empty set, which is defect shape 9 in
 * this build's own list.
 *
 * ── WHY IT IMPORTS THE REGISTER AT ALL ─────────────────────────────────────
 * The hand-mirrored module-name lists that used to sit here carried the note
 * "mirrored (not imported) since this spec runs against the served static
 * export, not the source tree". Measured: that premise is wrong — the export
 * is what the BROWSER reads, and nothing stops the Node side of a Playwright
 * spec importing a module, which `tests/accessibility/axe-states.spec.ts`
 * already does for these exact role and module registers. The field under test
 * is still the served HTML; only the ANSWER is imported, from a register that
 * is not the served page.
 *
 * ── C17: A DERIVED LIST THAT FINDS NOTHING MUST BE RED ─────────────────────
 * Both derivations carry a floor. A regex that stops matching returns `[]`,
 * and an expectation of `[]` against a page that renders links is red rather
 * than green — but the floor is what makes the message name the parse instead
 * of the page.
 */

const DEFINITION_LAYER = modulesInBand('definition')
const OPERATIONS_LAYER = modulesInBand('operations')

/**
 * The non-module routes the index links, read from the shell's own
 * declaration. It is a module-local `const` in a server component with no
 * export, so the bytes are the only handle on it that does not require editing
 * a file this spec has no business editing. Anchored on the declaration and on
 * its `as const` terminator, so a `href:` elsewhere in the file cannot leak in.
 */
const SHELL_PATH = 'app/super-admin/SaConsoleShell.tsx'
const SHELL = readFileSync(join(process.cwd(), SHELL_PATH), 'utf8')
const NON_MODULE_BLOCK = /const NON_MODULE_ROUTES = \[([\s\S]*?)\n\] as const/.exec(SHELL)?.[1] ?? ''
const NON_MODULE_HREFS = [...NON_MODULE_BLOCK.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1] ?? '')

/** Every href the index is expected to carry, from the two registers above. */
const EXPECTED_HREFS = [
  ...[...DEFINITION_LAYER, ...OPERATIONS_LAYER].map((m) => `/super-admin/${m.slug}/`),
  ...NON_MODULE_HREFS,
]

test('the two derived expectations are not stubs', () => {
  // C17. Every list below is derived, and a derived list read off a renamed
  // export or a reformatted declaration scans nothing and would otherwise
  // report a shape of success.
  expect(DEFINITION_LAYER.length, 'the definition band is empty').toBeGreaterThan(0)
  expect(OPERATIONS_LAYER.length, 'the operations band is empty').toBeGreaterThan(0)
  expect(
    NON_MODULE_HREFS.length,
    `NON_MODULE_ROUTES could not be parsed out of ${SHELL_PATH} — the declaration moved or was reformatted`,
  ).toBeGreaterThan(0)
  expect(new Set(EXPECTED_HREFS).size, 'two routes claim one href').toBe(EXPECTED_HREFS.length)
})

test('/super-admin/ renders the module index with one primary heading', async ({ page }) => {
  const response = await page.goto('/super-admin/')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Super Admin Platform Console')
})

test('/super-admin/ lists every registered module under its own named, V1-labelled band', async ({
  page,
}) => {
  await page.goto('/super-admin/')
  await expect(page.getByRole('heading', { name: /Definition layer.*V1/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Operations layer.*V1/ })).toBeVisible()
  for (const module of [...DEFINITION_LAYER, ...OPERATIONS_LAYER]) {
    await expect(page.getByRole('link', { name: module.name })).toBeVisible()
  }
})

test('/super-admin/ links exactly the modules and the declared non-module routes, each by slug', async ({
  page,
}) => {
  await page.goto('/super-admin/')
  const links = page.getByRole('main').getByRole('link')
  const hrefs = await links.evaluateAll((els) =>
    els.map((el) => el.getAttribute('href') ?? '(no href)'),
  )

  // EQUALITY, BOTH DIRECTIONS. A module route that stops being linked reds; a
  // link nobody declared — the case that produced this file's stale count —
  // reds until it is declared where the index reads it from.
  expect(
    [...hrefs].sort(),
    'the console index and the registers it is built from disagree',
  ).toEqual([...EXPECTED_HREFS].sort())

  // The slug rule, kept: an href is a slug and never a bare screen number (D1).
  for (const [i, href] of hrefs.entries()) {
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

/* ==================================================================== *
 * THE PLANT CAMPAIGN, AS RUN.
 *
 * Each plant was spliced in, this file run with
 * `pnpm exec playwright test tests/e2e/sa-console.spec.ts --project=chromium
 * --workers=1` against the already-built export, and the planted file restored
 * and asserted byte-identical against a `shasum -a 256` digest taken before
 * the plant. Unplanted, all five cases pass and the index carries twenty links.
 *
 *  P1  AN UNDECLARED LINK ON THE INDEX — the exact defect that made the old
 *      `toBe(19)` stale, in the direction a renumber would have hidden. The
 *      shell's `NON_MODULE_ROUTES` href changed to
 *      `/super-admin/ai-incidents-PLANTED/`, so the page serves a link nothing
 *      declares and the declaration names a route the page does not link.
 *      RED  1 failed, 4 passed, at 'links exactly the modules and the declared
 *           non-module routes': "the console index and the registers it is
 *           built from disagree", + 1 received / - 1 expected.
 *
 *  P2  THE PARSE ANCHOR BROKEN — `const NON_MODULE_ROUTES` renamed in the
 *      shell, which is how a derived list silently becomes an empty one.
 *      RED  2 failed, 3 passed, and the FIRST of them is the floor, by name:
 *           "NON_MODULE_ROUTES could not be parsed out of
 *           app/super-admin/SaConsoleShell.tsx — the declaration moved or was
 *           reformatted". Without that floor the run would still have been red
 *           on the equality alone, naming the page instead of the parse.
 *
 *  P3  THE MODULE REGISTER MOVED — `MOD-SA-06`'s slug changed to
 *      `trace-viewer-PLANTED` in `src/surfaces/sa/modules.ts`, proving the
 *      module half of the expectation is read live and is not nineteen
 *      constants in disguise.
 *      RED  1 failed, 4 passed, at the same equality.
 * ==================================================================== */
