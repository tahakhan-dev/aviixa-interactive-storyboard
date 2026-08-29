# Unit 1, Task 11 — locator relocation and registry reconciliation

Frozen source: `AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines. Unchanged.

**Revision note:** this document's first version delegated to four task reports by name and
row-count instead of enumerating locators, and stated "no locator was found unaccounted for,"
which review disproved: 41 of ~180 identifier-shaped tokens extracted from the four outgoing
screens were absent from `app/`+`src/`, only two were tracked registry ids, and two more were live
`sourceRefs` on the outgoing console screen with no replacement. This version is the actual table,
built by reconstructing all four outgoing screens from git, extracting every identifier-shaped
token and blueprint line locator, and resolving each against the current tree — not a pointer to
other documents.

**Method.** For each of the four rebuilds, the outgoing file was read via `git show <base>:<path>`
at the commit immediately before the rebuild task's first commit (Overview `2289c8d`, Tenants list
`0db53b6`, Console users & approvals `51c84ab`, Tenant metrics `f68b0c2`). Every token matching
`[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+` and every bare line locator (`L\d{4,6}`) was extracted, then
checked against the current `app/`+`src/` tree (`grep -rl`, literal string) and against all
fourteen registries (`registries/generated/*.json`, by `id`). `registries/blueprint-locators.json`
was NOT accepted as a home — it is a slice-11 index of the frozen source, unchanged since `3f24a7c`,
and holds every blueprint id automatically regardless of whether this build does anything with it.
`registries/raw/tours.json`/`src/data/collections/tours.json` were checked and hold zero blueprint
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

## The complete relocation table

199 raw token occurrences were extracted across the four outgoing files (many ids repeat across
screens or appear as both an id and its line number). Of these, **158 resolve to real code, a
`sourceRefs` array, or a module-lookup key in the current tree.** The remaining set — every token
absent from `app/`+`src/` — is enumerated below in full, one row per token, with its verified
current status.

**Two of the 41 originally-absent tokens are FIXED IN THIS REVISION** (restored to real code,
this task's own diff, on top of commit `9ccf71a`):

| Locator | Was | Now lives at |
|---|---|---|
| `WF-ROLE-018` (L55961) | Live in the outgoing screen's `approveDecision`/critical-branch citation ("Initiating a critical-class action belongs to the Admin and the root") | `ConsoleUsersScreen.tsx`'s `decisionGate`, critical-class branch: `sourceRefs: [...,'WF-ROLE-018','L55961',...]`. Governs exactly this fact: `approverAllowedRoles('critical')` returns `['ROOT_SUPER_ADMIN']` only — the code `approverAllowedRoles` already enforced this; only the citation was missing. **Census: `workflows:WF-ROLE-018` demonstrated (was not-represented).** |
| `L55918` | Live in the outgoing screen's `returnDecision` (`sourceRefs: ['L23707','L55918']`) — the Admin-return-of-an-engineering-item fact | `ConsoleUsersScreen.tsx`'s `decisionGate`, engineering branch: `sourceRefs: [...,'UC-HO-02','L55918',...]`. The outgoing screen had `returnDecision` as a separate function from `approveDecision`; the rebuild merged both into one `decisionGate`, which is why the citation had nowhere obvious to land and was dropped rather than merged forward. Not a separately tracked registry row (bare line locator) — no census effect, but real evidence restored. |

**One correction to a citation already present, also in this diff:**

| Locator | Correction |
|---|---|
| `L23707` | Backs `SB-HO-004` (already cited on `criticalViewerGate`) — "where the viewer is not the root, the action bar is replaced with the sentence…" — but the line number itself was never added. Now `sourceRefs: ['SB-HO-004', 'L23707', 'AC-SA-08-06', '§8.8.3']`. No census effect (bare line locator). |

**The remaining 39 tokens**, none restorable without either misattributing permission authority,
fabricating a scanner-only container, or rebuilding a control this unit's own rulings already
removed. Two are tracked registry ids; the other 37 are not tracked by any of the fourteen
registries at all (fine-grained sub-criteria, screen annotations, or bare line locators), so their
resolution has **no census effect** — they are enumerated because §24.3 requires every locator
named, not because any of them move a number.

| Locator | Source line reads | Resolution |
|---|---|---|
| `WF-PLT-004` (workflows, tracked) | "Applying soft and hard tenant suspension" | **Honestly dropped.** `TenantDetailScreen.tsx`'s only lifecycle action is `Activate`; suspension states render read-only, never set. Was falsely `demonstrated` via the orphaned `tenants-lifecycle-and-pilots/fixtures.ts`, deleted this task (see the main report). |
| `SB-RBAC-01` (ai-storyboards, tracked) | L20728: the console Roles pane — a LIVE per-module four-role matrix with a CSV export | **Correctly not-represented.** This is the "live per-module Roles-matrix pane" Task 7's own report already disclosed as out of scope ("`SA08_PLATFORM_ROLES`, `MATRIX_CONFIGURATION_VERSION`… NOT carried forward… a real gap for a future task"). Not a new finding — the same gap under a different id. |
| `AC-SA-08-07` (L44881) | Every approval request carries nine fields, commits with its audit event in one transaction | Real, structurally true (repository's atomic `commitWrite` appends the audit row in the same snapshot as the row update — confirmed elsewhere in this unit's own review record) but uncited; not a permission decision, no non-decorative code slot for the bare token. Untracked — no census effect. |
| `AC-SA-08-08` (L44882) | A pending change renders as pending on the target object as well as in the queue | **Not built.** The rebuild renders pending state in the queue only; no other screen cross-renders a pending badge on the affected tenant/user object. Untracked. |
| `AC-SA-08-10` (L44884) | The implementation-authoring role's provisioning/revocation appears in both audit streams | Out of Task 7's own stated scope (Console users + Change approvals only, not the authoring-role audit surface). Untracked. |
| `AC-SA-09-07` (L45098) | Compliance suspension is critical-class, cannot be applied on an Admin's authority alone | No suspension control exists on the current screen at all (same gap as `WF-PLT-004`), so the criterion has nothing to attach to. Untracked. |
| `AC-SA-09-09` (L45100) | Every suspension transition writes tenant-state history and is audited | Same as above — no suspension control exists to write anything. Untracked. |
| `AC-SA-09-10` (L45052 region) | A device lock is never rendered as taking effect before the device's own acknowledgement | Device-level (Frontline/DOH) fact; no device UI on the Super Admin tenant screens. Out of scope. Untracked. |
| `AC-SA-09-14` (two occurrences) | "Visibility, not intervention" — no operational action of any kind on this page | **Superseded, not lost.** True of the OLD document-style screen (no runtime existed). The rebuilt `TenantsScreen.tsx`/`TenantDetailScreen.tsx` deliberately ADD real actions (Create tenant, Activate) per master prompt §12.6 — this criterion describes a capability state this build intentionally moved past. Untracked. |
| `OBJ-SA-METRIC` (L45180) | Four states "driven off the seeded screen state rather than computed" | **Deliberately superseded**, not dropped by omission: this described the OLD screen's fake reviewer-controlled state radio group. `TenantMetricsScreen.tsx`'s own header comment already records removing exactly this ("dropped outright… this rebuild's write path is real"). Untracked. |
| `SCR-SA-13` (L42805) | Screen annotation for the approval-queue screen | Same treatment this unit already gives every `SCR-SA-*` annotation (`SCR-SA-01`, `-11`, `-12`, `-14`, `-15`, `-16`): "screen annotations, never route keys" — comment-only is the established, correct treatment. Untracked. |
| `SCR-SA-16` | Screen annotation for the tenant-metrics screen | Same as above. Untracked. |
| `FB-SA-02` | "The approval write failed… nothing here is treated as decided" | Real fallback fact; the rebuild's `WriteResult`'s `denied`/`persistence-unavailable` arms plus the inline `feedback` banner are the honest replacement mechanism (per Task 7's own table), but the bare `FB-SA-02` token itself isn't reused. Untracked. |
| `MOD-09-STORYBOARD` | A fixture-only scenario-run id (`scenarioRunId('SA-MOD-09-STORYBOARD')`) in the outgoing screen's own test scaffolding | Build-internal fixture id, not a source citation of anything. Nothing to relocate. |
| `L21021` | A change breaching a floor/invariant is rejected regardless of approver, root included | Structurally still true (the write floor binds every role including root — confirmed by Task 6/7's own reviews tracing `evaluate.ts`), but this is an architectural fact about the write floor, not a decision this SCREEN makes — no natural `sourceRefs` home on this file. Untracked. |
| `L44917` | Suspension is a three-state machine of graded restraint, not on-off | No suspension control exists (same as `AC-SA-09-07`). Untracked. |
| `L46451` | No control reaches inside a tenant; root bound identically | Consistent with the rebuilt screens' actual scope (Activate only); not explicitly re-asserted anywhere. Untracked. |
| `L46708` | Device command-sequence reporting for an offline device | Device-level fact, out of scope for the Super Admin tenant screens. Untracked. |
| `L75557` | "Outstanding step: the first Tenant Admin has not accepted… cannot leave its safe draft state" | **Superseded by real behaviour.** The outgoing screen stated this as static prose; Task 8 built the actual `AcceptInvitationScreen.tsx` that enacts exactly this precondition structurally, rather than asserting it in text. Untracked. |
| `L55552` | Console account creation, role-assignment and disable are all root-only | Creation is real (`inviteConsoleUser`, root-only, cited). Role-assignment and disable have no control in the rebuilt screen at all (out of Task 7's stated scope). Untracked. |
| `L55895` | Backs the outgoing screen's `approveDecision` (root-eligibility for approval) | Folded into `decisionGate`'s existing citations (`AC-SA-08-04/05/06`, `WF-ROLE-015/016/019/020`, and now `WF-ROLE-018`/`L55961`/`L55918` above) — the fact survives, this specific bare line number was not additionally carried. Untracked. |
| `L55897`, `L55985` | "Approved-not-applied" and "approved-not-executed" are distinct, real states, never called "applied" | Real distinction the rebuild's `ApprovalRequest.result` states already preserve structurally (no state is ever labelled "applied"); untracked, uncited literally. |
| `L56008` (backs `WF-ROLE-020`) | "The root declining a critical-class request" | `WF-ROLE-020` itself is already demonstrated (`decisionGate`'s critical branch). Its own line locator was not separately carried; no census effect either way since `WF-ROLE-020` is already the tracked row. |
| `L56011` | Decline requires a mandatory reason the source never specifies the content of | Matches the rebuild's own documented choice (no reason field drawn for decline/return, "records the act without claiming compliance it did not obtain" — Task 7's own comment). Untracked. |
| `L20728` | Backs `SB-RBAC-01` | See `SB-RBAC-01` above. |
| `L42804` | Backs `SCR-SA-12` | Screen annotation, same treatment as `SCR-SA-13`/`-16`. Untracked. |
| `L44774` | Backs `SB-SA-08` | `SB-SA-08` must NOT be cited — the build follows the CONTRADICTING storyboard `SB-31-10`; citing the line that backs the rejected reading would misattribute. Untracked, correctly excluded. |
| `L45228`, `L45230` | Back `FB-SA-01`/`AC-SA-10-03` in the metrics-specific ladder/anonymisation context | `FB-SA-01` and `AC-SA-10-03` are already real, cited elsewhere in `TenantMetricsScreen.tsx`; these are additional, more specific line locators for the same facts, not separately carried. Untracked. |

**Nine facts (`AC-SA-09-14`, `OBJ-SA-METRIC`, `L75557`, plus the six `not built`/`out of scope`
device- and role-assignment-level rows above) are the honest content of "dropped" — each was
checked against the current screen and confirmed absent, not assumed absent.**

## Over-claiming found — two orphaned `fixtures.ts` files (unchanged from the prior revision)

| File deleted | Falsely-demonstrated rows | Why the fact isn't real on the rebuilt screen |
|---|---|---|
| `app/super-admin/platform-overview-and-health/fixtures.ts` (344 lines) | `ai-storyboards:SB-RISK-01`, `ai-storyboards:SB-SCHED-17`, `workflows:SB-SCHED-17` | Platform health / fleet telemetry / agent health / review cadence / tenant connectivity aggregate panels, and a site-wide connectivity-loss incident tracker — none of which the rebuilt KPI row implements. |
| `app/super-admin/tenants-lifecycle-and-pilots/fixtures.ts` (544 lines) | `scheduled-work:SCHED-022`, `scheduled-work:SCHED-023`, `workflows:WF-PLT-004`, `workflows:WF-PLT-005` | `WF-PLT-005` directly contradicted Task 6's own binding ruling removing it. `WF-PLT-004` is not built (see table above). `SCHED-022`/`SCHED-023` have no day-count/expiry-evaluation logic anywhere. |

## §8.6.2 scan — widened to every file this unit shipped or rebuilt

The first revision scanned only the eight screen files. **Corrected: every `.ts`/`.tsx` file this
unit's diff touched** (`git diff --name-only 5f58237..83caf49 -- app src`, filtered to source
files — 43 files) was scanned with the same method (`stripComments`, then a regex for blueprint
line locators, bare requirement identifiers **including the `APP-` prefix**, and build-process
vocabulary).

**Two violations, both already fixed** (unchanged from the prior revision): `AC-SA-09-01` removed
from `TenantsScreen.tsx`'s rendered `emptyState.whatCreatesIt`; `MOD-SA-08` removed from
`OverviewScreen.tsx`'s rendered `CRITICAL_APPROVALS_UNKNOWN_REASON`.

**Seven `APP-012` occurrences render** across `AcceptInvitationScreen.tsx` (2),
`ConsoleUsersScreen.tsx` (4), `TenantMetricsScreen.tsx` (1) — all reading "…a client-delegated
choice under APP-012, not a position the source settled." **These are not violations**: `APP-012`
is this build's standing, programme-mandated approval-id phrase from a shared renderer, already
shipped on other screens before this unit, and recorded (Task 7 minor) as a build-wide question
rather than a per-screen one. The honest statement of this scan's result is: **two violations
found and fixed; seven `APP-012` occurrences stand under that prior ruling; zero other blueprint
locators or bare requirement identifiers render anywhere in the 43 files.**

Two further phrases were checked and judged NOT violations, with reasoning stated rather than
silently passed over:
- `AppShell.tsx`'s `NOT_REAL_TEXT` ("...a client-validation storyboard: every state shown is
  seeded fixture data...") is the master-prompt-MANDATED simulated-behaviour disclosure, exported
  by Task 2 for reuse, required on every screen this shell hosts. It predates this unit and is
  required copy, not build-process narrative leakage.
- `StoryboardSignInPanel.tsx`'s "Storyboard sign-in — seeded identities" heading and `not a seeded
  account` copy is a reviewer-facing identity-picker panel, self-labelled `data-demo="…"` — chrome,
  not the product (the same category as `RoleSimulator`/`DemoChrome`, which this build's own
  boundary rules already treat as a separate tree from `src/ui/product/**`).
- `app/coverage/**`, `app/workflows/**` and `src/ui/demo/DemoChrome.tsx`'s uses of "registry",
  "reviewer", "census" are the literal subject matter of those screens (the project's own coverage
  dashboard and workflow-storyboard viewer, both reviewer/dev tooling, not the simulated product) —
  out of §8.6.2's product-screen scope by the same reasoning `TraceViewerAbsence.tsx` already
  establishes for rendering source citations as its own subject.

**One thing dropped from the prior revision, because it proved nothing:** the earlier claim
"confirmed clean in the built static export" (`grep` over
`out/super-admin/tenants-lifecycle-and-pilots/` and `.../platform-overview-and-health/`) is
**withdrawn**. Those routes are client-rendered behind `RequireSession`; their server-rendered
HTML is ~12.5KB of script tags around a 21-byte body ("Preparing the platform console…"). No
screen string — fixed or broken — could ever appear there, so that grep was never evidence of
anything. The actual verification is: the source string was changed, `pnpm typecheck`/`pnpm
build` succeed, and this scan re-ran clean over the comment-stripped source.

**Also true, and not this unit's to fix:** `out/super-admin/console-users-roles-and-change-approvals/index.html`
DOES render blueprint locators in visible text — `L91282`, `L91304`, `L91305`, `L91309`,
`AC-43-301`/`AC-43-302`/`AC-43-356` — from a pre-existing slice-11 `AiDegradationOverlay`, mounted
by that route's `page.tsx` (untouched by this unit's diff; the overlay predates unit-01 and is
deliberately mounted at the route rather than inside the screen component, per that file's own
comment, to keep it out of the screen's own contract). So "zero blueprint locators render" is true
of every file this unit shipped or rebuilt, and NOT true of the delivered page as a whole — the two
claims are different, and this document makes only the first one.

## Census, before and after

**Corrected base.** `registries/generated/ai-storyboards.json` was last committed at `524b366`
(within Task 7's fix rounds) and was never recommitted afterward, even though Task 9 rewrote
`TenantMetricsScreen.tsx` in the interim. Regenerating from the actual source at `83caf49` (this
unit's last commit before Task 11) produces a DIFFERENT `ai-storyboards.json` than the one
committed there: `SB-SA-10` reads `demonstrated-in-storyboard` in the committed file and
`not-represented` on a fresh regeneration, because the identifier lost its real-code citation
(became comment-only) at some point in Tasks 8–10 without the registry being regenerated and
recommitted to match.

| State | demonstrated | Note |
|---|---|---|
| Committed at `83caf49` (stale) | **284** | `ai-storyboards.json` not regenerated since `524b366`; `SB-SA-10` incorrectly still reads demonstrated |
| True regeneration from `83caf49`'s actual source | 283 | `SB-SA-10` correctly not-represented; matches the task brief's stated "measured position" |
| After this task's over-claiming fix (two orphaned `fixtures.ts` deleted, seven rows) | 276 | `ai-storyboards` 84→82, `workflows` 70→67, `scheduled-work` 3→1 |
| After this task's under-claiming fix (`WF-ROLE-018` restored) | **277** | `workflows` 67→68 |

**Net movement: 284 → 277, eight rows, not seven** — one pre-existing stale-registry correction
(`SB-SA-10`, already sitting uncommitted in the working tree when this task began — the accidental
`git stash` this task disclosed held exactly this one row, confirming nothing else was in flight),
seven new over-claiming removals, and one new under-claiming restoration.

Final, by registry: modules 69, features 6, sub-features 1, functions 21, workflows 68,
business-use-cases 2, business-objects 6, events 0, commands 2, notifications 3,
offline-scenarios 0, ai-storyboards 82, scheduled-work 1, actionable-controls 16. Total rows 5015
unchanged; not-represented 4706; mounted 10; not-applicable 22.

## `pnpm ledger:reconcile`

Unchanged by any of this task's work, before or after both fix rounds: registry census 5,015 rows,
live-verification ledger 0 rows, Direction A (uncovered) 5,015 of 5,015, Direction B (orphaned) 0.
This task's status corrections move rows between `demonstrated-in-storyboard` and
`not-represented` — they do not add or remove a registry row (id), and the reconcile script's
census keys on row presence, not status. See the accompanying report for the full discussion.
