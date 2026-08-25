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

_Pending — agent running._
