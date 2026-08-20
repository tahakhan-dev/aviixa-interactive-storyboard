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
conflict with both locator sets. `Explicitly prohibited` carries **no** rendering
anywhere; `Unavailable` is overloaded across two senses that render oppositely.

**Verify agents' numbers rather than accepting them.** Three times an agent checked a
figure the controller supplied and found it wrong. Twice an execution claim did not
survive checking while the underlying work was correct.

## 8. Position — update this section at every slice boundary

**Slice 4, branch `slice-04-tenant-setup`.** All ten build tasks complete and reviewed.
Task 11's six gates committed (`6631f4c`, release 138→189). Two fix waves running against
defects those gates found: `rolesReaching` wrong on three modules, and module suites whose
gates scan nothing plus a lint failure blocking `pnpm verify`.

**Next:** finish those fixes → task 12 verification → whole-branch review → merge to
`main` → **slice 5 immediately, without stopping.**

**Coverage, measured from the generated registries — regenerate rather than quote this:**

```
183 / 4,914 items demonstrated
modules 27/81 · workflows 72/724 · ai-storyboards 55/613 · functions 12/990
business-objects 6/99 · actionable-controls 4/630 · business-use-cases 2/330
notifications 2/205 · scheduled-work 2/67 · features 1/534
sub-features 0/526 · offline-scenarios 0/70 · events 0/28 · commands 0/17
```

Ten of the fourteen are computed from the built tree with a mutation proof each. Four are
honestly zero: two namespaces disjoint from the source register, two belonging to unbuilt
slices. **`actionable-controls` is a floor, not a figure** — the join is on label text the
modules reword, and closing it needs a verbatim source-label field on the control-matrix
row.

## 9. The closing obligation

After slice 13: audit the build for gaps, fix and re-test; then audit against the frozen
blueprint verified against the code; repeat until nothing remains. Only then report
*"nothing is remaining, ready to give a demo to the client"* — and that claim requires a
clean fresh `pnpm verify` on the exact reviewed bytes, not a recollection of one.
