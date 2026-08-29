# Unit 2 closure verification — tenant configuration, users, workers and devices

Task 9, the closing task of
`.superpowers/sdd/2026-08-29-unit-02-tenant-configuration-users-workers-devices/`. Candidate at
task 9's entry: `96d1db5909949efe09299acb7099f3e1db0ee39a` (task 8's close, all eight prior tasks
reviewed clean or approved). This record is task 9's own first pass; the controller commits.

## 1. Frozen source — re-hashed, not trusted from memory

```
$ shasum -a 256 ../AVIIXA_Production_Product_Blueprint.md
47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27  ../AVIIXA_Production_Product_Blueprint.md
$ wc -l ../AVIIXA_Production_Product_Blueprint.md
  122241 ../AVIIXA_Production_Product_Blueprint.md
```

Matches the frozen value exactly. No drift, checked at this task's start and again here at its
close.

## 2. Live-verification ledger — 29 rows driven fresh against the final bytes (+6 from the final whole-unit review)

`docs/process/ledgers/live-verification-ledger.json` held 30 rows at this task's start, all from
unit 1's own closure (28 pass, 1 fail, 1 blocked) — checked directly before driving anything: Tasks
1-8 of this unit produced real live-verify sessions (screenshots, prose in their own reports) but
**no task appended a structured ledger row**, so this unit's own regression set started genuinely
uncovered, not partially covered.

**Verdict totals for the 29 new rows: 28 `pass`, 1 `blocked`, 0 `fail`.** Every row was produced by
actually driving `pnpm serve:out`'s served export with the Playwright MCP tools in one continuous
live session — none is a transcription of a prior task report's prose, and none of the screenshots
already sitting on disk from Tasks 1-8's own drives were cited without re-checking them live first
(see §6 on the two directories those screenshots actually came from).

**Combined ledger, after this task: 59 rows — 56 `pass`, 1 `fail`, 2 `blocked`.**

**AMENDED BY THE FINAL WHOLE-UNIT REVIEW (2026-08-29, candidate
`unit02-final-review-c61634ff6bd06180206d366b8c14e9317ff64fa3`): six further rows, `LV-0060`
through `LV-0065`, all `pass`. Combined ledger now 65 rows — 62 `pass`, 1 `fail`, 2 `blocked`.**
That review found three write paths this unit had never driven live — a successful Shift edit
(`updateShift`'s success arm), a successful archive at any Location/Area/Site tier
(`archiveLocationTierEntity`'s success arm, only its refusal arms had rows) and Shift archive
(which had no named door at all until that review gave it one) — plus three regression subjects
for the fixes it made. See §7's amendment for the findings themselves.

**Regression-set scope, named explicitly:** this unit's five rebuilt screens (Location
Configuration, Shift Management, Permissions/Roles/Access, Worker Lifecycle and Qualifications,
Devices) in their main states; the shared `checkSiteReference`/`checkAreaReference`/
`checkLocationReference` cross-tenant refusal that all five screens' doors route through; every
real write door this unit added (`createSite` via the generic door, `createAreaUnderSite`,
`createLocationUnderArea`, `createShift`, `createTenantUser`, `assignTenantRole`, `createWorker`,
`recordQualification`, `enrollDevice`, `reassignDevice`), each driven to a real, observed success;
the corrective task's role-floor narrowing (Location/Shift Management to Tenant Admin only) and
Task 4's Quality-Manager write exclusion, both confirmed still enforced on these bytes; Task 3's
segregation-of-duties rule (only Tenant Admin may grant any tenant role) and its whole-module
`Unavailable` rendering for Supervisor/Quality Manager; Task 7's own live discovery (a Supervisor
can `createWorker` but not the `createTenantUser` its first leg calls) reproduced live rather than
only cited; Task 6's two cross-links (Location Configuration → Shift Management, Worker → Devices);
and **all sixteen of this unit's guided tours' SUBJECTS**, driven by replicating each tour's own
scripted `steps` directly against real product controls (the same pattern unit 1's closure used,
not the tour-runner UI itself — see the note below).

**Task 1 checked for unit-1 code sharing this unit's changed files, per the brief's explicit
instruction, and found none:** unit 1's own screens (sign-in, tenant list/create/detail,
console-users, tenant-metrics, accept-invitation) do not import `checkSiteReference`/
`checkAreaReference`/`checkLocationReference`, `createTenantUser`/`assignTenantRole`, or any of this
unit's five screen components — confirmed by Task 1's own preflight scan
(`.superpowers/sdd/.../progress.md`'s "Preflight conflict scan" table) and independently
re-confirmed here: none of unit 1's own 30 ledger rows names a `pathId` this unit's tasks touched.
The regression set is genuinely this unit's own screens plus the shared repository doors, not a
wider re-drive of unit 1.

**What this ledger does NOT cover, stated plainly (matching unit 1's own Important 4):** the
tour-runner mechanism itself — the player, overlay, spotlight and menu controls built in the
earlier runway and reworked since — carries no `pathId` in any of the fourteen registries and was
not invoked through its own UI by this task, exactly as unit 1's closure already disclosed for its
own fifteen tours. Every row below that corresponds to a tour's subject is real product-behaviour
evidence, not runner evidence.

**One genuine block, recorded as `blocked` rather than a silent gap (LV-0059):** a real scoped
Supervisor/Quality-Manager session (28 such role-grants exist in the seed) cannot be driven live,
because no sign-in path in this build populates `siteScope`/`areaScope` from `role-grants.json` —
Task 1's own fix-round-2 finding, re-disclosed on screen by every later task (2 through 5) and
confirmed unchanged on these final bytes by opening the Scope tab live and reading its own
disclosure text. This is the same class of limitation unit 1's LV-0010 recorded, not a new kind of
gap.

### Rows

| id | pathId | verdict | what it shows |
|---|---|---|---|
| LV-0031 | modules:MOD-DOH-02 | pass | Location Configuration main state (Tenant Admin), Create site enabled, Archive disabled with active-children reason |
| LV-0032 | modules:MOD-DOH-02 | pass | `createSite` real write success |
| LV-0033 | modules:MOD-DOH-02 | pass | Areas tier timezone-inherited line renders with no blueprint locator (Task 1 fix round 1 Critical 2, still fixed) |
| LV-0034 | modules:MOD-DOH-02 | pass | Cross-tenant Site reference (`?site=SITE-NF-MAIN`) refused before render — `checkSiteReference` |
| LV-0035 | modules:MOD-DOH-02 | pass | Supervisor: Create site disabled with stated reason — corrective role floor holds |
| LV-0036 | modules:MOD-DOH-02 | pass | `createAreaUnderSite` real write success |
| LV-0037 | modules:MOD-DOH-02 | pass | `createLocationUnderArea` real write success |
| LV-0038 | modules:MOD-DOH-03 | pass | Shift Management main state (Tenant Admin), 25 real Shifts, Create shift enabled |
| LV-0039 | modules:MOD-DOH-03 | pass | Shift overlap refused, conflicting Shift named |
| LV-0040 | modules:MOD-DOH-03 | pass | `createShift` real write success (non-overlapping) |
| LV-0041 | modules:MOD-DOH-09 | pass | Permissions main state (Tenant Admin), 28 real users, Invite user enabled |
| LV-0042 | modules:MOD-DOH-09 | pass | `createTenantUser` real write success |
| LV-0043 | modules:MOD-DOH-09 | pass | `assignTenantRole` real, additive write success |
| LV-0044 | modules:MOD-DOH-09 | pass | Quality Manager: whole module renders `Unavailable`, no degraded roster |
| LV-0045 | modules:MOD-DOH-09 | pass | SoD disclosure renders no bare locator (Task 3 fix round 1 Critical 1, still fixed) |
| LV-0046 | modules:MOD-DOH-04 | pass | Worker Lifecycle main state (Tenant Admin), 20 real workers, Add worker enabled |
| LV-0047 | modules:MOD-DOH-04 | pass | `createWorker` real two-write success (account then worker record, WRK-16) |
| LV-0048 | modules:MOD-DOH-04 | pass | `recordQualification` real write success |
| LV-0049 | modules:MOD-DOH-04 | pass | Quality Manager: Add worker + Enter qualification both disabled with stated reasons, reads unaffected |
| LV-0050 | modules:MOD-DOH-04 | pass | Cross-tenant worker attachment refused, no foreign data rendered |
| LV-0051 | modules:MOD-DOH-04 | pass | Supervisor's own worker-invite refused mid-flow — Task 7's SoD discovery reproduced live |
| LV-0052 | modules:MOD-DOH-04 | pass | SEQ031 User leg: Diego Fuentes' qualification renders `Expired` |
| LV-0053 | workflows:WF-DVC-005 | pass | Devices main state (Tenant Admin), no Suspend control anywhere, denial disclosed in full |
| LV-0054 | workflows:WF-DVC-001 | pass | `enrollDevice` real write success |
| LV-0055 | workflows:WF-DVC-002 | pass | `reassignDevice` real write success |
| LV-0056 | workflows:WF-DVC-005 | pass | SEQ031 Device leg: DEV-BB-TAB-008 renders `De-authorised` |
| LV-0057 | modules:MOD-DOH-03 | pass | Task 6 cross-link: Location Configuration → filtered Shift Management |
| LV-0058 | modules:MOD-DOH-04 | pass | Task 6 cross-link: Worker → filtered Devices |
| LV-0059 | modules:MOD-DOH-04 | **blocked** | Scoped Supervisor/QM session cannot be driven live — no session-construction path populates site/area scope |

Full detail is in `docs/process/ledgers/live-verification-ledger.json` itself; this table is a
locator, not a substitute.

**`pathId` choices are the same defensible-but-imperfect substitution unit 1's own fix round 1
disclosed, not exact matches.** None of the sixteen tours carries a `workflowId` in
`src/data/collections/tours.json` (all sixteen read `null`), so each row's `pathId` names the real
census row (`modules:MOD-DOH-NN`) the row's own subject screen belongs to, or — for the three
Devices rows, where Task 8 confirmed the screen genuinely carries no module id — the `WF-DVC-NNN`
workflow row it demonstrates. `ledger-reconcile.mjs`'s Section B checks `pathId` EXISTENCE only, not
whether the chosen id's own label matches what a row demonstrates; that residual limit is unchanged
from unit 1's own record.

**Every row's console-error and external-request capture came back empty**, with one immaterial
exception noted rather than hidden: a final five-screen smoke pass after the reseal (§4 below) hit
one `[ERROR] Failed to load resource: 404 @ /favicon.ico` on the very first cold load of the
session. `out/favicon.ico` does not exist anywhere in this build — a pre-existing, unit-wide gap
that predates this unit's five tasks (a cosmetic browser-tab icon, not a product control), and it
is not repeated on any of the twenty-nine driven rows above, all of which checked
`browser_console_messages({level:'error'})` immediately after their own product steps and read
empty.

**Screenshots.** Each row's `screenshots` entries carry a `sha256` and a byte count, the same
attestation pattern unit 1's closure introduced. 29 new files, computed from bytes on disk, none
stubbed.

## 3. Two leftover screenshot directories found and relocated, not left to pollute the seal

Session entry found two untracked directories at the repository root, `.task-corrective-01-screens/`
and `.task3-screens/` — 22 real PNG captures from Task 3's own live-verify session and the Tasks-1/2
corrective task's, each disclosed as "untracked, not committed" in that task's own report
(`task-3-report.md:144`, `task-corrective-01-report.md:139`). Neither directory was covered by
`.gitignore`, so `scripts/seal-manifests.mjs`'s `git ls-files --cached --others --exclude-standard`
scan picked up all 22 files as **product scope** on the first seal run this task attempted — a
manifest that certifies shipped product code would have certified 22 screenshot captures as part of
it. Caught before committing that seal (§4 records the corrected numbers only); the fix was to
relocate the files into `docs/screenshots/live/unit-02/`, the path this project's own
`live-verification-procedure.md` and `.gitignore` rule already cover for exactly this kind of
capture, rather than inventing a new exception. No ledger row anywhere cited either directory's old
path, so nothing broke by moving them.

## 4. Fresh whole-chain verification — `pnpm verify`, output preserved durably

Run once, after the ledger rows landed and before the seal:

```
$ pnpm typecheck && pnpm validate:collections && pnpm lint && pnpm check:gate-ordering && pnpm check:boundary-rules && pnpm build && pnpm scan:no-external-network && pnpm scan:no-fallback-shells && pnpm ledger:reconcile
...
exit_code 0
```

**Exit 0.** Full output, including its own exit-code line, saved durably at
`artifacts/evidence/unit-02-close-verify/pnpm-verify-close.txt` (5,271 lines), matching the exact
path pattern of `artifacts/evidence/unit-02-entry-verify/pnpm-verify-entry.txt` that this unit
started from.

Key figures from that run, quoted rather than summarised from memory:

- `validate-collections.mjs` — all 40 collections `ok`.
- `eslint .` — clean.
- `check-gate-ordering.mjs` — `5 gate scripts, all audited. 3 read a subject an earlier verify step
  rewrites; each says where it runs and why.`
- `pnpm build` — `Census status tally across the fourteen registries: demonstrated-in-storyboard
  275, mounted-in-another-screen 10, not-applicable 22, not-represented 4708, total 5015.`
- `scan:no-external-network` — `0 violations across 701 source file(s) under src/+app/ and 5846
  built HTML file(s) under out/.`
- `scan:no-fallback-shells` — `0 fallback shells across 5846 built HTML file(s) under out/.`
- `ledger-reconcile.mjs` — `registry census 5015 row(s) across 14 registries; ledger 59 row(s).`
  **`A. Registry rows with NO ledger row: 4996 of 5015`** — down from 5,003 at unit 1's own close, a
  real drop of 7 (the number of distinct new `pathId`s this task's 29 rows introduce: `MOD-DOH-02`,
  `MOD-DOH-03`, `MOD-DOH-04`, `MOD-DOH-09`, `WF-DVC-001`, `WF-DVC-002`, `WF-DVC-005`). **`B. Ledger
  rows naming a path NO registry contains: 0`** — every `pathId` all 59 rows use resolves to a real
  census row.

Re-running `pnpm ledger:reconcile` standalone reproduces the same 4,996 / 0 split.

`pnpm serve:out` was re-run against the rebuilt `out/` after the ledger rows and reseal both
landed, and this unit's five screens were re-opened one final time on those exact bytes — sign in
as Dana Whitfield, then soft-navigate through Location Configuration, Shift Management, Permissions,
Worker Lifecycle and Qualifications, and (via a hard navigation, since it sits outside the Hub's own
`In this slice` module list) Devices. All five rendered their real main states; the one console
message across the whole pass was the pre-existing `favicon.ico` 404 noted in §2, not a product
regression. Screenshot: `docs/screenshots/live/unit-02/final-export-five-screens-smoke-check.png`.

## 5. Seal — `node scripts/seal-manifests.mjs`, the first fresh reseal since unit 1's own closure

**What this task's seal actually did, measured against `96d1db5` — task 9's own entry commit, and
the last commit before this task that either manifest's own `git_commit` field named:**

At `96d1db5`, the committed product-candidate manifest still read `file_count 846` and
`git_commit 3a6c59a6cb8807e01bc7f5467209517b4480703d` — **unit 1's own final closure commit.**
Neither manifest had been resealed once across all eight of this unit's own tasks; every task from
1 through 8 shipped real product changes underneath a certification that still described unit 1's
bytes. This task's seal is the first fresh one since then, and (after the correction in §3) it is
not a no-op:

```
+ scripts/generate-location-seed.mjs
+ scripts/generate-shift-seed.mjs
+ src/data/scope-reference.ts
- app/hub/devices/fixtures.ts
```

Net **+2 (846 → 848)**. The additions are exactly this unit's own real work: Task 1's deterministic
seed generators for the Location/Shift collections (a dedicated script per collection domain, ruled
acceptable in Task 1's own review) and the shared cross-tenant reference-check helper Task 1 built
and Tasks 2/4/5 reuse. The removal is the orphaned `devices/fixtures.ts` Task 8's registry
reconciliation deleted for claiming false coverage.

```
Sealed SLICE11-880728d0253a6744
  product  848 files  sha256 880728d0253a67448aedae364d0a7600f7a09a0cec01590420a472cd670b5ee4
  envelope 108 files  sha256 ad7098b6a4fcda794da92d6bdd4c64723ce1087b296185ad31d3ecd6084da47c
```

Envelope manifest: `103 → 108` at this seal (net +5: the ledger update commit and the durable
`pnpm verify` log). This document and the RESUME.md update did not exist yet, so a **second, final
reseal** followed once they were written and committed, bringing this record itself into scope:
envelope `108 → 109`. `node scripts/seal-manifests.mjs --verify` after that final reseal reads
`product: entries=848 drifted=0 missing=0` / `envelope: entries=109 drifted=0 missing=0` — **109 is
the true, current figure**, read directly from `docs/process/ledgers/evidence-envelope-manifest.json`
(`payload_count: 109`) at this document's own committed HEAD, not the `108` an earlier draft of this
paragraph left uncorrected after the second reseal ran.

`git_commit` on the final sealed manifest names `25f35a50ef3c12ad7444b4d67638c94bd64c551f` (this
document's own commit, the last one that existed when the final reseal ran) and `worktree_clean`
read `true` at seal time, because `scripts/seal-manifests.mjs`'s own two outputs are excluded from
the comparison that statement makes (the non-self-referential fix unit 1's own closure already
applied). The manifest-describing-the-seal commit (`360c6f4`) sits one commit above that and is
itself, by construction, one seal-run stale — the same lag unit 1's own record named and explained
rather than chased to a fixed point.

Not committed by this task's own hand until the controller reviews it — the controller commits.

## 6. Census, measured fresh

**Census at this unit's start (design doc §2 / `unit-02-entry-verify`): 277 of 5,015.** **Census now,
read directly from this task's own `pnpm verify` run and independently reproduced by the standalone
command below: 275 of 5,015.**

```
$ node -e "const fs=require('fs');let t=0;for(const f of fs.readdirSync('registries/generated').filter(x=>x.endsWith('.json'))){const r=JSON.parse(fs.readFileSync('registries/generated/'+f,'utf8'));for(const row of r.rows||[])if(row.status==='demonstrated-in-storyboard')t++}console.log(t)"
275
```

**Net for the unit: 277 → 275, −2 — entirely Task 8's own registry-reconciliation work, none of it
this task's own doing** (Task 9 touches no product, seed or registry-generation file). The
intra-unit chain, restated from `progress.md` and Task 8's own audit doc rather than recomputed:
census rose to 278 across Tasks 1-7's real coverage gains (each screen's own build earning real
`sourceRefs`), then Task 8's main pass corrected an over-claiming `CONTROL_MATRIX` entry
(278 → 276), then Task 8's own fix round made one further surgical correction (276 → 275). This
task's own `pnpm build` output reproduced 275 exactly, unchanged.

## 7. Findings carried forward, named rather than fixed or hidden

Unlike unit 1's own closure — which carried seven UNFIXED findings forward — this unit's own nine
tasks (eight plan tasks plus the Tasks-1/2 corrective) **found and FIXED several real defects along
the way**, not merely disclosed them. Naming that difference plainly: a cross-tenant authorization
bypass (Task 1's Critical 1, `archiveLocationTierEntity` reading and returning cross-tenant child
names before any authorization check — fixed in fix round 1), a scope-enforcement regression that
fix round 1 itself introduced (`CREATE_AREA_UNDER_SITE_REQUEST`/`CREATE_LOCATION_UNDER_AREA_REQUEST`
dropping `requiredSites`/`requiredAreas` scope checks — fixed in fix round 2), the Tasks-1/2 write-role
floor mismatch against `MTX-TEN-02a` (Supervisor/Quality Manager could create Sites/Areas/Locations/
Shifts the source prohibits — fixed by the dedicated corrective task), and three separate live
instances of the exact §8.6.2 locator-rendering defect (Task 1's Critical 2, Task 3's Critical 1,
and Task 8's own confirmation that its second finding was the same defect class recurring, not a
new one) — all three re-checked live on these final bytes at LV-0033 and LV-0045 and confirmed still
fixed, not merely trusted from the task reports that fixed them.

**AMENDMENT — the final whole-unit review (2026-08-29), five further found-and-fixed defects.**
This record was written at Task 9's close, before the whole-unit review that compared all nine of
this unit's repository doors side by side — something no single task's own reviewer could do. That
review found five more real defects, every one of them now FIXED rather than carried, and they
belong in this list in the same voice as the four above:

- **Shift archive had no named authorization door** (final review, Important 1) — the exact defect
  class the Tasks-1/2 corrective task existed to eliminate, left behind on one path.
  `ShiftManagementScreen.tsx` archived through the bare generic `update('shifts', …)`, whose only
  floor is `defaultWriteRoles('hub')` (`TENANT_OPERATIONAL_WRITERS`: Tenant Admin, Supervisor,
  Quality Manager) where `L27293` names the Tenant Admin alone. The screen's own `WRITE_REQUEST`
  already cited `L27293` and already knew the answer — it enforced it as a UI display gate and
  nowhere else. Fixed: `repository.archiveShift` with a static `ARCHIVE_SHIFT_REQUEST`
  (`['TENANT_ADMIN']`), shaped exactly like `archiveLocationTierEntity`. Success path driven live
  at `LV-0061`, display gate re-confirmed for a Supervisor at `LV-0063`.
- **`updateShift` read the target row before authorising** (final review, Important 2) — the one
  door in this unit that did not authorise first, which is the invariant
  `archiveLocationTierEntity` was restructured to hold after this unit's own cross-tenant leak
  (Task 1's Critical 1, above). The leak was bounded, but it handed any caller — a role-less one
  included — a store-wide "does this shift id exist" oracle ahead of every check. Fixed by
  splitting the gate: the role-only floor first, before any `store.get`, then the row-dependent
  site-scope check after the merge. Success path driven live at `LV-0060`.
- **The Hub module rail contradicted `MOD-DOH-09`'s own screen, because a dead file was still
  producing its reach data** (final review, Importants 3 and 4). `registries/generated/doh/
  module-reach.json` gave the module four roles while `PermissionsScreen.tsx`'s `VIEW_REQUEST`
  gives two, so the rail offered a Supervisor and a Quality Manager a link to a screen that
  refused them on arrival. Root cause: `scripts/build-doh-module-reach.mjs` was still deriving
  that reach from `app/hub/permissions-roles-and-access/fixtures.ts` — 1,760 lines, superseded
  whole by Task 3, and with ZERO importers anywhere, dead in exactly the way
  `app/hub/devices/fixtures.ts` was when Task 8 deleted it. Fixed: matrix moved to
  `src/surfaces/doh/modules/doh-09/matrix.ts` with `MTX-TEN-02a`'s `Unavailable` adopted on the
  three cells where the two source tables disagree, dead file deleted, reach regenerated. Driven
  live at `LV-0064` for all three affected roles plus the Read-only Auditor as the control.
  `./readings.ts` — the disclosure record of that unresolved source contradiction — was KEPT and
  amended, not deleted: it now records which reading the build adopted and that the source still
  settles nothing.
- **`AppShell` never asked D11, so a Worker was drawn a Hub rail** (final review, Important 3,
  second half). `HubShell.tsx` asks two questions in order — does this persona reach `SURF-DOH` at
  all (the route registry), then which modules does it reach — and offers a persona that reaches
  nothing no rail. `AppShell.tsx`, which every screen this unit rebuilt uses instead, asked only
  the second. Measured live: a signed-in Worker was drawn four Hub module links and every one of
  those screens then refused them. Fixed in `AppShell`, the D11 rule's existing owner, and NOT in
  `MOD-DOH-03`'s matrix — that module's Worker cell is a real source grant (`L27297`) and moving
  the rule into the reach map would give one rule two owners. Driven live at `LV-0065`.
- **Build-process language rendered as product copy** (final review, Important 5).
  `WorkerLifecycleScreen.tsx`'s "Invite a new worker" helper text read "Creates their account
  first (Task 3's own door), then their worker record." — an internal SDD task reference shown to
  the user. This is NOT a §8.6.2 locator violation (no `L\d+` pattern), which is why none of the
  three locator greps in this unit's history could have caught it; it is a distinct defect class.
  Fixed by dropping the parenthetical. A full grep of all five of this unit's screens for other
  process leakage found no second rendered instance.

What genuinely remains open at this unit's own close:

1. **Site/area scope narrowing cannot be driven live** — recorded `blocked` at LV-0059, not silent.
   First surfaced by Task 1's fix round 2 (`session.ts`/`useRepository.ts` never populate
   `siteScope`/`areaScope` from `role-grants.json`), re-disclosed on screen by Tasks 2 through 5, and
   confirmed unchanged here. Out of this unit's scope per the design doc; the natural next
   dependency for whichever future unit builds real session-construction wiring.
2. **`TOUR-WORKER-ADD-001`'s narration switches pronouns mid-tour** (she → he, after an actor swap
   during drafting) — cosmetic only, flagged by Task 7's own reviewer and deferred to "final review
   triage," which this task's own scope does not include re-opening.
3. **Three Minor findings parked by their own tasks' reviewers, all judged non-blocking and left
   as-is:** Task 1's `focus:outline-none` on programmatic focus targets (not a floor violation, per
   the reviewer's own framing); Task 3's `AssignControl` disabled-reason text inconsistency and its
   `?assign=` deep link/duplicate-partial arms going unscreenshotted (both already judged acceptable
   by that task's own reviewer); Task 4's screen-local field components and `expiryDate`
   required-on-entry choice (both already disclosed and reasoned in that task's own report).
4. **Task 6's own report used "Scope tab" where the shipped code's tab id reads differently** — a
   documentation wording mismatch the reviewer confirmed does not reach the code itself.
5. **Devices carries genuinely no module id** — settled, not open. Task 8's Step 2 confirmed this
   with three independent lines of evidence (the canonical Band A/B module list omits it,
   `WF-DVC-001`'s own body text cites `MOD-DOH-13` in a way that conflicts with that list, and
   `src/surfaces/doh/modules.ts` already states the screen is uncatalogued) and the project's own
   `moduleDescriptor: "SCR-DOH-DEVICES"` convention already reflects it. Named here because the
   task-9 brief specifically asked for this outcome to be cited or delegated in this record, not
   because it is unresolved.
6. **Persistence is write-only for this unit's five screens too**, inherited unchanged from unit 1's
   own carried finding 1 (`boot()` rebuilds from seed on every document load; `Repository.reset()`
   has no caller) — every real write this task drove (createSite, createWorker, enrollDevice, and
   the rest) lives only until the tab reloads. Not this unit's own finding and not re-fixed here;
   restated because every write this closure cites is subject to it.
7. **The tour-runner mechanism remains entirely undriven by any ledger row**, in either unit — a gap
   named identically to unit 1's own Important 4, not newly discovered.
8. **A write door's refusal cannot be driven from the UI for a role the screen gates out**, added by
   the final whole-unit review and recorded `pass`-with-`defect` at `LV-0063` rather than as a
   silent gap. When `canWrite` is false, `ShiftManagementScreen` renders a different element
   carrying no `onClick` at all, and no repository handle is exposed on `window` in the static
   export — so a Supervisor's `archiveShift` DENIAL is real and enforced but unobservable through
   the browser. The same limit `PermissionsScreen.tsx`'s own header already records for its
   segregation-of-duties refusal. Structural, not a defect in the door.
9. **`WF-WKR-004` fell from `demonstrated-in-storyboard` to `not-represented`** in
   `registries/generated/workflows.json` when the dead permissions fixtures file was deleted
   (finding above). That file named the identifier in a STRING LITERAL, which
   `scripts/build-registries.mjs` counts as a citation; the workflow itself is very much built and
   runs in `PermissionsScreen.tsx`'s `confirmAssign`. It was deliberately NOT won back: that
   generator strips comments before collecting cited tokens, on its own stated ground that "a
   citation asks whether a screen NAMES the item, which a comment cannot answer", and spelling the
   identifier into rendered copy to recover the row would be manufacturing evidence and a §8.6.2
   violation besides. Correct under the rule as written; recorded here as a known limit of the
   measure. Census demonstrated-in-storyboard total moved 276 → 274.
10. **Two rendered strings outside this unit's five screens still carry build-process language** —
   `src/ui/demo/EvidencePanel.tsx` lines 110 and 119 both read "(out of Task 14 scope)". Same
   defect class as the final review's Important 5, but unit-01/Task-14-era code that this unit
   never touched; named here rather than fixed, since changing it lies outside this unit's scope
   and this was the last fix wave for unit 2 specifically.

## 8. What is simulated rather than real

No backend anywhere; no real authentication (any non-empty password authenticates any known email,
verified again at every sign-in this task performed); no real time; every write this task drove is
gone on reload (finding 6 above); Devices' "Enroll a device" flow accepts any free-text device
identifier with no hardware behind it; the site/area scope shown on a worker's own Scope tab is
descriptive of the seed's role-grant data, never enforced against a live session (finding 1 above).

## 9. Open items at this task's close

- Finding 1 (site/area scope) is architectural and out of this unit's own scope, carried to
  whichever future unit builds real session-construction wiring.
- Findings 2-4 are cosmetic/documentation and were judged non-blocking by their own tasks' reviewers
  already; this task did not re-open them.
- The tour-runner mechanism (finding 7) remains undriven in both units, named rather than closed.
- Findings 8-10 were added by the final whole-unit review: two are structural limits of the
  evidence apparatus rather than product defects (8, 9) and one is out-of-unit code named rather
  than touched (10).
- No completion language beyond what this record's evidence carries.
