# Fix stream L — the master prompt's completeness gates

Authority APP-016 item 1, slice-11 audit round 4, findings `R4-B01` … `R4-B13`. The full register is
`docs/process/audits/2026-08-25-slice-11-audit-round-4-findings.md` — read your findings there as
well as here; it carries evidence this brief compresses. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

**The governing document is now an artefact.** `docs/process/master-prompt/AVIIXA_Interactive_Storyboard_Master_Prompt_v1.0.md`,
sha256 `96b67c835a880745c748cfd1c270c53fb86fd924c5881478c430582e3506e280`. Its header states what it
is: a transcription from the client's message text, not a byte-identical copy of an attachment. Read
master prompt §9.6, §10.5 and §13.1 there directly rather than trusting this brief's paraphrase.
**Bare `§N.N` in this repository means the BLUEPRINT** — its chapters collide with the prompt's
section numbers, which has caught three authors. Write "master prompt §X" every time.

Four findings share one root and should be fixed together: **B02, B04, B05 and B12 are all the census
lacking a dimension or a status it needs.** Do that work once.

---

## R4-B01 · Critical · the §9.6 reconciliation table is published on no screen

**Controller-verified.** `registries/generated/source-reconciliation.json` holds
`reconciliation.reconciliation_rows` — 13 well-formed rows carrying all six master-prompt §9.6
columns (`prompt_candidate`, `extracted_count`, `count_scope`, `dedup_rule`, `delta`, `resolution`).

```
grep -rl "prompt_candidate" --include='*.html' out/     # 0 files
grep -n  "source-reconciliation" app/coverage/page.tsx  # no match
```

Its only consumer is `app/workflows/WorkflowIndex.tsx`, which reads one scalar for a sentence. The
coverage dashboard's own table has three columns — registry, reconciled count, status — not the six
§9.6 names.

Master prompt §9.6 requires the table in the coverage dashboard **and** the review package. A client
can reach neither. Eighty kilobytes of the build's best reconciliation analysis — including the one
place that settles the 81-modules-versus-81-workflows conflation with its locators — is invisible to
the person it was written for.

**Fix:** render `reconciliation_rows` as a six-column table on `app/coverage/page.tsx`, under its own
heading, with every column named as master prompt §9.6 names it. Gate that the table renders in
`out/` and that its row count equals `reconciliation_rows.length` by equality.

## R4-B02 · Critical · five of the fourteen inventories have no reconciliation row

**Controller-verified by parsing the artefact.** The 13 rows are: Surfaces · Human security role
types · Modules · Business objects · Workflows · Events · Command classes · Notification types ·
Offline scenarios · AI/fallback storyboards · Anchored timer rows/scheduled work · Do-not-use-cron
controls · Mandatory candidate groups.

**Five of APP-014's fourteen client-named inventories appear nowhere: functions,
actionable-controls, business-use-cases, features, sub-features** — together 3,010 of the build's
5,018 census rows. Three rows that are present (Surfaces, Human security role types, Mandatory
candidate groups) are not among the fourteen, which is fine — the fourteen are a floor, not a
ceiling.

**Fix:** author the five missing rows against the frozen source, each carrying all six columns with a
real candidate, a real extracted count you measured, the count scope, the deduplication rule, the
delta and its resolution. **Open the source for each candidate** — do not derive a candidate from the
build's own registry, which would make the row a tautology.

Then gate it: assert the set of `reconciliation_rows[].inventory` **covers every `REGISTRY_DESCRIPTORS`
slug by equality**, not containment. A 13-row table headed "reconciliation" reads as complete, which
is why containment is the wrong control here — round 2's shape exactly.

`source-reconciliation.json` is the single named `HAND_AUTHORED` exception in
`tests/coverage/registry-freshness.test.ts`, so no freshness check reaches it. That exemption is
correct — the rows are authored, not extracted — but say so in the new gate's comment so the next
reader does not mistake the absence of a freshness check for an oversight.

## R4-B03 · Critical · the control-label walker reads `app/` only

**Controller-verified.** `scripts/build-registries.mjs` ends `walkRouteTree()` with
`walkDirs(join(ROOT, 'app'))`. `/coverage/actionable-controls/` therefore renders: "the built screens
**declare 83** control-matrix labels, of which **4** are word-for-word a source label."

Replaying the script's own `control:` regex over each tree separately: `app/` = **83** — the
published figure reproduces exactly — and `src/` = **188 labels that appear in no `app/` file**. The
auditor measured 171 of those 188 as rendered text in `out/`, twelve of them word-for-word rows of
the 608-label census: `Mark evidence reviewed`, `Create a Job`, `Create a run`, `Approve`, `Adjust
and approve`, `Decline with reason`, `Grant a qualification clearance`, `Acknowledge a notification`,
`Mute a digest section`, `Author and export report formats`, `Configure severity action bundles`,
`Start`.

**The build already knows this failure mode.** The *module* walker was widened with
`importedModuleDirs` after five Frontline modules read not-represented "because the route imports
them BY PATH and names none of the five in its text" — the comment recording that fix sits about
sixty lines above the `control:` scan that was never widened with it.

**Fix:** walk `src/` as well as `app/` when filling `declaredControlLabels`. Report the before and
after figures for both the declared count and the word-for-word count. Gate the demonstrated figure,
not only the raw count — `tests/unit/registry-build.test.ts` currently asserts
`reconciledCount`/`rawCount`/register and nothing about the published figure or the label population.

## R4-B04 · Important · the census has no dimension to compute itself from

Master prompt §13.1 requires per-surface, per-module counts by control type and implementation
status. Measured over the 630 rows of `registries/generated/actionable-controls.json`: `moduleId`
present on **0** rows; **no control-type field exists anywhere in the build**; `surface` is free text
on 15 rows ('Client Command Center', 'all surfaces rendering a handoff', …) and absent on 22.

**The data is not missing upstream.** The raw extraction under `registries/raw/extract/` carries
`module_id` on **653 of 759** control entries, and the generator discards it.

**Fix:** carry `module_id` through into the census rows, normalise `surface` to the five canonical
surface ids with an explicit "cross-surface" value where the source genuinely says so, and group
`/coverage/actionable-controls/` by surface and module. Control type: derive it if the raw extraction
supports it; if it does not, **say on the page that the source does not classify controls by type**
rather than inventing a taxonomy — and record that as a delta in B02's new row for
actionable-controls.

## R4-B05 · Important · the two-way census closure is open in both directions

**Direction 1 — zero rendered controls outside the census.** 280 distinct `control:` labels are
declared across `src/` + `app/`; 16 are census rows; **264 are not**. Nothing measures this.

**Direction 2 — zero census rows without a rendered control or an explicit
decision-blocked / not-applicable record.** Controller-verified status tally across the fourteen
generated registries:

```
demonstrated-in-storyboard   302
mounted-in-another-screen     10
not-represented            4,706
decision-blocked               0
not-applicable                 0
                    total  5,018
```

Neither escape-hatch string occurs in `scripts/build-registries.mjs`, so **the generator cannot emit
either**. 4,706 rows sit in `not-represented`, which is neither of master prompt §13.1's two
permitted terminal states, and the escape hatch the section names is unreachable by construction.

**Fix:** let the generator carry an authored `decision-blocked` / `not-applicable` override per row,
sourced from a committed authored file with a reason and a source or decision locator per row —
master prompt §9.2 forbids a `Not applicable` classification without reason, owner and evidence, so
enforce those fields. Then add one gate per direction.

**Do not mass-assign either status to clear the number.** The honest position after this fix is still
4,706 not-represented minus however many rows genuinely have a source-linked reason. A gate that
passes because someone relabelled the population is the worst outcome available here.

## R4-B12 · Minor, same root as B05 · three of five statuses are structurally unreachable

`decision-blocked` and `not-applicable` occur in no generated row and cannot be emitted;
`mounted-in-another-screen` cannot be returned by `registryStatus()` in `app/coverage/page.tsx`. All
three still render a legend row, a tone, an icon and a label. Closing B05 closes the first two; state
on the page what remains unassignable, or make `registryStatus()` able to return the third.

## R4-B06 · Important · no client can produce a review package

`exportReviewPackage` and `importReviewPackage` exist in `src/review/package.ts` with 35 test
references and **zero references under `app/`**. `out/review/index.html` holds four buttons — Accept
for client review, Needs change, Question, Comment — and no export or import control.

Master prompt §9.6 and §13.1 both require publication "in the review package", so both obligations
are unmeetable through the shipped product whatever the package type contains. Its `coverageSnapshot`
is `byStatus` counts only, carrying neither the reconciliation table nor the census.

**Fix:** add an Export / Import pair to `app/review/page.tsx`, and put the reconciliation rows and
the census into `ExportReviewPackageInput`. Master prompt §21.1 governs the package contract — read
it in the artefact: the checksum is non-self-referential, it is labelled accidental-corruption
detection and **not** cryptographic authenticity, import previews before it merges, a mismatch
quarantines the original bytes, and import never mutates Scenario Domain State. Master prompt §4.1
forbids the network: export is a local file the browser hands the user, import is a file the user
picks. Test the round trip, a corrupt payload, and a schema-version mismatch.

## R4-B13 · Important, partly closed already · bind the prompt artefact

The controller has committed the master prompt as the artefact named at the top of this brief. Two
things remain:

1. `promptHash` in `src/review/package.ts` has no value anywhere but the test literal `p-1`. Give it
   the real hash of the artefact, sourced the way the blueprint's hash is already sourced rather than
   pasted as a literal in two places.
2. The tree holds six `master prompt §X` citations and **every one is prose in a comment or a doc —
   none is inside an assertion**. That is what made §29.1 and §29.4 unauditable. You are not being
   asked to gate those two sections wholesale; you *are* being asked to make the four obligations
   this stream touches — §9.6's table, §9.6's indexes, §10.5's dimensions, §13.1's two-way closure —
   assert against the artefact's text rather than against a paraphrase in a comment.

## R4-B07 · Important · the Workflow Index ships four of §10.5's eight dimensions

`app/workflows/WorkflowIndex.tsx`. Columns: id · name · primaryActor · surfacesTouched ·
terminalStates · sourceLine · status · extractionCoverage. Filters: surface · actor · status ·
collapsed.

Absent as both column and filter: **owning module** (0 rows carry `moduleId`), **participating
roles** (only the single `primaryActor`), **primary objects**, **variant coverage summary**
(`extractionCoverage` is the extraction-collapse disclosure, not variant coverage). "Owning surface"
is served by `surfacesTouched`, which is a touched-set, not an owner.

**Fix:** carry `moduleId`, `participatingRoles`, `primaryObjects` and a variant summary through
`scripts/build-registries.mjs` into `workflows.json`, then add the four columns and four filters.
Where the extraction genuinely does not carry a dimension, render the column with an explicit
"not extracted" value and disclose why — do not drop the column, and do not synthesise the value.

## R4-B08 · Moderate · two workflow counts, neither citing the other

`/workflows/` publishes 724 rows from 725 records. The §9.6 reconciliation row for Workflows
publishes 644 by the build's own grep against Appendix L's 642. `grep -c` for 642, 644 and 118 in
`out/workflows/index.html` returns 0 for each. Measured cause: only 296 of the 724 rows are
`WF-`prefixed; the rest are storyboard and placeholder passage records keyed by id and line.

**Fix:** one sentence on `/workflows/` naming 642 and 644 and stating that 724 is the passage-record
count, not the `WF-*` namespace count. Master prompt §10.5 requires the index count to reconcile to
the §9.6 table; this sentence is that reconciliation, so gate its presence.

## R4-B09 · Moderate · "N extracted records are listed below" names a number that is not what is listed below

`app/coverage/[registry]/page.tsx`. Two of the ten `sourceFixesNoTotal` index pages disagree with
their own caption: **notifications** says 205 against a caption of 286 rows; **scheduled-work** says
67 against 90. Cause: `rawCount` is the raw-key count and both registries add rows from transcribed
registers — a fact the page states correctly two paragraphs later in `dedupRule`.

**Fix:** print `registry.rows.length` in that sentence and leave `rawCount` where it is explained.
Gate: for every registry index page, the figure in that sentence equals the rendered row count.

## R4-B10 · Moderate · fourteen index screens, 5,018 rows, zero in-row links

Master prompt §9.6 requires each index to drill into each item's card. Measured across
`out/coverage/*/index.html`: **0 in-row links on all fourteen**.

No per-item route exists, and none can be added as a second dynamic segment —
`tests/coverage/static-export.test.ts` throws on one, correctly, because master prompt §4.2 requires
a finite build-time route inventory. **The data to link the modules index already exists**: the
generator resolves a route directory per module id via `ownedModuleIds` / `argmaxWinners`, and 69 of
82 module rows read demonstrated.

**Fix:** emit the resolved route on each `modules.json` row and render the id as a link to it. For
the other thirteen inventories, link each row to the screen that demonstrates it where the generator
can resolve one, and where it cannot, say so in the row rather than rendering a dead id. Do not add a
dynamic segment.

## R4-B11 · Moderate · the dashboard's headline denominator is the registry, not the item

`app/coverage/page.tsx` renders "Demonstrated in storyboard: 11 of 14" under a table captioned "this
build's honest status against each". The rule is disclosed a paragraph above — "a registry counts as
demonstrated the moment any one of its own rows does" — so it is not a falsehood. But the item-level
position appears nowhere: `grep -c` for 5018, 4706 and 302 in `out/coverage/index.html` returns 0 for
each.

**11 of 14 reads as about 79 per cent to a client. The item-level figure is 302 + 10 of 5,018, about
6 per cent.** The §9.6 delta column exists precisely to stop that reading, and it is the column the
dashboard does not have — which is B01.

**Fix:** print the summed per-item counts beside the registry-level ones, with equal prominence.

---

## Files you own

```
app/coverage/**            app/review/**            app/workflows/**
src/coverage/**            src/review/**            src/registry/**
scripts/build-registries.mjs
registries/generated/**    (by regeneration only)
registries/authored/**     (new — B05's decision-blocked / not-applicable overrides)
tests/unit/registry-build.test.ts     tests/unit/review-*.test.ts
tests/coverage/workflow-index.test.ts
new gates under tests/coverage/, registered in scripts/check-gate-ordering.mjs
```

**Fix stream M is running concurrently** and owns `app/hub/**`, `src/frontline/modules/fl-a7/**`,
`src/studio/modules/stu-05|06/**`, `tests/unit/routes.test.ts`,
`tests/coverage/citation-graph.test.ts`, `tests/component/fl-a7.test.tsx`,
`tests/unit/hub-source-figures.test.ts` and `tests/{unit,component}/{hub,studio}-*`. **Do not write
to any of those.**

Fix stream K has finished and left uncommitted changes under `app/super-admin/**`,
`src/surfaces/{sa,cc}/**`, `scripts/build-registries.mjs`, `scripts/check-gate-ordering.mjs`,
`registries/generated/**` and `tests/component/sa-*`, plus a new gate
`tests/coverage/rendered-absence-claims.test.ts`. **Those edits are on disk and you build on top of
them.** In particular K changed `collectRawWorkflows()` in `scripts/build-registries.mjs` to anchor
`sourceLine` to the nearest non-blank line above — do not revert that while making your own changes
to the same file, and re-run its reproducibility check after yours.

## Non-negotiable

- **Never run `git`.** The controller commits.
- **Regenerate, never hand-edit, anything under `registries/generated/`**, and prove reproducibility:
  two independent generations into scratch, `diff -r` clean, and paste both `shasum -a 256` values.
- **Prove every new gate is permeable by planting a REAL defect**, watching it red, and restoring
  against a checksum. A plant that changes nothing gives a green run indistinguishable from a sound
  gate; round 3 lost a cycle to `&& true &&`. Say which method you used and paste the red output.
- **Assert the population, not only the offenders.** Round 3's shape was a correct fix that emptied a
  gate's population to zero: 20 ids named, 0 matched, no assertion run, suite green. Every gate you
  write states its population and asserts that population is non-empty and of the expected size.
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears**, including in a
  comment about a bad citation. Write suspect locators as separate `id` and `line` fields. This has
  convicted four authors including fix stream K this session.
- **Do not close a finding by weakening its measurement.** B05 in particular can be made to pass by
  relabelling 4,706 rows. Do not.

## Verification before you report

From the repo root, read the exit codes, report exact counts:

```
npx tsc --noEmit
pnpm test:unit
pnpm test:component
pnpm test:release
pnpm build
npx playwright test --project=chromium
```

`pnpm test:release` may be red on `tests/unit/routes.test.ts` from fix stream M's in-flight work.
Report exactly which files fail and why; **do not fix a file you do not own** to make the suite
green.

Report per finding: what you changed, file and line, the evidence you measured with the command that
measured it, before-and-after figures for every published number you touched, and the plant that
proved each gate. If you could not close a finding, say so plainly with why.
