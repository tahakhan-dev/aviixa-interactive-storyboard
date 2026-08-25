# Fix stream Q — the coverage surface, and four gates that hold a substring where the claim is every member

Authority APP-016 item 1, slice-11 audit round 5. Findings `R5-A02` … `R5-A08` and `R5-B01` …
`R5-B10`. Register: `docs/process/audits/2026-08-25-slice-11-audit-round-5-findings.md` — read your
findings there as well as here; it carries evidence this brief compresses. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only. Master prompt
artefact: `docs/process/master-prompt/AVIIXA_Interactive_Storyboard_Master_Prompt_v1.0.md`, sha256
`96b67c835a880745c748cfd1c270c53fb86fd924c5881478c430582e3506e280` — read §9.6, §13.1 and §21.1 there
rather than trusting any paraphrase. Bare `§N.N` in this repository means the **blueprint**.

**The through-line: four of these are a substring or an aggregate standing in for equality.** That
shape was named in round 2, caught by a plant in round 4, and shipped three more times in the same
wave that caught it. Fix the four together and ask of every other assertion you touch whether it
could pass on a page with its content removed.

---

# Part 1 — the derivation that puts a wrong link in front of a client

## R5-A02 · Critical · 17 links point at a page whose only mention of the item is a comment

**Controller-verified.** Every registry index prints "N of M rows link to the screen that
demonstrates them" and renders the id as an anchor. 304 rows carry a route. **26 of the 304 point at
a page whose rendered text never names the item; for 17 of those, the route directory's only mention
is inside a comment.**

Worked example, verified end to end: `out/coverage/ai-storyboards/index.html` renders
`<a href="/hub/shift-management/">SB-STU-03</a>`. The whole of `app/hub/shift-management/` names
`SB-STU-03` once — a JSDoc line about numbering style: *"Spelled up to twelve, then numeric — the
same shape `SB-STU-03` uses."* A Studio storyboard linked to a Hub shift screen.

The seventeen: `FUNC-DOH-12-3`, `SB-16-02`, `SB-43-101`, `SB-43-102`, `SB-AUD-01`, `SB-AUD-04`,
`SB-CC-14`, `SB-DEC-03`, `SB-DOH-017`, `SB-DOH-023`, `SB-STU-03`, `SB-STU-06`, `SB-STU-11`,
`SB-STU-14`, `SB-STU-16`, `SB-STU-19`, `SB-STU-20`.

**The same comment text set `status: demonstrated-in-storyboard`, so the census over-counts by the
same rows.** R4-B10's gate asserts every link resolves to a real page — they all do. What no gate
asks is whether the page demonstrates the row.

**Fix:** strip comments before the `citedTokens` scan in `walkDirs`. The helper already exists and is
used elsewhere: `tests/coverage/strip-comments.ts`. Report the before-and-after for `routeResolvedCount`
and for the demonstrated count on every affected registry — **the demonstrated total will fall, and
that is the honest direction.** Then gate it: a row's route may only be one whose non-comment source
names the row.

Nine of the 26 point at a page that does not name the item outside a comment for some other reason —
diagnose those and report what you find, even if the comment fix closes them.

# Part 2 — the four gates that cannot fail

Each of these was proved by a **real plant that left the suite green**. Reproduce the plant, watch it
red after your fix, restore byte-exact.

## R5-A03 · Important · five of six census groups can vanish

`tests/coverage/census-closure.test.ts` asserts the per-surface census with
`expect(CONTROLS_PAGE).toContain(surface)`. Those five tokens occur 330/308/322/168/100 times on that
page — all in the 630-row table below, never in the census block. **Plant:** delete five of the six
rows from the census-by-surface table body; page still says "6 surface groups"; every assertion
passes. The 181-row census-by-module table and both captions are asserted by nothing at all.

**Fix:** parse the two `<tbody>` blocks and compare the group column **by equality** against the
computed groups — `tests/coverage/workflow-index.test.ts` already does this for `<thead>`; follow it.

## R5-A04 · Important · thirteen of eighteen reconciliation rows can be deleted

`tests/coverage/reconciliation-table.test.ts` checks the rendered table by substring, reasoning in its
own comment that each inventory name is unique in the artefact. It is unique in the artefact and
**not on the page** — each is also a registry name in the table above, so every name occurs two or
four times. **Plant:** delete the Events row; page still reads "18 rows, covering all 14 registries";
passes.

**Fix:** count the `<tr>` elements inside the reconciliation table's own `<tbody>` and compare to
`ROWS.length` by equality.

## R5-A05 · Important · 61 of 110 links can be unlinked

`tests/coverage/registry-index-figures.test.ts` asks whether each row's route string appears
*anywhere* in the file. Rows share routes heavily — 110 linked rows over 49 distinct routes. **Plant:**
replace the anchor with plain text on every row whose route another row already carries; 61 of 110
unlinked; the assertion reports "110 of 110" and passes.

**Fix:** count `href="<route>"` occurrences and require the total to equal `linkedRows.length`, or
match each anchor to its own row id.

## R5-A08 · Minor · the one obligation nothing asserts

`tests/coverage/master-prompt.ts` declares eight obligations; seven are called.
`checksumNotAuthenticity` — master prompt §21.1's requirement that the package checksum be labelled
corruption detection and **not** a signature — is called nowhere. The substance is currently met and
the review page renders the disclaimer verbatim; the obligation is simply unheld.

**Fix:** assert it in `tests/unit/review-package-payload.test.ts` against `app/review/page.tsx`.

# Part 3 — figures and claims a reader sees

## R5-B01 · Critical · the dashboard says the source is silent, three columns from its own row saying it is closed

**Controller-verified.** The registry table renders `Commands — No single closed count in the frozen
source`. The source fixes it in ten places; Appendix L publishes it; and **row 6 of the reconciliation
table on the same page reads `5, closed` / delta `0` / `CONFIRMED`.**

The descriptor's `sourceNote` is honest about the *descriptor* — 5 classes, 16 instances and 57
identifiers are three registers and it asserts no single count across them. The generic sentence
converts that into a claim about the *document*.

**Fix:** render `sourceNote` in the Reconciled count cell when `expectedCount` is null, instead of the
generic sentence. **Check every other registry whose `expectedCount` is null** — the same sentence is
rendered for each, and this finding is only about the ones where the source is not in fact silent.

## R5-A07 · Moderate · the corrected control-label figure is four too high

The page publishes 271 declared labels (83 app, 188 src-only). Four come from `Record<Kind, string>`
affordance maps where `control` is a union-member **key** and the string is a pill caption or tone
token — `"ok"`, `"Control"`, `"a live control"`, `"Control drawn here"` across ten sites. Honest
figures: **267 total, 80 app, 187 src-only**. The page then says the non-census labels are "the same
control re-worded for a reader", which is false of all four — `ok` is a tone token.

**The gate transcribes the generator's regex deliberately, so it reproduces the false positives and
can never convict them.** Require the matched `control:` to sit in an object carrying a
control-matrix sibling key, or exclude `control:` where it is a key of a kind union — and make the
gate's own check independent enough to catch a recurrence.

This is R4-B03's figure republished four too high, and it is R4-B05 direction one's denominator.

## R5-B03 · Important · a two-way closure declared met, measured open in both directions

`reconciliation_rows[17]` resolution reads "The census closes both ways as master prompt §13.1
requires, and both directions are published rather than claimed". Measured: 271 declared labels of
which **255 are not census rows**; 608 census control rows of which **592 have neither a rendered
control nor a terminal record**. Neither figure is rendered anywhere.

**Fix:** state that the census does not yet close in either direction, name both figures, and render
them. Do not close this by relabelling rows — the round-4 brief said that twice and it still holds.

**A measurement warning.** A raw `grep -c` for those two numbers over the built page returns 1 each,
and both hits are **React row keys inside the flight payload**. Strip the payload before measuring
what a reader sees; the auditor did and the controller's first check did not.

## R5-B02 · Important · the row that settles the 81/81 conflation states a false method

Clause (a) of `reconciliation_rows[4]` says "grep for any numeral-plus-'workflows' phrase returns
nothing." It returns **nine**, and the row's own clause (c) cites one of them ("8 critical
workflows"). The conclusion is sound and reproduces independently — `grep -c "eighty-one workflows"`
and `grep -c "81 workflows"` both return 0, and all eight "eighty-one" occurrences are modules.

**Fix:** replace clause (a) with the accurate claim — no numeral is ever attached to a *total* of the
`WF-*` namespace; the source's numeral-plus-workflows phrases name closed subsets. **Then gate it:**
the non-conflation gate does not read this clause, which is why a false method survived inside the one
row master prompt §9.6 singles out.

## R5-A06 · Important · the evidence line cited for the 22 not-applicable rows says the register does render

`registries/authored/census-status-overrides.json` holds one override covering `DNC-01…DNC-22`. It
carries reason, owner and evidence, its register bounds are exact, and its quotation is verbatim on
the cited line. **But that line is one paragraph whose first sentence reads: "In the Super Admin
extension screen of section 45A.2, every row in this register renders as a locked entry that cannot
be given a schedule."** The override's reason is that asking whether a rendered control demonstrates
such a row is "a category error". The build renders none of them.

These 22 are the only occupants of `not-applicable`. **Open the whole paragraph and decide honestly:**
either quote the sentence that actually supports the classification and state why the §45A.2
locked-entry rendering is out of scope for this build, or move the 22 rows back to
`not-represented`. What the line describes is a screen this build owes; say so either way.

Then strengthen the gate: it asserts the quotation is on the line and cannot see that the same line
refutes the classification.

## R5-B06 · Moderate · "with the reason beside it" — no reason is rendered, on 4,714 rows

All fourteen index pages promise that routeless rows render "their id as plain text with the reason
beside it". No reason is rendered; `statusReason` exists on the rows and is not shown in that cell.

**The stated enumeration of reasons is also incomplete.** Twelve actionable-control rows read
`demonstrated-in-storyboard` with no route — R4-B03's twelve `src/`-only matches. None of the four
stated reasons applies. The real reason is a fifth the page does not name: the evidence is a `src/`
module component and route resolution reads `app/` only.

**Fix:** render `statusReason` beside a routeless id, and add the `src/`-evidence case. Note that
R5-A02's fix changes this population — do them in the right order and report both figures.

## R5-B04 · Moderate · a control-scoped disclosure on six inventories that hold no controls

The "Census by surface and by module" block reaches seven index pages and **six list no controls**.
On the modules page it claims master prompt §13.1 requires *this inventory* counted by control type —
§13.1's census is from the `ControlDefinition` registry — then says "81 record no module" of an
inventory whose rows are modules, then cross-references a dashboard delta that carries nothing about
control type.

**Fix:** render the control-type paragraph and its cross-reference only for the `actionable-controls`
slug. The correctly-scoped version already exists there.

## R5-B05 · Moderate · "two of the five statuses" where the legend above shows three

The dashboard says two statuses never appear in the registry column; the legend directly above shows
three at 0 of 14. `registryStatus()` cannot return `mounted-in-another-screen` because the only
registry holding mounted rows also holds demonstrated rows — structural, not accidental.

**R4-B12 named all three; the fix covered two.** Add the third and derive the count in the sentence
from the list's own length so it cannot drift again.

## R5-B07 · Minor · a reconciliation row cites a blank line

`reconciliation_rows[15]` cites line **119292** for "…where the recount disagrees with this table,
the recount wins". That line is **empty**; the quotation is verbatim at **119293**. The preceding
line is a Section Completeness Instruction, so the section/row idiom does not cover it. This is the
authority under which the row rules its own recount over Appendix L, and it renders on the dashboard.

## R5-B08 · Minor · a locator naming the wrong Appendix L row

`reconciliation_rows[13]` cites **119334** for the definition of "Assembled"; that line is the
acceptance-criteria row. The definition is verbatim at **119339**.

## R5-B09 · Minor · a truncated sentence, contradicted by a row in its own table

The dashboard renders "…4 further rows reconcile counts that none of the fourteen indexes, and each
says why in its own scope column." A verb is missing, and the claim is wrong for one of the four:
row 11's own `whyNoRegistrySlug` says its 22 rows **do** render on the actionable-controls index, and
they do.

## R5-B10 · Minor · "Eight registers" naming seven

`reconciliation_rows[1]` says "Eight registers must NEVER be summed together" and lists seven. The
source's range carries eight; the omitted one is a per-role table rather than a single total. Name it
or say "seven totals across eight registers". Every figure the row does name is exact.

---

## Files you own

```
app/coverage/**        app/review/**        app/workflows/**
src/coverage/**        src/review/**        src/registry/**
scripts/build-registries.mjs
registries/generated/**   (by regeneration only)     registries/authored/**
tests/coverage/{census-closure,reconciliation-table,registry-index-figures,workflow-index}.test.ts
tests/coverage/master-prompt.ts
tests/unit/{registry-build,registry-loader,review-package,review-package-payload,review-import,review-artefact-hashes}.test.ts
tests/component/{coverage,workflows-page}.test.tsx
tests/e2e/coverage.spec.ts
```

**Two other streams are running.** Fix stream N owns
`app/super-admin/{core-agents-and-composed-agent-review,platform-settings,platform-overview-and-health,usage-and-metering}/**`,
`tests/unit/{routes,stu-content-libraries}.test.ts`, `tests/coverage/citation-graph.test.ts` and two
docs files. Fix stream P owns `app/super-admin/{platform-audit,trace-viewer}/**`,
`tests/coverage/rendered-absence-claims.test.ts` and the matching `sa-*` tests. **Write to none of
those.**

Both of those streams change `app/` files that feed route evidence, so **your regenerated registries
may go stale again the moment they land.** Regenerate as your work requires, prove reproducibility,
and say plainly in your report that the controller must regenerate once more after all three streams
land.

## Non-negotiable

- **Never run `git`.** The controller commits.
- **Regenerate, never hand-edit, anything under `registries/generated/`**, and prove reproducibility:
  two independent generations into scratch, `diff -r` clean, both `shasum -a 256` values pasted.
- **Every gate you touch must be proved permeable by a REAL plant** — reproduce the three plants this
  brief describes, watch each red after your fix, restore byte-exact against a checksum.
- **Assert the population, not only the offenders**, and prefer an equality over a named literal list
  to any bigger number.
- **Do not close R5-B03 by relabelling rows.**
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears.** Write suspect
  locators as separate `id` and `line` fields.
- **Open every line before you build from it**, including the three this brief names as corrections.

## Verification before you report

```
npx tsc --noEmit
pnpm lint
pnpm test:unit
pnpm test:component
pnpm test:release
pnpm build
npx playwright test --project=chromium
```

Report per finding: what changed, file and line, the evidence you measured with the command, **the
before-and-after for every published figure you touched**, and the plant that proved each gate. If
you could not close something, say so plainly with why.
