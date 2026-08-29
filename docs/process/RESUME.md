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

## 1a. THE PIVOT — read before anything below it, because it re-orders the whole run

**On 2026-08-26 the client re-issued the master prompt with six materially new sections, and
none of the seventeen prior approvals was given against them.** They are §2.3
live-verification-only testing, §8.6.2 product fidelity, §10.6 the guided-tour engine, §12.6 the
JSON-file database, §24.2 workflow-driven shipping, and §24.3 remediation of a prior partial
build. §24.3 requires the existing routes be audited against §8.6.2 **before anything new is
added**, so it re-orders this run ahead of §8's position below.

**The §24.3 audit was run and it convicts the shipped presentation layer.** Measured across
`app/`: **107 of 154 components render blueprint line locators as page content**, 76 carry
narrative paragraphs as their body, 23 carry bullet lists. The rendered Tenants page opens with
`Screen annotations only, never route keys (D1): SCR-SA-14 … (L42806, L42807)` above a
screen-state radio group used as page furniture. It fails all three §8.6.2 litmus tests.

**The second measurement reframes the work and is the number to carry.** The fourteen registries
hold **5,015 census rows: 4,684 not-represented, 299 demonstrated, 22 not-applicable, 10
mounted-elsewhere.** 79 of 81 modules have a route and **21 of 990 functions do**. This is not a
restyle of 107 screens — it is building the product, with the 102 routes as scaffolding.

**Two new approvals govern.** **APP-017** — approach A, the product-shell swap: keep the domain,
policy evaluators, state machines and all fourteen registries; rebuild every screen body as real
product user interface over a §12.6 JSON collection set behind one repository; relocate every
rendered locator into the registry and §10.6 tour narration rather than deleting it. And the
testing pivot: **no new test case is written anywhere**, the 324 existing suites are retained but
**demoted** — they are no longer release evidence — and a suite asserting a deleted document-style
rendering is deleted with its screen rather than repaired. Release evidence is the
**Live-Verification Ledger**: real Chrome through the Chrome MCP server.
**APP-018** — the client withdrew themselves as a decision-maker for the remainder. **Ask them
nothing.** Every open choice is the controller's, on the standard of what is best for production.
Research order, named by the client and binding: **blueprint first; only if it does not answer,
internet R&D; never back to the client.** This released the spec-review gate and the S3
execution-mode question. It did **not** release independent review or fresh verification.

The two limits that survive every delegation are unchanged and are not the controller's to waive:
an unresolved **source** decision is disclosed on screen with its alternatives and the
controller's pick labelled a client-delegated choice, and **no production capability is claimed
that is only simulated.**

**Where the pivot lives.** Design: `docs/superpowers/specs/2026-08-26-product-fidelity-rebuild-design.md`.
Runway plan (nineteen tasks): `docs/superpowers/plans/2026-08-26-runway.md`. Ledger and preflight
rulings R1-R9: `.superpowers/sdd/2026-08-26-runway/progress.md`.

**What the pivot does NOT cancel:** the owed slice-11 audit round 8, slices 12 and 13, and the
closing obligation of §9. §24.3 puts the fidelity rebuild in front of them; it removes nothing.

**And a finding recorded on the way in.** §8 below states round 7's chain was "recorded in
`docs/process/2026-08-25-slice-11-round-7-verification.md` with exact commands and counts". **That
file does not exist.** The newest verification record on disk is round 2's. §8 is left as found so
the discrepancy stays visible, and it is carried into the round-8 register. Session entry also
found 35 modified files and one untracked gate uncommitted — fix streams V, W and X, whose session
ended mid-flight — preserved at `76a0da2` with typecheck and lint verified on those bytes and
everything else explicitly not re-driven.

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
| — | — | nothing running. Fix streams V, W and X (round 7) were interrupted mid-flight when their session ended; their work was measured and closed by the controller in the next session. Round 8 is owed and nothing is dispatched. |

Previously: fix streams S, T and U (round 6), interrupted the same way; their work was measured and
committed by the controller in the next session, and the seven sites they left stale are named in §8.

**A dead agent's work is not a landed agent's work.** Three streams stopped mid-file with nothing
committed and no report. What made the difference was that the controller measured the tree rather
than reading the briefs: six of the seven stale dependents were caught by the chain, and the seventh
by grepping for the figure that had moved. **When a wave is interrupted, diff the working tree
against the briefs' intent before trusting either.**

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

**Do not rank a state family and infer behaviour from the ranking — read what each state is
actually assigned.** A reviewer assumed hard suspension must be "stricter than soft" in a way that
extends to blocking logins, and filed a finding against seed data on that basis. The source's
asymmetry runs by FUNCTION, not by severity: `FUNC-DOH-01-2.1.3` assigns login-blocking to the
COMPLIANCE state alone, `FUNC-DOH-01-2.1.2` gives the hard state only new-run blocking while
in-flight runs complete, and L27004 states as a SoW Fact that "in soft and hard suspension,
workers see nothing on mobile and the floor continues." The finding pointed at the two correct
rows and missed the two wrong ones — suspending two WORKER accounts encoded the exact opposite of
the safety property the source asserts, that a commercial state never stops the floor mid-run.
It was caught only because the fixer was told to resolve from source before editing. **No schema,
type or validator can catch this class**: it is a product fact, and an intuitive severity ordering
produces a confident wrong answer. Applies to every state family here — suspension classes,
severity levels, device trust, capture states, command states, notification states.

**Verify agents' numbers rather than accepting them.** Three times an agent checked a
figure the controller supplied and found it wrong. Twice an execution claim did not
survive checking while the underlying work was correct.

## 8. Position — update this section at every slice boundary

### Session S14 — the runway is closed and the §24.2 workflow units have started

**Read this subsection before the round-7 material below it.** That material is still true and still
owed; it is simply no longer the front of the queue. §24.3 puts the fidelity rebuild ahead of it,
APP-021 records the client's re-issue of the master prompt as this session's instruction, and the
runway that stood between the two is now finished.

**Position, measured at session entry rather than recalled.** Frozen source unchanged at
`47bd18db…`, 18,565,031 bytes / 122,241 lines. Fresh `pnpm verify` exit 0 on `65d95c0`. Runway
19/19 closed. Every test case deleted. Census 5,015 rows — 299 demonstrated, 4,684 not represented.
Workflows 724, of which 80. Live-Verification Ledger empty. 91 of 160 files under `app/` still
rendering a blueprint line locator.

**Unit 1 — platform bootstrap and tenant provisioning.** Spec
`docs/superpowers/specs/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning-design.md`,
plan `docs/superpowers/plans/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning.md`,
ledger `.superpowers/sdd/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning/progress.md`.
Twelve tasks. **Six complete** — 1 runtime, 2 sign-in, 3 dashboard, 4 tenant list, 6 tenant detail,
5 create wizard, in that order because the wizard navigates to the detail page. **Task 7 is in its
first fix round.** Tasks 8-12 unstarted: invitation acceptance, tenant metrics, the guided tours,
the locator and registry reconciliation, and closure.

**The census has barely moved and twice moved DOWN on purpose.** It reads 293 as this is written.
Four rows were removed when a screen was found claiming storyboards for screens that do not exist
yet, and three more when a dead file's claims were traced. A smaller true number beats a larger one
that would not survive a reviewer opening the route, and the number rises honestly when Tasks 8-10
build what the removed rows described.

**What this session actually bought is foundation, and the reason is worth carrying.** Four defects
came out of the data layer, every one of them latent inside work that had already passed review,
and every one surfaced only when something finally tried to write through the door:

1. `useRepositoryQuery`'s cache keyed on selector identity, so it missed on every render for the
   only calling convention its signature invites — the query surface all 102 routes read through.
2. `useAccessContext` memoised the domain state at mount and never recomputed it after a write, so
   every write-time `evaluateAccess` call in the application decided against mount-time truth.
3. `authorizeWrite` resolved a `tenants` row to its own id and then refused the write because the
   tenant was in the state the action existed to change — every tenant-lifecycle write was
   structurally unreachable, including create.
4. `resolveTenantId` could not tell "this reference legitimately has no tenant" from "this reference
   is dangling", so every `role-grants` write for all four platform console roles was refused.

**The lesson under all four:** a green chain proved nothing about paths nothing had exercised. The
runway's screens read; these were the first that wrote.

**And the reviews earned their seats.** Three of them booted the repository in a read-only harness
and measured rather than reading the comment above the code; one ran a sensitivity control,
extracting the pre-fix file and reproducing the defect against it, which is what turns a green
result into evidence. Five controller figures were corrected by implementers, and one controller
theory — that a coverage drop came from an abbreviated identifier — was disproved by a reviewer who
ran `stripComments` and found that comments never carry citations at all. That finding changed the
relocation rule for every remaining task in the programme: an identifier that governs a permission
decision is passed as that call's `sourceRefs`, never left in a comment.

### Unit 1 — platform bootstrap and tenant provisioning — CLOSED (task 12 fix round 1)

**Read this before the "Session S14" material above it and the round-7 material below it — this is
the position at unit 1's close, measured fresh rather than recalled.** All twelve tasks complete.
Verification record: `docs/process/2026-08-29-unit-01-verification.md`. Task ledger (the SDD
progress record, distinct from the Live-Verification Ledger discussed below):
`.superpowers/sdd/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning/progress.md`.
Task 12's first pass is committed as `ece524f0398ab7d3a8e97468e818cc5a27a8e17f` (on top of
`79cbd4f130865253bccc967973ba04d89cc05927`, task 11's close); fix round 1 (below) sits uncommitted
on top of `ece524f` — the controller commits.

**Frozen source re-hashed at closure: unchanged, `47bd18db…`, 122,241 lines.** No drift.

**Fresh `pnpm verify` exit 0**, run three times across task 12 and its fix round, most recently on
the corrected bytes — output preserved durably at
`artifacts/evidence/unit-01-task-12-verify/pnpm-verify-fixround1.txt` (not a session scratchpad),
with its own exit-code line appended. Census unchanged at **277 of 5,015** demonstrated (this task
touches no product/seed/registry file).

**The Live-Verification Ledger — empty at every prior session's close — now holds 30 rows**, all
driven fresh against the served export: 28 `pass`, 1 `fail` (LV-0009: write-only persistence
reproduced live), 1 `blocked` (LV-0010: the full accept→activate spine continuity cannot be driven
in one document). `ledger-reconcile.mjs` Section B (phantom paths) reads **0**. **Section A (backlog)
reads 5,003 of 5,015** — corrected in fix round 1 from an original, WRONG figure of 4,990, which had
been computed as `5015 − row-count` where the tool actually counts distinct `pathId`s; read the
tool's own output, never recompute it by formula.

**Fix round 1 also corrected two transposed workflow ids** (LV-0015 root-sign-in-step-up now
correctly cites `WF-ROLE-004`; the six ordinary sign-in/out rows now cite `modules:MOD-SA-01`, a
defensible substitution since no registry row represents ordinary Super Admin sign-in, stated as
such rather than dressed up as exact); **added five rows (LV-0026–0030)** for the two privileged
doors' successful-write paths (`inviteConsoleUser`, `decideApprovalRequest` — task 7's own
maker-checker happy path had no row before this) and task 6's tenant-detail People/Entitlements/
Audit tabs; and **named, rather than implied, that the tour RUNNER itself (15 tours, 135 steps) has
no ledger row and was not driven** — every tour-shaped row replicates the tour's scripted steps
against real controls directly, which is real product-behaviour evidence but not runner evidence.

**The seal was restated against the true committed baseline rather than an intermediate one.**
Task 12's seal is the first fresh reseal since `79cbd4f`'s own manifest (itself stale, carrying
`git_commit a49d53ec…`, several commits behind) — 16 product files newly brought into scope, 4
orphaned `fixtures.ts` files correctly dropped, net **+12 (834 → 846)**. That is real, valuable work
a prior phrasing ("unchanged") hid. Envelope manifest similarly: 97 → 100 (task 12) → 102 (fix round
1, adding this record and the durable verify log).

**Seven findings carried forward, named rather than fixed, in full in the verification record's
§7:** persistence is write-only (reproduced live, not merely re-cited); `advanceClock` moves a
decorative clock; the tour registry has no gate on `spotlight`/`expectVisible`/`assertState.check`
targets; the shipped console-users page renders blueprint locators from a pre-existing overlay;
five identifiers have no honest citation home; `acceptInvitation` takes a tenant id and no caller
identity; a stray `git stash` entry sits on the branch, left deliberately.

**A structural fact about LV-0010's block, surfaced by review rather than assumed:** `ProductRuntime`
is mounted in the root layout, so a SOFT navigation between the Hub and Super Admin surfaces would
in fact preserve the store — the block is real only because no soft navigation path connects the two
surfaces in the shipped UI, not because the runtime itself cannot carry state across a client-side
transition. Worth remembering before any future task assumes the two surfaces are inherently
incompatible.

**What the next session should do with this:** the persistence/reset task named in finding 1 is the
natural next dependency for any unit that demonstrates a write surviving a reload. Unit 2 (or
whatever is next in `docs/superpowers/plans/`) can start clean; nothing here blocks it, and nothing
here should be re-litigated from memory — read the verification record and the ledger rows directly.

### Round 7 of the slice-11 audit loop is closed — round 8 is owed

**172 findings declared across seven rounds. Round 1: 42. Round 2: 20. Round 3: 15. Round 4: 30.
Round 5: 20. Round 6: 17. Round 7: 28.** The disposition record
`docs/process/audits/2026-08-25-slice-11-audit-dispositions-rounds-1-6.md` enumerates **169 rows —
167 CLOSED and two PARTIAL (`C-18` and `R6-B03`, reason and owner recorded on both), none OPEN** —
and the gap between 172 and 169 is stated there rather than reconciled away: round 3 declares fifteen
and only eight ids are recoverable, round 4 declares thirty and enumerates twenty-nine, round 2
declares twenty while twenty-five rows exist for twenty-four distinct findings. **Counted from the
tables, not from the headers.** `tests/coverage/process-evidence.test.ts` holds the seven-register map
by EQUALITY, so **filing round 8's register reds the gate until the map is extended and its findings
are dispositioned.** That is deliberate.

**The slice is still not closed.** The loop ends when a round finds nothing, and round 7 found
twenty-eight — two Critical, both in the document a client opens first.

**Round 7's own shape: the paperwork, not the product.** Rounds 1-5 found defects in the product;
round 6 found that nothing read the evidence layer; round 7 found that **the fix wave and its
record-keeping are the densest source of defects in this build** — ten of twenty-eight were
provenance, arithmetic or citation defects in artefacts written during the previous two rounds, three
of them the controller's, and one was the wave re-committing the very shape it was closing
(`R7-A4`: a stated seven against an enumerated six, written by the stream fixing two findings of that
shape). The two Criticals were in `docs/client-review-guide.md`: it told a reviewer **not to review
eleven shipped Command Center screens**, and its headline honesty figure — sold as "computed rather
than asserted" — was hand-typed at 4,970 / 237 / 7 against a build of 5,015 / 299 / 10.

**And round 7's wave was interrupted exactly as round 6's was.** Fix streams V, W and X were all
writing when their session ended: no stream wrote a report, nothing was committed, 35 modified files
and one untracked gate sat on disk. **The next session measured the tree rather than trusting the
briefs** — that is the procedure §6a records, and it worked twice now. What it found: all three
streams' work landed and holds. Stream W had closed its own seven rows; the other twenty-one were
`OPEN` with their owning stream named, and the controller closed each one against the artefact and
the gate that holds it. Chain on those bytes was green everywhere except three `process-evidence`
cases, all one cause — the manifests were sealed before the untracked gate existed, which is the
owed reseal rather than a defect.

**One defect was found by that verification rather than by the audit.**
`tests/coverage/client-document-figures.test.ts` — round 7's own root-cause fix for `R7-B13`, 16
cases holding every figure in four client documents against the artefact it describes — **shipped
without a plant.** A claim gate with no plant is defect shape 1 in the file built to catch shape 5.
It now carries `P1/P2`: a wrong figure derived as `routes.length + 1` so it can never coincide with
the truth on a future export, and the sentence reworded away, which must throw on zero matches. The
filesystem half was proved once by hand — `85` planted over `102` in `docs/deployment.md` reds case
2 — and restored byte-exact against its sha256. **Look for this shape in every gate a fix wave
ships: the wave is measured on whether its subject is fixed, and nobody asks whether its new gate
can fail.**

**A property of the seal worth knowing before trusting `worktree_clean` — SETTLED in Task 18 fix
round 1.** `R7-A1` was closed by making the manifest say which half it is in: `bytes_measured_against`
carries one of two sentences chosen by `worktree_clean`, and case 13 asserts the clean sentence's
claim against git. The clean branch used to be unreachable: sealing on a clean tree writes both
manifests, which makes the tree dirty; committing them made `product-candidate-manifest.json` — a
certified path in the envelope payload — differ from the tree the manifest names, and case 13's
clean leg convicted it. So every seal was a dirty seal carrying the honest sentence, and the clean
leg had never run on real bytes.

**The ruling: exclude the seal's own two outputs from the comparison**, not retire the leg as dead
code. A manifest that must contain its own hash cannot ever be correct, and this is the same
non-self-referential form §23.2 already requires for the Evidence Envelope Manifest against
itself — it just was not applied to the OTHER file the same seal operation writes.
`scripts/seal-manifests.mjs`'s envelope payload now excludes both `PRODUCT_MANIFEST` and
`ENVELOPE_MANIFEST` (`SEAL_OUTPUTS`, stated as data in `scope.excludes` on the manifest itself), so
neither seal output is certified anywhere and resealing them can never make a certified path fail to
match the commit that names it. `tests/coverage/process-evidence.test.ts` case 1's partition equality
and case 3's non-self-reference assertions were updated to match (both seal outputs are still real
paths added back into the total-partition union; case 3 now asserts the product manifest is absent
from the envelope payload rather than present in it). Verified on the dirty tree this fix round left
(seal re-run, all 17 `process-evidence.test.ts` cases pass); the clean branch itself is only
exercisable after a commit landing this fix, at which point a true no-op reseal (unchanged
`git_commit`, unchanged digests, unchanged `verification.sealed_against`) writes byte-identical
manifests and case 13's clean leg runs for the first time on real bytes rather than staying
structurally unreachable.

Chain measured on the corrected bytes, one uninterrupted sequential run: recorded in
`docs/process/2026-08-25-slice-11-round-7-verification.md` with exact commands and counts.
Registries regenerate byte-identically. Both manifests are resealed on these bytes by
`scripts/seal-manifests.mjs`.

Registers: rounds 1-7, all seven under `docs/process/audits/`.

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

**Round 4-5 additions.**

8. **A brief that forbade an action and then prescribed it.** Fix brief N said "do not run
   `scripts/build-registries.mjs`" and then listed `pnpm build` in its required verification —
   and `build` is `build:registries && rm -rf out && next build`. The implementer ran the
   verification, regenerated, and reported it plainly. Both deltas were gains and it verified
   them row by row, so nothing was lost. **Check the package scripts before forbidding a
   command by name.**
9. **A raw `grep` over `out/` is not a measurement of what a reader sees.** Checking whether two
   figures were rendered, the controller grepped the built page and found them; both were React
   row keys inside the flight payload. Round 4's own R4-B08 names this trap. Strip the payload.
10. **A regex copied from an auditor into a fix brief, never re-derived.** `FB-FL-[A-Z]+-[0-9]+`
    cannot match `FB-FL-SEV1-01`. The audit said 12, the brief said 39, the answer is 28.


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
