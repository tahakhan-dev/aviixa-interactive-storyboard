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

Seventeen entries, APP-000 to APP-016. The count in this sentence has been wrong once
already — it read "fourteen" while the ledger held seventeen — so read the ledger rather than
this line if the two disagree. The five that govern behaviour now:

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

- **APP-015** — **slice 11 to full closure, then a repeating slice-11 audit loop, then STOP.** The
  client volunteered this after being shown the wave-3 position. Run waves 3, 4 and 5 without stopping
  between them; on closing wave 5, audit slice 11 against the frozen source **and** against the code
  rather than treating a green chain as the audit; fix what the audit finds; re-verify on the corrected
  bytes; repeat until a round finds nothing. Then the amendment in the same turn — *"after completing
  the slice 11 then you will stop"* — **reinstates a stop at slice 11's close.** APP-013's
  no-inter-slice-stop does not carry this run into slice 12; entering slice 12 needs a new
  approval-ledger entry. **That entry now exists — APP-016 — so this bullet is history rather
than a live constraint.**

- **APP-016** — **the owed slice-11 audit loop, then slices 12 and 13 and the closing
  obligation, with no inter-slice stops.** The client re-issued the master prompt, was shown
  the measured position, and released APP-015's stop. It did NOT release APP-015's audit
  obligation: no audit commit existed after wave 5 and no slice-11 verification record was
  written, so the loop is carried forward as APP-016 item 1. Slice 11 is **not** closed.

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

**Slice 10 is closed and verified.** `pnpm verify` ran the whole chain to completion on frozen
bytes and exited 0. The candidate is commit `4072d33`, tree `c934f45`, clean before and after.
Measured on that candidate, every figure from that run rather than recollection: typecheck and
lint clean · gate-ordering 24/24 · freshness 2 · **unit 5139** · **component 2600** · **build
100/100 static pages** · **release 767** · **e2e/axe 535 in 7.7m**. The record is
`docs/process/2026-08-23-slice-10-verification.md`.

**Slice 11 wave 0 is closed and verified.** Nine commits, chain exit 0 on a clean tree: typecheck
and lint clean · unit **5346** · component **2622** · build **100/100 static pages** · release 767 ·
e2e/axe 535. The five mechanisms measured absent at session entry now exist — the sixteen-mode
machine, the six provenance classes, the thirteen abilities with their twelve prohibitions, the
sixty-failure catalogue with its 21-item spine, and the twelve-state request machine — over the
roster, canon and collision-aware fallback registry task 6 built first and alone.

**Four wave-0 findings that outlast the code.**

`AIMODE-13` and `AIMODE-14` are **byte-identical across all five contract columns** — same worker
label, same invocation, same deterministic safety, same escalation, same classification. `AC-42-303`
requires a paused platform to be distinguishable from an unreachable one on every surface that shows
a state, so for that pair the distinction rests entirely on the identifier or the name. `AIMODE-03`
/`-15` and `AIMODE-01`/`-16` collide the same way: sixteen modes, thirteen distinct labels. **Every
renderer in waves 1-3 inherits this.**

**The absolute rule is a sentence, at L89439**, not the column inference both briefs cited: cached
approved guidance and deterministic rules are "never, on any surface, in any locale, under any
failure condition, labelled or described as live artificial intelligence."

**The prohibition diagram is short by four, not three.** Eight refusal edges for twelve rows; #12 is
drawn as three dotted `does not alter` non-effects, and a non-effect is not a refusal. Counted by the
agent rather than taken from the plan, and the shortfall is derived rather than transcribed.

**Of seven uncanonised decisions, NONE is now a missing identifier.** This paragraph named
`DEC-AIEMBED-001` and `DEC-AIFALLBACK-001` as appearing nowhere in the build and called them the
only two real gaps. Both ship — `src/ai/failures/catalogue.ts:495,504` and
`src/studio/ai-degradation.ts:47,162,201`, first landed in `53b1c97` — and the stale sentence stood
here while the work was done. **Removed rather than renumbered.** The five others are disclosed
locally in the slice-8 pattern — `DEC-STORE-001` in seventeen files, `DEC-WIPE-001` in eighteen — which is the open
consolidation question, not a hole.

**Two gates were caught not firing, both by planting rather than by reading.** Task 1's
no-seeded-timing gate matched field names and a **defaulted parameter** walked past it; rewritten to
assert the module holds no numeral but zero, it caught both plants. Task 3 caught its own plant being
defective — it used a field the type does not have, went green, and was re-planted as a real
reconciliation of diagram to table. **Nine controller brief locators were wrong and every one was
found by an agent opening the line**; the costliest claimed the Studio column reads uniformly across
twelve rows, which would have forced a gate to assert the wrong reason onto row one.

**Slice 11's re-plan scope note is stale in a way that changes the work.**
The re-plan calls wave 2 "modules (5)" and says `app/command-center` and `app/frontline` hold one
`page.tsx` each with no module routes. Measured on this tree: slice 9 shipped all thirteen Command
Center module routes including `cc-05` through `cc-08`, and slice 7 shipped `MOD-FL-B8`. **Slice 11
is an overlay slice.** What is genuinely absent is the five AI mechanisms — `grep -rl` over `src`
and `app` returns nothing for `AIMODE`, nothing for `FAIL-AI`, nothing for `PROV-1`.

Wave 2 put `MOD-DOH-10` on `/hub/notifications` and `MOD-DOH-11` on
`/hub/audit-and-retention`, `MOD-DOH-18` as a routeless component, and the two uncatalogued
scheduler screens on `/super-admin/`. **Two of the four unrepresented Hub modules are now
represented, not three** — `MOD-DOH-17` and `MOD-DOH-18` remain `not-represented`, and
`MOD-DOH-18` has a directory on disk without a route, so its register row must move when it gets
one. A gate now makes that automatic rather than a review item.

### Wave 2: three defects, and two of them only one gate each could see

**Two screens implied a tablet applied a clearance.** L78386 forbids it absolutely and the
dictionary's second row is the exact case (L78401). Neither the unit nor the component suites
can see it, because the violation is in emitted text — `offline-phrasing` reads the export. The
two runs needed different answers: one was the build's own audit narrative and got the compliant
record-then-device form; the other was the Chapter 30C.2 register's own **name for a
notification type** (L72989), which this build may not rewrite, so it renders as a marked
quotation. **Never add a run to `DISCLOSURES` to turn that gate green** — the list is for text
describing the prohibition.

**Two scheduler routes offered no viewer control.** Found only by `pnpm test:e2e`, and nearly
missed by the controller: `pnpm test:e2e | tail -3` printed "532 passed" as its last line while
the command exited 1. **A summary line is not a result; read the exit code.** The same lesson as
the freshness gate stopping the chain at step four with every count above it green.

**A stale hardcoded count, twice more.** `slice-09-gates` asserted four build-wide
not-represented modules; wave 2 made it two. Removed rather than renumbered, per the rule this
slice already produced twice. **The `toHaveLength(81)` this paragraph used to call outstanding is
a property test now** — `tests/coverage/slice-09-gates.test.ts:1582` — and the claim was still
standing here while the fix was recorded forty lines below it. Two live statements of one item,
contradicting each other in one file, is the defect this section keeps naming.

### Four controller prescriptions that did not survive an agent opening the file

These are worth more than the locator errors, because each would have shipped.

1. **"Centrally evidentiary actions fail closed"** — that phrase occurs **zero** times in the
   frozen source. It is the master prompt's vocabulary, passed into a brief as though it were the
   blueprint's, which is exactly the boundary the prompt's own §2 draws. The source names seven
   halt classes and **safety is the opposite of fail-closed**: `AC-30D-1403` (L74918) reads
   "Deterministic safety mechanisms are unaffected by an audit outage."
2. **"Give each module a `DohModuleId` member and a `DOH_MODULES` row."** The reach map is
   generated and typed over the generated file, so widening the union without regenerating fails
   `tsc` — and regenerating threw, because `doh-10` exports two matrices and the second is keyed
   on policy level, not role. Unfixed, the reader would have read a policy level as a role. The
   agent proved it by running the generator rather than reading it.
3. **"`SaConsoleShell` renders the viewer control as chrome and has a non-module mode for a route
   no module claims."** It renders none in either mode, and its non-module branch is the console
   home, which drops `children`. `HubShell` has the third mode that reasoning belongs to; this
   shell does not.
4. **"The membership gate is the one place the canon count lives."** Wrong by five places,
   including a `toHaveLength(43)` inside the very class §8 recorded as consolidated.

**And a locator that contained the phrase but was not its subject:** L5998 carries "Clearance
granted" as a storyboard *step label*, not the register name. Pinning a disclosure to it reds the
gate that checks each disclosure quotes words verbatim at the line it names — the error was
proved mechanically rather than argued.

### Carried forward, owned by no current task

- **The occurrence outcome has two source vocabularies with no cross-reference** — 15
  lifecycle-diagram nodes, the set wave 0 shipped, against 12 inline at L102559, only four names
  common. Read strictly, `AC-SCHED-372` excludes the shipped set. Both render, neither preferred.
- The screenshot manifest, **85 rows and 85 PNGs against a 102-route export — a gap of 17**,
  measured this session with `exportedRoutes()`'s own walk. "100" was itself a renumbering of "96"
  in `0de7950`, whose commit message claims the figure was removed rather than renumbered; it was
  renumbered, and 100 is now wrong too. The artefact is older than three slices: `git log -1 --
  docs/screenshots/manifest.json` is `8ed171b`, 2026-08-22, slice-08 wave 4. The missing routes are
  real screens — eleven Command Center module routes, `/hub/notifications`,
  `/hub/audit-and-retention`, three `/super-admin/` scheduler and AI-incident routes, and
  `/workflows/ai-and-its-absence`. Re-measured on the slice-10
  candidate. Controller-owned, because `pnpm screenshots` writes committed files.

**Two entries that stood here were already fixed, and this list was stale about both.** The
`toHaveLength(81)` in `tests/coverage/slice-09-gates.test.ts` is a property test now (line 1582),
and the `SaConsoleShell` claim in `tests/accessibility/axe-states.spec.ts` was corrected (line 405).
Both were checked individually against the candidate rather than trusted. **Removed rather than
renumbered** — a resume brief stale about its own outstanding list is the same defect class as a
stale count on a screen.
- **The two generator defects recorded here for task 13 are BOTH REPAIRED**, and this list carried
  them as outstanding for a third time. Measured 2026-08-24 by an independent agent, twice:
  `notifications.json` now keys on `(register, identifier)` — 50 rows carry the `@L<line>` composite
  key and 205 + 25 + 56 = 286 reconciles arithmetically, and the generator throws if the 25+87 split
  breaks. `SOURCE_CLASSIFICATIONS` (`src/registry/schemas.ts:36-46`) now holds all eight labels; the
  omitted one was `User-Mandated Product Extension` (391 source lines) and the invented spelling was
  `Recommendation — Research and Development` (zero), and the real defect was three-part rather than
  two — it also omitted `Recommendation — R&D`, which occurs on 957 lines. Gated three ways at
  `tests/unit/registry-build.test.ts:597-617`, including a set-equality against
  `SOURCE_CLASSIFICATION_TO_SOURCE_CLASS` so the two cannot drift. **Removed rather than renumbered.**

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

Screenshot manifest stale — **85 rows against a 102-route export**, recorded once above rather than
twice here; this line said 100 and the line before it said 96, which is the two-live-statements shape
this file keeps naming. Not the 96 this paragraph used
to say; `pnpm screenshots` writes committed files, so it is the controller's. `CcFallbackLibrary`
reachable from zero pages, a declared abstention with the wiring unbuilt, gate-held at
`tests/unit/cc-01.test.ts:638`. **Two** `MOD-DOH-*` unrepresented, not four — `-17` and `-18`, and
they are precisely the two wave 2 did not build. Twelve uncorroborated citations — the count and the ceiling line are exact, but **NOT all in slice 5-8
files, ceiling still `toBeLessThanOrEqual(20)` at `tests/coverage/citation-graph.test.ts:306`. **The
two generator defects this paragraph also carried are repaired — see the corrected entry above.**

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

### Slice 11 pre-verification — three agents, nineteen locator errors, before a line was written

Every locator cluster in the slice-11 re-plan was opened by an independent agent before the common
brief was written. **Every row count in the re-plan is correct.** Almost every line number is not,
and the errors have one direction.

**The systematic shape: nine of eleven single-row locators are short by one or two lines and name
the row above the intended one**, and all six module-card end lines land on a blank line or a `---`
rule past the last content line. An off-by-one locator still looks right, because the row above a
permission row is usually another permission row — which is how a paraphrase of the wrong cell
survives review. Corrected card content-ends: **37822 · 37467 · 37247 · 37630 · 41596 · 44696**.

**Five findings that change what gets built.**

1. **`AC-43-403` is a wrong-chapter citation.** The provenance fail-closed rule — a `PROV-1` element
   that cannot produce an agent run identifier renders `PROV-6` — is **`AC-42-403` at L89480**. The
   real `AC-43-403` (L91373) is about model quarantine and provider failover being beyond §8.7.1.
   A 42/43 identifier collision, and the highest-risk locator in the slice.
2. **`MOD-SA-07` appears nowhere in chapter 43.** Its 711-line card was swept: three tables, no role
   axis anywhere, one permission token in the whole span and that one in prose. The 15-row matrix at
   L91284-L91298 is captioned "Authority matrix for the console's failure-response controls" and its
   axis is `Control`. **The module attribution is a build inference and renders as one.**
3. **`FB-AI-01` carries four meanings, not two** — boundary violation (L88916), storyboard 1
   (L92793), AI-degraded-or-paused (L46951), trace-store unavailability (L74495) — and the fourth
   collides with `FB-AI-12`'s own definition (L88927). Storyboard 44A.12's card then claims
   `FB-AI-12` itself (L93730). **The collision is not confined to the FB-AI-01…16 range.**
4. **The worker-surface pause state is a blocker, not a trap.** §40.15 (L87854) rules the Frontline
   surface shows nothing at all about the pause; §42.3 requires the chip to read "Live coaching
   paused by the platform", corroborated three ways (L89289, L89348, L89368/L89369). **Both marked
   `Derived Clarification`; neither outranks the other on provenance.** Disclose both, obey neither.
5. **Four prohibitions lack a refusal edge, not three.** The re-plan names #3, #10 and #11 and misses
   **#12, broaden permissions through failover**, modelled at L87985-L87987 as three dotted
   `does not alter` non-effects rather than a refusal. The diagram is L87965-**L87988**; L87990 is
   the caption, outside the fence.

**And one alias pair the repo already half-shipped.** `DEC-GATE-001`'s third governance value is
spelled `none — reasoning agent` on **21** lines and `no governance gate` on **4**. The repo's
`GovernanceBinding` union member is the 4-occurrence spelling
(`src/studio/modules/stu-02/agents.ts:88`). Both are real source literals for one value, so it is an
alias pair on the slice-10 pattern — not a correction. The re-plan cites the adoption at L89448,
which is a **Mermaid edge**; the adoption is at L9678, L21514, L21616, L22650, L22721, L25280, and
the card is at L37041.

**A process note on the graph.** `graphify query` returned `loc=L48386` for `MOD-CC-05`, `MOD-CC-06`
*and* `MOD-CC-08` — three modules sharing one wrong line. It was discarded as evidence and every
figure above came from the document, which is §2a's rule doing exactly what it exists to do.

### Slice 11 waves 1 and 2 — closed, and three findings that outrank the code

**Wave 1** (agent contracts, deterministic boundary) and **wave 2** (five module overlays) are
closed, reviewed and green: typecheck and lint clean · unit **5587** · component **2712** · build
**100/100** · release **770** · e2e/axe **535**, chain exit 0.

**THE CITATION GATE WAS A NEIGHBOUR-DETECTOR AND ITS OWN COMMENT SAID OTHERWISE.** `locator-fidelity`
convicted a wrong citation only when the wrong line happened to carry a SIBLING identifier.
`SB-AI-011 (L87376)` changed to `(L99999)` left the release suite 91/91 green. The index could always
have proved it wrong — it maps 19,897 identifiers to every line each occurs on, `windowLines: 0`.
The strict check now ships, and the discipline around it matters more than the fix: **177 citations
across 64 files would newly convict**, seven times the stop threshold, so nothing was mass-edited.
The population is three different things and one of them is **documented as correct** — §2a's own
worked examples `MOD-STU-07@32637` and `OBJ-036@8598` are in the 177. Convicting the list would have
corrected accurate citations into inaccurate ones. `STRICT_ANCHOR_ALLOWANCE` is a literal list keyed
on the claim, printed by name every run, and no allowance may go stale. **130 claims now stand in
front of a reviewer instead of being invisible.** The erosion baseline was not raised.

**`AC-42-303` CANNOT BE SATISFIED FROM THE MODE MATRIX FOR ONE PAIR.** `AIMODE-13` and `AIMODE-14`
are byte-identical across all five contract columns. What separates a tenant pause from a platform
pause is `FAIL-AI-41`/`-42`'s user-visible-message cells, and `MOD-CC-08` **computes** that rather
than asserting it — the screen prints "no column at all" from a measurement.

**NEITHER SIDE OF THE WORKER-FEEDBACK QUESTION IS A STATEMENT OF WORK FACT**, and both this brief and
a review said otherwise. **L86398 carries two markings in one sentence**: "always optional and one
tap, never required, never gating" is `[SoW Fact — §6.8.2]`; "the worker-facing surface carries no
feedback control at all" is `Derived Clarification`. **The SoW half presupposes a control and
constrains it; only the derived half abolishes it.** 44A.12's flag is a `User-Mandated Product
Extension`. `MOD-FL-B8` demonstrates reading one and discloses five readings on both surfaces, with
its reason given as an asymmetry in DECIDEDNESS rather than as evidence reading one is right.

### Measured absences worth keeping

`MOD-SA-07` appears nowhere in chapter 43 — twelve `MOD-*` tokens in the whole chapter, all
`MOD-FL-*`. `MOD-CC-07` occurs **zero** times in L85974-L95408. **`APP-012` occurs zero times in the
frozen source** — it is an approval-ledger entry, legitimate as a build label and never citable with
a line number. `DEC-AIPAUSE-001` is not in the chapter-41 register at all; `DEC-KILL-001` is L88905
and `DEC-PAUSE-001` L88906, not the L88903-L88904 this brief gave.

### Gate limits found by planting, all live

`provenanceViolations` catches nested provenance classes but **not two sibling marks in one region**.
`locator-fidelity`'s strict check grades identifier-anchored citations only. A kill-switch row can
defer in its **classification** while granting in every cell, so a check reading only cells ships it
as settled — that is why four rows of §43.3.5 are undecided, not three.

### Two controller process defects, recorded rather than tidied

**A quiet window is not a finished agent.** Wave 2 was committed believing all five agents had
finished; four had, and a two-minute file-stability probe sampled a pause in the fifth's work. The
commit was internally consistent when verified and did not compile twenty minutes later. RESUME §6a
records this shape four times for dispatched agents and twice now for the controller. The rule's
third clause: wait for the report, or for a clean typecheck that is **still** clean a minute later.

**Parallel heavyweight suites interfere.** A concurrent `pnpm build` (`rm -rf out`) wiped `out/`
mid-verification for another agent, and a killed gate run left an orphaned `.zz-probe-` directory in
the export that failed the next chain inside `cp` rather than inside any assertion. Two agents hit
that independently. **Wave 3 runs at most three agents, with the build step serialised.**

### Wave 3 task 15 — closed, and the tenant-versus-platform pause has a measured basis

**Candidate `fecaa39`.** The five-surface AI-degradation overlays, and the orphan wave 0 left behind.

**`AC-42-303` IS A PAUSE-VERSUS-OUTAGE RULE AND THE SOURCE NAMES IT SO.** `TEST-42-302` at **L89409**
is called "**Pause-versus-outage test**". Two briefs and one module had restated the criterion as
distinguishing the two pause *scopes* from each other; it distinguishes `AIMODE-13`/`-14` from
`AIMODE-03`/`-05`, at **L89402**, its only occurrence. **[cited-in-error: L89412], cited as a range endpoint, is blank** — and this sentence needs the
marker for the same reason the paragraph below it does.

**And the tenant-versus-platform distinction has a basis that is measured rather than asserted.**
`FAIL-AI-41` and `FAIL-AI-42`'s **Frontline** message cells are byte-identical while their
**tenant-web** cells differ, at **L90513** and **L90514**. So the Command Center can tell a tenant
pause from a platform pause and **the device cannot** — which is why `MOD-CC-08` computes that
distinction instead of asserting it, and why the join's scope-disagreement throw should lean here
rather than on `AC-42-303`.

**Two of the five surfaces have no source table at all.** Studio (12 rows, L90989, `Capability` axis,
zero `MOD-STU-` tokens), Command Center (13 rows, L91080, module by NAME, zero `MOD-CC` tokens) and
Frontline (12 rows, L91179, the only one with real module identifiers) are transcribed. **The Hub and
the Super Admin console are derived**: §43.3.1's only table is by failure family (L90905) and §43.3.5's
is `Control` by role (L91282), with zero `MOD-SA` tokens in L91214-L91282.

**The Hub's informal module list holds EIGHT items, not nine, and the source states no number.**
L90861's appositive: worker lifecycle · job lifecycle and approval · run scheduling · assignment ·
execution summary review · permissions · notifications · audit and retention → `MOD-DOH-04` through
`-11`, contiguous in registry order. "Nine" was a brief's, not the source's. **Whether "Every Hub
module" is universal or enumerative cannot be established**; both readings render and the build sits on
the enumerative one, because a build may not upgrade its own inference into a source fact.

**Four more brief locator errors, every one found by an agent opening the line:** spine item 13 is
**L89938** (L89934 is item 9, Human fallback) · `AC-43-356` is **L91309** (L91306 is `AC-43-353`) · the
common brief's queued-matrix rows were **+1** (measured L89697-L89708; the task brief had it right) ·
`SB-42-301`'s title in the brief was a paraphrase — L89348 reads "the same mode, five surfaces, one
vocabulary".

**A route-level mounting rule, learned the hard way.** Mounting the overlays inside the module screens
turned **six shipped suites red on the overlay's mere existence** — `getByRole('table')` and
`getByText(/named access class/i)` became ambiguous and row-enumerating assertions absorbed the new
rows. Those suites assert each module's own contract and are not an overlay task's to edit. **Overlays
mount at route level.** For the same reason **no step was added to either journey register**: four
shipped tests pin the populations by step number, and an AI-degradation behaviour is a property of a
step rather than another step.

**A rule collision disclosed rather than resolved.** `AC-43-356`'s verbatim tail uses one of the four
words the support-not-surveillance rule forbids in Super Admin copy, in an unrelated sense. The
criterion's substance renders and the clause is withheld with the reason on screen, rather than
paraphrasing a criterion or dropping it. Neither rule weakened.

**How a proven-share ratchet was satisfied honestly.** `locator-fidelity` grades a citation strong only
when a **double-quoted** verbatim excerpt sits beside it, and this task's 252 locators used single
quotes, so all 252 graded weak. Raising the baseline is forbidden and padding the metric is worse;
**57 verbatim quotations were extracted programmatically from the frozen bytes**, each placed beside its
own line, every one machine-checked.

### Wave 3 task 14 — closed and verified on this tree

**Candidate `df749c9`** (controller repairs at `0de7950` immediately before it). Verified by the
controller rather than taken from the report: **typecheck 0 · lint 0 · unit 5673 in 168 files ·
component 2749 in 100 files.** Both counts matched the implementer's figures exactly, which is the
first time in this slice that all reported numbers survived checking unchanged.

**Every locator in the task-14 brief held, and the six the controller had corrected were correct
corrections** — each rejected line was independently confirmed to carry different content:
[cited-in-error: L87796] is blank; L90040 is `AC-43-113`; L90045 is `TEST-43-112`; L91288 is the
platform-wide pause row. The first of those needs the `[cited-in-error:]` marker because
`locator-fidelity` lexes any `L`-number in a file as a citation and refuses one landing on a blank
line — this paragraph tripped its own gate while recording the defect it names.

**Three findings the brief did not carry, all from the implementer opening lines:**

- **`DEC-AIRTO-001` is a fourth non-canon decision**, not merely a trap. It is as absent from
  `OPEN_DECISION_IDS` as `DEC-AIPAUSE-001`, `DEC-KILL-001` and `DEC-PAUSE-001`. All four disclose
  locally in the slice-8 pattern; **wave 5 owns the consolidation, and it is now four, not three.**
- **L87833 carries no bare `PAUSE -->` edge** — it declares the root node inline. A matcher written
  from "sixteen `PAUSE -->` edges" is green on fifteen lines and red on the first.
- The graph returned `DEC-KILL-001 loc=L86247`, wrong by about 1,550 lines. Not cited. §2a's rule
  again doing exactly what it exists for.

**And one shape worth carrying past this slice: an ambiguous module ownership throw from the registry
builder.** An earlier unit run printed "5531 passed" as its last line **while exiting 1** — the fifth
recorded instance of a summary line contradicting an exit code in this build. The cause was two route
files each naming one module once, which the builder reads as an ownership claim. The route is owned by
no module; the identifier now renders from a `PAUSE_FEATURE_ATTRIBUTION` record instead of a literal,
held there by a gate.

**`FEAT-SA-0702` names two different features on two lines** — the global severity catalog at L47802
and "emergency pause proposal" in the Platform Engineer's role card at L15945. Both owners render as an
alias pair on the slice-10 pattern and **no gate asserts a single meaning for it.**

### Wave 3 pre-verification — three verifiers, and one finding outranks the wave

**FIVE COMMITTED MODULES ARE REACHABLE FROM NOTHING, AND NONE OF THEM STATES AN ABSTENTION.** Measured
2026-08-24 by transitive closure from the files under `app/`. **Re-measured at the slice-11 audit: 612 files in `src`+`app`, 579 reachable, 33 orphaned.** The figures below are the earlier run and are kept only as its record — 583 files in `src`+`app`, 543
reachable, 40 orphaned. Of the orphans, five are slice 11's own:

- `src/ai/requests/{machine,states,surface-matrix}.ts` — **758 lines, 29 exports, zero importers
  outside the cluster.** The whole queued-request mechanism: twelve states and the 12x5
  state-to-surface matrix, wave 0 task 5, committed in `37f3ca7`. `states.ts`'s only importers are
  the other two orphans, so it is a closed island.
- `src/surfaces/sa/ai-failure-authority.ts` (496 lines, 19 exports) imported only by
  `src/ui/sa/AiFailureAuthorityPanel.tsx` (261 lines), which nothing imports. Wave 2 task 9 shipped a
  data module **and** its panel, both unreachable.

`src/ai/agents/contracts.ts:420-434` stated its own seam — *"if task 10 does not import these modules,
this object graph ships unreachable"* — and task 10 rescued it. **The five above state nothing**, which
is exactly the shape §7 names: a stated abstention and an oversight look identical from outside. Wave 3
task 14 mounts the panel; **the requests cluster is assigned to wave 3 task 15**, because the 12x5
state-to-surface matrix IS a five-surface overlay and task 19 is too late for it.

**Two mutually-unaware five-surface vocabularies, and one of them claims a binding it does not have.**
`JourneySurfaceCode` in `src/ui/shared/journey.ts` is `'DOH'|'STU'|'CC'|'FL'|'SA'`;
`QueuedRequestSurfaceId` at `src/ai/requests/surface-matrix.ts:70` is
`'frontline'|'command-center'|'hub'|'studio'|'super-admin'`. Both are independently
exhaustiveness-checked. `surface-matrix.ts:53-61` says its column axis "is bound to `SurfaceId` the way
`@/ui/shared/journey`'s `JOURNEY_SURFACES` binds its own five-surface column axis" — **there is no join
between them.** Whoever widens `JourneyStep` resolves this rather than shipping a third copy.

**`JourneyStep` cannot carry slice 11 as it stands.** `src/ui/shared/journey.ts:90` has fields for
number, title, workflow ref, source ref, owner module, acting surface, effects and note — and **no
field for an AI mode, a failure, a request state or a provenance class.** There is no single shared
fixture either: `app/hub/journey/effects.ts` holds 9 steps with **zero** AI mentions and
`src/studio/journey/effects.ts` holds 22, over one surface-neutral spine. Task 19 widens the spine.

**`AIMODE-*` (16 shipped), `FB-AI-*` (50), `DEC-AI*` (16) and `PROV-*` (6) are in NO generated
inventory at all** — 88 identifiers. The fourteen inventories are fixed by `REGISTRY_DESCRIPTORS`
(`src/coverage/descriptors.ts`) and `tests/coverage/slice-2c-gates.test.ts:657` asserts exactly 15
files against it, so adding a fifteenth means editing both. **Task 20 decides explicitly whether that
is the design or a gap** rather than leaving it unstated.

**Only `SB-AI-*` can move in the registries, and it currently reads 0 of 48.** `ai-storyboards.json`
holds 613 rows across four non-overlapping registers; the 48 `SB-AI-*` rows are all
`not-represented`, and six of them are named in `src/` but **none in an `app/` route screen**, which is
what the status computation requires. Commit `d4ea53a`'s message is true of `src/` and did not move the
status.

**Four of the fourteen registries compute a single status value for every row** — `commands` (0/17),
`events` (0/28), `offline-scenarios` (0/70), `sub-features` **(1/526 — `SUB-SA-0703`, named by task 19 at `app/workflows/ai-and-its-absence/scope.ts`; this line said 0 and the conclusion it drew from four zeros no longer holds as written)**. The first three are **true zeros, not
broken computations**: their identical `dedupRule` requires a shipped route screen under `app/` to name
the identifier as a whole token, and no route screen names a `CMD-*`, `EVT-*`, `UC-OFF-*` or `SUB-*`.

**The wrong number in `module-reach.json`'s `doNotEdit` is GONE, and this paragraph outlived it.**
`0de7950` replaced the count with "every module suite in tests/unit". The stale claim stood here while
§8 stated the corrected position 245 lines below it — two live statements of one item, contradicting
each other in one file, which is the defect this section keeps naming. What remains open is a
different thing and is recorded once, below: that `doNotEdit` names an enforcement mechanism no file
under `tests/unit` actually performs.

**The coverage page's prose count is GONE, and this paragraph outlived it.** `0de7950` removed the
pair; `app/coverage/[registry]/page.tsx` now says so in place of the numbers. Removed rather than
renumbered — which is what the entry above it asked for and then failed to apply to itself.

**`slice-06-gates.test.ts:1386`'s `toHaveLength(64)` is NOT a stale count.** It is the length of a
sha256 hex digest, re-asserted unchanged at line 1420. Three separate passes have nearly "fixed" it.

**The three removable hardcoded counts are ALL REMOVED**, in `0de7950`, each with the removal
recorded in a comment at the line that held it — `slice-09-gates.test.ts:1616` and `:666`,
`slice-2c-gates.test.ts:656`. No `toHaveLength(<digit>` survives in `slice-2c-gates` at all. This
paragraph carried them as owed for a third time; **removed rather than renumbered.**

**A new gate file is RED until it is declared.** `scripts/check-gate-ordering.mjs` holds an `AUDITED`
map whose entry count must equal the number of gate files on disk — **26 and 26 as measured
today**, not the 25 and 25 this line carried while §8 recorded "gate-ordering 26 of 26 audited" forty
lines away. A new entry needs `subject`, `rewrittenBy` and
`verdict`, and a gate whose text names `registries/generated` may not be filed `rewrittenBy: null`
(enforced at L421).

**Do not write a fourth private copy of the absence-sweep preamble.** `slice-07`, `slice-08` and
`slice-09` each re-implement the non-vacuity floor, the frozen-source pin and the
`as const satisfies` check, sharing only `../probe-paths`. Commit `018b390` shows the last of those
already caught a slice-11 defect — through slice-09's CC-scoped copy, which is why its author found it
and no gate did.

**Task 22 must be alone, literally.** `pnpm verify` runs `build`, which rewrites the **committed**
`registries/generated/**` and does `rm -rf out`. `test:release` runs 9 of 25 gate files that plant and
delete probes inside `src/`, `app/`, `out/` and `registries/generated/` on the real filesystem, with
`fileParallelism: false` because a probe's mid-lifetime existence crashed another gate's `readFileSync`
in a concurrent run (`vitest.config.ts:61-89`). `pnpm screenshots` rewrites the **committed**
`docs/screenshots/manifest.json`.

**Slice 11 is the weakest-evidence slice by citation ratio and every strong claim it makes is
correct.** 865 citations across the 55 files waves 0-2 added, 73 anchored, 99 strongly checked — 11.4%
against the tree-wide 19.6%. **Zero strict-anchor misses and zero new allowance entries.** The cause is
structural: these files write the identifier as a data field and the locator in a separate adjacent
field, so the six-character `CONNECTIVE` adjacency never fires. Worth knowing before anyone treats the
ratio as sloppiness.

### Waves 3 and 4 — closed, reviewed, fixed, green

**Candidate `f56a050`.** Measured by the controller on a quiet tree, every figure from that run:
typecheck 0 · lint 0 · gate-ordering **25 of 25 audited** · registry freshness 2 of 2 · unit **6096** in
177 files · component **2984** in 105 files.

Wave 3: task 14 (`df749c9`) + its fix round (`803b4ca`) + a second fix round (`d3a7b5c`); task 15
(`fecaa39`) + its fix round (`4461fe9`). Wave 4: the contract (`9f48855`) + its fix round (`b160d4c`);
storyboards 1-10 (`efe424a`), 11-20 (`910fdf0`), 21-30 (`1553c2d`). Two independent reviews, both
CHANGES REQUIRED, both closed. `REV-S11-W3-14` and `REV-S11-W3-ABC` in the review ledger.

### Eleven gates in this slice could not fail on the defect they named

Not one was found by a suite. Every one was found by a reviewer or a fix agent, and the catalogue is worth
more than the fixes:

- one **exempted the exact phrase** the prohibition was about, so a screen printing it in its own voice passed;
- **the same gate also could not fail for a second reason nobody looked for** — `document.body.textContent` concatenates siblings with no separator, so a planted paragraph arrived glued to a locator and a leading `\b` never matched;
- one **stripped every quoted string literal** before scanning for the literal it policed: 0 offenders with the strip, 12 without, and every rendered string in those modules is a quoted literal;
- one asserted `line !== ''` across twenty source locators, so a plant 5,000 lines off walked past;
- one gated a four-agent roster with `toBeGreaterThan(0)`, green on both a deletion and an addition;
- one scanned three directories for a resume timer and **excluded the one holding the pause**;
- one scanned a directory for a severity import and **could not see the panel that directory mounts**;
- one's spelled-out-duration list held `five` and not `four`;
- one was **satisfied by an identifier's presence in a file read as text**, so "both journey registers overlaid" was true in data and false on every screen;
- and a storyboard task found **three of its own** weak — an absent-surface check using `toContain` on a value true of any blank, an absence check asserting presence only, and one whose planted defect never landed so its green was a no-op rather than a pass.

**The shape underneath most of them: a gate scoped, stripped or exempted to exclude the defect it names.**
This build's rule — exempt the named false alarms, never the class of syntax — is what closed them.

### Four claims of structural impossibility that the types do not deliver

`src/ui/shared/journey.ts` claimed a required `reason: string` made an empty string *"structurally
impossible rather than merely discouraged"*. **Requiring a field is not requiring its content**, and
TypeScript has no non-empty-string type. The same claim was in `src/ai/five-surface/overlay.ts` twice and
in its component once. All four corrected in place, no type changed, and paid for with a tenth storyboard
invariant plus a gate over every string the five overlays render.

**Its authority is measured, not argued:** L92664 says the five-surface reaction *"states, for each
surface, what changes"*; all thirty source tables carry **150 reaction cells, zero blank**; and
`"No direct effect"` occurs **zero** times in L92596-L95408 — that phrase is this build's rendering of the
source's rule, which is why the reason is the half carrying source content.

**A second seam of the same shape is open and named:** `StoryboardCardContent` is a mapped type over
nineteen fields and admits `''` on any of them, checked today only on one fixture and inside each content
task's own test.

### A false absence is as bad as a false presence

The fix that made task 14's audit sentence honest overshot into *"there is no audit sink in this build"*.
**Its own gate's predicate hits 25 files tree-wide** — `src/studio/access/refusal.ts`, fifteen `stu-*`
modules, nine `app/studio` screens, one of them headed **"THE ONE AUDIT PATH"** and calling `writeAudit`
before it mutates. The gate meant to hold the sentence honest scanned exactly the two directories where the
contradiction does not live, and **that narrow scope is what allowed the false claim to stand.**

Now: the import closure of the incident route is **53 files with zero audit-write tokens**, so the narrowed
claim is checkable; the gate is tree-wide with 25 exemptions **named one at a time**; and a plant in the
directory where the old gate ran green convicts. Both halves of the sentence have a gate, so their scopes
cannot drift apart again.

### The registry's evidence class is narrower than "the build demonstrates it"

`ai-storyboards.json` read 76 demonstrated where a fresh generation yields 79 — the file reads **109**
today. **The "`SB-AI-*` still reads 0 of 48" this paragraph asserted is 30 of 48**, closed by task 19
(`0487046`) when the thirty cards were mounted on `/workflows/ai-and-its-absence/`. The rule the paragraph
states is still the right rule — a status needs a route screen naming the identifier as a whole token —
and the thirty now satisfy it. **Removed rather than renumbered.**

**The same rule has a second consequence, and it costs three earned rows.** Task 14 bound the pause to
`FEAT-SA-0703`, `SUB-SA-0703` and `FUNC-SA-0703` — real source identifiers at **L47803**, claimable rather
than derived. **All three now read `demonstrated-in-storyboard`** — task 19 closed this by having
`app/workflows/ai-and-its-absence/scope.ts` name them, so the paragraph's "all three read
`not-represented`" is history. The mechanism it describes is not: an attribution reached through a
constant is invisible to `build-registries`' source-text ownership heuristic, and that limit is real and
recorded once, below.

### One violation stands on purpose, and it must keep standing

Storyboard 25 reports `fixedMessageIsNotParaphrased`. **The Spanish rendering of `SCR-FL-LOCK-01`'s fixed
message does not exist anywhere in the frozen source** — measured independently by three agents, including
zero occurrences of `Operación`/`suspendida` and exactly one `ó` in 18MB. `TEST-44A-004` (L92757) requires
both locales. The only way to silence the violation is to omit the fixed message, and that would silence
the one paraphrase prohibition the source states here (L94876). So it is declared by identifier, asserted
exactly, and a tenth still goes red. **Nine cards report none. Do not "fix" the tenth.**

Related and separate: `DEC-MSG-001` at **L5263** records that this message is worded differently in two
Parts — Reading A at L5265, Reading B at L5266 — so a card supplying Reading B, a real source string, was
being reported as a paraphrase. Both readings now carry their locators.

### Locator errors this pair of waves, and every one found by an agent opening the line

Eighteen controller brief errors across waves 3 and 4. The shapes repeat, and two are new:

- **Storyboard locators off by 24 to 75 lines**, each landing on real, plausible content — `AC-43-113` where a storyboard was claimed. A locator that "looks consistent" is not verified.
- **Every section-span end line in chapter 44A is blank**, the separator before the next heading, with the content end one earlier. Confirmed independently across all three ten-storyboard ranges.
- `AC-42-303` cited as a range whose endpoint [cited-in-error: L89412] is blank, and paraphrased into a rule it does not state, in four doc sites and two user-visible throw messages.
- `AC-43-356` is L91309; L91306 is `AC-43-353`. Spine item 13 is L89938; L89934 is item 9. The head's own sentence is L92648, its reading list L92660-L92669, its deterministic rule L92650. The glance rows for storyboards 29 and 30 are L92721 and L92722.
- **Two identifiers the controller called absent from the canon are members of it** — `DEC-ROLE-001` and `DEC-COACHREPLAY-001`.
- The Hub's informal module list is **eight**, and the source states no number.
- The 44A test figure is 46 for storyboards 1-10, not the 43 a measuring agent's own summary line gave — its per-section table was right and its arithmetic over it was wrong.

### A stated count that resolves rather than standing

Storyboard 9's prose says "Fifteen distinct states" twice while its own diagram declares fourteen. **The
missing one is `failed`**: L50792 says fifteen, `AC-27.3-02` requires the two that a fourteen-item
statement folds to be held distinct, and this repo already ships fifteen. The source's count is right and
its own diagram is short by one. **Where the source states a count beside an enumeration, count the
enumeration — and then check whether a third statement settles it.**

### Carried into wave 5

- **Seven decision identifiers the thirty cards cite are not members of the exported `DecisionId` union**, `DEC-AIRTO-001` among them at 51 references in the chapter-44 span and the entire content of every card's recovery-objective row. Five have no canon record at all; two are aliases needing wiring. Each local record carries a `canonicalId` so wave 5 can wire rather than re-read, and the suites assert all seven **absent** from `OPEN_DECISION_IDS` so a lift turns them red and forces the switch.
- **Ninety-one identifiers slice 11 shipped are in no inventory at all** — `AIMODE-*` 16, `FB-AI-*` 50, `DEC-AI*` **19**, `PROV-*` 6. This bullet said eighty-eight and sixteen while `src/coverage/uninventoried.ts:33` said ninety-one and the correction stood thirty-one lines below it. **And the slice-11 audit found the closure itself is short by 85 more:** `FAIL-AI-*` 60, the abilities `AI-01…AI-13` 13, and `FB-AGT-*` 12 are in no inventory AND in none of the four declared families. Task 20 decides explicitly and records it; leaving them silently uncounted is the one forbidden outcome.
- **`PINNED_WORKER_MESSAGES` covers one screen** while five storyboards quote fixed worker strings the source does not rule unparaphrasable.
- **`contentOrigin` has no member for a storyboard that renders no guidance at all** — four cards took `'authored'` as least-wrong, each with per-card reasoning.
- **`notShippableLock` is named in prose as being in a token list it is not in**, and was deliberately not added: two files render it, so a token sweep would convict two legitimate readers. The question is open in the comment.
- `SA_MATRIX_ATTRIBUTION` renders "twelve Frontline ones" and no gate polices it. **The reason given here was wrong**: the tree's only spelled-numeral size gate is `SIZE_CLAIM` in `canon-size-literal.test.ts`, whose noun alternation is `(?:records|members)`, so "twelve modules" would have escaped it too. The string is unpoliced; the explanation of why was not. Task 14's shipped string, flagged rather than decided.
- **`locator-fidelity`'s blank-span check requires the WHOLE span to be blank**, so a blank range endpoint is not convicted. Two such citations were found by other means this slice.
- **`build-registries`' `MOD-*` ownership heuristic is a source-text scan**, so an attribution reached through a constant is invisible to it.
- **`provenanceViolations` does not convict two sibling marks under one guidance element** — found by planting, not by reading.

### Wave 5 — closed, and the gate limits it measured rather than papered over

**Candidate `0b937aa`.** Controller-measured: typecheck 0 · lint 0 · gate-ordering **26 of 26 audited** ·
freshness 2/2 · unit **6159** in 179 files · component **3017** in 107 · **release 837 in 26 files**.
Task 19 `0487046` · task 20 `16d785c` · the eight-gate fix round `1ca7a03` · task 21 `6010a59` · the four
convictions `a73b608` and `0b937aa`.

**THE FIRST FULL `test:release` AFTER WAVES 3-5 WAS RED IN SIX FILES — EIGHT FAILURES — AND THE CONTROLLER
HAD REPORTED THE BASE CLEAN ON HAVING RUN ONLY THE FRESHNESS GATE FROM THAT PROJECT.** Two of the eight
were the gates succeeding: `slice-10` gate 5 pinned `evaluateColumnAccess`'s callers as an exact
one-element array and task 14 legitimately reused the mechanism, and four `locator-fidelity` "anchored
misses" were **correct citations** into the `DEC-SYNC-001` record headed at L80067 — the form §2a documents
as correct and warns has nearly been "corrected" into wrongness five times.

**The proven share was restored by making citations checkable, never by moving the baseline.** 97
quotations extracted mechanically, verified twice by separate scripts, 69 anchored and 28 prefixed by
section number only — because a heading does not contain the literal and prefixing one would assert a
falsehood. Two headings yield no quote-free run and are **named** rather than dropped. 20.641% → 21.176%
against a 20.887% threshold, baseline untouched at 21.887%. **The margin is ~74 citations. The next wave of
weak citations re-opens it.**

### Registry closure: 91, not 88, and they belong in no inventory

`DEC-AI*` is **19** distinct tokens, not 16. AIMODE 16 · FB-AI 50 · PROV 6 · DEC-AI 19. The decision is
**option (a)** — `REGISTRY_DESCRIPTORS` stays at fourteen — rendered on the coverage dashboard with every
count derived at module load. Four measured reasons, and the strongest is that a flat inventory would be
**wrong rather than absent**: `FALLBACK_CONTRACT_OWNERS` holds 69 owner rows over 39 distinct literals,
sixteen with more than one owner, and the register's thirteenth row is a **range** standing for thirty
contracts. `AIMODE-04`'s absence from every screen **is** the requirement (L89261, its only occurrence), so
a `not-represented` row would be actively false.

**A FIFTH `FB-AI-` REGISTER, IN A SECOND ZERO-PADDING CONVENTION.** `src/fallbacks/contracts.ts` holds
`FB-AI-001`…`-010`, disjoint from the collision registry's `FB-AI-00`/`-01`…`-30`/`-101`…`-108`.
39 + 10 + 1 = 50 reconciles exactly. The collision is not four-way on one literal; it spans two padding
conventions in two mutually-unaware modules.

**Two of the controller's canon premises were wrong and the task checked rather than acted.** The two
"aliases needing wiring" were wired by wave 0. The four decisions called un-homed are members of **chapter
21's own sixteen-row register** in `src/surfaces/cc/decisions/register.ts` — registering them would put one
source register row in two typed unions. And **`DEC-HANDOFF-001` asks two different questions under one
identifier** (L61210 and L92360, with the index at L115416 attributing it to chapter 30 alone), so a record
on the bare identifier would answer §44.3 with chapter 30's question. **Five registrations are handed back
as atomic requests**, because `src/ai/controls/decisions.ts` throws at load on registration and instructs
the local record be deleted in the same change — verified by planting.

### Three gate limits, each measured rather than asserted

- **`prohibited-patterns` read each function body WITH its comments — CLOSED.** A note merely naming `isForeignProbe` made any walker "aware" while the real skip was stripped. Stripping convicts **exactly one** walker tree-wide, `static-export`'s, legitimately — the one scan whose subject *is* the probes every other scan hides — exempted **by name as an equality**, with a second case asserting the exempt file still reaches the orphan check, so the exemption retires itself.
- **`locator-fidelity`'s blank-span check — MEASURED, LEFT OPEN.** Convicting a blank *range endpoint* rather than only a wholly-blank span convicts **321 citations**, dominated by legitimate section spans whose end line is the separator before the next heading. Narrowing to spans under twenty lines still convicts 27, and **no threshold reaches zero**. Above any mass-edit threshold, so it stands with the number.
- **`provenanceViolations` sibling marks — THE FIX WAS WRITTEN AND OVERTURNED BY THE SUITE THAT CAUGHT IT.** A four-sibling-mark fixture went red, and **the fixture is right**: L89461 is headed *"Illustrative Example — one screen, four provenance classes at once"* and describes the contract **holding**, while `AC-42-401` (L89478) binds the guidance **element**, not the region. `data-guidance-element` cannot tell a leaf that must carry one class from a region that legitimately holds four. The contract module was restored byte-identically and **the limit is now a live expectation**, so the day someone closes it that case reds and sends them to the paragraph.
- **AND A FOURTH, FOUND BY PLANTING: an import edge is not a mount.** Removing a panel's JSX while leaving its import left the reachability gate **green at 54 of 54**, because it walks the import closure. Closed for that one file by a bytes assertion; the gate's shape is named, not silently patched.

### An abstention has to red when it stops being true, or it rots

**`ProvenanceMark`'s stated abstention outlived its own truth for three waves.** Its header read "Measured:
nothing under `app/` renders this component… whoever mounts the first one closes this paragraph". Waves 2, 3
and 4 mounted it; none came back. **A gate found it, not a reader.** This is the strongest evidence in the
build that the abstention pattern §7 relies on is only as good as something that reds — and the controller's
own replacement then wrote a count in the sentence saying no count is written, which a later mount made
stale within the hour.

`KNOWN_PARAPHRASE` and `KNOWN_UNREACHABLE` are the corrected shape: **equalities, not memberships**, so a
second offender reds instead of joining a widened exception **and** fixing the named one reds too. Both
retired themselves on the run after their findings were closed, and both are kept **empty with their
floors**, because the empty list is the assertion. `KNOWN_UNREACHABLE`'s companion case had been a
`for (const file of …)` loop — **vacuous, since an empty loop passes on anything** — and is now an
assertion that each formerly-orphaned file is reached *through the specific mount that closed it*.

### Task 21's own plant discipline, worth copying

Every plant was spliced into a real shipping file by a harness that required its anchor to occur **exactly
once**, refused an empty replacement, **treated a zero-test run as a failure**, and asserted restoration
byte-identical by sha256. **Four plants were defective and all four are recorded rather than quietly
replaced**: one green because the gate's pattern was case-sensitive and the plant was not; one red for the
wrong reason because an unclosed array produced a zero-test run; one red from the test's own lookup firing
before the assertion under test; one green because an import edge is not a mount. **Checking that the red
came from the assertion you meant is a separate step from watching it go red.**

### Still open at wave 5's close, and owned by no task

- **`build-registries`' `MOD-*` ownership heuristic is a source-text scan.** An attribution reached through a constant is invisible to it, so it cannot tell a deliberate non-module route from one hiding its identifier behind an indirection. Task 20 ruled it belongs to the route or to the status rule's evidence class, not to a gate.
- **`registries/generated/doh/module-reach.json`'s `doNotEdit` names a mechanism that does not fire.** The count is gone, but **zero files under `tests/unit` reference that file** — its real enforcement is `src/surfaces/doh/modules.ts`'s import plus load-time role validation. Controller-owned text.
- **`PINNED_WORKER_MESSAGES` covers one screen** while five storyboards quote fixed worker strings the source does not rule unparaphrasable.
- **`contentOrigin` has no member for a storyboard that renders no guidance at all** — four cards took `'authored'` as least-wrong, each with reasoning.
- **`StoryboardCardContent` admits `''` on any of nineteen fields**, checked only on one fixture and inside each content task's own test.
- **`notShippableLock`** is named in prose as being in a token list it is not in, deliberately not added because two files render it.
- **`SA_MATRIX_ATTRIBUTION` renders "twelve Frontline ones"**, escaping the widened numeral gate because it reads `twelve Frontline` rather than `twelve modules`.
- **The proven-share margin is ~74 citations.**
- **On-screen locator marking for the thirty storyboard index entries** — the honest completion of one offline-phrasing remedy — needs a build to be visible.

## 9. The closing obligation

After slice 13: audit the build for gaps, fix and re-test; then audit against the frozen
blueprint verified against the code; repeat until nothing remains. Only then report
*"nothing is remaining, ready to give a demo to the client"* — and that claim requires a
clean fresh `pnpm verify` on the exact reviewed bytes, not a recollection of one.
