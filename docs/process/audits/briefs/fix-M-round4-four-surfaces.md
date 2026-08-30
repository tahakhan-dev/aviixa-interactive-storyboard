# Fix stream M — the four surfaces stream K does not own

Authority APP-016 item 1, slice-11 audit round 4, findings `R4-C01` … `R4-C07`. The full register is
`docs/process/audits/2026-08-25-slice-11-audit-round-4-findings.md`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

Every locator below was reported by an auditor who measured it, and the two marked
**controller-verified** were re-measured by the controller. Treat the rest as hypotheses: **open the
line before you build from it.** Controller and brief locators have been wrong fifteen times in this
build, every one caught by an agent who opened the file.

---

## R4-C01 · Critical · three Hub pages ship a React error message as their browser tab title

**Controller-verified.** These three built pages carry a thrown error as their `<title>`:

```
out/hub/audit-and-retention/index.html
out/hub/multi-area-job-pairing/index.html
out/hub/parts-registry/index.html
```

The rendered title reads, in full:

> `function(){throw Error("Attempted to call SCREEN_TITLE() from the server but SCREEN_TITLE is on
> the client. …")} — Delivery Operations Hub · AVIIXA Interactive Storyboard`

Reproduce with:

```
for f in $(find out -name index.html | sort); do grep -o '<title>[^<]*</title>' "$f"; done | grep -c Attempted
```

**Cause.** Each `app/hub/<slug>/page.tsx` imports `SCREEN_TITLE` from a sibling screen module whose
first line is `'use client'`. Next substitutes a throwing client-reference proxy, and the metadata
template literal stringifies the proxy instead of the string. **`app/hub/devices/page.tsx` already
does this correctly** — it imports the title from a non-client `fixtures.ts`. Follow that pattern.

The correct titles exist in the tree and are unused: *Audit log explorer*, *Multi-Area Job Pairing —
the paired scheduling view*, *Parts registry*. Use the exact strings already authored; do not invent
new ones.

**The gate is the other half of this finding.** `tests/unit/routes.test.ts` asserts `metadata.title`
for the **five surface index pages only** — a subset population over 102 route pages, which is round
2's shape. Widen it to **every route in the registry**, by equality against the route list, and
assert no title contains `Attempted to call`, `function(`, `throw `, `undefined` or an empty string.
Prove the widened gate reds by restoring one of the three broken imports in a scratch copy.

## R4-C02 · Important · "nine acceptance criteria" against a chapter that has six

**Controller-verified.** `app/hub/shift-management/fixtures.ts` renders, on
`/hub/shift-management/`, that an overlap refusal appears "nowhere in this module's own chapter — not
in the matrix, not in the feature list, not in the **nine** acceptance criteria, not in the ten
tests."

Measured whole-source, so no second block exists:

```
grep -oE '\bAC-DOH-03-[0-9]+\b'      ../AVIIXA_Production_Product_Blueprint.md | sort -u   # 6
grep -oE '\bTEST-DOH-03-[A-Z0-9]+\b' ../AVIIXA_Production_Product_Blueprint.md | sort -u | wc -l   # 10
```

Six, not nine. The tests figure is correct. **Prefer computing the figure** over hardcoding a
corrected literal — the sibling Frontline pages already compute theirs, and C03 is what a hardcoded
literal becomes.

## R4-C03 · Important · a chapter-wide gap understated by 27

`src/frontline/modules/fl-a7/ProfileLiteView.tsx` states that "**Twelve** functionalities elsewhere
in this chapter name no `FB-FL-*` pattern". The measured figure over the chapter's 181 `FUNC` entries
is **39**:

```
grep -nE '^\s+- `FUNC-(A[1-7]|B(8|9|1[0-2]))-' ../AVIIXA_Production_Product_Blueprint.md \
  | grep -vE 'FB-FL-[A-Z]+-[0-9]+' | wc -l
```

Per module: A1 1 · A2 3 · A3 2 · A4 8 · A5 12 · A6 2 · A7 0 · B8 1 · B9 1 · B10 4 · B11 2 · B12 3.
**Twelve is A5's count alone.**

**The tree already contradicts itself here.** The eleven sibling module pages each disclose their own
number correctly — "3 of this module's 11", "4 of the 13", "Three of the nine" — and they sum to 39.
Derive this page's figure from the same per-module data the siblings use. The component test asserts
only the sentence's first clause; extend it to the figure.

## R4-C04 · Important · twelve rendered citations name a sibling of their own family

673 distinct identifier/line pairs were checked across the 75 in-scope pages: 638 exact, 35 within
120 lines, 0 beyond, 0 phantom. Twelve of the 35 are **not** the legitimate section/row idiom — the
cited line carries a different member of the same register, with a sibling sitting between the
identifier and the cited line.

In `app/hub/shift-management/fixtures.ts`:

| id | cited | actual | what the cited line carries |
|---|---|---|---|
| FUNC-DOH-03-1.2.1 | 27349 | 27345 | FUNC-DOH-03-2.1.1 |
| FUNC-DOH-03-1.2.2 | 27350 | 27346 | SUB-DOH-03-2.2 header |
| FUNC-DOH-03-2.1.1 | 27351 | 27349 | FUNC-DOH-03-2.2.1 |

In `app/hub/worker-lifecycle-and-qualifications/fixtures.ts`:

| id | cited | actual | what the cited line carries |
|---|---|---|---|
| FUNC-DOH-04-1.2.1 | 27550 | 27544 | FUNC-DOH-04-2.2.1 |
| FUNC-DOH-04-2.1.1 | 27551 | 27547 | FUNC-DOH-04-2.2.2 |
| FUNC-DOH-04-2.1.2 | 27552 | 27548 | SUB-DOH-04-2.3 header |
| FUNC-DOH-04-2.3.1 | 27554 | 27553 | FUNC-DOH-04-2.3.2 |
| FUNC-DOH-04-3.1.1 | 27556 | 27557 | SUB-DOH-04-3.1 header |
| FUNC-DOH-04-3.1.2 | 27557 | 27558 | FUNC-DOH-04-3.1.1 |
| FUNC-DOH-04-3.1.3 | 27558 | 27559 | FUNC-DOH-04-3.1.2 |
| FUNC-DOH-04-3.2.2 | 27561 | 27562 | FUNC-DOH-04-3.2.1 |
| AC-28.4-01 | 52774 | 52773 | AC-28.4-02 |

**Open every one of the 24 lines with `sed -n 'Np'` before changing anything.** If a proposed "actual"
does not carry its identifier, report that rather than writing it. The other 44 citations in those
two files are exact — do not touch them, and do not "correct" a citation of the section/row form,
which is legitimate and which round 2 nearly broke five accurate citations by misreading.

## R4-C05 · Important · three Studio citations whose lines carry neither the identifier nor the quoted words

- `src/studio/modules/stu-06/BlockEditorView.tsx` — `FUNC-STU-06-03-A-1` cited at **32493**; the
  rendered sentence ("Publication in a declared locale is refused until every one is authored") is at
  **32489**. Line 32493 is a happy-path step. This one ships in
  `out/studio/instruction-blocks/index.html`.
- `src/studio/modules/stu-05/matrix.ts` — `FUNC-STU-05-02-A-1` cited at **32284**; the quoted roles
  string is verbatim at **32286**. Line 32284 is the feature header.
- `src/studio/modules/stu-05/matrix.ts` — a bare-locator quotation ("Author all nine configuration
  sections | … | GRANT-STU-IMPL | Allowed with conditions") attributed to **34546**; the quoted row
  is at **34545**. Line 34546 is a different row whose final cell is also `Allowed with conditions`,
  which is exactly why the substitution reads correctly and nobody caught it.

All three corroborate a Derived Clarification about who holds the implementation grant and who may
block a publication.

## R4-C06 · Important · the citation gate narrowed its own population three times

`tests/coverage/citation-graph.test.ts`. Replaying it reproduces 2,129 citations · 1,960 known ·
1,856 exact · 73 within-section · 31 uncorroborated · 12 uncorroborated in code. Three holes, and
**C04 and C05 are what fits through them**:

1. **`withinSection` (reach 120) passes any citation up to 120 lines after an occurrence of its
   identifier.** Seven of C04's twelve are one to six lines after. **Add one predicate:** reject when
   the cited line itself carries a different identifier sharing the citation's family prefix. The
   auditor measured that this convicts all seven and convicts none of the documented-correct
   section/row cases — re-measure that yourself before committing, naming the cases you checked.
2. **The code population is capped at ≤20 and names none of its members**, where the prose population
   is named exhaustively. Occupancy is 12, so eight wrong citations can land silently — and four
   current occupants are C04 defects sitting inside the allowance. **Name the code population the way
   the prose population is named.**
3. **A citation whose identifier is absent from `registries/blueprint-locators.json` is dropped, not
   checked.** In `src/` and `app/` that is 75 ungraded claims: 64 exact, 9 non-exact, and two naming
   identifiers that occur **nowhere in the frozen source** — `SB-SEC-013-S1` at line 105076 and
   `WF-LEDGER-EXPORT` at line 2765, both under `app/super-admin/**`. **Those two are fix stream K's
   files, not yours: report them in your findings, do not edit them.** Assert that a citation whose
   identifier is absent from the index is checked against the source rather than skipped.

Fixing hole 3 will surface the nine non-exact ungraded claims. Fix the ones inside your path list and
report the rest.

## R4-C07 · Minor · an em dash becomes a comma inside quotation marks

`app/hub/permissions-roles-and-access/fixtures.ts` renders: `The register row for the Supervisor and
the Quality Manager reads "Read-only, own scope" (L28532).` Line 28532 reads
`` `Read-only` — own scope ``. Backtick-stripping alone yields the em dash, so this is not the
markdown-stripping the earlier fix accounts for. Restore the em dash inside the quotation.

---

## Files you own

```
app/hub/audit-and-retention/**            app/hub/multi-area-job-pairing/**
app/hub/parts-registry/**                 app/hub/shift-management/**
app/hub/worker-lifecycle-and-qualifications/**
app/hub/permissions-roles-and-access/**
src/frontline/modules/fl-a7/**            src/studio/modules/stu-05/**
src/studio/modules/stu-06/**
tests/unit/routes.test.ts                 tests/coverage/citation-graph.test.ts
tests/component/fl-a7.test.tsx            tests/unit/hub-*.test.ts   tests/unit/studio-*.test.ts
tests/component/hub-*.test.tsx            tests/component/studio-*.test.tsx
```

**Fix stream K is running concurrently** and owns `app/super-admin/**`, `src/surfaces/sa/**`, five
Command Center pages, `scripts/build-registries.mjs`, `registries/generated/**`, `tests/unit/sa-*`,
`tests/component/sa-*` and `scripts/check-gate-ordering.mjs`. **Do not write to any of those.** If a
fix of yours requires one, stop and report it rather than reaching across.

## Non-negotiable

- **Never run `git`.** Not status, not add, not checkout. The controller commits.
- **Open every line before you build from it.** Twenty-four line numbers appear in C04 alone.
- **Prove every new or widened gate is permeable by planting a REAL defect**, watching it red, and
  restoring. A plant that changes nothing gives a green run indistinguishable from a sound gate;
  round 3 lost a cycle to `&& true &&`. Plant into a `/tmp` copy or replay in node, and say which.
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears**, including in a
  comment about a bad citation. Write suspect locators as separate `id` and `line` fields.
- Bare `§N.N` in this repository means the **blueprint**, whose chapters collide with the master
  prompt's section numbers. Write "master prompt §X" when you mean the prompt.
- **Fix once, where all callers route.** Count the call sites before and after and put both counts in
  your report. C01 is three pages with one cause.

## Verification before you report

Run all of these from the repo root, read the exit codes, and report exact counts:

```
npx tsc --noEmit
pnpm test:unit
pnpm test:component
pnpm test:release
pnpm build
npx playwright test --project=chromium
```

Then re-run the C01 title measurement against the rebuilt `out/` and report the count — it must be 0.

Report per finding: what you changed, the file and line, the evidence you measured with the command
that measured it, and the plant that proved each gate. If you could not close a finding, say so
plainly with why. An honest partial beats a claimed close.
