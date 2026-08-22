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
