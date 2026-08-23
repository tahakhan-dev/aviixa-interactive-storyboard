# Controller resume brief

**Read this file first, in full, before any other action, whenever context has been
compacted or a new session begins.** It exists because the client instructed that on
compaction the controller must re-read its state rather than rely on recollection.

`git log`, the ledgers under `docs/process/ledgers/`, and this file are authoritative.
Your memory of this run is not. Where they disagree, they win.

---

## 1. What is being built

A browser-only Next.js interactive storyboard for the AVIIXA platform: five product
surfaces, nine human roles, static export, no backend of any kind. It is a
client-validation artefact — realistic and production-quality in engineering, and never
claiming a production capability it only simulates.

The governing instruction is the master prompt in the client's first message. The single
source of **product facts** is the frozen blueprint.

## 2. The frozen source — verify this before trusting anything derived from it

```
/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md
sha256  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
        18,565,031 bytes · 122,241 lines
```

**Re-hash it at session entry and at every slice boundary.** If it has changed, stop and
run the source-drift procedure in master prompt §2.1 — that is one of the few stops the
client's no-stop instruction does not override.

It is far too large to read whole. Use `grep -n` and `sed -n 'A,Bp'`. It is read-only
input and must never become an application asset.

### 2a. The knowledge graph — an index over the source, never a substitute for it

`graphify-out/graph.json` holds a graph of this codebase and of the blueprint, built by
local AST parsing for code and by extraction for the document. Query it with:

```
graphify query "what governs closing a stuck run?"
graphify path "MOD-DOH-08 — Execution Summary and Anomaly Register (Delivery Operations Hub module)" "MOD-CC-13"
# `path` fuzzy-resolves a bare name and does not say when it picked the wrong node.
# `MOD-DOH-08` also matches MOD_DOH_08_WRITE_ROWS in src/surfaces/doh/objects.ts; pick the
# wrong one and it prints "No directed path found" for a pair three hops apart. `explain`
# refuses and names both — resolve there first, then pass the full label or the node id.
graphify explain "src_ui_writecontrol_writecontrol"
```

**Three rules, and the first is the one that matters.**

**The graph never outranks the blueprint.** It is derived, and this build has been bitten
three times by a derived layer mistaken for the source — an extractor's own wording quoted
as the document's, an extractor's own line number cited as the document's, and a chunk
pinning itself to a line that was then cited. A `graphify query` result is **a lead to
verify, not evidence**. Open the line it names and read it.

**Cite the blueprint, never the graph.** Every blueprint node carries `blueprint_locator`,
the real line in the frozen source. That is what belongs in a comment or a test. A citation
of a graph node is a citation of a guess about the source.

**What it covers, measured rather than claimed.** 29,498 nodes and 45,565 edges: 6,799 from
the code, the rest from all 746 slices of the frozen blueprint. No slice carrying an
identifier is unread — the merge checks that against the manifest, and it found 21 that were
missed on the first pass. Chapters 5 and 54 are parsed deterministically from their tables
rather than read by a model: those are the author's own identifier-to-identifier relations,
and asking a model to re-derive them would only add an error rate.

**Its edges are labelled and its limits are real.** Every edge is tagged `EXTRACTED` (read
from the source) or `INFERRED` (resolved), and an `INFERRED` edge is the graph's opinion.
Star re-exports through a barrel do not resolve, so "who uses X" is incomplete for anything
exported via `src/ui/primitives/index.ts`.

**Extraction invents things, and three checks exist because it did.** One agent returned
valid JSON having recorded 15% of the identifiers in front of it; one wrote `ch-8/` for a
file in `ch-7/` (94 paths needed repair); one reported 100% coverage having never opened
four of its nine files. All three passed every structural check and none errored. A fourth
emitted twelve acceptance criteria that occur nowhere in the blueprint — it had seen a few
real ones and continued the sequence. `scripts/check-extraction-coverage.mjs` and
`scripts/merge-graph-chunks.mjs` catch all four classes; run both after any re-extraction.

### `registries/blueprint-locators.json` — the committed residue

The graph is ~30MB and git-ignored, so no gate may read it. The index is 869KB and committed:
**19,897 identifiers at all 39,138 lines they appear on.** The identifiers come from the
graph, which judged what is an entity; the line numbers come from scanning the frozen source,
so a line is listed only because the identifier was found on it.

This is what promotes a weak citation to a strong one. Of 1,203 identifier-anchored citations
in the tree, 1,019 are now confirmed at the exact line — it was 37. The same scan found
eleven citations that were simply wrong, including one 44,561 lines from its subject, and
`tests/coverage/citation-graph.test.ts` holds the floor so they cannot come back.

**A citation may name a line inside a section rather than the identifier's own line** — a
permission row at L32637 sits within `20.2.7 MOD-STU-07`, which opens at L32574. That form is
correct and the gate allows it. Five accurate citations were nearly "corrected" into
inaccurate ones before this was understood.

### Keeping it current — automatic, and one command you must not run

A Claude Code `Stop` hook runs `scripts/graph-update.mjs` at the end of every turn. It exits in
~0.4s when no code changed, takes ~25s when it did, and reports the exact delta: files
re-extracted, nodes and edges before and after, blueprint locations re-mapped, whether the
committed locator index drifted, and how many of its ten integrity invariants hold. It backs
the graph up first and restores it if the rebuild fails or the result violates an invariant.

**Do not run `graphify update .` on this project**, and ignore any advice that says to — the
line above used to. It rebuilds from the CODE corpus alone and writes that as the whole graph:
run once, it replaced 29,498 nodes with 6,849 and discarded every blueprint node, reporting
success. The docstring says unchanged nodes are preserved. They were not.

    node scripts/graph-update.mjs            # update if anything changed
    node scripts/graph-update.mjs --check    # report staleness, change nothing
    node scripts/verify-graph-integrity.mjs  # the ten invariants, ~0.4s

`verify-graph-integrity.mjs` is what makes "the graph is fine" a checkable claim rather than an
exit code: the blueprint sha256 unchanged, no collapse, blueprint nodes citing the frozen
source, no half-mapped node, no prefixed-duplicate ids, **no identifier in the graph or the
index that the source does not contain**, no placeholder community labels, and every
identifier-bearing slice read. A planted `AC-GHOST-999` walks past a check that only inspects
the index, because the index lists only what it found in the source — so the graph is asked
too.

The blueprint half never needs rebuilding — the source is frozen.

## 3. Client authority — `docs/process/ledgers/approval-ledger.json`

Fourteen entries, APP-000 to APP-013. The four that govern behaviour now:

- **APP-003 / APP-006** — full census closure and enterprise-SaaS product quality, both
  standing reinforcements the client attached to design approvals.
- **APP-011** — close slice 4 completely, production level.
- **APP-012** — standing autonomous authority to census closure across all fourteen
  inventories and all thirteen slices. Decision-making delegated: where a choice is open,
  pick what is best for the business and proceed.
- **APP-013** — **no inter-slice stop.** Finish a slice, go straight into the next. After
  slice 13, audit the whole build for gaps, fix them, then audit against the blueprint
  verified against the code, repeating until nothing remains. Only then may the claim
  *"nothing is remaining, ready to demo"* be made.
- **APP-014** — APP-013 restated by the client **after being shown the measured position**
  (4,712 of 4,948 census items outstanding, `SURF-CC` entirely unbuilt, six accessibility
  failures live, 129 planned tasks across slices 7-13), with four clarifications:
  **the fourteen inventories are named by the client and all fourteen are in scope**
  (modules, workflows, ai-storyboards, functions, business-objects, actionable-controls,
  business-use-cases, notifications, scheduled-work, features, sub-features,
  offline-scenarios, events, commands); **self-correction is not a stop** — an error found
  in this build's own work, briefs or gates is fixed and the run continues;
  **production-level is the standard for the whole remainder**; and the `Workflow` tool
  remains permitted. **Reading a measured report of what remains is not permission to
  stop** — that is what APP-014 exists to settle.

**Two limits survive the delegation, and they protect the client rather than constrain
you.** An unresolved *source* decision is still disclosed on screen with its alternatives,
and your pick labelled a client-delegated choice — the client delegated the decision, not
the pretence that the source settled it. And no production capability may be claimed that
is only simulated.

**Stopping is permitted only for:** source drift, an irreversible or destructive
operation, or a defect where every path forward is a guess. None of those is a check-in;
each is reported as a blocker with evidence.

## 4. Where everything lives

| what | path |
|---|---|
| approvals, invocation, TDD, debug, review, verification, loop ledgers | `docs/process/ledgers/` |
| source-reading ledger | `docs/process/source-reading/` |
| per-slice specs | `docs/superpowers/specs/` |
| per-slice plans | `docs/superpowers/plans/` |
| live controller ledger for the running slice | `.superpowers/sdd/<plan-basename>/progress.md` |
| generated registries — the coverage truth | `registries/generated/*.json` |
| the gates | `tests/coverage/` |

**`.superpowers/sdd/<plan>/` is deleted when its plan closes.** Anything in it that must
outlive the slice is moved to `docs/process/` first — that is why the six reconstructed
ledgers exist.

## 5. Build order — thirteen slices

1 foundations · 2 review shell and persistence · 3 platform bootstrap **(merged)** ·
4 tenant setup **(closing)** · 5 Studio authoring to publication · 6 Hub Job/Run and
official truth · 7 Frontline online execution · 8 offline, package, reconnect,
convergence · 9 Command Center and the closed action set · 10 notifications, schedules,
audit, reports · 11 artificial intelligence and its absence · 12 platform controls,
suspensions, incidents, archival · 13 branch closure, visual baselines, walkthroughs,
release evidence.

Each slice: design → written spec → plan → subagent-driven execution with an independent
review per task and a fix loop → slice gates → verification → whole-branch review → merge.
The client removed the check-in, not the discipline.

## 6. How to run a slice

`superpowers:subagent-driven-development` is the execution mode. Per task: dispatch a
fresh implementer with a brief file; it reports; **verify its numbers yourself**; commit;
dispatch an independent reviewer over the packaged diff; run the fix loop; scoped
re-review each round; commit.

- Implementers **never run git**. The controller commits.
- **Diff every dispatch's path list against every RUNNING agent, not only against the
  other dispatch in the same message.** This was violated twice and caused two collisions.
- Verify with all four: `pnpm typecheck`, `pnpm test:unit`, `pnpm test:component`,
  `pnpm test:release`. `pnpm verify` chains them plus lint and build.
- **Ask the graph before grepping 122,241 lines.** `graphify query`, `graphify path` and
  `graphify explain` answer "what governs this?" and "what connects these?" in one command.
  It is an index, so treat what it returns as a lead: **open the line it names and read it
  before citing it**, and cite the blueprint line, never the graph node. See §2a.

## 6a. Path-list discipline — a procedure, because the habit has failed three times

Before dispatching, write down every live agent's path list and diff the new one against
**all of them**, not against the other dispatch in the same message. This has been recorded
as a lesson twice and violated three times:

1. `tests/unit/doh-sso.test.ts` given to a batched sweep and an infrastructure fix at once.
2. `app/hub/HubShell.tsx` given to a task-10 fix round and the component lift at once — so a
   commit describing only the gate also carried the lift, and the attribution is wrong in
   the permanent record.
3. `tests/unit/doh-{locations,tenant-lifecycle}.test.ts` given to a route-coverage fix and a
   false-claims fix at once.
4. **A different shape, and it is the controller's own tool rather than a dispatch.** Slice 8
   wave 1: `git add -A`, run to commit a brief correction while four agents were writing, swept
   all four of their source files into three commits titled `docs(slice-08): …`. `812e323` is
   the commit whose message describes wave 1 and it carries three files. Nothing was lost and
   the tree verified green, but three diffs are described by subjects that do not name most of
   their bytes. **The step: `git add <path>` — never `-A` — while any agent is running.**

None caused a defect. All three were caught only because the controller checked the tree
rather than assuming. **A lesson recorded three times and violated three times is not a
lesson — it is a missing step.** The step: keep the table below current, and do not dispatch
until the new path list has been diffed against every row in it.

| agent | path list | status |
|---|---|---|
| _(update at each dispatch; clear on report)_ | | |

**When a collision happens anyway:** do not rewrite history to tidy it. Verify the tree is
correct, commit with the attribution stated plainly, and tell any reviewer reading that diff
what else is in it. A corrected history is worth less than an accurate record.

## 7. What this build has learned — apply these without being asked

**Ten defect shapes, every one shipped behind a green suite:**

1. A control that did nothing — state written, never read, because a filter closed over a
   module-load snapshot. Its "fix" then reached one call site of three.
2. A test satisfied by an `aria-disabled` button, because it asserted only presence.
3. An audit path wired to one of four write handlers — and that one the only handler that
   mutated nothing, so the contract was demonstrated where it cost nothing.
4. A screen asserting an absence the build contradicted.
5. A screen pointing at content that was not there, guarded by a test that iterated an
   array and so could only ever pass.
6. A state fold applied to one render branch of four, so one card contradicted itself two
   paragraphs apart.
7. Scope enforced in what the screen **drew** rather than in what it **read**.
8. A fix that made an unreachable collision reachable — two controls sharing one state.
9. A vacuous subset assertion — passes on an empty set, or on equal sets.
10. A test helper **scoped to exclude the defect it names**.

**And the meta-rule underneath four of them: fix once, where all callers route.** Count
the call sites before and after, and put both counts in the report.

**A gate that cannot fail is worse than no gate.** Every gate plants its own defect,
watches it go red, and restores it. Four shipped tests here could not fail.

**Briefs are not the source.** Three brief defects: two truncated matrices and one that
quoted strings the source does not contain. Every module dispatch says the brief's
quotation is a convenience and the frozen source is the authority.

**The source contradicts itself on ABSENT versus DISABLED, at named-test strength.** Do
not settle it. `tests/coverage/slice-04-gates.test.ts` holds a fixture pinning each
conflict with both locator sets. **`Explicitly prohibited` HAS a source definition and a
shipped rendering, and this section used to say it had neither.** L109081 defines it — "The
action is offered nowhere and is refused if attempted by any route" — and slices 4 and 5
shipped a derived two-branch rule that slice 7's twelve Frontline modules then consumed for
332 of their 539 cells. What is genuinely unsettled is the ABSENT-versus-DISABLED question
around it, which `tests/coverage/slice-04-gates.test.ts` pins with both locator sets.
`Unavailable` remains overloaded across two senses that render oppositely — L42114 against
L42120 and L41797 — and `MOD-FL-B12` holds both of them, five cells each.

**Verify agents' numbers rather than accepting them.** Three times an agent checked a
figure the controller supplied and found it wrong. Twice an execution claim did not
survive checking while the underlying work was correct.

## 8. Position — update this section at every slice boundary

**Slice 9 is closed and verified. Slice 10 waves 0 and 1 are closed, fifteen commits,
`pnpm verify` exit 0 end to end: typecheck, lint, gate-ordering 24/24, freshness 2,
unit 4965, component 2496, build 96 pages, release 735, e2e/axe 515.**

Wave 1 built the scheduled-work spine — six registers across four `SCHED-` key spaces —
and the twenty-two-operation permission model, which is `src/policy/columns.ts`'s first
production consumer and therefore the check on whether wave 0's column type shipped or
was merely written.

Slice 9's verification pass ran the whole chain on frozen bytes and opened twelve findings.
The one that mattered was **defect shape 6 shipped again**: `src/surfaces/cc/seams.ts` declared
`THIS_SLICE = 8` while both its seams' owning modules had landed, so "Until that board exists
there is no host" printed on 12 of 13 Command Center pages and one panel contradicted itself two
sentences apart — green because five files in four suites pinned the stale value as a literal
string. Fixed at the single input; no successor gate names the constant.

Wave 0 built the slice-10 spine: the non-human matrix column type (391 cells across four
matrices parse without a throw), the decision canon at 43 records, six closed vocabularies,
`LockedControl`, and both notification registers at 112 keyed rows.

### The canon-count class, and why it took five tasks

One derived number — the canon's size — had **twenty-nine** hand-maintained copies across the
tree. Eleven were assertions, eleven were rendered strings, and eighteen more were comments.
Three tests pinned the stale phrase, so every suite was green while eleven screens told readers
the canon holds twenty-nine records.

The sequence is worth keeping because each step found the next: 2b consolidated the eleven
assertions into one membership gate; 2c found the eleven rendered strings and that the pin was
three tests rather than one; 2d cleared the eighteen comments and planted the class-closing gate;
the controller planted into that gate and found it missed **double-quoted JSX attributes** —
`aria-label`, `title`, `alt` — so a stale count could still reach a screen reader; 2e narrowed
the exemption to comment prose only.

**Three rules came out of it.**

A membership gate is a literal list, not a length. The `DecisionId` union, `OPEN_DECISION_IDS`
and the records are locked together *inside* the module at compile time, so a deletion from all
three leaves nothing in there to notice it. Only a list declared outside can — and typed
`readonly DecisionId[]` it catches that deletion twice, red at run time and a `tsc` error naming
the id. `toHaveLength(43)` is satisfied by any 43 records at all.

**Never renumber a stale count — remove it.** Changing twenty-nine to forty-three reships the
identical defect with a fresh number. The count was never the claim a reader could act on; the
absence was, and the suites already measured it.

**A membership gate is proved by ADDING, not removing.** 2c's decisive plant added three
identifiers to the canon and all three rewritten gates fired — which is what distinguishes a
gate that tests membership from one that tests prose. And `cc-02.test.ts`'s absence loop had no
positive control, so a failed parse made every absence pass (shape 9); it now carries one.

### Wave 1: what the scheduled-work chapter actually contains

**Six registers across four key spaces**, where L102392 says "two numbering schemes exist" —
the source understates itself. §45A.2 Tables A and B (35 findings, one key space, two views,
body L98341-L98375) · §45A.3's 22 `DNC-` controls (L98485-L98506) · §45A.4.1's anchored timers
(35 rows, L98584-L98618) · §45A.17.1's 24 deployable mnemonics (L102396-L102419) · §54.7
Matrix 14's `SCHED-01`-`SCHED-24` in three blocks (L117892-L117915) · §30A.3's seven
`SCHED-*-001` narrative short forms, which L102537 rules non-authoritative. `SCHED-01` is a
prefix of `SCHED-010` and both are real identifiers of different things, so the key is branded
and key-space-first.

**§45A.2 and §45A.4.1 both hold 35 rows**, so no count check distinguishes them. The
discriminator is that not one anchored-timer line carries a `SCHED-` token — that register is
keyed by timer name. A controller brief said ~46 and was wrong by eleven.

**L102392 is the most valuable line in the chapter.** A numbered row is a finding, a mnemonic
row is a commitment, neither supersedes the other, several findings map to none, and the
crosswalk at §45A.17.2 closes `DEC-SCHED-011`. It dissolves the card-versus-crosswalk conflict
two briefs called C1: there are 13 non-obligations and 25 cards, and the six "conflicts" are
exactly the six non-obligations that carry a card at all. **Do not render a contradiction the
source resolves.**

**The real conflict is Matrix 14 against the crosswalk, with zero cross-reference either way** —
measured: no line in 45A names §54.7, no line in §54.7 names 45A. Six Matrix-14 rows assert a
full Schedule Definition for findings the crosswalk says need no timer. Both render, neither
wins, no decision identifier minted because the source raises none.

**A ceiling worth carrying:** a `readOnly` cell is answered by the cell alone, so
`evaluateAccess` is never reached and a read-permissive answer has not been tenant-isolation
checked. That is why `AC-30D-105` (**L74029**, not the L74032 two briefs carried — that is
`TEST-30D-103`) needs a second stage rather than trusting the cell.

**For task 13, the contamination story in both briefs was wrong.** The 24 two-digit rows in
`scheduled-work.json` are not false positives from `PER-SCHED-NN` — whole-token counts show that
pattern never yields a `SCHED-0N` — they are Matrix 14, a real register belonging in the file as
its own key space. The one genuine false positive is `SCHED-0NN`, the source's own prose template
token. And **zero of the 24 deployable mnemonics are in the file**, while its `dedupRule` claims
it distinguishes them from the 35 findings.

### Two rulings recorded here because no file may hold them

**`DEC-CMDEXP-001` and `DEC-SYNC-002` stay separate.** They are one question — command expiry
horizons per class — and L80093 is the source's own evidence the two registers did not know
about each other. But slice 8 discloses the second locally in `src/offline/decisions-37b.ts` and
a gate pins its literal absence from the canon. Registering it there creates the second home
`DecisionDisclosure` exists to prevent, and that trap already fired once this slice when task
2's prose named `DEC-STORE-001`. Consolidating slice 8's local disclosures is its own task with
its own gate, not a side effect.

**`ColumnClass` and `TransitionCauserClass` are not duplicates.** The first answers what kind of
column holds authority (platform, tenant, `NON_HUMAN`, `AGGREGATE`); the second what kind of
actor causes a transition (`human`, `nonHumanIdentity`, `noHumanOnThisConsole`). `AGGREGATE` has
no analogue in the second and `noHumanOnThisConsole` none in the first — it is a statement about
where the cause lives, not which identity performs it. Do not unify them on the strength of the
shared word.

### Open from slice 9's verification, still open

Screenshot manifest stale — 85 routes against a 96-route export; `pnpm screenshots` writes
committed files, so it is the controller's. `CcFallbackLibrary` reachable from zero pages, a
declared abstention with the wiring unbuilt. Four `MOD-DOH-*` unrepresented — `-10`, `-11`,
`-17`, `-18` — of which wave 2 builds three. Twelve uncorroborated citations, all in slice 5-8
files. And two generator defects measured but unrepaired, both task 13's:
`notifications.json` blends two registers and silently drops 25 rows, and
`SOURCE_CLASSIFICATIONS` claims to be the frozen-source vocabulary while omitting a label used
on 391 lines and spelling one that occurs zero times.

### Thirty-one brief errors in one wave, and the three that would have shipped

Every one was the controller's and every one was found by an agent opening the line. Three would
have changed behaviour: the **L99258 truncation** that stops mid-sentence and would have rendered
Matrix B as 110 refusals instead of licensing its eight conditional grants; the **fourteen-state
command vocabulary**, where L50792 says fifteen and `AC-27.3-02` requires the two that every
fourteen-item statement folds to be held distinct — and the repo already shipped fifteen; and a
**matrix span short by one data row**, where the missing row is the one that makes "three of five
columns" false.

The shapes repeat: a count inferred from a span, a paraphrase presented as a quotation, the wrong
subject behind a right-looking identifier, and a claim contradicting its own evidence. Assume
every count in a brief is a hypothesis.
### The three findings worth carrying forward

**A defect only `pnpm build` could see, in six of seven panels.** `WriteControl`'s enabled branch
renders `<Button onClick={onAct}>`, so a server component rendering an `allow(...)` decision hands
a function across the client boundary. Every one of the six was green on its own unit and
component suites — a component suite mounts the component, and the boundary exists only in a
build. **The build stops at the first failing route**, so they were found by counting the shape
across all seven rather than by rebuilding six times.

**Marking the shared control instead turns one broken route into seven**, because all seven panels
pass `onAct` and those passes are server-to-server only while the control is a server component.
The boundary belongs at the caller that needs interactivity — which three Hub screens and the
fallback disclosure had each already worked out alone. **A trap solved one caller at a time is a
trap nobody has named.**

**Five tasks independently wrote a gate forbidding `'use client'` and all five were wrong.** The
defect they meant to catch is a client module **exporting plain data** a server component reads,
whose strings return `undefined` at prerender. Rewritten to check what a client file *exports*,
the gate immediately caught a real one. **A gate that forbids a mechanism rather than a misuse of
it will eventually forbid the fix.**

**A component reachable from nothing is not shipped.** `SecondTreatmentDisclosure.tsx` — §36.6's
`MOD-CC-10` treatment carrying all four divergences, the best disclosure slice 8 produced — was
imported by no page and no component test from slice 8 until slice 9's wave 2. `cc-02`'s absence
from any route was **declared** in `CC_SEAMS`; this one's was not. **A stated abstention and an
oversight look identical from outside**, which is why the abstention has to be stated. Every task
now reports its own reachability from `app/`.

### Forty-three controller brief errors, and the four shapes they take

Every one was found by an agent opening the line. They are recorded in the slice-8 and slice-9
common briefs with the line each was checked against.

1. **Counts inferred from spans.** Five module card spans ended on a blank line, taken from a table
   of starts rather than by reading to each section's close.
2. **Paraphrases presented as quotations.** The costliest dropped a third of a sentence — "both
   device timestamps" for "Both device timestamps **and server receipt**" — and a model built to it
   renders two of three **and passes any check written from the same sentence.**
3. **Wrong subject, right-looking identifier.** `DEC-CCFORM-001` was named as governing report
   delivery; it is browser support and viewport. **`CCFORM` is form factor, not report format.**
4. **Claims that contradicted their own evidence.** One sentence said "three different statuses"
   above a list of two. One correction of a span error **committed the same span error**.

**Three times a controller check nearly overturned a correct agent finding by truncating a line.**
The rule is not "usually read the whole line".

### Where the source contradicts itself, at slice 9's scale

**Six tables answer the same permission question** — §21.1.2, §21.16, §25.4, §26.7, `MTX-TEN-02c`
(chapter 17), and the module-to-actor concentration table, which answers **by omitting the Tenant
Admin entirely**. The brief said four and said no decision identifier existed; **`DEC-TACC-001`
exists**, with a card at L23069 and a register row saying eleven module cells depend on it. Three
tasks found that table independently.

**The source states a count beside an enumeration that contradicts it, four times**: L48368 says
three prohibitions and lists four; `MOD-CC-13`'s matrix states four absolute exclusions and carries
none; L81763 says "the four sync items" of a range of five; L85155 calls an eleven-column table
"the nine-column coordination table". **When the source states a count next to an enumeration,
count the enumeration.**

**And one contradiction has a mechanism, which is worth more than the contradiction.**
`FEAT-CC-0603` names three different things because §25's inventory allocates exactly three
features per module (thirty-nine for thirteen) while §21.9 specifies five for one of them — so its
names run one identifier ahead and two features get no row at all.

## 9. The closing obligation

After slice 13: audit the build for gaps, fix and re-test; then audit against the frozen
blueprint verified against the code; repeat until nothing remains. Only then report
*"nothing is remaining, ready to give a demo to the client"* — and that claim requires a
clean fresh `pnpm verify` on the exact reviewed bytes, not a recollection of one.
