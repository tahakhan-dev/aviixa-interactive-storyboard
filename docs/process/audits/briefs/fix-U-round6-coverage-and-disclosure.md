# Fix stream U — a denominator with non-controls in it, 210 records nothing reads, and a disclosure missing where it matters most

Authority APP-016 item 1, slice-11 audit round 6, findings `R6-B01`, `R6-B02`, `R6-B03`, `R6-B05`,
`R6-B07`, `R6-B08`. Register:
`docs/process/audits/2026-08-25-slice-11-audit-round-6-findings.md`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only. Governing document:
`docs/process/master-prompt/AVIIXA_Interactive_Storyboard_Master_Prompt_v1.0.md`, sha256
`96b67c835a880745c748cfd1c270c53fb86fd924c5881478c430582e3506e280` — read master prompt §13.1, §26.2,
§27.2 and §29.4 there. Bare `§N.N` in this repository means the **blueprint**.

Baseline `c3bd484`, clean tree, fully green: typecheck 0 · lint 0 · gate-ordering 31/31 · unit
6280/182 · component 3046/108 · build 102/102 · release 962/31 · playwright 548.

---

## R6-B08 · Moderate but do this one first · the not-real disclosure is absent where it matters most

85 of 103 exported pages carry a not-real statement in payload-stripped rendered text. **18 carry
none**: the fourteen `/coverage/<registry>/` indexes, the three 404 variants, and
**`/workflows/ai-and-its-absence/` — the largest page in the export at 155,695 characters of
artificial-intelligence prose.**

Eighteen component tests assert the banner and every one is a per-screen query; **nothing walks
`out/`**. Six of master prompt §29.4's eight capability categories rest on this convention alone.

The fourteen indexes render from `app/coverage/[registry]/page.tsx` while the disclosure lives one
level up in `app/coverage/page.tsx`.

**Fix:** put the disclosure where those pages render it, and **add one release gate over `out/`
asserting every page carries a not-real statement**, with any exemption written as an equality over
a named list, not as a count. Use the shared `renderedText` helper — it now strips the flight payload
— and check the 404 variants deliberately rather than exempting them by reflex.

## R6-B01 · Moderate · three of the 608 census controls are not controls

Three rows are sentence-shaped runs the frozen source describes as **rendered messages, not
actions** — one is a status line reading "The Training Library needs a connection." **608 is the
denominator both master prompt §13.1 closure directions are measured against**, and nothing asserts
that a census row is a control.

**Open all three source lines before excluding anything.** Then exclude sentence-shaped runs at
generation time and **assert the exclusion count**, so the rule cannot quietly grow. Report the
before-and-after for 608, for the 258 and 592 closure figures, and for every page that renders them.

## R6-B02 · Important · a coverage page understating its own classification coverage

`app/coverage/page.tsx` renders "No other registry has been classified against the source yet."
Measured: modules **81 of 81** and notifications **56 of 286** carry a source classification — **137
rows**, written by the generator.

The paragraph two blocks below carries a comment celebrating the replacement of exactly this shape of
stale prose with a checkable claim. **This one was not converted.** Derive the sentence from the
measured set of registries carrying `sourceClass`, the way its neighbour already does.

## R6-B03 · Important · 210 source-derived records that reach nothing

`registries/generated/source-reconciliation.json` carries five registers beyond the reconciliation
rows: **66 invariants, 32 closed action sets, 42 state vocabularies, 45 residual contradictions, 25
implementation risks.** One reader exists in the tree — a zod schema nothing imports.

Verbatim presence in the payload-stripped export: **2 of 66 invariants, 0 of the other 144.**

Master prompt §29.1's bullet that no source rule is weakened by role, feature control, offline,
artificial intelligence, notification, schedule, fallback or failure **is the bullet those 66
invariants exist to answer**, and nothing fails if a rule stops being honoured. The 45 residual
contradictions reach no reader at all.

**Fix, in this order and stop where the evidence stops:**

1. **The 66 invariants** — add a release gate asserting each invariant's locator is cited somewhere
   in `src/` or `app/`, **or** is listed in a named exemption array compared by equality with a
   reason per entry. Expect exemptions; an invariant about a backend write path has no product site.
   The gate's value is that the exemption list becomes visible and arguable.
2. **The 45 residual contradictions** — these are source disagreements a reader is entitled to see.
   Check first whether the build already discloses each one elsewhere (`src/disclosure/decisions.ts`
   holds 59 decision records; many may overlap). **Render only what is not already disclosed**, and
   report the overlap count — a second rendering of the same contradiction is noise, not coverage.
3. **The other three registers** — closed action sets, state vocabularies, implementation risks.
   Report what is and is not already covered elsewhere in the build before adding anything. **If
   they are covered, say so with the measurement and add nothing.** Coverage by duplication is not
   coverage.

## R6-B07 · Moderate · 451 acceptance criteria cited in the product appear in no test

804 distinct `AC-*` identifiers are cited across `src/` and `app/`; 395 appear under `tests/`; **451
appear in no test file**, and each was verified to be a real frozen-source identifier.

A criterion can be tested without its identifier appearing in a test — **but then no traceability
chain exists for it either**, which master prompt §9.2 requires separately.

**Do not close this by sprinkling identifiers into test names.** Publish the ratio and hold it
against a named literal list, the way the census publishes its two closure distances. The honest
outcome is a visible number with a floor that can only be lowered deliberately.

## R6-B05 · Important · there is no visual-regression capability, and that is a decision to record

```
grep -rn "toHaveScreenshot\|toMatchSnapshot\|pixelmatch\|maxDiffPixel" tests/ playwright.config.ts
  → 0
```

Master prompt §26.2 requires screenshot comparison with three baseline tiers and a retained diff
report. The screenshots project captures 102 single-state PNGs and **is not inside `pnpm verify`**.
The manifest master prompt §27.2 requires keyed by sixteen fields carries five, one of which is on
the required list.

**§29.4's second blocking condition cannot be evaluated in either direction, because no baseline
exists to regenerate.**

**This is slice-13 scope and you are not being asked to build it.** You are being asked to stop it
being invisible:

- record it as a **known limitation with a decision record**, in the same form this build uses for
  every other open item, naming master prompt §26.2 and §27.2 and what is owed;
- make it **reachable by a reader** rather than only true in a doc;
- and if it is cheap to put the existing screenshots project inside `verify` without claiming it is
  visual regression, say whether you did and what it does and does not prove.

**Do not build a baseline tier and call §26.2 satisfied.** A partial capability presented as the
required one is worse than a stated absence.

---

## Files you own

```
app/coverage/**            app/workflows/**          app/review/**
src/coverage/**            src/registry/**           src/review/**
scripts/build-registries.mjs  — NO. See below.
registries/generated/**    (by regeneration only)
tests/coverage/{census-closure,reconciliation-table,registry-index-figures,workflow-index}.test.ts
tests/unit/{registry-build,registry-loader}.test.ts
tests/component/{coverage,workflows-page}.test.tsx
tests/e2e/coverage.spec.ts
docs/screenshots/**
```

**`scripts/build-registries.mjs` belongs to stream T this wave.** `R6-B01`'s and `R6-B02`'s fixes may
need it. **Coordinate by reporting, not by writing:** if a change there is required, state exactly
what it is and hand it back. You may still run `pnpm build`, which chains `build:registries`.

**Two other fix streams are running.** Stream S owns `docs/process/**`,
`scripts/check-gate-ordering.mjs` and a new process gate. Stream T owns
`app/super-admin/{platform-audit,trace-viewer}/**`, `registries/authored/**`,
`scripts/build-registries.mjs` and `tests/coverage/census-closure.test.ts`. **Write to none of
those** — note `census-closure.test.ts` is T's, so if `R6-B01` moves the 608 denominator, hand T the
new figures rather than editing its gate.

**Extend existing gate files rather than creating new ones**, except for the single new `out/`-wide
disclosure gate `R6-B08` needs; `scripts/check-gate-ordering.mjs` is stream S's this wave, so
**report the entry your new gate needs and let S add it.**

## Non-negotiable

- **Never run `git`.** The controller commits.
- **Regenerate, never hand-edit, anything under `registries/generated/`**; prove reproducibility with
  two generations into scratch, `diff -r` clean, both hashes pasted.
- **Prove every new gate permeable by a REAL plant**, red naming the offender, restored byte-exact
  against a checksum.
- **Assert populations by equality over a named list** wherever the claim is every member.
- **Measure rendered text with the payload stripped.** The shared helper does this now; a raw grep
  over `out/` hits 790KB of flight payload and has already fooled two people in this build.
- **Do not close a finding by making its measurement smaller.** B07 in particular can be "closed" by
  narrowing what counts as a citation. Do not.
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears**, and that gate
  now scans `registries/` too.

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
before-and-after for every published figure you touched, the plant that proved each gate, and — for
`R6-B03` and `R6-B05` — what you decided **not** to build and why.
