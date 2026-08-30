# Slice 5 — verification report

**Task 26.** Branch `slice-05-studio-authoring`, HEAD `4898117` *(fix(gates): the release
flake, diagnosed rather than waited out)*. Run 2026-08-21.

This report is what a reviewer reads instead of re-running everything. Each check states
the command, the actual output and a verdict. Where a result is partial it says which
part. Where something could not be verified it says so, and why.

**Verdict in one line:** the suite is green on a clean rebuild, the routes and the export
are correct, the source has not drifted, and both contradictions are still open — but
**`pnpm verify` returns exit 0 over a stale committed artefact**, and **no accessibility
check in this build scans any screen state**, including the states this task was told to
confirm.

---

## Summary of findings

| # | Finding | Severity |
|---|---|---|
| F1 | `registry-freshness` cannot fail inside `pnpm verify` — `build` refreshes the tree the gate then checks. A stale committed artefact rode through exit 0. | **Defect** |
| F2 | No accessibility harness drives a screen state. 9 states are reachable from the export and none is scanned outside the default. | **Gap** |
| F3 | `STATE-10` / `STATE-11` render on zero built Studio pages, although the Studio state model declares both applicable to `SCR-STU-04` and `SCR-STU-13`. Reported **unreached**, not passing. | **Gap** |
| F4 | 15 of 18 Studio modules moved to `demonstrated-in-storyboard`, not 18. One of the three (`MOD-STU-15`) owns a route slug and still reads `not-represented`. | **Reporting defect** |
| F5 | The citation split is **printed, not pinned**. Only floors are asserted; strong-by-quotation could fall from 731 to 251 and stay green. | **Ceiling** |
| F6 | The citation counts written in the gate's own doc comment (6,511 / 408 / 1,153 / 4,950) are stale. Measured today: 8,994 / 731 / 1,581 / 6,682. | **Stale prose** |

Nothing here was fixed. Per this task's brief, a fix made during verification is a fix
nobody reviewed. The one exception is stated under Check 5 and in *Working tree left
behind*.

---

## Check 1 — clean rebuild

```
rm -rf out .next && pnpm verify
```

`verify` = `typecheck && lint && test:unit && test:component && build && test:release && test:e2e`.

| stage | result |
|---|---|
| `tsc --noEmit` | pass |
| `eslint .` | pass |
| `test:unit` | **63 files, 2,062 tests passed** |
| `test:component` | **46 files, 1,737 tests passed** |
| `build` | compiled successfully in 9.2s; static export written |
| `test:release` | **11 files, 403 tests passed** |
| `test:e2e` | **303 passed (1.1m)** |

```
=== START 2026-08-20T23:43:16Z ===
=== EXIT 0 at 2026-08-20T23:47:19Z ===
```

**Exit 0.** 4,505 cases in 4m03s.

One passage in the log reads like a crash and is not one — a `build-stu-module-reach.mjs`
stack trace naming `src/studio/.zz-probe-stu-reach-78317/probe.ts`. That is a component
test planting a probe to prove the direction guard can refuse, printing the guard's own
red, then restoring. It is recorded here because it cost time to rule out and will cost
the next reader the same.

**Verdict: PASS.** With the qualification in Check 5 — this green covers a working tree
that the same command had already refreshed. See F1.

---

## Check 2 — every Studio route in the export, exactly one `<h1>`

```
find app/studio -name page.tsx        # 18
find out/studio -name index.html      # 18
```

18 source routes, 18 exported routes, names identical: `(index)`, `agents`, `approvals`,
`builder`, `capabilities`, `content-libraries`, `instruction-blocks`, `journey`,
`learning`, `localisation`, `permissions-and-grants`, `qualification-requirements`,
`screen-configuration`, `sign-in`, `training-library`, `versions`, `work-package`,
`workflow-library`.

`grep -o "<h1" out/studio/**/index.html` returns **1 on every one of the 18**. Playwright
independently asserted exactly one level-1 heading *role* on all 71 scanned routes.

*Positive control:* synthetic pages with zero and with two `<h1>` were both reported RED
by the same counter. The check discriminates.

**Verdict: PASS.**

---

## Check 3 — accessibility on every new route AND every state

Two harnesses exist, and between them they cover **routes at their default state only**.

### What was scanned

**Playwright + `@axe-core/playwright`, real Chromium** — `tests/accessibility/axe.spec.ts`,
tags `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`. The route list is derived from the export
(`tests/e2e/exported-routes.ts`), so it cannot fall behind the build.

- **71 routes**, each with three cases: no violation, exactly one `h1`, skip link on first Tab. 213 cases, all green.
- **Violations: zero on every route.**
- **Incomplete results ARE read**, unconditionally, and only `color-contrast` is allowed
  anywhere. Nothing else sat undecided on any route. The `color-contrast` allowance is
  backed numerically elsewhere by `tests/unit/token-contrast.test.ts`, not assumed.
- All **18 of 18** Studio routes are in the 71.

**jsdom axe** — `tests/component/stu-journey.test.tsx`, the 22 composed journey steps plus
`BuilderScreen` standalone. Violations `{}`, incomplete `{}` (the previously declared
`aria-prohibited-attr` exception is deleted, not emptied). It carries a vacuity control:
it plants an `<img>` with no alt and requires axe to return `image-alt`.

### What was NOT scanned — the states

**No harness drives a state.** `axe.spec.ts` calls `page.goto(path)` and scans. It never
changes a persona, never toggles a switch, never touches the state selector.

Measured from the export, the reachable state space per route is:

| control | where | positions |
|---|---|---|
| `Screen state` select | `/studio/workflow-library/`, `/studio/permissions-and-grants/`, `/studio/journey/` | **9** — STATE-01…06, 08, 12, 13 |
| `View as Studio persona` select | **all 18** Studio routes | 6 personas |
| `Simulate the connection having just returned` | `/studio/builder/` | 2 — **the editor's disconnected state** |
| `Simulate the tenant audit log being unreachable` / equivalent | builder, content-libraries, instruction-blocks, screen-configuration, approvals, versions | 2 each |

**Every one of those positions except the default is unscanned.**

Against the states this task named:

| state | status |
|---|---|
| `STATE-08`, `STATE-12`, `STATE-13` | **Reachable, not scanned.** Offered by the `Screen state` select on 3 routes. On the other 8 pages where the ids appear they are items in a list of applicable state *names* (`<li><span>STATE-08 Stale-data</span></li>`), not a rendered state treatment — so the route scan covers the list, not the state. |
| `STATE-10`, `STATE-11` on `SCR-STU-04` and `SCR-STU-13` | **UNREACHED.** `grep -rlo` over `out/studio/` returns **0 pages** for each, and no file under `app/studio/**` renders either. No control offers them. `src/studio/state/screen-states.ts` declares both applicable to exactly these two screens (`DRAFTING_AID_SCREENS`, departure 3 of 4, L48330). The screens are `/studio/screen-configuration/`, `/studio/agents/`, `/studio/learning/` — none renders the degraded or unavailable drafting aid. **Reported as unreached, never as passing.** |
| the editor's disconnected state | **Reachable, not scanned.** A checkbox on `/studio/builder/`. |

### How many slice-5 screens have had an accessibility pass — both counts

Nobody had established this. Both readings, measured:

**By route, at default state — 18 of 18, 0 not.** The derived list guarantees it: a route is
scanned the moment `pnpm build` emits its `index.html`.

**By state-driving walk — 7 of 18, 11 not.** The 22 journey steps compose 7 distinct route
screens: `workflow-library`, `builder`, `screen-configuration`, `versions`, `approvals`,
`agents`, `work-package` (8 module ids, including `MOD-STU-09` hosted on
`ScreenConfigurationScreen`, plus one seam step composing no route). The other **11** —
`/studio/`, `capabilities`, `content-libraries`, `instruction-blocks`, `journey`,
`learning`, `localisation`, `permissions-and-grants`, `qualification-requirements`,
`sign-in`, `training-library` — have only the single default-state browser scan.

That gap is not theoretical. The `aria-prohibited-attr` defect found this week on
`ContentLibrariesScreen`'s "Storyboard failure switch" block lived on
`/studio/content-libraries/` — one of the 11 the journey walk cannot reach. It was caught
only because the fix was applied at both sites rather than at the one the journey saw.

**Verdict: PARTIAL.** Every new route passes axe with zero violations and zero unexplained
incomplete results at its default state. **No state was scanned.** Two of the states named
in the brief are not reachable at all.

---

## Check 4 — `out/` carries no blueprint filename and no absolute author path

442 files, 23MB.

| pattern | files |
|---|---|
| `AVIIXA_Production_Product_Blueprint` | **0** |
| `/Users/tahakhan` | **0** |
| `/Users/` | **0** |
| `JBS-AMPLIFY-NIGHT` | **0** |
| `Ron-project1` | **0** |
| `/home/` | **0** |

Two occurrences of the bare word `Blueprint` are product content from the source — the
role names "Blueprint author" and "Blueprint / platform engineering" in
`out/workflows/index.html` and a chunk. Not the filename.

*Positive controls:* `AVIIXA` matches 308 files, so the grep reaches `out/`. Planting the
blueprint filename and the author path into a copied page turned both greps RED.

**Verdict: PASS.**

---

## Check 5 — coverage delta, MEASURED

Counted directly off the registry rows, both sides, with the same script.

**Before** — slice-4 branch point `7b61122` *(merge: slice 4 — the Delivery Operations
Hub's tenant-setup half)*:

```
183 / 4,914 items demonstrated
```

**After** — clean regeneration on this HEAD:

```
210 / 4,970 items demonstrated
```

| inventory | before | after |
|---|---|---|
| modules | 27/81 | **42/81** |
| ai-storyboards | 55/613 | **64/613** |
| workflows | 72/724 | **73/724** |
| functions | 12/990 | **13/990** |
| business-objects | 6/99 | **7/99** |
| notifications | 2/205 | 2/**261** |
| actionable-controls | 4/630 | 4/630 |
| business-use-cases | 2/330 | 2/330 |
| features | 1/534 | 1/534 |
| scheduled-work | 2/67 | 2/67 |
| sub-features · offline-scenarios · events · commands | 0 | 0 |

Numerator **+27**. The denominator also moved, 4,914 → 4,970, entirely in `notifications`
(+56 triggers, from `fa260de`), so the two fractions are not directly comparable and the
percentage should not be quoted as an improvement.

### The eighteen Studio modules: 15 moved, not 18 — F4

`MOD-STU-09`, `MOD-STU-10` and `MOD-STU-15` still read `not-represented`.

The rule, read out of `scripts/build-registries.mjs`: for each route directory (one holding
`page.tsx`), count `MOD-*` tokens in its own non-nested `.ts`/`.tsx` files and take the
**argmax** — ownership, not mention. A tie throws rather than resolving silently. Measured
mention counts confirm it exactly: the 15 demonstrated ids are precisely the 15 argmax
winners.

- `MOD-STU-09` — `slug: null` by design, authored inside Section 1 of `SCR-STU-04`, whose directory is dominated by `MOD-STU-05`.
- `MOD-STU-10` — `slug: null` by design, an inline mini-form inside `SCR-STU-04`; named in no route directory at all.
- **`MOD-STU-15` — `slug: 'agents'`. It owns a declared route.** It shares `/studio/agents/` with `MOD-STU-02`, which names itself 4 times against `MOD-STU-15`'s 2, so the argmax awards the route to its host and `MOD-STU-15` reads `not-represented`. **A module with a non-null slug reporting as not-represented is a reporting defect**, not a design outcome. Reported, not fixed.

### The mechanism was verified, not assumed

Copied `app/`, `scripts/` and `registries/raw/` into scratch and generated with
`AVIIXA_REGISTRY_OUT`. The committed tree was never touched.

```
baseline (scratch copy, app/ untouched)   42 demonstrated · MOD-STU-04 demonstrated-in-storyboard
                                          modules.json byte-identical to the in-tree regeneration
mutation: rm -rf app/studio/builder       41 demonstrated · MOD-STU-04 not-represented
```

Deleting the route flips the row. The status really is computed from the built route tree.

**Verdict: PASS on the measurement and the mechanism; PARTIAL against the brief's
expectation of eighteen.**

---

## Check 6 — re-hash the frozen source

```
shasum -a 256 ../AVIIXA_Production_Product_Blueprint.md
47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
wc -c  18565031
wc -l  122241
```

All three match the expected values exactly. **No drift.** The gate at
`tests/coverage/locator-fidelity.test.ts` re-asserts the same hash and line count and was
green.

*Positive control:* a truncated copy hashes to `f6396bff950a50be…`, not `47bd18db…`.

**Verdict: PASS.**

---

## Check 7 — the two contradictions, and the forbidden counts

### Both still disclosed, neither settled

**`DEC-LANEB-001`** — `AC-STU-097` (L33397) and `AC-STU-138` (L34332) cannot both hold for
one package-borne Lane-B value.

| built route | AC-STU-097 · L33397 | AC-STU-138 · L34332 |
|---|---|---|
| `/studio/learning/` | present | present |
| `/studio/approvals/` | present | present |

Both readings, each with its own criterion and its own locator, **on the same page** —
which is what makes it a disclosed contradiction rather than two separate claims. Pages
matching the settling regex (`is settled` / `the source settles|answers` / `the correct
reading` within 200 chars of the id): **0**.

`/studio/work-package/` names `DEC-LANEB-001` without either reading, and says so
explicitly: *"names it inside its adopted text as a dependency, which is not the same as
disclosing it."* That is an honest partial reference, not an undisclosed contradiction.

**The rollback alias** — `/studio/versions/` carries `DEC-WFROLL-001` and `DEC-VERROLL-001`
together with `L53350` and `L8623`. Two identifiers, one question, both rendered, so a
client search on either finds the same card (spec D7).

Both fixtures read the **built artefact** and both carry a self-proof: *"REMOVING EITHER
LOCATOR TURNS THIS RED — proved by removing each in turn."*

### No gate asserts 239, 187 or 164

`grep -rn "\b239\b|\b187\b|\b164\b" tests/` returns **2 hits, both inside block comments**:

- `tests/component/stu-shell.test.tsx:42` — narrating a historical claim ("239 rows claimed against 229 by its own per-module tables … No gate").
- `tests/coverage/locator-fidelity.test.ts:21` — a row in the lexer's citation-form survey table.

**Zero assertions.**

**Verdict: PASS.**

---

## The citation split — measured, not quoted

```
npx vitest run --project release tests/coverage/locator-fidelity.test.ts
90 passed
```

```
[locator-fidelity] 8994 citations in 259 files
  strong, verbatim quotation   731
  loose, absence checked only  19
  strong, identifier anchor    1581
  anchored but unproven (weak) 71
  weak, plausibility only      6682
[locator-fidelity] exempt, quoted in order to correct (5): …
```

| bucket | count | share |
|---|---|---|
| **strong** (731 quotation + 1,581 identifier anchor) | **2,312** | **25.7%** |
| **weak** (plausibility only) | **6,682** | **74.3%** |
| of which anchored but unproven | 71 | |
| exempt, quoted in order to correct | 5 | named individually |

**This bounds every evidence claim the build makes.** Three citations in four establish
only that the cited line exists, runs forwards and is not blank — not that it says
anything. That is the ceiling on the phrase "cited to the frozen source" throughout this
slice.

**F6 — the brief's figures are stale.** The task brief and the gate's own doc comment both
say 6,511 citations / 408 strong-by-quotation / 1,153 by anchor / ~4,950 weak. The tree has
grown by ~2,483 citations since that comment was written. The strong *fraction* is
essentially unchanged (24.0% → 25.7%); the absolute numbers are not. The doc comment at
`tests/coverage/locator-fidelity.test.ts:27` and `:46-49` should be corrected. **Not
corrected here.**

**F5 — the split is printed, not pinned.** The only assertions over these buckets are
floors:

```
expect(citations.length).toBeGreaterThan(5_000)
expect(strongByQuote.length).toBeGreaterThan(250)
expect(anchoredAll.length).toBeGreaterThan(1_000)
```

Strong-by-quotation could fall from **731 to 251** and the gate would stay green. The
buckets are accounted for against the total, so none can be silently dropped — but their
*sizes* are not defended.

---

## F1 — the freshness gate cannot fail inside `pnpm verify`

**This is the headline, not a footnote.**

At session entry `git status` showed `registries/generated/functions.json` modified. The
same diff reproduces exactly after `rm -rf out .next && pnpm verify`. The committed
artefact is **deterministically stale**.

**Traced:** commit `bc05bc9` *(fix(evidence): the JBS grant screen cites the lines that
state its claim)* added `FUNC-SA-16-01-A2` to
`app/super-admin/jbs-access/JbsAccessScreen.tsx`. The route-tree token scan moves that row
to `demonstrated-in-storyboard` (`12 of 990` → `13 of 990`). The regenerated artefact was
never committed. Four commits landed on top of it.

**Why `pnpm verify` returns exit 0 anyway.** `verify` runs
`… && build && test:release && …`, and `build` is `pnpm build:registries && next build`,
which **rewrites `registries/generated/` in place** — no `AVIIXA_REGISTRY_OUT`. So by the
time `test:release` runs `tests/coverage/registry-freshness.test.ts` at step 6 of 7, the
tree it compares against was refreshed by step 5. The gate compares a fresh generation
against a fresh generation and can only ever agree.

The gate's own comment concedes the scope — *"this reads the working tree, not git … in a
clean checkout those are the same thing, so in CI it means committed"* — but that reasoning
does not hold for this pipeline. **`verify` destroys the clean checkout before the gate
runs.**

**Proved red rather than argued.** Restored the stale committed file and ran the gate alone:

```
git checkout registries/generated/functions.json
npx vitest run --project release tests/coverage/registry-freshness.test.ts
exit=1
× every generated file matches a fresh generation, byte for byte
AssertionError: functions.json is stale -- run the generators and commit the result
```

The gate is not broken. **Its position in `verify` is.** This is the "gate that cannot
fail" shape RESUME §7 names, reached by ordering rather than by a weak assertion — and
unlike the four previously recorded, this one let a real stale artefact through a green
run.

**Suggested fix, not applied:** run `registry-freshness` *before* `build`, or have it
compare against `git show HEAD:` rather than the working tree.

**Scope of the stale row:** `FUNC-SA-16-01-A2` is a Super Admin function. The slice-5
Studio coverage figures in Check 5 are unaffected.

---

## Which gates read the built artefact, and which read source text

The two sets differ, and the difference is where a defect hid this week.

| evidence class | slice-5 gates |
|---|---|
| **Built artefact** (`out/**`) — 8 | 1 *(also source)*, 4, 9, 10, 12, 14, and both contradiction fixtures |
| **Source text** (`app/**`, `src/**`, or the frozen blueprint at run time) — 5 | 8, 13, 16, 17, and the file's own self-check |
| **In-memory only** (folds, registries, no file read) — 7 | 2, 3, 5, 6, 7, 11, 15 |

The accessibility harnesses split the same way: the Playwright axe scan reads the **built
export** and reaches all 18 Studio routes; the journey axe walk renders **source
components** and reaches 7. The `aria-prohibited-attr` defect on
`app/studio/content-libraries/` sat in the gap — on a screen no composed journey step
reaches. It was found by fixing the shared shape at all call sites, not by a gate.

Slice-4 gate 7 parses the frozen source **at run time**
(`tests/coverage/slice-04-gates.test.ts:1913`) rather than holding a written-down copy, so
the consistent lie has no second copy to corrupt. That is the right shape and worth
copying.

---

## The amended slice-4 ruling

Confirmed present and confirmed *amended rather than deleted*. Commit `bc79cee`
*(fix(slice-04): safety controls are evaluated first, because the source says so on the
next line)* records: the ruling was half right, eight modules were built on it, and
**exactly one shipped an observable defect** — a safety refusal rendering the wrong one of
the source's two precedence rules under a heading that said Safety controls. The original
ruling stands, marked disputed, beside a settled block carrying locators, verbatim text and
the measured reasons. The count is stated as one rather than inflated to eight.

---

## Checks that have never been seen red

Every check in this report carries a positive control, recorded inline above: the `h1`
counter (synthetic 0-h1 and 2-h1 pages both RED), the leakage greps (planted filename and
planted author path both RED, plus a control string proving the grep reaches `out/`), the
source hash (truncated copy hashes differently), the coverage mechanism (route deleted,
row flipped), the freshness gate (stale tree, exit 1), and both contradiction fixtures
(their own locator-removal proofs).

**The one exception: `pnpm verify` as a whole.** It was green on the single run made here
and no defect was planted to watch the full chain go red. Given F1, that matters — the
chain is now known to be green over at least one condition it should have caught.

---

## Unverified, with reasons

1. **Accessibility of any screen state.** Not scanned by either harness (F2). `STATE-10`
   and `STATE-11` are not reachable at all (F3) — reported unreached, never as passing.
2. **The "242 field-slots marked unrecorded" figure.** Could not be corroborated. The
   phrase "field-slot" appears nowhere in the tree. `unrecorded` occurs 15 times total —
   `src/` 7, `registries/raw/` 5, `app/` 2, `docs/census/` 1 — and **0 times in the
   generated registries**. No vocabulary I could find yields 242.
3. **The "ten brief-supplied assertions incapable of failing" count.** Twenty slice-5
   report files record findings of this shape, so the claim is corroborated in kind. I did
   not recount them individually to confirm the figure is exactly ten.
4. **Whether `pnpm verify` can go red end to end.** Not exercised. See above.
5. **`actionable-controls` remains a floor, not a figure** (4/630, unchanged across the
   slice). The join is on label text the modules reword; closing it needs a verbatim
   source-label field on the control-matrix row. Carried forward from slice 4, unchanged.

---

## Working tree left behind

`registries/generated/functions.json` is **regenerated and left modified, uncommitted**.
It is genuinely stale on HEAD — proved above — and this task's brief directs that a
genuinely stale artefact be regenerated and the fact stated. Nothing else in the tree
changed. **No commit was made.** All scratch work, including the mutation copy of `app/`,
lives outside the repository.

The stale-artefact question (F1) is a real defect in the pipeline's ordering and is left
for review rather than patched here.
