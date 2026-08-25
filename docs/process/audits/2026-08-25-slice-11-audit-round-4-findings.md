# Slice-11 audit — round 4 findings

Authority APP-016 item 1. Candidate `522b7cc` (docs-only commits since). Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, re-hashed unchanged at session
entry.

**This register is written before the fix brief.** Round 4's first run violated that order: two of
its three streams reported in-context and were never registered, so a count entered the position
that nothing on disk could reproduce. The register comes first from here on.

---

## Stream A — the rendered product on `SURF-SA`, against the source

Seven findings, `R4-01` … `R4-07`, dispositioned into
`docs/process/audits/briefs/fix-K-round4-rendered.md` and committed at `f162511`. Summarised here so
this register is the complete round-4 record:

| id | severity | subject |
|---|---|---|
| R4-01 | Critical | Three Super Admin pages disclose that an acceptance criterion is missing from the frozen source; the cited lines carry the complete runs. Six real criteria, two of them prohibitions. |
| R4-02 | Critical | A permission ruling on `/super-admin/support-access/`, quoted by two other pages, attributed to two lines that state neither half of it. The ruling is sound; the evidence is false. |
| R4-03 | Important | A one-word substitution inside a quotation labelled verbatim, on the one screen whose subject is classifying incidents. |
| R4-04 | Important | A paraphrase presented as a quotation, and a nine-step workflow said to end at step six — with an abstention resting on the truncation. |
| R4-05 | Moderate | The build's own gloss inside the quotation marks, after the verb "reads", on two scheduler pages. |
| R4-06 | Moderate | Three generated `sourceLine` fields cite a blank line; two are printed to a reader as a workflow's identity. |
| R4-07 | Minor | Twenty instances of a build-authored parenthetical inside quotation marks across five Command Center pages. |

---

## Stream B — the master prompt's own completeness gates, against the build

Thirteen findings. **Controller-verified where marked**; the stream's own evidence commands are
reproduced because they are what makes each claim checkable.

### R4-B01 · Critical · the §9.6 reconciliation table is published on no screen

`registries/generated/source-reconciliation.json` holds `reconciliation.reconciliation_rows` — 13
rows carrying all six master-prompt §9.6 columns. It reaches no reader.

**Controller-verified.** `grep -rl "prompt_candidate" --include='*.html' out/` returns **0 files**.
`grep -n "source-reconciliation" app/coverage/page.tsx` returns nothing — the coverage dashboard does
not import it. Its only consumer is `app/workflows/WorkflowIndex.tsx`, which reads one scalar for a
sentence. The dashboard's own table has three columns (registry / reconciled count / status), not
the six §9.6 names.

Master prompt §9.6 requires the table in the coverage dashboard **and** the review package. A client
can reach neither. **Smallest fix:** render `reconciliation_rows` as a six-column table on
`app/coverage/page.tsx`.

### R4-B02 · Critical · five of the fourteen inventories have no reconciliation row

**Controller-verified by parsing the artefact.** The 13 rows are: Surfaces · Human security role
types · Modules · Business objects · Workflows · Events · Command classes · Notification types ·
Offline scenarios · AI/fallback storyboards · Anchored timer rows/scheduled work · Do-not-use-cron
controls · Mandatory candidate groups.

Nine of APP-014's fourteen client-named inventories map onto those. **Five do not appear at all:
functions, actionable-controls, business-use-cases, features, sub-features** — 3,010 of the build's
5,018 census rows. Three rows present (Surfaces, Human security role types, Mandatory candidate
groups) are not among the fourteen.

A 13-row table headed "reconciliation" reads as complete. **Smallest fix:** author the five rows,
and gate `reconciliation_rows` against `REGISTRY_DESCRIPTORS` by equality, not containment.

### R4-B03 · Critical · the control-label walker reads `app/` only, and the published figure is false in the reader's direction

`scripts/build-registries.mjs` ends `walkRouteTree()` with `walkDirs(join(ROOT, 'app'))`.
`/coverage/actionable-controls/` therefore renders "the built screens **declare 83** control-matrix
labels, of which **4** are word-for-word a source label".

**Controller-verified.** Replaying the script's own `control:` regex over each tree: `app/` = **83**
distinct labels — the published figure reproduces exactly — and `src/` = **188 that appear in no
`app/` file**. The stream measured 171 of those 188 as rendered text in `out/`, twelve of them
word-for-word rows of the 608-label census (`Mark evidence reviewed`, `Create a Job`, `Approve`,
`Decline with reason`, `Grant a qualification clearance`, …).

The build already knows this failure mode: the **module** walker was widened with `importedModuleDirs`
after five Frontline modules read not-represented because their route imports them by path and names
none of them in its text. The comment recording that fix sits ~60 lines above the `control:` scan
that was never widened with it. **Smallest fix:** walk `src/` as well as `app/`.

### R4-B04 · Important · the §13.1 census has no dimension to compute itself from

Master prompt §13.1 requires per-surface, per-module counts by control type and implementation
status. Over the 630 rows of `actionable-controls.json`: `moduleId` present on **0**; no control-type
field exists anywhere in the build; `surface` is free text on 15 rows and absent on 22.

The data is not missing upstream — the raw extraction carries `module_id` on **653 of 759** control
entries under `registries/raw/extract/`, and the generator discards it. **Smallest fix:** carry
`module_id` through, then group the index by surface and module.

### R4-B05 · Important · the two-way census closure is open in both directions, and one of its two permitted resolutions cannot be recorded

**Direction 1** — 280 distinct `control:` labels declared across `src/` + `app/`; 16 are census rows;
264 are not. Nothing measures this.

**Direction 2** — **controller-verified status tally** across the fourteen generated registries:
`demonstrated-in-storyboard` **302**, `mounted-in-another-screen` **10**, `not-represented` **4,706**,
`decision-blocked` **0**, `not-applicable` **0**; total **5,018**. Neither escape-hatch string occurs
in `scripts/build-registries.mjs`, so the generator **cannot emit either** — 4,706 rows sit in a
status that is neither of §13.1's two permitted terminal states.

**Smallest fix:** let the generator carry an authored `decision-blocked` / `not-applicable` override
per row, and add one gate per direction.

### R4-B06 · Important · no client can produce a review package

`exportReviewPackage` and `importReviewPackage` exist in `src/review/package.ts` with 35 test
references and **zero references under `app/`**. `out/review/index.html` holds four buttons — Accept
for client review, Needs change, Question, Comment — and no export or import control.

Master prompt §9.6 and §13.1 both require publication "in the review package", so both are
unmeetable through the shipped product. The package's `coverageSnapshot` is `byStatus` counts only,
carrying neither the reconciliation table nor the census. **Smallest fix:** add an Export/Import pair
to `app/review/page.tsx` and put the reconciliation rows and census into the package.

### R4-B07 · Important · the Workflow Index ships four of §10.5's eight dimensions

Columns: id · name · primaryActor · surfacesTouched · terminalStates · sourceLine · status ·
extractionCoverage. Filters: surface · actor · status · collapsed.

Absent as both column and filter: **owning module** (0 rows carry `moduleId`), **participating roles**
(only the single `primaryActor`), **primary objects**, **variant coverage summary**
(`extractionCoverage` is the extraction-collapse disclosure, not variant coverage). "Owning surface"
is served by `surfacesTouched`, which is a touched-set, not an owner.

### R4-B08 · Moderate · two workflow counts, neither citing the other

`/workflows/` publishes 724 rows from 725 records. The §9.6 reconciliation row publishes 644 by the
build's own grep against Appendix L's 642. `grep -c` for 642, 644 and 118 in `out/workflows/index.html`
returns 0 for each. Measured cause: only 296 of the 724 rows are `WF-`prefixed; the rest are
storyboard and placeholder passage records. **Smallest fix:** one sentence naming 642/644 and stating
that 724 is the passage-record count, not the `WF-*` namespace count.

### R4-B09 · Moderate · "N extracted records are listed below" names a number that is not what is listed below

Two of the ten `sourceFixesNoTotal` index pages disagree with their own caption: **notifications**
says 205 against a caption of 286 rows; **scheduled-work** says 67 against 90. Cause: `rawCount` is
the raw-key count and both registries add rows from transcribed registers — a fact the page states
correctly two paragraphs later, in `dedupRule`. **Smallest fix:** print `registry.rows.length` in
that sentence and leave `rawCount` where it is explained.

### R4-B10 · Moderate · fourteen index screens, 5,018 rows, zero in-row links

Master prompt §9.6 requires each index to drill into each item's card. Measured across
`out/coverage/*/index.html`: **0 in-row links on all fourteen**. No per-item route exists and none can
be added as a second dynamic segment — `tests/coverage/static-export.test.ts` throws on one. The data
to link the modules index at least is already computed: the generator resolves a route directory per
module id and 69 of 82 module rows read demonstrated. **Smallest fix:** emit the resolved route on
each `modules.json` row and render the id as a link.

### R4-B11 · Moderate · the dashboard's headline denominator is the registry, not the item

The only aggregate is registry-level: "Demonstrated in storyboard: 11 of 14". The rule is disclosed a
paragraph above ("a registry counts as demonstrated the moment any one of its own rows does"), so it
is not a falsehood — but the item-level position appears nowhere. `grep -c` for 5018, 4706 and 302 in
`out/coverage/index.html` returns 0 for each. 11 of 14 reads as ~79%; the item-level figure is
302 + 10 of 5,018, about 6%. **Smallest fix:** print the summed per-item counts beside the
registry-level ones.

### R4-B12 · Minor · three of the dashboard's five statuses are structurally unreachable

`decision-blocked` and `not-applicable` occur in no generated row and cannot be emitted;
`mounted-in-another-screen` cannot be returned by `registryStatus()`. All three still render a legend
row, a tone, an icon and a label. Harmless today; it is R4-B05's blocker the moment anyone tries to
record a decision-blocked census row.

### R4-B13 · Important · the governing document is not an artefact, so nothing can gate against it

No copy of the master prompt exists under the repo or its parent. The tree holds exactly six
`master prompt §X` citations and **every one is prose in a comment or a doc — none is inside an
assertion**. The review package declares a `promptHash` whose only value anywhere is the test literal
`p-1`.

Every master-prompt obligation in this build is therefore held in prose only; §29.1 and §29.4 cannot
be audited bullet-by-bullet by anyone but the session that received the message, and §2.1's
source-drift procedure has a frozen-source hash on one side and nothing on the other. **Smallest
fix:** commit the master prompt as a read-only artefact beside the blueprint and hash it, the way the
blueprint already is.

### Gate permeability — both plants were real and both went red

1. **Route-population equality** (`tests/coverage/static-export.test.ts`). Deleted
   `out-plant/coverage/commands/` in a `/tmp` copy and replayed both derivation functions in node.
   Real: authored 102 / exported 102. Planted: 102 / 101, `missing from export:
   ['/coverage/commands/']` — red.
2. **The 81-conflation disclaimer** (`tests/coverage/workflow-index.test.ts`). Replaced
   `MODULE count` → `module tally` in a copy of `out/workflows/index.html`. Real: true. Planted:
   false — red. The one §9.6 sub-obligation this brief singled out — proving the 81-modules and
   81-workflows counts are not conflated — is met and held by a gate that can fail.

**Not gated at all:** B01–B05 and B07–B12. `registries/generated/source-reconciliation.json` is the
single named `HAND_AUTHORED` exception to `tests/coverage/registry-freshness.test.ts`, so no
freshness check reaches it either.

### Coverage

**Covered:** `app/coverage/**`, `app/review/**`, `app/workflows/**`, `src/coverage/**`,
`src/review/**`, `src/registry/**`, all fourteen `registries/generated/*.json` plus
`source-reconciliation.json`, the 759 raw control entries, the generator's route-evidence walker, all
103 HTML files in `out/`, and five existing gate files.

**Not reached:** master prompt §29.1 and §29.4 bullet-by-bullet — the document is not in the tree
(R4-B13); the *accuracy* of the thirteen reconciliation rows' own content against the frozen source
(coverage was audited, not claims); the `sa-*` files being written concurrently by fix stream K.

---

## Stream C — the rendered product on the other four surfaces

Seven findings. Coverage: the visible text of all 102 built pages extracted, the 75 in scope audited
— Hub 20, Studio 18, Frontline 7, Command Center 8 (the pages fix stream K does not own), coverage
15, workflows 2, review/root/404/not-found 4. Super Admin's 22 and K's five Command Center pages
excluded by instruction.

### R4-C01 · Critical · three Hub pages ship a React error message as their browser tab title

**Controller-verified.** Three of the 102 built pages carry this as their `<title>`:

> `function(){throw Error("Attempted to call SCREEN_TITLE() from the server but SCREEN_TITLE is on
> the client. …")} — Delivery Operations Hub · AVIIXA Interactive Storyboard`

`out/hub/audit-and-retention/`, `out/hub/multi-area-job-pairing/`, `out/hub/parts-registry/`.
Measured by extracting `<title>` from every `index.html` under `out/` and counting the ones
containing `Attempted` — **3**.

Cause: each `page.tsx` imports `SCREEN_TITLE` from a sibling module whose first line is
`'use client'`, so Next substitutes a throwing client-reference proxy and the template literal
stringifies it. `app/hub/devices/page.tsx` does the same thing correctly by importing the title from
a non-client `fixtures.ts`. The correct titles exist and are unused: *Audit log explorer*,
*Multi-Area Job Pairing — the paired scheduling view*, *Parts registry*.

**Nothing reds:** `tests/unit/routes.test.ts` asserts `metadata.title` for the five surface index
pages only — a subset population over 102 route pages, which is round 2's shape exactly.

The first bytes a client reads on three Hub pages name a framework bug. It is in the tab, the
bookmark, the history entry and every share preview. **Smallest fix:** move `SCREEN_TITLE` out of
the client module, and widen the metadata check from five pages to every route in the registry.

### R4-C02 · Important · "nine acceptance criteria" against a chapter that has six

**Controller-verified.** `/hub/shift-management/` tells a reader that an overlap refusal "appears
nowhere in this module's own chapter — not in the matrix, not in the feature list, not in the nine
acceptance criteria, not in the ten tests." MOD-DOH-03's chapter carries **six** acceptance criteria
(`AC-DOH-03-1` … `-6`, whole-source unique) and **ten** tests. The tests figure is right; the
criteria figure is not.

The sentence is the page's evidence that the source under-reports its own blocking decision. A
reader who opens the chapter to check finds six rows and stops trusting a disclosure that is
otherwise correct.

### R4-C03 · Important · a chapter-wide gap understated by 27

`/frontline/profile-lite/` states that "Twelve functionalities elsewhere in this chapter name no
`FB-FL-*` pattern". Measured over the chapter's 181 `FUNC` entries: **39**, distributed A1 1 · A2 3 ·
A3 2 · A4 8 · A5 12 · A6 2 · A7 0 · B8 1 · B9 1 · B10 4 · B11 2 · B12 3. Twelve is A5's count alone.

**The tree contradicts itself:** the eleven sibling module pages each disclose their own number
correctly ("3 of this module's 11", "4 of the 13", …), summing to 39. The figure is a hardcoded
literal in a template string, and the component test asserts only the sentence's first clause.

The page's whole point is that the criterion has real gaps elsewhere and this module is not one of
them. Understating the gap by 27 makes the criterion look nearly met.

### R4-C04 · Important · twelve rendered citations name a sibling of their own family

Every identifier/line pair rendered on the 75 in-scope pages was checked against the frozen source:
673 distinct pairs, 638 exact, 35 within 120 lines, 0 beyond, 0 phantom. Twelve of the 35 are not the
section idiom — **the cited line carries a different member of the same register**, with a sibling
sitting between the identifier and the cited line:

| id | cited | actual | what the cited line carries |
|---|---|---|---|
| FUNC-DOH-03-1.2.1 | 27349 | 27345 | FUNC-DOH-03-2.1.1 |
| FUNC-DOH-03-1.2.2 | 27350 | 27346 | SUB-DOH-03-2.2 header |
| FUNC-DOH-03-2.1.1 | 27351 | 27349 | FUNC-DOH-03-2.2.1 |
| FUNC-DOH-04-1.2.1 | 27550 | 27544 | FUNC-DOH-04-2.2.1 |
| FUNC-DOH-04-2.1.1 | 27551 | 27547 | FUNC-DOH-04-2.2.2 |
| FUNC-DOH-04-2.1.2 | 27552 | 27548 | SUB-DOH-04-2.3 header |
| FUNC-DOH-04-2.3.1 | 27554 | 27553 | FUNC-DOH-04-2.3.2 |
| FUNC-DOH-04-3.1.1 | 27556 | 27557 | SUB-DOH-04-3.1 header |
| FUNC-DOH-04-3.1.2 | 27557 | 27558 | FUNC-DOH-04-3.1.1 |
| FUNC-DOH-04-3.1.3 | 27558 | 27559 | FUNC-DOH-04-3.1.2 |
| FUNC-DOH-04-3.2.2 | 27561 | 27562 | FUNC-DOH-04-3.2.1 |
| AC-28.4-01 | 52774 | 52773 | AC-28.4-02 |

All twelve render in the `sourceRef` line under a control card. A reader following one lands on a
neighbouring functionality with a different actor and a different rule — *enter a qualification*
points at *escalate an unacknowledged expiry*. That is worse than no citation. The other 44
citations in those two files are exact.

### R4-C05 · Important · three Studio citations whose lines carry neither the identifier nor the quoted words

- `FUNC-STU-06-03-A-1` cited at 32493; the rendered sentence is at **32489**. Line 32493 is a
  happy-path step. Ships in `out/studio/instruction-blocks/`.
- `FUNC-STU-05-02-A-1` cited at 32284; the quoted roles string is verbatim at **32286**. Line 32284
  is the feature header and contains none of it.
- A bare-locator quotation attributed to 34546; the quoted row is at **34545**. Line 34546 is a
  different row whose final cell is also `Allowed with conditions`, which is why the substitution
  reads correctly.

All three corroborate a Derived Clarification about who holds an implementation grant and who may
block a publication. The evidence a reader is pointed at does not say it.

### R4-C06 · Important · the citation gate narrowed its own population three times, and C04 and C05 are what fit through

Replaying `tests/coverage/citation-graph.test.ts` exactly reproduces its figures: 2,129 citations,
1,960 known, 1,856 exact, 73 within-section, 31 uncorroborated, 12 uncorroborated in code. Three
holes, each measured:

1. **`withinSection` passes any citation up to 120 lines after an occurrence of its identifier.**
   Seven of C04's twelve are one to six lines after, and are absolved by it. Adding one predicate —
   reject when the cited line itself carries a different identifier sharing the citation's family
   prefix — convicts all seven and convicts none of the documented-correct section/row cases.
2. **The code population is capped at ≤20 and named nowhere**, where the prose population is named
   exhaustively. Occupancy is 12, so eight wrong citations can land silently — and four of the twelve
   current occupants are C04 defects sitting inside the allowance right now.
3. **A citation whose identifier is absent from `blueprint-locators.json` is dropped, not checked.**
   In `src/` and `app/` alone that is 75 wholly ungraded claims: 64 exact, 9 non-exact, and **two
   naming identifiers that occur nowhere in the frozen source** (in `app/super-admin/**`, so handed
   to fix stream K rather than reported here). Both of C05's citations are in this unchecked set.

The gate reports a strong number over a population it silently narrowed three times.

### R4-C07 · Minor · an em dash becomes a comma inside quotation marks

`/hub/permissions-roles-and-access/` renders: `The register row … reads "Read-only, own scope"`. The
row reads `` `Read-only` — own scope ``. Not the markdown-stripping the earlier fix accounts for —
backtick removal alone yields the em dash. Same shape fix stream K is correcting on Super Admin.

### What reproduced clean — no finding

- **Citations:** 673 distinct pairs across 75 pages; 0 beyond reach, 0 naming an absent identifier.
- **Quotations:** 742 distinct quoted strings verbatim-checked; of 25 flagged pairs, 22 were the
  auditor's own extractor mis-pairing a citation list, and 3 are C05/C07.
- **Line-range and row-count claims:** 178 extracted; every matrix claim reproduced by counting body
  rows off the cited header.
- **Big figures:** 378 distinct event tokens with their per-family splits; both notification
  registers; 19+19+18+13+12 = 81 modules; 15 Hub commands; and the abstention that a test family is
  cited zero times, confirmed at zero.
- **Abstentions:** 429 candidate absence claims; the 14 asserting an identifier is absent were each
  opened at the cited line and all 14 are correct.
- **The export:** 0 dangling internal hrefs across 102 pages; 0 `NaN`, `[object Object]`, unresolved
  template literals or placeholder text; 102/102 correct meta descriptions; 73 of 73 rendered file
  paths resolve on disk.

**Not reached:** Super Admin and K's five Command Center pages (by instruction); `out/_next/**` chunk
contents; per-cell permission-matrix content, swept in rounds 2 and 3.

---

## Found by a fixer, not an auditor — carried into round 5

### R4-K01 · Important · a fourth site for R4-02's bad pair, deliberately left

Fix stream K re-pointed the false D17 evidence at four sites and **left a fifth standing**:
`app/super-admin/platform-settings/PlatformSettingsScreen.tsx` still cites the pair `65401` and
`20740`. K's reasoning is defensible and is recorded rather than accepted: the action there is the
Platform Engineer's *proposal* of an emergency pause, and both lines do support "maker only, submits
into the approval cycle". But **`65404`, not `65401`, is the emergency-pause row, and it reads
`Explicitly prohibited` for that column.** The file was outside K's list and outside R4-02's finding.

This is the second time a fix stream has found a defect no auditor did. Round 2's was the same shape:
a widened population convicting something the audit missed.

### R4-01's class was three instances wider than the audit found

K wrote a mechanical run-gap detector for its new gate and found **six** pages disclosing acceptance
criteria the source states, not three. The three the audit missed:
`app/super-admin/atom-registry/` (six criteria), `app/super-admin/console-users-roles-and-change-approvals/`
(four), `app/super-admin/usage-and-metering/` (three, all already built and simply not cited). K wrote
outside its file list to close two of them, deliberately and reported plainly: the gate the brief asked
for convicts the class, so it could not ship green while those stood, and neutering it would have made
it worthless. **That was the right call** — a gate weakened to fit an incomplete file list is the
build's own defect shape 10.

---

## Round 4 totals

**28 findings: 7 (stream A) + 13 (stream B) + 7 (stream C) + 1 found by a fixer.** Three Critical in
stream B, one in stream C, two in stream A. The loop does not close on this round.
