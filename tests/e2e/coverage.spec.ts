import { test, expect } from '@playwright/test'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'
import { loadGeneratedRegistry } from '@/coverage/registry-loader'

/**
 * THE FOURTEEN SLUGS ARE DERIVED, AND THEY USED TO BE HAND-WRITTEN TWICE IN
 * THIS FILE.
 *
 * Both lists sat under test names claiming "every registry index route" and
 * "every one of the fourteen registry indexes", and neither had any way to
 * notice a fifteenth registry, a renamed slug, or a hand-list typo that
 * silently dropped one — the enumeration defect this build has already fixed
 * one level up for routes (`./exported-routes`) and one level down for controls
 * (`./exported-controls`). `REGISTRY_DESCRIPTORS` is the closed register the
 * route itself is built from: `app/coverage/[registry]/page.tsx` maps it in
 * `generateStaticParams`, so it decides which pages exist. Four other files
 * already map it rather than mirroring it.
 *
 * THE NODE SIDE OF A PLAYWRIGHT SPEC MAY IMPORT IT. The field under test is
 * still the served static export; only the ANSWER comes from the register, which
 * is the pattern `./sa-console.spec.ts` and `../accessibility/axe-states.spec.ts`
 * both already use, and the reasoning `sa-console.spec.ts` records for why the
 * "mirror, don't import" premise was wrong.
 */
const SLUGS: readonly string[] = REGISTRY_DESCRIPTORS.map((d) => d.slug)

/**
 * The rows each index owes, read from the same generated JSON the page is built
 * from. `app/coverage/[registry]/page.tsx` renders one `<tr>` per row plus one
 * header row, so the expected rendered count is `rows.length + 1` — measured
 * exact on all fourteen, from 18 rendered rows for `commands` to 991 for
 * `functions`.
 */
const rowsOwed = (slug: string): number => loadGeneratedRegistry(slug).rows.length

test('the derived registry list is not a stub', () => {
  // C17. A register read off a renamed export gives `[]`, and a loop over `[]`
  // visits no page and passes. The floor is on emptiness, not on scale: the
  // fourteen is asserted at compile time by `descriptors.ts`'s own
  // exhaustiveness check against `RegistrySlug`, and by `tests/unit/coverage
  // .test.ts`, so a number here would be a third copy of it.
  expect(SLUGS.length, 'REGISTRY_DESCRIPTORS is empty or was renamed').toBeGreaterThan(0)
  expect(new Set(SLUGS).size, 'two descriptors claim one slug').toBe(SLUGS.length)
  for (const s of SLUGS) {
    expect(rowsOwed(s), `${s}: its generated registry has no rows to render`).toBeGreaterThan(0)
  }
})

test('every registry index route renders from the static export', async ({ page }) => {
  for (const s of SLUGS) {
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

/**
 * Task 9: every registry index renders real rows from the built static export,
 * not a permanently-empty placeholder.
 *
 * THE FLOOR USED TO BE `toBeGreaterThan(1)`, WHICH IS SATISFIED BY A HEADER PLUS
 * ONE ROW. On the 990-row functions index that is 989 rows short of the claim
 * the test's own name makes, and the same threshold guarded all fourteen — a
 * page that rendered its header and one row would have passed for every one of
 * them. It is an EQUALITY now, against the row count of the very JSON the page
 * is built from, so a truncated table, a filtered one, or a paginated one is red
 * and names the shortfall.
 *
 * SCOPED TO THE ROW TABLE, because the page grew a second one. R4-B04 added
 * the per-surface and per-module census master prompt §13.1 requires, which is
 * two more tables on any index whose rows carry those dimensions — so a count
 * of every `row` on the page stopped being a count of the registry's rows. The
 * equality is kept; what changed is which table it is an equality over. The
 * scroll region's accessible name is the stable handle, and it is the same
 * name `RegistryIndex` gives it in `app/coverage/[registry]/page.tsx`.
 */
test('every registry index renders every row it owes, not an empty placeholder', async ({
  page,
}) => {
  for (const s of SLUGS) {
    await page.goto(`/coverage/${s}/`)
    const table = page.getByRole('region', { name: /table, scrollable horizontally$/ })
    await expect(table, `${s}: the registry's own row table is on the page`).toHaveCount(1)
    const rowCount = await table.getByRole('row').count()
    expect(rowCount, `${s}: rendered rows against its generated registry plus one header`).toBe(
      rowsOwed(s) + 1,
    )
  }
})
