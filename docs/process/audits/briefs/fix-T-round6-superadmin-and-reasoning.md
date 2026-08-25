# Fix stream T — two split sentences, and two pieces of recorded reasoning that measurement refutes

Authority APP-016 item 1, slice-11 audit round 6, findings `R6-A01` … `R6-A05`, `R6-C01`, `R6-C02`.
Register: `docs/process/audits/2026-08-25-slice-11-audit-round-6-findings.md`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

Baseline `c3bd484`, clean tree, fully green: typecheck 0 · lint 0 · gate-ordering 31/31 · unit
6280/182 · component 3046/108 · build 102/102 · release 962/31 · playwright 548.

**`R6-C01` and `R6-C02` are a shape this build had not seen before round 6: a fix stream declined to
change something, wrote down why, and the why is false.** Treat every "measured", "verified" and
"no page does X" in a code comment or an authored record as a claim to check, not as context.

---

## R6-A01 and R6-A02 · two split sentences that contradict the tables beside them

`app/super-admin/platform-audit/` renders "All ten … **Four** are borne by this screen, **one** by
omission on purpose, and **three** are backend obligations". Four plus one plus three is eight.
Counted over the array's own `borneBy` values: **six** this screen, one by omission, three backend.

`app/super-admin/trace-viewer/` renders "**Seven** are obligations on the backend trace store and
carry no screen at V1". Counted: **five** backend, three this screen — including two the page itself
bears. **That is the inverse of R5-A01's defect on the page R5-A01 built**: it tells a reader that
two criteria this page discharges have no screen anywhere. The block comment that seeded the sentence
says the same wrong thing; fix both.

**Derive all these counts from the arrays.** Do not write a corrected literal — a corrected literal
is what R6-A05 and the round-5 wave shipped, and it is the next figure to go stale.

## R6-A03 · the reason both shipped green

Both new component gates assert the split with a single regex match on "Backend obligation with no
screen". **One occurrence satisfies a claim of three, and a claim of seven.** Nothing in `tests/`
asserts either intro sentence.

The identifier loops (1…10, 1…8) are equality over presence and are sound — leave them. **Add an
equality over the `borneBy` categories** and assert the rendered sentence is built from those counts,
so the sentence and the table cannot drift apart again. Plant a real defect — change one row's
category — and watch both the count assertion and the sentence assertion red.

## R6-A04 · one reason given for three different absences

The same sentence calls all three backend rows "obligations over a write path a browser-only
prototype does not have". Only one is. The other two are a retention rule and a storage-tiering
rule — **and the rows themselves already say so.** Drop the shared clause; the per-row reasons carry
it.

## R6-A05 · a disclosed conflict that hides which side the criterion is on

A criterion's rendered text drops a contested number and the reason names two lines that "give two
irreconcilable figures". Measured, the split is **2:1 and the criterion is on the majority side**:
the criterion being restated says twenty, one cited line says twenty, the other twenty-two. Open all
three lines yourself. Name the criterion's own line in the reason so a reader is not left inferring
a tie.

## R6-C01 · Important · a recorded justification the page carrying it refutes

**Controller-verified.** `registries/authored/census-status-overrides.json` — the record keeping 22
rows in `not-applicable` — states: **"No page in `out/` names a `DNC-` identifier."**

Measured over every built page with the flight payload stripped: `out/coverage/actionable-controls/index.html`
**names all 22**, and two further pages name two each. That page is the one rendering the sentence.
Self-refuted in the same viewport — R5-B01's shape.

**And the second claim is heavier.** The record argues "a locked entry that refuses a schedule is the
*absence* of a control". Read the cited line whole: every row renders as a locked entry, and an
attempt to schedule one **fails with the reason shown**, in the same manner an out-of-bound value is
rejected rather than accepted. **A rendered locked row whose attempt fails with a stated reason is
this build's canonical DISABLED rendering** — the same Super Admin screens draw `absent` precisely
when nothing may be attempted, and say so in their own comments.

`RESUME` §7 records ABSENT-versus-DISABLED as unsettled at named-test strength, pinned by a fixture
carrying both locator sets. **This record settles it, in one direction, and that direction is the one
keeping the 22 rows in the escape hatch they are the only occupants of.**

**What to do.** Fix the false sentence first — that part is not a judgement call. Then, on the
distinction: read the whole paragraph and decide honestly, and take one of these two, not a third
that reads better:

- **keep `not-applicable`**, but rest it on a ground the source supports — that the register is
  scheduling policy rather than an actionable control inventory — and state the
  ABSENT-versus-DISABLED question as **open**, cross-referencing the existing fixture rather than
  answering it; or
- **move all 22 rows to `not-represented`**, which is what the record itself names as the honest
  correction if the reading is wrong.

Either is defensible. **Silently rewording to preserve the status is not.** Whichever you choose,
`decision-blocked` and `not-applicable` may end at zero occupants; that is an honest outcome and the
census gate must be checked to see whether it can survive it — if it asserts a non-empty
`not-applicable`, it will red, and the gate is what needs correcting, not the number.

Then strengthen the gate: it asserts the quotation appears on the cited line and cannot see that the
same line refutes the classification. At minimum assert the record's own factual claims — a claim of
the form "no page renders X" is checkable against `out/`.

## R6-C02 · Important · "measured both ways", and the measurement says otherwise

`scripts/build-registries.mjs` — the comment justifying why module **ownership** still counts
comments after `R5-A02` stripped them from **citation** — says stripping there "changes exactly one
module … from demonstrated to not-represented … Stripping there would report a built screen as
absent."

Replayed through the generator's own pipeline with the repo's own `stripComments`:

```
raw        demonstrated 69  mounted  8  unresolved ties 0
stripped   demonstrated 68  mounted  9  unresolved ties 1
lost demonstrated: [MOD-FL-A1]   → now mounted: [MOD-FL-A1]   → now not-represented: []
```

"Exactly one module" is right. **The consequence is not** — the module lands on
`mounted-in-another-screen`, a status this build deliberately distinguishes, caught by the
generator's own mounting rule twenty lines below the comment.

**The real obstacle is unrecorded:** stripping creates a new unresolved argmax tie between two Studio
modules with five mentions each and no slug claim, which the ambiguity check throws on.

**Re-derive this yourself before writing anything** — the numbers above are the auditor's, and this
round exists because a fixer's numbers went unchecked. Then either correct the comment to the
measured consequence and name the tie as the actual blocker, **or** resolve the tie and strip there
too, which is the better outcome if the tie can be settled from the source. Say which you did and
why.

---

## Files you own

```
app/super-admin/platform-audit/**          app/super-admin/trace-viewer/**
tests/component/sa-platform-audit.test.tsx tests/component/sa-trace-viewer.test.tsx
tests/unit/sa-platform-audit*.test.ts      tests/unit/sa-trace-viewer*.test.ts
registries/authored/census-status-overrides.json
scripts/build-registries.mjs
tests/coverage/census-closure.test.ts
```

**Two other fix streams are running.** Stream S owns `docs/process/**`,
`scripts/check-gate-ordering.mjs` and a new process gate. Stream U owns `app/coverage/**`,
`registries/generated/**`, `src/registry/**` and other `tests/coverage/` files. **Write to none of
those.**

**You share `scripts/build-registries.mjs` with nobody, but stream U regenerates
`registries/generated/`.** Do not write there yourself; note that `pnpm build` chains
`build:registries`, which is fine. **Extend existing gate files rather than creating new ones** —
`scripts/check-gate-ordering.mjs` belongs to stream S this wave.

## Non-negotiable

- **Never run `git`.** The controller commits.
- **Open every line before you build from it.** Every figure in this brief is an auditor's
  hypothesis.
- **Derive counts, never write them.** Three of this round's findings are written literals that
  drifted from the arrays beside them.
- **Prove every gate change permeable by a REAL plant**, red naming the offender, restored byte-exact
  against a checksum.
- **Treat a comment's claim as a claim.** "Measured both ways", "no page does X", "verified" — check
  each one you rely on and each one you write.
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears**, and that gate
  now scans `registries/` too.
- Bare `§N.N` means the **blueprint**; write "master prompt §X" for the prompt.

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

Report per finding: what changed, file and line, the evidence you measured with the command,
before-and-after for every published figure, and the plant that proved each gate. For `R6-C01` and
`R6-C02`, state which of the two options you took and the reading that decided it.
