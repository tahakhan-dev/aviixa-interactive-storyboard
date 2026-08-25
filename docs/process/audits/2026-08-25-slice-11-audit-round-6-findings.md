# Slice-11 audit — round 6 findings

Authority APP-016 item 1. Candidate `5efb133`, clean tree, fully green: typecheck 0 · lint 0 ·
gate-ordering 31/31 · unit 6280/182 · component 3046/108 · build 102/102 · release 960/31 ·
playwright 548. Frozen source re-hashed at entry, `47bd18db…`, unchanged.

Rounds 1–5 found 127 and all are closed. **The loop ends when a round finds nothing.** It has not.

---

## Stream A — the content round 5 newly built, and the reasoning it recorded

Seven findings — the agent's own header said six and listed seven; counted from the list. **Two of
them are a fix stream's own recorded reasoning, refuted by measurement.** That
is a shape neither round 4 nor round 5 produced, and it is the one worth carrying: when a fixer
declines to change something and writes down why, the *why* is a claim like any other and nothing
was checking it.

### R6-A01 · Important · a split that undercounts the table beside it by two

`app/super-admin/platform-audit/` renders "All ten … **Four** are borne by this screen, **one** by
omission on purpose, and **three** are backend obligations". Four plus one plus three is eight.
Counted over the array's own `borneBy` strings: **six** say this screen, one by omission, three
backend.

On the page raised to close R4-01 and R5-A01. A reader totalling the split loses two criteria.

### R6-A02 · Important · the same defect on the sibling page, in the other direction

`app/super-admin/trace-viewer/` renders "**Seven** are obligations on the backend trace store and
carry no screen at V1". Measured: **five** rows say backend obligation; three say this screen —
including `AC-SA-06-03` and `-04`, which the page itself bears.

**This is the inverse of R5-A01's defect, on the page R5-A01 built.** It tells a reader that two
criteria this page discharges have no screen anywhere.

### R6-A03 · Moderate · the reason both shipped green

Both new component gates assert the split with a single regex match on "Backend obligation with no
screen" — **one occurrence satisfies a claim of three, and a claim of seven**. Nothing in `tests/`
asserts either intro sentence at all.

The identifier loops (1…10, 1…8) are equality over presence and are sound. **The classification
column — R5-A01's whole deliverable — has no assertion.**

### R6-A04 · Minor · one reason given for three different absences

The same sentence calls all three backend rows "obligations over a write path a browser-only
prototype does not have". Only one is. The other two are a retention rule and a storage-tiering
rule, and **the rows themselves say so** — both would still have no screen in a build that had a
write path.

### R6-A05 · Minor · a disclosed conflict that hides which side the criterion is on

A criterion's rendered text drops a contested number, and the reason names two lines that
"give two irreconcilable figures". Measured, the split is **2:1 and the criterion is on the majority
side** — the criterion being restated says twenty, one cited line says twenty, the other says
twenty-two. A reader told two lines disagree infers a tie.

### R6-C01 · Important · a recorded justification whose first claim the page carrying it refutes

**Controller-verified.** The override record keeping 22 rows in `not-applicable` states:

> "No page in `out/` names a `DNC-` identifier."

Measured over every built page with the flight payload stripped: **`out/coverage/actionable-controls/index.html` names all 22**, and two further pages name two each. That page is the one rendering the sentence — self-refuted in the same viewport, which is R5-B01's shape exactly.

**And its second claim settles what this build has ruled unsettled.** The record argues "a locked
entry that refuses a schedule is the *absence* of a control". Read whole, the cited line says the
opposite: every row renders as a locked entry, and an attempt to schedule one **fails with the reason
shown**, in the same manner an out-of-bound value is rejected rather than accepted. A rendered locked
row whose attempt fails with a stated reason is this build's canonical **disabled** rendering — the
same screens draw `absent` precisely when nothing may be attempted.

RESUME §7 records ABSENT-versus-DISABLED as unsettled at named-test strength. This record settles it,
in one direction, and that direction is the one keeping the 22 rows in `not-applicable` — the escape
hatch's only occupants.

Everything else about the record is exact: the verbatim line matches byte-for-byte, the register
bounds are right, and the 22 are never merged into the 608.

### R6-C02 · Important · "measured both ways", and the measurement says otherwise

The comment justifying why module **ownership** still counts comments after R5-A02 stripped them from
**citation** says: stripping there "changes exactly one module … from demonstrated to
not-represented … Stripping there would report a built screen as absent."

Replayed through the generator's own pipeline with the repo's own `stripComments`:

```
raw        demonstrated 69  mounted  8  unresolved ties 0
stripped   demonstrated 68  mounted  9  unresolved ties 1
lost demonstrated: [MOD-FL-A1]   → now mounted: [MOD-FL-A1]   → now not-represented: []
```

"Exactly one module" is right. **The consequence is not** — that module lands on
`mounted-in-another-screen`, a status this build deliberately distinguishes from not-represented,
caught by the generator's own mounting rule twenty lines below.

**The real obstacle is unrecorded:** stripping creates a new unresolved argmax tie between two Studio
modules with five mentions each and no slug claim, which the ambiguity check throws on.

This is the sole stated reason the ownership scan still counts comments after a Critical whose other
half was fixed. The argument as written is refuted by the file it sits in, so the next author to
re-open it will re-derive it and reach a different answer.

### What reproduced clean

**Every figure round 5 changed reproduced exactly**, by independent re-implementation:

- control labels **274 / 79 / 195**, with the difference from the loose scan being precisely the six
  named false positives removed and nine apostrophe-bearing labels added;
- census **299 demonstrated / 287 routed / 4,687 not-represented / 22 not-applicable / 5,018 total**;
- the two-way closure **258** and **592 of 608**, both present in rendered text and not only in the
  payload;
- **all twelve** numeral-plus-workflows lines opened — every one a closed subset or a local group. A
  thirteenth candidate exists and is correctly excluded: a product-feature name in an appendix, not
  a count;
- the corrected locators, plus a sweep of **all 300** distinct locators in the reconciliation
  artefact: **none** lands on a blank line, a separator, or out of range.

**The twenty-seven built obligations check out.** `SB-RBAC-04` matches its line clause for clause,
including the pass rule, the two real command identifiers, and a seeded divergence consistent with
the source's own worked example. All eight `AC-SA-06` are byte-verbatim against their rows; all ten
`AC-SA-18` verbatim apart from the two disclosed omissions; all nine functionalities carry the right
locator, each verified. **No criterion is mislabelled as backend-only** — the defect is in the counts,
not in any individual classification. Both deliberate omissions hold, and the one that keeps a
tamper-evidence vocabulary off the page is honoured: those words occur zero times on the built page.

---

## Stream B — master prompt §29.1 and §29.4, bullet by bullet

**This is the first time the build has been read against the two sections that govern whether it may
ever claim to be done.** Rounds 4 and 5 both listed it as not reached. Eight findings, two Critical,
and a verdict.

### The verdict, before the findings

**Master prompt §29.1 is not passed and cannot honestly be claimed passed today.** Thirteen bullets:
five satisfied and held by a gate, three split or partial, **four fail outright** — every frozen-source
id classified (137 of 5,018 rows carry a classification), every function carrying its thirteen
required attributes (functions.json rows carry five fields, none of the thirteen), a reviewer able to
follow one continuous story (two journeys exist, neither spanning bootstrap to closure), and the
Workflow Index / census closure pair.

**What is worth saying plainly: the build publishes most of these failures rather than hiding them.**
`/coverage/` states 299 of 5,018 items demonstrated. The census gate reds if either closure distance
is ever reported as zero. Three of the four failing bullets are slice-12 and slice-13 scope that has
not been built yet, not defects in what was built.

**Master prompt §29.4 — six of nine conditions that block a completion claim are currently TRUE.**
Two are satisfied and gated: no external request occurred, and no count is claimed outside the frozen
registries. One cannot be evaluated in either direction, which is its own finding.

### R6-B04 · Critical · both candidate manifests name a candidate that no longer exists

**Controller-verified.** `docs/process/ledgers/product-candidate-manifest.json` declares candidate
`SLICE04-b82f66e93567c0a5`. Re-hashing its own 365 entries against the tree:

```
entries=365  match=180  drifted=185  missing=0
```

**Half the bytes it certifies have moved.** Its verification block reads "unit 892 · component 1661 ·
release 189 · e2e 95" against a measured 6,280 · 3,046 · 960 · 548 — seven slices stale.

The evidence envelope is worse: it names slice **2b**, three of its seven payload entries have
drifted, and one no longer exists at all, having been retired by a schema change.

Master prompt §29.5 requires the final response to state exact Candidate IDs and hashes, and §29.4
forbids a claim when the candidate changed after verification. **The only two artefacts that could
supply a Candidate ID both name one that no longer exists. A completion response quoting either
would ship a false hash to the client.**

### R6-B06 · Critical · the disposition record the honesty gate depends on is stale, partial, and read by nothing

**Controller-verified.** The only disposition table in the tree covers **round 1**. Rounds 2, 3, 4 and
5 have no disposition record of any kind:

```
grep -rlE '^\| *[A-Za-z0-9-]+ *\| *(CLOSED|OPEN|PARTIAL)' docs/process/audits/
  → 2026-08-24-slice-11-audit-dispositions.md      (one file)
```

That one table records **7 OPEN and 6 PARTIAL** — two Critical, four Important — measured at a head
seven commits back. Ten of the thirteen are named in no later register. Rounds 2 and 3 are prose and
cannot be enumerated: ten recoverable ids for twenty declared findings, three for fifteen.

**The auditor spot-checked one of the thirteen and found it genuinely closed — the record is stale,
not the finding open. That is exactly the problem: nothing on disk lets a reader tell the two apart.**

Master prompt §29.4 conditions 5 and 6 are the two the closing obligation turns on, and neither can
be evaluated.

**This convicts a claim of the controller's own.** `RESUME` §8 has read "all dispositioned and fixed"
since round 4, and the round-4 brief said "all 77 are closed and verified". **No artefact on disk
reproduces either claim.** It is corrected in the same commit as this register.

### R6-B03 · Important · 210 source-derived records that reach nothing

`source-reconciliation.json` carries five registers beyond the reconciliation rows: **66 invariants,
32 closed action sets, 42 state vocabularies, 45 residual contradictions, 25 implementation risks.**
One reader exists in the whole tree — a zod schema that nothing imports.

Verbatim presence in the payload-stripped export: **2 of 66 invariants, 0 of the other 144.**

Master prompt §29.1's bullet that no source rule is weakened by role, feature control, offline,
artificial intelligence, notification, schedule, fallback or failure **is the bullet these 66
invariants exist to answer.** Nothing in the tree fails if a rule stops being honoured, and the 45
residual contradictions reach no reader at all.

### R6-B05 · Important · there is no visual-regression capability

```
grep -rn "toHaveScreenshot\|toMatchSnapshot\|pixelmatch\|maxDiffPixel" tests/ playwright.config.ts
  → 0
```

Master prompt §26.2 requires screenshot comparison with three baseline tiers and a retained diff
report. The screenshots project captures 102 single-state PNGs and **is not inside `pnpm verify`**.
The manifest §27.2 requires keyed by sixteen fields carries five, of which one is on the required
list.

**§29.4's second condition — "a baseline was regenerated during final verification" — cannot be
evaluated in either direction, because no baseline exists to regenerate.** This is slice-13 scope.

### R6-B08 · Moderate · the not-real disclosure is absent from eighteen pages and held by nothing over the export

85 of 103 exported pages carry a not-real statement in rendered text; **18 carry none** — the fourteen
registry indexes, the three 404 variants, and `/workflows/ai-and-its-absence/`, **the largest page in
the export at 155,695 characters of artificial-intelligence prose.**

Eighteen component tests assert the banner, every one a per-screen query; nothing walks `out/`.
Six of §29.4's eight capability categories rest on this convention alone.

### R6-B01 · Moderate · three of the 608 census controls are not controls

Three rows are sentence-shaped runs the source describes as rendered messages, not actions — one is
a status line reading "The Training Library needs a connection." **608 is the denominator both §13.1
closure directions are measured against**, and nothing asserts that a census row is a control.

### R6-B02 · Important · a coverage page understating its own classification coverage

`/coverage/` renders "No other registry has been classified against the source yet." Measured:
modules 81 of 81 **and** notifications 56 of 286 carry a source classification — 137 rows, written by
the generator. The paragraph two blocks below carries a comment celebrating the replacement of
exactly this shape of stale prose with a checkable claim; this one was not converted.

### R6-B07 · Moderate · 451 acceptance criteria cited in the product appear in no test

804 distinct `AC-*` identifiers are cited across `src/` and `app/`; 395 appear under `tests/`;
**451 appear in no test file**, and each of the 451 was verified to be a real frozen-source
identifier. A criterion can be tested without its identifier appearing in the test — but then no
traceability chain exists for it either, which master prompt §9.2 requires separately.

### The single most important thing this round found

```
grep -rn "process/ledgers\|process/audits" tests/ scripts/ src/ app/ package.json
  → 0
```

**Nothing in the tree reads the process-evidence layer.** Candidate identity, verification binding,
review disposition, TDD and debug evidence — the whole apparatus master prompt §29.3 and §29.4 rest
on — is held by prose alone, and four of its artefacts are frozen at slices 2b and 4 while the build
is at slice 11.

Every gate this build has written points at the product. **None points at the evidence that the
product was reviewed.**

### What reproduced clean

Source fingerprint stable and pinned by 40 test files, each throwing on drift. The count-scope
separation across all 18 reconciliation rows, held by equality. Five surfaces and nine roles, both
closed vocabularies asserted by equality. Screen reachability — a BFS walk from `/` compared against
the route list in **both directions**, with four unreached routes recorded with reasons. No open
decision counted as resolved: 59 decisions, type-level exhaustiveness, every record rendering all
readings and its outstanding-ratification note, and two build-coined identifiers declared as
coinages with gates asserting their absence from the source. Ownership boundaries across six gates.
Two of the three collapse-words prohibited export-wide with floors and a plant campaign. No external
request, static and runtime. And every headline count on the dashboard reproduced exactly from the
frozen registries.

---

## Round 6 totals

**15 findings: 7 (stream A) + 8 (stream B). Two Critical.** The loop does not close.

**And the Critical count was the round's own shape a third time.** This line read "Three Critical".
The register carries two Critical headings, `R6-B04` and `R6-B06`, and stream B's own verdict
paragraph already said "Eight findings, two Critical" three screens above. The header was copied
rather than counted — for the third time in one register, after the fifteen-versus-fourteen
correction below and stream A's six-versus-seven. Corrected here;
`tests/coverage/process-evidence.test.ts` now re-derives it.

**A count correction, and it is the round's own shape.** Stream A's report headed itself "Six
findings" and listed seven — `R6-A01` … `-A05`, `R6-C01`, `R6-C02` — and this register copied the
header rather than counting the list. That is precisely `R6-B06`'s complaint about round 5's
register declaring three Critical while carrying four headings, and precisely `R6-A01`'s and
`R6-A02`'s defect: a stated split that does not match the enumeration beside it. **Counted from the
list, not from the header.**

**Stream A's shape was a fixer's recorded reasoning refuted by measurement. Stream B's is larger: the
process-evidence layer is the one part of this build that has never been audited, and it is the part
the closing obligation depends on.**


---

## Found by a fixer during the round-6 wave — carried to round 7

### R6-T01 · Important · a gate that times out under concurrent load

`tests/coverage/rendered-absence-claims.test.ts` scans roughly 784 identifiers against the 18MB
frozen source and takes about **9.6 seconds**. The project's default `testTimeout` is **5 seconds**.
It passes when run alone and reds under three-stream load; `--testTimeout=60000` gives 16 of 16.

**A gate whose verdict depends on machine load is not a gate.** It is also the gate that convicts the
absence-claim class — the one round 5 had to widen twice — so a timeout reads exactly like a pass
would if the file were deleted. Give it an explicit per-file timeout, or move the source scan behind
a cached derivation.

### R6-T02 · Moderate · a gate that reds when another process rebuilds `out/` beneath it

`tests/coverage/slice-04-gates.test.ts` passes alone at 78 of 78 and reds when a concurrent stream
runs `pnpm build` under it. Real for a wave, harmless for a single-writer chain — but it means the
suite cannot honestly be run concurrently with a build, and nothing says so.

### Two more of the register's own figures corrected by the fixer

The `R6-C02` entry above reports the ownership tally as `mounted 8 → 9`. **Measured by replaying the
real generator twice: `10 → 11`.** The direction and the single affected module are right; the
absolute figures are not.

And this register called the argmax tie "the real obstacle". **It is not the only one.** Stripping
comments from the ownership scan also downgrades `MOD-FL-A1` from demonstrated to
`mounted-in-another-screen`, which is independently wrong — that module's own record says it owns the
screen and declares no slug only because the basename collides across two surfaces. The tie cannot be
settled by picking a winner either: the route in question states under its own decision record that
it composes module routes and is not one, and both candidate modules are already demonstrated from
their own slug-claimed routes. **Awarding it would invent an ownership the source refuses.**

**That is four times across rounds 5 and 6 that a fix stream has corrected a figure or a framing this
register published.** The register is not the authority; the measurement is.
