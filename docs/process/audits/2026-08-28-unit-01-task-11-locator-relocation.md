# Unit 1, Task 11 — locator relocation and registry reconciliation

Frozen source: `AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines. Unchanged.

**Revision note (third correction).** Round one delegated to four reports and claimed no locator
was unaccounted for — false. Round two enumerated the absent set but still claimed a completeness
it didn't have, left 158 present tokens as an unenumerated aggregate, and named a home
(`FB-SA-01`/`AC-SA-10-03` "in `TenantMetricsScreen.tsx`") that didn't exist. Round two's fix
introduced a THIRD version of the same failure: it stated "the count is what the regex finds, not
a curated list" while actually reporting a hand-curated number (199 raw / 178 distinct) — running
the stated regex over the stated files produces **551 raw matches, 232 distinct tokens**, not 199
and 178. The gap was real, silent curation: an implicit prefix filter had already been applied
before the count was written down, and the sentence disclaiming curation was false. This revision
publishes the actual regex output, states the filter explicitly instead of denying one exists, and
gives the command so a reader gets the same numbers.

**Method, exact and reproducible — corrected.**

Step 1. For each of the four rebuilds, read the outgoing file via `git show <base>:<path>` at the
commit immediately before the rebuild's first commit (Overview `2289c8d`, Tenants list `0db53b6`,
Console users & approvals `51c84ab`, Tenant metrics `f68b0c2`).

Step 2. Extract with:
```
node -e 'const idRe=/[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g; const lineRe=/\bL\d{4,6}\b/g; /* match against each outgoing file, sum */'
```
Run exactly as stated, over the four files exactly as named: **551 raw matches, 232 distinct
tokens.** This includes everything the regex matches — real blueprint identifiers, but also
whatever else happens to be shaped like `Capitalised-Hyphenated-Word`.

Step 3. **The filter, stated rather than denied.** Not every 232-token match is a source citation.
Three classes are excluded, and here is the rule that identifies each, not just examples of it:

- **Build-internal state ids** — `STATE-\d+` (13 distinct: `STATE-01`…`STATE-13`), the outgoing
  screens' own thirteen-member `ScreenStateId` enum literal, a UI-simulation label, not a frozen-
  source identifier.
- **Fixture, demo and scenario ids** (23 distinct) — tokens naming a SEEDED ROW or a REVIEWER-FACING
  TICKET/SCENARIO rather than a blueprint locator: tenant names (`TEN-BRIGHTBIKES`,
  `TEN-CLEARWATER`, `TEN-NORTHFORGE`), role-fixture labels (`ROLE-PLAT-ROOT`, `ROLE-PLAT-SUP`),
  surface tags (`SURF-SA`), scenario-run/ticket/audit-row ids invented by the outgoing screen's own
  fixtures or narrative examples (`CHK-014`, `TCK-4471`, `AUD-SA-88120`, `CR-4475`, `INV-2291`,
  `SA-REQ-0091`, `CA-03`, `CA-04`, `TAB-033`, `TAB-041`, `FIXTURE-CONSOLE-OPERATOR`,
  `ACT-UNATTRIBUTED`, `AGG-OPEN-INCIDENTS`), the two module-slug labels
  (`SA-08-CONSOLE-USERS`, `SA-10-TENANT-METRICS`), and the two fixture-state scenario ids
  (`SA-MOD-01-STORYBOARD`, `SA-MOD-09-STORYBOARD` — corrected from round two's "test scaffolding":
  this repository has no test cases per APP-020; these are `scenarioRunId()` arguments, a
  fixture-state label, nothing else).
- **Prose hyphenations** (20 distinct) — ordinary English compound words the regex cannot
  distinguish from an identifier because both are `Capitalised-Word` shapes: `Agent-run`,
  `Composed-agent`, `Connectivity-loss`, `Critical-class`, `Cross-tenant`, `Four-role`,
  `Last-activity`, `Last-known-good`, `Non-pilots`, `Per-control`, `Per-tenant`, `Queue-standing`,
  `Re-aggregated`, `Re-aggregating`, `Re-aggregation`, `Read-only`, `Regulated-Industry`,
  `Users-pane`, `View-switcher`, `Worker-Shifts`.

**The rule that separates these from a real citation: a blueprint-shaped identifier's prefix is one
of the families the frozen source and this build's own fourteen registries actually use** — `AC-`,
`WF-`, `SB-`, `OBJ-`, `FEAT-`, `MOD-`, `SCR-`, `NOTIF-`, `PER-`, `TRN-`, `FB-`, `DEC-`, `INC-`,
`SCHED-`, `SUB-`, `UC-`, `CMD-`, `EVT-`, `APP-` — **or a bare line locator, `L` followed by 4-6
digits.** Applying that rule mechanically (not adjusted after the fact to preserve any prior
number): **56 distinct tokens excluded, 176 distinct tokens kept** (336 of the 551 raw matches).
Reproduce with the extraction above, filter each match against the prefix list, and count.

Step 4. Presence-check the 176 kept tokens against the current tree:
```
grep -rl -F -- "<token>" app src
```
**`src/coverage/disclosure-gaps.ts` is excluded from counting as evidence of a home.** That file is
`AC_CITED_IN_PRODUCT_NOT_IN_TESTS`, a whole-project GAPS LEDGER — a list of ids the project's own
(now-deleted) test suites never covered. Appearing in it means "known coverage gap," the opposite
of a citation. Eight of the 176 kept tokens exist nowhere else in the repository.

Result: **130 of the 176 kept, blueprint-shaped tokens are present** in `app/`+`src/` (a file other
than `disclosure-gaps.ts` names them) — not hand-enumerated here; a token the command above finds
is by definition not lost, and writing 130 rows by hand would be 130 new chances to misstate one,
which is the defect this document exists to stop repeating. **46 are absent as evidence.** Every one
is named below with its verified resolution. `registries/blueprint-locators.json` is not accepted
as a home for any of them — a slice-11 index of the frozen source, unchanged since `3f24a7c`,
holding every blueprint id automatically regardless of whether this build does anything with it.
`src/data/collections/tours.json` holds zero blueprint locators, so "tour narration" is not a home
for anything here either.

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
| `WF-ROLE-018` (L55961) | Live in the outgoing screen's critical-branch citation: "Initiating a critical-class action belongs to the Admin and the root." The outgoing gate covered BOTH halves — an Admin-drafted critical action, and root's exclusive authority to decide it. | `ConsoleUsersScreen.tsx`'s `decisionGate`, critical-class branch: `sourceRefs: [...,'WF-ROLE-018','L55961',...]`. This gate governs the DECIDE half only (`approverAllowedRoles('critical')` returning `['ROOT_SUPER_ADMIN']`). **The INITIATION half — an Admin drafting/proposing a critical-class action as its own gated act — has no control anywhere in the rebuild**: the Change-approvals section reads an already-created `ApprovalRequest`; nothing on it creates one. That half is not demonstrated and the citation does not claim it is. **Census: `workflows:WF-ROLE-018` demonstrated** (decide-half only). |
| `L55918` | Live in the outgoing screen's `returnDecision` (`sourceRefs: ['L23707','L55918']`) | `decisionGate`, engineering branch: `sourceRefs: [...,'UC-HO-02','L55918',...]`. The outgoing screen had `returnDecision` separate from `approveDecision`; the rebuild merged both, which is why the citation had nowhere obvious to land. Bare line locator — no census effect. |
| `L23707` | Backs `SB-HO-004`, already cited on `criticalViewerGate` — the line number itself was missing | `criticalViewerGate`: `sourceRefs: ['SB-HO-004', 'L23707', 'AC-SA-08-06', '§8.8.3']`. No census effect. |

## The absent set — all 46 distinct tokens, resolved

Two are tracked registry ids (`WF-PLT-004`, `SB-RBAC-01`); the other 44 are not tracked by any of
the fourteen registries, so their resolution has **no census effect** — named because §24.3
requires every locator accounted for, not because any moves a number.

| Locator | Source line reads (verbatim where quoted) | Resolution |
|---|---|---|
| `WF-PLT-004` (workflows, tracked) | L55108 region: "Applying soft and hard tenant suspension" | **Honestly dropped.** `TenantDetailScreen.tsx`'s only lifecycle action is `Activate`; suspension states render read-only, never set. Falsely `demonstrated` via the orphaned `tenants-lifecycle-and-pilots/fixtures.ts`, deleted this task. |
| `L55108` | Outgoing `TenantsScreen.tsx:509`: "WF-PLT-004 is a workflow and names no control" | Backs `WF-PLT-004` above; same resolution. |
| `SB-RBAC-01` (ai-storyboards, tracked) | L20728: the console Roles pane — a live per-module four-role matrix, CSV export, root-only edit | **Correctly not-represented.** The "live per-module Roles-matrix pane" Task 7's own report already disclosed as out of scope. Same gap under a different id, not a new finding. |
| `L20728` | Backs `SB-RBAC-01` | Same resolution. |
| `AC-4810` | L107368 (verified `sed -n '107368p'`): "Every telemetry emission is validated against the cardinality allow-list, and an emission carrying a prohibited dimension fails the build rather than being dropped at runtime." | Structurally plausible (no worker-identity/free-text dimension exists to violate this, consistent with the sibling rule at `L107315` already restored) but no build-time gate enforces it specifically, and the only place `AC-4810` exists in the repository is `disclosure-gaps.ts`'s own gaps list — corroborating it is uncovered, not citing it. Untracked. |
| `L107368` | Backs `AC-4810` | Same resolution. |
| `AC-SA-08-07` | L44881: every approval request carries nine fields, commits with its audit event in one transaction | Real, structurally true (the repository's atomic `commitWrite` appends the audit row in the same snapshot as the row update) but uncited; not a permission decision, no non-decorative code slot. Untracked. |
| `L44881` | Backs `AC-SA-08-07` | Same resolution. |
| `AC-SA-08-08` | L44882: a pending change renders as pending on the target object as well as in the queue | **Not built.** The rebuild renders pending state in the queue only; no other screen cross-renders a pending badge on the affected object. Untracked. |
| `L44882` | Backs `AC-SA-08-08` | Same resolution. |
| `AC-SA-08-10` | L44884: the implementation-authoring role's provisioning/revocation appears in both audit streams | Out of Task 7's own stated scope. Only repository occurrence is `disclosure-gaps.ts`'s gaps list. Untracked. |
| `L44884` | Backs `AC-SA-08-10` | Same resolution. |
| `AC-SA-09-06` | Compliance suspension blocks logins, stops runs, locks devices with a fixed message | No suspension control of any kind exists on the current screen. Untracked. |
| `AC-SA-09-07` | L45098: compliance suspension is critical-class, cannot be applied on an Admin's authority alone | Same — no suspension control exists. Untracked. |
| `L45098` | Backs `AC-SA-09-07` | Same resolution. |
| `AC-SA-09-08` | No entry into a compliance-suspended tenant outside the dual-authorised path | Same. Untracked. |
| `AC-SA-09-09` | L45100: every suspension transition writes tenant-state history and is audited | Same. Untracked. |
| `L45100` | Backs `AC-SA-09-09` | Same resolution. |
| `AC-SA-09-10` | L45052 region: a device lock is never rendered as taking effect before the device's own acknowledgement | Device-level (Frontline/DOH) fact; no device UI on the Super Admin tenant screens. Untracked. |
| `L45052` | Backs `AC-SA-09-10` (and names `FUNC-SA-09-02-C1`, the "Block" control detail — the same removed workflow as `WF-PLT-005`) | Same resolution as `AC-SA-09-10`; also ties to the already-removed Block control. |
| `AC-SA-09-14` | "Visibility, not intervention" — no operational action of any kind on this page | **Superseded, not lost.** True of the OLD document-style screen. The rebuilt screens deliberately ADD real actions (Create tenant, Activate) per master prompt §12.6 — this criterion describes a capability state this build intentionally moved past. Untracked. |
| `AC-SA-10-02` | "That boundary sits in the pipeline rather than in this screen" (anonymisation) | Real, structural — Task 9's own §15.2 self-audit already established shape-level enforcement — but the bare token isn't cited anywhere. Untracked. |
| `AC-SA-10-03` | The anonymisation boundary/pipeline placement, metrics-specific framing | **Corrected in round two.** Present nowhere except `disclosure-gaps.ts`'s gaps list — not `TenantMetricsScreen.tsx`, which does not contain this token at all. Untracked. |
| `L45230` | Backs `AC-SA-10-03` | Same resolution. |
| `AC-SA-10-04` | Names the override-patterns measure as one of the fifteen named per-tenant measures | The fifteen-measures citation (`L45134`) is real and restored; this specific measure's own id was not separately carried. Untracked. |
| `AC-SA-20-3-01` | "No Boolean blocked field exists… blocking is expressed only through the three suspension states" | Ties to the same removed-Block gap as `WF-PLT-004`/`WF-PLT-005`. Untracked. |
| `OBJ-SA-METRIC` | L45180 (verified `sed -n '45180p'`), verbatim: `States: Measure: current → stale → unavailable → reconciled` | **Deliberately superseded.** The outgoing screen's OWN comment (not this source line) described this as "driven off the seeded screen state rather than computed" — a fake, reviewer-controlled state simulation. `TenantMetricsScreen.tsx`'s current header comment already records removing exactly that mechanism. Untracked. |
| `L45180` | Backs `OBJ-SA-METRIC` | Same resolution. |
| `SCR-SA-13` | L42805: screen annotation for the approval-queue screen | **Genuinely absent — not comment-preserved.** Unlike `SCR-SA-01`/`-11`/`-12`/`-14`/`-15`, which each still appear as a comment-only screen annotation somewhere in the current tree, `SCR-SA-13` appears nowhere at all. Low-severity: a numbering cross-reference, not a fact or decision — nothing capability-bearing was lost. Untracked. |
| `L42805` | Backs `SCR-SA-13` | Same resolution. |
| `SCR-SA-16` | Screen annotation for the tenant-metrics screen | Same as `SCR-SA-13` — genuinely absent from the current tree, comment or code. Untracked. |
| `FB-SA-02` | "The approval write failed… nothing here is treated as decided" | Real fallback fact; the rebuild's `WriteResult` `denied`/`persistence-unavailable` arms plus the inline `feedback` banner are the honest replacement mechanism, but the bare `FB-SA-02` token is not reused. Untracked. |
| `L21021` | A change breaching a floor/invariant is rejected regardless of approver, root included | Structurally still true (the write floor binds every role including root, per Task 6/7's own review record tracing `evaluate.ts`) but an architectural fact about the write floor, not a decision this screen makes — no natural `sourceRefs` home. Untracked. |
| `L44917` | Suspension is a three-state machine of graded restraint, not on-off | No suspension control exists. Untracked. |
| `L46451` | No control reaches inside a tenant; root bound identically | Consistent with the rebuilt screens' actual scope; not explicitly re-asserted anywhere. Untracked. |
| `L46708` | Device command-sequence reporting for an offline device | Device-level, out of scope for the Super Admin tenant screens. Untracked. |
| `L75557` | "Outstanding step: the first Tenant Admin has not accepted… cannot leave its safe draft state" | **Superseded by real behaviour.** The outgoing screen stated this as static prose; Task 8 built the actual `AcceptInvitationScreen.tsx` that enacts exactly this precondition structurally. Untracked. |
| `L55552` | Console account creation, role-assignment and disable are all root-only | Creation is real (`inviteConsoleUser`, root-only, cited). Role-assignment and disable have no control in the rebuilt screen at all (verified: no such control exists in `ConsoleUsersScreen.tsx`; out of Task 7's stated scope). Untracked. |
| `L55895` | Backs the outgoing screen's `approveDecision` (root-eligibility for approval) | Folded into `decisionGate`'s existing citations; this specific bare line number was not additionally carried. Untracked. |
| `L55897` | "Approved-not-applied" is a distinct, real state, never called "applied" | The rebuild's `ApprovalRequest.result` states already preserve this distinction structurally; untracked, uncited literally. |
| `L55985` | "Approved-not-executed" — same distinction, the executed half | Same resolution as `L55897`. |
| `L56008` | Backs `WF-ROLE-020` ("the root declining a critical-class request") | `WF-ROLE-020` itself is already demonstrated (`decisionGate`'s critical branch). Its own line locator was not separately carried; no census effect either way. |
| `L56011` | Decline requires a mandatory reason the source never specifies the content of | Matches the rebuild's own documented choice (no reason field drawn, "records the act without claiming compliance it did not obtain"). Untracked. |
| `L42804` | Backs `SCR-SA-12` | `SCR-SA-12` DOES still appear as a comment-only screen annotation in `ConsoleUsersScreen.tsx` and `TenantsScreen.tsx` — only its line number was not separately carried. Untracked. |
| `L44774` | Backs `SB-SA-08` | `SB-SA-08` must NOT be cited — the build follows the CONTRADICTING storyboard `SB-31-10`; citing the line backing the rejected reading would misattribute. Untracked, correctly excluded. |
| `L45228` | Backs `FB-SA-01` in the metrics-specific ladder context | **Corrected in round two.** `FB-SA-01` does not appear anywhere in `TenantMetricsScreen.tsx` (verified). It IS comment-only in `OverviewScreen.tsx` (lines 72, 433) and `TenantsScreen.tsx` (line 72) — a different screen, a different rule (aggregate-honesty, not the metrics ladder). For this screen's own ladder (stale/unknown/measure-unavailable), the fact is realized in `StatTileData`'s own kind system, uncited by this specific token, anywhere. Untracked. |

**Excluded, not counted above** (fixture-state ids, mentioned for transparency, not blueprint
locators under the stated rule): `SA-MOD-01-STORYBOARD` (outgoing `OverviewScreen.tsx:69`) and
`SA-MOD-09-STORYBOARD` (outgoing `TenantsScreen.tsx`) — both `scenarioRunId()` arguments seeding the
outgoing screens' now-deleted fake reviewer-controlled state display. Not a source citation of
anything; nothing to relocate.

## Over-claiming found — two orphaned `fixtures.ts` files (unchanged)

| File deleted | Falsely-demonstrated rows | Why the fact isn't real on the rebuilt screen |
|---|---|---|
| `app/super-admin/platform-overview-and-health/fixtures.ts` (344 lines) | `ai-storyboards:SB-RISK-01`, `ai-storyboards:SB-SCHED-17`, `workflows:SB-SCHED-17` | Platform health / fleet telemetry / agent health / review cadence / tenant connectivity aggregate panels, and a site-wide connectivity-loss incident tracker — none of which the rebuilt KPI row implements. |
| `app/super-admin/tenants-lifecycle-and-pilots/fixtures.ts` (544 lines) | `scheduled-work:SCHED-022`, `scheduled-work:SCHED-023`, `workflows:WF-PLT-004`, `workflows:WF-PLT-005` | `WF-PLT-005` directly contradicted Task 6's own binding ruling removing it. `WF-PLT-004` is not built. `SCHED-022`/`SCHED-023` have no day-count/expiry-evaluation logic anywhere. |

## What is NOT in the absent table, and why: facts already known realized in code

`L107350`, `L107315`, `L45160`, `L45162`, `L45173`, `L45201`, `L45136`, `L45202`, `L21098`,
`L97154`, `L97155` all resolve to PRESENT under this document's method — each is either a real
`sourceRefs` entry (`TenantMetricsScreen.tsx:432,445`) or a bare line locator whose underlying fact
is realized in real, non-comment code (`FreshnessStamp`, `windowFor()`, the real period `<select>`)
even though the literal token sits only in a comment. None is in the absent table because the
presence check finds them. The main task report carries which are `sourceRefs` and which are
comment-only-with-a-realized-fact (`SB-SA-10` is the one bare token among these with no
non-decorative code home at all, discussed there).

## §8.6.2 scan — every file this unit shipped or rebuilt (unchanged from fix round 1)

Scanned: every `.ts`/`.tsx` file in `git diff --name-only 5f58237..83caf49 -- app src` (43 files).
Two violations found and fixed: `AC-SA-09-01` removed from `TenantsScreen.tsx`'s rendered
`emptyState.whatCreatesIt`; `MOD-SA-08` removed from `OverviewScreen.tsx`'s rendered
`CRITICAL_APPROVALS_UNKNOWN_REASON`. Seven `APP-012` occurrences render (2 in
`AcceptInvitationScreen.tsx`, 4 in `ConsoleUsersScreen.tsx`, 1 in `TenantMetricsScreen.tsx`) — not
violations, a standing programme-mandated phrase pre-dating this unit. `AppShell.tsx`'s mandated
`NOT_REAL_TEXT` disclosure and `StoryboardSignInPanel.tsx`'s self-labelled `data-demo` reviewer
panel both use "seeded"/"storyboard"/"fixture" but are required copy / chrome, not the product.
`app/coverage/**`, `app/workflows/**` and `DemoChrome.tsx`'s "registry"/"reviewer"/"census"
vocabulary is the literal subject matter of those reviewer-tooling screens, out of §8.6.2's
product-screen scope.

Dropped, because it proved nothing: the earlier claim of confirming these two fixes in the built
static export — both routes are client-rendered behind `RequireSession`; server-rendered HTML is
~12.5KB of script tags around a "Preparing the platform console…" loading state.

Recorded, not this unit's to fix: `out/super-admin/console-users-roles-and-change-approvals/index.html`
DOES render blueprint locators (`L91282`, `L91304`, `L91305`, `L91309`,
`AC-43-301`/`AC-43-302`/`AC-43-356`) from a pre-existing slice-11 `AiDegradationOverlay` mounted by
that route's `page.tsx` — a file outside this unit's diff.

## Census, before and after

`registries/generated/ai-storyboards.json` was last committed at `524b366` and never recommitted,
even though Task 9 rewrote `TenantMetricsScreen.tsx` afterward. Regenerating from `83caf49`'s
actual source shows `SB-SA-10` as `not-represented`, not the `demonstrated` the committed file
reads.

| State | demonstrated | Note |
|---|---|---|
| Committed at `83caf49` (stale) | **284** | `SB-SA-10` incorrectly still reads demonstrated |
| True regeneration from `83caf49`'s source | 283 | `SB-SA-10` correctly not-represented |
| After over-claiming fix (two orphaned `fixtures.ts` deleted, seven rows) | 276 | `ai-storyboards` 84→82, `workflows` 70→67, `scheduled-work` 3→1 |
| After under-claiming fix (`WF-ROLE-018` restored) | **277** | `workflows` 67→68 |

Net: 284 → 277, eight rows across three distinct events. Final, by registry: modules 69, features
6, sub-features 1, functions 21, workflows 68, business-use-cases 2, business-objects 6, events 0,
commands 2, notifications 3, offline-scenarios 0, ai-storyboards 82, scheduled-work 1,
actionable-controls 16. Total rows 5015 unchanged; not-represented 4706; mounted 10;
not-applicable 22. None of the 46 absent-set rows above moves this number further — 44 are
untracked by any registry, and the two tracked ones (`WF-PLT-004`, `SB-RBAC-01`) are already
folded into the 284→277 arithmetic.

## `pnpm ledger:reconcile`

Unchanged by any of this task's work: registry census 5,015 rows, live-verification ledger 0 rows,
Direction A (uncovered) 5,015 of 5,015, Direction B (orphaned) 0. See the accompanying report.
