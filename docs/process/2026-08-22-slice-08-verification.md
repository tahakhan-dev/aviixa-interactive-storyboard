# Slice 8 — verification (task 22)

The fresh-eyes pass. **Nothing here was taken from a task's report.** Every number below was
measured by running the command or by opening the file, and every frozen-source claim was checked
by reading the whole line. **Nothing was repaired.** Where this pass found something wrong it is
written down here and left in place, so the record of what the build shipped stays independent of
the record of what was fixed.

Two disciplines were applied to the source throughout, because both have already cost this build
an hour each: **a line is never truncated to check it** — this source carries 1,640 lines over a
thousand characters and its longest is 6,821 — and **a span is never read as a count**; every row
count below was counted.

---

## 1. `pnpm verify`, end to end — every tail verbatim

Run in one uninterrupted invocation with no siblings live. Exit code 0.

```
$ pnpm typecheck && pnpm lint && pnpm check:gate-ordering && pnpm test:freshness && pnpm test:unit && pnpm test:component && pnpm build && pnpm test:release && pnpm test:e2e
$ tsc --noEmit
$ eslint .
$ node scripts/check-gate-ordering.mjs
Gate ordering audit: 21 release gates, all audited. 11 read a subject an earlier verify step rewrites; each says where it runs and why.
```

`typecheck` and `lint` emitted nothing, which for `tsc --noEmit` and `eslint .` is the pass.

**Freshness**

```
$ vitest run --project release tests/coverage/registry-freshness.test.ts

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  18:20:57
   Duration  1.63s (transform 20ms, setup 0ms, import 27ms, tests 1.53s, environment 0ms)
```

**Unit**

```
$ vitest run --project unit

 Test Files  114 passed (114)
      Tests  4146 passed (4146)
   Start at  18:20:59
   Duration  7.26s (transform 9.44s, setup 0ms, import 26.43s, tests 8.48s, environment 7ms)
```

**Component**

```
$ vitest run --project component

 Test Files  69 passed (69)
      Tests  2238 passed (2238)
   Start at  18:21:07
   Duration  52.16s (transform 10.49s, setup 9.09s, import 20.65s, tests 274.95s, environment 48.47s)
```

**Build**

```
$ pnpm build:registries && rm -rf out && next build
$ node scripts/build-registries.mjs && node scripts/build-doh-module-reach.mjs && node scripts/build-stu-module-reach.mjs
Route evidence: 57 modules demonstrated -- 56 by a declared slug naming a built route directory, the rest by mention argmax over the 68 route directory names under app/.
Wrote 81 rows to modules.json
...
Demonstrated-in-storyboard rows: modules 57, features 1, sub-features 0, functions 14, workflows 80, business-use-cases 2, business-objects 7, events 0, commands 0, notifications 2, offline-scenarios 0, ai-storyboards 68, scheduled-work 2, actionable-controls 4
▲ Next.js 16.3.1 (Turbopack)
✓ Compiled successfully in 1250ms
  Finished TypeScript in 1933ms ...
✓ Generating static pages using 7 workers (85/85) in 836ms
```

The generator now reports **57 demonstrated modules**, 56 of them by slug claim. The defect the
common brief records — argmax awarding a route unconditionally on top of the slug claim, so
`MOD-CC-02` read `demonstrated-in-storyboard` off a route it does not have and the inventory said
58 — is fixed in the shipped generator, and this run's own line says which rule awarded each.

**Release**

```
$ vitest run --project release

 Test Files  21 passed (21)
      Tests  676 passed (676)
   Start at  18:22:09
   Duration  62.43s (transform 1.54s, setup 0ms, import 14.56s, tests 46.21s, environment 1ms)
```

**e2e / axe**

```
$ playwright test --project=chromium
[WebServer] $ rm -rf .serve-snapshot && cp -R out .serve-snapshot && serve .serve-snapshot -p 4173 -L

Running 471 tests using 4 workers
...
  471 passed (7.2m)
EXIT_CODE=0
```

**No step was skipped.** The nine steps of `verify` all ran in order, on this tree, in one run.
4146 / 2238 / 676 / 471 match what was reported at the end of the slice.

### The gate two tasks could not run

`tests/coverage/offline-phrasing.test.ts` needs `out/`, and the brief records that two tasks could
not run it because four siblings were live — so it had never run against wave 3's or wave 4's
strings. **It ran here, over the post-wave-4 build, and it is not vacuous.** Run alone for the
detail:

```
$ npx vitest run --project release tests/coverage/offline-phrasing.test.ts --reporter=verbose
 ✓ slice 8: the sweep reads rendered runs, and finds phrasings to read > covers every built page, and the five surfaces are among them
 ✓ slice 8: the sweep reads rendered runs, and finds phrasings to read > its dictionary fires on the built tree
 ✓ slice 8: no surface renders a phrasing the honesty rule prohibits > in any state the export emits, hidden subtrees included
 ✓ slice 8: the sweep reports planted defects > reports a plain completion claim
 ✓ slice 8: the sweep reports planted defects > reports a phrase split across two adjacent elements
 ✓ slice 8: the sweep reports planted defects > reports a hidden completion claim
 ✓ slice 8: the sweep reports planted defects > reports an aria-hidden completion claim
 ✓ slice 8: the sweep reports planted defects > reports a display:none completion claim
 ✓ slice 8: the sweep reports planted defects > reports the plural of every rule that names a noun
 ✓ slice 8: the sweep reports planted defects > reports the claim written through a copula
 ✓ slice 8: the sweep reports planted defects > reports a lone state badge and leaves the honest sentence alone

 Test Files  1 passed (1)
      Tests  29 passed (29)
   Duration  3.48s
```

That closes the open item. The gate reads every `index.html` under `out/`, asserts the five
surfaces are among them, and proves it can fail by planting each of the shapes that beat its
ancestors.

---

## 2. The frozen source, re-hashed

```
$ shasum -a 256 AVIIXA_Production_Product_Blueprint.md
47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
$ wc -c  →  18565031
$ wc -l  →  122241
```

**Identical on all three.** The gate asserts the same hash independently and passed.

One measured inconsistency, in the registry rather than the source: `registries/blueprint-locators.json`
records `source.lines: 122242`. That is the length of `split('\n')` including the trailing empty
element, not a line count; the file ends in a newline and has 122,241 lines.
`tests/coverage/locator-fidelity.test.ts` trims that element deliberately and says why, and
asserts 122,241. The registry's metadata field is the odd one out. It does not affect any locator,
because the locators are 1-based line numbers — see §3.

---

## 3. Locator confirmation, measured

### The registry itself

`registries/blueprint-locators.json` holds **19,897 identifiers** and **39,138 identifier→line
pairs**. Every pair was re-opened against the frozen source in this pass:

```
identifiers 19897 · locator pairs checked 39138 · mismatches 0
```

**All 39,138.** Not a sample. Every line the registry names really carries the identifier it is
filed under.

### The split across the tree

`tests/coverage/locator-fidelity.test.ts` prints its own split rather than averaging it. Measured
on this tree, this run:

```
[locator-fidelity] 19358 citations in 500 files
  strong, verbatim quotation   1058
  loose, absence checked only  28
  strong, identifier anchor    3197
  anchored but unproven (weak) 129
  weak, plausibility only      15103
```

and the exemption list, printed by name so it can be audited:

```
[locator-fidelity] exempt, quoted in order to correct (8):
  docs/superpowers/specs/2026-08-19-slice-04-tenant-setup-design.md:54 L14531
  docs/superpowers/specs/2026-08-19-slice-04-tenant-setup-design.md:54 L14531
  src/surfaces/doh/access-conditions.ts:8 L14531
  src/surfaces/doh/access-conditions.ts:8 L14531
  tests/coverage/locator-fidelity.test.ts:384 L31453
  tests/unit/offline-capability.test.ts:66 L78827
  tests/unit/offline-conflict.test.ts:30 L80190
  tests/unit/offline-conflict.test.ts:506 L80190
```

**This is a measurement, and it disagrees with the figure the slice carried.** Every one of the
twenty-two dispatches carried "of 1,203 identifier-anchored citations in the tree, 1,019 are
confirmed at the exact line" verbatim, and the common brief calls it a measured split. Measured
now: **3,197 anchored citations confirmed at the exact line against 129 anchored but unproven**,
inside 19,358 citations across 500 files. The 1,019 / 1,203 pair is stale by roughly a factor of
three and should not be carried into slice 9's briefs unre-measured. It is not wrong about
anything — it is simply a number from an earlier tree that was copied forward.

**The same staleness is inside the gate's own header comment**, which is the more interesting
half, because that comment is where the rule "RE-DERIVED, never carried" is written down. It
states 11,899 citations in 262 files and a split of 744 / 1,806 / 100 / 9,349, and it states
"STRONG BY IDENTIFIER ANCHOR (1,153 citations)". The code beneath it measures 19,358 in 500 files
and 1,058 / 3,197 / 129 / 15,103. The comment is prose and breaks no gate; it is recorded because
the file itself records that these figures were once stale by 5,388 citations for two days, and
they are stale again.

### Scoped to slice 8's own files

Independently, over the 46 files under `src/offline/`, `src/fallbacks/`, `src/honesty/`,
`src/surfaces/cc/`, `src/frontline/modules/fl-a6/` and `src/frontline/modules/fl-a7/`:

```
L-number citations       1953
out of range                0
blank-line citations        0
```

Zero out-of-range and zero blank-line citations, measured directly rather than read off the gate.

---

## 4. What was built, counted from the code

Every figure below was produced by importing the shipping module and measuring the value, not by
reading a comment or counting a span. Where the source and the build disagree, both are given.

| what the slice claimed | measured from the code | agree? |
|---|---|---|
| 28 connectivity modes | `OFF_MODES` 28 rows, 28 distinct identifiers, `OFF-MODE-01` … `OFF-MODE-28` with no gap | yes |
| the six-member `ConnectivityMode` not widened | 6 distinct `connectivity` values on those 28 rows: online, slow, flapping, offline, dependency-down, recovering | yes |
| 7 capability classes | `OFFLINE_CAPABILITY_CLASSES` 7 | yes |
| the 52-row classification register | `OFFLINE_CLASSIFICATION` 52 rows | yes |
| one row outside the seven | 8 distinct class tokens across the 52; exactly one row fails `isOneOfTheSeven` — Conflict resolution | yes |
| the register is not module-keyed | 4 of 52 Module cells are not a single module id: one holds two ids, three hold `Cross-module` | yes |
| 37 protocol steps under 8 phases | `PROTOCOL_STEPS` 37, numbered 1..37 contiguously; `PROTOCOL_PHASES` 8 | yes |
| 37 blockers | `OFFLINE_BLOCKERS` 37, `BLOCKER_COUNT` 37 | yes |
| blocker family counts 12/10/8/4/3 | `blockerFamilyCounts()` → Content 12, Authority 10, Device 8, Intelligence 4, Distributed 3 | yes |
| 42 message texts, not 37 | re-counted in the source over the 37 entry lines: 33 carry one, `OFF-BLK-12` three, `OFF-BLK-23`/`OFF-BLK-24`/`OFF-BLK-32` two each → **42** | yes |
| 70 offline use cases in 7 groups of 10 | 40 + 30 = 70, ids `UC-OFF-001`…`UC-OFF-070` with none missing; heading counts 10/10/10/10/10/10/10 | yes |
| 16 fallback families, 70 contracts | `FALLBACK_FAMILIES` 16, `FALLBACK_CONTRACTS` 70; per-family 4,3,4,4,3,5,3,4,4,3,10,4,6,3,6,4 summing to 70 | yes |
| template 26 declared / 24 rendered / 27 in the class diagram | 26, 24, 27 — the 27 derived as 28 `+member` lines minus the class key, which is the stated subtraction | yes |
| ladder 8 rungs, 13 declared attributes, 14 at Level 2 | 8 rungs; attributes per rung 13,13,**14**,13,13,13,13,13; `LEVEL_2_EXTRA_ATTRIBUTE` = "Honest scope note" | yes |
| §37B: 8 rows, both open-count readings | `DEC_37B_TABLE` 8 rows, 5 columns; both the EIGHT and the SEVEN reading carried; 7 local disclosures (`DEC-SYNC-001` exempt) | yes |
| the convergence table the tree transcribes | `CONVERGENCE_OBLIGATIONS` 5 rows × `CONVERGENCE_COLUMNS` 4 — §36.7's, not §38's | yes |
| 21 artefacts enumerated against a claim of 22 | `ENUMERATED_ARTEFACTS` 21, with the 22-claim carried as `ARTEFACT_COUNT_CONTRADICTION` | yes |
| 12 conflict-authority families | `CONFLICT_AUTHORITY` 12 rows | yes |
| 10 quarantine reasons | `QUARANTINE_REGISTER` 10 rows | yes |
| the 20-event matrix | `OFF_EVENT_MATRIX` 20 rows | yes |
| Command Center spine: 13 modules, 13 screens | `CC_MODULE_SPINE` 13, `CC_SCREENS` 13, `CC_CLAIMED_SLUGS` 11, `CC_NAV` 12, `CC_SEAMS` 2 | yes |
| `MOD-CC-02` owns no route | `slug: null`, and it is the sole member of `CC_CHROME_MODULES` | yes |
| the decision canon untouched | `OPEN_DECISIONS` 29 records; none of `DEC-OFFCLASS-001`, `DEC-FB-008`, `DEC-SYNC-002`…`006`, `DEC-OFF-001`, `DEC-OFF-002`, `DEC-PKGMAN-001`, `DEC-STORE-001`, `DEC-PLUS-001`, `DEC-CCWRITE-001` is in it | yes |

**No count in this table disagrees with the slice's claim.** That is the finding, and it is worth
stating positively: after ten count-shaped brief errors, the code's own counts are right.

One number the slice did not claim, measured here because it changes a statement the brief carries:
`src/frontline/modules/fl-a6/charter.ts` now has **all seven `STATE-A6-*` entries carrying
`drivenHere: true`**, so `STATES_THIS_SLICE_ONLY_STATES` is empty. The wave-3 correction recorded
five; the tree has since driven the other five, and the file's own comment says so accurately
("It was five after slice 7 and is EMPTY now"). No stale claim survives there.

---

## 5. The twenty-two recorded brief errors — which were re-checked, and whether the correction holds

Twenty-six corrections were re-checked by opening the line, whole. **Twenty-four hold exactly.**
Two do not, and both are the same shape as the errors they were correcting.

### The corrections that hold

| the correction | what the line actually carries | verdict |
|---|---|---|
| `AC-OFF-701` is at L78831, not L78827 | L78831 is the criterion's own table row; L78827 is `**Acceptance criteria and tests.**` | holds |
| the 52-row register is keyed on Function | header L78766 opens `Function \| Module \| Class …`; data L78768-L78819 counted = 52 rows | holds |
| four rows do not hold one module id | L78782 holds two; L78817, L78818, L78819 hold `Cross-module` | holds |
| `AC-36-101` is at L80048 and occurs once | `grep -c` = 1, at L80048; L80042 is `FB-SYNC-01`'s Source status with three classifications and no identifier | holds |
| step 1 reads "not a server assertion" | L79908 reads exactly that; the brief's "not a server-side one" is not the source's words | holds |
| L80078 and L82464 were transposed | L80078 is a bare ` ```mermaid ` fence; L82464 is the five-command-classes sentence | holds |
| `worker-finished` stands the Run as `submitted` | L39045 reads "which stands the Run as `submitted`" | holds |
| `DEC-STORE-001` has two option sets | L79469 lists four options; L40116 lists three; and they name different owners — L79472 "the client's product owner with the Quality Manager function", L40116 "the client, through the Frontline Functional Specification" | holds |
| `DEC-STORE-001` appears six times in §35.5 | counted in L79430-L79520: 79439, 79466, 79488, 79490, 79500, 79510 — six | holds |
| the integrity failure table has eleven rows | header L79579, separator L79580, data L79581-L79591 counted = 11, six columns, blank after | holds |
| revocation is three rows with two terminal safe states | the two pre-flight rows both read `Run not enterable`; only the mid-run row reads `Run stopped, work preserved` | holds |
| the scope and version cells were paraphrased | the scope row reads "Manifest scope fields do not match the device assignment"; the version row reads "Installed build below the manifest minimum" | holds |
| "the reviewer" is at L80496 | L80496 is the reviewer/flag sentence; L80497 is the Supervisor/Resolve All bullet and contains neither word | holds |
| L78804's Reason is "only within the cache-validity rule" | the cell reads "Cached suspension state is trusted only within the cache-validity rule" | holds |
| the `MOD-FL-A7` register block is five rows, not four | L78800 is the `Encrypted on-device store` row, `Fully available offline` | holds |
| `DEC-STUCK-001` is not in §21.5 | 16 occurrences in the whole source, **none** between L36427 and L36616; L36551 and L36614 both name `DEC-CCWRITE-001`; `AC-COV-093` at L4371 is the coverage-map route | holds |
| the state inventory is thirteen rows | `STATE-13` Recovery is at L48476, below the span the brief gave | holds |
| the card span ran past its content | L36614 is the Source status paragraph and the last content line | holds |
| "the six authorisation limits" conflates two enumerations | L80781 states **three** rules; the word "six" occurs **zero** times in all of §37.1 (L80775-L80888, swept whole); L80831 titles the six-row table "the offline authorization values" | holds |
| `OFF-BLK-20` contradicts `AC-37-002` | see §7 | holds |
| L48368 says three and lists four, and a truncated read hid it | the line is 563 characters; `cut -c1-200` returns the responsive-web sentence and stops mid-word; the prohibitions sentence lists four and calls them three. L13498 and L38700 both say four | holds — with one detail wrong, see below |
| `DEC-FB-` occurs zero times in §37B | confirmed by sweep | holds |
| L81763 says four of a range of five | the sentence reads "the four sync items `DEC-SYNC-002` through `DEC-SYNC-006`"; the table carries all five as rows L81733-L81737 | holds |
| L81759 holds thirteen identifiers, none of the seven | counted: 13, and none is `DEC-OFF-001`, `DEC-OFF-002` or any `DEC-SYNC-002`…`006` | holds |
| the nine-column claim is at L85155, not L85123 | L85123 reads, whole, `1. The failure is detected at its own detection point.`; L85155 carries "The nine-column coordination table." and `AC-FB-125` at L85198 restates it | holds |
| and the table is not nine columns | header L85157 counted = **11**; data L85159-L85172 counted = **14 rows** | holds |
| "27 in the class diagram" needs a stated subtraction | L82261-L82288 carries 28 `+member` lines; the first is the class key | holds |
| `UC-OFF-036` is one row and crosses a group boundary | it is named inside `UC-OFF-042`'s entry at L81532 | holds |
| there is no group that is not ten | heading counts 10/10/10/10/10/10/10 | holds |
| `DEC-FB-002` is two lettered sub-decisions | `DEC-FB-002a` at L82673 governs media size limits; `DEC-FB-002b` at L83372 governs capacity thresholds — different questions | holds |
| `TEST-PKG-405` occurs zero times | `grep -c` = 0 | holds |
| six of twelve per-family tests exist | `TEST-36-407` … `TEST-36-411` occur zero times; `TEST-36-412` occurs once, inside the promise at L80231 | holds |
| the prose family list names eleven of twelve | L80147 enumerates eleven and stops at configuration and version state; the twelfth is the server-side-correction row at L80198 | holds |
| five diagram branches against twelve rows | L80164-L80168 counted = 5 | holds |
| §35.1's four counts | 21 stages at L79049; diagram states L79073-L79090 = 18; workflow steps L79053-L79068 = 16; authority rows L79126-L79138 = 13 | holds |
| eight of the twelve authority rows open `SoW Fact` | column 3 read on each: rows 1, 2, 4, 5, 6, 10, 11, 12 — exactly the eight named | holds |
| the hold-state claim is classified three ways | L80192 states it as `SoW Fact`; L80233 classifies the table `Derived Clarification`; `DEC-FB-008` at L82477 explicitly does not choose | holds |
| L80190 is the evidence-object row | it is; the brief that cited it for the hold row was wrong and the correction is right | holds |
| phase 8 folds step 37 in and splits it out | heading L79962 says "steps 34 to 36"; step 37 is at L79967; L79904 folds it in; the traceability table L80003-L80012 counted = 10 rows, and L80011 is `34 to 36` with L80012 a row of its own | holds |
| the `MOD-CC-10` divergences | L38089 gives the Supervisor `Allowed`, L80554 `Explicitly prohibited`; L38084 refuses the Tenant Admin the panel, L80549 gives `Allowed with conditions`; and the second row diverges too — L38085 refuses, L80550 gives "as above" | holds |
| the skew rows look divergent and are not | L38088 asks about resolving one individually; L80553 asks about including one in Resolve All — different capabilities, agreeing wordings | holds |
| chapter 21's storyboard is `SB-CC-21` | occurs exactly once, at L38144; `SCR-CC-CONF-01` occurs nine times and every one is at or after L80200 | holds |
| the route slug is `sync-conflict-review-panel` | the directory exists under that name, the spine declares it, `CC_NAV` publishes it, and the page loads | holds |
| the slug-collision gate was narrowed | `tests/unit/cc-spine.test.ts` now filters on `(byName.get(slug) ?? []).length > 1` and asserts both directions | holds |
| the failure taxonomy is a 74-row table | header L84934, separator L84935, data L84936-L85009 counted = 74; `AC-FB-101` at L85017 calls the diagram a "twelve-class sweep" | holds |
| the source's reuse paragraph under-counts | L81454 enumerates five reusers; `UC-OFF-040` at L81494 declares the same reuse and is absent from the sentence | holds |
| `UC-OFF-036` is the entry whose fields leave its heading line | heading at L81466, its own diagram at L81468-L81484, and the Five-surfaces field resuming at L81486 | holds |

### The two corrections that do not hold

**1. "§33.4's bolded headings return 30, not 24. The span L77526-L77582 contains six group
headings alongside the twenty-four fields."**

Measured four ways over the span the correction names — lines beginning `**`, `**…**` runs anywhere
in the span, `**…**` at line start, and non-empty lines — **all four return 29, not 30.** The span
contains **five** group headings, not six: "Qualification requirement fields.", "Version fields.",
"Time fields.", "Integrity and compatibility fields." and "Revocation and dependency fields."
24 + 5 = 29.

The sixth group heading is real and is **"Identity and scope fields." at L77524**, two lines above
the span's first line. Widen the span to start there and the scan returns exactly 30. So the
arithmetic in the correction is right about the section and wrong about the span it cites — which
is the span-versus-count shape the correction was itself written to catalogue. The twenty-four
fields and the two dropped ones are unaffected: L77532 is the Location identifier field and L77544
is the qualification gate posture and clearance duration field, both confirmed.

**2. "L48368 carries eight sentences and the one in question is the eighth."**

The substance is confirmed and important: the controller's `cut -c1-200` returns a sentence about
responsive web and stops mid-word, the agent was right, and a truncated line is a fragment. But the
line is **563 characters** and carries **five** sentence units — a bolded lead-in and four
sentences — and the prohibitions sentence is the **fourth**, not the eighth. The claim "eight
sentences" is not supported by the line. The general point it was making is: this source does have
lines that long and longer — 1,640 exceed a thousand characters and the longest is 6,821 — but
L48368 is not one of them.

Both are recorded rather than repaired. Neither changes a build decision; both are the record of a
correction being a claim like any other.

---

## 6. The unsettled step-number claim — settled

**Task 8 claimed the blocker register's step numbers disagree with the protocol. Task 17 checked
fifteen step references and found none. This pass re-derived the set independently and reaches the
same answer: the claim is not supported. It should be withdrawn, not carried.**

Method, because the point of settling it is that the next reader does not have to redo it. Every
`step N` / `steps N and M` / `steps N to M` token in the whole of chapter 37 — from its heading at
L80717 down to the line above §37A's heading at L81202, so §37.1, the five register sections, the
index table and its closing source-classification paragraph at L81200, not a sample — was
extracted with its line and its surrounding sentence, and each was read against `PROTOCOL_STEPS`.
Word-form step numbers ("step twenty-two") were swept for separately and occur zero times.

That yields **24 references naming 15 distinct steps: 3, 4, 6, 7, 8, 11, 12, 13, 14, 17, 18, 22,
23, 27, 30** — the same fifteen task 17 reports, reached from the text rather than from its list.

Every one is consistent, and eleven of them name the protocol step's own title back:

- `OFF-BLK-09` detects at "protocol step 8, role revalidation" — step 8 is User role revalidation.
- `OFF-BLK-13` at "protocol step 7, device suspension and wipe status check" — step 7's own title.
- `OFF-BLK-04` at "protocol step 13, local database integrity" — step 13's own title.
- `OFF-BLK-06` at "protocol step 11" against the application-version floor — step 11 is
  Application compatibility.
- `OFF-BLK-22` at "protocol step 14, queue integrity", recovering through "idempotency and
  deduplication at protocol steps 17 and 18" — steps 17 and 18 are exactly Idempotency and
  Deduplication.
- `OFF-BLK-23` at "protocol step 23" — step 23 is Conflict detection.
- The intelligence entries cancel stale requests "at protocol step 27" and rerun analysis "at step
  30" — steps 27 and 30 are Stale artificial-intelligence-request cancellation and
  Artificial-intelligence analysis rerun where still eligible.
- The clearance narratives put arrival "at step 22", and step 22 is the pass that applies the
  enabling command classes.

**The two that are worth naming, because they are the closest thing to a disagreement and they are
not one.** `OFF-BLK-12`, tenant suspension, detects "at protocol steps 4 and 7", and a narrative
says "Step 7 finds the compliance suspension". Step 4 is Tenant verification, and step 7's title is
Device suspension and wipe status check — a device-scoped title carrying a tenant-scoped
suspension. But step 7's own text is broader than its title: it reads that the device "asks whether
it has been suspended, de-authorised, or ordered wiped", and it is stated as the step "before
anything else moves". A tenant suspension surfacing at the general suspension gate is the source
being consistent with itself, not the register citing the wrong number.

**Verdict: WITHDRAWN.** There is no step-number inconsistency in the blocker register. If task 8's
finding was about something else — the §36 protocol's own internal numbering, or a step reference
outside chapter 37 — it was never stated in a form anyone could check, and it should not be
restated in slice 9's brief in the form it has been carried.

---

## 7. The four named open items — confirmed, refuted, or superseded

**`AC-OFF-701` is unsatisfiable in both directions. CONFIRMED, both readings carried, neither
adopted.**

Half one, from the register's side: the 52 rows carry 8 distinct class tokens, and exactly one row
falls outside `isOneOfTheSeven` — L78799's Conflict-resolution row, `Explicitly prohibited on the
device`. Measured on the shipped `OFFLINE_CLASSIFICATION`, not on a comment.

Half two, from the function's side: `A7_FUNCTIONALITIES_THE_REGISTER_DOES_NOT_CLASSIFY` computes to
exactly `['FUNC-A7-04-1-1']`, and that functionality's own line states "Online and offline:
identical", so assigning it a class would make the criterion pass against a fact the build wrote
down. `A7_UNCLASSIFIED_FUNCTIONALITY` carries both readings with both locators and `adopted: null`.

`OFFLINE_CLASS_CONTRADICTION` carries the seven-versus-eight question under the build's own key,
with `adopted: null`, and states in terms that the key is this build's rather than the source's
because the source names no `DEC-*` for it. **Neither reading is adopted anywhere.**

**`AC-OFF-702` is recorded and not enforced, and the code says so. CONFIRMED.**

The criterion is at L78832 and forbids a network call on the execution path of anything classified
fully available offline. The module derives the two rows it governs rather than listing them, and
`tests/coverage/slice-08-gates.test.ts` gate 2 asserts the tree contains no claim that
`AC-OFF-702` is enforced, satisfied or met, over a named file list, with the list asserted
non-empty so the check cannot pass vacuously. That is the right shape: a storyboard has no
execution path to inspect, and saying so is the deliverable.

**`OFF-BLK-20` contradicts `AC-37-002`, and both readings are carried with `adopted: null`.
CONFIRMED.**

Read whole: L81078's message text reads "Any work not yet sent cannot be recovered from this
tablet.", the same line calls it "the register's one genuinely unrecoverable entry", and the index
row at L81181 names the outcome "Unrecoverable unsynced data, named explicitly". Against it,
`AC-37-002` at L80767 forbids any blocker rendering a locally committed capture unrecoverable, and
governing rule one at L80729 says a blocker never destroys local data.

`REGISTER_SELF_CLAIMS`'s `work-is-saved` entry carries both, `adopted: null`, and — this is the
part worth checking rather than trusting — its `measured` field says the reassurance sentence
appears verbatim in 27 of 37 entries. **Re-counted in the source: 27.** The ten that do not are
`OFF-BLK-04`, `-08`, `-11`, `-13`, `-20`, `-21`, `-22`, `-23`, `-24`, `-32`, which is the seven
variants plus the two multi-audience entries plus the one that says the opposite, exactly as
claimed. The message-count claim checks too: 33 entries carry one `Message text` field,
`OFF-BLK-12` carries three, and `OFF-BLK-23`, `OFF-BLK-24` and `OFF-BLK-32` carry two — 42.

**`DEC-SYNC-006` — SUPERSEDED. The brief's open item is out of date against the tree.**

The item says no file discloses it and asks that it be handed to slice 9. Measured: it is disclosed
now. `src/offline/decisions-37b.ts` carries a full local disclosure for `DEC-SYNC-006` with both
its locators — the cap paragraph at L80504 and the source classification at L80587 — and
`DEC_37B_LOCAL_DISCLOSURES` holds seven records covering `DEC-SYNC-002` through `DEC-SYNC-006`,
`DEC-OFF-001` and `DEC-OFF-002`. `DEC-SYNC-001` is excluded because it carries an adopted working
position. So wave 4 closed it, and it should be struck from the slice-9 hand-off list rather than
repeated.

**Caveat that keeps it half-open, and it is the finding of §8:** that disclosure is in a file no
route reaches. It is disclosed in the tree and disclosed on no screen.

---

## 8. The built pages, sampled — and the largest finding of this pass

85 pages were re-generated by this run's `pnpm build` and all 85 were read.

### The defect class that was invisible to component tests

Every built `index.html` was stripped of `<script>` and `<style>`, reduced to visible text, and
swept for `undefined`, `[object Object]`, `NaN`, `${`, and for `data-*` attributes carrying
`undefined` or empty. **No page carries the `fl-panel-undefined` defect or anything like it.**
Eight hits surfaced and all eight are legitimate prose or legitimate data:

- `${id}@L${sourceLine}` on the workflows coverage page, inside a sentence describing the
  deduplication key.
- four pages using the word "undefined" in prose, three of them in sentences about what the source
  leaves undefined and one about `DEC-PLUS-001`.
- `null` on three pages, each inside a sentence about a function that never returns one.
- `data-classes=""` on `/frontline/profile-lite/`, which is the correct rendering: that verb is
  "classified by no row of the register", the empty attribute is the claim, and the visible text
  says so.

### What reaches a route, and what does not

Import reachability was computed from all 164 files under `app/` across every `@/` and relative
specifier: 434 files of the tree are reachable. **Nineteen slice-8 files are not.**

```
UNREACHED from app/:
  src/fallbacks/ladder.ts
  src/honesty/HonestElement.tsx
  src/honesty/artefacts.ts
  src/honesty/lexicon.ts
  src/offline/blockers.ts
  src/offline/decisions-37b.ts
  src/offline/event-matrix.ts
  src/offline/package/integrity.ts
  src/offline/package/lifecycle.ts
  src/offline/package/manifest.ts
  src/offline/state-contract.ts
  src/offline/use-cases/group-a-d/catalogue.ts
  src/offline/use-cases/group-e-g/catalogue.ts
  src/surfaces/cc/access.ts
  src/surfaces/cc/modules/cc-02/SyncStateChrome.tsx
  src/surfaces/cc/modules/cc-02/chrome.ts
  src/surfaces/cc/modules/cc-02/matrix.ts
  src/surfaces/cc/modules/cc-10-s366/SecondTreatmentDisclosure.tsx
  src/surfaces/cc/modules/cc-10-s366/matrix.ts
```

Confirmed the other way, by grepping the built HTML rather than the import graph: `OFF-BLK-` ids
appear on one built page and it is the generated workflows coverage index, not a hand-built screen.
`UC-OFF-` ids appear on two, both generated coverage indexes. `FB-SYNC-`, `FB-PKG-`, `AC-36-101`,
`AC-37A-005`, `AC-FB-125`, `AC-37-002`, `OFF-BLK-20`, `DEC-OFF-001`, `DEC-OFF-002` and
`DEC-SYNC-006` appear on **zero** built pages.

**Three of these are declared and expected. One is not.**

- `cc-02` is declared: `CC_SEAMS` carries `sync-state-chrome-host`, which states that `MOD-CC-02`
  is chrome with no route of its own, that the register puts it on `SCR-CC-02` beside `MOD-CC-01`,
  and that `MOD-CC-01` is slice 9's, so "the chrome has nowhere to be rather than that it is
  absent". `src/honesty/HonestElement.tsx` is unreached for exactly that reason — its only
  importer is `cc-02`. That is a declared seam and a correct one.
- `src/offline/package/*`, the catalogues, the blocker register, the §37B table and the event
  matrix are central data with no screen yet. The slice's own framing is that chapters 34-38 carry
  no module identity cards and the `SURF-CC` spine is filled by slice 9, so this is consistent with
  the slice's remit — but it is not declared anywhere as a seam the way `cc-02`'s is.
- **`src/surfaces/cc/modules/cc-10-s366/` is not declared, and it should be.** Its own file header
  says: "The route is `app/command-center/sync-conflict-review/` and it belongs to the chapter-21
  task; this exports a component and **the controller wires it beneath that treatment**." The
  controller did not wire it. `SecondTreatmentDisclosure` is imported by no page and by no
  component test — `tests/unit/cc-10-s366.test.ts` reads the file as text and never renders it, and
  `tests/component/` has `cc-10.test.tsx` and `cc-02.test.tsx` and nothing for the second
  treatment. **§36.6's nine-row treatment of `MOD-CC-10`, with its four divergences and its
  `DEC-PLUS-001` and `DEC-SYNC-006` disclosures, has never been rendered by anything.**

  The route it names in that sentence, `app/command-center/sync-conflict-review/`, is the shorter
  slug the common brief records as a brief error; the directory that exists is
  `app/command-center/sync-conflict-review-panel/`, and `app/command-center/sync-conflict-review-panel/page.tsx`
  renders only `SyncConflictReviewPanel`, the chapter-21 treatment.

This matters beyond tidiness. The obligation the common brief states — "an unresolved source
decision is disclosed on screen with its alternatives and this build's pick labelled a
client-delegated choice" — is met in the tree for `OFF-BLK-20` versus `AC-37-002`, for
`DEC-SYNC-006`, for `DEC-OFF-001` and `DEC-OFF-002`, and for the §36.6 divergences, and is met on
screen for none of them.

### What the one slice-8 Command Center route does render

`/command-center/sync-conflict-review-panel/` renders 8,609 characters of visible text, carries the
`DEC-PLUS-001` disclosure with both readings and the "client-delegated" label twice, names
`SB-CC-21`, and declares the conflict-cap decision as a gap the shared canon does not hold. The
page is real, not a stub. It draws no resolution control, which is what the seam requires.

`/command-center/` itself is still the surface placeholder: it renders the surface statement and
**no links at all**, so `CC_NAV`'s twelve entries publish no dead hrefs from it. Checked
explicitly, because a nav publishing paths for eleven unbuilt directories is exactly the failure
the slug correction was written against. It does not happen — but it also means the one built
Command Center screen is reachable only by typing its URL.

---

## 9. What remains open

Each item, its reason, and whose it is. Not "substantially complete" — the items.

1. **`SecondTreatmentDisclosure` is not wired to any page.** §36.6's treatment of `MOD-CC-10` is
   transcribed, gated and never rendered. The file's own header says the controller wires it and
   names a route path that does not exist. **Owner: the controller.** Either wire it beneath the
   chapter-21 panel on `/command-center/sync-conflict-review-panel/`, or declare it in `CC_SEAMS`
   the way `cc-02`'s absence is declared and correct the route path in its header. It is not
   repaired here because a verification pass that fixes its own findings destroys the record.

2. **Ten slice-8 registers reach no screen and no seam declares it.** The 37-blocker register, both
   use-case catalogues, the §37B decision table, the 20-event matrix, the state contract, three of
   the five package modules and the fallback ladder. The `OFF-BLK-20` / `AC-37-002` contradiction,
   `DEC-OFF-001`, `DEC-OFF-002` and `AC-37A-005`'s vacuity finding are therefore recorded in code
   and disclosed on no screen. **Owner: slice 9**, which builds the eleven remaining Command Center
   screens — but the declaration is owed now, in the same form `cc-02`'s seam takes, so slice 9
   inherits a statement rather than a discovery.

3. **The `1,019 of 1,203` locator figure is stale and was carried verbatim into twenty-two
   dispatches.** Measured now: 3,197 confirmed at the exact line, 129 anchored but unproven, inside
   19,358 citations across 500 files. **Owner: whoever writes slice 9's common brief.** Re-derive
   it from the gate's printout rather than carrying it.

4. **`tests/coverage/locator-fidelity.test.ts`'s header comment states figures the file's own code
   contradicts** — 11,899 citations in 262 files against 19,358 in 500, and a four-way split every
   number of which has moved. The comment is where "RE-DERIVED, never carried" is written down.
   **Owner: whoever next edits that file.** No gate is affected.

5. **The §33.4 heading-count correction is off by one against the span it names**, and the
   L48368 sentence-position detail is wrong. Both are in
   `docs/superpowers/plans/2026-08-22-slice-08-common-brief.md`. **Owner: the controller**, since
   the brief is the durable record and slice 9's brief will inherit both. The substance of each
   correction stands; only the arithmetic and the sentence index are wrong.

6. **Task 8's step-number finding is withdrawn by this pass.** Settled in §6 above against every
   step reference in chapter 37, not a sample. **Owner: the controller** — strike it from the
   hand-off rather than carrying it a third time. If task 8 meant something outside chapter 37, it
   was never stated checkably and the restatement should say so.

7. **`DEC-SYNC-006` should be struck from the slice-9 hand-off as an undisclosed decision.** It is
   disclosed, in `src/offline/decisions-37b.ts`, with both its locators. What survives is item 2:
   the file reaches no route. **Owner: the controller** for the hand-off list, slice 9 for the
   screen.

8. **`registries/blueprint-locators.json` records `source.lines: 122242` where the file has
   122,241 lines** — the trailing empty element of a `split('\n')` counted as a line. No locator is
   affected; all 39,138 were re-verified against the source with zero mismatches. **Owner:
   whoever next regenerates that registry.**

9. **`/command-center/` links to nothing**, so the one Command Center screen this slice built is
   reachable only by URL. Correct today — the index and its board are `MOD-CC-01`'s and unbuilt —
   but it is the state in which a dead-link defect would be invisible. **Owner: slice 9**, when the
   live shift board arrives.

10. **`§36.6` calls `SCR-CC-10` by a second identifier.** Confirmed: `SCR-CC-CONF-01` occurs nine
    times, all at or after L80200, and the register's name for that screen is the one the spine
    uses. Two names for one screen, unsettled, and it will read as a fourteenth screen to anyone
    who meets it cold. **Owner: slice 9.** Already recorded in the common brief; re-confirmed here
    rather than re-discovered there.

---

## 10. This document is inside the gate's scan, and the gate caught it

Worth recording, because it is the only demonstration in this pass that a gate fired on something
written after the slice closed. The first draft of §6 above described the sweep window as ending
one line above §37A's heading — and wrote that number down. **That line is blank.**
`tests/coverage/locator-fidelity.test.ts` lexed the number out of this file and went red naming
this document, this line, and the blank-line class:

```
 FAIL  locator fidelity: weak checks — plausibility only > cites no span that is entirely blank
AssertionError: expected [ Array(1) ] to deeply equal []
+   "docs/process/2026-08-22-slice-08-verification.md:374 cites <the blank line>",
```

The offending number is not reproduced here, for the reason the common brief gives: naming a blank
line even in order to describe naming it files the same false citation a second time, and this
gate does not care why. The sentence was rewritten to name the lines that carry what it says they
carry — the chapter
heading at L80717, §37A's heading at L81202, and the closing source-classification paragraph at
L81200. Re-run green, and the whole release project re-run green with this document in the tree:

```
$ npx vitest run --project release
 Test Files  21 passed (21)
      Tests  676 passed (676)
   Duration  60.53s
```

That is a correction to this document's own prose, not a repair of a finding. Every item in §9 is
untouched.

---

## 11. What this pass did not do

It did not edit a source file, a test, or any document other than this one. It ran no git command.
It did not repair anything it found. Everything in §9 is left exactly as the slice shipped it.
