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

**Chapter 36 states as `SoW Fact` the very question chapter 38 records as unresolved.** L80190
reads "The hold stands; no device write lifts it | SoW Fact — §3.3, §7.9.2". L82477 records
`DEC-FB-008` and explicitly does not choose. A safety claim is at stake, so **both readings
and both locators are recorded and neither is chosen.**

## Nine count contradictions, all measured, none to be tidied

| what | claimed | counted | locators |
|---|---|---|---|
| offline artefacts | 22 | **21** | enumeration L78386; "twenty-two" at L78442, L78452, L78458, L78950 |
| fallback template fields | 26 | **24 rendered** | template L82313-L82340; closure rule L82242; 70 instances L82505-L84837 |
| ladder attributes | 13 | **14 at Level 2** | claim L82067; Level 2 L82107-L82122, the extra being "Honest scope note" at L82122 |
| convergence columns | 9 | **11** (14 rows) | claim L85123; header L85157; data L85159-L85172 |
| 37B open decisions | 8 | **7 open** after DEC-SYNC-001 | table L81730-L81739; exemption L81728; "eight" L81761; "every item" L81763 |
| offline capability classes | 7 | **8 tokens used** | classes L78721-L78729; eighth token L78799; `AC-OFF-701` L78827 |
| failure taxonomy families | 12 (diagram only) | 63 leaves vs a **74-row** table with no family column | diagram L84907-L84933; table L84934-L85009; `AC-FB-101` L85017 |
| `DEC-FB-002` | one identifier | **two lettered sub-decisions with different questions** | L82852; `DEC-FB-002a` L82673; `DEC-FB-002b` L83372; index L115316 |
| protocol phase 8 | "steps 34 to 36" | **step 37 sits inside it** | heading L79962; step 37 L79967; L79904 |

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
