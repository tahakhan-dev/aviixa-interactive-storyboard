# Fix stream E — round-2 gate findings R2-01 … R2-05

Authority APP-016 item 1, slice-11 audit round 2. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`, candidate
`c6ae6df` (clean, chain exit 0). Frozen source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

Each finding below was measured by a read-only auditor. Verify each yourself before acting — every
count here is a hypothesis, and nine controller locators were wrong in round 1.

## Files you own

```
tests/coverage/offline-phrasing.test.ts
tests/coverage/citation-graph.test.ts
tests/coverage/slice-2b-gates.test.ts
tests/coverage/registry-freshness.test.ts
tests/coverage/screenshot-manifest.test.ts
```

Two read-only audit streams are sweeping `src/`, `app/` and `registries/` concurrently. Do not
write outside the five files above. Never run `git`.

## R2-01 · Critical · an aggregate floor guarding a per-page claim

`offline-phrasing.test.ts`'s `sweptPages()` (~`:278-289`) is the sole population control for every
`toEqual([])` in the file. It asserts (a) each of `FIVE_SURFACES` has at least one page whose route
carries that prefix and (b) the **aggregate** run total exceeds 10,000. Neither is per page.
Measured: 102 pages, 55,834 runs, per-page range 4 … 6,257, and only **10** pages carry a
`DISCLOSURES` run. Collapsing the other 92 to zero rendered runs leaves ~15,613 aggregate runs, so
the guard passes, the disclosure-reachability case passes, and the cross-file route equality passes
because the files still exist.

**Its own docblock claims this case is covered** — "an export that still emits every route but
renders almost nothing on them is the same vacuous sweep with a page count that looks healthy" —
and an aggregate floor cannot detect one page collapsing.

The corrected shape already exists in this tree by the same hand: `slice-07-absence-sweep.test.ts`
asserts route-set **equality** against an authored list (~`:316-330`) and floors text **per page**
(~`:559`).

Add the per-page floor. **The design decision is yours and must be stated**: the thin end of the
range is real — a 404 page legitimately renders very little — so either pick a low per-page floor
that the thinnest legitimate page clears, or name the thin pages as an equality-asserted exemption
so a twelfth thin page reds instead of joining a widened pattern. Do not pick a floor that only
happens to pass today. And correct the case title at ~`:527`, which reads "covers every built page,
and the five surfaces are among them" over a body that is `expect(sweptPages().length > 0)`.

## R2-02 · Important · the corroboration ratio is a property of 84% of the evidence

`citation-graph.test.ts`'s `SCAN_ROOTS` is `['src','app','tests','scripts']` and `SCANNED` is
`/\.(ts|tsx|mjs|js)$/` — **no `docs`, no `.md`** — while its describe is titled "the index
corroborates this build's citations" and its printed figure is unqualified. Measured: 956 files /
1,829 citations scanned; **46 docs files / 290 citations / 277 index-known / 236 exact** unscanned.
Round 1's audit E found 28 wrong `L<n>` references in `RESUME.md` **by hand** — this is that blind
spot. `locator-fidelity.test.ts` does not read the locator index at all, so this file is the only
corroboration there is.

**The discipline here matters more than the widening**, and this build has a recorded precedent:
when the strict anchor check landed, 177 citations would newly have convicted — seven times the
stop threshold — and **nothing was mass-edited**, because the population was three different things
and one of them was documented as correct. Follow that precedent:

- Widen the scan, then **measure** what the docs population does to the pinned `MEASURED` figures
  and the `uncorroborated <= 20` ceiling.
- If it exceeds the ceiling, **do not raise the ceiling and do not mass-edit the citations.** Report
  the number, and either scope the docs population as its own reported figure with its own pin, or
  carry the excess as a literal named allowance keyed on the claim — never a widened threshold.
- The auditor opened two of the 41 non-exact docs citations and found **both honest** (the
  co-citation and locator-list forms, which §2a documents as correct and warns have nearly been
  "corrected" into wrongness five times). Assume more of them are correct than not.

## R2-03 · Important · the review-separation gate has no floor and no plant

`slice-2b-gates.test.ts` (~`:150-157`): `SRC.filter(f => f.includes('src/review/'))`, then
`expect(offenders).toEqual([])`. Population is three files. No floor, and — uniquely among the six
gates in that file — no planted-violation companion; every sibling has one. Proved permeable: the
same violation under `src/reviews/` gives a population of 0 and a green pass.

The file's own BLOCKING-3 comment states the rule this gate breaks — walk all of `src/` and `app/`
and exempt **by name**, never narrow the walk to a subset of directories. Fix it that way, add the
floor, and add the planted-violation companion its five siblings have.

## R2-04 · Moderate · a population of three that cannot tell three from zero

`registry-freshness.test.ts`'s `testFiles()` (~`:136-159`) walks 320 test files and finds 3
generator call sites, with nothing asserting either count is non-zero. Two ways to zero it: the
`try/catch` deliberately swallows a missing root, so a `tests/` restructure silences it; and the
`/\.(test|spec)\.tsx?$/` filter excludes `tests/helpers/*.ts`, which is where a hoisted call would
land. Floor both counts.

## R2-05 · Minor · a bare `return` reported as a pass

`screenshot-manifest.test.ts` (~`:59-73`) — mine, written this session. The docblock says "skipped
rather than weakened … so it cannot pass by finding nothing"; the body is `if (present.length === 0)
return`, which vitest reports as a **pass**. Use `ctx.skip()` so the report says what the comment
claims.

## Non-negotiable

- **Every fix is proved by planting**: plant the defect the finding names, watch it red, check the
  red came from the assertion you meant, restore byte-identically, and put both `shasum -a 256`
  values in the report. Where planting means writing outside your five files, plant into a `/tmp`
  copy or replay the gate's logic in node, and say which you did.
- **Never raise a baseline or widen an exemption to make a gate green.** An exemption is a literal
  list asserted as an equality so it retires itself.
- Report exact counts from `npx vitest run --project release`, `npx vitest run --project unit`,
  `npx tsc --noEmit` and `node scripts/check-gate-ordering.mjs`.
