# Slice 8 — the common half of every dispatch

**Offline, package, reconnect, command, conflict, convergence.** Every one of the twenty-two
dispatches reads this file first. The per-task half carries only what is specific to that task.

## The three lines every dispatch carries verbatim

1. Of 1,203 identifier-anchored citations in the tree, 1,019 are confirmed at the exact line
   by `registries/blueprint-locators.json`. That is a measured split, not a target.
2. **This brief is a hypothesis. Prove its quotations and its locators against the frozen
   source before you build from them. If a locator is wrong, report it — do not build around
   it.** Slice 7's briefs carried **six** wrong assertions and every one was the controller's
   error; five were found by the agents and one by a gate.
3. This brief contains **no test code, no assertions, no matchers and no expected strings.**
   You write the tests after the code exists, against the frozen source.

## The frozen source

```
/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md
sha256  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
        18,565,031 bytes · 122,241 lines
```

Read-only input, far too large to read whole. Use `sed -n 'A,Bp'` and `grep -n`. It never
becomes an application asset. **Cite the blueprint line, never a graph node**, and open the
line before citing it.

**Never spell a line number in a comment unless that line carries what you say it carries.**
`tests/coverage/locator-fidelity.test.ts` lexes any `L`-number in a comment as a citation, so
naming a blank line — even to describe a planted defect — files a knowingly-false citation.
Three modules did this in slice 7 and the gate caught all three.

## What this slice is, and why its shape differs from slice 7

**Four modules, and the bulk is registers rather than modules.** Chapters 34-38 carry no
module identity cards at all; §19.22 states flatly at L30190 that the operational edge
protocol **"is not a module"**, and chapter 34's own framing at L77987 says it owns a
cross-surface contract. The four cards this slice transcribes live in chapters 21 and 22:
`MOD-FL-A6`, `MOD-FL-A7`, `MOD-CC-02`, `MOD-CC-10`.

**Slice 7 has landed.** All twelve Frontline modules are built, wired into six destinations,
and green. `src/frontline/` holds `access.ts`, `screens.ts`, `matrix.ts`, `capture.ts`,
`commands.ts`, `cross-surface.tsx`, `fallbacks.ts`, `modules.ts` and twelve module
directories. **Read what exists before you build; the most common defect this build records
is a second spelling of a ruling that already exists.**

## The trap that inverts cells silently, and it is first for a reason

**The five matrices this slice transcribes use four different column orders, and one has a
sixth column.**

```
L41092   MOD-FL-A6   Worker | Supervisor | Quality Manager | Tenant Admin | Read-only Auditor
L41295   MOD-FL-A7   Worker | Supervisor | Quality Manager | Tenant Admin | Read-only Auditor | Platform roles
L36450   MOD-CC-02   Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker
L38082   MOD-CC-10   Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker
L80547   MOD-CC-10   Worker | Supervisor | Quality Manager | Tenant Admin | Read-only Auditor
```

**Transcribe header-keyed, never positionally.** A positional transcription swaps Worker and
Tenant Admin between MOD-CC-10's two matrices and inverts every cell on those two roles —
silently, because both readings are internally coherent.

## MOD-CC-10 has two matrices and they disagree. They must not be merged.

The chapter-21 card is L38048-L38246 with an 8-row matrix; §36.6 carries a **second, conflicting
treatment** at L80485-L80602 with a 9-row matrix. Two tasks build them separately and **no
single implementer holds both**, which is deliberate.

- **Can a Supervisor flag an automatic resolution as wrong?** L38089 says `Allowed`; L80554
  says `Explicitly prohibited`. The prose at L80497 says only that "the reviewer" flags it.
- **Can a Tenant Admin see the panel at all?** L38084 says `Explicitly prohibited`; L80549
  says `Allowed with conditions — where the Tenant Admin also holds a Command Center-capable
  role`. It turns on `DEC-PLUS-001`, which **L80559 explicitly refuses to settle**.

## The strongest false claim available in this slice

**Chapter 36 states as `SoW Fact` the very question chapter 38 records as unresolved.**
**L80192** — not L80190, which this brief cited until task 4 opened it and found the
evidence-object row — reads "The hold stands; no device write lifts it | `SoW Fact — §3.3,
§7.9.2`". L82477 records `DEC-FB-008` and explicitly does not choose. A safety claim is at
stake, so **both readings and both locators are recorded and neither is chosen.** A build that
took the wrong line on trust would have cited a photograph-retention rule as its `SoW Fact` on
Severity 1 holds.

## Nine count contradictions, all measured, none to be tidied

| what | claimed | counted | locators |
|---|---|---|---|
| offline artefacts | 22 | **21** | enumeration L78386; "twenty-two" at L78442, L78452, L78458 and **L78951** — this brief cited L78950, which is the twenty-event matrix row, until task 3 opened it |
| fallback template fields | 26 declared, 24 rendered, **27 in the class diagram** | the source reconciles the first two ITSELF at **L82431** — "Every contract below is rendered as a twenty-four-row table covering the twenty-six template fields" — and then lists the 24. The class diagram at L82260-L82288 gives 27, splitting a pair the prose table keeps | template L82313-L82340; closure rule L82242; reconciliation **L82431**; instances L82505-L84837 |
| ladder attributes | 13 | **14 at Level 2** | claim L82067; Level 2 L82107-L82122, the extra being "Honest scope note" at L82122 |
| convergence columns | 9 | **11** (14 rows) | claim L85123; header L85157; data L85159-L85172 |
| 37B open decisions | 8 | **7 open** after DEC-SYNC-001 | table L81730-L81739; exemption L81728; "eight" L81761; "every item" L81763 |
| offline capability classes | 7 | **8 tokens used** | classes L78723-L78729 (header L78721); eighth token L78799; `AC-OFF-701` **L78831** |
| failure taxonomy families | 12 (diagram only) | 63 leaves vs a **74-row** table with no family column | diagram L84907-L84933; table L84934-L85009; `AC-FB-101` L85017 |
| `DEC-FB-002` | one identifier | **two lettered sub-decisions with different questions** | L82852; `DEC-FB-002a` L82673; `DEC-FB-002b` L83372; index L115316 |
| protocol phase 8 | "steps 34 to 36" | **step 37 sits inside it**, and the source separates it in TWO places and folds it in at one | heading L79962; step 37 L79967; L79904 folds it in; and the step-to-obligation table at **L80001-L80012** splits it out again — L80011 is `34 to 36`, L80012 is a row of its own. Ten rows there, eight phase headings |

**Counts that DO reconcile, confirmed, so a gate can rest on them:** 70 fallback contracts
across 16 families; 70 use cases in 7 groups with 12 diagrams; 37 blockers and 37 protocol
steps under 8 phase headings; 13 preserved contradictions.

**A repo-document error to correct, not a source one.**
`docs/superpowers/specs/2026-08-16-aviixa-interactive-storyboard-design.md` gives offline
scenarios as **70** at line 570 and **99** at line 686. The generated registry agrees with 70.
**The 99 is a stale census row and must be corrected before this slice's coverage claims are
computed.**

## Already built — consume, do not extend or re-derive

| what | where | note |
|---|---|---|
| nine permission tokens | `src/policy/decision.ts` | already includes `cachedReadOnlyOffline` and `queuedOffline` — 25 and 13 occurrences in ch34-38 |
| fifteen command states | `src/surfaces/sa/command-state.ts` | already has an exhaustiveness check |
| five `CMD-FL-*` classes, applied ladder, DEC-SYNC-001 order | `src/frontline/commands.ts` | slice 7 settled it; **wave-0 task 5 is joint with it** |
| thirteen-member capture ladder, nine-field envelope | `src/frontline/capture.ts` | |
| capture-**type** contract | `src/studio/vocab/authoring.ts` | `CAPTURE_TYPES`, built from `AC-STU-065` (L32421) — **not** in `capture.ts` |
| package manifest as built | `src/studio/modules/stu-14/package.ts` | `ManifestLine`, from `SB-STU-17`'s contents list L33905 |
| six-member `ConnectivityMode` | `src/scenario/controls.ts` | online, slow, flapping, offline, dependency-down, recovering |
| the cross-surface guard | `src/frontline/matrix.ts` | `controlsOnActsHeldElsewhere` — **read its comment; it had an unreachable loop** |

## What does not exist and must be created once, centrally

`OFF-MODE-01`…`28` as a closed set (L78641-L78670, 28 rows) **and the mapping from the six
existing `ConnectivityMode` members onto it** — settle centrally or twenty-one tasks each
invent one. · The seven capability classes plus the **52-row** classification register keyed on
module id (L78766-L78819). · A `FallbackContract` record — 26-field template, 8-rung ladder,
16 families, 70 contracts; **no `FB-*` registry exists** and `registries/generated/` holds
fourteen families of which fallbacks is not one. · The prohibited-phrasing lexicon and its
build gate (L78398-L78407, `TEST-OFF-401` L78451) — `tests/coverage/prohibited-patterns.test.ts`
bans only backend and network patterns, and **the `synced`/`sent`/`done` rule survives as prose
comments in `src/ui/ScreenStateBoundary.tsx` and `src/ui/sa/CommandStateBadge.tsx` and is
enforced nowhere.** · The three-clause element test — origin, age, effect (L78392-L78394);
`src/ui/primitives/FreshnessLabel.tsx` carries origin and age, and **nothing binds a rendered
element to a `CommandState` for the effect clause**, which is the clause the artefact rule turns
on. · The 37-step protocol as an ordered machine with per-step outcome codes and its
`AC-36-101` invariant that steps 1-14 complete before any manifest exchange (L80042). · A
conflict record holding **both** versions with both timestamps and both workers, the 12-family
authority resolver (L80187-L80198), and a `skewFlagged` marker that **persists on historical
writes after the device clock is corrected** (`AC-36-408`, L80363). · A quarantine record with
reason, detecting step and named owner (L80387-L80398), **distinct from a failed write**. · A
convergence comparator producing converged / honest divergence / unexplained divergence, **where
an expected difference that is not actually displayed counts as unexplained** (L80658).

## The `SURF-CC` spine is created here and filled by slice 9

`src/surfaces/` holds only `doh/` and `sa/`; `app/command-center/page.tsx` is a placeholder.
Wave-0 task 1 creates the Command Center spine — 13 modules (inventory L34834), 13 screens
(catalogue L48386-L48398), shell, seam registry, access evaluator — and **settles the module-id
and screen-id keys before any Command Center task starts.** Follow `src/frontline/modules.ts`
as the shape: it declares which module claims which route, and a module that owns no route
declares `null` with a stated reason.

**`MOD-CC-13` appears in no row of the screen register**, the same gap shape as `MOD-FL-A6`'s.
It is slice 9's problem, but `SCR-CC-10` exercises action 5 of that closed set, **so the seam is
declared here rather than discovered there.**

**`MOD-CC-02` owns no screen and must ship as surface chrome, never a route** — the register
puts it on `SCR-CC-02` beside `MOD-CC-01` (L48387), and routing it invents a fourteenth Command
Center screen.

**`MOD-FL-A6` appears in no row of the six-destination register** either (L48529-L48534;
`AC-SCR-FL-001` fixes six at L48689). Slice 7 already recorded it in `src/frontline/modules.ts`
with a stated no-route reason. **Do not mint a seventh destination.**

## What every task owes

- Your transcription is **header-keyed**, row by row and cell by cell, with the row and column
  counts matching the per-task brief. `cells` is a total `Record`, so a blank cell is untypeable.
- Where the source disagrees with itself, **both readings and both locators are recorded and
  neither is chosen.** An unresolved source decision is disclosed on screen with its
  alternatives and this build's pick labelled a client-delegated choice.
- **`src/disclosure/decisions.ts` holds 29 records and none of the Frontline ones.** Fourteen
  `DEC-FB-*` cards plus `DEC-PKGMAN-001`, `DEC-FB-008` and the rest are almost certainly absent
  too. **Do not edit that file** — one later task lifts them all at once. Follow the shipped
  `Stu14LocalDisclosure` idiom: the canon's own record shape, `DecisionReading` **imported**
  rather than redeclared, the gap declared on screen, and **a gate asserting your identifier is
  ABSENT from the canon**, so the moment it is lifted your suite goes red and forces the switch.
- Your tests are written **after** the code, against the frozen source, and **every gate plants
  its own defect into a real shipping file, watches it go red, and restores the file
  byte-identically.**
- `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, `pnpm test:component` green **for the whole
  tree**, not only your files.
- **You never run git.** The controller commits.

## Fifteen gates in slice 7 could not fail when first written. Assume yours cannot.

Every one was found by planting, and none by review:

- a `textContent` sweep beaten by **element concatenation** — `a timer` + `STATE-X` reads back
  as `a timerSTATE-X`, so `\btimer\b` never matches;
- the same sweep beaten again by a **`hidden` attribute**, because `getByTestId` finds hidden
  elements and `textContent` reads them;
- an arity check beaten by a **defaulted parameter** — `online = true` does not count toward
  `Function.length`;
- an outcome check where **`Allowed` is a prefix of `Allowed with conditions`**;
- a `toEqual([...MY_CONSTANT])` **tautology**;
- a shared helper used as its own test whose **only firing branch could not fire**;
- a table-shape check **satisfied by the separator row**, because `|---|---|` splits into
  non-empty cells;
- a position check **true of both the defect and its fix**;
- a word-presence check beaten by **fold-text overlap**, because the verdict string contains
  the cell's own note;
- a `\btimer\b` pattern beaten by the **plural**;
- a forbidden-word allowance that **took its allowed string from the value under test**, so
  shortening the value subtracted itself and stayed green.

**A gate that cannot fail is worse than no gate.**

## And one defect class the whole of slice 7's testing could not see

Four Run Player panels shipped with `data-testid="fl-panel-undefined"` in the built HTML while
every component test passed. They declared their panel as a **module-scope const in a
`'use client'` file**, and a plain object exported from a client module and imported by a server
component does not cross the boundary as data — Next.js replaces client-module exports with
client references, so the string fields are gone when the page prerenders.

**A component suite mounts the component; the client boundary only exists in a build.** If your
task exports data from a `'use client'` file for a server component to read, build that data in
a server module and send only the component across.

## Two brief corrections already proved, and one finding they produced

**`AC-OFF-701` is at L78831.** L78827 is the `**Acceptance criteria and tests.**` heading four
lines above it. Task 2 found this and pinned both lines.

**The 52-row register is keyed on `Function`, not on module id.** Its header (L78766) reads
`Function | Module | Class | Reason | Data required locally | Expiry | Role and qualification
restrictions | Artificial-intelligence availability | Fallback | Reconnect behaviour`. `Module`
is an ordinary column and **four rows do not hold a single module id** — L78782 holds two
(`MOD-FL-A3` and `MOD-FL-B9`) and L78817-L78819 each hold `Cross-module`. **A module-keyed
lookup silently drops four rows.**

**And the finding that follows from both:** `AC-OFF-701` reads "Every Frontline function
carries exactly one of the seven classes, and no function is unclassified." **51 of the 52 rows
do. One does not** — L78799's Conflict-resolution row carries the eighth token. The criterion
is unsatisfiable against the source's own register, by exactly one row, and that is a number
rather than a prose complaint.

## The scratchpad is shared, so name your files after your task

Concurrent agents write to one session scratchpad. In slice 8's first wave a generic
`plant.py` was overwritten by a sibling between one agent's patch and its run, and that agent
got the sibling's campaign output back — its `before.sha` check reported OK because the
sibling's script had never touched its files. It was caught only because the output format was
unfamiliar.

**Prefix every scratchpad file with your task id** — `slice08-t04-plant.py`, not `plant.py` —
and check the output you get back is about the files you patched.

## Two more brief corrections, both proved by task 6

**`AC-36-101` is at L80048 and occurs exactly ONCE in 122,241 lines.** This brief and task 6's
attributed it to **L80042**, which is the `Source status` bullet of fallback contract
`FB-SYNC-01`, six lines above, carrying no identifier at all. Both claims are real and they are
different claims — L80042 gives three source classifications, L80048 gives the ordering
invariant. Same shape as the `AC-OFF-701` error recorded above: an identifier cited to a
heading or bullet near it rather than to its own row.

**The three classifications on L80042, each with what it governs:** the reconnection
*obligations* are `SoW Fact`; the *thirty-seven-step enumeration* is a
`User-Mandated Product Extension`; and the *ordering of the three transfer passes inside steps
21 and 22* is a `Derived Clarification — adopted working position` under `DEC-SYNC-001`. Three
classifications in one line is not a formatting accident — it is the source being precise about
which part of the machine it is willing to call a fact.

**And a paraphrase that would have shipped false.** Task 6's brief rendered step 1 as
"a device-side observation, **not a server-side one**". L79908 reads "**not a server
assertion**". Quoting the brief rather than the line would have failed the locator-fidelity
strong check — or, worse, passed it as a weak one. **Every brief in this slice is a hypothesis
including its quotations, not only its line numbers.**

## A third pair of brief corrections, from task 5

**`L80078` and `L82464` were transposed.** L80078 is a bare ` ```mermaid ` fence opening the
`DEC-SYNC-001` Option C flowchart. **L82464 is the prose sentence** — "The command channel
carries exactly five classes: lot release, reassignment or substitution, qualification
clearance, suspension, and version change." The brief said each was the other. Cite L39658 and
L39662-L39666 for the closure at five and L39672 for the order; slice 7 proved those.

## `worker-finished` and `submitted` are ONE transition, not two states apart

The slice-7 brief said, and this one repeated, that `worker-finished`, `submitted`, `complete`
and `finished` are four different states. **They are four different names, and the first two are
one instant when the device is connected.** L39045 reads "The worker declares their part
finished (worker-finished), **which stands the Run as `submitted`** on the platform run
lifecycle" `[SoW Fact — §7.7.5]`, and L40559 says the same.

The real distinction, which `MOD-FL-A3` got right by opening the lines rather than trusting the
brief, is **player state against run-record state**: `STATE-A3-WORKERFINISHED` is what the
player holds, and `submitted` / `complete` / `finished` are run-record states "named here only
to map onto them". The gap the brief was reaching for opens **offline** — where the declaration
is made and the record is owed — and it closes on sync.

**A screen must not say the platform holds no record when the device is connected.** That is
the inverse of the error the original warning was written against, and it is available to any
module that took the four-states framing literally.

## The hold-state claim is classified THREE different ways, at three levels

Task 7 found the third level and the controller verified all three by opening the lines. This
is the sharpest thing in the slice and it belongs in every later brief that touches conflict
authority or Severity 1 holds:

| level | line | what it says |
|---|---|---|
| the row itself | **L80192** | "The hold stands; no device write lifts it \| `SoW Fact — §3.3, §7.9.2`" |
| the section's own Source status | **L80233** | "`Derived Clarification` **for the per-object authority table**" — the whole table, including that row |
| chapter 38 | **L82477** | `DEC-FB-008`, and it **explicitly does not choose** |

So the source states the claim as a fact, classifies the table carrying it as derived, and
records the question as open — three readings of one sentence, none of which is a
misprint. **Eight of the twelve rows open `SoW Fact`** (rows 1, 2, 4, 5, 6, 10, 11, 12) and four
open `Derived Clarification`, so the section-level classification is wrong about two thirds of
its own table.

**Carry all three. Choose none.** A build that resolves this in either direction has decided
whether a device write can lift a Severity 1 hold, which is not a decision this build is
permitted to make.

## Three more counted gaps in §36.4, all task 7's

**The prose family list names eleven of twelve.** L80147 enumerates the families a record is
identified as and stops at configuration and version state. The twelfth — server-side correction
under the append-only path, L80198 — is absent, and it is the case §6.11.1 names in the source
itself. A classifier written from the prose has no family for it.

**Twelve per-family tests are promised and six exist.** L80231 says `TEST-36-401` through
`TEST-36-412`, "one per object family row". The acceptance table names 401 to 406 and stops.
**Measured over all 122,241 lines: 407 through 411 occur zero times, and 412 occurs once —
inside the promise itself.**

**Five diagram branches against twelve rows.** L80164-L80168. Containment checklist item, unit
or lot binding, and qualification and clearance appear in no branch by name.

## The declaration idiom, stated because leaving it unstated has now cost fifteen edits

**A closed vocabulary or a transcribed table is `as const satisfies readonly T[]`, never
`export const X: readonly T[] = [...]`.**

A leading annotation wins over `as const` and throws the literal members away, which is what
lets a gate assert *which* rows a table holds rather than merely how many.
`tests/coverage/slice-2c-gates.test.ts` gate 2 rejects the annotation form, and it has now
caught it **fifteen times across two slices** — nine in slice 7's twelve modules, six in slice
8's first two waves — every one found by the release gate rather than by the task that wrote it.

**This paragraph is late.** The controller recorded after slice 7 that slice 8's brief must state
the idiom, and then did not add it, so six more landed. It is stated here now.

Two consequences worth knowing before you hit them:

- **`.includes()` stops type-checking** on the narrowed result, because the array's element type
  becomes its own members. Put a typed predicate beside the constant — `MOD-FL-B11` did — rather
  than widening the constant back, which restores exactly what the gate rejects.
- **A tuple of heterogeneous literal objects does not assign to a `readonly (A | B | …)[]`
  parameter.** Spread at the call site.

## `DEC-STORE-001` has TWO option sets, in two chapters, and they disagree

Task 10 found this and the controller verified it. It is the second decision in this slice
whose own source states it more than one way, after the hold-state claim's three
classifications — and it is a different failure: not three classifications of one reading, but
**two different readings of what the options even are.**

| where | how many | what |
|---|---|---|
| **L79469**, §35.5 | **four** — (a) hard stop at a reserved-capacity threshold, (b) degrade capture fidelity, (c) refuse only optional content, (d) block new run entry | recommended order layers (c) → (d) → (a) at L79470 |
| **L40116**, `FB-FL-STORE-01` | **three** | recommends (b) + (c) with (a) terminal |
| decision owner | **and they name different owners** | L40116 says the client through the Frontline Functional Specification; L79472 says the client's product owner with the Quality Manager function |

**This brief said three and cited the wrong chapter for them.** Carry both sets with both
locators, record that the option sets themselves diverge, and choose neither. A build that
picks one has answered a question the source asks twice and never settles.

**And `DEC-STORE-001` appears SIX times inside §35.5**, not three: L79439, L79466, L79488,
L79490 (terminal safe state), L79500 (`AC-PKG-505`) and L79510 (source classification).
**Four modules already hold a record for it** — `MOD-FL-A2`, `MOD-FL-A4`, `MOD-FL-A6` and
`stu-14/rendering.ts` — so a fifth spelling is what a later task must not write.

## The unresolved-marker rule is `AC-FL-011-5`, not `AC-FL-006-1`

**L40155:** "`DEC-STORE-001` and `DEC-WIPE-001` remain visibly open; no implementation may close
them silently." That is the rule this slice keeps invoking. **`AC-FL-006-1` (L39634) is a
different rule** — it governs the nine-field capture envelope recording unresolved *provenance*
as an explicit marker. Both are real; only one says an open decision stays open.

## §35.4 pairs five acceptance criteria with four tests

`TEST-PKG-405` occurs **zero times in all 122,241 lines**, measured. §35.3 and §35.5 both pair
five with five, so the asymmetry is this section's and not a truncated transcription. Carry it
as a source gap.

## The source proposes the package manifest TWICE, and the second drops two enforcement fields

Task 9 found this; neither brief carried it and the controller verified it by opening the lines.

**§33.4, "The Complete Package Manifest", opens at L77510** and enumerates its fields as bolded
headings across L77526-L77582. Its own at-a-glance table (L77611-L77631) holds **21 rows**,
folding site/area/location into one and job/run into another.

**§35.3's table holds 22 fields** — and **two of §33.4's are simply absent from it**, verified by
searching all 22 rows for each:

- **L77532** — "Location identifier where the tenant's hierarchy includes it. Justification: the
  Location (Cell) is the workstation level and part of na…"
- **L77544** — "Qualification gate posture and clearance duration. Justification: the posture is
  strict blocking or notify-only and is a tenant setting…"

**Neither is hygiene.** The first is a scope field — the same class the integrity table's
"Manifest scope fields do not match the device assignment" row rejects a package on. The second
is a **gate**: a manifest without the qualification posture and clearance duration cannot
enforce the qualification gate on a device that is offline, which is the whole reason the gate
is on the device.

So the slice carries **three counts for one object** — 24 enumerated, 21 summarised, 22
proposed — and the difference between the first and third is not a rounding of presentation but
two fields that do work. **Record all three, name the two dropped fields at the lines §33.4
states them, and choose none.**

## §35.1 describes one machine four times

**21 stages (L79049) · 18 diagram states (L79073-L79090) · 16 workflow steps (L79053-L79068) ·
13 authority rows (L79126-L79138).**

The 21-to-18 gap **reconciles exactly, in the source's own words**: signing folds into
`Manifested` because L79078's label reads "manifest created and signed", and rollback and
reconciliation are drawn nowhere. 21 − 1 fold − 2 unstated = 18.

**The other two do not reconcile and must not be made to.** The workflow and the authority
matrix join the stages on different seams — "Manifest creation and signing", "Activation and
pinning" — so a count that agrees with them would be a count of something else.

## The integrity failure table has ELEVEN rows, and the controller's fifteen was invented

Task 11 counted it: header L79579, separator L79580, **data L79581-L79591 — eleven rows**, six
columns, and the line after the body is blank. **§35.6 contains the words "fifteen" and
"eleven" zero times**, so the fifteen was not a source contradiction to preserve. It was the
controller's arithmetic, and it had no basis anywhere.

**Revocation is three rows with three device responses and TWO terminal safe states** — the two
pre-flight rows both read "Run not enterable" and only the mid-run row reads "Run stopped, work
preserved". The brief said three of each.

**And two of the brief's cells were paraphrases rather than the source**: the scope row reads
"Manifest scope fields **do not match the device assignment**", and the version row reads
"Installed build below the **manifest** minimum".

### The controller's counts have been wrong six times in this slice, and the cause is one thing

`AC-OFF-701`'s line · the register's key column · the twenty-two-artefact line · `AC-36-101`'s
line · the convergence table's row count · `DEC-STORE-001`'s option count and mention count ·
this table's row count. **Every one came from reading the re-plan's span notation rather than
counting the rows.** A span like `L79579-L79591` says where a table is, not how many rows it
has, and the difference is the header, the separator, and wherever the body actually stops.

**Count the rows. Do not infer them from a span.** Every per-task brief in this slice states its
counts as hypotheses for that reason, and every one so far has been checked by the agent rather
than by the controller who wrote it.

## The quarantine register cannot express the mid-run revocation case

L79588 quarantines captured work when a revocation arrives with the run in flight. **None of the
ten quarantine reasons at L80389-L80398 names a revoked or withdrawn package** — the nearest is
a *missing* workflow version. The ten are a closed set in `src/offline/quarantine.ts`, so this
is recorded as a gap rather than patched by widening someone else's vocabulary.

**Also: `DEC-WIDIFF-001` is in the shared canon**, not only `DEC-LIB-001` as the brief said.

## The brief told task 12 to read a span the same brief forbade it to read

Task 12's own half gave its storyboard as `SCR-CC-CONF-01`, **L80541** — and L80541 sits inside
**L80485-L80602**, the §36.6 span the same brief forbids that task to open, because task 13
builds it and the two treatments must not be reconciled by one implementer. The identifier
occurs nine times and **every occurrence is in chapter 36 or later**; none is in chapter 21.

**Chapter 21's storyboard is `SB-CC-21` at L38144**, which occurs **exactly once in 122,241
lines**. The agent found the contradiction, refused the locator, and transcribed the right one.

A brief that quarantines a span and then cites into it is worse than one that simply cites
wrongly: it puts the agent in the position of having to disobey one instruction or the other.

## And the route slug is the spine's, not the brief's

The brief wrote `/command-center/sync-conflict-review`. `src/surfaces/cc/modules.ts` declares
**`sync-conflict-review-panel`**, and so do the screen register and the module inventory, both
of which name the module "Sync-conflict review panel". The task derived its slug from the spine
and made the directory name the only literal — so had it followed the brief, `CC_NAV` would have
published a path for a directory that does not exist, and the failure would have shown up in a
browser rather than a test.

## A wave-0 gate that held only while nothing was built

`tests/unit/cc-spine.test.ts`'s slug-collision check read `byName.has(slug)`, which is true the
moment **any** directory of that name exists — including the module's own built route. It
therefore passed only while the Command Center had no routes at all, and went red on the first
one.

`scripts/build-registries.mjs` has the rule right and says so in the error it throws: it refuses
on `dirs.length > 1` — "Which one demonstrates the module is a guess; refusing to make it" — and
treats exactly one directory of the claimed name as what *demonstrated* means. **A gate that
disagrees with the generator about the same question is wrong wherever they differ.**

Narrowed to match, with both directions asserted: a planted `slug: 'sign-in'` still collides
two-to-one against `app/frontline/sign-in` and `app/studio/sign-in` and is still caught —
watched red, restored.

## Splitting `MOD-CC-10` between two implementers found more than it protected

The two treatments were given to different tasks so neither would reconcile disagreements the
source does not settle. That worked — and it also found **two divergences neither brief named**,
because two people transcribed the same module independently and header-keyed.

**The Tenant Admin divergence is TWO rows wide, not one.** The brief named the panel-visibility
row. The row below it diverges too: §36.6's L80550 gives the Tenant Admin
`Allowed with conditions — as above` on reading a conflict entry, where chapter 21's L38085
reads `Explicitly prohibited`. Swept independently on each side: §36.6 gives that role a
non-refusal in exactly two rows; chapter 21 refuses it in all eight.

**A fourth possible divergence, left open on purpose.** §36.6 splits "see the panel exists" from
"read an entry" and gives the Supervisor `Allowed` then `Read-only`; chapter 21 gives
`Read-only` twice. That may be a decomposition rather than a contradiction — **and saying which
would be the choice**, so neither task took it.

**And one that looks like a divergence and is not**, filed as checked so the next reader does
not file it as a fifth: the skew rows. L38088 and L80553 contradict each other *positionally*
and agree exactly on their own capability wordings — one asks about resolving a skew-flagged
conflict individually, the other about including one in Resolve All.

## Brief error: "the reviewer" is at L80496

Both this brief and task 13's put the sentence at **L80497**. L80497 is the next bullet and a
different rule — "Supervisors view the panel; resolution, including Resolve All, is Quality
Manager and above" — and contains neither "reviewer" nor "flag". **L80496** is the sentence:
"A reviewer who judges an automatic resolution wrong flags it…". Third time this slice an
identifier or quotation was cited to a neighbouring line.

## `DEC-SYNC-006` is raised and disclosed by nobody

§36.6 raises it for the conflict-list cap and classifies it, and **no file in this tree carries
a record for it.** It belongs to whoever builds the panel body, which is slice 9's. Recorded
here so it is not discovered there.

**And §36.6 calls the screen `SCR-CC-CONF-01` where the register calls it `SCR-CC-10`.** Two
identifiers for one screen — not a fourteenth screen, and the controller wiring two treatments
onto one route needs to know that before it looks like one.

---

## Wave 3, verified — four more controller brief errors, and a defect in the registry generator

**Every one of the four was found by an agent opening the line the brief cited.** The running
total for this slice is **fifteen**, of which **seven are counts**.

### The brief errors

1. **A quotation that would have shipped false.** Task 15's brief paraphrased L78804's Reason as
   "cached suspension state is trusted **on the device**". The source reads "Cached suspension
   state is trusted **only within the cache-validity rule**." Those are different rules — one is
   about where the state lives, the other about when it stops being good. A verbatim block in a
   brief is still a hypothesis.
2. **A four-row sample of a five-row set.** The same block showed four `MOD-FL-A7` register rows.
   The register carries five; `Encrypted on-device store` (L78800) was absent from the brief and
   is the row `AC-OFF-702` governs.
3. **`L78766-L78819` is where the table is, not how many rows it has.** Header L78766, separator
   L78767, data L78768-L78819 — fifty-two. The count was right and the notation was loose, which
   is the shape that produced six of this slice's errors.
4. **"Seven states carry `drivenHere: false`" — the file has five.** Slice 7 had already driven
   `STATE-A6-CONNECTED` and `STATE-A6-SYNCING`, its own comment says "five of the seven", and its
   panel printed "5 of the 7". The brief listed all seven anyway. The companion figure in the
   same sentence — 25 of 28 functionalities — was correct and measured.

### `AC-OFF-701` fails a second way, and the two halves are independent

Wave 0 found that L78799's Conflict-resolution row carries an **eighth** class token, so one of
fifty-two rows falls outside the seven the criterion fixes. Task 15 found the other half from the
opposite side: **`FUNC-A7-04-1-1` is classified by no row at all.** Measured over all fifty-two
Function cells — none names minimal scope, data scope or blast radius.

So the criterion is unsatisfiable in both directions: a row outside the vocabulary, and a
function outside the register. **Carry both readings; adopt neither.** L41376 states its own
offline position ("Online and offline: identical"), which is why assigning it a class would make
the criterion pass against a fact this build wrote down.

**`AC-OFF-702` (L78832) is in no brief and governs the two `Fully available offline` rows** — it
forbids a network call on their execution path. A storyboard has no execution path to inspect,
so it is **recorded and not enforced**, and saying so is the deliverable.

### THE REGISTRY GENERATOR AWARDED ONE ROUTE TO TWO MODULES

Found while clearing wave 3's release failures, and it had been true for a whole slice.

`scripts/build-registries.mjs` ran argmax over every route directory and awarded the winner
**unconditionally**; the slug rule then awarded the claimant on top. A route claimed by a slug
therefore demonstrated **both** its owner and whichever module its files happened to name most.

`MOD-CC-02` is Command Center chrome. It declares `slug: null` on purpose — the source gives it
no screen and `AC-CC-040` (L35261) forbids a fourteenth module route. It is named **once** inside
`app/command-center/sync-conflict-review-panel/`, the route `MOD-CC-10` claims by slug, as the
chrome mounted into that screen. Being the only id that file mentioned, it won the argmax and
read `demonstrated-in-storyboard` off a route it does not have. **The inventory reported 58
demonstrated modules where 57 are.**

**The generator's own header said this could not happen** — "ownership, not mention, so a screen
cross-referencing a neighbour does not demonstrate it". The sentence was false of the code
beneath it, and nothing tested the award rule at all: the freshness gate compares the committed
file to a fresh generation, so **a generator that is consistently wrong is consistently green.**

Fixed by recording argmax winners during the walk and awarding them afterwards, filtered by the
slug claims — exactly the treatment ties already got, and for the same stated reason. Gated in
`tests/unit/registry-build.test.ts`.

**Two things this cost, both worth carrying:**

- A module that owns a route by slug claim could ship **without its own file ever naming it**.
  `SCR-CC-10`'s page did. An older gate — "every demonstrated row is named by a file under app/"
  — went red and was right to: a screen that never names the module it serves is thin, whatever
  the slug rule infers. Name your module in your route file.
- **The first two plants of the new gate stayed green**, because the fix for the point above
  raised `MOD-CC-10`'s mention count above `MOD-CC-02`'s — so removing the guard changed nothing
  and the plant proved a rule that was no longer reachable in this tree. The defect had to be
  planted in its real shape: **a slug-claimed route mentioning a slugless neighbour more often
  than its own owner.** Then it went red, and stayed green with the guard restored.
- The gate's first form also **convicted `MOD-FL-A1` wrongly**. It declares no slug because
  `sign-in` exists on two surfaces, and it is demonstrated by `app/frontline/sign-in/`, which
  nothing claims — a legitimate argmax award. The failure message read "only mentioned inside",
  a claim the check never established. **A gate whose message asserts more than its predicate
  tests will convict something innocent.**

### Two more shapes for the running vacuity catalogue

- **A count check true of both the defect and the fix.** Task 15 planted a wrong class filter
  three times; a name check passed it, then a **count** check passed it, because that module has
  two rows of each class. It only went red once the check read the **lines**. If two categories
  have the same size, the number is never the claim.
- **A locator check satisfied by a token 36 of 45 cells carry.** Task 13's divergence check
  verified the cited line's *token* appeared. Moving the locator one row left it green. Pin the
  cell verbatim, not its status word.

### Two items handed to slice 9

- **`DEC-SYNC-006` is raised for the conflict-list cap and no file in this tree discloses it.**
- **§36.6 calls `SCR-CC-10` by a different identifier than the register does** — two names for
  one screen, which needs settling before it reads as a fourteenth.

### Wave 3, continued — three more brief errors and one absolute the source miscounts

**Eighteen controller brief errors this slice.** The three from task 16:

5. **`DEC-STUCK-001` is not on L36459, and not anywhere in §21.5.** It occurs sixteen times in
   the frozen source and **none of them falls between L36427 and L36616**. Both places `MOD-CC-02`
   names a decision for the manual close — `FUNC-CC-0204-2-1` (L36551) and its Source status
   (L36614) — name **`DEC-CCWRITE-001`**. The module reaches `DEC-STUCK-001` only through the
   coverage map: `AC-COV-093` (L4371) puts it on the §6.2 row, and §6.2 is that card's Source
   section (L36433). **A decision a module reaches through a coverage map is not a decision its
   own section states**, and the brief presented the second as the first.
6. **A state-inventory span short by one row.** `SCR-CC-02`'s inventory was given as L48462-L48475
   and stops at `STATE-12`. `STATE-13` Recovery is at L48476 — the row carrying the audited
   recompute that module's own recovery paragraph describes. Thirteen rows, not twelve.
7. **A card span running past its content.** The card was given as ending three lines below its
   last content line, which is L36614 — the Source status paragraph. What follows is blank and
   then the section rule. The end line is not quoted here because it carries nothing, and
   `locator-fidelity` is right to refuse a citation of it even inside a sentence saying so.

**`AC-CC-407`'s absolutes are miscounted by the source itself.** L48368 reads *"Three
prohibitions bind every screen absolutely: no gate override, no run pause or stop, no record or
configuration edit, and no Job or run creation."* **It says three and lists four.** Every other
statement of the same set says four — L13498, L38700 ("Four exclusions are absolute, for every
role"), and the coverage rows. Carry the enumeration, record the miscount, adopt neither number
as the source's intent.

**And a reading discipline this cost an hour to relearn.** The controller checked that claim by
printing `sed -n '48368p' | cut -c1-200` and read back a sentence about responsive web — then
told the agent its finding was unsupported. **The agent was right.** L48368 carries eight
sentences and the one in question is the eighth. **A truncated line is a fragment, not the line.**
This source has lines over a thousand characters; `cut` is how a verification reports absence
that is really truncation.

### `MOD-CC-02`'s own divergences, all carried

- **Row 4 grants the Tenant Admin what the functionality refuses him.** The matrix cell (L36455)
  reads `Allowed` over as-of stamps **and** late-arrival flags; `FUNC-CC-0203-1-1` (L36542) allows
  "all viewers" and `FUNC-CC-0203-1-2` (L36543) prohibits "Read-only Auditor, Worker, **Tenant
  Admin**". Neither chosen.
- **The card and its storyboard name four marker states each, and they are different fours.**
  L36469 gives live-all-synced, partially-synced, unknown-pending, inventory-unavailable;
  `SB-CC-13` (L36575) gives healthy, partial, site-wide, inventory-unavailable. `unknown-pending`
  has no storyboard slot, and the storyboard's third slot is the banner (L36581), which is not a
  state a marker takes. **Two fours, carried separately** — merging them loses the state
  `FUNC-CC-0201-1-3` exists for.
- **§21.5 pairs nine acceptance criteria with ten tests** — the same asymmetry as §35.4's five
  with four, in the other direction.

### Three more vacuity shapes, all found by planting

- **A count gate proved by a defect that changes no count.** The row-count plant *renamed* a row
  instead of deleting one, so the length stayed at 8 and the gate passed. Redone as a deletion.
- **A classifier plant that was accidentally correct.** Swapping a `startsWith` classifier's keys
  stayed green because `Object.keys` preserves insertion order and the literal happened to list
  the longer key first. The plant had to invert the order to appear.
- **A pointer that can point at itself is not a pointer.** A `heldBy` field naming the decision's
  holder passed while pointing at the planting file, because that file names all three
  identifiers. The gate now requires the holder to be outside the module directory and to carry
  the decision's own locator.
- **A gate red on the shipped tree for the wrong reason.** A text sweep for a forbidden field name
  was red because the module's own comment *names the field it refuses to have*. Replaced with an
  export-shape check.
- **A route gate written against a literal listing.** It compared `app/command-center/`'s
  directory listing with a hard-coded array, which would have gone red the day slice 9 builds the
  other eleven. Now asserted against `CC_CLAIMED_SLUGS`.

### Wave 4, task 17 — the nineteenth brief error, and the register that writes its own exception

**19. "The six authorisation limits" conflates two enumerations, and six is not the source's
word.** §37.1's own text states **three** rules — L80781, "Three rules, each quoted from the
source and each load-bearing for the whole register" — and **the word "six" occurs zero times
anywhere in §37.1**, measured over the whole section rather than sampled. Six is the row count of a supporting table the source
titles *"the offline authorization **values**"* (L80831), while the section heading says
*Limits*. **The two lists are not the same list:** four of the six rows have no rule, and one of
the three rules has no row. Carried as two constants with their own locators, neither chosen.

That is the eighth count-shaped brief error of the slice, and the shape is now specific enough to
name: **a section heading and a supporting table are not the same enumeration**, and taking the
table's row count as the section's number is how the controller has been wrong eight times.

### `OFF-BLK-20` contradicts `AC-37-002`, and the source names the exception itself

**L81078**'s message text reads *"Any work not yet sent cannot be recovered from this tablet."*
The same line calls it **"the register's one genuinely unrecoverable entry"**, and the index row
(L81181) names the outcome *"Unrecoverable unsynced data, named explicitly"*.

Against it: `AC-37-002` (**L80767**) — "No blocker deletes, truncates or renders unrecoverable any
locally committed capture" — and governing rule 1 (**L80729**) — "A blocker never destroys local
data."

**The source writes the exception into the table beneath the absolute it states above it, and
says so in words.** This is not a transcription ambiguity to reconcile: a build that resolved it
would be deciding what a worker is told when their evidence is gone. Both readings, both
locators, `adopted: null`.

### Three more measured findings on the same register

- **42 message texts, not 37.** L80725 requires every entry to define its message text "without
  exception and without blanks" and `TEST-37-004` (L80769) calls itself "a string audit of all
  thirty-seven messages". Thirty-three entries carry one; `OFF-BLK-12` carries **three** (soft,
  hard and compliance suspension) and three others carry two — a worker-facing message plus an
  operator or Tenant Admin one.
- **The register names its own exception to its every-entry rule.** L81112: "This is the one
  blocker in the register with no worker-facing message." `OFF-BLK-24` states none of its own
  either, deferring to `OFF-BLK-08`'s.
- **The family counts have three independent readings and all three agree** — the index's Family
  column, which section carries each detail entry, and **the acceptance-criterion family each
  section numbers itself in** (`AC-37-2xx` 12, `3xx` 10, `4xx` 8, `5xx` 3, `6xx` 4). The third is
  the strong one: **nothing forces it**, so a dropped or duplicated row disagrees with a numbering
  scheme the transcription never touched. A gate can rest on 12/10/8/4/3.

### One brief claim reported UNCONFIRMED rather than accepted or dismissed

The brief passed on task 8's finding that "the register's step numbers are not all consistent with
the protocol". Task 17 checked **every** step reference in §37.2-§37.6 — steps 3, 4, 6, 7, 8, 11,
12, 13, 14, 17, 18, 22, 23, 27, 30 — against `PROTOCOL_STEPS` and found no inconsistency. **If
task 8's finding is real it is not in the blocker register's step citations.** Reporting a claim
as unverified, rather than quietly dropping or repeating it, is the right handling of a
second-hand finding and is recorded here as the pattern.

### Wave 4, tasks 19 and 20 — the twentieth brief error, and a token that means its opposite

**20. "The fourteen `DEC-FB-*` cards" attaches a chapter-38 set to a §37B task.** Measured:
**`DEC-FB-` occurs zero times in §37B.** The section raises no `DEC-FB` item at all. Filing one
there would be the `DEC-STUCK-001` error in the other direction — that one cited a decision to a
section that never names it; this one would have *created* records in a section that raises none.

**Task 20's brief was otherwise correct in every particular** — header, span, eight rows, the
exemption line, both count lines, and which two rows open the table. **The first brief this slice
whose counts held.**

### `Allowed` IS USED AS A PROHIBITION, NINETEEN TIMES OUT OF FIFTY-THREE

L81683: *"Worker `Allowed` to continue non-media capture; **nobody `Allowed` to evict unsynced
evidence to make room**."*

Nineteen of the fifty-three `Allowed` tokens in the offline use-case catalogue sit inside a
negated clause like that one. **A renderer keyed on the token publishes nineteen grants the source
refuses.** This is a sharper version of the prefix trap already in the catalogue — `Allowed` being
a prefix of `Allowed with conditions` — and it defeats an anchored comparison too, because the
token itself is exactly right and the sentence around it inverts it.

**Read the clause, never the token alone.** Any permission transcription in this build that
matches on a status token without reading what precedes it is suspect, and the count to check
against is nineteen.

### The source miscounts its own range, again

**L81763** reads *"the **four** sync items `DEC-SYNC-002` through `DEC-SYNC-006`"*. That range is
**five**, and §37B's own table carries all five as separate rows (L81733-L81737). The same line
also describes the contradiction list as drawn from the canon's register *plus* `DEC-OFF-001`,
`DEC-OFF-002` and the sync items — and **L81759's list holds thirteen identifiers, none of which
is any of those seven.**

That is the third instance of this exact shape in one slice: L48368 says three and lists four,
L38700 says four and its own matrix carries none, and now L81763 says four of a range of five.
**When the source states a count next to an enumeration, count the enumeration.**

### More findings worth their tasks

- **`DEC-SYNC-002` was disclosed by nobody**, the same gap as `DEC-SYNC-006`. Raised at L81588,
  tabled at L81733, and named by no hand-written file until this wave. **Two tasks now name it
  independently** — confirm the pairing is intended rather than a double-assignment, the same
  check `DEC-OFF-001`/`DEC-OFF-002` needs.
- **`DEC-OFF-002` is the only one of the eight with no card anywhere**, and **the §37B row asks a
  wider question than the note that raised it**: L81460 raises the attempt count; L81739 asks the
  count *and* the lockout duration. Both readings carried.
- **The §37B diagram has nine source nodes for an eight-row table.** The extra is `DEC-STORE-001`
  (L81754), which has no row.
- **`AC-37A-005` holds for 29 of 30 entries and is vacuous on the thirtieth.** `UC-OFF-053`'s
  entire permission line is `as \`UC-OFF-051\`.` — zero status tokens, so "all tokens are in the
  closed set" passes on an empty set. **A criterion that quantifies over a set is satisfied by an
  empty one**, which is the vacuity shape at source level rather than test level.
- **Three storyboard screens sit outside the catalogue's own shared set of eleven** (L81266), and
  **`SCR-SA-LIFECYCLE-01` occurs exactly once in all 122,241 lines** — at the entry that invokes
  it.
- **The E-group finding is confirmed and is exactly one row.** The eleventh identifier in E's span
  is `UC-OFF-036` at **L81532**, group D's, reached by `UC-OFF-042`'s "as `UC-OFF-036` steps 7
  through 9". The deferral idiom recurs five times across E, F and G and **only that one crosses a
  group boundary.**

### A registry weakness this wave surfaced, and it is systemic

**`sourceLine` in the generated registries is `firstLine(...)` — the first mention of an
identifier anywhere in the source, not the line that defines it.** Measured on one task's thirty
rows: **eighteen point at a group table, a diagram-reuse paragraph, or a neighbouring entry.**
`UC-OFF-070`'s reads L81212, which is the reuse rule; `UC-OFF-059`'s reads L81651, which is
`UC-OFF-058`'s entry.

It is not a wrong citation in the sense the fidelity gate catches — the line exists and mentions
the identifier — but **it is not the definition**, and a reader following it lands somewhere that
does not define what they looked up. Every module in this build opens its own locators instead,
which is why it has not bitten; it is recorded here as a known weakness of the generated
inventories rather than of the modules.

### Wave 4, task 18 — the twenty-first brief error, and two guards that hid each other

**21. "Sum of ranges = 71" was right about the mechanism and wrong about the outcome.** Counted by
**entry heading** rather than by span, **every one of the seven groups holds exactly ten and the
catalogue holds seventy.** Group E's *span* mentions eleven identifiers; only ten have headings
there, and the eleventh — `UC-OFF-036` at **L81532** — is named inside `UC-OFF-042`'s body and not
even in its metadata clause. **There is no group that is not ten.**

Both wave-4 tasks reached the same fact from opposite ends and neither had to be told. The lesson
is the one the brief already carried and got wrong itself: **a span scan and a heading scan answer
different questions, and only one of them is about ownership.**

### TWO GUARDS THAT EACH HID THE OTHER — the sharpest vacuity finding of the slice

`permissionStatusesIn` carried two protections: a **longest-first vocabulary** so `Allowed with
conditions` is matched before `Allowed`, and an **exact comparison** rather than a prefix test.

- Reordering the vocabulary to put `Allowed` first, **alone** — green. Exactness caught it.
- Relaxing `===` to `startsWith`, **alone** — green. Ordering caught it.
- Removing **both** — red, on the one entry that grants the conditional and the plain form on the
  same line.

**Each guard made the other's plant pass, so a single-defect plant proved neither.** The module's
comment first named ordering as the guard and then named exactness; both were half right, and only
the third plant told them apart.

**This is a new shape for the catalogue and it generalises:** redundant protections against the
same defect cannot be verified one at a time. If you write two, plant the removal of each **and**
of both. And a comment naming one of two guards as "the" guard is a claim the code does not make.

The same task caught its own overclaim the same way: a note said "no file under `src/` is read by
the registry generator", and the generator **does** read `src/**/modules.ts` for slug claims. The
gate found it; the note was narrowed to the claim that survives.

### The source's own reuse paragraph under-counts itself

**L81454** enumerates five reusers of the `UC-OFF-032` diagram — `UC-OFF-031`, `UC-OFF-033`
through `UC-OFF-035`, and `UC-OFF-037`. **Six entries declare that reuse:** `UC-OFF-040`
(**L81494**) declares it and is absent from the sentence. Groups A, B and C's equivalent
paragraphs (**L81306**, **L81354**, **L81404**) each enumerate all nine of their reusers exactly.
**Only D's is short**, which is what makes it a defect rather than a convention.

### Three more, all carried and none resolved

- **`UC-OFF-001` never declares its own representative status.** Its metadata clause (**L81308**)
  carries neither a reuse nor a representative marker; the other four representatives all do.
  Its status is stated only in the group paragraph and the group table. Kept as
  `declaredInOwnMetadata: false` rather than smoothed.
- **Three permission lines carry no status token at all** — L81408, L81410, L81422 read only
  `as \`UC-OFF-021\`.` and similar. Two readings of `AC-37A-005`, neither chosen: a
  cross-reference inherits the referenced statuses, or a line with no status **is** the blank cell
  the criterion forbids. Two further lines defer *and* add a status of their own, which is what
  makes the first reading arguable at all.
- **Six artificial-intelligence lines carry a bare "not applicable" with no reason**, where six
  others on the same field carry one. `AC-37A-005` governs only the *permission* line — **widening
  a criterion to a line it never names would be this build choosing its own scope**, so it is
  recorded and not repaired.

### A census that read 90 where 95 are, and why

`UC-OFF-036` is the one entry whose fields **do not sit on its heading line** — its own diagram
interrupts it and the rest resumes at **L81486**. The first extractor never opened that line and
dropped five permission cells silently. **A per-entry scan that assumes one entry is one line is
wrong exactly once in seventy**, and silently.

### Union of the storyboard screens outside the "same small set"

L81266 names eleven screens and says "Every entry draws on the same small set". The two catalogue
tasks each found three outside it, and **they are different threes**: `SCR-FL-LOGIN-01`,
`SCR-CC-CLEAR-01`, `SCR-CC-ALERT-01` from groups A-D; `SCR-CC-CLEAR-01`, `SCR-DOH-BANNER-01`,
`SCR-SA-LIFECYCLE-01` from E-G. **The union is five**, and `SCR-SA-LIFECYCLE-01` occurs exactly
once in all 122,241 lines.

### Task 21 — the twenty-second brief error, and the fourth self-miscount

**22. The nine-column claim is at L85155, not L85123 — and BOTH briefs carried the wrong line.**
L85123 reads, whole: `1. The failure is detected at its own detection point.` A narrative step
carrying no count at all. The claim is **L85155** — *"**The nine-column coordination table.** Every
cell carries an explicit status."* — restated at L85119 and as `AC-FB-125` at L85198.

That is the sixth neighbouring-line error of the slice and the shape is now unmistakable: **the
controller reads a section, finds the claim, and writes down a line from the wrong end of the
paragraph it sits in.**

**And the table is not nine columns.** Header **L85157** carries **eleven**; data
**L85159-L85172** is **fourteen rows**. So the source names a count in the same sentence that
introduces a table contradicting it — **the fourth instance of that exact shape in one slice**,
after L48368 (says three, lists four), `MOD-CC-13`'s matrix (states four absolutes, carries none)
and L81763 (says four of a range of five).

### Two more count corrections, both the span-versus-count shape in miniature

- **"27 in the class diagram" is right only after a stated subtraction.** L82261-L82288 carries
  **28** `+member` lines; `+identifier` is the class key, not a template field. A gate that counts
  the span and asserts 27 is wrong; one that counts members and subtracts explicitly is right.
- **§33.4's bolded headings return 30, not 24.** The span L77526-L77582 contains **six group
  headings** alongside the twenty-four fields. A heading scan that does not subtract them
  over-reports by exactly the number of groups.

### The convergence table the tree actually transcribes is §36.7's, not §38's

The brief's "9 columns over 5 surface rows" **conflates two tables**. §38's coordination table has
no surface rows — the five surfaces are its **columns**. The four-column, five-surface-row table is
**§36.7's** convergence obligation table, header **L80668**, data **L80670-L80674**, and that is
the one `src/offline/convergence.ts` transcribes.

**Nothing in this tree transcribes §38's table**, so the 9-versus-11 contradiction can only be
asserted against the frozen source directly. It is named as a freeze assertion in the gate and in
the ordering audit rather than dressed as a transcription check.

### Three gates that could not fail, and one that was right about a file it convicted

- **`length >= 3` could not catch a merge.** Deleting one of four divergences still left three.
  Replaced with a count derived from the frozen source at both ends — §36.6 gives the Tenant Admin
  a non-refusal in exactly two rows and chapter 21 in none — so the number is measured rather than
  chosen. **A floor is not a count.**
- **A plant that replaced one of two occurrences** stayed green. Re-planted replacing both.
- **A disclaimer plant removed one sentence from a file carrying four.** The per-file claim was
  correct and the plant was under-powered — which is its own lesson: **a plant weaker than the
  claim proves nothing about the claim.**

And **`tests/coverage/prohibited-patterns.test.ts` went red on the new absence sweep, correctly**:
the sweep had written a literal probe-directory name, which re-declares the probe convention
instead of deriving it. Fixed on the sweep's side by deriving the name from `ownProbeDir()`.

### The slice's gate position

Release grew **583 → 676** — 74 gate cases and 19 absence sweeps. **Unit and component are
unchanged at 4146 and 2238, which is itself evidence that no shipping file drifted**, and 20
shipping files were re-hashed after the 47-plant campaign with zero drift.
