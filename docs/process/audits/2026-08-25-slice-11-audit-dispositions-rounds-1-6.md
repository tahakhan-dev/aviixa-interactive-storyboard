# Slice-11 audit — dispositions, rounds 1 to 7

*The file name still says rounds 1 to 6 and is deliberately left alone: six other artefacts and one
gate constant cite this path — `grep -rln "dispositions-rounds-1-6" docs/ tests/ scripts/` returns
seven files, none of them this one — and a rename buys a tidier name at the cost of every citation
to it. The heading is the record; the name is an address.*

Authority APP-016 item 1, round-6 finding `R6-B06`. Master prompt §29.4 conditions 5 and 6 —
no Critical or Important finding open, every Moderate and Minor explicitly dispositioned — are
the two the closing obligation turns on, and until this file existed neither could be evaluated.

**What was on disk before this file.** One disposition table, covering round 1, measured at a head
seven commits back and recording 7 OPEN and 6 PARTIAL. Rounds 2 and 3 were prose. Rounds 4, 5 and 6
had no disposition record of any kind. `RESUME` §8 read "all dispositioned and fixed" for two rounds
and nothing on disk reproduced it.

**`tests/coverage/process-evidence.test.ts` reads this file.** Every finding id a register
enumerates must appear here exactly once, with a severity matching the register's; every `OPEN` and
`PARTIAL` row must carry a reason and an owner; every round's declared total must equal what this
file enumerates plus what it records as unrecoverable; and every verdict and basis must come from
the closed vocabularies below. It was proved permeable by removing a real row and watching it red.

## The two columns that carry the honesty

**`verdict`** is one of `CLOSED`, `OPEN`, `PARTIAL`.

**`basis`** is how the verdict was reached, and it is the column that stops this file becoming the
next unreproducible claim:

| basis | means |
|---|---|
| `MEASURED` | someone opened the file or ran the command and recorded what it said. The evidence column names it. |
| `REGISTER` | closed on the successor register's own declaration and its fix stream's commit, **not re-measured here**. |

**87 of the 169 enumerated rows are `MEASURED`; 82 are `REGISTER`.** That split is the disclosure,
and `tests/coverage/process-evidence.test.ts` case 12 re-derives both figures from the rows and
requires this sentence to state them — with `REGISTER` held as a ceiling and `MEASURED` as a floor,
so converting a row by re-measuring it (the remedy this file prescribes) passes and reclassifying
rows to flatter the split cannot.
A `REGISTER` row is a lead, exactly as a graph result is: the round-6 audit spot-checked one of the
thirteen round-1 rows and found it genuinely closed, which is evidence the declarations are broadly
sound and is not evidence that any particular one is.

## Per-round summary — declared against enumerated

`declared` is the register's own figure, quoted. `enumerated` is what this file's tables carry.
`unrecoverable` is a finding the register declares that no id in any artefact can name.

| round | register | declared | enumerated | unrecoverable | reconciles |
|---|---|---|---|---|---|
| 1 | `2026-08-24-slice-11-audit-findings.md` | 42 | 42 | 0 | yes |
| 2 | `2026-08-24-slice-11-audit-round-2-findings.md` | 20 | 25 rows / 24 distinct | 0 | **no — see below** |
| 3 | `2026-08-25-slice-11-audit-round-3-findings.md` | 15 | 8 | 7 | yes |
| 4 | `2026-08-25-slice-11-audit-round-4-findings.md` | 30 | 29 | 1 | yes |
| 5 | `2026-08-25-slice-11-audit-round-5-findings.md` | 20 | 20 | 0 | yes |
| 6 | `2026-08-25-slice-11-audit-round-6-findings.md` | 15 → **17** | 17 | 0 | yes, after the register's own totals line is corrected |
| 7 | `2026-08-25-slice-11-audit-round-7-findings.md` | 28 | 28 | 0 | yes — counted from the register's 28 `###` headings, 10 + 13 + 5 by stream |

**Round 2 does not reconcile, and this file does not pretend it does.** The register says "Twenty
findings". Twenty-five ids are recoverable across it and briefs E, F and G; the register states that
`R2-P01` and `R2-C01` are one finding under two numbers, which gives **twenty-four distinct
findings** against a declared twenty.

Three of the four are accounted for by the register's own text. `R2-P09` is headed "added after
dispatch" and `R2-P10` "found while finishing a dead stream's work" — both landed after the twenty
was written. And the register records "two streams found the same two findings independently": the
first convergence is the `R2-P01`/`R2-C01` pair already removed above, and the second, named only as
"the mount-findings staleness", is presumably a second dual numbering, which removes one more.

**That leaves twenty-one, not twenty, and the last one is not accounted for.** The reconstruction is
a reading of the register's prose rather than a measurement, it lands one off, and the row above
therefore records the enumeration and not the reconstruction. Separately, `R2-C02` and `R2-C04`
appear in no register and no brief; two id slots in the sequence are simply unexplained, and nothing
says a finding was ever issued under either.

## Severity discipline — the declared split against the enumeration

The gate re-derives each register's severity distribution from its own headings and compares it to
these tables. Two registers declared a Critical count their enumeration does not support, and both
are corrected in place — correcting a register's arithmetic, not its findings.

| round | Critical declared | Critical enumerated | note |
|---|---|---|---|
| 1 | not declared | 9 | the register declares no split |
| 2 | "four Critical" | 5 | the four the register tables — `R2-G01`, `R2-P01`/`R2-C01`, `R2-P02`, `R2-C03` — plus `R2-P10`, its own late addition |
| 3 | not declared | 3 | `R3-01`, `R3-06`, `R3-U01` |
| 4 | not declared as a total | 7 | the register declares "three in stream B, one in stream C, one found by a fixer" — accurate per stream; stream A's table adds two |
| 5 | "Three Critical" | 4 | **corrected in the register to four**: `R5-B01`, `R5-A01`, `R5-A02`, `R5-Q01` |
| 6 | "Three Critical" | 2 | **corrected in the register to two**: `R6-B04`, `R6-B06`. Stream B's own header already said two. |
| 7 | "Two Critical, both stream B." | 2 | agrees: `R7-B01` and `R7-B02`, both in the document a client opens first. The gate parses the number word out of the register's own sentence rather than requiring a fixed phrasing. |

---

## Round 1 — 42 findings, all measured

Twenty-nine rows carry the verdict and wording of `2026-08-24-slice-11-audit-dispositions.md`, which
measured them on the tree at head `7a443dc`. Those twenty-nine are carried **verbatim**, including
their then-current file:line references — `C-22`'s `RESUME.md:878-882` names a line in a file since
rewritten to 435 lines, and it is left as written because the row is a quotation of what was
measured, not a claim about today. **The thirteen that file left `OPEN` or `PARTIAL` were re-verified
against the tree as it is today**, and their evidence column is this stream's own measurement.

| id | severity | verdict | basis | held by | evidence / reason | owner |
|---|---|---|---|---|---|---|
| C-00 | Critical | CLOSED | MEASURED | `docs/process/2026-08-24-slice-11-verification.md` and `docs/process/2026-08-25-slice-11-round-2-verification.md` | The verdict said "no slice-11 verification record exists", measured at head `7a443dc`. Commit `413d8d3` wrote one two commits later and `ad4cef7` wrote a second; both record e2e (545) as a numbered chain step. RESIDUAL, and it is why this stream appended `VER-S11-039`: neither record covers rounds 3-6, so the newest verification record on disk was six rounds old until today. | - |
| C-01 | Important | CLOSED | MEASURED | `axe-states` both-directions equality | viewer control is the screen's, not an `unreachedRoutes` row | - |
| C-02 | Important | CLOSED | MEASURED | axe `heading-order`, driven | verified on the served export, not only in source | - |
| C-03 | Important | CLOSED | MEASURED | axe `landmark-unique` | 30 cards, 30 distinct labels, 0 named inner regions | - |
| C-04 | Moderate | CLOSED | MEASURED | set equality over derived hrefs | the literal 19 is gone; 19 modules + 1 non-module route = 20, and the export carries 20 | - |
| C-05 | Critical | CLOSED | MEASURED | new reachability gate | the abstention is replaced by a named mount and a gate that reds when it rots | - |
| C-06 | Critical | CLOSED | MEASURED | a fresh parse of L27909-L27920 | 60 cells / 45 prohibited / 37 bare / 8 qualified, derived twice, no stored copy | - |
| C-07 | Important | CLOSED | MEASURED | measurement in the paragraph | 7 Frontline routes, 0 mount the overlay; the false sentence survives only inside quoted history | - |
| C-08 | Important | CLOSED | MEASURED | the claim, not the banner | walks `app/frontline`, floors on `page.tsx` count, asserts `[]` | - |
| C-09 | Moderate | CLOSED | MEASURED | removal | all three sites derive from `.length`; with no literal left there is no copy to go stale | - |
| C-10 | Minor | CLOSED | MEASURED | both-directions equality | population defined by identifier, not by diff; 52 bearing, 54 in population, 10 named outside | - |
| C-11 | Critical | CLOSED | MEASURED | word-bounded negation + synthesised controls | plant confirmed: the old predicate acquitted "is now monitoring" | - |
| C-12 | Critical | CLOSED | MEASURED | presence AND inertness together | plant renamed the control id and the case red | - |
| C-13 | Critical | CLOSED | MEASURED | one exported list, three importers, plus plant P19 | `MANUFACTURING_SEVERITY_SYMBOLS` and `OPERATIONAL_SEVERITY_SYMBOLS` are declared once, in `tests/coverage/absence-sweep.ts:76,87`. The three consumers named in the finding import them: `tests/unit/ai-failures.test.ts:7`, `tests/coverage/slice-11-gates.test.ts:7`, `tests/component/ai-degradation-overlays.test.tsx:6`. No inline restatement survives anywhere in the tree - the verdict's "third restates two names inline" is gone. | - |
| C-14 | Important | CLOSED | MEASURED | four annotation spellings + live limit | plant annotated the real vocabulary and it red | - |
| C-15 | Important | CLOSED | MEASURED | both halves live: a quote-style case and a barrel-edge enumeration | The specifier class is `['"]` at `tests/coverage/slice-11-gates.test.ts:992`, asserted directly by `its specifier matcher reads both quote styles and a multi-line import` (:1182), which exercises single, double and multi-line forms. The second half - the verdict's "`.tsx`-only closure is prose, not a live expectation" - is now `barrelComponentEdges` (:1058), enumerating every `.ts` module re-exporting a `.tsx` one and asserted at :1145, so the stated limit reds the day it becomes reachable. | - |
| C-16 | Important | CLOSED | MEASURED | three narrowings as live expectations | narrowing 1's cost is measured, so it reds when it becomes free | - |
| C-17 | Important | CLOSED | MEASURED | two equalities that retire themselves | plant removed an annotation and the exemption equality red | - |
| C-18 | Moderate | PARTIAL | MEASURED | seven of eight; .4's population floor survives for ten cards | `.7` is CLOSED: `tests/unit/coverage-uninventoried.test.ts:227-232` matches with a stateless clone, the trailing `id.startsWith(prefix)` disjunct that made the case unfailable is gone, and :239 asserts the clone is non-global with the shipped stateful bug kept as the control. `.4` is NOT: `tests/component/ai-and-its-absence-route.test.tsx:164-167` still filters `ALL_THIRTY_STORYBOARDS` by `absentCapability !== null` and floors the result at `toBeGreaterThan(0)`. Twenty of the thirty are now pinned elsewhere by named-list equality - four in `tests/unit/ai-storyboards-01-10-cards.test.ts:223` and six in `tests/component/ai-storyboards-11-20-render.test.tsx:88` - but cards 21-30 are not: `tests/unit/ai-storyboards-21-30-cards.test.ts:380` returns early on `absent === null`, so a dropped declaration on any of the six declaring cards in that decade shrinks the loop and the floor still passes. | unowned - `tests/component/ai-and-its-absence-route.test.tsx` and `tests/unit/ai-storyboards-21-30-cards.test.ts` are outside fix stream S's file list |
| C-19 | Moderate | CLOSED | MEASURED | directory read from disk, basenames compared by equality, three plants | `tests/component/ai-degradation-overlays.test.tsx:407-467`. `fiveSurfaceEntries()` reads `src/ai/five-surface/` and the case at :465 asserts set equality against a six-name literal, so a new file reds in one direction and a deleted one in the other. Plants A, B and C are recorded at :383-406, and B is exactly the finding's twelfth-file case: it went red twice, on the equality and on the prohibition scan. | - |
| C-20 | Critical | CLOSED | MEASURED | the ledger | 17 entries, APP-000…APP-016, and the APP-015 bullet is marked history | - |
| C-21 | Critical | CLOSED | MEASURED | the ledger | `pending_gates[0]` reads SATISFIED with its closure recorded; no gate reads this file and none was claimed | - |
| C-22 | Critical | CLOSED | MEASURED | three paragraphs corrected in place | **a fourth live instance of the same claim was found** at `RESUME.md:878-882` | - |
| C-23 | Important | CLOSED | MEASURED | new release gate | 85→102 rows and PNGs; the old check lived in the writer and ran outside `verify` | - |
| C-24 | Important | CLOSED | MEASURED | removal - the sentences no longer exist | All six subjects were sentences in `RESUME.md`. The file was rewritten (`8a3e5e9`, `faac37f`, `3266325`) and is now 435 lines. Grepped for every one: `eighty-eight`, `DEC-AI 16`, `ninety-one`, `aliases`, `slice 5-8`, `sub-features (0/526)`, `25 entries`, `SA_MATRIX_ATTRIBUTION` - zero hits. The verdict's "two still stand at their point of use" no longer has a point of use. Closed by deletion rather than by correction, which is worth saying: no gate stops the class recurring in RESUME. | - |
| C-25 | Moderate | CLOSED | MEASURED | removal - both lists no longer exist | The five double-listed items were `build-registries`, `PINNED_WORKER_MESSAGES`, `contentOrigin`, `notShippableLock`, `SA_MATRIX_ATTRIBUTION`. Grepped over the rewritten `RESUME.md`: four return zero, and `build-registries` survives only as a path in the agent path-list table and in a controller-defect note - neither is an "open" list. Same closure-by-rewrite caveat as C-24. | - |
| C-26 | Moderate | CLOSED | MEASURED | re-measurement | 612/579/33 today, an exact match; the census pair is a quotation of a past position | - |
| C-27 | Important | CLOSED | MEASURED | derived patterns + a prefix-blind second sweep | 85 identifiers now counted; **residual: `FB-` swallows `FB-AGT-` by `startsWith`** | - |
| C-28 | Important | CLOSED | MEASURED | band assertion at generation time | 0 of 48 rows in the wrong chapter, was 19 | - |
| C-29 | Important | CLOSED | MEASURED | banded first-occurrence | **residual: the published `sourceLineMeaning` now contradicts one of its own rows** | - |
| C-30 | Moderate | CLOSED | MEASURED | the source's own words + a refusal gate | **an unrelated wrong claim ships three lines below it** | - |
| C-31 | Moderate | CLOSED | MEASURED | an emptiness assertion over a real sweep | 42 + 39 = 81; **residual: the sentence claims `tests/`, the sweep does not walk it** | - |
| C-32 | Minor | CLOSED | MEASURED | all three parts, each measured | Part 1: all 18 `SB-AI-*` `not-represented` rows in `registries/generated/ai-storyboards.json` now carry a `statusReason` (counted: 18 of 18). Part 2: `lines: 122242` is gone - `grep -c 122242 registries/blueprint-locators.json` is 0. Part 3, the verdict's residue: `scripts/build-locator-index.mjs:151-153,248` now COMPUTES the figure and states so in the note itself - 166 under a published token shape, with the hand-typed 210 named as the predecessor that no shape reproduced. | - |
| C-33 | Important | CLOSED | MEASURED | nothing | byte-exact against L95067/L95069 — and a plant of the fabricated quotation left the chain green | - |
| C-34 | Important | CLOSED | MEASURED | nothing | byte-exact against L95060, and the second sentence now carries its own locator | - |
| C-35 | Important | CLOSED | MEASURED | nothing | all four cards carry reasoning; **the register said six further bare cards and it is five** | - |
| C-36 | Important | CLOSED | MEASURED | rendered, and held by an equality plus a plant | `SB_21_TO_30_CONTRACT_SEAMS` is imported at `app/workflows/ai-and-its-absence/AiAndItsAbsenceScreen.tsx:14` and rendered at :420. `tests/component/ai-and-its-absence-route.test.tsx:475` asserts the rendered subject list by `toEqual`, and plant P8 at :522 removes a seam record and watches it red. The finding's grep - declaration and nothing else - now returns ten sites. | - |
| C-37 | Important | CLOSED | MEASURED | the collision is rendered, and the intro names its own list | The four-way `FB-AI-01` fact that lived only in `src/ai/fallbacks/registry.ts:13-14` is now a rendered paragraph, `app/workflows/ai-and-its-absence/AiAndItsAbsenceScreen.tsx:275-286`, keyed `fb-ai-01-and-12-one-subject` and asserted at `tests/component/ai-and-its-absence-route.test.tsx:255`. The second half - "the intro says chapter 40 and 41 while the first item names 24 and 30D" - is fixed at :238-248: the intro now names chapter 40's register, chapter 24's family table and section 30D.8, and states that chapter 41 overlaps nothing on the page. | - |
| C-38 | Moderate | CLOSED | MEASURED | five cases reading the frozen source | all four meaning-changers faithful; the gate reds on the planted shortening | - |
| C-39 | Moderate | CLOSED | MEASURED | the tense is restored and the change is recorded | The one restatement that altered a claim was `SB-AI-23`'s past-tense "reached". Both card strings now read "Every class 1 and 2 item reaches the platform intact" (`src/ai/storyboards/sb-21-to-30/storyboards.ts:1307,1364`), and the correction is written down at :53 and at `src/ai/storyboards/sb-01-to-10/index.ts:71`. `grep -c 'reached the platform intact' src/` is 0. | - |
| C-40 | Moderate | CLOSED | MEASURED | three corrected citations, each carrying its reason | The three the disposition table confirmed off are all repointed, each with a `// C-40.` note giving the line that carries the whole clause: `SB-AI-22` (`src/ai/storyboards/sb-21-to-30/storyboards.ts:1181-1186`), `SB-AI-30` (:2502-2506) and `SB-AI-02` (`src/ai/storyboards/sb-01-to-10/index.ts:340-345`). RESIDUAL, unchanged and already recorded: the register's count of thirteen was never reproduced and never disproved. Three is what measurement supports. | - |
| C-41 | Moderate | CLOSED | MEASURED | zero in 570 rendered field cells | Parsed `out/workflows/ai-and-its-absence/index.html` with the RSC flight payload stripped: 570 `[data-storyboard-field]` cells, 0 containing `**`, 0 containing a backtick. The whole page's rendered text carries 0 occurrences of `**`. The 30 backticks left on the page are all inside decision-record prose, a different surface from the card field the finding names, and they render identically across all thirty cards - the "one field type, three renderings" split is gone. | - |

---

## Round 2 — 20 declared, 25 rows, 24 distinct findings

**Numbered twice, and that is why the recovery was needed.** The register numbers the gate stream
`R2-G01`…`G05`; fix brief E, dispatched against the same five findings, renumbers them
`R2-01`…`R2-05`. The register's scheme is primary below and the brief's alias is in the evidence
column. Severities come from the brief headings, which are the only place round 2's per-finding
severity was ever written.

Every row is `REGISTER`: round 3's register opens "Round 1 found 42. Round 2 found 20." and no
artefact re-measures them individually. **None of these was re-measured by this stream.**

| id | severity | verdict | basis | held by | evidence / reason | owner |
|---|---|---|---|---|---|---|
| R2-G01 | Critical | CLOSED | REGISTER | fix stream E | brief E `R2-01` — an aggregate floor guarding a per-page claim | - |
| R2-G02 | Important | CLOSED | REGISTER | fix stream E | brief E `R2-02` — the corroboration ratio is a property of 84% of the evidence | - |
| R2-G03 | Important | CLOSED | REGISTER | fix stream E | brief E `R2-03` — the review-separation gate has no floor and no plant | - |
| R2-G04 | Moderate | CLOSED | REGISTER | fix stream E | brief E `R2-04` — a population of three that cannot tell three from zero | - |
| R2-G05 | Minor | CLOSED | REGISTER | fix stream E | brief E `R2-05` — a bare `return` reported as a pass | - |
| R2-P01 | Critical | CLOSED | REGISTER | fix stream F | eight screens tell a reader a route does not exist, and it does. Dual-numbered `R2-C01` — one finding, two streams, recorded by the register as independent convergence | - |
| R2-P02 | Critical | CLOSED | REGISTER | fix stream F | a published figure the artefact's own rows refute | - |
| R2-P03 | Important | CLOSED | REGISTER | fix stream F | "ninety-nine source files" measures 25 | - |
| R2-P04 | Important | CLOSED | REGISTER | fix stream F | the named enforcement mechanism is not where the gate lives. Widening its gate is what found `R2-P10` | - |
| R2-P05 | Moderate | CLOSED | REGISTER | fix stream F | a stated sweep span 67 lines short at one end and 199 long at the other | - |
| R2-P06 | Moderate | CLOSED | REGISTER | fix stream F | an exclusivity claim the surface's own gate contradicts | - |
| R2-P07 | Moderate | CLOSED | REGISTER | fix stream F | a registered finding that states the opposite of the registry | - |
| R2-P08 | Moderate | CLOSED | REGISTER | fix stream F | a true claim about one register generalised into a false one about the chapter | - |
| R2-P09 | Important | CLOSED | REGISTER | fix stream F | added after dispatch — the warrant for `R2-P01`'s abstention cites a file that refuses | - |
| R2-P10 | Critical | CLOSED | REGISTER | commit `eb75092` | the `MOD-DOH-11` permission error, found by the `R2-P04` fix rather than by an auditor | - |
| R2-C01 | Critical | CLOSED | REGISTER | fix stream F/G | **the same finding as `R2-P01`**, carried here because the register uses both ids | - |
| R2-C03 | Important | CLOSED | REGISTER | fix stream G | a component that asserts the opposite of its reachability | - |
| R2-C05 | Important | CLOSED | REGISTER | fix stream G | a citation twenty-two lines short of its own criterion | - |
| R2-C06 | Important | CLOSED | REGISTER | fix stream G | the identifier and the quote both name a line carrying neither | - |
| R2-C07 | Moderate | CLOSED | REGISTER | fix stream G | a disclosure reachable from nothing, whose precedent points the other way | - |
| R2-C08 | Moderate | CLOSED | REGISTER | fix stream G | a register saying a sibling still owes a fix that landed | - |
| R2-C09 | Moderate | CLOSED | REGISTER | fix stream G | the word "Measured" carrying evidence that has rotted | - |
| R2-C10 | Moderate | CLOSED | REGISTER | fix stream G | the third instance of a paragraph shape already corrected twice | - |
| R2-C11 | Minor | CLOSED | REGISTER | fix stream G | one of two orphaned primitives is declared and the other is not | - |
| R2-C12 | Minor | CLOSED | REGISTER | fix stream G | a paraphrase inside quotation marks | - |

**`R2-C02` and `R2-C04` are named in no register and no brief.** They are not recorded as
unrecoverable findings above, because there is no evidence a finding was ever issued under either
id; the gap in the sequence is the whole of what is known.

---

## Round 3 — 15 declared, 8 enumerated, 7 unrecoverable

The register declares "**15 findings** — 5 matrix, 7 component/e2e, 3 unit" and its arithmetic is
right. The ids exist for the seven component/e2e findings (briefs I and J) and for one of the three
unit findings. **The five matrix findings and two of the three unit findings were never given ids in
any artefact**, so they are recorded as unrecoverable rather than omitted. Brief H, which carried
the matrix work, is written around ten source tensions rather than around numbered findings.

| id | severity | verdict | basis | held by | evidence / reason | owner |
|---|---|---|---|---|---|---|
| R3-01 | Critical | CLOSED | REGISTER | fix stream J | four panels a client sees, asserted by nothing | - |
| R3-02 | Important | CLOSED | REGISTER | fix stream J | defect shape 2, in the build's own list | - |
| R3-03 | Important | CLOSED | REGISTER | fix stream J | a "union" that covers three surfaces of five | - |
| R3-04 | Moderate | CLOSED | REGISTER | fix stream J | four floors three slices behind the export they guard | - |
| R3-05 | Moderate | CLOSED | REGISTER | fix stream J | a hand list under a test named "every" | - |
| R3-06 | Critical | CLOSED | REGISTER | fix stream I | a client could reach 18 of 102 pages, and not one of the five surfaces | - |
| R3-07 | Moderate | CLOSED | REGISTER | fix stream J | the general boundary gate covers one surface of five | - |
| R3-U01 | Critical | CLOSED | REGISTER | commit `e3c20ec` | a correct fix emptied a gate, and the suite kept passing with less to say | - |

**The seven unrecoverable.** Five matrix findings and two unit findings. What is known of them is
the register's prose: the matrix sweep's negative result (both reach maps reproduce byte-identically
and no second `MOD-DOH-11` exists), the sixteen source self-disagreements of which only six were
disclosed, and — for the unit stream — that `R3-U01` was found by instrumenting `Array.prototype`
across all 179 unit files and was one of only two for-of loops whose body never ran. **The second of
those two loops is almost certainly one of the two unrecoverable unit findings, and "almost
certainly" is not a disposition.**

---

## Round 4 — 30 declared, 29 enumerated, 1 unrecoverable

The unrecoverable one is the register's own last item: "**+ 1 defective brief figure**", a finding
about the brief's figure for `R4-C03` that was never given an id. A second un-id'd section,
"`R4-01`'s class was three instances wider than the audit found", is an elaboration of `R4-01` and
became `R5-A01`; it is not counted as a separate finding here, and the register does not count it
as one either.

| id | severity | verdict | basis | held by | evidence / reason | owner |
|---|---|---|---|---|---|---|
| R4-01 | Critical | CLOSED | REGISTER | fix stream K/P | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-02 | Critical | CLOSED | REGISTER | fix stream K/N | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-03 | Important | CLOSED | REGISTER | fix stream K | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-04 | Important | CLOSED | REGISTER | fix stream K | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-05 | Moderate | CLOSED | REGISTER | fix stream K | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-06 | Moderate | CLOSED | REGISTER | fix stream K | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-07 | Minor | CLOSED | REGISTER | fix stream K | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B01 | Critical | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B02 | Critical | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B03 | Critical | CLOSED | REGISTER | fix stream L/Q | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B04 | Important | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B05 | Important | CLOSED | REGISTER | fix stream L/Q | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B06 | Important | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B07 | Important | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B08 | Moderate | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B09 | Moderate | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B10 | Moderate | CLOSED | REGISTER | fix stream L/Q | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B11 | Moderate | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B12 | Minor | CLOSED | REGISTER | fix stream L/Q | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-B13 | Important | CLOSED | REGISTER | fix stream L | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-C01 | Critical | CLOSED | REGISTER | fix stream M | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-C02 | Important | CLOSED | REGISTER | fix stream M | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-C03 | Important | CLOSED | REGISTER | fix stream M | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-C04 | Important | CLOSED | REGISTER | fix stream M/N | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-C05 | Important | CLOSED | REGISTER | fix stream M | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-C06 | Important | CLOSED | REGISTER | fix stream M | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-C07 | Minor | CLOSED | REGISTER | fix stream M | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-K01 | Important | CLOSED | REGISTER | fix stream N | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |
| R4-M01 | Critical | CLOSED | REGISTER | fix stream N | Declared closed by the round-5 register's opening line. Not re-measured by this stream. | - |

---

## Round 5 — 20 declared, 20 enumerated

Every row `REGISTER`, on round 6's opening line "Rounds 1–5 found 127 and all are closed" and the
fix commits `15cab11`, `64f9169`, `5efb133` and `c3bd484`. **That opening line is the claim `R6-B06`
convicted as unreproducible, and this table does not launder it** — it records that the closure is
declared, by whom, and that this stream did not re-measure it.

| id | severity | verdict | basis | held by | evidence / reason | owner |
|---|---|---|---|---|---|---|
| R5-A01 | Critical | CLOSED | REGISTER | fix stream P/T | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-A02 | Critical | CLOSED | REGISTER | fix stream Q/T | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-A03 | Important | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-A04 | Important | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-A05 | Important | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-A06 | Important | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-A07 | Moderate | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-A08 | Minor | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B01 | Critical | CLOSED | REGISTER | fix stream Q/T | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B02 | Important | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B03 | Important | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B04 | Moderate | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B05 | Moderate | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B06 | Moderate | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B07 | Minor | CLOSED | REGISTER | fix stream Q/R | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B08 | Minor | CLOSED | REGISTER | fix stream Q/R | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B09 | Minor | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-B10 | Minor | CLOSED | REGISTER | fix stream Q | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-Q01 | Critical | CLOSED | REGISTER | fix stream R | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |
| R5-Q02 | Important | CLOSED | REGISTER | fix stream R | Declared closed by the round-6 register's opening line. Not re-measured by this stream. | - |

---

## Round 6 — 17 enumerated, 15 open

**Round 6 is the live round.** Two findings are closed by this stream and thirteen are in flight with
fix streams T and U, dispatched in the same wave. Nothing here is claimed closed on a brief's
existence.

**Updated 2026-08-25, after the wave landed — and the wave did not land the way it was dispatched.**
The session running streams S, T and U ended while all three were mid-flight, so no stream wrote a
report and the controller committed nothing. Their work was on disk uncommitted. Every row below now
carries the controller's own measurement of what is on disk rather than a stream's declaration,
which is why all fifteen read `MEASURED` and none reads `REGISTER`: there is no successor register to
close them on. **What the interruption cost is recorded rather than tidied away.** Stream U's
608 → 605 census change landed in the generator and in its own gate and left SEVEN dependent sites
stale — `tests/unit/registry-build.test.ts` (three literals, red), `src/coverage/descriptors.ts`
(`expectedCount`, rendered on `/coverage/` as the expected column), `src/coverage/registry-schema.ts`,
the actionable-controls row of `registries/generated/source-reconciliation.json`, and the
`slice-2c-gates` forbidden-count list where 630 became 627 and took two planted-violation probes with
it. The chain caught six of the seven; the seventh was a comment. All seven are closed here, and the
shape is the one round 3 named: a correct fix that leaves a figure stale somewhere no one is looking.

**And the register grew by two while this table was being written.** `R6-T01` and `R6-T02` were found
by a fix stream during the wave and added to the register under "Found by a fixer during the round-6
wave — carried to round 7". They were in no brief and nobody owned them, which is exactly the state
`R6-B06` describes; the controller then took both and closed them, and the table below records them
`CLOSED | MEASURED | controller` with the measurement in the evidence column.
**Corrected 2026-08-25 by fix stream W (round-7 finding `R7-A2`): this paragraph said they were
"recorded `OPEN` with `unassigned`" two lines above a table that recorded neither.** Counted from the
row grammar the gate parses: 141 rows, 140 CLOSED, 1 PARTIAL, zero OPEN — the state of this table
before round 7 was dispositioned below.
**The register's own totals line still reads "15 findings" and the register now enumerates
seventeen** — corrected there, in the same arithmetic-only way as rounds 5 and 6's Critical counts.

| id | severity | verdict | basis | held by | evidence / reason | owner |
|---|---|---|---|---|---|---|
| R6-A01 | Important | CLOSED | MEASURED | fix stream T | Closed by stream T and measured on the built page with the flight payload stripped: `out/super-admin/platform-audit/` now renders "Six are borne by this screen, one by omission on purpose, and three are backend obligations", and the split is DERIVED from the new `category` field on `MODULE_ACCEPTANCE_CRITERIA` rather than written as a literal. | - |
| R6-A02 | Important | CLOSED | MEASURED | fix stream T | Closed by stream T, same measurement: `out/super-admin/trace-viewer/` now renders "Five are obligations on the backend trace store and carry no screen at V1 … the other three are borne by this screen", matching the array's own five/three. | - |
| R6-A03 | Moderate | CLOSED | MEASURED | fix stream T | Closed by stream T: `tests/component/sa-trace-viewer.test.tsx` and `sa-platform-audit.test.tsx` now assert the classification column by EQUALITY over the whole id-to-category map, so one row's category changing reds. The single "Backend obligation with no screen" regex is kept and labelled presence-only. | - |
| R6-A04 | Minor | CLOSED | MEASURED | fix stream T | Closed by stream T: each backend row now gives its own reason — -01 an atomicity rule, -08 retention, -09 storage tiering — and the built page states that each backend row reasons for itself. | - |
| R6-A05 | Minor | CLOSED | MEASURED | fix stream T | Closed by stream T: the row now states the disagreement is 2:1 with the criterion on the majority side (L46193 and L46178 against L47835) rather than implying a tie, and still omits the figure because the source enumerates the classes nowhere. | - |
| R6-B01 | Moderate | CLOSED | MEASURED | fix stream U | Closed by stream U: three rendered-message labels (L13538, L41894, L42209) are excluded and the fourth the audit wanted removed (L73228, "renders as a locked control") is defended and kept. `scripts/build-registries.mjs` asserts the exclusion BY LINE and by a count of exactly three, so a fourth reds the build. Census denominator 608 → 605; the controller closed the seven dependent sites the interrupted wave left stale (see the note below this table). | - |
| R6-B02 | Important | CLOSED | MEASURED | fix stream U | Closed by stream U: `/coverage/` now renders "2 of the 14 inventories carry a source classification on at least one row — 137 rows in total across modules 81 of 81, notifications 56 of 286", derived rather than asserted, held by `tests/coverage/registry-index-figures.test.ts` (R6-B02). | - |
| R6-B03 | Important | PARTIAL | MEASURED | fix stream U for two of the five families; three families reach nothing | **Downgraded from CLOSED 2026-08-25 by fix stream W, round-7 finding `R7-A3`.** Two families are genuinely held. Invariants: `tests/coverage/reconciliation-table.test.ts` requires each of the 66 to reach a product citation or carry a stated exemption — gated by citation instead of by rendering, which is a legitimate substitute. Residual contradictions: `/coverage/` renders them, 14 of 45 verbatim with 31 more disclosed as decision records, held by equality in both directions. **THE RESIDUE, re-measured by this stream over all 102 `index.html` in `out/` with the flight payload stripped by `tests/coverage/rendered-text.ts`'s rule: closed action sets 0 of 32, state vocabularies 0 of 42, implementation risks 0 of 25 — 99 of the finding's 210 records reach no reader.** A `grep -rn` over `src app tests scripts` for each of the three field names returns the zod declarations at `src/registry/schemas.ts:159,168,169,171` and two prose comments; no reader and no gate. 99 of 210 is the state the finding described, and the row read CLOSED with no residue noted. | unowned — closing it needs a reader for three families under `src/coverage/` and `app/coverage/`, outside fix stream W's file list |
| R6-B04 | Critical | CLOSED | MEASURED | fix stream S | Closed by this stream: both manifests resealed at the current candidate and held by `tests/coverage/process-evidence.test.ts` (B04); the six per-round disposition tables below and the same gate (B06). | - |
| R6-B05 | Important | CLOSED | MEASURED | fix stream U | Closed as a RECORDED LIMITATION rather than a built capability, which is the honest close: `/coverage/` renders `LIM-VISUAL-01` stating what master prompt §26.2 and §27.2 require, what exists today (102 single-state captures, outside `pnpm verify`), and what a reader must not conclude. Held by `tests/coverage/reconciliation-table.test.ts` (R6-B05), which reds if the limitation stops being true. Building the capability is slice-13 scope. | - |
| R6-B06 | Critical | CLOSED | MEASURED | fix stream S | Closed by this stream: both manifests resealed at the current candidate and held by `tests/coverage/process-evidence.test.ts` (B04); the six per-round disposition tables below and the same gate (B06). | - |
| R6-B07 | Moderate | CLOSED | MEASURED | fix stream U | Closed by stream U as a published ratio, not a narrowed definition: 799 cited / 440 with no test-file mention, corrected from the audit's 804/451 by anchoring the token trailing edge. Rendered on `/coverage/` and held by equality in both directions so the figure cannot be shrunk to close it. | - |
| R6-B08 | Moderate | CLOSED | MEASURED | fix stream U | Closed by stream U: `tests/coverage/rendered-disclosure.test.ts` walks the whole export (≥100 pages, `out/404.html` included), asserts the not-real statement in rendered text, and holds the exemption list by EQUALITY with a reason per exempt page. The fourteen registry indexes, the three 404 variants and `/workflows/ai-and-its-absence/` now carry the statement. | - |
| R6-C01 | Important | CLOSED | MEASURED | fix stream T | Closed by stream T without settling what this build has ruled unsettled: the 22 rows keep `not-applicable` on the ground that §45A.3 is a scheduling-policy register whose seven columns hold no control label, the ABSENT-versus-DISABLED reading is explicitly withdrawn and cross-referenced to `tests/coverage/slice-04-gates.test.ts`, and the refuted "No page in `out/` names a `DNC-` identifier" is replaced by a narrower checkable claim (`renderedIdentifierClaim`) that `tests/coverage/census-closure.test.ts` holds against `out/`. | - |
| R6-C02 | Important | CLOSED | MEASURED | fix stream T | Closed by stream T: the ownership-scan comment now records the replayed measurement (demonstrated 69→68, mounted 10→11, not-represented unchanged — the register's own 8→9 was wrong), names the real consequence (`mounted-in-another-screen`, not absent), and records the second obstacle the old paragraph omitted, the unresolved `app/studio/journey` argmax tie the source refuses to award. | - |
| R6-T01 | Important | CLOSED | MEASURED | controller | Closed by the controller at the root rather than per file: the `release` project had no `testTimeout` and inherited Vitest's 5000ms, while its gates read the 18MB frozen source and the 103-page export by design. `vitest.config.ts` now sets `testTimeout: 60_000` for that project with the reasoning recorded. `rendered-absence-claims.test.ts` passes in the sequential chain measured this session. | - |
| R6-T02 | Moderate | CLOSED | MEASURED | controller | Closed as a STATED CONSTRAINT, which is what the finding asked for: `vitest.config.ts` records that these gates read `out/` and are a single writer against it, so `test:release` beside a concurrent `pnpm build` reports correct behaviour as a failure. `pnpm verify` is sequential and safe. | - |

---

---

## Round 7 — 28 enumerated, 28 closed

**All twenty-eight are closed, and the twenty-one that were `OPEN` here were closed by
measurement rather than by a stream's report.** Fix streams V, W and X were interrupted mid-flight
when their session ended: none wrote a report and nothing was committed. Seven rows were already
closed by stream W and the controller. The other twenty-one were dispatched and unlanded when this
table was first written — `OPEN`, with the owning stream named, because a stream's dispatch is not a
stream's landing. **A later session measured the tree rather than trusting the briefs**, which is
the procedure RESUME §6a records after round 6's interruption, and found all three streams' work on
disk. Every row below now carries what the controller measured on the landed bytes and the gate that
holds it; the `held by` column names the stream that wrote the fix and the controller who verified
it. **One row records a defect found during that verification rather than by the audit** — `R7-B13`,
the new figures gate, shipped without a plant.

The twenty-eight were counted from the register's own `###` headings, not from a stream header:
10 stream A, 13 stream B, 5 stream C, two Critical and both in stream B. That is what the register's
totals line says and it is what the headings enumerate.

`basis` on an `OPEN` row reads `REGISTER` for the same reason it does anywhere else in this file:
the finding stands on the round-7 auditor's measurement and this stream did not re-measure it.

| id | severity | verdict | basis | held by | evidence / reason | owner |
|---|---|---|---|---|---|---|
| R7-A1 | Important | CLOSED | MEASURED | fix stream W | Re-measured: the 1,050 certified entries against each candidate tree give `4b5caa35` 1025 match / 21 differ / 4 missing, and `44e05412`, `03453029` and HEAD all 1050 / 0 / 0. `git_tree` `7f8783a8` IS the tree of the recorded commit, so the pair was never inconsistent — the seal ran on a DIRTY worktree at that HEAD and the bytes were committed two commits later. Fixed in the data rather than by resealing: `seal-manifests.mjs` now writes `bytes_measured_against`, one of two sentences chosen by `worktree_clean`, so the clean case claims the commit and the dirty case says plainly that nothing attributes the bytes to any commit. Held by `tests/coverage/process-evidence.test.ts` case 13, which asserts the tree is the tree of the commit, the commit is an ancestor of HEAD, the sentence is the one `worktree_clean` implies, and — when it claims clean — that no certified path differs from that tree. Plants P5 and P6 recorded there. | - |
| R7-A2 | Moderate | CLOSED | MEASURED | fix stream W | The paragraph above the round-6 table said `R6-T01` and `R6-T02` were "recorded `OPEN` with `unassigned`"; both rows read `CLOSED / MEASURED / controller`. The prose is corrected in place and the correction is dated and attributed. **The gate cannot see a claim of this class and this stream did not pretend to make it: cases 6 to 14 parse table rows and manifest fields, and a sentence of prose contradicting a row two lines below it is natural language about the table, not data in it.** What is now true is narrower and worth having: the prose figures it states — 141 rows, 140 CLOSED, 1 PARTIAL, zero OPEN — are the ones the gate re-derives from the rows, so if that paragraph goes stale again the numbers beside it are the ones a reader can check in one command. | - |
| R7-A3 | Moderate | CLOSED | MEASURED | fix stream W | Re-measured independently over all 102 `index.html` in `out/`, payload stripped by the same rule `tests/coverage/rendered-text.ts` uses: closed action sets 0 of 32, state vocabularies 0 of 42, implementation risks 0 of 25, residual contradictions 14 of 45, invariants 0 of 66. 32 + 42 + 25 = 99 of 210. `R6-B03`'s row above is changed to PARTIAL, the residue is named in its evidence column, and it carries an owner. The readers those three families need are outside this stream's file list and are not built here. | - |
| R7-A4 | Moderate | CLOSED | MEASURED | fix stream X, verified by the controller | The clause on `census-status-overrides.json`'s reason field now states seven and enumerates seven — `DNC-`, Functionality, Where it lives, Why a scheduled sweeper is the wrong mechanism, The correct mechanism, What a sweeper may still legitimately do, Source — and says which one the earlier sentence omitted. **Held by a new gate rather than by the correction alone:** `tests/unit/registry-build.test.ts` describe `R7-A4` parses the sentence out of the authored JSON, asserts the population of claiming records is exactly 1 (so deleting the claim reds rather than passing on an empty set), and compares the stated number word, the enumeration and the cells of the cited header row read from the frozen source at the line the sentence itself names. Verified green in the unit project on the landed bytes. | - |
| R7-A5 | Moderate | CLOSED | MEASURED | fix stream X, verified by the controller | Both sites stopped stating the figure. `src/registry/schemas.ts:126` records what it used to say and why it was stale; `tests/coverage/reconciliation-table.test.ts:33` now derives the share from `R4_B02_FIVE_ROWS` / `CENSUS_ROWS`, both computed from the fourteen generated registries the file already opens, and prints them from the assertion that uses them. Re-measured directly off `registries/generated/*.json`: fourteen files carrying rows, 5,015 in total, and the five R4-B02 registries — functions 990, actionable-controls 627, business-use-cases 330, features 534, sub-features 526 — sum to 3,007. **The eighth stale dependent was the last one:** a repo-wide scan of `src app tests scripts registries` and `RESUME.md` returns zero hits for `3,010` and eight for `5,018`, every one inside a past-tense sentence recording the measurement that produced R4-B10, R4-B11 or R4-06 — the boundary `tests/coverage/client-document-figures.test.ts` states in its header for figures about an artefact that no longer exists. | - |
| R7-A6 | Moderate | CLOSED | MEASURED | fix stream W | Measured from git history: `git show 4b5caa3:docs/process/ledgers/product-candidate-manifest.json` gives `candidate_id SLICE04-b82f66e93567c0a5`, the predecessor the second seal overwrote with the manifest's own id. Restored in the manifest, and guarded in the script — `supersedes` now carries the previous chain forward unchanged when the candidate id has not moved. The envelope's hardcoded `'c276164c9eb96503 (slice 2b)'` is derived under the same rule; that value is TRUE for this envelope (the predecessor envelope_id at `4b5caa3` was `c276164c9eb96503`), so the defect there was the literal, not the datum. Held by case 14 and plant P7. | - |
| R7-A7 | Minor | CLOSED | MEASURED | controller | Fixed before this stream started. `2026-08-25-slice-11-audit-round-7-brief.md:5-7` now reads "141 enumerated rows, 140 CLOSED and one PARTIAL, none OPEN" and records that the line said "143 CLOSED" when the brief was dispatched, back-derived from the declared 144 rather than counted. Verified by reading the brief. | - |
| R7-A8 | Minor | CLOSED | MEASURED | fix stream W | Case 12 asserted `measured === 59` and `register === 82` while the section below prescribes converting a `REGISTER` row to `MEASURED`, which would have red the gate. It is now the `reconciliation-table.test.ts:966` shape: `register` is a CEILING and `measured` a FLOOR, so doing the remedy passes and reclassifying to flatter the split cannot. The header-sentence equality is kept and both figures in it are derived from the rows. | - |
| R7-A9 | Minor | CLOSED | MEASURED | fix stream W | `VER-S11-039`'s `status` cited this file for "thirteen of round 6's fifteen open", and this file enumerates seventeen with none open. Corrected as a DATED record: what was measured is left verbatim, and the citation now names the state of the round-6 register as fix stream S saw it mid-wave, with a note that the disposition record did not exist until commit `0345302` and has never held thirteen open rows. The candidate `SLICE11-7839aea4d840fdd1` is likewise annotated rather than deleted — it is the digest stream S computed on the tree it was standing in, and no manifest was ever sealed at it. | - |
| R7-A10 | Minor | CLOSED | MEASURED | fix stream X, verified by the controller | `scripts/build-registries.mjs:2470` and `src/coverage/descriptors.ts:252` now say what §2.10 actually publishes — "608 keyed" — and derive 605 from it as that 608 less `R6-B01`'s three rendered messages, under §2.10's own rule that a raw key count is not a canonical count. Both name the earlier wording. A reader reconciling the two now lands on the same arithmetic the generator runs. | - |
| R7-B01 | Critical | CLOSED | MEASURED | fix stream V, verified by the controller | The instruction is gone: `grep -c "Do not review" docs/client-review-guide.md` returns 0. In its place the guide reads "The Client Command Center is built and it is worth your review", enumerates all twelve rail screens by name, and explains the register's thirteenth — the sign-in, authored on the Hub's identity module — so a rail of 12 over a register of 13 is disclosed as a mapping rather than a gap. **Held by `tests/coverage/client-document-figures.test.ts` case `publishes the Command Center rail against the routes and the register`,** which compares the stated rail size against the Command Center routes in `out/` and the register size against `registries/generated/modules.json`. | - |
| R7-B02 | Critical | CLOSED | MEASURED | fix stream V, verified by the controller | The paragraph now reads 14 inventories / 5,015 rows / 299 demonstrated / 10 mounted / 22 not-applicable / 4,684 not represented. Re-measured by summing the fourteen generated registries: 5,015 rows, `{not-represented: 4684, demonstrated-in-storyboard: 299, not-applicable: 22, mounted-in-another-screen: 10}` — 4,684 + 299 + 22 + 10 = 5,015. **All five figures are now held by equality** against those same fourteen files by `client-document-figures.test.ts` case `publishes the registry totals /coverage/ computes from the same fourteen files`, so the sentence that sells itself as "computed rather than asserted" is the one thing in the document a build can contradict. | - |
| R7-B03 | Important | CLOSED | MEASURED | fix stream V, verified by the controller | The table now reads SA 19/0 of 19, DOH 17/0 of 19, STU 16/2 of 18, FL 6/6 of 12, CC 11/2 of 13, and states that the only two unbuilt modules in the build are `MOD-DOH-17` and `MOD-DOH-18`. **Two gates, not one:** `gives every surface a table row, and every row the registry's own numbers` compares the surface KEY SET against the registry by equality in both directions — so a dropped surface reds instead of shrinking the population — and `names exactly the modules that are unbuilt, by id` holds the two ids against every `not-represented` module row. | - |
| R7-B04 | Important | CLOSED | MEASURED | fix stream V, verified by the controller | The false reason is gone and a sixth walkthrough replaces it: six steps across the Command Center, opening on the rail of 12 and closing on the shift-handoff panel, with the header stating plainly that it did not exist while both documents called the surface a placeholder. The walkthrough count is itself gated — `publishes the walkthrough count the document contains` counts the `## N — ` headings and holds the stated figure in both documents equal to it. | - |
| R7-B05 | Important | CLOSED | MEASURED | fix stream V, verified by the controller | All three documents now publish the export that exists: the guide 102 static pages, `deployment.md` **102 pages, 668 files, roughly 45 MiB**, `screenshots/README.md` roughly 300 MiB across 102 files. Sizes are published and gated to the nearest 5 MiB, stated beside the figure, so a copy edit that moves a page's weight does not red the chain while 24-against-45 and 173-against-300 cannot hide. **Verified permeable rather than assumed:** the controller planted `85` over the `102` in `deployment.md`, ran the gate, and case `publishes the page, file and byte counts the export actually has` went red; the file was restored and compared byte-exact against sha256 `6d5cd409…`. | - |
| R7-B06 | Important | CLOSED | MEASURED | fix stream V, verified by the controller | The README's accounting is derived rather than remembered, and `client-document-figures.test.ts` case `accounts for exactly the pages that name no identifier` holds it against the manifest rows whose `identifiersOnPage` is empty — by equality over the route list, so a page joining or leaving that set reds instead of moving a number nobody re-derives. | - |
| R7-B07 | Important | CLOSED | MEASURED | fix stream V, verified by the controller | Walkthrough 3 step 4 now reads "6 controls that do not exist here — read every one" and the closing paragraph enumerates all six, including the two the earlier count sent a reviewer past: the tenant post-session report and ending a compliance-emergency session from the tenant banner. **Held against the screen's own fixture,** not against prose: case `counts the support-access absences the screen actually renders` compares both the stated count and the enumerated labels against `SUPPORT_ABSENT_CONTROLS` in `app/super-admin/support-access/fixtures.ts`. | - |
| R7-B08 | Moderate | CLOSED | MEASURED | fix stream V, verified by the controller | The guide now quotes the shipped wordings — `pending captures unknown` and `unknown as at the last successful sync`, both on `/command-center/live-shift-board/` — and says in the paragraph that it used to quote the blueprint's own token `Unknown while offline`, which zero of the 102 exported pages render. **Held by case `quotes only UI strings the page it names actually renders`,** which reads the named page out of `out/` with the flight payload stripped, so the guide's worked example of the honesty rule is now checked by the rule. | - |
| R7-B09 | Moderate | CLOSED | MEASURED | fix stream V, verified by the controller | Both documents now derive their surface state from `registries/generated/modules.json` and say so beside the figure. `walkthroughs.md` no longer calls Super Admin "the only surface that is complete"; it reads "All 19 of this surface's modules own a screen — measured from `registries/generated/modules.json`, not asserted", and the Hub's 17 of 19 is stated in both places with the two module ids named. The contradiction cannot recur silently: both documents' figures come from the same file through the same gate. | - |
| R7-B10 | Important | CLOSED | MEASURED | fix stream V, verified by the controller | Closed as a **disclosure with an owner**, not as a built capability — the fields §27.2 names are properties of a capture harness that is slice-13 scope. The manifest carries a `fieldsNotCarried` block naming exactly the seven absent fields, each with the slice that owns it or the reason it will never exist, and the README publishes "It carries 9 of those 16". **Held by equality in both halves:** case `carries the §27.2 fields it claims and discloses exactly the ones it does not` maps all sixteen fields against a real manifest row, asserts the list stays at sixteen, holds the README's 9 and 7 to the mapping, and requires `fieldsNotCarried`'s key set to be exactly those seven with every entry naming an owner — so a field quietly dropped from the rows cannot hide behind a sentence that still says nine. | - |
| R7-B11 | Important | CLOSED | MEASURED | fix stream V, verified by the controller | Split, and both halves recorded. **The half that could be closed was:** every walkthrough step now carries a `capture` cell, and case `links every walkthrough step to the capture the manifest holds for its route` holds each filename equal to that route's row in `docs/screenshots/manifest.json` — over a population asserted greater than 20 step rows, with a step row lacking a capture cell reported by name. `grep -c 'screenshots/' docs/walkthroughs.md` was 0 and the 102 committed captures were reachable from no step. **The half that could not is disclosed rather than dropped:** a new section, "What §27.2 asks for and this is not", states that the tables carry 3 of the 13 per-step fields, names the other 10, names the six absent walkthrough kinds, and states that no `WalkthroughDefinition`, runner or "Prepare client demo" control exists and that building them is slice 13 per RESUME §5. The finding's own last line was that neither client document said so. | - |
| R7-B12 | Moderate | CLOSED | MEASURED | fix stream V, verified by the controller | Disclosed with its owner rather than papered over. `walkthroughs.md` states that no test in this build reloads a page or walks a walkthrough's ordered steps, names the two things that do hold and refuses them as substitutes — `walkthrough-routes.test.ts` proving every named route exists and no built surface is stepless, and `axe.spec.ts` proving the first Tab press reaches the skip link per route and `/review/`'s controls are keyboard-operable — and assigns the cleared-persistence run to slice 13. Walkthrough 5 step 4 now tells the reviewer to open `/review/` in a fresh browser profile and says why: it is the only route in the export that writes to IndexedDB, so a second visit behaving differently is a real defect nothing here would catch. | - |
| R7-B13 | Moderate | CLOSED | MEASURED | fix stream V, plants added by the controller | `tests/coverage/client-document-figures.test.ts` exists: 16 cases over all four documents, each claim EXTRACTED by a pattern required to match exactly once — so a reworded or duplicated sentence reds instead of quietly checking nothing — and compared by EQUALITY against `exportedRoutes()`, the fourteen generated registries, the screenshot manifest or the built page. Never a floor, never a substring. Its past-tense boundary is stated in the header rather than left as a hole. **AND IT SHIPPED WITHOUT A PLANT, WHICH IS THIS BUILD'S DEFECT SHAPE 1 IN THE FILE BUILT TO CATCH SHAPE 5.** The controller found that while verifying this row and fixed it in the same pass: case `P1/P2 — a wrong figure and a deleted sentence both red` plants over the real document bytes in memory — a wrong figure derived as `routes.length + 1` so it can never coincide with the truth on a future export, and the sentence reworded away, which must throw on zero matches. The filesystem half was proved once by hand: `85` planted over `102` in `deployment.md` reds case 2, restored byte-exact against sha256 `6d5cd409…`. | - |
| R7-C01 | Important | CLOSED | MEASURED | fix stream X, verified by the controller | `/coverage/` now says the catalogue is one register of six FAMILIES, §43.2.1 at L90100 to §43.2.6 at L90706, in ONE zero-padding convention, and names the sibling `FB-AI-` row as the family the two facts belong to — 32 two-digit plus 18 three-digit distinct literals, 50 in all, across two registers. Verified on the rendered page with the flight payload stripped: both sentences read as described, and the correction states what the row used to say. The round-6 common brief that seeded the conflation is corrected in the same wave (`R7-C05`). | - |
| R7-C02 | Important | CLOSED | MEASURED | fix stream X, verified by the controller | `/hub/execution-summary-review/` now mounts both panels inside a labelled `Extension decision preview — not V1, and not implemented V1 coverage`, which states the L89727 classification verbatim, names the open channel decision at L92730/L92732, cites master prompt §18.3, and renders `DecisionDisclosure` for `DEC-AIHELP-001` with `DEC-ASK-001` as its alias rather than authoring a second wording of an open decision. **Gated by CONTAINMENT, not by a substring:** `tests/component/ai-requests-state-machine-panel.test.tsx` case `R7-C02` renders the route's own element tree and asserts both panels are inside `[data-extension-decision-preview]`, with three plants recorded — a panel moved out from under the label, the wrapper deleted, and the disclosure deleted. The V1-coverage half needed nothing: the twelve states carry no identifier, so no row of the fourteen inventories counts them. | - |
| R7-C03 | Moderate | CLOSED | MEASURED | fix stream X, verified by the controller | The disclosure now reports the chapter's extent: twelve of the thirty cards quote a verbatim worker-facing string, at L92797, L92880, L92964, L93045, L93133, L93225, L93734, L94572, L94667, L94829, L94911 and L94995, and the frozen source writes no Spanish for any of them — chapter 44A contains no accented character and mentions Spanish three times, none of them a translation. Verified on the rendered page: the storyboard list `1, 2, 3, 4, 5, 6, 12, 22, 23, 25, 26, 27` and the statement that `TEST-44A-004` cannot pass as written for twelve cards. **What is deliberately NOT widened is the pinned set:** the paraphrase prohibition is stated once, at L94829/L94876/`AC-44A-25-2`, about `SCR-FL-LOCK-01` alone, so the gate's Spanish arm still runs over a population of 1 and the page says so rather than policing eleven cards against a prohibition the source does not state about them. | - |
| R7-C04 | Minor | CLOSED | MEASURED | fix stream X, verified by the controller | Measured on the built page with the flight payload stripped: `Deterministic safety is untouched.` renders with no emphasis markers, and the count of `**` anywhere on `/command-center/agent-activity-panel/` is 0. The two-element array no longer disagrees with itself. | - |
| R7-C05 | Minor | CLOSED | MEASURED | fix stream X, verified by the controller | The common brief now states that one pair is byte-identical across all five contract columns, not three, and names the two it wrongly claimed — `AIMODE-03`/`-15`, which differ on Agent invocation, and `-01`/`-16`, which differ on Classification — recording that the build already carried the correction and the brief did not. Its `FAIL-AI-` bullet, which is `R7-C01`'s defect in the artefact that seeded it, is corrected in the same edit. | - |

## What this record does not prove

It proves that every finding a register enumerates has a verdict, that the verdicts use a closed
vocabulary, that every open one names a reason and an owner, and that each round's arithmetic
reconciles or says why it does not. **It does not prove the verdicts are right.** Eighty-two
of the 169 rows are `REGISTER`: closed on a register's own word rather than re-measured here. The remedy
is the same one this build has used everywhere else — re-measure and change the basis to `MEASURED`
— and it is per-row work no gate can do. **Doing it now passes the gate rather than reddening it**,
which was round-7 finding `R7-A8`: the case published the split as two equalities, so the file's own
prescribed remedy would have broken it.

**No row is `OPEN`.** The twenty-one that were are round 7's, and they were closed by the
controller measuring fix streams V and X's landed work rather than by either stream reporting — the
session running them ended first. The two Critical ones, `R7-B01` and `R7-B02`, are closed against
the artefact: `grep -c "Do not review" docs/client-review-guide.md` returns 0, and the guide's
headline figures are now the fourteen registries' own, held by equality. **Master prompt §29.4
condition 5 is satisfiable on these bytes; condition 6 is what the two `PARTIAL` rows below speak
to.**

**Two rows are `PARTIAL`.** `R6-B03` is the second, downgraded from `CLOSED` by round-7 finding
`R7-A3`: 99 of its 210 source-derived records — 32 closed action sets, 42 state vocabularies, 25
implementation risks — reach no reader and no gate, re-measured over the payload-stripped export by
fix stream W. Its residue is named in its row and it carries an owner.

The thirteen round-1 rows were re-measured because they were the ones nothing on disk could settle.
**Twelve are closed. One is not: `C-18` remains `PARTIAL`,** and the residue is narrower than the
verdict recorded — seven of its eight gates are closed, and the eighth's population is now pinned by
equality for twenty of the thirty cards it walks. The ten it is not pinned for are storyboards 21 to
30, and the file that would pin them is outside this stream's ownership.
