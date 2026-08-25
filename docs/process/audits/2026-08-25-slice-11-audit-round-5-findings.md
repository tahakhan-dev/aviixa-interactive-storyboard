# Slice-11 audit — round 5 findings

Authority APP-016 item 1. Candidate `27a96d7`, clean tree, fully green: typecheck 0 · lint 0 ·
gate-ordering 31/31 · unit 6272/182 · component 3040/108 · build 102/102 · release 931/31 ·
playwright 548. Frozen source re-hashed at entry, `47bd18db…`, unchanged. Master prompt artefact
`96b67c83…`, unchanged.

Round 4 found 30 and all are closed. **The loop ends when a round finds nothing.** It has not.

---

## Stream B — the reconciliation table's claims, and what round 4 newly put in front of a reader

Ten findings. Round 4's stream B audited the reconciliation artefact's *coverage* and explicitly did
not audit its rows' *claims*. This is the first time anything has read them against the source.

### R5-B01 · Critical · the dashboard tells a reader the source is silent, three columns from its own row saying it is closed

**Controller-verified.** `out/coverage/index.html` renders, in the registry table:

> `Commands — No single closed count in the frozen source — Not represented`

The frozen source fixes the count in ten places. Two of them:

```
grep -c "exactly five command classes exist"          # 1   (AC-PROD-051)
grep -c "The command channel carries exactly five classes"   # 9
```

Appendix L publishes `| Commands | 5 classes, source-defined; 57 distinct CMD- identifiers |`. And
**row 6 of the reconciliation table, on the same page and three columns to the right, reads
extracted_count `5, closed`, delta `0`, resolution `CONFIRMED`.**

The descriptor's honest note — that 5 classes, 16 instances and 57 identifiers are three different
registers and the descriptor asserts no single count across them — is a statement about the
*descriptor*. The rendered sentence converts it into a statement about the *source*, and the source
refutes it. `grep -c "The source fixes 5 command classes" out/coverage/index.html` returns **0**; the
note reaches only the commands index page.

This is R4-01's shape — a screen asserting an absence the source contradicts — inside the one table
master prompt §9.6 commissions, contradicted by the build's own row in the same viewport.

**Smallest fix:** render `sourceNote` in the Reconciled count cell when `expectedCount` is null,
instead of the generic sentence.

### R5-B02 · Important · the row that settles the 81/81 conflation states a method that is false

`reconciliation_rows[4]` (Workflows), clause (a), rendered verbatim on the dashboard:

> "The source states NO workflow count anywhere — grep for any numeral-plus-'workflows' phrase
> returns nothing."

A numeral-plus-workflows grep returns **nine hits**: four "eight workflows", one "eight critical
workflows", one "six workflows", one "five workflows", two "three workflows", two "two workflows".
**The row's own clause (c), two clauses later, cites that very set** — "8 critical workflows".

**The conclusion is sound and reproduces independently:** `grep -c "eighty-one workflows"` → 0,
`grep -c "81 workflows"` → 0, and all eight "eighty-one" occurrences in the source are modules. Only
the stated method is false.

This is the one §9.6 sub-obligation the round-4 brief singled out. A reader who runs the grep the row
names finds nine hits and stops trusting a conclusion that is correct. The non-conflation gate is
permeable — round 4 proved it — but it does not read this clause.

**Smallest fix:** replace clause (a) with the accurate claim: no numeral is ever attached to a
*total* of the `WF-*` namespace; the source's numeral-plus-workflows phrases name closed subsets.

### R5-B03 · Important · a two-way closure declared met, measured open in both directions

`reconciliation_rows[17]` (Actionable controls), `resolution`, rendered on the dashboard:

> "The census closes both ways as master prompt §13.1 requires, and both directions are published
> rather than claimed…"

Measured by replaying the generator's own regex over both trees: 271 declared labels, **16 are census
rows, 255 are not**. Of the 608 census control rows, 16 have a rendered control and **592 have
neither a rendered control nor a terminal record** (the 22 not-applicable rows are the do-not-use-cron
register, outside the 608).

**Neither reverse figure is rendered.** The controls page prints "16 … and the rest are the same
control re-worded", never a count.

**A controller note on how nearly this was dismissed.** A naive `grep -c` for 255 and 592 over the
built page returns 1 each — and both are **React row keys inside the flight payload**, not figures a
reader sees. The auditor's check stripped the payload; the controller's first check did not. Round
4's own R4-B08 names this exact trap. A raw grep over `out/` is not a measurement of what is
rendered.

Master prompt §13.1's closure is the census's own completeness gate, and a client reads "closes both
ways as master prompt §13.1 requires" as the requirement being met.

**Smallest fix:** state that the census does not yet close in either direction, and render both
figures.

### R5-B04 · Moderate · a control-scoped disclosure rendered on six inventories that hold no controls

The "Census by surface and by module" block reaches seven `out/coverage/*/index.html` pages. **Six of
the seven list no controls** — modules, features, sub-features, functions, business-objects,
notifications.

On the modules page it reads "Master prompt section 13.1 requires this inventory counted by surface,
by module, by control type and by implementation status" — §13.1's census is from the
`ControlDefinition` registry, not from the module inventory — then "81 record no module", of an
inventory whose rows *are* modules, then "the frozen source classifies none of these controls by
type", then a cross-reference to a dashboard delta that carries nothing about control type. The six
deltas it points at are about MOD-SA-20, an object catalogue, a notification register — never
control type.

The correctly-scoped version of this disclosure already exists on the actionable-controls page.

**Smallest fix:** render the control-type paragraph and its cross-reference only for the
`actionable-controls` slug.

### R5-B05 · Moderate · "two of the five statuses" where the legend directly above shows three

The dashboard renders "Two of the five statuses never appear in the registry column above, and that
is a rule rather than an accident", then explains two. The legend immediately above shows **three**
statuses at 0 of 14 registries: mounted-in-another-screen, decision-blocked, not-applicable.

`registryStatus()` returns `mounted-in-another-screen` only for a registry with a mounted row and no
demonstrated row; the only registry holding mounted rows also holds 69 demonstrated, so it yields 0
of 14 — structurally, not accidentally.

**R4-B12 named all three. The fix covered two.** That is this build's defect shape 3 — a fix that
reached some of the call sites its own finding named — and the code comment states the purpose
exactly: "rather than leaving a legend row a reader cannot account for."

### R5-B06 · Moderate · "with the reason beside it" — no reason is rendered, on 4,714 rows

All fourteen registry index pages render: routeless rows "render their id as plain text **with the
reason beside it**, never as a link to nowhere." The rendering is plain text with no reason.
**4,714 of 5,018 rows have no route**; none renders a reason. `statusReason` exists on the rows and
is not rendered in that cell.

**The stated enumeration of reasons is also incomplete.** Twelve actionable-control rows read
`demonstrated-in-storyboard` with no route — the twelve `src/`-only word-for-word matches R4-B03
recovered. None of the four stated reasons applies: a route does demonstrate them, they are not
mounted, not authored terminal records, no dynamic segment. The real reason is a fifth the page does
not name — the evidence is a `src/` module component, and route resolution reads `app/` only.

Every published count is exact; it is the explanation that is wrong.

**Smallest fix:** render `statusReason` beside a routeless id, and add the `src/`-evidence case to the
enumerated reasons.

### R5-B07 · Minor · a reconciliation row cites a blank line

**Controller-verified.** `reconciliation_rows[15]` (Functions), `resolution`, cites Appendix L's
preamble at line 119292 for the quotation "…where the recount disagrees with this table, the recount
wins". Line 119292 is **empty**; the quotation is verbatim at **119293**. The preceding line is a
Section Completeness Instruction, so 119292 is a blank separator and the section/row idiom does not
cover it.

Of 109 distinct citations across the eighteen rows, this is the only blank line. It is also the
authority under which the row rules its own recount over Appendix L's published figure, and it is
rendered on the dashboard. **This is the controller defect RESUME §8 already records twice.**

### R5-B08 · Minor · a locator naming the wrong Appendix L row

`reconciliation_rows[13]` (Features) cites line 119334 for the definition of "Assembled". That line
is the acceptance-criteria row (5,822 identifiers). The quoted definition is verbatim at **119339**.
The row's Features figure of 723 is otherwise exact against both Appendix L and a fresh recount.

### R5-B09 · Minor · a truncated sentence, contradicted by a row in its own table

The dashboard renders "…4 further rows reconcile counts that none of the fourteen indexes, and each
says why in its own scope column." A verb is missing. The counts are right — 14 of 18 rows carry a
slug and the slug set equals the fourteen directories by equality both ways — but the claim is wrong
for one of the four: row 11's own `whyNoRegistrySlug`, three columns to the right, says its 22 rows
**do** render on the actionable-controls index. They do.

### R5-B10 · Minor · "Eight registers" naming seven

`reconciliation_rows[1]` (Human security role types) says "Eight registers must NEVER be summed
together" and lists seven. The source's own range carries eight; the omitted one is Register 3,
accounts permitted per role — a per-role table rather than a single total, which is presumably why.
Every figure the row does name is exact against its register.

### What reproduced clean — the larger half of this stream's work

**Candidate column, all eighteen rows, read against the committed prompt artefact rather than a
paraphrase: all eighteen correct**, including the five new rows whose "NONE" is right because master
prompt §9.6's candidate list stops at the scheduled-work registers.

**Extracted counts, re-derived from the frozen bytes:** FEAT 723 · SUB 947 + 95 dotted · FUNC 1335 +
160 dotted · UC 782 · MOD 87/82/5 with the 82nd exactly MOD-SA-20 · OBJ 382 and 99 numeric with the
group split verbatim from the source's own map · WF 644 · EVT 378 · CMD 57 · NOTIF 280 · OFF 246 ·
SB 653 · SCHED 35 and 24 · DNC 22 · UC-OFF 70. Bare-prefix counts exact, all seven `FUNC-` prefixes
named. Per-segment distributions exact for all four of rows 13–16. Every arithmetic delta checks.
Every resolution follows the frozen-source-wins rule.

**Quotations:** every quoted string in the eighteen rows grep-checked against the source. All
verbatim.

**The 81/81 non-conflation: supported.** All eight "eighty-one" occurrences are modules; both
workflow forms return zero.

**The rendered export:** every item-level figure on the dashboard reproduces by summing status over
the fourteen registries; the slug set equals the fourteen directories by equality both ways; every
"N records are listed below" now equals the rendered row count (R4-B09 closed); every "N of M rows
link" equals `routeResolvedCount`; the review page's checksum wording satisfies master prompt §21.1's
requirement that it be labelled corruption detection and not a signature; both artefact hashes
recompute.

**Round 4's fixes about themselves:** the three "not extracted" declarations on the Workflow Index
are real — the raw extraction carries eight fields across all 36 chunks and none is a module or an
object. The control-type absence is real *for actionable controls*; only its rendering elsewhere
fails, which is R5-B04.

**Not reached:** the crosswalk arithmetic in the source's own §45A.17.2 row by row; row 6's "16
command instances" and row 12's test-case range; the four `app/super-admin/` directories fix stream N
is writing; the dotted-form gaps row 14 declares.

---

## Stream A — the new gates and the derivations round 4 introduced

Eight findings. Two Critical, four Important, one Moderate, one Minor.

### R5-A01 · Critical · R4-01's class is four instances wider, and the gate written to stop it recurring cannot see any of them

**Controller-verified.** Four rendered abstentions say the build cannot know content the frozen
source states in full:

| page | what it says is unknowable | what the cited line carries |
|---|---|---|
| `platform-audit` | `SB-RBAC-04` "named as a screen of this module and never described. No layout, no columns, no controls" | line 20953 describes it: a per-release divergence panel, counts by surface and action identifier, zero the only passing value, a four-role access line, and "No write control exists on the panel." |
| `platform-audit` | three acceptance criteria "never extracted … unknown to this build" | line 46193 carries all ten `AC-SA-18-01…-10` with complete text. One of the three is a completeness rule requiring every one of the twenty named event classes to be recorded, including attempts on locked settings. |
| `platform-audit` | nine functionalities "with no definition anywhere in the extract" | lines 46175–46189 define all nine, each with Purpose, Allowed, Prohibited, Online, Offline and Fallback. |
| `trace-viewer` | five acceptance criteria "not carried by the extraction … their content is unknown here" | lines 43962–43969 carry all eight `AC-SA-06-01…-08` in a table. **`-07` is the criterion requiring the trace-viewer absence to be stated in the console — the very subject of the page abstaining from it.** |

Nineteen source-stated obligations reported as unbuildable.

**Why the round-4 gate cannot see them**, replayed in node: its run detector requires bare `-NN`
continuations and these enumerations spell every identifier in full, so it returns an empty run; and
**none of its eight absence markers matches any of the four phrasings** — "not carried by the
extraction", "never extracted", "never described", "no definition anywhere in the extract", "unknown
to this build". A wider marker sweep over `app/` and `src/` returns exactly these four and nothing
else, so the class is four, not more.

R4-01 was graded Critical for precisely this, and its gate was built to stop it recurring. **The gate
holds the wording the fixer happened to have in front of it, not the class.**

### R5-A02 · Critical · 17 drill-down links point at a page whose only mention of the item is a source comment

**Controller-verified.** Every registry index prints "N of M rows link to the screen that
demonstrates them" and renders the id as an anchor. 304 rows carry a route. **26 of the 304 point at
a page whose rendered text never names the item; for 17 of those, the route directory's only mention
of the identifier is inside a comment.**

The worked example, verified end to end: `out/coverage/ai-storyboards/index.html` renders
`<a href="/hub/shift-management/">SB-STU-03</a>`. The whole of `app/hub/shift-management/` names
`SB-STU-03` once — in a JSDoc line about numbering style: *"Spelled up to twelve, then numeric — the
same shape `SB-STU-03` uses."* **A Studio storyboard is linked to a Hub shift screen.**

The same comment text is what set `status: demonstrated-in-storyboard`, so the census over-counts by
the same rows.

R4-B10's gate asserts every link resolves to a real page, and they all do. **What no gate asks is
whether the page demonstrates the row.** The build already owns the fix: `strip-comments.ts` exists
and is used elsewhere; the `citedTokens` scan does not call it.

### R5-A03 · Important · five of six census groups can vanish and the gate passes

`tests/coverage/census-closure.test.ts` asserts the per-surface census by
`expect(CONTROLS_PAGE).toContain(surface)` for the five surface tokens. Those tokens occur 330, 308,
322, 168 and 100 times on that page — in the 630-row table below, never in the census block.

**Plant, real:** deleted five of the six rows from the census-by-surface table body — 1,595 bytes,
100 characters of rendered text — keeping one. Replayed every assertion in the block: **real passes,
planted passes**, and the page still says "6 surface groups". The 181-row census-by-module table
beside it, and both captions, are asserted by nothing at all.

Those two tables are R4-B04's whole deliverable. The round-4 brief records this exact shape being
caught by a plant on the Workflow Index columns — **it survived one file over.**

### R5-A04 · Important · thirteen of the eighteen reconciliation rows can be deleted and the gate passes

`tests/coverage/reconciliation-table.test.ts` checks the rendered table by substring, with a comment
reasoning that "each inventory name is unique in the artefact, so one occurrence per row in the table
body". It is unique in the artefact and **not on the page**: every inventory name occurs two or four
times, because each is also a registry name in the fourteen-row table above.

**Plant, real:** deleted the Events row from the reconciliation table body — 1,869 bytes, 1,409
characters of rendered text. **Real passes, planted passes**, and the page still reads "18 rows,
covering all 14 registries". Thirteen of eighteen are droppable this way.

R4-B02 was Critical because a table headed "reconciliation" reads as complete. The equality that
closed it is over the artefact, not over what the page renders.

### R5-A05 · Important · 61 of 110 promised drill-downs can disappear and both the sentence and the gate stay green

`tests/coverage/registry-index-figures.test.ts` asks whether each row's route string appears
*anywhere* in the file. Rows share routes heavily — 110 linked rows over 49 distinct routes on one
index.

**Plant, real:** on the ai-storyboards index, replaced the anchor with plain text on every row whose
route another row already carried. 61 of 110 unlinked, anchor count 111 → 50. The assertion reports
"110 of 110" and passes.

### R5-A06 · Important · the evidence line cited for 22 not-applicable rows says the register does render

`registries/authored/census-status-overrides.json` holds one override covering the 22
do-not-use-cron rows. It carries reason, owner and evidence as master prompt §9.2 requires, its
register bounds are exact, and its quotation is verbatim on the cited line.

**But the cited line is one paragraph and its first sentence reads: "In the Super Admin extension
screen of section 45A.2, every row in this register renders as a locked entry that cannot be given a
schedule."** The override's reason is that asking whether a rendered control demonstrates a
do-not-use-cron row is "a category error". The build renders none of them — no page in `out/` names a
`DNC` id.

These 22 are the only occupants of `not-applicable`, the escape hatch R4-B05 built. The gate asserts
the quotation is on the line; it cannot see that the same line refutes the classification. **What the
line actually describes is a screen this build owes.**

### R5-A07 · Moderate · the corrected control-label figure is four too high

The page publishes 271 declared labels (83 under `app/`, 188 only in `src/`). Four of the 271 come
from `Record<Kind, string>` affordance maps where `control` is a **union-member key** and the string
is a pill caption or a tone token — `"ok"`, `"Control"`, `"a live control"`, `"Control drawn here"`
across ten sites. The honest figures are **267 total, 80 under `app/`, 187 src-only**.

The page then says of the non-census labels that "the rest are the same control re-worded for a
reader", which is false of all four — `ok` is a tone token.

**The gate transcribes the generator's regex deliberately**, so it reproduces the four false
positives and asserts the artefact against them by equality. It can never convict them. This is the
figure R4-B03 was raised to correct, republished four too high, and it is R4-B05 direction one's
denominator.

### R5-A08 · Minor · the one obligation nothing asserts is the one about not overstating a guarantee

`tests/coverage/master-prompt.ts` declares eight obligations and seven are called. The uncalled one
is `checksumNotAuthenticity` — master prompt §21.1's requirement that the package checksum be
labelled corruption detection rather than a signature. **The substance is currently met** and the
review page renders the disclaimer verbatim; the obligation is simply unheld, so a future edit can
remove the disclaimer with nothing red.

### What reproduced clean

**The five new reconciliation counts, re-derived independently a second time:** FEAT 723, SUB 947,
UC 782, FUNC 1335, and 608 from 759 raw across 36 chunks. Every per-family distribution reproduces.

**The Functions +1 remains unresolved by a second auditor.** Six tokenisations all return 1335
against Appendix L's 1336, and the row's own disproof of the bare-prefix theory checks out. Reported
as unreproduced, not as wrong.

**Participating roles: no false positive.** Of 650 derived assignments, the only matches abutting a
letter are seven plurals; the consume rule holds and zero rows credit the platform Admin off the word
inside "Tenant Admin" — where the naive rule would mis-credit sixty. Thirteen sampled assignments
opened at their source lines and each fairly read. The column is labelled on screen as roles
occurring in the extracted text, never as the source's role-result mapping.

**A stale figure in a fix report, caught:** the participating-roles fill was reported as 373 of 724
with 63 multi-role. Measured: **464 and 154**. The build is self-consistent — the page computes the
number from the data and reads 464 — so nothing rendered is wrong. Only the report was stale.

**R4-C03's corrected 28 independently re-derived**, per-module distribution identical, and the twelve
service arrays sum to 181. **R4-C02's six and ten** confirmed a second time.

**`moduleId` on 268 rows:** a nearest-preceding-heading heuristic flagged 132, five were opened and
three were unambiguously correct with the heuristic at fault, so none could be convicted. Only 2 of
268 rows have a surface contradicting their moduleId's surface, and both are legitimate
cross-surface cases.

**All 304 linked routes exist in `out/`**, none carries a dynamic segment, and `routeResolvedCount`
equals the row count on all fourteen registries. **The review package** passes the real reconciliation
rows and census into the export. **The master prompt artefact** hashes to its pinned value and no
rendered page leaks its text.

### Not reached

`tests/coverage/citation-graph.test.ts` and `tests/unit/routes.test.ts` — both mid-edit by fix stream
N, so R4-C06's three narrowings and the metadata gate are unaudited this round. The four
`app/super-admin/` directories N owns. Master prompt §29.1 and §29.4 bullet-by-bullet against the
committed artefact. Playwright/axe and `out/_next/**`.

---

## Found by a fixer, not an auditor — and both are repo-wide

### R5-Q01 · Critical · the shared rendered-text helper does not strip the RSC flight payload

`tests/coverage/rendered-text.ts` strips tags and HTML comments but **not**
`<script>self.__next_f.push(…)</script>`. On the actionable-controls page that payload is **790KB of
1.3MB**, and it carries every sentence a gate asserts.

**Fix stream Q's first plant for R5-B03 went green because of it** — the figure was changed in the
DOM and the payload still carried the old one. Q rewrote its three gates to strip scripts and styles
first, re-ran every existing assertion in them, and found none was living off the payload. **Then it
stopped**, because the helper is shared with gates two other streams were editing.

**Every other gate that calls `renderedText` on an `out/` page is potentially satisfiable by the
payload alone.** That is the vacuity shape at repo scale, and it is the mechanism behind R5-B03's own
near-dismissal — the controller's raw grep found two figures that were React row keys in that same
payload.

**Smallest fix:** strip `<script>` and `<style>` in the shared helper, then re-run every gate that
calls it and check whether any assertion that was passing now fails. An assertion that only ever
passed on the payload was never testing the page.

### R5-Q02 · Important · the locator gate does not scan the artefact densest in locators

`tests/coverage/locator-fidelity.test.ts` scans `src`, `app`, `tests`, `scripts` and `docs`.
**`registries/` is not among them** — and `registries/generated/source-reconciliation.json` is the one
authored artefact dense with frozen-source locators, every one of which renders on the coverage
dashboard.

That is why R5-B07 and R5-B08 shipped, and why fix stream Q found **two more of the same blank-line
class the audit never named** while correcting them: a decisions-row locator off by one, and an
Assembled range whose first two lines are a header and a separator.

Q held the artefact locally in `reconciliation-table.test.ts` rather than widening `SCAN_ROOTS`
mid-wave, which would have pulled `registries/raw/**` into the population. **Reported as an open gap.**

---

## Round 5 totals

**20 findings: 10 (stream B) + 8 (stream A) + 2 found by a fixer.** Three Critical. The loop does not close.

**And the fixers corrected the auditors twice more, in the direction that matters.** The
numeral-plus-workflows sweep returns **twelve** lines, not the audit's nine — all twelve opened, all
twelve closed subsets. The control-label figure had **six** false positives, not four, **and nine real
labels the single-quote regex could never see** because they contain an apostrophe and are therefore
double-quoted. The honest figures are 274 / 79 / 195, not the audit's 267 / 80 / 187 and not the
build's 271 / 83 / 188. Neither number was taken on trust in either direction.

**The through-line of both streams: a gate that holds the wording it was written against rather than
the class it was written for.** R5-A01's gate misses four instances because their phrasing differs.
R5-A03, R5-A04 and R5-A05 are three separate substring-or-aggregate checks standing in for equality —
the shape round 2 named, round 4 caught once by a plant, and which shipped three more times in the
same wave. Every one of them was found by planting a real defect and watching the suite stay green.
