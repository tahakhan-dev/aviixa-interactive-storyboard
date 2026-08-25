# Slice-11 audit — round 6 findings

Authority APP-016 item 1. Candidate `5efb133`, clean tree, fully green: typecheck 0 · lint 0 ·
gate-ordering 31/31 · unit 6280/182 · component 3046/108 · build 102/102 · release 960/31 ·
playwright 548. Frozen source re-hashed at entry, `47bd18db…`, unchanged.

Rounds 1–5 found 127 and all are closed. **The loop ends when a round finds nothing.** It has not.

---

## Stream A — the content round 5 newly built, and the reasoning it recorded

Six findings. **Two of them are a fix stream's own recorded reasoning, refuted by measurement.** That
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

_Pending — agent running._
