# Unit 1, Task 11 — locator relocation and registry reconciliation

Frozen source: `AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines. Unchanged.

**Revision note (second correction).** The first revision delegated to four task reports by name
and row-count and claimed "no locator was found unaccounted for" — false. The second revision
enumerated the absent set but still claimed completeness it did not have ("every token absent from
`app/`+`src/` is enumerated below in full"), left the 158 present-in-tree tokens as an
unenumerated aggregate claim, and contained its own version of the defect it was fixing: one row
(`L45228`/`L45230`) named a home — `FB-SA-01`/`AC-SA-10-03` "cited elsewhere in
`TenantMetricsScreen.tsx`" — that does not exist (`FB-SA-01` is comment-only in two OTHER screens;
`AC-SA-10-03` exists nowhere except a gaps ledger). This revision fixes both: the claim of
completeness is now scoped to what the stated method actually finds, with the exact commands given
so a reader re-runs them rather than trusting a sentence; and every row naming a "home" has been
re-verified against the literal file content, not against memory of an earlier pass.

**Method, exact and reproducible.** For each of the four rebuilds, the outgoing file was read via
`git show <base>:<path>` at the commit immediately before the rebuild task's first commit (Overview
`2289c8d`, Tenants list `0db53b6`, Console users & approvals `51c84ab`, Tenant metrics `f68b0c2`).
From each, every token matching `/[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g` and every blueprint line
locator matching `/\bL\d{4,6}\b/g` was extracted — **199 raw occurrences, 178 distinct tokens**
(some are prose-hyphenation false positives such as `Non-payment`/`Site-wide`/`Last-known-good`,
left in the raw extraction rather than hand-filtered, so the count is what the regex finds, not a
curated list).

Each token was then checked for presence in the CURRENT tree with:

```
grep -rl -F -- "<token>" app src
```

**`src/coverage/disclosure-gaps.ts` is excluded from what counts as evidence of a home**, and this
is a correction from the previous revision: that file is `AC_CITED_IN_PRODUCT_NOT_IN_TESTS`, a
whole-project GAPS LEDGER — a list of ids the project's own deleted test suites never covered.
Appearing in it means "this id is a known coverage gap," which is the opposite of a citation. The
previous revision's presence test did not exclude it and so wrongly treated eight tokens as
"present" when their only occurrence anywhere is being named as uncovered.

Running that check with the exclusion applied over all 199 raw occurrences: **152 resolve to real
code, a `sourceRefs` array, or a module-lookup key in the current tree — reproduce with the command
above against each of the 178 distinct tokens and confirm a non-empty result naming a file other
than `disclosure-gaps.ts`.** These are not hand-enumerated here: a token the grep finds is, by
definition, not lost, and writing 152 rows by hand would be 152 new opportunities to misstate one
of them, which is the exact defect this document exists to stop repeating. What is enumerated in
full, one row per token, is the set that matters — the tokens the command above returns nothing
useful for.

**47 raw occurrences (of 178 distinct tokens, some repeating across screens) are absent as
evidence.** Every one is named below with its verified resolution. `registries/blueprint-locators.json`
was checked and rejected as a home for any of them — it is a slice-11 index of the frozen source,
unchanged since `3f24a7c`, and holds every blueprint id automatically regardless of whether this
build does anything with it. `src/data/collections/tours.json` was checked and holds zero blueprint
locators, so "tour narration" is not a home for anything in this table either.

## Which of the eight screens are rebuilds vs. new builds

Only four had an outgoing version. Verified by `git log --oneline --follow --diff-filter=A`:

| Screen | File | History |
|---|---|---|
| Super Admin overview | `OverviewScreen.tsx` | REBUILD (`3824f5a` → `0db53b6`) |
| Tenants list | `TenantsScreen.tsx` | REBUILD (`9a2a1ae` → `fcc4214`) |
| Console users & approvals | `ConsoleUsersScreen.tsx` | REBUILD (`90559b6` → `9393693`) |
| Tenant metrics | `TenantMetricsScreen.tsx` | REBUILD (`73e588c` → `87640e4`) |
| Tenant detail, Create wizard, Sign-in, Acceptance | — | NEW — no outgoing version, nothing to relocate |

## Restored this task, on top of commit `9ccf71a` (fix round 1)

| Locator | Was | Now lives at |
|---|---|---|
| `WF-ROLE-018` (L55961) | Live in the outgoing screen's critical-branch citation: "Initiating a critical-class action belongs to the Admin and the root." The outgoing screen's own gate covered BOTH halves of that sentence — an Admin-drafted critical action, and root's exclusive authority to decide it. | `ConsoleUsersScreen.tsx`'s `decisionGate`, critical-class branch: `sourceRefs: [...,'WF-ROLE-018','L55961',...]`. This gate governs the DECIDE half only (`approverAllowedRoles('critical')` returning `['ROOT_SUPER_ADMIN']`), which is the acceptance criterion the citation is defensible on. **The INITIATION half — an Admin drafting/proposing a critical-class action as a distinct, gated act — has no control anywhere in the rebuild**: this screen's Change-approvals section reads an already-created `ApprovalRequest` row; nothing on it creates one. That half of `WF-ROLE-018` is not demonstrated and the citation does not claim it is. **Census: `workflows:WF-ROLE-018` demonstrated** (decide-half only). |
| `L55918` | Live in the outgoing screen's `returnDecision` (`sourceRefs: ['L23707','L55918']`) — Admin returning an engineering-class item | `ConsoleUsersScreen.tsx`'s `decisionGate`, engineering branch: `sourceRefs: [...,'UC-HO-02','L55918',...]`. The outgoing screen had `returnDecision` as a function separate from `approveDecision`; the rebuild merged both into one `decisionGate`, which is why the citation had nowhere obvious to land. Bare line locator, not a separately tracked registry row — no census effect. |
| `L23707` | Backs `SB-HO-004`, already cited on `criticalViewerGate` — the line number itself was missing | `criticalViewerGate`: `sourceRefs: ['SB-HO-004', 'L23707', 'AC-SA-08-06', '§8.8.3']`. No census effect (bare line locator). |

## The absent set — every one of the 47 raw occurrences, resolved

Two are tracked registry ids (`WF-PLT-004`, `SB-RBAC-01`); the rest are not tracked by any of the
fourteen registries, so their resolution has **no census effect** — named because §24.3 requires
every locator accounted for, not because any of them move a number.

| Locator | Source line reads (verbatim where quoted; paraphrase noted otherwise) | Resolution |
|---|---|---|
| `WF-PLT-004` (workflows, tracked) | L55108 region: "Applying soft and hard tenant suspension" | **Honestly dropped.** `TenantDetailScreen.tsx`'s only lifecycle action is `Activate`; suspension states render read-only, never set. Was falsely `demonstrated` via the orphaned `tenants-lifecycle-and-pilots/fixtures.ts`, deleted this task. |
| `L55108` | Outgoing `TenantsScreen.tsx:509`: "WF-PLT-004 is a workflow and names no control" (the outgoing screen's own honest-absence note for this exact fact) | Same resolution as `WF-PLT-004` above — this is its line locator, not a separate fact. |
| `SB-RBAC-01` (ai-storyboards, tracked) | L20728: the console Roles pane — a LIVE per-module four-role matrix with a CSV export, root-only edit | **Correctly not-represented.** The "live per-module Roles-matrix pane" Task 7's own report already disclosed as out of scope ("`SA08_PLATFORM_ROLES`… NOT carried forward… a real gap for a future task"). Not a new finding — the same gap under a different id. |
| `AC-4810` | L107368 (verified `sed -n '107368p'`): "Every telemetry emission is validated against the cardinality allow-list, and an emission carrying a prohibited dimension fails the build rather than being dropped at runtime." | Structurally plausible (this build's data model has no worker-identity/free-text dimension to violate the rule, consistent with the sibling rule at `L107315` already restored) but **not enforced by any build-time gate specifically for this id**, and `AC-4810`'s only occurrence anywhere in the repository is `disclosure-gaps.ts`'s own list of ids the deleted test suites never covered — which counts it as a known gap, not a citation. Genuinely uncited. Untracked, no census effect. |
| `L107368` | Backs `AC-4810` | Same resolution as `AC-4810` above. |
| `AC-SA-08-07` (L44881) | Every approval request carries nine fields, commits with its audit event in one transaction | Real, structurally true (the repository's atomic `commitWrite` appends the audit row in the same snapshot as the row update) but uncited; not a permission decision, no non-decorative code slot for the bare token. Untracked. |
| `AC-SA-08-08` (L44882) | A pending change renders as pending on the target object as well as in the queue | **Not built.** The rebuild renders pending state in the queue only; no other screen cross-renders a pending badge on the affected tenant/user object. Untracked. |
| `AC-SA-08-10` (L44884) | The implementation-authoring role's provisioning/revocation appears in both audit streams | Out of Task 7's own stated scope (Console users + Change approvals only). Its only occurrence in the repository is `disclosure-gaps.ts`'s gaps list — corroborating, not contradicting, that it is uncovered. Untracked. |
| `AC-SA-09-06` | Compliance suspension blocks logins, stops runs, locks devices with a fixed message | No suspension control of any kind exists on the current screen. Untracked. |
| `AC-SA-09-07` (L45098) | Compliance suspension is critical-class, cannot be applied on an Admin's authority alone | Same — no suspension control exists to distinguish. Untracked. |
| `AC-SA-09-08` | No entry into a compliance-suspended tenant outside the dual-authorised path | Same — no suspension control exists. Untracked. |
| `AC-SA-09-09` (L45100) | Every suspension transition writes tenant-state history and is audited | Same. Untracked. |
| `AC-SA-09-10` (L45052 region) | A device lock is never rendered as taking effect before the device's own acknowledgement | Device-level (Frontline/DOH) fact; no device UI on the Super Admin tenant screens. Untracked. |
| `AC-SA-09-14` (two occurrences) | "Visibility, not intervention" — no operational action of any kind on this page | **Superseded, not lost.** True of the OLD document-style screen. The rebuilt `TenantsScreen.tsx`/`TenantDetailScreen.tsx` deliberately ADD real actions (Create tenant, Activate) per master prompt §12.6 — this criterion describes a capability state this build intentionally moved past. Untracked. |
| `AC-SA-10-02` | "That boundary sits in the pipeline rather than in this screen" (anonymisation) | Real, structural — Task 9's own §15.2 self-audit already established shape-level enforcement, which is what this criterion asks for — but the bare token isn't cited anywhere. Untracked. |
| `AC-SA-10-03` | The anonymisation boundary/pipeline placement (metrics-specific framing) | Present nowhere except `disclosure-gaps.ts`'s gaps list (not evidence — see method note above). Genuinely uncited. Untracked. |
| `AC-SA-10-04` | Names the override-patterns measure as one of the fifteen named per-tenant measures | The fifteen-measures citation (`L45134`) is real and restored; this specific measure's own id was not separately carried. Untracked. |
| `AC-SA-20-3-01` | "No Boolean blocked field exists… blocking is expressed only through the three suspension states" | Ties to the same removed-Block gap as `WF-PLT-004`/`WF-PLT-005` (see the main report). Untracked. |
| `OBJ-SA-METRIC` | L45180 (verified `sed -n '45180p'`), verbatim: `States: Measure: current → stale → unavailable → reconciled` | **Deliberately superseded.** The outgoing screen's OWN comment (not the source line itself) described this as "driven off the seeded screen state rather than computed" — a fake, reviewer-controlled state simulation. `TenantMetricsScreen.tsx`'s current header comment already records removing exactly that mechanism ("dropped outright… this rebuild's write path is real"). Untracked. |
| `SCR-SA-13` (L42805) | Screen annotation for the approval-queue screen | **Genuinely absent — not comment-preserved.** Unlike `SCR-SA-01`/`-11`/`-12`/`-14`/`-15`, which each still appear as a comment-only screen annotation somewhere in the current tree, `SCR-SA-13` appears nowhere at all, comment or code. Low-severity: it is a numbering cross-reference ("screen annotations, never route keys"), not a fact or decision, so nothing capability-bearing was lost — but the honest statement is "absent," not "same established treatment as the others." Untracked. |
| `SCR-SA-16` | Screen annotation for the tenant-metrics screen | Same as `SCR-SA-13` — genuinely absent from the current tree, comment or code, not merely comment-only. Untracked. |
| `FB-SA-02` | "The approval write failed… nothing here is treated as decided" | Real fallback fact; the rebuild's `WriteResult` `denied`/`persistence-unavailable` arms plus the inline `feedback` banner are the honest replacement mechanism (Task 7's own table), but the bare `FB-SA-02` token is not reused. Untracked. |
| `SA-MOD-09-STORYBOARD` (outgoing `TenantsScreen.tsx`) and `SA-MOD-01-STORYBOARD` (outgoing `OverviewScreen.tsx:69`) | `const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-MOD-0N-STORYBOARD'))` | Fixture-state ids — internal scenario-run labels the outgoing screens' own now-deleted fake state-simulation used to seed a reviewer-controlled display state. **Not a test** (this repository has none, per APP-020) and not a source citation of anything; nothing to relocate. Corrected wording from the previous revision, which called this "test scaffolding." |
| `L21021` | A change breaching a floor/invariant is rejected regardless of approver, root included | Structurally still true (the write floor binds every role including root, per Task 6/7's own review record tracing `evaluate.ts`) but this is an architectural fact about the write floor, not a decision this SCREEN makes — no natural `sourceRefs` home on this file. Untracked. |
| `L44917` | Suspension is a three-state machine of graded restraint, not on-off | No suspension control exists. Untracked. |
| `L46451` | No control reaches inside a tenant; root bound identically | Consistent with the rebuilt screens' actual scope; not explicitly re-asserted anywhere. Untracked. |
| `L46708` | Device command-sequence reporting for an offline device | Device-level, out of scope for the Super Admin tenant screens. Untracked. |
| `L75557` | "Outstanding step: the first Tenant Admin has not accepted… cannot leave its safe draft state" | **Superseded by real behaviour.** The outgoing screen stated this as static prose; Task 8 built the actual `AcceptInvitationScreen.tsx` that enacts exactly this precondition structurally. Untracked. |
| `L55552` | Console account creation, role-assignment and disable are all root-only | Creation is real (`inviteConsoleUser`, root-only, cited). Role-assignment and disable have no control in the rebuilt screen at all (out of Task 7's stated scope; verified — no "disable"/"role-assignment" control exists in `ConsoleUsersScreen.tsx`). Untracked. |
| `L55895` | Backs the outgoing screen's `approveDecision` (root-eligibility for approval) | Folded into `decisionGate`'s existing citations; this specific bare line number was not additionally carried. Untracked. |
| `L55897`, `L55985` | "Approved-not-applied" and "approved-not-executed" are distinct, real states, never called "applied" | The rebuild's `ApprovalRequest.result` states already preserve this distinction structurally (no state is ever labelled "applied"); untracked, uncited literally. |
| `L56008` (backs `WF-ROLE-020`) | "The root declining a critical-class request" | `WF-ROLE-020` itself is already demonstrated (`decisionGate`'s critical branch). Its own line locator was not separately carried; no census effect either way. |
| `L56011` | Decline requires a mandatory reason the source never specifies the content of | Matches the rebuild's own documented choice (no reason field drawn, "records the act without claiming compliance it did not obtain" — Task 7's own comment). Untracked. |
| `L20728` | Backs `SB-RBAC-01` | See `SB-RBAC-01` above. |
| `L42804` | Backs `SCR-SA-12` | `SCR-SA-12` itself DOES still appear as a comment-only screen annotation in `ConsoleUsersScreen.tsx` and `TenantsScreen.tsx` — only its specific line number was not separately carried. Untracked. |
| `L44774` | Backs `SB-SA-08` | `SB-SA-08` must NOT be cited — the build follows the CONTRADICTING storyboard `SB-31-10`; citing the line that backs the rejected reading would misattribute. Untracked, correctly excluded. |
| `L45228` | Backs `FB-SA-01` in the metrics-specific ladder context ("FB-SA-01 is the whole of the ladder: stale with its age, then narrowed, then measure unavailable") | **Corrected.** `FB-SA-01` does NOT appear anywhere in `TenantMetricsScreen.tsx` — verified `grep -n "FB-SA-01" app/super-admin/tenant-metrics-and-aggregates/TenantMetricsScreen.tsx` returns nothing. It IS comment-only in `OverviewScreen.tsx` (lines 72, 433) and `TenantsScreen.tsx` (line 72) — a DIFFERENT screen, for the aggregate-honesty rule those screens' own KPI tiles implement, not for anything in the metrics screen. For THIS screen's own ladder (stale/unknown/measure-unavailable tile states), the fact is realized in `StatTileData`'s own kind system, uncited by this specific token, anywhere. Untracked. |
| `L45230` | Backs `AC-SA-10-03` (anonymisation precedes aggregation) | See `AC-SA-10-03` above — present nowhere but the gaps ledger. Untracked. |

## Over-claiming found — two orphaned `fixtures.ts` files (unchanged)

| File deleted | Falsely-demonstrated rows | Why the fact isn't real on the rebuilt screen |
|---|---|---|
| `app/super-admin/platform-overview-and-health/fixtures.ts` (344 lines) | `ai-storyboards:SB-RISK-01`, `ai-storyboards:SB-SCHED-17`, `workflows:SB-SCHED-17` | Platform health / fleet telemetry / agent health / review cadence / tenant connectivity aggregate panels, and a site-wide connectivity-loss incident tracker — none of which the rebuilt KPI row implements. |
| `app/super-admin/tenants-lifecycle-and-pilots/fixtures.ts` (544 lines) | `scheduled-work:SCHED-022`, `scheduled-work:SCHED-023`, `workflows:WF-PLT-004`, `workflows:WF-PLT-005` | `WF-PLT-005` directly contradicted Task 6's own binding ruling removing it. `WF-PLT-004` is not built (see table above). `SCHED-022`/`SCHED-023` have no day-count/expiry-evaluation logic anywhere. |

## What is NOT in the absent table, and why: the facts already known realized in code

`L107350`, `L107315`, `L45160`, `L45162`, `L45173`, `L45201`, `L45136`, `L45202`, `L21098`,
`L97154`, `L97155` all resolve to PRESENT under this document's method — each is either a real
`sourceRefs` entry (`TenantMetricsScreen.tsx:432,445`) or a bare line locator whose underlying fact
is realized in real, non-comment code (`FreshnessStamp`, `windowFor()`, the real period `<select>`)
even though the literal token itself sits only in a comment. None of the eleven is in the absent
table above, correctly, because the presence check (`grep -rl -F`) finds them. This document does
not separately re-assert their homes beyond that — the main task report carries the detail on
which are `sourceRefs` and which are comment-only-with-a-real-underlying-fact (`SB-SA-10` is the
one bare token among these with no non-decorative code home at all, discussed there, not here).

## §8.6.2 scan — every file this unit shipped or rebuilt (unchanged from fix round 1)

Scanned: every `.ts`/`.tsx` file in `git diff --name-only 5f58237..83caf49 -- app src` (43 files).
Two violations found and fixed: `AC-SA-09-01` removed from `TenantsScreen.tsx`'s rendered
`emptyState.whatCreatesIt`; `MOD-SA-08` removed from `OverviewScreen.tsx`'s rendered
`CRITICAL_APPROVALS_UNKNOWN_REASON`. Seven `APP-012` occurrences render (2 in
`AcceptInvitationScreen.tsx`, 4 in `ConsoleUsersScreen.tsx`, 1 in `TenantMetricsScreen.tsx`) — not
violations, a standing programme-mandated phrase pre-dating this unit. `AppShell.tsx`'s mandated
`NOT_REAL_TEXT` disclosure and `StoryboardSignInPanel.tsx`'s self-labelled `data-demo` reviewer
panel both use "seeded"/"storyboard"/"fixture" but are required copy / chrome, not the product, and
not the class of build-process leakage this unit's own prior fixes removed. `app/coverage/**`,
`app/workflows/**` and `DemoChrome.tsx`'s "registry"/"reviewer"/"census" vocabulary is the literal
subject matter of those reviewer-tooling screens, out of §8.6.2's product-screen scope.

Dropped, because it proved nothing: the earlier claim of confirming these two fixes in the built
static export. Both routes are client-rendered behind `RequireSession`; their server-rendered HTML
is ~12.5KB of script tags around a "Preparing the platform console…" loading state — no screen
string could ever appear there.

Recorded, not this unit's to fix: `out/super-admin/console-users-roles-and-change-approvals/index.html`
DOES render blueprint locators (`L91282`, `L91304`, `L91305`, `L91309`,
`AC-43-301`/`AC-43-302`/`AC-43-356`) from a pre-existing slice-11 `AiDegradationOverlay` mounted by
that route's `page.tsx` — a file outside this unit's diff. "Zero blueprint locators render" is true
of every file this unit shipped or rebuilt, not of the delivered page as a whole.

## Census, before and after

`registries/generated/ai-storyboards.json` was last committed at `524b366` (Task 7 fix round 2)
and never recommitted, even though Task 9 rewrote `TenantMetricsScreen.tsx` afterward. Regenerating
from `83caf49`'s actual source shows `SB-SA-10` as `not-represented`, not the `demonstrated` the
committed file reads.

| State | demonstrated | Note |
|---|---|---|
| Committed at `83caf49` (stale) | **284** | `SB-SA-10` incorrectly still reads demonstrated |
| True regeneration from `83caf49`'s source | 283 | `SB-SA-10` correctly not-represented |
| After over-claiming fix (two orphaned `fixtures.ts` deleted, seven rows) | 276 | `ai-storyboards` 84→82, `workflows` 70→67, `scheduled-work` 3→1 |
| After under-claiming fix (`WF-ROLE-018` restored) | **277** | `workflows` 67→68 |

Net: 284 → 277, eight rows across three distinct events — one pre-existing stale-registry
correction, seven over-claiming removals, one under-claiming restoration. Final, by registry:
modules 69, features 6, sub-features 1, functions 21, workflows 68, business-use-cases 2,
business-objects 6, events 0, commands 2, notifications 3, offline-scenarios 0, ai-storyboards 82,
scheduled-work 1, actionable-controls 16. Total rows 5015 unchanged; not-represented 4706; mounted
10; not-applicable 22. None of the 47 absent-set rows above moves this number further — 45 are
untracked by any registry, and the two tracked ones (`WF-PLT-004`, `SB-RBAC-01`) were already
resolved as part of the 284→277 arithmetic before this revision.

## `pnpm ledger:reconcile`

Unchanged by any of this task's work: registry census 5,015 rows, live-verification ledger 0 rows,
Direction A (uncovered) 5,015 of 5,015, Direction B (orphaned) 0. See the accompanying report.
