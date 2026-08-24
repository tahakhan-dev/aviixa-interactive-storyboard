# Fix stream J — four panels guarded by nothing, and four stale floors

Authority APP-016 item 1, slice-11 audit round 3, findings `R3-01`…`R3-05` and `R3-07`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`.

## R3-01 · Critical · the slice-7 defect's residue, controller-verified

`app/frontline/run-player/page.tsx` mounts six panels. Two come from server modules the tests read.
The other four come from `FL_A5_ROUTE_PANEL` / `FL_B8_ROUTE_PANEL` / `FL_B9_ROUTE_PANEL` /
`FL_B11_ROUTE_PANEL` in each module's `panel.tsx`, and **`grep -rn "ROUTE_PANEL" tests/` returns
zero.** Controller-verified.

The four component suites instead assert `FL_A5_PANEL` / `FL_B8_PANEL` / `FL_B9_PANEL` /
`FL_B11_PANEL` — duplicate constants still exported from the `'use client'` panel files and imported
by nothing but those tests. So the module id and heading a client actually sees on
`/frontline/run-player/` are guarded by nothing, and the assertion that looks like it guards them
cannot fail. Proved by planting `module: 'MOD-FL-A3'` and a wrong heading into a `/tmp` copy: unit +
component **9,225 tests all passed.**

`fl-b8/panel.tsx:11-16` records that this exact defect shipped once — `data-testid=
"fl-panel-undefined"` for four of six modules "while every component test passed". The data moved to
a server module; the tests were never repointed and the dead constants were never deleted. **A3 and
A4 — the two the original defect spared — are the only two actually covered.**

Repoint the four tests at the mounted constants, delete the dead duplicates, and make sure the new
assertions can fail.

## R3-02 · Important · defect shape 2, in the build's own list

`tests/component/sa-devices.test.tsx:745-754` — "AC-SA-000-09: with every AI model unavailable the
module remains fully operable" — closes on `getByRole('button', {name: /approve the critical-class
request/i})).toBeDefined()`. `Button` uses `aria-disabled`, so the control keeps its role and name
when inert. Planted: made the approval inert in exactly the state the test is named for → **35/35
passed.** The module's one root-only critical-class action is the product fact that criterion is
about. Assert operability or the acted result, using the idiom the same file already uses ~35 lines
later.

## R3-03 · Important · a "union" that covers three surfaces of five

`tests/accessibility/axe-states.spec.ts:35` claims "This file covers the union: every exported
route, every derived control position." `SURFACES` has three rows. Measured: **61 of 103** routes
match a prefix, **255 of 261** control positions. `/command-center/` (13 routes) and `/frontline/`
(7) match none, and `/review/` and `/workflows/` carry six driven controls — four of them
`/workflows/`'s filters, one an Actor select with ~280 options — that nothing drives or axe-scans.
Nothing asserts the prefixes cover every route. Add that assertion, with control-bearing prefix-less
routes recorded **by equality** the way `unreachedRoutes` already is.

## R3-04 · Moderate · four floors three slices behind the export they guard

`tests/accessibility/axe.spec.ts:26-35` says "79 paths today… 18 Studio / 18 Hub / 20 Super Admin /
23 elsewhere". Measured: **103 scannable** (102 exported + one unexported), 18 / 20 / 23 / 42. The
floors are `> 70`, `> 19`, `> 15`, `> 15` — 32 routes of slack overall, and nine Hub, Studio and
console routes could vanish from the export with every floor green. `axe-policy.ts:32` publishes the
stale 79 as a measurement. `exported-controls.ts:47` and `axe-states.spec.ts:128` publish 78; **the
claim they make still holds** — re-measured at 102 routes / 261 controls, zero duplicate and zero
empty control labels — only the count is stale.

That file's own comment argues "a floor nobody can date is a floor nobody trusts", which is the rot
it now has. Restate all of it from one measurement, or derive the per-surface floors from the module
registers the way `sa-console.spec.ts` derives its expectation. **Prefer deriving.**

## R3-05 · Moderate · a hand list under a test named "every"

`tests/e2e/coverage.spec.ts` hand-writes the fourteen registry slugs twice, under names claiming
"every registry index route". Four other files map `REGISTRY_DESCRIPTORS`. Derive it. Also
`:37`'s `expect(rowCount).toBeGreaterThan(1)` is satisfied by a header plus one row for a 990-row
index.

## R3-07 · Moderate · the general boundary gate covers one surface of five

`tests/coverage/slice-09-gates.test.ts:1239` and `:1284` are the only build-wide gates for the
client-export-read-by-a-server-component defect, and their population is
`src/surfaces/cc` + `app/command-center`. Measured: **84 client files in the tree, 8 in scope, 76
outside**, and **nine files outside satisfy the offender predicate** — the four `FL_*_PANEL` of
R3-01 plus five `app/super-admin/*Screen.tsx`. None causes live harm today (each console `page.tsx`
imports only the component, not the data export), which is why this is Moderate.

Widen both populations to `['src','app']`. It convicts nine files today, so triage them — eight are
plain fixture data no server reads, four are R3-01's dead duplicates — rather than landing green.

## Files you own

```
tests/component/fl-a5.test.tsx · fl-b8.test.tsx · fl-b9.test.tsx · fl-b11.test.tsx
tests/component/sa-devices.test.tsx
src/frontline/modules/fl-a5/** · fl-b8/** · fl-b9/** · fl-b11/**
tests/accessibility/axe.spec.ts · axe-states.spec.ts · axe-policy.ts
tests/e2e/coverage.spec.ts · exported-controls.ts
tests/coverage/slice-09-gates.test.ts
app/super-admin/atom-registry/** · jbs-access/** · memory-architecture/** · platform-audit/** · tiers-entitlements-and-caps/**
```

Two other streams own `app/page.tsx` and a new navigation gate, and the DOH/STU/CC module disclosure
files. Do not write outside your list. Never run `git`.

## Non-negotiable

- **Every fix is proved by planting**, and R3-01's plant is the one that matters: plant a wrong
  module id into a mounted panel and confirm the repointed test reds. Restore byte-identically, both
  `shasum -a 256` values in the report.
- Widening a population that convicts real files means triaging them, not silencing them.
- Verify with `npx tsc --noEmit`, the unit, component and release projects, `pnpm build`, and
  `npx playwright test --project=chromium`. Read exit codes; a summary line is not a result.
