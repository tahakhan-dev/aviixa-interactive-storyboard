# Slice 9 — the common half of every dispatch

**The Client Command Center, `SURF-CC`: thirteen modules, thirteen screens, and a closed action
set of ten.** Every one of the twenty-one dispatches reads this file first.

## The three lines every dispatch carries verbatim

1. Of 1,203 identifier-anchored citations in the tree, 1,019 are confirmed at the exact line by
   `registries/blueprint-locators.json`. That is a measured split, not a target.
2. **This brief is a hypothesis. Prove its quotations AND its locators against the frozen source
   before you build from them.** Slice 8's briefs carried **eleven** wrong assertions and every
   one was the controller's; agents found all eleven by opening the line. One was a quotation
   that would have shipped false, one was a `SoW Fact` attributed to a photograph-retention row,
   and **six were counts**.
3. This brief contains **no test code, no assertions, no matchers and no expected strings.** You
   write the tests after the code exists, against the frozen source.

## Count the rows. Never infer them from a span.

Six of slice 8's eleven brief errors were counts, and every one came from reading a span like
`L79579-L79591` as though it stated a row count. **It states where a table is.** The difference
is the header, the separator, and wherever the body actually stops — and in one case the
controller's "fifteen rows" had **no basis in the source at all**: the section contained neither
the word "fifteen" nor "eleven", and the table had eleven rows.

Every count in this brief is therefore a hypothesis. Count it yourself, and report what you find.

## The frozen source

```
/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md
sha256  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
        18,565,031 bytes · 122,241 lines
```

Read-only. `sed -n 'A,Bp'` and `grep -n`. **Cite the blueprint line, never a graph node.**

**Never spell a line number in a comment unless that line carries what you say it carries.**
`tests/coverage/locator-fidelity.test.ts` lexes any `L`-number in a comment as a citation and
has caught six agents across two slices — including one describing a *planted* defect, which is
still a knowingly-false citation.

## What already exists, and it is more than the re-plan says

**The re-plan states "there is no `src/cc/` and no `src/surfaces/cc/`". That is now false** —
slice 8's first task built the spine precisely so this slice would not have thirteen tasks each
minting a route key.

| what | where | note |
|---|---|---|
| module registry, 13 rows | `src/surfaces/cc/modules.ts` | **eleven slugs declared, two abstentions** with stated reasons |
| screen catalogue, 13 rows | `src/surfaces/cc/screens.ts` | plus `CC_NAV` and `CC_CHROME_MODULES` as **server data**, deliberately |
| `evaluateCCAccess` | `src/surfaces/cc/access.ts` | the surface exclusion is checked **before** the request, not as a matrix cell |
| seam registry | `src/surfaces/cc/seams.ts` | |
| `MOD-CC-10`, both treatments | `src/surfaces/cc/modules/cc-10/`, `cc-10-s366/` | slice 8 built them **separately and on purpose** |
| `MOD-CC-02` as chrome | `src/surfaces/cc/modules/cc-02/` | slice 8; **no route, and it must not gain one** |
| `SCR-CC-10` route | `app/command-center/sync-conflict-review/` | slice 8 |

**Read the spine before you write a line.** Two slice-8 tasks found their brief's work already
done and correctly changed nothing; that is the outcome to aim for, not a failure.

**Also already in the repo — do not rebuild:** the nine-token `PermissionOutcome` vocabulary
covers every status these matrices use · the thirteen `ScreenStateId` states map onto §25.4's
inventory exactly · `SUPERVISOR_AND_ABOVE` and `QUALITY_MANAGER_AND_ABOVE` already encode
`DEC-PLUS-001`'s enumeration reading · `ScenarioCommandGateway` is already the sole mutation
entry point and gives the one-transaction audit guarantee · `routeBySurface('SURF-CC')` already
grants only Tenant Admin, Supervisor and Quality Manager, **which is the Auditor and Worker
exclusion already satisfied at the route layer** · the fifteen command states in
`src/surfaces/sa/command-state.ts`, bound to `src/frontline/commands.ts`'s by `SA_SPELLING`.

## FOUR TABLES ANSWER THE SAME PERMISSION QUESTION DIFFERENTLY, AND NO DECISION IDENTIFIER EXISTS

This is the slice's defining problem.

| table | where | rows |
|---|---|---|
| the surface matrix | §21.1.2, L35002-L35023 | 20 |
| `MOD-CC-13`'s action matrix | §21.16, L38680-L38691 | 10 |
| §25.4's action matrix | L48442-L48456 | 13 |
| §26.7's cross-surface matrix | L49574-L49601 | 26 |

**§25.4's and §21.16's disagree on six cells and use four different status tokens for the same
cell.** The whole Tenant Admin column reads `Explicitly prohibited` in one and `Unavailable` in
the other — **and those two render oppositely**: `src/ui/WriteControl.tsx` draws
`explicitlyProhibited` as **nothing at all** and `unavailable` as **a disabled control carrying
its reason**. That is the ABSENT-versus-DISABLED conflict this build has carried since slice 4.

**`AC-CC-502` requires every cell to carry an explicit status, and every cell does.** The defect
is that four tables answer the same question differently, **which no acceptance criterion
tests**. Carry every reading with its own locator; choose none.

## The closed action set of ten, and the writes outside it

`DEC-CCWRITE-001` names **four** outside-writes. **Six are granted.** The two the source does not
count: "Resolve an escalation" (granted to Supervisor and QM; acknowledgement and resolution are
held distinct elsewhere) and "Flag an automatic resolution as wrong" (opens the Hub's append-only
correction path).

**`MOD-CC-13`'s own matrix contains none of the four absolute exclusions** its own section
states in prose; the surface matrix carries all four and §25.4 carries two. `AC-CC-407` is then
asserted against nothing.

**§25.4's table is headed "across the ten operational actions" and has thirteen data rows** —
the last three are not actions.

## The Command Center owns no operational record

Every act it appears to perform is routed through an owning service, and **at least six cells
need a link-out rather than a control**. One shared cross-surface link-out component makes four
of this slice's traps unbuildable. `src/frontline/cross-surface.tsx` is the Frontline
equivalent — read it, and note the guard `controlsOnActsHeldElsewhere` in
`src/frontline/matrix.ts`, whose second loop was **unreachable by construction** until a slice-7
module planted a misclassified row and watched it stay green.

Specific traps of this shape: manual close of a stuck run · reclassifying severity, which
`AC-CC-221` forbids outright — "Severity displayed always equals the on-device classification;
no server-side or agent value overrides it" · two agent-panel cells whose required affordance is
a link, not an absence.

## Thirteen module routes and thirteen screens are two different sets

`AC-CC-040` forbids a fourteenth module route. But `SCR-CC-01` is `MOD-DOH-09`'s, `SCR-CC-03` and
`SCR-CC-04` both serve `MOD-CC-03`, `SCR-CC-02` serves two modules, `SCR-CC-13` serves two, and
**`MOD-CC-13` has no row in the register at all.** Its action rail must mount **inside** the
twelve module screens. `MOD-CC-07` likewise has no screen of its own.

**96 distinct `SCR-CC-*` tokens exist; 13 are routes.**

## Two decisions that are absent from the chapter's own register

**`DEC-CONTLAUNCH-001`** — one occurrence in chapter 21, card in §51.11A, **not in the chapter's
register**. Adopted **Option A, the device**, "because it is the safer reading — it is the only
one under which an offline worker receives containment guidance at the moment of a Severity 1
breach". Consequence: no gate item accompanies a Severity 1 event merely because containment
fired, and the containment panel renders a **server-side mirror, never a launch**.

**`DEC-CLEAR-001`** — raised in chapter 26 against action 10, **absent from chapter 21 entirely**.
Grant and expiry are defined; **revocation is not**.

Chapter 21's register has sixteen rows and its own coverage statement agrees — but **seventeen
distinct identifiers are referenced inside the chapter**, and with `DEC-CLEAR-001` the slice must
disclose **eighteen**.

## Mechanisms that must land before any module task

**Session-freeze (`FB-CC-SESS`)** — a surface-wide frozen state labelling every element with its
age, disabling every decision control with its reason, and **queueing nothing**.
`src/scenario/controls.ts` has six connectivity modes and **none is a frozen viewer session**.
Settle it first: every one of the thirteen modules states its own session-offline behaviour
against it.

**The freshness-class model** — three classes with per-element marker obligations.
`src/surfaces/sa/freshness.ts` is a *different* seven-token vocabulary scoped to Super Admin
aggregates, and `src/ui/primitives/FreshnessLabel.tsx` takes two free-text strings and **cannot
express a class assignment**.

**The freshness marker's device-list expansion**, and the rule that **forbids rendering zero for
an unknown pending-capture count.**

**Per-device command roll-up** — `issued` → `propagating` → `in force` over a device set, where
**`in force` never renders until every relevant device confirms.** The fifteen states exist; the
roll-up does not, and the roll-up is what the honesty rule binds. `DEC-WIPE-001` bears here: a
device that never returns leaves a hold at `propagating` indefinitely and **the surface must not
promote it.**

**Not-decidable rendering (`FB-CC-QUEUE`)** — decision controls disabled, **the missing element
named**, waiting clock still running. `src/ui/WriteControl.tsx` has four branches and none is
"context incomplete" — **extend it, do not fork it.**

**Exception-first aggregation** — rendering cost must track the **exception** count, not the cell
count, verified at 8, 47 and 120 cells. The source is explicit that rendering 120 tiles and
de-emphasising 113 "has met the design intent and failed the scale requirement".

**The nine `FB-CC-*` patterns** as a registry, with every functionality referencing at least one.

## What every task owes

- Transcribe **header-keyed**, never positionally. Slice 8's two `MOD-CC-10` matrices run their
  columns in opposite order and a positional read inverts every Worker and Tenant Admin cell,
  silently, because both readings are internally coherent. **Chapter 21's tokens are not
  backticked; §36.6's are.**
- Where the source disagrees with itself, **both readings, both locators, neither chosen** — and
  make it structural where you can. Slice 8's strongest disclosure used a reading type with
  exactly two fields, so there is nowhere to mark a winner even by accident.
- **`src/disclosure/decisions.ts` holds 29 records and almost none of this surface's.** Do not
  edit it. Follow the `Stu14LocalDisclosure` idiom with a gate asserting your identifier is
  **absent** from the canon, so a later lift turns your suite red and forces the switch.
- A closed vocabulary or transcribed table is **`as const satisfies readonly T[]`**, never a
  leading `readonly T[]` annotation. The release gate has caught that **eighteen times across two
  slices**, every one found by the gate rather than the task.
- Any recursive directory walk in a test routes through **`isForeignProbe`** from
  `tests/probe-paths`.
- **A `'use client'` file must not export a plain data object a server component reads.** Four
  panels shipped with an undefined module id in slice 7 that way — invisible to every component
  test, because a component suite mounts the component and the client boundary only exists in a
  build.
- **Prefix every scratchpad file with your task id.** The scratchpad is shared; a generic
  `plant.py` was overwritten mid-task in slice 8 and the agent read a sibling's campaign output
  back as its own.
- Every gate **plants its own defect into a real shipping file, watches it go red, and restores
  it byte-identically.**
- **You never run git.**

## Gates that could not fail — the running catalogue

Fifteen in slice 7, more in slice 8. Assume yours cannot until you have seen it red.

`textContent` welding adjacent elements · a `hidden` attribute defeating the same read · a
defaulted parameter not counting toward `Function.length` · `Allowed` being a prefix of `Allowed
with conditions` · `toEqual([...MY_CONSTANT])` · a shared helper used as its own test whose only
firing branch could not fire · a table check satisfied by the `|---|---|` separator row · a
position check true of both a defect and its fix · fold text containing the cell's own note · a
`\b` pattern missing the plural · **an allowance taking its allowed string from the value under
test** · a check reading `sourceRef` alone, so a record naming a different row passed · a
`for...of` over the constant it was meant to verify, which shrank along with its subject · and a
prefix trap whose stated claim was false of the data, because **all six `Yes` cells were bolded**
and an anchored test found zero.
