# Slice 9 — the common half of every dispatch

**The Client Command Center, `SURF-CC`: thirteen modules, thirteen screens, and a closed action
set of ten.** Every one of the twenty-one dispatches reads this file first.

## The three lines every dispatch carries verbatim

1. **19,358 citations across 500 files.** Of those, 1,058 are verbatim-quoted, **3,197 are
   identifier-anchored and confirmed at the exact line**, 129 are anchored but unproven, and
   15,103 are weak. And **all 39,138 identifier→line pairs in
   `registries/blueprint-locators.json` were re-opened against the frozen source with zero
   mismatches** — the whole index, not a sample. That is a measured split, not a target.

   The line every slice-8 dispatch carried — "1,019 of 1,203 confirmed" — was **stale by roughly
   three times** and nobody noticed for a whole slice, because a number quoted verbatim in twenty
   briefs looks more authoritative each time it is repeated. **Re-measure it before you quote it.**
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
| `SCR-CC-10` route | `app/command-center/sync-conflict-review-panel/` | slice 8 |

The route directory is `sync-conflict-review-**panel**`, not the shorter path an earlier draft of
this brief gave. The spine's `slug:` is what names a directory, `CC_NAV` publishes each pathname
from it, and `scripts/build-registries.mjs` reads a declared slug with no directory of that name
as "declared, not built". **Read the slug; do not infer the path from the screen's short name.**

**So two of this slice's twenty-one tasks are already largely built.** Task 16 (`MOD-CC-10`
conflict panel) has its matrix, its second §36.6 treatment and its route; task 8's `MOD-CC-02`
half is done as chrome. **Read both before writing anything for either.** What remains on them is
what slice 8 handed forward, below — not a rebuild.

## What slice 8 proved about this surface, and what it left open

**The `MOD-CC-10` split was run by two implementers who never reconciled**, one on chapter 21 and
one on §36.6, and that is why it found what it found. **The Tenant Admin divergence between the
two treatments is two rows wide, not one** — panel visibility *and* reading a conflict entry.
Neither implementer could have found the second alone: one transcription plus one reconciliation
produces a merged, plausible, wrong answer. **Every remaining divergence in this slice deserves
the same treatment: transcribe, do not reconcile.**

**One apparent divergence is a decomposition, and it was deliberately left open.** §36.6 splits
"see the panel exists" from "read an entry" and gives the Supervisor `Allowed` then `Read-only`,
where chapter 21 gives `Read-only` twice. Whether that is a contradiction or a finer-grained
statement of the same rule **is the choice, and no task has made it.** If your module's tables
show the same shape, say so and leave it open.

**One that looks like a divergence is not**, and it is filed as *checked* so it is not counted
twice: the skew rows contradict each other positionally and agree exactly on their own capability
wordings, because one asks about resolving a skew-flagged conflict individually and the other
about including one in Resolve All. **Positional disagreement between two tables that run their
columns in opposite orders is not evidence of anything.**

## Three things slice 8 hands this slice directly

1. **`DEC-SYNC-006` — SUPERSEDED, and the instruction that came with it was BACKWARDS.**
   Slice 8's wave 4 disclosed it in `src/offline/decisions-37b.ts`, row 6 of §37B's table. **Read
   that record; do not mint a second spelling.**

   The brief then said "disclosing both invents a decision the source raises once". **The source
   raises BOTH.** `DEC-CONFLICTCAP-001` is raised at **L38076** and registered at **L38955**
   (§21.13); `DEC-SYNC-006` is raised at **L81737** and named as the cap's source status at
   **L80587**. The source's own index records them as first raised in *different chapters*.
   **Neither is this build's coinage, and merging them erases one.**

   They are one panel's cap asked twice: same six-word section heading, **different scopes**
   (one asks the cap value; the other adds reachability and Resolve All scope), **different
   owners**, and **conflicting recommendations** — `DEC-SYNC-006` recommends what is
   `DEC-CONFLICTCAP-001`'s option (c), which `DEC-CONFLICTCAP-001` does not recommend. Two
   readings, two locators, no winner.

   Still open: **the panel body owes the rendered cap.** The storyboard's `50` is an illustration,
   not a value.
2. **§36.6 calls `SCR-CC-10` by a different identifier than the register does.** Two names for one
   screen. Settle it before it reads as a fourteenth screen against `AC-CC-040`.
3. **`AC-OFF-702` (L78832) is recorded and not enforced**, and the same shape recurs here: it
   forbids a network call on the execution path of anything classified fully available offline,
   and a storyboard has no execution path to inspect. **Naming the criterion and what it governs
   is the deliverable; claiming enforcement would be false.**

## NINETEEN SLICE-8 FILES REACH NO ROUTE, AND ONE OF THEM IS THIS SURFACE'S

Slice 8's verification traced import reachability from all 164 files under `app/` and confirmed it
independently against the built HTML. **Nineteen slice-8 source files are imported by no page.**
`OFF-BLK-20`, `AC-37-002`, `DEC-SYNC-006`, `DEC-OFF-001`, `DEC-OFF-002`, the `FB-*` contracts and
`AC-FB-125` appear on **zero built pages**.

Most of those are offline-model files that no Frontline screen has been given yet. **One is this
surface's and it matters here:**

**`src/surfaces/cc/modules/cc-10-s366/SecondTreatmentDisclosure.tsx` has never been rendered by
anything.** It is §36.6's nine-row `MOD-CC-10` treatment carrying all four divergences — the most
valuable disclosure slice 8 produced — and it is imported by no page and no component test. Its
own header says "the controller wires it beneath that treatment" and names
`app/command-center/sync-conflict-review/`, **which is the wrong slug**; the route is
`sync-conflict-review-panel`.

**So the "disclosed on screen" obligation is met in the tree and on screen for none of it.** Task
16 wires it. Until then, a client reviewing `SCR-CC-10` sees one treatment and is told nothing
about the second.

`cc-02`'s absence from any route is properly declared in `CC_SEAMS`. **`cc-10-s366`'s is not
declared anywhere** — it is simply unreferenced, which is the difference between a stated
abstention and an oversight.

**The general lesson for every task in this slice: a component that compiles, passes its unit
suite and is imported by nothing is not shipped.** Check your own reachability from `app/` before
you report.

## The registry generator awards a route to ONE module, and only since slice 8

Worth knowing before you claim a slug. `scripts/build-registries.mjs` used to run argmax over
every route directory and award the winner **unconditionally**, with the slug claim added on top
— so a slug-claimed route demonstrated both its owner and whichever module its files named most.
`MOD-CC-02` read `demonstrated-in-storyboard` off `MOD-CC-10`'s screen, where it appears once as
the chrome mounted into it, and the inventory reported 58 demonstrated modules where 57 are.

Two consequences for every task here:

- **Name your own module id in your own route file.** A module can be demonstrated by its slug
  claim alone and never say what it is; `SCR-CC-10`'s page shipped that way and an older gate was
  right to go red on it.
- **Mounting one module's component inside another's screen is the pattern this surface requires**
  — `MOD-CC-13`'s action rail and `MOD-CC-07` both have no route and must mount inside others. It
  moves mention counts and it is not evidence of ownership. The generator now says so; do not
  write a gate that assumes otherwise.

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

Specific traps of this shape: manual close of a stuck run · **reclassifying severity, and the
brief's first framing of this was wrong** · two agent-panel cells whose required affordance is a
link, not an absence.

**On severity: `AC-CC-221` (L37000) does NOT forbid reclassification outright.** It forbids the
**displayed** severity being overridden — "Severity displayed always equals the on-device
classification; no server-side or agent value overrides it". A different act. L36845 grants the
Quality Manager `Allowed with conditions — at review time on the anomaly record, with a recorded
reason`, and the Tenant Admin cell on the same row says where: `reclassification is a review-time
act on the Delivery Operations Hub anomaly record`. **Reading the criterion as a flat prohibition
erases the link-out the matrix requires** — the same defect as rendering a prohibited cell where a
link belongs, arrived at from the other side.

**The measured figure is 13 link-out cells across 12 distinct rows**, not "at least six". Six was
true as stated and is not the number.

## Thirteen module routes and thirteen screens are two different sets

`AC-CC-040` forbids a fourteenth module route. But `SCR-CC-01` is `MOD-DOH-09`'s, `SCR-CC-03` and
`SCR-CC-04` both serve `MOD-CC-03`, `SCR-CC-02` serves two modules, `SCR-CC-13` serves two, and
**`MOD-CC-13` has no row in the register at all.** Its action rail must mount **inside** the
twelve module screens.

**`MOD-CC-07` DOES have a screen and DOES claim a route — the brief said otherwise and was
wrong.** L48398 names it on `SCR-CC-13` beside `MOD-CC-06 FEAT-CC-0603`, and
`src/surfaces/cc/modules.ts` gives it `slug: 'learning-read-view'`, which is in
`CC_CLAIMED_SLUGS` with a published `CC_NAV` pathname. **`MOD-CC-13` is the only routeless
module.** A task that builds `MOD-CC-07` as mount-only leaves a claimed slug with no directory,
which the generator reads as "declared, not built", and leaves the action rail pointing at a route
that does not exist. `scripts/build-registries.mjs` repeats the same error in its own comment.

**176 `SCR-CC-` occurrences. Left-anchored, `SCR-CC-\d+` yields exactly 13 — the register
exactly.** Everything else is mnemonic.

**This paragraph has now been wrong twice and both errors are instructive.**

*First draft:* "96 distinct tokens". *First correction:* "56, and 96 had no basis." **Both numbers
are real and neither is baseless.** 96 counts full-shape tokens (`SCR-CC-BOARD-01` kept whole); 56
counts them truncated at the mnemonic. They measure the same 176 occurrences under two different
regexes. **A count error committed inside the correction of a count error** — which is the whole
argument for stating your regex beside your number.

*Second correction:* "five three-digit look-alikes, `SCR-CC-001` through `SCR-CC-005`, the
`FB-SCHED-009` shape." **There is no such family.** Standalone occurrences of `SCR-CC-00N`:
**zero**. All ten are the tails of `AC-SCR-CC-001`–`005` and `TEST-SCR-CC-001`–`005`, which are
acceptance-criterion and test identifiers. **The phantom was created by a regex with no left
boundary**, and the fix is an anchor — `(^|[^A-Za-z0-9-])SCR-CC-\d+` — not an allowlist of five
exceptions. An allowlist would have enshrined the phantom.

**Do not build a screen from a mnemonic; build from the register.** And **anchor both ends of any
identifier pattern you write**, because an unanchored one invents members of the family it is
counting.

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

**The shell provides mount points and mounts neither module.** `CC_SEAMS` names `MOD-CC-01` as
`sync-state-chrome-host`'s owner, and L36503 says `MOD-CC-02` "supplies the banner to the
**board**" — not to the shell. A `FreshnessMarker` needs a device count, an offline count and an
age; the shell has none, and **inventing them is the storyboard's illustrative number rendered as
a value.** `chrome` and `actionRail` are props; unfilled, each renders its declared open seam
naming the owing module.

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

---

## Wave 0, verified — the first brief with no wrong locator, and one imprecise claim

**All fourteen locators in task 3's brief proved at the exact line.** That is the first dispatch
in this build to carry none wrong, and it is worth naming: the locators were opened before the
brief was written rather than after it was challenged.

**Brief error 23, and it is a precision error rather than a wrong line.** The brief said *"Seven of
the nine rows say the surface queues **nothing**"*. Read against L35694-L35702:

```
FB-CC-STALE    Not applicable — nothing is written
FB-CC-PUSH     Not applicable — nothing is written
FB-CC-SESS     None, deliberately
FB-CC-WRITE    None, deliberately
FB-CC-CMD      Not applicable — the device queues, not the board
FB-CC-AGENT    Not applicable — nothing is written
FB-CC-AUTH     Not applicable — session denied
FB-CC-REPORT   Not applicable — nothing is written
FB-CC-QUEUE    Not applicable — nothing is written
```

**All nine refuse a client-side queue.** The 7/2 split is not "queues nothing versus queues
something" — it is between two **shapes** of refusal, and `None, deliberately` is the **stronger**
of the two: a write exists on that path and is still not queued.

And **only five carry the exact words "nothing is written"**. A gate asserting that sentence across
seven rows would assert a sentence the source does not carry and find five. Both numbers are now
pinned separately, each derived from the source rather than written down twice.

**The general shape, for every remaining task:** a paraphrase that is true of a set can be false of
the words. Count what you are actually going to assert.

## A frozen viewer session is NOT a seventh `ConnectivityMode` — settled, do not re-open

`src/scenario/controls.ts` is untouched and stays untouched. `offline` there means a device holding
captures it will sync later; **this surface holds nothing and has no device.** §21.2.3's own
opening (L35489) is "Three different things can be disconnected, and they are not the same thing."

The state is `CcSessionState = 'live' | 'frozen'` in `src/surfaces/cc/fallback/session.ts`. A unit
gate pins the six connectivity modes and goes red the moment a seventh is added, **so a later slice
that wants the mode is forced to reconcile rather than drift into a second spelling.**

## `src/ui/WriteControl.tsx` now has FIVE branches and the fifth is last

Order: `explicitlyProhibited` · outcome≠allowed · `gateReason` · `objectReason` · **`missingElement`**
· enabled. **Last is the only placement under which no input reaching an existing branch renders
differently**, and four component cases set `missingElement` alongside each existing trigger to
hold that — moving the branch earlier turns five of them red.

The prop is `readonly missingElement?: string | undefined`, not `string | null`, because
`exactOptionalPropertyTypes` is on and eight existing callers are not this task's to edit.

**A frozen session reaches it through `gateReason`, not a sixth branch** — a frozen session is a
condition outside the person and outside the record that closes the control, which is what that
branch already is.

## Two things every remaining task must do, learned this wave

**Declare your abstention or it reads as an oversight.** `src/surfaces/cc/fallback/**` reaches no
route today, and the task said so in its own file header **and named the wiring**
(`<CcFallbackLibrary />` inside `CommandCenterShell`, because `FB-CC-SESS` and `FB-CC-QUEUE` are
surface-wide rather than module-scoped). That is the `cc-10-s366` lesson applied before it became a
finding: `cc-02`'s absence is declared in `CC_SEAMS`; `cc-10-s366`'s was not, and the difference is
the whole difference.

**Read a disabled control's reason by resolving `aria-describedby`, never off `textContent`.**
`textContent` welds the item note to the button's reason, so a check passes when **either** carries
the missing element's name — and the gate that must catch a control rendering no reason passes on
the note alone. Assert `reason.hidden === false` too.

---

## Wave 0 closed — `pnpm verify` green, and TWO LINK-OUT POPULATIONS THAT MUST NOT BE CONFLATED

unit 4327 · component 2301 · release 676 · e2e/axe 471.

**This is the most important thing on this page for every module task.** Two different sets of
cells in this slice want a link, and they want it for opposite reasons:

**Population A — `MOD-CC-13`'s ten operational actions. These get a control AND an audit link.**
L38657 states the discipline: *"every action is a command against a Delivery Operations
Hub-owned record, executed through the owning Delivery Operations Hub service, written to the
Delivery Operations Hub audit trail — **the Command Center is the cockpit, never the engine**."*
And L48437 makes the pointer an obligation: *"Audit or history link | Every action links to its
Delivery Operations Hub audit entry."*

**An earlier draft of this brief said "at least six cells need a link-out rather than a control".
For these ten that is wrong, and building to it would remove the controls the module exists to
place.** The record is elsewhere for all ten; the control is here for all ten.

**Population B — module-matrix cells the source marks prohibited and then names a destination
for.** L37671 and L37672 read `Explicitly prohibited` and their own text says "a Standards and
Operations Studio action, **linked from here**"; `AC-CC-301` requires each such control to *be* a
link. `src/ui/WriteControl.tsx` renders `explicitlyProhibited` as **nothing at all**, so a
faithful transcription produces an empty cell where the source requires a link. **Measured: 13
cells across 12 distinct rows.** These get a link **instead of** a control.

**Consume task 5's `CrossSurfaceLink` for population B. Consume task 4's `CC13_OWNING_PLACES` for
population A.** They are different shapes and the same component would be wrong for one of them.

## Row 9 of the ten has no owning place, and an acceptance criterion says all ten do

`Executes via` (L38673) reads only *"Re-runs the rule-based evaluation; an agent activates only if
a trigger results"* — **no owning service named**. `AC-CC-401` (L38858) asserts an owning Hub
service for all ten. The source does supply row 9's owner, **in a different table**: L35365 gives
`EVT-CC-RECHECK-REQUESTED` as emitted by the Hub record service. Recorded structurally as
`owningPlace: null` plus `owningPlaceElsewhere` — **not repaired by copying the other table's
answer into the column that lacks it.**

The brief's own enumeration of the executing services was also inexact: **there is no "run
record"** among the ten. Rows 4, 6 and 8 are the lot record, the brief record and the Assignment
service.

## §25.4 already commits the drift `DEC-CCWRITE-001` warns about, in the source's own text

Its table is headed *"Actions and permissions across the ten operational actions"* (L48440) and
carries thirteen data rows. **Row 11 (L48454) is "Author or export a report format"** — outside
write #1, sitting inside a table of the ten. Rows 12-13 are two of the absolute exclusions.

And **option (b) of `DEC-CCWRITE-001` is "expand the closed set to fourteen"** — ten plus its
four. **There are six.** Option (b) as written would leave two outside the expanded set. Evidence,
not a choice.

## Exactly three of the ten are command-bearing, and the source says so twice verbatim

L35372: *"Of these the Command Center originates three: lot release (action 4), reassignment or
substitution (action 8), and qualification clearance (action 10)."* L38719 restates it. They map
onto `CMD-FL-LOTREL`, `CMD-FL-REASSIGN`, `CMD-FL-CLEAR`.

**The command-class table puts the NAME in column 1 and the IDENTIFIER in column 2** — the reverse
of what a reader expects, and a positional read inverts every row. A gate caught exactly that.

## The propagation roll-up counts acknowledgements, not `effectiveOnThisDevice`

`@/frontline/commands` exports `effectiveOnThisDevice = applied || acknowledged`, which is correct
for the **device**. This is the **surface's** question and its only evidence is the acknowledgement
returning. **A device at `applied` is unconfirmed here.** L2100 and `AC-FL-007-3` (L39721) both
bind the surface.

**No timeout, and no parameter one could be passed through.** `DEC-WIPE-001` leaves the horizon
unstated, so an unreturned device holds `propagating` indefinitely. The three-token vocabulary
(`AC-PROD-054`, L1680) has no way to say "stuck" and no fourth token was minted; the source's own
remedy is the per-device list. **An empty device set answers `issued`** — `[].every(...)` is
`true`, which would promote a command that reached nobody straight to the strongest state.

## A RESTORE VERIFIED AGAINST A BASELINE TAKEN AFTER THE CORRUPTION

The sharpest process finding of the wave, and it was self-reported.

A plant campaign's restore used `String.replace(to, from)`, which matched the **first** occurrence
of the planted string rather than the one it had written — moving a clause from row 10 into row 1.
Every later plant then captured its baseline **from the already-corrupted file**, so three plants
reported BYTE-IDENTICAL against a corrupted baseline and the checksum agreed every time.

**What caught it was not the checksum. It was three test failures that persisted across unrelated
plants and had nothing to do with the defect being planted.**

Every plant harness in this slice must therefore: **require its anchor to occur exactly once
before planting and before reversing**, capture the baseline **once, before the first plant**, and
abort on mismatch. **A checksum that agrees proves the file matches the baseline, not that the
baseline was right.**

## Five more brief errors from wave 0

- **"Two rows carry an obligation no other row does" — twelve do.** Only `As-of time` repeats
  (6 rows); the other twelve obligation cells are each unique.
- **Two rows are per-device, not one.** L35897 `Per-device timestamps` and **L35901
  `Per-device last-seen time`**. A model making only the first per-device renders the marker's own
  source data as one scope timestamp. And note the gate shape: **a count of two is also true of
  the flags moved onto the wrong pair** — name the rows off the source.
- **`Report figures`'s cell is `Refreshed with an explicit data-as-of stamp`** — the brief dropped
  `stamp` — and the unusual cell is in the **Class** column, not the marker-obligation column.
- **"Four states" is wrong: L36142 says "three distinct meanings"**, and L36182 says manual close
  is drawn as an **entry into submitted**, not a state. The brief also missed a fourth diagram
  node it does carry: **`InProgress` at L36170**.
- **"a 30-second platform floor, quoted exactly from the numbers canon" — the canon says
  per-tenant.** L12899: `Command Center board refresh | 60 seconds | Per-tenant floor 30 seconds`.
  Source-wide: **3** occurrences of "platform floor of 30 seconds", **13** of "per-tenant floor of
  30 seconds". **This is not cosmetic** — a platform floor is not a tenant's to cross; a per-tenant
  floor is a bound a tenant sets within, which is precisely what `DEC-REFRESH-001` asks.

**`DEC-FINISH-001` is raised inside §21.3 at L36150** and the brief did not name it. It is already
carried in `app/super-admin/tenant-configuration-registry/fixtures.ts`; point at it, do not
respell it.

---

## THE ACTION RAIL MOUNTS ON SEVEN SCREENS, AND UNTIL NOW NO BRIEF SAID SO

**Two wave-1 tasks found this independently and both refused to guess.** One owns `MOD-CC-13` and
no path under `app/`; the other owns a screen and checked whether the rail belonged on it. Between
them they exposed a **circular abstention**: `MOD-CC-04`'s route said the wiring "belongs to the
task that owns `MOD-CC-13`", that task owns nothing under `app/`, and **no brief in this slice
named `actionRail` at all.** The rail would have shipped mounted nowhere.

**L38793 enumerates the seven modules whose screens exercise one or more of the ten:**

```
MOD-CC-03   MOD-CC-04   MOD-CC-05   MOD-CC-06   MOD-CC-09   MOD-CC-10   MOD-CC-12
```

**`MOD-CC-01` is not among them**, which agrees with L36278 ("no records. The board writes
nothing"), L36280 ("read-only by construction") and a matrix carrying no action row. The board's
task left `actionRail` unfilled and rendered the shell's declared seam — **correctly**, and it had
already mounted the rail once before reading L38793.

**So: tasks 6, 10, 11, 12, 15, 16 and 18 each mount the rail on their own screen.** One line:

```tsx
actionRail={<Cc13ActionRail personName={…} scopeFilter="Site" heldColumns={…} mountedOn="MOD-CC-0N" />}
```

**Every other module task leaves `actionRail` unfilled** and lets the shell render its seam. Do
not mount it on a screen L38793 does not name.

**Note the source contradicts itself here and it is not repaired:** L38793's own sentence opens
"Every other module on this surface", which is twelve, and then enumerates seven. The enumeration
is complete over the ten actions. Both readings recorded, neither adopted.

## Two rails exist, deliberately

`src/surfaces/cc/actions/ActionRail.tsx` (wave 0) is the **module card** — it renders the two
tables as data. `src/surfaces/cc/modules/cc-13/Cc13ActionRail.tsx` (wave 1) is the **control
rail** — ten controls in three visual states, from `SB-16-02`. **Mount the second, not the first.**

**Chapter 16 specifies this rail and nothing in the repo had opened it.** Three lines no brief
carried:

- **L20195** — three visual states: enabled; disabled with an inline reason; **absent only where
  the action is `Not applicable` to the selected object.** Also: the header carries "the person's
  name and the current scope filter — Site or Area — and nothing else. **There is no role
  indicator, because there is no active role.**"
- **L20197** — "The action rail shows **all ten** actions", one person holding Supervisor at an
  Area *and* Quality Manager at a Site with **no dropdown asking which role he is using**;
  out-of-scope disables with **"Out of scope for your grants"**.
- **L20238** — `TEST-16-13`, the source's own named test for the row-4 substitution.

**THE ABSENCE INVERSION, and it is a real conflict this build has not settled.**
`src/ui/WriteControl.tsx` draws `explicitlyProhibited` as **absent** and `notApplicable` as
**disabled**. **L20195 asks for the exact reverse on this rail.** The rail therefore renders
through `ProhibitionNotice` rather than `WriteControl`, and records the inversion instead of
editing a control eight callers share. **Do not "fix" either one to match the other** — they are
answering different questions and the source says so.

**Row 4 is the live prefix trap and the source states its resolution three times.** L38685's
Supervisor cell reads `Explicitly prohibited — may request with a note`: the token **prohibits**
and the note **grants a different act**. L20195, L38738 and L20238 all say the rail draws
**"Request release with a note", enabled — "not a disabled version of the Quality Manager
control"**. Classified by token alone, the Supervisor gets nothing drawn.

## Four more brief errors, and one defect fixed in a slice-8 file

- **`MOD-CC-01`'s card span is wrong.** Its stated end line is blank, and §21.4 runs to **L36423**. The span given stops before the matrix, the states, the functionalities,
  the storyboard and every acceptance criterion.
- **Two §25.4 cells were misquoted as paraphrases.** L48447 is `Allowed with conditions — request
  only, **with a mandatory note**`; L48448 is `Allowed with conditions — skew-flagged **conflicts
  are excluded from Resolve All**`. Both were shortened in the brief and presented as quotations.
- **"disagree on six cells and use four different status tokens for the same cell" — measured.**
  Over three action-keyed tables × 10 actions × 5 columns: **32 of 50 cells differ on the token,
  33 of 50 on the full text, and no cell carries more than two readings.** "Six" is the count of
  *named divergences* (five cells plus a ten-cell column counted as one); "four" is §21.16's
  vocabulary size, not any cell's.
- **Actions 2 and 3 are not the same pair.** Action 3's Supervisor cell is `Read-only` in §21.1.2
  and §25.4 and `Explicitly prohibited` in §21.16 — **§21.16 alone.** Action 2's is `Explicitly
  prohibited` in §21.1.2 and §21.16 and `Read-only` in §25.4 — **§25.4 alone.** Two-to-one in
  opposite directions.

**And a defect fixed in slice 8's `MOD-CC-02`:** `cc02PendingText` rendered `N pending captures`
where the live model renders `N captures pending`. **The source writes this string once — `14
captures pending`** — so the model matched it and the chrome inverted it. Found only because one
screen mounted both; invisible in either file alone.

## Two transcription traps in the cross-table joins

- **The surface matrix has no `#` column and runs the ten OUT OF ORDINAL ORDER** — action 6 is its
  last action row, below 7-10. It joins by exact capability wording; all ten match §21.16
  character for character.
- **§25.4 cannot join by name.** Three of ten differ, including `Resolve-All` against `Resolve
  All` — **a hyphen.**

## One more plant-harness rule, learned by a harness refusing a correct plant

Requiring the **planted** text to be unique is wrong. A defect that looks exactly like nine
correct rows is the one most worth planting, and `Supervisor: 'Explicitly prohibited',`
legitimately occurs four times in one table. **Splice by index** — capture the offset, and reverse
by slicing the same offset back. That restores correctly regardless of twins, which
`String.replace` does not.

---

## Wave 1 closed — and the controller relayed a wrong diagnosis of a real red

**Two siblings reported `tests/unit/cc-04.test.ts` red, and the controller relayed a diagnosis
with it: "the walk starts one line late, on the separator." That diagnosis was wrong.** The walk
begins at `separatorLine + 1` and asserts its first row is L36834; it was correct the whole time.

**The red was a live plant.** The owning task's harness had two bugs, both self-reported, and both
corrupted a real shipping file:

1. **`occurrences()` looped forever on an empty needle.** A deletion plant reverses by searching
   for `""`, and `indexOf('', i)` returns `i` every time. Two runs spun at full CPU with **a matrix
   row deleted for about fourteen minutes** — which is exactly what the siblings saw. The harness
   now **refuses an empty replacement**: a deletion must be spelled as a unique marker so the
   reversal is a reversal.
2. **The baseline check ran per edit instead of per step**, so a three-edit plant aborted on its
   second edit and left the first unreversed.

**The lesson is about the diagnosis, not the bug.** A red in a file another task owns is a
*symptom*, and relaying a guess about its cause alongside it gives the guess the authority of the
observation. **Report the red and the command that produced it. Let the owner diagnose it.** The
owner adjudicated this one correctly and said so.

## Brief errors 33-37, and one is my own sentence contradicting my own list

- **"Mark evidence reviewed carries three different statuses across three matrices" — it carries
  TWO distinct tokens across three statements.** L36842 `Explicitly prohibited`, L38688 `Explicitly
  prohibited`, L48450 `Unavailable`. **The brief's own list contradicts its own sentence**, and
  nobody noticed until a task counted the distinct values. Recorded as `statements === 3`,
  `distinct === 2`, both read off the source.
- **The real three-token divergence is on release/request, not mark-evidence.** The Supervisor's
  lot-hold release is stated four ways: L36838 `Explicitly prohibited` + L36839 `Allowed` (two
  rows), L38685 `Explicitly prohibited — may request with a note`, L48447 `Allowed with conditions
  — request only, with a mandatory note`, and L49579 agreeing with the split.
- **"§25.4 grants the request half to the Supervisor only" is imprecise.** §25.4 carries **no
  request row at all**; its single release row folds the request into the Supervisor's condition,
  and its Quality Manager cell is bare `Allowed` — **silent on the request, not denying it.**
- **"L36845, repeated at L49578" — it is not a repeat.** L36845 is a *role* row with five persona
  columns; L49578 is a *record-type* row with six surface columns, and its header carries no
  Tenant Admin or Quality Manager column at all. They share one reading and **L49578 does not
  carry the destination.** Treating it as a repeat imports a surface-level token into a persona
  column and loses the Hub anomaly record.
- **`MOD-CC-04`'s card span ends on a blank line**, 196 lines short of the section. §21.7 runs
  L36796 to L37025. **Three module card spans in this brief have now ended on a blank line** — the
  spans were taken from a table of starts, not by reading to each section's close. The wrong end
  lines are not spelled anywhere in this file: `locator-fidelity` refuses a citation of a blank
  line even inside a sentence saying the line is blank, and it went red on exactly that.

## Two more gates that could not fail, both found by planting

- **`page.includes('MOD-CC-04')` was satisfied by the L38793 quotation**, which names seven module
  ids. Deleting every sentence where the page named *its own* module left the check green. It now
  requires an occurrence on a line naming no *other* `MOD-CC-*`. **A file that quotes a list of
  identifiers contains every identifier in that list.**
- **A name-keyed cell lookup was blind to column order.** Reversing the body's columns left every
  `data-testid` sitting on its own value and the gate green, with every cell under the wrong
  heading. A positional order gate now runs alongside the header-keyed one — **header-keying
  protects the transcription and does not protect the render.**

## The severity row, resolved

Row 12 renders **two `CrossSurfaceLink`s and no control**. A faithful transcription would draw
*nothing* for the Tenant Admin cell and a *live control* for the Quality Manager's; neither is what
the row asks. Beside them, the boundary is rendered as **not a contradiction**: `AC-CC-221`
(L37000) governs what this surface **displays** — and a Quality Manager at review time is neither a
server-side nor an agent value — while L36845 governs an act on the **Hub anomaly record**,
restated in prose at L36881. A gate asserts L37000 contains `displayed` and does **not** contain
`reclassif`.

**"Awaiting Quality Manager" is deliberately not computed.** The Quality Manager is `Allowed` on
both the release row and the request row, and `FUNC-CC-0404-1-2` (L36990) lists them among
requesters — so no count can separate an item awaiting another's authority from one raised to
oneself. **A fabricated number on a client screen is worse than a named gap.**

## One sibling gate worth knowing about

`tests/unit/cc-live-model.test.ts` uses `/^\s*(?:import|export)[^'"\n]*from\s+['"]…/gm` for its
dependency gate. **That regex cannot see a multi-line import** — `from` must sit on the `import`
line. Two tasks independently wrote the same shape into reachability probes and both under-reported
until they widened it. **A dependency or reachability check that under-reports goes green on a
broken chain.**
