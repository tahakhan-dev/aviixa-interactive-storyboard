# Unit 1 closure verification — platform bootstrap and tenant provisioning

Task 12, the closing task of `.superpowers/sdd/2026-08-28-unit-01-platform-bootstrap-and-tenant-provisioning/`.
Candidate commit at task 12's entry: `79cbd4f130865253bccc967973ba04d89cc05927` (task 11's close).
This is fix round 1 of task 12's own review: the controller committed the first pass as `ece524f`;
this document now describes the corrected state on top of it. The controller commits; this record
does not.

## 1. Frozen source — re-hashed, not trusted from memory

```
$ shasum -a 256 ../AVIIXA_Production_Product_Blueprint.md
47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27  ../AVIIXA_Production_Product_Blueprint.md
$ wc -l ../AVIIXA_Production_Product_Blueprint.md
  122241 ../AVIIXA_Production_Product_Blueprint.md
```

Matches the frozen value exactly. No drift.

## 2. Live-verification ledger — 30 rows driven fresh against the final bytes

`docs/process/ledgers/live-verification-ledger.json` held **zero entries** before task 12, by the
runway's own deliberate design. Every row was produced by actually driving `pnpm serve:out`'s served
export with the Playwright MCP tools in a live session — none is a transcription of a prior task
report's prose.

**Verdict totals: 30 rows — 28 `pass`, 1 `fail`, 1 `blocked`.** (Fix round 1 added five rows,
LV-0026 through LV-0030, addressing Important 5's gap — see §7 below.)

**Regression-set scope, named explicitly:** the platform-bootstrap-and-tenant-provisioning spine end
to end, each of the eight shipped screens' main state, the sign-out control, the tenant-detail
People/Entitlements/Audit tabs, both privileged doors' successful-write paths in addition to their
refusals, and the variant/failure paths this unit's tours encode.

**What this ledger does NOT cover, stated plainly rather than left to be inferred (Important 4):**
**the tour RUNNER itself — the fifteen-tour, 135-step player built and reworked in tasks 10 and 11
(the overlay, spotlight, menu and playback controls) — has no row here and was not driven.** Every
row below that corresponds to a tour's subject was produced by replicating that tour's own scripted
steps directly against real product controls (the same sequence a human following the tour would
perform), not by invoking the tour-runner UI and watching it play. That is real evidence of the
underlying product behaviour; it is not evidence that the runner mechanism itself works. No `pathId`
in the fourteen registries represents "the tour runner" as an object, so no ledger row could be
added for it without inventing a false one — the honest statement lives here, in this scope
paragraph, rather than only in the task report.

This is not exhaustive: it is the regression set the unit's own rule requires (every path sharing a
changed screen, component, repository method or state machine), not every one of the 5,015-row
census. `ledger-reconcile.mjs`'s own output states the honest backlog (§5 below).

**Note on the "nine screens" wording**, unresolved rather than picked: the task-12 brief's
self-review says "eight screens"; `progress.md` says "nine", six times. This record drove the eight
screens Tasks 2-9 shipped plus the sign-out control as its own item.

### Rows

| id | pathId | verdict | what it shows |
|---|---|---|---|
| LV-0001 | modules:MOD-SA-01 | pass | Admin sign-in succeeds, lands on dashboard |
| LV-0002 | modules:MOD-SA-01 | pass | Dashboard main state, live-computed tiles (29 tenants at this seed) |
| LV-0003 | modules:MOD-SA-09 | pass | Tenants list main state, Create tenant enabled |
| LV-0004 | modules:MOD-SA-09 | pass | Wizard: empty name blocks Next (schema rejection) |
| LV-0005 | modules:MOD-SA-09 | pass | Wizard: pilot without expiry blocks Next |
| LV-0006 | modules:MOD-SA-09 | pass | Wizard: real create write → detail, Activate disabled with reason |
| LV-0007 | modules:MOD-SA-01 | pass | Sign-out clears session, preserves return route |
| LV-0008 | workflows:unnumbered@L75557 | pass | Hub: real seeded invitation (Nadia/IronClad) accepted live |
| LV-0009 | modules:MOD-SA-09 | **fail** | Cross-document persistence loss reproduced live (carried finding #1) |
| LV-0010 | modules:MOD-SA-09 | **blocked** | Full accept→activate spine continuity — cannot be driven in one document |
| LV-0011 | modules:MOD-SA-01 | pass | Sign-in: removed account → generic refusal (R2) |
| LV-0012 | modules:MOD-SA-01 | pass | Sign-in: invited account → invitation-pending |
| LV-0013 | modules:MOD-SA-01 | pass | Sign-in: suspended account → account-suspended |
| LV-0014 | modules:MOD-SA-01 | pass | Sign-in: active user, suspended tenant → tenant-suspended |
| LV-0015 | workflows:WF-ROLE-004 | pass | Root sign-in stops at step-up, confirm lands as Root |
| LV-0016 | modules:MOD-SA-08 | pass | Console Users main state (Root) |
| LV-0017 | workflows:UC-HO-02 | pass | Segregation of duties: root's own proposal, both controls disabled |
| LV-0018 | workflows:WF-ROLE-037 | pass | Second Root Super Admin invitation refused |
| LV-0019 | ai-storyboards:SB-HO-004 | pass | Critical-class change: no control at all for non-root viewer |
| LV-0020 | modules:MOD-SA-09 | pass | Create tenant disabled for Platform Engineer, reason stated |
| LV-0021 | modules:MOD-SA-09 | pass | Direct navigation to /create/ does not bypass the write-time refusal |
| LV-0022 | workflows:unnumbered@L75557 | pass | Invitation expired (Red Rock Manufacturing) |
| LV-0023 | workflows:unnumbered@L75557 | pass | Invitation to a suspended tenant blocked (Granite Hollow Tooling) |
| LV-0024 | modules:MOD-SA-10 | pass | Tenant Metrics per-tenant tab, all fifteen measures |
| LV-0025 | ai-storyboards:SB-SA-10 | pass | Tenant Metrics anonymised comparative tab, no tenant named |
| LV-0026 | workflows:WF-ROLE-010 | pass | `inviteConsoleUser` SUCCESS: a legitimate Support-role invitation commits |
| LV-0027 | workflows:WF-ROLE-015 | pass | `decideApprovalRequest` SUCCESS: maker-checker happy path, engineering-class approve |
| LV-0028 | modules:MOD-SA-09 | pass | Tenant detail People tab (Bright Bikes, 28 real users) |
| LV-0029 | modules:MOD-SA-09 | pass | Tenant detail Entitlements tab (Bright Bikes, platform floor vs tenant value) |
| LV-0030 | modules:MOD-SA-09 | pass | Tenant detail Audit tab (Bright Bikes, real timeline, correlation grouping) |

Full detail is in `docs/process/ledgers/live-verification-ledger.json` itself; this table is a
locator, not a substitute.

**Every row's console-error and external-request capture came back empty** across every document
driven across both the original session and fix round 1.

### `pathId` corrections made in fix round 1 (this record's own history, not hidden)

**LV-0015 and LV-0018 had their workflow ids transposed in the first pass.** LV-0015 (root sign-in
stopping at the step-up panel) now correctly cites `workflows:WF-ROLE-004` ("First root sign-in and
the enforced-invariant acknowledgement"); it previously, wrongly, cited `WF-ROLE-037` ("Refusing
creation of a second Root Super Admin"), which is what LV-0018 actually demonstrates and always
correctly cited.

**LV-0001, LV-0007 and LV-0011 through LV-0014** (ordinary Admin sign-in, sign-out, and four
non-root sign-in refusal arms) previously also cited `WF-ROLE-004`, which is wrong — none of them is
first-root sign-in. They now cite `modules:MOD-SA-01`. This is a **defensible-but-imperfect**
choice, stated as such rather than dressed up as an exact match: a search of all fourteen registries
for any sign-in/authentication/credential-shaped label found nothing scoped to ordinary Super Admin
sign-in — the only real, on-topic identifier physically present in `SignInScreen.tsx` is
`WF-ROLE-004` itself, sitting inside a comment (hence `not-represented`, and root-specific).
`modules:MOD-SA-01` is the destination module every one of these six rows is either reaching (0001),
leaving (0007), or being refused entry to (0011-0014) — a real census row, not a phantom one, but a
substitution rather than a precise citation. Recorded in the ledger's own `scope_note` as well, so a
reader of the ledger alone sees it.

**`ledger-reconcile.mjs`'s Section B checks `pathId` EXISTENCE only** — it cannot and does not check
whether a row's chosen id's own label actually matches what the row demonstrates. That is a real,
stated limit of the reconciliation gate, not something this fix claims to have closed structurally;
it is closed here only by a human (this task) re-reading each id against its own registry label.

## 3. Fresh whole-chain verification — `pnpm verify`, output preserved durably

Run three times across task 12 and its fix round: once before the ledger was filled, once after
filling it in the original pass, and once more in fix round 1 after the `pathId` corrections and the
five new rows. **All three: exit 0.**

The fix-round-1 run's full output — **including its own exit-code line** — is saved at
`artifacts/evidence/unit-01-task-12-verify/pnpm-verify-fixround1.txt` (5,278 lines), a path under
one of the manifest's own declared evidence roots (`artifacts/evidence/`, not the `*/raw/`
subdirectory that this project's `.gitignore` deliberately excludes) so it is committed alongside
this record rather than left in a session scratchpad that gets cleaned up. Its last lines:

```
B. Ledger rows naming a path NO registry contains: 0
PNPM_VERIFY_EXIT=0
```

Key figures from that run, quoted rather than summarised from memory:

- `validate-collections.mjs` — all 40 collections `ok` (`tours 15 rows`, `approval-requests 9 rows`).
- `eslint .` — clean, including every `[must fail]` boundary-rule negative case reporting `ok`.
- `pnpm build` — `Census status tally across the fourteen registries: demonstrated-in-storyboard
  277, mounted-in-another-screen 10, not-applicable 22, not-represented 4706, total 5015.` Unchanged
  from before this task — it touches no product/seed/registry file.
- `scan:no-external-network` — `0 violations across 701 source file(s) ... and 5846 built HTML
  file(s) under out/.`
- `scan:no-fallback-shells` — `0 fallback shells across 5846 built HTML file(s) under out/.`
- `ledger-reconcile.mjs` — `registry census 5015 row(s) across 14 registries; ledger 30 row(s).`
  **`A. Registry rows with NO ledger row: 5003 of 5015`** — read directly from this run's own
  output, not computed from a `5015 − row-count` formula (the mistake fix round 1 corrects — see
  §5). **`B. Ledger rows naming a path NO registry contains: 0`** — every one of the twelve distinct
  `pathId`s the 30 rows use resolves to a real census row.

Re-running `pnpm ledger:reconcile` standalone reproduces the same 5,003 / 0 split
(`/private/tmp/.../scratchpad/ledger-reconcile-fix1.txt` in this session, and the number is
independently reproducible by anyone who runs the command against these bytes).

`pnpm build` regenerates `out/` from scratch each time, which changes Next's per-build random
`_next/static/<buildId>` fingerprint even with no source change (confirmed earlier by diffing two
successive builds' `out/` trees — every difference was that one embedded id). `pnpm serve:out` was
re-run against the rebuilt `out/` after the original pass and the spine's entry point re-driven once
more (sign in → dashboard → tenants list): zero console errors, zero external requests, screenshot
`docs/screenshots/live/unit-01/final-export-spine-smoke-check.png`.

## 4. Seal — `node scripts/seal-manifests.mjs`, restated against the true committed baseline

**What task 12's seal actually did, measured against `79cbd4f` — the commit that stood before this
task started, and the last one BEFORE task 12 that either manifest's `git_commit` field named:**

At `79cbd4f`, the committed product-candidate manifest read `candidate_manifest_sha256
2af2f4aa2a1d3bf2ae7ed937de007f331080661ed351c87760e923884876f0ba`, `file_count 834`, and its own
`git_commit` field named `a49d53ec630bcae95fcd10c23d7916bd8a41f522` — several commits earlier still.
**That manifest was stale**: it had not been resealed since before tasks 8 through 11 landed. Task
12's first seal is the first fresh one since then, and it is not a no-op: **16 product files were
newly brought into scope and 4 were correctly dropped, net +12 (834 → 846):**

```
+ app/hub/accept-invitation/AcceptInvitationScreen.tsx
+ app/hub/accept-invitation/page.tsx
+ app/super-admin/sign-in/SignInScreen.tsx
+ app/super-admin/sign-in/StoryboardSignInPanel.tsx
+ app/super-admin/sign-in/page.tsx
+ app/super-admin/tenants-lifecycle-and-pilots/create/CreateTenantWizard.tsx
+ app/super-admin/tenants-lifecycle-and-pilots/create/page.tsx
+ app/super-admin/tenants-lifecycle-and-pilots/detail/TenantDetailScreen.tsx
+ app/super-admin/tenants-lifecycle-and-pilots/detail/page.tsx
+ src/data/collections/approval-requests.json
+ src/lib/chromeVisibility.ts
+ src/ui/product/RequireSession.tsx
+ src/ui/product/runtime/ProductRuntime.tsx
+ src/ui/product/runtime/index.ts
+ src/ui/product/runtime/session.ts
+ src/ui/product/runtime/useRepository.ts
- app/super-admin/console-users-roles-and-change-approvals/fixtures.ts
- app/super-admin/platform-overview-and-health/fixtures.ts
- app/super-admin/tenant-metrics-and-aggregates/fixtures.ts
- app/super-admin/tenants-lifecycle-and-pilots/fixtures.ts
```

The additions are exactly unit 1's own screens, runtime and session module — the sign-in screen, the
create wizard, the tenant detail page, the acceptance screen, the runtime and its access-control
guard, and the `approval-requests` collection task 7 added. The removals are the orphaned
`fixtures.ts` files this unit's own tasks deleted for claiming false coverage. **This is the seal
doing real work — bringing twelve unit-1 product files that were sitting outside the certified scope
into it — not a no-op described as "unchanged."**

Envelope manifest, same comparison: at `79cbd4f` it read `payload_sha256
54c5efd2165db8cc5b4ac89217649c3071b507b927f487768538994524107e98`, `payload_count 97`. Task 12
added 3 process-evidence documents (`docs/process/audits/2026-08-28-unit-01-task-11-locator-relocation.md`,
the unit-01 plan and design spec) that were sitting outside the envelope's own scope, 0 removed
(97 → 100 before this record and the ledger's own content were added). Fix round 1 added two more
paths on top of that — this record's own file and the fresh `pnpm verify` log now saved under
`artifacts/evidence/` — bringing it to **102**.

**Current sealed state, on the bytes fix round 1 produced (product manifest hash is exact and
final; the envelope hash below is necessarily one seal-run stale, because THIS SENTENCE is itself
evidence payload — reseal-after-editing-the-record-that-describes-the-seal cannot terminate, the
same non-self-referential problem §23.2 already solves for the manifests' own two output files, just
one document further out. `docs/process/ledgers/evidence-envelope-manifest.json` on disk is the
authoritative current value, not this prose):**

```
Sealed SLICE11-40350cb6ac702e62
  product  846 files  sha256 40350cb6ac702e626dadc2cfde46637d490a20f1a0a6488a5b8a29ef0c82819f
  envelope 102 files  sha256 ed523acb25b9d91aa820817bcd4cb7c0dcaf9cfb4eedc27b2b290d67fb23131c (as of the seal run before this sentence was last edited)
```

Product manifest hash **unchanged from task 12's own first seal** (`40350cb6...`, 846 files) — fix
round 1 touches no product file, only evidence. `git_commit` on the current seal names
`ece524f0398ab7d3a8e97468e818cc5a27a8e17f` (the commit the controller made of task 12's first pass,
which this fix round sits on top of), and `worktree_clean` reads `false` with the seal's own honest
sentence that these bytes are not attributed to any commit until one is made.

Not committed by this task — the controller commits.

## 5. Census and the ledger's own coverage figure, corrected

**Census unchanged at 277 of 5,015 demonstrated** — this task touches no route file, no seed
collection, and no registry-generation input.

**The ledger's own Section A figure was WRONG in fix round 0 and is corrected here.** The original
record said "4,990 of 5,015 uncovered," computed as `5015 − 25` (rows), which is not what
`ledger-reconcile.mjs` measures — it counts **distinct `pathId`s**, not rows, and several of the 25
rows shared a `pathId` (e.g. `modules:MOD-SA-09` was cited by nine different rows). The tool's own
output, both in the fresh `pnpm verify` run and a standalone `pnpm ledger:reconcile` re-run, reads:

```
A. Registry rows with NO ledger row: 5003 of 5015
B. Ledger rows naming a path NO registry contains: 0
```

**5,003, not 4,990** — the true backlog understated coverage's inverse (overstated coverage) by 15
rows in the original record. With fix round 1's five new rows adding two more distinct `pathId`s
(`WF-ROLE-010`, `WF-ROLE-015`), the true remaining backlog is 5,003, read directly from the tool
rather than computed by hand.

Census delta arithmetic across the unit (unchanged by this task, restated from `progress.md`):

| point | census | delta | cause |
|---|---|---|---|
| Session S14 entry (runway close) | 299 | — | baseline |
| Task 4 report (defect A) | 292 | −7 | comment abbreviation defeated the comment-stripped token scan |
| Task 4 fix round 1 | 295 | +3 | 3 of 7 identifiers earned real citations |
| Task 4 fix round 2 | 295 | 0 | 4 identifiers named unbuilt screens; false claim reverted |
| Task 7 → fix round 1 | 269 | −25 | an orphaned 835-line `fixtures.ts` claiming 24 workflows + 2 use cases |
| Task 7 fix round 2 | 285 | +16 | real `sourceRefs` earned, confirmed byte-clean |
| Task 7 fix round 2 re-review | 284 | −1 | `WF-ROLE-021` dropped — asserted an unperformed act |
| Task 9 report | 283 | −1 | a second orphaned `fixtures.ts` |
| Task 11 report | 276 | −7 | two more orphaned `fixtures.ts` files |
| Task 11 fix round 1 | 277 | +1 | true pre-task-11 base was 284 not 283; real move 284 −8 +1 = 277 |
| **Task 12 (this task, both rounds)** | **277** | **0** | verification-only |

Net for the unit: 299 → 277, −22, entirely coverage-honesty corrections.

## 6. Screenshots

New captures across the original session and fix round 1, all under
`docs/screenshots/live/unit-01/`:

```
modules-MOD-SA-01-signed-in-dashboard.png
modules-MOD-SA-09-tenants-list.png
wizard-empty-name-next-disabled.png
wizard-review-step.png
modules-MOD-SA-09-wizard-created-detail-invited.png
spine-sign-out-redirect.png
hub-accept-invitation-ironclad-before.png
hub-accept-invitation-ironclad-after.png
detail-ironclad-post-hardnav-still-invited.png
signin-removed-generic.png
signin-invitation-pending.png
signin-account-suspended.png
signin-tenant-suspended.png
signin-root-stepup-required.png
modules-MOD-SA-08-console-users-root-main.png
workflows-WF-ROLE-037-sod-ar0002-root-own-proposal.png
workflows-WF-ROLE-037-second-root-denied-result.png
workflows-critical-no-control-ar0003-admin.png
tenant-create-denied-platform-engineer.png
tenant-create-route-direct-nav-denied.png
tenant-create-denied-wizard-finish-refused.png
invitation-expired-redrockmfg.png
invitation-tenant-blocked-granitehollow.png
modules-MOD-SA-10-tenant-metrics-main.png
tenant-metrics-anonymised-comparative.png
final-export-spine-smoke-check.png
tenant-detail-brightbikes-overview.png
tenant-detail-brightbikes-people.png
tenant-detail-brightbikes-entitlements.png
tenant-detail-brightbikes-audit.png
console-users-invite-success.png
approvals-ar0001-before-approve.png
approvals-ar0001-after-approve.png
approvals-ar0001-approved-confirmed.png
```

These 34 files are all distinctly captured (each a genuine screenshot action against a distinct page
state), sitting alongside ~205 pre-existing PNGs from Tasks 1-11 this task did not touch.
`final-export-spine-smoke-check.png` — a smoke-check of the tenants list after `pnpm verify`'s
rebuild — is byte-identical (md5 `8d99fdac…`) to `modules-MOD-SA-09-tenants-list.png`, captured 22
minutes earlier; both are the tenants-list page, not the dashboard. That is Next's deterministic
server-rendered output for the identical page/role render, not a distinct visual state, and is named
as such here rather than presented as separately informative.

Per `docs/process/live-verification-procedure.md`'s own stated limit, these image files are not
re-read by this or any later automated pass — the filename plus each row's `observed` prose is the
durable record.

## 7. Findings carried forward, named rather than dropped

1. **Persistence is write-only.** `boot()` rebuilds the store from the seed on every document load
   and never rehydrates; `Repository.reset()` has no caller. **Reproduced live at LV-0009.** A
   dedicated task after this unit carries snapshot rehydration and the reset door together.
2. **`advanceClock` moves a decorative clock**, separate from `store.clock`.
3. **The tour registry has no gate on tour targets** (`spotlight`, `expectVisible`,
   `assertState.check` are never considered by the dangling-reference check).
4. **The delivered console-users page renders blueprint locators in visible text**, from a
   pre-existing overlay component no task in this unit touched.
5. **Five identifiers have no honest citation home** under this unit's own rule and stay
   `not-represented`.
6. **`acceptInvitation` takes a tenant id and no caller identity** — no token is buildable, the
   `User` schema carries no credential field.
7. **A stray `git stash` entry exists on the branch**, left deliberately per task 11's ruling.

## 8. What is simulated rather than real

No backend anywhere; no real authentication (any non-empty password authenticates any known email);
no real time (the simulated clock is pinned at the seed's canonical epoch and the demo control that
claims to advance it does not touch the clock the product reads); the Tenant Metrics screen's
"audited session" language describes a capability no module in this build implements end to end,
though the screen itself is honest that it cannot do it either.

## 9. Open items at this task's close

- The seven carried findings are not fixed by this task.
- LV-0010's blocked continuity is architectural (no in-app link between Hub and Super Admin, and
  write-only persistence) — a reviewer confirmed this by grepping every `/hub` and `/super-admin`
  literal in the tree and found `ProductRuntime` mounted in the root layout, meaning a SOFT
  navigation between the two surfaces would in fact preserve the store; the block is real only
  because no soft navigation path between them exists in the shipped UI, not because the runtime
  itself would lose state on one.
- The tour runner mechanism (§2 above) remains entirely undriven by this ledger — a gap named here,
  not closed by this fix round, since no `pathId` exists to record it against.
- The "eight screens" vs "nine screens" inconsistency in this unit's own record is flagged, not
  resolved.
- No completion language beyond what this record's evidence carries.
