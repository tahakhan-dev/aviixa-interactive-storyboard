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
| fix stream N (round-4 leftovers) | `app/super-admin/{core-agents-and-composed-agent-review,platform-settings,platform-overview-and-health,usage-and-metering}/**` · `tests/unit/{routes,stu-content-libraries}.test.ts` · `tests/coverage/citation-graph.test.ts` · two docs files | running |
| round-5 audit A (gates and derivations) | read-only; `/tmp` scratch | running |
| round-5 audit B (reconciliation claims) | read-only; `/tmp` scratch | running |
| controller | `docs/process/**` · registry regeneration between waves | running |

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

### Rounds 1-4 of the slice-11 audit loop are closed — candidate `27a96d7`

**107 findings, all dispositioned and fixed.** Round 1: 42. Round 2: 20. Round 3: 15. Round 4: 30.
**The slice is not closed** — the loop ends when a round finds nothing, and round 5 is running.

Chain measured on `27a96d7`, clean tree, every figure from that run: typecheck 0 · lint 0 ·
gate-ordering **31/31** · freshness 3/3 · unit **6272**/182 files · component **3040**/108 · build
**102/102** · release **931**/31 · e2e/axe **548**. Registries regenerated once after all three fix
streams landed; census tally reproduced identically.

Registers: `docs/process/audits/2026-08-24-slice-11-audit-dispositions.md` (round 1),
`…-round-2-findings.md`, `2026-08-25-slice-11-audit-round-3-findings.md`,
`2026-08-25-slice-11-audit-round-4-findings.md`.

**Round 4 in one line each.** The §9.6 reconciliation table existed and reached no reader, and five
of the fourteen inventories had no row in it. Three Hub pages shipped a thrown React error as their
browser tab title, and a fourth ships an empty one. Six Super Admin pages told a reader the source is
silent about twelve acceptance criteria it states. A published control count read 83 where 271 are
declared. The citation gate had narrowed its own population three times.

**Round 4's own process lessons, and both were the controller's.**

1. **A finding that exists only in a context window has not been made.** Round 4's first run lost two
   of three streams' findings to compaction, and a count reached this file that nothing on disk could
   reproduce. The register is now written **before** the fix brief, always.
2. **Every count in a brief is a hypothesis, including the ones the controller copied from an
   auditor.** The regex `FB-FL-[A-Z]+-[0-9]+` cannot match `FB-FL-SEV1-01`; the audit said 12, the
   brief said 39, the answer is 28, and the build's own sibling pages had been right all along. It
   survived an auditor, a controller and a register before an implementer re-derived it.

**And the pattern worth keeping: two of round 4's findings were made by fix streams, not auditors.**
A fixer building the gate its brief asked for found three more instances of its own class; another
found a fourth broken title in a file it did not own. A gate written to convict a class convicts the
class, which is why one stream was right to write outside its file list rather than neuter the gate
to fit.

### The four findings to carry above all others

**1. A client could reach 18 of 102 pages, and not one of the five surfaces.** Every route-level
assertion reaches its route by `page.goto()`, so 546 green tests were compatible with a
five-surface product nobody could navigate to. Now 99 of 102, held by a BFS gate comparing against
`scannableRoutes()` by equality. **The deliverable's own usability had no assertion at all.**

**2. A widened gate population found a permission error no auditor did.** The only general gate on
Hub module reach covered seven of nineteen modules. Widening it convicted `MOD-DOH-11` on the first
run: the delivered map granted a role that reaches nothing there and **omitted the Read-only Auditor
from the audit module.** Round 3 then swept every matrix and found no second instance — both reach
maps reproduce byte-identically — so it was a one-off, and the sixteen source self-disagreements it
did find are now disclosed rather than resolved.

**3. A correct fix silently emptied a gate, and the suite kept passing with less to say.** C-41
stripped markdown from rendered strings — right, since the card prints text — and a disclosure gate
keyed on backticks went to a population of zero: 20 bare ids named, 0 matched, no assertion run.
**The inverse of the abstention that rots**, and the same remedy: assert the population, not only
the offenders.

**4. The build told a reader the source is silent where it is explicit.** Three Super Admin pages
render a heading saying an acceptance criterion is missing from the frozen source and abstain from
building it; the cited lines carry the complete runs. Six real criteria, two of them prohibitions.
Bare citations grade WEAK under `locator-fidelity` and no suite reads `out/`, so nothing could red.

### The shapes, in the order the rounds produced them

- **Round 1:** the fix landed and its gate did not, or the gate landed and the fix did not.
- **Round 2:** a population control that verifies a SUBSET, PREFIX or AGGREGATE where the claim is
  every member. The remedy is an equality over a named literal list, never a bigger number.
- **Round 3:** a correct fix that empties a gate's population elsewhere.
- **Round 4, so far:** a figure or an abstention published to a reader that the source refutes, in a
  place no gate reads — `out/`, `registries/generated`, `docs/process/ledgers/`.

### Controller defects this session, recorded because they repeat

1. Committed after verifying four chain steps of nine; shipped a red gate a concurrent stream found.
2. Cited a blank line in a register; the gate widened earlier in that same round convicted it.
3. **Corrected it by naming the blank line again in prose, and was convicted again.** An `L`-prefixed
   number is a citation WHEREVER it appears.
4. A plant that added `&& true &&` to a conjunction — it changed nothing, the suite stayed green, and
   that was nearly read as the gate being sound. **Watching a plant not red is only evidence when the
   plant is real.**
5. `git checkout` on a file with an uncommitted fix, discarding it. Twice in one session.
6. Wrote a finding count and a test count without measuring either; both were wrong.
7. Twelve wrong brief locators, every one found by an agent opening the line, including two paths
   that do not exist and a matrix body pointed at the separator row.

### A citation hazard that has now caught three authors

**Bare `§N.N` in this repository means the BLUEPRINT.** The master prompt's section numbers collide
with real blueprint chapters: its §29.4 against `## 29.4 Support use cases` (L57956), §13.1 against
the identity vocabulary (L17462), §9.6 against the Frontline sole-origin chapter (L13892). Write
**"master prompt §X"** every time. Two code sites had the bare form and are fixed; one of them was
written this session by the controller.

## 9. The closing obligation

After slice 13: audit the build for gaps, fix and re-test; then audit against the frozen
blueprint verified against the code; repeat until nothing remains. Only then report
*"nothing is remaining, ready to give a demo to the client"* — and that claim requires a
clean fresh `pnpm verify` on the exact reviewed bytes, not a recollection of one.
